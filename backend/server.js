import express from 'express';
import dotenv from 'dotenv';
import authRoutes from "./routes/auth.route.js"
import {connectDB} from "./config/connectDB.js"

dotenv.config();
const PORT = process.env.PORT;

const app = express();
app.use(express.json())

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    connectDB();
    console.log(`✅ Server is running on port ${PORT}`);
});
