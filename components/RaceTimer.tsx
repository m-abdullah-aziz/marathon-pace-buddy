
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
  const [gpsActive, setGpsActive] = useState(false);
  const [weather, setWeather] = useState<WeatherInfo | undefined>();
  const [fetchingWeather, setFetchingWeather] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pathRef = useRef<{ lat: number; lng: number; timestamp: number }[]>([]);
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

  useEffect(() => {
    if (phase === 'running') {
      const startTime = Date.now() - elapsed;
      timerRef.current = window.setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 100);

      if ('geolocation' in navigator) {
        setGpsActive(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            const now = Date.now();
            const lastPoint = pathRef.current[pathRef.current.length - 1];

            // Fetch weather once on first location
            if (!weatherFetchedRef.current && !fetchingWeather) {
              setFetchingWeather(true);
              getWeatherByLocation(lat, lng).then(data => {
                setWeather(data);
                weatherFetchedRef.current = true;
                setFetchingWeather(false);
              });
            }

            if (lastPoint) {
              const d = calculateDistance(lastPoint.lat, lastPoint.lng, lat, lng);
              if (d > 0.002) { 
                const newDist = distanceKm + d;
                setDistanceKm(newDist);
                const timeDiffSec = (now - lastPoint.timestamp) / 1000;
                const pace = timeDiffSec / d;
                setCurrentPace(pace);

                if (newDist - lastSampleDistRef.current > 0.25) {
                  samplesRef.current.push({ distance: newDist, pace, timestamp: now });
                  lastSampleDistRef.current = newDist;
                }
              }
            }
            pathRef.current.push({ lat, lng, timestamp: now });
          },
          (err) => console.error("GPS Error", err),
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
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

  const handleStart = () => onPhaseChange('running');
  
  const handleStop = () => {
    const session: RaceSession = {
      startTime: Date.now() - elapsed,
      endTime: Date.now(),
      totalDistanceKm: distanceKm > 0 ? distanceKm : (elapsed / 1000) / plan.averagePaceSecondsPerKm,
      coordinates: pathRef.current,
      currentPaceSecondsPerKm: currentPace,
      paceSamples: samplesRef.current,
      weather
    };
    onFinish(session);
  };

  const handleReset = () => {
    setElapsed(0);
    setDistanceKm(0);
    setCurrentPace(0);
    pathRef.current = [];
    samplesRef.current = [];
    lastSampleDistRef.current = 0;
    setWeather(undefined);
    weatherFetchedRef.current = false;
    onPhaseChange('idle');
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const deciseconds = Math.floor((ms % 1000) / 100);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${deciseconds}`;
  };

  const formatPace = (secs: number) => {
    if (!secs || !isFinite(secs)) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const displayDistance = distanceKm > 0 ? distanceKm : (elapsed / 1000) / plan.averagePaceSecondsPerKm;
  const nextHydrationKm = Math.ceil((displayDistance + 0.001) / plan.hydrationIntervalKm) * plan.hydrationIntervalKm;
  const nextGelKm = Math.ceil((displayDistance + 0.001) / plan.gelIntervalKm) * plan.gelIntervalKm;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center">
        <div className={`text-4xl md:text-5xl lg:text-6xl font-black font-heading tabular-nums tracking-tight mb-4 ${theme === 'dark' ? 'text-white' : activeTheme.text}`}>
          {formatTime(elapsed)}
        </div>
        
        <div className="flex gap-2 justify-center">
          {phase !== 'running' ? (
            <button
              onClick={handleStart}
              className={`flex-1 py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 text-lg ${activeTheme.accent} shadow-current/20`}
            >
              Start Race
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
            <button
              onClick={handleReset}
              className={`px-6 py-4 rounded-2xl font-bold bg-black/5 hover:bg-black/10 transition-all active:scale-95 ${activeTheme.text}`}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {weather && (
        <div className={`p-4 rounded-2xl border ${activeTheme.border} bg-yellow-500/5 animate-in fade-in duration-700`}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">☀️</div>
            <div>
              <p className="text-xs font-black uppercase opacity-60">Race Day Weather</p>
              <p className="text-sm font-bold">{weather.temp} - {weather.description}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className={`p-4 rounded-xl border ${activeTheme.border} bg-black/5 flex flex-col items-center`}>
          <span className="text-[10px] uppercase font-bold opacity-60 mb-1">Live Distance</span>
          <span className="text-xl md:text-2xl font-black">{displayDistance.toFixed(2)} km</span>
          <span className="text-[10px] opacity-40 font-bold">{gpsActive ? 'GPS ACTIVE' : 'PREDICTED'}</span>
        </div>
        <div className={`p-4 rounded-xl border ${activeTheme.border} bg-black/5 flex flex-col items-center`}>
          <span className="text-[10px] uppercase font-bold opacity-60 mb-1">Live Pace</span>
          <span className={`text-xl md:text-2xl font-black ${currentPace > plan.averagePaceSecondsPerKm ? 'text-red-500' : ''}`}>
            {formatPace(currentPace || (elapsed / 1000 / (displayDistance || 1)))}
          </span>
          <span className="text-[10px] opacity-40 font-bold">MIN/KM</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-xl border ${activeTheme.border} bg-blue-500/5 flex flex-col items-center`}>
          <span className="text-[10px] uppercase font-bold opacity-60 mb-1">Next Water</span>
          <span className="text-lg font-black text-blue-500">{nextHydrationKm.toFixed(0)} km</span>
        </div>
        <div className={`p-3 rounded-xl border ${activeTheme.border} bg-orange-500/5 flex flex-col items-center`}>
          <span className="text-[10px] uppercase font-bold opacity-60 mb-1">Next Fuel</span>
          <span className="text-lg font-black text-orange-500">{nextGelKm.toFixed(0)} km</span>
        </div>
      </div>
      
      <div className="w-full bg-black/10 h-3 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${activeTheme.accent}`}
          style={{ width: `${Math.min(100, (displayDistance / plan.distanceKm) * 100)}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-[10px] font-black opacity-50 uppercase tracking-tighter">
        <span>START</span>
        <span>Goal: {plan.distanceKm.toFixed(1)} km</span>
        <span>FINISH</span>
      </div>
    </div>
  );
};

export default RaceTimer;
