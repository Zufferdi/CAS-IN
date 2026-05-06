// ═══════════════════════════════════════════════════════════════
// cas-in-arcs.js — Méta-gamification : arcs narratifs PNJ (v2.51)
//
// Module qui charge data/npc-arcs.json au démarrage et expose la
// logique d'auto-unlock des badges arcs PNJ + de progression
// pour l'affichage dans la page profil.
//
// Architecture :
//   - À l'init : fetch data/npc-arcs.json (cache navigateur via SW)
//   - Pour chaque arc, détermine la progression actuelle en lisant
//     scene_results (localStorage). Un stage est "complété" si la
//     scène associée a pct >= 60% (seuil de validation pédagogique).
//   - Si tous les stages d'un arc sont complétés, déclenche
//     Profile.unlockAchievement('arc_<npc_id_short>').
//   - Hooks : appelé par scene-app.js à la fin de chaque scène (ex-bridge,
//     supprimé en v2.85+), et par profile-page au chargement (catch-up).
//
// Expose :
//   window.NpcArcs = {
//     load()              : charge npc-arcs.json (idempotent)
//     evalAndUnlock()     : évalue tous les arcs + push unlocks
//     getProgress(arcId)  : { current: N, target: T, completedSceneIds: [], remainingSceneIds: [] }
//     getAllArcs()        : tableau de tous les arcs avec progression
//     getArcMeta(arcId)   : métadonnées de l'arc (titre, description, etc.)
//   }
//
// Mapping arc_id <-> achievement_id :
//   play_ransom_analyst  → arc_schoeb
//   fim_xways_expert     → arc_tremp
//   ge_avocat_frontaliers → arc_lavanchy
//   europol_jcat_analyst → arc_lindgren
//   swissgrid_ot_lead    → arc_hodel
//   nicolet              → arc_nicolet (v2.51 nouveau)
//   anssi_liaison_ch     → arc_pelletier (v2.51 nouveau)
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── État interne ──
  let _arcsData = null;       // Contenu npc-arcs.json
  let _loadPromise = null;    // Promesse en vol pour load()
  let _isLoaded = false;

  // Mapping npc_id → achievement_id (pour Profile.unlockAchievement)
  const ARC_TO_ACHIEVEMENT = {
    'play_ransom_analyst': 'arc_schoeb',
    'fim_xways_expert': 'arc_tremp',
    'ge_avocat_frontaliers': 'arc_lavanchy',
    'europol_jcat_analyst': 'arc_lindgren',
    'swissgrid_ot_lead': 'arc_hodel',
    'nicolet': 'arc_nicolet',
    'anssi_liaison_ch': 'arc_pelletier',
  };

  // Seuil de validation pédagogique d'un stage (pct minimum sur la scène)
  const STAGE_VALIDATION_THRESHOLD = 60;

  // ── Lecture LS sécurisée ──
  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (_) { return fallback; }
  }

  /**
   * Charge data/npc-arcs.json (idempotent, retourne la promesse en cours
   * si appelée plusieurs fois). Le SW met le fichier en cache au premier
   * fetch, donc les appels ultérieurs sont instantanés.
   */
  async function load() {
    if (_isLoaded) return _arcsData;
    if (_loadPromise) return _loadPromise;

    _loadPromise = (async () => {
      try {
        const resp = await fetch('./data/npc-arcs.json', { cache: 'default' });
        if (!resp.ok) {
          console.warn('[NpcArcs] HTTP ' + resp.status + ' loading npc-arcs.json');
          _arcsData = { arcs: {} };
          _isLoaded = true;
          return _arcsData;
        }
        _arcsData = await resp.json();
        _isLoaded = true;
        return _arcsData;
      } catch (e) {
        console.warn('[NpcArcs] Fetch failed:', e);
        _arcsData = { arcs: {} };
        _isLoaded = true;
        return _arcsData;
      }
    })();

    return _loadPromise;
  }

  /**
   * Vérifie si un sceneId est complété (pct >= seuil) en lisant
   * scene_results dans localStorage.
   */
  function isSceneCompleted(sceneId) {
    const results = lsGet('scene_results', {});
    const r = results[sceneId];
    return !!(r && typeof r.pct === 'number' && r.pct >= STAGE_VALIDATION_THRESHOLD);
  }

  /**
   * Calcule la progression d'un arc : combien de stages complétés
   * sur le total. Retourne null si arc inexistant ou data non chargée.
   *
   * @param {string} npcArcId - id du PNJ central de l'arc
   * @returns {{ current: number, target: number, completedSceneIds: string[],
   *             remainingSceneIds: string[] } | null}
   */
  function getProgress(npcArcId) {
    if (!_arcsData || !_arcsData.arcs) return null;
    const arc = _arcsData.arcs[npcArcId];
    if (!arc || !Array.isArray(arc.stages)) return null;

    const completedSceneIds = [];
    const remainingSceneIds = [];
    arc.stages.forEach(stage => {
      if (isSceneCompleted(stage.scene_id)) completedSceneIds.push(stage.scene_id);
      else remainingSceneIds.push(stage.scene_id);
    });

    return {
      current: completedSceneIds.length,
      target: arc.stages.length,
      completedSceneIds,
      remainingSceneIds,
    };
  }

  /**
   * Évalue tous les arcs et, pour chaque arc complété (current === target),
   * débloque le badge associé via Profile.unlockAchievement().
   * Retourne la liste des ids fraîchement débloqués.
   *
   * Idempotent : Profile.unlockAchievement() retourne false pour un badge
   * déjà débloqué, donc safe à appeler répétitivement.
   */
  function evalAndUnlock() {
    if (!_arcsData || !_arcsData.arcs) return [];
    if (!window.Profile || typeof window.Profile.unlockAchievement !== 'function') return [];

    const fresh = [];
    Object.keys(_arcsData.arcs).forEach(npcId => {
      const prog = getProgress(npcId);
      if (!prog) return;
      // Arc complété si tous les stages publiés (pas les future_stages) sont validés
      if (prog.current >= prog.target && prog.target > 0) {
        const achievementId = ARC_TO_ACHIEVEMENT[npcId];
        if (achievementId) {
          try {
            if (window.Profile.unlockAchievement(achievementId)) {
              fresh.push(achievementId);
            }
          } catch (e) {
            console.warn('[NpcArcs] unlock failed for ' + achievementId, e);
          }
        }
      }
    });
    return fresh;
  }

  /**
   * Retourne tous les arcs sous forme de tableau enrichi avec leur
   * progression actuelle. Pratique pour l'affichage dans la page profil.
   */
  function getAllArcs() {
    if (!_arcsData || !_arcsData.arcs) return [];
    return Object.keys(_arcsData.arcs).map(npcId => {
      const arc = _arcsData.arcs[npcId];
      const prog = getProgress(npcId);
      return {
        npcId,
        achievementId: ARC_TO_ACHIEVEMENT[npcId] || null,
        title: arc.title,
        subtitle: arc.subtitle,
        icon: arc.icon,
        description: arc.description,
        stages: arc.stages,
        completionBadge: arc.completion_badge,
        completionText: arc.completion_text,
        progress: prog,
      };
    });
  }

  /**
   * Récupère les métadonnées brutes d'un arc.
   */
  function getArcMeta(npcArcId) {
    if (!_arcsData || !_arcsData.arcs) return null;
    return _arcsData.arcs[npcArcId] || null;
  }

  // ─────────────────────────────────────────────────────────────
  // Auto-load au démarrage + auto-eval (fire & forget)
  // ─────────────────────────────────────────────────────────────
  // Permet aux pages qui chargent ce script de bénéficier du catch-up
  // automatique (badges débloqués rétroactivement à l'ouverture).
  if (typeof window !== 'undefined') {
    window.NpcArcs = {
      load,
      evalAndUnlock,
      getProgress,
      getAllArcs,
      getArcMeta,
      ARC_TO_ACHIEVEMENT,
      STAGE_VALIDATION_THRESHOLD,
    };

    // Auto-init après que Profile soit chargé
    function tryInit() {
      if (window.Profile && typeof window.Profile.unlockAchievement === 'function') {
        load().then(() => {
          evalAndUnlock();
        });
      } else {
        // Profile pas encore prêt, retry dans 200ms (limite 25 essais)
        if (tryInit._retry === undefined) tryInit._retry = 0;
        if (tryInit._retry++ < 25) setTimeout(tryInit, 200);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryInit);
    } else {
      tryInit();
    }
  }
})();
