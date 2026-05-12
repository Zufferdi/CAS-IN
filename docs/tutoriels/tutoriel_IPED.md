# Tutoriel complet IPED — Indexador e Processador de Evidências Digitais

> **IPED** (*Indexador e Processador de Evidências Digitais*) est un logiciel **open source** de **forensique numérique**, développé depuis 2012 par les experts de la Police Fédérale Brésilienne, et rendu publiquement disponible en 2019. Il permet de **traiter et analyser des preuves numériques** saisies sur scène de crime ou collectées lors d'investigations privées en entreprise.
>
> Dépôt officiel : <https://github.com/sepinf-inc/IPED>
> Licence : open source (voir `LICENSE.txt` du dépôt)

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Cas d'usage typiques](#2-cas-dusage-typiques)
3. [Prérequis système](#3-prérequis-système)
4. [Installation sous Windows](#4-installation-sous-windows)
5. [Installation sous Linux](#5-installation-sous-linux)
6. [Compilation depuis les sources](#6-compilation-depuis-les-sources)
7. [Configuration initiale](#7-configuration-initiale)
8. [Premier cas pratique : traiter une image disque](#8-premier-cas-pratique--traiter-une-image-disque)
9. [Interface d'analyse : prise en main](#9-interface-danalyse--prise-en-main)
10. [Fonctionnalités avancées](#10-fonctionnalités-avancées)
11. [Profils de traitement](#11-profils-de-traitement)
12. [Forces d'IPED](#12-forces-diped)
13. [Faiblesses et limites](#13-faiblesses-et-limites)
14. [Bonnes pratiques](#14-bonnes-pratiques)
15. [Ressources utiles](#15-ressources-utiles)

---

## 1. Présentation générale

IPED est un outil **multiplateforme** (Windows et Linux) écrit principalement en **Java**, dont la philosophie repose sur trois piliers :

- **Performance** : capable de traiter jusqu'à **400 Go/h** sur matériel moderne, et de gérer des cas contenant **plus de 135 millions d'items**.
- **Stabilité** : décodage des systèmes de fichiers et parsing des fichiers exécutés **hors processus principal** pour éviter les plantages globaux.
- **Portabilité** : les cas produits sont **portables**, ils s'ouvrent depuis un disque amovible **sans installation**.

L'outil s'appuie sur la **bibliothèque Sleuthkit** pour décoder les images disques et systèmes de fichiers. Formats supportés en lecture :

`RAW/DD`, `E01`, `EX01`, `AFF`, `ISO9660`, `VHD`, `VHDX`, `VMDK`, `UDF`, `AD1` (AccessData), `UFDR` (Cellebrite).

---

## 2. Cas d'usage typiques

- Analyse d'un disque dur saisi (image E01 ou DD).
- Extraction et indexation des conversations WhatsApp, Telegram, Skype, etc.
- Recherche de **cartes bancaires, emails, URL, wallets crypto** par expressions régulières.
- Recherche d'images similaires ou de **reconnaissance faciale**.
- Récupération de fichiers supprimés via **data carving**.
- **Géolocalisation** d'évidences via métadonnées GPS.
- **Transcription audio** automatique de conversations vocales.
- Analyse de **lignes du temps** (timeline) corrélée multi-suspects.

---

## 3. Prérequis système

### Matériel recommandé

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| RAM | 8 Go | 32 Go ou plus |
| CPU | 4 cœurs | 8+ cœurs (multithread important) |
| Stockage temporaire | HDD | **SSD rapide impératif** |
| OS | Windows 10 / Linux 64 bits | Identique |

### Logiciels nécessaires

- **Java JDK 11 + JavaFX** (par exemple **Liberica OpenJDK 11 Full JDK**) — indispensable.
- Sous Linux : `git`, `maven`, plus dépendances spécifiques pour Sleuthkit (voir section 5).
- Pour compiler depuis les sources : `git` et `maven`.

> ⚠️ Java 11 **avec JavaFX intégré** est requis. Une JDK 11 standard sans JavaFX ne suffit pas.

---

## 4. Installation sous Windows

### Méthode rapide : binaires précompilés

1. Rends-toi sur la **page des releases** : <https://github.com/sepinf-inc/IPED/releases>
2. Télécharge la dernière version stable (par exemple `iped-X.X.X.zip`).
3. **Décompresse** l'archive dans un dossier de ton choix, par exemple `C:\Forensic\IPED\`.
4. Aucune installation requise : IPED est **portable**.
5. Vérifie la présence du fichier `iped.exe` à la racine du dossier décompressé.

### Test de fonctionnement

Ouvre une invite de commande dans le dossier IPED et tape :

```bat
iped.exe --help
```

Tu dois voir la liste de toutes les options de ligne de commande. Si oui, IPED est opérationnel.

---

## 5. Installation sous Linux

L'installation sous Linux demande un peu plus de manipulations car Sleuthkit doit être compilé localement avec ses dépendances.

### Étape 1 : installer Java 11 avec JavaFX

```bash
# Exemple avec Liberica OpenJDK Full
wget https://download.bell-sw.com/java/11.0.x+x/bellsoft-jdk11.0.x+x-linux-amd64-full.tar.gz
tar -xzf bellsoft-jdk11*.tar.gz
sudo mv jdk-11* /opt/
export JAVA_HOME=/opt/jdk-11.x.x-full
export PATH=$JAVA_HOME/bin:$PATH
```

Vérifie :

```bash
java -version
```

### Étape 2 : installer les dépendances système

Sous Ubuntu/Debian :

```bash
sudo apt update
sudo apt install -y git maven build-essential autoconf libtool \
  libafflib-dev libewf-dev libssl-dev libsqlite3-dev zlib1g-dev \
  libbz2-dev libvhdi-dev libvmdk-dev
```

### Étape 3 : compiler Sleuthkit

Suis les instructions détaillées de la page wiki **Linux** : <https://github.com/sepinf-inc/IPED/wiki/Linux>

En résumé :

```bash
git clone https://github.com/sleuthkit/sleuthkit.git
cd sleuthkit
./bootstrap
./configure
make
sudo make install
sudo ldconfig
```

### Étape 4 : exécuter IPED

Sous Linux, on utilise `iped.jar` au lieu de `iped.exe` :

```bash
java -jar iped.jar --help
```

---

## 6. Compilation depuis les sources

Si tu veux compiler la dernière version (ou contribuer au projet) :

```bash
git clone https://github.com/sepinf-inc/IPED.git
cd IPED
mvn clean install
```

Le binaire compilé apparaîtra dans `target/release`.

> ⚠️ La branche `master` par défaut est la **branche de développement, instable**. Pour une version stable, **checkout un tag de release** après le clone :
>
> ```bash
> git checkout tags/4.3.0
> ```

---

## 7. Configuration initiale

Avant le premier lancement, configure le fichier **`LocalConfig.txt`** situé à la racine d'IPED. Il décrit l'environnement de ta machine.

### Paramètre clé : `indexTemp`

```ini
indexTemp = default
```

Ce dossier reçoit toutes les données temporaires durant le traitement.

**Recommandations critiques** :

- Place ce dossier sur un **volume différent de l'OS**.
- Idéalement un **SSD rapide** ; dans ce cas active aussi :
  ```ini
  indexTempOnSSD = true
  ```
- **Exclus ce dossier de l'antivirus**, de l'indexation Windows et des snapshots (Shadow Copy, Time Machine, etc.) — ces services ralentissent énormément le traitement.
- Sous Windows, double les antislashs : `indexTemp = D:\\IPED_TEMP`

### Autres fichiers de configuration

- `IPEDConfig.txt` : options de traitement (hash, OCR, carving, regex, etc.).
- Profils prédéfinis : `forensic`, `pedo` (CSAM), `triage`, `fastmode`, `blind`.

---

## 8. Premier cas pratique : traiter une image disque

### Commande de base

```bat
iped.exe -d image.dd -o output
```

- `-d image.dd` : chemin vers l'image disque à traiter.
- `-o output` : dossier de sortie (doit être **vide ou inexistant**).

### Spécifier un fuseau horaire (FAT)

Pour les systèmes de fichiers **FAT** (qui ne stockent pas le fuseau) :

```bat
iped.exe -d image.dd -tz GMT-3 -o output
```

Par défaut, IPED utilise le fuseau horaire local.

### Ajouter un alias à l'image

```bat
iped.exe -d image.dd -dname "PC_Suspect_01" -o output
```

### Traiter plusieurs images dans le même cas

```bat
iped.exe -d image1.dd -d image2.dd -o output
```

### Ajouter une image à un cas existant

```bat
iped.exe -d image3.dd -o output --append
```

### Reprendre un traitement interrompu

```bat
iped.exe -d image.dd -o output --continue
```

Ou tout recommencer :

```bat
iped.exe -d image.dd -o output --restart
```

### Liste complète des options

```bat
iped.exe --help
```

---

## 9. Interface d'analyse : prise en main

Une fois le traitement terminé, ouvre l'interface :

- **Windows** : double-clique sur `IPEDSearchApp.exe` dans le dossier de sortie.
- **Linux** :
  ```bash
  java -jar [output]/iped/lib/iped-search-app.jar
  ```

### Vue d'ensemble de l'interface

L'interface est divisée en plusieurs zones :

1. **Arborescence des évidences** (à gauche) : navigation hiérarchique des fichiers et conteneurs.
2. **Onglets de catégorisation** : par type de fichier, métadonnées, regex trouvées, etc.
3. **Tableau de résultats** : liste des items correspondant à la recherche/filtrage en cours.
4. **Visionneuses intégrées** (en bas/droite) : hexadécimal, texte Unicode, métadonnées, vue native du fichier.
5. **Galerie d'images et de vidéos** : aperçus rapides.
6. **Barre de recherche** : indexation full-text à la Lucene/Solr — recherches très rapides.

### Recherches utiles dès le départ

- Recherche full-text simple : tape un mot-clé dans la barre de recherche.
- Recherche par expression régulière : utilise l'onglet **Regex**.
- Filtrer par métadonnée : par exemple `dc:creator:"Jean Dupont"`.
- Marquer (bookmarker) des items intéressants : clic droit → *Bookmark*.

---

## 10. Fonctionnalités avancées

### Hashing et déduplication

Algorithmes supportés : **MD5, SHA-1, SHA-256, SHA-512, eDonkey**. PhotoDNA disponible **uniquement pour les forces de l'ordre** (contact : `iped at pf dot gov dot br`).

Bases de hashes compatibles : **NIST NSRL, NIST CAID, ProjectVIC, Interpol ICSE**, ou format CSV standard.

### Data carving

Moteur de carving qui scanne **bien au-delà de l'espace non alloué**, supporte **plus de 40 formats** dont vidéos, et n'occupe que ~10 % du temps de traitement. Extensible par scripts.

### OCR

Reconnaissance optique de caractères via **Tesseract 5** — précieux pour les images contenant du texte (scans, captures, photos de documents).

### Détection d'entités nommées (NER)

Nécessite le téléchargement des modèles **Stanford CoreNLP**. Permet d'extraire automatiquement personnes, lieux, organisations, etc.

### Reconnaissance faciale

Optimisée pour fonctionner **sans GPU**, avec seuil de similarité configurable. Recherche d'images similaires à partir d'une image interne ou externe.

### Transcription audio

Implémentations **locales** ou **distantes** via Azure et Google Cloud — utile pour les notes vocales WhatsApp et autres enregistrements.

### Recherches regex prédéfinies

Détection automatique de **cartes bancaires, emails, URL, IP, adresses MAC, montants monétaires, wallets Bitcoin/Ethereum/Monero/Ripple**, etc., avec validation par script optionnelle.

### Géolocalisation

Affichage des items géolocalisés sur **Google Maps, Bing Maps ou OpenStreetMaps**.

### Analyse de graphe de communications

Visualisation des liens entre appels, emails, messages instantanés — identification rapide des contacts récurrents.

### Timeline unifiée

Vue tableau et chronologique de tous les événements, filtrable par type d'événement.

### API Web

Recherche à distance, récupération de métadonnées, contenu brut, texte décodé, miniatures, et création de bookmarks via HTTP.

### Scripting

Extensible en **JavaScript** et **Python** (y compris extensions CPython). Intégration de **commandes externes** pour décoder des formats supplémentaires.

---

## 11. Profils de traitement

IPED fournit des profils prêts à l'emploi qu'on sélectionne au lancement :

| Profil | Description |
|--------|-------------|
| `forensic` | Profil par défaut, traitement exhaustif pour expertise complète. |
| `pedo` (CSAM) | Optimisé pour les enquêtes sur contenu pédopornographique : hash, détection nudité, comparaison ProjectVIC. |
| `triage` | Triage rapide pour identifier les disques à analyser en priorité. |
| `fastmode` | Aperçu rapide, désactive carving et OCR. |
| `blind` | Extraction automatique sans interface, pour pipelines. |

Activation via la ligne de commande ou en éditant `IPEDConfig.txt`.

---

## 12. Forces d'IPED

✅ **Gratuit et open source** — alternative crédible à **EnCase**, **FTK** ou **X-Ways Forensics** (qui coûtent plusieurs milliers d'euros par licence).

✅ **Performance remarquable** : jusqu'à **400 Go/h** et **135 millions d'items** par cas. Très bonne parallélisation multithread.

✅ **Stabilité** grâce au décodage hors processus : un fichier corrompu ne fait pas planter tout le traitement.

✅ **Cas portables** : la sortie est autonome, exécutable depuis une clé USB ou un disque externe sans installation.

✅ **Reprise/redémarrage** des traitements interrompus (`--continue` / `--restart`) — précieux sur de très gros cas.

✅ **Très large catalogue de parsers** : WhatsApp, Telegram, Skype, eMule, Shareaza, Ares, Bittorrent, ActivitiesCache, historiques navigateurs (IE, Edge, Firefox, Chrome, Safari), etc.

✅ **Multiformat** : du DD basique au UFDR de Cellebrite.

✅ **Détection de plus de 70 langues** automatiquement.

✅ **Recherche d'images et de visages similaires** sans GPU.

✅ **Extensible** par scripts JavaScript et Python.

✅ **API Web** pour intégration dans des workflows automatisés.

✅ **Communauté active** : ~1500 étoiles sur GitHub, 38+ contributeurs, releases régulières (version majeure 4.3.0 en décembre 2025).

✅ **Reconnu par les forces de l'ordre** : utilisé en production par la Police Fédérale Brésilienne et plusieurs services dans le monde.

---

## 13. Faiblesses et limites

❌ **Courbe d'apprentissage exigeante** : malgré le *Beginner's Start Guide*, la prise en main complète demande du temps. L'interface est dense, beaucoup d'options.

❌ **Documentation parfois lacunaire** : certaines fonctionnalités avancées (NER, scripting, configurations fines) ne sont documentées que dans le wiki ou les commentaires des fichiers de config.

❌ **Dépendance à Java 11 + JavaFX** : version spécifique avec JavaFX requis ; pas trivial à mettre en place sous Linux.

❌ **Installation sous Linux laborieuse** : compilation de Sleuthkit et de plusieurs dépendances natives obligatoire.

❌ **Pas d'interface graphique pour le traitement** : on configure et lance les cas en **ligne de commande**, ce qui peut rebuter les utilisateurs non techniques.

❌ **Consommation de ressources élevée** : RAM et CPU intensifs ; sur cas volumineux, prévoir du matériel sérieux et un **SSD rapide** dédié au `indexTemp`.

❌ **Origine brésilienne, certains messages/parsers d'abord pensés pour le contexte brésilien** : traduction et localisation s'améliorent au fil des versions mais peuvent encore comporter des éléments en portugais.

❌ **Pas de support officiel commercial** : si tu rencontres un bug bloquant, tu dépends de la communauté GitHub (issues + discussions). Pour un usage critique en entreprise, c'est un point à considérer.

❌ **PhotoDNA réservé aux forces de l'ordre** : limitation légale, pas un défaut technique, mais à connaître.

❌ **Pas de support natif d'images chiffrées modernes** sans clé : BitLocker, FileVault, LUKS doivent être déchiffrés en amont (ce qui est vrai aussi pour la plupart des outils concurrents).

❌ **Mises à jour parfois cassantes** : la migration entre versions majeures (par exemple 3.18 → 4.0) demande de relire la doc de migration.

❌ **Reconnaissance faciale et NER** efficaces mais en deçà des solutions commerciales spécialisées qui exploitent GPU et modèles plus récents.

---

## 14. Bonnes pratiques

🔹 **Toujours travailler sur une copie** de l'image disque, jamais sur l'original (respect de la chaîne de preuve).

🔹 **Calculer un hash de l'image originale** avant et après traitement pour prouver l'intégrité.

🔹 **Documenter chaque cas** : alias d'image (`-dname`), fuseau horaire, profil utilisé, version d'IPED.

🔹 **Stocker `indexTemp` sur un SSD dédié**, non monitoré par l'antivirus.

🔹 **Choisir le bon profil** dès le départ — relancer un traitement long juste pour activer une option est coûteux.

🔹 **Utiliser le multicase** pour gérer des dossiers complexes regroupant plusieurs supports.

🔹 **Exploiter les bookmarks** pour structurer ton analyse et préparer les exports HTML/CSV vers le rapport final.

🔹 **Tester d'abord sur un petit échantillon** avant de lancer un traitement de plusieurs téraoctets.

🔹 **Sauvegarder régulièrement les bookmarks et tags** pour ne pas perdre le travail d'analyse.

🔹 **Mettre à jour les bases de hash** (NSRL, ProjectVIC) périodiquement.

🔹 **Apprendre la syntaxe Lucene** pour exploiter pleinement la barre de recherche.

---

## 15. Ressources utiles

- 📚 **Dépôt GitHub** : <https://github.com/sepinf-inc/IPED>
- 📚 **Releases** : <https://github.com/sepinf-inc/IPED/releases>
- 📚 **Wiki officiel** : <https://github.com/sepinf-inc/IPED/wiki>
- 📚 **Beginner's Start Guide** : <https://github.com/lfcnassif/IPED/wiki/Beginner's-Start-Guide>
- 📚 **User Manual** : <https://github.com/lfcnassif/IPED/wiki/User-Manual>
- 📚 **Linux installation** : <https://github.com/lfcnassif/IPED/wiki/Linux>
- 📚 **Performance Tips** : <https://github.com/sepinf-inc/IPED/wiki/Performance-Tips>
- 📚 **Scripting** : <https://github.com/sepinf-inc/IPED/wiki/Scripting>
- 📚 **Troubleshooting** : <https://github.com/sepinf-inc/IPED/wiki/Troubleshooting>
- 💬 **Discussions** : <https://github.com/sepinf-inc/IPED/discussions>
- 🐛 **Issues** : <https://github.com/sepinf-inc/IPED/issues>

---

## Conclusion

IPED est un outil **professionnel et puissant** pour la forensique numérique, qui rivalise sur de nombreux aspects (performance, parsers, indexation, carving) avec les solutions commerciales les plus chères du marché. Son principal atout est d'être **gratuit, open source et activement maintenu**, ce qui le rend particulièrement attractif pour les forces de l'ordre, les chercheurs académiques, les enquêteurs privés à budget modeste, et pour la formation.

Sa **complexité initiale** et son installation un peu rugueuse sous Linux sont les principaux freins. Mais une fois la prise en main effectuée — typiquement après quelques cas pratiques — IPED devient un outil **redoutablement efficace** pour traiter des volumes importants de preuves numériques de manière reproductible.

Pour aller plus loin, je recommande de :

1. Suivre le *Beginner's Start Guide* avec une **image disque de test** (Digital Corpora propose des images publiques).
2. Lire les commentaires de `IPEDConfig.txt` pour comprendre chaque option.
3. Expérimenter avec les **profils** prédéfinis avant de créer le tien.
4. Rejoindre les **Discussions GitHub** pour échanger avec la communauté.

Bonnes investigations ! 🔍
