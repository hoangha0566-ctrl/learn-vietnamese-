import { useMemo, useState } from 'react';
import { useLessons } from '../data';
import { Bi, Btn, Card, SpeakBtn, Empty } from '../components/ui';
import { href } from '../lib/router';
import { setWordKnown, useStore, wordsStore } from '../lib/store';
import { FlashcardSection } from '../sections/basic';
import type { Lesson, VocabItem } from '../types';

export function Notebook({ mode, lessonId }: { mode?: string; lessonId?: string }) {
  const lessons = useLessons();
  const words = useStore(wordsStore);
  const [filter, setFilter] = useState<'all' | 'known' | 'review' | 'new'>('all');
  const [lessonF, setLessonF] = useState(lessonId ?? '');
  const [q, setQ] = useState('');
  const all = useMemo(() => lessons.flatMap((l) => (l.vocabulary ?? []).map((v) => ({ v, l }))), [lessons]);

  if (mode === 'review') {
    const now = Date.now();
    const due = all.filter(({ v, l }) => (!lessonId || l.id === lessonId) && words[v.word] && words[v.word].box < 5 && words[v.word].due <= now);
    const fresh = all.filter(({ v, l }) => (!lessonId || l.id === lessonId) && !words[v.word]);
    const list = due.length ? due : lessonId ? all.filter(({ v, l }) => l.id === lessonId && (words[v.word]?.box ?? 0) < 5) : fresh.slice(0, 15);
    const pseudo: Lesson = { id: lessonId ?? 'notebook', number: 0, topic: '', topicEn: '', title: 'Ôn tập', titleEn: 'Review' };
    return (
      <div>
        <a href={href('notebook')} className="mb-4 inline-block rounded-xl bg-white px-3 py-2 font-semibold shadow-sm ring-1 ring-slate-100">
          ← Sổ từ
        </a>
        <p className="mb-2 text-slate-500">
          {due.length ? `${due.length} từ đến hạn ôn.` : 'Không có từ đến hạn – ôn từ mới / chưa thuộc.'}
        </p>
        {list.length ? <FlashcardSection lesson={pseudo} cards={list.map((x) => x.v)} sectionKey="notebook-review" /> : <Empty vi="Không còn từ cần ôn 🎉" en="Nothing to review" />}
      </div>
    );
  }

  const state = (v: VocabItem) => {
    const s = words[v.word];
    if (!s) return 'new';
    return s.box >= 5 ? 'known' : 'review';
  };
  const rows = all.filter(({ v, l }) => (filter === 'all' || state(v) === filter) && (!lessonF || l.id === lessonF) && (!q || (v.word + v.meaning).toLowerCase().includes(q.toLowerCase())));
  const counts = { known: all.filter((x) => state(x.v) === 'known').length, review: all.filter((x) => state(x.v) === 'review').length, new: all.filter((x) => state(x.v) === 'new').length };
  const dueCount = all.filter(({ v }) => words[v.word] && words[v.word].box < 5 && words[v.word].due <= Date.now()).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-3xl font-extrabold">
          <Bi vi="📒 Sổ từ của tôi" en="My word notebook" />
        </h1>
        <a href={href('notebook/review')} className="rounded-xl bg-rose-500 px-4 py-2 font-bold text-white shadow hover:bg-rose-600">
          🔁 Ôn tập ({dueCount} đến hạn)
        </a>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          ['known', '✅ Đã thuộc', 'bg-emerald-50 text-emerald-700'],
          ['review', '↻ Cần ôn', 'bg-amber-50 text-amber-700'],
          ['new', '🆕 Chưa học', 'bg-slate-50 text-slate-600'],
        ].map(([k, label, cls]) => (
          <button key={k} onClick={() => setFilter(filter === k ? 'all' : (k as 'known'))} className={`rounded-2xl p-4 text-left ring-2 ${cls} ${filter === k ? 'ring-current' : 'ring-transparent'}`}>
            <div className="text-3xl font-extrabold">{counts[k as 'known']}</div>
            <div className="font-semibold">{label}</div>
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm…" className="rounded-xl border border-slate-200 px-3 py-2" />
        <select value={lessonF} onChange={(e) => setLessonF(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Tất cả bài</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              Bài {l.number}: {l.title}
            </option>
          ))}
        </select>
      </div>
      <Card className="!p-0">
        <div className="divide-y divide-slate-100">
          {rows.map(({ v, l }) => {
            const st = state(v);
            const ws = words[v.word];
            return (
              <div key={l.id + v.word} className="flex flex-wrap items-center gap-3 px-4 py-2">
                <SpeakBtn text={v.word} audio={v.audio} size="sm" />
                <div className="min-w-0 flex-1">
                  <span className="text-xl font-bold">{v.word}</span> <span className="text-slate-500">– {v.meaning}</span>
                  <div className="text-xs text-slate-400">
                    Bài {l.number}
                    {ws && st === 'review' ? ` · hộp ${ws.box}/5 · ôn ${new Date(ws.due).toLocaleDateString('vi-VN')}` : ''}
                  </div>
                </div>
                <div className="flex gap-1 text-sm">
                  <button onClick={() => setWordKnown(v.word, l.id, true)} className={`rounded-full px-3 py-1 ${st === 'known' ? 'bg-emerald-500 text-white' : 'bg-slate-100'}`}>
                    Đã thuộc
                  </button>
                  <button onClick={() => setWordKnown(v.word, l.id, false)} className={`rounded-full px-3 py-1 ${st === 'review' ? 'bg-amber-400' : 'bg-slate-100'}`}>
                    Cần ôn
                  </button>
                </div>
              </div>
            );
          })}
          {!rows.length && <div className="p-6 text-center text-slate-400">—</div>}
        </div>
      </Card>
      <p className="mt-3 text-sm text-slate-500">
        <Bi
          vi="Ôn tập ngắt quãng: mỗi lần bạn bấm “Đã thuộc” trong flashcard, từ lên một hộp (ôn lại sau 1 → 2 → 4 → 7 → 14 ngày). Bấm “Chưa thuộc” thì từ về hộp đầu."
          en="Spaced repetition: “I know it” moves a word up a box (review after 1 → 2 → 4 → 7 → 14 days); “Still learning” sends it back."
        />
      </p>
      <Btn variant="ghost" className="mt-2" onClick={() => confirm('Xoá toàn bộ trạng thái từ vựng?') && wordsStore.set({})}>
        🗑️ Xoá dữ liệu sổ từ
      </Btn>
    </div>
  );
}
