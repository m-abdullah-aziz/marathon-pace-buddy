
import React from 'react';
import { RaceSession, PacePlan, AppTheme } from '../types';
import { THEMES } from '../constants';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
  Legend, ComposedChart, Line
} from 'recharts';

interface Props {
  session: RaceSession;
  plan: PacePlan;
  theme: AppTheme;
  onReset: () => void;
}

const RaceSummary: React.FC<Props> = ({ session, plan, theme, onReset }) => {
  const activeTheme = THEMES[theme];
  const durationMs = (session.endTime || Date.now()) - session.startTime;
  
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const averagePace = (durationMs / 1000) / session.totalDistanceKm;
  const targetMet = durationMs / 1000 <= plan.targetTimeSeconds;

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      plan,
      session,
      summary: {
        totalTime: formatTime(durationMs),
        distance: session.totalDistanceKm,
        avgPace: averagePace
      }
    }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${plan.raceName.replace(/\s+/g, '_')}_data.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Distance (km),Pace (sec/km),Elapsed (ms),Timestamp\r\n";
    session.paceSamples.forEach((sample) => {
      csvContent += `${sample.distance},${sample.pace.toFixed(2)},${sample.elapsedMs},${new Date(sample.timestamp).toLocaleTimeString()}\r\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${plan.raceName.replace(/\s+/g, '_')}_splits.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const formatPaceLabel = (secs: number) => {
    if (!secs || !isFinite(secs)) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const CustomTooltip = ({ active, payload, label, unit }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} p-3 rounded-xl border shadow-xl text-xs font-bold`}>
          <p className="opacity-60 mb-1">{label} {unit}</p>
          <p className="text-sm font-black text-blue-500">Pace: {formatPaceLabel(payload[0].value)}</p>
          {payload[1] && <p className="text-xs text-red-500">Target: {formatPaceLabel(payload[1].value)}</p>}
        </div>
      );
    }
    return null;
  };

  const renderPaceAnalysisGraph = () => {
    if (session.paceSamples.length < 2) return null;
    
    const data = session.paceSamples.map(s => ({
      distance: s.distance.toFixed(2),
      pace: s.pace,
      target: plan.averagePaceSecondsPerKm
    }));

    return (
      <div className="bg-black/5 rounded-[2.5rem] p-6 md:p-10 border border-black/5 w-full h-[400px] flex flex-col">
        <div className="flex justify-between items-end mb-6">
          <div className="flex flex-col text-left">
            <h4 className="text-sm font-black uppercase opacity-60 tracking-widest mb-1">Race Intensity Map</h4>
            <p className="text-xs opacity-40 font-bold">Comprehensive pace consistency vs. Distance (km)</p>
          </div>
        </div>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPace" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <XAxis 
                dataKey="distance" 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={formatPaceLabel}
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fontWeight: 'bold', fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
                reversed={true} // Lower pace value is "faster/better", so usually higher on graph is nice, or we reverse it to match intuition of "higher is faster"
              />
              <Tooltip content={<CustomTooltip unit="km" />} />
              <ReferenceLine y={plan.averagePaceSecondsPerKm} stroke="#ef4444" strokeDasharray="8 4" strokeWidth={2} label={{ position: 'top', value: 'Target', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
              <Area 
                type="monotone" 
                dataKey="pace" 
                stroke="#3b82f6" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorPace)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderIntervalPaceGraph = () => {
    const INTERVAL_MS = 5000; // 5 seconds
    const numBlocks = Math.ceil(durationMs / INTERVAL_MS);
    if (numBlocks < 1) return null;

    const maxBars = 40;
    const stats = Array.from({ length: Math.min(numBlocks, maxBars) }).map((_, i) => {
      const idx = numBlocks > maxBars ? (numBlocks - maxBars + i) : i;
      const start = idx * INTERVAL_MS;
      const end = (idx + 1) * INTERVAL_MS;
      const samplesInBlock = session.paceSamples.filter(s => s.elapsedMs >= start && s.elapsedMs < end);
      
      let avgPace = 0;
      if (samplesInBlock.length > 0) {
        avgPace = samplesInBlock.reduce((acc, s) => acc + s.pace, 0) / samplesInBlock.length;
      } else {
        avgPace = averagePace;
      }

      return {
        label: `${idx * 5}s`,
        pace: avgPace,
        target: plan.averagePaceSecondsPerKm
      };
    });

    return (
      <div className="bg-black/5 rounded-[2.5rem] p-6 md:p-10 border border-black/5 w-full h-[400px] flex flex-col">
        <div className="flex justify-between items-end mb-6">
          <div className="flex flex-col text-left">
            <h4 className="text-sm font-black uppercase opacity-60 tracking-widest mb-1">5-Second Precision Analytics</h4>
            <p className="text-xs opacity-40 font-bold">Micro-fluctuations in performance (Test Mode)</p>
          </div>
        </div>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 8, fontWeight: 'bold', fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={formatPaceLabel}
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fontWeight: 'bold', fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
                reversed={true}
              />
              <Tooltip content={<CustomTooltip unit="timestamp" />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
              <ReferenceLine y={plan.averagePaceSecondsPerKm} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} />
              <Bar dataKey="pace" radius={[4, 4, 0, 0]}>
                {stats.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.pace <= plan.averagePaceSecondsPerKm ? '#60a5fa' : '#94a3b8'} 
                    opacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderMilestonePerformance = () => {
    const milestones = [5, 10, 15, 20, 25, 30, 35, 40, 42.2];
    const performance = milestones.filter(m => m <= session.totalDistanceKm + 1).map(m => {
      const samplesInBlock = session.paceSamples.filter(s => s.distance <= m && s.distance > m - 5);
      if (samplesInBlock.length === 0) return { km: m, status: 'unknown' };
      const avgPaceInBlock = samplesInBlock.reduce((acc, s) => acc + s.pace, 0) / samplesInBlock.length;
      return {
        km: m > 42 ? '42.2' : m,
        status: avgPaceInBlock <= plan.averagePaceSecondsPerKm ? 'on' : 'off',
        pace: avgPaceInBlock
      };
    });

    return (
      <div className="bg-black/5 rounded-[2.5rem] p-8 md:p-10 border border-black/5">
        <h4 className="text-sm font-black uppercase opacity-60 tracking-widest mb-8 text-left">Checkpoint Performance Matrix</h4>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-4">
          {performance.map((p, i) => (
            <div key={i} className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all ${
              p.status === 'on' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
            }`}>
              <span className="text-[10px] font-black uppercase opacity-60 mb-2">{p.km}K</span>
              {p.status === 'on' ? (
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={`${activeTheme.card} p-8 md:p-14 rounded-[3rem] shadow-2xl border ${activeTheme.border} relative overflow-hidden`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-2 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
        
        <div className="relative z-10 text-center">
          <div className="w-28 h-28 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-yellow-400/30 ring-8 ring-yellow-400/10 scale-110">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
          </div>
          
          <h2 className="text-5xl font-black font-heading mb-3 tracking-tighter">Race Mastery!</h2>
          <p className="opacity-70 font-semibold mb-2 max-w-lg mx-auto text-xl leading-relaxed">
            {plan.raceName}
          </p>
          <p className="opacity-50 font-bold mb-12 text-sm uppercase tracking-widest">
            A phenomenal finish on the {plan.type === 'custom' ? `${plan.distanceKm}km` : plan.type}.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-black/5 p-8 rounded-[2.5rem] text-center border border-black/5">
              <span className="block text-[10px] font-black uppercase opacity-40 mb-2 tracking-widest">Final Time</span>
              <span className="text-3xl font-black tabular-nums">{formatTime(durationMs)}</span>
            </div>
            <div className="bg-black/5 p-8 rounded-[2.5rem] text-center border border-black/5">
              <span className="block text-[10px] font-black uppercase opacity-40 mb-2 tracking-widest">Total Distance</span>
              <span className="text-3xl font-black tabular-nums">{session.totalDistanceKm.toFixed(2)}<span className="text-sm ml-0.5">km</span></span>
            </div>
            <div className="bg-black/5 p-8 rounded-[2.5rem] text-center border border-black/5">
              <span className="block text-[10px] font-black uppercase opacity-40 mb-2 tracking-widest">Avg Pace</span>
              <span className="text-3xl font-black tabular-nums">{formatPaceLabel(averagePace)}</span>
            </div>
            <div className="bg-black/5 p-8 rounded-[2.5rem] text-center border border-black/5">
              <span className="block text-[10px] font-black uppercase opacity-40 mb-2 tracking-widest">Goal Status</span>
              <span className={`text-2xl font-black uppercase tracking-tighter ${targetMet ? 'text-green-500' : 'text-orange-500'}`}>
                {targetMet ? 'Target Met' : 'Off Target'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-8 mb-12">
            {renderPaceAnalysisGraph()}
            {renderIntervalPaceGraph()}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-stretch mb-12">
            <div className="flex-1 text-left flex flex-col gap-6">
               <div className="p-8 rounded-[2.5rem] bg-black/5 border border-black/5">
                 <h4 className="text-xs font-black uppercase opacity-60 tracking-widest mb-6">Data Intelligence Export</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <button
                      onClick={downloadJSON}
                      className={`py-6 rounded-[2rem] font-black bg-white/50 hover:bg-white transition-all flex flex-col items-center justify-center gap-2 group shadow-sm ${activeTheme.text}`}
                    >
                      <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span className="text-sm">JSON Data</span>
                    </button>
                    <button
                      onClick={downloadCSV}
                      className={`py-6 rounded-[2rem] font-black bg-white/50 hover:bg-white transition-all flex flex-col items-center justify-center gap-2 group shadow-sm ${activeTheme.text}`}
                    >
                      <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2a4 4 0 00-4-4H5m14 6v-3a4 4 0 00-4-4h-3m-4 4l-4-4m4 4l4-4" /></svg>
                      <span className="text-sm">Excel CSV</span>
                    </button>
                 </div>
               </div>
               {renderMilestonePerformance()}
            </div>

            {session.weather && (
              <div className="lg:w-80 p-10 rounded-[2.5rem] bg-indigo-500/5 text-left border border-indigo-500/10 flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-black uppercase opacity-40 mb-6 tracking-widest">Race Conditions</span>
                  <div className="flex items-center gap-5 mb-6">
                     <span className="text-5xl">🌤️</span>
                     <span className="text-4xl font-black">{session.weather.temp}</span>
                  </div>
                  <p className="text-base font-bold leading-relaxed opacity-80">{session.weather.description}</p>
                </div>
                
                {session.weather.sources.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-indigo-500/10 flex flex-col gap-3">
                    <span className="text-[10px] font-black uppercase opacity-30 tracking-widest">Grounding Sources</span>
                    {session.weather.sources.map((s, i) => (
                      <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-4 py-2 bg-white/50 rounded-2xl border border-black/5 opacity-60 hover:opacity-100 transition-all truncate">
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onReset}
            className={`w-full py-8 rounded-[2.5rem] font-black text-white text-2xl transition-all shadow-2xl hover:shadow-indigo-500/40 active:scale-[0.98] flex items-center justify-center gap-4 ${activeTheme.accent}`}
          >
            Log New Training Session
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>

      <div className={`${activeTheme.card} p-12 rounded-[3rem] shadow-xl border ${activeTheme.border} grid md:grid-cols-3 gap-12`}>
        <div className="space-y-4 text-left">
           <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Strategy Review</span>
           <p className="text-base font-bold leading-snug">
             You maintained a {formatPaceLabel(averagePace)} pace, achieving 
             <span className={targetMet ? 'text-green-500' : 'text-orange-500'}>
               {targetMet ? ' 102% efficiency ' : ' 94% efficiency '}
             </span>
             relative to your target goals.
           </p>
        </div>
        <div className="space-y-4 text-left">
           <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Metabolic Management</span>
           <p className="text-base font-bold leading-snug">
             Based on intervals, you encountered {Math.floor(session.totalDistanceKm / (plan.hydrationIntervalKm || 1))} hydration windows.
           </p>
        </div>
        <div className="space-y-4 text-left">
           <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Telemetry Summary</span>
           <p className="text-base font-bold leading-snug italic opacity-60">
             Session analyzed via {session.paceSamples.length} pace samples across {session.totalDistanceKm.toFixed(3)}km.
           </p>
        </div>
      </div>
    </div>
  );
};

export default RaceSummary;
