import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Game, Lesson } from '../types';
import { Bi, Btn, Card, Confetti, Mascot, Stars, useSettings, type Mood } from '../components/ui';
import { recordSection, starsFor, teamsStore, useStore, addTeamPoints } from '../lib/store';
import { sfx } from '../lib/sound';
import { GAMES } from './registry';

export type GameMode = 'easy' | 'hard';

export interface GameApi {
  mode: GameMode;
  lesson: Lesson;
  /** báo kết thúc game */
  finish: (score: number, total: number) => void;
  correct: () => void;
  wrong: () => void;
}

const Ctx = createContext<GameApi | null>(null);
export const useGame = () => useContext(Ctx)!;

export interface GameProps {
  config: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  game: Game;
}

export function GameHost({ game, lesson }: { game: Game; lesson: Lesson }) {
  const [mode, setMode] = useState<GameMode>('easy');
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [confetti, setConfetti] = useState(0);
  const Comp = GAMES[game.type];
  const api: GameApi = {
    mode,
    lesson,
    finish(score, total) {
      setResult({ score, total });
      recordSection(lesson.id, `game-${game.type}`, { done: true, score, total, stars: starsFor(score, total) });
      sfx.win();
      setConfetti((c) => c + 1);
    },
    correct() {
      sfx.correct();
      setConfetti((c) => c + 1);
    },
    wrong() {
      sfx.wrong();
    },
  };
  return (
    <div>
      <Confetti fire={confetti} />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">
            <Bi vi={<>🎮 {game.title}</>} en={game.titleEn} />
          </h2>
          {game.intro && <Bi vi={game.intro} en={game.introEn} className="mt-1 text-lg text-slate-600" />}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['easy', 'hard'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setRun((r) => r + 1);
                  setResult(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold ${mode === m ? 'bg-white shadow' : 'text-slate-500'}`}
              >
                {m === 'easy' ? '🟢 Chọn đáp án' : '🔴 Tự gõ câu'}
              </button>
            ))}
          </div>
          <Btn variant="secondary" onClick={() => { setRun((r) => r + 1); setResult(null); }} title="Chơi lại">
            ↺
          </Btn>
        </div>
      </div>
      <Ctx.Provider value={api}>
        {result ? (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <Mascot mood="wow" say={<Bi vi="Tuyệt vời! Bạn thắng rồi!" en="Awesome! You won!" />} />
            <div className="text-3xl font-extrabold">
              {result.score} / {result.total}
            </div>
            <Stars n={starsFor(result.score, result.total)} className="text-4xl" />
            <TeamAward />
            <Btn onClick={() => { setRun((r) => r + 1); setResult(null); }}>↺ Chơi lại</Btn>
          </Card>
        ) : Comp ? (
          <Comp key={`${run}-${mode}`} config={game.config} game={game} />
        ) : (
          <Card>Game “{game.type}” chưa được hỗ trợ.</Card>
        )}
      </Ctx.Provider>
    </div>
  );
}

/** Ở chế độ giáo viên: cộng điểm nhanh cho đội thắng */
export function TeamAward() {
  const { teacher } = useSettings();
  const teams = useStore(teamsStore);
  if (!teacher) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {teams.map((t, i) => (
        <button key={i} onClick={() => { addTeamPoints(i, 1); sfx.click(); }} className="rounded-full px-3 py-1 font-bold text-white" style={{ background: t.color }}>
          +1 {t.name} ({t.score})
        </button>
      ))}
    </div>
  );
}

// ---------------- Khung game nhiều lượt dùng chung ----------------

export interface Round {
  scene: ReactNode;
  prompt?: ReactNode;
  /** câu app đọc khi bắt đầu lượt */
  say?: string;
  /** lựa chọn ở chế độ dễ (nếu không có → luôn gõ) */
  options?: string[];
  /** đáp án đúng (chỉ số trong options ở chế độ dễ) */
  correctOption?: number | number[];
  /** đáp án chấp nhận khi gõ */
  answers: string[];
  /** phản hồi của nhân vật khi đúng */
  reply?: ReactNode;
  replySay?: string;
  /** gợi ý khi sai */
  hint?: ReactNode;
  /** chỉ dùng lựa chọn kể cả ở chế độ khó */
  choiceOnly?: boolean;
  placeholder?: string;
}

import { AnswerInput } from '../components/AnswerInput';
import { speak } from '../lib/speech';
import { SpeakBtn } from '../components/ui';
import { useEffect } from 'react';

export function RoundPlayer({
  rounds,
  mascot,
  renderScene,
  onRoundDone,
}: {
  rounds: Round[];
  mascot?: (mood: Mood) => ReactNode;
  renderScene?: (round: Round, state: 'ask' | 'right' | 'wrong') => ReactNode;
  onRoundDone?: (i: number, firstTry: boolean) => void;
}) {
  const api = useGame();
  const [i, setI] = useState(0);
  const [state, setState] = useState<'ask' | 'right' | 'wrong'>('ask');
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const r = rounds[i];
  useEffect(() => {
    setState('ask');
    setMissed(false);
    setPicked([]);
    if (r?.say) setTimeout(() => speak(r.say!), 250);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!r) return null;
  const good = (firstTry: boolean) => {
    setState('right');
    if (firstTry) setScore((s) => s + 1);
    api.correct();
    if (r.replySay) setTimeout(() => speak(r.replySay!), 300);
    onRoundDone?.(i, firstTry);
  };
  const bad = () => {
    setState('wrong');
    setMissed(true);
    api.wrong();
  };
  const next = () => {
    if (i + 1 >= rounds.length) api.finish(score, rounds.length);
    else setI(i + 1);
  };
  const correctSet = Array.isArray(r.correctOption) ? r.correctOption : r.correctOption !== undefined ? [r.correctOption] : [];
  const useChoices = r.options && (api.mode === 'easy' || r.choiceOnly);
  const mood: Mood = state === 'right' ? 'happy' : state === 'wrong' ? 'sad' : 'think';
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-400">
        <span>
          Lượt {i + 1} / {rounds.length}
        </span>
        <span className="text-emerald-600">⭐ {score}</span>
      </div>
      <div className="mb-4">{renderScene ? renderScene(r, state) : r.scene}</div>
      {mascot && <div className="mb-3 flex justify-center">{mascot(mood)}</div>}
      {r.prompt && (
        <div className="mb-4 text-center text-2xl font-bold">
          {r.prompt} {r.say && <SpeakBtn text={r.say} size="sm" className="align-middle" />}
        </div>
      )}
      {state !== 'right' && (
        <>
          {useChoices ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {r.options!.map((o, k) => (
                <button
                  key={k}
                  onClick={() => {
                    if (picked.includes(k)) return;
                    setPicked([...picked, k]);
                    if (correctSet.includes(k)) good(!missed);
                    else bad();
                  }}
                  className={`rounded-2xl px-4 py-3 text-xl font-semibold ring-1 transition ${picked.includes(k) && !correctSet.includes(k) ? 'animate-[shake_0.4s] bg-red-50 text-red-400 ring-red-200 line-through' : 'bg-white ring-slate-200 hover:bg-sky-50'}`}
                >
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <AnswerInput
              answers={r.answers}
              resetKey={i}
              placeholder={r.placeholder ?? 'Gõ câu tiếng Việt…'}
              onResult={(res) => {
                if (res.status === 'correct') good(!missed);
                else if (res.status === 'wrong') bad();
                else setMissed(true);
              }}
            />
          )}
          {state === 'wrong' && r.hint && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-lg text-amber-900">💡 {r.hint}</div>}
        </>
      )}
      {state === 'right' && (
        <div className="flex flex-col items-center gap-3">
          {r.reply && <div className="rounded-2xl bg-emerald-50 px-5 py-3 text-center text-2xl font-semibold text-emerald-800">{r.reply}</div>}
          <Btn onClick={next} variant="success" className="px-8 py-3 text-lg">
            {i + 1 >= rounds.length ? 'Xong 🏁' : 'Tiếp →'}
          </Btn>
        </div>
      )}
    </Card>
  );
}
