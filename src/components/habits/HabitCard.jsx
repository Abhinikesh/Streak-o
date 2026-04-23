import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HabitCard({ habit, todayStatus, allLogs = [], onLog, isUpdating }) {
  const navigate = useNavigate();

  // Calculate streak based on past logs
  const streak = useMemo(() => {
    if (!allLogs || !allLogs.length) return 0;
    const doneDates = new Set(allLogs.filter(l => l.status === 'done').map(l => l.date));
    let count = 0;
    
    const today = new Date();
    const yT = today.getFullYear();
    const mT = String(today.getMonth() + 1).padStart(2, '0');
    const dT = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yT}-${mT}-${dT}`;

    // Include today if it's done
    if (doneDates.has(todayStr)) {
      count++;
    }

    // Go backwards starting from yesterday
    let curr = new Date(today);
    curr.setDate(curr.getDate() - 1);
    
    while (true) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      if (doneDates.has(dateStr)) {
        count++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [allLogs]);

  // Fix 2 — Compute card visual state based on todayStatus
  const isDone = todayStatus === 'done';
  const isMissed = todayStatus === 'missed';

  // Card background gradient & left border based on state
  const cardBg = isDone
    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500'
    : isMissed
    ? 'bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-l-red-400'
    : 'bg-white';

  // When null/neutral, use the habit's colorHex as left border via inline style
  const cardStyle = (!isDone && !isMissed)
    ? { borderLeft: `4px solid ${habit.colorHex || '#4F46E5'}` }
    : {};

  // Status text below habit name
  const statusText = isDone
    ? <span className="text-green-600 font-medium text-sm">✓ Done for today!</span>
    : isMissed
    ? <span className="text-red-500 text-sm">✕ Marked as missed</span>
    : (streak > 0
        ? <span className="flex items-center gap-1.5 text-gray-500 text-sm font-medium"><span className="text-base leading-none">🔥</span>{streak} day streak</span>
        : <span className="text-gray-400 text-sm">Start your streak!</span>
      );

  return (
    // Fix 4 — rounded-2xl, shadow, hover lift, transition
    <div 
      className={`rounded-2xl p-4 sm:px-6 flex items-center justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-gray-100 ${cardBg}`}
      style={cardStyle}
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl bg-white/70 rounded-full w-12 h-12 flex items-center justify-center shrink-0 shadow-sm">
          {habit.icon || '🎯'}
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight mb-0.5">{habit.name}</h3>
          {/* Fix 2 — Status text changes based on todayStatus */}
          <p className="text-xs sm:text-sm">
            {statusText}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Fix 2 & Fix 4 — Tick Button: w-10 h-10, filled green when done */}
        <button
          onClick={() => onLog(habit._id, 'done')}
          disabled={isUpdating}
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 disabled:opacity-50 ${
            isDone
              ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-500/30 scale-105'
              : 'border-gray-300 text-gray-400 hover:border-green-400 hover:bg-green-50 hover:text-green-500 active:scale-95'
          }`}
          aria-label="Mark as done"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </button>

        {/* Fix 2 & Fix 4 — Cross Button: w-10 h-10, filled red when missed */}
        <button
          onClick={() => onLog(habit._id, 'missed')}
          disabled={isUpdating}
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 disabled:opacity-50 ${
            isMissed
              ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/30 scale-105'
              : 'border-gray-300 text-gray-400 hover:border-red-400 hover:bg-red-50 hover:text-red-500 active:scale-95'
          }`}
          aria-label="Mark as missed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        <div className="w-px h-8 bg-gray-200 mx-1 sm:mx-2 hidden sm:block"></div>

        {/* Calendar Button */}
        <button
          onClick={() => navigate(`/calendar?habit=${habit._id}`)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors active:scale-95"
          aria-label="View calendar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
