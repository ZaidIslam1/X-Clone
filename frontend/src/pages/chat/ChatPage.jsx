import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
// import { io } from "socket.io-client"; // Not needed, socketRef is passed from App
import { FaUserCircle } from "react-icons/fa";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import UserListSidebar from "../../components/common/UserListSidebar";
import SocialLogo from "../../components/svgs/SocialLogo";

const ChatPage = ({ authUser, unreadUsers, setUnreadUsers, socketRef }) => {
    const { username } = useParams();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [receiverId, setReceiverId] = useState(null);
    const [error, setError] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(false);
    // socketRef is now passed as a prop from App.jsx
    const messagesEndRef = useRef(null);
    const debounceTimeoutRef = useRef(null);

    // Debounced user fetching to prevent rapid requests
    const debouncedFetchReceiverId = useCallback((username) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            fetchReceiverId(username);
        }, 300); // 300ms debounce
    }, []);

    useEffect(() => {
        setMessages([]);
        setError(null);
        setReceiverId(null);
        setIsLoadingUser(false);

        // Clear any pending debounced calls
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        if (username) {
            debouncedFetchReceiverId(username);
        }

        // Cleanup function
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [username, debouncedFetchReceiverId]);

    const fetchReceiverId = async (username) => {
        try {
            setIsLoadingUser(true);
            setError(null);

            const res = await fetch(`/api/users/profile/${username}`, {
                credentials: "include",
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "User not found");

            setReceiverId(data._id);
            // Remove from unread when opening chat
            setUnreadUsers((prev) => prev.filter((id) => id !== data._id));
        } catch (err) {
            console.error("Fetch receiverId error:", err);
            setError("Failed to load user");
            setReceiverId(null);
        } finally {
            setIsLoadingUser(false);
        }
    };

    const markMessagesAsRead = async () => {
        if (!receiverId) return;
        try {
            console.log("Marking messages as read for receiverId:", receiverId);
            const res = await fetch(`/api/users/messages/${receiverId}/mark-read`, {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();
            console.log("Mark as read response:", data);
        } catch (err) {
            console.error("Error marking messages as read:", err);
        }
    };

    useEffect(() => {
        if (receiverId) fetchMessages();
    }, [receiverId]);

    // Clear unread status when viewing a chat
    useEffect(() => {
        if (receiverId) {
            setUnreadUsers((prev) => prev.filter((id) => id !== receiverId));
            markMessagesAsRead();
        }
    }, [receiverId, setUnreadUsers]);

    const fetchMessages = async () => {
        try {
            setIsLoading(true);
            setError(null); // Clear any previous errors
            const res = await fetch(`/api/users/messages/${receiverId}`, {
                credentials: "include",
            });
            const data = await res.json();

            // Check if the response is ok and handle empty messages array
            if (!res.ok) {
                if (res.status === 404) {
                    // No messages found - this is okay, just set empty array
                    setMessages([]);
                    return;
                }
                throw new Error(data.error || "Failed to load messages");
            }

            // Handle case where data might be null or undefined
            const messagesArray = Array.isArray(data) ? data : [];
            const processedMessages = messagesArray.map((msg) => ({
                ...msg,
                isOwn: msg.senderId === authUser._id,
            }));
            setMessages(processedMessages);
        } catch (err) {
            console.error("Fetch messages error:", err);
            // Only set error for actual failures, not for empty message lists
            if (err.message !== "Failed to fetch") {
                setError("Failed to load messages");
            } else {
                // Network error - show a more helpful message
                setError("Unable to connect to server");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!socketRef || !socketRef.current || !receiverId) return;

        const handleReceive = (data) => {
            if (
                (data.senderId === authUser._id && data.receiverId === receiverId) ||
                (data.senderId === receiverId && data.receiverId === authUser._id)
            ) {
                setMessages((prev) => [
                    ...prev,
                    {
                        ...data,
                        isOwn: data.senderId === authUser._id,
                    },
                ]);
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
        <div className="flex h-screen mobile-screen-height chat-container overflow-hidden flex-1 w-full bg-gradient-to-t from-black via-gray-900 to-black">
            <div className="flex-1 flex flex-col h-full w-full max-w-2xl lg:max-w-xl xl:max-w-2xl mx-auto my-0 pt-0 lg:pt-0 pb-20 lg:pb-0 mobile-safe-top mobile-safe-bottom">
                {/* Modern Card Chat Area */}
                <div className="flex flex-col flex-1 bg-transparent border border-gray-800 shadow-2xl rounded-3xl backdrop-blur-xl overflow-hidden main-card">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-800/50 flex items-center bg-gradient-to-r from-purple-900/40 via-black/80 to-orange-900/20 backdrop-blur-xl z-10">
                        {!username ? (
                            <div className="flex items-center justify-center gap-2">
                                <SocialLogo className="px-2 w-10 h-10 rounded-full bg-gradient-to-br from-purple-600/30 to-orange-600/30" />
                                <h2 className="text-lg font-bold text-white">No User Selected</h2>
                            </div>
                        ) : (
                            <h2 className="text-lg font-bold text-white">@{username}</h2>
                        )}
                    </div>

                    {/* Messages scroll area */}
                    <div className="flex-1 px-6 py-6 space-y-4 messages-only-scroll overflow-y-auto bg-gradient-to-b from-black/60 to-gray-900/40">
                        {error && <p className="text-center text-red-500 mt-8">{error}</p>}
                        {isLoading || isLoadingUser ? (
                            <div className="flex justify-center mt-8">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : !username || !receiverId || authUser.username === username ? (
                            <div className="flex flex-col items-center justify-center mt-32">
                                <FaUserCircle className="text-white h-16 w-16 mb-4" />
                                <p className="text-center text-gray-400 text-lg">
                                    Select a user to start chatting
                                </p>
                            </div>
                        ) : messages.length === 0 ? (
                            <p className="text-center text-gray-400 mt-12 text-lg">
                                Send the first message
                            </p>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg._id}
                                    className={`flex ${
                                        msg.isOwn ? "justify-end" : "justify-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-[75%] px-6 py-4 rounded-2xl break-words shadow-lg ${
                                            msg.isOwn
                                                ? "bg-gradient-to-r from-purple-600 to-orange-500 text-white mr-2 md:mr-6 main-card"
                                                : "bg-gradient-to-r from-gray-800/80 to-gray-900/60 text-gray-200 ml-0 main-card"
                                        }`}
                                    >
                                        <p className="text-base leading-relaxed">{msg.content}</p>
                                        <span
                                            className={`text-xs mt-2 block text-right ${
                                                msg.isOwn ? "text-gray-200/80" : "text-gray-400/80"
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

                    {/* Input at bottom */}
                    {username && receiverId && authUser?.username !== username && (
                        <div className="chat-input-sticky relative z-20 bg-gradient-to-r from-black/80 via-gray-900/80 to-purple-950/30 border-t border-gray-800/50">
                            <form
                                onSubmit={handleSend}
                                className="px-6 py-4 flex gap-3 chat-input-form"
                            >
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    className="flex-1 rounded-full bg-gray-900/80 text-white px-5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500/40 border border-gray-700/40 shadow"
                                    style={{ fontSize: "16px" }}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="py-3 px-8 rounded-full font-semibold text-base transition-all duration-300 shadow-lg focus:outline-none bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:from-purple-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!input.trim()}
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
