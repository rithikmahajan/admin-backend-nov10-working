/**
 * Example Usage of Consolidated Index.js
 * 
 * This file demonstrates how to import from the consolidated index.js file
 * instead of multiple individual index.js files
 */

// BEFORE (Old way with multiple index files):
// import { DeleteConfirmationModal } from './components';
// import { PRODUCT_STATUSES } from './constants';
// import { api } from './api';
// import { store } from './store';

// AFTER (New way with consolidated index):
import { 
  // Components
  DeleteConfirmationModal,
  TwoFactorAuth,
  
  // Constants
  PRODUCT_STATUSES,
  LOADING_STATES,
  VALIDATION_RULES,
  
  // API
  api,
  API,
  
  // Store
  store,
  persistor,
  
  // Utilities
  formatPrice,
  validateImageFile,
  
  // Grouped exports
  Components,
  Constants,
  Utils
} from './index';

// You can also import everything as a default object:
// import AppIndex from './index';
// const { DeleteConfirmationModal, PRODUCT_STATUSES, api, store } = AppIndex;

export default function ExampleUsage() {
  // Example usage of imported items
  const productStatus = PRODUCT_STATUSES.LIVE;
  const formattedPrice = formatPrice(1999);
  
  return (
    <div>
      <h1>Using Consolidated Imports</h1>
      <p>Product Status: {productStatus}</p>
      <p>Formatted Price: {formattedPrice}</p>
    </div>
  );
}
