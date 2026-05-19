# CAS-IN

**Outil pédagogique de simulation DFIR & procédure pénale suisse.**

Tu prends une scène, tu te retrouves dans la peau d'un·e procureur·e, RSSI, juge des mineurs, doctorant·e ou grand-mère arnaquée au cousin russe. Tu dois prendre 3 à 6 décisions sous contrainte. Chaque choix est noté, commenté, et raccroché à un article du CP/CPP ou à un ATF réel. À la fin, on t'explique ce qui était bien, ce qui passait, et ce qui aurait fait basculer tout le dossier en nullité (art. 141 al. 2 CPP, c'est notre best-seller).

C'est sérieux. Mais ne te trompe pas : c'est un projet qui contient **332 personnages non-joueurs nommés**, dont la moitié sont des procureures romandes, des médecins légistes du CURML et des inspecteurs cybercrime fictifs. Si tu cherches un Netflix interactif tranquille pour le dimanche soir, va voir ailleurs.

---

## Pour qui

- Étudiant·e·s en droit / informatique / cybersécurité qui en ont marre des manuels.
- Profils DFIR qui veulent réviser le CPP suisse sans s'endormir.
- Juristes qui découvrent que MITRE ATT&CK n'est pas un opérateur télécom.
- Personnes qui se sont déjà demandé quelle est la différence entre l'art. 143 et l'art. 143bis CP, et qui n'ont jamais osé demander.
- Préparation au CAS Investigation Numérique, à la formation continue des magistrats, ou à la prochaine soirée où on te demande « alors c'est quoi exactement la nLPD ».
- Toute personne curieuse de comprendre *concrètement* comment une enquête cyber se déroule en Suisse — depuis le premier appel jusqu'à l'audience d'arrondissement.

**Niveaux disponibles** : `stagiaire` (3 campagnes), `inspecteur` (7), `enqueteur` (7), `expert` (10). Si tu te lances direct sur la saga *L'Affaire Tom — Défi mortel TikTok* niveau Expert, c'est ton problème. Tu auras besoin de connaître le DPMin, le PPMin, l'art. 16 DSA et la jurisprudence Lanzarote sur les auditions d'enfants. Bon courage.

---

## Ce qu'il y a dedans (v3.0, état au 19 mai 2026)

| Élément | Quantité | Commentaire |
|---|---|---|
| **Scènes jouables** | **250** | Chacune = 3 à 6 décisions notées, débrief intégral |
| **Questions de quiz** | **2 202** | 8 thèmes, 3 niveaux de difficulté, mode quotidien |
| **Fiches techniques** | **120** | DFIR + droit suisse + outils + cloud + LLM forensique |
| **Personnages (NPCs)** | **332** | Chacun avec rôle, institution, expertise, bio, citation, relations |
| **Campagnes thématiques** | **27** | Organisées par niveau et thème |
| **Sagas narratives** | **14** | Multi-actes avec conséquences procédurales en cascade |
| **TP / exercices pratiques** | **31** | Carving, MFT parsing, magic bytes, NTFS internals, etc. |
| **Cantons suisses couverts** | **19** | Plus la Confédération et l'UE pour les volets transfrontaliers |
| **Pages de référence DFIR** | **7** | Artefacts, Event IDs, MITRE, Droit, Outils, Magic bytes, Biblio |
| **Bibliographie** | **71 ressources** | Livres, standards, rapports, blogs, podcasts — filtrable |
| **Service worker offline** | ✓ | Tout le contenu accessible hors-ligne après première visite (PWA) |

La date du jeu est calée sur le présent (mai 2026 au moment où tu lis cette ligne). Certaines sagas se projettent sur 12-24 mois dans le futur proche — *L'Affaire du Modèle* va jusqu'à une audience en septembre 2027, *L'Affaire Steve* jusqu'à une cérémonie commémorative en novembre 2028.

---

## Les 14 sagas narratives

Une saga = un fil rouge qui traverse plusieurs scènes liées (mêmes personnages, même affaire, progression chronologique). Tu peux les jouer en standalone, mais l'intérêt est de suivre la trajectoire.

| Saga | Cantons | Actes | Niveau | Thème |
|---|---|---|---|---|
| 🎓 **Initiation DFIR** | CH | 7 | stagiaire | Premiers gestes : custody, premier appel, clé USB trouvée, USB de mémé |
| 🏔 **L'Affaire de la Viège** | VS | 7 | inspecteur | SaaS compromis → SCADA Mattmark → audience à Brigue |
| 🇫🇷 **L'Affaire Sarine** | FR | 5 | inspecteur | EIMP avec Stuttgart, coordination cantons |
| 🏛️ **L'Affaire Aar-Frutigen** | BE | 5 | inspecteur | KantonNet, 47 communes, ex-développeur |
| 🧀 **L'Affaire de la Singine** | FR/BE | 5 | inspecteur | Akira, MROS, audience à Berne |
| ⌚ **L'Affaire du Noirmont** | JU | 7 | inspecteur | Cambriolage horloger, VPS Saint-Imier, audience Porrentruy |
| 🔬 **Le Calibre Volé — Affaire CSEM** | NE | 7 | inspecteur | Monero, ANPR Saignelégier, rogatoire Besançon |
| 🪲 **L'Affaire de la Prévôté** | BE → JU | 7 | expert | Rootkit eBPF + bascule Moutier (BE→JU) 1.1.2026 |
| 🧬 **L'Affaire du Modèle** | VD | 7 | expert | IA médicale CHUV/EPFL compromise, jurisprudence ML médicale |
| 🩹 **L'Affaire Steve Crett** | VS | 5 | expert | Sextortion mineur, suicide, opération cellule mineurs Sion |
| 🚂 **Le Tunnel Numérique du Gothard** | UR/TI | 5 | expert | Compromission SBB Cargo, ETCS, RBC, coordination DE/IT |
| 🌨 **Engadine 2027** | GR | 5 | expert | Espionnage géopolitique, WEF satellite, Tirich Mir |
| 🚁 **L'Affaire du Drone d'Aletsch** | VS | 5 | inspecteur | Drone illégal Konkordia, micro-SD, art. 90 LA |
| 🎰 **L'Affaire Casino di Lugano** | TI | 5 | enqueteur | Skimmer caissier interne, MROS, art. 305bis CP |
| 📱 **L'Affaire Tom — Défi mortel TikTok** | VD | 6 | expert | Blackout Challenge, DPMin, art. 16 DSA, audition Lanzarote |

Chaque saga est conçue pour que les choix d'un acte aient des conséquences procédurales aux actes suivants. Si tu rates la levée du secret médical à l'acte 3, tes preuves seront inexploitables à l'acte 7. C'est le but.

---

## Les 27 campagnes (mode dossier)

En plus des sagas (narratives, fil rouge), CAS-IN organise les scènes en **27 campagnes thématiques** consultables depuis l'écran « Dossiers » de la page Scènes. Quelques exemples :

- 🌱 **Les Fondamentaux** (3 scènes, stagiaire) — 7 réflexes qui te sauvent : custody, phishing, métadonnées, premier ransomware
- 💀 **Ransomwares réels** (inspecteur) — LockBit, Akira, ALPHV, scénarios reconstruits d'attaques documentées
- 🪟 **Forensique Windows & Mobile** (enqueteur) — Registre, Amcache, Prefetch, iOS, Android
- 🔐 **Attaques crypto** (enqueteur) — Mixers, tumbling, Monero, jurisprudence FINMA
- 🌐 **Attribution réseau** (enqueteur) — NetFlow, BGP, tor exit nodes, attribution APT
- 🌍 **Coopération internationale** (expert) — EIMP, Budapest art. 32, MLAT avec UE/US
- ⚖️ **Droit suisse approfondi** (expert) — Tous les recoins du CPP, du CP et de la LSCPT
- 🤖 **IA & Deepfakes** (expert) — Keller-Sutter, modèles médicaux, prompt injection
- 🔫 **Cybercrime → crimes graves** (expert) — Sextortion mortelle, défi viral mortel
- 🕵️ **Espionnage d'État** (expert) — APT nation-state, geopol, sat-ground stations
- 🚔 **Quotidien d'enquête** (enqueteur) — Comparutions immédiates, perquis, gardes à vue

Filtres par niveau, canton, thème, durée, et progression personnelle.

---

## Le quiz (2202 questions)

Mode dédié pour réviser sans le contexte narratif. 8 thèmes :

| Thème | Questions |
|---|---|
| Système de fichiers | 365 |
| Acquisition et analyse | 344 |
| Droit | 299 |
| Spécificité des OS | 280 |
| Informatique de base | 230 |
| Cryptologie | 221 |
| Forensique | 194 |
| OSINT | 167 |
| **Saga-spécifique** (Aletsch / Lugano / Tom) | 102 |

3 niveaux de difficulté (763 easy / 718 medium / 519 hard), 1 798 questions à choix unique, 202 à choix multiples. **Mode Daily Challenge** : 20 questions tirées du même seed pour tout le monde aujourd'hui — bonne occasion de comparer ton score avec un·e collègue.

Toutes les questions ont une explication détaillée (`expl_ok` si tu as juste, `expl_ko` si tu te plantes) et une référence (article CP, fiche DFIR, ATF, lien web). Schéma validé : 0 erreur.

---

## Les TP (31 exercices pratiques)

Pour quand tu en as marre des QCM. Mini-laboratoires interactifs dans le navigateur :

- **Magic bytes** — identifier 30+ formats binaires (avec polyglots, offsets non-zéro, falsifications)
- **MFT parsing** — disséquer une entrée MFT NTFS au byte près
- **B-Tree FAT** — comprendre les chaînes de clusters, slack space
- **Data carving** — récupérer des fichiers depuis du non-alloué
- **Disk forensics** — partitions, MBR, GPT, secteurs cachés
- **NTFS internals** — VBR, $MFT, $LogFile, journaux
- **Glossaire FR/EN** — 39 termes à apprendre à traduire dans les deux sens
- **Windows artefacts** — Prefetch, ShellBags, JumpLists, Amcache

8 moteurs JS dédiés (`tp-engine-btree.js`, `tp-engine-carving.js`, etc.) construits par-dessus une couche de données partagée (`tp-data.js`). Tout tourne dans le navigateur, zéro backend.

---

## L'Index Références DFIR (7 onglets)

Plutôt que de cliquer dans 120 fiches pour retrouver « le format des Event IDs Windows », un hub d'aides-mémoire filtrables :

| Onglet | Contenu |
|---|---|
| 🗂 **Artefacts forensiques** | Par OS, par catégorie, avec chemins et outils de parsing |
| 🪵 **Event IDs Windows** | Tous les IDs critiques (Security, Sysmon, PowerShell, Defender) |
| 🎯 **MITRE ATT&CK** | Toutes les techniques (14 tactiques, ~200 techniques, mises à jour 2024+) |
| ⚖️ **Articles juridiques** | CP, CPP, nLPD, LSCPT, LSI, EIMP, RGPD, NIS2, DSA, AI Act, Budapest |
| 🧰 **Outils DFIR** | Open source et commercial, par OS et par phase |
| 🔮 **Magic bytes** | Signatures de fichiers (headers, footers, polyglots) |
| 📖 **Bibliographie DFIR** | 71 ressources : livres, standards, rapports, blogs, podcasts |

Tous filtrables par recherche libre + facettes (domaine, format, langue, niveau).

---

## Comment c'est construit

```
CAS-IN/
├── index.html              # Hub principal (mode débutant + mode DFIR)
├── scene.html              # Lobby scènes + moteur de jeu
├── quiz.html               # Mode quiz (2202 questions, daily, exam)
├── tp.html                 # 31 TP forensiques interactifs
├── tools.html              # Calculateurs (timestamps, conversions, magic bytes)
├── profile.html            # Dossier joueur : XP, achievements, stats
├── npcs.html               # Trombinoscope des 332 NPCs
├── glossary.html           # 446 termes DFIR francophones
├── exam.html               # Mode examen blanc
├── offline.html            # Page hors ligne (PWA)
│
├── references/             # 7 pages d'aide-mémoire filtrables
│   ├── index.html
│   ├── events.html
│   ├── mitre.html
│   ├── legal.html
│   ├── dfir-tools.html
│   ├── signatures.html
│   └── bibliography.html
│
├── fiches/                 # 120 fiches DFIR + droit (HTML statique)
│   ├── index.html          # Hub fiches (12 catégories)
│   └── *.html              # Une fiche par sujet
│
├── scenes/                 # 250 scènes au format JSON
│   ├── index.json          # Index agrégé (généré)
│   └── *.json              # Une scène = un fichier
│
├── data/                   # Données pivots
│   ├── manifest.json       # 120 fiches catégorisées
│   ├── questions.json      # 2202 questions (3.1 MB)
│   ├── npcs.json           # 332 NPCs
│   ├── campaigns.json      # 27 campagnes
│   ├── scenes-chronology.json  # 14 sagas, 250 scènes ordonnées
│   ├── search-index.json   # Index plein-texte (681 KB)
│   ├── cross-links.json    # Liens fiches ↔ scènes
│   ├── counts.json         # Compteurs auto-générés
│   └── glossary.json       # Pointeur (vraies données dans scene-app.js)
│
├── js/                     # Code applicatif
│   ├── core/               # Profile, navbar, search, theme, achievements
│   ├── pages/              # Une app par page (quiz, scene, tp, tools…)
│   ├── components/         # Réutilisables : modals, badges, watchers
│   ├── bridges/            # Profile bridges (quiz→profile, tp→profile, …)
│   └── profile/            # Heatmap, relations, dashboard
│
├── style/                  # CSS (~14 feuilles, design system unifié)
│   ├── fiche_style.css     # Design tokens (vars couleurs, fonts)
│   ├── style.css           # Styles globaux
│   ├── scene.css           # Scène + lobby
│   ├── quiz.css            # Quiz
│   ├── tp.css              # TP
│   ├── refs.css            # Pages référence
│   └── ...
│
├── scripts/                # Outils Python de validation / régénération
│   ├── check_scenes.py     # 250 scènes vérifiées : structure, cantons, npcs
│   ├── check_questions.py  # 2202 questions vérifiées : schema, answers idx
│   ├── build_scenes_index.py
│   ├── build_search_index.py
│   ├── build_cross_links.py
│   ├── generate_counts.py
│   └── sync_fiches_index.py
│
├── tp/                     # TP : moteurs JS spécialisés
│   ├── tp-data.js          # MAGIC_DB, MISMATCH_DB, GLOSSAIRE
│   └── tp-engine-*.js      # 8 moteurs (btree, carving, disk, fat, meta, ntfs, windows)
│
├── docs/                   # PDFs sources (CP, CPP, EIMP, Budapest, LSI, Interpol)
│
├── tests/                  # Tests Playwright (6 spec files)
│
└── sw.js                   # Service Worker (PWA, ~2000 lignes, cache v420)
```

### Système de scoring

Tu fais des choix, tu gagnes ou tu perds des points. Pas de surprise.

Plus subtil : chaque NPC a un **niveau de confiance** envers toi (0-100), qui évolue selon tes décisions. Si tu insultes la juge des mineurs à la scène 4, ne sois pas étonné·e qu'elle te refuse une perquisition à la scène 12. Quand un NPC atteint le niveau « complice », tu débloques une **faveur active** : indice juridique pour les procureurs, indice technique pour les forensicien·ne·s, du temps en plus pour les services de renseignement. À l'inverse, un NPC hostile te tape un malus sur le score final.

C'est documenté dans `js/components/npc-favors.js` si tu veux les détails.

### Mode procureur

Timer activable dans les paramètres. Tu as 90 secondes pour lire l'énoncé et 30 secondes par décision. Pensé pour reproduire la pression d'une vraie audience où on n'a pas trois jours pour décider si on lève les scellés.

### Profil & gamification

- **XP** par scène réussie (≥ 5/6), par fiche lue, par TP résolu, par question correcte
- **Achievements** : ~80 badges (lecture, scoring, custody, multi-canton, etc.)
- **Heatmap** d'activité (style GitHub)
- **Streak quotidien** : enchaîne les jours d'activité, freezes disponibles si tu sautes
- **Leaderboards** hebdo (locaux à ton appareil, pas de serveur)
- **Quêtes** journalières/hebdo
- **4 tracks** de progression carrière : Enquêteur · Forensicien · Magistrat · Renseignement

Tout est local au navigateur. Si tu vides ton localStorage, ça redémarre à zéro.

---

## PWA, offline, et architecture

CAS-IN est une **Progressive Web App** complète :
- Installable sur desktop et mobile (Chrome, Edge, Safari)
- Tout le contenu (250 scènes + 120 fiches + 2202 questions + 332 NPCs + 71 références biblio + 31 TP) est cacheable
- Service Worker `sw.js` v420 : précache de 161 fichiers + cache dynamique pour les fiches via `manifest.json`
- Stratégies : `cacheFirst` pour les assets statiques, `networkFirst` pour les données potentiellement mises à jour
- Fonctionne intégralement offline après la première visite

Aucun backend. Aucun cookie. Aucun tracking. Aucune télémétrie. Pas même Google Analytics. Si tu cliques quelque part, personne ne le saura — y compris moi.

---

## Comment jouer

Va sur **[zufferdi.github.io/CAS-IN](https://zufferdi.github.io/CAS-IN)** et choisis :

1. **Mode débutant** (par défaut) — 4 pilules (Fiches, TP, Scènes, Quiz) façon Matrix. Tu cliques, tu joues.
2. **Mode DFIR avancé** — Hub orienté dossiers, accès direct à l'Index Références, dernières activités, prochaines quêtes, leaderboard.

Depuis là :
- Une scène standalone depuis le lobby (filtres par canton, niveau, thème, durée)
- Une saga narrative (14 disponibles)
- Une campagne thématique (27 disponibles)
- Un mode quiz (libre, par thème, daily, smart adaptatif, examen blanc)
- Un TP au pif depuis `tp.html`

Aucun compte, aucune inscription. Ta progression est dans ton navigateur. Si tu vides ton localStorage, elle disparaît — et c'est très bien comme ça.

---

## Fiction, réalité, et où s'arrête la blague

**Toutes les affaires sont fictives.** Les noms de personnes, d'entreprises, de doctorants chinois suspects, de patientes lésées, de CEO de PME industrielle vaudoise — **fictifs**. Si tu reconnais quelqu'un, c'est une coïncidence ou ton imagination. Les rares cas inspirés d'affaires réelles (LockBit, Xplain, RUAG 2016, Akira contre 200 PME suisses, SMS Blaster arrêté à Muttenz, deepfake Keller-Sutter, etc.) sont explicitement marqués comme tels et utilisent des informations publiques.

**Toutes les institutions sont réelles** : CHUV, EPFL, ETHZ, Compass Security, Kudelski, Citizen Lab, fedpol, MPC, OFCS, Tribunal fédéral, SCPT, OFCOM, CURML, etc. Elles sont citées parce qu'elles existent et qu'on ne peut pas faire une simulation crédible de DFIR suisse en parlant de « l'hôpital générique de Suisse occidentale ». Mais aucune n'a été contactée, sponsorisée, validée, ou ne sait que ce projet existe — et ce n'est pas leur faute.

**Le code pénal suisse, le CPP, la nLPD, la LSCPT, la LSI, le DPMin, le PPMin, le RGPD, NIS2, DSA, l'EU AI Act, la Convention de Budapest** : très réels. Malheureusement très réels. C'est précisément pourquoi ce projet existe.

**Les ATF cités sont vérifiés** un par un, par recherche directe ou via lawinside.ch / crimen.ch / swissprivacy.law / cdbf.ch. Si tu en trouves un qui sonne faux, ouvre une issue, je corrigerai dans la semaine.

**Ce n'est pas un avis juridique.** Si tu es vraiment confronté·e à une cyberattaque, à une enquête, à une question de levée du secret médical, à une perquisition — appelle un·e avocat·e, pas un README.

---

## Crédibilité, et comment elle est obtenue

Pour chaque scène et fiche, vérification systématique des sources :

- **Articles légaux** : recoupement avec fedlex.admin.ch (texte officiel) avant rédaction
- **ATF / jurisprudence** : lecture directe sur bger.ch ou résumé sur lawinside.ch
- **Affaires réelles** : sources primaires (communiqués MPC/fedpol/OFCS, rapports semestriels OFCS, communiqués entreprises) avant tout chiffre cité
- **Outils & frameworks** : vérification via le repo GitHub officiel ou la doc éditeur (Volatility, Autopsy, SigmaHQ, Brute Ratel, Cobalt Strike, etc.)
- **MITRE ATT&CK** : référencement direct depuis attack.mitre.org
- **Bibliographie** : 71 ressources curatées, URLs vérifiées 100% HTTPS, descriptions et notes d'usage rédigées spécifiquement

Quand un fait change (ex. SMS Blaster Lausanne supposé devient SMS Blaster Muttenz/BL après vérification OFCS), la fiche est mise à jour avec changelog explicite dans le delta. La rigueur factuelle, c'est non négociable, parce que sans ça tout le reste s'écroule.

---

## Contribuer

Le projet est développé en solo (avec l'aide de Claude pour la rédaction des scènes et la vérification de la jurisprudence — voir aussi la bibliographie pour les outils). Si tu veux contribuer :

- **Signaler un bug** : ouvre une issue avec capture d'écran et URL de la scène / fiche concernée.
- **Signaler une erreur juridique** : ouvre une issue avec la référence correcte (ATF, article CP, jurisprudence). Pas de « je pense que c'est faux », merci.
- **Proposer une nouvelle scène** : ouvre une discussion avec le contexte, le canton, le thème, le niveau visé. Format : voir n'importe quel `scenes/*.json`. Saga complète = environ une semaine de travail à temps partiel.
- **Améliorer le code** : pull request bienvenue, surtout sur l'accessibilité, le SW, et les composants UI.

Les scripts de validation (`scripts/check_scenes.py`, `scripts/check_questions.py`) doivent passer **0 erreur** avant tout merge. C'est non négociable. Les warnings cantons multi-rattachés (4 cas connus) sont acceptés.

---

## Tests

```bash
npm install
npx playwright test
```

6 fichiers de specs Playwright couvrent : landing (rangs/tracks), profile (snapshot/persistance), tools (12 onglets, calculs), TP (résolution, achievements), tools-gamification, phase6-features.

Pour la validation de cohérence data :

```bash
python3 scripts/check_scenes.py        # 250 scènes : 0 erreur attendu
python3 scripts/check_questions.py     # 2202 questions : 0 erreur attendu
python3 scripts/build_search_index.py  # Régénère l'index plein-texte (681 KB)
python3 scripts/generate_counts.py     # Régénère data/counts.json
```

---

## Mentions

- **Code** : sous licence MIT, fais-en ce que tu veux du moment que tu gardes le copyright.
- **Contenu pédagogique** (scènes, fiches, NPCs, bibliographie) : CC BY-NC-SA 4.0. Utilisation non commerciale, attribution, partage à l'identique.
- **Rédaction et conception** : @zufferdi
- **Assistance rédactionnelle** : Anthropic Claude (Opus 4.6 puis 4.7).
- **Sources juridiques** : Tribunal fédéral, lawinside.ch, crimen.ch, swissprivacy.law, cdbf.ch, droitpourlapratique.ch, FMH, OFCS, PFPDT, fedpol, MPC, et la pile de Basler Kommentar qui prend la poussière.
- **Inspirations DFIR** : MITRE ATT&CK + ATLAS, NIST AI 100-2, OWASP LLM Top 10 2025, ENISA, BSI, SANS DFIR, pratique CCUC, et beaucoup trop d'heures sur Bleeping Computer et The DFIR Report.
- **Bibliographie complète** : voir [Index Références → Bibliographie DFIR](references/bibliography.html) (71 entrées curatées).

---

## Disclaimer obligatoire

Aucune patiente fictive n'a été lésée pendant le développement. Aucun doctorant chinois n'a été stéréotypé sans contexte clinique (Zhang Yi est le seul de la base, et il est officiellement le méchant de *L'Affaire du Modèle* — la base en compte par ailleurs 331 autres dont des héros, des victimes, des collègues, des juges, plusieurs procureures romandes qu'on aime bien, deux liaisons TikTok à Dublin et un médecin légiste du CURML spécialisé en pédiatrie).

Toute ressemblance avec une affaire en cours est purement gênante. Toute ressemblance avec le calendrier judiciaire vaudois est purement aspirationnelle. Toute ressemblance avec ton dernier examen du CAS Investigation Numérique est le but recherché.

---

*Dernière mise à jour de ce README : 19 mai 2026, version 3.0 (delta v43), 250 scènes, 332 NPCs, 27 campagnes, 14 sagas, 120 fiches, 2202 questions, 71 références biblio, 0 trace de tracking.*

*Si tu lis cette ligne, c'est que tu cherches vraiment des excuses pour ne pas commencer la saga d'initiation.*
