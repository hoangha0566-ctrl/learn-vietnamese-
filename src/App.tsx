import { useEffect, useState } from 'react';
import { useRoute, href } from './lib/router';
import { settingsStore } from './lib/store';
import { useSettings } from './components/ui';
import { TeacherDock } from './components/TeacherTools';
import { hasVietnameseVoice, onVoicesChanged, ttsSupported, voicesReady } from './lib/speech';
import { Home } from './pages/Home';
import { LessonPage } from './pages/LessonPage';
import { Notebook } from './pages/Notebook';
import { PronunciationHome, PronunciationUnit } from './pages/Pronunciation';
import { ContentManager } from './pages/ContentManager';
import { PrintView } from './pages/PrintView';

function Toggle({ on, onClick, label, title }: { on: boolean; onClick: () => void; label: string; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition ${on ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
    >
      {label}
    </button>
  );
}

export default function App() {
  const route = useRoute();
  const s = useSettings();
  const [voiceWarn, setVoiceWarn] = useState(false);
  const set = (patch: Partial<typeof s>) => settingsStore.set((p) => ({ ...p, ...patch }));

  useEffect(() => {
    document.documentElement.style.fontSize = `${(s.teacher ? 1.12 : 1) * s.fontScale * 100}%`;
  }, [s.teacher, s.fontScale]);

  useEffect(() => {
    const check = () => setVoiceWarn(ttsSupported() && voicesReady() && !hasVietnameseVoice());
    check();
    const t = setTimeout(check, 1500);
    const off = onVoicesChanged(check);
    return () => {
      clearTimeout(t);
      off();
    };
  }, []);

  const [page, a, b] = route;
  let body;
  if (page === 'lesson' && a) body = <LessonPage id={a} section={b} />;
  else if (page === 'notebook') body = <Notebook mode={a} lessonId={b} />;
  else if (page === 'pronunciation') body = a ? <PronunciationUnit id={a} /> : <PronunciationHome />;
  else if (page === 'manage') body = <ContentManager id={a} />;
  else if (page === 'print' && a) body = <PrintView id={a} />;
  else body = <Home />;

  return (
    <div className="min-h-screen bg-amber-50/60 text-slate-800">
      <header className="no-print sticky top-0 z-40 border-b border-amber-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2">
          <a href={href('')} className="mr-auto flex items-center gap-2 text-lg font-extrabold">
            <span className="text-2xl">🇻🇳</span>
            <span className="hidden sm:inline">Học tiếng Việt</span>
          </a>
          <Toggle on={s.showEn} onClick={() => set({ showEn: !s.showEn })} label="EN" title="Bật/tắt tiếng Anh · Show English" />
          <Toggle on={s.slow} onClick={() => set({ slow: !s.slow })} label={s.slow ? '🐢 0.7×' : '🔊 1×'} title="Tốc độ đọc · Speech speed" />
          <Toggle on={s.sound} onClick={() => set({ sound: !s.sound })} label={s.sound ? '🔔' : '🔕'} title="Hiệu ứng âm thanh · Sound effects" />
          <div className="flex items-center rounded-full bg-slate-100">
            <button onClick={() => set({ fontScale: Math.max(0.8, +(s.fontScale - 0.1).toFixed(1)) })} className="px-2 py-1 text-sm font-bold" title="Chữ nhỏ hơn">
              A−
            </button>
            <button onClick={() => set({ fontScale: Math.min(1.6, +(s.fontScale + 0.1).toFixed(1)) })} className="px-2 py-1 text-base font-bold" title="Chữ to hơn">
              A+
            </button>
          </div>
          <Toggle on={s.teacher} onClick={() => set({ teacher: !s.teacher })} label={s.teacher ? '👩‍🏫 Giáo viên' : '🧑‍🎓 Học viên'} title="Chế độ giáo viên / học viên" />
          <a href={href('manage')} title="Quản lý nội dung" className="rounded-full bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">
            ⚙️
          </a>
        </div>
      </header>
      {voiceWarn && (
        <div className="no-print mx-auto mt-2 max-w-7xl px-4">
          <div className="flex items-start gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm text-amber-900">
            ⚠️ Máy này chưa có giọng đọc tiếng Việt, nên phát âm có thể sai. Hãy dùng Chrome/Edge, hoặc cài giọng “Vietnamese” trong cài đặt ngôn ngữ của máy.
            <button className="ml-auto" onClick={() => setVoiceWarn(false)}>
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 py-6">{body}</div>
      {s.teacher && <TeacherDock />}
      <footer className="no-print pb-24 pt-6 text-center text-xs text-slate-400">
        Dữ liệu theo khung “Giáo trình tiếng Việt cho người nước ngoài – VSL 1”. Hội thoại, bài đọc, bài tập trong app được soạn mới. · Phím tắt: ← → câu trước/sau · Space lật thẻ / hiện đáp án
      </footer>
    </div>
  );
}
