// ═══════════════════════════════════════════════════════════════
// quiz-sm2.js — Algorithme SM-2 (spaced repetition) du quiz CAS-IN
//
// SM-2 (SuperMemo-2) : Wozniak (1985-1990).
// Utilisé par Anki, RemNote, et beaucoup d'apps de mémorisation.
//
// Formule récursive (par carte = par index de question) :
//   q ∈ [0..5]  ← qualité de la réponse (5=parfait, 0=blackout)
//   ef         ← facteur de facilité (initial 2.5, plancher 1.3)
//   interval   ← jours avant la prochaine présentation
//   reps       ← nombre de réponses correctes consécutives
//
//   Si q ≥ 3 (réussi) :
//     reps = 0 → interval = 1
//     reps = 1 → interval = 6
//     reps ≥ 2 → interval = round(interval × ef)
//     reps++
//   Sinon (raté) :
//     reps = 0 ; interval = 1
//
//   ef = max(1.3, ef + 0.1 - (5-q) × (0.08 + (5-q) × 0.02))
//
// Stockage : 1 entrée localStorage par carte sous clé `sm2_<idx>`.
// Format : { interval: int, ef: float, due: 'YYYY-MM-DD', reps: int }
//
// Dépend de : quiz-utils.js (lsGet, lsSet, getDailyDate)
// Exposé via : window.QuizSM2 et globales (rétrocompat quiz-app)
//
// v1.0 — 2026-05-02 (split de quiz-app v2.20)
// ═══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // Helpers depuis quiz-utils (chargé avant)
  const _lsGet         = global.lsGet || ((k, d) => d);
  const _lsSet         = global.lsSet || (() => {});
  const _getDailyDate  = global.getDailyDate || (() => new Date().toISOString().slice(0, 10));

  const SM2_PREFIX = 'sm2_';
  const DEFAULT_EF = 2.5;
  const MIN_EF     = 1.3;

  // ─── Lecture / écriture par carte ──────────────────────────

  function getSM2Data(idx) {
    const d = _lsGet(SM2_PREFIX + idx, null);
    return d || {
      interval: 1,
      ef: DEFAULT_EF,
      due: _getDailyDate(),
      reps: 0,
    };
  }

  function saveSM2Data(idx, d) {
    _lsSet(SM2_PREFIX + idx, d);
  }

  // ─── Algorithme SM-2 ───────────────────────────────────────
  // ok=true → q=5 (parfait) ; ok=false → q=1 (raté).
  // Dans une UI plus riche, q peut prendre d'autres valeurs.
  // Renvoie le nouvel état pour permettre l'affichage UX
  // ("Prochaine révision dans X jours").

  function updateSM2(idx, ok, qOverride) {
    const d = getSM2Data(idx);
    const q = qOverride !== undefined ? qOverride : (ok ? 5 : 1);
    let { interval, ef, reps } = d;

    if (q >= 3) {
      if (reps === 0) interval = 1;
      else if (reps === 1) interval = 6;
      else interval = Math.round(interval * ef);
      reps++;
    } else {
      reps = 0;
      interval = 1;
    }

    // Mise à jour du facteur de facilité
    ef = Math.max(MIN_EF, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

    const due = new Date();
    due.setDate(due.getDate() + interval);

    const newState = {
      interval,
      ef,
      due: due.toISOString().slice(0, 10),
      reps,
    };
    saveSM2Data(idx, newState);

    return {
      interval,
      reps,
      ef: ef.toFixed(2),
    };
  }

  // ─── Vue agrégée (UX) ──────────────────────────────────────
  // Renvoie : { total, dueToday, dueThisWeek, mature, learning, avgEF, longestInterval }

  function getSM2Stats() {
    const today = _getDailyDate();
    const todayD = new Date(today);
    const weekFromNow = new Date(todayD);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekDate = weekFromNow.toISOString().slice(0, 10);

    const cards = [];
    Object.keys(localStorage).forEach(k => {
      if (!k.startsWith(SM2_PREFIX)) return;
      try {
        const d = JSON.parse(localStorage.getItem(k));
        if (d) cards.push(d);
      } catch {}
    });

    const stats = {
      total: cards.length,
      dueToday: 0,
      dueThisWeek: 0,
      mature: 0,        // reps >= 3 (carte "apprise")
      learning: 0,      // reps < 3
      avgEF: 0,
      longestInterval: 0,
    };
    if (!cards.length) return stats;

    let sumEF = 0;
    cards.forEach(c => {
      if (c.due <= today) stats.dueToday++;
      if (c.due <= weekDate) stats.dueThisWeek++;
      if ((c.reps || 0) >= 3) stats.mature++;
      else stats.learning++;
      sumEF += (c.ef || DEFAULT_EF);
      stats.longestInterval = Math.max(stats.longestInterval, c.interval || 0);
    });
    stats.avgEF = (sumEF / cards.length).toFixed(2);
    return stats;
  }

  // ─── Cartes dues aujourd'hui ──────────────────────────────

  function getSM2Due() {
    const today = _getDailyDate();
    const due = [];
    Object.keys(localStorage).forEach(k => {
      if (!k.startsWith(SM2_PREFIX)) return;
      try {
        const idx = parseInt(k.slice(SM2_PREFIX.length));
        const d = JSON.parse(localStorage.getItem(k));
        if (d && d.due <= today) due.push(idx);
      } catch {}
    });
    return due;
  }

  // ─── Reset complet ─────────────────────────────────────────
  // Note : la confirmation utilisateur reste dans quiz-app
  // (cette fonction ne fait que la purge brute).

  function resetSM2() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(SM2_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
    return keys.length;
  }

  // ─── Exposition ────────────────────────────────────────────

  const QuizSM2 = {
    getSM2Data, saveSM2Data,
    updateSM2,
    getSM2Stats, getSM2Due,
    resetSM2,
    // Constantes utiles si besoin
    SM2_PREFIX, DEFAULT_EF, MIN_EF,
  };

  global.QuizSM2 = QuizSM2;

  // Globales pour rétrocompat avec quiz-app.js
  if (typeof global.getSM2Data === 'undefined')   global.getSM2Data = getSM2Data;
  if (typeof global.saveSM2Data === 'undefined')  global.saveSM2Data = saveSM2Data;
  if (typeof global.updateSM2 === 'undefined')    global.updateSM2 = updateSM2;
  if (typeof global.getSM2Stats === 'undefined')  global.getSM2Stats = getSM2Stats;
  if (typeof global.getSM2Due === 'undefined')    global.getSM2Due = getSM2Due;
})(typeof window !== 'undefined' ? window : globalThis);
