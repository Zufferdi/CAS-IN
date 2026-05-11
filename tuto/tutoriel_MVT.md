# Tutoriel complet MVT — Mobile Verification Toolkit

> **MVT** (*Mobile Verification Toolkit*) est un ensemble d'utilitaires **open source** développés par l'**Amnesty International Security Lab**, publiés en **juillet 2021** dans le cadre du **Projet Pegasus**. MVT permet d'effectuer l'**analyse forensique consensuelle** de smartphones **iOS et Android** afin de détecter des traces de **compromission par spywares sophistiqués** (Pegasus, Predator, KingSpawn, Operation Triangulation, etc.).
>
> Dépôt officiel : <https://github.com/mvt-project/mvt>
> Documentation : <https://docs.mvt.re>
> Licence : licence personnalisée open source interdisant explicitement l'usage à des fins de **forensique adversariale non consentie**.

> ⚠️ **MVT n'est PAS un outil pour utilisateur final.** C'est un outil d'investigation pour techniciens, enquêteurs et chercheurs en sécurité. Si tu penses être ciblé, contacte plutôt l'[Amnesty Security Lab](https://securitylab.amnesty.org/get-help/) ou la [Digital Security Helpline d'Access Now](https://www.accessnow.org/help/).

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Cas d'usage typiques](#2-cas-dusage-typiques)
3. [Prérequis système](#3-prérequis-système)
4. [Installation sous Linux](#4-installation-sous-linux)
5. [Installation sous macOS](#5-installation-sous-macos)
6. [Installation sous Windows (WSL)](#6-installation-sous-windows-wsl)
7. [Installation via Docker](#7-installation-via-docker)
8. [Télécharger les indicateurs de compromission (IOC)](#8-télécharger-les-indicateurs-de-compromission-ioc)
9. [Workflow iOS : analyse d'un iPhone](#9-workflow-ios--analyse-dun-iphone)
10. [Workflow Android : analyse via AndroidQF](#10-workflow-android--analyse-via-androidqf)
11. [Lire et interpréter les résultats](#11-lire-et-interpréter-les-résultats)
12. [Forces de MVT](#12-forces-de-mvt)
13. [Faiblesses et limites](#13-faiblesses-et-limites)
14. [Bonnes pratiques](#14-bonnes-pratiques)
15. [Ressources utiles](#15-ressources-utiles)

---

## 1. Présentation générale

MVT est un **toolkit en ligne de commande écrit en Python** qui automatise la collecte et l'analyse de traces forensiques sur smartphones. Il repose sur trois principes :

- **Analyse consensuelle** : conçu pour analyser **son propre appareil** ou celui d'une personne ayant donné son **accord explicite**.
- **Détection par indicateurs (IOC)** : compare les artefacts extraits du téléphone à des **indicateurs de compromission au format STIX2** publiés par Amnesty International, Citizen Lab et d'autres groupes de recherche.
- **Transparence forensique** : tous les artefacts extraits sont sauvegardés en **JSON**, ce qui permet de **re-vérifier** le résultat plus tard avec de nouveaux IOC sans relancer l'extraction.

MVT fournit **deux commandes principales** :

| Commande | Plateforme |
|----------|------------|
| `mvt-ios` | Analyse iOS / iPadOS |
| `mvt-android` | Analyse Android (via AndroidQF) |

> Statistiques GitHub (fin 2025) : ~12 200 étoiles, 58 contributeurs, version stable **v2.7.0** (décembre 2025).

---

## 2. Cas d'usage typiques

- **Détection de Pegasus** sur l'iPhone d'un journaliste ou militant.
- **Détection de stalkerware** (logiciels espions installés par un conjoint ou employeur).
- Analyse d'un **backup iTunes/Finder chiffré** pour rechercher des traces de compromission.
- Analyse d'un **dump de système de fichiers iOS complet** (sur appareil jailbreaké).
- Extraction et inspection d'**APK suspects** sur Android.
- Création d'une **timeline chronologique** des événements suspects.
- **Vérification périodique** d'appareils d'activistes par des organisations de défense des droits humains.

---

## 3. Prérequis système

### Plateformes supportées

| OS | Support officiel |
|----|------------------|
| **Linux** | ✅ Recommandé |
| **macOS** | ✅ Supporté |
| **Windows** | ⚠️ Non supporté nativement — utiliser **WSL** |

### Logiciels nécessaires

- **Python 3.8+**
- **pip3** ou **pipx** (recommandé)
- **libusb-1.0** (uniquement si tu utilises `mvt-android`)
- **sqlite3**
- **Android SDK Platform Tools** (`adb`) si tu travailles sur Android
- **libimobiledevice** (recommandé) pour créer des backups iOS depuis Linux/macOS
- **Xcode + Homebrew** sous macOS

---

## 4. Installation sous Linux

### Ubuntu / Debian

```bash
# 1. Installer les dépendances système
sudo apt update
sudo apt install -y python3 python3-pip python3-venv pipx \
                    libusb-1.0-0 sqlite3 android-tools-adb

# 2. S'assurer que pipx est dans le PATH
pipx ensurepath

# 3. Installer MVT
pipx install mvt
```

### Fedora / RHEL

```bash
sudo dnf install -y python3 python3-pip pipx libusb1 sqlite android-tools
pipx ensurepath
pipx install mvt
```

### Vérifier l'installation

Ouvre un **nouveau terminal**, puis :

```bash
mvt-ios --help
mvt-android --help
```

Tu dois voir la liste des sous-commandes (`check-backup`, `decrypt-backup`, `check-fs`, etc.).

### Installation alternative dans un environnement virtuel

```bash
python3 -m venv env
source env/bin/activate
pip install mvt
```

### Installation depuis les sources (dernière version dev)

```bash
pipx install --force git+https://github.com/mvt-project/mvt.git
```

---

## 5. Installation sous macOS

```bash
# 1. Installer Homebrew si nécessaire
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Installer les dépendances
brew install python3 libusb pipx

# 3. S'assurer que pipx est dans le PATH
pipx ensurepath

# 4. Installer MVT
pipx install mvt
```

> ⚠️ Xcode Command Line Tools peut être requis : `xcode-select --install`

---

## 6. Installation sous Windows (WSL)

Windows n'est **pas officiellement supporté**. La voie recommandée est **WSL2** avec Ubuntu :

```powershell
# Dans PowerShell admin
wsl --install -d Ubuntu
```

Puis, dans la console Ubuntu/WSL, suis les instructions de la [section Linux](#4-installation-sous-linux).

> ⚠️ `mvt-android` peut rencontrer des problèmes de **redirection USB sous WSL**. Pour Android, il est plus simple d'utiliser AndroidQF directement sur Windows pour la collecte, puis MVT dans WSL pour l'analyse.

---

## 7. Installation via Docker

Le dépôt fournit des Dockerfiles dédiés :

```bash
# Cloner le dépôt
git clone https://github.com/mvt-project/mvt.git
cd mvt

# Construire l'image pour iOS
docker build -t mvt-ios -f Dockerfile.ios .

# Construire l'image pour Android
docker build -t mvt-android -f Dockerfile.android .

# Exécuter
docker run --rm -it -v $(pwd)/data:/data mvt-ios mvt-ios --help
```

Pratique pour un environnement isolé et reproductible.

---

## 8. Télécharger les indicateurs de compromission (IOC)

MVT s'appuie sur des **fichiers STIX2** contenant les signatures de spywares connus. Pour les télécharger automatiquement :

```bash
mvt-ios download-iocs
```

ou pour Android :

```bash
mvt-android download-iocs
```

Cela récupère les IOC publics depuis le dépôt **[mvt-indicators](https://github.com/mvt-project/mvt-indicators)** (Pegasus, Predator, KingSpawn, Operation Triangulation, etc.).

Les fichiers sont stockés dans `~/.local/share/mvt/indicators/` (chemin par défaut sur Linux).

> ⚠️ Les **IOC publics ne suffisent pas** à conclure qu'un appareil est « propre ». Les traces récentes ne sont pas toujours publiques. Pour une analyse fiable, contacter Amnesty Security Lab ou Access Now.

---

## 9. Workflow iOS : analyse d'un iPhone

L'analyse iOS sans jailbreak passe par un **backup chiffré** créé via Finder (macOS), iTunes (Windows) ou `libimobiledevice` (Linux).

### Étape 1 : créer un backup chiffré

**Sous macOS (Finder)** :

1. Connecter l'iPhone, l'autoriser via le code.
2. Ouvrir Finder → sélectionner l'appareil.
3. Cocher *« Chiffrer la sauvegarde locale »* et définir un **mot de passe fort**.
4. Cliquer *« Sauvegarder maintenant »*.

**Sous Linux avec libimobiledevice** :

```bash
sudo apt install libimobiledevice6 libimobiledevice-utils

# Activer le chiffrement du backup
idevicebackup2 backup encryption on -i

# Lancer le backup complet
mkdir ~/iphone_backup
idevicebackup2 backup --full ~/iphone_backup
```

Le backup chiffré apparaît dans le dossier indiqué.

### Étape 2 : déchiffrer le backup

```bash
mvt-ios decrypt-backup -p "MotDePasseDuBackup" \
                       -d ~/iphone_backup_decrypted \
                       ~/iphone_backup/<DeviceUDID>
```

Options :

- `-p` : mot de passe défini lors du backup.
- `-d` : dossier de destination pour le backup déchiffré.
- `-k <fichier>` : alternative — fichier contenant la clé brute (utile pour automatisation).

> 💡 Tu peux aussi définir la variable d'environnement `MVT_IOS_BACKUP_PASSWORD` pour éviter de taper le mot de passe.

### Étape 3 : extraire une clé pour usage répété (optionnel)

Si tu vas re-déchiffrer plusieurs fois ce backup :

```bash
mvt-ios extract-key -p "MotDePasse" -k backup.key ~/iphone_backup/<DeviceUDID>
```

Puis dans les commandes suivantes :

```bash
mvt-ios decrypt-backup -k backup.key -d ~/iphone_backup_decrypted ~/iphone_backup/<DeviceUDID>
```

⚠️ **Le fichier `backup.key` est aussi sensible que le mot de passe — protège-le.**

### Étape 4 : analyser le backup déchiffré

```bash
mkdir ~/mvt_results

mvt-ios check-backup --iocs ~/.local/share/mvt/indicators/pegasus.stix2 \
                     --output ~/mvt_results \
                     ~/iphone_backup_decrypted
```

Options utiles :

- `-i, --iocs` : fichier d'indicateurs STIX2 (peut être répété plusieurs fois).
- `-o, --output` : dossier où stocker les résultats JSON.
- `-f, --fast` : mode rapide (saute les modules coûteux).
- `-m, --module <nom>` : exécuter un seul module (ex. `Datausage`).
- `-l, --list-modules` : lister tous les modules disponibles.

### Étape 5 (alternative) : analyser un dump de système de fichiers complet

Si tu disposes d'un dump filesystem (appareil jailbreaké, ou extraction Cellebrite/GrayKey) :

```bash
mvt-ios check-fs --iocs ~/.local/share/mvt/indicators/pegasus.stix2 \
                 --output ~/mvt_results \
                 /chemin/vers/fs_dump
```

Le `check-fs` extrait **bien plus d'artefacts** que `check-backup` (logs système, données natives non incluses dans iTunes backup).

### Étape 6 : re-vérifier avec de nouveaux IOC

Pas besoin de tout re-extraire :

```bash
mvt-ios check-iocs --iocs ~/.local/share/mvt/indicators/predator.stix2 \
                   ~/mvt_results
```

C'est l'**énorme avantage de MVT** : tu peux relancer la détection sur les artefacts déjà extraits dès que de nouveaux IOC sont publiés.

---

## 10. Workflow Android : analyse via AndroidQF

> ⚠️ **Changement majeur récent** : la commande `mvt-android check-adb` (analyse directe via ADB) a été **supprimée**. L'analyse Android passe désormais par **AndroidQF**.

### Pourquoi AndroidQF ?

Android offre **moins de sources forensiques** qu'iOS. Pour pallier ce manque, l'équipe MVT a développé **[AndroidQF](https://github.com/mvt-project/androidqf)**, un binaire Go autonome qui collecte sur le terrain :

- Backup Android
- Fichier `bugreport`
- Logs système (`logcat`, `dumpsys`)
- Liste des APK installés
- Propriétés système
- Connexions réseau

L'analyse est ensuite faite **séparément** par MVT sur les artefacts collectés — meilleure scalabilité et reproductibilité.

### Étape 1 : préparer l'appareil Android

1. **Activer le mode développeur** : *Paramètres → À propos → Numéro de build* (taper 7 fois).
2. **Activer le débogage USB** : *Paramètres → Options développeur → Débogage USB*.
3. Connecter le téléphone par USB, **autoriser l'ordinateur** dans la pop-up qui s'affiche sur le téléphone.

### Étape 2 : télécharger AndroidQF

Récupérer le binaire pour ton OS depuis : <https://github.com/mvt-project/androidqf/releases>

```bash
# Exemple Linux x64
wget https://github.com/mvt-project/androidqf/releases/download/v1.x.x/androidqf_linux_amd64
chmod +x androidqf_linux_amd64
```

### Étape 3 : collecter les artefacts

```bash
mkdir ~/androidqf_output
cd ~/androidqf_output
./androidqf_linux_amd64
```

AndroidQF guide la collecte de manière interactive et produit un dossier d'artefacts horodaté.

### Étape 4 : analyser avec MVT

```bash
mvt-android check-androidqf --iocs ~/.local/share/mvt/indicators/pegasus.stix2 \
                            --output ~/mvt_android_results \
                            ~/androidqf_output/<timestamp_folder>
```

### Étape 5 (option) : analyser un backup Android

Si tu disposes d'un `backup.ab` créé via `adb backup` :

```bash
mvt-android check-backup --iocs ~/.local/share/mvt/indicators/pegasus.stix2 \
                         --output ~/mvt_android_results \
                         /chemin/vers/backup.ab
```

### Étape 6 (option) : extraire les APK

Utile pour analyse statique/dynamique ultérieure :

```bash
mvt-android download-apks --output ~/apks /chemin/vers/androidqf_output
```

---

## 11. Lire et interpréter les résultats

Le dossier de sortie contient des fichiers JSON nommés par module :

```
~/mvt_results/
├── manifest.json
├── datausage.json
├── safari_browser_state.json
├── sms.json
├── webkit_session_resource_log.json
├── timeline.csv
├── timeline_detected.csv         ← ⚠️ FICHIER CLEF
└── ...
```

### Fichiers à surveiller en priorité

- **`timeline_detected.csv`** : **timeline chronologique des correspondances IOC**. Si ce fichier existe et n'est pas vide, **c'est un signal d'alerte**.
- **Tout fichier suffixé `_detected.json`** : correspond à un module ayant trouvé une correspondance avec les IOC.
- **`timeline.csv`** : timeline complète de tous les événements extraits — utile pour contextualiser les détections.

### Exemple d'inspection rapide

```bash
ls ~/mvt_results | grep _detected
cat ~/mvt_results/timeline_detected.csv | column -t -s ','
```

### Interpréter prudemment

⚠️ **Un fichier `_detected` n'est PAS la preuve définitive d'une infection** :

- Un IOC peut être un **faux positif** (domaine partagé avec un service légitime, ancien IOC compromis, etc.).
- Inversement, **l'absence de détection ne garantit pas un appareil sain** — les IOC publics sont incomplets, certaines variantes récentes sont inconnues.
- Toute détection sérieuse doit déclencher une **analyse approfondie par un expert**.

### Modules iOS les plus parlants

| Module | Ce qu'il révèle |
|--------|-----------------|
| `Datausage` | Trafic réseau d'apps mortes ou inconnues |
| `WebkitSessionResourceLog` | URLs visitées par WebKit (Safari, in-app) |
| `SafariBrowserState` | État/onglets Safari |
| `Sms` / `Whatsapp` | Messages contenant URLs IOC |
| `InteractionC` | Applications interagissant avec l'utilisateur |
| `LocationdClients` | Apps ayant utilisé la géolocalisation |
| `ConfigurationProfiles` | Profils MDM/configuration suspects |
| `Shortcuts` | Raccourcis iOS modifiés |
| `Cache_files` | Fichiers de cache douteux |

---

## 12. Forces de MVT

✅ **Gratuit, open source**, soutenu par une organisation reconnue (**Amnesty International**) — gage de confiance pour les enquêtes sensibles.

✅ **Spécialisé sur les spywares haut de gamme** (Pegasus, Predator, etc.) — domaine où les solutions commerciales généralistes sont aveugles.

✅ **Méthodologie transparente** : tous les artefacts sont exportés en JSON, donc **auditables, archivables, re-analysables**.

✅ **IOC re-jouables** : la commande `check-iocs` permet de re-vérifier un ancien backup avec de nouveaux indicateurs — précieux quand de nouvelles campagnes sont publiées.

✅ **Format STIX2 standard** — compatible avec les feeds de threat intelligence professionnels (MISP, Colander, etc.).

✅ **Multiplateforme** Linux et macOS.

✅ **Timeline forensique automatique** (`timeline.csv` / `timeline_detected.csv`).

✅ **Communauté active** : 12 000+ étoiles GitHub, 58 contributeurs, releases régulières (v2.7.0 en décembre 2025).

✅ **Couverture iOS très riche** : dizaines de modules couvrant SMS, Safari, datausage, profils de configuration, raccourcis, location, WebKit, etc.

✅ **Documentation officielle complète** sur <https://docs.mvt.re>.

✅ **AndroidQF** apporte une collecte structurée et reproductible pour Android.

✅ **Licence anti-abus** : explicitement conçue pour empêcher l'usage à des fins de surveillance non consentie.

✅ **Légère et rapide** : pas de dépendance lourde de type Java, juste Python + quelques libs.

---

## 13. Faiblesses et limites

❌ **Outil pour experts** : ligne de commande exclusive, pas d'interface graphique. **Inadapté aux utilisateurs finaux** qui veulent simplement « scanner leur téléphone ».

❌ **Pas un antivirus** : ne détecte que ce qui correspond à des **IOC connus**. Une attaque utilisant de nouveaux indicateurs **passera inaperçue**.

❌ **IOC publics insuffisants** : Amnesty et Citizen Lab gardent volontairement certains IOC privés pour ne pas alerter les attaquants. Les meilleurs résultats nécessitent un partenariat avec ces organisations.

❌ **Faux positifs fréquents** : un domaine légitime ancien peut figurer dans une liste IOC, déclenchant une fausse alerte. **Interprétation experte indispensable**.

❌ **Faux négatifs probables** : un téléphone peut être infecté sans qu'aucun IOC ne corresponde, surtout pour des attaques ciblées récentes.

❌ **Couverture Android limitée** : moins de sources forensiques exploitables qu'iOS, et `mvt-android check-adb` a été **supprimé** — il faut désormais passer par AndroidQF, étape supplémentaire.

❌ **Pas de support Windows natif** : nécessite WSL, ce qui rebute certains utilisateurs.

❌ **Dépendance à un backup chiffré** sur iOS : si l'utilisateur ne peut/veut pas en créer un, il faut un dump filesystem (jailbreak) qui n'est pas toujours possible.

❌ **Risque pour la confidentialité** : MVT extrait des données très personnelles (SMS, photos, contacts, géolocalisation, etc.). À manipuler dans un environnement **chiffré et isolé**.

❌ **Pas un outil judiciaire « clé en main »** : la chaîne de preuve (intégrité du backup, hashs, scellement) n'est pas gérée automatiquement par MVT — c'est à l'analyste de la documenter.

❌ **Format de sortie JSON brut** : pas de rapport HTML/PDF prêt pour un magistrat. Il faut souvent post-traiter les résultats (par exemple via Timesketch, ELK, ou scripts maison).

❌ **Évolutions parfois cassantes** : certaines commandes (`check-adb`) ont disparu entre versions majeures, nécessitant de relire la doc régulièrement.

❌ **Amnesty Security Lab a temporairement suspendu son aide au public** (depuis avril 2025, pour cause de saturation) — recours d'experts moins accessible.

❌ **Pas de version « grand public »** : l'app **iVerify** (commerciale) est plus accessible pour un usage personnel rapide, mais moins approfondie.

---

## 14. Bonnes pratiques

🔹 **Travailler sur une copie** du backup ou du dump, jamais sur l'original.

🔹 **Calculer un hash SHA-256** du backup avant et après analyse pour prouver l'intégrité.

🔹 **Utiliser un poste dédié et chiffré** (FileVault, LUKS) pour manipuler les backups — ce sont des données extrêmement sensibles.

🔹 **Mettre à jour les IOC** systématiquement avant chaque analyse :
```bash
mvt-ios download-iocs
```

🔹 **Conserver les artefacts JSON archivés** : ils peuvent être ré-analysés des mois plus tard avec de nouveaux IOC via `check-iocs`.

🔹 **Combiner plusieurs sources d'IOC** : Amnesty, Citizen Lab, équipe Talos (Cisco), etc. — la commande accepte plusieurs `--iocs`.

🔹 **Privilégier `check-fs`** plutôt que `check-backup` quand un dump filesystem est disponible (couverture bien supérieure).

🔹 **Sur Android, toujours passer par AndroidQF** désormais — la collecte ADB directe n'est plus supportée.

🔹 **Ne jamais conclure seul à une infection Pegasus** sur la base de MVT public : faire confirmer par Amnesty Security Lab ou Citizen Lab.

🔹 **Documenter chaque étape** : commande exécutée, version MVT (`mvt-ios --version`), date, hash du backup, version des IOC.

🔹 **Combiner avec d'autres outils** : `sysdiagnose` iOS, Cellebrite UFED, Magnet AXIOM Mobile pour des dumps complets.

🔹 **Activer le verrouillage USB** (USB Restricted Mode) sur iOS quand on n'utilise pas MVT, pour limiter la surface d'attaque.

🔹 **Pour les utilisateurs à haut risque** : envisager le **Mode Isolement (Lockdown Mode)** d'iOS qui réduit significativement la surface d'attaque exploitée par Pegasus.

---

## 15. Ressources utiles

### Officielles MVT

- 📚 **Dépôt GitHub** : <https://github.com/mvt-project/mvt>
- 📚 **Documentation** : <https://docs.mvt.re>
- 📚 **Site officiel** : <https://mvt.re>
- 📚 **IOC publics** : <https://github.com/mvt-project/mvt-indicators>
- 📚 **AndroidQF** : <https://github.com/mvt-project/androidqf>
- 💬 **Discussions GitHub** : <https://github.com/mvt-project/mvt/discussions>
- 🐛 **Issues** : <https://github.com/mvt-project/mvt/issues>

### Lectures de référence

- 📰 **Rapport méthodologique Amnesty (2021)** : [Forensic Methodology Report: How to catch NSO Group's Pegasus](https://www.amnesty.org/en/latest/research/2021/07/forensic-methodology-report-how-to-catch-nso-groups-pegasus/)
- 📰 **Projet Pegasus (Forbidden Stories)** : <https://forbiddenstories.org/about-the-pegasus-project/>
- 📰 **Investigations Amnesty (IOC publics)** : <https://github.com/AmnestyTech/investigations>
- 📰 **Citizen Lab** : <https://citizenlab.ca>

### Aide aux personnes à risque

- 🆘 **Amnesty Security Lab** : <https://securitylab.amnesty.org/get-help/>
- 🆘 **Access Now Digital Security Helpline** : <https://www.accessnow.org/help/>

### Outils complémentaires

- 🔧 **libimobiledevice** (backups iOS sous Linux) : <https://libimobiledevice.org>
- 🔧 **PiRogue Tool Suite** (kit forensique mobile complet incluant MVT) : <https://pts-project.org>
- 🔧 **Timesketch** (visualisation de timelines forensiques) : <https://timesketch.org>
- 🔧 **iVerify** (alternative commerciale grand public) : <https://iverify.io>

---

## Conclusion

MVT est l'**outil de référence open source** pour la **chasse au spyware** sur smartphones. Sa philosophie radicalement différente des antivirus mobiles classiques — basée sur l'**extraction forensique reproductible** plutôt que sur la détection en temps réel — en fait un instrument **complémentaire indispensable** pour les chercheurs en sécurité, les ONG de défense des droits humains, et les enquêteurs forensiques.

Sa **dimension politique** est notable : MVT est né du scandale Pegasus et reste un **outil de contre-pouvoir** face aux États et entreprises vendant de la surveillance ciblée. La licence du projet interdit explicitement son détournement à des fins adversariales.

Cependant, MVT **n'est pas une solution clé en main** : c'est un outil d'expert, qui demande une bonne maîtrise de la ligne de commande, de la forensique mobile, et une **interprétation prudente** des résultats. Une détection MVT n'est qu'**un signal**, pas une conclusion — toute alerte doit être confirmée par une analyse approfondie, idéalement avec l'aide d'organisations spécialisées comme l'Amnesty Security Lab ou Citizen Lab.

Pour bien démarrer, je recommande de :

1. Installer MVT dans un environnement virtuel (`pipx` ou `venv`).
2. T'entraîner sur **tes propres backups** d'iPhone/Android avant toute analyse en conditions réelles.
3. Lire le **rapport méthodologique Amnesty 2021** — c'est la bible du domaine.
4. Suivre l'actualité des **publications de Citizen Lab** pour rester à jour sur les nouveaux IOC.
5. Te familiariser avec le **format STIX2** pour pouvoir créer tes propres indicateurs si besoin.

Bonnes analyses, et reste vigilant ! 🔍🛡️
