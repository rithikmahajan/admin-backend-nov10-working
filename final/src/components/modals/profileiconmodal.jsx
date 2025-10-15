import React, { useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../store/slices/authSlice";

/**
 * ProfileIconModal Component
 *
 * Admin dropdown modal that appears when clicking the profile icon
 * Features:
 * - Logout functionality
 * - Click outside to close
 * - Proper positioning relative to trigger
 */
const ProfileIconModal = ({ isOpen, onClose, position = "bottom-right" }) => {
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        // Check if the click is on the profile button itself
        const profileButton = document.getElementById("profile-menu-button");
        if (profileButton && !profileButton.contains(event.target)) {
          onClose();
        }
      }
    };

    if (isOpen) {
      // Add a small delay to prevent immediate closing when opening
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [isOpen, onClose]);

  // Handle logout click
  const handleLogout = async () => {
    console.log("Logout clicked");
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      try {
        // Dispatch Redux logout action to clear state and localStorage
        await dispatch(logoutUser()).unwrap();
        console.log("Logout successful");
        // Navigate to AuthFlow after successful logout
        navigate("/auth");
        onClose();
      } catch (error) {
        console.error("Logout failed:", error);
        // Even if logout fails, still navigate to auth page
        navigate("/auth");
        onClose();
      }
    }
  };

  // Debug logging
  console.log(
    "ProfileIconModal render - isOpen:",
    isOpen,
    "position:",
    position
  );

  // Position classes based on position prop
  const positionClasses = {
    "bottom-right": "top-full right-0 mt-2",
    "bottom-left": "top-full left-0 mt-2",
    "top-right": "bottom-full right-0 mb-2",
    "top-left": "bottom-full left-0 mb-2",
  };

  // Always render but control visibility with CSS
  return (
    <div
      ref={modalRef}
      className={`absolute ${
        positionClasses[position]
      } z-[9999] min-w-[200px] transition-all duration-200 ease-in-out ${
        isOpen
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95 pointer-events-none"
      }`}
      role="menu"
      aria-labelledby="profile-menu-button"
      style={{ transformOrigin: "top right" }}
    >
      {/* Modal Content */}
      <div className="bg-[#ffffff] box-border flex flex-col gap-[16px] items-start justify-start p-[16px] relative rounded-lg shadow-lg border border-gray-200">
        {/* Modal Title */}
        <div className="font-montserrat font-semibold text-[20px] text-[#232321] leading-none">
          Admin
        </div>

        {/* Logout Button */}
        <div className="w-full">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-0 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
            role="menuitem"
          >
            <span className="font-montserrat font-medium text-[14px] text-[#232321] uppercase tracking-[0.25px]">
              LOG OUT
            </span>
            <LogOut className="w-4 h-4 text-[#232321] group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileIconModal;
