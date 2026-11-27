// Các game tương tác riêng: đồng hồ, đi chợ, giao hàng, bingo, lịch, đặt vé, nhà hàng…
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { RoundPlayer, useGame, type GameProps, type Round } from './GameHost';
import { Bi, Btn, Card, SpeakBtn, useSettings } from '../components/ui';
import { AnswerInput } from '../components/AnswerInput';
import { ClockFace } from '../components/ClockFace';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { capitalize, formatVND, normalizeAnswer, numberToWords, sample, shuffle, timeToWords } from '../lib/vietnamese';

const SKY: Record<string, string> = {
  sáng: '#bae6fd',
  trưa: '#fde68a',
  chiều: '#fdba74',
  tối: '#6366f1',
  đêm: '#1e1b4b',
};
const PERIODS = ['sáng', 'trưa', 'chiều', 'tối', 'đêm'];

// ---------------- Đồng hồ ma thuật ----------------
export function MagicClock({ config }: GameProps) {
  const api = useGame();
  const rounds: any[] = config.rounds;
  const [i, setI] = useState(0);
  const [h, setH] = useState(12);
  const [m, setM] = useState(0);
  const [period, setPeriod] = useState<string | null>(null);
  const [state, setState] = useState<'ask' | 'right' | 'wrong'>('ask');
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const r = rounds[i];
  useEffect(() => {
    setH(12);
    setM(0);
    setPeriod(null);
    setState('ask');
    setMissed(false);
    if (api.mode === 'easy') setTimeout(() => speak(r.say), 300);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const h12 = r.h % 12 === 0 ? 12 : r.h % 12;
  const ok = () => {
    setState('right');
    if (!missed) setScore((s) => s + 1);
    api.correct();
  };
  const check = () => {
    if (h === h12 && m === r.m && period === r.period) ok();
    else {
      setState('wrong');
      setMissed(true);
      api.wrong();
    }
  };
  const next = () => (i + 1 >= rounds.length ? api.finish(score, rounds.length) : setI(i + 1));
  const sky = api.mode === 'hard' || state === 'right' ? SKY[r.period] : period ? SKY[period] : '#f1f5f9';
  const answers = [r.say, timeToWords(r.h, r.m), `${h12} giờ${r.m ? ' ' + r.m : ''} ${r.period}`, r.m === 30 ? `${h12} giờ rưỡi ${r.period}` : ''].filter(Boolean);
  return (
    <Card>
      <div className="mb-2 flex justify-between text-sm font-bold text-slate-400">
        <span>
          Lượt {i + 1} / {rounds.length}
        </span>
        <span className="text-emerald-600">⭐ {score}</span>
      </div>
      <div className="grid items-center gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center rounded-3xl p-4 transition-colors duration-700" style={{ background: sky }}>
          <div className="mb-2 text-4xl">{({ sáng: '🌅', trưa: '☀️', chiều: '🌇', tối: '🌆', đêm: '🌙' } as Record<string, string>)[(api.mode === 'hard' || state === 'right' ? r.period : period) ?? ''] ?? '⏰'}</div>
          {api.mode === 'easy' ? (
            <ClockFace h={h} m={m} size={240} onChange={(nh, nm) => { setH(nh); setM(nm); setState('ask'); }} />
          ) : (
            <ClockFace h={r.h} m={r.m} size={240} />
          )}
        </div>
        <div className="flex flex-col gap-3">
          {api.mode === 'easy' ? (
            <>
              <div className="flex items-center gap-3 text-2xl font-bold">
                <SpeakBtn text={r.say} size="lg" slowToo />
                <span>{state === 'right' ? r.say : <Bi vi="Nghe và kéo kim đồng hồ" en="Listen and drag the hands" />}</span>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="secondary" onClick={() => setH(h === 1 ? 12 : h - 1)}>− giờ</Btn>
                <span className="w-24 text-center text-2xl font-bold tabular-nums">
                  {h}:{String(m).padStart(2, '0')}
                </span>
                <Btn variant="secondary" onClick={() => setH(h === 12 ? 1 : h + 1)}>+ giờ</Btn>
                <Btn variant="secondary" onClick={() => setM((m + 5) % 60)}>+5′</Btn>
              </div>
              <div className="flex flex-wrap gap-2">
                {PERIODS.map((p) => (
                  <button key={p} onClick={() => { setPeriod(p); setState('ask'); }} className={`rounded-full px-4 py-2 text-lg font-bold ${period === p ? 'bg-indigo-600 text-white' : 'bg-white ring-1 ring-slate-200'}`}>
                    {p}
                  </button>
                ))}
              </div>
              {state !== 'right' ? (
                <Btn onClick={check} disabled={!period} className="py-3 text-lg">
                  Kiểm tra
                </Btn>
              ) : null}
              {state === 'wrong' && <div className="rounded-xl bg-amber-50 p-3 text-amber-900">💡 Kim ngắn chỉ giờ, kim dài chỉ phút. Nhớ chọn buổi!</div>}
            </>
          ) : (
            <>
              <Bi vi="Nhìn đồng hồ và nền trời, viết giờ kèm buổi" en="Read the clock and sky; write the time with the part of day" className="text-xl font-bold" />
              {state !== 'right' && (
                <AnswerInput
                  answers={answers}
                  resetKey={i}
                  placeholder="Ví dụ: Bảy giờ sáng"
                  onResult={(res) => {
                    if (res.status === 'correct') ok();
                    else setMissed(true);
                  }}
                />
              )}
            </>
          )}
          {state === 'right' && (
            <div className="flex flex-col gap-2">
              <div className="rounded-2xl bg-emerald-50 p-3 text-2xl font-bold text-emerald-700">✅ {r.say}</div>
              <Btn variant="success" onClick={next}>
                {i + 1 >= rounds.length ? 'Xong 🏁' : 'Tiếp →'}
              </Btn>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ---------------- Đi chợ ----------------
const NOTE_COLOR: Record<number, string> = {
  500000: 'bg-cyan-200 text-cyan-900',
  200000: 'bg-orange-300 text-orange-950',
  100000: 'bg-lime-300 text-lime-950',
  50000: 'bg-pink-300 text-pink-950',
  20000: 'bg-sky-300 text-sky-950',
  10000: 'bg-amber-300 text-amber-950',
  5000: 'bg-indigo-300 text-indigo-950',
  2000: 'bg-stone-300 text-stone-900',
  1000: 'bg-emerald-200 text-emerald-900',
};
export function MarketShopping({ config }: GameProps) {
  const api = useGame();
  const items: any[] = config.items;
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'ask' | 'pay' | 'paid'>('ask');
  const [paid, setPaid] = useState<number[]>([]);
  const [price, setPrice] = useState(items[0]?.price ?? 0);
  const [wallet, setWallet] = useState<number>(config.budget);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const [bargained, setBargained] = useState(false);
  const [msg, setMsg] = useState('');
  const { teacher } = useSettings();
  const it = items[i];
  const q = capitalize(config.question.replace('{name}', it.name));
  useEffect(() => {
    setPhase('ask');
    setPaid([]);
    setPrice(it.price);
    setMissed(false);
    setBargained(false);
    setMsg('');
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const sellerSays = () => {
    setMsg(`${capitalize(it.say)}.`);
    speak(it.say);
    setPhase('pay');
  };
  const sum = paid.reduce((a, b) => a + b, 0);
  const pay = () => {
    if (sum === price) {
      setWallet((w) => w - price);
      if (!missed) setScore((s) => s + 1);
      setMsg('Cảm ơn nhé! 😊');
      speak('Cảm ơn nhé!');
      setPhase('paid');
      api.correct();
    } else {
      setMissed(true);
      api.wrong();
      setMsg(sum > price ? 'Nhiều quá! Đưa đúng số tiền nhé.' : 'Chưa đủ tiền!');
    }
  };
  const bargain = () => {
    const np = Math.max(1000, Math.round((price * 0.9) / 5000) * 5000);
    setPrice(np);
    setBargained(true);
    const s = `Thôi được, ${numberToWords(np / 1000)} ngàn.`;
    setMsg(s);
    speak(s);
  };
  const next = () => (i + 1 >= items.length ? api.finish(score, items.length) : setI(i + 1));
  const questionOptions = useMemo(
    () => shuffle([q, `${capitalize(it.name)} này mấy tiền?`, `${capitalize(it.name)} này bao lâu?`, `Bao nhiêu ${it.name} này?`]),
    [i], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="flex flex-col items-center gap-3 bg-gradient-to-b from-orange-50 to-white text-center">
        <div className="flex w-full justify-between text-sm font-bold text-slate-500">
          <span>
            Món {i + 1}/{items.length}
          </span>
          <span>👛 {formatVND(wallet)}</span>
        </div>
        <div className="text-8xl">{it.emoji}</div>
        <div className="text-3xl font-extrabold">{it.name}</div>
        <div className="text-5xl">🧑‍🌾</div>
        {msg && <div className="rounded-2xl bg-white px-5 py-2 text-2xl font-semibold shadow">“{msg}”</div>}
        {phase !== 'ask' && (
          <div className="text-lg text-slate-500">
            Giá: {phase === 'paid' || teacher ? formatVND(price) : '🔊 nghe người bán nói'}
          </div>
        )}
      </Card>
      <Card>
        {phase === 'ask' && (
          <>
            <Bi vi="Hỏi giá món này" en="Ask the price" className="mb-3 text-xl font-bold" />
            {api.mode === 'easy' ? (
              <div className="grid gap-2">
                {questionOptions.map((o) => (
                  <Btn
                    key={o}
                    variant="secondary"
                    className="py-3 text-lg"
                    onClick={() => {
                      if (o === q) sellerSays();
                      else {
                        setMissed(true);
                        api.wrong();
                      }
                    }}
                  >
                    {o}
                  </Btn>
                ))}
              </div>
            ) : (
              <AnswerInput answers={[q, `${q.replace('?', ' vậy?')}`, `${q.replace('?', ' vậy anh?')}`, `${q.replace('?', ' vậy chị?')}`]} placeholder="… bao nhiêu tiền?" onResult={(r) => (r.status === 'correct' ? sellerSays() : setMissed(true))} />
            )}
          </>
        )}
        {phase === 'pay' && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <Bi vi="Chọn tờ tiền để trả đúng giá" en="Pick notes to pay the exact price" className="text-xl font-bold" />
              <SpeakBtn text={numberToWords(price)} slowToo />
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {(config.notes as number[]).map((n) => (
                <button key={n} onClick={() => { setPaid([...paid, n]); sfx.click(); }} className={`rounded-lg px-1 py-3 text-center font-extrabold shadow-sm ring-1 ring-black/10 transition active:scale-95 ${NOTE_COLOR[n] ?? 'bg-slate-200'}`}>
                  {n.toLocaleString('vi-VN')}
                  <div className="text-[10px] font-semibold opacity-70">đồng</div>
                </button>
              ))}
            </div>
            <div className="mb-2 flex min-h-10 flex-wrap gap-1 rounded-xl bg-slate-50 p-2">
              {paid.map((n, k) => (
                <button key={k} onClick={() => setPaid(paid.filter((_, j) => j !== k))} className={`rounded px-2 py-0.5 text-sm font-bold ${NOTE_COLOR[n]}`}>
                  {n.toLocaleString('vi-VN')}
                </button>
              ))}
            </div>
            <div className="mb-3 text-xl font-bold">Tổng: {formatVND(sum)}</div>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={pay} disabled={!paid.length}>
                💵 Trả tiền
              </Btn>
              <Btn variant="ghost" onClick={() => setPaid([])}>
                ↺
              </Btn>
              {!bargained && (
                <Btn variant="warn" onClick={bargain}>
                  🤝 Đắt quá! Bớt chút được không?
                </Btn>
              )}
            </div>
          </>
        )}
        {phase === 'paid' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              ✅ {it.name}: {formatVND(price)}
            </div>
            <Btn variant="success" onClick={next}>
              {i + 1 >= items.length ? 'Xong 🏁' : 'Món tiếp →'}
            </Btn>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------- Người giao hàng ----------------
export function AddressDelivery({ config }: GameProps) {
  const api = useGame();
  const orders: any[] = config.orders;
  const phones: any[] = config.phoneRound ?? [];
  const total = orders.length + phones.length;
  const [i, setI] = useState(0);
  const [built, setBuilt] = useState<string[]>([]);
  const [state, setState] = useState<'ask' | 'right' | 'wrong'>('ask');
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const [digits, setDigits] = useState('');
  const isPhone = i >= orders.length;
  const o = orders[i];
  const ph = phones[i - orders.length];
  const pool = useMemo(() => (o ? shuffle(o.parts as string[]) : []), [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setBuilt([]);
    setState('ask');
    setMissed(false);
    setDigits('');
    if (isPhone && ph) setTimeout(() => speak(ph.say), 300);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const right = () => {
    setState('right');
    if (!missed) setScore((s) => s + 1);
    api.correct();
  };
  const wrong = () => {
    setState('wrong');
    setMissed(true);
    api.wrong();
  };
  const next = () => (i + 1 >= total ? api.finish(score, total) : setI(i + 1));
  return (
    <Card>
      <div className="mb-2 flex justify-between text-sm font-bold text-slate-400">
        <span>
          {i + 1}/{total}
        </span>
        <span className="text-emerald-600">⭐ {score}</span>
      </div>
      <div className="relative mb-4 h-24 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-200 to-slate-100">
        <div className="absolute bottom-3 h-1 w-full bg-slate-400" />
        <span className="absolute bottom-3 text-5xl transition-all duration-1000" style={{ left: state === 'right' ? 'calc(100% - 4rem)' : '0.5rem' }}>
          🛵
        </span>
        <span className="absolute bottom-3 right-2 text-5xl">{state === 'right' ? '🏠🎉' : '🏠'}</span>
      </div>
      {!isPhone ? (
        <>
          <Bi vi={`📦 Giao hàng cho ${o.customer}: sắp xếp địa chỉ đúng thứ tự`} en="Put the address parts in the right order" className="mb-2 text-xl font-bold" />
          <p className="mb-2 text-sm text-slate-500">số nhà → đường → phường → quận → thành phố</p>
          <div className={`mb-3 flex min-h-14 flex-wrap gap-2 rounded-xl border-2 border-dashed p-2 ${state === 'right' ? 'border-emerald-400 bg-emerald-50' : state === 'wrong' ? 'border-red-300' : 'border-slate-300'}`}>
            {built.map((p, k) => (
              <button key={k} onClick={() => state !== 'right' && setBuilt(built.filter((_, j) => j !== k))} className="rounded-lg bg-white px-3 py-1.5 text-lg font-semibold shadow ring-1 ring-sky-300">
                {p}
              </button>
            ))}
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {pool
              .filter((p) => !built.includes(p))
              .map((p) => (
                <button key={p} onClick={() => { setBuilt([...built, p]); setState('ask'); }} className="rounded-lg bg-sky-100 px-3 py-1.5 text-lg font-semibold text-sky-900">
                  {p}
                </button>
              ))}
          </div>
          {state !== 'right' && (
            <Btn disabled={built.length !== o.parts.length} onClick={() => (built.join('|') === o.parts.join('|') ? (right(), speak(o.parts.join(', '))) : wrong())}>
              🛵 Giao hàng!
            </Btn>
          )}
        </>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-3">
            <SpeakBtn text={ph.say} size="lg" slowToo />
            <Bi vi="📞 Nghe số điện thoại khách hàng và ghi lại" en="Listen and write the phone number" className="text-xl font-bold" />
          </div>
          {state !== 'right' &&
            (api.mode === 'easy' ? (
              <div className="max-w-xs">
                <div className="mb-2 rounded-xl bg-slate-100 px-4 py-3 text-center text-3xl font-bold tracking-widest tabular-nums">{digits || '…'}</div>
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((k) => (
                    <Btn
                      key={k}
                      variant={k === '✓' ? 'success' : 'secondary'}
                      className="py-3 text-2xl"
                      onClick={() => {
                        if (k === '⌫') setDigits(digits.slice(0, -1));
                        else if (k === '✓') digits === ph.digits ? right() : wrong();
                        else setDigits(digits + k);
                      }}
                    >
                      {k}
                    </Btn>
                  ))}
                </div>
              </div>
            ) : (
              <AnswerInput answers={[ph.digits]} placeholder="0903…" onResult={(r) => (r.status === 'correct' ? right() : setMissed(true))} />
            ))}
          {(state === 'right' || state === 'wrong') && <div className="mt-2 text-lg text-slate-600">{state === 'right' ? `✅ ${ph.digits}` : ''}</div>}
        </>
      )}
      {state === 'wrong' && !isPhone && <div className="mt-2 rounded-xl bg-amber-50 p-3 text-amber-900">💡 Tiếng Việt viết địa chỉ từ nhỏ đến lớn.</div>}
      {state === 'right' && (
        <Btn variant="success" className="mt-3" onClick={next}>
          {i + 1 >= total ? 'Xong 🏁' : 'Tiếp →'}
        </Btn>
      )}
    </Card>
  );
}

// ---------------- Bingo số ----------------
export function NumberBingo({ config }: GameProps) {
  const api = useGame();
  const n = config.grid ?? 5;
  const size = n * n;
  const card = useMemo(() => {
    const focus: number[] = config.focus ?? [];
    const others = shuffle(Array.from({ length: config.max - config.min + 1 }, (_, k) => k + config.min).filter((x) => !focus.includes(x)));
    return shuffle([...focus, ...others].slice(0, size));
  }, [config, size]);
  const calls = useMemo(() => shuffle([...card, ...sample(Array.from({ length: config.max - config.min + 1 }, (_, k) => k + config.min).filter((x) => !card.includes(x)), 8)]), [card, config]);
  const [ci, setCi] = useState(-1);
  const [marked, setMarked] = useState<number[]>([]);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);
  const current = calls[ci];
  const call = () => {
    const k = ci + 1;
    setCi(k);
    if (calls[k] !== undefined) speak(numberToWords(calls[k]));
  };
  const bingo = (m: number[]) => {
    const has = (r: number, c: number) => m.includes(card[r * n + c]);
    for (let r = 0; r < n; r++) if (Array.from({ length: n }, (_, c) => has(r, c)).every(Boolean)) return true;
    for (let c = 0; c < n; c++) if (Array.from({ length: n }, (_, r) => has(r, c)).every(Boolean)) return true;
    if (Array.from({ length: n }, (_, k) => has(k, k)).every(Boolean)) return true;
    if (Array.from({ length: n }, (_, k) => has(k, n - 1 - k)).every(Boolean)) return true;
    return false;
  };
  const click = (x: number) => {
    if (marked.includes(x)) return;
    if (x === current) {
      const m = [...marked, x];
      setMarked(m);
      sfx.correct();
      if (bingo(m)) setTimeout(() => api.finish(Math.max(0, m.length - wrongClicks), m.length), 600);
    } else {
      setWrongClicks((w) => w + 1);
      setFlash(x);
      setTimeout(() => setFlash(null), 500);
      sfx.wrong();
    }
  };
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {card.map((x) => (
          <button
            key={x}
            onClick={() => click(x)}
            className={`aspect-square rounded-xl text-2xl font-extrabold shadow-sm ring-1 transition sm:text-3xl ${marked.includes(x) ? 'bg-rose-500 text-white ring-rose-500' : flash === x ? 'animate-[shake_0.4s] bg-red-100' : 'bg-white ring-slate-200 hover:bg-amber-50'}`}
          >
            {x}
          </button>
        ))}
      </div>
      <Card className="flex flex-col items-center gap-3 text-center md:w-64">
        <div className="text-5xl">🎱</div>
        {ci < 0 ? (
          <Bi vi="Bấm “Gọi số” để bắt đầu" en="Press “Call” to start" />
        ) : current === undefined ? (
          <div>Hết số!</div>
        ) : (
          <>
            <SpeakBtn text={numberToWords(current)} size="lg" slowToo />
            {api.mode === 'easy' && <div className="text-2xl font-bold">{numberToWords(current)}</div>}
          </>
        )}
        <Btn onClick={call} className="w-full py-3 text-lg">
          📢 Gọi số
        </Btn>
        <div className="text-sm text-slate-500">
          Đã đánh dấu: {marked.length} · Bấm nhầm: {wrongClicks}
        </div>
        <div className="text-xs text-slate-400">Có số không nằm trên bảng – nghe kỹ nhé! Bingo = 5 ô thẳng hàng.</div>
      </Card>
    </div>
  );
}

// ---------------- Một ngày của nhân vật ----------------
export function DailyRoutine({ config }: GameProps) {
  const api = useGame();
  const acts: any[] = config.activities;
  const freq: string[] = config.frequencySlider;
  const sorted = useMemo(() => [...acts].sort((a, b) => toMin(a.time) - toMin(b.time)), [acts]);
  const pool = useMemo(() => shuffle(acts), [acts]);
  const [line, setLine] = useState<any[]>([]);
  const [errors, setErrors] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [part, setPart] = useState<1 | 2>(1);
  const freqRounds: Round[] = useMemo(() => {
    const days = [7, 5, 3, 1, 0];
    return sample(acts, Math.min(5, acts.length)).map((a, k) => {
      const d = days[k % days.length];
      const fw = freq[days.indexOf(d)] ?? freq[0];
      const sentence = d === 0 ? `Tôi không bao giờ ${a.action}.` : `Tôi ${fw} ${a.action} lúc ${a.time.replace(':', ' giờ ').replace(/ 00$/, '')}.`;
      return {
        scene: (
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl font-bold">{a.action}</div>
            <div className="flex gap-1">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((x, j) => (
                <div key={x} className={`flex h-14 w-11 flex-col items-center justify-center rounded-lg text-sm font-bold ${j < d ? 'bg-emerald-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {x}
                  <span>{j < d ? '✓' : '·'}</span>
                </div>
              ))}
            </div>
            <div className="text-slate-500">{d} / 7 ngày</div>
          </div>
        ),
        prompt: <Bi vi="Chọn từ chỉ tần suất" en="Choose the frequency word" />,
        options: freq,
        correctOption: freq.indexOf(fw),
        answers: [sentence, ...(d === 0 ? [] : [`Tôi ${fw} ${a.action}.`])],
        reply: sentence,
        replySay: sentence,
        placeholder: `Tôi … ${a.action} …`,
      } as Round;
    });
  }, [acts, freq]);
  const pick = (a: any) => {
    const expected = sorted[line.length];
    if (a === expected) {
      const nl = [...line, a];
      setLine(nl);
      sfx.correct();
      speak(`${a.time.replace(':', ' giờ ')}, ${a.action}`);
      if (nl.length === sorted.length) setTimeout(() => setPart(2), 1200);
    } else {
      setErrors((e) => e + 1);
      setFlash(a.action);
      setTimeout(() => setFlash(null), 500);
      sfx.wrong();
    }
  };
  if (part === 2) return <RoundPlayer rounds={freqRounds} />;
  return (
    <Card>
      <Bi vi="Phần 1: Sắp xếp lịch sinh hoạt trong ngày (sớm → muộn)" en="Part 1: Put the day's activities in time order" className="mb-3 text-xl font-bold" />
      <div className="mb-4 flex min-h-20 items-center gap-1 overflow-x-auto rounded-2xl bg-gradient-to-r from-sky-100 via-amber-100 to-indigo-200 p-3">
        {line.map((a) => (
          <div key={a.action} className="shrink-0 rounded-xl bg-white px-3 py-2 text-center shadow">
            <div className="text-sm font-bold text-rose-600">{a.time}</div>
            <div className="font-semibold">{a.action}</div>
          </div>
        ))}
        {line.length === 0 && <span className="text-slate-500">🌅 → 🌙</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {pool
          .filter((a) => !line.includes(a))
          .map((a) => (
            <button key={a.action} onClick={() => pick(a)} className={`rounded-xl px-4 py-2 text-lg font-semibold ring-1 ${flash === a.action ? 'animate-[shake_0.4s] bg-red-100 ring-red-300' : 'bg-white ring-slate-200 hover:bg-sky-50'}`}>
              {api.mode === 'easy' && <span className="mr-2 text-rose-600">{a.time}</span>}
              {a.action}
            </button>
          ))}
      </div>
      {api.mode === 'hard' && <p className="mt-2 text-sm text-slate-500">Chế độ khó: không hiện giờ – nhớ thói quen thông thường!</p>}
      <div className="mt-3 text-sm text-slate-500">Lỗi: {errors}</div>
    </Card>
  );
}
function toMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

// ---------------- Lên lịch du lịch ----------------
export function TripCalendar({ config }: GameProps) {
  const api = useGame();
  const days: string[] = config.days;
  const acts: string[] = config.activities;
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [held, setHeld] = useState<string | null>(null);
  const [phase, setPhase] = useState<'plan' | 'ask'>('plan');
  const place = (day: string) => {
    if (!held) return;
    setPlan({ ...plan, [held]: day });
    setHeld(null);
    sfx.click();
  };
  const dayOf = (a: string) => plan[a];
  const rounds: Round[] = useMemo(() => {
    if (phase !== 'ask') return [];
    const out: Round[] = [];
    for (const q of config.questions as string[]) {
      const act = acts.find((a) => q.includes(a.replace(/^đi /, '')) || q.includes(a));
      if (/bao lâu/.test(q)) {
        const go = acts.find((a) => a.startsWith('đi '));
        const back = acts.find((a) => a.startsWith('về '));
        if (!go || !back || !plan[go] || !plan[back]) continue;
        const n = (days.indexOf(plan[back]) - days.indexOf(plan[go]) + 7) % 7 || 7;
        const ans = `${capitalize(numberToWords(n))} ngày.`;
        out.push({
          scene: <CalendarView days={days} plan={plan} />,
          prompt: q,
          say: q,
          options: shuffle([...new Set([ans, ...[1, 2, 3, 4, 5].filter((x) => x !== n).slice(0, 3).map((x) => `${capitalize(numberToWords(x))} ngày.`)])]),
          correctOption: undefined,
          answers: [ans, `Tôi sẽ ở Đà Lạt ${numberToWords(n)} ngày.`, `${n} ngày`],
          reply: ans,
        });
      } else if (act && plan[act]) {
        const d = plan[act];
        const ans = `${capitalize(d)} tôi ${act}.`;
        out.push({
          scene: <CalendarView days={days} plan={plan} />,
          prompt: q,
          say: q,
          options: shuffle([d, ...shuffle(days.filter((x) => x !== d)).slice(0, 3)]).map((x) => `${capitalize(x)} tôi ${act}.`),
          correctOption: undefined,
          answers: [ans, `${capitalize(d)}.`, `Tôi ${act} ${d}.`, `${capitalize(d)} tôi sẽ ${act}.`],
          reply: ans,
          replySay: ans,
        });
      }
    }
    // rủ bạn bằng "nhé"
    const go = acts.find((a) => a.startsWith('đi ')) ?? acts[0];
    if (plan[go]) {
      const s = `${capitalize(plan[go])} mình ${go} nhé!`;
      out.push({
        scene: <CalendarView days={days} plan={plan} />,
        prompt: <Bi vi="Rủ bạn đi cùng (dùng “nhé”)" en="Invite a friend (use “nhé”)" />,
        options: shuffle([s, `${capitalize(plan[go])} mình ${go} à?`, `${capitalize(plan[go])} mình ${go} không?`]),
        correctOption: undefined,
        answers: [s, `${capitalize(plan[go])} chúng ta ${go} nhé!`],
        reply: `😊 ${s} – Ừ, được!`,
        replySay: s,
      });
    }
    out.forEach((r) => {
      if (r.options) r.correctOption = r.options.findIndex((o) => normalizeAnswer(o) === normalizeAnswer(r.answers[0]));
    });
    return out;
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  if (phase === 'ask') return rounds.length ? <RoundPlayer rounds={rounds} /> : <Card>Hãy xếp đủ hoạt động vào lịch.</Card>;
  const allPlaced = acts.every((a) => plan[a]);
  return (
    <Card>
      <Bi vi="Bấm một hoạt động rồi bấm vào ngày trong tuần" en="Tap an activity, then tap a day" className="mb-3 text-xl font-bold" />
      <div className="mb-4 flex flex-wrap gap-2">
        {acts.map((a) => (
          <button key={a} onClick={() => setHeld(a)} className={`rounded-xl px-3 py-2 text-lg font-semibold ring-1 ${held === a ? 'bg-sky-500 text-white ring-sky-500' : plan[a] ? 'bg-emerald-50 ring-emerald-300' : 'bg-white ring-slate-200'}`}>
            {a} {plan[a] ? `· ${plan[a]}` : ''}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((d) => (
          <button key={d} onClick={() => place(d)} className={`min-h-28 rounded-2xl p-2 text-left ring-1 transition ${held ? 'bg-amber-50 ring-amber-300 hover:bg-amber-100' : 'bg-slate-50 ring-slate-200'}`}>
            <div className="mb-1 font-bold capitalize">{d}</div>
            {acts
              .filter((a) => dayOf(a) === d)
              .map((a) => (
                <div key={a} className="mb-1 rounded-lg bg-white px-2 py-1 text-sm shadow-sm">
                  {a}
                </div>
              ))}
          </button>
        ))}
      </div>
      <Btn className="mt-4" disabled={!allPlaced} onClick={() => { setPhase('ask'); api.correct(); }}>
        <Bi vi="Xong lịch – trả lời câu hỏi →" en="Done – answer questions" inline />
      </Btn>
    </Card>
  );
}
function CalendarView({ days, plan }: { days: string[]; plan: Record<string, string> }) {
  return (
    <div className="grid grid-cols-4 gap-1 text-sm sm:grid-cols-7">
      {days.map((d) => (
        <div key={d} className="rounded-lg bg-slate-50 p-1.5">
          <div className="font-bold capitalize">{d}</div>
          {Object.entries(plan)
            .filter(([, v]) => v === d)
            .map(([a]) => (
              <div key={a} className="rounded bg-white px-1">
                {a}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

// ---------------- Thanh thời gian (bao lâu) ----------------
export function DurationBar({ config }: GameProps) {
  const api = useGame();
  const rounds: any[] = config.rounds;
  const UNITS = ['ngày', 'tuần', 'tháng', 'năm'];
  const [i, setI] = useState(0);
  const [val, setVal] = useState(1);
  const [unit, setUnit] = useState('ngày');
  const [state, setState] = useState<'ask' | 'right' | 'wrong'>('ask');
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const r = rounds[i];
  useEffect(() => {
    setVal(1);
    setUnit('ngày');
    setState('ask');
    setMissed(false);
    setTimeout(() => speak(r.sentence), 300);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const ok = () => {
    setState('right');
    if (!missed) setScore((s) => s + 1);
    api.correct();
  };
  const next = () => (i + 1 >= rounds.length ? api.finish(score, rounds.length) : setI(i + 1));
  return (
    <Card>
      <div className="mb-2 flex justify-between text-sm font-bold text-slate-400">
        <span>
          {i + 1}/{rounds.length}
        </span>
        <span className="text-emerald-600">⭐ {score}</span>
      </div>
      <div className="mb-4 flex items-center justify-center gap-3 text-3xl font-bold">
        <SpeakBtn text={r.sentence} slowToo />
        {api.mode === 'easy' || state === 'right' ? r.sentence : <Bi vi="Nghe câu" en="Listen" />}
      </div>
      <div className="mb-3 text-center text-xl">
        <Bi vi="… bao lâu?" en="How long?" />
      </div>
      {api.mode === 'easy' ? (
        <>
          <div className="mb-3 flex h-16 items-end gap-1 overflow-x-auto rounded-xl bg-slate-50 p-2">
            {Array.from({ length: val }, (_, k) => (
              <div key={k} className="flex h-full w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-t from-indigo-500 to-sky-400 text-xs font-bold text-white">
                {k + 1}
              </div>
            ))}
          </div>
          <input type="range" min={1} max={12} value={val} onChange={(e) => { setVal(+e.target.value); setState('ask'); }} className="w-full accent-indigo-600" />
          <div className="my-3 flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold">{val}</span>
            {UNITS.map((u) => (
              <button key={u} onClick={() => { setUnit(u); setState('ask'); }} className={`rounded-full px-4 py-2 text-lg font-bold ${unit === u ? 'bg-indigo-600 text-white' : 'bg-white ring-1 ring-slate-200'}`}>
                {u}
              </button>
            ))}
          </div>
          {state !== 'right' && (
            <Btn
              onClick={() => {
                if (val === r.value && unit === r.unit) ok();
                else {
                  setState('wrong');
                  setMissed(true);
                  api.wrong();
                }
              }}
            >
              Kiểm tra
            </Btn>
          )}
        </>
      ) : (
        state !== 'right' && (
          <AnswerInput
            answers={[`${r.value} ${r.unit}`, `${numberToWords(r.value)} ${r.unit}`]}
            resetKey={i}
            placeholder="Ví dụ: ba ngày"
            onResult={(res) => (res.status === 'correct' ? ok() : setMissed(true))}
          />
        )
      )}
      {state === 'wrong' && <div className="mt-2 text-amber-700">💡 Nghe lại con số và đơn vị thời gian.</div>}
      {state === 'right' && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <div className="text-2xl font-bold text-emerald-600">
            ✅ {numberToWords(r.value)} {r.unit}
          </div>
          <Btn variant="success" onClick={next}>
            {i + 1 >= rounds.length ? 'Xong 🏁' : 'Tiếp →'}
          </Btn>
        </div>
      )}
    </Card>
  );
}

// ---------------- Bán vé ----------------
export function TicketBooking({ config }: GameProps) {
  const api = useGame();
  const customers: any[] = config.customers;
  const FIELDS = ['day', 'trip', 'type', 'seat'] as const;
  const choices: Record<string, string[]> = {
    day: [...new Set([...customers.map((c) => c.answer.day), 'thứ sáu', 'chủ nhật', 'ngày 21'])],
    trip: ['chuyến sáng', 'chuyến trưa', 'chuyến tối'],
    type: ['một chiều', 'khứ hồi'],
    seat: ['vé ngồi', 'vé nằm'],
  };
  const [i, setI] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [state, setState] = useState<'ask' | 'right' | 'wrong'>('ask');
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const c = customers[i];
  useEffect(() => {
    setForm({});
    setState('ask');
    setMissed(false);
    setTimeout(() => speak(c.request), 300);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const check = () => {
    const wrong = FIELDS.filter((f) => form[f] !== c.answer[f]);
    if (!wrong.length) {
      setState('right');
      if (!missed) setScore((s) => s + 1);
      api.correct();
    } else {
      setState('wrong');
      setMissed(true);
      api.wrong();
    }
  };
  const next = () => (i + 1 >= customers.length ? api.finish(score, customers.length) : setI(i + 1));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <div className="mb-3 flex items-start gap-3">
          <span className="text-5xl">🧳</span>
          <div className="flex-1 text-xl font-semibold">{api.mode === 'easy' || state === 'right' ? `“${c.request}”` : <Bi vi="🔊 Nghe yêu cầu của khách" en="Listen to the customer" />}</div>
          <SpeakBtn text={c.request} slowToo />
        </div>
        <div className="flex flex-col gap-3">
          {FIELDS.map((f, k) => (
            <div key={f}>
              <div className="mb-1 flex items-center gap-2 text-slate-600">
                🧑‍💼 <i>{config.clerkQuestions[k]}</i> <SpeakBtn text={config.clerkQuestions[k]} size="sm" />
              </div>
              <div className="flex flex-wrap gap-2">
                {choices[f].map((v) => (
                  <button
                    key={v}
                    onClick={() => { setForm({ ...form, [f]: v }); setState('ask'); }}
                    className={`rounded-full px-4 py-1.5 font-semibold ${form[f] === v ? (state === 'wrong' && v !== c.answer[f] ? 'bg-red-200' : 'bg-indigo-600 text-white') : 'bg-white ring-1 ring-slate-200'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {state !== 'right' && (
          <Btn className="mt-4" disabled={FIELDS.some((f) => !form[f])} onClick={check}>
            🖨️ In vé
          </Btn>
        )}
      </Card>
      <Card className="flex flex-col items-center justify-center gap-3">
        <div className={`w-full max-w-sm rounded-2xl border-2 border-dashed p-5 font-mono transition ${state === 'right' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50'}`}>
          <div className="mb-2 text-center text-lg font-bold">🚆 VÉ TÀU · TRAIN TICKET</div>
          {FIELDS.map((f) => (
            <div key={f} className="flex justify-between border-b border-slate-200 py-1">
              <span className="text-slate-500">{{ day: 'Ngày', trip: 'Chuyến', type: 'Loại', seat: 'Chỗ' }[f]}</span>
              <span className="font-bold">{form[f] ?? '—'}</span>
            </div>
          ))}
        </div>
        {state === 'wrong' && <div className="text-amber-700">💡 Nghe lại khách nói: ngày nào, chuyến nào?</div>}
        {state === 'right' && (
          <Btn variant="success" onClick={next}>
            {i + 1 >= customers.length ? 'Xong 🏁' : 'Khách tiếp →'}
          </Btn>
        )}
      </Card>
    </div>
  );
}

// ---------------- Cây gia đình ----------------
export function FamilyTree({ config }: GameProps) {
  const members: any[] = config.members;
  const me = config.me;
  const [qs, setQs] = useState(false);
  const rounds: Round[] = useMemo(
    () =>
      shuffle(members).map((mb) => {
        const main = mb.relation.split('/')[0].trim();
        const all = mb.relation.split('/').map((x: string) => x.trim());
        return {
          scene: <TreeView members={members} me={me} highlight={mb.relation} />,
          prompt: `Người này là ai của ${me}?`,
          options: shuffle(members.map((x) => x.relation.split('/')[0].trim())),
          correctOption: undefined,
          answers: [...all.map((r: string) => `Đây là ${r} của ${me}.`), ...all],
          reply: `${mb.emoji} Đây là ${main} của ${me}.`,
          replySay: `Đây là ${main} của ${me}.`,
        } as Round;
      }),
    [members, me],
  );
  rounds.forEach((r) => {
    if (r.options) r.correctOption = r.options.findIndex((o) => r.answers.includes(o));
  });
  if (qs)
    return (
      <Card>
        <Bi vi="💬 Nói chuyện theo cặp: hỏi và trả lời về gia đình bạn" en="Pair talk: ask and answer about your family" className="mb-3 text-xl font-bold" />
        <ul className="space-y-3">
          {(config.questions as string[]).map((q) => (
            <li key={q} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-2xl font-semibold">
              <SpeakBtn text={q} size="sm" /> {q}
            </li>
          ))}
        </ul>
      </Card>
    );
  return (
    <div>
      <RoundPlayer rounds={rounds} />
      <Btn variant="ghost" className="mt-2" onClick={() => setQs(true)}>
        💬 Câu hỏi nói theo cặp →
      </Btn>
    </div>
  );
}
function TreeView({ members, me, highlight }: { members: any[]; me: string; highlight: string }) {
  const rowOf = (r: string) => (/^(ông|bà)/.test(r) ? 0 : /^(bố|mẹ|ba|má)/.test(r) ? 1 : 2);
  const rows: any[][] = [[], [], []];
  members.forEach((m) => rows[rowOf(m.relation)].push(m));
  rows[2].splice(Math.ceil(rows[2].length / 2), 0, { relation: '__me', emoji: '🙋' });
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-gradient-to-b from-emerald-50 to-white p-4">
      {rows.map((row, k) => (
        <div key={k} className="flex gap-3">
          {row.map((m) => (
            <div key={m.relation} className={`flex w-20 flex-col items-center rounded-2xl p-2 ${m.relation === highlight ? 'bg-amber-200 ring-4 ring-amber-400' : 'bg-white shadow-sm'}`}>
              <span className="text-4xl">{m.emoji}</span>
              <span className="text-xs font-bold">{m.relation === '__me' ? me : m.relation === highlight ? '?' : ''}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------- Nhà hàng ----------------
export function RestaurantOrder({ config }: GameProps) {
  const api = useGame();
  const menu: any[] = config.menu;
  const customers: any[] = config.customers;
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<string[]>([]);
  const [phase, setPhase] = useState<'order' | 'bill' | 'done'>('order');
  const [msg, setMsg] = useState('');
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const c = customers[i];
  useEffect(() => {
    setSel([]);
    setPhase('order');
    setMissed(false);
    setMsg(config.waiterLines?.[0] ?? '');
    setTimeout(() => speak(c.line), 300);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = sel.reduce((s, n) => s + (menu.find((m) => m.name === n)?.price ?? 0), 0);
  const checkOrder = () => {
    let ok = sel.length > 0;
    let why = '';
    if (c.reject) {
      const bad = sel.filter((s) => c.reject.includes(s));
      if (bad.length) {
        ok = false;
        why = `Tôi không ăn/uống ${bad.join(', ')}!`;
      }
    }
    if (c.order) {
      const same = sel.length === c.order.length && c.order.every((o: string) => sel.includes(o));
      if (!same) {
        ok = false;
        why = `Tôi chỉ gọi ${c.order.join(', ')} thôi!`;
      }
    }
    if (ok) {
      setPhase('bill');
      setMsg('Tính tiền giúp tôi.');
      speak('Tính tiền giúp tôi.');
      sfx.correct();
    } else {
      setMissed(true);
      api.wrong();
      setMsg(why || 'Anh chọn món đi!');
      speak(why || 'Anh chọn món đi!');
    }
  };
  const bill = (v: number) => {
    if (v === total) {
      if (!missed) setScore((s) => s + 1);
      const s = `Dạ, của anh ${numberToWords(total)} đồng.`;
      speak(s);
      setMsg('Cảm ơn! Ngon quá! 😋');
      setPhase('done');
      api.correct();
    } else {
      setMissed(true);
      api.wrong();
      setMsg('Hả? Tính lại đi!');
    }
  };
  const billOptions = useMemo(() => (phase === 'bill' ? shuffle([total, total + 5000, Math.max(5000, total - 10000), total + 20000]) : []), [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = () => (i + 1 >= customers.length ? api.finish(score, customers.length) : setI(i + 1));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <div className="mb-3 flex items-start gap-3">
          <span className="text-5xl">{(c.name.match(/\p{Extended_Pictographic}/u) ?? ['🙂'])[0]}</span>
          <div>
            <div className="font-bold text-slate-500">{c.name.replace(/\p{Extended_Pictographic}/gu, '')}</div>
            <div className="text-xl font-semibold">“{c.line}”</div>
          </div>
          <SpeakBtn text={c.line} size="sm" />
        </div>
        {msg && <div className="mb-3 rounded-xl bg-amber-50 px-4 py-2 text-lg">🧑‍🍳 / 🙂: “{msg}”</div>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {menu.map((m) => (
            <button
              key={m.name}
              disabled={phase !== 'order'}
              onClick={() => setSel(sel.includes(m.name) ? sel.filter((x) => x !== m.name) : [...sel, m.name])}
              className={`rounded-2xl p-2 text-center ring-1 transition ${sel.includes(m.name) ? 'bg-rose-500 text-white ring-rose-500' : 'bg-white ring-slate-200 hover:bg-rose-50'}`}
            >
              <div className="text-3xl">{m.emoji}</div>
              <div className="font-semibold">{m.name}</div>
              <div className="text-xs opacity-80">
                {formatVND(m.price)}/{m.unit}
              </div>
            </button>
          ))}
        </div>
        {phase === 'order' && (
          <Btn className="mt-3" onClick={checkOrder}>
            🍽️ Mang món ra
          </Btn>
        )}
      </Card>
      <Card className="flex flex-col gap-3">
        <div className="rounded-2xl bg-slate-50 p-4 font-mono">
          <div className="mb-2 text-center font-bold">HOÁ ĐƠN</div>
          {sel.map((s) => (
            <div key={s} className="flex justify-between">
              <span>{s}</span>
              <span>{formatVND(menu.find((m) => m.name === s)!.price)}</span>
            </div>
          ))}
          <div className="mt-2 border-t pt-2 text-right font-bold">{phase === 'order' ? '' : phase === 'bill' ? 'Tổng: ?' : `Tổng: ${formatVND(total)}`}</div>
        </div>
        {phase === 'bill' &&
          (api.mode === 'easy' ? (
            <div className="grid grid-cols-2 gap-2">
              {billOptions.map((v) => (
                <Btn key={v} variant="secondary" onClick={() => bill(v)}>
                  Dạ, của anh {formatVND(v)}
                </Btn>
              ))}
            </div>
          ) : (
            <>
              <Bi vi="Gõ tổng tiền (bằng số)" en="Type the total (digits)" />
              <BillInput onSubmit={bill} />
            </>
          ))}
        {phase === 'done' && (
          <Btn variant="success" onClick={next}>
            {i + 1 >= customers.length ? 'Xong 🏁' : 'Khách tiếp →'}
          </Btn>
        )}
        <div className="text-sm text-slate-500">
          {(config.waiterLines as string[]).map((w) => (
            <div key={w}>🧑‍🍳 {w}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}
function BillInput({ onSubmit }: { onSubmit: (v: number) => void }) {
  const [v, setV] = useState('');
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(Number(v.replace(/\D/g, '')));
      }}
    >
      <input value={v} onChange={(e) => setV(e.target.value)} inputMode="numeric" className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-xl" placeholder="75.000" />
      <Btn type="submit">↵</Btn>
    </form>
  );
}

