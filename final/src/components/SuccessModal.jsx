import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

/**
 * SuccessModal Component
 * 
 * A reusable success modal component that matches the Figma design specifications.
 * Features:
 * - Dynamic message support for different success scenarios
 * - Consistent Figma-based design with green checkmark
 * - Smooth animations (fadeIn, slideUp, pulse)
 * - Keyboard navigation (ESC to close)
 * - Overlay click to close
 * - Consistent Montserrat fonts
 * - Auto-close option
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback function when modal is closed
 * @param {string} title - Dynamic message text for the modal
 * @param {boolean} autoClose - Auto-close after 3 seconds (default: false)
 * @param {string} buttonText - Text for the action button (default: "Done")
 */
const SuccessModal = ({ 
  isOpen, 
  onClose, 
  title = "Operation completed successfully!", 
  autoClose = false,
  buttonText = "Done"
}) => {
  // Handle keyboard events (ESC to close)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Auto-close functionality
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose]);

  // Handle overlay click to close
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 animate-fadeIn"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] relative w-full max-w-md mx-4 overflow-hidden animate-slideUp">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-[20px] top-[20px] w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-full h-full" />
        </button>

        {/* Modal content */}
        <div className="p-8 text-center">
          {/* Success icon - Green circle with white checkmark */}
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Check className="w-8 h-8 text-white stroke-[3]" />
          </div>

          {/* Success message */}
          <h3 className="font-bold text-black text-[18px] mb-6 font-montserrat leading-tight">
            {title}
          </h3>

          {/* Done button */}
          <button
            onClick={onClose}
            className="bg-black text-white px-16 py-3 rounded-full font-medium text-[16px] font-montserrat hover:bg-gray-800 transition-colors min-w-[200px]"
          >
            {buttonText}
          </button>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-pulse {
          animation: pulse 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SuccessModal;
