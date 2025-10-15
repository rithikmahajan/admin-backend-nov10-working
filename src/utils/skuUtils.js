const crypto = require('crypto');

/**
 * Generate a unique SKU based on product name, size, and timestamp
 * @param {string} productName - The product name
 * @param {string} sizeName - The size name
 * @param {number} index - The index of the size in the sizes array
 * @param {boolean} includeRandomHash - Whether to include a random hash for uniqueness
 * @returns {string} - Generated SKU
 */
const generateSKU = (productName, sizeName = 'OneSize', index = 0, includeRandomHash = true) => {
  try {
    const timestamp = Date.now();
    const productSlug = productName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
    const sizeSlug = sizeName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    
    let sku = `${productSlug}-${sizeSlug}-${timestamp}-${index}`;
    
    if (includeRandomHash) {
      const randomHash = crypto.randomBytes(2).toString('hex').toUpperCase();
      sku += `-${randomHash}`;
    }
    
    return sku.toUpperCase();
  } catch (error) {
    console.error('Error generating SKU:', error);
    // Fallback SKU generation
    return `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
  }
};

/**
 * Validate if a SKU format is valid
 * @param {string} sku - The SKU to validate
 * @returns {boolean} - Whether the SKU is valid
 */
const isValidSKU = (sku) => {
  if (!sku || typeof sku !== 'string') return false;
  
  // Basic validation: should not be empty, undefined, or just whitespace
  const trimmedSKU = sku.trim();
  if (trimmedSKU === '' || trimmedSKU === 'undefined' || trimmedSKU === 'null') {
    return false;
  }
  
  // Should have minimum length
  if (trimmedSKU.length < 3) return false;
  
  return true;
};

/**
 * Ensure all sizes in a product have valid SKUs
 * @param {Array} sizes - Array of size objects
 * @param {string} productName - Product name for SKU generation
 * @returns {Array} - Sizes array with valid SKUs
 */
const ensureValidSKUs = (sizes, productName = 'Product') => {
  if (!Array.isArray(sizes)) return [];
  
  return sizes.map((size, index) => {
    let sku = size.sku;
    
    // Generate SKU if missing or invalid
    if (!isValidSKU(sku)) {
      const sizeName = size.size || size.sizeName || `Size-${index + 1}`;
      sku = generateSKU(productName, sizeName, index);
      console.log(`Generated SKU for size ${sizeName}:`, sku);
    }
    
    return {
      ...size,
      sku: sku
    };
  });
};

/**
 * Check if product has all required fields for going live
 * @param {Object} product - Product object
 * @returns {Object} - Validation result with isValid and errors
 */
const validateProductForLive = (product) => {
  const errors = [];
  
  // Check basic required fields
  if (!product.productName || product.productName.trim() === '') {
    errors.push('Product name is required');
  }
  
  if (!product.description || product.description.trim() === '') {
    errors.push('Product description is required');
  }
  
  // Check sizes and SKUs
  if (product.sizes && product.sizes.length > 0) {
    const sizesWithoutSKU = product.sizes.filter(size => !isValidSKU(size.sku));
    if (sizesWithoutSKU.length > 0) {
      errors.push(`${sizesWithoutSKU.length} size(s) missing valid SKU`);
    }
    
    // Check for duplicate SKUs
    const skus = product.sizes.map(size => size.sku).filter(sku => isValidSKU(sku));
    const uniqueSKUs = new Set(skus);
    if (skus.length !== uniqueSKUs.size) {
      errors.push('Duplicate SKUs found in sizes');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Normalize size names for better matching
 * @param {string} sizeName - Size name to normalize
 * @returns {string} - Normalized size name
 */
const normalizeSizeName = (sizeName) => {
  if (!sizeName || typeof sizeName !== 'string') return '';
  
  const normalized = sizeName.toLowerCase().trim();
  
  // Size mapping for common variations
  const sizeMap = {
    'small': 's',
    'medium': 'm',
    'large': 'l',
    'extra-small': 'xs',
    'x-small': 'xs',
    'extra-large': 'xl',
    'x-large': 'xl',
    'xx-large': 'xxl',
    '2xl': 'xxl',
    '3xl': 'xxxl'
  };
  
  return sizeMap[normalized] || normalized;
};

/**
 * Find a size variant by SKU or size name with fallback logic
 * @param {Array} sizes - Array of size objects
 * @param {string} sku - SKU to search for
 * @param {string} sizeName - Size name to search for as fallback
 * @returns {Object|null} - Found size variant or null
 */
const findSizeVariant = (sizes, sku, sizeName = null) => {
  if (!Array.isArray(sizes) || sizes.length === 0) return null;
  
  console.log('🔍 findSizeVariant debug:', {
    sizesCount: sizes.length,
    requestedSku: sku,
    requestedSize: sizeName,
    availableSizes: sizes.map(s => ({ sku: s.sku, size: s.size }))
  });
  
  // First, try to find by exact SKU match
  if (isValidSKU(sku)) {
    const sizeVariant = sizes.find(size => size.sku === sku);
    if (sizeVariant) {
      console.log('✅ Found by exact SKU match:', sizeVariant.sku);
      return sizeVariant;
    }
  }
  
  // If no SKU match and size name provided, try to find by size name
  if (sizeName) {
    // Try exact match first
    let sizeVariant = sizes.find(size => size.size === sizeName);
    if (sizeVariant) {
      console.log('✅ Found by exact size match:', sizeVariant.size);
      return sizeVariant;
    }
    
    // Try normalized size matching
    const normalizedRequestedSize = normalizeSizeName(sizeName);
    sizeVariant = sizes.find(size => normalizeSizeName(size.size) === normalizedRequestedSize);
    if (sizeVariant) {
      console.log('✅ Found by normalized size match:', `${sizeName} -> ${sizeVariant.size}`);
      return sizeVariant;
    }
  }
  
  // If still no match, try to find first available size with stock > 0
  const availableSize = sizes.find(size => (size.stock || size.quantity || 0) > 0);
  if (availableSize) {
    console.log('✅ Found by stock availability:', availableSize.size);
    return availableSize;
  }
  
  // Last resort: return first size
  const firstSize = sizes[0] || null;
  if (firstSize) {
    console.log('✅ Using first available size:', firstSize.size);
  } else {
    console.log('❌ No sizes available');
  }
  return firstSize;
};

module.exports = {
  generateSKU,
  isValidSKU,
  ensureValidSKUs,
  validateProductForLive,
  findSizeVariant,
  normalizeSizeName
};
