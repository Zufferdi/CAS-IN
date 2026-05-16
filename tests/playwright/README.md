# Tests Playwright — CAS-IN

Suite de smoke tests pour les pages critiques : `tools.html`, `tp.html`, `profile.html`.

Le but n'est **pas** la couverture exhaustive — c'est un **filet de sécurité**
qui permet de refactorer agressivement (Phase 1 à 7 du plan d'évolution) sans
casser silencieusement le moteur d'exercices, la persistance du profil, ou
le système d'achievements.

## Pré-requis

- Node 18+
- Python 3 (déjà utilisé par les scripts du repo)
- ~150 MB pour le navigateur Chromium de Playwright

## Installation

```bash
npm install
npm run test:install   # télécharge Chromium (une seule fois)
```

## Lancer

```bash
npm test              # headless, rapide
npm run test:headed   # voir Chromium s'ouvrir (debug visuel)
npm run test:debug    # pas-à-pas avec inspecteur
npm run test:report   # ouvrir le rapport HTML (après échec)
```

Playwright démarre tout seul `python3 -m http.server 8765` puis le tue
à la fin. Si tu as déjà un serveur sur 8765, change `PORT` dans
`playwright.config.js`.

## Structure

```
tests/playwright/
├── helpers.js         # collectErrors, readLS, solveMultipleChoice
├── tools.spec.js      # 5 baseline + 4 acceptance Phase 1
├── tp.spec.js         # 4 baseline + 3 acceptance Phase 1
└── profile.spec.js    # 3 smoke
```

## Convention "Acceptance Phase 1"

Chaque `tools.spec.js` et `tp.spec.js` contient deux describe :

1. **Baseline** — passe AUJOURD'HUI, sans aucun fix.
   C'est notre filet : tant que ces tests sont verts, on peut refactorer.

2. **Acceptance Phase 1** — bugs identifiés dans la revue, marqués `test.fail()`.
   Ils RUNNENT et sont attendus en échec. C'est documentation exécutable.
   Quand Phase 1 lande, ces tests doivent flipper vert → on retire les
   `.fail` du code. Si un test `.fail` se met à passer, Playwright fait
   échouer la suite — c'est volontaire, ça force à nettoyer.

Workflow Phase 1 :

```
1. Faire le fix dans tools.html / tp.html
2. Lancer npm test → l'acceptance flippe vert et la suite échoue ("expected fail but passed")
3. Retirer le .fail correspondant
4. Re-lancer npm test → tout vert
5. PR mergeable
```

## CI

GitHub Action : `.github/workflows/test-playwright.yml`. Tourne sur chaque
push et PR sur `main`. Cache `node_modules` et le navigateur Chromium.

## Hors-scope

- Tests visuels (regression screenshots) → Phase 7
- Tests multi-navigateurs → décommenter `firefox`/`webkit` dans `playwright.config.js`
- Tests perf (Lighthouse) → pas dans ce projet
- Quiz / scene engines → pas dans Phase 0 (ils ne changent pas dans Phase 1-4)

## Limites connues

- `solveMultipleChoice()` lit l'attribut `data-is-correct` exposé dans le
  DOM par `tp-engine.js`. C'est ce que le moteur lui-même utilise pour
  vérifier — donc honnête. Mais ça veut dire qu'un utilisateur curieux
  peut tricher en inspectant le DOM. Considéré comme acceptable pour un
  outil pédagogique single-player local.
- Le Service Worker `sw.js` peut servir des assets cachés entre tests.
  `helpers.unregisterServiceWorker(page)` désinscrit en début de test
  quand nécessaire (uniquement sur `tp.html` qui charge `cas-in-pwa.js`).
