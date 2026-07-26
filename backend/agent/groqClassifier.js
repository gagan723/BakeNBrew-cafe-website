const INTENTS = [
  "search_menu", "get_cart", "add_to_cart", "remove_from_cart",
  "check_reservation_availability", "create_reservation", "list_my_reservations",
  "create_order_from_cart", "list_my_orders", "admin_create_menu_item",
  "admin_set_menu_item_availability", "admin_archive_menu_item",
  "cancel", "clarification", "out_of_scope",
];

const entityProperties = {
  query: { type: "string" },
  itemName: { type: "string" },
  quantity: { type: "integer" },
  partySize: { type: "integer" },
  date: { type: "string", description: "YYYY-MM-DD in Asia/Kolkata" },
  time: { type: "string", description: "24-hour HH:mm" },
  tableId: { type: "string" },
  name: { type: "string" },
  description: { type: "string" },
  price: { type: "number" },
  category: { type: "string" },
  image: { type: "string" },
  isAvailable: { type: "boolean" },
};

const classifierTool = {
  type: "function",
  function: {
    name: "classify_cafe_request",
    description: "Classify one Bake N Brew cafe message and extract explicitly supplied entities.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["intent"],
      properties: {
        intent: { type: "string", enum: INTENTS },
        ...entityProperties,
        missingFields: { type: "array", items: { type: "string" } },
        confidence: { type: "number", minimum: 0, maximum: 1 },
      },
    },
  },
};

function indiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

function messageSupportsNumber(message, value) {
  const lower = message.toLowerCase();
  if (new RegExp(`\\b${Number(value)}\\b`).test(lower)) return true;
  return Object.entries(NUMBER_WORDS).some(([word, number]) => number === Number(value) && new RegExp(`\\b${word}\\b`).test(lower));
}

function groundEntities(message, entities) {
  if (!message) return entities;
  const lower = message.toLowerCase();
  const grounded = { ...entities };
  if (grounded.quantity !== undefined && !messageSupportsNumber(message, grounded.quantity)) delete grounded.quantity;
  if (grounded.partySize !== undefined && !messageSupportsNumber(message, grounded.partySize)) delete grounded.partySize;
  if (grounded.price !== undefined && !messageSupportsNumber(message, grounded.price)) delete grounded.price;
  if (grounded.itemName && !lower.includes(String(grounded.itemName).toLowerCase())) delete grounded.itemName;
  if (grounded.date && !/(\btoday\b|\btomorrow\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b|\b(?:mon|tues|wednes|thurs|fri|satur|sun)day\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i.test(message)) delete grounded.date;
  if (grounded.time && !/(\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b\d{1,2}:\d{2}\b|\bnoon\b|\bmidnight\b)/i.test(message)) delete grounded.time;
  if (grounded.isAvailable !== undefined && !/\b(available|unavailable|availability|sold out|in stock|out of stock)\b/i.test(message)) delete grounded.isAvailable;
  return grounded;
}

function validateClassification(value, sourceMessage) {
  if (!value || !INTENTS.includes(value.intent)) {
    const error = new Error("The intent classifier returned an invalid response");
    error.code = "CLASSIFIER_INVALID";
    throw error;
  }
  const confidence = value.confidence === undefined ? 0.7 : Number(value.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    const error = new Error("The intent classifier returned an invalid confidence");
    error.code = "CLASSIFIER_INVALID";
    throw error;
  }
  const entities = {};
  for (const key of Object.keys(entityProperties)) {
    const item = value.entities?.[key] ?? value[key];
    if (item !== null && item !== undefined && item !== "") entities[key] = item;
  }
  return {
    intent: value.intent,
    entities: groundEntities(sourceMessage, entities),
    missingFields: Array.isArray(value.missingFields) ? value.missingFields.filter((item) => typeof item === "string") : [],
    confidence,
  };
}

async function classifyMessage({ message, workflow }) {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error("The cafe assistant is not configured yet. Add GROQ_API_KEY to backend/.env.");
    error.code = "CLASSIFIER_CONFIG";
    error.status = 503;
    throw error;
  }
  const { default: Groq } = await import("groq-sdk");
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const workflowContext = workflow
    ? `An active workflow exists: ${JSON.stringify(workflow)}. Treat the message as supplying or correcting fields for that workflow unless the user clearly cancels or starts a different request.`
    : "There is no active workflow.";
  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      temperature: 0.01,
      max_completion_tokens: 220,
      messages: [
        {
          role: "system",
          content: `You classify requests for Bake N Brew cafe. Today is ${indiaDate()} in Asia/Kolkata.
Extract only information stated or unambiguously implied. Convert today/tomorrow to YYYY-MM-DD and times to HH:mm.
Use create_reservation when the user asks to book; use check_reservation_availability when they only ask whether a table is free.
Use clarification when the message only answers an active workflow. Use out_of_scope for requests unrelated to the cafe.
Do not answer the user and do not call any tool except classify_cafe_request. ${workflowContext}`,
        },
        { role: "user", content: message },
      ],
      tools: [classifierTool],
      tool_choice: { type: "function", function: { name: "classify_cafe_request" } },
    });
    const call = completion.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw Object.assign(new Error("No classification was returned"), { code: "CLASSIFIER_INVALID" });
    return validateClassification(JSON.parse(call.function.arguments), message);
  } catch (error) {
    if (error.code === "CLASSIFIER_INVALID" || error instanceof SyntaxError) {
      const invalid = new Error("The intent classifier returned an invalid response");
      invalid.code = "CLASSIFIER_INVALID";
      throw invalid;
    }
    if (error.status === 429 || error.code === "rate_limit_exceeded") {
      const limited = new Error("Bean is handling too many requests right now. Please try again shortly.");
      limited.code = "CLASSIFIER_RATE_LIMIT";
      limited.status = 429;
      throw limited;
    }
    const unavailable = new Error("Bean’s language service is temporarily unavailable. Please try again.");
    unavailable.code = "CLASSIFIER_UNAVAILABLE";
    unavailable.status = 503;
    unavailable.cause = error;
    throw unavailable;
  }
}

module.exports = { classifyMessage, validateClassification, groundEntities, INTENTS, classifierTool };
