/* ==========================================================================
   Saved designs — stored in this browser (localStorage).
   Each design: { id, created, image (small JPEG data URL), answers }
   Used by the generator (save), product page (save) and /saved-designs.
   ========================================================================== */
(function (global) {
  'use strict';
  const Terra = (global.Terra = global.Terra || {});
  const KEY = 'terraSavedDesigns';
  const LEGACY_KEY = 'savedDesign'; // single image saved by the old site
  const MAX = 24;
  const THUMB = 640;

  function read() {
    try {
      const list = JSON.parse(localStorage.getItem(KEY) || '[]');
      // migrate the old single saved design, once
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        list.unshift({ id: 'legacy-' + Date.now(), created: Date.now(), image: legacy, answers: null });
        localStorage.removeItem(LEGACY_KEY);
        write(list);
      }
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function write(list) {
    // drop the oldest designs until it fits in storage
    while (list.length) {
      try {
        localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
        break;
      } catch (_) {
        list.pop();
      }
    }
    document.dispatchEvent(new CustomEvent('terra:designs', { detail: list.length }));
    return list.length > 0;
  }

  /** Downscale any image source (canvas, data URL) to a small JPEG. */
  function thumbnail(src) {
    return new Promise((resolve) => {
      const draw = (img, w, h) => {
        const k = Math.min(1, THUMB / Math.max(w, h));
        const c = document.createElement('canvas');
        c.width = Math.round(w * k);
        c.height = Math.round(h * k);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#0A121C';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      if (src instanceof HTMLCanvasElement) return draw(src, src.width, src.height);
      const img = new Image();
      img.onload = () => draw(img, img.naturalWidth, img.naturalHeight);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  const same = (a, b) => a && b && JSON.stringify(a) === JSON.stringify(b);

  Terra.designs = {
    list: read,
    count: () => read().length,
    /** Save a design; returns 'saved' | 'exists' | 'failed' */
    async add(source, answers) {
      const list = read();
      if (answers && list.some((d) => same(d.answers, answers))) return 'exists';
      const image = await thumbnail(source);
      if (!image) return 'failed';
      list.unshift({ id: String(Date.now()), created: Date.now(), image, answers: answers || null });
      return write(list) ? 'saved' : 'failed';
    },
    remove(id) {
      write(read().filter((d) => d.id !== id));
    },
    clear() {
      try {
        localStorage.removeItem(KEY);
      } catch (_) {}
      document.dispatchEvent(new CustomEvent('terra:designs', { detail: 0 }));
    },
    /** Put a saved design back into the session so the builder / product page use it. */
    load(d) {
      try {
        if (d.answers) sessionStorage.setItem('terraAnswers', JSON.stringify(d.answers));
        else sessionStorage.removeItem('terraAnswers');
        sessionStorage.setItem('savedCanvasImage', d.image);
      } catch (_) {}
    },
  };
})(window);
