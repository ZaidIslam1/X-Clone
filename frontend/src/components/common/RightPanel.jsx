import { Link, useLocation } from "react-router-dom";
import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";
import { useQuery } from "@tanstack/react-query";
import useFollow from "../../hooks/useFollow";
import LoadingSpinner from "./LoadingSpinner";
import UserListSidebar from "./UserListSidebar";

const RightPanel = ({ authUser }) => {
    const location = useLocation();
    const isMessagesPage = location.pathname.startsWith("/chat/messages");

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
        <div className="hidden lg:flex flex-col my-4 mx-2 md:w-72 w-72 gap-4 sticky top-2 h-screen overflow-y-auto">
            {isMessagesPage ? (
                // Show UserListSidebar on messages page
                <div className="bg-[#16181C] rounded-md flex-1">
                    <UserListSidebar authUser={authUser} />
                </div>
            ) : (
                // Default Suggested Users Panel
                <div
                    className={`bg-[#16181C] p-4 rounded-md flex flex-col ${
                        noSuggestions ? "min-h-[150px]" : ""
                    }`}
                >
                    <p className="font-bold">Who to follow</p>
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
                                                        user.profileImg || "/avatar-placeholder.png"
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
                                            {isPending ? <LoadingSpinner size="sm" /> : "Follow"}
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
    );
};

export default RightPanel;
