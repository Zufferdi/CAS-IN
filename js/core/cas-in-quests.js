// ═══════════════════════════════════════════════════════════════
// cas-in-quests.js — Système de quêtes journalières (v2.55, volet G)
//
// Génère 3 quêtes quotidiennes rotatives avec récompenses XP. À chaque
// fin de scène, on évalue les quêtes du jour et on marque les complétées.
// La rotation est déterministe : seed = date du jour (YYYY-MM-DD) →
// même seed = mêmes quêtes pour tous les utilisateurs un jour donné.
//
// Storage:
//   localStorage 'cas_daily_quests' = {
//     date: 'YYYY-MM-DD',           ← date de génération
//     quests: [                      ← 3 quêtes générées pour ce jour
//       { id, title, desc, condition, reward, completed, completedAt }
//     ],
//     totalRewardClaimed: number     ← XP total déjà claim aujourd'hui
//   }
//
// API:
//   window.Quests = {
//     getToday()              : { date, quests, totalRewardClaimed }
//     evalAndComplete()       : évalue les conditions + marque complétées + push XP
//     getStats()              : { completedToday, totalToday, streakDays }
//     reroll()                : régénère les quêtes (DEBUG, à ne pas exposer en prod)
//   }
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── Pool de templates de quêtes ──
  // Chaque quête a :
  //   id        : string unique
  //   title     : titre court (UI)
  //   desc      : description longue (UI hover/details)
  //   icon      : emoji
  //   reward    : XP gagné
  //   evaluate  : fn(snapshot) => boolean — true si condition remplie
  //
  // 'snapshot' = { todayResults, allResults, todayActivity, lastSceneRun, ... }
  const QUEST_POOL = [
    {
      id: 'q_3runs',
      title: '3 scènes du jour',
      desc: 'Termine 3 scénarios aujourd\'hui (toutes scores acceptés)',
      icon: '🎯',
      reward: 50,
      evaluate: (snap) => snap.todayRunsCount >= 3,
    },
    {
      id: 'q_easy_perfect',
      title: 'Maîtrise débutant',
      desc: 'Termine une scène Facile avec ≥90%',
      icon: '🌱',
      reward: 35,
      evaluate: (snap) => snap.todayRuns.some(r => r.difficulty === 'easy' && r.pct >= 90),
    },
    {
      id: 'q_hard_70',
      title: 'Affûtage Difficile',
      desc: 'Termine une scène Difficile avec ≥70%',
      icon: '🔥',
      reward: 60,
      evaluate: (snap) => snap.todayRuns.some(r => r.difficulty === 'hard' && r.pct >= 70),
    },
    {
      id: 'q_expert_60',
      title: 'Test Expert',
      desc: 'Termine une scène Expert avec ≥60%',
      icon: '⚔️',
      reward: 80,
      evaluate: (snap) => snap.todayRuns.some(r => r.difficulty === 'expert' && r.pct >= 60),
    },
    {
      id: 'q_no_critical',
      title: 'Sans erreur critique',
      desc: 'Termine une scène sans aucune erreur critique',
      icon: '🛡️',
      reward: 40,
      evaluate: (snap) => snap.todayRuns.some(r => !r.hadCriticalError),
    },
    {
      id: 'q_eu_scene',
      title: 'Coopération européenne',
      desc: 'Termine une scène marquée 🇪🇺 EU',
      icon: '🇪🇺',
      reward: 50,
      evaluate: (snap) => snap.todayRuns.some(r => r.isEU),
    },
    {
      id: 'q_procureur',
      title: 'Mode Procureur',
      desc: 'Termine une scène en mode Procureur (timer + erreur critique = fin)',
      icon: '⚖️',
      reward: 70,
      evaluate: (snap) => snap.todayRuns.some(r => r.mode === 'procureur'),
    },
    {
      id: 'q_improve',
      title: 'Battre un score',
      desc: 'Améliore le score d\'une scène déjà jouée précédemment',
      icon: '📈',
      reward: 45,
      evaluate: (snap) => snap.todayRuns.some(r => r.improvedScore === true),
    },
    {
      id: 'q_2_themes',
      title: 'Polyvalence',
      desc: 'Termine 2 scènes avec des thèmes (tags) différents',
      icon: '🎨',
      reward: 50,
      evaluate: (snap) => {
        const themes = new Set();
        snap.todayRuns.forEach(r => (r.tags || []).forEach(t => themes.add(t)));
        return themes.size >= 2 && snap.todayRuns.length >= 2;
      },
    },
    {
      id: 'q_first_try',
      title: 'Première tentative',
      desc: 'Termine une scène jamais jouée avant (≥60%)',
      icon: '✨',
      reward: 55,
      evaluate: (snap) => snap.todayRuns.some(r => r.firstAttempt === true && r.pct >= 60),
    },
    {
      id: 'q_perfect_run',
      title: 'Sans-faute',
      desc: 'Termine une scène avec 100%',
      icon: '💯',
      reward: 75,
      evaluate: (snap) => snap.todayRuns.some(r => r.pct >= 100),
    },
    {
      id: 'q_double_session',
      title: 'Session intensive',
      desc: 'Joue 2 scènes consécutives (intervalle <30min)',
      icon: '⏱️',
      reward: 40,
      evaluate: (snap) => {
        if (snap.todayRuns.length < 2) return false;
        const sorted = [...snap.todayRuns].sort((a, b) => a.ts - b.ts);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].ts - sorted[i-1].ts < 30 * 60 * 1000) return true;
        }
        return false;
      },
    },
  ];

  function lsGet(k, fb) {
    try { const r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); }
    catch (_) { return fb; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {}
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  // ── PRNG seedé par la date pour rotation déterministe ──
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function dateToSeed(dateStr) {
    // Hash simple : YYYY-MM-DD → entier 32-bit
    let h = 0;
    for (let i = 0; i < dateStr.length; i++) {
      h = ((h << 5) - h) + dateStr.charCodeAt(i);
      h |= 0;
    }
    return h;
  }

  function pickQuestsForDate(dateStr, count = 3) {
    const rng = mulberry32(dateToSeed(dateStr));
    const pool = [...QUEST_POOL];
    const picked = [];
    while (picked.length < count && pool.length > 0) {
      const idx = Math.floor(rng() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    return picked;
  }

  // ── Récupération / génération des quêtes du jour ──
  function getToday() {
    const today = todayISO();
    let state = lsGet('cas_daily_quests', null);
    if (!state || state.date !== today) {
      // Rotation : nouveau jour → nouveaux quests
      const picked = pickQuestsForDate(today);
      state = {
        date: today,
        quests: picked.map(q => ({
          id: q.id,
          title: q.title,
          desc: q.desc,
          icon: q.icon,
          reward: q.reward,
          completed: false,
          completedAt: null,
        })),
        totalRewardClaimed: 0,
      };
      lsSet('cas_daily_quests', state);
    }
    return state;
  }

  // ── Construit un snapshot pour l'évaluation ──
  function buildSnapshot() {
    const today = todayISO();
    const allResults = lsGet('scene_results', {});
    const todayResults = {};
    Object.entries(allResults).forEach(([id, r]) => {
      // r.date est en format 'fr' (ex: '04/05/2026'), pas ISO. On compare via timestamp si dispo.
      // Dans scene-app.js, on stocke aussi runRecord ts dans cas_leaderboards, donc on peut croiser.
      if (r.date && isSameDayFR(r.date, new Date())) {
        todayResults[id] = r;
      }
    });

    // Récupérer les runs détaillés du jour depuis le bridge buffer
    const runBuffer = lsGet('cas_run_buffer', []);
    const todayRuns = runBuffer.filter(r => r.dateISO === today);

    return {
      todayResults,
      allResults,
      todayRuns,
      todayRunsCount: todayRuns.length,
    };
  }

  function isSameDayFR(frDate, jsDate) {
    // '04/05/2026' === jour courant ?
    const d = jsDate.getDate().toString().padStart(2, '0');
    const m = (jsDate.getMonth() + 1).toString().padStart(2, '0');
    const y = jsDate.getFullYear();
    return frDate === `${d}/${m}/${y}`;
  }

  // ── Évalue les quêtes + marque complétées + push XP via Profile ──
  function evalAndComplete() {
    const state = getToday();
    const snapshot = buildSnapshot();
    let xpToAdd = 0;
    const newlyCompleted = [];

    state.quests.forEach(q => {
      if (q.completed) return;
      const tmpl = QUEST_POOL.find(t => t.id === q.id);
      if (!tmpl || typeof tmpl.evaluate !== 'function') return;
      try {
        if (tmpl.evaluate(snapshot)) {
          q.completed = true;
          q.completedAt = Date.now();
          xpToAdd += q.reward;
          state.totalRewardClaimed += q.reward;
          newlyCompleted.push(q);
        }
      } catch (e) {
        console.warn('[Quests] evaluate error for ' + q.id, e);
      }
    });

    if (newlyCompleted.length > 0) {
      lsSet('cas_daily_quests', state);
      // Push XP via Profile (source dédiée)
      if (window.Profile && typeof window.Profile.addXp === 'function' && xpToAdd > 0) {
        try { window.Profile.addXp(xpToAdd, 'quest', { questIds: newlyCompleted.map(q => q.id) }); } catch (_) {}
      }
      // Toast pour feedback utilisateur
      if (typeof window.showToast === 'function') {
        newlyCompleted.forEach(q => {
          window.showToast(`${q.icon} Quête : ${q.title} → +${q.reward} XP`);
        });
      }
      // Event pour rafraîchir les UI consommatrices
      try {
        window.dispatchEvent(new CustomEvent('quests-changed', {
          detail: { newlyCompleted, totalXp: xpToAdd }
        }));
      } catch (_) {}
    }

    return { newlyCompleted, xpToAdd };
  }

  function getStats() {
    const state = getToday();
    const completedToday = state.quests.filter(q => q.completed).length;
    return {
      completedToday,
      totalToday: state.quests.length,
      totalRewardClaimed: state.totalRewardClaimed,
      date: state.date,
    };
  }

  function reroll() {
    // DEBUG : régénère les quêtes du jour (efface l'état)
    localStorage.removeItem('cas_daily_quests');
    return getToday();
  }

  // ── API publique ──
  if (typeof window !== 'undefined') {
    window.Quests = {
      getToday,
      evalAndComplete,
      getStats,
      reroll,
      QUEST_POOL,
    };
  }
})();
