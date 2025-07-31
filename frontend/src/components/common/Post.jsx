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
            try {
                const res = await fetch(`/api/posts/${post._id}`, {
                    method: "DELETE",
                });
                const data = await res.json();

                if (!res.ok) throw new Error(data.error);
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        onSuccess: () => {
            queryClient.setQueryData(["posts"], (oldData) => {
                return oldData.filter((p) => p._id !== post._id);
            });
            toast.success("Post deleted successfully");
        },
    });

    const { mutate: commentPost, isPending: commentPending } = useMutation({
        mutationFn: async (text) => {
            try {
                const res = await fetch(`/api/posts/comment/${post._id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        onSuccess: (updatedPost) => {
            queryClient.setQueryData(["posts"], (oldData) => {
                return oldData.map((p) => {
                    if (p._id === post._id) {
                        return { ...p, comments: updatedPost.comments };
                    }
                    return p;
                });
            });
        },
    });

    const { mutate: deleteComment, isPending: deleteCommentPending } = useMutation({
        mutationFn: async (commentId) => {
            try {
                const res = await fetch(`/api/posts/comment/${post._id}/${commentId}`, {
                    method: "DELETE",
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },

        onSuccess: (updatedPost) => {
            queryClient.setQueryData(["posts"], (oldData) => {
                return oldData.map((p) => {
                    if (p._id === post._id) {
                        return { ...p, comments: updatedPost.comments };
                    }
                    return p;
                });
            });
        },
    });

    const { mutate: likePost, isPending: likePending } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch(`/api/posts/like/${post._id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        onSuccess: (updatedLikes) => {
            queryClient.setQueryData(["posts"], (oldData) => {
                return oldData.map((p) => {
                    if (p._id === post._id) {
                        return { ...p, likes: updatedLikes };
                    }
                    return p;
                });
            });
            toast.success("Post liked successfully");
        },
    });

    const handleDeletePost = () => {
        deletePost();
    };

    const handlePostComment = (e) => {
        e.preventDefault();
        if (commentPending) return;
        if (!comment.trim()) return;
        commentPost(comment);
        setComment(""); // optionally clear after posting
    };

    // Handle Enter key for comment textarea
    const handleCommentKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handlePostComment(e);
        }
    };

    const handleDeleteComment = (commentId) => {
        deleteComment(commentId);
    };

    const handleLikePost = () => {
        if (likePending) return;
        likePost();
    };

    return (
        <>
            <div className="flex gap-2 items-start p-4 border-b border-gray-700">
                <div className="avatar">
                    <Link
                        to={`/profile/${postOwner.username}`}
                        className="w-8 rounded-full overflow-hidden"
                    >
                        {postOwner.profileImg ? (
                            <img src={postOwner.profileImg} alt={postOwner.fullName} />
                        ) : (
                            <div className="w-8 h-8 flex items-center justify-center bg-gray-700 text-white rounded-full text-lg font-bold">
                                {postOwner.fullName
                                    ? postOwner.fullName[0].toUpperCase()
                                    : postOwner.username[0].toUpperCase()}
                            </div>
                        )}
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
                                {!deletePending && (
                                    <FaTrash
                                        className="cursor-pointer hover:text-red-500"
                                        onClick={handleDeletePost}
                                    />
                                )}
                                {deletePending && <LoadingSpinner size="sm" />}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-3 overflow-hidden">
                        <span>{post.text}</span>
                        {post.img ? (
                            <img
                                src={post.img}
                                className="h-80 object-contain rounded-lg border border-gray-700"
                                alt="cover"
                            />
                        ) : (
                            <div className="h-80 flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-white text-5xl font-bold">
                                {postOwner.fullName
                                    ? postOwner.fullName[0].toUpperCase()
                                    : postOwner.username[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between mt-3">
                        <div className="flex gap-4 items-center w-2/3 justify-between">
                            <div
                                className="flex gap-1 items-center cursor-pointer group"
                                onClick={() =>
                                    document.getElementById("comments_modal" + post._id).showModal()
                                }
                            >
                                <FaRegComment className="w-4 h-4  text-slate-500 group-hover:text-sky-400" />
                                <span className="text-sm text-slate-500 group-hover:text-sky-400">
                                    {post.comments.length}
                                </span>
                            </div>
                            {/* We're using Modal Component from DaisyUI */}
                            <dialog
                                id={`comments_modal${post._id}`}
                                className="modal border-none outline-none"
                            >
                                <div className="modal-box rounded border border-gray-600">
                                    <h3 className="font-bold text-lg mb-4">COMMENTS</h3>
                                    <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                                        {post.comments.length === 0 && (
                                            <p className="text-sm text-slate-500">
                                                No comments yet 🤔 Be the first one 😉
                                            </p>
                                        )}
                                        {post.comments.map((comment) => {
                                            const isMyComment = comment.user._id === authUser._id;

                                            return (
                                                <div
                                                    key={comment._id}
                                                    className="flex justify-between items-center gap-2"
                                                    style={{ minHeight: "2.5rem" }} // ensures enough height for vertical alignment
                                                >
                                                    <div className="flex gap-2 items-start">
                                                        <div className="avatar">
                                                            <div className="w-8 rounded-full">
                                                                {comment.user.profileImg ? (
                                                                    <img
                                                                        src={
                                                                            comment.user.profileImg
                                                                        }
                                                                        alt={comment.user.fullName}
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 flex items-center justify-center bg-gray-700 text-white rounded-full text-lg font-bold">
                                                                        {comment.user.fullName
                                                                            ? comment.user.fullName[0].toUpperCase()
                                                                            : comment.user.username[0].toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-bold">
                                                                    {comment.user.fullName}
                                                                </span>
                                                                <span className="text-gray-700 text-sm">
                                                                    @{comment.user.username}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm">
                                                                {comment.text}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isMyComment && (
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteComment(comment._id)
                                                            }
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
                                            data-gramm="false"
                                            className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800"
                                            placeholder="Add a comment..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            onKeyDown={handleCommentKeyDown}
                                        />
                                        <button className="btn btn-primary rounded-full btn-sm text-white px-4">
                                            {commentPending ? (
                                                <LoadingSpinner size="sm" />
                                            ) : (
                                                "Comment"
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </dialog>
                            <div
                                className="flex gap-1 items-center cursor-pointer group"
                                onClick={handleLikePost}
                            >
                                {isLiked ? (
                                    <FaHeart className="w-4 h-4 text-red-500" />
                                ) : (
                                    <FaRegHeart className="w-4 h-4 text-slate-500 group-hover:text-pink-400" />
                                )}
                                <span className="text-sm text-slate-500 group-hover:text-pink-400">
                                    {post.likes.length}
                                </span>
                            </div>
                            <div className="flex w-1/3 justify-end gap-2 items-center">
                                <FaRegBookmark className="w-4 h-4 text-slate-500 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default Post;
