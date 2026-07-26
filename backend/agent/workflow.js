const jwt = require("jsonwebtoken");

function workflowSecret() {
  return process.env.CHAT_CONFIRMATION_SECRET || process.env.ACCESS_TOKEN_SECRET;
}

function actorKey(auth) {
  return auth?.userId || "anonymous";
}

function createWorkflowToken({ intent, collected = {}, auth }) {
  return jwt.sign(
    { purpose: "chat-workflow", intent, collected, actor: actorKey(auth) },
    workflowSecret(),
    { expiresIn: "15m" }
  );
}

function readWorkflowToken(token, auth) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, workflowSecret());
    if (payload.purpose !== "chat-workflow" || payload.actor !== actorKey(auth)) return null;
    return { intent: payload.intent, collected: payload.collected || {} };
  } catch {
    return null;
  }
}

module.exports = { createWorkflowToken, readWorkflowToken };
