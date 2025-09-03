import { Link, useLocation } from "react-router-dom";
import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";
import { useQuery } from "@tanstack/react-query";
import useFollow from "../../hooks/useFollow";
import LoadingSpinner from "./LoadingSpinner";
import UserListSidebar from "./UserListSidebar";
import { useState, useEffect, useRef } from "react";
import { createHighQualityProfileImage } from "../../utils/imageUtils";

const RightPanel = ({ authUser, unreadUsers = [] }) => {
    const location = useLocation();
    const isMessagesPage = location.pathname.startsWith("/chat/messages");
    const [isMobileCollapsed, setIsMobileCollapsed] = useState(true);
    const panelRef = useRef(null);
    const toggleRef = useRef(null);

    // mobile panel width: small collapsed pill vs expanded drawer
    const mobilePanelWidthClass = isMobileCollapsed
        ? "w-0 sm:w-16 md:w-20"
        : "w-full sm:w-[320px] md:w-[380px]";

    // Extract active chat username from route if present
    const activeChatUsername =
        isMessagesPage && location.pathname.split("/chat/messages/")[1]
            ? location.pathname.split("/chat/messages/")[1]
            : null;

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
            const res = await fetch("/api/users/suggested", {
                credentials: "include",
            });
            const data = await res.json();
            if (data.error) return null;
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        enabled: !isMessagesPage && !!authUser, // Only fetch when user is authenticated and not on messages page
    });

    const { followUnfollow, isPending } = useFollow();
    const noSuggestions = !isLoading && (!suggestedUsers || suggestedUsers.length === 0);

    // Close panel when clicking or touching outside the panel or toggle
    useEffect(() => {
        if (isMobileCollapsed) return;
        const handler = (e) => {
            // If click was inside panel or on the toggle button, ignore
            if (panelRef.current && panelRef.current.contains(e.target)) return;
            if (toggleRef.current && toggleRef.current.contains(e.target)) return;
            setIsMobileCollapsed(true);
        };
        document.addEventListener("mousedown", handler);
        document.addEventListener("touchstart", handler);
        return () => {
            document.removeEventListener("mousedown", handler);
            document.removeEventListener("touchstart", handler);
        };
    }, [isMobileCollapsed]);

    return (
        <>
            {/* Mobile Toggle Button */}
            <div
                className={`lg:hidden fixed ${
                    isMessagesPage ? "bottom-20" : "bottom-6"
                } right-4 z-50 group`}
            >
                <button
                    className="bg-gradient-to-r from-purple-600 to-orange-500 text-white p-2 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center w-10 h-10"
                    ref={toggleRef}
                    onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
                    aria-label={getTooltipText()}
                    aria-expanded={!isMobileCollapsed}
                >
                    {!isMobileCollapsed ? (
                        <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    )}
                </button>

                {/* Tooltip */}
                {isMobileCollapsed && (
                    <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-gray-900/90 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap border border-gray-700/50">
                        {getTooltipText()}
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900/90"></div>
                    </div>
                )}
            </div>

            {/* Mobile Overlay when panel is open */}
            {!isMobileCollapsed && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                    onClick={() => setIsMobileCollapsed(true)}
                />
            )}

            {/* Right Panel */}
            <div
                ref={panelRef}
                className={`
                    ${isMobileCollapsed ? "translate-x-full lg:translate-x-0" : "translate-x-0"}
                    fixed lg:relative top-0 lg:top-0 right-0 z-50 lg:z-auto
                    pl-20 sm:pl-16 md:pl-20 lg:pl-0
                    ${
                        isMessagesPage
                            ? "lg:flex-[0_0_420px] lg:w-96"
                            : "lg:flex-[0_0_380px] lg:w-96"
                    }
                    flex flex-col my-0 lg:my-2 mx-0 lg:mx-2 ${mobilePanelWidthClass} h-screen gap-4
                    bg-black lg:bg-transparent
                    ${isMessagesPage ? "chat-no-scroll" : "overflow-y-auto"}
                    transform transition-transform duration-300 ease-in-out
                    px-1 sm:px-2 md:px-4 lg:px-0 py-2 lg:py-2 min-h-0 overflow-y-auto
                `}
            >
                {/* close button moved into panel headers and styled with gradient */}

                {isMessagesPage ? (
                    <div className="relative bg-gradient-to-br from-black/80 via-gray-900/50 to-purple-950/20 border border-purple-800/20 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl flex-1">
                        <div className="p-4 border-b border-gray-800/30 relative">
                            {/* Mobile close inside panel (messages) */}
                            <button
                                className="lg:hidden absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-orange-500 text-white p-2 rounded-full shadow-lg border border-white/10 w-9 h-9 flex items-center justify-center"
                                onClick={() => setIsMobileCollapsed(true)}
                                aria-label="Close messages panel"
                            >
                                <svg
                                    className="w-4 h-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="w-3 h-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></span>
                                Messages
                            </h3>
                        </div>
                        <UserListSidebar
                            authUser={authUser}
                            unreadUsers={unreadUsers}
                            activeChatUsername={activeChatUsername}
                            onUserSelect={handleUserSelect}
                        />
                    </div>
                ) : (
                    <div className="relative bg-gradient-to-br from-black/80 via-gray-900/50 to-purple-950/20 border border-purple-800/20 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl flex flex-col">
                        <div className="p-6 border-b border-gray-800/30 relative">
                            {/* Mobile close inside panel (who-to-follow) */}
                            <button
                                className="lg:hidden absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white p-2 rounded-full shadow-lg border border-white/10 w-9 h-9 flex items-center justify-center"
                                onClick={() => setIsMobileCollapsed(true)}
                                aria-label="Close who-to-follow panel"
                            >
                                <svg
                                    className="w-4 h-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="w-3 h-3 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full"></span>
                                Who to follow
                            </h3>
                        </div>

                        <div className="p-6 space-y-4 flex-grow">
                            {isLoading && (
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="animate-pulse flex items-center gap-3"
                                        >
                                            <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                                                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                                            </div>
                                            <div className="w-16 h-8 bg-gray-700 rounded-full"></div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isLoading && noSuggestions && (
                                <div className="text-center py-8 text-gray-400">
                                    <svg
                                        className="w-16 h-16 mx-auto mb-4 opacity-50"
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
                                    <p>No suggestions available</p>
                                </div>
                            )}

                            {!isLoading &&
                                suggestedUsers?.length > 0 &&
                                suggestedUsers.map((user) => (
                                    <div
                                        key={user._id}
                                        className="group flex items-center gap-4 p-4 rounded-xl bg-black/20 hover:bg-black/40 border border-gray-800/30 hover:border-purple-600/30 transition-all duration-300"
                                    >
                                        <Link
                                            to={`/profile/${user.username}`}
                                            className="flex items-center gap-3 flex-1"
                                        >
                                            <div className="w-12 h-12 rounded-full ring-2 ring-purple-600/20 ring-offset-2 ring-offset-black/50 overflow-hidden group-hover:ring-purple-500/40 transition-colors">
                                                <img
                                                    src={
                                                        createHighQualityProfileImage(
                                                            user.profileImg
                                                        ) || "/avatar-placeholder.png"
                                                    }
                                                    alt={`${user.fullName}'s avatar`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="font-semibold text-white truncate">
                                                    {user.fullName}
                                                </span>
                                                <span className="text-sm text-gray-400 truncate">
                                                    @{user.username}
                                                </span>
                                            </div>
                                        </Link>
                                        <button
                                            className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                followUnfollow(user._id);
                                            }}
                                            disabled={isPending}
                                        >
                                            {isPending ? (
                                                <svg
                                                    className="animate-spin h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                            ) : (
                                                "Follow"
                                            )}
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default RightPanel;
