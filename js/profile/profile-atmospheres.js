/**
 * profile-atmospheres.js — Panneau « Atmosphères visitées » (Niveau G — UX additionnelle)
 *
 * Calcule, pour chacune des 8 atmosphères narratives, la progression
 * de l'utilisateur :
 *   - nombre de scènes du catalogue dans cette atmosphère
 *   - nombre de scènes complétées (≥ seuil)
 *   - nombre de scènes excellentes (≥ 95%)
 *
 * Lit :
 *   - localStorage 'scene_results' : { sceneId: { pct, ... } }
 *   - scenes/index.json (via window.SceneIndex ou fetch)
 *   - data/atmospheres.json (métadonnées)
 *
 * Expose : window.ProfileAtmospheres.getSnapshot()
 * Rendu DOM : window.ProfileAtmospheres.renderInto(containerEl)
 *
 * v1.0 — 2026-05-23 (delta v93)
 */
(function () {
  'use strict';

  const COMPLETION_THRESHOLD = 70;
  const EXCELLENCE_THRESHOLD = 95;

  // i18n helper avec fallback FR
  function t(key, fb) {
    return (window.CASi18n && window.CASi18n.t) ? window.CASi18n.t(key, fb) : fb;
  }

  // ═══ Cache ═══
  let _sceneIndex = null;
  let _atmospheres = null;
  let _loadPromise = null;

  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  // ═══ Chargement données ═══
  function loadData() {
    if (_sceneIndex && _atmospheres) return Promise.resolve();
    if (_loadPromise) return _loadPromise;

    const pIndex = (window.SceneIndex && window.SceneIndex.getAll)
      ? Promise.resolve(window.SceneIndex.getAll())
      : fetch('scenes/index.json').then(r => r.json());

    const pAtmo = fetch('data/atmospheres.json').then(r => r.json());

    _loadPromise = Promise.all([pIndex, pAtmo]).then(([idx, atmoData]) => {
      _sceneIndex = idx;
      _atmospheres = atmoData.atmospheres || {};
    }).catch(err => {
      console.warn('[ProfileAtmospheres] load failed', err);
      _sceneIndex = _sceneIndex || [];
      _atmospheres = _atmospheres || {};
    });
    return _loadPromise;
  }

  // ═══ Snapshot ═══
  async function getSnapshot() {
    await loadData();
    const results = lsGet('scene_results', {}) || {};

    // 1) Catalogue par atmosphère
    const catalogByAtmo = {};
    const sceneAtmoById = {};
    _sceneIndex.forEach(s => {
      const atmo = s.atmosphere || 'investigation';
      catalogByAtmo[atmo] = (catalogByAtmo[atmo] || 0) + 1;
      sceneAtmoById[s.id] = atmo;
    });

    // 2) Compteurs joueur par atmosphère
    const stats = {};
    Object.entries(_atmospheres).forEach(([key, meta]) => {
      stats[key] = {
        ...meta,
        total: catalogByAtmo[key] || 0,
        completed: 0,
        excellent: 0,
        avgPct: 0,
        _sumPct: 0
      };
    });

    Object.entries(results).forEach(([sceneId, res]) => {
      if (!res || typeof res.pct !== 'number') return;
      const atmo = sceneAtmoById[sceneId];
      if (!atmo || !stats[atmo]) return;
      const pct = res.pct;
      if (pct >= COMPLETION_THRESHOLD) {
        stats[atmo].completed++;
        stats[atmo]._sumPct += pct;
      }
      if (pct >= EXCELLENCE_THRESHOLD) {
        stats[atmo].excellent++;
      }
    });

    // 3) Calculs dérivés
    const byAtmo = Object.values(stats).map(s => {
      s.avgPct = s.completed > 0 ? Math.round(s._sumPct / s.completed) : 0;
      s.pctCatalog = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      delete s._sumPct;
      return s;
    });

    // Tri par % catalogue décroissant, puis par completed
    byAtmo.sort((a, b) => b.pctCatalog - a.pctCatalog || b.completed - a.completed);

    const dominant = byAtmo.find(a => a.completed > 0) || null;

    return {
      byAtmo,
      dominant,
      totalCompleted: byAtmo.reduce((s, a) => s + a.completed, 0),
      totalCatalog: byAtmo.reduce((s, a) => s + a.total, 0),
      totalExcellent: byAtmo.reduce((s, a) => s + a.excellent, 0)
    };
  }

  // ═══ Rendu DOM ═══
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  async function renderInto(containerEl) {
    if (!containerEl) return;

    const snap = await getSnapshot();

    // Header
    let html = `
      <div class="atmo-panel">
        <div class="atmo-panel__head">
          <h3 class="atmo-panel__title">${t('atmospheres.panel_title', '🎭 Atmosphères visitées')}</h3>
          <div class="atmo-panel__summary">
            <span class="atmo-panel__total">${snap.totalCompleted}/${snap.totalCatalog} ${t('atmospheres.scenes_count_label', 'scènes')}</span>
            ${snap.dominant
              ? `<span class="atmo-panel__dominant">· ${t('atmospheres.dominant_prefix', 'dominante')} : ${snap.dominant.icon} ${escapeHtml(snap.dominant.label)}</span>`
              : ''}
          </div>
        </div>
        <div class="atmo-panel__grid">`;

    snap.byAtmo.forEach(a => {
      const pct = a.pctCatalog;
      const isUntouched = a.completed === 0;
      // v95 (I) — Label traduit si dispo, fallback sur a.label du JSON
      const labelI18n = t('atmospheres.' + a.key, a.label);
      html += `
        <div class="atmo-card${isUntouched ? ' atmo-card--untouched' : ''}"
             style="--atmo-color: ${a.color}"
             title="${escapeHtml(a.description)}">
          <div class="atmo-card__head">
            <span class="atmo-card__icon">${a.icon}</span>
            <span class="atmo-card__label">${escapeHtml(labelI18n)}</span>
          </div>
          <div class="atmo-card__progress">
            <div class="atmo-card__bar" style="width: ${pct}%"></div>
          </div>
          <div class="atmo-card__stats">
            <span class="atmo-card__count">${a.completed}/${a.total}</span>
            ${a.excellent > 0 ? `<span class="atmo-card__excellent">⭐ ${a.excellent}</span>` : ''}
            ${a.avgPct > 0 ? `<span class="atmo-card__avg">~${a.avgPct}%</span>` : ''}
          </div>
        </div>`;
    });

    html += `
        </div>
      </div>`;

    containerEl.innerHTML = html;
  }

  // ═══ API publique ═══
  window.ProfileAtmospheres = {
    getSnapshot,
    renderInto,
    COMPLETION_THRESHOLD,
    EXCELLENCE_THRESHOLD
  };

  // v95 (I) — re-render au changement de locale
  window.addEventListener('cas-locale-changed', function () {
    const host = document.getElementById('atmospheres-panel-host');
    if (host) renderInto(host).catch(() => {});
  });
})();
