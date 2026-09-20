import { useEffect, useRef, useState } from 'react';
import { useFinePointer, usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const TRAIL = 4;

export default function CustomCursor() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const trails = useRef<(HTMLDivElement | null)[]>([]);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!fine || reduced) return undefined;

    document.documentElement.classList.add('has-cursor');
    const pos = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const history = Array.from({ length: TRAIL }, () => ({ x: 0, y: 0 }));
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const el = (e.target as HTMLElement | null)?.closest?.('[data-cursor]');
      setLabel(el?.getAttribute('data-cursor') || '');
    };

    const loop = () => {
      cur.x += (pos.x - cur.x) * 0.22;
      cur.y += (pos.y - cur.y) * 0.22;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
      }
      history.pop();
      history.unshift({ x: cur.x, y: cur.y });
      trails.current.forEach((node, i) => {
        if (!node) return;
        const p = history[Math.min(i + 1, history.length - 1)];
        node.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
        node.style.opacity = String(0.28 - i * 0.06);
      });
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [fine, reduced]);

  if (!fine || reduced) return null;

  return (
    <>
      {Array.from({ length: TRAIL }, (_, i) => (
        <div
          key={i}
          className="cursor-trail"
          aria-hidden="true"
          ref={(el) => {
            trails.current[i] = el;
          }}
        />
      ))}
      <div
        ref={dot}
        className={`cursor-dot${label ? ' is-label' : ''}`}
        aria-hidden="true"
      >
        {label ? <span>{label}</span> : null}
      </div>
    </>
  );
}
