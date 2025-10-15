import React, { useState, useEffect } from 'react';
import { errorMonitor, requestTracker } from '../utils/errorMonitor';

const ErrorMonitorWidget = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [errors, setErrors] = useState([]);
  const [errorStats, setErrorStats] = useState({});
  const [activeRequests, setActiveRequests] = useState([]);

  useEffect(() => {
    // Subscribe to error updates
    const unsubscribe = errorMonitor.onError((error) => {
      setErrors(prevErrors => [error, ...prevErrors.slice(0, 9)]); // Keep last 10 errors
      setErrorStats(errorMonitor.getErrorStats());
    });

    // Update active requests periodically
    const interval = setInterval(() => {
      const active = Array.from(requestTracker.activeRequests.keys());
      setActiveRequests(active);
    }, 1000);

    // Initial load
    setErrors(errorMonitor.getRecentErrors(10));
    setErrorStats(errorMonitor.getErrorStats());

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
        >
          🔍 {errors.length > 0 && <span className="ml-1">({errors.length})</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 p-3 border-b flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Error Monitor</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              errorMonitor.clearErrors();
              setErrors([]);
              setErrorStats({});
            }}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-2 bg-gray-50 border-b text-xs">
        <div className="flex flex-wrap gap-2">
          {Object.entries(errorStats).map(([type, count]) => (
            <span key={type} className={`px-2 py-1 rounded ${getTypeColor(type)}`}>
              {type}: {count}
            </span>
          ))}
        </div>
        {activeRequests.length > 0 && (
          <div className="mt-2">
            <strong>Active Requests:</strong> {activeRequests.length}
            <div className="text-xs text-gray-600 mt-1">
              {activeRequests.slice(0, 3).map((req, index) => (
                <div key={index} className="truncate">• {req}</div>
              ))}
              {activeRequests.length > 3 && <div>...and {activeRequests.length - 3} more</div>}
            </div>
          </div>
        )}
      </div>

      {/* Error List */}
      <div className="max-h-60 overflow-y-auto">
        {errors.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">
            ✅ No errors
          </div>
        ) : (
          errors.map((error, index) => (
            <div
              key={`${error.timestamp}-${index}`}
              className={`p-3 border-b border-gray-100 ${index === 0 ? 'bg-red-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`text-xs px-2 py-1 rounded inline-block mb-1 ${getTypeColor(error.type)}`}>
                    {error.type}
                  </div>
                  <div className="text-sm font-medium text-gray-800 mb-1">
                    {error.message}
                  </div>
                  {error.context.url && (
                    <div className="text-xs text-gray-600 mb-1">
                      <strong>URL:</strong> {error.context.url}
                    </div>
                  )}
                  {error.context.status && (
                    <div className="text-xs text-gray-600 mb-1">
                      <strong>Status:</strong> {error.context.status}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Debug Actions */}
      <div className="p-2 bg-gray-50 border-t">
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => {
              console.group('🔍 Debug Information');
              errorMonitor.debugStatus();
              requestTracker.debugRequests();
              console.groupEnd();
            }}
            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
          >
            Console Debug
          </button>
          <button
            onClick={() => {
              const debug = {
                errors: errorMonitor.getRecentErrors(20),
                stats: errorMonitor.getErrorStats(),
                activeRequests: Array.from(requestTracker.activeRequests.keys())
              };
              navigator.clipboard.writeText(JSON.stringify(debug, null, 2));
              alert('Debug info copied to clipboard');
            }}
            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
          >
            Copy Debug
          </button>
        </div>
      </div>
    </div>
  );
};

const getTypeColor = (type) => {
  const colors = {
    'TIMEOUT': 'bg-orange-200 text-orange-800',
    'CANCELLED': 'bg-gray-200 text-gray-800',
    'NETWORK': 'bg-red-200 text-red-800',
    'AUTH': 'bg-yellow-200 text-yellow-800',
    'PERMISSION': 'bg-purple-200 text-purple-800',
    'NOT_FOUND': 'bg-blue-200 text-blue-800',
    'SERVER': 'bg-red-200 text-red-800',
    'CLIENT': 'bg-orange-200 text-orange-800',
    'UNKNOWN': 'bg-gray-200 text-gray-800'
  };
  return colors[type] || colors['UNKNOWN'];
};

export default ErrorMonitorWidget;
