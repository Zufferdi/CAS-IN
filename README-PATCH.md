# Patch CAS-IN v2.62 → v2.63

## À écraser dans le projet existant

Décompresse ce zip à la racine de `CAS-IN/` — les chemins reproduisent l'arborescence,
les fichiers existants seront remplacés.

```
js/profile/profile-page.js     ← porté paintUtcClock() + tick UTC aligné minute
js/profile/celebration-ui.js   ← porté listener `dossier-activated`
sw.js                          ← CACHE_VERSION v142 → v143
docs/CHANGELOG.md              ← entrée v2.63 ajoutée en haut
data/counts.json               ← régénéré, version 2.63
index.html                     ← patch auto data-count fallback (par generate_counts.py)
```

## À supprimer manuellement

Ces deux fichiers étaient des orphelins (chargés nulle part) qui contenaient
les VRAIS fixes v2.60. Le contenu utile a été porté vers `js/profile/`,
les coquilles vides peuvent partir :

```bash
git rm js/pages/profile-page.js
git rm js/pages/celebration-ui.js
```

## Vérification post-application

```bash
# Tests Node (51 OK attendus)
node tests/test-cas-in.js *.html
node tests/test-achievements-sync.js

# QC questions
python3 scripts/check_questions.py data/questions.json
```

## Commit suggéré

```
chore(v2.63): supprime doublons morts js/pages/, porte fixes v2.60

- js/pages/profile-page.js et js/pages/celebration-ui.js étaient orphelins
  (jamais référencés par HTML ni STATIC_ASSETS du SW) mais contenaient les
  fixes annoncés dans le CHANGELOG v2.60 :
  * horloge UTC du status bar profil qui tick en live
  * cérémonie « Dossier activé · Approuvé par R.R aka Banzaï » à la 1re XP
- Fixes portés dans js/profile/profile-page.js et js/profile/celebration-ui.js
- Bump CACHE_VERSION v142 → v143
```
