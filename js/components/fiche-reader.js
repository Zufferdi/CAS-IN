// ═══════════════════════════════════════════════════════════════
// fiche-reader.js — Mode "lecture continue" entre fiches
//
// Injecte automatiquement en bas de chaque fiche :
//   • Un bandeau "Précédent · Suivant" (navigation linéaire dans la même
//     catégorie, ordre alphabétique du titre)
//   • Un indicateur de progression "Fiche X/Y dans le thème"
//   • Une barre de progression visuelle
//   • Une section "Fiches connexes" (basée sur les questions partagées)
//
// Suit la progression de lecture dans localStorage avec la clé "fiche-reader.read"
// (Set des fichiers lus, persistant). Une fiche est marquée comme "lue" 90s après
// l'ouverture (suffisamment long pour ne pas compter un coup d'œil rapide).
//
// Données : data/fiche-graph.json (généré par scripts/build_fiche_graph.py)
//
// v1.0 — 2026-05-03 (CAS-IN v2.24)
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── Configuration ─────────────────────────────────────────
  const READ_KEY = 'fiche-reader.read';
  const READ_DELAY_MS = 90 * 1000;      // 90s avant de marquer "lue"
  const GRAPH_URL = '../data/fiche-graph.json';

  // ─── Persistence : ensemble des fiches lues ────────────────
  function getRead() {
    try {
      const raw = localStorage.getItem(READ_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  function markRead(file) {
    try {
      const set = getRead();
      if (set.has(file)) return;
      set.add(file);
      localStorage.setItem(READ_KEY, JSON.stringify([...set]));

      // v2.84 — Synchroniser avec la clé canonique casIn_readFiches_v4
      // (utilisée par Profile.getFichesReadCount + achievements fiches)
      try {
        const canonRaw = localStorage.getItem('casIn_readFiches_v4');
        const canon = canonRaw ? JSON.parse(canonRaw) : [];
        const arr = Array.isArray(canon) ? canon : [];
        if (!arr.includes(file)) {
          arr.push(file);
          localStorage.setItem('casIn_readFiches_v4', JSON.stringify(arr));
        }
      } catch (_) {}

      // v2.85 — Récompenser la lecture par +15 XP (source 'fiches')
      // et déclencher l'évaluation des achievements.
      // Tags dérivés du nom de fichier ET du <h1> pour activer le bonus
      // de rôle (+20%) côté Profile. Avant v2.85, on passait { fiche: tag }
      // qui n'était pas lu par addXp (qui attend meta.tags), donc le bonus
      // de rôle n'était jamais appliqué aux fiches.
      if (window.Profile && typeof window.Profile.addXp === 'function') {
        try {
          const base = file.replace(/\.html$/, '');
          // Découpe sur _ : "linux_forensique" → ["linux", "forensique"]
          const fromName = base.split(/[_-]+/).filter(Boolean);
          // Mots significatifs du <h1> (>= 4 lettres, max 6 mots)
          let fromTitle = [];
          try {
            const h1 = document.querySelector('h1');
            if (h1) {
              fromTitle = h1.textContent
                .split(/\s+/)
                .filter(w => w.length >= 4)
                .slice(0, 6);
            }
          } catch (_) {}
          const tags = [...fromName, ...fromTitle];
          window.Profile.addXp(15, 'fiches', { tags });
          window.Profile.recordActivity('fiches');
        } catch (_) {}
      }
      if (window.AchievementsCore && typeof window.AchievementsCore.evalAndUnlock === 'function' && window.Profile) {
        setTimeout(() => {
          try { window.AchievementsCore.evalAndUnlock(window.Profile.snapshot()); } catch (_) {}
        }, 100);
      }
    } catch {}
  }

  // ─── Récupération de la fiche courante depuis l'URL ────────
  function currentFile() {
    // /fiches/acquisition.html → "acquisition.html"
    const path = window.location.pathname;
    const parts = path.split('/');
    const last = parts[parts.length - 1];
    return last && last.endsWith('.html') ? last : null;
  }

  // ─── Chargement du graphe (avec cache mémoire) ─────────────
  let _graphCache = null;
  async function loadGraph() {
    if (_graphCache) return _graphCache;
    try {
      const r = await fetch(GRAPH_URL);
      if (!r.ok) return null;
      _graphCache = await r.json();
      return _graphCache;
    } catch (e) {
      console.warn('[fiche-reader] Cannot load graph:', e);
      return null;
    }
  }

  // ─── Injection du bandeau ──────────────────────────────────
  function buildHTML(entry, graph, currentFileName, readSet) {
    const cat = entry.category;
    const catData = graph.categories[cat];
    const allInCat = (catData && catData.fiches) || [];
    const readInCat = allInCat.filter(f => readSet.has(f.file)).length;
    // On ajoute la fiche courante au compteur si elle n'est pas encore "lue"
    const visibleRead = Math.min(allInCat.length,
      readInCat + (readSet.has(currentFileName) ? 0 : 1));
    const pct = allInCat.length
      ? Math.round((visibleRead / allInCat.length) * 100)
      : 0;

    // Prev / Next
    const prevHTML = entry.prev
      ? `<a class="reader-nav-link reader-nav-prev" href="${escapeAttr(entry.prev.file)}"
            aria-label="Fiche précédente : ${escapeAttr(entry.prev.title)}">
           <span class="reader-nav-arrow">←</span>
           <span class="reader-nav-meta">
             <span class="reader-nav-label">Précédent</span>
             <span class="reader-nav-title">
               ${escapeText(entry.prev.icon)} ${escapeText(entry.prev.title)}
             </span>
           </span>
         </a>`
      : `<span class="reader-nav-link reader-nav-disabled" aria-disabled="true">
           <span class="reader-nav-arrow">←</span>
           <span class="reader-nav-meta">
             <span class="reader-nav-label">Début du thème</span>
           </span>
         </span>`;

    const nextHTML = entry.next
      ? `<a class="reader-nav-link reader-nav-next" href="${escapeAttr(entry.next.file)}"
            aria-label="Fiche suivante : ${escapeAttr(entry.next.title)}">
           <span class="reader-nav-meta">
             <span class="reader-nav-label">Suivant</span>
             <span class="reader-nav-title">
               ${escapeText(entry.next.icon)} ${escapeText(entry.next.title)}
             </span>
           </span>
           <span class="reader-nav-arrow">→</span>
         </a>`
      : `<a class="reader-nav-link reader-nav-end" href="../fiches/index.html"
            aria-label="Retour à l'index des fiches">
           <span class="reader-nav-meta">
             <span class="reader-nav-label">Thème terminé ✓</span>
             <span class="reader-nav-title">Voir tous les thèmes</span>
           </span>
           <span class="reader-nav-arrow">↩</span>
         </a>`;

    // Related (max 4 affichés)
    const related = (entry.related || []).slice(0, 4);
    const relatedHTML = related.length
      ? `<div class="reader-related">
           <div class="reader-related-label">Fiches connexes</div>
           <div class="reader-related-grid">
             ${related.map(r => `
               <a href="${escapeAttr(r.file)}" class="reader-related-item">
                 <span class="reader-related-icon">${escapeText(r.icon)}</span>
                 <span class="reader-related-title">${escapeText(r.title)}</span>
                 <span class="reader-related-shared">${r.shared} questions partagées</span>
               </a>`).join('')}
           </div>
         </div>`
      : '';

    return `
      <section class="reader-box" aria-label="Mode lecture continue">
        <div class="reader-progress-row">
          <div class="reader-progress-label">
            <span class="reader-progress-icon">${escapeText((catData && catData.icon) || '📚')}</span>
            <span class="reader-progress-text">
              <strong>${escapeText((catData && catData.title) || cat)}</strong>
              · Fiche <strong>${entry.category_index + 1}</strong>/<strong>${entry.category_total}</strong>
              · <span class="reader-progress-read">${visibleRead}/${allInCat.length} lues (${pct}%)</span>
            </span>
          </div>
          <div class="reader-progress-bar" role="progressbar"
               aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="reader-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <nav class="reader-nav" aria-label="Navigation entre fiches">
          ${prevHTML}
          ${nextHTML}
        </nav>
        ${relatedHTML}
      </section>`;
  }

  function escapeText(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(s) {
    return escapeText(s).replace(/"/g, '&quot;');
  }

  // ─── Choix du point d'insertion dans la fiche ──────────────
  // On cherche le footer si présent, sinon on append au body avant le script.
  function findInsertionPoint() {
    // 1) Footer existant
    const footer = document.querySelector('footer');
    if (footer) return { mode: 'before', el: footer };

    // 2) Section "back-to-top" ou bouton du même nom
    const backTop = document.getElementById('back-top');
    if (backTop && backTop.parentElement) {
      return { mode: 'before', el: backTop };
    }

    // 3) Sinon, on append à la fin du main / body
    const main = document.querySelector('main');
    if (main) return { mode: 'append', el: main };

    return { mode: 'append', el: document.body };
  }

  // ─── Injection du CSS minimum (compatible thème dark) ──────
  function injectStyles() {
    if (document.getElementById('fiche-reader-styles')) return;
    const css = `
      .reader-box {
        margin: 2.5rem auto 1.5rem;
        max-width: 920px;
        padding: 1.5rem;
        border: 1px solid var(--border, rgba(255,255,255,.1));
        border-radius: 16px;
        background: linear-gradient(135deg,
          rgba(0, 200, 255, .04),
          rgba(48, 232, 138, .03));
        font-family: var(--font, system-ui, -apple-system, sans-serif);
      }
      .reader-progress-row {
        display: flex; flex-direction: column; gap: .5rem;
        margin-bottom: 1rem;
      }
      .reader-progress-label {
        display: flex; align-items: center; gap: .5rem;
        font-size: .85rem; color: var(--dim, rgba(255,255,255,.65));
        flex-wrap: wrap;
      }
      .reader-progress-icon { font-size: 1.1rem; }
      .reader-progress-text strong { color: var(--text, #fff); }
      .reader-progress-read { color: var(--cyan, #5cd9ff); font-weight: 500; }
      .reader-progress-bar {
        height: 4px; border-radius: 2px;
        background: var(--surface2, rgba(255,255,255,.08));
        overflow: hidden;
      }
      .reader-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--cyan, #5cd9ff), var(--green, #30e88a));
        transition: width .4s ease;
        border-radius: 2px;
      }
      .reader-nav {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: .75rem;
      }
      @media (max-width: 600px) {
        .reader-nav { grid-template-columns: 1fr; }
      }
      .reader-nav-link {
        display: flex; align-items: center; gap: .75rem;
        padding: .85rem 1rem;
        border: 1px solid var(--border, rgba(255,255,255,.1));
        border-radius: 12px;
        background: var(--surface2, rgba(255,255,255,.03));
        color: var(--text, #fff);
        text-decoration: none;
        transition: all .2s ease;
        min-height: 56px;
      }
      .reader-nav-link:hover:not(.reader-nav-disabled) {
        border-color: var(--cyan, #5cd9ff);
        background: rgba(92, 217, 255, .08);
        transform: translateY(-1px);
      }
      .reader-nav-prev { justify-content: flex-start; text-align: left; }
      .reader-nav-next, .reader-nav-end { justify-content: flex-end; text-align: right; }
      .reader-nav-arrow {
        font-size: 1.4rem;
        font-weight: 300;
        color: var(--cyan, #5cd9ff);
        flex-shrink: 0;
      }
      .reader-nav-disabled .reader-nav-arrow { color: var(--dim, rgba(255,255,255,.35)); }
      .reader-nav-meta {
        display: flex; flex-direction: column;
        gap: .15rem; min-width: 0; flex: 1;
      }
      .reader-nav-label {
        font-size: .7rem; text-transform: uppercase; letter-spacing: .04em;
        color: var(--dim, rgba(255,255,255,.55));
      }
      .reader-nav-title {
        font-size: .9rem; font-weight: 500;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .reader-nav-disabled {
        opacity: .55;
        cursor: default;
      }
      .reader-nav-end {
        background: linear-gradient(135deg,
          rgba(48, 232, 138, .08),
          rgba(48, 232, 138, .02));
        border-color: rgba(48, 232, 138, .25);
      }
      .reader-nav-end .reader-nav-arrow { color: var(--green, #30e88a); }

      .reader-related {
        margin-top: 1.25rem;
        padding-top: 1rem;
        border-top: 1px dashed var(--border, rgba(255,255,255,.08));
      }
      .reader-related-label {
        font-size: .75rem; text-transform: uppercase; letter-spacing: .04em;
        color: var(--dim, rgba(255,255,255,.55));
        margin-bottom: .65rem;
      }
      .reader-related-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: .55rem;
      }
      .reader-related-item {
        display: flex; flex-direction: column; gap: .25rem;
        padding: .65rem .85rem;
        border: 1px solid var(--border, rgba(255,255,255,.08));
        border-radius: 10px;
        background: var(--surface, rgba(255,255,255,.02));
        text-decoration: none;
        color: var(--text, #fff);
        transition: all .15s ease;
      }
      .reader-related-item:hover {
        border-color: var(--cyan, #5cd9ff);
        background: rgba(92, 217, 255, .06);
      }
      .reader-related-icon { font-size: 1rem; }
      .reader-related-title {
        font-size: .82rem; font-weight: 500;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .reader-related-shared {
        font-size: .68rem; color: var(--dim, rgba(255,255,255,.5));
      }

      @media print {
        .reader-box { display: none; }
      }
    `;
    const style = document.createElement('style');
    style.id = 'fiche-reader-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ─── Initialisation ────────────────────────────────────────
  async function init() {
    const file = currentFile();
    if (!file) return;

    const graph = await loadGraph();
    if (!graph || !graph.fiches) return;

    const entry = graph.fiches[file];
    if (!entry) return; // fiche pas dans le graphe (ex: index.html)

    injectStyles();
    const readSet = getRead();

    const html = buildHTML(entry, graph, file, readSet);
    const insertion = findInsertionPoint();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    const node = wrapper.firstElementChild;

    if (insertion.mode === 'before') {
      insertion.el.parentElement.insertBefore(node, insertion.el);
    } else {
      insertion.el.appendChild(node);
    }

    // Marquer la fiche comme lue après READ_DELAY_MS de présence
    setTimeout(() => markRead(file), READ_DELAY_MS);

    // Exposer pour debug et pour outils externes (profile/stats)
    window.FicheReader = {
      getRead,
      markRead,
      currentFile: () => file,
      _graph: graph,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
