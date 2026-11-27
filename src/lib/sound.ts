// Hiệu ứng âm thanh nhẹ, tạo bằng Web Audio (không cần file).
import { settingsStore } from './store';

let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (!settingsStore.get().sound) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.15) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  correct() {
    tone(660, 0, 0.12, 'triangle');
    tone(990, 0.1, 0.2, 'triangle');
  },
  almost() {
    tone(520, 0, 0.12, 'triangle');
    tone(600, 0.1, 0.15, 'triangle');
  },
  wrong() {
    tone(200, 0, 0.18, 'square', 0.08);
    tone(150, 0.15, 0.25, 'square', 0.08);
  },
  click() {
    tone(880, 0, 0.05, 'sine', 0.08);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, 'triangle'));
  },
  tick() {
    tone(1200, 0, 0.03, 'square', 0.04);
  },
  alarm() {
    [0, 0.25, 0.5].forEach((s) => tone(880, s, 0.18, 'square', 0.1));
  },
};
