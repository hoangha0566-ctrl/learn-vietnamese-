// Các phần của trang bài học: mục tiêu, từ vựng, flashcard, ngữ pháp, hội thoại, bài đọc.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Lesson, VocabItem } from '../types';
import { Bi, Btn, Card, Empty, Pic, SectionTitle, SpeakBtn, useSettings, Confetti } from '../components/ui';
import { markWord, recordSection, setWordKnown, useStore, wordsStore } from '../lib/store';
import { speak, stopSpeaking } from '../lib/speech';
import { shuffle } from '../lib/vietnamese';
import { useKeys } from '../lib/keys';
import { ExerciseRunner } from '../exercises/ExerciseRunner';
import { readingQuestions, readingTrueFalse } from '../lib/autoExercises';
import { sfx } from '../lib/sound';
import { recognitionSupported, listen } from '../lib/speech';
import { gradeText } from '../lib/vietnamese';

function useMarkViewed(lessonId: string, key: string) {
  useEffect(() => {
    const t = setTimeout(() => recordSection(lessonId, key, { done: true, stars: 1 }), 1500);
    return () => clearTimeout(t);
  }, [lessonId, key]);
}

// ---------------- Mục tiêu ----------------
export function ObjectivesSection({ lesson }: { lesson: Lesson }) {
  useMarkViewed(lesson.id, 'objectives');
  return (
    <div>
      <SectionTitle icon="🎯" vi="Mục tiêu bài học" en="Lesson objectives" />
      <div className="grid gap-3">
        {(lesson.objectives ?? []).map((o, i) => (
          <Card key={i} className="flex items-center gap-4 text-2xl font-semibold">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xl font-extrabold text-rose-600">{i + 1}</span>
            <Bi vi={o.vi} en={o.en} />
          </Card>
        ))}
      </div>
      {lesson.syllabusLessons?.length ? (
        <p className="mt-6 text-slate-500">
          <Bi
            vi={`Ứng với giáo trình: Bài ${lesson.syllabusLessons.join(', ')}${lesson.bookPages ? ` · Sách VSL 1 trang ${lesson.bookPages}` : ''}`}
            en={`Syllabus lessons ${lesson.syllabusLessons.join(', ')}${lesson.bookPages ? ` · Book pages ${lesson.bookPages}` : ''}`}
          />
        </p>
      ) : null}
    </div>
  );
}

// ---------------- Từ vựng ----------------
const TYPE_VI: Record<string, string> = {
  noun: 'danh từ',
  verb: 'động từ',
  adjective: 'tính từ',
  adverb: 'phó từ',
  pronoun: 'đại từ',
  phrase: 'cụm từ',
  particle: 'trợ từ',
  'question word': 'từ để hỏi',
  number: 'số từ',
  conjunction: 'liên từ',
  preposition: 'giới từ',
  classifier: 'loại từ',
  modal: 'trợ động từ',
};
export function VocabSection({ lesson }: { lesson: Lesson }) {
  useMarkViewed(lesson.id, 'vocab');
  const words = useStore(wordsStore);
  const [q, setQ] = useState('');
  const list = (lesson.vocabulary ?? []).filter((v) => !q || (v.word + v.meaning).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <SectionTitle
        icon="📚"
        vi="Từ vựng"
        en="Vocabulary"
        right={
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm từ…" className="rounded-xl border border-slate-200 px-3 py-2" />
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((v) => {
          const st = words[v.word];
          const known = (st?.box ?? 0) >= 5;
          return (
            <Card key={v.word} className="flex flex-col gap-2 !p-4">
              <div className="flex items-start gap-3">
                {v.image ? <Pic src={v.image} className="h-12 w-12 text-4xl" /> : null}
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-extrabold text-slate-800">{v.word}</div>
                  <div className="text-lg text-slate-600">{v.meaning}</div>
                  {v.type && <div className="text-xs uppercase tracking-wide text-slate-400">{TYPE_VI[v.type] ?? v.type}</div>}
                </div>
                <SpeakBtn text={v.word.replace(/\//g, ',')} audio={v.audio} slowToo />
              </div>
              {v.example && (
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <span className="font-semibold">{v.example}</span> <SpeakBtn text={v.example} size="sm" className="align-middle" />
                  <Bi vi="" en={v.exampleEn} className="text-lg" />
                </div>
              )}
              <div className="mt-auto flex gap-2 text-sm">
                <button
                  onClick={() => setWordKnown(v.word, lesson.id, true)}
                  className={`rounded-full px-3 py-1 ${known ? 'bg-emerald-500 text-white' : 'bg-slate-100 hover:bg-emerald-100'}`}
                >
                  ✓ Đã thuộc
                </button>
                <button
                  onClick={() => setWordKnown(v.word, lesson.id, false)}
                  className={`rounded-full px-3 py-1 ${st && !known ? 'bg-amber-400 text-amber-950' : 'bg-slate-100 hover:bg-amber-100'}`}
                >
                  ↻ Cần ôn
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Flashcard ----------------
export function FlashcardSection({ lesson, cards: given, sectionKey = 'flashcard' }: { lesson: Lesson; cards?: VocabItem[]; sectionKey?: string }) {
  const { teacher } = useSettings();
  const base = given ?? lesson.vocabulary ?? [];
  const [order, setOrder] = useState<VocabItem[]>(base);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [dir, setDir] = useState<'vi' | 'en'>('vi');
  const [stats, setStats] = useState({ known: 0, again: 0 });
  const [confetti, setConfetti] = useState(0);
  useEffect(() => {
    setOrder(base);
    setI(0);
  }, [lesson.id, given]); // eslint-disable-line react-hooks/exhaustive-deps
  const card = order[i];
  const go = (d: number) => {
    setFlip(false);
    const n = i + d;
    if (n >= order.length) {
      recordSection(lesson.id, sectionKey, { done: true, stars: 3 });
      setConfetti((c) => c + 1);
      sfx.win();
      setI(0);
    } else if (n >= 0) setI(n);
  };
  const mark = (known: boolean) => {
    if (!card) return;
    markWord(card.word, lesson.id, known);
    setStats((s) => (known ? { ...s, known: s.known + 1 } : { ...s, again: s.again + 1 }));
    known ? sfx.correct() : sfx.click();
    go(1);
  };
  useKeys({ next: () => go(1), prev: () => go(-1), space: () => setFlip((f) => !f) });
  useEffect(() => {
    if (card && dir === 'vi' && !flip) speak(card.word.replace(/\//g, ','), { audio: card.audio });
  }, [i, dir]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!card) return <Empty vi="Chưa có từ vựng." en="No vocabulary yet." />;
  const front = dir === 'vi' ? card.word : card.meaning;
  const back = dir === 'vi' ? card.meaning : card.word;
  return (
    <div>
      <Confetti fire={confetti} />
      <SectionTitle
        icon="🃏"
        vi="Flashcard"
        en="Flashcards"
        right={
          <div className="flex flex-wrap gap-2">
            <Btn variant="secondary" onClick={() => setDir(dir === 'vi' ? 'en' : 'vi')}>
              {dir === 'vi' ? 'Việt → Anh' : 'Anh → Việt'} ⇄
            </Btn>
            <Btn variant="secondary" onClick={() => { setOrder(shuffle(order)); setI(0); setFlip(false); }}>
              🔀 Xáo trộn
            </Btn>
          </div>
        }
      />
      <div className="mx-auto max-w-xl">
        <div className="mb-2 flex justify-between text-sm text-slate-500">
          <span>
            {i + 1} / {order.length}
          </span>
          <span>
            ✓ {stats.known} · ↻ {stats.again}
          </span>
        </div>
        <button onClick={() => setFlip(!flip)} className="group block h-72 w-full [perspective:1000px] sm:h-80" aria-label="Lật thẻ">
          <div className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flip ? '[transform:rotateY(180deg)]' : ''}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-to-br from-rose-400 to-orange-300 p-6 text-white shadow-lg [backface-visibility:hidden]">
              {card.image && dir === 'en' ? <Pic src={card.image} className="h-20 text-6xl" /> : null}
              <div className={`${teacher ? 'text-6xl' : 'text-5xl'} text-center font-extrabold`}>{front}</div>
              <div className="text-sm opacity-80">Bấm để lật · Space</div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white p-6 shadow-lg ring-2 ring-rose-200 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              {card.image ? <Pic src={card.image} className="h-20 text-6xl" /> : null}
              <div className="text-center text-4xl font-extrabold text-slate-800">{back}</div>
              {card.example && (
                <div className="text-center text-lg text-slate-600">
                  {card.example}
                  {card.exampleEn && <div className="text-sm text-slate-400">{card.exampleEn}</div>}
                </div>
              )}
            </div>
          </div>
        </button>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Btn variant="ghost" onClick={() => go(-1)} disabled={i === 0}>
            ←
          </Btn>
          <SpeakBtn text={card.word.replace(/\//g, ',')} audio={card.audio} size="lg" slowToo />
          <Btn variant="ghost" onClick={() => go(1)}>
            →
          </Btn>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Btn variant="warn" onClick={() => mark(false)} className="py-3 text-lg">
            <Bi vi="↻ Chưa thuộc" en="Still learning" />
          </Btn>
          <Btn variant="success" onClick={() => mark(true)} className="py-3 text-lg">
            <Bi vi="✓ Đã thuộc" en="I know it" />
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ---------------- Ngữ pháp ----------------
export function GrammarSection({ lesson }: { lesson: Lesson }) {
  useMarkViewed(lesson.id, 'grammar');
  return (
    <div>
      <SectionTitle icon="🧩" vi="Ngữ pháp – Ghi chú" en="Grammar notes" />
      <div className="grid gap-4">
        {(lesson.grammar ?? []).map((g, i) => (
          <Card key={i}>
            <div className="mb-3 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-2xl font-extrabold text-white sm:text-3xl">{g.pattern}</div>
            <Bi vi={g.explainVi} en={g.explainEn} className="mb-3 text-xl" />
            <div className="grid gap-2">
              {g.examples.map((e, k) => (
                <div key={k} className="flex items-start gap-3 rounded-xl bg-indigo-50 px-4 py-2">
                  <SpeakBtn text={e.vi.replace(/^–\s*/, '')} size="sm" />
                  <Bi vi={<span className="font-semibold">{e.vi}</span>} en={e.en} className="text-xl" />
                </div>
              ))}
            </div>
            {g.note && <div className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-lg text-amber-900">📝 {g.note}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------- Hội thoại ----------------
export function DialogueSection({ lesson }: { lesson: Lesson }) {
  const { showEn } = useSettings();
  const [d, setD] = useState(0);
  const [trans, setTrans] = useState(showEn);
  const [active, setActive] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [rpStep, setRpStep] = useState<number | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const stopRef = useRef(false);
  const dialogues = lesson.dialogues ?? [];
  const dlg = dialogues[d];
  const speakers = dlg ? [...new Set(dlg.lines.map((l) => l.speaker))] : [];
  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => {
    setRole(null);
    setRpStep(null);
    setActive(null);
  }, [d]);

  const playAll = async () => {
    stopRef.current = false;
    for (let k = 0; k < dlg.lines.length; k++) {
      if (stopRef.current) break;
      setActive(k);
      await speak(dlg.lines[k].vi, { audio: dlg.lines[k].audio });
      await new Promise((r) => setTimeout(r, 300));
    }
    setActive(null);
    recordSection(lesson.id, 'dialogue', { done: true, stars: 2 });
  };

  // Đóng vai: app đọc vai kia, người học đọc vai của mình
  const runRole = async (from: number) => {
    let k = from;
    while (k < dlg.lines.length && dlg.lines[k].speaker !== role) {
      setRpStep(k);
      setActive(k);
      await speak(dlg.lines[k].vi, { audio: dlg.lines[k].audio });
      await new Promise((r) => setTimeout(r, 250));
      k++;
    }
    if (k >= dlg.lines.length) {
      setRpStep(null);
      setActive(null);
      sfx.win();
      recordSection(lesson.id, 'dialogue', { done: true, stars: 3 });
      return;
    }
    setRpStep(k);
    setActive(k);
    setHeard(null);
  };

  return (
    <div>
      <SectionTitle
        icon="💬"
        vi="Hội thoại"
        en="Dialogues"
        right={
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={trans} onChange={(e) => setTrans(e.target.checked)} className="h-5 w-5" />
            <Bi vi="Hiện bản dịch" en="Show translation" inline />
          </label>
        }
      />
      {lesson.bookDialogues?.length ? (
        <div className="mb-4 rounded-2xl bg-amber-50 p-4 text-amber-900">
          <Bi vi="📘 Hội thoại gốc trong sách (mở sách để dạy):" en="Original dialogues in the book:" className="font-bold" />
          <ul className="mt-1 list-inside list-disc">
            {lesson.bookDialogues.map((b, i) => (
              <li key={i}>
                Trang {b.page}: {b.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {dialogues.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {dialogues.map((x, i) => (
            <button key={i} onClick={() => setD(i)} className={`rounded-full px-4 py-2 font-semibold ${i === d ? 'bg-rose-500 text-white' : 'bg-white ring-1 ring-slate-200'}`}>
              {i + 1}. {x.title}
            </button>
          ))}
        </div>
      )}
      {dlg && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Bi vi={dlg.title} en={dlg.titleEn} className="text-2xl font-bold" />
            <div className="flex flex-wrap gap-2">
              <Btn onClick={playAll}>▶ Nghe cả bài</Btn>
              <Btn variant="secondary" onClick={() => { stopRef.current = true; stopSpeaking(); setActive(null); }}>
                ⏹
              </Btn>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3">
            <Bi vi="🎭 Đóng vai:" en="Role play:" inline className="font-semibold" />
            {speakers.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setRole(s);
                  setTimeout(() => runRoleRef.current(0), 50);
                }}
                className={`rounded-full px-3 py-1 font-semibold ${role === s ? 'bg-indigo-600 text-white' : 'bg-white ring-1 ring-slate-200'}`}
              >
                {s}
              </button>
            ))}
            {role && (
              <button onClick={() => { setRole(null); setRpStep(null); }} className="text-sm text-slate-500 underline">
                Thoát
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {dlg.lines.map((l, k) => {
              const left = speakers.indexOf(l.speaker) % 2 === 0;
              const mine = role === l.speaker;
              const hidden = role && mine && rpStep !== null && k >= rpStep && k !== rpStep;
              return (
                <div key={k} className={`flex ${left ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm transition sm:max-w-[75%] ${active === k ? 'ring-4 ring-amber-300' : ''} ${left ? 'rounded-tl-sm bg-sky-50' : 'rounded-tr-sm bg-rose-50'}`}
                  >
                    <div className="mb-1 text-sm font-bold text-slate-500">{l.speaker}</div>
                    <div className="flex items-start gap-2">
                      <SpeakBtn text={l.vi} audio={l.audio} size="sm" />
                      <div className="text-2xl font-semibold">{hidden ? <span className="text-slate-300">• • •</span> : l.vi}</div>
                    </div>
                    {trans && !hidden && <div className="mt-1 text-lg text-slate-500">{l.en}</div>}
                    {role && rpStep === k && mine && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-indigo-600">👉 Đến lượt bạn! / Your turn!</span>
                        {recognitionSupported() && (
                          <Btn
                            variant="secondary"
                            className="!py-1"
                            onClick={() =>
                              listen(
                                (t) => {
                                  setHeard(t[0]);
                                  const g = gradeText(t[0], [l.vi]);
                                  g.status === 'wrong' ? sfx.almost() : sfx.correct();
                                },
                                () => {},
                              )
                            }
                          >
                            🎤
                          </Btn>
                        )}
                        <Btn className="!py-1" onClick={() => runRoleRef.current(k + 1)}>
                          Tiếp →
                        </Btn>
                        {heard && <span className="text-sm text-slate-500">“{heard}”</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      <RunRoleBinder fn={runRole} />
    </div>
  );
}
// giữ tham chiếu mới nhất của runRole (vì role thay đổi bất đồng bộ)
const runRoleRef: { current: (k: number) => void } = { current: () => {} };
function RunRoleBinder({ fn }: { fn: (k: number) => void }) {
  runRoleRef.current = fn;
  return null;
}

// ---------------- Bài đọc ----------------
export function ReadingSection({ lesson }: { lesson: Lesson }) {
  const r = lesson.reading!;
  const [trans, setTrans] = useState(false);
  const [part, setPart] = useState<'text' | 'tf' | 'q'>('text');
  const tf = useMemo(() => readingTrueFalse(lesson), [lesson]);
  const qs = useMemo(() => readingQuestions(lesson), [lesson]);
  const sentences = r.text.match(/[^.!?]+[.!?]+[”"]?|[^.!?]+$/g) ?? [r.text];
  useEffect(() => {
    if (!tf) recordSection(lesson.id, 'reading', { done: true, stars: 1 });
  }, [lesson.id, tf]);
  return (
    <div>
      <SectionTitle icon="📖" vi="Bài đọc" en="Reading" />
      <div className="mb-4 flex flex-wrap gap-2">
        <Btn variant={part === 'text' ? 'primary' : 'secondary'} onClick={() => setPart('text')}>
          📖 Đọc
        </Btn>
        {tf && (
          <Btn variant={part === 'tf' ? 'primary' : 'secondary'} onClick={() => setPart('tf')}>
            ✔✘ Đúng / Sai
          </Btn>
        )}
        {qs && (
          <Btn variant={part === 'q' ? 'primary' : 'secondary'} onClick={() => setPart('q')}>
            ❓ Câu hỏi
          </Btn>
        )}
      </div>
      {part === 'text' && (
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-2xl font-extrabold">{r.title}</h3>
            <div className="flex gap-2">
              <SpeakBtn text={r.text} slowToo />
              {r.translation && (
                <Btn variant="secondary" onClick={() => setTrans(!trans)}>
                  {trans ? 'Ẩn bản dịch' : 'Bản dịch EN'}
                </Btn>
              )}
            </div>
          </div>
          <p className="text-2xl leading-loose">
            {sentences.map((s, i) => (
              <span key={i} onClick={() => speak(s.trim())} className="cursor-pointer rounded px-0.5 hover:bg-amber-100" title="Bấm để nghe câu này">
                {s}
              </span>
            ))}
          </p>
          {trans && <p className="mt-4 rounded-xl bg-slate-50 p-4 text-lg text-slate-600">{r.translation}</p>}
          <p className="mt-3 text-sm text-slate-400">💡 Bấm vào một câu để nghe câu đó. / Tap a sentence to hear it.</p>
        </Card>
      )}
      {part === 'tf' && tf && (
        <Card>
          <ExerciseRunner ex={tf} lessonId={lesson.id} sectionKey="reading" />
        </Card>
      )}
      {part === 'q' && qs && (
        <Card>
          <div className="mb-4 rounded-xl bg-slate-50 p-3 text-lg">{r.text}</div>
          <ExerciseRunner ex={qs} lessonId={lesson.id} sectionKey="reading-q" />
        </Card>
      )}
    </div>
  );
}
