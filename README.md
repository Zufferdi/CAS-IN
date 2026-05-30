# CAS-IN

**Outil pédagogique de simulation DFIR & procédure pénale suisse.**

Tu prends une scène, tu te retrouves dans la peau d'un·e procureur·e, RSSI, juge des mineurs, doctorant·e ou grand-mère arnaquée au cousin russe. Tu dois prendre 3 à 6 décisions sous contrainte. Chaque choix est noté, commenté, et raccroché à un article du CP/CPP ou à un ATF réel. À la fin, on t'explique ce qui était bien, ce qui passait, et ce qui aurait fait basculer tout le dossier en nullité (art. 141 al. 2 CPP, c'est notre best-seller).

C'est sérieux. Mais ne te trompe pas : c'est un projet qui contient **324 personnages non-joueurs nommés**, dont la moitié sont des procureures romandes, des médecins légistes du CURML et des inspecteurs cybercrime fictifs. Si tu cherches un Netflix interactif tranquille pour le dimanche soir, va voir ailleurs.

---

## Pour qui

- Étudiant·e·s en droit / informatique / cybersécurité qui en ont marre des manuels.
- Profils DFIR qui veulent réviser le CPP suisse sans s'endormir.
- Juristes qui découvrent que MITRE ATT&CK n'est pas un opérateur télécom.
- Personnes qui se sont déjà demandé quelle est la différence entre l'art. 143 et l'art. 143bis CP, et qui n'ont jamais osé demander.
- Préparation au CAS Investigation Numérique, à la formation continue des magistrats, ou à la prochaine soirée où on te demande « alors c'est quoi exactement la nLPD ».
- Toute personne curieuse de comprendre *concrètement* comment une enquête cyber se déroule en Suisse — depuis le premier appel jusqu'à l'audience d'arrondissement.

**Niveaux disponibles** : `stagiaire` · `inspecteur` · `enqueteur` · `expert`. Si tu te lances direct sur la saga *L'Affaire Tom — Défi mortel TikTok* niveau Expert, c'est ton problème. Tu auras besoin de connaître le DPMin, le PPMin, l'art. 16 DSA et la jurisprudence Lanzarote sur les auditions d'enfants. Bon courage.

---

## Ce qu'il y a dedans

| Élément | Quantité | Commentaire |
|---|---:|---|
| **Scènes jouables** | **392** | Chacune = 3 à 6 décisions notées, débrief intégral |
| **Questions de quiz** | **2 235** | 8 thèmes, 3 niveaux de difficulté, mode quotidien |
| **Fiches techniques** | **120** | DFIR + droit suisse + outils + cloud + LLM forensique |
| **Tutoriels d'outils DFIR** | **28** | Pas-à-pas Autopsy, Volatility, Sleuthkit, FTK, etc. |
| **Catégories de TP** | **43** | Carving, MFT parsing, magic bytes, NTFS internals, etc. |
| **Personnages (NPCs)** | **324** | Chacun avec rôle, institution, expertise, bio, citation, relations |
| **Campagnes thématiques** | **46** | Organisées par niveau et thème |
| **Sagas narratives** | **35** | Multi-actes avec conséquences procédurales en cascade |
| **Trophées (achievements)** | **317** | Lecture, scoring, custody, multi-canton, multi-rôle, etc. |
| **Cantons suisses couverts** | **19+** | Plus la Confédération et l'UE pour les volets transfrontaliers |
| **Pages de référence DFIR** | **6** | Artefacts, Event IDs, MITRE, Droit, Outils, Magic bytes, Biblio |
| **Bibliographie** | **71 ressources** | Livres, standards, rapports, blogs, podcasts — filtrable |
| **Service Worker offline** | ✓ | Tout le contenu accessible hors-ligne après première visite (PWA) |

La date du jeu est calée sur le présent (mai 2026 au moment où tu lis cette ligne). Certaines sagas se projettent sur 12-24 mois dans le futur proche.

---

## L'architecture en 4 pôles (v3.0)

Depuis la refonte v3.0-jolification (mai 2026), l'app est organisée en **4 pôles** d'apprentissage, chacun avec son hub dédié :

| Pôle | Hub | Sous-types | Pour |
|---|---|---|---|
| 📚 **Apprendre** | `apprendre.html` | Fiches · Tutoriels · Références | Acquérir la théorie |
| 🧪 **Pratiquer** | `pratiquer.html` | TP interactifs · Outils calculateurs | Ancrer le geste |
| 🔍 **Enquêter** | `enqueter.html` | Scènes · Sagas · Examen scènes · Études de cas | Réflexe d'enquêteur |
| 💊 **Se tester** | `tester.html` | Quiz · Examen blanc · Mastery · Succès | Calibrer la progression |

Chaque hub propose :
- Tableau de bord de progression personnalisé (jauges)
- Cartes vers les sous-types disponibles
- Recommandations adaptatives selon ton profil (« Tu deviens à l'aise, essaie un examen blanc »)
- Liens transverses vers les 3 autres hubs

Les 4 pilules colorées de l'accueil (Bleu/Vert/Orange/Rouge) pointent vers ces hubs. Raccourcis clavier : `B` `V` `O` `R`.

---

## Le quiz (2 235 questions)

Mode dédié pour réviser sans le contexte narratif. 8 thèmes :

| Thème | Questions |
|---|---:|
| Système de fichiers | 372 |
| Acquisition et analyse | 347 |
| Droit | 307 |
| Spécificité des OS | 292 |
| Informatique de base | 253 |
| Forensique | 252 |
| Cryptologie | 231 |
| OSINT | 181 |
| **Total** | **2 235** |

3 niveaux de difficulté (easy/medium/hard), question à choix unique ou multiple. **Mode Daily Challenge** : 20 questions tirées du même seed pour tout le monde aujourd'hui — bonne occasion de comparer ton score avec un·e collègue.

Toutes les questions ont une explication détaillée (`expl_ok` si tu as juste, `expl_ko` si tu te plantes) et une référence (article CP, fiche DFIR, ATF, lien web). Schéma validé : 0 erreur.

**Modes disponibles** :
- **Libre** : choisis tes thèmes/niveaux, va à ton rythme
- **Daily** : 20 questions du jour, même seed mondial
- **Survival** : 3 vies, jusqu'à la dernière question
- **Marathon** : enchaîne jusqu'à fatigue
- **Examen blanc** (`pages/exam.html`) : conditions réelles, durée limitée, note finale
- **Mastery** (`pages/mastery.html`) : révision intelligente par fiche, priorise ce que tu maîtrises le moins

---

## Les TP (43 catégories)

Pour quand tu en as marre des QCM. Mini-laboratoires interactifs dans le navigateur :

- **Magic bytes** — identifier 30+ formats binaires (avec polyglots, offsets non-zéro, falsifications)
- **MFT parsing** — disséquer une entrée MFT NTFS au byte près
- **B-Tree FAT** — comprendre les chaînes de clusters, slack space
- **Data carving** — récupérer des fichiers depuis du non-alloué
- **Disk forensics** — partitions, MBR, GPT, secteurs cachés
- **NTFS internals** — VBR, $MFT, $LogFile, journaux
- **Glossaire FR/EN** — termes à apprendre à traduire dans les deux sens
- **Windows artefacts** — Prefetch, ShellBags, JumpLists, Amcache

Et 35 autres catégories. 8 moteurs JS dédiés construits par-dessus une couche de données partagée (`tp-data.js`). Tout tourne dans le navigateur, zéro backend.

---

## Les tutoriels (28 outils DFIR)

Section nouvellement structurée en v3.0 (`tutoriels.html`). Pas-à-pas pour les outils incontournables du DFIR :

- **Acquisition** : FTK Imager, Guymager, dc3dd, dd
- **Analyse disques** : Autopsy, Sleuthkit, X-Ways
- **Mémoire** : Volatility, Rekall
- **Réseau** : Wireshark, NetworkMiner, Zeek, Suricata
- **Mobile** : Cellebrite, MOBILedit, Andriller, ALEAPP
- **Cloud/SaaS** : Hindsight, CloudTrail, M365
- **Triage** : KAPE, Velociraptor, GRR

Filtres par niveau (débutant/intermédiaire/expert), par phase (acquisition/analyse/restitution). Parcours pédagogique numéroté pour ne pas se perdre.

---

## L'Index Références DFIR

Hub d'aides-mémoire filtrables (`references/index.html`) :

| Onglet | Contenu |
|---|---|
| 🗂 **Artefacts forensiques** | Par OS, par catégorie, avec chemins et outils de parsing |
| 🪵 **Event IDs Windows** | Tous les IDs critiques (Security, Sysmon, PowerShell, Defender) |
| 🎯 **MITRE ATT&CK** | Toutes les techniques (14 tactiques, ~200 techniques) |
| ⚖️ **Articles juridiques** | CP, CPP, nLPD, LSCPT, LSI, EIMP, RGPD, NIS2, DSA, AI Act, Budapest |
| 🧰 **Outils DFIR** | Open source et commercial, par OS et par phase |
| 🔮 **Magic bytes** | Signatures de fichiers (headers, footers, polyglots) |
| 📖 **Bibliographie DFIR** | 71 ressources : livres, standards, rapports, blogs, podcasts |

Tous filtrables par recherche libre + facettes (domaine, format, langue, niveau).

---

## Comment c'est construit

```
CAS-IN/
├── index.html              # Hub principal (4 pilules + mini-bar identité)
├── apprendre.html          # Hub Apprendre (Fiches + Tutoriels + Références)
├── pratiquer.html          # Hub Pratiquer (TP + Outils)
├── enqueter.html           # Hub Enquêter (Scènes + Sagas + Examen + Études)
├── tester.html             # Hub Se tester (Quiz + Examen + Mastery + Succès)
├── scene.html              # Lobby scènes + moteur de jeu
├── quiz.html               # App quiz (2235 questions, daily, survival, marathon)
├── tp.html                 # 43 catégories de TP forensiques
├── tutoriels.html          # 28 tutoriels d'outils DFIR (filtres + parcours)
├── 404.html                # Page d'erreur custom
├── offline.html            # Page hors-ligne (PWA)
│
├── pages/                  # Sous-pages (depuis la réorg v131c)
│   ├── profile.html        # Dossier joueur : XP, achievements, stats, carrière
│   ├── carriere.html       # 4 tracks : Enquêteur · Forensicien · Magistrat · Renseignement
│   ├── succes.html         # Galerie des 317 trophées
│   ├── exam.html           # Examen blanc quiz (conditions réelles)
│   ├── scene-exam.html     # Examen blanc scènes
│   ├── mastery.html        # Révision intelligente par fiche
│   ├── collections.html    # Collections thématiques
│   ├── sagas.html          # (redirection vers scene.html?view=sagas)
│   ├── case-studies.html   # Études de cas approfondies
│   ├── case-study-detail.html
│   ├── tools.html          # Calculateurs (timestamps, conversions, magic bytes)
│   ├── glossary.html       # 446 termes DFIR francophones
│   ├── npcs.html           # Trombinoscope des 324 NPCs
│   ├── parcours.html       # Parcours pédagogiques curatés
│   ├── parcours-detail.html
│   └── dictionnaire.html   # Lexique
│
├── references/             # 6 pages d'aide-mémoire filtrables
│   └── …
│
├── fiches/                 # 120 fiches DFIR + droit (HTML statique)
│   └── *.html
│
├── tutoriels/              # 28 tutoriels au format HTML
│   └── *.html
│
├── scenes/                 # 392 scènes au format JSON
│   ├── index.json          # Index agrégé (généré)
│   └── *.json              # Une scène = un fichier
│
├── data/                   # Données pivots
│   ├── manifest.json       # 120 fiches catégorisées
│   ├── questions-index.json    # Méta : 8 thèmes, totaux (1.6 KB)
│   ├── questions-search.json   # Index minimaliste pour search globale (425 KB)
│   ├── questions/              # 8 chunks par thème (~500 KB chacun)
│   │   └── quiz-{theme-slug}.json
│   ├── i18n/               # 4 langues : fr, en, de, it
│   ├── npcs.json           # 324 NPCs
│   ├── campaigns.json      # 46 campagnes, 35 sagas
│   ├── scenes-chronology.json
│   ├── search-index.json   # Index plein-texte
│   ├── cross-links.json    # Liens fiches ↔ scènes
│   ├── counts.json         # Compteurs auto-générés
│   └── glossary.json
│
├── js/                     # Code applicatif
│   ├── core/               # Profile, navbar, search, theme, achievements, storage, a11y
│   │   ├── cas-in-storage.js      # NEW v132n — validation localStorage + versioning
│   │   ├── cas-in-a11y.js         # Module a11y (skip-link, landmark, announces)
│   │   ├── cas-in-utils.js        # Helpers (lsGet/lsSet/lsDel, dataUrl, etc.)
│   │   ├── cas-in-search.js       # Recherche globale (index minimaliste v132k)
│   │   └── …
│   ├── pages/              # Une app par page (quiz, scene, tp, tools, exam…)
│   ├── components/         # Réutilisables : modals, badges, watchers
│   ├── bridges/            # Profile bridges (quiz→profile, tp→profile, …)
│   ├── profile/            # Heatmap, relations, dashboard, onboarding-ui
│   └── tp/                 # 8 moteurs (btree, carving, disk, fat, meta, ntfs, windows)
│
├── style/                  # CSS (~14 feuilles, design system unifié)
│   ├── fiche_style.css     # Design tokens (vars couleurs, fonts)
│   ├── style.css           # Styles globaux
│   ├── scene.css, quiz.css, tp.css, refs.css, …
│   └── share-buttons.css   # NEW v132d — partage social trophées
│
├── scripts/                # Outils Python de validation / régénération
│   ├── check_scenes.py
│   ├── check_questions.py
│   ├── build_scenes_index.py
│   ├── build_search_index.py
│   ├── build_cross_links.py
│   ├── generate_counts.py
│   ├── sync_fiches_index.py
│   ├── split_questions.py          # NEW v132f — découpe questions.json en chunks
│   ├── generate_sitemap.py         # NEW v132a — auto-génération sitemap.xml
│   └── cleanup-questions-legacy.sh # NEW v132j — cleanup optionnel
│
├── docs/                   # Documentation (CHANGELOG, PDFs sources, deltas)
│
├── tests/                  # Tests Playwright
│
├── sitemap.xml             # NEW v132a — sitemap auto-généré (178 URLs)
├── robots.txt              # NEW v132a
├── og-image*.svg           # NEW v132e — og-images dédiées par hub
└── sw.js                   # Service Worker (slim 21 KB depuis v132p, cache v144)
```

### Système de scoring

Tu fais des choix, tu gagnes ou tu perds des points. Pas de surprise.

Plus subtil : chaque NPC a un **niveau de confiance** envers toi (0-100), qui évolue selon tes décisions. Si tu insultes la juge des mineurs à la scène 4, ne sois pas étonné·e qu'elle te refuse une perquisition à la scène 12. Quand un NPC atteint le niveau « complice », tu débloques une **faveur active** : indice juridique pour les procureurs, indice technique pour les forensicien·ne·s, du temps en plus pour les services de renseignement. À l'inverse, un NPC hostile te tape un malus sur le score final.

C'est documenté dans `js/components/npc-favors.js` si tu veux les détails.

### Mode procureur

Timer activable dans les paramètres. Tu as 90 secondes pour lire l'énoncé et 30 secondes par décision. Pensé pour reproduire la pression d'une vraie audience où on n'a pas trois jours pour décider si on lève les scellés.

### Profil & gamification

- **XP** par scène réussie (≥ 5/6), par fiche lue, par TP résolu, par question correcte, par tutoriel validé
- **317 trophées** : 7 catégories (lecture, scoring, custody, multi-canton, multi-rôle, toolkit, méta)
- **Heatmap d'activité** (style GitHub) dans le profil
- **Streak quotidien** : enchaîne les jours d'activité, freezes disponibles si tu sautes
- **Leaderboards** hebdo (locaux à ton appareil, pas de serveur)
- **Quêtes** journalières/hebdo
- **4 tracks de carrière** : Enquêteur · Forensicien · Magistrat · Renseignement (voir `pages/carriere.html`)
- **Partage social** des trophées débloqués (Web Share API mobile, clipboard desktop)

Tout est local au navigateur. Si tu vides ton localStorage, ça redémarre à zéro.

### Robustesse localStorage (v132n)

Module `cas-in-storage.js` qui détecte au boot si une clé critique du localStorage est corrompue (JSON malformé). Dans ce cas :
1. Backup automatique sous `casIn_corrupt_backup_<clé>` (TTL 7 jours)
2. Purge propre de la clé corrompue
3. L'app continue de fonctionner (chaque consommateur a son fallback)

Infrastructure de versioning du schema (`SCHEMA_VERSION`) prête pour les migrations futures.

### Accessibilité (WCAG 2.2 AA)

- 100 % des pages avec `<html lang="fr">`
- 100 % des pages avec un `<h1>` (sr-only si pas de titre visible nécessaire)
- Contrastes principaux validés AA (couleur `--dim` passée de 4.12 à 5.07/5.35 en v132i)
- Module `cas-in-a11y.js` sur les pages principales : skip-link, landmark `<main>`, API `CASa11y.announce()`, gestion focus modale
- ARIA-labels sur les boutons icônes (notamment le bouton 💡 hint du quiz)

### Sécurité (v132l)

- **Content-Security-Policy** sur les 183 pages : default-src 'self', restrictions sur scripts/styles/fonts/images
- `frame-ancestors 'none'` (anti-clickjacking)
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`

---

## PWA, offline, et architecture

CAS-IN est une **Progressive Web App** complète :
- Installable sur desktop et mobile (Chrome, Edge, Safari)
- Tout le contenu (392 scènes + 120 fiches + 2 235 questions + 324 NPCs + 28 tutoriels + 43 TP + 71 références biblio) est cacheable
- Service Worker `sw.js` slim (21 KB depuis v132p) — cache `cas-in-v144`
- Stratégies : `cacheFirst` pour les statiques, `networkFirst` pour les données critiques, runtime cache pour les chunks de questions
- Fonctionne intégralement offline après la première visite

### Performance v3.0

| Optimisation | Économie |
|---|---|
| Lazy load des questions par thème (8 chunks) | -4.2 MB au boot PWA |
| Index search minimaliste | -3.8 MB par recherche initiale |
| SW trim historique | -89 KB sur le SW lui-même |
| **Total** | **~8 MB économisés** |

Aucun backend. Aucun cookie. Aucun tracking. Aucune télémétrie. Pas même Google Analytics. Si tu cliques quelque part, personne ne le saura — y compris moi.

---

## Comment jouer

Va sur **[zufferdi.github.io/CAS-IN](https://zufferdi.github.io/CAS-IN)** et choisis l'un des 4 hubs :

1. **Apprendre** (📚) — théorie d'abord : fiches, tutoriels, références
2. **Pratiquer** (🧪) — main à la pâte : TP interactifs, calculateurs
3. **Enquêter** (🔍) — scénarios immersifs : scènes, sagas, études de cas
4. **Se tester** (💊) — évaluation : quiz, examen blanc, mastery, succès

À la première visite, un **onboarding 3 écrans** te présente les 4 pôles et te suggère 3 parcours d'entrée selon ton profil (curieux / pressé / évaluation).

Tu peux aussi y aller direct :
- Une scène standalone depuis le lobby (filtres par canton, niveau, thème, durée)
- Une saga narrative
- Une campagne thématique
- Un mode quiz (libre, daily, examen blanc, mastery)
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

Quand un fait change, la fiche est mise à jour avec changelog explicite dans le delta. La rigueur factuelle, c'est non négociable, parce que sans ça tout le reste s'écroule.

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
python3 scripts/check_scenes.py        # 392 scènes : 0 erreur attendu
python3 scripts/check_questions.py     # 2 235 questions : 0 erreur attendu
python3 scripts/build_search_index.py  # Régénère l'index plein-texte
python3 scripts/generate_counts.py     # Régénère data/counts.json
python3 scripts/split_questions.py     # Régénère les 8 chunks + questions-search.json
python3 scripts/generate_sitemap.py    # Régénère sitemap.xml
```

---

## Versions

- **v3.0 — 19 mai 2026** : Release initiale (250 scènes, 2202 questions, 332 NPCs)
- **v3.0-jolification — 30 mai 2026** : Refonte UX + perf + sécurité + a11y (20 deltas en cascade). Voir [`docs/CHANGELOG.md`](docs/CHANGELOG.md) pour le détail.

Cache SW actuel : **`cas-in-v144`**.

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

Aucune patiente fictive n'a été lésée pendant le développement. Aucun doctorant chinois n'a été stéréotypé sans contexte clinique (Zhang Yi est le seul de la base, et il est officiellement le méchant de *L'Affaire du Modèle* — la base en compte par ailleurs 323 autres dont des héros, des victimes, des collègues, des juges, plusieurs procureures romandes qu'on aime bien, deux liaisons TikTok à Dublin et un médecin légiste du CURML spécialisé en pédiatrie).

Toute ressemblance avec une affaire en cours est purement gênante. Toute ressemblance avec le calendrier judiciaire vaudois est purement aspirationnelle. Toute ressemblance avec ton dernier examen du CAS Investigation Numérique est le but recherché.

---

*Dernière mise à jour de ce README : 30 mai 2026, version 3.0-jolification (cache SW v144) — 392 scènes, 324 NPCs, 46 campagnes, 35 sagas, 120 fiches, 28 tutoriels, 43 TP, 2 235 questions, 71 références biblio, 317 trophées, 0 trace de tracking.*

*Si tu lis cette ligne, c'est que tu cherches vraiment des excuses pour ne pas commencer la saga d'initiation.*
