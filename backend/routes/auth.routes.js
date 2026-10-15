import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import rateLimit from "../middlewares/rateLimit.js";

const authRouter = express.Router();
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

authRouter.post("/signup", rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: "Too many signup attempts. Try again later." }), async (req, res) => {
  try {
    const body = req.body || {};
    const userName = typeof body.userName === "string" ? body.userName.trim().toLowerCase() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const { password } = body;
    if (!userName || !/^[a-z0-9_.]{3,24}$/.test(userName) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Enter a username, valid email, and password between 8 and 128 characters." });
    }

    const existing = await User.findOne({ $or: [{ email }, { userName }] });
    if (existing) return res.status(409).json({ message: "That email or username is already in use." });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ userName, email, password: hashed });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, cookieOptions());
    res.status(201).json({ _id: user._id, userName: user.userName, email: user.email, image: user.image });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "That email or username is already in use." });
    console.error("Signup failed:", err.message);
    res.status(500).json({ message: "Unable to create your account right now." });
  }
});

authRouter.post("/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many sign-in attempts. Wait a little and try again." }), async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string" || password.length > 128) {
      return res.status(400).json({ message: "Enter your email and password." });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, cookieOptions());
    res.json({ _id: user._id, userName: user.userName, email: user.email, image: user.image });
  } catch (err) {
    console.error("Login failed:", err.message);
    res.status(500).json({ message: "Unable to sign in right now." });
  }
});

authRouter.post("/logout", (req, res) => {
  const { httpOnly, secure, sameSite, path } = cookieOptions();
  res.clearCookie("token", { httpOnly, secure, sameSite, path });
  res.json({ message: "Logged out" });
});

export default authRouter;
