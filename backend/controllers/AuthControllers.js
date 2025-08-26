const User = require("../models/UserModel");
const Food = require("../models/FoodModel");
const { validateEmail } = require("../utils/Helper");
const { hashPassword, comparePassword } = require("../helpers/Auth");
const jwt = require("jsonwebtoken");

const test = async (req, res) => {
	return await res.json("Test is working");
};

// Register endpoint
const registerUser = async (req, res) => {
	const { name, email, password } = req.body;

	try {
		// Check if user already exists
		const exists = await User.findOne({ email });
		if (exists) {
			return res.json({
				error: true,
				message: "email is already taken",
			});
		}

		// Validate the name field
		if (!name) {
			return res.json({ error: true, message: "Name is required" });
		}

		// Validate email format
		if (!validateEmail(email)) {
			return res.json({
				error: true,
				message: "Please enter a valid email",
			});
		}

		// Validate password strength
		if (password.length < 6) {
			return res.json({
				error: true,
				message: "Password must be at least 6 characters long",
			});
		}

		const hashedPassword = await hashPassword(password);

		// Create a new user if all validations pass
		const user = await User.create({
			name,
			email,
			password: hashedPassword,
		});

		const accessToken = jwt.sign(
			{ user },
			process.env.ACCESS_TOKEN_SECRET,
			{
				expiresIn: "3600m",
			}
		);

		// Return success response with user data
		return res.json({
			error: false,
			user,
			accessToken,
			message: "Registration Successful",
		});
	} catch (error) {
		console.error(error);
		return res.json({ error: true, message: "Something went wrong" });
	}
};

// Login endpoint
const loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;

		const userInfo = await User.findOne({ email });

		// Check if user exists
		if (!userInfo) {
			return res
				.status(400)
				.json({ error: true, message: "No user found!" });
		}

		// Check password
		const match = await comparePassword(password, userInfo.password);
		if (match) {
			const user = { user: userInfo };

			const accessToken = jwt.sign(
				user,
				process.env.ACCESS_TOKEN_SECRET,
				{
					expiresIn: "3600m",
				}
			);

			return res.json({
				error: false,
				message: "Login successful",
				email,
				accessToken,
			});
		} else {
			return res
				.status(400)
				.json({ error: true, message: "Incorrect password!" });
		}
	} catch (error) {
		console.log(error);
		return res
			.status(400)
			.json({ error: true, message: "Something went wrong" });
	}
};

// Get user details
const getUser = async (req, res) => {
	if (!req.user) return res.sendStatus(401); // ✅ Check if req.user exists before destructuring

	const { user } = req.user;

	// Find the user in the database
	const isUser = await User.findById(user._id); // ✅ Use findById for better readability

	if (!isUser) return res.sendStatus(404); // ✅ Return 404 if user is not found in DB

	// ✅ Return user data safely
	return res.json({
		user: {
			name: isUser.name,
			email: isUser.email,
			_id: isUser._id,
			role: isUser.role,
			createdOn: isUser.createdOn,
		},
		message: "",
	});
};

// Get all Menu items
const getItems = async (req, res) => {
	const { category } = req.query;

	try {
		let items;

		if (category) {
			// If category is provided, filter items by that category
			items = await Food.find({ category });
		} else {
			// If no category provided, return all items
			items = await Food.find({});
		}

		return res.json({
			error: false,
			items,
			message: "Items retrieved successfully",
		});
	} catch (error) {
		return res.status(500).json({
			error: true,
			message: "Internal server error",
		});
	}
};

// Get user's cartdata
const getCart = async (req, res) => {
	try {
		const { user } = req.user; // Get user from request
		const foundUser = await User.findById(user._id);

		if (!foundUser) {
			return res.status(404).json({ error: "User not found" });
		}

		res.status(200).json({ cartData: foundUser.cartData || [] });
	} catch (error) {
		console.error("Error fetching cart data:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Update user's cartdata
const setCart = async (req, res) => {
	try {
		const { cartData } = req.body; // Extract new cart data
		const { user } = req.user; // Get user from request

		const updatedUser = await User.findOneAndUpdate(
			{ _id: user._id },
			{ $set: { cartData } }, // Overwrites cartData
			{ new: true, runValidators: true }
		);

		if (!updatedUser) {
			return res.status(404).json({ error: "User not found" });
		}

		res.status(200).json({
			message: "Cart updated successfully",
			cartData: updatedUser.cartData,
		});
	} catch (error) {
		console.error("Error updating cart data:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Add food item
const addFoodItem = async (req, res) => {
	try {
		const { name, description, price, category } = req.body;
		const imagePath = req.file ? req.file.path : null; // Save file path

		if (!name || !description || !price || !category || !imagePath) {
			return res.status(400).json({ error: "All fields are required!" });
		}

		// Create a new food item
		const newFoodItem = new Food({
			name,
			description,
			price,
			image: imagePath,
			category,
		});

		await newFoodItem.save();

		res.status(201).json({
			message: "Food item added successfully!",
			food: newFoodItem,
		});
	} catch (error) {
		console.error("Error adding food item:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Delete food item
const deleteFoodItem = async (req, res) => {
	try {
		const { id } = req.params;
		await Food.findByIdAndDelete({ _id: id });
		return res.json({ error: false, message: "Item deleted Successfully" });
	} catch (error) {
		console.log(error);
		return res
			.status(500)
			.json({ error: true, message: "Internal server error" });
	}
};

// Reservation
const reserve = async (req, res) => {
	try {
		const { noOfPeople, date, time } = req.body;
		if (!noOfPeople || !date || !time) {
			return res.status(400).json({ error: true, message: "All fields are required" });
		}
		
		const user = await User.findById(req.user.user._id);
		if (!user) {
			return res.status(404).json({ error: true, message: "No user found" });
		}

		const newReservation = {
			noOfPeople,
			date,
			time,
			createdAt: new Date(),
		};

		user.reservations.push(newReservation);
		await user.save();

		res.status(200).json({
			error: false,
			message: "Reservation added",
			reservation: newReservation,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: true, message: "Internal Server error" });
	}
};


module.exports = {
	test,
	registerUser,
	loginUser,
	getUser,
	getItems,
	getCart,
	setCart,
	addFoodItem,
	deleteFoodItem,
	reserve,
};
