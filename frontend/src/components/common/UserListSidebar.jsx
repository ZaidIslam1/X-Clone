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
        async function fetchUsersAndMessages() {
            try {
                setIsLoading(true);
                
                // Fetch mutual users
                const usersRes = await fetch("/api/users/mutual", {
                    credentials: "include",
                });
                const usersData = await usersRes.json();
                if (!usersRes.ok) throw new Error(usersData.error || "Failed to fetch mutual users");
                
                const filteredUsers = usersData.filter((user) => user._id !== authUser._id);
                
                // Fetch recent conversations to get last message timestamps
                try {
                    const conversationsRes = await fetch("/api/messages/conversations", {
                        credentials: "include",
                    });
                    
                    if (conversationsRes.ok) {
                        const conversationsData = await conversationsRes.json();
                        
                        // Create a map of user IDs to their last message timestamp
                        const lastMessageMap = {};
                        conversationsData.forEach(conversation => {
                            // Assuming conversation has participants and lastMessage with createdAt
                            const otherParticipant = conversation.participants.find(p => p._id !== authUser._id);
                            if (otherParticipant && conversation.lastMessage) {
                                lastMessageMap[otherParticipant._id] = new Date(conversation.lastMessage.createdAt);
                            }
                        });
                        
                        // Sort users: those with recent messages first, then alphabetically
                        const sortedUsers = filteredUsers.sort((a, b) => {
                            const aLastMessage = lastMessageMap[a._id];
                            const bLastMessage = lastMessageMap[b._id];
                            
                            // If both have messages, sort by most recent first
                            if (aLastMessage && bLastMessage) {
                                return bLastMessage - aLastMessage;
                            }
                            
                            // If only one has messages, prioritize that one
                            if (aLastMessage && !bLastMessage) return -1;
                            if (!aLastMessage && bLastMessage) return 1;
                            
                            // If neither have messages, sort alphabetically by name
                            return (a.fullName || a.username).localeCompare(b.fullName || b.username);
                        });
                        
                        setUsers(sortedUsers);
                    } else {
                        // If conversations endpoint fails, just use alphabetical sorting
                        const sortedUsers = filteredUsers.sort((a, b) => 
                            (a.fullName || a.username).localeCompare(b.fullName || b.username)
                        );
                        setUsers(sortedUsers);
                    }
                } catch (conversationError) {
                    console.warn("Could not fetch conversations for sorting:", conversationError);
                    // Fallback to alphabetical sorting
                    const sortedUsers = filteredUsers.sort((a, b) => 
                        (a.fullName || a.username).localeCompare(b.fullName || b.username)
                    );
                    setUsers(sortedUsers);
                }
                
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchUsersAndMessages();
    }, [authUser._id, authUser.followers, authUser.following]);

    const handleUserSelect = (username, userId) => {
        navigate(`/chat/messages/${username}`);
        // Call the callback to collapse the panel on mobile
        if (onUserSelect) {
            onUserSelect(userId);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {isLoading ? (
                <div className="flex justify-center items-center flex-1">
                    <LoadingSpinner size="sm" />
                </div>
            ) : users.length === 0 ? (
                <div className="flex justify-center items-center flex-1">
                    <p className="text-gray-400 text-center">No mutual users found</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain" style={{WebkitOverflowScrolling: 'touch'}}>
                    <ul className="space-y-2 p-4 pb-20">
                        {users.map((user) => (
                            <li
                                key={user._id}
                                className={`p-3 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors ${
                                    selectedUsername === user.username ? "bg-gray-900/50" : ""
                                } ${
                                    activeChatUsername === user.username ? "bg-purple-900/20 border border-purple-600/30" : ""
                                }`}
                                onClick={() => handleUserSelect(user.username, user._id)}
                            >
                                <div className="flex items-center space-x-3">
                                    {user.profileImg ? (
                                        <img
                                            src={createHighQualityProfileImage(user.profileImg)}
                                            alt={user.username}
                                            className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-700"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center text-white text-lg font-bold ring-1 ring-gray-700">
                                            {user.fullName ? user.fullName[0].toUpperCase() : "?"}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-white font-medium truncate">
                                                {user.fullName}
                                            </p>
                                            {/* Only show unread bubble if not actively chatting with this user */}
                                            {unreadUsers.includes(user._id) &&
                                                activeChatUsername !== user.username && (
                                                    <span
                                                        className="ml-2 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 animate-pulse flex-shrink-0"
                                                        title="New message"
                                                    ></span>
                                                )}
                                        </div>
                                        <p className="text-gray-400 text-sm truncate">@{user.username}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UserListSidebar;