import React, { useState, useRef, useEffect } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { RiEmojiStickerLine, RiSendPlane2Fill } from "react-icons/ri";
import { FaImages } from "react-icons/fa6";
import dp from "../assets/dp.webp";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUsers } from "../redux/userSlice";
import { setMessage } from "../redux/Message.Slice";
import EmojiPicker from "emoji-picker-react";
import Sendermessage from "./Sendermessage";
import ReceiverMessage from "./ReceiverMessage";
import axios from "axios";
import { serverUrl } from '../main';

function Messagearea() {
  const { selectedUser, userData } = useSelector((state) => state.user);
  const { messages } = useSelector((state) => state.message);

  

  const socket = window.chatSocket;
  const dispatch = useDispatch();

  const [showPicker, setShowPicker] = useState(false);
  const [textMessage, setTextMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const imageRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket listener for new messages
  useEffect(() => {
    if (!socket || !selectedUser?._id) return;

    const handleNewMessage = (newMessage) => {
      

      if (newMessage.sender === selectedUser._id || newMessage.receiver === selectedUser._id) {
        const exists = messages.some((msg) => msg._id === newMessage._id);
        if (!exists) {
          dispatch(setMessage([...messages, newMessage]));
        }
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, selectedUser?._id, messages, dispatch]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!textMessage.trim() && !imageFile) return;

    try {
      const formData = new FormData();
      formData.append("message", textMessage);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await axios.post(`${serverUrl}/api/message/send/${selectedUser._id}`, formData, { withCredentials: true })

      
      dispatch(setMessage([...messages, response.data]));

      // Clear form
      setTextMessage("");
      setImageFile(null);
      setImagePreview(null);
      setShowPicker(false);
    } catch (error) {
      console.log("❌ Error sending message:", error.response?.data || error.message);
    }
  };

  if (!selectedUser) {
    return (
      <div className="lg:w-[70%] w-full h-full bg-slate-200 flex items-center justify-center">
        <h1 className="text-gray-700 font-bold text-4xl">Welcome to Chatify</h1>
      </div>
    );
  }

  return (
    <div className="lg:w-[70%] w-full h-full bg-slate-200 flex flex-col">
      {/* Header */}
      <div className="w-full h-[90px] bg-[#1797c2] flex items-center px-4 gap-3">
        <IoIosArrowRoundBack
          className="w-[40px] h-[40px] text-white cursor-pointer lg:hidden"
          onClick={() => dispatch(setSelectedUsers(null))}
        />

        <div className="flex items-center gap-3">
          <div className="w-[50px] h-[50px] rounded-full overflow-hidden">
            <img
              src={selectedUser.image || dp}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-white font-semibold text-lg">
            {selectedUser.name || selectedUser.userName}
          </h2>
        </div>
      </div>

      {/* Messages Display – with vertical gap between messages */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
        {messages?.length > 0 ? (
          messages.map((msg) =>
            msg.sender === userData._id ? (
              <Sendermessage
                key={msg._id}
                message={msg.message}
                image={msg.image}
              />
            ) : (
              <ReceiverMessage
                key={msg._id}
                message={msg.message}
                image={msg.image}
                profileImage={selectedUser.image}
              />
            )
          )
        ) : (
          <div className="text-center text-gray-500 mt-10">
            No messages yet. Say Hi! 👋
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 pb-2 flex justify-end">
          <img
            src={imagePreview}
            alt="preview"
            className="w-20 h-20 object-cover rounded"
          />
        </div>
      )}

      {/* Input Section */}
      <div className="w-full px-4 pb-3">
        <form
          onSubmit={handleSendMessage}
          className="w-full h-[60px] bg-[#1797c2] rounded-full flex items-center px-5"
        >
          {/* Emoji Picker Toggle */}
          <div onClick={() => setShowPicker(!showPicker)}>
            <RiEmojiStickerLine className="w-6 h-6 text-white cursor-pointer" />
          </div>

          {showPicker && (
            <div className="absolute bottom-20 left-5 z-50">
              <EmojiPicker
                width={250}
                height={350}
                onEmojiClick={(e) => setTextMessage((prev) => prev + e.emoji)}
              />
            </div>
          )}

          <input
            type="file"
            ref={imageRef}
            hidden
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if ( file) {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }
            }}
          />

          <input
            type="text"
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            className="flex-1 px-2 outline-none bg-transparent text-white placeholder-white"
            placeholder="Type a message..."
          />

          <div onClick={() => imageRef.current.click()}>
            <FaImages className="w-6 h-6 text-white cursor-pointer mx-2" />
          </div>

          <button type="submit">
            <RiSendPlane2Fill className="w-6 h-6 text-white cursor-pointer" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Messagearea;
