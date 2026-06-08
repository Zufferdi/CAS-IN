# Changelog

Toutes les modifications notables apportées à ce projet sont documentées ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

Cache SW courant : **`cas-in-v147`** (depuis le 8 juin 2026, v3.4-scenes-audit).

---

## [3.4-scenes-audit] — 2026-06-08

🔍 **Audit complet des 476 scènes et 58 entrées campaigns.json. 6 catégories de corrections.**

### Bugs mécaniques corrigés

**1. `campaigns.json` — 3 doublons d'`order`**
Avant : orders 30, 31, 32 chacun assignés à 2 récits, ce qui rendait le tri d'affichage instable au cold reload.
- `saga-mistral` : 30 → **22**
- `saga-tavajjoh` : 31 → **23**
- `saga-cologny-micro-espion` : 32 → **24**

Les 3 récits sont décalés dans les trous d'order disponibles (22-25). Ordre éditorial préservé pour les 55 autres récits.

**2. Champ vestige `debrey` dans `ge-affaire-cologny-3-analyse-hardware.json`**
Un champ `debrey` (valeur vide) cohabitait avec `debrief` (valeur correcte). Vestige d'une mauvaise saisie ; supprimé.

**3. Soft hyphen `\u00ad` dans `swatch-2020-ot.json`**
Un caractère invisible (trait d'union conditionnel) entre `récep` et `tivité`. Légitime typographiquement mais source de confusion dans les JSON ; retiré.

**4. Atmosphère francisées (vocabulaire EN harmonisé)**
3 scènes utilisaient des valeurs `atmosphere` en français isolément du vocabulaire commun (`investigation`, `incident`, `legal`, `audience`...). Remappées :
- `ch-affaire-data-brokers-7-bilan-doctrine` : `bilan` → `investigation`
- `ch-affaire-data-brokers-6-confrontation-publication` : `exfiltration` → `investigation`
- `ge-affaire-antennes-fantomes-7-audience-tco-geneve` : `juridique` → `audience`

### Création de stubs NPCs

**5. 23 NPCs manquants — stubs créés dans `data/npcs.json` (324 → 347 NPCs)**

95 références dans 95 scènes pointaient vers des NPCs non définis. Le code `scene-npcs.js` filtrait silencieusement ces références avec `.filter(Boolean)`, donc les panneaux "Acteurs en présence" affichaient des listes incomplètes (parfois vides).

Stubs minimaux créés (id, name, fictional=true, icon, role, institution, shortBio 1-2 phrases, expertise, context, canton, category, alignment, seniority) :

- **Saga Tom (12 NPCs)** : `mineur_auteur_defi_tiktok` (Léo M., 15 ans), `famille_victime_tom_vd`, `pediatre_chuv` (Dr. C. Reymond), `mpvd_procureur_mineurs` (Me Sophie Bertholet), `kapo_vd_jeunesse_cyber`, `medecin_legiste_chuv_pediatrie`, `expert_psychiatre_adolescent` (Pr. L. Dubuis), `tmcvd_juge_dpmin`, `tiktok_eu_liaison` (M. Aoife O'Reilly), `tiktok_trust_safety_eu`, `directeur_etablissement_secondaire`, `cyberbulling_referent`

- **Antennes Fantômes (8 NPCs)** : `procureur_mp_ge_cybercrime` (Me Catherine Wenger), `inspectrice_brigade_financiere_ge` (Léa Robert), `juge_tmc_ge_perquisition`, `ofcom_spectrum_lead_be` (Markus Brunner), `tech_scpt_interception` (Marc Vauthier), `ingenieur_swisscom_security` (Tatiana Müller), `forensicien_for_ge` (Dr. Pascal Hovasse), `avocat_defense_carouge_lj` (Me Laurent Juliot)

- **Republik média (2 NPCs)** : `journaliste_republik_lea` (Léa Andermatt), `redaction_republik_constantin` (Constantin Seibt)

- **Sarine fr (1 NPC)** : `fr_lawyer_cyber` (Me Bénédicte Riou)

Tous marqués `fictional: true` pour transparence éditoriale. Les bios peuvent être enrichies a posteriori — le minimum technique est en place pour que les panneaux "Acteurs en présence" affichent correctement les chips cliquables.

### Harmonisation de format

**6. 12 scènes avec `alertLevel` au format enum (`high`/`élevé`/`critique`)**

464 scènes utilisaient des bannières narratives riches (`🚨 FUITE CONFIRMÉE · SonntagsBlick a publié...`), 12 scènes encore l'ancien format enum. Converties en bannières narratives générées depuis le titre + tags + atmosphere :

| Scène | Avant | Après (extrait) |
|---|---|---|
| `crypto-ag-rubikon-enquete-dfir-2020` | `high` | `🔍 OPÉRATION RUBICON : ENQUÊTE DFIR RÉTROSPECTIVE...` |
| `drone-laufenburg-swissgrid-aargau` | `critique` | `🚨🚨 SURVOLS DRONES SUR L'ÉTOILE SWISSGRID · ARGOVIE · INFRASTRUCTURE CRITIQUE` |
| `src-fonctionnaire-russe-kaspersky` | `critique` | `🚨🚨 ESPIONNAGE INTERNE OU CYBER-BUSINESS AS USUAL ? · BERNE · SRC` |
| ... 9 autres | | |

Emoji choisi selon l'`atmosphere` (`incident:🚨`, `raid:🚪`, `investigation:🔍`, `legal:⚖️`, `audience:🏛️`, `state:🇨🇭`, etc.). Niveau `critique` doublé (`🚨🚨`) pour conserver l'intensité.

### Cache SW
- `cas-in-v146 → cas-in-v147` pour invalider les versions cachées des 476 scènes + `npcs.json` + `campaigns.json`.

### Audit clean — aucun bug détecté sur

- **476 scènes JSON** toutes valides syntaxiquement
- **Liens internes** (scene → scene, scene → fiche, scene → campaign) : 0 cassé
- **NPCs référencés** : 347/347 désormais définis dans `data/npcs.json`
- **Doublons** : 0 doublon de scene ID, 0 doublon de title, 0 scène apparaissant dans 2 récits, 0 doublon d'order de campagne
- **Placeholders éditoriaux** : 0 (les 26 "XXX" détectés sont tous des **références anonymisées légitimes** — `CVE-2024-XXXXX`, `Postulat 27.XXX`, `IMO 9XXXXXX`, `CHE-XXX.XXX.XXX`, `Règlement (UE) 2027/XXX`, etc.)
- **Encodage UTF-8** : 0 mojibake, 0 caractère de contrôle anormal
- **Schéma `campaigns.json`** : 58/58 entrées avec tous les champs requis (id, title, subtitle, description, hook, level, order, scenes, kind, narrative, icon), tous les levels mappés, IDs uniques, hooks rédigés

### Bilan v3.4 complet (tous patchs cumulés)
- **122 fiches** (HTML 100% balanced) en 5 indexes synchronisés
- **47 récits** + 11 collections = **58 entrées campagnes** sans doublon
- **476 scènes** toutes référencées par une campagne, toutes NPCs cohérents
- **347 NPCs** définis (vs 324 avant) avec 0 référence cassée
- **Cache SW v147** invalide bien les anciennes versions chez les utilisateurs au prochain reload

---

## [3.4-fiches-audit] — 2026-06-08

🔍 **Audit complet du contenu des 122 fiches techniques. 20 corrections sur 16 fiches.**

### Bugs HTML corrigés (typos manifestes)
- **`browser_forensique.html`** L304 : `</p<div>` → `</p><div>` (oubli du `>` intermédiaire)
- **`documents_office_forensique.html`** L283 : `</f>` littéral en plein texte → `&lt;/f&gt;` (entité HTML correcte pour afficher la balise XML Excel `<f>=SUM(...)</f>`)
- **`preuve.html`** L357 : `</stron<div>` → `</strong>` puis `<div>` (perte du `g>` de `strong`)
- **`sqlite_forensique.html`** L225 : `<code>moz_places</strong>` → `<code>moz_places</code>` (copier-coller incomplet du tag de fermeture)
- **`yara.html`** L349 : `<span>commentaire</strong>` → `<span>commentaire</span>` (copier-coller du `</strong>` voisin)

### Bug fonctionnel JavaScript : scroll-progress cassé sur 6 fiches
La barre de progression de lecture (bandeau cyan en haut de la page) ne fonctionnait pas du tout sur 6 fiches à cause d'un bloc `<script>` tronqué. La déclaration de la variable `bar` et du paramètre `d` était manquante, laissant un orphelin `bar.style.width=Math.min(100,(d.scrollTop/(d.scrollHeight-d.clientHeight))*100)+'%';},{passive:true});` qui levait une `ReferenceError` silencieuse en console.

Fiches réparées :
- `encodage.html` — bloc reconstruit ; en plus, le code JS de gestion des boutons "copier" qui suivait était également orphelin de `<script>`, donc tout `addCopyButtons()` ne s'exécutait pas non plus
- `browser_forensique.html`, `email_forensique.html`, `macos-linux.html`, `reseau.html`, `wireshark_pcap.html` — déclarations `var bar = document.getElementById('scroll-progress')` et `var d = document.documentElement` ajoutées

Le code complet aligné sur la version saine de `preuve.html` :
```js
var bar = document.getElementById('scroll-progress');
if(bar) window.addEventListener('scroll', function(){
  var d = document.documentElement;
  bar.style.width=Math.min(100,(d.scrollTop/(d.scrollHeight-d.clientHeight))*100)+'%';
},{passive:true});
```

### Erreurs de structure HTML (div/main/table mal imbriqués)
- **`eimp_entraide.html`** : un `</div>` manquant avant `</body>` (99 ouvertures pour 98 fermetures avant fix)
- **`encodage.html`** + **`preuve.html`** + **`suisse.html`** : ordre `</div></main>` inversé en fin de page → `</main></div>`
- **`log_forensique_avance.html`** L316, **`network_traffic_analysis_avance.html`** L322, **`tls_https_certificate_forensique.html`** L308 : `</table>` orphelin (sans `<table>` correspondant) supprimé
- **`macos-linux.html`** : 3 problèmes cumulés — un `</div>` orphelin entre les boîtes "fact" et "fun fact Unix", un manque de wrapper externe `<div class="page">` qui causait un mauvais ordre `</main></div>` à corriger en `</div></main>`

### Lien interne cassé
- **`sms_blaster.html`** : le pill prérequis "📖 Phishing" pointait vers `phishing.html` qui n'existe pas dans le repo. Supprimé (seul `📖 Android forensique` reste en prérequis). Si une fiche phishing est créée plus tard, le lien pourra être réinséré.

### Cache SW
- `cas-in-v145 → cas-in-v146` pour que les 16 fiches modifiées remplacent les versions cachées chez les utilisateurs.

### Audit clean — aucun bug détecté sur
- Encodage UTF-8 strict (122/122 OK)
- Mojibake (Ã©, Ã¨, etc.) : 0
- Caractères de contrôle (NULL, BOM en milieu, ZWSP) : 0
- Placeholders `TODO`, `FIXME`, `À COMPLÉTER`, `LOREM IPSUM` dans le contenu : 0
- Liens internes vers d'autres fiches : 1 cassé (corrigé)
- Liens vers scènes/campagnes : 0 cassé
- Liens vers JS/CSS : 0 cassé
- Titres `<h1>` dupliqués entre fiches : 0
- Fiches anormalement courtes (< 600 mots de contenu) : 0
- Mentions hardcodées de versions obsolètes (`v3.0`, `v144`, `120 fiches`, `35 sagas`, `46 campagnes`) dans le contenu : 0 (les 8 hits initialement signalés étaient tous des faux positifs : `art. 144bis CP`, `144 Po` limite ATA 48-bit, `ATF 144 IV 370`, etc.)
- Dates aberrantes : 0 (les 26 hits initiaux étaient tous légitimes : `1904` epoch HFS+, `1958` Traité de Rome, `2375` port Docker, `2682` résultat de calcul hex, etc.)
- Présence des 2 nouvelles fiches v3.4 (`analyse_post_acquisition`, `sms_blaster`) dans `manifest.json` et toutes les indexes : confirmée

### Vérification finale
- **122/122 fiches** HTML-balanced en mode `HTMLParser` strict
- **122/122 fiches** présentes dans les 5 indexes (`manifest.json`, `fiches-titles.json`, `fiche-graph.json`, `cross-links.json`, `counts.json`)
- 12 fichiers JSON, 3 fichiers JS, 4 fichiers HTML (`scene`, `index`, `apprendre`, `tester`) syntaxiquement valides

---

## [3.4-final] — 2026-06-08

🎨 **Élargissement des cartes sagas + harmonisation des compteurs hardcodés.**

### Modifié
- **`style/scene-campaigns.css`** — Breakpoint 3 colonnes repoussé `1180px → 1600px`. Sur les laptops 13-15" (1280-1599px), les cartes passent de ~395-436px à ~605-665px de large (+50% à +65%). Les écrans 1920px+ gardent leurs 3 colonnes. Padding cartes `22px → 26px`, min-height `400 → 420px`, titre `18.5 → 20px`, hook `13.5 → 14px` avec padding plus généreux, description `13.5 → 14px` avec `line-clamp 5 → 6`.
- **`index.html`, `apprendre.html`, `tester.html`** — Fallback `>120<` (fiches) remplacé par `>122<` pour cohérence visuelle avec `counts.json` (les valeurs sont déjà rechargées dynamiquement par `cas-in-counts.js`, mais le fallback initial reflète maintenant la vérité).
- **`data/i18n/fr.json`, `en.json`, `de.json`** — `"25 sagas / 25 affaires"` → `"47 récits"` (FR), `"47 stories"` (EN), `"47 Geschichten"` (DE).
- **`og-image-apprendre.svg`** — `120 fiches` → `122 fiches` dans l'image OpenGraph.
- **`README.md`** — Toutes les mentions de `35 sagas / 46 campagnes / 120 fiches / 392 scènes` mises à jour vers `47 récits / 58 campagnes / 122 fiches / 476 scènes`. Footer du README repointé sur la version 3.4 + cache SW v145.

### Audit pré-déploiement
- 12 fichiers JSON validés syntaxiquement ✓
- 3 fichiers JS validés (`node -c`) ✓
- 4 HTML balanced (`scene.html`, `index.html`, `apprendre.html`, `tester.html`) ✓
- Tous les fichiers critiques précachés par le SW ✓
- 0 champ `À COMPLÉTER` restant ✓
- 0 compteur hardcodé non synchronisé ✓

---

## [3.4-editorial-complet] — 2026-06-08

✍️ **Finalisation éditoriale des 11 nouveaux récits + bump cache SW.**

### Modifié
- **`data/campaigns.json`** — Les 33 champs `À COMPLÉTER` (subtitle, description, hook) des 11 récits ajoutés en `[3.4-recits-orphelins]` sont remplis. Style aligné sur `saga-aurora` : subtitle court technique, description 2-3 phrases factuelles (acteurs, lieu, méthodes, suites), hook en accroche courte visible jaune sur la carte.
- **`sw.js`** — `CACHE_VERSION` bumpé `cas-in-v144 → cas-in-v145` pour invalider les anciens `sagas-app.js`, `scene-campaigns.css`, `campaigns.json`, `manifest.json`, `fiches-titles.json`, `fiche-graph.json`, `cross-links.json`, `counts.json` mis en cache chez les utilisateurs.

### Ajouté
- **`scripts/apply_editorial_v34_recits.py`** — script idempotent qui contient les 33 textes en dur et les applique uniquement aux champs encore marqués `À COMPLÉTER`.

### Bilan v3.4 complet
Le repo passe de 36 récits visibles + 120 fiches à **47 récits + 122 fiches**, avec :
- 0 scène orpheline (476/476 référencées)
- 0 fiche orpheline (122/122 indexées dans tous les indexes)
- 0 récit orphelin (47/47 affichés sur la page sagas)
- Présentation harmonisée avec le tableau dossiers (tampons `🎬 SAGA` violet et `📁 AFFAIRE` doré)
- Compteurs dynamiques partout (plus de "25" en dur)
- Cache SW propre

Reste à faire côté repo (optionnel) : nettoyer les compteurs hardcodés "120 fiches" dans le HTML (README, index.html, tester.html, apprendre.html) si tu ne veux pas qu'ils restent désynchronisés du `counts.json`.

---

## [3.4-recits-orphelins] — 2026-06-08

🎬 **Intégration des 11 récits orphelins manquants dans `campaigns.json`.**

### Diagnostic
Audit du 8 juin 2026 sur `data/campaigns.json` :
- 477 scènes sur disque dans `/scenes/*.json`
- 399 scènes référencées par les 36 récits déclarés
- **78 scènes orphelines** réparties sur **11 arcs complets** (7 actes chacun) jamais déclarés
- Sur la page sagas, 11 récits invisibles à l'utilisateur (Or russe, Shadow fleet, Coin Laundry, Yémen, Pegasus, Frappes cognitives, Police prédictive, Data brokers, Données brocante, Cryptomixer Bahnhofstrasse, No-G7)

### Ajouté
- **`scripts/integrate_orphan_recits_v34.py`** — script idempotent qui ajoute les 11 entrées dans `data/campaigns.json` (orders 49–59).
- **`data/campaigns.json`** — 11 nouvelles entrées :
  - 9 sagas journalistiques nationales (🎬) : `saga-or-russe`, `saga-shadow-fleet`, `saga-coinlaundry`, `saga-osint-yemen`, `saga-pegasus-mobiles`, `saga-frappes-cognitives`, `saga-police-predictive`, `saga-data-brokers`, `saga-donnees-brocante`
  - 2 affaires cantonales (📁) : `saga-cryptomixer` (ZH), `saga-nog7` (GE)
- Le total `kind=saga+affaire` passe de **36 → 47** récits visibles sur la page sagas. Le compteur dynamique `view-btn-sagas-count` dans le bandeau Scènes/Sagas reflètera automatiquement la nouvelle valeur.

### À compléter manuellement
Champs éditoriaux marqués `À COMPLÉTER` pour les 11 nouvelles entrées :
- `subtitle` — ex: « Saga 7 actes · Or russe via raffineries tessinoises »
- `description` — synopsis 1–2 phrases
- `hook` — accroche 1 phrase visible sur la carte (mise en valeur jaune)

Champs renseignés automatiquement depuis la première scène de chaque arc : `id`, `title` (préfixe avant ` #`), `icon`, `level` (extrait de `difficulty`), `order`, `scenes` (liste triée 1→7), `narrative: true`, `kind`.

### Notes
- Aucune scène modifiée, aucun fichier supprimé.
- Re-audit post-patch : 0 récit orphelin restant.
- Cache SW à incrémenter (`cas-in-v144 → cas-in-v145`) pour invalider l'ancien `campaigns.json`.

---



🎨 **Harmonisation visuelle de la page Sagas avec le tableau des dossiers (campagnes).**

### Modifié
- **`js/pages/sagas-app.js`** — `renderCard()` ré-écrit pour émettre la structure `.dossier-card` (mêmes classes que la vue Campagnes) au lieu des classes `.sg-card` qui n'avaient aucun CSS. Statut harmonisé (NON OUVERT · EN COURS · CLÔTURÉ · MAÎTRISÉ) calqué sur `campaignStats()`. Lien des cartes → `#campaign=<id>` pour ouvrir la vue détaillée existante (déjà saga-aware via `c.narrative`).
- **`scene.html`** — bloc `#screen-sagas` ré-écrit avec `.campaigns-container` + `.page-hero` ; tous les inline styles purgés des chips de filtre ; passage de `.sg-grid` à `.dossiers-grid`.
- **`style/scene-campaigns.css`** — police titres dossiers `17px → 18.5px`, descriptions `12.5px → 13.5px`, padding cartes `20px → 22px`, min-height `380 → 400`. Breakpoint 3 colonnes `960px → 1180px` (cartes plus larges sur laptop standard). Nouvelles classes `.dossier-recit-saga` (tampon 🎬 SAGA violet) et `.dossier-recit-affaire` (tampon 📁 AFFAIRE doré). Styles propres pour `.sg-chip`, `.sg-kind-chip`, `.sg-section-header`, `.sg-summary-cell`.

### Corrigé
- Compteur `📖 Sagas (25)` codé en dur dans le bouton bascule du bandeau Scènes/Sagas → désormais dynamique (`<span id="view-btn-sagas-count">`) mis à jour par `updateKindCounts()` après chargement de `campaigns.json`. Reflète `sagas + affaires = 36` au lieu de l'ancien `25` obsolète. Idem pour les valeurs initiales `>25<` dans `#sg-total-sagas` et le `#sg-count-all` qui étaient désynchronisés des données.
- Bouton « ← Retour au tableau » de la vue détaillée : quand l'utilisateur arrive depuis la page Sagas, il devient « ← Retour aux sagas » et ramène à `?view=sagas` (origine tracée via `sessionStorage.cas_sagas_origin` + MutationObserver sur `#screen-campaigns`).

### Notes
- Cache SW à incrémenter (`cas-in-v144 → cas-in-v145`) sur déploiement pour invalider les anciens `sagas-app.js` et `scene-campaigns.css`.
- Aucun changement de schéma `data/campaigns.json`. Aucune migration `localStorage`.
- Régressions vérifiées : tampon `🎬 SAGA` historique sur les vraies campagnes narratives reste appliqué via `.dossier-narrative` inchangé ; les nouvelles variantes `.dossier-recit-{saga,affaire}` ne s'appliquent qu'aux cartes de la page Sagas.

---

## [3.0-jolification] — 2026-05-30

🎨 **Refonte complète UX + performance + sécurité + accessibilité.** Cascade de 20 deltas séquentiels (v131a → v132p), de la branche `v.3.0-jolification-phase`. Cache SW final : `cas-in-v141` → `cas-in-v144`.

### Vue d'ensemble

| Catégorie | Apports | Impact |
|---|---|---|
| **UX** | 4 hubs symétriques · onboarding à jour · partage social | Navigation cohérente |
| **Performance** | Lazy load questions · index search · SW slim | -8 MB économisés |
| **Sécurité** | CSP sur 183 pages · robustesse localStorage | Anti-XSS, anti-corruption |
| **Accessibilité** | WCAG 2.2 AA · skip-link · h1 · contrastes | Lecteurs d'écran OK |
| **Réorganisation** | 22 → 11 fichiers à la racine · pages/ dédié · sitemap | Maintenance ++ |
| **Documentation** | CHANGELOG · README à jour · MANIFESTs par delta | Onboarding dev OK |

### Ajouté

#### Nouveaux hubs symétriques (v131a-ux, v132h)
- `apprendre.html` — hub Apprendre fédérant Fiches · Tutoriels · Références
- `pratiquer.html` — hub Pratiquer fédérant TP · Outils
- `enqueter.html` — hub Enquêter fédérant Scènes · Sagas · Examen scènes · Études de cas
- `tester.html` — hub Se tester fédérant Quiz · Examen blanc · Mastery · Succès

Chaque hub propose : bandeau de progression dynamique (2-3 jauges), grille de cartes vers les sous-types, recommandations adaptatives au profil utilisateur, cross-links vers les 3 autres hubs.

Les 4 pilules d'accueil pointent désormais vers ces hubs (au lieu des apps directes).

#### Nouvelles fonctionnalités (v131b, v132a-e)
- Filtres niveau/phase + parcours pédagogique numéroté sur `tutoriels.html` (v131b)
- Page **404 custom** + sitemap.xml (178 URLs auto-générée) + robots.txt + Jekyll exclude (v132a)
- Script `scripts/generate_sitemap.py` (v132a)
- Trophée **toolkit cumulatif** 3 paliers (🥉 5 / 🥈 15 / 🏆 28) — achievements 314 → 316 (v132b)
- **Partage social** des trophées via Web Share API (mobile) + fallback clipboard (desktop) (v132d)
- **og-images dédiées** par hub (4 SVG : apprendre / tutoriels / scene / quiz) + Twitter Cards complétées (v132e)

#### Performance (v132f, v132k, v132p)
- **Lazy load des questions par thème** : `data/questions.json` (4.2 MB) découpée en 8 chunks (`data/questions/quiz-*.json`) + `data/questions-index.json` (méta). Chargement parallèle HTTP/2 dans quiz-app / exam-app / cas-in-search. Script `scripts/split_questions.py`. **Économie : 4.2 MB au boot PWA.**
- **Index de recherche minimaliste** (`data/questions-search.json`, 425 KB) qui remplace le chargement de 4.2 MB pour la search globale. Stratégie de chargement à 3 niveaux : search-index → chunks → legacy. **Économie : ~3.8 MB par recherche initiale.**
- **SW trim massif** : 1669 lignes de commentaires historiques retirées (l'historique est dans ce CHANGELOG). SW : 110 KB → 21 KB (-81%). Code fonctionnel identique.

#### Sécurité (v132l, v132n)
- **Content-Security-Policy** sur **183 pages** via meta tag :
  ```
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob:;
  connect-src 'self';
  object-src 'none'; base-uri 'self'; form-action 'self';
  frame-ancestors 'none';
  ```
- **Module `cas-in-storage.js`** : validation au boot des 19 clés critiques de localStorage, backup automatique avant purge (TTL 7j), versioning du schema (`SCHEMA_VERSION = 1`), audit log pour debug.

#### Accessibilité (v132i)
- Module `cas-in-a11y.js` chargé sur les 4 hubs + 404 + offline (en plus des 8 pages existantes) — skip-link, landmark `<main>`, API `CASa11y.announce()`
- `<h1>` sr-only ajouté sur quiz, tp, case-study-detail, sagas, succes
- aria-label sur le bouton « 💡 » du quiz (était `title` seul, pas fiable lecteurs d'écran)

#### Helpers et infrastructure (v132f, v132g, v132n, v132o)
- `CasInUtils.dataUrl(rel)` — résout les paths `data/X.json` depuis n'importe quelle page (racine ou sous-dossier)
- Helper `_dataUrl()` inline dans 13 scripts (autonomie max, fix régression v131c)
- Bouton « 🎓 Relancer le tour » dans le profil pour ré-afficher l'onboarding (v132o)
- Document `AUDIT_i18n.md` — couverture 100 % clés FR/EN/DE/IT, déploiement HTML 4 %
- Document `AUDIT_a11y.md` — état WCAG, contrastes, quick wins identifiés

### Modifié

#### Pilules d'accueil
Les 4 verbes (APPRENDRE / PRATIQUER / ENQUÊTER / SE TESTER) cadrent l'action sous le label. Les pilules pointent vers les hubs symétriques au lieu des apps directes.

#### Réorganisation racine 22 → 11 fichiers HTML (v131c)
16 pages déplacées dans `pages/` : `profile`, `collections`, `sagas`, `npcs`, `exam`, `scene-exam`, `case-studies`, `case-study-detail`, `glossary`, `mastery`, `parcours`, `parcours-detail`, `succes`, `tools`, `carriere`, `dictionnaire`. Tous les ~74 liens internes mis à jour. `cas-in-navbar.js` détecte automatiquement la profondeur de la page courante.

#### Navbar PAGE_TITLES (v131a-ux, v132h)
Étendu avec les 4 entrées de hubs : Apprendre, Pratiquer, Enquêter, Se tester.

#### Onboarding (v132o)
Contenu des 3 slides mis à jour pour refléter la structure v3.0 :
- Slide 2 : « 3 chemins » → « 4 pôles » avec chiffres actuels (392 scènes, 2235 questions, 120 fiches, 28 tutoriels)
- Slide 3 : 3 suggestions par profil utilisateur (curieux / pressé / évaluation) + astuce raccourcis B/V/O/R + mentions RGPD/offline

#### Couleur `--dim` WCAG AA (v132i)
- Dark : `#6e7681` (ratio 4.12 ❌) → `#7d8590` (5.07 ✅) dans `style/fiche_style.css`
- Light : `#6b7a90` (4.10 ❌) → `#5a6878` (5.35 ✅) dans `fiche_style.css`, `quiz.css`, `scene.css`

Alignement sur la valeur déjà conforme dans `style.css` depuis v2.59.

### Corrigé

#### Bugs v130 (v131a-fixes)
- `npc-arcs.js` manquant du précache SW (404 silencieux)
- `cas-in-unlocks.js` retiré du précache (orphelin)
- `rank-ceremony.js` retiré du précache (orphelin)
- 9 scripts orphelins supprimés (achievement-effects, animation-mascot, autocomplete-search, breadcrumb-context, cookie-banner, distinction-evolution, fiche-bookmarks, glossary-popover, swipe-gestures)

#### Régression v131c généralisée (v132g)
13 scripts JS faisaient `fetch('data/X.json')` en relatif → cassé depuis `pages/` (résolution `pages/data/X.json` → 404). Helper inline `_dataUrl()` ajouté dans : `collections-app`, `case-studies-app`, `sagas-app`, `scene-campaigns`, `scene-arc-context`, `profile-affinities`, `profile-atmospheres`, `profile-relations`, `profile-dashboard`, `completion-watcher`, `legal-ref-popover`, `cas-in-npc-data`, `cas-in-i18n`.

**Pages rétablies** : Profil (blocs atmospheres/relations/dashboard), Collections, Études de cas, Sagas, PNJ, Glossaire, i18n (toutes langues sauf FR), Mastery.

#### Régression v131c sur exam-app (v132f)
`pages/exam.html` avait son lazy load questions cassé depuis le déplacement en v131c. Fix via le helper `_dataUrl()`.

#### Heuristiques localStorage des hubs (v132j)
Les compteurs de progression des 3 hubs créés en v132h utilisaient des clés inventées au lieu des vraies. Corrigés avec les **vraies clés du projet** :
- TP : `tp_solved` lu en `Object.keys(...).filter(c => count > 0).length` (catégories)
- Outils : `tools_used` (`{toolKey: count}`)
- Scènes : `scene_results.pct >= 70` (seuil COMPLETION_THRESHOLD officiel)
- Sagas : croisement `campaigns.json` × `scene_results`
- Questions vues : `qs` (cumul, pas `cas_quiz_run_buffer` qui est journalier)
- Examens blancs : `casIn_examHistory` (pas `examHist` qui est quiz-exam-mode)

#### Headings et labels (v132i)
- 6 pages sans `<h1>` corrigées (quiz, tp, case-study-detail, sagas, succes)
- aria-label ajouté au bouton hint du quiz

#### Code mort (v132c)
- `window.Unlocks` retiré de `pages/profile.html` et `pages/carriere.html` (corrige régression v131c)

### Supprimé

- 9 scripts JS orphelins (cf. v131a-fixes)
- 1669 lignes de commentaires historiques dans `sw.js` (l'historique est ici)
- **Optionnel** (via `scripts/cleanup-questions-legacy.sh`) : `data/questions.json` legacy (4.2 MB) maintenant que les chunks fonctionnent

### Performance — récap chiffré

| Optimisation | Avant | Après | Économie |
|---|---:|---:|---:|
| Boot PWA (questions précachées) | 4.2 MB | 1.6 KB index | **-4.2 MB** |
| Recherche globale initiale | 4.2 MB | 425 KB | **-3.8 MB** |
| Service Worker | 110 KB | 21 KB | **-89 KB** |
| **Cumul** | | | **~8 MB** |

### Notes techniques

- **Cache SW bumpé 13 fois** durant la cascade : v131 → v132 → v133 → v134 → v135 → v136 → v137 → v138 → v139 → v140 → v141 → v142 → v143 → v144
- **Pas de breaking change** côté utilisateur : tout est rétrocompatible (helpers existants conservés, fallbacks systématiques)
- **CSP avec `'unsafe-inline'`** : compromis nécessaire pour les inline scripts sur GitHub Pages (sans serveur dynamique pour les nonces)
- **Helper `_dataUrl()` dupliqué inline** dans 14 scripts : choix d'autonomie max plutôt que dépendance forte sur `CasInUtils`
- **Aucun lien cassé** sur les 180 pages après cascade complète, validé par script de test

### Migration

- **Côté utilisateur** : aucune action requise. Au prochain refresh, le banner SW propose « Recharger », l'app passe à `cas-in-v144`. Les données localStorage sont préservées (et désormais validées au boot).
- **Côté repo** : déploiement par cascade séquentielle des 20 deltas v131a → v132p. Voir `docs/deltas/` pour les manifestes individuels.
- **Schema localStorage** : version 1 (équivalent à v3.0-jolification). Pas de migration nécessaire pour les profils v2.x existants.

### Annexe — liste des 20 deltas

| # | Delta | Date | Objet | Cache SW |
|---|---|---|---|---|
| 1 | v131a-fixes | 30/05 | 3 bugs + 9 scripts orphelins supprimés | v131 |
| 2 | v131a-ux | 30/05 | Verbes pilules + hub Apprendre | v131 |
| 3 | v131b | 30/05 | Filtres tutoriels + parcours numéroté | v131 |
| 4 | v131c | 30/05 | Réorganisation racine 22 → 11, pages/ dédié | v132 |
| 5 | v132a | 30/05 | 404, sitemap, robots, Jekyll exclude | v132 |
| 6 | v132b | 30/05 | Trophée toolkit cumulatif 3 paliers | v132 |
| 7 | v132c | 30/05 | Cleanup window.Unlocks | v132 |
| 8 | v132d | 30/05 | Partage social Web Share API | v133 |
| 9 | v132e | 30/05 | og-images dédiées par hub | v134 |
| 10 | v132f | 30/05 | Lazy load questions par thème (-4.2 MB) | v135 |
| 11 | v132g | 30/05 | Fix régression v131c généralisée | v136 |
| 12 | v132h | 30/05 | Symétrie hubs Pratiquer/Enquêter/Se tester | v137 |
| 13 | v132i | 30/05 | Quick wins a11y (WCAG 2.2 AA) | v138 |
| 14 | v132j | 30/05 | Bug fixes heuristiques hubs + cleanup legacy | v139 |
| 15 | v132k | 30/05 | Index de recherche minimaliste (-3.8 MB) | v140 |
| 16 | v132l | 30/05 | CSP sur 183 pages | v141 |
| 17 | v132m | 30/05 | CHANGELOG mis à jour | inchangé |
| 18 | v132n | 30/05 | Robustesse localStorage + versioning schema | v142 |
| 19 | v132o | 30/05 | Onboarding mis à jour v3.0 + bouton replay | v143 |
| 20 | v132p | 30/05 | SW trim (-89 KB) + meta description | v144 |

---

## [3.0] — 2026-05-19

🎯 **Release initiale v3.0.** État de l'app avant la vague de jolification.

### État au release

- 250 scènes jouables
- 2 202 questions de quiz
- 120 fiches techniques
- 332 NPCs nommés
- 27 campagnes thématiques
- 14 sagas narratives
- 31 TP forensiques
- 7 pages de référence DFIR
- 71 ressources bibliographiques
- PWA offline-first opérationnelle

Détails dans les entrées v2.x ci-dessous.

---

## [2.63] — 2026-05-09

🧹 **Suppression de doublons morts dans `js/pages/` — récupération de deux fixes v2.60 oubliés au passage.**

### Corrigé

- **Horloge UTC du status bar profil — fix v2.60 jamais déployé en prod.** Le CHANGELOG v2.60 annonçait que l'horloge UTC du dossier (`#profile-utc`) tickait désormais en live (alignée sur la minute suivante via `60_000 - Date.now() % 60_000`, puis `setInterval(60_000)`). Le code du fix existait bien — mais dans `js/pages/profile-page.js`, qui n'était **chargé par aucune page** (ni HTML ni `STATIC_ASSETS` du SW). La version live, `js/profile/profile-page.js`, est restée avec l'horloge gelée pendant 3 versions. Les utilisateurs avec un dossier ouvert 30 min voyaient encore l'heure d'arrivée. Fix porté ligne pour ligne dans le bon fichier (`paintUtcClock()` extrait + tick installé en fin de `boot()`).
- **Cérémonie `dossier-activated` — même symptôme.** L'event `dossier-activated` est correctement dispatché par `cas-in-profile.js#addXp()` à la 1re XP, mais le listener qui jouait le toast « Dossier activé · Approuvé par R.R aka Banzaï » était dans `js/pages/celebration-ui.js` (orphelin). Conséquence : depuis v2.60, **aucun nouvel utilisateur n'a vu cette cérémonie**. Listener porté dans `js/profile/celebration-ui.js`.

### Supprimé

- **`js/pages/profile-page.js`** (37 KB) — orphelin, non référencé par les HTML ni par `STATIC_ASSETS` du SW. La version live est `js/profile/profile-page.js`. Reliquat d'un refactor v2.10 (déplacement de la logique profil vers `js/profile/`) qui a laissé la copie source en place.
- **`js/pages/celebration-ui.js`** (3.6 KB) — idem, orphelin du même refactor.

### Notes techniques

- **Comment a-t-on raté ça pendant 3 versions ?** Les deux fichiers orphelins ont survécu parce qu'ils ne génèrent aucune erreur runtime (jamais chargés ⇒ jamais exécutés ⇒ silencieux). Sans test fonctionnel sur l'horloge ni sur l'event `dossier-activated`, la dérive est passée sous le radar du `node --check`.
- **`CACHE_VERSION` bumpé** v142 → v143 pour propager les fixes UTC + dossier-activated aux installations existantes.
- **Tests** : `tests/test-cas-in.js` et `tests/test-achievements-sync.js` passent (51 OK, 0 FAIL).

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
