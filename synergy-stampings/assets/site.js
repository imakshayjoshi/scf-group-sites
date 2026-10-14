/* Synergy Stampings — site behaviour */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.textContent = open ? 'Close' : 'Menu';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Hero copy entrance
  var heroCopy = document.querySelector('.hero-copy');
  if (heroCopy && !reduce) {
    Array.prototype.forEach.call(heroCopy.children, function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity 700ms ease ' + (150 + i * 110) + 'ms, transform 700ms cubic-bezier(0.34,1.4,0.44,1) ' + (150 + i * 110) + 'ms';
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      Array.prototype.forEach.call(heroCopy.children, function (el) {
        el.style.opacity = '1'; el.style.transform = 'none';
      });
    }); });
  }

  // Entrance motion: auto-tag inner page blocks when no .rise exists
  if (!document.querySelector('.rise')) {
    document.querySelectorAll('.chapter h2, .chapter > .lead, .media-split, .spec, .prod-row, .quote-side, .quote-form .field, .check-row, .quote-form .btn, .fig, .page-hero h1, .page-hero .lede').forEach(function (el) {
      el.classList.add('rise');
    });
  }
  var rise = document.querySelectorAll('.rise');
  if (rise.length && 'IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    rise.forEach(function (el) { io.observe(el); });
  } else {
    rise.forEach(function (el) { el.classList.add('in'); });
  }

  // Stagger rise siblings
  document.querySelectorAll('.stages, .proof-grid, .faq-list, .stats-grid').forEach(function (g) {
    Array.prototype.forEach.call(g.querySelectorAll('.rise'), function (el, i) {
      el.style.transitionDelay = (i * 70) + 'ms';
    });
  });

  // Animated counters for stat numbers
  document.querySelectorAll('.stat-card .n').forEach(function (el) {
    var m = el.textContent.match(/([\d,.]+)/);
    if (!m) return;
    var target = parseFloat(m[1].replace(/,/g, ''));
    if (!isFinite(target) || target < 5) return;
    var prefix = el.textContent.slice(0, m.index);
    var suffix = el.textContent.slice(m.index + m[1].length);
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io2.unobserve(el);
        if (reduce) { return; }
        var t0 = performance.now(), dur = 1400;
        (function tick(now) {
          var p = Math.min(1, (now - t0) / dur);
          var ease = 1 - Math.pow(1 - p, 3);
          var val = target * ease;
          el.textContent = prefix + (target % 1 ? val.toFixed(2) : Math.round(val).toString()) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.4 });
    io2.observe(el);
  });

  // Process accordion
  var stages = document.querySelectorAll('.stage');
  stages.forEach(function (st) {
    st.addEventListener('click', function () {
      stages.forEach(function (s) { s.setAttribute('aria-expanded', 'false'); });
      st.setAttribute('aria-expanded', 'true');
    });
  });

  // Showcase tabs
  var tabs = document.querySelectorAll('.tab');
  if (tabs.length) {
    var panels = document.querySelectorAll('[data-panel]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.setAttribute('aria-selected', 'false'); });
        tab.setAttribute('aria-selected', 'true');
        var key = tab.getAttribute('data-tab');
        panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== key; });
      });
    });
  }

  // Stamp toy: emboss the part name on a metal plate
  var stampForm = document.querySelector('form[data-stamp]');
  if (stampForm) {
    var out = document.querySelector('.plate .stamped');
    var meta = document.querySelector('.plate .plate-meta');
    stampForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = (new FormData(stampForm).get('partname') || '').toString().trim();
      if (!v) return;
      var t = v.slice(0, 26);
      out.textContent = t;
      out.setAttribute('data-text', t);
      var d = new Date();
      meta.textContent = 'Synergy Stampings · Nashik · ' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    });
  }

  // Quote form: compose email + WhatsApp, show confirmation with reference
  var form = document.querySelector('form[data-rfq]');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    ['process', 'material', 'volume'].forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"]');
      if (el && params.get(k)) { el.value = params.get(k); }
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var fd = new FormData(form);
      var get = function (k) { return (fd.get(k) || '').toString().trim(); };
      var ref = 'SYN-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);
      var lines = [
        'RFQ reference: ' + ref, '',
        'Name: ' + get('name'), 'Company: ' + get('company'),
        'Phone: ' + get('phone'), 'Email: ' + get('email'), '',
        'Part name: ' + get('part'), 'Process needed: ' + get('process'),
        'Material and thickness: ' + get('material'), 'Annual volume: ' + get('volume'),
        'Target date: ' + get('date'), 'Delivery city: ' + get('city'),
        'NDA required before drawing review: ' + (fd.get('nda') ? 'Yes' : 'No'), '',
        'Notes: ' + get('notes'), '',
        '(Attach your drawing file to this email before sending. STEP, DXF, DWG or PDF.)'
      ];
      var subject = 'RFQ ' + ref + ' - ' + (get('part') || 'Component') + ' - ' + (get('company') || 'Buyer');
      var target = form.getAttribute('data-email') || 'info@synergystampings.com';
      var confirmBox = document.querySelector('.quote-confirm');
      if (confirmBox) {
        confirmBox.querySelector('.ref').textContent = ref;
        var wa = confirmBox.querySelector('.wa-link');
        if (wa) {
          wa.href = 'https://wa.me/' + (form.getAttribute('data-wa') || '919763710376') + '?text=' + encodeURIComponent('RFQ ' + ref + ': ' + (get('part') || 'Component enquiry') + ' from ' + (get('company') || '') + '. Details emailed.');
        }
        confirmBox.classList.add('show');
        confirmBox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      }
      window.location.href = 'mailto:' + target + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
    });
  }
})();
