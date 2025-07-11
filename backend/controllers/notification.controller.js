import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.find({to: userId})
            .sort({createdAt: -1})
            .populate("from", "username profileImg")
        if (!notifications || notifications.length === 0) {
            return res.status(404).json({ error: "No notifications found" });
        }
        await Notification.updateMany(
            { to: userId},
            { read: true }
        );
        res.status(200).json(notifications);
    } catch (error) {
        console.log("Error in getNotifications", error.message);
        next(error);
    }
}

export const deleteNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;
        await Notification.deleteMany({ to: userId });
        res.status(200).json({ message: "All notifications deleted successfully" });
    } catch (error) {
        console.log("Error in deleteNotifications", error.message);
        next(error);
    }
}