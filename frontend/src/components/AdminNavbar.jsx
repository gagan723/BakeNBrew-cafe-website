// src/components/AdminNavbar.jsx

import React, { useContext, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import toast from "react-hot-toast";
import { FaPlus, FaList, FaBars, FaTimes } from "react-icons/fa";

const AdminNavbar = ({setShowlogin, setShowSignup}) => {
	const navigate = useNavigate();
	const { setUser } = useContext(UserContext);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const onLogout = () => {
		localStorage.clear();
		setUser(null)
		navigate("/");
		setShowlogin(false)
		setShowSignup(false)
		toast.success("Logout successful");
		setIsMobileMenuOpen(false); // Close mobile menu on logout
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	const handleNavigate = (path) => {
		navigate(path);
		closeMobileMenu(); // Close mobile menu after navigation
	};

	return (
		<div className="flex min-h-screen">
			{/* Desktop Sidebar */}
			<div className="hidden lg:flex w-64 border-r border-slate-400 p-6 flex-col">
				<h2 className="text-2xl font-bold mb-6 py-4 text-text">Admin Panel</h2>
				<ul className="space-y-4">
					<li
						className="flex items-center border border-slate-400 p-3 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors duration-200 font-Source text-secondary hover:text-text"
						onClick={() => navigate("/admin-add-item")}
					>
						<FaPlus className="mr-3 text-primary" />
						Add Items
					</li>
					<li
						className="flex items-center border border-slate-400 p-3 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors duration-200 font-Source text-secondary hover:text-text"
						onClick={() => navigate("/admin-delete-item")}
					>
						<FaList className="mr-3 text-primary" />
						List Items
					</li>
				</ul>
			</div>

			{/* Mobile Menu Overlay */}
			{isMobileMenuOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
						onClick={closeMobileMenu}
					></div>

					{/* Mobile Sidebar */}
					<div className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:hidden">
						{/* Mobile Menu Header */}
						<div className="flex items-center justify-between p-6 border-b border-slate-400">
							<h2 className="text-xl font-bold text-text">Admin Panel</h2>
							<button
								onClick={closeMobileMenu}
								className="text-secondary hover:text-primary text-2xl transition-colors duration-200"
								aria-label="Close mobile menu"
							>
								<FaTimes />
							</button>
						</div>

						{/* Mobile Menu Items */}
						<div className="p-6">
							<ul className="space-y-4">
								<li
									className="flex items-center border border-slate-400 p-3 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors duration-200 font-Source text-secondary hover:text-text"
									onClick={() => handleNavigate("/admin-add-item")}
								>
									<FaPlus className="mr-3 text-primary" />
									Add Items
								</li>
								<li
									className="flex items-center border border-slate-400 p-3 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors duration-200 font-Source text-secondary hover:text-text"
									onClick={() => handleNavigate("/admin-delete-item")}
								>
									<FaList className="mr-3 text-primary" />
									List Items
								</li>
							</ul>
						</div>
					</div>
				</>
			)}

			{/* Main content */}
			<div className="flex-1 flex flex-col min-h-screen">
				{/* Topbar */}
				<div className="w-full bg-transparent border-b border-border lg:px-10 px-4 flex items-center justify-between h-[25px] text-xs sm:text-sm">
					<span className="text-secondary font-Source truncate">
						Tired? Let's have a cup of coffee.
					</span>
					<span className="text-secondary font-Source hidden sm:block">
						Call us: +91 9087654321
					</span>
					<span className="text-secondary font-Source lg:block hidden">
						Our location: Bengaluru, India
					</span>
				</div>

				{/* Header Bar */}
				<div className="border-b border-slate-400 lg:px-10 px-4 py-3 flex justify-between items-center">
					<div className="flex items-center gap-4">
						{/* Mobile Menu Button */}
						<button
							onClick={toggleMobileMenu}
							className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-slate-400 hover:bg-gray-200 transition-colors duration-200"
							aria-label="Toggle mobile menu"
						>
							<FaBars className="text-lg text-secondary" />
						</button>

						{/* Logo */}
						<h1 className="lg:text-3xl md:text-2xl text-xl font-bold text-text">
							Bake & <span className="text-primary">Brew</span>
						</h1>
					</div>

					{/* Logout Button */}
					<button
						onClick={onLogout}
						className="outline-none h-[35px] lg:h-[30px] lg:w-[100px] w-[80px] bg-primary rounded-[100px] font-Source text-white lg:text-base text-sm px-2 shadow-md hover:bg-primary/90 transition-colors duration-200"
					>
						Logout
					</button>
				</div>

				{/* Breadcrumb/Mobile Navigation Info */}
				<div className="lg:hidden px-4 py-2 bg-gray-50 border-b border-gray-200">
					<div className="flex items-center gap-2 text-sm text-secondary font-Source">
						<span>Admin Panel</span>
						<span>•</span>
						<span className="text-text">
							{window.location.pathname.includes('add-item') ? 'Add Items' :
							 window.location.pathname.includes('delete-item') ? 'List Items' : 'Dashboard'}
						</span>
					</div>
				</div>

				{/* Outlet for child routes */}
				<div className="lg:px-6 px-4 py-4 lg:py-2 flex-1 overflow-auto">
					<Outlet />
				</div>
			</div>
		</div>
	);
};

export default AdminNavbar;