
import React, { useState, useEffect } from 'react';
import { PacePlan, AppTheme, RaceType } from '../types';
import { THEMES, DISTANCES } from '../constants';

interface Props {
  plan: PacePlan;
  onPlanChange: (plan: Partial<PacePlan>) => void;
  theme: AppTheme;
}

const PaceInputs: React.FC<Props> = ({ plan, onPlanChange, theme }) => {
  const activeTheme = THEMES[theme];
  
  const [h, setH] = useState(Math.floor(plan.targetTimeSeconds / 3600).toString());
  const [m, setM] = useState(Math.floor((plan.targetTimeSeconds % 3600) / 60).toString().padStart(2, '0'));
  const [s, setS] = useState(Math.floor(plan.targetTimeSeconds % 60).toString().padStart(2, '0'));

  useEffect(() => {
    const totalSecs = parseInt(h || '0') * 3600 + parseInt(m || '0') * 60 + parseInt(s || '0');
    if (totalSecs > 0) {
      const pace = totalSecs / plan.distanceKm;
      onPlanChange({ targetTimeSeconds: totalSecs, averagePaceSecondsPerKm: pace });
    }
  }, [h, m, s, plan.distanceKm]);

  const paceDisplay = () => {
    const mins = Math.floor(plan.averagePaceSecondsPerKm / 60);
    const secs = Math.floor(plan.averagePaceSecondsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
  };

  const inputClass = `w-full ${activeTheme.input} rounded-xl px-4 py-3 focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${
    theme === 'dark' ? 'focus:ring-indigo-500' : theme === 'pink' ? 'focus:ring-rose-400' : 'focus:ring-emerald-500'
  }`;

  const handleTypeChange = (type: RaceType) => {
    const distance = DISTANCES[type];
    onPlanChange({ type, distanceKm: distance });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-bold mb-3 opacity-80 uppercase tracking-widest">Race Type</label>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {(['5k', '10k', 'half', 'full', 'custom'] as RaceType[]).map(t => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                plan.type === t 
                ? `${activeTheme.accent} text-white border-transparent shadow-md` 
                : `${activeTheme.card} ${activeTheme.text} border-black/10`
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {plan.type === 'custom' && (
        <div>
          <label className="block text-xs font-bold mb-2 opacity-80 uppercase tracking-widest">Distance (km)</label>
          <input 
            type="number" 
            step="0.1"
            value={plan.distanceKm} 
            onChange={e => onPlanChange({ distanceKm: parseFloat(e.target.value) || 1 })} 
            className={inputClass} 
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-bold mb-2 opacity-80 uppercase tracking-widest">Target Time (HH:MM:SS)</label>
        <div className="flex gap-2 items-center">
          <input type="number" value={h} onChange={e => setH(e.target.value)} placeholder="H" className={inputClass} />
          <span className="font-bold">:</span>
          <input type="number" value={m} onChange={e => setM(e.target.value)} placeholder="M" className={inputClass} />
          <span className="font-bold">:</span>
          <input type="number" value={s} onChange={e => setS(e.target.value)} placeholder="S" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold mb-2 opacity-80 uppercase tracking-widest">Hydration (every km)</label>
          <input 
            type="number" 
            value={plan.hydrationIntervalKm} 
            onChange={e => onPlanChange({ hydrationIntervalKm: parseInt(e.target.value) || 1 })} 
            className={inputClass} 
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-2 opacity-80 uppercase tracking-widest">Fuel/Gel (every km)</label>
          <input 
            type="number" 
            value={plan.gelIntervalKm} 
            onChange={e => onPlanChange({ gelIntervalKm: parseInt(e.target.value) || 1 })} 
            className={inputClass} 
          />
        </div>
      </div>

      <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-indigo-500/10' : theme === 'pink' ? 'bg-rose-50' : 'bg-emerald-50'} border-dashed border-2 border-opacity-30 ${activeTheme.accentText} border-current`}>
        <div className="flex justify-between items-center">
            <span className="text-xs font-bold opacity-80 uppercase tracking-wide">Target Pace</span>
            <span className="text-xl md:text-2xl font-black">{paceDisplay()}</span>
        </div>
      </div>
    </div>
  );
};

export default PaceInputs;
