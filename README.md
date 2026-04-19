# 🔍 CAS-IN — Investigation Numérique

Application web de révision pour le **Certificate of Advanced Studies en Investigation Numérique (CAS-IN)**. Déployée automatiquement via GitHub Pages à chaque push sur `main`.

🌐 **Accès direct :** [https://zufferdi.github.io/CAS-IN/](https://zufferdi.github.io/CAS-IN/)

---

## 🆕 Nouveautés v2.0

- **Page d'accueil Matrix** — choix entre révision (💊 pilule bleue) et quiz (💊 pilule rouge)
- **14 fiches de révision** thématiques avec citations, anecdotes forensiques et références bibliographiques
- **Gamification complète** — Boss Battles, Scènes de crime, Mission 30 questions, Rapport d'expertise PDF
- **1439 questions** · 36 chapitres · 10 thèmes (vs ~1200 en v1)
- Architecture restructurée : `index.html` (accueil) + `quiz.html` + `fiches/`

---

## 🗂 Structure du projet

```
CAS-IN/
├── index.html              # Page d'accueil Matrix (pilule bleue / rouge)
├── quiz.html               # Quiz interactif complet
├── style.css               # Styles du quiz
├── sw.js                   # Service Worker (cache offline)
├── manifest.json           # PWA manifest
├── questions.json          # 1439 questions (JSON)
└── fiches/
    ├── index.html          # Hub de navigation des fiches
    ├── fiche.css           # CSS partagé entre toutes les fiches
    ├── fat16.html          # FAT12 / FAT16 / FAT32
    ├── exfat.html          # exFAT
    ├── ntfs.html           # NTFS
    ├── disques.html        # Technologie des disques & Représentation
    ├── ext.html            # EXT2 / EXT3 / EXT4
    ├── hfs.html            # HFS+ et APFS
    ├── acquisition.html    # Acquisition · Formats · MAC times · Méthodologie
    ├── windows.html        # Windows — Registre · Artefacts · Event Logs
    ├── macos-linux.html    # macOS & Linux
    ├── crypto.html         # Cryptologie — AES · RSA · PKI · Hashcat
    ├── droit.html          # Droit pénal suisse — CPP · Expertise · EIMP
    ├── reseau.html         # Réseau · IP · DNS · Infrastructure
    ├── osint.html          # OSINT · Dorks · EXIF · Métadonnées
    └── outils.html         # Outils forensiques — X-Ways · Zimmerman · Volatility
```

---

## 📚 Contenu des questions

**1439 questions** à choix multiples couvrant l'ensemble des modules du CAS-IN :

| Thème | Chapitres | Questions |
|---|---|---|
| **Système de fichiers** | FAT12/16/32, exFAT, NTFS, EXT2/3/4, HFS+, APFS, Disques | ~300 |
| **Acquisition et analyse** | Acquisition, Formats, MAC times, Outils, Méthodologie | ~190 |
| **Spécificité des OS** | Windows, macOS, Linux | ~190 |
| **Cryptologie** | AES, RSA, PKI, Hachage, Cassage | ~170 |
| **Droit** | CPP suisse, Perquisition, Expertise, EIMP | ~125 |
| **OSINT** | Fondamentaux, Outils, Google Dorks, EXIF | ~110 |
| **Informatique de base** | Représentation, Adressage IP, Réseaux | ~145 |

Trois niveaux de difficulté : **Facile** (1 pt) · **Moyen** (2 pts) · **Difficile** (3 pts).

---

## 🎮 Modes de jeu

| Mode | Description |
|---|---|
| **Normal** | Questions aléatoires selon tes filtres (thème, chapitre, difficulté) |
| **SM-2** | Répétition espacée — les questions difficiles reviennent plus souvent |
| **Survie** | 3 vies · une erreur = une vie perdue |
| **Focus** | Interface épurée, sans distractions |
| **Favoris** | Uniquement les questions marquées ⭐ |
| **Erreurs** | Réviser les questions ratées |
| **📝 Examen** | Séquence chronométrée configurable + rapport d'expertise PDF |
| **🔍 Scène** | 5 enquêtes narratives séquencées (Gabriel, Javier, Dimitri, Ludovic…) |
| **🎯 Mission** | 30 questions · 6 phases · de la perquisition au rapport · note /6 |

### Gamification

- **XP et rangs** — 20 niveaux de Stagiaire à Grand Maître DFIR (avec références : Elliot Alderson, Lisbeth Salander, Sherlock Holmes…)
- **Boss Battle** — après 20 bonnes réponses sur un chapitre, 5 questions hard chronométrées · victoire = badge + fiche débloquée
- **Fiches débloquables** — les fiches se déverrouillent au fil de la progression (🔒 → 🔓)
- **Carte des territoires** — 7 zones thématiques colorées selon la maîtrise
- **Rapport d'expertise PDF** — à la fin d'un examen, génère un faux rapport judiciaire avec les erreurs formulées comme des fautes d'expert forensique contestables en audience
- **Achievements, streak quotidien, combo multiplier, God Mode**

---

## 📄 Fiches de révision

Chaque fiche couvre un thème en mode **cheatsheet** : structure on-disk, offsets hex essentiels, tableaux de valeurs, étapes forensiques clés, citation d'expert et anecdote geek.

Accès : pilule bleue depuis l'accueil → hub des fiches → fiche individuelle → bouton 💊 pour lancer le quiz sur ce chapitre.

---

## 🚀 Déploiement local

Aucune installation requise. L'application fonctionne entièrement côté client (HTML + JS vanilla).

```bash
git clone https://github.com/Zufferdi/CAS-IN.git
cd CAS-IN
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

> Un serveur HTTP local est nécessaire pour que `questions.json` soit chargé correctement (restrictions CORS des navigateurs sur `file://`).

---

## ➕ Structure d'une question

Les questions sont stockées dans `questions.json`. Chaque question suit cette structure :

```json
{
  "theme": "Système de fichiers",
  "chapter": "NTFS",
  "diff": "hard",
  "type": "single",
  "q": "Quelle est la différence forensique entre $STANDARD_INFORMATION et $FILE_NAME ?",
  "options": [
    "$STANDARD_INFORMATION contient les vraies dates, $FILE_NAME est modifiable",
    "$FILE_NAME est modifiable par les programmes, $STANDARD_INFORMATION ne l'est pas",
    "$STANDARD_INFORMATION est modifiable par les programmes, $FILE_NAME uniquement par le noyau",
    "Les deux attributs sont identiques et redondants"
  ],
  "answers": [2],
  "expl_ok": "Exact — $SI est modifiable par tout programme (cible du timestomping), $FN uniquement par le noyau Windows.",
  "expl_ko": "$STANDARD_INFORMATION est l'attribut ciblé par le timestomping. $FILE_NAME ne peut être modifié que par le noyau — c'est pourquoi une divergence entre les deux révèle une manipulation.",
  "refs": ["Harlan Carvey, Windows Forensic Analysis Toolkit, Syngress, 2014", "SANS FOR500"]
}
```

### Champs

| Champ | Valeurs | Description |
|---|---|---|
| `theme` | voir tableau thèmes | Catégorie principale |
| `chapter` | 36 chapitres | Sous-catégorie |
| `diff` | `easy` `medium` `hard` | Difficulté |
| `type` | `single` `multi` | Réponse unique ou multiple |
| `q` | texte | Énoncé |
| `options` | tableau 3–5 chaînes | Options de réponse |
| `answers` | tableau d'indices | Indices des bonnes réponses dans `options` |
| `expl_ok` | texte | Explication si bonne réponse |
| `expl_ko` | texte | Explication si mauvaise réponse |
| `refs` | tableau de chaînes | Références bibliographiques (optionnel) |

---

## 🔧 Après un déploiement

Le Service Worker met les fichiers en cache. Après chaque push, vider le cache dans le navigateur :

```
F12 → Application → Service Workers → Unregister → F5
```

---

## 📄 Licence

Usage pédagogique interne — CAS-IN, HE-Arc.
