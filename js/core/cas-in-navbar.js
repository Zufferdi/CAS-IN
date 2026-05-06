/* ═══════════════════════════════════════════════════════════════
   cas-in-navbar.js — v2.77
   
   Module de navbar unifiée pour quiz · scene · tp · fiches.
   
   Usage : inclure ce script + cas-in-navbar.css dans chaque page.
   Injecter un slot <div id="cas-navbar" data-page="quiz"></div>
   avant le <header> existant.
   
   data-page : "quiz" | "scene" | "tp" | "fiches"
   
   La navbar :
     Ligne 1 (top) : 🕵 BORIS V.A. · ENQUÊTEUR     2496 XP · 4j🔥 · +32 XP
     Ligne 2 (nav) : ← Accueil  |  QUIZ  |  [Scènes] [TP] [Fiches]
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Configuration des sections ─────────────────────────────
  const SECTIONS = [
    { id: 'quiz',   label: 'Quiz',    icon: '💊', href: 'quiz.html',          rootHref: '/CAS-IN/quiz.html' },
    { id: 'scene',  label: 'Scènes',  icon: '🔍', href: 'scene.html',         rootHref: '/CAS-IN/scene.html' },
    { id: 'tp',     label: 'TP',      icon: '🧪', href: 'tp.html',            rootHref: '/CAS-IN/tp.html' },
    { id: 'fiches', label: 'Fiches',  icon: '📄', href: 'fiches/index.html',  rootHref: '/CAS-IN/fiches/index.html' },
  ];

  const PAGE_TITLES = {
    quiz:     { icon: '💊', label: 'QUIZ' },
    scene:    { icon: '🔍', label: 'SCÈNES DFIR' },
    tp:       { icon: '🧪', label: 'TRAVAUX PRATIQUES' },
    fiches:   { icon: '📄', label: 'FICHES DE RÉVISION' },
    glossary: { icon: '📚', label: 'GLOSSAIRE' },
    npcs:     { icon: '👥', label: 'PERSONNAGES' },
    tools:    { icon: '🛠', label: 'OUTILS FORENSIQUES' },
    exam:     { icon: '📝', label: 'EXAMEN BLANC' },
  };

  // ── Helpers ────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function fmtNum(n) {
    return (n || 0).toLocaleString('fr-CH').replace(/\u00A0/g, ' ');
  }

  const TRACK_ICONS = {
    investigator: '🕵', magistrate: '⚖️', journalist: '📰', hacker: '⌨️',
  };

  // ── Récupération des données Profile ───────────────────────
  function getProfileData() {
    if (window.Profile && typeof window.Profile.snapshot === 'function') {
      const snap = window.Profile.snapshot();
      return {
        name:   snap.agent?.name || 'Enquêteur',
        track:  snap.agent?.track || 'investigator',
        rank:   snap.rank?.emoji ? snap.rank.emoji + ' ' + snap.rank.name : '—',
        xp:     snap.xp || 0,
        streak: snap.streak?.current || 0,
        bootXp: _bootXp,
      };
    }
    // Fallback localStorage brut
    function lsGet(k, fb) { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch { return fb; } }
    return {
      name:   lsGet('casIn_agentPseudo', 'Enquêteur'),
      track:  'investigator',
      rank:   '—',
      xp:     lsGet('xp', 0),
      streak: lsGet('dayStreak', 0),
      bootXp: _bootXp,
    };
  }

  // ── State ──────────────────────────────────────────────────
  let _bootXp = 0;
  let _navbarEl = null;
  let _topEl = null;
  let _currentPage = 'quiz';
  let _flashTimer = null;

  // ── Build ──────────────────────────────────────────────────
  function build(slot, page) {
    _currentPage = page || 'quiz';
    const noIdentity = slot.dataset.noIdentity === '1';

    const navbar = document.createElement('div');
    navbar.className = 'cas-navbar' + (noIdentity ? ' cas-navbar--compact' : '');
    navbar.setAttribute('role', 'navigation');
    navbar.setAttribute('aria-label', 'Navigation CAS-IN');
    _navbarEl = navbar;

    // Ligne 1 : identité (sauf si data-no-identity)
    let top = null;
    if (!noIdentity) {
      top = document.createElement('div');
      top.className = 'cas-navbar__top';
      _topEl = top;
    }

    // Ligne 2 : nav
    const bottom = document.createElement('div');
    bottom.className = 'cas-navbar__bottom';

    // Accueil (gauche)
    const homeHref = page === 'fiches' ? '../index.html' : 'index.html';
    const homeLink = document.createElement('a');
    homeLink.href = homeHref;
    homeLink.className = 'cas-navbar__home';
    homeLink.title = 'Retour à l\'accueil';
    homeLink.innerHTML = '<span class="cas-navbar__home-icon">←</span> Accueil';
    bottom.appendChild(homeLink);

    // Titre (centre)
    const titleInfo = PAGE_TITLES[page] || { icon: '📋', label: page.toUpperCase() };
    const title = document.createElement('div');
    title.className = 'cas-navbar__title';
    title.innerHTML = `<span class="cas-navbar__title-icon">${titleInfo.icon}</span>${titleInfo.label}`;
    bottom.appendChild(title);

    // v2.79 — Tools : si la page expose un template <template id="cas-navbar-tools">,
    // on injecte ces outils (Filtres, Modes, etc.) dans la barre.
    if (slot.dataset.hasTools === '1') {
      const tplTools = document.getElementById('cas-navbar-tools');
      if (tplTools && tplTools.content) {
        const toolsWrap = document.createElement('div');
        toolsWrap.className = 'cas-navbar__tools';
        toolsWrap.appendChild(tplTools.content.cloneNode(true));
        bottom.appendChild(toolsWrap);
        // Retirer le template du DOM (déjà cloné)
        tplTools.remove();
      }
    }

    // Séparateur
    const sep = document.createElement('div');
    sep.className = 'cas-navbar__links-sep';
    bottom.appendChild(sep);

    // Liens autres sections (droite)
    const links = document.createElement('div');
    links.className = 'cas-navbar__links';

    SECTIONS.forEach(s => {
      // Pas de lien vers la page courante
      const link = document.createElement('a');
      const isActive = s.id === page;
      
      // Gérer le href relatif depuis fiches/
      let href = s.href;
      if (page === 'fiches' && s.id !== 'fiches') {
        href = '../' + s.href;
      }

      link.href = isActive ? '#' : href;
      link.className = 'cas-navbar__link' + (isActive ? ' cas-navbar__link--active' : '');
      link.title = s.label;
      link.innerHTML = `<span>${s.icon}</span><span>${s.label}</span>`;
      if (isActive) link.setAttribute('aria-current', 'page');
      links.appendChild(link);
    });

    bottom.appendChild(links);

    if (top) navbar.appendChild(top);
    navbar.appendChild(bottom);

    // Remplacer le slot
    slot.parentNode.replaceChild(navbar, slot);

    // Render initial de la ligne identité
    if (top) renderTop();
  }

  // ── Rendu ligne identité ───────────────────────────────────
  function renderTop() {
    if (!_topEl) return;
    const d = getProfileData();
    const delta = d.xp - d.bootXp;

    const trackIcon = TRACK_ICONS[d.track] || '🕵';

    _topEl.innerHTML = `
      <a href="${_currentPage === 'fiches' ? '../profile.html' : 'profile.html'}"
         class="cas-navbar__identity" title="Voir mon dossier complet">
        <span class="cas-navbar__track-icon">${trackIcon}</span>
        <span class="cas-navbar__agent">${escapeHtml(d.name)}</span>
        <span class="cas-navbar__sep">·</span>
        <span class="cas-navbar__rank">${escapeHtml(d.rank)}</span>
      </a>
      <div class="cas-navbar__stats">
        <span class="cas-navbar__xp">${fmtNum(d.xp)} XP</span>
        <span class="cas-navbar__sep">·</span>
        <span class="cas-navbar__streak">${d.streak}j 🔥</span>
        ${delta > 0
          ? `<span class="cas-navbar__delta" id="casnav-delta">+${fmtNum(delta)}</span>`
          : ''}
      </div>`;
  }

  // ── Flash delta quand XP augmente ─────────────────────────
  function flashDelta() {
    const el = document.getElementById('casnav-delta');
    if (!el) return;
    el.classList.add('cas-navbar__delta--flash');
    clearTimeout(_flashTimer);
    _flashTimer = setTimeout(() => el.classList.remove('cas-navbar__delta--flash'), 700);
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    const slot = document.getElementById('cas-navbar');
    if (!slot) return;

    const page = slot.dataset.page || 'quiz';

    // Capturer l'XP au boot
    if (window.Profile && typeof window.Profile.getXp === 'function') {
      _bootXp = window.Profile.getXp();
    } else {
      try { _bootXp = JSON.parse(localStorage.getItem('xp') || '0'); } catch { _bootXp = 0; }
    }

    build(slot, page);

    // S'abonner aux changements Profile si disponible
    if (window.Profile && typeof window.Profile.onChange === 'function') {
      window.Profile.onChange(() => {
        renderTop();
        flashDelta();
      });
    }
  }

  // ── Auto-init ──────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

  // API publique
  window.CasNavbar = { refresh: renderTop, flash: flashDelta };

})();
