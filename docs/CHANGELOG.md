# Changelog

Toutes les modifications notables apportées à ce projet sont documentées ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [2.63] — 2026-05-09

🧹 **Suppression de doublons morts dans `js/pages/` — récupération de deux fixes v2.60 oubliés au passage.**

### Corrigé

- **Horloge UTC du status bar profil — fix v2.60 jamais déployé en prod.** Le CHANGELOG v2.60 annonçait que l'horloge UTC du dossier (`#profile-utc`) tickait désormais en live (alignée sur la minute suivante via `60_000 - Date.now() % 60_000`, puis `setInterval(60_000)`). Le code du fix existait bien — mais dans `js/pages/profile-page.js`, qui n'était **chargé par aucune page** (ni HTML ni `STATIC_ASSETS` du SW). La version live, `js/profile/profile-page.js`, est restée avec l'horloge gelée pendant 3 versions. Les utilisateurs avec un dossier ouvert 30 min voyaient encore l'heure d'arrivée. Fix porté ligne pour ligne dans le bon fichier (`paintUtcClock()` extrait + tick installé en fin de `boot()`).
- **Cérémonie `dossier-activated` — même symptôme.** L'event `dossier-activated` est correctement dispatché par `cas-in-profile.js#addXp()` à la 1re XP, mais le listener qui jouait le toast « Dossier activé · Approuvé par R.R aka Banzaï » était dans `js/pages/celebration-ui.js` (orphelin). Conséquence : depuis v2.60, **aucun nouvel utilisateur n'a vu cette cérémonie**. Listener porté dans `js/profile/celebration-ui.js`.

### Supprimé

- **`js/pages/profile-page.js`** (37 KB) — orphelin, non référencé par les HTML ni par `STATIC_ASSETS` du SW. La version live est `js/profile/profile-page.js`. Reliquat d'un refactor v2.10 (déplacement de la logique profil vers `js/profile/`) qui a laissé la copie source en place. Le fait que des fixes y aient atterri prouve que la confusion a déjà coûté.
- **`js/pages/celebration-ui.js`** (3.6 KB) — idem, orphelin du même refactor.

### Notes techniques

- **Comment a-t-on raté ça pendant 3 versions ?** Les deux fichiers orphelins ont survécu parce qu'ils ne génèrent aucune erreur runtime (jamais chargés ⇒ jamais exécutés ⇒ silencieux). Quand un dev a édité « profile-page.js » via fuzzy-find dans son IDE, il a touché celui qui était dans son onglet le plus récent — pas celui qui tourne en prod. Sans test fonctionnel sur l'horloge ni sur l'event `dossier-activated`, la dérive est passée sous le radar du `node --check` (qui valide la syntaxe, pas la pertinence du fichier).
- **Garde-fou pour l'avenir.** Un test qui ouvrirait `profile.html` headless et vérifierait que `#profile-utc` change après 65 s aurait attrapé ça. Idem un grep de couverture qui croise les `*.js` du dossier avec ce qui est référencé dans HTML + `STATIC_ASSETS`. À ajouter dans la prochaine itération outillage.
- **`CACHE_VERSION` bumpé** v142 → v143 pour propager les fixes UTC + dossier-activated aux installations existantes.
- **Tests** : `tests/test-cas-in.js` et `tests/test-achievements-sync.js` passent (51 OK, 0 FAIL).

### Migration

- Aucune côté utilisateur. Au prochain chargement, le banner d'update propose « Recharger », et l'horloge se met à ticker + la cérémonie d'activation sera jouée à la 1re XP (uniquement pour les profils qui ne l'ont pas encore activé — `firstXpAt === null`).

---

## [2.62] — 2026-05-08

🔧 **Réparation de 17 fiches cassées + sync complet index/search + retrait dépendance CDN.**

### Corrigé

- **17 fiches avaient un JS invalide qui empêchait l'init de leurs comportements UX** (scroll-progress, back-top button) : `acquisition.html`, `autopsy.html`, `browser_forensique.html`, `data_carving.html`, `eimp_entraide.html`, `email_forensique.html`, `encodage.html`, `ext.html`, `formats.html`, `mac_times.html`, `macos-linux.html`, `outils.html`, `preuve.html`, `ram_forensique.html`, `reseau.html`, `suisse.html`, `wireshark_pcap.html`. Erreur consistante : `Uncaught SyntaxError: Unexpected token '}'`. Les fiches s'affichaient mais sans la barre de progression ni le bouton retour-haut.
- **Cause** : la regex `P_SCROLL_DIRECT` dans `scripts/migrate_fiche_common.py` utilisait `[^;]+;?` pour capturer le corps d'un `addEventListener('scroll', function(){...}, {passive:true})`. Or ce corps contient DEUX `;` (un dans `bar.style.width = ...;` et un final). La regex stoppait au premier, supprimant l'OUVERTURE de l'addEventListener et laissant le corps + la fermeture orphelins. Patchée v2.62 : capture explicite du callback complet `function(){[^}]*}` plus la close-paren et options optionnelles.
- **`fiches/index.html` n'affichait que 111 fiches sur 112** : `shellbags_osint_pivot.html` (« ShellBags ↔ OSINT — Cross-corrélation ») était orpheline — non listée sur l'index, non indexée par la recherche, accessible uniquement par URL directe. Réparé en re-runnant `scripts/build_index.py` (qui détecte correctement la catégorie via le breadcrumb HTML) et `scripts/build_search_index.py`. Désormais 112 fiches partout.
- **`algorithmes_forensique.html` dépendait d'un CDN externe** (`cdnjs.cloudflare.com/ajax/libs/crypto-js`) pour calculer MD5/SHA-1/SHA-256 — incompatible avec la PWA offline. Migré vers la **Web Crypto API native** (`crypto.subtle.digest('SHA-1' | 'SHA-256', …)`, supportée tous navigateurs modernes, fully offline) plus une **implémentation MD5 inline RFC 1321** (~2 KB minifiée — Web Crypto ne supporte pas MD5 car cassé, mais reste utile pour vérifier des hashes legacy en forensique). 12/12 vecteurs RFC validés.

### Notes techniques

- **`data/search-index.json` régénéré** : 112 fiches, 931 sections, 7216 termes indexés (was 111/925/~7150). Taille : 625 KB.
- **`CACHE_VERSION` bumpé** v141 → v142 pour propager les fiches corrigées aux installations existantes (le SW déclenche le banner d'update au prochain chargement, l'utilisateur clique « Recharger », le nouveau cache prend les fiches réparées).
- **Vérification end-to-end** : 112/112 fiches rendent sans erreur JS (filtré le bruit Google Fonts), 25/25 requêtes test du moteur de recherche retournent des résultats pertinents (`shellbags`, `osint`, `viège`, `ntfs`, `ram`, `autopsy`, `ransomware`, `bitcoin`, `tor`, `CPP`, `EIMP`, `velociraptor`, `cellebrite`, `e01`, `magic bytes`, …).

### Migration

- **Aucune côté utilisateur**. Au prochain chargement, le banner d'update propose « Recharger » → nouvelles fiches en cache.
- **Côté contributeurs** : si vous re-lancez `migrate_fiche_common.py` sur une fiche au passé, **utilisez la version corrigée v2.62**. L'ancienne version corrompait les fiches avec un addEventListener scroll-progress hors IIFE.

---

## [2.61] — 2026-05-08

📡 **PWA offline-first complète — précache scènes + start_url corrigé.**

### Ajouté

- **Précache des scènes à l'install** (`sw.js` : `precacheScenesFromIndex()`) : symétrique à `precacheFichesFromManifest()`. Lit `scenes/index.json` au moment de l'install, mappe chaque entrée vers `./scenes/{id}.json` et les ajoute au cache via `Promise.allSettled` (best-effort, 404 individuels ignorés). Avant cette version, un utilisateur qui installait la PWA puis passait offline avant d'ouvrir la moindre scène pouvait **lister** les scènes mais pas en **lancer** une seule (le fetch retournait le fallback 503). Coût : ~143 scènes × ~30 KB ≈ 4–5 MB additionnels à l'install, du même ordre que les fiches (~4.5 MB). Lancé en parallèle avec le précache fiches via `Promise.all` pour ne pas allonger le temps total d'install.

### Corrigé

- **`start_url` du manifest PWA** : `./scene.html` → `./` (la home `index.html`). Avant, l'utilisateur qui installait depuis la home et lançait l'app depuis l'icône atterrissait sur la page Scènes au lieu du hub central — incohérent avec l'attente créée par le bouton « Installer » présent sur la home.
- **`offline.html` chargeait deux scripts inutiles** (`js/components/fiche-search.js` et `js/components/search-modal.js`, en `defer`) alors que la page n'a aucun champ de recherche. Supprimés : la page hors-ligne reste minimale et purement déclarative.

### Notes techniques

- **`CACHE_VERSION` bumpé** : `cas-in-v140` → `cas-in-v141` pour forcer la réinstallation du SW chez les utilisateurs déjà à jour. Le précache des scènes ajoute ~5 MB au cache mais l'install reste best-effort : si `scenes/index.json` est inaccessible, on continue sans bloquer.
- **Vérifié end-to-end** via Playwright (Chromium headless + serveur local + kill du serveur en cours de test pour simuler vraie offline) : 230 entrées en cache après install, fiches index + 3 fiches au hasard ouvrent offline, fallback `offline.html` servi correctement quand la page n'est pas cachée et que le réseau est down.

### Migration

- Aucune. L'utilisateur recevra la nouvelle version au prochain chargement (banner d'update existant). À l'activation du nouveau SW, le précache scènes se déclenche automatiquement.

---

## [2.60] — 2026-05-08

🗂 **Bloc d'autorisation du dossier — signature R.R aka Banzaï + date d'activation.**

### Ajouté

- **Signature « Approved by »** (profile.html, bloc `dfir-auth-block`) : tampon manuscrit fixe **R.R aka Banzaï** posé sur tous les dossiers, identifié comme l'officier instructeur.
- **Date d'activation** : nouvelle cellule affichant la date du **tout premier point marqué** au format **MM/DD/YYYY** (zéro-padding mois/jour). Style « tampon dateur » (monospace, encre rouge translucide, légère inclinaison) pour contraster avec la signature en cursive.
- **Champ `firstXpAt`** dans `casIn_profile` (`js/core/cas-in-profile.js`) : timestamp ms epoch de la 1re XP gagnée toutes sources confondues. Posé dans `addXp()` une seule fois, irrévocablement. Exposé via `Profile.snapshot().firstXpAt` (null si jamais activé).
- **Événement `dossier-activated`** (`window.dispatchEvent`) : émis une unique fois dans la vie du profil, à la 1re XP. Hooké par `js/profile/celebration-ui.js` qui joue une cérémonie spéciale « Dossier activé · Approuvé par R.R aka Banzaï » au lieu du toast XP générique.
- **Mode clair pour `dfir-auth-block`** (`style/profile-dossier-plus.css`) : sélecteurs `[data-theme="light"]` rebascule les RGBA hardcodés (encre sépia pour la signature, rouge saturé pour le tampon dateur) afin de garder le contraste WCAG AA sur fond clair.
- **A11y bloc auth** : `role="img"` + `aria-label` dynamique sur la signature stylisée (pour que les lecteurs d'écran lisent « Dossier approuvé par R.R aka Banzaï, officier instructeur » au lieu de la cursive brute) et attribut `datetime` ISO 8601 sur la cellule date pour les outils qui parsent.

### Corrigé

- **Horloge UTC du status bar profil gelée** (`js/profile/profile-page.js:48`). La valeur n'était posée qu'au render initial, jamais rafraîchie : un dossier ouvert 30 minutes affichait encore l'heure d'arrivée. Désormais, tick aligné sur la minute suivante (calcul `60_000 - Date.now() % 60_000`) puis `setInterval(60_000)` pour basculer pile au changement de minute, sans clic visuel à mi-minute.
- **Signature mal placée dans `dfir-auth-block`** : le span `#profile-auth-signature` était dans la cellule **« Date d'activation »** (jamais dans « Approved by »), ce qui faisait apparaître le pseudo de l'agent en cursive… sur la ligne réservée à la date. Refacto markup : signature dans la bonne cellule, date dans la sienne.
- **Hint date** : `JJ / MM / AAAA` → `MM / DD / YYYY` (cohérent avec le format affiché et la convention demandée pour ce bloc).

### Migration

- **Backfill silencieux** dans `ensureProfile()` : pour les profils v=4 créés avant v2.60, si `xp > 0` mais `firstXpAt` indéfini, on fallback sur `createdAt` comme meilleure approximation (le profil a forcément été activé un jour, on ne connaît juste pas la date exacte). Pour `xp === 0`, `firstXpAt` reste `null` (le dossier n'est pas encore activé).

---

## [2.59] — 2026-05-07

🛠 **Patches d'audit lisibilité / nav / a11y** — réponse au rapport d'audit du 7 mai 2026.

### Corrigé

- **Variable `--navbar-h` introduite** (style.css `:root`, 76 px desktop, 66 px mobile via `@media (max-width: 620px)`). Toutes les valeurs `top: 76px` hardcodées (`cas-in-navbar.css`, `fiche_style.css`, `quiz.css`) migrées vers `var(--navbar-h)`. Résout le décalage de 10 px qui apparaissait au scroll en mobile entre la navbar et les sous-headers sticky.
- **`tp-page.css` : `.tp-shell { height: calc(100vh - 53px) }`** → `calc(100dvh - var(--navbar-h))`. Le `53px` était hérité d'avant la navbar v2.77 (qui fait 76 px). Passage à `100dvh` corrige aussi la troncature en bas sur iOS Safari (barre d'adresse dynamique).
- **`fiche_style.css` : `table thead { top: 53px }`** → `top: calc(var(--navbar-h, 0px) + 53px)`. Sur les fiches qui ont la navbar globale, les en-têtes de tableau ne disparaissent plus sous la navbar+tn-nav lors du scroll.
- **Bug de virgule traînante dans `quiz.css`** : la déclaration `#streak-toast, #combo-toast, #rankup-toast, #notify-stream { ... }` faisait que les anciens toasts héritaient `position: fixed; opacity: 0` du nouveau `#notify-stream` (invisibles **par accident**). Désormais bloc séparé `display: none;`.
- **`#notify-stream` calc** : `top: calc(var(--hdr-h, 52px) + 12px)` → `calc(var(--navbar-h, 76px) + 12px)`. Le toast n'apparaît plus sous la deuxième ligne de la navbar.
- **Doublon supprimé** : la règle `.cas-navbar ~ header { top: 76px !important }` (ligne 300 de `cas-in-navbar.css`) faisait double-emploi avec la règle ligne 217. Supprimée.

### Ajouté

- **`scripts/generate_counts.py`** étend désormais sa mission : après avoir écrit `data/counts.json`, il **patche aussi** tous les `data-count="KEY">N` dans les fichiers HTML pour que SEO/réseaux sociaux/lecteurs sans JS voient les vrais chiffres (au lieu du flash 1439 → 2000 au chargement). Idempotent : ne touche un fichier que si la valeur a changé.
- **Clé `version` dans `data/counts.json`** : lue automatiquement depuis le 1er `## [X.Y]` non-Unreleased de `docs/CHANGELOG.md`. Permet d'utiliser `<span data-count="version">` dans le HTML pour éviter d'avoir des `v2.6` codés en dur dans le footer ou la status-bar (corrigé sur `index.html`).
- **`cas-in-counts.js`** gère désormais les valeurs **non-numériques** via le set `RAW_KEYS` (`version`, `generated_at`). Évite que `2.93` devienne `2,93` à cause du `toLocaleString('fr-CH')`.

### Notes techniques

- 28 fiches sur 110 chargent `cas-in-navbar.css` + `cas-in-navbar.js` mais n'ont pas le slot `<div id="cas-navbar">`. Le JS sort silencieusement (`if (!slot) return`) mais le CSS est téléchargé pour rien (~14 KB par page). Pas corrigé dans cette release : nécessite de régénérer ces 28 fiches via `scripts/inject_fiche_reader.py` (à étendre).
- `og:description` de `scene.html` corrigé manuellement : `"64 scénarios"` → `"136 scénarios"`. Idéalement, ces meta-tags devraient utiliser `data-count-fmt` mais les crawlers exécutent rarement le JS — la solution durable est dans le patcher Python.

---

## [2.58] — 2026-05-06

🎉 **Clôture du rollout mode clair** — réactivation du bootstrap auto.

### Modifié

- `js/core/cas-in-utils.js` : appel à `bootstrapColorScheme()` réactivé (était commenté depuis v2.49). Détection auto de `prefers-color-scheme: light` au boot → pose `data-theme="light"` sur `<html>`. La fonction reste aussi sensible aux changements live de préférence OS (utilisateur qui switch son OS pendant la session).
- `style/style.css` : bloc `@media (prefers-color-scheme: light)` réactivé (décommenté). Couvre les rares cas où le JS n'a pas encore tourné — l'OS-light s'applique en CSS pure.
- `sw.js` : `CACHE_VERSION` v137 → v138.

### Préservé

- L'escape-hatch URL `?theme=light` / `?theme=dark` (introduite en v2.50) reste **active**. Coût zéro à maintenir, utile pour QA, démos, screenshots, et debug futur.
- Tous les sélecteurs `[data-theme="light"]` et leurs contreparties dormantes (~250 au total à travers les CSS) restent en place.

### Effet utilisateur

- OS thème clair → app en clair automatiquement
- OS thème sombre → app en sombre (inchangé)
- L'utilisateur n'a rien à configurer

Le bug de v2.85 (qui avait causé le hotfix v2.49) est désormais entièrement résolu : le mode clair est complet sur toutes les pages.

### Récap rollout

| Release | Cible |
|---|---|
| v2.49 | Hotfix : désactivation auto-light |
| v2.50 | Quiz |
| v2.53 | Navbar transversale |
| v2.54 | Scene |
| v2.55 | TP (engine + page) |
| v2.56 | Profile + Tools + Exam |
| v2.57 | Aux pages (npcs, glossary, artifacts) |
| **v2.58** | **Clôture : réactivation bootstrap** |

Au total : ~10 fichiers CSS touchés, ~250 nouveaux overrides `[data-theme="light"]`, 9 releases sur la passe.

## [2.57] — 2026-05-06

🎨 **Pass CSS light — pages auxiliaires (npcs / glossary / artifacts)** : la couverture est maintenant **complète sur toutes les pages**.

### Modifié

- `style/npcs.css` : 10 nouveaux sélecteurs light (8 swap white-tint → black-tint pour les `.npc-stats/.npc-toolbar/.npc-card/.npc-card-avatar/.npc-appearance-link/.npc-modal-avatar/.npc-modal-pers-item/.npc-modal-relation` + 2 dark hardcodés `.npc-search` et `.npc-modal`).
- `style/glossary.css` : 4 nouveaux sélecteurs light (3 swap white-tint pour `.gloss-stats/.gloss-toolbar/.gloss-entry` + `.gloss-search`).
- `style/artifacts.css` : 1 override pour `.art-filters` (sticky avec backdrop-filter, seul hardcodé sombre).
- `sw.js` : `CACHE_VERSION` v136 → v137.

### Statut couverture light : **100%** ✅

| Page | État |
|---|---|
| Landing | ✅ N/A (Matrix permanent) |
| Fiches | ✅ |
| Navbar (transversal) | ✅ |
| Quiz | ✅ |
| Scene | ✅ |
| TP | ✅ |
| Profile + Banner + Dossier | ✅ |
| Tools | ✅ |
| Exam | ✅ |
| Npcs | ✅ |
| Glossary | ✅ |
| Artifacts | ✅ |

### Next step (release future)

Une fois validation visuelle complète côté utilisateur via `?theme=light` sur chaque page, prévoir une release de **clôture du rollout** :

- Réactiver `bootstrapColorScheme()` dans `js/core/cas-in-utils.js` (commenté en v2.49)
- Réactiver le bloc `@media (prefers-color-scheme: light)` dans `style/style.css` (commenté en v2.49)
- Optionnel : retirer l'escape-hatch `?theme=light/dark` URL (v2.50) une fois le bootstrap réactivé. Ou le garder pour faciliter le QA futur — coût zéro.
- Bump `CACHE_VERSION`.

Après ça, les utilisateurs avec OS en thème clair voient l'app en clair automatiquement, ceux en thème sombre voient l'app sombre. Plus de bug de lisibilité.

## [2.56] — 2026-05-06

🎨 **Pass CSS light — profile + tools + exam** : 3 pages couvertes en une release.

### profile (le plus dense)

- `style/profile.css` : section `[data-theme="light"]` réécrite. Préserve les overrides existants encore valides (`.profile-page/.dfir-status-bar/.dfir-action-btn/etc.`), retire les overrides morts (`.npc-arc-card/.npc-arc-bar-track` — DOM disparu), ajoute :
  - **Définition de `--card-bg: #ffffff` et `--bar-bg: #cdd5e0`** dans le bloc light. Stratégie clé : tous les selectors qui font `var(--card-bg, #0f1420)` (i.e. `.arc-card`, `.quest-card`, `.lb-row`, `.mastery-track-bar`, `.arc-progress-bar`, `.npc-arc-bar-track` etc.) basculent automatiquement sans override par sélecteur.
  - `.profile-body` (gradient sombre Matrix → gradient clair)
  - `.profile-modal-backdrop` + `.profile-modal-panel`
  - `.profile-track-chooser` + `.profile-track-card` + hover
  - `.profile-title-card.is-locked` + `.profile-title-card--none`
  - `.profile-ach-next-item`
  - `.hm-theme-pct`
  - `.arc-filter-btn.is-active .arc-filter-count`
- `style/profile-banner.css` : ajout d'un bloc light complet (~30 lignes). Le banner reprenait la même palette propriétaire que cas-in-navbar (bleu `#4a9eff`, gold `#ffd070`, green `#6fd29c`, texte `#e8eaed`), tout hardcodé. Mêmes inversions que pour le navbar : `#1a5fa8` / `#8a5800` / `#115a35` / `#1a2235`.
- `style/profile-dossier.css` : ajout d'1 override pour `.profile-stat` (le seul élément hardcodé sombre du fichier).

### tools

- `style/tools.css` : **rien à changer**. Le fichier est petit (98 lignes), utilise déjà `var(--surface)/var(--border)/etc.`, et les 3 overrides existants ciblent `.tool-card` (toujours valide). Bénéficie du fait que `tools.html` charge `fiche_style.css` qui définit toutes les vars light.

### exam

- `style/exam.css` : ajout d'un mini-bloc light pour les 2 sticky headers (`.exam-header` et `.rev-header`) — ils avaient un `rgba(13,17,23,.95)` hardcodé (backdrop-filter). Reste du fichier utilise des vars + bénéficie de fiche_style.css.

### sw.js

- `CACHE_VERSION` v135 → v136.

### Statut couverture light

| Page | État |
|---|---|
| Landing, Fiches, Navbar | ✅ |
| Quiz, Scene, TP | ✅ |
| Profile (page + banner + dossier) | ✅ (cette release) |
| Tools | ✅ (déjà) |
| Exam | ✅ (cette release) |
| npcs / glossary / artifacts | ❌ |

Reste 3 pages — plus le profil-banner pourra être testé sur **toutes** les pages où il s'affiche.

### Test

- `profile.html?theme=light` : page complète, ouvrir les modales (Track chooser), naviguer dans Arcs / Quests / Leaderboard / Mastery / Heatmap, vérifier que les cartes sont blanches avec accents corrects
- `tools.html?theme=light` : déjà OK normalement, vérification rapide
- `exam.html?theme=light` : démarrer un examen, vérifier que le header sticky du timer est en blanc et lisible, idem pour le mode révision

## [2.55] — 2026-05-06

🎨 **Pass CSS light — `tp.css` + `tp-page.css`** : tp.html maintenant utilisable en mode clair.

### Découverte (même histoire)

Les overrides existants de `tp.css` ciblaient `.tp-card`, `.tp-panel`, `.tp-input`, `.tp-feedback-ok/.bad` — **tous absents du DOM**. Le rendu actuel (par `tp-engine.js`) utilise `.ex-*`, `.tp-choice`, `.btn-validate/.btn-next/.btn-hint`, `.hex-display/.hex-byte`, `.bm-cell.free`, `.bit-0`, etc. Les ~9 overrides étaient morts.

`tp-page.css` n'avait aucun override (0 sur 289 lignes) mais utilisait majoritairement `var(--surface)`/`var(--border)` donc basculait correctement — un seul élément invisible-on-light à corriger.

### Modifié

- `style/tp.css` :
  - Bloc `[data-theme="light"]` réécrit en place (~120 lignes au lieu de ~50).
  - 8 nouvelles familles couvertes :
    - `.tp-tab:hover` / `.btn-new-ex:hover` (borders blancs invisibles sur fond clair → tints sombres)
    - `.ex-scenario` (encadré du scénario d'exo)
    - `.hex-display` (forensic byte viewer)
    - `.bit-0` (binary display)
    - `.ex-input` + états `.correct`/`.wrong`
    - `.bm-cell.free` (booking matrix)
    - `.bm-hex-result`
    - `.tp-choice` + `.tp-choice-letter` (multiple-choice)
    - `.ex-feedback.correct/.wrong/.error`
- `style/tp-page.css` : ajout d'un mini-bloc light pour `.sb-group:not(.collapsed) .sb-group-header` (le seul élément avec un bg `rgba(255,255,255,.03)` invisible sur clair).
- `sw.js` : `CACHE_VERSION` v134 → v135.

### Statut couverture light

| Page | État |
|---|---|
| Landing, Fiches, Navbar | ✅ |
| Quiz | ✅ |
| Scene | ✅ |
| TP | ✅ (cette release) |
| Profile | ⚠️ partiel (14 règles existantes — à vérifier de la même manière, probablement mortes aussi) |
| Tools | ⚠️ minimal (3 règles) |
| Exam | ❌ aucune |
| npcs/glossary/artifacts | ❌ aucune |

### Test

`tp.html?theme=light` — tester en particulier :
- Sidebar de gauche (déjà via vars, devrait être OK)
- Choisir un exercice et lancer
- Faire un exo avec input texte (correct/wrong feedback)
- Faire un exo "hex viewer" si présent (les bytes doivent rester lisibles)
- Faire un exo avec choices multiple (les boutons cliquables)
- Vérifier les boutons Hint / Validate / Next

## [2.54] — 2026-05-06

🎨 **Pass CSS light — `scene.css`** : couverture étendue, scene.html maintenant utilisable en mode clair.

### Découverte (même problème que quiz)

Les overrides `[data-theme="light"]` pré-existants ciblaient `.scene-card`, `.step-card`, `.lobby-card`, `.choice`, `.alert-bar` — **sélecteurs absents du DOM actuel**. Le DOM réel utilise `.briefing-card`, `.briefing-panel`, `.choice-btn`, `.alert-box`, etc. Les vraies cartes de scène utilisaient déjà `var(--surface)`/`var(--text)` donc basculaient bien — mais ~26 éléments avaient des bg hardcodés sombres qui ne switchaient pas.

### Modifié

- `style/scene.css` :
  - Bloc `[data-theme="light"]` réécrit en place (~155 lignes au lieu de ~50). Préserve la déclaration des variables (qui était correcte).
  - 14 nouvelles familles de sélecteurs couvertes : `.diff-badge.easy/medium/hard/expert`, `.alert-box`, `.ref-tag` (+ hover), `.choice-btn:hover/.selected-ok/.selected-ko` (états scène, distincts des états quiz), `.feedback-box.ok/.ko`, `.next-step-btn:hover`, `.tl-dot.done-ok/.done-ko`, `.custody-result.intact/.degraded/.compromised`, `.review-item.ok/.ko`, `.hint-btn:hover`, `.heatmap-day.l1/.l2`, `.skill-node`, `.npc-relation-item`, `.eu-unlock-desc`.
- `sw.js` : `CACHE_VERSION` v133 → v134.

### Statut couverture light

| Page | État |
|---|---|
| Landing, Fiches, Navbar | ✅ |
| Quiz | ✅ (v2.50) |
| Scene | ✅ (cette release) |
| TP | ⚠️ partiel (9 règles) |
| Profile | ⚠️ partiel (14 règles) |
| Tools | ⚠️ minimal (3 règles) |
| Exam | ❌ aucune |
| npcs/glossary/artifacts | ❌ aucune |

### Test

`scene.html?theme=light` — vérifier en particulier :
- Cartes de scènes (lobby) — déjà via vars, inchangé
- Briefing une fois entré dans une scène — devrait être tout en clair
- Pendant une étape : choix sélectionnés (ok/ko) — verts/rouges clairs lisibles
- Feedback box après validation — verte ou rouge clair
- Timeline en bas — dots verts/rouges clairs
- Custody bar (chaîne de garde) — couleurs cohérentes
- Récap fin de scène : review items + custody result
- Onglet Skill tree (depuis profile) — skill-node lisibles

## [2.53] — 2026-05-06

🎨 **Pass CSS light — `cas-in-navbar.css`** : navbar transversale couverte. Multiplicateur — toutes les pages déjà couvertes en clair (quiz, fiches) gagnent un rendu cohérent top-to-bottom.

### Contexte

`cas-in-navbar.css` (318 lignes) avait **0 règle `[data-theme="light"]`** — tout en hardcodé sombre (palette bleu `#4a9eff` / gold `#ffd070` / texte clair). Sur les pages en mode clair, la navbar restait sombre, créant une bande noire désynchronisée en haut de page.

### Modifié

- `style/cas-in-navbar.css` : ajout d'un bloc `v2.53 — Thème clair` (~85 lignes, 25 sélecteurs) couvrant l'intégralité du composant :
  - Conteneur (`.cas-navbar`, `.cas-navbar__top`)
  - Identity (track icon, agent, sep, rank)
  - Stats (XP, streak, delta + flash)
  - Bottom nav (home, title, links + active state)
  - Tools (hdr-action, hdr-action-primary, hdr-dropdown-menu)
- `sw.js` : `CACHE_VERSION` v132 → v133.

### Palette navbar light

| Élément | Sombre (existant) | Clair (nouveau) |
|---|---|---|
| Fond | `#060b15` | `#ffffff` |
| Texte primaire | `#e8eaed` | `#1a2235` |
| Texte dim | `rgba(255,255,255,.45-.5)` | `rgba(15,25,45,.55)` |
| Accent bleu | `#4a9eff` / `#5ba8ff` | `#1a5fa8` (AA contrast OK sur blanc) |
| Accent gold | `#ffd070` | `#8a5800` |
| Accent green delta | `#6fd29c` | `#115a35` |
| Tints surface | `rgba(255,255,255,.04-.08)` | `rgba(15,25,45,.04-.05)` |

### Test

Sur n'importe quelle page : `?theme=light` → la navbar bascule en blanc avec les accents bleu sombre (`#1a5fa8`). En particulier `quiz.html?theme=light` pour vérifier que la cohérence top-to-bottom est restaurée.

### Statut couverture

| Page | Avant | Après v2.53 |
|---|---|---|
| `quiz.html` | ✅ (v2.50) | ✅ + navbar |
| `fiches/*.html` | ✅ | ✅ + navbar |
| `scene.html` | ⚠️ partiel | ⚠️ partiel + navbar |
| `tp.html`, `tools.html`, `exam.html`, `profile.html` | ⚠️/❌ | idem + navbar |

## [2.52] — 2026-05-06

🐛 **Vague 3 — `Profile.spendXp()`** : nouveau API + correction d'un bug silencieux où les indices scène étaient gratuits.

### Bug corrigé

`scene-app.js#useHint()` (coût 25 XP par indice) tapait directement dans le mirror legacy `cas_xp` via `lsSet`, mais `getXP()` (la fonction qui affiche le solde) lit en priorité depuis `Profile.xp` (la source de vérité). Conséquence : les indices décrémentaient une variable qui ne servait plus à rien tout en laissant `Profile.xp` intact. Le user voyait son XP rester au max après chaque hint utilisé, et le bouton hint ne devenait jamais grisé pour cause d'XP insuffisant.

Symptôme observable : utilisable n'importe quand sans coût visible, peu importe le score réel.

### Ajouté

- `Profile.spendXp(amount, source, meta)` dans `js/core/cas-in-profile.js` :
  - Whitelist source : `quiz | scene | quest | tp | fiches`
  - Pas de bonus de rôle appliqué (les coûts sont fixes)
  - Pas de mise à jour de `xpBySource` (qui reflète l'XP gagnée par source, pas le solde net)
  - Pas de mise à jour de `activity[source]` (une dépense n'est pas une activité d'apprentissage)
  - Pas d'événement `rank-down` émis (convention UX : rangs permanents)
  - Retourne `{ xp, spent, base }` ou `null` si insuffisant / source invalide / montant ≤ 0

### Modifié

- `js/pages/scene-app.js` :
  - `useHint()` : appelle `Profile.spendXp(HINT_COST, 'scene', { reason: 'hint' })` au lieu de `lsSet('cas_xp', ...)`. Le mirror legacy reste mis à jour après-coup pour les call-sites résiduels qui lisent `cas_xp` directement.
  - `updateHintButton()` : utilise `getXP()` (lit Profile en priorité) au lieu de `lsGet('cas_xp', 0)`. Le bouton se grise désormais correctement quand l'utilisateur n'a pas de quoi payer.
- `sw.js` : `CACHE_VERSION` v131 → v132.

### Compatibilité

- Aucun breaking change. `Profile.spendXp` est opt-in (le caller vérifie `typeof === 'function'`).
- Le mirror `cas_xp` est toujours écrit après spend pour les rares lecteurs legacy.

## [2.51] — 2026-05-06

🧮 **Vague 2 — décisions binaires** : 3 sujets tranchés, code mort retiré, build pipeline corrigé.

### Supprimé

- `js/core/cas-in-storage.js` (199 lignes) : wrapper localStorage défini en v2.60 mais **jamais adopté** — zéro consommateur dans tout le repo. La `migrate()` de v2.60 a déjà tourné chez tous les utilisateurs existants (flag `cas_storage_migrated_v260` posé), donc la suppression n'a aucun impact fonctionnel.
- Les `<script src="js/core/cas-in-storage.js" defer>` dans `index.html`, `quiz.html`, `scene.html`, `profile.html`.
- Entrée correspondante dans `sw.js` STATIC_ASSETS.

Note : les clés `cas_*_legacy` recopiées dans le storage des utilisateurs existants (~1 KB par user) restent. Inoffensives ; éventuellement nettoyables via une mini-fonction de cleanup dans une release future si on veut.

### Modifié

- `scripts/build-all.sh` : ajout de `build_fiche_graph.py` comme étape 5/6 (entre `build_cross_links.py` et les checks). **Bug latent corrigé** : avant cette release, modifier une fiche et lancer `./build-all.sh` régénérait `cross-links.json` mais laissait `fiche-graph.json` stale → recommandations de fiches voisines pouvaient être incorrectes. Le pre-commit hook côté CI Actions est apparemment OK (le workflow régénère bien les deux), mais le path local était cassé.
- `scripts/README.md` : pipeline mis à jour pour refléter les 6 étapes (au lieu de 5).
- `scripts/build_search_index.py` : docstring corrigée. L'ancien docstring annonçait des champs `commands`, `terms`, `text` que le script ne génère pas. Schema réel documenté : `{file, title, category, icon, desc, sections: [{id, title, text}]}`.
- `docs/ARCHITECTURE.md` : exemple de `<script>` chain et "Future work" mis à jour pour retirer `cas-in-storage`.
- `sw.js` : `CACHE_VERSION` v130 → v131.

### Conservé tels quels

- `data/cross-links.json` (64K) et `data/fiche-graph.json` (128K) : **rôles distincts** (cross-links = mapping fiche↔questions/TP/scènes pour le panneau "voir aussi" ; fiche-graph = prev/next + voisines pour la navigation). Pas redondant.
- `data/search-index.json` (608K) : **pas de dénormalisation excessive**. 97.8% de la taille est du contenu indexable réel (`sections[].text`). Taille légitime pour 109 fiches × ~5.4 KB d'index par fiche.

## [2.50] — 2026-05-06

🎨 **Mode clair — quiz** : couverture CSS complète sur `quiz.html` (vague 4 commencée).

### Contexte

Suite au hotfix v2.49 qui a désactivé le mode clair auto, début de la passe CSS pour le réactiver proprement. On commence par `quiz.html`. Le bootstrap auto reste désactivé tant que toutes les pages ne sont pas couvertes.

### Découverte

Les 12 règles `[data-theme="light"]` pré-existantes dans `quiz.css` ciblaient `#q-card`, `.opt`, `.feedback`, `.legal-block`, `.menu-panel`, `.modal-card` — tous des sélecteurs d'un ancien DOM v2.x supprimé depuis. Aucun ne matchait le DOM actuellement rendu. Le travail v2.85 sur quiz.css était donc **dead CSS**. Les vrais sélecteurs sont `.card`, `.choice-btn`, `#feedback`, `.chip`, etc., majoritairement définis dans `style.css`.

### Modifié

- `style/style.css` : ajout d'une section `v2.50 — Couverture étendue` (~70 nouveaux sélecteurs `[data-theme="light"]`) couvrant les éléments **partagés** entre pages : `.card`, `.choice-btn` (+ états selected/correct/wrong), `#feedback.ok`/`#feedback.ko`, `.chip`, `.theme-tag`, `.diff-badge`, `.panel`, `.toast-base`, `.stat-box`, `#skip-btn`, modales (`#midsession-box`, `#help-box`, `#expl-panel`, `#milestone-box`, `#achievement-popup`, `#gloss-popup`), backdrops d'overlay, dropdowns, avatars.
- `style/quiz.css` : remplacement des 12 règles mortes par des overrides ciblant les vrais éléments du DOM actuel : `#gen-report-btn`, `.notify-card`, `.persona-card`, `.mode-end-overlay`, `.btn-mode-action--cyan/gold`, `.session-recap-card`, `.srx-ach-item`. Note explicative en tête de section.
- `js/core/cas-in-utils.js` : ajout d'un escape-hatch URL `?theme=light` (et `?theme=dark` pour revenir) — permet de tester la couverture page par page sans réactiver le bootstrap auto. À retirer quand la couverture sera complète.
- `sw.js` : `CACHE_VERSION` v129 → v130.

### Comment tester

Sur la page voulue, ajouter `?theme=light` à l'URL : `/quiz.html?theme=light`. Pour revenir : `?theme=dark` ou retirer le paramètre.

### Statut couverture par page

| Page | Couverture | Note |
|---|---|---|
| `quiz.html` | ✅ couvert | cette release |
| `index.html` (landing) | ✅ N/A | identité Matrix, pas de mode clair |
| `fiches/*.html` | ✅ déjà fait | rollout v2.85 |
| `scene.html` | ⚠️ partiel | 11 règles existantes, à compléter |
| `tp.html` | ⚠️ partiel | 9 règles, à compléter |
| `tools.html` | ⚠️ minimal | 3 règles |
| `exam.html` | ❌ aucune | |
| `profile.html` | ⚠️ partiel | 14 règles, à compléter |
| `npcs.html`, `glossary.html`, `artifacts.html` | ❌ | |
| `cas-in-navbar.css` | ❌ | (transversal, prio probable) |

### Next

Continuer page par page (`scene.html` probablement ensuite). Quand tout est couvert, retirer l'escape-hatch URL et réactiver `bootstrapColorScheme()` + le `@media (prefers-color-scheme: light)`.


---

## Versions antérieures à v2.50

Pour les versions v0.1 à v2.49 (avril–mai 2026), voir
[`CHANGELOG-archive-pre-v2.50.md`](CHANGELOG-archive-pre-v2.50.md).
