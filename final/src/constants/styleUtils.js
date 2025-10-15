/**
 * Style Utilities
 * 
 * Utility functions for consistent styling based on design variables
 */

import { COLORS, TYPOGRAPHY, BORDERS, SPACING, SHADOWS } from './designVariables';

/**
 * Generate consistent button styles
 */
export const getButtonStyles = (variant = 'primary', size = 'medium') => {
  const baseStyles = {
    borderRadius: BORDERS.RADIUS.LG,
    fontFamily: TYPOGRAPHY.FONTS.MONTSERRAT,
    fontWeight: TYPOGRAPHY.FONT_WEIGHTS.MEDIUM,
    transition: 'all 0.2s ease-in-out',
    border: `${BORDERS.WIDTH.MEDIUM} solid`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.SM
  };

  const variants = {
    primary: {
      backgroundColor: COLORS.BRAND_BLUE,
      color: COLORS.WHITE,
      borderColor: COLORS.BRAND_BLUE,
      '&:hover': {
        backgroundColor: COLORS.BLUE,
        borderColor: COLORS.BLUE
      }
    },
    secondary: {
      backgroundColor: COLORS.WHITE,
      color: COLORS.TEXT_BLACK,
      borderColor: COLORS.BORDER_GRAY,
      '&:hover': {
        borderColor: COLORS.LIGHT_GRAY
      }
    },
    toggle: {
      backgroundColor: COLORS.WHITE,
      color: COLORS.TEXT_BLACK,
      borderColor: COLORS.BORDER_GRAY,
      '&.active': {
        backgroundColor: COLORS.BRAND_BLUE,
        color: COLORS.WHITE,
        borderColor: COLORS.PRIMARY_BLACK
      }
    }
  };

  const sizes = {
    small: {
      height: '34px',
      padding: `0 ${SPACING.LG}`,
      fontSize: TYPOGRAPHY.FONT_SIZES.SM
    },
    medium: {
      height: '40px',
      padding: `0 ${SPACING.LG}`,
      fontSize: TYPOGRAPHY.FONT_SIZES.BASE
    },
    large: {
      height: '47px',
      padding: `0 ${SPACING.LG}`,
      fontSize: TYPOGRAPHY.FONT_SIZES.BASE
    }
  };

  return {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size]
  };
};

/**
 * Generate consistent input styles
 */
export const getInputStyles = (variant = 'default') => {
  const baseStyles = {
    width: '100%',
    height: '47px',
    padding: `0 ${SPACING.LG}`,
    border: `${BORDERS.WIDTH.MEDIUM} solid ${COLORS.PRIMARY_BLACK}`,
    borderRadius: BORDERS.RADIUS.XL,
    fontSize: TYPOGRAPHY.FONT_SIZES.BASE,
    fontFamily: TYPOGRAPHY.FONTS.MONTSERRAT,
    backgroundColor: COLORS.WHITE,
    outline: 'none',
    '&:focus': {
      outline: 'none',
      ring: 'none'
    }
  };

  const variants = {
    default: baseStyles,
    textarea: {
      ...baseStyles,
      height: '154px',
      padding: `${SPACING.MD} ${SPACING.LG}`,
      resize: 'none'
    }
  };

  return variants[variant];
};

/**
 * Generate consistent label styles
 */
export const getLabelStyles = () => ({
  display: 'block',
  fontSize: TYPOGRAPHY.FONT_SIZES.XL,
  fontWeight: TYPOGRAPHY.FONT_WEIGHTS.MEDIUM,
  color: COLORS.TEXT_BLACK,
  fontFamily: TYPOGRAPHY.FONTS.MONTSERRAT,
  marginBottom: SPACING.MD,
  lineHeight: TYPOGRAPHY.LINE_HEIGHTS.RELAXED
});

/**
 * Generate consistent heading styles
 */
export const getHeadingStyles = (level = 1) => {
  const baseStyles = {
    fontFamily: TYPOGRAPHY.FONTS.MONTSERRAT,
    fontWeight: TYPOGRAPHY.FONT_WEIGHTS.BOLD,
    color: COLORS.TEXT_BLACK,
    lineHeight: TYPOGRAPHY.LINE_HEIGHTS.RELAXED
  };

  const levels = {
    1: {
      fontSize: TYPOGRAPHY.FONT_SIZES['4XL']
    },
    2: {
      fontSize: TYPOGRAPHY.FONT_SIZES['3XL']
    },
    3: {
      fontSize: TYPOGRAPHY.FONT_SIZES['2XL']
    },
    4: {
      fontSize: TYPOGRAPHY.FONT_SIZES.XL
    }
  };

  return {
    ...baseStyles,
    ...levels[level]
  };
};

/**
 * Generate consistent card styles
 */
export const getCardStyles = () => ({
  backgroundColor: COLORS.WHITE,
  border: `${BORDERS.WIDTH.THIN} solid ${COLORS.GRAY}`,
  borderRadius: BORDERS.RADIUS.XL,
  boxShadow: SHADOWS.LG,
  padding: SPACING.LG
});

/**
 * Generate Tailwind CSS classes for consistent styling
 */
export const getTailwindClasses = {
  button: {
    primary: 'bg-[#000AFF] text-white border-2 border-[#000AFF] rounded-lg font-medium font-[\'Montserrat\'] transition-colors hover:bg-[#003F62] hover:border-[#003F62] px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
    secondary: 'bg-white text-[#111111] border-2 border-[#E4E4E4] rounded-lg font-medium font-[\'Montserrat\'] transition-colors hover:border-[#BCBCBC] px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
    toggle: 'bg-white text-[#111111] border-2 border-[#E4E4E4] rounded-[100px] font-medium font-[\'Montserrat\'] transition-colors px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm',
    toggleActive: 'bg-[#000AFF] text-white border-2 border-[#000000] rounded-[100px] font-medium font-[\'Montserrat\'] transition-colors px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm'
  },
  input: {
    default: 'w-full h-[40px] sm:h-[47px] px-3 sm:px-4 border-2 border-[#000000] rounded-xl focus:outline-none focus:ring-0 text-sm sm:text-[16px] bg-white font-[\'Montserrat\']',
    textarea: 'w-full h-[120px] sm:h-[154px] px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#000000] rounded-xl resize-none focus:outline-none focus:ring-0 text-sm sm:text-[16px] bg-white font-[\'Montserrat\']'
  },
  label: 'block text-lg sm:text-[21px] font-medium text-[#111111] font-[\'Montserrat\'] mb-2 sm:mb-3 leading-[20px] sm:leading-[24px]',
  heading: {
    h1: 'text-2xl sm:text-3xl lg:text-[48px] font-bold text-[#111111] font-[\'Montserrat\'] leading-[28px] sm:leading-[32px] lg:leading-[24px]',
    h2: 'text-xl sm:text-2xl lg:text-[36px] font-bold text-[#111111] font-[\'Montserrat\'] leading-[24px] sm:leading-[28px] lg:leading-[24px]',
    h3: 'text-lg sm:text-xl lg:text-[32px] font-bold text-[#111111] font-[\'Montserrat\'] leading-[22px] sm:leading-[24px] lg:leading-[24px]',
    h4: 'text-base sm:text-lg lg:text-[21px] font-medium text-[#111111] font-[\'Montserrat\'] mb-2 sm:mb-3'
  },
  text: {
    body: 'text-sm sm:text-[16px] text-[#111111] font-[\'Montserrat\']',
    small: 'text-xs sm:text-[14px] text-[#111111] font-[\'Montserrat\']',
    caption: 'text-[10px] font-medium text-[#111111] font-[\'Montserrat\'] text-center'
  },
  // Responsive spacing utilities
  spacing: {
    container: 'px-4 sm:px-6 lg:px-8 xl:px-16',
    section: 'py-4 sm:py-6 lg:py-8',
    element: 'p-3 sm:p-4 lg:p-6',
    gap: 'gap-3 sm:gap-4 lg:gap-6'
  },
  // Responsive grid utilities
  grid: {
    responsive1: 'grid grid-cols-1',
    responsive2: 'grid grid-cols-1 sm:grid-cols-2',
    responsive3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    responsive4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    responsive5: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    gap: 'gap-4 sm:gap-6 lg:gap-8'
  },
  // Responsive flex utilities
  flex: {
    responsiveRow: 'flex flex-col sm:flex-row',
    responsiveCol: 'flex flex-col',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    responsive: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6'
  }
};

const styleUtils = {
  getButtonStyles,
  getInputStyles,
  getLabelStyles,
  getHeadingStyles,
  getCardStyles,
  getTailwindClasses
};

export default styleUtils;
