/* ============================================================
   CAS-IN v2.6 · quiz-ui-patch.js
   Patches UI pour les Groupes B et C :
   - Header allégé + action-row state machine (Groupe B)
   - Modes en 3 piliers + feedback gamification unifié (Groupe C)
   Chargé APRÈS quiz-app.js, ne modifie pas le coeur du JS principal.
   ============================================================ */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────
  // 1) Menu "Plus" (⋯) — handlers absents de quiz-app.js
  // ─────────────────────────────────────────────────────────
  window.toggleMoreMenu = function () {
    const menu = document.getElementById('more-menu');
    if (!menu) return;
    const wasOpen = menu.classList.contains('open');
    // ferme aussi l'autre dropdown si ouvert (mutex)
    document.getElementById('enquete-menu')?.classList.remove('open');
    if (!wasOpen) menu.classList.add('open');
    else menu.classList.remove('open');
  };

  window.closeMoreMenu = function () {
    document.getElementById('more-menu')?.classList.remove('open');
  };

  // Fermeture au clic extérieur
  document.addEventListener('click', function (e) {
    const more = document.getElementById('more-dropdown');
    if (more && !more.contains(e.target)) window.closeMoreMenu();
  });

  // Fermeture au clic sur un item
  document.addEventListener('click', function (e) {
    const item = e.target.closest('#more-menu .hdr-dropdown-item');
    if (item) {
      // léger délai pour laisser l'action se déclencher
      setTimeout(window.closeMoreMenu, 0);
    }
  });

  // ─────────────────────────────────────────────────────────
  // 2) Label son dans le menu Plus — synchroniser avec toggleSound()
  // ─────────────────────────────────────────────────────────
  // Le quiz-app.js fait `sound-btn.textContent = '🔊'` ou '🔇'.
  // Notre nouveau bouton contient maintenant un span d'icône et un span de label.
  // On wrappe la fonction toggleSound originale pour aussi mettre à jour le label.
  const origToggleSound = window.toggleSound;
  if (typeof origToggleSound === 'function') {
    window.toggleSound = function () {
      origToggleSound.apply(this, arguments);
      syncSoundLabel();
    };
  }

  function syncSoundLabel() {
    const btn = document.getElementById('sound-btn');
    const lbl = document.getElementById('sound-label');
    if (!btn || !lbl) return;
    // Le JS principal a déjà mis '🔊' ou '🔇' dans textContent — mais ça écrase nos spans.
    // On reconstruit le bouton si textContent n'a plus la structure attendue.
    const txt = btn.textContent.trim();
    if (txt === '🔊') {
      btn.innerHTML = '<span>🔊</span> <span id="sound-label">Son activé</span>';
    } else if (txt === '🔇') {
      btn.innerHTML = '<span>🔇</span> <span id="sound-label">Son coupé</span>';
    }
  }
  // Synchro initiale (au cas où quiz-app.js a mis le textContent au boot)
  document.addEventListener('DOMContentLoaded', () => setTimeout(syncSoundLabel, 50));
  // Aussi après le load complet (quiz-app.js est defer)
  window.addEventListener('load', () => setTimeout(syncSoundLabel, 100));

  // ─────────────────────────────────────────────────────────
  // 3) Action-row : griser hint-btn / skip-btn après validation
  //    (au lieu de les masquer comme le fait le JS d'origine)
  // ─────────────────────────────────────────────────────────
  // On intercepte les changements de display sur ces deux boutons et on
  // les transforme en `disabled = true/false` pour préserver leur place.
  // Au lieu de patcher chaque appel, on observe le DOM via MutationObserver.
  function setupActionRowGuard() {
    const hint = document.getElementById('hint-btn');
    const skip = document.getElementById('skip-btn');
    if (!hint || !skip) return;

    function syncDisabled(btn) {
      // Le JS principal manipule btn.style.display. Si display = 'none' → disabled = true.
      // Mais on ne veut PAS qu'ils disparaissent, donc on neutralise le display.
      const dispStyle = btn.style.display;
      if (dispStyle === 'none') {
        btn.disabled = true;
        btn.style.display = '';   // remettre visible
      } else if (dispStyle === 'block' || dispStyle === '') {
        btn.disabled = false;
      }
    }

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'style') syncDisabled(m.target);
      }
    });
    [hint, skip].forEach(btn => {
      obs.observe(btn, { attributes: true, attributeFilter: ['style'] });
      // Synchro initiale
      syncDisabled(btn);
    });
  }

  // ─────────────────────────────────────────────────────────
  // 4) Stub pour openExplModal — le bouton expl-btn a été supprimé
  //    mais le JS principal a encore une référence dormante au cas où.
  // ─────────────────────────────────────────────────────────
  if (typeof window.openExplModal !== 'function') {
    // Si pas défini (ne devrait pas arriver), no-op silencieux
    window.openExplModal = function () {
      console.debug('[quiz-ui-patch] openExplModal called but explanation now inline.');
    };
  }

  // ─────────────────────────────────────────────────────────
  // Boot
  // ─────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupActionRowGuard);
  } else {
    setupActionRowGuard();
  }

  // ═══════════════════════════════════════════════════════════════
  // GROUPE C — Phase 6 : helpers de modes (3 piliers)
  // ═══════════════════════════════════════════════════════════════

  // setMode(mode) — bascule de mode "simple" depuis le menu Modes ▾.
  // Couvre : normal, smart, bookmarks, errors, survival.
  // Pour 'sm2', 'daily', 'exam', 'mission', 'scene', 'boss' — utiliser
  // les fonctions dédiées (activateSM2Mode, startDailyChallenge, etc.).
  window.setMode = function (mode) {
    if (typeof S === 'undefined') return; // safety : quiz-app.js pas chargé
    const previous = S.mode;
    S.mode = mode;

    // Retire l'état actif des éventuels mode-btn legacy + items du menu
    document.querySelectorAll('.mode-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.mode === mode));
    document.querySelectorAll('[data-mode-target]').forEach(el =>
      el.classList.toggle('is-active', el.dataset.modeTarget === mode));

    // Reset compteurs spécifiques selon le mode (mode survival → 3 vies)
    if (mode === 'survival' && previous !== 'survival') {
      S.lives = 3;
      if (typeof updateLivesDisplay === 'function') updateLivesDisplay();
    }

    // Reconstruction du pool + premier rendu
    if (typeof buildPool === 'function') buildPool();
    if (typeof renderQuestion === 'function' && typeof getNext === 'function') {
      renderQuestion(getNext());
    }

    // Toast d'annonce du mode (passe par notify si chargé)
    const labels = {
      normal:    { icon: '🎯', text: 'Mode Libre' },
      smart:     { icon: '🧠', text: 'Mode Smart — adapté à tes erreurs' },
      bookmarks: { icon: '⭐', text: 'Favoris (' + ((S.bookmarks && S.bookmarks.size) || 0) + ')' },
      errors:    { icon: '⚠',  text: 'Erreurs à reprendre (' + ((S.errors && S.errors.length) || 0) + ')' },
      survival:  { icon: '💀', text: 'Mode Survie — 3 vies' },
    };
    const lbl = labels[mode];
    if (lbl) notify({ type: 'info', icon: lbl.icon, title: lbl.text, duration: 2200 });
  };

  // triggerBoss() — lance un boss sur un chapitre éligible (>= seuil de bonnes réponses, pas encore battu).
  window.triggerBoss = function () {
    if (typeof S === 'undefined' || typeof bossState === 'undefined' || typeof launchBoss !== 'function') {
      notify({ type: 'warning', icon: '⏳', title: 'Boss indisponible', message: 'Continue à répondre pour en débloquer.', duration: 2800 });
      return;
    }
    const threshold = (typeof BOSS_THRESHOLD !== 'undefined') ? BOSS_THRESHOLD : 20;
    const total = (typeof BOSS_QUESTIONS !== 'undefined') ? BOSS_QUESTIONS : 5;

    const eligible = [];
    if (S.byChapter && typeof ALL_Q !== 'undefined') {
      for (const ch in S.byChapter) {
        const stat = S.byChapter[ch];
        if (stat && stat.ok >= threshold && !bossState.beaten.has(ch)) {
          // vérifier qu'on a assez de questions hard
          const hardCount = ALL_Q.filter(q => q.chapter === ch && q.diff === 'hard').length;
          if (hardCount >= total) eligible.push(ch);
        }
      }
    }
    if (!eligible.length) {
      notify({
        type: 'warning', icon: '👹',
        title: 'Aucun boss disponible',
        message: 'Atteins ' + threshold + ' bonnes réponses sur un chapitre pour le débloquer.',
        duration: 4000,
      });
      return;
    }
    // Lancer un boss aléatoire parmi les éligibles
    const chapter = eligible[Math.floor(Math.random() * eligible.length)];
    bossState.active = true;
    bossState.chapter = chapter;
    const pool = ALL_Q.filter(q => q.chapter === chapter && q.diff === 'hard');
    bossState.questions = pool.sort(() => Math.random() - 0.5).slice(0, total);
    bossState.qi = 0;
    bossState.correct = 0;
    launchBoss();
  };

  // ═══════════════════════════════════════════════════════════════
  // GROUPE C — Phase 7 : système de notification unifié
  // Une seule notif visible à la fois, file d'attente.
  // Wrappe showToast, showRankUp, showAchievementPopup pour rediriger
  // les anciens appels JS vers ce système.
  // ═══════════════════════════════════════════════════════════════

  const notifyQueue = [];
  let notifyActive = false;
  let notifyTimer = null;

  function notify(opts) {
    notifyQueue.push(opts);
    if (!notifyActive) drainNotifyQueue();
  }

  function drainNotifyQueue() {
    if (!notifyQueue.length) { notifyActive = false; return; }
    notifyActive = true;
    const opts = notifyQueue.shift();
    const stream = document.getElementById('notify-stream');
    const card   = document.getElementById('notify-card');
    const iconEl = document.getElementById('notify-icon');
    const titleEl = document.getElementById('notify-title');
    const msgEl  = document.getElementById('notify-msg');
    if (!stream || !card) {
      // Fallback : alert si DOM absent (ne devrait pas arriver)
      console.warn('[notify]', opts.title, opts.message);
      drainNotifyQueue();
      return;
    }
    iconEl.textContent  = opts.icon || '';
    titleEl.textContent = opts.title || '';
    msgEl.textContent   = opts.message || '';
    msgEl.style.display = opts.message ? '' : 'none';
    // Reset class then set type
    card.className = 'notify-card notify-card--' + (opts.type || 'info');
    if (opts.flash) card.classList.add('notify-card--flash');
    // Trigger reflow then add show
    void stream.offsetWidth;
    stream.classList.add('show');

    clearTimeout(notifyTimer);
    notifyTimer = setTimeout(() => {
      stream.classList.remove('show');
      // Délai pour la transition out, puis next dans la file
      setTimeout(drainNotifyQueue, 300);
    }, opts.duration || 2200);
  }

  // Expose pour utilisation externe (autres patches, console debug)
  window.notify = notify;

  // ── Wrap showToast (les ID legacy sont remappés) ──────────────
  const _origShowToast = window.showToast;
  if (typeof _origShowToast === 'function') {
    window.showToast = function (id, msg, duration) {
      // Type inféré depuis l'ID
      let type = 'info';
      let icon = 'ℹ';
      if (id === 'streak-toast') {
        type = 'streak'; icon = '🔥';
      } else if (id === 'combo-toast') {
        type = 'combo'; icon = '⚡';
      }
      // Détecter warnings et succès en regardant le préfixe du message
      if (typeof msg === 'string') {
        if (msg.startsWith('⚠')) { type = 'warning'; icon = '⚠'; }
        else if (msg.startsWith('📋') || msg.startsWith('⭐') || msg.startsWith('☆')) { type = 'info'; icon = msg.charAt(0); }
      }
      // Strip leading emoji (déjà repris dans icon) si présent
      let title = (typeof msg === 'string') ? msg.trim() : String(msg);
      // Sépare icône emoji + reste si jamais
      const m = title.match(/^([\u{1F300}-\u{1FAFF}\u2600-\u27BF]+)\s*(.*)$/u);
      if (m && m[2]) { icon = m[1]; title = m[2]; }
      notify({ type, icon, title, duration: duration || 2200 });
    };
  }

  // ── Wrap showRankUp ───────────────────────────────────────────
  const _origShowRankUp = window.showRankUp;
  if (typeof _origShowRankUp === 'function') {
    window.showRankUp = function (rank) {
      // Garder l'effet sonore et l'update avatar via la fonction d'origine,
      // mais court-circuiter le toast DOM rankup-toast (caché par CSS).
      // On appelle la fonction d'origine sur un avatar dummy pour que les
      // side-effects (sons, particles) tournent, puis on déclenche notre notif.
      try { _origShowRankUp.call(this, rank); } catch (e) { /* nominal */ }
      notify({
        type: 'rank',
        icon: rank.emoji || '🆙',
        title: 'Nouveau rang : ' + (rank.name || ''),
        message: rank.flavor || '',
        duration: 4000,
        flash: true,
      });
    };
  }

  // ── Wrap showAchievementPopup ─────────────────────────────────
  const _origShowAchievement = window.showAchievementPopup;
  if (typeof _origShowAchievement === 'function') {
    window.showAchievementPopup = function (a) {
      // Appel d'origine pour les XP +25 et le son
      try { _origShowAchievement.call(this, a); } catch (e) { /* nominal */ }
      notify({
        type: 'achievement',
        icon: a.emoji || '🏅',
        title: 'Succès débloqué : ' + (a.name || ''),
        message: a.desc || '',
        duration: 4000,
        flash: true,
      });
    };
  }

  // ── Animation glaçon sur freeze ──────────────────────────────
  const _origUseStreakFreeze = window.useStreakFreeze;
  if (typeof _origUseStreakFreeze === 'function') {
    window.useStreakFreeze = function () {
      const result = _origUseStreakFreeze.apply(this, arguments);
      // Animer le freeze-btn (si visible)
      const fb = document.getElementById('freeze-btn');
      if (fb) {
        fb.classList.remove('freeze-anim');
        void fb.offsetWidth;
        fb.classList.add('freeze-anim');
        setTimeout(() => fb.classList.remove('freeze-anim'), 1200);
      }
      return result;
    };
  }

  // ── Halo sur la jauge XP en cas de combo élevé ──────────────
  // Le JS principal toggle .combo-x2 / .combo-active sur #question-card.
  // On observe ces classes pour propager l'effet sur la jauge.
  function setupComboHalo() {
    const card = document.getElementById('question-card');
    const gauge = document.getElementById('xp-wrap');
    if (!card || !gauge) return;
    const obs = new MutationObserver(() => {
      gauge.classList.toggle('combo-halo-x2',  card.classList.contains('combo-x2'));
      gauge.classList.toggle('combo-halo',     card.classList.contains('combo-active'));
    });
    obs.observe(card, { attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupComboHalo);
  } else {
    setupComboHalo();
  }
})();

  // ═══════════════════════════════════════════════════════════════
  // GROUPE D — UX premium : backdrop, Esc, états vides, indicateurs
  // ═══════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────
  // D.1 — Backdrop-click ferme tout overlay topmost
  //       (délégation : un seul listener au lieu de 8 handlers)
  // ─────────────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    // L'élément cliqué EST l'overlay (pas un enfant) — c'est le backdrop
    if (e.target.classList && e.target.classList.contains('overlay') && e.target.classList.contains('show')) {
      const id = e.target.id;
      if (id && typeof window.closeOverlay === 'function') {
        window.closeOverlay(id);
      }
    }
  });

  // ─────────────────────────────────────────────────────────
  // D.2 — Esc global : ferme l'overlay topmost en priorité
  //       (les handlers Esc spécifiques restent valides mais
  //        notre handler tourne avant et stopPropagation si match)
  // ─────────────────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    // Trouve l'overlay le plus en avant (z-index le plus haut, ouvert)
    const openOverlays = [...document.querySelectorAll('.overlay.show, .mode-end-overlay.is-open')];
    if (!openOverlays.length) {
      // Fallback : dropdowns ouverts ?
      const enqueteOpen = document.getElementById('enquete-menu')?.classList.contains('open');
      const moreOpen    = document.getElementById('more-menu')?.classList.contains('open');
      if (enqueteOpen)  { e.preventDefault(); window.closeEnqueteMenu?.(); return; }
      if (moreOpen)     { e.preventDefault(); window.closeMoreMenu?.();    return; }
      return;
    }
    // Le dernier ouvert est topmost
    const top = openOverlays.reduce((max, el) => {
      const z = parseInt(getComputedStyle(el).zIndex, 10) || 0;
      const zMax = parseInt(getComputedStyle(max).zIndex, 10) || 0;
      return z >= zMax ? el : max;
    }, openOverlays[0]);
    if (top && top.id) {
      e.preventDefault();
      e.stopPropagation();
      if (top.classList.contains('mode-end-overlay')) {
        // Overlays Mission/Scène : fermeture par leur API si dispo
        if (top.id === 'scene-end-overlay'   && typeof window.closeSceneEnd     === 'function') return window.closeSceneEnd();
        if (top.id === 'mission-overlay'     && typeof window.closeMissionIntro === 'function') return window.closeMissionIntro();
        if (top.id === 'mission-end-overlay' && typeof window.closeMissionEnd   === 'function') return window.closeMissionEnd();
        // Mission-phase-overlay : intentionnellement non fermable par Esc (transition)
      } else if (typeof window.closeOverlay === 'function') {
        window.closeOverlay(top.id);
      }
    }
  }, true); // capture phase pour passer avant les handlers spécifiques

  // ─────────────────────────────────────────────────────────
  // D.3 — Détection d'état vide sur la card
  //       Quand le pool est vide après un buildPool(), on affiche
  //       un message contextuel selon le mode (Favoris vide, etc.)
  // ─────────────────────────────────────────────────────────
  const EMPTY_STATES = {
    bookmarks: {
      icon:  '⭐',
      title: 'Aucun favori pour l\'instant',
      desc:  'Étoile ☆ une question pendant le quiz pour la retrouver ici.',
      actions: [
        { label: '🎯 Mode Libre', primary: true,  fn: () => window.setMode('normal') },
      ],
    },
    errors: {
      icon:  '⚠',
      title: 'Aucune erreur à reprendre',
      desc:  'Tes ratés s\'accumuleront automatiquement ici. Continue à répondre !',
      actions: [
        { label: '🎯 Mode Libre', primary: true,  fn: () => window.setMode('normal') },
      ],
    },
    sm2: {
      icon:  '🃏',
      title: 'Aucune révision due aujourd\'hui',
      desc:  'Reviens demain — l\'algorithme SM-2 espace les rappels selon ta mémoire.',
      actions: [
        { label: '🎯 Mode Libre', primary: true,  fn: () => window.setMode('normal') },
      ],
    },
    'no-filter': {
      icon:  '🔍',
      title: 'Aucun thème sélectionné',
      desc:  'Tu as désélectionné tous les thèmes ou chapitres. Choisis-en au moins un.',
      actions: [
        { label: '⚙ Ouvrir les filtres', primary: true,  fn: () => window.openSettings?.() },
      ],
    },
  };

  function showCardEmpty(stateKey) {
    const state = EMPTY_STATES[stateKey];
    if (!state) return;
    const card = document.getElementById('card-empty-state');
    if (!card) return;
    document.getElementById('card-empty-icon').textContent = state.icon;
    document.getElementById('card-empty-title').textContent = state.title;
    document.getElementById('card-empty-desc').textContent  = state.desc;
    const actionsEl = document.getElementById('card-empty-actions');
    actionsEl.innerHTML = '';
    state.actions.forEach(a => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'apply-btn apply-btn--small' + (a.primary ? '' : ' apply-btn--secondary');
      btn.textContent = a.label;
      btn.onclick = a.fn;
      actionsEl.appendChild(btn);
    });
    card.hidden = false;
    // Cacher la zone question normale
    document.getElementById('choices').style.display = 'none';
    document.getElementById('question-text').style.display = 'none';
    const multiHint = document.getElementById('multi-hint');
    if (multiHint) multiHint.style.display = 'none';
  }

  function hideCardEmpty() {
    const card = document.getElementById('card-empty-state');
    if (!card || card.hidden) return;
    card.hidden = true;
    document.getElementById('choices').style.display = '';
    document.getElementById('question-text').style.display = '';
  }

  // Wrap getNext() : si retour null/undefined ET mode connu, affiche l'état vide
  const _origGetNext = window.getNext;
  if (typeof _origGetNext === 'function') {
    window.getNext = function () {
      const q = _origGetNext.apply(this, arguments);
      if (!q && typeof S !== 'undefined') {
        // Décider quelle clé d'état vide selon le contexte
        let key = null;
        if (S.mode === 'bookmarks') key = 'bookmarks';
        else if (S.mode === 'errors') key = 'errors';
        else if (S.mode === 'sm2') key = 'sm2';
        else if (S.activeT && S.activeT.size === 0) key = 'no-filter';
        else if (S.activeC && S.activeC.size === 0) key = 'no-filter';
        if (key) showCardEmpty(key);
      } else {
        hideCardEmpty();
      }
      return q;
    };
  }

  // ─────────────────────────────────────────────────────────
  // D.4 — Pastille "mode actif" synchronisée sur le bouton Modes ▾
  // ─────────────────────────────────────────────────────────
  const MODE_LABELS = {
    normal:    null,           // mode par défaut → pas de pastille
    smart:     '🧠',
    bookmarks: '⭐',
    errors:    '⚠',
    survival:  '💀',
    sm2:       '🃏',
    daily:     '⚡',
    exam:      '📝',
    mission:   '🎯',
    scene:     '🔍',
    boss:      '👹',
  };

  function refreshActiveModePill() {
    const pill = document.getElementById('active-mode-pill');
    if (!pill || typeof S === 'undefined') return;
    const icon = MODE_LABELS[S.mode];
    if (icon) {
      pill.textContent = icon;
      pill.hidden = false;
    } else {
      pill.hidden = true;
    }
    // Marquer aussi l'item actif dans le dropdown
    document.querySelectorAll('[data-mode-target]').forEach(el => {
      el.classList.toggle('is-active', el.dataset.modeTarget === S.mode);
    });
  }

  // Hook : à chaque fois que setMode est appelée, rafraîchir
  const _origSetMode = window.setMode;
  if (typeof _origSetMode === 'function') {
    window.setMode = function (mode) {
      _origSetMode.apply(this, arguments);
      refreshActiveModePill();
    };
  }
  // Refresh au boot et après le toggle du menu
  window.addEventListener('load', () => setTimeout(refreshActiveModePill, 200));
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-mode-target]')) setTimeout(refreshActiveModePill, 50);
  });

  // ─────────────────────────────────────────────────────────
  // D.5 — Animation bookmark (☆ → ⭐)
  // ─────────────────────────────────────────────────────────
  const _origToggleBookmark = window.toggleBookmark;
  if (typeof _origToggleBookmark === 'function') {
    window.toggleBookmark = function () {
      const wasBookmarked = (typeof S !== 'undefined' && S.q && S.bookmarks && S.bookmarks.has(S.q.id));
      _origToggleBookmark.apply(this, arguments);
      const btn = document.getElementById('bookmark-btn');
      if (btn) {
        btn.classList.remove('bookmark-pop');
        void btn.offsetWidth;
        btn.classList.add('bookmark-pop');
        setTimeout(() => btn.classList.remove('bookmark-pop'), 600);
        // Petite particule étoile si on vient d'ajouter
        if (!wasBookmarked && typeof S !== 'undefined' && S.q && S.bookmarks?.has(S.q.id)) {
          spawnStarBurst(btn);
        }
      }
    };
  }

  function spawnStarBurst(originEl) {
    if (!originEl) return;
    const rect = originEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 6; i++) {
      const star = document.createElement('span');
      star.className = 'star-particle';
      star.textContent = '⭐';
      star.style.left = cx + 'px';
      star.style.top  = cy + 'px';
      const angle = (i / 6) * Math.PI * 2;
      const dist  = 40 + Math.random() * 20;
      star.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
      star.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
      document.body.appendChild(star);
      setTimeout(() => star.remove(), 700);
    }
  }

  // ─────────────────────────────────────────────────────────
  // D.6 — Indicateur Focus mode dans le menu ⋯
  // ─────────────────────────────────────────────────────────
  const _origToggleFocus = window.toggleFocusMode;
  if (typeof _origToggleFocus === 'function') {
    window.toggleFocusMode = function () {
      _origToggleFocus.apply(this, arguments);
      // Met à jour le label dans le menu Plus
      // (le JS principal toggle window._focusMode si existant, sinon on lit la classe sur body)
      setTimeout(() => {
        const isOn = document.body.classList.contains('focus-mode') ||
                     (typeof window._focusMode !== 'undefined' && window._focusMode);
        document.querySelectorAll('[onclick*="toggleFocusMode"]').forEach(el => {
          if (el.classList.contains('hdr-dropdown-item')) {
            // On reconstruit l'item pour synchroniser le label
            el.innerHTML = '<span>🎯</span> Mode Focus ' + (isOn ? '<span class="menu-item-on">ON</span>' : '(F)');
          }
        });
      }, 50);
    };
  }

  // ─────────────────────────────────────────────────────────
  // D.7 — Avatar-chip : indication visuelle de cliquabilité
  //       (purement CSS, voir quiz.css — rien à faire ici)
  // ─────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────
  // D.8 — Daily-banner : dismiss persistant pour la journée
  //       (Phase 1 v2.10 — résout le bug "✕ ne se souvient pas")
  // ─────────────────────────────────────────────────────────
  function _todayISO() {
    return new Date().toISOString().slice(0, 10);
  }
  window.dismissDailyBanner = function () {
    const el = document.getElementById('daily-banner');
    if (el) el.style.display = 'none';
    try { localStorage.setItem('dailyBannerDismissed', _todayISO()); } catch (_) {}
  };
  // Au boot : si déjà dismiss aujourd'hui, masquer la bannière sans attendre quiz-app
  (function applyPersistedDismiss() {
    function hideIfDismissed() {
      let stored = null;
      try { stored = localStorage.getItem('dailyBannerDismissed'); } catch (_) {}
      if (stored === _todayISO()) {
        const el = document.getElementById('daily-banner');
        if (el) el.style.display = 'none';
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hideIfDismissed);
    } else {
      hideIfDismissed();
    }
  })();

