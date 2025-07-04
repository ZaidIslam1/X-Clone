import express from 'express';
import dotenv from 'dotenv';
import authRoutes from "./routes/auth.route.js"
import {connectDB} from "./config/connectDB.js"
import cookieParser from 'cookie-parser';

dotenv.config();
const PORT = process.env.PORT;

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
    res.status(500).json({ success: false, error: "Internal Server Error" });
});

app.listen(PORT, () => {
    connectDB();
    console.log(`✅ Server is running on port ${PORT}`);
});
