import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  // Current step in checkout process
  currentStep: 1, // 1: Cart, 2: Shipping, 3: Payment, 4: Review, 5: Complete
  
  // Shipping information
  shippingAddress: null,
  billingAddress: null,
  sameAsShipping: true,
  
  // Shipping method
  shippingMethod: null,
  shippingCost: 0,
  
  // Payment information
  paymentMethod: null,
  paymentDetails: null,
  
  // Order summary
  orderSummary: {
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0,
  },
  
  // Promo code
  promoCode: null,
  promoCodeApplied: false,
  
  // Order processing
  isProcessing: false,
  error: null,
  
  // Completed order
  completedOrder: null,
};

// Checkout slice
const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    
    nextStep: (state) => {
      if (state.currentStep < 5) {
        state.currentStep += 1;
      }
    },
    
    prevStep: (state) => {
      if (state.currentStep > 1) {
        state.currentStep -= 1;
      }
    },
    
    setShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      if (state.sameAsShipping) {
        state.billingAddress = action.payload;
      }
    },
    
    setBillingAddress: (state, action) => {
      state.billingAddress = action.payload;
    },
    
    setSameAsShipping: (state, action) => {
      state.sameAsShipping = action.payload;
      if (action.payload && state.shippingAddress) {
        state.billingAddress = state.shippingAddress;
      }
    },
    
    setShippingMethod: (state, action) => {
      state.shippingMethod = action.payload.method;
      state.shippingCost = action.payload.cost;
    },
    
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    
    setPaymentDetails: (state, action) => {
      state.paymentDetails = action.payload;
    },
    
    updateOrderSummary: (state, action) => {
      state.orderSummary = { ...state.orderSummary, ...action.payload };
    },
    
    applyPromoCode: (state, action) => {
      state.promoCode = action.payload.code;
      state.promoCodeApplied = true;
      state.orderSummary.discount = action.payload.discount;
      state.orderSummary.total = 
        state.orderSummary.subtotal + 
        state.orderSummary.tax + 
        state.orderSummary.shipping - 
        action.payload.discount;
    },
    
    removePromoCode: (state) => {
      state.promoCode = null;
      state.promoCodeApplied = false;
      state.orderSummary.discount = 0;
      state.orderSummary.total = 
        state.orderSummary.subtotal + 
        state.orderSummary.tax + 
        state.orderSummary.shipping;
    },
    
    setProcessing: (state, action) => {
      state.isProcessing = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    setCompletedOrder: (state, action) => {
      state.completedOrder = action.payload;
      state.currentStep = 5;
      state.isProcessing = false;
    },
    
    resetCheckout: (state) => {
      return { ...initialState };
    },
  },
});

// Export actions
export const {
  setCurrentStep,
  nextStep,
  prevStep,
  setShippingAddress,
  setBillingAddress,
  setSameAsShipping,
  setShippingMethod,
  setPaymentMethod,
  setPaymentDetails,
  updateOrderSummary,
  applyPromoCode,
  removePromoCode,
  setProcessing,
  setError,
  clearError,
  setCompletedOrder,
  resetCheckout,
} = checkoutSlice.actions;

// Selectors
export const selectCheckout = (state) => state.checkout;
export const selectCurrentStep = (state) => state.checkout.currentStep;
export const selectShippingAddress = (state) => state.checkout.shippingAddress;
export const selectBillingAddress = (state) => state.checkout.billingAddress;
export const selectShippingMethod = (state) => state.checkout.shippingMethod;
export const selectPaymentMethod = (state) => state.checkout.paymentMethod;
export const selectOrderSummary = (state) => state.checkout.orderSummary;
export const selectPromoCode = (state) => state.checkout.promoCode;
export const selectCheckoutProcessing = (state) => state.checkout.isProcessing;
export const selectCheckoutError = (state) => state.checkout.error;
export const selectCompletedOrder = (state) => state.checkout.completedOrder;

// Export reducer
export default checkoutSlice.reducer;
