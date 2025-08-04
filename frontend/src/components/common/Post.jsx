import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date/function";
import { createHighQualityPostImage, createHighQualityProfileImage } from "../../utils/imageUtils";

const Post = ({ post }) => {
    const queryClient = useQueryClient();
    const [comment, setComment] = useState("");
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
    const dialogRef = useRef(null);
    const commentsContainerRef = useRef(null);
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

    const postOwner = post.user;
    const isLiked = post.likes.includes(authUser._id);
    const isMyPost = authUser._id === post.user._id;
    const formattedDate = formatPostDate(post.createdAt);

    // --- Mutations ---
    const { mutate: deletePost, isPending: deletePending } = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/posts/${post._id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            queryClient.setQueryData(["posts"], (oldData) =>
                oldData.filter((p) => p._id !== post._id)
            );
            toast.success("Post deleted successfully");
        },
    });

    const { mutate: commentPost, isPending: commentPending } = useMutation({
        mutationFn: async (text) => {
            const res = await fetch(`/api/posts/comment/${post._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        onSuccess: (updatedPost) => {
            onSuccess: (updatedPost) => {
                queryClient.setQueryData(["posts"], (oldData) =>
                    oldData.map((p) =>
                        p._id === post._id ? { ...p, comments: updatedPost.comments } : p
                    )
                );
                // Scroll to bottom of comments after successful comment submission
                setTimeout(() => {
                    if (commentsContainerRef.current) {
                        commentsContainerRef.current.scrollTop =
                            commentsContainerRef.current.scrollHeight;
                    }
                }, 100);
            },
                // Scroll to bottom of comments after successful comment submission
                setTimeout(() => {
                    if (commentsContainerRef.current) {
                        commentsContainerRef.current.scrollTop =
                            commentsContainerRef.current.scrollHeight;
                    }
                }, 100);
        },
    });

    const { mutate: deleteComment, isPending: deleteCommentPending } = useMutation({
        mutationFn: async (commentId) => {
            const res = await fetch(`/api/posts/comment/${post._id}/${commentId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        // No onSuccess needed: real-time socket event will update the cache
    });

    const { mutate: likePost, isPending: likePending } = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/posts/like/${post._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        onSuccess: (updatedLikes) => {
            queryClient.setQueryData(["posts"], (oldData) =>
                oldData.map((p) => (p._id === post._id ? { ...p, likes: updatedLikes } : p))
            );
        },
    });

    // --- Handlers ---
    const handleDeletePost = () => deletePost();
    const handlePostComment = (e) => {
        e.preventDefault();
        if (!comment.trim() || commentPending) return;
        commentPost(comment);
        setComment("");
    };
    const handleCommentKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handlePostComment(e);
        }
    };
    const handleDeleteComment = (commentId) => deleteComment(commentId);
    const handleLikePost = () => !likePending && likePost();
    const handleRepost = () => toast("Repost feature coming soon!");
    const handleBookmark = () => toast("Bookmark feature coming soon!");
    // Modal open/close helpers
    const openCommentsModal = () => setIsCommentsModalOpen(true);
    const closeCommentsModal = () => setIsCommentsModalOpen(false);

    return (
        <div className="flex gap-2 items-start p-3 sm:p-4 border-b border-gray-700">
            {/* Avatar */}
            <div className="avatar flex-shrink-0">
                <Link
                    to={`/profile/${postOwner.username}`}
                    className="w-8 h-8 rounded-full overflow-hidden"
                >
                    <img
                        src={
                            createHighQualityProfileImage(postOwner.profileImg) ||
                            "/avatar-placeholder.png"
                        }
                    />
                </Link>
            </div>

            {/* Post Content */}
            <div className="flex flex-col flex-1">
                {/* Header */}
                <div className="flex gap-2 items-center">
                    <Link to={`/profile/${postOwner.username}`} className="font-bold">
                        {postOwner.fullName}
                    </Link>
                    <span className="text-gray-700 flex gap-1 text-sm">
                        <Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
                        <span>·</span>
                        <span>{formattedDate}</span>
                    </span>
                    {isMyPost && (
                        <span className="flex justify-end flex-1">
                            {!deletePending ? (
                                <FaTrash
                                    className="cursor-pointer hover:text-red-500"
                                    onClick={handleDeletePost}
                                />
                            ) : (
                                <LoadingSpinner size="sm" />
                            )}
                        </span>
                    )}
                </div>

                {/* Text & Image */}
                <div className="flex flex-col gap-3 overflow-hidden">
                    <span>{post.text}</span>
                    {post.img && (
                        <img
                            src={createHighQualityPostImage(post.img)}
                            className="post-image h-60 sm:h-80 object-contain rounded-lg border border-gray-700 w-full max-w-full"
                            alt=""
                            style={{
                                imageRendering: "crisp-edges",
                                imageRendering: "-webkit-optimize-contrast",
                                backfaceVisibility: "hidden",
                                transform: "translateZ(0)",
                            }}
                            loading="lazy"
                        />
                    )}
                </div>

                {/* --- ACTION ICON ROW --- */}
                <div className="flex justify-around items-center mt-3 text-slate-500 text-sm">
                    {/* Comment */}
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:text-sky-400"
                        onClick={openCommentsModal}
                    >
                        <FaRegComment className="w-5 h-5" />
                        <span>{post.comments.length}</span>
                    </div>

                    {/* Repost */}
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:text-green-500"
                        onClick={handleRepost}
                    >
                        <BiRepost className="w-6 h-6" />
                    </div>

                    {/* Like */}
                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={handleLikePost}
                    >
                        {isLiked ? (
                            <FaHeart className="w-5 h-5 text-red-500" />
                        ) : (
                            <FaRegHeart className="w-5 h-5 group-hover:text-pink-400" />
                        )}
                        <span className="group-hover:text-pink-400">{post.likes.length}</span>
                    </div>

                    {/* Bookmark */}
                    <div className="flex items-center gap-2 cursor-pointer hover:text-yellow-400">
                        <FaRegBookmark className="w-5 h-5" onClick={handleBookmark} />
                    </div>
                </div>

                {/* --- COMMENT MODAL --- */}
                <dialog
                    ref={dialogRef}
                    open={isCommentsModalOpen}
                    className="modal border-none outline-none"
                    onClose={closeCommentsModal}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeCommentsModal();
                    }}
                >
                    <div
                        className="modal-box rounded border border-gray-600"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="btn btn-xs btn-circle absolute right-2 top-2"
                            onClick={closeCommentsModal}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                        <h3 className="font-bold text-lg mb-4">COMMENTS</h3>

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
                                const isMyComment = c.user._id === authUser._id;
                                return (
                                    <div
                                        key={c._id}
                                        className="flex justify-between items-center gap-2"
                                        style={{ minHeight: "2.5rem" }}
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
                                                {deleteCommentPending ? (
                                                    <LoadingSpinner size="sm" />
                                                ) : (
                                                    <FaTrash className="w-3 h-3" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <form
                            className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-2"
                            onSubmit={handlePostComment}
                        >
                            <textarea
                                className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800"
                                placeholder="Add a comment..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                onKeyDown={handleCommentKeyDown}
                            />
                            <button className="btn btn-primary rounded-full btn-sm text-white px-4">
                                {commentPending ? <LoadingSpinner size="sm" /> : "Comment"}
                            </button>
                        </form>
                    </div>
                </dialog>
            </div>
        </div>
    );
};
export default Post;
