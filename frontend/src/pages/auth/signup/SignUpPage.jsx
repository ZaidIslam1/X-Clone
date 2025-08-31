import { Link } from "react-router-dom";
import { useState } from "react";

import SocialLogo from "../../../components/svgs/SocialLogo";
import { FaEye, FaEyeSlash, FaUser } from "react-icons/fa";

import { MdOutlineMail, MdPassword, MdDriveFileRenameOutline } from "react-icons/md";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const SignUpPage = () => {
    const queryClient = useQueryClient();

    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        username: "",
        fullName: "",
        password: "",
    });

    const { mutate, isError, isPending, error } = useMutation({
        mutationFn: async ({ email, fullName, password, username }) => {
            try {
                const res = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ email, fullName, password, username }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                if (data.error) throw new Error(data.error);
                return data;
            } catch (error) {
                throw error;
            }
        },
        onSuccess: () => {
            toast.success("Account created successfully");
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
    });
    useQuery;

    const handleSubmit = (e) => {
        e.preventDefault(); // page won't reload
        mutate(formData);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-black flex">
            {/* Left side - Logo */}
            <div className="flex-[0.8] hidden lg:flex items-center justify-center bg-gradient-to-br from-orange-900/20 via-black to-purple-900/10">
                <div className="text-center">
                    <SocialLogo className="w-2/3 max-w-md mx-auto mb-8" />
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold text-white">Join Z Today</h2>
                        <p className="text-gray-400 text-xl">Start your journey with us</p>
                    </div>
                </div>
            </div>

            {/* Right side - Signup Form */}
            <div
                className="flex-[1.2] flex flex-col justify-center items-center p-4 sm:p-8"
                style={{
                    background:
                        "radial-gradient(ellipse at top, rgba(88, 28, 135, 0.15) 0%, rgba(0, 0, 0, 0.9) 50%, rgba(0, 0, 0, 1) 100%)",
                }}
            >
                <div className="w-full max-w-md min-w-[320px]">
                    <div className="bg-transparent border border-gray-800 shadow-2xl rounded-3xl backdrop-blur-xl px-6 sm:px-10 py-10 sm:py-14">
                        <div className="text-center mb-8">
                            <SocialLogo className="w-16 lg:hidden mx-auto mb-4" />
                            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                            <p className="text-gray-400">Join the Z community</p>
                        </div>

                        <form className="space-y-6 w-full" onSubmit={handleSubmit}>
                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MdOutlineMail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Username and Full Name Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaUser className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="Username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MdDriveFileRenameOutline className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="fullName"
                                            placeholder="Full Name"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MdPassword className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Create a password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? (
                                            <FaEyeSlash className="h-5 w-5" />
                                        ) : (
                                            <FaEye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {isError && (
                                <div className="p-3 rounded-xl bg-red-900/20 border border-red-500/30">
                                    <p className="text-red-400 text-sm">{error.message}</p>
                                </div>
                            )}

                            {/* Signup Button */}
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full py-3 px-6 bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? "Creating Account..." : "Create Account"}
                            </button>
                        </form>

                        {/* Sign In Link */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-400 mb-4">Already have an account?</p>
                            <Link to="/login">
                                <button className="w-full py-3 px-6 bg-transparent border-2 border-orange-600/50 hover:border-orange-500 text-orange-400 hover:text-white font-semibold rounded-xl transition-all duration-300 hover:bg-orange-600/10">
                                    Sign In
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SignUpPage;
