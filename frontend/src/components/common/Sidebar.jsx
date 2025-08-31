import SocialLogo from "../svgs/SocialLogo";

import { MdHomeFilled } from "react-icons/md";
import { IoNotifications } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { RiMessageFill, RiUserFollowFill } from "react-icons/ri";
import { createHighQualityProfileImage } from "../../utils/imageUtils";
import { useState, useEffect } from "react";

const Sidebar = ({
    authUser,
    unreadUsers = [],
    hasNewNotification = false,
    setHasNewNotification,
}) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const [allUsers, setAllUsers] = useState([]);

    // Fetch users to map userIds to usernames
    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch("/api/users/mutual", {
                    credentials: "include",
                });
                const data = await res.json();
                if (res.ok) {
                    setAllUsers(data);
                }
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        }
        if (unreadUsers.length > 0) {
            fetchUsers();
        }
    }, [unreadUsers.length]);

    // Check if currently on a chat route
    const isOnChatRoute = location.pathname.startsWith("/chat/messages/");

    // If on a chat route, extract the active chat username
    const activeChatUsername = isOnChatRoute ? location.pathname.split("/").pop() : null;

    // Map unreadUsers (userIds) to usernames for route comparison
    const unreadUsernames = unreadUsers
        .map((userId) => allUsers?.find((user) => user._id === userId)?.username)
        .filter(Boolean);

    const { mutate: logoutMutation } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                if (data.error) throw new Error(data.error);
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        onSuccess: () => {
            // Clear the authUser query and redirect to login
            queryClient.setQueryData(["authUser"], null);
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
            navigate("/login", { replace: true });
            toast.success("Logged out successfully");
        },
        onError: () => {
            toast.error("Logout failed");
        },
    });

    const logout = () => {
        logoutMutation();
    };

    return (
        <div className="flex-shrink-0 w-14 sm:w-16 md:w-20 lg:w-72 lg:max-w-72 font-semibold">
            <div className="fixed lg:sticky top-0 lg:top-1 left-0 h-screen mobile-screen-height flex flex-col w-14 sm:w-16 md:w-20 lg:w-full z-40 sidebar-mobile pb-safe bg-black/80 backdrop-blur-2xl shadow-2xl border-r border-purple-900/20 overflow-y-auto min-h-0">
                {/* Logo Section */}
                <div className="p-4 lg:p-6">
                    <Link to="/" className="flex justify-center lg:justify-start">
                        <SocialLogo className="logo-svg w-12 h-12 drop-shadow-lg hover:scale-110 transition-transform duration-200" />
                    </Link>
                </div>

                {/* Navigation Cards */}
                <div className="flex-1 overflow-y-auto flex flex-col min-h-0 px-2 lg:px-4">
                    <div className="flex-1 space-y-2">
                        {/* Home */}
                        <Link
                            to="/"
                            className="group flex items-center gap-4 p-3 lg:p-4 rounded-2xl bg-gradient-to-r from-black/40 to-gray-900/40 hover:bg-gradient-to-r hover:from-yellow-400/30 hover:to-yellow-700/30 border border-gray-800/30 hover:border-yellow-500 transition-all duration-300 backdrop-blur-md shadow-md hover:shadow-lg"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/30 from-purple-500//30 flex items-center justify-center group-hover:bg-gradient-to-br transition-all duration-300 shadow-inner">
                                <MdHomeFilled className="w-6 h-6 text-purple-300 group-hover:text-yellow-500 transition-colors" />
                            </div>
                            <span className="text-lg font-medium text-white hidden lg:block transition-colors">
                                Home
                            </span>
                        </Link>

                        {/* Notifications */}
                        <Link
                            to="/notifications"
                            className="group relative flex items-center gap-4 p-3 lg:p-4 rounded-2xl bg-gradient-to-r from-black/40 to-gray-900/40 hover:from-purple-800/40 hover:to-orange-900/30 border border-gray-800/30 hover:border-purple-600/40 transition-all duration-300 backdrop-blur-md shadow-md hover:shadow-lg"
                            onClick={() => setHasNewNotification && setHasNewNotification(false)}
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 flex items-center justify-center group-hover:from-blue-600/40 group-hover:to-purple-600/40 transition-all duration-300 shadow-inner">
                                <IoNotifications className="w-6 h-6 text-blue-300 group-hover:text-purple-300 transition-colors" />
                            </div>
                            <span className="text-lg font-medium text-white hidden lg:block">
                                Notifications
                            </span>
                            {hasNewNotification && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center animate-pulse">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                            )}
                        </Link>

                        {/* Profile */}
                        <Link
                            to={`/profile/${authUser?.username}`}
                            className="group flex items-center gap-4 p-3 lg:p-4 rounded-2xl bg-gradient-to-r from-black/40 to-gray-900/40 hover:from-green-800/40 hover:to-teal-900/30 border border-gray-800/30 hover:border-green-600/40 transition-all duration-300 backdrop-blur-md shadow-md hover:shadow-lg"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600/30 to-teal-600/30 flex items-center justify-center group-hover:from-green-600/40 group-hover:to-teal-600/40 transition-all duration-300 shadow-inner">
                                <FaUser className="w-6 h-6 text-green-300 group-hover:text-teal-300 transition-colors" />
                            </div>
                            <span className="text-lg font-medium text-white hidden lg:block">
                                Profile
                            </span>
                        </Link>

                        {/* Following */}
                        <Link
                            to={`/profile/${authUser?.username}/following`}
                            className="group flex items-center gap-4 p-3 lg:p-4 rounded-2xl bg-gradient-to-r from-black/40 to-gray-900/40 hover:from-indigo-800/40 hover:to-purple-900/30 border border-gray-800/30 hover:border-indigo-600/40 transition-all duration-300 backdrop-blur-md shadow-md hover:shadow-lg"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center group-hover:from-indigo-600/40 group-hover:to-purple-600/40 transition-all duration-300 shadow-inner">
                                <RiUserFollowFill className="w-6 h-6 text-indigo-300 group-hover:text-purple-300 transition-colors" />
                            </div>
                            <span className="text-lg font-medium text-white hidden lg:block">
                                Following
                            </span>
                        </Link>

                        {/* Messages */}
                        <div
                            className="group relative flex items-center gap-4 p-3 lg:p-4 rounded-2xl bg-gradient-to-r from-black/40 to-gray-900/40 hover:from-pink-800/40 hover:to-rose-900/30 border border-gray-800/30 hover:border-pink-600/40 transition-all duration-300 backdrop-blur-md shadow-md hover:shadow-lg cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate("/chat/messages", { replace: true });
                            }}
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600/30 to-rose-600/30 flex items-center justify-center group-hover:from-pink-600/40 group-hover:to-rose-600/40 transition-all duration-300 shadow-inner">
                                <RiMessageFill className="w-6 h-6 text-pink-300 group-hover:text-rose-300 transition-colors" />
                            </div>
                            <span className="text-lg font-medium text-white hidden lg:block">
                                Messages
                            </span>
                            {/* Unread Messages Badge */}
                            {unreadUsernames.length > 0 && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center animate-pulse">
                                    <span className="text-white text-xs font-bold">
                                        {unreadUsernames.length}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Section - Modern Card at Bottom */}
                    {authUser && (
                        <>
                            {/* Compact pill for small screens */}
                            <div className="profile-compact lg:hidden mt-auto mb-4 flex justify-center items-center">
                                <div className="relative">
                                    <button
                                        onClick={logout}
                                        className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-md border-2 border-red-700"
                                        title="Logout"
                                    >
                                        <BiLogOut className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Full profile card for larger screens */}
                            <div className="profile-card mt-auto mb-6 p-4 hidden lg:block">
                                <div className="group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 via-gray-900/60 to-black/60 border border-purple-700/40 hover:border-purple-500/60 transition-all duration-300 backdrop-blur-xl shadow-lg hover:shadow-2xl">
                                    <Link
                                        to={`/profile/${authUser.username}`}
                                        className="flex items-center gap-3 flex-1"
                                    >
                                        <div className="w-12 h-12 rounded-full ring-2 ring-purple-500/40 ring-offset-2 ring-offset-black/50 overflow-hidden group-hover:ring-purple-400/70 transition-colors shadow-md">
                                            <img
                                                src={
                                                    createHighQualityProfileImage(
                                                        authUser?.profileImg
                                                    ) || "/avatar-placeholder.png"
                                                }
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 hidden lg:block">
                                            <p className="font-semibold text-white text-base">
                                                {authUser?.fullName}
                                            </p>
                                            <p className="text-purple-300 text-xs">
                                                @{authUser?.username}
                                            </p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="p-2 rounded-lg hover:bg-red-900/30 transition-colors"
                                        title="Logout"
                                    >
                                        <BiLogOut className="w-5 h-5 text-gray-400 hover:text-red-400 transition-colors" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
export default Sidebar;
