import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loginUser, clearError, restoreAuthFromStorage } from "../store/slices/authSlice";

const AuthFlow = () => {
  console.log('AuthFlow component rendering...');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    isLoading: authLoading, 
    isAuthenticated, 
    user, 
    error: authError 
  } = useSelector(state => state.auth);
  
  console.log('AuthFlow state:', { authLoading, isAuthenticated, user, authError });

  const [showPassword, setShowPassword] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    phone: "",
    password: "",
  });

  // Handle authentication state changes
  useEffect(() => {
    console.log('AuthFlow useEffect triggered:', { isAuthenticated, user });
  }, [isAuthenticated, user, navigate, dispatch]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      setErrors({ general: authError });
    }
  }, [authError]);

  // Validation functions
  const isValidPhone = (phone) => /^\d{10}$/.test(phone);

  const validateLogin = () => {
    const newErrors = {};
    const data = loginData;

    if (!data.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhone(data.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!data.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async () => {
    console.log('=== ADMIN LOGIN ATTEMPT ===');
    
    // Validate form inputs
    if (!validateLogin()) {
      console.log('Form validation failed');
      return;
    }

    // Clear previous errors
    setErrors({});
    dispatch(clearError());

    // Prepare login credentials  
    const credentials = {
      phNo: loginData.phone,
      password: loginData.password
    };

    console.log('Attempting login with credentials:', credentials);

    try {
      // Use Redux action for login
      const result = await dispatch(loginUser(credentials));
      
      if (loginUser.fulfilled.match(result)) {
        console.log('✅ Login successful via Redux:', result.payload);
        
        // Check if user has admin privileges
        if (result.payload.user && result.payload.user.isAdmin === true) {
          console.log('✅ Admin privileges confirmed - isAdmin:', result.payload.user.isAdmin);
          
          // Show success popup and navigate to admin dashboard
          setSuccessPopup(true);
          setTimeout(() => {
            setSuccessPopup(false);
            console.log('🚀 Navigating to admin dashboard...');
            navigate('/admin-dashboard');
          }, 1500);
          
        } else {
          console.log('❌ Access denied - User is not admin. isAdmin:', result.payload.user?.isAdmin);
          setErrors({ 
            general: 'Access denied. This account does not have admin privileges.' 
          });
        }
      } else {
        console.log('❌ Login failed:', result.payload);
        setErrors({ 
          general: result.payload || 'Invalid credentials. Please check your phone number and password.' 
        });
      }
    } catch (error) {
      console.error('❌ Network/API error:', error);
      setErrors({ 
        general: 'Unable to connect to server. Please check your internet connection and try again.' 
      });
    }
  };

  // Error message component
  const ErrorMessage = ({ error }) =>
    error ? (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <span>⚠</span> {error}
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Admin Login
            </h1>
            <p className="text-gray-500 text-sm">
              Access admin dashboard with phone and password
            </p>
          </div>

          {/* Error Display */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={loginData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setLoginData((prev) => ({ ...prev, phone: value }));
                    // Clear errors when user starts typing
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={loginData.password}
                    onChange={(e) => {
                      setLoginData((prev) => ({ ...prev, password: e.target.value }));
                      // Clear errors when user starts typing
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
            </div>

            <button
              type="button"
              onClick={handleLoginSubmit}
              disabled={authLoading || isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {authLoading || isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in to Admin Dashboard"
              )}
            </button>

            <div className="pt-4 text-center text-sm border-t border-gray-100">
              <p className="text-gray-500">Admin access only</p>
            </div>
          </div>
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
      </div>
    </div>
  );
};

export default AuthFlow;
