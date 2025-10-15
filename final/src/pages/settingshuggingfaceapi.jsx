import React, { useState, useCallback, useMemo } from 'react';
import TwoFactorAuth from '../components/TwoFactorAuth';

/**
 * HuggingFaceAPIControl Component - Manages Hugging Face API settings
 * 
 * Features:
 * - Toggle Hugging Face API on/off with 2FA verification
 * - Modal-based UI flow for security
 * - Complete authentication workflow
 * 
 * Extracted from Settings.js to reduce file size and improve maintainability
 */

// ==============================
// CONSTANTS
// ==============================

const SETTINGS_KEYS = {
  HUGGING_FACE_API: 'huggingFaceAPI'
};

const DEFAULT_SETTINGS = {
  huggingFaceAPI: true
};

const HuggingFaceAPIControl = () => {
  // ==============================
  // STATE MANAGEMENT
  // ==============================
  
  // Settings state
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  
  // Modal state
  const [modals, setModals] = useState({
    // Hugging Face API modals
    huggingFaceAPIConfirmOn: false,
    huggingFaceAPIConfirmOff: false,
    huggingFaceAPI2FAOn: false,
    huggingFaceAPI2FAOff: false,
    huggingFaceAPISuccessOn: false,
    huggingFaceAPISuccessOff: false,
    huggingFaceAPIFinalSuccessOn: false,
    huggingFaceAPIFinalSuccessOff: false,
  });

  // Authentication state
  // Note: OTP and password inputs are now handled by TwoFactorAuth component

  // ==============================
  // UTILITY FUNCTIONS
  // ==============================
  
  const updateModal = useCallback((key, value) => {
    setModals(prev => ({ ...prev, [key]: value }));
  }, []);

  // ==============================
  // TOGGLE HANDLERS
  // ==============================
  
  const handleToggleSetting = useCallback((settingKey, action) => {
    const modalKey = `${settingKey}Confirm${action === 'on' ? 'On' : 'Off'}`;
    updateModal(modalKey, true);
  }, [updateModal]);

  const handleConfirmToggleOn = useCallback((settingKey) => {
    updateModal(`${settingKey}ConfirmOn`, false);
    updateModal(`${settingKey}2FAOn`, true);
  }, [updateModal]);

  const handleConfirmToggleOff = useCallback((settingKey) => {
    updateModal(`${settingKey}ConfirmOff`, false);
    updateModal(`${settingKey}2FAOff`, true);
  }, [updateModal]);

  const handleCancelToggle = useCallback((settingKey, action) => {
    const modalKey = `${settingKey}Confirm${action}`;
    updateModal(modalKey, false);
  }, [updateModal]);

  // ==============================
  // 2FA HANDLERS
  // ==============================
  
  const handle2FASubmit = useCallback((settingKey, action, data) => {
    if (data?.verificationCode && data?.emailPassword && data?.defaultPassword) {
      updateModal(`${settingKey}2FA${action}`, false);
      updateModal(`${settingKey}Success${action}`, true);
    } else {
      alert('Please fill in all fields');
    }
  }, [updateModal]);

  const handleCancel2FA = useCallback((settingKey, action) => {
    updateModal(`${settingKey}2FA${action}`, false);
  }, [updateModal]);

  // ==============================
  // MEMOIZED VALUES
  // ==============================
  
  const huggingFaceAPIEnabled = useMemo(() => settings.huggingFaceAPI, [settings.huggingFaceAPI]);
  
  const modalKeys = useMemo(() => ({
    confirmOn: 'huggingFaceAPIConfirmOn',
    confirmOff: 'huggingFaceAPIConfirmOff',
    twoFactorOn: 'huggingFaceAPI2FAOn',
    twoFactorOff: 'huggingFaceAPI2FAOff',
    successOn: 'huggingFaceAPISuccessOn',
    successOff: 'huggingFaceAPISuccessOff',
    finalSuccessOn: 'huggingFaceAPIFinalSuccessOn',
    finalSuccessOff: 'huggingFaceAPIFinalSuccessOff'
  }), []);

  // ==============================
  // SUCCESS MODAL HANDLERS  
  // ==============================
  
  const handleSuccessModalDone = useCallback((settingKey, action) => {
    updateModal(`${settingKey}Success${action}`, false);
    updateModal(`${settingKey}FinalSuccess${action}`, true);
  }, [updateModal]);

  const handleFinalSuccessModalDone = useCallback((settingKey, action) => {
    updateModal(`${settingKey}FinalSuccess${action}`, false);
    setSettings(prev => ({ 
      ...prev, 
      [settingKey]: action === 'On' 
    }));
  }, [updateModal]);

  const handleCloseSuccessModal = useCallback((settingKey, action) => {
    updateModal(`${settingKey}Success${action}`, false);
    setSettings(prev => ({ 
      ...prev, 
      [settingKey]: action === 'On' 
    }));
  }, [updateModal]);

  const handleCloseFinalSuccessModal = useCallback((settingKey, action) => {
    updateModal(`${settingKey}FinalSuccess${action}`, false);
    setSettings(prev => ({ 
      ...prev, 
      [settingKey]: action === 'On' 
    }));
  }, [updateModal]);

  // ==============================
  // REUSABLE COMPONENTS
  // ==============================
  
  const CloseButton = useCallback(({ onClick }) => (
    <button 
      onClick={onClick}
      className="absolute right-[33px] top-[33px] w-6 h-6 text-gray-500 hover:text-gray-700"
    >
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  ), []);

  const ConfirmationButtons = useCallback(({ onConfirm, onCancel }) => (
    <div className="absolute top-[189px] left-1/2 transform -translate-x-1/2 flex gap-4">
      <button
        onClick={onConfirm}
        className="bg-black text-white rounded-3xl w-[149px] h-12 font-semibold text-[16px] leading-[22px] font-['Montserrat'] hover:bg-gray-800 transition-colors"
      >
        yes
      </button>
      <button
        onClick={onCancel}
        className="border border-[#e4e4e4] text-black rounded-[100px] w-[209px] h-16 font-medium text-[16px] leading-[19.2px] font-['Montserrat'] hover:bg-gray-50 transition-colors flex items-center justify-center"
      >
        Cancel
      </button>
    </div>
  ), []);

  const SuccessIcon = useCallback(({ isOn }) => (
    <div className={`w-16 h-16 ${isOn ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
      <svg className={`w-8 h-8 ${isOn ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOn ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
      </svg>
    </div>
  ), []);

  const ToggleSwitch = useCallback(({ enabled, label, settingKey }) => (
    <div className="flex items-center justify-between py-4">
      <span className="font-bold text-[#010101] text-[20px] font-montserrat">{label}</span>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleToggleSetting(settingKey, 'on')}
          className={`px-4 py-2 rounded-full text-[16px] font-medium transition-colors min-w-[69px] ${
            enabled 
              ? 'bg-[#ff4444] text-white border border-[#ff4444]' 
              : 'bg-transparent text-black border border-[#e4e4e4]'
          }`}
        >
          On
        </button>
        <button
          onClick={() => handleToggleSetting(settingKey, 'off')}
          className={`px-4 py-2 rounded-full text-[16px] font-medium transition-colors min-w-[76px] ${
            !enabled 
              ? 'bg-[#ff4444] text-white border border-[#ff4444]' 
              : 'bg-transparent text-black border border-[#e4e4e4]'
          }`}
        >
          Off
        </button>
      </div>
    </div>
  ), [handleToggleSetting]);

  // ==============================
  // MODAL RENDERING FUNCTION
  // ==============================
  
  const ConfirmationModal = useCallback(({ isOpen, action, settingKey, displayName, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] relative w-full max-w-md mx-4 overflow-clip">
          <CloseButton onClick={onCancel} />
          <div className="absolute top-[60px] left-1/2 transform -translate-x-1/2 w-[165px] text-center">
            <p className="font-bold text-black text-[18px] leading-[22px] tracking-[-0.41px] font-['Montserrat']">
              Are you sure you want to turn {displayName} {action.toLowerCase()}
            </p>
          </div>
          <ConfirmationButtons onConfirm={onConfirm} onCancel={onCancel} />
          <div className="h-[280px]"></div>
        </div>
      </div>
    );
  }, [CloseButton, ConfirmationButtons]);

  const SuccessModal = useCallback(({ isOpen, action, displayName, onDone, onClose, isFinal = false }) => {
    if (!isOpen) return null;
    
    const isOn = action === 'On';
    const title = isFinal ? 'Configuration Complete' : `${displayName} Turned ${action}`;
    const message = isFinal 
      ? (isOn ? `${displayName} is now active and configured.` : `${displayName} has been successfully disabled.`)
      : (isOn ? 'The setting has been successfully activated.' : 'The setting has been successfully deactivated.');
    const buttonText = isFinal ? 'Finish' : 'Done';
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] relative w-full max-w-md mx-4 overflow-clip">
          <CloseButton onClick={onClose} />
          <div className="p-8 text-center">
            <div className="mb-6">
              <SuccessIcon isOn={isOn} />
              <h3 className="font-bold text-black text-[18px] mb-2">{title}</h3>
              <p className="text-gray-600">{message}</p>
            </div>
            <button
              onClick={onDone}
              className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    );
  }, [CloseButton, SuccessIcon]);
  
  const renderModalsForSetting = useCallback((settingKey, displayName) => {
    const {
      confirmOn,
      confirmOff,
      twoFactorOn,
      twoFactorOff,
      successOn,
      successOff,
      finalSuccessOn,
      finalSuccessOff
    } = modalKeys;

    return (
      <>
        {/* Confirmation Modal - On */}
        <ConfirmationModal
          isOpen={modals[confirmOn]}
          action="On"
          settingKey={settingKey}
          displayName={displayName}
          onConfirm={() => handleConfirmToggleOn(settingKey)}
          onCancel={() => handleCancelToggle(settingKey, 'On')}
        />

        {/* Confirmation Modal - Off */}
        <ConfirmationModal
          isOpen={modals[confirmOff]}
          action="Off"
          settingKey={settingKey}
          displayName={displayName}
          onConfirm={() => handleConfirmToggleOff(settingKey)}
          onCancel={() => handleCancelToggle(settingKey, 'Off')}
        />

        {/* 2FA Modal - On */}
        {modals[twoFactorOn] && (
          <TwoFactorAuth
            onSubmit={(data) => handle2FASubmit(settingKey, 'On', data)}
            onClose={() => handleCancel2FA(settingKey, 'On')}
            phoneNumber="+1 (555) 123-4567"
            emailAddress="api@huggingface.com"
          />
        )}

        {/* 2FA Modal - Off */}
        {modals[twoFactorOff] && (
          <TwoFactorAuth
            onSubmit={(data) => handle2FASubmit(settingKey, 'Off', data)}
            onClose={() => handleCancel2FA(settingKey, 'Off')}
            phoneNumber="+1 (555) 123-4567"
            emailAddress="api@huggingface.com"
          />
        )}

        {/* Success Modal - On */}
        <SuccessModal
          isOpen={modals[successOn]}
          action="On"
          displayName={displayName}
          onDone={() => handleSuccessModalDone(settingKey, 'On')}
          onClose={() => handleCloseSuccessModal(settingKey, 'On')}
        />

        {/* Success Modal - Off */}
        <SuccessModal
          isOpen={modals[successOff]}
          action="Off"
          displayName={displayName}
          onDone={() => handleSuccessModalDone(settingKey, 'Off')}
          onClose={() => handleCloseSuccessModal(settingKey, 'Off')}
        />

        {/* Final Success Modal - On */}
        <SuccessModal
          isOpen={modals[finalSuccessOn]}
          action="On"
          displayName={displayName}
          onDone={() => handleFinalSuccessModalDone(settingKey, 'On')}
          onClose={() => handleCloseFinalSuccessModal(settingKey, 'On')}
          isFinal={true}
        />

        {/* Final Success Modal - Off */}
        <SuccessModal
          isOpen={modals[finalSuccessOff]}
          action="Off"
          displayName={displayName}
          onDone={() => handleFinalSuccessModalDone(settingKey, 'Off')}
          onClose={() => handleCloseFinalSuccessModal(settingKey, 'Off')}
          isFinal={true}
        />
      </>
    );
  }, [modals, modalKeys, ConfirmationModal, SuccessModal, handle2FASubmit, handleCancel2FA, handleCancelToggle, handleConfirmToggleOn, handleConfirmToggleOff, handleSuccessModalDone, handleFinalSuccessModalDone, handleCloseSuccessModal, handleCloseFinalSuccessModal]);

  // ==============================
  // MAIN RENDER
  // ==============================
  
  return (
    <div className="max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Hugging Face API Control</h1>
        <p className="text-gray-600">Manage your Hugging Face API settings with secure 2FA verification</p>
      </div>

      {/* Main Toggle Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ToggleSwitch 
          enabled={huggingFaceAPIEnabled}
          label="Hugging Face API Open/Close"
          settingKey="huggingFaceAPI"
        />
        
        {/* Status Indicator */}
        <div className="mt-4 p-4 rounded-lg bg-gray-50">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${huggingFaceAPIEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              API Status: {huggingFaceAPIEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {renderModalsForSetting('huggingFaceAPI', 'Hugging Face API')}
    </div>
  );
};

export default HuggingFaceAPIControl;
