import { useEffect, useRef, useState } from 'react';
import type { Exercise } from '../types';
import { ItemView, answerText, questionText } from './items';
import { Bi, Btn, Confetti, Mascot, ProgressBar, Stars, useSettings } from '../components/ui';
import { recordSection, starsFor, type WrongItem } from '../lib/store';
import { useKeys } from '../lib/keys';
import { sfx } from '../lib/sound';
import type { GradeStatus } from '../lib/vietnamese';

/** Chạy một bài tập: từng câu, điểm, đáp án (chế độ giáo viên), màn kết thúc. */
export function ExerciseRunner({
  ex,
  lessonId,
  sectionKey,
  onDone,
  onlyItems,
}: {
  ex: Exercise;
  lessonId: string;
  sectionKey: string;
  onDone?: () => void;
  onlyItems?: number[];
}) {
  const { teacher } = useSettings();
  const indices = onlyItems ?? ex.items.map((_, i) => i);
  const [pos, setPos] = useState(0);
  const [results, setResults] = useState<Record<number, { status: GradeStatus; given?: string }>>({});
  const [reveal, setReveal] = useState(false);
  const [finished, setFinished] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const practice = ex.type === 'substitution' || ex.freeAnswer;
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPos(0);
    setResults({});
    setFinished(false);
    setReveal(false);
  }, [ex]);
  useEffect(() => setReveal(false), [pos]);

  const idx = indices[pos];
  const item = ex.items[idx];
  const total = indices.length;
  const score = Object.values(results).reduce((s, r) => s + (r.status === 'correct' ? 1 : r.status === 'almost' ? 0.5 : 0), 0);

  const onResult = (status: GradeStatus, given?: string) => {
    setResults((r) => (r[idx] ? r : { ...r, [idx]: { status, given } }));
  };

  const finish = () => {
    const wrong: WrongItem[] = Object.entries(results)
      .filter(([, r]) => r.status !== 'correct')
      .map(([i, r]) => ({ q: questionText(ex, ex.items[+i]), answer: answerText(ex, ex.items[+i]), given: r.given }));
    const sc = practice ? total : score;
    recordSection(lessonId, sectionKey, { done: true, score: sc, total, stars: starsFor(sc, total), wrong });
    setFinished(true);
    sfx.win();
    setConfetti((c) => c + 1);
    onDone?.();
  };

  const next = () => {
    if (pos < total - 1) setPos(pos + 1);
    else if (!finished) finish();
    topRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  const prev = () => pos > 0 && setPos(pos - 1);

  useKeys({ next, prev, space: () => teacher && setReveal((r) => !r) }, !finished);

  if (!item && !finished) return null;

  if (finished) {
    const st = starsFor(practice ? total : score, total);
    const wrongList = Object.entries(results).filter(([, r]) => r.status !== 'correct');
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Confetti fire={confetti} />
        <Mascot mood="wow" say={<Bi vi="Hoàn thành!" en="Finished!" />} />
        {!practice && (
          <div className="text-3xl font-extrabold">
            {score} / {total}
          </div>
        )}
        <Stars n={st} className="text-4xl" />
        {wrongList.length > 0 && !practice && (
          <div className="w-full max-w-xl rounded-2xl bg-amber-50 p-4 text-left">
            <Bi vi="Câu cần xem lại:" en="Review these:" className="mb-2 font-bold" />
            <ul className="space-y-1">
              {wrongList.map(([i]) => (
                <li key={i}>
                  • {questionText(ex, ex.items[+i])} → <b>{answerText(ex, ex.items[+i])}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Btn
            variant="secondary"
            onClick={() => {
              setResults({});
              setPos(0);
              setFinished(false);
            }}
          >
            ↺ <Bi vi="Làm lại" en="Again" inline />
          </Btn>
        </div>
      </div>
    );
  }

  const res = results[idx];
  return (
    <div ref={topRef}>
      <div className="mb-4 flex items-center gap-3">
        <span className="whitespace-nowrap text-sm font-bold text-slate-500">
          {pos + 1} / {total}
        </span>
        <ProgressBar value={((pos + (res ? 1 : 0)) / total) * 100} />
        {!practice && <span className="whitespace-nowrap text-sm font-bold text-emerald-600">✓ {score}</span>}
      </div>
      <div className={teacher ? 'teacher-big' : ''}>
        <ItemView key={`${ex.title}-${idx}`} item={item} ex={ex} index={idx} reveal={reveal} onResult={onResult} />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <Btn variant="ghost" onClick={prev} disabled={pos === 0}>
          ← <Bi vi="Câu trước" en="Previous" inline />
        </Btn>
        {teacher && ex.type !== 'substitution' && (
          <Btn variant="warn" onClick={() => setReveal((r) => !r)}>
            👁 <Bi vi={reveal ? 'Ẩn đáp án' : 'Hiện đáp án'} en={reveal ? 'Hide answer' : 'Show answer'} inline />
          </Btn>
        )}
        <Btn onClick={next} variant={res?.status === 'correct' || practice ? 'success' : 'primary'}>
          <Bi vi={pos === total - 1 ? 'Hoàn thành' : 'Câu tiếp theo'} en={pos === total - 1 ? 'Finish' : 'Next'} inline /> →
        </Btn>
      </div>
    </div>
  );
}
