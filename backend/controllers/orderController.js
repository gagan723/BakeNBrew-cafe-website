const { createOrderFromCart } = require("../services/OrderService");

async function createOrder(req, res, next) {
  try {
    const order = await createOrderFromCart(req.auth.userId);
    res.status(201).json({ message: "Order created", order });
  } catch (error) { next(error); }
}

module.exports = { createOrder };
