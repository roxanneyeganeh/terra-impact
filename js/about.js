/* ==========================================================================
   About page
   1. Intro: two statements cross-fade as you scroll (sticky, no fixed hacks)
   2. 100-dot "ripple" grid with facts (hover, tap or keyboard)
   3. Colour reference guide generated from the survey config
   ========================================================================== */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 1. Intro scroll ---------------- */
  const intro = document.getElementById('intro');
  if (intro) {
    if (reduce) intro.classList.add('is-static');
    else {
      let ticking = false;
      const update = () => {
        ticking = false;
        const r = intro.getBoundingClientRect();
        const travel = intro.offsetHeight - window.innerHeight;
        const p = Math.max(0, Math.min(1, -r.top / Math.max(1, travel)));
        intro.style.setProperty('--p', p.toFixed(3));
      };
      window.addEventListener(
        'scroll',
        () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
          }
        },
        { passive: true }
      );
      window.addEventListener('resize', update);
      update();
    }
  }

  /* ---------------- 2. Dot grid ---------------- */
  const grid = document.getElementById('dot-grid');
  const readout = document.getElementById('dot-readout');
  if (grid && readout) {
    const FACTS = [
      '1 Terra bottle sold',
      '100 plastic bottles kept out of oceans',
      '11.4 kg ocean-bound plastic per 10 bottles',
      'Supports community plastic collection',
      'Promotes reuse over single-use plastic',
      'Made with 67% recycled materials',
      'Designed for longevity and circularity',
      'Helps reduce ocean plastic pollution',
      'Contributes to cleaner beaches',
      'Supports waste infrastructure improvements',
    ];
    const DEFAULT = readout.textContent;
    // spread the fact dots across the grid instead of clumping them at the start
    const FACT_POS = [0, 7, 13, 22, 28, 36, 44, 51, 57, 63, 69, 75, 82, 88, 94];

    const frag = document.createDocumentFragment();
    for (let i = 0; i < 100; i++) {
      const k = FACT_POS.indexOf(i);
      let el;
      if (k >= 0) {
        el = document.createElement('button');
        el.type = 'button';
        el.className = 'dot dot--fact' + (i === 0 ? ' dot--first' : '');
        el.dataset.fact = i === 0 ? FACTS[0] : FACTS[(k % (FACTS.length - 1)) + 1];
        el.setAttribute('aria-label', el.dataset.fact);
      } else {
        el = document.createElement('span');
        el.className = 'dot';
        el.setAttribute('aria-hidden', 'true');
      }
      el.style.setProperty('--i', i);
      frag.appendChild(el);
    }
    grid.appendChild(frag);

    let active = null;
    const show = (dot) => {
      if (active) active.classList.remove('is-active');
      active = dot;
      if (dot) {
        dot.classList.add('is-active');
        readout.textContent = dot.dataset.fact;
        readout.classList.add('is-fact');
      } else {
        readout.textContent = DEFAULT;
        readout.classList.remove('is-fact');
      }
    };
    grid.addEventListener('pointerover', (e) => {
      const d = e.target.closest('.dot--fact');
      if (d && e.pointerType === 'mouse') show(d);
    });
    grid.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && show(null));
    grid.addEventListener('click', (e) => {
      const d = e.target.closest('.dot--fact');
      if (d) show(active === d && e.pointerType !== 'mouse' ? null : d);
    });
    grid.addEventListener('focusin', (e) => {
      const d = e.target.closest('.dot--fact');
      if (d) show(d);
    });

    if (reduce || !('IntersectionObserver' in window)) grid.classList.add('is-in');
    else {
      const io = new IntersectionObserver(
        (en) => {
          if (en[0].isIntersecting) {
            grid.classList.add('is-in');
            io.disconnect();
          }
        },
        { threshold: 0.3 }
      );
      io.observe(grid);
    }
  }

  /* ---------------- 3. Colour guide ---------------- */
  const guide = document.getElementById('guide-grid');
  if (guide && window.Terra && Terra.mosaic) {
    const geo = Terra.mosaic.geometry(100);
    const off = 50 * Math.SQRT2;
    const d = (pts) => 'M' + pts.map((p) => `${(p.x + off).toFixed(1)} ${(p.y + off).toFixed(1)}`).join('L') + 'Z';
    const base = Terra.colorsFor(Terra.defaultAnswers());

    const tileSVG = (slot, color) => {
      const parts = [];
      const add = (pts, s) => {
        const on = s === slot;
        parts.push(`<path d="${d(pts)}" fill="${on ? color : '#162233'}" stroke="${on ? '#fff' : 'rgba(255,255,255,.18)'}" stroke-width="${on ? 1.6 : 1}"/>`);
      };
      geo.corners.forEach((p) => add(p, 5));
      geo.spikes.forEach((p, i) => add(p, i % 2 ? 2 : 1));
      geo.hexes.forEach((p, i) => add(p, i % 2 ? 4 : 3));
      add(geo.star, 0);
      const pad = off - 50;
      return `<svg viewBox="${pad} ${pad} 100 100" aria-hidden="true">${parts.join('')}</svg>`;
    };

    guide.innerHTML = Terra.QUESTIONS.slice()
      .sort((a, b) => a.slot - b.slot)
      .map((q) => {
        const rows = Terra.legendFor(q)
          .map((r) => `<li><span class="swatch" style="--c:${r.color}"></span>${r.label}</li>`)
          .join('');
        return `
          <article class="guide-card">
            <div class="guide-tile">${tileSVG(q.slot, base[q.slot])}</div>
            <p class="guide-part">${q.part}</p>
            <h3 class="guide-q">${q.title}</h3>
            <ul class="guide-swatches${q.type === 'range' ? ' guide-swatches--range' : ''}">${rows}</ul>
          </article>`;
      })
      .join('');
  }
})();
