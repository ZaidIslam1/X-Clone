import { Router } from "express";
import { protectRoute } from "../lib/middleware/protectRoute.js";
import { getNotifications, deleteNotifications } from "../controllers/notification.controller.js";

const router = Router();
router.use(protectRoute)

router.get("/", getNotifications);
router.delete("/", deleteNotifications);

export default router;