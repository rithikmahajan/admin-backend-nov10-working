import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Phone,
  MessageSquare,
  ArrowLeft,
  Shield,
  Timer,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  loginUser, 
  clearError, 
  restoreAuthFromStorage,
  generateOTP,
  loginWithOTP,
  verifyFirebaseOTP,
  resendOTP 
} from "../store/slices/authSlice";
import FirebaseAuthService from "../services/firebaseAuthService";

const AuthFlow = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    isLoading: authLoading, 
    isAuthenticated, 
    user, 
    error: authError,
    otpSent 
  } = useSelector(state => state.auth);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('phone'); // 'phone', 'password', 'otp'
  const [authMode, setAuthMode] = useState('otp'); // 'password' or 'otp'
  
  // Form data
  const [phoneNumber, setPhoneNumber] = useState(""); // Shared for validation logic
  const [otpPhoneNumber, setOtpPhoneNumber] = useState(""); // Firebase OTP form
  const [passwordPhoneNumber, setPasswordPhoneNumber] = useState(""); // Password form
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  // OTP specific state
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [otpExpiredMessage, setOtpExpiredMessage] = useState("");
  const [localOtpSent, setLocalOtpSent] = useState(false); // Local OTP state management
  
  // Firebase service instance
  const [firebaseService] = useState(() => new FirebaseAuthService());
  const [firebaseVerificationId, setFirebaseVerificationId] = useState(null);
  const [isFirebaseOTP, setIsFirebaseOTP] = useState(false);

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && user && user.isAdmin === true) {
      setSuccessPopup(true);
      const timeoutId = setTimeout(() => {
        navigate('/admin-dashboard');
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, user?.isAdmin, navigate]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      setErrors(prev => ({ ...prev, general: authError }));
    }
  }, [authError]);

  // OTP timer effect
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            setOtpExpiredMessage("OTP has expired. Please request a new one.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Debug current step changes with stable logging
  useEffect(() => {
    // Only log significant state changes
    if (currentStep === 'otp' && localOtpSent) {
      console.log('🔄 OTP step activated');
    }
  }, [currentStep, localOtpSent]);

  // Validation functions
  const isValidPhone = (phone) => /^\d{10}$/.test(phone);
  
  const validatePhoneStep = () => {
    if (!phoneNumber) {
      setErrors({ phone: "Phone number is required" });
      return false;
    }
    if (!isValidPhone(phoneNumber)) {
      setErrors({ phone: "Please enter a valid 10-digit phone number" });
      return false;
    }
    return true;
  };

  // Handle phone number submission
  const handlePhoneSubmit = async () => {
    console.log('=== PHONE SUBMISSION ===');
    
    if (!validatePhoneStep()) {
      return;
    }

    setErrors({});
    dispatch(clearError());

    if (authMode === 'otp') {
      // Use Firebase for real SMS OTP
      try {
        console.log('🔥 Sending Firebase SMS OTP for:', phoneNumber);
        setIsLoading(true);
        
        const result = await firebaseService.sendSMSOTP(phoneNumber);
        
        if (result.success) {
          console.log('✅ Firebase OTP sent successfully:', result);
          
          // Update local state to show OTP input
          setCurrentStep('otp');
          setLocalOtpSent(true); // Set local OTP sent state
          setOtpTimer(300); // 5 minutes timer
          setCanResendOtp(false);
          setOtpExpiredMessage("");
          setIsFirebaseOTP(true);
          setFirebaseVerificationId(result.verificationId);
          
          // Clear any previous errors
          setErrors({});
          
          // Show different message for development vs production
          if (result.isDevelopment && result.testCode) {
            setErrors({ 
              info: `Development Mode: Use test code ${result.testCode} (SMS not actually sent)` 
            });
          } else {
            // Show success message for production
            setErrors({ 
              success: `OTP sent successfully to +91${phoneNumber}. Please check your messages.` 
            });
          }
        } else {
          console.log('❌ Firebase OTP failed:', result);
          setErrors({ general: result.message || 'Failed to send OTP via SMS. Please try again.' });
        }
      } catch (error) {
        console.error('❌ Firebase OTP error:', error);
        setErrors({ general: 'Unable to send SMS OTP. Please check your connection.' });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Switch to password mode
      setCurrentStep('password');
    }
  };

  // Handle OTP verification
  const handleOtpVerification = async () => {
    console.log('=== OTP VERIFICATION ===');
    
    if (!otp || otp.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit OTP" });
      return;
    }

    setErrors({});
    dispatch(clearError());
    setIsLoading(true);

    try {
      if (isFirebaseOTP) {
        // Verify Firebase OTP first
        console.log('🔥 Verifying Firebase OTP:', otp);
        const firebaseResult = await firebaseService.verifySMSOTP(otp);
        
        if (firebaseResult.success) {
          console.log('✅ Firebase OTP verified:', firebaseResult);
          
          // Now authenticate with our backend using Firebase token or phone verification
          if (firebaseResult.user && firebaseResult.user.uid) {
            // Get Firebase ID token for backend verification
            const idToken = await firebaseResult.user.getIdToken();
            
            // Send to backend for Firebase admin verification
            const result = await dispatch(verifyFirebaseOTP({ 
              idToken: idToken,
              phoneNumber: phoneNumber
            }));
            
            if (verifyFirebaseOTP.fulfilled.match(result)) {
              console.log('✅ Backend Firebase verification successful:', result.payload);
              
              // Check admin privileges
              if (result.payload.user && result.payload.user.isAdmin === true) {
                console.log('✅ Admin privileges confirmed');
                setSuccessPopup(true);
                setTimeout(() => {
                  navigate('/admin-dashboard');
                }, 1500);
              } else {
                setErrors({ 
                  general: 'Access denied. This account does not have admin privileges.' 
                });
              }
            } else {
              console.log('❌ Backend Firebase verification failed:', result.payload);
              setErrors({ otp: result.payload || 'Authentication failed. Please try again.' });
            }
          } else if (firebaseResult.isDevelopment) {
            // Development mode - proceed with backend OTP verification
            const result = await dispatch(loginWithOTP({ phoneNumber, otp }));
            
            if (loginWithOTP.fulfilled.match(result)) {
              console.log('✅ Development OTP verification successful:', result.payload);
              
              if (result.payload.user && result.payload.user.isAdmin === true) {
                console.log('✅ Admin privileges confirmed');
                setSuccessPopup(true);
                setTimeout(() => {
                  navigate('/admin-dashboard');
                }, 1500);
              } else {
                setErrors({ 
                  general: 'Access denied. This account does not have admin privileges.' 
                });
              }
            } else {
              setErrors({ otp: result.payload || 'Invalid OTP. Please try again.' });
            }
          }
        } else {
          console.log('❌ Firebase OTP verification failed:', firebaseResult);
          setErrors({ otp: firebaseResult.message || 'Invalid OTP. Please try again.' });
        }
      } else {
        // Fallback to backend OTP verification
        console.log('Verifying backend OTP for:', phoneNumber, 'OTP:', otp);
        const result = await dispatch(loginWithOTP({ phoneNumber, otp }));
        
        if (loginWithOTP.fulfilled.match(result)) {
          console.log('✅ OTP verification successful:', result.payload);
          
          if (result.payload.user && result.payload.user.isAdmin === true) {
            console.log('✅ Admin privileges confirmed');
            setSuccessPopup(true);
            setTimeout(() => {
              navigate('/admin-dashboard');
            }, 1500);
          } else {
            setErrors({ 
              general: 'Access denied. This account does not have admin privileges.' 
            });
          }
        } else {
          console.log('❌ OTP verification failed:', result.payload);
          setErrors({ otp: result.payload || 'Invalid OTP. Please try again.' });
        }
      }
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      setErrors({ otp: 'OTP verification failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password login
  const handlePasswordLogin = async () => {
    console.log('=== PASSWORD LOGIN ===');
    
    if (!password) {
      setErrors({ password: "Password is required" });
      return;
    }

    setErrors({});
    dispatch(clearError());

    const credentials = {
      phNo: phoneNumber,
      password: password
    };

    try {
      const result = await dispatch(loginUser(credentials));
      
      if (loginUser.fulfilled.match(result)) {
        console.log('✅ Password login successful:', result.payload);
        
        // Immediately restore auth from storage to sync Redux state
        dispatch(restoreAuthFromStorage());
        
        if (result.payload.user && result.payload.user.isAdmin === true) {
          console.log('✅ Admin privileges confirmed');
          setSuccessPopup(true);
          setTimeout(() => {
            navigate('/admin-dashboard');
          }, 1500);
        } else {
          setErrors({ 
            general: 'Access denied. This account does not have admin privileges.' 
          });
        }
      } else {
        console.log('❌ Password login failed:', result.payload);
        setErrors({ 
          general: result.payload || 'Invalid credentials. Please check your phone number and password.' 
        });
      }
    } catch (error) {
      console.error('❌ Password login error:', error);
      setErrors({ general: 'Login failed. Please try again.' });
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    
    try {
      console.log('🔥 Resending Firebase OTP for:', phoneNumber);
      setIsLoading(true);
      
      const result = await firebaseService.sendSMSOTP(phoneNumber);
      
      if (result.success) {
        console.log('✅ Firebase OTP resent successfully');
        setLocalOtpSent(true); // Ensure local state is maintained
        setOtpTimer(300); // Reset timer
        setCanResendOtp(false);
        setOtpExpiredMessage("");
        setOtp(""); // Clear current OTP input
        setFirebaseVerificationId(result.verificationId);
        
        // Show development message if applicable
        if (result.isDevelopment && result.testCode) {
          setErrors({ 
            info: `Development Mode: Use test code ${result.testCode}` 
          });
        }
      } else {
        setErrors({ general: result.message || 'Failed to resend OTP' });
      }
    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      setErrors({ general: 'Failed to resend OTP. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation functions
  const goBackToPhone = () => {
    setCurrentStep('phone');
    setOtp("");
    setPassword("");
    setErrors({});
    setOtpTimer(0);
    setCanResendOtp(false);
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === 'otp' ? 'password' : 'otp');
    setCurrentStep('phone');
    setErrors({});
    setOtp("");
    setPassword("");
  };

  // Error message component
  const ErrorMessage = ({ error }) =>
    error ? (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <span>⚠</span> {error}
      </p>
    ) : null;

  // Info message component  
  const InfoMessage = ({ message }) =>
    message ? (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-600 text-sm flex items-center gap-1">
          <span>ℹ️</span> {message}
        </p>
      </div>
    ) : null;

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
          
          {/* Phone Number Step */}
          {currentStep === 'phone' && (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Admin Login
                </h1>
                <p className="text-gray-500 text-sm">
                  Choose your preferred login method
                </p>
              </div>

              {/* Error Display */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Info Display */}
              <InfoMessage message={errors.info} />

              {/* Firebase OTP Login Section */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center mb-3">
                  <MessageSquare size={20} className="text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">Login with Firebase OTP</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Receive a 6-digit OTP via SMS</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter 10-digit phone number"
                      value={otpPhoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setOtpPhoneNumber(value);
                        setPhoneNumber(value); // Keep shared state updated for validation
                        if (errors.phone) {
                          setErrors((prev) => ({ ...prev, phone: "" }));
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <ErrorMessage error={errors.phone} />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (authLoading || !otpPhoneNumber) return;
                      
                      setPhoneNumber(otpPhoneNumber);
                      setAuthMode('otp');
                      setErrors({});
                      dispatch(clearError());

                      // Directly call Firebase OTP sending logic
                      try {
                        setIsLoading(true);
                        const result = await firebaseService.sendSMSOTP(otpPhoneNumber);
                        
                        if (result.success) {
                          setCurrentStep('otp');
                          setLocalOtpSent(true);
                          setOtpTimer(300);
                          setCanResendOtp(false);
                          setOtpExpiredMessage("");
                          setIsFirebaseOTP(true);
                          setFirebaseVerificationId(result.verificationId);
                          
                          if (result.isDevelopment && result.testCode) {
                            setErrors({ 
                              info: `Development Mode: Use test code ${result.testCode} (SMS not actually sent)` 
                            });
                          } else {
                            setErrors({ 
                              success: `OTP sent successfully to +91${otpPhoneNumber}. Please check your messages.` 
                            });
                          }
                        } else {
                          setErrors({ general: result.message || 'Failed to send OTP via SMS. Please try again.' });
                        }
                      } catch (error) {
                        console.error('❌ Firebase OTP error:', error);
                        setErrors({ general: 'Unable to send SMS OTP. Please check your connection.' });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={authLoading || !otpPhoneNumber}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {authLoading && authMode === 'otp' ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending OTP...
                      </div>
                    ) : (
                      <>
                        <MessageSquare size={16} className="inline mr-2" />
                        Send Firebase OTP
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* OR Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Password Login Section */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                <div className="flex items-center mb-3">
                  <Shield size={20} className="text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">Login with Password</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Use your phone number and password</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter 10-digit phone number"
                      value={passwordPhoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPasswordPhoneNumber(value);
                        setPhoneNumber(value); // Keep shared state updated for validation
                        if (errors.phone) {
                          setErrors((prev) => ({ ...prev, phone: "" }));
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <ErrorMessage error={errors.phone} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) {
                            setErrors((prev) => ({ ...prev, password: "" }));
                          }
                        }}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                          errors.password ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <ErrorMessage error={errors.password} />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (authLoading || !passwordPhoneNumber || !password) return;
                      
                      setPhoneNumber(passwordPhoneNumber);
                      setAuthMode('password');
                      handlePasswordLogin();
                    }}
                    disabled={authLoading || !passwordPhoneNumber || !password}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {authLoading && authMode === 'password' ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Signing In...
                      </div>
                    ) : (
                      <>
                        <Shield size={16} className="inline mr-2" />
                        Login with Password
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Admin Info */}
              <div className="pt-4 text-center text-sm border-t border-gray-100 mt-6">
                <p className="text-gray-500">
                  Registered admin number: <span className="font-medium">8717000084</span>
                </p>
              </div>
            </>
          )}

          {/* OTP Verification Step */}
          {currentStep === 'otp' && (
            <>
              {/* Header with back button */}
              <div className="text-center mb-8">
                <button
                  onClick={goBackToPhone}
                  className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Verify OTP
                </h1>
                <p className="text-gray-500 text-sm">
                  Enter the 6-digit code sent to<br />
                  <span className="font-medium">+91 {phoneNumber}</span>
                </p>
              </div>

              {/* Error Display */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Info Display */}
              <InfoMessage message={errors.info} />

              {/* OTP Expired Message */}
              {otpExpiredMessage && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-600 text-sm">{otpExpiredMessage}</p>
                </div>
              )}

              {/* OTP Input */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(value);
                      if (errors.otp) {
                        setErrors((prev) => ({ ...prev, otp: "" }));
                      }
                    }}
                    className={`w-full px-3 py-2 text-center text-2xl tracking-widest border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.otp ? "border-red-500" : "border-gray-300"
                    }`}
                    maxLength={6}
                  />
                  <ErrorMessage error={errors.otp} />
                </div>

                {/* Timer and Resend */}
                <div className="text-center">
                  {otpTimer > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Timer size={16} />
                      <span className="text-sm">OTP expires in {formatTime(otpTimer)}</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={!canResendOtp || authLoading}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:text-gray-400 transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleOtpVerification}
                  disabled={authLoading || otp.length !== 6}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {authLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verifying...
                    </div>
                  ) : (
                    "Verify & Login"
                  )}
                </button>
              </div>
            </>
          )}

          {/* Password Step */}
          {currentStep === 'password' && (
            <>
              {/* Header with back button */}
              <div className="text-center mb-8">
                <button
                  onClick={goBackToPhone}
                  className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Enter Password
                </h1>
                <p className="text-gray-500 text-sm">
                  Enter your password for<br />
                  <span className="font-medium">+91 {phoneNumber}</span>
                </p>
              </div>

              {/* Error Display */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) {
                          setErrors((prev) => ({ ...prev, password: "" }));
                        }
                      }}
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  <ErrorMessage error={errors.password} />
                </div>

                <button
                  type="button"
                  onClick={handlePasswordLogin}
                  disabled={authLoading || !password}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {authLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign in to Dashboard"
                  )}
                </button>

                <div className="text-center">
                  <button
                    onClick={() => setAuthMode('otp')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    Use OTP instead?
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Success Popup */}
        {successPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Login Successful
              </h3>
              <p className="text-gray-600 text-sm">
                Welcome back! Redirecting to admin dashboard...
              </p>
            </div>
          </div>
        )}

        {/* reCAPTCHA Container (hidden) */}
        <div id="recaptcha-container" className="hidden"></div>
      </div>
    </div>
  );
};

export default AuthFlow;
