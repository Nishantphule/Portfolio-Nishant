import { useEffect, useRef } from 'react';
import { useFinePointer, usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

type Star = { x: number; y: number; r: number; a: number };

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const lowPower =
      !fine || (typeof navigator !== 'undefined' && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency < 4);

    const COUNT = lowPower ? 70 : 110;
    const stars: Star[] = Array.from({ length: COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() < 0.85 ? 1 : 1.6,
      a: 0.08 + Math.random() * 0.04,
    }));

    let drift = 0;
    let raf = 0;
    let visible = true;

    const paint = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const x = ((s.x + drift) % 1) * w;
        const y = s.y * h;
        ctx.globalAlpha = s.a;
        ctx.fillStyle = '#cdefff';
        ctx.fillRect(x, y, s.r, s.r);
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    };

    resize();

    const staticOnly = reduced || lowPower;
    if (staticOnly) {
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
        window.clearTimeout(resizeTimer);
      };
    }

    const onVis = () => {
      visible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVis);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      drift += 0.000035;
      if (drift > 1) drift -= 1;
      paint();
    };
    tick();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      window.clearTimeout(resizeTimer);
    };
  }, [reduced, fine]);

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />;
}
