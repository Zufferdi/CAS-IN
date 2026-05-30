/* ═══════════════════════════════════════════════════════════════
   cas-in-trophies-view.js — v121b
   
   Module de présentation des 148 achievements existants en 7
   catégories visuelles, sans toucher au système de calcul.
   
   Lit depuis :
     - window.ACHIEVEMENTS_META   (148 entrées)
     - window.AchievementsCore    (getProgress, getAchievementTier, TIER_XP)
     - window.Profile.snapshot()  (état joueur, dont .achievements unlocked)
   
   Expose :
     - window.TrophiesView.getAllTrophies()  → 148 trophées enrichis
     - window.TrophiesView.byVisualCategory() → groupement 7 catégories
     - window.TrophiesView.getStats()         → stats globales + par catégorie
     - window.TrophiesView.getNextToUnlock(n) → n prochains à débloquer
     - window.TrophiesView.VISUAL_CATEGORIES  → métadonnées des 7 catégories
   
   v1.0 — 2026-05-27 (v121b)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // 10 catégories visuelles + leur définition (v124 +tutoriels)
  // ─────────────────────────────────────────────────────────────
  const VISUAL_CATEGORIES = [
    {
      id: 'progression',
      label: 'Progression narrative',
      icon: '📚',
      color: '#7ec0ff',
      description: 'Scènes complétées, sagas terminées, progression dans les arcs',
      // Catégories source à inclure
      sourceCategories: [
        'Scènes · Progression',
        'Scènes · Modes',
        'Scènes · Europe',
        'Quiz · Quantité',
      ],
    },
    {
      id: 'mastery',
      label: 'Maîtrise technique',
      icon: '🎯',
      color: '#30e88a',
      description: 'Précision, séries de bonnes réponses, expertise pointue',
      sourceCategories: [
        'Quiz · Précision',
        'Quiz · Séries',
        'Quiz · Combo',
        'Quiz · Difficile',
        'Scènes · Spécialité',
        'TP · Pratique',
        'Tools · Calculateurs',
        'Fiches · Lecture',
      ],
    },
    {
      id: 'relations',
      label: 'Relations PNJ',
      icon: '👥',
      color: '#c97df5',
      description: 'Arcs PNJ développés, liens construits avec les personnages',
      sourceCategories: [
        'Scènes · Arcs PNJ',
        'Scènes · Arcs PNJ (auto)',
      ],
    },
    {
      id: 'role',
      label: 'Spécialisation rôle',
      icon: '🎭',
      color: '#f0c040',
      description: 'Progression dans votre rôle choisi (Enquêteur, Magistrat, Journaliste, Hacker)',
      sourceCategories: [
        'Rôle · Enquêteur',
        'Rôle · Magistrat',
        'Rôle · Journaliste',
        'Rôle · Hacker',
      ],
    },
    {
      id: 'regularity',
      label: 'Régularité',
      icon: '🔥',
      color: '#ff7a40',
      description: 'Streaks, sessions répétées, engagement dans le temps',
      sourceCategories: [
        'Quiz · Régularité',
      ],
    },
    {
      id: 'meta',
      label: 'Méta & Comportement',
      icon: '🎲',
      color: '#6ab8ff',
      description: 'Façons originales de jouer, choix éthiques marquants',
      sourceCategories: [
        'Scènes · Éthique',
        'Scènes · Comportement',
        'Quiz · Spécial',
      ],
    },
    {
      id: 'secret',
      label: 'Secrets',
      icon: '✨',
      color: '#a78bfa',
      description: 'Trophées spéciaux révélés au déblocage',
      sourceCategories: [
        'Secrets 🤫',
      ],
      hideLocked: true, // Cacher les trophées non débloqués de cette catégorie
    },
    {
      id: 'doctrine',
      label: 'Doctrine sectorielle',
      icon: '🎓',
      color: '#22d3ee',
      description: 'Progression dans les 6 sagas majeures (Vauthier, IBAN, Laufenburg, HPM, EncroChat, HRHP), doctrines transversales, réputation institutionnelle et compétences techniques',
      sourceCategories: [
        'Doctrine · Vauthier MP-VD',
        'Doctrine · IBAN spoofing',
        'Doctrine · Laufenburg',
        'Doctrine · HPM EIMP',
        'Doctrine · EncroChat/Sky ECC',
        'Doctrine · Ransomware HRHP',
        'Doctrine · Arc transversal',
        'Doctrine · Maîtres doctrinaux',
        'Doctrine · Étoile noire',
        'Doctrine · Source trouble',
        'Doctrine · Maillon faible',
        'Doctrine · Réputation institutionnelle',
        'Doctrine · Compétences techniques',
      ],
    },
    // v121d — Catégorie séparée pour les choix narratifs secrets (cachés)
    {
      id: 'narrative_secret',
      label: 'Choix narratifs',
      icon: '🌙',
      color: '#fbbf24',
      description: 'Trophées révélés au déblocage qui récompensent des choix narratifs marquants dans les sagas',
      sourceCategories: [
        'Doctrine · Choix narratifs (secrets)',
      ],
      hideLocked: true, // Cacher tant que non débloqués
    },
    // v124 — Cluster Tutoriels DFIR (apprendre en faisant)
    {
      id: 'tutoriels',
      label: 'Tutoriels DFIR',
      icon: '🛠️',
      color: '#f0883e',
      description: 'Maîtrise des outils DFIR open source : Autopsy, IPED, MVT, Plaso, Volatility 3. Apprentissage pas-à-pas validé par quiz.',
      sourceCategories: [
        'Tutoriels DFIR',
      ],
    },
  ];

  // Map inverse : catégorie source → id de catégorie visuelle
  const SOURCE_TO_VISUAL = {};
  VISUAL_CATEGORIES.forEach(vc => {
    vc.sourceCategories.forEach(sc => {
      SOURCE_TO_VISUAL[sc] = vc.id;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  function getMeta() {
    return Array.isArray(window.ACHIEVEMENTS_META) ? window.ACHIEVEMENTS_META : [];
  }

  function getCore() {
    return window.AchievementsCore || null;
  }

  function getSnap() {
    if (window.Profile && typeof window.Profile.snapshot === 'function') {
      return window.Profile.snapshot();
    }
    return { achievements: [], xp: 0 };
  }

  function getUnlockedSet() {
    const snap = getSnap();
    return new Set(snap.achievements || []);
  }

  // ─────────────────────────────────────────────────────────────
  // Enrichissement des 148 trophées : ajout visual_category, tier, xp, isUnlocked, progress
  // ─────────────────────────────────────────────────────────────
  function getAllTrophies() {
    const meta = getMeta();
    const core = getCore();
    const snap = getSnap();
    const unlocked = new Set(snap.achievements || []);

    return meta.map(a => {
      const visualCat = SOURCE_TO_VISUAL[a.category] || 'meta';
      const tier = core ? core.getAchievementTier(a.id) : 'bronze';
      const xp = core && core.TIER_XP ? (core.TIER_XP[tier] || 30) : 30;
      const isUnlocked = unlocked.has(a.id);
      let progress = null;
      if (!isUnlocked && core && typeof core.getProgress === 'function') {
        progress = core.getProgress(a.id, snap);
      }

      return {
        id: a.id,
        emoji: a.emoji || '🏅',
        name: a.name || a.id,
        desc: a.desc || '',
        sourceCategory: a.category,
        visualCategory: visualCat,
        tier: tier,
        xp: xp,
        isUnlocked: isUnlocked,
        progress: progress,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Groupement par catégorie visuelle
  // ─────────────────────────────────────────────────────────────
  function byVisualCategory() {
    const trophies = getAllTrophies();
    const grouped = {};
    VISUAL_CATEGORIES.forEach(vc => {
      grouped[vc.id] = {
        ...vc,
        trophies: [],
        stats: { total: 0, unlocked: 0, xp_earned: 0, xp_max: 0 },
      };
    });

    trophies.forEach(t => {
      const g = grouped[t.visualCategory];
      if (!g) return;
      g.trophies.push(t);
      g.stats.total += 1;
      g.stats.xp_max += t.xp;
      if (t.isUnlocked) {
        g.stats.unlocked += 1;
        g.stats.xp_earned += t.xp;
      }
    });

    // Tri à l'intérieur de chaque groupe : débloqués d'abord (récents en haut),
    // puis en cours (par progress descendant), puis verrouillés
    Object.values(grouped).forEach(g => {
      g.trophies.sort((a, b) => {
        // 1) débloqués avant non débloqués
        if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
        // 2) Pour les non débloqués : ceux avec progress > 0 avant ceux sans
        if (!a.isUnlocked && !b.isUnlocked) {
          const aPct = a.progress ? a.progress.current / a.progress.target : 0;
          const bPct = b.progress ? b.progress.current / b.progress.target : 0;
          if (aPct !== bPct) return bPct - aPct;
        }
        // 3) Par tier (bronze → platine pour les débloqués, inverse sinon)
        const tierOrder = { bronze: 1, argent: 2, or: 3, platine: 4 };
        return (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0);
      });
    });

    return grouped;
  }

  // ─────────────────────────────────────────────────────────────
  // Stats globales
  // ─────────────────────────────────────────────────────────────
  function getStats() {
    const trophies = getAllTrophies();
    const total = trophies.length;
    const unlocked = trophies.filter(t => t.isUnlocked).length;
    const xpEarned = trophies.filter(t => t.isUnlocked).reduce((sum, t) => sum + t.xp, 0);
    const xpMax = trophies.reduce((sum, t) => sum + t.xp, 0);

    const byTier = { bronze: { unlocked: 0, total: 0 }, argent: { unlocked: 0, total: 0 }, or: { unlocked: 0, total: 0 }, platine: { unlocked: 0, total: 0 } };
    trophies.forEach(t => {
      if (!byTier[t.tier]) return;
      byTier[t.tier].total += 1;
      if (t.isUnlocked) byTier[t.tier].unlocked += 1;
    });

    return {
      total,
      unlocked,
      pct: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      xp_earned: xpEarned,
      xp_max: xpMax,
      xp_pct: xpMax > 0 ? Math.round((xpEarned / xpMax) * 100) : 0,
      by_tier: byTier,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // « Prochain à débloquer » : N trophées les plus proches
  // ─────────────────────────────────────────────────────────────
  function getNextToUnlock(n) {
    n = n || 3;
    const trophies = getAllTrophies();
    const candidates = trophies.filter(t => {
      // Pas encore débloqué
      if (t.isUnlocked) return false;
      // A une progression mesurable
      if (!t.progress || t.progress.target === 0) return false;
      // Exclu si catégorie cachée (secrets)
      const vc = VISUAL_CATEGORIES.find(v => v.id === t.visualCategory);
      if (vc && vc.hideLocked) return false;
      // Au moins 10% de progression (sinon trop loin)
      const pct = t.progress.current / t.progress.target;
      return pct >= 0.10;
    });

    // Trier par % décroissant
    candidates.sort((a, b) => {
      const aPct = a.progress.current / a.progress.target;
      const bPct = b.progress.current / b.progress.target;
      return bPct - aPct;
    });

    return candidates.slice(0, n);
  }

  // ─────────────────────────────────────────────────────────────
  // Tier badges (pour affichage)
  // ─────────────────────────────────────────────────────────────
  const TIER_BADGES = {
    bronze:  { icon: '🥉', label: 'Bronze',  color: '#cd7f32' },
    argent:  { icon: '🥈', label: 'Argent',  color: '#c0c0c0' },
    or:      { icon: '🥇', label: 'Or',      color: '#ffd700' },
    platine: { icon: '💎', label: 'Platine', color: '#b9f2ff' },
  };

  // ─────────────────────────────────────────────────────────────
  // Export
  // ─────────────────────────────────────────────────────────────
  window.TrophiesView = Object.freeze({
    getAllTrophies,
    byVisualCategory,
    getStats,
    getNextToUnlock,
    VISUAL_CATEGORIES: Object.freeze(VISUAL_CATEGORIES.map(vc => Object.freeze({ ...vc }))),
    TIER_BADGES: Object.freeze(TIER_BADGES),
  });

})();
