// ═══════════════════════════════════════════════════════════════
// Service Worker — CAS-IN Investigation Numérique
// ═══════════════════════════════════════════════════════════════
//
// Cache PWA offline-first pour la plateforme d'apprentissage DFIR.
//
// Stratégies :
//   - Précache au boot : assets statiques de STATIC_ASSETS (HTML, CSS,
//     JS, JSON, fonts, icônes). Téléchargés à l'install du SW.
//   - Runtime cache : assets dynamiques (chunks de questions, scènes
//     individuelles, etc.) ajoutés au cache au fil des fetches.
//   - Cache-first pour les statiques : sert depuis cache, met à jour
//     en arrière-plan via stale-while-revalidate.
//   - Network-first pour les data/X.json critiques (counts, manifest).
//   - Fallback offline.html pour les pages HTML non-cachées.
//
// Pour l'historique des versions et les changements, voir
// docs/CHANGELOG.md (entrée [3.0-jolification] et antérieures).
//
// v132p — 2026-05-30 — Trim des commentaires historiques (-1669 lignes,
// ~80 KB économisés sur le précache). L'historique reste préservé
// dans CHANGELOG.md et l'historique Git du fichier.
// ═══════════════════════════════════════════════════════════════

const CACHE_VERSION = 'cas-in-v145';

// ─── Ressources critiques (HTML/JSON/CSS/JS) ───
// Liste maintenue à la main car peu volatile. Les FICHES sont lues
// dynamiquement depuis manifest.json à l'install (voir precacheFichesFromManifest).
const STATIC_ASSETS = [
  // ─── Pages racine ───
  './',
  './index.html',
  // v131a — Hub Apprendre (fiches + tutoriels + références)
  './apprendre.html',
  // v132h — Hubs symétriques pour les 3 autres pilules
  './pratiquer.html',
  './enqueter.html',
  './tester.html',
  './quiz.html',
  './tp.html',
  './pages/exam.html',
  './pages/tools.html',
  './scene.html',
  './pages/profile.html',
  './pages/mastery.html',
  './pages/parcours.html',
  './pages/parcours-detail.html',
  './pages/case-studies.html',
  './pages/case-study-detail.html',
  './pages/carriere.html',
  './pages/sagas.html',
  // v124 — Cluster Tutoriels DFIR
  './tutoriels.html',
  './tutoriels/autopsy.html',
  './tutoriels/iped.html',
  './tutoriels/mvt.html',
  './tutoriels/plaso.html',
  './tutoriels/volatility3.html',
  // v125 — Extension cluster Tutoriels DFIR (network + triage + endpoint)
  './tutoriels/wireshark.html',
  './tutoriels/kape.html',
  './tutoriels/velociraptor.html',
  // v126 — Extension cluster Tutoriels DFIR (acquisition + EZ Tools + mobile lecture)
  './tutoriels/ftkimager.html',
  './tutoriels/eztools.html',
  './tutoriels/cellebrite_reader.html',
  // v127 — Extension : cassage de hash + socle CLI
  './tutoriels/hashcat.html',
  './tutoriels/bases_cli.html',
  // v128 — Extension : CLI 3 niveaux + OSINT pseudonymes
  './tutoriels/cli_intermediaire.html',
  './tutoriels/cli_expert.html',
  './tutoriels/sherlock.html',
  './tutoriels/maigret.html',
  // v129 — Extension : John Ripper + Autopsy 2 niveaux + Holehe
  './tutoriels/john_ripper.html',
  './tutoriels/autopsy_debutant.html',
  './tutoriels/autopsy_avance.html',
  './tutoriels/holehe.html',
  // v130 — Extension : IPED 2 niveaux + X-Ways + GHunt 2 niveaux + RegRipper + PhoneInfoga
  './tutoriels/iped_debutant.html',
  './tutoriels/iped_avance.html',
  './tutoriels/xways_debutant.html',
  './tutoriels/ghunt_debutant.html',
  './tutoriels/ghunt_moyen.html',
  './tutoriels/regripper.html',
  './tutoriels/phoneinfoga.html',
  // v2.85 — Pages auxiliaires : étaient ré-fetch à chaque visite hors-ligne
  './pages/artifacts.html',
  './pages/glossary.html',
  './pages/npcs.html',
  // v2.59 — Cluster pages de référence (sous-dossier references/)
  './references/index.html',
  './references/events.html',
  './references/mitre.html',
  './references/legal.html',
  './references/dfir-tools.html',
  './references/signatures.html',
  './references/bibliography.html',
  './offline.html',
  './fiches/index.html',

  // ─── Manifests, icônes, data globale ───
  './pwa.manifest.json',
  './data/manifest.json',
  './data/counts.json',
  // v132f — Questions découpées par thème (lazy loading)
  // L'index est précachée (1.6 KB) ; les 8 chunks (4.2 MB total) sont chargés à la demande
  // et cachés en cache opportuniste par la stratégie fetch handler.
  // questions.json (legacy 4.2 MB) reste accessible mais n'est plus précachée.
  './data/questions-index.json',
  // v132k — Index minimaliste pour cas-in-search (~425 KB au lieu de 4.2 MB)
  './data/questions-search.json',
  './data/search-index.json',
  './data/fiches-titles.json',
  './data/parcours.json',
  './data/npcs.json',
  './data/npc-arcs.json',
  './og-image.svg',
  // v132e — og-images dédiées par hub (Open Graph + Twitter Card)
  './og-image-apprendre.svg',
  './og-image-tutoriels.svg',
  './og-image-scene.svg',
  './og-image-quiz.svg',
  './favicon.ico',
  './icon-192.png',
  './icon-512.png',

  // ─── Styles ───
  './style/landing.css',
  './style/style.css',
  './style/cas-in-navbar.css',
  './style/profile.css',
  './style/profile-tp-heatmap.css',
  './style/profile-dossier.css',
  './style/quiz.css',
  './style/scene.css',
  './style/tp.css',
  './style/tp-page.css',
  './style/tools.css',
  './style/exam.css',
  './style/fiche_style.css',
  './style/fiche-notes.css',
  './style/gamification-toasts.css',
  './style/gamification-tiers.css',
  // v132d — Boutons de partage trophées
  './style/share-buttons.css',
  './style/npcs.css',
  './style/glossary.css',
  // v2.59 — Style partagé pages de référence
  './style/refs.css',
  // v124 — Style cluster Tutoriels DFIR
  './style/tutoriels.css',

  // ─── Scripts core (js/core/*) ───
  './js/core/cas-in-profile.js',
  './js/core/cas-in-navbar.js',
  './js/core/cas-in-achievements.js',
  './js/core/cas-in-arcs.js',
  './js/core/cas-in-quests.js',
  './js/core/cas-in-role-careers.js',
  './js/core/cas-in-mastery.js',
  './js/core/cas-in-mastery-quiz.js',
  './js/core/cas-in-leaderboard.js',
  './js/core/cas-in-utils.js',
  // v132n — Module de robustesse localStorage (validation au boot + versioning)
  './js/core/cas-in-storage.js',
  './js/core/cas-in-counts.js',
  './js/core/cas-in-export.js',
  './js/core/cas-in-pwa.js',
  './js/core/cas-in-search.js',
  './js/core/cas-in-npc-state.js',
  './js/core/cas-in-theme-toggle.js',

  // ─── Profile UI (js/profile/*) ───
  // v2.59 — profile-banner.js retiré (remplacé par cas-in-navbar v2.77).
  // v2.59 — hub-activity-feed.js retiré (doublon de components/hub-activity.js).
  './js/profile/profile-page.js',
  './js/profile/profile-tabs.js',
  './js/profile/profile-relations.js',
  './js/profile/profile-heatmap.js',
  './js/profile/profile-tp-heatmap.js',
  './js/profile/profile-track-v5.js',
  './js/profile/profile-titles.js',
  './js/profile/profile-notes.js',
  './js/profile/profile-arcs-ui.js',
  './js/profile/profile-quests-ui.js',
  './js/profile/profile-role-careers.js',
  './js/profile/profile-leaderboard-ui.js',
  './js/profile/hub-gamification-ui.js',
  './js/profile/celebration-ui.js',
  './js/profile/onboarding-ui.js',

  // ─── Bridges (legacy → Profile) ───
  // quiz/scene bridges supprimés en v2.85+ (mergés dans quiz-app/scene-app)
  './js/bridges/tp-profile-bridge.js',
  './js/bridges/tools-profile-bridge.js',

  // ─── Components (js/components/*) ───
  './js/components/fiche-common.js',
  './js/components/fiche-reader.js',
  './js/components/fiche-related.js',
  './js/components/fiche-search.js',
  './js/components/fiche-notes.js',
  './js/components/search-modal.js',
  './js/components/search-lazy.js',
  './js/components/scene-npcs.js',
  // v2.59 — scene-briefing-tabs.js et scene-banners-carousel.js retirés
  // (remplacés par scene-engine-v4.js et scene-lobby-v3.js).
  './js/components/quiz-utils.js',
  './js/components/quiz-sm2.js',
  './js/components/quiz-ranks.js',
  './js/components/quiz-effects.js',
  './js/components/quiz-share.js',
  './js/components/quest-banner.js',
  './js/components/gamification-toasts.js',
  './js/components/hub-activity.js',
  './js/components/hub-identity.js',
  './js/components/swiss-flags.js',

  // ─── Pages JS (js/pages/*) ───
  './js/pages/landing.js',
  './js/pages/landing-3d.js',
  './js/pages/quiz-data.js',
  './js/pages/quiz-app.js',
  // quiz-ui-patch.js supprimé en v2.22 (mergé dans quiz-app.js)
  './js/pages/scene-app.js',
  './js/pages/scene-ux-patch.js',
  './js/pages/scene-lobby-v3.js',
  './js/pages/scene-card-rich-v1.js',
  './js/pages/scene-engine-v4.js',
  './js/pages/tools-app.js',
  './js/pages/tp-page.js',
  './js/pages/exam-app.js',
  './js/pages/artifacts-app.js',
  './js/pages/artifacts-data.js',
  './js/pages/case-studies-app.js',
  './js/pages/sagas-app.js',
  // v2.59 — Moteur partagé + données du cluster Références
  './js/pages/refs-engine.js',
  './js/pages/events-data.js',
  './js/pages/mitre-data.js',
  './js/pages/legal-data.js',
  './js/pages/dfir-tools-data.js',
  './js/pages/signatures-data.js',
  './js/pages/bibliography-data.js',
  // v3.0 delta v44 — Tiers, titres, blasons saga
  './js/core/cas-in-titles-badges.js',
  './js/components/titles-badges-ui.js',

  // ─── TP (tp/*) ───
  './tp/tp-data.js',
  './tp/tp-engine.js',
  './tp/tp-engine-carving.js',
  './tp/tp-engine-windows.js',
  './tp/tp-engine-meta.js',
  './tp/tp-engine-btree.js',
  './tp/tp-engine-easy.js',
  './tp/tp-engine-artefacts.js',
  './tp/tp-engine-osint-detect.js',
  './tp/tp-engine-rsa.js',
  './tp/tp-engine-classic-crypto.js',
  './tp/tp-engine-forensic-extras.js',

  // ─── v2.93-v2.99 — Nouveaux modules (Dossiers, Sagas, Arcs, Dashboard...) ───
  './js/core/cas-in-skill-branches.js',
  './js/core/cas-in-npc-data.js',
  './js/pages/scene-level-gating-v1.js',
  './js/pages/scene-arc-context.js',
  './js/profile/profile-dashboard.js',
  './js/profile/profile-distinctions-tabs.js',
  './js/components/legal-ref-popover.js',
  './js/components/completion-watcher.js',

  // ─── v2.93-v2.99 — Nouveaux styles ───
  './style/scene-gating.css',
  './style/scene-arc-context.css',
  './style/profile-relations.css',
  './style/profile-dashboard.css',
  './style/profile-distinctions-tabs.css',
  './style/legal-ref-popover.css',

  // ─── v2.93-v2.99 — Nouvelles data ───
  './data/glossary.json',
  './data/scenes-chronology.json',

  // ─── v3.1-v3.3 — Rattrapage précache (jamais ajoutés avant v3.3) ───
  // Ces fichiers étaient référencés dans scene.html depuis v3.1/v3.2/v3.2.3
  // mais oubliés de STATIC_ASSETS, causant des fetch network systématiques
  // hors-ligne. Symptôme : "Scènes Viège/Sarine introuvables" mentionné dans
  // README v3.1. Ajoutés en bloc ici en v3.3.
  //
  // v3.1 — Système de Faveurs PNJ
  './js/components/npc-favors.js',
  './style/npc-favors.css',
  //
  // v2.91 — Compétences passives par rôle (loadé par scene.html, oublié)
  './js/components/role-abilities.js',
  //
  // v3.2 — Vue Campagnes (nouvelle page d'accueil)
  './js/pages/scene-campaigns-v1.js',
  './style/scene-campaigns.css',
  //
  // v3.2.3 — Jolification (UX scène & gamification)
  './js/components/scene-jolif-v1.js',
  './js/components/cas-in-navbar-mobile.js',
  './js/components/cas-in-view-toggle.js',
  './style/scene-jolif.css',
  //
  // v3.2.4 — Missions du jour (daily quests visibles)
  './js/components/cas-in-daily-missions.js',
  './style/cas-in-daily-missions.css',
  //
  // v3.3 — Badges qualitatifs (NOUVEAU)
  './js/components/cas-in-quality-badges-v1.js',
  //
  // v3.4 — Rattrapage précache (audit cleanup) : 7 fichiers manquants
  './data/campaigns.json',
  './data/cross-links.json',
  './data/fiche-graph.json',
  './style/artifacts.css',
  './style/profile-dossier-plus.css',
  './tp/tp-engine-disk.js',
  './tp/tp-engine-fat.js',
  './tp/tp-engine-ntfs.js',
  //
  // v93 (Niveau G — UX additionnelle) : panneaux atmosphères + affinités
  './data/atmospheres.json',
  './js/profile/profile-atmospheres.js',
  './js/profile/profile-affinities.js',
  './style/profile-atmospheres.css',
  './style/profile-affinities.css',
  //
  // v94 (Niveau H — Fonctionnel) : notes scène + examen blanc + export CSV
  './js/components/scene-notes.js',
  './js/pages/scene-exam-app.js',
  './js/profile/profile-export-csv.js',
  './pages/scene-exam.html',
  //
  // v94 (Niveau J — Accessibilité WCAG 2.2 AA)
  './js/core/cas-in-a11y.js',
  //
  // v94 (Niveau I — i18n scaffolding)
  './js/core/cas-in-i18n.js',
  './data/i18n/fr.json',
  './data/i18n/de.json',
  './data/i18n/it.json',
  './data/i18n/en.json',
  // v124 — Cluster Tutoriels DFIR (logique progression + quiz)
  './js/pages/tutoriels-app.js',
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

// ─── Précache dynamique des scènes via scenes/index.json ───
// v2.61 — Symétrique à precacheFichesFromManifest. Avant cette version,
// les scènes individuelles n'étaient mises en cache qu'à la première visite ;
// un utilisateur qui installait la PWA puis passait offline avant d'avoir
// ouvert la moindre scène pouvait BROWSER la liste mais pas en LANCER une
// (le fetch /scenes/{id}.json retournait le fallback 503).
//
// Coût : ~143 scènes × ~30 KB = ~4–5 MB additionnels à l'install. Du même
// ordre que les fiches (~4.5 MB). Best-effort : si scenes/index.json est
// indisponible ou si certains fichiers manquent, on log et on continue.
async function precacheScenesFromIndex(cache) {
  try {
    const resp = await fetch('./scenes/index.json', { cache: 'no-store' });
    if (!resp.ok) return;
    const idx = await resp.json();
    if (!Array.isArray(idx)) return;
    const scenes = idx
      .map(s => s && s.id ? './scenes/' + s.id + '.json' : null)
      .filter(Boolean);
    await Promise.allSettled(scenes.map(url => cache.add(url)));
    console.log('[SW] Precached ' + scenes.length + ' scenes from index');
  } catch (e) {
    console.warn('[SW] Could not precache scenes from index:', e);
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
      // Fiches + scènes : best-effort, ne bloquent pas l'install.
      // Lancés en parallèle pour réduire le temps total d'install (les deux
      // précaches sont indépendants — pas de dépendance entre fiches et scènes).
      await Promise.all([
        precacheFichesFromManifest(cache),
        precacheScenesFromIndex(cache),
      ]);
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
