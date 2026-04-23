// ═══════════════════════════════════════════════════════════════
// cas-in-gamify.js — Gamification unifiée CAS-IN
//
// Chantier D : XP unifié cross-module
//   - Clé localStorage : "cas_xp_unified" (nombre total)
//   - Source de rangs unique pour quiz + scene + tp
//   - Migration automatique depuis les anciennes clés (xp, cas_xp)
//
// Chantier F : Gamification TP (XP + streak + badges)
//
// Chantier E : Défi quotidien cross-module
//   - 3 défis par jour : 5 questions + 1 TP + 1 scène (selon modules)
//   - Tracking dans "cas_daily" avec date et complétion
//
// Également : tracking "cas_activity" {YYYY-MM-DD: count}
// consommé par la timeline sur la landing.
//
// Utilisation :
//   À inclure sur toutes les pages après les scripts principaux.
//   API exposée : window.CasIn = { addXP, getXP, getRank, recordActivity,
//                                   getDaily, completeDaily, ... }
// ═══════════════════════════════════════════════════════════════
(function (global) {
  'use strict';

  // ── Constantes de rang (unifiées) ────────────────────────────
  const RANKS = [
    { name: '🔰 Stagiaire',              min: 0,     emoji: '🔰' },
    { name: '📝 Analyste junior',        min: 75,    emoji: '📝' },
    { name: '🕵️ Inspecteur',              min: 150,   emoji: '🕵️' },
    { name: '🔎 Expert judiciaire',       min: 300,   emoji: '🔎' },
    { name: '💼 Commissaire',             min: 600,   emoji: '💼' },
    { name: '⚖️ Magistrat DFIR',          min: 1000,  emoji: '⚖️' },
    { name: '🏛️ Procureur numérique',     min: 1500,  emoji: '🏛️' },
    { name: '👑 Maître forensique',       min: 2500,  emoji: '👑' }
  ];

  const LS_XP     = 'cas_xp_unified';
  const LS_ACT    = 'cas_activity';
  const LS_DAILY  = 'cas_daily_global';
  const LS_TP_XP  = 'tp_xp_awarded';

  // ── Storage helpers ──────────────────────────────────────────
  function lsGet(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  // ── Migration depuis anciennes clés ──────────────────────────
  function migrateXP() {
    if (localStorage.getItem(LS_XP) !== null) return; // déjà migré
    const quizXP = parseInt(lsGet('xp', 0), 10) || 0;
    const sceneXP = parseInt(lsGet('cas_xp', 0), 10) || 0;
    const unified = quizXP + sceneXP;
    lsSet(LS_XP, unified);
    if (unified > 0) {
      console.debug('[CasIn] XP migré :', { quizXP, sceneXP, unified });
    }
  }
  migrateXP();

  // ── API XP ───────────────────────────────────────────────────
  function getXP() { return parseInt(lsGet(LS_XP, 0), 10) || 0; }

  function addXP(amount, source) {
    if (!amount || amount < 0) return { xp: getXP(), levelUp: false };
    const prev = getXP();
    const next = prev + amount;
    lsSet(LS_XP, next);
    // Synchroniser aussi les anciennes clés pour la compat du quiz/scene
    try {
      if (source === 'quiz') lsSet('xp', (lsGet('xp', 0) || 0) + amount);
      if (source === 'scene') lsSet('cas_xp', (lsGet('cas_xp', 0) || 0) + amount);
    } catch {}
    recordActivity();
    const prevRank = getRank(prev);
    const nextRank = getRank(next);
    return { xp: next, gained: amount, levelUp: prevRank.name !== nextRank.name, newRank: nextRank };
  }

  function getRank(xpValue) {
    const xp = xpValue === undefined ? getXP() : xpValue;
    let current = RANKS[0];
    for (const r of RANKS) if (xp >= r.min) current = r;
    return current;
  }
  function getNextRank(xpValue) {
    const xp = xpValue === undefined ? getXP() : xpValue;
    for (const r of RANKS) if (xp < r.min) return r;
    return null; // rang max
  }

  // ── Tracking activité ────────────────────────────────────────
  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }
  function recordActivity() {
    const k = todayKey();
    const act = lsGet(LS_ACT, {});
    act[k] = (act[k] || 0) + 1;
    // Nettoyage : garder 90 jours
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
    const cutKey = cutoff.toISOString().slice(0, 10);
    for (const day of Object.keys(act)) if (day < cutKey) delete act[day];
    lsSet(LS_ACT, act);
  }

  // ── Défi quotidien cross-module ──────────────────────────────
  function getDaily() {
    const today = todayKey();
    const stored = lsGet(LS_DAILY, null);
    if (stored && stored.date === today) return stored;
    // Nouveau jour — création d'un nouveau défi
    const fresh = {
      date: today,
      goals: {
        quiz:    { target: 5, done: 0, label: '5 questions quiz', done_flag: false },
        tp:      { target: 1, done: 0, label: '1 exercice TP',    done_flag: false },
        scene:   { target: 1, done: 0, label: '1 scène DFIR',     done_flag: false }
      },
      rewarded: false
    };
    lsSet(LS_DAILY, fresh);
    return fresh;
  }

  function recordDailyProgress(module, count) {
    if (count == null) count = 1;
    const d = getDaily();
    if (!d.goals[module]) return d;
    d.goals[module].done = Math.min(d.goals[module].done + count, d.goals[module].target);
    if (d.goals[module].done >= d.goals[module].target && !d.goals[module].done_flag) {
      d.goals[module].done_flag = true;
    }
    // Reward si tous goals terminés
    const allDone = Object.values(d.goals).every(g => g.done_flag);
    if (allDone && !d.rewarded) {
      d.rewarded = true;
      addXP(50, 'daily');
    }
    lsSet(LS_DAILY, d);
    return d;
  }

  // ── Gamification TP (chantier F) ─────────────────────────────
  // Appelé par tp-engine.js quand un exercice est résolu
  function awardTPXP(difficulty) {
    const map = { easy: 2, medium: 4, hard: 6 };
    const amount = map[difficulty] || 3;
    const r = addXP(amount, 'tp');
    // Track l'XP TP attribué cumulé
    const total = (parseInt(lsGet(LS_TP_XP, 0), 10) || 0) + amount;
    lsSet(LS_TP_XP, total);
    recordDailyProgress('tp', 1);
    return r;
  }

  // ── Streak TP ────────────────────────────────────────────────
  function getTPStreak() {
    return parseInt(lsGet('tp_streak', 0), 10) || 0;
  }
  function getTPBestStreak() {
    return parseInt(lsGet('tp_bestStreak', 0), 10) || 0;
  }

  // ── Exposer l'API ────────────────────────────────────────────
  global.CasIn = {
    // XP
    getXP, addXP, getRank, getNextRank,
    // Activité
    recordActivity,
    // Daily
    getDaily, recordDailyProgress,
    // TP
    awardTPXP, getTPStreak, getTPBestStreak,
    // Rangs (lecture seule)
    RANKS: Object.freeze(RANKS.map(r => Object.freeze({ ...r })))
  };
})(typeof window !== 'undefined' ? window : this);
