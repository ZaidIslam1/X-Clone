import { Router } from "express";
import {
    createPost,
    deletePost,
    likeUnlikePost,
    commentPost,
    getLikedPosts,
    getFollowingPosts,
    getUserPosts,
    deleteComment,
} from "../controllers/post.controller.js";
import { protectRoute } from "../lib/middleware/protectRoute.js";
import Post from "../models/post.model.js";
import {
    optimizeImageUrl,
    createTinyImageUrl,
    createSmallImageUrl,
} from "../lib/utils/imageUtils.js";

const router = Router();
router.use(protectRoute);

router.post("/create", createPost);
router.post("/like/:id", likeUnlikePost);
router.post("/comment/:id", commentPost);
router.delete("/comment/:postId/:commentId", deleteComment);
router.delete("/:id", deletePost);
router.get("/likes/:username", getLikedPosts);
router.get("/following", getFollowingPosts);
router.get("/user/:username", getUserPosts);
router.get("/all", async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Reduced from 20 to 10
        const skip = (page - 1) * limit;

        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("user", "username fullName profileImg") // Exclude coverImg completely
            .populate({
                path: "comments.user",
                select: "username fullName profileImg", // Exclude coverImg completely
                options: { limit: 5 }, // Limit comments per post
            })
            .lean(); // Use lean() for better performance

        // Optimize image URLs to reduce size - ULTRA LIGHTWEIGHT for scrolling
        const optimizedPosts = posts.map((post) => ({
            ...post,
            user: {
                ...post.user,
                profileImg: post.user.profileImg
                    ? createTinyImageUrl(post.user.profileImg)
                    : post.user.profileImg,
            },
            comments: post.comments.map((comment) => ({
                ...comment,
                user: {
                    ...comment.user,
                    profileImg: comment.user.profileImg
                        ? createTinyImageUrl(comment.user.profileImg)
                        : comment.user.profileImg,
                },
            })),
            img: post.img ? createSmallImageUrl(post.img) : post.img,
        }));

        res.status(200).json(optimizedPosts);
    } catch (error) {
        console.log("Error in fetching all posts", error.message);
        next(error);
    }
});

export default router;
