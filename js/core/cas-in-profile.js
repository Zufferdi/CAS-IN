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
  const PROFILE_VERSION = 2;

  // ───────────────────────────────────────────────────────────
  // Échelles XP : mêmes seuils pour les 4 tracks (XP universelle)
  // ───────────────────────────────────────────────────────────

  const XP_THRESHOLDS = [0, 250, 500, 1000, 1800, 2800, 4200, 6500, 10000, 15000, 25000, 40000];
  const CLEARANCE_BY_RANK = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5];

  // ───────────────────────────────────────────────────────────
  // 4 tracks · 12 grades chacun · personnages uniques
  // ───────────────────────────────────────────────────────────

  const TRACKS = {
    investigator: {
      key: 'investigator',
      label: 'Enquêteur',
      icon: '🕵',
      ambiance: 'Terrain · preuves · profilage',
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
        { emoji: '👑',   name: 'Légende DFIR',             flavor: 'Ton expertise fait jurisprudence.' },
      ],
    },
    magistrate: {
      key: 'magistrate',
      label: 'Magistrat',
      icon: '⚖️',
      ambiance: 'Décision · instruction · prétoire',
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
        { emoji: '👑',   name: 'Magistrat suprême',          flavor: 'Au-dessus, il n\'y a plus que la loi elle-même.' },
      ],
    },
    journalist: {
      key: 'journalist',
      label: 'Journaliste',
      icon: '📰',
      ambiance: 'Investigation · sources · révélation',
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
        { emoji: '👑',   name: 'Légende du dark net',        flavor: 'Tu es au-delà du réseau. Tu ES le réseau.' },
      ],
    },
  };

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
      xpBySource: { quiz: 0, scene: 0 },
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

    // Pas de profil → créer + migration legacy une seule fois
    if (!p || typeof p !== 'object') {
      p = buildInitialProfile();
      migrateLegacyToProfile(p);
      lsSet(PROFILE_KEY, p);
      return p;
    }

    // Profil v=1 (F1) → upgrader vers v=2 sans perte
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
      lsSet(PROFILE_KEY, fresh);
      return fresh;
    }

    // Profil v=2 OK
    if (p.v === PROFILE_VERSION) return p;

    // Version inconnue plus récente → on ne touche pas
    return p;
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
    emitChange('track');
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

  // ───────────────────────────────────────────────────────────
  // API d'écriture XP / streak / achievements / activity
  // (utilisée par les bridges Quiz / Scène / TP)
  // ───────────────────────────────────────────────────────────

  /**
   * Ajoute de l'XP. La source ('quiz' | 'scene') sert à la ventilation.
   * Retourne le nouveau total, ou null si paramètres invalides.
   */
  function addXp(amount, source) {
    const n = asInt(amount, 0);
    if (n <= 0) return null;
    if (!['quiz', 'scene'].includes(source)) return null;

    const p = ensureProfile();
    const oldRank = computeRank(p.xp, p.agent.track || 'investigator').idx;

    p.xp = (p.xp || 0) + n;
    p.xpBySource[source] = (p.xpBySource[source] || 0) + n;
    p.activity[source] = Date.now();

    saveProfile(p);

    const newRank = computeRank(p.xp, p.agent.track || 'investigator').idx;
    if (newRank > oldRank) emitChange('rank-up');
    else emitChange('xp');

    return p.xp;
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

    // Écriture
    setAgentName,
    setTrack,
    setViewMode,
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

})();
