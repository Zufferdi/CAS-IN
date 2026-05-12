/* ═══════════════════════════════════════════════════════════════
 * cas-in-navbar-mobile.js — v3.2.3
 *
 * Sur mobile (≤ 768px) : cache le navbar #cas-navbar au scroll vers le
 * bas, le réaffiche au scroll vers le haut. Style Twitter/Instagram.
 *
 * Pure JS + CSS transform — pas de framework, pas de dépendance.
 * Sur desktop : aucun effet (le navbar reste toujours visible).
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__casInNavbarMobile) return;
  window.__casInNavbarMobile = true;

  const MOBILE_BREAKPOINT = 768;
  const SCROLL_THRESHOLD = 8; // px minimum avant de réagir (évite jitter)
  const HIDE_AFTER_SCROLL_Y = 80; // ne se cache pas au tout début de la page

  let lastScrollY = 0;
  let lastDirection = null;
  let ticking = false;
  let navbar = null;

  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function getNavbar() {
    if (navbar && document.body.contains(navbar)) return navbar;
    navbar = document.getElementById('cas-navbar');
    return navbar;
  }

  function handleScroll() {
    if (!isMobile()) {
      // Sur desktop : toujours visible
      const nb = getNavbar();
      if (nb) nb.classList.remove('navbar-hidden-mobile');
      return;
    }
    const nb = getNavbar();
    if (!nb) return;
    
    const currentY = window.scrollY || window.pageYOffset;
    const delta = currentY - lastScrollY;

    // Seuil pour éviter les micro-mouvements
    if (Math.abs(delta) < SCROLL_THRESHOLD) return;

    // Au tout début de la page : toujours visible
    if (currentY < HIDE_AFTER_SCROLL_Y) {
      nb.classList.remove('navbar-hidden-mobile');
      lastScrollY = currentY;
      return;
    }

    const direction = delta > 0 ? 'down' : 'up';
    if (direction !== lastDirection) {
      if (direction === 'down') {
        nb.classList.add('navbar-hidden-mobile');
      } else {
        nb.classList.remove('navbar-hidden-mobile');
      }
      lastDirection = direction;
    }
    lastScrollY = currentY;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  function init() {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      // Sur résize, reset si on passe en desktop
      if (!isMobile()) {
        const nb = getNavbar();
        if (nb) nb.classList.remove('navbar-hidden-mobile');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
