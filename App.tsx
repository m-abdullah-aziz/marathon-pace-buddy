
import React, { useState, useMemo } from 'react';
import { AppTheme, PacePlan, SplitRow, RacePhase, RaceSession } from './types';
import { THEMES, MARATHON_KM } from './constants';
import PaceInputs from './components/PaceInputs';
import SplitsDisplay from './components/SplitsDisplay';
import AIAdvisor from './components/AIAdvisor';
import ThemeSelector from './components/ThemeSelector';
import RaceTimer from './components/RaceTimer';
import RaceSummary from './components/RaceSummary';

const App: React.FC = () => {
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [phase, setPhase] = useState<RacePhase>('idle');
  const [lastSession, setLastSession] = useState<RaceSession | null>(null);
  const [plan, setPlan] = useState<PacePlan>({
    type: 'full',
    distanceKm: MARATHON_KM,
    targetTimeSeconds: 14400, // 4:00:00
    averagePaceSecondsPerKm: 341.27, // ~5:41 min/km
    hydrationIntervalKm: 5,
    gelIntervalKm: 7,
  });

  const activeTheme = THEMES[theme];

  const formatSecondsToTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const splits = useMemo(() => {
    const rows: SplitRow[] = [];
    const totalKm = Math.ceil(plan.distanceKm);
    
    for (let km = 1; km <= totalKm; km++) {
      const currentKm = Math.min(km, plan.distanceKm);
      const elapsed = currentKm * plan.averagePaceSecondsPerKm;
      
      rows.push({
        km: currentKm,
        elapsedTime: formatSecondsToTime(elapsed),
        isHydrationPoint: km > 0 && km % plan.hydrationIntervalKm === 0,
        isGelPoint: km > 0 && km % plan.gelIntervalKm === 0,
      });
    }
    return rows;
  }, [plan]);

  const handlePlanChange = (newPlan: Partial<PacePlan>) => {
    setPlan(prev => ({ ...prev, ...newPlan }));
  };

  const handleRaceFinish = (session: RaceSession) => {
    setLastSession(session);
    setPhase('finished');
  };

  const textClass = activeTheme.text;

  return (
    <div className={`min-h-screen ${activeTheme.bg} ${textClass} transition-all duration-300 pb-20`}>
      <header className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-extrabold font-heading tracking-tight mb-1 ${textClass}`}>
            Pace<span className={theme === 'dark' ? 'text-indigo-400' : theme === 'pink' ? 'text-rose-500' : 'text-emerald-600'}>Buddy</span>
          </h1>
          <p className={`${textClass} opacity-80 text-xs md:text-sm font-semibold`}>Your smart marathon training & pacing partner.</p>
        </div>
        <ThemeSelector activeTheme={theme} onThemeChange={setTheme} />
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {phase === 'finished' && lastSession ? (
          <div className="lg:col-span-12">
            <RaceSummary session={lastSession} plan={plan} theme={theme} onReset={() => setPhase('idle')} />
          </div>
        ) : (
          <>
            <div className="lg:col-span-5 space-y-6 md:space-y-8">
              <section className={`${activeTheme.card} ${textClass} p-5 md:p-6 rounded-3xl shadow-xl border ${activeTheme.border}`}>
                <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 font-heading flex items-center gap-2">
                  <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {phase === 'running' ? 'Live Race Tracking' : 'Race Timer'}
                </h2>
                <RaceTimer 
                  plan={plan} 
                  theme={theme} 
                  onPhaseChange={setPhase} 
                  onFinish={handleRaceFinish}
                  phase={phase}
                />
              </section>

              {phase !== 'running' && (
                <>
                  <section className={`${activeTheme.card} ${textClass} p-5 md:p-6 rounded-3xl shadow-xl border ${activeTheme.border}`}>
                    <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 font-heading flex items-center gap-2">
                      <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Goal Configuration
                    </h2>
                    <PaceInputs plan={plan} onPlanChange={handlePlanChange} theme={theme} />
                  </section>

                  <section className={`${activeTheme.card} ${textClass} p-5 md:p-6 rounded-3xl shadow-xl border ${activeTheme.border}`}>
                    <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 font-heading flex items-center gap-2">
                      <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      AI Strategy
                    </h2>
                    <AIAdvisor plan={plan} theme={theme} />
                  </section>
                </>
              )}
            </div>

            <div className={`lg:col-span-7 ${phase === 'running' ? 'hidden lg:flex flex-col' : 'flex flex-col'}`}>
              <section className={`${activeTheme.card} ${textClass} h-full p-5 md:p-6 rounded-3xl shadow-xl border ${activeTheme.border} flex flex-col`}>
                <div className="flex flex-wrap items-center justify-between mb-4 md:mb-6 gap-3">
                   <h2 className="text-lg md:text-xl font-bold font-heading flex items-center gap-2">
                    <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Target Splits
                  </h2>
                  <div className="flex gap-4 text-[10px] md:text-xs font-bold uppercase tracking-wide">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span> <span>Hydration</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500"></span> <span>Fuel</span></span>
                  </div>
                </div>
                <SplitsDisplay splits={splits} theme={theme} />
              </section>
            </div>
          </>
        )}
      </main>

      <footer className={`mt-12 md:mt-16 text-center opacity-80 text-[10px] md:text-xs font-bold py-8 ${textClass}`}>
        &copy; 2024 Pace Buddy. Go the extra mile.
      </footer>
    </div>
  );
};

export default App;
