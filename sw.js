// Service Worker — CAS-IN Investigation Numérique
// v54 : v2.20 — Quick wins : factorisation, a11y, cohérence index
//       NEW js/components/fiche-common.js (171 L) : factorisation des
//       comportements UI répétés sur toutes les fiches (scroll-progress,
//       back-top, quiz-reveal, collapsibles, tabs génériques data-tab-*).
//       Économie : ~54 KB en supprimant la duplication inline (~92 patterns
//       retirés sur 109 fiches via scripts/migrate_fiche_common.py).
//       Bénéfice supplémentaire : la barre scroll/back-top fonctionne
//       maintenant sur les fiches qui n'avaient PAS le JS associé.
//       NEW scripts/build_scenes_index.py : régénère scenes/index.json
//       à chaque modif de scène (5 scènes orphelines retrouvées,
//       1 fantôme nettoyée). counts.json passe de 93 → 97 scènes.
//       NEW scripts/add_h1_to_fiches.py : ajout d'un <h1> sur les
//       15 fiches qui n'en avaient pas (a11y + SEO). 109/109 fiches
//       ont maintenant un h1 unique avec style cohérent.
//       Workflow GitHub Actions : étapes ajoutées (build_scenes_index +
//       migrate_fiche_common). Tout reste auto à chaque commit.
//
// v53 : v2.19 — Liens croisés Q ↔ Fiche ↔ TP ↔ Scènes (navigation transverse)
//       NEW data/cross-links.json (35 KB) : mapping généré par
//       scripts/build_cross_links.py — 1730 liens fiches→questions,
//       26 liens fiches→TP, 73 liens fiches→scènes.
//       NEW js/components/fiche-related.js : injecte une section "Voir aussi"
//       en bas de chaque fiche avec liens vers quiz filtré, TP connexes
//       et scénarios DFIR pertinents.
//       Quiz : ouverture depuis une fiche filtre les questions sur le sujet
//       (via localStorage 'cas-in-quiz-filter').
//       +27 questions ICS/SCADA/OT Forensique (1750 → 1777).
//       Nettoyage prod : 7 console.log retirés, 6 alert() derrière showToast,
//       2 catch silencieux complétés.
//       Build orchestrator : scripts/build-all.sh + git pre-commit hook.
//
// v52 : v2.18 — Moteur de recherche full-text dans les fiches.
//       NEW js/components/fiche-search.js (466 L) : tokenization FR/EN,
//       normalisation accents, synonymes bidirectionnels, indexation
//       du contenu RÉEL des fiches (875 sections), scoring pondéré
//       par champ (title=10, sec_title=5, command=4, term=3, body=1),
//       fuzzy matching Levenshtein pour fautes de frappe.
//       NEW js/components/search-modal.js (508 L) : modal Cmd+K accessible
//       depuis 118 pages, navigation clavier, snippets surlignés,
//       recherches récentes en localStorage, FAB mobile.
//       NEW scripts/build_search_index.py (218 L) : génère search-index.json
//       à partir des HTML (875 sections, 6622 termes, 38 commandes).
//       NEW data/search-index.json (581 KB, ~80 KB gzippé).
//       Maintenant : 'Ed Skoudis', 'ip link', '4624 type 10', 'WhatsApp database',
//       'comment trouver les processus malveillants' renvoient les BONNES
//       sections des bonnes fiches avec extraits surlignés.
//
// v51 : v2.17 — Mode dark/light propagé dans les 7 CSS qui n'avaient pas de
//       règles [data-theme="light"] : fiche_style.css (47 sélecteurs),
//       landing.css (14), quiz.css (13), scene.css (11), profile.css (10),
//       tp.css (10), tools.css (4). Le toggle theme-toggle.js fonctionne
//       maintenant sur TOUTES les pages, pas juste celles qui chargent style.css.
//       Audit confirmé : mobile_apps_forensique.html, cmd_linux_forensique.html,
//       sqlite_forensique.html (Démarrage), sqlite_forensique_avance.html
//       (Internals Avancés) tous bien intégrés et cross-référencés.
//
// v50 : v2.17 — session "tout faire" :
//       * Refactor SQLite : 2 fiches harmonisées en parcours 2 étapes
//         (Démarrage → Internals Avancés) avec bannières cross-ref
//       * cmd_windows_forensique.html enrichi : section Intrusion Discovery
//         (5 cards : SMB sessions, Run/RunOnce, Event IDs, Sysinternals, perfs)
//       * Nouvelle fiche cmd_linux_forensique.html (live response Linux,
//         8 sections parallèles à Windows : ps/lsof/find/passwd/cron/logs/perf/outils)
//       * Nouvelle fiche mobile_apps_forensique.html (catalogue 30+ apps iOS
//         avec paths SQLite/Plist/Realm — inspiré poster SANS FOR585)
//       * Mode CLAIR/SOMBRE toggle : nouveau thème [data-theme="light"]
//         dans style.css, composant js/components/theme-toggle.js bouton
//         flottant bottom-left + persistence localStorage. 118 pages patchées
//         (110 fiches + 8 pages racine).
//       Manifest 104→106. Cache invalidé.
// v49 : v2.16 — CHANGELOG mis à jour (v2.11→v2.16) + nouvelle fiche
//       poster_windows_artefacts.html (vue d'ensemble par question forensique,
//       inspirée du poster SANS FOR500 Rob Lee) + système de NOTES utilisateur
//       sur fiches (composant js/components/fiche-notes.js + style/fiche-notes.css
//       + section gestion dans profile.html via js/profile/profile-notes.js).
//       104 fiches HTML patchées avec inclusion automatique du composant.
//       Persistence localStorage par fiche (cas-in-notes-{ficheId}).
//       Manifest 103→104. Cache invalidé.
// v48 : refactor des 3 fiches mémoire pour éliminer la confusion utilisateur :
//       - ram_forensique.html → "Acquisition Mémoire RAM" (Étape 1/3) + 6 edge cases modernes
//         (Secure Boot, KASLR, VBS/Credential Guard, TPM 2.0+PIN, Hyperviseurs type-1, SSD SED Opal)
//       - volatilite.html → "Volatility 3 — Démarrage" (Étape 2/3) avec H1 dédié
//       - volatility_memory_forensics.html → "Mémoire — Internals Avancés" (Étape 3/3)
//       Bannières de cross-référence harmonisées entre les 3. Manifest + index régénérés.
//       Nouvelle scène ICS : swissgrid-iec61850-jura.json (poste électrique 380 kV, IEC 61850 GOOSE).
// v47 : (version intermédiaire — voir v48 pour les changements consolidés)
// v46 : 3 nouvelles fiches forensiques basées sur cheat sheets SANS officielles :
//       - ics_forensique.html (ICS/SCADA, Modèle Purdue, Modbus/DNP3/IEC 61850, NSM ICS, IR jump bag)
//       - cmd_windows_forensique.html (live response Windows : wmic, sc, netsh, netstat, reg)
//       - magic_bytes_signatures.html (file signatures, outils file/binwalk/xxd, regex forensique)
//       Enrichissement zimmerman.html avec section bstrings (extraction strings + regex multi-encoding).
//       Manifest mis à jour : 100 → 103 fiches. Pré-cache dynamique via manifest.json.
// v45 : split quiz-app.js — quiz-data.js (1562 lignes de constantes) extrait
//       en module séparé pour alléger le caching et la maintenance.
// v44 : nettoyage STATIC_ASSETS — retrait de track-theme.css (fichier inexistant,
//       générait un 404 au précache) et fiche-hub.css (CSS orphelin obsolète,
//       remplacé par fiche_style.css depuis longtemps).
// v43 : split tp-engine.js — tp-engine-windows.js (Registry/Prefetch/LNK) extrait
//       en module séparé. Ajout au précache.
// v42 : restructuration — JSON data déplacés vers data/ (questions, manifest, counts)
//       Cache invalidé pour forcer re-précache des nouveaux chemins.
// v41 : install per-asset (au lieu de addAll atomique) pour identifier
//       précisément les ressources qui 404 lors du précache. Logs détaillés.
// v40 : refonte stratégie — fiches précachées dynamiquement depuis manifest.json
//       Stale-while-revalidate sur CSS/JS, channel postMessage 'GET_VERSION'.
// v39..v21 : voir docs/CHANGELOG.md.

const CACHE_VERSION = 'cas-in-v54';

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
  './style/fiche-notes.css',
  './style/profile.css',
  './style/profile-banner.css',
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
  './js/profile/profile-notes.js',
  // Bridges
  './js/bridges/quiz-profile-bridge.js',
  './js/bridges/scene-profile-bridge.js',
  './js/bridges/tp-profile-bridge.js',
  // Components
  './js/components/fiche-notes.js',
  './js/components/theme-toggle.js',
  // Pages
  './js/pages/landing.js',
  './js/pages/landing-3d.js',
  './js/pages/quiz-data.js',
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
  './js/components/fiche-search.js',
  './js/components/search-modal.js',
  './js/components/fiche-related.js',
  './js/components/fiche-common.js',
  './data/search-index.json',
  './data/cross-links.json',
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
