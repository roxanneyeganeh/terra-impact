/* ==========================================================================
   Home · "The experience": interactive mosaic "T".
   Each piece flips between white and its colour when hovered (mouse) or
   tapped (touch).

   The T is built from exact geometry (not the hand-traced SVG pieces), so
   every gap between pieces is identical: two split hexagons along the top,
   two down the stem, and 4-point stars that slot into the hexagon points.
   ========================================================================== */
(function () {
  'use strict';
  const mount = document.getElementById('mosaic-intro');
  if (!mount || !window.p5) return;

  const GAP = 9; // gap between neighbouring pieces, in layout units (≈ the original look)
  const MAX_H = 420; // max canvas height in CSS px
  const WHITE = '#ffffff';
  const C = { orange: '#f59e45', blue: '#65b8e7', red: '#ec675a', green: '#76bd81' };

  /* ---------- geometry (layout units) ---------- */
  // Horizontal hexagon centred on (0,0), split into 6 cells through the centre.
  // Its left/right points are at ±136; the stars' concave sides fit them exactly.
  const HEX = [
    { key: 'TL', pts: [[0, 0], [-136, 0], [-116, -46], [-32, -85]] },
    { key: 'T', pts: [[0, 0], [-32, -85], [0, -99], [32, -85]] },
    { key: 'TR', pts: [[0, 0], [32, -85], [116, -46], [136, 0]] },
    { key: 'BL', pts: [[0, 0], [-32, 85], [-116, 46], [-136, 0]] },
    { key: 'B', pts: [[0, 0], [32, 85], [0, 99], [-32, 85]] },
    { key: 'BR', pts: [[0, 0], [136, 0], [116, 46], [32, 85]] },
  ];
  // 4-point star: tips on the diagonals, inner points 25 from the centre.
  const STAR = [[-45, -46], [0, -25], [45, -46], [25, 0], [45, 46], [0, 25], [-45, 46], [-25, 0]];

  // colours per cell (matches the original artwork)
  const H_COL = { TL: C.orange, T: C.red, TR: C.blue, BL: C.blue, B: C.red, BR: C.orange };
  // vertical hexagons are the horizontal one mirrored across the diagonal
  const V_COL = { TL: C.blue, T: C.red, TR: C.orange, BL: C.orange, B: C.red, BR: C.blue };

  const S = 161; // centre-to-centre distance between a star and a hexagon (136 + 25)
  const pieces = [];
  const addStar = (cx, cy) => pieces.push({ pts: STAR.map(([x, y]) => [x + cx, y + cy]), color: C.green });
  const addHex = (cx, cy, vertical) =>
    HEX.forEach((c) =>
      pieces.push({
        pts: c.pts.map(([x, y]) => (vertical ? [y + cx, x + cy] : [x + cx, y + cy])),
        color: (vertical ? V_COL : H_COL)[c.key],
      })
    );

  // top bar: star · hexagon · star · hexagon · star
  addStar(0, 0);
  addHex(S, 0, false);
  addStar(2 * S, 0);
  addHex(3 * S, 0, false);
  addStar(4 * S, 0);
  // stem hangs from the middle star: hexagon · star · hexagon · star
  addHex(2 * S, S, true);
  addStar(2 * S, 2 * S);
  addHex(2 * S, 3 * S, true);
  addStar(2 * S, 4 * S);

  // shrink every piece by half the gap, so neighbours end up exactly GAP apart
  function inset(pts, d) {
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      area += x1 * y2 - x2 * y1;
    }
    const s = area > 0 ? 1 : -1; // orientation → which side is "inside"
    const lines = pts.map((a, i) => {
      const b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      const nx = (-dy / len) * s, ny = (dx / len) * s; // inward normal
      return { p: [a[0] + nx * d, a[1] + ny * d], v: [dx, dy] };
    });
    return lines.map((l1, i) => {
      const l0 = lines[(i - 1 + lines.length) % lines.length];
      const den = l0.v[0] * l1.v[1] - l0.v[1] * l1.v[0];
      if (Math.abs(den) < 1e-9) return l1.p;
      const t = ((l1.p[0] - l0.p[0]) * l1.v[1] - (l1.p[1] - l0.p[1]) * l1.v[0]) / den;
      return [l0.p[0] + l0.v[0] * t, l0.p[1] + l0.v[1] * t];
    });
  }
  pieces.forEach((pc) => (pc.pts = inset(pc.pts, GAP / 2)));

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  pieces.forEach((pc) =>
    pc.pts.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    })
  );
  const box = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  mount.style.aspectRatio = `${box.w} / ${box.h}`;

  function inside([px, py], poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }

  /* ---------- sketch ---------- */
  new p5((p) => {
    const on = new Array(pieces.length).fill(false);
    let k = 1;
    let hoverIdx = -1;

    function layout() {
      const W = mount.clientWidth || 300;
      k = Math.min(W / box.w, MAX_H / box.h);
      p.resizeCanvas(Math.floor(box.w * k), Math.floor(box.h * k));
      p.redraw();
    }

    function hit(e) {
      const r = p.canvas.getBoundingClientRect();
      const mx = ((e.clientX - r.left) * (p.width / r.width)) / k + box.x;
      const my = ((e.clientY - r.top) * (p.height / r.height)) / k + box.y;
      for (let i = pieces.length - 1; i >= 0; i--) if (inside([mx, my], pieces[i].pts)) return i;
      return -1;
    }

    p.setup = () => {
      p.createCanvas(10, 10);
      p.noLoop();
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
      layout();
      if ('ResizeObserver' in window) new ResizeObserver(layout).observe(mount);
      else window.addEventListener('resize', layout);
    };

    p.draw = () => {
      p.clear();
      p.noStroke();
      p.push();
      p.scale(k);
      p.translate(-box.x, -box.y);
      pieces.forEach((pc, i) => {
        p.fill(on[i] ? pc.color : WHITE);
        p.beginShape();
        pc.pts.forEach(([x, y]) => p.vertex(x, y));
        p.endShape(p.CLOSE);
      });
      p.pop();
    };
  }, mount);
})();
