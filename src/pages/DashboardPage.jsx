import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import HabitCard from '../components/habits/HabitCard';
import AddHabitModal from '../components/habits/AddHabitModal';
import { getTodayString } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingHabitId, setLoadingHabitId] = useState(null);

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

  const logMut = useMutation({
    mutationFn: async ({ habitId, date, status }) => {
      return api.post('/api/logs', { habitId, date, status });
    },
    onMutate: (variables) => {
      setLoadingHabitId(variables.habitId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      if (variables.status === 'done') {
        toast.success('🔥 Streak marked! Keep it up!', {
          style: { background: '#22C55E', color: 'white', fontWeight: '600' },
          duration: 2500,
          position: 'top-center',
        });
      } else if (variables.status === 'missed') {
        toast('Noted. Come back stronger tomorrow 💪', {
          style: { background: '#6B7280', color: 'white', fontWeight: '500' },
          duration: 2000,
          position: 'top-center',
        });
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update log.');
    },
    onSettled: () => {
      setLoadingHabitId(null);
    }
  });

  const handleLog = (habitId, status) => {
    logMut.mutate({ habitId, date: getTodayString(), status });
  };

  const habits = Array.isArray(habitsData) ? habitsData : [];
  const logs = Array.isArray(logsData) ? logsData : [];
  const todayStr = getTodayString();
  const dateDisplay = format(new Date(), 'EEEE, MMMM d');

  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';

  const completedTodayCount = habits.filter(h => {
    const habitKey = h._id;
    const log = logs.find(l => (l.habit === habitKey || l.habitId === habitKey) && l.date === todayStr);
    return log?.status === 'done';
  }).length;

  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;
  const isLoading = habitsLoading || logsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-24">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">

        {/* Header card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700 px-6 py-5 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Today</h1>
            <p className="text-base font-medium text-gray-600 dark:text-gray-400 mt-0.5">{dateDisplay}</p>
          </div>
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-base sm:text-lg text-right">
            {greeting},<br className="hidden sm:block" />{' '}
            <span className="text-indigo-700 dark:text-indigo-300 font-bold">
              {user?.firstName || user?.name?.split(' ')[0] || 'User'}!
            </span>
          </p>
        </div>

        {/* Progress bar card */}
        {!isLoading && totalHabits > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 px-6 py-4 mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Daily Progress</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-base">
                {completedTodayCount}/{totalHabits} &nbsp;
                <span className="text-indigo-500 dark:text-indigo-300 font-extrabold">{progressPercent}%</span>
              </span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden w-full">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Habits */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 mt-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {totalHabits === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 shadow-sm mt-8">
                <div className="text-7xl mb-4 bg-indigo-50 dark:bg-indigo-900/30 w-24 h-24 rounded-full flex items-center justify-center shrink-0">🌱</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 mt-2">No habits yet</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-10 max-w-sm text-base leading-relaxed">
                  Add your first habit to start building your discipline and tracking your daily progress.
                </p>
                <div className="relative animate-bounce text-indigo-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                  </svg>
                </div>
              </div>
            ) : (
              habits.map(habit => {
                const habitKey = habit._id;
                const todayLog = logs.find(l => (l.habit === habitKey || l.habitId === habitKey) && l.date === todayStr);
                const habitLogs = logs.filter(l => l.habit === habitKey || l.habitId === habitKey);
                return (
                  <HabitCard
                    key={habitKey}
                    habit={habit}
                    todayStatus={todayLog?.status || null}
                    allLogs={habitLogs}
                    onLog={handleLog}
                    isUpdating={loadingHabitId === habitKey}
                  />
                );
              })
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 md:bottom-12 md:right-12 w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/50 hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 z-40 group"
        aria-label="Add New Habit"
      >
        <svg className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
        </svg>
      </button>

      <AddHabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTrackingPeriod={Number(localStorage.getItem('defaultTrackingPeriod')) || 30}
      />
    </div>
  );
}
