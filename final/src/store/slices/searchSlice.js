import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  query: '',
  results: [],
  suggestions: [],
  recentSearches: [],
  isLoading: false,
  error: null,
  filters: {
    category: null,
    priceRange: { min: 0, max: 10000 },
    sortBy: 'relevance',
  },
  hasSearched: false,
  totalResults: 0,
};

// Search slice
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    
    setResults: (state, action) => {
      state.results = action.payload.results || [];
      state.totalResults = action.payload.total || 0;
      state.hasSearched = true;
    },
    
    setSuggestions: (state, action) => {
      state.suggestions = action.payload;
    },
    
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    addToRecentSearches: (state, action) => {
      const query = action.payload;
      if (query && query.trim()) {
        // Remove if already exists
        state.recentSearches = state.recentSearches.filter(
          search => search.toLowerCase() !== query.toLowerCase()
        );
        // Add to beginning
        state.recentSearches.unshift(query);
        // Keep only last 10
        if (state.recentSearches.length > 10) {
          state.recentSearches = state.recentSearches.slice(0, 10);
        }
        // Save to localStorage
        localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
      }
    },
    
    clearRecentSearches: (state) => {
      state.recentSearches = [];
      localStorage.removeItem('recentSearches');
    },
    
    restoreRecentSearches: (state) => {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        try {
          state.recentSearches = JSON.parse(saved);
        } catch (error) {
          console.error('Failed to restore recent searches:', error);
          localStorage.removeItem('recentSearches');
        }
      }
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    clearSearch: (state) => {
      state.query = '';
      state.results = [];
      state.suggestions = [];
      state.error = null;
      state.hasSearched = false;
      state.totalResults = 0;
    },
    
    clearResults: (state) => {
      state.results = [];
      state.hasSearched = false;
      state.totalResults = 0;
    },
  },
});

// Export actions
export const {
  setQuery,
  setResults,
  setSuggestions,
  setLoading,
  setError,
  clearError,
  addToRecentSearches,
  clearRecentSearches,
  restoreRecentSearches,
  setFilters,
  clearFilters,
  clearSearch,
  clearResults,
} = searchSlice.actions;

// Selectors
export const selectSearch = (state) => state.search;
export const selectSearchQuery = (state) => state.search.query;
export const selectSearchResults = (state) => state.search.results;
export const selectSearchSuggestions = (state) => state.search.suggestions;
export const selectSearchLoading = (state) => state.search.isLoading;
export const selectSearchError = (state) => state.search.error;
export const selectRecentSearches = (state) => state.search.recentSearches;
export const selectSearchFilters = (state) => state.search.filters;
export const selectHasSearched = (state) => state.search.hasSearched;
export const selectTotalSearchResults = (state) => state.search.totalResults;

// Export reducer
export default searchSlice.reducer;
