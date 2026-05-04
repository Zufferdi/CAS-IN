// ═══════════════════════════════════════════════════════════════
// hub-gamification-ui.js — Hub gamification unifié (v2.56 POLISH)
//
// Aggregator UI qui rassemble tous les leviers de gamification scène
// au même endroit (page index.html), pour donner au joueur une vue
// claire de "qu'est-ce que je peux gagner aujourd'hui ?".
//
// 5 sections rendues côte à côte :
//   ─ 🎯 Quêtes du jour (3, depuis Quests.getToday)
//   ─ 🏆 Défi hebdomadaire (depuis cas_challenge LS)
//   ─ ⚡ Combo journalier (3 runs ≥70%, depuis cas_daily_combo)
//   ─ 🔥 Streak journalière (depuis Profile.getStreak)
//   ─ 🛡️ Sans-faute streak (depuis cas_no_crit_streak)
//
// Conteneur ciblé : <div id="hub-gamification"></div>
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function lsGet(k, fb) {
    try { const r = localStorage.getItem(k); return r === null ? fb : JSON.parse(r); }
    catch (_) { return fb; }
  }

  // ── Streak journalière ──
  function getStreakData() {
    if (window.Profile && typeof window.Profile.getStreak === 'function') {
      const s = window.Profile.getStreak();
      return { current: s.current || 0, max: s.max || 0 };
    }
    const s = lsGet('cas_streak', { count: 0 });
    return { current: s.count || 0, max: 0 };
  }

  // ── Combo journalier (3 runs ≥70% le même jour) ──
  function getComboData() {
    const today = new Date().toISOString().slice(0, 10);
    const c = lsGet('cas_daily_combo', { date: '', count: 0, triggered: false });
    if (c.date !== today) return { count: 0, triggered: false, target: 3 };
    return { count: c.count || 0, triggered: !!c.triggered, target: 3 };
  }

  // ── Sans-faute streak ──
  function getNoCritData() {
    const count = lsGet('cas_no_crit_streak', 0);
    return { count };
  }

  // ── Défi hebdomadaire (depuis le state cas_challenge) ──
  function getWeeklyChallengeData() {
    const state = lsGet('cas_challenge', null);
    if (!state) return null;
    // Le titre/desc/target/reward du défi sont dans WEEKLY_CHALLENGES
    // (constante dans scene-app.js). Comme le hub n'est pas dans scene.html,
    // on n'a pas accès direct à WEEKLY_CHALLENGES — on reconstruit les
    // métadonnées via une mini-table miroir.
    return {
      id: state.id,
      progress: (state.runs || []).length,
      completed: !!state.completed,
      meta: WEEKLY_META[state.id] || null,
    };
  }

  // Mini-table miroir des métadonnées de défi hebdo (synchronisée avec
  // WEEKLY_CHALLENGES dans scene-app.js). Contient titre, icône, target, reward.
  const WEEKLY_META = {
    'three_hard':    { icon: '⚔️', title: 'Triple Hard',           target: 3, reward: 100 },
    'two_no_crit':   { icon: '🛡️', title: 'Protocole Impeccable',  target: 2, reward: 80 },
    'five_any':      { icon: '🎯', title: 'Marathon Hebdo',        target: 5, reward: 75 },
    'procureur_win': { icon: '⚖️', title: 'Défi Procureur',        target: 2, reward: 120 },
    'real_cases_3':  { icon: '📜', title: 'Historien',             target: 3, reward: 100 },
    'crypto_master': { icon: '🔐', title: 'Semaine Crypto',        target: 2, reward: 90 },
    'expert_run':    { icon: '🎓', title: 'Procureur Expérimenté', target: 1, reward: 200 },
  };

  // ── Quêtes du jour (3, depuis Quests.getToday) ──
  function getQuestsData() {
    if (!window.Quests || typeof window.Quests.getToday !== 'function') return null;
    return window.Quests.getToday();
  }

  // ─────────────────────────────────────────────────────────────
  // RENDERS
  // ─────────────────────────────────────────────────────────────

  function renderStatPill(icon, label, value, sub) {
    const subHtml = sub ? `<span class="hub-stat-sub">${sub}</span>` : '';
    return `
      <div class="hub-stat-pill">
        <span class="hub-stat-icon">${icon}</span>
        <span class="hub-stat-body">
          <span class="hub-stat-label">${label}</span>
          <span class="hub-stat-value">${value}</span>
          ${subHtml}
        </span>
      </div>
    `;
  }

  function renderQuestsSection() {
    const data = getQuestsData();
    if (!data || !data.quests) {
      return `<div class="hub-section"><div class="profile-empty">Module Quêtes non chargé.</div></div>`;
    }
    const completed = data.quests.filter(q => q.completed).length;
    const total = data.quests.length;
    const xpClaimed = data.totalRewardClaimed || 0;

    const cardsHtml = data.quests.map(q => {
      const status = q.completed ? 'is-complete' : 'is-pending';
      const statusIcon = q.completed ? '✅' : '⏳';
      return `
        <article class="hub-quest-card ${status}" data-quest-id="${q.id}" title="${escapeAttr(q.desc)}">
          <span class="hub-quest-icon">${q.icon}</span>
          <span class="hub-quest-title">${q.title}</span>
          <span class="hub-quest-reward">+${q.reward}</span>
          <span class="hub-quest-status">${statusIcon}</span>
        </article>
      `;
    }).join('');

    return `
      <div class="hub-section hub-section-quests">
        <header class="hub-section-header">
          <h3 class="hub-section-title">🎯 Quêtes du jour</h3>
          <span class="hub-section-counter">${completed}/${total}${xpClaimed > 0 ? ` · +${xpClaimed} XP` : ''}</span>
        </header>
        <div class="hub-quests-grid">${cardsHtml}</div>
      </div>
    `;
  }

  function renderWeeklySection() {
    const data = getWeeklyChallengeData();
    if (!data || !data.meta) {
      return `
        <div class="hub-section hub-section-weekly">
          <header class="hub-section-header">
            <h3 class="hub-section-title">🏆 Défi hebdomadaire</h3>
          </header>
          <p class="hub-empty">Défi non chargé. Joue une scène pour l'activer.</p>
        </div>
      `;
    }
    const m = data.meta;
    const pct = m.target > 0 ? Math.round((data.progress / m.target) * 100) : 0;
    const status = data.completed ? 'is-complete' : 'is-pending';

    return `
      <div class="hub-section hub-section-weekly ${status}">
        <header class="hub-section-header">
          <h3 class="hub-section-title">${m.icon} ${m.title}</h3>
          <span class="hub-section-counter">${data.progress}/${m.target}</span>
        </header>
        <div class="hub-weekly-progress">
          <div class="hub-weekly-bar">
            <div class="hub-weekly-fill" style="width: ${pct}%"></div>
          </div>
          <span class="hub-weekly-reward">${data.completed ? '✅ Accompli' : '+' + m.reward + ' XP'}</span>
        </div>
      </div>
    `;
  }

  function renderStreaksSection() {
    const streak = getStreakData();
    const noCrit = getNoCritData();
    const combo = getComboData();

    const comboLabel = combo.triggered
      ? '✅ Bonus +50 XP'
      : (combo.count >= combo.target
          ? '✅ Atteint'
          : `${combo.count}/${combo.target} pour bonus`);

    return `
      <div class="hub-section hub-section-streaks">
        <header class="hub-section-header">
          <h3 class="hub-section-title">⚡ Séries en cours</h3>
        </header>
        <div class="hub-streaks-grid">
          ${renderStatPill('🔥', 'Connexion', streak.current + (streak.current > 1 ? ' jours' : ' jour'),
                            streak.max > 0 ? `Record : ${streak.max}` : '')}
          ${renderStatPill('🛡️', 'Sans-faute', noCrit.count + (noCrit.count > 1 ? ' scènes' : ' scène'),
                            noCrit.count >= 5 ? 'Badge éthique débloqué' : `${5 - noCrit.count} avant Gardien`)}
          ${renderStatPill('⚡', 'Combo du jour', combo.count + '/' + combo.target,
                            comboLabel)}
        </div>
      </div>
    `;
  }

  function escapeAttr(s) {
    return String(s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────
  function render() {
    const container = document.getElementById('hub-gamification');
    if (!container) return;

    const html = `
      ${renderQuestsSection()}
      ${renderWeeklySection()}
      ${renderStreaksSection()}
    `;
    container.innerHTML = html;
  }

  // ── Auto-init + listeners ──
  function init() {
    let retries = 0;
    function tryRender() {
      // Attendre que Quests soit dispo (peut prendre 100-300ms après DOMContentLoaded)
      if (window.Quests && typeof window.Quests.getToday === 'function') {
        render();
        return;
      }
      if (retries++ < 25) setTimeout(tryRender, 200);
      else render(); // Render quand même même si Quests indisponible
    }
    tryRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render sur événements clé (quête complétée, profil changé, streak bumped)
  window.addEventListener('quests-changed', render);
  window.addEventListener('profile-changed', render);

  window.HubGamificationUI = { render, init };
})();
