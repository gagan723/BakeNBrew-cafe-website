const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const usedNonces = new Map();
const WRITE_TOOLS = new Set([
  "add_to_cart", "add_items_to_cart", "remove_from_cart", "create_reservation", "create_order_from_cart",
  "admin_create_menu_item", "admin_set_menu_item_availability", "admin_archive_menu_item",
]);

function secret() {
  return process.env.CHAT_CONFIRMATION_SECRET || process.env.ACCESS_TOKEN_SECRET;
}

function createConfirmation({ userId, toolName, args }) {
  if (!userId || !WRITE_TOOLS.has(toolName)) throw new Error("This action cannot be confirmed");
  const nonce = crypto.randomUUID();
  const token = jwt.sign({ sub: userId, toolName, args, nonce, purpose: "chat-confirmation" }, secret(), { expiresIn: "5m" });
  usedNonces.set(nonce, Date.now() + 5 * 60_000);
  return token;
}

function consumeConfirmation(token, userId) {
  const payload = jwt.verify(token, secret());
  if (payload.purpose !== "chat-confirmation" || payload.sub !== userId || !WRITE_TOOLS.has(payload.toolName)) {
    throw new Error("This confirmation is invalid");
  }
  const expiresAt = usedNonces.get(payload.nonce);
  if (!expiresAt || expiresAt < Date.now()) throw new Error("This confirmation was already used or has expired");
  usedNonces.delete(payload.nonce);
  return { toolName: payload.toolName, args: payload.args };
}

module.exports = { WRITE_TOOLS, createConfirmation, consumeConfirmation };
