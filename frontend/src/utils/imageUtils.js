/**
 * Frontend utility functions for optimizing Cloudinary image URLs
 */

/**
 * Transform Cloudinary URLs to use high-quality versions
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {object} options - Optimization options
 * @returns {string} - Optimized URL
 */
export const optimizeImageUrl = (imageUrl, options = {}) => {
    if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
        return imageUrl;
    }

    const { width = 800, height = 600, quality = 90, format = "webp", crop = "limit" } = options;

    // Insert optimization parameters into Cloudinary URL
    const cloudinaryTransform = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;

    // Replace /upload/ with /upload/{transformations}/
    return imageUrl.replace("/upload/", `/upload/${cloudinaryTransform}/`);
};

/**
 * Ultra high quality image URLs for post images - maximum crispness
 */
export const createHighQualityPostImage = (imageUrl) => {
    return optimizeImageUrl(imageUrl, {
        width: 1600, // Increased resolution for retina displays
        height: 1200, // Increased resolution
        quality: 100, // Maximum quality for crisp images
        format: "webp",
        crop: "limit", // Maintains aspect ratio without cropping
    });
};

/**
 * Medium quality images for thumbnails and smaller displays
 */
export const createMediumQualityImage = (imageUrl) => {
    return optimizeImageUrl(imageUrl, {
        width: 600,
        height: 400,
        quality: 85,
        format: "webp",
        crop: "limit",
    });
};

/**
 * High quality profile images
 */
export const createHighQualityProfileImage = (imageUrl) => {
    return optimizeImageUrl(imageUrl, {
        width: 300,
        height: 300,
        quality: 90,
        format: "webp",
        crop: "fill",
    });
};

/**
 * High quality cover images
 */
export const createHighQualityCoverImage = (imageUrl) => {
    return optimizeImageUrl(imageUrl, {
        width: 1500,
        height: 500,
        quality: 95,
        format: "webp",
        crop: "fill",
    });
};
