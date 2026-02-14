
import React from 'react';
import { AppTheme } from '../types';

interface Props {
  activeTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

const ThemeSelector: React.FC<Props> = ({ activeTheme, onThemeChange }) => {
  const themes: { id: AppTheme; label: string; color: string }[] = [
    { id: 'dark', label: 'Dark', color: 'bg-slate-800' },
    { id: 'pink', label: 'Girlie', color: 'bg-rose-300' },
    { id: 'green', label: 'Green', color: 'bg-emerald-300' },
  ];

  return (
    <div className="flex bg-black/5 p-1 rounded-2xl">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => onThemeChange(t.id)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTheme === t.id 
              ? 'bg-white shadow-md text-slate-900 scale-105' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-3.5 h-3.5 rounded-full ${t.color} border border-black/5`}></span>
            {t.label}
          </div>
        </button>
      ))}
    </div>
  );
};

export default ThemeSelector;
