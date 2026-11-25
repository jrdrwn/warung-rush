// Warung Rush — sound effects made with the Web Audio API, no audio files.
// Every sound is a short oscillator or noise burst, so the game loads nothing.

let context = null;
let muted = false;

/** The shared AudioContext, created on the first user gesture. */
export function ensureAudio() {
  if (context === null) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

/** One short tone: frequency, length in seconds, waveform and gain. */
function tone(freq, seconds, type, gain) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + seconds);
}

/** A burst of filtered noise, for chopping and sizzling. */
function noise(seconds, filterFreq, gain) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
  source.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  source.start();
}

export function sfxPickup() {
  tone(520, 0.08, 'sine', 0.12);
}

export function sfxDrop() {
  tone(330, 0.07, 'sine', 0.1);
}

export function sfxChop() {
  noise(0.09, 1800, 0.25);
  tone(180, 0.06, 'square', 0.08);
}

export function sfxChopDone() {
  tone(660, 0.09, 'sine', 0.12);
  setTimeout(() => tone(880, 0.12, 'sine', 0.12), 70);
}

export function sfxSizzle() {
  noise(0.35, 5200, 0.1);
}

export function sfxTossPerfect() {
  tone(880, 0.1, 'sine', 0.14);
  setTimeout(() => tone(1174, 0.16, 'sine', 0.14), 80);
}

export function sfxTossMiss() {
  tone(220, 0.15, 'sawtooth', 0.08);
}

export function sfxServe() {
  tone(784, 0.1, 'sine', 0.14);
  setTimeout(() => tone(1046, 0.18, 'sine', 0.14), 90);
}

export function sfxAngry() {
  tone(196, 0.25, 'sawtooth', 0.1);
}

export function sfxError() {
  tone(160, 0.12, 'square', 0.09);
}

export function sfxClick() {
  tone(700, 0.05, 'sine', 0.08);
}

export function sfxNewOrder() {
  tone(587, 0.09, 'sine', 0.1);
  setTimeout(() => tone(740, 0.1, 'sine', 0.1), 80);
}

export function sfxGameOver() {
  tone(523, 0.2, 'sine', 0.12);
  setTimeout(() => tone(392, 0.25, 'sine', 0.12), 180);
  setTimeout(() => tone(330, 0.35, 'sine', 0.12), 360);
}
