// Procedural fantasy-flavored sound effects via the Web Audio API — no audio files.
// PLACEHOLDER audio: bells, harp-like plucks, a sword whoosh, shield clangs, and a shared
// hall reverb to give everything a "magic" space. The user may author/replace these later.
//
// Building blocks:
// - bell(): additive inharmonic partials (struck metal / chimes)
// - pluck(): bright attack that decays and darkens (harp / lute)
// - noise(): filtered noise bursts (whooshes, impacts, card flicks)
// Everything feeds a master bus with a dry path and a reverb send.

import { effectiveVolume, onSettingsChange } from '../settings';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let dryBus: GainNode;
let reverbSend: GainNode;
let noiseBuffer: AudioBuffer;

/** Loudness of the whole mix at full volume; the player's volume setting scales it. */
const MASTER_LEVEL = 0.55;

// follow the volume and mute settings as they change
onSettingsChange(() => {
  if (master) master.gain.value = MASTER_LEVEL * effectiveVolume();
});

function audio(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = MASTER_LEVEL * effectiveVolume();
    master.connect(ctx.destination);

    dryBus = ctx.createGain();
    dryBus.connect(master);

    // generated impulse response: ~2.2s of decaying stereo noise = a stone-hall reverb
    const reverb = ctx.createConvolver();
    const length = Math.floor(ctx.sampleRate * 2.2);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    reverb.buffer = impulse;
    reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.35;
    reverbSend.connect(reverb).connect(master);

    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Routes a voice to the dry bus plus `wet` (0-1) of it into the reverb. */
function out(node: AudioNode, wet: number): void {
  node.connect(dryBus);
  if (wet > 0) {
    const send = audio().createGain();
    send.gain.value = wet;
    node.connect(send).connect(reverbSend);
  }
}

/** Gain envelope: quick attack to `peak`, exponential decay over `decay` seconds. */
function envelope(at: number, peak: number, decay: number, attack = 0.005): GainNode {
  const g = audio().createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  return g;
}

function osc(type: OscillatorType, freq: number, at: number, stopAt: number, into: AudioNode): OscillatorNode {
  const o = audio().createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  o.connect(into);
  o.start(at);
  o.stop(stopAt);
  return o;
}

interface VoiceOpts {
  delay?: number;
  volume?: number;
  wet?: number;
}

/** Struck bell / chime: inharmonic partials, higher ones dying faster. */
function bell(freq: number, decay: number, { delay = 0, volume = 0.12, wet = 0.5 }: VoiceOpts = {}): void {
  const at = audio().currentTime + delay;
  const partials: [ratio: number, amp: number, decayScale: number][] = [
    [1, 1, 1],
    [2.01, 0.45, 0.6],
    [2.76, 0.3, 0.45],
    [5.4, 0.12, 0.25],
  ];
  for (const [ratio, amp, decayScale] of partials) {
    const g = envelope(at, volume * amp, decay * decayScale, 0.002);
    out(g, wet);
    osc('sine', freq * ratio, at, at + decay + 0.05, g);
  }
}

/** Harp-like pluck: bright triangle whose brightness and level fall away together. */
function pluck(freq: number, { delay = 0, volume = 0.14, wet = 0.4, decay = 0.9 }: VoiceOpts & { decay?: number } = {}): void {
  const a = audio();
  const at = a.currentTime + delay;
  const g = envelope(at, volume, decay, 0.003);
  const tone = a.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.setValueAtTime(freq * 8, at);
  tone.frequency.exponentialRampToValueAtTime(freq * 1.5, at + decay * 0.6);
  tone.connect(g);
  out(g, wet);
  osc('triangle', freq, at, at + decay + 0.05, tone);
  osc('sine', freq * 2, at, at + decay * 0.5, tone); // octave shimmer on the attack
}

/** Filtered noise burst; the filter sweeps from `from` to `to` Hz (whooshes, impacts, flicks). */
function noise(
  duration: number,
  filter: BiquadFilterType,
  from: number,
  to: number,
  { delay = 0, volume = 0.2, wet = 0.15, q = 1 }: VoiceOpts & { q?: number } = {}
): void {
  const a = audio();
  const at = a.currentTime + delay;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer;
  const f = a.createBiquadFilter();
  f.type = filter;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, at);
  f.frequency.exponentialRampToValueAtTime(to, at + duration);
  const g = envelope(at, volume, duration, Math.min(0.03, duration / 4));
  src.connect(f).connect(g);
  out(g, wet);
  src.start(at);
  src.stop(at + duration + 0.05);
}

/** Low pitched thump with a downward pitch drop (body hits, drums). */
function thump(from: number, to: number, decay: number, { delay = 0, volume = 0.35, wet = 0.1 }: VoiceOpts = {}): void {
  const at = audio().currentTime + delay;
  const g = envelope(at, volume, decay, 0.003);
  out(g, wet);
  const o = osc('sine', from, at, at + decay + 0.05, g);
  o.frequency.exponentialRampToValueAtTime(to, at + decay);
}

// Note frequencies (D dorian-ish palette keeps every sound in one "key").
const D4 = 293.66;
const E4 = 329.63;
const F4 = 349.23;
const A3 = 220.0;
const A4 = 440.0;
const D5 = 587.33;
const E5 = 659.25;
const F5 = 698.46;
const A5 = 880.0;
const D6 = 1174.66;

export const Sfx = {
  /** Attack card flung at the enemy: a blade whoosh. */
  cardPlay: (): void => {
    noise(0.22, 'bandpass', 900, 3500, { volume: 0.55, q: 2.5, wet: 0.2 });
  },

  /** Skill / power cast: a rising sparkle of chimes. */
  cast: (): void => {
    [D5, F5, A5, D6].forEach((f, i) => bell(f, 0.9, { delay: i * 0.055, volume: 0.06, wet: 0.6 }));
    noise(0.35, 'highpass', 4000, 9000, { volume: 0.04, wet: 0.5 });
  },

  /** Enemy struck: body thump, crunch, and a short metallic ring. */
  hitEnemy: (): void => {
    thump(160, 55, 0.22, { volume: 0.4 });
    noise(0.12, 'lowpass', 2500, 400, { volume: 0.25 });
    bell(A3 * 2, 0.25, { volume: 0.05, wet: 0.2 });
  },

  /** Player struck: heavier, duller blow. */
  hitPlayer: (): void => {
    thump(120, 40, 0.35, { volume: 0.45 });
    noise(0.2, 'lowpass', 1200, 200, { volume: 0.3 });
  },

  /** Block gained: a shield clang. */
  block: (): void => {
    bell(E4 * 1.5, 0.45, { volume: 0.1, wet: 0.35 });
    noise(0.05, 'highpass', 3000, 6000, { volume: 0.08 });
  },

  /** Card drawn: a soft paper flick. */
  draw: (): void => {
    noise(0.05, 'highpass', 2500, 5000, { volume: 0.06, wet: 0.05 });
  },

  /** Rest stop heal: a slow, warm rising chime. */
  heal: (): void => {
    [D4, A4, D5, E5, A5].forEach((f, i) => bell(f, 1.6, { delay: i * 0.12, volume: 0.07, wet: 0.7 }));
  },

  /** Picking a reward: a quick harp flourish. */
  choose: (): void => {
    [A4, D5, E5].forEach((f, i) => pluck(f, { delay: i * 0.06, volume: 0.11 }));
  },

  /** Fight won: harp run up into a bright chord with a bell on top. */
  victory: (): void => {
    [D4, F4, A4, D5, E5, A5].forEach((f, i) => pluck(f, { delay: i * 0.07, volume: 0.12, decay: 1.2 }));
    [D5, A5, D6].forEach((f) => bell(f, 2.2, { delay: 0.45, volume: 0.06, wet: 0.7 }));
  },

  /** Fight lost: a slow, low descent that rings out in the hall. */
  defeat: (): void => {
    [A4, F4, D4, A3].forEach((f, i) => pluck(f, { delay: i * 0.28, volume: 0.13, decay: 1.8, wet: 0.7 }));
    thump(90, 35, 1.2, { delay: 0.85, volume: 0.3, wet: 0.5 });
  },
};
