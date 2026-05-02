// ═══════════════════════════════════════════════════════════════
// quiz-share.js — Export et partage de cartes Canvas
//
// Helpers génériques pour exporter / copier / partager un canvas.
// Utilisés par les "share cards" du quiz (résultat, bilan, etc.).
//
// API (window.QuizShare et globales rétrocompat) :
//   downloadCanvas(canvas, filename)     → déclenche le téléchargement
//   copyCanvasToClipboard(canvas)        → écrit l'image dans le presse-papier
//   shareCanvasNative(canvas, opts)      → utilise navigator.share() si dispo,
//                                          fallback downloadCanvas
//
// Toutes les fonctions sont async-safe (gèrent les promesses canvas.toBlob).
// Un toast est affiché en cas de succès/échec si window.showToast existe.
//
// Dépend de : aucun module CAS-IN spécifique, juste les API navigateur.
//
// v1.0 — 2026-05-02 (split de quiz-app v2.20)
// ═══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  function _toast(toastId, msg, duration) {
    if (typeof global.showToast === 'function') {
      try { global.showToast(toastId, msg, duration); } catch {}
    }
  }

  // ─── Téléchargement (always works, fallback ultime) ──────
  // Crée un <a download> et clique. Compatible 100 % des navigateurs.

  function downloadCanvas(canvas, filename) {
    if (!canvas) return false;
    filename = filename || 'casin-score.png';
    try {
      const a = document.createElement('a');
      a.download = filename;
      a.href = canvas.toDataURL('image/png');
      a.click();
      return true;
    } catch (e) {
      return false;
    }
  }

  // ─── Copie dans le presse-papier ──────────────────────────
  // Utilise l'API Clipboard moderne (navigateurs récents seulement).
  // Échoue silencieusement sinon avec un toast d'avertissement.

  function copyCanvasToClipboard(canvas, opts) {
    opts = opts || {};
    const toastId = opts.toastId || 'streak-toast';

    if (!canvas) return Promise.resolve(false);

    return new Promise(resolve => {
      try {
        canvas.toBlob(async blob => {
          try {
            // ClipboardItem est seulement dispo dans les navigateurs modernes
            // (et seulement en HTTPS / contexte sécurisé)
            if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
              _toast(toastId, '⚠️ Copie non supportée — essaie le téléchargement', 2500);
              return resolve(false);
            }
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            _toast(toastId, '📋 Image copiée dans le presse-papier !', 2500);
            resolve(true);
          } catch (e) {
            _toast(toastId, '⚠️ Copie non supportée — essaie le téléchargement', 2500);
            resolve(false);
          }
        });
      } catch (e) {
        _toast(toastId, '⚠️ Copie non supportée — essaie le téléchargement', 2500);
        resolve(false);
      }
    });
  }

  // ─── Partage natif (Web Share API) ────────────────────────
  // navigator.share permet de partager via les apps installées
  // (mail, WhatsApp, Slack, AirDrop...). Pas dispo partout :
  // fallback automatique sur downloadCanvas.

  function shareCanvasNative(canvas, opts) {
    opts = opts || {};
    const filename = opts.filename || 'casin-score.png';
    const title    = opts.title    || 'Mon score CAS-IN';
    const text     = opts.text     || '';
    const fallbackToDownload = opts.fallbackToDownload !== false;

    if (!canvas) return Promise.resolve(false);

    return new Promise(resolve => {
      try {
        canvas.toBlob(async blob => {
          try {
            const file = new File([blob], filename, { type: 'image/png' });

            if (navigator.canShare?.({ files: [file] }) && navigator.share) {
              await navigator.share({ files: [file], title, text });
              resolve(true);
            } else if (fallbackToDownload) {
              downloadCanvas(canvas, filename);
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (e) {
            // L'utilisateur a annulé le partage → c'est OK, pas d'erreur
            // S'il y a une vraie erreur → fallback download
            if (fallbackToDownload && e.name !== 'AbortError') {
              downloadCanvas(canvas, filename);
            }
            resolve(false);
          }
        });
      } catch (e) {
        if (fallbackToDownload) downloadCanvas(canvas, filename);
        resolve(false);
      }
    });
  }

  // ─── Exposition ──────────────────────────────────────────

  const QuizShare = {
    downloadCanvas,
    copyCanvasToClipboard,
    shareCanvasNative,
  };

  global.QuizShare = QuizShare;
})(typeof window !== 'undefined' ? window : globalThis);
