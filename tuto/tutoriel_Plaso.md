# Tutoriel complet Plaso / log2timeline — Super-timelines pour la forensique numérique

> **Plaso** (acronyme islandais de *Plaso Langar Að Safna Öllu*, « Plaso veut tout collecter ») est un **moteur Python open source** spécialisé dans la **création automatique de super-timelines** à partir de centaines de sources d'artefacts forensiques. C'est la **suite moderne** de l'outil historique **log2timeline** (à l'origine écrit en Perl) développé par **Kristinn Guðjónsson**.
>
> Plaso permet d'agréger en une seule chronologie unifiée tous les événements horodatés d'un système : modifications de fichiers, événements Windows, historique navigateur, registre, logs Linux/macOS, exécutions, périphériques USB, etc.
>
> Dépôt officiel : <https://github.com/log2timeline/plaso>
> Documentation : <https://plaso.readthedocs.io>
> Licence : **Apache 2.0**
> Version actuelle : **plaso-20260119** (releases datées, modèle *rolling release*)
> Slogan officiel : *« Super timeline all the things »*

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Cas d'usage typiques](#2-cas-dusage-typiques)
3. [Architecture : les 5 outils en ligne de commande](#3-architecture--les-5-outils-en-ligne-de-commande)
4. [Prérequis système](#4-prérequis-système)
5. [Installation sous Ubuntu/Debian (GIFT PPA)](#5-installation-sous-ubuntudebian-gift-ppa)
6. [Installation sous Fedora (GIFT COPR)](#6-installation-sous-fedora-gift-copr)
7. [Installation via Docker (multiplateforme)](#7-installation-via-docker-multiplateforme)
8. [Installation sous Windows](#8-installation-sous-windows)
9. [Installation via pip](#9-installation-via-pip)
10. [Premier workflow : super-timeline en 3 commandes](#10-premier-workflow--super-timeline-en-3-commandes)
11. [log2timeline : extraction des événements](#11-log2timeline--extraction-des-événements)
12. [psort : filtrage, tri et export](#12-psort--filtrage-tri-et-export)
13. [psteal : le raccourci tout-en-un](#13-psteal--le-raccourci-tout-en-un)
14. [pinfo : inspecter un fichier .plaso](#14-pinfo--inspecter-un-fichier-plaso)
15. [image_export : extraire des fichiers](#15-image_export--extraire-des-fichiers)
16. [Intégration avec Timesketch](#16-intégration-avec-timesketch)
17. [Filtres avancés et requêtes](#17-filtres-avancés-et-requêtes)
18. [Forces de Plaso](#18-forces-de-plaso)
19. [Faiblesses et limites](#19-faiblesses-et-limites)
20. [Bonnes pratiques](#20-bonnes-pratiques)
21. [Ressources utiles](#21-ressources-utiles)

---

## 1. Présentation générale

Plaso n'est pas un outil d'analyse à interface graphique — c'est un **framework Python en ligne de commande** pensé pour la **chaîne d'investigation forensique**. Son rôle :

1. **Parser** automatiquement des centaines de formats de fichiers et de sources de données.
2. **Extraire** tous les événements horodatés trouvés.
3. **Stocker** ces événements dans un format normalisé (`.plaso`).
4. **Filtrer, trier et exporter** ces événements vers un outil de visualisation (CSV, JSON, XLSX, KML, Elasticsearch/OpenSearch, **Timesketch**).

Le résultat est ce qu'on appelle une **super-timeline** : une chronologie unifiée pouvant contenir des **dizaines de millions d'événements** issus d'un seul disque, mélangeant systèmes de fichiers, logs applicatifs, artefacts utilisateur et événements système.

C'est l'outil **incontournable** pour répondre à la question **« que s'est-il passé sur ce système et à quel moment ? »** — typiquement dans une **réponse à incident** ou une **enquête sur intrusion**.

---

## 2. Cas d'usage typiques

- **Réponse à incident** : reconstituer la cinématique d'une intrusion (mouvement latéral, exfiltration, persistance).
- **Investigation judiciaire** : prouver une activité utilisateur à un moment précis.
- **Threat hunting** : corréler des événements à des indicateurs de compromission.
- **Détection de timestomping** : repérer les manipulations volontaires d'horodatages sur fichiers.
- **Audit de sécurité** : reconstruire l'historique d'utilisation d'un poste compromis.
- **Analyse de malware** : tracer l'exécution d'un binaire suspect dans le temps.
- **Compliance et e-discovery** : prouver qu'un fichier a été ouvert/modifié à une date donnée.

---

## 3. Architecture : les 5 outils en ligne de commande

Plaso fournit **5 binaires** qui s'enchaînent naturellement :

```
┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│  Image E01   │───►│  log2timeline   │───►│  fichier     │
│  ou dossier  │    │  (extraction)   │    │  .plaso      │
└──────────────┘    └─────────────────┘    └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │    pinfo     │
                                          │ (inspection) │
                                          └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │    psort     │
                                          │ (tri+export) │
                                          └──────┬───────┘
                                                 │
                                                 ▼
                                       CSV / JSON / XLSX /
                                       KML / Timesketch
```

| Outil | Rôle |
|-------|------|
| **`log2timeline`** | Extrait tous les événements d'une source et produit un fichier `.plaso` |
| **`psort`** | Post-traite le fichier `.plaso` : filtre, trie, exporte vers un format final |
| **`psteal`** | Combine `log2timeline` + `psort` en une seule commande (raccourci) |
| **`pinfo`** | Affiche des métadonnées sur un fichier `.plaso` (nombre d'événements, parsers utilisés, etc.) |
| **`image_export`** | Extrait des fichiers d'une image disque selon des critères (extension, date, signature) |

> 💡 La plupart des tutos en ligne mentionnent encore les suffixes `.py` (`log2timeline.py`, `psort.py`). Selon la méthode d'installation, le suffixe peut être présent ou absent. Les deux fonctionnent en général.

---

## 4. Prérequis système

### Matériel recommandé

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| RAM | 8 Go | **16-32 Go** |
| CPU | 4 cœurs | **8-16 cœurs** (parallélisation forte) |
| Stockage | HDD 100 Go libres | **SSD 500 Go+** |
| OS | Ubuntu 22.04 / Fedora 38 | Ubuntu 22.04 LTS officiellement supporté |

### Logiciels

- **Python 3.8+** (3.10+ recommandé)
- **pip** ou **apt/dnf** selon la méthode
- **Docker** (méthode alternative la plus simple)
- Dépendances natives : `libewf` (E01), `libvmdk`, `libvhdi`, `libbde` (BitLocker), `libfsapfs` (APFS macOS), etc.

> ⚠️ Plaso a **beaucoup de dépendances natives complexes**. C'est pour ça que les méthodes recommandées sont **GIFT PPA** sur Ubuntu, **GIFT COPR** sur Fedora, ou **Docker** partout — éviter `pip install plaso` direct sauf cas particuliers.

---

## 5. Installation sous Ubuntu/Debian (GIFT PPA)

**Méthode recommandée** sur Ubuntu **22.04 LTS** (les autres versions ne sont pas officiellement supportées). La PPA **GIFT** fournit toutes les dépendances pré-compilées.

```bash
# 1. Activer le dépôt universe
sudo add-apt-repository universe
sudo apt-get update

# 2. Ajouter la PPA stable
sudo add-apt-repository ppa:gift/stable
sudo apt-get update

# 3. Installer Plaso et tous les outils
sudo apt-get install plaso-tools
```

### Vérifier l'installation

```bash
log2timeline --version
psort --version
psteal --version
```

Tu dois voir quelque chose comme `plaso - log2timeline version 20260119`.

### Vérifier les dépendances

Si tu rencontres des erreurs au lancement :

```bash
wget https://raw.githubusercontent.com/log2timeline/plaso/main/utils/check_dependencies.py
python3 check_dependencies.py
```

Toutes les lignes doivent retourner `[OK]`. Si tu vois `[FAILURE]`, mets à jour la dépendance correspondante.

### Branche de développement (déconseillée en prod)

```bash
sudo add-apt-repository ppa:gift/dev
sudo apt-get update
sudo apt-get install plaso-tools
```

---

## 6. Installation sous Fedora (GIFT COPR)

```bash
# 1. Activer dnf-plugins-core
sudo dnf install dnf-plugins-core

# 2. Activer le dépôt COPR stable
sudo dnf copr enable @gift/stable

# 3. Installer Plaso
sudo dnf install plaso-tools
```

---

## 7. Installation via Docker (multiplateforme)

**La méthode la plus simple et la plus portable.** Fonctionne sous Linux, macOS et Windows.

### Étape 1 : tirer l'image officielle

```bash
docker pull log2timeline/plaso
```

### Étape 2 : vérifier

```bash
docker run --rm log2timeline/plaso log2timeline --version
```

### Étape 3 : utilisation typique

L'image Docker expose `log2timeline`, `psort`, `psteal`, `pinfo` et `image_export` via un script `plaso-switch.sh`. On monte un volume contenant les preuves :

```bash
# Extraction
docker run --rm -v /data/:/data log2timeline/plaso \
  log2timeline --storage-file /data/evidence.plaso /data/image.E01

# Export en CSV
docker run --rm -v /data/:/data log2timeline/plaso \
  psort -w /data/timeline.csv /data/evidence.plaso
```

Sous Windows PowerShell, le syntaxe `-v` devient `-v C:\data:/data` (chemin Windows à gauche, chemin conteneur à droite).

---

## 8. Installation sous Windows

Plaso fournit des **binaires natifs Windows** depuis longtemps (via le projet [l2tbinaries](https://github.com/log2timeline/l2tbinaries)), mais le **support Windows est moins prioritaire** que Linux.

### Méthode 1 : binaires précompilés

1. Aller sur <https://github.com/log2timeline/plaso/releases>
2. Télécharger le ZIP `plaso-YYYYMMDD-amd64.zip`
3. Décompresser dans `C:\plaso\`
4. Ajouter `C:\plaso\` à la variable d'environnement `PATH`
5. Ouvrir une **invite de commande** ou **PowerShell** :

```powershell
log2timeline.exe --version
```

### Méthode 2 : Docker Desktop (recommandée)

Installer **Docker Desktop pour Windows**, puis suivre la [section Docker](#7-installation-via-docker-multiplateforme).

### Méthode 3 : WSL2

Installer **WSL2 + Ubuntu 22.04**, puis suivre la [section Ubuntu](#5-installation-sous-ubuntudebian-gift-ppa). **Attention** : WSL2 peut être nettement plus lent que natif sur de gros disques (overhead I/O).

---

## 9. Installation via pip

**Déconseillée en général** car les dépendances natives ne s'installent pas via pip. Mais si tu veux développer ou tester :

```bash
# Créer un venv
python3 -m venv plaso_env
source plaso_env/bin/activate

# Installer Plaso
pip install plaso

# Pour les dépendances natives, il faut quand même :
sudo apt-get install libewf-dev libvmdk-dev libvhdi-dev libbde-dev
```

> 💡 Pour le développement, préférer cloner le repo et installer en mode éditable :
> ```bash
> git clone https://github.com/log2timeline/plaso.git
> cd plaso
> pip install -e .
> ```

---

## 10. Premier workflow : super-timeline en 3 commandes

Le workflow standard se résume à **3 étapes** :

```bash
# 1. EXTRAIRE tous les événements de l'image vers un fichier .plaso
log2timeline --storage-file /case/evidence.plaso /case/image.E01

# 2. (optionnel) INSPECTER le contenu
pinfo /case/evidence.plaso

# 3. EXPORTER vers un CSV trié chronologiquement
psort -w /case/timeline.csv /case/evidence.plaso
```

Le `timeline.csv` est ensuite ouvrable dans LibreOffice/Excel ou importable dans **Timesketch** pour la visualisation.

---

## 11. log2timeline : extraction des événements

### Syntaxe de base

```bash
log2timeline [OPTIONS] --storage-file SORTIE.plaso ENTRÉE
```

### Sources acceptées

- Image disque : `.E01`, `.dd`, `.raw`, `.vmdk`, `.vhd`, `.vhdx`, `.qcow2`
- Dossier monté
- Fichier individuel
- Disque physique (Linux : `/dev/sda`)
- Image avec volume **BitLocker** chiffré (prompt interactif pour la clé)

### Exemples

```bash
# Image E01 simple
log2timeline --storage-file case.plaso disk.E01

# Forcer une partition spécifique (évite le prompt interactif)
log2timeline --partitions 2 --storage-file case.plaso disk.E01

# Traiter aussi les Volume Shadow Copies
log2timeline --vss-stores all --storage-file case.plaso disk.E01

# Spécifier un fuseau horaire
log2timeline --timezone Europe/Paris --storage-file case.plaso disk.E01

# Utiliser un preset de parsers (plus rapide)
log2timeline --parsers win7 --storage-file case.plaso disk.E01

# Lister tous les presets disponibles
log2timeline --info
```

### Presets de parsers utiles

| Preset | Cible |
|--------|-------|
| `win7` | Windows 7+ (registre, EVTX, navigateurs, prefetch, etc.) |
| `winxp` | Windows XP |
| `macosx` | macOS (plist, asl, keychain, etc.) |
| `linux` | Linux (syslog, utmp, bash history, etc.) |
| `android` | Android (calls, sms, app usage) |
| `webhist` | Historiques navigateurs uniquement |

### Options importantes

| Option | Effet |
|--------|-------|
| `--storage-file FICHIER` | Fichier `.plaso` de sortie (obligatoire) |
| `--parsers LISTE` | Limite aux parsers spécifiés (séparés par virgules) |
| `--hashers md5,sha256` | Calcule les hashes des fichiers traités |
| `--workers N` | Nombre de processus parallèles (défaut : auto) |
| `--logfile FICHIER` | Redirige les logs |
| `--vss-stores all` | Inclut les Volume Shadow Copies |
| `--partitions N` | Sélectionne une partition |
| `--timezone TZ` | Force le fuseau (utile pour FAT) |
| `-d, --debug` | Mode debug |

### Durée typique

- **Image Windows 7 de 40 Go** : 1 à 3 heures sur un poste moderne
- **Image Windows 11 de 500 Go avec VSS** : 12 à 36 heures
- **Image serveur multi-To** : plusieurs jours

C'est **lent** parce que Plaso parse exhaustivement chaque artefact.

---

## 12. psort : filtrage, tri et export

`psort` lit le `.plaso` produit par `log2timeline` et **génère le livrable final** (CSV, JSON, XLSX, etc.).

### Syntaxe de base

```bash
psort -o FORMAT -w SORTIE FICHIER.plaso [FILTRE]
```

### Formats de sortie courants

| Format `-o` | Description |
|-------------|-------------|
| `dynamic` | CSV moderne, recommandé par défaut |
| `l2tcsv` | CSV historique (héritage log2timeline Perl) |
| `l2ttln` | TLN (Timeline) format |
| `json` | JSON ligne par ligne |
| `json_line` | Idem, optimisé pour pipelines |
| `xlsx` | Excel (lent sur gros volumes) |
| `kml` | Google Earth (pour artefacts géolocalisés) |
| `opensearch` | Indexation directe Elasticsearch/OpenSearch |
| `timesketch` | Export direct vers Timesketch |
| `null` | Aucun output (utile pour analyse seule) |

### Exemples

```bash
# Export CSV simple (format dynamic = défaut)
psort -w timeline.csv evidence.plaso

# Format l2tcsv classique
psort -o l2tcsv -w timeline.csv evidence.plaso

# JSON
psort -o json_line -w timeline.json evidence.plaso

# Excel
psort -o xlsx -w timeline.xlsx evidence.plaso

# Spécifier le fuseau horaire de sortie
psort --output-time-zone "Europe/Paris" -w timeline.csv evidence.plaso

# Champs additionnels (uniquement formats dynamic, opensearch, xlsx)
psort --additional_fields hash,sha256,filename -w timeline.csv evidence.plaso
```

### Filtres temporels (très utiles)

#### Plage de dates

```bash
psort -w timeline.csv evidence.plaso \
  "date > '2026-01-15 00:00:00' AND date < '2026-01-17 23:59:59'"
```

#### Slice autour d'un événement précis

```bash
# Récupère tout dans une fenêtre de ±5 minutes autour du timestamp
psort --slice '2026-01-16T14:23:00+01:00' -w slice.csv evidence.plaso

# Élargir la fenêtre à ±30 minutes
psort --slice '2026-01-16T14:23:00+01:00' --slice_size 30 -w slice.csv evidence.plaso
```

### Filtres par parser ou contenu

```bash
# Garder uniquement les événements du parser "winreg"
psort -w timeline.csv evidence.plaso "parser is 'winreg'"

# Garder uniquement le navigateur Chrome
psort -w timeline.csv evidence.plaso "parser contains 'chrome'"

# Combiner critères
psort -w timeline.csv evidence.plaso \
  "parser is 'winevtx' AND date > '2026-01-15 00:00:00'"
```

### Plugins d'analyse

`psort` peut lancer des **plugins d'analyse** sur les événements pendant l'export :

```bash
# Tagger les événements selon un fichier de tags
psort --analysis tagging --tagging-file tag_windows.txt \
      -o dynamic -w timeline.csv evidence.plaso

# Détecter des bruteforces sur logs Windows
psort --analysis windows_services -w timeline.csv evidence.plaso

# Lister tous les plugins disponibles
psort --analysis list
```

Plugins notables : `tagging`, `browser_search`, `chrome_extension`, `unique_domains_visited`, `windows_services`, `viper`, `virustotal`.

---

## 13. psteal : le raccourci tout-en-un

`psteal` (acronyme : *Plaso SýndarheimsTímalína sem Er ALgjörlega sjálfvirk*) combine `log2timeline` et `psort` en **une seule commande** pour les cas simples :

```bash
psteal --source /case/disk.E01 -w /case/timeline.csv
```

Cela produit :

- Un fichier `.plaso` intermédiaire (nommé `<TIMESTAMP>-disk.E01.plaso` dans le répertoire courant)
- Un fichier CSV final trié chronologiquement

### Quand utiliser psteal

✅ Cas simples, image unique, paramètres par défaut acceptables, pas de filtres complexes.

### Quand préférer log2timeline + psort

❌ Cas complexes nécessitant des filtres, des analyses, plusieurs exports différents du même `.plaso`, ou des optimisations fines.

**En pratique**, les forensiques expérimentés utilisent toujours la séparation `log2timeline` → `psort` car :

- Le `.plaso` peut être ré-analysé plusieurs fois sans re-extraire.
- Tu peux générer un CSV ET un JSON ET un export Timesketch à partir du même `.plaso`.
- Tu peux appliquer différents filtres temporels successivement.

---

## 14. pinfo : inspecter un fichier .plaso

```bash
pinfo /case/evidence.plaso
```

Affiche :

- Nombre total d'événements
- Liste des parsers utilisés et nombre d'événements par parser
- Métadonnées de la session de collecte (date, hostname, version Plaso, paramètres)
- Détection du système d'exploitation
- Erreurs et warnings rencontrés pendant l'extraction
- Tags appliqués (si pertinent)

### Exemple de sortie

```
plaso - pinfo version 20260119

Storage file: /case/evidence.plaso
========================================
Session start: 2026-04-15T08:23:14
Session end:   2026-04-15T11:47:32
Total events:  18 643 271

Parsers used:
  winreg            : 4 231 056 events
  filestat          : 3 982 110 events
  winevtx           : 2 145 332 events
  chrome_history    : 1 023 887 events
  ...
```

Indispensable pour **valider** qu'un `.plaso` contient bien ce que tu espérais avant de lancer un long export.

### Comparer deux fichiers .plaso

```bash
pinfo --compare /case/baseline.plaso /case/suspect.plaso
```

Très utile pour repérer des différences entre un snapshot avant et après un événement suspect.

---

## 15. image_export : extraire des fichiers

`image_export` permet d'extraire **les fichiers eux-mêmes** d'une image disque, selon divers filtres. Ce n'est pas pour produire une timeline mais pour **récupérer du contenu**.

```bash
# Extraire tous les fichiers .docx d'une image
image_export -w /case/extracted --extensions docx /case/disk.E01

# Extraire selon une liste de signatures
image_export -w /case/extracted --signatures gzip,pdf,exe /case/disk.E01

# Extraire les fichiers créés dans une fenêtre temporelle
image_export -w /case/extracted \
             --date-filter "ctime,2026-01-15T00:00:00,2026-01-16T00:00:00" \
             /case/disk.E01

# Filtre par chemin (yara-style)
image_export -w /case/extracted -f /case/filter.yaml /case/disk.E01
```

Utile pour faire du **triage ciblé** avant analyse plus poussée.

---

## 16. Intégration avec Timesketch

[**Timesketch**](https://timesketch.org) est l'outil de **visualisation collaborative** des super-timelines Plaso, développé par les mêmes équipes (Google + communauté). Il offre :

- Interface web pour parcourir les événements
- Recherche full-text (Elasticsearch/OpenSearch)
- **Sketches** : collaboration multi-analystes sur une même timeline
- **Tagging** et **stories** (narratifs)
- **Sigma rules** intégrées pour détection automatique
- API REST pour automatisation

### Workflow Plaso → Timesketch

#### Méthode 1 : import direct du `.plaso`

```bash
tsctl import --name "Cas-2026-001" --file /case/evidence.plaso
```

#### Méthode 2 : export psort puis import CSV/JSONL

```bash
# Export Plaso au format JSONL
psort -o json_line -w timeline.jsonl evidence.plaso

# Import via tsctl ou interface web
```

#### Méthode 3 : export direct via le module Timesketch de psort

```bash
psort -o timesketch \
      --timesketch-url http://localhost:5000 \
      --timesketch-username admin \
      --timesketch-password ******* \
      --timesketch-sketch-id 1 \
      evidence.plaso
```

### Installation rapide de Timesketch

Via Docker Compose (méthode officielle recommandée) :

```bash
curl -O https://raw.githubusercontent.com/google/timesketch/master/docker/release/docker-compose.yml
curl -O https://raw.githubusercontent.com/google/timesketch/master/docker/release/config.env
docker compose up -d
```

Interface accessible sur `http://localhost`.

---

## 17. Filtres avancés et requêtes

Plaso utilise une **syntaxe de filtre type SQL** dans `psort`. Quelques exemples :

### Par champ

```bash
# Événements impliquant un utilisateur spécifique
"username == 'jdupont'"

# Événements sur un fichier précis
"filename contains 'invoice.docx'"

# Événements avec MFT entry number > X
"inode > 100000"

# Combinaison
"username == 'jdupont' AND parser is 'winevtx' AND date > '2026-01-15'"
```

### Opérateurs supportés

- Comparaison : `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logique : `AND`, `OR`, `NOT`
- Texte : `contains`, `iregexp` (insensible à la casse)
- Inclusion : `in`, `is`

### Filtres par tag

```bash
# Garder seulement les événements taggés "malware"
"tag contains 'malware'"
```

Le tagging se fait via le plugin `tagging` avec un fichier de règles texte (format simple `tag_name: filter_expression`).

---

## 18. Forces de Plaso

✅ **Couverture exhaustive** : **plus de 200 parsers** intégrés. Aucun autre outil open source ne couvre autant de formats d'artefacts forensiques.

✅ **Format `.plaso` réutilisable** : extraction une fois, exports multiples (CSV, JSON, Timesketch, Excel…) sans relancer le parsing long.

✅ **Standard de facto** : utilisé dans toute la communauté DFIR (SANS, Google, FireEye/Mandiant, CERT-FR, etc.). C'est **le** moteur de timeline pour les pros.

✅ **Open source Apache 2.0**, gratuit, sans licence à acheter.

✅ **Excellente intégration avec Timesketch** pour la visualisation et la collaboration.

✅ **Parallélisme natif** : exploite tous les cœurs CPU disponibles.

✅ **Multi-source** : un seul `.plaso` peut combiner plusieurs images, dossiers, exports volatility, etc.

✅ **Support de formats complexes** : E01, VMDK, VHDX, **BitLocker chiffré**, **APFS** (macOS), **Volume Shadow Copies** Windows.

✅ **Filtres SQL-like puissants** pour cibler exactement ce qui intéresse.

✅ **Documentation Read the Docs** complète : <https://plaso.readthedocs.io>.

✅ **Communauté DFIR active** : Slack Open Source DFIR, mailing lists, releases mensuelles régulières (modèle *rolling release* daté `YYYYMMDD`).

✅ **Inclus par défaut** dans la **SIFT Workstation** (SANS), **REMnux**, **PiRogue Tool Suite**, **Tsurugi Linux**, etc.

✅ **Pinfo --compare** pour différentiel entre deux extractions (avant/après incident).

✅ **Plugins d'analyse intégrés** : tagging Sigma-like, détection de patterns, corrélation avec VirusTotal.

✅ **Image_export** comme outil bonus pour extraction ciblée de fichiers.

---

## 19. Faiblesses et limites

❌ **Lent** : extraire une image Windows 11 de 500 Go peut prendre **plus d'une journée**. Pas adapté pour du *quick triage* — préférer **KAPE** pour ça.

❌ **Très gourmand en RAM** : peut consommer 8-16 Go en pointe sur de gros workers parallèles.

❌ **Aucune interface graphique** : entièrement CLI. Les non-techniciens sont perdus.

❌ **Courbe d'apprentissage forte** sur les filtres et options avancées : `psort` a des dizaines d'options, la syntaxe des filtres est documentée mais peu intuitive.

❌ **Faux positifs et bruit énorme** : une super-timeline brute contient des millions d'événements, dont 99 % sont sans intérêt. Le **vrai travail commence après l'export** : il faut savoir filtrer, ce qui demande de l'expérience.

❌ **Dépendances natives complexes** : `pip install plaso` direct échoue souvent. Il faut passer par GIFT PPA, GIFT COPR ou Docker — pas trivial à comprendre pour un débutant.

❌ **Support Ubuntu limité aux LTS** : officiellement seul **Ubuntu 22.04 LTS** est supporté. Les autres versions peuvent fonctionner mais sans garantie.

❌ **Pas de Windows natif vraiment soutenu** : les binaires `l2tbinaries` existent mais le développement est centré Linux.

❌ **Pas de timeline RAM directe** : ne parse pas les dumps mémoire. Il faut passer par **Volatility 3** d'abord, puis injecter le body file dans Plaso (et il y a des incompatibilités de format à corriger manuellement).

❌ **Pas d'extraction native** : Plaso analyse une image, il ne l'**acquiert** pas. Il faut un outil tiers (FTK Imager, dd, Cellebrite, KAPE, AndroidQF, idevicebackup2…) pour produire la source.

❌ **Format `.plaso` propriétaire** (basé sur SQLite + zstd) : difficile à lire sans les outils Plaso, ce qui crée une dépendance.

❌ **Bugs occasionnels sur parsers exotiques** : certains parsers (anciens iOS, vieux Linux) sont moins maintenus et peuvent crasher sur des artefacts corrompus.

❌ **Mise à jour fréquente cassante** : modèle *rolling release*, les datations `YYYYMMDD` font qu'une version peut casser un script qui marchait avec la précédente. Il faut **pinner la version** en prod.

❌ **Documentation technique parfois ardue** pour les concepts internes (parser plugins, analysis plugins, artifacts).

❌ **Pas de support officiel des forces de l'ordre** comme un EnCase ou Cellebrite : pas de support 24/7, pas de certification judiciaire formelle dans tous les pays.

---

## 20. Bonnes pratiques

🔹 **Toujours travailler sur une copie** de l'image disque, jamais sur l'original.

🔹 **Calculer le hash SHA-256** de l'image avant traitement et le documenter avec le `.plaso`.

🔹 **Spécifier explicitement le fuseau horaire** avec `--timezone`, surtout pour les systèmes FAT.

🔹 **Utiliser des presets de parsers** si tu connais le système :
```bash
log2timeline --parsers win7 ...   # 3 à 5× plus rapide que tous les parsers
```

🔹 **Activer les Volume Shadow Copies** sur les images Windows quand l'enquête le justifie :
```bash
log2timeline --vss-stores all ...
```

🔹 **Conserver le fichier `.plaso`** ! C'est l'artefact intermédiaire le plus précieux : tu peux re-générer 50 exports différents sans relancer l'extraction de 12 heures.

🔹 **Filtrer dès `psort`** plutôt que de balancer 18 millions d'événements dans Excel — qui plantera.

🔹 **Toujours commencer par `pinfo`** pour vérifier ce qui a été extrait avant de paniquer sur des événements absents.

🔹 **Préférer JSON_LINE ou Timesketch** sur des cas réels — `xlsx` plante au-delà du million d'événements, `l2tcsv` a une structure dépréciée.

🔹 **Combiner avec Timesketch** dès qu'il y a plus de 100 000 événements — l'interface web est indispensable pour explorer efficacement.

🔹 **Documenter chaque étape** : commande exacte, version de Plaso (`log2timeline --version`), hashes des entrées et sorties.

🔹 **Augmenter le nombre de workers** sur les gros CPU :
```bash
log2timeline --workers 16 ...
```
Mais attention à la RAM — chaque worker consomme ~1-2 Go.

🔹 **Pinner une version de Plaso** en production avec Docker :
```bash
docker pull log2timeline/plaso:20260119
```

🔹 **Combiner Plaso avec Volatility 3** pour une timeline complète disque + mémoire :
```bash
# Générer body file depuis dump mémoire
vol -f mem.raw windows.timeliner --output csv > mem_body.csv
# Concaténer avec timeline disque (nécessite reformatage manuel)
```

🔹 **Tester ses filtres sur petit échantillon** avant d'attendre 4 h un export complet pour découvrir une erreur de syntaxe.

🔹 **Utiliser `--analysis tagging` avec un fichier de tags** pour pré-classifier les événements suspects.

🔹 **Sigma rules dans Timesketch** : pour automatiser la détection d'IOCs et de comportements suspects après import.

---

## 21. Ressources utiles

### Officielles

- 📚 **Dépôt GitHub** : <https://github.com/log2timeline/plaso>
- 📚 **Documentation Read the Docs** : <https://plaso.readthedocs.io>
- 📚 **Releases** : <https://github.com/log2timeline/plaso/releases>
- 📚 **DeepWiki Plaso** : <https://deepwiki.com/log2timeline/plaso>
- 📚 **GIFT PPA Launchpad** : <https://launchpad.net/~gift>
- 🐳 **Docker Hub** : <https://hub.docker.com/r/log2timeline/plaso>

### Timesketch (visualisation)

- 🌐 **Site officiel** : <https://timesketch.org>
- 📚 **Dépôt GitHub** : <https://github.com/google/timesketch>
- 📚 **Sigma rules pour Timesketch** : <https://github.com/SigmaHQ/sigma>

### Communauté DFIR

- 💬 **Open Source DFIR Slack** : <https://github.com/open-source-dfir/slack>
- 💬 **Mailing list log2timeline-discuss** : <https://groups.google.com/g/log2timeline-discuss>
- 💬 **Mailing list log2timeline-dev** : <https://groups.google.com/g/log2timeline-dev>

### Distributions intégrant Plaso

- 🐧 **SIFT Workstation (SANS)** : <https://www.sans.org/tools/sift-workstation/>
- 🐧 **REMnux** : <https://remnux.org>
- 🐧 **Tsurugi Linux** : <https://tsurugi-linux.org>
- 🐧 **PiRogue Tool Suite** : <https://pts-project.org>

### Tutoriels recommandés

- 📰 **Blog officiel Plaso** : <https://blog.kiddaland.net>
- 📰 **« Plaso Super Timelines with Docker »** (dfir-kev) : <https://dfir-kev.medium.com/plaso-super-timelines-with-docker-5fabfcdbd314>
- 📰 **SANS DFIR Posters** : <https://www.sans.org/posters/?focus-area=digital-forensics>
- 🎓 **SANS FOR508** : formation officielle qui utilise abondamment Plaso

### Outils complémentaires

- 🔧 **KAPE** (acquisition rapide) : <https://www.kroll.com/kape>
- 🔧 **Volatility 3** (RAM) : <https://github.com/volatilityfoundation/volatility3>
- 🔧 **Autopsy** (interface graphique disque) : <https://www.autopsy.com>
- 🔧 **IPED** (parsing alternatif gros volumes) : <https://github.com/sepinf-inc/IPED>

---

## Conclusion

Plaso est sans conteste **la référence open source de la création de super-timelines**. C'est l'outil que les pros de la réponse à incident sortent quand il faut **reconstituer minute par minute** ce qui s'est passé sur un système, en agrégeant des centaines de sources d'artefacts en une seule chronologie cohérente.

Son point fort — et son point faible — est sa **philosophie « tout extraire d'abord, filtrer ensuite »**. Tu obtiens une couverture forensique **inégalée**, mais au prix d'une **lenteur d'extraction** et d'un **volume d'événements écrasant** qu'il faut savoir maîtriser. C'est un **outil d'expert**, pas un *quick win*.

L'écosystème **Plaso + Timesketch** forme une **stack DFIR open source de niveau professionnel**, parfaitement adaptée :

- aux **CERT et CSIRT** pour la réponse à incident,
- aux **chercheurs en threat intelligence**,
- aux **unités d'enquête judiciaire** travaillant sans budget commercial,
- à la **formation universitaire** en forensique numérique.

Pour bien démarrer, je recommande de :

1. Installer Plaso via **Docker** (le plus simple, le plus reproductible).
2. T'entraîner sur une **image de test NIST CFReDS** : <https://cfreds.nist.gov>
3. Faire ton premier `psteal` complet pour comprendre le workflow.
4. Installer **Timesketch** en parallèle dès que la timeline dépasse 100 000 événements.
5. Lire le **poster SANS FOR508** sur la timeline analysis pour comprendre les artefacts Windows.
6. Maîtriser les **filtres psort** : c'est là que se joue 80 % de l'efficacité réelle.
7. Combiner avec **Volatility 3** pour les analyses mémoire et **KAPE** pour le triage rapide.

Tu as maintenant la pièce manquante du puzzle DFIR open source. Avec **IPED/Autopsy** pour le disque, **MVT** pour le mobile spyware, et **Plaso + Timesketch** pour la timeline, tu disposes d'une **chaîne complète** rivalisant avec les solutions commerciales à plusieurs dizaines de milliers d'euros la licence.

Bonnes investigations chronologiques ! 🔍⏱️
