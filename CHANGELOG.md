# Changelog

Toutes les modifications notables apportées à ce projet sont documentées ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [2.10] — 2026-04-30

Refactor structurel en 4 phases. Aucun changement fonctionnel pour l'utilisateur final hormis la correction de bugs UX listés en Phase 1. Ouverture d'`ARCHITECTURE.md` à la racine.

### Phase 1 — Bugs UX

- **`quiz.html` · daily-banner persistant** : le bouton ✕ utilisait `style.display='none'` sans persistence → la bannière revenait à chaque rechargement. Désormais `dismissDailyBanner()` (dans `quiz-ui-patch.js` ligne 632+) écrit `dailyBannerDismissed = today ISO` en localStorage, et masque automatiquement au boot si déjà fermé aujourd'hui.
- **`quiz.html` · `#fz-badge` valeur en dur** : le HTML contenait `<span id="fz-badge">1</span>`, donc avant que `quiz-app.js` ne tourne, l'utilisateur voyait « 1 freeze » même avec 0. Maintenant le span est vide et `updateFreezeBtn()` met `''` quand `S.streakFreezes === 0`, masqué via CSS `:empty`.
- **`quiz.html` · titre du `#streak-display` incohérent avec la donnée** : le `title` disait « Série quotidienne » mais `updateStreakDisplay()` y plaçait `S.streak` (série de bonnes réponses du quiz courant). Titre corrigé en « Série de bonnes réponses (session) ».
- **`quiz.html` / `scene.html` / `tp.html` · ordre de chargement des scripts non documenté** : ajout d'un commentaire `<!-- ⚠ ORDRE CRITIQUE — ne pas réordonner -->` au-dessus des `<script defer>` dépendant de `window.Profile`. Voir `ARCHITECTURE.md` § « Couches & ordre de chargement ».

### Phase 2 — Suppression scores doublons

Le rang/XP/streak quotidien étaient affichés à 5 endroits : `index.html` drawer, `profile.html` hero, `quiz.html#xp-wrap`, `scene.html#grade-mini` + `#grade-card`, et `profile-banner` transversal. Trois rendus différents avec **trois systèmes de seuils** (`RANKS` quiz-app, `GRADES` scene-app, `Profile.TRACKS.ranks`) → l'utilisateur pouvait voir des rangs incohérents selon la page.

- **`quiz.html`** : retrait de `#xp-wrap` (anneau XP + rang local + streak local + freeze) et `#avatar-chip`. Info redondante avec `profile-banner`. Le bouton 🧊 « Streak Freeze » est déplacé dans le menu ⋯ avec une pill inline (CSS `:empty` pour masquer quand 0). « Modifier profil » ajouté également au menu ⋯ pour préserver l'accès à `openAvatarSetup()`.
- **`scene.html`** : retrait de `#grade-badge-mini` du header. Un nouveau bouton 🏅 prend sa place pour préserver l'accès à `openBadgesPanel()`. Le `#grade-card` du lobby est conservé (élément narratif important sur l'écran d'accueil simulation, à recâbler en Phase 5 sur `Profile.getRank()`).
- **`quiz-app.js#updateXpBar()`** et **`scene-app.js#updateGradeDisplay()`** : ajout de guards `if (el)` sur chaque accès DOM (les fonctions continuent d'être appelées par les call-sites mais ne plantent plus si l'élément a été retiré).
- **`style/quiz.css#fz-badge`** : repositionné de l'ancien overlay corner vers une pill inline pour le menu ⋯, masqué via `:empty`.

### Phase 3 — Extraction des `<style>` inline

Les pages avaient leur CSS inline dans `<style>…</style>`, ce qui :
- empêchait la mise en cache séparée du CSS,
- gonflait chaque GET HTML,
- bloquait toute CSP `style-src` stricte.

| Page         | Avant (`<style>` inline) | Après (HTML)   | Nouveau CSS              |
|--------------|--------------------------|----------------|--------------------------|
| `scene.html` | 87 KB                    | 23 KB          | `style/scene.css` 64 KB   |
| `tp.html`    | 39 KB                    | 28 KB          | `style/tp-page.css` 11 KB |
| `tools.html` | 33 KB                    | 27 KB          | `style/tools.css` 6 KB    |
| `exam.html`  | 23 KB                    | 11 KB          | `style/exam.css` 12 KB    |

Note : `style/tp.css` existait déjà pour le moteur d'exercices TP — le nouveau `style/tp-page.css` couvre uniquement le chrome de `tp.html`.

### Phase 4 — Réorganisation `js/`

Le dossier `js/` plat de 21 fichiers est réorganisé en 4 sous-dossiers reflétant les couches d'architecture :

```
js/
├── core/        cas-in-profile.js, cas-in-counts.js, cas-in-export.js,
│                cas-in-pwa.js, cas-in-search.js
├── profile/     profile-banner.js, profile-page.js, profile-track-v5.js
├── bridges/     quiz-profile-bridge.js, scene-profile-bridge.js,
│                tp-profile-bridge.js
└── pages/       landing.js, landing-3d.js, quiz-app.js, quiz-ui-patch.js,
                 scene-app.js, scene-engine-v4.js, scene-lobby-v3.js,
                 scene-ux-patch.js, exam-app.js, tools-app.js
```

- **38 références `<script src="js/X.js">`** mises à jour dans 7 HTMLs.
- **`sw.js` v30 → v31** : `STATIC_ASSETS` regénéré avec les nouveaux chemins, regroupé par couche avec commentaires explicatifs.
- **`ARCHITECTURE.md`** créé à la racine, ~7 KB, documente la stack en 4 couches, l'ordre de chargement obligatoire, le mapping des clés localStorage, et la dette technique restante (sharding `questions.json`, élimination de `bridges/`, unification des rangs, fusion des achievements).

### Future work documenté (non exécuté)

Voir `ARCHITECTURE.md` § « Future work » pour les chantiers identifiés mais non touchés en v2.10 :
- Sharding `questions.json` (2.5 MB monolithique) sur le modèle de `scenes/index.json + lazy fetch`.
- **Phase 5 : élimination du proxy `Storage.prototype` des `bridges/`** par refactor de `quiz-app.js` / `scene-app.js` pour appeler `Profile.addXp()` directement. Préalable : audit des achievements liés aux seuils legacy.
- **Unification `RANKS` / `GRADES` / `Profile.TRACKS.ranks`** sur `Profile.getRank()` unique. Migration `casIn_profile` v=2 → v=3 nécessaire pour ré-aligner les seuils débloqués historiquement.
- Fusion `quiz-app.js#ACHIEVEMENTS` + `scene-app.js#GLOBAL_BADGES` + `Profile.achievements` dans un futur `js/core/cas-in-achievements.js`.
- Performance `profile-banner.js` : passer du `innerHTML=…` complet à des updates ciblés `textContent`.

## [2.9] — 2026-04-29

### 📚 Nouveau — Extension du corpus des fiches

#### 3 nouvelles fiches forensique (~30 KB chacune)

- **`ios_forensique.html`** — iOS forensique opérationnel : états AFU/BFU, méthodes d'acquisition par génération SoC (A7-A11 checkm8, A12+ Cellebrite Premium, A16+ logical), comparatif des outils commerciaux (Cellebrite UFED/Premium, GrayKey, Magnet AXIOM, Oxygen, iLEAPP), artefacts clés (sms.db, CallHistory, knowledgeC.db, Photos, Safari, Mail, Notes, Health, Locations, WhatsApp/Telegram/Signal), deep-dive sur knowledgeC.db avec exemple SQL et conversion Mac Absolute Time, classes de protection Keychain, voies d'accès iCloud Backup (MLAT, Apple ID, token), Advanced Data Protection E2EE iOS 16.2+, impact du Lockdown Mode iOS 16+, workflow d'acquisition en 5 étapes, cadre juridique suisse (art. 263/248/269/282 CPP, art. 67 EIMP, art. 22 LPD).

- **`android_forensique.html`** — Android forensique : différences FBE vs FDE et metadata encryption Android 11+, 5 niveaux d'acquisition (Manual/Logical/File System/Physical/Chip-off), exploits SoC (Qualcomm EDL, MediaTek BROM via mtkclient, risques Knox tripping Samsung), workflow ADB complet avec exemples de commandes, artefacts clés (accounts.db, contacts2.db, mmssms.db, WhatsApp msgstore.db, Telegram cache4.db, Signal SQLCipher, Chrome, Gmail, Maps, WifiConfigStore.xml en clair), deep-dive usagestats (équivalent Android du knowledgeC.db avec sous-dossiers daily/weekly/monthly/yearly), Knox & Secure Folder, TWRP & custom recovery (risques de wipe sur bootloader unlock), comparatif outils commerciaux (Cellebrite UFED/Premium, Magnet AXIOM, Oxygen, MOBILedit, ALEAPP, Andriller), workflow en 4 étapes, cadre juridique suisse (art. 263/248/269/269bis CPP, art. 22 LPD).

- **`m365_forensique.html`** — Microsoft 365 forensique cloud : panorama des sources de logs (Azure AD, Exchange Online, SharePoint, OneDrive, Teams, Defender, Purview), Unified Audit Log (UAL) avec exemples PowerShell complets, MailItemsAccessed pour BEC investigation (différenciation Bind vs Sync, lecture des résultats JSON), Azure AD Sign-ins (sign-in logs, audit logs, risk events, provisioning logs), eDiscovery & Purview (Content Search, eDiscovery Standard/Premium), playbook de 3 attaques typiques (BEC, token theft via Evilginx, apps OAuth malicieuses), Microsoft Graph API pour collecte programmatique, Defender XDR & Sentinel avec exemples KQL, 7 pièges récurrents (UAL non activé, MailItemsAccessed E5-only, suppression rapide des règles, désync timestamps, pagination 5000 résultats), workflow Suisse typique en cas de BEC (plainte CP 146/143, réquisition CPP 265, EIMP via OFJ).

### 🔧 Corrections — Métadonnées du manifest

`manifest.json` : correction des **26 fiches** marquées `"desc": "(à compléter)"` qui sont en réalité **bien remplies** (20-58 KB chacune). 22 descriptions ont été curées à la main pour refléter le contenu réel, 4 ont été extraites automatiquement depuis les `<meta description>`/sous-titres des fiches.

Fiches corrigées : `algorithmes_forensique`, `browser_artifacts_deep_dive`, `dns_forensique`, `dns_forensique_avance`, `documents_office_forensique`, `email_headers_smtp_forensique`, `expert_witness_ch`, `f2fs`, `log_forensique_avance`, `lscpt`, `mathematiques_forensique`, `metadata_avancees`, `mitre_attack`, `network_traffic_analysis_avance`, `pdf_forensique_avance`, `powershell_forensique`, `refs`, `reverse_engineering_101`, `sqlite_forensique_avance`, `sysmon`, `threat_intel_ioc`, `tls_https_certificate_forensique`, `usb_removable_media_forensique`, `volatility_memory_forensics`, `windows_registry_forensique_avance`, `yara`.

Conséquence visible : la recherche globale `Ctrl+K` retourne maintenant des résultats pertinents pour ces 26 fiches au lieu d'afficher "(à compléter)".

### 📊 Compteurs

- `manifest.json` : 92 → 95 fiches
- `counts.json` : `fiches: 92 → 95`
- `fiches/index.html` : 92 → 95 cartes
- `sw.js` : v29 → v30, +3 fiches dans STATIC_ASSETS

### 🎯 Couverture finale du corpus (95 fiches)

| Catégorie | Avant | Après | Notes |
|---|---|---|---|
| Systèmes de fichiers | 13 | 13 | NTFS, FAT, exFAT, EXT, APFS, HFS+, ReFS, F2FS |
| Acquisition & méthodes | 19 | 19 | KAPE, Velociraptor, Autopsy, X-Ways, Volatility, Plaso, Zimmerman |
| Windows | 12 | 12 | Registry, Event Logs, ShellBags, AD, PowerShell, Sysmon, WSL |
| Cryptologie & sécurité | 15 | 15 | Hashing, PKI, Stegano, MITRE ATT&CK, YARA, Threat Intel, RE |
| Réseaux | 14 | 14 | Wireshark, DNS, Email, SQLite, Tor, OSINT, SIEM |
| Plateformes & Cloud | 10 | **13** | +iOS, +Android, +M365 ⭐ |
| Droit suisse | 9 | 9 | CPP, LPD, EIMP, LSCPT, autorités, expert witness |

Le corpus couvre désormais en profondeur la **forensique mobile** (iOS + Android) et la **forensique cloud Microsoft** — sujets qui représentent ensemble ~70% des enquêtes modernes en Suisse romande.

## [2.8] — 2026-04-29

### 🚀 Nouveau — Patches modulaires v3 / v4 / v5

#### Lobby UX v3 (`js/scene-lobby-v3.js`, 949 lignes)
- **13 parcours pédagogiques** curated couvrant 88/90 scénarios (Fondamentaux, Procédure pénale, Ransomware A→Z, IA & deepfakes, Coopération internationale, Darknet, Infrastructures critiques, Cas 2024-2026, Forensique avancée, Social engineering, Fuites de données, Cas humains, Sécurité d'État).
- **Bouton « Continuer »** : carte épinglée en haut du lobby si un scénario est en cours (étape X/Y, temps relatif). Tracking via `cas_inflight` localStorage, hooks sur `startScene`/`showReport`, polling 2s sur `stepIdx`.
- **Tri configurable** : recommandé / difficulté ↑↓ / récents / à reprendre (≤80%).
- **7 chips d'atmosphère** : Légal, Réseau, Ransomware, Crypto, Hôpital, État, Terrain — cumulables avec les filtres existants.
- **8 nouveaux badges de découverte** (push sur `GLOBAL_BADGES`) : Explorateur d'atmosphères, Maître des atmosphères, Premier Parcours, Érudit DFIR, Maître des Parcours, Spécialiste romand, Chasseur d'affaires réelles, Grimpeur.

#### Scene Engine v4 (`js/scene-engine-v4.js`, 1146 lignes)
- **Briefing repensé** : fiche d'identité (durée estimée, décisions, niveau, atmosphère, articles centraux extraits de `legalRefs`), objectifs visibles (gère format string ET object), pré-warning automatique pour les scénarios sensibles (mineur, suicide, pédocriminalité, harcèlement…).
- **Récap exportable** : trois nouveaux boutons sur l'écran rapport — `📑 Exporter MD` (télécharge un `.md` daté), `📋 Copier` (presse-papiers), `📖 Réviser`. Format markdown complet : toutes les options marquées (👉 = choisie, ✓/✗/🚨 = qualité), feedback complet, références juridiques.
- **Mode révision** : rejoue le scénario complété en mode étude. Toutes les options annotées dès l'affichage (✓/✗, points, feedback, ref. légale), pas de scoring, pas de timer, pas de sauvegarde. Bandeau violet, sortie possible à tout moment.
- **Glossaire des articles de loi** : tooltip click-to-expand sur "art. X CPP/CP/CC/...". 127 entrées documentées (CPP, CP, CC, EIMP, Cst, CEDH, PPMin, LB, LFINMA, LPD, LPers, LMP, LParl), couverture 92% des occurrences du corpus. Lien vers fiche HTML correspondante quand pertinente.

#### Profile Track v5 (`js/profile-track-v5.js`, 1212 lignes)
- **Sélecteur enrichi** : chaque carte de rôle montre la mini-timeline des 12 rangs (avec emojis), la voie en mini-paragraphe, les 3 forces clés, et un cas typique. Hover sur emoji = nom du rang en tooltip.
- **Mini-test d'orientation** : bouton "🎯 Trouver mon rôle" → 4 questions courtes → recommandation argumentée (gère égalités). Bouton "Choisir au feeling" toujours accessible.
- **Banner thématisé** : couleur liée au track (cyan/orange/vert/rouge), emoji du rang en plus grand avec drop-shadow, sous-titre du rôle ajouté. Visible sur scene/quiz/tp.
- **Promotions célébrées** : détection via `Profile.onChange()`, toast plein écran 5s avec emoji animé pulse, sweep doré conique en arrière-plan, son discret WebAudio (3 notes C5-E5-G5), vibration mobile. File d'attente pour gros gains XP qui déclenchent plusieurs promotions en cascade.

### 🛠 Service Worker v29

`sw.js` : ajout des **14 fichiers JS/CSS manquants** dans `STATIC_ASSETS` :
- 11 JS : `cas-in-profile.js`, `landing-3d.js`, `profile-banner.js`, `profile-page.js`, `profile-track-v5.js`, `quiz-profile-bridge.js`, `quiz-ui-patch.js`, `scene-engine-v4.js`, `scene-lobby-v3.js`, `scene-profile-bridge.js`, `tp-profile-bridge.js`
- 3 CSS : `profile-banner.css`, `profile.css`, `quiz.css`

Ces fichiers fonctionnaient online (cache-first avec fallback fetch) mais **n'étaient pas pré-cachés** lors de l'install/update du SW. Conséquence : install PWA fraîche en mode offline → 503 sur ces fichiers, app cassée. Le bump `v28 → v29` force le re-cache complet.

### 🐛 Corrections

#### Manifest fiches incomplet
- **`manifest.json`** : ajout de `linux_forensique.html` et `macos_forensique.html` (2 fiches présentes sur disque, liées depuis `fiches/index.html`, mais absentes du manifest). Catégorie `plateformes`.
- **`counts.json`** : régénéré, `fiches: 90 → 92`.

#### Bug PWA links sur 3 HTMLs
- `index.html`, `quiz.html`, `profile.html` : `<link rel="manifest" href="manifest.json">` → `<link rel="manifest" href="pwa.manifest.json">`. Le premier était l'index des fiches, pas le manifest PWA W3C.

#### Suppressions
- `scenes.js` (1.67 MB legacy) : confirmé supprimé. Le CHANGELOG [2.6] le prévoyait.
- 3 brouillons `scenes/*.js` (competence_mpc_vs, deepfake_electoral, hydro_valais) : supprimés. Pendants `.json` actifs.

### 🧹 Optimisations

- **`index.html`** : retrait de `profile-track-v5.js` (44 KB chargés pour rien — la landing n'a pas de banner).
- **`scripts/generate_counts.py`** : refonte de `count_scenes()` pour lire `scenes/index.json` (source de vérité depuis le refactor v3.0) au lieu de chercher l'ancien `scenes.js`. Avant : retournait `0`. Maintenant : retourne `90`.
- **`manifest.json`** : `$comment` enrichi avec un avertissement explicite "ce fichier N'EST PAS le manifest PWA — voir pwa.manifest.json" pour éviter la confusion future.

### 📝 Documentation

- **`README.md`** : mises à jour de cohérence — `64 scénarios` → `90`, `1630 questions` → `1750`, `90 fiches` → `92`, suppression mention `scenes.js`, ajout d'une section "Patches modulaires (lazy plugins)" décrivant les couches v3/v4/v5, version SW dans le tableau PWA `v21` → `v29`, ajout du dossier `scenes/` dans l'arborescence.

### Architecture cumulative finale

5 couches indépendantes empilables :

| Couche | Lignes | Rôle |
|---|---|---|
| `scene-app.js` | 3009 | Noyau scènes (intouché) |
| `cas-in-profile.js` | 682 | Système de profil unifié (4 tracks × 12 rangs) |
| `scene-ux-patch.js` | 868 | UX v2 (timers, médailles, atmosphère adaptative) |
| `scene-lobby-v3.js` | 949 | Parcours, continuer, tri, atmosphère, achievements |
| `scene-engine-v4.js` | 1146 | Briefing, récap, révision, glossaire |
| `profile-track-v5.js` | 1212 | Sélecteur enrichi, test, promotions |

Chaque couche se désactive en retirant sa balise `<script>` du HTML. Aucune modification du noyau, rollback total possible.

## [2.7] — 2026-04-28

### 🟢 Polish — Cohérence finale post-refactor

#### Modifié
- `sw.js` v25 : ajout de `offline.html`, `og-image.svg`, `favicon.ico`,
  `icon-192.png`, `icon-512.png` dans `STATIC_ASSETS` pour qu'ils soient
  disponibles offline.
- `pwa.manifest.json` : description mise à jour ("64 scénarios" au lieu de "47").
- `index.html` : footer v2.6 → v2.7.
- Workflow `Check questions.yml` renommé en `check-questions.yml`
  (le nom avec espace bloquait le trigger sur self-update).
- 3 scripts obsolètes supprimés : `Check questions.py` (doublon),
  `Generate counts.py` (version cassée), `Inject fiche enhancements.py`
  (référence un fichier mort).

#### Ajouté
- `favicon.ico`, `icon-192.png`, `icon-512.png` à la racine — l'app PWA
  s'installe désormais avec une icône propre sur iOS et Android.
- `scenes/` complet (65 fichiers : index + 64 scènes individuelles).
- `counts.json` régénéré avec la structure complète (clé `tp_exercises`
  restaurée, `tp_categories=25` corrigé).

### 🟡 Refactor — Split de `scenes.js` en `scenes/index.json` + `scenes/{id}.json` (audit P1-C)

`scenes.js` (1.6 MB monolithique) chargeait au boot **toutes les 64 scènes
DFIR avec leurs steps complets**, même si l'utilisateur voulait seulement
voir le lobby.

#### Architecture nouvelle

```
scenes.js (legacy, 1.6 MB)  →  scenes/index.json (~64 KB)
                                 + scenes/{id}.json × 64
                                   (~25 KB chacun, lazy-loadés)
```

| Phase | Avant (v2.6) | Après (v2.7) | Gain |
|---|---|---|---|
| Boot scene.html | 1.6 MB de JS parsé | 64 KB de JSON | **-96 %** |
| RAM au boot | 64 scénarios complets | 64 méta légères | -90 % env. |
| Cache invalidé par 1 modif | 1.6 MB | 25 KB (1 fichier) | -98 % |

#### Ajouté
- `scripts/split_scenes.py` — script Python idempotent qui parse
  `scenes.js` (`var SCENES = [...]`) et génère `scenes/index.json` (méta) +
  `scenes/{id}.json` (contenu complet par scène). À rejouer après chaque
  modif de `scenes.js`.
- `scenes/index.json` (64 KB) — index léger pour le lobby et la recherche.
- `scenes/{id}.json` × 64 — un fichier par scène (10–51 KB).

#### Modifié
- `js/scene-app.js` : nouvelle couche async (`loadSceneIndex`,
  `loadFullScene`, `hydrateScene` avec cache LRU 12). 6 sites de
  `startScene(scene)` patchés pour passer par `hydrateScene` avec gestion
  d'erreur. Compatible legacy : si `scenes.js` est encore chargé, on s'en
  sert en court-circuit.
- `js/cas-in-search.js` : lit `scenes/index.json` en priorité, fallback
  `scenes.js` legacy.
- `scene.html` : balise `<script src="scenes.js">` commentée. L'index est
  chargé à la demande par `scene-app.js`.
- `sw.js` v24-v25 : `scenes/index.json` en network-first, `scenes/{id}.json`
  en cache-first (changent rarement).

`scenes.js` reste conservé comme **fallback legacy**. Suppression prévue
en v3.0 quand le déploiement v2.7 sera stable depuis quelques semaines.

---

## [2.6] — 2026-04-28

### 🟡 Refactor — Extraction du JS inline de `scene.html` (audit P1-B)

`scene.html` contenait **3 256 lignes de JavaScript inline** réparties dans
2 blocs `<script>` (un pour le moteur principal, un pour le UX patch v2).

#### Modifié
- `scene.html` : 5 006 → 1 750 lignes (-65 %, gain ~80 KB cacheable
  séparément). Le bloc 1 (5 lignes — guard `SCENES`) reste inline car il
  sert de bootstrap. Les blocs 2 et 3 sont remplacés par `<script src="...">`.
- `sw.js` v23 : ajoute `js/scene-app.js` et `js/scene-ux-patch.js` à
  `STATIC_ASSETS`.

#### Ajouté
- `js/scene-app.js` (2 561 lignes — moteur principal des scénarios DFIR) :
  storage utils, PRNG Mulberry32, streak/badges, profil, recommandations,
  stats screen + radar, cinema mode, canton map, timeline popup, lobby,
  run scenario.
- `js/scene-ux-patch.js` (731 lignes — UX Patch v2 wrappé en IIFE) :
  injection CSS dynamique, tension bar, glossaire inline, tooltips.

Bit-pour-bit identique au bloc inline original (vérifié par `diff`).
25/25 fonctions appelées par les `onclick="..."` du HTML restent globales.

---

## [2.5] — 2026-04-28

### 🟡 Refactor — Extraction du JS inline de `quiz.html` (audit P1-A)

`quiz.html` contenait **6 558 lignes de JavaScript inline** dans une seule
balise `<script>`. Conséquences avant refactor : chaque correction de typo
dans une explication forçait le navigateur à re-télécharger 365 KB.

#### Modifié
- `quiz.html` : 7 161 → 603 lignes. Le bloc `<script>` inline est remplacé
  par `<script src="js/quiz-app.js" defer></script>`. Aucune logique
  modifiée : le contenu extrait est bit-pour-bit identique à l'original.
- `sw.js` v22 : ajoute `js/quiz-app.js` à `STATIC_ASSETS`.

#### Ajouté
- `js/quiz-app.js` (322 KB) : 95 fonctions, 21 rangs, 41 achievements,
  83 entrées glossaire, modes Examen/Survie/Mission/SM2/Daily, gamification
  XP/streak/combo, share card, focus mode, mode Konami, Double-or-Nothing.

### 🟢 Ajouté — Export/Import de progression (audit P1-D)

Permet aux utilisateurs de sauvegarder toute leur progression dans un
fichier JSON, et de la restaurer dans un autre navigateur ou après
réinstallation.

#### Nouveau fichier `js/cas-in-export.js`

API exposée sur `window.CasInExport` :
- `exportProgress()` — déclenche un téléchargement
  `cas-in-progression-YYYY-MM-DD.json` contenant toutes les clés
  `localStorage` du namespace CAS-IN plus un résumé human-readable.
- `openImportDialog()` — sélecteur de fichier, prévisualise le contenu
  (date, XP, fiches lues, examens…), demande confirmation puis applique.
- `previewImport(json)` — valide un JSON sans rien écrire.

Format versionné `cas-in-progress/v1`. Whitelist stricte (seules les clés
du namespace CAS-IN sont exportées). Aucun appel réseau — tout reste local.

#### UI
- Drawer profil de la landing : 2 nouveaux boutons (`⤓ Exporter` /
  `⤒ Importer`) dans une section dédiée "SAUVEGARDE".

---

## [2.4] — 2026-04-28

### 🔴 Cleanup — Audit qualité massive

#### Supprimé / Corrigé
- **`questions.json`** : 1 750 → 1 630 questions (suppression de
  120 stubs/doublons), thèmes normalisés (10 thèmes canoniques),
  93 anomalies QC → 1 (faux positif EPFL ABC/abc, intentionnel
  pédagogique).
- **`manifest.json`** régénéré : 47 → 90 fiches (les 43 fiches manquantes
  étaient présentes physiquement mais absentes du manifest).
- Hardcodes `1439`, `54`, `18`, `20` (anciens compteurs figés) supprimés
  de tous les HTML/JS — remplacés par `data-count="..."`.
- `js/landing.js` : clé localStorage incohérente corrigée
  (`casIn_questionsSeen` partout), hardcodes supprimés.
- `js/cas-in-search.js` : utilise désormais l'index complet (1 630
  questions + 64 scènes) au lieu de 1 500 questions sans scènes.

#### Ajouté
- `offline.html` — page fallback PWA quand l'utilisateur navigue offline
  vers une page non cachée.
- `og-image.svg` — image de prévisualisation pour les partages sociaux.
- `sw.js` v21 — `STATIC_ASSETS` auto-régénéré depuis `manifest.json`,
  les 90 fiches sont en cache-first.

---

## [2.3] — 2026-04-23

### Ajouté
- `.gitignore` pour ignorer les fichiers OS, éditeurs et fichiers
  temporaires
- `.editorconfig` pour la cohérence d'édition entre éditeurs
- `README.md` documentant l'architecture, les technos et les raccourcis
  clavier
- `CHANGELOG.md` (ce fichier) pour tracer les versions
- `scripts/generate_counts.py` qui génère `counts.json` depuis le
  `manifest.json` et `questions.json`
- `counts.json` — source unique des nombres affichés
- `.github/workflows/check-questions.yml` qui valide `questions.json` et
  régénère `counts.json` à chaque push

---

## [2.2] — 2026-04-22

### Ajouté
- Landing page redesign avec pilules Matrix-style
- `manifest.json` comme source de vérité pour les fiches
- Script `scripts/check_questions.py` pour le QC de `questions.json`
- Workflow GitHub Actions `.github/workflows/check-questions.yml`

### Modifié
- Structure du repo réorganisée (`fiches/`, `tp/`, `style/`, `scripts/`)
- Service Worker v15 avec stratégie Network-First (HTML) +
  Cache-First (statiques)

---

## [2.0 – 2.1] — 2026

Versions initiales avant le grand audit de avril 2026.
