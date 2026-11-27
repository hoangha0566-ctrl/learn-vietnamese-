import { useEffect, useRef, useState, type ReactNode } from 'react';
import { settingsStore, useStore } from '../lib/store';
import { speak } from '../lib/speech';

export function useSettings() {
  return useStore(settingsStore);
}

/** Chữ song ngữ: tiếng Việt to, tiếng Anh nhỏ ở dưới (ẩn khi tắt tiếng Anh) */
export function Bi({
  vi,
  en,
  className = '',
  enClass = '',
  inline = false,
}: {
  vi: ReactNode;
  en?: ReactNode;
  className?: string;
  enClass?: string;
  inline?: boolean;
}) {
  const { showEn } = useSettings();
  if (inline)
    return (
      <span className={className}>
        {vi}
        {showEn && en ? <span className={`ml-2 text-[0.7em] font-normal text-slate-500 ${enClass}`}>{en}</span> : null}
      </span>
    );
  return (
    <span className={`block ${className}`}>
      <span className="block">{vi}</span>
      {showEn && en ? <span className={`block text-[0.62em] font-normal leading-snug text-slate-500 ${enClass}`}>{en}</span> : null}
    </span>
  );
}

export function En({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { showEn } = useSettings();
  if (!showEn || !children) return null;
  return <span className={`text-slate-500 ${className}`}>{children}</span>;
}

export function SpeakBtn({
  text,
  audio,
  size = 'md',
  className = '',
  title = 'Nghe / Listen',
  slowToo = false,
}: {
  text: string;
  audio?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
  slowToo?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const sz = size === 'sm' ? 'h-8 w-8 text-base' : size === 'lg' ? 'h-14 w-14 text-2xl' : 'h-10 w-10 text-lg';
  const play = async (slow?: boolean) => {
    setPlaying(true);
    await speak(text, { audio, slow });
    setPlaying(false);
  };
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 ${className}`}>
      <button
        type="button"
        title={title}
        aria-label={title}
        onClick={(e) => {
          e.stopPropagation();
          play();
        }}
        className={`${sz} inline-flex items-center justify-center rounded-full bg-sky-100 text-sky-700 transition hover:bg-sky-200 active:scale-95 ${playing ? 'animate-pulse ring-2 ring-sky-400' : ''}`}
      >
        🔊
      </button>
      {slowToo && (
        <button
          type="button"
          title="Đọc chậm / Slow"
          onClick={(e) => {
            e.stopPropagation();
            play(true);
          }}
          className={`${size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'} inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 active:scale-95`}
        >
          🐢
        </button>
      )}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'warn';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  title?: string;
}) {
  const v = {
    primary: 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm',
    secondary: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    warn: 'bg-amber-400 text-amber-950 hover:bg-amber-500',
  }[variant];
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-6 ${className}`}>{children}</div>;
}

export function Stars({ n, max = 3, className = '' }: { n: number; max?: number; className?: string }) {
  return (
    <span className={`whitespace-nowrap ${className}`} aria-label={`${n}/${max} sao`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? '' : 'opacity-20 grayscale'}>
          ⭐
        </span>
      ))}
    </span>
  );
}

export function ProgressBar({ value, className = '', color = 'bg-emerald-500' }: { value: number; className?: string; color?: string }) {
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/** Ảnh minh hoạ: emoji hoặc đường dẫn ảnh */
export function Pic({ src, className = '', alt = '' }: { src?: string; className?: string; alt?: string }) {
  if (!src) return null;
  if (/\.(png|jpe?g|gif|svg|webp)$/i.test(src) || src.startsWith('http') || src.startsWith('/'))
    return <img src={src.startsWith('/') ? import.meta.env.BASE_URL + src.slice(1) : src} alt={alt} className={`object-contain ${className}`} />;
  return <span className={className}>{src}</span>;
}

/** Nhân vật hoạt hình đơn giản có biểu cảm */
export type Mood = 'idle' | 'happy' | 'sad' | 'think' | 'cold' | 'hot' | 'wow';
export function Mascot({ mood = 'idle', size = 96, say, emoji }: { mood?: Mood; size?: number; say?: ReactNode; emoji?: string }) {
  const face = emoji ?? { idle: '🙂', happy: '😄', sad: '😕', think: '🤔', cold: '🥶', hot: '🥵', wow: '🤩' }[mood];
  const anim =
    mood === 'happy' || mood === 'wow'
      ? 'animate-[jump_0.6s_ease-in-out_2]'
      : mood === 'sad'
        ? 'animate-[shake_0.5s_ease-in-out_1]'
        : mood === 'cold'
          ? 'animate-[shiver_0.15s_linear_infinite]'
          : '';
  return (
    <div className="flex flex-col items-center gap-2">
      {say ? (
        <div className="relative max-w-xs rounded-2xl bg-white px-4 py-2 text-center text-lg font-semibold shadow ring-1 ring-slate-200">
          {say}
          <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white ring-1 ring-slate-200 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
        </div>
      ) : null}
      <span key={mood + (emoji ?? '')} className={`inline-block select-none leading-none ${anim}`} style={{ fontSize: size }}>
        {face}
      </span>
    </div>
  );
}

/** Pháo giấy khi trả lời đúng / hoàn thành */
export function Confetti({ fire }: { fire: number }) {
  const [pieces, setPieces] = useState<{ id: number; left: number; color: string; delay: number; rot: number }[]>([]);
  useEffect(() => {
    if (!fire) return;
    const colors = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#facc15'];
    setPieces(
      Array.from({ length: 70 }, (_, i) => ({
        id: fire * 1000 + i,
        left: Math.random() * 100,
        color: colors[i % colors.length],
        delay: Math.random() * 0.4,
        rot: Math.random() * 360,
      })),
    );
    const t = setTimeout(() => setPieces([]), 2600);
    return () => clearTimeout(t);
  }, [fire]);
  if (!pieces.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-20px] block h-3 w-2 animate-[fall_2.2s_ease-in_forwards] rounded-sm"
          style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, transform: `rotate(${p.rot}deg)` }}
        />
      ))}
    </div>
  );
}

/** Bàn phím ảo chèn chữ có dấu */
const VN_KEYS = ['á', 'à', 'ả', 'ã', 'ạ', 'ă', 'â', 'đ', 'ê', 'ô', 'ơ', 'ư'];
const TONE_KEYS: { mark: string; label: string }[] = [
  { mark: '́', label: '´ sắc' },
  { mark: '̀', label: '` huyền' },
  { mark: '̉', label: '̉ hỏi' },
  { mark: '̃', label: '~ ngã' },
  { mark: '̣', label: '. nặng' },
];
export function VietKeyboard({ inputRef, onChange }: { inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>; onChange: (v: string) => void }) {
  const insert = (text: string) => {
    const el = inputRef.current;
    if (!el) return;
    const s = el.selectionStart ?? el.value.length;
    const e = el.selectionEnd ?? el.value.length;
    const v = el.value.slice(0, s) + text + el.value.slice(e);
    onChange(v);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + text.length, s + text.length);
    });
  };
  /** Thêm dấu thanh vào nguyên âm ngay trước con trỏ */
  const addTone = (mark: string) => {
    const el = inputRef.current;
    if (!el) return;
    const s = el.selectionStart ?? el.value.length;
    const before = el.value.slice(0, s);
    const m = before.match(/([aăâeêioôơuưyAĂÂEÊIOÔƠUƯY][̀-ͯ]*)([^aăâeêioôơuưyAĂÂEÊIOÔƠUƯY\s]*)$/);
    if (!m) return;
    const vowel = m[1].normalize('NFD').replace(/[̣̀́̃̉]/g, '') + mark;
    const newBefore = before.slice(0, before.length - m[0].length) + vowel.normalize('NFC') + m[2];
    const v = newBefore + el.value.slice(s);
    onChange(v);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newBefore.length, newBefore.length);
    });
  };
  return (
    <div className="mt-2 flex flex-wrap gap-1" onMouseDown={(e) => e.preventDefault()}>
      {VN_KEYS.map((k) => (
        <button key={k} type="button" onClick={() => insert(k)} className="h-9 min-w-9 rounded-lg bg-slate-100 px-2 text-lg font-semibold text-slate-700 hover:bg-rose-100">
          {k}
        </button>
      ))}
      <span className="mx-1 w-px bg-slate-200" />
      {TONE_KEYS.map((k) => (
        <button
          key={k.label}
          type="button"
          title="Thêm dấu vào nguyên âm trước con trỏ"
          onClick={() => addTone(k.mark)}
          className="h-9 rounded-lg bg-amber-50 px-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}

export function useTimeoutFlag(ms = 1200): [boolean, () => void] {
  const [on, setOn] = useState(false);
  const t = useRef<number | undefined>(undefined);
  const trigger = () => {
    setOn(true);
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setOn(false), ms);
  };
  return [on, trigger];
}

export function Empty({ vi, en }: { vi: string; en?: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500">
      <Bi vi={vi} en={en} />
    </div>
  );
}

export function SectionTitle({ icon, vi, en, right }: { icon?: string; vi: string; en?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">
        <Bi vi={<>{icon ? <span className="mr-2">{icon}</span> : null}{vi}</>} en={en} />
      </h2>
      {right}
    </div>
  );
}
