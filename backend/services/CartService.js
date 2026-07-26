const Cart = require("../models/CartModel");
const Food = require("../models/FoodModel");

async function getCart(userId) {
  const cart = await Cart.findOne({ userId }).populate("items.foodId");
  if (!cart) return { items: [], subtotal: 0 };

  const items = cart.items
    .filter((item) => item.foodId && !item.foodId.isArchived)
    .map((item) => ({
      foodId: item.foodId._id,
      name: item.foodId.name,
      image: item.foodId.image,
      price: item.foodId.price,
      quantity: item.quantity,
      lineTotal: item.foodId.price * item.quantity,
    }));
  return { items, subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0) };
}

async function addItem(userId, foodId, quantity) {
  const food = await Food.findOne({ _id: foodId, isArchived: { $ne: true }, isAvailable: { $ne: false } });
  if (!food) throw new Error("That menu item is unavailable");

  const cart = (await Cart.findOne({ userId })) || new Cart({ userId, items: [] });
  const item = cart.items.find((cartItem) => String(cartItem.foodId) === String(foodId));
  if (item) item.quantity = Math.min(item.quantity + quantity, 20);
  else cart.items.push({ foodId, quantity });
  await cart.save();
  return getCart(userId);
}

async function addItems(userId, requestedItems) {
  if (!Array.isArray(requestedItems) || !requestedItems.length) throw new Error("At least one cart item is required");
  const foodIds = requestedItems.map((item) => item.foodId);
  const foods = await Food.find({
    _id: { $in: foodIds },
    isArchived: { $ne: true },
    isAvailable: { $ne: false },
  });
  const foodById = new Map(foods.map((food) => [String(food._id), food]));
  if (foodById.size !== new Set(foodIds.map(String)).size) throw new Error("One or more menu items are unavailable");

  const cart = (await Cart.findOne({ userId })) || new Cart({ userId, items: [] });
  for (const requested of requestedItems) {
    const quantity = Number(requested.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error("Each quantity must be between 1 and 20");
    const item = cart.items.find((cartItem) => String(cartItem.foodId) === String(requested.foodId));
    if (item) item.quantity = Math.min(item.quantity + quantity, 20);
    else cart.items.push({ foodId: requested.foodId, quantity });
  }
  await cart.save();
  return getCart(userId);
}

async function updateItem(userId, foodId, quantity) {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error("Cart not found");
  const item = cart.items.find((cartItem) => String(cartItem.foodId) === String(foodId));
  if (!item) throw new Error("Item is not in the cart");
  item.quantity = quantity;
  await cart.save();
  return getCart(userId);
}

async function removeItem(userId, foodId) {
  const cart = await Cart.findOne({ userId });
  if (!cart) return getCart(userId);
  cart.items = cart.items.filter((item) => String(item.foodId) !== String(foodId));
  await cart.save();
  return getCart(userId);
}

async function clearCart(userId) {
  await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });
}

module.exports = { getCart, addItem, addItems, updateItem, removeItem, clearCart };
