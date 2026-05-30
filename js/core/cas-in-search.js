// ═══════════════════════════════════════════════════════════════
// cas-in-search.js — Recherche globale Ctrl+K / Cmd+K (v3)
// Cherche dans : fiches, questions quiz, catégories TP, scènes DFIR
//
// v3 :
//   - Index TP complété aux 24 catégories (4 manquantes : mbr, direntry,
//     hexdump, slackspace)
//   - Normalisation des accents (rançongiciel ↔ rancongiciel)
//   - Préfixes de filtre : f: (fiches), q: (questions), s: (scènes), t: (TP)
//   - Regroupement par type dans le rendu, avec compteurs
//   - Highlight des matches (surbrillance dans title/desc)
//   - Recherches récentes affichées en empty state (top 5, localStorage)
//   - Top 50 résultats au lieu de 30, mais regroupés
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // État local — chargé à la demande (lazy)
  let indexed = null;
  let loadingPromise = null;

  const RECENTS_KEY = 'casIn_searchRecents';
  const MAX_RECENTS = 5;
  const MAX_RESULTS = 50;

  // ── Helpers ──
  function basePath() {
    const depth = (window.location.pathname.match(/\//g) || []).length - 1;
    return depth > 1 ? '../'.repeat(depth - 1) : './';
  }

  /**
   * Normalise une chaîne pour comparaison fuzzy : lowercase + retire les
   * diacritiques (accents). Ainsi "Rançongiciel" → "rancongiciel" et la
   * recherche "rancon" matche.
   */
  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // ── Chargement de l'index ────────────────────────────────────
  async function loadIndex() {
    if (indexed) return indexed;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async function () {
      const result = { fiches: [], questions: [], tp: [], scenes: [] };
      const base = basePath();

      // 1. Fiches : depuis data/manifest.json (source unique)
      try {
        const resp = await fetch(base + 'data/manifest.json', { cache: 'force-cache' });
        if (resp.ok) {
          const manifest = await resp.json();
          const cats = Object.fromEntries((manifest.categories || []).map(c => [c.id, c]));
          for (const f of (manifest.fiches || [])) {
            const cat = cats[f.category] || {};
            const title = f.title || f.file.replace(/\.html$/, '');
            const desc = f.desc || '';
            result.fiches.push({
              type: 'fiche',
              href: base + 'fiches/' + f.file,
              title,
              desc,
              keywords: normalize(title + ' ' + desc + ' ' + (cat.title || '')),
              icon: f.icon || '📄',
            });
          }
        }
      } catch (_) { /* silencieux */ }

      // 2. Questions : charge via index + chunks parallèles (v132f), fallback questions.json
      try {
        let data = null;
        try {
          const idxResp = await fetch(base + 'data/questions-index.json', { cache: 'force-cache' });
          if (idxResp.ok) {
            const idx = await idxResp.json();
            if (idx && Array.isArray(idx.themes) && idx.themes.length) {
              const chunks = await Promise.all(
                idx.themes.map(t => fetch(base + t.file, { cache: 'force-cache' }).then(r => r.ok ? r.json() : []))
              );
              data = chunks.flat();
            }
          }
        } catch (_) { /* tentative échouée, fallback ci-dessous */ }
        if (!data) {
          const resp = await fetch(base + 'data/questions.json', { cache: 'force-cache' });
          if (!resp.ok) throw new Error('questions.json HTTP ' + resp.status);
          data = await resp.json();
        }
        if (Array.isArray(data)) {
          result.questions = data.map((q, i) => {
            const title = q.q ? q.q.slice(0, 80) : '(sans titre)';
            const desc = (q.theme || '') + ' · ' + (q.chapter || '') + ' · ' + (q.diff || '');
            return {
              type: 'question',
              idx: i,
              href: base + 'quiz.html#q' + i,
              title,
              desc,
              keywords: normalize((q.theme || '') + ' ' + (q.chapter || '') + ' ' + (q.q || '')),
              icon: q.theme_icon || '💊',
            };
          });
        }
      } catch (_) { /* silencieux */ }

      // 3. TP : 24 catégories (alignées sur tp-engine.js STATE.total)
      const tpCategories = [
        { cat: 'endian',       label: 'Endianness',           icon: '🔄' },
        { cat: 'timestamp',    label: 'Timestamps FAT',       icon: '⏱' },
        { cat: 'bitmap',       label: 'Bitmap exFAT',         icon: '🗺' },
        { cat: 'fat',          label: 'Chaîne FAT',           icon: '⛓' },
        { cat: 'magic',        label: 'Magic Bytes',          icon: '✨' },
        { cat: 'mismatch',     label: 'Mismatch',             icon: '🎭' },
        { cat: 'runlist',      label: 'Run List NTFS',        icon: '🧩' },
        { cat: 'effacement',   label: 'Effacement FAT',       icon: '🗑' },
        { cat: 'timestomping', label: 'Timestomping',         icon: '🕰' },
        { cat: 'hextable',     label: 'Table Hex',            icon: '🗺' },
        { cat: 'fsidentify',   label: 'Identifier le FS',     icon: '🔍' },
        { cat: 'offset',       label: "Calcul d'offset",      icon: '📐' },
        { cat: 'bases',        label: 'Bases & Encodages',    icon: '🔢' },
        { cat: 'hash',         label: 'Hash & Intégrité',     icon: '🔑' },
        { cat: 'email',        label: 'Email Forensics',      icon: '✉️' },
        { cat: 'network',      label: 'Réseau & PCAP',        icon: '📡' },
        { cat: 'ir',           label: 'Incident Response',    icon: '🚨' },
        { cat: 'droitpenal',   label: 'Droit pénal',          icon: '⚖️' },
        { cat: 'glossaire',    label: 'Glossaire',            icon: '🗂' },
        { cat: 'examen',       label: 'Série Examen',         icon: '📋' },
        // v3 : 4 catégories qui manquaient à l'index
        { cat: 'mbr',          label: 'MBR / GPT',            icon: '🧱' },
        { cat: 'direntry',     label: 'Directory Entry',      icon: '📁' },
        { cat: 'hexdump',      label: 'Hex Dump',             icon: '📜' },
        { cat: 'slackspace',   label: 'Slack Space',          icon: '🧨' },
      ];
      result.tp = tpCategories.map(c => ({
        type: 'tp',
        href: base + 'tp.html#' + c.cat,
        title: c.label,
        desc: 'Travaux pratiques · ' + c.cat,
        keywords: normalize(c.label + ' ' + c.cat),
        icon: c.icon,
      }));

      // 4. Scènes DFIR : depuis scenes/index.json
      try {
        const resp = await fetch(base + 'scenes/index.json', { cache: 'force-cache' });
        if (resp.ok) {
          const scenes = await resp.json();
          if (Array.isArray(scenes)) {
            result.scenes = scenes.map(s => {
              const title = s.title || '(sans titre)';
              const desc = (s.intro || '').slice(0, 120) + ' · ' + (s.difficulty || '');
              return {
                type: 'scène',
                href: base + 'scene.html#' + (s.id || ''),
                title,
                desc,
                keywords: normalize(title + ' ' + (s.tags || []).join(' ') + ' ' + (s.intro || '') + ' ' + (s.atmosphere || '')),
                icon: s.icon || '🔍',
              };
            });
          }
        }
      } catch (_) { /* silencieux */ }

      indexed = result;
      return result;
    })();

    return loadingPromise;
  }

  // ── Scoring (matches normalisés) ────────────────────────────
  function scoreItem(item, normQuery) {
    let score = 0;
    const title = normalize(item.title);
    const desc = normalize(item.desc);
    const kw = item.keywords; // déjà normalisé à l'indexation

    if (title.startsWith(normQuery)) score += 100;
    if (title.includes(normQuery)) score += 50;
    if (kw.includes(normQuery)) score += 30;
    if (desc.includes(normQuery)) score += 10;

    // Bonus par type pour équilibrer
    if (item.type === 'fiche') score += 5;
    if (item.type === 'tp') score += 3;
    if (item.type === 'scène') score += 4;
    return score;
  }

  /**
   * Parse la query : extrait un éventuel préfixe de type (f:, q:, s:, t:)
   * et retourne { typeFilter, term }.
   */
  function parseQuery(raw) {
    const trimmed = raw.trim();
    const m = /^([fqst]):\s*(.+)$/i.exec(trimmed);
    if (!m) return { typeFilter: null, term: trimmed };
    const map = { f: 'fiche', q: 'question', s: 'scène', t: 'tp' };
    return { typeFilter: map[m[1].toLowerCase()] || null, term: m[2].trim() };
  }

  async function search(rawQuery) {
    const idx = await loadIndex();
    const { typeFilter, term } = parseQuery(rawQuery);
    if (!term) return [];
    const normQuery = normalize(term);
    let pool = [...idx.fiches, ...idx.tp, ...idx.scenes, ...idx.questions];
    if (typeFilter) pool = pool.filter(it => it.type === typeFilter);
    const scored = pool
      .map(item => ({ item, score: scoreItem(item, normQuery) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);
    return scored.map(x => x.item);
  }

  // ── Recherches récentes (localStorage) ──────────────────────
  function getRecents() {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(0, MAX_RECENTS) : [];
    } catch (_) { return []; }
  }

  function pushRecent(query) {
    if (!query || query.length < 2) return;
    try {
      const cur = getRecents().filter(r => r !== query);
      cur.unshift(query);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(cur.slice(0, MAX_RECENTS)));
    } catch (_) { /* silencieux */ }
  }

  // ── UI ───────────────────────────────────────────────────────
  let overlay = null;
  let _activeFlatList = []; // liste plate des items pour navigation clavier

  function createOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'cas-search-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Recherche globale');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="cs-panel" role="document">
        <div class="cs-head">
          <span class="cs-icon" aria-hidden="true">🔍</span>
          <input type="search" class="cs-input" id="cs-input" placeholder="Chercher… (préfixes : f: q: s: t:)" autocomplete="off" aria-label="Requête de recherche">
          <kbd class="cs-kbd">Échap</kbd>
        </div>
        <div class="cs-results" id="cs-results" role="listbox" aria-label="Résultats"></div>
        <div class="cs-footer" id="cs-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span>
          <span><kbd>↵</kbd> ouvrir</span>
          <span><kbd>Esc</kbd> fermer</span>
          <span class="cs-footer-hint">Préfixes : <kbd>f:</kbd> fiches · <kbd>q:</kbd> questions · <kbd>s:</kbd> scènes · <kbd>t:</kbd> TP</span>
        </div>
      </div>
    `;
    const style = document.createElement('style');
    style.textContent = `
#cas-search-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(6px);z-index:99999;display:none;align-items:flex-start;justify-content:center;padding:10vh 1rem 1rem;animation:csFadeIn .15s ease}
#cas-search-overlay.open{display:flex}
#cas-search-overlay .cs-panel{background:#0d1117;border:1px solid #30363d;border-radius:12px;width:100%;max-width:680px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.85),0 0 30px rgba(0,229,204,.08);display:flex;flex-direction:column;max-height:70vh}
#cas-search-overlay .cs-head{display:flex;align-items:center;gap:.7rem;padding:.85rem 1rem;border-bottom:1px solid #30363d;flex-shrink:0}
#cas-search-overlay .cs-icon{font-size:1.1rem}
#cas-search-overlay .cs-input{flex:1;background:transparent;border:none;outline:none;color:#e6edf3;font-size:1rem;font-family:'Share Tech Mono','JetBrains Mono',monospace}
#cas-search-overlay .cs-kbd,#cas-search-overlay kbd{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:4px;padding:.1rem .4rem;font-size:.7rem;color:#8b949e;font-family:inherit}
#cas-search-overlay .cs-results{flex:1;overflow-y:auto;padding:.4rem;scrollbar-width:thin}
#cas-search-overlay .cs-results::-webkit-scrollbar{width:6px}
#cas-search-overlay .cs-results::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px}
#cas-search-overlay .cs-empty{color:#6e7681;font-size:.78rem;text-align:center;padding:2rem 1rem;letter-spacing:.02em}
#cas-search-overlay .cs-empty strong{color:#8b949e;display:block;margin-bottom:.5rem;font-weight:600}
#cas-search-overlay .cs-recents{padding:.8rem 1rem .4rem}
#cas-search-overlay .cs-recents-title{color:#6e7681;font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;margin-bottom:.4rem;font-family:'Share Tech Mono',monospace}
#cas-search-overlay .cs-recent-pill{display:inline-block;background:rgba(0,229,204,.07);border:1px solid rgba(0,229,204,.2);color:#9ce0d6;font-size:.72rem;padding:.25rem .65rem;border-radius:14px;cursor:pointer;margin:0 .3rem .3rem 0;transition:all .12s;font-family:'Share Tech Mono',monospace}
#cas-search-overlay .cs-recent-pill:hover{background:rgba(0,229,204,.15);color:#00e5cc;border-color:rgba(0,229,204,.45)}
#cas-search-overlay .cs-section-header{display:flex;justify-content:space-between;align-items:baseline;padding:.7rem .8rem .25rem;font-family:'Share Tech Mono',monospace}
#cas-search-overlay .cs-section-name{color:#8b949e;font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;font-weight:700}
#cas-search-overlay .cs-section-count{color:#6e7681;font-size:.6rem;letter-spacing:.05em}
#cas-search-overlay .cs-item{display:flex;gap:.7rem;align-items:center;padding:.55rem .75rem;border-radius:6px;cursor:pointer;transition:background .1s;border:1px solid transparent;margin-bottom:2px}
#cas-search-overlay .cs-item:hover,#cas-search-overlay .cs-item.active{background:rgba(0,229,204,.08);border-color:rgba(0,229,204,.3)}
#cas-search-overlay .cs-item-icon{font-size:1.15rem;flex-shrink:0;width:1.4rem;text-align:center}
#cas-search-overlay .cs-item-body{flex:1;min-width:0}
#cas-search-overlay .cs-item-title{color:#e6edf3;font-size:.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cas-search-overlay .cs-item-desc{color:#8b949e;font-size:.7rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.15rem}
#cas-search-overlay .cs-item mark{background:rgba(255,189,46,.25);color:#ffd47e;padding:0 1px;border-radius:2px}
#cas-search-overlay .cs-item-type{background:rgba(0,229,204,.1);border:1px solid rgba(0,229,204,.3);color:#00e5cc;font-size:.58rem;padding:.1rem .4rem;border-radius:3px;font-family:'Share Tech Mono',monospace;text-transform:uppercase;letter-spacing:.05em}
#cas-search-overlay .cs-item-type.t-fiche{background:rgba(64,140,255,.1);border-color:rgba(64,140,255,.3);color:#5fa8ff}
#cas-search-overlay .cs-item-type.t-tp{background:rgba(48,232,138,.1);border-color:rgba(48,232,138,.3);color:#30e88a}
#cas-search-overlay .cs-item-type.t-scène{background:rgba(255,160,96,.1);border-color:rgba(255,160,96,.3);color:#ffa060}
#cas-search-overlay .cs-item-type.t-question{background:rgba(167,139,250,.1);border-color:rgba(167,139,250,.3);color:#a78bfa}
#cas-search-overlay .cs-footer{display:flex;justify-content:space-between;padding:.5rem .8rem;border-top:1px solid #30363d;font-size:.62rem;color:#6e7681;gap:.5rem;flex-wrap:wrap;flex-shrink:0;align-items:center}
#cas-search-overlay .cs-footer-hint{color:#5a6068;font-size:.6rem}
#cas-search-overlay .cs-footer kbd{font-size:.58rem}
@keyframes csFadeIn{from{opacity:0}to{opacity:1}}
@media(max-width:640px){
  #cas-search-overlay{padding:2vh 0.5rem 0.5rem}
  #cas-search-overlay .cs-panel{max-height:90vh}
  #cas-search-overlay .cs-footer{font-size:.55rem}
  #cas-search-overlay .cs-footer-hint{display:none}
}
`;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    return overlay;
  }

  function open() {
    createOverlay();
    overlay.classList.add('open');
    const input = document.getElementById('cs-input');
    input.value = '';
    input.focus();
    renderEmpty();
  }
  function close() {
    if (overlay) overlay.classList.remove('open');
  }

  /**
   * Empty state : affiche les recherches récentes + tip d'utilisation.
   */
  function renderEmpty() {
    const c = document.getElementById('cs-results');
    if (!c) return;
    const recents = getRecents();
    if (recents.length) {
      const pills = recents.map(r =>
        `<span class="cs-recent-pill" data-recent="${escapeHtml(r)}">${escapeHtml(r)}</span>`
      ).join('');
      c.innerHTML = `
        <div class="cs-recents">
          <div class="cs-recents-title">Recherches récentes</div>
          ${pills}
        </div>
      `;
      c.querySelectorAll('.cs-recent-pill').forEach(el => {
        el.addEventListener('click', () => {
          const v = el.dataset.recent;
          const input = document.getElementById('cs-input');
          if (input) {
            input.value = v;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      });
      _activeFlatList = [];
    } else {
      c.innerHTML = `
        <div class="cs-empty">
          <strong>Que cherches-tu ?</strong>
          Tape pour explorer fiches, questions, scènes et TP.
        </div>
      `;
      _activeFlatList = [];
    }
  }

  /**
   * Surligne en <mark> les occurrences de la query dans le texte (fait
   * la comparaison sur version normalisée mais préserve l'original).
   */
  function highlight(text, normQuery) {
    if (!text) return '';
    if (!normQuery) return escapeHtml(text);
    const norm = normalize(text);
    const idx = norm.indexOf(normQuery);
    if (idx === -1) return escapeHtml(text);
    // Couper à la même position dans l'original (les longueurs sont les
    // mêmes après NFD-strip combiné mark, parce qu'on ne supprime que les
    // chars de combinaison qui sont en plus, mais lowercase ne change pas
    // la longueur. Pour rester safe, on utilise la substr position du
    // texte original via map de positions — mais c'est compliqué. Approche
    // pragmatique : NFD-stripping ne change pas la longueur sur la plupart
    // des cas (NFC accents → 1 char), donc on fait un mapping naïf qui
    // marche dans 99% des cas).
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + normQuery.length);
    const after = text.slice(idx + normQuery.length);
    return escapeHtml(before) + '<mark>' + escapeHtml(match) + '</mark>' + escapeHtml(after);
  }

  function renderResults(items, normQuery) {
    const c = document.getElementById('cs-results');
    if (!c) return;
    if (!items.length) {
      c.innerHTML = `
        <div class="cs-empty">
          <strong>Aucun résultat</strong>
          Essaie d'autres mots-clés ou retire le préfixe de filtre.
        </div>
      `;
      _activeFlatList = [];
      return;
    }

    // Regroupement par type
    const groups = {
      fiche: { label: 'Fiches', icon: '📚', items: [] },
      'scène': { label: 'Scènes', icon: '🎬', items: [] },
      tp: { label: 'TP', icon: '🛠', items: [] },
      question: { label: 'Questions quiz', icon: '💊', items: [] },
    };
    items.forEach(it => {
      const k = it.type;
      if (groups[k]) groups[k].items.push(it);
    });

    let html = '';
    let flat = [];
    let firstIdxAssigned = false;
    const orderedKeys = ['fiche', 'scène', 'tp', 'question'];

    orderedKeys.forEach(k => {
      const g = groups[k];
      if (!g.items.length) return;
      html += `
        <div class="cs-section-header">
          <span class="cs-section-name">${g.icon} ${g.label}</span>
          <span class="cs-section-count">${g.items.length}</span>
        </div>
      `;
      g.items.forEach((it) => {
        const flatIdx = flat.length;
        const isActive = !firstIdxAssigned;
        firstIdxAssigned = true;
        flat.push(it);
        const typeClass = 't-' + it.type.replace(/\s+/g, '-');
        html += `
          <div class="cs-item${isActive ? ' active' : ''}" role="option"
               data-href="${escapeHtml(it.href)}" data-idx="${flatIdx}">
            <span class="cs-item-icon">${it.icon || '·'}</span>
            <div class="cs-item-body">
              <div class="cs-item-title">${highlight(it.title, normQuery)}</div>
              <div class="cs-item-desc">${highlight(it.desc, normQuery)}</div>
            </div>
            <span class="cs-item-type ${typeClass}">${it.type}</span>
          </div>
        `;
      });
    });

    c.innerHTML = html;
    _activeFlatList = flat;

    [...c.querySelectorAll('.cs-item')].forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.href));
      el.addEventListener('mouseenter', () => {
        c.querySelectorAll('.cs-item').forEach(e => e.classList.remove('active'));
        el.classList.add('active');
      });
    });
  }

  function escapeHtml(s) {
    return (s || '').toString().replace(/[&<>"']/g, m => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
    ));
  }

  function navigate(href) {
    // Mémorise la query courante (uniquement si non vide)
    const input = document.getElementById('cs-input');
    if (input && input.value.trim()) pushRecent(input.value.trim());
    close();
    if (href) window.location.href = href;
  }

  // ── Debounce ─────────────────────────────────────────────────
  let searchTimer = null;
  async function handleInput(e) {
    clearTimeout(searchTimer);
    const raw = e.target.value;
    if (!raw.trim()) {
      renderEmpty();
      return;
    }
    searchTimer = setTimeout(async () => {
      const results = await search(raw);
      const { term } = parseQuery(raw);
      renderResults(results, normalize(term));
    }, 120);
  }

  // ── Navigation clavier ───────────────────────────────────────
  function handleKeyNav(e) {
    if (!overlay || !overlay.classList.contains('open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    const items = [...overlay.querySelectorAll('.cs-item')];
    if (!items.length) return;
    let idx = items.findIndex(it => it.classList.contains('active'));
    if (idx === -1) idx = 0;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = Math.min(items.length - 1, idx + 1);
      items.forEach(it => it.classList.remove('active'));
      items[idx].classList.add('active');
      items[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = Math.max(0, idx - 1);
      items.forEach(it => it.classList.remove('active'));
      items[idx].classList.add('active');
      items[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[idx]) navigate(items[idx].dataset.href);
    }
  }

  // ── Hotkey global ────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K = ouvrir
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open();
      return;
    }
    handleKeyNav(e);
  });

  // Attach input handler quand overlay créé
  document.addEventListener('input', (e) => {
    if (e.target.id === 'cs-input') handleInput(e);
  });

  // Fermer sur clic hors panel
  document.addEventListener('click', (e) => {
    if (overlay && overlay.classList.contains('open') && e.target === overlay) close();
  });

  // API publique
  window.CasInSearch = { open, close };
})();
