import React, { useState } from 'react';

const NetworkCallMonitor = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Simple monitor without intercepting console.log to prevent re-renders
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-sm z-50"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-gray-100 border border-gray-300 rounded-lg p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-gray-800">Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      <div className="text-sm text-gray-600">
        <p>Check browser Network tab for API calls</p>
        <p>Check console for detailed logs</p>
      </div>
    </div>
  );
};

export default NetworkCallMonitor;
