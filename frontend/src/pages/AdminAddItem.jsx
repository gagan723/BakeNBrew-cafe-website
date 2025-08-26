import React, { useState, useContext, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import axiosInstance from "../utils/axiosInstance";

const AdminAddItem = ({setShowLogin}) => {
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

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		price: "",
		category: "",
		image: null,
	});

	const categories = [
		"Coffee Selection",
		"Specialty Drinks",
		"Pastries",
		"Snacks",
		"Extras",
	];

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleFileChange = (e) => {
		setFormData({ ...formData, image: e.target.files[0] });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		const formDataToSend = new FormData();
		formDataToSend.append("name", formData.name);
		formDataToSend.append("description", formData.description);
		formDataToSend.append("price", formData.price);
		formDataToSend.append("category", formData.category);
		formDataToSend.append("image", formData.image);

		try {
			const response = await axiosInstance.post(
				"/add-item",
				formDataToSend,
				{
					headers: { "Content-Type": "multipart/form-data" },
				}
			);
			toast.success("Food item added successfully!");
			setFormData({
				name: "",
				description: "",
				price: "",
				category: "",
				image: null,
			});
		} catch (error) {
			console.error("Error adding food item:", error);
			toast.error("Failed to add item.");
		}
	};

	return (
		<div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
			<h2 className="text-xl font-bold mb-4">Add New Food Item</h2>
			<form onSubmit={handleSubmit} encType="multipart/form-data">
				<input
					type="text"
					name="name"
					placeholder="Food Name"
					value={formData.name}
					onChange={handleChange}
					required
					className="w-full p-2 border rounded mb-3"
				/>
				<textarea
					name="description"
					placeholder="Description"
					value={formData.description}
					onChange={handleChange}
					required
					className="w-full p-2 border rounded mb-3"
				></textarea>
				<input
					type="number"
					name="price"
					placeholder="Price"
					value={formData.price}
					onChange={handleChange}
					required
					className="w-full p-2 border rounded mb-3"
				/>
				<select
					name="category"
					value={formData.category}
					onChange={handleChange}
					required
					className="w-full p-2 border rounded mb-3"
				>
					<option value="" disabled>Select Category</option>
					{categories.map((cat) => (
						<option key={cat} value={cat}>{cat}</option>
					))}
				</select>
				<input
					type="file"
					accept="image/*"
					onChange={handleFileChange}
					required
					className="w-full p-2 border rounded mb-3"
				/>
				<button
					type="submit"
					className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
				>
					Upload Item
				</button>
			</form>
		</div>
	);
};

export default AdminAddItem;
