// ═══════════════════════════════════════════════════════════════
// cas-in-search.js — Recherche globale Ctrl+K / Cmd+K
// Cherche dans : fiches, questions quiz, catégories TP, scènes
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // État local — chargé à la demande (lazy)
  let indexed = null;
  let loadingPromise = null;

  // ── Chargement de l'index ────────────────────────────────────
  async function loadIndex() {
    if (indexed) return indexed;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async function () {
      const result = { fiches: [], questions: [], tp: [], scenes: [] };

      // Fiches : parse l'index HTML
      try {
        const depth = (window.location.pathname.match(/\//g) || []).length - 1;
        const basePath = depth > 1 ? '../'.repeat(depth - 1) : './';
        const resp = await fetch(basePath + 'fiches/index.html', { cache: 'force-cache' });
        if (resp.ok) {
          const html = await resp.text();
          const cards = [...html.matchAll(/<a\s+href="([a-z0-9_-]+\.html)"\s+class="fiche-card"[^>]*(?:data-keywords="([^"]*)")?[^>]*>([\s\S]*?)<\/a>/gi)];
          for (const m of cards) {
            const href = m[1];
            const keywords = m[2] || '';
            const inner = m[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            result.fiches.push({
              type: 'fiche', href: basePath + 'fiches/' + href,
              title: inner.split(' ')[0] || href.replace(/\.html$/, ''),
              desc: inner, keywords, icon: '📄'
            });
          }
        }
      } catch (e) { /* silencieux */ }

      // Questions : charge questions.json
      try {
        const depth = (window.location.pathname.match(/\//g) || []).length - 1;
        const basePath = depth > 1 ? '../'.repeat(depth - 1) : './';
        const resp = await fetch(basePath + 'questions.json', { cache: 'force-cache' });
        if (resp.ok) {
          const data = await resp.json();
          result.questions = data.slice(0, 1500).map((q, i) => ({
            type: 'question', idx: i,
            href: basePath + 'quiz.html#q' + i,
            title: q.q ? q.q.slice(0, 80) : '(sans titre)',
            desc: (q.theme || '') + ' · ' + (q.chapter || '') + ' · ' + (q.diff || ''),
            keywords: (q.theme + ' ' + q.chapter + ' ' + q.q).toLowerCase(),
            icon: '💊'
          }));
        }
      } catch (e) { /* silencieux */ }

      // TP : on utilise le contenu de tp.html pour les catégories
      const tpCategories = [
        {cat:'endian',label:'Endianness',icon:'🔄'},{cat:'timestamp',label:'Timestamps FAT',icon:'⏱'},
        {cat:'bitmap',label:'Bitmap exFAT',icon:'🗺'},{cat:'fat',label:'Chaîne FAT',icon:'⛓'},
        {cat:'magic',label:'Magic Bytes',icon:'✨'},{cat:'mismatch',label:'Mismatch',icon:'🎭'},
        {cat:'runlist',label:'Run List NTFS',icon:'🧩'},{cat:'effacement',label:'Effacement FAT',icon:'🗑'},
        {cat:'timestomping',label:'Timestomping',icon:'🕰'},{cat:'hextable',label:'Table Hex',icon:'🗺'},
        {cat:'fsidentify',label:'Identifier le FS',icon:'🔍'},{cat:'offset',label:'Calcul d\'offset',icon:'📐'},
        {cat:'bases',label:'Bases & Encodages',icon:'🔢'},{cat:'hash',label:'Hash & Intégrité',icon:'🔑'},
        {cat:'email',label:'Email Forensics',icon:'✉️'},{cat:'network',label:'Réseau & PCAP',icon:'📡'},
        {cat:'ir',label:'Incident Response',icon:'🚨'},{cat:'droitpenal',label:'Droit pénal',icon:'⚖️'},
        {cat:'glossaire',label:'Glossaire',icon:'🗂'},{cat:'examen',label:'Série Examen',icon:'📋'}
      ];
      const depthBase = (window.location.pathname.match(/\//g) || []).length - 1;
      const basePath = depthBase > 1 ? '../' : './';
      result.tp = tpCategories.map(c => ({
        type: 'tp', href: basePath + 'tp.html#' + c.cat,
        title: c.label, desc: 'Travaux pratiques · ' + c.cat,
        keywords: (c.label + ' ' + c.cat).toLowerCase(),
        icon: c.icon
      }));

      indexed = result;
      return result;
    })();

    return loadingPromise;
  }

  // ── Scoring simple ────────────────────────────────────────────
  function scoreItem(item, query) {
    const q = query.toLowerCase();
    let score = 0;
    const title = (item.title || '').toLowerCase();
    const desc = (item.desc || '').toLowerCase();
    const kw = (item.keywords || '').toLowerCase();
    if (title.startsWith(q)) score += 100;
    if (title.includes(q)) score += 50;
    if (kw.includes(q)) score += 30;
    if (desc.includes(q)) score += 10;
    // Bonus par type pour équilibrer
    if (item.type === 'fiche') score += 5;
    if (item.type === 'tp') score += 3;
    return score;
  }

  async function search(query) {
    const idx = await loadIndex();
    const all = [...idx.fiches, ...idx.tp, ...idx.questions];
    const scored = all.map(item => ({ item, score: scoreItem(item, query) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    return scored.map(x => x.item);
  }

  // ── UI ───────────────────────────────────────────────────────
  let overlay = null;
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
          <input type="search" class="cs-input" id="cs-input" placeholder="Chercher dans fiches, questions, TP, scènes…" autocomplete="off" aria-label="Requête de recherche">
          <kbd class="cs-kbd">Échap</kbd>
        </div>
        <div class="cs-results" id="cs-results" role="listbox" aria-label="Résultats"></div>
        <div class="cs-footer" id="cs-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span>
          <span><kbd>↵</kbd> ouvrir</span>
          <span><kbd>Esc</kbd> fermer</span>
        </div>
      </div>
    `;
    // Styles inline car on ne veut pas dépendre d'un CSS
    const style = document.createElement('style');
    style.textContent = `
#cas-search-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:99999;display:none;align-items:flex-start;justify-content:center;padding:10vh 1rem 1rem;animation:csFadeIn .15s ease}
#cas-search-overlay.open{display:flex}
#cas-search-overlay .cs-panel{background:#161b22;border:1px solid #30363d;border-radius:12px;width:100%;max-width:640px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.8);display:flex;flex-direction:column;max-height:70vh}
#cas-search-overlay .cs-head{display:flex;align-items:center;gap:.7rem;padding:.8rem 1rem;border-bottom:1px solid #30363d}
#cas-search-overlay .cs-icon{font-size:1.1rem}
#cas-search-overlay .cs-input{flex:1;background:transparent;border:none;outline:none;color:#e6edf3;font-size:1rem;font-family:'JetBrains Mono',monospace}
#cas-search-overlay .cs-kbd,#cas-search-overlay kbd{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:4px;padding:.1rem .4rem;font-size:.7rem;color:#8b949e;font-family:inherit}
#cas-search-overlay .cs-results{flex:1;overflow-y:auto;padding:.4rem}
#cas-search-overlay .cs-results:empty::after{content:attr(data-empty);color:#6e7681;font-size:.85rem;text-align:center;display:block;padding:2rem 1rem}
#cas-search-overlay .cs-item{display:flex;gap:.7rem;align-items:center;padding:.6rem .8rem;border-radius:8px;cursor:pointer;transition:background .1s;border:1px solid transparent}
#cas-search-overlay .cs-item:hover,#cas-search-overlay .cs-item.active{background:rgba(0,229,204,.08);border-color:rgba(0,229,204,.3)}
#cas-search-overlay .cs-item-icon{font-size:1.2rem;flex-shrink:0}
#cas-search-overlay .cs-item-body{flex:1;min-width:0}
#cas-search-overlay .cs-item-title{color:#e6edf3;font-size:.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cas-search-overlay .cs-item-desc{color:#8b949e;font-size:.7rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.15rem}
#cas-search-overlay .cs-item-type{background:rgba(0,229,204,.1);border:1px solid rgba(0,229,204,.3);color:#00e5cc;font-size:.6rem;padding:.1rem .4rem;border-radius:3px;font-family:'JetBrains Mono',monospace;text-transform:uppercase}
#cas-search-overlay .cs-footer{display:flex;justify-content:space-between;padding:.5rem .8rem;border-top:1px solid #30363d;font-size:.65rem;color:#6e7681;gap:.5rem;flex-wrap:wrap}
#cas-search-overlay .cs-footer kbd{font-size:.6rem}
@keyframes csFadeIn{from{opacity:0}to{opacity:1}}
@media(max-width:640px){
  #cas-search-overlay{padding:2vh 0.5rem 0.5rem}
  #cas-search-overlay .cs-panel{max-height:90vh}
  #cas-search-overlay .cs-footer{font-size:.55rem}
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
    renderResults([]);
  }
  function close() {
    if (overlay) overlay.classList.remove('open');
  }

  function renderResults(items) {
    const c = document.getElementById('cs-results');
    if (!items.length) {
      c.innerHTML = '';
      c.setAttribute('data-empty', 'Tape pour chercher…');
      return;
    }
    c.removeAttribute('data-empty');
    c.innerHTML = items.map((it, i) => `
      <div class="cs-item${i===0?' active':''}" role="option" data-href="${it.href}" data-idx="${i}">
        <span class="cs-item-icon">${it.icon || '·'}</span>
        <div class="cs-item-body">
          <div class="cs-item-title">${escapeHtml(it.title)}</div>
          <div class="cs-item-desc">${escapeHtml(it.desc)}</div>
        </div>
        <span class="cs-item-type">${it.type}</span>
      </div>
    `).join('');
    [...c.querySelectorAll('.cs-item')].forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.href));
      el.addEventListener('mouseenter', () => {
        c.querySelectorAll('.cs-item').forEach(e => e.classList.remove('active'));
        el.classList.add('active');
      });
    });
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  function navigate(href) {
    close();
    if (href) window.location.href = href;
  }

  // ── Debounce ─────────────────────────────────────────────────
  let searchTimer = null;
  async function handleInput(e) {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    if (!q) { renderResults([]); return; }
    searchTimer = setTimeout(async () => {
      const results = await search(q);
      renderResults(results);
    }, 120);
  }

  // ── Navigation clavier ───────────────────────────────────────
  function handleKeyNav(e) {
    if (!overlay || !overlay.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    const items = [...overlay.querySelectorAll('.cs-item')];
    if (!items.length) return;
    let idx = items.findIndex(it => it.classList.contains('active'));
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

  // API publique (utile pour un bouton de déclenchement)
  window.CasInSearch = { open, close };
})();
