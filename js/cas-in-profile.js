/* ============================================================
   CAS-IN · cas-in-profile.js
   Module Profile : source unique pour rang, XP, streak, badges,
   identité d'agent. Inclut migration depuis les clés legacy.

   API publique (window.Profile.*) :
   - Profile.snapshot()         → objet figé : { rank, xp, xpBySource, streak, ... }
   - Profile.getXp()            → XP totale (somme quiz + scène)
   - Profile.getXpBySource()    → { quiz, scene, tp_solved, fiches_read }
   - Profile.getRank()          → { idx, emoji, name, clearance, min, next, pctToNext }
   - Profile.getStreak()        → { current, max, lastDate }
   - Profile.getStats()         → { questions, fichesRead, scenesBeaten, tpSolved, examsPassed }
   - Profile.getAgentName()     → string (pseudo en majuscules ou "AGENT")
   - Profile.setAgentName(s)    → ''
   - Profile.getViewMode()      → 'auto' | 'matrix' | 'dfir'
   - Profile.setViewMode(v)     → ''
   - Profile.onChange(fn)       → unsubscribe()    [event 'profile-changed']
   - Profile.reset()            → wipe complet (utilisé par drReset)

   Le module ne MODIFIE PAS les écritures du quiz / scène / tp pour l'instant —
   c'est le job du Groupe F2. Ici, on ne fait que LIRE et AGRÉGER.
   ============================================================ */

(function () {
  'use strict';

  // ───────────────────────────────────────────────────────────
  // Constantes
  // ───────────────────────────────────────────────────────────

  const PROFILE_KEY = 'casIn_profile';
  const PROFILE_VERSION = 1;

  // Rang : seuils alignés avec le drawer landing v2.6 (RANKS [xp, emoji, name])
  // Clearance : niveau d'autorisation dérivé du rang (1 à 5 max)
  const RANKS = [
    { min:     0, emoji: '🔰', name: 'Stagiaire',            clearance: 1, flavor: 'Premier jour. Le café est dans la salle de pause.' },
    { min:   500, emoji: '🕵', name: 'Enquêteur',            clearance: 2, flavor: 'Tu sais déjà ouvrir un rapport sans paniquer.' },
    { min:  1500, emoji: '🔬', name: 'Analyste',             clearance: 3, flavor: "L'instinct s'éveille." },
    { min:  3000, emoji: '💼', name: 'Expert',               clearance: 4, flavor: 'On commence à te demander ton avis.' },
    { min:  6000, emoji: '⚖️', name: 'Légiste',              clearance: 5, flavor: "Le tribunal écoute quand tu parles." },
    { min: 10000, emoji: '🏛', name: 'Inspecteur Principal', clearance: 5, flavor: "Tu signes les conclusions sans trembler." },
  ];

  // Clés legacy à lire pour l'agrégation (en attendant la migration F2)
  const LEGACY_KEYS = {
    xpQuiz:       'xp',                  // entier
    xpScene:      'cas_xp',              // entier
    streakQuiz:   'dayStreak',           // entier
    streakScene:  'cas_streak',          // {count, lastDate}
    qsAnswered:   'qs',                  // map
    fiches:       'casIn_readFiches_v4', // array
    examHist:     'examHist',            // array
    sceneResults: 'scene_results',       // map
    tpSolved:     'tp_solved',           // map
    achievements: 'achievements',        // array
    agentPseudo:  'casIn_agentPseudo',   // string (déjà préparé en E)
    viewMode:     'casIn_viewMode',      // 'auto' | 'matrix' | 'dfir'
    landingViews: 'casIn_landingViews',  // entier
  };

  // ───────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────

  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      // Tente JSON, sinon retourne brut (string)
      try { return JSON.parse(raw); }
      catch { return raw; }
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

  // ───────────────────────────────────────────────────────────
  // Migration silencieuse vers casIn_profile (one-shot)
  // ───────────────────────────────────────────────────────────

  function buildInitialProfile() {
    return {
      v: PROFILE_VERSION,
      createdAt: Date.now(),
      agent: {
        pseudo: lsGet(LEGACY_KEYS.agentPseudo, '') || '',
      },
      streak: {
        current: 0,
        max: 0,
        lastDate: null,
      },
      milestones: {
        // pour F2 : { firstQuiz, firstScene, ... } horodatages
      },
      preferences: {
        viewMode: lsGet(LEGACY_KEYS.viewMode, 'auto') || 'auto',
      },
    };
  }

  /**
   * Garantit qu'un profil existe en localStorage. Retourne l'objet hydraté.
   * Migration silencieuse au premier appel : on ne supprime PAS les anciennes
   * clés (le quiz et la scène en ont besoin tant que F2 n'est pas livré).
   * On copie juste pseudo, viewMode et streak.max qu'on ne pourra plus
   * recalculer plus tard.
   */
  function ensureProfile() {
    let p = lsGet(PROFILE_KEY, null);
    if (p && typeof p === 'object' && p.v === PROFILE_VERSION) return p;

    p = buildInitialProfile();

    // Recopier les valeurs legacy qui ont du sens d'être consolidées
    const legacyStreakQuiz = asInt(lsGet(LEGACY_KEYS.streakQuiz, 0), 0);
    const legacyStreakScene = lsGet(LEGACY_KEYS.streakScene, null);
    const legacyStreakSceneCount = (legacyStreakScene && typeof legacyStreakScene === 'object')
      ? asInt(legacyStreakScene.count, 0) : 0;
    p.streak.current = Math.max(legacyStreakQuiz, legacyStreakSceneCount);
    p.streak.max = p.streak.current;
    if (legacyStreakScene && legacyStreakScene.lastDate) {
      p.streak.lastDate = legacyStreakScene.lastDate;
    }

    lsSet(PROFILE_KEY, p);
    return p;
  }

  // ───────────────────────────────────────────────────────────
  // Calcul du rang depuis l'XP totale
  // ───────────────────────────────────────────────────────────

  function computeRank(xp) {
    let idx = 0;
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (xp >= RANKS[i].min) { idx = i; break; }
    }
    const rank = RANKS[idx];
    const next = RANKS[idx + 1] || null;
    const xpInRank = xp - rank.min;
    const xpToNext = next ? next.min - rank.min : 0;
    const pctToNext = next && xpToNext > 0
      ? Math.min(100, Math.round((xpInRank / xpToNext) * 100))
      : 100;
    return {
      idx,
      emoji: rank.emoji,
      name: rank.name,
      clearance: rank.clearance,
      flavor: rank.flavor,
      min: rank.min,
      next: next ? { emoji: next.emoji, name: next.name, min: next.min } : null,
      xpToNext: next ? Math.max(0, next.min - xp) : 0,
      pctToNext,
    };
  }

  // ───────────────────────────────────────────────────────────
  // Snapshot global : agrège les sources actuelles à la volée
  // ───────────────────────────────────────────────────────────

  function getXpBySource() {
    const xpQuiz = asInt(lsGet(LEGACY_KEYS.xpQuiz, 0), 0);
    const xpScene = asInt(lsGet(LEGACY_KEYS.xpScene, 0), 0);
    return {
      quiz: xpQuiz,
      scene: xpScene,
      // TP ne donne pas d'XP pour l'instant (choix utilisateur F1).
      // On expose juste son compteur ici à titre indicatif.
      tp_solved_count: getTotalTpSolved(),
      fiches_read_count: getFichesReadCount(),
    };
  }

  function getTotalXp() {
    const src = getXpBySource();
    return src.quiz + src.scene;
  }

  function getTotalTpSolved() {
    const map = lsGet(LEGACY_KEYS.tpSolved, {}) || {};
    let n = 0;
    Object.values(map).forEach(v => { n += asInt(v, 0); });
    return n;
  }

  function getFichesReadCount() {
    const arr = lsGet(LEGACY_KEYS.fiches, []) || [];
    return Array.isArray(arr) ? new Set(arr.map(h => String(h).replace('.html', ''))).size : 0;
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
    // Tant que F2 n'a pas migré, on lit aussi les sources actuelles
    // pour garder le streak à jour.
    const legacyQuiz = asInt(lsGet(LEGACY_KEYS.streakQuiz, 0), 0);
    const legacyScene = lsGet(LEGACY_KEYS.streakScene, null);
    const sceneCount = (legacyScene && typeof legacyScene === 'object')
      ? asInt(legacyScene.count, 0) : 0;
    const current = Math.max(p.streak.current || 0, legacyQuiz, sceneCount);
    const max = Math.max(p.streak.max || 0, current);
    const lastDate = (legacyScene && legacyScene.lastDate) || p.streak.lastDate || null;
    return { current, max, lastDate };
  }

  function snapshot() {
    const p = ensureProfile();
    const xp = getTotalXp();
    return {
      version: p.v,
      agent: {
        name: getAgentName(),
        pseudo: p.agent.pseudo || '',
      },
      xp,
      xpBySource: getXpBySource(),
      rank: computeRank(xp),
      streak: getStreak(),
      stats: getStats(),
      preferences: { ...p.preferences },
      createdAt: p.createdAt,
    };
  }

  // ───────────────────────────────────────────────────────────
  // Identité d'agent
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
    lsSet(PROFILE_KEY, p);
    // Conserver aussi en clé legacy pour compat avec landing-3d.js E
    lsSet(LEGACY_KEYS.agentPseudo, trimmed);
    emitChange('agent');
  }

  // ───────────────────────────────────────────────────────────
  // Préférences
  // ───────────────────────────────────────────────────────────

  function getViewMode() {
    const p = ensureProfile();
    return p.preferences.viewMode || 'auto';
  }

  function setViewMode(mode) {
    if (!['auto', 'matrix', 'dfir'].includes(mode)) return;
    const p = ensureProfile();
    p.preferences.viewMode = mode;
    lsSet(PROFILE_KEY, p);
    // Conserver aussi en clé legacy pour compat
    lsSet(LEGACY_KEYS.viewMode, mode);
    emitChange('preferences');
  }

  // ───────────────────────────────────────────────────────────
  // Reset complet
  // ───────────────────────────────────────────────────────────

  function reset() {
    const allKeys = [
      PROFILE_KEY,
      // Legacy
      LEGACY_KEYS.xpQuiz, LEGACY_KEYS.xpScene,
      LEGACY_KEYS.streakQuiz, LEGACY_KEYS.streakScene,
      LEGACY_KEYS.qsAnswered, LEGACY_KEYS.fiches, LEGACY_KEYS.examHist,
      LEGACY_KEYS.sceneResults, LEGACY_KEYS.tpSolved,
      LEGACY_KEYS.achievements, LEGACY_KEYS.agentPseudo,
      LEGACY_KEYS.viewMode, LEGACY_KEYS.landingViews,
      // Autres clés gamification fréquentes
      'tp_streak', 'tp_bestStreak', 'casIn_landingLastVisit',
      'maxCombo', 'freezes', 'hintsLeft', 'hintsUsed', 'hintDate',
      'achievements', 'sessions', 'sessionSnap', 'playdates',
      'lastPlayDate', 'comeback', 'forensicShown', 'nightOwl',
      'perfectExam', 'perfectExam20', 'secretFlags', 'smartCount',
      'survivalBest', 'weeklyLB', 'bossBeaten', 'missionBeaten',
      'scenesBeaten', 'sm2q', 'casIn_lastSection', 'casIn_lastQuizVisit',
    ];
    allKeys.forEach(lsRemove);
    // Recrée un profil vierge
    ensureProfile();
    emitChange('reset');
  }

  // ───────────────────────────────────────────────────────────
  // Système d'événements (réactivité légère)
  // ───────────────────────────────────────────────────────────

  const _listeners = new Set();

  function emitChange(reason) {
    // Custom event sur window pour qu'on puisse aussi écouter en HTML inline
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

  // Écoute aussi les autres onglets (cross-tab via storage event)
  window.addEventListener('storage', e => {
    if (!e.key) return;
    if (e.key === PROFILE_KEY || Object.values(LEGACY_KEYS).includes(e.key)) {
      emitChange('storage');
    }
  });

  // ───────────────────────────────────────────────────────────
  // API publique
  // ───────────────────────────────────────────────────────────

  // Init au chargement
  ensureProfile();

  window.Profile = Object.freeze({
    snapshot,
    getXp:           getTotalXp,
    getXpBySource,
    getRank:         () => computeRank(getTotalXp()),
    getStreak,
    getStats,
    getAgentName,
    setAgentName,
    getViewMode,
    setViewMode,
    onChange,
    reset,
    // Constantes utiles pour les pages qui veulent rendre le ladder
    RANKS:           Object.freeze(RANKS.map(r => Object.freeze({ ...r }))),
  });

})();
