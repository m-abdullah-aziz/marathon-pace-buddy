
import React, { useState } from 'react';
import { PacePlan, AppTheme } from '../types';
import { getRaceStrategy } from '../services/geminiService';
import { THEMES } from '../constants';

interface Props {
  plan: PacePlan;
  theme: AppTheme;
}

const AIAdvisor: React.FC<Props> = ({ plan, theme }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const activeTheme = THEMES[theme];

  const handleGetStrategy = async () => {
    setLoading(true);
    try {
      const response = await getRaceStrategy(plan);
      setAdvice(response);
    } catch (error) {
      console.error(error);
      setAdvice("Sorry, I couldn't generate a strategy right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium opacity-80 leading-relaxed">
        Get a personalized pacing strategy based on your {Math.floor(plan.targetTimeSeconds / 3600)}h {Math.floor((plan.targetTimeSeconds % 3600) / 60)}m goal.
      </p>
      
      {!advice && !loading && (
        <button
          onClick={handleGetStrategy}
          className={`w-full py-4 rounded-2xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl ${activeTheme.accent}`}
        >
          Generate Pacing Strategy
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${theme === 'dark' ? 'border-white' : 'border-current'}`}></div>
          <p className="text-xs font-bold animate-pulse uppercase tracking-widest">Analyzing Marathon Dynamics...</p>
        </div>
      )}

      {advice && !loading && (
        <div className={`p-5 rounded-2xl border ${activeTheme.border} ${theme === 'dark' ? 'bg-black/20' : 'bg-black/[0.03]'} relative`}>
          <button 
            onClick={() => setAdvice(null)}
            className="absolute top-3 right-3 p-1 opacity-40 hover:opacity-100 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="text-sm font-medium leading-relaxed">
            {advice.split('\n').map((line, i) => (
              <p key={i} className="mb-3 last:mb-0">{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAdvisor;
