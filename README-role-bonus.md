# Patch bonus XP thématique par rôle — sw v37

Stratégie 1 (différenciation des rôles via gain XP) **enfin opérationnelle**.

## Pourquoi ce patch

Lors de la cartographie initiale du code, j'ai découvert que **le système de bonus rôle existait déjà dans `cas-in-profile.js`** mais qu'il n'était jamais déclenché en pratique :

1. **Trois systèmes redondants** coexistaient (`TRACK_BONUS_RAW`, `TRACK_BONUS_TAGS`, `ROLE_BONUS`, plus l'actif `ROLE_BONUS_TAGS`) — séquelles d'allers-retours d'implémentation
2. **Les bridges ne passaient pas les tags** à `Profile.addXp()` → `getRoleBonus()` recevait toujours `[]` et retournait toujours `1.0`
3. **Bug de double-comptage** dans scene-app : appel direct à `Profile.addXp` ET écriture de `cas_xp` interceptée par le bridge → l'XP comptait deux fois

## Ce qui change

| Fichier | Modification |
|---|---|
| `js/core/cas-in-profile.js` | Suppression des deux systèmes morts (~150 lignes) ; nouveau export `getRoleBonusTags(roleKey)` |
| `js/pages/quiz-app.js` | `addXp(pts, contextTags)` publie les tags sur `window.__casInBonusTags` avant `lsSet('xp', ...)` |
| `js/pages/scene-app.js` | Flag `__casInProfileApplied` empêche le double-comptage avec le bridge ; toast bonus dans le rapport |
| `js/bridges/quiz-profile-bridge.js` | Lit `__casInBonusTags` et passe `meta.tags` à `Profile.addXp` |
| `js/bridges/scene-profile-bridge.js` | Skip si `__casInProfileApplied` est levé |
| `js/profile/profile-page.js` | Nouveau `renderSpecialty()` qui affiche les tags du rôle |
| `profile.html` | Encart « Spécialité » sous le rang dans la hero card |
| `style/profile.css` | Styles `.profile-specialty*` |
| `style/scene.css` | Style `.xp-gained-role-bonus` (la pastille de bonus dans le rapport) |
| `sw.js` | v36 → v37 |

## Comment ça marche maintenant

- Le **rôle Magistrat** matche les tags : DROIT, CPP, LPD, EIMP, PROCÉDURE, MROS, GOUVERNANCE, AUDIT FORENSIQUE, etc.
- Le **rôle Hacker** matche : MALWARE, RANSOMWARE, RÉSEAUX, CRYPTO, IA, BEC, SUPPLY CHAIN, etc.
- Le **rôle Investigateur** matche : FORENSIQUE, OSINT, PREMIER INTERVENANT, CUSTODY, PROFILAGE, etc.
- Le **rôle Journaliste** matche : OSINT, DARKNET, SOURCES, MEDIAS, ENQUÊTE COUVERTE, etc.

Quand un quiz/scène avec un de ces tags est joué et qu'un seul match existe, l'XP gagnée est multipliée par **1.20**. Pas de cumul (un seul match suffit, on ne stack pas).

## Tests effectués (simulation Node)

```
Test 1 (no tags):                gained=100  multiplier=1.0  ✓
Test 2 (Droit, magistrate):      gained=120  multiplier=1.2  ✓
Test 3 (RÉSEAUX, magistrate):    gained=100  multiplier=1.0  ✓
Test 4 (RÉSEAUX, hacker):        gained=120  multiplier=1.2  ✓
Test 5 (mix avec MALWARE):       gained=120  multiplier=1.2  ✓
```

## Vérification après déploiement

1. **profile.html** — Sous ton rang doit apparaître un encart « 🎯 Spécialité du rôle · +20% XP » avec une vingtaine de petites pastilles vertes (les tags qui te font gagner du bonus).
2. **scene.html** — Joue une scène dont un tag matche ton rôle. Dans le rapport de fin, tu dois voir une pastille verte « 🎯 Bonus rôle ×1.20 (+X XP) » à côté du `+X XP`.
3. **quiz** — Le bonus s'applique en arrière-plan ; pour l'instant il n'y a pas de toast quiz visible (le quiz a son propre système d'XP local affiché à un autre endroit). L'effet est mesurable : ton XP profile augmentera +20% sur les questions thématiques.

## Suite (stratégie 4 — couleur HUD)

À faire après ce patch : `document.body.dataset.track = 'magistrate'` (ou autre) au chargement, et 4 jeux de variables CSS (`--accent`, `--accent-glow`...) qui changent selon le data-track. Ça donnera une signature visuelle unique à chaque rôle. ~1h de boulot, je le fais quand tu veux.
