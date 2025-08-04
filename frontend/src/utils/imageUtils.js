// Cloudinary image optimization utilities

// Create high-quality post image URL
export const createHighQualityPostImage = (imageUrl) => {
    if (!imageUrl) return null;

    // If it's already a Cloudinary URL, optimize it
    if (imageUrl.includes("cloudinary.com")) {
        // Extract the public_id from the URL
        const parts = imageUrl.split("/");
        const uploadIndex = parts.findIndex((part) => part === "upload");
        if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
            const publicId = parts.slice(uploadIndex + 2).join("/");
            // Return optimized URL with ultra-high quality settings
            return `https://res.cloudinary.com/${parts[3]}/image/upload/c_fill,w_1600,h_1200,q_100,f_webp/${publicId}`;
        }
    }

    // Return original URL if not Cloudinary
    return imageUrl;
};

// Create high-quality profile image URL
export const createHighQualityProfileImage = (imageUrl) => {
    if (!imageUrl) return null;

    // If it's already a Cloudinary URL, optimize it
    if (imageUrl.includes("cloudinary.com")) {
        // Extract the public_id from the URL
        const parts = imageUrl.split("/");
        const uploadIndex = parts.findIndex((part) => part === "upload");
        if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
            const publicId = parts.slice(uploadIndex + 2).join("/");
            // Return optimized URL for profile images (square, smaller size)
            return `https://res.cloudinary.com/${parts[3]}/image/upload/c_fill,w_400,h_400,q_100,f_webp,g_face/${publicId}`;
        }
    }

    // Return original URL if not Cloudinary
    return imageUrl;
};

// Create high-quality cover image URL
export const createHighQualityCoverImage = (imageUrl) => {
    if (!imageUrl) return null;

    // If it's already a Cloudinary URL, optimize it
    if (imageUrl.includes("cloudinary.com")) {
        // Extract the public_id from the URL
        const parts = imageUrl.split("/");
        const uploadIndex = parts.findIndex((part) => part === "upload");
        if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
            const publicId = parts.slice(uploadIndex + 2).join("/");
            // Return optimized URL for cover images (wide aspect ratio)
            return `https://res.cloudinary.com/${parts[3]}/image/upload/c_fill,w_1200,h_400,q_100,f_webp/${publicId}`;
        }
    }

    // Return original URL if not Cloudinary
    return imageUrl;
};
