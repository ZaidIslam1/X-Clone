import { useState } from "react";

import Posts from "../../components/common/Posts";
import CreatePost from "./CreatePost";

const HomePage = () => {
    const [feedType, setFeedType] = useState("forYou");

    return (
        <div className="flex-1 page-container mobile-page-container w-full bg-gradient-to-br from-black via-gray-900 to-black min-h-screen flex justify-center items-start">
            <div className="flex flex-col flex-1 w-full max-w-3xl my-8 bg-transparent border border-gray-800 shadow-2xl rounded-3xl backdrop-blur-xl overflow-hidden">
                {/* Header */}
                {/* Tabs - unified with Followers/Following style */}
                <div className="flex w-full border-b border-gray-800 font-semibold mb-0 sticky top-0 z-10 bg-black/80 backdrop-blur-xl">
                    <button
                        className={`flex-1 py-3 text-lg rounded-t-2xl transition-all duration-300 focus:outline-none ${
                            feedType === "forYou"
                                ? "bg-gradient-to-r from-purple-600/30 to-orange-600/30 text-white shadow"
                                : "text-gray-400 hover:bg-gray-900/30"
                        }`}
                        onClick={() => setFeedType("forYou")}
                    >
                        For you
                    </button>
                    <button
                        className={`flex-1 py-3 text-lg rounded-t-2xl transition-all duration-300 focus:outline-none ${
                            feedType === "following"
                                ? "bg-gradient-to-r from-purple-600/30 to-orange-600/30 text-white shadow"
                                : "text-gray-400 hover:bg-gray-900/30"
                        }`}
                        onClick={() => setFeedType("following")}
                    >
                        Following
                    </button>
                </div>

                {/*  CREATE POST INPUT */}
                <CreatePost />

                {/* POSTS */}
                <Posts feedType={feedType} />
            </div>
        </div>
    );
};
export default HomePage;
