// Firebase Authentication Service for Real-time OTP
import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  PhoneAuthProvider,
  signInWithCredential,
  updateProfile
} from 'firebase/auth';
import { auth, ADMIN_CONFIG } from '../config/firebase';

class FirebaseAuthService {
  constructor() {
    this.recaptchaVerifier = null;
    this.confirmationResult = null;
  }

  // Initialize reCAPTCHA for SMS verification
  initRecaptcha(containerId = 'recaptcha-container') {
    try {
      if (!this.recaptchaVerifier) {
        console.log('🔄 Initializing Firebase reCAPTCHA...');
        
        // Check if we're in development mode
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
        
        if (isDevelopment) {
          // Enable app verification disabled for testing
          auth.settings.appVerificationDisabledForTesting = true;
          console.log('🧪 Development mode: App verification disabled for testing');
        }

        this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
          'size': 'invisible',
          'callback': (response) => {
            console.log('✅ reCAPTCHA solved:', response);
          },
          'expired-callback': () => {
            console.log('⚠️ reCAPTCHA expired, reinitializing...');
            this.recaptchaVerifier = null;
          }
        });
        
        console.log('✅ reCAPTCHA verifier initialized successfully');
      }
      return this.recaptchaVerifier;
    } catch (error) {
      console.error('❌ reCAPTCHA initialization error:', error);
      throw error;
    }
  }

  // Send SMS OTP to phone number
  async sendSMSOTP(phoneNumber = ADMIN_CONFIG.adminPhone) {
    try {
      console.log('📱 Starting SMS OTP process...');
      
      // Verify Firebase auth configuration
      console.log('🔧 Firebase Auth Config:', {
        currentUser: auth.currentUser ? 'present' : 'none',
        config: {
          apiKey: auth.config?.apiKey ? '***' + auth.config.apiKey.slice(-4) : 'missing',
          authDomain: auth.config?.authDomain || 'missing',
          projectId: auth.config?.projectId || 'missing'
        }
      });
      
      // Initialize reCAPTCHA if not already done
      if (!this.recaptchaVerifier) {
        console.log('🔄 Initializing reCAPTCHA for SMS...');
        this.initRecaptcha('recaptcha-container');
      }

      // Format phone number for India with detailed logging
      console.log('📞 Input phone number:', phoneNumber);
      
      let formattedPhone = phoneNumber;
      
      // Clean the phone number first (remove spaces, dashes, etc.)
      const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      console.log('📞 Cleaned phone number:', cleanedPhone);
      
      // Format based on input
      if (cleanedPhone.startsWith('+91')) {
        formattedPhone = cleanedPhone; // Already has +91
      } else if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
        formattedPhone = `+${cleanedPhone}`; // Add + to 91xxxxxxxxxx
      } else if (cleanedPhone.startsWith('0') && cleanedPhone.length === 11) {
        formattedPhone = `+91${cleanedPhone.substring(1)}`; // Remove 0 and add +91
      } else if (cleanedPhone.length === 10) {
        formattedPhone = `+91${cleanedPhone}`; // Add +91 to 10-digit number
      } else if (cleanedPhone.startsWith('+')) {
        formattedPhone = cleanedPhone; // Keep other country codes as is
      } else {
        formattedPhone = `+91${cleanedPhone}`; // Default: add +91
      }

      console.log('📞 Final formatted phone:', formattedPhone);
      console.log('📞 Phone formatting summary:', {
        input: phoneNumber,
        cleaned: cleanedPhone,
        final: formattedPhone,
        isIndianNumber: formattedPhone.startsWith('+91'),
        length: formattedPhone.length
      });

      // Check if we're in development mode
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
      
      // Use Firebase test phone numbers for development only
      if (isDevelopment) {
        console.log('🧪 Development Mode: Using Firebase test phone number');
        
        // Firebase test phone number as per documentation
        const testPhoneNumber = '+1 650-555-3434';
        const testVerificationCode = '654321';
        
        try {
          const confirmationResult = await signInWithPhoneNumber(
            auth, 
            testPhoneNumber, 
            this.recaptchaVerifier
          );

          this.confirmationResult = confirmationResult;
          
          return {
            success: true,
            message: `Test SMS sent to ${testPhoneNumber}. Use verification code: ${testVerificationCode}`,
            verificationId: confirmationResult.verificationId,
            isDevelopment: true,
            testCode: testVerificationCode,
            testPhone: testPhoneNumber
          };
        } catch (testError) {
          console.warn('⚠️ Test phone failed, falling back to simulation:', testError);
          
          // Fallback to simulation if test phone fails
          return {
            success: true,
            message: `SMS simulation for ${formattedPhone}. Use test code: 123456`,
            verificationId: 'simulated-verification-id',
            isDevelopment: true,
            testCode: '123456'
          };
        }
      }

      // Production SMS (requires Firebase billing)
      console.log('🚀 Production Mode: Sending real SMS...');
      console.log('📞 Calling signInWithPhoneNumber with:', { 
        phone: formattedPhone, 
        hasRecaptcha: !!this.recaptchaVerifier 
      });
      
      try {
        // Add timeout to prevent hanging
        const confirmationResult = await Promise.race([
          signInWithPhoneNumber(auth, formattedPhone, this.recaptchaVerifier),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firebase SMS timeout after 30 seconds')), 30000)
          )
        ]);
        
        console.log('✅ signInWithPhoneNumber successful:', {
          verificationId: confirmationResult.verificationId ? 'present' : 'missing',
          confirmationResult: !!confirmationResult
        });

        this.confirmationResult = confirmationResult;
        
        return {
          success: true,
          message: `SMS OTP sent to ${formattedPhone}`,
          verificationId: confirmationResult.verificationId
        };
      } catch (signInError) {
        console.error('❌ signInWithPhoneNumber failed:', signInError);
        throw signInError; // Re-throw to be caught by outer catch
      }

    } catch (error) {
      console.error('❌ SMS OTP Error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Reset reCAPTCHA on error
      if (this.recaptchaVerifier) {
        try {
          this.recaptchaVerifier.clear();
        } catch (clearError) {
          console.warn('⚠️ Error clearing reCAPTCHA:', clearError);
        }
        this.recaptchaVerifier = null;
      }

      // Provide specific error messages
      let userMessage = this.getErrorMessage(error);
      
      if (error.code === 'auth/billing-not-enabled') {
        userMessage = 'SMS authentication requires billing to be enabled in Firebase Console';
      } else if (error.code === 'auth/quota-exceeded') {
        userMessage = 'SMS quota exceeded. Please try again later or enable billing';
      } else if (error.code === 'auth/invalid-phone-number') {
        userMessage = 'Invalid phone number format. Please check the number';
      }

      return {
        success: false,
        message: userMessage,
        error: error.code,
        details: error.message
      };
    }
  }

  // Verify SMS OTP code
  async verifySMSOTP(code) {
    try {
      // Check for development mode test code
      if (code === '123456' && window.location.hostname === 'localhost') {
        console.log('✅ Development mode: Test SMS code accepted');
        return {
          success: true,
          message: 'SMS verification successful (Development mode)',
          isDevelopment: true,
          testUser: {
            uid: 'test-uid-' + Date.now(),
            phoneNumber: `+91${ADMIN_CONFIG.adminPhone}`
          }
        };
      }

      if (!this.confirmationResult) {
        throw new Error('No SMS verification in progress');
      }

      const result = await this.confirmationResult.confirm(code);
      
      console.log('✅ SMS verification successful:', result.user.uid);
      
      return {
        success: true,
        message: 'SMS verification successful',
        user: result.user,
        uid: result.user.uid
      };

    } catch (error) {
      console.error('❌ SMS verification failed:', error);
      
      let message = this.getErrorMessage(error);
      
      if (error.code === 'auth/invalid-verification-code') {
        message = 'Invalid OTP code. Please check and try again';
      } else if (error.code === 'auth/code-expired') {
        message = 'OTP code has expired. Please request a new code';
      }
      
      return {
        success: false,
        message: message,
        error: error.code
      };
    }
  }

  // Send email verification
  async sendEmailVerification(email = ADMIN_CONFIG.adminEmail, password = ADMIN_CONFIG.adminPassword) {
    try {
      let user;

      // Try to create new user or sign in existing user
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        console.log('✅ New user created:', user.uid);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          // User exists, sign them in
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
          console.log('✅ Existing user signed in:', user.uid);
        } else {
          throw error;
        }
      }

      // Update profile with admin name
      await updateProfile(user, {
        displayName: 'Rithik Mahajan (Admin)'
      });

      // Send email verification
      await sendEmailVerification(user, {
        url: window.location.origin,
        handleCodeInApp: true
      });

      return {
        success: true,
        message: `Email verification sent to ${email}`,
        user: user,
        uid: user.uid
      };

    } catch (error) {
      console.error('❌ Email verification error:', error);
      
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error.code
      };
    }
  }

  // Validate credentials
  validateCredentials(emailPassword, defaultPassword) {
    const correctPassword = ADMIN_CONFIG.adminPassword;
    
    if (emailPassword !== correctPassword) {
      return {
        success: false,
        message: 'Invalid email password'
      };
    }

    if (defaultPassword !== correctPassword) {
      return {
        success: false,
        message: 'Invalid default password'
      };
    }

    return {
      success: true,
      message: 'Credentials validated successfully'
    };
  }

  // Complete verification process
  async completeVerification(smsCode, emailPassword, defaultPassword) {
    try {
      // Verify SMS OTP
      const smsResult = await this.verifySMSOTP(smsCode);
      if (!smsResult.success) {
        return smsResult;
      }

      // Validate credentials
      const credentialsResult = this.validateCredentials(emailPassword, defaultPassword);
      if (!credentialsResult.success) {
        return credentialsResult;
      }

      return {
        success: true,
        message: 'All verifications completed successfully',
        phoneVerified: true,
        emailVerified: true,
        credentialsVerified: true,
        user: smsResult.user
      };

    } catch (error) {
      console.error('❌ Complete verification error:', error);
      
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error.code
      };
    }
  }

  // Clean up resources
  cleanup() {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }

  // Get user-friendly error messages
  getErrorMessage(error) {
    const errorMessages = {
      'auth/invalid-phone-number': 'Invalid phone number format',
      'auth/missing-phone-number': 'Phone number is required',
      'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
      'auth/invalid-verification-code': 'Invalid verification code',
      'auth/invalid-verification-id': 'Invalid verification ID',
      'auth/code-expired': 'Verification code has expired',
      'auth/email-already-in-use': 'Email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/wrong-password': 'Incorrect password',
      'auth/user-not-found': 'No user found with this email',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/invalid-api-key': 'Invalid API key',
      'auth/app-deleted': 'Firebase app has been deleted',
      'auth/app-not-authorized': 'App not authorized for this domain',
      'auth/argument-error': 'Invalid argument provided',
      'auth/invalid-user-token': 'User token has expired',
      'auth/user-token-expired': 'User token has expired',
      'auth/null-user': 'User is null',
      'auth/invalid-tenant-id': 'Invalid tenant ID'
    };

    return errorMessages[error.code] || error.message || 'An unexpected error occurred';
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
export default FirebaseAuthService;
