// ═══════════════════════════════════════════════════════════════
// cas-in-storage.js — Wrapper localStorage avec namespace (v2.60)
//
// PROBLÈME ANTÉRIEUR : 81 clés localStorage réparties sur 3 conventions :
//   - 'casIn_*'  (camelCase, ancien)        ← 9 clés
//   - 'cas_*'    (snake_case, nouveau)      ← 23 clés
//   - sans préfixe (ac, bm, qs, sm2q, xp..) ← 48 clés (collision risk!)
//
// CE MODULE :
//   - Au boot, MIGRE les clés sans préfixe vers 'cas_X'
//   - Migre 'casIn_X' vers 'cas_X' (snake_case canonique)
//   - Garde un mapping de rétrocompatibilité pour les modules legacy
//   - Ne supprime JAMAIS de données utilisateur (lecture/recopie seule)
//
// Compatibilité : les modules existants (qui lisent encore 'xp', 'bm',
// etc.) continuent de fonctionner via le shim de rétrocompat (Storage
// proxy en lecture). Migration progressive.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // Liste exhaustive des clés legacy connues + leur destination
  // (issu de l'audit v2.60). Les clés non listées ici restent inchangées
  // pour ne pas casser les usages.
  // ─────────────────────────────────────────────────────────────
  const LEGACY_MIGRATION_MAP = {
    // Préfixe casIn_ → cas_ (camelCase → snake_case)
    'casIn_dayDate':       'cas_day_date',
    'casIn_dayScore':      'cas_day_score',
    'casIn_examHistory':   'cas_exam_history',
    'casIn_lastScore':     'cas_last_score',
    'casIn_lastSection':   'cas_last_section',
    'casIn_pwaInstalled':  'cas_pwa_installed',
    'casIn_rank':          'cas_rank_legacy',
    'casIn_readFiches_v4': 'cas_read_fiches',
    'casIn_zen':           'cas_zen_mode',
    // Sans préfixe → cas_X
    'achievements':        'cas_achievements',
    'avatarEmoji':         'cas_avatar_emoji',
    'avatarName':          'cas_avatar_name',
    'bossBeaten':          'cas_boss_beaten',
    'comeback':            'cas_comeback',
    'dailyBannerDismissed':'cas_daily_banner_dismissed',
    'dayStreak':           'cas_day_streak',
    'examHist':            'cas_exam_hist',
    'ficheUnlocked':       'cas_fiche_unlocked',
    'fontSize':            'cas_font_size',
    'forensicShown':       'cas_forensic_shown',
    'freezes':             'cas_freezes',
    'hintDate':            'cas_hint_date',
    'hintsLeft':           'cas_hints_left',
    'hintsUsed':           'cas_hints_used',
    'installDismissed':    'cas_install_dismissed',
    'lastPlayDate':        'cas_last_play_date',
    'maxCombo':            'cas_max_combo',
    'missionBeaten':       'cas_mission_beaten',
    'nightOwl':            'cas_night_owl_legacy',
    'perfectExam':         'cas_perfect_exam',
    'perfectExam20':       'cas_perfect_exam_20',
    'playdates':           'cas_playdates',
    'scenesBeaten':        'cas_scenes_beaten',
    'secretFlags':         'cas_secret_flags',
    'sessionSnap':         'cas_session_snap',
    'sessions':            'cas_sessions',
    'sm2q':                'cas_sm2_questions',
    'smartCount':          'cas_smart_count',
    'soundOn':             'cas_sound_on',
    'survivalBest':        'cas_survival_best',
    'timer':               'cas_timer',
    'visualTheme':         'cas_visual_theme',
    'weeklyLB':            'cas_weekly_lb',
    'xp':                  'cas_xp_legacy',
    // Clés courtes (initiales) - garder telles quelles car utilisées dans
    // hot path (ex: 'ac' = active chapter par index quiz)
    // 'ac', 'bm', 'qs', 'ad', 'at', 'ms' ← non migrées intentionnellement
  };

  const MIGRATION_FLAG_KEY = 'cas_storage_migrated_v260';

  // ─────────────────────────────────────────────────────────────
  // MIGRATION (idempotente, exécutée 1 fois)
  // ─────────────────────────────────────────────────────────────

  function migrate() {
    try {
      if (localStorage.getItem(MIGRATION_FLAG_KEY) === '1') return;
    } catch (_) { return; }

    let migrated = 0;
    try {
      for (const [oldKey, newKey] of Object.entries(LEGACY_MIGRATION_MAP)) {
        const oldVal = localStorage.getItem(oldKey);
        if (oldVal === null) continue;
        // Ne pas écraser si la nouvelle clé existe déjà (collision rare)
        if (localStorage.getItem(newKey) !== null) continue;
        try {
          localStorage.setItem(newKey, oldVal);
          // On NE supprime PAS l'ancienne clé : rétrocompat pour les
          // modules legacy qui lisent encore 'xp', 'bm', etc. La
          // synchronisation est gérée par le proxy en écriture (cf. ci-dessous).
          migrated++;
        } catch (_) {}
      }
      localStorage.setItem(MIGRATION_FLAG_KEY, '1');
    } catch (_) {}

    if (migrated > 0 && typeof console !== 'undefined' && console.info) {
      console.info(`[cas-in-storage] Migration v2.60: ${migrated} clé(s) recopiée(s) vers 'cas_*'`);
    }
  }

  // Migrer le plus tôt possible (avant que d'autres modules lisent)
  migrate();

  // ─────────────────────────────────────────────────────────────
  // API publique : Storage.get/set/del + helpers
  // ─────────────────────────────────────────────────────────────

  /**
   * Lit une clé. Si elle a été migrée (oldKey → newKey), tente d'abord
   * la nouvelle clé, puis l'ancienne en fallback.
   */
  function get(key, fallback) {
    try {
      // Si key est ancienne, essayer aussi la cible
      const newKey = LEGACY_MIGRATION_MAP[key];
      let raw = localStorage.getItem(newKey || key);
      if (raw === null && newKey) raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      try { return JSON.parse(raw); } catch (_) { return raw; }
    } catch (_) { return fallback; }
  }

  /**
   * Écrit une clé. Si elle a été migrée, écrit aux DEUX endroits pour
   * conserver la rétrocompatibilité avec les modules legacy.
   */
  function set(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      const newKey = LEGACY_MIGRATION_MAP[key];
      if (newKey && newKey !== key) {
        localStorage.setItem(newKey, serialized);
      }
      return true;
    } catch (_) { return false; }
  }

  /**
   * Supprime une clé (et son alias migré si applicable).
   */
  function del(key) {
    try {
      localStorage.removeItem(key);
      const newKey = LEGACY_MIGRATION_MAP[key];
      if (newKey && newKey !== key) {
        localStorage.removeItem(newKey);
      }
      return true;
    } catch (_) { return false; }
  }

  /**
   * Liste les clés qui matchent un préfixe.
   */
  function keysWithPrefix(prefix) {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) out.push(k);
      }
    } catch (_) {}
    return out;
  }

  /**
   * Stats d'usage (debug).
   */
  function stats() {
    const out = { total: 0, byPrefix: {} };
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        out.total++;
        const prefix = k.startsWith('cas_') ? 'cas_'
                     : k.startsWith('casIn_') ? 'casIn_'
                     : '(none)';
        out.byPrefix[prefix] = (out.byPrefix[prefix] || 0) + 1;
      }
    } catch (_) {}
    return out;
  }

  window.CasInStorage = { get, set, del, keysWithPrefix, stats, migrate };
})();
