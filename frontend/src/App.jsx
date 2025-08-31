import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Homepage from "./pages/home/Homepage.jsx";
import LoginPage from "./pages/auth/login/LoginPage.jsx";
import SignUpPage from "./pages/auth/signup/SignUpPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import Sidebar from "./components/common/Sidebar.jsx";
import RightPanel from "./components/common/RightPanel.jsx";
import NotificationPage from "./pages/notification/NotificationPage.jsx";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import FollowersFollowingPage from "./pages/profile/FollowersFollowingPage.jsx";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "./components/common/LoadingSpinner.jsx";
import ChatPage from "./pages/chat/ChatPage.jsx";
import { io } from "socket.io-client";

function App() {
    const location = useLocation();
    const isMessagesPage = location.pathname.startsWith("/chat/messages");
    const queryClient = useQueryClient();
    const { data: authUser, isLoading } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            try {
                const res = await fetch("/api/auth/check-auth", {
                    credentials: "include",
                });
                const data = await res.json();
                if (data.error) return null;
                if (!res.ok) {
                    // If we get 401 (unauthorized), user is not logged in
                    if (res.status === 401) return null;
                    throw new Error(data.error);
                }
                return data;
            } catch (error) {
                // If there's a network error or 401, return null (user not authenticated)
                if (error.message.includes("401") || error.message.includes("Unauthorized")) {
                    return null;
                }
                return null; // For any other errors, assume user is not authenticated
            }
        },
        retry: false,
    });

    const [unreadUsers, setUnreadUsers] = useState([]); // userIds with unread messages
    const [hasNewNotification, setHasNewNotification] = useState(false); // for notification bubble
    const [blinkNotification, setBlinkNotification] = useState(false); // for blinking effect
    const socketRef = useRef(null);

    // Fetch initial unread users when user is authenticated
    useEffect(() => {
        if (authUser) {
            const fetchUnreadUsers = async () => {
                try {
                    console.log("Fetching initial unread users...");
                    const res = await fetch("/api/users/unread-users", {
                        credentials: "include",
                    });
                    const data = await res.json();
                    console.log("Initial unread users:", data);
                    if (res.ok) {
                        setUnreadUsers(data);
                    }
                } catch (err) {
                    console.error("Error fetching unread users:", err);
                }
            };
            fetchUnreadUsers();
        }
    }, [authUser]);

    useEffect(() => {
        // Real-time comment deletion: update posts cache
        const handleDeleteComment = (data) => {
            if (data && data.postId && data.post) {
                // Check post.user is populated and all comments' user are populated
                const postUserPopulated =
                    data.post.user &&
                    typeof data.post.user === "object" &&
                    data.post.user._id &&
                    (data.post.user.username || data.post.user.fullName);
                const allCommentsPopulated = Array.isArray(data.post.comments)
                    ? data.post.comments.every(
                          (c) =>
                              c.user &&
                              typeof c.user === "object" &&
                              c.user._id &&
                              (c.user.username || c.user.fullName)
                      )
                    : true;
                if (postUserPopulated && allCommentsPopulated) {
                    // Update all posts queries with the new data
                    queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
                        if (!old || !Array.isArray(old)) return old;
                        return old.map((p) => (p._id === data.postId ? data.post : p));
                    });
                    queryClient.setQueryData(["posts", data.postId], data.post);
                } else {
                    // If not populated, refetch all posts queries
                    queryClient.invalidateQueries({ queryKey: ["posts"] });
                }
            } else if (data && data.postId) {
                queryClient.invalidateQueries({ queryKey: ["posts"] });
            }
        };

        if (!authUser) return;
        if (socketRef.current) return; // Prevent multiple connections
        const baseUrl = import.meta.env.VITE_SERVER_BASE_URL || "http://localhost:5002";
        socketRef.current = io(baseUrl, { withCredentials: true });
        socketRef.current.emit("user_connected", authUser._id);
        const handleReceive = (message) => {
            if (message.receiverId === authUser._id && message.senderId !== authUser._id) {
                setUnreadUsers((prev) =>
                    prev.includes(message.senderId) ? prev : [...prev, message.senderId]
                );
            }
        };
        socketRef.current.on("receive_message", handleReceive);
        socketRef.current.on("sent_message", handleReceive);

        // Real-time posts: update posts cache on 'new_post' event
        const handleNewPost = (data) => {
            if (data && data.post) {
                queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
                    if (!old || !Array.isArray(old)) return [data.post];
                    // Avoid duplicate if already present
                    if (old.some((p) => p._id === data.post._id)) return old;
                    return [data.post, ...old];
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ["posts"] });
            }
        };
        socketRef.current.on("new_post", handleNewPost);

        // Real-time post deletion: update posts cache
        const handleDeletePost = (data) => {
            if (data && data.postId) {
                queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
                    if (!old || !Array.isArray(old)) return old;
                    return old.filter((p) => p._id !== data.postId);
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ["posts"] });
            }
        };
        socketRef.current.on("delete_post", handleDeletePost);

        // Real-time comments, likes, follows: show notification bubble and refetch
        const handleNewComment = (data) => {
            // Only show notification bubble if the comment is for the logged-in user
            if (data && data.to === authUser._id) {
                setHasNewNotification(true);
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
            }
            // Update only the commented post in cache if full post is provided
            if (data && data.postId && data.post) {
                queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
                    if (!old || !Array.isArray(old)) return old;
                    return old.map((p) => (p._id === data.postId ? data.post : p));
                });
            } else if (data && data.postId) {
                queryClient.invalidateQueries({ queryKey: ["posts"] });
            }
        };
        const handleNewLike = (data) => {
            // Only show notification bubble if the like is for the logged-in user
            if (data && data.to === authUser._id) {
                setHasNewNotification(true);
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
            }
            // Update only the liked post in cache if full post is provided
            if (data && data.postId && data.post) {
                queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
                    if (!old || !Array.isArray(old)) return old;
                    return old.map((p) => (p._id === data.postId ? data.post : p));
                });
            } else if (data && data.postId) {
                queryClient.invalidateQueries({ queryKey: ["posts"] });
            }
        };
        const handleNewFollow = () => {
            setHasNewNotification(true);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        };
        socketRef.current.on("new_comment", handleNewComment);
        socketRef.current.on("new_like", handleNewLike);
        socketRef.current.on("new_follow", handleNewFollow);
        socketRef.current.on("delete_comment", handleDeleteComment);

        return () => {
            socketRef.current && socketRef.current.disconnect();
            socketRef.current = null;
        };
    }, [authUser, queryClient]);

    if (isLoading) {
        return (
            <div className="h-screen flex justify-center items-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div
            className={`flex w-full h-screen relative bg-gradient-to-br from-black via-gray-950/40 to-purple-950/30 mobile-safe-top mobile-safe-bottom overflow-auto ${
                isMessagesPage ? "chat-no-scroll" : ""
            }`}
            style={{
                height: "100dvh",
                background:
                    "radial-gradient(ellipse at top, rgba(88, 28, 135, 0.15) 0%, rgba(0, 0, 0, 0.9) 50%, rgba(0, 0, 0, 1) 100%)",
            }}
        >
            {/* Left Sidebar - Hidden on mobile, visible on desktop with wider width */}
            {authUser && (
                <div className="hidden lg:block pl-4 xl:pl-6">
                    <Sidebar
                        authUser={authUser}
                        unreadUsers={unreadUsers}
                        hasNewNotification={hasNewNotification}
                        setHasNewNotification={setHasNewNotification}
                        blinkNotification={blinkNotification}
                    />
                </div>
            )}

            {/* Main Content Area - Fixed width in center */}
            <div
                className={`flex-1 flex justify-center min-w-0 ${
                    isMessagesPage ? "chat-no-scroll" : ""
                } ${authUser ? "ml-20 sm:ml-16 md:ml-20 lg:ml-0" : ""}`}
            >
                <div
                    className={
                        authUser
                            ? "w-full max-w-2xl lg:max-w-xl xl:max-w-2xl pt-4 lg:pt-0 mobile-safe-top"
                            : "w-full pt-4 lg:pt-0 mobile-safe-top"
                    }
                    style={
                        authUser
                            ? {
                                  background:
                                      "linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(17, 24, 39, 0.4) 50%, rgba(88, 28, 135, 0.1) 100%)",
                              }
                            : undefined
                    }
                >
                    {/* Mobile Sidebar - Only show on mobile when not on messages page */}
                    {authUser && (
                        <div className="lg:hidden">
                            <Sidebar
                                authUser={authUser}
                                unreadUsers={unreadUsers}
                                hasNewNotification={hasNewNotification}
                                setHasNewNotification={setHasNewNotification}
                                blinkNotification={blinkNotification}
                            />
                        </div>
                    )}

                    {/* Mobile RightPanel mount so its toggle is available on small screens */}
                    {authUser && (
                        <div className="lg:hidden">
                            <RightPanel authUser={authUser} unreadUsers={unreadUsers} />
                        </div>
                    )}

                    <Routes>
                        <Route
                            path="/"
                            element={authUser ? <Homepage /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/notifications"
                            element={
                                authUser ? (
                                    <NotificationPage
                                        setHasNewNotification={setHasNewNotification}
                                        setBlinkNotification={setBlinkNotification}
                                    />
                                ) : (
                                    <Navigate to="/login" />
                                )
                            }
                        />
                        <Route
                            path="/profile/:username/:tab"
                            element={
                                authUser ? <FollowersFollowingPage /> : <Navigate to="/login" />
                            }
                        />
                        <Route
                            path="/profile/:username"
                            element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/chat/messages"
                            element={
                                authUser ? (
                                    <ChatPage
                                        authUser={authUser}
                                        unreadUsers={unreadUsers}
                                        setUnreadUsers={setUnreadUsers}
                                        socketRef={socketRef}
                                    />
                                ) : (
                                    <Navigate to="/login" />
                                )
                            }
                        />
                        <Route
                            path="/chat/messages/:username"
                            element={
                                authUser ? (
                                    <ChatPage
                                        authUser={authUser}
                                        unreadUsers={unreadUsers}
                                        setUnreadUsers={setUnreadUsers}
                                        socketRef={socketRef}
                                    />
                                ) : (
                                    <Navigate to="/login" />
                                )
                            }
                        />
                        <Route
                            path="/login"
                            element={!authUser ? <LoginPage /> : <Navigate to="/" />}
                        />
                        <Route
                            path="/signup"
                            element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
                        />
                    </Routes>
                </div>
            </div>

            {/* Right Panel - visible on large+ screens; mobile version mounted in main content so toggle appears */}
            {authUser && (
                <div className="hidden lg:block pr-4 xl:pr-6">
                    <RightPanel authUser={authUser} unreadUsers={unreadUsers} />
                </div>
            )}
        </div>
    );
}

export default App;
