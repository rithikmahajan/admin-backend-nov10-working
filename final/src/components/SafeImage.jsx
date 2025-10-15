import React from 'react';
import { handleImageError, getPlaceholderImage } from '../utils/imageUtils';

/**
 * Enhanced Image component with automatic fallback handling
 * @param {Object} props - Component properties
 * @param {string} props.src - Primary image source
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.fallbackType - Type of fallback placeholder ('product', 'user', 'banner', 'category')
 * @param {string} props.className - CSS classes
 * @param {Object} props.style - Inline styles
 * @param {Function} props.onLoad - Callback when image loads successfully
 * @param {Function} props.onError - Callback when image fails to load
 * @param {Object} ...rest - Other image props
 * @returns {JSX.Element} Enhanced image component
 */
const SafeImage = ({ 
  src, 
  alt = '', 
  fallbackType = 'product', 
  className = '', 
  style = {},
  onLoad,
  onError,
  ...rest 
}) => {
  const handleError = (e) => {
    handleImageError(e, fallbackType);
    if (onError) onError(e);
  };

  return (
    <img
      src={src || getPlaceholderImage(fallbackType)}
      alt={alt}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={handleError}
      {...rest}
    />
  );
};

export default SafeImage;
