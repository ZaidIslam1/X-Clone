import mongoose from "mongoose";

const userSchema = await mongoose.Schema({

    fullName: {
        type: "String",
        required: true
    },

    username: {
        type: "String",
        required: true,
        unique: true,
    },

    password: {
        type: "String",
        required: true,
        minLength: 6
    },

    email: {
        type: "String",
        required: true,
        unique: true,
    },

    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [] // New users have zero followers set default to empty array
        },
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [] // New users have zero followers set default to empty array
        },
    ],

    profileImg: {
        type: "String",
        default: "",
    },

    coverImg: {
        type: "String",
        default: "",
    },

    bio: {
        type: "String",
        default: "",
    },

    link: {
        type: "String",
        default: "",
    },

    likedPosts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: [] // New users have zero liked posts set default to empty array
        },  
    ]


}, {timestamps: true})

const User = mongoose.model("User", userSchema);

export default User;