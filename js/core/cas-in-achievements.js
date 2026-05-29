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
// scene_results + plein de compteurs cas_*). scene-app.js appelle
// directement window.getUnlockedBadges() à chaque fin de scène et
// synchronise via Profile.unlockAchievement (ex-scene-profile-bridge,
// supprimé en v2.85+).
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
    'Rôle · Enquêteur',
    'Rôle · Magistrat',
    'Rôle · Journaliste',
    'Rôle · Hacker',
    'TP · Pratique',
    'Tools · Calculateurs',
    'Fiches · Lecture',
    'Secrets 🤫',
    // v121c — 8 catégories doctrinales (72 trophées)
    'Doctrine · Vauthier MP-VD',
    'Doctrine · IBAN spoofing',
    'Doctrine · Laufenburg',
    'Doctrine · HPM EIMP',
    'Doctrine · EncroChat/Sky ECC',
    'Doctrine · Ransomware HRHP',
    'Doctrine · Arc transversal',
    'Doctrine · Maîtres doctrinaux',
    // v122a — Saga Étoile noire (stations-service ATG)
    'Doctrine · Étoile noire',
    // v122b — Saga Source trouble (eau potable SCADA)
    'Doctrine · Source trouble',
    'Doctrine · Maillon faible',
    // v121d — 2 catégories supplémentaires (réputation + narratifs)
    'Doctrine · Réputation institutionnelle',
    'Doctrine · Choix narratifs (secrets)',
    // v121e — 1 catégorie supplémentaire (compétences techniques)
    'Doctrine · Compétences techniques',
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
    // v2.51 — 2 nouveaux arcs (méta-gamification frontend)
    { id: 'arc_nicolet',     emoji: '👤⚖️', name: 'Le Procureur Fédéral', desc: 'Arc Nicolet complété : Xplain → Palais fédéral → Compétence MPC-VS → AI Act PRESTO-CH', category: 'Scènes · Arcs PNJ' },
    { id: 'arc_pelletier',   emoji: '👤🇫🇷🇨🇭', name: 'Le Pivot Bilatéral', desc: 'Arc Pelletier complété : France Travail → Free Mobile → Endgame Phase 2 → CER Bassecourt-Vesoul → NIS2 PME', category: 'Scènes · Arcs PNJ' },
    { id: 'arc_premiers_reflexes', emoji: '🎓', name: 'Premiers réflexes cyber', desc: 'Arc Brägger (Premiers réflexes) : 7 scènes faciles à travers la Suisse — fondamentaux DFIR', category: 'Scènes · Arcs PNJ' },
    // ─── Arcs PNJ auto-générés (v2.94) — voir scripts/build_npc_arcs_v2.py ───
    { id: 'arc_forensics_lead_zh', emoji: '🔬', name: 'L\'Étalon du Laboratoire', desc: 'Arc M. Bachmann : Cold case Vidy → Swatch espionnage OT → Attaques DAB Villaz', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_ofcs_coordinator', emoji: '🛡', name: 'La Coordinatrice OFCS', desc: 'Arc Mme Tschanz : APT 21 mois → Stadler ransomware → Swissport ZRH BlackCat', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_fbi_legat_bern', emoji: '🇺🇸', name: 'Le Légat Américain', desc: 'Arc Special Agent Donovan : DOJ vs secret bancaire → Opération Cronos (LockBit) → Op. Magnus', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_ge_prosecutor_cyber', emoji: '⚖️', name: 'La Procureure Genevoise', desc: 'Arc Mme Cottier : DOJ vs secret bancaire → CICR compromise → AirTag Émirats', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_ciso_logitech', emoji: '🛡', name: 'Le CISO de Logitech', desc: 'Arc M. Aellig : Hive Comparis → Memory forensics → Cistec hospitalier', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_compliance_bs', emoji: '🏦', name: 'Le Compliance Bâlois', desc: 'Arc Marco Bernasconi : DOJ vs secret bancaire → Lugano \'ndrangheta → Banquier fantôme', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_fr_prosecutor_cyber', emoji: '⚖️', name: 'La Procureure Fribourgeoise', desc: 'Arc Mme Genoud : Pédo-hunter Bulle → Attaques DAB Villaz → Initiation — cyberhygiène PME', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_vs_prosecutor_cyber', emoji: '⚖️', name: 'Le Procureur Valaisan', desc: 'Arc M. Crittin : Rajeunissement IA → Affaire de la Viège → Affaire de la Viège', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_fedpol_crd_cyber', emoji: '🏛', name: 'L\'Officière fedpol Cyber', desc: 'Arc Mme Joëlle Egger : Opération Rubicon (Crypto AG) → Démantèlement Hydra Market → Opération Cronos (LockBit)', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_cicr_dpo', emoji: '🕊', name: 'La Sentinelle Humanitaire', desc: 'Arc Mme Tedeschi : EXIT NE contesté → CICR compromise → Free Mobile leak', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_ddps_general_counsel', emoji: '🪖', name: 'La Juriste de la Défense', desc: 'Arc Mme Aebischer : APT 21 mois → NoName_2023 DDoS → Whistleblower DDPS', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_interpol_europol_liaison', emoji: '🌐', name: 'L\'Officier de Liaison Européen', desc: 'Arc Nicolas Reichenbach : Démantèlement Hydra Market → Affaire de la Viège → Affaire de la Viège', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_mpc_procureur_federal', emoji: '⚖️', name: 'Le Procureur Cyber MPC', desc: 'Arc Me Vincent Stähli : Opération Rubicon (Crypto AG) → Démantèlement Hydra Market → Affaire de la Viège', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_ofs_rssi_fedch', emoji: '📊', name: 'Le RSSI Confédéral', desc: 'Arc M. Schaller : Fuite sous-traitant → Xplain ransomware Play → Forum Delémont', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_pjf_undercover_lead', emoji: '🕵', name: 'La Cheffe Infiltration', desc: 'Arc Mme Roesti : Op. Darkmarket → Agent infiltré 14 mois → Op. KidFlix', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_vd_prosecutor_cyber', emoji: '⚖️', name: 'La Procureure Vaudoise', desc: 'Arc Mme Brun : IoT camera VD → Perquisition conjugale VD → Frontex deepfake', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_vs_polcant_cyber', emoji: '👮', name: 'L\'Inspecteur Valaisan', desc: 'Arc Insp. Daniel Salamin : Affaire de la Viège → Affaire de la Viège → Affaire de la Viège', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_compass_security_lead_forensic', emoji: '🔬', name: 'L\'Expert Privé Compass', desc: 'Arc Dr. Stephan Sutter : Opération Cronos (LockBit) → Supply chain Vadian / Swiss Life', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_ofj_eimp_bilateral_de', emoji: '🇩🇪', name: 'La Cheffe Entraide DE', desc: 'Arc Mme Karin Aebersold : Démantèlement Hydra Market → Opération Cronos (LockBit) → Défi TikTok mortel VD (…', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_pfpdt_lobsiger_office', emoji: '🛡', name: 'Le Préposé à la Protection des Données', desc: 'Arc M. Métraux : Démantèlement Hydra Market → Supply chain Vadian / Swiss Life → Container Docker — supply …', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_src_director', emoji: '🕴', name: 'La Cheffe Anti-Terrorisme', desc: 'Arc Mme Müller (cheffe de section anti-terrorisme) : Pédo-hunter Bulle → Attentat Aarau → Bürgenstock confé…', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_expert_kudelski_security', emoji: '🔐', name: 'Le Cryptographe Kudelski', desc: 'Arc Dr Kudelka : Supply chain Vadian / Swiss Life → PCAP forensics — adm. Jura', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_fr_polcant_cyber', emoji: '👮', name: 'Le Capitaine Fribourgeois', desc: 'Arc Cap. Schmid : Affaire Sarine → Affaire Sarine → Affaire Sarine', category: 'Scènes · Arcs PNJ (auto)' },
    { id: 'arc_ncsc_govcert_lead', emoji: '🚨', name: 'Le Chef GovCERT', desc: 'Arc Dr Fankhauser : Container Docker — supply chain → PCAP forensics — adm. Jura', category: 'Scènes · Arcs PNJ (auto)' },
    // v2.56 (EXTEND) — Mastery par scène + first-clear bonus
    { id: 'pioneer_25',      emoji: '🌟', name: 'Pionnier·ère',         desc: '25 scénarios découverts (first-clear ≥60%)',  category: 'Scènes · Progression' },
    { id: 'pioneer_50',      emoji: '✨', name: 'Explorateur·rice',     desc: '50 scénarios découverts (first-clear ≥60%)',  category: 'Scènes · Progression' },
    { id: 'mastery_bronze',  emoji: '🥉', name: 'Apprenti·e des scènes', desc: '5 scénarios "Touchés" (≥60%)',                category: 'Scènes · Progression' },
    { id: 'mastery_silver',  emoji: '🥈', name: 'Médaille d\'argent',    desc: '10 scénarios "Réussis" (≥80%)',               category: 'Scènes · Progression' },
    { id: 'mastery_gold',    emoji: '🥇', name: 'Médaille d\'or',        desc: '5 scénarios "Maîtrisés" (3 runs ≥80% sur 2 modes)', category: 'Scènes · Progression' },

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
    // ─────────────────────────────────────────────────────────────
    // v2.91 PACK L3 — Achievements exclusifs par rôle (roleOnly)
    // 4 achievements par rôle · n'apparaissent que pour le rôle correspondant
    // Compteurs spécifiques : casIn_role_hintsRead, casIn_role_backdoorsUsed
    // ─────────────────────────────────────────────────────────────
    // 🕵 Investigator (4)
    { id: 'role_inv_locard',     emoji: '🔬', name: 'Disciple de Locard',       desc: '10 chaînes de custody parfaites (custody ≥90%)', category: 'Rôle · Enquêteur', roleOnly: 'investigator',
      check: () => (parseInt(localStorage.getItem('casIn_role_custodyPerfect') || '0', 10)) >= 10,
      progress: () => ({ current: parseInt(localStorage.getItem('casIn_role_custodyPerfect') || '0', 10), target: 10 }) },
    { id: 'role_inv_morse',      emoji: '🕵️', name: 'Inspecteur Morse',         desc: '15 hints contextuels lus en début de scène',     category: 'Rôle · Enquêteur', roleOnly: 'investigator',
      check: () => (parseInt(localStorage.getItem('casIn_role_hintsRead') || '0', 10)) >= 15,
      progress: () => ({ current: parseInt(localStorage.getItem('casIn_role_hintsRead') || '0', 10), target: 15 }) },
    { id: 'role_inv_columbo',    emoji: '🧥', name: 'Une dernière chose',       desc: '20 scènes forensique terminées ≥80%',            category: 'Rôle · Enquêteur', roleOnly: 'investigator',
      check: (s) => ((s && s.scenesTagPct80 && s.scenesTagPct80.FORENSIQUE) || 0) >= 20,
      progress: (s) => ({ current: ((s && s.scenesTagPct80 && s.scenesTagPct80.FORENSIQUE) || 0), target: 20 }) },
    { id: 'role_inv_legend',     emoji: '👑', name: 'Légende du terrain',      desc: '50 scènes forensique terminées (toutes diff)',  category: 'Rôle · Enquêteur', roleOnly: 'investigator',
      check: (s) => ((s && s.scenesTagCount && s.scenesTagCount.FORENSIQUE) || 0) >= 50,
      progress: (s) => ({ current: ((s && s.scenesTagCount && s.scenesTagCount.FORENSIQUE) || 0), target: 50 }) },
    // ⚖️ Magistrate (4)
    { id: 'role_mag_falcone',    emoji: '⚖️', name: 'Maître Falcone',          desc: '20 articles CPP cités correctement (90%+)',     category: 'Rôle · Magistrat', roleOnly: 'magistrate',
      check: (s) => ((s && s.scenesTagPct80 && s.scenesTagPct80.CPP) || 0) >= 20,
      progress: (s) => ({ current: ((s && s.scenesTagPct80 && s.scenesTagPct80.CPP) || 0), target: 20 }) },
    { id: 'role_mag_audience',   emoji: '🏛️', name: 'Procès parfait',         desc: '5 scènes droit terminées avec ≥95%',            category: 'Rôle · Magistrat', roleOnly: 'magistrate',
      check: (s) => ((s && s.scenesTagPct95 && s.scenesTagPct95.DROIT) || 0) >= 5,
      progress: (s) => ({ current: ((s && s.scenesTagPct95 && s.scenesTagPct95.DROIT) || 0), target: 5 }) },
    { id: 'role_mag_cpp_master', emoji: '📜', name: 'Maître du CPP',           desc: '15 scènes procédure pénale ≥80%',                category: 'Rôle · Magistrat', roleOnly: 'magistrate',
      check: (s) => ((s && s.scenesTagPct80 && s.scenesTagPct80.PROCEDURE) || 0) >= 15,
      progress: (s) => ({ current: ((s && s.scenesTagPct80 && s.scenesTagPct80.PROCEDURE) || 0), target: 15 }) },
    { id: 'role_mag_supreme',    emoji: '👑', name: 'Magistrat suprême',      desc: '50 scènes droit terminées (toutes diff)',       category: 'Rôle · Magistrat', roleOnly: 'magistrate',
      check: (s) => ((s && s.scenesTagCount && s.scenesTagCount.DROIT) || 0) >= 50,
      progress: (s) => ({ current: ((s && s.scenesTagCount && s.scenesTagCount.DROIT) || 0), target: 50 }) },
    // 📰 Journalist (4)
    { id: 'role_jour_woodward',  emoji: '🔦', name: 'Bob Woodward',            desc: '10 scènes OSINT/darknet ≥80%',                  category: 'Rôle · Journaliste', roleOnly: 'journalist',
      check: (s) => (((s && s.scenesTagPct80 && s.scenesTagPct80.OSINT) || 0) + ((s && s.scenesTagPct80 && s.scenesTagPct80.DARKNET) || 0)) >= 10,
      progress: (s) => ({ current: (((s && s.scenesTagPct80 && s.scenesTagPct80.OSINT) || 0) + ((s && s.scenesTagPct80 && s.scenesTagPct80.DARKNET) || 0)), target: 10 }) },
    { id: 'role_jour_pulitzer',  emoji: '🏆', name: 'Pulitzer numérique',     desc: '5 scènes deepfake/IA résolues ≥85%',            category: 'Rôle · Journaliste', roleOnly: 'journalist',
      check: (s) => (((s && s.scenesTagPct80 && s.scenesTagPct80.DEEPFAKE) || 0) + ((s && s.scenesTagPct80 && s.scenesTagPct80.IA) || 0)) >= 5,
      progress: (s) => ({ current: (((s && s.scenesTagPct80 && s.scenesTagPct80.DEEPFAKE) || 0) + ((s && s.scenesTagPct80 && s.scenesTagPct80.IA) || 0)), target: 5 }) },
    { id: 'role_jour_londres',   emoji: '🌍', name: 'Albert Londres',          desc: '20 scènes investigation traversées',            category: 'Rôle · Journaliste', roleOnly: 'journalist',
      check: (s) => ((s && s.scenesCount) || 0) >= 20,
      progress: (s) => ({ current: ((s && s.scenesCount) || 0), target: 20 }) },
    { id: 'role_jour_legend',    emoji: '👑', name: 'Plume légendaire',       desc: '50 scènes (OSINT, darknet, social eng.)',       category: 'Rôle · Journaliste', roleOnly: 'journalist',
      check: (s) => (((s && s.scenesTagCount && s.scenesTagCount.OSINT) || 0) + ((s && s.scenesTagCount && s.scenesTagCount.DARKNET) || 0)) >= 50,
      progress: (s) => ({ current: (((s && s.scenesTagCount && s.scenesTagCount.OSINT) || 0) + ((s && s.scenesTagCount && s.scenesTagCount.DARKNET) || 0)), target: 50 }) },
    // ⌨️ Hacker (4)
    { id: 'role_hack_robot',     emoji: '🎭', name: 'Mr Robot',                desc: '10 ransomwares contre-attribués ≥80%',          category: 'Rôle · Hacker', roleOnly: 'hacker',
      check: (s) => ((s && s.scenesTagPct80 && s.scenesTagPct80.RANSOMWARE) || 0) >= 10,
      progress: (s) => ({ current: ((s && s.scenesTagPct80 && s.scenesTagPct80.RANSOMWARE) || 0), target: 10 }) },
    { id: 'role_hack_backdoor',  emoji: '🔓', name: 'Backdoor expert',         desc: '10 skips Backdoor utilisés efficacement',       category: 'Rôle · Hacker', roleOnly: 'hacker',
      check: () => (parseInt(localStorage.getItem('casIn_role_backdoorsUsed') || '0', 10)) >= 10,
      progress: () => ({ current: parseInt(localStorage.getItem('casIn_role_backdoorsUsed') || '0', 10), target: 10 }) },
    { id: 'role_hack_swordfish', emoji: '🌊', name: 'Stanley Jobson',          desc: '15 scènes crypto/réseau ≥75%',                  category: 'Rôle · Hacker', roleOnly: 'hacker',
      check: (s) => (((s && s.scenesTagPct80 && s.scenesTagPct80.CRYPTO) || 0) + ((s && s.scenesTagPct80 && s.scenesTagPct80['RÉSEAUX']) || 0)) >= 15,
      progress: (s) => ({ current: (((s && s.scenesTagPct80 && s.scenesTagPct80.CRYPTO) || 0) + ((s && s.scenesTagPct80 && s.scenesTagPct80['RÉSEAUX']) || 0)), target: 15 }) },
    { id: 'role_hack_legend',    emoji: '👑', name: 'Légende du dark net',    desc: '50 scènes hack (ransomware/malware/réseau)',    category: 'Rôle · Hacker', roleOnly: 'hacker',
      check: (s) => (((s && s.scenesTagCount && s.scenesTagCount.RANSOMWARE) || 0) + ((s && s.scenesTagCount && s.scenesTagCount.MALWARE) || 0) + ((s && s.scenesTagCount && s.scenesTagCount['RÉSEAUX']) || 0)) >= 50,
      progress: (s) => ({ current: (((s && s.scenesTagCount && s.scenesTagCount.RANSOMWARE) || 0) + ((s && s.scenesTagCount && s.scenesTagCount.MALWARE) || 0) + ((s && s.scenesTagCount && s.scenesTagCount['RÉSEAUX']) || 0)), target: 50 }) },
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
  // TOOLS — checks centralisés (lit localStorage.tools_used)
  //
  // tools_used = { ts: 4, sfn: 2, mft: 1, ... }
  //   clé = id de l'onglet de tools.html (12 outils au total)
  //
  // Évalués via tools-profile-bridge.js (hook sur setItem 'tools_used').
  // ─────────────────────────────────────────────────────────────
  // Liste figée des 12 outils — sync avec tools.html. Si on en ajoute,
  // mettre à jour ici sinon `tools_polymath` reste accessible avec un
  // ancien total. Maintenu manuellement (pas de DOM access dans le worker).
  const TOOLS_ALL = [
    'ts','rl','fat','ntfs','hex','enc',
    'sfn','magic','bitmap','hashid','cluster','mft'
  ];

  function toolsStats() {
    const used = lsGet('tools_used', {}) || {};
    let distinct = 0;
    let maxOne = 0;
    let total = 0;
    TOOLS_ALL.forEach(k => {
      const n = parseInt(used[k], 10) || 0;
      total += n;
      if (n > 0) distinct++;
      if (n > maxOne) maxOne = n;
    });
    return { distinct, maxOne, total, totalTools: TOOLS_ALL.length };
  }

  const TOOLS_ACH = [
    { id: 'tools_swiss_knife', emoji: '🧰', name: 'Couteau suisse',
      desc: '5 calculateurs différents utilisés',
      category: 'Tools · Calculateurs',
      check: () => toolsStats().distinct >= 5,
      progress: () => ({ current: toolsStats().distinct, target: 5 }) },
    { id: 'tools_artisan', emoji: '🔧', name: 'Bricoleur',
      desc: 'Un calculateur utilisé 20 fois',
      category: 'Tools · Calculateurs',
      check: () => toolsStats().maxOne >= 20,
      progress: () => ({ current: toolsStats().maxOne, target: 20 }) },
    { id: 'tools_polymath', emoji: '🛠️', name: 'Forensicateur',
      desc: 'Tous les calculateurs essayés au moins une fois',
      category: 'Tools · Calculateurs',
      check: () => toolsStats().distinct >= toolsStats().totalTools,
      progress: () => ({ current: toolsStats().distinct, target: toolsStats().totalTools }) },
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
  // v121c — DOCTRINE (72 trophées doctrinaux liés aux sagas v114-v119)
  //
  // Récompensent la progression dans les 6 sagas majeures :
  //   B2 Vauthier MP-VD, C1 IBAN spoofing, C2 Laufenburg,
  //   A6 HPM EIMP, A2 EncroChat/Sky ECC, A1 Ransomware HRHP
  // + 12 trophées transversaux (méta arc, doctrine globale)
  //
  // Évaluation : basée sur scene_results (pct ≥ 60) + scenesTagCount
  // Pas de modification de scene-app.js requise.
  // ─────────────────────────────────────────────────────────────

  // Helpers spécifiques à la doctrine
  function doctrineHasScene(sceneId, results) {
    return !!(results && results[sceneId] && results[sceneId].pct >= 60);
  }
  function doctrineCountScenes(sceneIds, results) {
    if (!results) return 0;
    return sceneIds.filter(id => doctrineHasScene(id, results)).length;
  }
  function doctrineSceneResults() {
    try { return JSON.parse(localStorage.getItem('scene_results') || '{}') || {}; }
    catch (_) { return {}; }
  }

  // IDs des scènes par saga (référence centralisée)
  const SAGA_SCENES = {
    vauthier: [
      'vd-affaire-vauthier-1-premier-dossier',
      'vd-affaire-vauthier-2-premiere-audition',
      'vd-affaire-vauthier-3-mandat-tmc-rejete',
      'vd-affaire-vauthier-4-fuite-presse',
      'vd-affaire-vauthier-5-analyses-forensiques',
      'vd-affaire-vauthier-6-audience-scellement',
      'vd-affaire-vauthier-7-decision-finale',
    ],
    iban: [
      'ge-affaire-iban-1-decouverte-lundi-matin',
      'ge-affaire-iban-2-recall-swift-forensique-mail',
      'ge-affaire-iban-3-mros-instruction-146cp',
      'ge-affaire-iban-4-tracage-crypto-usdt-tron',
      'ge-affaire-iban-5-eimp-hong-kong-eurojust',
      'ge-affaire-iban-6-audition-cfo-responsabilite-pme',
      'ge-affaire-iban-7-recouvrement-final-bilan',
    ],
    laufenburg: [
      'ag-affaire-laufenburg-1-detection-nocturne',
      'ag-affaire-laufenburg-2-forensique-aeroscope-radar',
      'ag-affaire-laufenburg-3-identification-operateur',
      'ag-affaire-laufenburg-4-perquisition-munich',
      'ag-affaire-laufenburg-5-forensique-disques-attribution',
      'ag-affaire-laufenburg-6-cooperation-commanditaire',
      'ag-affaire-laufenburg-7-proces-tpf-bilan',
    ],
    hpm: [
      'hpm-affaire-eimp-1-reception-demande-francaise',
      'hpm-affaire-eimp-2-negociation-proportionnalite-ofj',
      'hpm-affaire-eimp-3-ordonnance-extraction-technique',
      'hpm-affaire-eimp-4-mpc-suisse-parallele',
      'hpm-affaire-eimp-5-fuite-presse-crise-utilisateurs',
      'hpm-affaire-eimp-6-notification-postcloture-pfpdt',
      'hpm-affaire-eimp-7-rapport-transparence-doctrine',
    ],
    encrochat: [
      'a2-encrochat-1-reception-donnees-jit',
      'a2-encrochat-2-identification-perquisition',
      'a2-encrochat-3-audition-krasniqi-cooperation',
      'a2-encrochat-4-mise-en-accusation-tribunal',
      'a2-encrochat-5-manhart-premier-rdv-client',
      'a2-encrochat-6-audition-bashkimi-consultation',
      'a2-encrochat-7-proces-bashkimi-bilan-defense',
    ],
    hrhp: [
      'a1-ransomware-1-detection-nuit-ransomware',
      'a1-ransomware-2-deces-patiente-bascule-penale',
      'a1-ransomware-3-decision-rancon-restauration',
      'a1-ransomware-4-publication-donnees-notification',
      'a1-ransomware-5-restauration-audit-post-incident',
      'a1-ransomware-6-procedure-penale-internationale',
      'a1-ransomware-7-bilan-doctrinal-parlement-cloture',
    ],
    etoile: [
      'vd-affaire-etoile-noire-1-dimanche-decouverte',
      'vd-affaire-etoile-noire-2-forensique-swissot',
      'vd-affaire-etoile-noire-3-mpc-bascule-fed',
      'vd-affaire-etoile-noire-4-pfpdt-supercard',
      'vd-affaire-etoile-noire-5-fuite-presse-ofae',
      'vd-affaire-etoile-noire-6-washington-eimp-ofac',
      'vd-affaire-etoile-noire-7-parlement-doctrine',
    ],
    eau: [
      'eau-source-trouble-1-ecran-ment',
      'eau-source-trouble-2-forensique-hydrocontrol',
      'eau-source-trouble-3-riverkeeper-revendique',
      'eau-source-trouble-4-competence-cantonal-mpc',
      'eau-source-trouble-5-avis-non-consommation',
      'eau-source-trouble-6-six-communes-gouvernance',
      'eau-source-trouble-7-grand-conseil-doctrine',
    ],
    supply: [
      'supply-maillon-faible-1-terabyte',
      'supply-maillon-faible-2-non-paiement',
      'supply-maillon-faible-3-combien-personnes',
      'supply-maillon-faible-4-etat-major-crise',
      'supply-maillon-faible-5-contrat-responsabilite',
      'supply-maillon-faible-6-survie-entreprise',
      'supply-maillon-faible-7-cdg-doctrine',
    ],
  };

  const DOCTRINE_ACH = [

    // ═══════════════════════════════════════════════════════════
    // SAGA B2 — Vauthier MP-VD (10 trophées)
    // ═══════════════════════════════════════════════════════════
    { id: 'doc_vauthier_premier_dossier',  emoji: '👶', name: 'Premier dossier',
      desc: 'Démarrer Premier dossier — Vauthier au MP-VD',
      category: 'Doctrine · Vauthier MP-VD',
      check: (s) => doctrineHasScene('vd-affaire-vauthier-1-premier-dossier', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-vauthier-1-premier-dossier', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_vauthier_audition_158',  emoji: '⚖️', name: 'Notification 158 CPP',
      desc: 'Compléter la première audition Vauthier (acte 2)',
      category: 'Doctrine · Vauthier MP-VD',
      check: (s) => doctrineHasScene('vd-affaire-vauthier-2-premiere-audition', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-vauthier-2-premiere-audition', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_vauthier_tmc_refus',  emoji: '🚫', name: 'Le TMC refuse',
      desc: 'Encaisser le refus du TMC Vauthier (acte 3)',
      category: 'Doctrine · Vauthier MP-VD',
      check: (s) => doctrineHasScene('vd-affaire-vauthier-3-mandat-tmc-rejete', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-vauthier-3-mandat-tmc-rejete', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_vauthier_presse',  emoji: '📰', name: 'Gérer la fuite',
      desc: 'Gérer la fuite presse (Vauthier acte 4)',
      category: 'Doctrine · Vauthier MP-VD',
      check: (s) => doctrineHasScene('vd-affaire-vauthier-4-fuite-presse', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-vauthier-4-fuite-presse', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_vauthier_forensique',  emoji: '🔬', name: 'Chaîne probatoire reprise',
      desc: 'Reprendre la chaîne probatoire (Vauthier acte 5)',
      category: 'Doctrine · Vauthier MP-VD',
      check: (s) => doctrineHasScene('vd-affaire-vauthier-5-analyses-forensiques', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-vauthier-5-analyses-forensiques', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_vauthier_scellement',  emoji: '🔒', name: 'Audience de scellement',
      desc: 'Sortir de l\'audience de scellement (Vauthier acte 6)',
      category: 'Doctrine · Vauthier MP-VD',
      check: (s) => doctrineHasScene('vd-affaire-vauthier-6-audience-scellement', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-vauthier-6-audience-scellement', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_vauthier_classement',  emoji: '📋', name: 'Décision finale',
      desc: 'Prendre la décision finale (Vauthier acte 7)',
      category: 'Doctrine · Vauthier MP-VD',
      check: (s) => doctrineHasScene('vd-affaire-vauthier-7-decision-finale', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-vauthier-7-decision-finale', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_vauthier_saga_complete',  emoji: '🎓', name: 'Procureure débutante diplômée',
      desc: 'Terminer la saga Vauthier MP-VD (7 actes)',
      category: 'Doctrine · Vauthier MP-VD',
      check: (s) => doctrineCountScenes(SAGA_SCENES.vauthier, doctrineSceneResults()) === 7,
      progress: () => ({ current: doctrineCountScenes(SAGA_SCENES.vauthier, doctrineSceneResults()), target: 7 }) },

    { id: 'doc_vauthier_excellence',  emoji: '🏅', name: 'Excellence Vauthier',
      desc: 'Compléter la saga Vauthier avec moyenne ≥ 85%',
      category: 'Doctrine · Vauthier MP-VD',
      check: (s) => {
        const r = doctrineSceneResults();
        const pcts = SAGA_SCENES.vauthier.map(id => (r[id] && r[id].pct) || 0);
        if (pcts.some(p => p < 60)) return false;
        const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
        return avg >= 85;
      },
      progress: () => {
        const r = doctrineSceneResults();
        const pcts = SAGA_SCENES.vauthier.map(id => (r[id] && r[id].pct) || 0);
        const avg = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
        return { current: avg, target: 85 };
      } },

    { id: 'doc_vauthier_tags_cpp',  emoji: '📜', name: 'Maîtrise procédure CPP',
      desc: 'Avoir complété 5 scènes Vauthier avec tag CPP',
      category: 'Doctrine · Vauthier MP-VD',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['ART. 158 CPP'] || 0) +
                    (s.scenesTagCount && s.scenesTagCount['ART. 244 CPP'] || 0) +
                    (s.scenesTagCount && s.scenesTagCount['ART. 248 CPP'] || 0) +
                    (s.scenesTagCount && s.scenesTagCount['ART. 264 CPP'] || 0) +
                    (s.scenesTagCount && s.scenesTagCount['ART. 319 CPP'] || 0) >= 5,
      progress: (s) => {
        const tc = s.scenesTagCount || {};
        const cur = (tc['ART. 158 CPP']||0) + (tc['ART. 244 CPP']||0) + (tc['ART. 248 CPP']||0) + (tc['ART. 264 CPP']||0) + (tc['ART. 319 CPP']||0);
        return { current: cur, target: 5 };
      } },

    // ═══════════════════════════════════════════════════════════
    // SAGA C1 — IBAN spoofing (10 trophées)
    // ═══════════════════════════════════════════════════════════
    { id: 'doc_iban_decouverte', emoji: '💸', name: 'Premier lundi POLGE',
      desc: 'Démarrer IBAN spoofing — Découverte lundi matin',
      category: 'Doctrine · IBAN spoofing',
      check: (s) => doctrineHasScene('ge-affaire-iban-1-decouverte-lundi-matin', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ge-affaire-iban-1-decouverte-lundi-matin', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_iban_swift_recall', emoji: '🏦', name: 'Recall SWIFT activé',
      desc: 'Déclencher un Recall SWIFT (IBAN acte 2)',
      category: 'Doctrine · IBAN spoofing',
      check: (s) => doctrineHasScene('ge-affaire-iban-2-recall-swift-forensique-mail', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ge-affaire-iban-2-recall-swift-forensique-mail', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_iban_mros', emoji: '🧾', name: 'Saisine MROS',
      desc: 'Coordonner avec MROS (IBAN acte 3)',
      category: 'Doctrine · IBAN spoofing',
      check: (s) => doctrineHasScene('ge-affaire-iban-3-mros-instruction-146cp', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ge-affaire-iban-3-mros-instruction-146cp', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_iban_crypto_tracing', emoji: '🪙', name: 'USDT-TRON tracé',
      desc: 'Tracer le blanchiment crypto (IBAN acte 4)',
      category: 'Doctrine · IBAN spoofing',
      check: (s) => doctrineHasScene('ge-affaire-iban-4-tracage-crypto-usdt-tron', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ge-affaire-iban-4-tracage-crypto-usdt-tron', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_iban_hk_eurojust', emoji: '🌏', name: 'Hong Kong via Eurojust',
      desc: 'Coordination Hong Kong + Eurojust (IBAN acte 5)',
      category: 'Doctrine · IBAN spoofing',
      check: (s) => doctrineHasScene('ge-affaire-iban-5-eimp-hong-kong-eurojust', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ge-affaire-iban-5-eimp-hong-kong-eurojust', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_iban_cfo_audition', emoji: '👔', name: 'Audition CFO',
      desc: 'Auditionner le CFO sur la responsabilité PME (IBAN acte 6)',
      category: 'Doctrine · IBAN spoofing',
      check: (s) => doctrineHasScene('ge-affaire-iban-6-audition-cfo-responsabilite-pme', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ge-affaire-iban-6-audition-cfo-responsabilite-pme', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_iban_recouvrement', emoji: '💰', name: 'Recouvrement bouclé',
      desc: 'Conclure le bilan financier (IBAN acte 7)',
      category: 'Doctrine · IBAN spoofing',
      check: (s) => doctrineHasScene('ge-affaire-iban-7-recouvrement-final-bilan', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ge-affaire-iban-7-recouvrement-final-bilan', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_iban_saga_complete', emoji: '🎯', name: 'Maître du BEC',
      desc: 'Terminer la saga IBAN spoofing (7 actes)',
      category: 'Doctrine · IBAN spoofing',
      check: (s) => doctrineCountScenes(SAGA_SCENES.iban, doctrineSceneResults()) === 7,
      progress: () => ({ current: doctrineCountScenes(SAGA_SCENES.iban, doctrineSceneResults()), target: 7 }) },

    { id: 'doc_iban_146cp_tags', emoji: '⚖️', name: 'Art. 146 CP maîtrisé',
      desc: 'Compléter 3+ scènes avec tag ART. 146 CP',
      category: 'Doctrine · IBAN spoofing',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['ART. 146 CP'] || 0) >= 3,
      progress: (s) => ({ current: (s.scenesTagCount && s.scenesTagCount['ART. 146 CP']) || 0, target: 3 }) },

    { id: 'doc_iban_lba_tags', emoji: '🏛️', name: 'LBA appliquée',
      desc: 'Compléter 2+ scènes avec tag ART. 9 LBA ou ART. 11 LBA',
      category: 'Doctrine · IBAN spoofing',
      check: (s) => ((s.scenesTagCount && s.scenesTagCount['ART. 9 LBA']) || 0) +
                    ((s.scenesTagCount && s.scenesTagCount['ART. 11 LBA']) || 0) >= 2,
      progress: (s) => {
        const tc = s.scenesTagCount || {};
        return { current: (tc['ART. 9 LBA']||0) + (tc['ART. 11 LBA']||0), target: 2 };
      } },

    // ═══════════════════════════════════════════════════════════
    // SAGA C2 — Laufenburg (10 trophées)
    // ═══════════════════════════════════════════════════════════
    { id: 'doc_lauf_detection', emoji: '⚡', name: 'Nuit à Laufenburg',
      desc: 'Démarrer Étoile de Laufenburg — Détection nocturne',
      category: 'Doctrine · Laufenburg',
      check: (s) => doctrineHasScene('ag-affaire-laufenburg-1-detection-nocturne', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ag-affaire-laufenburg-1-detection-nocturne', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_lauf_aeroscope', emoji: '📡', name: 'AeroScope décodé',
      desc: 'Exploiter AeroScope + radar SOI (Laufenburg acte 2)',
      category: 'Doctrine · Laufenburg',
      check: (s) => doctrineHasScene('ag-affaire-laufenburg-2-forensique-aeroscope-radar', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ag-affaire-laufenburg-2-forensique-aeroscope-radar', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_lauf_dji_cloud', emoji: '☁️', name: 'DJI Cloud déchiffré',
      desc: 'Identifier l\'opérateur via DJI Cloud (Laufenburg acte 3)',
      category: 'Doctrine · Laufenburg',
      check: (s) => doctrineHasScene('ag-affaire-laufenburg-3-identification-operateur', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ag-affaire-laufenburg-3-identification-operateur', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_lauf_munich', emoji: '🇩🇪', name: 'Perquisition Munich',
      desc: 'Coordonner la perquisition LKA-Bayern (Laufenburg acte 4)',
      category: 'Doctrine · Laufenburg',
      check: (s) => doctrineHasScene('ag-affaire-laufenburg-4-perquisition-munich', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ag-affaire-laufenburg-4-perquisition-munich', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_lauf_attribution', emoji: '🎯', name: 'Attribution doctrinale',
      desc: 'Établir l\'attribution OT (Laufenburg acte 5)',
      category: 'Doctrine · Laufenburg',
      check: (s) => doctrineHasScene('ag-affaire-laufenburg-5-forensique-disques-attribution', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ag-affaire-laufenburg-5-forensique-disques-attribution', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_lauf_verstandigung', emoji: '🤝', name: 'Verständigung',
      desc: 'Obtenir la coopération du commanditaire (Laufenburg acte 6)',
      category: 'Doctrine · Laufenburg',
      check: (s) => doctrineHasScene('ag-affaire-laufenburg-6-cooperation-commanditaire', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ag-affaire-laufenburg-6-cooperation-commanditaire', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_lauf_tpf', emoji: '⚖️', name: 'TPF Bellinzone',
      desc: 'Plaider au TPF (Laufenburg acte 7)',
      category: 'Doctrine · Laufenburg',
      check: (s) => doctrineHasScene('ag-affaire-laufenburg-7-proces-tpf-bilan', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('ag-affaire-laufenburg-7-proces-tpf-bilan', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_lauf_saga_complete', emoji: '🛰️', name: 'Doctrine OT-cyber suisse',
      desc: 'Terminer la saga Laufenburg (7 actes)',
      category: 'Doctrine · Laufenburg',
      check: (s) => doctrineCountScenes(SAGA_SCENES.laufenburg, doctrineSceneResults()) === 7,
      progress: () => ({ current: doctrineCountScenes(SAGA_SCENES.laufenburg, doctrineSceneResults()), target: 7 }) },

    { id: 'doc_lauf_239cp', emoji: '🔐', name: 'Art. 239 CP — sabotage',
      desc: 'Compléter 2+ scènes avec tag ART. 239 CP',
      category: 'Doctrine · Laufenburg',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['ART. 239 CP'] || 0) >= 2,
      progress: (s) => ({ current: (s.scenesTagCount && s.scenesTagCount['ART. 239 CP']) || 0, target: 2 }) },

    { id: 'doc_lauf_swissgrid', emoji: '⚡', name: 'Partenariat Swissgrid',
      desc: 'Compléter 3+ scènes avec tag SWISSGRID',
      category: 'Doctrine · Laufenburg',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['SWISSGRID'] || 0) >= 3,
      progress: (s) => ({ current: (s.scenesTagCount && s.scenesTagCount['SWISSGRID']) || 0, target: 3 }) },

    // ═══════════════════════════════════════════════════════════
    // SAGA A6 — HPM EIMP (10 trophées)
    // ═══════════════════════════════════════════════════════════
    { id: 'doc_hpm_reception', emoji: '📨', name: 'Demande française',
      desc: 'Recevoir la demande EIMP française (HPM acte 1)',
      category: 'Doctrine · HPM EIMP',
      check: (s) => doctrineHasScene('hpm-affaire-eimp-1-reception-demande-francaise', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('hpm-affaire-eimp-1-reception-demande-francaise', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hpm_proportionnalite', emoji: '⚖️', name: 'Proportionnalité OFJ',
      desc: 'Négocier la proportionnalité (HPM acte 2)',
      category: 'Doctrine · HPM EIMP',
      check: (s) => doctrineHasScene('hpm-affaire-eimp-2-negociation-proportionnalite-ofj', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('hpm-affaire-eimp-2-negociation-proportionnalite-ofj', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hpm_extraction', emoji: '💾', name: 'Extraction technique',
      desc: 'Exécuter l\'ordonnance d\'extraction (HPM acte 3)',
      category: 'Doctrine · HPM EIMP',
      check: (s) => doctrineHasScene('hpm-affaire-eimp-3-ordonnance-extraction-technique', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('hpm-affaire-eimp-3-ordonnance-extraction-technique', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hpm_mpc_parallele', emoji: '🔀', name: 'Double procédure',
      desc: 'Gérer l\'enquête MPC parallèle (HPM acte 4)',
      category: 'Doctrine · HPM EIMP',
      check: (s) => doctrineHasScene('hpm-affaire-eimp-4-mpc-suisse-parallele', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('hpm-affaire-eimp-4-mpc-suisse-parallele', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hpm_fuite_presse', emoji: '🚨', name: 'Crise utilisateurs',
      desc: 'Gérer la fuite presse + crise utilisateurs (HPM acte 5)',
      category: 'Doctrine · HPM EIMP',
      check: (s) => doctrineHasScene('hpm-affaire-eimp-5-fuite-presse-crise-utilisateurs', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('hpm-affaire-eimp-5-fuite-presse-crise-utilisateurs', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hpm_pfpdt', emoji: '🛡️', name: 'Notification PFPDT',
      desc: 'Coopérer avec le PFPDT post-clôture (HPM acte 6)',
      category: 'Doctrine · HPM EIMP',
      check: (s) => doctrineHasScene('hpm-affaire-eimp-6-notification-postcloture-pfpdt', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('hpm-affaire-eimp-6-notification-postcloture-pfpdt', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hpm_doctrine', emoji: '📚', name: 'Doctrine publiée',
      desc: 'Publier le rapport doctrinal (HPM acte 7)',
      category: 'Doctrine · HPM EIMP',
      check: (s) => doctrineHasScene('hpm-affaire-eimp-7-rapport-transparence-doctrine', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('hpm-affaire-eimp-7-rapport-transparence-doctrine', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hpm_saga_complete', emoji: '🔐', name: 'Maître de l\'EIMP',
      desc: 'Terminer la saga HPM EIMP (7 actes)',
      category: 'Doctrine · HPM EIMP',
      check: (s) => doctrineCountScenes(SAGA_SCENES.hpm, doctrineSceneResults()) === 7,
      progress: () => ({ current: doctrineCountScenes(SAGA_SCENES.hpm, doctrineSceneResults()), target: 7 }) },

    { id: 'doc_hpm_eimp_tags', emoji: '🌐', name: 'Articles EIMP',
      desc: 'Compléter 3+ scènes avec un tag ART. EIMP',
      category: 'Doctrine · HPM EIMP',
      check: (s) => {
        const tc = s.scenesTagCount || {};
        return (tc['ART. 64 EIMP']||0) + (tc['ART. 67 EIMP']||0) + (tc['ART. 80h EIMP']||0) >= 3;
      },
      progress: (s) => {
        const tc = s.scenesTagCount || {};
        return { current: (tc['ART. 64 EIMP']||0) + (tc['ART. 67 EIMP']||0) + (tc['ART. 80h EIMP']||0), target: 3 };
      } },

    { id: 'doc_hpm_iso27037', emoji: '🔬', name: 'ISO 27037',
      desc: 'Compléter 1+ scène avec tag ISO 27037',
      category: 'Doctrine · HPM EIMP',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['ISO 27037'] || 0) >= 1,
      progress: (s) => ({ current: (s.scenesTagCount && s.scenesTagCount['ISO 27037']) || 0, target: 1 }) },

    // ═══════════════════════════════════════════════════════════
    // SAGA A2 — EncroChat/Sky ECC (10 trophées)
    // ═══════════════════════════════════════════════════════════
    { id: 'doc_encro_jit', emoji: '📱', name: 'JIT Eurojust',
      desc: 'Recevoir les données JIT (EncroChat acte 1)',
      category: 'Doctrine · EncroChat/Sky ECC',
      check: (s) => doctrineHasScene('a2-encrochat-1-reception-donnees-jit', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a2-encrochat-1-reception-donnees-jit', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_encro_perquisition', emoji: '🚔', name: 'Faisceau d\'indices',
      desc: 'Identifier et perquisitionner (EncroChat acte 2)',
      category: 'Doctrine · EncroChat/Sky ECC',
      check: (s) => doctrineHasScene('a2-encrochat-2-identification-perquisition', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a2-encrochat-2-identification-perquisition', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_encro_krasniqi', emoji: '🤝', name: '260ter al. 5',
      desc: 'Auditionner Krasniqi en coopération (EncroChat acte 3)',
      category: 'Doctrine · EncroChat/Sky ECC',
      check: (s) => doctrineHasScene('a2-encrochat-3-audition-krasniqi-cooperation', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a2-encrochat-3-audition-krasniqi-cooperation', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_encro_accusation', emoji: '⚖️', name: 'Mise en accusation',
      desc: 'Mettre en accusation au tribunal (EncroChat acte 4)',
      category: 'Doctrine · EncroChat/Sky ECC',
      check: (s) => doctrineHasScene('a2-encrochat-4-mise-en-accusation-tribunal', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a2-encrochat-4-mise-en-accusation-tribunal', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_encro_manhart', emoji: '🛡️', name: 'Premier RDV défense',
      desc: 'Consultation client Manhart (EncroChat acte 5)',
      category: 'Doctrine · EncroChat/Sky ECC',
      check: (s) => doctrineHasScene('a2-encrochat-5-manhart-premier-rdv-client', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a2-encrochat-5-manhart-premier-rdv-client', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_encro_bashkimi', emoji: '🤐', name: 'Stratégie silence',
      desc: 'Préparer l\'audition Bashkimi (EncroChat acte 6)',
      category: 'Doctrine · EncroChat/Sky ECC',
      check: (s) => doctrineHasScene('a2-encrochat-6-audition-bashkimi-consultation', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a2-encrochat-6-audition-bashkimi-consultation', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_encro_proces', emoji: '🎓', name: 'Procès Bashkimi',
      desc: 'Plaider au procès Bashkimi (EncroChat acte 7)',
      category: 'Doctrine · EncroChat/Sky ECC',
      check: (s) => doctrineHasScene('a2-encrochat-7-proces-bashkimi-bilan-defense', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a2-encrochat-7-proces-bashkimi-bilan-defense', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_encro_saga_complete', emoji: '📡', name: 'Contradictoire maîtrisé',
      desc: 'Terminer la saga EncroChat/Sky ECC (7 actes)',
      category: 'Doctrine · EncroChat/Sky ECC',
      check: (s) => doctrineCountScenes(SAGA_SCENES.encrochat, doctrineSceneResults()) === 7,
      progress: () => ({ current: doctrineCountScenes(SAGA_SCENES.encrochat, doctrineSceneResults()), target: 7 }) },

    { id: 'doc_encro_141cpp', emoji: '❌', name: 'Art. 141 CPP',
      desc: 'Compléter 2+ scènes avec tag ART. 141 CPP',
      category: 'Doctrine · EncroChat/Sky ECC',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['ART. 141 CPP'] || 0) >= 2,
      progress: (s) => ({ current: (s.scenesTagCount && s.scenesTagCount['ART. 141 CPP']) || 0, target: 2 }) },

    { id: 'doc_encro_4_axes', emoji: '🎯', name: 'Doctrine des 4 axes',
      desc: 'Compléter les actes 5+6+7 de la saga EncroChat',
      category: 'Doctrine · EncroChat/Sky ECC',
      check: (s) => {
        const r = doctrineSceneResults();
        return doctrineHasScene('a2-encrochat-5-manhart-premier-rdv-client', r) &&
               doctrineHasScene('a2-encrochat-6-audition-bashkimi-consultation', r) &&
               doctrineHasScene('a2-encrochat-7-proces-bashkimi-bilan-defense', r);
      },
      progress: () => {
        const r = doctrineSceneResults();
        const done = ['a2-encrochat-5-manhart-premier-rdv-client', 'a2-encrochat-6-audition-bashkimi-consultation', 'a2-encrochat-7-proces-bashkimi-bilan-defense']
          .filter(id => doctrineHasScene(id, r)).length;
        return { current: done, target: 3 };
      } },

    // ═══════════════════════════════════════════════════════════
    // SAGA A1 — Ransomware HRHP (10 trophées)
    // ═══════════════════════════════════════════════════════════
    { id: 'doc_hrhp_detection', emoji: '🚨', name: 'Détection ransomware',
      desc: 'Démarrer Ransomware HRHP — Détection nocturne',
      category: 'Doctrine · Ransomware HRHP',
      check: (s) => doctrineHasScene('a1-ransomware-1-detection-nuit-ransomware', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a1-ransomware-1-detection-nuit-ransomware', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hrhp_deces', emoji: '⚰️', name: 'Bascule pénale',
      desc: 'Gérer le décès patiente (HRHP acte 2)',
      category: 'Doctrine · Ransomware HRHP',
      check: (s) => doctrineHasScene('a1-ransomware-2-deces-patiente-bascule-penale', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a1-ransomware-2-deces-patiente-bascule-penale', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hrhp_rancon', emoji: '💰', name: 'Décision rançon',
      desc: 'Trancher sur la rançon (HRHP acte 3)',
      category: 'Doctrine · Ransomware HRHP',
      check: (s) => doctrineHasScene('a1-ransomware-3-decision-rancon-restauration', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a1-ransomware-3-decision-rancon-restauration', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hrhp_publication', emoji: '📢', name: '270k patients notifiés',
      desc: 'Gérer la publication des données (HRHP acte 4)',
      category: 'Doctrine · Ransomware HRHP',
      check: (s) => doctrineHasScene('a1-ransomware-4-publication-donnees-notification', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a1-ransomware-4-publication-donnees-notification', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hrhp_audit', emoji: '🔧', name: 'Audit post-incident',
      desc: 'Compléter l\'audit post-incident (HRHP acte 5)',
      category: 'Doctrine · Ransomware HRHP',
      check: (s) => doctrineHasScene('a1-ransomware-5-restauration-audit-post-incident', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a1-ransomware-5-restauration-audit-post-incident', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hrhp_interpol', emoji: '🌍', name: 'Akira identifié',
      desc: 'Conduire la procédure internationale (HRHP acte 6)',
      category: 'Doctrine · Ransomware HRHP',
      check: (s) => doctrineHasScene('a1-ransomware-6-procedure-penale-internationale', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a1-ransomware-6-procedure-penale-internationale', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hrhp_parlement', emoji: '🏛️', name: 'Au Parlement',
      desc: 'Présenter le bilan doctrinal au Parlement (HRHP acte 7)',
      category: 'Doctrine · Ransomware HRHP',
      check: (s) => doctrineHasScene('a1-ransomware-7-bilan-doctrinal-parlement-cloture', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('a1-ransomware-7-bilan-doctrinal-parlement-cloture', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_hrhp_saga_complete', emoji: '🏥', name: 'Doctrine santé-cyber',
      desc: 'Terminer la saga Ransomware HRHP (7 actes)',
      category: 'Doctrine · Ransomware HRHP',
      check: (s) => doctrineCountScenes(SAGA_SCENES.hrhp, doctrineSceneResults()) === 7,
      progress: () => ({ current: doctrineCountScenes(SAGA_SCENES.hrhp, doctrineSceneResults()), target: 7 }) },

    { id: 'doc_hrhp_lcys', emoji: '🛡️', name: 'LCyS santé',
      desc: 'Compléter 2+ scènes avec tag LCyS SANTÉ ou H+ SUISSE',
      category: 'Doctrine · Ransomware HRHP',
      check: (s) => ((s.scenesTagCount && s.scenesTagCount['LCyS SANTÉ']) || 0) +
                    ((s.scenesTagCount && s.scenesTagCount['H+ SUISSE']) || 0) >= 2,
      progress: (s) => {
        const tc = s.scenesTagCount || {};
        return { current: (tc['LCyS SANTÉ']||0) + (tc['H+ SUISSE']||0), target: 2 };
      } },

    { id: 'doc_hrhp_117cp', emoji: '⚖️', name: 'Art. 117 CP',
      desc: 'Compléter 2+ scènes avec tag ART. 117 CP',
      category: 'Doctrine · Ransomware HRHP',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['ART. 117 CP'] || 0) >= 2,
      progress: (s) => ({ current: (s.scenesTagCount && s.scenesTagCount['ART. 117 CP']) || 0, target: 2 }) },

    // ═══════════════════════════════════════════════════════════
    // TRANSVERSAL (12 trophées) — Arc complet + maîtres
    // ═══════════════════════════════════════════════════════════
    { id: 'doc_arc_three_sagas', emoji: '📖', name: 'Trois sagas, un arc',
      desc: 'Terminer 3 sagas v114-v119 complètes',
      category: 'Doctrine · Arc transversal',
      check: (s) => {
        const r = doctrineSceneResults();
        const sagasDone = ['vauthier', 'iban', 'laufenburg', 'hpm', 'encrochat', 'hrhp']
          .filter(k => doctrineCountScenes(SAGA_SCENES[k], r) === 7).length;
        return sagasDone >= 3;
      },
      progress: () => {
        const r = doctrineSceneResults();
        const sagasDone = ['vauthier', 'iban', 'laufenburg', 'hpm', 'encrochat', 'hrhp']
          .filter(k => doctrineCountScenes(SAGA_SCENES[k], r) === 7).length;
        return { current: sagasDone, target: 3 };
      } },

    { id: 'doc_arc_complete', emoji: '🌟', name: 'L\'arc complet',
      desc: 'Terminer les 6 sagas v114-v119 (Vauthier, IBAN, Laufenburg, HPM, EncroChat, HRHP)',
      category: 'Doctrine · Arc transversal',
      check: (s) => {
        const r = doctrineSceneResults();
        return ['vauthier', 'iban', 'laufenburg', 'hpm', 'encrochat', 'hrhp']
          .every(k => doctrineCountScenes(SAGA_SCENES[k], r) === 7);
      },
      progress: () => {
        const r = doctrineSceneResults();
        const sagasDone = ['vauthier', 'iban', 'laufenburg', 'hpm', 'encrochat', 'hrhp']
          .filter(k => doctrineCountScenes(SAGA_SCENES[k], r) === 7).length;
        return { current: sagasDone, target: 6 };
      } },

    { id: 'doc_arc_excellence', emoji: '🏆', name: 'Excellence arc complet',
      desc: 'Terminer les 6 sagas v114-v119 avec moyenne ≥ 80%',
      category: 'Doctrine · Arc transversal',
      check: (s) => {
        const r = doctrineSceneResults();
        const all = [];
        ['vauthier', 'iban', 'laufenburg', 'hpm', 'encrochat', 'hrhp'].forEach(k => {
          SAGA_SCENES[k].forEach(id => all.push((r[id] && r[id].pct) || 0));
        });
        if (all.length === 0) return false;
        if (all.some(p => p < 60)) return false;
        const avg = all.reduce((a, b) => a + b, 0) / all.length;
        return avg >= 80;
      },
      progress: () => {
        const r = doctrineSceneResults();
        const all = [];
        ['vauthier', 'iban', 'laufenburg', 'hpm', 'encrochat', 'hrhp'].forEach(k => {
          SAGA_SCENES[k].forEach(id => all.push((r[id] && r[id].pct) || 0));
        });
        const avg = all.length > 0 ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0;
        return { current: avg, target: 80 };
      } },

    { id: 'doc_arc_furrer', emoji: '👩‍⚖️', name: 'Rencontrer Furrer',
      desc: 'Compléter 3+ scènes avec tag MPC (vrai pour Furrer procureure)',
      category: 'Doctrine · Arc transversal',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['MPC'] || 0) >= 3,
      progress: (s) => ({ current: (s.scenesTagCount && s.scenesTagCount['MPC']) || 0, target: 3 }) },

    { id: 'doc_arc_eurojust', emoji: '🇪🇺', name: 'Connecté à l\'Europe',
      desc: 'Compléter 3+ scènes avec tag EUROJUST',
      category: 'Doctrine · Arc transversal',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['EUROJUST'] || 0) >= 3,
      progress: (s) => ({ current: (s.scenesTagCount && s.scenesTagCount['EUROJUST']) || 0, target: 3 }) },

    { id: 'doc_arc_eimp', emoji: '🌐', name: 'Maître de l\'EIMP',
      desc: 'Compléter 5+ scènes avec tag EIMP',
      category: 'Doctrine · Arc transversal',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['EIMP'] || 0) >= 5,
      progress: (s) => ({ current: (s.scenesTagCount && s.scenesTagCount['EIMP']) || 0, target: 5 }) },

    { id: 'doc_arc_pfpdt', emoji: '🔒', name: 'Allié du PFPDT',
      desc: 'Compléter 2+ scènes avec tag PFPDT',
      category: 'Doctrine · Arc transversal',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['PFPDT'] || 0) >= 2,
      progress: (s) => ({ current: (s.scenesTagCount && s.scenesTagCount['PFPDT']) || 0, target: 2 }) },

    { id: 'doc_arc_ncsc', emoji: '🛡️', name: 'Partenaire NCSC',
      desc: 'Compléter 2+ scènes avec tag NCSC',
      category: 'Doctrine · Arc transversal',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['NCSC'] || 0) >= 2,
      progress: (s) => ({ current: (s.scenesTagCount && s.scenesTagCount['NCSC']) || 0, target: 2 }) },

    // Maîtres doctrinaux (4 trophées sommitaux)
    { id: 'doc_master_procedure', emoji: '⚖️', name: 'Maître de la procédure',
      desc: 'Compléter 10+ scènes avec un tag CPP (articles 141, 158, 244, 248, 264, 305, 319, 324, etc.)',
      category: 'Doctrine · Maîtres doctrinaux',
      check: (s) => {
        const tc = s.scenesTagCount || {};
        const cppTags = Object.keys(tc).filter(k => k.match(/ART\.\s*\d+(BIS|TER|QUATER|QUINQUIES)?\s*(CPP|CP)\b/i));
        return cppTags.reduce((sum, k) => sum + tc[k], 0) >= 10;
      },
      progress: (s) => {
        const tc = s.scenesTagCount || {};
        const cppTags = Object.keys(tc).filter(k => k.match(/ART\.\s*\d+(BIS|TER|QUATER|QUINQUIES)?\s*(CPP|CP)\b/i));
        const sum = cppTags.reduce((sumv, k) => sumv + tc[k], 0);
        return { current: sum, target: 10 };
      } },

    { id: 'doc_master_international', emoji: '🌏', name: 'Maître international',
      desc: 'Compléter 8+ scènes avec un tag international (EIMP, EUROJUST, FRANCE, ALLEMAGNE, HONG KONG, etc.)',
      category: 'Doctrine · Maîtres doctrinaux',
      check: (s) => {
        const tc = s.scenesTagCount || {};
        const intlKeys = ['EIMP', 'EUROJUST', 'FRANCE', 'ALLEMAGNE', 'HONG KONG', 'BKA', 'LKA-BAYERN', 'INTERPOL', 'JIT', 'OFAC', 'SINGAPOUR'];
        const sum = intlKeys.reduce((s, k) => s + (tc[k] || 0), 0);
        return sum >= 8;
      },
      progress: (s) => {
        const tc = s.scenesTagCount || {};
        const intlKeys = ['EIMP', 'EUROJUST', 'FRANCE', 'ALLEMAGNE', 'HONG KONG', 'BKA', 'LKA-BAYERN', 'INTERPOL', 'JIT', 'OFAC', 'SINGAPOUR'];
        const sum = intlKeys.reduce((sv, k) => sv + (tc[k] || 0), 0);
        return { current: sum, target: 8 };
      } },

    { id: 'doc_master_crisis', emoji: '🚨', name: 'Maître des crises',
      desc: 'Compléter 5+ scènes avec un tag de crise (RANSOMWARE, CRISE, CELLULE DE CRISE, GESTION DE CRISE, PCA)',
      category: 'Doctrine · Maîtres doctrinaux',
      check: (s) => {
        const tc = s.scenesTagCount || {};
        const crisisKeys = ['RANSOMWARE', 'CRISE UTILISATEURS', 'CELLULE DE CRISE', 'GESTION DE CRISE', 'PCA', 'PLAN DE CONTINUITÉ', 'CRISE LPD'];
        const sum = crisisKeys.reduce((s, k) => s + (tc[k] || 0), 0);
        return sum >= 5;
      },
      progress: (s) => {
        const tc = s.scenesTagCount || {};
        const crisisKeys = ['RANSOMWARE', 'CRISE UTILISATEURS', 'CELLULE DE CRISE', 'GESTION DE CRISE', 'PCA', 'PLAN DE CONTINUITÉ', 'CRISE LPD'];
        const sum = crisisKeys.reduce((sv, k) => sv + (tc[k] || 0), 0);
        return { current: sum, target: 5 };
      } },

    { id: 'doc_master_doctrine', emoji: '📚', name: 'Maître doctrinal',
      desc: 'Compléter 4+ scènes avec tag DOCTRINE',
      category: 'Doctrine · Maîtres doctrinaux',
      check: (s) => (s.scenesTagCount && s.scenesTagCount['DOCTRINE'] || 0) >= 4,
      progress: (s) => ({ current: (s.scenesTagCount && s.scenesTagCount['DOCTRINE']) || 0, target: 4 }) },

    // ─────────────────────────────────────────────────────────────
    // v122a — ÉTOILE NOIRE (10 trophées : 7 actes + 1 tag iranien + 2 saga)
    // Saga stations-service ATG, CISO Helvegaz Romanier, mai-juin 2026
    // ─────────────────────────────────────────────────────────────
    { id: 'doc_etoile_dimanche', emoji: '⛽', name: 'Dimanche, 09h14',
      desc: 'Démarrer Étoile noire — la découverte dominicale (acte 1)',
      category: 'Doctrine · Étoile noire',
      check: (s) => doctrineHasScene('vd-affaire-etoile-noire-1-dimanche-decouverte', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-etoile-noire-1-dimanche-decouverte', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_etoile_swissot', emoji: '🔬', name: 'SwissOT prend la main',
      desc: 'Conduire le forensique OT (Étoile noire acte 2)',
      category: 'Doctrine · Étoile noire',
      check: (s) => doctrineHasScene('vd-affaire-etoile-noire-2-forensique-swissot', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-etoile-noire-2-forensique-swissot', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_etoile_mpc', emoji: '⚖️', name: 'Compétence fédérale',
      desc: 'Gérer la bascule MPC (Étoile noire acte 3)',
      category: 'Doctrine · Étoile noire',
      check: (s) => doctrineHasScene('vd-affaire-etoile-noire-3-mpc-bascule-fed', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-etoile-noire-3-mpc-bascule-fed', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_etoile_pfpdt', emoji: '🔒', name: 'Données ExpressCard',
      desc: 'Cartographier les données SuperCard (Étoile noire acte 4)',
      category: 'Doctrine · Étoile noire',
      check: (s) => doctrineHasScene('vd-affaire-etoile-noire-4-pfpdt-supercard', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-etoile-noire-4-pfpdt-supercard', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_etoile_vevey', emoji: '🚨', name: '« 24h sans carburant »',
      desc: 'Gérer la crise médiatique et OFAE (Étoile noire acte 5)',
      category: 'Doctrine · Étoile noire',
      check: (s) => doctrineHasScene('vd-affaire-etoile-noire-5-fuite-presse-ofae', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-etoile-noire-5-fuite-presse-ofae', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_etoile_washington', emoji: '🇺🇸', name: 'Washington appelle',
      desc: 'Naviguer EIMP US et OFAC (Étoile noire acte 6)',
      category: 'Doctrine · Étoile noire',
      check: (s) => doctrineHasScene('vd-affaire-etoile-noire-6-washington-eimp-ofac', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-etoile-noire-6-washington-eimp-ofac', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_etoile_parlement', emoji: '🏛️', name: 'Le verdict parlementaire',
      desc: 'Porter la doctrine ATG-CH 2026 au Parlement (Étoile noire acte 7)',
      category: 'Doctrine · Étoile noire',
      check: (s) => doctrineHasScene('vd-affaire-etoile-noire-7-parlement-doctrine', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('vd-affaire-etoile-noire-7-parlement-doctrine', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_etoile_iran_tags', emoji: '🌙', name: 'Spectre iranien',
      desc: 'Compléter 3+ scènes Étoile noire avec tag IRAN ou IRGC',
      category: 'Doctrine · Étoile noire',
      check: (s) => ((s.scenesTagCount && s.scenesTagCount['IRAN']) || 0) +
                    ((s.scenesTagCount && s.scenesTagCount['IRGC']) || 0) >= 3,
      progress: (s) => {
        const tc = s.scenesTagCount || {};
        return { current: (tc['IRAN']||0) + (tc['IRGC']||0), target: 3 };
      } },

    { id: 'doc_etoile_saga_complete', emoji: '⛽', name: 'Doctrine ATG-CH',
      desc: 'Terminer la saga Étoile noire (7 actes)',
      category: 'Doctrine · Étoile noire',
      check: (s) => doctrineCountScenes(SAGA_SCENES.etoile, doctrineSceneResults()) === 7,
      progress: () => ({ current: doctrineCountScenes(SAGA_SCENES.etoile, doctrineSceneResults()), target: 7 }) },

    { id: 'doc_etoile_excellence', emoji: '🌟', name: 'Excellence Étoile noire',
      desc: 'Terminer Étoile noire avec une moyenne ≥85%',
      category: 'Doctrine · Étoile noire',
      check: (s) => {
        const r = doctrineSceneResults();
        if (doctrineCountScenes(SAGA_SCENES.etoile, r) !== 7) return false;
        const pcts = SAGA_SCENES.etoile.map(id => (r[id] && r[id].pct) || 0);
        const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
        return avg >= 85;
      },
      progress: () => {
        const r = doctrineSceneResults();
        const pcts = SAGA_SCENES.etoile.map(id => (r[id] && r[id].pct) || 0);
        const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
        return { current: avg, target: 85 };
      } },

    // ─────────────────────────────────────────────────────────────
    // v122b — SOURCE TROUBLE (10 trophées : 7 actes + 1 tag FDIA + 2 saga)
    // Saga eau potable, directrice technique Voutaz, Eau Chablais, sept-oct 2026
    // ─────────────────────────────────────────────────────────────
    { id: 'doc_eau_ecran', emoji: '💧', name: 'L\'écran ment',
      desc: 'Démarrer Source trouble — la divergence sondes/SCADA (acte 1)',
      category: 'Doctrine · Source trouble',
      check: (s) => doctrineHasScene('eau-source-trouble-1-ecran-ment', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('eau-source-trouble-1-ecran-ment', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_eau_hydrocontrol', emoji: '🔬', name: 'Forensique nocturne',
      desc: 'Conduire le forensique OT eau (Source trouble acte 2)',
      category: 'Doctrine · Source trouble',
      check: (s) => doctrineHasScene('eau-source-trouble-2-forensique-hydrocontrol', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('eau-source-trouble-2-forensique-hydrocontrol', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_eau_riverkeeper', emoji: '🌊', name: 'RiverKeeper revendique',
      desc: 'Qualifier la menace hacktiviste (Source trouble acte 3)',
      category: 'Doctrine · Source trouble',
      check: (s) => doctrineHasScene('eau-source-trouble-3-riverkeeper-revendique', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('eau-source-trouble-3-riverkeeper-revendique', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_eau_competence', emoji: '⚖️', name: 'Cantonal ou fédéral',
      desc: 'Gérer la compétence cantonale et l\'art. 234 CP (Source trouble acte 4)',
      category: 'Doctrine · Source trouble',
      check: (s) => doctrineHasScene('eau-source-trouble-4-competence-cantonal-mpc', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('eau-source-trouble-4-competence-cantonal-mpc', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_eau_non_conso', emoji: '🚱', name: 'La décision sanitaire',
      desc: 'Gérer l\'avis sanitaire avec le chimiste cantonal (Source trouble acte 5)',
      category: 'Doctrine · Source trouble',
      check: (s) => doctrineHasScene('eau-source-trouble-5-avis-non-consommation', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('eau-source-trouble-5-avis-non-consommation', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_eau_six_communes', emoji: '🏛️', name: 'Six communes, une crise',
      desc: 'Tenir la gouvernance intercommunale (Source trouble acte 6)',
      category: 'Doctrine · Source trouble',
      check: (s) => doctrineHasScene('eau-source-trouble-6-six-communes-gouvernance', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('eau-source-trouble-6-six-communes-gouvernance', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_eau_doctrine', emoji: '💧', name: 'De la source à la doctrine',
      desc: 'Porter la doctrine Eau-CH 2026 au Grand Conseil (Source trouble acte 7)',
      category: 'Doctrine · Source trouble',
      check: (s) => doctrineHasScene('eau-source-trouble-7-grand-conseil-doctrine', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('eau-source-trouble-7-grand-conseil-doctrine', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_eau_fdia', emoji: '🌙', name: '« Les capteurs mentaient »',
      desc: 'Compléter 2+ scènes Source trouble avec tag FDIA ou FAUSSES DONNÉES',
      category: 'Doctrine · Source trouble',
      check: (s) => ((s.scenesTagCount && s.scenesTagCount['FDIA']) || 0) +
                    ((s.scenesTagCount && s.scenesTagCount['FAUSSES DONNÉES']) || 0) >= 2,
      progress: (s) => {
        const tc = s.scenesTagCount || {};
        return { current: (tc['FDIA']||0) + (tc['FAUSSES DONNÉES']||0), target: 2 };
      } },

    { id: 'doc_eau_saga_complete', emoji: '💧', name: 'Doctrine Eau-CH',
      desc: 'Terminer la saga Source trouble (7 actes)',
      category: 'Doctrine · Source trouble',
      check: (s) => doctrineCountScenes(SAGA_SCENES.eau, doctrineSceneResults()) === 7,
      progress: () => ({ current: doctrineCountScenes(SAGA_SCENES.eau, doctrineSceneResults()), target: 7 }) },

    { id: 'doc_eau_excellence', emoji: '🌟', name: 'Excellence Source trouble',
      desc: 'Terminer Source trouble avec une moyenne ≥85%',
      category: 'Doctrine · Source trouble',
      check: (s) => {
        const r = doctrineSceneResults();
        if (doctrineCountScenes(SAGA_SCENES.eau, r) !== 7) return false;
        const pcts = SAGA_SCENES.eau.map(id => (r[id] && r[id].pct) || 0);
        const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
        return avg >= 85;
      },
      progress: () => {
        const r = doctrineSceneResults();
        const pcts = SAGA_SCENES.eau.map(id => (r[id] && r[id].pct) || 0);
        const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
        return { current: avg, target: 85 };
      } },

    // ─────────────────────────────────────────────────────────────
    // v122c — MAILLON FAIBLE (10 trophées : 7 actes + 1 tag cascade + 2 saga)
    // Saga supply chain / éditeur logiciel pour autorités, CEO Reber, Verax Software AG, oct-nov 2026
    // ─────────────────────────────────────────────────────────────
    { id: 'doc_supply_terabyte', emoji: '🔗', name: '1,4 To',
      desc: 'Démarrer Maillon faible — la rançon Play (acte 1)',
      category: 'Doctrine · Maillon faible',
      check: (s) => doctrineHasScene('supply-maillon-faible-1-terabyte', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('supply-maillon-faible-1-terabyte', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_supply_nonpaiement', emoji: '🛡️', name: 'Doctrine du non-paiement',
      desc: 'Tenir la doctrine NCSC non-paiement (Maillon faible acte 2)',
      category: 'Doctrine · Maillon faible',
      check: (s) => doctrineHasScene('supply-maillon-faible-2-non-paiement', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('supply-maillon-faible-2-non-paiement', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_supply_personnes', emoji: '👥', name: 'Combien de personnes ?',
      desc: 'Notification de masse LPD ~480k personnes (Maillon faible acte 3)',
      category: 'Doctrine · Maillon faible',
      check: (s) => doctrineHasScene('supply-maillon-faible-3-combien-personnes', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('supply-maillon-faible-3-combien-personnes', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_supply_etatmajor', emoji: '🏛️', name: 'État-major de crise',
      desc: 'État-major politico-stratégique du Conseil fédéral (Maillon faible acte 4)',
      category: 'Doctrine · Maillon faible',
      check: (s) => doctrineHasScene('supply-maillon-faible-4-etat-major-crise', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('supply-maillon-faible-4-etat-major-crise', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_supply_contrat', emoji: '📜', name: 'Responsabilité en cascade',
      desc: 'Cartographie contractuelle (Maillon faible acte 5)',
      category: 'Doctrine · Maillon faible',
      check: (s) => doctrineHasScene('supply-maillon-faible-5-contrat-responsabilite', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('supply-maillon-faible-5-contrat-responsabilite', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_supply_survie', emoji: '🆘', name: 'Survivre ou disparaître',
      desc: 'Recapitalisation ou rachat sous art. 102 CP (Maillon faible acte 6)',
      category: 'Doctrine · Maillon faible',
      check: (s) => doctrineHasScene('supply-maillon-faible-6-survie-entreprise', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('supply-maillon-faible-6-survie-entreprise', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_supply_doctrine', emoji: '🔗', name: 'Supply-CH 2026',
      desc: 'Porter la doctrine devant la CdG (Maillon faible acte 7)',
      category: 'Doctrine · Maillon faible',
      check: (s) => doctrineHasScene('supply-maillon-faible-7-cdg-doctrine', doctrineSceneResults()),
      progress: () => ({ current: doctrineHasScene('supply-maillon-faible-7-cdg-doctrine', doctrineSceneResults()) ? 1 : 0, target: 1 }) },

    { id: 'doc_supply_cascade', emoji: '🌙', name: '« Le maillon faible »',
      desc: 'Compléter 2+ scènes Maillon faible avec tag SUPPLY CHAIN ou MULTI-AUTORITÉS',
      category: 'Doctrine · Maillon faible',
      check: (s) => ((s.scenesTagCount && s.scenesTagCount['SUPPLY CHAIN']) || 0) +
                    ((s.scenesTagCount && s.scenesTagCount['MULTI-AUTORITÉS']) || 0) >= 2,
      progress: (s) => {
        const tc = s.scenesTagCount || {};
        return { current: (tc['SUPPLY CHAIN']||0) + (tc['MULTI-AUTORITÉS']||0), target: 2 };
      } },

    { id: 'doc_supply_saga_complete', emoji: '🔗', name: 'Doctrine Supply-CH',
      desc: 'Terminer la saga Maillon faible (7 actes)',
      category: 'Doctrine · Maillon faible',
      check: (s) => doctrineCountScenes(SAGA_SCENES.supply, doctrineSceneResults()) === 7,
      progress: () => ({ current: doctrineCountScenes(SAGA_SCENES.supply, doctrineSceneResults()), target: 7 }) },

    { id: 'doc_supply_excellence', emoji: '🌟', name: 'Excellence Maillon faible',
      desc: 'Terminer Maillon faible avec une moyenne ≥85%',
      category: 'Doctrine · Maillon faible',
      check: (s) => {
        const r = doctrineSceneResults();
        if (doctrineCountScenes(SAGA_SCENES.supply, r) !== 7) return false;
        const pcts = SAGA_SCENES.supply.map(id => (r[id] && r[id].pct) || 0);
        const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
        return avg >= 85;
      },
      progress: () => {
        const r = doctrineSceneResults();
        const pcts = SAGA_SCENES.supply.map(id => (r[id] && r[id].pct) || 0);
        const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
        return { current: avg, target: 85 };
      } },

  ];

  // ─────────────────────────────────────────────────────────────
  // v121d — RÉPUTATION (8 trophées institutionnels)
  //
  // Évaluation contre window.Reputation (cas-in-reputation.js)
  // ─────────────────────────────────────────────────────────────
  function repGet(id) {
    if (!window.Reputation || typeof window.Reputation.get !== 'function') return 0;
    return window.Reputation.get(id);
  }
  function repAbove50Count() {
    if (!window.Reputation) return 0;
    const all = window.Reputation.getAll();
    return Object.values(all).filter(v => (v || 0) >= 50).length;
  }

  const REPUTATION_ACH = [
    { id: 'rep_mpc_50', emoji: '⚖️', name: 'Reconnue au MPC',
      desc: 'Atteindre 50+ de réputation auprès du MPC',
      category: 'Doctrine · Réputation institutionnelle',
      check: () => repGet('MPC') >= 50,
      progress: () => ({ current: repGet('MPC'), target: 50 }) },

    { id: 'rep_mpc_100', emoji: '⚖️', name: 'Référence MPC',
      desc: 'Atteindre 100/100 de réputation auprès du MPC',
      category: 'Doctrine · Réputation institutionnelle',
      check: () => repGet('MPC') >= 100,
      progress: () => ({ current: repGet('MPC'), target: 100 }) },

    { id: 'rep_ncsc_50', emoji: '🛡️', name: 'Partenaire NCSC',
      desc: 'Atteindre 50+ de réputation auprès du NCSC',
      category: 'Doctrine · Réputation institutionnelle',
      check: () => repGet('NCSC') >= 50,
      progress: () => ({ current: repGet('NCSC'), target: 50 }) },

    { id: 'rep_pfpdt_50', emoji: '🔒', name: 'Allié du PFPDT',
      desc: 'Atteindre 50+ de réputation auprès du PFPDT',
      category: 'Doctrine · Réputation institutionnelle',
      check: () => repGet('PFPDT') >= 50,
      progress: () => ({ current: repGet('PFPDT'), target: 50 }) },

    { id: 'rep_eurojust_50', emoji: '🇪🇺', name: 'Voix européenne',
      desc: 'Atteindre 50+ de réputation auprès d\'Eurojust',
      category: 'Doctrine · Réputation institutionnelle',
      check: () => repGet('EUROJUST') >= 50,
      progress: () => ({ current: repGet('EUROJUST'), target: 50 }) },

    { id: 'rep_5_above_50', emoji: '🌟', name: 'Multi-référente',
      desc: '5 institutions à 50+ de réputation',
      category: 'Doctrine · Réputation institutionnelle',
      check: () => repAbove50Count() >= 5,
      progress: () => ({ current: repAbove50Count(), target: 5 }) },

    { id: 'rep_all_above_50', emoji: '🏛️', name: 'Pilier institutionnel',
      desc: 'Les 10 institutions à 50+ de réputation',
      category: 'Doctrine · Réputation institutionnelle',
      check: () => repAbove50Count() >= 10,
      progress: () => ({ current: repAbove50Count(), target: 10 }) },

    { id: 'rep_grand_total', emoji: '👑', name: 'Grande figure publique',
      desc: 'Atteindre 700+ de réputation cumulée (sur 1000)',
      category: 'Doctrine · Réputation institutionnelle',
      check: () => {
        if (!window.Reputation) return false;
        const stats = window.Reputation.getStats();
        return stats.total >= 700;
      },
      progress: () => {
        if (!window.Reputation) return { current: 0, target: 700 };
        const stats = window.Reputation.getStats();
        return { current: stats.total, target: 700 };
      } },
  ];

  // ─────────────────────────────────────────────────────────────
  // v121d — NARRATIVE SECRETS (10 trophées narratifs spécifiques)
  //
  // Évaluation basée sur scene_results[sceneId].choices_made[stepIdx]
  // qui contient l'index du choix sélectionné à chaque étape (persisté
  // depuis v121d). Cachés jusqu'au déblocage.
  // ─────────────────────────────────────────────────────────────
  function getChoiceMade(sceneId, stepIdx) {
    try {
      const results = JSON.parse(localStorage.getItem('scene_results') || '{}') || {};
      const r = results[sceneId];
      if (!r || !Array.isArray(r.choices_made)) return null;
      return r.choices_made[stepIdx];
    } catch (_) { return null; }
  }

  const NARRATIVE_SECRET_ACH = [
    // A1 Ransomware HRHP
    { id: 'narr_hrhp_no_payment', emoji: '🛡️', name: '« On ne paie pas »',
      desc: 'Doctrine de non-paiement appliquée à HRHP',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        // Acte 3 — décision rançon. Choix 0 = non-paiement (selon ordre original)
        const c = getChoiceMade('a1-ransomware-3-decision-rancon-restauration', 0);
        return c === 0;
      } },

    { id: 'narr_hrhp_117cp', emoji: '⚖️', name: 'Art. 117 CP retenu',
      desc: 'Acte 2 — qualification 117 CP face au décès patiente',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        const c = getChoiceMade('a1-ransomware-2-deces-patiente-bascule-penale', 0);
        return c === 0;
      } },

    // A2 EncroChat
    { id: 'narr_encro_acquittement', emoji: '🛡️', name: 'Le doute raisonnable',
      desc: 'Acquittement obtenu au procès Bashkimi',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        const c = getChoiceMade('a2-encrochat-7-proces-bashkimi-bilan-defense', 0);
        return c === 0;
      } },

    { id: 'narr_encro_krasniqi_coop', emoji: '🤝', name: '« 260ter al. 5 »',
      desc: 'Coopération significative obtenue de Krasniqi',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        const c = getChoiceMade('a2-encrochat-3-audition-krasniqi-cooperation', 0);
        return c === 0;
      } },

    { id: 'narr_encro_4_axes', emoji: '🎯', name: 'Plaidoirie 4 axes',
      desc: 'Plaidoirie EncroChat sur les 4 axes doctrinaux',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        const c = getChoiceMade('a2-encrochat-7-proces-bashkimi-bilan-defense', 1);
        return c === 0;
      } },

    // A6 HPM
    { id: 'narr_hpm_creative_commons', emoji: '📖', name: 'Doctrine pour tous',
      desc: 'Publication du HPM Doctrine Manual sous Creative Commons',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        const c = getChoiceMade('hpm-affaire-eimp-7-rapport-transparence-doctrine', 0);
        return c === 0;
      } },

    { id: 'narr_hpm_pfpdt_coop', emoji: '🔒', name: 'Allié du PFPDT',
      desc: 'Coopération avec le PFPDT en post-clôture',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        const c = getChoiceMade('hpm-affaire-eimp-6-notification-postcloture-pfpdt', 0);
        return c === 0;
      } },

    // C2 Laufenburg
    { id: 'narr_lauf_doctrine', emoji: '⚡', name: 'Doctrine DRQA',
      desc: 'Formalisation doctrinale du procès TPF Laufenburg',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        const c = getChoiceMade('ag-affaire-laufenburg-7-proces-tpf-bilan', 0);
        return c === 0;
      } },

    // A1 Parlement
    { id: 'narr_hrhp_parlement', emoji: '🏛️', name: 'Voix du Parlement',
      desc: 'Intervention au Parlement sur la cybersécurité santé',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        const c = getChoiceMade('a1-ransomware-7-bilan-doctrinal-parlement-cloture', 0);
        return c === 0;
      } },

    { id: 'narr_hrhp_salamin', emoji: '🌙', name: '« Mme Salamin honorée »',
      desc: 'Bilan personnel mature dans l\'acte 7 HRHP',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        const c = getChoiceMade('a1-ransomware-7-bilan-doctrinal-parlement-cloture', 1);
        return c === 0;
      } },

    // v122a — Étoile noire (3 narratifs secrets)
    { id: 'narr_etoile_piege_forensique', emoji: '🎣', name: 'Le piège forensique',
      desc: 'Maintenir le piège forensique plutôt que couper (Étoile noire acte 1)',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        // Acte 1 step 2 : choix (β) piège forensique = index 1
        const c = getChoiceMade('vd-affaire-etoile-noire-1-dimanche-decouverte', 1);
        return c === 1;
      } },

    { id: 'narr_etoile_face_camera', emoji: '📺', name: 'Face caméra',
      desc: 'Romanier assume l\'interview RTS en personne (Étoile noire acte 5)',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        // Acte 5 step 1 : choix (α) conférence + interview Romanier = index 0
        const c = getChoiceMade('vd-affaire-etoile-noire-5-fuite-presse-ofae', 0);
        return c === 0;
      } },

    { id: 'narr_etoile_reconnaissance', emoji: '🏛️', name: 'L\'aveu courageux',
      desc: 'Reconnaissance pleine + plaidoyer doctrinal au Parlement (Étoile noire acte 7)',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        // Acte 7 step 1 : choix (α) reconnaissance pleine = index 0
        const c = getChoiceMade('vd-affaire-etoile-noire-7-parlement-doctrine', 0);
        return c === 0;
      } },

    // v122b — Source trouble (3 narratifs secrets)
    { id: 'narr_eau_prudence', emoji: '🔬', name: 'L\'instinct de l\'ingénieure',
      desc: 'Triangulation physique avant toute conclusion (Source trouble acte 1)',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        // Acte 1 step 0 : choix (α) triangulation immédiate = index 0
        const c = getChoiceMade('eau-source-trouble-1-ecran-ment', 0);
        return c === 0;
      } },

    { id: 'narr_eau_avis_assume', emoji: '🚱', name: 'À chacun son rôle',
      desc: 'Respecter la compétence du chimiste cantonal, données honnêtes (Source trouble acte 5)',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        // Acte 5 step 0 : choix (α) dossier complet sans empiéter = index 0
        const c = getChoiceMade('eau-source-trouble-5-avis-non-consommation', 0);
        return c === 0;
      } },

    { id: 'narr_eau_fonds', emoji: '💧', name: 'Le fonds de la mutualisation',
      desc: 'Plaidoyer pour le fonds intercantonal au Grand Conseil (Source trouble acte 7)',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        // Acte 7 step 0 : choix (α) reconnaissance + plaidoyer Eau-CH 2026 = index 0
        const c = getChoiceMade('eau-source-trouble-7-grand-conseil-doctrine', 0);
        return c === 0;
      } },

    // ─── v122c MAILLON FAIBLE — 3 narratifs ───
    { id: 'narr_supply_transparence', emoji: '📞', name: 'Prévenir les clients',
      desc: 'Prévenir immédiatement les clients dès la découverte de la rançon (Maillon faible acte 1)',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        // Acte 1 step 2 : choix (α) prévenir clients immédiatement = index 0
        const c = getChoiceMade('supply-maillon-faible-1-terabyte', 2);
        return c === 0;
      } },

    { id: 'narr_supply_cooperation', emoji: '🤝', name: 'Coopération sans réserve',
      desc: 'Reconnaissance lucide + document confidentiel sans réticence (Maillon faible acte 5)',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        // Acte 5 step 0 : choix (α) reconnaissance lucide + cooperation = index 0
        const c = getChoiceMade('supply-maillon-faible-5-contrat-responsabilite', 0);
        return c === 0;
      } },

    { id: 'narr_supply_doctrine', emoji: '🏛️', name: 'La voix qu\'on écoute',
      desc: 'Reconnaissance lucide + plaidoyer Supply-CH 2026 devant la CdG (Maillon faible acte 7)',
      category: 'Doctrine · Choix narratifs (secrets)',
      check: () => {
        // Acte 7 step 0 : choix (α) reconnaissance + plaidoyer doctrinal = index 0
        const c = getChoiceMade('supply-maillon-faible-7-cdg-doctrine', 0);
        return c === 0;
      } },
  ];

  // ─────────────────────────────────────────────────────────────
  // v121e — COMPÉTENCES TECHNIQUES (8 trophées de maîtrise par domaine)
  //
  // Évaluation contre window.Competences (cas-in-competences.js)
  // ─────────────────────────────────────────────────────────────
  function compGet(id) {
    if (!window.Competences || typeof window.Competences.get !== 'function') return null;
    return window.Competences.get(id);
  }
  function compCountAtLevel(minScore) {
    if (!window.Competences) return 0;
    const all = window.Competences.getAll();
    return all.filter(c => c.score >= minScore).length;
  }

  const COMPETENCES_ACH = [
    // Compétences individuelles maîtrisées
    { id: 'comp_eimp_master', emoji: '🌐', name: 'Maîtresse de l\'EIMP',
      desc: 'Atteindre 95%+ en compétence EIMP (entraide pénale internationale)',
      category: 'Doctrine · Compétences techniques',
      check: () => { const c = compGet('EIMP'); return c && c.score >= 0.95; },
      progress: () => { const c = compGet('EIMP'); return { current: c ? Math.round(c.score * 100) : 0, target: 95 }; } },

    { id: 'comp_lpd_master', emoji: '🔒', name: 'Maîtresse de la LPD',
      desc: 'Atteindre 95%+ en compétence LPD + PFPDT',
      category: 'Doctrine · Compétences techniques',
      check: () => { const c = compGet('LPD'); return c && c.score >= 0.95; },
      progress: () => { const c = compGet('LPD'); return { current: c ? Math.round(c.score * 100) : 0, target: 95 }; } },

    { id: 'comp_141cpp_master', emoji: '⚖️', name: 'Maîtresse de l\'Art. 141 CPP',
      desc: 'Atteindre 95%+ en compétence Preuves illicites (Art. 141 CPP)',
      category: 'Doctrine · Compétences techniques',
      check: () => { const c = compGet('ART_141_CPP'); return c && c.score >= 0.95; },
      progress: () => { const c = compGet('ART_141_CPP'); return { current: c ? Math.round(c.score * 100) : 0, target: 95 }; } },

    { id: 'comp_crise_master', emoji: '🚨', name: 'Maîtresse des crises cyber',
      desc: 'Atteindre 95%+ en compétence Gestion de crise cyber',
      category: 'Doctrine · Compétences techniques',
      check: () => { const c = compGet('GESTION_CRISE_CYBER'); return c && c.score >= 0.95; },
      progress: () => { const c = compGet('GESTION_CRISE_CYBER'); return { current: c ? Math.round(c.score * 100) : 0, target: 95 }; } },

    // Polyvalence
    { id: 'comp_5_at_50', emoji: '🌟', name: 'Polyvalente',
      desc: '5 compétences à 50%+ (Confirmé·e ou plus)',
      category: 'Doctrine · Compétences techniques',
      check: () => compCountAtLevel(0.50) >= 5,
      progress: () => ({ current: compCountAtLevel(0.50), target: 5 }) },

    { id: 'comp_all_started', emoji: '📚', name: 'Exploratrice du droit',
      desc: 'Avoir commencé les 10 compétences techniques',
      category: 'Doctrine · Compétences techniques',
      check: () => compCountAtLevel(0.01) >= 10,
      progress: () => ({ current: compCountAtLevel(0.01), target: 10 }) },

    { id: 'comp_all_at_50', emoji: '🥈', name: 'Généraliste de référence',
      desc: '10 compétences à 50%+ (Confirmé·e ou plus)',
      category: 'Doctrine · Compétences techniques',
      check: () => compCountAtLevel(0.50) >= 10,
      progress: () => ({ current: compCountAtLevel(0.50), target: 10 }) },

    { id: 'comp_all_at_75', emoji: '💎', name: 'Expert·e pluridisciplinaire',
      desc: '10 compétences à 75%+ (Expert·e ou plus)',
      category: 'Doctrine · Compétences techniques',
      check: () => compCountAtLevel(0.75) >= 10,
      progress: () => ({ current: compCountAtLevel(0.75), target: 10 }) },
  ];
  // ─────────────────────────────────────────────────────────────
  // Tableau plat
  // ─────────────────────────────────────────────────────────────
  const ACHIEVEMENTS_META = [].concat(QUIZ_ACH, SCENE_ACH, TP_ACH, TOOLS_ACH, FICHE_ACH, DOCTRINE_ACH, REPUTATION_ACH, NARRATIVE_SECRET_ACH, COMPETENCES_ACH);

  // Index par id
  const _byId = {};
  ACHIEVEMENTS_META.forEach(a => { _byId[a.id] = a; });

  // v2.91 PACK L3 — Filtrage des achievements roleOnly selon le rôle actif
  function getActiveRole() {
    try {
      if (window.Profile && typeof window.Profile.getTrack === 'function') {
        return window.Profile.getTrack();
      }
    } catch (_) {}
    return null;
  }

  function isVisibleForRole(achievement, activeRole) {
    if (!achievement.roleOnly) return true;
    return achievement.roleOnly === activeRole;
  }

  // Index par catégorie (préserve l'ordre de CATEGORIES) — filtré par rôle
  function byCategory() {
    const out = {};
    const activeRole = getActiveRole();
    CATEGORIES.forEach(cat => { out[cat] = []; });
    ACHIEVEMENTS_META.forEach(a => {
      if (!isVisibleForRole(a, activeRole)) return;
      const cat = a.category || 'Quiz · Spécial';
      if (!out[cat]) out[cat] = [];
      out[cat].push(a);
    });
    // Supprimer les catégories vides après filtrage (ex: 'Rôle · Magistrat' si user est Hacker)
    Object.keys(out).forEach(cat => { if (out[cat].length === 0) delete out[cat]; });
    return out;
  }

  /**
   * v3.0 delta v44 — Tiers et récompense XP à l'unlock.
   *
   * Chaque achievement reçoit un tier visuel (bronze/argent/or/platine)
   * inféré de son ID ou tag. Le tier détermine la récompense XP attribuée
   * automatiquement à `Profile.unlockAchievement` (via Profile.addXp).
   *
   * - bronze   : 30 XP   (fondamentaux, premiers paliers : tp_first, fiche5, day3...)
   * - argent   : 75 XP   (paliers intermédiaires : tp_50, fiche50, daily30, streak10...)
   * - or       : 150 XP  (paliers difficiles : tp_250, fiche_marathon, expert_clean...)
   * - platine  : 300 XP  (rare : completionist, all themes, full saga or...)
   */
  const TIER_XP = { bronze: 30, argent: 75, or: 150, platine: 300 };

  function getAchievementTier(achId) {
    const id = String(achId || '');
    // v121e — Compétences techniques
    if (id === 'comp_all_at_75') return 'platine';
    if (id === 'comp_all_at_50' || /^comp_[a-z0-9_]+_master$/.test(id)) return 'or';
    if (id === 'comp_5_at_50') return 'argent';
    if (/^comp_/.test(id)) return 'argent';
    // v121d — Réputation : platine pour all_above_50 et grand_total, or pour 100, argent sinon
    if (id === 'rep_all_above_50' || id === 'rep_grand_total') return 'platine';
    if (id === 'rep_mpc_100' || id === 'rep_5_above_50') return 'or';
    if (/^rep_/.test(id)) return 'argent';
    // v121d — Narratifs secrets : tous "or" (choix narratifs marquants)
    if (/^narr_/.test(id)) return 'or';
    // v121c — Trophées doctrinaux
    // Platine (sommitaux, exigeants)
    if (id === 'doc_arc_complete' || id === 'doc_arc_excellence' || id === 'doc_master_procedure') return 'platine';
    // Or (saga complète, maîtres, excellence sectorielle)
    if (/^doc_.+_saga_complete$|^doc_.+_excellence$|^doc_master_|doc_arc_three_sagas|doc_encro_4_axes/.test(id)) return 'or';
    // Argent (trophées de tag transversal, milestones de saga)
    if (/^doc_arc_(furrer|eurojust|eimp|pfpdt|ncsc)$|^doc_.+_tags$|^doc_.+_146cp|^doc_.+_eimp_|^doc_.+_141cpp|^doc_.+_239cp|^doc_.+_117cp|doc_iban_lba_tags|doc_hpm_iso27037|doc_lauf_swissgrid|doc_hrhp_lcys|doc_vauthier_tags_cpp|doc_eau_fdia/.test(id)) return 'argent';
    // Bronze (autres trophées doctrinaux : actes individuels de saga)
    if (/^doc_/.test(id)) return 'bronze';

    // Platine existant (très rares)
    if (id === 'completionist' || id === 'allthemes' || id === 'legend_dfir' ||
        /full_saga_or|all_sagas|book100|marathon_complete/.test(id)) return 'platine';
    // Or existant (paliers exigeants)
    if (/250|500|1000|expert_clean|all_themes|streak_20|streak_30|daily30|daily14|book25|acc95/.test(id)) return 'or';
    // Argent existant (paliers intermédiaires)
    if (/50|100|streak10|daily7|book10|acc90|combo|tp_streak15|tp_categories15/.test(id)) return 'argent';
    // Bronze par défaut (paliers d'entrée + arcs NPC)
    return 'bronze';
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
          if (window.Profile.unlockAchievement(a.id)) {
            fresh.push(a.id);
            // v3.0 delta v44 — Attribution XP automatique selon tier
            try {
              const tier = a.tier || getAchievementTier(a.id);
              const xp = TIER_XP[tier] || TIER_XP.bronze;
              if (typeof window.Profile.addXp === 'function') {
                window.Profile.addXp(xp, 'achievement', { id: a.id, tier });
              }
            } catch (_) {}
          }
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
    getAchievementTier,
    TIER_XP,
  };

  // Backward-compat : si window.ACHIEVEMENTS n'est pas (encore) défini
  // par quiz-app.js, on fournit la metadata pour que le rendu trouve
  // emoji/name/desc via cet objet.
  if (typeof window.ACHIEVEMENTS === 'undefined') {
    window.ACHIEVEMENTS = ACHIEVEMENTS_META;
  }
})();
