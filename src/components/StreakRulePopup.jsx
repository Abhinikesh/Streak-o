import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'streak_rule_seen';

export default function StreakRulePopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Never show if user already acknowledged
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;

    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleGotIt = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const handleBackdrop = () => {
    // Close but do NOT set localStorage — shows again next visit
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="streak-rule-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleBackdrop}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-5"
        >
          <motion.div
            key="streak-rule-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111120] border border-[#1e1e2e] rounded-2xl p-7 max-w-sm w-full relative shadow-2xl"
          >
            {/* X close button */}
            <button
              onClick={handleBackdrop}
              className="absolute top-4 right-4 text-[#555555] hover:text-white text-xl transition-colors leading-none"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Flame icon */}
            <p className="text-4xl text-center mb-3">🔥</p>

            {/* Title */}
            <h2 className="font-bold text-white text-xl text-center mb-2">
              Streak Rules Updated
            </h2>

            {/* Subtitle */}
            <p className="text-[#888888] text-sm text-center mb-5">
              How streaks work on StreakBoard
            </p>

            {/* Two rule cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Keep streak card */}
              <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-3">
                <p className="text-lg mb-1">✅</p>
                <p className="text-white text-xs font-semibold">Log done or missed</p>
                <p className="text-[#10b981] text-xs">within 24 hours</p>
                <p className="text-[#888888] text-[11px] mt-1">= streak stays alive</p>
              </div>

              {/* Break streak card */}
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-3">
                <p className="text-lg mb-1">❌</p>
                <p className="text-white text-xs font-semibold">No log at all</p>
                <p className="text-[#ef4444] text-xs">for a full day</p>
                <p className="text-[#888888] text-[11px] mt-1">= streak resets to 0</p>
              </div>
            </div>

            {/* Got it button */}
            <button
              onClick={handleGotIt}
              className="w-full mt-5 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-xl transition-all duration-200 active:scale-95"
            >
              Got it, let's go 🔥
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
