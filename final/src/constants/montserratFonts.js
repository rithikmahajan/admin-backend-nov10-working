/**
 * Montserrat Font Family Reference
 * 
 * This file demonstrates all available Montserrat font weights and styles
 * Use these as reference for implementing consistent typography
 */

// Available Montserrat Font Weights
export const MONTSERRAT_WEIGHTS = {
  thin: '100',
  extralight: '200', 
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900'
};

// Tailwind CSS Classes for Montserrat
export const MONTSERRAT_CLASSES = {
  // Font Family
  family: 'font-montserrat',
  variable: 'font-montserrat-variable',
  
  // Weights
  thin: 'font-thin',           // font-weight: 100
  extralight: 'font-extralight', // font-weight: 200
  light: 'font-light',         // font-weight: 300
  normal: 'font-normal',       // font-weight: 400
  medium: 'font-medium',       // font-weight: 500
  semibold: 'font-semibold',   // font-weight: 600
  bold: 'font-bold',           // font-weight: 700
  extrabold: 'font-extrabold', // font-weight: 800
  black: 'font-black',         // font-weight: 900
  
  // Italic
  italic: 'italic',
  
  // Common Combinations
  regularText: 'font-montserrat font-normal',
  buttonText: 'font-montserrat font-medium',
  heading: 'font-montserrat font-bold',
  caption: 'font-montserrat font-medium'
};

// Figma-specific font combinations used in the design
export const FIGMA_FONT_STYLES = {
  // Button text: Montserrat Regular 14px/20px
  button: "font-['Montserrat:Regular',_sans-serif] text-[14px] font-normal leading-[20px]",
  
  // Heading text: Montserrat Bold 18px/22px  
  heading: "font-['Montserrat:Bold',_sans-serif] text-[18px] font-bold leading-[22px]",
  
  // Body text: Montserrat Regular 14px/20px
  body: "font-['Montserrat:Regular',_sans-serif] text-[14px] font-normal leading-[20px]",
  
  // Caption text: Montserrat Medium 12px/16px
  caption: "font-['Montserrat:Medium',_sans-serif] text-[12px] font-medium leading-[16px]",
  
  // Table header: Montserrat Bold 14px/20px
  tableHeader: "font-['Montserrat:Bold',_sans-serif] text-[14px] font-bold leading-[20px]",
  
  // Large title: Montserrat Bold 24px/28px
  title: "font-['Montserrat:Bold',_sans-serif] text-[24px] font-bold leading-[28px]"
};

// CSS-in-JS styles for dynamic usage
export const MONTSERRAT_STYLES = {
  thin: { fontFamily: 'Montserrat, sans-serif', fontWeight: 100 },
  extralight: { fontFamily: 'Montserrat, sans-serif', fontWeight: 200 },
  light: { fontFamily: 'Montserrat, sans-serif', fontWeight: 300 },
  regular: { fontFamily: 'Montserrat, sans-serif', fontWeight: 400 },
  medium: { fontFamily: 'Montserrat, sans-serif', fontWeight: 500 },
  semibold: { fontFamily: 'Montserrat, sans-serif', fontWeight: 600 },
  bold: { fontFamily: 'Montserrat, sans-serif', fontWeight: 700 },
  extrabold: { fontFamily: 'Montserrat, sans-serif', fontWeight: 800 },
  black: { fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }
};

// Usage Examples:
/*
// Using Tailwind classes
<h1 className="font-montserrat font-bold text-2xl">Bold Heading</h1>
<p className="font-montserrat font-regular text-base">Regular text</p>
<button className="font-montserrat font-medium text-sm">Medium Button</button>

// Using Figma-specific styles
<button className={FIGMA_FONT_STYLES.button}>Figma Button</button>
<h2 className={FIGMA_FONT_STYLES.heading}>Figma Heading</h2>

// Using custom CSS classes
<span className="font-montserrat-medium">Medium Weight</span>
<span className="font-montserrat-bold-italic">Bold Italic</span>

// Using inline styles with CSS-in-JS
<div style={MONTSERRAT_STYLES.semibold}>Semibold Text</div>
*/
