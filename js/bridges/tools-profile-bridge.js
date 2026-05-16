/* ============================================================
   CAS-IN · tools-profile-bridge.js (v3.1 Phase 3b)

   Brancher les 12 calculateurs forensiques (tools.html) au système
   Profile + AchievementsCore.

   CONTRAT D'API :
     window.ToolsProfileBridge.notifyToolUse(toolKey)
       → tools-app.js l'appelle quand un outil produit un résultat
         (depuis showResult, débouncé 500ms).
       → Le bridge incrémente localStorage.tools_used[toolKey] puis
         déclenche AchievementsCore.evalAndUnlock.

   POURQUOI un bridge explicite plutôt que Storage.prototype.setItem
   wrapper (cf. tp-profile-bridge.js) :
     • Le wrapper TP intercepte TOUS les setItem de la page — debug-hostile,
       impossible à tracer dans les DevTools sans set un breakpoint conditionnel.
     • La doc d'ARCHITECTURE.md annonce explicitement la dépréciation des
       bridges (Phase 4 supprime tp-profile-bridge). On commence en Phase 3b
       avec le bon pattern.
     • Phase 3a (Profile v3) ajoutera Profile.recordActivity('tools') ; ce
       bridge migrera alors vers un appel direct sans wrapper.

   À charger dans tools.html APRÈS cas-in-profile.js et cas-in-achievements.js,
   mais AVANT tools-app.js (qui appelle notifyToolUse).
   ============================================================ */

(function () {
  'use strict';

  if (window.__casInToolsBridge) return;
  window.__casInToolsBridge = true;

  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (_) { return fallback; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }

  // Set figé en sync avec ACHIEVEMENTS_META#TOOLS_ALL.
  // Maintenu manuellement (12 onglets dans tools.html v3.1).
  const KNOWN_TOOLS = new Set([
    'ts','rl','fat','ntfs','hex','enc',
    'sfn','magic','bitmap','hashid','cluster','mft'
  ]);

  function evalAchievements() {
    if (!window.AchievementsCore || typeof window.AchievementsCore.evalAndUnlock !== 'function') return [];
    if (!window.Profile || typeof window.Profile.snapshot !== 'function') return [];
    try {
      return window.AchievementsCore.evalAndUnlock(window.Profile.snapshot());
    } catch (_) { return []; }
  }

  /**
   * Notification d'usage d'un outil.
   *
   * @param {string} toolKey - ID de l'onglet (ex: 'ts', 'magic', 'mft').
   *   Les clés inconnues sont ignorées silencieusement (forward-compat :
   *   si tools-app.js déclare un nouvel outil avant qu'on le liste ici,
   *   pas de plantage, juste un no-op).
   * @returns {string[]} - Liste des achievements fraîchement débloqués.
   */
  function notifyToolUse(toolKey) {
    if (typeof toolKey !== 'string' || !KNOWN_TOOLS.has(toolKey)) return [];

    const used = lsGet('tools_used', {}) || {};
    used[toolKey] = (parseInt(used[toolKey], 10) || 0) + 1;
    lsSet('tools_used', used);

    // Phase 3a v3.1 : Profile.recordActivity accepte désormais 'tools'.
    // Trace la dernière utilisation pour les widgets profil (heatmap Phase 6).
    if (window.Profile && typeof window.Profile.recordActivity === 'function') {
      try { window.Profile.recordActivity('tools'); } catch (_) {}
    }

    // Phase 6 v3.1 : Évalue les quêtes du jour (q_tools_3today notamment).
    if (window.Quests && typeof window.Quests.evalAndComplete === 'function') {
      try { window.Quests.evalAndComplete(); } catch (_) {}
    }

    return evalAchievements();
  }

  window.ToolsProfileBridge = { notifyToolUse };

  // Catch-up à l'arrivée sur la page : ré-évaluer au cas où des seuils
  // auraient été franchis hors d'une session avec bridge actif.
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(evalAchievements, 100);
  });

  console.info('[tools-profile-bridge v3.1] actif — '
    + (window.Profile ? 'Profile v' + window.Profile.snapshot().version : 'Profile absent (achievements catch-up désactivé)'));
})();
