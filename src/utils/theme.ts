import { ThemeColor, WallpaperId } from '../types';

export interface ThemePalette {
  id: ThemeColor;
  name: string;
  hex: string;
  activeBg: string;
  activeText: string;
  badgeBg: string;
  textAccent: string;
  borderAccent: string;
  glowShadow: string;
}

export const THEME_PALETTES: Record<ThemeColor, ThemePalette> = {
  cyan: {
    id: 'cyan',
    name: 'Cyber Cyan',
    hex: '#06b6d4',
    activeBg: 'bg-cyan-500 text-black',
    activeText: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    textAccent: 'text-cyan-400',
    borderAccent: 'border-cyan-500/40',
    glowShadow: 'shadow-cyan-500/20',
  },
  purple: {
    id: 'purple',
    name: 'Neon Purple',
    hex: '#a855f7',
    activeBg: 'bg-purple-500 text-white',
    activeText: 'text-purple-400',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    textAccent: 'text-purple-400',
    borderAccent: 'border-purple-500/40',
    glowShadow: 'shadow-purple-500/20',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Matrix',
    hex: '#10b981',
    activeBg: 'bg-emerald-500 text-black',
    activeText: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    textAccent: 'text-emerald-400',
    borderAccent: 'border-emerald-500/40',
    glowShadow: 'shadow-emerald-500/20',
  },
  rose: {
    id: 'rose',
    name: 'Crimson Fury',
    hex: '#f43f5e',
    activeBg: 'bg-rose-500 text-white',
    activeText: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    textAccent: 'text-rose-400',
    borderAccent: 'border-rose-500/40',
    glowShadow: 'shadow-rose-500/20',
  },
  amber: {
    id: 'amber',
    name: 'Gold Rush',
    hex: '#f59e0b',
    activeBg: 'bg-amber-400 text-black',
    activeText: 'text-amber-400',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    textAccent: 'text-amber-400',
    borderAccent: 'border-amber-500/40',
    glowShadow: 'shadow-amber-500/20',
  },
};

export interface WallpaperOption {
  id: WallpaperId;
  name: string;
  description: string;
  style: React.CSSProperties;
}

export const WALLPAPER_PRESETS: WallpaperOption[] = [
  {
    id: 'obsidian',
    name: 'Obsidian Matte',
    description: 'Clean dark gaming studio base',
    style: {
      backgroundColor: '#0B0E14',
    },
  },
  {
    id: 'cyber-grid',
    name: 'Cyber Neon Grid',
    description: 'Subtle cyan & purple esports grid',
    style: {
      backgroundColor: '#090D16',
      backgroundImage:
        'radial-gradient(circle at 15% 15%, rgba(6,182,212,0.14), transparent 40%), radial-gradient(circle at 85% 80%, rgba(168,85,247,0.14), transparent 45%), linear-gradient(rgba(30,41,59,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.22) 1px, transparent 1px)',
      backgroundSize: '100% 100%, 100% 100%, 36px 36px, 36px 36px',
    },
  },
  {
    id: 'neon-arena',
    name: 'RGB Arena Glow',
    description: 'Dual neon corner ambient lighting',
    style: {
      backgroundColor: '#07090F',
      backgroundImage:
        'radial-gradient(circle at 0% 0%, rgba(244,63,94,0.16), transparent 45%), radial-gradient(circle at 100% 0%, rgba(6,182,212,0.16), transparent 45%), radial-gradient(circle at 50% 100%, rgba(139,92,246,0.12), transparent 50%)',
    },
  },
  {
    id: 'deep-space',
    name: 'Deep Space Emerald',
    description: 'Dark emerald & slate gradient',
    style: {
      backgroundColor: '#070D0E',
      backgroundImage:
        'radial-gradient(ellipse at top right, rgba(16,185,129,0.16), transparent 50%), radial-gradient(ellipse at bottom left, rgba(14,165,233,0.12), transparent 50%)',
    },
  },
  {
    id: 'midnight-purple',
    name: 'Midnight Violet',
    description: 'Rich console lounge atmosphere',
    style: {
      backgroundColor: '#0C0915',
      backgroundImage:
        'radial-gradient(circle at 75% 20%, rgba(168,85,247,0.18), transparent 48%), radial-gradient(circle at 20% 80%, rgba(236,72,153,0.12), transparent 45%)',
    },
  },
];

export function getThemePalette(themeColor?: ThemeColor): ThemePalette {
  return THEME_PALETTES[themeColor || 'cyan'] || THEME_PALETTES.cyan;
}

export function getWallpaperBackgroundStyle(
  wallpaperId?: WallpaperId,
  customUrl?: string,
  dimPercent: number = 75
): React.CSSProperties {
  if (wallpaperId === 'custom' && customUrl?.trim()) {
    const alpha = Math.min(0.95, Math.max(0.2, dimPercent / 100));
    return {
      backgroundImage: `linear-gradient(rgba(11,14,20,${alpha}), rgba(11,14,20,${alpha})), url("${customUrl.trim()}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    };
  }
  const found = WALLPAPER_PRESETS.find((w) => w.id === wallpaperId) || WALLPAPER_PRESETS[0];
  return found.style;
}
