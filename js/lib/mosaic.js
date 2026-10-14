/* ==========================================================================
   Terra mosaic — the "mosaic31" tile geometry and drawing routines.
   Previously copy-pasted into generator.js, spinbot.js, sketch.js, test.js
   and datapattern.js; now shared. Pure maths (degrees), works with any
   p5 renderer or p5.Graphics passed in as `g`.
   ========================================================================== */
(function (global) {
  'use strict';

  const Terra = (global.Terra = global.Terra || {});
  const RAD = Math.PI / 180;
  const SQ2 = Math.SQRT2;

  const pt = (x, y) => ({ x, y });
  const polar = (l, a) => pt(l * Math.cos(a * RAD), l * Math.sin(a * RAD));
  const add = (a, b) => pt(a.x + b.x, a.y + b.y);

  const STROKE_OUTER = 'ivory';
  const STROKE_INNER = 'navy';
  const W_OUTER = 0.03;
  const W_INNER = 0.015;

  /** Build the polygons for one tile of size `sz`, centred on (0,0). */
  function geometry(sz) {
    const r = sz / 4;
    const star = [];
    const spikes = [];
    for (let i = 0; i < 8; i++) {
      const ang = i * 45;
      star[i * 2] = polar(r * Math.cos(40 * RAD), ang);
      star[i * 2 + 1] = polar(r, ang + 22.5);
      spikes[i] = [
        polar(r, ((i + 7) % 8) * 45 + 22.5),
        polar(r * Math.cos(40 * RAD), ang),
        polar(r, ang + 22.5),
        polar(2 * r, ang),
      ];
    }

    const R = (sz / 2) * SQ2;
    const r2 = R - sz / 2;
    const corners = [];
    for (let i = 0; i < 4; i++) {
      const ang = i * 90 + 45;
      const c = polar(R, ang);
      corners[i] = [
        c,
        add(polar(r2 * Math.cos(67.5 * RAD), 180 + i * 90), c),
        add(polar(r2, ang + 180), c),
        add(polar(r2 * Math.cos(67.5 * RAD), 270 + i * 90), c),
      ];
    }

    const hexes = [];
    for (let i = 0; i < 8; i++) {
      const k = Math.floor(i / 2);
      hexes[i] =
        i % 2 === 0
          ? [spikes[i][3], spikes[i][2], spikes[(i + 1) % 8][3], corners[k][3]]
          : [corners[k][1], spikes[i][3], spikes[i][2], spikes[(i + 1) % 8][3]];
    }

    return { sz, star, spikes, corners, hexes };
  }

  function poly(g, pts) {
    g.beginShape();
    for (const p of pts) g.vertex(p.x, p.y);
    g.endShape(g.CLOSE || 'close');
  }

  /**
   * Draw one tile at (x, y).
   * colors: [star, spikeA, spikeB, hexA, hexB, corners]
   * opts.highlight: slot number to emphasise (others dimmed) – used by the
   * data-pattern explainer.
   */
  function drawTile(g, geo, x, y, colors, opts) {
    opts = opts || {};
    const hl = opts.highlight;
    const dim = opts.dimColor || '#1b2533';
    const col = (slot) => (hl == null || hl === slot ? colors[slot] : dim);
    const sz = geo.sz;

    g.push();
    g.translate(x, y);
    g.noStroke();

    g.fill(col(0));
    poly(g, geo.star);

    geo.spikes.forEach((p, i) => {
      g.fill(col(i % 2 === 0 ? 1 : 2));
      poly(g, p);
    });

    g.fill(col(5));
    geo.corners.forEach((p) => poly(g, p));

    g.strokeWeight(sz * W_OUTER);
    g.stroke(opts.outline || STROKE_OUTER);
    geo.hexes.forEach((p, i) => {
      g.fill(col(i % 2 === 0 ? 3 : 4));
      poly(g, p);
    });

    g.strokeWeight(sz * W_INNER);
    g.stroke(opts.outline || STROKE_INNER);
    g.fill(col(0));
    poly(g, geo.star);

    g.pop();
  }

  /** Which slot (0–5) is under local point (px, py) relative to a tile centre, or null. */
  function hitSlot(geo, px, py) {
    const p = pt(px, py);
    if (inPoly(p, geo.star)) return 0;
    for (let i = 0; i < 8; i++) if (inPoly(p, geo.spikes[i])) return i % 2 === 0 ? 1 : 2;
    for (let i = 0; i < 8; i++) if (inPoly(p, geo.hexes[i])) return i % 2 === 0 ? 3 : 4;
    for (let i = 0; i < 4; i++) if (inPoly(p, geo.corners[i])) return 5;
    return null;
  }

  function inPoly(p, vs) {
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i].x, yi = vs[i].y, xj = vs[j].x, yj = vs[j].y;
      if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  /** Small aliceblue square with a steelblue 4-point star (border tile). */
  function borderTile(p, size) {
    const t = p.createGraphics(size, size);
    t.pixelDensity(1);
    t.noStroke();
    t.fill('aliceblue');
    t.rect(0, 0, size, size);
    t.strokeWeight(size * 0.05);
    t.stroke('steelblue');
    t.fill('steelblue');
    const c = pt(size / 2, size / 2);
    const r = size / 2;
    const s = [];
    for (let i = 0; i < 4; i++) {
      s.push(add(polar(0.8 * r, i * 90), c));
      s.push(add(polar(0.3 * r, i * 90 + 45), c));
    }
    poly(t, s);
    return t;
  }

  /**
   * Render the full bottle texture (7×7 tiles + patterned border) into
   * graphics `g` (square). `p` is the owning p5 instance.
   */
  function renderTexture(p, g, colors, rows) {
    rows = rows || 7;
    const W = g.width;
    const count = 27;
    const bsz = W / count;
    const sz = (W - bsz * 2) / rows;
    const geo = geometry(sz);
    const org = bsz + sz / 2;

    g.push();
    g.background(0);
    for (let c = 0; c < rows; c++) {
      for (let r = 0; r < rows; r++) drawTile(g, geo, r * sz + org, c * sz + org, colors);
    }

    if (!g._terraBorder || g._terraBorder.width !== Math.round(bsz)) {
      g._terraBorder = borderTile(p, Math.round(bsz));
    }
    const tile = g._terraBorder;
    for (let i = 0; i < count; i++) {
      g.image(tile, i * bsz, 0, bsz, bsz);
      g.image(tile, W - bsz, i * bsz, bsz, bsz);
      g.image(tile, i * bsz, W - bsz, bsz, bsz);
      g.image(tile, 0, i * bsz, bsz, bsz);
    }
    g.pop();
  }

  /**
   * Draw the textured bottle + cap into a WEBGL p5 instance.
   * Matte, evenly lit body (no specular streak); glossy dark cap.
   */
  function drawBottle(p, model, tex, rot) {
    // Diffuse-only lighting: p5 adds the ambient term on top of the texture
    // (washes colours out), so light the body with soft directional lights.
    p.directionalLight(225, 225, 225, 0, 0, -1);
    p.directionalLight(90, 90, 90, -1, 0, -0.3);
    p.directionalLight(90, 90, 90, 1, 0, -0.3);

    p.push();
    p.rotateX(180);
    p.rotateY(180);
    p.rotateX(rot.x || 0);
    p.rotateY(rot.y || 0);
    p.rotateZ(rot.z || 0);

    // matte finish: no specular highlight on the body (avoids the bright streak)
    p.ambientMaterial(0);
    p.texture(tex);
    p.noStroke();
    p.model(model);

    p.push();
    p.translate(0, 90, 0);
    p.rotateX(180);
    p.fill('#2B2B2B');
    p.ambientLight(80);
    p.directionalLight(255, 255, 255, 0, -1, -1);
    p.directionalLight(200, 200, 255, 1, 0, -1);
    p.directionalLight(150, 150, 150, -1, 1, -0.5);
    p.ambientMaterial(200, 200, 200);
    p.specularMaterial(255);
    p.shininess(120);
    p.cylinder(16, 20);
    p.pop();

    p.pop();
  }

  Terra.mosaic = { geometry, drawTile, hitSlot, renderTexture, drawBottle, borderTile };
})(window);
