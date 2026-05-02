/* CAS-IN — Modal de recherche globale (Cmd+K / Ctrl+K)
 * ----------------------------------------------------
 * Charge l'index full-text et offre une recherche cross-fiches accessible
 * depuis n'importe quelle page du site.
 *
 * UX :
 *   - Cmd+K (Mac) / Ctrl+K (Windows/Linux) → ouvre le modal
 *   - Esc → ferme
 *   - ↑↓ → navigue dans les résultats
 *   - Enter → ouvre le résultat sélectionné
 *   - Tap sur le résultat → ouvre
 *   - Type → recherche live (debounce 100ms)
 *   - Click hors → ferme
 *
 * Dépend de : js/components/fiche-search.js (window.CASSearch)
 *
 * v1.0 — 2026-05-02
 */
(function () {
  'use strict';

  if (!window.CASSearch) {
    console.warn('[CASSearchModal] CASSearch non chargé — modal indisponible');
    return;
  }

  const STORAGE_RECENT = 'cas-in-search-recent';
  const MAX_RECENT = 5;

  let modal = null;
  let backdrop = null;
  let input = null;
  let resultsBox = null;
  let recentBox = null;
  let selectedIndex = 0;
  let currentResults = [];
  let isOpen = false;

  // ─── Construction modal ───
  function build() {
    if (modal) return;

    backdrop = document.createElement('div');
    backdrop.id = 'cas-search-backdrop';
    backdrop.style.cssText = `
      position: fixed; inset: 0; z-index: 9998;
      background: rgba(0, 0, 0, .6);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: none; align-items: flex-start; justify-content: center;
      padding-top: 10vh; padding-left: 1rem; padding-right: 1rem;
      animation: cas-fade-in .15s ease;
    `;

    modal = document.createElement('div');
    modal.id = 'cas-search-modal';
    modal.style.cssText = `
      width: 100%; max-width: 680px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, .5), 0 0 0 1px rgba(0, 229, 204, .08);
      overflow: hidden; display: flex; flex-direction: column;
      max-height: 70vh;
      animation: cas-slide-down .2s ease;
    `;

    // ─── Header avec input ───
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 1rem 1.2rem;
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; gap: .8rem;
    `;
    header.innerHTML = `
      <span style="color:var(--cyan);font-size:1.1rem">🔍</span>
      <input id="cas-search-input"
             type="text"
             placeholder="Rechercher des fiches, commandes, concepts… (questions OK)"
             autocomplete="off"
             spellcheck="false"
             style="flex:1; background:transparent; border:none; outline:none;
                    color:var(--text); font-family:var(--mono);
                    font-size:.95rem; padding:.2rem 0;">
      <kbd style="background:var(--surface2); padding:2px 7px; border-radius:4px;
                  border:1px solid var(--border); font-size:.7rem;
                  color:var(--dim); font-family:var(--mono)">Esc</kbd>
    `;

    // ─── Résultats ───
    resultsBox = document.createElement('div');
    resultsBox.id = 'cas-search-results';
    resultsBox.style.cssText = `
      flex: 1; overflow-y: auto; padding: .5rem 0;
    `;

    // ─── Footer hint ───
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: .55rem 1.2rem;
      border-top: 1px solid var(--border);
      background: var(--surface2);
      font-size: .72rem; color: var(--dim);
      font-family: var(--mono);
      display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
    `;
    footer.innerHTML = `
      <span>
        <kbd style="background:var(--surface);padding:1px 5px;border-radius:3px;border:1px solid var(--border)">↑↓</kbd> naviguer
        ·
        <kbd style="background:var(--surface);padding:1px 5px;border-radius:3px;border:1px solid var(--border)">↵</kbd> ouvrir
        ·
        <kbd style="background:var(--surface);padding:1px 5px;border-radius:3px;border:1px solid var(--border)">Esc</kbd> fermer
      </span>
      <span style="color:var(--dim)">Indexation full-text · ${(window.CASSearch.indexLoaded() ? '' : '⏳ ')}<span id="cas-search-count">…</span></span>
    `;

    modal.appendChild(header);
    modal.appendChild(resultsBox);
    modal.appendChild(footer);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    input = document.getElementById('cas-search-input');

    // Animations + style mark
    if (!document.getElementById('cas-search-modal-style')) {
      const s = document.createElement('style');
      s.id = 'cas-search-modal-style';
      s.textContent = `
        @keyframes cas-fade-in { from { opacity:0 } to { opacity:1 } }
        @keyframes cas-slide-down {
          from { opacity:0; transform: translateY(-12px) }
          to   { opacity:1; transform: translateY(0) }
        }
        #cas-search-results::-webkit-scrollbar { width: 8px }
        #cas-search-results::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px }
        #cas-search-results::-webkit-scrollbar-track { background: transparent }
        .cas-search-result {
          display: block; padding: .7rem 1.2rem;
          color: var(--text); text-decoration: none;
          border-left: 3px solid transparent;
          transition: background .1s, border-color .1s;
          cursor: pointer;
        }
        .cas-search-result:hover,
        .cas-search-result.selected {
          background: rgba(0, 229, 204, .06);
          border-left-color: var(--cyan);
        }
        [data-theme="light"] .cas-search-result:hover,
        [data-theme="light"] .cas-search-result.selected {
          background: rgba(0, 140, 128, .06);
        }
        .cas-search-result-title {
          font-family: var(--sans);
          font-weight: 700; font-size: .92rem;
          margin-bottom: .15rem;
          display: flex; align-items: center; gap: .5rem;
          color: var(--text);
        }
        .cas-search-result-section {
          font-size: .75rem; color: var(--cyan);
          margin-bottom: .25rem;
          font-family: var(--mono);
        }
        .cas-search-result-snippet {
          font-size: .78rem; color: var(--dim);
          line-height: 1.4;
        }
        .cas-search-result-snippet mark {
          background: rgba(240, 192, 64, .2);
          color: var(--gold);
          padding: 0 2px;
          border-radius: 2px;
        }
        [data-theme="light"] .cas-search-result-snippet mark {
          background: rgba(176, 112, 0, .15);
          color: var(--gold);
        }
        .cas-search-result-meta {
          font-size: .65rem; color: var(--dim);
          margin-left: auto;
          font-family: var(--mono);
        }
        .cas-search-empty {
          padding: 2rem 1.2rem; text-align: center;
          color: var(--dim); font-family: var(--mono); font-size: .82rem;
        }
        .cas-search-empty kbd {
          background: var(--surface2); padding: 2px 6px;
          border-radius: 3px; border: 1px solid var(--border);
          font-size: .7rem;
        }
        .cas-search-recent-title {
          padding: .5rem 1.2rem; font-size: .7rem;
          color: var(--dim); text-transform: uppercase;
          letter-spacing: .05em; font-family: var(--mono);
        }
        .cas-search-trigger-fab {
          position: fixed; right: 80px; bottom: 20px; z-index: 9996;
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--surface); border: 1px solid var(--border);
          color: var(--text); font-size: 1.1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, .25);
          transition: transform .2s, box-shadow .2s;
        }
        .cas-search-trigger-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 4px 12px rgba(0, 229, 204, .25);
          border-color: var(--cyan);
        }
        @media (max-width: 600px) {
          .cas-search-trigger-fab {
            width: 40px; height: 40px;
            right: 64px; bottom: 14px;
          }
        }
      `;
      document.head.appendChild(s);
    }

    // ─── Events ───
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKey);
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) close();
    });
  }

  // ─── Update count display ───
  function updateCount() {
    const c = document.getElementById('cas-search-count');
    if (c) {
      if (window.CASSearch.indexLoaded()) {
        c.textContent = '109 fiches indexées';
      } else {
        c.textContent = 'chargement…';
      }
    }
  }

  // ─── Highlight tokens dans un snippet ───
  function highlightSnippet(snippet, query) {
    const tokens = window.CASSearch.tokenize(query);
    if (!tokens.length) return escapeHTML(snippet);
    const expanded = new Set();
    for (const t of tokens) {
      for (const v of window.CASSearch.expandSynonyms(t)) expanded.add(v);
    }
    let html = escapeHTML(snippet);
    // Wrap matches in <mark> (case-insensitive, accent-insensitive)
    // On utilise la version normalisée pour trouver les positions
    const normSnippet = window.CASSearch.normalize(snippet);
    const positions = [];
    for (const v of expanded) {
      let pos = 0;
      while ((pos = normSnippet.indexOf(v, pos)) !== -1) {
        positions.push({ start: pos, end: pos + v.length });
        pos += v.length;
      }
    }
    // Tri + merge
    positions.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const p of positions) {
      if (merged.length && p.start <= merged[merged.length - 1].end) {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, p.end);
      } else {
        merged.push({ ...p });
      }
    }
    // Reconstruction : on travaille sur l'original, mais les positions sont dans normSnippet.
    // Comme normalize ne change PAS la longueur (NFD + remplacements 1:1), c'est OK.
    // Mais 'œ' devient 'oe', donc en pratique il peut y avoir un léger offset. Acceptable.
    let result = '';
    let last = 0;
    for (const m of merged) {
      const safeStart = Math.min(m.start, snippet.length);
      const safeEnd = Math.min(m.end, snippet.length);
      result += escapeHTML(snippet.slice(last, safeStart));
      result += '<mark>' + escapeHTML(snippet.slice(safeStart, safeEnd)) + '</mark>';
      last = safeEnd;
    }
    result += escapeHTML(snippet.slice(last));
    return result;
  }

  function escapeHTML(s) {
    return (s || '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  // ─── Recent searches ───
  function getRecentSearches() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_RECENT) || '[]') || [];
    } catch { return []; }
  }
  function pushRecent(query, file, title) {
    if (!query) return;
    const recents = getRecentSearches().filter(r => r.query !== query);
    recents.unshift({ query, file, title, ts: Date.now() });
    try {
      localStorage.setItem(STORAGE_RECENT, JSON.stringify(recents.slice(0, MAX_RECENT)));
    } catch {}
  }

  // ─── Handle input ───
  let inputTimer = null;
  function handleInput() {
    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => {
      const q = input.value.trim();
      runSearch(q);
    }, 100);
  }

  function runSearch(query) {
    if (!query) {
      renderRecent();
      return;
    }

    if (!window.CASSearch.indexLoaded()) {
      resultsBox.innerHTML = '<div class="cas-search-empty">Index en cours de chargement…</div>';
      return;
    }

    currentResults = window.CASSearch.searchIndex(query, { limit: 12 });
    selectedIndex = 0;
    renderResults(query);
  }

  function renderResults(query) {
    if (!currentResults.length) {
      resultsBox.innerHTML = `
        <div class="cas-search-empty">
          Aucun résultat pour <strong>${escapeHTML(query)}</strong>.<br>
          <span style="font-size:.74rem">Essayez d'autres mots-clés ou retirez les fautes.</span>
        </div>`;
      return;
    }

    // Path préfixe : si on est dans /fiches/, fichiers relatifs ; sinon, fiches/...
    const isInFiches = window.location.pathname.includes('/fiches/');
    const prefix = isInFiches ? '' : 'fiches/';

    const html = currentResults.map((r, i) => {
      const url = prefix + r.file + (r.snippetSectionId ? '#' + r.snippetSectionId : '');
      const sectionLine = r.snippetSection
        ? `<div class="cas-search-result-section">› ${escapeHTML(r.snippetSection)}</div>`
        : '';
      return `
        <a class="cas-search-result ${i === selectedIndex ? 'selected' : ''}"
           href="${url}"
           data-index="${i}"
           data-query="${escapeHTML(query)}"
           data-file="${r.file}"
           data-title="${escapeHTML(r.title)}">
          <div class="cas-search-result-title">
            <span>${r.icon || '📄'}</span>
            <span>${escapeHTML(r.title)}</span>
            <span class="cas-search-result-meta">${r.score}</span>
          </div>
          ${sectionLine}
          <div class="cas-search-result-snippet">${highlightSnippet(r.snippet || r.desc || '', query)}</div>
        </a>`;
    }).join('');

    resultsBox.innerHTML = html;

    // Bind click pour push recent
    resultsBox.querySelectorAll('.cas-search-result').forEach(el => {
      el.addEventListener('click', e => {
        const q = el.getAttribute('data-query');
        const f = el.getAttribute('data-file');
        const t = el.getAttribute('data-title');
        pushRecent(q, f, t);
      });
    });
  }

  function renderRecent() {
    const recents = getRecentSearches();
    if (!recents.length) {
      resultsBox.innerHTML = `
        <div class="cas-search-empty">
          Tapez pour rechercher dans <strong>109 fiches</strong>.<br>
          <span style="font-size:.74rem">Mots, expressions ou questions.</span>
        </div>`;
      return;
    }

    const isInFiches = window.location.pathname.includes('/fiches/');
    const prefix = isInFiches ? '' : 'fiches/';

    let html = '<div class="cas-search-recent-title">⏱ Recherches récentes</div>';
    html += recents.map(r => `
      <a class="cas-search-result" href="${prefix}${r.file}">
        <div class="cas-search-result-title">
          <span>🔄</span>
          <span>${escapeHTML(r.title)}</span>
        </div>
        <div class="cas-search-result-snippet">Recherche : « ${escapeHTML(r.query)} »</div>
      </a>
    `).join('');
    resultsBox.innerHTML = html;
  }

  // ─── Keyboard ───
  function handleKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (!currentResults.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % currentResults.length;
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
      updateSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const link = resultsBox.querySelector(`.cas-search-result[data-index="${selectedIndex}"]`);
      if (link) {
        const q = input.value.trim();
        const f = link.getAttribute('data-file');
        const t = link.getAttribute('data-title');
        pushRecent(q, f, t);
        window.location.href = link.getAttribute('href');
      }
    }
  }

  function updateSelection() {
    resultsBox.querySelectorAll('.cas-search-result').forEach(el => {
      const idx = parseInt(el.getAttribute('data-index') || '-1', 10);
      el.classList.toggle('selected', idx === selectedIndex);
      if (idx === selectedIndex) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  // ─── Open / Close ───
  function open() {
    build();
    isOpen = true;
    backdrop.style.display = 'flex';
    setTimeout(() => input.focus(), 50);
    updateCount();
    if (input.value) {
      runSearch(input.value);
    } else {
      renderRecent();
    }
  }

  function close() {
    if (!modal) return;
    isOpen = false;
    backdrop.style.display = 'none';
  }

  function toggle() {
    isOpen ? close() : open();
  }

  // ─── Trigger global : Cmd+K / Ctrl+K ───
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      toggle();
    }
  });

  // ─── FAB trigger button (mobile / clic) ───
  function buildFab() {
    if (document.getElementById('cas-search-fab')) return;
    const btn = document.createElement('button');
    btn.id = 'cas-search-fab';
    btn.className = 'cas-search-trigger-fab';
    btn.setAttribute('aria-label', 'Recherche globale');
    btn.setAttribute('title', 'Recherche globale (⌘K)');
    btn.innerHTML = '🔍';
    btn.addEventListener('click', open);
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildFab);
  } else {
    buildFab();
  }

  // API publique
  window.CASSearchModal = {
    open, close, toggle,
  };
})();
