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
            const res = await fetch("/api/auth/check-auth", {
                credentials: "include",
            });
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
        <div className="flex w-full bg-gradient-to-t from-black via-gray-900 to-black">
            <div className="flex-1 flex flex-col h-full w-full max-w-3xl mx-auto my-0 pt-0 lg:pt-0 mobile-safe-top bg-transparent border border-gray-800 shadow-2xl rounded-3xl p-6 backdrop-blur-xl main-card">
                {/* Profile user name */}
                {isProfileLoading && (
                    <p className="text-center text-gray-400 m-4">Loading user...</p>
                )}
                {isProfileError && (
                    <p className="text-center text-red-500 m-4">Failed to load user profile</p>
                )}
                {!isProfileLoading && profileUser && (
                    <h2 className="text-2xl font-bold m-4 text-white text-left">
                        {profileUser.fullName}
                    </h2>
                )}

                {/* Tabs */}
                <div className="flex w-full border-b border-gray-800 font-semibold mb-6">
                    <button
                        className={`flex-1 py-3 text-lg rounded-t-2xl transition-all duration-300 focus:outline-none ${
                            activeTab === "followers"
                                ? "bg-gradient-to-r from-purple-600/30 to-orange-600/30 text-white shadow"
                                : "text-gray-400 hover:bg-gray-900/30"
                        }`}
                        onClick={() => handleTabChange("followers")}
                    >
                        Followers
                    </button>
                    <button
                        className={`flex-1 py-3 text-lg rounded-t-2xl transition-all duration-300 focus:outline-none ${
                            activeTab === "following"
                                ? "bg-gradient-to-r from-purple-600/30 to-orange-600/30 text-white shadow"
                                : "text-gray-400 hover:bg-gray-900/30"
                        }`}
                        onClick={() => handleTabChange("following")}
                    >
                        Following
                    </button>
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

                <div className="divide-y divide-gray-800 max-h-[78vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-700/40 scrollbar-track-transparent">
                    {data?.map((user) => {
                        const following = isFollowing(user._id);
                        return (
                            <div
                                key={user._id}
                                className="flex justify-between items-center gap-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-purple-900/20 hover:to-orange-900/10 border border-gray-800/30 hover:border-purple-600/30 transition-all duration-300 mb-2 main-card"
                            >
                                <Link
                                    to={`/profile/${user.username}`}
                                    className="flex gap-4 items-center flex-1"
                                >
                                    <div className="w-14 h-14 rounded-full ring-2 ring-purple-600/30 ring-offset-2 ring-offset-black/50 overflow-hidden bg-black group-hover:ring-purple-500/50 transition-colors shadow-lg flex-shrink-0">
                                        <img
                                            src={user.profileImg || "/avatar-placeholder.png"}
                                            alt={user.fullName}
                                            className="w-full h-full object-cover object-center rounded-full"
                                        />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-white truncate">
                                            {user.fullName}
                                        </span>
                                        <span className="text-sm text-gray-400 truncate">
                                            @{user.username}
                                        </span>
                                    </div>
                                </Link>

                                {/* Follow/Unfollow Button */}
                                {authUser?._id !== user._id && (
                                    <button
                                        className={`py-2 px-6 rounded-full font-semibold text-sm transition-all duration-300 shadow-lg focus:outline-none bg-gradient-to-r ${
                                            following
                                                ? "from-gray-800 to-gray-900 text-gray-300 border border-purple-600/30 hover:from-purple-900/30 hover:to-orange-900/20"
                                                : "from-purple-600 to-orange-500 text-white hover:from-purple-700 hover:to-orange-600"
                                        }`}
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
        </div>
    );
};

export default FollowersFollowingPage;
