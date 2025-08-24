import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req, res, next) => {
    try {
        const { email, fullName, password, username } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log(email);
            return res.status(400).json({ error: "Invalid Email Format" });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ error: "Username is already taken" });
        }
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already taken" });
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&-])[A-Za-z\d@$!%*?&-]{6,}$/;

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                error: "Password must be at least 6 characters and include uppercase, lowercase, number, and special character.",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword,
        });

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg,
                bio: newUser.bio,
                link: newUser.link,
                followers: newUser.followers,
                following: newUser.following,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
            });
        } else {
            res.status(400).json({ error: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in signup", error.message);
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "Invalid username or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
            bio: user.bio,
            link: user.link,
            followers: user.followers,
            following: user.following,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    } catch (error) {
        console.log("Error in login", error.message);
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        res.cookie("jwt", "", {
            maxAge: 0,
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout", error.message);
        next(error);
    }
};

export const checkAuth = async (req, res, next) => {
    try {
        if (!req.user) {
            // req.user is set by the protectRoute middleware
            console.log("User not authenticated");
            return res.status(401).json({ error: "Unauthorized access" });
        }
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth", error.message);
        next(error);
    }
};
