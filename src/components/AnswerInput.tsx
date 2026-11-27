import { useEffect, useRef, useState } from 'react';
import { displayWords, gradeText, type GradeResult } from '../lib/vietnamese';
import { sfx } from '../lib/sound';
import { Bi, Btn, VietKeyboard, useSettings } from './ui';

/** Ô gõ câu trả lời + bàn phím dấu + chấm điểm theo quy tắc tiếng Việt */
export function AnswerInput({
  answers,
  onResult,
  placeholder = 'Gõ câu trả lời…',
  free = false,
  disabled = false,
  lang = 'vi',
  autoFocus = true,
  big = false,
  resetKey,
  allowRetry = true,
}: {
  answers: string[];
  onResult?: (r: GradeResult, given: string) => void;
  placeholder?: string;
  free?: boolean;
  disabled?: boolean;
  lang?: 'vi' | 'en';
  autoFocus?: boolean;
  big?: boolean;
  resetKey?: unknown;
  allowRetry?: boolean;
}) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);
  const [kb, setKb] = useState(false);
  const [tries, setTries] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const { vnKeyboard } = useSettings();

  useEffect(() => {
    setValue('');
    setResult(null);
    setTries(0);
    if (autoFocus) setTimeout(() => ref.current?.focus({ preventScroll: true }), 50);
  }, [resetKey, autoFocus]);

  const locked = disabled || (result?.status === 'correct') || (!allowRetry && !!result);

  const submit = () => {
    if (locked || !value.trim()) return;
    if (free) {
      const r: GradeResult = { status: 'correct', best: answers[0] ?? '', toneErrors: [] };
      setResult(r);
      onResult?.(r, value);
      return;
    }
    const r = gradeText(value, answers);
    setResult(r);
    setTries((t) => t + 1);
    if (r.status === 'correct') sfx.correct();
    else if (r.status === 'almost') sfx.almost();
    else sfx.wrong();
    onResult?.(r, value);
  };

  const words = result?.status === 'almost' ? displayWords(value) : [];

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          ref={ref}
          lang={lang}
          value={value}
          disabled={locked}
          onChange={(e) => {
            setValue(e.target.value);
            if (result && result.status !== 'correct') setResult(null);
          }}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={`min-w-0 flex-1 rounded-xl border-2 bg-white px-4 py-3 outline-none transition focus:border-sky-400 ${big ? 'text-2xl' : 'text-xl'} ${
            result?.status === 'correct'
              ? 'border-emerald-400 bg-emerald-50'
              : result?.status === 'almost'
                ? 'border-amber-400 bg-amber-50'
                : result?.status === 'wrong'
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-200'
          }`}
        />
        <Btn type="submit" disabled={locked || !value.trim()}>
          Kiểm tra ↵
        </Btn>
        {lang === 'vi' && vnKeyboard && (
          <Btn variant="secondary" onClick={() => setKb((k) => !k)} title="Bàn phím dấu / Accent keyboard">
            ⌨️ ă
          </Btn>
        )}
      </form>
      {kb && lang === 'vi' && !locked && <VietKeyboard inputRef={ref} onChange={setValue} />}
      {result && (
        <div className="mt-3 text-lg" role="status">
          {free ? (
            <div className="rounded-xl bg-sky-50 p-3 text-sky-900">
              <Bi vi="Bài viết tự do – so sánh với câu mẫu:" en="Free answer – compare with the model:" />
              <div className="mt-1 font-semibold">{answers.join(' / ')}</div>
            </div>
          ) : result.status === 'correct' ? (
            <div className="font-bold text-emerald-600">
              <Bi vi="✅ Đúng rồi! Giỏi quá!" en="Correct! Well done!" />
            </div>
          ) : result.status === 'almost' ? (
            <div className="rounded-xl bg-amber-50 p-3 text-amber-900">
              <Bi vi="🟡 Gần đúng! Kiểm tra lại dấu." en="Almost! Check the tone marks." className="font-bold" />
              <div className="mt-1">
                {words.map((w, i) => (
                  <span key={i} className={result.toneErrors.includes(i) ? 'mx-0.5 rounded bg-amber-300 px-1 font-bold' : 'mx-0.5'}>
                    {w}
                  </span>
                ))}
              </div>
              {tries >= 2 && <div className="mt-1 text-base">→ {result.best}</div>}
            </div>
          ) : (
            <div className="rounded-xl bg-red-50 p-3 text-red-800">
              <Bi vi="❌ Chưa đúng. Thử lại nhé!" en="Not quite. Try again!" className="font-bold" />
              {tries >= 2 && (
                <div className="mt-1">
                  <Bi vi={<>Đáp án: <b>{answers.join(' / ')}</b></>} en="Answer" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
