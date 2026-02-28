/**
 * Amar Lamichhane — Portfolio
 * main.js — Interactions, Animations & Behavior
 */

'use strict';

/* ============================================================
   THEME MANAGEMENT
   ============================================================ */
const ThemeManager = (() => {
  const root    = document.documentElement;
  const toggle  = document.getElementById('themeToggle');
  const STORAGE = 'portfolio-theme';

  function set(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE, theme);
  }

  function init() {
    // Respect saved preference, then system preference
    const saved  = localStorage.getItem(STORAGE);
    const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    set(saved || system);

    toggle?.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      set(current === 'dark' ? 'light' : 'dark');
    });
  }

  return { init };
})();

/* ============================================================
   NAVIGATION — sticky + mobile hamburger + active link tracking
   ============================================================ */
const Navigation = (() => {
  const nav       = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  const links     = document.querySelectorAll('.nav-link');

  function initSticky() {
    window.addEventListener('scroll', () => {
      nav?.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  function initMobile() {
    hamburger?.addEventListener('click', () => {
      const open = navLinks?.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });

    // Close on link click
    navLinks?.addEventListener('click', e => {
      if (e.target.classList.contains('nav-link')) {
        navLinks.classList.remove('open');
        hamburger?.classList.remove('open');
        hamburger?.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!nav?.contains(e.target)) {
        navLinks?.classList.remove('open');
        hamburger?.classList.remove('open');
        hamburger?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initActiveLinks() {
    const sections = document.querySelectorAll('section[id]');
    const navH     = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
          active?.classList.add('active');
        }
      });
    }, {
      rootMargin: `-${navH}px 0px -60% 0px`,
      threshold: 0,
    });

    sections.forEach(s => observer.observe(s));
  }

  function init() {
    initSticky();
    initMobile();
    initActiveLinks();
  }

  return { init };
})();

/* ============================================================
   SCROLL REVEAL — Intersection Observer for .reveal elements
   ============================================================ */
const ScrollReveal = (() => {
  function init() {
    const items = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger sibling reveals within same parent
          const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')];
          const idx = siblings.indexOf(entry.target);
          const delay = Math.min(idx * 80, 320); // max 320ms stagger

          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);

          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -80px 0px',
      threshold: 0.08,
    });

    items.forEach(item => observer.observe(item));
  }

  return { init };
})();

/* ============================================================
   COUNTER ANIMATION — Hero stats
   ============================================================ */
const CounterAnimation = (() => {
  function animateCounter(el, target, duration = 1400) {
    let start     = null;
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    function step(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      el.textContent = Math.round(easeOut(progress) * target);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function init() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseInt(el.dataset.target, 10);
          animateCounter(el, target);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  return { init };
})();

/* ============================================================
   CURSOR GLOW — Follows mouse (desktop only)
   ============================================================ */
const CursorGlow = (() => {
  const glow = document.getElementById('cursorGlow');
  let raf    = null;
  let x = -1000, y = -1000;

  function update() {
    glow.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
    raf = null;
  }

  function init() {
    if (!glow || window.matchMedia('(hover: none)').matches) {
      glow?.style.setProperty('display', 'none');
      return;
    }

    document.addEventListener('mousemove', e => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });

    // Hide when mouse leaves window
    document.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      glow.style.opacity = '1';
    });
  }

  return { init };
})();

/* ============================================================
   CONTACT FORM — mailto fallback
   ============================================================ */
const ContactForm = (() => {
  function init() {
    const form = document.getElementById('contactForm');
    const note = document.getElementById('formNote');

    if (!form) return;

    // Add subtle input focus effects
    form.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('focus', () => {
        field.closest('.form-group')?.classList.add('focused');
      });
      field.addEventListener('blur', () => {
        field.closest('.form-group')?.classList.remove('focused');
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();

      const name    = form.querySelector('#name')?.value.trim();
      const email   = form.querySelector('#email')?.value.trim();
      const subject = form.querySelector('#subject')?.value;
      const message = form.querySelector('#message')?.value.trim();

      // Basic validation
      if (!name || !email || !message) {
        showNote('Please fill in your name, email, and message.', 'error');
        return;
      }

      if (!isValidEmail(email)) {
        showNote('Please enter a valid email address.', 'error');
        return;
      }

      // Build mailto
      const subjectMap = {
        fulltime: 'Full-time Opportunity',
        contract: 'Contract / Consulting',
        cto:      'CTO / Technical Leadership Role',
        project:  'Project Collaboration',
        other:    'General Inquiry',
      };

      const subjectText = subjectMap[subject] || 'Portfolio Inquiry';
      const body = `Hi Amar,\n\n${message}\n\nBest,\n${name}`;
      const mailto = `mailto:amar.lamichhane@gmail.com?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;
      showNote('Opening your email client… Thank you for reaching out!', 'success');
      form.reset();
    });

    function isValidEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    function showNote(msg, type) {
      if (!note) return;
      note.textContent = msg;
      note.style.cssText = `
        display: block;
        margin-top: 12px;
        font-size: 13px;
        color: ${type === 'success' ? '#4ADE80' : '#FF6B6B'};
        text-align: center;
      `;
      setTimeout(() => { note.textContent = ''; }, 6000);
    }
  }

  return { init };
})();

/* ============================================================
   SMOOTH SCROLL — polyfill for older Safari
   ============================================================ */
const SmoothScroll = (() => {
  function init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const id = anchor.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-h')) || 72;

        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - navH,
          behavior: 'smooth',
        });
      });
    });
  }

  return { init };
})();

/* ============================================================
   PROJECT CARD — keyboard accessibility + tilt effect
   ============================================================ */
const ProjectCards = (() => {
  function init() {
    const cards = document.querySelectorAll('.project-card');

    cards.forEach(card => {
      // Subtle 3D tilt on hover (desktop)
      if (!window.matchMedia('(hover: none)').matches) {
        card.addEventListener('mousemove', e => {
          const rect   = card.getBoundingClientRect();
          const cx     = rect.left + rect.width / 2;
          const cy     = rect.top  + rect.height / 2;
          const dx     = (e.clientX - cx) / (rect.width / 2);
          const dy     = (e.clientY - cy) / (rect.height / 2);
          const rotX   = -dy * 3;
          const rotY   =  dx * 3;
          card.style.transform = `translateY(-5px) perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      }
    });
  }

  return { init };
})();

/* ============================================================
   SKILL TAGS — interactive hover label
   ============================================================ */
const SkillTags = (() => {
  function init() {
    // Animate skill tags staggered when category comes into view
    const categories = document.querySelectorAll('.skill-category');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const tags = entry.target.querySelectorAll('.skill-tag');
          tags.forEach((tag, i) => {
            setTimeout(() => {
              tag.style.opacity    = '1';
              tag.style.transform  = 'translateY(0)';
            }, i * 40);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    categories.forEach(cat => {
      // Set initial hidden state
      cat.querySelectorAll('.skill-tag').forEach(tag => {
        tag.style.opacity   = '0';
        tag.style.transform = 'translateY(12px)';
        tag.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      });
      observer.observe(cat);
    });
  }

  return { init };
})();

/* ============================================================
   TIMELINE — draw line animation on scroll
   ============================================================ */
const Timeline = (() => {
  function init() {
    const timeline = document.querySelector('.timeline');
    if (!timeline) return;

    const line = document.createElement('div');
    line.style.cssText = `
      position: absolute;
      left: 0;
      top: 8px;
      width: 2px;
      height: 0;
      background: linear-gradient(to bottom, var(--accent-1), var(--accent-2), transparent);
      border-radius: 2px;
      transition: height 1.5s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1;
    `;
    // Replace the CSS ::before line with JS-driven one for animation
    // (The CSS one still shows as fallback)

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          line.style.height = timeline.offsetHeight + 'px';
          observer.unobserve(timeline);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(timeline);
  }

  return { init };
})();

/* ============================================================
   PERFORMANCE — Preload hero fonts
   ============================================================ */
function preloadFonts() {
  // Fonts are loaded via <link> — just trigger a paint hint
  document.fonts.ready.then(() => {
    document.body.classList.add('fonts-loaded');
  });
}

/* ============================================================
   INIT — Bootstrap everything on DOMContentLoaded
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Navigation.init();
  ScrollReveal.init();
  CounterAnimation.init();
  CursorGlow.init();
  ContactForm.init();
  SmoothScroll.init();
  ProjectCards.init();
  SkillTags.init();
  Timeline.init();
  preloadFonts();

  // Log build info
  console.log(
    '%c Amar Lamichhane — Portfolio ',
    'background: linear-gradient(135deg, #7C6EFF, #00D4FF); color: #fff; font-weight: 700; padding: 4px 12px; border-radius: 4px;'
  );
  console.log('%c Full Stack Architect & CTO | 12+ Years Experience ', 'color: #9090B8;');
});
