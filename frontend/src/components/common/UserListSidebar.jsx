import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const UserListSidebar = ({ authUser, selectedUsername, onUserSelect }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchUsers() {
            try {
                setIsLoading(true);
                const res = await fetch("/api/users/all");
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setUsers(data.filter((user) => user._id !== authUser._id));
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchUsers();
    }, [authUser._id]);

    const handleUserSelect = (username, userId) => {
        navigate(`/chat/messages/${username}`);
        onUserSelect(userId);
    };

    return (
        <>
            <style>
                {`
                    .users-scroll {
                        scrollbar-width: thin;
                        scrollbar-color: rgba(107, 114, 128, 0.5) transparent;
                    }
                    .users-scroll::-webkit-scrollbar {
                        width: 8px;
                    }
                    .users-scroll::-webkit-scrollbar-thumb {
                        background-color: rgba(107, 114, 128, 0.5);
                        border-radius: 4px;
                    }
                    .users-scroll::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .users-scroll:not(:hover)::-webkit-scrollbar {
                        width: 0;
                    }
                `}
            </style>
            <div className="w-48 sm:w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-black h-screen p-4 flex flex-col">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex-shrink-0">
                    Messages
                </h2>
                {isLoading ? (
                    <div className="flex justify-center mt-10 flex-shrink-0">
                        <LoadingSpinner size="sm" />
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center flex-shrink-0">
                        No users found
                    </p>
                ) : (
                    <ul className="flex-1 overflow-y-auto users-scroll space-y-2">
                        {users.map((user) => (
                            <li
                                key={user._id}
                                className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                                    selectedUsername === user.username
                                        ? "bg-gray-200 dark:bg-gray-900"
                                        : ""
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
                                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-800 dark:text-white text-lg font-bold">
                                            {user.fullName ? user.fullName[0].toUpperCase() : "?"}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-gray-800 dark:text-white font-medium">
                                            {user.fullName}
                                        </p>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                            @{user.username}
                                        </p>
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
