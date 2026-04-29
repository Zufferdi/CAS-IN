/* ============================================================
   CAS-IN · profile-page.js (v2 — F2)
   Logique de profile.html : peuple depuis Profile.snapshot(),
   gère la modale d'édition pseudo + sélection de track.
   ============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function fmtNumber(n) {
    return (n || 0).toLocaleString('fr-CH').replace(/\u00A0/g, ' ');
  }
  function setText(id, txt) { const el = $(id); if (el) el.textContent = txt; }

  // ───────────────────────────────────────────────────────────
  // Render principal
  // ───────────────────────────────────────────────────────────

  function render() {
    if (!window.Profile) {
      console.warn('[profile-page] window.Profile pas chargé');
      return;
    }
    const snap = window.Profile.snapshot();

    // Header UTC
    const utc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    setText('profile-utc', utc);

    // Si pas de track choisi : afficher le sélecteur en plein écran
    if (!snap.agent.hasTrack) {
      showTrackChooser();
      return;
    }

    hideTrackChooser();

    // Hero
    setText('profile-rank-emoji', snap.rank.emoji);
    setText('profile-agent-name', snap.agent.name);
    setText('profile-rank-name', snap.rank.name);
    setText('profile-clearance', `Clearance lvl ${snap.rank.clearance}`);
    setText('profile-rank-flavor', snap.rank.flavor || '—');

    // Track label dynamique dans le sub-header
    setText('profile-dossier-label', getDossierLabel(snap.agent.track));

    // XP
    setText('profile-xp-big', fmtNumber(snap.xp));
    const fill = $('profile-xp-fill');
    if (fill) fill.style.width = snap.rank.pctToNext + '%';
    if (snap.rank.next) {
      setText('profile-xp-next',
        `→ ${snap.rank.next.emoji} ${snap.rank.next.name} dans ${fmtNumber(snap.rank.xpToNext)} XP`);
    } else {
      setText('profile-xp-next', 'Rang maximum atteint 🏆');
    }

    // Stats
    const streakEl = $('profile-streak-val');
    if (streakEl) {
      streakEl.innerHTML = `${snap.streak.current}<span class="profile-stat-unit">j 🔥</span>`;
    }
    setText('profile-streak-sub',
      `série max : ${snap.streak.max} jour${snap.streak.max > 1 ? 's' : ''}`);
    setText('profile-q-val', fmtNumber(snap.stats.questions));
    setText('profile-q-sub', snap.stats.questions ? '— sur le quiz' : 'Aucune réponse encore');
    setText('profile-f-val', String(snap.stats.fichesRead));
    setText('profile-f-sub', snap.stats.fichesRead ? '— mémorisées' : 'Aucune fiche lue');
    setText('profile-e-val', String(snap.stats.examsPassed));
    setText('profile-e-sub', snap.stats.examsPassed ? '— passés' : 'Aucun examen passé');

    // Ventilation
    const totalXp = Math.max(1, snap.xp);
    setText('profile-xp-quiz', `${fmtNumber(snap.xpBySource.quiz)} XP`);
    setText('profile-xp-scene', `${fmtNumber(snap.xpBySource.scene)} XP`);
    const qFill = $('profile-xp-quiz-fill');
    const sFill = $('profile-xp-scene-fill');
    if (qFill) qFill.style.width = Math.round((snap.xpBySource.quiz / totalXp) * 100) + '%';
    if (sFill) sFill.style.width = Math.round((snap.xpBySource.scene / totalXp) * 100) + '%';
    setText('profile-tp-count', `${snap.stats.tpSolved} résolu${snap.stats.tpSolved > 1 ? 's' : ''}`);
    setText('profile-fiches-count', `${snap.stats.fichesRead} lue${snap.stats.fichesRead > 1 ? 's' : ''}`);

    // Hiérarchie : ladder dynamique selon le track
    renderLadder(snap.rank.idx, snap.agent.track);

    // Achievements
    renderAchievements(snap.achievements);
  }

  function getDossierLabel(track) {
    switch (track) {
      case 'magistrate':  return 'DOSSIER MAGISTRAT';
      case 'journalist':  return 'DOSSIER JOURNALISTE';
      case 'hacker':      return 'DOSSIER HACKER';
      case 'investigator':
      default:            return 'DOSSIER ENQUÊTEUR';
    }
  }

  function renderLadder(currentIdx, trackKey) {
    const ol = $('profile-ladder');
    if (!ol || !window.Profile) return;
    ol.innerHTML = '';
    const ladder = window.Profile.getTrackLadder(trackKey);
    ladder.forEach((rank, i) => {
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

  function renderAchievements(unlocked) {
    const wrap = $('profile-achievements');
    if (!wrap) return;
    unlocked = Array.isArray(unlocked) ? unlocked : [];
    setText('profile-ach-count', String(unlocked.length));

    if (!unlocked.length) {
      wrap.innerHTML = '<div class="profile-empty">Aucun succès débloqué pour l\'instant. Continue l\'enquête.</div>';
      return;
    }

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
  // Sélecteur de track (overlay plein écran si pas de track choisi)
  // ───────────────────────────────────────────────────────────

  function showTrackChooser(isChange) {
    const chooser = $('profile-track-chooser');
    if (!chooser) return;
    chooser.hidden = false;
    chooser.dataset.mode = isChange ? 'change' : 'initial';
    setText('profile-track-chooser-title',
      isChange ? 'Changer de rôle' : 'Choisis ton rôle');
    setText('profile-track-chooser-text',
      isChange
        ? 'Ton XP reste identique, seuls les noms des grades changent.'
        : 'L\'XP est universelle. Seul l\'univers narratif change selon ton choix.');

    renderTrackOptions();
  }

  function hideTrackChooser() {
    const chooser = $('profile-track-chooser');
    if (chooser) chooser.hidden = true;
  }

  function renderTrackOptions() {
    const grid = $('profile-track-options');
    if (!grid || !window.Profile) return;
    const tracks = window.Profile.listTracks();
    const current = window.Profile.getTrack();
    grid.innerHTML = '';

    const COLORS = {
      investigator: { glow: 'rgba(56, 138, 221, .35)', border: 'rgba(56, 138, 221, .55)' },
      magistrate:   { glow: 'rgba(239, 159, 39, .35)', border: 'rgba(239, 159, 39, .55)' },
      journalist:   { glow: 'rgba(99, 153, 34, .35)', border: 'rgba(99, 153, 34, .55)' },
      hacker:       { glow: 'rgba(226, 75, 74, .35)', border: 'rgba(226, 75, 74, .55)' },
    };

    tracks.forEach(t => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'profile-track-card';
      if (t.key === current) card.classList.add('is-current');
      card.style.setProperty('--card-glow', COLORS[t.key]?.glow || 'rgba(0, 255, 65, .3)');
      card.style.setProperty('--card-border', COLORS[t.key]?.border || 'rgba(0, 255, 65, .5)');

      const icon = document.createElement('div');
      icon.className = 'profile-track-card__icon';
      icon.textContent = t.icon;

      const label = document.createElement('div');
      label.className = 'profile-track-card__label';
      label.textContent = t.label;

      const ambiance = document.createElement('div');
      ambiance.className = 'profile-track-card__ambiance';
      ambiance.textContent = t.ambiance;

      const hint = document.createElement('div');
      hint.className = 'profile-track-card__hint';
      hint.innerHTML = `Apothéose : <strong>${t.ultimateRank.emoji} ${escapeHtml(t.ultimateRank.name)}</strong>`;

      const cur = document.createElement('div');
      cur.className = 'profile-track-card__current';
      cur.textContent = (t.key === current) ? '◉ Rôle actuel' : '○ Choisir';

      card.appendChild(icon);
      card.appendChild(label);
      card.appendChild(ambiance);
      card.appendChild(hint);
      card.appendChild(cur);

      card.addEventListener('click', () => onPickTrack(t.key));
      grid.appendChild(card);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function onPickTrack(trackKey) {
    if (!window.Profile) return;
    const chooser = $('profile-track-chooser');
    const isChange = chooser && chooser.dataset.mode === 'change';
    const current = window.Profile.getTrack();

    if (isChange && current && current !== trackKey) {
      // Confirmation requise pour changer
      const ok = confirm(
        'Changer de rôle pour ' + trackKey + ' ?\n\n' +
        'Ton XP reste identique, mais tous tes grades vont changer pour le nouveau univers.\n\n' +
        'Continuer ?'
      );
      if (!ok) return;
    }

    window.Profile.setTrack(trackKey);
    hideTrackChooser();
    render();
  }

  function openTrackChange() {
    showTrackChooser(true);
  }

  // ───────────────────────────────────────────────────────────
  // Actions
  // ───────────────────────────────────────────────────────────

  function bindActions() {
    const exp = $('profile-export');
    const imp = $('profile-import');
    const rst = $('profile-reset');
    const chgTrack = $('profile-change-track');

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
      setTimeout(() => location.reload(), 100);
    });
    if (chgTrack) chgTrack.addEventListener('click', openTrackChange);
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
