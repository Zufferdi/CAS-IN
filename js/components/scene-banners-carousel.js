/* ═══════════════════════════════════════════════════════════════
   scene-banners-carousel.js — v2.80
   
   Compresse les 4 bandeaux (streak, nocrit, path, challenge) en
   un seul carrousel rotatif. Détecte automatiquement les bandeaux
   actifs (display !== none) et les fait défiler.
   
   - Rotation auto toutes les 6 secondes
   - Dots de pagination cliquables
   - Bouton − pour réduire (préférence persistée)
   - Si aucun bandeau actif → carrousel masqué
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const ROTATE_MS = 6000;
  const STORAGE_KEY = 'casIn_lobbyCarouselCollapsed';

  let _slides = [];
  let _currentIdx = 0;
  let _rotateTimer = null;
  let _container = null;
  let _track = null;
  let _dotsWrap = null;
  let _toggleBtn = null;

  function ls(key, fb) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fb; } catch { return fb; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  function getActiveSlides() {
    const all = Array.from(_track.querySelectorAll('.lc-slide'));
    return all.filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && el.style.display !== 'none';
    });
  }

  function updateUI() {
    _slides = getActiveSlides();

    if (_slides.length === 0) {
      _container.style.display = 'none';
      stopRotation();
      return;
    }

    _container.style.display = 'block';

    // Si une seule slide active : pas de carrousel, juste l'afficher
    if (_slides.length === 1) {
      // Cacher dots + reset transform
      _dotsWrap.innerHTML = '';
      _track.style.transform = 'translateX(0)';
      stopRotation();
      // Une seule slide visible
      _track.querySelectorAll('.lc-slide').forEach(s => {
        s.classList.toggle('lc-active', s === _slides[0]);
      });
      return;
    }

    // Plusieurs slides : carrousel avec dots
    _dotsWrap.innerHTML = '';
    _slides.forEach((s, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'lc-dot' + (i === _currentIdx ? ' lc-dot--active' : '');
      dot.setAttribute('aria-label', `Bandeau ${i + 1} / ${_slides.length}`);
      dot.onclick = () => {
        showSlide(i);
        restartRotation();
      };
      _dotsWrap.appendChild(dot);
    });

    showSlide(_currentIdx >= _slides.length ? 0 : _currentIdx);
    startRotation();
  }

  function showSlide(idx) {
    if (!_slides.length) return;
    if (idx < 0) idx = _slides.length - 1;
    if (idx >= _slides.length) idx = 0;
    _currentIdx = idx;

    _track.querySelectorAll('.lc-slide').forEach(s => {
      s.classList.remove('lc-active');
    });
    _slides[idx].classList.add('lc-active');

    Array.from(_dotsWrap.children).forEach((d, i) => {
      d.classList.toggle('lc-dot--active', i === idx);
    });
  }

  function next() {
    showSlide(_currentIdx + 1);
  }

  function startRotation() {
    stopRotation();
    if (_slides.length > 1) {
      _rotateTimer = setInterval(next, ROTATE_MS);
    }
  }

  function stopRotation() {
    if (_rotateTimer) {
      clearInterval(_rotateTimer);
      _rotateTimer = null;
    }
  }

  function restartRotation() {
    stopRotation();
    startRotation();
  }

  function toggleCollapse() {
    const collapsed = _container.classList.toggle('lc-collapsed');
    lsSet(STORAGE_KEY, collapsed);
    if (_toggleBtn) {
      _toggleBtn.textContent = collapsed ? '+' : '−';
      _toggleBtn.setAttribute('aria-label', collapsed ? 'Déplier' : 'Réduire');
      _toggleBtn.title = collapsed ? 'Déplier' : 'Réduire';
    }
    if (collapsed) stopRotation();
    else startRotation();
  }

  function init() {
    _container = document.getElementById('lobby-carousel');
    if (!_container) return;
    _track = document.getElementById('lobby-carousel-track');
    _dotsWrap = document.getElementById('lobby-carousel-dots');
    _toggleBtn = document.getElementById('lobby-carousel-toggle');

    if (!_track) return;

    // Restaurer l'état collapsed
    if (ls(STORAGE_KEY, false)) {
      _container.classList.add('lc-collapsed');
      if (_toggleBtn) _toggleBtn.textContent = '+';
    }

    if (_toggleBtn) _toggleBtn.onclick = toggleCollapse;

    // Hover : pause rotation
    _container.addEventListener('mouseenter', stopRotation);
    _container.addEventListener('mouseleave', () => {
      if (!_container.classList.contains('lc-collapsed')) startRotation();
    });

    // Première mise à jour
    updateUI();

    // MutationObserver pour détecter quand un bandeau change de display
    const observer = new MutationObserver(() => {
      updateUI();
    });
    observer.observe(_track, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: true,
    });

    // Re-check toutes les 2s pendant les 10 premières secondes (pour attraper
    // les bandeaux activés tardivement par les renderXxxBanner())
    let checks = 0;
    const periodicCheck = setInterval(() => {
      updateUI();
      if (++checks >= 5) clearInterval(periodicCheck);
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
  } else {
    setTimeout(init, 200);
  }

  window.LobbyCarousel = { refresh: updateUI, next, prev: () => showSlide(_currentIdx - 1) };
})();
