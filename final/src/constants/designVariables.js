/**
 * Design Variables from Figma
 * Source: https://www.figma.com/design/IpSbkzNdQaSYHeyCNBefrh/YORAA--rithik-mahajan-final-screens-with-try-on--Copy-?node-id=9429-50007
 */

export const COLORS = {
  // Primary Colors
  WHITE: '#FFFFFF',
  PRIMARY_WHITE: '#FFFFFF',
  PRIMARY_BLACK: '#000000',
  
  // Gray Scale
  DARK_GRAY: '#232321',
  GRAY: '#E7E7E3',
  
  // Accent Colors
  BLUE: '#003F62',
  
  // Additional colors used in the app
  BRAND_BLUE: '#000AFF',
  LIGHT_GRAY: '#BCBCBC',
  MEDIUM_GRAY: '#BFBFBF',
  TEXT_BLACK: '#111111',
  BORDER_GRAY: '#E4E4E4'
};

export const TYPOGRAPHY = {
  FONTS: {
    MONTSERRAT: 'Montserrat',
    OPEN_SANS: 'Open Sans'
  },
  
  FONT_WEIGHTS: {
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700
  },
  
  FONT_SIZES: {
    XS: '10px',
    SM: '14px',
    BASE: '16px',
    LG: '20px',
    XL: '21px',
    '2XL': '32px',
    '3XL': '36px',
    '4XL': '48px'
  },
  
  LINE_HEIGHTS: {
    TIGHT: '16.9px',
    NORMAL: '20px',
    RELAXED: '24px'
  }
};

export const SPACING = {
  XS: '4px',
  SM: '8px',
  MD: '12px',
  LG: '16px',
  XL: '24px',
  '2XL': '32px',
  '3XL': '48px'
};

// Responsive breakpoints for consistent usage
export const BREAKPOINTS = {
  XS: '320px',
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
  TABLET: '768px',
  TABLET_LG: '1024px'
};

export const BORDERS = {
  RADIUS: {
    SM: '3px',
    MD: '8px',
    LG: '12px',
    XL: '16px',
    FULL: '100px'
  },
  
  WIDTH: {
    THIN: '1px',
    MEDIUM: '2px'
  }
};

export const SHADOWS = {
  SM: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  LG: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
};

// CSS Custom Properties for easy integration
export const CSS_VARIABLES = `
  :root {
    /* Colors */
    --color-white: ${COLORS.WHITE};
    --color-primary-white: ${COLORS.PRIMARY_WHITE};
    --color-primary-black: ${COLORS.PRIMARY_BLACK};
    --color-dark-gray: ${COLORS.DARK_GRAY};
    --color-gray: ${COLORS.GRAY};
    --color-blue: ${COLORS.BLUE};
    --color-brand-blue: ${COLORS.BRAND_BLUE};
    --color-light-gray: ${COLORS.LIGHT_GRAY};
    --color-medium-gray: ${COLORS.MEDIUM_GRAY};
    --color-text-black: ${COLORS.TEXT_BLACK};
    --color-border-gray: ${COLORS.BORDER_GRAY};
    
    /* Typography */
    --font-montserrat: '${TYPOGRAPHY.FONTS.MONTSERRAT}', sans-serif;
    --font-open-sans: '${TYPOGRAPHY.FONTS.OPEN_SANS}', sans-serif;
    
    /* Font Weights */
    --font-weight-medium: ${TYPOGRAPHY.FONT_WEIGHTS.MEDIUM};
    --font-weight-semibold: ${TYPOGRAPHY.FONT_WEIGHTS.SEMIBOLD};
    --font-weight-bold: ${TYPOGRAPHY.FONT_WEIGHTS.BOLD};
    
    /* Font Sizes */
    --font-size-xs: ${TYPOGRAPHY.FONT_SIZES.XS};
    --font-size-sm: ${TYPOGRAPHY.FONT_SIZES.SM};
    --font-size-base: ${TYPOGRAPHY.FONT_SIZES.BASE};
    --font-size-lg: ${TYPOGRAPHY.FONT_SIZES.LG};
    --font-size-xl: ${TYPOGRAPHY.FONT_SIZES.XL};
    --font-size-2xl: ${TYPOGRAPHY.FONT_SIZES['2XL']};
    --font-size-3xl: ${TYPOGRAPHY.FONT_SIZES['3XL']};
    --font-size-4xl: ${TYPOGRAPHY.FONT_SIZES['4XL']};
    
    /* Line Heights */
    --line-height-tight: ${TYPOGRAPHY.LINE_HEIGHTS.TIGHT};
    --line-height-normal: ${TYPOGRAPHY.LINE_HEIGHTS.NORMAL};
    --line-height-relaxed: ${TYPOGRAPHY.LINE_HEIGHTS.RELAXED};
    
    /* Spacing */
    --spacing-xs: ${SPACING.XS};
    --spacing-sm: ${SPACING.SM};
    --spacing-md: ${SPACING.MD};
    --spacing-lg: ${SPACING.LG};
    --spacing-xl: ${SPACING.XL};
    --spacing-2xl: ${SPACING['2XL']};
    --spacing-3xl: ${SPACING['3XL']};
    
    /* Responsive Breakpoints */
    --breakpoint-xs: ${BREAKPOINTS.XS};
    --breakpoint-sm: ${BREAKPOINTS.SM};
    --breakpoint-md: ${BREAKPOINTS.MD};
    --breakpoint-lg: ${BREAKPOINTS.LG};
    --breakpoint-xl: ${BREAKPOINTS.XL};
    --breakpoint-2xl: ${BREAKPOINTS['2XL']};
    --breakpoint-tablet: ${BREAKPOINTS.TABLET};
    --breakpoint-tablet-lg: ${BREAKPOINTS.TABLET_LG};
    
    /* Border Radius */
    --border-radius-sm: ${BORDERS.RADIUS.SM};
    --border-radius-md: ${BORDERS.RADIUS.MD};
    --border-radius-lg: ${BORDERS.RADIUS.LG};
    --border-radius-xl: ${BORDERS.RADIUS.XL};
    --border-radius-full: ${BORDERS.RADIUS.FULL};
    
    /* Border Width */
    --border-width-thin: ${BORDERS.WIDTH.THIN};
    --border-width-medium: ${BORDERS.WIDTH.MEDIUM};
    
    /* Shadows */
    --shadow-sm: ${SHADOWS.SM};
    --shadow-default: ${SHADOWS.DEFAULT};
    --shadow-lg: ${SHADOWS.LG};
  }
`;
