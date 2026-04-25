import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';

/**
 * HabitSettingsModal
 * Shows per-habit privacy controls.
 * Props:
 *   habit      — full habit object (needs _id, name, icon, isPublic)
 *   isOpen     — boolean
 *   onClose    — callback
 */
export default function HabitSettingsModal({ habit, isOpen, onClose }) {
  const queryClient = useQueryClient();

  // Optimistic local state — mirrors habit.isPublic
  const [isPublic, setIsPublic] = useState(habit?.isPublic ?? true);

  const privacyMut = useMutation({
    mutationFn: () => api.patch(`/api/habits/${habit._id}/privacy`),
    onMutate: () => {
      // Optimistic update
      setIsPublic((prev) => !prev);
    },
    onSuccess: (res) => {
      // Sync to exact server value
      setIsPublic(res.data.isPublic);
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: () => {
      // Revert
      setIsPublic((prev) => !prev);
      toast.error('Failed to update privacy setting');
    },
  });

  if (!isOpen || !habit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl border-t-4 border-indigo-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{habit.icon || '🎯'}</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {habit.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full w-9 h-9 flex items-center justify-center transition-colors focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          {/* Privacy toggle row */}
          <div className="flex items-start gap-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Show in friend activity feed
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                When off, this habit won't appear in your friends' feeds
              </p>
            </div>

            {/* Toggle switch */}
            <button
              id={`privacy-toggle-${habit._id}`}
              role="switch"
              aria-checked={isPublic}
              disabled={privacyMut.isPending}
              onClick={() => privacyMut.mutate()}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 ${
                isPublic
                  ? 'bg-indigo-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  isPublic ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {isPublic
              ? '🌐 Visible to friends when you complete this habit'
              : '🔒 Hidden from your friends\' activity feeds'}
          </p>
        </div>
      </div>
    </div>
  );
}
