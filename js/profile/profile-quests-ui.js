// ═══════════════════════════════════════════════════════════════
// profile-quests-ui.js — UI Quêtes journalières (v2.55, volet G)
//
// Affiche les 3 quêtes du jour avec progression, dans un encart dédié.
// Cible : page profil (section Quêtes) + page index (encart hub).
//
// Conteneurs ciblés :
//   <div id="profile-daily-quests"></div>     ← profile.html
//   <div id="hub-daily-quests"></div>         ← index.html (encart hub)
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function renderQuestCard(q) {
    const status = q.completed ? 'is-complete' : 'is-pending';
    const statusIcon = q.completed ? '✅' : '⏳';
    return `
      <article class="quest-card ${status}" data-quest-id="${q.id}">
        <div class="quest-icon">${q.icon}</div>
        <div class="quest-body">
          <div class="quest-header">
            <h4 class="quest-title">${q.title}</h4>
            <span class="quest-reward">+${q.reward} XP</span>
          </div>
          <p class="quest-desc">${q.desc}</p>
        </div>
        <div class="quest-status" aria-label="${q.completed ? 'Complétée' : 'En cours'}">${statusIcon}</div>
      </article>
    `;
  }

  function render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!window.Quests || typeof window.Quests.getToday !== 'function') {
      container.innerHTML = '<div class="profile-empty">Module Quêtes non chargé.</div>';
      return;
    }
    const state = window.Quests.getToday();
    const stats = window.Quests.getStats();

    if (!state.quests || state.quests.length === 0) {
      container.innerHTML = '<div class="profile-empty">Aucune quête disponible aujourd\'hui.</div>';
      return;
    }

    const headerHtml = `
      <div class="quests-header">
        <span class="quests-counter">${stats.completedToday}/${stats.totalToday} complétées</span>
        ${stats.totalRewardClaimed > 0
          ? `<span class="quests-claimed">+${stats.totalRewardClaimed} XP gagnés aujourd'hui</span>`
          : '<span class="quests-claimed quests-claimed--empty">0 XP gagnés</span>'}
      </div>
    `;
    const cardsHtml = state.quests.map(renderQuestCard).join('');
    container.innerHTML = headerHtml + `<div class="quests-list">${cardsHtml}</div>`;
  }

  function init() {
    render('profile-daily-quests');
    render('hub-daily-quests');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render quand des quêtes sont complétées
  window.addEventListener('quests-changed', init);

  // Re-render aussi sur profile-changed (XP gagné = potentiellement une quête débloquée)
  window.addEventListener('profile-changed', init);

  window.ProfileQuestsUI = { render, init };
})();
