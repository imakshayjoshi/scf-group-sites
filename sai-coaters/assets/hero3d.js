/* SCF hero 3D — procedural metal parts, studio-lit, spring-smoothed pointer parallax.
   Config: { kind: 'plate' | 'blank', accent: 0xFF6A00, mount: canvas selector } */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function makeFlowTexture() {
  // serpentine flow-field pattern for the fuel cell plate face
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
  // corner ports
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
  // fine horizontal brushed-metal lines
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
  // fuel cell bi-polar plate: rounded plate, 4 corner holes, serpentine face
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
    color: 0xb9c0c7, metalness: 0.92, roughness: 0.32,
    bumpMap: makeFlowTexture(), bumpScale: 0.6,
  });
  const mesh = new THREE.Mesh(geo, face);
  mesh.rotation.x = -0.35;
  const grp = new THREE.Group();
  grp.add(mesh);
  // thin accent edge underlay for pop
  const edge = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundedRectShape(2.42, 3.22, 0.3), { depth: 0.04, bevelEnabled: false, curveSegments: 48 }),
    new THREE.MeshStandardMaterial({ color: accent, metalness: 0.5, roughness: 0.4 })
  );
  edge.position.z = -0.09;
  edge.rotation.x = -0.35;
  grp.add(edge);
  return grp;
}

function buildBlank(accent) {
  // stamped blank: flat ring with center punch + small satellite puck
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1.25, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.42, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 3, curveSegments: 64 });
  geo.center();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xb4bcc4, metalness: 0.9, roughness: 0.38,
    bumpMap: makeBrushTexture(), bumpScale: 0.25,
  });
  const grp = new THREE.Group();
  const ring = new THREE.Mesh(geo, mat);
  grp.add(ring);
  // the punched-out puck, loose, slightly tilted beside the ring
  const puck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.14, 48),
    new THREE.MeshStandardMaterial({ color: accent, metalness: 0.6, roughness: 0.35 })
  );
  puck.position.set(1.9, -0.5, 0.25);
  puck.rotation.set(Math.PI / 2.3, 0.4, 0.2);
  grp.add(puck);
  grp.rotation.x = -0.4;
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

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.45, 6.3);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // key + accent rim lights
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(cfg.accent, 2.4);
  rim.position.set(-6, -2, -4);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  const model = cfg.kind === 'plate' ? buildPlate(cfg.accent) : buildBlank(cfg.accent);
  model.scale.setScalar(1.12);
  model.position.y = 0.15;
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
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
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
    // spring-smoothed parallax + idle spin + gentle float
    rx += (tx - rx) * 0.045;
    ry += (ty - ry) * 0.045;
    model.rotation.y = t * (reduce ? 0 : 0.22) + rx * 2.2;
    model.rotation.x += (((cfg.kind === 'plate' ? -0.35 : -0.4) + ry * 1.4) - model.rotation.x) * 0.05;
    model.position.y = Math.sin(t * 0.8) * (reduce ? 0 : 0.07);
    renderer.render(scene, camera);
  }
  frame();
  if (reduce) renderer.render(scene, camera);
}
