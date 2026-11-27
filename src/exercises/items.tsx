// Các dạng câu hỏi bài tập. Mỗi component hiển thị 1 câu và báo kết quả qua onResult.
import { useEffect, useMemo, useState } from 'react';
import type { Exercise, ExerciseItem } from '../types';
import { AnswerInput } from '../components/AnswerInput';
import { Bi, Btn, SpeakBtn, Pic, useSettings } from '../components/ui';
import { speak, recognitionSupported, listen } from '../lib/speech';
import { sfx } from '../lib/sound';
import { gradeText, normalizeAnswer, shuffle, TONES, TONE_ON_A, TONE_EN, getTone, stripTones, type Tone, type GradeStatus } from '../lib/vietnamese';
import { ClockFace } from '../components/ClockFace';

export interface ItemProps {
  item: ExerciseItem;
  ex: Exercise;
  index: number;
  reveal: boolean; // giáo viên bấm "Hiện đáp án"
  onResult: (status: GradeStatus, given?: string) => void;
}

/** Đáp án hiển thị khi giáo viên bấm "Hiện đáp án" */
export function answerText(ex: Exercise, item: ExerciseItem): string {
  switch (ex.type) {
    case 'multiple-choice':
    case 'listen-choose':
      return item.options?.[item.answer as number] ?? '';
    case 'true-false':
      return item.answer ? 'Đúng' : 'Sai';
    case 'substitution':
      return '';
    case 'tone-pick':
      return item.answers?.[0] ?? '';
    case 'vocab-match':
      return (item.pairs ?? []).map((p) => `${p.left} = ${p.right}`).join(' · ');
    default:
      return (item.answers ?? []).join(' / ');
  }
}

export function questionText(ex: Exercise, item: ExerciseItem): string {
  if (ex.type === 'reorder') return (item.words ?? []).join(' / ');
  if (ex.type === 'substitution') return item.frame ?? '';
  if (ex.type === 'vocab-match') return 'Nối từ';
  if (ex.type === 'tone-pick') return item.base ?? '';
  return item.q ?? '';
}

// ---------------- Bảng thay thế ----------------
export function SubstitutionItem({ item, onResult }: ItemProps) {
  const slots = item.slots ?? [];
  const [sel, setSel] = useState<number[]>(() => slots.map(() => 0));
  useEffect(() => setSel(slots.map(() => 0)), [item]); // eslint-disable-line react-hooks/exhaustive-deps
  const sentence = (item.frame ?? '').replace(/\{(\d+)\}/g, (_, k) => slots[+k]?.[sel[+k]] ?? '');
  const choose = (col: number, row: number) => {
    const next = [...sel];
    next[col] = row;
    setSel(next);
    const s = (item.frame ?? '').replace(/\{(\d+)\}/g, (_, k) => slots[+k]?.[next[+k]] ?? '');
    sfx.click();
    speak(fixCase(s));
    onResult('correct');
  };
  // khung câu với ô trống tô màu
  const parts = (item.frame ?? '').split(/(\{\d+\})/);
  return (
    <div>
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 p-5 text-center text-3xl font-bold leading-relaxed sm:text-4xl">
        {parts.map((p, i) => {
          const m = p.match(/\{(\d+)\}/);
          if (!m) return <span key={i}>{p}</span>;
          return (
            <span key={i} className="mx-1 rounded-lg bg-white px-2 text-rose-600 shadow-sm">
              {slots[+m[1]]?.[sel[+m[1]]]}
            </span>
          );
        })}
        <SpeakBtn text={fixCase(sentence)} className="ml-3 align-middle" slowToo />
        {item.en && <Bi vi="" en={item.en} className="mt-1 text-xl" />}
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {slots.map((col, c) => (
          <div key={c} className="flex min-w-32 flex-col gap-2 rounded-2xl bg-slate-50 p-3">
            <div className="text-center text-xs font-bold uppercase text-slate-400">Cột {c + 1}</div>
            {col.map((w, r) => (
              <button
                key={r}
                onClick={() => choose(c, r)}
                className={`rounded-xl px-4 py-2 text-xl font-semibold transition ${sel[c] === r ? 'bg-rose-500 text-white shadow' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-rose-50'}`}
              >
                {w}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-slate-500">
        <Bi vi="Bấm từng ô để ghép câu mới và nghe đọc to." en="Tap a word to build a new sentence and hear it." />
      </p>
    </div>
  );
}
function fixCase(s: string) {
  return s.replace(/^\s*\S/, (c) => c.toUpperCase());
}

// ---------------- Điền vào chỗ trống ----------------
export function FillBlankItem({ item, ex, index, reveal, onResult }: ItemProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [status, setStatus] = useState<GradeStatus | null>(null);
  const [mode, setMode] = useState<'bank' | 'type'>(ex.wordBank?.length ? 'bank' : 'type');
  useEffect(() => {
    setPicked(null);
    setStatus(null);
  }, [index]);
  const [before, after] = (item.q ?? '').split(/_{2,}/);
  const answers = item.answers ?? [];
  const pick = (w: string) => {
    if (status === 'correct') return;
    setPicked(w);
    const r = gradeText(w, answers);
    setStatus(r.status);
    if (r.status === 'correct') sfx.correct();
    else sfx.wrong();
    onResult(r.status, w);
  };
  const shown = reveal && status !== 'correct' ? answers[0] : picked;
  return (
    <div>
      <div className="mb-5 text-center text-3xl font-bold leading-relaxed sm:text-4xl">
        {before}
        <span
          className={`mx-1 inline-block min-w-24 border-b-4 px-2 ${status === 'correct' ? 'border-emerald-500 text-emerald-600' : status ? 'border-red-400 text-red-500' : reveal ? 'border-sky-400 text-sky-600' : 'border-slate-300 text-slate-400'}`}
        >
          {shown ?? ' '}
        </span>
        {after}
        {status === 'correct' && <SpeakBtn text={(item.q ?? '').replace(/_{2,}/, answers[0])} className="ml-2 align-middle" />}
      </div>
      {ex.wordBank?.length ? (
        <div className="mb-3 flex justify-center gap-2 text-sm">
          <button onClick={() => setMode('bank')} className={`rounded-full px-3 py-1 ${mode === 'bank' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>
            Ngân hàng từ
          </button>
          <button onClick={() => setMode('type')} className={`rounded-full px-3 py-1 ${mode === 'type' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>
            Tự gõ
          </button>
        </div>
      ) : null}
      {mode === 'bank' && ex.wordBank ? (
        <div className="flex flex-wrap justify-center gap-2">
          {ex.wordBank.map((w) => (
            <button
              key={w}
              onClick={() => pick(w)}
              className={`rounded-xl px-4 py-2 text-xl font-semibold ring-1 transition ${picked === w ? (status === 'correct' ? 'bg-emerald-500 text-white ring-emerald-500' : 'bg-red-100 ring-red-300') : 'bg-white ring-slate-200 hover:bg-sky-50'}`}
            >
              {w}
            </button>
          ))}
        </div>
      ) : (
        <AnswerInput answers={answers} resetKey={index} onResult={(r, g) => { setStatus(r.status); setPicked(g); onResult(r.status, g); }} placeholder="Từ còn thiếu…" />
      )}
    </div>
  );
}

// ---------------- Chọn đáp án ----------------
export function ChoiceItem({ item, index, reveal, onResult, listen: isListen }: ItemProps & { listen?: boolean }) {
  const [chosen, setChosen] = useState<number | null>(null);
  useEffect(() => {
    setChosen(null);
    if (isListen && item.q) setTimeout(() => speak(item.q!, { audio: item.audio }), 300);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const correct = item.answer as number;
  const done = chosen !== null && chosen === correct;
  const choose = (i: number) => {
    if (done) return;
    setChosen(i);
    if (i === correct) sfx.correct();
    else sfx.wrong();
    onResult(i === correct ? 'correct' : 'wrong', item.options?.[i]);
  };
  return (
    <div>
      {isListen ? (
        <div className="mb-5 flex flex-col items-center gap-2">
          <SpeakBtn text={item.q ?? ''} audio={item.audio} size="lg" slowToo />
          <Bi vi="Nghe và chọn câu đúng" en="Listen and choose" className="text-slate-500" />
          {(done || reveal) && <div className="text-xl font-semibold">{item.q}</div>}
        </div>
      ) : (
        <div className="mb-5 text-center text-2xl font-bold leading-relaxed sm:text-3xl">
          <Pic src={item.image} className="mb-2 block text-6xl" />
          {item.q}
          {item.q && /[a-zđ]/i.test(item.q) && !item.q.includes('___') && <SpeakBtn text={item.q} size="sm" className="ml-2 align-middle" />}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {(item.options ?? []).map((o, i) => {
          const isC = i === correct;
          const state =
            chosen === i ? (isC ? 'bg-emerald-500 text-white ring-emerald-500' : 'bg-red-100 text-red-700 ring-red-300 animate-[shake_0.4s]') : (done || reveal) && isC ? 'bg-emerald-50 ring-emerald-400 ring-2' : 'bg-white ring-slate-200 hover:bg-sky-50';
          return (
            <button key={i} onClick={() => choose(i)} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-xl font-semibold ring-1 transition ${state}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base text-slate-600">{'ABCDEFG'[i]}</span>
              {o}
            </button>
          );
        })}
      </div>
      {(chosen !== null || reveal) && item.explain && (
        <div className="mt-4 rounded-xl bg-sky-50 p-3 text-lg text-sky-900">💡 {item.explain}</div>
      )}
    </div>
  );
}

// ---------------- Đúng / Sai ----------------
export function TrueFalseItem({ item, index, reveal, onResult }: ItemProps) {
  const [chosen, setChosen] = useState<boolean | null>(null);
  useEffect(() => setChosen(null), [index]);
  const ans = !!item.answer;
  const choose = (v: boolean) => {
    if (chosen === ans) return;
    setChosen(v);
    if (v === ans) sfx.correct();
    else sfx.wrong();
    onResult(v === ans ? 'correct' : 'wrong', v ? 'Đúng' : 'Sai');
  };
  return (
    <div className="text-center">
      <div className="mb-6 text-3xl font-bold">
        {item.q} <SpeakBtn text={item.q ?? ''} size="sm" className="align-middle" />
      </div>
      <div className="flex justify-center gap-4">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            onClick={() => choose(v)}
            className={`w-40 rounded-2xl py-4 text-2xl font-bold ring-2 transition ${chosen === v ? (v === ans ? 'bg-emerald-500 text-white ring-emerald-500' : 'bg-red-100 text-red-600 ring-red-300') : reveal && v === ans ? 'ring-emerald-400' : 'bg-white ring-slate-200 hover:bg-slate-50'}`}
          >
            <Bi vi={v ? '✔ Đúng' : '✘ Sai'} en={v ? 'True' : 'False'} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------- Sắp xếp câu ----------------
export function ReorderItem({ item, index, reveal, onResult }: ItemProps) {
  const words = item.words ?? [];
  const initial = useMemo(() => shuffle(words.map((w, i) => ({ w, i }))), [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const [built, setBuilt] = useState<{ w: string; i: number }[]>([]);
  const [status, setStatus] = useState<GradeStatus | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  useEffect(() => {
    setBuilt([]);
    setStatus(null);
  }, [index]);
  const pool = initial.filter((x) => !built.some((b) => b.i === x.i));
  const check = () => {
    const sentence = built.map((b) => b.w).join(' ');
    const ok = (item.answers ?? []).some((a) => normalizeAnswer(a) === normalizeAnswer(sentence));
    setStatus(ok ? 'correct' : 'wrong');
    if (ok) {
      sfx.correct();
      speak(item.answers![0]);
    } else sfx.wrong();
    onResult(ok ? 'correct' : 'wrong', sentence);
  };
  const moveTo = (from: number, to: number) => {
    const n = [...built];
    const [x] = n.splice(from, 1);
    n.splice(to, 0, x);
    setBuilt(n);
    setStatus(null);
  };
  return (
    <div>
      <div
        className={`mb-4 flex min-h-20 flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 ${status === 'correct' ? 'border-emerald-400 bg-emerald-50' : status === 'wrong' ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50'}`}
        onDragOver={(e) => e.preventDefault()}
      >
        {built.length === 0 && <span className="text-slate-400">Bấm hoặc kéo từ vào đây…</span>}
        {built.map((b, k) => (
          <button
            key={b.i}
            draggable
            onDragStart={() => setDrag(k)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drag !== null && moveTo(drag, k)}
            onClick={() => {
              if (status === 'correct') return;
              setBuilt(built.filter((x) => x.i !== b.i));
              setStatus(null);
            }}
            className="cursor-grab rounded-xl bg-white px-4 py-2 text-2xl font-semibold shadow ring-1 ring-sky-300"
          >
            {b.w}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {pool.map((x) => (
          <button
            key={x.i}
            draggable
            onDragEnd={() => {}}
            onClick={() => {
              setBuilt([...built, x]);
              setStatus(null);
            }}
            className="rounded-xl bg-sky-100 px-4 py-2 text-2xl font-semibold text-sky-900 transition hover:bg-sky-200"
          >
            {x.w}
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        <Btn variant="secondary" onClick={() => { setBuilt([]); setStatus(null); }}>
          ↺ Làm lại
        </Btn>
        <Btn onClick={check} disabled={built.length !== words.length || status === 'correct'}>
          Kiểm tra
        </Btn>
      </div>
      {status === 'correct' && <div className="mt-3 text-center text-xl font-bold text-emerald-600">✅ {item.answers?.[0]}</div>}
      {status === 'wrong' && <div className="mt-3 text-center text-lg text-red-600"><Bi vi="Chưa đúng, thử đổi chỗ các từ." en="Not yet – try another order." /></div>}
      {reveal && status !== 'correct' && <div className="mt-3 text-center text-xl font-semibold text-sky-700">→ {item.answers?.[0]}</div>}
    </div>
  );
}

// ---------------- Gõ câu trả lời (viết lại, dịch, chính tả, viết số, đồng hồ) ----------------
export function TextItem({ item, ex, index, reveal, onResult }: ItemProps) {
  const t = ex.type;
  const isDict = t === 'dictation';
  useEffect(() => {
    if (isDict && item.q) setTimeout(() => speak(item.q!, { audio: item.audio }), 300);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const prompt =
    t === 'translate-en-vi'
      ? { vi: 'Dịch sang tiếng Việt', en: 'Translate into Vietnamese' }
      : t === 'translate-vi-en'
        ? { vi: 'Dịch sang tiếng Anh', en: 'Translate into English' }
        : t === 'dictation'
          ? { vi: 'Nghe và viết lại', en: 'Listen and write' }
          : t === 'number-write'
            ? { vi: 'Viết bằng số', en: 'Write in digits' }
            : t === 'clock'
              ? { vi: 'Bây giờ là mấy giờ?', en: 'What time is it?' }
              : { vi: item.instruction ?? ex.title, en: ex.titleEn };
  const [hh, mm] = (item.q ?? '0:0').split(':').map(Number);
  return (
    <div>
      <div className="mb-2 text-center text-slate-500">
        <Bi vi={prompt.vi} en={prompt.en} />
      </div>
      <div className="mb-5 flex flex-col items-center gap-3 text-center text-3xl font-bold">
        {isDict ? (
          <>
            <SpeakBtn text={item.q ?? ''} audio={item.audio} size="lg" slowToo />
            {reveal && <div className="text-2xl text-sky-700">{item.q}</div>}
          </>
        ) : t === 'clock' ? (
          <ClockFace h={hh} m={mm} size={200} />
        ) : (
          <div>
            {item.q}
            {t !== 'translate-en-vi' && <SpeakBtn text={item.q ?? ''} size="sm" className="ml-2 align-middle" />}
          </div>
        )}
      </div>
      <AnswerInput
        answers={item.answers ?? []}
        free={ex.freeAnswer}
        resetKey={index}
        lang={t === 'translate-vi-en' ? 'en' : 'vi'}
        placeholder={t === 'number-write' ? 'Ví dụ: 25' : 'Gõ câu trả lời…'}
        onResult={(r, g) => onResult(r.status, g)}
      />
      {reveal && <div className="mt-3 text-center text-xl font-semibold text-sky-700">→ {(item.answers ?? []).join(' / ')}</div>}
    </div>
  );
}

// ---------------- Chọn dấu thanh ----------------
export function TonePickItem({ item, index, reveal, onResult }: ItemProps) {
  const word = item.answers?.[0] ?? '';
  const sylls = word.split(/\s+/);
  const target = sylls.map((s) => getTone(s));
  const [picked, setPicked] = useState<(Tone | null)[]>(() => sylls.map(() => null));
  const [status, setStatus] = useState<GradeStatus | null>(null);
  useEffect(() => {
    setPicked(sylls.map(() => null));
    setStatus(null);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (k: number, t: Tone) => {
    if (status === 'correct') return;
    const n = [...picked];
    n[k] = t;
    setPicked(n);
    if (n.every((x) => x)) {
      const ok = n.every((x, i) => x === target[i]);
      setStatus(ok ? 'correct' : 'wrong');
      if (ok) {
        sfx.correct();
        speak(word);
      } else sfx.wrong();
      onResult(ok ? 'correct' : 'wrong', n.join(' '));
    }
  };
  return (
    <div className="text-center">
      <div className="mb-2 flex items-center justify-center gap-3">
        <SpeakBtn text={word} size="lg" slowToo />
      </div>
      <div className="mb-5 text-5xl font-extrabold tracking-wide">
        {status === 'correct' || reveal ? word : stripTones(word)}
      </div>
      <div className="flex flex-col gap-4">
        {sylls.map((s, k) => (
          <div key={k}>
            {sylls.length > 1 && <div className="mb-1 text-lg font-semibold text-slate-500">{stripTones(s)}</div>}
            <div className="flex flex-wrap justify-center gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => choose(k, t)}
                  className={`w-24 rounded-xl py-2 ring-1 transition ${picked[k] === t ? (status === 'wrong' && t !== target[k] ? 'bg-red-100 ring-red-300' : 'bg-sky-500 text-white ring-sky-500') : 'bg-white ring-slate-200 hover:bg-sky-50'}`}
                >
                  <div className="text-2xl font-bold">{TONE_ON_A[t]}</div>
                  <div className="text-xs">{t}</div>
                  <En className="text-[10px]">{TONE_EN[t]}</En>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {status === 'wrong' && (
        <Btn variant="secondary" className="mt-4" onClick={() => { setPicked(sylls.map(() => null)); setStatus(null); }}>
          ↺ Thử lại
        </Btn>
      )}
    </div>
  );
}
function En({ children, className }: { children: React.ReactNode; className?: string }) {
  const { showEn } = useSettings();
  return showEn ? <div className={`text-slate-400 ${className}`}>{children}</div> : null;
}

// ---------------- Luyện nói ----------------
export function SpeakingItem({ item, index, onResult }: ItemProps) {
  const sentence = item.q ?? '';
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [status, setStatus] = useState<GradeStatus | null>(null);
  const supported = recognitionSupported();
  useEffect(() => {
    setHeard(null);
    setStatus(null);
  }, [index]);
  const rec = () => {
    setListening(true);
    setHeard(null);
    listen(
      (texts) => {
        let best = gradeText(texts[0], [sentence]);
        let bestText = texts[0];
        for (const t of texts) {
          const g = gradeText(t, [sentence]);
          if (g.status === 'correct' || (g.status === 'almost' && best.status === 'wrong')) {
            best = g;
            bestText = t;
          }
        }
        setHeard(bestText);
        setStatus(best.status);
        if (best.status === 'correct') sfx.correct();
        else if (best.status === 'almost') sfx.almost();
        else sfx.wrong();
        onResult(best.status === 'almost' ? 'correct' : best.status, bestText);
      },
      () => setListening(false),
    );
  };
  return (
    <div className="text-center">
      <div className="mb-2 text-slate-500">
        <Bi vi="Nghe rồi đọc to câu này" en="Listen, then read this sentence aloud" />
      </div>
      <div className="mb-4 text-3xl font-bold">
        {sentence} <SpeakBtn text={sentence} audio={item.audio} slowToo className="align-middle" />
      </div>
      {item.en && <Bi vi="" en={item.en} className="mb-4 text-2xl" />}
      {supported ? (
        <Btn onClick={rec} disabled={listening} className="px-6 py-3 text-xl" variant={listening ? 'warn' : 'primary'}>
          {listening ? '🎙️ Đang nghe…' : '🎤 Bấm và nói'}
        </Btn>
      ) : (
        <div className="flex justify-center gap-3">
          <Btn variant="success" onClick={() => { setStatus('correct'); onResult('correct'); }}>
            <Bi vi="👍 Tôi đọc tốt" en="I said it well" />
          </Btn>
          <Btn variant="secondary" onClick={() => { setStatus('wrong'); onResult('wrong'); }}>
            <Bi vi="🔁 Cần luyện thêm" en="Need more practice" />
          </Btn>
        </div>
      )}
      {heard !== null && (
        <div className={`mt-4 text-xl ${status === 'correct' ? 'text-emerald-600' : status === 'almost' ? 'text-amber-600' : 'text-red-600'}`}>
          <Bi vi={<>Máy nghe được: “{heard}”</>} en="Recognised" />
          {status === 'correct' && ' ✅'}
          {status === 'almost' && <Bi vi="Gần đúng! Chú ý thanh điệu." en="Almost! Mind the tones." />}
        </div>
      )}
    </div>
  );
}

// ---------------- Nối từ ----------------
export function MatchItem({ item, index, reveal, onResult }: ItemProps) {
  const pairs = item.pairs ?? [];
  const left = useMemo(() => shuffle(pairs.map((p, i) => ({ ...p, i }))), [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const right = useMemo(() => shuffle(pairs.map((p, i) => ({ ...p, i }))), [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selL, setSelL] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  useEffect(() => {
    setMatched([]);
    setSelL(null);
    setMistakes(0);
  }, [index]);
  const tryMatch = (l: number, r: number) => {
    if (l === r) {
      const m = [...matched, l];
      setMatched(m);
      sfx.correct();
      speak(pairs[l].left);
      if (m.length === pairs.length) onResult(mistakes === 0 ? 'correct' : mistakes <= 2 ? 'almost' : 'wrong');
    } else {
      sfx.wrong();
      setMistakes((x) => x + 1);
      setWrongFlash(r);
      setTimeout(() => setWrongFlash(null), 500);
    }
    setSelL(null);
  };
  return (
    <div>
      <p className="mb-3 text-center text-slate-500">
        <Bi vi="Bấm (hoặc kéo) một từ bên trái rồi bấm nghĩa đúng bên phải" en="Tap (or drag) a word on the left, then its meaning on the right" />
      </p>
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="flex flex-col gap-2">
          {left.map((p) => (
            <button
              key={p.i}
              draggable={!matched.includes(p.i)}
              onDragStart={() => setDragging(p.i)}
              disabled={matched.includes(p.i)}
              onClick={() => setSelL(p.i)}
              className={`rounded-xl px-3 py-3 text-xl font-semibold ring-1 transition ${matched.includes(p.i) ? 'bg-emerald-100 text-emerald-700 ring-emerald-300' : selL === p.i ? 'bg-sky-500 text-white ring-sky-500' : 'bg-white ring-slate-200 hover:bg-sky-50'}`}
            >
              {p.left}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {right.map((p) => (
            <button
              key={p.i}
              disabled={matched.includes(p.i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragging !== null && tryMatch(dragging, p.i)}
              onClick={() => selL !== null && tryMatch(selL, p.i)}
              className={`rounded-xl px-3 py-3 text-lg ring-1 transition ${matched.includes(p.i) ? 'bg-emerald-100 text-emerald-700 ring-emerald-300' : wrongFlash === p.i ? 'animate-[shake_0.4s] bg-red-100 ring-red-300' : reveal ? 'bg-white ring-slate-200' : 'bg-white ring-slate-200 hover:bg-amber-50'}`}
            >
              {p.right}
              {reveal && !matched.includes(p.i) && <span className="block text-sm text-sky-600">= {p.left}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ItemView(props: ItemProps) {
  switch (props.ex.type) {
    case 'substitution':
      return <SubstitutionItem {...props} />;
    case 'fill-blank':
      return <FillBlankItem {...props} />;
    case 'multiple-choice':
      return <ChoiceItem {...props} />;
    case 'listen-choose':
      return <ChoiceItem {...props} listen />;
    case 'true-false':
      return <TrueFalseItem {...props} />;
    case 'reorder':
      return <ReorderItem {...props} />;
    case 'tone-pick':
      return <TonePickItem {...props} />;
    case 'speaking':
      return <SpeakingItem {...props} />;
    case 'vocab-match':
      return <MatchItem {...props} />;
    default:
      return <TextItem {...props} />;
  }
}
