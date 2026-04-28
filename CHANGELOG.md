# Changelog

Toutes les modifications notables apportées à ce projet sont documentées ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

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
