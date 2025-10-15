import React from 'react';
import { X } from 'lucide-react';

const DeleteConfirmationModal = ({ 
  isOpen = false,
  onConfirm,
  onCancel,
  title = "are you sure you want to delete this",
  confirmText = "Yes",
  cancelText = "Cancel",
  itemName = ""
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel?.();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel?.();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-all duration-300 ease-out"
      onClick={handleOverlayClick}
      style={{
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-sm mx-auto relative transform transition-all duration-300 ease-out"
        style={{
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        
        <div className="p-8 text-center">
          {/* Red Warning Icon - Exact Figma Design */}
          <div className="flex justify-center mb-8">
            <div 
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center"
              style={{
                animation: 'pulse 2s infinite'
              }}
            >
              <span className="text-white text-2xl font-bold">!</span>
            </div>
          </div>

          {/* Title - Exact Figma Text */}
          <h2 className="font-montserrat font-medium text-[18px] text-black leading-[22px] mb-8">
            {title}
          </h2>

          {/* Item Name (if provided) */}
          {itemName && (
            <div className="mb-6">
              <p className="font-montserrat text-[14px] text-gray-600 mb-2">
                Item to delete:
              </p>
              <p className="font-montserrat font-semibold text-[16px] text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">
                "{itemName}"
              </p>
            </div>
          )}

          {/* Action Buttons - Exact Figma Layout */}
          <div className="flex gap-4">
            {/* Yes Button - Black */}
            <button
              onClick={onConfirm}
              className="flex-1 bg-black text-white py-3 px-6 rounded-full font-montserrat font-medium text-[16px] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-800"
            >
              {confirmText}
            </button>

            {/* Cancel Button - White with Border */}
            <button
              onClick={onCancel}
              className="flex-1 bg-white text-black py-3 px-6 rounded-full font-montserrat font-medium text-[16px] border border-gray-300 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] hover:bg-gray-50"
            >
              {cancelText}
            </button>
          </div>
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
            transform: translateY(30px) scale(0.9);
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
      `}</style>
    </div>
  );
};

export default DeleteConfirmationModal;
