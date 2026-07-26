const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createOrder, listOrders } = require("../controllers/orderController");

const router = express.Router();
router.post("/", requireAuth, createOrder);
router.get("/me", requireAuth, listOrders);
module.exports = router;
