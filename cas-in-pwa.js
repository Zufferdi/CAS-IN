// ═══════════════════════════════════════════════════════
// cas-in-pwa.js — Enregistrement partagé du Service Worker
// Inclus sur chaque page : index, quiz, tp, scene, fiches/*
// ═══════════════════════════════════════════════════════
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;

  // Chemin du SW : résolu à la racine du site
  // - index.html à la racine : './sw.js'
  // - fiches/index.html dans un sous-dossier : '../sw.js'
  // window.location.pathname.split('/').length donne un hint
  const depth = (window.location.pathname.match(/\//g) || []).length - 1;
  const swPath = depth > 1 ? '../'.repeat(depth - 1) + 'sw.js' : './sw.js';

  window.addEventListener('load', function () {
    navigator.serviceWorker.register(swPath).then(function (reg) {
      reg.addEventListener('updatefound', function () {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            // MAJ dispo — notification discrète
            _notifyUpdate();
          }
        });
      });
    }).catch(function () { /* silencieux */ });
  });

  function _notifyUpdate() {
    // Si un toast existe déjà (quiz), on l'utilise
    if (typeof showToast === 'function') {
      showToast('streak-toast', '🔄 Mise à jour disponible — rechargez pour l\'appliquer', 4000);
      return;
    }
    // Sinon, petit banner discret en bas à droite
    const b = document.createElement('div');
    b.setAttribute('role', 'status');
    b.setAttribute('aria-live', 'polite');
    b.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9999;background:rgba(0,229,204,.15);border:1px solid rgba(0,229,204,.4);color:#00e5cc;padding:10px 14px;border-radius:8px;font-family:monospace;font-size:12px;cursor:pointer;backdrop-filter:blur(8px)';
    b.textContent = '🔄 Mise à jour disponible — cliquez pour recharger';
    b.onclick = function () { location.reload(); };
    document.body.appendChild(b);
    setTimeout(function () { b.style.opacity = '0'; b.style.transition = 'opacity .5s'; setTimeout(function () { b.remove(); }, 500); }, 8000);
  }

  // Online/offline status (léger)
  window.addEventListener('offline', function () {
    if (typeof showToast === 'function') showToast('streak-toast', '📡 Mode hors-ligne actif', 2500);
  });
  window.addEventListener('online', function () {
    if (typeof showToast === 'function') showToast('streak-toast', '🌐 Connexion rétablie', 2000);
  });
})();
