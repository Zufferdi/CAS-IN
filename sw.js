// Service Worker — CAS-IN Investigation Numérique
// v43 : split tp-engine.js — tp-engine-windows.js (Registry/Prefetch/LNK) extrait
//       en module séparé. Ajout au précache.
// v42 : restructuration — JSON data déplacés vers data/ (questions, manifest, counts)
//       Cache invalidé pour forcer re-précache des nouveaux chemins.
// v41 : install per-asset (au lieu de addAll atomique) pour identifier
//       précisément les ressources qui 404 lors du précache. Logs détaillés.
// v40 : refonte stratégie — fiches précachées dynamiquement depuis manifest.json
//       Stale-while-revalidate sur CSS/JS, channel postMessage 'GET_VERSION'.
// v39..v21 : voir docs/CHANGELOG.md.

const CACHE_VERSION = 'cas-in-v43';

// ─── Ressources critiques (HTML/JSON/CSS/JS) ───
// Liste maintenue à la main car peu volatile. Les FICHES sont lues
// dynamiquement depuis manifest.json à l'install (voir precacheFichesFromManifest).
const STATIC_ASSETS = [
  // Pages racine
  './',
  './index.html',
  './quiz.html',
  './tp.html',
  './exam.html',
  './tools.html',
  './scene.html',
  './profile.html',

  // Manifests & data
  './data/manifest.json',
  './pwa.manifest.json',
  './offline.html',
  './og-image.svg',
  './favicon.ico',
  './icon-192.png',
  './icon-512.png',
  './data/questions.json',
  './data/counts.json',

  // Styles
  './style/landing.css',
  './style/style.css',
  './style/tp.css',
  './style/tp-page.css',
  './style/tools.css',
  './style/exam.css',
  './style/scene.css',
  './style/fiche_style.css',
  './style/profile.css',
  './style/profile-banner.css',
  './style/track-theme.css',
  './style/quiz.css',

  // Scripts core
  './js/core/cas-in-profile.js',
  './js/core/cas-in-achievements.js',
  './js/core/cas-in-counts.js',
  './js/core/cas-in-export.js',
  './js/core/cas-in-pwa.js',
  './js/core/cas-in-search.js',
  // Profile UI
  './js/profile/profile-banner.js',
  './js/profile/profile-page.js',
  './js/profile/profile-track-v5.js',
  './js/profile/profile-titles.js',
  // Bridges
  './js/bridges/quiz-profile-bridge.js',
  './js/bridges/scene-profile-bridge.js',
  './js/bridges/tp-profile-bridge.js',
  // Pages
  './js/pages/landing.js',
  './js/pages/landing-3d.js',
  './js/pages/quiz-app.js',
  './js/pages/quiz-ui-patch.js',
  './js/pages/scene-app.js',
  './js/pages/scene-ux-patch.js',
  './js/pages/scene-lobby-v3.js',
  './js/pages/scene-engine-v4.js',
  './js/pages/tools-app.js',
  './js/pages/exam-app.js',

  // Index des scènes (lazy-load des scènes individuelles via fetch + cache-first)
  './scenes/index.json',

  // TP
  './tp/tp-data.js',
  './tp/tp-engine.js',
  './tp/tp-engine-windows.js',
  './tp/tp-engine-meta.js',

  // Hub des fiches (les fiches elles-mêmes sont précachées dynamiquement)
  './fiches/index.html',
  './fiches/fiche-hub.css',
];

const OFFLINE_FALLBACK = './offline.html';

// ─── Précache dynamique des fiches via manifest.json ───
// Avantage : plus de liste hardcodée à maintenir. Inconvénient : si manifest.json
// est inaccessible à l'install, on n'a pas les fiches en cache (elles seront
// mises en cache à la première visite via le fetch handler).
async function precacheFichesFromManifest(cache) {
  try {
    const resp = await fetch('./data/manifest.json', { cache: 'no-store' });
    if (!resp.ok) return;
    const manifest = await resp.json();
    const fiches = (manifest.fiches || [])
      .map(f => f && f.file ? './fiches/' + f.file : null)
      .filter(Boolean);
    // Best-effort : on ignore les 404 individuelles
    await Promise.allSettled(fiches.map(url => cache.add(url)));
    console.log('[SW] Precached ' + fiches.length + ' fiches from manifest');
  } catch (e) {
    console.warn('[SW] Could not precache fiches from manifest:', e);
  }
}

// ─── Install ───
self.addEventListener('install', event => {
  console.log('[SW] Install ' + CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async cache => {
      // Per-asset add avec log des manquants. On évite addAll() atomique car
      // sur GitHub Pages les déploiements peuvent être partiels (un asset listé
      // qui n'est pas encore en ligne fait tout planter). Mieux : on installe
      // ce qu'on peut et on log précisément ce qui manque.
      const results = await Promise.all(
        STATIC_ASSETS.map(url =>
          cache.add(url).then(
            () => ({ url, ok: true }),
            err => ({ url, ok: false, err: err.message || String(err) })
          )
        )
      );
      const failed = results.filter(r => !r.ok);
      if (failed.length) {
        console.warn('[SW] ' + failed.length + ' asset(s) failed to cache:');
        failed.forEach(r => console.warn('  ✗ ' + r.url + ' → ' + r.err));
      } else {
        console.log('[SW] All ' + results.length + ' static assets cached');
      }
      // Fiches : best-effort, ne bloque pas l'install
      await precacheFichesFromManifest(cache);
    })
  );
  self.skipWaiting();
});

// ─── Activate : nettoyage des anciens caches ───
self.addEventListener('activate', event => {
  console.log('[SW] Activate ' + CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Messages depuis le client ───
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'GET_VERSION') {
    // Réponse sur le port du MessageChannel si fourni
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ version: CACHE_VERSION });
    }
    return;
  }
});

// ─── Fetch handler ───
self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // ignorer cross-origin

  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const path = url.pathname;
  const isJSON = path.endsWith('.json');
  const isSceneIndex = path.endsWith('/scenes/index.json');
  const isSceneFile = /\/scenes\/[^/]+\.json$/.test(path) && !isSceneIndex;
  const isCSS = path.endsWith('.css');
  const isJS = path.endsWith('.js');

  // ─── Cache-first pour les scènes individuelles (changent rarement) ───
  if (isSceneFile) {
    event.respondWith(cacheFirstWithNetworkFallback(event.request, url));
    return;
  }

  // ─── Stale-while-revalidate pour CSS et JS ───
  // Sert le cache immédiatement (snappy) MAIS refetch en background pour
  // que la prochaine visite ait la dernière version. Combiné au bump du
  // CACHE_VERSION à chaque déploiement, ça réduit fortement le risque de
  // rester coincé sur une vieille version JS/CSS.
  if (isCSS || isJS) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // ─── Network-first pour HTML / autres JSON ───
  if (isHTML || isJSON) {
    event.respondWith(networkFirst(event.request, isHTML));
    return;
  }

  // ─── Cache-first pour le reste (images, fonts, ...) ───
  event.respondWith(cacheFirstWithNetworkFallback(event.request));
});

// ───────────────────────────────────────────────────────────
// Stratégies (helpers)
// ───────────────────────────────────────────────────────────

function networkFirst(request, isHTML) {
  return fetch(request).then(response => {
    if (response.ok) {
      const clone = response.clone();
      caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
    }
    return response;
  }).catch(() =>
    caches.match(request).then(cached => {
      if (cached) return cached;
      if (isHTML) return caches.match(OFFLINE_FALLBACK);
      return new Response(JSON.stringify({ error: 'offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    })
  );
}

function cacheFirstWithNetworkFallback(request, url) {
  return caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
      }
      return response;
    }).catch(() => {
      if (url) {
        // Cas spécial scène : retourner un JSON parlant
        return new Response(
          JSON.stringify({
            error: 'offline',
            scene: url.pathname.split('/').pop().replace('.json', ''),
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('', { status: 503, statusText: 'Offline' });
    });
  });
}

function staleWhileRevalidate(request) {
  return caches.open(CACHE_VERSION).then(cache =>
    cache.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => null);
      // Si on a un cache, on le sert immédiatement et on laisse le fetch tourner
      // en background pour rafraîchir le cache pour la prochaine visite.
      // Si pas de cache, on attend le réseau.
      return cached || networkFetch || new Response('', { status: 503 });
    })
  );
}
