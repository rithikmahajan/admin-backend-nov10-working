import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Async thunks for review management

// Fetch all products with pagination and filtering
export const fetchProductsForReviews = createAsyncThunk(
    'reviews/fetchProductsForReviews',
    async (params = {}, { rejectWithValue }) => {
        try {
            const { page = 1, limit = 20, category, subcategory, search } = params;
            
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });
            
            if (category && category !== 'All categories') {
                queryParams.append('categoryId', category);
            }
            if (subcategory && subcategory !== 'sub categories') {
                queryParams.append('subCategoryId', subcategory);
            }
            if (search && search.trim()) {
                queryParams.append('search', search.trim());
            }

            const response = await axios.get(`${API_BASE_URL}/items?${queryParams.toString()}`);
            
            if (response.data && response.data.items) {
                return {
                    products: response.data.items || [],
                    pagination: {
                        currentPage: response.data.currentPage || 1,
                        totalPages: response.data.totalPages || 1
                    },
                    total: response.data.items.length || 0
                };
            } else {
                throw new Error('Failed to fetch products - Invalid response format');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                url: `${API_BASE_URL}/items?${params ? new URLSearchParams(params).toString() : ''}`
            });
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Fetch categories
export const fetchCategories = createAsyncThunk(
    'reviews/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/categories`);
            
            if (response.data && response.data.success && response.data.data) {
                const categories = response.data.data || [];
                return [{ _id: 'all', name: 'All categories' }, ...categories];
            } else {
                throw new Error('Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                url: `${API_BASE_URL}/categories`
            });
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Fetch subcategories
export const fetchSubCategories = createAsyncThunk(
    'reviews/fetchSubCategories',
    async (categoryId, { rejectWithValue }) => {
        try {
            let url = `${API_BASE_URL}/subcategories`;
            if (categoryId && categoryId !== 'all') {
                url += `?categoryId=${categoryId}`;
            }
            
            const response = await axios.get(url);
            
            if (response.data && Array.isArray(response.data)) {
                const subcategories = response.data || [];
                return [{ _id: 'all', name: 'sub categories' }, ...subcategories];
            } else {
                throw new Error('Failed to fetch subcategories');
            }
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                url: `${API_BASE_URL}/subcategories${categoryId && categoryId !== 'all' ? '?categoryId=' + categoryId : ''}`
            });
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Fetch reviews for a specific item
export const fetchItemReviews = createAsyncThunk(
    'reviews/fetchItemReviews',
    async (itemId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/reviews/public/${itemId}/reviews`);
            
            if (response.data) {
                return {
                    itemId,
                    reviews: response.data.reviews || []
                };
            } else {
                throw new Error('Failed to fetch reviews');
            }
        } catch (error) {
            console.error('Error fetching item reviews:', error);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Create admin review (fake review)
export const createAdminReview = createAsyncThunk(
    'reviews/createAdminReview',
    async ({ itemId, reviewData, token }, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/reviews/admin/${itemId}/reviews`,
                reviewData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data) {
                return {
                    itemId,
                    review: response.data.review,
                    averageRating: response.data.averageRating
                };
            } else {
                throw new Error('Failed to create review');
            }
        } catch (error) {
            console.error('Error creating admin review:', error);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Update review settings (enable/disable reviews for item)
export const updateReviewSettings = createAsyncThunk(
    'reviews/updateReviewSettings',
    async ({ itemId, settings, token }, { rejectWithValue }) => {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/reviews/admin/${itemId}/review-settings`,
                settings,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data) {
                return {
                    itemId,
                    settings: {
                        isReviewDisplayEnabled: response.data.item.isReviewDisplayEnabled,
                        isReviewSubmissionEnabled: response.data.item.isReviewSubmissionEnabled
                    }
                };
            } else {
                throw new Error('Failed to update review settings');
            }
        } catch (error) {
            console.error('Error updating review settings:', error);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const initialState = {
    // Products data
    products: [],
    filteredProducts: [],
    totalProducts: 0,
    currentPage: 1,
    totalPages: 1,
    
    // Categories and subcategories
    categories: [],
    subcategories: [],
    selectedCategory: 'All categories',
    selectedSubcategory: 'sub categories',
    
    // Search and filters
    searchTerm: '',
    
    // Reviews data
    itemReviews: {}, // { itemId: { reviews: [], averageRating: 0 } }
    
    // UI states
    loading: {
        products: false,
        categories: false,
        subcategories: false,
        reviews: false,
        creatingReview: false,
        updatingSettings: false
    },
    error: {
        products: null,
        categories: null,
        subcategories: null,
        reviews: null,
        creatingReview: null,
        updatingSettings: null
    },
    
    // Modal and UI states
    selectedProductForReview: null,
    showReviewDetails: false,
};

const reviewSlice = createSlice({
    name: 'reviews',
    initialState,
    reducers: {
        // Filter and search actions
        setSearchTerm: (state, action) => {
            state.searchTerm = action.payload;
            state.filteredProducts = filterProducts(state);
        },
        
        setSelectedCategory: (state, action) => {
            state.selectedCategory = action.payload;
            state.selectedSubcategory = 'sub categories'; // Reset subcategory when category changes
            state.filteredProducts = filterProducts(state);
        },
        
        setSelectedSubcategory: (state, action) => {
            state.selectedSubcategory = action.payload;
            state.filteredProducts = filterProducts(state);
        },
        
        // UI actions
        setSelectedProductForReview: (state, action) => {
            state.selectedProductForReview = action.payload;
        },
        
        setShowReviewDetails: (state, action) => {
            state.showReviewDetails = action.payload;
        },
        
        // Clear errors
        clearError: (state, action) => {
            const errorType = action.payload;
            if (errorType) {
                state.error[errorType] = null;
            } else {
                state.error = {
                    products: null,
                    categories: null,
                    subcategories: null,
                    reviews: null,
                    creatingReview: null,
                    updatingSettings: null
                };
            }
        },
        
        // Update product's review settings locally
        updateProductReviewSettings: (state, action) => {
            const { itemId, settings } = action.payload;
            const productIndex = state.products.findIndex(p => p._id === itemId);
            if (productIndex !== -1) {
                state.products[productIndex] = {
                    ...state.products[productIndex],
                    ...settings
                };
            }
            const filteredIndex = state.filteredProducts.findIndex(p => p._id === itemId);
            if (filteredIndex !== -1) {
                state.filteredProducts[filteredIndex] = {
                    ...state.filteredProducts[filteredIndex],
                    ...settings
                };
            }
        },
    },
    extraReducers: (builder) => {
        // Fetch products
        builder
            .addCase(fetchProductsForReviews.pending, (state) => {
                state.loading.products = true;
                state.error.products = null;
            })
            .addCase(fetchProductsForReviews.fulfilled, (state, action) => {
                state.loading.products = false;
                state.products = action.payload.products;
                state.totalProducts = action.payload.total;
                state.filteredProducts = filterProducts(state);
                
                if (action.payload.pagination) {
                    state.currentPage = action.payload.pagination.currentPage || 1;
                    state.totalPages = action.payload.pagination.totalPages || 1;
                }
            })
            .addCase(fetchProductsForReviews.rejected, (state, action) => {
                state.loading.products = false;
                state.error.products = action.payload;
            });

        // Fetch categories
        builder
            .addCase(fetchCategories.pending, (state) => {
                state.loading.categories = true;
                state.error.categories = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.loading.categories = false;
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading.categories = false;
                state.error.categories = action.payload;
            });

        // Fetch subcategories
        builder
            .addCase(fetchSubCategories.pending, (state) => {
                state.loading.subcategories = true;
                state.error.subcategories = null;
            })
            .addCase(fetchSubCategories.fulfilled, (state, action) => {
                state.loading.subcategories = false;
                state.subcategories = action.payload;
            })
            .addCase(fetchSubCategories.rejected, (state, action) => {
                state.loading.subcategories = false;
                state.error.subcategories = action.payload;
            });

        // Fetch item reviews
        builder
            .addCase(fetchItemReviews.pending, (state) => {
                state.loading.reviews = true;
                state.error.reviews = null;
            })
            .addCase(fetchItemReviews.fulfilled, (state, action) => {
                state.loading.reviews = false;
                const { itemId, reviews } = action.payload;
                if (!state.itemReviews[itemId]) {
                    state.itemReviews[itemId] = {};
                }
                state.itemReviews[itemId].reviews = reviews;
            })
            .addCase(fetchItemReviews.rejected, (state, action) => {
                state.loading.reviews = false;
                state.error.reviews = action.payload;
            });

        // Create admin review
        builder
            .addCase(createAdminReview.pending, (state) => {
                state.loading.creatingReview = true;
                state.error.creatingReview = null;
            })
            .addCase(createAdminReview.fulfilled, (state, action) => {
                state.loading.creatingReview = false;
                const { itemId, review, averageRating } = action.payload;
                
                // Update the item reviews
                if (!state.itemReviews[itemId]) {
                    state.itemReviews[itemId] = { reviews: [] };
                }
                state.itemReviews[itemId].reviews.push(review);
                state.itemReviews[itemId].averageRating = averageRating;
                
                // Update the product in both arrays
                const updateProduct = (product) => {
                    if (product._id === itemId) {
                        return {
                            ...product,
                            averageRating,
                            reviews: [...(product.reviews || []), review]
                        };
                    }
                    return product;
                };
                
                state.products = state.products.map(updateProduct);
                state.filteredProducts = state.filteredProducts.map(updateProduct);
            })
            .addCase(createAdminReview.rejected, (state, action) => {
                state.loading.creatingReview = false;
                state.error.creatingReview = action.payload;
            });

        // Update review settings
        builder
            .addCase(updateReviewSettings.pending, (state) => {
                state.loading.updatingSettings = true;
                state.error.updatingSettings = null;
            })
            .addCase(updateReviewSettings.fulfilled, (state, action) => {
                state.loading.updatingSettings = false;
                const { itemId, settings } = action.payload;
                
                // Update the product in both arrays
                const updateProduct = (product) => {
                    if (product._id === itemId) {
                        return {
                            ...product,
                            ...settings
                        };
                    }
                    return product;
                };
                
                state.products = state.products.map(updateProduct);
                state.filteredProducts = state.filteredProducts.map(updateProduct);
            })
            .addCase(updateReviewSettings.rejected, (state, action) => {
                state.loading.updatingSettings = false;
                state.error.updatingSettings = action.payload;
            });
    },
});

// Helper function to filter products
const filterProducts = (state) => {
    let filtered = [...state.products];
    
    // Apply search filter
    if (state.searchTerm && state.searchTerm.trim()) {
        const searchLower = state.searchTerm.toLowerCase();
        filtered = filtered.filter(product => 
            product.name?.toLowerCase().includes(searchLower) ||
            product.title?.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower)
        );
    }
    
    // Apply category filter
    if (state.selectedCategory && state.selectedCategory !== 'All categories') {
        filtered = filtered.filter(product => {
            // Handle both object and string category references
            const categoryName = typeof product.categoryId === 'object' 
                ? product.categoryId?.name 
                : product.category;
            return categoryName === state.selectedCategory;
        });
    }
    
    // Apply subcategory filter
    if (state.selectedSubcategory && state.selectedSubcategory !== 'sub categories') {
        filtered = filtered.filter(product => {
            // Handle both object and string subcategory references
            const subcategoryName = typeof product.subCategoryId === 'object' 
                ? product.subCategoryId?.name 
                : product.subcategory;
            return subcategoryName === state.selectedSubcategory;
        });
    }
    
    return filtered;
};

export const {
    setSearchTerm,
    setSelectedCategory,
    setSelectedSubcategory,
    setSelectedProductForReview,
    setShowReviewDetails,
    clearError,
    updateProductReviewSettings
} = reviewSlice.actions;

export default reviewSlice.reducer;
