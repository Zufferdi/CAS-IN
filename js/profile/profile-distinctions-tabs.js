/* ═══════════════════════════════════════════════════════════════
 * profile-distinctions-tabs.js — v2.99 (piste B1)
 *
 * Ajoute des sous-tabs DANS l'onglet "Distinctions" pour grouper les
 * 21 catégories d'achievements en 5 super-groupes plus digestes :
 *
 *   🎯 Scènes          (Progression · Spécialité · Éthique · Modes · Europe · Comportement)
 *   👤 Arcs PNJ        (32 arcs : 8 manuels + 24 auto)
 *   📚 Quiz & TP       (toutes les catégories Quiz · + TP)
 *   🎓 Fiches & Notes  (catégorie Fiches · Lecture)
 *   ⚡ Rôles & Secrets  (Enquêteur, Magistrat, Journaliste, Hacker, Secrets)
 *
 * Architecture :
 *   - Wrap autour de profile-page.js sans le modifier
 *   - Intercepte le rendu de #profile-achievements et applique un filtre
 *     CSS via attribut data-cat-group sur chaque .profile-ach-cat-header
 *     et le grid suivant
 *   - Persiste le sous-tab actif dans localStorage
 *
 * Le bloc "Prochains défis" en haut reste toujours visible (utile
 * peu importe la sous-section consultée).
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__profileDistinctionsTabs) return;
  window.__profileDistinctionsTabs = true;

  const STORAGE_KEY = 'cas_distinctions_active_tab';

  // Mapping catégorie → super-groupe
  const CAT_TO_GROUP = {
    'Quiz · Quantité': 'quiz',
    'Quiz · Séries': 'quiz',
    'Quiz · Précision': 'quiz',
    'Quiz · Combo': 'quiz',
    'Quiz · Difficile': 'quiz',
    'Quiz · Régularité': 'quiz',
    'Quiz · Spécial': 'quiz',
    'TP · Pratique': 'quiz',
    'Scènes · Progression': 'scenes',
    'Scènes · Spécialité': 'scenes',
    'Scènes · Éthique': 'scenes',
    'Scènes · Modes': 'scenes',
    'Scènes · Europe': 'scenes',
    'Scènes · Comportement': 'scenes',
    'Scènes · Arcs PNJ': 'arcs',
    'Scènes · Arcs PNJ (auto)': 'arcs',
    'Fiches · Lecture': 'fiches',
    'Rôle · Enquêteur': 'roles',
    'Rôle · Magistrat': 'roles',
    'Rôle · Journaliste': 'roles',
    'Rôle · Hacker': 'roles',
    'Secrets 🤫': 'roles',
  };

  const GROUPS = [
    { id: 'all',    label: 'Tout',          icon: '🏆' },
    { id: 'scenes', label: 'Scènes',        icon: '🎬' },
    { id: 'arcs',   label: 'Arcs PNJ',      icon: '👤' },
    { id: 'quiz',   label: 'Quiz & TP',     icon: '📚' },
    { id: 'fiches', label: 'Fiches',        icon: '🎓' },
    { id: 'roles',  label: 'Rôles & ★',     icon: '⚡' },
  ];

  let _activeGroup = 'all';

  function loadActiveGroup() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && GROUPS.some(g => g.id === saved)) _activeGroup = saved;
    } catch { /* noop */ }
  }
  function persistActiveGroup() {
    try { localStorage.setItem(STORAGE_KEY, _activeGroup); }
    catch { /* noop */ }
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]
    ));
  }

  // Compte les badges par groupe (et débloqués par groupe)
  function getGroupCounts() {
    const meta = window.ACHIEVEMENTS_META || [];
    const unlocked = new Set();
    if (window.Profile && typeof window.Profile.snapshot === 'function') {
      const snap = window.Profile.snapshot();
      (snap.achievements || []).forEach(id => unlocked.add(id));
    }
    const totals = {};
    const got = {};
    GROUPS.forEach(g => { totals[g.id] = 0; got[g.id] = 0; });
    meta.forEach(a => {
      const grp = CAT_TO_GROUP[a.category] || 'roles';  // fallback
      totals[grp]++;
      totals.all++;
      if (unlocked.has(a.id)) {
        got[grp]++;
        got.all++;
      }
    });
    return { totals, got };
  }

  // Injecte la barre de sous-tabs au-dessus de #profile-achievements
  function injectTabBar() {
    const section = document.querySelector('section[aria-label="Succès débloqués"]');
    if (!section) return null;
    let bar = document.getElementById('distinctions-subtabs');
    if (bar) return bar;
    const { totals, got } = getGroupCounts();
    bar = document.createElement('div');
    bar.id = 'distinctions-subtabs';
    bar.className = 'distinctions-subtabs';
    bar.innerHTML = GROUPS.map(g => {
      const active = g.id === _activeGroup ? ' active' : '';
      return `<button class="dst-tab${active}" data-group="${g.id}">
        <span class="dst-tab-icon">${g.icon}</span>
        <span class="dst-tab-label">${escapeHTML(g.label)}</span>
        <span class="dst-tab-count">${got[g.id]}/${totals[g.id]}</span>
      </button>`;
    }).join('');

    // Insertion : après le divider (premier .dfir-divider), avant #profile-achievements
    const ach = document.getElementById('profile-achievements');
    if (ach && ach.parentNode === section) {
      section.insertBefore(bar, ach);
    } else {
      section.appendChild(bar);
    }

    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-group]');
      if (!btn) return;
      _activeGroup = btn.dataset.group;
      persistActiveGroup();
      // Update active class
      bar.querySelectorAll('.dst-tab').forEach(b => b.classList.toggle('active', b.dataset.group === _activeGroup));
      applyFilter();
    });

    return bar;
  }

  // Applique le filtre courant au DOM existant
  function applyFilter() {
    const ach = document.getElementById('profile-achievements');
    if (!ach) return;
    // Tag chaque header + son grid avec data-group
    const children = Array.from(ach.children);
    let currentGroup = null;
    children.forEach(el => {
      if (el.classList && el.classList.contains('profile-ach-cat-header')) {
        const name = el.querySelector('.profile-ach-cat-name');
        if (name) {
          const cat = name.textContent.trim();
          currentGroup = CAT_TO_GROUP[cat] || 'roles';
          el.dataset.catGroup = currentGroup;
        }
      } else if (el.classList && el.classList.contains('profile-ach-grid')) {
        if (currentGroup) el.dataset.catGroup = currentGroup;
      }
      // .profile-next-challenges (bloc défis) reste toujours visible
    });

    // Visibilité
    children.forEach(el => {
      if (!el.dataset || !el.dataset.catGroup) return;  // pas un header/grid taggé
      const grp = el.dataset.catGroup;
      const show = (_activeGroup === 'all') || (grp === _activeGroup);
      el.style.display = show ? '' : 'none';
    });

    // Update compteurs dans la barre (les valeurs ne bougent pas, mais on
    // pourrait afficher un total dynamique selon les filtres)
    refreshTabCounts();

    // Si rien à afficher dans ce groupe, message
    let hasVisible = false;
    children.forEach(el => {
      if (el.classList && el.classList.contains('profile-ach-grid') && el.style.display !== 'none' && el.children.length > 0) {
        hasVisible = true;
      }
    });
    let emptyMsg = document.getElementById('dst-empty-msg');
    if (!hasVisible && _activeGroup !== 'all') {
      if (!emptyMsg) {
        emptyMsg = document.createElement('div');
        emptyMsg.id = 'dst-empty-msg';
        emptyMsg.className = 'dst-empty-msg';
        emptyMsg.innerHTML = `
          <div class="dst-empty-icon">🔍</div>
          <p>Aucun badge débloqué dans cette catégorie pour l'instant.</p>
          <p class="dst-empty-sub">Joue plus de scènes pour les voir apparaître.</p>
        `;
        ach.appendChild(emptyMsg);
      }
      emptyMsg.style.display = '';
    } else if (emptyMsg) {
      emptyMsg.style.display = 'none';
    }
  }

  function refreshTabCounts() {
    const bar = document.getElementById('distinctions-subtabs');
    if (!bar) return;
    const { totals, got } = getGroupCounts();
    bar.querySelectorAll('.dst-tab').forEach(btn => {
      const g = btn.dataset.group;
      const cnt = btn.querySelector('.dst-tab-count');
      if (cnt && totals[g] !== undefined) {
        cnt.textContent = `${got[g]}/${totals[g]}`;
      }
    });
  }

  // ─── Observation du DOM ────────────────────────────────────────
  // profile-page.js rebuild #profile-achievements à chaque profile-changed,
  // donc on observe ses mutations et on réapplique notre filtre.
  function install() {
    loadActiveGroup();
    injectTabBar();
    applyFilter();

    const ach = document.getElementById('profile-achievements');
    if (!ach) return;
    const obs = new MutationObserver(() => {
      clearTimeout(install._t);
      install._t = setTimeout(() => {
        injectTabBar();   // idempotent
        applyFilter();
      }, 30);
    });
    obs.observe(ach, { childList: true });

    // Aussi écouter profile-changed pour rafraîchir les counts
    window.addEventListener('profile-changed', () => {
      setTimeout(refreshTabCounts, 50);
    });
  }

  // ─── Boot ─────────────────────────────────────────────────────
  function waitAndInstall(retries = 30) {
    if (document.getElementById('profile-achievements')) {
      install();
      return;
    }
    if (retries <= 0) return;
    setTimeout(() => waitAndInstall(retries - 1), 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(waitAndInstall, 300));
  } else {
    setTimeout(waitAndInstall, 300);
  }
})();
