import { useState } from "react";
import { Link } from "react-router-dom";

import XSvg from "../../../components/svgs/X";

import { MdOutlineMail } from "react-icons/md";
import { MdPassword } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const LoginPage = () => {
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
        <div className="max-w-screen-xl mx-auto flex h-screen">
            <div className="flex-1 hidden lg:flex items-center  justify-center">
                <XSvg className="lg:w-2/3 fill-white" />
            </div>
            <div className="flex-1 flex flex-col justify-center items-center">
                <form className="flex gap-4 flex-col" onSubmit={handleSubmit}>
                    <XSvg className="w-24 lg:hidden fill-white" />
                    <h1 className="text-3xl font-extrabold text-white">Sign In to X</h1>
                    <label className="input input-bordered rounded flex items-center gap-2">
                        <MdOutlineMail />
                        <input
                            type="text"
                            className="grow"
                            placeholder="username"
                            name="username"
                            onChange={handleInputChange}
                            value={formData.username}
                        />
                    </label>

                    <label className="input input-bordered rounded flex items-center gap-2">
                        <MdPassword />
                        <input
                            type="password"
                            className="grow"
                            placeholder="Password"
                            name="password"
                            onChange={handleInputChange}
                            value={formData.password}
                        />
                    </label>
                    <button className="btn rounded-full btn-primary text-white">
                        {isPending ? "Loading.." : "Login"}
                    </button>
                    {isError && <p className="text-red-500">{error.message}</p>}
                </form>
                <div className="flex flex-col gap-2 mt-5">
                    <p className="text-white text-sm">{"Don't"} have an account?</p>
                    <Link to="/signup">
                        <button className="btn rounded-full btn-primary text-white btn-outline w-full">
                            Sign up
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default LoginPage;
