// Pure Web Audio API sound synthesis for Professor Maker.
// No external files or npm dependencies; synthesizes tactile, restrained audio using oscillators and noise.

export const SOUND_MUTED_KEY = 'pm-sound-muted';

let audioCtx = null;
let noiseBuffer = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

let memoryMuted = false;

export function isMuted() {
  if (typeof localStorage === 'undefined') return memoryMuted;
  try {
    const val = localStorage.getItem(SOUND_MUTED_KEY);
    if (val === null) return memoryMuted;
    return val === 'true';
  } catch {
    return memoryMuted;
  }
}

export function setMuted(muted) {
  memoryMuted = Boolean(muted);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(SOUND_MUTED_KEY, memoryMuted ? 'true' : 'false');
    } catch {}
  }
  return memoryMuted;
}

export function toggleMute() {
  const next = setMuted(!isMuted());
  if (!next) {
    try { getContext(); } catch {}
  }
  return next;
}

function getNoiseBuffer(ctx) {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

/**
 * Vintage typewriter mechanical tap: delicate, crisp click.
 */
export function playTypewriterClick() {
  if (isMuted()) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Short noise click
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2400 + (Math.random() * 400 - 200), now);
  filter.Q.setValueAtTime(3.5, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.08, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.03);

  // Tiny mechanical resonance tap
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(750, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.02);

  oscGain.gain.setValueAtTime(0.05, now);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.025);
}

/**
 * Soft paper / letter rustle sound.
 */
export function playPaperRustle() {
  if (isMuted()) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.18;

  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(800, now + duration);
  filter.Q.setValueAtTime(1.8, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + duration + 0.01);
}

/**
 * Counseling choice click: gentle, warm marimba/kalimba blip.
 */
export function playChoiceClick() {
  if (isMuted()) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.085;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.exponentialRampToValueAtTime(440.0, now + duration); // A4

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.01);
}

/**
 * True ending gratitude chime: resonant, warm, harmonic singing crystal bell.
 */
export function playTrueEndingChime() {
  if (isMuted()) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 2.6;

  // Harmonic partials (Solfeggio 528Hz + pure harmonics)
  const partials = [
    { freq: 528, gain: 0.14 },
    { freq: 1056, gain: 0.07 },
    { freq: 1584, gain: 0.035 },
    { freq: 2112, gain: 0.015 },
  ];

  partials.forEach(p => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.freq, now);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(p.gain, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(g);
    g.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  });
}

/**
 * Subtle tactile UI click.
 */
export function playClick() {
  if (isMuted()) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(680, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.025);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.03);
}
