# Changelog

Toutes les modifications notables apportées à ce projet sont documentées ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [2.20] — 2026-05-02

Cette version cible 3 quick wins : **factorisation du code répété**, **fix de désynchronisation** entre fichiers d'index, et **complétion d'accessibilité** sur les fiches.

### Le problème — bilan d'audit

Audit complet du repo après v2.19 a révélé :
- **108 fiches** contenaient des blocs `<script>` inline avec du code dupliqué (scroll-progress, back-top, quiz-reveal, collapsibles)
- **`data/counts.json`** affichait `93 scènes` alors qu'il y en a `97` sur le disque (drift de l'index)
- **15 fiches** sans aucun `<h1>` — mauvais pour l'accessibilité (lecteurs d'écran) et le SEO (Google se fie au h1)
- **5 scènes orphelines** ajoutées récemment mais jamais enregistrées dans `scenes/index.json` (donc pas indexables par `cas-in-search.js`)

### Ajouté — `js/components/fiche-common.js` (171 L)

Module factorisé qui remplace le code dupliqué dans 109 fiches. Implémente :

- **Barre de progression de défilement** (`#scroll-progress`) : 1 IIFE avec `passive: true`
- **Bouton retour-haut** (`#back-top`) : toggle classe `.visible` au-delà de 300 px
- **Quiz révélation** (`.quiz-reveal-btn` → `.quiz-answer`) : toggle + texte du bouton
- **Sections collapsibles** (`.collapsible-header` → `.collapsible.open`)
- **Onglets génériques** (`data-tab-group`, `data-tab-btn`, `data-tab-page`) : version uniforme de toutes les variantes `showTab()` / `T(id)` qu'on trouvait dans les fiches

Conçu **idempotent** : utilise des `data-*Bound` flags pour éviter le double-bind si le script est rechargé. Compatible avec les `showTab` fiche-spécifiques préservés (architecture NTFS, etc.).

### Ajouté — `scripts/migrate_fiche_common.py`

Script qui :
1. Détecte les patterns dupliqués dans chaque fiche (regex multi-variantes : IIFE, fonctions, arrow functions)
2. Les supprime du HTML
3. Injecte `<script src="../js/components/fiche-common.js" defer></script>` au bon endroit
4. Préserve la logique fiche-spécifique (variables custom, `archDetails`, calculateurs hash, etc.)

Résultats sur le repo :
- **92 patterns retirés** sur 109 fiches
- **52 blocs `<script>` entièrement vidés** (rien d'autre que des patterns communs)
- **~54 KB économisés** (lecture-écriture HTML cumulée)
- **3 résiduels** non factorisés (variantes trop spécifiques) → idempotence préserve la cohérence

### Ajouté — `scripts/build_scenes_index.py` + fix désync

Le bug : `scenes/index.json` (consommé par `cas-in-search.js` et `scene-app.js`) était maintenu à la main. Quand on ajoutait une scène, on oubliait parfois d'updater l'index. Au moment de l'audit, il y avait :
- **5 scènes manquantes** : `audit-prestataire-systemique`, `flubot-bec-cascade`, `lsi-vs-lpd-timing`, `referent-milice-ransomware`, `valais-cascade-12-communes`
- **1 entrée fantôme** : `step-martigny-ransomware` (l'index pointait sur un fichier supprimé)

Solution : `build_scenes_index.py` régénère `scenes/index.json` depuis les fichiers individuels. Extrait : `id`, `title`, `icon`, `difficulty`, `atmosphere`, `tags`, `intro`, `alertLevel`, `stepCount`, `legalRefs`. Tri stable par id.

Conséquences :
- `scenes/index.json` : 93 → **97 entrées**
- `data/counts.json` : `scenes: 93` → **`scenes: 97`** (cohérent avec le repo)
- Le moteur de recherche full-text peut maintenant indexer les 5 scènes oubliées
- `scene.html` lazy-load les 5 scènes (avant : 404)

### Ajouté — `scripts/add_h1_to_fiches.py` + a11y

Les 15 fiches sans `<h1>` :
`autopsy`, `browser_forensique`, `comparaison_fs`, `email_forensique`, `encodage`, `ext`, `fat12`, `formats`, `incident_response`, `logs_windows`, `mac_times`, `macos-linux`, `preuve`, `suisse`, `wireshark_pcap`.

Ces fiches affichaient leur titre uniquement dans `<span class="tn-title">` (nav header) — bien visible mais **invisible aux outils d'a11y** (lecteurs d'écran annoncent le `<h1>`, pas les spans de navigation).

Solution : extraction du titre depuis `tn-title` (avec smart-casing préservant les acronymes : `NTFS`, `FAT`, `MAC`, `EXIF`, etc.) et injection d'un `<h1>` stylé identiquement aux autres fiches du repo (`font-family: var(--sans); font-size: 2rem; font-weight: 800`).

Préservation : la nav `tn-title` et le breadcrumb `bc-current` restent intacts (visuel inchangé). Idempotence : skip les fiches qui ont déjà un `<h1>`.

Résultat : **109/109 fiches ont maintenant exactement 1 `<h1>` unique** ✅. Lighthouse a11y et SEO Google bénéficient.

### Modifié — Workflow GitHub Actions étendu

`.github/workflows/sync-fiches-index.yml` orchestre désormais 6 étapes (vs 4 en v2.19) :

1. `inject_fiche_related.py` (existant)
2. **`migrate_fiche_common.py`** (NEW)
3. **`build_scenes_index.py`** (NEW)
4. `build_index.py` (existant)
5. `build_search_index.py` (existant)
6. `build_cross_links.py` (existant)

Tout reste automatique : à chaque ajout/modif de fiche ou de scène sur github.com, le bot régénère les 4 indexes (`fiches/index.html`, `scenes/index.json`, `data/search-index.json`, `data/cross-links.json`) et injecte les composants manquants. Aucune action manuelle requise.

### Modifié — Service Worker v53 → v54

- Cache version : `cas-in-v53` → `cas-in-v54`
- Nouveau fichier ajouté au cache : `js/components/fiche-common.js` (~5 KB gzippé)

### Statistiques v2.20

| Indicateur | v2.19 | v2.20 |
|---|---|---|
| Fiches | 109 | 109 |
| Fiches avec `<h1>` | 94 / 109 (86 %) | **109 / 109 (100 %)** |
| Fiches avec `fiche-common.js` | 0 | **109 / 109** |
| Scènes (counts.json) | 93 | **97** (réel) |
| `scenes/index.json` | 93 | **97** |
| Patterns inline dupliqués | ~150 | **~58** (-61 %) |
| Service Worker | v53 | **v54** |
| Étapes du workflow | 4 | **6** |

## [2.19] — 2026-05-02

Cette version livre la **navigation transverse** entre fiches, quiz, TP et scènes, ainsi que **27 questions ICS/SCADA** dédiées et un nettoyage des restes de prototype en prod.

### Le problème

Jusqu'ici, fiches, quiz, TP et scènes vivaient en silos. Une fiche NTFS ne renvoyait pas vers les questions sur NTFS, ni vers le TP « Run List », ni vers la scène d'investigation BitLocker. Naviguer entre les supports d'apprentissage demandait à l'utilisateur de chercher manuellement.

Côté contenu, le thème **Forensique** ne comptait que **43 questions sur 1750** (2,5 %), et l'investigation des systèmes industriels (ICS/SCADA/OT) n'avait pas de chapitre dédié — alors que c'est un des sujets phares du CAS Investigation Numérique.

### Ajouté — Liens croisés Q ↔ Fiche ↔ TP ↔ Scènes

#### Mapping généré (`data/cross-links.json`, 35 KB)

- Nouveau script `scripts/build_cross_links.py` qui construit le mapping bidirectionnel à partir de `data/manifest.json`, `data/questions.json`, `scenes/*.json` et `tp.html`.
- Stratégie hybride : **hard-coded mappings** explicites pour les 70+ fiches principales (priorité), complétés par un **auto-fill** par mots-clés distinctifs (≥4 caractères, hors mots génériques).
- Statistiques générées :
  - **1730 liens** fiches → questions (52/109 fiches couvertes)
  - **26 liens** fiches → TP
  - **73 liens** fiches → scènes
- Mappings inverses (TP → fiches, scène → fiches) inclus dans le même fichier.
- Régénération automatique via `scripts/build-all.sh`.

#### Section « Voir aussi » dans chaque fiche (`js/components/fiche-related.js`)

- Composant injecté en bas des **109 fiches** (après `.fiche-cta-row`) qui affiche jusqu'à 7 cartes :
  - 🎯 **1 carte Quiz** (cyan) : « Tester vos connaissances · N questions sur ce sujet »
  - 🧪 **3 cartes TP** (orange) : exercices pratiques liés (ex. NTFS → Run List, MBR, Slack Space)
  - 🎭 **3 cartes Scènes** (purple) : scénarios DFIR pertinents
- Stylé en flexbox responsive (cards full-width sous 600px), compatible mode dark/light.
- Hover effect : `translateY(-2px) + shadow`.
- Le lien Quiz dépose un filtre dans `localStorage['cas-in-quiz-filter']` (TTL 1h) avant de naviguer vers `quiz.html`.

#### Filtrage du quiz par fiche (modif `js/pages/quiz-app.js`)

- Au démarrage du quiz, lecture de `localStorage['cas-in-quiz-filter']`. Si présent, frais (< 1h) et avec des indices valides : crée `window.S_ficheFilter = { ficheFile, indices, label }`.
- `buildPool()` : nouveau **mode prioritaire** qui retourne uniquement les questions dont l'index est dans le filtre — passe avant `survival`/`sm2`/`smart`/etc.
- **Bannière** affichée en haut du quiz : « 📖 Quiz filtré sur la fiche [X] · N questions » avec bouton « Voir toutes les questions » (clear le filtre + rebuild pool en place, sans reload).
- Le filtre est consommé une fois (supprimé du localStorage à la lecture).

### Ajouté — Questions ICS/SCADA/OT (+27)

Nouveau chapitre `ICS / SCADA / OT Forensique` dans le thème **Forensique** (🔬), passant de **43 → 70 questions**. Total questions : **1750 → 1777**.

Distribution :
- **6 easy** : fondamentaux (CIA vs SAID, modèle Purdue, PLC, IEC 62443, HMI, historian).
- **13 medium** : protocoles (Modbus TCP/502, IEC 61850 MMS/GOOSE/SV, OPC UA), attaques historiques (Stuxnet, Industroyer, Triton/Trisis, Pipedream, Colonial Pipeline), forensique (engineering workstation, Conpot honeypot, Snap7).
- **8 hard** : analyse de tags historian, PLC live forensics avec Snap7/libnodave, IOCs Triton, data diodes, IKT-Minimalstandard suisse (OFAE/BWL).

Toutes les questions ont des références sourcées (NIST 800-82r3, IEC 62443, MITRE ATT&CK for ICS, ENISA, rapports Mandiant/Dragos).

### Modifié — Build orchestrator + git hook

- Nouveau `scripts/build-all.sh` : orchestre les 5 étapes (counts → fiche-index → search-index → cross-links → checks) en un appel.
- Mode `--quick` qui saute la régénération de l'index full-text (utile lors d'itérations rapides).
- Nouveau `scripts/git-hooks/pre-commit` : détecte les fiches modifiées dans le commit, régénère automatiquement `search-index.json` et `fiches/index.html`, les ajoute au commit. Évite l'oubli classique de l'index obsolète.
- Documentation dans `scripts/README.md`.

### Modifié — `scripts/build_index.py` (idempotence)

- Le générateur de `fiches/index.html` produit désormais le bloc moderne avec `fiche-search.js` + `search-modal.js` (au lieu de l'ancien `filterFiches()` inline). Une régénération ne casse plus le moteur de recherche.
- Le `filterFiches()` reste embarqué comme fallback (au cas où les modules JS échouent à charger).

### Modifié — Service Worker v52 → v53

- Cache version : `cas-in-v52` → `cas-in-v53`.
- Nouveaux fichiers ajoutés au cache : `js/components/fiche-related.js`, `data/cross-links.json`.

### Nettoyage prod

- **`console.log` retirés (7 → 0)** : les logs de boot verbeux des modules attachés (`profile-track-v5`, `scene-engine-v4`, `scene-app`, `scene-ux-patch`, `scene-lobby-v3`, `cas-in-export`, ainsi que le `SW enregistré` dans `scene-app`). Aucun log de bruit en console pour un visiteur normal.
- **`alert()` retirés (6 → 0 en direct)** : remplacés par `casNotify()` (cas-in-export.js) et un fallback inline `showToast || alert` (profile-page.js). Les 2 alertes suivies de `location.reload()` ont leur reload allongé de 200 ms → 1200 ms pour que le toast soit lisible.
- **2 catch silencieux complétés** par un `console.warn` ciblé (lecture de track ladder, calcul des nouveaux badges) — les autres `catch (e) {}` étaient des patterns défensifs légitimes (mode privé `localStorage`, API `vibrate`/`audio context` non supportées) et ont été conservés.

### Statistiques v2.19

| Indicateur | v2.18 | v2.19 |
|---|---|---|
| Fiches | 109 | 109 |
| Questions | 1750 | **1777** (+27 ICS) |
| Scènes | 98 | 98 |
| Catégories TP | 27 | 27 |
| Thème Forensique | 43 q | **70 q** (+27) |
| Liens croisés générés | 0 | **1829** (1730 Q + 26 TP + 73 scènes) |
| `console.log` prod | 7 | **0** |
| `alert()` directs | 6 | **0** |
| Service Worker | v52 | **v53** |

## [2.18] — 2026-05-02

Cette version remplace le filtre de cards basique par un **véritable moteur de recherche full-text** sur les 109 fiches.

### Le problème — diagnostic chiffré

L'ancien filtre `filterFiches()` (12 lignes, substring sur `title + desc + data-keywords`) indexait **18 KB de texte = 0,46 % du contenu réel des fiches** (3,9 MB). Sur un panel de 26 requêtes typiques, environ **38 % de hits seulement** :

| Type de requête | Avant | Après |
|---|---|---|
| `RAM`, `MFT`, `EXIF`, `Volatility` | ✅ | ✅ |
| `mémoire vive` (synonyme RAM) | ❌ | ✅ |
| `forensique mobile` / `forensic mobile` | ❌ | ✅ |
| `comment trouver les fichiers cachés ?` | ❌ | ✅ |
| `EXIF metadata` (multi-mots) | ❌ | ✅ |
| `Ed Skoudis` (auteur dans le contenu) | ❌ | ✅ |
| `ip link` (commande Linux) | ❌ | ✅ |
| `4624 type 10` (Event ID) | ❌ | ✅ |
| `volatlity` (faute de frappe) | ❌ | ✅ |
| `Volátility` (accent anormal) | ❌ | ✅ |

### Ajouté — Moteur de recherche v2 (4 niveaux)

#### N1 — Tokenization, accents, synonymes (`js/components/fiche-search.js` v2, 466 L)

- **Normalisation** : lowercase + suppression accents NFD + ponctuation → recherche stable quelle que soit la casse ou les diacritiques.
- **Tokenization** : split en mots, filtre stopwords FR + EN (~80 termes incluant les mots interrogatifs `comment`, `pourquoi`, `what`, `why`…) → permet de **poser des questions** sans dégrader la recherche.
- **Synonymes bidirectionnels FR ↔ EN** (~50 entrées) :
  - `ram ↔ mémoire ↔ memory ↔ vive`
  - `browser ↔ navigateur`
  - `forensique ↔ forensic ↔ forensics`
  - `carving ↔ récupérer ↔ recover ↔ supprimés ↔ deleted`
  - `registre ↔ registry`, `chiffrement ↔ encryption ↔ crypto`
  - `mobile ↔ smartphone ↔ téléphone ↔ phone ↔ ios ↔ android`
  - … etc.
- **Tous les tokens doivent matcher** (AND) : recherche multi-mots dans le désordre.

#### N2 — Indexation full-text du contenu réel (`scripts/build_search_index.py`, 218 L → `data/search-index.json`, 581 KB)

Script Python qui parse les 109 fiches et extrait :

- **Titre** (`<h1>`)
- **Sections** (`<h2>` + `<div class="sec-title">` — 875 sections au total)
- **Commandes** (`<div class="cli">` avec extraction par balance des `<div>` imbriqués — 38 blocs)
- **Termes** (`<code>`, `<strong>` — 6622 termes)
- **Texte des paragraphes** (limité à 400 chars/section pour économiser bande passante)

L'index pèse **581 KB** non compressé (~80-120 KB gzippé côté serveur GitHub Pages).

#### N3 — Scoring intelligent + fuzzy

- **Pondération par champ** : title=10, sectionTitle=5, command=4, term=3, desc=2, body=1
- **Bonus mot entier** (vs sous-chaîne) : +5
- **Bonus tous les tokens dans la même section** : ×2
- **Bonus tous les tokens matchent quelque part** : ×1.5
- **Fuzzy fallback Levenshtein** (distance ≤ min(2, len/3)) : trouve `volatlity` → `volatility`, `réseaau` → `réseau`, etc.
- **Tri par score décroissant**, retourne top 20 résultats avec extraits surlignés.
- **Pas de dépendance externe** (pas de Fuse.js) : ~5 KB de code search inhouse vs 30 KB de lib.

#### N5 — Modal Cmd+K global (`js/components/search-modal.js`, 508 L)

Recherche cross-fiches accessible **depuis n'importe quelle page** (118 pages) :

- **Trigger** : `⌘K` (Mac) / `Ctrl+K` (Windows/Linux), ou bouton FAB 🔍 bottom-right.
- **Modal centré** (max-width 680px, max-height 70vh, backdrop blur).
- **Recherche live** (debounce 100ms).
- **Résultats** : icône + titre fiche + section pertinente + extrait surligné (`<mark>`) + score.
- **Navigation clavier** : ↑↓ navigue, Enter ouvre, Esc ferme.
- **Recherches récentes** (5 max) en localStorage `cas-in-search-recent`.
- **Deep-linking** : si la section a un `id`, le lien ouvre directement à l'ancre (`fiche.html#section-id`).
- **Cohérent dark/light** via `[data-theme="light"]` selectors.

### Tests runtime

Sur un panel de **20 requêtes représentatives**, toutes retournent les bonnes fiches avec scores et snippets pertinents :

```
"RAM"                           → Acquisition Mémoire RAM (160), Mémoire Internals (139), Volatility (78)
"mémoire vive"                  → mêmes résultats (synonymes)
"comment analyser une RAM ?"    → Acquisition Mémoire (61) [stopwords filtrés]
"volatlity" (faute)             → Volatility 3 (4.5) [fuzzy match]
"Ed Skoudis"                    → cmd_windows › Intrusion Discovery (46.5)
"ip link"                       → cmd_linux › Réseau (79.5)
"4624 type 10"                  → lateral_movement › RDP (129), logs_windows (90)
"EXIF metadata"                 → Métadonnées Avancées (249)
"récupérer fichiers supprimés"  → Data Carving (249)
"forensic mobile"               → Mobile Forensics (195) [synonymes EN↔FR]
"WhatsApp database"             → Messagerie IM (91), SQLite Internals (61)
"NTFS MFT"                      → NTFS (184), ReFS (64), MAC Times (52)
"comment trouver les processus malveillants" → cmd_linux + Mémoire + cmd_windows
```

### Ajouté

- `js/components/fiche-search.js` (466 L, 17 KB) — moteur de recherche v2.
- `js/components/search-modal.js` (508 L, 18 KB) — modal Cmd+K.
- `scripts/build_search_index.py` (218 L) — générateur d'index full-text.
- `data/search-index.json` (581 KB) — index pré-calculé des 109 fiches × 875 sections.

### Modifié

- `fiches/index.html` — chargement des 2 nouveaux scripts ; ancien `filterFiches()` conservé en fallback minimal.
- 117 autres pages HTML (109 fiches + 8 pages racine) — chargement des 2 scripts via `<script defer>`.
- `sw.js` v51 → v52 — ajout des 3 nouveaux assets aux STATIC_ASSETS pour cache offline.

### À noter

- L'index est **pré-calculé à la build** (run manuel de `python3 scripts/build_search_index.py`) : pas de coût CPU côté navigateur.
- L'index est **chargé une seule fois** au boot via fetch + pré-normalisé en mémoire pour des recherches très rapides.
- Les `data-keywords` des cards (générés par `build_index.py`) restent utilisés en fallback côté page d'index.

---

## [2.17] — 2026-05-02

Cette version finalise le **mode dark/light** sur l'ensemble du site et règle quelques entrées orphelines du manifest.

### Modifié — Mode light propagé dans les 7 CSS qui en manquaient

Avant : seul `style/style.css` avait des règles `[data-theme="light"]` (28 sélecteurs). Le toggle fonctionnait mais 90 % de l'UI restait en mode sombre car les CSS spécifiques (`fiche_style.css`, `landing.css`, etc.) redéfinissent `:root` localement, écrasant les overrides.

Après : ajout de blocs `[data-theme="light"]` dans tous les CSS principaux :

| CSS | Sélecteurs light ajoutés | Variables override |
|---|---|---|
| `style/fiche_style.css` | 47 | --bg, --surface, --surface2, --border, --text, --muted, --dim, --cyan, --gold, --red, --green, --blue, --orange, --purple |
| `style/landing.css` | 14 | --bg, --surface, --surface2, --border, --text, --green, --green-mid, --cyan, --gold, --red |
| `style/quiz.css` | 13 | + --share-purple, --cyan-soft-bg, --gold-soft-bg, --dim-soft-border |
| `style/scene.css` | 11 | + --easy/medium/hard/expert, --scene-glow, --atm-glow-1/2 |
| `style/tp.css` | 10 | core vars |
| `style/profile.css` | 10 | héritage depuis landing.css (load order) |
| `style/tools.css` | 4 | héritage depuis style.css |

Total : **137 sélecteurs `[data-theme="light"]`** distribués dans 8 fichiers CSS.

Palette light cohérente : fond `#f7f9fc`, surfaces `#fff`/`#eef2f7`, texte `#1a2235`, accents assombris pour AA contrast (cyan `#008c80`, gold `#b07000`, red `#c0392b`, green `#1a7a4a`).

### Ajouté — 3 fiches orphelines intégrées au manifest

Découvertes lors de l'audit : `docker_kubernetes_forensique.html`, `fat32.html`, `lateral_movement_forensique.html` existaient mais n'étaient pas dans `data/manifest.json` → tombaient en fallback HTML lors du build d'index. Ajoutées avec catégorie/icône/desc appropriés.

Manifest : 106 → 109 fiches.

### Service Worker

`v50 → v51`. Cache invalidé pour récupérer les CSS modifiées.

---

## [2.17] — 2026-05-02

Session « tout faire » : 5 chantiers en parallèle. Refactor SQLite + nouvelles fiches Linux/Mobile + mode clair/sombre.

### Phase 1 — Refactor des 2 fiches SQLite

`sqlite_forensique.html` (390L) et `sqlite_forensique_avance.html` (479L) avaient des titres trop similaires. Harmonisation en parcours 2 étapes :

| Avant | Après | Rôle |
|---|---|---|
| SQLite Forensique | **SQLite Forensique — Démarrage** (Étape 1/2) | 🗃️ Pratique |
| SQLite Forensique Avancé | **SQLite Forensique — Internals Avancés** (Étape 2/2) | 🧬 Approfondir |

Bannières cross-référence harmonisées entre les 2.

### Phase 2 — `cmd_windows_forensique.html` enrichi (+113 L)

Nouvelle section « Intrusion Discovery — détecter une compromission en live » inspirée du cheat sheet SANS Ed Skoudis (Windows Intrusion Discovery v3.0). 5 cards :

- **Connexions et sessions SMB inhabituelles** — `net view \\127.0.0.1`, `net session`, `net use`, `nbtstat -S`, `netstat -nao/-naob`, `netsh advfirewall`
- **Persistance — Run / RunOnce / RunonceEx** — 3 clés registre HKLM+HKCU
- **Logs Windows — Event IDs critiques** — tableau 9 IDs (1102, 4624 type 10, 4625, 4672, 4688, 4697, 4698, 4720, 7034-7045)
- **Outils Sysinternals indispensables** — Process Explorer, Process Monitor, Sysmon, Autoruns, PsExec, Process Hacker
- **Performances anormales** — `taskmgr`, `dir C:\`, WER crashes

### Phase 3 — Nouvelle fiche `cmd_linux_forensique.html` (479 L)

Parallèle Linux du cmd_windows. Inspirée du cheat sheet SANS « Linux Intrusion Discovery v2.0 » (Ed Skoudis). 8 sections :

1. **Processus** : `ps auxf`, `lsof -p`, `lsof +L1` (binaires supprimés), comparaison ps/proc
2. **Fichiers** : SUID root, `find -nouser`, fichiers cachés (..., .., .), `debsums -c`, `rpm -Va`
3. **Réseau** : `ss -tulnp`, `ip link grep PROMISC`, cache ARP
4. **Tâches planifiées** : crontab par user, `/etc/cron.d/`, timers systemd, atq
5. **Comptes** : `egrep ':0+:' /etc/passwd`, NSS, comptes shell, mot de passe shadow, last/lastb
6. **Logs** : journalctl, /var/log/auth.log, auditd, ausearch
7. **Performances** : uptime, free, df, iotop, nethogs
8. **Outils** : chkrootkit, rkhunter, AIDE, Tripwire, Lynis, OSSEC/Wazuh, CIS Benchmarks

Workflow 15 min en 7 étapes (parallèle au workflow Windows).

### Phase 4 — Nouvelle fiche `mobile_apps_forensique.html` (637 L)

Catalogue 30+ apps iOS tierces avec leurs paths SQLite/Plist/Realm. Inspiré du poster officiel SANS DFIR « iOS Third-Party Apps Forensics v1.1 » (Mattia Epifani, 2021). Catégories couvertes :

- **Messageries** (14 apps) : WhatsApp, Telegram, Signal, Skype, Viber, LINE, Facebook Messenger, Discord, Wickr Me, Snapchat, TikTok, Instagram, WeChat, Kik
- **Cloud** (5) : Dropbox, Google Drive, OneDrive, Gmail, ProtonMail
- **Voyage** (6) : Uber, Waze, Google Maps, Airbnb, Booking, Air France/KLM
- **Finance** (2) : PayPal, Venmo
- **Social** (5) : Facebook, Twitter/X, LinkedIn, Tinder, Reddit
- **Médias** (3) : Spotify, Netflix, Private Photo Vault
- **Santé** (3) : Fitbit, Strava, Adidas Running

Pour chaque app : path Sandbox `Data/`, path `Shared/AppGroup/` quand applicable, fichiers critiques (⭐), notes forensiques. Section outils : iLEAPP, APOLLO, Cellebrite, Magnet AXIOM, Oxygen, DB Browser, SQLECmd, Realm Studio.

### Phase 5 — Mode clair/sombre toggle

Nouveau thème `[data-theme="light"]` dans `style/style.css` (+85 L) avec palette professionnelle :
- Fond blanc cassé `#f7f9fc`
- Texte presque noir `#1a2235`
- Cyan/Gold/Red/Green/Purple assombris pour AA contrast
- Tags, cards, panels, inputs, scrollbars adaptés
- Code/CLI rendus avec syntax highlighting clair

Composant `js/components/theme-toggle.js` (170 L) :
- **Bouton flottant** bottom-left (☀️/🌙) — ne chevauche pas le FAB notes (bottom-right)
- **Persistence** localStorage (`cas-in-theme`)
- **Boot synchrone** avant render pour éviter FOUC
- **API** `window.CASTheme.{get,set,toggle}` pour intégrations
- **Conserve** les thèmes exotiques existants (hacker/crimson/retro/blueprint)

**118 pages patchées** avec inclusion auto : 110 fiches + 8 pages racine (index/quiz/tp/scene/exam/tools/profile/offline).

### Stats finales v2.17

```
1750 questions · 106 fiches · 93 scènes · 32 TP
SW v49 → v50
```

---

## [2.16] — 2026-05-02

Cette version finalise le « parcours forensique mémoire » et ajoute deux fonctionnalités UX majeures : **CHANGELOG à jour** + **fiche poster Windows** + **système de notes utilisateur** sur fiches.

### Phase 1 — CHANGELOG remis à jour

Les sessions v2.11 → v2.15-bis n'avaient pas été documentées. Cette version rattrape l'arriéré avec entrées détaillées pour chaque palier.

### Phase 2 — Nouvelle fiche `poster_windows_artefacts.html`

Inspirée du **poster officiel SANS FOR500** (Rob Lee), c'est une fiche-matrice qui organise les artéfacts Windows **par question forensique** plutôt que par technologie. CAS-IN avait déjà tous les artéfacts éparpillés dans 18+ fiches — manquait la grille d'entrée :

| Question forensique | Artéfacts couverts |
|---|---|
| Quel programme a été exécuté ? | UserAssist · Shimcache · Amcache · BAM/DAM · SRUM · JumpList · Prefetch · Win10 Timeline |
| Quel fichier a été ouvert ? | Open/Save MRU · Recent · LNK · Office MRU · ShellBags · JumpList · Last-Visited |
| Quel fichier a été supprimé ? | Recycle Bin (XP/Win7+) · ShimCache · WordWheel · Thumbnail · Thumbs.db |
| D'où vient ce fichier ? | Browser History · Downloads · Email Attachments · Skype · ADS Zone.Identifier |
| Quel USB a été branché ? | USBSTOR · setupapi.dev.log · MountPoints2 · Volume Serial · Drive Letter |
| Quelle activité Internet ? | History · Cookies · Cache · Flash LSO · Session Restore · Google Analytics |
| Qui s'est connecté ? | Last Login · RDP · Services · Logon Types · Auth Events |
| Quel réseau ? | Timezone · WLAN Event Log · Network History · SRUM Network |

Chaque cellule = lien direct vers la fiche détaillée. Devient la **fiche d'entrée** pour DFIR Windows.

### Phase 3 — Notes utilisateur sur fiches

Nouvelle fonctionnalité `js/components/fiche-notes.js` : permet d'annoter chaque fiche comme dans un livre papier. Persistence localStorage (`cas-in-notes-{ficheId}`). Markdown supporté. Recherche full-text dans toutes les notes. Export global JSON/Markdown.

### Stats finales v2.16

```
1750 questions · 104 fiches · 93 scènes · 32 TP
SW v48 → v49
```

---

## [2.15-bis] — 2026-05-01

Renforcement du contenu ICS et clarification du parcours « forensique mémoire ».

### Ajouté

- **Scène ICS expert** : `scenes/swissgrid-iec61850-jura.json` — poste électrique 380 kV à Bassecourt JU sous attaque GOOSE forgée. Inspirée d'Industroyer/Industroyer2 (Ukraine 2016/2022). 5 phases couvrant diagnostic GOOSE/SV, IEC 62351-6, doctrine Safety > Security > Forensics, notifications OFCS/MPC/ENTSO-E, plan IEC 62443 SL4. Difficulty: expert.
- **6 edge cases modernes** dans `ram_forensique.html` : Secure Boot + Measured Boot, KASLR, VBS/Credential Guard/HVCI, BitLocker TPM 2.0 + PIN, Hyperviseur type-1 (VMware/Hyper-V/Proxmox), SSD avec auto-encrypt SED + Opal 2.0.

### Modifié — Refactor des 3 fiches mémoire

Avant, les 3 fiches `ram_forensique` (304L) + `volatilite` (460L) + `volatility_memory_forensics` (942L) avaient des titres et descriptions trop similaires. Refactor pour clarifier le rôle de chacune :

| Fiche | Avant | Après | Rôle |
|---|---|---|---|
| `ram_forensique.html` | "RAM Forensique" | **"Acquisition Mémoire RAM"** (Étape 1/3) | 📥 Capturer |
| `volatilite.html` | "Volatility & RAM" | **"Volatility 3 — Démarrage"** (Étape 2/3) | 🚀 Premiers pas |
| `volatility_memory_forensics.html` | "Volatility & Memory Forensics" | **"Mémoire — Internals Avancés"** (Étape 3/3) | 🧬 Approfondir |

Bannières de cross-référence harmonisées entre les 3 fiches. H1 + title + meta description + breadcrumb tous alignés.

### Service Worker

`v46 → v48`. Cache invalidé pour les 3 fiches mémoire modifiées.

---

## [2.15] — 2026-05-01

Trois nouvelles fiches forensiques basées sur les cheat sheets officielles SANS, plus enrichissement de `zimmerman.html`.

### Ajouté

- **`fiches/ics_forensique.html`** (392 L) — ICS/SCADA Forensique : modèle Purdue (5 niveaux SVG), 6 protocoles industriels (Modbus/DNP3/IEC 61850/OPC-UA/EtherNet-IP/S7comm) avec ports + tshark filters, NSM ICS (SPAN vs TAP fail-open), 3 règles Suricata pédagogiques, IR Jump Bag complet, spécificités suisses (LSI art. 73-78, OFCS, IIC, délai 24h). Inspiré du cheat sheet SANS « Industrial Network Security Monitoring & Incident Response ».
- **`fiches/cmd_windows_forensique.html`** (397 L) — Live Response Windows : tasklist (`/v` `/m` `/svc`), sc query/qc, wmic (alias/where/verb), reg (clés persistance prioritaires), netstat -nao, netsh (firewall/DNS hijack/WiFi keys), boucles `for /L` et `/F`. Workflow live response 15 min en 4 phases. Justification du choix de cmd.exe vs PowerShell en environnement durci. Inspiré du cheat sheet SANS « Windows Command Line Cheat Sheet » (Ed Skoudis).
- **`fiches/magic_bytes_signatures.html`** (353 L) — File Signatures : tableau de 23 magic bytes principaux (PNG/JPEG/ZIP/PDF/EXE/ELF/etc.), cas spéciaux à offset non-zéro (NTFS @ 0x03, EXT4 @ 0x438, HFS+ @ 0x400, GPT @ 0x200), 6 outils (file/xxd/binwalk/photorec/trid/PowerShell), 12 regex forensiques (IP/email/hashes/base64/GUID/BTC), combos bash (grep/awk/sed/sort/uniq), `findstr` Windows. Lien direct vers `tp.html#magic`. Inspiré du cheat sheet SANS « Hex and Regex Forensics ».
- **Section `bstrings`** dans `fiches/zimmerman.html` (+72 L) : usage de base, `--ls`/`--lr`/`--off`/`--cp`/`--fr`/`--fs`, built-in patterns regex (email/ipv4/cc/ssn/guid), 5 cas d'usage forensiques. Inspiré du cheat sheet SANS « Eric Zimmerman's Tools ».

### Modifié

- `data/manifest.json` : 100 → 103 fiches, entrées triées par catégorie + alphabétique.
- `data/counts.json` : régénéré (fiches: 100 → 103).
- `fiches/index.html` : régénéré via `scripts/build_index.py` pour intégrer les nouvelles fiches.
- `sw.js` : v45 → v46, cache invalidé.

---

## [2.14] — 2026-05-01

Extensions pédagogiques des TP + refactor pollution globale.

### Ajouté — Extensions TP forensiques

- **`genHexDump`** : 10 → 13 scénarios. Ajout HFS+ Volume Header (BE @ 0x000), exFAT VolumeSerialNumber (LE @ 0x064), GPT Primary Header NumberOfPartitionEntries (LE @ 0x250).
- **`genFSIdentify`** : EXT4 buffer étendu 64 → 128 octets pour inclure UUID superblock @ 0x68.
- **`genHashIdentify`** : 6 → 7 sous-types. Nouveau sous-type "Détection collision MD5" : 3 paires de fichiers (Word/JPG/EXE) avec MD5 identique mais SHA-1 et SHA-256 différents — apprend à reconnaître le piège forensique. Référence Wang & Yu 2005, Stevens et al. 2008, Flame malware 2012.
- **`genRunList`** : décodage simple → décodage + classification. Nouveau sous-type QCM (~30%) : identifier dense vs sparse vs compressée (LZNT1) à partir d'une RunList NTFS.

### Modifié — Refactor pollution globale `quiz-app.js`

Audit révèle que sur les "663 vars top-level" suspectées, seules **14 `let _privé`** étaient réellement à problème. Regroupement dans namespace `_qz = { ... }` :

```js
const _qz = {
  qRenderTime: 0, loadMsgInt: null, lastRankCloseNotif: 0,
  toastTimers: {}, focusMode: false, forensicShown: false,
  konamiPos: 0, godMode: false, godModeTimer: null,
  dorActive: false, dorSessionScore: 0, bilanShareOpen: false,
  bilanShareDrawn: false, ac: null,
};
```

61 occurrences mises à jour automatiquement. 14 commentaires de traçabilité conservés. Pas de risque de régression : ces vars avaient un usage strictement local.

Les autres top-level (`bossState`, `S`, `ALL_Q`, `EX`, `RANKS`) sont conservés tels quels — ce sont des objets de state légitimes dont la consolidation aurait juste compliqué le débogage.

### Service Worker

`v45 → v46`.

### Tests

`135/135 OK` sur les 27 générateurs TP × 5 itérations. Tests `genHexDump` 65/65, `genHashIdentify` 70/70, `genFSIdentify` 70/70, `genRunList` 100/100.

---

## [2.13] — 2026-04-30

Split de `quiz-app.js` + tests de cohérence + enrichissement SM-2.

### Ajouté

- **`js/pages/quiz-data.js`** (1562 L / 111 KB) : 17 constantes extraites de `quiz-app.js` (RANKS, MILESTONES, GLOSSARY, CHEATSHEETS, FEEDBACK_OK/KO, FORENSIC_QUOTES/TIPS, PERSONAS, LOADING_MSGS, AVATAR_EMOJIS, KONAMI, MID_TIPS, CHAPTER_TO_THEME_FILE, SCENES, MISSION_PHASES, VISUAL_THEMES). Module séparé pour alléger le caching et la maintenance.
- **`tests/test-achievements-sync.js`** : détecte la désynchronisation entre `ACHIEVEMENTS` (quiz-app.js) et `QUIZ_ACH` (cas-in-achievements.js). Tolère 14 abréviations de descriptions. Fix : harmonisation du nom 'hint'.
- **SM-2 enhancements** : `updateSM2()` retourne `{interval, reps, ef}` pour feedback UX. Toast "🃏 Prochaine révision dans X jours". Nouvelles fonctions `getSM2Stats()` et `resetSM2()` (avec confirm). Widget stats SM-2 dans `profile.html` + `js/profile/profile-page.js` + `style/profile.css`.

### Modifié

- `js/pages/quiz-app.js` : 6630 → 5183 lignes (-22%, -115 KB).
- `ACHIEVEMENTS` reste dans `quiz-app.js` (dépendances runtime via `check: s => ...`), pas extrait dans quiz-data.js.

### Service Worker

`v43 → v45`. v44 : retrait de `track-theme.css` et `fiche-hub.css` orphelins de STATIC_ASSETS (404 au précache). v45 : ajout de `quiz-data.js`.

---

## [2.12] — 2026-04-30

Split de `tp-engine.js` en 3 modules.

### Ajouté

- **`tp/tp-engine-windows.js`** (1293 L) : générateurs Registry / Prefetch / LNK extraits.
- **`tp/tp-engine-meta.js`** (412 L) : générateurs Droit / Glossaire / Email / IR / Network extraits.

### Modifié

- `tp/tp-engine.js` : 8030 → 6429 lignes.
- Chaque module patche le dispatcher `GENERATORS` après sa propre définition.
- `tp.html` : balises `<script>` mises à jour pour précharger les 3 modules dans l'ordre.

### Service Worker

`v42 → v43`. Ajout des 2 nouveaux modules au précache.

---

## [2.11] — 2026-04-30

Restructuration des fichiers à la racine pour réduire la pollution.

### Modifié — Réorganisation

| Avant (racine) | Après |
|---|---|
| `ARCHITECTURE.md` | `docs/ARCHITECTURE.md` |
| `CHANGELOG.md` | `docs/CHANGELOG.md` |
| `test-cas-in.js` | `tests/test-cas-in.js` |
| `counts.json` | `data/counts.json` |
| `manifest.json` | `data/manifest.json` |
| `questions.json` | `data/questions.json` |

### Modifié — 14 fichiers patchés

Tous les chemins mis à jour : `sw.js`, `quiz-app.js`, `exam-app.js`, `js/pages/search.js`, `js/components/counts.js`, `scripts/generate_counts.py`, `scripts/build_index.py`, `scripts/sync_fiches_index.py`, `scripts/check_questions.py`, `exam.html`, `.github/workflows/audit-repo.yml`, `.github/workflows/check-questions.yml`, et le tree dans `README.md`.

### Service Worker

`v41 → v42`. Cache invalidé pour forcer re-précache des nouveaux chemins.

---

## [2.10] — 2026-04-30

Refactor structurel en 4 phases. Aucun changement fonctionnel pour l'utilisateur final hormis la correction de bugs UX listés en Phase 1. Ouverture d'`ARCHITECTURE.md` à la racine.

### Phase 0 — Resync `fiches/index.html` (correctif)

`fiches/index.html` était rédigé à la main et avait dérivé par rapport à `manifest.json` :
- **73 fiches sur 95** avec une icône divergente (le HTML utilisait souvent 📄 alors que le manifest avait une icône thématique : 🌍, 🧅, 🤖, ☁️, 🪟, 🔐, etc.).
- **27 fiches** avec `data-keywords=""` → invisibles à la recherche par mots-clés.
- **27 fiches** avec `<div class="fiche-desc"></div>` vide.

Nouveau script **`scripts/sync_fiches_index.py`** : utilise `manifest.json` comme source de vérité, applique les icônes correctes aux cards, reconstruit les descriptions et `data-keywords` manquants. Idempotent — peut être relancé après chaque ajout de fiche.

3 icônes par défaut restantes dans `manifest.json` (`rapport_forensique`, `linux_forensique`, `macos_forensique`) thématisées en `📋`, `🐧`, `🍏`.

État final : **95 cards, 0 keyword vide, 0 description vide, 0 icône générique**. La recherche globale Ctrl+K trouve maintenant chaque fiche par ses mots-clés.

À ajouter au flow CI : exécuter `python3 scripts/sync_fiches_index.py` après toute édition de `manifest.json`, comme on le fait déjà pour `generate_counts.py`.

### Phase 1 — Bugs UX

- **`quiz.html` · daily-banner persistant** : le bouton ✕ utilisait `style.display='none'` sans persistence → la bannière revenait à chaque rechargement. Désormais `dismissDailyBanner()` (dans `quiz-ui-patch.js` ligne 632+) écrit `dailyBannerDismissed = today ISO` en localStorage, et masque automatiquement au boot si déjà fermé aujourd'hui.
- **`quiz.html` · `#fz-badge` valeur en dur** : le HTML contenait `<span id="fz-badge">1</span>`, donc avant que `quiz-app.js` ne tourne, l'utilisateur voyait « 1 freeze » même avec 0. Maintenant le span est vide et `updateFreezeBtn()` met `''` quand `S.streakFreezes === 0`, masqué via CSS `:empty`.
- **`quiz.html` · titre du `#streak-display` incohérent avec la donnée** : le `title` disait « Série quotidienne » mais `updateStreakDisplay()` y plaçait `S.streak` (série de bonnes réponses du quiz courant). Titre corrigé en « Série de bonnes réponses (session) ».
- **`quiz.html` / `scene.html` / `tp.html` · ordre de chargement des scripts non documenté** : ajout d'un commentaire `<!-- ⚠ ORDRE CRITIQUE — ne pas réordonner -->` au-dessus des `<script defer>` dépendant de `window.Profile`. Voir `ARCHITECTURE.md` § « Couches & ordre de chargement ».

### Phase 2 — Suppression scores doublons

Le rang/XP/streak quotidien étaient affichés à 5 endroits : `index.html` drawer, `profile.html` hero, `quiz.html#xp-wrap`, `scene.html#grade-mini` + `#grade-card`, et `profile-banner` transversal. Trois rendus différents avec **trois systèmes de seuils** (`RANKS` quiz-app, `GRADES` scene-app, `Profile.TRACKS.ranks`) → l'utilisateur pouvait voir des rangs incohérents selon la page.

- **`quiz.html`** : retrait de `#xp-wrap` (anneau XP + rang local + streak local + freeze) et `#avatar-chip`. Info redondante avec `profile-banner`. Le bouton 🧊 « Streak Freeze » est déplacé dans le menu ⋯ avec une pill inline (CSS `:empty` pour masquer quand 0). « Modifier profil » ajouté également au menu ⋯ pour préserver l'accès à `openAvatarSetup()`.
- **`scene.html`** : retrait de `#grade-badge-mini` du header. Un nouveau bouton 🏅 prend sa place pour préserver l'accès à `openBadgesPanel()`. Le `#grade-card` du lobby est conservé (élément narratif important sur l'écran d'accueil simulation, à recâbler en Phase 5 sur `Profile.getRank()`).
- **`quiz-app.js#updateXpBar()`** et **`scene-app.js#updateGradeDisplay()`** : ajout de guards `if (el)` sur chaque accès DOM (les fonctions continuent d'être appelées par les call-sites mais ne plantent plus si l'élément a été retiré).
- **`style/quiz.css#fz-badge`** : repositionné de l'ancien overlay corner vers une pill inline pour le menu ⋯, masqué via `:empty`.

### Phase 3 — Extraction des `<style>` inline

Les pages avaient leur CSS inline dans `<style>…</style>`, ce qui :
- empêchait la mise en cache séparée du CSS,
- gonflait chaque GET HTML,
- bloquait toute CSP `style-src` stricte.

| Page         | Avant (`<style>` inline) | Après (HTML)   | Nouveau CSS              |
|--------------|--------------------------|----------------|--------------------------|
| `scene.html` | 87 KB                    | 23 KB          | `style/scene.css` 64 KB   |
| `tp.html`    | 39 KB                    | 28 KB          | `style/tp-page.css` 11 KB |
| `tools.html` | 33 KB                    | 27 KB          | `style/tools.css` 6 KB    |
| `exam.html`  | 23 KB                    | 11 KB          | `style/exam.css` 12 KB    |

Note : `style/tp.css` existait déjà pour le moteur d'exercices TP — le nouveau `style/tp-page.css` couvre uniquement le chrome de `tp.html`.

### Phase 4 — Réorganisation `js/`

Le dossier `js/` plat de 21 fichiers est réorganisé en 4 sous-dossiers reflétant les couches d'architecture :

```
js/
├── core/        cas-in-profile.js, cas-in-counts.js, cas-in-export.js,
│                cas-in-pwa.js, cas-in-search.js
├── profile/     profile-banner.js, profile-page.js, profile-track-v5.js
├── bridges/     quiz-profile-bridge.js, scene-profile-bridge.js,
│                tp-profile-bridge.js
└── pages/       landing.js, landing-3d.js, quiz-app.js, quiz-ui-patch.js,
                 scene-app.js, scene-engine-v4.js, scene-lobby-v3.js,
                 scene-ux-patch.js, exam-app.js, tools-app.js
```

- **38 références `<script src="js/X.js">`** mises à jour dans 7 HTMLs.
- **`sw.js` v30 → v31** : `STATIC_ASSETS` regénéré avec les nouveaux chemins, regroupé par couche avec commentaires explicatifs.
- **`ARCHITECTURE.md`** créé à la racine, ~7 KB, documente la stack en 4 couches, l'ordre de chargement obligatoire, le mapping des clés localStorage, et la dette technique restante (sharding `questions.json`, élimination de `bridges/`, unification des rangs, fusion des achievements).

### Future work documenté (non exécuté)

Voir `ARCHITECTURE.md` § « Future work » pour les chantiers identifiés mais non touchés en v2.10 :
- Sharding `questions.json` (2.5 MB monolithique) sur le modèle de `scenes/index.json + lazy fetch`.
- **Phase 5 : élimination du proxy `Storage.prototype` des `bridges/`** par refactor de `quiz-app.js` / `scene-app.js` pour appeler `Profile.addXp()` directement. Préalable : audit des achievements liés aux seuils legacy.
- **Unification `RANKS` / `GRADES` / `Profile.TRACKS.ranks`** sur `Profile.getRank()` unique. Migration `casIn_profile` v=2 → v=3 nécessaire pour ré-aligner les seuils débloqués historiquement.
- Fusion `quiz-app.js#ACHIEVEMENTS` + `scene-app.js#GLOBAL_BADGES` + `Profile.achievements` dans un futur `js/core/cas-in-achievements.js`.
- Performance `profile-banner.js` : passer du `innerHTML=…` complet à des updates ciblés `textContent`.

## [2.9] — 2026-04-29

### 📚 Nouveau — Extension du corpus des fiches

#### 3 nouvelles fiches forensique (~30 KB chacune)

- **`ios_forensique.html`** — iOS forensique opérationnel : états AFU/BFU, méthodes d'acquisition par génération SoC (A7-A11 checkm8, A12+ Cellebrite Premium, A16+ logical), comparatif des outils commerciaux (Cellebrite UFED/Premium, GrayKey, Magnet AXIOM, Oxygen, iLEAPP), artefacts clés (sms.db, CallHistory, knowledgeC.db, Photos, Safari, Mail, Notes, Health, Locations, WhatsApp/Telegram/Signal), deep-dive sur knowledgeC.db avec exemple SQL et conversion Mac Absolute Time, classes de protection Keychain, voies d'accès iCloud Backup (MLAT, Apple ID, token), Advanced Data Protection E2EE iOS 16.2+, impact du Lockdown Mode iOS 16+, workflow d'acquisition en 5 étapes, cadre juridique suisse (art. 263/248/269/282 CPP, art. 67 EIMP, art. 22 LPD).

- **`android_forensique.html`** — Android forensique : différences FBE vs FDE et metadata encryption Android 11+, 5 niveaux d'acquisition (Manual/Logical/File System/Physical/Chip-off), exploits SoC (Qualcomm EDL, MediaTek BROM via mtkclient, risques Knox tripping Samsung), workflow ADB complet avec exemples de commandes, artefacts clés (accounts.db, contacts2.db, mmssms.db, WhatsApp msgstore.db, Telegram cache4.db, Signal SQLCipher, Chrome, Gmail, Maps, WifiConfigStore.xml en clair), deep-dive usagestats (équivalent Android du knowledgeC.db avec sous-dossiers daily/weekly/monthly/yearly), Knox & Secure Folder, TWRP & custom recovery (risques de wipe sur bootloader unlock), comparatif outils commerciaux (Cellebrite UFED/Premium, Magnet AXIOM, Oxygen, MOBILedit, ALEAPP, Andriller), workflow en 4 étapes, cadre juridique suisse (art. 263/248/269/269bis CPP, art. 22 LPD).

- **`m365_forensique.html`** — Microsoft 365 forensique cloud : panorama des sources de logs (Azure AD, Exchange Online, SharePoint, OneDrive, Teams, Defender, Purview), Unified Audit Log (UAL) avec exemples PowerShell complets, MailItemsAccessed pour BEC investigation (différenciation Bind vs Sync, lecture des résultats JSON), Azure AD Sign-ins (sign-in logs, audit logs, risk events, provisioning logs), eDiscovery & Purview (Content Search, eDiscovery Standard/Premium), playbook de 3 attaques typiques (BEC, token theft via Evilginx, apps OAuth malicieuses), Microsoft Graph API pour collecte programmatique, Defender XDR & Sentinel avec exemples KQL, 7 pièges récurrents (UAL non activé, MailItemsAccessed E5-only, suppression rapide des règles, désync timestamps, pagination 5000 résultats), workflow Suisse typique en cas de BEC (plainte CP 146/143, réquisition CPP 265, EIMP via OFJ).

### 🔧 Corrections — Métadonnées du manifest

`manifest.json` : correction des **26 fiches** marquées `"desc": "(à compléter)"` qui sont en réalité **bien remplies** (20-58 KB chacune). 22 descriptions ont été curées à la main pour refléter le contenu réel, 4 ont été extraites automatiquement depuis les `<meta description>`/sous-titres des fiches.

Fiches corrigées : `algorithmes_forensique`, `browser_artifacts_deep_dive`, `dns_forensique`, `dns_forensique_avance`, `documents_office_forensique`, `email_headers_smtp_forensique`, `expert_witness_ch`, `f2fs`, `log_forensique_avance`, `lscpt`, `mathematiques_forensique`, `metadata_avancees`, `mitre_attack`, `network_traffic_analysis_avance`, `pdf_forensique_avance`, `powershell_forensique`, `refs`, `reverse_engineering_101`, `sqlite_forensique_avance`, `sysmon`, `threat_intel_ioc`, `tls_https_certificate_forensique`, `usb_removable_media_forensique`, `volatility_memory_forensics`, `windows_registry_forensique_avance`, `yara`.

Conséquence visible : la recherche globale `Ctrl+K` retourne maintenant des résultats pertinents pour ces 26 fiches au lieu d'afficher "(à compléter)".

### 📊 Compteurs

- `manifest.json` : 92 → 95 fiches
- `counts.json` : `fiches: 92 → 95`
- `fiches/index.html` : 92 → 95 cartes
- `sw.js` : v29 → v30, +3 fiches dans STATIC_ASSETS

### 🎯 Couverture finale du corpus (95 fiches)

| Catégorie | Avant | Après | Notes |
|---|---|---|---|
| Systèmes de fichiers | 13 | 13 | NTFS, FAT, exFAT, EXT, APFS, HFS+, ReFS, F2FS |
| Acquisition & méthodes | 19 | 19 | KAPE, Velociraptor, Autopsy, X-Ways, Volatility, Plaso, Zimmerman |
| Windows | 12 | 12 | Registry, Event Logs, ShellBags, AD, PowerShell, Sysmon, WSL |
| Cryptologie & sécurité | 15 | 15 | Hashing, PKI, Stegano, MITRE ATT&CK, YARA, Threat Intel, RE |
| Réseaux | 14 | 14 | Wireshark, DNS, Email, SQLite, Tor, OSINT, SIEM |
| Plateformes & Cloud | 10 | **13** | +iOS, +Android, +M365 ⭐ |
| Droit suisse | 9 | 9 | CPP, LPD, EIMP, LSCPT, autorités, expert witness |

Le corpus couvre désormais en profondeur la **forensique mobile** (iOS + Android) et la **forensique cloud Microsoft** — sujets qui représentent ensemble ~70% des enquêtes modernes en Suisse romande.

## [2.8] — 2026-04-29

### 🚀 Nouveau — Patches modulaires v3 / v4 / v5

#### Lobby UX v3 (`js/scene-lobby-v3.js`, 949 lignes)
- **13 parcours pédagogiques** curated couvrant 88/90 scénarios (Fondamentaux, Procédure pénale, Ransomware A→Z, IA & deepfakes, Coopération internationale, Darknet, Infrastructures critiques, Cas 2024-2026, Forensique avancée, Social engineering, Fuites de données, Cas humains, Sécurité d'État).
- **Bouton « Continuer »** : carte épinglée en haut du lobby si un scénario est en cours (étape X/Y, temps relatif). Tracking via `cas_inflight` localStorage, hooks sur `startScene`/`showReport`, polling 2s sur `stepIdx`.
- **Tri configurable** : recommandé / difficulté ↑↓ / récents / à reprendre (≤80%).
- **7 chips d'atmosphère** : Légal, Réseau, Ransomware, Crypto, Hôpital, État, Terrain — cumulables avec les filtres existants.
- **8 nouveaux badges de découverte** (push sur `GLOBAL_BADGES`) : Explorateur d'atmosphères, Maître des atmosphères, Premier Parcours, Érudit DFIR, Maître des Parcours, Spécialiste romand, Chasseur d'affaires réelles, Grimpeur.

#### Scene Engine v4 (`js/scene-engine-v4.js`, 1146 lignes)
- **Briefing repensé** : fiche d'identité (durée estimée, décisions, niveau, atmosphère, articles centraux extraits de `legalRefs`), objectifs visibles (gère format string ET object), pré-warning automatique pour les scénarios sensibles (mineur, suicide, pédocriminalité, harcèlement…).
- **Récap exportable** : trois nouveaux boutons sur l'écran rapport — `📑 Exporter MD` (télécharge un `.md` daté), `📋 Copier` (presse-papiers), `📖 Réviser`. Format markdown complet : toutes les options marquées (👉 = choisie, ✓/✗/🚨 = qualité), feedback complet, références juridiques.
- **Mode révision** : rejoue le scénario complété en mode étude. Toutes les options annotées dès l'affichage (✓/✗, points, feedback, ref. légale), pas de scoring, pas de timer, pas de sauvegarde. Bandeau violet, sortie possible à tout moment.
- **Glossaire des articles de loi** : tooltip click-to-expand sur "art. X CPP/CP/CC/...". 127 entrées documentées (CPP, CP, CC, EIMP, Cst, CEDH, PPMin, LB, LFINMA, LPD, LPers, LMP, LParl), couverture 92% des occurrences du corpus. Lien vers fiche HTML correspondante quand pertinente.

#### Profile Track v5 (`js/profile-track-v5.js`, 1212 lignes)
- **Sélecteur enrichi** : chaque carte de rôle montre la mini-timeline des 12 rangs (avec emojis), la voie en mini-paragraphe, les 3 forces clés, et un cas typique. Hover sur emoji = nom du rang en tooltip.
- **Mini-test d'orientation** : bouton "🎯 Trouver mon rôle" → 4 questions courtes → recommandation argumentée (gère égalités). Bouton "Choisir au feeling" toujours accessible.
- **Banner thématisé** : couleur liée au track (cyan/orange/vert/rouge), emoji du rang en plus grand avec drop-shadow, sous-titre du rôle ajouté. Visible sur scene/quiz/tp.
- **Promotions célébrées** : détection via `Profile.onChange()`, toast plein écran 5s avec emoji animé pulse, sweep doré conique en arrière-plan, son discret WebAudio (3 notes C5-E5-G5), vibration mobile. File d'attente pour gros gains XP qui déclenchent plusieurs promotions en cascade.

### 🛠 Service Worker v29

`sw.js` : ajout des **14 fichiers JS/CSS manquants** dans `STATIC_ASSETS` :
- 11 JS : `cas-in-profile.js`, `landing-3d.js`, `profile-banner.js`, `profile-page.js`, `profile-track-v5.js`, `quiz-profile-bridge.js`, `quiz-ui-patch.js`, `scene-engine-v4.js`, `scene-lobby-v3.js`, `scene-profile-bridge.js`, `tp-profile-bridge.js`
- 3 CSS : `profile-banner.css`, `profile.css`, `quiz.css`

Ces fichiers fonctionnaient online (cache-first avec fallback fetch) mais **n'étaient pas pré-cachés** lors de l'install/update du SW. Conséquence : install PWA fraîche en mode offline → 503 sur ces fichiers, app cassée. Le bump `v28 → v29` force le re-cache complet.

### 🐛 Corrections

#### Manifest fiches incomplet
- **`manifest.json`** : ajout de `linux_forensique.html` et `macos_forensique.html` (2 fiches présentes sur disque, liées depuis `fiches/index.html`, mais absentes du manifest). Catégorie `plateformes`.
- **`counts.json`** : régénéré, `fiches: 90 → 92`.

#### Bug PWA links sur 3 HTMLs
- `index.html`, `quiz.html`, `profile.html` : `<link rel="manifest" href="manifest.json">` → `<link rel="manifest" href="pwa.manifest.json">`. Le premier était l'index des fiches, pas le manifest PWA W3C.

#### Suppressions
- `scenes.js` (1.67 MB legacy) : confirmé supprimé. Le CHANGELOG [2.6] le prévoyait.
- 3 brouillons `scenes/*.js` (competence_mpc_vs, deepfake_electoral, hydro_valais) : supprimés. Pendants `.json` actifs.

### 🧹 Optimisations

- **`index.html`** : retrait de `profile-track-v5.js` (44 KB chargés pour rien — la landing n'a pas de banner).
- **`scripts/generate_counts.py`** : refonte de `count_scenes()` pour lire `scenes/index.json` (source de vérité depuis le refactor v3.0) au lieu de chercher l'ancien `scenes.js`. Avant : retournait `0`. Maintenant : retourne `90`.
- **`manifest.json`** : `$comment` enrichi avec un avertissement explicite "ce fichier N'EST PAS le manifest PWA — voir pwa.manifest.json" pour éviter la confusion future.

### 📝 Documentation

- **`README.md`** : mises à jour de cohérence — `64 scénarios` → `90`, `1630 questions` → `1750`, `90 fiches` → `92`, suppression mention `scenes.js`, ajout d'une section "Patches modulaires (lazy plugins)" décrivant les couches v3/v4/v5, version SW dans le tableau PWA `v21` → `v29`, ajout du dossier `scenes/` dans l'arborescence.

### Architecture cumulative finale

5 couches indépendantes empilables :

| Couche | Lignes | Rôle |
|---|---|---|
| `scene-app.js` | 3009 | Noyau scènes (intouché) |
| `cas-in-profile.js` | 682 | Système de profil unifié (4 tracks × 12 rangs) |
| `scene-ux-patch.js` | 868 | UX v2 (timers, médailles, atmosphère adaptative) |
| `scene-lobby-v3.js` | 949 | Parcours, continuer, tri, atmosphère, achievements |
| `scene-engine-v4.js` | 1146 | Briefing, récap, révision, glossaire |
| `profile-track-v5.js` | 1212 | Sélecteur enrichi, test, promotions |

Chaque couche se désactive en retirant sa balise `<script>` du HTML. Aucune modification du noyau, rollback total possible.

## [2.7] — 2026-04-28

### 🟢 Polish — Cohérence finale post-refactor

#### Modifié
- `sw.js` v25 : ajout de `offline.html`, `og-image.svg`, `favicon.ico`,
  `icon-192.png`, `icon-512.png` dans `STATIC_ASSETS` pour qu'ils soient
  disponibles offline.
- `pwa.manifest.json` : description mise à jour ("64 scénarios" au lieu de "47").
- `index.html` : footer v2.6 → v2.7.
- Workflow `Check questions.yml` renommé en `check-questions.yml`
  (le nom avec espace bloquait le trigger sur self-update).
- 3 scripts obsolètes supprimés : `Check questions.py` (doublon),
  `Generate counts.py` (version cassée), `Inject fiche enhancements.py`
  (référence un fichier mort).

#### Ajouté
- `favicon.ico`, `icon-192.png`, `icon-512.png` à la racine — l'app PWA
  s'installe désormais avec une icône propre sur iOS et Android.
- `scenes/` complet (65 fichiers : index + 64 scènes individuelles).
- `counts.json` régénéré avec la structure complète (clé `tp_exercises`
  restaurée, `tp_categories=25` corrigé).

### 🟡 Refactor — Split de `scenes.js` en `scenes/index.json` + `scenes/{id}.json` (audit P1-C)

`scenes.js` (1.6 MB monolithique) chargeait au boot **toutes les 64 scènes
DFIR avec leurs steps complets**, même si l'utilisateur voulait seulement
voir le lobby.

#### Architecture nouvelle

```
scenes.js (legacy, 1.6 MB)  →  scenes/index.json (~64 KB)
                                 + scenes/{id}.json × 64
                                   (~25 KB chacun, lazy-loadés)
```

| Phase | Avant (v2.6) | Après (v2.7) | Gain |
|---|---|---|---|
| Boot scene.html | 1.6 MB de JS parsé | 64 KB de JSON | **-96 %** |
| RAM au boot | 64 scénarios complets | 64 méta légères | -90 % env. |
| Cache invalidé par 1 modif | 1.6 MB | 25 KB (1 fichier) | -98 % |

#### Ajouté
- `scripts/split_scenes.py` — script Python idempotent qui parse
  `scenes.js` (`var SCENES = [...]`) et génère `scenes/index.json` (méta) +
  `scenes/{id}.json` (contenu complet par scène). À rejouer après chaque
  modif de `scenes.js`.
- `scenes/index.json` (64 KB) — index léger pour le lobby et la recherche.
- `scenes/{id}.json` × 64 — un fichier par scène (10–51 KB).

#### Modifié
- `js/scene-app.js` : nouvelle couche async (`loadSceneIndex`,
  `loadFullScene`, `hydrateScene` avec cache LRU 12). 6 sites de
  `startScene(scene)` patchés pour passer par `hydrateScene` avec gestion
  d'erreur. Compatible legacy : si `scenes.js` est encore chargé, on s'en
  sert en court-circuit.
- `js/cas-in-search.js` : lit `scenes/index.json` en priorité, fallback
  `scenes.js` legacy.
- `scene.html` : balise `<script src="scenes.js">` commentée. L'index est
  chargé à la demande par `scene-app.js`.
- `sw.js` v24-v25 : `scenes/index.json` en network-first, `scenes/{id}.json`
  en cache-first (changent rarement).

`scenes.js` reste conservé comme **fallback legacy**. Suppression prévue
en v3.0 quand le déploiement v2.7 sera stable depuis quelques semaines.

---

## [2.6] — 2026-04-28

### 🟡 Refactor — Extraction du JS inline de `scene.html` (audit P1-B)

`scene.html` contenait **3 256 lignes de JavaScript inline** réparties dans
2 blocs `<script>` (un pour le moteur principal, un pour le UX patch v2).

#### Modifié
- `scene.html` : 5 006 → 1 750 lignes (-65 %, gain ~80 KB cacheable
  séparément). Le bloc 1 (5 lignes — guard `SCENES`) reste inline car il
  sert de bootstrap. Les blocs 2 et 3 sont remplacés par `<script src="...">`.
- `sw.js` v23 : ajoute `js/scene-app.js` et `js/scene-ux-patch.js` à
  `STATIC_ASSETS`.

#### Ajouté
- `js/scene-app.js` (2 561 lignes — moteur principal des scénarios DFIR) :
  storage utils, PRNG Mulberry32, streak/badges, profil, recommandations,
  stats screen + radar, cinema mode, canton map, timeline popup, lobby,
  run scenario.
- `js/scene-ux-patch.js` (731 lignes — UX Patch v2 wrappé en IIFE) :
  injection CSS dynamique, tension bar, glossaire inline, tooltips.

Bit-pour-bit identique au bloc inline original (vérifié par `diff`).
25/25 fonctions appelées par les `onclick="..."` du HTML restent globales.

---

## [2.5] — 2026-04-28

### 🟡 Refactor — Extraction du JS inline de `quiz.html` (audit P1-A)

`quiz.html` contenait **6 558 lignes de JavaScript inline** dans une seule
balise `<script>`. Conséquences avant refactor : chaque correction de typo
dans une explication forçait le navigateur à re-télécharger 365 KB.

#### Modifié
- `quiz.html` : 7 161 → 603 lignes. Le bloc `<script>` inline est remplacé
  par `<script src="js/quiz-app.js" defer></script>`. Aucune logique
  modifiée : le contenu extrait est bit-pour-bit identique à l'original.
- `sw.js` v22 : ajoute `js/quiz-app.js` à `STATIC_ASSETS`.

#### Ajouté
- `js/quiz-app.js` (322 KB) : 95 fonctions, 21 rangs, 41 achievements,
  83 entrées glossaire, modes Examen/Survie/Mission/SM2/Daily, gamification
  XP/streak/combo, share card, focus mode, mode Konami, Double-or-Nothing.

### 🟢 Ajouté — Export/Import de progression (audit P1-D)

Permet aux utilisateurs de sauvegarder toute leur progression dans un
fichier JSON, et de la restaurer dans un autre navigateur ou après
réinstallation.

#### Nouveau fichier `js/cas-in-export.js`

API exposée sur `window.CasInExport` :
- `exportProgress()` — déclenche un téléchargement
  `cas-in-progression-YYYY-MM-DD.json` contenant toutes les clés
  `localStorage` du namespace CAS-IN plus un résumé human-readable.
- `openImportDialog()` — sélecteur de fichier, prévisualise le contenu
  (date, XP, fiches lues, examens…), demande confirmation puis applique.
- `previewImport(json)` — valide un JSON sans rien écrire.

Format versionné `cas-in-progress/v1`. Whitelist stricte (seules les clés
du namespace CAS-IN sont exportées). Aucun appel réseau — tout reste local.

#### UI
- Drawer profil de la landing : 2 nouveaux boutons (`⤓ Exporter` /
  `⤒ Importer`) dans une section dédiée "SAUVEGARDE".

---

## [2.4] — 2026-04-28

### 🔴 Cleanup — Audit qualité massive

#### Supprimé / Corrigé
- **`questions.json`** : 1 750 → 1 630 questions (suppression de
  120 stubs/doublons), thèmes normalisés (10 thèmes canoniques),
  93 anomalies QC → 1 (faux positif EPFL ABC/abc, intentionnel
  pédagogique).
- **`manifest.json`** régénéré : 47 → 90 fiches (les 43 fiches manquantes
  étaient présentes physiquement mais absentes du manifest).
- Hardcodes `1439`, `54`, `18`, `20` (anciens compteurs figés) supprimés
  de tous les HTML/JS — remplacés par `data-count="..."`.
- `js/landing.js` : clé localStorage incohérente corrigée
  (`casIn_questionsSeen` partout), hardcodes supprimés.
- `js/cas-in-search.js` : utilise désormais l'index complet (1 630
  questions + 64 scènes) au lieu de 1 500 questions sans scènes.

#### Ajouté
- `offline.html` — page fallback PWA quand l'utilisateur navigue offline
  vers une page non cachée.
- `og-image.svg` — image de prévisualisation pour les partages sociaux.
- `sw.js` v21 — `STATIC_ASSETS` auto-régénéré depuis `manifest.json`,
  les 90 fiches sont en cache-first.

---

## [2.3] — 2026-04-23

### Ajouté
- `.gitignore` pour ignorer les fichiers OS, éditeurs et fichiers
  temporaires
- `.editorconfig` pour la cohérence d'édition entre éditeurs
- `README.md` documentant l'architecture, les technos et les raccourcis
  clavier
- `CHANGELOG.md` (ce fichier) pour tracer les versions
- `scripts/generate_counts.py` qui génère `counts.json` depuis le
  `manifest.json` et `questions.json`
- `counts.json` — source unique des nombres affichés
- `.github/workflows/check-questions.yml` qui valide `questions.json` et
  régénère `counts.json` à chaque push

---

## [2.2] — 2026-04-22

### Ajouté
- Landing page redesign avec pilules Matrix-style
- `manifest.json` comme source de vérité pour les fiches
- Script `scripts/check_questions.py` pour le QC de `questions.json`
- Workflow GitHub Actions `.github/workflows/check-questions.yml`

### Modifié
- Structure du repo réorganisée (`fiches/`, `tp/`, `style/`, `scripts/`)
- Service Worker v15 avec stratégie Network-First (HTML) +
  Cache-First (statiques)

---

## [2.0 – 2.1] — 2026

Versions initiales avant le grand audit de avril 2026.
