// ═══════════════════════════════════════════════════════
// cas-in-pwa.js — Enregistrement partagé du Service Worker (v3)
// Inclus sur chaque page : index, quiz, tp, scene, fiches/*
//
// v3 : banner d'update DFIR-style avec bouton "Recharger" explicite,
//      bouton "Plus tard", expose CasInPwa.getVersion() pour debug.
// ═══════════════════════════════════════════════════════
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) {
    window.CasInPwa = { getVersion: () => Promise.resolve(null) };
    return;
  }

  // Chemin du SW : résolu à la racine du site
  // - index.html à la racine : './sw.js'
  // - fiches/index.html dans un sous-dossier : '../sw.js'
  const depth = (window.location.pathname.match(/\//g) || []).length - 1;
  const swPath = depth > 1 ? '../'.repeat(depth - 1) + 'sw.js' : './sw.js';

  let _waitingWorker = null;
  let _bannerEl = null;
  let _registration = null;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register(swPath).then(function (reg) {
      _registration = reg;
      // Si un SW attend déjà, notifier (cas d'un reload sans fermer l'onglet)
      if (reg.waiting && navigator.serviceWorker.controller) {
        _waitingWorker = reg.waiting;
        _showUpdateBanner();
      }
      reg.addEventListener('updatefound', function () {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            _waitingWorker = nw;
            _showUpdateBanner();
          }
        });
      });
    }).catch(function () { /* silencieux */ });

    // Quand le SW contrôleur change (après SKIP_WAITING), on recharge
    let _reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (_reloading) return;
      _reloading = true;
      window.location.reload();
    });
  });

  // ── Activation du worker en attente ──
  function _activateWaiting() {
    if (!_waitingWorker) {
      window.location.reload();
      return;
    }
    _waitingWorker.postMessage('SKIP_WAITING');
    // controllerchange → reload automatique (voir plus haut)
  }

  // ── Banner d'update (style DFIR) ──
  function _showUpdateBanner() {
    if (_bannerEl) return; // déjà affiché

    _bannerEl = document.createElement('div');
    _bannerEl.id = 'cas-in-update-banner';
    _bannerEl.setAttribute('role', 'status');
    _bannerEl.setAttribute('aria-live', 'polite');
    _bannerEl.innerHTML = `
      <div class="ciu-icon" aria-hidden="true">⟳</div>
      <div class="ciu-body">
        <div class="ciu-title">Mise à jour disponible</div>
        <div class="ciu-text">Une nouvelle version de CAS-IN est prête.</div>
      </div>
      <button type="button" class="ciu-btn ciu-btn-primary" id="cas-in-update-reload">Recharger</button>
      <button type="button" class="ciu-btn ciu-btn-ghost" id="cas-in-update-later" aria-label="Plus tard">✕</button>
    `;

    const style = document.createElement('style');
    style.textContent = `
#cas-in-update-banner {
  position: fixed;
  bottom: 18px;
  right: 18px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(0, 30, 20, .96), rgba(0, 0, 0, .96));
  border: 1px solid rgba(0, 255, 65, .4);
  border-radius: 8px;
  padding: 12px 14px;
  font-family: 'Share Tech Mono', monospace, sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, .92);
  box-shadow: 0 8px 28px rgba(0, 0, 0, .55), 0 0 18px rgba(0, 255, 65, .15);
  backdrop-filter: blur(8px);
  max-width: 380px;
  animation: ciuSlideIn .25s ease-out;
}
#cas-in-update-banner .ciu-icon {
  font-size: 18px;
  color: #00ff41;
  text-shadow: 0 0 8px rgba(0, 255, 65, .5);
  animation: ciuSpin 2s linear infinite;
  flex-shrink: 0;
}
#cas-in-update-banner .ciu-body {
  flex: 1;
  min-width: 0;
}
#cas-in-update-banner .ciu-title {
  font-weight: 700;
  letter-spacing: .04em;
  color: #00ff41;
  font-size: 12px;
  margin-bottom: 2px;
}
#cas-in-update-banner .ciu-text {
  color: rgba(255, 255, 255, .65);
  font-size: 11px;
  letter-spacing: .02em;
}
#cas-in-update-banner .ciu-btn {
  font-family: inherit;
  font-size: 11px;
  letter-spacing: .04em;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all .15s;
  text-transform: uppercase;
  flex-shrink: 0;
}
#cas-in-update-banner .ciu-btn-primary {
  background: rgba(0, 255, 65, .15);
  border: 1px solid rgba(0, 255, 65, .55);
  color: #00ff41;
  font-weight: 700;
}
#cas-in-update-banner .ciu-btn-primary:hover {
  background: rgba(0, 255, 65, .3);
  box-shadow: 0 0 12px rgba(0, 255, 65, .35);
}
#cas-in-update-banner .ciu-btn-ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, .15);
  color: rgba(255, 255, 255, .55);
  padding: 6px 8px;
}
#cas-in-update-banner .ciu-btn-ghost:hover {
  background: rgba(255, 255, 255, .08);
  color: #fff;
}
#cas-in-update-banner.ciu-leaving {
  animation: ciuSlideOut .2s ease-in forwards;
}
@keyframes ciuSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ciuSlideOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(12px); }
}
@keyframes ciuSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@media (max-width: 540px) {
  #cas-in-update-banner {
    left: 12px;
    right: 12px;
    bottom: 12px;
    max-width: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  #cas-in-update-banner .ciu-icon { animation: none; }
  #cas-in-update-banner { animation: none; }
}
`;
    document.head.appendChild(style);
    document.body.appendChild(_bannerEl);

    document.getElementById('cas-in-update-reload').addEventListener('click', _activateWaiting);
    document.getElementById('cas-in-update-later').addEventListener('click', _dismissBanner);
  }

  function _dismissBanner() {
    if (!_bannerEl) return;
    _bannerEl.classList.add('ciu-leaving');
    setTimeout(() => {
      if (_bannerEl) {
        _bannerEl.remove();
        _bannerEl = null;
      }
    }, 220);
  }

  // ── API publique : récupérer la version actuelle du SW ──
  // Utilisable depuis la console pour debug, ou depuis profile.html pour
  // afficher la version dans la zone "Actions".
  function getVersion() {
    return new Promise(resolve => {
      if (!navigator.serviceWorker.controller) {
        resolve(null);
        return;
      }
      const channel = new MessageChannel();
      const timeout = setTimeout(() => resolve(null), 1500);
      channel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        resolve(event.data && event.data.version || null);
      };
      navigator.serviceWorker.controller.postMessage('GET_VERSION', [channel.port2]);
    });
  }

  // ── Online/offline status (léger, utilise showToast si dispo) ──
  let _offlineToastTimer = null;
  window.addEventListener('offline', function () {
    if (_offlineToastTimer) return;
    _offlineToastTimer = setTimeout(() => { _offlineToastTimer = null; }, 5000);
    if (typeof showToast === 'function') {
      showToast('streak-toast', '📡 Mode hors-ligne actif', 2500);
    }
  });
  window.addEventListener('online', function () {
    if (typeof showToast === 'function') {
      showToast('streak-toast', '🌐 Connexion rétablie', 2000);
    }
  });

  window.CasInPwa = {
    getVersion,
    activateUpdate: _activateWaiting,
  };
})();
