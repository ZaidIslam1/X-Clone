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
            setError(null); // Clear any previous errors
            const res = await fetch(`/api/users/messages/${receiverId}`);
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
        <div className="flex h-screen mobile-screen-height chat-mobile-container overflow-hidden flex-1 w-full chat-no-scroll">
            {/* Chat area (center) */}
            <div
                className="flex-1 flex flex-col h-full w-full chat-no-scroll"
                style={{ paddingBottom: "70px" }}
            >
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

                {/* Messages scroll area - more padding for bigger feel */}
                <div
                    className="flex-1 px-3 sm:px-6 py-4 space-y-4 messages-only-scroll"
                    style={{ paddingBottom: "90px" }} // Extra space to prevent overlap with input
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
                {username && receiverId && authUser?.username !== username && (
                    <form
                        onSubmit={handleSend}
                        className="px-3 sm:px-6 py-3 border-t border-gray-700 flex gap-2 sm:gap-3 bg-black flex-shrink-0 chat-input-mobile"
                        style={{
                            position: "sticky",
                            bottom: 0,
                            zIndex: 100,
                            backgroundColor: "rgb(0, 0, 0)",
                            borderTop: "1px solid rgb(107, 114, 128)",
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Type your message..."
                            className="flex-1 rounded-full bg-gray-900 text-white px-4 py-2 text-base focus:outline-none"
                            style={{ fontSize: "16px" }} // Prevent zoom on iOS
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

                {/* Debug info - remove after testing */}
                {process.env.NODE_ENV === "development" && (
                    <div className="text-xs text-gray-500 p-2 bg-gray-800">
                        Debug: username={username ? "Yes" : "No"}, receiverId=
                        {receiverId ? "Yes" : "No"}, authUser={authUser?.username || "None"},
                        condition=
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
