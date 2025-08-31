import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";

import { IoSettingsOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
import { BiSolidCommentDots } from "react-icons/bi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { formatPostDate } from "../../utils/date/function";
import toast from "react-hot-toast";
import { createHighQualityProfileImage } from "../../utils/imageUtils";

const NotificationPage = ({ setHasNewNotification, setBlinkNotification }) => {
    const queryClient = useQueryClient();
    const { data: notifications, isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            try {
                const res = await fetch("/api/notifications/", {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                if (data.error) return null;
                if (!res.ok) throw new Error(data.error);
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
    });
    const hasMarkedRead = useRef(false);
    useEffect(() => {
        setHasNewNotification && setHasNewNotification(false);
        if (setBlinkNotification) {
            setBlinkNotification(true);
            const timeout = setTimeout(() => setBlinkNotification(false), 4000);
            return () => clearTimeout(timeout);
        }
    }, [setHasNewNotification, setBlinkNotification]);

    // Mark notifications as read after they are displayed
    useEffect(() => {
        if (!hasMarkedRead.current && notifications && notifications.length > 0) {
            fetch("/api/notifications/mark-read", {
                method: "POST",
                credentials: "include",
            });
            hasMarkedRead.current = true;
        }
    }, [notifications]);

    const { mutate: deleteNotifications } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch("/api/notifications/", {
                    method: "DELETE",
                    credentials: "include",
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        onSuccess: () => {
            queryClient.setQueryData(["notifications"], []);
            toast.success("All notifications deleted");
        },
    });

    return (
        <div className="flex-1 page-container mobile-page-container w-full bg-gradient-to-br from-black via-gray-900 to-black min-h-full flex justify-center items-start">
            <div className="flex flex-col flex-1 w-full max-w-3xl my-0 bg-transparent border border-gray-800 shadow-2xl rounded-3xl backdrop-blur-xl overflow-hidden main-card">
                {/* Modern Header */}
                <div className="p-6 sticky top-0 bg-gradient-to-r from-black/60 via-gray-900/40 to-purple-950/20 backdrop-blur-lg z-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-5 5v-5z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-white">Notifications</h1>
                        </div>
                        <div className="dropdown dropdown-end">
                            <button
                                tabIndex={0}
                                className="btn btn-ghost btn-circle hover:bg-purple-900/20"
                                aria-label="Settings"
                            >
                                <IoSettingsOutline className="w-5 h-5 text-gray-400 hover:text-purple-400" />
                            </button>
                            <ul
                                tabIndex={0}
                                className="dropdown-content z-[1] menu p-2 shadow-xl bg-gray-900 border border-gray-700 rounded-2xl w-52"
                            >
                                <li>
                                    <a onClick={deleteNotifications}>Delete all notifications</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                {isLoading && (
                    <div className="flex justify-center h-full items-center">
                        <LoadingSpinner size="lg" />
                    </div>
                )}

                {/* Notifications Container */}
                <div className="p-4 space-y-4 flex flex-col flex-1 justify-between">
                    {notifications?.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600/20 to-orange-600/20 flex items-center justify-center">
                                <svg
                                    className="w-12 h-12 text-purple-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-5 5v-5z"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-400 text-lg font-medium">
                                No notifications yet
                            </p>
                            <p className="text-gray-500 text-sm">
                                When you get notifications, they'll appear here
                            </p>
                        </div>
                    )}

                    {notifications?.map((notification) => {
                        // For comment/like, link to the post; for follow, link to profile
                        let linkTo = `/profile/${notification.from.username}`;
                        if (
                            (notification.type === "comment" || notification.type === "like") &&
                            notification.post
                        ) {
                            linkTo = `/post/${notification.post}`;
                        }
                        return (
                            <Link to={linkTo} key={notification._id} className="block group">
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-black/40 to-gray-900/40 hover:from-purple-900/20 hover:to-orange-900/10 border border-gray-800/30 hover:border-purple-600/30 transition-all duration-300">
                                    <div className="flex gap-4 items-start">
                                        {/* Notification Icon */}
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600/20 to-orange-600/20 flex items-center justify-center ring-2 ring-purple-600/30">
                                                {notification.type === "follow" && (
                                                    <FaUser className="w-5 h-5 text-purple-400" />
                                                )}
                                                {notification.type === "like" && (
                                                    <FaHeart className="w-5 h-5 text-red-400" />
                                                )}
                                                {notification.type === "comment" && (
                                                    <BiSolidCommentDots className="w-5 h-5 text-green-400" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full ring-2 ring-purple-600/30 overflow-hidden">
                                                <img
                                                    src={
                                                        createHighQualityProfileImage(
                                                            notification.from.profileImg
                                                        ) || "/avatar-placeholder.png"
                                                    }
                                                    alt={`${notification.from.username}'s avatar`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>

                                        {/* Main Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                                                            @{notification.from.username}
                                                        </span>
                                                        <span className="text-gray-400">
                                                            {notification.type === "follow"
                                                                ? "followed you"
                                                                : notification.type === "comment"
                                                                ? "commented on your post"
                                                                : "liked your post"}
                                                        </span>
                                                    </div>

                                                    {/* Action Button (if applicable) */}
                                                    {(notification.type === "comment" ||
                                                        notification.type === "like") &&
                                                        notification.post && (
                                                            <div className="mt-2">
                                                                <span className="inline-flex items-center text-purple-400 hover:text-orange-400 text-sm font-medium transition-colors">
                                                                    View post →
                                                                </span>
                                                            </div>
                                                        )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {/* Time */}
                                                    <span className="text-gray-500 text-sm">
                                                        {formatPostDate(notification.createdAt)}
                                                    </span>

                                                    {/* Unread Indicator */}
                                                    {!notification.read && (
                                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 ring-2 ring-purple-500/30"></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
export default NotificationPage;
