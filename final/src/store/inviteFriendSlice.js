import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { inviteFriendAPI } from '../api/endpoints';

// Initial state
const initialState = {
    inviteCodes: [],
    currentInviteCode: null,
    stats: {},
    detailedStats: {},
    userRedeemedCodes: [],
    analytics: {
        redemption: [],
        performance: {}
    },
    loading: false,
    error: null,
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCodes: 0,
        hasNextPage: false,
        hasPrevPage: false
    },
    filters: {
        search: '',
        status: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    }
};

// Async thunks for API calls

// Get all invite codes (admin)
export const getAllInviteCodes = createAsyncThunk(
    'inviteFriend/getAllInviteCodes',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await inviteFriendAPI.getAllInviteCodes(params);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Get invite code by ID
export const getInviteCodeById = createAsyncThunk(
    'inviteFriend/getInviteCodeById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.getInviteCodeById(id), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Create invite code
export const createInviteCode = createAsyncThunk(
    'inviteFriend/createInviteCode',
    async (inviteCodeData, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.createInviteCode, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(inviteCodeData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Update invite code
export const updateInviteCode = createAsyncThunk(
    'inviteFriend/updateInviteCode',
    async ({ id, updates }, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.updateInviteCode(id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Delete invite code
export const deleteInviteCode = createAsyncThunk(
    'inviteFriend/deleteInviteCode',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.deleteInviteCode(id), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { ...data, deletedId: id };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Toggle invite code status
export const toggleInviteCodeStatus = createAsyncThunk(
    'inviteFriend/toggleInviteCodeStatus',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.toggleStatus(id), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Generate invite code
export const generateInviteCode = createAsyncThunk(
    'inviteFriend/generateInviteCode',
    async (options = {}, { rejectWithValue }) => {
        try {
            const response = await inviteFriendAPI.generateCode(options);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Validate invite code (public)
export const validateInviteCode = createAsyncThunk(
    'inviteFriend/validateInviteCode',
    async (code, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.validateCode(code), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Redeem invite code (user)
export const redeemInviteCode = createAsyncThunk(
    'inviteFriend/redeemInviteCode',
    async (code, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.redeemCode, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ code })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Get invite code stats
export const getInviteCodeStats = createAsyncThunk(
    'inviteFriend/getInviteCodeStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.getStats, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Get detailed stats (admin)
export const getDetailedInviteCodeStats = createAsyncThunk(
    'inviteFriend/getDetailedInviteCodeStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.getDetailedStats, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Get user's redeemed codes
export const getUserRedeemedCodes = createAsyncThunk(
    'inviteFriend/getUserRedeemedCodes',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.getUserRedeemed, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Bulk delete invite codes
export const bulkDeleteInviteCodes = createAsyncThunk(
    'inviteFriend/bulkDeleteInviteCodes',
    async (ids, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.bulkDelete, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ ids })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { ...data, deletedIds: ids };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Bulk update status
export const bulkUpdateStatus = createAsyncThunk(
    'inviteFriend/bulkUpdateStatus',
    async ({ ids, status }, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.bulkUpdateStatus, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ ids, status })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { ...data, updatedIds: ids, newStatus: status };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Get redemption analytics
export const getRedemptionAnalytics = createAsyncThunk(
    'inviteFriend/getRedemptionAnalytics',
    async (days = 30, { rejectWithValue }) => {
        try {
            const response = await fetch(`${endpoints.inviteFriend.getRedemptionAnalytics}?days=${days}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Get performance analytics
export const getPerformanceAnalytics = createAsyncThunk(
    'inviteFriend/getPerformanceAnalytics',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(endpoints.inviteFriend.getPerformanceAnalytics, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Create the slice
const inviteFriendSlice = createSlice({
    name: 'inviteFriend',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentInviteCode: (state, action) => {
            state.currentInviteCode = action.payload;
        },
        updateFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        resetFilters: (state) => {
            state.filters = initialState.filters;
        },
        clearCurrentInviteCode: (state) => {
            state.currentInviteCode = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Get all invite codes
            .addCase(getAllInviteCodes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllInviteCodes.fulfilled, (state, action) => {
                state.loading = false;
                state.inviteCodes = action.payload.data.inviteCodes || [];
                state.pagination = action.payload.data.pagination || initialState.pagination;
            })
            .addCase(getAllInviteCodes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get invite code by ID
            .addCase(getInviteCodeById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getInviteCodeById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentInviteCode = action.payload.data;
            })
            .addCase(getInviteCodeById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create invite code
            .addCase(createInviteCode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createInviteCode.fulfilled, (state, action) => {
                state.loading = false;
                state.inviteCodes.unshift(action.payload.data);
            })
            .addCase(createInviteCode.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update invite code
            .addCase(updateInviteCode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateInviteCode.fulfilled, (state, action) => {
                state.loading = false;
                const updatedCode = action.payload.data;
                const index = state.inviteCodes.findIndex(code => code._id === updatedCode._id);
                if (index !== -1) {
                    state.inviteCodes[index] = updatedCode;
                }
                if (state.currentInviteCode && state.currentInviteCode._id === updatedCode._id) {
                    state.currentInviteCode = updatedCode;
                }
            })
            .addCase(updateInviteCode.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete invite code
            .addCase(deleteInviteCode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteInviteCode.fulfilled, (state, action) => {
                state.loading = false;
                state.inviteCodes = state.inviteCodes.filter(code => code._id !== action.payload.deletedId);
                if (state.currentInviteCode && state.currentInviteCode._id === action.payload.deletedId) {
                    state.currentInviteCode = null;
                }
            })
            .addCase(deleteInviteCode.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Toggle status
            .addCase(toggleInviteCodeStatus.fulfilled, (state, action) => {
                const updatedCode = action.payload.data;
                const index = state.inviteCodes.findIndex(code => code._id === updatedCode._id);
                if (index !== -1) {
                    state.inviteCodes[index] = updatedCode;
                }
            })

            // Stats
            .addCase(getInviteCodeStats.fulfilled, (state, action) => {
                state.stats = action.payload.data;
            })
            .addCase(getDetailedInviteCodeStats.fulfilled, (state, action) => {
                state.detailedStats = action.payload.data;
            })

            // User redeemed codes
            .addCase(getUserRedeemedCodes.fulfilled, (state, action) => {
                state.userRedeemedCodes = action.payload.data;
            })

            // Bulk operations
            .addCase(bulkDeleteInviteCodes.fulfilled, (state, action) => {
                state.inviteCodes = state.inviteCodes.filter(
                    code => !action.payload.deletedIds.includes(code._id)
                );
            })
            .addCase(bulkUpdateStatus.fulfilled, (state, action) => {
                const { updatedIds, newStatus } = action.payload;
                state.inviteCodes = state.inviteCodes.map(code => 
                    updatedIds.includes(code._id) 
                        ? { ...code, status: newStatus }
                        : code
                );
            })

            // Analytics
            .addCase(getRedemptionAnalytics.fulfilled, (state, action) => {
                state.analytics.redemption = action.payload.data;
            })
            .addCase(getPerformanceAnalytics.fulfilled, (state, action) => {
                state.analytics.performance = action.payload.data;
            });
    }
});

// Export actions
export const {
    clearError,
    setCurrentInviteCode,
    updateFilters,
    resetFilters,
    clearCurrentInviteCode
} = inviteFriendSlice.actions;

// Export reducer
export default inviteFriendSlice.reducer;
