/* ═══════════════════════════════════════════════════════════════
 * cas-in-view-toggle.js — v3.2.3
 *
 * P5 — Toggle pill Campagnes / Bibliothèque dans le navbar.
 * Remplace le gros bouton dans le hero par un pill switch intégré
 * dans la barre de navigation (à côté de l'onglet "Scènes" actif).
 *
 * S'auto-installe uniquement sur scene.html, après que le navbar
 * a été construit par cas-in-navbar.js.
 *
 * Délègue à window.CasInCampaigns.open() / openLibrary() pour
 * la logique de bascule (qui existe déjà dans scene-campaigns-v1.js).
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__casInViewToggle) return;
  window.__casInViewToggle = true;

  const LS_VIEW_PREF = 'cas_view_preference';

  function getCurrentView() {
    // Détection basée sur le hash et la préférence
    const h = window.location.hash;
    if (h === '#library' || h === '#lobby') return 'library';
    if (h.startsWith('#campaign')) return 'campaigns';
    try {
      const pref = localStorage.getItem(LS_VIEW_PREF);
      if (pref === 'library') return 'library';
    } catch (_) {}
    return 'campaigns';
  }

  function injectToggle() {
    // Trouver le bloc des liens du navbar
    const navbar = document.getElementById('cas-navbar');
    if (!navbar) return false;
    const linksBlock = navbar.querySelector('.cas-navbar__links');
    if (!linksBlock) return false;

    // Si déjà injecté, juste rafraîchir l'état
    let pill = document.getElementById('cas-view-pill');
    if (pill) {
      updateActiveButton(pill);
      return true;
    }

    // Trouver le lien "Scènes" actif et injecter le toggle juste après
    const activeLink = linksBlock.querySelector('.cas-navbar__link--active');
    if (!activeLink) return false;

    pill = document.createElement('div');
    pill.id = 'cas-view-pill';
    pill.className = 'cas-view-pill-toggle';
    pill.innerHTML = `
      <button type="button" data-view="campaigns" title="Vue par campagnes pédagogiques">Campagnes</button>
      <button type="button" data-view="library" title="Bibliothèque complète : 162 scènes">Bibliothèque</button>
    `;
    activeLink.insertAdjacentElement('afterend', pill);

    // Bind clicks
    pill.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const view = btn.dataset.view;
        switchView(view);
      });
    });

    updateActiveButton(pill);
    return true;
  }

  function updateActiveButton(pill) {
    const current = getCurrentView();
    pill.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.view === current);
    });
  }

  function switchView(view) {
    if (view === 'library') {
      if (window.CasInCampaigns && typeof window.CasInCampaigns.openLibrary === 'function') {
        window.CasInCampaigns.openLibrary();
      } else {
        try { localStorage.setItem(LS_VIEW_PREF, 'library'); } catch (_) {}
        window.location.hash = '#library';
      }
    } else {
      if (window.CasInCampaigns && typeof window.CasInCampaigns.open === 'function') {
        window.CasInCampaigns.open();
      } else {
        try { localStorage.setItem(LS_VIEW_PREF, 'campaigns'); } catch (_) {}
        window.location.hash = '#campaigns';
      }
    }
    // Rafraîchir l'état actif après bascule
    const pill = document.getElementById('cas-view-pill');
    if (pill) setTimeout(() => updateActiveButton(pill), 50);
  }

  function init() {
    // S'installe seulement sur scene.html (détection par data-page)
    const navbar = document.getElementById('cas-navbar');
    if (!navbar || navbar.dataset.page !== 'scene') {
      // Le navbar n'est pas encore là ou pas sur scene.html
      // On retry au cas où il est en cours de build
      let tries = 0;
      const retry = setInterval(() => {
        tries++;
        const nb = document.querySelector('.cas-navbar[data-page="scene"], #cas-navbar[data-page="scene"]');
        if (nb || tries > 20) {
          clearInterval(retry);
          if (nb) injectToggle();
        }
      }, 100);
      return;
    }
    // Le navbar peut être en cours de construction, on attend qu'il ait .cas-navbar__links
    let tries = 0;
    const retry = setInterval(() => {
      tries++;
      if (injectToggle() || tries > 30) {
        clearInterval(retry);
      }
    }, 100);

    // Refresh sur changement de hash
    window.addEventListener('hashchange', () => {
      const pill = document.getElementById('cas-view-pill');
      if (pill) updateActiveButton(pill);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
