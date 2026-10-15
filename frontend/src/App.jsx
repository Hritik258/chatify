// App.jsx - Complete updated version with dynamic backend URL
import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import useGetCurrentUser from './customHooks/getCurrentUser';
import useGetOtherUsers from './customHooks/getOtherUsers';
import { io } from "socket.io-client";
import { setOnlineUsers } from './redux/userSlice';

const SignUp = lazy(() => import('./pages/SignUp'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const Home = lazy(() => import('./pages/Home'));
const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

function App() {
  const dispatch = useDispatch();
  const [chatSocket, setChatSocket] = useState(null);

  useGetCurrentUser();
  useGetOtherUsers();

  const { userData, authChecked } = useSelector(state => state.user || {});

  // Socket connection with dynamic URL
  useEffect(() => {
    if (!userData?._id) return undefined;

    const socket = io(serverUrl, {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    const handleSocketConnect = () => setChatSocket(socket);
    socket.on("connect", handleSocketConnect);

    socket.on("getOnlineUsers", (users) => {
      dispatch(setOnlineUsers(users));
    });
    socket.connect();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userData?._id, dispatch]);

  if (!authChecked) {
    return <main className="app-loading" aria-label="Loading Chatify"><span className="brand-mark">c</span><span>Getting your conversations ready…</span></main>;
  }

  return (
    <Suspense fallback={<main className="app-loading"><span className="brand-mark">c</span><span>Opening Chatify…</span></main>}>
      <Routes>
        <Route path="/login" element={!userData ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to="/profile" />} />
        <Route path="/" element={userData ? <Home socket={chatSocket} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={userData ? <Profile /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={userData ? "/" : "/login"} replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;


