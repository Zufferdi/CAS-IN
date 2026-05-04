/* ============================================================
   CAS-IN · scene-profile-bridge.js (F2 + v3)
   Intercepte les écritures legacy 'cas_xp' et 'cas_streak' de la scène
   pour les rediriger vers Profile.addXp / Profile.bumpStreak.
   v3 : hook supplémentaire sur 'scene_results' qui synchronise les
   GLOBAL_BADGES (définis dans scene-app.js) vers Profile.unlockAchievement,
   et déclenche AchievementsCore.evalAndUnlock pour les checks centralisés.
   À charger AVANT scene-app.js sur scene.html.
   ============================================================ */

(function () {
  'use strict';

  if (!window.Profile) {
    console.warn('[scene-profile-bridge] Profile pas chargé — skip');
    return;
  }

  if (window.__casInSceneBridge) return;
  window.__casInSceneBridge = true;

  const origSetItem = Storage.prototype.setItem.bind(localStorage);
  const origGetItem = Storage.prototype.getItem.bind(localStorage);

  function wrappedGetItem(key) {
    if (key === 'cas_xp') {
      return JSON.stringify(window.Profile.getXpBySource().scene);
    }
    if (key === 'cas_streak') {
      // scene-app attend un objet {count, lastDate}
      const s = window.Profile.getStreak();
      return JSON.stringify({ count: s.current, lastDate: s.lastDate });
    }
    return origGetItem(key);
  }

  let _lastSceneXp = null;
  let _lastSceneStreak = null;

  // ──────────────────────────────────────────────────────────
  // Synchro badges : à chaque write de scene_results (fin de scénario),
  // on appelle window.getUnlockedBadges() (défini dans scene-app.js après
  // chargement) et on pousse chaque nouveau badge vers Profile.
  // Aussi : evalAndUnlock pour les checks TP/fiches centralisés.
  // ──────────────────────────────────────────────────────────
  function syncSceneBadgesAndAchievements() {
    // 1) Badges spécifiques aux scènes (scene-app.js)
    if (typeof window.getUnlockedBadges === 'function') {
      try {
        const ids = window.getUnlockedBadges() || [];
        ids.forEach(id => {
          if (typeof id === 'string') window.Profile.unlockAchievement(id);
        });
      } catch (e) {
        console.warn('[scene-profile-bridge] badge sync failed:', e);
      }
    }
    // 2) Achievements transversaux (TP, fiches) — utiles si activité
    // mixte au cours de la session
    if (window.AchievementsCore && typeof window.AchievementsCore.evalAndUnlock === 'function') {
      try {
        window.AchievementsCore.evalAndUnlock(window.Profile.snapshot());
      } catch (_) {}
    }
    // 3) v2.51 — Arcs narratifs PNJ (méta-gamification)
    // Vérifie chaque arc PNJ et débloque les badges si tous les stages
    // sont complétés. Idempotent (Profile.unlockAchievement skip si déjà
    // débloqué).
    if (window.NpcArcs && typeof window.NpcArcs.evalAndUnlock === 'function') {
      try {
        // Force load si pas encore (les arcs peuvent ne pas avoir été
        // chargés au moment de la première fin de scène)
        Promise.resolve(window.NpcArcs.load()).then(() => {
          window.NpcArcs.evalAndUnlock();
        });
      } catch (_) {}
    }
    // 4) v2.55 — Quêtes journalières (volet G — gamification)
    // Évalue les 3 quêtes du jour et marque celles complétées + push XP.
    // Le module est tolérant : pas crash si Quests indisponible.
    if (window.Quests && typeof window.Quests.evalAndComplete === 'function') {
      try { window.Quests.evalAndComplete(); } catch (_) {}
    }
    // 5) v2.56 — Mastery par scène (paquet EXTEND)
    // Détecte les upgrades de tier (untouched → touched → cleared → mastered)
    // et déclenche une célébration via window.Celebration pour chaque upgrade.
    if (window.Mastery && typeof window.Mastery.evalUpgrades === 'function') {
      try {
        const upgrades = window.Mastery.evalUpgrades();
        if (upgrades && upgrades.length > 0 && window.Celebration && typeof window.Celebration.show === 'function') {
          // Récupérer le titre humain de la scène depuis SCENES
          const titleMap = {};
          if (Array.isArray(window.SCENES)) {
            window.SCENES.forEach(s => { if (s && s.id) titleMap[s.id] = s.title; });
          }
          upgrades.forEach(up => {
            const tierLabel = up.newTier === 'mastered' ? 'Maîtrisée'
                            : up.newTier === 'cleared'  ? 'Réussie'
                            : 'Touchée';
            window.Celebration.show({
              icon: up.medal,
              title: `Scène ${tierLabel}`,
              subtitle: titleMap[up.sceneId] || up.sceneId,
              xp: 0, // l'XP est déjà créditée par scene-app, ici c'est purement du feedback
            });
          });
        }
      } catch (_) {}
    }
  }

  function wrappedSetItem(key, value) {
    if (key === 'cas_xp') {
      // Si scene-app a déjà appelé Profile.addXp directement (avec tags
      // pour le bonus rôle), on évite le double comptage en ignorant
      // l'écriture intercepté ici.
      if (window.__casInProfileApplied) {
        return;
      }
      let n;
      try { n = parseInt(JSON.parse(value), 10); }
      catch { n = parseInt(value, 10); }
      if (!Number.isFinite(n)) return;
      if (_lastSceneXp === null) {
        _lastSceneXp = window.Profile.getXpBySource().scene;
      }
      const delta = n - _lastSceneXp;
      // Note : scene-app peut DÉCRÉMENTER cas_xp (coût des indices).
      // Dans ce cas on retire de l'XP scène en passant un addXp négatif via setProfile direct.
      // Pour la simplicité, on accepte juste les ajouts positifs ; les retraits
      // (coûts d'indices) sont gérés par mise à jour directe de xpBySource.
      if (delta > 0) {
        window.Profile.addXp(delta, 'scene');
      } else if (delta < 0) {
        // Retrait : on passe par snapshot + setProfile pour décrémenter
        applyScene_xpRetrait(Math.abs(delta));
      }
      _lastSceneXp = n;
      return;
    }

    if (key === 'cas_streak') {
      let obj;
      try { obj = JSON.parse(value); } catch { obj = null; }
      if (!obj || typeof obj !== 'object') return;
      const newCount = parseInt(obj.count, 10) || 0;
      if (_lastSceneStreak === null) {
        _lastSceneStreak = window.Profile.getStreak().current;
      }
      if (newCount > _lastSceneStreak) {
        window.Profile.bumpStreak();
      } else if (newCount === 0 && _lastSceneStreak > 0) {
        window.Profile.breakStreak();
      }
      _lastSceneStreak = newCount;
      return;
    }

    // Hook scene_results : write transparent + sync badges/achievements
    if (key === 'scene_results') {
      origSetItem(key, value);
      // Délai court : laisse scene-app finir sa tirade de lsSet
      // (cas_no_crit_streak, cas_procureur_wins, etc.) avant le check
      setTimeout(syncSceneBadgesAndAchievements, 50);
      return;
    }

    // Sinon transparent
    origSetItem(key, value);
  }

  /**
   * Retrait d'XP scène (cas des coûts d'indices).
   * On modifie directement xpBySource sans passer par addXp (qui n'accepte que positif).
   */
  function applyScene_xpRetrait(amount) {
    const PROFILE_KEY = 'casIn_profile';
    let p;
    try {
      p = JSON.parse(origGetItem(PROFILE_KEY));
    } catch { return; }
    if (!p || typeof p !== 'object') return;
    p.xpBySource.scene = Math.max(0, (p.xpBySource.scene || 0) - amount);
    p.xp = Math.max(0, (p.xp || 0) - amount);
    origSetItem(PROFILE_KEY, JSON.stringify(p));
    // Émet un event pour que la page profil se rafraîchisse
    try {
      window.dispatchEvent(new CustomEvent('profile-changed', { detail: { reason: 'xp-spent' } }));
    } catch (_) {}
  }

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
    console.warn('[scene-profile-bridge] override impossible :', e);
  }

  window.Profile.onChange(reason => {
    if (reason === 'rank-up' || reason === 'xp' || reason === 'reset' || reason === 'xp-spent') {
      _lastSceneXp = window.Profile.getXpBySource().scene;
    }
  });

  // Activité scène
  function recordSceneActivity() {
    window.Profile.recordActivity('scene');
  }
  window.addEventListener('DOMContentLoaded', recordSceneActivity);
  setInterval(recordSceneActivity, 30_000);

  console.info('[scene-profile-bridge v3] actif · Profile v' + window.Profile.snapshot().version);
})();
