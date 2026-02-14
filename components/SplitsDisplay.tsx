
import React from 'react';
import { SplitRow, AppTheme } from '../types';
import { THEMES } from '../constants';

interface Props {
  splits: SplitRow[];
  theme: AppTheme;
}

const SplitsDisplay: React.FC<Props> = ({ splits, theme }) => {
  const activeTheme = THEMES[theme];

  return (
    <div className="flex-1 overflow-hidden relative rounded-2xl border border-black/5">
      <div className={`overflow-y-auto max-h-[600px] custom-scrollbar ${theme === 'dark' ? 'custom-scrollbar-dark' : ''}`}>
        <table className={`w-full text-left border-collapse ${activeTheme.text}`}>
          <thead className={`sticky top-0 z-10 ${activeTheme.card} border-b ${activeTheme.border}`}>
            <tr>
              <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'opacity-70'}`}>Km</th>
              <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'opacity-70'}`}>Time</th>
              <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'opacity-70'}`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {splits.map((row) => (
              <tr key={row.km} className="hover:bg-black/[0.02] transition-colors group">
                <td className="px-6 py-4 font-bold text-lg">{row.km}</td>
                <td className="px-6 py-4 font-semibold tabular-nums opacity-90">{row.elapsedTime}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {row.isHydrationPoint && (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20" title="Drink Water">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                    )}
                    {row.isGelPoint && (
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20" title="Take Nutrition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-10 pointer-events-none bg-gradient-to-t ${theme === 'dark' ? 'from-[#1e293b]' : 'from-white'} to-transparent opacity-80`}></div>
    </div>
  );
};

export default SplitsDisplay;
