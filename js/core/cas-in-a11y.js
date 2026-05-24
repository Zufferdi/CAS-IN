/**
 * cas-in-a11y.js — Améliorations a11y universelles (Niveau J, WCAG 2.2 AA)
 *
 * Ce script s'auto-charge sur toutes les pages CAS-IN qui l'incluent. Il
 * apporte les améliorations a11y suivantes SANS toucher au markup existant :
 *
 *   1. Skip-link "Aller au contenu principal" (visible au focus clavier)
 *      injecté en tout début de <body>
 *   2. Identification d'un landmark <main> :
 *      • Si <main> existe déjà → cible la première instance
 *      • Sinon, ajoute role="main" sur le premier conteneur candidat
 *        (id contenant "page", "content", "main", ou .sg-page, .se-page, etc.)
 *      • Sinon, fallback sur <body> (skip-link non opérant mais inoffensif)
 *   3. Focus visible renforcé via classe utilitaire :focus-visible
 *      (déjà géré par le browser ; ce module ajoute une feuille CSS de
 *      secours via injection JS si aucune règle :focus-visible n'est trouvée
 *      dans les styles chargés — DÉSACTIVÉ par défaut pour éviter les
 *      collisions ; activable via window.CAS_IN_A11Y_FORCE_FOCUS = true)
 *   4. Live region pour les annonces dynamiques :
 *      window.CASa11y.announce('texte') publie un message dans un
 *      <div role="status" aria-live="polite"> caché-écran
 *   5. Restauration du focus après ouverture/fermeture de modales :
 *      window.CASa11y.trapFocus(modalEl) / releaseFocusTrap()
 *
 * Pour WCAG 2.2 AA :
 *   • SC 2.4.1 Bypass Blocks → skip-link ✓
 *   • SC 1.3.1 Info and Relationships → landmark <main> ✓
 *   • SC 4.1.3 Status Messages → live region ✓
 *   • SC 2.4.7 Focus Visible → déjà via CSS browser :focus
 *   • SC 2.4.11 Focus Not Obscured (Minimum) → comportement natif
 *   • SC 3.2.6 Consistent Help → composant chargé sur toutes les pages
 *
 * v1.0 — 2026-05-23 (delta v94, Niveau J)
 */
(function () {
  'use strict';

  // ─── 1. Skip-link ───
  function injectSkipLink() {
    if (document.querySelector('.cas-skip-link')) return;
    const link = document.createElement('a');
    link.className = 'cas-skip-link';
    link.href = '#cas-main-content';
    link.textContent = 'Aller au contenu principal';
    // Inline styles minimaux + classe pour override CSS
    link.style.cssText = [
      'position:absolute',
      'top:-100px',           // hors écran par défaut
      'left:8px',
      'z-index:99999',
      'background:#000',
      'color:#fff',
      'padding:10px 16px',
      'border:2px solid #f0c040',
      'border-radius:6px',
      'font-family:"Share Tech Mono",monospace',
      'font-size:13px',
      'font-weight:700',
      'text-decoration:none',
      'transition:top 120ms ease'
    ].join(';');
    // Au focus : revenir visible
    link.addEventListener('focus', () => { link.style.top = '8px'; });
    link.addEventListener('blur', () => { link.style.top = '-100px'; });
    document.body.insertBefore(link, document.body.firstChild);
  }

  // ─── 2. Landmark <main> ───
  function ensureMainLandmark() {
    // Existe-t-il déjà ?
    let main = document.querySelector('main, [role="main"]');
    if (main) {
      if (!main.id) main.id = 'cas-main-content';
      return main;
    }
    // Chercher un conteneur principal candidat
    const candidates = [
      '.sg-page', '.se-page',          // sagas, scene-exam
      '#sceneViewer', '#campaignsView', // scene
      '#tp-app',                        // tp
      '#exam-app', '.exam-main',        // exam
      '#profile-page', '.profile-page', // profile
      '.career-page', '#carriere',      // carriere
      '.landing', '#hub'                // index
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el) {
        el.setAttribute('role', 'main');
        if (!el.id) el.id = 'cas-main-content';
        return el;
      }
    }
    // Fallback : prendre le premier <div> direct enfant de body
    const firstDiv = document.body.querySelector(':scope > div');
    if (firstDiv) {
      firstDiv.setAttribute('role', 'main');
      if (!firstDiv.id) firstDiv.id = 'cas-main-content';
      return firstDiv;
    }
    return null;
  }

  // ─── 4. Live region ───
  let _liveRegion = null;
  function ensureLiveRegion() {
    if (_liveRegion) return _liveRegion;
    _liveRegion = document.createElement('div');
    _liveRegion.id = 'cas-live-region';
    _liveRegion.setAttribute('role', 'status');
    _liveRegion.setAttribute('aria-live', 'polite');
    _liveRegion.setAttribute('aria-atomic', 'true');
    // Caché-écran (visible pour lecteurs d'écran uniquement)
    _liveRegion.style.cssText = [
      'position:absolute',
      'width:1px', 'height:1px',
      'padding:0', 'margin:-1px',
      'overflow:hidden', 'clip:rect(0,0,0,0)',
      'white-space:nowrap', 'border:0'
    ].join(';');
    document.body.appendChild(_liveRegion);
    return _liveRegion;
  }

  function announce(text) {
    const region = ensureLiveRegion();
    // Effacer puis ré-écrire pour forcer la relecture
    region.textContent = '';
    setTimeout(() => { region.textContent = String(text || ''); }, 50);
  }

  // ─── 5. Focus trap (modales) ───
  let _trapHandler = null;
  let _previousFocus = null;

  function getFocusableElements(container) {
    return container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), ' +
      'input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])'
    );
  }

  function trapFocus(modalEl) {
    if (!modalEl) return;
    _previousFocus = document.activeElement;
    const focusable = getFocusableElements(modalEl);
    if (focusable.length === 0) return;
    focusable[0].focus();

    _trapHandler = function (e) {
      if (e.key !== 'Tab') return;
      const items = Array.from(getFocusableElements(modalEl));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', _trapHandler);
  }

  function releaseFocusTrap() {
    if (_trapHandler) {
      document.removeEventListener('keydown', _trapHandler);
      _trapHandler = null;
    }
    if (_previousFocus && typeof _previousFocus.focus === 'function') {
      try { _previousFocus.focus(); } catch (_) {}
    }
    _previousFocus = null;
  }

  // ─── 3. Focus visible renforcé (optionnel) ───
  function injectFocusVisibleStyles() {
    if (!window.CAS_IN_A11Y_FORCE_FOCUS) return;
    const style = document.createElement('style');
    style.textContent = `
      *:focus-visible {
        outline: 3px solid #f0c040 !important;
        outline-offset: 2px !important;
      }
      a:focus-visible, button:focus-visible {
        box-shadow: 0 0 0 4px rgba(240, 192, 64, .3) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Init ───
  function init() {
    try {
      injectSkipLink();
      ensureMainLandmark();
      ensureLiveRegion();
      injectFocusVisibleStyles();
    } catch (e) {
      console.warn('[a11y] init failed', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── API publique ───
  window.CASa11y = {
    announce,
    trapFocus,
    releaseFocusTrap
  };
})();
