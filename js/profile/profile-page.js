/* ============================================================
   CAS-IN · profile-page.js (v3 — F2 + gamification)
   Logique de profile.html : peuple depuis Profile.snapshot(),
   gère la modale d'édition pseudo + sélection de track.

   v3 : rendu achievements catégorisé, verrouillés grisés avec jauge
   de progression, secrets en ???, summary "prochains défis".
   ============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function fmtNumber(n) {
    return (n || 0).toLocaleString('fr-CH').replace(/\u00A0/g, ' ');
  }
  function setText(id, txt) { const el = $(id); if (el) el.textContent = txt; }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ───────────────────────────────────────────────────────────
  // Render principal
  // ───────────────────────────────────────────────────────────

  function render() {
    if (!window.Profile) {
      console.warn('[profile-page] window.Profile pas chargé');
      return;
    }
    const snap = window.Profile.snapshot();

    // Catch-up : évalue les achievements centralisés (TP, fiches) à
    // chaque rendu pour rattraper d'anciennes activités sans bridge actif
    if (window.AchievementsCore && typeof window.AchievementsCore.evalAndUnlock === 'function') {
      window.AchievementsCore.evalAndUnlock(snap);
    }

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
    // v3 : tier visuel pour le cadre/glow par rang (0..4)
    //   idx 0..2 → 0 (stagiaire)
    //   idx 3..5 → 1 (bronze)
    //   idx 6..8 → 2 (argent)
    //   idx 9..11 → 3 (or)
    //   idx 12..14 → 4 (légende)
    const emojiEl = $('profile-rank-emoji');
    if (emojiEl) {
      const tier = Math.min(4, Math.floor((snap.rank.idx || 0) / 3));
      emojiEl.setAttribute('data-rank-tier', String(tier));
    }
    setText('profile-agent-name', snap.agent.name);
    setText('profile-rank-name', snap.rank.name);
    setText('profile-clearance', `Clearance lvl ${snap.rank.clearance}`);
    setText('profile-rank-flavor', snap.rank.flavor || '—');

    // Track label dynamique dans le sub-header
    setText('profile-dossier-label', getDossierLabel(snap.agent.track));

    // Titre équipé (sous le rang)
    renderTitleLine(snap);

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

    // Spécialité du rôle : tags qui donnent +20% XP
    renderSpecialty(snap.agent.track);

    // Stats SM-2 (révision espacée) — visible uniquement si l'utilisateur en a
    renderSM2Stats();

    // Achievements (catégorisé, avec verrouillés + jauges)
    renderAchievements(snap);
  }

  /**
   * Affiche les stats du système SM-2 (révision espacée).
   * Section masquée si aucune carte SM-2 (= utilisateur n'a pas encore utilisé le mode).
   * Lit window.getSM2Stats() exposé par quiz-app.js — si quiz-app.js pas chargé,
   * on lit directement localStorage car les clés sm2_* sont indépendantes.
   */
  function renderSM2Stats() {
    const section = $('sm2-stats-section');
    const grid = $('sm2-stats-grid');
    if (!section || !grid) return;

    // Calcul des stats inline (autonome, pas de dépendance à quiz-app.js)
    const today = new Date().toISOString().slice(0, 10);
    const weekFromNow = new Date(); weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekDate = weekFromNow.toISOString().slice(0, 10);

    const cards = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('sm2_')) continue;
      try {
        const d = JSON.parse(localStorage.getItem(k));
        if (d) cards.push(d);
      } catch {}
    }

    if (!cards.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;

    let dueToday = 0, dueWeek = 0, mature = 0, learning = 0;
    let sumEF = 0, longestInt = 0;
    cards.forEach(c => {
      if (c.due <= today) dueToday++;
      if (c.due <= weekDate) dueWeek++;
      if ((c.reps || 0) >= 3) mature++; else learning++;
      sumEF += (c.ef || 2.5);
      longestInt = Math.max(longestInt, c.interval || 0);
    });
    const avgEF = (sumEF / cards.length).toFixed(2);
    const maturePct = Math.round(100 * mature / cards.length);

    const longestLabel = longestInt < 7 ? `${longestInt}j`
      : longestInt < 30 ? `${Math.round(longestInt/7)}sem`
      : `${Math.round(longestInt/30)}mois`;

    grid.innerHTML = `
      <div class="sm2-stat ${dueToday > 0 ? 'sm2-urgent' : ''}">
        <div class="sm2-stat-num">${dueToday}</div>
        <div class="sm2-stat-lbl">Dues aujourd'hui</div>
      </div>
      <div class="sm2-stat">
        <div class="sm2-stat-num">${dueWeek}</div>
        <div class="sm2-stat-lbl">Dues cette semaine</div>
      </div>
      <div class="sm2-stat">
        <div class="sm2-stat-num">${cards.length}</div>
        <div class="sm2-stat-lbl">Total cartes</div>
      </div>
      <div class="sm2-stat">
        <div class="sm2-stat-num">${maturePct}<span style="font-size:.55em">%</span></div>
        <div class="sm2-stat-lbl">Acquises (${mature}/${cards.length})</div>
      </div>
      <div class="sm2-stat">
        <div class="sm2-stat-num">${avgEF}</div>
        <div class="sm2-stat-lbl">EF moyen <span title="Easiness Factor — plus haut = mieux mémorisé">ⓘ</span></div>
      </div>
      <div class="sm2-stat">
        <div class="sm2-stat-num">${longestLabel}</div>
        <div class="sm2-stat-lbl">Plus long intervalle</div>
      </div>
    `;
  }

  /**
   * Affiche les tags de spécialité du rôle choisi (ceux qui déclenchent
   * un bonus +20% XP). Utilise Profile.getRoleBonusTags exposé par le module.
   */
  function renderSpecialty(trackKey) {
    const wrap = $('profile-specialty');
    const tagsContainer = $('profile-specialty-tags');
    if (!wrap || !tagsContainer) return;
    if (!window.Profile || typeof window.Profile.getRoleBonusTags !== 'function') {
      wrap.hidden = true;
      return;
    }
    const tags = window.Profile.getRoleBonusTags(trackKey);
    if (!tags.length) {
      wrap.hidden = true;
      return;
    }
    const seen = new Set();
    const unique = tags.filter(t => {
      const k = String(t).toUpperCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 14);
    tagsContainer.innerHTML = '';
    unique.forEach(t => {
      const pill = document.createElement('span');
      pill.className = 'profile-specialty-tag';
      pill.textContent = t;
      tagsContainer.appendChild(pill);
    });
    wrap.hidden = false;
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

  // ───────────────────────────────────────────────────────────
  // Titre équipé (rendu + modale)
  // ───────────────────────────────────────────────────────────

  function renderTitleLine(snap) {
    const line = $('profile-title-line');
    if (!line) return;
    if (!window.ProfileTitles) {
      line.hidden = true;
      return;
    }
    const equipped = window.ProfileTitles.getEquipped(snap);
    line.hidden = false;
    if (equipped) {
      line.innerHTML = `
        <span class="profile-title-icon">★</span>
        <span class="profile-title-label">${escapeHtml(equipped.label)}</span>
        <span class="profile-title-flavor">${escapeHtml(equipped.desc)}</span>
      `;
    } else {
      line.innerHTML = `
        <span class="profile-title-icon profile-title-icon--dim">☆</span>
        <span class="profile-title-empty">Aucun titre équipé</span>
      `;
    }
  }

  function openTitleModal() {
    const modal = $('profile-title-modal');
    if (!modal || !window.Profile || !window.ProfileTitles) return;
    renderTitleModalGrid();
    modal.hidden = false;
  }

  function closeTitleModal() {
    const modal = $('profile-title-modal');
    if (modal) modal.hidden = true;
  }

  function renderTitleModalGrid() {
    const wrap = $('profile-title-grid');
    if (!wrap || !window.Profile || !window.ProfileTitles) return;
    const snap = window.Profile.snapshot();
    const equippedId = snap.preferences && snap.preferences.equippedTitle;
    const grouped = window.ProfileTitles.byCategory();
    const cats = window.ProfileTitles.CATEGORIES;

    wrap.innerHTML = '';

    // Option "Aucun titre" en premier
    const noneCard = document.createElement('button');
    noneCard.type = 'button';
    noneCard.className = 'profile-title-card profile-title-card--none';
    if (!equippedId) noneCard.classList.add('is-equipped');
    noneCard.innerHTML = `
      <span class="profile-title-card-icon">☆</span>
      <div class="profile-title-card-body">
        <div class="profile-title-card-label">Aucun titre</div>
        <div class="profile-title-card-desc">Profil sobre, sans tag.</div>
      </div>
      ${(!equippedId) ? '<span class="profile-title-card-badge">◉ Équipé</span>' : ''}
    `;
    noneCard.addEventListener('click', () => {
      window.Profile.setEquippedTitle(null);
      closeTitleModal();
    });
    wrap.appendChild(noneCard);

    cats.forEach(cat => {
      const items = grouped[cat] || [];
      if (!items.length) return;
      const unlockedItems = items.filter(t => {
        try { return !!t.check(snap); } catch (_) { return false; }
      });
      const totalCount = items.length;

      const header = document.createElement('div');
      header.className = 'profile-title-cat-header';
      header.innerHTML = `
        <span class="profile-title-cat-name">${escapeHtml(cat)}</span>
        <span class="profile-title-cat-count">${unlockedItems.length} / ${totalCount}</span>
      `;
      wrap.appendChild(header);

      items.forEach(t => {
        let unlocked = false;
        try { unlocked = !!t.check(snap); } catch (_) {}
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'profile-title-card';
        if (!unlocked) card.classList.add('is-locked');
        if (equippedId === t.id) card.classList.add('is-equipped');

        card.innerHTML = `
          <span class="profile-title-card-icon">${unlocked ? '★' : '🔒'}</span>
          <div class="profile-title-card-body">
            <div class="profile-title-card-label">${escapeHtml(t.label)}</div>
            <div class="profile-title-card-desc">${escapeHtml(t.desc)}</div>
          </div>
          ${equippedId === t.id ? '<span class="profile-title-card-badge">◉ Équipé</span>' : ''}
        `;

        if (unlocked) {
          card.addEventListener('click', () => {
            window.Profile.setEquippedTitle(t.id);
            closeTitleModal();
          });
        } else {
          card.disabled = true;
          card.title = 'Titre verrouillé — débloque l\'achievement associé.';
        }

        wrap.appendChild(card);
      });
    });
  }

  function bindTitle() {
    const btn = $('profile-edit-title');
    const close = $('profile-title-close');
    const backdrop = $('profile-title-backdrop');

    if (btn) btn.addEventListener('click', openTitleModal);
    if (close) close.addEventListener('click', closeTitleModal);
    if (backdrop) backdrop.addEventListener('click', closeTitleModal);

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const modal = $('profile-title-modal');
      if (modal && !modal.hidden) closeTitleModal();
    });
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

  // ───────────────────────────────────────────────────────────
  // Achievements : rendu catégorisé + verrouillés + secrets
  // ───────────────────────────────────────────────────────────

  function renderAchievements(snap) {
    const wrap = $('profile-achievements');
    const countEl = $('profile-ach-count');
    if (!wrap) return;

    const unlocked = new Set(Array.isArray(snap.achievements) ? snap.achievements : []);
    const meta = window.ACHIEVEMENTS_META || [];

    // Affichage du compteur "X / Y débloqués"
    if (countEl) {
      countEl.textContent = `${unlocked.size} / ${meta.length}`;
    }

    if (!meta.length) {
      wrap.innerHTML = '<div class="profile-empty">Aucun succès défini.</div>';
      return;
    }

    // Catégories ordonnées
    const categories = (window.AchievementsCore && window.AchievementsCore.CATEGORIES)
      ? window.AchievementsCore.CATEGORIES
      : null;
    const grouped = (window.AchievementsCore && typeof window.AchievementsCore.byCategory === 'function')
      ? window.AchievementsCore.byCategory()
      : groupFallback(meta);

    wrap.innerHTML = '';

    // Bandeau "Prochains défis" : 3 verrouillés les plus proches
    const nextChallenges = computeNextChallenges(meta, unlocked, snap, 3);
    if (nextChallenges.length) {
      wrap.appendChild(renderNextChallenges(nextChallenges));
    }

    // Itération par catégorie
    const order = categories || Object.keys(grouped);
    order.forEach(cat => {
      const items = grouped[cat] || [];
      if (!items.length) return;

      const unlockedInCat = items.filter(a => unlocked.has(a.id)).length;

      // Header de catégorie
      const header = document.createElement('div');
      header.className = 'profile-ach-cat-header';
      header.innerHTML = `
        <span class="profile-ach-cat-name">${escapeHtml(cat)}</span>
        <span class="profile-ach-cat-count">${unlockedInCat} / ${items.length}</span>
      `;
      wrap.appendChild(header);

      // Grille de cartes
      const grid = document.createElement('div');
      grid.className = 'profile-ach-grid';
      items.forEach(a => {
        grid.appendChild(renderAchCard(a, unlocked.has(a.id), snap));
      });
      wrap.appendChild(grid);
    });
  }

  /**
   * Fallback groupage si AchievementsCore.byCategory absent (ne devrait
   * pas arriver, mais safe).
   */
  function groupFallback(meta) {
    const out = {};
    meta.forEach(a => {
      const cat = a.category || 'Autres';
      if (!out[cat]) out[cat] = [];
      out[cat].push(a);
    });
    return out;
  }

  /**
   * Carte individuelle. Trois variantes : unlocked, locked-with-progress,
   * locked-secret-hidden.
   */
  function renderAchCard(a, isUnlocked, snap) {
    const card = document.createElement('div');
    const isSecret = !!a.secret;
    const isHiddenSecret = isSecret && !isUnlocked;

    let cls = 'profile-achievement-card';
    if (isUnlocked) cls += ' is-unlocked';
    else cls += ' is-locked';
    if (isSecret) cls += ' is-secret';
    card.className = cls;

    // Emoji
    const emoji = document.createElement('div');
    emoji.className = 'profile-achievement-emoji';
    emoji.textContent = isHiddenSecret ? '❓' : (a.emoji || '🏅');
    card.appendChild(emoji);

    // Body
    const body = document.createElement('div');
    body.className = 'profile-achievement-body';

    const name = document.createElement('div');
    name.className = 'profile-achievement-name';
    name.textContent = isHiddenSecret ? '???' : (a.name || a.id);
    body.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'profile-achievement-desc';
    desc.textContent = isHiddenSecret
      ? 'Succès secret — à découvrir…'
      : (a.desc || '—');
    body.appendChild(desc);

    // Jauge de progression (verrouillé non-secret avec progress fn)
    if (!isUnlocked && !isHiddenSecret && window.AchievementsCore) {
      const prog = window.AchievementsCore.getProgress(a.id, snap);
      if (prog && prog.target > 0) {
        const pct = Math.min(100, Math.round((prog.current / prog.target) * 100));
        const bar = document.createElement('div');
        bar.className = 'profile-achievement-bar';
        bar.innerHTML = `
          <div class="profile-achievement-bar-track">
            <div class="profile-achievement-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="profile-achievement-bar-label">${fmtNumber(prog.current)} / ${fmtNumber(prog.target)}</div>
        `;
        body.appendChild(bar);
      }
    }

    card.appendChild(body);
    return card;
  }

  /**
   * Trouve les N achievements verrouillés non-secrets dont la progression
   * est la plus avancée (en %). Permet d'afficher un "prochains défis".
   */
  function computeNextChallenges(meta, unlocked, snap, n) {
    if (!window.AchievementsCore || typeof window.AchievementsCore.getProgress !== 'function') return [];
    const candidates = [];
    meta.forEach(a => {
      if (unlocked.has(a.id)) return;
      if (a.secret) return;
      const prog = window.AchievementsCore.getProgress(a.id, snap);
      if (!prog || prog.target <= 0) return;
      if (prog.current <= 0) return; // pas encore commencé : pas un "défi en cours"
      const pct = prog.current / prog.target;
      if (pct >= 1) return; // techniquement à débloquer, prochain render le fera
      candidates.push({ a, prog, pct });
    });
    candidates.sort((x, y) => y.pct - x.pct);
    return candidates.slice(0, n);
  }

  function renderNextChallenges(list) {
    const wrap = document.createElement('div');
    wrap.className = 'profile-ach-next';
    const title = document.createElement('div');
    title.className = 'profile-ach-next-title';
    title.textContent = '⚡ Prochains défis';
    wrap.appendChild(title);
    const grid = document.createElement('div');
    grid.className = 'profile-ach-next-grid';
    list.forEach(({ a, prog, pct }) => {
      const item = document.createElement('div');
      item.className = 'profile-ach-next-item';
      const pctRound = Math.round(pct * 100);
      item.innerHTML = `
        <span class="profile-ach-next-emoji">${a.emoji || '🏅'}</span>
        <div class="profile-ach-next-body">
          <div class="profile-ach-next-name">${escapeHtml(a.name || a.id)}</div>
          <div class="profile-ach-next-desc">${escapeHtml(a.desc || '')}</div>
          <div class="profile-ach-next-bar">
            <div class="profile-ach-next-bar-fill" style="width:${pctRound}%"></div>
          </div>
          <div class="profile-ach-next-meta">${fmtNumber(prog.current)} / ${fmtNumber(prog.target)} · ${pctRound}%</div>
        </div>
      `;
      grid.appendChild(item);
    });
    wrap.appendChild(grid);
    return wrap;
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
        : "L'XP est universelle. Seul l'univers narratif change selon ton choix.");

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

  function onPickTrack(trackKey) {
    if (!window.Profile) return;
    const chooser = $('profile-track-chooser');
    const isChange = chooser && chooser.dataset.mode === 'change';
    const current = window.Profile.getTrack();

    if (isChange && current && current !== trackKey) {
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
        if (typeof window.showToast === 'function') window.showToast('profile-export-error', 'Module export non chargé.', 3000); else alert('Module export non chargé.');
      }
    });
    if (imp) imp.addEventListener('click', () => {
      if (window.CasInExport && window.CasInExport.openImportDialog) {
        window.CasInExport.openImportDialog();
      } else {
        if (typeof window.showToast === 'function') window.showToast('profile-import-error', 'Module import non chargé.', 3000); else alert('Module import non chargé.');
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
    bindTitle();
    window.Profile.onChange(render);

    // Version SW (asynchrone, silencieux si indisponible)
    if (window.CasInPwa && typeof window.CasInPwa.getVersion === 'function') {
      window.CasInPwa.getVersion().then(v => {
        const el = document.getElementById('profile-sw-version');
        if (el) el.textContent = v || 'inconnue';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
