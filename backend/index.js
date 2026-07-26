const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const cors = require("cors");
const { mongoose } = require("mongoose");

const app = express();

// Database connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log("Database Not Connected", err));

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://bakenbrew-cafe-website-frontend.onrender.com",
    credentials: true, // Allow cookies and authentication headers
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

app.use("/uploads", express.static("uploads"));

app.use(express.urlencoded({ extended: false }));

app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "degraded",
    database: connected ? "connected" : "disconnected",
  });
});

// Routes
app.use("/", require("./routes/AuthRoutes.js"));
app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/reservations", require("./routes/reservationRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 400).json({ message: err.message || "Request could not be completed" });
});

// Start Server
const port = process.env.PORT || 8000;
const server = app.listen(port, "0.0.0.0", () => console.log(`Server is running on port ${port}`));

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
