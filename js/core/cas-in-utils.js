// ═══════════════════════════════════════════════════════════════
// cas-in-utils.js — Helpers JS centralisés (v2.60 / migration v2.85)
//
// Avant cette version, 6+ fichiers définissaient leurs propres
// versions de escapeHTML / escapeAttr / lsGet / etc., avec parfois
// des variations de comportement subtiles. Ce module fournit une
// implémentation unique et vérifiée.
//
// Stratégie de migration : non-breaking. Les modules existants peuvent
// continuer d'utiliser leurs helpers locaux. Les nouveaux modules
// utilisent window.CasInUtils. Migration progressive sans risque.
//
// Modules déjà migrés (v2.85) :
//   • js/profile/profile-page.js     (escapeHtml → CasInUtils.escapeHTML)
//   • js/components/scene-npcs.js    (escapeHtml + escapeAttr)
//   • js/pages/scene-engine-v4.js    (esc inline pour le tooltip glossaire)
//
// Modules avec helper local maintenu (encore à migrer) :
//   • js/pages/exam-app.js           (escHtml — exam.html ne charge pas
//                                     cas-in-utils, à voir au besoin)
//   • js/components/quiz-utils.js    (sanitizeHTML — version DOM-based plus
//                                     riche, gardée pour le pseudo utilisateur)
//   • js/tp/tp-engine.js             (escAttr)
//   • js/components/fiche-search.js  (escapeHTML)
//
// Toutes les fonctions sont stateless et idempotentes.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // ESCAPING (HTML / attribute)
  // ─────────────────────────────────────────────────────────────

  /**
   * Échappe une chaîne pour insertion dans du HTML (entre balises).
   * Couvre &, <, >, ", '. Retourne '' pour null/undefined.
   */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Échappe pour insertion dans un attribut HTML. Plus restrictif :
   * en plus de escapeHTML, échappe aussi les retours à la ligne
   * pour éviter les attributs cassés sur plusieurs lignes.
   */
  function escapeAttr(str) {
    if (str === null || str === undefined) return '';
    return escapeHTML(str)
      .replace(/\r/g, '&#13;')
      .replace(/\n/g, '&#10;');
  }

  // ─────────────────────────────────────────────────────────────
  // LOCALSTORAGE wrappers (avec gestion d'erreur)
  // ─────────────────────────────────────────────────────────────

  /**
   * Lit une valeur dans localStorage, parse en JSON si possible.
   * Retourne le fallback si la clé n'existe pas ou parse impossible.
   */
  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  /**
   * Écrit une valeur dans localStorage en JSON. Silencieux en cas
   * d'erreur (quota, mode privé Safari).
   */
  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Supprime une clé. Silencieux.
   */
  function lsDel(key) {
    try { localStorage.removeItem(key); return true; }
    catch (_) { return false; }
  }

  // ─────────────────────────────────────────────────────────────
  // DATES
  // ─────────────────────────────────────────────────────────────

  /**
   * Date du jour au format ISO YYYY-MM-DD (UTC).
   * Utilisé partout pour les buffers journaliers (quêtes, runs, quiz).
   */
  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Convertit une Date en chaîne 'fr' DD/MM/YYYY.
   */
  function dateFR(d) {
    const date = d instanceof Date ? d : new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${date.getFullYear()}`;
  }

  /**
   * Compare deux dates pour déterminer si elles sont le même jour
   * (en heure locale). Accepte Date ou ISO string.
   */
  function isSameDay(a, b) {
    const da = a instanceof Date ? a : new Date(a);
    const db = b instanceof Date ? b : new Date(b);
    return da.getFullYear() === db.getFullYear() &&
           da.getMonth() === db.getMonth() &&
           da.getDate() === db.getDate();
  }

  // ─────────────────────────────────────────────────────────────
  // PERFORMANCE (debounce / throttle)
  // ─────────────────────────────────────────────────────────────

  /**
   * Retourne une version 'debounced' d'une fonction : n'appelle qu'après
   * que `delay` ms se soient écoulés sans nouvel appel. Utile pour
   * input search, resize handlers, etc.
   */
  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Retourne une version 'throttled' : appelle au plus 1 fois par 'delay' ms.
   */
  function throttle(fn, delay) {
    let last = 0;
    let timer = null;
    return function (...args) {
      const now = Date.now();
      const remaining = delay - (now - last);
      if (remaining <= 0) {
        if (timer) { clearTimeout(timer); timer = null; }
        last = now;
        fn.apply(this, args);
      } else if (!timer) {
        timer = setTimeout(() => {
          last = Date.now();
          timer = null;
          fn.apply(this, args);
        }, remaining);
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // PRNG seedé (pour rotations déterministes par date)
  // Utilisé par cas-in-quests.js pour pickQuestsForDate
  // ─────────────────────────────────────────────────────────────

  /**
   * mulberry32 — PRNG rapide et déterministe, seedé.
   */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /**
   * Hash simple d'une chaîne en entier 32-bit, pour seeder un PRNG.
   */
  function stringToSeed(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return h;
  }

  // ─────────────────────────────────────────────────────────────
  // CLAMPING / MATH
  // ─────────────────────────────────────────────────────────────

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function asInt(value, fallback) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : (fallback || 0);
  }

  // ─────────────────────────────────────────────────────────────
  // PREFERS-COLOR-SCHEME (v2.85)
  //
  // Si l'OS de l'utilisateur préfère le clair ET qu'aucun thème n'a été
  // explicitement choisi (data-theme absent), on applique data-theme="light"
  // sur <html> pour activer les ~29 règles CSS [data-theme="light"] qui
  // existent déjà mais n'étaient jamais activées (mode clair "dead code"
  // depuis l'origine, signalé par l'audit v2.10).
  //
  // Le complément CSS (variables auto-applied via @media (prefers-color-scheme))
  // est dans style.css : il couvre le rendu sans JS, ce JS polit le reste.
  //
  // Si la préférence change (l'utilisateur switch son OS pendant la session),
  // on bascule en live. Si l'utilisateur fait un choix manuel via une future
  // UI de toggle (qui posera data-theme via setAttribute), on respecte.
  // ─────────────────────────────────────────────────────────────
  function bootstrapColorScheme() {
    if (typeof document === 'undefined' || !document.documentElement) return;
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-color-scheme: light)');

    // v2.92 — Préférence manuelle (cas_theme_pref) prioritaire.
    // Si l'utilisateur a cliqué sur le toggle clair/sombre, on respecte ce
    // choix sur toutes les pages, indépendamment de l'OS.
    function readManualPref() {
      try { return localStorage.getItem('cas_theme_pref'); } catch (_) { return null; }
    }

    const apply = () => {
      const root = document.documentElement;
      const manual = readManualPref();
      if (manual === 'light') {
        root.setAttribute('data-theme', 'light');
        delete root.dataset.themeAuto;
        return;
      }
      if (manual === 'dark') {
        // Forçage sombre : on pose data-theme="dark" pour neutraliser le
        // @media (prefers-color-scheme: light) (sélecteur :not([data-theme])).
        root.setAttribute('data-theme', 'dark');
        delete root.dataset.themeAuto;
        return;
      }
      // Pas de pref manuelle : suivre l'OS, mais respecter un éventuel
      // data-theme déjà posé par un autre script (legacy).
      const cur = root.getAttribute('data-theme');
      const wasAuto = root.dataset.themeAuto === '1';
      if (cur && !wasAuto) return; // choix utilisateur explicite (legacy), on respecte
      if (mql.matches) {
        root.setAttribute('data-theme', 'light');
        root.dataset.themeAuto = '1';
      } else if (wasAuto) {
        // Revenir au défaut sombre
        root.removeAttribute('data-theme');
        delete root.dataset.themeAuto;
      }
    };
    apply();
    // Exposer pour permettre au toggle de relancer apply() au besoin.
    window.__casBootstrapColorScheme = apply;
    // Réagir aux changements de préférence OS sans recharger la page
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', apply);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(apply); // legacy Safari < 14
    }
  }
  // ─────────────────────────────────────────────────────────────
  // RÉACTIVÉ en v2.58
  //
  // Désactivé temporairement en v2.49 (hotfix lisibilité) le temps
  // de compléter la couverture CSS clair. Couverture désormais à
  // 100% (cf. CHANGELOG v2.50–v2.57). On peut donc à nouveau laisser
  // l'OS du user piloter le thème.
  // ─────────────────────────────────────────────────────────────
  bootstrapColorScheme();

  // ─────────────────────────────────────────────────────────────
  // ESCAPE HATCH ?theme=light (v2.50)
  //
  // Permet de tester la couverture clair page par page sans réactiver
  // le bootstrap auto. Usage : ajouter ?theme=light à n'importe quelle
  // URL (ex. /quiz.html?theme=light). À retirer quand la couverture
  // clair sera complète et le bootstrap réactivé.
  // ─────────────────────────────────────────────────────────────
  try {
    const themeParam = new URLSearchParams(location.search).get('theme');
    if (themeParam === 'light' || themeParam === 'dark') {
      if (themeParam === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  } catch (e) { /* ignore */ }

  // ─────────────────────────────────────────────────────────────
  // API publique
  // ─────────────────────────────────────────────────────────────
  window.CasInUtils = {
    // HTML escaping
    escapeHTML, escapeAttr,
    // Storage
    lsGet, lsSet, lsDel,
    // Dates
    todayISO, dateFR, isSameDay,
    // Perf
    debounce, throttle,
    // PRNG
    mulberry32, stringToSeed,
    // Math
    clamp, asInt,
  };
})();
