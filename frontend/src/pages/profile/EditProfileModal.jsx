import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const EditProfileModal = ({ isOpen: parentIsOpen = false, onClose }) => {
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

    const [isOpen, setIsOpen] = useState(false);
    const dialogRef = useRef(null);

    // prefer the non-<dialog> fallback for reliability across browsers
    const supportsDialog =
        typeof window !== "undefined" &&
        typeof HTMLDialogElement === "function" &&
        typeof HTMLDialogElement.prototype.showModal === "function";

    // start with fallback (non-<dialog>) to avoid timing/mount issues; we can still flip this to true if needed later
    const [useDialogSupported, setUseDialogSupported] = useState(false);

    const openModal = () => {
        console.log("EditProfileModal.openModal called, useDialogSupported=", useDialogSupported);
        const dlg = dialogRef.current || document.getElementById("edit_profile_modal");
        if (useDialogSupported && dlg && typeof dlg.showModal === "function") {
            try {
                dlg.showModal();
                setIsOpen(true);
                return;
            } catch (err) {
                setUseDialogSupported(false);
            }
        }
        setIsOpen(true);
    };

    const closeModal = () => {
        const dlg = dialogRef.current || document.getElementById("edit_profile_modal");
        if (dlg && typeof dlg.close === "function") {
            try {
                dlg.close();
            } catch (e) {}
        }
        setIsOpen(false);
        if (typeof onClose === "function") onClose();
    };

    useEffect(() => {
        const dlg = dialogRef.current;
        if (!useDialogSupported) return;
        if (!dlg) return;
        try {
            if (isOpen) {
                if (typeof dlg.showModal === "function" && !dlg.open) {
                    dlg.showModal();
                }
            } else {
                if (typeof dlg.close === "function" && dlg.open) {
                    dlg.close();
                }
            }
        } catch (e) {
            setUseDialogSupported(false);
            setIsOpen(true);
        }
    }, [isOpen, useDialogSupported]);

    // sync parent-controlled open state
    useEffect(() => {
        if (parentIsOpen) openModal();
        else if (isOpen) closeModal();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentIsOpen]);

    const { mutate: updateProfile, isPending } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch("/api/users/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                    credentials: "include",
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Update failed");
                return data;
            } catch (error) {
                throw new Error(error.message || "Network error");
            }
        },
        onSuccess: async (updatedUser) => {
            closeModal();
            if (updatedUser.username && updatedUser.username !== authUser?.username) {
                navigate(`/profile/${updatedUser.username}`);
            }
            toast.success("Profile updated successfully");
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
                queryClient.invalidateQueries({ queryKey: ["authUser"] }),
            ]);
        },
        onError: (error) => {
            toast.error(error.message || "Update failed");
        },
    });

    useEffect(() => {
        if (authUser) {
            setFormData({
                fullName: authUser.fullName || "",
                username: authUser.username || "",
                email: authUser.email || "",
                bio: authUser.bio || "",
                link: authUser.link || "",
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
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setFormData((s) => ({ ...s, [imageType]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e) => {
        setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
    };

    const ModalContent = (
        <>
            <div className="modal-box border rounded-md border-gray-700 shadow-md z-50">
                <h3 className="font-bold text-lg my-3">Update Profile</h3>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword((s) => !s)}
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
                            <button
                                type="button"
                                onClick={() => setShowNewPassword((s) => !s)}
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
                        type="submit"
                    >
                        {isPending ? "Updating..." : "Update"}
                    </button>
                </form>
            </div>
            <div
                className="modal-backdrop fixed inset-0 bg-black bg-opacity-50"
                onClick={closeModal}
                role="button"
                aria-label="Close modal"
                style={{ zIndex: 40 }}
            >
                <button className="sr-only">close</button>
            </div>
        </>
    );

    return (
        <>
            {/* Hide internal trigger when parent controls the modal */}
            {!onClose && (
                <button className="btn btn-outline rounded-full btn-sm" onClick={openModal}>
                    Edit profile
                </button>
            )}

            {useDialogSupported ? (
                <dialog
                    ref={dialogRef}
                    id="edit_profile_modal"
                    className="modal"
                    onClose={() => {
                        setIsOpen(false);
                        if (typeof onClose === "function") onClose();
                    }}
                >
                    {ModalContent}
                </dialog>
            ) : (
                isOpen && <div className="modal modal-open">{ModalContent}</div>
            )}
        </>
    );
};

export default EditProfileModal;
