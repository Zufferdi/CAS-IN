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

  // v95 (I) — i18n helper avec fallback FR
  function ti18n(key, fb) {
    return (window.CASi18n && window.CASi18n.t) ? window.CASi18n.t(key, fb) : fb;
  }

  // ── Configuration des sections ─────────────────────────────
  const SECTIONS = [
    { id: 'quiz',       label: 'Quiz',     icon: '💊', href: 'quiz.html',                 rootHref: '/CAS-IN/quiz.html' },
    { id: 'scene',      label: 'Scènes',   icon: '🔍', href: 'scene.html#campaigns',      rootHref: '/CAS-IN/scene.html#campaigns' },
    { id: 'tp',         label: 'TP',       icon: '🧪', href: 'tp.html',                   rootHref: '/CAS-IN/tp.html' },
    { id: 'tutoriels',  label: 'Tutos',    icon: '🛠️', href: 'tutoriels.html',            rootHref: '/CAS-IN/tutoriels.html' },
    { id: 'fiches',     label: 'Fiches',   icon: '📄', href: 'fiches/index.html',         rootHref: '/CAS-IN/fiches/index.html' },
    { id: 'references', label: 'Réfs',     icon: '📚', href: 'references/index.html',    rootHref: '/CAS-IN/references/index.html' },
  ];

  const PAGE_TITLES = {
    quiz:         { icon: '💊', label: 'QUIZ' },
    scene:        { icon: '🔍', label: 'SCÈNES DFIR' },
    sagas:        { icon: '📖', label: 'SAGAS NARRATIVES' },
    collections:  { icon: '📚', label: 'COLLECTIONS THÉMATIQUES' },
    succes:       { icon: '🏆', label: 'SUCCÈS' },
    tp:           { icon: '🧪', label: 'TRAVAUX PRATIQUES' },
    tutoriels:    { icon: '🛠️', label: 'TUTORIELS DFIR' },
    fiches:       { icon: '📄', label: 'FICHES DE RÉVISION' },
    // v131a — Hub Apprendre (chapeaute fiches/tutoriels/références)
    apprendre:    { icon: '📚', label: 'APPRENDRE' },
    glossary:     { icon: '📚', label: 'GLOSSAIRE' },
    npcs:         { icon: '👥', label: 'PERSONNAGES' },
    tools:        { icon: '🛠', label: 'OUTILS FORENSIQUES' },
    exam:         { icon: '📝', label: 'EXAMEN BLANC SCÈNES' },
    // ── Cluster Références (v2.59) ──
    references:   { icon: '📚', label: 'RÉFÉRENCES' },
    artifacts:    { icon: '🗂', label: 'ARTEFACTS FORENSIQUES' },
    events:       { icon: '🪵', label: 'EVENT IDS' },
    mitre:        { icon: '🎯', label: 'MITRE ATT&CK' },
    legal:        { icon: '⚖️', label: 'ARTICLES JURIDIQUES' },
    'dfir-tools': { icon: '🧰', label: 'OUTILS DFIR' },
    signatures:   { icon: '🔮', label: 'MAGIC BYTES' },
    bibliography: { icon: '📖', label: 'BIBLIOGRAPHIE DFIR' },
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
    // Détection sous-dossier : explicite via data-subfolder="1",
    // rétro-compat 'fiches' (qui ne pose pas l'attribut).
    const inSubfolder = slot.dataset.subfolder === '1' || page === 'fiches';

    // Accueil (gauche)
    const homeHref = inSubfolder ? '../index.html' : 'index.html';
    const homeLink = document.createElement('a');
    homeLink.href = homeHref;
    homeLink.className = 'cas-navbar__home';
    homeLink.title = ti18n('nav.home_title', 'Retour à l\'accueil');
    homeLink.innerHTML = '<span class="cas-navbar__home-icon">←</span> ' + ti18n('nav.home', 'Accueil');
    bottom.appendChild(homeLink);

    // Titre (centre)
    const titleInfo = PAGE_TITLES[page] || { icon: '📋', label: page.toUpperCase() };
    const title = document.createElement('div');
    title.className = 'cas-navbar__title';
    const pageTitleLabel = ti18n('page_title.' + page.replace(/-/g, '_'), titleInfo.label);
    title.innerHTML = `<span class="cas-navbar__title-icon">${titleInfo.icon}</span>${pageTitleLabel}`;
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

    // v2.99 — Cluster Références : on considère les sous-pages comme actives
    // pour le bouton "Réfs" de la navbar (events, mitre, legal, dfir-tools,
    // signatures, artifacts → tous sous l'ombrelle 'references').
    const REFS_CLUSTER = new Set(['references','events','mitre','legal','dfir-tools','signatures','artifacts','bibliography']);

    SECTIONS.forEach(s => {
      // Pas de lien vers la page courante
      const link = document.createElement('a');
      const isActive = (s.id === page) ||
                       (s.id === 'references' && REFS_CLUSTER.has(page));
      
      // Depuis un sous-dossier, préfixer ../ uniformément.
      // Le lien actif sera réécrit en '#' juste après par
      // link.href = isActive ? '#' : href, donc le préfixe est
      // sans effet visible quand s.id === page.
      let href = inSubfolder ? '../' + s.href : s.href;

      link.href = isActive ? '#' : href;
      link.className = 'cas-navbar__link' + (isActive ? ' cas-navbar__link--active' : '');
      const sectionLabel = ti18n('nav.' + s.id, s.label);
      link.title = sectionLabel;
      link.innerHTML = `<span>${s.icon}</span><span>${sectionLabel}</span>`;
      if (isActive) link.setAttribute('aria-current', 'page');
      links.appendChild(link);
    });

    bottom.appendChild(links);

    // v2.92 — Bouton de bascule clair/sombre (à droite des liens)
    if (window.CasInTheme && typeof window.CasInTheme.injectButton === 'function') {
      window.CasInTheme.injectButton(bottom, { extraClass: 'cas-navbar__theme-toggle' });
    }

    // v94 (I — i18n scaffolding) — Sélecteur de langue (à côté du toggle thème)
    if (window.CASi18n && typeof window.CASi18n.setLocale === 'function') {
      const localeBtn = document.createElement('button');
      localeBtn.type = 'button';
      localeBtn.className = 'cas-navbar__locale-toggle';
      localeBtn.setAttribute('aria-label', ti18n('nav.change_lang_aria', 'Changer la langue'));
      localeBtn.title = ti18n('nav.lang_tooltip', 'Langue / Sprache / Lingua / Language');
      const cur = window.CASi18n.getLocale ? window.CASi18n.getLocale() : 'fr';
      localeBtn.textContent = cur.toUpperCase();
      // Style inline minimal (cohérence avec theme toggle)
      localeBtn.style.cssText = [
        'background:transparent',
        'border:1px solid rgba(255,255,255,.15)',
        'color:var(--text,#ccd8f0)',
        'padding:4px 8px',
        'border-radius:6px',
        'font-family:"Share Tech Mono",monospace',
        'font-size:11px',
        'font-weight:700',
        'letter-spacing:.5px',
        'cursor:pointer',
        'margin-left:6px'
      ].join(';');
      localeBtn.addEventListener('click', () => {
        const supported = window.CASi18n.getSupportedLocales();
        const idx = supported.indexOf(window.CASi18n.getLocale());
        const next = supported[(idx + 1) % supported.length];
        window.CASi18n.setLocale(next).then(() => {
          localeBtn.textContent = next.toUpperCase();
        });
      });
      bottom.appendChild(localeBtn);
    }

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

    // v95 (I) — re-rendre la navbar quand la langue change
    window.addEventListener('cas-locale-changed', function () {
      // Stratégie simple : reconstruire la navbar dans le slot
      // (le slot original a déjà été remplacé par _navbarEl — on remplace par un nouveau slot temporaire)
      if (!_navbarEl) return;
      const newSlot = document.createElement('div');
      newSlot.id = 'cas-navbar';
      newSlot.setAttribute('data-page', page);
      // Recopier les data-attrs custom du _navbarEl
      // (pas critique en pratique, le slot d'origine a transmis ses dataset à build)
      _navbarEl.parentNode.replaceChild(newSlot, _navbarEl);
      _navbarEl = null;
      build(newSlot, page);
    });
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
