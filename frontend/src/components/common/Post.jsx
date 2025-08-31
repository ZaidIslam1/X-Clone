import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import { createHighQualityPostImage, createHighQualityProfileImage } from "../../utils/imageUtils";
import { formatPostDate } from "../../utils/date/function";

const Post = ({ post }) => {
    const queryClient = useQueryClient();
    const [comment, setComment] = useState("");
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
    const commentsContainerRef = useRef(null);

    const { data: authUser } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await fetch("/api/auth/check-auth", { credentials: "include" });
            const data = await res.json();
            return data;
        },
    });

    const openCommentsModal = () => setIsCommentsModalOpen(true);
    const closeCommentsModal = () => setIsCommentsModalOpen(false);

    const { mutate: commentPost, isPending: commentPending } = useMutation({
        mutationFn: async (text) => {
            const res = await fetch(`/api/posts/comment/${post._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ text }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        onSuccess: (updatedPost) => {
            queryClient.setQueryData(["posts"], (oldData) =>
                oldData.map((p) =>
                    p._id === post._id ? { ...p, comments: updatedPost.comments } : p
                )
            );
            setTimeout(() => {
                if (commentsContainerRef.current) {
                    commentsContainerRef.current.scrollTop =
                        commentsContainerRef.current.scrollHeight;
                }
            }, 100);
        },
    });

    const { mutate: deleteComment } = useMutation({
        mutationFn: async (commentId) => {
            const res = await fetch(`/api/posts/comment/${post._id}/${commentId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        onSuccess: (updatedPost) => {
            queryClient.setQueryData(["posts"], (oldData) =>
                oldData.map((p) =>
                    p._id === post._id ? { ...p, comments: updatedPost.comments } : p
                )
            );
        },
    });

    const handlePostComment = (e) => {
        e.preventDefault();
        if (!comment.trim() || commentPending) return;
        commentPost(comment);
        setComment("");
    };

    const handleCommentKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            handlePostComment(e);
        }
    };

    const handleDeleteComment = (commentId) => deleteComment(commentId);

    // When the comments modal opens, scroll to bottom so latest comments are visible
    useEffect(() => {
        if (!isCommentsModalOpen) return;
        // small timeout to allow modal to mount and layout
        const t = setTimeout(() => {
            const el = commentsContainerRef.current;
            if (el) {
                // prefer smooth scroll when available
                if (typeof el.scrollTo === "function") {
                    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
                } else {
                    el.scrollTop = el.scrollHeight;
                }
            }
        }, 50);
        return () => clearTimeout(t);
    }, [isCommentsModalOpen, post.comments.length]);

    const handleLikePost = () => {
        if (!authUser) return toast.error("You must be logged in to like posts");
        likeMutation.mutate();
    };
    const handleRepost = () => {};
    const handleBookmark = () => {};

    const isLiked = Array.isArray(post.likes) && post.likes.includes(authUser?._id);

    const likeMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/posts/like/${post._id}`, {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Like failed");
            return data; // expected to be the updated post
        },
        onMutate: async () => {
            // cancel any outgoing refetches for posts queries
            await queryClient.cancelQueries({ queryKey: ["posts"] });

            // snapshot all posts-related queries so we can roll back
            const previous = queryClient.getQueriesData(["posts"]);

            // update only the matched post inside each cached posts list
            previous.forEach(([queryKey, data]) => {
                if (!Array.isArray(data)) return;

                // If this cached query is a 'likes' feed for the current user and we're unliking,
                // remove the post from that list optimistically.
                const isLikesFeedForMe =
                    Array.isArray(queryKey) &&
                    queryKey[0] === "posts" &&
                    queryKey[1] === "likes" &&
                    queryKey[2] === authUser?.username;

                if (isLikesFeedForMe && isLiked) {
                    const newData = data.filter((p) => p._id !== post._id);
                    queryClient.setQueryData(queryKey, newData);
                    return;
                }

                const newData = data.map((p) =>
                    p._id === post._id
                        ? {
                              ...p,
                              likes: isLiked
                                  ? Array.isArray(p.likes)
                                      ? p.likes.filter((id) => id !== authUser?._id)
                                      : []
                                  : Array.isArray(p.likes)
                                  ? [...p.likes, authUser?._id]
                                  : [authUser?._id],
                          }
                        : p
                );
                queryClient.setQueryData(queryKey, newData);
            });

            return { previous };
        },
        onError: (err, _vars, context) => {
            // restore each previous query
            if (context?.previous) {
                context.previous.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(err.message || "Could not update like");
        },
        onSuccess: (updatedPost) => {
            // Apply the server-canonical post to all posts lists that contain it.
            // Additionally, if this is the likes feed for the current user and the updated post
            // no longer includes the current user's id in likes, remove it from that list.
            const queries = queryClient.getQueriesData(["posts"]);
            queries.forEach(([queryKey, data]) => {
                if (!Array.isArray(data)) return;

                const isLikesFeedForMe =
                    Array.isArray(queryKey) &&
                    queryKey[0] === "posts" &&
                    queryKey[1] === "likes" &&
                    queryKey[2] === authUser?.username;

                const updatedHasLike =
                    Array.isArray(updatedPost.likes) && updatedPost.likes.includes(authUser?._id);
                if (isLikesFeedForMe && !updatedHasLike) {
                    const newData = data.filter((p) => p._id !== updatedPost._id);
                    queryClient.setQueryData(queryKey, newData);
                    return;
                }

                const newData = data.map((p) => (p._id === updatedPost._id ? updatedPost : p));
                queryClient.setQueryData(queryKey, newData);
            });
        },
        // intentionally avoid invalidating all posts queries to prevent full refetch
    });

    const postOwner = post.user;
    const formattedDate = formatPostDate(post.createdAt);

    return (
        <>
            {/* Post container */}
            <div className="mb-8 mx-2 sm:mx-4 bg-gradient-to-br from-black/80 via-gray-900/50 to-purple-950/20 border border-purple-800/20 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl shadow-purple-950/10 transition-all duration-300">
                {/* Header: Avatar, Name, Username, Time */}
                <div className="flex items-center gap-3 px-6 py-4">
                    <Link
                        to={`/profile/${postOwner.username}`}
                        className="w-10 h-10 rounded-full overflow-hidden"
                    >
                        <img
                            src={
                                createHighQualityProfileImage(postOwner.profileImg) ||
                                "/avatar-placeholder.png"
                            }
                            alt={`${postOwner.fullName}'s avatar`}
                        />
                    </Link>
                    <div className="flex flex-col">
                        <Link
                            to={`/profile/${postOwner.username}`}
                            className="font-bold text-white"
                        >
                            {postOwner.fullName}
                        </Link>
                        <span className="text-gray-400 text-sm">
                            @{postOwner.username} · {formattedDate}
                        </span>
                    </div>
                </div>

                {/* Post content */}
                <div className="px-6 py-2">
                    {post.text && (
                        <p className="text-white leading-relaxed text-base">{post.text}</p>
                    )}
                    {post.img && (
                        <div className="py-4 flex justify-center">
                            <img
                                src={createHighQualityPostImage(post.img)}
                                alt="Post image"
                                className="rounded-xl object-cover max-h-96 shadow-lg border border-gray-600/50"
                                style={{ maxWidth: "90%" }}
                                loading="lazy"
                            />
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 px-6 py-4 border-t border-gray-700/30 bg-black/10">
                    <div className="flex justify-center gap-6 flex-wrap">
                        <button
                            className="flex items-center gap-2 group cursor-pointer px-4 py-2 rounded-full bg-gradient-to-r from-purple-900/30 to-blue-900/10 hover:from-purple-800/40 hover:to-blue-800/20 transition-all duration-200 shadow-sm hover:scale-105"
                            onClick={openCommentsModal}
                            title="Comments"
                            type="button"
                        >
                            <FaRegComment className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                            <span className="text-sm text-gray-400 group-hover:text-blue-400 transition-colors">
                                {post.comments.length}
                            </span>
                        </button>
                        <button
                            className="flex items-center gap-2 group cursor-pointer px-4 py-2 rounded-full bg-gradient-to-r from-purple-900/30 to-green-900/10 hover:from-purple-800/40 hover:to-green-800/20 transition-all duration-200 shadow-sm hover:scale-105"
                            onClick={handleRepost}
                            title="Repost"
                            type="button"
                        >
                            <BiRepost className="w-6 h-6 text-gray-400 group-hover:text-green-400 transition-colors" />
                        </button>
                        <button
                            className="flex items-center gap-2 group cursor-pointer px-4 py-2 rounded-full bg-gradient-to-r from-purple-900/30 to-pink-900/10 hover:from-purple-800/40 hover:to-pink-800/20 transition-all duration-200 shadow-sm hover:scale-105"
                            onClick={handleLikePost}
                            title="Like"
                            type="button"
                        >
                            {isLiked ? (
                                <FaHeart className="w-5 h-5 text-pink-500" />
                            ) : (
                                <FaRegHeart className="w-5 h-5 text-gray-400 group-hover:text-pink-400 transition-colors" />
                            )}
                            <span
                                className={`text-sm transition-colors ${
                                    isLiked
                                        ? "text-pink-500"
                                        : "text-gray-400 group-hover:text-pink-400"
                                }`}
                            >
                                {post.likes.length}
                            </span>
                        </button>
                        <button
                            className="group cursor-pointer px-4 py-2 rounded-full bg-gradient-to-r from-purple-900/30 to-purple-900/10 hover:from-purple-800/40 hover:to-purple-800/20 transition-all duration-200 shadow-sm hover:scale-105 flex items-center"
                            onClick={handleBookmark}
                            title="Bookmark"
                            type="button"
                        >
                            <FaRegBookmark className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- COMMENT MODAL USING PORTAL --- */}
            {isCommentsModalOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pl-20 sm:pl-16 md:pl-20 lg:pl-0"
                        onClick={closeCommentsModal}
                    >
                        <div
                            className="relative flex flex-col w-full max-w-md bg-gradient-to-br from-black/80 via-gray-900/50 to-purple-950/20 border border-purple-800/20 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl shadow-purple-950/10 p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="btn btn-xs btn-circle absolute right-3 top-3"
                                onClick={closeCommentsModal}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                            <h3 className="font-bold text-lg mb-4">Comments</h3>

                            <div
                                ref={commentsContainerRef}
                                className="flex flex-col gap-3 max-h-60 overflow-auto"
                            >
                                {post.comments.length === 0 && (
                                    <p className="text-sm text-slate-500">
                                        No comments yet 🤔 Be the first one 😉
                                    </p>
                                )}
                                {post.comments.map((c) => {
                                    const isMyComment = c.user._id === authUser?._id;
                                    return (
                                        <div
                                            key={c._id}
                                            className="flex justify-between items-center gap-2 p-3 rounded-xl"
                                        >
                                            <div className="flex gap-2 items-start">
                                                <div className="avatar">
                                                    <div className="w-8 rounded-full">
                                                        <img
                                                            src={
                                                                createHighQualityProfileImage(
                                                                    c.user.profileImg
                                                                ) || "/avatar-placeholder.png"
                                                            }
                                                            alt={`${c.user.fullName}'s avatar`}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold">
                                                            {c.user.fullName}
                                                        </span>
                                                        <span className="text-gray-700 text-sm">
                                                            @{c.user.username}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm">{c.text}</div>
                                                </div>
                                            </div>
                                            {isMyComment && (
                                                <button
                                                    onClick={() => handleDeleteComment(c._id)}
                                                    className="text-gray-400 hover:text-red-500 ml-4 p-0"
                                                    aria-label="Delete comment"
                                                    style={{
                                                        border: "none",
                                                        background: "transparent",
                                                    }}
                                                >
                                                    <FaTrash className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <form
                                className="flex gap-3 items-end mt-4 border-t border-gray-700/30 pt-4"
                                onSubmit={handlePostComment}
                            >
                                <textarea
                                    className="w-full text-white text-base resize-none border-none focus:outline-none min-h-[48px] p-3 rounded-full bg-black/70 border border-gray-500/30 focus:border-purple-400/50 transition-colors backdrop-blur-md font-sans placeholder:font-sans placeholder:text-gray-600"
                                    placeholder={authUser ? "Add a comment..." : "Login to comment"}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    onKeyDown={handleCommentKeyDown}
                                    disabled={!authUser}
                                />
                                <button
                                    className="bg-gradient-to-r from-purple-600/90 to-orange-500/90 hover:from-purple-700 hover:to-orange-600 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none text-base"
                                    type="submit"
                                    disabled={!authUser || !comment.trim() || commentPending}
                                >
                                    {commentPending ? <LoadingSpinner size="sm" /> : "Comment"}
                                </button>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};

export default Post;
