
export type AppTheme = 'dark' | 'pink' | 'green';
export type RacePhase = 'idle' | 'running' | 'finished';
export type RaceType = '5k' | '10k' | 'half' | 'full' | 'custom';

export interface PacePlan {
  type: RaceType;
  distanceKm: number;
  targetTimeSeconds: number;
  averagePaceSecondsPerKm: number;
  hydrationIntervalKm: number;
  gelIntervalKm: number;
}

export interface SplitRow {
  km: number;
  elapsedTime: string;
  isHydrationPoint: boolean;
  isGelPoint: boolean;
}

export interface PaceSample {
  distance: number;
  pace: number; // seconds per km
  timestamp: number;
}

export interface WeatherInfo {
  temp: string;
  condition: string;
  description: string;
  sources: { title: string; uri: string }[];
}

export interface RaceSession {
  startTime: number;
  endTime?: number;
  totalDistanceKm: number;
  coordinates: { lat: number; lng: number; timestamp: number }[];
  currentPaceSecondsPerKm: number;
  paceSamples: PaceSample[];
  weather?: WeatherInfo;
}

export interface AIStrategyResponse {
  advice: string;
  suggestedSplits?: { km: number; pace: string }[];
}
