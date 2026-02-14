
import React, { useState, useEffect, useRef } from 'react';
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

  // Sync internal HH:MM:SS state when the plan target time changes externally (e.g. via preset click)
  const isInternalUpdate = useRef(false);
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    setH(Math.floor(plan.targetTimeSeconds / 3600).toString());
    setM(Math.floor((plan.targetTimeSeconds % 3600) / 60).toString().padStart(2, '0'));
    setS(Math.floor(plan.targetTimeSeconds % 60).toString().padStart(2, '0'));
  }, [plan.targetTimeSeconds]);

  // Handle HH:MM:SS changes
  useEffect(() => {
    const hours = parseInt(h || '0');
    const minutes = parseInt(m || '0');
    const seconds = parseInt(s || '0');
    const totalSecs = hours * 3600 + minutes * 60 + seconds;
    
    if (totalSecs > 0 && totalSecs !== plan.targetTimeSeconds) {
      isInternalUpdate.current = true;
      onPlanChange({ targetTimeSeconds: totalSecs });
    }
  }, [h, m, s]);

  const paceDisplay = () => {
    if (!plan.averagePaceSecondsPerKm || isNaN(plan.averagePaceSecondsPerKm)) return '0:00 min/km';
    const mins = Math.floor(plan.averagePaceSecondsPerKm / 60);
    const secs = Math.floor(plan.averagePaceSecondsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
  };

  const inputClass = `w-full ${activeTheme.input} rounded-xl px-4 py-3 focus:ring-2 focus:ring-opacity-50 transition-all outline-none ${
    theme === 'dark' ? 'focus:ring-indigo-500' : theme === 'pink' ? 'focus:ring-rose-400' : 'focus:ring-emerald-500'
  }`;

  const handleTypeChange = (type: RaceType) => {
    const distance = DISTANCES[type];
    const defaultTimes: Record<RaceType, number> = {
      '5k': 1500,    // 25:00
      '10k': 3000,   // 50:00
      'half': 6600,  // 1:50:00
      'full': 14400, // 4:00:00
      'custom': distance * 300 // 5:00 min/km default
    };
    const targetTime = defaultTimes[type];
    
    onPlanChange({ 
      type, 
      distanceKm: distance, 
      targetTimeSeconds: targetTime
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-bold mb-2 opacity-80 uppercase tracking-widest">Marathon / Race Name</label>
        <input 
          type="text" 
          value={plan.raceName} 
          onChange={e => onPlanChange({ raceName: e.target.value })} 
          placeholder="e.g. NYC Marathon"
          className={inputClass} 
        />
      </div>

      <div>
        <label className="block text-xs font-bold mb-3 opacity-80 uppercase tracking-widest">Race Type</label>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {(['5k', '10k', 'half', 'full', 'custom'] as RaceType[]).map(t => (
            <button
              key={t}
              type="button"
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
            <span className="text-xs font-bold opacity-80 uppercase tracking-wide">Calculated Target Pace</span>
            <span className="text-xl md:text-2xl font-black">{paceDisplay()}</span>
        </div>
      </div>
    </div>
  );
};

export default PaceInputs;
