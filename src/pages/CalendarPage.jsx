import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import HabitCalendarGrid from '../components/habits/HabitCalendarGrid';
import Spinner from '../components/ui/Spinner';

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedHabitId, setSelectedHabitId] = useState(searchParams.get('habit') || null);

  useEffect(() => {
    const habitParam = searchParams.get('habit');
    if (habitParam && !selectedHabitId) setSelectedHabitId(habitParam);
  }, [searchParams, selectedHabitId]);

  const handleSelectHabit = (id) => {
    setSelectedHabitId(id);
    setSearchParams({ habit: id });
  };

  const { data: habitsData = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const res = await api.get('/api/habits');
      return res.data.habits || res.data || [];
    }
  });

  const habits = Array.isArray(habitsData) ? habitsData : [];

  const { data: allLogsData = [], isLoading: logsLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const res = await api.get('/api/logs/all');
      return res.data.logs || res.data || [];
    },
    enabled: !!selectedHabitId
  });

  const logs = (Array.isArray(allLogsData) ? allLogsData : [])
    .filter(l => l.habit === selectedHabitId || l.habitId === selectedHabitId);

  const logMut = useMutation({
    mutationFn: async ({ habitId, date, status }) => {
      return api.post('/api/logs', { habitId, date, status });
    },
    onMutate: async ({ habitId, date, status }) => {
      const queryKey = ['logs'];
      await queryClient.cancelQueries({ queryKey });
      const previousLogs = queryClient.getQueryData(queryKey) || [];
      queryClient.setQueryData(queryKey, old => {
        if (!old) return [{ habitId, date, status }];
        const existing = old.find(l => (l.habit === habitId || l.habitId === habitId) && l.date === date);
        if (existing) return old.map(l => (l.habit === habitId || l.habitId === habitId) && l.date === date ? { ...l, status } : l);
        return [...old, { habitId, date, status }];
      });
      return { previousLogs, queryKey };
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData(context.queryKey, context.previousLogs);
      toast.error(err.response?.data?.message || 'Failed to sync log.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    }
  });

  const handleLog = (habitId, date, status) => logMut.mutate({ habitId, date, status });
  const selectedHabitObj = habits.find(h => h._id === selectedHabitId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-24 font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">Calendar</h1>

        {habitsLoading ? (
          <div className="flex justify-center py-10"><Spinner size="md" /></div>
        ) : habits.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl text-center border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 font-medium">You don't have any habits yet. Start by adding one from the Dashboard!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Habit selector pills card */}
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
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      style={isSelected ? { backgroundColor: habit.colorHex || '#4F46E5', boxShadow: `0 4px 14px 0 ${habit.colorHex || '#4F46E5'}40` } : {}}
                    >
                      <span className="text-base leading-none">{habit.icon}</span>
                      <span className="whitespace-nowrap">{habit.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedHabitId ? (
              logsLoading ? (
                <div className="h-64 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700">
                  <Spinner size="lg" />
                </div>
              ) : (
                selectedHabitObj && (
                  <HabitCalendarGrid habit={selectedHabitObj} logs={logs} onLog={handleLog} />
                )
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <div className="text-6xl mb-6 bg-indigo-50 dark:bg-indigo-900/30 w-24 h-24 rounded-full flex items-center justify-center rotate-12 drop-shadow-sm">📅</div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Calendar Explorer</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-center">
                  Select a habit from above<br className="hidden sm:block" /> to view its full streak window.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
