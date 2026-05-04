// ═══════════════════════════════════════════════════════════════
// profile-leaderboard-ui.js — UI Leaderboard global (v2.55, volet G)
//
// Affiche dans la page profil :
//   - Top 5 personnel cross-scènes (meilleurs runs)
//   - Mastery par track (forensique, droit, windows, crypto, réseaux, outils, intl)
//   - Stats globales : X/Y scènes maîtrisées (≥80%)
//
// Conteneur ciblé : <div id="profile-leaderboard"></div> dans profile.html
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function diffLabel(d) {
    return ({ easy: 'Facile', medium: 'Moyen', hard: 'Difficile', expert: 'Expert' })[d] || d;
  }

  function renderTop5Row(run, idx) {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
    const modeBadge = run.mode === 'procureur'
      ? '<span class="lb-mode lb-mode-procureur">Procureur</span>'
      : '';
    return `
      <li class="lb-row" data-scene-id="${run.sceneId}" tabindex="0" role="button"
          onclick="window.ProfileLeaderboardUI.openScene('${run.sceneId}')"
          onkeypress="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.ProfileLeaderboardUI.openScene('${run.sceneId}')}">
        <span class="lb-rank">${medal}</span>
        <span class="lb-icon">${run.sceneIcon}</span>
        <span class="lb-scene">
          <span class="lb-scene-title">${run.sceneTitle}</span>
          <span class="lb-scene-meta">${diffLabel(run.difficulty)} · ${run.date}</span>
        </span>
        <span class="lb-pct" data-pct="${run.pct}">${run.pct}%</span>
        ${modeBadge}
      </li>
    `;
  }

  function renderMasteryTrack(name, m) {
    const pct = m.pct;
    return `
      <div class="mastery-track">
        <div class="mastery-track-header">
          <span class="mastery-track-name">${name}</span>
          <span class="mastery-track-count">${m.mastered}/${m.total}</span>
        </div>
        <div class="mastery-track-bar">
          <div class="mastery-track-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }

  function render() {
    const container = document.getElementById('profile-leaderboard');
    if (!container) return;
    if (!window.Leaderboard || typeof window.Leaderboard.getStats !== 'function') {
      container.innerHTML = '<div class="profile-empty">Module Leaderboard non chargé.</div>';
      return;
    }

    const data = window.Leaderboard.getStats();
    const top5 = data.top5 || [];
    const tracks = data.masteryByTrack || {};
    const stats = data.masteryStats || { mastered: 0, total: 0, pct: 0 };

    const topHtml = top5.length > 0
      ? `<ol class="lb-top5">${top5.map(renderTop5Row).join('')}</ol>`
      : '<div class="profile-empty">Aucun score enregistré pour le moment.</div>';

    const tracksHtml = `
      <div class="mastery-tracks">
        ${Object.entries(tracks).map(([name, m]) => renderMasteryTrack(name, m)).join('')}
      </div>
    `;

    container.innerHTML = `
      <div class="lb-stats-summary">
        <div class="lb-stat-pill">
          <span class="lb-stat-val">${stats.mastered}/${stats.total}</span>
          <span class="lb-stat-lbl">Scènes maîtrisées (≥${data.threshold}%)</span>
        </div>
        <div class="lb-stat-pill">
          <span class="lb-stat-val">${stats.pct}%</span>
          <span class="lb-stat-lbl">Taux de maîtrise</span>
        </div>
        <div class="lb-stat-pill">
          <span class="lb-stat-val">${stats.touched}</span>
          <span class="lb-stat-lbl">Scènes jouées</span>
        </div>
      </div>

      <h4 class="lb-section-title">🥇 Top 5 personnel</h4>
      ${topHtml}

      <h4 class="lb-section-title">📊 Maîtrise par thème</h4>
      ${tracksHtml}
    `;
  }

  function openScene(sceneId) {
    if (!sceneId) return;
    window.location.href = `index.html#scene-${sceneId}`;
  }

  function init() {
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('profile-changed', init);

  window.ProfileLeaderboardUI = { render, openScene };
})();
