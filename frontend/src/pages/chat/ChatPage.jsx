import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { FaUserCircle } from "react-icons/fa";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import UserListSidebar from "../../components/common/UserListSidebar";

const ChatPage = ({ authUser }) => {
    const { username } = useParams();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [receiverId, setReceiverId] = useState(null);
    const [error, setError] = useState(null);
    const socketRef = useRef(null);
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

    useEffect(() => {
        socketRef.current = io(
            `${import.meta.env.VITE_SERVER_BASE_URL || "http://localhost:5002"}`,
            {
                withCredentials: true,
            }
        );
        socketRef.current.emit("user_connected", authUser._id);
        const handleReceive = (message) => {
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
            }
        };
        socketRef.current.on("receive_message", handleReceive);
        socketRef.current.on("sent_message", handleReceive);
        socketRef.current.on("message_error", (err) => {
            console.error("Message error:", err);
            setError(err?.error || "Failed to send message");
        });
        return () => {
            socketRef.current.disconnect();
        };
    }, [authUser._id, receiverId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !receiverId) return;
        const messageData = {
            senderId: authUser._id,
            receiverId,
            content: input,
        };
        socketRef.current.emit("send_message", messageData);
        setInput("");
    };

    return (
        <>
            <style>
                {`
                    .messages-scroll {
                        scrollbar-width: thin;
                        scrollbar-color: rgba(75, 85, 99, 0.5) transparent;
                    }
                    .messages-scroll::-webkit-scrollbar {
                        width: 4px;
                    }
                    .messages-scroll::-webkit-scrollbar-thumb {
                        background-color: rgba(75, 85, 99, 0.5);
                        border-radius: 3px;
                    }
                    .messages-scroll::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .messages-scroll:not(:hover)::-webkit-scrollbar {
                        width: 0;
                    }
                `}
            </style>
            <div className="flex h-screen bg-black">
                <UserListSidebar
                    authUser={authUser}
                    selectedUsername={username}
                    onUserSelect={setReceiverId}
                    className="w-32 sm:w-48 flex-shrink-0"
                />
                <div className="flex-1 flex flex-col h-screen">
                    {/* Header */}
                    <div className="px-4 py-2 border-b border-gray-700 flex items-center bg-black flex-shrink-0 z-10">
                        {authUser.username === username ? (
                            <div className="flex items-center gap-2">
                                <FaUserCircle className="text-white h-6 w-6" />
                                <h2 className="text-lg font-bold text-white">No User Selected</h2>
                            </div>
                        ) : (
                            <h2 className="text-lg font-bold text-white">{username}</h2>
                        )}
                    </div>

                    {/* Messages scroll area */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 messages-scroll">
                        {error && <p className="text-center text-red-500 mt-8">{error}</p>}
                        {isLoading ? (
                            <div className="flex justify-center mt-8">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : !username || !receiverId || authUser.username === username ? (
                            <div className="flex flex-col items-center justify-center mt-16">
                                <FaUserCircle className="text-white h-10 w-10 mb-4" />
                                <p className="text-center text-gray-400">
                                    Select a user to start chatting
                                </p>
                            </div>
                        ) : messages.length === 0 ? (
                            <p className="text-center text-gray-400 mt-8">Send the first message</p>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg._id}
                                    className={`max-w-[70%] p-2 rounded-lg break-words ${
                                        msg.isOwn
                                            ? "bg-primary text-white self-end"
                                            : "bg-gray-800 text-gray-300 self-start"
                                    }`}
                                >
                                    <p className="text-sm">{msg.content}</p>
                                    <span className="text-xs text-gray-400 mt-1 block text-right">
                                        {new Date(msg.createdAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input fixed at bottom */}
                    {username && receiverId && authUser.username !== username && (
                        <form
                            onSubmit={handleSend}
                            className="px-3 py-2 border-t border-gray-700 flex gap-2 bg-black flex-shrink-0"
                        >
                            <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 rounded-full bg-gray-900 text-white px-3 py-1 text-sm focus:outline-none"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary rounded-full px-4 py-1 text-sm text-white"
                                disabled={!input.trim()}
                            >
                                Send
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
};

export default ChatPage;
