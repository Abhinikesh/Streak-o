import React from 'react';
import { getDaysInMonth, getTodayString } from '../../utils/dateUtils';
import { parseISO, isAfter, isBefore, startOfDay, addDays } from 'date-fns';

export default function HabitCalendarGrid({ habit, logs = [], allLogs = [], currentMonth, onLog }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1; // 1-indexed

  const daysInMonthArray = getDaysInMonth(year, month);
  const todayStr = getTodayString();
  const todayObj = startOfDay(new Date());
  const pastLimitObj = addDays(todayObj, -7);

  // Monday-first alignment offset
  const firstDayOfMonth = new Date(year, currentMonth.getMonth(), 1);
  const rawDow = firstDayOfMonth.getDay(); // 0=Sun
  const emptyCellsCount = rawDow === 0 ? 6 : rawDow - 1;
  const emptyCells = Array.from({ length: emptyCellsCount }).map((_, i) => ({ id: `empty-${i}` }));

  // startDate / endDate from habit
  const startDate = habit.startDate ? new Date(habit.startDate + 'T00:00:00') : null;
  const endDate = startDate && habit.trackingPeriod
    ? new Date(new Date(startDate).setDate(startDate.getDate() + habit.trackingPeriod - 1))
    : null;

  // Counters for grid cell loop (month view only)
  // Stats counters are computed from allLogs below, not here

  const cells = daysInMonthArray.map(dateStr => {
    const log = logs.find(l => l.date === dateStr);
    const dayNumber = parseInt(dateStr.split('-')[2], 10);
    const cellDateObj = parseISO(dateStr);
    const cellMidnight = new Date(dateStr + 'T00:00:00');

    const isToday = dateStr === todayStr;
    const isFuture = isAfter(cellDateObj, todayObj);
    const isPast = isBefore(cellDateObj, todayObj);
    const isValidRetroactive = isPast && !isBefore(cellDateObj, pastLimitObj);
    const isBeforeStart = startDate ? cellMidnight < startDate : false;
    const isAfterEnd = endDate ? cellMidnight > endDate : false;

    return {
      dateStr, dayNumber, status: log?.status || null,
      isToday, isFuture, isPast, isValidRetroactive,
      isBeforeStart, isAfterEnd,
    };
  });

  // ── Stats — use allLogs filtered to streak window ──────────────────
  const todayStr2 = new Date().toISOString().split('T')[0];
  const todayD = new Date(todayStr2 + 'T00:00:00');
  const habitStartDate = startDate || todayD;
  const trackingPeriod = Number(habit.trackingPeriod) || 30;

  const endDate2 = new Date(habitStartDate);
  endDate2.setDate(habitStartDate.getDate() + trackingPeriod - 1);

  const windowLogs = (allLogs.length ? allLogs : logs).filter(log => {
    const ld = new Date(log.date + 'T00:00:00');
    return ld >= habitStartDate && ld <= endDate2;
  });

  const doneCount = windowLogs.filter(l => l.status === 'done').length;
  const missedCount = windowLogs.filter(l => l.status === 'missed').length;

  // REMAIN: inclusive days elapsed from startDate to today
  const msPerDay2 = 1000 * 60 * 60 * 24;
  const diffMs = todayD.getTime() - habitStartDate.getTime();
  const daysElapsed = Math.floor(diffMs / msPerDay2) + 1;
  const safeElapsed = Math.min(Math.max(daysElapsed, 0), trackingPeriod);
  const remainDays = Math.max(trackingPeriod - safeElapsed, 0);

  const totalLogged = doneCount + missedCount;
  const rate = totalLogged > 0 ? Math.round((doneCount / totalLogged) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">

      {/* Habit header */}
      <div
        className="p-5 sm:p-6 flex items-center gap-4 bg-gray-50/70 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700"
        style={{ borderLeft: `6px solid ${habit.colorHex || '#4F46E5'}` }}
      >
        <div className="text-3xl sm:text-4xl bg-white dark:bg-gray-700 shadow-sm w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 border border-gray-50 dark:border-gray-600">
          {habit.icon || '🎯'}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{habit.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{habit.trackingPeriod || 30}-day streak tracker</p>
        </div>
      </div>

      {/* Day-of-week header — gradient */}
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

          {/* Day cells */}
          {cells.map(cell => {
            // Determine clickability
            const isClickBlocked =
              cell.isFuture ||
              cell.isBeforeStart ||
              cell.isAfterEnd ||
              (!cell.isValidRetroactive && !cell.isToday && !cell.status && cell.isPast);

            const handleClick = () => {
              if (isClickBlocked) return;
              if (cell.status === 'done') onLog(habit._id, cell.dateStr, 'missed');
              else if (cell.status === 'missed') onLog(habit._id, cell.dateStr, 'done');
              else onLog(habit._id, cell.dateStr, 'done');
            };

            // Determine styles
            let bgClass = '';
            let textClass = '';
            let cursorClass = isClickBlocked ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95';
            let ringClass = '';
            let content = null;

            if (cell.isBeforeStart) {
              bgClass = 'bg-gray-100 dark:bg-gray-800 rounded-xl';
              textClass = 'text-gray-300 dark:text-gray-600 text-xs font-medium';
            } else if (cell.status === 'done') {
              bgClass = 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-sm rounded-xl';
              textClass = 'text-white text-xs font-bold';
              content = (
                <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white absolute inset-0 m-auto drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              );
            } else if (cell.status === 'missed') {
              bgClass = 'bg-gradient-to-br from-red-400 to-rose-500 shadow-sm rounded-xl';
              textClass = 'text-white text-xs font-bold';
              content = (
                <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white absolute inset-0 m-auto drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              );
            } else if (cell.isToday) {
              bgClass = 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md rounded-xl ring-2 ring-indigo-300 ring-offset-1';
              textClass = 'text-white text-xs font-bold';
              ringClass = 'animate-pulse';
            } else if (cell.isFuture || cell.isAfterEnd) {
              bgClass = 'bg-gray-50 dark:bg-gray-800 rounded-xl';
              textClass = 'text-gray-400 dark:text-gray-500 text-xs font-medium';
            } else if (cell.isValidRetroactive) {
              bgClass = 'bg-white dark:bg-gray-700 border-2 border-dashed border-gray-200 dark:border-gray-500 hover:border-indigo-300 dark:hover:border-indigo-500 rounded-xl';
              textClass = 'text-gray-700 dark:text-gray-200 text-xs font-semibold';
            } else {
              bgClass = 'bg-gray-50 dark:bg-gray-800/50 rounded-xl';
              textClass = 'text-gray-300 dark:text-gray-600 text-xs font-medium';
            }

            return (
              <div
                key={cell.dateStr}
                onClick={handleClick}
                className={`relative aspect-square p-1 sm:p-1.5 transition-all duration-150 ${bgClass} ${cursorClass} ${ringClass}`}
              >
                <span className={`absolute top-1 left-1.5 leading-none ${textClass}`}>
                  {cell.dayNumber}
                </span>
                {content}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 border-t border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
        <div className="px-3 sm:px-6 py-4 text-center border-r border-gray-100 dark:border-gray-700">
          <p className="text-2xl font-bold text-green-500 dark:text-green-400">{doneCount}</p>
          <p className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mt-0.5">Done</p>
        </div>
        <div className="px-3 sm:px-6 py-4 text-center border-r border-gray-100 dark:border-gray-700">
          <p className="text-2xl font-bold text-red-500 dark:text-red-400">{missedCount}</p>
          <p className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mt-0.5">Missed</p>
        </div>
        <div className="px-3 sm:px-6 py-4 text-center border-r border-gray-100 dark:border-gray-700">
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{remainDays}</p>
          <p className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mt-0.5">Remain</p>
        </div>
        <div className="px-3 sm:px-6 py-4 text-center">
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{rate}%</p>
          <p className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mt-0.5">Rate</p>
        </div>
      </div>
    </div>
  );
}
