import { useRef, useState } from 'react';

/** Mặt đồng hồ SVG. Nếu có onChange thì kéo được kim giờ / kim phút. */
export function ClockFace({
  h,
  m,
  size = 220,
  onChange,
  sky,
}: {
  h: number;
  m: number;
  size?: number;
  onChange?: (h12: number, m: number) => void;
  sky?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<'h' | 'm' | null>(null);
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minAngle = m * 6;

  const angleFromEvent = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    let a = (Math.atan2(x, -y) * 180) / Math.PI;
    if (a < 0) a += 360;
    return a;
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag || !onChange) return;
    const a = angleFromEvent(e);
    if (drag === 'm') {
      const nm = (Math.round(a / 30) * 5) % 60;
      onChange(h % 12 === 0 ? 12 : h % 12, nm);
    } else {
      let nh = Math.round(a / 30) % 12;
      if (nh === 0) nh = 12;
      onChange(nh, m);
    }
  };

  return (
    <svg
      ref={ref}
      viewBox="-110 -110 220 220"
      width={size}
      height={size}
      className={`touch-none select-none ${onChange ? 'cursor-pointer' : ''}`}
      onPointerMove={onMove}
      onPointerUp={() => setDrag(null)}
      onPointerLeave={() => setDrag(null)}
      role="img"
      aria-label={`${h}:${String(m).padStart(2, '0')}`}
    >
      <circle r="104" fill={sky ?? '#fff7ed'} stroke="#fb7185" strokeWidth="6" />
      <circle r="92" fill="#ffffff" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 * Math.PI) / 180;
        const big = i % 5 === 0;
        return (
          <line
            key={i}
            x1={Math.sin(a) * (big ? 78 : 84)}
            y1={-Math.cos(a) * (big ? 78 : 84)}
            x2={Math.sin(a) * 90}
            y2={-Math.cos(a) * 90}
            stroke={big ? '#334155' : '#cbd5e1'}
            strokeWidth={big ? 3 : 1.5}
          />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const a = (n * 30 * Math.PI) / 180;
        return (
          <text key={n} x={Math.sin(a) * 64} y={-Math.cos(a) * 64 + 7} textAnchor="middle" fontSize="20" fontWeight="700" fill="#334155">
            {n}
          </text>
        );
      })}
      <g transform={`rotate(${hourAngle})`} onPointerDown={(e) => { if (onChange) { (e.target as Element).setPointerCapture?.(e.pointerId); setDrag('h'); } }}>
        <line x1="0" y1="8" x2="0" y2="-48" stroke="#0f172a" strokeWidth="9" strokeLinecap="round" />
        {onChange && <circle cy="-48" r="12" fill="#0f172a" opacity="0.15" />}
      </g>
      <g transform={`rotate(${minAngle})`} onPointerDown={(e) => { if (onChange) { (e.target as Element).setPointerCapture?.(e.pointerId); setDrag('m'); } }}>
        <line x1="0" y1="12" x2="0" y2="-76" stroke="#e11d48" strokeWidth="5" strokeLinecap="round" />
        {onChange && <circle cy="-76" r="12" fill="#e11d48" opacity="0.2" />}
      </g>
      <circle r="6" fill="#e11d48" />
    </svg>
  );
}
