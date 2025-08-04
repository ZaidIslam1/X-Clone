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
        <>
            <div className="flex-[4_4_0] border-r border-gray-700 page-container mobile-page-container w-full">
                <div className="flex justify-between items-center p-4 border-b border-gray-700 sticky top-0 bg-black/80 backdrop-blur-md z-10">
                    <p className="font-bold">Notifications</p>
                    <div className="dropdown ">
                        <div tabIndex={0} role="button" className="m-1">
                            <IoSettingsOutline className="w-4" />
                        </div>
                        <ul
                            tabIndex={0}
                            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                        >
                            <li>
                                <a onClick={deleteNotifications}>Delete all notifications</a>
                            </li>
                        </ul>
                    </div>
                </div>
                {isLoading && (
                    <div className="flex justify-center h-full items-center">
                        <LoadingSpinner size="lg" />
                    </div>
                )}
                {notifications?.length === 0 && (
                    <div className="text-center p-4 font-bold">No notifications 🤔</div>
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
                        <div
                            className="border-b border-gray-700 hover:bg-gray-900/30 transition-colors"
                            key={notification._id}
                        >
                            <div className="flex gap-3 p-4">
                                {/* Notification Icon */}
                                <div className="flex-shrink-0 mt-1">
                                    {notification.type === "follow" && (
                                        <FaUser className="w-6 h-6 text-primary" />
                                    )}
                                    {notification.type === "like" && (
                                        <FaHeart className="w-6 h-6 text-red-500" />
                                    )}
                                    {notification.type === "comment" && (
                                        <BiSolidCommentDots className="w-6 h-6 text-green-500" />
                                    )}
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Top Row: Avatar, Username, Action, Time */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <Link
                                            to={`/profile/${notification.from.username}`}
                                            className="flex items-center gap-2 hover:underline"
                                        >
                                            <div className="avatar">
                                                <div className="w-6 h-6 rounded-full">
                                                    <img
                                                        src={
                                                            createHighQualityProfileImage(
                                                                notification.from.profileImg
                                                            ) || "/avatar-placeholder.png"
                                                        }
                                                        alt={`${notification.from.username}'s avatar`}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-gray-300">
                                                @{notification.from.username}
                                            </span>
                                        </Link>

                                        {/* Action Text */}
                                        <span className="text-gray-300">
                                            {notification.type === "follow"
                                                ? "followed you"
                                                : notification.type === "comment"
                                                ? "commented on your post"
                                                : "liked your post"}
                                        </span>

                                        {/* Time */}
                                        <span className="text-gray-500 text-sm ml-auto">
                                            {formatPostDate(notification.createdAt)}
                                        </span>
                                    </div>

                                    {/* Bottom Row: Action Button (if applicable) */}
                                    {(notification.type === "comment" ||
                                        notification.type === "like") &&
                                        notification.post && (
                                            <div className="mt-2">
                                                <Link
                                                    to={`/post/${notification.post}`}
                                                    className="inline-flex items-center text-primary hover:text-blue-400 text-sm font-medium transition-colors"
                                                >
                                                    View post →
                                                </Link>
                                            </div>
                                        )}
                                </div>

                                {/* Unread Indicator */}
                                {!notification.read && (
                                    <div className="flex-shrink-0 mt-2">
                                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};
export default NotificationPage;
