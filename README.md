# CAS-IN — Entraînement Forensique

> *« Parce que lire un dump hex à la main, c'est le seul moment où on peut encore prétendre qu'on fait de l'informatique sérieuse. »*

## De quoi s'agit-il ?

Un outil d'entraînement pour les étudiants du **CAS en Investigation Numérique** (et pour toute personne qui aime, d'une manière ou d'une autre, compter les octets un par un). Deux applications complémentaires, zéro dépendance, zéro serveur, zéro excuse de ne pas réviser.

### 📝 Le Quiz — `index.html`

Des centaines de questions à choix multiples sur le programme du CAS, servies dans un ordre aléatoire et avec les réponses mélangées à chaque affichage — parce que si tu te souviens que « c'est toujours la B », tu ne révises plus, tu fais du pattern matching.

- **Thèmes filtrables** — systèmes de fichiers, droit pénal suisse, cryptographie, réseau, OSINT, outils DFIR, et tout ce qui va avec.
- **Trois difficultés** — facile (1 pt), moyen (2 pts), difficile (3 pts) — pour ceux qui veulent souffrir proportionnellement.
- **Mode Examen** — 10, 20, 30 ou 50 questions, scorées à la fin, pour simuler la chaleur de la salle d'examen sans quitter son canapé.
- **Mode Favoris** et **Mode Erreurs** — parce qu'un apprentissage efficace consiste à revoir ce qu'on ne maîtrise pas, pas à réciter ce qu'on sait déjà.
- **Timer configurable** — off, 30 s, 60 s, 90 s, 2 minutes — pour simuler la pression temporelle, ou pas, selon l'humeur.
- **Bilan statistique** — précision par thème, par difficulté, évolution dans le temps, top des questions ratées. Un miroir assez honnête du niveau réel.
- **Milestones** — à 50, 100, 200 questions et 90 % de précision : confettis et félicitations. Parce qu'on mérite parfois un peu de dopamine.

### 🔬 Les Travaux Pratiques — `tp.html`

Vingt catégories d'exercices où le navigateur remplace le cahier d'exercices, avec des données régénérées à chaque passage :

- **Systèmes de fichiers** — FAT12/16/32, exFAT, NTFS, EXT3/4, HFS+. Boot sectors, MFT, Run Lists, bitmaps d'allocation, timestamps MS-DOS, timestomping, effacement, LFN.
- **Calculs & identification** — Endianness, tables hex, offsets, bases & encodages, magic bytes, hashes, mismatch d'extension.
- **Investigation** — Email forensics (SPF/DKIM/DMARC), analyse PCAP, incident response, droit pénal suisse, glossaire bilingue FR/EN.
- **Série Examen** — Questions inspirées des vrais examens CAS-IN, avec indices progressifs quand on pleure.

Chaque exercice est **régénéré aléatoirement** à chaque passage — on peut s'acharner sans retomber sur les mêmes octets, et si on réussit c'est probablement qu'on a compris, pas qu'on a retenu la réponse.

## Accès

### En ligne

L'app est servie par GitHub Pages — aucun compte, aucune installation, aucune excuse :

- **Quiz** : [https://zufferdi.github.io/CAS-IN/](https://zufferdi.github.io/CAS-IN/)
- **TPs** : [https://zufferdi.github.io/CAS-IN/tp.html](https://zufferdi.github.io/CAS-IN/tp.html)

Sur mobile, « Ajouter à l'écran d'accueil » et voilà, c'est installé. Ça ressemble à une vraie app, ça se comporte comme une vraie app, et ça ne demande la permission à personne.

### En local

```bash
git clone https://github.com/Zufferdi/CAS-IN.git
cd CAS-IN
```

Puis ouvrir `index.html` (quiz) ou `tp.html` (TPs) dans un navigateur. Aucun build, aucune dépendance, aucun `npm install` qui télécharge la moitié d'Internet. Trois fichiers, un navigateur, c'est tout.

## Pourquoi c'est gamifié

Parce que personne n'a envie de calculer le LCN de la `$MFT` un vendredi soir sans une petite récompense. Le système garde en mémoire (via `localStorage`) :

- Le **compteur par catégorie** avec médailles 🥉 (10), 🥈 (25), 🥇 (50).
- La **série en cours** 🔥 — remise à zéro à chaque mauvaise réponse, comme dans la vraie vie.
- Le **meilleur score** ⭐ — qui reste, comme les regrets.
- Un **total global** cross-catégories pour mesurer l'ampleur du problème.

Côté quiz, les mêmes principes s'appliquent : séries, précision par thème, courbe d'évolution, top des questions ratées. De quoi transformer la révision en poursuite d'indicateurs — ce qui, en forensique, est une préparation philosophique adéquate.

Les indices `💡` sont disponibles partout mais **annulent le comptage** pour l'exercice en cours. Un toast discret te le rappelle au cas où tu oublierais.

## Structure du projet

```
CAS-IN/
├── index.html          # Quiz (QCM, modes, examen, bilans)
├── questions.js        # Base de questions du quiz
├── tp.html             # Travaux pratiques interactifs
├── tp/
│   ├── tp-data.js      # Générateurs d'exercices
│   └── tp-engine.js    # Moteur de rendu et de scoring
├── .github/workflows/  # Automatisations CI/CD
├── LICENSE
└── README.md
```

Stack technique : **HTML + CSS + JavaScript vanilla**. Pas de React, pas de Vue, pas de Svelte, pas de framework qui deviendra obsolète avant ta prochaine session d'examen. Juste du code qui marchera encore quand les frameworks auront changé trois fois.

Persistance : `localStorage`. Tout reste sur ton appareil — pas de télémétrie, pas de cloud, pas de cookie marketing, pas d'email de relance. Si tu veux synchroniser entre appareils, tu exportes le JSON à la main (ou tu ouvres une issue pour qu'on ajoute un bouton).

## Avertissement pédagogique

**Tous les scénarios, dumps hex, en-têtes email, cas juridiques et incidents présentés dans cet outil sont à visée strictement pédagogique.**

Certains éléments sont :

- **Purement fictifs** — noms de fichiers, adresses IP, domaines, hashes, contenus de dumps.
- **Inspirés de situations réelles** rencontrées en formation, en enquête ou documentées publiquement (breach reports, jurisprudence, CTF, etc.) — mais **anonymisés et généralisés** pour ne cibler aucune personne, entreprise ou affaire identifiable.
- **Tirés de la vie étudiante** — un peu de `rapport_final_vraiment_final_v3.pdf` par-ci, un `vacances été 2023.jpg` par-là. Toute ressemblance avec votre propre dossier `Bureau` est purement statistique.

Les références au **Code pénal suisse** (Art. 143, 143bis, 144bis, 147, 156, 179quater, 197, 261bis, etc.) et à la **LPD révisée** sont exactes au moment de la rédaction, mais cet outil **ne remplace pas** une consultation juridique. Pour les vrais cas, on appelle un avocat, pas un navigateur.

Les **techniques forensiques** décrites (carving, décodage de Run Lists, détection de timestomping, analyse SPF/DKIM, etc.) sont enseignées à titre défensif et éducatif. Utilisez-les sur vos propres données, sur des images de test, ou sur des systèmes pour lesquels vous avez une autorisation explicite. Sinon, relisez la section ci-dessus sur les Art. 143bis et suivants.

## Contribuer / signaler un bug

Si un exercice contient une erreur factuelle, un octet qui ne colle pas, une subtilité de droit mal retranscrite, ou si l'endianness d'un exemple HFS+ te paraît suspecte — dis-le. Le forensique c'est précisément l'art de ne pas laisser passer ces choses-là.

- Ouvrir une **[Issue](https://github.com/Zufferdi/CAS-IN/issues)** pour signaler un problème, proposer une question, ou suggérer un thème manquant.
- Les **Pull Requests** sont bienvenues — mais avant de refactorer toute la base en TypeScript, pense à la philosophie *trois fichiers, zéro dépendance*.
- Pour les questions de contenu (pas d'interface), la syntaxe de `questions.js` est auto-explicative. Si elle ne l'est pas, c'est un bug — voir point 1.

## Licence

À définir. Les options envisagées, par ordre décroissant de permissivité :

- **MIT** — fais-en ce que tu veux, mentionne juste l'origine.
- **CC-BY-SA** — réutilise librement à condition de partager aux mêmes conditions.
- **CC-BY-NC** — pas d'usage commercial (pour éviter qu'un organisme de formation revende tes questions).

En attendant la décision, considère que c'est du **« tous droits réservés par défaut, mais demande gentiment »**.

## Crédits

Développé dans le cadre du **CAS en Investigation Numérique** — HES-SO / Université — millésime 2025–26.

Merci aux intervenants du CAS pour la matière, aux camarades de promotion pour les questions qu'on n'avait pas vues venir, et à tous les auteurs de documentation forensique publique dont les travaux rendent ce genre d'outil possible.

---

*« Celui qui compte ses clusters en hexadécimal ne perd jamais son temps. Il le perd juste dans une base différente. »*
