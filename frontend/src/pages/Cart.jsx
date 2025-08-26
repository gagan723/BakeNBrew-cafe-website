import React, { useContext, useEffect } from "react";
import { UserContext } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import { MdFastfood } from "react-icons/md";

const Cart = ({ setShowLogin }) => {
	const { user } = useContext(UserContext);
	const navigate = useNavigate();
	const { cartItems, removeFromCart, fetchCart, clearCart } = useCart();

	useEffect(() => {
		if (!user && !localStorage.getItem("token")) {
			setShowLogin(true);
		}
	}, [user, navigate]);

	useEffect(() => {
		fetchCart();
	}, []);

	const subtotal = cartItems.reduce(
		(total, item) => total + item.price * item.quantity,
		0
	);

	const deliveryFee = 2;
	const total = subtotal + deliveryFee;

	return (
		<div className="lg:mx-36 md:mx-8 mx-4 my-6 md:my-10">
			<div className="flex flex-col">
				{cartItems.length <= 0 ? (
					<div className="text-center lg:text-xl md:text-lg text-base font-Source py-10 text-secondary flex flex-col items-center gap-4">
						<MdFastfood className="lg:text-9xl md:text-8xl text-7xl text-primary" />
						<span className="max-w-md leading-relaxed">
							Nothing brewing in your cart yet! Explore our menu and fill it up with your favorites.
						</span>
					</div>
				) : (
					<div className="overflow-hidden">
						{/* Desktop Table Headers - Hidden on mobile */}
						<div className="hidden md:flex justify-between items-center font-bold uppercase text-sm border-b py-3 text-secondary">
							<div className="flex-1">Items</div>
							<div className="flex-1">Title</div>
							<div className="flex-1">Price</div>
							<div className="flex-1">Quantity</div>
							<div className="flex-1">Total</div>
							<div className="flex-1 text-center">Remove</div>
						</div>

						{/* Cart Items */}
						{cartItems.map((item) => (
							<div key={item.title}>
								{/* Desktop Layout */}
								<div className="hidden md:flex justify-between items-center border-b py-1 gap-4">
									<div className="flex-1">
										<img
											className="h-[60px] w-[60px] rounded-full object-cover"
											src={item.imgSrc}
											alt={item.title}
										/>
									</div>
									<div className="flex-1 font-Source text-sm lg:text-base">{item.title}</div>
									<div className="flex-1 font-Source text-sm lg:text-base">₹{item.price}</div>
									<div className="flex-1 font-Source text-sm lg:text-base">{item.quantity}</div>
									<div className="flex-1 font-Source text-sm lg:text-base">
										₹{(item.price * item.quantity).toFixed(2)}
									</div>
									<div className="flex-1 text-center">
										<button
											onClick={() => removeFromCart(item.title)}
											className="text-red-500 hover:text-red-700 text-xl transition-colors duration-200 p-2"
											aria-label={`Remove ${item.title} from cart`}
										>
											×
										</button>
									</div>
								</div>

								{/* Mobile Layout */}
								<div className="md:hidden border-b border-gray-200 py-4">
									<div className="flex items-start gap-4">
										{/* Image */}
										<div className="flex-shrink-0">
											<img
												className="h-20 w-20 rounded-full object-cover"
												src={item.imgSrc}
												alt={item.title}
											/>
										</div>

										{/* Content */}
										<div className="flex-1 min-w-0 px-2">
											<h3 className="font-Source font-medium text-base text-text truncate">
												{item.title}
											</h3>
											
											<div className="mt-2 space-y-1">
												<div className="flex justify-between text-sm">
													<span className="text-secondary">Price :</span>
													<span className="font-medium text-text">₹{item.price}</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-secondary">Quantity :</span>
													<span className="font-medium text-text">{item.quantity}</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-secondary">Total :</span>
													<span className="font-medium text-text">
														₹{(item.price * item.quantity).toFixed(2)}
													</span>
												</div>
											</div>

											{/* Remove Button */}
											<div className="mt-3 flex justify-end">
												<button
													onClick={() => removeFromCart(item.title)}
													className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors duration-200 px-3 py-1 border border-red-200 rounded-md hover:bg-red-50"
													aria-label={`Remove ${item.title} from cart`}
												>
													Remove
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Cart Totals */}
			{cartItems.length > 0 && (
				<div className="my-8 md:my-12">
					<div className="flex flex-col lg:flex-row justify-between gap-8">
						{/* Cart Summary */}
						<div className="lg:w-2/5 w-full mt-10 px-4">
							<h2 className="font-bold text-lg md:text-2xl mb-4 font-Source text-text">Cart Totals</h2>
							
							<div className=" rounded-lg px-4 md:p-6 space-y-3">
								<div className="flex justify-between py-2 border-b border-gray-200">
									<span className="font-Source text-secondary">Sub Total</span>
									<span className="font-Source font-medium text-text">₹{subtotal.toFixed(2)}</span>
								</div>
								<div className="flex justify-between py-2 border-b border-gray-200">
									<span className="font-Source text-secondary">Delivery Fee</span>
									<span className="font-Source font-medium text-text">₹{deliveryFee}</span>
								</div>
								<div className="flex justify-between py-2 font-bold text-lg">
									<span className="font-Source text-text">Total</span>
									<span className="font-Source text-text">₹{total.toFixed(2)}</span>
								</div>
							</div>

							<div className="mt-6">
								<Button
									onClick={() => {
										toast.success("Order placed successfully");
										clearCart();
									}}
									className="w-full rounded-lg text-center py-2 font-medium"
								>
									PLACE ORDER
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Cart;