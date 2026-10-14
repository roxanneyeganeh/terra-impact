/* ==========================================================================
   Generator — "Build your bottle"
   • Questions are generated from js/lib/survey.js
   • Pattern texture is re-rendered only when an answer changes
   • 3D preview (p5 instance mode) sized to its container, drag / arrow-key
     rotation, gentle idle spin
   • Answers persist for the session; "Product details" passes a snapshot
     of the preview to the product page
   ========================================================================== */
(function () {
  'use strict';
  if (!window.p5 || !window.Terra || !Terra.mosaic) return;

  const STORE_KEY = 'terraAnswers';
  const IMAGE_KEY = 'savedCanvasImage';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------------- State ---------------- */
  let answers = Terra.defaultAnswers();
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
    if (saved) answers = Object.assign(answers, saved);
  } catch (_) {}

  const save = () => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(answers));
    } catch (_) {}
  };

  /* ---------------- Build the form ---------------- */
  const form = $('#builder-form');
  const partIcon = (slot) => {
    // tiny glyph of the tile with only this slot filled
    const geo = Terra.mosaic.geometry(20);
    const path = (pts) => 'M' + pts.map((p) => `${(p.x + 14).toFixed(2)} ${(p.y + 14).toFixed(2)}`).join('L') + 'Z';
    const shapes = [];
    const add = (pts, s) => shapes.push(`<path d="${path(pts)}" fill="${s === slot ? 'currentColor' : 'none'}"/>`);
    geo.corners.forEach((p) => add(p, 5));
    geo.hexes.forEach((p, i) => add(p, i % 2 ? 4 : 3));
    geo.spikes.forEach((p, i) => add(p, i % 2 ? 2 : 1));
    add(geo.star, 0);
    return `<svg viewBox="0 0 28 28" width="18" height="18" stroke="currentColor" stroke-width=".6" stroke-opacity=".5" aria-hidden="true">${shapes.join('')}</svg>`;
  };

  Terra.QUESTIONS.forEach((q, idx) => {
    const fs = document.createElement('fieldset');
    fs.className = 'q';
    fs.dataset.slot = q.slot;
    const num = String(idx + 1).padStart(2, '0');
    let body = '';

    if (q.type === 'choice') {
      body = `<div class="choices">${q.options
        .map(
          (o) => `
        <label class="choice">
          <input type="radio" name="${q.id}" value="${o.value}"${answers[q.id] === o.value ? ' checked' : ''}>
          <span class="choice-body"><span class="swatch" style="--c:${o.color}"></span>${o.label}</span>
        </label>`
        )
        .join('')}</div>`;
    } else {
      body = `
        <div class="range-wrap">
          <div class="range-top">
            <span class="range-value"><span class="swatch" data-bin-swatch></span><strong data-out>${answers[q.id]}</strong><span class="range-bin">items / week</span></span>
            <span class="range-stepper">
              <button type="button" data-step="-1" aria-label="Fewer">−</button>
              <button type="button" data-step="1" aria-label="More">+</button>
            </span>
          </div>
          <input type="range" id="${q.id}" name="${q.id}" min="${q.min}" max="${q.max}" step="${q.step}" value="${answers[q.id]}" aria-label="${q.title}">
          <div class="range-scale"><span>${q.min}</span><span>${q.max}+</span></div>
        </div>`;
    }

    fs.innerHTML = `
      <legend><span class="q-num">${num}</span><span>${q.title}</span></legend>
      <p class="q-part">${partIcon(q.slot)}${q.part}</p>
      ${body}`;
    form.appendChild(fs);
  });

  const swatchBar = $('#stage-swatches');
  swatchBar.innerHTML = Terra.QUESTIONS.map((q) => `<span class="swatch" data-slot="${q.slot}" title="${q.short}"></span>`).join('');

  function syncRangeUI() {
    Terra.QUESTIONS.filter((q) => q.type === 'range').forEach((q) => {
      const input = form.querySelector(`input[name="${q.id}"]`);
      const v = Number(answers[q.id]);
      const color = q.colors[Terra.plasticBin(v)];
      input.value = v;
      input.style.setProperty('--pct', ((v - q.min) / (q.max - q.min)) * 100 + '%');
      input.style.setProperty('--thumb', color);
      input.setAttribute('aria-valuetext', `${v} items per week`);
      const fs = input.closest('.q');
      fs.querySelector('[data-out]').textContent = v >= q.max ? q.max + '+' : v;
      fs.querySelector('[data-bin-swatch]').style.setProperty('--c', color);
    });
  }

  function syncSwatches(colors) {
    swatchBar.querySelectorAll('.swatch').forEach((s) => s.style.setProperty('--c', colors[Number(s.dataset.slot)]));
  }

  form.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.name) return;
    answers[el.name] = el.type === 'range' ? Number(el.value) : el.value;
    update();
  });
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    const q = Terra.QUESTIONS.find((x) => x.type === 'range');
    answers[q.id] = Math.max(q.min, Math.min(q.max, Number(answers[q.id]) + Number(b.dataset.step)));
    update();
  });
  $('#reset-answers').addEventListener('click', () => {
    answers = Terra.defaultAnswers();
    Terra.QUESTIONS.forEach((q) => {
      if (q.type === 'choice') form.querySelector(`input[name="${q.id}"][value="${answers[q.id]}"]`).checked = true;
    });
    update();
    Terra.toast && Terra.toast('Answers reset');
  });

  /* ---------------- 3D preview ---------------- */
  const mount = $('#bottle-canvas');
  const loading = $('#stage-loading');
  const hint = $('#drag-hint');
  hint.innerHTML = `${Terra.icons.drag}<span>Drag to rotate</span>`;
  $('#reset-view').innerHTML = Terra.icons.reset;

  const rot = { x: 0, y: 0, z: 0 };
  let interacted = false;
  let sketch = null;
  let tex = null;
  let model = null;
  let dirty = true;
  let dragging = false;
  let last = null;

  function update() {
    save();
    syncRangeUI();
    const colors = Terra.colorsFor(answers);
    syncSwatches(colors);
    dirty = true;
  }

  function hideHint() {
    if (interacted) return;
    interacted = true;
    hint.classList.add('is-hidden');
  }

  sketch = new p5((p) => {
    p.setup = () => {
      const c = p.createCanvas(mount.clientWidth || 300, mount.clientHeight || 300, p.WEBGL);
      c.elt.setAttribute('aria-hidden', 'true');
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      p.angleMode(p.DEGREES);
      p.textureMode(p.NORMAL);
      p.textureWrap(p.REPEAT);

      tex = p.createGraphics(1024, 1024);
      tex.pixelDensity(1);

      p.loadModel(
        'assets/bottle.obj',
        true,
        (m) => {
          model = m;
          loading.classList.add('is-done');
        },
        () => {
          loading.innerHTML = 'Sorry — the 3D bottle couldn’t be loaded.';
        }
      );

      const resize = () => p.resizeCanvas(mount.clientWidth || 300, mount.clientHeight || 300);
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(mount);
      else window.addEventListener('resize', resize);
    };

    p.draw = () => {
      if (dirty) {
        Terra.mosaic.renderTexture(p, tex, Terra.colorsFor(answers));
        dirty = false;
      }
      p.background('#0A121C');
      if (!model) return;

      if (!interacted && !reduce && !dragging) rot.y += 0.25 * ((p.deltaTime || 16) / 16.67);

      const s = Math.min(p.height / 245, p.width / 150) * 0.92;
      p.push();
      p.scale(s);
      Terra.mosaic.drawBottle(p, model, tex, rot);
      p.pop();
    };
  }, mount);

  /* drag / keyboard rotation */
  mount.addEventListener('pointerdown', (e) => {
    dragging = true;
    last = { x: e.clientX, y: e.clientY };
    mount.setPointerCapture(e.pointerId);
    hideHint();
  });
  mount.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    rot.y += (e.clientX - last.x) * 0.5;
    rot.x = Math.max(-90, Math.min(90, rot.x + (e.clientY - last.y) * 0.5));
    last = { x: e.clientX, y: e.clientY };
  });
  const end = () => (dragging = false);
  mount.addEventListener('pointerup', end);
  mount.addEventListener('pointercancel', end);
  mount.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 30 : 10;
    const map = { ArrowLeft: [0, -step], ArrowRight: [0, step], ArrowUp: [step, 0], ArrowDown: [-step, 0] };
    if (!map[e.key]) return;
    e.preventDefault();
    hideHint();
    rot.x = Math.max(-90, Math.min(90, rot.x + map[e.key][0]));
    rot.y += map[e.key][1];
  });
  const saveBtn = $('#save-design');
  saveBtn.innerHTML = Terra.icons.heart;
  saveBtn.addEventListener('click', async () => {
    const cnv = mount.querySelector('canvas');
    if (!cnv || !model || !Terra.designs) return;
    const res = await Terra.designs.add(cnv, Object.assign({}, answers));
    if (res === 'saved') {
      saveBtn.classList.add('is-saved');
      Terra.toast('Saved to your designs');
    } else if (res === 'exists') Terra.toast('This design is already saved');
    else Terra.toast('Couldn’t save — storage may be full');
  });
  form.addEventListener('input', () => saveBtn.classList.remove('is-saved'));

  $('#reset-view').addEventListener('click', () => {
    rot.x = rot.y = rot.z = 0;
  });

  /* ---------------- Actions ---------------- */
  function snapshot(type, quality) {
    const cnv = mount.querySelector('canvas');
    return cnv ? cnv.toDataURL(type || 'image/jpeg', quality || 0.9) : null;
  }

  $('#product-details').addEventListener('click', () => {
    const data = snapshot('image/jpeg', 0.9);
    try {
      if (data) sessionStorage.setItem(IMAGE_KEY, data);
    } catch (_) {
      /* storage full — product page falls back to the stock photo */
    }
    save();
    window.location.href = '/trace-by-terra';
  });

  const shareBtn = $('#share-design');
  shareBtn.innerHTML = `${Terra.icons.share}<span>Share design</span>`;
  shareBtn.addEventListener('click', async () => {
    const cnv = mount.querySelector('canvas');
    const shareData = {
      title: 'My Terra bottle',
      text: 'Check out my eco-impact! I designed my Terra bottle from my everyday habits.',
      url: location.origin + '/generator',
    };
    try {
      const blob = await new Promise((res) => cnv.toBlob(res, 'image/png'));
      const file = blob && new File([blob], 'my-terra-bottle.png', { type: 'image/png' });
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(Object.assign({ files: [file] }, shareData));
        return;
      }
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      // Desktop fallback: download the image
      if (blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'my-terra-bottle.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        Terra.toast('Design downloaded');
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      Terra.toast('Couldn’t share — try again');
    }
  });

  update();
})();
