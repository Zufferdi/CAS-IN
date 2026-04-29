/* ============================================================
   CAS-IN · profile-page.js
   Logique de profile.html — peuple la page depuis Profile.snapshot()
   et écoute l'événement 'profile-changed' pour rafraîchir.
   ============================================================ */

(function () {
  'use strict';

  // ───────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────

  function $(id) { return document.getElementById(id); }
  function fmtNumber(n) {
    return (n || 0).toLocaleString('fr-CH').replace(/\u00A0/g, ' ');
  }
  function setText(id, txt) { const el = $(id); if (el) el.textContent = txt; }

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────

  function render() {
    if (!window.Profile) {
      console.warn('[profile-page] window.Profile pas chargé');
      return;
    }
    const snap = window.Profile.snapshot();

    // Header
    const utc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    setText('profile-utc', utc);

    // Hero
    setText('profile-rank-emoji', snap.rank.emoji);
    setText('profile-agent-name', snap.agent.name);
    setText('profile-rank-name', snap.rank.name);
    setText('profile-clearance', `Clearance lvl ${snap.rank.clearance}`);
    setText('profile-rank-flavor', snap.rank.flavor || '—');
    setText('profile-xp-big', fmtNumber(snap.xp));

    const fill = $('profile-xp-fill');
    if (fill) fill.style.width = snap.rank.pctToNext + '%';
    if (snap.rank.next) {
      setText('profile-xp-next', `→ ${snap.rank.next.emoji} ${snap.rank.next.name} dans ${fmtNumber(snap.rank.xpToNext)} XP`);
    } else {
      setText('profile-xp-next', 'Rang maximum atteint 🏆');
    }

    // Stats
    setText('profile-streak-val', String(snap.streak.current));
    const streakUnit = $('profile-streak-val');
    if (streakUnit) {
      // Reconstruire avec l'unité
      streakUnit.innerHTML = `${snap.streak.current}<span class="profile-stat-unit">j 🔥</span>`;
    }
    setText('profile-streak-sub', `série max : ${snap.streak.max} jour${snap.streak.max > 1 ? 's' : ''}`);

    setText('profile-q-val', fmtNumber(snap.stats.questions));
    setText('profile-q-sub', snap.stats.questions ? '— sur le quiz' : 'Aucune réponse encore');

    setText('profile-f-val', String(snap.stats.fichesRead));
    setText('profile-f-sub', snap.stats.fichesRead ? '— mémorisées' : 'Aucune fiche lue');

    setText('profile-e-val', String(snap.stats.examsPassed));
    setText('profile-e-sub', snap.stats.examsPassed ? '— passés' : 'Aucun examen passé');

    // Ventilation XP
    const totalXp = Math.max(1, snap.xp);
    setText('profile-xp-quiz', `${fmtNumber(snap.xpBySource.quiz)} XP`);
    setText('profile-xp-scene', `${fmtNumber(snap.xpBySource.scene)} XP`);
    const qFill = $('profile-xp-quiz-fill');
    const sFill = $('profile-xp-scene-fill');
    if (qFill) qFill.style.width = Math.round((snap.xpBySource.quiz / totalXp) * 100) + '%';
    if (sFill) sFill.style.width = Math.round((snap.xpBySource.scene / totalXp) * 100) + '%';

    setText('profile-tp-count', `${snap.stats.tpSolved} résolu${snap.stats.tpSolved > 1 ? 's' : ''}`);
    setText('profile-fiches-count', `${snap.stats.fichesRead} lue${snap.stats.fichesRead > 1 ? 's' : ''}`);

    // Hiérarchie des rangs
    renderLadder(snap.rank.idx);

    // Achievements
    renderAchievements();
  }

  function renderLadder(currentIdx) {
    const ol = $('profile-ladder');
    if (!ol || !window.Profile) return;
    ol.innerHTML = '';
    window.Profile.RANKS.forEach((rank, i) => {
      const li = document.createElement('li');
      li.className = 'profile-ladder-item';
      if (i < currentIdx) li.classList.add('is-passed');
      else if (i === currentIdx) li.classList.add('is-current');

      const emoji = document.createElement('span');
      emoji.className = 'profile-ladder-emoji';
      emoji.textContent = rank.emoji;

      const body = document.createElement('div');
      body.className = 'profile-ladder-body';
      const name = document.createElement('div');
      name.className = 'profile-ladder-name';
      name.textContent = rank.name;
      const sub = document.createElement('div');
      sub.className = 'profile-ladder-sub';
      sub.textContent = `${fmtNumber(rank.min)} XP · clearance lvl ${rank.clearance}`;
      body.appendChild(name);
      body.appendChild(sub);

      const status = document.createElement('span');
      status.className = 'profile-ladder-status';
      if (i < currentIdx) status.textContent = '✓';
      else if (i === currentIdx) status.textContent = '◉';
      else status.textContent = '○';

      li.appendChild(emoji);
      li.appendChild(body);
      li.appendChild(status);
      ol.appendChild(li);
    });
  }

  function renderAchievements() {
    const wrap = $('profile-achievements');
    if (!wrap) return;
    let unlocked = [];
    try {
      const raw = localStorage.getItem('achievements');
      if (raw) unlocked = JSON.parse(raw) || [];
      if (!Array.isArray(unlocked)) unlocked = [];
    } catch { unlocked = []; }

    setText('profile-ach-count', String(unlocked.length));

    if (!unlocked.length) {
      wrap.innerHTML = '<div class="profile-empty">Aucun succès débloqué pour l\'instant. Continue l\'enquête.</div>';
      return;
    }

    // Si quiz-app.js a une constante ACHIEVEMENTS exportée, on l'utilise
    // pour récupérer le nom + description. Sinon affichage minimal.
    const allAch = (typeof window.ACHIEVEMENTS !== 'undefined' && Array.isArray(window.ACHIEVEMENTS))
      ? window.ACHIEVEMENTS : null;

    wrap.innerHTML = '';
    unlocked.forEach(id => {
      const meta = allAch ? allAch.find(a => a.id === id) : null;
      const card = document.createElement('div');
      card.className = 'profile-achievement-card';
      const emoji = document.createElement('div');
      emoji.className = 'profile-achievement-emoji';
      emoji.textContent = meta?.emoji || '🏅';
      const body = document.createElement('div');
      body.className = 'profile-achievement-body';
      const name = document.createElement('div');
      name.className = 'profile-achievement-name';
      name.textContent = meta?.name || id;
      const desc = document.createElement('div');
      desc.className = 'profile-achievement-desc';
      desc.textContent = meta?.desc || '—';
      body.appendChild(name);
      body.appendChild(desc);
      card.appendChild(emoji);
      card.appendChild(body);
      wrap.appendChild(card);
    });
  }

  // ───────────────────────────────────────────────────────────
  // Modale édition pseudo
  // ───────────────────────────────────────────────────────────

  function openPseudoModal() {
    const modal = $('profile-pseudo-modal');
    const input = $('profile-pseudo-input');
    if (!modal || !input || !window.Profile) return;
    const current = window.Profile.snapshot().agent.pseudo || '';
    input.value = current;
    modal.hidden = false;
    setTimeout(() => input.focus(), 50);
  }
  function closePseudoModal() {
    const modal = $('profile-pseudo-modal');
    if (modal) modal.hidden = true;
  }
  function savePseudo() {
    const input = $('profile-pseudo-input');
    if (!input || !window.Profile) return;
    window.Profile.setAgentName(input.value);
    closePseudoModal();
  }

  // ───────────────────────────────────────────────────────────
  // Actions : export / import / reset
  // ───────────────────────────────────────────────────────────

  function bindActions() {
    const exp = $('profile-export');
    const imp = $('profile-import');
    const rst = $('profile-reset');

    if (exp) exp.addEventListener('click', () => {
      if (window.CasInExport && window.CasInExport.exportProgress) {
        window.CasInExport.exportProgress();
      } else {
        alert('Module export non chargé.');
      }
    });

    if (imp) imp.addEventListener('click', () => {
      if (window.CasInExport && window.CasInExport.openImportDialog) {
        window.CasInExport.openImportDialog();
      } else {
        alert('Module import non chargé.');
      }
    });

    if (rst) rst.addEventListener('click', () => {
      if (!confirm('Réinitialiser TOUTE la progression ? Cette action est irréversible.')) return;
      window.Profile.reset();
      // Force un reload pour que le quiz/scène repartent à zéro à la prochaine ouverture
      setTimeout(() => location.reload(), 100);
    });
  }

  function bindPseudo() {
    const btn = $('profile-edit-pseudo');
    const cancel = $('profile-pseudo-cancel');
    const save = $('profile-pseudo-save');
    const backdrop = $('profile-pseudo-backdrop');
    const input = $('profile-pseudo-input');

    if (btn) btn.addEventListener('click', openPseudoModal);
    if (cancel) cancel.addEventListener('click', closePseudoModal);
    if (backdrop) backdrop.addEventListener('click', closePseudoModal);
    if (save) save.addEventListener('click', savePseudo);
    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') savePseudo();
        if (e.key === 'Escape') closePseudoModal();
      });
    }

    // Esc global pour la modale
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const modal = $('profile-pseudo-modal');
      if (modal && !modal.hidden) closePseudoModal();
    });
  }

  // ───────────────────────────────────────────────────────────
  // Boot
  // ───────────────────────────────────────────────────────────

  function boot() {
    if (!window.Profile) {
      // Profile devrait être chargé via cas-in-profile.js avec defer
      // S'il n'est pas là, on attend un peu et on retente
      setTimeout(boot, 50);
      return;
    }
    render();
    bindActions();
    bindPseudo();
    window.Profile.onChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
