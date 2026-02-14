
import { AppTheme, RaceType } from './types';

export const MARATHON_KM = 42.195;
export const HALF_MARATHON_KM = 21.0975;
export const TEN_K_KM = 10.0;
export const FIVE_K_KM = 5.0;

export const DISTANCES: Record<RaceType, number> = {
  '5k': FIVE_K_KM,
  '10k': TEN_K_KM,
  'half': HALF_MARATHON_KM,
  'full': MARATHON_KM,
  'custom': 10.0
};

export const THEMES: Record<AppTheme, { 
  bg: string; 
  card: string; 
  text: string; 
  accent: string; 
  accentText: string; 
  border: string;
  input: string;
  muted: string;
}> = {
  dark: {
    bg: 'bg-[#0f172a]',
    card: 'bg-[#1e293b]',
    text: 'text-slate-100',
    accent: 'bg-indigo-500',
    accentText: 'text-indigo-400',
    border: 'border-slate-700',
    input: 'bg-slate-800 border-slate-700 text-white placeholder-slate-500',
    muted: 'text-slate-400'
  },
  pink: {
    bg: 'bg-[#fff1f2]',
    card: 'bg-white',
    text: 'text-[#500724]',
    accent: 'bg-rose-400',
    accentText: 'text-rose-600',
    border: 'border-rose-200',
    input: 'bg-white border-rose-300 text-[#500724] placeholder-rose-300',
    muted: 'text-rose-700'
  },
  green: {
    bg: 'bg-[#f0fdf4]',
    card: 'bg-white',
    text: 'text-[#064e3b]',
    accent: 'bg-emerald-500',
    accentText: 'text-emerald-700',
    border: 'border-emerald-200',
    input: 'bg-white border-emerald-300 text-[#064e3b] placeholder-emerald-300',
    muted: 'text-emerald-700'
  }
};
