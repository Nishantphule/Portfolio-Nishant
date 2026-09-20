import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const CYAN = '#00e5ff';
const MAGENTA = '#ff2d78';
const VIOLET = '#8b5cf6';
const PALETTE = [CYAN, MAGENTA, VIOLET];
const MAX_NODES = 10;
const MAX_SHOTS = 24;
const MAX_SPARKS = 40;
const FIRE_GAP = 0.125;
const IDLE_FIRE = 0.72;

type Node = { x: number; y: number; vx: number; vy: number; r: number; color: string };
type Shot = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };

function isLowEnd() {
  return typeof navigator !== 'undefined' && !!navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function AboutDefense() {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const tallyRef = useRef<HTMLParagraphElement>(null);
  const reduced = usePrefersReducedMotion();
  const skip = reduced || isLowEnd();

  useEffect(() => {
    if (skip) return undefined;
    const hostEl = host.current;
    const canvas = canvasRef.current;
    if (!hostEl || !canvas) return undefined;

    const gfx = canvas.getContext('2d');
    if (!gfx) return undefined;
    const root = hostEl;
    const surface = canvas;
    const ctx = gfx;

    const nodes: Node[] = [];
    const shots: Shot[] = [];
    const sparks: Spark[] = [];
    const craft = { x: 0.5, y: 0.86 };
    const pointer = { x: 0.5, y: 0.4 };
    let w = 1;
    let h = 1;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let accIdle = 0;
    let fireCool = 0;
    let visible = true;
    let running = true;
    let hovering = false;
    let holding = false;
    let glow = 0;
    let intercepts = 0;
    let hinted = false;

    function resize() {
      const box = root.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.max(1, box.width);
      h = Math.max(1, box.height);
      surface.width = Math.floor(w * dpr);
      surface.height = Math.floor(h * dpr);
      surface.style.width = `${w}px`;
      surface.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function pointerNorm(e: PointerEvent) {
      const box = root.getBoundingClientRect();
      pointer.x = clamp((e.clientX - box.left) / box.width, 0.08, 0.92);
      pointer.y = clamp((e.clientY - box.top) / box.height, 0.04, 0.96);
    }

    function spawnNode() {
      if (nodes.length >= MAX_NODES) return;
      nodes.push({
        x: 0.12 + Math.random() * 0.76,
        y: -0.08 - Math.random() * 0.12,
        vx: (Math.random() - 0.5) * 0.04,
        vy: 0.08 + Math.random() * 0.09,
        r: 3.2 + Math.random() * 2.2,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      });
    }

    function burst(x: number, y: number, color: string) {
      const n = 10;
      for (let i = 0; i < n && sparks.length < MAX_SPARKS; i += 1) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.35;
        const spd = 0.18 + Math.random() * 0.16;
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 0.4 + Math.random() * 0.25,
          color,
        });
      }
    }

    function fire() {
      if (shots.length >= MAX_SHOTS) return;
      let ang = -Math.PI / 2;
      if (hovering && pointer.y < craft.y - 0.03) {
        ang = Math.atan2(pointer.y - craft.y, pointer.x - craft.x);
      }
      shots.push({
        x: craft.x,
        y: craft.y - 0.045,
        vx: Math.cos(ang) * 0.9,
        vy: Math.sin(ang) * 0.9,
        life: 1.15,
        color: Math.random() > 0.4 ? CYAN : MAGENTA,
      });
    }

    function hideHint() {
      if (hinted) return;
      hinted = true;
      hintRef.current?.classList.add('is-gone');
    }

    function setTally() {
      if (tallyRef.current) {
        tallyRef.current.textContent = `INTERCEPTS ${String(intercepts).padStart(2, '0')}`;
      }
    }

    for (let i = 0; i < 6; i += 1) spawnNode();
    setTally();

    const onMove = (e: PointerEvent) => {
      hovering = true;
      pointerNorm(e);
    };
    const onDown = (e: PointerEvent) => {
      hovering = true;
      holding = true;
      pointerNorm(e);
      hideHint();
      fireCool = FIRE_GAP;
      fire();
      e.preventDefault();
    };
    const onUp = () => {
      holding = false;
    };
    const onLeave = () => {
      hovering = false;
      holding = false;
    };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointercancel', onLeave);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: '10% 0px' },
    );
    io.observe(root);

    const ro = new ResizeObserver(resize);
    ro.observe(root);
    resize();

    const tick = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (!visible) return;

      const targetX = hovering ? pointer.x : 0.5 + Math.sin(now / 900) * 0.08;
      craft.x += (targetX - craft.x) * Math.min(1, dt * 10);

      if (holding) {
        fireCool += dt;
        if (fireCool >= FIRE_GAP) {
          fireCool = 0;
          fire();
        }
      } else if (!hovering) {
        accIdle += dt;
        if (accIdle > IDLE_FIRE) {
          accIdle = 0;
          fire();
        }
      } else {
        accIdle = 0;
      }

      if (nodes.length < 7 && Math.random() < dt * 1.4) spawnNode();
      glow = Math.max(0, glow - dt * 3.2);

      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = hovering ? '#00e5ff44' : '#00e5ff18';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(8, 8, w - 16, h - 16);
      ctx.stroke();

      for (let i = nodes.length - 1; i >= 0; i -= 1) {
        const n = nodes[i];
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        n.vx += Math.sin(now / 400 + i) * 0.002;
        if (n.x < 0.06 || n.x > 0.94) n.vx *= -1;
        if (n.y > 1.08) {
          nodes.splice(i, 1);
          spawnNode();
          continue;
        }
        const px = n.x * w;
        const py = n.y * h;
        ctx.beginPath();
        ctx.fillStyle = n.color;
        ctx.globalAlpha = 0.9;
        ctx.arc(px, py, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.arc(px, py, n.r * 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (let i = shots.length - 1; i >= 0; i -= 1) {
        const s = shots[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0 || s.y < -0.06 || s.x < -0.06 || s.x > 1.06) {
          shots.splice(i, 1);
          continue;
        }
        let hit = false;
        for (let j = nodes.length - 1; j >= 0; j -= 1) {
          const n = nodes[j];
          const dx = (s.x - n.x) * w;
          const dy = (s.y - n.y) * h;
          if (Math.hypot(dx, dy) < n.r + 6) {
            burst(n.x, n.y, n.color);
            nodes.splice(j, 1);
            shots.splice(i, 1);
            spawnNode();
            intercepts += 1;
            glow = 1;
            setTally();
            hit = true;
            break;
          }
        }
        if (hit) continue;
        const sx = s.x * w;
        const sy = s.y * h;
        const len = 16;
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = Math.max(0.45, s.life);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - s.vx * len, sy - s.vy * len);
        ctx.stroke();
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const p = sparks[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life * 2.2);
        ctx.fillRect(p.x * w - 1.5, p.y * h - 1.5, 3, 3);
        ctx.globalAlpha = 1;
      }

      const cx = craft.x * w;
      const cy = craft.y * h;
      ctx.save();
      ctx.translate(cx, cy);
      if (glow > 0) {
        ctx.strokeStyle = CYAN;
        ctx.globalAlpha = glow * 0.7;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 16 + glow * 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = CYAN;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(9, 9);
      ctx.lineTo(0, 5);
      ctx.lineTo(-9, 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = MAGENTA;
      ctx.globalAlpha = holding ? 0.95 : 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(now / 120));
      ctx.beginPath();
      ctx.moveTo(-3.5, 8);
      ctx.lineTo(0, holding ? 18 : 14);
      ctx.lineTo(3.5, 8);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointercancel', onLeave);
      io.disconnect();
      ro.disconnect();
    };
  }, [skip]);

  if (skip) {
    return <div className="about-defense about-defense-static" aria-hidden="true" />;
  }

  return (
    <div
      ref={host}
      className="about-defense"
      role="img"
      aria-label="Signal defense. Move to steer the craft. Click or hold to fire."
    >
      <canvas ref={canvasRef} />
      <p ref={hintRef} className="about-defense-hint">
        MOVE TO STEER · CLICK TO FIRE
      </p>
      <p ref={tallyRef} className="about-defense-tally">
        INTERCEPTS 00
      </p>
    </div>
  );
}
