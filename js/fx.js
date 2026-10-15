/* ==========================================================================
   Terra FX — small entrance animations (off for reduced motion).

   [data-split]   headline words rise in one by one
   [data-count]   number counts up when it scrolls into view
                  (optional data-suffix, e.g. "×")
   ========================================================================== */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function onVisible(el, cb, threshold = 0.35) {
    if (!('IntersectionObserver' in window)) return cb();
    const io = new IntersectionObserver(
      (en) => {
        if (en[0].isIntersecting) {
          io.disconnect();
          cb();
        }
      },
      { threshold }
    );
    io.observe(el);
  }

  /* ---------- split headline ---------- */
  function split() {
    if (reduce) return;
    $$('[data-split]').forEach((el) => {
      el.setAttribute('aria-label', el.innerText.replace(/\s+/g, ' ').trim());
      const walk = (node) => {
        Array.from(node.childNodes).forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((w) => {
              if (!w) return;
              if (/^\s+$/.test(w)) return frag.appendChild(document.createTextNode(w));
              const outer = document.createElement('span');
              outer.className = 'w';
              const inner = document.createElement('span');
              inner.textContent = w;
              inner.setAttribute('aria-hidden', 'true');
              outer.appendChild(inner);
              frag.appendChild(outer);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
        });
      };
      walk(el);
      $$('.w > span', el).forEach((s, i) => (s.style.transitionDelay = 80 + i * 70 + 'ms'));
      el.classList.add('is-split');
      onVisible(el, () => requestAnimationFrame(() => el.classList.add('is-in')), 0.2);
    });
  }

  /* ---------- count up ---------- */
  function counters() {
    $$('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = (el.dataset.count.split('.')[1] || '').length;
      const suffix = el.dataset.suffix || '';
      if (!el.firstChild || el.firstChild.nodeType !== 3) el.prepend(document.createTextNode(''));
      const render = (v) => (el.firstChild.nodeValue = v.toFixed(decimals) + suffix);
      if (reduce) return render(target);
      render(0);
      onVisible(el, () => {
        const t0 = performance.now();
        const dur = 1400;
        const tick = (now) => {
          const t = Math.min(1, (now - t0) / dur);
          render(target * (1 - Math.pow(1 - t, 4))); // ease-out
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    });
  }

  function init() {
    split();
    counters();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
