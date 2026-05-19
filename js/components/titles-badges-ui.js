// ═══════════════════════════════════════════════════════════════════
// titles-badges-ui.js — UI titres portés + blasons saga (delta v44)
//
// Injection automatique :
//   - Sur profile.html : sélecteur de titres dans le profil
//   - Sur scene.html (lobby campagnes) : blasons sagas à côté du titre
//
// Dépend de window.TitlesBadges (cas-in-titles-badges.js).
// ═══════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  if (!window.TitlesBadges) {
    console.warn('[titles-badges-ui] TitlesBadges non chargé — skip');
    return;
  }
  if (window.__titlesBadgesUiLoaded) return;
  window.__titlesBadgesUiLoaded = true;

  // ═══════════════════════════════════════════════════════════════
  //  1. AFFICHAGE TITRE PORTÉ dans la navbar (toutes les pages)
  // ═══════════════════════════════════════════════════════════════
  function renderEquippedTitleInNavbar() {
    try {
      const eq = window.TitlesBadges.getEquippedTitle();
      if (!eq || eq.isDefault) return;

      // Cible : élément où afficher (au-dessus de la navbar)
      const navbar = document.getElementById('cas-navbar');
      if (!navbar) return;

      // Éviter doublon
      let existing = navbar.querySelector('.cas-navbar__title');
      if (existing) existing.remove();

      // Créer petit élément
      const titleEl = document.createElement('div');
      titleEl.className = 'cas-navbar__title';
      titleEl.title = eq.description || '';
      titleEl.innerHTML = `<span>${eq.icon}</span><span>${eq.label}</span>`;
      titleEl.style.cssText = 'position:absolute;top:6px;right:12px;font-size:10px;font-weight:600;color:var(--cyan);background:rgba(0,229,204,.08);padding:2px 7px;border-radius:4px;border:1px solid rgba(0,229,204,.25);font-family:\'JetBrains Mono\',monospace;display:flex;align-items:center;gap:3px;pointer-events:none;z-index:10';
      navbar.style.position = 'relative';
      navbar.appendChild(titleEl);
    } catch (_) {}
  }

  // ═══════════════════════════════════════════════════════════════
  //  2. SÉLECTEUR DE TITRES (sur profile.html)
  // ═══════════════════════════════════════════════════════════════
  function renderTitleSelector(containerEl) {
    if (!containerEl) return;
    const titles = window.TitlesBadges.listTitles();
    const unlocked = new Set(window.TitlesBadges.getUnlockedTitles().map(t => t.id));
    const equipped = window.TitlesBadges.getEquippedTitle();
    const equippedId = equipped ? equipped.id : null;

    const html = `
      <div style="margin-bottom:12px;font-size:13px;color:var(--muted);line-height:1.5">
        Choisis le titre qui s'affichera à côté de ton pseudo dans la navbar et les cartes de partage.
        Les titres se débloquent en complétant des sagas (mention Or) ou des achievements.
      </div>
      <div class="title-selector">
        ${titles.map(t => {
          const isUnlocked = unlocked.has(t.id);
          const isEquipped = equippedId === t.id;
          return `
            <div class="title-card"
                 data-title-id="${t.id}"
                 data-equipped="${isEquipped}"
                 data-locked="${!isUnlocked}">
              <div class="title-card__head">
                <span class="title-card__icon">${t.icon}</span>
                <span class="title-card__label">${t.label}</span>
              </div>
              <div class="title-card__desc">${t.description || ''}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    containerEl.innerHTML = html;

    // Click handlers
    containerEl.querySelectorAll('.title-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-title-id');
        const locked = card.getAttribute('data-locked') === 'true';
        if (locked) {
          if (window.showToast) window.showToast('🔒', 'Titre verrouillé', 'Complète la condition pour le débloquer');
          return;
        }
        const isCurrentlyEquipped = card.getAttribute('data-equipped') === 'true';
        // Toggle : si déjà équipé → désequipper (retour titre par défaut)
        const newId = isCurrentlyEquipped ? null : id;
        if (window.TitlesBadges.equipTitle(newId)) {
          renderTitleSelector(containerEl);
          renderEquippedTitleInNavbar();
          if (window.showToast) {
            window.showToast(
              newId ? '✨' : '↩',
              newId ? 'Titre équipé' : 'Titre retiré',
              newId ? card.querySelector('.title-card__label').textContent : '(retour au rang)'
            );
          }
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  3. AFFICHAGE BLASONS SAGA (sur scene.html cartes de campagne)
  // ═══════════════════════════════════════════════════════════════
  function renderSagaBadgeBadge(tier) {
    if (!tier) return '';
    const labels = { bronze: '🥉 Bronze', argent: '🥈 Argent', or: '🥇 Or' };
    return `<span class="saga-badge saga-badge--${tier}" title="Blason de saga ${tier}">${labels[tier]}</span>`;
  }

  /**
   * Rend la grille des blasons de saga (page profil).
   */
  function renderSagaBadgesGrid(containerEl) {
    if (!containerEl) return;
    const badges = window.TitlesBadges.getSagaBadges();

    const SAGAS_LIST = [
      { id: 'initiation', label: 'Initiation DFIR', icon: '🎓' },
      { id: 'affaire_viege', label: 'L\'Affaire de la Viège', icon: '🏔' },
      { id: 'affaire_sarine', label: 'L\'Affaire Sarine', icon: '🇫🇷' },
      { id: 'affaire_aar_frutigen', label: 'L\'Affaire Aar-Frutigen', icon: '🏛️' },
      { id: 'affaire_singine', label: 'L\'Affaire de la Singine', icon: '🧀' },
      { id: 'affaire_gemmi', label: 'L\'Affaire de la Gemmi', icon: '⛰️' },
      { id: 'affaire_prevote_moutier', label: 'L\'Affaire de la Prévôté', icon: '🪲' },
      { id: 'affaire_modele_onconet', label: 'L\'Affaire du Modèle', icon: '🧬' },
      { id: 'affaire_steve_sextortion', label: 'L\'Affaire Steve Crett', icon: '🩹' },
      { id: 'affaire_gothard', label: 'Le Tunnel du Gothard', icon: '🚂' },
      { id: 'affaire_engadine', label: 'Engadine 2027', icon: '🌨' },
      { id: 'affaire_aletsch', label: 'L\'Affaire d\'Aletsch', icon: '🚁' },
      { id: 'affaire_casino_lugano', label: 'Casino di Lugano', icon: '🎰' },
      { id: 'affaire_tom', label: 'L\'Affaire Tom', icon: '📱' },
    ];

    const labels = { bronze: '🥉 Bronze', argent: '🥈 Argent', or: '🥇 Or' };
    const html = SAGAS_LIST.map(s => {
      const tier = badges[s.id];
      const tierBadge = tier
        ? `<span class="saga-badge saga-badge--${tier}">${labels[tier]}</span>`
        : `<span style="font-size:11px;color:var(--dim,#6e7681);font-family:'JetBrains Mono',monospace">Non complétée</span>`;
      const glow = tier === 'or' ? 'box-shadow:0 0 16px rgba(240,192,64,.2);' : '';
      return `
        <div style="padding:10px 12px;border:1px solid var(--border,#30363d);border-radius:8px;background:rgba(255,255,255,${tier ? '0.04' : '0.01'});${glow}">
          <div style="font-size:13px;font-weight:600;margin-bottom:4px;color:var(--text,#e6edf3)">${s.icon} ${s.label}</div>
          <div>${tierBadge}</div>
        </div>
      `;
    }).join('');

    const completed = Object.keys(badges).length;
    const goldCount = Object.values(badges).filter(t => t === 'or').length;
    const header = `
      <div style="margin:0 0 14px;padding:8px 12px;background:rgba(0,229,204,0.05);border-left:3px solid var(--cyan,#00e5cc);border-radius:4px;font-size:12px;color:var(--muted,#8b949e)">
        <strong style="color:var(--text,#e6edf3)">${completed} / ${SAGAS_LIST.length} sagas complétées</strong>${goldCount > 0 ? ` · ${goldCount} mention${goldCount > 1 ? 's' : ''} Or 🥇` : ''}
      </div>
    `;
    containerEl.innerHTML = header + html;
  }

  /**
   * Injecte les blasons dans les cartes de campagne déjà rendues.
   * S'appuie sur les attributs data-campaign-id ou data-saga-id sur les
   * éléments DOM des cartes.
   */
  function injectSagaBadges() {
    const badges = window.TitlesBadges.getSagaBadges();

    // Mapping campagne ID → saga ID (campaigns.json utilise 'saga-tom' alors que chronology 'affaire_tom')
    const CAMP_TO_SAGA = {
      'saga-tom': 'affaire_tom',
      'saga-aletsch': 'affaire_aletsch',
      'saga-casino-lugano': 'affaire_casino_lugano',
      'saga-steve-sextortion': 'affaire_steve_sextortion',
      'saga-gothard': 'affaire_gothard',
      'saga-engadine': 'affaire_engadine',
      'saga-viege': 'affaire_viege',
      'saga-sarine': 'affaire_sarine',
      'saga-aar-frutigen': 'affaire_aar_frutigen',
      'saga-singine': 'affaire_singine',
      'saga-noirmont': 'affaire_noirmont',
      'saga-csem': 'affaire_csem',
      'saga-prevote-moutier': 'affaire_prevote_moutier',
      'saga-modele-onconet': 'affaire_modele_onconet',
      'saga-gemmi': 'affaire_gemmi',
      'saga-initiation': 'initiation',
    };

    document.querySelectorAll('[data-campaign-id], [data-saga-id]').forEach(el => {
      const campId = el.getAttribute('data-campaign-id');
      const sagaId = el.getAttribute('data-saga-id') || CAMP_TO_SAGA[campId];
      if (!sagaId) return;
      const tier = badges[sagaId];
      if (!tier) return;
      // Éviter doublons
      if (el.querySelector('.saga-badge')) return;
      // Injecter dans le titre de la carte ou un emplacement dédié
      const titleEl = el.querySelector('.campaign-title, .saga-title, .card-title, h3, h4');
      if (titleEl) {
        const span = document.createElement('span');
        span.style.marginLeft = '8px';
        span.innerHTML = renderSagaBadgeBadge(tier);
        titleEl.appendChild(span);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  AUTO-MOUNT
  // ═══════════════════════════════════════════════════════════════
  function autoMount() {
    renderEquippedTitleInNavbar();

    // Si on est sur profile.html, chercher conteneur pour le sélecteur
    const selectorContainer = document.getElementById('title-selector-container');
    if (selectorContainer) renderTitleSelector(selectorContainer);

    // Si on est sur profile.html, rendre la grille des blasons saga
    const sagaBadgesGrid = document.getElementById('saga-badges-grid');
    if (sagaBadgesGrid) renderSagaBadgesGrid(sagaBadgesGrid);

    // Si on est sur scene.html, injecter les blasons après le rendu des campagnes
    if (window.location.pathname.includes('scene.html') ||
        window.location.pathname.endsWith('scene') ||
        document.querySelector('[data-campaign-id]')) {
      // Premier essai immédiat
      injectSagaBadges();
      // Re-essai après quelques rendus (les campagnes peuvent être chargées async)
      [500, 1500, 3000].forEach(d => setTimeout(injectSagaBadges, d));

      // Observer mutations pour re-injecter sur changements de vue
      try {
        const target = document.body;
        const obs = new MutationObserver(() => {
          clearTimeout(window.__sagaBadgesDebounce);
          window.__sagaBadgesDebounce = setTimeout(injectSagaBadges, 300);
        });
        obs.observe(target, { childList: true, subtree: true });
      } catch (_) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }

  // Expose minimal API
  window.TitlesBadgesUI = {
    renderTitleSelector,
    renderEquippedTitleInNavbar,
    renderSagaBadgesGrid,
    injectSagaBadges,
  };
})();
