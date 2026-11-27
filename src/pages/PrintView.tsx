// Trang in: danh sách từ vựng + phiếu bài tập (In / Lưu PDF bằng trình duyệt).
import { useState } from 'react';
import { useLesson } from '../data';
import { Btn } from '../components/ui';
import { href } from '../lib/router';
import { stripTones } from '../lib/vietnamese';

export function PrintView({ id }: { id: string }) {
  const l = useLesson(id);
  const [key, setKey] = useState(false);
  const [parts, setParts] = useState({ vocab: true, grammar: true, dialogue: true, reading: true, exercises: true });
  if (!l) return null;
  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
        <a href={href(`lesson/${l.id}`)} className="rounded-xl px-3 py-2 font-semibold ring-1 ring-slate-200">
          ← Quay lại
        </a>
        {Object.keys(parts).map((k) => (
          <label key={k} className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={parts[k as keyof typeof parts]} onChange={(e) => setParts({ ...parts, [k]: e.target.checked })} />
            {{ vocab: 'Từ vựng', grammar: 'Ngữ pháp', dialogue: 'Hội thoại', reading: 'Bài đọc', exercises: 'Bài tập' }[k]}
          </label>
        ))}
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={key} onChange={(e) => setKey(e.target.checked)} /> Kèm đáp án
        </label>
        <Btn className="ml-auto" onClick={() => window.print()}>
          🖨️ In / Lưu PDF
        </Btn>
      </div>
      <article className="print-sheet rounded-2xl bg-white p-8 text-[15px] leading-relaxed shadow-sm">
        <header className="mb-4 border-b-2 border-slate-800 pb-2">
          <div className="flex justify-between text-sm">
            <span>Học tiếng Việt – VSL 1</span>
            <span>Họ tên: ................................ Ngày: ..............</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold">
            Bài {l.number}: {l.title}
          </h1>
          <div className="italic text-slate-600">{l.titleEn}</div>
        </header>
        {parts.vocab && !!l.vocabulary?.length && (
          <section className="mb-6">
            <h2 className="mb-2 text-lg font-bold">I. Từ vựng – Vocabulary</h2>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {l.vocabulary.map((v, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="w-8 py-1 text-slate-400">{i + 1}</td>
                    <td className="py-1 font-bold">{v.word}</td>
                    <td className="py-1">{v.meaning}</td>
                    <td className="py-1 text-slate-600">{v.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {parts.grammar && !!l.grammar?.length && (
          <section className="mb-6">
            <h2 className="mb-2 text-lg font-bold">II. Ngữ pháp – Grammar</h2>
            {l.grammar.map((g, i) => (
              <div key={i} className="mb-2">
                <div className="font-bold">• {g.pattern}</div>
                <div>{g.explainVi}</div>
                <div className="text-slate-600">{g.examples.map((e) => e.vi).join(' / ')}</div>
              </div>
            ))}
          </section>
        )}
        {parts.dialogue && !!l.dialogues?.length && (
          <section className="mb-6">
            <h2 className="mb-2 text-lg font-bold">III. Hội thoại – Dialogues</h2>
            {l.dialogues.map((d, i) => (
              <div key={i} className="mb-3">
                <div className="font-semibold">{d.title}</div>
                {d.lines.map((x, k) => (
                  <div key={k}>
                    <b>{x.speaker}:</b> {x.vi}
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}
        {parts.reading && l.reading?.text && (
          <section className="mb-6">
            <h2 className="mb-2 text-lg font-bold">IV. Bài đọc – {l.reading.title}</h2>
            <p>{l.reading.text}</p>
            {l.reading.trueFalse?.map((t, i) => (
              <div key={i}>
                {i + 1}. {t.q} &nbsp; Đ □ &nbsp; S □ {key && <b>→ {t.answer ? 'Đ' : 'S'}</b>}
              </div>
            ))}
          </section>
        )}
        {parts.exercises && (
          <section>
            <h2 className="mb-2 text-lg font-bold">V. Bài tập – Exercises</h2>
            {(l.exercises ?? [])
              .filter((e) => e.type !== 'substitution')
              .map((ex, n) => (
                <div key={n} className="mb-4 break-inside-avoid">
                  <div className="font-bold">
                    {n + 1}. {ex.title} <span className="font-normal italic text-slate-500">({ex.titleEn})</span>
                  </div>
                  {ex.wordBank && <div className="my-1 rounded border border-slate-300 px-2 py-1 text-sm">{ex.wordBank.join(' · ')}</div>}
                  <ol className="ml-6 list-[lower-alpha]">
                    {ex.items.map((it, i) => (
                      <li key={i} className="py-0.5">
                        {ex.type === 'reorder' ? (
                          <>
                            {it.words?.join(' / ')}
                            <div className="border-b border-dotted border-slate-400">&nbsp;</div>
                          </>
                        ) : ex.type === 'multiple-choice' ? (
                          <>
                            {it.q}{' '}
                            <span className="text-slate-600">
                              {it.options?.map((o, k) => `${'ABCD'[k]}. ${o}`).join('   ')}
                            </span>
                          </>
                        ) : ex.type === 'dictation' ? (
                          <div className="border-b border-dotted border-slate-400">&nbsp;</div>
                        ) : ex.type === 'clock' ? (
                          <>🕰️ {it.q} → ........................</>
                        ) : (
                          <>
                            {it.q}
                            {ex.type !== 'fill-blank' && <div className="border-b border-dotted border-slate-400">&nbsp;</div>}
                          </>
                        )}
                        {key && (
                          <b className="ml-2 text-emerald-700">
                            → {ex.type === 'multiple-choice' ? it.options?.[it.answer as number] : it.answers?.[0]}
                          </b>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            {!!l.vocabulary?.length && (
              <div className="mb-4 break-inside-avoid">
                <div className="font-bold">Thêm dấu thanh – Add the tone marks</div>
                <div className="flex flex-wrap gap-x-6">
                  {l.vocabulary.slice(0, 12).map((v) => (
                    <span key={v.word}>
                      {stripTones(v.word)} → {key ? <b>{v.word}</b> : '..........'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </article>
    </div>
  );
}
