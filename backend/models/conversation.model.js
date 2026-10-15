import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
      }
    ],
    isGroup: { type: Boolean, default: false },
    name: { type: String, trim: true, maxlength: 60, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
