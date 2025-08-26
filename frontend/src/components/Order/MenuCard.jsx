import React, { useContext, useState } from "react";
import { MdDeleteForever } from "react-icons/md";
import { UserContext } from "../../../context/UserContext";
import { useCart } from "../../../context/CartContext";

const MenuCard = ({ imgSrc, title, description, price, handleDelete }) => {
	const [quantity, setQuantity] = useState(1);
	const { user } = useContext(UserContext);
	const { addToCart } = useCart();

	const isAdmin = user?.role === "admin";

	const handleQuantityChange = (event) => {
		const value = Number(event.target.value);
		if (value >= 1) {
			setQuantity(value);
		}
	};

	const handleAddToCart = () => {
		const item = { title, description, imgSrc, price, quantity };
		addToCart(item);
		setQuantity(1);
	};

	return (
		<div className="w-full max-w-sm bg-white font-Source rounded-xl shadow-md overflow-hidden relative hover:shadow-lg transition-shadow mx-auto">
			<div className="flex items-center p-4">
				<img
					src={imgSrc}
					alt={title}
					className="h-20 w-20 object-cover rounded-full mr-4"
				/>
				<div className="flex-1">
					<h3 className="text-lg font-semibold text-text">{title}</h3>
					<p className="text-sm text-gray-500 line-clamp-2">{description}</p>
					<div className=" sm:flex items-center justify-between ">
						<span className=" text-base font-bold text-gray-800 ">₹ {price}</span>
						{isAdmin? null : (<div className="flex gap-4 sm:flex-row sm:items-center sm:space-x-2 space-y-2 items-center">
							<input
								type="number"
								min="1"
								value={quantity}
								onChange={handleQuantityChange}
								className="w-12 h-8 text-center border border-border rounded-md text-sm "
							/>
							<button
								onClick={handleAddToCart}
								className="bg-primary text-white rounded-full px-4 py-1 text-sm uppercase tracking-wide hover:bg-opacity-90 transition-colors"
							>
								Add Item
							</button>
						</div>)}
					</div>
				</div>
			</div>

			{/* Delete Icon for Admin */}
			{isAdmin && handleDelete && (
				<div
					onClick={handleDelete}
					className="absolute top-3 right-3 text-red-500 text-xl cursor-pointer hover:text-red-600"
					title="Delete Item"
				>
					<MdDeleteForever />
				</div>
			)}
		</div>
	);
};

export default MenuCard;
