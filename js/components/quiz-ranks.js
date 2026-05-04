// ═══════════════════════════════════════════════════════════════
// quiz-ranks.js — Logique de rangs et combos du quiz
//
// v2.61 (2026-05-04) — REFACTOR :
//   Avant cette version, le quiz utilisait sa propre table `RANKS`
//   (Abby Sciuto, Sherlock, etc.) basée sur l'XP cumulée du quiz.
//   Cela créait une incohérence visible : Profile gérait déjà 4 tracks
//   de carrière (Enquêteur / Magistrat / Journaliste / Hacker), basés
//   sur l'XP TOTALE. Le quiz disait "X XP pour Abby Sciuto" alors que
//   le profil disait que l'utilisateur était déjà "Sherlock Holmes".
//
//   v2.61 : on PROXIE vers Profile.snapshot().rank pour des rangs
//   cohérents partout. Fallback sur RANKS legacy si Profile absent.
//
// API (window.QuizRanks et globales rétrocompat) — INCHANGÉE :
//   getRank(xp)                → { rank, idx }
//   getRankAtIndex(idx)        → rank
//   getNextRank(xp)            → rank | null
//   getXpToNextRank(xp)        → number
//   getComboMultiplier(streak) → 1 | 1.5 | 2 | 3
// ═══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  function _hasProfile() {
    return typeof global.Profile !== 'undefined' &&
           typeof global.Profile.snapshot === 'function';
  }

  function _legacyRanks() {
    return (typeof RANKS !== 'undefined' && Array.isArray(RANKS)) ? RANKS : [];
  }

  // ─── Reconstruit une table compatible {name, emoji, min, flavor} ──
  // Cache invalidé sur 'profile-changed'.
  let _cachedTable = null;
  let _cachedTrackKey = null;

  function _rankTableFromProfile() {
    if (!_hasProfile()) return null;
    try {
      const snap = global.Profile.snapshot();
      const trackKey = snap.agent && snap.agent.track ? snap.agent.track : 'investigator';

      if (_cachedTrackKey === trackKey && _cachedTable) return _cachedTable;

      // Si Profile expose une API getAllRanks(track), on l'utilise.
      if (typeof global.Profile.getAllRanks === 'function') {
        const ranks = global.Profile.getAllRanks(trackKey);
        if (Array.isArray(ranks) && ranks.length > 0) {
          _cachedTrackKey = trackKey;
          _cachedTable = ranks.map(r => ({
            name: r.name,
            emoji: r.emoji || '🎯',
            min: r.min || 0,
            flavor: r.flavor || '',
          }));
          return _cachedTable;
        }
      }

      // Sinon : on fait avec ce qu'on a — rang courant + suivant.
      // Suffisant pour alimenter "rang actuel" et "X XP pour prochain rang".
      const cur = snap.rank;
      if (!cur) return null;
      const list = [];
      list.push({ name: cur.name, emoji: cur.emoji, min: cur.min, flavor: cur.flavor || '' });
      if (cur.next) {
        list.push({ name: cur.next.name, emoji: cur.next.emoji, min: cur.next.min, flavor: '' });
      }
      _cachedTrackKey = trackKey;
      _cachedTable = list;
      return list;
    } catch (_) {
      return null;
    }
  }

  if (typeof global.addEventListener === 'function') {
    global.addEventListener('profile-changed', () => {
      _cachedTable = null;
      _cachedTrackKey = null;
    });
  }

  function getRank(xp) {
    // Si Profile dispo : on aligne sur le rang COURANT du profil.
    // L'XP fournie peut être l'XP du quiz uniquement (S.xp), mais le
    // rang affiché doit être celui du profil (XP totale).
    if (_hasProfile()) {
      try {
        const snap = global.Profile.snapshot();
        const cur = snap.rank;
        if (cur) {
          // On retourne le rang Profile courant. L'idx est calculé
          // contre la table reconstruite (souvent 0 = courant, 1 = suivant).
          return {
            rank: { name: cur.name, emoji: cur.emoji, min: cur.min, flavor: cur.flavor || '' },
            idx: cur.idx || 0,
          };
        }
      } catch (_) {}
    }
    // Fallback legacy
    const ranks = _legacyRanks();
    if (!ranks.length) {
      return { rank: { name: '?', min: 0, emoji: '🎯', flavor: '' }, idx: 0 };
    }
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (xp >= ranks[i].min) return { rank: ranks[i], idx: i };
    }
    return { rank: ranks[0], idx: 0 };
  }

  function getRankAtIndex(idx) {
    const table = _rankTableFromProfile() || _legacyRanks();
    if (idx < 0 || idx >= table.length) return null;
    return table[idx];
  }

  function getNextRank(xp) {
    if (_hasProfile()) {
      try {
        const snap = global.Profile.snapshot();
        if (snap.rank && snap.rank.next) {
          const n = snap.rank.next;
          return { name: n.name, emoji: n.emoji, min: n.min, flavor: '' };
        }
      } catch (_) {}
    }
    const ranks = _legacyRanks();
    for (let i = 0; i < ranks.length; i++) {
      if (ranks[i].min > xp) return ranks[i];
    }
    return null;
  }

  function getXpToNextRank(xp) {
    if (_hasProfile()) {
      try {
        const snap = global.Profile.snapshot();
        if (snap.rank && typeof snap.rank.xpToNext === 'number') {
          return snap.rank.xpToNext;
        }
      } catch (_) {}
    }
    const next = getNextRank(xp);
    if (!next) return 0;
    return Math.max(0, next.min - xp);
  }

  function getComboMultiplier(streak) {
    if (streak >= 12) return 3;
    if (streak >= 6) return 2;
    if (streak >= 3) return 1.5;
    return 1;
  }

  const QuizRanks = {
    getRank,
    getRankAtIndex,
    getNextRank,
    getXpToNextRank,
    getComboMultiplier,
  };

  global.QuizRanks = QuizRanks;

  if (typeof global.getRank === 'undefined') global.getRank = getRank;
  if (typeof global.getComboMultiplier === 'undefined') {
    global.getComboMultiplier = function (streak) {
      if (streak === undefined && typeof global.S !== 'undefined' && global.S) {
        streak = global.S.streak || 0;
      }
      return getComboMultiplier(streak || 0);
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
