import { Link, useLocation } from "react-router-dom";
import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";
import { useQuery } from "@tanstack/react-query";
import useFollow from "../../hooks/useFollow";
import LoadingSpinner from "./LoadingSpinner";
import UserListSidebar from "./UserListSidebar";
import { useState } from "react";

const RightPanel = ({ authUser, unreadUsers = [] }) => {
    const location = useLocation();
    const isMessagesPage = location.pathname.startsWith("/chat/messages");
    const [isMobileCollapsed, setIsMobileCollapsed] = useState(true);

    // Function to handle user selection and auto-collapse
    const handleUserSelect = () => {
        setIsMobileCollapsed(true);
    };

    // Get tooltip text based on current page
    const getTooltipText = () => {
        if (isMessagesPage) {
            return "Show Messages";
        }
        return "Show Suggested Users";
    };

    const { data: suggestedUsers, isLoading } = useQuery({
        queryKey: ["suggested"],
        queryFn: async () => {
            const res = await fetch("/api/users/suggested");
            const data = await res.json();
            if (data.error) return null;
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        enabled: !isMessagesPage, // Skip fetching suggestions on messages page
    });

    const { followUnfollow, isPending } = useFollow();
    const noSuggestions = !isLoading && (!suggestedUsers || suggestedUsers.length === 0);

    return (
        <>
            {/* Mobile toggle button with tooltip */}
            <div
                className={`lg:hidden fixed ${
                    isMessagesPage ? "bottom-20" : "bottom-6"
                } right-6 z-50 group`}
            >
                <button
                    className="bg-primary text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
                    onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
                    aria-label={getTooltipText()}
                >
                    {/* Always show left arrow - points to what will be shown */}
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>

                {/* Tooltip */}
                {isMobileCollapsed && (
                    <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        {getTooltipText()}
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                    </div>
                )}
            </div>

            {/* Mobile overlay */}
            {!isMobileCollapsed && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsMobileCollapsed(true)}
                />
            )}

            {/* Right Panel */}
            <div
                className={`
                ${isMobileCollapsed ? "translate-x-full lg:translate-x-0" : "translate-x-0"} 
                fixed lg:relative top-0 lg:top-0 right-0 z-50 lg:z-auto
                ${
                    isMessagesPage ? "lg:flex-[0_0_280px] lg:w-70" : "lg:flex-[0_0_300px] lg:w-75"
                } flex flex-col 
                my-0 lg:my-2 mx-0 lg:mx-2 
                w-80 lg:w-auto h-screen gap-4 
                bg-black lg:bg-transparent
                border-l border-gray-700 lg:border-none
                ${isMessagesPage ? "chat-no-scroll" : "overflow-y-auto"}
                transform transition-transform duration-300 ease-in-out
                px-4 lg:px-0 py-4 lg:py-2
            `}
            >
                {/* Close button for mobile */}
                <button
                    className="lg:hidden self-end mb-4 text-gray-400 hover:text-white"
                    onClick={() => setIsMobileCollapsed(true)}
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                {isMessagesPage ? (
                    // Show UserListSidebar on messages page
                    <div className="bg-[#16181C] rounded-md flex-1 mt-2">
                        <UserListSidebar
                            authUser={authUser}
                            unreadUsers={unreadUsers}
                            onUserSelect={handleUserSelect}
                        />
                    </div>
                ) : (
                    // Default Suggested Users Panel
                    <div
                        className={`bg-[#16181C] p-4 rounded-md flex flex-col mt-2 ${
                            noSuggestions ? "min-h-[150px]" : ""
                        }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <p className="font-bold">Who to follow</p>
                            <div className="hidden lg:flex items-center text-gray-400">
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.196-2.196M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.196M7 20v-2c0-.656.126-1.283.356-1.857M16 7a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 mt-4 flex-grow">
                            {isLoading && (
                                <>
                                    <RightPanelSkeleton />
                                    <RightPanelSkeleton />
                                    <RightPanelSkeleton />
                                    <RightPanelSkeleton />
                                </>
                            )}

                            {!isLoading &&
                                suggestedUsers?.length > 0 &&
                                suggestedUsers.map((user) => (
                                    <Link
                                        to={`/profile/${user.username}`}
                                        className="flex items-center justify-between gap-4"
                                        key={user._id}
                                    >
                                        <div className="flex gap-2 items-center">
                                            <div className="avatar">
                                                <div className="w-8 rounded-full">
                                                    <img
                                                        src={
                                                            user.profileImg ||
                                                            "/avatar-placeholder.png"
                                                        }
                                                        alt={`${user.fullName}'s avatar`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold tracking-tight truncate w-28">
                                                    {user.fullName}
                                                </span>
                                                <span className="text-sm text-slate-500">
                                                    @{user.username}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <button
                                                className="btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-sm"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    followUnfollow(user._id);
                                                }}
                                            >
                                                {isPending ? (
                                                    <LoadingSpinner size="sm" />
                                                ) : (
                                                    "Follow"
                                                )}
                                            </button>
                                        </div>
                                    </Link>
                                ))}

                            {noSuggestions && (
                                <p className="text-gray-500 text-center mt-auto mb-auto">
                                    No suggested users to follow right now.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default RightPanel;
