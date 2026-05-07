// ═══════════════════════════════════════════════════════════════
// refs-engine.js — Moteur partagé pour les pages de référence
//
// Pages clientes : events / mitre / legal / dfir-tools / signatures.
// (Et potentiellement artifacts si on migre plus tard.)
//
// Chaque page expose `window.REF_CONFIG = { data, filters, columns,
// detail, search }` AVANT que ce script ne tourne, puis ce moteur
// rend filtres + table + détail dépliable.
//
// Schéma de config :
//
//   data:    [item, ...]
//   filters: [
//     { id, label, kind: 'select', autoOptions: true },
//     { id, label, kind: 'select', options: [{value, label}, ...] },
//     { id, label, kind: 'text', searchFields: [...] }
//   ]
//   columns: [
//     { id, label, sortable?: true,
//       kind: 'plain' | 'bold' | 'mono' | 'tag' | 'src' | 'path' | 'badge' | 'badgeMap',
//       badgeMap?: { value: 'cssClassSuffix', ... },   // for kind='badge'
//       displayMap?: { rawValue: 'shownAs' },           // any kind
//       render?: (item) => string                       // custom HTML
//     }
//   ]
//   detail: {
//     titleField: 'name',                               // shown as <h3>
//     callout?: (item) => { tone: 'cyan'|'gold'|'red'|'purple'|'green', html: '…' } | null,
//     grid: [{ label, field?, render?: (item) => string }],
//     description?: 'description',
//     bullets?: 'bullets',
//     sections?: [{ label, field?, render?: (item) => string, kind?: 'list'|'html' }],
//     notes?: 'notes',
//     related?: 'related'    // array of { href, label } or string array
//   }
//   search: {
//     fields: ['name', 'description', ...]              // for the free-text filter
//   }
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const cfg = window.REF_CONFIG;
  if (!cfg) {
    console.error('[refs-engine] window.REF_CONFIG is missing — load *-data.js first.');
    return;
  }

  // ── Helpers ───────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g,
      c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // kebab-case-safe slug for CSS class names derived from values
  function slug(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function asArray(x) {
    if (x == null) return [];
    return Array.isArray(x) ? x : [x];
  }

  function getField(item, fieldOrFn) {
    if (typeof fieldOrFn === 'function') return fieldOrFn(item);
    return item[fieldOrFn];
  }

  // ── Cell renderers (for a column.kind) ────────────────────
  function renderCell(item, col) {
    if (col.render) return col.render(item);

    let raw = item[col.id];
    let display = (col.displayMap && col.displayMap[raw] != null) ? col.displayMap[raw] : raw;

    if (raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)) {
      return '<span class="ref-dim">—</span>';
    }

    // Arrays → join with comma
    if (Array.isArray(raw)) {
      return raw.map(esc).join(', ');
    }

    switch (col.kind) {
      case 'bold':  return `<b>${esc(display)}</b>`;
      case 'mono':  return `<span class="ref-mono">${esc(display)}</span>`;
      case 'tag':   return `<span class="ref-cat">${esc(display)}</span>`;
      case 'src':   return `<span class="ref-src">${esc(display)}</span>`;
      case 'path':  return `<span class="ref-path">${esc(display)}</span>`;
      case 'badge': {
        const slug2 = col.badgeMap && col.badgeMap[raw] ? col.badgeMap[raw] : slug(raw);
        return `<span class="ref-badge ref-badge--${slug2}">${esc(display)}</span>`;
      }
      default: return esc(display);
    }
  }

  // ── DOM refs (built by the page HTML) ─────────────────────
  const root = document.getElementById('ref-root');
  if (!root) {
    console.error('[refs-engine] #ref-root container missing');
    return;
  }
  const filterBar = document.getElementById('ref-filters');
  const tbody     = document.getElementById('ref-tbody');
  const thead     = document.getElementById('ref-thead');
  const countEl   = document.getElementById('ref-count');

  // ── Build filter bar ──────────────────────────────────────
  const filterEls = {};
  const searchFilter = (cfg.filters || []).find(f => f.kind === 'text');

  (cfg.filters || []).forEach(f => {
    const cell = document.createElement('div');
    cell.className = 'ref-filter';
    if (f.kind === 'text') {
      cell.innerHTML = `
        <label for="f-${esc(f.id)}">${esc(f.label)}</label>
        <input type="text" id="f-${esc(f.id)}" placeholder="${esc(f.placeholder || '')}">
      `;
    } else {
      // select
      let opts = '<option value="">' + esc(f.allLabel || 'Tous') + '</option>';
      let optionList = [];
      if (f.autoOptions) {
        const seen = new Set();
        cfg.data.forEach(d => {
          const v = d[f.id];
          asArray(v).forEach(x => {
            if (x != null && x !== '' && !seen.has(x)) { seen.add(x); optionList.push({value: x, label: (f.displayMap && f.displayMap[x]) || x}); }
          });
        });
        optionList.sort((a, b) => String(a.label).localeCompare(String(b.label), 'fr'));
      } else if (Array.isArray(f.options)) {
        optionList = f.options.map(o => typeof o === 'string' ? {value: o, label: o} : o);
      }
      optionList.forEach(o => { opts += `<option value="${esc(o.value)}">${esc(o.label)}</option>`; });
      cell.innerHTML = `
        <label for="f-${esc(f.id)}">${esc(f.label)}</label>
        <select id="f-${esc(f.id)}">${opts}</select>
      `;
    }
    filterBar.appendChild(cell);
    filterEls[f.id] = cell.querySelector('input, select');
  });

  // Stats / actions cell at the end of the filter bar
  const stats = document.createElement('div');
  stats.className = 'ref-stats';
  stats.innerHTML = `
    <span id="ref-count"></span>
    <button type="button" id="ref-reset">Reset</button>
    <button type="button" id="ref-expand">Tout déplier</button>
    <button type="button" id="ref-collapse">Tout replier</button>
  `;
  filterBar.appendChild(stats);
  const countElLive = document.getElementById('ref-count');

  // ── Build table head ──────────────────────────────────────
  const headRow = document.createElement('tr');
  cfg.columns.forEach(c => {
    const th = document.createElement('th');
    th.dataset.k = c.id;
    th.innerHTML = `${esc(c.label)}${c.sortable ? ' <span class="arrow">▼▲</span>' : ''}`;
    if (!c.sortable) th.classList.add('ref-th-static');
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  // ── State ─────────────────────────────────────────────────
  let sortKey = null, sortDir = 1;

  // ── Filtering logic ───────────────────────────────────────
  function passesFilters(d) {
    for (const f of (cfg.filters || [])) {
      if (f.kind === 'text') continue;
      const sel = filterEls[f.id]?.value || '';
      if (!sel) continue;
      if (f.matches) {
        if (!f.matches(d, sel)) return false;
      } else {
        const v = d[f.id];
        if (Array.isArray(v)) { if (!v.includes(sel)) return false; }
        else if (v !== sel) return false;
      }
    }
    if (searchFilter) {
      const q = (filterEls[searchFilter.id]?.value || '').toLowerCase().trim();
      if (q) {
        const fields = (cfg.search && cfg.search.fields) || searchFilter.searchFields || Object.keys(d);
        const hay = fields.map(f => {
          const v = d[f];
          if (v == null) return '';
          if (Array.isArray(v)) return v.join(' ');
          if (typeof v === 'object') return JSON.stringify(v);
          return String(v);
        }).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
    }
    return true;
  }

  // ── Detail renderer ──────────────────────────────────────
  function renderDetail(d) {
    const det = cfg.detail || {};
    const title = det.titleField ? esc(d[det.titleField]) : '';
    let html = `<td colspan="${cfg.columns.length}"><h3>${title}</h3>`;

    // Callout (custom block at top, optional)
    if (typeof det.callout === 'function') {
      const c = det.callout(d);
      if (c && c.html) {
        const tone = c.tone || 'cyan';
        html += `<div class="ref-callout ref-callout--${esc(tone)}">${c.html}</div>`;
      }
    }

    // Grid
    if (Array.isArray(det.grid) && det.grid.length) {
      html += '<div class="ref-grid">';
      det.grid.forEach(g => {
        let val;
        if (g.render) val = g.render(d);
        else {
          const raw = d[g.field];
          if (raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)) return;
          val = Array.isArray(raw) ? raw.map(esc).join(', ') : esc(raw);
        }
        if (val == null || val === '') return;
        html += `<div>${esc(g.label)}</div><div>${val}</div>`;
      });
      html += '</div>';
    }

    // Description (HTML allowed — content from data author)
    if (det.description && d[det.description]) {
      html += `<div class="ref-desc"><b>Description :</b> ${d[det.description]}</div>`;
    }

    // Bullets
    if (det.bullets && Array.isArray(d[det.bullets]) && d[det.bullets].length) {
      html += '<ul class="ref-bullets">';
      d[det.bullets].forEach(b => { html += `<li>${b}</li>`; });
      html += '</ul>';
    }

    // Sections (extra labelled blocks)
    if (Array.isArray(det.sections)) {
      det.sections.forEach(s => {
        let body;
        if (s.render) body = s.render(d);
        else {
          const raw = d[s.field];
          if (raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)) return;
          if (s.kind === 'list' && Array.isArray(raw)) {
            body = '<ul class="ref-bullets">' + raw.map(b => `<li>${b}</li>`).join('') + '</ul>';
          } else if (Array.isArray(raw)) {
            body = raw.map(esc).join(', ');
          } else {
            body = String(raw);
          }
        }
        if (body == null || body === '') return;
        html += `<div class="ref-section"><div class="ref-section-lbl">${esc(s.label)}</div><div class="ref-section-body">${body}</div></div>`;
      });
    }

    // Notes
    if (det.notes && d[det.notes]) {
      html += `<div class="ref-desc ref-notes"><b>Notes :</b> ${d[det.notes]}</div>`;
    }

    // Related links
    if (det.related && Array.isArray(d[det.related]) && d[det.related].length) {
      html += '<div class="ref-related"><b>Voir aussi :</b> ';
      html += d[det.related].map(r => {
        if (typeof r === 'string') return `<a href="${esc(r)}">${esc(r)}</a>`;
        return `<a href="${esc(r.href)}">${esc(r.label || r.href)}</a>`;
      }).join(' · ');
      html += '</div>';
    }

    html += '</td>';
    return html;
  }

  // ── Main render ───────────────────────────────────────────
  function render() {
    let rows = cfg.data.filter(passesFilters);

    if (sortKey) {
      rows = rows.slice().sort((a, b) => {
        const va = (a[sortKey] == null ? '' : a[sortKey]).toString().toLowerCase();
        const vb = (b[sortKey] == null ? '' : b[sortKey]).toString().toLowerCase();
        if (va < vb) return -sortDir;
        if (va > vb) return sortDir;
        return 0;
      });
    }

    tbody.innerHTML = '';
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${cfg.columns.length}" class="ref-empty">Aucun résultat</td></tr>`;
      countElLive.textContent = `0 / ${cfg.data.length}`;
      return;
    }

    rows.forEach(d => {
      const tr = document.createElement('tr');
      tr.className = 'ref-row';
      tr.innerHTML = cfg.columns.map(c => `<td>${renderCell(d, c)}</td>`).join('');

      const dt = document.createElement('tr');
      dt.className = 'ref-detail';
      dt.innerHTML = renderDetail(d);

      tr.addEventListener('click', () => {
        const open = dt.classList.toggle('show');
        tr.classList.toggle('open', open);
      });

      tbody.appendChild(tr);
      tbody.appendChild(dt);
    });

    countElLive.textContent = `${rows.length} / ${cfg.data.length}`;
  }

  // ── Sort handlers ─────────────────────────────────────────
  thead.querySelectorAll('th[data-k]').forEach(th => {
    if (th.classList.contains('ref-th-static')) return;
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      const k = th.dataset.k;
      if (sortKey === k) sortDir = -sortDir;
      else { sortKey = k; sortDir = 1; }
      thead.querySelectorAll('th').forEach(o => o.classList.remove('ref-sorted-asc', 'ref-sorted-desc'));
      th.classList.add(sortDir === 1 ? 'ref-sorted-asc' : 'ref-sorted-desc');
      render();
    });
  });

  // ── Filter input handlers ─────────────────────────────────
  Object.values(filterEls).forEach(el => {
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  // ── Action buttons ────────────────────────────────────────
  document.getElementById('ref-reset').addEventListener('click', () => {
    Object.values(filterEls).forEach(el => { el.value = ''; });
    sortKey = null; sortDir = 1;
    thead.querySelectorAll('th').forEach(o => o.classList.remove('ref-sorted-asc', 'ref-sorted-desc'));
    render();
  });
  document.getElementById('ref-expand').addEventListener('click', () => {
    document.querySelectorAll('tr.ref-detail').forEach(d => d.classList.add('show'));
    document.querySelectorAll('tr.ref-row').forEach(r => r.classList.add('open'));
  });
  document.getElementById('ref-collapse').addEventListener('click', () => {
    document.querySelectorAll('tr.ref-detail').forEach(d => d.classList.remove('show'));
    document.querySelectorAll('tr.ref-row').forEach(r => r.classList.remove('open'));
  });

  // ── Init ──────────────────────────────────────────────────
  render();

  // Expose for debugging
  window.RefsEngine = { render, getConfig: () => cfg };
})();
