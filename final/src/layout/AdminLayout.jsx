import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Sidebar from './Sidebar';

const AdminLayout = React.memo(() => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  const handleSidebarToggle = useCallback((open) => {
    setSidebarOpen(open);
  }, []);

  const handleSidebarVisibilityToggle = useCallback(() => {
    setSidebarHidden(prev => !prev);
    if (!sidebarHidden) {
      setSidebarOpen(false);
    }
  }, [sidebarHidden]);

  return (
    <div className="flex h-screen bg-white">
     
      
      
      {/* Sidebar */}
      {!sidebarHidden && (
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={handleSidebarToggle}
          sidebarHidden={sidebarHidden}
          onToggleSidebarVisibility={handleSidebarVisibilityToggle}
        />
      )}

      {/* Show Sidebar Button */}
      {sidebarHidden && (
        <button
          onClick={handleSidebarVisibilityToggle}
          className="fixed top-[120px] sm:top-[140px] left-2 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 bg-white border border-gray-300 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 z-50"
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
        </button>
      )}
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarHidden ? 'ml-0' : 'lg:ml-0'
      }`}>
        <Outlet />
      </div>
    </div>
  );
});

export default AdminLayout;
