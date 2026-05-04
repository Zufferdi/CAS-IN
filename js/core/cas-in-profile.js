/* ============================================================
   CAS-IN · cas-in-profile.js (v2 — F2)
   Source unique pour rang, XP, streak, badges, identité d'agent.
   4 tracks narratifs : investigator, magistrate, journalist, hacker.
   API d'écriture pour Quiz/Scène (pas de TP : compteur seul).
   Migration silencieuse one-shot des anciennes clés.
   ============================================================ */

(function () {
  'use strict';

  const PROFILE_KEY = 'casIn_profile';
  const PROFILE_VERSION = 4;

  // ───────────────────────────────────────────────────────────
  // Échelles XP : mêmes seuils pour les 4 tracks (XP universelle)
  // ───────────────────────────────────────────────────────────

  // v4 (avril 2026) — Extension à 15 paliers : insertion de 3 rangs entre
  // l'avant-dernier rang historique et la légende, pour offrir plus de
  // progression au sommet sans frustrer les utilisateurs déjà au cap.
  // Sauts : 250, 300, 400, 600, 800, 1100, 1500, 1900, 2400, 3000, 3700, 4500, 5500, 6700.
  // Migration douce v3 → v4 : conversion proportionnelle, rang préservé.
  // Le rang 11 v3 (Légende, cap 17 950) → rang 14 v4 (Légende, cap 32 650).
  const XP_THRESHOLDS = [0, 250, 550, 950, 1550, 2350, 3450, 4950, 6850, 9250, 12250, 15950, 20450, 25950, 32650];

  // v3 (legacy) — Conservé uniquement pour la migration v3 → v4.
  const XP_THRESHOLDS_V3 = [0, 250, 550, 950, 1550, 2350, 3450, 4950, 6950, 9450, 12950, 17950];

  // v2 (legacy) — Conservé pour la migration v2 → v4 (chaîne complète).
  const XP_THRESHOLDS_V2 = [0, 250, 500, 1000, 1800, 2800, 4200, 6500, 10000, 15000, 25000, 40000];

  const CLEARANCE_BY_RANK = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5];

  // ───────────────────────────────────────────────────────────
  // Bonus XP par rôle : +20% sur les contenus du domaine de spécialité.
  // - Tags scènes : majuscules normalisées (FORENSIQUE, DROIT, etc.)
  // - Thèmes questions : intitulés tels quels (ex. "Système de fichiers",
  //   "Droit", "OSINT") ; normalisation en interne (lowercase, accents).
  // ───────────────────────────────────────────────────────────

  // Note v2.10+ : trois systèmes de bonus thématique coexistaient
  // historiquement (TRACK_BONUS_RAW, TRACK_BONUS_TAGS, ROLE_BONUS).
  // Seul ROLE_BONUS_TAGS ci-dessous est branché à addXp(). Les deux
  // autres ont été supprimés pour éviter la confusion lors de la
  // maintenance future.

  // ───────────────────────────────────────────────────────────
  // Bonus XP thématique par rôle (track) — +20% si la scène/question
  // matche au moins un tag de la liste du rôle. Plafond 1.20× : un seul
  // match suffit, pas de cumul (lisible et juste).
  // Les tags sont normalisés en MAJUSCULES sans accents pour comparer.
  // ───────────────────────────────────────────────────────────
  const ROLE_BONUS_TAGS = {
    investigator: [
      // Tags scène
      'FORENSIQUE', 'OSINT', 'PREMIER INTERVENANT', 'PROFIL', 'PROFILAGE',
      'PJ', 'POLICE', 'TERRAIN', 'PREUVES', 'CUSTODY', 'CHAINE DE POSSESSION',
      'SCENE DE CRIME', 'PERQUISITION', 'INVESTIGATION',
      'MOBILE FORENSICS', 'MEMORY FORENSICS', 'CLOUD FORENSICS',
      // Thèmes quiz
      'ACQUISITION ET ANALYSE', 'FORENSIQUE', 'OSINT',
    ],
    magistrate: [
      // Tags scène
      'DROIT', 'DROIT PENAL', 'CPP', 'CP', 'EIMP', 'PROCEDURE', 'JURISPRUDENCE',
      'LPD', 'LSI', 'PROCUREUR', 'AUDIT FORENSIQUE', 'GOUVERNANCE',
      'GOUVERNANCE INCIDENT', 'GOUVERNANCE CANTONALE', 'DROIT PUBLIC',
      'DROIT CIVIL', 'JUGE', 'TMC', 'MPC', 'RGPD',
      // Thèmes quiz
      'DROIT',
    ],
    journalist: [
      // Tags scène
      'OSINT', 'DARKNET', 'MEDIAS', 'SOURCES', 'COMMUNICATION DE CRISE',
      'ENQUETE COUVERTE', 'INVESTIGATION', 'PEDOCRIMINALITE', 'DEEPFAKE',
      'IA', 'AUDIO FORENSIQUE',
      // Thèmes quiz
      'OSINT',
    ],
    hacker: [
      // Tags scène
      'MALWARE', 'RANSOMWARE', 'RESEAUX', 'CRYPTO', 'WINDOWS',
      'CHAINE D\'ATTAQUE', 'OT', 'SCADA', 'BEC', 'SOCIAL ENGINEERING',
      'SUPPLY CHAIN', 'IA', 'DDOS', 'PHISHING', 'VISHING', 'INFOSTEALER',
      // Thèmes quiz
      'SYSTEME DE FICHIERS', 'SPECIFICITE DES OS', 'CRYPTOLOGIE',
    ],
  };

  // Normalise un tag pour la comparaison : MAJ + sans accents + sans ponctuation
  function normalizeTag(t) {
    return String(t || '')
      .toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9 ]/g, '')
      .trim();
  }

  // Pré-calcule les Sets normalisés une fois (perfs)
  const NORMALIZED_BONUS = Object.fromEntries(
    Object.entries(ROLE_BONUS_TAGS).map(([role, tags]) => [
      role, new Set(tags.map(normalizeTag))
    ])
  );

  /**
   * Retourne le multiplicateur d'XP à appliquer pour le rôle actif
   * face à la liste de tags fournie. 1.20 si match, sinon 1.00.
   * @param {string[]} tags - Tags / thèmes de la scène ou question
   * @returns {number} multiplicateur (1.0 ou 1.2)
   */
  function getRoleBonus(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return 1.0;
    const p = ensureProfile();
    const role = p.agent && p.agent.track;
    if (!role || !NORMALIZED_BONUS[role]) return 1.0;
    const set = NORMALIZED_BONUS[role];
    for (const t of tags) {
      if (set.has(normalizeTag(t))) return 1.20;
    }
    return 1.0;
  }

  // ───────────────────────────────────────────────────────────
  // 4 tracks · 12 grades chacun · personnages uniques
  // ───────────────────────────────────────────────────────────

  const TRACKS = {
    investigator: {
      key: 'investigator',
      label: 'Enquêteur',
      icon: '🕵',
      ambiance: 'Terrain · preuves · profilage',
      themeColor: '#38b6ff',
      affinity: {
        sceneTags:  ['FORENSIQUE', 'POLICE', 'PJ', 'AUDIO FORENSIQUE', 'ENQUÊTE COUVERTE'],
        quizThemes: ['Forensique', 'Acquisition et analyse', 'Système de fichiers'],
        multiplier: 1.20,
      },
      ranks: [
        { emoji: '🔰',   name: 'Stagiaire',                flavor: 'Premier jour. Le café est dans la salle de pause.' },
        { emoji: '👮',   name: 'Enquêteur de terrain',     flavor: 'Tu sais déjà ouvrir un rapport sans paniquer.' },
        { emoji: '🕵️',   name: 'Inspecteur Morse',         flavor: 'L\'instinct s\'éveille. Endeavour Morse approuve.' },
        { emoji: '🔎',   name: 'Commissaire Maigret',      flavor: 'La pipe, la patience, la victoire.' },
        { emoji: '🔬',   name: 'Abby Sciuto',              flavor: 'Reine du labo forensique. CafPow obligatoire.' },
        { emoji: '🦴',   name: 'Dr Temperance Brennan',    flavor: 'Les os parlent. Et ils ne mentent jamais.' },
        { emoji: '🧠',   name: 'Spencer Reid',             flavor: 'QI 187. Mémoire photographique. Tout.' },
        { emoji: '🧥',   name: 'Inspecteur Columbo',       flavor: '"Une dernière chose, madame…"' },
        { emoji: '🔍',   name: 'Sherlock Holmes',          flavor: 'Élémentaire, mon cher Watson.' },
        { emoji: '⚖️',   name: 'Maître Locard',            flavor: 'Père de la criminalistique. Échange Locard : maîtrisé.' },
        { emoji: '🎩',   name: 'Hercule Poirot',           flavor: 'Les petites cellules grises font leur travail.' },
        { emoji: '🌧️',   name: 'Sarah Linden',             flavor: 'The Killing · l\'obsession qui ne lâche jamais.' },
        { emoji: '❄️',   name: 'Saga Norén',               flavor: 'Bron/Broen · la précision méthodique scandinave.' },
        { emoji: '🎯',   name: 'Eliot Ness',               flavor: 'The Untouchables · incorruptible jusqu\'au bout.' },
        { emoji: '👑',   name: 'Légende DFIR',             flavor: 'Ton expertise fait jurisprudence.' },
      ],
    },
    magistrate: {
      key: 'magistrate',
      label: 'Magistrat',
      icon: '⚖️',
      ambiance: 'Décision · instruction · prétoire',
      themeColor: '#c89b3c',
      affinity: {
        sceneTags:  ['DROIT', 'DROIT PÉNAL', 'CPP', 'LPD', 'ENTRAIDE', 'ENTRAIDE FR-CH'],
        quizThemes: ['Droit'],
        multiplier: 1.20,
      },
      ranks: [
        { emoji: '📜',   name: 'Greffier stagiaire',         flavor: 'Tu apprends à classer les pièces sans tout mélanger.' },
        { emoji: '⚖️',   name: 'Substitut du procureur',     flavor: 'Premier réquisitoire. Les mains tremblent un peu.' },
        { emoji: '🏛️',   name: 'Juge Roban',                 flavor: 'L\'instruction est lente, méthodique, implacable.' },
        { emoji: '👨‍⚖️',  name: 'Atticus Finch',              flavor: 'Le courage commence là où la peur recule.' },
        { emoji: '🗡️',   name: 'Procureure Daumier',         flavor: 'Le boulevard du palais ne tremble pas.' },
        { emoji: '⚔️',   name: 'Harvey Specter',             flavor: 'I don\'t play the odds, I play the man.' },
        { emoji: '🏛️',   name: 'Juge Bordon',                flavor: 'Boston Legal : l\'éloquence à l\'état pur.' },
        { emoji: '⚖️',   name: 'Procureure Florrick',        flavor: 'Reprendre sa carrière à 40 ans, c\'est une victoire.' },
        { emoji: '⚜️',   name: 'Juge Falcone',               flavor: 'On ne meurt pas pour les idées qui survivent.' },
        { emoji: '🏛️',   name: 'Juge Dredd',                 flavor: 'I am the law.' },
        { emoji: '⚖️',   name: 'Juge Marshall',              flavor: 'La justice n\'a de sens que si elle s\'applique à tous.' },
        { emoji: '🔥',   name: 'Procureur Cassagne',         flavor: 'Engrenages · l\'instruction sans relâche.' },
        { emoji: '🛡️',   name: 'Juge Renaud',                flavor: 'Le Juge · l\'incorruptible face aux pressions.' },
        { emoji: '🌍',   name: 'Robert H. Jackson',          flavor: 'Nuremberg · la justice contre la barbarie.' },
        { emoji: '👑',   name: 'Magistrat suprême',          flavor: 'Au-dessus, il n\'y a plus que la loi elle-même.' },
      ],
    },
    journalist: {
      key: 'journalist',
      label: 'Journaliste',
      icon: '📰',
      ambiance: 'Investigation · sources · révélation',
      themeColor: '#ff6b6b',
      affinity: {
        sceneTags:  ['OSINT', 'DARKNET', 'SOCIAL ENGINEERING', 'VISHING', 'DEEPFAKE', 'IA', 'PÉDOCRIMINALITÉ', 'BEC'],
        quizThemes: ['OSINT'],
        multiplier: 1.20,
      },
      ranks: [
        { emoji: '📝',   name: 'Pigiste stagiaire',          flavor: 'Premier papier corrigé en rouge. Bienvenue.' },
        { emoji: '📰',   name: 'Localier',                   flavor: 'Tu connais chaque commerçant du quartier.' },
        { emoji: '🎙️',   name: 'Tintin',                     flavor: 'Mille sabords ! Le scoop du siècle ?' },
        { emoji: '📷',   name: 'Mikael Blomkvist',           flavor: 'Millénium · l\'enquête ne s\'arrête jamais.' },
        { emoji: '🕴️',   name: 'Clark Kent',                 flavor: 'Sous la cape, la plume reste affûtée.' },
        { emoji: '📡',   name: 'Murphy Brown',               flavor: 'FYI. Aucune institution ne t\'impressionne.' },
        { emoji: '🗞️',   name: 'Lou Bloom',                  flavor: 'Nightcrawler · l\'ombre qui filme la lumière.' },
        { emoji: '🎬',   name: 'April O\'Neil',              flavor: 'Channel 6 · toujours là où ça bouge.' },
        { emoji: '🔦',   name: 'Bob Woodward',               flavor: 'Watergate. Suivez l\'argent.' },
        { emoji: '⚡',   name: 'Bernard Pivot',              flavor: 'Apostrophes. Le verbe comme arme.' },
        { emoji: '🌐',   name: 'Edward R. Murrow',           flavor: 'Good night, and good luck.' },
        { emoji: '🏛️',   name: 'Carl Bernstein',             flavor: 'All The President\'s Men · le scoop qui fait tomber un président.' },
        { emoji: '🦅',   name: 'Hunter S. Thompson',         flavor: 'Gonzo journalism · l\'écriture comme drogue dure.' },
        { emoji: '🌍',   name: 'Albert Londres',             flavor: 'Inventeur du grand reportage. "Notre métier n\'est pas de faire plaisir."' },
        { emoji: '👑',   name: 'Plume légendaire',           flavor: 'Tes papiers font tomber des gouvernements.' },
      ],
    },
    hacker: {
      key: 'hacker',
      label: 'Hacker éthique',
      icon: '⌨️',
      ambiance: 'Réseaux · pentest · zero-day',
      ranks: [
        { emoji: '🐣',   name: 'Script kiddie repenti',      flavor: 'Tu sais qu\'un firewall, ce n\'est pas un mur de feu.' },
        { emoji: '⌨️',   name: 'Bug hunter junior',          flavor: 'Premier CVE soumis. Reconnaissance officielle.' },
        { emoji: '🥷',   name: 'Trinity',                    flavor: 'Follow the white rabbit.' },
        { emoji: '💾',   name: 'Lisbeth Salander',           flavor: 'Le dragon tatoué. Rien ne résiste.' },
        { emoji: '🎭',   name: 'Elliot Alderson',            flavor: 'fsociety approuve. Hello, friend.' },
        { emoji: '🦴',   name: 'Acid Burn',                  flavor: 'Hack the planet ! 1995 forever.' },
        { emoji: '🌊',   name: 'Stanley Jobson',             flavor: 'Swordfish · 60 secondes pour pirater le Pentagone.' },
        { emoji: '🎩',   name: 'Hackerman',                  flavor: 'Kung Fury · "I\'m hacking time."' },
        { emoji: '🥷',   name: 'Kevin Mitnick',              flavor: 'Le condor. L\'art de la persuasion sociale.' },
        { emoji: '📜',   name: 'The Mentor',                 flavor: 'This is our world now... the world of the electron.' },
        { emoji: '🧬',   name: 'Alan Turing',                flavor: 'Père de l\'informatique. Bletchley Park 1943.' },
        { emoji: '📚',   name: 'Aaron Swartz',               flavor: 'L\'idéaliste de l\'open access. Information wants to be free.' },
        { emoji: '👻',   name: 'Phineas Fisher',             flavor: 'Le hacktiviste fantôme. Hacking team, hacked.' },
        { emoji: '🌹',   name: 'Ada Lovelace',               flavor: '1843 — la première programmeuse de l\'histoire.' },
        { emoji: '👑',   name: 'Légende du dark net',        flavor: 'Tu es au-delà du réseau. Tu ES le réseau.' },
      ],
    },
  };

  // ───────────────────────────────────────────────────────────
  // Track Bonus — chaque rôle obtient +20% XP sur les contenus de son
  // domaine. Les tags ci-dessous sont matchés contre :
  //   - scene.tags (UPPERCASE) lors d'une scène
  //   - question.theme (capitalized) lors d'un quiz
  // Le bonus se cumule MULTIPLICATIVEMENT avec le streak bonus existant.
  // ───────────────────────────────────────────────────────────

  // (Système TRACK_BONUS_VALUE/TRACK_BONUS_TAGS/getTrackBonus retiré en v2.10+
  // — il n'a jamais été branché. Le système actif est ROLE_BONUS_TAGS +
  // getRoleBonus() défini plus haut, appelé depuis addXp().)

  // ───────────────────────────────────────────────────────────
  // Clés legacy à lire / migrer
  // ───────────────────────────────────────────────────────────

  const LEGACY_KEYS = {
    xpQuiz:       'xp',
    xpScene:      'cas_xp',
    streakQuiz:   'dayStreak',
    streakScene:  'cas_streak',
    qsAnswered:   'qs',
    fiches:       'casIn_readFiches_v4',
    examHist:     'examHist',
    sceneResults: 'scene_results',
    tpSolved:     'tp_solved',
    achievements: 'achievements',
    agentPseudo:  'casIn_agentPseudo',
    viewMode:     'casIn_viewMode',
    landingViews: 'casIn_landingViews',
  };

  // ───────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────

  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      try { return JSON.parse(raw); } catch { return raw; }
    } catch { return fallback; }
  }
  function lsSet(key, value) {
    try {
      const v = (typeof value === 'string') ? value : JSON.stringify(value);
      localStorage.setItem(key, v);
    } catch (_) {}
  }
  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch (_) {}
  }
  function asInt(v, d = 0) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : d;
  }
  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  // ───────────────────────────────────────────────────────────
  // Profil par défaut
  // ───────────────────────────────────────────────────────────

  function buildInitialProfile() {
    return {
      v: PROFILE_VERSION,
      createdAt: Date.now(),
      migrated: false,
      agent: {
        pseudo: lsGet(LEGACY_KEYS.agentPseudo, '') || '',
        track: null, // 'investigator' | 'magistrate' | 'journalist' | 'hacker' | null
        trackChosenAt: null,
      },
      xp: 0,
      xpBySource: { quiz: 0, scene: 0, quest: 0, tp: 0, fiches: 0 },
      streak: {
        current: 0,
        max: 0,
        lastDate: null,
      },
      activity: {
        // 'quiz' | 'scene' | 'tp' → timestamp
      },
      milestones: {},
      achievements: [],
      preferences: {
        viewMode: lsGet(LEGACY_KEYS.viewMode, 'auto') || 'auto',
        equippedTitle: null,
      },
    };
  }

  // ───────────────────────────────────────────────────────────
  // Lecture / écriture du profil + migration
  // ───────────────────────────────────────────────────────────

  /**
   * Garantit qu'un profil existe et a la bonne version.
   * Migration des anciens profils v=1 vers v=2 si nécessaire.
   */
  function ensureProfile() {
    let p = lsGet(PROFILE_KEY, null);

    // Pas de profil → créer + migration legacy une seule fois.
    // Les compteurs legacy sont sur l'échelle v2, donc on rééchelonne v2→v3
    // puis v3→v4 pour conserver le rang attendu par l'utilisateur.
    if (!p || typeof p !== 'object') {
      p = buildInitialProfile();
      migrateLegacyToProfile(p);
      migrateXpV2ToV3(p);
      migrateXpV3ToV4(p);
      lsSet(PROFILE_KEY, p);
      return p;
    }

    // Profil v=1 (F1) → upgrader vers v=4 sans perte
    if (p.v === 1) {
      const fresh = buildInitialProfile();
      // Conserver pseudo et préférences
      if (p.agent && p.agent.pseudo) fresh.agent.pseudo = p.agent.pseudo;
      if (p.preferences && p.preferences.viewMode) fresh.preferences.viewMode = p.preferences.viewMode;
      if (p.streak) fresh.streak = { ...fresh.streak, ...p.streak };
      // Migrer les anciennes clés legacy si pas encore fait
      if (!p.migrated) {
        migrateLegacyToProfile(fresh);
      } else {
        fresh.migrated = true;
      }
      // L'XP reconstituée depuis les clés legacy est sur l'échelle v2.
      // Chaîner v2→v3→v4.
      migrateXpV2ToV3(fresh);
      migrateXpV3ToV4(fresh);
      lsSet(PROFILE_KEY, fresh);
      return fresh;
    }

    // Profil v=2 (échelle XP exponentielle) → upgrader vers v=4
    if (p.v === 2) {
      migrateXpV2ToV3(p);
      migrateXpV3ToV4(p);
      p.v = 4;
      lsSet(PROFILE_KEY, p);
      return p;
    }

    // Profil v=3 (12 paliers) → upgrader vers v=4 (15 paliers)
    if (p.v === 3) {
      migrateXpV3ToV4(p);
      p.v = 4;
      lsSet(PROFILE_KEY, p);
      return p;
    }

    // Profil v=4 OK
    if (p.v === PROFILE_VERSION) {
      // v2.56 (FIX) : backfill silencieux des nouveaux champs xpBySource pour
      // les profils v=4 créés AVANT v2.56 (qui n'avaient que quiz + scene).
      // On ajoute quest/tp/fiches à 0 sans toucher aux totaux existants.
      let dirty = false;
      if (p.xpBySource) {
        if (p.xpBySource.quest === undefined)  { p.xpBySource.quest  = 0; dirty = true; }
        if (p.xpBySource.tp === undefined)     { p.xpBySource.tp     = 0; dirty = true; }
        if (p.xpBySource.fiches === undefined) { p.xpBySource.fiches = 0; dirty = true; }
      }
      if (dirty) lsSet(PROFILE_KEY, p);
      return p;
    }

    // Version inconnue plus récente → on ne touche pas
    return p;
  }

  /**
   * Migration v2 → v3 : conversion proportionnelle de l'XP pour préserver
   * EXACTEMENT le rang courant après changement de la courbe XP.
   *
   * Algorithme : on identifie le rang actuel et la progression au sein du
   * rang (0–1) avec les anciens seuils, puis on calcule la nouvelle XP qui
   * place le user au même rang avec la même progression sur la nouvelle
   * échelle. L'XP par source (quiz/scene) est recalibrée par ratio pour
   * préserver l'invariant `xp = xpQuiz + xpScene`.
   *
   * Exemples :
   *   - 28 000 XP (rang 10, 20% du palier) → 13 950 XP (rang 10, 20%)
   *   - 1 000 XP (rang 3, 0%) → 950 XP (rang 3, 0%)
   *   - 40 000 XP (rang max) → 17 950 XP (rang max)
   */
  function migrateXpV2ToV3(profile) {
    const xpOld = profile.xp || 0;
    if (xpOld <= 0) return; // 0 XP : rien à migrer

    // Identifier l'ancien rang + progress dans le rang
    let idx = 0;
    for (let i = XP_THRESHOLDS_V2.length - 1; i >= 0; i--) {
      if (xpOld >= XP_THRESHOLDS_V2[i]) { idx = i; break; }
    }
    const oldMin  = XP_THRESHOLDS_V2[idx];
    const oldNext = idx + 1 < XP_THRESHOLDS_V2.length ? XP_THRESHOLDS_V2[idx + 1] : oldMin;
    const oldRange = oldNext - oldMin;
    const progress = oldRange > 0 ? (xpOld - oldMin) / oldRange : 0;

    // Recalculer XP avec les seuils V3, même rang + même progression
    const newMin  = XP_THRESHOLDS_V3[idx];
    const newNext = idx + 1 < XP_THRESHOLDS_V3.length ? XP_THRESHOLDS_V3[idx + 1] : newMin;
    const newRange = newNext - newMin;
    const xpNew = Math.round(newMin + progress * newRange);

    // Appliquer le ratio aux compteurs xpBySource pour préserver
    // l'invariant : xp = xpBySource.quiz + xpBySource.scene
    const ratio = xpOld > 0 ? xpNew / xpOld : 1;
    if (profile.xpBySource) {
      profile.xpBySource.quiz  = Math.round((profile.xpBySource.quiz  || 0) * ratio);
      profile.xpBySource.scene = Math.round((profile.xpBySource.scene || 0) * ratio);
      // Correction d'arrondi : recaler la somme exacte sur quiz pour cohérence
      const sum = profile.xpBySource.quiz + profile.xpBySource.scene;
      if (sum !== xpNew) {
        profile.xpBySource.quiz += (xpNew - sum);
      }
    }
    profile.xp = xpNew;
  }

  /**
   * Migration v3 → v4 : passage de 12 à 15 paliers. Trois rangs ont été
   * insérés entre Hercule Poirot (idx 10 v3, conservé en idx 10 v4) et
   * Légende (idx 11 v3, devenue idx 14 v4). Pour les utilisateurs déjà
   * au rang 11 (Légende v3), on les place à idx 14 (Légende v4) : ils
   * ne sont JAMAIS rétrogradés. Pour les autres (idx 0..10), même rang
   * + même progression sur la nouvelle échelle.
   *
   * Cas particuliers :
   *   - 0 XP → 0 XP (rang 0)
   *   - 17 950 XP (cap v3, rang 11 Légende) → 32 650 XP (cap v4, rang 14)
   *   - 12 950 XP (rang 10 v3, début Poirot) → 12 250 XP (rang 10 v4, début Poirot)
   *   - 25 000 XP (au-delà du cap v3) → cappé à 32 650 (cap v4)
   */
  function migrateXpV3ToV4(profile) {
    const xpOld = profile.xp || 0;
    if (xpOld <= 0) return;

    // Identifier l'ancien rang v3 + progress dans le rang
    let idx = 0;
    for (let i = XP_THRESHOLDS_V3.length - 1; i >= 0; i--) {
      if (xpOld >= XP_THRESHOLDS_V3[i]) { idx = i; break; }
    }
    const oldMin  = XP_THRESHOLDS_V3[idx];
    const oldNext = idx + 1 < XP_THRESHOLDS_V3.length ? XP_THRESHOLDS_V3[idx + 1] : oldMin;
    const oldRange = oldNext - oldMin;
    const progress = oldRange > 0 ? (xpOld - oldMin) / oldRange : 0;

    // Mapping idx v3 → idx v4 :
    //   v3 rangs 0..10 (Stagiaire à Hercule Poirot) gardent leur idx
    //   v3 rang 11 (Légende) saute à v4 idx 14 (Légende préservée)
    //   Les rangs intermédiaires v4 [11..13] sont laissés vides à la migration
    //   (les utilisateurs y arriveront en gagnant de l'XP normalement).
    const newIdx = idx <= 10 ? idx : 14;

    const newMin  = XP_THRESHOLDS[newIdx];
    const newNext = newIdx + 1 < XP_THRESHOLDS.length ? XP_THRESHOLDS[newIdx + 1] : newMin;
    const newRange = newNext - newMin;
    // Si on est déjà au rang max, on cap à newMin (la barre est pleine)
    const xpNew = newRange > 0
      ? Math.round(newMin + progress * newRange)
      : newMin;

    // Appliquer le ratio aux compteurs xpBySource
    const ratio = xpOld > 0 ? xpNew / xpOld : 1;
    if (profile.xpBySource) {
      profile.xpBySource.quiz  = Math.round((profile.xpBySource.quiz  || 0) * ratio);
      profile.xpBySource.scene = Math.round((profile.xpBySource.scene || 0) * ratio);
      const sum = profile.xpBySource.quiz + profile.xpBySource.scene;
      if (sum !== xpNew) {
        profile.xpBySource.quiz += (xpNew - sum);
      }
    }
    profile.xp = xpNew;
  }

  /**
   * Migration silencieuse one-shot des clés legacy.
   * Appelée une fois lors de la création / upgrade du profil.
   */
  function migrateLegacyToProfile(profile) {
    if (profile.migrated) return;

    // 1. XP
    const xpQuiz = asInt(lsGet(LEGACY_KEYS.xpQuiz, 0), 0);
    const xpScene = asInt(lsGet(LEGACY_KEYS.xpScene, 0), 0);
    profile.xpBySource.quiz = xpQuiz;
    profile.xpBySource.scene = xpScene;
    profile.xp = xpQuiz + xpScene;

    // 2. Streak
    const legacyStreakQuiz = asInt(lsGet(LEGACY_KEYS.streakQuiz, 0), 0);
    const legacyStreakScene = lsGet(LEGACY_KEYS.streakScene, null);
    const sceneCount = (legacyStreakScene && typeof legacyStreakScene === 'object')
      ? asInt(legacyStreakScene.count, 0) : 0;
    profile.streak.current = Math.max(legacyStreakQuiz, sceneCount);
    profile.streak.max = profile.streak.current;
    if (legacyStreakScene && legacyStreakScene.lastDate) {
      profile.streak.lastDate = legacyStreakScene.lastDate;
    }

    // 3. Achievements legacy
    const legacyAch = lsGet(LEGACY_KEYS.achievements, []);
    if (Array.isArray(legacyAch)) profile.achievements = legacyAch.slice();

    // 4. Marqueur
    profile.migrated = true;

    // 5. Suppression des clés legacy XP/streak (les bridges écrivent désormais dans le store)
    //    On garde qs / fiches / examHist / scene_results / tp_solved car ce sont des
    //    données utiles aux features (historique, progression par module). On nettoie
    //    juste les compteurs en double.
    lsRemove(LEGACY_KEYS.xpQuiz);
    lsRemove(LEGACY_KEYS.xpScene);
    lsRemove(LEGACY_KEYS.streakQuiz);
    lsRemove(LEGACY_KEYS.streakScene);
    // Le pseudo et la viewMode restent en miroir pour compat avec landing-3d.js
  }

  function saveProfile(p) {
    lsSet(PROFILE_KEY, p);
  }

  // ───────────────────────────────────────────────────────────
  // Calcul du rang depuis l'XP totale et le track choisi
  // ───────────────────────────────────────────────────────────

  function getTrackKey() {
    const p = ensureProfile();
    return p.agent.track || 'investigator'; // défaut visuel : enquêteur
  }

  function getTrackData() {
    return TRACKS[getTrackKey()] || TRACKS.investigator;
  }

  function computeRank(xp, trackKey) {
    const track = TRACKS[trackKey] || TRACKS[getTrackKey()] || TRACKS.investigator;
    let idx = 0;
    for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= XP_THRESHOLDS[i]) { idx = i; break; }
    }
    const r = track.ranks[idx];
    const next = (idx + 1 < track.ranks.length) ? track.ranks[idx + 1] : null;
    const xpToNext = next ? Math.max(0, XP_THRESHOLDS[idx + 1] - xp) : 0;
    const xpInRank = xp - XP_THRESHOLDS[idx];
    const xpRange = next ? XP_THRESHOLDS[idx + 1] - XP_THRESHOLDS[idx] : 0;
    const pctToNext = xpRange > 0 ? Math.min(100, Math.round((xpInRank / xpRange) * 100)) : 100;
    return {
      idx,
      track: track.key,
      trackLabel: track.label,
      emoji: r.emoji,
      name: r.name,
      flavor: r.flavor,
      clearance: CLEARANCE_BY_RANK[idx],
      min: XP_THRESHOLDS[idx],
      next: next ? { emoji: next.emoji, name: next.name, min: XP_THRESHOLDS[idx + 1] } : null,
      xpToNext,
      pctToNext,
    };
  }

  // ───────────────────────────────────────────────────────────
  // Lecture des stats agrégées
  // ───────────────────────────────────────────────────────────

  function getXp() {
    return ensureProfile().xp;
  }

  function getXpBySource() {
    const p = ensureProfile();
    return {
      quiz: p.xpBySource.quiz || 0,
      scene: p.xpBySource.scene || 0,
      // v2.56 (FIX) : 3 nouvelles sources exposées
      quest: p.xpBySource.quest || 0,
      tp: p.xpBySource.tp || 0,
      fiches: p.xpBySource.fiches || 0,
      tp_solved_count: getTotalTpSolved(),
      fiches_read_count: getFichesReadCount(),
    };
  }

  function getTotalTpSolved() {
    const map = lsGet(LEGACY_KEYS.tpSolved, {}) || {};
    let n = 0;
    Object.values(map).forEach(v => { n += asInt(v, 0); });
    return n;
  }

  function getFichesReadCount() {
    const arr = lsGet(LEGACY_KEYS.fiches, []) || [];
    return Array.isArray(arr)
      ? new Set(arr.map(h => String(h).replace('.html', ''))).size
      : 0;
  }

  function getScenesBeatenCount() {
    const map = lsGet(LEGACY_KEYS.sceneResults, {}) || {};
    return Object.values(map).filter(v => v && (v.beaten || v.completed || v.win)).length;
  }

  function getQuestionsAnsweredCount() {
    const map = lsGet(LEGACY_KEYS.qsAnswered, {}) || {};
    return Object.keys(map).length;
  }

  function getExamsPassedCount() {
    const arr = lsGet(LEGACY_KEYS.examHist, []) || [];
    return Array.isArray(arr) ? arr.length : 0;
  }

  function getStats() {
    return {
      questions:    getQuestionsAnsweredCount(),
      fichesRead:   getFichesReadCount(),
      scenesBeaten: getScenesBeatenCount(),
      tpSolved:     getTotalTpSolved(),
      examsPassed:  getExamsPassedCount(),
    };
  }

  function getStreak() {
    const p = ensureProfile();
    return {
      current: p.streak.current || 0,
      max: p.streak.max || 0,
      lastDate: p.streak.lastDate || null,
    };
  }

  function snapshot() {
    const p = ensureProfile();
    const xp = p.xp;
    const trackKey = p.agent.track || 'investigator';
    return {
      version: p.v,
      agent: {
        name: getAgentName(),
        pseudo: p.agent.pseudo || '',
        track: p.agent.track,
        trackChosenAt: p.agent.trackChosenAt,
        hasTrack: !!p.agent.track,
      },
      xp,
      xpBySource: getXpBySource(),
      rank: computeRank(xp, trackKey),
      streak: getStreak(),
      stats: getStats(),
      achievements: (p.achievements || []).slice(),
      preferences: { ...p.preferences },
      createdAt: p.createdAt,
    };
  }

  // ───────────────────────────────────────────────────────────
  // Identité d'agent + track
  // ───────────────────────────────────────────────────────────

  function getAgentName() {
    const p = ensureProfile();
    const pseudo = (p.agent.pseudo || '').trim();
    return pseudo ? pseudo.toUpperCase() : 'AGENT';
  }

  function setAgentName(s) {
    if (typeof s !== 'string') return;
    const trimmed = s.trim().slice(0, 24);
    const p = ensureProfile();
    p.agent.pseudo = trimmed;
    saveProfile(p);
    lsSet(LEGACY_KEYS.agentPseudo, trimmed); // miroir compat
    emitChange('agent');
  }

  function getTrack() {
    return ensureProfile().agent.track;
  }

  function setTrack(trackKey) {
    if (!TRACKS[trackKey]) return;
    const p = ensureProfile();
    p.agent.track = trackKey;
    p.agent.trackChosenAt = Date.now();
    saveProfile(p);
    applyTrackToDocument(trackKey);
    emitChange('track');
  }

  /**
   * Pose l'attribut data-track sur <html> pour que le CSS [data-track="..."]
   * applique l'accent de couleur du rôle (LED, badges, bordures HUD…).
   * Appelé à l'init et après chaque setTrack.
   */
  function applyTrackToDocument(trackKey) {
    if (typeof document === 'undefined' || !document.documentElement) return;
    if (trackKey && TRACKS[trackKey]) {
      document.documentElement.setAttribute('data-track', trackKey);
    } else {
      document.documentElement.removeAttribute('data-track');
    }
  }

  function listTracks() {
    return Object.keys(TRACKS).map(k => ({
      key: k,
      label: TRACKS[k].label,
      icon: TRACKS[k].icon,
      ambiance: TRACKS[k].ambiance,
      ultimateRank: TRACKS[k].ranks[TRACKS[k].ranks.length - 1],
      ladder: TRACKS[k].ranks.map((r, i) => ({
        ...r,
        min: XP_THRESHOLDS[i],
        clearance: CLEARANCE_BY_RANK[i],
      })),
    }));
  }

  function getTrackLadder(trackKey) {
    const tk = trackKey || getTrackKey();
    const track = TRACKS[tk] || TRACKS.investigator;
    return track.ranks.map((r, i) => ({
      ...r,
      min: XP_THRESHOLDS[i],
      clearance: CLEARANCE_BY_RANK[i],
    }));
  }

  // ───────────────────────────────────────────────────────────
  // Préférences
  // ───────────────────────────────────────────────────────────

  function getViewMode() {
    return ensureProfile().preferences.viewMode || 'auto';
  }

  function setViewMode(mode) {
    if (!['auto', 'matrix', 'dfir'].includes(mode)) return;
    const p = ensureProfile();
    p.preferences.viewMode = mode;
    saveProfile(p);
    lsSet(LEGACY_KEYS.viewMode, mode); // miroir compat
    emitChange('preferences');
  }

  /**
   * Équipe un titre (ou null pour aucun titre). L'id n'est pas validé
   * ici — c'est à profile-titles.js de vérifier que l'id est bien
   * débloqué avant d'appeler. On accepte juste string|null.
   */
  function setEquippedTitle(id) {
    if (id !== null && typeof id !== 'string') return;
    const p = ensureProfile();
    if (!p.preferences) p.preferences = {};
    p.preferences.equippedTitle = id || null;
    saveProfile(p);
    emitChange('preferences');
  }

  // ───────────────────────────────────────────────────────────
  // API d'écriture XP / streak / achievements / activity
  // (utilisée par les bridges Quiz / Scène / TP)
  // ───────────────────────────────────────────────────────────

  /**
   * Ajoute de l'XP. La source ('quiz' | 'scene') sert à la ventilation.
   *
   * @param {number}  amount   - XP brute (avant bonus rôle)
   * @param {string}  source   - 'quiz' | 'scene'
   * @param {object}  [meta]   - { tags: string[] } pour le bonus thématique
   * @returns {object|null}    - { xp, gained, base, bonus, multiplier } ou null
   *                             - xp        : XP totale après ajout
   *                             - gained    : XP réellement créditée (base × multiplier)
   *                             - base      : XP brute fournie
   *                             - bonus     : XP supplémentaire due au bonus rôle
   *                             - multiplier: 1.0 ou 1.20 (si match thématique)
   */
  function addXp(amount, source, meta) {
    const base = asInt(amount, 0);
    if (base <= 0) return null;
    // v2.56 (FIX) : 'quest', 'tp', 'fiches' acceptés en plus de 'quiz' et 'scene'.
    // Avant cette version, addXp(N, 'quest') était silencieusement rejeté →
    // les XP des quêtes journalières (cas-in-quests.js v2.55) n'étaient
    // jamais créditées.
    if (!['quiz', 'scene', 'quest', 'tp', 'fiches'].includes(source)) return null;

    // Bonus thématique selon le rôle (track) choisi
    const tags = meta && Array.isArray(meta.tags) ? meta.tags : [];
    const multiplier = getRoleBonus(tags);
    const gained = Math.round(base * multiplier);
    const bonus = gained - base;

    const p = ensureProfile();
    const oldRank = computeRank(p.xp, p.agent.track || 'investigator').idx;

    p.xp = (p.xp || 0) + gained;
    p.xpBySource[source] = (p.xpBySource[source] || 0) + gained;
    p.activity[source] = Date.now();

    saveProfile(p);

    const newRank = computeRank(p.xp, p.agent.track || 'investigator').idx;
    if (newRank > oldRank) emitChange('rank-up');
    else emitChange('xp');

    return { xp: p.xp, gained, base, bonus, multiplier };
  }

  /**
   * Bumpe le streak. Si on bumpe un autre jour, +1. Sinon idem.
   * Retourne le nouveau streak.
   */
  function bumpStreak() {
    const p = ensureProfile();
    const today = todayISO();
    const last = p.streak.lastDate;

    if (last === today) {
      // Déjà bumpé aujourd'hui, on ne change rien
      return p.streak.current;
    }
    if (last) {
      // Vérifier si c'était hier (continue la série) ou plus loin (reset à 1)
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      if (last === yesterday) {
        p.streak.current = (p.streak.current || 0) + 1;
      } else {
        p.streak.current = 1;
      }
    } else {
      p.streak.current = 1;
    }
    p.streak.lastDate = today;
    if (p.streak.current > (p.streak.max || 0)) {
      p.streak.max = p.streak.current;
    }
    saveProfile(p);
    emitChange('streak');
    return p.streak.current;
  }

  function breakStreak() {
    const p = ensureProfile();
    if ((p.streak.current || 0) === 0) return 0;
    p.streak.current = 0;
    saveProfile(p);
    emitChange('streak');
    return 0;
  }

  function unlockAchievement(id) {
    if (typeof id !== 'string' || !id.trim()) return false;
    const p = ensureProfile();
    if (!Array.isArray(p.achievements)) p.achievements = [];
    if (p.achievements.includes(id)) return false;
    p.achievements.push(id);
    saveProfile(p);
    // Synchronise aussi la clé legacy 'achievements' pour que quiz-app.js
    // continue de lire ses popups de succès
    lsSet(LEGACY_KEYS.achievements, p.achievements);
    emitChange('achievement');
    return true;
  }

  function recordActivity(source) {
    if (!['quiz', 'scene', 'tp', 'fiches'].includes(source)) return;
    const p = ensureProfile();
    p.activity[source] = Date.now();
    saveProfile(p);
    // Pas d'emit : pure trace
  }

  function getLastActivity(source) {
    return ensureProfile().activity[source] || null;
  }

  // ───────────────────────────────────────────────────────────
  // Reset complet
  // ───────────────────────────────────────────────────────────

  function reset() {
    const allKeys = [
      PROFILE_KEY,
      LEGACY_KEYS.xpQuiz, LEGACY_KEYS.xpScene,
      LEGACY_KEYS.streakQuiz, LEGACY_KEYS.streakScene,
      LEGACY_KEYS.qsAnswered, LEGACY_KEYS.fiches, LEGACY_KEYS.examHist,
      LEGACY_KEYS.sceneResults, LEGACY_KEYS.tpSolved,
      LEGACY_KEYS.achievements, LEGACY_KEYS.agentPseudo,
      LEGACY_KEYS.viewMode, LEGACY_KEYS.landingViews,
      'tp_streak', 'tp_bestStreak', 'casIn_landingLastVisit',
      'maxCombo', 'freezes', 'hintsLeft', 'hintsUsed', 'hintDate',
      'achievements', 'sessions', 'sessionSnap', 'playdates',
      'lastPlayDate', 'comeback', 'forensicShown', 'nightOwl',
      'perfectExam', 'perfectExam20', 'secretFlags', 'smartCount',
      'survivalBest', 'weeklyLB', 'bossBeaten', 'missionBeaten',
      'scenesBeaten', 'sm2q', 'casIn_lastSection', 'casIn_lastQuizVisit',
    ];
    allKeys.forEach(lsRemove);
    ensureProfile();
    emitChange('reset');
  }

  // ───────────────────────────────────────────────────────────
  // Système d'événements
  // ───────────────────────────────────────────────────────────

  const _listeners = new Set();

  function emitChange(reason) {
    try {
      window.dispatchEvent(new CustomEvent('profile-changed', { detail: { reason } }));
    } catch (_) {}
    _listeners.forEach(fn => {
      try { fn(reason); } catch (_) {}
    });
  }

  function onChange(fn) {
    if (typeof fn !== 'function') return () => {};
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }

  // Cross-tab via storage event
  window.addEventListener('storage', e => {
    if (!e.key) return;
    if (e.key === PROFILE_KEY || Object.values(LEGACY_KEYS).includes(e.key)) {
      emitChange('storage');
    }
  });

  // ───────────────────────────────────────────────────────────
  // Init + API publique
  // ───────────────────────────────────────────────────────────

  ensureProfile();

  // ───────────────────────────────────────────────────────────
  // (Système ROLE_BONUS + computeBonusedXp retiré en v2.10+ — il n'a
  // jamais été branché. Le système actif est ROLE_BONUS_TAGS +
  // getRoleBonus() défini en haut de fichier, appelé depuis addXp()
  // via le paramètre meta.tags.)
  // ───────────────────────────────────────────────────────────
  // Couleur d'accent par track (stratégie de différenciation visuelle).
  // Utilisé via document.body.dataset.track + variables CSS.
  // ───────────────────────────────────────────────────────────

  const TRACK_ACCENTS = {
    investigator: { hex: '#f0c040', label: 'Doré',     hue: 'gold'   }, // badge police, dossier classifié
    magistrate:   { hex: '#5b8def', label: 'Bleu',     hue: 'blue'   }, // robe, prétoire, autorité
    journalist:   { hex: '#c466e8', label: 'Violet',   hue: 'purple' }, // presse, encre, écriture
    hacker:       { hex: '#00ff41', label: 'Vert phosphore', hue: 'green' }  // terminal classique
  };

  function getTrackAccent(trackKey) {
    return TRACK_ACCENTS[trackKey || getTrackKey()] || TRACK_ACCENTS.investigator;
  }

  // Au chargement, applique data-track sur <body> pour activer le thème CSS
  // correspondant au track choisi par l'utilisateur. Retire l'attribut si le
  // rôle est absent ou inconnu (retombée sur les valeurs par défaut du :root).
  function applyTrackToBody() {
    if (typeof document === 'undefined' || !document.body) return;
    const tk = getTrackKey();
    const validTracks = ['investigator', 'magistrate', 'journalist', 'hacker'];
    if (tk && validTracks.includes(tk)) {
      document.body.dataset.track = tk;
    } else {
      document.body.removeAttribute('data-track');
    }
  }
  // Application initiale + mise à jour à chaque changement de profil
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyTrackToBody);
    } else {
      applyTrackToBody();
    }
    window.addEventListener('profile-changed', applyTrackToBody);
  }

  window.Profile = Object.freeze({
    // Lecture
    snapshot,
    getXp,
    getXpBySource,
    getRank: () => {
      const p = ensureProfile();
      return computeRank(p.xp, p.agent.track || 'investigator');
    },
    getStreak,
    getStats,
    getAgentName,
    getTrack,
    getTrackData: () => ({ ...getTrackData(), ranks: getTrackData().ranks.slice() }),
    listTracks,
    getTrackLadder,
    getViewMode,
    getLastActivity,
    /**
     * v2.61 — Retourne la liste COMPLÈTE des rangs du track passé en
     * argument (ou du track actif), avec leur seuil XP. Utile pour les
     * modules satellites qui veulent reconstituer une échelle de progression
     * (ex : quiz-ranks.js qui aligne les rangs du quiz sur ceux du profil).
     *
     * Format : [{ name, emoji, flavor, min, idx }, ...]
     */
    getAllRanks: (trackKey) => {
      const key = trackKey || ensureProfile().agent.track || 'investigator';
      const track = TRACKS[key] || TRACKS.investigator;
      return track.ranks.map((r, i) => ({
        name: r.name,
        emoji: r.emoji,
        flavor: r.flavor,
        min: XP_THRESHOLDS[i] || 0,
        idx: i,
      }));
    },
    /**
     * Retourne la liste des tags qui déclenchent +20% de bonus XP pour le rôle
     * passé en argument (ou le rôle actif si aucun argument). Utile pour
     * afficher dans le profil ou dans le sélecteur de track « ce que ton
     * rôle te rapporte ».
     */
    getRoleBonusTags: (roleKey) => {
      const r = roleKey || (ensureProfile().agent && ensureProfile().agent.track);
      const tags = ROLE_BONUS_TAGS[r];
      return Array.isArray(tags) ? tags.slice() : [];
    },

    // Écriture
    setAgentName,
    setTrack,
    setViewMode,
    setEquippedTitle,
    addXp,
    bumpStreak,
    breakStreak,
    unlockAchievement,
    recordActivity,

    // Cycle de vie
    onChange,
    reset,

    // Constantes
    XP_THRESHOLDS: Object.freeze(XP_THRESHOLDS.slice()),
    CLEARANCE_BY_RANK: Object.freeze(CLEARANCE_BY_RANK.slice()),
  });

  // Appliquer le data-track au chargement du module (toutes les pages qui
  // chargent cas-in-profile.js bénéficient de l'accent couleur du rôle).
  // Si <html> n'est pas encore prêt (cas IIFE chargé avant <body>), on
  // déclenche après DOMContentLoaded.
  try {
    const p = ensureProfile();
    const trackKey = p && p.agent && p.agent.track;
    if (typeof document !== 'undefined' && document.documentElement) {
      applyTrackToDocument(trackKey);
    }
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('DOMContentLoaded', () => applyTrackToDocument(trackKey), { once: true });
    }
  } catch (e) { /* silencieux : ne pas bloquer le chargement */ }

})();
