import React, { useState, useContext, useEffect } from "react";
import reservation from "../assets/reservation.png";
import Button from "./Button";
import toast from "react-hot-toast";
import { UserContext } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";

const Reservation = ({ setShowLogin }) => {
	const [noOfPeople, setNoOfPeople] = useState("");
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");
	const { user } = useContext(UserContext); // Access the user context
	const navigate = useNavigate();

	const handleReservation = async () => {
		// Basic validation
		if (!noOfPeople || !date || !time) {
			toast.error("Please fill in all fields.");
			return;
		}

		// Validate that the date is not in the past
		const selectedDate = new Date(date);
		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0); // Set current date to 00:00 to avoid time comparison issues

		if (selectedDate < currentDate) {
			toast.error("Date cannot be in the past.");
			return;
		}
		setDate("");
		setNoOfPeople("");
		setTime("");

		// check for user login
		if (!user && !localStorage.getItem("token")) {
			toast.error("Please login to reserve a table");
			setShowLogin(true);
			return;
		}

		try {
			const response = await axiosInstance.post("/reserve", {
				noOfPeople,
				date,
				time,
			});
			if (response.data.error === false) {
				setDate("");
				setNoOfPeople("");
				setTime("");
				toast.success("Table reserved!");
			} else {
				console.error(error);
				toast.error(data.message || "Something went wrong, please try again.");
			}
		} catch (error) {
			console.error(error);
			toast.error("Something went wrong, please try again.");
		}
	};

	return (
		<div className="w-full flex lg:flex-row flex-col-reverse items-center lg:h-[480px] my-[50px] lg:my-[50px] my-8">
			{/* Image Section */}
			<div className="lg:w-[45%] w-full lg:h-full h-[250px] sm:h-[350px] lg:order-1 order-2">
				<img
					src={reservation}
					alt="reservation"
					className="w-full h-full object-cover rounded-lg lg:rounded-none"
				/>
			</div>

			{/* Content Section */}
			<div className="lg:w-[55%] w-full lg:h-full bg-backgrounds flex items-center justify-center flex-col lg:p-12 px-6 py-8 sm:px-8 lg:order-2 order-1">
				<div className="flex flex-col w-full max-w-[500px]">
					{/* Title */}
					<span className="uppercase lg:text-[80px] md:text-[64px] sm:text-[56px] text-[40px] tracking-wide font-Bebas text-text leading-none mb-4 lg:mb-6 text-center lg:text-left">
						reservation
					</span>

					{/* Description */}
					<p className="font-Source sm:text-base text-sm font-light text-secondary max-w-[500px] mb-6 lg:mb-8 text-center lg:text-left leading-relaxed">
						Reserve your spot at Bake & Brew to enjoy a delightful and memorable
						experience. Whether it's a special occasion or just a cozy outing, book a
						table today to ensure you don't miss out on our exceptional coffee and
						delectable desserts.
					</p>

					{/* Form Inputs */}
					<div className="flex flex-col gap-4 lg:gap-3 w-full">
						<input
							type="number"
							placeholder="No of People"
							value={noOfPeople}
							onChange={(e) => setNoOfPeople(e.target.value)}
							min="1" // Set minimum value to 1
							className="border-0 border-b pb-2 sm:pb-3 border-inputBorder bg-transparent outline-none font-Source sm:text-base text-sm font-light placeholder:font-semibold text-secondary placeholder:text-secondary/70 focus:border-primary transition-colors duration-200 w-full"
							aria-label="Number of people"
						/>
						<input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							className="border-0 border-b pb-2 sm:pb-3 border-inputBorder bg-transparent outline-none font-Source sm:text-base text-sm font-light placeholder:font-semibold text-secondary focus:border-primary transition-colors duration-200 w-full"
							aria-label="Reservation date"
							min={new Date().toISOString().split("T")[0]} // Set min date to today
						/>
						<input
							type="time"
							value={time}
							onChange={(e) => setTime(e.target.value)}
							className="border-0 border-b pb-2 sm:pb-3 border-inputBorder bg-transparent outline-none font-Source sm:text-base text-sm font-light placeholder:font-semibold text-secondary focus:border-primary transition-colors duration-200 w-full"
							aria-label="Reservation time"
						/>
					</div>

					{/* Button */}
					<div className="mt-8 lg:mt-10 w-full flex justify-center lg:justify-start">
						<Button
							onClick={handleReservation}
							className="w-full sm:w-auto min-w-[200px] sm:min-w-[180px] text-center"
						>
							Find a Table
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Reservation;
