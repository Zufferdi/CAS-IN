/**
 * CAS-IN — Module Trophées
 * Version : 1.0 (v120)
 *
 * Responsabilité : définir les 72 trophées et évaluer leurs critères
 * après chaque événement (complétion de scène, gain de compétence, etc.)
 */

const TROPHIES = [
  // ============ CATÉGORIE 1 — PROGRESSION NARRATIVE ============
  { id: 'first_scene_completed', category: 'narrative', rarity: 'bronze', icon: '🥉',
    name: 'Premier pas',
    description: 'Compléter ta 1ʳᵉ scène',
    criterion: { type: 'scenes_completed_count', threshold: 1 }, xp: 25 },

  { id: 'first_saga_completed', category: 'narrative', rarity: 'bronze', icon: '🥉',
    name: 'Premier récit',
    description: 'Compléter ta 1ʳᵉ saga ou affaire',
    criterion: { type: 'sagas_completed_count', threshold: 1 }, xp: 50 },

  { id: 'five_sagas_completed', category: 'narrative', rarity: 'silver', icon: '🥈',
    name: 'Bibliothécaire',
    description: 'Compléter 5 sagas/affaires',
    criterion: { type: 'sagas_completed_count', threshold: 5 }, xp: 150 },

  { id: 'ten_sagas_completed', category: 'narrative', rarity: 'gold', icon: '🥇',
    name: 'Lecteur passionné',
    description: 'Compléter 10 sagas/affaires',
    criterion: { type: 'sagas_completed_count', threshold: 10 }, xp: 300 },

  { id: 'twenty_sagas_completed', category: 'narrative', rarity: 'platinum', icon: '💎',
    name: 'Conservateur des œuvres',
    description: 'Compléter 20 sagas/affaires',
    criterion: { type: 'sagas_completed_count', threshold: 20 }, xp: 500 },

  { id: 'all_sagas_completed', category: 'narrative', rarity: 'legendary', icon: '👑',
    name: 'Maître narrateur',
    description: 'Compléter les 33 sagas + affaires',
    criterion: { type: 'sagas_completed_count', threshold: 33 }, xp: 1500 },

  { id: 'arc_complet_6_sagas', category: 'narrative', rarity: 'legendary', icon: '👑',
    name: 'L\'arc complet (B2→A1)',
    description: 'Compléter les 6 sagas de l\'arc majeur (Vauthier, IBAN, Laufenburg, HPM, EncroChat, HRHP)',
    criterion: { type: 'specific_sagas_completed', sagas: [
      'saga-b2-vauthier-mpVD', 'saga-c1-iban-spoofing', 'saga-c2-etoile-laufenburg',
      'saga-a6-hpm-plateforme-chiffree', 'saga-a2-encrochat-skyecc', 'saga-a1-ransomware-hrhp'
    ]}, xp: 800 },

  { id: 'perfect_saga', category: 'narrative', rarity: 'gold', icon: '🥇',
    name: 'Sans-faute narrative',
    description: 'Compléter une saga avec 100% des choix optimaux',
    criterion: { type: 'perfect_sagas_count', threshold: 1 }, xp: 250 },

  { id: 'perfect_saga_5', category: 'narrative', rarity: 'platinum', icon: '💎',
    name: 'Maîtrise sans-faute',
    description: '5 sagas en sans-faute',
    criterion: { type: 'perfect_sagas_count', threshold: 5 }, xp: 700 },

  // ============ CATÉGORIE 2 — MAÎTRISE TECHNIQUE ============
  { id: 'first_competence_decouverte', category: 'competence', rarity: 'bronze', icon: '🥉',
    name: 'Premier éveil',
    description: 'Atteindre 25% sur 1 compétence',
    criterion: { type: 'any_competence_above', threshold: 0.25 }, xp: 25 },

  { id: 'competence_novice', category: 'competence', rarity: 'bronze', icon: '🥉',
    name: 'Novice confirmé',
    description: 'Atteindre 50% sur 1 compétence',
    criterion: { type: 'any_competence_above', threshold: 0.50 }, xp: 75 },

  { id: 'competence_expert', category: 'competence', rarity: 'silver', icon: '🥈',
    name: 'Expertise pointue',
    description: 'Atteindre 75% sur 1 compétence',
    criterion: { type: 'any_competence_above', threshold: 0.75 }, xp: 150 },

  { id: 'competence_maitre', category: 'competence', rarity: 'gold', icon: '🥇',
    name: 'Référence sectorielle',
    description: 'Atteindre 95% sur 1 compétence',
    criterion: { type: 'any_competence_above', threshold: 0.95 }, xp: 400 },

  { id: 'five_competences_confirme', category: 'competence', rarity: 'silver', icon: '🥈',
    name: 'Polyvalent',
    description: '5 compétences à 50% ou +',
    criterion: { type: 'competences_above_count', threshold: 0.50, count: 5 }, xp: 200 },

  { id: 'all_competences_started', category: 'competence', rarity: 'silver', icon: '🥈',
    name: 'Explorateur du droit',
    description: 'Avoir débuté les 10 compétences',
    criterion: { type: 'competences_above_count', threshold: 0.01, count: 10 }, xp: 200 },

  { id: 'all_competences_50', category: 'competence', rarity: 'gold', icon: '🥇',
    name: 'Généraliste de référence',
    description: '10 compétences à 50% ou +',
    criterion: { type: 'competences_above_count', threshold: 0.50, count: 10 }, xp: 500 },

  { id: 'all_competences_75', category: 'competence', rarity: 'platinum', icon: '💎',
    name: 'Expert pluridisciplinaire',
    description: '10 compétences à 75% ou +',
    criterion: { type: 'competences_above_count', threshold: 0.75, count: 10 }, xp: 1000 },

  { id: 'competence_eimp_maitre', category: 'competence', rarity: 'gold', icon: '🥇',
    name: 'Maître de l\'EIMP',
    description: 'EIMP à 95%',
    criterion: { type: 'specific_competence_above', competence: 'EIMP', threshold: 0.95 }, xp: 300 },

  { id: 'competence_lpd_maitre', category: 'competence', rarity: 'gold', icon: '🥇',
    name: 'Maître de la LPD',
    description: 'privacy_LPD à 95%',
    criterion: { type: 'specific_competence_above', competence: 'privacy_LPD', threshold: 0.95 }, xp: 300 },

  { id: 'competence_141cpp_maitre', category: 'competence', rarity: 'gold', icon: '🥇',
    name: 'Maître des preuves illicites',
    description: 'ART_141_CPP à 95%',
    criterion: { type: 'specific_competence_above', competence: 'ART_141_CPP', threshold: 0.95 }, xp: 300 },

  { id: 'competence_gestion_crise_maitre', category: 'competence', rarity: 'gold', icon: '🥇',
    name: 'Maître des crises cyber',
    description: 'gestion_crise_cyber à 95%',
    criterion: { type: 'specific_competence_above', competence: 'gestion_crise_cyber', threshold: 0.95 }, xp: 300 },

  // ============ CATÉGORIE 3 — RELATIONS PNJ ============
  { id: 'first_pnj_rencontre', category: 'pnj', rarity: 'bronze', icon: '🥉',
    name: 'Premier contact',
    description: 'Rencontrer ton 1ᵉʳ PNJ',
    criterion: { type: 'pnj_met_count', threshold: 1 }, xp: 25 },

  { id: 'ten_pnj_rencontres', category: 'pnj', rarity: 'bronze', icon: '🥉',
    name: 'Carnet d\'adresses',
    description: 'Rencontrer 10 PNJ',
    criterion: { type: 'pnj_met_count', threshold: 10 }, xp: 100 },

  { id: 'fifty_pnj_rencontres', category: 'pnj', rarity: 'silver', icon: '🥈',
    name: 'Réseau étendu',
    description: 'Rencontrer 50 PNJ',
    criterion: { type: 'pnj_met_count', threshold: 50 }, xp: 250 },

  { id: 'hundred_pnj_rencontres', category: 'pnj', rarity: 'gold', icon: '🥇',
    name: 'Carnet professionnel complet',
    description: 'Rencontrer 100 PNJ',
    criterion: { type: 'pnj_met_count', threshold: 100 }, xp: 500 },

  { id: 'first_pnj_niveau_3', category: 'pnj', rarity: 'silver', icon: '🥈',
    name: 'Premier allié',
    description: 'Atteindre niveau 3 avec un PNJ',
    criterion: { type: 'pnj_at_niveau_count', niveau: 3, threshold: 1 }, xp: 100 },

  { id: 'first_pnj_niveau_5', category: 'pnj', rarity: 'gold', icon: '🥇',
    name: 'Réseau intime',
    description: 'Atteindre niveau 5 avec un PNJ',
    criterion: { type: 'pnj_at_niveau_count', niveau: 5, threshold: 1 }, xp: 300 },

  { id: 'five_pnj_niveau_5', category: 'pnj', rarity: 'platinum', icon: '💎',
    name: 'Cercle de confiance',
    description: '5 PNJ à niveau 5',
    criterion: { type: 'pnj_at_niveau_count', niveau: 5, threshold: 5 }, xp: 600 },

  { id: 'furrer_niveau_5', category: 'pnj', rarity: 'silver', icon: '🥈',
    name: 'Confidente de Furrer',
    description: 'Niveau 5 avec Furrer (MPC)',
    criterion: { type: 'specific_pnj_at_niveau', pnj: 'mpc_procureur_federal_cyber', niveau: 5 }, xp: 200 },

  { id: 'pasche_niveau_5', category: 'pnj', rarity: 'silver', icon: '🥈',
    name: 'Partenaire de Pasche',
    description: 'Niveau 5 avec Pasche (POLGE)',
    criterion: { type: 'specific_pnj_at_niveau', pnj: 'ge_polge_pasche', niveau: 5 }, xp: 200 },

  { id: 'morard_niveau_5', category: 'pnj', rarity: 'silver', icon: '🥈',
    name: 'Compagnon de crise',
    description: 'Niveau 5 avec Morard (CISO HRHP)',
    criterion: { type: 'specific_pnj_at_niveau', pnj: 'hrhp_ciso_morard', niveau: 5 }, xp: 200 },

  { id: 'tout_arc_pnj_niveau_3', category: 'pnj', rarity: 'platinum', icon: '💎',
    name: 'Réseau de l\'arc',
    description: 'Niveau 3+ avec les 4 PNJ pivots de l\'arc (Furrer, Stalder, Morard, Manhart)',
    criterion: { type: 'multi_pnj_at_niveau', pnjs: [
      'mpc_procureur_federal_cyber', 'hpm_general_counsel_stalder',
      'hrhp_ciso_morard', 'gr_avocat_manhart',
    ], niveau: 3 }, xp: 800 },

  // ============ CATÉGORIE 4 — RÉPUTATION INSTITUTIONNELLE ============
  { id: 'mpc_reputation_50', category: 'reputation', rarity: 'silver', icon: '🥈',
    name: 'Reconnu par le MPC',
    description: '50+ réputation MPC',
    criterion: { type: 'specific_reputation_above', institution: 'MPC', threshold: 50 }, xp: 200 },

  { id: 'mpc_reputation_100', category: 'reputation', rarity: 'gold', icon: '🥇',
    name: 'Référence MPC',
    description: '100 réputation MPC (max)',
    criterion: { type: 'specific_reputation_above', institution: 'MPC', threshold: 100 }, xp: 500 },

  { id: 'ofj_reputation_50', category: 'reputation', rarity: 'silver', icon: '🥈',
    name: 'Voix de l\'entraide',
    description: '50+ réputation OFJ',
    criterion: { type: 'specific_reputation_above', institution: 'OFJ', threshold: 50 }, xp: 200 },

  { id: 'ncsc_reputation_50', category: 'reputation', rarity: 'silver', icon: '🥈',
    name: 'Partenaire cybersécurité',
    description: '50+ réputation NCSC',
    criterion: { type: 'specific_reputation_above', institution: 'NCSC', threshold: 50 }, xp: 200 },

  { id: 'ofcs_reputation_50', category: 'reputation', rarity: 'silver', icon: '🥈',
    name: 'Référence Plan SKI',
    description: '50+ réputation OFCS',
    criterion: { type: 'specific_reputation_above', institution: 'OFCS', threshold: 50 }, xp: 200 },

  { id: 'pfpdt_reputation_50', category: 'reputation', rarity: 'silver', icon: '🥈',
    name: 'Champion de la privacy',
    description: '50+ réputation PFPDT',
    criterion: { type: 'specific_reputation_above', institution: 'PFPDT', threshold: 50 }, xp: 200 },

  { id: 'h_plus_reputation_50', category: 'reputation', rarity: 'silver', icon: '🥈',
    name: 'Voix de la santé',
    description: '50+ réputation H+ Suisse',
    criterion: { type: 'specific_reputation_above', institution: 'H_plus_Suisse', threshold: 50 }, xp: 200 },

  { id: 'fsa_reputation_50', category: 'reputation', rarity: 'silver', icon: '🥈',
    name: 'Avocat respecté',
    description: '50+ réputation FSA',
    criterion: { type: 'specific_reputation_above', institution: 'FSA', threshold: 50 }, xp: 200 },

  { id: 'eurojust_reputation_50', category: 'reputation', rarity: 'silver', icon: '🥈',
    name: 'Pont européen',
    description: '50+ réputation Eurojust',
    criterion: { type: 'specific_reputation_above', institution: 'Eurojust', threshold: 50 }, xp: 200 },

  { id: 'international_50', category: 'reputation', rarity: 'gold', icon: '🥇',
    name: 'Acteur international',
    description: '50+ réputation OFAC US ou Conseil Europe',
    criterion: { type: 'any_reputation_above', institutions: ['OFAC_US', 'Conseil_Europe'], threshold: 50 }, xp: 400 },

  { id: '5_institutions_50', category: 'reputation', rarity: 'gold', icon: '🥇',
    name: 'Multi-acteur reconnu',
    description: '50+ réputation sur 5 institutions différentes',
    criterion: { type: 'reputations_above_count', threshold: 50, count: 5 }, xp: 500 },

  { id: 'all_institutions_50', category: 'reputation', rarity: 'platinum', icon: '💎',
    name: 'Pilier institutionnel',
    description: '50+ réputation sur les 10 institutions',
    criterion: { type: 'reputations_above_count', threshold: 50, count: 10 }, xp: 1200 },

  // ============ CATÉGORIE 5 — RÉGULARITÉ (STREAKS) ============
  { id: 'streak_3_jours', category: 'streak', rarity: 'bronze', icon: '🥉',
    name: 'Élan initial',
    description: '3 jours consécutifs de jeu',
    criterion: { type: 'streak_above', threshold: 3 }, xp: 50 },

  { id: 'streak_7_jours', category: 'streak', rarity: 'bronze', icon: '🥉',
    name: 'Semaine complète',
    description: '7 jours consécutifs',
    criterion: { type: 'streak_above', threshold: 7 }, xp: 100 },

  { id: 'streak_14_jours', category: 'streak', rarity: 'silver', icon: '🥈',
    name: 'Quinzaine',
    description: '14 jours consécutifs',
    criterion: { type: 'streak_above', threshold: 14 }, xp: 200 },

  { id: 'streak_30_jours', category: 'streak', rarity: 'gold', icon: '🥇',
    name: 'Habitude solide',
    description: '30 jours consécutifs',
    criterion: { type: 'streak_above', threshold: 30 }, xp: 400 },

  { id: 'streak_60_jours', category: 'streak', rarity: 'platinum', icon: '💎',
    name: 'Engagement profond',
    description: '60 jours consécutifs',
    criterion: { type: 'streak_above', threshold: 60 }, xp: 750 },

  { id: 'streak_100_jours', category: 'streak', rarity: 'legendary', icon: '👑',
    name: 'Discipline absolue',
    description: '100 jours consécutifs',
    criterion: { type: 'streak_above', threshold: 100 }, xp: 1500 },

  { id: 'streak_365_jours', category: 'streak', rarity: 'legendary', icon: '👑',
    name: 'Une année avec CAS-IN',
    description: '365 jours consécutifs',
    criterion: { type: 'streak_above', threshold: 365 }, xp: 5000 },

  { id: 'quete_du_jour_30', category: 'streak', rarity: 'silver', icon: '🥈',
    name: 'Régulier de la quête',
    description: '30 quêtes du jour complétées',
    criterion: { type: 'quete_du_jour_count', threshold: 30 }, xp: 250 },

  { id: 'quete_du_jour_100', category: 'streak', rarity: 'gold', icon: '🥇',
    name: 'Habitué de la quête',
    description: '100 quêtes du jour',
    criterion: { type: 'quete_du_jour_count', threshold: 100 }, xp: 800 },

  // ============ CATÉGORIE 6 — MÉTA / EXPLORATION ============
  { id: 'play_all_levels', category: 'meta', rarity: 'silver', icon: '🥈',
    name: 'Tous niveaux',
    description: 'Compléter au moins 1 scène de chaque niveau (stagiaire, enquêteur, expert)',
    criterion: { type: 'levels_completed', levels: ['stagiaire', 'enqueteur', 'expert'] }, xp: 150 },

  { id: 'play_all_roles', category: 'meta', rarity: 'silver', icon: '🥈',
    name: 'Vu de chaque côté',
    description: 'Compléter au moins 1 scène avec chacun des 9 rôles',
    criterion: { type: 'roles_completed', roles: ['procureur','police','dfir','defense-avocat','ciso-sante','in-house-counsel','journaliste','etat','soignant'] }, xp: 200 },

  { id: 'all_cantons', category: 'meta', rarity: 'gold', icon: '🥇',
    name: 'Tour de Suisse',
    description: 'Compléter au moins 1 scène dans chaque canton VS/VD/GE/BE/FR/JU/GR/TI/ZH',
    criterion: { type: 'cantons_completed', cantons: ['VS','VD','GE','BE','FR','JU','GR','TI','ZH'] }, xp: 400 },

  { id: 'night_owl', category: 'meta', rarity: 'bronze', icon: '🥉',
    name: 'Chouette de nuit',
    description: 'Compléter une scène entre 23h et 5h',
    criterion: { type: 'scene_at_hour_range', start: 23, end: 5 }, xp: 50 },

  { id: 'early_bird', category: 'meta', rarity: 'bronze', icon: '🥉',
    name: 'Lève-tôt',
    description: 'Compléter une scène entre 5h et 8h',
    criterion: { type: 'scene_at_hour_range', start: 5, end: 8 }, xp: 50 },

  { id: 'weekend_warrior', category: 'meta', rarity: 'bronze', icon: '🥉',
    name: 'Guerrier du weekend',
    description: 'Compléter 10 scènes un samedi ou dimanche',
    criterion: { type: 'scenes_weekend_count', threshold: 10 }, xp: 100 },

  { id: 'retry_master', category: 'meta', rarity: 'silver', icon: '🥈',
    name: 'Persévérant',
    description: 'Améliorer son score sur 10 scènes déjà jouées',
    criterion: { type: 'retries_improved_count', threshold: 10 }, xp: 200 },

  { id: 'first_retry_perfect', category: 'meta', rarity: 'silver', icon: '🥈',
    name: 'Apprenti studieux',
    description: 'Sur une scène ratée, obtenir un perfect au retry',
    criterion: { type: 'retry_perfect_after_fail', threshold: 1 }, xp: 150 },

  { id: 'all_journal_entries', category: 'meta', rarity: 'silver', icon: '🥈',
    name: 'Mémorialiste',
    description: 'Consulter le journal de bord 30 fois',
    criterion: { type: 'journal_views_count', threshold: 30 }, xp: 100 },

  // ============ CATÉGORIE 7 — NARRATIF SPÉCIAL (CACHÉS) ============
  { id: 'hrhp_no_payment', category: 'narrative_secret', rarity: 'gold', icon: '🥇',
    name: '"On ne paie pas"',
    description: 'Refuser le paiement de rançon en A1 scène 3',
    criterion: { type: 'specific_choice_made', scene: 'a1-ransomware-3-decision-rancon-restauration', choice: 'non-paiement' },
    xp: 200, hidden: true },

  { id: 'bashkimi_acquitted', category: 'narrative_secret', rarity: 'gold', icon: '🥇',
    name: 'Le doute raisonnable',
    description: 'Obtenir l\'acquittement de Bashkimi en A2 scène 7',
    criterion: { type: 'specific_choice_made', scene: 'a2-encrochat-7-proces-bashkimi-bilan-defense', choice: 'acquittement' },
    xp: 250, hidden: true },

  { id: 'volkov_audition_complete', category: 'narrative_secret', rarity: 'silver', icon: '🥈',
    name: 'À Bucarest',
    description: 'Participer à l\'audition Volkov en Roumanie A1 scène 6',
    criterion: { type: 'specific_choice_made', scene: 'a1-ransomware-6-procedure-penale-internationale', choice: 'audition-roumanie' },
    xp: 150, hidden: true },

  { id: 'parliament_4_amendments', category: 'narrative_secret', rarity: 'gold', icon: '🥇',
    name: 'Voix du Parlement',
    description: 'Intervention parlementaire A1 scène 7 avec position favorable sur les 4 amendements',
    criterion: { type: 'specific_choice_made', scene: 'a1-ransomware-7-bilan-doctrinal-parlement-cloture', choice: 'parliament-favorable-4' },
    xp: 300, hidden: true },

  { id: 'pfpdt_recommendations_accepted', category: 'narrative_secret', rarity: 'silver', icon: '🥈',
    name: 'Allié du PFPDT',
    description: 'Accepter et mettre en œuvre les recommandations PFPDT en A6 scène 6',
    criterion: { type: 'specific_choice_made', scene: 'hpm-affaire-eimp-6-notification-postcloture-pfpdt', choice: 'pfpdt-cooperation' },
    xp: 200, hidden: true },

  { id: 'creative_commons_publication', category: 'narrative_secret', rarity: 'gold', icon: '🥇',
    name: 'Doctrine pour tous',
    description: 'Publier le HPM Doctrine Manual sous Creative Commons en A6 scène 7',
    criterion: { type: 'specific_choice_made', scene: 'hpm-affaire-eimp-7-rapport-transparence-doctrine', choice: 'creative-commons' },
    xp: 300, hidden: true },

  { id: 'krasniqi_cooperation', category: 'narrative_secret', rarity: 'gold', icon: '🥇',
    name: '"260ter al. 5"',
    description: 'Obtenir la coopération significative de Krasniqi en A2 scène 3',
    criterion: { type: 'specific_choice_made', scene: 'a2-encrochat-3-audition-krasniqi-cooperation', choice: 'cooperation-significative' },
    xp: 250, hidden: true },

  { id: 'furrer_doctrine_drqa', category: 'narrative_secret', rarity: 'gold', icon: '🥇',
    name: 'Doctrine de Laufenburg',
    description: 'Compléter la formalisation doctrinale DRQA en C2 scène 7',
    criterion: { type: 'specific_choice_made', scene: 'c2-laufenburg-7-doctrine-drqa', choice: 'doctrine-formalisee' },
    xp: 250, hidden: true },

  { id: 'salamin_honored', category: 'narrative_secret', rarity: 'legendary', icon: '👑',
    name: '"Mme Salamin honorée"',
    description: 'Compléter A1 scène 7 avec lecture mature personnelle',
    criterion: { type: 'specific_choice_made', scene: 'a1-ransomware-7-bilan-doctrinal-parlement-cloture', choice: 'lecture-mature' },
    xp: 400, hidden: true },

  { id: 'manhart_quatre_axes', category: 'narrative_secret', rarity: 'gold', icon: '🥇',
    name: 'Maître des 4 axes',
    description: 'Déployer les 4 axes EncroChat dans la plaidoirie A2 scène 7',
    criterion: { type: 'specific_choice_made', scene: 'a2-encrochat-7-proces-bashkimi-bilan-defense', choice: 'plaidoirie-4-axes' },
    xp: 250, hidden: true },
];

const TROPHY_CATEGORIES = {
  narrative: { id: 'narrative', name: 'Progression narrative', icon: '📚' },
  competence: { id: 'competence', name: 'Maîtrise technique', icon: '🎯' },
  pnj: { id: 'pnj', name: 'Relations PNJ', icon: '👥' },
  reputation: { id: 'reputation', name: 'Réputation institutionnelle', icon: '🏛️' },
  streak: { id: 'streak', name: 'Régularité', icon: '🔥' },
  meta: { id: 'meta', name: 'Méta / Exploration', icon: '🎲' },
  narrative_secret: { id: 'narrative_secret', name: 'Narratif spécial', icon: '✨' },
};

/**
 * Évaluer un trophée : retourne progress { current, target, completed }
 */
function evaluateTrophy(trophy, profile, sceneIndex = null) {
  const c = trophy.criterion;
  switch (c.type) {
    case 'scenes_completed_count': {
      const count = Object.values(profile.scenes_etat || {})
        .filter(s => s.status === 'maitrisee' || s.status === 'en-cours').length;
      return { current: count, target: c.threshold, completed: count >= c.threshold };
    }

    case 'sagas_completed_count': {
      // Cette logique sera complétée en v121 quand on aura le mapping sagas
      // Pour v120, on approxime : une saga = 7 scènes maîtrisées avec préfixe commun
      const count = countCompletedSagas(profile);
      return { current: count, target: c.threshold, completed: count >= c.threshold };
    }

    case 'specific_sagas_completed': {
      const completed = c.sagas.filter(id => isSagaCompleted(profile, id));
      return { current: completed.length, target: c.sagas.length, completed: completed.length === c.sagas.length };
    }

    case 'perfect_sagas_count': {
      const count = countPerfectSagas(profile);
      return { current: count, target: c.threshold, completed: count >= c.threshold };
    }

    case 'any_competence_above': {
      const scores = Object.values(profile.competences || {}).map(comp => comp.score);
      const maxScore = Math.max(0, ...scores);
      return { current: maxScore, target: c.threshold, completed: maxScore >= c.threshold };
    }

    case 'specific_competence_above': {
      const score = profile.competences?.[c.competence]?.score || 0;
      return { current: score, target: c.threshold, completed: score >= c.threshold };
    }

    case 'competences_above_count': {
      const count = Object.values(profile.competences || {})
        .filter(comp => comp.score >= c.threshold).length;
      return { current: count, target: c.count, completed: count >= c.count };
    }

    case 'pnj_met_count': {
      const count = Object.keys(profile.relations_pnj || {}).length;
      return { current: count, target: c.threshold, completed: count >= c.threshold };
    }

    case 'pnj_at_niveau_count': {
      const count = Object.values(profile.relations_pnj || {})
        .filter(rel => rel.niveau >= c.niveau).length;
      return { current: count, target: c.threshold, completed: count >= c.threshold };
    }

    case 'specific_pnj_at_niveau': {
      const niveau = profile.relations_pnj?.[c.pnj]?.niveau || 0;
      return { current: niveau, target: c.niveau, completed: niveau >= c.niveau };
    }

    case 'multi_pnj_at_niveau': {
      const matched = c.pnjs.filter(pnj => (profile.relations_pnj?.[pnj]?.niveau || 0) >= c.niveau);
      return { current: matched.length, target: c.pnjs.length, completed: matched.length === c.pnjs.length };
    }

    case 'specific_reputation_above': {
      const value = profile.reputation?.[c.institution] || 0;
      return { current: value, target: c.threshold, completed: value >= c.threshold };
    }

    case 'any_reputation_above': {
      const max = Math.max(0, ...c.institutions.map(inst => profile.reputation?.[inst] || 0));
      return { current: max, target: c.threshold, completed: max >= c.threshold };
    }

    case 'reputations_above_count': {
      const count = Object.values(profile.reputation || {}).filter(v => v >= c.threshold).length;
      return { current: count, target: c.count, completed: count >= c.count };
    }

    case 'streak_above': {
      const streak = profile.streaks?.current_streak || 0;
      const longest = profile.streaks?.longest_streak || 0;
      const best = Math.max(streak, longest);
      return { current: best, target: c.threshold, completed: best >= c.threshold };
    }

    case 'quete_du_jour_count': {
      const count = profile.session_history?.quetes_du_jour_completees || 0;
      return { current: count, target: c.threshold, completed: count >= c.threshold };
    }

    case 'levels_completed':
    case 'roles_completed':
    case 'cantons_completed':
    case 'scene_at_hour_range':
    case 'scenes_weekend_count':
    case 'retries_improved_count':
    case 'retry_perfect_after_fail':
    case 'journal_views_count':
    case 'specific_choice_made':
      // Évaluation déléguée à des évaluateurs spécifiques (v121+)
      return { current: 0, target: 1, completed: false };

    default:
      return { current: 0, target: 1, completed: false };
  }
}

// Helpers
function countCompletedSagas(profile) {
  // v120 simplifié : à raffiner en v121 avec mapping explicite
  const sceneIds = Object.keys(profile.scenes_etat || {});
  const masteredIds = sceneIds.filter(id => profile.scenes_etat[id].status === 'maitrisee');
  // Grouper par préfixe de saga (heuristique)
  const sagas = {};
  masteredIds.forEach(id => {
    const prefix = id.split('-').slice(0, 2).join('-');
    sagas[prefix] = (sagas[prefix] || 0) + 1;
  });
  return Object.values(sagas).filter(n => n >= 5).length;
}

function isSagaCompleted(profile, sagaId) {
  // v120 simplifié
  return false;
}

function countPerfectSagas(profile) {
  // v120 simplifié
  return 0;
}

/**
 * Évaluer tous les trophées et débloquer ceux qui sont complétés
 * Renvoie les trophées nouvellement débloqués (pour notifications)
 */
function evaluateAllTrophies(profile, sceneIndex = null) {
  const newlyUnlocked = [];

  for (const trophy of TROPHIES) {
    if (profile.achievements.unlocked.includes(trophy.id)) continue;

    const evalResult = evaluateTrophy(trophy, profile, sceneIndex);
    profile.achievements.progress[trophy.id] = evalResult;

    if (evalResult.completed) {
      profile.achievements.unlocked.push(trophy.id);
      profile.achievements.unlocked_at[trophy.id] = new Date().toISOString();
      newlyUnlocked.push(trophy);
    }
  }

  return newlyUnlocked;
}

/**
 * Stats globales sur les trophées
 */
function getTrophyStats(profile) {
  const unlocked = profile.achievements.unlocked || [];
  const totalXP = unlocked.reduce((sum, id) => {
    const t = TROPHIES.find(t => t.id === id);
    return sum + (t?.xp || 0);
  }, 0);

  const byCategory = {};
  for (const cat of Object.keys(TROPHY_CATEGORIES)) {
    const total = TROPHIES.filter(t => t.category === cat).length;
    const done = TROPHIES.filter(t => t.category === cat && unlocked.includes(t.id)).length;
    byCategory[cat] = { done, total };
  }

  return {
    total_unlocked: unlocked.length,
    total_trophies: TROPHIES.length,
    total_xp: totalXP,
    max_xp: TROPHIES.reduce((sum, t) => sum + t.xp, 0),
    by_category: byCategory,
  };
}

// Export
export {
  TROPHIES,
  TROPHY_CATEGORIES,
  evaluateTrophy,
  evaluateAllTrophies,
  getTrophyStats,
};
