# Architecture CAS-IN

> Document de référence pour comprendre comment le code est organisé,
> et **dans quel ordre** charger les choses sans tout casser.
>
> Si tu arrives sur le projet, lis ceci avant de toucher un fichier.

## Vue d'ensemble en une image

```
┌──────────────────────────────────────────────────────────────────┐
│                         CONSOMMATEURS (HTML)                     │
│   index · quiz · scene · tp · exam · tools · profile             │
└──────────────────────────────────────────────────────────────────┘
                              ↓ scripts defer
┌──────────────────────────────────────────────────────────────────┐
│   js/pages/         ←  apps spécifiques par page                 │
│   quiz-app, scene-app, exam-app, tools-app,                      │
│   landing, scene-lobby-v3, scene-engine-v4, *-ui/ux-patch        │
└──────────────────────────────────────────────────────────────────┘
                              ↓ utilise + écrit dans localStorage
┌──────────────────────────────────────────────────────────────────┐
│   js/bridges/       ←  intercepte localStorage des pages         │
│   quiz-profile-bridge, scene-profile-bridge, tp-profile-bridge   │
│   (override Storage.prototype.setItem/getItem au runtime)        │
└──────────────────────────────────────────────────────────────────┘
                              ↓ route les écritures vers Profile
┌──────────────────────────────────────────────────────────────────┐
│   js/profile/       ←  composants UI liés au profil              │
│   profile-banner (transversal)  ·  profile-page  ·  track-v5     │
└──────────────────────────────────────────────────────────────────┘
                              ↓ lit la source de vérité
┌──────────────────────────────────────────────────────────────────┐
│   js/core/          ←  source de vérité + services partagés      │
│   cas-in-profile (XP/rang/streak/agent — UNIQUE source de vérité)│
│   cas-in-counts · cas-in-export · cas-in-pwa · cas-in-search     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                          localStorage
```

## Les 4 couches

### 1. `js/core/` — Source de vérité et services transversaux

| Fichier               | Rôle                                                  |
|-----------------------|-------------------------------------------------------|
| `cas-in-profile.js`   | **Source unique** XP / rang / streak / agent / track. Migration legacy → v2. Toute écriture doit passer par `Profile.addXp()`, `Profile.bumpStreak()`, etc. |
| `cas-in-counts.js`    | Patche les `<span data-count="…">` au runtime depuis `counts.json`. |
| `cas-in-export.js`    | Export / import du profil en JSON.                    |
| `cas-in-pwa.js`       | Enregistre le Service Worker, détecte les updates.    |
| `cas-in-search.js`    | Recherche globale (Ctrl+K) sur fiches/questions/TP/scènes. |

**Convention** : tout fichier `core/` est sans état de page, sans dépendance UI propriétaire, et peut être chargé sur n'importe quelle page.

### 2. `js/profile/` — UI du profil

| Fichier                 | Rôle                                                     |
|-------------------------|----------------------------------------------------------|
| `profile-banner.js`     | Mini-bandeau transversal (pseudo · rang · XP · streak) injecté en haut de quiz/scene/tp. **Seule** source d'affichage du rang depuis v2.10. |
| `profile-page.js`       | Logique de `profile.html` (dossier complet, ladder, badges).  |
| `profile-track-v5.js`   | Sélecteur de track narratif (4 voies) + mini-test d'orientation + célébration de promotions. |

### 3. `js/bridges/` — Compatibilité legacy

Ces 3 fichiers existent uniquement pour permettre à `quiz-app.js`, `scene-app.js`, `tp-engine.js` de continuer à utiliser leurs clés legacy (`xp`, `cas_xp`, `dayStreak`, `cas_streak`) **comme si** elles étaient locales, en les routant silencieusement vers `Profile`.

| Fichier                       | Intercepte                  |
|-------------------------------|-----------------------------|
| `bridges/quiz-profile-bridge.js`  | `localStorage.['xp', 'dayStreak', 'achievements']` |
| `bridges/scene-profile-bridge.js` | `localStorage.['cas_xp', 'cas_streak']`            |
| `bridges/tp-profile-bridge.js`    | (compteur TP)                                      |

**Comment ça marche** : à l'init, le bridge override `Storage.prototype.setItem` et `Storage.prototype.getItem` via `Object.defineProperty(localStorage, …)`. Quand `quiz-app.js` fait `localStorage.setItem('xp', 47)`, le bridge calcule le delta vs la dernière valeur connue et appelle `Profile.addXp(delta, 'quiz')`. La clé `xp` n'est **jamais** persistée.

> ⚠️ Ce mécanisme est de la **dette technique**. À terme, `quiz-app.js` et `scene-app.js` devraient appeler `Profile.addXp()` directement et ce dossier `bridges/` disparaître. Voir `CHANGELOG.md` § « Future work ».

### 4. `js/pages/` — Applications par page

| Fichier               | Page          | Rôle                                |
|-----------------------|---------------|-------------------------------------|
| `landing.js`          | `index.html`  | Pluie Matrix, navigation, drawer.   |
| `landing-3d.js`       | `index.html`  | Effet 3D (lazy).                    |
| `quiz-app.js`         | `quiz.html`   | Moteur quiz (6700 lignes).          |
| `quiz-ui-patch.js`    | `quiz.html`   | Patches UI v2.6+ (menu Plus, daily-banner, états vides). |
| `scene-app.js`        | `scene.html`  | Moteur scènes legacy.               |
| `scene-engine-v4.js`  | `scene.html`  | Moteur v4 (briefing, export MD, révision). |
| `scene-lobby-v3.js`   | `scene.html`  | Lobby v3 (parcours, atmosphères, tri). |
| `scene-ux-patch.js`   | `scene.html`  | Patches UX scène.                   |
| `exam-app.js`         | `exam.html`   | Mode examen blanc.                  |
| `tools-app.js`        | `tools.html`  | Calculateurs forensiques.           |

## Couches & ordre de chargement

L'ordre des `<script defer>` n'est pas négociable. La règle :

```
core/ → profile/ → bridges/ → pages/
```

Concrètement, dans le `<head>` de `quiz.html` :

```html
<!-- 1. Source de vérité (Profile global) -->
<script src="js/core/cas-in-profile.js" defer></script>

<!-- 2. Composants profile (peuvent dépendre de Profile) -->
<script src="js/profile/profile-track-v5.js" defer></script>

<!-- 3. Bridge (override localStorage AVANT que quiz-app n'écrive) -->
<script src="js/bridges/quiz-profile-bridge.js" defer></script>

<!-- 4. Services transversaux (lecture seule, ordre libre) -->
<script src="js/core/cas-in-counts.js" defer></script>
<script src="js/core/cas-in-pwa.js" defer></script>
<script src="js/core/cas-in-search.js" defer></script>

<!-- 5. App de page (en bas du body, defer) -->
<script src="js/pages/quiz-app.js" defer></script>
<script src="js/pages/quiz-ui-patch.js" defer></script>

<!-- 6. UI banner (charge après que tout est en place) -->
<script src="js/profile/profile-banner.js" defer></script>
```

Si un script doit accéder à `window.Profile`, il doit charger **après** `core/cas-in-profile.js`. Tous les fichiers HTML touchés en v2.10 contiennent désormais un commentaire `<!-- ⚠ ORDRE CRITIQUE — ne pas réordonner -->` au-dessus du bloc.

## Stockage : où vit quoi

| Clé localStorage         | Source de vérité   | Lu par                   | Écrit par                          |
|--------------------------|--------------------|--------------------------|------------------------------------|
| `casIn_profile`          | **Profile**        | partout                  | `core/cas-in-profile.js` UNIQUEMENT |
| `xp` (legacy)            | Profile            | `quiz-app.js` (via bridge)| (intercepté → no-op réel)         |
| `cas_xp` (legacy)        | Profile            | `scene-app.js` (via bridge)| (intercepté → no-op réel)        |
| `dayStreak` (legacy)     | Profile.streak     | `quiz-app.js` (via bridge)| (intercepté)                      |
| `cas_streak` (legacy)    | Profile.streak     | `scene-app.js` (via bridge)| (intercepté)                     |
| `bookmarks`              | local              | `quiz-app.js`            | `quiz-app.js`                      |
| `achievements`           | dupliqué (Profile + local) | `quiz-app.js`    | `quiz-app.js` + sync vers Profile |
| `dailyBannerDismissed`   | local (v2.10+)     | `quiz-ui-patch.js`       | `quiz-ui-patch.js`                 |
| `casIn_readFiches_v4`    | local              | toutes les fiches        | code inline des fiches             |
| `tp_solved`              | local              | `tp-engine.js`           | `tp-engine.js`                     |
| `bossBeaten`, `scenesBeaten`, `missionBeaten`, `freezeUsed_*` | local | `quiz-app.js` | `quiz-app.js` |

## CSS

```
style/
├── style.css              # Style commun (quiz + base)
├── quiz.css               # Quiz-specific
├── scene.css              # Scene-specific (extrait du <style> inline en v2.10)
├── tp-page.css            # tp.html chrome (extrait en v2.10)
├── tp.css                 # TP engine (zones d'exercices)
├── tools.css              # tools.html (extrait en v2.10)
├── exam.css               # exam.html (extrait en v2.10)
├── landing.css            # Landing page
├── profile.css            # profile.html
├── profile-banner.css     # Bandeau transversal (toutes pages sauf index/profile)
└── fiche_style.css        # Toutes les fiches HTML
```

Avant v2.10, `scene.html` (87 KB), `tp.html` (39 KB), `tools.html` (33 KB), `exam.html` (23 KB) avaient leur CSS inline → bloquait le cache navigateur, gonflait chaque GET HTML, et empêchait toute CSP `style-src` stricte. Désormais tout est externalisé.

## Service Worker

`sw.js` v31+ : Network-First pour HTML/JSON, Cache-First pour CSS/JS, fallback `offline.html`. La liste `STATIC_ASSETS` est manuelle ; quand on ajoute un fichier JS/CSS au repo, **il faut** :

1. L'ajouter dans `STATIC_ASSETS`
2. Bumper `CACHE_VERSION` de `v31` à `v32` (sinon les utilisateurs offline ne récupèrent pas le nouveau fichier)
3. Documenter le bump en tête de fichier

## Données (lazy-loadées)

```
scenes/
├── index.json     # Méta-index 90 scènes (~64 KB)  ← chargé au boot
└── *.json         # Une scène complète par fichier ← lazy via fetch
```

```
fiches/             # 95 fiches HTML statiques, liées depuis manifest.json
manifest.json       # Index des fiches (catégorie, desc, path)
```

```
questions.json      # 1750 questions quiz (2.5 MB, monolithique)
                    # ⚠ candidat à un sharding similaire à scenes/ — voir Future work
```

## Future work

- **Sharding `questions.json`** par thème (cf. ce qui a été fait pour `scenes.js` → `scenes/index.json` + lazy en v2.7).
- **Élimination de `bridges/`** : refactor de `quiz-app.js` / `scene-app.js` pour appeler directement `Profile.addXp()` / `Profile.bumpStreak()`. Une fois fait, le proxy `Storage.prototype` peut être retiré et la couche `bridges/` supprimée.
- **Unification des rangs** : aujourd'hui, `quiz-app.js` a sa constante `RANKS`, `scene-app.js` a son `getGrade()`, et `cas-in-profile.js` a `TRACKS[…].ranks`. Trois systèmes avec des seuils différents. Cible : `Profile.getRank()` partout. Migration `casIn_profile` v=2 → v=3 à prévoir pour ré-aligner les seuils débloqués.
- **Achievements unifiés** : `quiz-app.js#ACHIEVEMENTS`, `scene-app.js#GLOBAL_BADGES`, `Profile.achievements` — fusionner dans un `js/core/cas-in-achievements.js`.
- **Performance `profile-banner.js`** : éviter le `innerHTML = …` complet à chaque `Profile.onChange()`. Targeted text updates.
