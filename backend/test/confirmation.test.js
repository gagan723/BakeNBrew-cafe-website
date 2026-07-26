const test = require("node:test");
const assert = require("node:assert/strict");

process.env.ACCESS_TOKEN_SECRET = "test-secret-long-enough-for-confirmations";
const { createConfirmation, consumeConfirmation } = require("../agent/confirmation");

test("confirmation tokens are user-bound and one-time", () => {
  const token = createConfirmation({ userId: "user-1", toolName: "create_order_from_cart", args: {} });
  assert.throws(() => consumeConfirmation(token, "user-2"), /invalid/i);
  assert.deepEqual(consumeConfirmation(token, "user-1"), { toolName: "create_order_from_cart", args: {} });
  assert.throws(() => consumeConfirmation(token, "user-1"), /already used|expired/i);
});

test("read tools cannot be placed in confirmation tokens", () => {
  assert.throws(() => createConfirmation({ userId: "user-1", toolName: "get_cart", args: {} }), /cannot be confirmed/i);
});

test("a multi-item cart write can be confirmed as one action", () => {
  const args = { items: [{ foodId: "67ed579b7d1d0a0074dc33b7", quantity: 2 }] };
  const token = createConfirmation({ userId: "user-1", toolName: "add_items_to_cart", args });
  assert.deepEqual(consumeConfirmation(token, "user-1"), { toolName: "add_items_to_cart", args });
});
