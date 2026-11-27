import type { Lesson } from '../types';
import { allExercises, substitutionDrills, listenChoose, dictation } from './autoExercises';
import type { Progress } from './store';

export interface SectionDef {
  key: string;
  icon: string;
  vi: string;
  en: string;
}

export const SECTION_DEFS: SectionDef[] = [
  { key: 'objectives', icon: '🎯', vi: 'Mục tiêu', en: 'Objectives' },
  { key: 'vocab', icon: '📚', vi: 'Từ vựng', en: 'Vocabulary' },
  { key: 'flashcard', icon: '🃏', vi: 'Flashcard', en: 'Flashcards' },
  { key: 'grammar', icon: '🧩', vi: 'Ngữ pháp – Ghi chú', en: 'Grammar notes' },
  { key: 'dialogue', icon: '💬', vi: 'Hội thoại', en: 'Dialogues' },
  { key: 'oral', icon: '🗣️', vi: 'Thực hành nói', en: 'Oral practice' },
  { key: 'listening', icon: '👂', vi: 'Thực hành nghe', en: 'Listening' },
  { key: 'reading', icon: '📖', vi: 'Bài đọc', en: 'Reading' },
  { key: 'exercises', icon: '✏️', vi: 'Bài tập', en: 'Exercises' },
  { key: 'game', icon: '🎮', vi: 'Game', en: 'Games' },
  { key: 'summary', icon: '🏆', vi: 'Tổng kết', en: 'Summary' },
];

/** Các phần có dữ liệu (phần trống sẽ bị ẩn) */
export function availableSections(l: Lesson): SectionDef[] {
  return SECTION_DEFS.filter((s) => {
    switch (s.key) {
      case 'objectives':
        return !!l.objectives?.length;
      case 'vocab':
      case 'flashcard':
        return !!l.vocabulary?.length;
      case 'grammar':
        return !!l.grammar?.length;
      case 'dialogue':
        return !!l.dialogues?.length || !!l.bookDialogues?.length;
      case 'oral':
        return substitutionDrills(l).length > 0;
      case 'listening':
        return !!listenChoose(l) || !!dictation(l);
      case 'reading':
        return !!l.reading?.text;
      case 'exercises':
        return allExercises(l).length > 0;
      case 'game':
        return !!l.games?.length;
      default:
        return true;
    }
  });
}

/** Các đơn vị dùng để tính % hoàn thành của bài */
export function progressUnits(l: Lesson): string[] {
  const units: string[] = [];
  for (const s of availableSections(l)) {
    if (s.key === 'summary') continue;
    if (s.key === 'exercises') allExercises(l).forEach((_, i) => units.push(`ex-${i}`));
    else if (s.key === 'game') (l.games ?? []).forEach((g) => units.push(`game-${g.type}`));
    else if (s.key === 'oral') substitutionDrills(l).flatMap((d) => d.items).forEach((_, i) => units.push(`oral-${i}`));
    else if (s.key === 'listening') units.push('listening-0');
    else units.push(s.key);
  }
  return units;
}

export function lessonPercent(l: Lesson, p: Progress): number {
  const units = progressUnits(l);
  if (!units.length) return 0;
  const lp = p[l.id] ?? {};
  return Math.round((units.filter((u) => lp[u]?.done).length / units.length) * 100);
}

export function lessonStars(l: Lesson, p: Progress): number {
  const lp = p[l.id] ?? {};
  return Object.values(lp).reduce((s, x) => s + (x.stars ?? 0), 0);
}
