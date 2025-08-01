import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import { v2 as cloudinary } from "cloudinary";
import { getSocketIO } from "../config/globalSocket.js";

export const createPost = async (req, res, next) => {
    try {
        const { text } = req.body;
        let { img } = req.body;
        const userId = req.user._id.toString();
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (!text && !img) {
            return res.status(400).json({ error: "Text or image is required" });
        }

        if (img) {
            const response = await cloudinary.uploader.upload(img);
            img = response.secure_url;
        }

        const newPost = new Post({
            user: userId,
            text: text ? text.trim() : "",
            img,
        });

        await newPost.save();
        // Always populate user and comments for real-time update
        const populatedPost = await Post.findById(newPost._id)
            .populate("user", "-password")
            .populate("comments.user", "-password");
        // Emit real-time event for new post
        try {
            const io = getSocketIO();
            if (io) {
                io.emit("new_post", { post: populatedPost });
            }
        } catch (e) {
            console.log("Socket emit error (new_post):", e.message);
        }
        res.status(201).json(populatedPost);
    } catch (error) {
        console.log("Error in createPost", error.message);
        next(error);
    }
};

export const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "You are not authorized to delete this post" });
        }

        if (post.img) {
            await cloudinary.uploader.destroy(post.img.split("/").pop().split(".")[0]);
        }

        await Post.findByIdAndDelete(id);
        // Emit real-time event for post deletion
        try {
            const io = getSocketIO();
            if (io) {
                io.emit("delete_post", { postId: id });
            }
        } catch (e) {
            console.log("Socket emit error (delete_post):", e.message);
        }
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.log("Error in deletePost", error.message);
        next(error);
    }
};

export const likeUnlikePost = async (req, res, next) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            // Unlike
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
        } else {
            // Like
            await Post.updateOne({ _id: postId }, { $push: { likes: userId } });
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });

            if (userId.toString() !== post.user.toString()) {
                const newNotification = new Notification({
                    from: userId,
                    to: post.user,
                    type: "like",
                });
                await newNotification.save();
                // Emit socket event for new like notification only to recipient
                const io = getSocketIO();
                if (io && io.userSockets) {
                    const recipientSocketId = io.userSockets.get(post.user.toString());
                    if (recipientSocketId) {
                        io.to(recipientSocketId).emit("new_like", {
                            to: post.user.toString(),
                            from: userId.toString(),
                            postId: post._id.toString(),
                        });
                    }
                }
            }
            // Emit socket event for new comment notification only to recipient
            const io = getSocketIO();
            if (io && io.userSockets) {
                const recipientSocketId = io.userSockets.get(post.user.toString());
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit("new_comment", {
                        to: post.user.toString(),
                        from: userId.toString(),
                        postId: post._id.toString(),
                    });
                }
            }
        }
        // Fetch the updated post to get fresh likes
        const updatedPost = await Post.findById(postId);
        res.status(200).json(updatedPost.likes);
    } catch (error) {
        console.log("Error in likeUnlikePost", error.message);
        next(error);
    }
};

export const commentPost = async (req, res, next) => {
    try {
        const { text } = req.body;
        const { id } = req.params;
        const userId = req.user._id;

        if (!text) {
            return res.status(400).json({ error: "Comment text is required" });
        }
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        const comment = {
            text,
            user: userId,
        };

        post.comments.push(comment);
        await post.save();

        if (userId.toString() !== post.user.toString()) {
            const newNotification = new Notification({
                from: userId,
                to: post.user,
                type: "comment",
                post: post._id,
            });
            await newNotification.save();
            // Emit socket event for new comment notification only to recipient, include postId for navigation
            const io = getSocketIO();
            if (io && io.userSockets) {
                const recipientSocketId = io.userSockets.get(post.user.toString());
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit("new_comment", {
                        to: post.user.toString(),
                        from: userId.toString(),
                        postId: post._id.toString(),
                    });
                }
            }
        }

        // Always populate user and comments for real-time update
        const updatedPost = await Post.findById(id)
            .populate("user", "-password")
            .populate("comments.user", "-password");

        // Emit real-time event for new comment (update all feeds) with full post
        try {
            const io = getSocketIO();
            if (io) {
                io.emit("new_comment", { postId: id, post: updatedPost });
            }
        } catch (e) {
            console.log("Socket emit error (new_comment):", e.message);
        }
        res.status(200).json(updatedPost);
    } catch (error) {
        console.log("Error in commentPost", error.message);
        next(error);
    }
};

export const deleteComment = async (req, res, next) => {
    try {
        const { postId, commentId } = req.params;
        const userId = req.user._id;

        const result = await Post.updateOne(
            { _id: postId },
            { $pull: { comments: { _id: commentId, user: userId } } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Comment not found or unauthorized" });
        }

        const updatedPost = await Post.findById(postId).populate("comments.user", "-password");
        res.status(200).json(updatedPost);
    } catch (error) {
        console.log("Error in deleteComment", error.message);
        next(error);
    }
};

export const getLikedPosts = async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }); // ✅ Use username, not userId
        if (!user) {
            return res.status(404).json({ error: "User not found" }); // 404 is better here
        }

        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
            .sort({ createdAt: -1 })
            .populate("user", "-password")
            .populate("comments.user", "-password");

        res.status(200).json(likedPosts);
    } catch (error) {
        console.log("Error in getLikedPosts", error.message);
        next(error);
    }
};

export const getFollowingPosts = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        const followingIds = user.following;
        const followingPosts = await Post.find({ user: { $in: followingIds } })
            .sort({ createdAt: -1 })
            .populate("user", "-password")
            .populate("comments.user", "-password");

        res.status(200).json(followingPosts);
    } catch (error) {
        console.log("Error in getFollowingPosts", error.message);
        next(error);
    }
};

export const getUserPosts = async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).select("-password -__v");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const userPosts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate("user", "-password")
            .populate("comments.user", "-password");

        res.status(200).json(userPosts);
    } catch (error) {
        console.log("Error in getUserPosts", error.message);
        next(error);
    }
};
