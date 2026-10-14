/* ==========================================================================
   Saved designs page
   ========================================================================== */
(function () {
  'use strict';
  if (!window.Terra || !Terra.designs) return;

  const grid = document.getElementById('saved-grid');
  const empty = document.getElementById('empty');
  const clearAll = document.getElementById('clear-all');
  const sub = document.getElementById('saved-sub');
  const fmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  function swatches(answers) {
    if (!answers || !Terra.colorsFor) return '';
    const colors = Terra.colorsFor(answers);
    return `<ul class="card-swatches" aria-label="Pattern colours">${Terra.QUESTIONS.map(
      (q) => `<li class="swatch" style="--c:${colors[q.slot]}" title="${q.short}"></li>`
    ).join('')}</ul>`;
  }

  function render() {
    const list = Terra.designs.list();
    grid.innerHTML = list
      .map(
        (d, i) => `
      <li class="design-card" data-id="${d.id}">
        <div class="design-img"><img src="${d.image}" alt="Saved bottle design ${list.length - i}" loading="lazy"></div>
        <div class="design-meta">
          <div>
            <p class="design-title">Design ${list.length - i}</p>
            <p class="design-date">${fmt.format(new Date(d.created))}</p>
          </div>
          ${swatches(d.answers)}
        </div>
        <div class="design-actions">
          ${d.answers ? '<button type="button" class="btn btn--outline btn--sm" data-act="edit">Edit</button>' : ''}
          <button type="button" class="btn btn--light btn--sm" data-act="view">View product</button>
          <button type="button" class="icon-btn" data-act="delete" aria-label="Delete design ${list.length - i}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
          </button>
        </div>
      </li>`
      )
      .join('');
    empty.hidden = list.length > 0;
    clearAll.hidden = list.length === 0;
    sub.textContent = list.length
      ? `${list.length} design${list.length === 1 ? '' : 's'} · saved in this browser`
      : 'Designs are saved in this browser.';
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.closest('[data-id]').dataset.id;
    const d = Terra.designs.list().find((x) => x.id === id);
    if (!d) return;
    if (btn.dataset.act === 'delete') {
      Terra.designs.remove(id);
      render();
      Terra.toast('Design deleted');
    } else {
      Terra.designs.load(d);
      location.href = btn.dataset.act === 'edit' ? '/generator' : '/trace-by-terra';
    }
  });

  clearAll.addEventListener('click', () => {
    if (!confirm('Delete all saved designs? This can’t be undone.')) return;
    Terra.designs.clear();
    render();
  });

  render();
})();
