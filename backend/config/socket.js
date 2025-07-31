import { Server } from "socket.io";
import { setSocketIO } from "./globalSocket.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { Message } from "../models/message.model.js";

export const initializeSocket = (server, originUrl) => {
    const io = new Server(server, {
        cors: {
            origin: originUrl,
            credentials: true,
        },
    });
    setSocketIO(io);
    const userSockets = new Map(); // {userId: socketId}
    io.userSockets = userSockets; // Expose for controllers

    io.on("connection", (socket) => {
        socket.on("user_connected", (userId) => {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                console.error("Invalid userId:", userId);
                socket.emit("message_error", { error: "Invalid user ID" });
                return;
            }
            userSockets.set(userId, socket.id);
            io.emit("user_connected", userId);
            socket.emit("users_online", Array.from(userSockets.keys()));
        });

        socket.on("send_message", async (data) => {
            try {
                let { senderId, receiverId, content } = data;

                if (!senderId || !receiverId || !content) {
                    throw new Error("Missing required fields");
                }

                if (!mongoose.Types.ObjectId.isValid(senderId)) {
                    throw new Error("Invalid sender ID");
                }

                if (!mongoose.Types.ObjectId.isValid(receiverId)) {
                    const user = await User.findOne({ username: receiverId });
                    if (!user) {
                        throw new Error("Receiver not found");
                    }
                    receiverId = user._id.toString();
                }

                const sender = await User.findById(senderId);
                const receiver = await User.findById(receiverId);
                if (!sender || !receiver) {
                    throw new Error("Sender or receiver not found");
                }

                const message = await Message.create({ senderId, receiverId, content });

                const receiverSocketId = userSockets.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive_message", message);
                }
                socket.emit("sent_message", message);
            } catch (error) {
                console.error("Message error:", error.message, error.stack);
                socket.emit("message_error", { error: error.message });
            }
        });

        socket.on("disconnect", () => {
            let disconnectedUserId;
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    userSockets.delete(userId);
                    break;
                }
            }
            if (disconnectedUserId) {
                io.emit("user_disconnected", disconnectedUserId);
            }
        });
    });
};
