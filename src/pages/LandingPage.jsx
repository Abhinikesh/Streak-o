import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const EASE = [0.22, 1, 0.36, 1];

const GRID = [
  [1, 1, 1, 1, 0, 0, 1],
  [1, 1, 0, 1, 1, 1, 1],
  [2, 1, 1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1, 1, 2],
  [1, 2, 1, 3, 0, 0, 0],
];

function CalendarCell({ value }) {
  const base = 'w-8 h-8 rounded-sm flex-shrink-0';
  if (value === 1) return <div className={`${base} bg-[#10b981]`} />;
  if (value === 2) return <div className={`${base} bg-[#ef4444]`} />;
  if (value === 3) return <div className={`${base} bg-[#7c3aed] animate-pulse`} />;
  return <div className={`${base} bg-[#e0e0f0] dark:bg-[#1e1e2e]`} />;
}

function LandingPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  });

  const fadeIn = (delay = 0) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, delay, ease: EASE },
  });

  const inViewFadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, delay, ease: EASE },
  });

  return (
    <div className="min-h-screen bg-[#f8f8ff] dark:bg-[#0d0d1a] text-[#0d0d1a] dark:text-white font-[Inter,sans-serif] antialiased overflow-x-hidden">

      {/* ──────────── NAVBAR ──────────── */}
      <nav className="w-full px-5 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-semibold text-[#7c3aed] text-[1.05rem] tracking-tight hover:opacity-80 transition-opacity"
        >
          <span>🔥</span>
          <span>StreakBoard</span>
        </button>
        <button
          onClick={() => navigate('/login')}
          className="text-sm font-medium text-[#555555] dark:text-[#888888] border border-[#e0e0f0] dark:border-[#2a2a3a] hover:border-[#7c3aed] hover:text-[#0d0d1a] dark:hover:text-white px-4 py-2 rounded-lg transition-all duration-200"
        >
          Log in
        </button>
      </nav>

      {/* ──────────── HERO ──────────── */}
      <section className="px-5 pt-10 pb-16 max-w-5xl mx-auto text-center">

        {/* Eyebrow badge */}
        <motion.div {...fadeUp(0)} className="flex justify-center mb-5">
          <span className="inline-flex items-center border border-[#7c3aed] text-[#7c3aed] text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full font-semibold">
            A contribution graph for your real life
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          {...fadeUp(0)}
          className="text-[2.2rem] md:text-[3.2rem] font-bold leading-[1.15] tracking-tight mb-5 text-[#0d0d1a] dark:text-white"
        >
          You start habits.<br />You stop habits.<br />
          <span className="text-[#7c3aed]">Repeat forever.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          {...fadeUp(0.15)}
          className="text-[#555555] dark:text-[#888888] text-base md:text-lg leading-relaxed max-w-md mx-auto mb-8"
        >
          The problem isn't willpower. It's not seeing your own pattern. StreakBoard makes your daily consistency visible — one tick at a time.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          {...fadeUp(0.25)}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
        >
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-7 py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-xl shadow-lg shadow-[#7c3aed]/25 transition-all duration-200 active:scale-95 text-sm"
          >
            See my real streak →
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="w-full sm:w-auto px-7 py-3.5 border border-[#e0e0f0] dark:border-[#2a2a3a] hover:border-[#7c3aed] text-[#555555] dark:text-[#888888] hover:text-[#0d0d1a] dark:hover:text-white rounded-xl transition-all duration-200 text-sm font-medium"
          >
            View leaderboard →
          </button>
        </motion.div>

        {/* Mini Calendar Grid */}
        <motion.div {...fadeIn(0.4)} className="flex justify-center">
          <div className="bg-white dark:bg-[#111120] shadow-sm dark:shadow-none border border-[#e0e0f0] dark:border-[#1e1e2e] rounded-2xl p-4 max-w-[320px] w-full mx-auto">
            <p className="text-[#888888] dark:text-[#555555] text-xs text-left mb-3">
              Cold Shower — 30 day streak tracker
            </p>
            <div className="flex flex-col gap-1.5">
              {GRID.map((row, ri) => (
                <div key={ri} className="flex gap-1.5">
                  {row.map((cell, ci) => (
                    <CalendarCell key={ci} value={cell} />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[11px]">
              <span className="text-[#10b981] font-medium">✓ 18 done</span>
              <span className="text-[#ef4444] font-medium">✗ 4 missed</span>
              <span className="text-[#555555] dark:text-[#888888]">8 remaining</span>
              <span className="text-[#7c3aed] font-medium">81% rate</span>
            </div>
            <p className="text-[11px] text-[#888888] dark:text-[#555555] italic text-center mt-2">
              Your 30-day truth, visualised.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ──────────── SOCIAL PROOF STRIP ──────────── */}
      <section className="bg-[#f0f0ff] dark:bg-[#111120] border-y border-[#e0e0f0] dark:border-[#1e1e2e] py-5 px-5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4">
          {[
            { icon: '🔥', number: '50+', label: 'Active users' },
            { icon: '✅', number: '500+', label: 'Habits tracked' },
            { icon: '🏆', number: 'Global', label: 'Leaderboard' },
            { icon: '⚡', number: 'Free', label: 'Forever' },
          ].map(({ icon, number, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 text-center">
              <span className="text-base mb-0.5">{icon}</span>
              <span className="text-[#0d0d1a] dark:text-white font-bold text-sm">{number}</span>
              <span className="text-[#888888] dark:text-[#555555] text-[11px]">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────── PROBLEM SECTION ──────────── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <motion.p
          {...inViewFadeUp(0)}
          className="text-[11px] uppercase tracking-widest text-[#888888] dark:text-[#555555] text-center font-semibold mb-8"
        >
          Sound familiar?
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              quote: '"I missed a day and didn\'t even notice until it had been a week."',
              fix: 'Push reminders + red calendar cells catch this the moment it happens.',
              delay: 0,
            },
            {
              quote: '"I have no idea if I\'m actually getting better at this."',
              fix: 'Stats page: current streak, best streak, completion rate, heatmap.',
              delay: 0.1,
            },
            {
              quote: '"There\'s nobody holding me accountable except my own guilt."',
              fix: 'Friends leaderboard + public profiles make your discipline visible.',
              delay: 0.2,
            },
          ].map(({ quote, fix, delay }) => (
            <motion.div
              key={quote}
              {...inViewFadeUp(delay)}
              className="bg-white dark:bg-[#111120] shadow-sm dark:shadow-none border border-[#e0e0f0] dark:border-[#1e1e2e] hover:border-[#7c3aed]/40 dark:hover:border-[#2a2a3a] rounded-2xl p-5 transition-colors duration-200"
            >
              <p className="text-[#555555] dark:text-[#888888] text-sm italic leading-relaxed mb-4">{quote}</p>
              <div className="border-t border-[#e0e0f0] dark:border-[#1e1e2e] pt-4">
                <p className="text-[#10b981] text-xs leading-relaxed">→ {fix}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ──────────── PRODUCT INTRO ──────────── */}
      <section className="px-5 py-16 max-w-5xl mx-auto text-center">
        <motion.h2
          {...inViewFadeUp(0)}
          className="text-2xl md:text-3xl font-bold text-[#0d0d1a] dark:text-white mb-4"
        >
          Track what you do.{' '}
          <span className="text-[#7c3aed]">Not what you plan.</span>
        </motion.h2>
        <motion.p
          {...inViewFadeUp(0.1)}
          className="text-[#555555] dark:text-[#888888] text-sm md:text-base max-w-md mx-auto mb-10 leading-relaxed"
        >
          Log each habit at the end of the day — done or missed. No planning fiction. Just a 30-day calendar of your actual consistency.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            {
              icon: '🔥',
              title: 'Streaks that don\'t lie',
              body: '30/60/90-day calendar. Every missed day visible. Every win undeniable.',
              delay: 0,
            },
            {
              icon: '👥',
              title: 'Friends leaderboard',
              body: 'Race streaks with people you actually know. Real accountability.',
              delay: 0.1,
            },
            {
              icon: '📤',
              title: 'Share your proof',
              body: 'Export your habit calendar as an image. Post to Instagram or WhatsApp.',
              delay: 0.2,
            },
          ].map(({ icon, title, body, delay }) => (
            <motion.div
              key={title}
              {...inViewFadeUp(delay)}
              className="group bg-white dark:bg-[#111120] shadow-sm dark:shadow-none border border-[#e0e0f0] dark:border-[#1e1e2e] hover:border-[#7c3aed]/40 dark:hover:border-[#7c3aed]/40 rounded-2xl p-5 transition-all duration-200 cursor-default"
            >
              <span className="text-xl mb-3 block">{icon}</span>
              <h3 className="text-[#0d0d1a] dark:text-white font-semibold text-sm mb-2 group-hover:text-[#7c3aed] transition-colors duration-200">
                {title}
              </h3>
              <p className="text-[#888888] dark:text-[#555555] text-xs leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ──────────── FINAL CTA ──────────── */}
      <section className="px-5 py-16 max-w-5xl mx-auto text-center">
        <motion.h2
          {...inViewFadeUp(0)}
          className="text-2xl md:text-3xl font-bold text-[#0d0d1a] dark:text-white mb-3"
        >
          Stop estimating your discipline.
        </motion.h2>
        <motion.p
          {...inViewFadeUp(0.05)}
          className="text-[#555555] dark:text-[#888888] text-sm mb-8"
        >
          Measure it. Free. No credit card. 30 seconds to start.
        </motion.p>
        <motion.div {...inViewFadeUp(0.1)} className="flex flex-col items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-4 bg-[#7c3aed] hover:bg-[#6d28d9] font-semibold text-base text-white rounded-xl shadow-xl shadow-[#7c3aed]/20 transition-all duration-200 active:scale-95"
          >
            See my real streak →
          </button>
          <p className="text-[#888888] dark:text-[#555555] text-xs">
            Already tracking?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#7c3aed] hover:underline font-medium"
            >
              Log in →
            </button>
          </p>
        </motion.div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="border-t border-[#e0e0f0] dark:border-[#1e1e2e] px-5 py-5 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-[11px] text-[#888888] dark:text-[#555555]">
          StreakBoard © 2026 — built by Abhinikesh
        </span>
        <div className="flex items-center gap-3 text-[11px] text-[#888888] dark:text-[#555555]">
          <button
            onClick={() => navigate('/leaderboard')}
            className="hover:text-[#7c3aed] transition-colors"
          >
            Leaderboard
          </button>
          <span>·</span>
          <button
            onClick={() => navigate('/leaderboard')}
            className="hover:text-[#7c3aed] transition-colors"
          >
            Public profiles
          </button>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;
