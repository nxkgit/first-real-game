/**
 * Player settings, remembered in the browser. Plain data plus a few change listeners; the screens
 * and the audio read from here. Storage access is guarded (it can be blocked), and a missing or
 * damaged entry just means the defaults.
 */
export interface Settings {
  /** 0 to 1. */
  volume: number;
  muted: boolean;
  /** 1 is normal; higher plays animations faster. */
  animationSpeed: number;
  /** Turns off screen shake. */
  reducedMotion: boolean;
}

export const ANIMATION_SPEEDS = [1, 1.5, 2];

const KEY = 'deckbuilder.settings.v1';
const DEFAULTS: Settings = { volume: 1, muted: false, animationSpeed: 1, reducedMotion: false };

let current: Settings = load();
const listeners = new Set<(s: Settings) => void>();

function clean(raw: unknown): Settings {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const volume = typeof r.volume === 'number' && r.volume >= 0 && r.volume <= 1 ? r.volume : DEFAULTS.volume;
  const speed = typeof r.animationSpeed === 'number' && ANIMATION_SPEEDS.includes(r.animationSpeed) ? r.animationSpeed : 1;
  return {
    volume,
    muted: r.muted === true,
    animationSpeed: speed,
    reducedMotion: r.reducedMotion === true,
  };
}

function load(): Settings {
  try {
    const text = window.localStorage.getItem(KEY);
    return text === null ? { ...DEFAULTS } : clean(JSON.parse(text));
  } catch {
    return { ...DEFAULTS };
  }
}

export function getSettings(): Readonly<Settings> {
  return current;
}

export function updateSettings(change: Partial<Settings>): void {
  current = clean({ ...current, ...change });
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // not remembered, but still applied for this visit
  }
  listeners.forEach((fn) => fn(current));
}

export function onSettingsChange(fn: (s: Settings) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** The loudness to apply to the master audio gain right now. */
export function effectiveVolume(): number {
  return current.muted ? 0 : current.volume;
}
