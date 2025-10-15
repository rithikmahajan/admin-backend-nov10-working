import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  user: null,
  addresses: [],
  preferences: {
    theme: 'light',
    language: 'en',
    currency: 'USD',
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  },
  isLoading: false,
  error: null,
};

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setAddresses: (state, action) => {
      state.addresses = action.payload;
    },
    addAddress: (state, action) => {
      state.addresses.push(action.payload);
    },
    updateAddress: (state, action) => {
      const { id, ...updatedData } = action.payload;
      const index = state.addresses.findIndex(addr => addr.id === id);
      if (index >= 0) {
        state.addresses[index] = { ...state.addresses[index], ...updatedData };
      }
    },
    removeAddress: (state, action) => {
      state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
    },
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    clearUser: (state) => {
      state.user = null;
      state.addresses = [];
    },
  },
});

export const {
  setUser,
  updateUser,
  setAddresses,
  addAddress,
  updateAddress,
  removeAddress,
  updatePreferences,
  clearUser,
} = userSlice.actions;

export const selectUser = (state) => state.user.user;
export const selectUserAddresses = (state) => state.user.addresses;
export const selectUserPreferences = (state) => state.user.preferences;

export default userSlice.reducer;
