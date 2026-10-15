import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import {
  createGroup,
  deleteMessage,
  editMessage,
  getGroupMessages,
  getGroups,
  getMessages,
  markConversationRead,
  sendGroupMessage,
  sendMesage,
  toggleReaction,
} from "../controllers/message.contollers.js";

const messageRouter = express.Router(); 

const validateReceiver = (req, res, next) => {
  const { receiver } = req.params;
  if (!/^[a-f\d]{24}$/i.test(receiver) || String(req.userId) === receiver) {
    return res.status(400).json({ message: "Choose a valid recipient." });
  }
  return next();
};

messageRouter.post("/send/:receiver", isAuth, validateReceiver, upload.single("image"), sendMesage);
messageRouter.post("/groups", isAuth, createGroup);
messageRouter.get("/groups", isAuth, getGroups);
messageRouter.get("/group/:conversationId", isAuth, getGroupMessages);
messageRouter.post("/group/:conversationId/send", isAuth, upload.single("image"), sendGroupMessage);
messageRouter.post("/read/:conversationId", isAuth, markConversationRead);
messageRouter.patch("/:messageId/reaction", isAuth, toggleReaction);
messageRouter.patch("/:messageId", isAuth, editMessage);
messageRouter.delete("/:messageId", isAuth, deleteMessage);
messageRouter.get("/:receiver", isAuth, getMessages);

export default messageRouter;
