import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import { getMessages, sendMesage } from "../controllers/message.contollers.js";

const messageRouter = express.Router(); 


messageRouter.post("/send/:receiver", isAuth, upload.single("image"), sendMesage);


messageRouter.get("/:receiver", isAuth, getMessages);

export default messageRouter;