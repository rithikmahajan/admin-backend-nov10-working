import React from 'react';
import { X, Check } from 'lucide-react';

const SaveSuccessModal = ({ isOpen, onClose }) => {
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

        {/* Success Check Icon */}
        <div className="absolute left-1/2 top-[45px] transform -translate-x-1/2 w-[74px] h-[74px] flex items-center justify-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <div className="absolute left-1/2 top-[125px] transform -translate-x-1/2 text-center">
          <p className="font-['Montserrat'] font-bold text-[18px] text-black leading-[22px] tracking-[-0.41px] w-[242px]">
            Arrangement updated successfully!
          </p>
        </div>

        {/* Done Button */}
        <div className="absolute left-1/2 bottom-[63px] transform -translate-x-1/2">
          <button
            onClick={onClose}
            className="bg-black text-white rounded-3xl w-[270px] h-12 flex items-center justify-center"
          >
            <span className="font-['Montserrat'] font-semibold text-[16px] leading-[1.406]">
              Done
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSuccessModal;
