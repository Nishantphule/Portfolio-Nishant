import { useEffect, useRef } from 'react';
import { useFinePointer, usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export default function ContactBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced || !fine) return undefined;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const mouse = { x: 0.5, y: 0.5 };
    const palette = [
      'rgba(0, 229, 255, 0.15)',
      'rgba(255, 45, 120, 0.12)',
      'rgba(198, 255, 61, 0.12)',
    ];
    const dots = Array.from({ length: 36 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00025,
      vy: (Math.random() - 0.5) * 0.00025,
      color: palette[i % palette.length],
    }));

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (const d of dots) {
        d.x += d.vx + (mouse.x - 0.5) * 0.00015;
        d.y += d.vy + (mouse.y - 0.5) * 0.00015;
        if (d.x < 0 || d.x > 1) d.vx *= -1;
        if (d.y < 0 || d.y > 1) d.vy *= -1;
        d.x = Math.min(1, Math.max(0, d.x));
        d.y = Math.min(1, Math.max(0, d.y));
      }
      for (let i = 0; i < dots.length; i += 1) {
        for (let j = i + 1; j < dots.length; j += 1) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 0.18) {
            ctx.globalAlpha = (1 - dist / 0.18) * 0.15;
            ctx.strokeStyle = dots[i].color;
            ctx.beginPath();
            ctx.moveTo(dots[i].x * w, dots[i].y * h);
            ctx.lineTo(dots[j].x * w, dots[j].y * h);
            ctx.stroke();
          }
        }
      }
      for (const d of dots) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x * w, d.y * h, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced, fine]);

  return <canvas ref={canvasRef} className="contact-canvas" aria-hidden="true" />;
}
