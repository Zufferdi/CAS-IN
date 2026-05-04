// ═══════════════════════════════════════════════════════════════
// search-lazy.js — Lazy-load du bundle de recherche (v2.61)
//
// Avant v2.61, 3 modules de recherche étaient chargés sur CHAQUE page
// au boot, soit ~56 KB de JS + un fetch de search-index.json (599 KB
// gzippé via SW). Or la majorité des visites n'ouvrent jamais la
// recherche.
//
// Ce module se charge léger (~1 KB), écoute le raccourci Cmd+K / Ctrl+K
// et le clic sur un éventuel bouton "🔍" et, à la première interaction,
// charge dynamiquement les 3 modules réels :
//   - js/core/cas-in-search.js
//   - js/components/fiche-search.js
//   - js/components/search-modal.js
//
// Économie : 56 KB sur la première ouverture de chaque page sans
// recherche. La 2e ouverture est cachée par le SW de toute façon.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // Si le vrai modal est déjà chargé (cas où l'utilisateur a déjà cliqué),
  // ne rien faire.
  if (window.CASSearchModal || window.CASSearch) return;

  let _loading = false;
  let _loaded = false;

  function loadSearchBundle() {
    if (_loaded || _loading) return Promise.resolve();
    _loading = true;
    return new Promise((resolve, reject) => {
      const scripts = [
        'js/core/cas-in-search.js',
        'js/components/fiche-search.js',
        'js/components/search-modal.js',
      ];
      let remaining = scripts.length;
      scripts.forEach(src => {
        const s = document.createElement('script');
        s.src = src;
        s.defer = true;
        s.onload = () => {
          if (--remaining === 0) {
            _loaded = true;
            _loading = false;
            resolve();
          }
        };
        s.onerror = () => {
          _loading = false;
          reject(new Error('Failed to load ' + src));
        };
        document.head.appendChild(s);
      });
    });
  }

  // ─── Trigger : Cmd+K / Ctrl+K ──────────────────────────────
  function onKey(e) {
    // Cmd+K (mac) ou Ctrl+K (autres)
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      // Charger puis déclencher l'ouverture du modal réel
      loadSearchBundle().then(() => {
        // Une fois chargé, simuler le même Cmd+K pour ouvrir le modal
        // (search-modal.js a déjà attaché son propre handler)
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'k', metaKey: e.metaKey, ctrlKey: e.ctrlKey, bubbles: true,
        }));
      }).catch(err => {
        console.error('[search-lazy] load failed:', err);
      });
    }
  }

  // ─── Trigger : clic sur un bouton search éventuel ──────────
  function onClick(e) {
    const btn = e.target.closest('[data-action="search"], .search-trigger, #search-btn');
    if (!btn) return;
    e.preventDefault();
    loadSearchBundle().then(() => {
      // Re-déclencher le clic pour que le handler vrai s'exécute
      btn.click();
    }).catch(err => {
      console.error('[search-lazy] load failed:', err);
    });
  }

  document.addEventListener('keydown', onKey);
  document.addEventListener('click', onClick);

  // Permettre un préchargement manuel via window.preloadSearch()
  window.preloadSearch = loadSearchBundle;
})();
