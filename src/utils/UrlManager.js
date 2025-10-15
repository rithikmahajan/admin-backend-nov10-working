const { generatePermanentUrl } = require('./S3');

/**
 * URL Manager for handling long-lived image URLs in ecommerce application
 * Provides utilities to manage URL expiration and refresh
 */

// Extract file key from Contabo S3 URL
const extractFileKeyFromUrl = (url) => {
  try {
    if (!url) return null;
    
    // Handle signed URLs - extract the key from the path
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove leading slash and bucket name if present
    const bucketName = process.env.AWS_BUCKET_NAME;
    if (pathname.startsWith(`/${bucketName}/`)) {
      return pathname.substring(`/${bucketName}/`.length);
    } else if (pathname.startsWith('/')) {
      return pathname.substring(1);
    }
    
    return pathname;
  } catch (error) {
    console.error('Error extracting file key from URL:', error);
    return null;
  }
};

// Check if a signed URL is about to expire (within next 24 hours)
const isUrlExpiringSoon = (url) => {
  try {
    if (!url) return true;
    
    const urlObj = new URL(url);
    const expiresParam = urlObj.searchParams.get('X-Amz-Expires') || urlObj.searchParams.get('Expires');
    
    if (!expiresParam) {
      // If no expiration parameter, assume it's a direct URL (might not work due to permissions)
      return false;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = parseInt(expiresParam, 10);
    
    // Consider URL expiring soon if less than 24 hours remaining
    const timeUntilExpiry = expirationTime - currentTime;
    return timeUntilExpiry < (24 * 60 * 60); // 24 hours in seconds
    
  } catch (error) {
    console.error('Error checking URL expiration:', error);
    return true; // Assume expiring if we can't parse
  }
};

// Refresh a URL if it's expiring soon
const refreshUrlIfNeeded = async (url) => {
  try {
    if (!url) return null;
    
    if (!isUrlExpiringSoon(url)) {
      return url; // URL is still valid
    }
    
    const fileKey = extractFileKeyFromUrl(url);
    if (!fileKey) {
      console.error('Could not extract file key from URL:', url);
      return url;
    }
    
    console.log(`🔄 Refreshing expiring URL for file: ${fileKey}`);
    const newUrl = await generatePermanentUrl(fileKey);
    console.log(`✅ URL refreshed successfully`);
    
    return newUrl;
  } catch (error) {
    console.error('Error refreshing URL:', error);
    return url; // Return original URL if refresh fails
  }
};

// Batch refresh multiple URLs
const refreshMultipleUrls = async (urls) => {
  if (!Array.isArray(urls)) return urls;
  
  const refreshPromises = urls.map(async (url) => {
    try {
      return await refreshUrlIfNeeded(url);
    } catch (error) {
      console.error(`Failed to refresh URL: ${url}`, error);
      return url;
    }
  });
  
  return await Promise.all(refreshPromises);
};

// Middleware to automatically refresh URLs in API responses
const createUrlRefreshMiddleware = () => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = async function(data) {
      try {
        // Recursively find and refresh URLs in the response data
        const refreshedData = await refreshUrlsInObject(data);
        return originalJson.call(this, refreshedData);
      } catch (error) {
        console.error('Error in URL refresh middleware:', error);
        return originalJson.call(this, data);
      }
    };
    
    next();
  };
};

// Recursively refresh URLs in nested objects/arrays
const refreshUrlsInObject = async (obj) => {
  if (!obj) return obj;
  
  if (typeof obj === 'string' && isImageUrl(obj)) {
    return await refreshUrlIfNeeded(obj);
  }
  
  if (Array.isArray(obj)) {
    const refreshedArray = await Promise.all(
      obj.map(item => refreshUrlsInObject(item))
    );
    return refreshedArray;
  }
  
  if (typeof obj === 'object') {
    const refreshedObj = {};
    for (const [key, value] of Object.entries(obj)) {
      refreshedObj[key] = await refreshUrlsInObject(value);
    }
    return refreshedObj;
  }
  
  return obj;
};

// Check if a string looks like an image URL
const isImageUrl = (str) => {
  if (typeof str !== 'string') return false;
  
  // Check if it's a URL pointing to our S3 endpoint
  const s3Endpoint = process.env.S3_ENDPOINT;
  if (s3Endpoint && str.includes(s3Endpoint)) {
    return true;
  }
  
  // Check for common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  return imageExtensions.some(ext => str.toLowerCase().includes(ext));
};

module.exports = {
  extractFileKeyFromUrl,
  isUrlExpiringSoon,
  refreshUrlIfNeeded,
  refreshMultipleUrls,
  createUrlRefreshMiddleware,
  refreshUrlsInObject,
  isImageUrl,
};
