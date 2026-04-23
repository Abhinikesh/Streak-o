import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import Spinner from '../components/ui/Spinner';

export default function JournalPage() {
  const { data: habitsData = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const res = await api.get('/api/habits');
      return res.data.habits || res.data || [];
    }
  });

  const { data: logsData = [], isLoading: logsLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const res = await api.get('/api/logs/all');
      return res.data.logs || res.data || [];
    }
  });

  const habits = Array.isArray(habitsData) ? habitsData : [];
  const logs = Array.isArray(logsData) ? logsData : [];

  // Filter logs that have a non-empty note, group by date descending
  const groupedNotes = useMemo(() => {
    const withNotes = logs.filter(l => l.note && l.note.trim() !== '');
    const byDate = {};
    withNotes.forEach(log => {
      if (!byDate[log.date]) byDate[log.date] = [];
      byDate[log.date].push(log);
    });
    // Sort dates descending
    return Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a));
  }, [logs]);

  const getHabit = (log) => {
    const hid = log.habit?.toString() || log.habitId?.toString();
    return habits.find(h => h._id === hid || h._id?.toString() === hid);
  };

  const isLoading = habitsLoading || logsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-24 font-sans">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">My Journal</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Your daily habit notes</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : groupedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-6xl mb-5 bg-indigo-50 dark:bg-indigo-900/30 w-24 h-24 rounded-full flex items-center justify-center">📝</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No notes yet</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center text-sm max-w-xs leading-relaxed">
              Add notes when marking your habits on the Dashboard to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedNotes.map(([date, dateLogs]) => {
              let dateLabel = date;
              try { dateLabel = format(parseISO(date), 'EEEE, MMMM d'); } catch {}

              return (
                <div key={date}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{dateLabel}</h2>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  </div>

                  {/* Note cards */}
                  <div className="space-y-3 pl-5">
                    {dateLogs.map(log => {
                      const habit = getHabit(log);
                      const isDone = log.status === 'done';
                      return (
                        <div
                          key={log._id || `${log.habitId}-${log.date}`}
                          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{habit?.icon || '🎯'}</span>
                              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                {habit?.name || 'Unknown Habit'}
                              </span>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              isDone
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            }`}>
                              {isDone ? '✓ Done' : '✕ Missed'}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic border-l-2 border-indigo-200 dark:border-indigo-700 pl-3">
                            "{log.note}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
