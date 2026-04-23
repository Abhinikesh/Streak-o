import React, { useState } from 'react';
import { habitTemplates, templateCategories } from '../../data/habitTemplates';

export default function TemplateSelector({ onSelectTemplate, onSkip }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? habitTemplates
    : habitTemplates.filter(t => t.category === activeCategory);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose a template</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Pick one to get started quickly, or build your own
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {templateCategories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(template => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelectTemplate(template)}
            className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-3 cursor-pointer border-2 border-transparent hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-150 active:scale-95 text-left"
          >
            {/* Icon circle */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: template.colorHex + '33' }}
            >
              {template.icon}
            </div>
            {/* Name */}
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-2 leading-tight">
              {template.name}
            </p>
            {/* Category + Period row */}
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-500">{template.category}</span>
              <span className="text-xs font-medium" style={{ color: template.colorHex }}>
                {template.trackingPeriod}d
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Start from scratch */}
      <button
        type="button"
        onClick={onSkip}
        className="w-full text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-center py-2 cursor-pointer transition-colors"
      >
        Start from scratch →
      </button>
    </div>
  );
}
