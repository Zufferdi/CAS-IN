/**
 * profile-affinities.js — Affinités croisées Rôle × Atmosphère (Niveau G — UX additionnelle)
 *
 * Calcule, pour chaque couple (rôle, atmosphère), le nombre de scènes
 * du catalogue et le nombre de scènes complétées par l'utilisateur,
 * puis affiche un tableau croisé compact :
 *
 *                 Investigation  Legal  Network  Incident  …
 *   Police            12/18      4/8     2/4      0/3
 *   Procureur·e       3/9        9/14    1/2      0/0
 *   DFIR              8/15       2/4     6/9      4/7
 *   …
 *
 * Met en évidence :
 *   - Les "affinités" : couples avec >50% du catalogue complété (badge)
 *   - Les couples "vierges" (jamais touchés) en grisé
 *   - Le couple le plus poussé (mise en valeur)
 *
 * v1.0 — 2026-05-23 (delta v93, G2)
 */
(function () {
  'use strict';

  
  // v132g — Résolution path data/ correcte depuis n'importe quelle page
  // (fix régression v131c sur les fetches relatifs depuis pages/, fiches/, etc.)
  function _dataUrl(rel) {
    if (typeof window !== 'undefined' && window.CasInUtils && typeof window.CasInUtils.dataUrl === 'function') {
      return window.CasInUtils.dataUrl(rel);
    }
    const clean = String(rel || '').replace(/^\.?\/?(data\/)?/, '');
    const path = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '/';
    const m = path.match(/^(.*?\/CAS-IN\/|\/)(.*)$/);
    if (!m) return './data/' + clean;
    const slashCount = (m[2].match(/\//g) || []).length;
    const prefix = slashCount > 0 ? '../'.repeat(slashCount) : './';
    return prefix + 'data/' + clean;
  }

const COMPLETION_THRESHOLD = 70;
  const AFFINITY_PCT = 50;

  // i18n helper
  function t(key, fb) {
    return (window.CASi18n && window.CASi18n.t) ? window.CASi18n.t(key, fb) : fb;
  } // % de complétion pour décrocher le badge "affinité"

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

  function loadData() {
    if (_sceneIndex && _atmospheres) return Promise.resolve();
    if (_loadPromise) return _loadPromise;

    const pIndex = (window.SceneIndex && window.SceneIndex.getAll)
      ? Promise.resolve(window.SceneIndex.getAll())
      : fetch('scenes/index.json').then(r => r.json());

    const pAtmo = fetch(_dataUrl('atmospheres.json')).then(r => r.json());

    _loadPromise = Promise.all([pIndex, pAtmo]).then(([idx, atmoData]) => {
      _sceneIndex = idx;
      _atmospheres = atmoData.atmospheres || {};
    }).catch(err => {
      console.warn('[ProfileAffinities] load failed', err);
      _sceneIndex = _sceneIndex || [];
      _atmospheres = _atmospheres || {};
    });
    return _loadPromise;
  }

  function getRoles() {
    if (window.RoleCareers && window.RoleCareers.ROLES) {
      return window.RoleCareers.ROLES;
    }
    // Fallback minimal
    return {
      police:      { key: 'police',      label: 'Police',        icon: '🚔', color: '#00e5cc' },
      procureur:   { key: 'procureur',   label: 'Procureur·e',   icon: '⚖️', color: '#c97df5' },
      dfir:        { key: 'dfir',        label: 'DFIR',          icon: '🔬', color: '#30e88a' },
      journaliste: { key: 'journaliste', label: 'Journaliste',   icon: '📰', color: '#f0c040' },
      etat:        { key: 'etat',        label: 'État',          icon: '🏛️', color: '#6ab8ff' },
      soignant:    { key: 'soignant',    label: 'Soignant·e',    icon: '🏥', color: '#ff9f40' }
    };
  }

  // ═══ Snapshot ═══
  async function getSnapshot() {
    await loadData();
    const results = lsGet('scene_results', {}) || {};
    const ROLES = getRoles();

    // Matrice de comptages : matrix[role][atmo] = { total, completed }
    const matrix = {};
    Object.keys(ROLES).forEach(role => {
      matrix[role] = {};
      Object.keys(_atmospheres).forEach(atmo => {
        matrix[role][atmo] = { total: 0, completed: 0 };
      });
    });

    // Catalogue : compter total par (role, atmo)
    const sceneRoleAtmo = {};
    _sceneIndex.forEach(s => {
      const role = s.role;
      const atmo = s.atmosphere || 'investigation';
      if (!role || !ROLES[role]) return;
      if (!_atmospheres[atmo]) return;
      matrix[role][atmo].total++;
      sceneRoleAtmo[s.id] = { role, atmo };
    });

    // Compter complétions
    Object.entries(results).forEach(([sceneId, res]) => {
      if (!res || typeof res.pct !== 'number' || res.pct < COMPLETION_THRESHOLD) return;
      const ra = sceneRoleAtmo[sceneId];
      if (!ra) return;
      if (matrix[ra.role] && matrix[ra.role][ra.atmo]) {
        matrix[ra.role][ra.atmo].completed++;
      }
    });

    // Décerner les affinités (>50% du catalogue d'un couple)
    const affinities = [];
    Object.keys(ROLES).forEach(role => {
      Object.keys(_atmospheres).forEach(atmo => {
        const c = matrix[role][atmo];
        if (c.total >= 3 && c.completed > 0) {
          const pct = (c.completed / c.total) * 100;
          if (pct >= AFFINITY_PCT) {
            affinities.push({
              role,
              atmo,
              total: c.total,
              completed: c.completed,
              pct: Math.round(pct),
              roleMeta: ROLES[role],
              atmoMeta: _atmospheres[atmo]
            });
          }
        }
      });
    });
    affinities.sort((a, b) => b.pct - a.pct || b.completed - a.completed);

    return {
      matrix,
      affinities,
      roles: ROLES,
      atmospheres: _atmospheres
    };
  }

  // ═══ Rendu DOM ═══
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  async function renderInto(containerEl) {
    if (!containerEl) return;
    const snap = await getSnapshot();

    const roles = Object.values(snap.roles);
    const atmos = Object.values(snap.atmospheres);

    let html = `
      <div class="aff-panel">
        <div class="aff-panel__head">
          <h3 class="aff-panel__title">${t('affinities.panel_title', '🎯 Affinités croisées')}</h3>
          <div class="aff-panel__summary">
            ${snap.affinities.length > 0
              ? (snap.affinities.length === 1
                  ? t('affinities.decreed_singular', '1 affinité décernée')
                  : snap.affinities.length + ' ' + t('affinities.decreed_plural_suffix', 'affinités décernées'))
              : t('affinities.no_affinity_yet', 'Aucune affinité décernée — complète ≥50% d\'un couple rôle×atmosphère')}
          </div>
        </div>`;

    // Badges des affinités décrochées
    if (snap.affinities.length > 0) {
      html += `<div class="aff-badges">`;
      snap.affinities.slice(0, 8).forEach(a => {
        html += `
          <div class="aff-badge"
               style="--role-color: ${a.roleMeta.color}; --atmo-color: ${a.atmoMeta.color}"
               title="${a.completed}/${a.total} scènes ${a.roleMeta.label.toLowerCase()} × ${a.atmoMeta.label.toLowerCase()}">
            <span class="aff-badge__icons">${a.roleMeta.icon}${a.atmoMeta.icon}</span>
            <span class="aff-badge__labels">${escapeHtml(a.roleMeta.label)} × ${escapeHtml(a.atmoMeta.label)}</span>
            <span class="aff-badge__pct">${a.pct}%</span>
          </div>`;
      });
      html += `</div>`;
    }

    // Tableau croisé compact
    html += `
      <div class="aff-matrix-wrap">
        <table class="aff-matrix">
          <thead>
            <tr>
              <th class="aff-matrix__corner"></th>`;
    atmos.forEach(a => {
      html += `<th class="aff-matrix__atmo-th" title="${escapeHtml(a.label)}"><span>${a.icon}</span></th>`;
    });
    html += `
            </tr>
          </thead>
          <tbody>`;
    roles.forEach(r => {
      html += `<tr>
                 <th class="aff-matrix__role-th" style="--role-color: ${r.color}" title="${escapeHtml(r.label)}">
                   <span class="aff-matrix__role-icon">${r.icon}</span>
                   <span class="aff-matrix__role-label">${escapeHtml(r.label)}</span>
                 </th>`;
      atmos.forEach(a => {
        const cell = snap.matrix[r.key][a.key];
        if (cell.total === 0) {
          html += `<td class="aff-matrix__cell aff-matrix__cell--empty">—</td>`;
        } else {
          const pct = cell.total > 0 ? (cell.completed / cell.total) * 100 : 0;
          const isAffinity = cell.total >= 3 && pct >= AFFINITY_PCT;
          const isUntouched = cell.completed === 0;
          html += `<td class="aff-matrix__cell${isAffinity ? ' aff-matrix__cell--affinity' : ''}${isUntouched ? ' aff-matrix__cell--untouched' : ''}"
                       title="${escapeHtml(r.label)} × ${escapeHtml(a.label)} — ${cell.completed}/${cell.total}">
                     <span class="aff-matrix__count">${cell.completed}<span class="aff-matrix__sep">/</span>${cell.total}</span>
                   </td>`;
        }
      });
      html += `</tr>`;
    });
    html += `
          </tbody>
        </table>
      </div>
      </div>`;

    containerEl.innerHTML = html;
  }

  // ═══ API publique ═══
  window.ProfileAffinities = {
    getSnapshot,
    renderInto,
    COMPLETION_THRESHOLD,
    AFFINITY_PCT
  };

  // v95 (I) — re-render au changement de locale
  window.addEventListener('cas-locale-changed', function () {
    const host = document.getElementById('affinities-panel-host');
    if (host) renderInto(host).catch(() => {});
  });
})();
