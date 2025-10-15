import React, { useState } from 'react';
import { User } from 'lucide-react';

/**
 * Simple Modal Test Component
 * 
 * Basic test to see if modal functionality works
 */
const SimpleModalTest = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    console.log('Button clicked! Current state:', isOpen);
    alert('Button clicked! Current state: ' + isOpen);
    setIsOpen(!isOpen);
  };

  console.log('SimpleModalTest render - isOpen:', isOpen);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Simple Modal Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold mb-4">Basic Click Test</h2>
          
          {/* Simple Test Button */}
          <div className="relative inline-block">
            <button
              onClick={handleClick}
              className="w-[40px] h-[40px] bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <User className="w-5 h-5" />
            </button>
            
            {/* Simple Modal */}
            {isOpen && (
              <div className="absolute top-full right-0 mt-2 z-50 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                <div className="text-lg font-semibold mb-2">Test Modal</div>
                <div className="text-sm text-gray-600">Modal is working!</div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Current State:</h3>
            <p>Modal Open: <span className={isOpen ? 'text-green-600' : 'text-red-600'}>{isOpen.toString()}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleModalTest;
