/* ═══════════════════════════════════════════════════════════════
   cas-in-theme-toggle.js — v2.92
   ───────────────────────────────────────────────────────────────
   Bascule clair/sombre persistée côté utilisateur.

   - Lit / écrit la préférence dans localStorage sous 'cas_theme_pref'
     ('light' | 'dark'). Tant que la préférence est posée, elle prime
     sur prefers-color-scheme du système (cf. cas-in-utils.js).
   - Expose window.CasInTheme = { set, toggle, getCurrent, injectButton }.
   - Le bouton injecté porte la classe .cas-theme-toggle ; il met à jour
     son icône (☀ / ☾) à chaque changement de thème.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const PREF_KEY = 'cas_theme_pref';

  function readPref() {
    try { return localStorage.getItem(PREF_KEY); } catch (_) { return null; }
  }

  function writePref(theme) {
    try { localStorage.setItem(PREF_KEY, theme); } catch (_) {}
  }

  function getCurrent() {
    // Lit ce qui est effectivement appliqué sur <html>.
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function set(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    const root = document.documentElement;
    // Note : on pose toujours data-theme (light OU dark) pour neutraliser
    // le @media (prefers-color-scheme: light) qui ne s'applique que via
    // :where(html:not([data-theme])). Sinon, sur un OS clair, retirer
    // data-theme ferait re-basculer la page en clair.
    root.setAttribute('data-theme', theme);
    delete root.dataset.themeAuto;
    writePref(theme);
    refreshButtons();
    document.dispatchEvent(new CustomEvent('casThemeChange', { detail: { theme } }));
  }

  function toggle() {
    set(getCurrent() === 'light' ? 'dark' : 'light');
  }

  // ─────────────────────────────────────────────────────────────
  // BOUTON
  // ─────────────────────────────────────────────────────────────

  function refreshButtons() {
    const cur = getCurrent();
    const icon = cur === 'light' ? '☾' : '☀';
    const label = cur === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair';
    document.querySelectorAll('.cas-theme-toggle').forEach(btn => {
      btn.setAttribute('aria-label', label);
      btn.title = label;
      // Ne réécrit que le glyphe pour ne pas perdre les éléments enfants
      // éventuels (badge, etc.) — ici on a un simple span.
      const iconEl = btn.querySelector('.cas-theme-toggle__icon');
      if (iconEl) iconEl.textContent = icon;
      else btn.textContent = icon;
    });
  }

  function makeButton(opts) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cas-theme-toggle' + (opts && opts.extraClass ? ' ' + opts.extraClass : '');
    const span = document.createElement('span');
    span.className = 'cas-theme-toggle__icon';
    span.textContent = getCurrent() === 'light' ? '☾' : '☀';
    btn.appendChild(span);
    btn.addEventListener('click', toggle);
    return btn;
  }

  function injectButton(parent, opts) {
    if (!parent) return null;
    // Eviter les doublons si appelé deux fois
    const existing = parent.querySelector(':scope > .cas-theme-toggle');
    if (existing) return existing;
    const btn = makeButton(opts || {});
    if (opts && opts.position === 'prepend') {
      parent.insertBefore(btn, parent.firstChild);
    } else {
      parent.appendChild(btn);
    }
    refreshButtons();
    return btn;
  }

  // ─────────────────────────────────────────────────────────────
  // RESET CHOIX MANUEL (utilitaire pour debug / future UI)
  // ─────────────────────────────────────────────────────────────
  function resetToAuto() {
    try { localStorage.removeItem(PREF_KEY); } catch (_) {}
    if (typeof window.__casBootstrapColorScheme === 'function') {
      window.__casBootstrapColorScheme();
    }
    refreshButtons();
  }

  // Refresh quand DOM prêt (boutons éventuellement déjà injectés inline).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshButtons);
  } else {
    refreshButtons();
  }

  window.CasInTheme = {
    set, toggle, getCurrent, injectButton, resetToAuto,
  };
})();
