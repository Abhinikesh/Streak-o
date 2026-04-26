import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const EASE = [0.22, 1, 0.36, 1];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // ── Auth redirect — localStorage check for instant navigation ──
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // ── Existing auth state ──
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  // ── Existing Google OAuth handler ──
  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://streakboard.onrender.com';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  // ── Existing OTP handlers — untouched ──
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
      setOtp(Array(6).fill(''));
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e, index) => {
    const val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return;
    const char = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    if (char && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
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

  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  // ── Reusable spinner ──
  const Spinner = () => (
    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
  );

  return (
    <div className="min-h-screen bg-[#f8f8ff] dark:bg-[#0d0d1a] flex items-center justify-center px-5 py-10 font-[Inter,sans-serif] antialiased">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full max-w-[400px] mx-auto bg-[#f0f0ff] dark:bg-[#111120] border border-[#e0e0f0] dark:border-[#1e1e2e] rounded-2xl p-7 md:p-9"
      >

        {/* ── Brand Header ── */}
        <div className="flex flex-col items-center text-center mb-7">
          <span className="text-2xl">🔥</span>
          <p className="font-bold text-xl text-[#7c3aed] mt-1 tracking-tight">StreakBoard</p>
          <p className="text-[#555555] text-xs mt-1">Track what you do. Not what you plan.</p>
        </div>

        {/* ── Step indicator ── */}
        {step === 'email' ? (
          <>
            {/* ── Section title ── */}
            <div className="mb-6">
              <h1 className="text-[#0d0d1a] dark:text-white font-bold text-xl mb-1">Welcome back</h1>
              <p className="text-[#888888] text-sm">Log in to see your streak.</p>
            </div>

            {/* ── Google OAuth ── */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 rounded-xl border border-[#2a2a3a] hover:border-[#7c3aed] bg-transparent text-[#0d0d1a] dark:text-white text-sm font-medium flex items-center justify-center gap-2.5 transition-all duration-200 hover:bg-[#1e1e2e]/60 active:scale-95 mb-5"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 border-t border-[#e0e0f0] dark:border-[#1e1e2e]" />
              <span className="text-[#555555] text-xs flex-shrink-0">or continue with email</span>
              <div className="flex-1 border-t border-[#e0e0f0] dark:border-[#1e1e2e]" />
            </div>

            {/* ── Email form ── */}
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-[#888888] text-xs mb-1.5 block">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#0d0d1a]/5 dark:bg-[#0d0d1a] border border-[#e0e0f0] dark:border-[#1e1e2e] focus:border-[#7c3aed] dark:focus:border-[#7c3aed] rounded-xl px-4 py-3 text-[#0d0d1a] dark:text-white text-base outline-none transition-colors placeholder:text-[#555555]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-[#7c3aed]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner />
                    <span>Sending OTP…</span>
                  </>
                ) : (
                  'Send OTP →'
                )}
              </button>
            </form>
          </>
        ) : (
          /* ── OTP Step ── */
          <div>
            {/* Back to email */}
            <button
              type="button"
              onClick={() => setStep('email')}
              disabled={loading}
              className="text-[#555555] hover:text-[#888888] text-xs mb-6 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              ← Change email
            </button>

            <div className="text-center mb-6">
              <h1 className="text-[#0d0d1a] dark:text-white font-bold text-xl mb-1">Check your inbox</h1>
              <p className="text-[#888888] text-sm">
                We sent a 6-digit code to{' '}
                <span className="text-[#0d0d1a] dark:text-white font-medium">{email}</span>
              </p>
            </div>

            {/* ── OTP inputs ── */}
            <div className="flex justify-between items-center gap-2 mb-6">
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
                  className="w-12 h-14 text-center text-xl font-bold text-[#0d0d1a] dark:text-white bg-[#0d0d1a]/5 dark:bg-[#0d0d1a] border border-[#e0e0f0] dark:border-[#1e1e2e] focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] rounded-xl outline-none transition-all"
                />
              ))}
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center gap-2 text-[#7c3aed] text-sm font-medium mb-4">
                <Spinner />
                <span>Verifying…</span>
              </div>
            )}

            <p className="text-[#555555] text-xs text-center">
              Didn't receive it?{' '}
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="text-[#7c3aed] hover:underline font-medium disabled:opacity-50"
              >
                Resend OTP
              </button>
            </p>
          </div>
        )}

        {/* ── Bottom links ── */}
        <div className="mt-6 pt-5 border-t border-[#e0e0f0] dark:border-[#1e1e2e] flex flex-col items-center gap-1.5">
          <p className="text-[#555555] text-xs text-center">
            New here?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#7c3aed] hover:underline font-medium"
            >
              Sign up free →
            </button>
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-[#555555] hover:text-[#888888] text-xs transition-colors"
          >
            ← Back to home
          </button>
        </div>

      </motion.div>
    </div>
  );
}
