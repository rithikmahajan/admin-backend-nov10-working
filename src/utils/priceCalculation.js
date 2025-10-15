/**
 * Enhanced Price Calculation Utility
 * 
 * This utility handles proper price calculation for items with both regular and sale prices
 * at the size level, ensuring accurate pricing during checkout.
 */

/**
 * Calculate the effective price for a size variant
 * Priority: Sale Price > Regular Price > 0
 * 
 * @param {Object} sizeVariant - The size variant object from database
 * @param {Object} options - Additional options for price calculation
 * @returns {Object} Price calculation result
 */
function calculateEffectivePrice(sizeVariant, options = {}) {
  const { 
    includeOriginalPrice = true,
    roundToNearestPaise = true 
  } = options;

  // Extract prices from size variant
  const regularPrice = Number(sizeVariant.regularPrice) || 0;
  const salePrice = Number(sizeVariant.salePrice) || 0;

  // Determine effective price based on availability
  let effectivePrice = 0;
  let priceType = 'none';
  let savings = 0;
  let discountPercentage = 0;

  if (salePrice > 0) {
    // Sale price available - use it
    effectivePrice = salePrice;
    priceType = 'sale';
    
    // Calculate savings if regular price exists
    if (regularPrice > salePrice) {
      savings = regularPrice - salePrice;
      discountPercentage = Math.round((savings / regularPrice) * 100);
    }
  } else if (regularPrice > 0) {
    // Only regular price available
    effectivePrice = regularPrice;
    priceType = 'regular';
  } else {
    // No valid price found
    effectivePrice = 0;
    priceType = 'none';
  }

  // Round to nearest paise if requested
  if (roundToNearestPaise && effectivePrice > 0) {
    effectivePrice = Math.round(effectivePrice * 100) / 100;
  }

  const result = {
    effectivePrice,
    priceType,
    originalPrice: regularPrice,
    salePrice: salePrice,
    savings,
    discountPercentage,
    isOnSale: priceType === 'sale',
    hasValidPrice: effectivePrice > 0
  };

  return result;
}

/**
 * Calculate cart total with proper price validation
 * 
 * @param {Array} cartItems - Array of cart items with size variants
 * @param {Object} options - Calculation options
 * @returns {Object} Cart calculation result
 */
function calculateCartTotal(cartItems, options = {}) {
  const {
    includeTax = false,
    taxRate = 0,
    includeShipping = false,
    shippingCost = 0
  } = options;

  let subtotal = 0;
  let totalSavings = 0;
  let itemCalculations = [];

  for (const cartItem of cartItems) {
    const { sizeVariant, quantity = 1, itemName = 'Unknown Item' } = cartItem;
    
    if (!sizeVariant) {
      throw new Error(`Size variant not found for item: ${itemName}`);
    }

    // Calculate price for this item
    const priceCalc = calculateEffectivePrice(sizeVariant);
    
    if (!priceCalc.hasValidPrice) {
      throw new Error(`No valid price found for item: ${itemName} (Size: ${sizeVariant.size})`);
    }

    // Calculate item total
    const itemTotal = priceCalc.effectivePrice * quantity;
    const itemSavings = priceCalc.savings * quantity;

    subtotal += itemTotal;
    totalSavings += itemSavings;

    // Store calculation details for debugging
    itemCalculations.push({
      itemName,
      size: sizeVariant.size,
      sku: sizeVariant.sku,
      quantity,
      unitPrice: priceCalc.effectivePrice,
      originalPrice: priceCalc.originalPrice,
      salePrice: priceCalc.salePrice,
      priceType: priceCalc.priceType,
      itemTotal,
      itemSavings,
      discountPercentage: priceCalc.discountPercentage
    });
  }

  // Calculate additional charges
  const taxAmount = includeTax ? subtotal * (taxRate / 100) : 0;
  const shippingAmount = includeShipping ? shippingCost : 0;
  const total = subtotal + taxAmount + shippingAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    shippingAmount: Math.round(shippingAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    totalSavings: Math.round(totalSavings * 100) / 100,
    itemCount: cartItems.length,
    totalQuantity: cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    itemCalculations,
    breakdown: {
      subtotal,
      tax: taxAmount,
      shipping: shippingAmount,
      savings: totalSavings,
      total
    }
  };
}

/**
 * Validate item price against database for security
 * 
 * @param {Object} cartItem - Cart item from frontend
 * @param {Object} dbItem - Item from database
 * @returns {Object} Validation result
 */
function validateItemPrice(cartItem, dbItem) {
  // Find the correct size variant
  const sizeVariant = dbItem.sizes.find(s => 
    s.sku === cartItem.sku || 
    s.size === cartItem.size
  );

  if (!sizeVariant) {
    return {
      isValid: false,
      error: `Size variant not found for SKU: ${cartItem.sku} or Size: ${cartItem.size}`,
      suggestedPrice: 0
    };
  }

  // Calculate effective price from database
  const priceCalc = calculateEffectivePrice(sizeVariant);
  
  if (!priceCalc.hasValidPrice) {
    return {
      isValid: false,
      error: `No valid price configured for item: ${dbItem.productName} (Size: ${sizeVariant.size})`,
      suggestedPrice: 0
    };
  }

  // Compare with frontend price (allow 1 paisa difference for rounding)
  const frontendPrice = Number(cartItem.price) || 0;
  const priceDifference = Math.abs(priceCalc.effectivePrice - frontendPrice);
  const isValid = priceDifference <= 0.01;

  return {
    isValid,
    frontendPrice,
    dbPrice: priceCalc.effectivePrice,
    priceDifference,
    priceType: priceCalc.priceType,
    isOnSale: priceCalc.isOnSale,
    savings: priceCalc.savings,
    discountPercentage: priceCalc.discountPercentage,
    suggestedPrice: priceCalc.effectivePrice,
    sizeVariant,
    error: isValid ? null : `Price mismatch: Frontend sent ₹${frontendPrice}, Database has ₹${priceCalc.effectivePrice}`
  };
}

/**
 * Format price for display
 * 
 * @param {number} price - Price amount
 * @param {string} currency - Currency code
 * @returns {string} Formatted price string
 */
function formatPrice(price, currency = 'INR') {
  if (typeof price !== 'number' || price < 0) {
    return '₹0.00';
  }

  const formatted = price.toFixed(2);
  
  switch (currency) {
    case 'INR':
      return `₹${formatted}`;
    case 'USD':
      return `$${formatted}`;
    case 'EUR':
      return `€${formatted}`;
    default:
      return `${currency} ${formatted}`;
  }
}

module.exports = {
  calculateEffectivePrice,
  calculateCartTotal,
  validateItemPrice,
  formatPrice
};
