// ═══════════════════════════════════════════════════════════════
// artifacts-data.js — Données de l'aide-mémoire artefacts forensiques
//
// Référence pour artifacts.html (page top-level CAS-IN).
// Séparé de artifacts-app.js pour permettre :
//   • Un cache navigateur indépendant (les données changent rarement,
//     le moteur évolue plus souvent — ou l'inverse)
//   • Versioning séparé via le Service Worker
//   • Édition des données sans toucher au moteur
//
// Conventions :
//   - source   : fichier/ruche à ouvrir en premier en analyse "dead box"
//       Ruches Windows : SAM, SECURITY, SOFTWARE, SYSTEM, DEFAULT,
//         NTUSER.DAT, UsrClass.dat, Amcache.hve
//       Logs : Security.evtx, System.evtx, Application.evtx, Microsoft-Windows-*
//       Autres : nom du fichier ou type ("Filesystem", "$Recycle.Bin", etc.)
//   - path     : chemin/sous-clé À L'INTÉRIEUR du fichier ou ruche
//   - hivePath : (optionnel) emplacement physique du fichier de ruche sur disque
//
// Exposé en global : window.ARTIFACTS_DATA, window.ARTIFACTS_HIVE_FILES
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

// =========================================================================
// Conventions :
//  - source : fichier/ruche à ouvrir en premier en analyse "dead box"
//      Ruches Windows : SAM, SECURITY, SOFTWARE, SYSTEM, DEFAULT,
//        NTUSER.DAT, UsrClass.dat, Amcache.hve
//      Logs : Security.evtx, System.evtx, Application.evtx, Microsoft-Windows-*
//      Autres : nom du fichier ou type ("Filesystem", "$Recycle.Bin", etc.)
//  - path : chemin/sous-clé À L'INTÉRIEUR du fichier ou ruche
//  - hivePath : (optionnel) emplacement physique du fichier de ruche sur disque
// =========================================================================

// Localisation physique des fichiers de ruches (référence)
const HIVE_FILES = {
  "SAM":         { file: "%SystemRoot%\\System32\\config\\SAM",        liveKey: "HKLM\\SAM" },
  "SECURITY":    { file: "%SystemRoot%\\System32\\config\\SECURITY",   liveKey: "HKLM\\SECURITY" },
  "SOFTWARE":    { file: "%SystemRoot%\\System32\\config\\SOFTWARE",   liveKey: "HKLM\\SOFTWARE" },
  "SYSTEM":      { file: "%SystemRoot%\\System32\\config\\SYSTEM",     liveKey: "HKLM\\SYSTEM" },
  "DEFAULT":     { file: "%SystemRoot%\\System32\\config\\DEFAULT",    liveKey: "HKEY_USERS\\.DEFAULT" },
  "NTUSER.DAT":  { file: "%USERPROFILE%\\NTUSER.DAT",                  liveKey: "HKCU (= HKEY_USERS\\<SID>)" },
  "UsrClass.dat":{ file: "%USERPROFILE%\\AppData\\Local\\Microsoft\\Windows\\UsrClass.dat",
                   liveKey: "HKCU\\Software\\Classes (= HKEY_USERS\\<SID>_Classes)" },
  "Amcache.hve": { file: "%SystemRoot%\\AppCompat\\Programs\\Amcache.hve", liveKey: "(ruche autonome)" }
};

const data = [

  // ============================================================
  //                         WINDOWS
  // ============================================================

  // --- RÉFÉRENCE GÉNÉRALE ---
  {
    os: "Windows", source: "Filesystem", category: "Référence", name: "Localisation physique des ruches du registre",
    path: "%SystemRoot%\\System32\\config\\ + %USERPROFILE%\\",
    versions: ["NT","XP","Vista","7","8","10","11"],
    description: "En analyse dead-box, charger la ruche depuis le fichier physique pour accéder aux clés montées normalement sous HKLM ou HKCU.",
    bullets: [
      "<b>SAM</b> → <code>%SystemRoot%\\System32\\config\\SAM</code> (monté sous HKLM\\SAM)",
      "<b>SECURITY</b> → <code>%SystemRoot%\\System32\\config\\SECURITY</code> (HKLM\\SECURITY)",
      "<b>SOFTWARE</b> → <code>%SystemRoot%\\System32\\config\\SOFTWARE</code> (HKLM\\SOFTWARE)",
      "<b>SYSTEM</b> → <code>%SystemRoot%\\System32\\config\\SYSTEM</code> (HKLM\\SYSTEM)",
      "<b>DEFAULT</b> → <code>%SystemRoot%\\System32\\config\\DEFAULT</code> (HKEY_USERS\\.DEFAULT)",
      "<b>NTUSER.DAT</b> (1 par utilisateur) → <code>%USERPROFILE%\\NTUSER.DAT</code> (HKCU)",
      "<b>UsrClass.dat</b> (1 par utilisateur) → <code>%USERPROFILE%\\AppData\\Local\\Microsoft\\Windows\\UsrClass.dat</code> (HKCU\\Software\\Classes)",
      "<b>Amcache.hve</b> → <code>%SystemRoot%\\AppCompat\\Programs\\Amcache.hve</code> (ruche autonome)",
      "Sauvegardes (Win 7-10) : <code>%SystemRoot%\\System32\\config\\RegBack\\</code> (désactivé par défaut depuis Win10 1803)",
      "Fichiers .LOG / .LOG1 / .LOG2 : journaux de transactions du registre (peuvent contenir des modifications non encore appliquées)"
    ],
    notes: "Outils : Registry Explorer (E. Zimmerman), RegRipper, X-Ways. Toujours charger les fichiers .LOG en parallèle pour récupérer les transactions en attente."
  },

  // --- INFOS UTILISATEURS ---
  {
    os: "Windows", source: "Filesystem", category: "Infos utilisateurs", name: "SID — Security Identifier",
    path: "Format : S-1-5-21-<DomainID>-<RID>",
    versions: ["NT","XP","Vista","7","8","10","11"],
    description: "Identifiant unique de chaque principal de sécurité (utilisateur, groupe). Présent partout : ACL, corbeille, profils, registre.",
    bullets: [
      "<b>S</b> : indique un SID",
      "<b>1</b> : niveau de révision (toujours 1)",
      "<b>5</b> : autorité (5 = NT Authority ; 0=null, 1=world, 2=local, 3=creator, 4=non-unique)",
      "<b>21-XXXX-XXXX-XXXX</b> : identifiant unique de domaine ou de machine (48 bits)",
      "<b>RID</b> (4 derniers chiffres) : identifie le compte. RID well-known :",
      "<code>500</code>=Administrator local, <code>501</code>=Guest, <code>502</code>=KDC",
      "<code>512</code>=Domain Admins, <code>513</code>=Domain Users, <code>514</code>=Domain Guests, <code>515</code>=Domain Computers",
      "<code>544</code>=Administrators, <code>545</code>=Users, <code>549</code>=Server Operators",
      "Les comptes créés par l'utilisateur ont un RID ≥ <b>1000</b>"
    ]
  },
  {
    os: "Windows", source: "SAM", category: "Infos utilisateurs", name: "Comptes locaux & Last Login & Last Password Change",
    path: "SAM\\Domains\\Account\\Users\\<RID> et SAM\\Domains\\Account\\Users\\Names",
    versions: ["NT","XP","Vista","7","8","10","11"],
    description: "Liste de tous les comptes locaux. Le RID est en hexadécimal dans le nom de la sous-clé (ex: <code>000003EB</code> = 1003 décimal).",
    hiveFile: HIVE_FILES["SAM"],
    bullets: [
      "<code>SAM\\Domains\\Account\\Users\\Names\\</code> : liste des utilisateurs par nom de connexion",
      "<code>SAM\\Domains\\Account\\Users\\<RID>\\F</code> : valeur binaire — contient :",
      "&nbsp;&nbsp;• <b>User ID</b> (RID décimal)",
      "&nbsp;&nbsp;• <b>Last Login Time</b> (FILETIME)",
      "&nbsp;&nbsp;• <b>Last Password Change Time</b>",
      "&nbsp;&nbsp;• <b>Logon Count</b>, <b>Invalid PW Count</b>, <b>Expiration</b>, flags du compte",
      "<code>SAM\\Domains\\Account\\Users\\<RID>\\V</code> : valeur binaire — username, fullname, comment, hash NT/LM (chiffré avec SYSKEY de la ruche SYSTEM)",
      "Profils utilisateurs (chemin, dates) : <span class=\"src\">SOFTWARE</span> → <code>Microsoft\\Windows NT\\CurrentVersion\\ProfileList\\<SID></code>"
    ],
    notes: "Outils : SAMInside, Mimikatz (live), RegRipper plugin samparse. La ruche SECURITY contient les LSA secrets et les Domain Cached Credentials (mscashv2)."
  },
  {
    os: "Windows", source: "SECURITY", category: "Authentification & Logon", name: "LSA Secrets & Cached Credentials",
    path: "Policy\\Secrets\\ ; Cache\\NL$1 .. NL$10",
    versions: ["NT","XP","Vista","7","8","10","11"],
    description: "La ruche SECURITY contient les LSA Secrets (mots de passe de service, DPAPI master keys) et les credentials de domaine mis en cache (jusqu'à 10).",
    hiveFile: HIVE_FILES["SECURITY"],
    bullets: [
      "<code>Policy\\Secrets\\</code> : LSA secrets (déchiffrés avec la SYSKEY de SYSTEM)",
      "<code>Cache\\NL$1 .. NL$10</code> : <b>Domain Cached Credentials</b> (format mscashv2, crackable hashcat -m 2100)",
      "Permet l'authentification offline d'utilisateurs de domaine"
    ],
    notes: "À combiner avec SYSTEM (pour la SYSKEY/BootKey). Outil : Impacket secretsdump.py."
  },

  // --- CONFIG SYSTÈME ---
  {
    os: "Windows", source: "SOFTWARE", category: "Config système", name: "Informations OS (version, build, install date)",
    path: "Microsoft\\Windows NT\\CurrentVersion",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Équivalent de la commande <code>systeminfo</code>. Données sur la version de Windows, son édition et l'installation.",
    hiveFile: HIVE_FILES["SOFTWARE"],
    bullets: [
      "<code>ProductName</code> : nom de l'OS (ex: Windows 10 Pro)",
      "<code>EditionID</code> : édition (Pro, Home, Enterprise…)",
      "<code>DisplayVersion</code> ou <code>ReleaseId</code> : version commerciale (ex: 22H2)",
      "<code>CurrentBuild</code> / <code>CurrentBuildNumber</code> : numéro de build",
      "<code>InstallDate</code> : date d'installation / dernière maj majeure (timestamp Unix 32-bit)",
      "<code>InstallTime</code> (Win10+) : FILETIME 64-bit, plus précis",
      "<code>RegisteredOwner</code>, <code>RegisteredOrganization</code>",
      "<code>SystemRoot</code> : chemin Windows",
      "<code>PathName</code>, <code>SoftwareType</code>"
    ]
  },
  {
    os: "Windows", source: "SYSTEM", category: "Config système", name: "Nom de l'ordinateur",
    path: "ControlSet001\\Control\\ComputerName\\ComputerName",
    versions: ["NT","XP","Vista","7","8","10","11"],
    description: "Nom de la machine. La sous-clé <code>ActiveComputerName</code> contient le nom courant après changement non encore redémarré.",
    hiveFile: HIVE_FILES["SYSTEM"],
    notes: "Aussi visible dans les .lnk (Host name), prefetch, journaux."
  },
  {
    os: "Windows", source: "SYSTEM", category: "Config système", name: "Fuseau horaire (Timezone)",
    path: "ControlSet001\\Control\\TimeZoneInformation",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Fuseau horaire du système. <b>Crucial</b> pour l'analyse temporelle car certains timestamps sont en UTC, d'autres en local.",
    hiveFile: HIVE_FILES["SYSTEM"],
    bullets: [
      "<code>TimeZoneKeyName</code> : nom de la timezone (ex: Romance Standard Time)",
      "<code>StandardName</code> / <code>DaylightName</code>",
      "<code>ActiveTimeBias</code> : décalage actuel en minutes (négatif pour les TZ à l'est de UTC)",
      "<code>Bias</code> / <code>DaylightBias</code>"
    ],
    notes: "Les timestamps des EVTX sont en UTC, ceux du Filesystem $STANDARD_INFO en UTC. Mais les timestamps embarqués dans certains LNK ou registre peuvent être en local."
  },
  {
    os: "Windows", source: "SYSTEM", category: "Config système", name: "Dernière extinction propre",
    path: "ControlSet001\\Control\\Windows → ShutdownTime",
    versions: ["XP","Vista","7","8","10","11"],
    description: "FILETIME 64-bit de la dernière extinction propre. À comparer avec l'event ID 1074 dans System.evtx.",
    hiveFile: HIVE_FILES["SYSTEM"]
  },
  {
    os: "Windows", source: "SOFTWARE + SYSTEM", category: "Config système", name: "Interfaces réseau",
    path: "(SOFTWARE) Microsoft\\Windows NT\\CurrentVersion\\NetworkCards\\<n> ; (SYSTEM) ControlSet001\\Control\\Network\\{4D36E972-...}\\<GUID>\\Connection",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Cartes réseau et liens vers leur configuration. Le GUID de chaque carte fait le lien entre les deux ruches.",
    bullets: [
      "<span class=\"src\">SOFTWARE</span> → <code>Microsoft\\Windows NT\\CurrentVersion\\NetworkCards\\<n></code> : <code>Description</code>, <code>ServiceName</code> (=GUID)",
      "<span class=\"src\">SYSTEM</span> → <code>ControlSet001\\Services\\Tcpip\\Parameters\\Interfaces\\<GUID></code> : IP, DNS, gateway, lease DHCP",
      "Domaine : <span class=\"src\">SYSTEM</span> → <code>ControlSet001\\Services\\Tcpip\\Parameters → Domain</code>",
      "Partages SMB exposés : <span class=\"src\">SYSTEM</span> → <code>ControlSet001\\Services\\lanmanserver\\Shares</code>"
    ]
  },
  {
    os: "Windows", source: "SOFTWARE", category: "Réseau & Partages", name: "Historique des réseaux connectés (NetworkList)",
    path: "Microsoft\\Windows NT\\CurrentVersion\\NetworkList\\Signatures\\Unmanaged | Managed ; ...\\Nla\\Cache",
    versions: ["Vista","7","8","10","11"],
    description: "Tous les réseaux Wi-Fi et Ethernet auxquels la machine s'est connectée — utile pour la <b>localisation physique</b>.",
    hiveFile: HIVE_FILES["SOFTWARE"],
    bullets: [
      "<code>...\\Signatures\\Unmanaged</code> : réseaux non-AD (typiquement Wi-Fi domestiques, hotspots)",
      "<code>...\\Signatures\\Managed</code> : réseaux gérés par AD",
      "Chaque entrée contient :",
      "&nbsp;&nbsp;• <b>SSID</b> du réseau",
      "&nbsp;&nbsp;• <b>FirstNetwork</b> / <b>ProfileGuid</b>",
      "&nbsp;&nbsp;• <b>DefaultGatewayMac</b> (MAC du routeur — peut servir à géolocaliser !)",
      "&nbsp;&nbsp;• <b>DnsSuffix</b>",
      "<code>...\\NetworkList\\Profiles\\<GUID></code> : <code>ProfileName</code>, <code>DateCreated</code>, <code>DateLastConnected</code> (binaire SYSTEMTIME)",
      "<code>...\\Nla\\Cache</code> : cache des derniers réseaux"
    ],
    notes: "À croiser avec WLAN-AutoConfig/Operational.evtx pour les timestamps précis."
  },
  {
    os: "Windows", source: "Microsoft-Windows-WLAN-AutoConfig/Operational.evtx", category: "Réseau & Partages", name: "Logs Wi-Fi (WLAN AutoConfig)",
    path: "%SystemRoot%\\System32\\winevt\\Logs\\Microsoft-Windows-WLAN-AutoConfig%4Operational.evtx",
    versions: ["7","8","10","11"],
    description: "Log opérationnel des connexions Wi-Fi : associations, déconnexions, échecs.",
    bullets: [
      "<b>Event ID 11000</b> : Wireless network association started",
      "<b>Event ID 8001</b> : Successful connection to wireless network",
      "<b>Event ID 8002</b> : Failed connection to wireless network",
      "<b>Event ID 8003</b> : Disconnected from wireless network",
      "<b>Event ID 6100</b> : Network diagnostics (System log)",
      "Contient SSID et <b>BSSID</b> (MAC du point d'accès) → géolocalisation possible (services type Wigle.net)"
    ],
    notes: "Sur Windows 8+, le BSSID n'est plus toujours dans les logs. Voir aussi NetworkList registry."
  },
  {
    os: "Windows", source: "NTUSER.DAT", category: "Config système", name: "Fond d'écran utilisateur",
    path: "Control Panel\\Desktop → Wallpaper",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Chemin du fond d'écran courant.",
    hiveFile: HIVE_FILES["NTUSER.DAT"],
    notes: "Aussi : <code>Software\\Microsoft\\Internet Explorer\\Desktop\\General → Wallpaper</code> (version originale, non convertie en BMP)."
  },

  // --- PROGRAMMES INSTALLÉS ---
  {
    os: "Windows", source: "SOFTWARE", category: "Programmes installés", name: "Programmes installés (Uninstall)",
    path: "Microsoft\\Windows\\CurrentVersion\\Uninstall ; WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Liste des logiciels installés. La branche <b>WOW6432Node</b> regroupe les applications 32-bit installées sur un système 64-bit.",
    hiveFile: HIVE_FILES["SOFTWARE"],
    bullets: [
      "Une sous-clé par logiciel (souvent un GUID, parfois un nom lisible)",
      "<code>DisplayName</code> : nom visible dans Apps & features",
      "<code>DisplayVersion</code> : version installée",
      "<code>Publisher</code> : éditeur",
      "<code>InstallDate</code> (YYYYMMDD), <code>InstallLocation</code>",
      "<code>UninstallString</code> : commande de désinstallation"
    ],
    notes: "Voir aussi : <span class=\"src\">NTUSER.DAT</span> → <code>Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall</code> (logiciels installés par utilisateur)."
  },
  {
    os: "Windows", source: "Amcache.hve", category: "Programmes installés", name: "Amcache — programmes vus & exécutés",
    path: "Root\\InventoryApplicationFile ; Root\\InventoryApplication",
    versions: ["8","10","11"],
    description: "Ruche autonome très riche. Recense tous les exécutables vus par le système (pas seulement exécutés), avec hash SHA-1, taille, éditeur, signature, et timestamps.",
    hiveFile: HIVE_FILES["Amcache.hve"],
    bullets: [
      "<code>Root\\InventoryApplicationFile\\<entry></code> : un sous-clé par exécutable",
      "&nbsp;&nbsp;• <code>FileId</code> = SHA-1 (préfixé de zéros)",
      "&nbsp;&nbsp;• <code>LowerCaseLongPath</code> : chemin complet",
      "&nbsp;&nbsp;• <code>Size</code>, <code>BinFileVersion</code>, <code>ProductName</code>, <code>Publisher</code>",
      "&nbsp;&nbsp;• <code>LinkDate</code> : date de compilation (PE header)",
      "<code>Root\\InventoryApplication</code> : liste des applications installées",
      "<code>Root\\InventoryDriverBinary</code> : drivers chargés",
      "<code>Root\\InventoryDevicePnp</code> : périphériques vus"
    ],
    notes: "Fichier <code>%SystemRoot%\\AppCompat\\Programs\\Amcache.hve</code>. Outils : AmcacheParser (E. Zimmerman). <b>Inclut les exécutables lancés depuis USB</b>, ce qui en fait un complément précieux à Prefetch."
  },

  // --- DÉMARRAGE AUTO ---
  {
    os: "Windows", source: "SOFTWARE + NTUSER.DAT + SYSTEM", category: "Démarrage automatique", name: "Run keys (persistance)",
    path: "Multiples — voir détails",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Mécanismes de persistance les plus courants — premiers endroits à vérifier en cas d'investigation malware.",
    bullets: [
      "<span class=\"src\">SOFTWARE</span> :",
      "&nbsp;&nbsp;• <code>Microsoft\\Windows\\CurrentVersion\\Run</code>",
      "&nbsp;&nbsp;• <code>Microsoft\\Windows\\CurrentVersion\\RunOnce</code>",
      "&nbsp;&nbsp;• <code>Microsoft\\Windows\\CurrentVersion\\RunOnceEx</code>",
      "&nbsp;&nbsp;• <code>Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\\Run</code>",
      "&nbsp;&nbsp;• <code>Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Run...</code> (pendants 32-bit)",
      "<span class=\"src\">NTUSER.DAT</span> (HKCU, par utilisateur) :",
      "&nbsp;&nbsp;• <code>Software\\Microsoft\\Windows\\CurrentVersion\\Run</code>",
      "&nbsp;&nbsp;• <code>Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce</code>",
      "<span class=\"src\">SYSTEM</span> :",
      "&nbsp;&nbsp;• <code>CurrentControlSet\\Services</code> (services dont <code>Start=2</code> = automatique, <code>Start=3</code> = manuel)"
    ],
    notes: "Voir aussi : Tâches planifiées, WMI Event Subscriptions, <code>HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options</code> (debugger hijacking), <code>SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\Userinit/Shell</code>."
  },
  {
    os: "Windows", source: "Filesystem", category: "Tâches planifiées", name: "Tâches planifiées",
    path: "%SystemRoot%\\System32\\Tasks\\ ; SOFTWARE → Microsoft\\Windows NT\\CurrentVersion\\Schedule\\TaskCache",
    versions: ["Vista","7","8","10","11"],
    description: "Fichiers XML de définition des tâches. Mécanisme de persistance courant. Sur Win XP : fichiers .job dans <code>C:\\Windows\\Tasks\\</code>.",
    bullets: [
      "<code>%SystemRoot%\\System32\\Tasks\\<sous-dossiers>\\<TaskName></code> (sans extension, format XML)",
      "Index dans <span class=\"src\">SOFTWARE</span> → <code>Microsoft\\Windows NT\\CurrentVersion\\Schedule\\TaskCache\\Tasks\\<GUID></code>",
      "<code>...\\TaskCache\\Tree\\</code> : arborescence des tâches",
      "Logs : <code>Microsoft-Windows-TaskScheduler/Operational.evtx</code> (Event IDs 106 créée, 140 mise à jour, 200 démarrée, 201 terminée, 141 supprimée)"
    ]
  },

  // --- DOCUMENTS RÉCENTS / MRU ---
  {
    os: "Windows", source: "NTUSER.DAT", category: "Documents récents / MRU", name: "RecentDocs (par extension)",
    path: "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RecentDocs",
    versions: ["XP","Vista","7","8","10","11"],
    description: "20 derniers fichiers ouverts <b>par extension</b>, en format binaire (PIDL). Une sous-clé par extension de fichier.",
    hiveFile: HIVE_FILES["NTUSER.DAT"],
    bullets: [
      "Sous-clé racine <code>RecentDocs</code> : ordre global des 150 derniers fichiers/dossiers (toutes extensions confondues)",
      "<code>RecentDocs\\.<ext></code> (ex: <code>.docx</code>, <code>.pdf</code>, <code>.jpg</code>) : 20 derniers de cette extension",
      "<code>RecentDocs\\Folder</code> : 30 derniers répertoires",
      "<code>MRUListEx</code> : ordre chronologique inverse (le 1er = le plus récent)",
      "Last Write Time de la sous-clé = dernier fichier de cette extension ouvert"
    ]
  },
  {
    os: "Windows", source: "NTUSER.DAT", category: "Documents récents / MRU", name: "OpenSavePidlMRU — boîtes de dialogue",
    path: "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\ComDlg32\\OpenSavePidlMRU",
    versions: ["Vista","7","8","10","11"],
    description: "Fichiers récemment ouverts ou enregistrés via les boîtes de dialogue communes Open/Save (Ctrl+O, Ctrl+S), organisés par extension.",
    hiveFile: HIVE_FILES["NTUSER.DAT"],
    bullets: [
      "Sous-clé <code>*</code> : tous les fichiers (toutes extensions)",
      "Sous-clés <code><ext></code> : fichiers de cette extension",
      "<b>XP équivalent</b> : <code>OpenSaveMRU</code> (sans Pidl, format texte)"
    ]
  },
  {
    os: "Windows", source: "NTUSER.DAT", category: "Documents récents / MRU", name: "LastVisitedPidlMRU — derniers répertoires par appli",
    path: "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\ComDlg32\\LastVisitedPidlMRU",
    versions: ["Vista","7","8","10","11"],
    description: "Pour chaque exécutable utilisant les boîtes de dialogue communes : dernier répertoire visité.",
    hiveFile: HIVE_FILES["NTUSER.DAT"],
    notes: "Permet de tracer quelle application a accédé à quel dossier. XP équivalent : <code>LastVisitedMRU</code>."
  },
  {
    os: "Windows", source: "NTUSER.DAT", category: "Documents récents / MRU", name: "Office Recent Files (FileMRU)",
    path: "Software\\Microsoft\\Office\\<VERSION>\\<App>\\User MRU\\LiveID_####\\FileMRU et PlaceMRU",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Fichiers récents par application Office, indépendamment de RecentDocs.",
    hiveFile: HIVE_FILES["NTUSER.DAT"],
    bullets: [
      "Versions Office : <code>10.0</code>=XP, <code>11.0</code>=2003, <code>12.0</code>=2007, <code>14.0</code>=2010, <code>15.0</code>=2013, <code>16.0</code>=2016/2019/365",
      "Apps : Word, Excel, PowerPoint, Outlook…",
      "<code>FileMRU</code> : derniers fichiers ouverts",
      "<code>PlaceMRU</code> : derniers emplacements (SharePoint, OneDrive…)"
    ]
  },
  {
    os: "Windows", source: "Filesystem (.lnk)", category: "Documents récents / MRU", name: "Raccourcis (.LNK) — Recent et Bureau",
    path: "%USERPROFILE%\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\ ; %USERPROFILE%\\Desktop\\",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Fichiers binaires .LNK créés automatiquement quand l'utilisateur ouvre un fichier — preuve forte qu'il <b>connaissait</b> et a accédé à ce fichier (même si supprimé depuis).",
    bullets: [
      "<b>Métadonnées du raccourci</b> : Target file size, Show Window mode, Target attributes",
      "<b>Timestamps de la cible</b> : Target Created, Last Written, Last Accessed (au moment de la création du LNK)",
      "<b>Local path</b>, <b>Relative path</b>, <b>Working directory</b>, <b>Arguments</b>, <b>Icon location</b>",
      "<b>Volume serial</b> + <b>Volume name</b> + <b>Volume type</b> (Fixed, Removable, Network) → identifie l'origine (USB ?)",
      "<b>Host name</b> de la machine où le fichier a été ouvert (utile en cas de réseau/partage)",
      "<b>MAC Address</b>, <b>Object ID</b> (NTFS Object ID)",
      "<b>ID List (PIDL)</b> : timestamps de chaque dossier traversé pour atteindre le fichier",
      "Aussi présents dans :",
      "&nbsp;&nbsp;• <code>%USERPROFILE%\\AppData\\Roaming\\Microsoft\\Office\\Recent\\</code>",
      "&nbsp;&nbsp;• <code>%USERPROFILE%\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\AutomaticDestinations\\</code> (Jump Lists)"
    ],
    notes: "Outils : LECmd (E. Zimmerman), X-Ways. <b>Survit même si le fichier original est supprimé</b>."
  },
  {
    os: "Windows", source: "Filesystem (Jump Lists)", category: "Documents récents / MRU", name: "Jump Lists",
    path: "%USERPROFILE%\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\AutomaticDestinations\\<AppID>.automaticDestinations-ms ; ...\\CustomDestinations\\",
    versions: ["7","8","10","11"],
    description: "Listes des fichiers/dossiers récents associés à chaque application (clic droit sur l'icône de la barre des tâches). Format binaire OLE Compound File contenant des LNK embarqués.",
    bullets: [
      "Nom de fichier = <b>AppID hash</b> (CRC64 du chemin de l'exécutable)",
      "<b>AutomaticDestinations</b> : générées automatiquement par Windows à partir de l'usage",
      "<b>CustomDestinations</b> : personnalisées par l'application",
      "Liste des AppID connus : <a href=\"https://dfir.to/EZJumpList\">https://dfir.to/EZJumpList</a>",
      "Première fois d'exécution = première fois où l'item a été ajouté à l'AppID",
      "Dernière fois d'exécution = dernière modification de l'item dans l'AppID"
    ],
    notes: "Outils : JLECmd, JumpListExplorer (E. Zimmerman). Les LNK embarqués peuvent être extraits."
  },

  // --- RECHERCHES UTILISATEUR ---
  {
    os: "Windows", source: "NTUSER.DAT", category: "Recherches utilisateur", name: "WordWheelQuery — recherches Explorer",
    path: "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\WordWheelQuery",
    versions: ["7","8","10","11"],
    description: "Recherches saisies par l'utilisateur dans la barre de recherche de l'explorateur Windows. Format Unicode.",
    hiveFile: HIVE_FILES["NTUSER.DAT"],
    bullets: [
      "Une valeur numérotée (<code>0</code>, <code>1</code>, <code>2</code>, …) par recherche, en Unicode",
      "<code>MRUListEx</code> donne l'ordre chronologique inverse"
    ],
    notes: "Très révélateur des intentions de l'utilisateur. Sur Win 8+, recherche aussi dans le menu Démarrer."
  },
  {
    os: "Windows", source: "NTUSER.DAT", category: "Recherches utilisateur", name: "ACMRU — recherches XP",
    path: "Software\\Microsoft\\Search Assistant\\ACMRU\\####",
    versions: ["XP"],
    description: "Recherches via l'assistant de recherche de Windows XP, classées par type.",
    hiveFile: HIVE_FILES["NTUSER.DAT"],
    bullets: [
      "<code>5001</code> : recherches Internet",
      "<code>5603</code> : recherches par nom de fichier/dossier",
      "<code>5604</code> : recherches par mot/phrase dans un fichier",
      "<code>5647</code> : recherches Imprimantes / Ordinateurs / Personnes"
    ]
  },
  {
    os: "Windows", source: "NTUSER.DAT", category: "Recherches utilisateur", name: "TypedURLs — IE / Edge Legacy",
    path: "Software\\Microsoft\\Internet Explorer\\TypedURLs ; ...\\TypedURLsTime",
    versions: ["XP","Vista","7","8","10","11"],
    description: "URLs <b>tapées manuellement</b> dans la barre d'adresse d'Internet Explorer / Edge Legacy (pas issues d'un clic).",
    hiveFile: HIVE_FILES["NTUSER.DAT"],
    bullets: [
      "<code>TypedURLs\\url1 .. url25</code> : 25 URLs les plus récentes",
      "<code>TypedURLsTime\\url1 .. url25</code> (Win 8+) : FILETIME associés"
    ]
  },

  // --- EXÉCUTION DE PROGRAMMES ---
  {
    os: "Windows", source: "NTUSER.DAT", category: "Exécution de programmes", name: "UserAssist",
    path: "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist\\{GUID}\\Count",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Trace les programmes lancés par l'utilisateur via l'interface graphique (double-clic, menu Démarrer, raccourci). <b>Preuve forte d'exécution interactive</b>.",
    hiveFile: HIVE_FILES["NTUSER.DAT"],
    bullets: [
      "<b>Tous les noms sont encodés en ROT13</b> (A↔N, B↔O, …)",
      "Données par entrée : compteur d'exécutions, date de dernière exécution (FILETIME), focus time",
      "GUIDs Win 7/8/10/11 :",
      "&nbsp;&nbsp;• <code>{CEBFF5CD-ACE2-4F4F-9178-9926F41749EA}</code> : Executable File Execution",
      "&nbsp;&nbsp;• <code>{F4E57C4B-2036-45F0-A9AB-443BCFE33D9F}</code> : Shortcut File Execution",
      "GUIDs XP :",
      "&nbsp;&nbsp;• <code>{75048700-EF1F-11D0-9888-006097DEACF9}</code> : Active Desktop",
      "&nbsp;&nbsp;• <code>{5E6AB780-7743-11CF-A12B-00AA004AE837}</code>"
    ],
    notes: "Outil : RegRipper plugin userassist, Eric Zimmerman's RECmd. Les programmes lancés en CLI ne sont PAS dans UserAssist."
  },
  {
    os: "Windows", source: "Prefetch (.pf)", category: "Exécution de programmes", name: "Prefetch",
    path: "%SystemRoot%\\Prefetch\\<NOM>.EXE-XXXXXXXX.pf",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Fichiers créés par le système pour accélérer le démarrage des applications. <b>Excellent artefact de preuve d'exécution</b>.",
    bullets: [
      "Format <code>NOM.EXE-XXXXXXXX.pf</code> où <code>XXXXXXXX</code> = hash 32-bit du chemin complet",
      "Limites historiques : <b>128 derniers programmes uniques</b> sur Win XP/7, <b>1024 sur Win 8/10/11</b>",
      "Infos extraites :",
      "&nbsp;&nbsp;• <b>Created Date</b> : <i>première</i> exécution (à ±10 sec près)",
      "&nbsp;&nbsp;• <b>Last Modified</b> : <i>dernière</i> exécution (à ±10 sec près)",
      "&nbsp;&nbsp;• <b>Run Count</b> : nombre total d'exécutions",
      "&nbsp;&nbsp;• <b>Last 8 run times</b> (Win 8+) : 8 dernières exécutions",
      "&nbsp;&nbsp;• <b>Volumes</b> référencés (VolumeID + serial + creation time)",
      "&nbsp;&nbsp;• <b>Files & directories</b> accédés au lancement",
      "Le fichier .pf est écrit ~10 secondes après le lancement de l'application"
    ],
    notes: "Outil : <b>PECmd</b> (Eric Zimmerman). Désactivé par défaut sur Windows Server. Sur SSD, parfois désactivé. Ne contient pas les programmes lancés depuis USB si le binaire n'est pas sur C:."
  },
  {
    os: "Windows", source: "SYSTEM", category: "Exécution de programmes", name: "ShimCache (AppCompatCache)",
    path: "ControlSet001\\Control\\Session Manager\\AppCompatCache (XP: ...\\AppCompatibility)",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Cache de compatibilité d'applications. Contient les exécutables vus par Windows (chemin, taille, date de modification). <b>Mis à jour à l'extinction du système</b> (sauf Win 8+ où c'est en RAM).",
    hiveFile: HIVE_FILES["SYSTEM"],
    bullets: [
      "Format binaire, parsing différent selon les versions",
      "Données par entrée :",
      "&nbsp;&nbsp;• Chemin complet de l'exécutable",
      "&nbsp;&nbsp;• <b>Last Modified</b> (timestamp $StandardInfo de l'exécutable)",
      "&nbsp;&nbsp;• Taille du fichier (XP/Win7)",
      "&nbsp;&nbsp;• Flag <code>Execution Flag</code> (Win7-8 : indique si effectivement exécuté)",
      "Capacité : 1024 entrées max sur Win 8+, 96 sur XP"
    ],
    notes: "Outil : AppCompatCacheParser (E. Zimmerman). Utile pour identifier les exécutables vus, même supprimés."
  },
  {
    os: "Windows", source: "SYSTEM", category: "Exécution de programmes", name: "BAM / DAM — Background Activity Moderator",
    path: "ControlSet001\\Services\\bam\\State\\UserSettings\\<SID> ; ...\\dam\\State\\UserSettings\\<SID>",
    versions: ["10","11"],
    description: "Service Win 10+ qui trace les exécutables lancés <b>par utilisateur</b>, avec <b>timestamp précis de dernière exécution</b>.",
    hiveFile: HIVE_FILES["SYSTEM"],
    bullets: [
      "Une valeur par exécutable (chemin complet)",
      "Donnée binaire de 24 octets : les 8 premiers = FILETIME de dernière exécution",
      "Le SID dans le chemin permet d'attribuer directement à un utilisateur"
    ],
    notes: "DAM = Desktop Activity Moderator (similaire). Excellente source — préfèrent à ShimCache pour les enquêtes récentes."
  },
  {
    os: "Windows", source: "Filesystem (SRUDB.dat)", category: "Exécution de programmes", name: "SRUM — System Resource Usage Monitor",
    path: "%SystemRoot%\\System32\\sru\\SRUDB.dat (base ESE)",
    versions: ["8","10","11"],
    description: "Base ESE qui enregistre 30 à 60 jours d'utilisation des ressources : CPU, octets envoyés/reçus par application <b>et par interface réseau</b>, batterie, durée d'exécution.",
    bullets: [
      "Schémas (Extensions) référencés dans <span class=\"src\">SOFTWARE</span> → <code>Microsoft\\WindowsNT\\CurrentVersion\\SRUM\\Extensions</code> :",
      "&nbsp;&nbsp;• <code>{d10ca2fe-6fcf-4f6d-848e-b2e99266fa89}</code> : Application Resource Usage Provider",
      "&nbsp;&nbsp;• <code>{973F5D5C-1D90-4944-BE8E-24B94231A174}</code> : Windows Network Data Usage Monitor",
      "&nbsp;&nbsp;• <code>{D06636C4-8929-4683-974E-22C046A43763}</code> : Windows Network Connectivity Usage Monitor",
      "Cross-référence avec : <code>%SystemRoot%\\System32\\WLanSvc\\Interfaces\\</code>",
      "Données : utilisateur (SID), application, octets in/out, durée CPU, foreground time"
    ],
    notes: "Outil : <b>SrumECmd</b> (E. Zimmerman) + <code>srum_dump.exe</code>. <b>Indispensable pour exfiltration de données</b> : permet de voir combien d'octets une application a envoyés et sur quelle interface."
  },
  {
    os: "Windows", source: "Filesystem (ActivitiesCache.db)", category: "Exécution de programmes", name: "Windows 10 Timeline (ActivitiesCache)",
    path: "%USERPROFILE%\\AppData\\Local\\ConnectedDevicesPlatform\\<random>\\ActivitiesCache.db",
    versions: ["10"],
    description: "Base SQLite contenant la \"Timeline\" Windows 10 (Win+TAB). Trace applications et fichiers utilisés sur ~30 jours.",
    bullets: [
      "Tables : <code>Activity</code>, <code>ActivityOperation</code>, <code>ActivityPackageId</code>",
      "Champs : ApplicationName, AppId, DisplayText, ContentInfo, StartTime, EndTime, LastModifiedTime, ETag",
      "Synchronisé via Microsoft Account vers d'autres machines"
    ],
    notes: "<b>Désactivé par défaut sur Windows 11.</b> Outil : WxTCmd (E. Zimmerman)."
  },

  // --- ACTIVITÉ WEB ---
  {
    os: "Windows", source: "Filesystem (WebCacheV*.dat)", category: "Activité web", name: "Internet Explorer / Edge Legacy — History, Cache, Cookies",
    path: "%USERPROFILE%\\AppData\\Local\\Microsoft\\Windows\\WebCache\\WebCacheV01.dat (IE10+/Edge Legacy)",
    versions: ["Vista","7","8","10","11"],
    description: "Base ESE unifiée contenant historique, cache, cookies, téléchargements et historique des termes de recherche d'IE 10+ et Edge Legacy.",
    bullets: [
      "Tables principales : Containers, Container_<n> (par type)",
      "<b>Historique</b> :",
      "&nbsp;&nbsp;• IE6-7 : <code>%USERPROFILE%\\Local Settings\\History\\History.IE5</code> (index.dat)",
      "&nbsp;&nbsp;• IE8-9 : <code>%USERPROFILE%\\AppData\\Local\\Microsoft\\Windows\\History\\History.IE5</code>",
      "&nbsp;&nbsp;• IE10+ / Edge Legacy : WebCacheV01.dat",
      "<b>Cache</b> :",
      "&nbsp;&nbsp;• IE6-7 : <code>%USERPROFILE%\\Local Settings\\Temporary Internet Files</code>",
      "&nbsp;&nbsp;• IE8-9 : <code>%USERPROFILE%\\AppData\\Local\\Microsoft\\Windows\\Temporary Internet Files</code>",
      "&nbsp;&nbsp;• IE10-11 : <code>%USERPROFILE%\\AppData\\Local\\Microsoft\\Windows\\INetCache</code>",
      "&nbsp;&nbsp;• Edge Legacy : <code>%USERPROFILE%\\AppData\\Local\\Packages\\microsoft.microsoftedge_<APPID>\\AC\\#!001\\MicrosoftEdge\\Cache</code>",
      "<b>Cookies</b> :",
      "&nbsp;&nbsp;• IE6-8 : <code>%USERPROFILE%\\AppData\\Roaming\\Microsoft\\Windows\\Cookies</code>",
      "&nbsp;&nbsp;• IE10-11 : <code>%USERPROFILE%\\AppData\\Local\\Microsoft\\Windows\\INetCookies</code>",
      "&nbsp;&nbsp;• Edge Legacy : <code>...\\microsoft.microsoftedge_<APPID>\\AC\\#!001\\MicrosoftEdge\\Cookies</code>",
      "<b>Tracé file:// dans l'historique</b> : permet de voir les accès à des fichiers locaux/réseau via le navigateur"
    ],
    notes: "Outils : ESEDatabaseView, BrowsingHistoryView, IECacheView, MiTec WFA."
  },
  {
    os: "Windows", source: "Filesystem (Chromium SQLite)", category: "Activité web", name: "Chrome / Edge Chromium / Brave / Opera",
    path: "%USERPROFILE%\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\ ; ...\\Microsoft\\Edge\\User Data\\Default\\ ; ...\\BraveSoftware\\Brave-Browser\\User Data\\Default\\",
    versions: ["7","8","10","11"],
    description: "Bases SQLite par profil utilisateur. Tous les navigateurs Chromium partagent la même structure.",
    bullets: [
      "<code>History</code> : URL visitées, downloads (table downloads), termes de recherche (table keyword_search_terms)",
      "<code>Cookies</code> : cookies (chiffrés via DPAPI sur Win 10+, clé dans <code>Local State</code>)",
      "<code>Login Data</code> : mots de passe enregistrés (chiffrés DPAPI)",
      "<code>Web Data</code> : autocomplete, cartes bancaires, adresses",
      "<code>Bookmarks</code> : favoris (JSON, pas SQLite)",
      "<code>Top Sites</code> : sites les plus visités",
      "<code>Favicons</code>",
      "<code>Network\\Cookies</code> (versions récentes) : cookies déplacés ici",
      "<code>Session Storage\\</code>, <code>Local Storage\\</code> : données HTML5 par site",
      "<code>Cache\\</code> : cache du contenu (format Chromium)",
      "<code>Current Session</code>, <code>Last Session</code>, <code>Current Tabs</code>, <code>Last Tabs</code> : restauration de session"
    ],
    notes: "Plusieurs profils : <code>User Data\\Default\\</code> + <code>User Data\\Profile 1\\</code>, etc. Les timestamps Chrome sont en WebKit time (microseconds depuis 1601-01-01)."
  },
  {
    os: "Windows", source: "Filesystem (Firefox SQLite)", category: "Activité web", name: "Firefox",
    path: "%USERPROFILE%\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\<random>.default\\",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Bases SQLite par profil dans Firefox.",
    bullets: [
      "<code>places.sqlite</code> : <b>historique + bookmarks</b> (tables moz_places, moz_historyvisits, moz_bookmarks)",
      "<code>cookies.sqlite</code> : cookies",
      "<code>formhistory.sqlite</code> : historique des saisies de formulaires",
      "<code>downloads.sqlite</code> : téléchargements (anciennes versions ; Win Vista intègre downloads dans places.sqlite)",
      "<code>logins.json</code> + <code>key4.db</code> : mots de passe (chiffrés)",
      "<code>sessionstore.jsonlz4</code> / <code>sessionstore-backups\\</code> : restauration de session",
      "Cache : <code>%USERPROFILE%\\AppData\\Local\\Mozilla\\Firefox\\Profiles\\<random>.default\\cache2\\</code>"
    ]
  },
  {
    os: "Windows", source: "Filesystem (Outlook OST/PST/OLK)", category: "Activité web", name: "Outlook — emails et pièces jointes",
    path: "OST/PST + dossier OLK (cache des PJ ouvertes)",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Outlook stocke les mails dans des fichiers OST (cache exchange) ou PST (archives). Les pièces jointes ouvertes sont mises en cache dans un dossier OLK.",
    bullets: [
      "<b>OST/PST</b> : <code>%USERPROFILE%\\AppData\\Local\\Microsoft\\Outlook\\</code> (Win7+) ou <code>%USERPROFILE%\\Local Settings\\Application Data\\Microsoft\\Outlook\\</code> (XP)",
      "<b>Pièces jointes ouvertes (OLK temp folder)</b> :",
      "&nbsp;&nbsp;• Win7+ : <code>%USERPROFILE%\\AppData\\Local\\Microsoft\\Windows\\INetCache\\Content.Outlook\\<random>\\</code>",
      "&nbsp;&nbsp;• Versions plus anciennes : <code>%USERPROFILE%\\Local Settings\\Temporary Internet Files\\OLK<XXX>\\</code> (XP) ou <code>%USERPROFILE%\\AppData\\Local\\Microsoft\\Windows\\Temporary Internet Files\\Content.Outlook\\<random>\\</code>",
      "Le chemin exact se trouve dans <span class=\"src\">NTUSER.DAT</span> → <code>Software\\Microsoft\\Office\\<VERSION>\\Outlook\\Security → OutlookSecureTempFolder</code>"
    ],
    notes: "Outils : Kernel Outlook PST Viewer, MailXaminer, libpff (Python). Estimation industrie : 80% des données email transitent en pièces jointes (encodage MIME/Base64)."
  },
  {
    os: "Windows", source: "Filesystem (LSO)", category: "Activité web", name: "Flash / Super Cookies (LSO)",
    path: "%APPDATA%\\Macromedia\\Flash Player\\#SharedObjects\\<random>\\",
    versions: ["XP","Vista","7","8","10"],
    description: "Local Stored Objects (LSO) : données Flash persistantes. Survivaient au nettoyage des cookies classiques. Aussi appelés \"Flash cookies\".",
    notes: "Flash est End-of-Life depuis 2021 mais les LSO peuvent rester sur d'anciens systèmes."
  },
  {
    os: "Windows", source: "NTUSER.DAT", category: "Activité web", name: "Skype History (legacy)",
    path: "%USERPROFILE%\\AppData\\Roaming\\Skype\\<skype-name>\\main.db (SQLite)",
    versions: ["XP","Vista","7","8","10"],
    description: "Skype Desktop \"classique\" (avant migration UWP) stockait les chats et transferts dans une base SQLite par utilisateur Skype.",
    bullets: [
      "Win 7+ : <code>%USERPROFILE%\\AppData\\Roaming\\Skype\\<skype-name>\\main.db</code>",
      "XP : <code>C:\\Documents and Settings\\<user>\\Application Data\\Skype\\<skype-name>\\</code>",
      "Tables : Conversations, Messages, Calls, Transfers"
    ],
    notes: "Skype moderne (Microsoft) utilise un autre format. Voir aussi : Teams, qui peut être considéré comme le successeur."
  },
  {
    os: "Windows", source: "Filesystem (NTFS ADS)", category: "Activité web", name: "Mark of the Web — ADS Zone.Identifier",
    path: "<fichier>:Zone.Identifier (Alternate Data Stream NTFS)",
    versions: ["XP","Vista","7","8","10","11"],
    description: "À partir de Win XP SP2, les fichiers téléchargés depuis Internet via un navigateur (ou décompressés depuis une archive provenant d'Internet) reçoivent un <b>ADS \"Zone.Identifier\"</b> sur les volumes NTFS — preuve qu'ils viennent du web.",
    bullets: [
      "Format : <code>[ZoneTransfer]\\nZoneId=N</code> (texte)",
      "<b>ZoneId values</b> :",
      "&nbsp;&nbsp;• <code>0</code> = My Computer",
      "&nbsp;&nbsp;• <code>1</code> = Local Intranet",
      "&nbsp;&nbsp;• <code>2</code> = Trusted Sites",
      "&nbsp;&nbsp;• <code>3</code> = Internet (le plus courant)",
      "&nbsp;&nbsp;• <code>4</code> = Restricted Sites",
      "Sur Win 10+, contient aussi <code>ReferrerUrl</code>, <code>HostUrl</code>, <code>LastWriterPackageFamilyName</code>",
      "Visible avec <code>dir /R</code> ou <code>Get-Item -Stream Zone.Identifier</code>"
    ],
    notes: "Permet de répondre \"ce fichier vient-il du web ?\" et parfois \"de quelle URL ?\". Disparaît au cours d'une copie vers un FS non-NTFS (FAT32, exFAT)."
  },

  // --- AUTHENTIFICATION & LOGON ---
  {
    os: "Windows", source: "Security.evtx", category: "Authentification & Logon", name: "Event IDs essentiels — Logon / Account",
    path: "%SystemRoot%\\System32\\winevt\\Logs\\Security.evtx",
    versions: ["Vista","7","8","10","11"],
    description: "Event IDs les plus importants pour l'investigation d'authentification.",
    bullets: [
      "<b>4624</b> : Successful logon — voir Logon Type ci-dessous",
      "<b>4625</b> : Failed logon attempt (raison dans Status / Sub Status)",
      "<b>4634</b> : Account logoff",
      "<b>4647</b> : User initiated logoff",
      "<b>4648</b> : Logon attempt using <i>explicit</i> credentials (RunAs, exécution distante)",
      "<b>4672</b> : Special privileges assigned to new logon (Administrator)",
      "<b>4720</b> : User account created",
      "<b>4722/4725</b> : Account enabled / disabled",
      "<b>4724/4738</b> : Password reset / Account changed",
      "<b>4728/4732/4756</b> : Member added to security group (global / local / universal)",
      "<b>4768</b> : Kerberos TGT requested (DC)",
      "<b>4769</b> : Kerberos service ticket requested",
      "<b>4771</b> : Kerberos pre-authentication failed",
      "<b>4776</b> : NTLM authentication (account validation)",
      "<b>4778/4779</b> : Session reconnected / disconnected (RDP)",
      "<b>5140/5145</b> : Network share object accessed (basic / detailed)",
      "<b>1102</b> : Audit log was cleared (effacement de logs !)",
      "<b>4688</b> : New process created (si Audit Process Creation activé)"
    ]
  },
  {
    os: "Windows", source: "Security.evtx", category: "Authentification & Logon", name: "Logon Types (Event 4624)",
    path: "Champ \"Logon Type\" du record",
    versions: ["Vista","7","8","10","11"],
    description: "Le champ <code>Logon Type</code> de l'event 4624 (et 4625) indique <b>la nature du login</b> — essentiel pour comprendre comment l'attaquant est entré.",
    bullets: [
      "<b>2</b> = <b>Interactive</b> — clavier physique (console) <i>ou</i> RDP local",
      "<b>3</b> = <b>Network</b> — accès partage SMB, RPC, etc.",
      "<b>4</b> = <b>Batch</b> — tâche planifiée",
      "<b>5</b> = <b>Service</b> — service Windows démarré",
      "<b>7</b> = <b>Unlock</b> — déverrouillage de session",
      "<b>8</b> = <b>NetworkCleartext</b> — credentials envoyés en clair (IIS basic auth)",
      "<b>9</b> = <b>NewCredentials</b> — RunAs /netonly",
      "<b>10</b> = <b>RemoteInteractive</b> — RDP",
      "<b>11</b> = <b>CachedInteractive</b> — login interactif via credentials cachés",
      "<b>12</b> = <b>CachedRemoteInteractive</b> — RDP via cache",
      "<b>13</b> = <b>CachedUnlock</b> — déverrouillage via cache"
    ]
  },
  {
    os: "Windows", source: "System.evtx", category: "Authentification & Logon", name: "Service Events (System log)",
    path: "%SystemRoot%\\System32\\winevt\\Logs\\System.evtx",
    versions: ["Vista","7","8","10","11"],
    description: "Démarrages, arrêts, plantages et installations de services. Indices de persistance, exploitation ou injection de processus.",
    bullets: [
      "<b>7034</b> : Service crashed unexpectedly",
      "<b>7035</b> : Service sent a Start/Stop control",
      "<b>7036</b> : Service entered the running/stopped state",
      "<b>7040</b> : Service start type changed (Boot/On Request/Disabled)",
      "<b>7045</b> : <b>Service installed</b> (très important !)",
      "<b>1074</b> : Reboot/shutdown initié (avec utilisateur, raison)",
      "<b>6005/6006</b> : Event log service started / stopped (boot / shutdown)",
      "<b>6008</b> : Unexpected shutdown",
      "<b>6013</b> : Uptime du système",
      "<b>20001/20003</b> : Plug and Play driver install (USB)"
    ],
    notes: "Voir aussi 4697 dans Security.evtx (service installation, équivalent 7045 mais journal Sécurité)."
  },

  // --- USB & MATÉRIEL ---
  {
    os: "Windows", source: "SYSTEM", category: "Périphériques USB / Matériel", name: "USB — Identification (USBSTOR / USB)",
    path: "ControlSet001\\Enum\\USBSTOR ; ControlSet001\\Enum\\USB",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Inventaire de tous les périphériques USB qui ont été connectés. <code>USBSTOR</code> = stockage de masse ; <code>USB</code> = tout (clavier, souris, dongles).",
    hiveFile: HIVE_FILES["SYSTEM"],
    bullets: [
      "<code>Enum\\USBSTOR\\Disk&Ven_<vendor>&Prod_<product>&Rev_<rev>\\<USBSerial></code>",
      "<b>Numéro de série</b> = nom de la sous-clé (mais si le 2ème caractère est <code>&</code>, c'est un faux serial généré par Windows car le périphérique n'en a pas)",
      "Valeurs : <code>FriendlyName</code>, <code>HardwareID</code>, <code>CompatibleIDs</code>, <code>Mfg</code>, <code>DeviceDesc</code>, <code>Service</code>",
      "<code>ContainerID</code> : GUID stable du périphérique (utile pour cross-référencer)",
      "Voir aussi <span class=\"src\">SOFTWARE</span> → <code>Microsoft\\Windows Portable Devices\\Devices</code> pour les périphériques MTP"
    ]
  },
  {
    os: "Windows", source: "SYSTEM + setupapi.dev.log", category: "Périphériques USB / Matériel", name: "USB — First / Last / Removal Times",
    path: "ControlSet001\\Enum\\USBSTOR\\<...>\\<Serial>\\Properties\\{83da6326-97a6-4088-9453-a1923757b29}\\<id>",
    versions: ["7","8","10","11"],
    description: "Timestamps précis du premier branchement, dernier branchement et dernier retrait, par périphérique USB.",
    hiveFile: HIVE_FILES["SYSTEM"],
    bullets: [
      "<code>0064</code> = <b>First Install</b> (Win 7-10)",
      "<code>0066</code> = <b>Last Connected</b> (Win 8-10)",
      "<code>0067</code> = <b>Last Removal</b> (Win 8-10)",
      "Format FILETIME 64-bit",
      "<b>Première installation aussi traçable via</b> :",
      "&nbsp;&nbsp;• <code>%SystemRoot%\\inf\\setupapi.dev.log</code> (Win 7-11)",
      "&nbsp;&nbsp;• <code>%SystemRoot%\\setupapi.log</code> (XP)",
      "&nbsp;&nbsp;→ rechercher le numéro de série du USB ; le timestamp dans le log est en heure <b>locale</b>",
      "Aussi : <span class=\"src\">System.evtx</span> → Event ID <b>20001</b> (Plug and Play driver install attempt) et <b>20003</b>"
    ],
    notes: "Status (0 = no errors) dans Event 20001."
  },
  {
    os: "Windows", source: "NTUSER.DAT", category: "Périphériques USB / Matériel", name: "Quel utilisateur a branché un USB ? (MountPoints2)",
    path: "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\MountPoints2",
    versions: ["Vista","7","8","10","11"],
    description: "<b>Permet de déterminer quel utilisateur a connecté un périphérique USB</b> (info absente du registre HKLM).",
    hiveFile: HIVE_FILES["NTUSER.DAT"],
    bullets: [
      "Une sous-clé <code>{<GUID>}</code> par périphérique (Volume GUID)",
      "Le <b>Last Write Time</b> de la sous-clé = dernière fois que cet utilisateur a branché ce volume",
      "Cross-référencer le GUID avec <span class=\"src\">SYSTEM</span> → <code>MountedDevices</code> pour identifier le périphérique"
    ]
  },
  {
    os: "Windows", source: "SYSTEM", category: "Périphériques USB / Matériel", name: "Drive Letter & Volume Name (MountedDevices)",
    path: "MountedDevices",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Associe les lettres de lecteur (C:, D:, E:…) à leurs identifiants de volume. Permet de retrouver à quel périphérique correspondait une lettre dans le passé.",
    hiveFile: HIVE_FILES["SYSTEM"],
    bullets: [
      "<code>\\DosDevices\\C:</code>, <code>\\DosDevices\\D:</code>… = lettres assignées",
      "<code>\\??\\Volume{<GUID>}</code> = volumes",
      "Données binaires : pour les disques fixes, contient le serial du disque + offset partition ; pour USB, contient l'identifiant USBSTOR (parsable en ASCII)",
      "Volume Label dans <span class=\"src\">SOFTWARE</span> → <code>Microsoft\\Windows\\Search\\VolumeInfoCache\\<DriveLetter></code>"
    ]
  },
  {
    os: "Windows", source: "SYSTEM", category: "Périphériques USB / Matériel", name: "Énumération matérielle complète",
    path: "ControlSet001\\Enum\\<bus>",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Énumération de tout le matériel détecté par bus.",
    hiveFile: HIVE_FILES["SYSTEM"],
    bullets: [
      "<code>Enum\\ACPI</code> : périphériques ACPI",
      "<code>Enum\\PCI</code> : périphériques PCI/PCIe (carte graphique, son, NIC)",
      "<code>Enum\\USB</code> : tous les périphériques USB (claviers, souris, dongles, biométrie)",
      "<code>Enum\\HID</code> : Human Interface Devices",
      "<code>Enum\\BTH</code> : Bluetooth",
      "<code>Enum\\SCSI</code>, <code>IDE</code>, <code>STORAGE</code>",
      "Format : <code>USB\\VID_xxxx&PID_xxxx</code> (Vendor ID + Product ID)"
    ]
  },

  // --- CORBEILLE ---
  {
    os: "Windows", source: "Filesystem ($Recycle.Bin)", category: "Corbeille & Suppression", name: "Corbeille — Vista → Windows 11",
    path: "C:\\$Recycle.Bin\\<SID>\\",
    versions: ["Vista","7","8","10","11"],
    description: "Une sous-corbeille par utilisateur (identifié par son SID). Pour chaque fichier supprimé, deux fichiers sont créés.",
    bullets: [
      "<code>$I######</code> : <b>métadonnées</b> du fichier supprimé",
      "<code>$R######</code> : <b>contenu</b> (données) du fichier supprimé (le ###### correspond à $I)",
      "<b>Structure du fichier $I</b> :",
      "&nbsp;&nbsp;• Offset <code>0x00</code> (8B) : Header (version)",
      "&nbsp;&nbsp;• Offset <code>0x08</code> (8B) : File Size (taille originale)",
      "&nbsp;&nbsp;• Offset <code>0x10</code> (8B) : Delete Date/Time (FILETIME)",
      "&nbsp;&nbsp;• Offset <code>0x18</code> : File Name + Path (Unicode, jusqu'à 520B)",
      "Cross-référencer le SID avec SAM\\Domains\\Account\\Users\\Names ou les profils"
    ],
    notes: "Outil : RBCmd (E. Zimmerman). $I sans $R = fichier déjà nettoyé / corbeille vidée."
  },
  {
    os: "Windows", source: "Filesystem (RECYCLER\\<SID>\\INFO2)", category: "Corbeille & Suppression", name: "Corbeille — Windows NT/2000/XP",
    path: "C:\\RECYCLER\\<SID>\\INFO2",
    versions: ["NT","XP"],
    description: "Une sous-corbeille par SID. Le fichier <code>INFO2</code> centralise les métadonnées de tous les fichiers supprimés.",
    bullets: [
      "Les fichiers sont renommés <code>D&lt;lettre&gt;&lt;index&gt;.&lt;ext&gt;</code> (ex: <code>Dc1.jpg</code>)",
      "<b>INFO2 record</b> (800B par entrée) : index, taille, date de suppression (FILETIME), nom et chemin original (ASCII et Unicode)"
    ]
  },
  {
    os: "Windows", source: "Filesystem (RECYCLED\\INFO2)", category: "Corbeille & Suppression", name: "Corbeille — Windows 95/98/Me",
    path: "C:\\RECYCLED\\INFO2",
    versions: ["9x"],
    description: "Une seule corbeille pour tous les utilisateurs. Fichier INFO2 avec métadonnées."
  },

  // --- LOGS SYSTÈME ---
  {
    os: "Windows", source: "EVTX", category: "Logs système", name: "Windows Event Logs (.evtx)",
    path: "%SystemRoot%\\System32\\winevt\\Logs\\*.evtx",
    versions: ["Vista","7","8","10","11"],
    description: "Journaux d'événements Windows. Format binaire EVTX (depuis Vista). Format EVT pour XP/2003.",
    bullets: [
      "<b>Logs principaux</b> :",
      "&nbsp;&nbsp;• <code>Application.evtx</code> : événements applicatifs",
      "&nbsp;&nbsp;• <code>Security.evtx</code> : authentification, audit (voir Event IDs essentiels)",
      "&nbsp;&nbsp;• <code>System.evtx</code> : services, pilotes, hardware (voir Service Events)",
      "&nbsp;&nbsp;• <code>Setup.evtx</code> : installation, mises à jour",
      "<b>Logs spécialisés (Microsoft-Windows-*)</b> :",
      "&nbsp;&nbsp;• <code>...\\TaskScheduler%4Operational.evtx</code> : tâches planifiées",
      "&nbsp;&nbsp;• <code>...\\TerminalServices-LocalSessionManager%4Operational.evtx</code> : RDP serveur",
      "&nbsp;&nbsp;• <code>...\\TerminalServices-RemoteConnectionManager%4Operational.evtx</code>",
      "&nbsp;&nbsp;• <code>...\\WLAN-AutoConfig%4Operational.evtx</code> : Wi-Fi",
      "&nbsp;&nbsp;• <code>...\\Windows Defender%4Operational.evtx</code>",
      "&nbsp;&nbsp;• <code>...\\PowerShell%4Operational.evtx</code> : scripts PowerShell",
      "&nbsp;&nbsp;• <code>...\\Sysmon%4Operational.evtx</code> (si Sysmon installé)",
      "Champs : <b>EventID</b>, <b>TimeCreated</b> (UTC), <b>Provider</b>, <b>Computer</b>, <b>Channel</b>, <b>UserID</b>, <b>Level</b>, <b>EventData</b>"
    ],
    notes: "Outils : Event Viewer (eventvwr.msc), <b>EvtxECmd</b> (E. Zimmerman), Chainsaw, hayabusa, log2timeline/plaso. XP : .evt dans <code>%SystemRoot%\\System32\\config\\</code>."
  },

  // --- SHELLBAGS ---
  {
    os: "Windows", source: "NTUSER.DAT + UsrClass.dat", category: "Navigation dossiers (ShellBags)", name: "ShellBags — historique de navigation Explorer",
    path: "voir détails — clés différentes selon ruche",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Conservent les préférences d'affichage de chaque dossier visité (taille, position, mode d'affichage, icône). Avantage forensique : preuve qu'un utilisateur a <b>navigué</b> dans un dossier — y compris des dossiers <b>supprimés, déplacés ou sur des volumes externes</b>.",
    bullets: [
      "<b>Navigation Desktop / Mes documents</b> (toujours dans NTUSER.DAT) :",
      "<span class=\"src\">NTUSER.DAT</span> → <code>Software\\Microsoft\\Windows\\Shell\\BagMRU</code>",
      "<span class=\"src\">NTUSER.DAT</span> → <code>Software\\Microsoft\\Windows\\Shell\\Bags</code>",
      "<b>Navigation Explorer Windows</b> (à partir de Vista, dans UsrClass.dat) :",
      "<span class=\"src\">UsrClass.dat</span> → <code>Software\\Classes\\LocalSettings\\Software\\Microsoft\\Windows\\Shell\\BagMRU</code>",
      "<span class=\"src\">UsrClass.dat</span> → <code>Software\\Classes\\LocalSettings\\Software\\Microsoft\\Windows\\Shell\\Bags</code>",
      "<b>Données extraites</b> :",
      "&nbsp;&nbsp;• Chemin complet du dossier",
      "&nbsp;&nbsp;• Created / Modified / Accessed (timestamps embarqués)",
      "&nbsp;&nbsp;• <b>First Interacted</b> / <b>Last Interacted</b>",
      "&nbsp;&nbsp;• Type (dossier local, USB, partage réseau, contrôleur de domaine)",
      "&nbsp;&nbsp;• Nom de volume + serial (pour USB)"
    ],
    notes: "Outil indispensable : <b>ShellBagsExplorer</b> / <b>SBECmd</b> (E. Zimmerman). XP : tout est dans NTUSER.DAT (pas de UsrClass.dat séparé)."
  },

  // --- IMPRESSION ---
  {
    os: "Windows", source: "Filesystem (Spool)", category: "Imprimantes & Spool", name: "Spooler d'impression",
    path: "%SystemRoot%\\System32\\spool\\PRINTERS\\",
    versions: ["XP","Vista","7","8","10","11"],
    description: "Files d'attente d'impression. Si l'impression a réussi, les fichiers sont supprimés. Si elle est en pause/erreur/échec, ils restent.",
    bullets: [
      "<code>*.SPL</code> : <b>données envoyées à l'imprimante</b> (souvent EMF ou XPS, parfois raw PCL)",
      "<code>*.SHD</code> : <b>métadonnées</b> (utilisateur émetteur, nom du document, imprimante cible, date, nombre de pages, taille)",
      "Possibilité de relancer un job d'impression depuis l'imprimante elle-même (mémoire interne)"
    ],
    notes: "Outil : SPLViewer. Permet de récupérer le contenu imprimé même si le fichier original est inaccessible."
  },

  // --- THUMBNAILS ---
  {
    os: "Windows", source: "Filesystem (Thumbs.db)", category: "Miniatures / Thumbnails", name: "Thumbs.db — XP",
    path: "Dans chaque répertoire contenant des images (XP)",
    versions: ["XP"],
    description: "Cache des miniatures généré dans chaque dossier d'images. Format OLE Compound File.",
    notes: "Permet de récupérer des aperçus de fichiers supprimés. Ne contient le nom et le chemin original que sur XP."
  },
  {
    os: "Windows", source: "Filesystem (thumbcache)", category: "Miniatures / Thumbnails", name: "Thumbcache — Vista → 11",
    path: "%USERPROFILE%\\AppData\\Local\\Microsoft\\Windows\\Explorer\\thumbcache_*.db",
    versions: ["Vista","7","8","10","11"],
    description: "Cache centralisé des miniatures par utilisateur, en plusieurs résolutions (le système crée la taille adaptée à l'écran).",
    bullets: [
      "<code>thumbcache_32.db</code>, <code>_96.db</code>, <code>_256.db</code>, <code>_1024.db</code> (Win7) ; <code>_1280.db</code>, <code>_1920.db</code>, <code>_2560.db</code> (Win8+)",
      "<code>iconcache_*.db</code> : icônes des applications",
      "<b>Survit à la suppression</b> du fichier original",
      "Le hash dans le nom de l'entrée = hash du chemin",
      "Sur Win 7 : la base contient aussi la <b>Modified Time</b> du fichier original"
    ],
    notes: "Outil : Thumbcache Viewer, X-Ways."
  },

  // ============================================================
  //                          MAC
  // ============================================================

  {
    os: "Mac", source: ".plist (binaire ou XML)", category: "Référence", name: "Fichiers Plist — concept",
    path: ".plist (Property List)",
    versions: [],
    description: "Format de fichier Apple stockant des paramètres d'applications, préférences ou métadonnées en paires clé-valeur. Format <b>binaire</b> (bplist00) ou <b>XML</b>.",
    bullets: [
      "Magic binaire : <code>bplist00</code>",
      "Outils : <code>plutil -p &lt;file&gt;</code> (CLI), Quick Plist Editor, X-Ways (interprétation auto)",
      "Localisations principales :",
      "&nbsp;&nbsp;• <code>/Library/Preferences/</code> — préférences système (toutes machines)",
      "&nbsp;&nbsp;• <code>~/Library/Preferences/</code> — préférences utilisateur",
      "&nbsp;&nbsp;• <code>/System/Library/</code> — fichiers OS (read-only sur SIP)"
    ]
  },
  {
    os: "Mac", source: "/private/var/db/dslocal/...", category: "Infos utilisateurs", name: "Utilisateurs et Groupes (DSLocal)",
    path: "/private/var/db/dslocal/nodes/Default/users/<user>.plist ; /private/var/db/dslocal/nodes/Default/groups/<grp>.plist",
    versions: [],
    description: "Plists par utilisateur/groupe local. Contiennent UID, GID, home, shell, et le hash du mot de passe (<code>ShadowHashData</code>).",
    bullets: [
      "Le hash du mot de passe est dans la clé <code>ShadowHashData</code> (binaire embarqué dans le plist)",
      "Format moderne : SALTED-SHA512-PBKDF2",
      "UID 0 = root ; UIDs ≥ 501 = utilisateurs créés"
    ],
    notes: "Crackable avec hashcat -m 7100. Outil : DPAPI/Keychain analysis tools."
  },
  {
    os: "Mac", source: "~/Library/Keychains/login.keychain-db", category: "Infos utilisateurs", name: "Keychain (trousseau)",
    path: "~/Library/Keychains/login.keychain-db",
    versions: [],
    description: "Trousseau de l'utilisateur : mots de passe, certificats, clés privées, notes sécurisées. Chiffré avec le mot de passe de session.",
    notes: "Outils : keychaindump, chainbreaker. Aussi : System Keychain dans <code>/Library/Keychains/System.keychain</code>."
  },
  {
    os: "Mac", source: "com.apple.loginwindow.plist", category: "Authentification & Logon", name: "Last login & password hints",
    path: "/Library/Preferences/com.apple.loginwindow.plist",
    versions: [],
    description: "Plist contenant les paramètres de l'écran de login.",
    bullets: [
      "<code>lastUserName</code> : dernier utilisateur affiché",
      "<code>lastUser</code> : action (Restart, Shutdown, Logout)",
      "<code>autoLoginUser</code> : utilisateur en auto-login (si activé)",
      "<code>RetriesUntilHint</code> : nb d'erreurs avant affichage de l'indice de mot de passe",
      "<code>GuestEnabled</code> : compte invité activé ?"
    ]
  },
  {
    os: "Mac", source: "SystemVersion.plist", category: "Config système", name: "Version OS et build",
    path: "/System/Library/CoreServices/SystemVersion.plist",
    versions: [],
    description: "ProductName, <b>ProductVersion</b> (ex: 14.5), ProductBuildVersion, ProductCopyright."
  },
  {
    os: "Mac", source: "/etc/localtime + .GlobalPreferences.plist", category: "Config système", name: "Fuseau horaire",
    path: "/etc/localtime ; /Library/Preferences/.GlobalPreferences.plist",
    versions: [],
    description: "<code>/etc/localtime</code> est un lien symbolique vers le fichier zoneinfo (ex: <code>/var/db/timezone/zoneinfo/Europe/Paris</code>). La clé <code>com.apple.TimeZonePref.Last_Selected_City</code> dans .GlobalPreferences.plist donne la ville sélectionnée."
  },
  {
    os: "Mac", source: "/etc/hosts + preferences.plist", category: "Config système", name: "Hostname & hosts",
    path: "/etc/hosts ; /Library/Preferences/SystemConfiguration/preferences.plist",
    versions: [],
    description: "Fichier hosts standard + nom d'hôte/Computer Name dans preferences.plist (clé <code>System\\System\\ComputerName</code>)."
  },
  {
    os: "Mac", source: "~/Library/Safari/", category: "Activité web", name: "Safari",
    path: "~/Library/Safari/",
    versions: [],
    description: "Données de navigation Safari.",
    bullets: [
      "<code>History.db</code> (SQLite) : historique",
      "<code>Bookmarks.plist</code> : favoris",
      "<code>Downloads.plist</code> : téléchargements",
      "<code>TopSites.plist</code>, <code>LastSession.plist</code>",
      "<code>~/Library/Containers/com.apple.Safari/Data/Library/Caches/</code> : cache (versions récentes sandboxées)"
    ]
  },
  {
    os: "Mac", source: "~/Library/Application Support/Firefox/", category: "Activité web", name: "Firefox (Mac)",
    path: "~/Library/Application Support/Firefox/Profiles/<random>.default/",
    versions: [],
    description: "Mêmes bases SQLite que sous Windows : <code>places.sqlite</code> (historique + bookmarks), <code>cookies.sqlite</code>, etc."
  },
  {
    os: "Mac", source: "~/Library/Application Support/Google/Chrome/", category: "Activité web", name: "Chrome (Mac)",
    path: "~/Library/Application Support/Google/Chrome/Default/",
    versions: [],
    description: "Mêmes bases SQLite que sur Windows : History, Cookies, Login Data, Web Data, Bookmarks."
  },
  {
    os: "Mac", source: ".plist (LSSharedFileList)", category: "Documents récents / MRU", name: "Recent files (système et par appli)",
    path: "~/Library/Preferences/com.apple.recentitems.plist ; ~/Library/Preferences/*LSSharedFileList.plist",
    versions: [],
    description: "Listes de fichiers, applications et serveurs récemment utilisés.",
    bullets: [
      "<code>com.apple.recentitems.plist</code> : niveau système (menu Pomme → Récents)",
      "<code>com.apple.LSSharedFileList.plist</code> : Recent Servers, Recent Hosts",
      "<code>*LSSharedFileList.plist</code> : par application (TextEdit, Preview, etc.)"
    ]
  },
  {
    os: "Mac", source: "com.apple.finder.plist", category: "Documents récents / MRU", name: "Finder MRU",
    path: "~/Library/Preferences/com.apple.finder.plist",
    versions: [],
    description: "Préférences Finder : derniers dossiers visités (<code>FXRecentFolders</code>), recherches récentes, derniers volumes."
  },
  {
    os: "Mac", source: "Trash", category: "Corbeille & Suppression", name: "Corbeille (Trash)",
    path: "~/.Trash ; /Volumes/<volume>/.Trashes/<UID>/",
    versions: [],
    description: "Une corbeille par utilisateur dans son home, et une par volume monté pour les fichiers supprimés depuis ce volume.",
    notes: "Sur APFS, certaines corbeilles sont gérées par snapshots."
  },
  {
    os: "Mac", source: "/private/var/db/diagnostics/ (Unified Log)", category: "Logs système", name: "Unified Logs (10.12+)",
    path: "/private/var/db/diagnostics/ ; /private/var/db/uuidtext/",
    versions: [],
    description: "Format moderne de logging macOS depuis Sierra (10.12). Remplace ASL, syslog, etc. Stocké en binaire (<code>.tracev3</code>).",
    bullets: [
      "<code>Persist/</code> : logs persistants",
      "<code>Special/</code>, <code>Signpost/</code>",
      "Lecture live : <code>log show --last 1h</code>",
      "<code>uuidtext/</code> : strings nécessaires au décodage des logs"
    ],
    notes: "Outils : UnifiedLogReader, macOS Unified Logs Parser."
  },
  {
    os: "Mac", source: "/private/var/log/asl/", category: "Logs système", name: "Apple System Log (ASL) — legacy",
    path: "/private/var/log/asl/",
    versions: [],
    description: "Ancien format de log pré-10.12 (toujours présent en complément de Unified Logs sur certaines versions)."
  },
  {
    os: "Mac", source: "/var/audit/", category: "Logs système", name: "Audit Log (BSM)",
    path: "/var/audit/*",
    versions: [],
    description: "Logs d'audit BSM (Basic Security Module). <b>Désactivés par défaut</b> sur les versions récentes — à activer pour avoir des audits OpenBSM."
  },
  {
    os: "Mac", source: "/var/log/install.log", category: "Logs système", name: "Installation log",
    path: "/var/log/install.log",
    versions: [],
    description: "Trace les installations et mises à jour de logiciels et de l'OS (.pkg, .dmg)."
  },
  {
    os: "Mac", source: "~/Library/Logs/", category: "Logs système", name: "Logs utilisateur et applications",
    path: "~/Library/Logs/* ; /Library/Logs/*",
    versions: [],
    description: "Logs spécifiques aux applications. Inclut les <b>diagnostic reports</b> (crash logs)."
  },
  {
    os: "Mac", source: "Shell history", category: "Historique shell / Commandes", name: "Bash / Zsh history",
    path: "~/.bash_history ; ~/.zsh_history",
    versions: [],
    description: "Historique des commandes shell. Sur macOS Catalina (10.15+), le shell par défaut est <b>zsh</b> donc <code>.zsh_history</code> est plus pertinent.",
    notes: "Voir aussi : <code>~/.python_history</code>, <code>~/.lesshst</code>."
  },

  // ============================================================
  //                         LINUX
  // ============================================================

  {
    os: "Linux", source: "/", category: "Référence", name: "Hiérarchie des dossiers Linux (FHS)",
    path: "/ — racine du filesystem",
    versions: [],
    description: "Standard FHS (Filesystem Hierarchy Standard). Emplacements importants pour l'investigation forensique.",
    bullets: [
      "<code>/bin</code>, <code>/sbin</code> : exécutables binaires",
      "<code>/etc</code> : fichiers de configuration (le \"registre\" de Linux)",
      "<code>/dev</code> : fichiers de périphériques",
      "<code>/home/&lt;user&gt;/</code> : répertoires home des utilisateurs",
      "<code>/lib</code>, <code>/lib*</code> : bibliothèques",
      "<code>/mnt</code>, <code>/media</code> : systèmes de fichiers montés",
      "<code>/opt</code> : logiciels tiers optionnels",
      "<code>/root</code> : home de l'utilisateur root",
      "<code>/tmp</code> : fichiers temporaires (souvent volatiles, RAM)",
      "<code>/usr</code> : données utilisateur en lecture seule (exécutables, libs)",
      "<code>/var</code> : <b>logs, données variables, spool, cache</b>",
      "<code>/proc</code> : pseudo-FS (état du noyau, runtime)",
      "<code>/sys</code> : pseudo-FS (informations matérielles, devices)"
    ]
  },
  {
    os: "Linux", source: "/etc/passwd", category: "Infos utilisateurs", name: "Comptes utilisateurs (passwd)",
    path: "/etc/passwd",
    versions: [],
    description: "Liste de tous les utilisateurs locaux. Lisible par tous.",
    bullets: [
      "Format : <code>login:x:UID:GID:GECOS:home:shell</code>",
      "Exemple : <code>dupond:x:1000:1020:Jean Dupond,,,:/home/dupond:/bin/bash</code>",
      "Le <code>x</code> indique que le hash est dans /etc/shadow",
      "UID 0 = root ; UID < 1000 = comptes système (généralement)",
      "Shell <code>/bin/false</code> ou <code>/usr/sbin/nologin</code> = pas de connexion interactive"
    ]
  },
  {
    os: "Linux", source: "/etc/shadow", category: "Infos utilisateurs", name: "Hashes mots de passe (shadow)",
    path: "/etc/shadow",
    versions: [],
    description: "Hash des mots de passe et politique d'expiration. Lisible <b>uniquement par root</b>.",
    bullets: [
      "Format : <code>username:$type$salt$hashed:lastchange:min:max:warn:inactivity:expire:</code>",
      "<b>Types de hash</b> :",
      "&nbsp;&nbsp;• <code>$1$</code> = MD5 (faible)",
      "&nbsp;&nbsp;• <code>$2a$</code>/<code>$2b$</code>/<code>$2y$</code> = Blowfish/bcrypt",
      "&nbsp;&nbsp;• <code>$5$</code> = SHA-256",
      "&nbsp;&nbsp;• <code>$6$</code> = SHA-512 (le plus courant)",
      "&nbsp;&nbsp;• <code>$y$</code> = yescrypt (moderne)",
      "&nbsp;&nbsp;• <code>$argon2*$</code> = Argon2",
      "Champs supplémentaires : date du dernier changement (jours depuis epoch), age min, age max, période d'avertissement, inactivité, date d'expiration"
    ]
  },
  {
    os: "Linux", source: "/etc/sudoers", category: "Infos utilisateurs", name: "Configuration sudo",
    path: "/etc/sudoers ; /etc/sudoers.d/",
    versions: [],
    description: "Définit qui peut utiliser sudo et avec quelles restrictions.",
    notes: "Combiner avec /etc/group (groupes wheel/sudo). Modifier UNIQUEMENT avec <code>visudo</code>."
  },
  {
    os: "Linux", source: "/etc/group", category: "Infos utilisateurs", name: "Groupes",
    path: "/etc/group",
    versions: [],
    description: "Liste des groupes. Format : <code>nom:x:GID:liste_membres_secondaires</code>"
  },
  {
    os: "Linux", source: "/home/<user>/", category: "Infos utilisateurs", name: "Répertoire utilisateur",
    path: "/home/<username>/",
    versions: [],
    description: "Home de chaque utilisateur. Contient configurations utilisateur (.bashrc, .ssh/, .config/), documents, caches d'applications.",
    bullets: [
      "Fichiers de config shell : <code>.bashrc</code>, <code>.bash_profile</code>, <code>.profile</code>, <code>.zshrc</code>",
      "Configurations XDG : <code>~/.config/</code>",
      "Caches : <code>~/.cache/</code>",
      "Données d'applications : <code>~/.local/share/</code>"
    ]
  },
  {
    os: "Linux", source: "/etc/hostname", category: "Config système", name: "Hostname",
    path: "/etc/hostname",
    versions: [],
    description: "Nom de la machine (une ligne)."
  },
  {
    os: "Linux", source: "/etc/timezone + /etc/localtime", category: "Config système", name: "Fuseau horaire",
    path: "/etc/timezone ; /etc/localtime",
    versions: [],
    description: "<code>/etc/timezone</code> : nom du TZ (ex: <code>Europe/Paris</code>). <code>/etc/localtime</code> : lien symbolique vers le fichier zoneinfo correspondant (ex: <code>/usr/share/zoneinfo/Europe/Paris</code>)."
  },
  {
    os: "Linux", source: "Multiples (selon distrib)", category: "Config système", name: "Interfaces réseau",
    path: "/etc/network/interfaces ; /etc/netplan/*.yaml ; /etc/NetworkManager/system-connections/",
    versions: [],
    description: "Configuration réseau. Le fichier varie selon la distribution.",
    bullets: [
      "Debian/Ubuntu ancien : <code>/etc/network/interfaces</code>",
      "Ubuntu récent : <code>/etc/netplan/*.yaml</code>",
      "RedHat/CentOS : <code>/etc/sysconfig/network-scripts/ifcfg-*</code>",
      "NetworkManager : <code>/etc/NetworkManager/system-connections/</code> (<b>contient les PSK Wi-Fi en clair pour root</b>)"
    ]
  },
  {
    os: "Linux", source: "/etc/os-release", category: "Config système", name: "Version de l'OS / distribution",
    path: "/etc/os-release ; /etc/issue ; /etc/lsb-release ; /etc/redhat-release",
    versions: [],
    description: "Identification de la distribution : <code>NAME</code>, <code>VERSION</code>, <code>ID</code>, <code>VERSION_ID</code>, <code>PRETTY_NAME</code>."
  },
  {
    os: "Linux", source: "/etc/hosts", category: "Config système", name: "Hosts",
    path: "/etc/hosts",
    versions: [],
    description: "Mappings IP ↔ hostname locaux, prioritaires sur le DNS. Détourner ce fichier est une technique courante de malware (redirection)."
  },
  {
    os: "Linux", source: "Home navigateur (~/)", category: "Activité web", name: "Navigateurs (Chrome, Firefox, Opera)",
    path: "~/.config/google-chrome/ ; ~/.mozilla/firefox/ ; ~/.config/opera/",
    versions: [],
    description: "Mêmes bases SQLite que sous Windows/Mac, dans le home utilisateur.",
    bullets: [
      "Chrome : <code>~/.config/google-chrome/Default/History</code>, <code>Cookies</code>, <code>Login Data</code>, <code>Bookmarks</code>",
      "Chromium : <code>~/.config/chromium/Default/</code>",
      "Firefox : <code>~/.mozilla/firefox/&lt;profil&gt;/places.sqlite</code>",
      "Cache : <code>~/.cache/google-chrome/</code>, <code>~/.cache/mozilla/firefox/</code>"
    ]
  },
  {
    os: "Linux", source: "~/.local/share/", category: "Documents récents / MRU", name: "Fichiers récents (XDG)",
    path: "~/.local/share/recently-used.xbel ; ~/.recently-used (legacy)",
    versions: [],
    description: "Fichier XML XBEL listant les fichiers récemment ouverts via les applications conformes à freedesktop.org (GTK/Nautilus/GNOME, KDE/Dolphin).",
    notes: "KDE complémentaire : <code>~/.local/share/RecentDocuments/</code>."
  },
  {
    os: "Linux", source: "~/.local/share/Trash/", category: "Corbeille & Suppression", name: "Corbeille (XDG Trash)",
    path: "~/.local/share/Trash/ ; /<volume>/.Trash-<UID>/",
    versions: [],
    description: "Standard XDG Trash. Trois sous-dossiers.",
    bullets: [
      "<code>files/</code> : <b>contenu</b> des fichiers supprimés",
      "<code>info/&lt;name&gt;.trashinfo</code> : <b>métadonnées</b> au format INI :",
      "&nbsp;&nbsp;<code>[Trash Info]\\nPath=/chemin/original\\nDeletionDate=ISO8601</code>",
      "<code>expunged/</code> : en cours d'effacement",
      "Pour les autres volumes (clé USB, partition externe) : <code>/.Trash-&lt;UID&gt;/</code> à la racine"
    ]
  },
  {
    os: "Linux", source: "/var/log/syslog (ou messages)", category: "Logs système", name: "Syslog / Messages",
    path: "/var/log/syslog (Debian/Ubuntu) ; /var/log/messages (RHEL/CentOS)",
    versions: [],
    description: "Journal complet : démarrage, kernel, réseau, erreurs système, activité USB.",
    notes: "Sur les systèmes systemd modernes, l'équivalent binaire est <b>journalctl</b> (<code>/var/log/journal/</code>). Lecture : <code>journalctl --since='2024-01-01' -u sshd</code>."
  },
  {
    os: "Linux", source: "/var/log/auth.log (ou secure)", category: "Authentification & Logon", name: "Logs d'authentification",
    path: "/var/log/auth.log (Debian) ; /var/log/secure (RHEL)",
    versions: [],
    description: "Toutes les tentatives de login (réussies/échouées), su, sudo, ssh.",
    bullets: [
      "Authentifications interactives (login, getty)",
      "Connexions SSH avec <b>IP source</b> et username",
      "Utilisations de sudo : utilisateur, commande, tty, cwd",
      "Changements de mot de passe, ajout/suppression de comptes",
      "Sessions PAM (pam_unix, pam_systemd)"
    ]
  },
  {
    os: "Linux", source: "/var/run/utmp + /var/log/{w,b}tmp", category: "Authentification & Logon", name: "Logins binaires (utmp / wtmp / btmp)",
    path: "/var/run/utmp ; /var/log/wtmp ; /var/log/btmp",
    versions: [],
    description: "Fichiers binaires de l'historique de connexions.",
    bullets: [
      "<code>utmp</code> : utilisateurs <b>actuellement</b> connectés (commande <code>who</code>)",
      "<code>wtmp</code> : <b>historique</b> des logins/logouts (commande <code>last</code>)",
      "<code>btmp</code> : <b>tentatives échouées</b> (commande <code>lastb</code>)",
      "Inclut les reboots (utilisateur <code>reboot</code>)"
    ]
  },
  {
    os: "Linux", source: "/var/spool/cron/ + /etc/cron*", category: "Tâches planifiées", name: "Cron jobs",
    path: "/var/spool/cron/crontabs/<user> ; /etc/crontab ; /etc/cron.d/ ; /etc/cron.{hourly,daily,weekly,monthly}/",
    versions: [],
    description: "Tâches planifiées par utilisateur et par système. Mécanisme classique de persistance (malware Linux).",
    bullets: [
      "<code>/var/spool/cron/crontabs/&lt;user&gt;</code> : crontab utilisateur (uniquement modifiable via <code>crontab -e</code>)",
      "<code>/etc/crontab</code> : crontab système",
      "<code>/etc/cron.d/</code> : drop-in directory",
      "<code>/etc/cron.{hourly,daily,weekly,monthly}/</code> : scripts à fréquence fixe",
      "Logs : <code>/var/log/cron</code> ou via journalctl"
    ],
    notes: "Voir aussi <b>systemd timers</b> : <code>systemctl list-timers</code>, fichiers <code>.timer</code> dans <code>/etc/systemd/system/</code> ; et <b>at</b> : <code>/var/spool/at/</code>."
  },
  {
    os: "Linux", source: "/etc/ssh + ~/.ssh", category: "Authentification & Logon", name: "SSH config et logs",
    path: "/etc/ssh/ ; ~/.ssh/ ; /var/log/auth.log",
    versions: [],
    description: "Configuration et utilisation de SSH (server et client).",
    bullets: [
      "<code>/etc/ssh/sshd_config</code> : config serveur (port, PermitRootLogin, etc.)",
      "<code>~/.ssh/authorized_keys</code> : <b>clés publiques autorisées</b> (à examiner pour persistance backdoor !)",
      "<code>~/.ssh/known_hosts</code> : serveurs auxquels on s'est connecté",
      "<code>~/.ssh/config</code> : alias et configurations clientes",
      "<code>~/.ssh/id_*</code> : clés privées (peuvent être utilisées pour pivot)",
      "Logs : auth.log/secure (Event: Accepted publickey, Failed password, etc.)"
    ]
  },
  {
    os: "Linux", source: "/var/log/{dpkg,apt,yum,dnf}*", category: "Programmes installés", name: "Logs de gestion de paquets",
    path: "/var/log/dpkg.log ; /var/log/apt/history.log ; /var/log/yum.log ; /var/log/dnf.log ; /var/log/pacman.log",
    versions: [],
    description: "Trace l'installation, mise à jour et suppression de paquets logiciels.",
    bullets: [
      "Debian/Ubuntu : <code>/var/log/dpkg.log</code> (bas niveau) + <code>/var/log/apt/history.log</code> (lisible)",
      "RHEL/Fedora : <code>/var/log/yum.log</code> ou <code>/var/log/dnf.log</code> et <code>/var/log/dnf.rpm.log</code>",
      "Arch : <code>/var/log/pacman.log</code>",
      "Snap : <code>/var/lib/snapd/state.json</code>",
      "Flatpak : <code>/var/log/flatpak.log</code>"
    ]
  },
  {
    os: "Linux", source: "Bash/Zsh history", category: "Historique shell / Commandes", name: "Bash / Zsh history",
    path: "~/.bash_history ; ~/.zsh_history",
    versions: [],
    description: "Historique des commandes saisies dans le terminal. Spécifique à chaque utilisateur.",
    bullets: [
      "Par défaut, sauvegardé à la fermeture du shell (variable <code>HISTSIZE</code> et <code>HISTFILESIZE</code>)",
      "<code>set -o history</code> active, <code>set +o history</code> désactive (peut indiquer une tentative de dissimulation)",
      "Avec <code>HISTTIMEFORMAT</code> défini, les <b>timestamps sont enregistrés</b> (lignes commençant par <code>#&lt;timestamp&gt;</code>)",
      "<b>HISTCONTROL=ignorespace</b> : commandes commençant par un espace ne sont pas enregistrées (technique d'évasion)"
    ],
    notes: "Voir aussi : <code>~/.python_history</code>, <code>~/.mysql_history</code>, <code>~/.lesshst</code>, <code>~/.viminfo</code>, <code>~/.sqlite_history</code>."
  },
  {
    os: "Linux", source: "Syslog + journalctl", category: "Périphériques USB / Matériel", name: "USB et périphériques connectés",
    path: "/var/log/syslog ; /var/log/kern.log ; journalctl -k",
    versions: [],
    description: "Le branchement de périphériques USB est tracé dans le syslog/kernel log.",
    bullets: [
      "Recherche dans les logs : <code>idVendor</code>, <code>idProduct</code>, <code>SerialNumber</code>, <code>Manufacturer</code>, <code>Product</code>",
      "Exemple : <code>kernel: usb 1-4.1: New USB device found, idVendor=18a5, idProduct=0238</code>",
      "Suivi du nom commercial : <code>Product: Store n Go Clip-it Drive</code>",
      "<code>SerialNumber: 3200000001162471</code>",
      "Permet de retracer toutes les insertions/retraits avec <b>timestamps précis</b>",
      "Voir aussi : <code>/var/log/messages</code>, <code>dmesg</code> (live)"
    ]
  },
  {
    os: "Linux", source: "Multiples (systemd, init, autostart)", category: "Démarrage automatique", name: "Persistance",
    path: "/etc/systemd/system/ ; /etc/init.d/ ; ~/.config/autostart/",
    versions: [],
    description: "Plusieurs mécanismes de démarrage automatique — premiers endroits à vérifier en cas de suspicion de persistance malware.",
    bullets: [
      "<b>systemd</b> (le plus courant aujourd'hui) :",
      "&nbsp;&nbsp;• <code>/etc/systemd/system/*.service</code> et <code>*.timer</code>",
      "&nbsp;&nbsp;• <code>/lib/systemd/system/*.service</code> (paquets distribués)",
      "&nbsp;&nbsp;• <code>~/.config/systemd/user/</code> : services systemd utilisateur",
      "&nbsp;&nbsp;• <code>systemctl list-unit-files --state=enabled</code> (live)",
      "<b>SysV init</b> (legacy) : <code>/etc/init.d/</code>, runlevels <code>/etc/rc?.d/</code>",
      "<b>rc.local</b> : <code>/etc/rc.local</code> (script exécuté au démarrage, legacy)",
      "<b>Session graphique</b> : <code>~/.config/autostart/*.desktop</code> (XDG Autostart)",
      "<b>Profils shell</b> (au login) : <code>/etc/profile</code>, <code>/etc/bash.bashrc</code>, <code>~/.bashrc</code>, <code>~/.profile</code>, <code>~/.bash_profile</code>",
      "<b>Cron</b> et <b>at</b> (voir Tâches planifiées)",
      "<b>Modules kernel</b> : <code>/etc/modules</code>, <code>/etc/modules-load.d/</code> (rootkits)"
    ]
  }
];

  // Exposition globale (consommé par artifacts-app.js)
  window.ARTIFACTS_DATA = data;
  window.ARTIFACTS_HIVE_FILES = HIVE_FILES;
})();
