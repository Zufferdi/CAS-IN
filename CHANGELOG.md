# Changelog

Toutes les modifications notables apportées à ce projet sont documentées ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [2.3] — 2026-04-23

### Étape 1 — Socle qualité

#### Ajouté
- `.gitignore` pour ignorer les fichiers OS, éditeurs et fichiers temporaires
- `.editorconfig` pour la cohérence d'édition entre éditeurs
- `README.md` documentant l'architecture, les technos et les raccourcis clavier
- `CHANGELOG.md` (ce fichier) pour tracer les versions
- `scripts/generate_counts.py` qui génère `counts.json` depuis le `manifest.json` et `questions.json`
- `counts.json` — source unique des nombres affichés (1439 questions, 54 fiches, 18 scènes, 20 TP)
- `.github/workflows/generate-counts.yml` qui régénère `counts.json` à chaque changement de questions/manifest

### Étape 2 — Externalisation (à venir)
### Étape 3 — Modules JS partagés (à venir)
### Étape 4 — UI enrichie (à venir)

---

## [2.2] — 2026-04-22

### Ajouté
- Landing page redesign avec pilules Matrix-style
- Manifest.json comme source de vérité pour les fiches
- Script `scripts/check_questions.py` pour le QC de `questions.json`
- Workflow GitHub Actions `.github/workflows/check-questions.yml`

### Modifié
- Structure du repo réorganisée (fiches/, tp/, style/, scripts/)
- Service Worker v15 avec stratégie Network-First (HTML) + Cache-First (statiques)

---

## [2.0 – 2.1] — 2026

### Fondations
- Architecture modulaire (quiz, fiches, TP, scènes)
- Progressive Web App avec Service Worker
- 54 fiches de révision avec hub de recherche
- 1439 questions gamifiées (XP, rangs, streak, défi quotidien)
- 20 exercices de TP (hex, endianness, offsets, etc.)
- 18 scénarios DFIR immersifs
