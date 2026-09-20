import { useRef, type PointerEvent, type ReactNode } from 'react';
import { useFinePointer, usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export default function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (!fine || reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.28;
    const y = (e.clientY - r.top - r.height / 2) * 0.28;
    ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function onLeave() {
    if (!ref.current) return;
    ref.current.style.transform = 'translate3d(0, 0, 0)';
  }

  return (
    <div
      ref={ref}
      className="magnetic"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </div>
  );
}
