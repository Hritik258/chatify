import express from "express";
import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";

const app = express();
const server = http.createServer(app);

// ✅ Dynamic CORS origins – development + production (from env)
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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
  const userId = socket.userId;

  if (userId) {
    usersocketMap[userId] = socket.id;
    socket.join(`user:${userId}`);
  }

  io.emit("getOnlineUsers", Object.keys(usersocketMap));

  socket.on("joinConversation", async ({ conversationId } = {}, acknowledge = () => {}) => {
    try {
      if (!mongoose.isValidObjectId(conversationId)) return acknowledge({ ok: false });
      const canJoin = await Conversation.exists({ _id: conversationId, participants: userId });
      if (!canJoin) return acknowledge({ ok: false });
      for (const room of socket.rooms) {
        if (room.startsWith("conversation:") && room !== `conversation:${conversationId}`) socket.leave(room);
      }
      socket.join(`conversation:${conversationId}`);
      acknowledge({ ok: true });
    } catch {
      acknowledge({ ok: false });
    }
  });

  socket.on("typing", ({ conversationId, isTyping } = {}) => {
    const room = `conversation:${conversationId}`;
    if (!mongoose.isValidObjectId(conversationId) || !socket.rooms.has(room)) return;
    socket.to(room).emit("typing", { conversationId: String(conversationId), userId, isTyping: Boolean(isTyping) });
  });

  socket.on("leaveConversation", ({ conversationId } = {}) => {
    if (mongoose.isValidObjectId(conversationId)) socket.leave(`conversation:${conversationId}`);
  });

  socket.on("disconnect", () => {
    if (userId && usersocketMap[userId] === socket.id) {
      delete usersocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(usersocketMap));
  });
});

io.use((socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie || "";
    const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="))?.slice(6);
    if (!token) return next(new Error("Unauthorized"));
    const decoded = jwt.verify(decodeURIComponent(token), process.env.JWT_SECRET);
    if (!decoded.id) return next(new Error("Unauthorized"));
    socket.userId = String(decoded.id);
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

export { app, server, io };
