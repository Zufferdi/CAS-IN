// ═══════════════════════════════════════════════════════════════
// quiz-utils.js — Helpers pures du quiz CAS-IN
//
// Extraites de quiz-app.js v2.21 pour :
//   • Réutilisation possible par d'autres modules (exam-app, scene-app...)
//   • Tests unitaires faciles (fonctions pures)
//   • Lisibilité de quiz-app.js
//
// Toutes les fonctions ici sont :
//   • PURES (sans état global)
//   • SANS dépendance au DOM (sauf sanitizeHTML)
//   • Exposées via window.QuizUtils ET en globales pour rétrocompatibilité
//
// IMPORTANT : ce fichier doit être chargé AVANT quiz-app.js.
//
// v1.0 — 2026-05-02 (split de quiz-app v2.20)
// ═══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ─── localStorage avec fallback sécurisé ────────────────────
  // Mode privé navigateur, quota dépassé, etc. → ne plante jamais.

  function lsGet(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v !== null ? JSON.parse(v) : d;
    } catch {
      return d;
    }
  }

  function lsSet(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  }

  // ─── Dates / horodatage ─────────────────────────────────────

  function getDailyDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function getDailySeed() {
    const d = getDailyDate();
    return d.split('-').reduce((a, v) => a * 100 + parseInt(v), 0);
  }

  function getWeekKey() {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d.toISOString().slice(0, 10);
  }

  // ─── PRNG seedable (pour le défi quotidien : tirage reproductible) ─

  function seededRng(seed) {
    let h = seed;
    return () => {
      h = Math.imul(h ^ h >>> 16, 0x45d9f3b);
      h = Math.imul(h ^ h >>> 15, 0x2b9c4d);
      return (h ^ h >>> 13) >>> 0;
    };
  }

  // ─── Mélange Fisher-Yates ───────────────────────────────────
  // Si rng fourni (PRNG seedable) → mélange déterministe.
  // Sinon → Math.random()

  function shuffle(a, rng) {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = rng
        ? Math.floor(rng() / (0xffffffff + 1) * (i + 1))
        : 0 | Math.random() * (i + 1);
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  // ─── Sanitisation HTML ──────────────────────────────────────
  // Retire scripts, iframes, attributs onX, javascript: URLs.
  // Utilisé sur le contenu utilisateur (avatar, pseudo) avant innerHTML.

  function sanitizeHTML(raw) {
    const tmp = document.createElement('div');
    tmp.innerHTML = raw || '';
    tmp.querySelectorAll('script,iframe,object,embed,link,meta').forEach(el => el.remove());
    tmp.querySelectorAll('*').forEach(el => {
      [...el.attributes].forEach(attr => {
        if (attr.name.startsWith('on') ||
            (attr.name === 'href' && /^javascript:/i.test(attr.value)) ||
            (attr.name === 'src'  && /^javascript:/i.test(attr.value))) {
          el.removeAttribute(attr.name);
        }
      });
    });
    return tmp.innerHTML;
  }

  // ─── Exposition ─────────────────────────────────────────────
  // (a) Namespace clean : window.QuizUtils.lsGet, etc.
  // (b) Globales pour compat avec quiz-app.js (qui les utilise sans préfixe)

  const QuizUtils = {
    lsGet, lsSet,
    getDailyDate, getDailySeed, getWeekKey,
    seededRng, shuffle, sanitizeHTML,
  };

  global.QuizUtils = QuizUtils;

  // Rétrocompat : injection directe si pas déjà définies
  // (quiz-app.js redéfinissait ces noms localement, on garde la même API)
  if (typeof global.lsGet === 'undefined')        global.lsGet = lsGet;
  if (typeof global.lsSet === 'undefined')        global.lsSet = lsSet;
  if (typeof global.getDailyDate === 'undefined') global.getDailyDate = getDailyDate;
  if (typeof global.getDailySeed === 'undefined') global.getDailySeed = getDailySeed;
  if (typeof global.getWeekKey === 'undefined')   global.getWeekKey = getWeekKey;
  if (typeof global.seededRng === 'undefined')    global.seededRng = seededRng;
  if (typeof global.shuffle === 'undefined')      global.shuffle = shuffle;
  if (typeof global.sanitizeHTML === 'undefined') global.sanitizeHTML = sanitizeHTML;
})(typeof window !== 'undefined' ? window : globalThis);
