const Order = require("../models/OrderModel");
const { getCart, clearCart } = require("./CartService");

async function createOrderFromCart(userId) {
  const cart = await getCart(userId);
  if (!cart.items.length) throw new Error("Your cart is empty");

  const items = cart.items.map((item) => ({
    foodId: item.foodId,
    nameSnapshot: item.name,
    priceSnapshot: item.price,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  }));
  const deliveryFee = 2;
  const order = await Order.create({ userId, items, subtotal: cart.subtotal, deliveryFee, total: cart.subtotal + deliveryFee });
  await clearCart(userId);
  return order;
}

async function listMyOrders(userId) {
  return Order.find({ userId }).sort({ createdAt: -1 }).limit(50);
}

module.exports = { createOrderFromCart, listMyOrders };
