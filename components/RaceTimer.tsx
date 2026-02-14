
import React, { useState, useEffect, useRef } from 'react';
import { PacePlan, AppTheme, RacePhase, RaceSession, PaceSample, WeatherInfo } from '../types';
import { THEMES } from '../constants';
import { getWeatherByLocation } from '../services/geminiService';

interface Props {
  plan: PacePlan;
  theme: AppTheme;
  phase: RacePhase;
  onPhaseChange: (phase: RacePhase) => void;
  onFinish: (session: RaceSession) => void;
}

const RaceTimer: React.FC<Props> = ({ plan, theme, phase, onPhaseChange, onFinish }) => {
  const [elapsed, setElapsed] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentPace, setCurrentPace] = useState(0); 
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'searching' | 'active' | 'error'>('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | undefined>();
  
  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pathRef = useRef<{ lat: number; lng: number; timestamp: number; dist: number }[]>([]);
  const samplesRef = useRef<PaceSample[]>([]);
  const lastSampleDistRef = useRef(0);
  const weatherFetchedRef = useRef(false);

  const activeTheme = THEMES[theme];

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate pace based on a rolling window of the last 30 seconds of movement
  const updateRollingPace = () => {
    if (pathRef.current.length < 2) return;
    
    const now = Date.now();
    const windowMs = 30000; // 30 second window for smoothing
    const windowStart = now - windowMs;
    
    const pointsInWindow = pathRef.current.filter(p => p.timestamp >= windowStart);
    
    if (pointsInWindow.length < 2) {
      // If we haven't moved enough in the window, but we are running, 
      // check if we've actually stopped
      const lastPoint = pathRef.current[pathRef.current.length - 1];
      if (now - lastPoint.timestamp > 10000) setCurrentPace(0);
      return;
    }

    const first = pointsInWindow[0];
    const last = pointsInWindow[pointsInWindow.length - 1];
    
    const distDiff = last.dist - first.dist;
    const timeDiffSec = (last.timestamp - first.timestamp) / 1000;
    
    if (distDiff > 0.002) { // Only update if there's measurable movement
      const pace = timeDiffSec / distDiff;
      setCurrentPace(pace);
    } else if (timeDiffSec > 15) {
      setCurrentPace(0); // Effectively stopped
    }
  };

  useEffect(() => {
    if (phase === 'running') {
      const startTime = Date.now() - elapsed;
      
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        setElapsed(now - startTime);
        updateRollingPace();
      }, 1000);

      if ('geolocation' in navigator) {
        setGpsStatus('searching');
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
            setAccuracy(acc);
            
            // Allow slightly worse accuracy initially to get a lock
            if (acc > 50 && pathRef.current.length > 5) return;
            
            setGpsStatus('active');
            const now = Date.now();
            const lastPoint = pathRef.current[pathRef.current.length - 1];

            if (!weatherFetchedRef.current) {
              getWeatherByLocation(lat, lng).then(data => {
                setWeather(data);
                weatherFetchedRef.current = true;
              });
            }

            let newTotalDist = distanceKm;
            if (lastPoint) {
              const d = calculateDistance(lastPoint.lat, lastPoint.lng, lat, lng);
              // Filter out jitter (less than 2 meters)
              if (d > 0.002) {
                newTotalDist += d;
                setDistanceKm(newTotalDist);
                
                if (newTotalDist - lastSampleDistRef.current > 0.1) {
                  samplesRef.current.push({ 
                    distance: newTotalDist, 
                    pace: currentPace, 
                    elapsedMs: now - startTime,
                    timestamp: now 
                  });
                  lastSampleDistRef.current = newTotalDist;
                }
              }
            }
            
            pathRef.current.push({ lat, lng, timestamp: now, dist: newTotalDist });
          },
          (err) => {
            console.error("GPS Error", err);
            setGpsStatus('error');
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [phase]);

  const handleStop = () => {
    onFinish({
      startTime: Date.now() - elapsed,
      endTime: Date.now(),
      totalDistanceKm: distanceKm,
      coordinates: pathRef.current.map(({lat, lng, timestamp}) => ({lat, lng, timestamp})),
      currentPaceSecondsPerKm: currentPace,
      paceSamples: samplesRef.current,
      weather
    });
  };

  const handleReset = () => {
    setElapsed(0);
    setDistanceKm(0);
    setCurrentPace(0);
    pathRef.current = [];
    samplesRef.current = [];
    lastSampleDistRef.current = 0;
    weatherFetchedRef.current = false;
    setGpsStatus('idle');
    setAccuracy(null);
    onPhaseChange('idle');
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatPace = (secs: number) => {
    if (!secs || !isFinite(secs) || secs <= 0) return '0:00';
    if (secs > 3600) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const nextHydrationKm = Math.ceil((distanceKm + 0.001) / plan.hydrationIntervalKm) * plan.hydrationIntervalKm;
  const nextGelKm = Math.ceil((distanceKm + 0.001) / plan.gelIntervalKm) * plan.gelIntervalKm;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`text-5xl md:text-6xl font-black font-heading tabular-nums tracking-tight mb-6 ${theme === 'dark' ? 'text-white' : activeTheme.text}`}>
          {formatTime(elapsed)}
        </div>
        
        <div className="flex gap-3 justify-center">
          {phase !== 'running' ? (
            <button
              onClick={() => onPhaseChange('running')}
              className={`flex-1 py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 text-lg ${activeTheme.accent} shadow-current/20`}
            >
              Start Tracking
            </button>
          ) : (
            <button
              onClick={handleStop}
              className={`flex-1 py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 text-lg bg-red-500 shadow-red-500/20`}
            >
              Finish Race
            </button>
          )}
          
          {elapsed > 0 && phase !== 'running' && (
            <button onClick={handleReset} className={`px-6 py-4 rounded-2xl font-bold bg-black/5 hover:bg-black/10 transition-all ${activeTheme.text}`}>
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-5 rounded-2xl border ${activeTheme.border} bg-black/5 flex flex-col items-center relative`}>
          <span className="text-[10px] uppercase font-black opacity-40 mb-1 tracking-widest">Distance</span>
          <span className="text-2xl md:text-3xl font-black">{distanceKm.toFixed(2)} <span className="text-sm opacity-40">KM</span></span>
          <div className="flex items-center gap-1.5 mt-2">
             <div className={`w-2 h-2 rounded-full ${gpsStatus === 'active' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
             <span className="text-[10px] font-bold opacity-60 uppercase">{gpsStatus} {accuracy && `(${accuracy.toFixed(0)}m)`}</span>
          </div>
        </div>
        <div className={`p-5 rounded-2xl border ${activeTheme.border} bg-black/5 flex flex-col items-center`}>
          <span className="text-[10px] uppercase font-black opacity-40 mb-1 tracking-widest">Live Pace</span>
          <span className={`text-2xl md:text-3xl font-black ${currentPace > plan.averagePaceSecondsPerKm + 5 ? 'text-red-500' : ''}`}>
            {formatPace(currentPace)}
          </span>
          <span className="text-[10px] font-bold opacity-40 mt-2 uppercase tracking-widest">MIN/KM</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex flex-col items-center">
          <span className="text-[10px] font-black uppercase text-blue-500/60 mb-1">Water</span>
          <span className="text-lg font-black text-blue-600">{nextHydrationKm} km</span>
        </div>
        <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex flex-col items-center">
          <span className="text-[10px] font-black uppercase text-orange-500/60 mb-1">Fuel</span>
          <span className="text-lg font-black text-orange-600">{nextGelKm} km</span>
        </div>
      </div>

      <div className="relative pt-2">
        <div className="w-full bg-black/10 h-3 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${activeTheme.accent}`}
            style={{ width: `${Math.min(100, (distanceKm / plan.distanceKm) * 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-black opacity-40 uppercase tracking-tighter">
          <span>Start</span>
          <span>Goal: {plan.distanceKm.toFixed(1)} km</span>
        </div>
      </div>
    </div>
  );
};

export default RaceTimer;
