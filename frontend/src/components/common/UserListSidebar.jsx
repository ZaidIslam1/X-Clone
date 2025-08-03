import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const UserListSidebar = ({ authUser, selectedUsername, onUserSelect, unreadUsers = [] }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchUsers() {
            try {
                setIsLoading(true);
                const res = await fetch("/api/users/mutual");
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
            <div className="flex-1 border-gray-700 bg-black h-screen p-3 sm:p-4 flex flex-col">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex-shrink-0">
                    Messages
                </h2>
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
                                            src={user.profileImg}
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
                                            {unreadUsers.includes(user._id) && (
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
