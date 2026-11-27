import { useMemo, useState } from 'react';
import { pronunciation } from '../data';
import { Bi, Btn, Card, SpeakBtn, SectionTitle } from '../components/ui';
import { href } from '../lib/router';
import { ExerciseRunner } from '../exercises/ExerciseRunner';
import { ToneCatch, ToneChart } from '../games/ToneGames';
import type { Exercise } from '../types';
import { TONES, TONE_ON_A, setTone, shuffle, type Tone } from '../lib/vietnamese';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { progressStore, recordSection, useStore } from '../lib/store';

type Unit = (typeof pronunciation.units)[number] & { tonePick?: string[] };

export function PronunciationHome() {
  const progress = useStore(progressStore);
  return (
    <div>
      <a href={href('')} className="mb-4 inline-block rounded-xl bg-white px-3 py-2 font-semibold shadow-sm ring-1 ring-slate-100">
        ← Trang chủ
      </a>
      <SectionTitle icon="🗣️" vi="Phần một: Phát âm" en="Part 1: Pronunciation" />
      <p className="mb-4 text-slate-500">
        <Bi vi="Mỗi đơn vị: Âm và chữ → Nghe và lặp lại → Nhận diện → Ghép chữ → Chính tả." en="Each unit: sounds & letters → listen & repeat → recognise → build syllables → dictation." />
      </p>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(pronunciation.units as Unit[]).map((u) => {
          const done = Object.values(progress[u.id] ?? {}).filter((x) => x.done).length;
          return (
            <a key={u.id} href={href(`pronunciation/${u.id}`)} className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-2xl font-extrabold text-sky-600">{u.number}</span>
              <span className="min-w-0 flex-1">
                <Bi vi={u.title} en={u.titleEn} className="text-lg font-bold" />
                {done > 0 && <span className="text-sm text-emerald-600">✓ {done} phần</span>}
              </span>
            </a>
          );
        })}
      </div>
      <div className="grid gap-4">
        <ToneChart />
        <ToneCatch words={pronunciation.toneGame.words} />
      </div>
    </div>
  );
}

export function PronunciationUnit({ id }: { id: string }) {
  const units = pronunciation.units as Unit[];
  const u = units.find((x) => x.id === id);
  const [tab, setTab] = useState('sounds');
  const exercises = useMemo(() => (u ? buildExercises(u) : {}), [u]);
  if (!u) return <div>Không tìm thấy.</div>;
  const ui = units.indexOf(u);
  const tabs: [string, string][] = [
    ['sounds', '🔤 Âm và chữ'],
    ...(exercises.pairs ? [['pairs', '👂 Nhận diện'] as [string, string]] : []),
    ...(exercises.tones ? [['tones', '🎵 Chọn dấu'] as [string, string]] : []),
    ...(u.build?.length ? [['build', '🧱 Ghép chữ'] as [string, string]] : []),
    ...(exercises.dictation ? [['dictation', '✍️ Chính tả'] as [string, string]] : []),
    ['games', '🎮 Game thanh điệu'],
  ];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <a href={href('pronunciation')} className="rounded-xl bg-white px-3 py-2 font-semibold shadow-sm ring-1 ring-slate-100">
          ← Phát âm
        </a>
        <h1 className="flex-1 text-2xl font-extrabold sm:text-3xl">
          <Bi vi={`Đơn vị ${u.number}: ${u.title}`} en={u.titleEn} />
        </h1>
        {ui > 0 && <a href={href(`pronunciation/${units[ui - 1].id}`)} className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">←</a>}
        {ui < units.length - 1 && <a href={href(`pronunciation/${units[ui + 1].id}`)} className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">→</a>}
      </div>
      <Bi vi={u.intro.vi} en={u.intro.en} className="mb-4 text-lg text-slate-600" />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([k, label]) => (
          <Btn key={k} variant={tab === k ? 'primary' : 'secondary'} onClick={() => setTab(k)}>
            {label}
          </Btn>
        ))}
      </div>
      {tab === 'sounds' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {u.sounds.map((s) => (
            <Card key={s.letter} className="!p-4">
              <div className="mb-2 text-4xl font-extrabold text-rose-500">{s.letter}</div>
              <div className="flex flex-wrap gap-2">
                {s.examples.map((w) => (
                  <button key={w} onClick={() => speak(w)} className="rounded-xl bg-sky-50 px-3 py-1.5 text-2xl font-semibold text-sky-900 hover:bg-sky-100">
                    🔊 {w}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      {tab === 'pairs' && exercises.pairs && (
        <Card>
          <ExerciseRunner ex={exercises.pairs} lessonId={u.id} sectionKey="pairs" />
        </Card>
      )}
      {tab === 'tones' && exercises.tones && (
        <Card>
          <ExerciseRunner ex={exercises.tones} lessonId={u.id} sectionKey="tones" />
        </Card>
      )}
      {tab === 'build' && <SyllableBuilder unit={u} />}
      {tab === 'dictation' && exercises.dictation && (
        <Card>
          <ExerciseRunner ex={exercises.dictation} lessonId={u.id} sectionKey="dictation" />
        </Card>
      )}
      {tab === 'games' && (
        <div className="grid gap-4">
          <ToneCatch words={pronunciation.toneGame.words} />
          <ToneChart />
        </div>
      )}
    </div>
  );
}

function buildExercises(u: Unit): { pairs?: Exercise; tones?: Exercise; dictation?: Exercise } {
  const out: { pairs?: Exercise; tones?: Exercise; dictation?: Exercise } = {};
  const sets = u.pairWords ?? [];
  if (sets.length) {
    const items = sets.flatMap((set) =>
      shuffle(set)
        .slice(0, 2)
        .map((w) => ({ q: w, options: set, answer: set.indexOf(w) })),
    );
    out.pairs = { type: 'listen-choose', title: 'Nghe và chọn', titleEn: 'Listen and choose', items: shuffle(items) };
  }
  if (u.tonePick?.length) out.tones = { type: 'tone-pick', title: 'Chọn dấu thanh', titleEn: 'Choose the tone', items: shuffle(u.tonePick).map((w) => ({ base: w, answers: [w] })) };
  if (u.dictation?.length) out.dictation = { type: 'dictation', title: 'Chính tả', titleEn: 'Dictation', items: u.dictation.map((w) => ({ q: w, answers: [w] })) };
  return out;
}

function SyllableBuilder({ unit }: { unit: Unit }) {
  const items = unit.build as { onset: string; rhyme: string; tone: Tone }[];
  const onsets = useMemo(() => shuffle([...new Set([...items.map((x) => x.onset), 'b', 'm', 'ng', 'kh', 'th'])]).slice(0, 7), [items]);
  const rhymes = useMemo(() => shuffle([...new Set([...items.map((x) => x.rhyme), 'a', 'ô', 'ươi', 'an'])]).slice(0, 7), [items]);
  const [i, setI] = useState(0);
  const [on, setOn] = useState<string | null>(null);
  const [rh, setRh] = useState<string | null>(null);
  const [tn, setTn] = useState<Tone | null>(null);
  const [state, setState] = useState<'ask' | 'right' | 'wrong'>('ask');
  const t = items[i];
  const target = setTone(t.onset + t.rhyme, t.tone);
  const built = on && rh ? setTone(on + rh, tn ?? 'ngang') : `${on ?? '_'} + ${rh ?? '_'}`;
  const check = () => {
    if (on === t.onset && rh === t.rhyme && (tn ?? 'ngang') === t.tone) {
      setState('right');
      sfx.correct();
      speak(target);
      if (i === items.length - 1) recordSection(unit.id, 'build', { done: true, stars: 3 });
    } else {
      setState('wrong');
      sfx.wrong();
    }
  };
  const next = () => {
    setI((i + 1) % items.length);
    setOn(null);
    setRh(null);
    setTn(null);
    setState('ask');
  };
  const Chip = ({ v, sel, onClick }: { v: string; sel: boolean; onClick: () => void }) => (
    <button
      onClick={() => {
        onClick();
        setState('ask');
        sfx.click();
      }}
      className={`min-w-14 rounded-xl px-3 py-2 text-2xl font-bold ${sel ? 'bg-rose-500 text-white' : 'bg-white ring-1 ring-slate-200 hover:bg-rose-50'}`}
    >
      {v}
    </button>
  );
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <Bi vi="Nghe rồi ghép: phụ âm đầu + vần + thanh" en="Listen, then build: initial + rhyme + tone" className="text-xl font-bold" />
        <span className="text-sm text-slate-400">
          {i + 1}/{items.length}
        </span>
      </div>
      <div className="mb-4 flex items-center justify-center gap-4">
        <SpeakBtn text={target} size="lg" slowToo />
        <div className={`min-w-40 rounded-2xl px-6 py-3 text-center text-5xl font-extrabold ${state === 'right' ? 'bg-emerald-100 text-emerald-700' : state === 'wrong' ? 'bg-red-50 text-red-500' : 'bg-slate-50'}`}>{built}</div>
      </div>
      <div className="mb-2 text-sm font-bold text-slate-500">Phụ âm đầu</div>
      <div className="mb-3 flex flex-wrap gap-2">
        {onsets.map((o) => (
          <Chip key={o} v={o} sel={on === o} onClick={() => setOn(o)} />
        ))}
      </div>
      <div className="mb-2 text-sm font-bold text-slate-500">Vần</div>
      <div className="mb-3 flex flex-wrap gap-2">
        {rhymes.map((r) => (
          <Chip key={r} v={r} sel={rh === r} onClick={() => setRh(r)} />
        ))}
      </div>
      <div className="mb-2 text-sm font-bold text-slate-500">Thanh</div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TONES.map((x) => (
          <Chip key={x} v={`${TONE_ON_A[x]} ${x}`} sel={(tn ?? null) === x} onClick={() => setTn(x)} />
        ))}
      </div>
      {state === 'right' ? (
        <Btn variant="success" onClick={next}>
          ✅ {target} – Tiếp →
        </Btn>
      ) : (
        <Btn onClick={check} disabled={!on || !rh}>
          Kiểm tra
        </Btn>
      )}
      {state === 'wrong' && <span className="ml-3 text-red-600">Nghe lại nhé!</span>}
    </Card>
  );
}
