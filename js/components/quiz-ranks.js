// ═══════════════════════════════════════════════════════════════
// quiz-ranks.js — Logique pure des rangs et combos du quiz CAS-IN
//
// Extrait les fonctions PURES (sans DOM, sans state global) de
// quiz-app.js v2.21. Ces fonctions sont aussi appelables depuis
// d'autres pages (profile, scene...).
//
// API (window.QuizRanks et globales rétrocompat) :
//   getRank(xp)               → { rank, idx }    rang correspondant à xp
//   getRankAtIndex(idx)       → rank             rang par index
//   getNextRank(xp)           → rank | null      prochain rang à atteindre
//   getXpToNextRank(xp)       → number           XP restants pour le prochain rang
//   getComboMultiplier(streak) → 1 | 1.5 | 2 | 3   multiplicateur de combo
//
// Dépend de : quiz-data.js (pour la constante RANKS, chargée avant)
//
// v1.0 — 2026-05-02 (split de quiz-app v2.20)
// ═══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  function _ranks() {
    return (typeof RANKS !== 'undefined' && Array.isArray(RANKS)) ? RANKS : [];
  }

  // ─── Rang correspondant à un total XP ─────────────────────
  // Renvoie { rank, idx }. idx=0 = rang le plus bas (Stagiaire).
  // Stratégie : balayage descendant pour trouver le 1er seuil atteint.

  function getRank(xp) {
    const ranks = _ranks();
    if (!ranks.length) {
      // Fallback safe : rang vide
      return { rank: { name: '?', min: 0, emoji: '🎯', flavor: '' }, idx: 0 };
    }
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (xp >= ranks[i].min) {
        return { rank: ranks[i], idx: i };
      }
    }
    return { rank: ranks[0], idx: 0 };
  }

  // ─── Rang par index (pour récupération directe sans XP) ──

  function getRankAtIndex(idx) {
    const ranks = _ranks();
    if (idx < 0 || idx >= ranks.length) return null;
    return ranks[idx];
  }

  // ─── Prochain rang à atteindre ────────────────────────────
  // Renvoie null si déjà au rang max.

  function getNextRank(xp) {
    const { idx } = getRank(xp);
    return getRankAtIndex(idx + 1);
  }

  // ─── XP restants pour le prochain rang ────────────────────
  // Renvoie 0 si déjà au rang max.

  function getXpToNextRank(xp) {
    const next = getNextRank(xp);
    if (!next) return 0;
    return Math.max(0, next.min - xp);
  }

  // ─── Multiplicateur de combo selon la série ──────────────
  // 3+  → ×1.5
  // 6+  → ×2
  // 12+ → ×3

  function getComboMultiplier(streak) {
    if (streak >= 12) return 3;
    if (streak >= 6) return 2;
    if (streak >= 3) return 1.5;
    return 1;
  }

  // ─── Exposition ───────────────────────────────────────────

  const QuizRanks = {
    getRank,
    getRankAtIndex,
    getNextRank,
    getXpToNextRank,
    getComboMultiplier,
  };

  global.QuizRanks = QuizRanks;

  // Rétrocompat : globales (quiz-app utilise getRank et getComboMultiplier sans préfixe)
  if (typeof global.getRank === 'undefined')            global.getRank = getRank;
  if (typeof global.getComboMultiplier === 'undefined') {
    // Note : la version dans quiz-app n'avait pas de paramètre — elle lisait S.streak.
    // On expose une version paramétrée + on garde la lecture de S si pas d'arg.
    global.getComboMultiplier = function (streak) {
      if (streak === undefined && typeof global.S !== 'undefined' && global.S) {
        streak = global.S.streak || 0;
      }
      return getComboMultiplier(streak || 0);
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
