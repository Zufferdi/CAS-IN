# CAS-IN — Patches priorités 1 à 7

Bundle de correctifs ciblés appliquant les 7 priorités court-terme de l'audit v2.10.
Base : zip `CAS-IN-2_10-cleaning__8_.zip` (l'archive `__9__.zip` n'était pas dans
les uploads, donc rebase trivial sur ton état courant).

## Ce que tu as

- **`all-changes.diff`** — patch unifié (550 lignes), applicable avec `git apply`
  ou `patch -p1` depuis la racine du repo.
- **`js/`, `style/`, `tests/`, `sw.js`** — fichiers complets remplaçables si tu
  préfères copier-coller plutôt qu'appliquer le diff.

## Comment appliquer

### Option A — diff (recommandé)
```bash
cd /chemin/vers/ton/CAS-IN-2.10-cleaning
git apply --check ../cas-in-priorities-1to7/all-changes.diff   # dry-run
git apply ../cas-in-priorities-1to7/all-changes.diff
git diff --stat                                                # vérifier
node tests/test-cas-in.js sw.js                                # tests
node tests/test-achievements-sync.js                           # tests
```

### Option B — copy direct
Recopier les 13 fichiers modifiés depuis ce bundle, en préservant l'arborescence.

## Fichiers touchés

| Fichier | Priorité | Résumé |
|---|---|---|
| `js/components/fiche-reader.js` | 1 | `addXp(15, 'fiches', { tags: [...]})` au lieu de `{ fiche }` |
| `js/core/cas-in-quests.js` | 1 | `addXp(xp, 'quest', { tags })` + tags sur 2 quêtes thématiques |
| `js/pages/scene-lobby-v3.js` | 1 | Campagnes : tags dérivés de l'id |
| `js/pages/scene-engine-v4.js` | 2 | +24 articles glossaire (couverture 45→62%) + fallback al. + escape XSS |
| `sw.js` | 3 | +5 assets (artifacts.html, glossary.html, npc-arcs.js, artifacts-{app,data}.js), bump v126→v127 |
| `js/pages/scene-app.js` | 4 | Procureur timer : pause/reprise sur visibilitychange |
| `js/components/quest-banner.js` | 5 | `setInterval(3s)` retiré, re-render purement event-driven |
| `js/profile/profile-page.js` | 6 | escapeHtml délègue à `CasInUtils.escapeHTML` |
| `js/components/scene-npcs.js` | 6 | escapeHtml + escapeAttr délèguent à `CasInUtils` |
| `js/core/cas-in-utils.js` | 6 + 7 | Header doc + bootstrap prefers-color-scheme JS |
| `js/pages/exam-app.js` | 6 (bonus) | Fix double XSS latent dans `finishExam#wrongList` |
| `style/style.css` | 7 | `@media (prefers-color-scheme: light)` activant les variables auto |
| `tests/test-cas-in.js` | bonus | Test SW corrigé (`fetch(event.request)` → `networkFirst(`) |

## Effets mesurables

| Métrique | Avant | Après |
|---|---|---|
| Couverture glossaire juridique | 45.1 % | **61.9 %** |
| Sources XP avec bonus rôle (sur 6) | 3 | **6** (toutes) |
| HTML/JS racine non-précachés (offline) | 5 | **0** |
| `setInterval` polling sans changement | 1× / 3 s | 0 |
| XSS latents repérés | 2 dans exam-app + 1 dans tooltip | **0** |
| Fonctions escape HTML dupliquées | 6+ | 4 (2 ont migré vers CasInUtils) |
| CSS mode clair activable | 0 % du temps | **100 %** si OS prefers light |
| Tests `test-cas-in.js sw.js` | 10/11 | **11/11** |

## Points qui RESTENT sur la table (priorités 8+)

Tout ce qui était listé "moyen/long terme" dans l'audit n'est PAS touché ici :

- Sharding de `questions.json` (2.5 MB monolithique)
- Unification des 3 systèmes de rangs (quiz/scene/profile)
- `Profile.spendXp()` pour les coûts d'indices scène
- Refactor des 84 `!important` dans `fiche_style.css`
- Migration `onclick=` inline → `addEventListener` (pour CSP stricte)
- Suppression définitive des bridges quiz/scene morts
- Validation JSON Schema des scènes
- Fixes data : 5 scènes à atmosphère corrompue, 6 NPCs manquants,
  10 questions à options invisibles, INTERNATIONAL fantôme dans leaderboard

Et les bugs documentaires :
- README annonce 95 fiches / 90 scènes / 1750 questions (réel : 109/136/1906)
- ARCHITECTURE.md décrit les bridges quiz/scene comme actifs
- scene-engine-v4 commente "couverture 92% du corpus" (avant ces patches : 45%, après : 62%)

## Notes de comportement

### Priorité 1 — Bonus XP

Les tags pour fiches sont dérivés du **nom de fichier** + des **mots du `<h1>`** (>= 4 lettres,
max 6 mots). Validation manuelle :

| Fiche | Tags dérivés | Bonus pour |
|---|---|---|
| `linux_forensique.html` | linux, forensique | investigator (FORENSIQUE) |
| `crypto.html` | crypto | hacker (CRYPTO) |
| `ransomware_forensique.html` | ransomware, forensique | investigator + hacker |
| `osint.html` | osint | investigator + journalist |
| `droit_europeen.html` | droit, europeen | magistrate (DROIT) |

Pour les campagnes lobby-v3, mêmes règles avec l'id de campagne :

| Campagne | Tags dérivés | Bonus pour |
|---|---|---|
| `ransomware_a_z` | ransomware | hacker |
| `procedure_penale` | procedure, penale | magistrate |
| `cooperation_internationale` | cooperation, internationale | (aucun match) |

Note : `cooperation_internationale` ne matche aucun rôle (les `ROLE_BONUS_TAGS`
de magistrate ont 'COOPERATION INTERNATIONALE' en tant que **string composé**,
pas en mots séparés). Pour matcher, faudrait soit étendre `ROLE_BONUS_TAGS`
de magistrate avec 'COOPERATION' ou 'INTERNATIONALE' isolé, soit ajouter un
champ `tags` explicite dans `PARCOURS`. À voir comme priorité 8.

### Priorité 4 — Pause procureur

Le timer pause **uniquement quand `G.mode === 'procureur'`** et seulement
si `G` (state global de la scène en cours) existe. Aucun impact si l'utilisateur
n'est pas en mode procureur. La pause ne resette pas le compteur : reprise au
même temps restant que celui affiché à la perte de visibilité.

### Priorité 7 — prefers-color-scheme

**Sans JS** : les variables CSS du thème clair s'appliquent automatiquement via
`@media`. Le rendu est correct mais ~29 règles spécifiques (box-shadow des
cartes, surbrillance code, gradients) ne fonctionnent pas.

**Avec JS** (`cas-in-utils.js` chargé) : `data-theme="light"` est posé
automatiquement → toutes les règles existantes fonctionnent. Si tu ajoutes
plus tard un toggle manuel utilisateur, attention à respecter `dataset.themeAuto`
(le bootstrap ne touche pas aux thèmes posés manuellement).

## Sécurité de l'application

- `git apply --check` doit passer en clean. Si conflit (parce que tu as modifié
  les mêmes fichiers entre temps), résolution manuelle via les fichiers
  individuels du bundle.
- Aucune migration de données utilisateur (localStorage) requise. Les patches
  sont rétrocompatibles.
- Le bump `CACHE_VERSION` v126 → v127 forcera les utilisateurs PWA à
  re-télécharger les assets — c'est l'effet voulu pour récupérer les nouveaux
  fichiers précachés.

— Audit & patches générés par Claude (Anthropic) à la demande, mai 2026.
