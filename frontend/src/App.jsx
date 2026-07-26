import React, { useState, useContext } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Reservation from "./components/Reservation";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import { UserContextProvider, UserContext } from "../context/UserContext";
import Cart from "./pages/Cart";
import Order from "./components/Order/Order";
import AdminAddItem from "./pages/AdminAddItem";
import ManageFoodAdmin from "./pages/ManageFoodAdmin"; // Admin Delete Item Page
import AdminNavbar from "./components/AdminNavbar";
import { CartProvider } from "../context/CartContext";
import ChatWidget from "./components/ChatWidget";
import Profile from "./pages/Profile";

// Set axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "https://bakenbrew-cafe-website-backend.onrender.com";
axios.defaults.withCredentials = true;

function App() {
	const [showLogin, setShowLogin] = useState(false);
	const [showSignUp, setShowSignUp] = useState(false);

	return (
		<Router>
			<UserContextProvider>
				<CartProvider>
				<AppContent
					showLogin={showLogin}
					setShowLogin={setShowLogin}
					showSignUp={showSignUp}
					setShowSignUp={setShowSignUp}
				/>
				</CartProvider>
			</UserContextProvider>
		</Router>
	);
}

function AppContent({ showLogin, setShowLogin, showSignUp, setShowSignUp }) {
	const { user } = useContext(UserContext);
	const isAdmin = user?.role === "admin";

	return (
		<div
			key={isAdmin ? "admin" : "user"}
			className={`relative ${
				showLogin || showSignUp ? "backdrop-blur-sm" : ""
			}`}
		>
			{/* Hide Navbar if user is admin */}
			{!isAdmin && (
				<Navbar
					setShowLogin={setShowLogin}
					setShowSignUp={setShowSignUp}
				/>
			)}
			{/* {isAdmin && <AdminNavbar setShowLogin={setShowLogin} />} */}

			<Toaster position="top-right" toastOptions={{ duration: 2000 }} />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/reservation" element={<Reservation setShowLogin={setShowLogin} />} />
				<Route
					path="/register"
					element={<SignUp setShowSignUp={setShowSignUp} />}
				/>
				<Route
					path="/login"
					element={<Login setShowLogin={setShowLogin} />}
				/>
				<Route path="/order" element={<Order setShowLogin={setShowLogin}/>} />
				<Route path="/cart" element={<Cart setShowLogin={setShowLogin}/>} />
				<Route path="/profile" element={<Profile setShowLogin={setShowLogin} />} />
				<Route path="/my-activity" element={<Navigate to="/profile" replace />} />

				{/* Admin routes */}
				<Route
					element={
						<AdminNavbar
							setShowLogin={setShowLogin}
							setShowSignUp={setShowSignUp}
						/>
					}
				>
					<Route
						path="/admin-add-item"
						element={<AdminAddItem setShowLogin={setShowLogin} />}
					/>
					<Route
						path="/admin-delete-item"
						element={
							<ManageFoodAdmin setShowLogin={setShowLogin} />
						}
					/>
				</Route>
			</Routes>

			{/* Hide Footer if user is admin */}
			{!isAdmin && <Footer />}
			<ChatWidget onLogin={() => setShowLogin(true)} />

			{/* Popups for Login & Signup */}
			{showLogin && (
				<div className="fixed inset-0 flex items-center justify-center bg-slate-900 bg-opacity-50 z-50 backdrop-blur-sm">
					<Login setShowLogin={setShowLogin} />
				</div>
			)}
			{showSignUp && (
				<div className="fixed inset-0 flex items-center justify-center bg-slate-900 bg-opacity-50 z-50 backdrop-blur-sm">
					<SignUp setShowSignUp={setShowSignUp} />
				</div>
			)}
		</div>
	);
}

export default App;
