// Frontend utility for currency conversion and delivery options
import API from '../api/endpoints';

// Currency configuration
export const CURRENCY_CONFIG = {
  INR: {
    symbol: '₹',
    code: 'INR',
    name: 'Indian Rupee',
    locale: 'en-IN',
    country: 'India'
  },
  USD: {
    symbol: '$',
    code: 'USD', 
    name: 'US Dollar',
    locale: 'en-US',
    country: 'International'
  }
};

// Get user's location from various sources
export const getUserLocation = async () => {
  try {
    // Method 1: Try to get from localStorage (user preference)
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      return JSON.parse(savedLocation);
    }

    // Method 2: Try to get from browser geolocation API
    if (navigator.geolocation) {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false
        });
      });

      // Convert coordinates to country (you'd need a geocoding service)
      // For now, returning default
      const location = {
        country: 'India',
        currency: 'INR',
        isIndia: true,
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      };
      
      localStorage.setItem('userLocation', JSON.stringify(location));
      return location;
    }

    // Method 3: Default to India
    const defaultLocation = {
      country: 'India',
      currency: 'INR', 
      isIndia: true
    };
    
    localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
    return defaultLocation;
  } catch (error) {
    console.warn('Could not determine user location:', error);
    return {
      country: 'India',
      currency: 'INR',
      isIndia: true
    };
  }
};

// Set user location preference
export const setUserLocation = (locationData) => {
  localStorage.setItem('userLocation', JSON.stringify(locationData));
  
  // Dispatch custom event for other components to listen
  window.dispatchEvent(new CustomEvent('locationChanged', { 
    detail: locationData 
  }));
};

// Get delivery options and currency info from API
export const getDeliveryOptionsAndCurrency = async (cartTotal = 0, cartWeight = 0) => {
  try {
    const userLocation = await getUserLocation();
    
    const response = await API.get('/orders/delivery-options', {
      params: {
        country: userLocation.country,
        cartTotal,
        cartWeight
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery options:', error);
    throw error;
  }
};

// Convert prices for display
export const convertPricesForDisplay = async (items, country = null) => {
  try {
    const userLocation = country ? { country } : await getUserLocation();
    
    const response = await API.post('/orders/convert-prices', {
      items,
      country: userLocation.country
    });
    
    return response.data;
  } catch (error) {
    console.error('Error converting prices:', error);
    return {
      success: false,
      data: {
        items,
        currency: 'INR',
        country: 'India',
        conversionApplied: false
      }
    };
  }
};

// Format price with appropriate currency
export const formatPrice = (price, currency = 'INR') => {
  const config = CURRENCY_CONFIG[currency];
  
  if (!config || !price) {
    return `${price || 0}`;
  }
  
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'INR' ? 0 : 2,
      maximumFractionDigits: currency === 'INR' ? 0 : 2
    }).format(price);
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${config.symbol}${price}`;
  }
};

// Check if user is in India
export const isUserInIndia = async () => {
  const location = await getUserLocation();
  return location.isIndia || location.country?.toLowerCase().includes('india');
};

// Get delivery tabs based on location
export const getDeliveryTabs = async () => {
  const isIndia = await isUserInIndia();
  
  if (isIndia) {
    return [
      {
        id: 'free_delivery',
        name: 'Free Delivery',
        description: 'Free delivery within India (5-7 days)',
        icon: '🚚',
        popular: true,
        badge: 'Most Popular'
      },
      {
        id: 'express_delivery', 
        name: 'Express Delivery',
        description: 'Faster delivery (1-2 days)',
        icon: '⚡',
        popular: false,
        badge: 'Fastest'
      }
    ];
  } else {
    return [
      {
        id: 'international_delivery',
        name: 'International Delivery',
        description: 'Worldwide shipping (7-14 days)',
        icon: '🌍',
        popular: true,
        badge: 'Worldwide'
      }
    ];
  }
};

// Calculate shipping cost display
export const calculateShippingDisplay = (deliveryOption, cartTotal, currency = 'INR') => {
  if (!deliveryOption) return null;
  
  const { cost, freeDeliveryApplied } = deliveryOption;
  
  if (freeDeliveryApplied || cost === 0) {
    return {
      display: 'FREE',
      cost: 0,
      savings: deliveryOption.originalCost || 0,
      badge: 'Free Shipping'
    };
  }
  
  return {
    display: formatPrice(cost, currency),
    cost: cost,
    savings: 0,
    badge: null
  };
};

// Hook for React components to use location and currency
export const useLocationCurrency = () => {
  const [location, setLocation] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    getUserLocation()
      .then(setLocation)
      .finally(() => setLoading(false));
    
    // Listen for location changes
    const handleLocationChange = (event) => {
      setLocation(event.detail);
    };
    
    window.addEventListener('locationChanged', handleLocationChange);
    
    return () => {
      window.removeEventListener('locationChanged', handleLocationChange);
    };
  }, []);
  
  return { location, loading, setUserLocation };
};

// Location selector component data
export const AVAILABLE_COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'USD', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', currency: 'USD', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', currency: 'USD', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', currency: 'USD', flag: '🇩🇪' },
  { code: 'FR', name: 'France', currency: 'USD', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', currency: 'USD', flag: '🇯🇵' }
];

export default {
  getUserLocation,
  setUserLocation,
  getDeliveryOptionsAndCurrency,
  convertPricesForDisplay,
  formatPrice,
  isUserInIndia,
  getDeliveryTabs,
  calculateShippingDisplay,
  useLocationCurrency,
  CURRENCY_CONFIG,
  AVAILABLE_COUNTRIES
};
