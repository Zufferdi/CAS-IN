# CAS-IN — Travaux Pratiques Forensiques

> *« Parce que lire un dump hex à la main, c'est le seul moment où on peut encore prétendre qu'on fait de l'informatique sérieuse. »*

## De quoi s'agit-il ?

Un outil d'entraînement pour les étudiants du **CAS en Investigation Numérique** (et pour toute personne qui aime, d'une manière ou d'une autre, compter les octets un par un). Vingt catégories d'exercices couvrant :

- **Systèmes de fichiers** — FAT12/16/32, exFAT, NTFS, EXT3/4, HFS+. Boot sectors, MFT, Run Lists, bitmaps d'allocation, timestamps MS-DOS, timestomping, effacement, LFN.
- **Calculs & identification** — Endianness, tables hex, offsets, bases & encodages, magic bytes, hashes, mismatch d'extension.
- **Investigation** — Email forensics (SPF/DKIM/DMARC), analyse PCAP, incident response, droit pénal suisse, glossaire bilingue FR/EN.
- **Série Examen** — Questions inspirées des vrais examens CAS-IN, avec indices progressifs quand on pleure.

Chaque exercice est **régénéré aléatoirement** à chaque passage — ce qui veut dire qu'on peut s'acharner sans retomber sur les mêmes octets, et que si on réussit c'est probablement qu'on a compris, pas qu'on a retenu la réponse.

## Pourquoi c'est gamifié

Parce que personne n'a envie de calculer le LCN de la \$MFT un vendredi soir sans une petite récompense. Le système garde en mémoire (via `localStorage`) :

- Le **compteur par catégorie** avec médailles 🥉 (10), 🥈 (25), 🥇 (50).
- La **série en cours** 🔥 — remise à zéro à chaque mauvaise réponse, comme dans la vraie vie.
- Le **meilleur score** ⭐ — qui reste, comme les regrets.
- Un **total global** cross-catégories pour mesurer l'ampleur du problème.

Les indices `💡` sont disponibles partout mais **annulent le comptage** pour l'exercice en cours. Un toast discret te le rappelle au cas où tu oublierais.

## Avertissement pédagogique

**Tous les scénarios, dumps hex, en-têtes email, cas juridiques et incidents présentés dans cet outil sont à visée strictement pédagogique.**

Certains éléments sont :

- **Purement fictifs** — noms de fichiers, adresses IP, domaines, hashes, contenus de dumps.
- **Inspirés de situations réelles** rencontrées en formation, en enquête ou documentées publiquement (breach reports, jurisprudence, CTF, etc.) — mais **anonymisés et généralisés** pour ne cibler aucune personne, entreprise ou affaire identifiable.
- **Tirés de la vie étudiante** — un peu de `rapport_final_vraiment_final_v3.pdf` par-ci, un `vacances été 2023.jpg` par-là. Toute ressemblance avec votre propre dossier `Bureau` est purement statistique.

Les références au **Code pénal suisse** (Art. 143, 143bis, 144bis, 147, 156, 179quater, 197, 261bis, etc.) et à la **LPD révisée** sont exactes au moment de la rédaction, mais cet outil **ne remplace pas** une consultation juridique. Pour les vrais cas, on appelle un avocat, pas un navigateur.

Les **techniques forensiques** décrites (carving, décodage de Run Lists, détection de timestomping, analyse SPF/DKIM, etc.) sont enseignées à titre défensif et éducatif. Utilisez-les sur vos propres données, sur des images de test, ou sur des systèmes pour lesquels vous avez une autorisation explicite. Sinon, relisez la section ci-dessus sur les Art. 143bis et suivants.

## Utilisation

Trois fichiers, zéro dépendance, zéro build :

```
tp.html
tp/tp-data.js
tp/tp-engine.js
```

Ouvre `tp.html` dans un navigateur et on est parti. Les scores sont stockés localement, rien ne quitte ton ordinateur — pas de télémétrie, pas de cloud, pas de cookies marketing. Juste toi, ton cerveau, et des octets.

## Contribuer / signaler un bug

Si un exercice contient une erreur factuelle, un octet qui ne colle pas, une subtilité de droit mal retranscrite, ou si l'endianness d'un exemple HFS+ te paraît suspecte — dis-le. Le forensique c'est précisément l'art de ne pas laisser passer ces choses-là.

---

*« Celui qui compte ses clusters en hexadécimal ne perd jamais son temps. Il le perd juste dans une base différente. »*
