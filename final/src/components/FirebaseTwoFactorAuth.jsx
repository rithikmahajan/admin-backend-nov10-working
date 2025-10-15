import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { ADMIN_CONFIG } from '../config/firebase';

const FirebaseTwoFactorAuth = ({ 
  onSubmit, 
  onClose,
  phoneNumber = ADMIN_CONFIG.adminPhone,
  emailAddress = ADMIN_CONFIG.adminEmail
}) => {
  // State management
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [emailPassword, setEmailPassword] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showDefaultPassword, setShowDefaultPassword] = useState(false);
  
  // Firebase specific states
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [smsVerificationSent, setSmsVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Initialize Firebase Auth Service
  useEffect(() => {
    firebaseAuthService.initRecaptcha('recaptcha-container');
    
    return () => {
      firebaseAuthService.cleanup();
    };
  }, []);

  // Send SMS OTP
  const sendSMSOTP = async () => {
    setLoading(true);
    try {
      const result = await firebaseAuthService.sendSMSOTP(phoneNumber);
      
      if (result.success) {
        setSmsVerificationSent(true);
        if (result.isDevelopment) {
          setStatus({ 
            type: 'info', 
            message: result.testPhone ? 
              `Firebase test SMS sent to ${result.testPhone}. Use test code: ${result.testCode}` :
              `${result.message}. For testing, use code: ${result.testCode}` 
          });
        } else {
          setStatus({ type: 'success', message: result.message });
        }
      } else {
        setStatus({ 
          type: 'error', 
          message: `SMS Error: ${result.message}${result.details ? ` (${result.details})` : ''}` 
        });
      }
    } catch (error) {
      console.error('❌ SMS Error:', error);
      setStatus({ type: 'error', message: error.message });
    }
    setLoading(false);
  };

  // Send Email Verification
  const sendEmailOTP = async () => {
    setLoading(true);
    try {
      const result = await firebaseAuthService.sendEmailVerification(emailAddress);
      
      if (result.success) {
        setEmailVerificationSent(true);
        setStatus({ type: 'success', message: result.message });
      } else {
        setStatus({ type: 'error', message: result.message });
      }
    } catch (error) {
      console.error('❌ Email Error:', error);
      setStatus({ type: 'error', message: error.message });
    }
    setLoading(false);
  };

  // Auto-send OTPs when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!smsVerificationSent && !loading) {
        sendSMSOTP();
      }
      if (!emailVerificationSent && !loading) {
        sendEmailOTP();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Handle verification code input
  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      // Auto focus next input
      if (value && index < 5) {
        const nextInput = document.querySelector(`input[name="code-${index + 1}"]`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.querySelector(`input[name="code-${index - 1}"]`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    const smsCode = verificationCode.join('');
    
    if (!smsCode || smsCode.length !== 6) {
      setStatus({ type: 'error', message: 'Please enter the 6-digit SMS code' });
      return;
    }

    if (!emailPassword) {
      setStatus({ type: 'error', message: 'Please enter email password' });
      return;
    }

    if (!defaultPassword) {
      setStatus({ type: 'error', message: 'Please enter default password' });
      return;
    }

    setLoading(true);
    
    try {
      const result = await firebaseAuthService.completeVerification(
        smsCode, 
        emailPassword, 
        defaultPassword
      );

      if (result.success) {
        const isDevMode = result.isDevelopment || window.location.hostname === 'localhost';
        setStatus({ 
          type: 'success', 
          message: `Verification successful!${isDevMode ? ' (Development mode)' : ''}` 
        });
        setTimeout(() => {
          onSubmit && onSubmit({
            verified: true,
            method: 'firebase',
            timestamp: new Date().toISOString(),
            user: result.user || result.testUser,
            isDevelopment: isDevMode
          });
        }, 1000);
      } else {
        setStatus({ type: 'error', message: result.message });
      }
    } catch (error) {
      console.error('❌ Verification Error:', error);
      setStatus({ type: 'error', message: error.message });
    }
    
    setLoading(false);
  };  const isFormValid = () => {
    return verificationCode.every(digit => digit !== '') && 
           emailPassword.trim() !== '' && 
           defaultPassword.trim() !== '' &&
           smsVerificationSent;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-md mx-auto relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
        >
          <X size={16} />
        </button>

        <div className="p-8 pt-12">
          {/* Status Message */}
          {status.message && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span className="text-sm">{status.message}</span>
            </div>
          )}

          {/* Main Title */}
          <div className="text-center mb-8">
            <h1 className="font-montserrat font-bold text-[32px] text-black tracking-[-0.41px] leading-[22px] mb-4">
              Two Factor Verification
            </h1>
            <p className="text-sm text-gray-600">Firebase Real-time Authentication</p>
          </div>

          {/* SMS Verification Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-montserrat font-bold text-[20px] text-black">
                SMS Verification
              </h2>
              {smsVerificationSent ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <button 
                  onClick={sendSMSOTP}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
            
            <p className="font-montserrat font-bold text-[14px] text-black leading-[24px] mb-6">
              SMS sent to +91{phoneNumber}
            </p>

            {/* Verification Code Circles */}
            <div className="flex justify-center gap-3 mb-8">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  name={`code-${index}`}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-10 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:border-black focus:outline-none transition-colors"
                  maxLength={1}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email Verification Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-montserrat font-bold text-[14px] text-black">
                  Email: {emailAddress}
                </p>
                {emailVerificationSent ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <button 
                    type="button"
                    onClick={sendEmailOTP}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  </button>
                )}
              </div>
              
              <div className="relative">
                <input
                  type={showEmailPassword ? "text" : "password"}
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Email Password (R@2727thik)"
                  disabled={loading}
                  className="w-full h-[50px] border-0 border-b-2 border-gray-300 bg-transparent px-0 pb-2 pt-4 text-[16px] text-black placeholder-[#bdbcbc] focus:border-black focus:outline-none transition-colors font-['Mulish'] tracking-[0.32px] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowEmailPassword(!showEmailPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showEmailPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            {/* Default Password Section */}
            <div className="mb-8">
              <p className="font-montserrat font-bold text-[14px] text-black leading-[24px] mb-4">
                Default Password
              </p>
              
              <div className="relative">
                <input
                  type={showDefaultPassword ? "text" : "password"}
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                  placeholder="Default Password (R@2727thik)"
                  disabled={loading}
                  className="w-full h-[50px] border-0 border-b-2 border-gray-300 bg-transparent px-0 pb-2 pt-4 text-[16px] text-black placeholder-[#bdbcbc] focus:border-black focus:outline-none transition-colors font-['Mulish'] tracking-[0.32px] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowDefaultPassword(!showDefaultPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showDefaultPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className={`w-full h-[51px] rounded-[26.5px] text-white font-montserrat font-bold text-[16px] uppercase leading-[24px] transition-all duration-200 flex items-center justify-center gap-2 ${
                isFormValid() && !loading
                  ? 'bg-black hover:bg-gray-800 cursor-pointer' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {loading && <RefreshCw size={16} className="animate-spin" />}
              {loading ? 'Verifying...' : 'Submit'}
            </button>
          </form>

          {/* Hidden reCAPTCHA container */}
          <div id="recaptcha-container"></div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseTwoFactorAuth;
