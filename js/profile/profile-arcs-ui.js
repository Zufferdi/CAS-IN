// ═══════════════════════════════════════════════════════════════
// profile-arcs-ui.js — UI Arcs narratifs PNJ (v2.52)
//
// Rendu de la section "Arcs narratifs" dans profile.html. Affiche
// pour chaque arc PNJ :
//   - icône + titre + sous-titre + description courte
//   - barre de progression (X / N stages)
//   - liste des stages (complétés ✅ / restants ⏳) avec leur scène,
//     année narrative, role_state, narrative_key
//   - badge "Arc complété" si tous les stages sont validés
//
// Source des données : window.NpcArcs (cas-in-arcs.js, v2.51)
// Source de progression : scene_results dans localStorage
//
// Hooks :
//   - À DOMContentLoaded : NpcArcs.load() puis render()
//   - À 'profile-changed' : re-render (en cas d'unlock pendant la session)
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  let _renderedOnce = false;

  // ── Rendu d'un stage ──
  function renderStage(stage, isCompleted, sceneTitle) {
    const statusIcon = isCompleted ? '✅' : '⏳';
    const statusClass = isCompleted ? 'is-completed' : 'is-pending';
    const yearStr = stage.year ? String(stage.year) : '';
    const roleState = stage.role_state || '';
    const narrative = stage.narrative_key || '';

    return `
      <li class="arc-stage ${statusClass}">
        <div class="arc-stage-header">
          <span class="arc-stage-status">${statusIcon}</span>
          <span class="arc-stage-year">${yearStr}</span>
          <span class="arc-stage-scene">${sceneTitle || stage.scene_id}</span>
        </div>
        <div class="arc-stage-body">
          <span class="arc-stage-role">${roleState}</span>
          <span class="arc-stage-sep">·</span>
          <span class="arc-stage-narrative">${narrative}</span>
        </div>
      </li>
    `;
  }

  // ── Rendu d'un arc complet ──
  function renderArc(arc, sceneTitleMap) {
    const prog = arc.progress || { current: 0, target: arc.stages.length };
    const pct = prog.target > 0 ? Math.round((prog.current / prog.target) * 100) : 0;
    const isComplete = prog.current >= prog.target && prog.target > 0;

    const arcClass = 'arc-card' + (isComplete ? ' arc-card--complete' : '');
    const stagesHtml = arc.stages.map(stage => {
      const completed = (prog.completedSceneIds || []).includes(stage.scene_id);
      const sceneTitle = sceneTitleMap[stage.scene_id] || stage.scene_id;
      return renderStage(stage, completed, sceneTitle);
    }).join('');

    const completionBanner = isComplete
      ? `<div class="arc-completion-banner">${arc.completionBadge || '✅ Arc complété'}</div>`
      : '';

    return `
      <article class="${arcClass}" data-arc="${arc.npcId}">
        <header class="arc-card-header">
          <div class="arc-icon">${arc.icon || '👤'}</div>
          <div class="arc-titles">
            <h3 class="arc-title">${arc.title || 'Arc sans titre'}</h3>
            <p class="arc-subtitle">${arc.subtitle || ''}</p>
          </div>
        </header>

        <p class="arc-description">${arc.description || ''}</p>

        <div class="arc-progress">
          <div class="arc-progress-label">
            <span>${prog.current}/${prog.target} stages</span>
            <span>${pct}%</span>
          </div>
          <div class="arc-progress-bar">
            <div class="arc-progress-fill" style="width: ${pct}%"></div>
          </div>
        </div>

        ${completionBanner}

        <details class="arc-stages-details">
          <summary>Voir les ${arc.stages.length} stages</summary>
          <ol class="arc-stages-list">
            ${stagesHtml}
          </ol>
        </details>
      </article>
    `;
  }

  // ── Construction du mapping sceneId → titre humain ──
  function buildSceneTitleMap() {
    const map = {};
    if (typeof window.SCENES === 'object' && Array.isArray(window.SCENES)) {
      window.SCENES.forEach(s => {
        if (s && s.id && s.title) map[s.id] = s.title;
      });
    }
    return map;
  }

  // ── Rendu principal ──
  async function render() {
    const container = document.getElementById('profile-npc-arcs');
    const counter = document.getElementById('profile-arcs-count');
    if (!container) return;

    if (!window.NpcArcs) {
      container.innerHTML = '<div class="profile-empty">Module arcs PNJ non chargé.</div>';
      return;
    }

    try {
      await window.NpcArcs.load();
    } catch (_) {}

    const arcs = window.NpcArcs.getAllArcs();
    if (!arcs || arcs.length === 0) {
      container.innerHTML = '<div class="profile-empty">Aucun arc narratif disponible.</div>';
      return;
    }

    // Trigger evalAndUnlock une fois (catch-up)
    try { window.NpcArcs.evalAndUnlock(); } catch (_) {}

    const sceneTitleMap = buildSceneTitleMap();
    const completedArcs = arcs.filter(a => a.progress && a.progress.current >= a.progress.target && a.progress.target > 0);

    // Mise à jour compteur
    if (counter) counter.textContent = `${completedArcs.length}/${arcs.length}`;

    // Tri : arcs en cours (current > 0 mais < target) en haut, puis non-démarrés, puis complétés
    arcs.sort((a, b) => {
      const aProg = a.progress || { current: 0, target: a.stages.length };
      const bProg = b.progress || { current: 0, target: b.stages.length };
      const aActive = aProg.current > 0 && aProg.current < aProg.target;
      const bActive = bProg.current > 0 && bProg.current < bProg.target;
      const aComplete = aProg.current >= aProg.target && aProg.target > 0;
      const bComplete = bProg.current >= bProg.target && bProg.target > 0;

      // Actifs en premier
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      // Puis pas démarrés (pas complétés)
      if (!aComplete && bComplete) return -1;
      if (aComplete && !bComplete) return 1;
      // Sinon par titre
      return (a.title || '').localeCompare(b.title || '');
    });

    container.innerHTML = arcs.map(arc => renderArc(arc, sceneTitleMap)).join('');
    _renderedOnce = true;
  }

  // ── Auto-init ──
  function init() {
    // Attendre que NpcArcs soit dispo (max 5s)
    let retries = 0;
    function tryRender() {
      if (window.NpcArcs && typeof window.NpcArcs.load === 'function') {
        render();
        return;
      }
      if (retries++ < 25) setTimeout(tryRender, 200);
    }
    tryRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render sur profile-changed
  window.addEventListener('profile-changed', () => {
    if (_renderedOnce) render();
  });

  // Expose pour debug
  window.ProfileArcsUI = { render };
})();
