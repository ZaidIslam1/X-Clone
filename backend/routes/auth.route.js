import { Router } from "express";
import { signup, login, logout, checkAuth} from "../controllers/auth.controller.js"
import { protectRoute } from "../lib/middleware/protectRoute.js";

const router = Router();

router.get("/check-auth", protectRoute, checkAuth)
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;