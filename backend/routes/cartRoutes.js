const express = require("express");
const { requireAuth } = require("../middleware/auth");
const controller = require("../controllers/cartController");

const router = express.Router();
router.use(requireAuth);
router.get("/", controller.getCart);
router.post("/items", controller.addItem);
router.patch("/items/:foodId", controller.updateItem);
router.delete("/items/:foodId", controller.removeItem);
module.exports = router;
