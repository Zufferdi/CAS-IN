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
│   tp-profile-bridge (quiz/scene supprimés en v2.85+)             │
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

### 3. `js/bridges/` — Compatibilité legacy (résiduel depuis v2.85+)

> ✅ **Statut v2.85+** : `quiz-profile-bridge.js` et `scene-profile-bridge.js`
> ont été **supprimés**. Depuis v2.83, `quiz-app.js` et `scene-app.js` appellent
> directement `Profile.addXp()` / `Profile.bumpStreak()`. Seul `tp-profile-bridge.js`
> est encore actif (chargé par `tp.html`).
>
> Note historique : les deux bridges supprimés ont été conservés pendant deux
> versions en mode "non chargé" pour faciliter un éventuel rollback. Ils ne
> doivent **pas** être réintroduits sans précaution : le `lsSet('xp', S.xp)`
> legacy persiste dans le quiz/scene, donc l'interception causerait un double
> comptage de l'XP. La trace dans `CHANGELOG.md` documente le retrait.

| Fichier                       | Statut                      |
|-------------------------------|-----------------------------|
| `bridges/tp-profile-bridge.js`    | ✓ actif sur `tp.html` (compteur TP + AchievementsCore.evalAndUnlock)|

**Comment ça marche (pour le bridge TP encore actif)** : à l'init, le bridge
override `Storage.prototype.setItem` et `Storage.prototype.getItem` via
`Object.defineProperty(localStorage, …)`. Quand `tp-engine.js` fait
`localStorage.setItem('tp_solved', …)`, le bridge attrape et déclenche
`AchievementsCore.evalAndUnlock(Profile.snapshot())`.

> ⚠️ Ce mécanisme est de la **dette technique**. À terme, `tp-engine.js`
> devrait appeler `AchievementsCore.evalAndUnlock` directement et ce dossier
> `bridges/` disparaître entièrement. Voir `CHANGELOG.md` § « Future work ».

### 4. `js/pages/` — Applications par page

| Fichier               | Page          | Rôle                                |
|-----------------------|---------------|-------------------------------------|
| `landing.js`          | `index.html`  | Pluie Matrix, navigation, drawer.   |
| `landing-3d.js`       | `index.html`  | Effet 3D (lazy).                    |
| `quiz-app.js`         | `quiz.html`   | Moteur quiz (5337 lignes — quiz-ui-patch mergé en v2.22). |
| `scene-app.js`        | `scene.html`  | Moteur scènes legacy (4305 lignes).               |
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

Concrètement, dans le `<head>` de `quiz.html` (état réel v2.85) :

```html
<!-- 1. Source de vérité (Profile global) -->
<script src="js/core/cas-in-profile.js" defer></script>

<!-- 2. Achievements + Quests + Mastery (s'appuient sur Profile) -->
<script src="js/core/cas-in-achievements.js" defer></script>
<script src="js/core/cas-in-quests.js" defer></script>

<!-- 3. Services transversaux (lecture seule, ordre libre) -->
<script src="js/core/cas-in-counts.js" defer></script>
<script src="js/core/cas-in-pwa.js" defer></script>
<script src="js/core/cas-in-search.js" defer></script>
<script src="js/core/cas-in-utils.js" defer></script>
<script src="js/core/cas-in-storage.js" defer></script>

<!-- 4. App de page (en bas du body, defer) — appelle Profile.addXp directement -->
<script src="js/pages/quiz-app.js" defer></script>
```

Note : depuis v2.83, `quiz-app.js` appelle `window.Profile.addXp(pts, 'quiz', { tags })`
directement. Le bridge `quiz-profile-bridge.js` a été supprimé en v2.85+ (cf. §3 ci-dessus).

Si un script doit accéder à `window.Profile`, il doit charger **après** `core/cas-in-profile.js`. Tous les fichiers HTML touchés en v2.10 contiennent désormais un commentaire `<!-- ⚠ ORDRE CRITIQUE — ne pas réordonner -->` au-dessus du bloc.

## Stockage : où vit quoi

| Clé localStorage         | Source de vérité   | Lu par                   | Écrit par                          |
|--------------------------|--------------------|--------------------------|------------------------------------|
| `casIn_profile`          | **Profile**        | partout                  | `core/cas-in-profile.js` UNIQUEMENT |
| `xp` (legacy)            | local (miroir)     | `quiz-app.js` interne    | `quiz-app.js#addXp` (en plus de `Profile.addXp`) |
| `cas_xp` (legacy)        | local (miroir)     | `scene-app.js` interne   | `scene-app.js#addXP` (en plus de `Profile.addXp`) |
| `dayStreak` (legacy)     | local (miroir)     | `quiz-app.js` interne    | `quiz-app.js`                      |
| `cas_streak` (legacy)    | local (miroir)     | `scene-app.js` interne   | `scene-app.js`                     |
| `bookmarks`              | local              | `quiz-app.js`            | `quiz-app.js`                      |
| `achievements`           | dupliqué (Profile + local) | `quiz-app.js`    | `quiz-app.js` + sync vers Profile |
| `dailyBannerDismissed`   | local (v2.10+)     | `quiz-app.js`            | `quiz-app.js`                      |
| `casIn_readFiches_v4`    | local              | toutes les fiches        | code inline des fiches + `fiche-reader.js` |
| `tp_solved`              | local              | `tp-engine.js`           | `tp-engine.js`                     |
| `bossBeaten`, `scenesBeaten`, `missionBeaten`, `freezeUsed_*` | local | `quiz-app.js` | `quiz-app.js` |

> Note v2.85 : depuis le retrait des bridges quiz/scene, les clés `xp`, `cas_xp`,
> `dayStreak`, `cas_streak` ne sont plus interceptées. Elles sont maintenant
> écrites en miroir (Profile + clé legacy) par `quiz-app.js` et `scene-app.js`
> directement. La source de vérité reste `casIn_profile` ; le miroir legacy
> existe pour les call-sites internes au quiz/scene qui n'ont pas encore migré.

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

`sw.js` (voir `CACHE_VERSION` en tête de fichier pour la version courante) : Network-First pour HTML/JSON, Cache-First pour CSS/JS, fallback `offline.html`. La liste `STATIC_ASSETS` est manuelle ; quand on ajoute un fichier JS/CSS au repo, **il faut** :

1. L'ajouter dans `STATIC_ASSETS`
2. Bumper `CACHE_VERSION` (sinon les utilisateurs offline ne récupèrent pas le nouveau fichier)
3. Documenter le bump dans `CHANGELOG.md`

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
- **Élimination de `bridges/`** : quiz et scene retirés en v2.85+. Reste `tp-profile-bridge.js` à dégager — refactor de `tp-engine.js` pour appeler `AchievementsCore.evalAndUnlock` directement, puis suppression du dossier `bridges/`.
- **Unification des rangs** : aujourd'hui, `quiz-app.js` a sa constante `RANKS`, `scene-app.js` a son `getGrade()`, et `cas-in-profile.js` a `TRACKS[…].ranks`. Trois systèmes avec des seuils différents. Cible : `Profile.getRank()` partout. Migration `casIn_profile` v=2 → v=3 à prévoir pour ré-aligner les seuils débloqués.
- **`cas-in-storage.js`** : wrapper défini en v2.60 mais aucun consommateur. Soit on commit à la migration (remplacer `localStorage.getItem` par `CasInStorage.get` dans quiz-app/scene-app/tp-engine), soit on supprime le fichier.
- **Achievements unifiés (suite)** : `cas-in-achievements.js` couvre désormais TP/fiches centralisés, mais `quiz-app.js#ACHIEVEMENTS` et `scene-app.js#GLOBAL_BADGES` ont leurs propres checks runtime. Cible : tout reconstructible depuis `Profile.snapshot()` + scene_results.
- **Performance `profile-banner.js`** : éviter le `innerHTML = …` complet à chaque `Profile.onChange()`. Targeted text updates.
