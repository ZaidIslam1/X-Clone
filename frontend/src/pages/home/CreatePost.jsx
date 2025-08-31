import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { useRef, useState, lazy, Suspense } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createHighQualityProfileImage } from "../../utils/imageUtils";

// Lazy load emoji picker for better perf
const EmojiPicker = lazy(() => import("emoji-picker-react"));

const CreatePost = () => {
    const [text, setText] = useState("");
    const [img, setImg] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const imgRef = useRef(null);
    const textareaRef = useRef(null);
    const queryClient = useQueryClient();
    const { data: authUser } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await fetch("/api/auth/check-auth", {
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Authentication failed");
            return data;
        },
    });

    const {
        mutate: createPost,
        isPending,
        isError,
        error,
    } = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/posts/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, img }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw data.error;
            }
            if (data.error) {
                throw data.error;
            }
            return data;
        },

        onSuccess: () => {
            setText("");
            setImg(null);
            toast.success("Post created successfully");
            // queryClient.invalidateQueries({ queryKey: ["posts"] });
        },

        onError: () => {
            toast.error("Unable to create post", error);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createPost();
    };

    const handleImgChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImg(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const insertEmoji = (emojiObject) => {
        const emoji = emojiObject.emoji;
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = text.substring(0, start) + emoji + text.substring(end);
        setText(newText);

        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
            textarea.focus();
        }, 0);
    };

    // Close emoji picker on outside click
    const wrapperRef = useRef(null);
    useState(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="mb-6 mx-2 mt-4 sm:mx-4 bg-gradient-to-br from-black/80 via-gray-900/50 to-purple-950/20 border border-purple-800/20 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl shadow-purple-950/10 main-card">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800/30">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-3 h-3 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full"></span>
                    Create Post
                </h3>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className="avatar flex-shrink-0">
                        <div className="w-12 h-12 rounded-full ring-2 ring-purple-600/30 ring-offset-2 ring-offset-black/50 overflow-hidden">
                            <img
                                src={
                                    createHighQualityProfileImage(authUser?.profileImg) ||
                                    "/avatar-placeholder.png"
                                }
                                alt="Your avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                className="w-full text-white text-lg placeholder-gray-400 resize-none border-none focus:outline-none min-h-[120px] p-4 rounded-xl bg-black/20 border border-gray-700/30 focus:border-purple-500/50 transition-colors"
                                placeholder="What's on your mind? Share something amazing..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        if (text.trim() && !isPending) {
                                            createPost();
                                        }
                                    }
                                }}
                            />
                        </div>

                        {img && (
                            <div className="relative mx-auto max-w-md">
                                <button
                                    type="button"
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors z-10"
                                    onClick={() => {
                                        setImg(null);
                                        imgRef.current.value = null;
                                    }}
                                >
                                    <IoCloseSharp className="w-4 h-4" />
                                </button>
                                <img
                                    src={img}
                                    className="w-full rounded-xl object-cover max-h-96 shadow-lg border border-gray-600/50"
                                />
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div
                            className="flex justify-between items-center pt-4 border-t border-gray-700/30"
                            ref={wrapperRef}
                        >
                            <div className="flex gap-4 items-center relative">
                                <button
                                    type="button"
                                    className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors group"
                                    onClick={() => imgRef.current.click()}
                                >
                                    <div className="p-2 rounded-full group-hover:bg-purple-900/20 transition-colors">
                                        <CiImageOn className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm hidden sm:block">Photo</span>
                                </button>

                                <div className="relative">
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors group"
                                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                                    >
                                        <div className="p-2 rounded-full group-hover:bg-orange-900/20 transition-colors">
                                            <BsEmojiSmileFill className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm hidden sm:block">Emoji</span>
                                    </button>
                                    {showEmojiPicker && (
                                        <Suspense fallback={<div>Loading emojis...</div>}>
                                            <div
                                                className="absolute top-full mt-2 left-0 z-50"
                                                style={{ width: 300, height: 350 }}
                                            >
                                                <EmojiPicker
                                                    onEmojiClick={insertEmoji}
                                                    theme="dark"
                                                    height={350}
                                                    width={300}
                                                />
                                            </div>
                                        </Suspense>
                                    )}
                                </div>
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                ref={imgRef}
                                onChange={handleImgChange}
                            />

                            <button
                                type="submit"
                                className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                disabled={isPending || (!text.trim() && !img)}
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <svg
                                            className="animate-spin h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Posting...
                                    </span>
                                ) : (
                                    "Share"
                                )}
                            </button>
                        </div>

                        {isError && (
                            <div className="bg-red-900/20 border border-red-700/50 text-red-400 p-3 rounded-lg mt-4">
                                Something went wrong. Please try again.
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
