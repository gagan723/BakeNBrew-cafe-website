const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createOrder } = require("../controllers/orderController");

const router = express.Router();
router.post("/", requireAuth, createOrder);
module.exports = router;
