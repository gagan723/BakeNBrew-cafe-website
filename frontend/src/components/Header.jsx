import React from "react";
import bgImg from "../assets/bg.png";
import Button from "./Button";
import { useNavigate } from "react-router-dom";

const Header = () => {
	const navigate = useNavigate();

	return (
		<div
			className="w-full h-[485px] relative bg-cover bg-center px-2.5"
			style={{ backgroundImage: `url(${bgImg})` }}
		>
			<div className="absolute bottom-[-95px] left-1/2 -translate-x-1/2 w-full bg-fill border border-border rounded-[13px] lg:h-[190px] lg:max-w-[67.5vw] flex items-center lg:justify-between justify-center lg:flex-row flex-col lg:px-11 p-6 lg:gap-0 gap-8">
				<div className="flex flex-col gap-1.5 animate-fadeIn">
					<span className="uppercase font-Bebas text-[28px] text-text tracking-wide">
						Savor a perfect blend of coffee and desserts!
					</span>
					<p className="text-text font-light font-Source text-[14px] max-w-[550px] leading-5">
						At Bake & Brew, we blend aromatic coffee with exquisite
						desserts. Enjoy a cozy ambiance while our skilled
						baristas and bakers craft your favorite treats. Perfect
						flavors await your visit.
					</p>
					<Button
						onClick={() => navigate("/reservation")}
						className="mt-3 py-1.5 px-4"
					>
						Book a Table
					</Button>
				</div>
				<div className="flex flex-col gap-1.5 lg:border-l border-border lg:pl-8 animate-fadeIn">
					<span className="uppercase font-Bebas text-[28px] text-text tracking-wide">
						It's time for a treat!
					</span>
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between gap-2">
							<span className="font-Source text-[14px] text-secondary font-light">
								Mon - Fri
							</span>
							<span className="text-secondary font-Source font-light text-[14px]">
								...........................
							</span>
							<span className="font-Source text-[14px] text-secondary font-light">
								6.00 am - 7.00 pm
							</span>
						</div>
						<div className="flex items-center justify-between gap-2">
							<span className="font-Source text-[14px] text-secondary font-light">
								Sat - Sun
							</span>
							<span className="text-secondary font-Source font-light text-[14px]">
								...........................
							</span>
							<span className="font-Source text-[14px] text-secondary font-light">
								8.00 am - 8.00 pm
							</span>
						</div>
						<Button className="mt-3 text-sm py-1.5 px-4 opacity-0 pointer-events-none">
							book a table
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Header;
