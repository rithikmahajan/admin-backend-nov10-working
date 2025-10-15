import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

const TwoFactorAuth = ({ 
  onSubmit, 
  onClose,
  phoneNumber = "your phone number",
  emailAddress = "your email address"
}) => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [emailPassword, setEmailPassword] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(true);
  const [showDefaultPassword, setShowDefaultPassword] = useState(false);

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

  // Handle backspace to focus previous input
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.querySelector(`input[name="code-${index - 1}"]`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      verificationCode: verificationCode.join(''),
      emailPassword,
      defaultPassword
    };
    onSubmit && onSubmit(data);
  };

  const isFormValid = () => {
    return verificationCode.every(digit => digit !== '') && 
           emailPassword.trim() !== '' && 
           defaultPassword.trim() !== '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-md mx-auto relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-8 pt-12">
          {/* Main Title */}
          <div className="text-center mb-8">
            <h1 className="font-montserrat font-bold text-[32px] text-black tracking-[-0.41px] leading-[22px] mb-4">
              Two Factor Verification
            </h1>
          </div>

          {/* Verification Code Section */}
          <div className="mb-8">
            <h2 className="font-montserrat font-bold text-[24px] text-black tracking-[0.72px] leading-[48px] mb-4">
              Verification code
            </h2>
            
            <p className="font-montserrat font-bold text-[14px] text-black leading-[24px] mb-6">
              Please enter the verification code we sent to {phoneNumber}
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
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email Verification Section */}
            <div className="mb-6">
              <p className="font-montserrat font-bold text-[14px] text-black leading-[24px] mb-4">
                Please enter the verification code we sent to {emailAddress}
              </p>
              
              <div className="relative">
                <input
                  type={showEmailPassword ? "text" : "password"}
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full h-[50px] border-0 border-b-2 border-gray-300 bg-transparent px-0 pb-2 pt-4 text-[16px] text-black placeholder-[#bdbcbc] focus:border-black focus:outline-none transition-colors font-['Mulish'] tracking-[0.32px]"
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
                Please enter the default password
              </p>
              
              <div className="relative">
                <input
                  type={showDefaultPassword ? "text" : "password"}
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full h-[50px] border-0 border-b-2 border-gray-300 bg-transparent px-0 pb-2 pt-4 text-[16px] text-black placeholder-[#bdbcbc] focus:border-black focus:outline-none transition-colors font-['Mulish'] tracking-[0.32px]"
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
              disabled={!isFormValid()}
              className={`w-full h-[51px] rounded-[26.5px] text-white font-montserrat font-bold text-[16px] uppercase leading-[24px] transition-all duration-200 ${
                isFormValid() 
                  ? 'bg-black hover:bg-gray-800 cursor-pointer' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
