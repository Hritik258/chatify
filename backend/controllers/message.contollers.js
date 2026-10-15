import mongoose from "mongoose";
import uploadOnCloudinary from "../config/cloudinary.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { io } from "../socket/socket.js";

const validId = (value) => mongoose.isValidObjectId(value);
const conversationRoom = (id) => `conversation:${id}`;
const directFilter = (a, b) => ({ isGroup: { $ne: true }, participants: { $all: [a, b], $size: 2 } });

async function findOrCreateDirect(a, b) {
  let conversation = await Conversation.findOne(directFilter(a, b));
  if (!conversation) conversation = await Conversation.create({ participants: [a, b], messages: [] });
  return conversation;
}

async function uploadImage(file) {
  if (!file) return "";
  try {
    const url = await uploadOnCloudinary(file.path);
    if (!url) throw new Error("Upload provider returned no URL.");
    return url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error.message);
    throw new Error("The image could not be uploaded. Please try again.");
  }
}

async function persistMessage({ conversation, sender, receiver = null, body, file }) {
  const message = typeof body === "string" ? body.trim() : "";
  if (message.length > 2000 || (!message && !file)) {
    const error = new Error("Messages must contain text or an image, and text must be under 2,000 characters.");
    error.status = 400;
    throw error;
  }
  const image = await uploadImage(file);
  const created = await Message.create({ sender, receiver, conversationId: conversation._id, message, image });
  conversation.messages.push(created._id);
  conversation.updatedAt = new Date();
  await conversation.save();
  io.to(conversationRoom(conversation._id)).emit("newMessage", created);
  return created;
}

export const sendMesage = async (req, res) => {
  try {
    const sender = req.userId;
    const { receiver } = req.params;
    if (!validId(receiver) || String(sender) === String(receiver)) {
      return res.status(400).json({ message: "Choose a valid recipient." });
    }
    if (!await User.exists({ _id: receiver })) return res.status(404).json({ message: "Recipient not found." });
    const conversation = await findOrCreateDirect(sender, receiver);
    const message = await persistMessage({ conversation, sender, receiver, body: req.body.message, file: req.file });
    return res.status(201).json(message);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "Unable to send your message right now." });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { receiver } = req.params;
    if (!validId(receiver) || String(req.userId) === String(receiver)) return res.status(400).json({ message: "Choose a valid recipient." });
    if (!await User.exists({ _id: receiver })) return res.status(404).json({ message: "Recipient not found." });
    const conversation = await findOrCreateDirect(req.userId, receiver);
    await conversation.populate({ path: "messages", options: { sort: { createdAt: 1 } } });
    return res.status(200).json({ conversationId: conversation._id, messages: conversation.messages });
  } catch (error) {
    console.error("getMessages error:", error.message);
    return res.status(500).json({ message: "Unable to load this conversation right now." });
  }
};

export const createGroup = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const requested = Array.isArray(req.body.participants) ? req.body.participants : [];
    if (name.length < 2 || name.length > 60) return res.status(400).json({ message: "Group name must be 2–60 characters." });
    if (requested.length < 1 || requested.length > 99 || requested.some((id) => !validId(id))) {
      return res.status(400).json({ message: "Choose between 1 and 99 other group members." });
    }
    const participantIds = [...new Set([String(req.userId), ...requested.map(String)])];
    if (participantIds.length < 3) return res.status(400).json({ message: "A group needs you and at least two other people." });
    const usersFound = await User.countDocuments({ _id: { $in: participantIds } });
    if (usersFound !== participantIds.length) return res.status(400).json({ message: "One or more selected members no longer exist." });
    const group = await Conversation.create({
      isGroup: true,
      name,
      participants: participantIds,
      createdBy: req.userId,
      admins: [req.userId],
      messages: [],
    });
    await group.populate("participants", "name userName image");
    group.participants.forEach((participant) => io.to(`user:${participant._id}`).emit("groupCreated", group));
    return res.status(201).json(group);
  } catch (error) {
    console.error("createGroup error:", error.message);
    return res.status(500).json({ message: "Unable to create this group right now." });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await Conversation.find({ isGroup: true, participants: req.userId })
      .select("name participants createdBy admins isGroup updatedAt")
      .populate("participants", "name userName image")
      .sort({ updatedAt: -1 });
    return res.json(groups);
  } catch (error) {
    console.error("getGroups error:", error.message);
    return res.status(500).json({ message: "Unable to load your groups right now." });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    if (!validId(req.params.conversationId)) return res.status(400).json({ message: "Choose a valid group." });
    const conversation = await Conversation.findOne({ _id: req.params.conversationId, isGroup: true, participants: req.userId })
      .populate({ path: "messages", options: { sort: { createdAt: 1 } } });
    if (!conversation) return res.status(404).json({ message: "Group not found." });
    return res.json({ conversationId: conversation._id, messages: conversation.messages, group: { _id: conversation._id, name: conversation.name, isGroup: true, participants: conversation.participants } });
  } catch (error) {
    console.error("getGroupMessages error:", error.message);
    return res.status(500).json({ message: "Unable to load this group right now." });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    if (!validId(req.params.conversationId)) return res.status(400).json({ message: "Choose a valid group." });
    const conversation = await Conversation.findOne({ _id: req.params.conversationId, isGroup: true, participants: req.userId });
    if (!conversation) return res.status(404).json({ message: "Group not found." });
    const message = await persistMessage({ conversation, sender: req.userId, body: req.body.message, file: req.file });
    return res.status(201).json(message);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "Unable to send your message right now." });
  }
};

export const markConversationRead = async (req, res) => {
  try {
    if (!validId(req.params.conversationId)) return res.status(400).json({ message: "Choose a valid conversation." });
    const conversation = await Conversation.findOne({ _id: req.params.conversationId, participants: req.userId });
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    const updated = await Message.updateMany(
      { _id: { $in: conversation.messages }, sender: { $ne: req.userId }, readBy: { $ne: req.userId } },
      { $addToSet: { readBy: req.userId } },
    );
    if (updated.modifiedCount) {
      io.to(conversationRoom(conversation._id)).emit("messagesRead", { conversationId: String(conversation._id), readerId: String(req.userId) });
    }
    return res.json({ read: updated.modifiedCount, readerId: String(req.userId) });
  } catch (error) {
    console.error("markConversationRead error:", error.message);
    return res.status(500).json({ message: "Unable to update read receipts." });
  }
};

async function findAuthorizedMessage(messageId, userId) {
  if (!validId(messageId)) return null;
  const conversation = await Conversation.findOne({ messages: messageId, participants: userId });
  if (!conversation) return null;
  const message = await Message.findById(messageId);
  return message ? { conversation, message } : null;
}

export const editMessage = async (req, res) => {
  try {
    const found = await findAuthorizedMessage(req.params.messageId, req.userId);
    if (!found || String(found.message.sender) !== String(req.userId)) return res.status(404).json({ message: "Message not found." });
    if (found.message.deletedAt) return res.status(400).json({ message: "Deleted messages cannot be edited." });
    const text = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!text || text.length > 2000) return res.status(400).json({ message: "Edited messages must be 1–2,000 characters." });
    found.message.message = text;
    found.message.editedAt = new Date();
    await found.message.save();
    io.to(conversationRoom(found.conversation._id)).emit("messageUpdated", found.message);
    return res.json(found.message);
  } catch (error) {
    console.error("editMessage error:", error.message);
    return res.status(500).json({ message: "Unable to edit this message." });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const found = await findAuthorizedMessage(req.params.messageId, req.userId);
    if (!found || String(found.message.sender) !== String(req.userId)) return res.status(404).json({ message: "Message not found." });
    found.message.message = "";
    found.message.image = "";
    found.message.deletedAt = new Date();
    await found.message.save();
    io.to(conversationRoom(found.conversation._id)).emit("messageUpdated", found.message);
    return res.json(found.message);
  } catch (error) {
    console.error("deleteMessage error:", error.message);
    return res.status(500).json({ message: "Unable to delete this message." });
  }
};

export const toggleReaction = async (req, res) => {
  try {
    const allowed = new Set(["👍", "❤️", "😂", "😮", "😢", "🙏"]);
    const { emoji } = req.body ?? {};
    if (!allowed.has(emoji)) return res.status(400).json({ message: "Choose a supported reaction." });
    const found = await findAuthorizedMessage(req.params.messageId, req.userId);
    if (!found) return res.status(404).json({ message: "Message not found." });
    const existing = found.message.reactions.find((reaction) => String(reaction.user) === String(req.userId));
    if (existing?.emoji === emoji) found.message.reactions = found.message.reactions.filter((reaction) => String(reaction.user) !== String(req.userId));
    else if (existing) existing.emoji = emoji;
    else found.message.reactions.push({ user: req.userId, emoji });
    await found.message.save();
    io.to(conversationRoom(found.conversation._id)).emit("messageUpdated", found.message);
    return res.json(found.message);
  } catch (error) {
    console.error("toggleReaction error:", error.message);
    return res.status(500).json({ message: "Unable to update this reaction." });
  }
};
