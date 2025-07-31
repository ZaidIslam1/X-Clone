import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
// import { io } from "socket.io-client"; // Not needed, socketRef is passed from App
import { FaUserCircle } from "react-icons/fa";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import UserListSidebar from "../../components/common/UserListSidebar";
import XSvg from "../../components/svgs/X";

const ChatPage = ({ authUser, unreadUsers, setUnreadUsers, socketRef }) => {
    const { username } = useParams();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [receiverId, setReceiverId] = useState(null);
    const [error, setError] = useState(null);
    // socketRef is now passed as a prop from App.jsx
    const messagesEndRef = useRef(null);

    useEffect(() => {
        setMessages([]);
        setError(null);
        setReceiverId(null);
        if (username) {
            fetchReceiverId(username);
        }
    }, [username]);

    const fetchReceiverId = async (username) => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/users/profile/${username}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "User not found");
            setReceiverId(data._id);
            // Remove from unread when opening chat
            setUnreadUsers((prev) => prev.filter((id) => id !== data._id));
        } catch (err) {
            console.error("Fetch receiverId error:", err);
            setError("Failed to load user");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (receiverId) fetchMessages();
    }, [receiverId]);

    const fetchMessages = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/users/messages/${receiverId}`);
            const text = await res.text();
            let data;
            if (!text.trim()) {
                data = [];
            } else if (!text.trim().startsWith("[")) {
                throw new Error("Invalid response");
            } else {
                data = JSON.parse(text);
            }
            setMessages(
                data.map((msg) => ({
                    ...msg,
                    isOwn: msg.senderId.toString() === authUser._id.toString(),
                }))
            );
        } catch (err) {
            console.error("Fetch messages error:", err);
            setError("Failed to load messages");
        } finally {
            setIsLoading(false);
        }
    };

    // Listen for real-time messages for this chat only
    useEffect(() => {
        if (!socketRef || !socketRef.current || !receiverId) return;
        const handleReceive = (message) => {
            // Only add to messages if for this chat
            if (
                (message.senderId === receiverId && message.receiverId === authUser._id) ||
                (message.senderId === authUser._id && message.receiverId === receiverId)
            ) {
                setMessages((prev) => {
                    if (prev.some((msg) => msg._id === message._id)) return prev;
                    return [
                        ...prev,
                        {
                            ...message,
                            isOwn: message.senderId === authUser._id,
                        },
                    ];
                });
                // Remove from unread if this chat is open
                setUnreadUsers((prev) => prev.filter((id) => id !== receiverId));
            }
        };
        socketRef.current.on("receive_message", handleReceive);
        socketRef.current.on("sent_message", handleReceive);
        return () => {
            socketRef.current.off("receive_message", handleReceive);
            socketRef.current.off("sent_message", handleReceive);
        };
    }, [socketRef, receiverId, authUser._id]);

    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        }, 50);
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !receiverId) return;
        const messageData = {
            senderId: authUser._id,
            receiverId,
            content: input,
        };
        if (socketRef && socketRef.current) {
            socketRef.current.emit("send_message", messageData);
        }
        setInput("");
    };
    return (
        <div className="flex h-screen overflow-hidden flex-1">
            {/* Chat area (center) */}
            <div className="flex-1 flex flex-col h-full">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-700 flex items-center bg-black flex-shrink-0 z-10">
                    {!username ? (
                        <div className="flex items-center justify-center gap-2">
                            <XSvg className="px-2 w-12 h-12 rounded-full fill-white hover:bg-stone-900" />
                            <h2 className="text-lg font-semibold text-white">No User Selected</h2>
                        </div>
                    ) : (
                        <h2 className="text-lg font-semibold text-white">@{username}</h2>
                    )}
                </div>

                {/* Messages scroll area - more padding for bigger feel */}
                <div
                    className="flex-1 overflow-y-auto px-6 py-4 space-y-4 messages-scroll"
                    style={{ paddingBottom: 32 }}
                >
                    {error && <p className="text-center text-red-500 mt-8">{error}</p>}
                    {isLoading ? (
                        <div className="flex justify-center mt-8">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : !username || !receiverId || authUser.username === username ? (
                        <div className="flex flex-col items-center justify-center mt-32">
                            <FaUserCircle className="text-white h-12 w-12 mb-4" />
                            <p className="text-center text-gray-400">
                                Select a user to start chatting
                            </p>
                        </div>
                    ) : messages.length === 0 ? (
                        <p className="text-center text-gray-400 mt-12">Send the first message</p>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg._id}
                                className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[75%] px-5 py-3 rounded-2xl break-words ${
                                        msg.isOwn
                                            ? "bg-primary text-white mr-2 md:mr-6"
                                            : "bg-gray-800 text-gray-300 ml-0"
                                    }`}
                                >
                                    <p className="text-base">{msg.content}</p>
                                    <span
                                        className={`text-xs mt-1 block text-right ${
                                            msg.isOwn ? "text-gray-200" : "text-gray-400"
                                        }`}
                                    >
                                        {new Date(msg.createdAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} style={{ height: 1 }} />
                </div>

                {/* Input fixed at bottom */}
                {username && receiverId && authUser.username !== username && (
                    <form
                        onSubmit={handleSend}
                        className="px-6 py-3 border-t border-gray-700 flex gap-3 bg-black flex-shrink-0"
                    >
                        <input
                            type="text"
                            placeholder="Type your message..."
                            className="flex-1 rounded-full bg-gray-900 text-white px-4 py-2 text-base focus:outline-none"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary rounded-full px-6 py-2 text-base text-white"
                            disabled={!input.trim()}
                        >
                            Send
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
export default ChatPage;
