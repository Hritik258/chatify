// App.jsx - Complete updated version with dynamic backend URL
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Profile from './pages/Profile';  
import Home from './pages/Home';
import useGetCurrentUser from './customHooks/getCurrentUser';
import useGetOtherUsers from './customHooks/getOtherUsers';
import { io } from "socket.io-client";
import { setOnlineUsers } from './redux/userSlice';

// ✅ Use VITE_SERVER_URL from environment, fallback to localhost for development
const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

function App() {
  const dispatch = useDispatch();

  // Custom hooks
  useGetCurrentUser(); 
  useGetOtherUsers();

  const { userData } = useSelector(state => state.user || {});

  // Socket connection with dynamic URL
  useEffect(() => {
    if (!userData?._id) return;

    // Initialize socket connection
    const socket = io(serverUrl, {      // ✅ Use serverUrl here
      auth: { userId: userData._id },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    window.chatSocket = socket;

    socket.on("getOnlineUsers", (users) => {
      dispatch(setOnlineUsers(users));
    });

    return () => {
      if (socket) {
        socket.disconnect();
        window.chatSocket = null;
      }
    };
  }, [userData?._id, dispatch]);

  return (
    <Routes>
      <Route path="/login" element={!userData ? <Login /> : <Navigate to="/" />} />
      <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to="/profile" />} />
      <Route path="/" element={userData ? <Home /> : <Navigate to="/login" />} />
      <Route path="/profile" element={userData ? <Profile /> : <Navigate to="/signup" />} />
    </Routes>
  );
}

export default App;


