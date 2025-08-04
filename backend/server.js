import express from "express";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";

import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import cors from "cors";
import { initializeSocket } from "./config/socket.js";

dotenv.config();

const cloudinaryConfig = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
};

const PORT = process.env.PORT;
const app = express();

// Performance monitoring middleware
app.use((req, res, next) => {
    req.startTime = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - req.startTime;
        if (duration > 1000) {
            // Log slow requests
            console.log(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
        }
    });
    next();
});

const __dirname = path.resolve();
cloudinaryConfig();
const originUrl =
    process.env.NODE_ENV === "production" ? process.env.CLIENT_URL : "http://localhost:3000";

app.use(
    cors({
        origin: originUrl,
        credentials: true,
    })
);

const httpServer = createServer(app);
initializeSocket(httpServer, originUrl);

app.use(
    express.json({
        limit: "50mb",
        parameterLimit: 50000,
        extended: true,
    })
);
app.use(
    express.urlencoded({
        extended: true,
        limit: "50mb",
        parameterLimit: 50000,
    })
);
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

app.use((err, req, res, next) => {
    res.status(500).json({ success: false, error: "Internal Server Error" });
});

httpServer.listen(PORT, () => {
    connectDB();
    console.log(`✅ Server is running on port ${PORT}`);
});
