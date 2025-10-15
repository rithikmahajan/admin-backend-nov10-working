import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const SaveArrangementModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-[445px] h-[280px] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-[33px] top-[33px] w-6 h-6 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon */}
        <div className="absolute left-1/2 top-[45px] transform -translate-x-1/2 w-[35px] h-[35px] flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500" />
        </div>

        {/* Title */}
        <div className="absolute left-1/2 top-[127px] transform -translate-x-1/2 text-center">
          <p className="font-['Montserrat'] font-bold text-[18px] text-black leading-[22px] tracking-[-0.41px] w-[175px]">
            are you sure you want to save this arrangement
          </p>
        </div>

        {/* Buttons */}
        <div className="absolute bottom-[63px] left-1/2 transform -translate-x-1/2 flex gap-[21px]">
          {/* Yes Button */}
          <button
            onClick={onConfirm}
            className="bg-black text-white rounded-[100px] w-[188px] h-[48px] flex items-center justify-center border border-black"
          >
            <span className="font-['Montserrat'] font-medium text-[16px] leading-[1.2]">
              Yes
            </span>
          </button>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="bg-white text-black rounded-[100px] w-[188px] h-[48px] flex items-center justify-center border border-[#e4e4e4]"
          >
            <span className="font-['Montserrat'] font-medium text-[16px] leading-[1.2]">
              Cancel
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveArrangementModal;
