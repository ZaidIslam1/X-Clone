import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const EditProfileModal = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: authUser } = useQuery({ queryKey: ["authUser"] });

    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        email: "",
        bio: "",
        link: "",
        newPassword: "",
        currentPassword: "",
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
                throw new Error(error);
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

        onError: () => {
            toast.success("Unable to update profile");
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
            });
        }
    }, [authUser]);

    const handleSubmit = (e) => {
        e.preventDefault();
        updateProfile();
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
                            <input
                                type="password"
                                placeholder="Current Password"
                                className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                value={formData.currentPassword}
                                name="currentPassword"
                                onChange={handleInputChange}
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                value={formData.newPassword}
                                name="newPassword"
                                onChange={handleInputChange}
                            />
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
