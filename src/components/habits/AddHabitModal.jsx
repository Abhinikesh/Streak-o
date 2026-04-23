import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function AddHabitModal({ isOpen, onClose, defaultTrackingPeriod = 30 }) {
  const queryClient = useQueryClient();
  
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('💪');
  const [newHabitColor, setNewHabitColor] = useState('#4F46E5');
  const [newHabitPeriod, setNewHabitPeriod] = useState(defaultTrackingPeriod);

  // Sync default tracking period if it changes from outside
  useEffect(() => {
    if (isOpen) {
      setNewHabitPeriod(defaultTrackingPeriod);
      setNewHabitName('');
      setNewHabitIcon('💪');
      setNewHabitColor('#4F46E5');
    }
  }, [isOpen, defaultTrackingPeriod]);

  const icons = ['💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '✍️', '🎯', '🎸', '🧹', '💊'];
  const colors = [
    { name: 'indigo', hex: '#4F46E5' },
    { name: 'green', hex: '#22C55E' },
    { name: 'amber', hex: '#F59E0B' },
    { name: 'red', hex: '#EF4444' },
    { name: 'pink', hex: '#EC4899' },
    { name: 'teal', hex: '#14B8A6' },
  ];

  const addHabitMut = useMutation({
    mutationFn: async (newHabit) => api.post('/api/habits', newHabit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit added! 🎯');
      onClose();
    },
    onError: () => toast.error('Failed to add habit.')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabitMut.mutate({
      name: newHabitName,
      icon: newHabitIcon,
      colorHex: newHabitColor,
      trackingPeriod: newHabitPeriod
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-0 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 sm:p-8 relative z-10 shadow-2xl border-t-4 border-indigo-500 animate-in fade-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full w-9 h-9 flex items-center justify-center transition-colors focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight pr-8">Create New Habit</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Habit Name <span className="text-red-500">*</span></label>
            <input 
              type="text" autoFocus required
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g., Read 10 pages"
              className="w-full px-4 py-3 sm:py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white shadow-sm font-semibold text-gray-900 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Icon Setup</label>
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {icons.map(icon => (
                <button
                  key={icon} type="button"
                  onClick={() => setNewHabitIcon(icon)}
                  className={`text-2xl sm:text-3xl aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ${
                    newHabitIcon === icon ? 'bg-indigo-100 scale-110 shadow-sm border border-indigo-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100 hover:scale-105'
                  }`}
                >{icon}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Theme Identity</label>
            <div className="flex gap-4 sm:gap-5 justify-between px-1">
              {colors.map(color => (
                <button
                  key={color.hex} type="button"
                  onClick={() => setNewHabitColor(color.hex)}
                  className={`w-10 h-10 sm:w-11 sm:h-11 outline outline-offset-2 transition-transform duration-200 rounded-full flex items-center justify-center ${
                    newHabitColor === color.hex ? 'scale-110 outline text-white relative z-10' : 'outline-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex, outlineColor: newHabitColor === color.hex ? color.hex : 'transparent' }}
                  aria-label={`Select Color`}
                >
                  {newHabitColor === color.hex && (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7"></path></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Goal Tracking Target</label>
            <div className="flex gap-2 bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/60">
              {[30, 60, 90].map(days => (
                <button
                  key={days} type="button"
                  onClick={() => setNewHabitPeriod(days)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                    newHabitPeriod === days ? 'bg-white text-indigo-700 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 hover:shadow-sm'
                  }`}
                >{days} days</button>
              ))}
            </div>
          </div>

          <button
            type="submit" disabled={addHabitMut.isPending}
            className="w-full bg-indigo-600 text-white font-extrabold rounded-xl py-4 mt-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-75 flex items-center justify-center gap-2 text-lg sm:text-base tracking-wide"
          >
            {addHabitMut.isPending ? 'Adding...' : 'Save New Habit'}
          </button>
        </form>
      </div>
    </div>
  );
}
