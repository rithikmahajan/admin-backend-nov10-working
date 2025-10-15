import { useState, useEffect } from 'react';

/**
 * Custom hook to detect responsive breakpoints
 * @returns {Object} Object containing current breakpoint information
 */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const [breakpoint, setBreakpoint] = useState('lg'); // default to large

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });

      // Determine current breakpoint
      if (width < 640) {
        setBreakpoint('xs');
      } else if (width < 768) {
        setBreakpoint('sm');
      } else if (width < 1024) {
        setBreakpoint('md');
      } else if (width < 1280) {
        setBreakpoint('lg');
      } else if (width < 1536) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    };

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    width: screenSize.width,
    height: screenSize.height,
    breakpoint,
    isMobile: screenSize.width < 640,
    isTablet: screenSize.width >= 640 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
    isSmallScreen: screenSize.width < 768,
    isMediumScreen: screenSize.width >= 768 && screenSize.width < 1024,
    isLargeScreen: screenSize.width >= 1024,
    isXtraLargeScreen: screenSize.width >= 1280,
    // Responsive helper functions
    showOnMobile: screenSize.width < 768,
    showOnTablet: screenSize.width >= 768 && screenSize.width < 1024,
    showOnDesktop: screenSize.width >= 1024,
    hideOnMobile: screenSize.width >= 768,
    hideOnTablet: screenSize.width < 768 || screenSize.width >= 1024,
    hideOnDesktop: screenSize.width < 1024,
  };
};

/**
 * Custom hook to get responsive grid columns based on screen size
 * @param {Object} config - Configuration for grid columns per breakpoint
 * @returns {number} Number of columns for current screen size
 */
export const useResponsiveGrid = (config = {}) => {
  const { breakpoint } = useResponsive();

  const defaultConfig = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6,
  };

  const gridConfig = { ...defaultConfig, ...config };

  return gridConfig[breakpoint] || gridConfig.lg;
};

/**
 * Custom hook to get responsive spacing based on screen size
 * @param {Object} config - Configuration for spacing per breakpoint
 * @returns {string} Spacing value for current screen size
 */
export const useResponsiveSpacing = (config = {}) => {
  const { breakpoint } = useResponsive();

  const defaultConfig = {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '2.5rem',
    '2xl': '3rem',
  };

  const spacingConfig = { ...defaultConfig, ...config };

  return spacingConfig[breakpoint] || spacingConfig.lg;
};

/**
 * Get responsive class names based on current breakpoint
 * @param {Object} classes - Object with class names for each breakpoint
 * @returns {string} Appropriate class name for current breakpoint
 */
export const useResponsiveClasses = (classes = {}) => {
  const { breakpoint } = useResponsive();

  return classes[breakpoint] || classes.default || '';
};

export default useResponsive;
