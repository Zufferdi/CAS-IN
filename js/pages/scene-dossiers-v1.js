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
    const scenes = _chronology.scenes || [];
    const groupsOrder = _chronology.groups_order || [];
    const sagas = _chronology.sagas || [];

    // Sous-titre récapitulatif
    const subtitle = document.getElementById('dossiers-subtitle');
    if (subtitle) {
      const doneCount = scenes.filter(s => results[s.id]).length;
      subtitle.textContent = `${scenes.length} scènes · ${sagas.length} affaires multi-actes · ${doneCount} jouées`;
    }

    // Index par id pour les sagas (titre, icône)
    const sceneIndex = {};
    scenes.forEach(s => { sceneIndex[s.id] = s; });

    // ─── Sagas en tête ───
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

    // ─── Groupes ───
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

    container.innerHTML = `
      ${sagasHTML}
      <div class="dossiers-section dossiers-section-groups">
        <header class="dossiers-section-header">
          <h3>📁 Tous les dossiers par groupe</h3>
          <p>Quatre catégories narratives. Clique sur un en-tête pour replier/déplier.</p>
        </header>
        ${groupsHTML}
      </div>
    `;

    // ─── Bindings événements (délégation) ───
    container.addEventListener('click', onContainerClick);
    container.addEventListener('keydown', onContainerKey);
  }

  function onContainerClick(e) {
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
    // Cherche dans SCENES global
    const scene = Array.isArray(window.SCENES)
      ? window.SCENES.find(s => s && s.id === sceneId)
      : null;
    if (!scene) {
      console.warn('[dossiers] scène introuvable dans SCENES :', sceneId);
      // Fallback : déclenche un toast si dispo
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
      // Redirection avec hash pour reprise par scene-app.js
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
