/* Home hero: answer tags around the bottle.
   Hovering the bottle (or tapping it on touch screens) shows six tags, one per answer. Each tag has a tiny
   mosaic tile with only that answer's shape lit up. Tags sit either side of the bottle when there's room,
   all on the right when the left ones would reach the headline, and as a list under the bottle on phones. */
(function () {
  function start() {
    var list = document.getElementById('hx-card');
    if (!list || !window.Terra || !Terra.mosaic) return;
    var card = list.closest('.hx-card'), stage = card.closest('.hx-stage');
    var Q = Terra.QUESTIONS, last = '';
    card.hidden = true;

    var host = document.createElement('div');
    host.className = 'hx-tags';
    host.setAttribute('aria-label', 'The answers behind this pattern');
    stage.appendChild(host);

    // read the answers back out of the list the bottle script keeps up to date
    function read() {
      var a = Terra.defaultAnswers();
      list.querySelectorAll('li').forEach(function (li, i) {
        var q = Q[i], v = li.querySelector('.v').textContent;
        if (q.type === 'range') a[q.id] = parseInt(v, 10) || 0;
        else { var o = q.options.find(function (x) { return x.label === v; }); a[q.id] = o ? o.value : q.default; }
      });
      return a;
    }
    function label(q, a) { return q.type === 'range' ? a[q.id] + ' a week' : q.options.find(function (o) { return o.value === a[q.id]; }).label; }

    // canvas adapter so the shared mosaic drawing code can draw without p5
    function adapter(ctx) {
      var fillOn = true, strokeOn = true, first = true, st = [];
      return {
        CLOSE: 'close',
        push: function () { ctx.save(); st.push([fillOn, strokeOn]); },
        pop: function () { ctx.restore(); var s = st.pop(); if (s) { fillOn = s[0]; strokeOn = s[1]; } },
        translate: function (x, y) { ctx.translate(x, y); },
        noStroke: function () { strokeOn = false; },
        fill: function (c) { fillOn = true; ctx.fillStyle = c; },
        stroke: function (c) { strokeOn = true; ctx.strokeStyle = c; },
        strokeWeight: function (w) { ctx.lineWidth = w; },
        beginShape: function () { ctx.beginPath(); first = true; },
        vertex: function (x, y) { if (first) ctx.moveTo(x, y); else ctx.lineTo(x, y); first = false; },
        endShape: function () { ctx.closePath(); if (fillOn) ctx.fill(); if (strokeOn) ctx.stroke(); },
      };
    }
    function icon(cv, colors, slot) {
      var dpr = Math.min(2, devicePixelRatio || 1), w = 26;
      cv.width = w * dpr; cv.height = w * dpr;
      var ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineJoin = 'round';
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, w); ctx.clip();
      Terra.mosaic.drawTile(adapter(ctx), Terra.mosaic.geometry(w), w / 2, w / 2, colors, { highlight: slot, dimColor: '#23324a', outline: '#0a121c' });
      ctx.restore();
    }

    function render() {
      if (!list.children.length) return;
      var a = read(), key = JSON.stringify(a);
      if (key === last) return;
      last = key;
      var col = Terra.colorsFor(a);
      host.innerHTML = '<svg class="hx-tag-lines" aria-hidden="true"></svg>' + Q.map(function (q, i) {
        var k = q.id === 'plasticItems' ? 'Plastic' : q.short;
        return '<div class="hx-tag" style="--i:' + i + '"><canvas class="hx-tag-ico" data-slot="' + q.slot + '" aria-hidden="true"></canvas><span>' + k + '</span><b>' + label(q, a) + '</b></div>';
      }).join('');
      host.querySelectorAll('.hx-tag-ico').forEach(function (cv) { icon(cv, col, +cv.dataset.slot); });
      place();
    }

    function place() {
      var tags = host.querySelectorAll('.hx-tag'), svg = host.querySelector('.hx-tag-lines');
      if (!tags.length) return;
      host.classList.remove('is-below', 'is-right');
      if (!matchMedia('(min-width: 860px)').matches) {
        host.classList.add('is-below'); svg.innerHTML = '';
        tags.forEach(function (t) { t.style.top = t.style.left = t.style.right = ''; });
        return;
      }
      var b = document.getElementById('hx-bottle');
      var W = stage.clientWidth, H = stage.clientHeight, sr = stage.getBoundingClientRect();
      var s = Math.min(H / 245, W / 150) * parseFloat(b.dataset.size || 0.8);
      var cx = W / 2 + parseFloat(b.dataset.ox || 0) * W, half = 34 * s;
      // where the headline and buttons end, so tags never cover them
      var copyRight = -1e9, copy = document.querySelector('.hx-copy');
      if (copy) copy.querySelectorAll('h1, .btn-row > *').forEach(function (el) {
        var r = document.createRange(); r.selectNodeContents(el);
        var bb = el.tagName === 'H1' ? r.getBoundingClientRect() : el.getBoundingClientRect();
        copyRight = Math.max(copyRight, bb.right - sr.left);
      });
      var gutter = parseFloat(getComputedStyle(document.querySelector('.hx-grid')).paddingRight) || 24;
      var maxRight = document.documentElement.clientWidth - gutter - sr.left;
      var widths = [].map.call(tags, function (t) { return t.offsetWidth; });
      var lw = Math.max(widths[0], widths[1], widths[2]), rw = Math.max(widths[3], widths[4], widths[5]), all = Math.max.apply(null, widths);
      var gap = 0, both = false, right = false;
      [72, 48, 32].some(function (g) { gap = g; both = cx - half - g - lw >= copyRight + 32 && cx + half + g + rw <= maxRight; return both; });
      if (!both) [56, 36, 20].some(function (g) { gap = g; right = cx + half + g + all <= maxRight; return right; });
      if (!both && !right) { host.classList.add('is-below'); svg.innerHTML = ''; return; }
      if (right) host.classList.add('is-right');
      var lines = '';
      tags.forEach(function (t, i) {
        var left = both && i < 3, row = both ? i % 3 : i;
        var y = both ? [0.28, 0.47, 0.66][row] * H : (0.2 + row * 0.115) * H;
        var by = both ? [0.36, 0.47, 0.58][row] * H : (0.3 + row * 0.075) * H;
        var x = left ? cx - half - gap : cx + half + gap, ex = left ? cx - half + 6 : cx + half - 6;
        var kx = left ? ex - Math.min(30, gap * 0.45) : ex + Math.min(30, gap * 0.45);
        t.style.top = y + 'px';
        if (left) { t.style.right = (W - x) + 'px'; t.style.left = 'auto'; } else { t.style.left = x + 'px'; t.style.right = 'auto'; }
        lines += '<path d="M' + x + ' ' + y + ' H' + kx + ' L' + ex + ' ' + by + '" style="--i:' + i + '"/><circle cx="' + ex + '" cy="' + by + '" r="3" style="--i:' + i + '"/>';
      });
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.innerHTML = lines;
    }

    new MutationObserver(render).observe(list, { childList: true, subtree: true, characterData: true });
    if ('ResizeObserver' in window) new ResizeObserver(place).observe(stage);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
