# CAS-IN — Investigation Numérique Forensique

> *« Parce que lire un dump hex à la main, c'est le seul moment où on peut encore prétendre qu'on fait de l'informatique sérieuse. »*

## De quoi s'agit-il ?

Un outil d'entraînement pour les étudiants du **CAS en Investigation Numérique** (et pour toute personne qui aime, d'une manière ou d'une autre, compter les octets un par un). Quatre piles indépendantes mais reliées :

| Section | Contenu |
|---|---|
| 💊 **Pilule bleue** — Fiches | 90 fiches de révision structurées par catégorie (FS, Windows, crypto, réseau, droit, plateformes, acquisition) |
| 💊 **Pilule verte** — TP | 25 catégories d'exercices : FAT, NTFS, exFAT, EXT, HFS+, endianness, magic bytes, hashes, droit pénal, email, réseau, IR, etc. |
| 💊 **Pilule orange** — Scènes | 64 scénarios DFIR immersifs avec choix multiples, conséquences procédurales, références légales (Art. 141 CPP, ACPO, NIST) |
| 💊 **Pilule rouge** — Quiz | 1630 questions gamifiées (XP, rangs, streaks, défi quotidien, mode survie, SM2 spaced repetition) |

Chaque exercice TP est **régénéré aléatoirement** à chaque passage — ce qui veut dire qu'on peut s'acharner sans retomber sur les mêmes octets, et que si on réussit c'est probablement qu'on a compris, pas qu'on a retenu la réponse.

## Architecture

```
CAS-IN/
├── index.html              # Landing (Matrix rain, drawer profil, raccourcis B/V/O/R)
├── quiz.html               # 1630 questions gamifiées
├── tp.html                 # 25 catégories TP avec sidebar
├── scene.html              # 64 scénarios DFIR
├── tools.html              # Outils & cheatsheets
├── exam.html               # Mode examen blanc
├── offline.html            # Page fallback hors-ligne (PWA)
│
├── manifest.json           # Source de vérité : 90 fiches × 7 catégories
├── counts.json             # Auto-généré : nombres affichés partout
├── questions.json          # 1630 questions (1750 avant nettoyage P0)
├── scenes.js               # 64 scénarios DFIR (~1.6 MB, network-first)
│
├── style/
│   ├── landing.css         # Style landing
│   ├── style.css           # Style commun (quiz)
│   ├── tp.css              # Style TP
│   ├── scene.css           # Style scène
│   └── fiche_style.css     # Style fiches
│
├── js/
│   ├── landing.js          # Pluie Matrix, progression, navigation
│   ├── cas-in-counts.js    # Patche les <span data-count="..."> au runtime
│   ├── cas-in-pwa.js       # Enregistre le SW + détection update
│   └── cas-in-search.js    # Recherche globale Ctrl+K (fiches + questions + TP + scènes)
│
├── tp/
│   ├── tp-data.js
│   └── tp-engine.js        # Générateurs d'exercices aléatoires
│
├── fiches/                 # 90 fiches HTML
├── scripts/                # Outils Python (CI)
│   ├── check_questions.py  # QC questions.json (utilisé en GitHub Actions)
│   ├── generate_counts.py  # Régénère counts.json
│   └── build_index.py
│
└── sw.js                   # Service Worker (cache-first statiques, network-first HTML/JSON)
```

## PWA

- **Service Worker v21** : Network-First pour HTML/JSON, Cache-First pour CSS/JS, fallback `offline.html`.
- **Installable** sur iOS, Android, desktop. Bannière d'install proposée après 3 s.
- **Fonctionne 100 % offline** une fois la première visite faite.

## Gamification

- **XP & rangs** : 🔰 Stagiaire → 🕵 Enquêteur → 🔬 Analyste → 💼 Expert → ⚖️ Légiste → 🏛 Inspecteur Principal
- **Streak quotidien** 🔥 avec **Streak Freeze** 🧊 pour pardonner 1 jour
- **Combo multiplier** ⚡ sur réponses consécutives correctes
- **Défi du jour** ⚡ : 5 questions tirées au hasard, score sauvegardé
- **Modes spéciaux** : Examen blanc · Survie (3 vies) · Mission 30Q · Spaced Repetition (SM2)
- **Achievements** débloqués selon performance
- **Radar de performance par module** dans le drawer profil

Tous les scores sont stockés en `localStorage` côté client. **Aucune télémétrie.**

## Raccourcis clavier

Sur la landing :
- `B` → Fiches (pilule bleue)
- `V` → TP (pilule verte)
- `O` → Scènes (pilule orange)
- `R` → Quiz (pilule rouge)

Partout :
- `Ctrl/⌘+K` → Recherche globale (fiches + questions + TP + scènes)
- `Esc` → Fermer modale/drawer
- `?` (dans le quiz) → Liste des raccourcis

## Avertissement pédagogique

**Tous les scénarios, dumps hex, en-têtes email, cas juridiques et incidents présentés dans cet outil sont à visée strictement pédagogique.**

Certains éléments sont :

- **Purement fictifs** — noms de fichiers, adresses IP, domaines, hashes, contenus de dumps.
- **Inspirés de situations réelles** rencontrées en formation, en enquête ou documentées publiquement (breach reports, jurisprudence, CTF, etc.) — mais **anonymisés et généralisés** pour ne cibler aucune personne, entreprise ou affaire identifiable.
- **Tirés de la vie étudiante** — un peu de `rapport_final_vraiment_final_v3.pdf` par-ci, un `vacances été 2023.jpg` par-là. Toute ressemblance avec votre propre dossier `Bureau` est purement statistique.

Les références au **Code pénal suisse** (Art. 143, 143bis, 144bis, 147, 156, 179quater, 197, 261bis, etc.) et à la **LPD révisée** sont exactes au moment de la rédaction, mais cet outil **ne remplace pas** une consultation juridique.

## Utilisation

Aucun build, zéro dépendance npm. Cloner et servir :

```bash
git clone <repo>
cd CAS-IN
python3 -m http.server 8000   # ou tout autre serveur statique
```

Pour la CI :

```bash
python3 scripts/check_questions.py questions.json   # QC bloquant
python3 scripts/generate_counts.py                  # Régénère counts.json
```

## Contribuer / signaler un bug

Si un exercice contient une erreur factuelle, un octet qui ne colle pas, une subtilité de droit mal retranscrite, ou si l'endianness d'un exemple HFS+ te paraît suspecte — dis-le. Le forensique c'est précisément l'art de ne pas laisser passer ces choses-là.

---

*« Celui qui compte ses clusters en hexadécimal ne perd jamais son temps. Il le perd juste dans une base différente. »*
