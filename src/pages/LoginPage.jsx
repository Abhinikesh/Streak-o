import React, { useState, useRef, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  // Generate the 7x4 static habit grid
  const habitGrid = Array.from({ length: 28 }).map((_, i) => {
    // Generate an aesthetically pleasing pseudo-random pattern of habits
    const pattern = [
      1, 1, 0, 1, 2, 1, 1,
      1, 0, 1, 1, 1, 1, 0,
      0, 1, 1, 2, 1, 1, 1,
      1, 1, 1, 1, 0, 1, 1,
    ];
    let bgClass = "bg-gray-100";
    if (pattern[i] === 1) bgClass = "bg-emerald-500";
    if (pattern[i] === 2) bgClass = "bg-red-400";

    return (
      <div key={i} className={`w-3 h-3 rounded-[3px] ${bgClass}`}></div>
    );
  });

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const handleSendOTP = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/request-otp', { email });
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpString) => {
    if (otpString.length !== 6) return;
    setLoading(true);
    try {
      const response = await api.post('/api/auth/verify-otp', { email, otp: otpString });
      if (response.data?.token) {
        await login(response.data.token);
        navigate('/dashboard');
        toast.success('Welcome to StreakBoard!');
      } else {
        throw new Error('Invalid authentication response');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid or expired OTP.';
      toast.error(msg);
      setOtp(Array(6).fill('')); // Clear inputs
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus(); // Focus first input
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e, index) => {
    const val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return; // Only allow numbers

    const char = val.slice(-1); // Take only the last typed character
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // Auto-focus next field
    if (char && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }

    // Auto-submit if all fields are filled
    if (newOtp.every(d => d !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        if (inputRefs.current[index - 1]) {
          inputRefs.current[index - 1].focus();
        }
      }
    } else if (e.key === 'Enter') {
      if (otp.every(d => d !== '')) {
        handleVerifyOTP(otp.join(''));
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);

    if (newOtp.every(d => d !== '')) {
      handleVerifyOTP(newOtp.join(''));
    } else {
      const nextEmpty = newOtp.findIndex(d => d === '');
      if (nextEmpty !== -1 && inputRefs.current[nextEmpty]) {
        inputRefs.current[nextEmpty].focus();
      }
    }
  };

  // Keep focus on the correct step
  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  // Reusable loading spinner SVG
  const spinnerIcon = (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50/40 p-4">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl shadow-indigo-100 p-8 border border-gray-100">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-indigo-600 tracking-tight mb-2">StreakBoard</h1>
          <p className="text-gray-500 font-medium tracking-wide mb-6">Track your habits. Build your discipline.</p>
          
          {/* Decorative Graph */}
          <div className="grid grid-cols-7 gap-[3px] opacity-80 hover:opacity-100 transition-opacity duration-300">
            {habitGrid}
          </div>
        </div>

        {/* Google Auth Button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold border border-gray-300 rounded-lg px-4 py-2.5 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink-0 mx-4 text-sm text-gray-400">or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* OTP Auth Flow */}
        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="Enter your email address"
                required
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors text-gray-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold rounded-lg px-4 py-3 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  {spinnerIcon}
                  Sending...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-gray-900">Enter the 6-digit code</p>
              <p className="text-xs text-gray-500">
                Sent to <span className="font-semibold text-gray-700">{email}</span>
              </p>
            </div>
            
            <div className="flex justify-between items-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-14 text-center text-xl font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all selection:bg-indigo-100"
                />
              ))}
            </div>

            <div className="flex flex-col items-center gap-4">
              {loading && (
                <div className="flex items-center text-sm text-indigo-600 font-medium">
                  {spinnerIcon}
                  Verifying code...
                </div>
              )}
              <button
                type="button"
                onClick={() => setStep('email')}
                disabled={loading}
                className="text-sm text-gray-500 hover:text-indigo-600 font-medium transition-colors disabled:opacity-50"
              >
                Change email address
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
