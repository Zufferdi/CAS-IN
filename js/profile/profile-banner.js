/* ============================================================
   CAS-IN · profile-banner.js (F2 + titres v3)
   Mini-bandeau de profil sur quiz.html / scene.html / tp.html.
   Affiche : pseudo · titre (si équipé) · grade · XP total · streak · delta.
   Auto-refresh via Profile.onChange().
   ============================================================ */

(function () {
  'use strict';

  if (!window.Profile) {
    console.warn('[profile-banner] Profile pas chargé');
    return;
  }

  // ───────────────────────────────────────────────────────────
  // Capture de l'XP au boot pour calculer le delta de session
  // ───────────────────────────────────────────────────────────

  const _bootXp = window.Profile.getXp();
  let _currentXp = _bootXp;
  let _bannerEl = null;
  let _flashTimer = null;

  // ───────────────────────────────────────────────────────────
  // Création du bandeau (appelée si le slot #profile-banner existe)
  // ───────────────────────────────────────────────────────────

  function ensureBanner() {
    let host = document.getElementById('profile-banner');
    if (!host) {
      // Pas de slot dans la page → on injecte un wrapper en haut du body
      host = document.createElement('div');
      host.id = 'profile-banner';
      host.className = 'profile-banner';
      document.body.insertBefore(host, document.body.firstChild);
    } else {
      host.classList.add('profile-banner');
    }
    _bannerEl = host;
    render();
  }

  function fmtNumber(n) {
    return (n || 0).toLocaleString('fr-CH').replace(/\u00A0/g, ' ');
  }

  function render() {
    if (!_bannerEl) return;
    const snap = window.Profile.snapshot();
    _currentXp = snap.xp;
    const delta = _currentXp - _bootXp;

    const trackIcon = (function () {
      switch (snap.agent.track) {
        case 'magistrate':  return '⚖️';
        case 'journalist':  return '📰';
        case 'hacker':      return '⌨️';
        case 'investigator':
        default:            return '🕵';
      }
    })();

    // Titre équipé : récupéré via ProfileTitles si dispo
    let equippedTitle = null;
    if (window.ProfileTitles && typeof window.ProfileTitles.getEquipped === 'function') {
      equippedTitle = window.ProfileTitles.getEquipped(snap);
    }

    _bannerEl.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'profile-banner__inner';

    // Bloc gauche : identité (pseudo + titre + rang)
    const left = document.createElement('a');
    left.href = 'profile.html';
    left.className = 'profile-banner__id';
    left.title = 'Voir mon dossier';

    const titleHtml = equippedTitle
      ? `<span class="profile-banner__title" title="${escapeHtml(equippedTitle.desc)}">★ ${escapeHtml(equippedTitle.label)}</span><span class="profile-banner__sep">·</span>`
      : '';

    left.innerHTML = `
      <span class="profile-banner__icon">${trackIcon}</span>
      <span class="profile-banner__name">${escapeHtml(snap.agent.name)}</span>
      <span class="profile-banner__sep">·</span>
      ${titleHtml}
      <span class="profile-banner__rank">${snap.rank.emoji} ${escapeHtml(snap.rank.name)}</span>
    `;
    inner.appendChild(left);

    // Bloc droit : XP / streak / delta
    const right = document.createElement('div');
    right.className = 'profile-banner__stats';
    right.innerHTML = `
      <span class="profile-banner__xp">${fmtNumber(snap.xp)} XP</span>
      <span class="profile-banner__sep">·</span>
      <span class="profile-banner__streak">${snap.streak.current}j 🔥</span>
      ${delta > 0 ? `<span class="profile-banner__delta" id="profile-banner-delta">+${fmtNumber(delta)} cette session</span>` : ''}
    `;
    inner.appendChild(right);

    _bannerEl.appendChild(inner);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function flashDelta() {
    const el = document.getElementById('profile-banner-delta');
    if (!el) return;
    el.classList.remove('profile-banner__delta--flash');
    void el.offsetWidth; // reflow
    el.classList.add('profile-banner__delta--flash');
    if (_flashTimer) clearTimeout(_flashTimer);
    _flashTimer = setTimeout(() => {
      el.classList.remove('profile-banner__delta--flash');
    }, 1200);
  }

  // ───────────────────────────────────────────────────────────
  // Boot
  // ───────────────────────────────────────────────────────────

  function boot() {
    ensureBanner();
    window.Profile.onChange(reason => {
      const before = _currentXp;
      render();
      if (_currentXp > before) flashDelta();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
