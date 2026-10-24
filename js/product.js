/* ==========================================================================
   Product page: show the visitor's own design (from the generator) if
   there is one, plus a summary of the answers that made it.
   ========================================================================== */
(function () {
  'use strict';
  let img = null;
  let answers = null;
  try {
    img = sessionStorage.getItem('savedCanvasImage');
    answers = JSON.parse(sessionStorage.getItem('terraAnswers') || 'null');
  } catch (_) {}

  if (img) {
    const el = document.getElementById('product-image');
    el.src = img;
    el.alt = 'Your personalised Terra bottle design';
    el.closest('.media-frame').classList.add('is-design');
    document.getElementById('design-badge').hidden = false;
    const cta = document.getElementById('build-cta');
    if (cta) cta.textContent = 'Edit your design';

    const save = document.getElementById('save-design');
    if (save && window.Terra && Terra.designs) {
      save.hidden = false;
      save.innerHTML = Terra.icons.heart;
      save.addEventListener('click', async () => {
        const res = await Terra.designs.add(img, answers);
        if (res === 'saved') {
          save.classList.add('is-saved');
          Terra.toast('Saved to your designs');
        } else if (res === 'exists') Terra.toast('This design is already saved');
        else Terra.toast('Couldn’t save. Storage may be full.');
      });
    }
  }

  if (answers && window.Terra && Terra.QUESTIONS) {
    const colors = Terra.colorsFor(answers);
    const list = document.getElementById('answer-list');
    list.innerHTML = Terra.QUESTIONS.map((q) => {
      let label;
      if (q.type === 'range') {
        const n = Number(answers[q.id]);
        label = `${n >= q.max ? q.max + '+' : n} / week`;
      } else {
        const o = q.options.find((x) => x.value === answers[q.id]) || q.options[0];
        label = o.label;
      }
      return `<li><span class="swatch" style="--c:${colors[q.slot]}"></span><span class="a-q">${q.short}</span><span class="a-v">${label}</span></li>`;
    }).join('');
    document.getElementById('your-design').hidden = false;
  }
})();
