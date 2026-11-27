// Kho dữ liệu nhỏ lưu trong localStorage, dùng được trong React qua useStore().
import { useSyncExternalStore } from 'react';

const PREFIX = 'vsl1:';

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function readLSRaw<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export interface Store<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(fn: () => void): () => void;
}

export function createStore<T>(key: string, initial: T, merge = true): Store<T> {
  let state: T = merge && typeof initial === 'object' && !Array.isArray(initial) ? readLS(key, initial) : readLSRaw(key, initial);
  const subs = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(state));
      } catch {
        /* bộ nhớ đầy hoặc bị chặn: bỏ qua */
      }
      subs.forEach((f) => f());
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

// ---------------- Các kho dùng trong app ----------------

export interface Settings {
  showEn: boolean;
  teacher: boolean;
  sound: boolean;
  slow: boolean;
  fontScale: number;
  view: 'book' | 'syllabus';
  vnKeyboard: boolean;
}

export const settingsStore = createStore<Settings>('settings', {
  showEn: true,
  teacher: false,
  sound: true,
  slow: false,
  fontScale: 1,
  view: 'book',
  vnKeyboard: true,
});

export interface WrongItem {
  q: string;
  answer: string;
  given?: string;
}

export interface SectionProgress {
  done: boolean;
  score?: number;
  total?: number;
  stars: number;
  wrong?: WrongItem[];
}

export type Progress = Record<string, Record<string, SectionProgress>>;
export const progressStore = createStore<Progress>('progress', {});

export function recordSection(lessonId: string, section: string, p: Partial<SectionProgress>) {
  progressStore.set((prev) => {
    const lesson = { ...(prev[lessonId] ?? {}) };
    const old = lesson[section] ?? { done: false, stars: 0 };
    const merged: SectionProgress = { ...old, ...p };
    merged.stars = Math.max(old.stars ?? 0, p.stars ?? 0);
    merged.done = old.done || !!p.done;
    lesson[section] = merged;
    return { ...prev, [lessonId]: lesson };
  });
  touchStreak();
}

export function starsFor(score: number, total: number): number {
  if (!total) return 1;
  const r = score / total;
  return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1;
}

// Sổ từ: hệ thống ôn tập ngắt quãng đơn giản (Leitner 5 hộp)
export interface WordState {
  box: number; // 0 = mới / cần ôn, 5 = đã thuộc
  due: number; // timestamp
  lesson: string;
}
export const wordsStore = createStore<Record<string, WordState>>('words', {}, false);
const BOX_DAYS = [0, 1, 2, 4, 7, 14];

export function markWord(word: string, lesson: string, known: boolean) {
  wordsStore.set((prev) => {
    const cur = prev[word] ?? { box: 0, due: 0, lesson };
    const box = known ? Math.min(5, cur.box + 1) : 0;
    const due = Date.now() + BOX_DAYS[box] * 86400000;
    return { ...prev, [word]: { box, due, lesson } };
  });
  touchStreak();
}

export function setWordKnown(word: string, lesson: string, known: boolean) {
  wordsStore.set((prev) => ({
    ...prev,
    [word]: { box: known ? 5 : 0, due: known ? Date.now() + 14 * 86400000 : 0, lesson },
  }));
}

// Chuỗi ngày học
export interface Streak {
  last: string;
  count: number;
  best: number;
}
export const streakStore = createStore<Streak>('streak', { last: '', count: 0, best: 0 });
const today = () => new Date().toISOString().slice(0, 10);

export function touchStreak() {
  if (settingsStore.get().teacher) return;
  const t = today();
  const s = streakStore.get();
  if (s.last === t) return;
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const count = s.last === y ? s.count + 1 : 1;
  streakStore.set({ last: t, count, best: Math.max(s.best, count) });
}

// Công cụ giáo viên
export interface Team {
  name: string;
  score: number;
  color: string;
}
export const teamsStore = createStore<Team[]>(
  'teams',
  [
    { name: 'Đội 1', score: 0, color: '#ef4444' },
    { name: 'Đội 2', score: 0, color: '#3b82f6' },
  ],
  false,
);
export const studentsStore = createStore<string[]>('students', [], false);

export function addTeamPoints(index: number, delta: number) {
  teamsStore.set((t) => t.map((team, i) => (i === index ? { ...team, score: team.score + delta } : team)));
}
