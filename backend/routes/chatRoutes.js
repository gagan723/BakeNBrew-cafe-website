const express = require("express");
const jwt = require("jsonwebtoken");
const { chat, confirm } = require("../controllers/chatController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const payload = jwt.verify(header.slice(7), process.env.ACCESS_TOKEN_SECRET);
    const legacy = payload.user?.user || payload.user;
    const userId = payload.userId || legacy?._id;
    if (userId) req.auth = { userId: String(userId), role: payload.role || legacy?.role || "user" };
  } catch {}
  next();
}
router.post("/", optionalAuth, chat);
router.post("/confirm", requireAuth, confirm);
module.exports = router;
