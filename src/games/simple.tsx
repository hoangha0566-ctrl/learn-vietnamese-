// Các game dạng "nhiều lượt": mỗi lượt có bối cảnh + câu hỏi → chọn (dễ) hoặc gõ (khó).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import { RoundPlayer, type GameProps, type Round } from './GameHost';
import { Bi, ProgressBar } from '../components/ui';
import { capitalize, fill, sample, shuffle } from '../lib/vietnamese';

const stripEmoji = (s: string) => s.replace(/[\p{Extended_Pictographic}‍️]/gu, '').trim();
const emojiOf = (s: string) => (s.match(/[\p{Extended_Pictographic}][‍️\p{Extended_Pictographic}]*/u) ?? [''])[0];

function opts(correct: string[], wrong: string[], n = 4): { options: string[]; correctOption: number[] } {
  const w = sample(
    wrong.filter((x) => !correct.includes(x)),
    Math.max(0, n - correct.length),
  );
  const options = shuffle([...new Set([...correct, ...w])]);
  return { options, correctOption: correct.map((c) => options.indexOf(c)).filter((k) => k >= 0) };
}

const Scene = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex min-h-48 flex-col items-center justify-center gap-3 rounded-3xl p-6 text-center ${className}`}>{children}</div>
);

// ---------------- Bài 1: Bữa tiệc làm quen ----------------
export function NameParty({ config }: GameProps) {
  const PRON = ['ông', 'bà', 'anh', 'chị', 'cô', 'thầy', 'em'];
  const [tags, setTags] = useState<string[]>([]);
  const guests = useMemo(() => shuffle(config.guests as any[]), [config]);
  const rounds: Round[] = guests.flatMap((g) => {
    const p = g.pronoun;
    const desc = `${g.age} tuổi, ${g.gender === 'male' ? 'nam' : 'nữ'}${/giáo viên/.test(g.name) ? ', giáo viên' : ''}`;
    const scene = (
      <Scene className="bg-gradient-to-b from-fuchsia-100 to-amber-50">
        <span className="text-8xl">{g.emoji}</span>
        <span className="rounded-full bg-white px-3 py-1 text-lg font-semibold text-slate-600">{desc}</span>
      </Scene>
    );
    const hint = (
      <>
        {desc} → <b>{p}</b>. Bạn {config.playerAge} tuổi.
      </>
    );
    return [
      {
        scene,
        prompt: <Bi vi="Chào khách bằng đại từ đúng!" en="Greet the guest with the right pronoun!" />,
        options: PRON.map((x) => fill(config.steps[0], { pronoun: x })),
        correctOption: PRON.indexOf(p),
        answers: [fill(config.steps[0], { pronoun: p }), `Xin chào ${p}.`, `Chào ${p} ạ.`],
        reply: `${capitalize(p)} cười: “Chào bạn!” 😊`,
        hint,
      },
      {
        scene,
        prompt: <Bi vi="Hỏi tên khách" en="Ask the guest's name" />,
        ...opts([fill(config.steps[1], { pronoun: p })], PRON.filter((x) => x !== p).map((x) => fill(config.steps[1], { pronoun: x })), 3),
        answers: [fill(config.steps[1], { pronoun: p }), `${capitalize(p)} tên là gì?`, `${capitalize(p)} tên gì?`, `Xin lỗi, ${p} tên gì?`],
        reply: (
          <>
            🏷️ {g.reply}
            <div className="text-lg font-normal">→ {fill(config.steps[2], { pronoun: p })}</div>
          </>
        ),
        replySay: g.reply,
        hint,
      },
    ];
  });
  return (
    <div>
      {tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {tags.map((t, i) => (
            <span key={i} className="rounded-xl bg-white px-3 py-1 font-semibold shadow ring-1 ring-fuchsia-200">
              🏷️ {t}
            </span>
          ))}
        </div>
      )}
      <RoundPlayer
        rounds={rounds}
        onRoundDone={(i) => {
          if (i % 2 === 1) setTags((t) => [...t, `${guests[(i - 1) / 2].emoji} ${guests[(i - 1) / 2].name}`]);
        }}
      />
    </div>
  );
}

// ---------------- Bài 1: Gặp hàng xóm ----------------
export function PoliteReply({ config }: GameProps) {
  const [polite, setPolite] = useState(0);
  const rounds: Round[] = (config.rounds as any[]).map((r) => {
    const options = shuffle([...r.good, ...r.bad]);
    return {
      scene: (
        <Scene className="bg-gradient-to-b from-emerald-100 to-white">
          <span className="text-7xl">{emojiOf(r.speaker) || '🙂'}</span>
          <div className="rounded-2xl bg-white px-5 py-3 text-2xl font-semibold shadow">
            {stripEmoji(r.speaker)}: “{r.line}”
          </div>
        </Scene>
      ),
      say: r.line,
      prompt: <Bi vi="Trả lời lễ phép (có “dạ”)" en="Reply politely (with “dạ”)" />,
      options,
      correctOption: r.good.map((g: string) => options.indexOf(g)),
      answers: r.good,
      hint: 'Nhớ dùng “dạ” / “ạ” và xưng hô đúng.',
      reply: '😊 Lễ phép quá!',
    };
  });
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="whitespace-nowrap font-bold">🙇 Lịch sự</span>
        <ProgressBar value={(polite / rounds.length) * 100} color="bg-fuchsia-500" className="!h-4" />
      </div>
      <RoundPlayer rounds={rounds} onRoundDone={() => setPolite((p) => p + 1)} />
    </div>
  );
}

// ---------------- Bài 2: Quầy nhập cảnh ----------------
export function PassportCheck({ config }: GameProps) {
  const ts = config.travellers as any[];
  const rounds: Round[] = shuffle(ts).map((t, k) => {
    const Pron = capitalize(t.pronoun);
    const others = ts.filter((x) => x.nationality !== t.nationality);
    const scene = (
      <Scene className="bg-gradient-to-b from-sky-100 to-white">
        <div className="w-64 rounded-2xl bg-indigo-900 p-4 text-left text-white shadow-xl">
          <div className="text-xs tracking-widest opacity-70">HỘ CHIẾU · PASSPORT</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-6xl">{t.flag}</span>
            <div>
              <div className="text-2xl font-bold">{t.name}</div>
              <div className="text-sm opacity-70">{t.pronoun}</div>
            </div>
          </div>
        </div>
      </Scene>
    );
    if (k % 2 === 0) {
      const q = fill(config.questionTemplates[0], { name: t.name });
      const right = fill(config.answerTemplates[0], { pronoun: t.pronoun, nationality: t.nationality });
      return {
        scene,
        say: q,
        prompt: q,
        ...opts([right], others.map((o) => fill(config.answerTemplates[0], { pronoun: t.pronoun, nationality: o.nationality }))),
        answers: [right, `${t.name} là người ${t.nationality}.`, `${Pron} là người ${t.nationality} ạ.`],
        reply: `✅ ${right}`,
      };
    }
    const wrong = sample(others, 1)[0].nationality;
    const q = fill(config.questionTemplates[1], { name: t.name, wrong });
    const right = fill(config.answerTemplates[1], { pronoun: t.pronoun, nationality: t.nationality });
    return {
      scene,
      say: q,
      prompt: q,
      options: shuffle([right, 'Vâng, phải.', `Không phải. ${Pron} là người ${wrong}.`]),
      correctOption: undefined,
      answers: [right, `Không. ${Pron} là người ${t.nationality}.`, `Dạ không phải. ${Pron} là người ${t.nationality}.`],
      reply: `✅ ${right}`,
    };
  });
  // gán lại correctOption cho câu "phải không"
  rounds.forEach((r) => {
    if (r.correctOption === undefined && r.options) r.correctOption = r.options.indexOf(r.answers[0]);
  });
  return (
    <div>
      {config.bonus && <div className="mb-3 rounded-xl bg-amber-50 p-3 text-amber-900">⭐ Thử thêm: {config.bonus}</div>}
      <RoundPlayer rounds={rounds} />
    </div>
  );
}

// ---------------- Bài 2: Album ảnh (đây/đó/kia) ----------------
export function FamilyAlbum({ config }: GameProps) {
  const rounds: Round[] = (config.scenes as any[]).map((s) => {
    const zone = s.position === 'near-speaker' ? 0 : s.position === 'near-listener' ? 1 : 2;
    const sentence = (w: string) => fill(config.sentence, { answer: w, target: s.target });
    return {
      scene: (
        <div className="grid grid-cols-3 items-end gap-2 rounded-3xl bg-gradient-to-b from-amber-100 to-orange-50 p-4 text-center">
          {[0, 1, 2].map((z) => (
            <div key={z} className={`flex min-h-40 flex-col items-center justify-end gap-1 rounded-2xl p-2 ${z === 2 ? 'bg-white/40' : 'bg-white/70'}`}>
              {z === zone && (
                <>
                  <span className={z === 2 ? 'text-4xl' : 'text-6xl'}>🧑</span>
                  <span className="rounded bg-white px-2 text-sm font-bold">{s.target}</span>
                </>
              )}
              <span className="text-4xl">{z === 0 ? '🙋' : z === 1 ? '🧏' : ''}</span>
              <span className="text-xs text-slate-500">{z === 0 ? 'Tôi (người nói)' : z === 1 ? 'Bạn (người nghe)' : 'Xa cả hai'}</span>
            </div>
          ))}
        </div>
      ),
      prompt: <Bi vi="Giới thiệu người trong ảnh" en="Introduce the person in the photo" />,
      options: ['Đây', 'Đó', 'Kia'].map(sentence),
      correctOption: ['Đây', 'Đó', 'Kia'].indexOf(s.answer),
      answers: [sentence(s.answer)],
      hint: 'Đây: gần người nói · Đó: gần người nghe · Kia: xa cả hai.',
      reply: sentence(s.answer),
      replySay: sentence(s.answer),
    };
  });
  return <RoundPlayer rounds={rounds} />;
}

// ---------------- Bài 3: Ngày hội việc làm ----------------
export function JobFair({ config }: GameProps) {
  const ppl = config.people as any[];
  const rounds: Round[] = shuffle(ppl).map((p) => {
    const right = fill(config.templates[0], p);
    return {
      scene: (
        <Scene className="bg-gradient-to-b from-lime-100 to-white">
          <span className="text-8xl">{p.emoji}</span>
        </Scene>
      ),
      prompt: `${p.pronoun} làm nghề gì?`,
      say: `${p.pronoun} làm nghề gì?`,
      ...opts([right], ppl.filter((x) => x.job !== p.job).map((x) => fill(config.templates[0], { ...p, job: x.job }))),
      answers: [right, `${p.pronoun} làm ${p.job}.`, `${p.pronoun} là ${p.job} ạ.`],
      reply: (
        <>
          {right}
          <div className="text-lg font-normal">🏢 {fill(config.templates[1], p)}</div>
        </>
      ),
      replySay: `${right} ${fill(config.templates[1], p)}`,
    };
  });
  return <RoundPlayer rounds={rounds} />;
}

// ---------------- Bài 3: Camera quan sát ----------------
export function SpyCamera({ config }: GameProps) {
  const sc = config.scenes as any[];
  const rounds: Round[] = sc.map((s) => {
    const right = fill(config.template, s);
    const wrong = sc.filter((x) => x !== s).flatMap((x) => [fill(config.template, { ...s, action: x.action }), fill(config.template, { ...s, place: x.place })]);
    return {
      scene: (
        <div className="mx-auto max-w-md rounded-3xl bg-slate-900 p-3 shadow-xl">
          <div className="flex items-center justify-between px-2 pb-2 text-xs font-bold text-red-400">
            <span>● REC</span>
            <span className="text-slate-400">CAM 0{sc.indexOf(s) + 1}</span>
          </div>
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 text-white">
            <span className="text-7xl">{s.emoji}</span>
            <span className="text-lg">
              {s.subject} · 📍 {s.place}
            </span>
          </div>
        </div>
      ),
      prompt: `${s.subject} đang làm gì?`,
      ...opts([right], wrong),
      answers: [right, `${s.subject} đang ${s.action}.`],
      reply: right,
      replySay: right,
    };
  });
  return <RoundPlayer rounds={rounds} />;
}

// ---------------- Bài 4: Tuyển thành viên ----------------
export function TalentTeam({ config }: GameProps) {
  const cands = config.candidates as any[];
  const rounds: Round[] = (config.challenges as any[]).map((c) => {
    const q = (name: string) => fill(config.questionTemplate, { name, skill: c.skill });
    return {
      scene: (
        <div className="rounded-3xl bg-gradient-to-b from-cyan-100 to-white p-4">
          <div className="mb-3 text-center text-3xl font-extrabold">Thử thách: {c.task}</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {cands.map((p) => (
              <div key={p.name} className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <div className="text-4xl">🧑‍🚀</div>
                <div className="font-bold">{p.name}</div>
                <div className="text-sm text-slate-500">{p.skills.join(', ')}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      prompt: <Bi vi={`Cần người “${c.skill}”. Hỏi ai?`} en="Who do you ask?" />,
      options: cands.map((p) => q(p.name)),
      correctOption: cands.findIndex((p) => p.name === c.answer),
      answers: [q(c.answer), `${c.answer} có ${c.skill} được không?`],
      hint: `Ai biết ${c.skill}?`,
      reply: (
        <>
          “{config.answerTemplates[0]}” 💪
        </>
      ),
      replySay: config.answerTemplates[0],
    };
  });
  return <RoundPlayer rounds={rounds} />;
}

// ---------------- Bài 6: Trốn tìm (ở đâu / đi đâu) ----------------
export function HideAndSeek({ config }: GameProps) {
  const rounds: Round[] = (config.rounds as any[]).map((r) => {
    const name = stripEmoji(r.character);
    const moving = r.state === 'moving';
    return {
      scene: (
        <Scene className="bg-gradient-to-b from-violet-100 to-white">
          <div className="flex items-center gap-6 text-7xl">
            <span className={moving ? 'animate-[run_1s_ease-in-out_infinite]' : ''}>{emojiOf(r.character)}</span>
            {moving && <span className="text-4xl">➡️</span>}
            <span className="rounded-2xl bg-white px-4 py-2 text-2xl font-bold shadow">🏠 {r.place}</span>
          </div>
          <span className="text-slate-500">{moving ? 'Đang di chuyển… / moving' : 'Đứng yên / staying'}</span>
        </Scene>
      ),
      prompt: <Bi vi="Hỏi câu nào?" en="Which question?" />,
      options: [`${name} ở đâu?`, `${name} đi đâu?`],
      correctOption: r.answer.includes('đi đâu') ? 1 : 0,
      answers: [r.answer],
      hint: 'Đứng yên → “ở đâu?”; di chuyển → “đi đâu?”',
      reply: r.reply,
      replySay: r.reply,
    };
  });
  return <RoundPlayer rounds={rounds} />;
}

// ---------------- Bài 6: Đếm nhanh (mấy / bao nhiêu) ----------------
export function QuickCount({ config }: GameProps) {
  const rounds: Round[] = (config.rounds as any[]).map((r) => {
    const q = (w: string) => `Có ${w} ${r.noun}?`;
    const ex = r.count > 10 ? config.exclamations[0] : sample(config.exclamations.slice(1), 1)[0];
    return {
      scene: (
        <div className="flex min-h-40 flex-wrap content-center items-center justify-center gap-1 rounded-3xl bg-gradient-to-b from-yellow-100 to-white p-4">
          {Array.from({ length: r.count }, (_, i) => (
            <span key={i} className={r.count > 30 ? 'text-xl' : 'text-5xl'}>
              {r.emoji}
            </span>
          ))}
        </div>
      ),
      prompt: <Bi vi="Hỏi số lượng: “mấy” hay “bao nhiêu”?" en="Ask: “mấy” (few) or “bao nhiêu” (many)?" />,
      options: [q('mấy'), q('bao nhiêu')],
      correctOption: r.answer === 'mấy' ? 0 : 1,
      answers: [q(r.answer)],
      hint: 'Ít (dưới 10) → mấy · Nhiều → bao nhiêu',
      reply: (
        <>
          Có {r.count} {r.noun}. {ex}
        </>
      ),
      replySay: `Có ${r.count} ${r.noun}. ${ex}`,
    };
  });
  return <RoundPlayer rounds={rounds} />;
}

// ---------------- Bài 7: Cỗ máy thời gian ----------------
export function TimeMachine({ config }: GameProps) {
  const [dir, setDir] = useState<'past' | 'future' | null>(null);
  const rounds: Round[] = (config.rounds as any[]).map((r) => ({
    scene: (
      <Scene className="bg-gradient-to-r from-sky-200 via-indigo-100 to-fuchsia-200">
        <span className="text-7xl">🕰️</span>
        <div className="rounded-2xl bg-white px-5 py-3 text-3xl font-bold shadow">{r.q}</div>
      </Scene>
    ),
    say: r.q,
    prompt: <Bi vi="Cỗ máy đi về đâu?" en="Where does the machine go?" />,
    options: ['⏪ Quá khứ', '⏩ Tương lai'],
    correctOption: r.answer === 'past' ? 0 : 1,
    choiceOnly: true,
    answers: [],
    hint: '“bao giờ” đầu câu → tương lai; cuối câu → quá khứ.',
    reply: (
      <>
        {r.answer === 'past' ? '⏪🚀 Về quá khứ!' : '🚀⏩ Tới tương lai!'} – “{r.reply}”
      </>
    ),
    replySay: r.reply,
  }));
  return (
    <div>
      {dir && <div className="mb-2 text-center text-4xl">{dir === 'past' ? '⏪' : '⏩'}</div>}
      <RoundPlayer rounds={rounds} onRoundDone={(i) => setDir((config.rounds as any[])[i].answer)} />
    </div>
  );
}

// ---------------- Bài 8: Cãi vui (không … lắm đâu) ----------------
export function ArgueBack({ config }: GameProps) {
  const rounds: Round[] = (config.rounds as any[]).map((r) => {
    const right: string = r.answer;
    const core = right.replace(/^Không\s+/, '').replace(/\s+lắm đâu\.?$/, '');
    const wrong = [`${capitalize(core)} lắm đâu.`, `Không lắm ${core} đâu.`, `Không ${core} đâu lắm.`, `Rất ${core} đâu.`];
    return {
      scene: (
        <Scene className="bg-gradient-to-b from-orange-100 to-white">
          <span className="text-7xl">🙄</span>
          <div className="rounded-2xl bg-white px-5 py-3 text-3xl font-bold shadow">Bạn: “{r.friend}”</div>
        </Scene>
      ),
      say: r.friend,
      prompt: <Bi vi="Bác bỏ ý kiến của bạn!" en="Disagree with your friend!" />,
      ...opts([right], wrong),
      answers: [right, `Không ${core} lắm.`],
      hint: 'Mẫu: Không + tính từ + lắm đâu.',
      reply: `😄 ${right}`,
      replySay: right,
    };
  });
  return <RoundPlayer rounds={rounds} />;
}

// ---------------- Bài 10: Hỏi chuyện hàng xóm (đã … chưa?) ----------------
export function NeighbourChat({ config }: GameProps) {
  const t = config.templates;
  const pronounOf = (name: string) => {
    const n = stripEmoji(name).toLowerCase();
    if (n.startsWith('anh')) return 'anh ấy';
    if (n.startsWith('chị')) return 'chị ấy';
    if (n.startsWith('bé') || n.startsWith('em')) return 'em ấy';
    if (n.startsWith('ông')) return 'ông ấy';
    if (n.startsWith('bà')) return 'bà ấy';
    return 'bạn ấy';
  };
  const rounds: Round[] = (config.neighbours as any[]).flatMap((nb) => {
    const name = stripEmoji(nb.name);
    const pronoun = pronounOf(nb.name);
    const card = (
      <div className="mx-auto flex max-w-sm items-center gap-4 rounded-3xl bg-white p-4 shadow ring-1 ring-slate-100">
        <span className="text-6xl">{emojiOf(nb.name)}</span>
        <div>
          <div className="text-2xl font-bold">{name}</div>
          {Object.entries(nb.facts).map(([a, v]) => (
            <div key={a} className="text-lg">
              {v ? '✅' : '❌'} {a}
            </div>
          ))}
          {nb.still && <div className="text-lg">⏳ {nb.still}</div>}
        </div>
      </div>
    );
    return Object.entries(nb.facts as Record<string, boolean>).map(([action, yes]) => {
      const q = fill(t.q, { name, action });
      const yesA = fill(t.yes, { pronoun: capitalize(pronoun), action }).replace(/^Rồi, (\w)/, (_m, c) => `Rồi, ${c.toLowerCase()}`);
      const noA = fill(t.no, { pronoun, action });
      const right = yes ? yesA : noA;
      const answers = [right, yes ? `Rồi, ${pronoun} ${action} rồi.` : `Chưa, ${pronoun} chưa ${action}.`, yes ? 'Rồi.' : 'Chưa.'];
      if (!yes && nb.still) answers.push(`Chưa, ${pronoun} ${nb.still}.`);
      return {
        scene: card,
        say: q,
        prompt: q,
        options: [`Rồi, ${pronoun} ${action} rồi.`, `Chưa, ${pronoun} chưa ${action}.`],
        correctOption: yes ? 0 : 1,
        answers,
        hint: 'Nhìn thẻ: ✅ → Rồi · ❌ → Chưa',
        reply: right,
        replySay: right,
      } as Round;
    });
  });
  return <RoundPlayer rounds={rounds} />;
}

// ---------------- Bài 10: Chúng tôi / chúng ta ----------------
export function WhoIsWe({ config }: GameProps) {
  const rounds: Round[] = (config.rounds as any[]).map((r) => ({
    scene: (
      <Scene className="bg-gradient-to-b from-teal-100 to-white">
        <span className="text-6xl">{r.answer === 'Chúng ta' ? '🧑‍🤝‍🧑' : '👥➡️🧑‍💼'}</span>
        <div className="max-w-xl rounded-2xl bg-white px-5 py-3 text-2xl font-semibold shadow">{r.situation}</div>
      </Scene>
    ),
    prompt: <Bi vi="Người nghe có ở trong nhóm không?" en="Is the listener included?" />,
    options: ['Chúng ta', 'Chúng tôi'],
    correctOption: r.answer === 'Chúng ta' ? 0 : 1,
    choiceOnly: true,
    answers: [r.answer],
    hint: 'Có người nghe → chúng ta · Không có người nghe → chúng tôi',
    reply: `✅ ${r.answer}`,
  }));
  return <RoundPlayer rounds={rounds} />;
}

// ---------------- Bài 26: Phòng khám ----------------
export function Clinic({ config }: GameProps) {
  const pts = config.patients as any[];
  const rounds: Round[] = shuffle(pts).flatMap((p) => {
    const sentence = fill(config.sentence, p);
    const advice = fill(config.adviceSentence, p);
    const scene = (
      <Scene className="bg-gradient-to-b from-rose-100 to-white">
        <div className="flex items-center gap-4">
          <span className="text-7xl">{p.emoji}</span>
          <span className="text-5xl">🩺</span>
        </div>
        <div className="text-2xl font-bold">{p.name}</div>
      </Scene>
    );
    return [
      {
        scene,
        prompt: `${p.pronoun} bị gì?`,
        ...opts([sentence], pts.filter((x) => x !== p).map((x) => fill(config.sentence, { ...p, symptom: x.symptom }))),
        answers: [sentence],
        reply: sentence,
        replySay: sentence,
      },
      {
        scene,
        prompt: <Bi vi="Bác sĩ khuyên gì?" en="What's the advice?" />,
        ...opts([advice], pts.filter((x) => x !== p).map((x) => fill(config.adviceSentence, { ...p, advice: x.advice }))),
        answers: [advice],
        reply: `👨‍⚕️ ${advice}`,
        replySay: advice,
      },
    ];
  });
  const sort = config.sortRound;
  if (sort) {
    const phrases = shuffle([...sort.good.map((g: string) => ({ g, good: true })), ...sort.bad.map((g: string) => ({ g, good: false }))]).slice(0, 4);
    for (const ph of phrases) {
      const rest = ph.g.replace(/^(bị|được)\s+/, '');
      rounds.push({
        scene: (
          <Scene className="bg-gradient-to-b from-sky-100 to-white">
            <div className="text-4xl font-bold">Tôi ___ {rest}.</div>
          </Scene>
        ),
        prompt: <Bi vi="“bị” hay “được”?" en="“bị” or “được”?" />,
        options: [`Tôi bị ${rest}.`, `Tôi được ${rest}.`],
        correctOption: ph.good ? 1 : 0,
        answers: [`Tôi ${ph.g}.`],
        hint: 'Việc tốt → được · Việc không may → bị',
        reply: `${ph.good ? '😊' : '😣'} Tôi ${ph.g}.`,
      });
    }
  }
  return <RoundPlayer rounds={rounds} mascot={undefined} />;
}

