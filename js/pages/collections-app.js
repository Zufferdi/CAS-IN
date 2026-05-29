/**
 * collections-app.js — Page Collections thématiques (v121a)
 *
 * Charge data/campaigns.json, filtre les campagnes avec kind='collection',
 * calcule la progression de chacune en lisant scene_results dans localStorage,
 * et rend une mosaïque interactive.
 *
 * Seuil de complétion d'une scène : pct >= 60 (cohérent avec sagas-app.js + cas-in-arcs.js).
 *
 * v1.0 — 2026-05-27 (v121a)
 */
(function () {
  'use strict';

  const STAGE_THRESHOLD = 60;

  // Palette de couleurs par "spécialité" implicite de la collection
  // (déterminée à partir de l'icône ou du titre)
  const COLLECTION_COLORS = {
    '💀': '#ff4060',      // Ransomwares
    '🖥️': '#7ec0ff',      // Windows & Mobile
    '🔑': '#f0c040',      // Cryptographie
    '🌐': '#30e88a',      // Réseau
    '🤝': '#c97df5',      // Coopération
    '⚖️': '#ff9f40',      // Droit
    '🤖': '#a78bfa',      // IA
    '⚠️': '#ff4060',      // Cybercriminalité
    '🕵️': '#6ab8ff',      // Sécurité État
    '📋': '#94a3b8',      // Quotidien
  };

  function t(key, fb) {
    return (window.CASi18n && window.CASi18n.t) ? window.CASi18n.t(key, fb) : fb;
  }

  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function getCollectionProgress(col, results) {
    const sceneIds = col.scenes || [];
    const total = sceneIds.length;
    if (total === 0) {
      return { completed: 0, total: 0, pctCatalog: 0, avgPct: 0, isCompleted: false, nextSceneId: null };
    }

    let completed = 0;
    let sumPct = 0;
    let countPct = 0;
    let nextSceneId = null;

    for (const sceneId of sceneIds) {
      const r = results[sceneId];
      if (r && typeof r.pct === 'number') {
        sumPct += r.pct;
        countPct += 1;
        if (r.pct >= STAGE_THRESHOLD) {
          completed += 1;
        } else if (!nextSceneId) {
          nextSceneId = sceneId;
        }
      } else if (!nextSceneId) {
        nextSceneId = sceneId;
      }
    }

    const pctCatalog = Math.round((completed / total) * 100);
    const avgPct = countPct > 0 ? Math.round(sumPct / countPct) : 0;
    const isCompleted = completed === total;

    if (!nextSceneId && sceneIds.length > 0) {
      nextSceneId = sceneIds[0];
    }

    return { completed, total, pctCatalog, avgPct, isCompleted, nextSceneId };
  }

  function renderCard(col, progress) {
    const icon = col.icon || '📚';
    const color = COLLECTION_COLORS[icon] || '#a78bfa';
    const level = col.level || 'enqueteur';
    const cta = progress.completed === 0
      ? t('collections_page.cta_start', 'Explorer')
      : (progress.isCompleted ? t('collections_page.cta_revisit', '🔄 Revisiter') : t('collections_page.cta_continue', 'Continuer'));

    const targetSceneId = progress.isCompleted
      ? (col.scenes && col.scenes[0]) || progress.nextSceneId
      : progress.nextSceneId;
    const href = targetSceneId
      ? `scene.html?scene=${encodeURIComponent(targetSceneId)}${progress.isCompleted ? '&revisit=1' : ''}`
      : 'scene.html';

    const completedCls = progress.isCompleted ? ' completed' : '';

    return `
      <a href="${href}" class="col-card${completedCls}" style="--col-color: ${color}" data-id="${escapeHtml(col.id)}">
        <div class="col-card-head">
          <div class="col-card-icon">${escapeHtml(icon)}</div>
          <div class="col-card-titles">
            <h3 class="col-card-title">${escapeHtml(col.title || col.id)}</h3>
            <div class="col-card-sub">${progress.total} ${t('collections_page.scenes_label', 'scènes thématiques')}</div>
          </div>
          <span class="col-card-level" data-level="${level}">${escapeHtml(LEVEL_LABELS[level] || level)}</span>
        </div>
        ${col.description ? `<p style="font-size:13px;color:var(--dim);margin:0;line-height:1.5">${escapeHtml(col.description)}</p>` : ''}
        <div class="col-card-progress">
          <div class="col-card-prog-line">
            <span>${progress.completed} / ${progress.total} scènes${progress.avgPct ? ' · moy. ' + progress.avgPct + '%' : ''}</span>
            <span>${progress.pctCatalog}%</span>
          </div>
          <div class="col-card-bar"><div class="col-card-bar-fill" style="width:${progress.pctCatalog}%"></div></div>
        </div>
        <div class="col-card-cta">${cta} →</div>
      </a>
    `;
  }

  const LEVEL_LABELS = {
    stagiaire: 'Stagiaire',
    inspecteur: 'Inspecteur',
    enqueteur: 'Enquêteur',
    expert: 'Expert'
  };

  function updateSummary(collections, progressMap) {
    const totalScenes = collections.reduce((sum, c) => sum + (c.scenes || []).length, 0);
    const totalCompleted = collections.reduce((sum, c) => sum + progressMap[c.id].completed, 0);
    const colsDone = collections.filter(c => progressMap[c.id].isCompleted).length;

    const elTotal = document.getElementById('col-total-collections');
    const elTotalScenes = document.getElementById('col-total-scenes');
    const elCompleted = document.getElementById('col-completed-scenes');
    const elDone = document.getElementById('col-completed-collections');

    if (elTotal) elTotal.textContent = collections.length;
    if (elTotalScenes) elTotalScenes.textContent = totalScenes;
    if (elCompleted) elCompleted.textContent = totalCompleted;
    if (elDone) elDone.textContent = colsDone;
  }

  async function init() {
    const grid = document.getElementById('col-grid');
    if (!grid) return;

    let camp;
    try {
      camp = await fetch('data/campaigns.json').then(r => r.json());
    } catch (e) {
      console.warn('[collections-app] failed to load campaigns.json', e);
      grid.innerHTML = `<div style="text-align:center;padding:30px;color:var(--dim);grid-column:1/-1">⚠ ${t('collections_page.load_error', 'Impossible de charger les collections. Réessayez en mode connecté.')}</div>`;
      return;
    }

    const campaigns = camp.campaigns || [];
    const collections = campaigns
      .filter(c => c.kind === 'collection')
      .sort((a, b) => {
        // Tri : d'abord celles déjà commencées, puis par taille décroissante
        const sa = (a.scenes || []).length;
        const sb = (b.scenes || []).length;
        return sb - sa;
      });

    const results = lsGet('scene_results', {}) || {};
    const progressMap = {};
    collections.forEach(c => { progressMap[c.id] = getCollectionProgress(c, results); });

    if (collections.length === 0) {
      grid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--dim);grid-column:1/-1">${t('collections_page.empty', 'Aucune collection disponible.')}</div>`;
      return;
    }

    grid.innerHTML = collections.map(c => renderCard(c, progressMap[c.id])).join('');
    updateSummary(collections, progressMap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render au changement de locale
  window.addEventListener('cas-locale-changed', function () {
    init();
  });
})();
