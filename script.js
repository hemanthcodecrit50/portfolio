/* ══════════════════════════════════════════════════════
   HEMANTH R — PORTFOLIO  |  script.js
   Handles: Loader · Cursor · Particles · Typewriter
            Scroll animations · Parallax · Realm toggle
            Navbar · Hamburger · Skill bars · Contact
══════════════════════════════════════════════════════ */

'use strict';

/* ── Utilities ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ══════════════════════════════════════════════════════
   1. LOADING SCREEN
   Fades out after assets are ready (min 1.8s)
══════════════════════════════════════════════════════ */
(function initLoader() {
  const loader = $('#loader');
  const MIN_DURATION = 1800;
  const start = Date.now();

  window.addEventListener('load', () => {
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, MIN_DURATION - elapsed);
    setTimeout(() => {
      loader.classList.add('hidden');
      // Remove from DOM after transition
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, remaining);
  });
})();

/* ══════════════════════════════════════════════════════
   2. CUSTOM CURSOR
   Smooth lag-trail + dot follow
══════════════════════════════════════════════════════ */
(function initCursor() {
  const dot   = $('#cursor');
  const trail = $('#cursor-trail');
  if (!dot || !trail) return;

  // Don't show custom cursor on touch devices
  if (window.matchMedia('(hover: none)').matches) {
    dot.style.display = 'none';
    trail.style.display = 'none';
    document.body.style.cursor = 'auto';
    return;
  }

  let mx = -100, my = -100;     // mouse position
  let tx = -100, ty = -100;     // trail target (lagged)

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    // Dot follows instantly
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  // Trail uses CSS transition (set via left/top) for smooth lag
  function updateTrail() {
    tx += (mx - tx) * 0.14;
    ty += (my - ty) * 0.14;
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    requestAnimationFrame(updateTrail);
  }
  updateTrail();

  // Hide when leaving window
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    trail.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    trail.style.opacity = '1';
  });
})();

/* ══════════════════════════════════════════════════════
   3. PARTICLE CANVAS
   Drifting embers + distant star field
══════════════════════════════════════════════════════ */
(function initParticles() {
  const canvas = $('#bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles;

  /* Detect if light realm is on for colour flipping */
  const isLight = () => document.body.classList.contains('light-realm');

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* Particle factory */
  function createParticle(i) {
    const isEmber = Math.random() < 0.12;  // 12% embers, rest are stars
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      radius: isEmber ? Math.random() * 2 + 0.5 : Math.random() * 1.2 + 0.3,
      speed: isEmber ? Math.random() * 0.35 + 0.08 : Math.random() * 0.04 + 0.005,
      drift: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6 + 0.1,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
      isEmber,
      hue: isEmber ? (Math.random() > 0.5 ? 210 : 45) : 220,  // blue or gold embers
    };
  }

  function buildParticles() {
    const count = Math.min(200, Math.floor((W * H) / 6000));
    particles = Array.from({ length: count }, (_, i) => createParticle(i));
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      // Twinkle
      const twinkle = 0.5 + 0.5 * Math.sin(t * p.twinkleSpeed + p.twinkleOffset);
      const alpha = p.opacity * (0.5 + 0.5 * twinkle);

      if (isLight()) {
        ctx.fillStyle = `hsla(${p.hue}, 60%, 35%, ${alpha * 0.5})`;
      } else {
        ctx.fillStyle = p.isEmber
          ? `hsla(${p.hue}, 90%, 70%, ${alpha})`
          : `hsla(${p.hue}, 70%, 80%, ${alpha * 0.7})`;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Add glow for embers only
      if (p.isEmber && !isLight()) {
        ctx.shadowBlur  = 6;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, 0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Move
      p.y -= p.speed;
      p.x += p.drift;

      // Wrap around
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
    });
  }

  let frame = 0;
  function loop() {
    draw(frame++);
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { resize(); buildParticles(); });
  resize();
  buildParticles();
  loop();
})();

/* ══════════════════════════════════════════════════════
   4. TYPEWRITER
   Cycles through developer roles
══════════════════════════════════════════════════════ */
(function initTypewriter() {
  const el = $('#typewriter');
  if (!el) return;

  const phrases = [
    'Software Developer',
    'ML Enthusiast',
    'Problem Solver',
    'Open Source Contributor',
    'Eternal Learner',
  ];

  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let paused = false;

  function tick() {
    const phrase = phrases[phraseIdx];

    if (paused) return;

    if (!deleting) {
      el.textContent = phrase.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === phrase.length) {
        paused = true;
        setTimeout(() => { paused = false; deleting = true; }, 2000);
      }
    } else {
      el.textContent = phrase.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        paused = true;
        setTimeout(() => { paused = false; }, 400);
      }
    }

    const speed = deleting ? 45 : 75;
    setTimeout(tick, speed);
  }

  // Delay start until loader likely gone
  setTimeout(tick, 2200);
})();

/* ══════════════════════════════════════════════════════
   5. INTERSECTION OBSERVER — Fade-ins & Skill Bars
   Staggered reveal as sections scroll into view
══════════════════════════════════════════════════════ */
(function initScrollReveal() {
  const options = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Activate skill bar fills
        const bars = $$('.skill-fill', entry.target);
        bars.forEach(bar => bar.parentElement.parentElement.classList.add('visible'));
        observer.unobserve(entry.target);
      }
    });
  }, options);

  $$('.fade-in').forEach(el => observer.observe(el));

  // Skill node observer (for bar fills)
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  $$('.skill-node').forEach(el => skillObserver.observe(el));
})();

/* ══════════════════════════════════════════════════════
   6. NAVBAR — Scroll state + active link highlight
══════════════════════════════════════════════════════ */
(function initNavbar() {
  const navbar = $('#navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // Active link on scroll
  const sections = $$('section[id]');
  const links = $$('.nav-link');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = links.find(l => l.getAttribute('href') === '#' + entry.target.id);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => io.observe(s));
})();

/* ══════════════════════════════════════════════════════
   7. HAMBURGER MOBILE MENU
══════════════════════════════════════════════════════ */
(function initMobileNav() {
  const btn   = $('#hamburger');
  const mNav  = $('#mobile-nav');
  if (!btn || !mNav) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    mNav.classList.toggle('open');
    document.body.style.overflow = mNav.classList.contains('open') ? 'hidden' : '';
  });

  // Close on link click
  $$('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('open');
      mNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

/* ══════════════════════════════════════════════════════
   8. REALM TOGGLE (Dark / Light)
   Switches CSS variable set via body class
══════════════════════════════════════════════════════ */
(function initRealmToggle() {
  const btn  = $('#realm-toggle');
  const icon = btn ? btn.querySelector('.toggle-icon') : null;
  if (!btn) return;

  // Remember preference
  const saved = localStorage.getItem('realm');
  if (saved === 'light') {
    document.body.classList.add('light-realm');
    if (icon) icon.textContent = '☀';
  }

  btn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-realm');
    if (icon) icon.textContent = isLight ? '☀' : '☽';
    localStorage.setItem('realm', isLight ? 'light' : 'dark');
  });
})();

/* ══════════════════════════════════════════════════════
   9. PARALLAX HERO
   Subtle background canvas parallax on mouse move
══════════════════════════════════════════════════════ */
(function initParallax() {
  const hero = $('#hero');
  if (!hero) return;

  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;

    // Parallax on hero content
    const content = hero.querySelector('.hero-content');
    if (content) {
      content.style.transform = `translate(${dx * -6}px, ${dy * -4}px)`;
    }
  });
})();

/* ══════════════════════════════════════════════════════
   10. SMOOTH SCROLL for anchor links
══════════════════════════════════════════════════════ */
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 72; // navbar height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ══════════════════════════════════════════════════════
   11. CONTACT FORM — Mock submit with animation
══════════════════════════════════════════════════════ */
(function initContactForm() {
  const btn   = $('#send-btn');
  const name  = $('#c-name');
  const email = $('#c-email');
  const msg   = $('#c-msg');
  if (!btn) return;

  btn.addEventListener('click', () => {
    // Basic validation
    if (!name?.value.trim() || !email?.value.trim() || !msg?.value.trim()) {
      shakeForm();
      return;
    }

    // Sending state
    btn.disabled = true;
    const arrow = btn.querySelector('.btn-arrow');
    const label = btn.childNodes[2]; // text node
    if (arrow) arrow.textContent = '…';

    setTimeout(() => {
      btn.classList.add('success');
      if (arrow) arrow.textContent = '✓';
      btn.childNodes[2].textContent = ' Raven Dispatched ';
      // Reset after 3s
      setTimeout(() => {
        btn.disabled = false;
        btn.classList.remove('success');
        if (arrow) arrow.textContent = '→';
        btn.childNodes[2].textContent = ' Dispatch Raven ';
        if (name)  name.value  = '';
        if (email) email.value = '';
        if (msg)   msg.value   = '';
      }, 3000);
    }, 1200);
  });

  function shakeForm() {
    const wrap = btn.closest('.contact-form-wrap');
    if (!wrap) return;
    wrap.style.animation = 'shake 0.4s ease';
    wrap.addEventListener('animationend', () => wrap.style.animation = '', { once: true });
  }
})();

/* ══════════════════════════════════════════════════════
   12. FOOTER YEAR
══════════════════════════════════════════════════════ */
(function initYear() {
  const el = $('#year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ══════════════════════════════════════════════════════
   13. ACHIEVEMENT CARD UNLOCK ANIMATION
   Plays a brief "unlocked" flash when cards enter view
══════════════════════════════════════════════════════ */
(function initAchievementUnlock() {
  const cards = $$('.achievement-card');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        setTimeout(() => {
          card.style.transition += ', box-shadow 0.2s';
          card.classList.add('unlocked');
        }, i * 80);
        io.unobserve(card);
      }
    });
  }, { threshold: 0.4 });

  cards.forEach(c => io.observe(c));
})();

/* ══════════════════════════════════════════════════════
   14. INJECT shake keyframe dynamically
══════════════════════════════════════════════════════ */
(function injectKeyframes() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-6px); }
      40%       { transform: translateX(6px); }
      60%       { transform: translateX(-4px); }
      80%       { transform: translateX(4px); }
    }
    .nav-link.active { color: var(--blue) !important; }
    .nav-link.active::before { transform: scaleX(1) !important; }
  `;
  document.head.appendChild(style);
})();

/* ══════════════════════════════════════════════════════
   15. TITLE GLOW on Section enter
══════════════════════════════════════════════════════ */
(function initSectionGlow() {
  const titles = $$('.section-title');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.textShadow = '0 0 30px rgba(94,174,255,0.15)';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  titles.forEach(t => io.observe(t));
})();

/* ══════════════════════════════════════════════════════
   END
══════════════════════════════════════════════════════ */
