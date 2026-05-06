/* ═══════════════════════════════════════════════════════════════
   hub-identity.js — v2.82
   
   Petite barre d'identité affichée en haut du hub.
   Lit Profile (ou localStorage en fallback) pour afficher
   pseudo, rang, XP, streak.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function lsGet(key, fb) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fb : JSON.parse(v);
    } catch { return fb; }
  }

  function fmtNum(n) {
    return (n || 0).toLocaleString('fr-CH').replace(/\u00A0/g, ' ');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function update() {
    const bar = document.getElementById('hub-identity-bar');
    if (!bar) return;

    let pseudo = 'Enquêteur';
    let rank = '—';
    let xp = 0;
    let streak = 0;

    if (window.Profile && typeof window.Profile.snapshot === 'function') {
      const snap = window.Profile.snapshot();
      pseudo = snap.agent?.name || pseudo;
      rank = snap.rank?.emoji
        ? snap.rank.emoji + ' ' + (snap.rank.name || '')
        : '—';
      xp = snap.xp || 0;
      streak = snap.streak?.current || 0;
    } else {
      pseudo = lsGet('casIn_agentPseudo', pseudo);
      xp = lsGet('xp', 0) || 0;
      streak = lsGet('dayStreak', 0) || 0;
    }

    const pseudoEl = document.getElementById('hub-identity-pseudo');
    const rankEl = document.getElementById('hub-identity-rank');
    const xpEl = document.getElementById('hub-identity-xp');
    const streakEl = document.getElementById('hub-identity-streak');

    if (pseudoEl) pseudoEl.textContent = pseudo;
    if (rankEl) rankEl.textContent = rank;
    if (xpEl) xpEl.textContent = fmtNum(xp) + ' XP';
    if (streakEl) streakEl.textContent = streak + 'j 🔥';
  }

  function init() {
    update();
    if (window.Profile && typeof window.Profile.onChange === 'function') {
      window.Profile.onChange(update);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
  } else {
    setTimeout(init, 50);
  }
})();
