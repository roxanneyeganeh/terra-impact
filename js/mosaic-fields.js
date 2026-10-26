/* ==========================================================================
   Mosaic fields: the Terra mosaic pattern on its normal grid behind a section,
   shown as a cascade (tiles lighting up in a slow diagonal sweep) or shape by
   shape (each question's shape lighting up in turn, in its real answer colours).
   Colours come only from the data visualisation (packaging) palette.
   ========================================================================== */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // colours come straight from the survey config, so every shape only ever shows a colour
  // that one of its question's answers can actually produce
  const ANSWERS = [
    { commute: 'bike', recycle: 'yes', plasticItems: 3, energyEfficient: 'yes', compost: 'yes', excessivePackaging: 'yes' },
    { commute: 'public', recycle: 'yes', plasticItems: 14, energyEfficient: 'no', compost: 'no', excessivePackaging: 'yes' },
  ];
  const setFor = (i) => Terra.colorsFor(ANSWERS[i] || ANSWERS[0]);
  const DIM = '#2a3446';

  function adapter(ctx) {
    let fillOn = true, strokeOn = true, first = true;
    const st = [];
    return {
      CLOSE: 'close', ROUND: 'round',
      push() { ctx.save(); st.push([fillOn, strokeOn]); },
      pop() { ctx.restore(); const s = st.pop(); if (s) { fillOn = s[0]; strokeOn = s[1]; } },
      translate(x, y) { ctx.translate(x, y); },
      noStroke() { strokeOn = false; }, noFill() { fillOn = false; },
      fill(c) { fillOn = true; ctx.fillStyle = c; },
      stroke(c) { strokeOn = true; ctx.strokeStyle = c; },
      strokeWeight(w) { ctx.lineWidth = w; },
      strokeJoin() { ctx.lineJoin = 'round'; },
      beginShape() { ctx.beginPath(); first = true; },
      vertex(x, y) { if (first) ctx.moveTo(x, y); else ctx.lineTo(x, y); first = false; },
      endShape() { ctx.closePath(); if (fillOn) ctx.fill(); if (strokeOn) ctx.stroke(); },
    };
  }
  function tileSprite(sz, colors, dpr, opts) {
    const c = document.createElement('canvas');
    c.width = c.height = Math.ceil(sz * dpr);
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    const g = adapter(ctx), geo = Terra.mosaic.geometry(sz);
    const o = Object.assign({ dimColor: DIM }, opts || {});
    Terra.mosaic.drawTile(g, geo, sz / 2, sz / 2, colors, Object.assign({}, o, { pass: 'fill' }));
    Terra.mosaic.drawTile(g, geo, sz / 2, sz / 2, colors, Object.assign({}, o, { pass: 'lines', outline: o.outline }));
    return c;
  }

  function field(host) {
    const colors = setFor(+host.dataset.set || 0);
    const cv = document.createElement('canvas');
    host.appendChild(cv);
    const g = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, sz = 64, img = null, slotImgs = [], visible = true, raf = 0;
    const t0 = performance.now();

    function layout() {
      const b = host.getBoundingClientRect();
      W = b.width; H = b.height; dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      sz = Math.max(48, Math.min(72, W / 19));
      img = tileSprite(sz, colors, dpr);
      // muted pattern, then for each question a set of tiles showing its real answer colours
      slotImgs = [tileSprite(sz, colors.map(() => DIM), dpr, { outline: '#3a465a' })];
      for (let slot = 0; slot < 6; slot++) {
        const opts = Terra.legendFor(Terra.questionBySlot(slot));
        slotImgs.push(opts.map((o) => tileSprite(sz, colors.map((c, k) => (k === slot ? o.color : DIM)), dpr, { outline: '#3a465a' })));
      }
      draw(performance.now());
    }

    // fill the field with one tile sprite
    function pattern(ox, oy, sprite) {
      const x0 = ((ox % sz) + sz) % sz - sz, y0 = ((oy % sz) + sz) % sz - sz;
      for (let y = y0; y < H; y += sz) for (let x = x0; x < W; x += sz) g.drawImage(sprite || img, x, y, sz, sz);
    }
    // tiles cycle through a question's answer colours, diagonally, like the data pattern's key
    function optionGrid(sprites) {
      for (let r = 0, y = 0; y < H; r++, y += sz) for (let c = 0, x = 0; x < W; c++, x += sz) g.drawImage(sprites[(r + c) % sprites.length], x, y, sz, sz);
    }

    function draw(now) {
      const t = (now - t0) / 1000, id = host.dataset.variant;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.globalAlpha = 1;

      if (id === 'cascade') {
        const cols = Math.ceil(W / sz), rows = Math.ceil(H / sz), span = cols + rows, period = 11;
        const p = ((t % period) / period) * (span + 20) - 10;
        const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const d = c + (rows - 1 - r), k = ease((p - d) / 6) * ease((d + 10 - p) / 6);
          g.globalAlpha = 0.1 + 0.9 * k;
          g.drawImage(img, c * sz, r * sz, sz, sz);
        }
        g.globalAlpha = 1;
      } else if (id === 'slots') {
        const step = 2.6, n = 6, i = Math.floor(t / step) % n, f = Math.min(1, ((t % step) / step) * 3);
        pattern(0, 0, slotImgs[0]);
        g.globalAlpha = f; optionGrid(slotImgs[i + 1]);
        g.globalAlpha = 1 - f; optionGrid(slotImgs[((i + n - 1) % n) + 1]);
        g.globalAlpha = 1;
      }
    }

    function loop(now) { raf = 0; if (!visible) return; draw(now); if (!reduce) raf = requestAnimationFrame(loop); }
    const kick = () => { if (!raf && visible) raf = requestAnimationFrame(loop); };
    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(host); else addEventListener('resize', layout);
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; kick(); }).observe(host);
    layout(); kick();
  }

  function init() {
    if (!window.Terra || !Terra.mosaic) return;
    const add = (sel, set, cls, variant) => {
      const s = document.querySelector(sel);
      if (!s) return;
      const d = document.createElement('div');
      d.className = 'mosaic-field ' + (cls || '');
      d.dataset.set = set;
      d.dataset.variant = variant;
      d.setAttribute('aria-hidden', 'true');
      s.prepend(d);
    };
    // cascade behind the sign-up areas (home, account); shape by shape on About's closing section and the 404
    add('.waitlist-band', 0, 'mosaic-field--bed', 'cascade');
    add('.cta-band', 1, 'mosaic-field--cta', 'slots');
    add('.auth', 1, 'mosaic-field--auth', 'cascade');
    add('.nf', 0, 'mosaic-field--nf', 'slots');
    document.querySelectorAll('.mosaic-field').forEach(field);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
