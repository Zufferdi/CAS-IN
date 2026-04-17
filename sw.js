// CAS-IN Investigation Numérique — Service Worker v9
const CACHE = 'casIn-v9';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Vider tous les anciens caches (v6, v7, v8...)
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Réseau en premier pour TOUT — pas de cache SW
// Le cache HTTP du navigateur gère les performances
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then(cached =>
        cached || new Response('Hors ligne', { status: 503 })
      )
    )
  );
});
