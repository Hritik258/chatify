import express from "express";
import { Server } from "socket.io";
import http from "http";

const app = express();
const server = http.createServer(app);

// ✅ Dynamic CORS origins – development + production (from env)
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL // set this in Render backend environment
].filter(Boolean); // removes undefined if FRONTEND_URL not set

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

export const usersocketMap = {};
export const getReceiverSocketId = (receiver) => {
  return usersocketMap[receiver];
};

io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;

  if (userId) {
    usersocketMap[userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(usersocketMap));

  socket.on("disconnect", () => {
    if (userId && usersocketMap[userId]) {
      delete usersocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(usersocketMap));
  });
});

export { app, server, io };