// Xử lý chữ tiếng Việt: chuẩn hoá, dấu thanh, chấm câu gõ tay.

export const TONES = ['ngang', 'huyền', 'sắc', 'hỏi', 'ngã', 'nặng'] as const;
export type Tone = (typeof TONES)[number];

const TONE_MARK: Record<Tone, string> = {
  ngang: '',
  huyền: '̀',
  sắc: '́',
  hỏi: '̉',
  ngã: '̃',
  nặng: '̣',
};
const MARK_TONE: Record<string, Tone> = {
  '̀': 'huyền',
  '́': 'sắc',
  '̉': 'hỏi',
  '̃': 'ngã',
  '̣': 'nặng',
};
export const TONE_SYMBOL: Record<Tone, string> = {
  ngang: '–',
  huyền: '`',
  sắc: '´',
  hỏi: '̉?',
  ngã: '~',
  nặng: '.',
};
export const TONE_EN: Record<Tone, string> = {
  ngang: 'level',
  huyền: 'falling',
  sắc: 'rising',
  hỏi: 'dipping',
  ngã: 'broken',
  nặng: 'heavy',
};
/** Ví dụ dấu thanh trên chữ a để vẽ nút */
export const TONE_ON_A: Record<Tone, string> = {
  ngang: 'a',
  huyền: 'à',
  sắc: 'á',
  hỏi: 'ả',
  ngã: 'ã',
  nặng: 'ạ',
};

const TONE_MARKS_RE = /[̣̀́̃̉]/g;
const ALL_MARKS_RE = /[̀-ͯ]/g;

export const nfc = (s: string) => s.normalize('NFC');

/** Bỏ dấu thanh, giữ â ă ê ô ơ ư đ */
export function stripTones(s: string): string {
  return s.normalize('NFD').replace(TONE_MARKS_RE, '').normalize('NFC');
}

/** Bỏ toàn bộ dấu (kể cả â ă ê ô ơ ư đ) */
export function stripAll(s: string): string {
  return s.normalize('NFD').replace(ALL_MARKS_RE, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFC');
}

export function getTone(syllable: string): Tone {
  const d = syllable.normalize('NFD');
  for (const ch of d) if (MARK_TONE[ch]) return MARK_TONE[ch];
  return 'ngang';
}

const VOWELS = 'aăâeêioôơuưy';
const HAT_VOWELS = 'ăâêôơư';

/** Đặt dấu thanh cho một âm tiết (kiểu mới: hoà, khoẻ, thuý) */
export function setTone(syllable: string, tone: Tone): string {
  const base = stripTones(nfc(syllable));
  const lower = base.toLowerCase();
  const chars = [...base];
  const lch = [...lower];
  let start = 0;
  if (lower.startsWith('qu')) start = 2;
  else if (lower.startsWith('gi') && lch.length > 2 && VOWELS.includes(lch[2])) start = 2;
  // tìm cụm nguyên âm
  let i = start;
  while (i < lch.length && !VOWELS.includes(lch[i])) i++;
  if (i >= lch.length) {
    // "gi" đứng một mình: dấu đặt trên i
    if (lower.startsWith('gi')) i = 1;
    else return base;
  }
  let j = i;
  while (j < lch.length && VOWELS.includes(lch[j])) j++;
  const cluster = lch.slice(i, j).join('');
  const hasFinal = j < lch.length;
  let pos = i;
  const hatIdx = [...cluster].map((c, k) => (HAT_VOWELS.includes(c) ? k : -1)).filter((k) => k >= 0);
  if (hatIdx.length) pos = i + hatIdx[hatIdx.length - 1];
  else if (cluster.length === 1) pos = i;
  else if (hasFinal) pos = j - 1;
  else if (['oa', 'oe', 'uy'].includes(cluster)) pos = i + 1;
  else if (cluster.length === 3) pos = i + 1;
  else pos = i;
  const mark = TONE_MARK[tone];
  chars[pos] = (chars[pos].normalize('NFD') + mark).normalize('NFC');
  return chars.join('');
}

// ---------------- Chấm câu gõ tay ----------------

const PLACEMENT_PAIRS: [string, string][] = [];
for (const v of ['a', 'e']) {
  for (const t of ['̀', '́', '̉', '̃', '̣']) {
    // òa → oà ; òe → oè
    PLACEMENT_PAIRS.push([nfc('o' + t + v), nfc('o' + v + t)]);
  }
}
for (const t of ['̀', '́', '̉', '̃', '̣']) {
  PLACEMENT_PAIRS.push([nfc('u' + t + 'y'), nfc('uy' + t)]);
}

const EN_CONTRACTIONS: [RegExp, string][] = [
  [/\bi'm\b/g, 'i am'],
  [/\byou're\b/g, 'you are'],
  [/\bwe're\b/g, 'we are'],
  [/\bthey're\b/g, 'they are'],
  [/\bhe's\b/g, 'he is'],
  [/\bshe's\b/g, 'she is'],
  [/\bit's\b/g, 'it is'],
  [/\bwhat's\b/g, 'what is'],
  [/\bwhere's\b/g, 'where is'],
  [/\bdon't\b/g, 'do not'],
  [/\bdoesn't\b/g, 'does not'],
  [/\bisn't\b/g, 'is not'],
  [/\baren't\b/g, 'are not'],
  [/\bcan't\b/g, 'cannot'],
  [/\bcan not\b/g, 'cannot'],
  [/\bi'll\b/g, 'i will'],
  [/\bhaven't\b/g, 'have not'],
  [/\bhasn't\b/g, 'has not'],
  [/\bwon't\b/g, 'will not'],
];

/** Chuẩn hoá để so sánh: NFC, thường, bỏ dấu câu, gộp khoảng trắng, đồng nhất cách đặt dấu và từ đồng nghĩa */
export function normalizeAnswer(s: string): string {
  let t = nfc(s).toLowerCase().replace(/[’‘`]/g, "'");
  for (const [re, rep] of EN_CONTRACTIONS) t = t.replace(re, rep);
  // số kiểu 2.450 → 2450
  t = t.replace(/(\d)[.,](\d{3})\b/g, '$1$2');
  t = t.replace(/[.,!?;:“”"«»…()[\]–—\-/]/g, ' ').replace(/'/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  for (const [a, b] of PLACEMENT_PAIRS) t = t.split(a).join(b);
  t = t
    .replace(/\bcám ơn\b/g, 'cảm ơn')
    .replace(/\bnghìn\b/g, 'ngàn')
    .replace(/\blinh\b/g, 'lẻ')
    .replace(/\bquẹo\b/g, 'rẽ')
    .replace(/\bdù\b/g, 'ô');
  return t;
}

export type GradeStatus = 'correct' | 'almost' | 'wrong';
export interface GradeResult {
  status: GradeStatus;
  /** đáp án gần nhất */
  best: string;
  /** chỉ số các từ (trong câu người học gõ) bị sai dấu */
  toneErrors: number[];
}

export function gradeText(input: string, answers: string[]): GradeResult {
  const inp = normalizeAnswer(input);
  if (!inp) return { status: 'wrong', best: answers[0] ?? '', toneErrors: [] };
  for (const a of answers) {
    if (normalizeAnswer(a) === inp) return { status: 'correct', best: a, toneErrors: [] };
  }
  // thiếu / sai dấu
  for (const strip of [stripTones, stripAll]) {
    for (const a of answers) {
      const na = normalizeAnswer(a);
      if (strip(na) === strip(inp)) {
        const iw = inp.split(' ');
        const aw = na.split(' ');
        const toneErrors = iw.map((w, k) => (w !== aw[k] ? k : -1)).filter((k) => k >= 0);
        return { status: 'almost', best: a, toneErrors };
      }
    }
  }
  return { status: 'wrong', best: answers[0] ?? '', toneErrors: [] };
}

/** Tách câu người học gõ thành các từ hiển thị (để tô màu chữ sai dấu) */
export function displayWords(input: string): string[] {
  return nfc(input).trim().split(/\s+/);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Điền mẫu "{name} là người {nationality}" */
export function fill(tpl: string, vars: Record<string, string | number | undefined>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => {
    if (vars[k] !== undefined) return String(vars[k]);
    const lower = k[0].toLowerCase() + k.slice(1);
    if (vars[lower] !== undefined) return capitalize(String(vars[lower]));
    return '';
  });
}

// ---------------- Số đếm ----------------

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

/** Đọc số 0–999 999 999 bằng chữ (kiểu miền Nam: ngàn, lẻ) */
export function numberToWords(n: number): string {
  if (n === 0) return 'không';
  const parts: string[] = [];
  const units = ['', 'ngàn', 'triệu'];
  const groups: number[] = [];
  let x = n;
  while (x > 0) {
    groups.push(x % 1000);
    x = Math.floor(x / 1000);
  }
  for (let g = groups.length - 1; g >= 0; g--) {
    const v = groups[g];
    if (v === 0) continue;
    const full = g < groups.length - 1;
    parts.push(readThree(v, full) + (units[g] ? ' ' + units[g] : ''));
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function readThree(n: number, full: boolean): string {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  const out: string[] = [];
  if (h > 0 || full) out.push(DIGITS[h] + ' trăm');
  if (t === 0) {
    if (u > 0 && (h > 0 || full)) out.push('lẻ ' + DIGITS[u]);
    else if (u > 0) out.push(DIGITS[u]);
  } else if (t === 1) {
    out.push('mười' + (u === 0 ? '' : u === 5 ? ' lăm' : ' ' + DIGITS[u]));
  } else {
    out.push(DIGITS[t] + ' mươi' + (u === 0 ? '' : u === 1 ? ' mốt' : u === 5 ? ' lăm' : u === 4 ? ' tư' : ' ' + DIGITS[u]));
  }
  return out.join(' ');
}

export function formatVND(n: number): string {
  return n.toLocaleString('vi-VN') + ' đ';
}

/** "7 giờ rưỡi sáng" từ giờ/phút */
export function timeToWords(h: number, m: number, withPeriod = true): string {
  const h12 = h % 12 === 0 ? 12 : h % 12;
  let s: string;
  if (m === 0) s = `${numberToWords(h12)} giờ`;
  else if (m === 30) s = `${numberToWords(h12)} giờ rưỡi`;
  else if (m >= 45) {
    const nh = (h + 1) % 24;
    const nh12 = nh % 12 === 0 ? 12 : nh % 12;
    s = `${numberToWords(nh12)} giờ kém ${numberToWords(60 - m)}`;
  } else s = `${numberToWords(h12)} giờ ${numberToWords(m)}`;
  if (!withPeriod) return s;
  const hh = m >= 45 ? (h + 1) % 24 : h;
  return `${s} ${periodOf(hh)}`;
}

export function periodOf(h: number): string {
  if (h >= 1 && h <= 10) return 'sáng';
  if (h >= 11 && h <= 12) return 'trưa';
  if (h >= 13 && h <= 18) return 'chiều';
  if (h >= 19 && h <= 22) return 'tối';
  return 'đêm';
}
