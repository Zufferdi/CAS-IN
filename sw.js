// Service Worker — CAS-IN Investigation Numérique
// v19 : ajout scenes.js (scénarios DFIR) + stratégie network-first dédiée
const CACHE_VERSION = 'cas-in-v19';
const STATIC_ASSETS = [
  './',
  './index.html',
  './quiz.html',
  './tp.html',
  './scene.html',
  './manifest.json',
  './pwa.manifest.json',
  './questions.json',
  './counts.json',
  // Styles
  './style/landing.css',
  './style/style.css',
  './style/tp.css',
  './style/scene.css',
  './style/fiche.css',
  './style/fiche_style.css',
  // Scripts
  './js/landing.js',
  './js/cas-in-counts.js',
  './js/cas-in-pwa.js',
  './js/cas-in-search.js',
  // Scénarios DFIR (ajout v19)
  './scenes.js',
  // TP
  './tp/tp-data.js',
  './tp/tp-engine.js',
  // Fiches
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
  './fiches/wireshark_pcap.html',
  './fiches/mac_times.html',
  './fiches/pki_certificats.html',
  './fiches/sqlite_forensique.html'
];

// Installation : mise en cache des assets statiques
self.addEventListener('install', event => {
  console.log('[SW] Install ' + CACHE_VERSION);
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
  console.log('[SW] Activate ' + CACHE_VERSION);
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

// Fetch : stratégie mixte selon le type de ressource
self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorer les requêtes cross-origin (fonts Google, CDN externes)
  if (url.origin !== self.location.origin) return;

  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const isJSON = url.pathname.endsWith('.json');
  // scenes.js : network-first car mis à jour fréquemment (47 scénarios, ~937KB)
  const isScenes = url.pathname.endsWith('scenes.js');

  if (isHTML || isJSON || isScenes) {
    // Network First : toujours essayer le réseau en premier, fallback cache
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
    // Cache First : CSS, JS (sauf scenes.js), images
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
