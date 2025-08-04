import { useState, useEffect, useRef, useCallback } from "react";
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

    const markMessagesAsRead = async () => {
        try {
            await fetch(`/api/users/messages/${receiverId}/mark-read`, {
                method: "POST",
                credentials: "include",
            });
        } catch (err) {
            console.error("Error marking messages as read:", err);
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
        <div className="flex h-screen mobile-screen-height chat-container overflow-hidden flex-1 w-full">
            {/* Chat area (center) */}
            <div className="flex-1 flex flex-col h-full w-full">
                {/* Header */}
                <div className="px-3 sm:px-6 py-4 border-b border-gray-700 flex items-center bg-black flex-shrink-0 z-10">
                    {!username ? (
                        <div className="flex items-center justify-center gap-2">
                            <XSvg className="px-2 w-8 sm:w-12 h-8 sm:h-12 rounded-full fill-white hover:bg-stone-900" />
                            <h2 className="text-base sm:text-lg font-semibold text-white">
                                No User Selected
                            </h2>
                        </div>
                    ) : (
                        <h2 className="text-base sm:text-lg font-semibold text-white">
                            @{username}
                        </h2>
                    )}
                </div>

                {/* Messages scroll area - adjusted padding */}
                <div className="flex-1 px-3 sm:px-6 py-4 space-y-4 messages-only-scroll overflow-y-auto">
                    {error && <p className="text-center text-red-500 mt-8">{error}</p>}
                    {isLoading || isLoadingUser ? (
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

                {/* Input at bottom with proper positioning */}
                {username && receiverId && authUser?.username !== username && (
                    <div className="bg-black border-t border-gray-700 flex-shrink-0">
                        <form
                            onSubmit={handleSend}
                            className="px-3 sm:px-6 py-3 flex gap-2 sm:gap-3 chat-input-form"
                        >
                            <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 rounded-full bg-gray-900 text-white px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{ fontSize: "16px" }} // Prevent zoom on iOS
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary rounded-full px-6 py-2 text-base text-white min-w-[80px]"
                                disabled={!input.trim()}
                            >
                                Send
                            </button>
                        </form>
                    </div>
                )}

                {/* Debug info - remove after testing */}
                {process.env.NODE_ENV === "development" && (
                    <div className="text-xs text-gray-500 p-2 bg-gray-800 flex-shrink-0">
                        Debug: username={username ? "Yes" : "No"}, receiverId=
                        {receiverId ? "Yes" : "No"}, authUser={authUser?.username || "None"},
                        isLoadingUser={isLoadingUser ? "TRUE" : "FALSE"}, condition=
                        {username && receiverId && authUser?.username !== username
                            ? "TRUE"
                            : "FALSE"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
