// Minimal procedural sound effects via the Web Audio API — no audio files.
// Placeholder SFX to demonstrate "feel"; the user may author/replace these later.

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

interface ToneOptions {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  endFrequency?: number;
  volume?: number;
  delay?: number;
}

function playTone({ frequency, duration, type = 'sine', endFrequency, volume = 0.18, delay = 0 }: ToneOptions): void {
  const ctx = getContext();
  const startAt = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startAt);
  if (endFrequency) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 1), startAt + duration);
  }
  gain.gain.setValueAtTime(volume, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

export const Sfx = {
  cardPlay: (): void => playTone({ frequency: 440, endFrequency: 660, duration: 0.12, type: 'triangle', volume: 0.12 }),
  cast: (): void => playTone({ frequency: 520, endFrequency: 300, duration: 0.18, type: 'sine', volume: 0.14 }),
  hitEnemy: (): void => playTone({ frequency: 180, endFrequency: 70, duration: 0.15, type: 'sawtooth', volume: 0.2 }),
  hitPlayer: (): void => playTone({ frequency: 150, endFrequency: 55, duration: 0.2, type: 'square', volume: 0.2 }),
  block: (): void => playTone({ frequency: 300, endFrequency: 520, duration: 0.1, type: 'sine', volume: 0.14 }),
  draw: (): void => playTone({ frequency: 700, endFrequency: 900, duration: 0.06, type: 'triangle', volume: 0.08 }),
  victory: (): void => {
    playTone({ frequency: 523, duration: 0.15, type: 'triangle' });
    playTone({ frequency: 659, duration: 0.15, type: 'triangle', delay: 0.12 });
    playTone({ frequency: 784, duration: 0.35, type: 'triangle', delay: 0.24 });
  },
  defeat: (): void => playTone({ frequency: 220, endFrequency: 90, duration: 0.6, type: 'sawtooth', volume: 0.2 }),
};
