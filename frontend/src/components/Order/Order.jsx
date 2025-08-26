import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { menu_list } from "../../data";
import MenuCard from "./MenuCard";
import { UserContext } from "../../../context/UserContext";
import axiosInstance from "../../utils/axiosInstance";

const Order = ({ setShowLogin }) => {
  const [category, setCategory] = useState("Coffee Selection");
  const [menuItems, setMenuItems] = useState([]);
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`?category=${category}`);
  }, [category, navigate]);

  const fetchMenuItems = async (category) => {
    try {
      const response = await axiosInstance.get(`/get-items?category=${category}`);
      if (response.data && !response.data.error) {
        setMenuItems(response.data.items);
      }
    } catch (error) {
      console.log("Error fetching menu items:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    const loadMenu = async () => {
      await fetchMenuItems(category);
      setLoading(false);
    };
    loadMenu();
  }, [category]);

  // ✅ Show Spinner When Loading
  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }


  return (
    <>
      {/* Order Navbar */}
      <div className="bg-secondary w-full overflow-x-auto scrollbar-hide">
        <ul className="flex list-none items-center gap-6 py-3 px-5 lg:px-36 md:gap-36 min-w-max ">
          {menu_list.map((item) => (
            <li
              key={item.menu_name}
              onClick={() => setCategory(item.menu_name)}
              className={`cursor-pointer font-Source transition-colors duration-300 md:text-lg sm:text-sm ${
                category === item.menu_name
                  ? "text-primary font-semibold border-b-2 border-primary"
                  : "text-slate-100"
              } hover:text-primary`}
            >
              {item.menu_name}
            </li>
          ))}
        </ul>
      </div>

      {/* Order Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-10 lg:px-20 py-10">
        {menuItems.length > 0 ? (
          menuItems.map((item, index) => (
            <MenuCard
              key={index}
              imgSrc={item.image}
              title={item.name}
              description={item.description}
              price={item.price}
              setShowLogin={setShowLogin}
            />
          ))
        ) : (
          <div className="col-span-full text-center text-secondary font-Source text-lg">
            No items available in this category.
          </div>
        )}
      </div>
    </>
  );
};

export default Order;
