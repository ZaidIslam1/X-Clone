import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import {v2 as cloudinary} from "cloudinary";
import bcrypt from "bcryptjs";

export const getProfile = async (req, res, next) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }
        const user = await User.findOne({username}).select("-password -__v");
        if (!user || user.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getProfile", error.message);
        next(error);
        
    }
}

export const getSuggestedUsers = async (req, res, next) => {
    try {
        const currentUserId = req.user._id;
        const userFollowedByMe = await User.findById(currentUserId).select("following")
        
        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: currentUserId }
                }
            },
            {
                $sample: { size: 10 }
            }
        ]);
        
        const filteredUsers = users.filter(user => 
            !userFollowedByMe.following.some(followingId => followingId.toString() === user._id.toString())
        );
        const suggestedUsers = filteredUsers.slice(0, 4);
        suggestedUsers.forEach(user => { user.password = undefined; user.__v = undefined; });
        if (suggestedUsers.length === 0) {
            return res.status(404).json({ error: "No suggested users found" });
        }

        res.status(200).json(suggestedUsers);

    } catch (error) {
        console.log("Error in getSuggestedUsers", error.message);
        next(error);
        
    }
}

export const followUnfollowUser = async (req, res, next) => {

    try {
        const { id } = req.params; // User ID to follow/unfollow
        const currentUserId = req.user._id; // ID of the authenticated user

        if (id === currentUserId.toString()) {
            return res.status(400).json({ error: "You cannot follow/unfollow yourself" });
        }

        const otherUser = await User.findById(id);
        if (!otherUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ error: "Current user not found" });
        }

        const isFollowing = currentUser.following.includes(id);
        if (!isFollowing){
            // Follow user
            await User.findByIdAndUpdate(id, {$push :{followers: currentUserId}});
            await User.findByIdAndUpdate(currentUserId, {$push: {following: id}})

            const newNotification = new Notification({
                type: 'follow',
                from: currentUserId, 
                to: otherUser._id,

            });

            await newNotification.save()

            res.status(200).json({
                message: "User followed successfully",
                user: {
                    _id: otherUser._id,
                    fullName: otherUser.fullName,
                    username: otherUser.username,                
                    email: otherUser.email,
                    profileImg: otherUser.profileImg,
                    coverImg: otherUser.coverImg,
                    bio: otherUser.bio,
                    link: otherUser.link,
                    followers: otherUser.followers,
                    following: otherUser.following,
                    createdAt: otherUser.createdAt,
                    updatedAt: otherUser.updatedAt
                }

            });
        } else {
            // Unfollow user
            await User.findByIdAndUpdate(id, {$pull :{followers: currentUserId}});
            await User.findByIdAndUpdate(currentUserId, {$pull: {following: 
            id}})
            res.status(200).json({
                message: "User unfollowed successfully",
                user: {
                    _id: otherUser._id,
                    fullName: otherUser.fullName,
                    username: otherUser.username,                
                    email: otherUser.email,
                    profileImg: otherUser.profileImg,
                    coverImg: otherUser.coverImg,
                    bio: otherUser.bio,
                    link: otherUser.link,
                    followers: otherUser.followers,
                    following: otherUser.following,
                    createdAt: otherUser.createdAt,
                    updatedAt: otherUser.updatedAt
                }
            });
        }


    } catch (error) {
        console.log("Error in followUnfollowUser", error.message);
        next(error);
        
    }
}

export const updateUserProfile = async (req, res, next) => {
    const { fullName, username, email, currentPassword, newPassword, bio, link } = req.body;
    let { profileImg, coverImg } = req.body;
    const currentUserId = req.user._id;

    try {
        const user = await User.findById(currentUserId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if ((currentPassword && !newPassword) || (!currentPassword && newPassword) || (newPassword && newPassword.trim() === "")) {
            return res.status(400).json({ error: "New password is required when current password is provided" });
        }
        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Current password is incorrect" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "New password must be at least 6 characters long" });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if (profileImg && user.profileImg) {
            await cloudinary.uploader.destroy(user.profileImg.split('/').pop().split('.')[0]);
        }
        if (profileImg) {
            const uploadedResponse = await cloudinary.uploader.upload(profileImg)
            user.profileImg = uploadedResponse.secure_url;
        }

        if (coverImg && user.coverImg) {
            await cloudinary.uploader.destroy(user.coverImg.split('/').pop().split('.')[0]);
        }
        if (coverImg) {
            const uploadedResponse = await cloudinary.uploader.upload(coverImg)
            user.coverImg = uploadedResponse.secure_url;
        }

        user.fullName = fullName || user.fullName;
        user.username = username || user.username;
        user.email = email || user.email;  
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;  
        
        const updatedUser = await user.save();
        updatedUser.password = undefined; // Exclude password from response
        updatedUser.__v = undefined; // Exclude version key from response
        
        res.status(200).json(updatedUser);

    } catch (error) {
        console.log("Error in updateUserProfile", error.message);
        next(error);
    }


}