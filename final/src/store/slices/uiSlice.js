import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  // Loading states
  isLoading: false,
  
  // Modal states
  modals: {
    auth: false,
    cart: false,
    wishlist: false,
    quickView: false,
    addressForm: false,
    confirmDialog: false,
  },
  
  // Current modal data
  modalData: null,
  
  // Notifications/toasts
  notifications: [],
  
  // Mobile menu
  mobileMenuOpen: false,
  
  // Search
  searchOpen: false,
  searchQuery: '',
  
  // Theme
  theme: 'light',
  
  // Layout
  sidebarOpen: true,
  
  // Overlay
  overlayVisible: false,
};

let notificationId = 0;

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    openModal: (state, action) => {
      const { modal, data = null } = action.payload;
      state.modals[modal] = true;
      state.modalData = data;
      state.overlayVisible = true;
    },
    
    closeModal: (state, action) => {
      const modal = action.payload;
      state.modals[modal] = false;
      if (!Object.values(state.modals).some(Boolean)) {
        state.modalData = null;
        state.overlayVisible = false;
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modal => {
        state.modals[modal] = false;
      });
      state.modalData = null;
      state.overlayVisible = false;
    },
    
    addNotification: (state, action) => {
      const notification = {
        id: ++notificationId,
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notif => notif.id !== action.payload
      );
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    
    closeMobileMenu: (state) => {
      state.mobileMenuOpen = false;
    },
    
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },
    
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchOpen = false;
    },
    
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
  },
});

// Export actions
export const {
  setLoading,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  toggleMobileMenu,
  closeMobileMenu,
  toggleSearch,
  setSearchQuery,
  clearSearch,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
} = uiSlice.actions;

// Selectors
export const selectIsLoading = (state) => state.ui.isLoading;
export const selectModals = (state) => state.ui.modals;
export const selectModalData = (state) => state.ui.modalData;
export const selectNotifications = (state) => state.ui.notifications;
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;
export const selectSearchOpen = (state) => state.ui.searchOpen;
export const selectSearchQuery = (state) => state.ui.searchQuery;
export const selectTheme = (state) => state.ui.theme;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;

// Export reducer
export default uiSlice.reducer;
