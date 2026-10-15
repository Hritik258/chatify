import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import connectDb from "./config/db.js";
import messageRouter from "./routes/message.routes.js";
import { app, server } from "./socket/socket.js";
import aiRouter from "./routes/ai.routes.js";

if (!process.env.JWT_SECRET || !process.env.MONGODB_URL) {
  console.error("Missing required environment: set JWT_SECRET and MONGODB_URL.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL) {
  console.error("Missing required environment: set FRONTEND_URL in production.");
  process.exit(1);
}

const port = process.env.PORT || 5000;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  const origin = req.get("origin");
  if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ message: "Origin not allowed." });
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.get("/health", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "unavailable", database: ready ? "connected" : "disconnected" });
});
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/message", messageRouter);
app.use("/api/ai", aiRouter);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error?.code === "LIMIT_FILE_SIZE") return res.status(413).json({ message: "Images must be smaller than 5 MB." });
  if (error) {
    console.error("Request failed:", error.message);
    return res.status(400).json({ message: error.message || "Invalid request." });
  }
  return next();
});

connectDb()
  .then(() => {
    server.listen(port, () => console.log(`Chatify API listening on port ${port}`));
  })
  .catch((error) => {
    console.error("Unable to start Chatify API:", error.message);
    process.exit(1);
  });
