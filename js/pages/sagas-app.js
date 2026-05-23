/**
 * sagas-app.js — Page Sagas (Axe 3 UX, v86)
 *
 * Charge data/campaigns.json, filtre les sagas (id commençant par 'saga-'),
 * calcule la progression de chacune en lisant scene_results dans localStorage,
 * et rend une mosaïque interactive avec filtres par niveau.
 *
 * Seuil de complétion d'une scène : pct >= 60 (cohérent avec cas-in-arcs.js).
 *
 * v1.0 — 2026-05-23
 */
(function () {
  'use strict';

  const STAGE_THRESHOLD = 60;

  // Couleurs par niveau de saga.
  // Système saga : stagiaire < inspecteur < enqueteur < expert
  // Alias easy/medium/hard/expert acceptés en fallback.
  const LEVEL_COLORS = {
    stagiaire:  '#30e88a',  // vert
    inspecteur: '#f0c040',  // or
    enqueteur:  '#ff4060',  // rouge
    expert:     '#c97df5',  // violet
    // alias génériques (sûreté)
    easy:       '#30e88a',
    medium:     '#f0c040',
    hard:       '#ff4060'
  };

  // Labels FR pour affichage des chips
  const LEVEL_LABELS = {
    stagiaire:  'Stagiaire',
    inspecteur: 'Inspecteur',
    enqueteur:  'Enquêteur',
    expert:     'Expert'
  };

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

  // ─── Calcul progression d'une saga ───
  function getSagaProgress(saga, results) {
    const scenes = saga.scenes || [];
    const completedIds = [];
    let totalPct = 0;
    let scenesWithScore = 0;

    scenes.forEach(sid => {
      const r = results[sid];
      if (r && typeof r.pct === 'number') {
        scenesWithScore++;
        totalPct += r.pct;
        if (r.pct >= STAGE_THRESHOLD) {
          completedIds.push(sid);
        }
      }
    });

    const total = scenes.length;
    const completed = completedIds.length;
    const pctCatalog = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgPct = scenesWithScore > 0 ? Math.round(totalPct / scenesWithScore) : 0;

    // Première scène non complétée → "Reprendre"
    const nextSceneId = scenes.find(sid => !completedIds.includes(sid));
    const isCompleted = completed === total && total > 0;

    return {
      total,
      completed,
      pctCatalog,
      avgPct,
      isCompleted,
      nextSceneId: nextSceneId || scenes[0] || null
    };
  }

  // ─── Rendu d'une carte saga ───
  function renderCard(saga, progress) {
    const level = saga.level || 'medium';
    const color = LEVEL_COLORS[level] || LEVEL_COLORS.medium;
    const cta = progress.completed === 0
      ? 'Démarrer'
      : (progress.isCompleted ? 'Revoir' : 'Reprendre');
    const href = progress.nextSceneId
      ? `scene.html?scene=${encodeURIComponent(progress.nextSceneId)}`
      : 'scene.html#campaigns';

    const completedCls = progress.isCompleted ? ' completed' : '';

    return `
      <a href="${href}" class="sg-card${completedCls}" style="--sg-color: ${color}" data-saga="${escapeHtml(saga.id)}" data-level="${level}">
        <div class="sg-card-head">
          <div class="sg-card-icon">${escapeHtml(saga.icon || '📖')}</div>
          <div class="sg-card-titles">
            <h3 class="sg-card-title">${escapeHtml(saga.title || saga.id)}</h3>
            <div class="sg-card-sub">${escapeHtml(saga.subtitle || '')}</div>
          </div>
          <span class="sg-card-level" data-level="${level}">${escapeHtml(level)}</span>
        </div>
        ${saga.description ? `<p class="sg-card-desc">${escapeHtml(saga.description)}</p>` : ''}
        <div class="sg-card-progress">
          <div class="sg-card-prog-line">
            <span class="sg-card-prog-num">${progress.completed} / ${progress.total} scènes</span>
            <span class="sg-card-prog-pct">${progress.pctCatalog}%${progress.avgPct ? ' · moy. ' + progress.avgPct + '%' : ''}</span>
          </div>
          <div class="sg-card-bar"><div class="sg-card-bar-fill" style="width: ${progress.pctCatalog}%"></div></div>
        </div>
        <div class="sg-card-cta">
          <span>${progress.isCompleted ? '🏆 Saga complète' : ''}</span>
          <span class="sg-card-cta-act">${cta} →</span>
        </div>
      </a>
    `;
  }

  // ─── Update summary numbers ───
  function updateSummary(sagas, progressMap) {
    const totalScenes = sagas.reduce((sum, s) => sum + (s.scenes || []).length, 0);
    const totalCompleted = sagas.reduce((sum, s) => sum + progressMap[s.id].completed, 0);
    const sagasDone = sagas.filter(s => progressMap[s.id].isCompleted).length;

    document.getElementById('sg-total-sagas').textContent = sagas.length;
    document.getElementById('sg-total-scenes').textContent = totalScenes;
    document.getElementById('sg-completed-scenes').textContent = totalCompleted;
    document.getElementById('sg-completed-sagas').textContent = sagasDone;
  }

  // ─── Update level filter counts ───
  function updateLevelCounts(sagas) {
    const counts = { all: sagas.length, stagiaire: 0, inspecteur: 0, enqueteur: 0, expert: 0 };
    sagas.forEach(s => {
      const lvl = s.level || 'inspecteur';
      if (counts[lvl] !== undefined) counts[lvl]++;
    });
    Object.keys(counts).forEach(k => {
      const el = document.getElementById('sg-count-' + k);
      if (el) el.textContent = counts[k];
    });
  }

  // ─── Filtres ───
  let _activeFilter = 'all';
  function applyFilter(level) {
    _activeFilter = level;
    document.querySelectorAll('.sg-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.level === level);
    });
    document.querySelectorAll('.sg-card').forEach(card => {
      const match = level === 'all' || card.dataset.level === level;
      card.style.display = match ? '' : 'none';
    });
  }

  function attachFilterHandlers() {
    document.querySelectorAll('.sg-chip').forEach(chip => {
      chip.addEventListener('click', () => applyFilter(chip.dataset.level));
    });
  }

  // ─── Main ───
  async function init() {
    const grid = document.getElementById('sg-grid');
    if (!grid) return;

    let camp;
    try {
      camp = await fetch('data/campaigns.json').then(r => r.json());
    } catch (e) {
      console.warn('[sagas-app] failed to load campaigns.json', e);
      grid.innerHTML = `<div style="text-align:center;padding:30px;color:var(--dim);grid-column:1/-1">⚠ Impossible de charger les sagas. Réessayez en mode connecté.</div>`;
      return;
    }

    const campaigns = camp.campaigns || [];
    const sagas = campaigns
      .filter(c => c.id && c.id.startsWith('saga-'))
      .sort((a, b) => (a.order || 999) - (b.order || 999));

    const results = lsGet('scene_results', {}) || {};
    const progressMap = {};
    sagas.forEach(s => { progressMap[s.id] = getSagaProgress(s, results); });

    grid.innerHTML = sagas.map(s => renderCard(s, progressMap[s.id])).join('');

    updateSummary(sagas, progressMap);
    updateLevelCounts(sagas);
    attachFilterHandlers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
