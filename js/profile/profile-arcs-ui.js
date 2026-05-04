// ═══════════════════════════════════════════════════════════════
// profile-arcs-ui.js — UI Arcs narratifs PNJ (v2.54 polish)
//
// Évolution v2.54 par rapport à v2.52 :
//   • Filtres : Tous / En cours / Complétés / À découvrir (boutons toolbar)
//   • Animations : fade-in à l'apparition, transition au changement filtre
//   • Stages cliquables : clic sur une scène redirige vers le lobby
//   • Compteur enrichi : "X complétés / Y en cours / Z arcs"
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  let _renderedOnce = false;
  let _currentFilter = 'all'; // 'all' | 'active' | 'completed' | 'untouched'

  function categorize(arc) {
    const prog = arc.progress || { current: 0, target: arc.stages.length };
    if (prog.target === 0) return 'untouched';
    if (prog.current >= prog.target) return 'completed';
    if (prog.current > 0) return 'active';
    return 'untouched';
  }

  function renderStage(stage, isCompleted, sceneTitle) {
    const statusIcon = isCompleted ? '✅' : '⏳';
    const statusClass = isCompleted ? 'is-completed' : 'is-pending';
    const yearStr = stage.year ? String(stage.year) : '';
    const roleState = stage.role_state || '';
    const narrative = stage.narrative_key || '';
    const sceneId = stage.scene_id;

    return `
      <li class="arc-stage ${statusClass}" data-scene-id="${sceneId}" tabindex="0" role="button"
          onclick="window.ProfileArcsUI.openScene('${sceneId}')"
          onkeypress="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.ProfileArcsUI.openScene('${sceneId}')}">
        <div class="arc-stage-header">
          <span class="arc-stage-status">${statusIcon}</span>
          <span class="arc-stage-year">${yearStr}</span>
          <span class="arc-stage-scene">${sceneTitle || sceneId}</span>
          <span class="arc-stage-arrow" aria-hidden="true">→</span>
        </div>
        <div class="arc-stage-body">
          <span class="arc-stage-role">${roleState}</span>
          <span class="arc-stage-sep">·</span>
          <span class="arc-stage-narrative">${narrative}</span>
        </div>
      </li>
    `;
  }

  function renderArc(arc, sceneTitleMap) {
    const prog = arc.progress || { current: 0, target: arc.stages.length };
    const pct = prog.target > 0 ? Math.round((prog.current / prog.target) * 100) : 0;
    const isComplete = prog.current >= prog.target && prog.target > 0;
    const isActive = prog.current > 0 && prog.current < prog.target;

    let arcClass = 'arc-card';
    if (isComplete) arcClass += ' arc-card--complete';
    else if (isActive) arcClass += ' arc-card--active';
    else arcClass += ' arc-card--untouched';

    const stagesHtml = arc.stages.map(stage => {
      const completed = (prog.completedSceneIds || []).includes(stage.scene_id);
      const sceneTitle = sceneTitleMap[stage.scene_id] || stage.scene_id;
      return renderStage(stage, completed, sceneTitle);
    }).join('');

    const completionBanner = isComplete
      ? `<div class="arc-completion-banner">${arc.completionBadge || '✅ Arc complété'}</div>`
      : '';

    const stateLabel = isComplete ? 'Complété' : (isActive ? 'En cours' : 'À découvrir');
    const cat = categorize(arc);

    return `
      <article class="${arcClass}" data-arc="${arc.npcId}" data-state="${cat}">
        <header class="arc-card-header">
          <div class="arc-icon">${arc.icon || '👤'}</div>
          <div class="arc-titles">
            <h3 class="arc-title">${arc.title || 'Arc sans titre'}</h3>
            <p class="arc-subtitle">${arc.subtitle || ''}</p>
          </div>
          <span class="arc-state-pill arc-state-${cat}">${stateLabel}</span>
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

        <details class="arc-stages-details" ${isActive ? 'open' : ''}>
          <summary>Voir les ${arc.stages.length} stages</summary>
          <ol class="arc-stages-list">
            ${stagesHtml}
          </ol>
        </details>
      </article>
    `;
  }

  function renderFilterToolbar(stats) {
    return `
      <div class="arc-filter-toolbar" role="toolbar" aria-label="Filtres arcs">
        <button type="button" class="arc-filter-btn ${_currentFilter === 'all' ? 'is-active' : ''}"
                data-filter="all" onclick="window.ProfileArcsUI.setFilter('all')">
          Tous <span class="arc-filter-count">${stats.total}</span>
        </button>
        <button type="button" class="arc-filter-btn ${_currentFilter === 'active' ? 'is-active' : ''}"
                data-filter="active" onclick="window.ProfileArcsUI.setFilter('active')">
          En cours <span class="arc-filter-count">${stats.active}</span>
        </button>
        <button type="button" class="arc-filter-btn ${_currentFilter === 'completed' ? 'is-active' : ''}"
                data-filter="completed" onclick="window.ProfileArcsUI.setFilter('completed')">
          Complétés <span class="arc-filter-count">${stats.completed}</span>
        </button>
        <button type="button" class="arc-filter-btn ${_currentFilter === 'untouched' ? 'is-active' : ''}"
                data-filter="untouched" onclick="window.ProfileArcsUI.setFilter('untouched')">
          À découvrir <span class="arc-filter-count">${stats.untouched}</span>
        </button>
      </div>
    `;
  }

  function buildSceneTitleMap() {
    const map = {};
    if (typeof window.SCENES === 'object' && Array.isArray(window.SCENES)) {
      window.SCENES.forEach(s => {
        if (s && s.id && s.title) map[s.id] = s.title;
      });
    }
    return map;
  }

  function openScene(sceneId) {
    if (!sceneId) return;
    window.location.href = `index.html#scene-${sceneId}`;
  }

  function setFilter(filter) {
    _currentFilter = filter;
    render();
  }

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

    const allArcs = window.NpcArcs.getAllArcs();
    if (!allArcs || allArcs.length === 0) {
      container.innerHTML = '<div class="profile-empty">Aucun arc narratif disponible.</div>';
      return;
    }

    try { window.NpcArcs.evalAndUnlock(); } catch (_) {}

    const sceneTitleMap = buildSceneTitleMap();

    const stats = {
      total: allArcs.length,
      active: allArcs.filter(a => categorize(a) === 'active').length,
      completed: allArcs.filter(a => categorize(a) === 'completed').length,
      untouched: allArcs.filter(a => categorize(a) === 'untouched').length,
    };

    if (counter) counter.textContent = `${stats.completed}/${stats.total}`;

    let filtered = allArcs;
    if (_currentFilter !== 'all') {
      filtered = allArcs.filter(a => categorize(a) === _currentFilter);
    }

    filtered.sort((a, b) => {
      const ca = categorize(a), cb = categorize(b);
      const order = { active: 0, untouched: 1, completed: 2 };
      const oa = order[ca] ?? 99, ob = order[cb] ?? 99;
      if (oa !== ob) return oa - ob;
      if (ca === 'active') {
        const pa = a.progress.current / a.progress.target;
        const pb = b.progress.current / b.progress.target;
        if (pa !== pb) return pb - pa;
      }
      return (a.title || '').localeCompare(b.title || '');
    });

    const toolbarHtml = renderFilterToolbar(stats);
    const cardsHtml = filtered.length
      ? `<div class="arc-cards-grid">${filtered.map(arc => renderArc(arc, sceneTitleMap)).join('')}</div>`
      : `<div class="profile-empty arc-empty-filter">Aucun arc dans cette catégorie.</div>`;

    container.innerHTML = toolbarHtml + cardsHtml;

    requestAnimationFrame(() => {
      container.querySelectorAll('.arc-card').forEach((el, i) => {
        el.style.animationDelay = (i * 50) + 'ms';
      });
    });

    _renderedOnce = true;
  }

  function init() {
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

  window.addEventListener('profile-changed', () => {
    if (_renderedOnce) render();
  });

  window.ProfileArcsUI = { render, setFilter, openScene };
})();
