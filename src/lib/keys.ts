// Phím tắt: → câu tiếp, ← câu trước, Space hiện đáp án / lật thẻ.
import { useEffect, useRef } from 'react';

export interface KeyHandlers {
  next?: () => void;
  prev?: () => void;
  space?: () => void;
}

export function useKeys(h: KeyHandlers, enabled = true) {
  const ref = useRef(h);
  ref.current = h;
  useEffect(() => {
    if (!enabled) return;
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (typing) return;
      if (e.key === 'ArrowRight' && ref.current.next) {
        e.preventDefault();
        ref.current.next();
      } else if (e.key === 'ArrowLeft' && ref.current.prev) {
        e.preventDefault();
        ref.current.prev();
      } else if (e.key === ' ' && ref.current.space) {
        if (t?.tagName === 'BUTTON') return;
        e.preventDefault();
        ref.current.space();
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [enabled]);
}
