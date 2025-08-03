import { useState } from "react";

import Posts from "../../components/common/Posts";
import CreatePost from "./CreatePost";

const HomePage = () => {
    const [feedType, setFeedType] = useState("forYou");

    return (
        <>
            <div className="flex-[4_4_0] lg:mr-auto border-r border-gray-700 h-screen overflow-y-auto w-full">
                {/* Header */}
                <div className="flex w-full border-b border-gray-700 font-semibold bg-black/80 backdrop-blur-md sticky top-0 z-10">
                    <div
                        className={`flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 cursor-pointer relative ${
                            feedType === "forYou" ? "text-white" : "text-gray-500"
                        }`}
                        onClick={() => setFeedType("forYou")}
                    >
                        For you
                        {feedType === "forYou" && (
                            <div className="absolute bottom-0 w-10  h-1 rounded-full bg-primary"></div>
                        )}
                    </div>
                    <div
                        className={`flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 cursor-pointer relative ${
                            feedType === "following" ? "text-white" : "text-gray-500"
                        }`}
                        onClick={() => setFeedType("following")}
                    >
                        Following
                        {feedType === "following" && (
                            <div className="absolute bottom-0 w-10  h-1 rounded-full bg-primary"></div>
                        )}
                    </div>
                </div>

                {/*  CREATE POST INPUT */}
                <CreatePost />

                {/* POSTS */}
                <Posts feedType={feedType} />
            </div>
        </>
    );
};
export default HomePage;
