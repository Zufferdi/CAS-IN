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
  // Tableau plat
  // ─────────────────────────────────────────────────────────────
  const ACHIEVEMENTS_META = [].concat(QUIZ_ACH, SCENE_ACH, TP_ACH, TOOLS_ACH, FICHE_ACH);

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
    // Platine (très rares)
    if (id === 'completionist' || id === 'allthemes' || id === 'legend_dfir' ||
        /full_saga_or|all_sagas|book100|marathon_complete/.test(id)) return 'platine';
    // Or (paliers exigeants)
    if (/250|500|1000|expert_clean|all_themes|streak_20|streak_30|daily30|daily14|book25|acc95/.test(id)) return 'or';
    // Argent (paliers intermédiaires)
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
