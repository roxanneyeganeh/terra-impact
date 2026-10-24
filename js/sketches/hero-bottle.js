/* Home hero: live 3D bottle on the mosaic floor. Hover for the "This bottle says" card, drag to spin, tap for a new pattern.
   <div id="hx-bottle" data-mode="cycle|try" data-tilt="-8" data-ground="0|1"> */
window.addEventListener('DOMContentLoaded', function () {
  var mount = document.getElementById('hx-bottle');
  var chips = document.getElementById('hx-chips');
  if (!mount || !window.p5 || !window.Terra || !Terra.mosaic) return;
  var mode = mount.dataset.mode || 'cycle';
  var tilt = parseFloat(mount.dataset.tilt || '-8');
  var ground = mount.dataset.ground === '1';
  var pedestal = mount.dataset.pedestal === '1';
  var size = parseFloat(mount.dataset.size || '0.9');
  var ox = parseFloat(mount.dataset.ox || '0'); // shift the bottle sideways on wide screens (fraction of canvas width)
  var wide = matchMedia('(min-width: 860px)');
  var stageEl = mount.closest('.hx-stage');
  var halo = document.getElementById('hx-halo');
  var card = document.getElementById('hx-card');
  var interactive = mount.dataset.interactive === '1';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var YN = { recycle: ['Recycles', 'Doesn’t recycle'], energyEfficient: ['Energy-efficient', 'Not energy-efficient'], compost: ['Composts', 'Doesn’t compost'], excessivePackaging: ['Avoids packaging', 'Excess packaging'] };

  function rand() {
    var a = {};
    Terra.QUESTIONS.forEach(function (q) { a[q.id] = q.type === 'range' ? Math.round(Math.random() * 50) : q.options[Math.floor(Math.random() * q.options.length)].value; });
    return a;
  }
  function describe(a) {
    if (card) {
      var cc = Terra.colorsFor(a);
      card.innerHTML = Terra.QUESTIONS.map(function (q) {
        var v = q.type === 'range' ? a[q.id] + ' items / week' : q.options.find(function (o) { return o.value === a[q.id]; }).label;
        return '<li><span class="swatch" style="--c:' + cc[q.slot] + '"></span><span class="k">' + (q.id === 'plasticItems' ? 'Plastic' : q.short) + '</span><span class="v">' + v + '</span></li>';
      }).join('');
    }
    if (!chips) return;
    var c = Terra.colorsFor(a);
    chips.innerHTML = Terra.QUESTIONS.map(function (q) {
      var l = q.type === 'range' ? a[q.id] + ' plastic / wk' : (YN[q.id] ? YN[q.id][a[q.id] === 'yes' ? 0 : 1] : q.options.find(function (o) { return o.value === a[q.id]; }).label);
      return '<li><span class="swatch" style="--c:' + c[q.slot] + '"></span>' + l + '</li>';
    }).join('');
  }

  var answers = Terra.defaultAnswers();
  var setAnswers = null;
  describe(answers);

  // "try it" controls: transport + recycling, plus Surprise me
  var tryEl = document.getElementById('hx-try');
  if (tryEl && mode === 'try') {
    var q1 = Terra.QUESTIONS.find(function (q) { return q.id === 'commute'; });
    var q2 = Terra.QUESTIONS.find(function (q) { return q.id === 'recycle'; });
    function group(q) {
      return '<div class="try-q"><span class="try-label">' + q.title + '</span><div class="try-opts">' + q.options.map(function (o) {
        return '<button type="button" class="try-opt" data-q="' + q.id + '" data-v="' + o.value + '" aria-pressed="' + (answers[q.id] === o.value) + '"><span class="swatch" style="--c:' + o.color + '"></span>' + o.label + '</button>';
      }).join('') + '</div></div>';
    }
    tryEl.innerHTML = group(q1) + group(q2);
    tryEl.addEventListener('click', function (e) {
      var b = e.target.closest('.try-opt');
      if (!b) return;
      answers = Object.assign({}, answers);
      answers[b.dataset.q] = b.dataset.v;
      tryEl.querySelectorAll('.try-opt[data-q="' + b.dataset.q + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      setAnswers && setAnswers(answers, true);
    });
  }

  new p5(function (p) {
    var plinth = null;
    var drag = null, hold = 0;
    var model = null, tex, tOld, tNew, fade = -1, last = 0, spin = 0, rot = { x: 0, y: 0, z: 0 };
    setAnswers = function (a, kick) {
      describe(a);
      tOld.clear(); tOld.image(tex, 0, 0);
      Terra.mosaic.renderTexture(p, tNew, Terra.colorsFor(a));
      fade = p.millis();
      if (kick && !reduce) spin = 14;
      paintHalo(a);
    };
    // big, soft pattern "aura" behind the bottle (2D copy of the current pattern)
    function paintHalo(a) {
      var plinthEl = document.getElementById('hx-plinth');
      if (!halo && !plinthEl) return;
      var g = p.createGraphics(512, 512); g.pixelDensity(1);
      Terra.mosaic.renderTexture(p, g, Terra.colorsFor(a), 3);
      var url = g.elt.toDataURL('image/jpeg', 0.8); g.remove();
      [halo, plinthEl].forEach(function (host) {
        if (!host) return;
        var next = document.createElement('div'); next.className = 'hx-halo-layer'; next.style.backgroundImage = 'url(' + url + ')';
        host.appendChild(next);
        requestAnimationFrame(function () { next.classList.add('is-on'); });
        var old = host.querySelectorAll('.hx-halo-layer');
        if (old.length > 2) old[0].remove();
      });
    }
    p.setup = function () {
      p.createCanvas(mount.clientWidth, mount.clientHeight, p.WEBGL);
      p.setAttributes('alpha', true);
      p.pixelDensity(Math.min(2, devicePixelRatio || 1));
      p.angleMode(p.DEGREES); p.textureMode(p.NORMAL); p.textureWrap(p.REPEAT);
      tex = p.createGraphics(1024, 1024); tOld = p.createGraphics(1024, 1024); tNew = p.createGraphics(1024, 1024);
      [tex, tOld, tNew].forEach(function (g) { g.pixelDensity(1); });
      Terra.mosaic.renderTexture(p, tex, Terra.colorsFor(answers));
      paintHalo(answers);
      if (pedestal) { plinth = p.createGraphics(512, 512); plinth.pixelDensity(1); Terra.mosaic.renderTexture(p, plinth, Terra.colorsFor(answers), 4); }
      p.loadModel('assets/bottle.obj', true, function (m) { model = Terra.mosaic.wrapUVs(m); });
      new ResizeObserver(function () { p.resizeCanvas(mount.clientWidth, mount.clientHeight); }).observe(mount);
      if (interactive) bindPointer();
    };
    // drag to spin (with a fling), tap for a new pattern; hovering pauses the auto-cycle
    function bindPointer() {
      mount.style.cursor = 'grab';
      mount.style.touchAction = 'pan-y';
      mount.addEventListener('pointerenter', function () { hold = Infinity; });
      mount.addEventListener('pointerleave', function () { if (!drag) hold = p.millis() + 2500; });
      mount.addEventListener('pointerdown', function (e) {
        drag = { x0: e.clientX, y0: e.clientY, last: e.clientX, moved: 0, v: 0 };
        hold = Infinity; spin = 0;
        try { mount.setPointerCapture(e.pointerId); } catch (err) {}
        mount.style.cursor = 'grabbing';
      });
      mount.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var dx = e.clientX - drag.last; drag.last = e.clientX;
        drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0));
        rot.y += dx * 0.6; drag.v = dx * 0.6;
      });
      function end(e, cancelled) {
        if (!drag) return;
        var tap = !cancelled && drag.moved < 6;
        if (tap) { answers = rand(); setAnswers(answers, true); if (stageEl) stageEl.classList.add('is-show'); }
        else if (!cancelled) spin = Math.max(-25, Math.min(25, drag.v));
        drag = null; last = p.millis();
        hold = e.pointerType === 'mouse' ? Infinity : p.millis() + 6000;
        mount.style.cursor = 'grab';
        if (hint) hint.classList.add('is-used');
      }
      mount.addEventListener('pointerup', function (e) { end(e, false); });
      mount.addEventListener('pointercancel', function (e) { end(e, true); });
    }
    var hint = document.getElementById('hx-hint');
    p.draw = function () {
      p.clear();
      if (!model) return;
      var k = (p.deltaTime || 16) / 16.67;
      if (!reduce) {
        if (!drag) { rot.y += (0.35 + spin) * k; spin *= Math.pow(0.93, k); }
        if (mode === 'cycle' && !drag && p.millis() > hold && p.millis() - last > 3600) {
          last = p.millis();
          answers = rand();
          setAnswers(answers, false);
        }
      }
      if (fade >= 0) {
        var t = Math.min(1, (p.millis() - fade) / 600), e = t * t * (3 - 2 * t);
        tex.image(tOld, 0, 0); tex.drawingContext.globalAlpha = e; tex.image(tNew, 0, 0); tex.drawingContext.globalAlpha = 1;
        if (t >= 1) fade = -1;
      }
      var s = Math.min(p.height / 245, p.width / 150) * size;
      if (ox && wide.matches) p.translate(ox * p.width, 0, 0);
      if (pedestal) {
        // a low round plinth: mosaic band around the side, dark top
        p.push(); p.noLights(); p.ambientLight(210);
        p.translate(0, 118 * s, 0); p.rotateX(-10);
        p.push(); p.rotateY(rot.y * 0.25); p.noStroke(); p.texture(plinth); p.cylinder(78 * s, 16 * s, 64, 1, false, false); p.pop();
        p.push(); p.translate(0, -8 * s, 0); p.rotateX(90); p.noStroke(); p.fill('#142335'); p.circle(0, 0, 156 * s); p.pop();
        p.pop();
      }
      if (ground) {
        // soft shadow on the floor image
        p.push(); p.noLights(); p.noStroke(); p.translate(0, 112 * s, 0); p.rotateX(90);
        for (var i = 6; i >= 1; i--) { p.fill(0, 0, 0, 30); p.ellipse(0, 0, s * (60 + i * 14), s * (18 + i * 5)); }
        p.pop();
      }
      p.push(); p.rotateZ(tilt); p.scale(s); Terra.mosaic.drawBottle(p, model, tex, rot); p.pop();
    };
  }, mount);

  var surprise = document.getElementById('hx-surprise');
  if (surprise) surprise.addEventListener('click', function () {
    answers = rand();
    document.querySelectorAll('.try-opt').forEach(function (x) { x.setAttribute('aria-pressed', String(answers[x.dataset.q] === x.dataset.v)); });
    setAnswers && setAnswers(answers, true);
  });
});
