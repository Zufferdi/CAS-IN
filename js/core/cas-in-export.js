// ═══════════════════════════════════════════════════════════════
// cas-in-export.js — Export / import de la progression utilisateur
//
// Objectif : permettre à un utilisateur de :
//   • Sauvegarder toute sa progression (XP, fiches lues, examens, TP, etc.)
//     dans un fichier JSON unique.
//   • La restaurer dans un autre navigateur, après réinstallation, etc.
//
// Stocke uniquement les clés du namespace CAS-IN, jamais d'autres données.
// Aucun appel réseau — tout reste local.
//
// API exposée :
//   window.CasInExport.exportProgress()  → déclenche un téléchargement .json
//   window.CasInExport.importProgress(file) → lit un fichier sélectionné
//   window.CasInExport.openImportDialog() → ouvre le sélecteur de fichier
//   window.CasInExport.previewImport(json) → renvoie un résumé sans appliquer
//
// Format du fichier exporté :
//   {
//     "$format": "cas-in-progress/v1",
//     "exportedAt": "2026-04-28T...",
//     "version": "2.5",
//     "data": {
//       "casIn_stats": {...},
//       "casIn_readFiches_v4": [...],
//       "casIn_examHistory": [...],
//       "tp_solved": {...},
//       "casIn_lastScore": "1234",   // ← strings stored raw
//       ...
//     },
//     "stats": {  // résumé human-readable
//       "questionsSeen": 234,
//       "fichesRead": 12,
//       "examsCompleted": 3,
//       "tpSolved": 18
//     }
//   }
// ═══════════════════════════════════════════════════════════════

// ─── Notification helper : préfère showToast, fallback alert ───
function casNotify(msg, opts) {
  opts = opts || {};
  var duration = opts.duration || 2800;
  // 1) showToast custom (defined in scene-app, quiz-app)
  if (typeof window.showToast === 'function') {
    try { window.showToast('cas-export-toast', msg, duration); return; } catch (e) {}
  }
  // 2) fallback alert (force user attention, OK avant reload)
  alert(msg);
}

(function () {
  'use strict';

  // ─── Catalogue des clés CAS-IN à exporter ───────────────────
  // Toutes les clés commençant par ces préfixes sont incluses.
  // Whitelist explicite : on ne veut JAMAIS exporter les clés d'autres
  // sites (si l'utilisateur sert plusieurs apps depuis le même domaine).
  const KEY_PREFIXES = [
    'casIn_',       // namespace canonique (XP, streaks, examens, etc.)
    'cas_',         // ancien namespace (fiches lues v3, etc.) - pour migration
    'tp_',          // exercices TP
    'scene',        // scénarios DFIR (scene_results, scenesBeaten…)
    'mission',      // mode mission
    'boss',         // boss beaten
    'fiche',        // ficheUnlocked
    'daily',        // dailyDone_*, dailyScore_*
    'freeze',       // freezeUsed_*, freezes
    'avatar',       // avatarEmoji, avatarName
    'comeback',     // comeback flags
    'forensic',     // forensicShown
    'install',      // installDismissed
    'lastPlay',     // lastPlayDate
    'play',         // playdates
    'night',        // nightOwl
    'perfect',      // perfectExam, perfectExam20
    'qs',           // questions seen state
    'achievements', // achievements unlocked
    'fontSize',
    'hint',         // hintDate, hintsLeft, hintsUsed
    'maxCombo',
    'examHist',
    'dayStreak',
  ];

  // Clés explicites (pas de préfixe matching) — permet de filtrer encore plus
  const EXPLICIT_KEYS = new Set([
    'ac', 'ad', 'at', 'bm',  // active themes/diff/bookmarks (single-letter)
    'ms',  // milestone state
  ]);

  // Clés à NE PAS exporter (PWA install state, debug, etc. — par sécurité)
  const BLACKLIST = new Set([
    // (vide pour l'instant — rien à blacklister)
  ]);

  function isCasInKey(key) {
    if (BLACKLIST.has(key)) return false;
    if (EXPLICIT_KEYS.has(key)) return true;
    return KEY_PREFIXES.some(p => key.startsWith(p));
  }

  // ─── Lire toutes les clés CAS-IN du localStorage ────────────
  function collectAllKeys() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !isCasInKey(key)) continue;
      const raw = localStorage.getItem(key);
      // Tenter de parser comme JSON, sinon garder en raw string
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
    return data;
  }

  // ─── Calculer un résumé human-readable ──────────────────────
  function computeSummary(data) {
    const summary = {
      questionsSeen: 0,
      fichesRead: 0,
      examsCompleted: 0,
      tpSolved: 0,
      scenesDone: 0,
      xp: 0,
      streak: 0,
    };
    try {
      const stats = data['casIn_stats'];
      if (stats && typeof stats === 'object') {
        summary.xp = stats.xp || 0;
        summary.streak = stats.streak || 0;
        summary.questionsSeen = stats.total || 0;
      }
      // questionsSeen via la clé directe (cas-in-counts l'utilise)
      const seen = parseInt(data['casIn_questionsSeen'] || '0');
      if (seen > summary.questionsSeen) summary.questionsSeen = seen;

      const fiches = data['casIn_readFiches_v4'] || data['cas_read_fiches'] || [];
      if (Array.isArray(fiches)) summary.fichesRead = fiches.length;

      const exams = data['casIn_examHistory'] || [];
      if (Array.isArray(exams)) summary.examsCompleted = exams.length;

      const tp = data['tp_solved'] || {};
      if (typeof tp === 'object') {
        summary.tpSolved = Object.values(tp).reduce((a, b) => a + (parseInt(b) || 0), 0);
      }

      const scenes = data['casIn_scenes_done'] || [];
      if (Array.isArray(scenes)) summary.scenesDone = scenes.length;
    } catch (e) {
      console.warn('[export] summary error', e);
    }
    return summary;
  }

  // ─── EXPORT : déclenche un téléchargement .json ─────────────
  function exportProgress() {
    const data = collectAllKeys();
    const summary = computeSummary(data);

    const payload = {
      '$format': 'cas-in-progress/v1',
      'exportedAt': new Date().toISOString(),
      'userAgent': navigator.userAgent,
      'data': data,
      'summary': summary,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    a.href = url;
    a.download = `cas-in-progression-${date}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    return { keys: Object.keys(data).length, summary };
  }

  // ─── PREVIEW : valide un JSON sans appliquer ────────────────
  function previewImport(json) {
    let parsed;
    try {
      parsed = (typeof json === 'string') ? JSON.parse(json) : json;
    } catch (e) {
      return { ok: false, error: 'JSON invalide : ' + e.message };
    }
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Structure invalide : objet attendu' };
    }
    if (parsed['$format'] !== 'cas-in-progress/v1') {
      return {
        ok: false,
        error: 'Format inconnu : "' + parsed['$format'] + '" (attendu cas-in-progress/v1)',
      };
    }
    const data = parsed.data || {};
    if (typeof data !== 'object' || data === null) {
      return { ok: false, error: 'Champ "data" manquant ou invalide' };
    }
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return { ok: false, error: 'Aucune donnée à importer (champ "data" vide)' };
    }
    const filtered = keys.filter(k => isCasInKey(k));
    return {
      ok: true,
      summary: parsed.summary || computeSummary(data),
      exportedAt: parsed.exportedAt,
      totalKeys: keys.length,
      validKeys: filtered.length,
      ignoredKeys: keys.length - filtered.length,
    };
  }

  // ─── IMPORT : applique les données après confirmation ───────
  function applyImport(parsed, options = {}) {
    const data = parsed.data || {};
    const merge = !!options.merge; // false = remplace, true = fusionne (préserve l'existant si conflit)
    let written = 0, skipped = 0;

    for (const key of Object.keys(data)) {
      if (!isCasInKey(key)) {
        skipped++;
        continue;
      }
      // En mode merge : si la clé existe déjà côté local, on garde le local
      if (merge && localStorage.getItem(key) !== null) {
        skipped++;
        continue;
      }
      const value = data[key];
      // Re-stringifier ce qui était objet/array, garder string brut sinon
      const stored = (typeof value === 'string') ? value : JSON.stringify(value);
      try {
        localStorage.setItem(key, stored);
        written++;
      } catch (e) {
        console.warn('[import] write failed for', key, e);
      }
    }

    return { written, skipped };
  }

  // ─── Dialogue UI : sélecteur de fichier + confirmation ──────
  function openImportDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        const preview = previewImport(text);
        document.body.removeChild(input);

        if (!preview.ok) {
          casNotify('Import impossible : ' + preview.error, { duration: 4500 });
          return;
        }

        const s = preview.summary || {};
        const date = preview.exportedAt
          ? new Date(preview.exportedAt).toLocaleString('fr-CH')
          : 'date inconnue';

        const msg = [
          'Import depuis le fichier :',
          '  Date : ' + date,
          '  Clés : ' + preview.validKeys + ' valides (' + preview.ignoredKeys + ' ignorées)',
          '',
          'Résumé du fichier :',
          '  • XP : ' + (s.xp || 0).toLocaleString('fr-CH'),
          '  • Questions vues : ' + (s.questionsSeen || 0),
          '  • Fiches lues : ' + (s.fichesRead || 0),
          '  • Examens : ' + (s.examsCompleted || 0),
          '  • Scènes : ' + (s.scenesDone || 0),
          '  • TP résolus : ' + (s.tpSolved || 0),
          '  • Streak : ' + (s.streak || 0) + ' jours',
          '',
          'Cliquer OK REMPLACE votre progression actuelle par celle du fichier.',
          'Cliquer Annuler n\'applique aucune modification.',
        ].join('\n');

        if (!confirm(msg)) return;

        const parsed = JSON.parse(text);
        const result = applyImport(parsed, { merge: false });
        casNotify('Import terminé : ' + result.written + ' clés appliquées, ' + result.skipped + ' ignorées. Rechargement…', { duration: 1500 });
        // Recharger pour que l'app reprenne avec les nouvelles données
        setTimeout(() => location.reload(), 200);
      };
      reader.onerror = () => {
        casNotify('Erreur de lecture du fichier.', { duration: 3000 });
        document.body.removeChild(input);
      };
      reader.readAsText(file);
    });

    input.click();
  }

  // ─── Reset (cohérent avec le drawer mais via cette API) ─────
  function resetProgress() {
    if (!confirm('Réinitialiser TOUTE la progression ? Cette action est irréversible.\n\nAstuce : exporter d\'abord pour garder une copie.')) {
      return;
    }
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isCasInKey(key)) keysToDelete.push(key);
    }
    keysToDelete.forEach(k => localStorage.removeItem(k));
    casNotify('Progression réinitialisée (' + keysToDelete.length + ' clés). Rechargement…', { duration: 1500 });
    setTimeout(() => location.reload(), 200);
  }

  // ─── Expose API ─────────────────────────────────────────────
  window.CasInExport = {
    exportProgress,
    importProgress: applyImport,
    openImportDialog,
    previewImport,
    resetProgress,
    // utils
    isCasInKey,
  };
})();
