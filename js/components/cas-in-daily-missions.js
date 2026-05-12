/* ═══════════════════════════════════════════════════════════════
 * cas-in-daily-missions.js — v3.2.4
 *
 * Bandeau "MISSIONS DU JOUR" pour l'accueil scène (Tableau des dossiers).
 *
 * Différent du `quest-banner.js` quiz :
 *   - Affiche les 3 quêtes du jour SIMULTANÉMENT (pas une à la fois)
 *   - Style "dossier d'enquête" pour rester cohérent avec le tableau
 *   - Auto-refresh quand l'événement 'quests-changed' est émis
 *
 * Le composant s'auto-installe juste après .user-briefing dans le
 * screen-campaigns (au-dessus des sections par niveau).
 *
 * Dépendances : window.Quests (déjà chargé via cas-in-quests.js)
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__casInDailyMissions) return;
  window.__casInDailyMissions = true;

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]
    ));
  }

  function getQuests() {
    if (!window.Quests || typeof window.Quests.getToday !== 'function') return null;
    try { return window.Quests.getToday(); } catch (_) { return null; }
  }

  function renderQuest(q) {
    const completed = !!q.completed;
    const cls = completed ? 'mission completed' : 'mission';
    const statusIcon = completed ? '✓' : '○';
    return `
      <div class="${cls}" data-quest-id="${escapeHTML(q.id)}">
        <div class="mission-icon">${escapeHTML(q.icon || '🎯')}</div>
        <div class="mission-body">
          <div class="mission-title">${escapeHTML(q.title)}</div>
          <div class="mission-desc">${escapeHTML(q.desc)}</div>
        </div>
        <div class="mission-reward">
          <div class="mission-reward-xp">+${q.reward}<span>XP</span></div>
          <div class="mission-status">${statusIcon}</div>
        </div>
      </div>
    `;
  }

  function renderBlock() {
    const state = getQuests();
    if (!state || !Array.isArray(state.quests) || state.quests.length === 0) return '';

    const totalReward = state.quests.reduce((a, q) => a + (q.reward || 0), 0);
    const claimedReward = state.quests.reduce(
      (a, q) => a + (q.completed ? (q.reward || 0) : 0), 0
    );
    const completedCount = state.quests.filter(q => q.completed).length;
    const totalCount = state.quests.length;
    const allDone = completedCount === totalCount;

    return `
      <div class="daily-missions ${allDone ? 'all-done' : ''}">
        <div class="daily-missions-head">
          <div class="daily-missions-title">
            <span class="daily-missions-tag">MISSIONS DU JOUR</span>
            <span class="daily-missions-meta">${completedCount}/${totalCount} terminées</span>
          </div>
          <div class="daily-missions-progress-bar">
            <div class="daily-missions-progress-fill" style="width:${totalCount ? Math.round(100 * completedCount / totalCount) : 0}%"></div>
          </div>
          <div class="daily-missions-xp-summary">
            ${claimedReward > 0 ? `<span class="xp-claimed">+${claimedReward} XP gagné</span> · ` : ''}
            <span class="xp-remaining">${totalReward - claimedReward} XP restant</span>
          </div>
        </div>
        <div class="daily-missions-list">
          ${state.quests.map(renderQuest).join('')}
        </div>
      </div>
    `;
  }

  function inject() {
    // S'installe seulement dans #screen-campaigns
    const screen = document.getElementById('screen-campaigns');
    if (!screen) return false;

    // Cherche l'élément user-briefing pour insérer juste après
    const userBriefing = screen.querySelector('.user-briefing');
    if (!userBriefing) return false;

    // Évite la double injection
    let existing = screen.querySelector('.daily-missions-wrapper');
    if (existing) existing.remove();

    const html = renderBlock();
    if (!html) return true; // pas de quêtes dispo, c'est OK on a essayé

    const wrapper = document.createElement('div');
    wrapper.className = 'daily-missions-wrapper';
    wrapper.innerHTML = html;
    userBriefing.parentNode.insertBefore(wrapper, userBriefing.nextSibling);
    return true;
  }

  function init() {
    // Tentative immédiate
    let tries = 0;
    const retry = setInterval(() => {
      tries++;
      const screen = document.getElementById('screen-campaigns');
      if (!screen) {
        if (tries > 30) clearInterval(retry);
        return;
      }
      // S'il n'y a pas encore de .user-briefing, c'est que le screen n'a pas
      // encore été rendu par scene-campaigns-v1.js. On retry.
      if (screen.querySelector('.user-briefing')) {
        inject();
        clearInterval(retry);
      } else if (tries > 30) {
        clearInterval(retry);
      }
    }, 150);

    // Réinjecter à chaque rendering du screen campaigns
    const screen = document.getElementById('screen-campaigns');
    if (screen) {
      const obs = new MutationObserver(() => {
        // Si user-briefing apparaît mais que daily-missions est absent
        if (screen.querySelector('.user-briefing') &&
            !screen.querySelector('.daily-missions-wrapper')) {
          inject();
        }
      });
      obs.observe(screen, { childList: true, subtree: true });
    }

    // Rafraîchir quand une quête est validée
    window.addEventListener('quests-changed', () => {
      setTimeout(inject, 100);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API publique
  window.CasInDailyMissions = {
    refresh: inject,
  };
})();
