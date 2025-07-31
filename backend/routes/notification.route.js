import { Router } from "express";
import { protectRoute } from "../lib/middleware/protectRoute.js";
import {
    getNotifications,
    deleteNotifications,
    markNotificationsRead,
} from "../controllers/notification.controller.js";

const router = Router();
router.use(protectRoute);

router.get("/", getNotifications);
router.post("/mark-read", markNotificationsRead);
router.delete("/", deleteNotifications);

export default router;
