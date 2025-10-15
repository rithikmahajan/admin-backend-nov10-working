/**
 * Image utility functions for handling placeholder images and error states
 */
import { useState, useEffect } from 'react';

// Default placeholder images
export const DEFAULT_PLACEHOLDERS = {
  product: '/Tshirt.png',
  user: '/logo192.png', 
  banner: '/logo512.png',
  category: '/Tshirt.png'
};

/**
 * Get a placeholder image URL based on type
 * @param {string} type - Type of placeholder (product, user, banner, category)
 * @returns {string} Placeholder image URL
 */
export const getPlaceholderImage = (type = 'product') => {
  return DEFAULT_PLACEHOLDERS[type] || DEFAULT_PLACEHOLDERS.product;
};

/**
 * Handle image loading errors by setting a fallback image
 * @param {Event} event - Image error event
 * @param {string} type - Type of placeholder to use
 */
export const handleImageError = (event, type = 'product') => {
  event.target.src = getPlaceholderImage(type);
  event.target.onerror = null; // Prevent infinite loop if placeholder also fails
};

/**
 * Create a data URI for a simple colored placeholder
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} color - Background color (hex)
 * @param {string} textColor - Text color (hex)
 * @param {string} text - Text to display
 * @returns {string} Data URI
 */
export const createPlaceholderDataURI = (width = 64, height = 80, color = '#f3f4f6', textColor = '#9ca3af', text = 'No Image') => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="10" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Validate if an image URL is accessible
 * @param {string} url - Image URL to validate
 * @returns {Promise<boolean>} Promise that resolves to true if image is accessible
 */
export const validateImageUrl = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * Get the best available image from multiple sources
 * @param {string[]} imageSources - Array of image URLs to try
 * @param {string} fallbackType - Type of fallback placeholder
 * @returns {Promise<string>} Promise that resolves to the best available image URL
 */
export const getBestImage = async (imageSources = [], fallbackType = 'product') => {
  for (const source of imageSources) {
    if (source && await validateImageUrl(source)) {
      return source;
    }
  }
  return getPlaceholderImage(fallbackType);
};

/**
 * React hook to handle image loading with fallback
 * @param {string} src - Primary image source
 * @param {string} fallbackType - Type of fallback placeholder
 * @returns {object} Object with src, loading, error, and handleError function
 */
export const useImageWithFallback = (src, fallbackType = 'product') => {
  const [loading, setLoading] = useState(!!src);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src || getPlaceholderImage(fallbackType));

  useEffect(() => {
    if (!src) {
      setImageSrc(getPlaceholderImage(fallbackType));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    
    validateImageUrl(src).then((isValid) => {
      if (isValid) {
        setImageSrc(src);
      } else {
        setImageSrc(getPlaceholderImage(fallbackType));
        setError(true);
      }
      setLoading(false);
    });
  }, [src, fallbackType]);

  const handleError = (event) => {
    handleImageError(event, fallbackType);
    setError(true);
    setLoading(false);
  };

  return {
    src: imageSrc,
    loading,
    error,
    handleError
  };
};
