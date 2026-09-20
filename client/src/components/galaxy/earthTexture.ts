import type * as THREE from 'three';

type Three = typeof import('three');

/** NASA Blue Marble (public domain). Fallback is a painted globe if the file fails to load. */
export async function loadEarthTexture(THREE: Three) {
  const loader = new THREE.TextureLoader();
  try {
    const tex = await loader.loadAsync('/textures/earth.jpg');
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  } catch {
    return makeProceduralEarth(THREE);
  }
}

export function makeCloudTexture(THREE: Three) {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i += 1) {
      const x = Math.random() * w;
      const y = 20 + Math.random() * (h - 40);
      const rw = 18 + Math.random() * 55;
      const rh = 6 + Math.random() * 16;
      ctx.fillStyle = `rgba(255,255,255,${0.12 + Math.random() * 0.28})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rw, rh, Math.random() * 0.8 - 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeProceduralEarth(THREE: Three) {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, '#d8eef8');
    ocean.addColorStop(0.12, '#1a5f9c');
    ocean.addColorStop(0.5, '#0c3d73');
    ocean.addColorStop(0.88, '#1a5f9c');
    ocean.addColorStop(1, '#e8f4fa');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);

    const land = (lon: number, lat: number, rx: number, ry: number, rot = 0, color = '#2f7a3a') => {
      const x = ((lon + 180) / 360) * w;
      const y = ((90 - lat) / 180) * h;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    land(-100, 45, 95, 48, -0.35, '#3d8a42');
    land(-58, -12, 55, 70, 0.25, '#2f6b34');
    land(10, 50, 70, 38, 0.15, '#4a8f45');
    land(20, 5, 48, 55, 0.1, '#5a8a38');
    land(80, 55, 90, 40, 0.05, '#3a7a40');
    land(78, 22, 38, 28, 0.2, '#4d8f3c');
    land(100, 0, 70, 42, 0.1, '#2d6b38');
    land(135, -25, 55, 42, 0.3, '#6a8a3a');
    land(0, -90, 180, 36, 0, '#e8f0f6');
    land(0, 90, 180, 28, 0, '#e8f0f6');
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function orientEarthToIndia(earth: THREE.Object3D) {
  const lon = 73.8;
  const lat = 20;
  earth.rotation.y = ((-lon - 90) * Math.PI) / 180;
  earth.rotation.x = (lat * Math.PI) / 180 * 0.12;
}
