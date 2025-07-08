import { Router } from "express";
import { createPost, deletePost, likeUnlikePost, commentPost, getLikedPosts, getFollowingPosts, getUserPosts } from "../controllers/post.controller.js";
import { protectRoute } from "../lib/middleware/protectRoute.js";
import Post from "../models/post.model.js";

const router = Router();
router.use(protectRoute);

router.post("/create", createPost);
router.post("/like/:id", likeUnlikePost);
router.post("/comment/:id", commentPost);

router.delete("/:id", deletePost);

router.get("/likes/:id", getLikedPosts);
router.get("/following", getFollowingPosts)
router.get("/user/:username", getUserPosts);
router.get("/all", async (req, res, next) => {
    try {
       const posts = await Post.find({})
        .sort({ createdAt: -1 })
        .populate("user", "-password")
        .populate("comments.user", "-password")

        if (!posts || posts.length === 0) {
            return res.status(404).json({ error: "No posts found" });
        }
        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in fetching all posts", error.message);
        next(error);
    }
});

export default router;