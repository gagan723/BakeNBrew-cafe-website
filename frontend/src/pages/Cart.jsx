import React, { useContext, useEffect } from "react";
import { UserContext } from "../../context/UserContext";
import Button from "../components/Button";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import { MdFastfood } from "react-icons/md";
import axiosInstance from "../utils/axiosInstance";

const Cart = ({ setShowLogin }) => {
  const { user } = useContext(UserContext);
  const { cartItems, removeFromCart, fetchCart, setCartItems } = useCart();

  useEffect(() => {
    if (!user && !localStorage.getItem("token")) setShowLogin(true);
  }, [user, setShowLogin]);

  useEffect(() => { fetchCart(); }, []);

  const subtotal = cartItems.reduce((total, item) => total + item.lineTotal, 0);
  const deliveryFee = cartItems.length ? 2 : 0;
  const total = subtotal + deliveryFee;

  const placeOrder = async () => {
    try {
      await axiosInstance.post("/api/orders");
      setCartItems([]);
      toast.success("Order placed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not place your order");
    }
  };

  if (!cartItems.length) {
    return (
      <div className="lg:mx-36 md:mx-8 mx-4 my-6 md:my-10 text-center lg:text-xl md:text-lg text-base font-Source py-10 text-secondary flex flex-col items-center gap-4">
        <MdFastfood className="lg:text-9xl md:text-8xl text-7xl text-primary" />
        <span className="max-w-md leading-relaxed">Nothing brewing in your cart yet! Explore our menu and fill it up with your favorites.</span>
      </div>
    );
  }

  return (
    <div className="lg:mx-36 md:mx-8 mx-4 my-6 md:my-10">
      <div className="hidden md:grid grid-cols-[80px_1fr_100px_100px_100px_80px] gap-4 items-center font-bold uppercase text-sm border-b py-3 text-secondary">
        <span>Item</span><span>Title</span><span>Price</span><span>Quantity</span><span>Total</span><span>Remove</span>
      </div>

      {cartItems.map((item) => (
        <div key={item.foodId} className="grid md:grid-cols-[80px_1fr_100px_100px_100px_80px] gap-4 items-center border-b py-4 font-Source">
          <img className="h-16 w-16 rounded-full object-cover" src={item.image} alt={item.name} />
          <div className="font-medium">{item.name}</div>
          <div>₹{item.price.toFixed(2)}</div>
          <div>Qty: {item.quantity}</div>
          <div>₹{item.lineTotal.toFixed(2)}</div>
          <button onClick={() => removeFromCart(item.foodId)} className="text-red-500 hover:text-red-700 text-sm font-medium" aria-label={`Remove ${item.name} from cart`}>Remove</button>
        </div>
      ))}

      <div className="my-8 md:my-12 lg:w-2/5 lg:ml-auto">
        <h2 className="font-bold text-lg md:text-2xl mb-4 font-Source text-text">Cart Totals</h2>
        <div className="space-y-3 font-Source">
          <div className="flex justify-between py-2 border-b"><span>Sub Total</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between py-2 border-b"><span>Delivery Fee</span><span>₹{deliveryFee.toFixed(2)}</span></div>
          <div className="flex justify-between py-2 font-bold text-lg"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
        </div>
        <Button onClick={placeOrder} className="w-full rounded-lg text-center py-2 font-medium mt-6">PLACE ORDER</Button>
      </div>
    </div>
  );
};

export default Cart;
