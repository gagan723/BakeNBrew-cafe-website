import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CiShoppingBasket } from 'react-icons/ci';
import { UserContext } from '../../context/UserContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import Button from './Button';

const Navbar = ({ setShowLogin }) => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const { cartItems, fetchCart, setCartItems } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch cart when user logs in or when component mounts
  useEffect(() => {
    if (user) {
      fetchCart();
    } 
  }, [user]);

  const onLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/');
    toast.success("Logout successful");
    setIsMobileMenuOpen(false); // Close mobile menu on logout
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="w-full flex flex-col">
      {/* Top bar */}
      <div className="w-full bg-transparent border-b border-border lg:px-[150px] px-5 flex items-center justify-between h-[25px] text-sm">
        <span className="text-secondary font-Source">Tired? Let's have a cup of coffee.</span>
        <span className="text-secondary font-Source hidden sm:block">Call us: +91 9087654321</span>
        <span className="text-secondary font-Source lg:block hidden">Our location: Bengaluru, India</span>
      </div>

      {/* Main navbar */}
      <div className="w-full flex items-center justify-between h-[65px] lg:px-[150px] px-5 border-b border-border relative">
        {/* Logo */}
        <div>
          <p onClick={() => navigate('/')} className="text-[33px] lg:text-4xl font-semibold cursor-pointer">
            Bake & <span className="text-primary">Brew</span>
          </p>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center justify-center gap-4">
          <ul className="flex gap-6">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `${isActive ? 'text-primary' : 'text-secondary'} font-Source text-lg hover:text-primary cursor-pointer`
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/reservation"
                className={({ isActive }) =>
                  `${isActive ? 'text-primary' : 'text-secondary'} font-Source text-lg hover:text-primary cursor-pointer`
                }
              >
                Reservations
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/order"
                className={({ isActive }) =>
                  `${isActive ? 'text-primary' : 'text-secondary'} font-Source text-lg hover:text-primary cursor-pointer`
                }
              >
                Order
              </NavLink>
            </li>
            <li className="font-Source text-base text-secondary">|</li>
          </ul>

          {/* Cart with Badge */}
          <Link to="/cart" className="relative">
            <CiShoppingBasket className="text-4xl hover:text-[42px] hover:text-primary transition-all duration-200" />
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {cartItems.length}
            </span>
          </Link>

          {/* Login/Logout */}
          {user ? (
            <Button onClick={onLogout} className=" text-secondary cursor-pointer ">
              Logout
            </Button>
          ) : (
            <Button onClick={() => setShowLogin(true)} className="text-base text-secondary cursor-pointer ">
              Login
            </Button>
          )}
        </div>

        {/* Mobile Menu Button and Cart */}
        <div className="md:hidden flex items-center gap-3">
          {/* Mobile Cart */}
          <Link to="/cart" className="relative">
            <CiShoppingBasket className="text-3xl hover:text-primary transition-all duration-200" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
              {cartItems.length}
            </span>
          </Link>

          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="flex flex-col justify-center items-center w-8 h-8 space-y-1"
            aria-label="Toggle mobile menu"
          >
            <span
              className={`block w-6 h-0.5 bg-secondary transition-all duration-300 ${
                isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-secondary transition-all duration-300 ${
                isMobileMenuOpen ? 'opacity-0' : ''
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-secondary transition-all duration-300 ${
                isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`}
            ></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeMobileMenu}
          ></div>

          {/* Mobile Menu */}
          <div className="fixed top-0 right-0 w-72 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <p className="text-2xl font-semibold">
                Bake & <span className="text-primary">Brew</span>
              </p>
              <button
                onClick={closeMobileMenu}
                className="text-secondary hover:text-primary text-2xl"
                aria-label="Close mobile menu"
              >
                ✕
              </button>
            </div>

            {/* Mobile Menu Items */}
            <div className="flex flex-col p-5 space-y-4">
              <NavLink
                to="/"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `${isActive ? 'text-primary' : 'text-secondary'} font-Source text-xl hover:text-primary cursor-pointer py-2 border-b border-gray-100`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/reservation"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `${isActive ? 'text-primary' : 'text-secondary'} font-Source text-xl hover:text-primary cursor-pointer py-2 border-b border-gray-100`
                }
              >
                Reservations
              </NavLink>
              <NavLink
                to="/order"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `${isActive ? 'text-primary' : 'text-secondary'} font-Source text-xl hover:text-primary cursor-pointer py-2 border-b border-gray-100`
                }
              >
                Order
              </NavLink>

              {/* Mobile Login/Logout */}
              <div className="pt-4">
                {user ? (
                  <Button
                    onClick={onLogout}
                    className=" text-secondary cursor-pointer block"
                  >
                    Logout
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setShowLogin(true);
                      closeMobileMenu();
                    }}
                    className=" text-secondary cursor-pointer block"
                  >
                    Login
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;