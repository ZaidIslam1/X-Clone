import { Router} from "express";
import { getProfile, getSuggestedUsers, followUnfollowUser, updateUserProfile } from "../controllers/user.controller.js";
import { protectRoute } from "../lib/middleware/protectRoute.js";
import User from "../models/user.model.js";
const router = Router();

router.use(protectRoute);

router.get("/profile/:username", getProfile);
router.get("/suggested", getSuggestedUsers);
router.post("/follow/:id", followUnfollowUser);
router.post("/update", updateUserProfile);

// For developers to fetch all users
router.get("/all", async (req, res, next) => {
    try {
        const users = await User.find({}, "-password").sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        console.log("Error in fetching all users", error.message);
        next(error);
    }   
})

export default router;