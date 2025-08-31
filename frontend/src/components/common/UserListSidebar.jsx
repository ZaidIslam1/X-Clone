import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { createHighQualityProfileImage } from "../../utils/imageUtils";

const UserListSidebar = ({
    authUser,
    selectedUsername,
    onUserSelect,
    unreadUsers = [],
    activeChatUsername,
}) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchUsers() {
            try {
                setIsLoading(true);
                const res = await fetch("/api/users/mutual", {
                    credentials: "include",
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to fetch mutual users");
                setUsers(data.filter((user) => user._id !== authUser._id));
            } catch (err) {
                console.error("Error fetching mutual users:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchUsers();
    }, [authUser._id, authUser.followers, authUser.following]);

    const handleUserSelect = (username, userId) => {
        navigate(`/chat/messages/${username}`);
        // Call the callback to collapse the panel on mobile
        if (onUserSelect) {
            onUserSelect(userId);
        }
    };

    return (
        <>
            <div className="flex-1 min-w-[500px] max-w-md border-purple-800/30 bg-transparent backdrop-blur-sm h-screen p-7 sm:p-6 flex flex-col">
                {isLoading ? (
                    <div className="flex justify-center mt-10 flex-shrink-0">
                        <LoadingSpinner size="sm" />
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-gray-400 text-center flex-shrink-0">No mutual users found</p>
                ) : (
                    <ul className="flex-1 messages-only-scroll space-y-2">
                        {users.map((user) => (
                            <li
                                key={user._id}
                                className={`p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors ${
                                    selectedUsername === user.username ? "bg-gray-900" : ""
                                }`}
                                onClick={() => handleUserSelect(user.username, user._id)}
                            >
                                <div className="flex items-center space-x-3">
                                    {user.profileImg ? (
                                        <img
                                            src={createHighQualityProfileImage(user.profileImg)}
                                            alt={user.username}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white text-lg font-bold">
                                            {user.fullName ? user.fullName[0].toUpperCase() : "?"}
                                        </div>
                                    )}
                                    <div className="relative">
                                        <p className="text-white font-medium flex items-center">
                                            {user.fullName}
                                            {/* Only show unread bubble if not actively chatting with this user */}
                                            {unreadUsers.includes(user._id) &&
                                                activeChatUsername !== user.username && (
                                                    <span
                                                        className="ml-2 inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse"
                                                        title="New message"
                                                    ></span>
                                                )}
                                        </p>
                                        <p className="text-gray-400 text-sm">@{user.username}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
};

export default UserListSidebar;
