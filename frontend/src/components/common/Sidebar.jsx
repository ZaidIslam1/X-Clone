import XSvg from "../svgs/X";

import { MdHomeFilled } from "react-icons/md";
import { IoNotifications } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { RiMessageFill, RiUserFollowFill } from "react-icons/ri";

const Sidebar = ({
    authUser,
    unreadUsers = [],
    hasNewNotification = false,
    setHasNewNotification,
}) => {
    const queryClient = useQueryClient();

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
        <div className="md:flex-[2_2_0] w-18 max-w-52 font-semibold">
            <div className="sticky top-1 left-0 h-screen flex flex-col border-r border-gray-700 w-20 md:w-full">
                <Link to="/" className="flex justify-center md:justify-start">
                    <XSvg className="px-2 w-12 h-12 rounded-full fill-white hover:bg-stone-900" />
                </Link>
                <ul className="flex flex-col gap-3 mt-4 ">
                    <li className="flex justify-center md:justify-start">
                        <Link
                            to="/"
                            className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
                        >
                            <MdHomeFilled className="w-6 h-6" />
                            <span className="text-lg hidden md:block">Home</span>
                        </Link>
                    </li>
                    <li className="flex justify-center md:justify-start relative">
                        <Link
                            to="/notifications"
                            className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
                            onClick={() => setHasNewNotification && setHasNewNotification(false)}
                        >
                            <IoNotifications className="w-6 h-6" />
                            <span className="text-lg hidden md:block">Notifications</span>
                            {hasNewNotification && (
                                <span className="absolute -top-1 right-0 md:right-2 flex items-center">
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse border-2 border-white"></span>
                                </span>
                            )}
                        </Link>
                    </li>
                    <li className="flex justify-center md:justify-start">
                        <Link
                            to={`/profile/${authUser?.username}`}
                            className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
                        >
                            <FaUser className="w-6 h-6" />
                            <span className="text-lg hidden md:block">Profile</span>
                        </Link>
                    </li>
                    <li className="flex justify-center md:justify-start">
                        <Link
                            to={`/profile/${authUser?.username}/following`}
                            className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
                        >
                            <RiUserFollowFill className="w-6 h-6" />
                            <span className="text-lg hidden md:block">Following</span>
                        </Link>
                    </li>
                    <li className="flex justify-center md:justify-start relative">
                        <Link
                            to="/chat/messages"
                            className="flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer"
                        >
                            <RiMessageFill className="w-6 h-6" />
                            <span className="text-lg hidden md:block">Messages</span>
                            {unreadUsers && unreadUsers.length > 0 && (
                                <span className="absolute -top-1 right-0 md:right-2 flex items-center">
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse border-2 border-white"></span>
                                    <span className="ml-1 text-primary text-xs font-bold">
                                        {unreadUsers.length}
                                    </span>
                                </span>
                            )}
                        </Link>
                    </li>
                </ul>
                {authUser && (
                    <Link
                        to={`/profile/${authUser.username}`}
                        className="mt-auto mb-4 flex gap-2 items-start transition-all duration-300 hover:bg-[#181818] py-2 px-4 rounded-full"
                    >
                        <div className="avatar hidden md:inline-flex">
                            <div className="w-8 rounded-full">
                                <img src={authUser?.profileImg || "/avatar-placeholder.png"} />
                            </div>
                        </div>
                        <div className="flex justify-between flex-1">
                            <div className="hidden md:block">
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
    );
};
export default Sidebar;
