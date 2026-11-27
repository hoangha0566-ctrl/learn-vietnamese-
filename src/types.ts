// Kiểu dữ liệu của một bài học (khớp với src/data/vsl1/README.md)

export interface Bi {
  vi: string;
  en: string;
}

export interface VocabItem {
  word: string;
  meaning: string;
  type?: string;
  example?: string;
  exampleEn?: string;
  image?: string; // emoji, hoặc đường dẫn ảnh trong /public/images
  audio?: string; // đường dẫn mp3 (ưu tiên hơn giọng máy)
}

export interface GrammarPoint {
  pattern: string;
  explainVi: string;
  explainEn: string;
  examples: Bi[];
  note?: string;
}

export interface DialogueLine {
  speaker: string;
  vi: string;
  en: string;
  audio?: string;
}

export interface Dialogue {
  title: string;
  titleEn?: string;
  lines: DialogueLine[];
}

export interface Reading {
  title: string;
  text: string;
  translation?: string;
  trueFalse?: { q: string; answer: boolean }[];
  questions?: { q: string; answers: string[] }[];
}

/** Một câu hỏi bài tập. Các trường dùng tuỳ theo `type` của bài tập. */
export interface ExerciseItem {
  q?: string;
  answers?: string[];
  options?: string[];
  answer?: number | boolean;
  explain?: string;
  words?: string[];
  frame?: string;
  slots?: string[][];
  en?: string;
  instruction?: string;
  audio?: string;
  image?: string;
  // tone-pick
  base?: string;
  // vocab-match
  pairs?: { left: string; right: string }[];
}

export type ExerciseType =
  | 'substitution'
  | 'fill-blank'
  | 'multiple-choice'
  | 'reorder'
  | 'rewrite'
  | 'translate-en-vi'
  | 'translate-vi-en'
  | 'dictation'
  | 'number-write'
  | 'clock'
  | 'listen-choose'
  | 'true-false'
  | 'tone-pick'
  | 'speaking'
  | 'vocab-match'
  | 'flashcard';

export interface Exercise {
  type: ExerciseType | string;
  title: string;
  titleEn?: string;
  items: ExerciseItem[];
  wordBank?: string[];
  freeAnswer?: boolean;
  /** Bài tập tự sinh từ từ vựng/hội thoại (không có trong file dữ liệu) */
  auto?: boolean;
}

export interface Game {
  type: string;
  title: string;
  titleEn?: string;
  intro?: string;
  introEn?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
}

export interface Lesson {
  id: string;
  number: number;
  bookLesson?: number | null;
  bookPages?: string;
  syllabusLessons?: (number | string)[];
  topic: string;
  topicEn: string;
  title: string;
  titleEn: string;
  icon?: string;
  badge?: Bi;
  objectives?: Bi[];
  bookDialogues?: { page: string; title: string }[];
  vocabulary?: VocabItem[];
  grammar?: GrammarPoint[];
  dialogues?: Dialogue[];
  reading?: Reading | null;
  exercises?: Exercise[];
  games?: Game[];
  /** Bài không có trong sách (ví dụ Bài 26 – bị/được) */
  extra?: boolean;
}

export interface SyllabusEntry {
  id: string | number;
  title: string;
  topic: string;
  grammar: string;
  game: string;
  lesson: string | null; // id bài trong app
  review?: boolean; // "xem xét lại / có thể bỏ"
}
