/* ============================================================
   CAS-IN · tp-profile-bridge.js (F2 + v3)
   Pas d'XP pour les TPs (choix utilisateur). Le bridge sert à :
     - marquer la dernière activité TP dans Profile
     - déclencher AchievementsCore.evalAndUnlock à chaque incrément
       de tp_solved (débloque les achievements TP/fiches centralisés)
   À charger AVANT tp-engine.js sur tp.html.
   ============================================================ */

(function () {
  'use strict';

  if (!window.Profile) {
    console.warn('[tp-profile-bridge] Profile pas chargé — skip');
    return;
  }

  if (window.__casInTpBridge) return;
  window.__casInTpBridge = true;

  const origSetItem = Storage.prototype.setItem.bind(localStorage);

  // Hook léger : quand 'tp_solved' s'incrémente, on note l'activité et
  // on déclenche l'évaluation des achievements transversaux.
  let _lastTpCount = null;

  function evalAchievements() {
    if (!window.AchievementsCore || typeof window.AchievementsCore.evalAndUnlock !== 'function') return;
    try {
      window.AchievementsCore.evalAndUnlock(window.Profile.snapshot());
    } catch (_) {}
  }

  function wrappedSetItem(key, value) {
    origSetItem(key, value);
    if (key === 'tp_solved') {
      try {
        const map = JSON.parse(value) || {};
        const total = Object.values(map).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
        if (_lastTpCount !== null && total > _lastTpCount) {
          window.Profile.recordActivity('tp');
          // Délai court pour laisser tp-engine finir d'écrire tp_streak
          // avant le check (sinon bestStreak peut être stale)
          setTimeout(evalAchievements, 30);
        }
        _lastTpCount = total;
      } catch (_) {}
    } else if (key === 'tp_streak' || key === 'tp_bestStreak') {
      // Streak modifié sans incrément de tp_solved : ré-évaluer aussi
      setTimeout(evalAchievements, 30);
    }
  }

  try {
    Object.defineProperty(localStorage, 'setItem', {
      value: wrappedSetItem,
      writable: true,
      configurable: true,
    });
  } catch (e) {
    console.warn('[tp-profile-bridge] override impossible :', e);
  }

  // Initialiser le compteur
  try {
    const map = JSON.parse(localStorage.getItem('tp_solved') || '{}');
    _lastTpCount = Object.values(map).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
  } catch { _lastTpCount = 0; }

  window.addEventListener('DOMContentLoaded', () => {
    window.Profile.recordActivity('tp');
    // Catch-up à l'arrivée sur la page (au cas où des seuils auraient
    // été atteints sans bridge actif lors de précédentes sessions)
    setTimeout(evalAchievements, 100);
  });

  console.info('[tp-profile-bridge v3] actif · Profile v' + window.Profile.snapshot().version);
})();
