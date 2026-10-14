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
    // Seamless texture: a whole number of tiles edge to edge, no border, so it
    // wraps around the bottle (and repeats vertically) without a visible join.
    rows = rows || 5; // 5 tiles around the bottle ≈ the original tile size
    const sz = g.width / rows;
    const geo = geometry(sz);

    g.push();
    g.background(0);
    for (let c = 0; c < rows; c++) {
      for (let r = 0; r < rows; r++) drawTile(g, geo, (r + 0.5) * sz, (c + 0.5) * sz, colors);
    }
    g.pop();
  }

  /**
   * Replace the model's UVs with a clean cylindrical wrap: u goes once around
   * the bottle (0 → 1), v follows the height at the same scale, so tiles stay
   * square and the pattern meets itself at the back with no vertical line.
   * The join is placed where the model already has split vertices.
   */
  function wrapUVs(m) {
    const V = m.vertices;
    const uv = m.uvs;
    const n = V.length;
    if (!n || !uv || !uv.length) return m;
    // p5 stores model UVs either as [u, v] pairs (loadModel) or flat
    const nested = Array.isArray(uv[0]);
    const getU = (i) => (nested ? uv[i][0] : uv[i * 2]);
    const setUV = (i, a, b) => {
      if (nested) uv[i] = [a, b];
      else { uv[i * 2] = a; uv[i * 2 + 1] = b; }
    };

    let minY = Infinity, maxR = 0;
    for (const v of V) {
      minY = Math.min(minY, v.y);
      maxR = Math.max(maxR, Math.hypot(v.x, v.z));
    }
    const circ = 2 * Math.PI * maxR;
    const angle = (v) => ((Math.atan2(v.z, v.x) / (2 * Math.PI)) % 1 + 1) % 1;

    // find the existing seam: same position, very different original u
    const groups = new Map();
    V.forEach((v, i) => {
      const k = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
      (groups.get(k) || groups.set(k, []).get(k)).push(i);
    });
    const votes = new Map();
    groups.forEach((ids) => {
      if (ids.length < 2) return;
      const us = ids.map(getU);
      if (Math.max(...us) - Math.min(...us) < 0.3) return;
      const a = Math.round(angle(V[ids[0]]) * 64) / 64;
      votes.set(a, (votes.get(a) || 0) + 1);
    });
    let seam = 0, best = 0;
    votes.forEach((c, a) => { if (c > best) { best = c; seam = a; } });

    const u = new Float32Array(n);
    V.forEach((v, i) => (u[i] = (angle(v) - seam + 1) % 1));

    // vertices on the seam: give the copy used by "far side" faces u = 1
    const onSeam = (i) => u[i] < 1e-3 || u[i] > 1 - 1e-3;
    const toOne = new Uint8Array(n);
    for (const f of m.faces) {
      if (!f.some(onSeam)) continue;
      const far = f.some((i) => !onSeam(i) && u[i] > 0.5);
      f.forEach((i) => { if (onSeam(i) && far) toOne[i] = 1; });
    }

    V.forEach((v, i) => setUV(i, toOne[i] ? 1 : onSeam(i) ? 0 : u[i], (v.y - minY) / circ));
    return m;
  }

  /**
   * Draw the textured bottle + cap into a WEBGL p5 instance.
   * Matte, evenly lit body (no specular streak); smooth light-silver metal cap.
   */
  function drawBottle(p, model, tex, rot) {
    // Diffuse-only lighting: p5 adds the ambient term on top of the texture
    // (washes colours out), so light the body with soft directional lights.
    p.directionalLight(255, 255, 255, 0, 0, -1);
    p.directionalLight(150, 150, 150, -1, 0, -0.3);
    p.directionalLight(150, 150, 150, 1, 0, -0.3);
    p.directionalLight(70, 70, 70, 0, 1, -0.4);

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
    drawCap(p);
    p.pop();

    p.pop();
  }


  /**
   * Smooth metal cap built from primitives, in the bottle's local space.
   * +y points away from the bottle (towards the top of the cap).
   */
  function drawCap(p) {
    const R = 16; // outer radius
    const H = 20; // total height
    const E = 2.2; // radius of the rounded top edge
    p.ambientLight(40);
    p.noStroke();
    // smooth brushed-steel finish
    p.fill('#C3C8D0');
    p.ambientMaterial(190, 195, 202);
    p.specularMaterial(110);
    p.shininess(30);

    // main body: one smooth metal cylinder, no ridges or bands
    const bodyBottom = -H / 2;
    const bodyTop = H / 2 - E;
    p.push();
    p.translate(0, (bodyBottom + bodyTop) / 2, 0);
    p.cylinder(R, bodyTop - bodyBottom, 64, 1);
    p.pop();

    // rounded top edge
    p.push();
    p.translate(0, bodyTop, 0);
    p.rotateX(90);
    p.torus(R - E, E, 64, 16);
    p.pop();

    // flat top
    p.push();
    p.translate(0, bodyTop + E / 2, 0);
    p.cylinder(R - E + 0.05, E, 64, 1);
    p.pop();
  }

  Terra.mosaic = { geometry, drawTile, hitSlot, renderTexture, wrapUVs, drawBottle, borderTile };
})(window);
