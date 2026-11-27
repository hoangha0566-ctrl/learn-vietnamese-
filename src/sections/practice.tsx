// Thực hành nói (bảng thay thế), thực hành nghe, bài tập, game, tổng kết.
import { useMemo, useState } from 'react';
import type { Exercise, Lesson } from '../types';
import { Bi, Btn, Card, SectionTitle, Stars, Mascot, ProgressBar } from '../components/ui';
import { ExerciseRunner } from '../exercises/ExerciseRunner';
import { allExercises, dictation, listenChoose, speaking, substitutionDrills } from '../lib/autoExercises';
import { progressStore, useStore, wordsStore } from '../lib/store';
import { GameHost } from '../games/GameHost';
import { lessonPercent, progressUnits } from '../lib/sections';
import { navigate } from '../lib/router';

export const EX_ICON: Record<string, string> = {
  substitution: '🔁',
  'fill-blank': '✍️',
  'multiple-choice': '🔘',
  reorder: '🧱',
  rewrite: '🔄',
  'translate-en-vi': '🇬🇧→🇻🇳',
  'translate-vi-en': '🇻🇳→🇬🇧',
  dictation: '🎧',
  'number-write': '🔢',
  clock: '🕰️',
  'listen-choose': '👂',
  'true-false': '✔✘',
  'tone-pick': '🎵',
  speaking: '🎤',
  'vocab-match': '🔗',
};

function ExerciseHub({ list, lesson, prefix, title }: { list: Exercise[]; lesson: Lesson; prefix: string; title: { icon: string; vi: string; en: string } }) {
  const progress = useStore(progressStore)[lesson.id] ?? {};
  const [open, setOpen] = useState<number | null>(list.length === 1 ? 0 : null);
  if (open !== null && list[open]) {
    const ex = list[open];
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {list.length > 1 && (
            <Btn variant="secondary" onClick={() => setOpen(null)}>
              ← <Bi vi="Danh sách" en="List" inline />
            </Btn>
          )}
          <h2 className="text-2xl font-extrabold">
            <Bi vi={<>{EX_ICON[ex.type] ?? '✏️'} {ex.title}</>} en={ex.titleEn} />
          </h2>
        </div>
        <Card>
          <ExerciseRunner
            ex={ex}
            lessonId={lesson.id}
            sectionKey={`${prefix}-${open}`}
          />
        </Card>
        {open < list.length - 1 && (
          <div className="mt-4 text-right">
            <Btn variant="secondary" onClick={() => setOpen(open + 1)}>
              <Bi vi={`Bài tiếp: ${list[open + 1].title}`} en="Next exercise" inline /> →
            </Btn>
          </div>
        )}
      </div>
    );
  }
  return (
    <div>
      <SectionTitle icon={title.icon} vi={title.vi} en={title.en} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((ex, i) => {
          const p = progress[`${prefix}-${i}`];
          return (
            <button key={i} onClick={() => setOpen(i)} className="flex items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-2xl">{EX_ICON[ex.type] ?? '✏️'}</span>
              <span className="min-w-0 flex-1">
                <Bi vi={ex.title} en={ex.titleEn} className="text-lg font-bold" />
                <span className="text-sm text-slate-400">
                  {ex.items.length} câu{ex.auto ? ' · tự sinh' : ''}
                  {p?.total ? ` · ${p.score}/${p.total}` : ''}
                </span>
              </span>
              {p?.done && <Stars n={p.stars} className="text-sm" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OralSection({ lesson }: { lesson: Lesson }) {
  const drills = substitutionDrills(lesson);
  const sp = useMemo(() => speaking(lesson), [lesson]);
  // Mỗi khung câu là một bài nhỏ để giáo viên chọn nhanh
  const list: Exercise[] = drills.flatMap((d) => d.items.map((it, k) => ({ ...d, title: `${d.title} ${k + 1}: ${(it.frame ?? "").replace(/\{\d+\}/g, "…")}`, items: [it] })));
  return (
    <div>
      <ExerciseHub list={list} lesson={lesson} prefix="oral" title={{ icon: '🗣️', vi: 'Thực hành nói – Bảng thay thế', en: 'Oral practice – substitution drills' }} />
      {sp && (
        <div className="mt-8">
          <ExerciseHub list={[sp]} lesson={lesson} prefix="speak" title={{ icon: '🎤', vi: 'Luyện nói', en: 'Speaking' }} />
        </div>
      )}
    </div>
  );
}

export function ListeningSection({ lesson }: { lesson: Lesson }) {
  const list = useMemo(() => [listenChoose(lesson), dictation(lesson)].filter(Boolean) as Exercise[], [lesson]);
  // đơn vị tiến độ 'listening' = hoàn thành bài nghe đầu tiên
  return <ExerciseHub list={list} lesson={lesson} prefix="listening" title={{ icon: '👂', vi: 'Thực hành nghe', en: 'Listening practice' }} />;
}

export function ExercisesSection({ lesson }: { lesson: Lesson }) {
  const list = allExercises(lesson);
  return <ExerciseHub list={list} lesson={lesson} prefix="ex" title={{ icon: '✏️', vi: 'Bài tập', en: 'Exercises' }} />;
}

export function GameSection({ lesson }: { lesson: Lesson }) {
  const games = lesson.games ?? [];
  const [open, setOpen] = useState<number | null>(games.length === 1 ? 0 : null);
  const progress = useStore(progressStore)[lesson.id] ?? {};
  if (open !== null && games[open]) {
    return (
      <div>
        {games.length > 1 && (
          <Btn variant="secondary" className="mb-4" onClick={() => setOpen(null)}>
            ← <Bi vi="Chọn game khác" en="Other games" inline />
          </Btn>
        )}
        <GameHost game={games[open]} lesson={lesson} />
      </div>
    );
  }
  return (
    <div>
      <SectionTitle icon="🎮" vi="Game tương tác" en="Interactive games" />
      <div className="grid gap-4 sm:grid-cols-2">
        {games.map((g, i) => {
          const p = progress[`game-${g.type}`];
          return (
            <button key={i} onClick={() => setOpen(i)} className="rounded-3xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 p-6 text-left text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-2 text-4xl">🎮</div>
              <Bi vi={g.title} en={g.titleEn} className="text-2xl font-extrabold" enClass="!text-white/80" />
              {g.intro && <p className="mt-2 text-white/90">{g.intro}</p>}
              {p?.done && <Stars n={p.stars} className="mt-2 block" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SummarySection({ lesson }: { lesson: Lesson }) {
  const progress = useStore(progressStore);
  const words = useStore(wordsStore);
  const lp = progress[lesson.id] ?? {};
  const pct = lessonPercent(lesson, progress);
  const units = progressUnits(lesson);
  const exList = allExercises(lesson);
  const label = (u: string) => {
    if (u.startsWith('ex-')) return exList[+u.slice(3)]?.title ?? u;
    if (u.startsWith('game-')) return lesson.games?.find((g) => `game-${g.type}` === u)?.title ?? u;
    if (u.startsWith('oral-')) return `Bảng thay thế ${+u.slice(5) + 1}`;
    return { objectives: 'Mục tiêu', vocab: 'Từ vựng', flashcard: 'Flashcard', grammar: 'Ngữ pháp', dialogue: 'Hội thoại', listening: 'Nghe', reading: 'Bài đọc' }[u] ?? u;
  };
  const wrong = Object.entries(lp).flatMap(([k, v]) => (v.wrong ?? []).map((w) => ({ ...w, k })));
  const review = (lesson.vocabulary ?? []).filter((v) => words[v.word] && words[v.word].box < 5);
  const done = pct === 100;
  return (
    <div>
      <SectionTitle icon="🏆" vi="Tổng kết" en="Summary" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col items-center gap-3 text-center">
          <Mascot mood={done ? 'wow' : pct > 50 ? 'happy' : 'idle'} size={80} />
          <div className="text-4xl font-extrabold">{pct}%</div>
          <ProgressBar value={pct} />
          {lesson.badge && (
            <div className={`mt-2 rounded-2xl px-5 py-3 text-xl font-bold ${done ? 'bg-amber-300 text-amber-950' : 'bg-slate-100 text-slate-400'}`}>
              🏅 <Bi vi={lesson.badge.vi} en={lesson.badge.en} inline />
              {!done && <div className="text-sm font-normal">Hoàn thành 100% để nhận huy hiệu</div>}
            </div>
          )}
        </Card>
        <Card>
          <Bi vi="Điểm từng phần" en="Scores by part" className="mb-2 text-xl font-bold" />
          <ul className="divide-y divide-slate-100">
            {units.map((u) => (
              <li key={u} className="flex items-center justify-between gap-2 py-1.5">
                <span className={lp[u]?.done ? '' : 'text-slate-400'}>{label(u)}</span>
                <span className="flex items-center gap-2 text-sm">
                  {lp[u]?.total ? `${lp[u].score}/${lp[u].total}` : ''}
                  <Stars n={lp[u]?.stars ?? 0} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <Bi vi="Câu sai cần làm lại" en="Mistakes to redo" className="mb-2 text-xl font-bold" />
          {wrong.length ? (
            <ul className="space-y-1 text-lg">
              {wrong.slice(0, 30).map((w, i) => (
                <li key={i}>
                  • {w.q} → <b className="text-emerald-700">{w.answer}</b>
                  {w.given ? <span className="text-sm text-red-400"> (bạn: {w.given})</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">Không có câu sai. 🎉</p>
          )}
        </Card>
        <Card>
          <Bi vi="Từ chưa thuộc" en="Words to review" className="mb-2 text-xl font-bold" />
          <div className="mb-3 flex flex-wrap gap-2">
            {review.length ? review.map((v) => <span key={v.word} className="rounded-full bg-amber-100 px-3 py-1">{v.word}</span>) : <span className="text-slate-500">—</span>}
          </div>
          <Btn onClick={() => navigate(`notebook/review/${lesson.id}`)}>🔁 Ôn lại từ chưa thuộc</Btn>
        </Card>
      </div>
    </div>
  );
}
