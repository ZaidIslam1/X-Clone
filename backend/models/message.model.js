import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
    {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const Message = mongoose.model("Message", MessageSchema);
