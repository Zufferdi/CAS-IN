# Tutoriel complet Autopsy — Plateforme open source de forensique numérique

> **Autopsy®** est la **plateforme open source de forensique numérique** la plus utilisée au monde. C'est l'**interface graphique** officielle de **The Sleuth Kit® (TSK)**, développée par **Brian Carrier** et son équipe **Sleuth Kit Labs** (anciennement Basis Technology). Autopsy est utilisé par les forces de l'ordre, l'armée, et les enquêteurs corporate pour reconstituer **ce qui s'est passé sur un ordinateur** : récupération de fichiers supprimés, analyse de l'historique de navigation, du registre Windows, des emails, des smartphones, etc.
>
> Dépôt officiel : <https://github.com/sleuthkit/autopsy>
> Site officiel : <https://www.autopsy.com>
> Documentation : <https://sleuthkit.org/autopsy/docs/user-docs/>
> Licence : **Apache 2.0**
> Version stable actuelle : **4.23.0**

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Cas d'usage typiques](#2-cas-dusage-typiques)
3. [Prérequis système](#3-prérequis-système)
4. [Installation sous Windows](#4-installation-sous-windows)
5. [Installation sous Linux](#5-installation-sous-linux)
6. [Installation sous macOS](#6-installation-sous-macos)
7. [Premiers pas : créer un cas](#7-premiers-pas--créer-un-cas)
8. [Ajouter une source de données](#8-ajouter-une-source-de-données)
9. [Les modules d'ingestion (Ingest Modules)](#9-les-modules-dingestion-ingest-modules)
10. [Interface d'analyse : prise en main](#10-interface-danalyse--prise-en-main)
11. [Fonctionnalités avancées](#11-fonctionnalités-avancées)
12. [Générer un rapport](#12-générer-un-rapport)
13. [Forces d'Autopsy](#13-forces-dautopsy)
14. [Faiblesses et limites](#14-faiblesses-et-limites)
15. [Bonnes pratiques](#15-bonnes-pratiques)
16. [Ressources utiles](#16-ressources-utiles)

---

## 1. Présentation générale

Autopsy est une **application graphique Java** (basée sur la plateforme **NetBeans RCP**) qui orchestre **The Sleuth Kit** et de nombreux autres outils forensiques (Tesseract OCR, RegRipper, Solr, Tika, GStreamer, YARA, aLEAPP, iLEAPP…). Sa philosophie repose sur trois piliers :

- **Plug-and-play** : installeur Windows tout-en-un avec assistants pas à pas.
- **Architecture modulaire** : **modules d'ingestion** extensibles en **Java ou Python (Jython)**.
- **Plateforme « bout-en-bout »** : de l'acquisition (via Sleuth Kit) jusqu'au **rapport HTML/Excel** prêt à transmettre.

Autopsy est **gratuit**, ce qui en fait un concurrent direct des solutions commerciales (EnCase, FTK, X-Ways, Magnet AXIOM) à plusieurs milliers d'euros la licence. Il est largement utilisé en **formation universitaire** en cybersécurité, et reconnu en cour de justice dans de nombreux pays.

Le projet est lié à **Cyber Triage**, le produit **commercial** de Sleuth Kit Labs pour la réponse à incident — mais Autopsy reste **100 % gratuit et open source** sous Apache 2.0.

### Formats supportés

- **Images disques** : RAW/DD, **E01/EWF** (EnCase), L01, AFF, VMDK, VHD, **VHDX**, ISO
- **BitLocker** (Windows uniquement)
- **Fichiers logiques** : dossiers, fichiers individuels
- **Stockage local** : disques physiques directement connectés
- **Backups** : sources Android et iOS via aLEAPP/iLEAPP

---

## 2. Cas d'usage typiques

- **Analyse post-incident** d'un poste de travail compromis (ransomware, malware).
- **Investigation judiciaire** sur un disque saisi (fraude, harcèlement, contenu illicite).
- **Récupération de fichiers supprimés** (data carving) sur une carte mémoire ou un SSD.
- **Analyse du registre Windows** via RegRipper intégré.
- **Reconstitution de l'historique web** (Chrome, Firefox, Edge, Safari, Opera).
- **Extraction des emails** depuis fichiers MBOX, PST, OST.
- **Analyse de smartphones Android** via le module aLEAPP intégré.
- **Recherche par mots-clés** indexée avec Solr/Lucene.
- **Timeline forensique** chronologique de tous les événements du disque.
- **Enseignement** : c'est l'outil de référence dans la plupart des cursus de forensique numérique.

---

## 3. Prérequis système

### Matériel recommandé

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| RAM | 8 Go | **16-32 Go** |
| CPU | 4 cœurs | 8+ cœurs |
| Stockage | 50 Go libres | **SSD 250+ Go** |
| OS | Windows 10 64 bits | Identique ou Linux récent |

### Logiciels embarqués

L'installeur Windows fournit **tout en un seul package** (~1,3 Go). Pas besoin d'installer Java ou autres dépendances manuellement. Sont inclus :

- **JRE 17** (Java Runtime)
- **NetBeans 15 RCP**
- **The Sleuth Kit**
- **Apache Solr + Lucene + Tika** (indexation et recherche full-text)
- **GStreamer** (lecture vidéo)
- **Tesseract 5** (OCR)
- **RegRipper** (analyse du registre Windows)
- **libewf, zlib** (lecture E01)
- **aLEAPP, iLEAPP** (analyse Android/iOS)

---

## 4. Installation sous Windows

C'est la plateforme **la mieux supportée**. L'installation est triviale.

### Étape 1 : télécharger l'installeur

1. Rends-toi sur la page de téléchargement officielle : <https://www.autopsy.com/download/>
2. Télécharge **`autopsy-4.23.0-64bit.msi`** (~1,3 Go).
3. Vérifie la signature `.asc` si tu veux être rigoureux :
   ```powershell
   gpg --verify autopsy-4.23.0-64bit.msi.asc autopsy-4.23.0-64bit.msi
   ```

### Étape 2 : installation

1. Lance le `.msi` en double-cliquant.
2. L'assistant te guide pas à pas (chemin d'installation par défaut : `C:\Program Files\Autopsy-4.23.0`).
3. **Aucune configuration manuelle de dépendances n'est nécessaire** — tout est embarqué.

### Étape 3 : premier lancement

Lance Autopsy depuis le menu Démarrer. La fenêtre d'accueil te propose :

- **New Case** : créer un nouveau cas.
- **Open Recent Case** : reprendre un cas existant.
- **Open Case** : ouvrir un cas archivé.

---

## 5. Installation sous Linux

L'installation Linux fonctionne mais est **moins polie** que sous Windows. Il existe un **script d'installation officiel** qui gère les dépendances.

### Méthode 1 : script officiel (recommandé)

```bash
# 1. Télécharger l'archive Linux
wget https://github.com/sleuthkit/autopsy/releases/download/autopsy-4.23.0/autopsy-4.23.0.zip

# 2. Décompresser
unzip autopsy-4.23.0.zip
cd autopsy-4.23.0

# 3. Lancer le script d'installation des prérequis
sudo bash linux_macos_install_scripts/install_prereqs_ubuntu.sh

# 4. Lancer Autopsy
bash bin/autopsy
```

Le script gère automatiquement : OpenJDK 17, The Sleuth Kit, libewf, gstreamer, etc.

### Méthode 2 : paquet Snap

```bash
sudo snap install autopsy
```

> ⚠️ La version snap peut avoir du retard sur la dernière release officielle.

### Méthode 3 : Kali Linux

Kali fournit Autopsy dans ses dépôts, mais il s'agit d'une **ancienne version 2.x** (interface web) — à **éviter**. Préfère l'installation manuelle Autopsy 4.x ci-dessus.

```bash
# À NE PAS UTILISER pour la version moderne :
sudo apt install autopsy   # ← version 2.x obsolète
```

---

## 6. Installation sous macOS

Le support macOS est **expérimental**. Méthode officielle :

```bash
# 1. Installer Homebrew si nécessaire
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Télécharger Autopsy
wget https://github.com/sleuthkit/autopsy/releases/download/autopsy-4.23.0/autopsy-4.23.0.zip
unzip autopsy-4.23.0.zip
cd autopsy-4.23.0

# 3. Lancer le script de prérequis pour macOS
bash linux_macos_install_scripts/install_prereqs_macos.sh

# 4. Lancer
bash bin/autopsy
```

> ⚠️ Certaines fonctionnalités (Solr en cluster, BitLocker) ne sont pas disponibles sur macOS.

---

## 7. Premiers pas : créer un cas

À l'écran d'accueil, clique sur **« New Case »**.

### Assistant de création

**Étape 1 : Case Information**

- **Case Name** : nom du dossier (sans espaces, ex. `Affaire_2026_001`).
- **Base Directory** : répertoire racine où le cas sera stocké. **Idéalement sur un SSD rapide, hors antivirus.**
- **Case Type** :
  - **Single-User** : un seul analyste, le plus courant.
  - **Multi-User** : collaboration en réseau, nécessite Solr cluster + PostgreSQL + ActiveMQ. Pour les grandes équipes.

**Étape 2 : Optional Information**

- **Case Number** : référence interne (ex. numéro de réquisition).
- **Examiner** : nom, téléphone, email de l'analyste — **important pour la chaîne de preuve**.

Clique sur **Finish**. Autopsy crée la structure du cas et te propose d'ajouter une source de données.

---

## 8. Ajouter une source de données

L'écran **« Add Data Source »** propose 4 types de sources :

| Type | Quand l'utiliser |
|------|------------------|
| **Disk Image or VM File** | Image E01, DD, VMDK, VHD, VHDX (le cas le plus courant) |
| **Local Disk** | Disque physique branché en USB / SATA (live analysis) |
| **Logical Files** | Dossier ou fichiers individuels (pas un système de fichiers complet) |
| **Unallocated Space Image File** | Image d'espace non alloué (pour carving) |
| **Autopsy Logical Imager Results** | Résultats du Logical Imager (outil de triage Autopsy) |

### Workflow type avec une image E01

1. Sélectionne **Disk Image or VM File**, clique **Next**.
2. **Path** : chemin vers ton fichier `.E01` (ou `.dd`).
3. **Time Zone** : fuseau d'origine de la machine (crucial pour les **systèmes FAT** qui ne stockent pas le fuseau).
4. **Sector Size** : `Auto Detect` dans 99 % des cas.
5. **Hash values** : possibilité de fournir MD5/SHA-1/SHA-256 connus pour vérifier l'intégrité.
6. Clique **Next** → tu arrives à la sélection des **modules d'ingestion**.

---

## 9. Les modules d'ingestion (Ingest Modules)

C'est **le cœur** d'Autopsy. Chaque module analyse automatiquement les fichiers et produit des artefacts visibles dans l'arbre de résultats.

### Modules principaux (cochés par défaut)

| Module | Rôle |
|--------|------|
| **Recent Activity** | Historique web, registre Windows (RegRipper), comptes utilisateurs, programmes installés, périphériques USB |
| **Hash Lookup** | Compare les hashes des fichiers à des bases (NSRL, hashes connus malveillants, hashes utilisateur) |
| **File Type Identification** | Détection MIME (au-delà de l'extension) |
| **Extension Mismatch Detector** | Détecte les fichiers renommés (ex. `.exe` masqué en `.jpg`) |
| **Embedded File Extractor** | Décompresse ZIP, RAR, 7z, archives imbriquées récursivement |
| **Picture Analyzer** | EXIF, conversion HEIC → JPG, métadonnées photos |
| **Keyword Search** | Indexation full-text via Solr/Lucene, regex prédéfinies (emails, IP, URL, cartes bancaires…) |
| **Email Parser** | MBOX, PST, OST, EML |
| **Encryption Detection** | Détecte fichiers chiffrés (test d'entropie + signatures) |
| **Interesting Files Identifier** | Règles personnalisées (ex. « tout fichier `.pdf` > 10 Mo dans `Téléchargements` ») |
| **Central Repository** | Corrélation inter-cas (fichiers/comptes vus dans plusieurs enquêtes) |
| **PhotoDNA** | Détection CSAM (réservé forces de l'ordre, nécessite licence Microsoft) |
| **Android Analyzer (aLEAPP)** | Parse les artefacts Android (SMS, apps, contacts…) |
| **iOS Analyzer (iLEAPP)** | Parse les artefacts iOS |
| **YARA** | Recherche par règles YARA (intrusion, DFIR) |
| **Data Source Integrity** | Calcule et vérifie les hashes de l'image |
| **Plaso** | Génère une super-timeline (intégration optionnelle) |
| **Drone Analyzer** | Parse les fichiers `.dat` de drones DJI |
| **GPX Parser** | Tracks/routes GPS au format GPX |

### Choisir les bons modules

- Pour un **triage rapide** : décoche Keyword Search (le plus lent), garde Recent Activity + Hash Lookup.
- Pour une **analyse complète** : tout activer, sauf PhotoDNA si pas concerné.
- Pour un **gros disque** : utilise le mode **« Keyword Search sans indexation Solr »** (introduit en 4.21) pour un ingest plus rapide quand peu de recherches sont prévues.

Clique sur **Next**, puis **Finish**. L'ingest démarre — la barre de progression s'affiche en bas à droite. **Tu peux commencer à analyser les premiers résultats avant la fin du traitement** (streaming).

---

## 10. Interface d'analyse : prise en main

L'interface se divise en 4 zones principales :

```
┌─────────────────┬──────────────────────────────────┐
│                 │                                  │
│  ARBRE          │  TABLEAU DE RÉSULTATS            │
│  (à gauche)     │  (en haut à droite)              │
│                 │                                  │
│  • Data Sources ├──────────────────────────────────┤
│  • Views        │                                  │
│  • Results      │  VISIONNEUSE DE CONTENU          │
│  • Tags         │  (en bas à droite)               │
│  • Reports      │  Hex / Strings / Application /   │
│                 │  File Metadata / Results / OS    │
└─────────────────┴──────────────────────────────────┘
```

### Arbre de navigation (gauche)

- **Data Sources** : navigation hiérarchique du système de fichiers, dossier par dossier.
- **Views** : tri par type de fichier (Images, Vidéos, Documents, Exécutables, Archives), par MIME, par taille, par date.
- **Results** : tous les artefacts extraits par les modules (Web History, Bookmarks, Cookies, Installed Programs, USB Device Attached, Email Messages, Calls, Messages, Geolocation, EXIF Metadata…).
- **Tags** : tes propres marquages (« Bookmark », « Suspicieux », « Pertinent », tags personnalisés).
- **Reports** : rapports générés.

### Tableau de résultats (haut droite)

Liste les items du nœud sélectionné. Colonnes triables, filtrables. Double-clic pour ouvrir un fichier dans la visionneuse.

### Visionneuse (bas droite)

Plusieurs onglets selon le type de fichier :

- **Hex** : vue hexadécimale (très utile pour fichiers corrompus).
- **Strings** : extraction de chaînes ASCII/Unicode.
- **Application** : aperçu natif (image, vidéo, PDF, HTML rendu).
- **Metadata** : métadonnées TSK + EXIF + autres.
- **Results** : artefacts associés (ex. URL d'où provient un fichier téléchargé).
- **Context** : d'où vient le fichier (message email parent, URL de téléchargement).
- **Other Occurrences** : ce fichier a-t-il été vu dans d'autres cas du Central Repository ?

### Recherche de mots-clés

Bouton **« Keyword Search »** en haut à droite. Tu peux :

- Chercher un mot exact dans tout l'index.
- Utiliser une **liste de mots-clés** (créée en amont, ex. liste « termes financiers »).
- Utiliser une **regex** (cartes bancaires, IBAN, IPs, emails…).
- Les résultats s'affichent en temps réel **pendant l'ingest** — pas besoin d'attendre la fin.

---

## 11. Fonctionnalités avancées

### Timeline

**Tools → Timeline**. Affiche tous les événements du disque (créations, modifications, accès, événements web, registres, etc.) sur une chronologie interactive :

- Vue par **comptage** (histogramme).
- Vue **détaillée** événement par événement.
- Vue **liste** chronologique.
- Filtrage par type d'événement, par source, par mot-clé.

### Geolocation

**Tools → Geolocation**. Affiche sur une **carte** tous les artefacts géolocalisés : EXIF photos, tracks GPX, points DJI drone, données de routage cellulaire, etc.

### Communications

**Tools → Communications**. Visualise sous forme de **graphe** les communications (appels, SMS, emails, WhatsApp si Android Analyzer activé). Identifie rapidement les contacts récurrents.

### Image Gallery

**Tools → Image/Video Gallery**. Galerie thumbnails de toutes les images et vidéos, classables par dossier ou par EXIF.

### Hash Sets

**Tools → Options → Hash Sets**. Importe des bases de hashes au format **HashKeeper, NSRL, IDX, ou CSV** :

- **Known Good** (ex. NSRL) : ignore ces fichiers (gain de temps énorme).
- **Known Bad** : alerte automatique si trouvés.

### Central Repository

**Tools → Options → Central Repository**. Base de données partagée (SQLite locale ou PostgreSQL réseau) qui stocke les artefacts vus dans tes cas passés. Permet :

- **Corrélation inter-cas** : « ce hash a été vu dans 3 enquêtes précédentes ».
- **Personas** : regrouper plusieurs comptes (email, téléphone, pseudo) sous un même identité.

### Portable Cases

**File → Export → Portable Case**. Crée un cas **autonome avec uniquement les éléments marqués (tags)** — pratique pour transmettre à un magistrat ou collègue, sans partager toute l'image disque.

### Multi-User

Pour les **grandes équipes** : Solr + PostgreSQL + ActiveMQ permettent à **plusieurs analystes** de travailler en simultané sur le même cas. Configuration complexe, à réserver aux structures dotées d'un SI dédié.

### Mode CLI (sans interface)

```bash
autopsy --nogui --runFromCommandLine ...
```

Permet d'**automatiser** un cas (ingest, rapport) dans un pipeline.

### Logical Imager

Outil **séparé** de Sleuth Kit Labs pour **acquérir** rapidement les fichiers pertinents d'un poste live (à la place d'imager tout le disque). Résultats directement importables dans Autopsy.

---

## 12. Générer un rapport

**Generate Report** dans la barre d'outils, ou **Tools → Generate Report**.

Formats disponibles :

- **HTML** : rapport interactif consultable dans un navigateur.
- **Excel (XLSX)** : tableaux exploitables.
- **KML** : géolocalisation visualisable dans Google Earth.
- **Files Body File** : pour les outils de timeline externes (Plaso, mactime).
- **Portable Case** : voir section précédente.
- **STIX** : indicateurs au format STIX (intégration threat intelligence).
- **TSK Body File** : compatible mactime.

Tu choisis :

- Les **catégories d'artefacts** à inclure (Recent Activity, Hashes, Web History, etc.).
- Les **éléments marqués** uniquement (par tags) ou tout le cas.

Le rapport est généré dans le dossier du cas, sous `Reports/`.

---

## 13. Forces d'Autopsy

✅ **Gratuit et open source** (Apache 2.0), aucune licence à payer — alternative crédible à **EnCase**, **FTK**, **X-Ways**, **Magnet AXIOM** (qui coûtent 3 000-10 000 €/an).

✅ **Interface graphique mature et stable**, contrairement à beaucoup d'outils forensiques open source qui sont en ligne de commande.

✅ **Installation Windows en un clic** : tout est embarqué dans le MSI (Java, dépendances, modules).

✅ **Documentation officielle complète** : <https://sleuthkit.org/autopsy/docs/user-docs/>

✅ **Communauté énorme et active** : utilisé dans toutes les formations universitaires en cybersécurité, abondamment couvert sur YouTube, Medium, blogs.

✅ **Architecture extensible** : modules Java ou Python (Jython), nombreux modules tiers (regripper, aLEAPP, iLEAPP, YARA, drone analyzer…).

✅ **Streaming ingest** : les résultats s'affichent **pendant** le traitement — tu n'attends pas la fin pour commencer l'analyse.

✅ **Très large catalogue de parsers** : web (Chrome, Firefox, Edge, Safari, Opera, Brave), email (PST, OST, MBOX), registre (RegRipper), Android (aLEAPP), iOS (iLEAPP), drones DJI, GPX, etc.

✅ **Rapports prêts à transmettre** en HTML/Excel/KML.

✅ **Multi-utilisateurs** pour les grosses équipes (rare en open source).

✅ **Central Repository** pour la corrélation inter-cas.

✅ **Reconnu dans les procédures judiciaires** dans de nombreux pays.

✅ **Cyber Triage** (frère commercial) montre que l'équipe Sleuth Kit Labs vit du sujet et investit durablement dans le projet.

✅ **Support BitLocker** (depuis 4.22), **HEIC**, **VHDX**, langues asiatiques (japonais avec Kuromoji)…

✅ **Localisation française partielle** disponible.

---

## 14. Faiblesses et limites

❌ **Performance moyenne sur très gros cas** : sur des images > 1 To ou des cas multi-disques, **IPED** ou les solutions commerciales (X-Ways en particulier) sont nettement plus rapides.

❌ **Consommation mémoire Java parfois lourde** : la JVM peut consommer beaucoup de RAM. Pour les gros cas, éditer `autopsy.conf` pour augmenter le heap (`-J-Xmx16g` par exemple).

❌ **Indexation Solr lente** : sur des centaines de Go, l'ingest avec Keyword Search activé peut durer **plusieurs heures voire jours**.

❌ **Plantages occasionnels** sur fichiers corrompus ou très volumineux (bien que la stabilité ait beaucoup progressé en 4.x).

❌ **Support Linux/macOS en retrait** : tout fonctionne, mais avec des bugs spécifiques et une expérience moins polie qu'avec Windows.

❌ **Pas de support natif mobile complet** : contrairement à Magnet AXIOM ou Cellebrite, Autopsy ne **fait pas** d'extraction mobile — il **analyse** des extractions faites par d'autres outils (via aLEAPP/iLEAPP).

❌ **Anciennes versions encore référencées** : la version 2.x (interface web) est encore packagée par Kali Linux et certains tutos en ligne ; il faut bien viser la **4.x**.

❌ **Multi-utilisateurs complexe à déployer** : Solr + PostgreSQL + ActiveMQ + serveur de fichiers partagé — pas pour une PME sans IT dédiée.

❌ **Pas de cas portables zéro-installation comme IPED** : pour transmettre un cas, il faut soit le portable case (limité aux items marqués), soit que le destinataire installe aussi Autopsy.

❌ **Carving moins puissant qu'IPED** : Autopsy utilise PhotoRec en interne, mais avec moins d'optimisation et de formats que le moteur natif d'IPED.

❌ **Pas d'analyse de RAM** : pour les dumps mémoire, il faut passer par **Volatility** (outil séparé).

❌ **Recherche par similarité d'images / reconnaissance faciale** : pas natifs, contrairement à IPED ou aux solutions commerciales (sauf via modules tiers payants).

❌ **PhotoDNA réservé aux forces de l'ordre** + nécessite une licence Microsoft.

❌ **Modules Python (Jython)** : limités à **Python 2.7**, pas de support natif Python 3 ou des bibliothèques modernes (numpy, pandas) — frustrant pour les développeurs de modules.

❌ **Cyber Triage** (sibling commercial) capte progressivement des fonctionnalités haut de gamme — risque à long terme que le projet Autopsy ouvert plafonne en faveur du produit payant.

---

## 15. Bonnes pratiques

🔹 **Toujours travailler sur une copie de l'image disque**, jamais sur le support original (respect de la chaîne de preuve).

🔹 **Vérifier l'intégrité** : fournir le hash MD5/SHA-256 connu de l'image lors de l'ajout de source, et activer le module **Data Source Integrity**.

🔹 **Documenter chaque cas** : nom d'examinateur, numéro de réquisition, version Autopsy (`Help → About`), date, time zone d'origine.

🔹 **Stocker le dossier du cas sur un SSD rapide**, hors antivirus (le service Microsoft Defender peut diviser les performances par 5).

🔹 **Importer la base NSRL** dès le départ comme « Known Good » — gain de temps massif sur les images Windows.

🔹 **Désactiver Keyword Search si tu ne prévois pas de chercher par texte** — c'est le module le plus lent.

🔹 **Activer le streaming** : commence à explorer les artefacts pendant l'ingest.

🔹 **Tagger systématiquement** les items pertinents — ils alimentent le rapport et les portable cases.

🔹 **Sauvegarder régulièrement** les tags et bookmarks (`File → Export Tags`).

🔹 **Augmenter le heap Java** sur les gros cas :
```ini
# Dans etc/autopsy.conf, ligne default_options=
default_options="--branding autopsy -J-Xms24m -J-Xmx16g"
```

🔹 **Tenir à jour la version** : Sleuth Kit Labs corrige régulièrement des CVE dans les libs tierces (consulter `Releases` sur GitHub).

🔹 **Utiliser le Central Repository** dès qu'on dépasse quelques cas — la corrélation inter-cas est précieuse.

🔹 **Combiner Autopsy avec d'autres outils** : Volatility pour la RAM, KAPE pour le triage rapide, Plaso pour les super-timelines complexes, YARA pour le hunting.

🔹 **Former l'équipe** : la formation officielle « Autopsy Basics » (8 h, payante) de Sleuth Kit Labs vaut largement son prix pour une équipe pro.

---

## 16. Ressources utiles

### Officielles

- 📚 **Site officiel** : <https://www.autopsy.com>
- 📚 **Téléchargement** : <https://www.autopsy.com/download/>
- 📚 **Documentation utilisateur** : <https://sleuthkit.org/autopsy/docs/user-docs/>
- 📚 **Documentation développeur (modules)** : <https://sleuthkit.org/autopsy/docs/api-docs/>
- 📚 **Dépôt GitHub** : <https://github.com/sleuthkit/autopsy>
- 📚 **Releases** : <https://github.com/sleuthkit/autopsy/releases>
- 📚 **Sleuth Kit (TSK)** : <https://www.sleuthkit.org>
- 🎓 **Formations officielles** : <https://training.sleuthkitlabs.com>
- 📺 **Chaîne YouTube** : <https://www.youtube.com/@AutopsyForensics>

### Données de test

- 🧪 **NIST CFReDS** (Computer Forensic Reference Data Sets) : <https://cfreds.nist.gov> — **images de test légales** parfaites pour s'entraîner.
- 🧪 **Digital Corpora** : <https://digitalcorpora.org> — corpus académique public.
- 🧪 **NSRL** (National Software Reference Library) : <https://www.nist.gov/itl/ssd/software-quality-group/national-software-reference-library-nsrl> — base de hashes « known good ».

### Modules tiers et écosystème

- 🔧 **aLEAPP / iLEAPP** (Android/iOS Logs Events And Properties Parser) : <https://github.com/abrignoni>
- 🔧 **RegRipper** (analyse registre Windows) : <https://github.com/keydet89/RegRipper3.0>
- 🔧 **Volatility 3** (RAM) : <https://github.com/volatilityfoundation/volatility3>
- 🔧 **Plaso/log2timeline** (super-timeline) : <https://github.com/log2timeline/plaso>
- 🔧 **KAPE** (triage Windows) : <https://www.kroll.com/kape>
- 🔧 **Cyber Triage** (frère commercial DFIR) : <https://www.cybertriage.com>

### Communauté

- 💬 **Forum sleuthkit-users** : <https://www.sleuthkit.org/support.php>
- 💬 **GitHub Discussions/Issues** : <https://github.com/sleuthkit/autopsy/issues>
- 💬 **Subreddit DFIR** : <https://www.reddit.com/r/computerforensics>

---

## Conclusion

Autopsy est sans doute **la porte d'entrée par excellence** dans la forensique numérique moderne. Sa **gratuité**, sa **maturité**, son **interface graphique soignée** et la **richesse de son écosystème** en font un choix évident pour :

- Les **étudiants** en cybersécurité.
- Les **enquêteurs corporate** sans budget pour EnCase/FTK.
- Les **petites unités d'investigation** des forces de l'ordre.
- Les **chercheurs et formateurs** qui ont besoin d'un outil reproductible.

Pour les **gros volumes** (multi-téraoctets, millions d'items), **IPED** ou **X-Ways** peuvent s'avérer plus performants. Pour la **réponse à incident live**, **Velociraptor** ou **KAPE** sont plus adaptés. Pour le **mobile**, **Cellebrite** ou **Magnet AXIOM** restent incontournables. Mais pour la **majorité des cas d'analyse disque** — disques durs, clés USB, cartes SD, images de machines virtuelles — Autopsy fait le travail, bien, et gratuitement.

Pour bien démarrer, je recommande de :

1. Installer Autopsy 4.23 sous Windows (la voie la plus simple).
2. Télécharger une **image de test NIST CFReDS** (par exemple `data_leakage_case` ou `nps-2009-canon2`).
3. Suivre le **QuickStart Guide** fourni avec l'installeur.
4. Importer la **NSRL** comme hash set « Known Good ».
5. Faire une analyse complète, puis explorer chaque catégorie d'artefacts dans l'arbre Results.
6. Générer un rapport HTML pour comprendre la structure de livrable.
7. Suivre la formation officielle **Autopsy Basics** quand tu es prêt à passer en production.

Bonnes investigations ! 🔍🖥️
