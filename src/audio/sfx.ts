let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) { muted = m; }
export function isMuted(): boolean { return muted; }

export function getAudio(): AudioContext {
  if (!ctx) {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    ctx = new Ctx();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.15) {
  if (muted) return;
  const a = getAudio();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur + 0.05);
}

function noise(dur: number, gain = 0.2) {
  if (muted) return;
  const a = getAudio();
  const buffer = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buffer;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(g).connect(a.destination);
  src.start();
}

export type Cue = 'roll' | 'step' | 'snake' | 'ladder' | 'win';

export function play(cue: Cue) {
  switch (cue) {
    case 'roll':   noise(0.18); tone(220, 0.08, 'square', 0.05); break;
    case 'step':   tone(660, 0.05, 'triangle', 0.1); break;
    case 'snake':  tone(160, 0.4, 'sawtooth', 0.2); setTimeout(() => tone(110, 0.3, 'sawtooth', 0.15), 120); break;
    case 'ladder': tone(440, 0.1, 'sine', 0.15); setTimeout(() => tone(660, 0.1, 'sine', 0.15), 80); setTimeout(() => tone(880, 0.15, 'sine', 0.15), 160); break;
    case 'win':    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.18), i * 120)); break;
  }
}
