/* ============================================================
   CAS-IN · tp-profile-bridge.js (F2)
   Pas d'XP pour les TPs (choix utilisateur). Le bridge sert juste à
   marquer la dernière activité TP dans Profile pour le DFIR.
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

  // Hook léger : quand 'tp_solved' s'incrémente, on note l'activité
  let _lastTpCount = null;

  function wrappedSetItem(key, value) {
    origSetItem(key, value);
    if (key === 'tp_solved') {
      try {
        const map = JSON.parse(value) || {};
        const total = Object.values(map).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
        if (_lastTpCount !== null && total > _lastTpCount) {
          window.Profile.recordActivity('tp');
        }
        _lastTpCount = total;
      } catch (_) {}
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

  window.addEventListener('DOMContentLoaded', () => window.Profile.recordActivity('tp'));

  console.info('[tp-profile-bridge] actif · Profile v' + window.Profile.snapshot().version);
})();
