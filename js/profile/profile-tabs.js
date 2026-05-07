/* ═══════════════════════════════════════════════════════════════
   profile-tabs.js — v2.79
   
   Système d'onglets du dossier agent.
   Gère : navigation entre panels, persistance du dernier onglet,
   keyboard nav (← →), deep-linking via hash (#tab=relations).
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'casIn_profileLastTab';
  const VALID_TABS = ['operational', 'progression', 'relations', 'distinctions', 'notes'];

  function getStoredTab() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v && VALID_TABS.includes(v) ? v : null;
    } catch { return null; }
  }

  function storeTab(tab) {
    try { localStorage.setItem(STORAGE_KEY, tab); } catch {}
  }

  function getHashTab() {
    const m = location.hash.match(/[?&]?tab=(\w+)/);
    return m && VALID_TABS.includes(m[1]) ? m[1] : null;
  }

  function activate(tabName) {
    if (!VALID_TABS.includes(tabName)) return;

    document.querySelectorAll('.profile-tab').forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle('profile-tab--active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.tabIndex = isActive ? 0 : -1;
    });

    document.querySelectorAll('[data-tab-panel]').forEach(panel => {
      const isActive = panel.dataset.tabPanel === tabName;
      panel.classList.toggle('profile-tab-panel--active', isActive);
      if (isActive) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    storeTab(tabName);

    // Update URL hash without reload
    if (history.replaceState) {
      const newHash = '#tab=' + tabName;
      if (location.hash !== newHash) {
        history.replaceState(null, '', location.pathname + newHash);
      }
    }

    // Notifier les modules qui injectent du contenu paresseux
    document.dispatchEvent(new CustomEvent('profileTabChange', { detail: { tab: tabName } }));
  }

  function init() {
    const tabs = document.querySelectorAll('.profile-tab');
    if (!tabs.length) return;

    tabs.forEach(btn => {
      btn.addEventListener('click', () => activate(btn.dataset.tab));
    });

    // Keyboard nav (← → Home End — pattern ARIA tablist v2.59)
    const tablist = document.querySelector('.profile-tabs');
    if (tablist) {
      tablist.addEventListener('keydown', e => {
        const arr = Array.from(tabs);
        const current = arr.findIndex(b => b.classList.contains('profile-tab--active'));
        if (current < 0) return;
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          next = (current + 1) % arr.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          next = (current - 1 + arr.length) % arr.length;
        } else if (e.key === 'Home') {
          next = 0;
        } else if (e.key === 'End') {
          next = arr.length - 1;
        } else {
          return;
        }
        activate(arr[next].dataset.tab);
        arr[next].focus();
        e.preventDefault();
      });
    }

    // Tab initial : hash > storage > "operational"
    const initial = getHashTab() || getStoredTab() || 'operational';
    activate(initial);

    // Écouter changement de hash (back/forward navigation)
    window.addEventListener('hashchange', () => {
      const t = getHashTab();
      if (t) activate(t);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

  window.ProfileTabs = { activate, getCurrent: getStoredTab };
})();
