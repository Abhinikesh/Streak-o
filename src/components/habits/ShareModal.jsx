import React, { useRef, useState, useMemo } from 'react';
import ShareCard from './ShareCard';
import useShareHabit from '../../hooks/useShareHabit';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns array of last N month labels e.g. ["April 2025","March 2025",...] */
function getRecentMonths(count = 3) {
  const months = [];
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
  }
  return months;
}

/** Filter logs to just those belonging to the given "Month YYYY" string */
function filterLogsByMonth(logs, monthLabel) {
  const [monthName, yearStr] = monthLabel.split(' ');
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const month = MONTHS.indexOf(monthName); // 0-indexed
  const year  = parseInt(yearStr, 10);
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return logs.filter(l => l.date?.startsWith(prefix));
}

// ── ShareModal ────────────────────────────────────────────────────────────────

export default function ShareModal({
  isOpen,
  onClose,
  habit,
  logs = [],
  currentStreak   = 0,
  bestStreak      = 0,
  completionRate  = 0,
  userName        = 'You',
  month: initialMonth,
}) {
  const cardRef = useRef(null);
  const { shareHabit, isCapturing } = useShareHabit();

  const recentMonths = useMemo(() => getRecentMonths(3), []);
  const [selectedMonth, setSelectedMonth] = useState(
    initialMonth || recentMonths[0]
  );

  // Filter logs client-side for the selected month
  const filteredLogs = useMemo(
    () => filterLogsByMonth(logs, selectedMonth),
    [logs, selectedMonth]
  );

  if (!isOpen || !habit) return null;

  const handleShare = () => shareHabit(cardRef, habit.name);

  return (
    /* Overlay */
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Share Your Streak 🚀
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold leading-none transition-colors focus:outline-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Card preview */}
        <div className="mx-6 px-4 py-4 flex justify-center bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-auto">
          <div style={{ transform: 'scale(0.78)', transformOrigin: 'top center', height: '0px' }}>
            {/* height:0 + scale means the card "floats" — we let the scaled
                card determine its own visual height via the wrapper below */}
          </div>
          {/* Wrapper that shrinks to fit the scaled card */}
          <div
            style={{
              transform: 'scale(0.78)',
              transformOrigin: 'top center',
              // Reserve space equal to the scaled height so layout doesn't collapse
              marginBottom: '-90px', // fine-tuned for 420px card
            }}
          >
            <ShareCard
              cardRef={cardRef}
              habitName={habit.name}
              habitIcon={habit.icon || '⭐'}
              colorHex={habit.colorHex || '#6366f1'}
              logs={filteredLogs}
              currentStreak={currentStreak}
              bestStreak={bestStreak}
              completionRate={completionRate}
              userName={userName}
              month={selectedMonth}
            />
          </div>
        </div>

        {/* Month selector */}
        <div className="px-6 mt-5">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Select month:
          </p>
          <div className="flex gap-2 flex-wrap">
            {recentMonths.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-all ${
                  selectedMonth === m
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 mt-4">
          <div className={`flex gap-3 relative ${isCapturing ? 'pointer-events-none' : ''}`}>
            {/* Download */}
            <button
              onClick={handleShare}
              className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl py-3.5 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              ⬇ Download
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl py-3.5 font-semibold text-sm shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all"
            >
              Share 🚀
            </button>

            {/* Capturing overlay spinner */}
            {isCapturing && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 dark:bg-gray-900/60">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Platform hint */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
            Saves to camera roll on mobile • Downloads as PNG on desktop
          </p>
        </div>
      </div>
    </div>
  );
}
