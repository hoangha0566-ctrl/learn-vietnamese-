// Cờ cá ngựa ôn tập: tung xúc xắc, mỗi ô là câu hỏi lấy ngẫu nhiên từ các bài trước.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import { useGame, type GameProps } from './GameHost';
import { Bi, Btn, Card, useSettings } from '../components/ui';
import { AnswerInput } from '../components/AnswerInput';
import { getLesson } from '../data';
import { teamsStore, useStore, addTeamPoints } from '../lib/store';
import { sfx } from '../lib/sound';
import { speak } from '../lib/speech';
import { shuffle } from '../lib/vietnamese';

interface Q {
  lesson: string;
  type: string;
  q: string;
  options?: string[];
  answer?: number;
  answers?: string[];
  wordBank?: string[];
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];
const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function ReviewBoard({ config }: GameProps) {
  const api = useGame();
  const { teacher } = useSettings();
  const storeTeams = useStore(teamsStore);
  const squares: number = config.squares ?? 30;
  const pool: Q[] = useMemo(() => {
    const out: Q[] = [];
    for (const id of config.pullFrom as string[]) {
      const l = getLesson(id);
      for (const ex of l?.exercises ?? []) {
        if (!(config.exerciseTypes as string[]).includes(ex.type)) continue;
        for (const it of ex.items) out.push({ lesson: id, type: ex.type, q: it.q ?? '', options: it.options, answer: it.answer as number, answers: it.answers, wordBank: ex.wordBank });
      }
    }
    return shuffle(out);
  }, [config]);
  const teamNames = teacher && storeTeams.length >= 2 ? storeTeams.map((t) => t.name) : Array.from({ length: config.teams ?? 2 }, (_, k) => `Đội ${k + 1}`);
  const [pos, setPos] = useState<number[]>(() => teamNames.map(() => 0));
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [qi, setQi] = useState(0);
  const [question, setQuestion] = useState<Q | null>(null);
  const [special, setSpecial] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>('');
  const [correctCount, setCorrectCount] = useState(0);
  const [asked, setAsked] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);

  const roll = () => {
    if (rolling || question || special || winner !== null) return;
    setRolling(true);
    setMsg('');
    let k = 0;
    const iv = setInterval(() => {
      setDice(Math.floor(Math.random() * 6) + 1);
      sfx.tick();
      if (++k > 8) {
        clearInterval(iv);
        const d = Math.floor(Math.random() * 6) + 1;
        setDice(d);
        setRolling(false);
        const np = Math.min(squares, pos[turn] + d);
        const nps = [...pos];
        nps[turn] = np;
        setPos(nps);
        if (np >= squares) {
          setWinner(turn);
          if (teacher) addTeamPoints(turn, 3);
          setTimeout(() => api.finish(correctCount, Math.max(1, asked)), 1500);
          return;
        }
        const sp = config.specialSquares?.[String(np)];
        if (sp) {
          setSpecial(sp);
          speak(sp);
        } else {
          setQuestion(pool[qi % pool.length]);
          setQi(qi + 1);
          setChosen(null);
        }
      }
    }, 90);
  };

  const resolve = (ok: boolean) => {
    setAsked((a) => a + 1);
    if (ok) {
      setCorrectCount((c) => c + 1);
      api.correct();
      setMsg(`✅ ${teamNames[turn]} trả lời đúng!`);
      if (teacher) addTeamPoints(turn, 1);
    } else {
      api.wrong();
      setMsg(`❌ ${config.penalty ?? 'Lùi 2 ô.'}`);
      const nps = [...pos];
      nps[turn] = Math.max(0, nps[turn] - 2);
      setPos(nps);
    }
    setQuestion(null);
    setSpecial(null);
    setTurn((turn + 1) % teamNames.length);
  };

  // bàn cờ hình rắn
  const cols = 6;
  const cells = Array.from({ length: squares + 1 }, (_, k) => k);
  const coord = (k: number) => {
    const row = Math.floor(k / cols);
    const col = row % 2 === 0 ? k % cols : cols - 1 - (k % cols);
    return { row, col };
  };
  const rows = Math.ceil((squares + 1) / cols);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0,1fr))` }}>
        {cells.map((k) => {
          const { row, col } = coord(k);
          const sp = config.specialSquares?.[String(k)];
          return (
            <div
              key={k}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-bold ring-1 ${k === 0 ? 'bg-emerald-100 ring-emerald-300' : k === squares ? 'bg-amber-200 ring-amber-400' : sp ? 'bg-fuchsia-100 ring-fuchsia-300' : 'bg-white ring-slate-200'}`}
              style={{ gridRow: rows - row, gridColumn: col + 1 }}
              title={sp}
            >
              <span className="absolute left-1 top-0.5 text-[10px] text-slate-400">{k}</span>
              {k === 0 ? '🏁' : k === squares ? '🏆' : sp ? '⭐' : ''}
              <div className="flex flex-wrap justify-center gap-0.5">
                {pos.map((p, t) =>
                  p === k ? (
                    <span key={t} className="inline-block h-4 w-4 rounded-full ring-2 ring-white transition-all sm:h-5 sm:w-5" style={{ background: storeTeams[t]?.color ?? COLORS[t % COLORS.length] }} />
                  ) : null,
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-3">
        <Card className="!p-4">
          <div className="mb-2 flex flex-wrap gap-2">
            {teamNames.map((n, t) => (
              <span key={t} className={`rounded-full px-3 py-1 text-sm font-bold text-white ${turn === t ? 'ring-4 ring-amber-300' : 'opacity-70'}`} style={{ background: storeTeams[t]?.color ?? COLORS[t % COLORS.length] }}>
                {n}: ô {pos[t]}
              </span>
            ))}
          </div>
          {winner !== null ? (
            <div className="text-center text-2xl font-extrabold text-emerald-600">🏆 {teamNames[winner]} thắng!</div>
          ) : (
            <div className="flex items-center gap-3">
              <span className={`text-6xl ${rolling ? 'animate-spin' : ''}`}>{dice ? DICE[dice - 1] : '🎲'}</span>
              <Btn onClick={roll} disabled={rolling || !!question || !!special} className="flex-1 py-3 text-lg">
                🎲 {teamNames[turn]} tung xúc xắc
              </Btn>
            </div>
          )}
          {msg && <div className="mt-2 text-lg font-semibold">{msg}</div>}
        </Card>
        {special && (
          <Card className="!p-4">
            <div className="mb-2 text-sm font-bold text-fuchsia-600">⭐ Ô đặc biệt – nói trước lớp</div>
            <div className="mb-3 text-2xl font-bold">{special}</div>
            <Bi vi="Giáo viên chấm:" en="Teacher decides:" className="mb-2 text-slate-500" />
            <div className="flex gap-2">
              <Btn variant="success" onClick={() => resolve(true)}>
                ✓ Tốt
              </Btn>
              <Btn variant="danger" onClick={() => resolve(false)}>
                ✗ Chưa được
              </Btn>
            </div>
          </Card>
        )}
        {question && (
          <Card className="!p-4">
            <div className="mb-1 text-xs font-bold uppercase text-slate-400">{question.lesson.replace('bai-', 'Bài ')}</div>
            <div className="mb-3 text-xl font-bold">{question.q}</div>
            {question.type === 'multiple-choice' && question.options ? (
              <div className="grid gap-2">
                {question.options.map((o, k) => (
                  <Btn
                    key={k}
                    variant={chosen === k ? (k === question.answer ? 'success' : 'danger') : 'secondary'}
                    onClick={() => {
                      if (chosen !== null) return;
                      setChosen(k);
                      setTimeout(() => resolve(k === question.answer), 700);
                    }}
                  >
                    {o}
                  </Btn>
                ))}
              </div>
            ) : (
              <>
                {question.wordBank && api.mode === 'easy' && <div className="mb-2 text-sm text-slate-500">Gợi ý: {question.wordBank.join(' · ')}</div>}
                <AnswerInput
                  key={qi}
                  answers={question.answers ?? []}
                  allowRetry={false}
                  onResult={(r) => setTimeout(() => resolve(r.status !== 'wrong'), 1200)}
                />
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
