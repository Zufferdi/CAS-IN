// Service Worker — CAS-IN Investigation Numérique
// v13 : fix opérateur (!url.origin → url.origin !==), scene.css retiré (CSS inline), URL scheme guard
const CACHE_VERSION = 'cas-in-v13';
const STATIC_ASSETS = [
  './',
  './index.html',
  './quiz.html',
  './tp.html',
  './scene.html',
  './manifest.json',
  './questions.json',
  './style/style.css',
  './style/tp.css',
  './style/scene.css',
  './style/fiche.css',
  './style/fiche_style.css',
  './tp/tp-data.js',
  './tp/tp-engine.js',
  './fiches/acquisition.html',
  './fiches/anti_forensique.html',
  './fiches/autopsy.html',
  './fiches/browser_forensique.html',
  './fiches/cassage_mdp.html',
  './fiches/cloud_forensique.html',
  './fiches/comparaison_fs.html',
  './fiches/crypto.html',
  './fiches/disques.html',
  './fiches/droit.html',
  './fiches/email_forensique.html',
  './fiches/encodage.html',
  './fiches/exfat.html',
  './fiches/ext.html',
  './fiches/fat12.html',
  './fiches/fat16.html',
  './fiches/formats.html',
  './fiches/hash.html',
  './fiches/hfs.html',
  './fiches/incident_response.html',
  './fiches/index.html',
  './fiches/logs_windows.html',
  './fiches/macos-linux.html',
  './fiches/malware_forensique.html',
  './fiches/methodologie.html',
  './fiches/mobile.html',
  './fiches/ntfs.html',
  './fiches/osint.html',
  './fiches/outils.html',
  './fiches/preuve.html',
  './fiches/rapport_forensique.html',
  './fiches/registre_windows.html',
  './fiches/reseau.html',
  './fiches/suisse.html',
  './fiches/timeline.html',
  './fiches/tor_darkweb.html',
  './fiches/volatilite.html',
  './fiches/windows.html',
  './fiches/wireshark_pcap.html'
];

// Installation : mise en cache des assets statiques
self.addEventListener('install', event => {
  console.log('[SW] Install v' + CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate v' + CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch : Network First pour HTML/JSON, Cache First pour CSS/JS
self.addEventListener('fetch', event => {
  // Ignorer tout ce qui n'est pas http(s) — bloque chrome-extension://
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Ignorer les requêtes non-GET et hors origine — OPERATEUR CORRIGÉ (était: !url.origin ===)
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const isJSON = url.pathname.endsWith('.json');

  if (isHTML || isJSON) {
    // Network First : toujours essayer le réseau en premier
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
  } else {
    // Cache First : CSS, JS, images
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
