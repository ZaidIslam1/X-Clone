import { useState } from "react";
import { Link } from "react-router-dom";

import SocialLogo from "../../../components/svgs/SocialLogo";

import { MdOutlineMail, MdPassword } from "react-icons/md";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const queryClient = useQueryClient();

    const {
        mutate: loginMutation,
        isError,
        isPending,
        error,
    } = useMutation({
        mutationFn: async ({ username, password }) => {
            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });
                const data = await res.json();
                if (!res.ok) {
                    throw data.error;
                }
                if (data.error) {
                    throw data.error;
                }
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["authUser"] }); // refetch the authUser, if user exists on success then App.jsx will send user to Home
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        loginMutation(formData);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-purple-900/20 via-black to-orange-900/10">
            {/* Left side - Logo */}
            <div className="flex-1 hidden lg:flex items-center justify-center">
                <div className="text-center">
                    <SocialLogo className="w-2/3 max-w-md mx-auto mb-8" />
                    <div className="space-y-4">
                        <h2 className="text-4xl font-bold text-white">Welcome to Z</h2>
                        <p className="text-gray-400 text-xl">Connect with your world</p>
                    </div>
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="flex-[1.2] flex flex-col justify-center items-center p-4 sm:p-8">
                <div className="w-full max-w-md min-w-[300px] sm:min-w-[320px] mt-2 sm:mt-0">
                    <div className="bg-transparent border border-gray-800 shadow-2xl rounded-3xl backdrop-blur-xl px-6 sm:px-10 py-4 sm:py-12 auth-card auth-card-raise">
                        <div className="text-center mb-8">
                            <SocialLogo className="w-16 lg:hidden mx-auto mb-4" />
                            <h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>
                            <p className="text-gray-400">Welcome back to Z</p>
                        </div>

                        <form className="space-y-6 w-full" onSubmit={handleSubmit}>
                            {/* Username Input */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MdOutlineMail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder="Enter your username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                                    />
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
                                        placeholder="Enter your password"
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

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? "Signing in..." : "Sign In"}
                            </button>
                        </form>

                        {/* Sign Up Link */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-400 mb-4">Don't have an account?</p>
                            <Link to="/signup">
                                <button className="w-full py-3 px-6 bg-transparent border-2 border-purple-600/50 hover:border-purple-500 text-purple-400 hover:text-white font-semibold rounded-xl transition-all duration-300 hover:bg-purple-600/10">
                                    Create Account
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default LoginPage;
