type Three = typeof import('three');
type Vec3 = InstanceType<typeof import('three').Vector3>;

type BodyTick = {
  now: number;
  streak: number;
  camDir: Vec3;
};

export function createTravelBodies(THREE: Three, opts: { mobile: boolean; earth: Vec3 }) {
  const group = new THREE.Group();
  const mats: { dispose: () => void }[] = [];
  const geos: { dispose: () => void }[] = [];
  const texs: { dispose: () => void }[] = [];

  const planets: { mesh: InstanceType<typeof THREE.Mesh>; spin: number }[] = [];
  const moons: {
    mesh: InstanceType<typeof THREE.Mesh>;
    anchor: Vec3;
    radius: number;
    speed: number;
    phase: number;
    y: number;
  }[] = [];
  const rocks: InstanceType<typeof THREE.Mesh>[] = [];

  const planetSpecs: { z: number; x: number; y: number; r: number; kind: PlanetKind }[] = [
    { z: -6, x: 13.5, y: -1.6, r: 0.72, kind: 'gas' },
    { z: -20, x: -13.8, y: 1.4, r: 0.48, kind: 'desert' },
    { z: -34, x: 14.2, y: -1.2, r: 0.82, kind: 'ice' },
    { z: -48, x: -13.4, y: 1.6, r: 0.42, kind: 'lava' },
    { z: -63, x: 13.9, y: -1.5, r: 0.58, kind: 'teal' },
  ];

  planetSpecs.forEach((p) => {
    const tex = makePlanetTexture(THREE, p.kind);
    texs.push(tex);
    const geo = new THREE.SphereGeometry(p.r, 24, 16);
    geos.push(geo);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    mats.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(p.x, p.y, p.z);
    group.add(mesh);
    planets.push({ mesh, spin: 0.00008 + Math.random() * 0.00012 });

    if (p.kind === 'ice' || p.kind === 'gas') {
      const mgeo = new THREE.SphereGeometry(p.r * 0.22, 12, 8);
      geos.push(mgeo);
      const mmat = new THREE.MeshBasicMaterial({ color: 0xc8d0d8 });
      mats.push(mmat);
      const moon = new THREE.Mesh(mgeo, mmat);
      group.add(moon);
      moons.push({
        mesh: moon,
        anchor: mesh.position.clone(),
        radius: p.r + 0.95,
        speed: 0.0007 + Math.random() * 0.0004,
        phase: Math.random() * Math.PI * 2,
        y: p.y,
      });
    }
  });

  const earthMoonGeo = new THREE.SphereGeometry(0.22, 12, 8);
  geos.push(earthMoonGeo);
  const earthMoonMat = new THREE.MeshBasicMaterial({ color: 0xb8b4a8 });
  mats.push(earthMoonMat);
  const earthMoon = new THREE.Mesh(earthMoonGeo, earthMoonMat);
  group.add(earthMoon);
  moons.push({
    mesh: earthMoon,
    anchor: new THREE.Vector3(opts.earth.x + 3.4, opts.earth.y, opts.earth.z),
    radius: 1.15,
    speed: 0.00045,
    phase: 0.6,
    y: opts.earth.y + 0.35,
  });

  const rockN = opts.mobile ? 12 : 28;
  const rockGeo = new THREE.IcosahedronGeometry(0.12, 0);
  geos.push(rockGeo);
  for (let i = 0; i < rockN; i += 1) {
    const mat = new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0x6a5a48 : i % 3 === 1 ? 0x8a7a68 : 0x4a4038,
    });
    mats.push(mat);
    const mesh = new THREE.Mesh(rockGeo, mat);
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (8.8 + (i % 5) * 0.55);
    mesh.position.set(x, (i % 5) * 0.22 - 0.5, -41 + (i % 7) * 0.55 - 1.8);
    mesh.scale.set(0.7 + (i % 5) * 0.35, 0.5 + (i % 3) * 0.4, 0.8 + (i % 4) * 0.25);
    mesh.rotation.set(i, i * 0.4, i * 0.2);
    group.add(mesh);
    rocks.push(mesh);
  }

  const streakCount = opts.mobile ? 90 : 180;
  const streakPos = new Float32Array(streakCount * 6);
  const streakGeo = new THREE.BufferGeometry();
  streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
  geos.push(streakGeo);
  const streakMat = new THREE.LineBasicMaterial({
    color: 0xc8f6ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  mats.push(streakMat);
  const streaks = new THREE.LineSegments(streakGeo, streakMat);
  group.add(streaks);

  const bases: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < streakCount; i += 1) {
    const side = Math.random() < 0.5 ? -1 : 1;
    bases.push({
      x: side * (6.5 + Math.random() * 10),
      y: (Math.random() - 0.5) * 12,
      z: -Math.random() * 100 + 6,
    });
  }

  function tick(state: BodyTick) {
    planets.forEach((p) => {
      p.mesh.rotation.y += p.spin;
    });
    moons.forEach((m) => {
      const a = state.now * m.speed + m.phase;
      const side = Math.sign(m.anchor.x) || 1;
      m.mesh.position.set(
        m.anchor.x + side * (Math.abs(Math.cos(a)) * m.radius * 0.55 + m.radius * 0.25),
        m.y + Math.sin(a * 0.6) * 0.22,
        m.anchor.z + Math.sin(a) * m.radius,
      );
    });
    rocks.forEach((r, i) => {
      r.rotation.x += 0.004 + (i % 5) * 0.001;
      r.rotation.z += 0.003;
    });

    const len = 0.15 + state.streak * 1.8;
    streakMat.opacity = Math.min(0.85, state.streak * 1.15);
    const attr = streakGeo.getAttribute('position') as InstanceType<typeof THREE.BufferAttribute>;
    const dx = state.camDir.x;
    const dy = state.camDir.y;
    const dz = state.camDir.z;
    for (let i = 0; i < streakCount; i += 1) {
      const b = bases[i];
      attr.setXYZ(i * 2, b.x, b.y, b.z);
      attr.setXYZ(i * 2 + 1, b.x - dx * len, b.y - dy * len, b.z - dz * len);
    }
    attr.needsUpdate = true;
  }

  function dispose() {
    group.removeFromParent();
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    texs.forEach((t) => t.dispose());
  }

  return { group, tick, dispose };
}

type PlanetKind = 'gas' | 'desert' | 'ice' | 'lava' | 'teal';

function makePlanetTexture(THREE: Three, kind: PlanetKind) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const palettes: Record<PlanetKind, [string, string, string]> = {
      gas: ['#c4a574', '#8a5a32', '#e8d2a0'],
      desert: ['#c47a3a', '#8a4a1a', '#e0a060'],
      ice: ['#d8eef8', '#7aa0c8', '#f4fbff'],
      lava: ['#3a1010', '#c43a12', '#1a0808'],
      teal: ['#0a4a52', '#1a8a8a', '#063038'],
    };
    const [a, b, c] = palettes[kind];
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, a);
    g.addColorStop(0.45, b);
    g.addColorStop(1, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 8; i += 1) {
      ctx.fillStyle = i % 2 ? a : c;
      ctx.fillRect(0, 10 + i * 14, 256, 6 + (i % 3));
    }
    ctx.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
