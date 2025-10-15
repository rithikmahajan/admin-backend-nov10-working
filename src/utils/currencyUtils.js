const axios = require('axios');

// Exchange rates - in production, you should use a real exchange rate API
const DEFAULT_EXCHANGE_RATES = {
  INR: 1,
  USD: 0.012, // 1 INR = 0.012 USD (approximate)
};

// Currency configuration
const CURRENCY_CONFIG = {
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

// Function to determine currency based on country
const getCurrencyByCountry = (country) => {
  if (!country) return 'INR';
  
  const normalizedCountry = country.toLowerCase().trim();
  
  // India and its variations use INR
  if (normalizedCountry.includes('india') || normalizedCountry === 'in') {
    return 'INR';
  }
  
  // All other countries use USD for international
  return 'USD';
};

// Function to get current exchange rates (you can integrate with real API)
const getExchangeRates = async () => {
  try {
    // In production, replace this with a real exchange rate API
    // Example: const response = await axios.get('https://api.exchangerate-api.com/v4/latest/INR');
    // For now, using static rates
    return DEFAULT_EXCHANGE_RATES;
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using defaults:', error.message);
    return DEFAULT_EXCHANGE_RATES;
  }
};

// Convert price from INR to target currency
const convertPrice = async (priceInINR, targetCurrency = 'USD') => {
  if (!priceInINR || targetCurrency === 'INR') {
    return priceInINR;
  }
  
  try {
    const exchangeRates = await getExchangeRates();
    const rate = exchangeRates[targetCurrency];
    
    if (!rate) {
      console.warn(`Exchange rate not found for ${targetCurrency}, using INR`);
      return priceInINR;
    }
    
    return Math.round((priceInINR * rate) * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error converting price:', error);
    return priceInINR;
  }
};

// Format price with appropriate currency symbol and locale
const formatPriceWithCurrency = (price, currency = 'INR') => {
  const config = CURRENCY_CONFIG[currency];
  
  if (!config) {
    return `${price}`;
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

// Get currency info for a country
const getCurrencyInfo = (country) => {
  const currency = getCurrencyByCountry(country);
  return CURRENCY_CONFIG[currency];
};

// Convert and format price based on user's location
const convertAndFormatPrice = async (priceInINR, userCountry) => {
  const targetCurrency = getCurrencyByCountry(userCountry);
  const convertedPrice = await convertPrice(priceInINR, targetCurrency);
  return formatPriceWithCurrency(convertedPrice, targetCurrency);
};

// Bulk convert prices for multiple items
const convertPricesInBulk = async (items, userCountry) => {
  const targetCurrency = getCurrencyByCountry(userCountry);
  
  if (targetCurrency === 'INR') {
    return items; // No conversion needed
  }
  
  const exchangeRates = await getExchangeRates();
  const rate = exchangeRates[targetCurrency];
  
  if (!rate) {
    return items;
  }
  
  return items.map(item => ({
    ...item,
    price: item.price ? Math.round((item.price * rate) * 100) / 100 : item.price,
    regularPrice: item.regularPrice ? Math.round((item.regularPrice * rate) * 100) / 100 : item.regularPrice,
    salePrice: item.salePrice ? Math.round((item.salePrice * rate) * 100) / 100 : item.salePrice,
    currency: targetCurrency,
    originalPrice: item.price, // Keep original INR price
    originalCurrency: 'INR'
  }));
};

module.exports = {
  getCurrencyByCountry,
  convertPrice,
  formatPriceWithCurrency,
  getCurrencyInfo,
  convertAndFormatPrice,
  convertPricesInBulk,
  getExchangeRates,
  CURRENCY_CONFIG,
  DEFAULT_EXCHANGE_RATES
};
