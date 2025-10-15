import React from 'react';
import { FIGMA_FONT_STYLES, MONTSERRAT_CLASSES } from '../constants/montserratFonts';

/**
 * Montserrat Font Demo Component
 * 
 * This component displays all available Montserrat font weights and styles
 * Use this to test and verify that all fonts are loading correctly
 */
const MontserratFontDemo = () => {
  const weights = [
    { name: 'Thin', weight: '100', class: 'font-thin' },
    { name: 'Extra Light', weight: '200', class: 'font-extralight' },
    { name: 'Light', weight: '300', class: 'font-light' },
    { name: 'Regular', weight: '400', class: 'font-normal' },
    { name: 'Medium', weight: '500', class: 'font-medium' },
    { name: 'Semi Bold', weight: '600', class: 'font-semibold' },
    { name: 'Bold', weight: '700', class: 'font-bold' },
    { name: 'Extra Bold', weight: '800', class: 'font-extrabold' },
    { name: 'Black', weight: '900', class: 'font-black' }
  ];

  return (
    <div className="p-8 bg-white">
      <h1 className="text-3xl font-bold mb-8 font-montserrat">Montserrat Font Family Demo</h1>
      
      {/* Weight Demonstrations */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-6 font-montserrat">All Font Weights</h2>
        <div className="space-y-4">
          {weights.map((weight) => (
            <div key={weight.weight} className="flex items-center gap-4">
              <span className="w-24 text-sm text-gray-600 font-mono">
                {weight.weight}
              </span>
              <span className="w-32 text-sm text-gray-700">
                {weight.name}
              </span>
              <span className={`font-montserrat ${weight.class} text-lg`}>
                The quick brown fox jumps over the lazy dog
              </span>
              <span className={`font-montserrat ${weight.class} italic text-lg text-gray-600`}>
                (Italic)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Figma-specific Styles */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-6 font-montserrat">Figma Design System Styles</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Button Text (14px/20px Regular)</h3>
            <div className={FIGMA_FONT_STYLES.button + " text-black"}>
              Button Text Example - Connected, Not Connected, Sync Now
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Heading Text (18px/22px Bold)</h3>
            <div className={FIGMA_FONT_STYLES.heading + " text-black"}>
              Dashboard Management System
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Body Text (14px/20px Regular)</h3>
            <div className={FIGMA_FONT_STYLES.body + " text-black"}>
              This is regular body text used throughout the application interface.
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Table Header (14px/20px Bold)</h3>
            <div className={FIGMA_FONT_STYLES.tableHeader + " text-black"}>
              Product Name | Price | SKU | Status
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Title (24px/28px Bold)</h3>
            <div className={FIGMA_FONT_STYLES.title + " text-black"}>
              Product Sync Manager
            </div>
          </div>
        </div>
      </div>

      {/* Variable Font Demonstration */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-6 font-montserrat">Variable Font Weights</h2>
        <div className="space-y-2">
          {Array.from({ length: 9 }, (_, i) => {
            const weight = (i + 1) * 100;
            return (
              <div 
                key={weight}
                className="font-montserrat-variable text-lg"
                style={{ fontWeight: weight }}
              >
                Weight {weight}: The quick brown fox jumps over the lazy dog
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage Examples */}
      <div>
        <h2 className="text-xl font-semibold mb-6 font-montserrat">Usage Examples</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-montserrat font-bold text-lg mb-4">Code Examples:</h3>
          <div className="space-y-3 text-sm font-mono bg-gray-800 text-green-400 p-4 rounded">
            <div>{'<button className="font-montserrat font-medium text-sm">Medium Button</button>'}</div>
            <div>{'<h1 className="font-montserrat font-bold text-2xl">Bold Heading</h1>'}</div>
            <div>{'<p className="font-montserrat font-normal text-base">Regular text</p>'}</div>
            <div>{'<span className={FIGMA_FONT_STYLES.button}>Figma Button Style</span>'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MontserratFontDemo;
