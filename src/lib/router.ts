// Bộ định tuyến rất nhỏ dựa trên #hash (chạy được trên GitHub Pages, không cần cấu hình server).
import { useEffect, useState } from 'react';

function current(): string[] {
  const h = window.location.hash.replace(/^#\/?/, '');
  return h.split('?')[0].split('/').filter(Boolean).map(decodeURIComponent);
}

export function useRoute(): string[] {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const on = () => setRoute(current());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function navigate(path: string) {
  window.location.hash = '#/' + path.replace(/^\/+/, '');
  window.scrollTo({ top: 0 });
}

export function href(path: string) {
  return '#/' + path.replace(/^\/+/, '');
}
