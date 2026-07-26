const { runChatOrchestrator } = require("../agent/chatOrchestrator");
const { callTool } = require("../agent/mcpClient");
const { consumeConfirmation } = require("../agent/confirmation");
const { assertToolSuccess } = require("../agent/toolResults");

function bearer(req) {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
}

function safeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-6).filter((entry) =>
    entry && ["user", "assistant"].includes(entry.role) && typeof entry.text === "string"
  ).map((entry) => ({ role: entry.role, text: entry.text.slice(0, 600) }));
}

async function chat(req, res, next) {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!message || message.length > 600) return res.status(400).json({ message: "Message must be between 1 and 600 characters" });
    res.json(await runChatOrchestrator({
      message,
      history: safeHistory(req.body.history),
      workflowToken: typeof req.body.workflowToken === "string" ? req.body.workflowToken : undefined,
      token: bearer(req),
      auth: req.auth || null,
    }));
  } catch (error) {
    if (["CLASSIFIER_INVALID"].includes(error.code)) {
      return res.status(422).json({ message: "I didn’t understand that reliably. Could you rephrase your request?" });
    }
    if (error.code === "CLASSIFIER_RATE_LIMIT") {
      return res.status(429).json({ message: "Bean is handling too many requests right now. Please try again shortly." });
    }
    if (error.code === "CLASSIFIER_UNAVAILABLE") {
      return res.status(503).json({ message: "Bean’s language service is temporarily unavailable. Please try again." });
    }
    if (error.code === "MCP_UNAVAILABLE" || error.code === "MCP_TOOL_ERROR") {
      return res.status(503).json({ message: "I couldn’t reach the cafe data service. Please try again shortly." });
    }
    next(error);
  }
}

async function confirm(req, res, next) {
  try {
    if (!req.auth) return res.status(401).json({ message: "Please log in to confirm this action" });
    const { toolName, args } = consumeConfirmation(req.body.token, req.auth.userId);
    const data = assertToolSuccess(await callTool(bearer(req), toolName, args));
    const messages = {
      add_to_cart: "Added to your cart.",
      add_items_to_cart: "Added those items to your cart.",
      remove_from_cart: "Removed from your cart.",
      create_reservation: "Your table is reserved.",
      create_order_from_cart: "Your order has been placed.",
      admin_create_menu_item: "The menu item was created.",
      admin_set_menu_item_availability: "Availability was updated.",
      admin_archive_menu_item: "The menu item was archived.",
    };
    res.json({
      message: messages[toolName] || "Done.",
      toolActivity: [{ name: toolName, status: "completed" }],
      result: data,
      workflowToken: null,
      refreshCart: ["add_to_cart", "add_items_to_cart", "remove_from_cart", "create_order_from_cart"].includes(toolName),
    });
  } catch (error) {
    if (error.code === "MCP_TOOL_ERROR" || error.code === "MCP_UNAVAILABLE") {
      return res.status(503).json({ message: "The cafe data service couldn’t complete that action. Please try again." });
    }
    next(error);
  }
}

module.exports = { chat, confirm };
