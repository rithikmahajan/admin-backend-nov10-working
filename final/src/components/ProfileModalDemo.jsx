import React, { useState } from 'react';
import { User } from 'lucide-react';
import ProfileIconModal from './modals/profileiconmodal';

/**
 * ProfileModalDemo Component
 * 
 * Demo component to test the ProfileIconModal functionality
 */
const ProfileModalDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggleModal = () => {
    console.log('Demo: Toggling modal, current state:', isModalOpen);
    setIsModalOpen(prev => !prev);
  };

  const handleCloseModal = () => {
    console.log('Demo: Closing modal');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Profile Modal Demo</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold mb-4">Test the Profile Dropdown Modal</h2>
          <p className="text-gray-600 mb-6">
            Click the profile icon below to test the modal functionality:
          </p>
          
          {/* Demo Profile Button */}
          <div className="relative inline-block">
            <button
              onClick={handleToggleModal}
              className="w-[40px] h-[40px] bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="User profile"
              title="Profile"
              aria-expanded={isModalOpen}
              aria-haspopup="true"
              id="profile-menu-button"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Profile Modal */}
            <ProfileIconModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              position="bottom-right"
            />
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Current State:</h3>
            <p>Modal Open: <span className={isModalOpen ? 'text-green-600' : 'text-red-600'}>{isModalOpen.toString()}</span></p>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Click the profile icon to open/close the modal</li>
              <li>Click outside the modal to close it</li>
              <li>Press Escape key to close the modal</li>
              <li>Click on "Change Password" or "Log Out" to test functionality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModalDemo;
