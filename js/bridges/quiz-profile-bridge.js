/* ============================================================
   CAS-IN · quiz-profile-bridge.js (F2)
   Intercepte les écritures legacy 'xp' et 'dayStreak' du quiz
   pour les rediriger vers Profile.addXp / Profile.bumpStreak.
   À charger AVANT quiz-app.js sur quiz.html.
   ============================================================ */

(function () {
  'use strict';

  if (!window.Profile) {
    console.warn('[quiz-profile-bridge] Profile pas chargé — skip');
    return;
  }

  // Évite les doubles charges
  if (window.__casInQuizBridge) return;
  window.__casInQuizBridge = true;

  // ───────────────────────────────────────────────────────────
  // Stratégie : on hook localStorage.setItem GLOBAL (proxy)
  // Quand quiz-app.js fait lsSet('xp', n) → setItem('xp', '47') →
  // notre wrapper calcule le delta et appelle Profile.addXp(delta, 'quiz').
  // Sans persister la clé 'xp' elle-même (Profile est seul source de vérité).
  // ───────────────────────────────────────────────────────────

  const origSetItem = Storage.prototype.setItem.bind(localStorage);
  const origGetItem = Storage.prototype.getItem.bind(localStorage);
  const origRemoveItem = Storage.prototype.removeItem.bind(localStorage);

  // Pour le quiz, on a besoin que getItem('xp') retourne la valeur Profile
  // (sinon S.xp = 0 au démarrage)
  function wrappedGetItem(key) {
    if (key === 'xp') {
      const total = window.Profile.getXpBySource().quiz;
      return JSON.stringify(total);
    }
    if (key === 'dayStreak') {
      return JSON.stringify(window.Profile.getStreak().current);
    }
    return origGetItem(key);
  }

  // Pour les écritures, on intercepte 'xp' et 'dayStreak' SANS écrire la clé.
  let _lastQuizXp = null;
  let _lastDayStreak = null;

  function wrappedSetItem(key, value) {
    if (key === 'xp') {
      let n;
      try { n = parseInt(JSON.parse(value), 10); }
      catch { n = parseInt(value, 10); }
      if (!Number.isFinite(n)) return;
      // Si c'est la première écriture de la session, on initialise sans delta
      if (_lastQuizXp === null) {
        _lastQuizXp = window.Profile.getXpBySource().quiz;
      }
      const delta = n - _lastQuizXp;
      if (delta > 0) {
        // Si quiz-app a publié des tags de contexte (theme question), on les
        // transmet au Profile pour que getRoleBonus() puisse appliquer +20%
        // selon le rôle choisi.
        const tags = Array.isArray(window.__casInBonusTags) && window.__casInBonusTags.length
          ? window.__casInBonusTags
          : null;
        window.Profile.addXp(delta, 'quiz', tags ? { tags } : undefined);
      }
      _lastQuizXp = n;
      // On n'écrit PAS la clé 'xp' en localStorage : Profile est seul
      return;
    }

    if (key === 'dayStreak') {
      let n;
      try { n = parseInt(JSON.parse(value), 10); }
      catch { n = parseInt(value, 10); }
      if (!Number.isFinite(n)) return;
      if (_lastDayStreak === null) {
        _lastDayStreak = window.Profile.getStreak().current;
      }
      // Si le streak augmente, on bumpe (ce qui marque la date du jour)
      // Si le streak passe à 0 (cassé), on appelle breakStreak
      if (n > _lastDayStreak) {
        window.Profile.bumpStreak();
      } else if (n === 0 && _lastDayStreak > 0) {
        window.Profile.breakStreak();
      }
      _lastDayStreak = n;
      return;
    }

    if (key === 'achievements') {
      // Synchronise vers Profile sans dupliquer
      try {
        const arr = JSON.parse(value);
        if (Array.isArray(arr)) {
          arr.forEach(id => window.Profile.unlockAchievement(id));
        }
      } catch (_) {}
      // On laisse aussi écrire la clé (compat popups quiz)
      origSetItem(key, value);
      return;
    }

    // Toutes les autres clés : passage transparent
    origSetItem(key, value);
  }

  // Override des méthodes localStorage
  // On doit remplacer sur l'instance ET sur le prototype pour couvrir
  // tous les cas d'accès (quiz-app.js, bookmarklets, etc.)
  try {
    Object.defineProperty(localStorage, 'setItem', {
      value: wrappedSetItem,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(localStorage, 'getItem', {
      value: wrappedGetItem,
      writable: true,
      configurable: true,
    });
  } catch (e) {
    console.warn('[quiz-profile-bridge] override impossible :', e);
  }

  // Quand Profile change (XP ajoutée par scène, par ex), réinitialiser
  // _lastQuizXp pour que le prochain setItem du quiz calcule le bon delta
  window.Profile.onChange(reason => {
    if (reason === 'rank-up' || reason === 'xp' || reason === 'reset') {
      _lastQuizXp = window.Profile.getXpBySource().quiz;
    }
  });

  // ───────────────────────────────────────────────────────────
  // Activité quiz : marque casIn_lastQuizVisit pour la plateforme DFIR
  // (déjà géré par le quiz, mais on enregistre aussi via Profile)
  // ───────────────────────────────────────────────────────────

  function recordQuizActivity() {
    window.Profile.recordActivity('quiz');
  }

  // Marquer l'activité au démarrage et toutes les 30s
  window.addEventListener('DOMContentLoaded', recordQuizActivity);
  setInterval(recordQuizActivity, 30_000);

  console.info('[quiz-profile-bridge] actif · Profile v' + window.Profile.snapshot().version);
})();
