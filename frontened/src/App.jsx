// App.jsx - Complete updated version
import React, { useEffect, useRef } from 'react';
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

function App() {
  const dispatch = useDispatch();

  // Custom hooks
  useGetCurrentUser(); 
  useGetOtherUsers();

  const { userData } = useSelector(state => state.user || {});

  // Log userData
  useEffect(() => {
    
  }, [userData]);

  // Socket connection - with detailed logging
  useEffect(() => {
    if (!userData?._id) {
      return;
    }

    
    
    // Initialize socket connection
    const socket = io("http://localhost:8000", {
      auth: { userId: userData._id },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Save to window for global access
    window.chatSocket = socket;

    // Connection events
    socket.on("connect", () => {
     
    });

    socket.on("connect_error", (error) => {
      
    });

    socket.on("disconnect", (reason) => {
      
    });

    socket.on("reconnect", (attemptNumber) => {
      
    });

    socket.on("reconnect_error", (error) => {
     
    });

    // Listen for online users updates
    socket.on("getOnlineUsers", (users) => {
      
      dispatch(setOnlineUsers(users));
    });

    // Test event
    socket.on("test", (data) => {
      
    });

    // Cleanup
    return () => {
      
      if (socket) {
        socket.disconnect();
        window.chatSocket = null;
      }
    };
  }, [userData?._id, dispatch]);

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!userData ? <Login /> : <Navigate to="/" />} 
      />
      <Route 
        path="/signup" 
        element={!userData ? <SignUp /> : <Navigate to="/profile" />} 
      />
      <Route 
        path="/" 
        element={userData ? <Home /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/profile" 
        element={userData ? <Profile /> : <Navigate to="/signup" />} 
      />
    </Routes>
  );
}

export default App;


