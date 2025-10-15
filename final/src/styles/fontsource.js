/**
 * Fontsource Montserrat Import
 * 
 * This file imports all Montserrat font weights using Fontsource
 * for better performance, offline support, and reduced FOUC (Flash of Unstyled Content)
 */

// Import all Montserrat weights (100-900)
import '@fontsource/montserrat/100.css';
import '@fontsource/montserrat/200.css';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';

// Import italic variants
import '@fontsource/montserrat/100-italic.css';
import '@fontsource/montserrat/200-italic.css';
import '@fontsource/montserrat/300-italic.css';
import '@fontsource/montserrat/400-italic.css';
import '@fontsource/montserrat/500-italic.css';
import '@fontsource/montserrat/600-italic.css';
import '@fontsource/montserrat/700-italic.css';
import '@fontsource/montserrat/800-italic.css';
import '@fontsource/montserrat/900-italic.css';

// Import variable font for smoother weight transitions
import '@fontsource-variable/montserrat';

// Export for use in components
export const MONTSERRAT_LOADED = true;
