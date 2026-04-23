import React from 'react';
import { getTodayString } from '../../utils/dateUtils';
import { format, parseISO, isAfter, isBefore, startOfDay, addDays } from 'date-fns';

export default function HabitCalendarGrid({ habit, logs = [], onLog }) {
  const todayStr = getTodayString();
  const todayObj = startOfDay(new Date());
  const pastLimitObj = addDays(todayObj, -7); // Allow retro-logging up to 7 days back

  // Resolve startDate — fallback to today if not set on the habit
  const startDateStr = habit.startDate || todayStr;
  const trackingPeriod = habit.trackingPeriod || 30;

  // Build window of exactly trackingPeriod dates starting from startDate
  const windowDates = [];
  const startObj = new Date(startDateStr + 'T00:00:00');
  for (let i = 0; i < trackingPeriod; i++) {
    const d = new Date(startObj);
    d.setDate(startObj.getDate() + i);
    windowDates.push(d.toISOString().split('T')[0]);
  }

  const endDateStr = windowDates[windowDates.length - 1];

  // Monday-first offset: (getDay() + 6) % 7  → Mon=0 … Sun=6
  const startDayOfWeek = (startObj.getDay() + 6) % 7;
  const emptyCells = Array.from({ length: startDayOfWeek }).map((_, i) => ({ id: `empty-${i}` }));

  // How many window days have passed including today
  const daysIntoPeriod = windowDates.filter(d => d <= todayStr).length;
  const progressPct = Math.round((daysIntoPeriod / trackingPeriod) * 100);

  // Build cell data + counters
  let doneCount = 0;
  let missedCount = 0;
  let remainingCount = 0;

  const cells = windowDates.map((dateStr, i) => {
    const log = logs.find(l => l.date === dateStr);
    const cellDateObj = parseISO(dateStr);

    const isToday = dateStr === todayStr;
    const isFuture = isAfter(cellDateObj, todayObj);
    const isPast = isBefore(cellDateObj, todayObj);
    const isValidRetroactive = isPast && !isBefore(cellDateObj, pastLimitObj);

    if (isFuture) remainingCount++;
    else if (log?.status === 'done') doneCount++;
    else if (log?.status === 'missed') missedCount++;

    return {
      dateStr,
      dayNum: i + 1,
      status: log?.status || null,
      isToday,
      isFuture,
      isPast,
      isValidRetroactive,
    };
  });

  const validDays = doneCount + missedCount;
  const rate = validDays > 0 ? Math.round((doneCount / validDays) * 100) : 0;

  const rangeLabel = `${format(parseISO(startDateStr), 'MMM d')} → ${format(parseISO(endDateStr), 'MMM d')}`;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

      {/* Habit header */}
      <div
        className="p-5 sm:p-6 flex items-center gap-4 bg-gray-50/70 border-b border-gray-100/80"
        style={{ borderLeft: `6px solid ${habit.colorHex || '#4F46E5'}` }}
      >
        <div className="text-3xl sm:text-4xl bg-white shadow-sm w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 border border-gray-50">
          {habit.icon || '🎯'}
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">{habit.name}</h3>
          <p className="text-sm text-gray-500 font-medium">{trackingPeriod}-day streak tracker</p>
        </div>
      </div>

      {/* Streak progress bar */}
      <div className="px-5 sm:px-7 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-indigo-600 font-semibold text-sm">Day {daysIntoPeriod} of {trackingPeriod}</span>
          <span className="text-gray-400 text-xs font-medium">{rangeLabel}</span>
        </div>
        <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 font-medium mt-1.5">{progressPct}% of goal complete</p>
      </div>

      {/* Day-of-week header — gradient colored */}
      <div className="grid grid-cols-7 bg-gradient-to-r from-indigo-500 to-purple-600">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-center text-white text-[10px] sm:text-xs font-semibold py-3 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="p-3 sm:p-5">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty alignment cells */}
          {emptyCells.map(cell => (
            <div key={cell.id} className="aspect-square bg-transparent" />
          ))}

          {cells.map(cell => {
            const isClickBlocked = cell.isFuture || (cell.isPast && !cell.isValidRetroactive && !cell.status);
            let bgClass = '';
            let textClass = '';
            let ringClass = '';
            let cursorClass = isClickBlocked
              ? 'cursor-not-allowed'
              : 'cursor-pointer active:scale-95 hover:z-10 relative';
            let content = null;

            if (cell.status === 'done') {
              bgClass = 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-sm rounded-xl';
              textClass = 'text-white/80 text-[10px] sm:text-xs';
              content = (
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white absolute inset-0 m-auto drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              );
            } else if (cell.status === 'missed') {
              bgClass = 'bg-gradient-to-br from-red-400 to-rose-500 shadow-sm rounded-xl';
              textClass = 'text-white/80 text-[10px] sm:text-xs';
              content = (
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white absolute inset-0 m-auto drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              );
            } else if (cell.isToday) {
              bgClass = 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md rounded-xl ring-2 ring-indigo-300 ring-offset-1';
              textClass = 'text-white text-[10px] sm:text-xs font-extrabold';
              ringClass = 'animate-pulse';
            } else if (cell.isFuture) {
              bgClass = 'bg-gray-50 rounded-xl';
              textClass = 'text-gray-300 text-[10px] sm:text-xs';
            } else if (cell.isValidRetroactive) {
              bgClass = 'bg-white border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl';
              textClass = 'text-gray-400 text-[10px] sm:text-xs';
            } else {
              // Too old to log
              bgClass = 'bg-gray-50/50 rounded-xl';
              textClass = 'text-gray-200 text-[10px] sm:text-xs';
            }

            const handleClick = () => {
              if (isClickBlocked) return;
              if (cell.status === 'done') onLog(habit._id, cell.dateStr, 'missed');
              else if (cell.status === 'missed') onLog(habit._id, cell.dateStr, 'done');
              else onLog(habit._id, cell.dateStr, 'done');
            };

            return (
              <div
                key={cell.dateStr}
                onClick={handleClick}
                className={`relative aspect-square p-1 sm:p-1.5 transition-all duration-150 ${bgClass} ${cursorClass} ${ringClass}`}
              >
                {/* Day number (window index) */}
                <span className={`absolute top-1 left-1.5 font-semibold leading-none ${textClass}`}>
                  {cell.dayNum}
                </span>
                {/* Tiny calendar date */}
                <span className={`absolute bottom-1 right-1 text-[8px] sm:text-[9px] leading-none opacity-70 ${
                  cell.status || cell.isToday ? 'text-white' : 'text-gray-400'
                }`}>
                  {format(parseISO(cell.dateStr), 'M/d')}
                </span>
                {content}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-0 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50">
        <div className="px-3 sm:px-6 py-4 text-center border-r border-gray-100">
          <p className="text-xl sm:text-3xl font-black text-green-500">{doneCount}</p>
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Done</p>
        </div>
        <div className="px-3 sm:px-6 py-4 text-center border-r border-gray-100">
          <p className="text-xl sm:text-3xl font-black text-red-500">{missedCount}</p>
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Missed</p>
        </div>
        <div className="px-3 sm:px-6 py-4 text-center border-r border-gray-100">
          <p className="text-xl sm:text-3xl font-black text-gray-500">{remainingCount}</p>
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Remain</p>
        </div>
        <div className="px-3 sm:px-6 py-4 text-center">
          <p className="text-xl sm:text-3xl font-black text-indigo-600">{rate}%</p>
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Rate</p>
        </div>
      </div>
    </div>
  );
}
