// Service Worker — CAS-IN Investigation Numérique
// v25 : ajout icônes PWA + offline.html + og-image.svg dans STATIC_ASSETS
// v24 : split de scenes.js en scenes/index.json + scenes/{id}.json
//       boot initial : 1.6 MB → 64 KB (-96 %)
//       chaque scène mise en cache séparément à la 1re visite
// v23 : extraction du JS inline de scene.html → js/scene-app.js + scene-ux-patch.js
// v22 : extraction du JS inline de quiz.html → js/quiz-app.js (cache séparé)
// v21 : alignement v2.4 (post-cleanup) — STATIC_ASSETS auto-régénéré
//       depuis manifest.json + filesystem (90 fiches au lieu de 47)
const CACHE_VERSION = 'cas-in-v25';

const STATIC_ASSETS = [
  // Pages racine
  './',
  './index.html',
  './quiz.html',
  './tp.html',
  './exam.html',
  './tools.html',
  './scene.html',

  // Manifests & data
  './manifest.json',
  './pwa.manifest.json',
  './offline.html',
  './og-image.svg',
  './favicon.ico',
  './icon-192.png',
  './icon-512.png',
  './questions.json',
  './counts.json',

  // Styles
  './style/landing.css',
  './style/style.css',
  './style/tp.css',
  './style/fiche_style.css',

  // Scripts partagés
  './js/landing.js',
  './js/cas-in-counts.js',
  './js/cas-in-pwa.js',
  './js/cas-in-search.js',
  './js/cas-in-export.js',
  './js/quiz-app.js',
  './js/scene-app.js',
  './js/scene-ux-patch.js',

  // Scénarios DFIR — index uniquement (network-first, ~64 KB)
  // Les 64 fichiers scenes/{id}.json sont mis en cache à la 1re visite (cache-first).
  // scenes.js (legacy) est conservé en fallback pour rétro-compatibilité.
  './scenes/index.json',
  './scenes.js',

  // TP
  './tp/tp-data.js',
  './tp/tp-engine.js',

  // Fiches (90) — auto-listé depuis manifest.json
  './fiches/index.html',
  './fiches/fiche-hub.css',
  './fiches/acquisition.html',
  './fiches/active_directory.html',
  './fiches/algorithmes_forensique.html',
  './fiches/anti_forensique.html',
  './fiches/apfs.html',
  './fiches/autopsy.html',
  './fiches/autorites_competences_ch.html',
  './fiches/browser_artifacts_deep_dive.html',
  './fiches/browser_forensique.html',
  './fiches/cassage_mdp.html',
  './fiches/chiffrement_volumes.html',
  './fiches/cloud_forensique.html',
  './fiches/comparaison_fs.html',
  './fiches/crypto.html',
  './fiches/cryptomonnaies.html',
  './fiches/disques.html',
  './fiches/dns_forensique.html',
  './fiches/dns_forensique_avance.html',
  './fiches/documents_office_forensique.html',
  './fiches/droit.html',
  './fiches/droit_europeen.html',
  './fiches/eimp_entraide.html',
  './fiches/email_forensique.html',
  './fiches/email_headers_smtp_forensique.html',
  './fiches/encodage.html',
  './fiches/exfat.html',
  './fiches/expert_witness_ch.html',
  './fiches/ext.html',
  './fiches/f2fs.html',
  './fiches/fat12.html',
  './fiches/fat16.html',
  './fiches/formats.html',
  './fiches/hash.html',
  './fiches/hfs.html',
  './fiches/incident_response.html',
  './fiches/iot_forensique.html',
  './fiches/kape_velociraptor.html',
  './fiches/log_forensique_avance.html',
  './fiches/logs_windows.html',
  './fiches/lscpt.html',
  './fiches/mac_times.html',
  './fiches/macos-linux.html',
  './fiches/malware_forensique.html',
  './fiches/mathematiques_forensique.html',
  './fiches/messagerie_im.html',
  './fiches/metadata_avancees.html',
  './fiches/methodologie.html',
  './fiches/mitre_attack.html',
  './fiches/mobile.html',
  './fiches/network_traffic_analysis_avance.html',
  './fiches/nldp.html',
  './fiches/ntfs.html',
  './fiches/osint.html',
  './fiches/outils.html',
  './fiches/pdf_forensique_avance.html',
  './fiches/pki_certificats.html',
  './fiches/powershell_forensique.html',
  './fiches/premier_intervenant.html',
  './fiches/preuve.html',
  './fiches/ram_forensique.html',
  './fiches/ransomware_forensique.html',
  './fiches/rapport_forensique.html',
  './fiches/refs.html',
  './fiches/registre_windows.html',
  './fiches/reseau.html',
  './fiches/reverse_engineering_101.html',
  './fiches/shellbags.html',
  './fiches/siem_logs.html',
  './fiches/sqlite_forensique.html',
  './fiches/sqlite_forensique_avance.html',
  './fiches/steganographie.html',
  './fiches/suisse.html',
  './fiches/sysmon.html',
  './fiches/threat_intel_ioc.html',
  './fiches/timeline.html',
  './fiches/tls_https_certificate_forensique.html',
  './fiches/tor_darkweb.html',
  './fiches/usb_forensique.html',
  './fiches/usb_removable_media_forensique.html',
  './fiches/vehicules_forensique.html',
  './fiches/vm_forensique.html',
  './fiches/volatilite.html',
  './fiches/volatility_memory_forensics.html',
  './fiches/windows.html',
  './fiches/windows_forensique.html',
  './fiches/windows_registry_forensique_avance.html',
  './fiches/wireshark_pcap.html',
  './fiches/wsl_forensique.html',
  './fiches/yara.html',
  './fiches/zimmerman.html',
];

// Page hors-ligne dédiée (fallback si la ressource n'est jamais passée par le cache)
const OFFLINE_FALLBACK = './offline.html';

// Installation : mise en cache des assets statiques
self.addEventListener('install', event => {
  console.log('[SW] Install ' + CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      // addAll() est atomique : si UNE ressource échoue, tout échoue.
      // On utilise addAll pour les ressources critiques, et add() pour
      // les fiches optionnelles afin que l'install ne saute pas si l'une
      // d'entre elles 404 (cas réel quand on déploie en plusieurs vagues).
      const critical = STATIC_ASSETS.filter(a => !a.startsWith('./fiches/') || a === './fiches/index.html');
      const optional = STATIC_ASSETS.filter(a => a.startsWith('./fiches/') && a !== './fiches/index.html');

      return cache.addAll(critical).then(() => {
        // Best-effort sur les fiches : on ignore les échecs individuels
        return Promise.allSettled(optional.map(url => cache.add(url)));
      }).catch(err => {
        console.warn('[SW] Critical asset failed:', err);
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

// Listener pour SKIP_WAITING (forcé par cas-in-pwa.js après update)
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
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
  const isScenesJS = url.pathname.endsWith('scenes.js'); // legacy, network-first
  const isSceneIndex = url.pathname.endsWith('/scenes/index.json');
  // Fichier de scène individuel : scenes/{id}.json (mais PAS index.json)
  const isSceneFile = /\/scenes\/[^/]+\.json$/.test(url.pathname) && !isSceneIndex;

  // ─── Cache-first pour les scènes individuelles (changent rarement)
  if (isSceneFile) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() =>
          new Response(JSON.stringify({error:'offline', scene: url.pathname.split('/').pop().replace('.json','')}),
            {status:503, headers:{'Content-Type':'application/json'}})
        );
      })
    );
    return;
  }

  // ─── Network-first pour HTML, autres JSON (questions, manifest, counts,
  //     scenes/index.json), et scenes.js legacy
  if (isHTML || isJSON || isScenesJS) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (isHTML) return caches.match(OFFLINE_FALLBACK);
          return new Response(JSON.stringify({error:'offline'}),
            {status:503, headers:{'Content-Type':'application/json'}});
        });
      })
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
        }).catch(() => {
          // Pour les ressources non-HTML : retourner 503 plutôt que de planter
          return new Response('', {status:503, statusText:'Offline'});
        });
      })
    );
  }
});
