// ═══════════════════════════════════════════════════════════════════
// cas-in-titles-badges.js — Titres portés + Blasons de saga (delta v44)
//
// Ajoute deux couches cosmétiques au profil :
//   1. TITRES PORTÉS — l'utilisateur peut équiper 1 titre (au-dessus
//      du nom de rang) parmi ceux qu'il a débloqués via achievements
//      ou via complétion de sagas.
//   2. BLASONS DE SAGA — chaque saga complétée donne un blason
//      bronze/argent/or selon le score moyen (≥60 / ≥80 / =100% sur
//      chaque scène). Stockés dans casIn_saga_badges.
//
// API exposée sur window.TitlesBadges :
//   - listTitles()                      → tous les titres définis
//   - getUnlockedTitles()               → titres débloqués pour ce user
//   - getEquippedTitle()                → titre actuel (ou null = rang)
//   - equipTitle(id)                    → équiper un titre débloqué
//   - getSagaBadges()                   → blasons saga → tier
//   - computeSagaBadge(sagaId)          → bronze/argent/or selon perf
//   - refreshSagaBadges()               → réévalue tous les blasons
//
// Aucune dépendance autre que window.Profile et localStorage.
// ═══════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  if (window.TitlesBadges) return;

  const LS_EQUIPPED = 'casIn_equippedTitle';
  const LS_SAGA_BADGES = 'casIn_saga_badges';

  function lsGet(k, fb) {
    try { const r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); }
    catch (_) { return fb; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (_) { return false; }
  }

  // ═══════════════════════════════════════════════════════════════
  //  CATALOGUE DES TITRES
  //  Chaque titre a : id, label, icon, condition, optionnellement description.
  //  Condition prend snap (Profile.snapshot()) + sagaBadges, retourne bool.
  // ═══════════════════════════════════════════════════════════════
  const TITLES = [
    // ── Rang track (toujours dispo, débloqué d'office) ──
    { id: 'rank_current', label: '(Rang du track actuel)', icon: '🎖️',
      description: 'Affiche automatiquement le rang courant de ton track.',
      condition: () => true, isDefault: true },

    // ── Titres saga (1 par saga si Or) ──
    { id: 'tom_savior', label: 'Sauveur de Tom', icon: '📱',
      description: 'Saga Tom complétée avec mention Or.',
      condition: (_, badges) => badges.affaire_tom === 'or' },
    { id: 'aletsch_survivor', label: 'Survivant d\'Aletsch', icon: '🚁',
      description: 'Saga Aletsch complétée avec mention Or.',
      condition: (_, badges) => badges.affaire_aletsch === 'or' },
    { id: 'casino_winner', label: 'Vainqueur du Casino', icon: '🎰',
      description: 'Saga Casino di Lugano complétée avec mention Or.',
      condition: (_, badges) => badges.affaire_casino_lugano === 'or' },
    { id: 'steve_avenger', label: 'Vengeur de Steve', icon: '🩹',
      description: 'Saga Steve Crett complétée avec mention Or.',
      condition: (_, badges) => badges.affaire_steve_sextortion === 'or' },
    { id: 'gothard_guardian', label: 'Gardien du Gothard', icon: '🚂',
      description: 'Saga Gothard complétée avec mention Or.',
      condition: (_, badges) => badges.affaire_gothard === 'or' },
    { id: 'engadine_sentinel', label: 'Sentinelle d\'Engadine', icon: '🌨',
      description: 'Saga Engadine 2027 complétée avec mention Or.',
      condition: (_, badges) => badges.affaire_engadine === 'or' },
    { id: 'model_protector', label: 'Protecteur du Modèle', icon: '🧬',
      description: 'Saga Le Modèle complétée avec mention Or.',
      condition: (_, badges) => badges.affaire_modele_onconet === 'or' },
    { id: 'prevote_master', label: 'Maître de la Prévôté', icon: '🪲',
      description: 'Saga Prévôté complétée avec mention Or.',
      condition: (_, badges) => badges.affaire_prevote_moutier === 'or' },
    { id: 'viege_chief', label: 'Chef d\'Affaire de Viège', icon: '🏔',
      description: 'Saga Viège complétée avec mention Or.',
      condition: (_, badges) => badges.affaire_viege === 'or' },

    // ── Titres méta (toutes sagas, achievement legendaire, etc.) ──
    { id: 'saga_completionist', label: 'Complétiste des sagas', icon: '👑',
      description: 'Toutes les 14 sagas complétées (≥ Bronze).',
      condition: (_, badges) => Object.keys(badges).length >= 14 },
    { id: 'mention_de_la_cour', label: 'Mention de la Cour', icon: '⚖️',
      description: 'Au moins 5 sagas avec mention Or.',
      condition: (_, badges) =>
        Object.values(badges).filter(t => t === 'or').length >= 5 },
    { id: 'legend_dfir', label: 'Légende DFIR', icon: '💎',
      description: 'Achievement "Légende vivante" débloqué.',
      condition: (snap) => (snap.achievements || []).includes('legend_dfir') ||
                            (snap.achievements || []).includes('all_themes') },

    // ── Titres affinitaires (basés sur tracks affines) ──
    { id: 'expert_forensique', label: 'Expert forensique', icon: '🔬',
      description: '100+ XP gagnés sur scènes forensiques.',
      condition: (snap) => ((snap.xpBySource || {}).scene || 0) >= 5000 },
    { id: 'maitre_quizzeur', label: 'Maître quizzeur', icon: '🎯',
      description: '500+ questions correctes.',
      condition: (snap) => (snap.quiz && snap.quiz.totalCorrect >= 500) },
    { id: 'artisan_du_tp', label: 'Artisan du TP', icon: '🛠️',
      description: '100 TP résolus.',
      condition: (snap) => {
        try {
          const tp = JSON.parse(localStorage.getItem('tp_solved') || '{}');
          const total = Object.values(tp).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
          return total >= 100;
        } catch (_) { return false; }
      }
    },
  ];

  // ═══════════════════════════════════════════════════════════════
  //  BLASONS DE SAGA
  //  Mapping saga_id → tier selon le pct moyen sur les scènes :
  //    - bronze : ≥ 60% moyenne sur scènes de la saga
  //    - argent : ≥ 80%
  //    - or     : 100% sur toutes les scènes de la saga
  // ═══════════════════════════════════════════════════════════════
  const BADGE_THRESHOLDS = { bronze: 60, argent: 80, or: 100 };

  /**
   * Calcule le blason d'une saga depuis scenes-chronology + scene_results.
   * Retourne 'or', 'argent', 'bronze', ou null si incomplet.
   */
  function computeSagaBadge(sagaId, chronologyData) {
    try {
      const chrono = chronologyData || window.SCENES_CHRONOLOGY;
      if (!chrono || !Array.isArray(chrono.sagas)) return null;
      const saga = chrono.sagas.find(s => s.id === sagaId);
      if (!saga || !Array.isArray(saga.scenes) || !saga.scenes.length) return null;

      const results = lsGet('scene_results', {}) || {};
      const pcts = [];
      for (const sid of saga.scenes) {
        const r = results[sid];
        if (!r || typeof r.pct !== 'number') return null; // saga incomplète
        pcts.push(r.pct);
      }
      if (!pcts.length) return null;
      const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
      const minPct = Math.min(...pcts);

      if (minPct >= BADGE_THRESHOLDS.or) return 'or';
      if (avg >= BADGE_THRESHOLDS.argent) return 'argent';
      if (avg >= BADGE_THRESHOLDS.bronze) return 'bronze';
      return null;
    } catch (_) { return null; }
  }

  /**
   * Réévalue tous les blasons de saga et met à jour casIn_saga_badges.
   * À appeler après chaque fin de scène.
   */
  function refreshSagaBadges(chronologyData) {
    const chrono = chronologyData || window.SCENES_CHRONOLOGY;
    if (!chrono || !Array.isArray(chrono.sagas)) return {};

    const oldBadges = lsGet(LS_SAGA_BADGES, {}) || {};
    const newBadges = {};
    const fresh = [];

    for (const saga of chrono.sagas) {
      const tier = computeSagaBadge(saga.id, chrono);
      if (tier) {
        newBadges[saga.id] = tier;
        // Détection promotion (bronze → argent → or)
        const rank = { bronze: 1, argent: 2, or: 3 };
        if (!oldBadges[saga.id] || rank[tier] > rank[oldBadges[saga.id]]) {
          fresh.push({ sagaId: saga.id, tier, sagaTitle: saga.title });
        }
      }
    }

    lsSet(LS_SAGA_BADGES, newBadges);

    // Toast de célébration pour les nouveaux blasons
    fresh.forEach(b => {
      try {
        if (window.showToast || typeof window.showToast === 'function') {
          window.showToast(
            b.tier === 'or' ? '🥇' : b.tier === 'argent' ? '🥈' : '🥉',
            `Blason ${b.tier} : ${b.sagaTitle}`,
            'Saga complétée !'
          );
        }
        // Si Celebration UI disponible, joue une cérémonie pour 'or'
        if (b.tier === 'or' && window.Celebration && typeof window.Celebration.show === 'function') {
          window.Celebration.show({
            icon: '🥇',
            title: 'MENTION DE LA COUR',
            subtitle: `Saga complétée à 100% : ${b.sagaTitle}`,
            xp: 0,
          });
        }
      } catch (_) {}
    });

    return newBadges;
  }

  function getSagaBadges() {
    return lsGet(LS_SAGA_BADGES, {}) || {};
  }

  // ═══════════════════════════════════════════════════════════════
  //  API TITRES
  // ═══════════════════════════════════════════════════════════════
  function listTitles() {
    return TITLES.map(t => ({ ...t }));
  }

  function getUnlockedTitles() {
    const snap = window.Profile ? window.Profile.snapshot() : {};
    const badges = getSagaBadges();
    return TITLES.filter(t => {
      try { return t.condition(snap, badges); }
      catch (_) { return false; }
    });
  }

  function getEquippedTitle() {
    const id = lsGet(LS_EQUIPPED, null);
    if (!id) return null;
    return TITLES.find(t => t.id === id) || null;
  }

  function equipTitle(id) {
    if (!id) { lsSet(LS_EQUIPPED, null); return true; }
    const unlocked = getUnlockedTitles();
    if (!unlocked.some(t => t.id === id)) return false;
    lsSet(LS_EQUIPPED, id);
    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  //  HOOK : refresh saga badges quand scene_results change
  // ═══════════════════════════════════════════════════════════════
  // On écoute les changements via setItem hook (similaire à tp-profile-bridge)
  const origSetItem = Storage.prototype.setItem.bind(localStorage);
  Storage.prototype.setItem = function(key, value) {
    origSetItem(key, value);
    if (key === 'scene_results') {
      setTimeout(() => refreshSagaBadges(), 100);
    }
  };

  // Refresh initial au chargement
  setTimeout(() => {
    if (window.SCENES_CHRONOLOGY) refreshSagaBadges();
    else {
      // Tenter de fetcher si pas en mémoire
      fetch('./data/scenes-chronology.json').then(r => r.json()).then(d => {
        window.SCENES_CHRONOLOGY = d;
        refreshSagaBadges(d);
      }).catch(_ => {});
    }
  }, 500);

  // ═══════════════════════════════════════════════════════════════
  //  EXPOSE
  // ═══════════════════════════════════════════════════════════════
  window.TitlesBadges = {
    listTitles,
    getUnlockedTitles,
    getEquippedTitle,
    equipTitle,
    getSagaBadges,
    computeSagaBadge,
    refreshSagaBadges,
    BADGE_THRESHOLDS,
  };

  console.info('[TitlesBadges v3.0 d44] loaded ·', TITLES.length, 'titres définis');
})();
