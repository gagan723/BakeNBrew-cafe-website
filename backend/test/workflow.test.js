const test = require("node:test");
const assert = require("node:assert/strict");

process.env.ACCESS_TOKEN_SECRET = "workflow-test-secret";
process.env.CHAT_CONFIRMATION_SECRET = "workflow-confirmation-secret";

const { createWorkflowToken, readWorkflowToken } = require("../agent/workflow");
const { missingFields, missingQuestion, menuSummary, cartSummary, extractLocalEntities, cleanItemPhrase, reservationTimeError, deterministicIntent, orderConfirmationLabel, formatCafeDate } = require("../agent/chatOrchestrator");
const { validateClassification, groundEntities, INTENTS } = require("../agent/groqClassifier");
const { toolData } = require("../agent/toolResults");

test("workflow tokens preserve collected fields and bind to the user", () => {
  const auth = { userId: "user-1", role: "user" };
  const token = createWorkflowToken({
    intent: "create_reservation",
    collected: { partySize: 2, date: "2030-01-01" },
    auth,
  });
  assert.deepEqual(readWorkflowToken(token, auth), {
    intent: "create_reservation",
    collected: { partySize: 2, date: "2030-01-01" },
  });
  assert.equal(readWorkflowToken(token, { userId: "user-2", role: "user" }), null);
  assert.equal(readWorkflowToken(`${token}altered`, auth), null);
});

test("reservation workflow calculates missing fields deterministically", () => {
  assert.deepEqual(
    missingFields("create_reservation", { partySize: 2, date: "2030-01-01" }),
    ["time"]
  );
  assert.match(missingQuestion(["partySize", "time"]), /guests.*time/i);
});

test("classifier validation accepts all supported intents and rejects unknown ones", () => {
  for (const intent of INTENTS) {
    assert.equal(validateClassification({ intent, entities: {}, missingFields: [], confidence: 0.8 }).intent, intent);
  }
  assert.throws(
    () => validateClassification({ intent: "delete_database", entities: {}, confidence: 1 }),
    /invalid response/i
  );
});

test("hallucinated classifier entities are discarded unless grounded in the message", () => {
  assert.deepEqual(
    groundEntities("Help me reserve a table", { partySize: 4, date: "2030-01-01", time: "18:00" }),
    {}
  );
  assert.deepEqual(
    groundEntities("Reserve for two tomorrow at 7 PM", { partySize: 2, date: "2030-01-01", time: "19:00" }),
    { partySize: 2, date: "2030-01-01", time: "19:00" }
  );
});

test("MCP structured result wrappers are normalized", () => {
  assert.deepEqual(toolData({ structuredContent: { result: [{ name: "Americano" }] } }), [{ name: "Americano" }]);
  assert.match(menuSummary([{ name: "Americano", price: 180 }]), /Americano/);
  assert.match(cartSummary({ items: [{ name: "Americano", quantity: 2 }], subtotal: 360 }), /360/);
});

test("common reservation and cart entities are recovered from the original message", () => {
  const reservation = extractLocalEntities("2 guests for tomorrow 5pm");
  assert.equal(reservation.partySize, 2);
  assert.match(reservation.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(reservation.time, "17:00");

  assert.deepEqual(extractLocalEntities("add 2 Americano coffee to my cart"), {
    quantity: 2,
    itemName: "Americano",
  });
  assert.deepEqual(extractLocalEntities("add @ Americano coffee to my cart"), {
    itemName: "Americano",
  });
  assert.equal(cleanItemPhrase("  @ Americano coffee "), "Americano");

  assert.deepEqual(extractLocalEntities("add 2 latte and 1 americano to my cart"), {
    items: [
      { quantity: 2, itemName: "latte" },
      { quantity: 1, itemName: "americano" },
    ],
  });
});

test("reservation hours reject midnight and preserve valid evening times", () => {
  assert.match(reservationTimeError("00:00"), /9:00 AM.*8:30 PM/);
  assert.equal(reservationTimeError("17:00"), null);
  assert.match(reservationTimeError("21:00"), /9:00 AM.*8:30 PM/);
});

test("explicit order wording overrides a read-cart classification", () => {
  assert.equal(deterministicIntent("order the items in my cart", "get_cart"), "create_order_from_cart");
  assert.equal(deterministicIntent("checkout my cart", "get_cart"), "create_order_from_cart");
});

test("order confirmation lists quantities, subtotal, delivery, and total", () => {
  const label = orderConfirmationLabel({
    items: [
      { name: "Latte", quantity: 2 },
      { name: "Americano", quantity: 1 },
    ],
    subtotal: 500,
  });
  assert.match(label, /2× Latte, 1× Americano/);
  assert.match(label, /Subtotal ₹500\.00/);
  assert.match(label, /delivery ₹2\.00/);
  assert.match(label, /total ₹502\.00/);
});

test("missing timestamps never render as Invalid Date", () => {
  assert.equal(formatCafeDate(undefined), "Date unavailable");
  assert.notEqual(formatCafeDate("2026-07-27T12:00:00.000Z"), "Date unavailable");
});
