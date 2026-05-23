/**
 * cas-in-role-careers.js — Carrière par métier (Axe 4 UX)
 *
 * Calcule, pour chacun des 6 rôles canoniques (police, procureur, dfir,
 * journaliste, etat, soignant), les statistiques de progression de l'utilisateur :
 *   - nombre total de scènes du rôle dans le catalogue (target)
 *   - scènes complétées (≥ seuil)
 *   - scènes excellentes (≥ 95%)
 *   - rang atteint (Stagiaire → Expert)
 *
 * Lit :
 *   - localStorage 'scene_results' : { sceneId: { pct, tags, role?, … } }
 *   - scenes/index.json (déjà chargé via window.SceneIndex ou récupéré au besoin)
 *
 * Expose : window.RoleCareers.getSnapshot() → snapshot global par rôle.
 *
 * v1.0 — 2026-05-23
 */
(function () {
  'use strict';

  // ═══ Configuration ═══
  const COMPLETION_THRESHOLD = 70;   // % minimum pour considérer une scène "réussie"
  const EXCELLENCE_THRESHOLD = 95;   // % minimum pour "excellente"

  // 6 rôles canoniques + label/icône/couleur
  const ROLES = {
    police:      { key: 'police',      label: 'Police',        icon: '🚔', color: '#00e5cc' },
    procureur:   { key: 'procureur',   label: 'Procureur·e',   icon: '⚖️', color: '#c97df5' },
    dfir:        { key: 'dfir',        label: 'DFIR',          icon: '🔬', color: '#30e88a' },
    journaliste: { key: 'journaliste', label: 'Journaliste',   icon: '📰', color: '#f0c040' },
    etat:        { key: 'etat',        label: 'État',          icon: '🏛️', color: '#6ab8ff' },
    soignant:    { key: 'soignant',    label: 'Soignant·e',    icon: '🏥', color: '#ff9f40' }
  };

  // Rangs hybrides (seuil absolu OU % catalogue, on prend le plus permissif)
  // 5 rangs : Stagiaire / Junior / Confirmé / Senior / Expert
  const RANKS = [
    { key: 'stagiaire', name: 'Stagiaire', emoji: '🐣', minAbs: 0,  minPct: 0   },
    { key: 'junior',    name: 'Junior',    emoji: '🌱', minAbs: 3,  minPct: 25  },
    { key: 'confirme',  name: 'Confirmé·e',emoji: '🎓', minAbs: 10, minPct: 50  },
    { key: 'senior',    name: 'Senior',    emoji: '⭐', minAbs: 20, minPct: 75  },
    { key: 'expert',    name: 'Expert·e',  emoji: '👑', minAbs: 40, minPct: 100 }
  ];

  // ═══ Helpers ═══
  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function computeRank(completed, totalCatalog) {
    if (!totalCatalog) return RANKS[0];
    const pct = (completed / totalCatalog) * 100;
    let achieved = RANKS[0];
    for (const r of RANKS) {
      if (completed >= r.minAbs || pct >= r.minPct) {
        achieved = r;
      } else {
        break;
      }
    }
    return achieved;
  }

  function getNextRank(currentRank) {
    const idx = RANKS.findIndex(r => r.key === currentRank.key);
    return idx >= 0 && idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  }

  // ═══ Index des scènes par rôle ═══
  let _sceneIndex = null;
  let _loadPromise = null;

  function loadSceneIndex() {
    if (_sceneIndex) return Promise.resolve(_sceneIndex);
    if (_loadPromise) return _loadPromise;

    // Si window.SceneIndex est déjà chargé (par scene-app.js), on l'utilise
    if (window.SceneIndex && window.SceneIndex.getAll) {
      _sceneIndex = window.SceneIndex.getAll();
      return Promise.resolve(_sceneIndex);
    }

    // Sinon on fetch
    _loadPromise = fetch('scenes/index.json')
      .then(r => r.json())
      .then(idx => { _sceneIndex = idx; return idx; })
      .catch(err => { console.warn('[RoleCareers] fetch index failed', err); return []; });
    return _loadPromise;
  }

  // ═══ Snapshot principal ═══
  async function getSnapshot() {
    const sceneIndex = await loadSceneIndex();
    const results = lsGet('scene_results', {}) || {};

    // 1) Catalogue par rôle : count total des scènes
    const catalogByRole = {};
    const sceneRoleById = {};
    sceneIndex.forEach(s => {
      const role = s.role;
      if (!role || !ROLES[role]) return;
      catalogByRole[role] = (catalogByRole[role] || 0) + 1;
      sceneRoleById[s.id] = role;
    });

    // 2) Compteurs joueur par rôle
    const stats = {};
    Object.keys(ROLES).forEach(role => {
      stats[role] = {
        ...ROLES[role],
        total: catalogByRole[role] || 0,
        completed: 0,
        excellent: 0,
        totalPct: 0,
        sceneIds: []
      };
    });

    Object.entries(results).forEach(([sceneId, res]) => {
      if (!res || typeof res.pct !== 'number') return;
      const role = res.role || sceneRoleById[sceneId];
      if (!role || !stats[role]) return;
      const pct = res.pct;
      if (pct >= COMPLETION_THRESHOLD) {
        stats[role].completed++;
        stats[role].sceneIds.push(sceneId);
        stats[role].totalPct += pct;
      }
      if (pct >= EXCELLENCE_THRESHOLD) {
        stats[role].excellent++;
      }
    });

    // 3) Rang et progression pour chaque rôle
    const byRole = Object.values(stats).map(s => {
      const rank = computeRank(s.completed, s.total);
      const nextRank = getNextRank(rank);
      const avg = s.completed > 0 ? Math.round(s.totalPct / s.completed) : 0;
      const pctCatalog = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;

      // Cible du prochain rang
      let nextTarget = null;
      let nextRemaining = 0;
      if (nextRank) {
        const targetAbs = nextRank.minAbs;
        const targetPctScenes = Math.ceil((nextRank.minPct / 100) * s.total);
        // On prend le seuil le plus accessible (le plus petit des deux)
        nextTarget = Math.min(targetAbs, targetPctScenes || targetAbs);
        nextRemaining = Math.max(0, nextTarget - s.completed);
      }

      return {
        ...s,
        rank,
        nextRank,
        nextTarget,
        nextRemaining,
        avg,
        pctCatalog
      };
    });

    // Tri : rôle dominant (par scènes complétées) en premier
    byRole.sort((a, b) => b.completed - a.completed || b.pctCatalog - a.pctCatalog);

    // Rôle principal (le plus joué)
    const dominant = byRole[0] && byRole[0].completed > 0 ? byRole[0] : null;

    return {
      byRole,
      dominant,
      totalCompleted: byRole.reduce((s, r) => s + r.completed, 0),
      totalExcellent: byRole.reduce((s, r) => s + r.excellent, 0),
      totalCatalog: byRole.reduce((s, r) => s + r.total, 0)
    };
  }

  // ═══ Public API ═══
  window.RoleCareers = {
    getSnapshot,
    ROLES,
    RANKS,
    COMPLETION_THRESHOLD,
    EXCELLENCE_THRESHOLD
  };
})();
