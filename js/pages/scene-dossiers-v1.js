/* ═══════════════════════════════════════════════════════════════
 * scene-dossiers-v1.js — v2.93
 * 
 * Vue "Dossiers" : présentation narrative et chronologique des
 * scénarios CAS-IN. Complémentaire aux Parcours (lobby-v3) :
 *   - Parcours = collections thématiques (Ransomware, IA, OSINT...)
 *   - Dossiers = arborescence narrative (4 groupes × année × event)
 *               + sagas multi-actes (Viège, Sarine, Initiation)
 *
 * Pourquoi cette vue : avec 162 scènes, le lobby plat est saturant.
 * Les dossiers donnent un cadre temporel et narratif pour les
 * INCIDENTS HISTORIQUES (datés), CAS QUOTIDIENS (routine),
 * COOPÉRATION EUROPÉENNE (EU/MLAT) et MÉTHODOLOGIE (technique).
 *
 * Architecture :
 *   - IIFE auto-installée, idempotente (window.__casInDossiers)
 *   - Lazy-load de data/scenes-chronology.json (cache 1h)
 *   - Injecte un bouton "📂 Dossiers" dans .controls-strip
 *   - Injecte un <div id="screen-dossiers"> dans #app
 *   - Click sur scène → hydrateScene + startScene (réutilise scene-app.js)
 *
 * Pas de duplication de logique :
 *   - Lecture progression via lsGet('scene_results', {}) (clé partagée)
 *   - Célébration sagas déléguée au système PARCOURS de lobby-v3
 *     (qui voit déjà Viège et Sarine comme parcours, donc déclenche
 *     ses propres célébrations en retour au lobby).
 * ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (window.__casInDossiers) return;
  window.__casInDossiers = true;

  const CHRONO_URL = 'data/scenes-chronology.json';
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
  const CACHE_KEY = '__cas_chronology_cache_v1';

  // ─── Etat module ────────────────────────────────────────────────
  let _chronology = null;        // données chargées
  let _loadPromise = null;
  let _openGroups = null;        // Set des groupes développés (persisté)
  const STORAGE_OPEN_GROUPS = 'cas_dossiers_open_groups';

  // ─── Filtres unifiés (v2.97 — piste 6) ───────────────────────────
  // Permet de croiser les 3 taxonomies parallèles :
  //   - branche : 6 compétences (forensique, crypto, droit, réseau, intl, comportement)
  //   - région  : CH vs EU
  //   - statut  : nouveau vs en cours vs perfect vs tous
  //
  // Conventions des branches : reprises de SKILL_BRANCHES dans scene-app.js,
  // mais dupliquées ici pour découpler le module (idéalement, on extrairait
  // SKILL_BRANCHES dans un fichier partagé — TODO refacto futur).
  const BRANCH_FILTERS = [
    { id: 'all',           label: 'Toutes',        icon: '✦',  tags: null, region: null },
    { id: 'forensique',    label: 'Forensique',    icon: '🔬', tags: ['FORENSIQUE','WINDOWS'] },
    { id: 'crypto',        label: 'Crypto/Ransom', icon: '🔐', tags: ['CRYPTO','RANSOMWARE'] },
    { id: 'droit',         label: 'Droit & CPP',   icon: '⚖️', tags: ['DROIT','CPP'] },
    { id: 'reseau',        label: 'Réseau',        icon: '🌐', tags: ['RÉSEAUX','TELECOM'] },
    { id: 'international', label: 'International', icon: '🇪🇺', region: 'EU' },
  ];
  const STATUS_FILTERS = [
    { id: 'all',     label: 'Tous statuts' },
    { id: 'new',     label: '🆕 À jouer' },
    { id: 'started', label: '⏯ En cours' },
    { id: 'perfect', label: '⭐ ≥90%' },
  ];
  let _activeBranch = 'all';
  let _activeStatus = 'all';
  const STORAGE_FILTERS = 'cas_dossiers_filters';

  // ─── Helpers minimaux (indépendants de scene-app.js) ────────────
  function getResults() {
    try { return JSON.parse(localStorage.getItem('scene_results') || '{}'); }
    catch { return {}; }
  }

  function getOpenGroups() {
    if (_openGroups) return _openGroups;
    try {
      const raw = localStorage.getItem(STORAGE_OPEN_GROUPS);
      if (raw) {
        _openGroups = new Set(JSON.parse(raw));
        return _openGroups;
      }
    } catch { /* noop */ }
    // Par défaut : tout ouvert sauf MÉTHODOLOGIE (le plus volumineux)
    _openGroups = new Set([
      '🌍 INCIDENTS HISTORIQUES',
      '🇪🇺 COOPÉRATION EUROPÉENNE',
      '💼 CAS QUOTIDIENS',
    ]);
    return _openGroups;
  }

  function persistOpenGroups() {
    try {
      localStorage.setItem(STORAGE_OPEN_GROUPS,
        JSON.stringify(Array.from(getOpenGroups())));
    } catch { /* noop */ }
  }

  // ─── Filtres unifiés : persistance ────────────────────────────────
  function loadFilters() {
    try {
      const raw = localStorage.getItem(STORAGE_FILTERS);
      if (raw) {
        const f = JSON.parse(raw);
        if (f.branch) _activeBranch = f.branch;
        if (f.status) _activeStatus = f.status;
      }
    } catch { /* noop */ }
  }
  function persistFilters() {
    try {
      localStorage.setItem(STORAGE_FILTERS, JSON.stringify({
        branch: _activeBranch, status: _activeStatus,
      }));
    } catch { /* noop */ }
  }

  // Pour chaque scène, on récupère les tags depuis SCENES (window.SCENES,
  // qui est chargé par scene-app.js). Si SCENES n'est pas dispo, on ne
  // peut pas filtrer par branche → tous les filtres branches ramènent tout.
  function getSceneTags(sceneId) {
    if (typeof window.SCENES === 'undefined') return [];
    const s = window.SCENES.find(s => s && s.id === sceneId);
    return (s && s.tags) || [];
  }
  function getSceneRegion(sceneId) {
    if (typeof window.SCENES === 'undefined') return null;
    const s = window.SCENES.find(s => s && s.id === sceneId);
    return s && s.region;
  }

  function matchesBranch(sceneId, branchId) {
    if (branchId === 'all') return true;
    const b = BRANCH_FILTERS.find(x => x.id === branchId);
    if (!b) return true;
    if (b.region) return getSceneRegion(sceneId) === b.region;
    if (b.tags && b.tags.length) {
      const tags = getSceneTags(sceneId);
      return tags.some(t => b.tags.includes(t));
    }
    return true;
  }
  function matchesStatus(sceneId, statusId, results) {
    if (statusId === 'all') return true;
    const r = results[sceneId];
    if (statusId === 'new')     return !r;
    if (statusId === 'started') return !!r && r.pct < 90;
    if (statusId === 'perfect') return !!r && r.pct >= 90;
    return true;
  }
  function matchesFilters(sceneId, results) {
    return matchesBranch(sceneId, _activeBranch)
        && matchesStatus(sceneId, _activeStatus, results);
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]
    ));
  }

  function getScoreColor(pct) {
    if (pct >= 90) return 'var(--green)';
    if (pct >= 70) return 'var(--gold)';
    if (pct >= 50) return 'var(--orange)';
    return 'var(--red)';
  }

  const DIFF_LABEL = { easy:'Facile', medium:'Moyen', hard:'Difficile', expert:'Expert' };
  const DIFF_SHORT = { easy:'F', medium:'M', hard:'D', expert:'X' };

  // ─── Loader chronologie (lazy + localStorage cache) ─────────────
  function loadChronology() {
    if (_chronology) return Promise.resolve(_chronology);
    if (_loadPromise) return _loadPromise;

    _loadPromise = (async () => {
      // Cache localStorage
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.t && Date.now() - parsed.t < CACHE_TTL_MS && parsed.d) {
            _chronology = parsed.d;
            return _chronology;
          }
        }
      } catch { /* noop */ }

      // Fetch
      const r = await fetch(CHRONO_URL, { cache: 'no-cache' });
      if (!r.ok) throw new Error('HTTP ' + r.status + ' on ' + CHRONO_URL);
      const data = await r.json();
      _chronology = data;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: data }));
      } catch { /* localStorage full ou désactivé */ }
      return data;
    })();
    return _loadPromise;
  }

  // ─── DOM injection : bouton + screen ────────────────────────────
  function injectButton() {
    const strip = document.querySelector('.controls-strip');
    if (!strip || document.getElementById('btn-dossiers')) return;
    const btn = document.createElement('button');
    btn.className = 'ctrl-btn';
    btn.id = 'btn-dossiers';
    btn.title = 'Vue narrative : dossiers chronologiques + sagas';
    btn.innerHTML = '📂 <span>Dossiers</span>';
    btn.addEventListener('click', openDossiers);
    // Insertion avant le bouton Arbre si présent, sinon en fin
    const arbreBtn = Array.from(strip.children).find(b =>
      b.textContent && b.textContent.includes('Arbre'));
    if (arbreBtn) strip.insertBefore(btn, arbreBtn);
    else strip.appendChild(btn);
  }

  function injectScreen() {
    if (document.getElementById('screen-dossiers')) return;
    const app = document.getElementById('app');
    if (!app) return;
    const screen = document.createElement('div');
    screen.className = 'screen';
    screen.id = 'screen-dossiers';
    screen.innerHTML = `
      <div class="dossiers-header">
        <button class="ctrl-btn" id="dossiers-back" style="flex:0 0 auto">← Retour</button>
        <h2 class="dossiers-title">📂 Dossiers d'enquête</h2>
        <div class="dossiers-subtitle" id="dossiers-subtitle">—</div>
      </div>
      <div class="dossiers-container" id="dossiers-container">
        <div class="dossiers-loading">Chargement de l'arborescence…</div>
      </div>
    `;
    // Insertion après screen-skilltree si présent, sinon avant le toast
    const skill = document.getElementById('screen-skilltree');
    if (skill && skill.nextSibling) skill.parentNode.insertBefore(screen, skill.nextSibling);
    else app.appendChild(screen);

    document.getElementById('dossiers-back').addEventListener('click', () => {
      if (typeof window.goLobby === 'function') window.goLobby();
      else showScreenFallback('lobby');
    });
  }

  function showScreenFallback(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + id);
    if (target) target.classList.add('active');
  }

  // ─── Rendu ──────────────────────────────────────────────────────
  function tierFromResult(res) {
    if (!res) return null;
    const pct = res.pct || 0;
    if (pct >= 90) return 'perfect';
    return 'done';
  }

  function renderSagaCard(saga, results, sceneIndex) {
    const acts = saga.scenes.map((sid, i) => {
      const sceneMeta = sceneIndex[sid];
      const res = results[sid];
      return {
        idx: i + 1,
        id: sid,
        title: sceneMeta ? (sceneMeta.title || sid) : sid,
        difficulty: saga.difficulty_curve ? saga.difficulty_curve[i] : (sceneMeta?.difficulty || 'medium'),
        done: !!res,
        pct: res ? res.pct : null,
      };
    });

    const doneCount = acts.filter(a => a.done).length;
    const total = acts.length;
    const pct = total > 0 ? Math.round(doneCount / total * 100) : 0;
    const isComplete = doneCount === total && total > 0;
    const inProgress = doneCount > 0 && !isComplete;

    const stateBadge = isComplete
      ? '<span class="saga-state saga-state-complete">🏆 BOUCLÉE</span>'
      : inProgress
        ? '<span class="saga-state saga-state-progress">⏯ EN COURS</span>'
        : '<span class="saga-state saga-state-new">🎯 NOUVELLE AFFAIRE</span>';

    const xpBonus = saga.completion_xp_bonus || 0;

    // Détecte la prochaine étape jouable (le 1er acte non fait)
    const nextActIdx = acts.findIndex(a => !a.done);
    const nextAct = nextActIdx >= 0 ? acts[nextActIdx] : null;

    const actsHTML = acts.map((a) => {
      const cls = ['saga-act'];
      if (a.done) cls.push('saga-act-done');
      if (a.pct === 100) cls.push('saga-act-perfect');
      if (nextAct && a.id === nextAct.id) cls.push('saga-act-next');
      // Verrouillage soft : on n'empêche pas, mais on signale visuellement
      const diffShort = DIFF_SHORT[a.difficulty] || '?';
      const meta = a.done
        ? `<span style="color:${getScoreColor(a.pct)}">${a.pct}%</span> · ${diffShort}`
        : `<span class="saga-act-diff saga-act-diff-${a.difficulty}">${DIFF_LABEL[a.difficulty] || a.difficulty}</span>`;
      return `
        <div class="${cls.join(' ')}" data-scene-id="${escapeHTML(a.id)}" role="button" tabindex="0">
          <span class="saga-act-num">Acte ${a.idx}</span>
          <span class="saga-act-title">${escapeHTML(a.title)}</span>
          <span class="saga-act-meta">${meta}</span>
        </div>
      `;
    }).join('');

    const continueHTML = nextAct
      ? `<button class="saga-continue-btn" data-scene-id="${escapeHTML(nextAct.id)}">
           ▶ ${isComplete ? 'Rejouer' : (inProgress ? 'Continuer' : 'Démarrer')} — Acte ${nextAct.idx}
         </button>`
      : `<button class="saga-continue-btn saga-continue-done" data-scene-id="${escapeHTML(acts[0].id)}">
           ↻ Rejouer depuis l'acte 1
         </button>`;

    return `
      <article class="saga-card saga-card-${saga.id}" data-saga-id="${saga.id}">
        <header class="saga-card-header">
          <div class="saga-card-icon">${saga.icon || '📁'}</div>
          <div class="saga-card-main">
            <div class="saga-card-meta">
              <span class="saga-card-canton">${escapeHTML(saga.canton || '')}</span>
              <span class="saga-card-year">${escapeHTML(saga.year_range || '')}</span>
              ${stateBadge}
              ${xpBonus > 0 ? `<span class="saga-card-xp">+${xpBonus} XP bonus à la complétion</span>` : ''}
            </div>
            <h3 class="saga-card-title">${escapeHTML(saga.title)}</h3>
            <div class="saga-card-subtitle">${escapeHTML(saga.subtitle || '')}</div>
            ${saga.tagline ? `<p class="saga-card-tagline">«&nbsp;${escapeHTML(saga.tagline)}&nbsp;»</p>` : ''}
          </div>
          <div class="saga-card-progress">
            <div class="saga-progress-ring" style="--pct:${pct}">
              <span class="saga-progress-val">${doneCount}/${total}</span>
            </div>
          </div>
        </header>
        <div class="saga-acts">${actsHTML}</div>
        <footer class="saga-card-footer">
          ${continueHTML}
        </footer>
      </article>
    `;
  }

  function renderGroupSection(groupName, scenes, results) {
    const isOpen = getOpenGroups().has(groupName);
    const total = scenes.length;
    const done = scenes.filter(s => results[s.id]).length;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;

    // Sous-groupage par year (ou "Sans date") puis par event
    const byYear = new Map();
    scenes.forEach(s => {
      const y = s.year || null;
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y).push(s);
    });

    // Tri : années décroissantes, puis null en fin
    const sortedYears = Array.from(byYear.keys()).sort((a, b) => {
      if (a === null && b === null) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return b - a;
    });

    const yearsHTML = sortedYears.map(year => {
      const yearScenes = byYear.get(year);
      // Sous-groupe par event
      const byEvent = new Map();
      yearScenes.forEach(s => {
        const ev = s.event || '—';
        if (!byEvent.has(ev)) byEvent.set(ev, []);
        byEvent.get(ev).push(s);
      });

      const eventsHTML = Array.from(byEvent.entries()).map(([ev, sceneList]) => {
        // Si un seul event regroupe plusieurs scènes (saga implicite) on l'indique
        const isMulti = sceneList.length > 1;
        const itemsHTML = sceneList.map(s => {
          const res = results[s.id];
          const tier = tierFromResult(res);
          const cls = ['dossier-item'];
          if (tier === 'perfect') cls.push('dossier-item-perfect');
          else if (tier === 'done') cls.push('dossier-item-done');
          const statusHTML = res
            ? `<span class="dossier-item-status" style="color:${getScoreColor(res.pct)}">✓ ${res.pct}%</span>`
            : `<span class="dossier-item-status dossier-item-status-new">→</span>`;
          return `
            <div class="${cls.join(' ')}" data-scene-id="${escapeHTML(s.id)}" role="button" tabindex="0"
                 title="${escapeHTML(s.title)}">
              <span class="dossier-item-icon">${s.icon || '📌'}</span>
              <span class="dossier-item-title">${escapeHTML(s.title)}</span>
              <span class="dossier-item-diff dossier-item-diff-${s.difficulty || 'medium'}">${DIFF_SHORT[s.difficulty] || '?'}</span>
              ${statusHTML}
            </div>
          `;
        }).join('');
        return `
          <div class="dossier-event${isMulti ? ' dossier-event-multi' : ''}">
            ${ev !== '—' ? `<div class="dossier-event-label">${escapeHTML(ev)}${isMulti ? ` · ${sceneList.length} scènes` : ''}</div>` : ''}
            <div class="dossier-items">${itemsHTML}</div>
          </div>
        `;
      }).join('');

      const yearLabel = year === null ? 'Sans date narrative' : year;
      return `
        <div class="dossier-year">
          <div class="dossier-year-label">${escapeHTML(String(yearLabel))}</div>
          ${eventsHTML}
        </div>
      `;
    }).join('');

    return `
      <section class="dossier-group${isOpen ? ' open' : ''}" data-group="${escapeHTML(groupName)}">
        <header class="dossier-group-header" data-toggle-group="${escapeHTML(groupName)}" role="button" tabindex="0">
          <h3 class="dossier-group-title">${escapeHTML(groupName)}</h3>
          <span class="dossier-group-progress">
            <span class="dossier-group-bar"><span class="dossier-group-bar-fill" style="width:${pct}%"></span></span>
            <span class="dossier-group-count">${done}/${total}</span>
          </span>
          <span class="dossier-group-chevron">▼</span>
        </header>
        <div class="dossier-group-body">
          ${yearsHTML}
        </div>
      </section>
    `;
  }

  function renderDossiers() {
    const container = document.getElementById('dossiers-container');
    if (!container || !_chronology) return;

    const results = getResults();
    const allScenes = _chronology.scenes || [];
    const groupsOrder = _chronology.groups_order || [];
    const sagas = _chronology.sagas || [];

    // v2.97 — Application des filtres unifiés
    const scenes = allScenes.filter(s => matchesFilters(s.id, results));
    const filterIsActive = (_activeBranch !== 'all') || (_activeStatus !== 'all');

    // Sous-titre récapitulatif (reflète le filtre actif)
    const subtitle = document.getElementById('dossiers-subtitle');
    if (subtitle) {
      const doneCount = scenes.filter(s => results[s.id]).length;
      const baseText = `${scenes.length} scènes · ${sagas.length} affaires multi-actes · ${doneCount} jouées`;
      subtitle.textContent = filterIsActive
        ? `${baseText} · filtres actifs (${allScenes.length - scenes.length} masquées)`
        : baseText;
    }

    // Index par id pour les sagas (titre, icône)
    const sceneIndex = {};
    allScenes.forEach(s => { sceneIndex[s.id] = s; });

    // ─── Barre de filtres (v2.97 — toujours visible en haut) ───
    const filterBarHTML = renderFilterBar(allScenes, scenes);

    // ─── Sagas en tête (toujours montrer, mais sur scènes filtrées) ───
    // Pour les sagas, on ne masque PAS les actes filtrés (sinon la
    // narration perd son sens) — on indique juste lesquels matchent.
    const sagasHTML = sagas.length > 0 ? `
      <div class="dossiers-section dossiers-section-sagas">
        <header class="dossiers-section-header">
          <h3>🎬 Affaires multi-actes</h3>
          <p>Trois affaires racontent leur enquête sur plusieurs scènes liées. Chaque acte
             approfondit l'instruction — du premier appel jusqu'à l'audience.</p>
        </header>
        <div class="saga-grid">
          ${sagas.map(s => renderSagaCard(s, results, sceneIndex)).join('')}
        </div>
      </div>
    ` : '';

    // ─── Groupes (filtrés) ───
    const scenesByGroup = new Map();
    scenes.forEach(s => {
      const g = s.group || '🛠️ MÉTHODOLOGIE';
      if (!scenesByGroup.has(g)) scenesByGroup.set(g, []);
      scenesByGroup.get(g).push(s);
    });

    const groupsHTML = groupsOrder.map(g => {
      const list = scenesByGroup.get(g) || [];
      if (list.length === 0) return '';
      return renderGroupSection(g, list, results);
    }).join('');

    // Etat "aucun résultat" si filtre vide
    const emptyHTML = (scenes.length === 0 && filterIsActive) ? `
      <div class="dossiers-empty">
        <div class="dossiers-empty-icon">🔍</div>
        <div class="dossiers-empty-title">Aucune scène ne correspond</div>
        <div class="dossiers-empty-sub">Essaye d'élargir un filtre ou clique sur "Toutes" / "Tous statuts" pour réinitialiser.</div>
      </div>
    ` : '';

    container.innerHTML = `
      ${filterBarHTML}
      ${sagasHTML}
      <div class="dossiers-section dossiers-section-groups">
        <header class="dossiers-section-header">
          <h3>📁 Tous les dossiers par groupe</h3>
          <p>Quatre catégories narratives. Clique sur un en-tête pour replier/déplier.</p>
        </header>
        ${groupsHTML}
        ${emptyHTML}
      </div>
    `;

    // ─── Bindings événements (délégation) ───
    container.addEventListener('click', onContainerClick);
    container.addEventListener('keydown', onContainerKey);
  }

  function renderFilterBar(allScenes, filteredScenes) {
    // Compte par branche : combien de scènes matchent chaque branche
    // (utile pour afficher le count à côté du label)
    const branchCounts = {};
    BRANCH_FILTERS.forEach(b => {
      branchCounts[b.id] = allScenes.filter(s => matchesBranch(s.id, b.id)).length;
    });

    const branchesHTML = BRANCH_FILTERS.map(b => {
      const active = b.id === _activeBranch ? ' active' : '';
      const cnt = branchCounts[b.id];
      return `
        <button class="dossiers-filter-chip${active}" data-filter-branch="${b.id}">
          <span class="dossiers-filter-icon">${b.icon}</span>
          <span>${escapeHTML(b.label)}</span>
          <span class="dossiers-filter-count">${cnt}</span>
        </button>
      `;
    }).join('');

    const statusHTML = STATUS_FILTERS.map(s => {
      const active = s.id === _activeStatus ? ' active' : '';
      return `<button class="dossiers-filter-chip dossiers-filter-status${active}" data-filter-status="${s.id}">${escapeHTML(s.label)}</button>`;
    }).join('');

    return `
      <div class="dossiers-filter-bar">
        <div class="dossiers-filter-row">
          <span class="dossiers-filter-label">Compétence</span>
          <div class="dossiers-filter-chips">${branchesHTML}</div>
        </div>
        <div class="dossiers-filter-row">
          <span class="dossiers-filter-label">Statut</span>
          <div class="dossiers-filter-chips">${statusHTML}</div>
        </div>
      </div>
    `;
  }

  function onContainerClick(e) {
    // v2.97 — Filter chips (branche / statut)
    const branchChip = e.target.closest('[data-filter-branch]');
    if (branchChip) {
      _activeBranch = branchChip.dataset.filterBranch;
      persistFilters();
      renderDossiers();
      return;
    }
    const statusChip = e.target.closest('[data-filter-status]');
    if (statusChip) {
      _activeStatus = statusChip.dataset.filterStatus;
      persistFilters();
      renderDossiers();
      return;
    }
    // Toggle group
    const groupHeader = e.target.closest('[data-toggle-group]');
    if (groupHeader) {
      const name = groupHeader.dataset.toggleGroup;
      const section = groupHeader.closest('.dossier-group');
      if (!section) return;
      const isOpen = section.classList.toggle('open');
      const set = getOpenGroups();
      if (isOpen) set.add(name); else set.delete(name);
      persistOpenGroups();
      return;
    }
    // Saga continue button (avant le click sur acte)
    const continueBtn = e.target.closest('.saga-continue-btn');
    if (continueBtn) {
      e.preventDefault();
      launchScene(continueBtn.dataset.sceneId);
      return;
    }
    // Click sur acte ou item
    const clickable = e.target.closest('[data-scene-id]');
    if (clickable) {
      launchScene(clickable.dataset.sceneId);
    }
  }

  function onContainerKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target.closest('[data-scene-id], [data-toggle-group]');
    if (!target) return;
    e.preventDefault();
    target.click();
  }

  function launchScene(sceneId) {
    if (!sceneId) return;

    // v2.99 — FIX : utiliser l'API officielle loadFullScene qui :
    //   1. cherche dans le cache LRU
    //   2. cherche dans SCENES global (l'index chargé)
    //   3. fetch le fichier complet si rien d'autre n'a marché
    // C'est plus robuste que SCENES.find() qui échouait quand l'utilisateur
    // cliquait avant que loadSceneIndex() ait rempli SCENES.
    if (typeof window.loadFullScene === 'function' && typeof window.startScene === 'function') {
      window.loadFullScene(sceneId)
        .then(window.startScene)
        .catch(err => {
          console.error('[dossiers] loadFullScene failed for', sceneId, err);
          // v3.0 — Différencier le cache SW périmé d'une vraie scène manquante
          if (err && err.code === 'SW_OFFLINE') {
            if (typeof window.showToast === 'function') {
              window.showToast('⚠ Cache navigateur périmé. Rechargez la page (Ctrl+Shift+R) pour mettre à jour.');
            } else {
              alert('Cache navigateur périmé.\n\nFais un rechargement complet (Ctrl+Shift+R sur PC, Cmd+Shift+R sur Mac) pour que les nouvelles scènes soient disponibles.');
            }
          } else if (err && err.code === 'NOT_FOUND') {
            if (typeof window.showToast === 'function') {
              window.showToast('⚠ Scène introuvable côté serveur : ' + sceneId);
            }
          } else {
            if (typeof window.showToast === 'function') {
              window.showToast('⚠ Erreur de chargement : ' + (err.message || err));
            }
          }
        });
      return;
    }

    // Fallback hérité : chercher dans SCENES + hydrateScene
    const scene = Array.isArray(window.SCENES)
      ? window.SCENES.find(s => s && s.id === sceneId)
      : null;
    if (!scene) {
      console.warn('[dossiers] scène introuvable dans SCENES :', sceneId,
                   '— SCENES.length =', (window.SCENES || []).length);
      if (typeof window.showToast === 'function') {
        window.showToast('⚠ Scène introuvable — recharge la page');
      }
      return;
    }
    if (typeof window.hydrateScene === 'function' && typeof window.startScene === 'function') {
      window.hydrateScene(scene)
        .then(window.startScene)
        .catch(err => {
          console.error('[dossiers] launch failed:', err);
          if (typeof window.showToast === 'function') {
            window.showToast('⚠ Impossible de charger la scène');
          }
        });
    } else {
      console.warn('[dossiers] hydrateScene/startScene non disponibles — fallback redirect');
      window.location.hash = '#scene=' + encodeURIComponent(sceneId);
    }
  }

  // ─── API publique ───────────────────────────────────────────────
  function openDossiers() {
    injectScreen(); // idempotent
    showScreenFallback('dossiers');

    // S'assurer que SCENES est chargé (pour pouvoir lancer une scène)
    const sceneIndexReady = (typeof window.loadSceneIndex === 'function')
      ? window.loadSceneIndex()
      : Promise.resolve();

    Promise.all([loadChronology(), sceneIndexReady])
      .then(() => renderDossiers())
      .catch(err => {
        console.error('[dossiers] init failed:', err);
        const c = document.getElementById('dossiers-container');
        if (c) c.innerHTML = `<div class="dossiers-error">⚠ Impossible de charger les dossiers : ${escapeHTML(err.message || err)}</div>`;
      });
  }

  // Re-render après chaque retour au lobby (pour refléter complétions)
  function rerenderIfVisible() {
    const screen = document.getElementById('screen-dossiers');
    if (screen && screen.classList.contains('active') && _chronology) {
      renderDossiers();
    }
  }

  window.CasInDossiers = {
    open: openDossiers,
    rerender: rerenderIfVisible,
  };

  // ─── Boot ───────────────────────────────────────────────────────
  function boot() {
    loadFilters();
    injectButton();
    // Écoute le retour au lobby pour ré-afficher si visible
    window.addEventListener('hashchange', rerenderIfVisible);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Retry d'injection du bouton si controls-strip arrive après nous
  setTimeout(injectButton, 200);
  setTimeout(injectButton, 800);

  console.log('[dossiers] v2.93 loaded');
})();
