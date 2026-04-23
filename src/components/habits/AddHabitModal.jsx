import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import TemplateSelector from './TemplateSelector';

export default function AddHabitModal({ isOpen, onClose, defaultTrackingPeriod = 30 }) {
  const queryClient = useQueryClient();

  const [modalStep, setModalStep] = useState('template'); // 'template' | 'form'
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('💪');
  const [newHabitColor, setNewHabitColor] = useState('#4F46E5');
  const [newHabitPeriod, setNewHabitPeriod] = useState(defaultTrackingPeriod);

  // Reset everything when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setModalStep('template');
      setNewHabitName('');
      setNewHabitIcon('💪');
      setNewHabitColor('#4F46E5');
      setNewHabitPeriod(defaultTrackingPeriod);
    }
  }, [isOpen, defaultTrackingPeriod]);

  const icons = ['💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '✍️', '🎯', '🎸', '🧹', '💊', '💻', '📵', '📋', '🔥', '🙏', '🚿', '📞', '📖'];
  const colors = [
    { hex: '#4F46E5' }, { hex: '#22C55E' }, { hex: '#F59E0B' },
    { hex: '#EF4444' }, { hex: '#EC4899' }, { hex: '#14B8A6' },
  ];
  const presets = [30, 60, 90];

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
    const period = Number(newHabitPeriod);
    if (!period || period < 7 || period > 365) {
      toast.error('Please enter between 7 and 365 days');
      return;
    }
    addHabitMut.mutate({ name: newHabitName, icon: newHabitIcon, colorHex: newHabitColor, trackingPeriod: period });
  };

  const handleSelectTemplate = (template) => {
    setNewHabitName(template.name);
    setNewHabitIcon(template.icon);
    setNewHabitColor(template.colorHex);
    setNewHabitPeriod(template.trackingPeriod);
    setModalStep('form');
  };

  const handleSkip = () => {
    setNewHabitName('');
    setNewHabitIcon('💪');
    setNewHabitColor('#4F46E5');
    setNewHabitPeriod(defaultTrackingPeriod);
    setModalStep('form');
  };

  const handleClose = () => {
    setModalStep('template');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 sm:p-8 relative z-10 shadow-2xl border-t-4 border-indigo-500 max-h-[85vh] overflow-y-auto">

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full w-9 h-9 flex items-center justify-center transition-colors focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Step 1: Template selector ── */}
        {modalStep === 'template' && (
          <TemplateSelector onSelectTemplate={handleSelectTemplate} onSkip={handleSkip} />
        )}

        {/* ── Step 2: Habit form ── */}
        {modalStep === 'form' && (
          <>
            {/* Back link */}
            <button
              type="button"
              onClick={() => setModalStep('template')}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer mb-4 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              Back to templates
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight pr-8">
              {newHabitName ? 'Customise Habit' : 'Create New Habit'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  Habit Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" autoFocus required
                  value={newHabitName}
                  onChange={e => setNewHabitName(e.target.value)}
                  placeholder="e.g., Read 10 pages"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-gray-700 dark:text-white shadow-sm font-semibold text-gray-900 text-base"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Icon</label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {icons.map(icon => (
                    <button
                      key={icon} type="button"
                      onClick={() => setNewHabitIcon(icon)}
                      className={`text-xl aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ${
                        newHabitIcon === icon
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 scale-110 shadow-sm border-2 border-indigo-400'
                          : 'bg-gray-50 dark:bg-gray-700 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-600 hover:scale-105'
                      }`}
                    >{icon}</button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Color</label>
                <div className="flex gap-4 justify-between px-1">
                  {colors.map(color => (
                    <button
                      key={color.hex} type="button"
                      onClick={() => setNewHabitColor(color.hex)}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-transform duration-200"
                      style={{
                        backgroundColor: color.hex,
                        outline: newHabitColor === color.hex ? `3px solid ${color.hex}` : 'none',
                        outlineOffset: '2px',
                        transform: newHabitColor === color.hex ? 'scale(1.15)' : 'scale(1)',
                      }}
                    >
                      {newHabitColor === color.hex && (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tracking Period */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Goal Tracking Target</label>
                <div className="flex gap-2 mb-2">
                  {presets.map(days => (
                    <button
                      key={days} type="button"
                      onClick={() => setNewHabitPeriod(days)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all duration-200 ${
                        Number(newHabitPeriod) === days
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >{days}</button>
                  ))}
                  <input
                    type="number" min="7" max="365" value={newHabitPeriod}
                    onChange={e => setNewHabitPeriod(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Custom"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-gray-900 dark:text-white dark:bg-gray-700 text-center"
                  />
                </div>
                <p className="text-xs text-gray-400 font-medium">Min 7 days, max 365 days</p>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={addHabitMut.isPending}
                className="w-full bg-indigo-600 text-white font-extrabold rounded-xl py-4 mt-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-75 flex items-center justify-center gap-2 text-lg tracking-wide"
              >
                {addHabitMut.isPending ? 'Adding...' : 'Save New Habit'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
