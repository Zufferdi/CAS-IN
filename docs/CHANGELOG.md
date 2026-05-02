# Changelog

Toutes les modifications notables apportées à ce projet sont documentées ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

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
