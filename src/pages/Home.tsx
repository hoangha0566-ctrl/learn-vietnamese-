import { useMemo, useState } from 'react';
import { useLessons, syllabus } from '../data';
import { Bi, ProgressBar, Stars, useSettings } from '../components/ui';
import { href } from '../lib/router';
import { progressStore, settingsStore, streakStore, useStore, wordsStore } from '../lib/store';
import { lessonPercent } from '../lib/sections';
import type { Lesson } from '../types';

export function Home() {
  const lessons = useLessons();
  const progress = useStore(progressStore);
  const streak = useStore(streakStore);
  const words = useStore(wordsStore);
  const { view, teacher } = useSettings();
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState('');
  const due = Object.values(words).filter((w) => w.box < 5 && w.due <= Date.now()).length;

  const filtered = useMemo(
    () =>
      lessons.filter((l) => {
        const hay = `${l.number} ${l.title} ${l.titleEn} ${l.topic} ${l.topicEn} ${(l.vocabulary ?? []).map((v) => v.word).join(' ')}`.toLowerCase();
        return (!q || hay.includes(q.toLowerCase())) && (!topic || l.topic === topic);
      }),
    [lessons, q, topic],
  );

  return (
    <div>
      <header className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-5xl">Học tiếng Việt – VSL 1</h1>
            <Bi vi="Giáo trình tiếng Việt cho người nước ngoài · Sơ cấp" en="Vietnamese for foreigners · Beginner" className="mt-1 text-lg text-white/90" enClass="!text-white/80" />
          </div>
          <div className="flex gap-3">
            {!teacher && (
              <div className="rounded-2xl bg-white/20 px-4 py-2 text-center backdrop-blur">
                <div className="text-3xl font-extrabold">🔥 {streak.count}</div>
                <div className="text-xs">ngày liên tiếp · streak</div>
              </div>
            )}
            <a href={href('notebook')} className="rounded-2xl bg-white/20 px-4 py-2 text-center backdrop-blur hover:bg-white/30">
              <div className="text-3xl font-extrabold">📒 {due}</div>
              <div className="text-xs">từ cần ôn · to review</div>
            </a>
          </div>
        </div>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <a href={href('pronunciation')} className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-5xl">🗣️</span>
          <Bi vi="Phần một: Phát âm" en="Part 1: Pronunciation (9 units)" className="text-xl font-bold" />
        </a>
        <a href={href('notebook')} className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-5xl">📒</span>
          <Bi vi="Sổ từ của tôi" en="My word notebook" className="text-xl font-bold" />
        </a>
        <a href={`${import.meta.env.BASE_URL}mac-gi/index.html`} className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-5xl">🧥</span>
          <Bi vi="Mặc gì hôm nay? (trung cấp)" en="Clothing verbs (intermediate)" className="text-xl font-bold" />
        </a>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-2xl font-extrabold">
          <Bi vi="Phần hai: Bài học" en="Part 2: Lessons" />
        </h2>
        <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-bold">
          <button onClick={() => settingsStore.set((s) => ({ ...s, view: 'book' }))} className={`rounded-lg px-3 py-1.5 ${view === 'book' ? 'bg-white shadow' : 'text-slate-500'}`}>
            📘 Theo sách
          </button>
          <button onClick={() => settingsStore.set((s) => ({ ...s, view: 'syllabus' }))} className={`rounded-lg px-3 py-1.5 ${view === 'syllabus' ? 'bg-white shadow' : 'text-slate-500'}`}>
            🗂️ Theo giáo trình của tôi
          </button>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm bài, từ…" className="w-48 rounded-xl border border-slate-200 bg-white px-3 py-2" />
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
          <option value="">Tất cả chủ đề</option>
          {[...new Set(lessons.map((l) => l.topic))].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {view === 'book' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <LessonCard key={l.id} lesson={l} pct={lessonPercent(l, progress)} />
          ))}
        </div>
      ) : (
        <SyllabusList lessons={lessons} q={q} />
      )}
    </div>
  );
}

function LessonCard({ lesson: l, pct }: { lesson: Lesson; pct: number }) {
  const progress = useStore(progressStore);
  const stars = Object.values(progress[l.id] ?? {}).reduce((s, x) => s + (x.stars ?? 0), 0);
  return (
    <a href={href(`lesson/${l.id}`)} className="group flex flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-3xl transition group-hover:scale-110">{l.icon ?? '📗'}</span>
        <div className="min-w-0">
          <div className="text-sm font-bold uppercase tracking-wide text-rose-500">
            {l.extra ? `Bài ${l.number} · tự soạn` : `Bài ${l.number}`}
          </div>
          <Bi vi={l.title} en={l.titleEn} className="text-xl font-extrabold leading-tight" />
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{l.topic}</span>
        {l.syllabusLessons?.length ? <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">GT: {l.syllabusLessons.join(', ')}</span> : null}
      </div>
      <div className="mt-auto flex items-center gap-2">
        <ProgressBar value={pct} />
        <span className="w-10 text-right text-sm font-bold text-slate-500">{pct}%</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm text-slate-400">
        <span>⭐ {stars}</span>
        {pct === 100 && l.badge && <span className="font-bold text-amber-500">🏅 {l.badge.vi}</span>}
        {pct > 0 && pct < 100 && <Stars n={pct >= 66 ? 2 : 1} className="text-xs" />}
      </div>
    </a>
  );
}

function SyllabusList({ lessons, q }: { lessons: Lesson[]; q: string }) {
  const progress = useStore(progressStore);
  const rows = syllabus.filter((s) => !q || `${s.id} ${s.title} ${s.topic} ${s.grammar} ${s.game}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-sm text-slate-500">
          <tr>
            <th className="px-4 py-3">Bài GT</th>
            <th className="px-4 py-3">Chủ đề / Tên bài</th>
            <th className="hidden px-4 py-3 md:table-cell">Ngữ pháp chính</th>
            <th className="hidden px-4 py-3 lg:table-cell">Game</th>
            <th className="px-4 py-3">Bài trong sách</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const l = lessons.find((x) => x.id === s.lesson);
            return (
              <tr key={String(s.id)} className="border-t border-slate-100 hover:bg-amber-50/50">
                <td className="px-4 py-3 text-xl font-extrabold text-rose-500">
                  {s.id}
                  {s.review && <span title="Xem xét lại / có thể bỏ" className="ml-1 text-xs">⚠️</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-slate-500">{s.topic}</div>
                  <div className="text-lg font-bold">{s.title}</div>
                </td>
                <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{s.grammar}</td>
                <td className="hidden px-4 py-3 lg:table-cell">🎮 {s.game}</td>
                <td className="px-4 py-3">
                  {l ? (
                    <a href={href(`lesson/${l.id}`)} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-1.5 font-bold text-rose-600 hover:bg-rose-100">
                      {l.icon} {l.extra ? `Bài ${l.number}` : `Sách bài ${l.bookLesson ?? l.number}`} · {lessonPercent(l, progress)}%
                    </a>
                  ) : (
                    <span className="text-slate-400">chưa có</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
