import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", index: true },
    message: {
      type: String,
      default: ""
    },
    image: {
      type: String,
      default: ""
    },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      emoji: { type: String, required: true, maxlength: 8 },
    }],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
