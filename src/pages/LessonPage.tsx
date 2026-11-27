import { useEffect, useRef, useState } from 'react';
import { useLesson, useLessons } from '../data';
import { Bi, Btn, ProgressBar, useSettings } from '../components/ui';
import { href, navigate } from '../lib/router';
import { availableSections, lessonPercent, progressUnits } from '../lib/sections';
import { progressStore, useStore } from '../lib/store';
import { stopSpeaking } from '../lib/speech';
import { DialogueSection, FlashcardSection, GrammarSection, ObjectivesSection, ReadingSection, VocabSection } from '../sections/basic';
import { ExercisesSection, GameSection, ListeningSection, OralSection, SummarySection } from '../sections/practice';

export function LessonPage({ id, section }: { id: string; section?: string }) {
  const lesson = useLesson(id);
  const lessons = useLessons();
  const progress = useStore(progressStore);
  const { teacher } = useSettings();
  const [present, setPresent] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => stopSpeaking(), [id, section]);
  useEffect(() => {
    const on = () => setPresent(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  if (!lesson)
    return (
      <div className="py-20 text-center">
        <Bi vi="Không tìm thấy bài học." en="Lesson not found." />
        <a href={href('')} className="mt-4 inline-block text-rose-600 underline">
          ← Trang chủ
        </a>
      </div>
    );

  const secs = availableSections(lesson);
  const cur = secs.find((s) => s.key === section) ?? secs[0];
  const idx = secs.indexOf(cur);
  const lp = progress[lesson.id] ?? {};
  const units = progressUnits(lesson);
  const secDone = (key: string) => {
    const mine = units.filter((u) => u === key || u.startsWith(key === 'exercises' ? 'ex-' : key === 'game' ? 'game-' : key === 'oral' ? 'oral-' : key + '-'));
    return mine.length > 0 && mine.every((u) => lp[u]?.done);
  };
  const pct = lessonPercent(lesson, progress);
  const li = lessons.findIndex((l) => l.id === lesson.id);
  const go = (key: string) => navigate(`lesson/${lesson.id}/${key}`);

  const togglePresent = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else mainRef.current?.requestFullscreen?.();
  };

  const body = (() => {
    switch (cur.key) {
      case 'objectives':
        return <ObjectivesSection lesson={lesson} />;
      case 'vocab':
        return <VocabSection lesson={lesson} />;
      case 'flashcard':
        return <FlashcardSection lesson={lesson} />;
      case 'grammar':
        return <GrammarSection lesson={lesson} />;
      case 'dialogue':
        return <DialogueSection lesson={lesson} />;
      case 'oral':
        return <OralSection lesson={lesson} />;
      case 'listening':
        return <ListeningSection lesson={lesson} />;
      case 'reading':
        return <ReadingSection lesson={lesson} />;
      case 'exercises':
        return <ExercisesSection lesson={lesson} />;
      case 'game':
        return <GameSection lesson={lesson} />;
      default:
        return <SummarySection lesson={lesson} />;
    }
  })();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <a href={href('')} className="rounded-xl bg-white px-3 py-2 font-semibold shadow-sm ring-1 ring-slate-100 hover:bg-slate-50">
          ← <span className="hidden sm:inline"><Bi vi="Bài học" en="Lessons" inline /></span>
        </a>
        <div className="order-last w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
          <div className="text-sm font-bold uppercase tracking-wide text-rose-500">
            {lesson.icon} Bài {lesson.number} · {lesson.topic}
            {lesson.bookPages ? <span className="ml-2 font-normal normal-case text-slate-400">sách tr. {lesson.bookPages}</span> : null}
          </div>
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
            <Bi vi={lesson.title} en={lesson.titleEn} />
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-28">
            <ProgressBar value={pct} />
            <div className="text-right text-xs font-bold text-slate-500">{pct}%</div>
          </div>
          <Btn variant="secondary" onClick={togglePresent} title="Trình chiếu toàn màn hình">
            📽️
          </Btn>
          <a href={href(`print/${lesson.id}`)} className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50" title="In / Xuất PDF">
            🖨️
          </a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
        <nav className="no-print -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:sticky lg:top-20 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0">
          {secs.map((s, i) => (
            <a
              key={s.key}
              href={href(`lesson/${lesson.id}/${s.key}`)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 font-semibold transition ${s.key === cur.key ? 'bg-rose-500 text-white shadow' : 'bg-white text-slate-700 ring-1 ring-slate-100 hover:bg-rose-50'}`}
            >
              <span className="text-lg">{s.icon}</span>
              <span className="hidden text-xs opacity-60 lg:inline">{i + 1}.</span>
              <span className="whitespace-nowrap">{s.vi}</span>
              {s.key !== 'summary' && secDone(s.key) && <span className="ml-auto text-xs">✅</span>}
            </a>
          ))}
        </nav>
        <main ref={mainRef} className={`min-w-0 ${present ? 'present-mode overflow-auto bg-amber-50 p-8' : ''} ${teacher ? 'teacher-mode' : ''}`}>
          {present && (
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xl font-bold text-rose-500">
                {lesson.icon} Bài {lesson.number}: {lesson.title}
              </div>
              <div className="flex gap-2">
                <Btn variant="secondary" disabled={idx === 0} onClick={() => go(secs[idx - 1].key)}>
                  ← {secs[idx - 1]?.vi}
                </Btn>
                <Btn variant="secondary" disabled={idx === secs.length - 1} onClick={() => go(secs[idx + 1].key)}>
                  {secs[idx + 1]?.vi} →
                </Btn>
                <Btn variant="ghost" onClick={togglePresent}>
                  ✕
                </Btn>
              </div>
            </div>
          )}
          <div key={`${lesson.id}-${cur.key}`} className="animate-[fadein_0.25s_ease-out]">
            {body}
          </div>
          {!present && (
            <div className="mt-8 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
              {idx > 0 ? (
                <Btn variant="secondary" onClick={() => go(secs[idx - 1].key)}>
                  ← {secs[idx - 1].icon} {secs[idx - 1].vi}
                </Btn>
              ) : li > 0 ? (
                <Btn variant="ghost" onClick={() => navigate(`lesson/${lessons[li - 1].id}`)}>
                  ← Bài {lessons[li - 1].number}
                </Btn>
              ) : (
                <span />
              )}
              {idx < secs.length - 1 ? (
                <Btn onClick={() => go(secs[idx + 1].key)}>
                  {secs[idx + 1].icon} {secs[idx + 1].vi} →
                </Btn>
              ) : li < lessons.length - 1 ? (
                <Btn onClick={() => navigate(`lesson/${lessons[li + 1].id}`)}>Bài {lessons[li + 1].number} →</Btn>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
