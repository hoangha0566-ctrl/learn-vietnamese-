// Nạp dữ liệu bài học. Mọi file JSON trong ./vsl1/lessons và ./extra được nạp tự động.
// Giáo viên sửa bài trong trang "Quản lý nội dung" → bản sửa lưu trong localStorage (đè lên file gốc).
import type { Lesson, SyllabusEntry } from '../types';
import { createStore, useStore } from '../lib/store';
import syllabusJson from './syllabus.json';
import metaJson from './meta.json';
import pronunciationJson from './pronunciation.json';

const files = import.meta.glob<Lesson>(['./vsl1/lessons/*.json', './extra/*.json'], {
  eager: true,
  import: 'default',
});

const meta = metaJson.lessons as Record<string, { icon?: string; badge?: { vi: string; en: string } }>;

export const baseLessons: Lesson[] = Object.values(files)
  .map((l) => ({ ...l, icon: l.icon ?? meta[l.id]?.icon, badge: l.badge ?? meta[l.id]?.badge }))
  .sort((a, b) => a.number - b.number);

export const syllabus = syllabusJson.entries as SyllabusEntry[];
export const pronunciation = pronunciationJson;

/** Bản sửa của giáo viên: { [id]: Lesson }. Bài mới cũng nằm ở đây. */
export const overridesStore = createStore<Record<string, Lesson>>('overrides', {}, false);
/** Bài bị ẩn */
export const hiddenStore = createStore<string[]>('hidden', [], false);

let memo: { o: Record<string, Lesson>; list: Lesson[] } | null = null;
export function mergeLessons(overrides: Record<string, Lesson>): Lesson[] {
  if (memo && memo.o === overrides) return memo.list;
  const list = doMerge(overrides);
  memo = { o: overrides, list };
  return list;
}

function doMerge(overrides: Record<string, Lesson>): Lesson[] {
  const map = new Map<string, Lesson>();
  for (const l of baseLessons) map.set(l.id, l);
  for (const [id, l] of Object.entries(overrides)) {
    const base = map.get(id);
    map.set(id, { ...l, icon: l.icon ?? base?.icon ?? meta[id]?.icon, badge: l.badge ?? base?.badge ?? meta[id]?.badge });
  }
  return [...map.values()].sort((a, b) => a.number - b.number || a.id.localeCompare(b.id));
}

export function useLessons(): Lesson[] {
  const o = useStore(overridesStore);
  return mergeLessons(o);
}

export function useLesson(id: string): Lesson | undefined {
  return useLessons().find((l) => l.id === id);
}

export function getLesson(id: string): Lesson | undefined {
  return mergeLessons(overridesStore.get()).find((l) => l.id === id);
}

export function saveLesson(lesson: Lesson) {
  overridesStore.set((o) => ({ ...o, [lesson.id]: lesson }));
}

export function resetLesson(id: string) {
  overridesStore.set((o) => {
    const n = { ...o };
    delete n[id];
    return n;
  });
}

export function isOverridden(id: string) {
  return !!overridesStore.get()[id];
}
