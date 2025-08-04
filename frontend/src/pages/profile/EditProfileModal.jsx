import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const EditProfileModal = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const { data: authUser } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            try {
                const res = await fetch("/api/auth/check-auth", {
                    credentials: "include",
                });
                const data = await res.json();
                if (data.error) return null;
                if (!res.ok) {
                    if (res.status === 401) return null;
                    throw new Error(data.error || "Authentication failed");
                }
                return data;
            } catch (error) {
                if (error.message.includes("401") || error.message.includes("Unauthorized")) {
                    return null;
                }
                return null;
            }
        },
        retry: false,
    });

    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        email: "",
        bio: "",
        link: "",
        newPassword: "",
        currentPassword: "",
        profileImg: "",
        coverImg: "",
    });

    const { mutate: updateProfile, isPending } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch("/api/users/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                return data;
            } catch (error) {
                throw new Error(error.message);
            }
        },
        onSuccess: async (updatedUser) => {
            if (updatedUser.username && updatedUser.username !== authUser.username) {
                navigate(`/profile/${updatedUser.username}`);
            }
            toast.success("Profile updated successfully");
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
                queryClient.invalidateQueries({ queryKey: ["authUser"] }),
            ]);
        },

        onError: (error) => {
            toast.error(error.message);
        },
    });

    useEffect(() => {
        if (authUser) {
            setFormData({
                fullName: authUser.fullName,
                username: authUser.username,
                email: authUser.email,
                bio: authUser.bio,
                link: authUser.link,
                newPassword: "",
                currentPassword: "",
                profileImg: "",
                coverImg: "",
            });
        }
    }, [authUser]);

    const handleSubmit = (e) => {
        e.preventDefault();
        updateProfile();
    };

    const handleImageChange = (e, imageType) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setFormData({ ...formData, [imageType]: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <>
            <button
                className="btn btn-outline rounded-full btn-sm"
                onClick={() => document.getElementById("edit_profile_modal").showModal()}
            >
                Edit profile
            </button>
            <dialog id="edit_profile_modal" className="modal">
                <div className="modal-box border rounded-md border-gray-700 shadow-md">
                    <h3 className="font-bold text-lg my-3">Update Profile</h3>
                    <form
                        className="flex flex-col gap-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit(e);
                        }}
                    >
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="text"
                                placeholder="Full Name"
                                className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                value={formData.fullName}
                                name="fullName"
                                onChange={handleInputChange}
                            />
                            <input
                                type="text"
                                placeholder="Username"
                                className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                value={formData.username}
                                name="username"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="email"
                                placeholder="Email"
                                className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                value={formData.email}
                                name="email"
                                onChange={handleInputChange}
                            />
                            <textarea
                                placeholder="Bio"
                                className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                value={formData.bio}
                                name="bio"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Current Password"
                                    className="w-full input border border-gray-700 rounded p-2 input-md pr-10"
                                    value={formData.currentPassword}
                                    name="currentPassword"
                                    onChange={handleInputChange}
                                />
                                {/* Always show the button */}
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
                                    style={{ zIndex: 10 }}
                                >
                                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            <div className="relative flex-1">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    className="w-full input border border-gray-700 rounded p-2 input-md pr-10"
                                    value={formData.newPassword}
                                    name="newPassword"
                                    onChange={handleInputChange}
                                />
                                {/* Always show the button */}
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
                                    style={{ zIndex: 10 }}
                                >
                                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Link"
                            className="flex-1 input border border-gray-700 rounded p-2 input-md"
                            value={formData.link}
                            name="link"
                            onChange={handleInputChange}
                        />
                        <button
                            className="btn btn-primary rounded-full btn-sm text-white"
                            onClick={handleSubmit}
                        >
                            {isPending ? "Updating..." : "Update"}
                        </button>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button className="outline-none">close</button>
                </form>
            </dialog>
        </>
    );
};
export default EditProfileModal;
