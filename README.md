# CAS-IN — Investigation Numérique Forensique

> *« Lire un dump hex à la main, c'est encore le seul moment où on peut prétendre faire de l'informatique sérieuse. »*

Outil d'entraînement pour les étudiants du **CAS en Investigation Numérique**, et plus généralement pour quiconque trouve normal de compter ses clusters en hexadécimal.

Quatre piles, indépendantes mais reliées :

| Pilule | Section | Contenu |
|---|---|---|
| 💊 **Bleue** | Fiches | 109 fiches structurées par catégorie — FS, Windows, crypto, réseau, droit suisse, plateformes, acquisition. |
| 💊 **Verte** | TP | 32 catégories d'exercices — FAT, NTFS, exFAT, EXT, HFS+, endianness, magic bytes, hashes, droit pénal, email, réseau, IR, Registry, Prefetch, LNK… Chaque exercice est **régénéré à chaque passage**. Si on réussit, c'est qu'on a compris, pas qu'on a retenu. |
| 💊 **Orange** | Scènes | 136 scénarios DFIR immersifs avec choix multiples, conséquences procédurales, références légales (Art. 141 CPP, ACPO, NIST, LPD révisée). |
| 💊 **Rouge** | Quiz | 2 000 questions gamifiées — XP, rangs, streaks, défi quotidien, mode survie, SM2 spaced repetition. |

---

## Démarrage

Aucun build, zéro dépendance npm. Cloner et servir :

```bash
git clone <repo>
cd CAS-IN
python3 -m http.server 8000   # ou tout autre serveur statique
```

Pour la CI :

```bash
# Régénère counts.json + patche les fallbacks data-count dans le HTML +
# lit la version depuis docs/CHANGELOG.md
python3 scripts/generate_counts.py

# QC questions.json (CI bloquante)
python3 scripts/check_questions.py data/questions.json

# Tests Node (syntaxe + structure)
node tests/test-cas-in.js
```

---

## Architecture

Vue d'ensemble. Pour le détail (ordre de chargement, mapping `localStorage`, dette technique restante), voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

```
CAS-IN/
├── index.html              # Landing — Matrix rain · drawer profil · raccourcis B/V/O/R
├── quiz.html               # 2 000 questions gamifiées
├── tp.html                 # 32 catégories TP avec sidebar
├── scene.html              # 136 scénarios DFIR
├── tools.html              # Calculateurs forensiques (timestamps, MFT, run lists…)
├── exam.html               # Mode examen blanc
├── profile.html            # Dossier enquêteur — rang · XP · ladder · badges · export
├── glossary.html           # Glossaire forensique
├── npcs.html               # Personnages des scènes
├── offline.html            # Page fallback PWA
├── references/             # Cluster Références : MITRE · CVE · Event IDs · Legal · DFIR Tools
│
├── docs/
│   ├── ARCHITECTURE.md     # Couches & ordre de chargement
│   └── CHANGELOG.md        # Keep-a-Changelog (source de vérité version)
│
├── data/                   # Index lazy-loadés
│   ├── counts.json         # Auto-généré : nombres + version, source unique
│   ├── manifest.json       # 109 fiches × 7 catégories
│   ├── questions.json      # 2 000 questions (~2.7 MB monolithique)
│   ├── npcs.json           # PNJ (rôle, trust, métadonnées)
│   ├── search-index.json   # Index plein texte (Cmd+K)
│   ├── ics-questions.json  # Questions ICS/SCADA
│   ├── npc-arcs.json       # Arcs narratifs des PNJ
│   ├── cross-links.json    # Maillage fiche ↔ fiche / TP / scène
│   ├── fiche-graph.json    # Graphe de prérequis
│   └── scenes-chronology.json
│
├── scenes/                 # 136 scènes, lazy-load v3.0
│   ├── index.json          # Méta-index ~230 KB chargé au boot
│   └── *.json              # Une scène complète par fichier
│
├── fiches/                 # 109 fiches HTML statiques
│   └── index.html          # Hub de navigation des fiches
│
├── pwa.manifest.json       # Manifest PWA (W3C)
├── sw.js                   # Service Worker — voir CACHE_VERSION en tête
│
├── style/                  # CSS — un fichier par grande zone
│   ├── style.css           # Tokens (couleurs, fonts, --navbar-h, échelle z-index) + base
│   ├── cas-in-navbar.css   # Navbar globale unifiée (v2.77)
│   ├── landing.css         # index.html
│   ├── quiz.css            # quiz.html
│   ├── scene.css           # scene.html
│   ├── tp.css              # Moteur TP (zones d'exercices)
│   ├── tp-page.css         # Chrome de tp.html
│   ├── tools.css           # tools.html
│   ├── exam.css            # exam.html
│   ├── profile.css         # profile.html (+ profile-dossier.css, profile-dossier-plus.css)
│   ├── fiche_style.css     # Toutes les fiches
│   ├── fiche-notes.css     # Système de notes utilisateur
│   ├── glossary.css · npcs.css · refs.css · gamification-toasts.css · artifacts.css
│
├── js/                     # 4 couches strictes — voir docs/ARCHITECTURE.md
│   ├── core/               # Source de vérité (Profile, Achievements, Quests, Mastery,
│   │                       #   Counts, Search, PWA, Theme, Utils, NpcState, Arcs, Navbar)
│   ├── profile/            # UI du profil + drawer + onglets
│   ├── bridges/            # Compat legacy (uniquement tp-profile-bridge en v2.85+)
│   ├── components/         # Briques UI réutilisables (search, fiches, swiss-flags…)
│   └── pages/              # Apps spécifiques par page (quiz-app, scene-app, tools-app…)
│
├── tp/
│   ├── tp-data.js
│   └── tp-engine.js        # Générateurs aléatoires d'exercices
│
├── scripts/                # Outils Python (CI)
│   ├── check_questions.py    # QC questions.json (bloquante)
│   ├── generate_counts.py    # counts.json + patche les fallbacks HTML
│   ├── build_index.py        # Index plein texte
│   ├── build_glossary.py     # Glossaire auto
│   ├── build_cross_links.py  # Maillage entre fiches/TP/scènes
│   ├── build_fiche_graph.py  # Graphe de prérequis
│   ├── build_npc_metadata.py # Méta PNJ
│   └── git-hooks/pre-commit
│
└── tests/
    └── test-cas-in.js      # Tests Node (syntaxe + structure)
```

---

## Une seule source de vérité pour les chiffres

Tout ce qui est compté est dans **`data/counts.json`**, généré par `scripts/generate_counts.py` :

| Clé | Source de vérité |
|---|---|
| `version` | 1er `## [X.Y]` non-Unreleased de `docs/CHANGELOG.md` |
| `questions` | `len(data/questions.json)` |
| `fiches` | `len(data/manifest.json.fiches)` |
| `scenes` | `len(scenes/index.json)` |
| `tp_categories` / `tp_exercises` | `data-cat` distincts dans `tp.html` |

Au runtime, `cas-in-counts.js` patche tous les `[data-count="KEY"]` du DOM. À la build, le script Python patche **aussi** les fallbacks dans le HTML — SEO, réseaux sociaux et lecteurs sans JS voient les bons chiffres.

Pour ajouter un compteur partagé (par exemple "ratio de questions difficiles") :
1. L'ajouter à `generate_counts.py` (fonction de comptage + entrée dans le dict).
2. Utiliser `<span data-count="ratio_hard">42</span>` dans le HTML.

---

## PWA

- **Service Worker** (voir `CACHE_VERSION` en tête de `sw.js`) : Network-First pour HTML/JSON, Cache-First pour CSS/JS, fallback `offline.html`.
- **Installable** sur iOS, Android, desktop. Bannière proposée après 3 s.
- **100 % offline** une fois la première visite faite.

À chaque ajout d'un fichier JS/CSS au repo : l'ajouter à `STATIC_ASSETS` dans `sw.js` **et** bumper `CACHE_VERSION`. Sinon les utilisateurs offline ne récupèrent pas le nouveau fichier.

---

## Gamification

- **XP & rangs** : 🔰 Stagiaire → 🕵 Enquêteur → 🔬 Analyste → 💼 Expert → ⚖️ Légiste → 🏛 Inspecteur Principal
- **Streak quotidien** 🔥 avec **Streak Freeze** 🧊 pour pardonner 1 jour
- **Combo multiplier** ⚡ sur réponses consécutives correctes
- **Défi du jour** ⚡ : 5 questions tirées au hasard, score sauvegardé
- **Modes spéciaux** : Examen blanc · Survie (3 vies) · Mission 30Q · Spaced Repetition (SM2)
- **Achievements** débloqués selon performance
- **Radar de performance par module** dans le drawer profil

Tous les scores sont en `localStorage` côté client. **Aucune télémétrie.**

---

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

Onglets ARIA (`profile.html`, `tools.html`) :
- `←/→/↑/↓` → onglet précédent/suivant
- `Home/End` → premier/dernier onglet

---

## Tokens CSS partagés

Les valeurs structurelles vivent dans `style/style.css` au `:root` et doivent être réutilisées via `var()` plutôt que dupliquées :

| Variable | Rôle |
|---|---|
| `--navbar-h` | Hauteur de la navbar globale (76 px desktop, 66 px mobile via media query). À utiliser pour tout `top:` d'élément sticky qui suit la navbar. |
| `--z-content`, `--z-sticky`, `--z-dropdown`, `--z-modal-backdrop`, `--z-modal`, `--z-toast`, `--z-overlay-critical` | Échelle de z-index unifiée (0 → 900). Utiliser `var(--z-toast)` plutôt que `9000`. Pour empiler dans une même couche : `calc(var(--z-toast) + 10)`. |
| `--bg`, `--surface`, `--surface2`, `--border` | Fonds. |
| `--text`, `--dim` | Texte primaire / secondaire. `--dim` est calibré AA (5.4:1) sur petites tailles. |
| `--cyan`, `--gold`, `--red`, `--green`, `--purple` | Accents (variantes thème clair adaptées au contraste). |
| `--font-display`, `--font-mono`, `--font-body` | Polices. |

Les thèmes (`[data-theme="dark"]`, `[data-theme="light"]`, `[data-theme="hacker"]`) overrident ces variables ; tout le reste suit automatiquement.

---

## Patches modulaires (lazy plugins scènes)

Le moteur de scène est étendu par des patches non-intrusifs, chacun désactivable en retirant sa balise `<script>` :

- **Lobby v3** (`scene-lobby-v3.js`) — 13 parcours pédagogiques, bouton "Continuer" pour reprendre, tri configurable, filtres atmosphère, badges de découverte.
- **Engine v4** (`scene-engine-v4.js`) — Briefing repensé (fiche d'identité + objectifs + pré-warning sensibles), récap exportable en Markdown, mode révision, glossaire de 127 articles de loi (couverture 92 % du corpus).
- **Profile v5** (`profile-track-v5.js`) — Sélecteur de rôle enrichi avec mini-timeline des 12 grades, mini-test d'orientation (4 questions), banner thématisé, célébration des promotions (toast + son + haptique).

Architecture en couches : `scene-app.js` (noyau, intouché) → `scene-ux-patch.js` → `scene-lobby-v3.js` → `scene-engine-v4.js` → `profile-track-v5.js`.

---

## Avertissement pédagogique

**Tous les scénarios, dumps hex, en-têtes email, cas juridiques et incidents présentés sont à visée strictement pédagogique.**

Certains éléments sont :

- **Purement fictifs** — noms de fichiers, adresses IP, domaines, hashes, contenus de dumps.
- **Inspirés de situations réelles** rencontrées en formation, en enquête ou documentées publiquement (breach reports, jurisprudence, CTF, etc.) — mais **anonymisés et généralisés** pour ne cibler aucune personne, entreprise ou affaire identifiable.
- **Tirés de la vie étudiante** — un peu de `rapport_final_vraiment_final_v3.pdf` par-ci, un `vacances été 2023.jpg` par-là. Toute ressemblance avec votre propre dossier `Bureau` est statistique.

Les références au **Code pénal suisse** (Art. 143, 143bis, 144bis, 147, 156, 179quater, 197, 261bis, etc.) et à la **LPD révisée** sont exactes au moment de la rédaction, mais cet outil **ne remplace pas** une consultation juridique.

---

## Contribuer / signaler un bug

Si un exercice contient une erreur factuelle, un octet qui ne colle pas, une subtilité de droit mal retranscrite, ou si l'endianness d'un exemple HFS+ paraît suspecte — dis-le. Le forensique, c'est précisément l'art de ne pas laisser passer ces choses-là.

---

*« Celui qui compte ses clusters en hexadécimal ne perd jamais son temps. Il le perd juste dans une base différente. »*
