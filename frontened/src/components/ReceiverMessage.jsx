import React from "react";
import dp from "../assets/dp.webp";

const ReceiverMessage = ({ message, image, profileImage }) => {
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  const getImageUrl = (img) => {
    if (!img) return null;
    return img.startsWith("http") ? img : `${serverUrl}${img}`;
  };

  return (
    <div className="flex gap-2 items-end">
      {/* Receiver's avatar (left side) */}
      <img
        src={getImageUrl(profileImage) || dp}
        alt="user"
        className="w-8 h-8 rounded-full object-cover"
        onError={(e) => (e.target.src = dp)}
      />

      {/* Message bubble + optional image */}
      <div
        className="w-fit max-w-[500px] px-5 py-3
        bg-white text-gray-800 text-[17px]
        rounded-2xl rounded-bl-none
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
    </div>
  );
};

export default ReceiverMessage;