/* ==========================================================================
   Home · "The experience" — interactive SVG mosaic.
   Each shape flips between outline and colour when hovered (mouse) or
   tapped (touch). Canvas scales to its container instead of a fixed size.
   ========================================================================== */
(function () {
  'use strict';
  const mount = document.getElementById('mosaic-intro');
  if (!mount || !window.p5) return;

  // Original layout (x, y, scale) for shape1…shape29.svg
  const LAYOUT = [
    [41, 101, 0.3], [80, 83, 0.26], [80, 125, 0.26], [129, 74, 0.3], [128, 126, 0.3],
    [146, 82, 0.26], [146, 124, 0.26], [201, 100, 0.3], [242, 82, 0.26], [243, 124, 0.26],
    [293, 73, 0.3], [292, 126, 0.3], [310, 80, 0.26], [310, 124, 0.26], [365, 100, 0.3],
    [183, 140, 0.4], [226, 140, 0.4], [175, 190, 0.2], [225, 190, 0.2], [184, 210, 0.4],
    [226, 210, 0.4], [202, 265, 0.3], [184, 305, 0.4], [226, 305, 0.4], [175, 354, 0.2],
    [226, 354, 0.2], [184, 374, 0.4], [225, 374, 0.4], [201, 428, 0.3],
  ];
  const N = LAYOUT.length;
  const MAX_H = 560;

  new p5((p) => {
    const outline = [];
    const colour = [];
    const on = new Array(N).fill(false);
    let pending = N * 2;
    let ready = false;
    let box = null; // bounds in layout units
    let k = 1;
    let hoverIdx = -1;

    const dims = (i) => {
      const im = outline[i];
      const w = im && im.width > 0 ? im.width : 100;
      const h = im && im.height > 0 ? im.height : 100;
      return { w: w * LAYOUT[i][2], h: h * LAYOUT[i][2] };
    };

    function loaded() {
      if (--pending > 0) return;
      ready = true;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < N; i++) {
        const [x, y] = LAYOUT[i];
        const d = dims(i);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + d.w);
        maxY = Math.max(maxY, y + d.h);
      }
      box = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      mount.style.aspectRatio = `${box.w} / ${box.h}`;
      layout();
    }

    function layout() {
      if (!box) return;
      const W = mount.clientWidth || 300;
      k = Math.min(W / box.w, MAX_H / box.h);
      p.resizeCanvas(Math.floor(box.w * k), Math.floor(box.h * k));
      p.redraw();
    }

    p.setup = () => {
      p.createCanvas(10, 10);
      p.noLoop();
      for (let i = 0; i < N; i++) {
        outline[i] = p.loadImage(`assets/shape${i + 1}.svg`, loaded, loaded);
        colour[i] = p.loadImage(`assets/color${i + 1}.svg`, loaded, loaded);
      }
      const cnv = p.canvas;
      cnv.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const i = hit(e);
        if (i !== hoverIdx) {
          if (i >= 0) on[i] = !on[i];
          hoverIdx = i;
          cnv.style.cursor = i >= 0 ? 'pointer' : '';
          p.redraw();
        }
      });
      cnv.addEventListener('pointerleave', () => (hoverIdx = -1));
      cnv.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        const i = hit(e);
        if (i >= 0) {
          on[i] = !on[i];
          p.redraw();
        }
      });
      if ('ResizeObserver' in window) new ResizeObserver(layout).observe(mount);
      else window.addEventListener('resize', layout);
    };

    function hit(e) {
      if (!ready) return -1;
      const r = p.canvas.getBoundingClientRect();
      const mx = (e.clientX - r.left) * (p.width / r.width) / k + box.x;
      const my = (e.clientY - r.top) * (p.height / r.height) / k + box.y;
      for (let i = N - 1; i >= 0; i--) {
        const [x, y] = LAYOUT[i];
        const d = dims(i);
        if (mx >= x && mx <= x + d.w && my >= y && my <= y + d.h) return i;
      }
      return -1;
    }

    p.draw = () => {
      p.clear();
      if (!ready) return;
      p.push();
      p.scale(k);
      p.translate(-box.x, -box.y);
      for (let i = 0; i < N; i++) {
        const img = on[i] ? colour[i] : outline[i];
        if (!img || !img.width) continue;
        const d = dims(i);
        p.image(img, LAYOUT[i][0], LAYOUT[i][1], d.w, d.h);
      }
      p.pop();
    };
  }, mount);
})();
