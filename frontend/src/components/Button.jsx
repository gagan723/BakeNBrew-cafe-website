import React from 'react'

const Button = ({ children, className,onClick }) => {
	return (
		<button
			className={`${className} outline-none h-[36px] bg-primary rounded-[100px] font-Source text-white text-base tracking-wider w-fit px-5 hover:underline`}
			onClick={onClick}
		>
			{children}
		</button>
	);
};

export default Button