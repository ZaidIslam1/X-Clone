import { Router } from "express";
import {
    getProfile,
    getSuggestedUsers,
    followUnfollowUser,
    updateUserProfile,
    getFollowers,
    getFollowing,
    getAllUsers,
    getMessages,
    getMutual,
    markMessagesRead,
    getUnreadUsers,
} from "../controllers/user.controller.js";
import { protectRoute } from "../lib/middleware/protectRoute.js";

const router = Router();

router.use(protectRoute);
router.get("/:username/followers", getFollowers);
router.get("/:username/following", getFollowing);
router.get("/profile/:username", getProfile);
router.get("/suggested", getSuggestedUsers);
router.post("/follow/:id", followUnfollowUser);
router.post("/update", updateUserProfile);
router.get("/all", getAllUsers);
router.get("/mutual", getMutual);

router.get("/messages/:userId", getMessages);
router.post("/messages/:userId/mark-read", markMessagesRead);
router.get("/unread-users", getUnreadUsers);

export default router;
