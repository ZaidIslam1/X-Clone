import { Navigate, Route, Routes } from "react-router-dom";
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
    const queryClient = useQueryClient();
    const { data: authUser, isLoading } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            try {
                const res = await fetch("/api/auth/check-auth");
                const data = await res.json();
                if (data.error) return null;
                if (!res.ok) throw new Error(data.error);
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        retry: false,
    });

    const [unreadUsers, setUnreadUsers] = useState([]); // userIds with unread messages
    const [hasNewNotification, setHasNewNotification] = useState(false); // for notification bubble
    const [blinkNotification, setBlinkNotification] = useState(false); // for blinking effect
    const socketRef = useRef(null);

    useEffect(() => {
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
                queryClient.setQueryData(["posts"], (old) => {
                    if (!old) return [data.post];
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
                queryClient.setQueryData(["posts"], (old) => {
                    if (!old) return old;
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
            // Only refetch the post that got commented on
            if (data && data.postId) {
                queryClient.invalidateQueries({ queryKey: ["posts"] }); // fallback for list
                queryClient.invalidateQueries({ queryKey: ["posts", data.postId] });
            }
        };
        const handleNewLike = () => {
            setHasNewNotification(true);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        };
        const handleNewFollow = () => {
            setHasNewNotification(true);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        };
        socketRef.current.on("new_comment", handleNewComment);
        socketRef.current.on("new_like", handleNewLike);
        socketRef.current.on("new_follow", handleNewFollow);

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
        <div className="flex max-w-6xl mx-auto">
            {authUser && (
                <Sidebar
                    authUser={authUser}
                    unreadUsers={unreadUsers}
                    hasNewNotification={hasNewNotification}
                    setHasNewNotification={setHasNewNotification}
                    blinkNotification={blinkNotification}
                />
            )}
            <Routes>
                <Route path="/" element={authUser ? <Homepage /> : <Navigate to="/login" />} />
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
                    element={authUser ? <FollowersFollowingPage /> : <Navigate to="/login" />}
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
                <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
                <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
            </Routes>
            {authUser && <RightPanel authUser={authUser} unreadUsers={unreadUsers} />}
        </div>
    );
}

export default App;
