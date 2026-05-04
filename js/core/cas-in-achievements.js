// ═══════════════════════════════════════════════════════════════
// cas-in-achievements.js — Source unique des achievements (v3)
//
// Ce module définit TOUTES les métadonnées des succès, regroupe les
// checks centralisables (TP, fiches, scènes) et expose un helper
// `evalAndUnlock(snap)` qui pousse les nouveaux unlocks vers Profile.
//
// Quiz : les checks restent dans quiz-app.js (basés sur l'état runtime
// du quiz S, pas reconstructibles depuis Profile.snapshot). Quiz utilise
// toujours Profile.unlockAchievement() via le bridge legacy 'achievements'.
//
// Scène : les checks GLOBAL_BADGES restent dans scene-app.js (utilisent
// scene_results + plein de compteurs cas_*). Le scene-profile-bridge
// appelle window.getUnlockedBadges() à chaque fin de scène et synchronise.
//
// TP / Fiches : checks définis ici, évalués depuis Profile.snapshot()
// + lecture directe de quelques clés localStorage. Appelés par
// tp-profile-bridge et profile-page (catch-up à l'affichage).
//
// Expose :
//   window.ACHIEVEMENTS_META  — tableau plat (compat existant)
//   window.AchievementsCore   — { evalAndUnlock, byId, byCategory,
//                                 CATEGORIES, getProgress }
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── Lecture LS sécurisée (les checks TP/fiches en ont besoin) ──
  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (_) { return fallback; }
  }

  // ─────────────────────────────────────────────────────────────
  // Catégories (ordre d'affichage dans le profil)
  // ─────────────────────────────────────────────────────────────
  const CATEGORIES = [
    'Quiz · Quantité',
    'Quiz · Séries',
    'Quiz · Précision',
    'Quiz · Combo',
    'Quiz · Difficile',
    'Quiz · Régularité',
    'Quiz · Spécial',
    'Scènes · Progression',
    'Scènes · Spécialité',
    'Scènes · Éthique',
    'Scènes · Modes',
    'Scènes · Europe',
    'Scènes · Arcs PNJ',
    'Scènes · Comportement',
    'TP · Pratique',
    'Fiches · Lecture',
    'Secrets 🤫',
  ];

  // ─────────────────────────────────────────────────────────────
  // QUIZ — 41 entrées (metadata seul ; checks en quiz-app.js)
  // ─────────────────────────────────────────────────────────────
  const QUIZ_ACH = [
    { id: 'first',     emoji: '🎯',   name: 'Premier pas',         desc: 'Répondre à 1 question',          category: 'Quiz · Quantité',
      progress: s => ({ current: s.stats.questions, target: 1 }) },
    { id: 'ten',       emoji: '🔟',   name: 'Décollage',           desc: 'Répondre à 10 questions',        category: 'Quiz · Quantité',
      progress: s => ({ current: s.stats.questions, target: 10 }) },
    { id: 'fifty',     emoji: '5️⃣0️⃣', name: 'Cinquantaine',        desc: 'Répondre à 50 questions',        category: 'Quiz · Quantité',
      progress: s => ({ current: s.stats.questions, target: 50 }) },
    { id: 'hundred',   emoji: '💯',   name: 'Centurion',           desc: 'Répondre à 100 questions',       category: 'Quiz · Quantité',
      progress: s => ({ current: s.stats.questions, target: 100 }) },
    { id: 'five00',    emoji: '🚀',   name: 'Marathon',            desc: 'Répondre à 500 questions',       category: 'Quiz · Quantité',
      progress: s => ({ current: s.stats.questions, target: 500 }) },
    { id: 'thou',      emoji: '🌟',   name: 'Millénaire',          desc: 'Répondre à 1000 questions',      category: 'Quiz · Quantité',
      progress: s => ({ current: s.stats.questions, target: 1000 }) },
    { id: 'twoK',      emoji: '🔱',   name: 'Légende vivante',     desc: 'Répondre à 2000 questions',      category: 'Quiz · Quantité',
      progress: s => ({ current: s.stats.questions, target: 2000 }) },

    { id: 'streak1',   emoji: '✊',   name: 'La première',         desc: '1 bonne réponse',                  category: 'Quiz · Séries' },
    { id: 'streak3',   emoji: '⚡',   name: "C'est parti !",       desc: '3 bonnes réponses de suite',     category: 'Quiz · Séries' },
    { id: 'streak5',   emoji: '🔥',   name: 'Série de feu',        desc: '5 bonnes réponses de suite',     category: 'Quiz · Séries' },
    { id: 'streak10',  emoji: '💥',   name: 'Inarrêtable',         desc: '10 bonnes réponses de suite',    category: 'Quiz · Séries' },
    { id: 'streak20',  emoji: '🌋',   name: 'Mode Dieu',           desc: '20 bonnes réponses de suite',    category: 'Quiz · Séries' },
    { id: 'streak50',  emoji: '👑',   name: 'Légende de la série', desc: '50 bonnes réponses de suite',    category: 'Quiz · Séries' },

    { id: 'acc90',     emoji: '🎓',   name: 'Précision laser',     desc: '90%+ sur 50 questions min.',     category: 'Quiz · Précision' },
    { id: 'acc95',     emoji: '💎',   name: 'Mode élite',          desc: '95%+ sur 100 questions min.',    category: 'Quiz · Précision' },
    { id: 'perfect',   emoji: '🏆',   name: 'Examen parfait',      desc: '100% à un examen ≥ 10 Q',        category: 'Quiz · Précision' },
    { id: 'perfect20', emoji: '🎖️',   name: "Héros de l'examen",   desc: '100% à un examen ≥ 20 Q',        category: 'Quiz · Précision' },

    { id: 'combo',     emoji: '⚡',   name: 'Combinaison ×2',      desc: 'Atteindre le multiplicateur ×2', category: 'Quiz · Combo' },
    { id: 'combo3',    emoji: '🔱',   name: 'Triple Kill',         desc: 'Atteindre le multiplicateur ×3', category: 'Quiz · Combo' },

    { id: 'hard10',    emoji: '💀',   name: 'Masochiste',          desc: '10 questions difficiles correctes', category: 'Quiz · Difficile' },
    { id: 'hard50',    emoji: '🔥',   name: 'Cherche la douleur',  desc: '50 questions difficiles correctes', category: 'Quiz · Difficile' },

    { id: 'daily3',    emoji: '📅',   name: 'Régularité',          desc: 'Jouer 3 jours de suite',         category: 'Quiz · Régularité',
      progress: s => ({ current: s.streak.current, target: 3 }) },
    { id: 'daily7',    emoji: '🗓️',   name: 'Abonné',              desc: 'Jouer 7 jours de suite',         category: 'Quiz · Régularité',
      progress: s => ({ current: s.streak.current, target: 7 }) },
    { id: 'daily10',   emoji: '🔟',   name: 'Double semaine',      desc: 'Jouer 10 jours de suite',        category: 'Quiz · Régularité',
      progress: s => ({ current: s.streak.current, target: 10 }) },
    { id: 'daily14',   emoji: '📆',   name: 'Quinzaine',           desc: 'Jouer 14 jours de suite',        category: 'Quiz · Régularité',
      progress: s => ({ current: s.streak.current, target: 14 }) },
    { id: 'daily30',   emoji: '🏅',   name: 'Mensuel',             desc: 'Jouer 30 jours de suite',        category: 'Quiz · Régularité',
      progress: s => ({ current: s.streak.current, target: 30 }) },

    { id: 'night',     emoji: '🌙',   name: 'Nuit blanche',        desc: 'Jouer après minuit',             category: 'Quiz · Spécial' },
    { id: 'comeback',  emoji: '🦋',   name: 'Come-back',           desc: '5 bonnes après 3 mauvaises',     category: 'Quiz · Spécial' },
    { id: 'allthemes', emoji: '🗺️',   name: 'Polymathes',          desc: 'Réponses dans 5 thèmes diff.',  category: 'Quiz · Spécial' },
    { id: 'book10',    emoji: '⭐',   name: 'Collectionneur',      desc: '10 questions favorites',         category: 'Quiz · Spécial' },
    { id: 'book25',    emoji: '📚',   name: 'Bibliothécaire',      desc: '25 questions favorites',         category: 'Quiz · Spécial' },
    { id: 'smart50',   emoji: '🧠',   name: 'Révision ×50',        desc: '50 Q en Révision Intelligente', category: 'Quiz · Spécial' },
    { id: 'smart200',  emoji: '🤖',   name: 'Machine de révision', desc: '200 Q en Révision Intelligente', category: 'Quiz · Spécial' },
    { id: 'daily_ch',  emoji: '⚡',   name: 'Défi relevé',         desc: 'Terminer le défi du jour',       category: 'Quiz · Spécial' },
    { id: 'hint',      emoji: '💡',   name: 'J\'avais besoin d\'un coup de pouce', desc: 'Utiliser un indice', category: 'Quiz · Spécial' },

    // Secrets quiz
    { id: 's_3am',     emoji: '🦇',   name: '???', desc: '???', category: 'Secrets 🤫', secret: true },
    { id: 's_42',      emoji: '🌌',   name: '???', desc: '???', category: 'Secrets 🤫', secret: true },
    { id: 's_13',      emoji: '🎱',   name: '???', desc: '???', category: 'Secrets 🤫', secret: true },
    { id: 's_hints3',  emoji: '🧙',   name: '???', desc: '???', category: 'Secrets 🤫', secret: true },
    { id: 's_speed5',  emoji: '🏎️',   name: '???', desc: '???', category: 'Secrets 🤫', secret: true },
    { id: 's_skip',    emoji: '🙈',   name: '???', desc: '???', category: 'Secrets 🤫', secret: true },
  ];

  // ─────────────────────────────────────────────────────────────
  // SCÈNES — métadonnées miroir des GLOBAL_BADGES (scene-app.js)
  // Les checks restent dans scene-app.js. On ne fournit ici que
  // emoji / nom / desc / catégorie pour l'affichage profil.
  // ─────────────────────────────────────────────────────────────
  const SCENE_ACH = [
    // Progression
    { id: 'first_blood',     emoji: '🩸', name: 'Premier sang',        desc: 'Premier scénario complété',         category: 'Scènes · Progression' },
    { id: 'rookie_5',        emoji: '🥉', name: 'Recrue',              desc: '5 scénarios complétés',             category: 'Scènes · Progression' },
    { id: 'veteran_10',      emoji: '🥈', name: 'Vétéran',             desc: '10 scénarios complétés',            category: 'Scènes · Progression' },
    { id: 'completionist',   emoji: '🥇', name: 'Complétionniste',     desc: 'Tous les scénarios complétés',      category: 'Scènes · Progression' },
    { id: 'chain_master',    emoji: '⛓',  name: 'Maître de la chaîne', desc: '100% custody sur 3 scénarios',      category: 'Scènes · Progression' },
    { id: 'perfectionist',   emoji: '💎', name: 'Perfectionniste',     desc: '100% de score sur un scénario',     category: 'Scènes · Progression' },

    // Spécialité par tag
    { id: 'ransom_expert',   emoji: '💀', name: 'Spé. Ransomware',     desc: '3 scénarios RANSOMWARE ≥80%',       category: 'Scènes · Spécialité' },
    { id: 'crypto_sage',     emoji: '🔐', name: 'Sage du chiffrement', desc: '2 scénarios CRYPTO ≥80%',           category: 'Scènes · Spécialité' },
    { id: 'forensic_pro',    emoji: '🔬', name: 'Pro du forensique',   desc: '5 scénarios FORENSIQUE ≥80%',       category: 'Scènes · Spécialité' },
    { id: 'swiss_jurist',    emoji: '⚖️', name: 'Juriste confirmé',    desc: '4 scénarios DROIT ≥80%',            category: 'Scènes · Spécialité' },
    { id: 'windows_guru',    emoji: '🪟', name: 'Guru Windows',        desc: '3 scénarios WINDOWS ≥80%',          category: 'Scènes · Spécialité' },
    { id: 'network_ninja',   emoji: '🌐', name: 'Ninja réseau',        desc: '3 scénarios RÉSEAUX ≥80%',          category: 'Scènes · Spécialité' },

    // Éthique
    { id: 'ethics_warden',   emoji: '🛡',  name: "Gardien de l'éthique",     desc: '0 erreur critique sur 5 scénarios',  category: 'Scènes · Éthique' },
    { id: 'ethics_knight',   emoji: '🛡️', name: 'Chevalier déontologique',   desc: '0 erreur critique sur 10 scénarios', category: 'Scènes · Éthique' },
    { id: 'ethics_legend',   emoji: '✨', name: 'Conscience irréprochable',  desc: '0 erreur critique sur 20 scénarios', category: 'Scènes · Éthique' },
    { id: 'expert_clean',    emoji: '🎖️', name: 'Procureur·e sans faute',    desc: 'Mode Expert complété sans erreur',   category: 'Scènes · Éthique' },

    // Modes
    { id: 'speed_demon',     emoji: '⚡', name: 'Démon de la vitesse', desc: 'Mode Procureur complété ≥70%',      category: 'Scènes · Modes' },
    { id: 'prosecutor',      emoji: '🏛',  name: 'Accusation implacable', desc: '3 scénarios Procureur ≥70%',     category: 'Scènes · Modes' },
    { id: 'historian',       emoji: '📜', name: 'Historien du DFIR',   desc: '3 affaires réelles ≥70%',           category: 'Scènes · Modes' },

    // Europe
    { id: 'eu_first_mlat',   emoji: '🇪🇺', name: 'Premier MLAT',         desc: 'Premier scénario européen complété', category: 'Scènes · Europe' },
    { id: 'eu_jit_master',   emoji: '🤝', name: 'JIT Master',          desc: '3 scénarios EU ≥80%',                category: 'Scènes · Europe' },
    { id: 'eu_budapest_spec',emoji: '📜', name: 'Spé. Budapest',       desc: '5 scénarios européens complétés',    category: 'Scènes · Europe' },
    { id: 'eu_eurojust_vet', emoji: '⚖️', name: 'Eurojust Veteran',    desc: '5 scénarios EU ≥80%',                category: 'Scènes · Europe' },
    { id: 'eu_tour_europe',  emoji: '🌍', name: "Tour d'Europe",       desc: 'Tous les scénarios EU complétés',    category: 'Scènes · Europe' },

    // ─── Arcs PNJ (méta-gamification v2.48) ───
    // Badges débloqués lorsque le candidat complète tous les stages d'un arc narratif PNJ
    { id: 'arc_schoeb',      emoji: '👤📈', name: 'Le Traqueur Ransomware', desc: 'Arc Schöb complété : Xplain → Cronos III → Endgame Phase 2', category: 'Scènes · Arcs PNJ' },
    { id: 'arc_tremp',       emoji: '👤🔬', name: "L'Architecte Forensique", desc: 'Arc Tremp complété : timeline → trois_artefacts → veracrypt → custody → frontex-deepfake', category: 'Scènes · Arcs PNJ' },
    { id: 'arc_lavanchy',    emoji: '👤⚖️', name: "L'Avocat Transfrontalier", desc: 'Arc Lavanchy complété : France Travail → Free Leak', category: 'Scènes · Arcs PNJ' },
    { id: 'arc_lindgren',    emoji: '👤🌐', name: 'Le Coordinateur Européen', desc: 'Arc Lindgren complété : Magnus → Cronos III → Endgame → OnymousReborn', category: 'Scènes · Arcs PNJ' },
    { id: 'arc_hodel',       emoji: '👤⚡', name: 'La Sentinelle Énergétique', desc: 'Arc Hodel complété : Mühleberg JU → Bassecourt-Vesoul', category: 'Scènes · Arcs PNJ' },

    // Comportement
    { id: 'night_owl',       emoji: '🦉', name: 'Couche-tard',         desc: '5 scénarios complétés après 23h',   category: 'Scènes · Comportement' },
    { id: 'early_bird',      emoji: '🌅', name: 'Lève-tôt',            desc: '5 scénarios complétés avant 7h',    category: 'Scènes · Comportement' },
    { id: 'sniper',          emoji: '🎯', name: 'Sniper',              desc: '3 scénarios sans hint, 1ʳᵉ tentative', category: 'Scènes · Comportement' },
    { id: 'tour_de_suisse',  emoji: '🌐', name: 'Tour de Suisse',      desc: 'Au moins 1 scénario par canton',    category: 'Scènes · Comportement' },
    { id: 'perseverant',     emoji: '🔁', name: 'Persévérant',         desc: '+20 pts sur 3 scénarios refaits',   category: 'Scènes · Comportement' },
    { id: 'unstoppable',     emoji: '🔥', name: 'Inarrêtable',         desc: '3 scénarios ≥70% le même jour ×3',  category: 'Scènes · Comportement' },

    // v2.26 : spécialités cantonales + PNJ + thèmes techniques
    { id: 'fr_detective',    emoji: '🧀', name: 'Détective fribourgeois',  desc: '3 scénarios fribourgeois ≥80%',          category: 'Scènes · Spécialité' },
    { id: 'ti_sherlock',     emoji: '🇮🇹', name: 'Sherlock du Tessin',      desc: '3 scénarios tessinois ≥80%',             category: 'Scènes · Spécialité' },
    { id: 'vd_procureur',    emoji: '⚖️', name: 'Procureur vaudois',       desc: '5 scénarios vaudois ≥80%',                category: 'Scènes · Spécialité' },
    { id: 'apple_forensic',  emoji: '🍎', name: 'Forensicien Apple',       desc: '3 scénarios AFU/BFU iPhone-MacBook ≥80%', category: 'Scènes · Spécialité' },
    { id: 'anti_deepfake',   emoji: '🎭', name: 'Anti-deepfake',           desc: 'Scénario deepfake résolu à ≥90%',         category: 'Scènes · Spécialité' },
    { id: 'npc_collector',   emoji: '👥', name: 'Tour des protagonistes',  desc: 'Rencontrer ≥8 PNJ différents',            category: 'Scènes · Comportement' },
  ];

  // ─────────────────────────────────────────────────────────────
  // TP — checks centralisés ici (lit Profile.snapshot + tp_solved)
  // ─────────────────────────────────────────────────────────────
  function tpStats() {
    const solved = lsGet('tp_solved', {}) || {};
    const total = Object.values(solved).reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
    const cats = Object.keys(solved).filter(c => (parseInt(solved[c], 10) || 0) > 0);
    const maxInOneCat = Object.values(solved).reduce((m, v) => Math.max(m, parseInt(v, 10) || 0), 0);
    const streak = parseInt(localStorage.getItem('tp_streak') || '0', 10);
    const bestStreak = parseInt(localStorage.getItem('tp_bestStreak') || '0', 10);
    return { total, cats: cats.length, maxInOneCat, streak, bestStreak };
  }

  const TP_ACH = [
    { id: 'tp_first',         emoji: '🎯', name: 'Premier exercice',  desc: '1 TP résolu',                    category: 'TP · Pratique',
      check: () => tpStats().total >= 1,
      progress: () => ({ current: tpStats().total, target: 1 }) },
    { id: 'tp_10',            emoji: '🔧', name: 'Apprenti TP',       desc: '10 TP résolus',                  category: 'TP · Pratique',
      check: () => tpStats().total >= 10,
      progress: () => ({ current: tpStats().total, target: 10 }) },
    { id: 'tp_50',            emoji: '🛠️', name: 'Praticien',         desc: '50 TP résolus',                  category: 'TP · Pratique',
      check: () => tpStats().total >= 50,
      progress: () => ({ current: tpStats().total, target: 50 }) },
    { id: 'tp_100',           emoji: '⚙️', name: 'Artisan TP',        desc: '100 TP résolus',                 category: 'TP · Pratique',
      check: () => tpStats().total >= 100,
      progress: () => ({ current: tpStats().total, target: 100 }) },
    { id: 'tp_250',           emoji: '🏗️', name: 'Forge ouverte',     desc: '250 TP résolus',                 category: 'TP · Pratique',
      check: () => tpStats().total >= 250,
      progress: () => ({ current: tpStats().total, target: 250 }) },
    { id: 'tp_streak5',       emoji: '🔥', name: 'Régularité TP',     desc: 'Série de 5 TP corrects',         category: 'TP · Pratique',
      check: () => tpStats().bestStreak >= 5,
      progress: () => ({ current: tpStats().bestStreak, target: 5 }) },
    { id: 'tp_streak15',      emoji: '💥', name: 'TP inarrêtable',    desc: 'Série de 15 TP corrects',        category: 'TP · Pratique',
      check: () => tpStats().bestStreak >= 15,
      progress: () => ({ current: tpStats().bestStreak, target: 15 }) },
    { id: 'tp_categories5',   emoji: '🗺️', name: 'Touche-à-tout',     desc: '5 catégories TP différentes',    category: 'TP · Pratique',
      check: () => tpStats().cats >= 5,
      progress: () => ({ current: tpStats().cats, target: 5 }) },
    { id: 'tp_categories15',  emoji: '🎓', name: 'Polymath TP',       desc: '15 catégories TP différentes',   category: 'TP · Pratique',
      check: () => tpStats().cats >= 15,
      progress: () => ({ current: tpStats().cats, target: 15 }) },
    { id: 'tp_master_cat',    emoji: '🥇', name: "Maître d'une discipline", desc: '50 TP dans une catégorie', category: 'TP · Pratique',
      check: () => tpStats().maxInOneCat >= 50,
      progress: () => ({ current: tpStats().maxInOneCat, target: 50 }) },
  ];

  // ─────────────────────────────────────────────────────────────
  // FICHES — checks centralisés (lit Profile.snapshot)
  // ─────────────────────────────────────────────────────────────
  function fichesCount() {
    // Profile lit casIn_readFiches_v4 (clé v2). Fallback cas_read_fiches
    // (ancienne clé encore écrite par fiches/index.html).
    const v4 = lsGet('casIn_readFiches_v4', null);
    if (Array.isArray(v4)) return v4.length;
    const legacy = lsGet('cas_read_fiches', null);
    if (Array.isArray(legacy)) return legacy.length;
    return 0;
  }

  // Total de fiches existantes. cas-in-counts.js dispatch un event
  // 'casin:counts' avec {questions, fiches, scenes, ...} ; on cache la
  // valeur localement quand l'event arrive.
  let _fichesTotal = 95; // fallback raisonnable (cf README)
  try {
    window.addEventListener('casin:counts', (e) => {
      if (e && e.detail && typeof e.detail.fiches === 'number') {
        _fichesTotal = e.detail.fiches;
      }
    });
  } catch (_) {}
  function fichesTotal() { return _fichesTotal; }

  const FICHE_ACH = [
    { id: 'fiche_first',  emoji: '📖', name: 'Premier dossier',     desc: '1 fiche lue',                      category: 'Fiches · Lecture',
      check: () => fichesCount() >= 1,
      progress: () => ({ current: fichesCount(), target: 1 }) },
    { id: 'fiche_10',     emoji: '📚', name: 'Lecteur',             desc: '10 fiches lues',                   category: 'Fiches · Lecture',
      check: () => fichesCount() >= 10,
      progress: () => ({ current: fichesCount(), target: 10 }) },
    { id: 'fiche_30',     emoji: '🎓', name: 'Étudiant assidu',     desc: '30 fiches lues',                   category: 'Fiches · Lecture',
      check: () => fichesCount() >= 30,
      progress: () => ({ current: fichesCount(), target: 30 }) },
    { id: 'fiche_60',     emoji: '📕', name: 'Bibliothécaire',      desc: '60 fiches lues',                   category: 'Fiches · Lecture',
      check: () => fichesCount() >= 60,
      progress: () => ({ current: fichesCount(), target: 60 }) },
    { id: 'fiche_all',    emoji: '👑', name: 'Encyclopédiste',      desc: 'Toutes les fiches lues',          category: 'Fiches · Lecture',
      check: () => fichesCount() >= fichesTotal(),
      progress: () => ({ current: fichesCount(), target: fichesTotal() }) },
  ];

  // ─────────────────────────────────────────────────────────────
  // Tableau plat
  // ─────────────────────────────────────────────────────────────
  const ACHIEVEMENTS_META = [].concat(QUIZ_ACH, SCENE_ACH, TP_ACH, FICHE_ACH);

  // Index par id
  const _byId = {};
  ACHIEVEMENTS_META.forEach(a => { _byId[a.id] = a; });

  // Index par catégorie (préserve l'ordre de CATEGORIES)
  function byCategory() {
    const out = {};
    CATEGORIES.forEach(cat => { out[cat] = []; });
    ACHIEVEMENTS_META.forEach(a => {
      const cat = a.category || 'Quiz · Spécial';
      if (!out[cat]) out[cat] = [];
      out[cat].push(a);
    });
    return out;
  }

  /**
   * Évalue tous les checks centralisables (TP, fiches) et débloque les
   * achievements qui passent. Quiz et Scènes ne sont PAS évalués ici
   * (logique runtime ailleurs).
   *
   * @param {object} snap - Profile.snapshot()
   * @returns {string[]}  - Liste des ids fraîchement débloqués
   */
  function evalAndUnlock(snap) {
    if (!window.Profile || typeof window.Profile.unlockAchievement !== 'function') return [];
    if (!snap) return [];
    const fresh = [];
    ACHIEVEMENTS_META.forEach(a => {
      if (typeof a.check !== 'function') return;
      try {
        if (a.check(snap)) {
          if (window.Profile.unlockAchievement(a.id)) fresh.push(a.id);
        }
      } catch (_) {}
    });
    return fresh;
  }

  /**
   * Renvoie {current, target} pour un achievement donné, ou null si pas
   * de progression mesurable. Utilisé pour les jauges des verrouillés.
   */
  function getProgress(id, snap) {
    const a = _byId[id];
    if (!a || typeof a.progress !== 'function') return null;
    try {
      const p = a.progress(snap);
      if (!p || typeof p.current !== 'number' || typeof p.target !== 'number') return null;
      return { current: Math.max(0, p.current), target: Math.max(1, p.target) };
    } catch (_) { return null; }
  }

  // ─────────────────────────────────────────────────────────────
  // Expose au global
  // ─────────────────────────────────────────────────────────────
  window.ACHIEVEMENTS_META = ACHIEVEMENTS_META;
  window.AchievementsCore = {
    evalAndUnlock,
    byId: _byId,
    byCategory,
    CATEGORIES,
    getProgress,
  };

  // Backward-compat : si window.ACHIEVEMENTS n'est pas (encore) défini
  // par quiz-app.js, on fournit la metadata pour que le rendu trouve
  // emoji/name/desc via cet objet.
  if (typeof window.ACHIEVEMENTS === 'undefined') {
    window.ACHIEVEMENTS = ACHIEVEMENTS_META;
  }
})();
