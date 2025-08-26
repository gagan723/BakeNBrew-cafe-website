import React, { useState, useEffect } from "react";
import comma from "../assets/comma.svg";

const comments = [
  {
    text: "I absolutely love the cozy ambiance of this cafe! The warm lighting, comfortable seating, and charming decor make it the perfect place to unwind. And the coffee? Simply divine! Every sip of their artisanal brews is a treat for the taste buds. Highly recommended!",
    author: "Sarah Anderson",
  },
  {
    text: "The desserts here are to die for! I had the chocolate cake and it was the best I've ever tasted. The staff is super friendly and the atmosphere is very relaxing. I will definitely come back for more.",
    author: "Walter White",
  },
  {
    text: "A perfect place for a weekend brunch. The menu has a great variety, and everything I've tried has been delicious. I especially love the cappuccinos here. It's a must-visit spot in town!",
    author: "Emily Johnson",
  },
  {
    text: "Bake & Brew never disappoints! The macadamia nut latte is my go-to drink, and the pastries are always fresh and delicious. The friendly service and cozy atmosphere make it my favorite spot to relax.",
    author: "Ayesha Sharma",
  },
  {
    text: "I can't get enough of Bake & Brew! The cold brew is smooth and strong, and the strawberry cake is out of this world. It's the perfect place to catch up with friends over great coffee and desserts.",
    author: "Ravi Patel",
  },
];

const Comment = () => {
  const [currentComment, setCurrentComment] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentComment((prevComment) => (prevComment + 1) % comments.length);
        setFadeIn(true);
      }, 1000); // Match the duration of the fade-out animation
    }, 5000); // Total duration including both animations
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      
      <div className="w-full px-5 lg:px-[210px] py-20 border border-border flex flex-col lg:flex-row items-center justify-center gap-9">
  <span className="uppercase text-text font-Bebas text-[40px] sm:text-[50px] lg:text-[60px] text-center lg:text-left tracking-wide">
    Hear from Our Visitors
  </span>

  <img
    className="w-[40px] sm:w-[50px] lg:w-[60px] h-[40px] sm:h-[50px] lg:h-[60px] -mt-5 p-2 rounded-full"
    src={comma}
    alt="comma"
  />

  <div className="flex flex-col gap-3 p-4 bg-[#f1f0ee] rounded-lg shadow-md max-w-full lg:max-w-[650px]">
    <p
      className={`font-Source text-sm sm:text-base text-text font-light italic transition-opacity duration-600 ease-in-out ${
        fadeIn ? "animate-fadeIn" : "animate-fadeOut"
      }`}
    >
      {comments[currentComment].text}
    </p>
    <span
      className={`font-Source text-base sm:text-lg text-text font-semibold transition-opacity duration-600 ease-in-out ${
        fadeIn ? "animate-fadeIn" : "animate-fadeOut"
      }`}
    >
      — {comments[currentComment].author}
    </span>
  </div>
</div>

    </>
  );
};

export default Comment;
