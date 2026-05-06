/* ============================================================
   CAS-IN · npc-arcs.js (v1)
   Méta-gamification — arcs narratifs PNJ
   
   Module responsable de :
   1. Charger data/npc-arcs.json au démarrage (lazy : à la première demande)
   2. Vérifier après chaque fin de scène si un arc PNJ est complété
      (toutes ses scènes-stages atteintes ≥ seuil de complétion)
   3. Débloquer le badge associé via Profile.unlockAchievement
   4. Exposer une API pour profile-page (affichage progression)
   
   Expose :
     window.NpcArcs.checkArcsAfterScene()
       — à appeler après une fin de scène pour évaluer la complétion d'arcs
     window.NpcArcs.getProgress()
       — appelée par profile-page.js pour afficher la grille arcs
     window.NpcArcs.getArcsData()
       — accès à la définition complète des arcs
   ============================================================ */

(function () {
  'use strict';

  if (window.__casInNpcArcs) return;
  window.__casInNpcArcs = true;

  // ─────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────
  const ARCS_JSON_PATH = './data/npc-arcs.json';
  const COMPLETION_THRESHOLD = 60;  // Stage considéré complété si pct ≥ 60%
  const STORAGE_KEY = '__cas_arcs_cache_v1';
  const STORAGE_TTL = 24 * 3600 * 1000;  // 24h

  // Mapping arc_id → badge_id (cohérent avec cas-in-achievements.js)
  const ARC_BADGE_MAP = {
    'play_ransom_analyst':  'arc_schoeb',
    'fim_xways_expert':     'arc_tremp',
    'ge_avocat_frontaliers':'arc_lavanchy',
    'europol_jcat_analyst': 'arc_lindgren',
    'swissgrid_ot_lead':    'arc_hodel',
    'nicolet':              'arc_nicolet',
    'anssi_liaison_ch':     'arc_pelletier',
    'mroz_ti':              'arc_antonini',
  };

  // ─────────────────────────────────────────────────────────────
  // État interne
  // ─────────────────────────────────────────────────────────────
  let _arcsData = null;
  let _loadPromise = null;

  // ─────────────────────────────────────────────────────────────
  // Chargement npc-arcs.json (lazy + cache localStorage 24h)
  // ─────────────────────────────────────────────────────────────
  function loadArcsData() {
    if (_arcsData) return Promise.resolve(_arcsData);
    if (_loadPromise) return _loadPromise;

    _loadPromise = (async () => {
      // Try cache first
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.t && Date.now() - parsed.t < STORAGE_TTL && parsed.d) {
            _arcsData = parsed.d;
            return _arcsData;
          }
        }
      } catch (_) {}

      // Fetch fresh
      try {
        const resp = await fetch(ARCS_JSON_PATH, { cache: 'no-cache' });
        if (!resp.ok) {
          console.warn('[npc-arcs] failed to fetch', ARCS_JSON_PATH, resp.status);
          return null;
        }
        const data = await resp.json();
        _arcsData = data;
        // Cache
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ t: Date.now(), d: data }));
        } catch (_) {}
        return _arcsData;
      } catch (e) {
        console.warn('[npc-arcs] fetch error:', e);
        return null;
      }
    })();

    return _loadPromise;
  }

  // ─────────────────────────────────────────────────────────────
  // Lecture scene_results (scènes complétées avec pct)
  // ─────────────────────────────────────────────────────────────
  function getCompletedScenes() {
    try {
      const raw = localStorage.getItem('scene_results');
      if (!raw) return {};
      const results = JSON.parse(raw);
      // Format: { [sceneId]: { pct, custodyPct, score, mode, date } }
      return results || {};
    } catch (_) {
      return {};
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Calcul progression d'un arc
  // ─────────────────────────────────────────────────────────────
  function computeArcProgress(arc, completedScenes) {
    const stages = arc.stages || [];
    const completed = stages.filter(s => {
      const result = completedScenes[s.scene_id];
      return result && (result.pct || 0) >= COMPLETION_THRESHOLD;
    });
    return {
      arc_id: arc.npc_id,
      title: arc.title,
      subtitle: arc.subtitle,
      icon: arc.icon,
      description: arc.description,
      total_stages: stages.length,
      completed_stages: completed.length,
      percentage: stages.length > 0 ? Math.round(completed.length / stages.length * 100) : 0,
      is_complete: completed.length === stages.length && stages.length > 0,
      badge_id: ARC_BADGE_MAP[arc.npc_id] || null,
      stages: stages.map(s => ({
        stage: s.stage,
        scene_id: s.scene_id,
        year: s.year,
        role_state: s.role_state,
        narrative_key: s.narrative_key,
        is_completed: !!(completedScenes[s.scene_id] &&
                         (completedScenes[s.scene_id].pct || 0) >= COMPLETION_THRESHOLD),
        pct: completedScenes[s.scene_id]?.pct || null,
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // API publique 1 : vérification + auto-unlock après scène
  // ─────────────────────────────────────────────────────────────
  async function checkArcsAfterScene() {
    if (!window.Profile || typeof window.Profile.unlockAchievement !== 'function') return;
    
    const data = await loadArcsData();
    if (!data || !data.arcs) return;
    
    const completedScenes = getCompletedScenes();
    const newlyUnlocked = [];
    
    Object.values(data.arcs).forEach(arc => {
      const progress = computeArcProgress(arc, completedScenes);
      if (progress.is_complete && progress.badge_id) {
        // Tente le déblocage (Profile.unlockAchievement est idempotent)
        const wasNewlyUnlocked = window.Profile.unlockAchievement(progress.badge_id);
        if (wasNewlyUnlocked) {
          newlyUnlocked.push(progress.badge_id);
          console.log(`[npc-arcs] Arc complété : ${progress.title} → ${progress.badge_id}`);
        }
      }
    });
    
    // Émet un event pour que profile-page se rafraîchisse si ouvert
    if (newlyUnlocked.length > 0) {
      try {
        window.dispatchEvent(new CustomEvent('npc-arcs-unlocked', {
          detail: { badges: newlyUnlocked }
        }));
      } catch (_) {}
    }
    
    return newlyUnlocked;
  }

  // ─────────────────────────────────────────────────────────────
  // API publique 2 : progression complète pour profile-page
  // ─────────────────────────────────────────────────────────────
  async function getProgress() {
    const data = await loadArcsData();
    if (!data || !data.arcs) return [];
    
    const completedScenes = getCompletedScenes();
    return Object.values(data.arcs).map(arc => computeArcProgress(arc, completedScenes));
  }

  // ─────────────────────────────────────────────────────────────
  // API publique 3 : accès aux données brutes
  // ─────────────────────────────────────────────────────────────
  async function getArcsData() {
    return await loadArcsData();
  }

  // ─────────────────────────────────────────────────────────────
  // Expose API
  // ─────────────────────────────────────────────────────────────
  window.NpcArcs = {
    checkArcsAfterScene,
    getProgress,
    getArcsData,
    COMPLETION_THRESHOLD,
  };

  console.log('[npc-arcs] v1 loaded');
})();
