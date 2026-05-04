// ═══════════════════════════════════════════════════════════════
// cas-in-leaderboard.js — Leaderboard global personnel (v2.55, volet G)
//
// Agrège les meilleurs scores du joueur cross-scènes pour fournir une
// vue synthétique : top 5 personnels, moyenne par track, scènes maîtrisées.
//
// La source de données est cas_leaderboards (top 3 par scène existant)
// + scene_results (meilleur score par scène).
//
// API:
//   window.Leaderboard = {
//     getTop5()                       : 5 meilleurs runs cross-scènes
//     getMasteryByTrack()             : { theme: { mastered, total } } pour les 7 thèmes
//     getMasteryStats()               : { mastered, total, pct }
//     getStats()                      : tout regroupé
//   }
//
// Définition "Maîtrisée" : pct >= 80% (configurable via MASTERY_THRESHOLD)
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const MASTERY_THRESHOLD = 80;
  const TRACKS = ['FORENSIQUE', 'DROIT', 'WINDOWS', 'CRYPTO', 'RÉSEAUX', 'OUTILS', 'INTERNATIONAL'];

  function lsGet(k, fb) {
    try { const r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); }
    catch (_) { return fb; }
  }

  function getSceneTitleMap() {
    const map = {};
    if (typeof window.SCENES === 'object' && Array.isArray(window.SCENES)) {
      window.SCENES.forEach(s => {
        if (s && s.id && s.title) {
          map[s.id] = {
            title: s.title,
            icon: s.icon || '📍',
            difficulty: s.difficulty,
            tags: s.tags || [],
            isEU: s.region === 'EU',
          };
        }
      });
    }
    return map;
  }

  // ── Top 5 personnel cross-scènes ──
  // Source : cas_leaderboards (top 3 par scène, runs détaillés)
  // Stratégie : on aplatit tous les runs, on trie par pct desc puis ts desc,
  //             on dédoublonne par sceneId (un seul run par scène = le meilleur),
  //             on prend les 5 premiers.
  function getTop5() {
    const lbs = lsGet('cas_leaderboards', {});
    const titleMap = getSceneTitleMap();
    const allRuns = [];
    Object.entries(lbs).forEach(([sceneId, runs]) => {
      if (!Array.isArray(runs) || !runs.length) return;
      // Best run de cette scène
      const best = runs.reduce((acc, r) => {
        if (!acc) return r;
        if (r.pct > acc.pct) return r;
        if (r.pct === acc.pct && (r.custodyPct || 0) > (acc.custodyPct || 0)) return r;
        return acc;
      }, null);
      if (best) {
        allRuns.push({
          sceneId,
          sceneTitle: (titleMap[sceneId] && titleMap[sceneId].title) || sceneId,
          sceneIcon: (titleMap[sceneId] && titleMap[sceneId].icon) || '📍',
          difficulty: (titleMap[sceneId] && titleMap[sceneId].difficulty) || 'medium',
          pct: best.pct,
          custodyPct: best.custodyPct || 0,
          score: best.score || 0,
          mode: best.mode || 'normal',
          date: best.date || '—',
          ts: best.ts || 0,
        });
      }
    });

    // Tri : pct desc → custody desc → ts desc (récent en premier)
    allRuns.sort((a, b) =>
      (b.pct - a.pct) || (b.custodyPct - a.custodyPct) || (b.ts - a.ts)
    );

    return allRuns.slice(0, 5);
  }

  // ── Mastery par track (thème) ──
  // Pour chaque track : combien de scènes maîtrisées (pct >= 80%) sur le total
  // de scènes qui contiennent ce tag.
  function getMasteryByTrack() {
    const results = lsGet('scene_results', {});
    const titleMap = getSceneTitleMap();
    const tracks = {};
    TRACKS.forEach(t => { tracks[t] = { mastered: 0, total: 0, pct: 0 }; });

    // Compte total par track (toutes scènes du corpus)
    Object.values(titleMap).forEach(meta => {
      (meta.tags || []).forEach(t => {
        if (tracks[t]) tracks[t].total += 1;
      });
    });

    // Compte maîtrisées
    Object.entries(results).forEach(([sceneId, r]) => {
      if (!r || typeof r.pct !== 'number') return;
      if (r.pct < MASTERY_THRESHOLD) return;
      const meta = titleMap[sceneId];
      if (!meta) return;
      (meta.tags || []).forEach(t => {
        if (tracks[t]) tracks[t].mastered += 1;
      });
    });

    // Calcule pct
    Object.values(tracks).forEach(track => {
      track.pct = track.total > 0 ? Math.round((track.mastered / track.total) * 100) : 0;
    });

    return tracks;
  }

  // ── Stats globales ──
  function getMasteryStats() {
    const results = lsGet('scene_results', {});
    const titleMap = getSceneTitleMap();
    const total = Object.keys(titleMap).length;
    let mastered = 0;
    let touched = 0;
    Object.values(results).forEach(r => {
      if (!r || typeof r.pct !== 'number') return;
      touched += 1;
      if (r.pct >= MASTERY_THRESHOLD) mastered += 1;
    });
    return {
      mastered,
      touched,
      total,
      pct: total > 0 ? Math.round((mastered / total) * 100) : 0,
      pctTouched: total > 0 ? Math.round((touched / total) * 100) : 0,
    };
  }

  function getStats() {
    return {
      top5: getTop5(),
      masteryByTrack: getMasteryByTrack(),
      masteryStats: getMasteryStats(),
      threshold: MASTERY_THRESHOLD,
    };
  }

  if (typeof window !== 'undefined') {
    window.Leaderboard = {
      getTop5,
      getMasteryByTrack,
      getMasteryStats,
      getStats,
      MASTERY_THRESHOLD,
      TRACKS,
    };
  }
})();
