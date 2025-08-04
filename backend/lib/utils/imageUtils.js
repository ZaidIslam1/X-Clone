/**
 * Utility functions for optimizing image URLs for better performance
 */

/**
 * Transform Cloudinary URLs to use optimized versions
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {object} options - Optimization options
 * @returns {string} - Optimized URL
 */
export const optimizeImageUrl = (imageUrl, options = {}) => {
    if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
        return imageUrl;
    }

    const { width = 150, height = 150, quality = "auto", format = "auto", crop = "fill" } = options;

    // Insert optimization parameters into Cloudinary URL
    const cloudinaryTransform = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;

    // Replace /upload/ with /upload/{transformations}/
    return imageUrl.replace("/upload/", `/upload/${cloudinaryTransform}/`);
};

/**
 * Ultra-lightweight image URLs for feed/list performance
 */
export const createTinyImageUrl = (imageUrl) => {
    return optimizeImageUrl(imageUrl, {
        width: 150, // Increased for better quality
        height: 150, // Increased for better quality
        quality: 80, // Better quality than auto
        format: "webp",
        crop: "fill",
    });
};

export const createSmallImageUrl = (imageUrl) => {
    return optimizeImageUrl(imageUrl, {
        width: 300, // Much higher resolution
        height: 300, // Much higher resolution
        quality: 85, // High quality
        format: "webp",
        crop: "fill",
    });
};

/**
 * Medium quality images for profile pages and detailed views
 */
export const createMediumImageUrl = (imageUrl) => {
    return optimizeImageUrl(imageUrl, {
        width: 500,
        height: 500,
        quality: 90,
        format: "webp",
        crop: "fill",
    });
};

/**
 * High quality images for cover photos and full post images
 */
export const createLargeImageUrl = (imageUrl) => {
    return optimizeImageUrl(imageUrl, {
        width: 1200,
        height: 600,
        quality: 95,
        format: "webp",
        crop: "fill",
    });
};

/**
 * Optimize user object for API responses
 * @param {object} user - User object
 * @returns {object} - User with optimized image URLs
 */
export const optimizeUserForAPI = (user) => {
    if (!user) return user;

    const optimizedUser = { ...user };

    if (optimizedUser.profileImg) {
        optimizedUser.profileImg = optimizeImageUrl(optimizedUser.profileImg, {
            width: 150, // Better quality for profile images
            height: 150,
            quality: 85,
            format: "webp",
        });
    }

    // Keep coverImg but optimize it
    if (optimizedUser.coverImg) {
        optimizedUser.coverImg = createLargeImageUrl(optimizedUser.coverImg);
    }

    return optimizedUser;
};

/**
 * Optimize user profile image specifically for posts/comments
 * @param {string} profileImg - Profile image URL
 * @returns {string} - Optimized profile image URL
 */
export const optimizeProfileImg = (profileImg) => {
    return optimizeImageUrl(profileImg, {
        width: 80, // Increased size
        height: 80,
        quality: 85, // Better quality
        format: "webp",
    });
};
