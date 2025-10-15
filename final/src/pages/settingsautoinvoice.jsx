import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TwoFactorAuth from '../components/TwoFactorAuth';
import FirebaseTwoFactorAuth from '../components/FirebaseTwoFactorAuth';
import {
  fetchSettingCategory,
  updateSettingCategory,
  toggleSetting,
  selectSettingCategory,
  selectCategoryLoading,
  selectCategoryError,
  clearError
} from '../store/slices/settingsSlice';

/**
 * Auto Invoice Mailing Component
 * 
 * Features:
 * - Toggle auto invoice mailing setting with 2FA verification
 * - Modal dialogs for confirmation and success states
 * - Secure authentication flow with OTP and password verification
 * 
 * Performance optimizations:
 * - useCallback for all event handlers
 * - useMemo for expensive calculations and CSS classes
 * - Organized state management
 * - Efficient modal state handling
 * - Extracted constants and reusable components
 */

// Constants moved outside component to prevent recreation
const PHONE_NUMBER = "+1 (555) 123-4567";
const EMAIL_ADDRESS = "invoice@automail.com";

const MODAL_CLASSES = {
  backdrop: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
  container: "bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] relative w-full max-w-md mx-4 overflow-clip",
  closeButton: "absolute right-[33px] top-[33px] w-6 h-6 text-gray-500 hover:text-gray-700",
  title: "absolute top-[60px] left-1/2 transform -translate-x-1/2 w-[165px] text-center",
  titleText: "font-bold text-black text-[18px] leading-[22px] tracking-[-0.41px] font-['Montserrat']",
  buttonContainer: "absolute top-[189px] left-1/2 transform -translate-x-1/2 flex gap-4",
  confirmButton: "bg-black text-white rounded-3xl w-[149px] h-12 font-semibold text-[16px] leading-[22px] font-['Montserrat'] hover:bg-gray-800 transition-colors",
  cancelButton: "border border-[#e4e4e4] text-black rounded-[100px] w-[209px] h-16 font-medium text-[16px] leading-[19.2px] font-['Montserrat'] hover:bg-gray-50 transition-colors flex items-center justify-center",
  spacer: "h-[280px]"
};

const SUCCESS_MODAL_CLASSES = {
  content: "p-8 text-center",
  iconContainer: "mb-6",
  icon: "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
  iconSvg: "w-8 h-8",
  title: "font-bold text-black text-[18px] mb-2",
  subtitle: "text-gray-600",
  button: "bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
};

const GetAutoInvoiceMailing = () => {
  // ==============================
  // REDUX STATE MANAGEMENT
  // ==============================
  const dispatch = useDispatch();
  
  // Redux selectors
  const autoInvoiceSettings = useSelector(selectSettingCategory('autoInvoice'));
  const loading = useSelector(selectCategoryLoading('autoInvoice'));
  const error = useSelector(selectCategoryError('autoInvoice'));
  
  // Local state for UI
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Auto invoicing state derived from Redux
  const [autoInvoicing, setAutoInvoicing] = useState(false);

  // Modal states for auto invoicing
  const [modals, setModals] = useState({
    autoInvoicingConfirmOn: false,
    autoInvoicingConfirmOff: false,
    autoInvoicing2FAOn: false,
    autoInvoicing2FAOff: false,
    autoInvoicingSuccessOn: false,
    autoInvoicingSuccessOff: false,
    autoInvoicingFinalSuccessOn: false,
    autoInvoicingFinalSuccessOff: false,
  });

  // ==============================
  // EFFECTS
  // ==============================
  
  // Fetch settings on component mount
  useEffect(() => {
    dispatch(fetchSettingCategory('autoInvoice'));
  }, [dispatch]);

  // Sync Redux state with local state
  useEffect(() => {
    if (autoInvoiceSettings?.enabled !== undefined) {
      setAutoInvoicing(autoInvoiceSettings.enabled);
    }
  }, [autoInvoiceSettings]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError('autoInvoice'));
      }
    };
  }, [dispatch, error]);

  // ==============================
  // UTILITY FUNCTIONS
  // ==============================
  
  // Update modal state utility
  const updateModal = useCallback((modalKey, value) => {
    setModals(prev => ({ ...prev, [modalKey]: value }));
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
    // Data contains: { code: string, emailPassword: string, defaultPassword: string }
    console.log('2FA submitted with data:', data);
    updateModal(`${settingKey}2FA${action}`, false);
    updateModal(`${settingKey}Success${action}`, true);
  }, [updateModal]);

  const handleCancel2FA = useCallback((settingKey, action) => {
    updateModal(`${settingKey}2FA${action}`, false);
  }, [updateModal]);

  // ==============================
  // SUCCESS MODAL HANDLERS  
  // ==============================
  
  const handleSuccessModalDone = useCallback((settingKey, action) => {
    updateModal(`${settingKey}Success${action}`, false);
    updateModal(`${settingKey}FinalSuccess${action}`, true);
  }, [updateModal]);

  const handleFinalSuccessModalDone = useCallback((settingKey, action) => {
    updateModal(`${settingKey}FinalSuccess${action}`, false);
    setAutoInvoicing(action === 'On');
  }, [updateModal]);

  const handleCloseSuccessModal = useCallback((settingKey, action) => {
    updateModal(`${settingKey}Success${action}`, false);
    setAutoInvoicing(action === 'On');
  }, [updateModal]);

  const handleCloseFinalSuccessModal = useCallback((settingKey, action) => {
    updateModal(`${settingKey}FinalSuccess${action}`, false);
    setAutoInvoicing(action === 'On');
  }, [updateModal]);

  // ==============================
  // COMPONENT DEFINITIONS
  // ==============================
  
  // Memoized close button component
  const CloseButton = useMemo(() => ({ onClick }) => (
    <button onClick={onClick} className={MODAL_CLASSES.closeButton}>
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  ), []);

  // Memoized confirmation modal component
  const ConfirmationModal = useMemo(() => ({ 
    isOpen, 
    displayName, 
    action, 
    onConfirm, 
    onCancel 
  }) => {
    if (!isOpen) return null;
    
    return (
      <div className={MODAL_CLASSES.backdrop}>
        <div className={MODAL_CLASSES.container}>
          <CloseButton onClick={onCancel} />
          <div className={MODAL_CLASSES.title}>
            <p className={MODAL_CLASSES.titleText}>
              Are you sure you want to turn {displayName} {action.toLowerCase()}
            </p>
          </div>
          <div className={MODAL_CLASSES.buttonContainer}>
            <button onClick={onConfirm} className={MODAL_CLASSES.confirmButton}>
              yes
            </button>
            <button onClick={onCancel} className={MODAL_CLASSES.cancelButton}>
              Cancel
            </button>
          </div>
          <div className={MODAL_CLASSES.spacer}></div>
        </div>
      </div>
    );
  }, [CloseButton]);

  // Memoized success modal component
  const SuccessModal = useMemo(() => ({ 
    isOpen, 
    displayName, 
    action, 
    onDone, 
    onClose,
    isFinal = false 
  }) => {
    if (!isOpen) return null;
    
    const isOn = action === 'On';
    const iconBgClass = isOn ? 'bg-green-100' : 'bg-red-100';
    const iconColorClass = isOn ? 'text-green-600' : 'text-red-600';
    const title = isFinal ? 'Configuration Complete' : `${displayName} Turned ${action}`;
    const subtitle = isFinal 
      ? (isOn ? `${displayName} is now active and configured.` : `${displayName} has been successfully disabled.`)
      : (isOn ? 'The setting has been successfully activated.' : 'The setting has been successfully deactivated.');
    const buttonText = isFinal ? 'Finish' : 'Done';
    
    return (
      <div className={MODAL_CLASSES.backdrop}>
        <div className={MODAL_CLASSES.container}>
          <CloseButton onClick={onClose} />
          <div className={SUCCESS_MODAL_CLASSES.content}>
            <div className={SUCCESS_MODAL_CLASSES.iconContainer}>
              <div className={`${SUCCESS_MODAL_CLASSES.icon} ${iconBgClass}`}>
                <svg className={`${SUCCESS_MODAL_CLASSES.iconSvg} ${iconColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isOn ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </div>
              <h3 className={SUCCESS_MODAL_CLASSES.title}>{title}</h3>
              <p className={SUCCESS_MODAL_CLASSES.subtitle}>{subtitle}</p>
            </div>
            <button onClick={onDone} className={SUCCESS_MODAL_CLASSES.button}>
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    );
  }, [CloseButton]);

  // Memoized toggle button classes
  const getToggleButtonClasses = useMemo(() => (enabled, isOnButton) => {
    const baseClasses = "px-4 py-2 rounded-full text-[16px] font-medium transition-colors";
    const widthClass = isOnButton ? "min-w-[69px]" : "min-w-[76px]";
    const isActive = isOnButton ? enabled : !enabled;
    const activeClasses = "bg-blue-600 text-white";
    const inactiveClasses = "bg-gray-200 text-black";
    
    return `${baseClasses} ${widthClass} ${isActive ? activeClasses : inactiveClasses}`;
  }, []);

  const ToggleSwitch = useCallback(({ enabled, label, settingKey }) => (
    <div className="flex items-center justify-between py-4">
      <span className="font-bold text-black text-lg font-montserrat">{label}</span>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleToggleSetting(settingKey, 'on')}
          className={getToggleButtonClasses(enabled, true)}
        >
          On
        </button>
        <button
          onClick={() => handleToggleSetting(settingKey, 'off')}
          className={getToggleButtonClasses(enabled, false)}
        >
          Off
        </button>
      </div>
    </div>
  ), [handleToggleSetting, getToggleButtonClasses]);

  // Optimized modal rendering with memoized components
  const renderModals = useMemo(() => {
    const settingKey = 'autoInvoicing';
    const displayName = 'Auto Invoice Mailing';
    
    return (
      <>
        {/* Confirmation Modals */}
        <ConfirmationModal
          isOpen={modals.autoInvoicingConfirmOn}
          displayName={displayName}
          action="On"
          onConfirm={() => handleConfirmToggleOn(settingKey)}
          onCancel={() => handleCancelToggle(settingKey, 'On')}
        />
        
        <ConfirmationModal
          isOpen={modals.autoInvoicingConfirmOff}
          displayName={displayName}
          action="Off"
          onConfirm={() => handleConfirmToggleOff(settingKey)}
          onCancel={() => handleCancelToggle(settingKey, 'Off')}
        />

        {/* 2FA Modals - Firebase Enabled */}
        {modals.autoInvoicing2FAOn && (
          <FirebaseTwoFactorAuth
            onSubmit={(data) => handle2FASubmit(settingKey, 'On', data)}
            onClose={() => handleCancel2FA(settingKey, 'On')}
            phoneNumber="7006114695"
            emailAddress="rithikmahajan27@gmail.com"
          />
        )}

        {modals.autoInvoicing2FAOff && (
          <FirebaseTwoFactorAuth
            onSubmit={(data) => handle2FASubmit(settingKey, 'Off', data)}
            onClose={() => handleCancel2FA(settingKey, 'Off')}
            phoneNumber="7006114695"
            emailAddress="rithikmahajan27@gmail.com"
          />
        )}

        {/* Success Modals */}
        <SuccessModal
          isOpen={modals.autoInvoicingSuccessOn}
          displayName={displayName}
          action="On"
          onDone={() => handleSuccessModalDone(settingKey, 'On')}
          onClose={() => handleCloseSuccessModal(settingKey, 'On')}
        />

        <SuccessModal
          isOpen={modals.autoInvoicingSuccessOff}
          displayName={displayName}
          action="Off"
          onDone={() => handleSuccessModalDone(settingKey, 'Off')}
          onClose={() => handleCloseSuccessModal(settingKey, 'Off')}
        />

        {/* Final Success Modals */}
        <SuccessModal
          isOpen={modals.autoInvoicingFinalSuccessOn}
          displayName={displayName}
          action="On"
          onDone={() => handleFinalSuccessModalDone(settingKey, 'On')}
          onClose={() => handleCloseFinalSuccessModal(settingKey, 'On')}
          isFinal={true}
        />

        <SuccessModal
          isOpen={modals.autoInvoicingFinalSuccessOff}
          displayName={displayName}
          action="Off"
          onDone={() => handleFinalSuccessModalDone(settingKey, 'Off')}
          onClose={() => handleCloseFinalSuccessModal(settingKey, 'Off')}
          isFinal={true}
        />
      </>
    );
  }, [
    modals,
    ConfirmationModal,
    SuccessModal,
    handleConfirmToggleOn,
    handleConfirmToggleOff,
    handleCancelToggle,
    handle2FASubmit,
    handleCancel2FA,
    handleSuccessModalDone,
    handleCloseSuccessModal,
    handleFinalSuccessModalDone,
    handleCloseFinalSuccessModal
  ]);

  // ==============================
  // MAIN RENDER
  // ==============================
  
  return (
    <div className="bg-white min-h-screen p-8">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black font-montserrat">Auto Invoice Mailing</h1>
          <p className="text-gray-600 mt-2">
            Configure automatic invoice mailing settings for your business operations.
          </p>
        </div>

        {/* Auto Invoice Mailing Toggle */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <ToggleSwitch 
            enabled={autoInvoicing}
            label="get auto invoice mailing"
            settingKey="autoInvoicing"
          />
          <p className="text-sm text-gray-600 mt-2">
            When enabled, invoices will be automatically generated and sent to customers via email after order completion.
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-[18px] text-[#010101] mb-4">Current Status</h3>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${autoInvoicing ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-[16px] font-medium">
              Auto invoice mailing is {autoInvoicing ? 'enabled' : 'disabled'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {autoInvoicing 
              ? 'Invoices are automatically generated and sent to customers after successful orders.'
              : 'Automatic invoice mailing is currently disabled. Invoices must be sent manually.'
            }
          </p>
        </div>

        {/* Configuration Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-[18px] text-[#010101] mb-4">Configuration Details</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-[14px] text-gray-700 mb-1">Trigger Event</h4>
                <p className="text-[14px] text-gray-600">Order Completion</p>
              </div>
              <div>
                <h4 className="font-semibold text-[14px] text-gray-700 mb-1">Delivery Method</h4>
                <p className="text-[14px] text-gray-600">Email</p>
              </div>
              <div>
                <h4 className="font-semibold text-[14px] text-gray-700 mb-1">Template Format</h4>
                <p className="text-[14px] text-gray-600">PDF Invoice</p>
              </div>
              <div>
                <h4 className="font-semibold text-[14px] text-gray-700 mb-1">Processing Time</h4>
                <p className="text-[14px] text-gray-600">Immediate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h4 className="font-bold text-[16px] text-blue-800 mb-4">Auto Invoice Mailing Features</h4>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Automatic invoice generation upon order completion</span>
            </li>
            <li className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Professional PDF invoice templates</span>
            </li>
            <li className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Email delivery to customer's registered email</span>
            </li>
            <li className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Delivery confirmation tracking</span>
            </li>
            <li className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Integration with tax calculation systems</span>
            </li>
          </ul>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="font-bold text-[16px] text-yellow-800 mb-2">Security Notice</h4>
          <p className="text-sm text-yellow-700">
            Changes to auto invoice mailing settings require 2-factor authentication for security purposes. 
            This ensures that only authorized personnel can modify automated billing processes.
          </p>
        </div>

        {/* Render Modals */}
        {renderModals}
      </div>
    </div>
  );
};

export default React.memo(GetAutoInvoiceMailing);
