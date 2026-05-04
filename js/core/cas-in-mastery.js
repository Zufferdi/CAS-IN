// ═══════════════════════════════════════════════════════════════
// cas-in-mastery.js — Système Mastery par scène (v2.56 EXTEND)
//
// 3 paliers de maîtrise par scène, basés sur les runs accumulés
// (cas_run_buffer, jusqu'à 50 derniers runs) :
//
//   🥉 Touchée   : 1 run avec score ≥60%
//   🥈 Réussie   : 1 run avec score ≥80%
//   🥇 Maîtrisée : 3 runs ≥80% sur ≥2 modes différents (normal, procureur)
//
// API :
//   window.Mastery = {
//     getTier(sceneId)              → 'untouched' | 'touched' | 'cleared' | 'mastered'
//     getMedal(sceneId)             → '' | '🥉' | '🥈' | '🥇'
//     getStats()                    → { mastered, cleared, touched, total }
//     getMasteredScenes()           → string[] des sceneIds maîtrisés
//   }
//
// Source de vérité :
//   - cas_run_buffer (50 runs récents avec mode + pct)
//   - scene_results (best score par scène, fallback)
//
// Note : dans la mesure où cas_run_buffer ne stocke que 50 entrées max,
// un joueur très assidu peut "perdre" des runs anciens. Pour la mastery
// MAÎTRISÉE on accepte aussi les scene_results.pct >= 80 comme proxy
// si le run buffer ne contient pas assez d'historique.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const TOUCHED_THRESHOLD = 60;
  const CLEARED_THRESHOLD = 80;
  const MASTERED_RUNS_REQUIRED = 3;
  const MASTERED_MODES_REQUIRED = 2;

  function lsGet(k, fb) {
    try { const r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); }
    catch (_) { return fb; }
  }

  // ── Calcule le tier d'une scène ──
  function getTier(sceneId) {
    if (!sceneId) return 'untouched';

    const runs = (lsGet('cas_run_buffer', []) || [])
      .filter(r => r && r.sceneId === sceneId);
    const result = (lsGet('scene_results', {}) || {})[sceneId];

    // Pas de runs ni de result → untouched
    if (runs.length === 0 && !result) return 'untouched';

    // Best pct (croise run buffer et scene_results)
    let bestPct = result && typeof result.pct === 'number' ? result.pct : 0;
    runs.forEach(r => {
      if (typeof r.pct === 'number' && r.pct > bestPct) bestPct = r.pct;
    });

    if (bestPct < TOUCHED_THRESHOLD) return 'touched-soft'; // joué mais <60%
    if (bestPct < CLEARED_THRESHOLD) return 'touched';

    // Au moins 80% atteint → calcul mastery
    // Compter runs ≥80% et modes distincts
    const goodRuns = runs.filter(r => typeof r.pct === 'number' && r.pct >= CLEARED_THRESHOLD);
    const distinctModes = new Set(goodRuns.map(r => r.mode || 'normal'));

    if (goodRuns.length >= MASTERED_RUNS_REQUIRED &&
        distinctModes.size >= MASTERED_MODES_REQUIRED) {
      return 'mastered';
    }
    return 'cleared';
  }

  function getMedal(sceneId) {
    const tier = getTier(sceneId);
    if (tier === 'mastered') return '🥇';
    if (tier === 'cleared')  return '🥈';
    if (tier === 'touched')  return '🥉';
    return '';
  }

  // ── Stats globales ──
  function getStats() {
    const titleMap = {};
    if (Array.isArray(window.SCENES)) {
      window.SCENES.forEach(s => { if (s && s.id) titleMap[s.id] = true; });
    }

    let mastered = 0, cleared = 0, touched = 0;
    Object.keys(titleMap).forEach(sid => {
      const t = getTier(sid);
      if (t === 'mastered') mastered++;
      else if (t === 'cleared') cleared++;
      else if (t === 'touched') touched++;
    });

    return {
      mastered,
      cleared: cleared + mastered, // 🥈 inclut 🥇
      touched: touched + cleared + mastered,
      total: Object.keys(titleMap).length,
    };
  }

  function getMasteredScenes() {
    const result = [];
    if (!Array.isArray(window.SCENES)) return result;
    window.SCENES.forEach(s => {
      if (s && s.id && getTier(s.id) === 'mastered') result.push(s.id);
    });
    return result;
  }

  // ── Détecte un upgrade de tier après un run et déclenche celebration ──
  // Appelé par le bridge après chaque write scene_results.
  // _previousTiers stocke le tier au load (mémoire en RAM uniquement).
  let _previousTiers = null;

  function snapshotTiers() {
    const out = {};
    if (Array.isArray(window.SCENES)) {
      window.SCENES.forEach(s => { if (s && s.id) out[s.id] = getTier(s.id); });
    }
    return out;
  }

  function evalUpgrades() {
    const current = snapshotTiers();
    if (!_previousTiers) {
      _previousTiers = current;
      return [];
    }
    const upgrades = [];
    const RANK = { 'untouched': 0, 'touched-soft': 1, 'touched': 2, 'cleared': 3, 'mastered': 4 };
    const MEDAL_MAP = { 'mastered': '🥇', 'cleared': '🥈', 'touched': '🥉' };
    Object.keys(current).forEach(sid => {
      const oldRank = RANK[_previousTiers[sid]] || 0;
      const newRank = RANK[current[sid]] || 0;
      if (newRank > oldRank && current[sid] in MEDAL_MAP) {
        upgrades.push({
          sceneId: sid,
          oldTier: _previousTiers[sid],
          newTier: current[sid],
          medal: MEDAL_MAP[current[sid]],
        });
      }
    });
    _previousTiers = current;
    return upgrades;
  }

  if (typeof window !== 'undefined') {
    window.Mastery = {
      getTier,
      getMedal,
      getStats,
      getMasteredScenes,
      evalUpgrades,
      // Constantes exposées pour debug/test
      TOUCHED_THRESHOLD,
      CLEARED_THRESHOLD,
      MASTERED_RUNS_REQUIRED,
      MASTERED_MODES_REQUIRED,
    };
  }
})();
