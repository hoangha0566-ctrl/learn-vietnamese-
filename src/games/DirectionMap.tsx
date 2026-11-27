// Game "Dẫn đường" – bản đồ lưới, nhân vật rẽ theo hướng đang nhìn (không theo màn hình).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { useGame, type GameProps } from './GameHost';
import { Bi, Btn, Card, SpeakBtn, useSettings } from '../components/ui';
import { AnswerInput } from '../components/AnswerInput';
import { getLesson } from '../data';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { nfc } from '../lib/vietnamese';

type Dir = 'N' | 'E' | 'S' | 'W';
const DIRS: Dir[] = ['N', 'E', 'S', 'W'];
const DELTA: Record<Dir, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const ROT: Record<Dir, number> = { N: 0, E: 90, S: 180, W: 270 };
export type Cmd = 'đi thẳng' | 'đi thêm một chút' | 'rẽ trái' | 'rẽ phải' | 'quay lại';

interface Pos {
  x: number;
  y: number;
  facing: Dir;
}

const turn = (d: Dir, k: number): Dir => DIRS[(DIRS.indexOf(d) + k + 4) % 4];

/** Tách câu chỉ đường tiếng Việt thành chuỗi lệnh */
export function parseDirections(text: string): Cmd[] {
  const t = nfc(text).toLowerCase().replace(/quẹo/g, 'rẽ').replace(/queo/g, 'rẽ');
  const re = /(đi thẳng|thẳng|(?:đi )?(?:thêm|tiếp) (?:một )?(?:chút|tí|xíu)|rẽ trái|rẽ phải|quay lại|ngã tư thứ (hai|ba|bốn|năm|2|3|4|5))/g;
  const NUM: Record<string, number> = { hai: 2, ba: 3, bốn: 4, năm: 5, '2': 2, '3': 3, '4': 4, '5': 5 };
  const out: Cmd[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const s = m[1];
    if (s === 'đi thẳng' || s === 'thẳng') out.push('đi thẳng');
    else if (s.startsWith('rẽ trái')) out.push('rẽ trái');
    else if (s.startsWith('rẽ phải')) out.push('rẽ phải');
    else if (s === 'quay lại') out.push('quay lại');
    else if (s.startsWith('ngã tư thứ')) {
      const n = NUM[m[2]] ?? 1;
      if (out[out.length - 1] === 'đi thẳng') for (let k = 1; k < n; k++) out.push('đi thẳng');
    } else out.push('đi thêm một chút');
  }
  return out;
}

const isRoad = (x: number, y: number) => x % 2 === 0 || y % 2 === 0;

/** Chạy từng lệnh, trả về các vị trí trung gian và lỗi (nếu có) */
function simulate(start: Pos, cmds: Cmd[], w: number, h: number): { path: Pos[]; error: boolean } {
  const path: Pos[] = [];
  let p = { ...start };
  for (const c of cmds) {
    if (c === 'rẽ trái') p = { ...p, facing: turn(p.facing, -1) };
    else if (c === 'rẽ phải') p = { ...p, facing: turn(p.facing, 1) };
    else if (c === 'quay lại') p = { ...p, facing: turn(p.facing, 2) };
    else {
      // "đi thẳng" = đi đến ngã tư kế tiếp (tối đa 2 ô); "đi thêm một chút" = 1 ô
      const steps = c === 'đi thẳng' ? 2 : 1;
      for (let k = 0; k < steps; k++) {
        const [dx, dy] = DELTA[p.facing];
        const nx = p.x + dx;
        const ny = p.y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || !isRoad(nx, ny)) {
          path.push(p);
          return { path, error: true };
        }
        p = { ...p, x: nx, y: ny };
        path.push(p);
        if (c === 'đi thẳng' && nx % 2 === 0 && ny % 2 === 0) break;
      }
      continue;
    }
    path.push(p);
  }
  return { path, error: false };
}

function sideOf(pos: Pos, b: { x: number; y: number }): string {
  const dx = b.x - pos.x;
  const dy = b.y - pos.y;
  const [fx, fy] = DELTA[pos.facing];
  const cross = fx * dy - fy * dx; // >0: bên phải (trục y hướng xuống)
  const dot = fx * dx + fy * dy;
  if (cross > 0) return 'bên phải';
  if (cross < 0) return 'bên trái';
  return dot > 0 ? 'đối diện' : 'phía sau';
}

export function DirectionMap({ config }: GameProps) {
  const api = useGame();
  const { teacher } = useSettings();
  let cfg = config;
  if (config.reuseMapFrom) {
    const src = getLesson(config.reuseMapFrom)?.games?.find((g) => g.type === 'direction-map');
    cfg = src?.config ?? config;
  }
  const map = cfg.map;
  const levels: any[] = Array.isArray(cfg.levels) ? cfg.levels : [];
  const [lv, setLv] = useState(0);
  const [variant, setVariant] = useState<'guide' | 'listen'>('guide');
  const level = levels[lv];
  const [pos, setPos] = useState<Pos>(level?.start);
  const [queue, setQueue] = useState<Cmd[]>([]);
  const [busy, setBusy] = useState(false);
  const [bubble, setBubble] = useState<string>(level?.ask ?? '');
  const [phase, setPhase] = useState<'route' | 'side' | 'done'>('route');
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [mood, setMood] = useState<'ok' | 'confused' | 'happy'>('ok');
  const cancel = useRef(false);

  const goal = map.places.find((p: any) => p.id === level?.goal);

  useEffect(() => {
    if (!level) return;
    setPos(level.start);
    setQueue([]);
    setPhase('route');
    setMissed(false);
    setShowModel(false);
    setMood('ok');
    setBubble(variant === 'listen' ? 'Nghe và dẫn tôi đi nhé!' : level.ask);
    if (variant === 'guide') setTimeout(() => speak(level.ask), 300);
    else setTimeout(() => speak(level.modelAnswer), 300);
  }, [lv, variant]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!level || !map) return <Card>Chưa có màn chơi.</Card>;

  const reset = () => {
    setPos(level.start);
    setMood('ok');
  };

  const arrive = (p: Pos) => {
    if (p.x === level.door.x && p.y === level.door.y) {
      setMood('happy');
      sfx.correct();
      const q2 = `${capitalize(goal.name)} ở bên nào vậy?`;
      setBubble(api.mode === 'hard' ? q2 : `${capitalize(goal.name)} ở bên trái hay bên phải?`);
      speak(api.mode === 'hard' ? q2 : `${capitalize(goal.name)} ở bên trái hay bên phải?`);
      setPhase('side');
      return true;
    }
    return false;
  };

  const run = async (cmds: Cmd[]) => {
    if (!cmds.length) return;
    setBusy(true);
    cancel.current = false;
    const { path, error } = simulate(pos, cmds, map.width, map.height);
    let last = pos;
    for (const p of path) {
      if (cancel.current) break;
      setPos(p);
      last = p;
      sfx.tick();
      await new Promise((r) => setTimeout(r, 380));
    }
    setBusy(false);
    setQueue([]);
    if (error) {
      setMood('confused');
      setBubble('Ơ, tôi đi đâu đây? 🤔');
      speak('Ơ, tôi đi đâu đây?');
      setMissed(true);
      api.wrong();
      return;
    }
    if (!arrive(last)) {
      setMood('confused');
      setBubble(`Ơ, ${goal.name} ở đâu? Đây đâu phải ${goal.name}!`);
      speak(`Ơ, đây đâu phải ${goal.name}!`);
      setMissed(true);
      api.wrong();
    }
  };

  // Chế độ "Nghe & đi": mỗi nút thực hiện ngay
  const stepNow = (c: Cmd) => {
    if (busy || phase !== 'route') return;
    const { path, error } = simulate(pos, [c], map.width, map.height);
    const p = path[path.length - 1] ?? pos;
    setPos(p);
    if (error) {
      setMood('confused');
      sfx.wrong();
      setMissed(true);
    } else {
      setMood('ok');
      sfx.tick();
      arrive(p);
    }
  };

  const answerSide = (s: string) => {
    if (s === level.side) {
      setScore((x) => x + (missed ? 0 : 1));
      setBubble(`Cảm ơn ${pronounFor(level.tourist)} nhiều! 🙏`);
      speak(`Cảm ơn ${pronounFor(level.tourist)} nhiều!`);
      api.correct();
      setPhase('done');
    } else {
      setMissed(true);
      api.wrong();
      setBubble('Hả? Tôi không thấy… Nhìn lại nhé!');
    }
  };

  const nextLevel = () => {
    if (lv + 1 >= levels.length) api.finish(score, levels.length);
    else setLv(lv + 1);
  };

  const cell = 100 / map.width;
  const placeAt = (x: number, y: number) => map.places.find((p: any) => p.x === x && p.y === y);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,560px)_1fr]">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {levels.map((l, i) => (
            <button key={i} onClick={() => !busy && setLv(i)} className={`rounded-full px-3 py-1 text-sm font-bold ${i === lv ? 'bg-rose-500 text-white' : 'bg-slate-100'}`}>
              Màn {l.level ?? i + 1}
            </button>
          ))}
          <span className="ml-auto text-sm font-bold text-emerald-600">⭐ {score}</span>
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-lime-200 shadow-inner ring-4 ring-lime-300">
          {Array.from({ length: map.height }, (_, y) =>
            Array.from({ length: map.width }, (_, x) => {
              const road = isRoad(x, y);
              const inter = x % 2 === 0 && y % 2 === 0;
              const place = placeAt(x, y);
              const isGoal = place?.id === level.goal;
              const isDoor = teacher && level.door.x === x && level.door.y === y;
              return (
                <div
                  key={`${x}-${y}`}
                  className={`absolute flex flex-col items-center justify-center overflow-hidden text-center ${road ? (inter ? 'bg-slate-500' : 'bg-slate-400') : 'p-1'}`}
                  style={{ left: `${x * cell}%`, top: `${y * cell}%`, width: `${cell}%`, height: `${cell}%` }}
                >
                  {road && !inter && (
                    <span className={`absolute bg-yellow-200/80 ${x % 2 === 0 ? 'h-1/2 w-[3px]' : 'h-[3px] w-1/2'}`} />
                  )}
                  {isDoor && <span className="absolute inset-1 rounded border-2 border-dashed border-amber-300" />}
                  {place && (
                    <div className={`flex h-full w-full flex-col items-center justify-center rounded-lg ${isGoal ? 'bg-amber-200 ring-4 ring-amber-400' : 'bg-white/90'}`}>
                      <span className="text-[min(7vw,2.2rem)] leading-none">{place.emoji}</span>
                      <span className="mt-0.5 line-clamp-2 text-[min(2.2vw,0.72rem)] font-bold leading-tight text-slate-700">{place.name}</span>
                    </div>
                  )}
                </div>
              );
            }),
          )}
          {/* nhân vật */}
          <div
            className="absolute z-10 flex items-center justify-center transition-all duration-300 ease-out"
            style={{ left: `${pos.x * cell}%`, top: `${pos.y * cell}%`, width: `${cell}%`, height: `${cell}%` }}
          >
            <div className="relative flex h-full w-full items-center justify-center">
              <div className="absolute inset-0 z-20 transition-transform duration-300" style={{ transform: `rotate(${ROT[pos.facing]}deg)` }}>
                <span className="absolute left-1/2 top-[-12%] -translate-x-1/2 text-[min(4.5vw,1.4rem)] leading-none text-rose-600 drop-shadow-[0_0_2px_white]">▲</span>
              </div>
              <span className={`text-[min(8vw,2.6rem)] ${mood === 'confused' ? 'animate-[shake_0.5s]' : mood === 'happy' ? 'animate-[jump_0.6s_2]' : ''}`}>
                {emojiOf(level.tourist) || '🧳'}
              </span>
              {mood === 'confused' && <span className="absolute -right-1 -top-1 text-xl">❓</span>}
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          <Bi vi="▲ cho biết hướng nhân vật đang nhìn. Rẽ trái/phải theo hướng của nhân vật!" en="▲ shows where the tourist is facing. Turn left/right from THEIR point of view!" />
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-bold">
          <button onClick={() => setVariant('guide')} className={`flex-1 rounded-lg px-3 py-1.5 ${variant === 'guide' ? 'bg-white shadow' : 'text-slate-500'}`}>
            🗺️ Chỉ đường
          </button>
          <button onClick={() => setVariant('listen')} className={`flex-1 rounded-lg px-3 py-1.5 ${variant === 'listen' ? 'bg-white shadow' : 'text-slate-500'}`}>
            👂 Đảo vai: Nghe & đi
          </button>
        </div>
        <Card className="!p-4">
          <div className="flex items-start gap-3">
            <span className="text-5xl">{emojiOf(level.tourist) || '🧳'}</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-500">{stripEmoji(level.tourist)}</div>
              <div className="text-xl font-semibold">“{bubble}”</div>
            </div>
            <SpeakBtn text={variant === 'listen' && phase === 'route' ? level.modelAnswer : bubble} slowToo />
          </div>
          <div className="mt-2 text-sm text-slate-500">
            🎯 Đích: <b>{goal?.emoji} {goal?.name}</b>
          </div>
        </Card>

        {phase === 'route' && variant === 'guide' && (
          <Card className="!p-4">
            {api.mode === 'easy' ? (
              <>
                <Bi vi="Bấm lệnh để tạo đường đi, rồi bấm “Đi!”" en="Build the route with commands, then press “Go!”" className="mb-2 text-slate-600" />
                <div className="grid grid-cols-2 gap-2">
                  {(['đi thẳng', 'đi thêm một chút', 'rẽ trái', 'rẽ phải'] as Cmd[]).map((c) => (
                    <Btn key={c} variant="secondary" disabled={busy} onClick={() => setQueue([...queue, c])} className="py-3 text-lg">
                      {c === 'đi thẳng' ? '⬆️' : c === 'rẽ trái' ? '↰' : c === 'rẽ phải' ? '↱' : '👣'} {capitalize(c)}
                    </Btn>
                  ))}
                </div>
                <div className="mt-3 flex min-h-12 flex-wrap gap-1 rounded-xl bg-slate-50 p-2">
                  {queue.length === 0 && <span className="text-slate-400">…</span>}
                  {queue.map((c, i) => (
                    <span key={i} className="rounded-lg bg-sky-100 px-2 py-1 text-sm font-semibold text-sky-800">
                      {i + 1}. {c}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Btn variant="ghost" disabled={busy || !queue.length} onClick={() => setQueue(queue.slice(0, -1))}>
                    ⌫
                  </Btn>
                  <Btn variant="ghost" disabled={busy} onClick={() => { setQueue([]); reset(); }}>
                    ↺ Về chỗ cũ
                  </Btn>
                  <Btn className="ml-auto px-8" disabled={busy || !queue.length} onClick={() => run(queue)} variant="success">
                    Đi! 🚶
                  </Btn>
                </div>
              </>
            ) : (
              <>
                <Bi vi="Gõ câu chỉ đường, ví dụ: “Anh đi thẳng, đến ngã tư thì rẽ trái.”" en="Type directions in Vietnamese" className="mb-2 text-slate-600" />
                <HardInput
                  disabled={busy}
                  onSubmit={(text) => {
                    const cmds = parseDirections(text);
                    if (!cmds.length) {
                      setBubble('Xin lỗi, tôi không hiểu. Đi thẳng hay rẽ? 🤔');
                      return;
                    }
                    reset();
                    setQueue(cmds);
                    setTimeout(() => run(cmds), 50);
                  }}
                />
                {queue.length > 0 && <div className="mt-2 text-sm text-slate-500">Hiểu là: {queue.join(' → ')}</div>}
                <Btn variant="ghost" className="mt-1" onClick={reset}>
                  ↺ Về chỗ cũ
                </Btn>
              </>
            )}
          </Card>
        )}

        {phase === 'route' && variant === 'listen' && (
          <Card className="!p-4">
            <Bi vi="Nghe chỉ đường rồi tự dẫn nhân vật đi từng bước." en="Listen, then move the tourist step by step." className="mb-2 text-slate-600" />
            <div className="grid grid-cols-2 gap-2">
              {(['đi thẳng', 'đi thêm một chút', 'rẽ trái', 'rẽ phải'] as Cmd[]).map((c) => (
                <Btn key={c} variant="secondary" onClick={() => stepNow(c)} className="py-3 text-lg">
                  {capitalize(c)}
                </Btn>
              ))}
            </div>
            <Btn variant="ghost" className="mt-2" onClick={reset}>
              ↺ Về chỗ cũ
            </Btn>
          </Card>
        )}

        {phase === 'side' && (
          <Card className="!p-4">
            {api.mode === 'easy' ? (
              <div className="grid grid-cols-3 gap-2">
                {['bên trái', 'bên phải', 'đối diện'].map((s) => (
                  <Btn key={s} variant="secondary" className="py-3 text-lg" onClick={() => answerSide(s)}>
                    {capitalize(s)}
                  </Btn>
                ))}
              </div>
            ) : (
              <AnswerInput
                answers={[`${capitalize(goal.name)} ở ${level.side}.`, `Ở ${level.side}.`, capitalize(level.side), `${capitalize(goal.name)} ở ${level.side} ${pronounFor(level.tourist)}.`]}
                placeholder="Ví dụ: Bưu điện ở bên trái."
                onResult={(r) => (r.status === 'correct' ? answerSide(level.side) : r.status === 'wrong' && answerSide('x'))}
              />
            )}
            <p className="mt-2 text-sm text-slate-500">
              Gợi ý: tính theo hướng nhân vật đang nhìn ▲ ({DIR_VI[pos.facing]})
              {teacher && <> · Đáp án: <b>{sideOf(pos, goal)}</b></>}
            </p>
          </Card>
        )}

        {phase === 'done' && (
          <Card className="!p-4 text-center">
            <div className="mb-2 text-xl font-bold text-emerald-600">🎉 {stripEmoji(level.tourist)} đã đến {goal.name}!</div>
            <Btn variant="success" onClick={nextLevel} className="px-8">
              {lv + 1 >= levels.length ? 'Xong 🏁' : 'Màn tiếp →'}
            </Btn>
          </Card>
        )}

        <div>
          <Btn variant="ghost" onClick={() => setShowModel(!showModel)}>
            💡 {showModel ? 'Ẩn câu mẫu' : 'Xem câu mẫu'}
          </Btn>
          {showModel && (
            <div className="mt-2 rounded-xl bg-amber-50 p-3 text-lg text-amber-900">
              {level.modelAnswer} <SpeakBtn text={level.modelAnswer} size="sm" className="align-middle" />
              <div className="mt-1 text-sm">Lệnh: {level.solution?.join(' → ')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DIR_VI: Record<Dir, string> = { N: 'đang nhìn lên trên', E: 'đang nhìn sang phải màn hình', S: 'đang nhìn xuống dưới', W: 'đang nhìn sang trái màn hình' };

function HardInput({ onSubmit, disabled }: { onSubmit: (t: string) => void; disabled?: boolean }) {
  const [v, setV] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onSubmit(v);
      }}
      className="flex flex-col gap-2"
    >
      <textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        rows={3}
        lang="vi"
        className="w-full rounded-xl border-2 border-slate-200 p-3 text-xl outline-none focus:border-sky-400"
        placeholder="Anh đi thẳng, đến ngã tư thì rẽ phải…"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (v.trim()) onSubmit(v);
          }
        }}
      />
      <Btn type="submit" disabled={disabled} variant="success" className="self-end px-8">
        Đi! 🚶
      </Btn>
    </form>
  );
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
function emojiOf(s: string) {
  return (s.match(/[\p{Extended_Pictographic}][‍️\p{Extended_Pictographic}]*/u) ?? [''])[0];
}
function stripEmoji(s: string) {
  return s.replace(/[\p{Extended_Pictographic}‍️]/gu, '').trim();
}
function pronounFor(tourist: string) {
  const n = stripEmoji(tourist).toLowerCase();
  if (n.startsWith('ông')) return 'ông';
  if (n.startsWith('bà')) return 'bà';
  if (n.startsWith('anh')) return 'anh';
  if (n.startsWith('chị')) return 'chị';
  return 'bạn';
}
