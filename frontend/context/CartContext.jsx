// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../src/utils/axiosInstance";
import { UserContext } from "./UserContext";
import toast from "react-hot-toast";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
	const { user } = useContext(UserContext);
	const [cartItems, setCartItems] = useState([]);

	const fetchCart = async () => {
		if (!user) return;
		try {
			const response = await axiosInstance.get("/api/cart");
			setCartItems(response.data.items || []);
		} catch (error) {
			console.error("Error fetching cart:", error);
		}
	};

	useEffect(() => {
		fetchCart();
	}, [user]);

	const addToCart = async (item) => {
		try {
			const response = await axiosInstance.post("/api/cart/items", {
				foodId: item.foodId,
				quantity: item.quantity,
			});
			setCartItems(response.data.items || []);
            toast.success("Item added to cart")
		} catch (error) {
			console.error("Error adding to cart", error);
            toast.error("Failed to update cart")
		}
	};

	const removeFromCart = async (foodId) => {
		try {
			const response = await axiosInstance.delete(`/api/cart/items/${foodId}`);
			setCartItems(response.data.items || []);
			toast.success("Item removed from cart")
		} catch (error) {
			console.error("Error removing from cart", error);
		}
	};

	return (
		<CartContext.Provider value={{ cartItems, addToCart, removeFromCart, fetchCart, setCartItems}}>
			{children}
		</CartContext.Provider>
	);
};

export const useCart = () => useContext(CartContext);
