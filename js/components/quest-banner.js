/* ═══════════════════════════════════════════════════════════════
   quest-banner.js — v2.86
   
   Petit bandeau "Quête du jour" en haut du quiz (sous la navbar,
   au-dessus de la carte question). Affiche 1 seule quête active
   avec sa progression. S'auto-dismiss quand complétée + célèbre.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const DISMISS_KEY = 'casIn_questBannerDismissed';

  function lsGet(k, fb) {
    try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); }
    catch { return fb; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function isDismissedToday() {
    const dismissed = lsGet(DISMISS_KEY, null);
    return dismissed && dismissed.date === todayISO();
  }

  function dismissForToday() {
    lsSet(DISMISS_KEY, { date: todayISO() });
    const banner = document.getElementById('quest-banner');
    if (banner) banner.hidden = true;
  }
  window.dismissQuestBanner = dismissForToday;

  function getActiveQuest() {
    if (!window.Quests || typeof window.Quests.getToday !== 'function') return null;
    let state;
    try { state = window.Quests.getToday(); } catch { return null; }
    if (!state || !Array.isArray(state.quests)) return null;
    // Premier quest non complété
    return state.quests.find(q => !q.completed) || null;
  }

  function getQuestProgress(quest) {
    // On va lire le QUEST_POOL pour récupérer la fonction progress() si existe
    if (!window.Quests || !window.Quests.QUEST_POOL) return { current: 0, target: 1, pct: 0 };
    const def = window.Quests.QUEST_POOL.find(q => q.id === quest.id);
    if (!def || typeof def.progress !== 'function') {
      return { current: quest.completed ? 1 : 0, target: 1, pct: quest.completed ? 100 : 0 };
    }
    try {
      const p = def.progress();
      const target = p.target || 1;
      const current = Math.min(p.current || 0, target);
      const pct = Math.min(100, Math.round(100 * current / target));
      return { current, target, pct };
    } catch {
      return { current: 0, target: 1, pct: 0 };
    }
  }

  function render() {
    const banner = document.getElementById('quest-banner');
    if (!banner) return;

    if (isDismissedToday()) {
      banner.hidden = true;
      return;
    }

    const quest = getActiveQuest();
    if (!quest) {
      // Toutes les quêtes du jour sont complétées : afficher un message
      banner.hidden = false;
      banner.classList.add('quest-banner--all-done');
      const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setText('qb-icon', '✅');
      setText('qb-title', 'Toutes les quêtes du jour terminées — bravo !');
      setText('qb-reward', '');
      const fill = document.getElementById('qb-fill');
      if (fill) fill.style.width = '100%';
      setText('qb-pct', '');
      return;
    }

    banner.classList.remove('quest-banner--all-done');
    banner.hidden = false;

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('qb-icon', quest.icon || '🎯');
    setText('qb-title', quest.title || quest.id);
    setText('qb-reward', '+' + (quest.reward || 0) + ' XP');

    const prog = getQuestProgress(quest);
    setText('qb-pct', prog.target > 1 ? `${prog.current}/${prog.target}` : prog.pct + '%');
    const fill = document.getElementById('qb-fill');
    if (fill) fill.style.width = prog.pct + '%';
  }

  function init() {
    if (!window.Quests || typeof window.Quests.getToday !== 'function') {
      // Quests pas chargé sur cette page
      return;
    }
    render();

    // Re-render toutes les 3s pour suivre la progression en live
    setInterval(render, 3000);

    // Re-render après chaque évaluation des quêtes
    if (window.Profile && typeof window.Profile.onChange === 'function') {
      window.Profile.onChange(render);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
  } else {
    setTimeout(init, 200);
  }

  window.QuestBanner = { refresh: render };
})();
