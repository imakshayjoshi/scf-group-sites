/* Sai Coaters & Fabricators — site behaviour */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menu toggle (mobile)
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.textContent = open ? 'Close' : 'Menu';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
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

  // Entrance motion: auto-tag inner page blocks when no .rise exists
  if (!document.querySelector('.rise')) {
    document.querySelectorAll('.chapter h2, .chapter > .lead, .media-split, .spec, .prod-row, .prod-row h3, .tagline-list, .quote-side, .quote-form .field, .check-row, .quote-form .btn, .fig, .page-hero h1, .page-hero .lede').forEach(function (el) {
      el.classList.add('rise');
    });
  }
  // Entrance motion
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

  // Marquee: duplicate track for seamless loop
  var mq = document.querySelector('.marquee');
  if (mq && !reduce) { mq.innerHTML += mq.innerHTML; }

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

  // Quote form: compose email + WhatsApp, show confirmation with reference
  var form = document.querySelector('form[data-rfq]');
  if (form) {
    // prefill from URL
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
      var ref = 'SCF-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);
      var lines = [
        'RFQ reference: ' + ref,
        '',
        'Name: ' + get('name'),
        'Company: ' + get('company'),
        'Phone: ' + get('phone'),
        'Email: ' + get('email'),
        '',
        'Part name: ' + get('part'),
        'Process needed: ' + get('process'),
        'Material and thickness: ' + get('material'),
        'Annual volume: ' + get('volume'),
        'Target date: ' + get('date'),
        'Delivery city: ' + get('city'),
        'NDA required before drawing review: ' + (fd.get('nda') ? 'Yes' : 'No'),
        '',
        'Notes: ' + get('notes'),
        '',
        '(Attach your drawing file to this email before sending. STEP, DXF, DWG or PDF.)'
      ];
      var subject = 'RFQ ' + ref + ' - ' + (get('part') || 'Component') + ' - ' + (get('company') || 'Buyer');
      var body = lines.join('\n');
      var target = form.getAttribute('data-email') || 'saicoaters@gmail.com';

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
      window.location.href = 'mailto:' + target + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }
})();
