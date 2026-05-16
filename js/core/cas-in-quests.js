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
      // Tags pour le bonus de rôle : entraide internationale → magistrate
      tags: ['EIMP', 'PROCEDURE', 'COOPERATION INTERNATIONALE'],
      evaluate: (snap) => snap.todayRuns.some(r => r.isEU),
    },
    {
      id: 'q_procureur',
      title: 'Mode Procureur',
      desc: 'Termine une scène en mode Procureur (timer + erreur critique = fin)',
      icon: '⚖️',
      reward: 70,
      // Tags pour le bonus de rôle : mode procureur → magistrate
      tags: ['DROIT', 'PROCUREUR', 'CPP'],
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
    // ─── v2.57 (volet E) : Quêtes spécifiques quiz ───
    // Évaluées sur cas_quiz_run_buffer (rotation quotidienne).
    {
      id: 'q_quiz_20',
      title: 'Quiz du jour',
      desc: "Réponds à 20 questions du quiz aujourd'hui (peu importe le score)",
      icon: '📚',
      reward: 35,
      evaluate: (snap) => snap.todayQuizAnswers >= 20,
    },
    {
      id: 'q_quiz_streak10',
      title: 'Combo 10',
      desc: '10 bonnes réponses consécutives au quiz',
      icon: '⚡',
      reward: 50,
      evaluate: (snap) => snap.todayQuizMaxStreak >= 10,
    },
    {
      id: 'q_quiz_hard_5',
      title: 'Discipline Hard',
      desc: '5 bonnes réponses sur des questions Difficile (peu importe le thème)',
      icon: '🔥',
      reward: 60,
      evaluate: (snap) => snap.todayQuizCorrectByDiff.hard >= 5,
    },
    {
      id: 'q_quiz_acc_80',
      title: 'Précision 80%+',
      desc: 'Atteins 80% de précision sur ≥30 questions du jour',
      icon: '🎯',
      reward: 55,
      evaluate: (snap) => snap.todayQuizAnswers >= 30 && snap.todayQuizAccuracy >= 80,
    },
    {
      id: 'q_quiz_3_themes',
      title: 'Tour des thèmes',
      desc: 'Réponds correctement à des questions sur ≥3 thèmes différents',
      icon: '🎨',
      reward: 45,
      evaluate: (snap) => snap.todayQuizCorrectThemes >= 3,
    },
    {
      id: 'q_quiz_speed_5',
      title: 'Vitesse éclair',
      desc: '5 réponses correctes en moins de 5 secondes (sans indice)',
      icon: '⚡',
      reward: 50,
      evaluate: (snap) => snap.todayQuizSpeedAnswers >= 5,
    },
    {
      id: 'q_quiz_no_hint',
      title: 'Sans indice',
      desc: '15 bonnes réponses sans utiliser l\'indice',
      icon: '🧠',
      reward: 45,
      evaluate: (snap) => snap.todayQuizCorrectNoHint >= 15,
    },
    {
      id: 'q_mixed_session',
      title: 'Polyvalence DFIR',
      desc: '1 scène complétée + 15 questions répondues le même jour',
      icon: '🌐',
      reward: 65,
      evaluate: (snap) => snap.todayRunsCount >= 1 && snap.todayQuizAnswers >= 15,
    },
    // ──── v2.71 — Quêtes de relations PNJ ────
    {
      id: 'q_npc_3_complices',
      title: 'Cercle de confiance',
      desc: 'Atteins le statut "complice" avec 3 personnages différents',
      icon: '🤝',
      reward: 100,
      evaluate: (snap) => {
        if (!window.NpcState) return false;
        const counts = window.NpcState.getCounts();
        return counts.complice >= 3;
      },
    },
    {
      id: 'q_npc_first_contact',
      title: 'Premier contact',
      desc: 'Établis une relation avec au moins un PNJ aujourd\'hui',
      icon: '👋',
      reward: 30,
      evaluate: (snap) => {
        if (!window.NpcState) return false;
        return window.NpcState.getEncountered().length > 0;
      },
    },
    {
      id: 'q_npc_no_hostile',
      title: 'Diplomate',
      desc: 'Aucune relation hostile (0 PNJ avec trust ≤ 25)',
      icon: '🕊️',
      reward: 50,
      evaluate: (snap) => {
        if (!window.NpcState) return false;
        const encountered = window.NpcState.getEncountered();
        if (encountered.length === 0) return false;  // doit avoir des relations
        const counts = window.NpcState.getCounts();
        return counts.hostile === 0;
      },
    },
    // ──── v3.2.4 — Quêtes liées aux campagnes v3.2 ────
    {
      id: 'q_campaign_progress',
      title: 'Avance de campagne',
      desc: 'Valide (≥60%) une scène appartenant à une campagne du tableau des dossiers',
      icon: '📂',
      reward: 50,
      evaluate: (snap) => {
        // Au moins 1 run validé aujourd'hui suffit (toutes les scènes sont
        // dans au moins une campagne, donc équivalent à "scène validée").
        return snap.todayRuns.some(r => r.pct >= 60);
      },
    },
    {
      id: 'q_saga_act',
      title: 'Acte de saga',
      desc: 'Joue un acte d\'une saga narrative (Viège, Sarine, Initiation DFIR)',
      icon: '🎬',
      reward: 60,
      evaluate: (snap) => {
        return snap.todayRuns.some(r => {
          const id = r.sceneId || '';
          return id.startsWith('vs-affaire-viege-')
              || id.startsWith('fr-affaire-sarine-')
              || id.startsWith('easy-'); // Initiation DFIR débute par easy-
        });
      },
    },
    {
      id: 'q_branch_focus',
      title: 'Spécialisation du jour',
      desc: 'Termine 2 scènes de la même branche (Forensique, Droit, Windows, Crypto, Réseau, International)',
      icon: '🎯',
      reward: 70,
      evaluate: (snap) => {
        if (snap.todayRuns.length < 2) return false;
        // Regroupe les tags des runs et cherche une branche citée ≥2 fois
        const BRANCH_TAGS = ['FORENSIQUE', 'DROIT', 'WINDOWS', 'CRYPTO', 'RÉSEAUX', 'COOPÉRATION INTERNATIONALE'];
        for (const branch of BRANCH_TAGS) {
          const count = snap.todayRuns.filter(r => 
            (r.tags || []).some(t => (t || '').toUpperCase() === branch)
          ).length;
          if (count >= 2) return true;
        }
        return false;
      },
    },
    // ═══════════════════════════════════════════════════════════
    // Phase 6 v3.1 — Quêtes TP (Travaux Pratiques)
    //
    // S'évaluent sur les stats du jour calculées dans buildSnapshot :
    //   • tpSolvedTodayTotal     : somme des incréments du jour
    //   • tpDistinctCatsToday    : nb de cats avec au moins 1 résolution today
    //   • tpCompletedCatsToday   : nb de cats ayant atteint CAT_MAX (5) today
    //   • toolsDistinctToday     : nb d'outils distincts utilisés today
    //   • tpStreak               : tp_streak courant (non-day-bound, c'est OK)
    //
    // Le calcul utilise tp_solved_snapshot_YYYY-MM-DD (snapshot du début
    // de journée), comparé au tp_solved courant. Idem pour tools_used.
    // Pas de refactor de tp-engine.js requis : pure instrumentation passive
    // côté buildSnapshot.
    // ═══════════════════════════════════════════════════════════
    {
      id: 'q_tp_5today',
      title: '5 TP du jour',
      desc: 'Résous 5 exercices TP aujourd\'hui (toutes catégories)',
      icon: '🧩',
      reward: 40,
      evaluate: (snap) => snap.tpSolvedTodayTotal >= 5,
    },
    {
      id: 'q_tp_streak5',
      title: 'Série de 5 TP',
      desc: 'Atteins une série de 5 bonnes réponses consécutives',
      icon: '🔥',
      reward: 35,
      evaluate: (snap) => snap.tpStreak >= 5,
    },
    {
      id: 'q_tp_3cats',
      title: 'Polyvalence DFIR',
      desc: 'Résous au moins 1 TP dans 3 catégories différentes aujourd\'hui',
      icon: '🎭',
      reward: 55,
      evaluate: (snap) => snap.tpDistinctCatsToday >= 3,
    },
    {
      id: 'q_tp_master_cat',
      title: 'Maîtrise d\'une discipline',
      desc: 'Termine une catégorie aujourd\'hui (5 réussites dans la même cat)',
      icon: '🥇',
      reward: 60,
      evaluate: (snap) => snap.tpCompletedCatsToday >= 1,
    },
    {
      id: 'q_tools_3today',
      title: 'Boîte à outils ouverte',
      desc: 'Utilise au moins 3 calculateurs forensiques différents aujourd\'hui',
      icon: '🛠️',
      reward: 30,
      evaluate: (snap) => snap.toolsDistinctToday >= 3,
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
    // v2.57 : tirage stratifié scène + quiz
    // Phase 6 v3.1 : ajout d'un 3e bucket TP/tools pour mix équitable
    const tpQuests    = QUEST_POOL.filter(q => q.id.startsWith('q_tp_') || q.id.startsWith('q_tools_'));
    const quizQuests  = QUEST_POOL.filter(q => q.id.startsWith('q_quiz') || q.id === 'q_mixed_session');
    const sceneQuests = QUEST_POOL.filter(q => !tpQuests.includes(q) && !quizQuests.includes(q));
    const picked = [];
    const used = new Set();

    // Au moins 1 quête de chaque type, dans l'ordre tp → quiz → scene
    // (l'ordre seedé garantit le déterminisme jour-par-jour)
    for (const bucket of [tpQuests, quizQuests, sceneQuests]) {
      if (picked.length >= count) break;
      if (bucket.length === 0) continue;
      const idx = Math.floor(rng() * bucket.length);
      picked.push(bucket[idx]);
      used.add(bucket[idx].id);
    }

    // Remplir le reste si count > 3 ou si un bucket est vide
    while (picked.length < count) {
      const remaining = QUEST_POOL.filter(q => !used.has(q.id));
      if (remaining.length === 0) break;
      const idx = Math.floor(rng() * remaining.length);
      picked.push(remaining[idx]);
      used.add(remaining[idx].id);
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

    // ─── v2.57 (volet E) : Agrégats quiz du jour ───
    // Source : cas_quiz_run_buffer (1 entrée par réponse, 200 max/jour)
    const quizBuffer = lsGet('cas_quiz_run_buffer', []);
    const todayQuiz = quizBuffer.filter(r => r.dateISO === today);
    const todayQuizCorrect = todayQuiz.filter(r => r.ok);
    // Streaks : la plus longue suite consécutive de bonnes réponses du jour
    let curStreak = 0, maxStreak = 0;
    todayQuiz.forEach(r => {
      if (r.ok) { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
      else { curStreak = 0; }
    });
    // Bonnes réponses par difficulté
    const correctByDiff = { easy: 0, medium: 0, hard: 0 };
    todayQuizCorrect.forEach(r => { if (correctByDiff[r.diff] !== undefined) correctByDiff[r.diff]++; });
    // Thèmes distincts dans bonnes réponses
    const correctThemes = new Set(todayQuizCorrect.map(r => r.theme).filter(Boolean));

    // ─── Phase 6 v3.1 : Agrégats TP + tools du jour ───
    // Stratégie sans refactor de tp-engine : on snapshot le compteur tp_solved
    // au premier appel de la journée, et on calcule today = current - snapshot.
    // Idem pour tools_used.
    const tpSolvedNow   = lsGet('tp_solved', {}) || {};
    const toolsUsedNow  = lsGet('tools_used', {}) || {};
    const snapshotKey   = 'cas_daily_baselines_' + today;
    let baselines = lsGet(snapshotKey, null);
    if (!baselines) {
      // Premier appel de la journée : on snapshot l'état courant comme baseline
      baselines = {
        tpSolved:   { ...tpSolvedNow },
        toolsUsed:  { ...toolsUsedNow },
      };
      lsSet(snapshotKey, baselines);
    }

    // Calcule les deltas du jour (= ce qui a été ajouté depuis le baseline)
    const tpDeltaByCat = {};
    let tpSolvedTodayTotal = 0;
    Object.keys(tpSolvedNow).forEach(cat => {
      const delta = (parseInt(tpSolvedNow[cat], 10) || 0) - (parseInt(baselines.tpSolved[cat] || 0, 10) || 0);
      if (delta > 0) {
        tpDeltaByCat[cat] = delta;
        tpSolvedTodayTotal += delta;
      }
    });
    const tpDistinctCatsToday = Object.keys(tpDeltaByCat).length;

    // "Catégories terminées aujourd'hui" : celles qui sont passées à >= CAT_MAX
    // (par défaut 5) PENDANT la journée. On regarde : compteur courant >= 5 ET
    // ce n'était pas déjà le cas au baseline.
    const CAT_MAX_DEFAULT = 5;
    let tpCompletedCatsToday = 0;
    Object.keys(tpDeltaByCat).forEach(cat => {
      const wasComplete = (parseInt(baselines.tpSolved[cat] || 0, 10) || 0) >= CAT_MAX_DEFAULT;
      const isComplete  = (parseInt(tpSolvedNow[cat], 10) || 0) >= CAT_MAX_DEFAULT;
      if (!wasComplete && isComplete) tpCompletedCatsToday++;
    });

    // Tools distincts utilisés today (au moins 1 incrément vs baseline)
    let toolsDistinctToday = 0;
    Object.keys(toolsUsedNow).forEach(k => {
      const cur = parseInt(toolsUsedNow[k], 10) || 0;
      const base = parseInt(baselines.toolsUsed[k] || 0, 10) || 0;
      if (cur > base) toolsDistinctToday++;
    });

    // tp_streak n'est pas day-bound mais c'est OK : streak = série courante,
    // c'est par nature transient et peut se réinitialiser à tout moment.
    const tpStreak = parseInt(lsGet('tp_streak', '0'), 10) || 0;

    return {
      // Stats scènes (existant)
      todayResults,
      allResults,
      todayRuns,
      todayRunsCount: todayRuns.length,
      // Stats quiz (v2.57)
      todayQuizAnswers: todayQuiz.length,
      todayQuizCorrect: todayQuizCorrect.length,
      todayQuizAccuracy: todayQuiz.length > 0
        ? Math.round((todayQuizCorrect.length / todayQuiz.length) * 100)
        : 0,
      todayQuizMaxStreak: maxStreak,
      todayQuizCorrectByDiff: correctByDiff,
      todayQuizCorrectThemes: correctThemes.size,
      todayQuizSpeedAnswers: todayQuiz.filter(r => r.ok && r.speedAnswer).length,
      todayQuizCorrectNoHint: todayQuiz.filter(r => r.ok && !r.hintUsed).length,
      // Stats TP + tools (Phase 6 v3.1)
      tpSolvedTodayTotal,
      tpDistinctCatsToday,
      tpCompletedCatsToday,
      tpDeltaByCat,
      toolsDistinctToday,
      tpStreak,
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
      // v2.85 — Fix : on passe meta.tags (le format attendu par addXp pour
      // calculer le bonus de rôle) au lieu de questIds qui était silencieusement
      // ignoré. Une quête peut optionnellement déclarer un champ `tags` dans
      // QUEST_POOL ; sinon on agrège les tags des quêtes complétées (pratique
      // si on ajoute tags: ['DROIT'] sur q_procureur, par ex.).
      if (window.Profile && typeof window.Profile.addXp === 'function' && xpToAdd > 0) {
        const tags = newlyCompleted
          .flatMap(q => Array.isArray(q.tags) ? q.tags : [])
          .filter(Boolean);
        try { window.Profile.addXp(xpToAdd, 'quest', { tags }); } catch (_) {}
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
