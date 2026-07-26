const CartService = require("../services/CartService");

function validQuantity(quantity) {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 20;
}

async function getCart(req, res, next) {
  try { res.json(await CartService.getCart(req.auth.userId)); } catch (error) { next(error); }
}

async function addItem(req, res, next) {
  try {
    const { foodId, quantity } = req.body;
    if (!foodId || !validQuantity(quantity)) return res.status(400).json({ message: "A menu item and quantity between 1 and 20 are required" });
    res.status(201).json(await CartService.addItem(req.auth.userId, foodId, quantity));
  } catch (error) { next(error); }
}

async function updateItem(req, res, next) {
  try {
    const { quantity } = req.body;
    if (!validQuantity(quantity)) return res.status(400).json({ message: "Quantity must be between 1 and 20" });
    res.json(await CartService.updateItem(req.auth.userId, req.params.foodId, quantity));
  } catch (error) { next(error); }
}

async function removeItem(req, res, next) {
  try { res.json(await CartService.removeItem(req.auth.userId, req.params.foodId)); } catch (error) { next(error); }
}

module.exports = { getCart, addItem, updateItem, removeItem };
