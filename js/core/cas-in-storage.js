/**
 * cas-in-storage.js — CAS-IN
 *
 * Module de robustesse pour localStorage :
 *   1. Validation au boot des clés critiques (détection JSON corrompu)
 *   2. Backup automatique avant purge d'une clé corrompue
 *   3. Versioning du schema (infrastructure pour migrations futures)
 *   4. API publique en complément de CasInUtils.lsGet/lsSet/lsDel
 *
 * Chargement : à inclure tôt dans la page (juste après cas-in-utils.js, AVANT
 * tout autre script qui pourrait lire localStorage). L'auto-boot est appelé
 * à DOMContentLoaded.
 *
 * Pour utiliser dans du nouveau code :
 *   CasInStorage.get('cle', defaultValue)   // safe wrapper, log si malformé
 *   CasInStorage.set('cle', value)          // safe wrapper, log si quota dépassé
 *   CasInStorage.del('cle')                 // wrapper de removeItem
 *
 * Le code existant qui utilise lsGet/lsSet/lsDel (CasInUtils) continue de
 * fonctionner identiquement — pas de breaking change. Ce module se contente
 * d'ajouter la couche de validation au boot.
 *
 * v132n — 2026-05-30
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // Version du schema localStorage
  // ─────────────────────────────────────────────────────────────
  // Bump cette constante quand la structure d'une clé connue change de
  // façon non rétro-compatible. Ajouter alors une fonction de migration
  // dans le tableau MIGRATIONS ci-dessous.
  //
  // Version 1 (v132n) — état initial, équivalent à tout ce qui existe
  //                     post-v3.0-jolification. Aucune migration nécessaire.
  const SCHEMA_VERSION = 1;
  const SCHEMA_VERSION_KEY = 'casIn_schema_version';

  // ─────────────────────────────────────────────────────────────
  // Clés critiques qui doivent être JSON-parseable
  // ─────────────────────────────────────────────────────────────
  // Si l'une de ces clés contient du JSON malformé, le module la backup
  // sous `casIn_corrupt_backup_<clé>` puis la supprime (les apps consommatrices
  // utilisent toutes des fallbacks safe).
  //
  // Note : on ne liste QUE les clés dont une corruption casserait une feature.
  // Les clés scalaires (xp = "123", hintDate = "2026-05-30") survivent à
  // n'importe quelle valeur, pas besoin de validation.
  const CRITICAL_JSON_KEYS = [
    'casIn_profile_v4',           // profil complet (achievements, stats, etc.)
    'scene_results',              // résultats par scène {sceneId: {pct, ...}}
    'qs',                         // S.qstats — {questionIdx: {ok, tot}}
    'tp_solved',                  // {categoryKey: count}
    'tools_used',                 // {toolKey: count}
    'byTheme',                    // stats par thème pour quiz
    'byChapter',                  // stats par chapitre pour quiz
    'achievements',               // liste des achievements unlocked (legacy)
    'casIn_readFiches_v4',        // [ficheFile1, ficheFile2, ...]
    'casIn_tutoriels',            // {tutorielId: {completed, quizScore, sections}}
    'casIn_examHistory',          // historique exam-app
    'examHist',                   // historique quiz-exam-mode
    'playdates',                  // dates de session quiz
    'cas_daily_quests',           // quêtes journalières
    'cas_quiz_run_buffer',        // buffer rotatif des réponses du jour
    'cas_leaderboards',           // leaderboards persistés
    'cas_npc_state',              // état des PNJ rencontrés
    'cas_npcs_met',               // liste des PNJ rencontrés
    'cas-in-scene-exam-last',     // dernier essai scene-exam
  ];

  // ─────────────────────────────────────────────────────────────
  // Backup TTL (auto-cleanup après N jours)
  // ─────────────────────────────────────────────────────────────
  const BACKUP_PREFIX = 'casIn_corrupt_backup_';
  const BACKUP_TTL_DAYS = 7;

  // ─────────────────────────────────────────────────────────────
  // Audit log (limité, pour debug)
  // ─────────────────────────────────────────────────────────────
  const AUDIT_LOG_KEY = 'casIn_storage_audit';
  const AUDIT_MAX_ENTRIES = 20;

  function appendAuditLog(event) {
    try {
      const raw = localStorage.getItem(AUDIT_LOG_KEY);
      const log = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(log)) return;
      log.push({ ts: Date.now(), ...event });
      while (log.length > AUDIT_MAX_ENTRIES) log.shift();
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(log));
    } catch (_) { /* silencieux — on ne casse rien pour de l'audit */ }
  }

  // ─────────────────────────────────────────────────────────────
  // Validation : détection + auto-repair
  // ─────────────────────────────────────────────────────────────
  function validateKey(key) {
    let raw;
    try {
      raw = localStorage.getItem(key);
    } catch (_) {
      return { ok: false, reason: 'localStorage_unreadable' };
    }
    if (raw === null) return { ok: true, exists: false };
    try {
      JSON.parse(raw);
      return { ok: true, exists: true };
    } catch (e) {
      return { ok: false, reason: 'invalid_json', error: e.message, raw: raw };
    }
  }

  function backupAndPurge(key, validation) {
    try {
      // Backup
      if (validation.raw !== undefined && validation.raw !== null) {
        const backupKey = BACKUP_PREFIX + key;
        const backup = {
          key: key,
          backedUpAt: new Date().toISOString(),
          reason: validation.reason,
          rawLength: validation.raw.length,
          rawSample: validation.raw.slice(0, 200), // n'enregistre que les 200 premiers chars pour économie
        };
        try {
          localStorage.setItem(backupKey, JSON.stringify(backup));
        } catch (_) { /* quota plein, on continue sans backup */ }
      }
      // Purge
      localStorage.removeItem(key);
      appendAuditLog({ type: 'purge', key: key, reason: validation.reason });
      console.warn('[CasInStorage] Clé "' + key + '" corrompue (' + validation.reason +
                   '), purgée. Backup dans "' + BACKUP_PREFIX + key + '".');
    } catch (e) {
      console.error('[CasInStorage] Échec du purge de "' + key + '" :', e);
    }
  }

  function cleanupOldBackups() {
    try {
      const cutoff = Date.now() - BACKUP_TTL_DAYS * 24 * 3600 * 1000;
      const toDelete = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(BACKUP_PREFIX)) continue;
        try {
          const obj = JSON.parse(localStorage.getItem(k));
          if (obj && obj.backedUpAt) {
            const ts = new Date(obj.backedUpAt).getTime();
            if (!isNaN(ts) && ts < cutoff) toDelete.push(k);
          }
        } catch (_) { /* backup malformé lui-même, suppression directe */
          toDelete.push(k);
        }
      }
      toDelete.forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
      });
      if (toDelete.length) {
        appendAuditLog({ type: 'cleanup_backups', count: toDelete.length });
      }
    } catch (_) { /* silencieux */ }
  }

  // ─────────────────────────────────────────────────────────────
  // Versioning et migration
  // ─────────────────────────────────────────────────────────────
  // Tableau des migrations. À étendre quand le schema évolue.
  // Format : { from: 1, to: 2, name: 'description', fn: function() {} }
  //
  // Exemple futur :
  //   { from: 1, to: 2, name: 'renomme casIn_profile_v4 → casIn_profile_v5', fn: function() {
  //       const old = localStorage.getItem('casIn_profile_v4');
  //       if (old) {
  //         localStorage.setItem('casIn_profile_v5', old);
  //         localStorage.removeItem('casIn_profile_v4');
  //       }
  //     }
  //   },
  const MIGRATIONS = [
    // (vide pour l'instant — version courante = 1)
  ];

  function readSchemaVersion() {
    try {
      const v = localStorage.getItem(SCHEMA_VERSION_KEY);
      const n = parseInt(v, 10);
      return isNaN(n) ? null : n;
    } catch (_) { return null; }
  }

  function writeSchemaVersion(v) {
    try { localStorage.setItem(SCHEMA_VERSION_KEY, String(v)); }
    catch (_) { /* silencieux */ }
  }

  function runMigrations() {
    let current = readSchemaVersion();
    // Première installation : pas encore de version stockée
    if (current === null) {
      writeSchemaVersion(SCHEMA_VERSION);
      appendAuditLog({ type: 'first_install', version: SCHEMA_VERSION });
      return;
    }
    if (current >= SCHEMA_VERSION) return; // à jour
    // Appliquer les migrations dans l'ordre
    while (current < SCHEMA_VERSION) {
      const migration = MIGRATIONS.find(m => m.from === current);
      if (!migration) {
        console.warn('[CasInStorage] Pas de migration depuis v' + current + '. Reset au schema courant.');
        writeSchemaVersion(SCHEMA_VERSION);
        appendAuditLog({ type: 'forced_schema_reset', from: current, to: SCHEMA_VERSION });
        return;
      }
      try {
        migration.fn();
        appendAuditLog({ type: 'migration', from: migration.from, to: migration.to, name: migration.name });
        console.info('[CasInStorage] Migration ' + migration.name + ' OK (v' + migration.from + ' → v' + migration.to + ')');
        current = migration.to;
        writeSchemaVersion(current);
      } catch (e) {
        console.error('[CasInStorage] Échec migration ' + migration.name + ' :', e);
        return; // on arrête, ne marque pas comme à jour
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Auto-boot
  // ─────────────────────────────────────────────────────────────
  function validateBoot() {
    // 1. Migrations (si nécessaire)
    runMigrations();

    // 2. Validation des clés critiques
    let corruptCount = 0;
    CRITICAL_JSON_KEYS.forEach(key => {
      const r = validateKey(key);
      if (!r.ok) {
        backupAndPurge(key, r);
        corruptCount++;
      }
    });

    // 3. Cleanup des backups anciens
    cleanupOldBackups();

    if (corruptCount > 0) {
      console.warn('[CasInStorage] Boot : ' + corruptCount + ' clé(s) corrompue(s) restaurée(s).');
    }
  }

  // Lance la validation immédiatement (le module est chargé tôt dans la page).
  // Si DOMContentLoaded déjà fait, exécuter direct. Sinon attendre.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', validateBoot, { once: true });
  } else {
    validateBoot();
  }

  // ─────────────────────────────────────────────────────────────
  // API publique
  // ─────────────────────────────────────────────────────────────
  // Wrappers safe en complément de CasInUtils.lsGet/lsSet/lsDel.
  // Différences :
  //   - get() émet un console.warn si la valeur est malformée (vs lsGet qui reste silencieux)
  //   - set() émet un console.warn si quota dépassé
  //   - getRaw()/setRaw() pour les valeurs scalaires (pas de JSON.parse/stringify)

  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[CasInStorage] get("' + key + '") : JSON malformé, retourne fallback. ' + e.message);
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[CasInStorage] set("' + key + '") : échec. ' + e.message);
      // Si quota plein, on essaie de cleanup les backups et réessayer une fois
      if (e.name === 'QuotaExceededError' || /quota/i.test(e.message)) {
        cleanupOldBackups();
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (_) { return false; }
      }
      return false;
    }
  }

  function del(key) {
    try { localStorage.removeItem(key); return true; }
    catch (_) { return false; }
  }

  function getRaw(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (_) { return fallback; }
  }

  function setRaw(key, value) {
    try { localStorage.setItem(key, String(value)); return true; }
    catch (_) { return false; }
  }

  function getAuditLog() {
    try {
      const raw = localStorage.getItem(AUDIT_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function getBackups() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(BACKUP_PREFIX)) {
          try {
            out.push(JSON.parse(localStorage.getItem(k)));
          } catch (_) {}
        }
      }
    } catch (_) {}
    return out;
  }

  function restoreBackup(key) {
    // Inverse opération de backupAndPurge : si l'utilisateur veut restaurer une clé corrompue
    // (en mode debug), on déplace le backup vers la clé d'origine.
    const backupKey = BACKUP_PREFIX + key;
    try {
      const obj = JSON.parse(localStorage.getItem(backupKey));
      if (!obj || !obj.rawSample) return false;
      // ATTENTION : on ne restaure que les 200 premiers chars (rawSample). Si la valeur
      // d'origine était plus longue, elle sera tronquée. Le but du restore est surtout
      // de récupérer une trace en debug, pas de reprendre un usage normal.
      localStorage.setItem(key, obj.rawSample);
      console.warn('[CasInStorage] Restore "' + key + '" partiel (tronqué à 200 chars).');
      return true;
    } catch (_) { return false; }
  }

  // Export
  window.CasInStorage = {
    // API safe
    get: get,
    set: set,
    del: del,
    getRaw: getRaw,
    setRaw: setRaw,
    // Versioning
    SCHEMA_VERSION: SCHEMA_VERSION,
    getCurrentSchemaVersion: readSchemaVersion,
    // Debug
    validateBoot: validateBoot,
    getAuditLog: getAuditLog,
    getBackups: getBackups,
    restoreBackup: restoreBackup,
    // Constants (en lecture seule)
    CRITICAL_KEYS: CRITICAL_JSON_KEYS.slice(),
  };
})();
