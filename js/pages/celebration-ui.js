// ═══════════════════════════════════════════════════════════════
// celebration-ui.js — Mini-overlay de célébration (v2.56 POLISH/EXTEND)
//
// Affiche un overlay éphémère (~3s) pour célébrer une réussite
// gamification : quête complétée, first-clear, mastery upgrade,
// arc PNJ complété, etc.
//
// API :
//   window.Celebration.show({ icon, title, subtitle, xp })
//
// Plusieurs célébrations en file d'attente sont affichées séquentiellement
// (1 à la fois). L'overlay disparaît automatiquement après ~2.8s.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const QUEUE = [];
  let _showing = false;
  let _root = null;

  function ensureRoot() {
    if (_root && document.body.contains(_root)) return _root;
    _root = document.createElement('div');
    _root.id = 'celebration-root';
    _root.setAttribute('aria-live', 'polite');
    document.body.appendChild(_root);
    return _root;
  }

  function show(options) {
    QUEUE.push(options || {});
    if (!_showing) processQueue();
  }

  function processQueue() {
    if (QUEUE.length === 0) {
      _showing = false;
      return;
    }
    _showing = true;
    const opt = QUEUE.shift();
    renderOne(opt, () => {
      // Petit délai entre célébrations consécutives pour éviter la confusion
      setTimeout(processQueue, 200);
    });
  }

  function renderOne(opt, done) {
    const root = ensureRoot();
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.innerHTML = `
      <div class="celebration-card">
        <div class="celebration-icon">${opt.icon || '🎉'}</div>
        <div class="celebration-title">${opt.title || 'Bravo !'}</div>
        ${opt.subtitle ? `<div class="celebration-subtitle">${opt.subtitle}</div>` : ''}
        ${typeof opt.xp === 'number' && opt.xp > 0 ? `<div class="celebration-xp">+${opt.xp} XP</div>` : ''}
      </div>
    `;
    root.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => overlay.classList.add('is-active'));

    // Disparition après 2.8s
    setTimeout(() => {
      overlay.classList.remove('is-active');
      overlay.classList.add('is-leaving');
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (typeof done === 'function') done();
      }, 350);
    }, 2800);
  }

  // ── Auto-hooks pour les événements gamification ──
  window.addEventListener('quests-changed', (e) => {
    const detail = e && e.detail;
    if (!detail || !Array.isArray(detail.newlyCompleted)) return;
    detail.newlyCompleted.forEach(q => {
      show({
        icon: q.icon || '🎯',
        title: 'Quête complétée !',
        subtitle: q.title,
        xp: q.reward,
      });
    });
  });

  // v2.60 — 1re activation du dossier : émis par cas-in-profile.js à la
  // 1re XP gagnée. Cérémonie narrative spéciale (tampon « Approved by
  // R.R aka Banzaï ») jouée AVANT le toast XP générique, parce qu'elle
  // est plus rare et plus signifiante. show() étant queué, l'ordre est
  // garanti même si plusieurs événements partent dans la même frame.
  window.addEventListener('dossier-activated', () => {
    show({
      icon: '🗂️',
      title: 'Dossier activé',
      subtitle: 'Approuvé par R.R aka Banzaï',
    });
  });

  window.Celebration = { show };
})();
