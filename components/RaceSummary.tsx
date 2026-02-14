
import React from 'react';
import { RaceSession, PacePlan, AppTheme } from '../types';
import { THEMES } from '../constants';

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
    downloadAnchorNode.setAttribute("download", `race_data_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Distance (km),Pace (sec/km),Timestamp\r\n";
    session.paceSamples.forEach((sample) => {
      csvContent += `${sample.distance},${sample.pace.toFixed(2)},${new Date(sample.timestamp).toLocaleTimeString()}\r\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `race_splits_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const renderGraph = () => {
    if (session.paceSamples.length < 2) return null;
    
    const width = 500;
    const height = 150;
    const padding = 20;
    
    const minPace = Math.min(...session.paceSamples.map(s => s.pace), plan.averagePaceSecondsPerKm) * 0.9;
    const maxPace = Math.max(...session.paceSamples.map(s => s.pace), plan.averagePaceSecondsPerKm) * 1.1;
    const paceRange = maxPace - minPace || 1;
    
    const maxDist = session.totalDistanceKm;
    
    const points = session.paceSamples.map(s => {
      const x = padding + (s.distance / maxDist) * (width - 2 * padding);
      const y = height - padding - ((s.pace - minPace) / paceRange) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const targetY = height - padding - ((plan.averagePaceSecondsPerKm - minPace) / paceRange) * (height - 2 * padding);

    return (
      <div className="mt-8 bg-black/5 rounded-2xl p-4 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xs font-black uppercase opacity-60">Pace Trend (Sec/Km)</h4>
          <div className="flex gap-4 text-[10px] font-bold">
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-blue-500"></span> Actual</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 border-t border-dashed border-red-500"></span> Target</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity="0.1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" strokeOpacity="0.1" />
          <line x1={padding} y1={targetY} x2={width - padding} y2={targetY} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2" />
          <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" points={points} />
        </svg>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`${activeTheme.card} p-8 rounded-3xl shadow-2xl border ${activeTheme.border} text-center`}>
        <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-400/20">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
        </div>
        
        <h2 className="text-3xl font-black font-heading mb-2">Race Complete!</h2>
        <p className="opacity-70 font-semibold mb-8">You finished the {plan.type === 'custom' ? `${plan.distanceKm}km` : plan.type} race.</p>

        {session.weather && (
          <div className="mb-8 p-4 rounded-2xl bg-blue-500/5 text-sm font-medium">
            <span className="block text-[10px] font-black uppercase opacity-40 mb-1">Start Conditions</span>
            <p>{session.weather.description}</p>
            {session.weather.sources.length > 0 && (
              <div className="mt-2 flex gap-2 justify-center">
                {session.weather.sources.map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] underline opacity-60 hover:opacity-100">{s.title}</a>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-black/5 p-5 rounded-2xl text-center">
            <span className="block text-[10px] font-black uppercase opacity-50 mb-1">Final Time</span>
            <span className="text-xl md:text-2xl font-black tabular-nums">{formatTime(durationMs)}</span>
          </div>
          <div className="bg-black/5 p-5 rounded-2xl text-center">
            <span className="block text-[10px] font-black uppercase opacity-50 mb-1">Actual Distance</span>
            <span className="text-xl md:text-2xl font-black tabular-nums">{session.totalDistanceKm.toFixed(2)} km</span>
          </div>
        </div>

        {renderGraph()}

        <div className={`mt-8 p-6 rounded-2xl mb-8 ${targetMet ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
          <p className="font-bold text-lg">
            {targetMet 
              ? "Goal Smashed! You beat your target. 🏆" 
              : "Great effort! Close to the goal. 🏃‍♂️"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <button
            onClick={downloadJSON}
            className={`py-4 rounded-2xl font-black bg-black/5 hover:bg-black/10 text-sm transition-all flex items-center justify-center gap-2 ${activeTheme.text}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            JSON Data
          </button>
          <button
            onClick={downloadCSV}
            className={`py-4 rounded-2xl font-black bg-black/5 hover:bg-black/10 text-sm transition-all flex items-center justify-center gap-2 ${activeTheme.text}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 00-4-4H5m14 6v-3a4 4 0 00-4-4h-3m-4 4l-4-4m4 4l4-4" /></svg>
            Excel (CSV)
          </button>
        </div>
        
        <button
          onClick={onReset}
          className={`w-full py-4 rounded-2xl font-black text-white text-lg transition-all shadow-xl active:scale-95 ${activeTheme.accent}`}
        >
          Back to Start
        </button>
      </div>
    </div>
  );
};

export default RaceSummary;
