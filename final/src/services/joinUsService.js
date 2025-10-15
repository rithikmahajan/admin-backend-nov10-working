import axios from "axios";

// Create axios instance with default configuration
const joinUsAPI = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"}/joinus`,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add auth token
joinUsAPI.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
joinUsAPI.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem("authToken");
            window.location.href = "/admin/login";
        }
        return Promise.reject(error);
    }
);

/**
 * Join Us Posts Service
 */
class JoinUsService {
    /**
     * Create a new join us post
     * @param {Object} postData - The post data
     * @returns {Promise} API response
     */
    static async createPost(postData) {
        try {
            console.log('Raw post data received:', postData);
            
            // Validate data before sending
            const formattedData = this.formatPostData(postData);
            console.log('Formatted data to send:', formattedData);
            
            const response = await joinUsAPI.post("/", formattedData);
            return {
                success: true,
                data: response.data,
                message: "Join Us post created successfully"
            };
        } catch (error) {
            console.error("Create post error:", error);
            console.error("Error response:", error.response);
            console.error("Error response data:", error.response?.data);
            
            // Handle validation errors specifically
            if (error.response?.status === 400) {
                const validationErrors = error.response?.data?.errors || [];
                const errorMessages = validationErrors.map(err => err.msg || err.message).join(', ');
                
                console.error("Validation errors:", validationErrors);
                console.error("Error messages:", errorMessages);
                
                return {
                    success: false,
                    message: errorMessages || error.response?.data?.message || "Validation failed",
                    errors: validationErrors
                };
            }
            
            return {
                success: false,
                message: error.message || error.response?.data?.message || "Failed to create post",
                errors: error.response?.data?.details || []
            };
        }
    }

    /**
     * Get all join us posts with filtering and pagination
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    static async getAllPosts(params = {}) {
        try {
            const response = await joinUsAPI.get("/", { params });
            return {
                success: true,
                data: response.data.data,
                meta: response.data.meta,
                message: "Posts retrieved successfully"
            };
        } catch (error) {
            console.error("Get all posts error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to retrieve posts",
                data: [],
                meta: {}
            };
        }
    }

    /**
     * Get active posts by section
     * @param {string} section - The section type (head, posting, bottom)
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    static async getActivePostsBySection(section, params = {}) {
        try {
            const response = await joinUsAPI.get(`/section/${section}`, { params });
            return {
                success: true,
                data: response.data.data,
                message: `Active ${section} posts retrieved successfully`
            };
        } catch (error) {
            console.error("Get active posts by section error:", error);
            return {
                success: false,
                message: error.response?.data?.message || `Failed to retrieve ${section} posts`,
                data: []
            };
        }
    }

    /**
     * Get all active posts grouped by section
     * @param {Object} params - Query parameters
     * @returns {Promise} API response
     */
    static async getAllActivePosts(params = {}) {
        try {
            const response = await joinUsAPI.get("/active", { params });
            return {
                success: true,
                data: response.data.data,
                message: "All active posts retrieved successfully"
            };
        } catch (error) {
            console.error("Get all active posts error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to retrieve active posts",
                data: {}
            };
        }
    }

    /**
     * Get post by ID
     * @param {string} id - Post ID
     * @returns {Promise} API response
     */
    static async getPostById(id) {
        try {
            const response = await joinUsAPI.get(`/${id}`);
            return {
                success: true,
                data: response.data.data,
                message: "Post retrieved successfully"
            };
        } catch (error) {
            console.error("Get post by ID error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to retrieve post",
                data: null
            };
        }
    }

    /**
     * Update post
     * @param {string} id - Post ID
     * @param {Object} updateData - Update data
     * @returns {Promise} API response
     */
    static async updatePost(id, updateData) {
        try {
            const response = await joinUsAPI.put(`/${id}`, updateData);
            return {
                success: true,
                data: response.data.data,
                message: "Post updated successfully"
            };
        } catch (error) {
            console.error("Update post error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to update post",
                errors: error.response?.data?.details || []
            };
        }
    }

    /**
     * Delete post (soft delete)
     * @param {string} id - Post ID
     * @returns {Promise} API response
     */
    static async deletePost(id) {
        try {
            const response = await joinUsAPI.delete(`/${id}`);
            return {
                success: true,
                data: response.data.data,
                message: "Post deleted successfully"
            };
        } catch (error) {
            console.error("Delete post error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to delete post"
            };
        }
    }

    /**
     * Permanently delete post
     * @param {string} id - Post ID
     * @returns {Promise} API response
     */
    static async permanentDeletePost(id) {
        try {
            const response = await joinUsAPI.delete(`/${id}/permanent`);
            return {
                success: true,
                data: response.data.data,
                message: "Post permanently deleted successfully"
            };
        } catch (error) {
            console.error("Permanent delete post error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to permanently delete post"
            };
        }
    }

    /**
     * Publish post
     * @param {string} id - Post ID
     * @returns {Promise} API response
     */
    static async publishPost(id) {
        try {
            const response = await joinUsAPI.patch(`/${id}/publish`);
            return {
                success: true,
                data: response.data.data,
                message: "Post published successfully"
            };
        } catch (error) {
            console.error("Publish post error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to publish post"
            };
        }
    }

    /**
     * Unpublish post
     * @param {string} id - Post ID
     * @returns {Promise} API response
     */
    static async unpublishPost(id) {
        try {
            const response = await joinUsAPI.patch(`/${id}/unpublish`);
            return {
                success: true,
                data: response.data.data,
                message: "Post unpublished successfully"
            };
        } catch (error) {
            console.error("Unpublish post error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to unpublish post"
            };
        }
    }

    /**
     * Update post priorities in bulk
     * @param {Array} priorities - Array of {id, priority, section}
     * @returns {Promise} API response
     */
    static async updatePriorities(priorities) {
        try {
            const response = await joinUsAPI.patch("/priorities/bulk", { priorities });
            return {
                success: true,
                data: response.data.data,
                message: "Post priorities updated successfully"
            };
        } catch (error) {
            console.error("Update priorities error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to update priorities"
            };
        }
    }

    /**
     * Get post analytics
     * @param {string} id - Post ID
     * @param {Object} params - Query parameters (startDate, endDate)
     * @returns {Promise} API response
     */
    static async getPostAnalytics(id, params = {}) {
        try {
            const response = await joinUsAPI.get(`/${id}/analytics`, { params });
            return {
                success: true,
                data: response.data.data,
                message: "Post analytics retrieved successfully"
            };
        } catch (error) {
            console.error("Get post analytics error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to retrieve analytics",
                data: null
            };
        }
    }

    /**
     * Track post click
     * @param {string} id - Post ID
     * @returns {Promise} API response
     */
    static async trackClick(id) {
        try {
            const response = await joinUsAPI.post(`/${id}/track/click`);
            return {
                success: true,
                data: response.data.data,
                message: "Click tracked successfully"
            };
        } catch (error) {
            console.error("Track click error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to track click"
            };
        }
    }

    /**
     * Track post conversion
     * @param {string} id - Post ID
     * @returns {Promise} API response
     */
    static async trackConversion(id) {
        try {
            const response = await joinUsAPI.post(`/${id}/track/conversion`);
            return {
                success: true,
                data: response.data.data,
                message: "Conversion tracked successfully"
            };
        } catch (error) {
            console.error("Track conversion error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to track conversion"
            };
        }
    }

    /**
     * Bulk update posts
     * @param {Array} postIds - Array of post IDs
     * @param {Object} updates - Update data
     * @returns {Promise} API response
     */
    static async bulkUpdatePosts(postIds, updates) {
        try {
            const response = await joinUsAPI.patch("/bulk", { postIds, updates });
            return {
                success: true,
                data: response.data.data,
                message: "Posts updated successfully"
            };
        } catch (error) {
            console.error("Bulk update posts error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to update posts"
            };
        }
    }

    /**
     * Upload image (if you have a separate image upload endpoint)
     * @param {File} file - Image file
     * @returns {Promise} API response
     */
    static async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await axios.post(
                `${API_BASE_URL}/api/images/upload`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            return {
                success: true,
                data: response.data.data,
                message: "Image uploaded successfully"
            };
        } catch (error) {
            console.error("Upload image error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to upload image"
            };
        }
    }

    /**
     * Validation helpers
     */
    static validatePostData(postData) {
        const errors = [];

        if (!postData.title?.trim()) {
            errors.push("Title is required");
        } else if (postData.title.length > 200) {
            errors.push("Title must be less than 200 characters");
        }

        if (!postData.detail?.trim()) {
            errors.push("Detail is required");
        } else if (postData.detail.length > 2000) {
            errors.push("Detail must be less than 2000 characters");
        }

        if (postData.section && !["head", "posting", "bottom"].includes(postData.section)) {
            errors.push("Section must be one of: head, posting, bottom");
        }

        if (postData.priority && (postData.priority < 1 || !Number.isInteger(postData.priority))) {
            errors.push("Priority must be a positive integer");
        }

        if (postData.textPosition) {
            const { x, y } = postData.textPosition;
            if (x !== undefined && (x < 0 || x > 100)) {
                errors.push("Text position X must be between 0 and 100");
            }
            if (y !== undefined && (y < 0 || y > 100)) {
                errors.push("Text position Y must be between 0 and 100");
            }
        }

        return errors;
    }

    /**
     * Format post data for API
     */
    static formatPostData(postData) {
        const formatted = { ...postData };

        // Ensure required defaults
        formatted.section = formatted.section || "posting";
        formatted.textPosition = formatted.textPosition || { x: 20, y: 20 };
        formatted.isActive = formatted.isActive !== undefined ? formatted.isActive : true;
        formatted.isPublished = formatted.isPublished !== undefined ? formatted.isPublished : false;

        // Ensure required fields are not empty or null
        if (!formatted.title || formatted.title.trim() === '') {
            throw new Error('Title is required');
        }
        
        if (!formatted.detail || formatted.detail.trim() === '') {
            throw new Error('Detail is required');
        }

        // Trim and validate string fields
        formatted.title = formatted.title.trim();
        formatted.detail = formatted.detail.trim();

        // Clean up empty values (but preserve required fields)
        Object.keys(formatted).forEach(key => {
            if (key !== 'title' && key !== 'detail' && (formatted[key] === "" || formatted[key] === null)) {
                delete formatted[key];
            }
        });

        return formatted;
    }
}

export default JoinUsService;
