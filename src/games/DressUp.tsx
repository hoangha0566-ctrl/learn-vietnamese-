// Game "Mặc đồ cho nhân vật" + vòng quay thời tiết "Nếu … thì …".
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useGame, type GameProps } from './GameHost';
import { Bi, Btn, Card, ProgressBar, SpeakBtn } from '../components/ui';
import { AnswerInput } from '../components/AnswerInput';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { normalizeAnswer, shuffle, stripAll } from '../lib/vietnamese';

type Slot = 'head' | 'eyes' | 'neck' | 'body' | 'hands' | 'hand' | 'legs' | 'feet';
const ALL_VERBS = ['mặc', 'đội', 'đeo', 'quàng', 'đi', 'cầm', 'mang'];

function slotOf(item: any): Slot {
  if (item.slot) return item.slot;
  const n: string = item.name;
  if (/kính/.test(n)) return 'eyes';
  if (/găng/.test(n)) return 'hands';
  if (/khăn/.test(n)) return 'neck';
  if (/quần/.test(n)) return 'legs';
  if (item.verb === 'đội') return 'head';
  if (item.verb === 'cầm') return 'hand';
  if (item.verb === 'đi') return 'feet';
  return 'body';
}
const SLOT_POS: Record<Slot, { top: string; left: string; size: string }> = {
  head: { top: '2%', left: '50%', size: '3.4rem' },
  eyes: { top: '16%', left: '50%', size: '2.2rem' },
  neck: { top: '29%', left: '50%', size: '2.8rem' },
  body: { top: '42%', left: '50%', size: '4.2rem' },
  hands: { top: '50%', left: '22%', size: '2.4rem' },
  hand: { top: '34%', left: '82%', size: '3.6rem' },
  legs: { top: '64%', left: '50%', size: '3.2rem' },
  feet: { top: '86%', left: '50%', size: '2.6rem' },
};
const BG: Record<string, string> = {
  lanh: 'from-sky-200 via-sky-100 to-white',
  mua: 'from-slate-400 via-slate-300 to-slate-200',
  nong: 'from-amber-200 via-yellow-100 to-sky-100',
};

const accepted = (item: any): string[] => [item.verb, ...(item.alsoAccept ?? [])];
const itemName = (item: any) => item.name.replace(/\s*\(.*\)\s*/, '');

/** Tìm món đồ + động từ trong câu gõ tay */
function parseSentence(text: string, items: any[]): { item: any | null; verb: string | null } {
  const t = ' ' + normalizeAnswer(text) + ' ';
  const tl = stripAll(t);
  let found: any = null;
  let idx = -1;
  for (const it of items) {
    const names = [itemName(it), ...(it.name.match(/\((.*)\)/)?.[1].split(/[,/]/).map((x: string) => x.trim()) ?? [])];
    for (const n of names) {
      const k = t.indexOf(' ' + normalizeAnswer(n) + ' ');
      if (k >= 0 && (!found || normalizeAnswer(n).length > normalizeAnswer(itemName(found)).length)) {
        found = it;
        idx = k;
      }
    }
  }
  if (!found) {
    // thử không dấu → báo gần đúng
    for (const it of items) if (tl.includes(' ' + stripAll(normalizeAnswer(itemName(it))) + ' ')) return { item: { ...it, _noTone: true }, verb: null };
    return { item: null, verb: null };
  }
  const before = t.slice(0, idx).trim().split(' ');
  const verb = [...before].reverse().find((w) => ALL_VERBS.includes(w)) ?? null;
  return { item: found, verb };
}

export function DressUp(props: GameProps) {
  if (!props.config?.scenes?.length || !props.config?.items?.length) return <Card>Chưa có dữ liệu game.</Card>;
  return <DressUpInner {...props} />;
}

function DressUpInner({ config }: GameProps) {
  const api = useGame();
  const items: any[] = config.items;
  const scenes: any[] = config.scenes;
  const order = useMemo(() => shuffle(scenes.map((_, i) => i)), [scenes]);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<'spin' | 'dress' | 'if' | 'done'>('spin');
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [worn, setWorn] = useState<string[]>([]);
  const [held, setHeld] = useState<any | null>(null);
  const [verbChoices, setVerbChoices] = useState<string[]>([]);
  const [say, setSay] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [bounce, setBounce] = useState<string | null>(null);
  const scene = scenes[order[round]];

  useEffect(() => {
    if (phase === 'dress' && scene) {
      setSay(scene.complaint);
      speak(scene.complaint);
    }
  }, [phase, round]); // eslint-disable-line react-hooks/exhaustive-deps

  const needs: string[] = scene.needs;
  const comfort = needs.filter((n) => worn.includes(n)).length / needs.length;
  const done = comfort >= 1;
  const face = done ? '😄' : scene.id === 'lanh' ? '🥶' : scene.id === 'nong' ? '🥵' : scene.id === 'mua' ? '😣' : '🙁';

  const spin = () => {
    setSpinning(true);
    const segment = 360 / scenes.length;
    const target = order[round];
    // bánh xe quay vài vòng rồi dừng ở ô của cảnh hiện tại (kim ở trên cùng)
    const final = angle + 360 * 4 + (360 - (target * segment + segment / 2) - (angle % 360));
    setAngle(final);
    sfx.click();
    setTimeout(() => {
      setSpinning(false);
      speak(scene.weather);
      setTimeout(() => setPhase('dress'), 900);
    }, 2600);
  };

  const offer = (item: any) => {
    if (phase !== 'dress' || worn.includes(item.id)) return;
    if (!needs.includes(item.id)) {
      setBounce(item.id);
      setTimeout(() => setBounce(null), 600);
      setSay(scene.wrongReaction);
      speak(scene.wrongReaction);
      sfx.wrong();
      return;
    }
    if (api.mode === 'easy') {
      setHeld(item);
      const others = shuffle(ALL_VERBS.filter((v) => !accepted(item).includes(v))).slice(0, 3);
      setVerbChoices(shuffle([item.verb, ...others]));
      setHint(null);
    }
  };

  const wear = (item: any, firstTry: boolean, sentence: string) => {
    setWorn((w) => [...w, item.id]);
    setTotal((t) => t + 1);
    if (firstTry) setScore((s) => s + 1);
    setHeld(null);
    setHint(null);
    api.correct();
    speak(sentence);
    const remaining = needs.filter((n) => n !== item.id && !worn.includes(n));
    setSay(remaining.length ? 'Ấm hơn rồi! Còn gì nữa?' : 'Dễ chịu quá! Cảm ơn bạn! 😄');
  };

  const [missedItem, setMissedItem] = useState<string | null>(null);
  const chooseVerb = (v: string) => {
    if (!held) return;
    if (accepted(held).includes(v)) wear(held, missedItem !== held.id, `${v} ${itemName(held)}`);
    else {
      setMissedItem(held.id);
      api.wrong();
      setHint(`Với “${itemName(held)}”, ta dùng “${held.verb}”: ${held.verb} ${itemName(held)}.`);
    }
  };

  const typeSentence = (text: string): boolean => {
    const { item, verb } = parseSentence(text, items);
    if (!item) {
      setHint('Mình chưa thấy tên món đồ trong câu. Ví dụ: “Anh ấy mặc áo khoác.”');
      sfx.wrong();
      return false;
    }
    if (item._noTone) {
      setHint(`Gần đúng! Kiểm tra lại dấu: “${itemName(item)}”.`);
      sfx.almost();
      return false;
    }
    if (!needs.includes(item.id)) {
      setSay(scene.wrongReaction);
      speak(scene.wrongReaction);
      sfx.wrong();
      return false;
    }
    if (worn.includes(item.id)) {
      setHint('Món này đã mặc rồi!');
      return false;
    }
    if (!verb || !accepted(item).includes(verb)) {
      setMissedItem(item.id);
      api.wrong();
      setHint(`Với “${itemName(item)}”, ta dùng “${item.verb}”.`);
      return false;
    }
    wear(item, missedItem !== item.id, text);
    return true;
  };

  // "Nếu … thì …"
  const ifSentence: string = scene['nếuThì'] ?? '';
  const ifMatch = ifSentence.match(/^(.*thì tôi )(\S+)(.*)$/);
  const ifItem = ifMatch ? items.find((it) => ifMatch[3].includes(itemName(it))) : null;
  const ifOk = ifMatch ? [ifMatch[2], ...(ifItem ? accepted(ifItem) : [])] : [];
  const ifOptions = useMemo(() => (ifMatch ? shuffle([ifMatch[2], ...shuffle(ALL_VERBS.filter((v) => !ifOk.includes(v))).slice(0, 3)]) : []), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [ifMiss, setIfMiss] = useState(false);
  const [ifPicked, setIfPicked] = useState<string | null>(null);
  const ifRight = (first: boolean) => {
    setTotal((t) => t + 1);
    if (first) setScore((s) => s + 1);
    api.correct();
    speak(ifSentence);
    setPhase('done');
  };
  const nextScene = () => {
    if (round + 1 >= scenes.length) api.finish(score, total);
    else {
      setRound(round + 1);
      setWorn([]);
      setPhase('spin');
      setIfMiss(false);
      setIfPicked(null);
      setMissedItem(null);
      setSay('');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className={`relative min-h-[26rem] overflow-hidden rounded-3xl bg-gradient-to-b ${BG[scene.id] ?? 'from-indigo-100 to-white'} p-4`}>
        <WeatherFx kind={scene.id} />
        <div className="relative z-10 flex items-center justify-between">
          <div className="rounded-xl bg-white/80 px-3 py-1 text-lg font-bold">
            {scene.emoji} {scene.weather}
            <div className="text-sm font-normal text-slate-600">{scene.place}</div>
          </div>
          <div className="text-sm font-bold text-emerald-700">⭐ {score}</div>
        </div>
        {phase === 'spin' ? (
          <div className="relative z-10 mt-4 flex flex-col items-center gap-4">
            <Bi vi="🎡 Vòng quay thời tiết" en="Weather wheel" className="text-2xl font-bold" />
            <div className="relative">
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-3xl">🔻</div>
              <div
                className="relative h-56 w-56 rounded-full shadow-lg ring-8 ring-white"
                style={{
                  transform: `rotate(${angle}deg)`,
                  transition: spinning ? 'transform 2.5s cubic-bezier(.17,.67,.2,1)' : 'none',
                  background: `conic-gradient(${scenes.map((_, i) => `${['#93c5fd', '#94a3b8', '#fcd34d', '#f9a8d4', '#86efac'][i % 5]} ${(i * 100) / scenes.length}% ${((i + 1) * 100) / scenes.length}%`).join(',')})`,
                }}
              >
                {scenes.map((s, i) => {
                  const a = (i + 0.5) * (360 / scenes.length);
                  return (
                    <span key={s.id} className="absolute left-1/2 top-1/2 text-4xl" style={{ transform: `translate(-50%,-50%) rotate(${a}deg) translateY(-70px) rotate(${-a}deg)` }}>
                      {s.emoji}
                    </span>
                  );
                })}
              </div>
            </div>
            <Btn onClick={spin} disabled={spinning} className="px-8 py-3 text-xl">
              {spinning ? '…' : 'Quay! 🎡'}
            </Btn>
          </div>
        ) : (
          <div className="relative z-10 mt-2 flex flex-col items-center">
            {say && <div className="mb-2 max-w-xs rounded-2xl bg-white px-4 py-2 text-center text-lg font-semibold shadow">“{say}”</div>}
            <div
              className={`relative mt-4 h-72 w-48 ${done ? 'animate-[jump_0.6s_2]' : scene.id === 'lanh' ? 'animate-[shiver_0.15s_linear_infinite]' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('text/plain');
                const it = items.find((x) => x.id === id);
                if (it) offer(it);
              }}
            >
              {/* thân nhân vật */}
              <svg viewBox="0 0 120 200" className="absolute inset-0 h-full w-full">
                <circle cx="60" cy="34" r="24" fill="#fcd9b6" />
                <rect x="38" y="62" width="44" height="70" rx="16" fill="#f8fafc" stroke="#cbd5e1" />
                <rect x="20" y="66" width="14" height="56" rx="7" fill="#fcd9b6" />
                <rect x="86" y="66" width="14" height="56" rx="7" fill="#fcd9b6" />
                <rect x="42" y="128" width="15" height="58" rx="7" fill="#64748b" />
                <rect x="63" y="128" width="15" height="58" rx="7" fill="#64748b" />
              </svg>
              <span className="absolute left-1/2 top-[8%] -translate-x-1/2 text-5xl">{face}</span>
              {worn.map((id) => {
                const it = items.find((x) => x.id === id);
                const p = SLOT_POS[slotOf(it)];
                return (
                  <span key={id} className="absolute -translate-x-1/2 animate-[pop_0.4s]" style={{ top: p.top, left: p.left, fontSize: p.size }}>
                    {it.emoji}
                  </span>
                );
              })}
            </div>
            <div className="mt-2 w-full max-w-xs">
              <div className="mb-1 flex justify-between text-sm font-bold">
                <span>{scene.id === 'nong' ? '😎 Thoải mái' : '🌡️ Ấm áp / thoải mái'}</span>
                <span>{Math.round(comfort * 100)}%</span>
              </div>
              <ProgressBar value={comfort * 100} color={done ? 'bg-emerald-500' : 'bg-orange-400'} className="!h-4" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {phase === 'dress' && (
          <>
            <Card className="!p-4">
              <Bi vi="👚 Tủ quần áo – kéo (hoặc bấm) món đồ vào nhân vật" en="Wardrobe – drag (or tap) an item onto the character" className="mb-2 font-bold" />
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {items.map((it) => (
                  <button
                    key={it.id}
                    draggable={!worn.includes(it.id)}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', it.id)}
                    disabled={worn.includes(it.id)}
                    onClick={() => (api.mode === 'easy' ? offer(it) : speak(itemName(it)))}
                    className={`flex flex-col items-center rounded-xl p-2 ring-1 transition ${worn.includes(it.id) ? 'opacity-30' : held?.id === it.id ? 'bg-sky-100 ring-sky-400' : 'bg-white ring-slate-200 hover:bg-amber-50'} ${bounce === it.id ? 'animate-[shake_0.4s]' : ''}`}
                  >
                    <span className="text-3xl">{it.emoji}</span>
                    <span className="text-xs font-semibold">{itemName(it)}</span>
                  </button>
                ))}
              </div>
            </Card>
            {api.mode === 'easy' && held && (
              <Card className="!p-4">
                <div className="mb-2 text-xl font-bold">
                  ___ {itemName(held)} {held.emoji}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {verbChoices.map((v) => (
                    <Btn key={v} variant="secondary" className="py-3 text-xl" onClick={() => chooseVerb(v)}>
                      {v}
                    </Btn>
                  ))}
                </div>
              </Card>
            )}
            {api.mode === 'hard' && !done && (
              <Card className="!p-4">
                <Bi vi="Gõ câu, ví dụ: “Anh ấy mặc áo khoác.” / “Đội mũ len vào đi!”" en="Type a sentence with the right verb" className="mb-2 text-slate-600" />
                <SentenceBox onSubmit={typeSentence} />
              </Card>
            )}
            {hint && <div className="rounded-xl bg-amber-50 p-3 text-lg text-amber-900">💡 {hint}</div>}
            {done && (
              <Btn variant="success" className="py-3 text-lg" onClick={() => setPhase('if')}>
                <Bi vi="Tiếp: Nếu … thì … →" en="Next: If … then …" inline />
              </Btn>
            )}
          </>
        )}
        {phase === 'if' && ifMatch && (
          <Card className="!p-4">
            <Bi vi="Hoàn thành câu “Nếu … thì …”" en="Complete the “if … then …” sentence" className="mb-3 font-bold" />
            {api.mode === 'easy' ? (
              <>
                <div className="mb-3 text-2xl font-bold">
                  {ifMatch[1]}
                  <span className="mx-1 inline-block min-w-16 border-b-4 border-slate-300 text-center text-sky-600">{ifPicked ?? ' '}</span>
                  {ifMatch[3]}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ifOptions.map((v) => (
                    <Btn
                      key={v}
                      variant="secondary"
                      className="py-3 text-xl"
                      onClick={() => {
                        setIfPicked(v);
                        if (ifOk.includes(v)) ifRight(!ifMiss);
                        else {
                          setIfMiss(true);
                          api.wrong();
                        }
                      }}
                    >
                      {v}
                    </Btn>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 text-xl">
                  Nếu {scene.weather.toLowerCase()} thì tôi … <SpeakBtn text={`Nếu ${scene.weather.toLowerCase()} thì tôi…`} size="sm" />
                </div>
                <AnswerInput
                  answers={[ifSentence, ...ifOk.map((v) => `${ifMatch[1]}${v}${ifMatch[3]}`)]}
                  placeholder={`Nếu ${scene.weather.toLowerCase()} thì tôi …`}
                  onResult={(r) => {
                    if (r.status === 'correct') ifRight(!ifMiss);
                    else setIfMiss(true);
                  }}
                />
              </>
            )}
          </Card>
        )}
        {phase === 'done' && (
          <Card className="!p-4 text-center">
            <div className="mb-3 text-2xl font-bold text-emerald-700">✅ {ifSentence}</div>
            <Btn variant="success" onClick={nextScene} className="px-8">
              {round + 1 >= scenes.length ? 'Xong 🏁' : 'Thời tiết khác →'}
            </Btn>
          </Card>
        )}
        <Card className="!p-4 text-sm text-slate-600">
          <b>mặc</b> áo, quần · <b>đội</b> mũ, nón · <b>đeo</b> kính, găng tay · <b>quàng</b> khăn · <b>đi / mang</b> giày, dép, ủng · <b>cầm</b> ô
        </Card>
      </div>
    </div>
  );
}

function SentenceBox({ onSubmit }: { onSubmit: (t: string) => boolean }) {
  const [v, setV] = useState('');
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim() && onSubmit(v)) setV('');
      }}
    >
      <input value={v} onChange={(e) => setV(e.target.value)} lang="vi" className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-xl outline-none focus:border-sky-400" placeholder="Anh ấy mặc áo khoác." />
      <Btn type="submit">↵</Btn>
    </form>
  );
}

function WeatherFx({ kind }: { kind: string }) {
  if (kind === 'nong') return <div className="pointer-events-none absolute right-4 top-16 animate-[spin_12s_linear_infinite] text-6xl">☀️</div>;
  const ch = kind === 'lanh' ? '❄' : kind === 'mua' ? '💧' : '';
  if (!ch) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className="absolute animate-[fall_3s_linear_infinite] text-xl opacity-70"
          style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.5}s`, animationDuration: kind === 'mua' ? '1.2s' : '4s' }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}
