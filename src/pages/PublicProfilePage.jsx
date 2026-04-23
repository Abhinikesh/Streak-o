import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import axiosPublic from '../api/axiosPublic';
import Spinner from '../components/ui/Spinner';

function MiniDots({ habit, logs }) {
  const days = useMemo(() => {
    const result = [];
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const log = logs.find(l => l.habitId?.toString() === habit._id?.toString() && l.date === ds);
      result.push({ date: ds, status: log?.status || null });
    }
    return result;
  }, [habit, logs]);

  return (
    <div className="flex gap-1 mt-2">
      {days.map(d => (
        <div
          key={d.date}
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: d.status === 'done'
              ? (habit.colorHex || '#22C55E')
              : d.status === 'missed'
              ? '#EF4444'
              : '#E5E7EB',
          }}
          title={d.date}
        />
      ))}
    </div>
  );
}

export default function PublicProfilePage() {
  const { shareCode } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['publicProfile', shareCode],
    queryFn: async () => {
      const res = await axiosPublic.get(`/api/social/u/${shareCode}`);
      return res.data;
    },
    retry: false,
  });

  const habits = data?.habits || [];
  const logs = data?.logs || [];
  const stats = data?.stats || {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-10 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profile not found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This profile is private or doesn't exist.</p>
          <Link to="/login" className="inline-block bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all">
            Go to StreakBoard
          </Link>
        </div>
      </div>
    );
  }

  const initChar = data.name?.charAt(0).toUpperCase() || '?';
  const memberSince = data.memberSince ? format(parseISO(data.memberSince), 'MMMM yyyy') : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-16 font-sans">
      {/* Top bar */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center gap-3">
        <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">StreakBoard</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">— Public Profile</span>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 space-y-5">
        {/* Profile header */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="flex flex-col items-center px-6 pb-6 -mt-10">
            {data.avatar ? (
              <img src={data.avatar} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white dark:border-gray-800">
                {initChar}
              </div>
            )}
            <div className="text-center mt-2">
              <div className="flex items-center justify-center gap-2 mt-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{data.name}</h1>
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full">Public Profile</span>
              </div>
              {memberSince && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Member since {memberSince}</p>}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Habits', value: habits.length },
              { label: 'Success Rate', value: `${stats.overallRate || 0}%` },
              { label: 'Best Streak', value: `${stats.longestStreak || 0}🔥` },
              { label: 'Days Active', value: stats.daysActive || 0 },
            ].map(s => (
              <div key={s.label} className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-3 text-center border border-indigo-100 dark:border-indigo-800">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{s.value}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Habits section */}
        {habits.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{data.name}'s Habits</h2>
            <div className="space-y-3">
              {habits.map(habit => {
                const hLogs = logs.filter(l => l.habitId?.toString() === habit._id?.toString());
                const doneLogs = hLogs.filter(l => l.status === 'done');
                const rate = hLogs.length > 0 ? Math.round((doneLogs.length / hLogs.length) * 100) : 0;

                const today = new Date(); today.setHours(0,0,0,0);
                let streak = 0;
                const doneDates = new Set(doneLogs.map(l => l.date));
                let cur = new Date(today);
                while (doneDates.has(cur.toISOString().split('T')[0])) {
                  streak++;
                  cur.setDate(cur.getDate() - 1);
                }

                return (
                  <div key={habit._id} className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4"
                    style={{ borderLeft: `4px solid ${habit.colorHex || '#4F46E5'}` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{habit.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{habit.name}</p>
                          {streak > 0 && (
                            <p className="text-xs font-medium" style={{ color: habit.colorHex || '#4F46E5' }}>🔥 {streak} day streak</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{rate}%</span>
                    </div>
                    <MiniDots habit={habit} logs={logs} />
                    <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: habit.colorHex || '#4F46E5' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="text-center pt-2 pb-6 space-y-3">
          <Link to="/login" className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md">
            Track your own habits on StreakBoard →
          </Link>
          <p className="text-xs text-gray-400 dark:text-gray-500">Made with StreakBoard</p>
        </div>
      </main>
    </div>
  );
}
