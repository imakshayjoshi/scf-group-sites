/* Sai Coaters & Fabricators — site behaviour */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menu toggle (mobile)
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    function setMenu(open) {
      nav.classList.toggle('open', open);
      toggle.textContent = open ? 'Close' : 'Menu';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    toggle.addEventListener('click', function () {
      setMenu(!nav.classList.contains('open'));
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && nav.classList.contains('open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (ev) {
      if (nav.classList.contains('open') && !nav.contains(ev.target) && !toggle.contains(ev.target)) {
        setMenu(false);
      }
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
  }

  // Masked headline reveal
  var heroLines = document.querySelectorAll('.hero-title .line > span');
  if (heroLines.length && !reduce) {
    heroLines.forEach(function (s, i) {
      s.style.transition = 'transform 900ms cubic-bezier(0.16,1,0.3,1) ' + (i * 110) + 'ms';
      requestAnimationFrame(function () { requestAnimationFrame(function () { s.style.transform = 'translateY(0)'; }); });
    });
  } else {
    heroLines.forEach(function (s) { s.style.transform = 'none'; });
  }

  // Hero copy entrance (non-title children)
  var heroCopy = document.querySelector('.hero-copy');
  if (heroCopy && !reduce) {
    Array.prototype.forEach.call(heroCopy.children, function (el, i) {
      if (el.classList.contains('hero-title')) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity 700ms ease ' + (300 + i * 110) + 'ms, transform 700ms cubic-bezier(0.34,1.4,0.44,1) ' + (300 + i * 110) + 'ms';
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      Array.prototype.forEach.call(heroCopy.children, function (el) {
        el.style.opacity = '1'; el.style.transform = 'none';
      });
    }); });
  }

  // Entrance motion: auto-tag inner page blocks when no .rise exists
  if (!document.querySelector('.rise')) {
    document.querySelectorAll('.chapter h2, .chapter > .lead, .media-split, .spec, .prod-row, .prod-row h3, .tagline-list, .quote-side, .quote-form .field, .check-row, .quote-form .btn, .fig, .page-hero h1, .page-hero .lede').forEach(function (el) {
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
  document.querySelectorAll('.cap-rows, .process-grid, .stats-grid, .who-grid, .faq-list').forEach(function (g) {
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

  // Showcase tabs
  var tabs = document.querySelectorAll('.tab');
  if (tabs.length) {
    var panels = document.querySelectorAll('[data-panel]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.setAttribute('aria-selected', 'false'); });
        tab.setAttribute('aria-selected', 'true');
        var key = tab.getAttribute('data-tab');
        panels.forEach(function (p) {
          p.hidden = p.getAttribute('data-panel') !== key;
        });
      });
    });
  }

  // RFQ prefill widget -> quote.html
  var prefill = document.querySelector('form[data-prefill]');
  if (prefill) {
    prefill.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var fd = new FormData(prefill);
      var q = new URLSearchParams();
      ['process', 'material', 'volume'].forEach(function (k) {
        var v = (fd.get(k) || '').toString().trim();
        if (v) q.set(k, v);
      });
      window.location.href = 'quote.html' + (q.toString() ? '?' + q.toString() : '');
    });
  }

  // Quote form: POST to RFQ hook (email confirmation + owner copy), mailto fallback
  var form = document.querySelector('form[data-rfq]');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    ['process', 'material', 'volume'].forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"]');
      if (el && params.get(k)) {
        if (el.tagName === 'SELECT') {
          var opt = Array.prototype.find.call(el.options, function (o) { return o.value === params.get(k); });
          if (opt) el.value = opt.value; else { el.value = params.get(k); }
        } else { el.value = params.get(k); }
      }
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var fd = new FormData(form);
      var get = function (k) { return (fd.get(k) || '').toString().trim(); };
      var confirmBox = document.querySelector('.quote-confirm');
      var msg = confirmBox ? confirmBox.querySelector('.confirm-msg') : null;
      var btn = form.querySelector('button[type="submit"]');
      var btnLabel = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

      var payload = {
        site: get('site') || form.getAttribute('data-site') || '',
        name: get('name'), company: get('company'), phone: get('phone'), email: get('email'),
        part: get('part'), process: get('process'), material: get('material'), volume: get('volume'),
        date: get('date'), city: get('city'), nda: !!fd.get('nda'), notes: get('notes'),
        website: get('website')
      };

      function showSuccess(ref, message) {
        if (!confirmBox) return;
        confirmBox.querySelector('.ref').textContent = ref;
        if (msg && message) msg.textContent = message;
        var wa = confirmBox.querySelector('.wa-link');
        if (wa) {
          wa.href = 'https://wa.me/919763710376?text=' + encodeURIComponent('RFQ ' + ref + ': ' + (payload.part || 'Component enquiry') + ' from ' + (payload.company || '') + '.');
        }
        confirmBox.classList.add('show');
        confirmBox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
      }

      fetch('https://mission.xseven.us/v1/hooks/scf-rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res && res.ok && res.ref) {
          showSuccess(res.ref, 'Your RFQ is sent. A confirmation email is on its way to ' + payload.email + ' — reply to it with your drawing attached. An engineer reviews drawings within one working day.');
          form.reset();
        } else {
          throw new Error('bad response');
        }
      }).catch(function () {
        // fallback: prewritten email in the visitor's mail app
        var ref = "SCF-" + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);
        var lines = [
          'RFQ reference: ' + ref, '',
          'Name: ' + payload.name, 'Company: ' + payload.company,
          'Phone: ' + payload.phone, 'Email: ' + payload.email, '',
          'Part name: ' + payload.part, 'Process needed: ' + payload.process,
          'Material and thickness: ' + payload.material, 'Annual volume: ' + payload.volume,
          'Target date: ' + payload.date, 'Delivery city: ' + payload.city,
          'NDA required before drawing review: ' + (payload.nda ? 'Yes' : 'No'), '',
          'Notes: ' + payload.notes, '',
          '(Attach your drawing file to this email before sending. STEP, DXF, DWG or PDF.)'
        ];
        var subject = 'RFQ ' + ref + ' - ' + (payload.part || 'Component') + ' - ' + (payload.company || 'Buyer');
        showSuccess(ref, 'Our direct line hiccuped, so your email app has opened with everything written instead. Attach your drawing and press send; we still get your RFQ instantly.');
        window.location.href = 'mailto:saicoaters@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      });
    });
  }
})();

/* ---------- interaction layer: validation + file feedback ---------- */
(function () {
  var form = document.querySelector('form[data-rfq]');
  if (!form) return;
  form.setAttribute('novalidate', 'novalidate');

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function fieldWrap(el) { return el.closest('.field'); }
  function errEl(el) {
    var w = fieldWrap(el);
    if (!w) return null;
    var e = w.querySelector('.field-error');
    if (!e) { e = document.createElement('span'); e.className = 'field-error'; w.appendChild(e); }
    return e;
  }
  function validate(el, quiet) {
    var w = fieldWrap(el);
    if (!w) return true;
    var v = (el.value || '').trim();
    var bad = '';
    if (el.hasAttribute('required') && !v) bad = 'This one is needed.';
    else if (el.type === 'email' && v && !EMAIL_RE.test(v)) bad = 'That email does not look right.';
    else if (el.type === 'tel' && v && v.replace(/\D/g, '').length < 7) bad = 'That number looks too short.';
    if (bad && !quiet) {
      w.classList.add('invalid');
      var e = errEl(el); if (e) e.textContent = bad;
    } else if (!bad) {
      w.classList.remove('invalid');
    }
    return !bad;
  }

  form.querySelectorAll('input:not([type="hidden"]):not([type="file"]), select, textarea').forEach(function (el) {
    if (el.type === 'tel') {
      el.addEventListener('input', function () {
        var clean = el.value.replace(/[^\d+\s()-]/g, '');
        if (clean !== el.value) el.value = clean;
      });
    }
    el.addEventListener('blur', function () { validate(el); });
    el.addEventListener('input', function () {
      var w = fieldWrap(el);
      if (w && w.classList.contains('invalid')) validate(el);
    });
  });

  form.addEventListener('submit', function (ev) {
    var ok = true, first = null;
    form.querySelectorAll('input[required], select[required], textarea[required], input[type="email"], input[type="tel"]').forEach(function (el) {
      if (!validate(el)) { ok = false; if (!first) first = el; }
    });
    if (!ok) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if (first) {
        first.focus();
        first.closest('.field').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, true);

  var file = form.querySelector('input[type="file"]');
  if (file) {
    var chosen = document.createElement('span');
    chosen.className = 'file-chosen';
    file.parentElement.appendChild(chosen);
    file.addEventListener('change', function () {
      var w = fieldWrap(file);
      if (file.files && file.files.length) {
        chosen.textContent = 'Attached: ' + file.files[0].name;
        w.classList.add('has-file');
      } else {
        chosen.textContent = '';
        w.classList.remove('has-file');
      }
    });
  }

  // button loading state (works alongside the existing RFQ submit flow)
  var submitBtn = form.querySelector('button[type="submit"], .btn[type="submit"], button.btn');
  if (submitBtn) {
    form.addEventListener('submit', function () {
      if (form.checkValidity() || form.querySelector('.field.invalid')) { /* custom flow handles */ }
    });
  }
})();

/* deep-link anchor: jump to hash target after layout settles */
(function () {
  if (!location.hash) return;
  var el = document.querySelector(location.hash);
  if (!el) return;
  function jump() { el.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  if (document.readyState === 'complete') setTimeout(jump, 60);
  else window.addEventListener('load', function () { setTimeout(jump, 60); });
})();
