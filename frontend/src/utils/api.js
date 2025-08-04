// API utility functions with credentials included

export const apiRequest = async (url, options = {}) => {
    const defaultOptions = {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    return response;
};

// Convenience methods
export const apiGet = (url, options = {}) => {
    return apiRequest(url, { method: "GET", ...options });
};

export const apiPost = (url, data, options = {}) => {
    return apiRequest(url, {
        method: "POST",
        body: JSON.stringify(data),
        ...options,
    });
};

export const apiPut = (url, data, options = {}) => {
    return apiRequest(url, {
        method: "PUT",
        body: JSON.stringify(data),
        ...options,
    });
};

export const apiDelete = (url, options = {}) => {
    return apiRequest(url, { method: "DELETE", ...options });
};
