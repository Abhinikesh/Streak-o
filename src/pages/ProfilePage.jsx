import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../api/axios';
import Navbar from '../components/layout/Navbar';
import Spinner from '../components/ui/Spinner';
import AddHabitModal from '../components/habits/AddHabitModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfilePage() {
  const { user, login, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [defaultTrackingPeriod, setDefaultTrackingPeriod] = useState(
    () => Number(localStorage.getItem('defaultTrackingPeriod')) || 30
  );
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('reminderTime') || '09:00');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('soundEnabled') !== 'false');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [editHabitName, setEditHabitName] = useState('');
  const [editHabitIcon, setEditHabitIcon] = useState('💪');
  const [editHabitColor, setEditHabitColor] = useState('#4F46E5');
  const [editHabitPeriod, setEditHabitPeriod] = useState(30);
  const [deletingHabitId, setDeletingHabitId] = useState(null);

  useEffect(() => { localStorage.setItem('defaultTrackingPeriod', String(defaultTrackingPeriod)); }, [defaultTrackingPeriod]);
  useEffect(() => { localStorage.setItem('reminderTime', reminderTime); }, [reminderTime]);
  useEffect(() => { localStorage.setItem('soundEnabled', String(soundEnabled)); }, [soundEnabled]);

  const icons = ['💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '✍️', '🎯', '🎸', '🧹', '💊'];
  const colors = [
    { hex: '#4F46E5' }, { hex: '#22C55E' }, { hex: '#F59E0B' },
    { hex: '#EF4444' }, { hex: '#EC4899' }, { hex: '#14B8A6' },
  ];
  const presets = [30, 60, 90];

  const { data: habitsData = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => { const res = await api.get('/api/habits'); return res.data.habits || res.data || []; }
  });
  const { data: logsData = [], isLoading: logsLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: async () => { const res = await api.get('/api/logs/all'); return res.data.logs || res.data || []; }
  });
  const { data: shareInfo = {} } = useQuery({
    queryKey: ['shareInfo'],
    queryFn: async () => { const r = await api.get('/api/social/my-share'); return r.data; }
  });

  const habits = Array.isArray(habitsData) ? habitsData : [];
  const logs = Array.isArray(logsData) ? logsData : [];

  const userName = user?.name || user?.firstName || '';
  const displayName = userName || user?.email?.split('@')[0] || 'User';
  const initChar = displayName.charAt(0).toUpperCase();
  const createdAtDisplay = user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'April 2025';

  const { totalLogs, totalDone, uniqueActiveDates } = useMemo(() => {
    let done = 0;
    const uniqueDates = new Set();
    logs.forEach(log => { if (log.status === 'done') { done++; uniqueDates.add(log.date); } });
    return { totalLogs: logs.length, totalDone: done, uniqueActiveDates: uniqueDates.size };
  }, [logs]);

  const updateProfileMut = useMutation({
    mutationFn: async (payload) => api.put('/api/auth/me', payload),
    onSuccess: async () => { await login(token); toast.success('Profile updated!'); setIsEditingProfile(false); },
    onError: () => toast.error('Failed to update profile.')
  });

  const updateHabitMut = useMutation({
    mutationFn: async ({ id, payload }) => api.put(`/api/habits/${id}`, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); setEditingHabitId(null); toast.success('Habit updated!'); },
    onError: () => toast.error('Failed to update habit.')
  });

  const deleteHabitMut = useMutation({
    mutationFn: async (id) => api.delete(`/api/habits/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); setDeletingHabitId(null); toast.success('Habit removed.'); },
    onError: () => toast.error('Failed to remove habit.')
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editProfileName.trim()) return;
    updateProfileMut.mutate({ name: editProfileName, firstName: editProfileName });
  };

  const startEditingHabit = (h) => {
    setEditingHabitId(h._id); setEditHabitName(h.name);
    setEditHabitIcon(h.icon || '💪'); setEditHabitColor(h.colorHex || '#4F46E5');
    setEditHabitPeriod(h.trackingPeriod || 30); setDeletingHabitId(null);
  };

  const handleSaveHabitEdit = (e, id) => {
    e.preventDefault();
    if (!editHabitName.trim()) return;
    const period = Number(editHabitPeriod);
    if (!period || period < 7 || period > 365) { toast.error('Please enter between 7 and 365 days'); return; }
    updateHabitMut.mutate({ id, payload: { name: editHabitName, icon: editHabitIcon, colorHex: editHabitColor, trackingPeriod: period } });
  };

  if (habitsLoading || logsLoading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-24 items-center"><Spinner size="lg" /></div>;
  }

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 font-sans pb-24">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">Profile</h1>
        <div className="space-y-5">

          {/* Section 1: Profile Header Card */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Decorative banner */}
            <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="flex flex-col items-center px-6 pb-6 -mt-12">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-white dark:border-gray-800">
                  {initChar}
                </div>
              )}
              {!isEditingProfile ? (
                <div className="text-center mt-3 w-full max-w-sm">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-3 py-1 rounded-full">Active</span>
                  </div>
                  {user?.email && <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>}
                  <button
                    onClick={() => { setEditProfileName(displayName); setIsEditingProfile(true); }}
                    className="mt-4 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl px-5 py-2 text-sm font-medium transition-all"
                  >Edit Profile</button>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Member since {createdAtDisplay}</p>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="w-full max-w-xs space-y-3 mt-3">
                  <input
                    type="text" value={editProfileName} onChange={e => setEditProfileName(e.target.value)} autoFocus
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-900 dark:text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={updateProfileMut.isPending} className="flex-1 bg-indigo-600 text-white font-semibold py-2 rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-75">
                      {updateProfileMut.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Section 2: Stats Row */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Habits', value: habits.length },
                { label: 'Total Logs', value: totalLogs },
                { label: 'Done Logs', value: totalDone },
                { label: 'Days Active', value: uniqueActiveDates },
              ].map(stat => (
                <div key={stat.label} className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 text-center border border-indigo-100 dark:border-indigo-800">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stat.value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: My Habits */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Habits</h2>
              <button onClick={() => setIsAddHabitModalOpen(true)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                Add New
              </button>
            </div>
            {habits.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-200 dark:border-gray-600 rounded-2xl">
                <p className="text-gray-500 dark:text-gray-400 font-medium">No habits yet. Add your first one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map(habit => (
                  <div key={habit._id} className="rounded-2xl border border-gray-100 dark:border-gray-600 overflow-hidden">
                    {editingHabitId !== habit._id ? (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 hover:shadow-sm transition-all">
                        <span className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 border-l-4" style={{ borderLeftColor: habit.colorHex || '#4F46E5', backgroundColor: `${habit.colorHex}20` }}>
                          {habit.icon || '🎯'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="block font-semibold text-gray-900 dark:text-white text-base truncate">{habit.name}</span>
                          <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">{habit.trackingPeriod || 30} days</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {deletingHabitId === habit._id ? (
                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 py-1.5 px-3 rounded-xl border border-red-100 dark:border-red-800">
                              <span className="text-sm font-semibold text-red-700 dark:text-red-400">Sure?</span>
                              <button onClick={() => deleteHabitMut.mutate(habit._id)} disabled={deleteHabitMut.isPending} className="text-xs font-bold bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 disabled:opacity-70">Yes</button>
                              <button onClick={() => setDeletingHabitId(null)} className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg">No</button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => startEditingHabit(habit)} className="w-9 h-9 rounded-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 flex items-center justify-center text-gray-400 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all" title="Edit">✏️</button>
                              <button onClick={() => setDeletingHabitId(habit._id)} className="w-9 h-9 rounded-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 flex items-center justify-center text-gray-400 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-all" title="Delete">🗑️</button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={(e) => handleSaveHabitEdit(e, habit._id)} className="p-4 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-800 rounded-2xl shadow-sm space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Habit Name</label>
                          <input type="text" required value={editHabitName} onChange={e => setEditHabitName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Icon</label>
                            <div className="grid grid-cols-6 gap-1.5">
                              {icons.map(icon => (
                                <button key={icon} type="button" onClick={() => setEditHabitIcon(icon)}
                                  className={`w-9 h-9 text-xl rounded-lg flex items-center justify-center transition-all ${editHabitIcon === icon ? 'bg-indigo-100 dark:bg-indigo-900/50 outline outline-2 outline-indigo-400' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                >{icon}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Color</label>
                            <div className="flex gap-2 flex-wrap">
                              {colors.map(color => (
                                <button key={color.hex} type="button" onClick={() => setEditHabitColor(color.hex)}
                                  className="w-9 h-9 rounded-full border-2 border-white transition-transform"
                                  style={{ backgroundColor: color.hex, outline: editHabitColor === color.hex ? `3px solid ${color.hex}` : undefined, outlineOffset: '2px', transform: editHabitColor === color.hex ? 'scale(1.15)' : 'scale(1)' }} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Tracking Period</label>
                          <div className="flex gap-2 mb-1.5">
                            {presets.map(days => (
                              <button key={days} type="button" onClick={() => setEditHabitPeriod(days)}
                                className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition-all ${Number(editHabitPeriod) === days ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                              >{days}</button>
                            ))}
                            <input type="number" min="7" max="365" value={editHabitPeriod} onChange={e => setEditHabitPeriod(e.target.value === '' ? '' : Number(e.target.value))}
                              className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-center" />
                          </div>
                          <p className="text-[11px] text-gray-400 font-medium">Min 7 days, max 365 days</p>
                        </div>
                        <div className="flex gap-3 justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
                          <button type="button" onClick={() => setEditingHabitId(null)} className="px-4 py-2 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">Cancel</button>
                          <button type="submit" disabled={updateHabitMut.isPending} className="px-4 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm text-sm disabled:opacity-75">
                            {updateHabitMut.isPending ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 4: Sharing & Privacy */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">Sharing &amp; Privacy</h2>
            <div className="space-y-4">
              {shareInfo.isProfilePublic ? (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your public profile is <span className="text-green-600 dark:text-green-400 font-semibold">active</span>. Share this link with friends:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2.5 font-mono text-sm text-gray-800 dark:text-gray-200 truncate">
                      {window.location.origin}/u/{shareInfo.shareCode}
                    </code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/u/${shareInfo.shareCode}`); toast('Link copied! 📋'); }}
                      className="shrink-0 bg-indigo-600 text-white text-sm font-semibold px-3 py-2.5 rounded-xl hover:bg-indigo-700 transition-all"
                    >Copy</button>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => { api.post('/api/social/disable').then(() => { queryClient.invalidateQueries({ queryKey: ['shareInfo'] }); toast('Profile hidden.'); }); }}
                      className="text-sm text-red-500 dark:text-red-400 hover:underline font-medium">Disable sharing</button>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enable your public profile to share your habit progress with friends.</p>
                  <button
                    onClick={() => { api.post('/api/social/enable').then(() => queryClient.invalidateQueries({ queryKey: ['shareInfo'] })); }}
                    className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all text-sm">
                    ✨ Enable public profile
                  </button>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => navigate('/friends')}
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                  Manage Friends →
                </button>
              </div>
            </div>
          </section>

          {/* Section 5: Tracking Settings */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">Tracking Settings</h2>
            <div className="space-y-6">

              {/* Default Goal Length */}
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-base mb-0.5">Default Goal Length</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically preselect tracking length for new routines.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {presets.map(days => (
                    <button key={days} type="button" onClick={() => setDefaultTrackingPeriod(days)}
                      className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${Number(defaultTrackingPeriod) === days ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >{days}</button>
                  ))}
                  <input type="number" min="7" max="365" value={defaultTrackingPeriod}
                    onChange={e => setDefaultTrackingPeriod(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">days</span>
                </div>
                <p className="text-xs text-gray-400 font-medium">Min 7 days, max 365 days</p>
              </div>

              <div className="w-full h-px bg-gray-100 dark:bg-gray-700" />

              {/* Daily Reminder */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-base mb-0.5">Daily Reminder</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Set a notification prompt to review tracking.</p>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <input id="reminderTime" type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-indigo-400 focus:border-indigo-600 rounded-xl px-4 py-2 font-bold text-gray-900 dark:text-white text-lg transition-colors cursor-pointer outline-none" />
                  <p className="text-[11px] font-bold text-gray-400 italic mt-1">Browser notifications coming soon</p>
                </div>
              </div>

              <div className="w-full h-px bg-gray-100 dark:bg-gray-700" />

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-base mb-0.5">Dark Mode</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark interface.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0 ${isDark ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  aria-label="Toggle dark mode"
                >
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-sm transition-transform duration-300 ${isDark ? 'translate-x-7' : 'translate-x-0.5'}`}>
                    {isDark ? '🌙' : '☀️'}
                  </span>
                </button>
              </div>
              {/* Sound Effects Toggle */}
              <div className="w-full h-px bg-gray-100 dark:bg-gray-700" />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-base mb-0.5">Sound Effects</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Play sounds when marking habits.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(v => !v)}
                  className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0 ${soundEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                  aria-label="Toggle sound effects"
                >
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-sm transition-transform duration-300 ${soundEnabled ? 'translate-x-7' : 'translate-x-0.5'}`}>
                    {soundEnabled ? '🔊' : '🔇'}
                  </span>
                </button>
              </div>

            </div>
          </section>

          {/* Section 5: Danger Zone */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-red-500 shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-red-500 dark:text-red-400 mb-1">Account Access</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your data is safely backed up and will be here when you return.</p>
            </div>
            <button
              onClick={() => { if (window.confirm('Are you sure you want to logout?')) logout(); }}
              className="w-full sm:w-auto px-6 py-2.5 whitespace-nowrap border-2 border-red-500 dark:border-red-400 text-red-500 dark:text-red-400 font-semibold rounded-xl hover:bg-red-500 dark:hover:bg-red-500 hover:text-white dark:hover:text-white transition-all duration-200 shadow-sm active:scale-95"
            >Logout of StreakBoard</button>
          </section>

        </div>
      </main>

      <AddHabitModal isOpen={isAddHabitModalOpen} onClose={() => setIsAddHabitModalOpen(false)} defaultTrackingPeriod={defaultTrackingPeriod} />
    </div>
  );
}
