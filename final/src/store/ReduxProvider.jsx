import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';

// Import actions for initialization
import { restoreAuthFromStorage } from './slices/authSlice';
import { restoreCartFromStorage } from './slices/cartSlice';
import { restoreWishlistFromStorage } from './slices/wishlistSlice';
import { restoreSaveForLaterFromStorage } from './slices/saveForLaterSlice';
import { restoreRecentSearches } from './slices/searchSlice';

// Loading component for PersistGate
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading Yoraa Clothing Shop...</p>
    </div>
  </div>
);

// Initialization component to restore state from localStorage
const StateInitializer = ({ children }) => {
  useEffect(() => {
    // Restore state from localStorage on app startup
    store.dispatch(restoreAuthFromStorage());
    store.dispatch(restoreCartFromStorage());
    store.dispatch(restoreWishlistFromStorage());
    store.dispatch(restoreSaveForLaterFromStorage());
    store.dispatch(restoreRecentSearches());
  }, []);

  return children;
};

// Redux Provider wrapper component
const ReduxProvider = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <StateInitializer>
          {children}
        </StateInitializer>
      </PersistGate>
    </Provider>
  );
};

export default ReduxProvider;
