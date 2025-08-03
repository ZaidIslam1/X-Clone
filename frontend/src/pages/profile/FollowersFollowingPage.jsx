import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import useFollow from "../../hooks/useFollow";

const FollowersFollowingPage = () => {
    const { username, tab } = useParams();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState(tab === "following" ? "following" : "followers");

    useEffect(() => {
        if (tab !== activeTab) {
            setActiveTab(tab === "following" ? "following" : "followers");
        }
    }, [tab]);

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        navigate(`/profile/${username}/${newTab}`);
    };

    // --- New: Fetch profile user to display their name ---
    const {
        data: profileUser,
        isLoading: isProfileLoading,
        isError: isProfileError,
    } = useQuery({
        queryKey: ["userProfile", username],
        queryFn: async () => {
            const res = await fetch(`/api/users/profile/${username}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        retry: false,
    });

    // Fetch followers/following list
    const { data, isLoading, isError } = useQuery({
        queryKey: [activeTab, username],
        queryFn: async () => {
            const res = await fetch(`/api/users/${username}/${activeTab}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        keepPreviousData: true,
    });

    // Fetch auth user
    const { data: authUser } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await fetch("/api/auth/check-auth");
            const data = await res.json();
            if (data.error) return null;
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        retry: false,
    });

    const { followUnfollow, isPending } = useFollow();

    const isFollowing = (userId) => {
        return authUser?.following?.includes(userId);
    };

    return (
        <div className="flex-[4_4_0] border-l border-r border-gray-700 h-screen mobile-page-container p-4">
            {/* NEW: Show profile user name */}
            {isProfileLoading && <p className="text-center text-gray-400 mb-4">Loading user...</p>}
            {isProfileError && (
                <p className="text-center text-red-500 mb-4">Failed to load user profile</p>
            )}
            {!isProfileLoading && profileUser && (
                <h2 className="text-2xl font-bold mb-4">{profileUser.fullName}</h2>
            )}

            {/* Tabs */}
            <div className="flex w-full border-b border-gray-700 font-semibold mb-4">
                <div
                    className={`flex justify-center flex-1 p-3 cursor-pointer relative hover:bg-secondary transition duration-300 ${
                        activeTab === "followers" ? "white" : "text-gray-500"
                    }`}
                    onClick={() => handleTabChange("followers")}
                >
                    Followers
                    {activeTab === "followers" && (
                        <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary"></div>
                    )}
                </div>
                <div
                    className={`flex justify-center flex-1 p-3 cursor-pointer relative hover:bg-secondary transition duration-300 ${
                        activeTab === "following" ? "white" : "text-gray-500"
                    }`}
                    onClick={() => handleTabChange("following")}
                >
                    Following
                    {activeTab === "following" && (
                        <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary"></div>
                    )}
                </div>
            </div>

            {isLoading && (
                <div className="flex justify-center mt-10">
                    <LoadingSpinner size="lg" />
                </div>
            )}

            {isError && (
                <div className="text-center text-red-500 mt-10">Failed to load users 😓</div>
            )}

            {!isLoading && data?.length === 0 && (
                <div className="text-center text-gray-400 mt-10">No {activeTab} yet 🤔</div>
            )}

            <div className="divide-y divide-gray-800">
                {data?.map((user) => {
                    const following = isFollowing(user._id);

                    return (
                        <div
                            key={user._id}
                            className="flex justify-between items-center gap-4 p-4 hover:bg-gray-900 transition"
                        >
                            <Link
                                to={`/profile/${user.username}`}
                                className="flex gap-4 items-center flex-1"
                            >
                                <div className="avatar">
                                    <div className="w-10 h-10 rounded-full">
                                        <img src={user.profileImg || "/avatar-placeholder.png"} />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold">{user.fullName}</span>
                                    <span className="text-sm text-gray-500">@{user.username}</span>
                                </div>
                            </Link>

                            {/* Follow/Unfollow Button */}
                            {authUser?._id !== user._id && (
                                <button
                                    className="btn btn-outline rounded-full btn-sm"
                                    onClick={() => followUnfollow(user._id)}
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <LoadingSpinner size="sm" />
                                    ) : following ? (
                                        "Unfollow"
                                    ) : (
                                        "Follow"
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FollowersFollowingPage;
