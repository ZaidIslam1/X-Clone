import mongoose from "mongoose";
import { createIndexes } from "./createIndexes.js";

export const connectDB = async () => {
    try {
        // Optimize MongoDB connection
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });

        console.log(`Mongo Connected ${conn.connection.host}`);

        // Create database indexes for better performance
        await createIndexes();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
