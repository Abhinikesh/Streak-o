import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import HabitCalendarGrid from '../components/habits/HabitCalendarGrid';
import { getMonthString } from '../utils/dateUtils';
import Spinner from '../components/ui/Spinner';
import ShareModal from '../components/habits/ShareModal';
import { useAuth } from '../context/AuthContext';

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [selectedHabitId, setSelectedHabitId] = useState(searchParams.get('habit') || null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [shareHabitObj, setShareHabitObj] = useState(null);

  useEffect(() => {
    const habitParam = searchParams.get('habit');
    if (habitParam && !selectedHabitId) setSelectedHabitId(habitParam);
  }, [searchParams, selectedHabitId]);

  const handleSelectHabit = (id) => {
    setSelectedHabitId(id);
    setSearchParams({ habit: id });
  };

  // ── Habits query ───────────────────────────────────────────────
  const { data: habitsData = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const res = await api.get('/api/habits');
      return res.data.habits || res.data || [];
    }
  });

  const habits = Array.isArray(habitsData) ? habitsData : [];

  // ── Logs query — keyed by habit + month (used for grid rendering) ──
  const monthStr = getMonthString(currentMonth);
  const { data: logsData = [], isLoading: logsLoading } = useQuery({
    queryKey: ['logs', selectedHabitId, monthStr],
    queryFn: async () => {
      const res = await api.get(`/api/logs/${selectedHabitId}?month=${monthStr}`);
      return res.data.logs || res.data || [];
    },
    enabled: !!selectedHabitId
  });

  const logs = Array.isArray(logsData) ? logsData : [];

  // ── All logs query — no month filter (used for stats bar) ─────────
  const { data: allLogsData } = useQuery({
    queryKey: ['allLogs', selectedHabitId],
    queryFn: async () => {
      const res = await api.get(`/api/logs/${selectedHabitId}`);
      return res.data.logs || res.data || [];
    },
    enabled: !!selectedHabitId
  });

  const allLogs = Array.isArray(allLogsData) ? allLogsData : [];

  // ── Log mutation ───────────────────────────────────────────────
  const logMutation = useMutation({
    mutationFn: ({ habitId, date, status }) =>
      api.post('/api/logs', { habitId, date, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', selectedHabitId, monthStr] });
      queryClient.invalidateQueries({ queryKey: ['allLogs', selectedHabitId] });
      toast.success('Logged!', { duration: 1500 });
    },
    onError: () => {
      toast.error('Failed to save. Try again.');
    }
  });

  const handleLog = (habitId, date, status) => {
    logMutation.mutate({ habitId, date, status });
  };

  // ── Month navigation ───────────────────────────────────────────
  const today = new Date();
  const canGoNext =
    currentMonth.getFullYear() < today.getFullYear() ||
    (currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() < today.getMonth());

  const prevMonth = () =>
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => {
    if (canGoNext) setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const selectedHabitObj = habits.find(h => h._id === selectedHabitId);

  // ── Derived stats for ShareModal (client-side, no extra API calls) ─────────
  const { currentStreak, bestStreak, completionRate } = useMemo(() => {
    const doneLogs   = allLogs.filter(l => l.status === 'done');
    const missedLogs = allLogs.filter(l => l.status === 'missed');
    const total      = doneLogs.length + missedLogs.length;
    const rate       = total > 0 ? Math.round((doneLogs.length / total) * 100) : 0;

    const doneDates = doneLogs.map(l => l.date).sort();
    const doneDateSet = new Set(doneDates);

    // Current streak (backwards from today)
    let cur = 0;
    const todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    const todayStr = todayD.toISOString().split('T')[0];
    let check = new Date(todayD);
    for (let i = 0; i < 365; i++) {
      const ds = check.toISOString().split('T')[0];
      if (doneDateSet.has(ds)) { cur++; check.setDate(check.getDate() - 1); }
      else if (ds === todayStr) { check.setDate(check.getDate() - 1); }
      else break;
    }

    // Best streak (longest consecutive run)
    let best = 0, run = 0;
    for (let i = 0; i < doneDates.length; i++) {
      if (i === 0) { run = 1; continue; }
      const prev = new Date(doneDates[i - 1] + 'T00:00:00');
      const curr = new Date(doneDates[i]     + 'T00:00:00');
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      run = diff === 1 ? run + 1 : 1;
      if (run > best) best = run;
    }
    if (run > best) best = run;

    return { currentStreak: cur, bestStreak: best, completionRate: rate };
  }, [allLogs]);

  const currentMonthLabel = format(currentMonth, 'MMMM yyyy');
  const userName = user?.name || user?.email?.split('@')[0] || 'You';

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-24 font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">Calendar</h1>

        {habitsLoading ? (
          <div className="flex justify-center py-10"><Spinner size="md" /></div>
        ) : habits.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl text-center border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              You don't have any habits yet. Start by adding one from the Dashboard!
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Habit selector pills */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 py-3">
              <div className="flex overflow-x-auto gap-3 snap-x no-scrollbar">
                {habits.map(habit => {
                  const isSelected = habit._id === selectedHabitId;
                  return (
                    <button
                      key={habit._id}
                      onClick={() => handleSelectHabit(habit._id)}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 snap-center focus:outline-none ${
                        isSelected
                          ? 'text-white shadow-md scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      style={isSelected ? {
                        backgroundColor: habit.colorHex || '#4F46E5',
                        boxShadow: `0 4px 14px 0 ${habit.colorHex || '#4F46E5'}40`
                      } : {}}
                    >
                      <span className="text-base leading-none">{habit.icon}</span>
                      <span className="whitespace-nowrap">{habit.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedHabitId ? (
              <div className="space-y-5">
                {/* Month navigation + Share button */}
                <div className="flex items-center gap-3 justify-center flex-wrap">
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-6 py-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <button
                      onClick={prevMonth}
                      className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                      aria-label="Previous month"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-base font-semibold text-gray-800 dark:text-gray-100 tabular-nums tracking-wide px-4">
                      {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button
                      onClick={nextMonth}
                      disabled={!canGoNext}
                      className={`p-2 -mr-2 rounded-full transition-colors focus:outline-none ${
                        !canGoNext
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                      aria-label="Next month"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                  {/* Share button */}
                  {selectedHabitObj && (
                    <button
                      onClick={() => setShareHabitObj(selectedHabitObj)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm hover:shadow-md hover:scale-105 transition-all"
                    >
                      <span>Share</span>
                      <span>🚀</span>
                    </button>
                  )}
                </div>

                {logsLoading ? (
                  <div className="h-96 flex items-center justify-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  selectedHabitObj && (
                    <HabitCalendarGrid
                      habit={selectedHabitObj}
                      logs={logs}
                      allLogs={allLogs}
                      currentMonth={currentMonth}
                      onLog={handleLog}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <div className="text-6xl mb-6 bg-indigo-50 dark:bg-indigo-900/30 w-24 h-24 rounded-full flex items-center justify-center rotate-12 drop-shadow-sm">📅</div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Calendar Explorer</h3>
                <p className="text-gray-600 dark:text-gray-300 font-medium text-center">
                  Select a habit above<br className="hidden sm:block" /> to view its monthly calendar.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Share Modal */}
      <ShareModal
        isOpen={!!shareHabitObj}
        onClose={() => setShareHabitObj(null)}
        habit={shareHabitObj}
        logs={allLogs}
        currentStreak={currentStreak}
        bestStreak={bestStreak}
        completionRate={completionRate}
        userName={userName}
        month={currentMonthLabel}
      />
    </div>
  );
}
