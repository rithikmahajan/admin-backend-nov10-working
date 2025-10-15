// Delivery options configuration based on location
const DELIVERY_OPTIONS = {
  INDIA: {
    FREE_DELIVERY: {
      id: 'free_delivery_india',
      name: 'Free Delivery',
      description: 'Free delivery within India (5-7 business days) - All pincodes',
      cost: 0,
      currency: 'INR',
      estimatedDays: '5-7',
      countries: ['India', 'IN'],
      minOrderAmount: 0, // Free delivery for all orders in India
      maxWeight: 10, // kg - increased weight limit
      trackingAvailable: true
    },
    EXPRESS_DELIVERY: {
      id: 'express_delivery_india', 
      name: 'Express Delivery',
      description: 'Express delivery within India (1-2 business days)',
      cost: 150,
      currency: 'INR',
      estimatedDays: '1-2',
      countries: ['India', 'IN'],
      minOrderAmount: 0,
      maxWeight: 5, // kg
      trackingAvailable: true
    }
  },
  INTERNATIONAL: {
    INTERNATIONAL_STANDARD: {
      id: 'international_standard',
      name: 'International Delivery',
      description: 'Standard international delivery (7-14 business days)',
      cost: 25, // USD
      currency: 'USD',
      estimatedDays: '7-14',
      countries: ['*'], // All countries except India
      minOrderAmount: 0,
      maxWeight: 5, // kg
      trackingAvailable: true
    },
    INTERNATIONAL_EXPRESS: {
      id: 'international_express',
      name: 'International Express',
      description: 'Express international delivery (3-5 business days)',
      cost: 45, // USD
      currency: 'USD', 
      estimatedDays: '3-5',
      countries: ['*'], // All countries except India
      minOrderAmount: 0,
      maxWeight: 5, // kg
      trackingAvailable: true
    }
  }
};

// Function to determine if location is India
const isIndianLocation = (country) => {
  if (!country) return false;
  
  const normalizedCountry = country.toLowerCase().trim();
  return normalizedCountry.includes('india') || 
         normalizedCountry === 'in' || 
         normalizedCountry === 'ind';
};

// Get available delivery options based on user's country
const getDeliveryOptionsByCountry = (country, cartTotal = 0, cartWeight = 0) => {
  const isIndia = isIndianLocation(country);
  
  if (isIndia) {
    const options = Object.values(DELIVERY_OPTIONS.INDIA);
    
    return options.map(option => {
      // Free delivery is always available for all orders in India
      if (option.id === 'free_delivery_india') {
        return {
          ...option,
          cost: 0,
          description: `${option.description} - Always FREE in India!`,
          isEligible: cartWeight <= option.maxWeight,
          isDefault: true // Mark as default option
        };
      }
      
      // Special delivery options (Express) - these have charges
      return {
        ...option,
        isEligible: cartWeight <= option.maxWeight,
        isDefault: false
      };
    }).filter(option => option.isEligible);
  } else {
    // International delivery options
    const options = Object.values(DELIVERY_OPTIONS.INTERNATIONAL);
    
    return options.map(option => ({
      ...option,
      isEligible: cartWeight <= option.maxWeight
    })).filter(option => option.isEligible);
  }
};

// Calculate shipping cost based on delivery option and location
const calculateShippingCost = (deliveryOptionId, country, cartTotal = 0, cartWeight = 0) => {
  const availableOptions = getDeliveryOptionsByCountry(country, cartTotal, cartWeight);
  const selectedOption = availableOptions.find(opt => opt.id === deliveryOptionId);
  
  if (!selectedOption) {
    throw new Error('Invalid delivery option selected');
  }
  
  const isIndia = isIndianLocation(country);
  
  // For India: Free delivery is default unless special delivery option is selected
  if (isIndia) {
    if (selectedOption.id === 'free_delivery_india') {
      return {
        cost: 0,
        currency: selectedOption.currency,
        option: selectedOption,
        freeDeliveryApplied: true,
        message: 'Free delivery for all orders in India!'
      };
    } else {
      // Special delivery options (Express) have charges
      return {
        cost: selectedOption.cost,
        currency: selectedOption.currency,
        option: selectedOption,
        freeDeliveryApplied: false,
        message: `Special delivery option selected: ${selectedOption.name}`
      };
    }
  }
  
  // International orders
  return {
    cost: selectedOption.cost,
    currency: selectedOption.currency,
    option: selectedOption,
    freeDeliveryApplied: false
  };
};

// Get default delivery option for a country
const getDefaultDeliveryOption = (country) => {
  const isIndia = isIndianLocation(country);
  
  if (isIndia) {
    return DELIVERY_OPTIONS.INDIA.FREE_DELIVERY;
  } else {
    return DELIVERY_OPTIONS.INTERNATIONAL.INTERNATIONAL_STANDARD;
  }
};

// Check if free delivery is available for the cart
const checkFreeDeliveryEligibility = (country, cartTotal = 0) => {
  const isIndia = isIndianLocation(country);
  
  if (isIndia) {
    // Free delivery is always available for all orders in India
    return {
      eligible: true,
      minOrderAmount: 0,
      amountNeeded: 0,
      currency: 'INR',
      message: 'Free delivery available for all orders in India!'
    };
  }
  
  return {
    eligible: false,
    minOrderAmount: 0,
    amountNeeded: 0,
    currency: 'USD',
    message: 'Free delivery not available for international orders'
  };
};

// Convert shipping costs to user's currency
const convertShippingCosts = async (deliveryOptions, targetCurrency, exchangeRate = 1) => {
  if (!Array.isArray(deliveryOptions)) {
    return deliveryOptions;
  }
  
  return deliveryOptions.map(option => {
    // If option currency matches target currency, no conversion needed
    if (option.currency === targetCurrency) {
      return option;
    }
    
    // Convert cost based on currency
    let convertedCost = option.cost;
    
    if (option.currency === 'INR' && targetCurrency === 'USD') {
      convertedCost = Math.round((option.cost * exchangeRate) * 100) / 100;
    } else if (option.currency === 'USD' && targetCurrency === 'INR') {
      convertedCost = Math.round((option.cost / exchangeRate) * 100) / 100;
    }
    
    return {
      ...option,
      cost: convertedCost,
      currency: targetCurrency,
      originalCost: option.cost,
      originalCurrency: option.currency
    };
  });
};

// Get delivery tab options for UI
const getDeliveryTabs = (country) => {
  const isIndia = isIndianLocation(country);
  
  if (isIndia) {
    return [
      {
        id: 'free_delivery',
        name: 'Free Delivery',
        description: 'FREE for all orders in India - All pincodes',
        icon: '🚚',
        popular: true,
        badge: 'FREE'
      },
      {
        id: 'express_delivery', 
        name: 'Express Delivery',
        description: 'Faster delivery option (₹150)',
        icon: '⚡',
        popular: false,
        badge: '₹150'
      }
    ];
  } else {
    return [
      {
        id: 'international_delivery',
        name: 'International Delivery',
        description: 'Worldwide shipping available',
        icon: '🌍',
        popular: true
      }
    ];
  }
};

module.exports = {
  DELIVERY_OPTIONS,
  isIndianLocation,
  getDeliveryOptionsByCountry,
  calculateShippingCost,
  getDefaultDeliveryOption,
  checkFreeDeliveryEligibility,
  convertShippingCosts,
  getDeliveryTabs
};
