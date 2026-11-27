// Công cụ giáo viên: bảng điểm đội, đồng hồ đếm ngược, chọn ngẫu nhiên học viên.
import { useEffect, useRef, useState } from 'react';
import { Btn } from './ui';
import { studentsStore, teamsStore, useStore, addTeamPoints } from '../lib/store';
import { sfx } from '../lib/sound';
import { speak } from '../lib/speech';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];

export function TeacherDock() {
  const [open, setOpen] = useState<'score' | 'timer' | 'pick' | null>(null);
  return (
    <div className="no-print fixed bottom-3 right-3 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200">
          {open === 'score' && <Scoreboard />}
          {open === 'timer' && <Timer />}
          {open === 'pick' && <Picker />}
        </div>
      )}
      <div className="flex gap-2 rounded-full bg-slate-900/90 p-1.5 shadow-lg">
        {(
          [
            ['score', '🏅', 'Bảng điểm đội'],
            ['timer', '⏱️', 'Đồng hồ'],
            ['pick', '🎲', 'Chọn học viên'],
          ] as const
        ).map(([k, icon, title]) => (
          <button
            key={k}
            title={title}
            onClick={() => setOpen(open === k ? null : k)}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-xl transition ${open === k ? 'bg-white' : 'hover:bg-white/20'}`}
          >
            {icon}
          </button>
        ))}
      </div>
      <MiniScores />
    </div>
  );
}

function MiniScores() {
  const teams = useStore(teamsStore);
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {teams.map((t, i) => (
        <span key={i} className="rounded-full px-2.5 py-0.5 text-sm font-bold text-white shadow" style={{ background: t.color }}>
          {t.name}: {t.score}
        </span>
      ))}
    </div>
  );
}

function Scoreboard() {
  const teams = useStore(teamsStore);
  return (
    <div>
      <div className="mb-2 font-extrabold">🏅 Bảng điểm đội · Team scores</div>
      <div className="flex flex-col gap-2">
        {teams.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: t.color }} />
            <input
              value={t.name}
              onChange={(e) => teamsStore.set(teams.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1"
            />
            <button onClick={() => addTeamPoints(i, -1)} className="h-8 w-8 rounded-lg bg-slate-100 font-bold">
              −
            </button>
            <span className="w-8 text-center text-xl font-extrabold tabular-nums">{t.score}</span>
            <button
              onClick={() => {
                addTeamPoints(i, 1);
                sfx.correct();
              }}
              className="h-8 w-8 rounded-lg bg-emerald-500 font-bold text-white"
            >
              +
            </button>
            <button onClick={() => teamsStore.set(teams.filter((_, j) => j !== i))} className="text-slate-400" title="Xoá đội">
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Btn
          variant="secondary"
          className="!px-3 !py-1 text-sm"
          onClick={() => teamsStore.set([...teams, { name: `Đội ${teams.length + 1}`, score: 0, color: COLORS[teams.length % COLORS.length] }])}
        >
          + Thêm đội
        </Btn>
        <Btn variant="ghost" className="!px-3 !py-1 text-sm" onClick={() => teamsStore.set(teams.map((t) => ({ ...t, score: 0 })))}>
          ↺ Về 0
        </Btn>
      </div>
    </div>
  );
}

function Timer() {
  const [total, setTotal] = useState(60);
  const [left, setLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [custom, setCustom] = useState('');
  const iv = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!running) return;
    iv.current = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRunning(false);
          sfx.alarm();
          return 0;
        }
        if (l <= 6) sfx.tick();
        return l - 1;
      });
    }, 1000);
    return () => window.clearInterval(iv.current);
  }, [running]);
  const set = (s: number) => {
    setTotal(s);
    setLeft(s);
    setRunning(false);
  };
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  return (
    <div>
      <div className="mb-2 font-extrabold">⏱️ Đồng hồ đếm ngược · Timer</div>
      <div className={`mb-2 text-center text-6xl font-extrabold tabular-nums ${left <= 5 && left > 0 ? 'text-red-500' : left === 0 ? 'animate-pulse text-red-600' : ''}`}>
        {mm}:{ss}
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-sky-500 transition-all" style={{ width: `${(left / total) * 100}%` }} />
      </div>
      <div className="mb-2 flex gap-2">
        {[30, 60, 120].map((s) => (
          <Btn key={s} variant="secondary" className="flex-1 !px-2 !py-1" onClick={() => set(s)}>
            {s < 60 ? `${s}s` : `${s / 60} phút`}
          </Btn>
        ))}
      </div>
      <div className="mb-2 flex gap-2">
        <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Số giây…" inputMode="numeric" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1" />
        <Btn variant="secondary" className="!px-3 !py-1" onClick={() => Number(custom) > 0 && set(Number(custom))}>
          Đặt
        </Btn>
      </div>
      <div className="flex gap-2">
        <Btn className="flex-1" variant={running ? 'warn' : 'success'} onClick={() => setRunning(!running)} disabled={left === 0}>
          {running ? '⏸ Dừng' : '▶ Chạy'}
        </Btn>
        <Btn variant="ghost" onClick={() => set(total)}>
          ↺
        </Btn>
      </div>
    </div>
  );
}

function Picker() {
  const students = useStore(studentsStore);
  const [text, setText] = useState(students.join('\n'));
  const [pick, setPick] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [noRepeat, setNoRepeat] = useState(true);
  const [used, setUsed] = useState<string[]>([]);
  const go = () => {
    const names = text.split('\n').map((s) => s.trim()).filter(Boolean);
    studentsStore.set(names);
    let pool = noRepeat ? names.filter((n) => !used.includes(n)) : names;
    if (!pool.length) {
      pool = names;
      setUsed([]);
    }
    if (!pool.length) return;
    setRolling(true);
    let k = 0;
    const iv = setInterval(() => {
      setPick(pool[Math.floor(Math.random() * pool.length)]);
      sfx.tick();
      if (++k > 14) {
        clearInterval(iv);
        const final = pool[Math.floor(Math.random() * pool.length)];
        setPick(final);
        setUsed((u) => [...u, final]);
        setRolling(false);
        sfx.win();
        speak(final);
      }
    }, 80);
  };
  return (
    <div>
      <div className="mb-2 font-extrabold">🎲 Chọn ngẫu nhiên học viên</div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={'Mỗi dòng một tên\nAnna\nTom\nKen'} className="mb-2 w-full rounded-lg border border-slate-200 p-2" />
      <label className="mb-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={noRepeat} onChange={(e) => setNoRepeat(e.target.checked)} /> Không lặp lại
      </label>
      <div className={`mb-2 flex h-16 items-center justify-center rounded-xl bg-amber-50 text-3xl font-extrabold ${rolling ? '' : 'text-rose-600'}`}>{pick ?? '?'}</div>
      <Btn className="w-full" onClick={go} disabled={rolling}>
        🎲 Chọn!
      </Btn>
    </div>
  );
}
