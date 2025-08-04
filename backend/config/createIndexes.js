import mongoose from "mongoose";

export const createIndexes = async () => {
    try {
        const db = mongoose.connection.db;

        // User collection indexes
        await db.collection("users").createIndex({ username: 1 }, { unique: true });
        await db.collection("users").createIndex({ email: 1 }, { unique: true });
        await db.collection("users").createIndex({ following: 1 });
        await db.collection("users").createIndex({ followers: 1 });

        // Post collection indexes
        await db.collection("posts").createIndex({ user: 1 });
        await db.collection("posts").createIndex({ createdAt: -1 });
        await db.collection("posts").createIndex({ user: 1, createdAt: -1 });

        // Notification collection indexes
        await db.collection("notifications").createIndex({ to: 1 });
        await db.collection("notifications").createIndex({ to: 1, createdAt: -1 });
        await db.collection("notifications").createIndex({ to: 1, read: 1 });

        console.log("✅ Database indexes created successfully");
    } catch (error) {
        console.log("⚠️ Error creating indexes (they may already exist):", error.message);
    }
};
