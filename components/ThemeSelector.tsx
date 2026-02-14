
import React from 'react';
import { AppTheme } from '../types';

interface Props {
  activeTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

const ThemeSelector: React.FC<Props> = ({ activeTheme, onThemeChange }) => {
  const themes: { id: AppTheme; label: string; color: string; icon: React.ReactNode }[] = [
    { 
      id: 'dark', 
      label: 'Dark', 
      color: 'text-slate-400',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3c.132 0 .263 0 .393.007a9 9 0 0 0 7.5 15.033A9 9 0 1 1 12 3z" />
        </svg>
      )
    },
    { 
      id: 'pink', 
      label: 'Girlie', 
      color: 'text-rose-400',
      icon: <span className="text-lg leading-none">🎀</span>
    },
    { 
      id: 'green', 
      label: 'Green', 
      color: 'text-emerald-500',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3c2.5,0.3,4.8-0.4,8.2-3.7c3.2-3,3.8-8.2,4.1-12c0.1-1.1-0.6-1.5-1.7-1.4 C14.4,2.9,9.2,3.5,6.2,6.7c-3.3,3.4-4,5.7-3.7,8.2l-2.3,1l0.66,1.89C6.03,15.71,12.2,13.6,17,8z" />
        </svg>
      )
    },
  ];

  return (
    <div className="flex bg-black/5 p-1 rounded-2xl">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => onThemeChange(t.id)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTheme === t.id 
              ? 'bg-white shadow-md text-slate-900 scale-105' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`${activeTheme === t.id ? t.color : 'text-slate-400 opacity-60 flex items-center'}`}>
              {t.icon}
            </span>
            {t.label}
          </div>
        </button>
      ))}
    </div>
  );
};

export default ThemeSelector;
