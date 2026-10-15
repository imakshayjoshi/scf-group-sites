/* SCF hero 3D — procedural metal parts, studio-lit, spring-smoothed pointer parallax.
   Full-bleed: canvas fills the hero panel, model staged right-of-center.
   Config: { kind: 'plate' | 'blank', accent: 0xRRGGBB, mount: selector } */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function makeFlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#888888';
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = '#4a4a4a';
  g.lineWidth = 7;
  g.lineCap = 'round';
  const lanes = 7, margin = 86, gap = (512 - margin * 2) / lanes;
  for (let i = 0; i <= lanes; i++) {
    g.beginPath();
    const x = margin + i * gap;
    g.moveTo(x, margin);
    const segs = 6, amp = 26;
    for (let s = 0; s < segs; s++) {
      const y0 = margin + (s * (512 - margin * 2)) / segs;
      const y1 = margin + ((s + 1) * (512 - margin * 2)) / segs;
      g.bezierCurveTo(x + (s % 2 ? amp : -amp), y0 + (y1 - y0) * 0.33, x + (s % 2 ? amp : -amp), y0 + (y1 - y0) * 0.66, x, y1);
    }
    g.stroke();
  }
  g.fillStyle = '#3d3d3d';
  const r = 34, off = 52;
  [[off, off], [512 - off, off], [off, 512 - off], [512 - off, 512 - off]].forEach(([x, y]) => {
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

function makeBrushTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#909090';
  g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 2) {
    const v = 130 + Math.floor(Math.random() * 40);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(0, y, 512, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeGlowTexture(accent) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const col = new THREE.Color(accent);
  const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
  const grad = g.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0, `rgba(${rgb},0.55)`);
  grad.addColorStop(0.5, `rgba(${rgb},0.18)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function buildPlate(accent) {
  const shape = roundedRectShape(2.3, 3.1, 0.28);
  const holeR = 0.17, hx = 0.86, hy = 1.26;
  [[-hx, -hy], [hx, -hy], [-hx, hy], [hx, hy]].forEach(([x, y]) => {
    const h = new THREE.Path();
    h.absarc(x, y, holeR, 0, Math.PI * 2, true);
    shape.holes.push(h);
  });
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 48 });
  geo.center();
  const face = new THREE.MeshStandardMaterial({
    color: 0xc4cbd2, metalness: 0.92, roughness: 0.3,
    bumpMap: makeFlowTexture(), bumpScale: 0.6,
  });
  const mesh = new THREE.Mesh(geo, face);
  mesh.rotation.x = -0.32;
  const grp = new THREE.Group();
  grp.add(mesh);
  const edge = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundedRectShape(2.42, 3.22, 0.3), { depth: 0.04, bevelEnabled: false, curveSegments: 48 }),
    new THREE.MeshStandardMaterial({ color: accent, metalness: 0.5, roughness: 0.4 })
  );
  edge.position.z = -0.09;
  edge.rotation.x = -0.32;
  grp.add(edge);
  return grp;
}

function buildBlank(accent) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1.25, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.42, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 3, curveSegments: 64 });
  geo.center();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xbcc4cc, metalness: 0.9, roughness: 0.36,
    bumpMap: makeBrushTexture(), bumpScale: 0.25,
  });
  const grp = new THREE.Group();
  const ring = new THREE.Mesh(geo, mat);
  grp.add(ring);
  const puck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.14, 48),
    new THREE.MeshStandardMaterial({ color: accent, metalness: 0.6, roughness: 0.35 })
  );
  puck.position.set(1.6, -0.9, 0.5);
  puck.rotation.set(Math.PI / 2.3, 0.4, 0.2);
  grp.add(puck);
  grp.rotation.x = -0.12;
  return grp;
}

export function initHero3D(cfg) {
  const mount = document.querySelector(cfg.mount);
  if (!mount) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  mount.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.35, 6.1);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  if ('environmentIntensity' in scene) scene.environmentIntensity = 1.25;

  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(4, 6, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(cfg.accent, 2.6);
  rim.position.set(-6, -2, -4);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  // accent glow bloom behind the model
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(7.5, 7.5),
    new THREE.MeshBasicMaterial({ map: makeGlowTexture(cfg.accent), transparent: true, depthWrite: false })
  );
  glow.position.set((cfg.modelX ?? 1.95), 0, -2.2);
  scene.add(glow);

  const model = cfg.kind === 'plate' ? buildPlate(cfg.accent) : buildBlank(cfg.accent);
  model.scale.setScalar((cfg.kind === 'plate' ? 1.28 : 1.18) * (cfg.modelScale || 1));
  const baseY = cfg.kind === 'plate' ? 0.05 : 0.18;
  model.position.set((cfg.modelX ?? 1.95), baseY, 0);
  scene.add(model);

  let tx = 0, ty = 0, rx = 0, ry = 0;
  window.addEventListener('pointermove', (e) => {
    const r = mount.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    tx = (e.clientX / innerWidth - 0.5) * 0.5;
    ty = (e.clientY / innerHeight - 0.5) * 0.35;
  }, { passive: true });

  function resize() {
    const w = mount.clientWidth, h = mount.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // narrow screens: pull model back to center so it stays visible
    model.position.x = w < 760 ? 0 : ((cfg.modelX ?? 1.95));
    glow.position.x = w < 760 ? 0 : (cfg.modelX ?? 1.95);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.02 }).observe(mount);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    rx += (tx - rx) * 0.045;
    ry += (ty - ry) * 0.045;
    model.rotation.y = t * (reduce ? 0 : 0.22) + rx * 2.2;
    const baseX = cfg.kind === 'plate' ? -0.32 : -0.12;
    model.rotation.x += ((baseX + ry * 1.4) - model.rotation.x) * 0.05;
    model.position.y = baseY + Math.sin(t * 0.8) * (reduce ? 0 : 0.07);
    renderer.render(scene, camera);
  }
  frame();
  if (reduce) renderer.render(scene, camera);
}
