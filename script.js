/* =============================================================================
   WAYFINDER — PORTFOLIO SCRIPT (PRODUCTION STABLE)
   =============================================================================
   No external libraries. Everything below is vanilla JS, organized into
   small independent modules that each `init()` themselves at the bottom
   of the file. Disable any module by commenting out its init() call.
   ============================================================================= */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------------------------------------------------------------------
     MODULE: Preloader
     Fakes a short, deterministic-feeling load by counting 0→100, then
     fades the overlay out and unlocks page scroll.
     --------------------------------------------------------------------- */
  function initPreloader() {
    const el = document.getElementById('preloader');
    const pctEl = document.getElementById('preloaderPct');
    if (!el) return;

    document.body.style.overflow = 'hidden';
    let pct = 0;
    const duration = reduceMotion ? 200 : 1500;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      pct = Math.floor(t * 100);
      if (pctEl) pctEl.textContent = pct;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.classList.add('is-done');
        document.body.style.overflow = '';
      }
    }
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------------------
     MODULE: Scroll progress bar
     --------------------------------------------------------------------- */
  function initScrollProgress() {
    const fill = document.getElementById('scrollFill');
    if (!fill) return;
    function update() {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (scrolled / max) * 100 : 0;
      fill.style.width = pct + '%';
    }
    document.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------------
      MODULE: Custom cursor + canvas comet trail
      --------------------------------------------------------------------- */
  function initCursor() {
    if (isTouch) return;
    const cursor = document.getElementById('cursor');
    const canvas = document.getElementById('cursorTrail');
    if (!cursor || !canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let mx = w / 2, my = h / 2;
    const particles = [];

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.style.transform = `translate(${mx}px, ${my}px)`;
      if (!reduceMotion) {
        particles.push({ x: mx, y: my, life: 1 });
        if (particles.length > 40) particles.shift();
      }
      
      const target = e.target;
      const interactive = target.closest('a, button, .orbit__node, input, textarea, .magnetic, .tilt');
      cursor.classList.toggle('is-active', !!interactive);
    });

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 0.035;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(125, 249, 255, ${p.life * 0.5})`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  /* ---------------------------------------------------------------------
     MODULE: Constellation nav
     --------------------------------------------------------------------- */
  function initConstellationNav() {
    const sections = Array.from(document.querySelectorAll('main > section[id]'));
    const links = Array.from(document.querySelectorAll('.constellation__list a'));
    const progressLine = document.getElementById('constellationProgress');

    if (sections.length && links.length) {
      const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            links.forEach(l => l.classList.remove('is-active'));
            const link = map.get(entry.target.id);
            if (link) link.classList.add('is-active');
          }
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      sections.forEach(s => observer.observe(s));
    }

    function updateProgressLine() {
      if (!progressLine) return;
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100;
      progressLine.setAttribute('y2', pct + '%');
    }
    document.addEventListener('scroll', updateProgressLine, { passive: true });
    updateProgressLine();

    // Mobile menu
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('mobileMenu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-hidden', String(!open));
      });
      menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
      }));
    }
  }

  /* ---------------------------------------------------------------------
     MODULE: Hero starfield + contour parallax
     --------------------------------------------------------------------- */
  function initHero() {
    const field = document.getElementById('heroField');
    if (field) {
      const count = window.innerWidth < 640 ? 26 : 60;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const dot = document.createElement('span');
        dot.style.left = Math.random() * 100 + '%';
        dot.style.top = Math.random() * 100 + '%';
        dot.style.animationDelay = (Math.random() * 4) + 's';
        dot.style.opacity = (0.2 + Math.random() * 0.6).toFixed(2);
        frag.appendChild(dot);
      }
      field.appendChild(frag);
    }

    if (reduceMotion || isTouch) return;
    const hero = document.querySelector('.hero');
    const contour = document.getElementById('contourPath');
    const nameLine = document.querySelector('.hero__name-line');
    if (!hero) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;

      if (contour) {
        contour.style.transform = `translate(${px * 24}px, ${py * 16}px)`;
      }
      if (nameLine) {
        nameLine.style.transform = `translate(${px * 10}px, ${py * 6}px)`;
      }
    });
  }

  /* ---------------------------------------------------------------------
     MODULE: Reveal-on-scroll
     --------------------------------------------------------------------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal-up');
    if (!items.length) return;

    if (reduceMotion) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const groups = new Map();
    items.forEach(el => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, 0);
      const idx = groups.get(parent);
      el.style.setProperty('--stagger', Math.min(idx, 6));
      groups.set(parent, idx + 1);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    items.forEach(el => observer.observe(el));
  }

  /* ---------------------------------------------------------------------
     MODULE: Magnetic buttons (STABLE LINK EXCLUSION)
     --------------------------------------------------------------------- */
  function initMagnetic() {
    if (reduceMotion || isTouch) return;
    const els = document.querySelectorAll('.magnetic');
    els.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        // Safe check: If the cursor is floating over an anchor navigation text link, don't trap pointer event calculations
        if (e.target.tagName.toLowerCase() === 'a') return;
        
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.32}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------------------------
     MODULE: Tilt effect on cards (STABLE LINK EXCLUSION)
     --------------------------------------------------------------------- */
  function initTilt() {
    if (reduceMotion || isTouch) return;
    const els = document.querySelectorAll('.tilt');
    els.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        // Safe check: If the user hovers/clicks inside a real active anchor link, halt coordinate modification loops
        if (e.target.closest('a')) {
          el.style.transform = '';
          return;
        }
        
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(800px) rotateX(${py * -6}deg) rotateY(${px * 8}deg) translateZ(0)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------------------------
     MODULE: Contact form (Formspree)
     --------------------------------------------------------------------- */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    const note = document.getElementById('contactNote');
    const submitBtn = document.getElementById('contactSubmit');
    const btnLabel = submitBtn ? submitBtn.querySelector('.btn__label') : null;
    if (!form) return;

    const endpoint = form.getAttribute('action') || '';
    const endpointConfigured = endpoint && !endpoint.includes('[YOUR_FORMSPREE_FORM_ID]');

    function setNote(text, kind) {
      note.textContent = text;
      note.style.color = kind === 'error' ? 'var(--ember)' : 'var(--signal)';
    }

    function setLoading(isLoading) {
      if (!submitBtn) return;
      submitBtn.disabled = isLoading;
      submitBtn.style.opacity = isLoading ? '0.6' : '';
      submitBtn.style.cursor = isLoading ? 'wait' : '';
      if (btnLabel) btnLabel.textContent = isLoading ? 'Transmitting…' : 'Transmit Message';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !emailOk || !message) {
        setNote('Please fill in your name, a valid email, and a message.', 'error');
        return;
      }

      if (!endpointConfigured) {
        setNote('Form is not connected yet — add your Formspree form ID in index.html.', 'error');
        console.warn('[contact form] Replace [YOUR_FORMSPREE_FORM_ID] in the form action with your real Formspree form ID.');
        return;
      }

      setLoading(true);
      setNote('', 'info');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          setNote('Signal sent — thank you, ' + name.split(' ')[0] + '. I\u2019ll reply soon.', 'success');
          form.reset();
        } else {
          const data = await response.json().catch(() => null);
          const msg = data && data.errors && data.errors.length
            ? data.errors.map(err => err.message).join(', ')
            : 'Something went wrong sending that — please try again or email me directly.';
          setNote(msg, 'error');
        }
      } catch (err) {
        setNote('Network error — please check your connection and try again.', 'error');
      } finally {
        setLoading(false);
      }
    });
  }

  /* ---------------------------------------------------------------------
     MODULE: Footer (year + back-to-top)
     --------------------------------------------------------------------- */
  function initFooter() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const btn = document.getElementById('backToTop');
    if (btn) {
      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  }

  /* ---------------------------------------------------------------------
     INIT
     --------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initScrollProgress();
    initCursor();
    initConstellationNav();
    initHero();
    initReveal();
    initMagnetic();
    initTilt();
    initContactForm();
    initFooter();
  });
})();
