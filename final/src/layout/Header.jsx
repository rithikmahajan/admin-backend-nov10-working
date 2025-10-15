import React, { useCallback, useState } from 'react';
import { User } from 'lucide-react';
import ProfileIconModal from '../components/modals/profileiconmodal';

/**
 * Header Component
 * 
 * Top navigation bar for the admin dashboard providing:
 * - Brand logo/title
 * - Global search functionality
 * - Quick action buttons (messages, notifications, profile)
 * - Responsive design with mobile sidebar toggle
 * 
 * Performance Optimizations:
 * - React.memo to prevent unnecessary re-renders
 * - useCallback for event handlers
 * - Optimized icon rendering
 * - Proper accessibility attributes
 */
const Header = React.memo(() => {
  // State for profile modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleProfileClick = useCallback(() => {
    console.log('=== PROFILE BUTTON CLICKED ===');
    console.log('Current state:', isProfileModalOpen);
    const newState = !isProfileModalOpen;
    console.log('Setting new state to:', newState);
    alert('Profile button clicked! New state: ' + newState);
    setIsProfileModalOpen(newState);
  }, [isProfileModalOpen]);

  // Handle profile modal close
  const handleProfileModalClose = useCallback(() => {
    console.log('Closing profile modal');
    setIsProfileModalOpen(false);
  }, []);

  // Debug logging
  console.log('Header render - isProfileModalOpen:', isProfileModalOpen);

  return (
    <header className="bg-white h-[60px] w-full max-w-[1920px] relative shadow-sm">
      <div className="flex items-center justify-between h-full px-4 sm:px-8 lg:px-16">
        
        {/* Left side - Brand Logo */}
        <div className="flex items-center">
          {/* Brand Logo */}
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-black tracking-wide">
            YORAA
          </div>
        </div>

        {/* Right side - Action Icons */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Profile/User Icon with Modal */}
          <div className="relative">
            <button 
              onClick={handleProfileClick}
              className="w-[20px] h-[20px] sm:w-[21.85px] sm:h-[22px] text-gray-500 hover:text-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="User profile"
              title="Profile"
              aria-expanded={isProfileModalOpen}
              aria-haspopup="true"
              id="profile-menu-button"
            >
              <User className="w-full h-full" />
            </button>
            
            {/* Profile Modal */}
            <ProfileIconModal
              isOpen={isProfileModalOpen}
              onClose={handleProfileModalClose}
              position="bottom-right"
            />
          </div>
        </div>
      </div>
    </header>
  );
});

// Set display name for debugging
Header.displayName = 'Header';

export default Header;
