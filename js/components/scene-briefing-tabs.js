/* ═══════════════════════════════════════════════════════════════
   scene-briefing-tabs.js — v2.82
   
   Post-traitement du briefing scene : regroupe les sections existantes
   du briefing en 3 onglets logiques :
   
     MISSION   : titre + alert-box + objectifs + refs légales
     CONTEXTE  : real-case + context-text (récit narratif)
     ACTEURS   : npc-relations-banner + npc-panel (acteurs présents)
   
   Approche non-intrusive : on attend que scene-app.js ait rendu le
   briefing, puis on observe le DOM et on déplace les sections dans
   des panels avec une nav d'onglets.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'casIn_briefingLastTab';

  // Mapping des classes/sélecteurs vers les onglets
  // Premier match gagne
  const TAB_RULES = [
    { tab: 'mission',  selectors: ['.briefing-top', '.alert-box', '.objective-list', '.refs-row'] },
    { tab: 'contexte', selectors: ['.real-case-banner', '.context-text'] },
    { tab: 'acteurs',  selectors: ['.npc-relations-banner', '.npc-panel'] },
  ];

  const TABS_DEF = [
    { id: 'mission',  icon: '🎯', label: 'MISSION'  },
    { id: 'contexte', icon: '📰', label: 'CONTEXTE' },
    { id: 'acteurs',  icon: '🎭', label: 'ACTEURS'  },
  ];

  function classifyElement(el) {
    if (!el || !el.className || typeof el.className !== 'string') return null;
    for (const rule of TAB_RULES) {
      for (const sel of rule.selectors) {
        // Skip leading "." for class match
        const cls = sel.startsWith('.') ? sel.slice(1) : sel;
        if (el.classList && el.classList.contains(cls)) {
          return rule.tab;
        }
      }
    }
    return null;
  }

  function getStoredTab() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return TABS_DEF.find(t => t.id === v) ? v : null;
    } catch { return null; }
  }

  function storeTab(tabId) {
    try { localStorage.setItem(STORAGE_KEY, tabId); } catch {}
  }

  function activate(tabId, root) {
    if (!root) return;
    root.querySelectorAll('.briefing-tab').forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('briefing-tab--active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    root.querySelectorAll('[data-briefing-panel]').forEach(panel => {
      const isActive = panel.dataset.briefingPanel === tabId;
      panel.classList.toggle('briefing-panel--active', isActive);
      if (isActive) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });
    storeTab(tabId);
  }

  function transform(briefingCard) {
    // Idempotence : ne pas retransformer si déjà fait
    if (briefingCard.dataset.tabsApplied === '1') return;
    briefingCard.dataset.tabsApplied = '1';

    // 1. Récupérer tous les enfants directs sauf .briefing-actions et .seed-input-row
    //    (qui restent en bas, hors onglets)
    const children = Array.from(briefingCard.children);
    const grouped = { mission: [], contexte: [], acteurs: [] };
    const stayBottom = []; // actions, seed input
    const stayTop = [];    // svg illustration

    children.forEach(child => {
      // Garder l'illustration SVG en haut, hors onglets
      if (child.classList && child.classList.contains('svg-illustration')) {
        stayTop.push(child);
        return;
      }
      // Garder les actions et seed input en bas, hors onglets
      if (child.classList && (
        child.classList.contains('briefing-actions') ||
        child.classList.contains('seed-input-row')
      )) {
        stayBottom.push(child);
        return;
      }
      const tab = classifyElement(child);
      if (tab) {
        grouped[tab].push(child);
      } else {
        // Default : envoyer dans MISSION
        grouped.mission.push(child);
      }
    });

    // Si aucun élément Contexte/Acteurs trouvé, on n'active pas les onglets
    if (grouped.contexte.length === 0 && grouped.acteurs.length === 0) {
      delete briefingCard.dataset.tabsApplied;
      return;
    }

    // 2. Construire la nav d'onglets + les panels
    const tabsNav = document.createElement('nav');
    tabsNav.className = 'briefing-tabs';
    tabsNav.setAttribute('role', 'tablist');
    tabsNav.innerHTML = TABS_DEF.map((t, idx) => {
      const count = grouped[t.id].length;
      const disabled = count === 0;
      return `
        <button type="button"
                class="briefing-tab${idx === 0 ? ' briefing-tab--active' : ''}${disabled ? ' briefing-tab--disabled' : ''}"
                data-tab="${t.id}"
                role="tab"
                aria-selected="${idx === 0 ? 'true' : 'false'}"
                ${disabled ? 'disabled' : ''}>
          <span class="briefing-tab-icon">${t.icon}</span>
          <span class="briefing-tab-label">${t.label}</span>
        </button>`;
    }).join('');

    // 3. Vider la card et reconstituer
    briefingCard.innerHTML = '';

    // Top (illustration)
    stayTop.forEach(el => briefingCard.appendChild(el));

    // Tabs nav
    briefingCard.appendChild(tabsNav);

    // Panels
    TABS_DEF.forEach((t, idx) => {
      const panel = document.createElement('div');
      panel.className = 'briefing-panel' + (idx === 0 ? ' briefing-panel--active' : '');
      panel.dataset.briefingPanel = t.id;
      panel.setAttribute('role', 'tabpanel');
      if (idx !== 0) panel.setAttribute('hidden', '');
      grouped[t.id].forEach(el => panel.appendChild(el));
      briefingCard.appendChild(panel);
    });

    // Bottom (actions + seed)
    stayBottom.forEach(el => briefingCard.appendChild(el));

    // 4. Click handlers
    tabsNav.querySelectorAll('.briefing-tab:not(.briefing-tab--disabled)').forEach(btn => {
      btn.onclick = () => activate(btn.dataset.tab, briefingCard);
    });

    // 5. Activer le dernier onglet utilisé (sinon mission)
    const lastTab = getStoredTab();
    if (lastTab && grouped[lastTab].length > 0) {
      activate(lastTab, briefingCard);
    }
  }

  function init() {
    // Observer pour détecter quand le briefing est rendu
    const observer = new MutationObserver(() => {
      const briefingCard = document.getElementById('briefing-content');
      if (briefingCard && briefingCard.children.length > 2 && briefingCard.dataset.tabsApplied !== '1') {
        // Petit délai pour laisser scene-npcs.js injecter son panneau
        setTimeout(() => transform(briefingCard), 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Tentative initiale aussi
    setTimeout(() => {
      const briefingCard = document.getElementById('briefing-content');
      if (briefingCard && briefingCard.children.length > 0) {
        transform(briefingCard);
      }
    }, 300);

    // Et quand on revient sur le briefing (showScreen)
    window.addEventListener('scene-screen-change', e => {
      if (e.detail && e.detail.screen === 'briefing') {
        setTimeout(() => {
          const briefingCard = document.getElementById('briefing-content');
          if (briefingCard) {
            // Reset : permettre le retransform si la scène change
            delete briefingCard.dataset.tabsApplied;
            transform(briefingCard);
          }
        }, 200);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
