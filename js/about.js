/* ==========================================================================
   About page
   1. Intro: two statements cross-fade as you scroll (sticky, no fixed hacks)
   2. Bottle count: 100 bottles fill in as a counter climbs to 100
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

  /* ---------------- 2. Bottle count ---------------- */
  const bottles = document.getElementById('bottle-grid');
  if (bottles) {
    const BOTTLE = '<svg viewBox="0 0 12 26" aria-hidden="true"><path d="M4 0h4v3.2c0 .6.4 1.1.9 1.5C10.8 6 12 7.6 12 10v14.2c0 1-.8 1.8-1.8 1.8H1.8C.8 26 0 25.2 0 24.2V10c0-2.4 1.2-4 3.1-5.3.5-.4.9-.9.9-1.5z"/></svg>';
    bottles.innerHTML = new Array(101).join(BOTTLE);
    const section = bottles.closest('.ripple');
    const num = document.getElementById('ripple-n');
    const facts = section.querySelectorAll('.ripple-facts li');
    // without motion (or IntersectionObserver) everything simply shows filled at 100
    if (!reduce && 'IntersectionObserver' in window) {
      const svgs = bottles.querySelectorAll('svg');
      section.classList.add('is-counting');
      num.textContent = '0';
      const count = () => {
        let k = 0;
        const t = setInterval(() => {
          svgs[k].classList.add('on');
          k++;
          num.textContent = k === 1 ? '0' : String(k);
          facts.forEach((li) => k >= +li.dataset.at && li.classList.add('on'));
          if (k >= svgs.length) clearInterval(t);
        }, 28);
      };
      const io = new IntersectionObserver(
        (en) => {
          if (en[0].isIntersecting) {
            io.disconnect();
            setTimeout(count, 300);
          }
        },
        { threshold: 0.4 }
      );
      io.observe(bottles);
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
