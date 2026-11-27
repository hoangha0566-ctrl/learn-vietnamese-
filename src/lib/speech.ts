// Phát âm: ưu tiên file mp3 (trường "audio"), nếu không có thì dùng giọng vi-VN của trình duyệt.
import { settingsStore } from './store';

let viVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;
const listeners = new Set<() => void>();

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return;
  voicesLoaded = true;
  const vi = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('vi'));
  // ưu tiên giọng Google / Microsoft online (tự nhiên hơn)
  viVoice =
    vi.find((v) => /google/i.test(v.name)) ?? vi.find((v) => /online|natural/i.test(v.name)) ?? vi[0] ?? null;
  listeners.forEach((f) => f());
}

if (typeof speechSynthesis !== 'undefined') {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function onVoicesChanged(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const ttsSupported = () => typeof speechSynthesis !== 'undefined';
export const hasVietnameseVoice = () => !!viVoice;
export const voicesReady = () => voicesLoaded;

let currentAudio: HTMLAudioElement | null = null;

export function resolveAsset(path: string): string {
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '');
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (ttsSupported()) speechSynthesis.cancel();
}

export interface SpeakOpts {
  audio?: string;
  rate?: number;
  slow?: boolean;
}

export function speak(text: string, opts: SpeakOpts = {}): Promise<void> {
  stopSpeaking();
  const slow = opts.slow ?? settingsStore.get().slow;
  const rate = opts.rate ?? (slow ? 0.7 : 1);
  if (opts.audio) {
    return new Promise((resolve) => {
      const a = new Audio(resolveAsset(opts.audio!));
      a.playbackRate = rate;
      currentAudio = a;
      a.onended = () => resolve();
      a.onerror = () => {
        // file lỗi → đọc bằng giọng máy
        speakTTS(text, rate).then(resolve);
      };
      a.play().catch(() => speakTTS(text, rate).then(resolve));
    });
  }
  return speakTTS(text, rate);
}

function speakTTS(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!ttsSupported()) return resolve();
    const clean = text.replace(/[_]{2,}/g, '…').replace(/[{}]/g, '');
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'vi-VN';
    if (viVoice) u.voice = viVoice;
    u.rate = rate * 0.95;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
    // Chrome đôi khi không gọi onend
    setTimeout(resolve, Math.max(2500, clean.length * 140) / rate);
  });
}

// ---------------- Nhận diện giọng nói ----------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

export function recognitionSupported(): boolean {
  const w = window as unknown as Record<string, unknown>;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function listen(onResult: (texts: string[]) => void, onEnd: () => void): () => void {
  const w = window as unknown as Record<string, AnyRecognition>;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) {
    onEnd();
    return () => {};
  }
  const rec = new Ctor();
  rec.lang = 'vi-VN';
  rec.interimResults = false;
  rec.maxAlternatives = 5;
  rec.onresult = (e: AnyRecognition) => {
    const res = e.results[0];
    const texts: string[] = [];
    for (let i = 0; i < res.length; i++) texts.push(res[i].transcript);
    onResult(texts);
  };
  rec.onerror = () => onEnd();
  rec.onend = () => onEnd();
  rec.start();
  return () => {
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
  };
}
