import { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Posts from "../../components/common/Posts";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import EditProfileModal from "./EditProfileModal";

import { FaArrowLeft } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import { FaLink } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useFollow from "../../hooks/useFollow";
import { createHighQualityCoverImage, createHighQualityProfileImage } from "../../utils/imageUtils";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatMemberSinceDate } from "../../utils/date/function";

const ProfilePage = () => {
    const queryClient = useQueryClient();

    const [coverImg, setCoverImg] = useState(null);
    const [profileImg, setProfileImg] = useState(null);
    const [feedType, setFeedType] = useState("posts");

    const coverImgRef = useRef(null);
    const profileImgRef = useRef(null);

    const { username } = useParams();
    const { data: authUser } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await fetch("/api/auth/check-auth", {
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Authentication failed");
            return data;
        },
    });

    const { followUnfollow, isPending } = useFollow();

    // Query to get user's posts count
    const { data: userPosts } = useQuery({
        queryKey: ["userPosts", username],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/posts/user/${username}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                return data;
            } catch (error) {
                return []; // Return empty array if error
            }
        },
        enabled: !!username, // Only run if username exists
    });

    const {
        data: user,
        isLoading,
        refetch,
        isRefetching,
        error,
    } = useQuery({
        queryKey: ["userProfile", username],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/users/profile/${username}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                if (!res.ok) throw new Error(data.error || "Failed to fetch user profile");
                return data;
            } catch (error) {
                throw new Error(error.message || "Failed to fetch user profile");
            }
        },
        enabled: !!username, // Only run if username exists
        retry: 1, // Only retry once on error
    });
    // Fix: Define amIFollowing to prevent ReferenceError
    const amIFollowing = authUser && user ? authUser.following?.includes(user._id) : false;

    const { mutate: updateProfilePic, isPending: uploadPicPending } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch(`/api/users/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ coverImg, profileImg }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to follow/unfollow");
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["userProfile", username] }),
                queryClient.invalidateQueries({ queryKey: ["authUser"] }),
            ]);
            setCoverImg(null);
            setProfileImg(null);
        },
    });

    useEffect(() => {
        refetch();
    }, [username, refetch]);

    const isMyProfile = authUser?._id === user?._id;

    const isFollowing = user?.followers?.includes(authUser?._id);

    // Fix: Define handleFollow to prevent ReferenceError
    const handleFollow = () => {
        if (!user || !authUser) return;
        followUnfollow(user._id, {
            onSuccess: () => {
                // Optionally refetch or invalidate queries for up-to-date UI
                refetch();
            },
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
    };

    const handleImgChange = (e, state) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                state === "coverImg" && setCoverImg(reader.result);
                state === "profileImg" && setProfileImg(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex w-full bg-gradient-to-t from-black via-gray-900 to-black">
            <div className="flex-1 flex flex-col h-full w-full max-w-3xl mx-auto my-2 pt-4 lg:pt-0 mobile-safe-top bg-transparent border border-gray-800 shadow-2xl rounded-3xl backdrop-blur-xl overflow-auto">
                {/* HEADER */}
                {(isLoading || isRefetching) && <ProfileHeaderSkeleton />}
                {error && (
                    <div className="text-center text-lg mt-4 p-4">
                        <p className="text-red-500">Error: {error.message}</p>
                        <button
                            onClick={() => refetch()}
                            className="mt-2 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}
                {!isLoading && !isRefetching && !error && !user && (
                    <p className="text-center text-lg mt-4">User not found</p>
                )}
                <div className="flex flex-col">
                    {!isLoading && !isRefetching && !error && user && (
                        <>
                            {/* Top bar - unified with tab style */}
                            <div className="flex w-full border-b border-gray-800 font-semibold sticky top-0 z-10 bg-gradient-to-r from-purple-600/30 to-orange-600/30 backdrop-blur-xl items-center p-4">
                                <Link to="/" className="mr-4">
                                    <FaArrowLeft className="w-5 h-5" />
                                </Link>
                                <div className="flex flex-col flex-1">
                                    <span className="text-lg font-semibold text-white leading-tight">
                                        {user?.fullName}
                                    </span>
                                </div>
                            </div>
                            {/* COVER IMG */}
                            {/* Modern Profile Header */}
                            <div className="relative">
                                {/* Cover Image/Background */}
                                <div className="relative group/cover h-48 sm:h-64 bg-gradient-to-br from-purple-900/10 via-gray-900/10 to-orange-900/10 overflow-hidden">
                                    {coverImg || user?.coverImg ? (
                                        <img
                                            src={
                                                coverImg ||
                                                createHighQualityCoverImage(user?.coverImg)
                                            }
                                            className="h-full w-full object-cover"
                                            alt="cover image"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-purple-600/20 via-gray-800 to-orange-600/20 flex items-center justify-center">
                                            <div className="text-6xl sm:text-8xl font-bold text-white/20 select-none">
                                                {user?.fullName
                                                    ? user.fullName[0].toUpperCase()
                                                    : user?.username?.[0]?.toUpperCase()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                                    {isMyProfile && (
                                        <button
                                            className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full transition-all duration-200 border border-gray-600/30 hover:border-purple-500/50"
                                            onClick={() => coverImgRef.current.click()}
                                        >
                                            <MdEdit className="w-5 h-5 text-white" />
                                        </button>
                                    )}
                                </div>

                                {/* Profile Info Section */}
                                <div className="relative px-6 pb-6">
                                    {/* Avatar */}
                                    <div className="flex items-end justify-between -mt-16 mb-4">
                                        <div className="relative group/avatar">
                                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-orange-500 p-1 shadow-xl">
                                                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                                    <img
                                                        src={
                                                            profileImg ||
                                                            createHighQualityProfileImage(
                                                                user?.profileImg
                                                            ) ||
                                                            "/avatar-placeholder.png"
                                                        }
                                                        alt={user?.fullName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                            {isMyProfile && (
                                                <button
                                                    className="absolute bottom-2 right-2 p-2 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors shadow-lg"
                                                    onClick={() => profileImgRef.current.click()}
                                                >
                                                    <MdEdit className="w-4 h-4 text-white" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 mb-4">
                                            {isMyProfile && (
                                                <button
                                                    className="bg-transparent border-2 border-purple-500 hover:bg-purple-500/10 text-purple-400 font-semibold py-2 px-6 rounded-full transition-all duration-200"
                                                    onClick={() =>
                                                        document
                                                            .getElementById("edit_profile_modal")
                                                            .showModal()
                                                    }
                                                >
                                                    Edit Profile
                                                </button>
                                            )}
                                            {!isMyProfile && (
                                                <button
                                                    className={`font-semibold py-2 px-6 rounded-full transition-all duration-200 ${
                                                        amIFollowing
                                                            ? "bg-transparent border-2 border-gray-600 hover:border-red-500 hover:text-red-400 text-gray-400"
                                                            : "bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white"
                                                    }`}
                                                    onClick={handleFollow}
                                                    disabled={isPending}
                                                >
                                                    {isPending
                                                        ? "Loading..."
                                                        : amIFollowing
                                                        ? "Unfollow"
                                                        : "Follow"}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div className="space-y-3">
                                        <div>
                                            <h1 className="text-2xl font-bold text-white">
                                                {user?.fullName}
                                            </h1>
                                            <p className="text-gray-400">@{user?.username}</p>
                                        </div>

                                        {user?.bio && (
                                            <p className="text-gray-300 leading-relaxed">
                                                {user.bio}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-6 text-sm text-gray-400">
                                            {user?.link && (
                                                <a
                                                    href={user.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 hover:text-purple-400 transition-colors"
                                                >
                                                    <FaLink className="w-4 h-4" />
                                                    {user.link}
                                                </a>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <IoCalendarOutline className="w-4 h-4" />
                                                <span>
                                                    {formatMemberSinceDate(user?.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-6 text-sm">
                                            <Link
                                                to={`/profile/${user?.username}/following`}
                                                className="hover:text-purple-400 transition-colors"
                                            >
                                                <span className="font-bold text-white">
                                                    {user?.following?.length || 0}
                                                </span>
                                                <span className="text-gray-400 ml-1">
                                                    Following
                                                </span>
                                            </Link>
                                            <Link
                                                to={`/profile/${user?.username}/followers`}
                                                className="hover:text-purple-400 transition-colors"
                                            >
                                                <span className="font-bold text-white">
                                                    {user?.followers?.length || 0}
                                                </span>
                                                <span className="text-gray-400 ml-1">
                                                    Followers
                                                </span>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Hidden Inputs */}
                                    <input
                                        type="file"
                                        hidden
                                        ref={coverImgRef}
                                        onChange={(e) => handleImgChange(e, "coverImg")}
                                    />
                                    <input
                                        type="file"
                                        hidden
                                        ref={profileImgRef}
                                        onChange={(e) => handleImgChange(e, "profileImg")}
                                    />
                                </div>
                            </div>

                            {(coverImg || profileImg) && (
                                <div className="flex justify-center p-4 border-t border-gray-800/30">
                                    <button
                                        className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                                        onClick={() => updateProfilePic()}
                                        disabled={uploadPicPending}
                                    >
                                        {uploadPicPending ? "Updating..." : "Update Profile"}
                                    </button>
                                </div>
                            )}

                            {/* Tabs - unified with Followers/Following style */}
                            <div className="flex w-full border-b border-gray-800 font-semibold mt-4 mb-2 bg-black/40">
                                <button
                                    className={`flex-1 py-3 text-lg rounded-t-2xl transition-all duration-300 focus:outline-none ${
                                        feedType === "posts"
                                            ? "bg-gradient-to-r from-purple-600/30 to-orange-600/30 text-white shadow"
                                            : "text-gray-400 hover:bg-gray-900/30"
                                    }`}
                                    onClick={() => setFeedType("posts")}
                                >
                                    Posts
                                </button>
                                <button
                                    className={`flex-1 py-3 text-lg rounded-t-2xl transition-all duration-300 focus:outline-none ${
                                        feedType === "likes"
                                            ? "bg-gradient-to-r from-purple-600/30 to-orange-600/30 text-white shadow"
                                            : "text-gray-400 hover:bg-gray-900/30"
                                    }`}
                                    onClick={() => setFeedType("likes")}
                                >
                                    Likes
                                </button>
                            </div>
                        </>
                    )}

                    <Posts feedType={feedType} username={username} />
                </div>
            </div>
        </div>
    );
};
export default ProfilePage;
