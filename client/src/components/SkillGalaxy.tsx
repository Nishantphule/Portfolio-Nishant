import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  SKILL_CATEGORY_ORDER,
  SKILL_META,
  skillGroups,
  skills,
  type Skill,
} from '../data/profile';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { placeNear } from '../lib/placeNear';
import { scrollToId } from '../lib/smoothScroll';
import SkillIcon from './SkillIcon';
import { createTravelBodies } from './galaxy/galaxyBodies';
import { loadEarthTexture, makeCloudTexture, orientEarthToIndia } from './galaxy/earthTexture';
import {
  siDjango,
  siDocker,
  siExpo,
  siExpress,
  siFirebase,
  siGithub,
  siHtml5,
  siMongodb,
  siMysql,
  siN8n,
  siNodedotjs,
  siPostman,
  siPython,
  siRazorpay,
  siReact,
  siSequelize,
} from 'simple-icons';

const HEX: Record<string, string> = {
  cyan: '#00e5ff',
  amber: '#ff9d3d',
  magenta: '#ff2d78',
  violet: '#8b5cf6',
  lime: '#c6ff3d',
};

const BRAND: Record<string, string> = {
  nodedotjs: siNodedotjs.path,
  express: siExpress.path,
  django: siDjango.path,
  python: siPython.path,
  mongodb: siMongodb.path,
  mysql: siMysql.path,
  sequelize: siSequelize.path,
  n8n: siN8n.path,
  docker: siDocker.path,
  github: siGithub.path,
  react: siReact.path,
  expo: siExpo.path,
  firebase: siFirebase.path,
  html5: siHtml5.path,
  postman: siPostman.path,
  razorpay: siRazorpay.path,
};

const Z_GAP = 14;
const LAUNCH = 0;
const EARTH = SKILL_CATEGORY_ORDER.length + 1;
const LAST = EARTH;
const SWIPE = 56;
const BACKEND = 1;

function canWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function isLowEnd() {
  return typeof navigator !== 'undefined' && !!navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function clusterOrigin(catIndex: number) {
  return { x: 0, y: 0.05, z: -catIndex * Z_GAP };
}

function earthPos() {
  return { x: 0, y: -0.15, z: -SKILL_CATEGORY_ORDER.length * Z_GAP - 8 };
}

function camForStop(stop: number) {
  if (stop === LAUNCH) return { pos: { x: 0, y: 0.32, z: 11 }, look: { x: 0, y: 0, z: 0 } };
  if (stop === EARTH) {
    const e = earthPos();
    return { pos: { x: 0.12, y: 0.38, z: e.z + 3.2 }, look: e };
  }
  const o = clusterOrigin(stop - 1);
  return { pos: { x: 0, y: 0.18, z: o.z + 3.4 }, look: o };
}

function SkillList() {
  return (
    <div className="galaxy-list" data-lenis-prevent data-lenis-prevent-wheel data-lenis-prevent-touch>
      {skillGroups.map((g) => (
        <section key={g.id}>
          <h3>{g.label}</h3>
          <ul>
            {g.items.map((s) => (
              <li key={s.name}>
                <strong>{s.name}</strong>
                {s.blurb ? <span>{s.blurb}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function galaxyCapable(reduced: boolean) {
  if (typeof window === 'undefined') return false;
  return !reduced && canWebGL() && !isLowEnd();
}

export default function SkillGalaxy() {
  const reduced = usePrefersReducedMotion();
  const [can3d, setCan3d] = useState(() =>
    galaxyCapable(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
  );
  const [listMode, setListMode] = useState(() => !can3d);

  useEffect(() => {
    const ok = galaxyCapable(reduced);
    setCan3d(ok);
    if (!ok) setListMode(true);
  }, [reduced]);

  return (
    <div className="galaxy">
      {can3d && !listMode ? (
        <ul className="sr-only">
          {skills.map((s) => (
            <li key={s.name}>
              {s.name}
              {s.blurb ? ` — ${s.blurb}` : ''}
            </li>
          ))}
        </ul>
      ) : null}
      {can3d ? (
        <button type="button" className="galaxy-toggle" onClick={() => setListMode((v) => !v)}>
          {listMode ? 'View galaxy' : 'View as list'}
        </button>
      ) : null}
      {listMode || !can3d ? <SkillList /> : <GalaxyFlight />}
    </div>
  );
}

type FlightApi = {
  go: (stop: number, ms?: number, rumble?: boolean) => void;
  launch: () => void;
  busy: () => boolean;
};

function GalaxyFlight() {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const api = useRef<FlightApi | null>(null);
  const stopRef = useRef(LAUNCH);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const [stop, setStop] = useState(LAUNCH);
  const [busy, setBusy] = useState(false);
  const [ignited, setIgnited] = useState(false);
  const [igniting, setIgniting] = useState(false);
  const [locked, setLocked] = useState<Skill | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const [reentry, setReentry] = useState(false);
  const reduced = usePrefersReducedMotion();

  stopRef.current = stop;

  const cat = stop >= 1 && stop <= SKILL_CATEGORY_ORDER.length ? SKILL_CATEGORY_ORDER[stop - 1] : null;
  const catSkills = cat ? skills.filter((s) => s.category === cat) : [];
  const meta = cat ? SKILL_META[cat] : null;
  const atPad = stop === LAUNCH && !ignited;

  const go = useCallback((next: number, ms?: number, rumble = false) => {
    const clamped = Math.max(LAUNCH, Math.min(LAST, next));
    if (clamped === stopRef.current && !ms) return;
    if (api.current?.busy()) return;
    setLocked(null);
    if (clamped === LAUNCH) {
      setIgnited(false);
      setIgniting(false);
    }
    if (clamped === EARTH) setIgnited(true);
    setStop(clamped);
    if (!api.current) return;
    setBusy(true);
    api.current.go(clamped, ms, rumble);
  }, []);

  const ignite = useCallback(() => {
    if (api.current?.busy()) return;
    if (stopRef.current !== LAUNCH) return;
    setLocked(null);
    setIgniting(true);
    setIgnited(true);
    setStop(BACKEND);
    if (!api.current) return;
    setBusy(true);
    api.current.launch();
  }, []);

  useEffect(() => {
    if (!busy) setIgniting(false);
  }, [busy]);

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    const onKey = (e: KeyboardEvent) => {
      const skillsEl = document.getElementById('skills');
      const active = document.activeElement;
      const inSkills = !!(skillsEl && active && skillsEl.contains(active));
      const inHost = el === active || el.contains(active);
      if (!inSkills && !inHost) return;
      if ((e.key === 'Enter' || e.key === ' ') && stopRef.current === LAUNCH && !ignited) {
        e.preventDefault();
        ignite();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (stopRef.current === LAUNCH && !ignited) ignite();
        else go(stopRef.current + 1, stopRef.current === SKILL_CATEGORY_ORDER.length ? 1700 : 700);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(stopRef.current - 1, 700);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, ignite, ignited]);

  useLayoutEffect(() => {
    if (!locked || !panelRef.current) {
      setTip(null);
      return;
    }
    const key = `${locked.category}:${locked.name}`;
    const btn = btnRefs.current[key];
    const panel = panelRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setTip(
      placeNear(
        { x: r.left, y: r.top, w: r.width, h: r.height },
        { w: panel.offsetWidth || 280, h: panel.offsetHeight || 120 },
        { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight },
      ),
    );
  }, [locked]);

  useEffect(() => {
    const canvasHost = view.current;
    const shell = host.current;
    if (!canvasHost || !shell) return undefined;
    const mount: HTMLDivElement = canvasHost;

    let dead = false;
    let gen = 0;
    let live = false;
    let disposeWorld = () => {};

    const boot = async () => {
      if (live) return;
      live = true;
      const my = ++gen;
      const THREE = await import('three');
      if (dead || my !== gen || !view.current) {
        live = false;
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(46, 1, 0.08, 120);
      const here = camForStop(stopRef.current);
      camera.position.set(here.pos.x, here.pos.y, here.pos.z);
      const look = new THREE.Vector3(here.look.x, here.look.y, here.look.z);
      camera.lookAt(look);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      mount.appendChild(renderer.domElement);

      const mobile = window.matchMedia('(max-width: 768px)').matches;
      const starCount = mobile ? 200 : 480;
      const starPos = new Float32Array(starCount * 3);
      const starCol = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i += 1) {
        starPos[i * 3] = (Math.random() - 0.5) * 32;
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
        starPos[i * 3 + 2] = -Math.random() * 120 + 8;
        const c = Math.random();
        if (c > 0.9) {
          starCol[i * 3] = 0.35;
          starCol[i * 3 + 1] = 0.85;
          starCol[i * 3 + 2] = 1;
        } else {
          const v = 0.55 + Math.random() * 0.45;
          starCol[i * 3] = v;
          starCol[i * 3 + 1] = v;
          starCol[i * 3 + 2] = v;
        }
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
      const starMat = new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.055,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        depthWrite: false,
      });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      type NodeMark = {
        skill: Skill;
        key: string;
        sprite: InstanceType<typeof THREE.Sprite>;
        mat: InstanceType<typeof THREE.SpriteMaterial>;
        baseScale: number;
        restY: number;
        phase: number;
        idx: number;
      };
      const nodes: NodeMark[] = [];

      SKILL_CATEGORY_ORDER.forEach((catId, ci) => {
        const items = skills.filter((s) => s.category === catId);
        const origin = clusterOrigin(ci);
        const accent = HEX[SKILL_META[catId].accent];
        items.forEach((s, i) => {
          const tex = makeSkillTexture(THREE, s, accent);
          const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, opacity: 0.04 });
          const sprite = new THREE.Sprite(mat);
          sprite.renderOrder = 8;
          const ox = ((i % 3) - 1) * 0.82 + (i * 0.04 - 0.08);
          const oy = (Math.floor(i / 3) - 0.45) * 0.58 + ((i % 2) * 0.12 - 0.06);
          const oz = (i % 4) * 0.16 - 0.22;
          sprite.position.set(origin.x + ox, origin.y + oy, origin.z + oz);
          const base = (mobile ? 1.25 : 1.45) + (oz + 0.3) * 0.1;
          sprite.scale.setScalar(0.001);
          scene.add(sprite);
          nodes.push({
            skill: s,
            key: `${catId}:${s.name}`,
            sprite,
            mat,
            baseScale: base,
            restY: sprite.position.y,
            phase: i * 0.7,
            idx: i,
          });
        });
      });

      const e = earthPos();
      const earthTex = await loadEarthTexture(THREE);
      if (dead || my !== gen) {
        earthTex.dispose();
        live = false;
        renderer.dispose();
        renderer.domElement.remove();
        return;
      }
      const cloudTex = makeCloudTexture(THREE);
      const earthGeo = new THREE.SphereGeometry(1.55, 48, 32);
      const earthMat = new THREE.MeshBasicMaterial({ map: earthTex });
      const earth = new THREE.Mesh(earthGeo, earthMat);
      earth.position.set(e.x, e.y, e.z);
      orientEarthToIndia(earth);
      const earthBaseY = earth.rotation.y;
      scene.add(earth);

      const cloudGeo = new THREE.SphereGeometry(1.58, 32, 24);
      const cloudMat = new THREE.MeshBasicMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      });
      const clouds = new THREE.Mesh(cloudGeo, cloudMat);
      clouds.position.copy(earth.position);
      scene.add(clouds);

      const atmGeo = new THREE.SphereGeometry(1.72, 32, 24);
      const atmMat = new THREE.MeshBasicMaterial({
        color: 0x4db8ff,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      });
      const atm = new THREE.Mesh(atmGeo, atmMat);
      atm.position.copy(earth.position);
      scene.add(atm);

      const bodies = createTravelBodies(THREE, {
        mobile,
        earth: new THREE.Vector3(e.x, e.y, e.z),
      });
      scene.add(bodies.group);

      let tween: {
        fromP: InstanceType<typeof THREE.Vector3>;
        toP: InstanceType<typeof THREE.Vector3>;
        fromL: InstanceType<typeof THREE.Vector3>;
        toL: InstanceType<typeof THREE.Vector3>;
        t0: number;
        dur: number;
        rumble: boolean;
      } | null = null;
      let currentStop = stopRef.current;
      let arriveAt = performance.now();
      let raf = 0;
      const camDir = new THREE.Vector3(0, 0, -1);

      function resize() {
        const box = mount.getBoundingClientRect();
        const w = Math.max(1, box.width);
        const h = Math.max(1, box.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }

      const ro = new ResizeObserver(resize);
      ro.observe(mount);
      resize();

      const projected = new THREE.Vector3();

      function startTween(next: number, ms: number, rumble: boolean) {
        const b = camForStop(next);
        tween = {
          fromP: camera.position.clone(),
          toP: new THREE.Vector3(b.pos.x, b.pos.y, b.pos.z),
          fromL: look.clone(),
          toL: new THREE.Vector3(b.look.x, b.look.y, b.look.z),
          t0: performance.now(),
          dur: ms,
          rumble,
        };
        camDir.copy(tween.toP).sub(tween.fromP);
        if (camDir.lengthSq() < 0.0001) camDir.set(0, 0, -1);
        else camDir.normalize();
        currentStop = next;
        arriveAt = performance.now();
      }

      api.current = {
        busy: () => !!tween,
        go(next, ms = 700, rumble = false) {
          startTween(next, ms, rumble);
        },
        launch() {
          startTween(BACKEND, 1600, true);
        },
      };

      const tick = (now: number) => {
        if (dead || my !== gen) return;
        raf = requestAnimationFrame(tick);

        let streak = 0;
        if (tween) {
          const u = Math.min(1, (now - tween.t0) / tween.dur);
          const k = easeInOut(u);
          camera.position.lerpVectors(tween.fromP, tween.toP, k);
          look.lerpVectors(tween.fromL, tween.toL, k);
          streak = tween.rumble ? Math.sin(u * Math.PI) : Math.sin(u * Math.PI) * 0.55;
          if (tween.rumble) {
            const shake = (1 - u) * 0.05;
            camera.position.x += Math.sin(now * 0.07) * shake;
            camera.position.y += Math.cos(now * 0.09) * shake;
          }
          camera.lookAt(look);
          if (u >= 1) {
            tween = null;
            setBusy(false);
          }
        }

        stars.rotation.y = now * 0.000018;
        earth.rotation.y = earthBaseY + now * 0.00008;
        clouds.rotation.y = earth.rotation.y * 1.15;
        atm.rotation.y = earth.rotation.y;
        bodies.tick({ now, streak, camDir });

        const destCat = SKILL_CATEGORY_ORDER[currentStop - 1];
        nodes.forEach((n) => {
          const active = n.skill.category === destCat;
          const t = Math.min(1, Math.max(0, (now - arriveAt - n.idx * 70) / 480));
          const appear = active ? easeInOut(t) : 0.04;
          const overshoot = active && t < 1 ? 1 + Math.sin(t * Math.PI) * 0.15 : 1;
          const pulse = active ? 1 + Math.sin(now * 0.0022 + n.phase) * 0.045 : 1;
          const bob = active ? Math.sin(now * 0.0016 + n.phase) * 0.03 : 0;
          n.sprite.scale.setScalar(Math.max(0.001, n.baseScale * appear * overshoot * pulse));
          n.sprite.position.y = n.restY + bob;
          n.mat.opacity = appear;
        });

        const box = mount.getBoundingClientRect();
        nodes.forEach((n) => {
          const el = btnRefs.current[n.key];
          if (!el) return;
          const active = n.skill.category === destCat;
          projected.copy(n.sprite.position).project(camera);
          const on = active && projected.z < 1 && Math.abs(projected.x) < 1.15 && Math.abs(projected.y) < 1.15;
          if (!on) {
            el.style.display = 'none';
            return;
          }
          el.style.display = 'block';
          el.style.left = `${(projected.x * 0.5 + 0.5) * box.width - 24}px`;
          el.style.top = `${(-projected.y * 0.5 + 0.5) * box.height - 24}px`;
        });

        renderer.render(scene, camera);
      };

      disposeWorld = () => {
        live = false;
        cancelAnimationFrame(raf);
        ro.disconnect();
        api.current = null;
        setBusy(false);
        bodies.dispose();
        starGeo.dispose();
        starMat.dispose();
        earthGeo.dispose();
        earthMat.dispose();
        earthTex.dispose();
        cloudGeo.dispose();
        cloudMat.dispose();
        cloudTex.dispose();
        atmGeo.dispose();
        atmMat.dispose();
        nodes.forEach((n) => {
          n.mat.map?.dispose();
          n.mat.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };

      if (dead || my !== gen) {
        disposeWorld();
        disposeWorld = () => {};
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void boot();
        else {
          gen += 1;
          live = false;
          disposeWorld();
          disposeWorld = () => {};
        }
      },
      { rootMargin: '20% 0px' },
    );
    io.observe(shell);

    return () => {
      dead = true;
      gen += 1;
      io.disconnect();
      disposeWorld();
      api.current = null;
    };
  }, []);

  function next() {
    if (atPad) {
      ignite();
      return;
    }
    go(stop + 1, stop === SKILL_CATEGORY_ORDER.length ? 1700 : 700);
  }
  function prev() {
    go(stop - 1, 700);
  }
  function flyAgain() {
    go(LAUNCH, 900);
  }

  function talk() {
    if (reentry) return;
    if (reduced) {
      scrollToId('contact');
      return;
    }
    setReentry(true);
    window.setTimeout(() => {
      scrollToId('contact');
      window.setTimeout(() => setReentry(false), 900);
    }, 720);
  }

  const visorText = igniting
    ? 'IGNITION'
    : stop === LAUNCH
      ? 'HOLD — AWAITING IGNITION'
      : meta
        ? `[ ${meta.label.toUpperCase()} ]`
        : stop === EARTH
          ? 'TOUCHDOWN'
          : 'LAUNCH — SKILL GALAXY';

  return (
    <div ref={host} className="galaxy-flight" tabIndex={0} data-accent={meta?.accent ?? 'cyan'}>
      <div
        ref={view}
        className="galaxy-view"
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          if (!swipe.current) return;
          const dx = e.clientX - swipe.current.x;
          const dy = e.clientY - swipe.current.y;
          swipe.current = null;
          if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy)) return;
          if (dx < 0) next();
          else prev();
        }}
      />

      <div className="galaxy-cockpit" aria-hidden="true">
        <div className="galaxy-canopy-top" />
        <div className="galaxy-pillar galaxy-pillar-l" />
        <div className="galaxy-pillar galaxy-pillar-r" />
        <div className="galaxy-glass" />
        <span className="galaxy-rivet galaxy-rivet-tl" />
        <span className="galaxy-rivet galaxy-rivet-tr" />
        <span className="galaxy-rivet galaxy-rivet-bl" />
        <span className="galaxy-rivet galaxy-rivet-br" />
      </div>

      <p className="galaxy-readout">{visorText}</p>

      {atPad ? (
        <button type="button" className="galaxy-ignition" onClick={ignite} disabled={busy} aria-label="Ignition">
          <span>IGNITION</span>
        </button>
      ) : null}

      {stop === EARTH ? (
        <div className="galaxy-earth">
          <p className="galaxy-earth-title">TOUCHDOWN — NASHIK, INDIA</p>
          <p className="galaxy-earth-line">Backend systems. Applied AI. Ready to ship.</p>
          <div className="galaxy-earth-actions">
            <button type="button" className="galaxy-btn is-cta" onClick={talk}>
              Let&apos;s talk
            </button>
            <button type="button" className="galaxy-btn" onClick={flyAgain}>
              Fly through again
            </button>
          </div>
        </div>
      ) : null}

      <div className="galaxy-nodes">
        {catSkills.map((s) => {
          const key = `${s.category}:${s.name}`;
          return (
            <button
              key={key}
              type="button"
              className="galaxy-node-hit"
              ref={(el) => {
                btnRefs.current[key] = el;
              }}
              aria-label={`${s.name}, ${meta?.label} skill`}
              onClick={() => setLocked((cur) => (cur?.name === s.name ? null : s))}
            />
          );
        })}
      </div>

      <div className="galaxy-bar">
        <button type="button" className="galaxy-btn" onClick={prev} disabled={busy || stop === LAUNCH} aria-label="Previous sector">
          Previous
        </button>
        <div className="galaxy-progress">
          <p>
            {igniting
              ? 'IGNITION'
              : stop === LAUNCH
                ? 'LAUNCH'
                : stop === EARTH
                  ? 'ARRIVAL — EARTH'
                  : `SECTOR ${stop} / 6 — ${meta?.label.toUpperCase()}`}
          </p>
          <div className="galaxy-segs" aria-hidden="true">
            {SKILL_CATEGORY_ORDER.map((id, i) => (
              <span key={id} className={stop > i ? 'is-on' : ''} />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="galaxy-btn"
          onClick={next}
          disabled={busy || stop === EARTH || atPad}
          aria-label="Next sector"
        >
          Next
        </button>
        <button type="button" className="galaxy-btn galaxy-skip" onClick={() => go(EARTH, 1700)} disabled={busy || stop === EARTH}>
          Skip to Earth
        </button>
      </div>

      {reentry ? (
        <div className="galaxy-reentry" role="status" aria-live="polite">
          <span className="galaxy-reentry-heat" />
          <span className="galaxy-reentry-streak galaxy-reentry-s1" />
          <span className="galaxy-reentry-streak galaxy-reentry-s2" />
          <span className="galaxy-reentry-streak galaxy-reentry-s3" />
          <p>ENTERING ATMO</p>
        </div>
      ) : null}

      {locked ? (
        <div
          ref={panelRef}
          className="galaxy-detail"
          data-accent={SKILL_META[locked.category].accent}
          style={{ left: tip?.x ?? 12, top: tip?.y ?? 12, visibility: tip ? 'visible' : 'hidden' }}
          role="status"
        >
          <div className="galaxy-detail-head">
            <SkillIcon icon={locked.icon} size={18} />
            <div>
              <p>{SKILL_META[locked.category].label}</p>
              <h3>{locked.name}</h3>
            </div>
            <button type="button" className="galaxy-detail-close" onClick={() => setLocked(null)} aria-label="Dismiss skill detail">
              Close
            </button>
          </div>
          {locked.blurb ? <p>{locked.blurb}</p> : <p className="is-empty">No additional detail on file.</p>}
        </div>
      ) : null}
    </div>
  );
}

function makeSkillTexture(THREE: typeof import('three'), skill: Skill, accent: string) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const glow = ctx.createRadialGradient(128, 96, 6, 128, 96, 88);
  glow.addColorStop(0, `${accent}cc`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#ffffff';
  const path = skill.icon && !skill.icon.startsWith('lucide:') ? BRAND[skill.icon] : null;
  if (path) {
    ctx.save();
    ctx.translate(128, 92);
    ctx.scale(2.35, 2.35);
    ctx.translate(-12, -12);
    ctx.fill(new Path2D(path));
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.moveTo(128, 68);
    ctx.lineTo(148, 108);
    ctx.lineTo(108, 108);
    ctx.closePath();
    ctx.fill();
  }

  ctx.font = '600 20px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4f6fa';
  wrapName(ctx, skill.name, 128, 186, 210, 22);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function wrapName(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}
