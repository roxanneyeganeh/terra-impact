/* ==========================================================================
   Home · "Data-Driven Design" — explains which shape = which question.
   Hover / tap a shape (or pick a chip in the key) to highlight every
   matching shape and see the colour options. Colours come from the shared
   survey config, so this always matches the generator.
   ========================================================================== */
(function () {
  'use strict';
  const mount = document.getElementById('datapattern-canvas');
  const tip = document.getElementById('dd-tooltip');
  const legendEl = document.getElementById('dd-legend');
  if (!mount || !window.p5 || !window.Terra || !Terra.mosaic) return;

  const M = Terra.mosaic;
  const baseColors = Terra.colorsFor(Terra.defaultAnswers());
  let highlight = null; // slot number or null
  let pinned = false; // chosen from legend / tap
  let rows = 7;
  let sz = 0;
  let geo = null;
  let pInst = null;

  /* ----- legend chips ----- */
  const sorted = Terra.QUESTIONS.slice().sort((a, b) => a.slot - b.slot);
  if (legendEl) {
    legendEl.innerHTML = sorted
      .map((q) => {
        const dots = Terra.legendFor(q)
          .slice(0, 4)
          .map((r) => `<span class="swatch" style="--c:${r.color}"></span>`)
          .join('');
        return `<li><button type="button" data-slot="${q.slot}" aria-pressed="false"><span class="dots">${dots}</span>${q.short}</button></li>`;
      })
      .join('');
    legendEl.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-slot]');
      if (!b) return;
      const s = Number(b.dataset.slot);
      if (pinned && highlight === s) setHighlight(null, false);
      else setHighlight(s, true);
      showTip(null);
    });
  }

  function syncLegend() {
    legendEl &&
      legendEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(pinned && Number(b.dataset.slot) === highlight)));
  }

  function setHighlight(slot, pin) {
    if (slot === highlight && pin === pinned) return;
    highlight = slot;
    pinned = !!pin && slot != null;
    syncLegend();
    pInst && pInst.redraw();
  }

  /* ----- tooltip ----- */
  function showTip(slot, x, y) {
    if (!tip) return;
    if (slot == null) {
      tip.hidden = true;
      return;
    }
    const q = Terra.questionBySlot(slot);
    const rowsHtml = Terra.legendFor(q)
      .map((r) => `<li><span class="swatch" style="--c:${r.color}"></span>${r.label}</li>`)
      .join('');
    tip.innerHTML = `<div class="tt-part">${q.part}</div><div class="tt-title">${q.title}</div><ul>${rowsHtml}</ul>`;
    tip.hidden = false;
    // keep inside the stage horizontally
    const stage = tip.parentElement.getBoundingClientRect();
    const half = tip.offsetWidth / 2;
    const cx = Math.max(half + 4, Math.min(stage.width - half - 4, x));
    tip.style.left = cx + 'px';
    const above = y - tip.offsetHeight - 14 > 0;
    tip.style.top = (above ? y : y + tip.offsetHeight + 28) + 'px';
  }

  /* ----- sketch ----- */
  new p5((p) => {
    pInst = p;

    function layout() {
      const W = Math.max(200, Math.floor(mount.clientWidth));
      rows = W < 420 ? 5 : 7;
      sz = W / rows;
      geo = M.geometry(sz);
      p.resizeCanvas(W, W);
      p.redraw();
    }

    p.setup = () => {
      p.createCanvas(10, 10);
      p.noLoop();
      layout();
      if ('ResizeObserver' in window) new ResizeObserver(layout).observe(mount);
      else window.addEventListener('resize', layout);

      const cnv = p.canvas;
      const locate = (e) => {
        const r = cnv.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * p.width;
        const y = ((e.clientY - r.top) / r.height) * p.height;
        const col = Math.floor(x / sz);
        const row = Math.floor(y / sz);
        if (col < 0 || row < 0 || col >= rows || row >= rows) return { slot: null };
        const slot = M.hitSlot(geo, x - (col + 0.5) * sz, y - (row + 0.5) * sz);
        return { slot, x: e.clientX - r.left, y: e.clientY - r.top };
      };

      cnv.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const h = locate(e);
        cnv.style.cursor = h.slot != null ? 'pointer' : '';
        if (h.slot != null) {
          setHighlight(h.slot, false);
          showTip(h.slot, h.x, h.y);
        } else if (!pinned) {
          setHighlight(null, false);
          showTip(null);
        } else showTip(null);
      });
      cnv.addEventListener('pointerleave', () => {
        if (!pinned) setHighlight(null, false);
        showTip(null);
      });
      cnv.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        const h = locate(e);
        if (h.slot == null || (pinned && h.slot === highlight)) {
          setHighlight(null, false);
          showTip(null);
        } else {
          setHighlight(h.slot, true);
          showTip(h.slot, h.x, h.y);
        }
      });
    };

    p.draw = () => {
      p.background('#0b1520');
      if (!geo) return;
      let t = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < rows; c++, t++) {
          let cols = baseColors;
          if (highlight != null) {
            // Show the whole range of answers across the grid
            const q = Terra.questionBySlot(highlight);
            const opts = Terra.legendFor(q);
            cols = baseColors.slice();
            cols[highlight] = opts[(r + c) % opts.length].color;
          }
          M.drawTile(p, geo, (c + 0.5) * sz, (r + 0.5) * sz, cols, {
            highlight,
            dimColor: '#162233',
          });
        }
      }
    };
  }, mount);
})();
