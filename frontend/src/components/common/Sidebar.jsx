import XSvg from "../svgs/X";

import { MdHomeFilled } from "react-icons/md";
import { IoNotifications } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { RiMessageFill, RiUserFollowFill } from "react-icons/ri";
import { createHighQualityProfileImage } from "../../utils/imageUtils";

const Sidebar = ({
    authUser,
    unreadUsers = [],
    hasNewNotification = false,
    setHasNewNotification,
    blinkNotification = false,
}) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { mutate: logoutMutation } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch("/api/auth/logout", {
                    method: "POST",
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
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: () => {
            toast.error("Logout failed");
        },
    });

    return (
        <div className="flex-shrink-0 w-16 lg:w-52 lg:max-w-52 font-semibold">
            <div className="fixed lg:sticky top-0 lg:top-1 left-0 h-screen mobile-screen-height flex flex-col border-r border-gray-700 w-16 lg:w-full bg-black z-40 sidebar-mobile pb-safe">
                <Link to="/" className="flex justify-center lg:justify-start mt-2 flex-shrink-0">
                    <XSvg className="px-2 w-12 h-12 rounded-full fill-white hover:bg-stone-900" />
                </Link>
                <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                    <div className="flex-1">
                        <ul className="flex flex-col gap-3 mt-4 ">
                            <li className="flex justify-center lg:justify-start">
                                <Link
                                    to="/"
                                    className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
                                >
                                    <MdHomeFilled className="w-6 h-6" />
                                    <span className="text-lg hidden lg:block">Home</span>
                                </Link>
                            </li>
                            <li className="flex justify-center lg:justify-start relative">
                                <Link
                                    to="/notifications"
                                    className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
                                    onClick={() =>
                                        setHasNewNotification && setHasNewNotification(false)
                                    }
                                >
                                    <IoNotifications className="w-6 h-6" />
                                    <span className="text-lg hidden lg:block">Notifications</span>
                                    {hasNewNotification && (
                                        <span className="absolute -top-1 right-0 lg:right-2 flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                                        </span>
                                    )}
                                </Link>
                            </li>
                            <li className="flex justify-center lg:justify-start">
                                <Link
                                    to={`/profile/${authUser?.username}`}
                                    className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
                                >
                                    <FaUser className="w-6 h-6" />
                                    <span className="text-lg hidden lg:block">Profile</span>
                                </Link>
                            </li>
                            <li className="flex justify-center lg:justify-start">
                                <Link
                                    to={`/profile/${authUser?.username}/following`}
                                    className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
                                >
                                    <RiUserFollowFill className="w-6 h-6" />
                                    <span className="text-lg hidden lg:block">Following</span>
                                </Link>
                            </li>
                            <li className="flex justify-center lg:justify-start relative">
                                <div
                                    className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate("/chat/messages", { replace: true });
                                    }}
                                >
                                    <RiMessageFill className="w-6 h-6" />
                                    <span className="text-lg hidden lg:block">Messages</span>
                                    {unreadUsers && unreadUsers.length > 0 && (
                                        <span className="absolute -top-1 right-0 lg:right-2 flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                                            <span className="ml-1 text-primary text-xs font-bold">
                                                {unreadUsers.length}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Profile section - always at bottom */}
                    {authUser && (
                        <Link
                            to={`/profile/${authUser.username}`}
                            className="mt-auto mb-4 lg:mb-8 flex gap-2 items-start transition-all duration-300 hover:bg-[#181818] py-3 px-4 rounded-full pb-safe flex-shrink-0"
                            style={{
                                marginBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
                                paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
                            }}
                        >
                            <div className="avatar hidden lg:inline-flex">
                                <div className="w-8 rounded-full">
                                    <img
                                        src={
                                            createHighQualityProfileImage(authUser?.profileImg) ||
                                            "/avatar-placeholder.png"
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between flex-1">
                                <div className="hidden lg:block">
                                    <p className="text-white font-bold text-sm w-20 truncate">
                                        {authUser?.fullName}
                                    </p>
                                    <p className="text-slate-500 text-sm">@{authUser?.username}</p>
                                </div>
                                <BiLogOut
                                    className="w-5 h-5 cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        logoutMutation();
                                    }}
                                />
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};
export default Sidebar;
