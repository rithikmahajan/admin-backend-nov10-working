const { getCurrencyByCountry, getCurrencyInfo } = require('../utils/currencyUtils');
const { isIndianLocation, getDeliveryTabs } = require('../utils/deliveryUtils');

/**
 * Middleware to detect user location and set currency/delivery preferences
 * This middleware should be applied to routes that need location-based pricing
 */
const locationBasedPricingMiddleware = async (req, res, next) => {
  try {
    let userCountry = 'India'; // Default to India
    let userCurrency = 'INR';
    let deliveryTabs = [];
    
    // Method 1: Get country from user's address (if authenticated user)
    if (req.user && req.user._id) {
      const Address = require('../models/Address');
      
      // Try to find user's primary address
      const userAddress = await Address.findOne({ 
        user: req.user._id 
      }).sort({ createdAt: -1 }); // Get most recent address
      
      if (userAddress && userAddress.country) {
        userCountry = userAddress.country;
      }
    }
    
    // Method 2: Get from request headers (if provided)
    if (!userCountry || userCountry === 'India') {
      const countryFromHeader = req.headers['x-user-country'] || req.headers['cf-ipcountry'];
      if (countryFromHeader) {
        userCountry = countryFromHeader;
      }
    }
    
    // Method 3: Get from query parameters (for testing/override)
    if (req.query.country) {
      userCountry = req.query.country;
    }
    
    // Determine currency based on country
    userCurrency = getCurrencyByCountry(userCountry);
    const currencyInfo = getCurrencyInfo(userCountry);
    
    // Get delivery options for this location
    deliveryTabs = getDeliveryTabs(userCountry);
    
    // Add location info to request object
    req.locationInfo = {
      country: userCountry,
      isIndia: isIndianLocation(userCountry),
      currency: userCurrency,
      currencyInfo: currencyInfo,
      deliveryTabs: deliveryTabs,
      deliveryRegion: isIndianLocation(userCountry) ? 'domestic' : 'international'
    };
    
    // Add helper method to response for easy access in controllers
    res.locals.formatPrice = (price) => {
      if (!currencyInfo) return `${price}`;
      
      try {
        return new Intl.NumberFormat(currencyInfo.locale, {
          style: 'currency',
          currency: userCurrency,
          minimumFractionDigits: userCurrency === 'INR' ? 0 : 2,
        }).format(price);
      } catch (error) {
        return `${currencyInfo.symbol}${price}`;
      }
    };
    
    next();
  } catch (error) {
    console.error('Error in locationBasedPricingMiddleware:', error);
    
    // Set defaults and continue on error
    req.locationInfo = {
      country: 'India',
      isIndia: true,
      currency: 'INR',
      currencyInfo: getCurrencyInfo('India'),
      deliveryTabs: getDeliveryTabs('India'),
      deliveryRegion: 'domestic'
    };
    
    next();
  }
};

/**
 * Helper function to get user's location info from IP (optional enhancement)
 * This can be used with services like MaxMind GeoIP or similar
 */
const getLocationFromIP = async (ipAddress) => {
  try {
    // In production, integrate with a real IP geolocation service
    // Example: MaxMind, IPGeolocation API, etc.
    
    // For now, returning default
    return {
      country: 'India',
      countryCode: 'IN',
      city: null,
      region: null
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return null;
  }
};

/**
 * Middleware specifically for cart and order operations
 * Adds shipping calculations and currency conversion
 */
const cartPricingMiddleware = async (req, res, next) => {
  try {
    // First apply location detection
    await locationBasedPricingMiddleware(req, res, () => {});
    
    // Add cart-specific helper methods
    req.calculateCartPricing = (cartItems) => {
      const { convertPricesInBulk } = require('../utils/currencyUtils');
      const { getDeliveryOptionsByCountry } = require('../utils/deliveryUtils');
      
      return {
        convertedItems: convertPricesInBulk(cartItems, req.locationInfo.country),
        availableDeliveryOptions: getDeliveryOptionsByCountry(
          req.locationInfo.country,
          req.body.cartTotal || 0,
          req.body.cartWeight || 0
        )
      };
    };
    
    next();
  } catch (error) {
    console.error('Error in cartPricingMiddleware:', error);
    next();
  }
};

module.exports = {
  locationBasedPricingMiddleware,
  cartPricingMiddleware,
  getLocationFromIP
};
