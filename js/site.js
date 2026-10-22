/* ==========================================================================
   Terra site shell — header, mobile menu, waitlist modal, footer,
   Netlify AJAX forms, cookie banner, scroll reveal, toast.
   Plain HTML/JS (replaces the old p5-built menu.js), so it loads instantly,
   is keyboard accessible and works on every page.
   ========================================================================== */
(function () {
  'use strict';

  const Terra = (window.Terra = window.Terra || {});
  const path = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';

  const icons = {
    arrow:
      '<svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    heart:
      '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    user:
      '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
    close:
      '<svg class="icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
    share:
      '<svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>',
    drag:
      '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L4 15.5a1.5 1.5 0 0 1 2.3-1.9L9 16"/><path d="M3 4l2 2M3 8h2.5M7 2v2.5" opacity=".6"/></svg>',
    reset:
      '<svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/></svg>',
  };
  Terra.icons = icons;

  /* ---------------- Header ---------------- */
  const navLinks = [
    { href: '/generator', label: 'Build' },
    { href: '/about', label: 'About' },
  ];

  function isActive(href) {
    return href === path || (href !== '/' && path.startsWith(href));
  }

  function renderHeader() {
    const mount = document.getElementById('site-header');
    if (!mount) return;
    const links = navLinks
      .map((l) => `<a href="${l.href}" class="nav-link"${isActive(l.href) ? ' aria-current="page"' : ''}>${l.label}</a>`)
      .join('');

    mount.className = 'site-header';
    mount.innerHTML = `
      <div class="header-inner container">
        <nav class="nav nav--primary" aria-label="Primary">${links}</nav>
        <a class="brand" href="/" aria-label="Terra Impact — home">
          <img src="/assets/logo.svg" alt="Terra" width="124" height="25">
        </a>
        <div class="header-actions">
          <a href="/account" class="icon-btn" aria-label="Account"${isActive('/account') ? ' aria-current="page"' : ''}>${icons.user}</a>
          <a href="/saved-designs" class="icon-btn saved-link" aria-label="Saved designs"${isActive('/saved-designs') ? ' aria-current="page"' : ''}>${icons.heart}<span class="badge" data-saved-count hidden></span></a>
          <button type="button" class="btn btn--light btn--sm header-cta" data-open-waitlist>Join waitlist</button>
          <button type="button" class="menu-toggle" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
            <span></span><span></span>
          </button>
        </div>
      </div>
      <div class="mobile-menu" id="mobile-menu" hidden>
        <nav class="container" aria-label="Mobile">
          <a href="/" class="mobile-link"${path === '/' ? ' aria-current="page"' : ''}>Home</a>
          ${navLinks.map((l) => `<a href="${l.href}" class="mobile-link"${isActive(l.href) ? ' aria-current="page"' : ''}>${l.label}</a>`).join('')}
          <a href="/account" class="mobile-link">Account</a>
          <a href="/saved-designs" class="mobile-link">Saved designs <span class="badge badge--inline" data-saved-count hidden></span></a>
          <button type="button" class="btn btn--light btn--block" data-open-waitlist>Join waitlist</button>
        </nav>
      </div>`;

    const toggle = mount.querySelector('.menu-toggle');
    const menu = mount.querySelector('#mobile-menu');
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.hidden = !open;
      document.documentElement.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 860px)').addEventListener('change', (e) => e.matches && setOpen(false));

    const setCount = (n) =>
      mount.querySelectorAll('[data-saved-count]').forEach((b) => {
        b.textContent = n;
        b.hidden = !n;
      });
    let n = 0;
    try {
      n = JSON.parse(localStorage.getItem('terraSavedDesigns') || '[]').length + (localStorage.getItem('savedDesign') ? 1 : 0);
    } catch (_) {}
    setCount(n);
    document.addEventListener('terra:designs', (e) => setCount(e.detail));

    const onScroll = () => mount.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- Footer ---------------- */
  function renderFooter() {
    const mount = document.getElementById('site-footer');
    if (!mount) return;
    mount.className = 'site-footer';
    mount.innerHTML = `
      <div class="container footer-grid">
        <div class="footer-col footer-brand">
          <img src="/assets/logo.svg" alt="Terra" width="124" height="25">
          <p>Personalised, data-driven products that reflect your environmental impact.</p>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <a href="mailto:info@terraimpact.io">info@terraimpact.io</a>
        </div>
        <div class="footer-col">
          <h4>Links</h4>
          <a href="/">Home</a>
          <a href="/generator">Build your bottle</a>
          <a href="/about">About</a>
        </div>
        <div class="footer-col footer-subscribe">
          <h4>Subscribe</h4>
          <form name="subscribe" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-ajax class="inline-form">
            <input type="hidden" name="form-name" value="subscribe">
            <p hidden><label>Don’t fill this out: <input name="bot-field"></label></p>
            <label class="sr-only" for="footer-email">Email address</label>
            <input id="footer-email" type="email" name="email" placeholder="Email address" autocomplete="email" required>
            <button type="submit" class="btn btn--light btn--sm">Subscribe</button>
          </form>
          <p class="form-msg" data-form-success hidden>Thanks for subscribing! We’ll notify you soon.</p>
          <p class="form-msg form-msg--error" data-form-error hidden>Something went wrong — please try again.</p>
        </div>
        <div class="footer-col">
          <h4>Follow us</h4>
          <div class="socials">
            <a href="#" aria-label="Facebook" class="social"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9H17l.5-4h-4V8.8c0-.5.3-.8.5-.8z"/></svg></a>
            <a href="https://x.com" target="_blank" rel="noopener" aria-label="X (formerly Twitter)" class="social"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M18.2 2H21l-6.5 7.4L22 22h-6l-4.7-6.1L5.8 22H3l7-8L2 2h6.1l4.2 5.6L18.2 2zm-1 18h1.6L7 3.9H5.3L17.2 20z"/></svg></a>
            <a href="#" aria-label="Instagram" class="social"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
          </div>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>&copy; ${new Date().getFullYear()} Terra Impact. All rights reserved.</span>
        <span>Designed &amp; developed by <a href="https://designedbyroxanne.com" target="_blank" rel="noopener">designedbyroxanne.com</a></span>
      </div>`;
  }

  /* ---------------- Waitlist modal ---------------- */
  function renderModal() {
    const dlg = document.createElement('dialog');
    dlg.className = 'modal';
    dlg.id = 'waitlist-modal';
    dlg.setAttribute('aria-labelledby', 'waitlist-title');
    dlg.innerHTML = `
      <div class="modal-card">
        <button type="button" class="modal-close icon-btn" aria-label="Close" data-close>${icons.close}</button>
        <p class="eyebrow">Launching soon</p>
        <h2 id="waitlist-title">Join our waitlist</h2>
        <p class="muted">Be the first to know when Terra launches and pre-orders open.</p>
        <form name="waitlist" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-ajax class="stack-form">
          <input type="hidden" name="form-name" value="waitlist">
          <p hidden><label>Don’t fill this out: <input name="bot-field"></label></p>
          <label class="field">
            <span class="sr-only">Email</span>
            <input type="email" name="email" placeholder="Your email" autocomplete="email" required>
          </label>
          <label class="check">
            <input type="checkbox" name="marketingConsent" value="yes">
            <span>I agree to receive marketing communications from Terra Impact</span>
          </label>
          <button type="submit" class="btn btn--light btn--block">Submit ${icons.arrow}</button>
        </form>
        <p class="form-msg form-msg--success" data-form-success hidden>You’re on the list — we’ll notify you once we launch.</p>
        <p class="form-msg form-msg--error" data-form-error hidden>Oops! There was a problem submitting your form.</p>
      </div>`;
    document.body.appendChild(dlg);

    const open = () => {
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
      setTimeout(() => dlg.querySelector('input[type=email]')?.focus(), 30);
    };
    const close = () => {
      if (typeof dlg.close === 'function') dlg.close();
      else dlg.removeAttribute('open');
    };
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg || e.target.closest('[data-close]')) close();
    });
    dlg.addEventListener('close', () => {
      const form = dlg.querySelector('form');
      form.hidden = false;
      form.reset();
      dlg.querySelectorAll('[data-form-success],[data-form-error]').forEach((el) => (el.hidden = true));
    });
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-waitlist]')) {
        e.preventDefault();
        open();
      }
    });
    Terra.openWaitlist = open;
  }

  /* ---------------- Netlify AJAX forms ---------------- */
  function wireForms(root) {
    (root || document).querySelectorAll('form[data-ajax]').forEach((form) => {
      if (form._wired) return;
      form._wired = true;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const scope = form.parentElement;
        const ok = scope.querySelector('[data-form-success]');
        const err = scope.querySelector('[data-form-error]');
        const btn = form.querySelector('[type=submit]');
        if (err) err.hidden = true;
        btn && (btn.disabled = true);
        try {
          const res = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(new FormData(form)).toString(),
          });
          if (!res.ok) throw new Error(res.status);
          form.hidden = true;
          if (ok) ok.hidden = false;
        } catch (_) {
          if (err) err.hidden = false;
        } finally {
          btn && (btn.disabled = false);
        }
      });
    });
  }
  Terra.wireForms = wireForms;

  /* ---------------- Cookie banner ---------------- */
  function cookieBanner() {
    let seen = null;
    try {
      seen = localStorage.getItem('terraCookieConsent');
    } catch (_) {}
    if (seen) return;
    const bar = document.createElement('div');
    bar.className = 'cookie-banner';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie notice');
    bar.innerHTML = `
      <p>We use cookies to improve your experience. By using this site, you agree to our use of cookies.</p>
      <div class="cookie-actions">
        <button type="button" class="btn btn--outline btn--sm" data-cookie="declined">Decline</button>
        <button type="button" class="btn btn--light btn--sm" data-cookie="accepted">Accept</button>
      </div>`;
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar.classList.add('is-visible'));
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cookie]');
      if (!b) return;
      try {
        localStorage.setItem('terraCookieConsent', b.dataset.cookie);
      } catch (_) {}
      bar.classList.remove('is-visible');
      setTimeout(() => bar.remove(), 400);
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  function reveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---------------- Toast ---------------- */
  let toastTimer;
  Terra.toast = function (msg) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2600);
  };

  /* ---------------- Accordions (details[name] polyfill-ish) ---------------- */
  function accordions() {
    document.querySelectorAll('[data-accordion]').forEach((group) => {
      group.addEventListener(
        'toggle',
        (e) => {
          if (e.target.open) group.querySelectorAll('details[open]').forEach((d) => d !== e.target && (d.open = false));
        },
        true
      );
    });
  }

  function init() {
    renderHeader();
    renderFooter();
    renderModal();
    wireForms();
    cookieBanner();
    reveal();
    accordions();
    document.documentElement.classList.add('js-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
