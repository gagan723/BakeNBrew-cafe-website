const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Authentication is required" });

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const legacyUser = payload.user?.user || payload.user;
    const userId = payload.userId || legacyUser?._id;

    if (!userId) return res.status(401).json({ message: "Invalid authentication token" });

    req.auth = { userId: String(userId), role: payload.role || legacyUser?.role || "user" };
    next();
  } catch {
    return res.status(403).json({ message: "Invalid or expired authentication token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.auth?.role !== "admin") return res.status(403).json({ message: "Admin access is required" });
  next();
}

module.exports = { requireAuth, requireAdmin };
