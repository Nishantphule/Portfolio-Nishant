import { useEffect, useRef } from 'react';

/**
 * Option A — living system diagram (WebGL). Lazy-loaded; dispose on unmount.
 */
export default function HeroNetwork() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let dead = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import('three');
      if (dead || !host.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
      camera.position.z = 8;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      el.appendChild(renderer.domElement);

      const COUNT = 72;
      const positions = new Float32Array(COUNT * 3);
      const bases: { x: number; y: number; z: number }[] = [];
      for (let i = 0; i < COUNT; i += 1) {
        const x = (Math.random() - 0.5) * 10;
        const y = (Math.random() - 0.5) * 5.2;
        const z = (Math.random() - 0.5) * 3;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        bases.push({ x, y, z });
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const points = new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: 0x00e5ff,
          size: 0.07,
          transparent: true,
          opacity: 0.85,
          sizeAttenuation: true,
        }),
      );
      scene.add(points);

      const pulseCount = 8;
      const pulsePos = new Float32Array(pulseCount * 3);
      for (let i = 0; i < pulseCount; i += 1) {
        const src = bases[Math.floor((i / pulseCount) * COUNT)];
        pulsePos[i * 3] = src.x;
        pulsePos[i * 3 + 1] = src.y;
        pulsePos[i * 3 + 2] = src.z;
      }
      const pulseGeo = new THREE.BufferGeometry();
      pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
      const pulseMat = new THREE.PointsMaterial({
        color: 0xff2d78,
        size: 0.12,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
      });
      const pulse = new THREE.Points(pulseGeo, pulseMat);
      scene.add(pulse);

      const linePos: number[] = [];
      for (let i = 0; i < COUNT; i += 1) {
        for (let j = i + 1; j < COUNT; j += 1) {
          const dx = bases[i].x - bases[j].x;
          const dy = bases[i].y - bases[j].y;
          const dz = bases[i].z - bases[j].z;
          if (dx * dx + dy * dy + dz * dz < 2.4) {
            linePos.push(bases[i].x, bases[i].y, bases[i].z, bases[j].x, bases[j].y, bases[j].z);
          }
        }
      }
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
      const lines = new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.28 }),
      );
      scene.add(lines);

      const mouse = { x: 0, y: 0 };
      const onPointer = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        mouse.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      };
      window.addEventListener('pointermove', onPointer, { passive: true });

      const resize = () => {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      let visible = true;
      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
        },
        { threshold: 0.05 },
      );
      io.observe(el);

      const clock = new THREE.Clock();
      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible) return;
        const t = clock.getElapsedTime();
        const attr = geo.getAttribute('position') as InstanceType<typeof THREE.BufferAttribute>;
        for (let i = 0; i < COUNT; i += 1) {
          const b = bases[i];
          const pull = 0.35;
          attr.setXYZ(
            i,
            b.x + Math.sin(t * 0.4 + i) * 0.08 + mouse.x * pull * (b.z + 2) * 0.08,
            b.y + Math.cos(t * 0.35 + i * 0.4) * 0.08 + mouse.y * pull * 0.12,
            b.z,
          );
        }
        attr.needsUpdate = true;
        lines.rotation.y = t * 0.03 + mouse.x * 0.08;
        points.rotation.y = lines.rotation.y;
        pulse.rotation.y = lines.rotation.y;
        pulseMat.opacity = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3.1));
        renderer.render(scene, camera);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onPointer);
        ro.disconnect();
        io.disconnect();
        geo.dispose();
        lineGeo.dispose();
        pulseGeo.dispose();
        (points.material as InstanceType<typeof THREE.Material>).dispose();
        (lines.material as InstanceType<typeof THREE.Material>).dispose();
        pulseMat.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      dead = true;
      cleanup();
    };
  }, []);

  return <div ref={host} className="hero-network" aria-hidden="true" />;
}
