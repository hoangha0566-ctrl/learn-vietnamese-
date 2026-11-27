// Trang "Quản lý nội dung": sửa từ vựng dạng bảng, sửa JSON của bài, xuất / nhập file.
import { useEffect, useState } from 'react';
import { baseLessons, overridesStore, resetLesson, saveLesson, useLessons } from '../data';
import { Bi, Btn, Card } from '../components/ui';
import { href, navigate } from '../lib/router';
import { useStore, progressStore, wordsStore, streakStore, teamsStore, studentsStore } from '../lib/store';
import type { Lesson, VocabItem } from '../types';

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function ContentManager({ id }: { id?: string }) {
  const lessons = useLessons();
  const overrides = useStore(overridesStore);
  const lesson = lessons.find((l) => l.id === id) ?? lessons[0];
  const [tab, setTab] = useState<'vocab' | 'json'>('vocab');
  const [vocab, setVocab] = useState<VocabItem[]>(lesson?.vocabulary ?? []);
  const [json, setJson] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setVocab(lesson?.vocabulary ?? []);
    setJson(JSON.stringify(lesson, null, 2));
    setErr('');
  }, [lesson]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 2500);
  };

  if (!lesson) return null;
  const isBase = baseLessons.some((l) => l.id === lesson.id);
  const edited = !!overrides[lesson.id];

  const saveVocab = () => {
    saveLesson({ ...lesson, vocabulary: vocab.filter((v) => v.word.trim()) });
    flash('✅ Đã lưu từ vựng');
  };
  const saveJson = () => {
    try {
      const obj = JSON.parse(json) as Lesson;
      if (!obj.id || !obj.title) throw new Error('Thiếu trường "id" hoặc "title"');
      saveLesson(obj);
      setErr('');
      flash('✅ Đã lưu');
      if (obj.id !== lesson.id) navigate(`manage/${obj.id}`);
    } catch (e) {
      setErr(String((e as Error).message));
    }
  };
  const importFile = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      const list: Lesson[] = Array.isArray(data) ? data : data.lessons && Array.isArray(data.lessons) && data.lessons[0]?.vocabulary !== undefined ? data.lessons : data.id ? [data] : [];
      if (data.backup) {
        // bản sao lưu toàn bộ
        if (data.overrides) overridesStore.set(data.overrides);
        if (data.progress) progressStore.set(data.progress);
        if (data.words) wordsStore.set(data.words);
        if (data.teams) teamsStore.set(data.teams);
        if (data.students) studentsStore.set(data.students);
        flash('✅ Đã khôi phục bản sao lưu');
        return;
      }
      if (!list.length) throw new Error('File không có bài học hợp lệ');
      list.forEach(saveLesson);
      flash(`✅ Đã nhập ${list.length} bài`);
    } catch (e) {
      setErr(String((e as Error).message));
    }
  };
  const newLesson = () => {
    const n = Math.max(...lessons.map((l) => l.number)) + 1;
    const l: Lesson = {
      id: `bai-${String(n).padStart(2, '0')}`,
      number: n,
      topic: 'Chủ đề mới',
      topicEn: 'New topic',
      title: 'Tên bài mới',
      titleEn: 'New lesson',
      objectives: [{ vi: '', en: '' }],
      vocabulary: [{ word: '', meaning: '', type: 'noun', example: '', exampleEn: '', image: '', audio: '' }],
      grammar: [],
      dialogues: [],
      reading: null,
      exercises: [],
      games: [],
    };
    saveLesson(l);
    navigate(`manage/${l.id}`);
  };
  const upd = (i: number, k: keyof VocabItem, v: string) => setVocab(vocab.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <a href={href('')} className="rounded-xl bg-white px-3 py-2 font-semibold shadow-sm ring-1 ring-slate-100">
          ← Trang chủ
        </a>
        <h1 className="mr-auto text-3xl font-extrabold">
          <Bi vi="⚙️ Quản lý nội dung" en="Content manager" />
        </h1>
        <Btn variant="secondary" onClick={newLesson}>
          + Bài mới
        </Btn>
        <Btn variant="secondary" onClick={() => download('vsl1-tat-ca-bai.json', { lessons })}>
          ⬇ Xuất tất cả bài
        </Btn>
        <label className="cursor-pointer rounded-xl bg-white px-4 py-2 font-semibold ring-1 ring-slate-200 hover:bg-slate-50">
          ⬆ Nhập JSON
          <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
        </label>
      </div>
      {msg && <div className="mb-3 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-700">{msg}</div>}
      {err && <div className="mb-3 rounded-xl bg-red-50 p-3 text-red-700">⚠️ {err}</div>}

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <Card className="!p-2">
          <div className="flex flex-col gap-1">
            {lessons.map((l) => (
              <a key={l.id} href={href(`manage/${l.id}`)} className={`rounded-xl px-3 py-2 text-sm font-semibold ${l.id === lesson.id ? 'bg-rose-500 text-white' : 'hover:bg-slate-50'}`}>
                {l.icon} Bài {l.number}: {l.title}
                {overrides[l.id] && <span className="ml-1 text-xs">✏️</span>}
              </a>
            ))}
          </div>
        </Card>
        <div className="min-w-0">
          <Card className="mb-3 !p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-auto">
                <div className="text-xl font-bold">
                  Bài {lesson.number}: {lesson.title}
                </div>
                <div className="text-sm text-slate-500">
                  id: {lesson.id} · {edited ? '✏️ đã sửa (lưu trong trình duyệt này)' : 'bản gốc từ file dữ liệu'}
                </div>
              </div>
              <Btn variant="secondary" onClick={() => download(`${lesson.id}.json`, lesson)}>
                ⬇ Xuất bài này
              </Btn>
              <a href={href(`lesson/${lesson.id}`)} className="rounded-xl bg-white px-4 py-2 font-semibold ring-1 ring-slate-200">
                👁 Xem bài
              </a>
              {edited && (
                <Btn variant="danger" onClick={() => confirm(isBase ? 'Khôi phục bài về bản gốc?' : 'Xoá bài này?') && resetLesson(lesson.id)}>
                  {isBase ? '↺ Về bản gốc' : '🗑️ Xoá bài'}
                </Btn>
              )}
            </div>
          </Card>
          <div className="mb-3 flex gap-2">
            <Btn variant={tab === 'vocab' ? 'primary' : 'secondary'} onClick={() => setTab('vocab')}>
              📚 Từ vựng (bảng)
            </Btn>
            <Btn variant={tab === 'json' ? 'primary' : 'secondary'} onClick={() => setTab('json')}>
              {'{ }'} Toàn bộ bài (JSON)
            </Btn>
          </div>
          {tab === 'vocab' ? (
            <Card className="!p-2">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="text-left text-slate-500">
                    <tr>
                      {['Từ', 'Nghĩa (EN)', 'Loại', 'Ví dụ', 'Ví dụ (EN)', 'Ảnh/emoji', 'Audio mp3', ''].map((h) => (
                        <th key={h} className="px-1 py-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vocab.map((v, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        {(['word', 'meaning', 'type', 'example', 'exampleEn', 'image', 'audio'] as (keyof VocabItem)[]).map((k) => (
                          <td key={k} className="p-1">
                            <input value={v[k] ?? ''} onChange={(e) => upd(i, k, e.target.value)} className={`w-full rounded-lg border border-slate-200 px-2 py-1 ${k === 'word' ? 'font-bold' : ''}`} />
                          </td>
                        ))}
                        <td className="p-1">
                          <button onClick={() => setVocab(vocab.filter((_, j) => j !== i))} className="text-red-400">
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 flex gap-2 p-2">
                <Btn variant="secondary" onClick={() => setVocab([...vocab, { word: '', meaning: '', type: '', example: '', exampleEn: '', image: '', audio: '' }])}>
                  + Thêm từ
                </Btn>
                <Btn onClick={saveVocab}>💾 Lưu</Btn>
              </div>
            </Card>
          ) : (
            <Card className="!p-2">
              <textarea value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} className="h-[60vh] w-full rounded-xl bg-slate-900 p-3 font-mono text-sm text-emerald-200" />
              <div className="flex gap-2 p-2">
                <Btn onClick={saveJson}>💾 Lưu JSON</Btn>
                <span className="self-center text-sm text-slate-500">Cấu trúc: xem src/data/vsl1/README.md</span>
              </div>
            </Card>
          )}
          <Card className="mt-4 !p-4">
            <div className="mb-2 font-bold">💾 Sao lưu / khôi phục toàn bộ (bài đã sửa, tiến độ, sổ từ, đội)</div>
            <div className="flex flex-wrap gap-2">
              <Btn
                variant="secondary"
                onClick={() =>
                  download('vsl1-sao-luu.json', {
                    backup: true,
                    date: new Date().toISOString(),
                    overrides: overridesStore.get(),
                    progress: progressStore.get(),
                    words: wordsStore.get(),
                    streak: streakStore.get(),
                    teams: teamsStore.get(),
                    students: studentsStore.get(),
                  })
                }
              >
                ⬇ Tải bản sao lưu
              </Btn>
              <Btn variant="ghost" onClick={() => confirm('Xoá toàn bộ tiến độ học?') && progressStore.set({})}>
                🗑️ Xoá tiến độ
              </Btn>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Bản sửa chỉ lưu trong trình duyệt này. Để sửa vĩnh viễn cho mọi người: xuất JSON và chép đè vào <code>src/data/vsl1/lessons/</code>, rồi build lại.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
