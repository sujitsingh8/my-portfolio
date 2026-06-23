// Portfolio behaviour — ported from the dc-runtime <script> (no framework needed).
document.addEventListener('DOMContentLoaded', function () {

  // --- hero stat pills (kept in JS so the count-up survives without churn) ---
  var wrap = document.querySelector('.herostats');
  if (wrap && !wrap.childElementCount) {
    var stats = [['5', 'Projects', '#projects'], ['2', 'Degrees', '#education'], ['2', 'Internships', '#experience']];
    stats.forEach(function (s) {
      var n = s[0], l = s[1], href = s[2];
      var a = document.createElement('a');
      a.href = href;
      a.style.cssText = 'text-decoration:none;color:inherit';
      a.innerHTML = '<div style="font-family:\'Bricolage Grotesque\';font-weight:800;font-size:34px;line-height:1;color:var(--accent)" data-count="' + n + '">0</div>'
                  + '<div style="font-size:13px;color:var(--muted);font-weight:600;margin-top:4px">' + l + '</div>';
      wrap.appendChild(a);
    });
  }

  // --- scroll reveal (rAF-driven; reliable across browsers) ---
  function show(el) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }
  var reveals = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  reveals.forEach(function (el) {
    if (el.__revealed) { show(el); return; }
    el.style.opacity = '0'; el.style.transform = 'translateY(28px)';
  });

  function reveal(el) {
    if (el.__revealed) return; el.__revealed = true;
    var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
    var dur = 640, t0 = null;
    function run(now) {
      if (t0 == null) t0 = now;
      var p = Math.min((now - t0 - delay) / dur, 1);
      if (p < 0) { requestAnimationFrame(run); return; }
      var e = 1 - Math.pow(1 - p, 3);
      el.style.opacity = String(e);
      el.style.transform = 'translateY(' + (28 * (1 - e)).toFixed(2) + 'px)';
      if (p < 1) requestAnimationFrame(run); else show(el);
    }
    requestAnimationFrame(run);
  }

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var dur = 1300, start = performance.now();
    function step(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function fireCount(el) { if (el.__done) return; el.__done = true; animateCount(el); }

  function check() {
    var h = window.innerHeight || 800;
    reveals.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < h * 0.9 && r.bottom > 0) reveal(el); });
    counters.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < h * 0.85 && r.bottom > 0) fireCount(el); });
  }
  requestAnimationFrame(function () { check(); requestAnimationFrame(check); });
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  setTimeout(function () { reveals.forEach(function (el) { el.__revealed = true; show(el); }); counters.forEach(fireCount); }, 1800);

  // --- contact form (Web3Forms) ---
  var form = document.getElementById('contactForm');
  if (form) {
    var checks = {
      name: { test: function (v) { return /^[a-zA-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F\s.'-]{1,}$/.test(v.trim()); },
              msg: 'Please enter your name — letters only, at least 2 characters.' },
      email: { test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
               msg: 'Please enter a valid email address.' },
      message: { test: function (v) { return v.trim().length >= 10; },
                 msg: 'Please enter a message of at least 10 characters.' }
    };
    function setError(name, show) {
      var el = form.querySelector('[name="' + name + '"]');
      var err = form.querySelector('[data-err="' + name + '"]');
      if (el) el.classList.toggle('invalid', show);
      if (err) {
        if (show) { err.textContent = checks[name].msg; err.classList.add('show'); }
        else err.classList.remove('show');
      }
    }
    function validate() {
      var firstBad = null;
      Object.keys(checks).forEach(function (name) {
        var el = form.querySelector('[name="' + name + '"]');
        var valid = el && checks[name].test(el.value || '');
        setError(name, !valid);
        if (!valid && !firstBad) firstBad = el;
      });
      if (firstBad) firstBad.focus();
      return !firstBad;
    }
    Object.keys(checks).forEach(function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      if (el) el.addEventListener('input', function () { setError(name, false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      var btn = form.querySelector('button[type="submit"]');
      var original = btn ? btn.textContent : 'Send message';
      if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.success) {
          if (btn) { btn.textContent = 'Message sent \u2713'; btn.disabled = true; }
          form.reset();
        } else {
          if (btn) { btn.textContent = original; btn.disabled = false; }
          alert('Sorry, something went wrong. Please email me directly.');
        }
      })
      .catch(function () {
        if (btn) { btn.textContent = original; btn.disabled = false; }
        alert('Sorry, something went wrong. Please email me directly.');
      });
    });
  }

  // --- projects modal (terminal card opens all 5) ---
  var projCard = document.getElementById('projTerminalCard');
  var projModal = document.getElementById('projModal');
  var PROJ_HASH = '#basic-python-projects';
  function openProj(setHash) {
    if (projModal) { projModal.classList.add('open'); projModal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); }
    if (setHash !== false && location.hash !== PROJ_HASH) history.replaceState(null, '', PROJ_HASH);
  }
  function closeProj() {
    if (projModal) { projModal.classList.remove('open'); projModal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); }
    if (location.hash === PROJ_HASH) history.replaceState(null, '', location.pathname + location.search);
  }
  if (projCard) {
    projCard.addEventListener('click', function () { openProj(); });
    projCard.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProj(); } });
  }
  if (projModal) {
    Array.prototype.slice.call(projModal.querySelectorAll('[data-close]')).forEach(function (el) {
      el.addEventListener('click', closeProj);
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeProj(); });
  // open via shareable hash (e.g. /#basic-python-projects)
  if (location.hash === PROJ_HASH) openProj(false);
  window.addEventListener('hashchange', function () {
    if (location.hash === PROJ_HASH) openProj(false);
    else if (projModal && projModal.classList.contains('open')) closeProj();
  });

  // --- mobile nav (hamburger) ---
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.querySelector('.navlinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    Array.prototype.slice.call(navLinks.querySelectorAll('a')).forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- content protection (deterrent) ---
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  ['copy', 'cut'].forEach(function (evt) {
    document.addEventListener(evt, function (e) {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      e.preventDefault();
    });
  });
  document.addEventListener('selectstart', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    e.preventDefault();
  });
  document.addEventListener('dragstart', function (e) {
    if (e.target && e.target.tagName === 'IMG') e.preventDefault();
  });
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    var inField = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
    if (e.key === 'F12') { e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) { e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'u') { e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'p')) { e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && (k === 'c' || k === 'x' || k === 'a') && !inField) { e.preventDefault(); return; }
  });
});