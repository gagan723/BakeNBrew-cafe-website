import React, { useState, useEffect, useContext } from "react";
import MenuCard from "../components/Order/MenuCard";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import axiosInstance from "../utils/axiosInstance";

const ManageFoodAdmin = ({ setShowLogin }) => {
	const [menuItems, setMenuItems] = useState([]);
	const navigate = useNavigate()
	const {user} = useContext(UserContext)

	useEffect(() => {
		if (!user && !localStorage.getItem("token")) {
			setShowLogin(true); // show login popup
		} else if (user && user.role !== "admin") {
			// if logged in but not admin, redirect or show error
			toast.error("Access denied: Admins only");
			navigate("/");
		}
	}, [user]);
	

	const fetchMenuItems = async () => {
		try {
			const response = await axiosInstance.get("/get-items");
			if (response.data && !response.data.error) {
				setMenuItems(response.data.items);
			}
		} catch (error) {
			console.log("error fetching  menu items", error);
		}
	};

	const handleDeleteItem = async (itemId) => {
		try {
			const response = await axiosInstance.delete(`/delete-item/${itemId}`);
			if (response.data && !response.data.error) {
				toast.success("Item deleted successfully");
				setMenuItems((prev) => prev.filter((item) => item._id !== itemId));
			} else {
				toast.error("Failed to delete Item");
			}
		} catch (error) {
			console.log(error);
			toast.error("Something went wrong")
		}
	};

	useEffect(() => {
		fetchMenuItems();
	}, []);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:m-10 lg:mx-20">
			{menuItems.map((item, index) => (
				<MenuCard
					key={index}
					imgSrc={item.image}
					title={item.name}
					description={item.description}
					price={item.price}
					handleDelete={() => {
						handleDeleteItem(item._id);
					}}
				/>
			))}
		</div>
	);
};

export default ManageFoodAdmin;
