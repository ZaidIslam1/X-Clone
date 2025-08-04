import Notification from "../models/notification.model.js";
import { createTinyImageUrl } from "../lib/utils/imageUtils.js";

export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.find({ to: userId })
            .sort({ createdAt: -1 })
            .populate("from", "username profileImg");

        // Optimize notification images for fast scrolling
        const optimizedNotifications = notifications.map((notification) => ({
            ...notification._doc,
            from: {
                ...notification.from._doc,
                profileImg: notification.from.profileImg
                    ? createTinyImageUrl(notification.from.profileImg)
                    : notification.from.profileImg,
            },
        }));

        // Do not mark as read here; let frontend do it after display
        res.status(200).json(optimizedNotifications);
    } catch (error) {
        console.log("Error in getNotifications", error.message);
        next(error);
    }
};

export const markNotificationsRead = async (req, res, next) => {
    try {
        const userId = req.user._id;
        await Notification.updateMany({ to: userId, read: false }, { read: true });
        res.status(200).json({ message: "Notifications marked as read" });
    } catch (error) {
        console.log("Error in markNotificationsRead", error.message);
        next(error);
    }
};

export const deleteNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;
        await Notification.deleteMany({ to: userId });
        res.status(200).json({ message: "All notifications deleted successfully" });
    } catch (error) {
        console.log("Error in deleteNotifications", error.message);
        next(error);
    }
};
