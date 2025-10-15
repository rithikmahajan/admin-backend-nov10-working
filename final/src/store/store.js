import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import all slices
import authSlice from './slices/authSlice';
import cartSlice from './slices/cartSlice';
import wishlistSlice from './slices/wishlistSlice';
import saveForLaterSlice from './slices/saveForLaterSlice';
import promoCodeSlice from './slices/promoCodeSlice';
import newProductSlice from './slices/newProductSlice';
import categoriesSlice from './slices/categoriesSlice';
import subCategoriesSlice from './slices/subCategoriesSlice';
import ordersSlice from './slices/ordersSlice';
import userSlice from './slices/userSlice';
import usersSlice from './slices/usersSlice';
import firebaseUsersSlice from './slices/firebaseUsersSlice';
import uiSlice from './slices/uiSlice';
import checkoutSlice from './slices/checkoutSlice';
import searchSlice from './slices/searchSlice';
import filtersSlice from './slices/filtersSlice';
import productBundleSlice from './slices/productBundleSlice';
import arrangementSlice from './slices/arrangementSlice';
import partnerSlice from './slices/partnerSlice';
import notificationSlice from './slices/notificationSlice';
import pointsSlice from './slices/pointsSlice';
import inviteFriendSlice from './inviteFriendSlice';
import cartAbandonmentSlice from './slices/cartAbandonmentSlice';
import reviewSlice from './slices/reviewSlice';
import orderManagementSlice from './slices/orderManagementSlice';
import inboxSlice from './slices/inboxSlice';
import googleAnalyticsSlice from './slices/googleAnalyticsSlice';
import settingsSlice from './slices/settingsSlice';

// Persist configuration
const persistConfig = {
  key: 'yoraa-root',
  storage,
  whitelist: ['auth', 'cart', 'wishlist', 'saveForLater', 'user'], // Only persist these slices
  blacklist: ['ui', 'search'], // Don't persist these slices
};

// Cart persist configuration (separate config for cart)
const cartPersistConfig = {
  key: 'yoraa-cart',
  storage,
  whitelist: ['items', 'total', 'count'],
};

// Auth persist configuration
const authPersistConfig = {
  key: 'yoraa-auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'],
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authSlice,
  cart: cartSlice,
  wishlist: wishlistSlice,
  saveForLater: saveForLaterSlice,
  promoCodes: promoCodeSlice,
  products: newProductSlice,
  categories: categoriesSlice,
  subCategories: subCategoriesSlice,
  orders: ordersSlice,
  user: userSlice,
  users: usersSlice,
  firebaseUsers: firebaseUsersSlice,
  ui: uiSlice,
  checkout: checkoutSlice,
  search: searchSlice,
  filters: filtersSlice,
  productBundle: productBundleSlice,
  arrangement: arrangementSlice,
  partners: partnerSlice,
  notifications: notificationSlice,
  points: pointsSlice,
  inviteFriend: inviteFriendSlice,
  cartAbandonment: cartAbandonmentSlice,
  reviews: reviewSlice,
  orderManagement: orderManagementSlice,
  inbox: inboxSlice,
  googleAnalytics: googleAnalyticsSlice,
  settings: settingsSlice,
});

// Create persisted reducer (temporarily disabled)
// const persistedReducer = persistReducer(persistConfig, rootReducer);
const persistedReducer = rootReducer;

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['register', 'rehydrate'],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Helper functions for accessing state and dispatch
export const getRootState = () => store.getState();
export const getAppDispatch = () => store.dispatch;

// Export store as default
export default store;

// Expose store to window for debugging (development only)
if (import.meta.env.MODE === 'development') {
  window.__REDUX_STORE__ = store;
  window.__RESTORE_AUTH__ = () => {
    console.log('🔄 Manually triggering auth restoration...');
    store.dispatch({ type: 'auth/restoreAuthFromStorage' });
  };
}
