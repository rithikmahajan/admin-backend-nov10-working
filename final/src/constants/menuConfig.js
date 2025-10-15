/**
 * Responsive Menu Configuration
 * 
 * Configuration for menu layouts and behavior across different screen sizes
 */

import { patterns } from './responsiveConfig';

export const MENU_CONFIG = {
  // Menu responsive behavior
  responsive: {
    // Mobile (xs, sm)
    mobile: {
      sidebarBehavior: 'overlay', // overlay, push, off-canvas
      showToggleButton: true,
      collapsible: true,
      defaultState: 'closed',
      showIcons: true,
      showLabels: true,
      maxWidth: '16rem',
      animationDuration: '300ms',
    },

    // Tablet (md)
    tablet: {
      sidebarBehavior: 'overlay', // overlay, static, collapsible
      showToggleButton: true,
      collapsible: true,
      defaultState: 'closed',
      showIcons: true,
      showLabels: true,
      maxWidth: '18rem',
      animationDuration: '300ms',
    },

    // Desktop (lg, xl, 2xl)
    desktop: {
      sidebarBehavior: 'static', // static, collapsible
      showToggleButton: true,
      collapsible: true,
      defaultState: 'open',
      showIcons: true,
      showLabels: true,
      maxWidth: '20rem',
      animationDuration: '300ms',
    },
  },

  // Menu items configuration
  items: {
    // Show/hide items based on screen size
    responsive: {
      alwaysShow: [
        'Dashboard',
        'orders',
        'Users',
        'Settings',
      ],
      hideOnMobile: [
        'vendor messages',
        'Subcategory',
        'product bundling',
      ],
      mobileOnly: [
        // Items only shown on mobile
      ],
      tabletOnly: [
        // Items only shown on tablet
      ],
    },

    // Group items for mobile navigation
    mobileGroups: {
      'Orders & Users': [
        'return requests',
        'orders',
        'Inbox',
        'Users',
      ],
      'Content Management': [
        'Category',
        'Subcategory',
        'Items',
      ],
      'Features': [
        'Filters',
        'Promocode',
        'Points',
        'FAQ Management',
      ],
      'Marketing': [
        'Cart abandonment recovery',
        'send promo notification',
        'send notification in app',
        'push notification',
      ],
    },
  },

  // Search configuration
  search: {
    responsive: {
      mobile: {
        show: false, // Hide search in sidebar on mobile
        placeholder: 'Search...',
        position: 'header', // header, sidebar, modal
      },
      tablet: {
        show: true,
        placeholder: 'Search menu...',
        position: 'sidebar',
      },
      desktop: {
        show: true,
        placeholder: 'Search menu items...',
        position: 'sidebar',
      },
    },
  },

  // Animation and transition settings
  animations: {
    sidebar: {
      enter: 'transition-transform duration-300 ease-in-out',
      exit: 'transition-transform duration-300 ease-in-out',
      overlay: 'transition-opacity duration-300 ease-in-out',
    },
    menuItems: {
      hover: 'transition-colors duration-200',
      active: 'transition-all duration-200',
    },
    toggleButton: {
      rotate: 'transition-transform duration-200',
      scale: 'transition-transform duration-150',
    },
  },

  // Accessibility settings
  accessibility: {
    focusManagement: {
      trapFocus: true, // Trap focus within sidebar on mobile
      returnFocus: true, // Return focus to toggle button when closing
      skipLinks: true, // Provide skip links for keyboard navigation
    },
    ariaLabels: {
      sidebarToggle: 'Toggle navigation menu',
      sidebarClose: 'Close navigation menu',
      menuItem: (item) => `Navigate to ${item}`,
      menuSection: (section) => `${section} section`,
    },
    keyboardNavigation: {
      enabled: true,
      escapeToClose: true, // Close sidebar with Escape key
      arrowNavigation: true, // Navigate menu items with arrow keys
    },
  },

  // Touch and gesture settings
  touch: {
    swipeToClose: {
      enabled: true, // Enable swipe gesture to close sidebar
      threshold: 50, // Minimum swipe distance in pixels
      direction: 'left', // Swipe direction to close
    },
    tapOutsideToClose: {
      enabled: true, // Close sidebar when tapping outside
      excludeElements: ['.sidebar-toggle'], // Elements to exclude from outside tap
    },
  },

  // Performance settings
  performance: {
    lazyLoad: {
      enabled: true, // Lazy load menu sections
      threshold: 100, // Load threshold in pixels
    },
    virtualScrolling: {
      enabled: false, // Enable for very large menus
      itemHeight: 40, // Height of each menu item
      overscan: 5, // Number of items to render outside viewport
    },
  },
};

// Helper functions for menu configuration
export const getMenuConfig = (breakpoint) => {
  if (breakpoint === 'xs' || breakpoint === 'sm') {
    return MENU_CONFIG.responsive.mobile;
  } else if (breakpoint === 'md') {
    return MENU_CONFIG.responsive.tablet;
  } else {
    return MENU_CONFIG.responsive.desktop;
  }
};

export const shouldShowMenuItem = (itemName, breakpoint) => {
  const { alwaysShow, hideOnMobile, mobileOnly, tabletOnly } = MENU_CONFIG.items.responsive;
  
  if (alwaysShow.includes(itemName)) return true;
  
  if (breakpoint === 'xs' || breakpoint === 'sm') {
    return !hideOnMobile.includes(itemName) || mobileOnly.includes(itemName);
  }
  
  if (breakpoint === 'md') {
    return !tabletOnly.includes(itemName) || tabletOnly.includes(itemName);
  }
  
  return !mobileOnly.includes(itemName) && !tabletOnly.includes(itemName);
};

export const getMobileMenuGroups = () => {
  return MENU_CONFIG.items.mobileGroups;
};

export default MENU_CONFIG;
