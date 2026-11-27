// Tự sinh thêm bài tập từ từ vựng / hội thoại của bài (nối từ, nghe chọn, chọn dấu thanh, luyện nói, chính tả).
import type { Exercise, Lesson, VocabItem } from '../types';
import { getTone, sample, shuffle } from './vietnamese';

const cleanWord = (w: string) => w.split('/')[0].replace(/[…?]/g, '').trim();

export function vocabMatch(vocab: VocabItem[]): Exercise | null {
  const v = vocab.filter((x) => x.word && x.meaning);
  if (v.length < 4) return null;
  const chunks: VocabItem[][] = [];
  const shuffled = shuffle(v);
  for (let i = 0; i < shuffled.length; i += 6) chunks.push(shuffled.slice(i, i + 6));
  if (chunks.length > 1 && chunks[chunks.length - 1].length < 3) {
    const last = chunks.pop()!;
    chunks[chunks.length - 1].push(...last);
  }
  return {
    type: 'vocab-match',
    title: 'Nối từ với nghĩa',
    titleEn: 'Match words and meanings',
    auto: true,
    items: chunks.slice(0, 4).map((c) => ({ pairs: c.map((x) => ({ left: x.word, right: x.meaning })) })),
  };
}

export function listenChoose(lesson: Lesson): Exercise | null {
  const lines = (lesson.dialogues ?? []).flatMap((d) => d.lines).filter((l) => l.vi.length < 70);
  if (lines.length < 4) return null;
  const picks = sample(lines, Math.min(6, lines.length));
  return {
    type: 'listen-choose',
    title: 'Nghe và chọn',
    titleEn: 'Listen and choose',
    auto: true,
    items: picks.map((l) => {
      const distract = sample(
        lines.filter((x) => x.vi !== l.vi),
        3,
      ).map((x) => x.vi);
      const options = shuffle([l.vi, ...distract]);
      return { q: l.vi, audio: l.audio, options, answer: options.indexOf(l.vi) };
    }),
  };
}

export function tonePick(vocab: VocabItem[]): Exercise | null {
  const words = vocab
    .map((v) => cleanWord(v.word))
    .filter((w) => w && w.split(' ').length <= 2 && /^[\p{L} ]+$/u.test(w) && w.split(' ').some((s) => getTone(s) !== 'ngang'));
  if (words.length < 3) return null;
  return {
    type: 'tone-pick',
    title: 'Chọn dấu thanh',
    titleEn: 'Choose the tone marks',
    auto: true,
    items: sample(words, Math.min(8, words.length)).map((w) => ({ base: w, answers: [w] })),
  };
}

export function speaking(lesson: Lesson): Exercise | null {
  const lines = (lesson.dialogues ?? []).flatMap((d) => d.lines).filter((l) => l.vi.length < 60);
  if (!lines.length) return null;
  return {
    type: 'speaking',
    title: 'Luyện nói',
    titleEn: 'Speaking practice',
    auto: true,
    items: sample(lines, Math.min(6, lines.length)).map((l) => ({ q: l.vi, en: l.en, audio: l.audio })),
  };
}

export function dictation(lesson: Lesson): Exercise | null {
  const lines = (lesson.dialogues ?? []).flatMap((d) => d.lines).filter((l) => l.vi.length < 45);
  if (lines.length < 3) return null;
  return {
    type: 'dictation',
    title: 'Nghe và viết',
    titleEn: 'Dictation',
    auto: true,
    items: sample(lines, Math.min(5, lines.length)).map((l) => ({ q: l.vi, answers: [l.vi], audio: l.audio })),
  };
}

export function readingTrueFalse(lesson: Lesson): Exercise | null {
  const tf = lesson.reading?.trueFalse;
  if (!tf?.length) return null;
  return {
    type: 'true-false',
    title: 'Đúng hay sai?',
    titleEn: 'True or false?',
    items: tf.map((x) => ({ q: x.q, answer: x.answer })),
  };
}

export function readingQuestions(lesson: Lesson): Exercise | null {
  const qs = lesson.reading?.questions;
  if (!qs?.length) return null;
  return {
    type: 'rewrite',
    title: 'Trả lời câu hỏi',
    titleEn: 'Answer the questions',
    items: qs.map((x) => ({ q: x.q, answers: x.answers, instruction: 'Trả lời câu hỏi' })),
  };
}

/** Tất cả bài tập của bài: bài tập trong file + bài tập tự sinh (cache theo bài) */
const cache = new Map<string, { key: Lesson; list: Exercise[] }>();
export function allExercises(lesson: Lesson): Exercise[] {
  const c = cache.get(lesson.id);
  if (c && c.key === lesson) return c.list;
  const base = (lesson.exercises ?? []).filter((e) => e.type !== 'substitution');
  const hasType = (t: string) => base.some((e) => e.type === t);
  const extra = [
    vocabMatch(lesson.vocabulary ?? []),
    tonePick(lesson.vocabulary ?? []),
    hasType('dictation') ? null : dictation(lesson),
    listenChoose(lesson),
    speaking(lesson),
  ].filter(Boolean) as Exercise[];
  const list = [...base, ...extra];
  cache.set(lesson.id, { key: lesson, list });
  return list;
}

export function substitutionDrills(lesson: Lesson): Exercise[] {
  return (lesson.exercises ?? []).filter((e) => e.type === 'substitution');
}
