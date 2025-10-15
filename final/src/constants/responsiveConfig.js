/**
 * Responsive Configuration
 * 
 * Centralized configuration for responsive design patterns
 * and utilities used throughout the application.
 */

export const RESPONSIVE_CONFIG = {
  // Breakpoints (matches Tailwind CSS)
  breakpoints: {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
    tablet: 768,
    'tablet-lg': 1024,
  },

  // Common responsive patterns
  patterns: {
    // Grid configurations
    grid: {
      products: {
        xs: 1,
        sm: 2,
        md: 2,
        lg: 3,
        xl: 4,
        '2xl': 5,
      },
      cards: {
        xs: 1,
        sm: 1,
        md: 2,
        lg: 3,
        xl: 4,
      },
      dashboard: {
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
        xl: 5,
      },
      filters: {
        xs: 1,
        sm: 2,
        md: 2,
        lg: 3,
        xl: 4,
      },
    },

    // Spacing configurations
    spacing: {
      container: {
        xs: '1rem',
        sm: '1.5rem',
        md: '2rem',
        lg: '4rem',
        xl: '4rem',
      },
      section: {
        xs: '1rem',
        sm: '1.5rem',
        md: '2rem',
        lg: '2.5rem',
        xl: '3rem',
      },
      element: {
        xs: '0.75rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '1.5rem',
        xl: '2rem',
      },
    },

    // Typography configurations
    typography: {
      heading: {
        h1: {
          xs: '1.5rem',
          sm: '1.875rem',
          md: '2.25rem',
          lg: '3rem',
          xl: '3rem',
        },
        h2: {
          xs: '1.25rem',
          sm: '1.5rem',
          md: '1.875rem',
          lg: '2.25rem',
          xl: '2.25rem',
        },
        h3: {
          xs: '1.125rem',
          sm: '1.25rem',
          md: '1.5rem',
          lg: '2rem',
          xl: '2rem',
        },
        h4: {
          xs: '1rem',
          sm: '1.125rem',
          md: '1.25rem',
          lg: '1.3125rem',
          xl: '1.3125rem',
        },
      },
      body: {
        xs: '0.875rem',
        sm: '1rem',
        md: '1rem',
        lg: '1rem',
        xl: '1rem',
      },
      small: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '0.875rem',
        lg: '0.875rem',
        xl: '0.875rem',
      },
    },

    // Component-specific configurations
    components: {
      sidebar: {
        width: {
          xs: '16rem',
          sm: '18rem',
          md: '18rem',
          lg: '20rem',
          xl: '20rem',
        },
      },
      header: {
        height: {
          xs: '3.5rem',
          sm: '3.75rem',
          md: '3.75rem',
          lg: '3.75rem',
          xl: '3.75rem',
        },
      },
      buttons: {
        padding: {
          xs: '0.5rem 1rem',
          sm: '0.75rem 1.5rem',
          md: '0.75rem 1.5rem',
          lg: '0.75rem 1.5rem',
          xl: '0.75rem 1.5rem',
        },
        fontSize: {
          xs: '0.875rem',
          sm: '1rem',
          md: '1rem',
          lg: '1rem',
          xl: '1rem',
        },
      },
      inputs: {
        height: {
          xs: '2.5rem',
          sm: '2.9375rem',
          md: '2.9375rem',
          lg: '2.9375rem',
          xl: '2.9375rem',
        },
        padding: {
          xs: '0 0.75rem',
          sm: '0 1rem',
          md: '0 1rem',
          lg: '0 1rem',
          xl: '0 1rem',
        },
      },
    },
  },

  // Media query helpers
  media: {
    up: (breakpoint) => `@media (min-width: ${RESPONSIVE_CONFIG.breakpoints[breakpoint]}px)`,
    down: (breakpoint) => `@media (max-width: ${RESPONSIVE_CONFIG.breakpoints[breakpoint] - 1}px)`,
    between: (min, max) => `@media (min-width: ${RESPONSIVE_CONFIG.breakpoints[min]}px) and (max-width: ${RESPONSIVE_CONFIG.breakpoints[max] - 1}px)`,
    only: (breakpoint) => {
      const breakpoints = Object.keys(RESPONSIVE_CONFIG.breakpoints);
      const currentIndex = breakpoints.indexOf(breakpoint);
      const nextBreakpoint = breakpoints[currentIndex + 1];
      
      if (!nextBreakpoint) {
        return `@media (min-width: ${RESPONSIVE_CONFIG.breakpoints[breakpoint]}px)`;
      }
      
      return `@media (min-width: ${RESPONSIVE_CONFIG.breakpoints[breakpoint]}px) and (max-width: ${RESPONSIVE_CONFIG.breakpoints[nextBreakpoint] - 1}px)`;
    },
  },

  // Responsive utilities
  utils: {
    // Get value for current breakpoint
    getValue: (config, breakpoint, fallback = 'md') => {
      return config[breakpoint] || config[fallback] || Object.values(config)[0];
    },

    // Generate responsive classes
    generateClasses: (base, config) => {
      const classes = [];
      Object.entries(config).forEach(([breakpoint, value]) => {
        if (breakpoint === 'xs') {
          classes.push(`${base}-${value}`);
        } else {
          classes.push(`${breakpoint}:${base}-${value}`);
        }
      });
      return classes.join(' ');
    },

    // Check if current screen size matches breakpoint
    matchesBreakpoint: (width, breakpoint) => {
      const bp = RESPONSIVE_CONFIG.breakpoints[breakpoint];
      if (!bp) return false;
      
      const breakpoints = Object.entries(RESPONSIVE_CONFIG.breakpoints)
        .sort(([,a], [,b]) => a - b);
      
      const currentIndex = breakpoints.findIndex(([key]) => key === breakpoint);
      const nextBreakpoint = breakpoints[currentIndex + 1];
      
      if (!nextBreakpoint) {
        return width >= bp;
      }
      
      return width >= bp && width < nextBreakpoint[1];
    },
  },
};

// Export individual configurations for easier imports
export const { breakpoints, patterns, media, utils } = RESPONSIVE_CONFIG;

export default RESPONSIVE_CONFIG;
