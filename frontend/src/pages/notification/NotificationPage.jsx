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

const NotificationPage = ({ setHasNewNotification, setBlinkNotification }) => {
    const queryClient = useQueryClient();
    const { data: notifications, isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            try {
                const res = await fetch("/api/notifications/", { method: "GET" });
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
            fetch("/api/notifications/mark-read", { method: "POST" });
            hasMarkedRead.current = true;
        }
    }, [notifications]);

    const { mutate: deleteNotifications } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch("/api/notifications/", { method: "DELETE" });
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
            <div className="flex-[4_4_0] border-l border-r border-gray-700 min-h-screen">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
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
                {notifications?.map((notification) => (
                    <div className="border-b border-gray-700" key={notification._id}>
                        <div className="flex gap-2 p-4 items-center">
                            {notification.type === "follow" && (
                                <FaUser className="w-7 h-7 text-primary" />
                            )}
                            {notification.type === "like" && (
                                <FaHeart className="w-7 h-7 text-red-500" />
                            )}
                            {notification.type === "comment" && (
                                <BiSolidCommentDots className="w-7 h-7 text-green-500" />
                            )}
                            <Link
                                to={`/profile/${notification.from.username}`}
                                className="flex-1 flex items-center"
                            >
                                <div className="avatar">
                                    <div className="w-8 rounded-full">
                                        <img
                                            src={
                                                notification.from.profileImg ||
                                                "/avatar-placeholder.png"
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-1 items-center">
                                    <span className="font-bold">@{notification.from.username}</span>{" "}
                                    {notification.type === "follow"
                                        ? "followed you"
                                        : notification.type === "comment"
                                        ? "commented on your post"
                                        : "liked your post"}
                                    <span className="ml-2 text-xs text-gray-400">
                                        {formatPostDate(notification.createdAt)}
                                    </span>
                                </div>
                            </Link>
                            {!notification.read && (
                                <span className="ml-2 w-2.5 h-2.5 rounded-full bg-primary animate-pulse border-2 border-white"></span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};
export default NotificationPage;
