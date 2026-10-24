/* ==========================================================================
   Home · waitlist band: a patterned bottle floating diagonally behind
   the sign-up form. Sized to its section (not the window), only animates
   while visible, and stays still for prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';
  const mount = document.getElementById('spinbot');
  if (!mount || !window.p5 || !window.Terra || !Terra.mosaic) return;

  const COLORS = [
    'rgb(231, 76, 60)',
    'rgb(241, 196, 15)',
    'rgb(231, 76, 60)',
    'rgb(52, 152, 219)',
    'rgb(243, 156, 18)',
    'rgb(46, 204, 113)',
  ];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  new p5((p) => {
    let model = null;
    let tex = null;
    let t = 0.15; // progress along the diagonal 0 → 1
    const rot = { x: 0, y: 0, z: 0 };
    let visible = false;

    function size() {
      p.resizeCanvas(mount.clientWidth || 300, mount.clientHeight || 300);
      if (!p.isLooping()) p.redraw();
    }

    p.setup = () => {
      p.createCanvas(mount.clientWidth || 300, mount.clientHeight || 300, p.WEBGL);
      p.setAttributes('alpha', true);
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      p.angleMode(p.DEGREES);
      p.textureMode(p.NORMAL);
      p.textureWrap(p.REPEAT);
      p.noLoop();

      tex = p.createGraphics(1024, 1024);
      tex.pixelDensity(1);
      Terra.mosaic.renderTexture(p, tex, COLORS);

      p.loadModel(
        'assets/bottle.obj',
        true,
        (m) => {
          model = Terra.mosaic.wrapUVs(m);
          if (reduce) {
            t = 0.62;
            rot.y = 35;
            rot.z = 30;
            p.redraw();
          } else if (visible) p.loop();
        },
        () => mount.remove()
      );

      if ('ResizeObserver' in window) new ResizeObserver(size).observe(mount);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          visible = entries[0].isIntersecting;
          if (!model || reduce) return;
          visible ? p.loop() : p.noLoop();
        }).observe(mount);
      } else visible = true;
    };

    p.draw = () => {
      p.clear();
      if (!model) return;

      if (!reduce) {
        t += (p.deltaTime || 16) / 22000;
        if (t > 1) t = 0;
        rot.y += 0.7 * ((p.deltaTime || 16) / 16.67);
        rot.z += 1 * ((p.deltaTime || 16) / 16.67);
      }

      const w = p.width;
      const h = p.height;
      const s = Math.max(0.9, Math.min(h / 400, w / 260));
      const pad = 140 * s;
      const x = -w / 2 - pad + t * (w + pad * 2);
      const y = h / 2 + pad - t * (h + pad * 2);

      p.push();
      p.translate(x, y, 0);
      p.scale(s);
      Terra.mosaic.drawBottle(p, model, tex, rot);
      p.pop();
    };
  }, mount);
})();
