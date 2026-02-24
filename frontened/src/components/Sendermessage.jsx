import React from "react";
import dp from "../assets/dp.webp";
import { useSelector } from "react-redux";

const Sendermessage = ({ image, message }) => {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const { userData } = useSelector((state) => state.user);

  const getImageUrl = (img) => {
    if (!img) return null;
    return img.startsWith("http") ? img : `${serverUrl}${img}`;
  };

  return (
    <div className="flex justify-end gap-2 items-end">
      {/* Message bubble + optional image */}
      <div
        className="w-fit max-w-[500px] px-5 py-3
        bg-[#1797c2] text-white text-[17px]
        rounded-2xl rounded-tr-none
        shadow-md flex flex-col gap-2"
      >
        {image && (
          <img
            src={getImageUrl(image)}
            alt="sent"
            className="w-[160px] rounded-lg"
            onError={(e) => (e.target.src = dp)}
          />
        )}
        {message && <span className="break-words">{message}</span>}
      </div>

      {/* Sender's avatar (right side) */}
      <img
        src={getImageUrl(userData?.image) || dp}
        alt="you"
        className="w-8 h-8 rounded-full object-cover"
        onError={(e) => (e.target.src = dp)}
      />
    </div>
  );
};

export default Sendermessage;

