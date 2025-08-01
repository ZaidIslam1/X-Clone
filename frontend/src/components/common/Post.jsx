import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date/function";

const Post = ({ post }) => {
    const queryClient = useQueryClient();

    const [comment, setComment] = useState("");
    const { data: authUser } = useQuery({ queryKey: ["authUser"] });
    const postOwner = post.user;
    const isLiked = post.likes.includes(authUser._id);
    const isMyPost = authUser._id === post.user._id;
    const formattedDate = formatPostDate(post.createdAt);

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
            queryClient.setQueryData(["posts"], (oldData) =>
                oldData.map((p) =>
                    p._id === post._id ? { ...p, comments: updatedPost.comments } : p
                )
            );
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
        onSuccess: (updatedPost) => {
            queryClient.setQueryData(["posts"], (oldData) =>
                oldData.map((p) =>
                    p._id === post._id ? { ...p, comments: updatedPost.comments } : p
                )
            );
        },
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

    return (
        <div className="flex gap-2 items-start p-4 border-b border-gray-700">
            <div className="avatar">
                <Link
                    to={`/profile/${postOwner.username}`}
                    className="w-8 rounded-full overflow-hidden"
                >
                    <img src={postOwner.profileImg || "/avatar-placeholder.png"} />
                </Link>
            </div>

            <div className="flex flex-col flex-1">
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

                <div className="flex flex-col gap-3 overflow-hidden">
                    <span>{post.text}</span>
                    {post.img && (
                        <img
                            src={post.img}
                            className="h-80 object-contain rounded-lg border border-gray-700"
                            alt=""
                        />
                    )}
                </div>

                {/* --- NEW CLEAN ICON ROW --- */}
                <div className="flex justify-around items-center mt-3 text-slate-500 text-sm">
                    {/* Comment */}
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:text-sky-400"
                        onClick={() =>
                            document.getElementById("comments_modal" + post._id).showModal()
                        }
                    >
                        <FaRegComment className="w-5 h-5" />
                        <span>{post.comments.length}</span>
                    </div>

                    {/* Repost */}
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:text-green-500"
                        onClick={handleRepost}
                    >
                        <BiRepost className="w-5 h-5" />
                        <span></span>
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
                        <FaRegBookmark className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Post;
