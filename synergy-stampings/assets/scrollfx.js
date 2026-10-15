/* ScrollFX — Apple-style scrollytelling: pinned scenes, word-by-word reveals,
   hero scroll-out, scroll-linked 3D. Vanilla JS, no deps. Mobile + reduced-motion safe. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => innerWidth < 761;
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---- smooth scroll value (lerped) ----
  let target = scrollY, smooth = scrollY, ticking = false;
  const scenes = [];

  function collect() {
    scenes.length = 0;
    document.querySelectorAll('[data-scene]').forEach(wrap => {
      scenes.push({ wrap, stage: wrap.querySelector('.scene-stage'), words: [...wrap.querySelectorAll('[data-word]')], sub: wrap.querySelector('.scene-sub') });
    });
  }


  // ---- transit zoom: [data-zoom] images settle as they cross the viewport ----
  let zooms = [];
  function collectZooms() { zooms = [...document.querySelectorAll('[data-zoom]')]; }
  function frameZooms(vh) {
    for (const el of zooms) {
      const r = el.getBoundingClientRect();
      // p: 0 when top hits viewport bottom, 1 when element center passes viewport center
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.85)));
      el.style.setProperty('--zp', p.toFixed(3));
    }
  }
  function frame() {
    target = scrollY;
    smooth = lerp(smooth, target, 0.16);
    if (Math.abs(target - smooth) < 0.4) smooth = target;
    const vh = innerHeight;

    // hero scroll-out (fade + drift + canvas scale)
    const hero = document.querySelector('.hero-cine');
    if (hero) {
      const p = Math.min(1, Math.max(0, smooth / (vh * 0.85)));
      hero.style.setProperty('--out', p.toFixed(3));
      window.__heroScroll = p; // hero3d reads this for scroll-linked rotation
    }

    frameZooms(vh);
    // pinned scenes
    for (const s of scenes) {
      const r = s.wrap.getBoundingClientRect();
      const total = r.height - vh;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      s.wrap.style.setProperty('--p', p.toFixed(4));
      const n = s.words.length;
      s.words.forEach((w, i) => {
        // each word activates across its slice of progress with a soft ramp
        const start = (i / n) * 0.82, end = start + 0.16;
        const wp = Math.min(1, Math.max(0, (p - start) / (end - start)));
        w.style.setProperty('--wp', wp.toFixed(3));
      });
      if (s.sub) {
        const sp = Math.min(1, Math.max(0, (p - 0.86) / 0.12));
        s.sub.style.setProperty('--sp', sp.toFixed(3));
      }
    }

    if (smooth !== target || !ticking) { /* keep going while settling */ }
    if (Math.abs(scrollY - smooth) > 0.4 || true) requestAnimationFrame(frame);
  }

  function start() {
    collect();
    collectZooms();
    if (reduce || isMobile()) {
      zooms.forEach(el => el.style.setProperty('--zp', 1));
      // static: everything fully revealed
      scenes.forEach(s => { s.words.forEach(w => w.style.setProperty('--wp', 1)); if (s.sub) s.sub.style.setProperty('--sp', 1); });
      const hero = document.querySelector('.hero-cine');
      if (hero) hero.style.setProperty('--out', 0);
      return;
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { collect(); collectZooms(); }, 200); });
})();
