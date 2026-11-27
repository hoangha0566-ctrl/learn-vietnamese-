// Game phát âm: "Bắt thanh điệu" (từ rơi) và "Biểu đồ 6 thanh" (đường cao độ + micro).
import { useEffect, useRef, useState } from 'react';
import { Bi, Btn, Card, SpeakBtn, Confetti } from '../components/ui';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { TONES, TONE_EN, TONE_ON_A, getTone, setTone, shuffle, stripTones, type Tone } from '../lib/vietnamese';

// ---------------- Bắt thanh điệu ----------------
export function ToneCatch({ words }: { words: string[] }) {
  const [running, setRunning] = useState(false);
  const [word, setWord] = useState<string | null>(null);
  const [y, setY] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [speed, setSpeed] = useState(0.35);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [best, setBest] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const [showWord, setShowWord] = useState(true);
  const queue = useRef<string[]>([]);
  const raf = useRef(0);
  const state = useRef({ y: 0, word: null as string | null, speed: 0.35, lives: 3 });

  const nextWord = () => {
    if (!queue.current.length) queue.current = shuffle(words);
    const w = queue.current.pop()!;
    state.current.word = w;
    state.current.y = 0;
    setWord(w);
    setY(0);
    speak(w);
  };

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(50, t - last);
      last = t;
      state.current.y += (state.current.speed * dt) / 16;
      setY(state.current.y);
      if (state.current.y >= 100) {
        // chạm đất
        sfx.wrong();
        state.current.lives -= 1;
        setLives(state.current.lives);
        setFlash('bad');
        setTimeout(() => setFlash(null), 400);
        if (state.current.lives <= 0) {
          setRunning(false);
          return;
        }
        nextWord();
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const k = Number(e.key);
      if (running && k >= 1 && k <= 6) press(TONES[k - 1]);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  const start = () => {
    setScore(0);
    setLives(3);
    state.current = { y: 0, word: null, speed: 0.35, lives: 3 };
    setSpeed(0.35);
    setRunning(true);
    nextWord();
  };

  const press = (t: Tone) => {
    const w = state.current.word;
    if (!running || !w) return;
    const target = w.split(' ').map(getTone)[0];
    if (t === target) {
      sfx.correct();
      setScore((s) => {
        const n = s + 1;
        if (n > best) setBest(n);
        if (n % 5 === 0) setConfetti((c) => c + 1);
        return n;
      });
      state.current.speed += 0.03;
      setSpeed(state.current.speed);
      setFlash('ok');
      setTimeout(() => setFlash(null), 300);
      nextWord();
    } else {
      sfx.wrong();
      setFlash('bad');
      setTimeout(() => setFlash(null), 300);
      state.current.y = Math.min(95, state.current.y + 15);
    }
  };

  return (
    <Card>
      <Confetti fire={confetti} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Bi vi="🎯 Bắt thanh điệu" en="Catch the tone" className="text-2xl font-extrabold" />
        <div className="flex items-center gap-3 text-lg font-bold">
          <span>⭐ {score}</span>
          <span>{'❤️'.repeat(Math.max(0, lives))}</span>
          <span className="text-sm text-slate-400">Kỷ lục: {best}</span>
        </div>
      </div>
      <div className={`relative h-72 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-200 to-emerald-100 transition ${flash === 'ok' ? 'ring-4 ring-emerald-400' : flash === 'bad' ? 'ring-4 ring-red-400' : ''}`}>
        <div className="absolute bottom-0 h-6 w-full bg-emerald-600" />
        {running && word && (
          <div className="absolute left-1/2 -translate-x-1/2 rounded-2xl bg-white px-5 py-2 text-4xl font-extrabold shadow-lg" style={{ top: `${Math.min(y, 100) * 0.78}%` }}>
            {showWord ? stripTones(word) : '🔊'}
          </div>
        )}
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {lives <= 0 && <div className="text-2xl font-bold">Hết lượt! ⭐ {score}</div>}
            <Btn onClick={start} className="px-8 py-3 text-xl">
              ▶ {lives <= 0 ? 'Chơi lại' : 'Bắt đầu'}
            </Btn>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!showWord} onChange={(e) => setShowWord(!e.target.checked)} /> Chế độ khó: chỉ nghe, không thấy chữ
            </label>
          </div>
        )}
        {running && (
          <button onClick={() => word && speak(word)} className="absolute right-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xl">
            🔊
          </button>
        )}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {TONES.map((t, k) => (
          <button key={t} onClick={() => press(t)} className="rounded-2xl bg-white py-2 ring-1 ring-slate-200 transition hover:bg-sky-50 active:scale-95">
            <div className="text-3xl font-extrabold">{TONE_ON_A[t]}</div>
            <div className="text-sm font-semibold">
              {k + 1}. {t}
            </div>
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-slate-500">
        <Bi vi="Nghe từ đang rơi và bấm đúng thanh (phím 1–6) trước khi từ chạm đất." en="Hear the falling word and press its tone (keys 1–6) before it lands." />
      </p>
      <span className="hidden">{speed}</span>
    </Card>
  );
}

// ---------------- Biểu đồ 6 thanh ----------------
// Đường cao độ chuẩn (thang 1–5), mỗi thanh là các điểm theo thời gian 0..1
const CONTOURS: Record<Tone, { pts: [number, number][]; glottal?: number }> = {
  ngang: { pts: [[0, 3.8], [1, 3.8]] },
  huyền: { pts: [[0, 2.8], [1, 1.6]] },
  sắc: { pts: [[0, 3.2], [0.4, 3.3], [1, 5]] },
  hỏi: { pts: [[0, 2.8], [0.5, 1.3], [1, 2.6]] },
  ngã: { pts: [[0, 3.2], [0.45, 2.7], [0.55, 3.3], [1, 5]], glottal: 0.5 },
  nặng: { pts: [[0, 2.6], [0.6, 1.4], [0.75, 1.1]], glottal: 0.75 },
};
const TONE_COLORS: Record<Tone, string> = { ngang: '#64748b', huyền: '#3b82f6', sắc: '#ef4444', hỏi: '#f59e0b', ngã: '#a855f7', nặng: '#10b981' };

export function ToneChart({ base = 'ma' }: { base?: string }) {
  const [sel, setSel] = useState<Tone>('sắc');
  const [syll, setSyll] = useState(base);
  const [anim, setAnim] = useState(0);
  const [userPts, setUserPts] = useState<[number, number][] | null>(null);
  const [rec, setRec] = useState(false);
  const [err, setErr] = useState('');
  const W = 400;
  const H = 220;
  const px = (t: number) => 30 + t * (W - 50);
  const py = (v: number) => H - 20 - ((v - 1) / 4) * (H - 40);
  const path = (pts: [number, number][]) => pts.map(([t, v], k) => `${k ? 'L' : 'M'}${px(t)},${py(v)}`).join(' ');
  const word = setTone(syll, sel);

  const play = (t: Tone) => {
    setSel(t);
    setAnim((a) => a + 1);
    speak(setTone(syll, t));
  };

  const record = async () => {
    setErr('');
    setUserPts(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      src.connect(an);
      const buf = new Float32Array(an.fftSize);
      const pitches: { t: number; f: number }[] = [];
      setRec(true);
      const t0 = performance.now();
      await new Promise<void>((resolve) => {
        const tick = () => {
          const t = performance.now() - t0;
          an.getFloatTimeDomainData(buf);
          const f = autoCorrelate(buf, ctx.sampleRate);
          if (f > 70 && f < 500) pitches.push({ t, f });
          if (t < 1600) requestAnimationFrame(tick);
          else resolve();
        };
        tick();
      });
      stream.getTracks().forEach((tr) => tr.stop());
      ctx.close();
      setRec(false);
      if (pitches.length < 5) {
        setErr('Không nghe rõ – hãy nói to và gần micro hơn.');
        return;
      }
      // chuẩn hoá: thời gian 0..1 trong đoạn có tiếng, cao độ theo bán cung quanh trung vị
      const ta = pitches[0].t;
      const tb = pitches[pitches.length - 1].t;
      const semis = pitches.map((p) => 12 * Math.log2(p.f));
      const sorted = [...semis].sort((a, b) => a - b);
      const med = sorted[Math.floor(sorted.length / 2)];
      const pts: [number, number][] = pitches.map((p, k) => [(p.t - ta) / Math.max(1, tb - ta), Math.max(1, Math.min(5, 3 + (semis[k] - med) / 3))]);
      setUserPts(smooth(pts));
    } catch {
      setRec(false);
      setErr('Không mở được micro (cần cho phép trình duyệt dùng micro).');
    }
  };

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Bi vi="📈 Biểu đồ 6 thanh" en="Six-tone pitch chart" className="text-2xl font-extrabold" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Âm tiết:</span>
          {['ma', 'ba', 'co', 'ta'].map((b) => (
            <button key={b} onClick={() => setSyll(b)} className={`rounded-full px-3 py-1 font-bold ${syll === b ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>
              {b}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl bg-slate-50">
          {[1, 2, 3, 4, 5].map((v) => (
            <g key={v}>
              <line x1={30} x2={W - 20} y1={py(v)} y2={py(v)} stroke="#e2e8f0" />
              <text x={10} y={py(v) + 4} fontSize="11" fill="#94a3b8">
                {v}
              </text>
            </g>
          ))}
          {TONES.filter((t) => t !== sel).map((t) => (
            <path key={t} d={path(CONTOURS[t].pts)} fill="none" stroke={TONE_COLORS[t]} strokeWidth={2} opacity={0.18} />
          ))}
          <path
            key={sel + anim}
            d={path(CONTOURS[sel].pts)}
            fill="none"
            stroke={TONE_COLORS[sel]}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            className="animate-[draw_1.1s_ease-out_forwards]"
            style={{ strokeDashoffset: 1 }}
          />
          {CONTOURS[sel].glottal !== undefined && (
            <text x={px(CONTOURS[sel].glottal!)} y={py(5) + 8} textAnchor="middle" fontSize="14" fill={TONE_COLORS[sel]}>
              ʔ (tắc họng)
            </text>
          )}
          {userPts && <path d={path(userPts)} fill="none" stroke="#0f172a" strokeWidth={3} strokeDasharray="6 4" />}
          <text x={W - 20} y={H - 4} textAnchor="end" fontSize="11" fill="#94a3b8">
            thời gian →
          </text>
        </svg>
        <div className="flex flex-col items-center gap-2">
          <div className="text-6xl font-extrabold" style={{ color: TONE_COLORS[sel] }}>
            {word}
          </div>
          <div className="text-lg font-bold">
            thanh {sel} <span className="text-sm font-normal text-slate-500">({TONE_EN[sel]})</span>
          </div>
          <SpeakBtn text={word} size="lg" slowToo />
          <Btn variant={rec ? 'warn' : 'secondary'} onClick={record} disabled={rec}>
            {rec ? '🎙️ Đang ghi…' : '🎤 Nói thử & vẽ'}
          </Btn>
          {userPts && <div className="text-xs text-slate-500">– – – đường của bạn</div>}
          {err && <div className="max-w-48 text-center text-sm text-red-600">{err}</div>}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {TONES.map((t) => (
          <button key={t} onClick={() => play(t)} className={`rounded-2xl py-2 ring-2 transition ${sel === t ? 'bg-white' : 'bg-slate-50 ring-transparent'}`} style={{ borderColor: TONE_COLORS[t], ['--tw-ring-color' as string]: sel === t ? TONE_COLORS[t] : 'transparent' }}>
            <div className="text-2xl font-extrabold" style={{ color: TONE_COLORS[t] }}>
              {setTone(syll, t)}
            </div>
            <div className="text-xs font-semibold">{t}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.01) return -1;
  const SIZE = buf.length;
  const minLag = Math.floor(sampleRate / 500);
  const maxLag = Math.floor(sampleRate / 70);
  let best = -1;
  let bestCorr = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0;
    for (let i = 0; i < SIZE - lag; i++) c += buf[i] * buf[i + lag];
    c /= SIZE - lag;
    if (c > bestCorr) {
      bestCorr = c;
      best = lag;
    }
  }
  return best > 0 ? sampleRate / best : -1;
}

function smooth(pts: [number, number][]): [number, number][] {
  return pts.map((p, k) => {
    const win = pts.slice(Math.max(0, k - 2), k + 3);
    return [p[0], win.reduce((s, x) => s + x[1], 0) / win.length];
  });
}
