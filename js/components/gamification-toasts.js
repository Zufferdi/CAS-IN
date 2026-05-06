/* ═══════════════════════════════════════════════════════════════
   gamification-toasts.js — v2.84
   
   Branche le système de célébrations + toasts XP en temps réel
   à partir des events Profile.onChange.
   
   Quand un achievement se débloque, le rang monte, ou XP est
   gagnée, l'utilisateur voit immédiatement le feedback visuel.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (window.__casInGamificationToasts) return;
  window.__casInGamificationToasts = true;

  // État pour détecter les changements
  let _lastXp = 0;
  let _lastAchievements = new Set();
  let _ready = false;
  let _xpToastTimer = null;
  let _xpAccumulated = 0;

  // ── Helpers ──
  function fmtNum(n) {
    return (n || 0).toLocaleString('fr-CH').replace(/\u00A0/g, ' ');
  }

  // ── Toast XP (cumulé sur 800ms pour éviter le spam) ──
  function showXpToast(xp) {
    if (!xp || xp <= 0) return;
    _xpAccumulated += xp;
    clearTimeout(_xpToastTimer);
    _xpToastTimer = setTimeout(() => {
      const total = _xpAccumulated;
      _xpAccumulated = 0;
      flashXpToast(total);
    }, 800);
  }

  function flashXpToast(amount) {
    if (!amount) return;
    let toastWrap = document.getElementById('gamification-xp-toasts');
    if (!toastWrap) {
      toastWrap = document.createElement('div');
      toastWrap.id = 'gamification-xp-toasts';
      document.body.appendChild(toastWrap);
    }
    const toast = document.createElement('div');
    toast.className = 'xp-toast';
    toast.innerHTML = `<span class="xp-toast-plus">+</span><span class="xp-toast-num">${fmtNum(amount)}</span><span class="xp-toast-label">XP</span>`;
    toastWrap.appendChild(toast);

    // Animation : entrée + remontée + fade
    requestAnimationFrame(() => {
      toast.classList.add('xp-toast--visible');
    });
    setTimeout(() => {
      toast.classList.add('xp-toast--rising');
    }, 800);
    setTimeout(() => toast.remove(), 2200);
  }

  // ── Achievement débloqué ──
  function celebrateAchievement(achId) {
    if (!window.AchievementsCore || !window.AchievementsCore.byId) return;
    const ach = window.AchievementsCore.byId(achId);
    if (!ach) return;

    if (window.Celebration && typeof window.Celebration.show === 'function') {
      window.Celebration.show({
        icon: ach.emoji || '🏆',
        title: 'Succès débloqué',
        subtitle: ach.name + (ach.desc ? ' · ' + ach.desc : ''),
      });
    } else {
      // Fallback toast léger
      flashGenericToast(`🏆 ${ach.emoji} ${ach.name}`);
    }
  }

  function flashGenericToast(text) {
    let wrap = document.getElementById('gamification-generic-toasts');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'gamification-generic-toasts';
      document.body.appendChild(wrap);
    }
    const toast = document.createElement('div');
    toast.className = 'gamif-toast';
    toast.textContent = text;
    wrap.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('gamif-toast--visible'));
    setTimeout(() => toast.classList.add('gamif-toast--leaving'), 2400);
    setTimeout(() => toast.remove(), 2900);
  }

  // ── Rank-up ──
  function celebrateRankUp() {
    if (!window.Profile || typeof window.Profile.snapshot !== 'function') return;
    const snap = window.Profile.snapshot();
    if (!snap.rank) return;
    if (window.Celebration && typeof window.Celebration.show === 'function') {
      window.Celebration.show({
        icon: snap.rank.emoji || '⭐',
        title: 'Promotion',
        subtitle: 'Vous êtes maintenant ' + (snap.rank.name || 'gradé'),
      });
    } else {
      flashGenericToast(`⭐ Promotion : ${snap.rank.emoji} ${snap.rank.name}`);
    }
  }

  // ── Hook Profile onChange ──
  function init() {
    if (!window.Profile || typeof window.Profile.snapshot !== 'function') {
      // Réessayer dans 500ms
      setTimeout(init, 500);
      return;
    }

    // État initial
    const snap = window.Profile.snapshot();
    _lastXp = snap.xp || 0;
    _lastAchievements = new Set(snap.achievements || []);
    _ready = true;

    // Hook onChange
    if (typeof window.Profile.onChange === 'function') {
      window.Profile.onChange(reason => {
        if (!_ready) return;

        try {
          const s = window.Profile.snapshot();

          // XP gain : compute delta
          const newXp = s.xp || 0;
          const delta = newXp - _lastXp;
          if (delta > 0 && reason !== 'storage') {
            showXpToast(delta);
          }
          _lastXp = newXp;

          // Achievement débloqué : nouveau dans la liste
          const currAch = new Set(s.achievements || []);
          currAch.forEach(id => {
            if (!_lastAchievements.has(id)) {
              celebrateAchievement(id);
            }
          });
          _lastAchievements = currAch;

          // Rank up
          if (reason === 'rank-up') {
            // Léger délai pour passer après le toast XP
            setTimeout(celebrateRankUp, 400);
          }
        } catch (_) {}
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }
})();
