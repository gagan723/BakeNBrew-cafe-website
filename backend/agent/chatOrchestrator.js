const { classifyMessage } = require("./groqClassifier");
const { callTool } = require("./mcpClient");
const { createConfirmation } = require("./confirmation");
const { createWorkflowToken, readWorkflowToken } = require("./workflow");
const { assertToolSuccess } = require("./toolResults");

const REQUIRED_FIELDS = {
  add_to_cart: ["itemName", "quantity"],
  remove_from_cart: ["itemName"],
  check_reservation_availability: ["partySize", "date", "time"],
  create_reservation: ["partySize", "date", "time"],
  admin_create_menu_item: ["name", "description", "price", "category", "image"],
  admin_set_menu_item_availability: ["itemName", "isAvailable"],
  admin_archive_menu_item: ["itemName"],
};

const PROTECTED_INTENTS = new Set([
  "get_cart", "add_to_cart", "remove_from_cart", "check_reservation_availability",
  "create_reservation", "list_my_reservations", "create_order_from_cart", "list_my_orders",
  "admin_create_menu_item", "admin_set_menu_item_availability", "admin_archive_menu_item",
]);

const ADMIN_INTENTS = new Set([
  "admin_create_menu_item", "admin_set_menu_item_availability", "admin_archive_menu_item",
]);

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

function numberFrom(value) {
  if (!value) return undefined;
  return /^\d+$/.test(value) ? Number(value) : NUMBER_WORDS[value.toLowerCase()];
}

function indiaDateOffset(days) {
  const indiaNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  indiaNow.setDate(indiaNow.getDate() + days);
  return [
    indiaNow.getFullYear(),
    String(indiaNow.getMonth() + 1).padStart(2, "0"),
    String(indiaNow.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeTime(hoursText, minutesText, meridiem) {
  let hours = Number(hoursText);
  const minutes = Number(minutesText || 0);
  if (meridiem) {
    const period = meridiem.toLowerCase();
    if (period === "pm" && hours < 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;
  }
  if (hours > 23 || minutes > 59) return undefined;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function cleanItemPhrase(value) {
  if (!value) return undefined;
  const cleaned = value
    .replace(/^[@#*.,\s]+/, "")
    .replace(/\b(?:coffee|drink|beverage|item|please)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || undefined;
}

function extractLocalEntities(message) {
  const entities = {};
  const party = message.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:guests?|people|persons?)\b/i)
    || message.match(/\b(?:for|party of)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i);
  if (party) entities.partySize = numberFrom(party[1]);

  if (/\btomorrow\b/i.test(message)) entities.date = indiaDateOffset(1);
  else if (/\btoday\b/i.test(message)) entities.date = indiaDateOffset(0);
  else {
    const isoDate = message.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (isoDate) entities.date = isoDate[1];
  }

  const time = message.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
    || message.match(/\b(\d{1,2}):(\d{2})\b/);
  if (time) entities.time = normalizeTime(time[1], time[2], time[3]);

  const cartAdd = message.match(/\badd\s+(?:(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+)?(.+?)\s+(?:to|into)\s+(?:my\s+)?cart\b/i);
  if (cartAdd) {
    const quantity = numberFrom(cartAdd[1]);
    if (quantity) entities.quantity = quantity;
    entities.itemName = cleanItemPhrase(cartAdd[2]);
    const fullBody = `${cartAdd[1] ? `${cartAdd[1]} ` : ""}${cartAdd[2]}`;
    const parts = fullBody.split(/\s*(?:,|\band\b)\s*/i).filter(Boolean);
    const items = parts.map((part) => {
      const match = part.trim().match(/^(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)$/i);
      return match ? { quantity: numberFrom(match[1]), itemName: cleanItemPhrase(match[2]) } : null;
    }).filter((item) => item?.quantity && item?.itemName);
    if (items.length > 1) {
      entities.items = items;
      delete entities.quantity;
      delete entities.itemName;
    }
  }
  const cartRemove = message.match(/\bremove\s+(.+?)\s+from\s+(?:my\s+)?cart\b/i);
  if (cartRemove) entities.itemName = cleanItemPhrase(cartRemove[1]);
  return entities;
}

function deterministicIntent(message, fallbackIntent) {
  if (/\badd\b.+\b(?:to|into)\s+(?:my\s+)?cart\b/i.test(message)) return "add_to_cart";
  if (/\bremove\b.+\bfrom\s+(?:my\s+)?cart\b/i.test(message)) return "remove_from_cart";
  if (/\b(?:order|place|checkout|buy)\b.*\b(?:cart|items?)\b/i.test(message)) return "create_order_from_cart";
  return fallbackIntent;
}

function cleanEntities(entities = {}) {
  const cleaned = {};
  for (const [key, value] of Object.entries(entities)) {
    if (value !== null && value !== undefined && value !== "") cleaned[key] = value;
  }
  if (cleaned.quantity !== undefined) cleaned.quantity = Number(cleaned.quantity);
  if (cleaned.partySize !== undefined) cleaned.partySize = Number(cleaned.partySize);
  if (cleaned.price !== undefined) cleaned.price = Number(cleaned.price);
  return cleaned;
}

function missingFields(intent, entities) {
  return (REQUIRED_FIELDS[intent] || []).filter((field) => {
    const value = entities[field];
    return value === undefined || value === null || value === "";
  });
}

function missingQuestion(fields) {
  const labels = {
    itemName: "Which menu item would you like?",
    quantity: "How many would you like?",
    partySize: "How many guests should I reserve for?",
    date: "What date would you like?",
    time: "What time would you like?",
    name: "What should the menu item be called?",
    description: "What description should it have?",
    price: "What price should it have?",
    category: "Which category should it be in?",
    image: "What public image URL should it use?",
    isAvailable: "Should the item be available or unavailable?",
  };
  if (fields.length === 1) return labels[fields[0]] || "Could you provide the missing detail?";
  if (fields.includes("partySize") && fields.includes("date") && fields.includes("time")) {
    return "How many guests, and what date and time would you like?";
  }
  if (fields.includes("date") && fields.includes("time")) return "What date and time would you like?";
  if (fields.includes("partySize") && fields.includes("time")) return "How many guests, and what time would you like?";
  return fields.map((field) => labels[field]?.replace(/[?.]$/, "").toLowerCase()).filter(Boolean).join(", ").replace(/^/, "Please provide ");
}

function activity(name, status = "completed") {
  return [{ name, status }];
}

function pendingResponse({ auth, toolName, args, label, priorActivity = [] }) {
  return {
    message: "I’m ready to do that after you confirm.",
    toolActivity: [...priorActivity, { name: toolName, status: "awaiting_confirmation" }],
    pendingAction: {
      label,
      token: createConfirmation({ userId: auth.userId, toolName, args }),
    },
  };
}

async function execute(token, name, args = {}) {
  try {
    return assertToolSuccess(await callTool(token, name, args));
  } catch (error) {
    if (error.code === "MCP_TOOL_ERROR") throw error;
    const unavailable = new Error("The cafe data service is temporarily unavailable");
    unavailable.code = "MCP_UNAVAILABLE";
    throw unavailable;
  }
}

async function resolveMenuItem(token, itemName) {
  const normalizedName = cleanItemPhrase(String(itemName)) || String(itemName).trim();
  const items = await execute(token, "search_menu", { query: normalizedName, availableOnly: true });
  const list = Array.isArray(items) ? items : [];
  const normalized = normalizedName.toLowerCase();
  const exact = list.filter((item) => cleanItemPhrase(String(item.name))?.toLowerCase() === normalized);
  if (exact.length === 1) return { item: exact[0], items: list };
  if (list.length === 1) return { item: list[0], items: list };
  return { item: null, items: list.slice(0, 5) };
}

function menuSummary(items) {
  if (!items.length) return "I couldn’t find a matching menu item.";
  return items.slice(0, 6).map((item) =>
    `${item.name} — ₹${item.price}${item.isAvailable === false ? " (unavailable)" : ""}`
  ).join("\n");
}

function cartSummary(cart) {
  if (!cart.items?.length) return "Your cart is empty.";
  return `${cart.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}. Subtotal: ₹${cart.subtotal}.`;
}

function formatCafeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

function orderConfirmationLabel(cart) {
  const deliveryFee = 2;
  const subtotal = Number(cart.subtotal || 0);
  const items = cart.items.map((item) => `${item.quantity}× ${item.name}`).join(", ");
  return `Place order for ${items}? Subtotal ₹${subtotal.toFixed(2)} + delivery ₹${deliveryFee.toFixed(2)} = total ₹${(subtotal + deliveryFee).toFixed(2)}.`;
}

function reservationListSummary(reservations) {
  if (!Array.isArray(reservations) || !reservations.length) return "You have no upcoming reservations.";
  return reservations.slice(0, 5).map((reservation) => {
    const when = formatCafeDate(reservation.startAt);
    const table = reservation.tableId?.tableNumber || reservation.tableId?.id || "assigned table";
    return `${when} for ${reservation.partySize} guests — ${table}`;
  }).join("\n");
}

function reservationTimeError(time) {
  const match = String(time || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) return "Please provide a valid reservation time, such as 17:00 or 5 PM.";
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  const opens = 9 * 60;
  const latestStart = 20 * 60 + 30;
  if (minutes < opens || minutes > latestStart) {
    return "Reservations can start between 9:00 AM and 8:30 PM so the 90-minute booking finishes before closing.";
  }
  return null;
}

async function runChatOrchestrator({ message, workflowToken, token, auth }) {
  const activeWorkflow = readWorkflowToken(workflowToken, auth);
  const classification = await classifyMessage({ message, workflow: activeWorkflow });
  if (classification.intent === "cancel") {
    return { message: "No problem — I cancelled that request.", toolActivity: [], workflowToken: null };
  }
  if (classification.confidence < 0.45 && !activeWorkflow) {
    return { message: "I’m not sure what you’d like me to do. You can ask about the menu, cart, reservations, or orders.", toolActivity: [] };
  }

  const localEntities = extractLocalEntities(message);
  let intent = activeWorkflow && classification.intent === "clarification"
    ? activeWorkflow.intent
    : classification.intent;
  intent = deterministicIntent(message, intent);
  const entities = {
    ...(activeWorkflow?.intent === intent ? activeWorkflow.collected : {}),
    ...cleanEntities(classification.entities),
    ...localEntities,
  };

  if (intent === "clarification") {
    return { message: "Could you tell me whether you need help with the menu, cart, reservation, or order?", toolActivity: [] };
  }
  if (intent === "out_of_scope") {
    return { message: "I’m focused on Bake N Brew’s menu, cart, reservations, and orders. What can I help you with there?", toolActivity: [] };
  }
  if (PROTECTED_INTENTS.has(intent) && !auth) {
    return { message: "Please log in so I can access or change your cafe account.", toolActivity: [], authRequired: true };
  }
  if (ADMIN_INTENTS.has(intent) && auth?.role !== "admin") {
    return { message: "That menu-management action requires an admin account.", toolActivity: [] };
  }

  const missing = intent === "add_to_cart" && entities.items?.length
    ? []
    : missingFields(intent, entities);
  if (missing.length) {
    return {
      message: missingQuestion(missing),
      toolActivity: [],
      workflowToken: createWorkflowToken({ intent, collected: entities, auth }),
    };
  }

  switch (intent) {
    case "search_menu": {
      const searchText = entities.query || entities.itemName || undefined;
      let items = await execute(token, "search_menu", {
        query: entities.category ? undefined : searchText,
        category: entities.category || undefined,
        availableOnly: true,
      });
      if ((!Array.isArray(items) || !items.length) && searchText && !entities.category) {
        items = await execute(token, "search_menu", {
          category: searchText,
          availableOnly: true,
        });
      }
      return { message: menuSummary(Array.isArray(items) ? items : []), toolActivity: activity("search_menu") };
    }
    case "get_cart": {
      const cart = await execute(token, "get_cart");
      return { message: cartSummary(cart), toolActivity: activity("get_cart"), result: cart };
    }
    case "add_to_cart":
    case "remove_from_cart": {
      if (intent === "add_to_cart" && entities.items?.length) {
        const resolvedItems = [];
        for (const requested of entities.items) {
          const resolved = await resolveMenuItem(token, requested.itemName);
          if (!resolved.item) {
            return {
              message: resolved.items.length
                ? `I found several matches for ${requested.itemName}: ${resolved.items.map((item) => item.name).join(", ")}. Please add that item separately with its full name.`
                : `I couldn’t find ${requested.itemName} on the available menu.`,
              toolActivity: activity("search_menu"),
            };
          }
          resolvedItems.push({
            foodId: String(resolved.item.id || resolved.item._id),
            quantity: requested.quantity,
            name: resolved.item.name,
          });
        }
        return pendingResponse({
          auth,
          toolName: "add_items_to_cart",
          args: { items: resolvedItems.map(({ foodId, quantity }) => ({ foodId, quantity })) },
          label: `Add ${resolvedItems.map((item) => `${item.quantity}× ${item.name}`).join(" and ")} to your cart?`,
          priorActivity: activity("search_menu"),
        });
      }
      const resolved = await resolveMenuItem(token, entities.itemName);
      if (!resolved.item) {
        if (!resolved.items.length) return { message: "I couldn’t find that item on the available menu.", toolActivity: activity("search_menu") };
        return {
          message: `I found several matches: ${resolved.items.map((item) => item.name).join(", ")}. Which one did you mean?`,
          toolActivity: activity("search_menu"),
          workflowToken: createWorkflowToken({ intent, collected: { ...entities, itemName: undefined }, auth }),
        };
      }
      const foodId = String(resolved.item.id || resolved.item._id);
      const priorActivity = activity("search_menu");
      if (intent === "add_to_cart") {
        return pendingResponse({
          auth, toolName: "add_to_cart", args: { foodId, quantity: entities.quantity },
          label: `Add ${entities.quantity}× ${resolved.item.name} to your cart?`, priorActivity,
        });
      }
      return pendingResponse({
        auth, toolName: "remove_from_cart", args: { foodId },
        label: `Remove ${resolved.item.name} from your cart?`, priorActivity,
      });
    }
    case "check_reservation_availability":
    case "create_reservation": {
      const timeError = reservationTimeError(entities.time);
      if (timeError) {
        return {
          message: timeError,
          toolActivity: [],
          workflowToken: createWorkflowToken({
            intent,
            collected: { ...entities, time: undefined },
            auth,
          }),
        };
      }
      const args = { partySize: entities.partySize, date: entities.date, time: entities.time };
      const availability = await execute(token, "check_reservation_availability", args);
      if (!availability.available || !availability.tables?.length) {
        return { message: "Sorry, no suitable table is available then. Would you like to try another time?", toolActivity: activity("check_reservation_availability") };
      }
      const when = new Date(availability.startAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      if (intent === "check_reservation_availability") {
        return { message: `Yes, a table is available for ${entities.partySize} guests at ${when}.`, toolActivity: activity("check_reservation_availability"), result: availability };
      }
      return pendingResponse({
        auth,
        toolName: "create_reservation",
        args: { ...args, tableId: String(availability.tables[0].id || availability.tables[0]._id) },
        label: `Reserve a table for ${entities.partySize} guests on ${entities.date} at ${entities.time}?`,
        priorActivity: activity("check_reservation_availability"),
      });
    }
    case "list_my_reservations": {
      const reservations = await execute(token, "list_my_reservations");
      return { message: reservationListSummary(reservations), toolActivity: activity("list_my_reservations"), result: reservations };
    }
    case "create_order_from_cart": {
      const cart = await execute(token, "get_cart");
      if (!cart.items?.length) {
        return { message: "Your cart is empty, so there’s nothing to order yet.", toolActivity: activity("get_cart"), result: cart };
      }
      return pendingResponse({
        auth,
        toolName: intent,
        args: {},
        label: orderConfirmationLabel(cart),
        priorActivity: activity("get_cart"),
      });
    }
    case "list_my_orders": {
      const orders = await execute(token, "list_my_orders");
      if (!Array.isArray(orders) || !orders.length) {
        return { message: "You have no previous orders.", toolActivity: activity("list_my_orders"), result: [] };
      }
      const message = orders.slice(0, 5).map((order) => {
        const when = formatCafeDate(order.createdAt);
        return `${when} — ${order.items?.map((item) => `${item.quantity}× ${item.nameSnapshot}`).join(", ")} — ₹${order.total}`;
      }).join("\n");
      return { message, toolActivity: activity("list_my_orders"), result: orders };
    }
    case "admin_create_menu_item":
      return pendingResponse({ auth, toolName: intent, args: entities, label: `Create the menu item “${entities.name}”?` });
    case "admin_set_menu_item_availability":
    case "admin_archive_menu_item": {
      const resolved = await resolveMenuItem(token, entities.itemName);
      if (!resolved.item) {
        return {
          message: resolved.items.length
            ? `I found several matches: ${resolved.items.map((item) => item.name).join(", ")}. Which one did you mean?`
            : "I couldn’t find that menu item.",
          toolActivity: activity("search_menu"),
          workflowToken: resolved.items.length ? createWorkflowToken({ intent, collected: { ...entities, itemName: undefined }, auth }) : undefined,
        };
      }
      const foodId = String(resolved.item.id || resolved.item._id);
      if (intent === "admin_archive_menu_item") {
        return pendingResponse({ auth, toolName: intent, args: { foodId }, label: `Archive ${resolved.item.name}?`, priorActivity: activity("search_menu") });
      }
      return pendingResponse({
        auth, toolName: intent, args: { foodId, isAvailable: entities.isAvailable },
        label: `Mark ${resolved.item.name} as ${entities.isAvailable ? "available" : "unavailable"}?`,
        priorActivity: activity("search_menu"),
      });
    }
    default:
      return { message: "I can help with the menu, your cart, reservations, and orders.", toolActivity: [] };
  }
}

module.exports = {
  runChatOrchestrator, missingFields, missingQuestion, resolveMenuItem,
  menuSummary, cartSummary, extractLocalEntities, cleanItemPhrase,
  reservationTimeError, deterministicIntent, orderConfirmationLabel,
  formatCafeDate, REQUIRED_FIELDS,
};
