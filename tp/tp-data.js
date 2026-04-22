// ═══════════════════════════════════════════════════════════════════
// tp-data.js — CAS-IN Travaux Pratiques
// Toutes les données statiques : signatures, cas juridiques, glossaire
// Ce fichier est chargé AVANT tp-engine.js
// ═══════════════════════════════════════════════════════════════════

// ╔═══════════════════════════════════════════════════════════════════╗
// ║ 1. MAGIC_DB — Signatures de fichiers (file carving)              ║
// ║    Utilisé par : genMagic, genMismatch (indirectement)           ║
// ║    Structure  : { sig, ext, desc, note }                          ║
// ╚═══════════════════════════════════════════════════════════════════╝

const MAGIC_DB = [
  // ── Images ──
  { sig: "FF D8 FF", ext: "jpg", desc: "Image JPEG (SOI + APPx)",
    note: "Les 3 premiers octets identifient tout JPEG. Le 4e octet varie : E0=APP0/JFIF, E1=APP1/EXIF, DB=SOI direct." },
  { sig: "89 50 4E 47 0D 0A 1A 0A", ext: "png", desc: "Image PNG",
    note: "La signature de 8 octets est très robuste. Le 0x89 détecte la corruption 7-bit." },
  { sig: "47 49 46 38", ext: "gif", desc: "Image GIF (GIF87a ou GIF89a)",
    note: "Suivi de '37 61' (GIF87a) ou '39 61' (GIF89a). GIF89a supporte l'animation et la transparence." },
  { sig: "42 4D", ext: "bmp", desc: "Image Bitmap Windows (BM)",
    note: "'BM' en ASCII. Les octets 2-5 donnent la taille totale du fichier en Little Endian." },
  { sig: "49 49 2A 00", ext: "tif", desc: "Image TIFF (Little Endian)",
    note: "'II*\\0' en ASCII. La variante Big Endian commence par 'MM\\0*' (4D 4D 00 2A)." },

  // ── Documents ──
  { sig: "25 50 44 46", ext: "pdf", desc: "PDF — Portable Document Format",
    note: "'%PDF' en ASCII. Suivi de la version : 25 50 44 46 2D 31 2E 37 = '%PDF-1.7'." },
  { sig: "D0 CF 11 E0 A1 B1 1A E1", ext: "doc", desc: "Office 97-2003 (OLE2 Compound)",
    note: "Format OLE2 utilisé par les anciens .doc, .xls, .ppt. Mêmes signatures pour tous les trois." },
  { sig: "50 4B 03 04", ext: "docx", desc: "Office Open XML (OOXML) / ZIP",
    note: "Les formats .docx, .xlsx, .pptx sont des archives ZIP renommées. Signature identique à un ZIP standard." },

  // ── Archives ──
  { sig: "50 4B 03 04", ext: "zip", desc: "Archive ZIP",
    note: "La signature PK\\x03\\x04 initie un Local File Header. Fin avec PK\\x05\\x06 (End of Central Directory)." },
  { sig: "52 61 72 21 1A 07 00", ext: "rar", desc: "Archive RAR v4.x",
    note: "RAR 5.x : 52 61 72 21 1A 07 01 00 (le 8e octet distingue les deux versions)." },
  { sig: "37 7A BC AF 27 1C", ext: "7z", desc: "Archive 7-Zip",
    note: "Signature unique sur 6 octets. Compression LZMA/LZMA2 très efficace." },
  { sig: "1F 8B 08", ext: "gz", desc: "Archive GZIP",
    note: "Le 3e octet (08) indique la méthode DEFLATE. Souvent utilisé pour tar.gz." },
  { sig: "42 5A 68", ext: "bz2", desc: "Archive BZip2 (BZh)",
    note: "Le 4e octet ('0' à '9') indique la taille du bloc : '9' = 900 KB (défaut)." },
  { sig: "75 73 74 61 72", ext: "tar", desc: "Archive TAR (ustar, offset 257)",
    note: "Apparaît à l'offset 257, pas 0. Le TAR classique n'a pas de signature en début. Certains outils mettent '../../bin/tar' avant." },

  // ── Exécutables ──
  { sig: "4D 5A", ext: "exe", desc: "Exécutable PE Windows (MZ)",
    note: "'MZ' = Mark Zbikowski, dev MS-DOS. L'offset 0x3C pointe vers 'PE\\0\\0' (en-tête PE32/PE32+)." },
  { sig: "7F 45 4C 46", ext: "elf", desc: "Exécutable ELF (Linux/Unix)",
    note: "'.ELF' en ASCII. L'octet 4 : 1=32-bit, 2=64-bit. L'octet 5 : 1=LE, 2=BE." },
  { sig: "CE FA ED FE", ext: "macho", desc: "Mach-O 32-bit (macOS)",
    note: "Little Endian. 64-bit : CF FA ED FE. Universel (fat binary) : CA FE BA BE." },

  // ── Audio/Vidéo ──
  { sig: "49 44 33", ext: "mp3", desc: "MP3 avec tag ID3",
    note: "Tag ID3 suivi de la version. Sans ID3 : FF FB, FF F3, FF F2 (frame sync)." },
  { sig: "52 49 46 46", ext: "wav", desc: "RIFF Container (WAV)",
    note: "Les octets 8-11 précisent le sous-type : 57 41 56 45='WAVE' pour audio." },
  { sig: "52 49 46 46", ext: "avi", desc: "RIFF Container (AVI)",
    note: "Les octets 8-11 : 41 56 49 20 = 'AVI '. Même en-tête RIFF que WAV, sous-type différent." },
  { sig: "66 74 79 70", ext: "mp4", desc: "Container MPEG-4 (MP4, MOV, M4V)",
    note: "Apparaît à l'offset 4 (précédé par 4 octets de taille en Big Endian). Sous-type 'mp42' ou 'qt  ' (MOV)." },
  { sig: "1A 45 DF A3", ext: "mkv", desc: "Container Matroska (MKV, WebM)",
    note: "EBML signature. MKV = vidéo générique, WebM = sous-ensemble pour le web (VP8/VP9)." },
  { sig: "4F 67 67 53", ext: "ogg", desc: "Container OGG (audio Vorbis, vidéo Theora)",
    note: "'OggS' en ASCII. Format libre souvent utilisé en alternative à MP3/MP4." },

  // ── Disques / Virtualisation ──
  { sig: "4B 44 4D 56", ext: "vmdk", desc: "Disque virtuel VMware (KDMV)",
    note: "Format VMware Workstation. Très courant en forensique de cloud et de virtualisation." },
  { sig: "63 6F 6E 65 63 74 69 78", ext: "vhd", desc: "Disque virtuel Microsoft VHD",
    note: "'conectix' en ASCII, à l'offset 0 (footer) ou à la fin du fichier selon le type." },
  { sig: "45 56 46", ext: "e01", desc: "Image forensique EnCase (EWF)",
    note: "Expert Witness Format / EnCase. Signature 'EVF' suivie de \\x09\\x0D\\x0A\\xFF\\x00." },

  // ── BOM / Texte ──
  { sig: "EF BB BF", ext: "txt", desc: "Texte UTF-8 avec BOM",
    note: "Byte Order Mark UTF-8. Redondant techniquement mais souvent ajouté par Notepad (Windows)." },
  { sig: "FF FE", ext: "txt", desc: "Texte UTF-16 Little Endian (BOM)",
    note: "Format natif de Windows pour les fichiers Unicode. Chaque caractère ASCII = 2 octets." },
  { sig: "FE FF", ext: "txt", desc: "Texte UTF-16 Big Endian (BOM)",
    note: "Plus rare, utilisé historiquement sur certains systèmes UNIX." },

  // ── Bases SQLite ──
  { sig: "53 51 4C 69 74 65 20 66 6F 72 6D 61 74 20 33 00", ext: "db", desc: "Base SQLite 3",
    note: "'SQLite format 3' + \\x00. Utilisé par Chrome, Firefox, WhatsApp, iOS, Android, et d'innombrables apps." },
];


// ╔═══════════════════════════════════════════════════════════════════╗
// ║ 2. MISMATCH_DB — Cas d'extension ≠ signature (file carving)      ║
// ║    Utilisé par : genMismatch                                      ║
// ║    Structure  : { fake, bytes, real, sig_name, note }             ║
// ║      fake     = nom de fichier trompeur                           ║
// ║      bytes    = 8 premiers octets hex                             ║
// ║      real     = extension réelle (chaîne simple)                  ║
// ║      sig_name = nom lisible de la signature                       ║
// ║      note     = explication didactique                            ║
// ╚═══════════════════════════════════════════════════════════════════╝

const MISMATCH_DB = [
  { fake: "rapport.txt", bytes: "FF D8 FF E0 00 10 4A 46", real: "jpg", sig_name: "JPEG",
    note: "Les 3 octets FF D8 FF identifient un JPEG. Le E0 indique un JFIF, 4A 46 = 'JF' de 'JFIF'." },
  { fake: "cv.pdf", bytes: "50 4B 03 04 14 00 00 00", real: "zip", sig_name: "ZIP",
    note: "PK\\x03\\x04 est la signature ZIP. Attention : les .docx sont aussi des ZIP — vérifier le contenu." },
  { fake: "facture.docx", bytes: "25 50 44 46 2D 31 2E 37", real: "pdf", sig_name: "PDF",
    note: "'%PDF-1.7' en ASCII. Un attaquant peut masquer un PDF en .docx pour contourner un filtre." },
  { fake: "photo.jpg", bytes: "4D 5A 90 00 03 00 00 00", real: "exe", sig_name: "PE (Windows)",
    note: "'MZ' est la signature d'un exécutable Windows. Cacher un .exe en .jpg = technique de phishing classique." },
  { fake: "notes.txt", bytes: "89 50 4E 47 0D 0A 1A 0A", real: "png", sig_name: "PNG",
    note: "Signature PNG de 8 octets. Un PNG renommé en .txt peut cacher de la stéganographie." },
  { fake: "musique.mp3", bytes: "50 4B 03 04 14 00 06 00", real: "zip", sig_name: "ZIP (OOXML possible)",
    note: "PK\\x03\\x04 = archive ZIP. Si le contenu contient '[Content_Types].xml', c'est un .docx/.xlsx/.pptx." },
  { fake: "backup.zip", bytes: "52 61 72 21 1A 07 00 00", real: "rar", sig_name: "RAR v4",
    note: "'Rar!\\x1A\\x07\\x00' = RAR 4.x. RAR 5.x se termine par 01 00 au lieu de 00 00." },
  { fake: "image.png", bytes: "25 50 44 46 2D 31 2E 35", real: "pdf", sig_name: "PDF",
    note: "'%PDF-1.5' — un PDF peut contenir du JavaScript malveillant ou des pièces jointes cachées." },
  { fake: "data.bin", bytes: "53 51 4C 69 74 65 20 66", real: "db", sig_name: "SQLite 3",
    note: "'SQLite ' = début de 'SQLite format 3'. Bases d'applis mobiles (WhatsApp, Signal, navigateurs)." },
  { fake: "archive.7z", bytes: "1F 8B 08 00 00 00 00 00", real: "gz", sig_name: "GZIP",
    note: "1F 8B = GZIP, pas 7z (qui est 37 7A BC AF 27 1C). Renommé pour tromper un filtre." },
  { fake: "photo.gif", bytes: "FF D8 FF E1 12 34 45 78", real: "jpg", sig_name: "JPEG (EXIF)",
    note: "FF D8 FF E1 = JPEG avec métadonnées EXIF. Les photos de smartphones incluent GPS, date, appareil." },
  { fake: "exec.dll", bytes: "7F 45 4C 46 02 01 01 00", real: "elf", sig_name: "ELF 64-bit LE",
    note: "'\\x7FELF' = Linux/Unix. Octet 4=02 → 64-bit. Octet 5=01 → Little Endian." },
  { fake: "virus.jpg", bytes: "4D 5A 78 00 01 00 00 00", real: "exe", sig_name: "PE (Windows)",
    note: "MZ = exécutable Windows. Même si .jpg, ce fichier peut être exécuté si le système est mal configuré." },
  { fake: "secret.docx", bytes: "D0 CF 11 E0 A1 B1 1A E1", real: "doc", sig_name: "OLE2 (Office ancien)",
    note: "OLE2 = format Office 97-2003. Un .doc renommé en .docx — attention, macros potentiellement malveillantes." },
  { fake: "pub.avi", bytes: "52 49 46 46 24 A8 00 00", real: "wav", sig_name: "RIFF/WAV",
    note: "RIFF container. Les octets 8-11 déterminent WAVE ou AVI — il faut les vérifier pour trancher." },
];


// ╔═══════════════════════════════════════════════════════════════════╗
// ║ 3. GLOSSAIRE — Termes bilingues FR/EN (flashcards)               ║
// ║    Utilisé par : genGlossaire                                     ║
// ║    Structure  : { fr, en, note }                                  ║
// ╚═══════════════════════════════════════════════════════════════════╝

const GLOSSAIRE = [
  // ── Acquisition / preuve ──
  { fr: "Copie forensique", en: "Forensic image",
    note: "Copie bit-à-bit d'un support, incluant espace non-alloué et slack space." },
  { fr: "Empreinte numérique", en: "Hash / Digest",
    note: "Valeur mathématique unique d'un fichier. MD5, SHA-1, SHA-256." },
  { fr: "Bloqueur d'écriture", en: "Write blocker",
    note: "Matériel ou logiciel empêchant toute modification du support source pendant l'acquisition." },
  { fr: "Scellé", en: "Evidence seal",
    note: "Contenant sécurisé préservant l'intégrité d'un objet saisi. Numéro unique tracé." },
  { fr: "Chaîne de possession", en: "Chain of custody",
    note: "Traçabilité complète d'une preuve du terrain au tribunal. Un trou = preuve attaquable." },
  { fr: "Espace non-alloué", en: "Unallocated space",
    note: "Secteurs du disque non attribués à un fichier. Peut contenir des données supprimées récupérables." },
  { fr: "Slack space", en: "Slack space",
    note: "Espace résiduel entre la fin logique d'un fichier et la fin du cluster. Peut contenir d'anciennes données." },
  { fr: "Sauvegarde miroir", en: "Mirror backup",
    note: "Copie exacte bit-à-bit d'un volume (≠ sauvegarde logique)." },

  // ── Systèmes de fichiers ──
  { fr: "Table d'allocation", en: "File allocation table",
    note: "Structure FAT qui liste les clusters alloués et la chaîne de fichiers." },
  { fr: "Table de fichiers maîtres", en: "Master File Table (MFT)",
    note: "Structure NTFS contenant une entrée pour chaque fichier/dossier du volume." },
  { fr: "Secteur d'amorçage", en: "Boot sector",
    note: "Premier secteur d'un volume (LBA 0), contient le code de démarrage + paramètres FS." },
  { fr: "Cluster", en: "Cluster / Allocation unit",
    note: "Unité d'allocation minimale d'un FS. Typiquement 4 KiB (NTFS) ou 512 B (FAT12)." },
  { fr: "Registre", en: "Registry (Windows)",
    note: "Base hiérarchique de configuration Windows (SAM, SYSTEM, SOFTWARE, NTUSER.DAT…)." },
  { fr: "Journal (journaling)", en: "Journal",
    note: "Log des transactions du FS pour garantir la cohérence. NTFS: $LogFile, EXT4: jbd2." },

  // ── Artefacts / analyse ──
  { fr: "Analyse morte", en: "Dead analysis / Offline analysis",
    note: "Analyse d'une image de disque d'un système éteint. Pas d'état RAM." },
  { fr: "Analyse vivante", en: "Live analysis",
    note: "Analyse d'un système en fonctionnement. Permet le dump RAM mais modifie le système." },
  { fr: "Données volatiles", en: "Volatile data",
    note: "Données qui disparaissent à l'extinction : RAM, processus actifs, connexions réseau." },
  { fr: "Artefact", en: "Artifact",
    note: "Trace laissée par une activité. Ex. Prefetch = preuve d'exécution d'un programme." },
  { fr: "Chronologie", en: "Timeline",
    note: "Reconstruction temporelle des événements. Outils : log2timeline, Plaso, Timeline Explorer." },
  { fr: "Horodatage", en: "Timestamp",
    note: "Marqueur temporel. Attention aux fuseaux horaires (UTC vs local) et à l'heure d'été." },

  // ── Malware / attaque ──
  { fr: "Logiciel malveillant", en: "Malware",
    note: "Terme générique : virus, cheval de Troie, ver, rançongiciel, spyware, rootkit." },
  { fr: "Rançongiciel", en: "Ransomware",
    note: "Malware qui chiffre les données et demande une rançon pour la clé de déchiffrement." },
  { fr: "Cheval de Troie", en: "Trojan horse",
    note: "Programme d'apparence légitime qui cache des fonctions malveillantes." },
  { fr: "Porte dérobée", en: "Backdoor",
    note: "Mécanisme caché permettant un accès distant non autorisé." },
  { fr: "Hameçonnage", en: "Phishing",
    note: "Technique d'ingénierie sociale pour voler des identifiants via faux emails/sites." },
  { fr: "Persistance", en: "Persistence",
    note: "Capacité d'un malware à survivre aux redémarrages. Via Run Keys, services, tâches planifiées." },
  { fr: "Charge utile", en: "Payload",
    note: "Partie d'un malware qui exécute l'action malveillante réelle (vs la partie d'infection)." },
  { fr: "Indicateur de compromission", en: "Indicator of Compromise (IoC)",
    note: "Trace qui signe une attaque : hash de malware, IP C2, nom de fichier, clé registre." },

  // ── Cryptographie ──
  { fr: "Chiffrement", en: "Encryption",
    note: "Transformation de données en clair vers un format illisible sans clé." },
  { fr: "Chiffrement de bout en bout", en: "End-to-end encryption (E2EE)",
    note: "Seuls l'émetteur et le destinataire peuvent lire les données. Utilisé par Signal, WhatsApp." },
  { fr: "Clé publique / privée", en: "Public / Private key",
    note: "Paire asymétrique. Publique = chiffrement, Privée = déchiffrement (RSA, ECC)." },
  { fr: "Mot-clé de récupération", en: "Seed phrase / Recovery key",
    note: "Pour les wallets crypto : 12 ou 24 mots qui donnent accès à tous les fonds." },

  // ── Réseau ──
  { fr: "Capture réseau", en: "Packet capture / PCAP",
    note: "Fichier contenant des trames réseau brutes. Analysé par Wireshark, tcpdump." },
  { fr: "Commande et contrôle", en: "Command and Control (C2)",
    note: "Serveur distant utilisé par un attaquant pour piloter ses malwares infectés." },
  { fr: "Mouvement latéral", en: "Lateral movement",
    note: "Technique de propagation d'un attaquant à travers un réseau compromis." },

  // ── Droit ──
  { fr: "Perquisition", en: "Search (judicial)",
    note: "Fouille légale d'un lieu dans le cadre d'une enquête pénale. Art. 244 CPP suisse." },
  { fr: "Mandat", en: "Warrant",
    note: "Autorisation judiciaire pour perquisition, saisie ou écoute." },
  { fr: "Preuve admissible", en: "Admissible evidence",
    note: "Preuve recevable par le tribunal : obtenue légalement, traçable, fiable." },
  { fr: "Entraide judiciaire", en: "Mutual legal assistance (MLAT)",
    note: "Coopération internationale pour l'obtention de preuves. En Suisse : EIMP." },
];


// ╔═══════════════════════════════════════════════════════════════════╗
// ║ 4. DROIT_CASES — Cas de droit pénal suisse (QCM)                 ║
// ║    Utilisé par : genDroitPenal                                    ║
// ║    Structure  : { action, choices, correct, note }                ║
// ║      action  = description du fait                                ║
// ║      choices = [{ art, label, explain }, ...]                     ║
// ║      correct = art correct (string, ou 'both' pour 143/143bis)    ║
// ║      note    = remarque pédagogique                               ║
// ╚═══════════════════════════════════════════════════════════════════╝

const DROIT_CASES = [
  {
    action: "Un employé copie sans autorisation des fichiers clients de son entreprise sur sa clé USB personnelle avant de démissionner.",
    choices: [
      { art: "143", label: "Art. 143 CP — Soustraction de données",
        explain: "Art. 143 CP — Soustraction de données : celui qui, dans le dessein de se procurer un enrichissement illégitime, aura soustrait des données informatiques stockées." },
      { art: "143bis", label: "Art. 143bis CP — Accès indu à un système informatique",
        explain: "Art. 143bis CP concerne l'accès sans droit à un système protégé, pas le fait de copier des données auxquelles on a déjà accès." },
      { art: "144bis", label: "Art. 144bis CP — Détérioration de données",
        explain: "Art. 144bis vise la destruction ou modification, pas la simple copie." },
      { art: "162", label: "Art. 162 CP — Violation du secret commercial",
        explain: "Art. 162 peut aussi s'appliquer selon la nature des données, mais l'Art. 143 est plus direct pour la soustraction." },
    ],
    correct: "143",
    note: "La soustraction de données (Art. 143) suppose un dessein d'enrichissement. Sans ce dessein, Art. 162 (secret commercial) peut s'appliquer."
  },
  {
    action: "Un hacker accède sans autorisation à la base de données RH d'une entreprise en exploitant une faille, mais ne copie ni ne modifie rien.",
    choices: [
      { art: "143", label: "Art. 143 CP — Soustraction de données",
        explain: "Art. 143 exige une soustraction effective. Ici il n'y en a pas." },
      { art: "143bis", label: "Art. 143bis CP — Accès indu à un système informatique",
        explain: "Art. 143bis CP — Exactement le cas : accès sans droit à un système contre lequel l'accès est spécialement protégé." },
      { art: "144bis", label: "Art. 144bis CP — Détérioration de données",
        explain: "Art. 144bis nécessite une modification ou destruction de données." },
      { art: "147", label: "Art. 147 CP — Utilisation frauduleuse d'un ordinateur",
        explain: "Art. 147 exige un dessein d'enrichissement via une opération électronique." },
    ],
    correct: "143bis",
    note: "Art. 143bis punit l'intrusion elle-même, même sans intention de nuire. Le simple fait d'entrer sans droit suffit."
  },
  {
    action: "Un attaquant chiffre tous les fichiers d'un serveur d'entreprise et demande une rançon pour les déchiffrer.",
    choices: [
      { art: "143", label: "Art. 143 CP — Soustraction de données",
        explain: "Art. 143 vise la copie/soustraction, pas la modification." },
      { art: "144bis", label: "Art. 144bis CP — Détérioration de données",
        explain: "Art. 144bis CP — Chiffrer des données sans droit = les rendre inutilisables, donc les détériorer." },
      { art: "156", label: "Art. 156 CP — Extorsion",
        explain: "Art. 156 s'applique pour la demande de rançon (menace de ne pas rendre les données)." },
      { art: "147", label: "Art. 147 CP — Utilisation frauduleuse d'un ordinateur",
        explain: "Art. 147 vise l'enrichissement via manipulation informatique, pas directement le chiffrement." },
    ],
    correct: "144bis",
    note: "Un ransomware viole typiquement Art. 143bis (intrusion) + Art. 144bis (détérioration) + Art. 156 (extorsion). Concours d'infractions."
  },
  {
    action: "Un employé utilise son accès légitime au système pour créer de fausses factures et détourner des paiements vers son propre compte.",
    choices: [
      { art: "143bis", label: "Art. 143bis CP — Accès indu",
        explain: "L'accès était légitime dans le cadre du travail — pas d'intrusion." },
      { art: "144bis", label: "Art. 144bis CP — Détérioration",
        explain: "Pas de destruction de données ici." },
      { art: "147", label: "Art. 147 CP — Utilisation frauduleuse d'un ordinateur",
        explain: "Art. 147 CP — Exactement : utilisation incorrecte de données pour obtenir un avantage patrimonial illicite." },
      { art: "158", label: "Art. 158 CP — Gestion déloyale",
        explain: "Art. 158 peut aussi s'appliquer si l'employé a une position de garant, mais Art. 147 est plus spécifique au volet informatique." },
    ],
    correct: "147",
    note: "L'Art. 147 est l'article clé pour la fraude informatique. Concours possible avec Art. 158 selon le contexte."
  },
  {
    action: "Un suspect utilise Tor pour accéder à un forum du dark web où il consulte (sans télécharger) des contenus à caractère pédopornographique.",
    choices: [
      { art: "197", label: "Art. 197 CP — Pornographie",
        explain: "Art. 197 al. 5 CP — Possession ET consommation (même sans téléchargement) sont punissables dès lors qu'il s'agit de représentations impliquant des mineurs." },
      { art: "143bis", label: "Art. 143bis CP — Accès indu",
        explain: "Pas pertinent : l'accès au forum n'est pas 'indu' au sens technique." },
      { art: "261bis", label: "Art. 261bis CP — Discrimination raciale",
        explain: "Hors sujet." },
      { art: "135", label: "Art. 135 CP — Représentation de la violence",
        explain: "Art. 135 concerne la violence, pas la pornographie juvénile (Art. 197 spécifique)." },
    ],
    correct: "197",
    note: "La consommation — même sans stockage — de pornographie juvénile est punissable en Suisse depuis 2014 (Art. 197 al. 5)."
  },
  {
    action: "Un intrus pénètre dans un réseau d'entreprise, installe un keylogger, puis revend les mots de passe récoltés sur le dark web.",
    choices: [
      { art: "143bis", label: "Art. 143bis seulement",
        explain: "L'accès non autorisé existe, mais il y a plus : l'installation d'un malware et la revente." },
      { art: "143", label: "Art. 143 + 143bis + 147",
        explain: "Art. 143bis (accès) + Art. 143 (soustraction de données) + Art. 147 possible si utilisation frauduleuse ultérieure." },
      { art: "144bis", label: "Art. 144bis seulement",
        explain: "La détérioration n'est pas l'infraction principale ici." },
      { art: "156", label: "Art. 156 — Extorsion",
        explain: "Pas d'extorsion : pas de menace ou demande de rançon." },
    ],
    correct: "143",
    note: "Cas typique de concours d'infractions. L'accusation retient généralement les Art. 143, 143bis, et parfois 147/144bis selon les actes."
  },
  {
    action: "Une personne publie sur Twitter des propos incitant à la haine contre un groupe ethnique.",
    choices: [
      { art: "261bis", label: "Art. 261bis CP — Discrimination raciale",
        explain: "Art. 261bis CP — Incitation publique à la haine, discrimination ou injure fondée sur la race/ethnie/religion." },
      { art: "173", label: "Art. 173 CP — Diffamation",
        explain: "Diffamation concerne des allégations de fait contre une personne déterminée, pas un groupe." },
      { art: "177", label: "Art. 177 CP — Injure",
        explain: "Injure vise une personne, pas un groupe. L'Art. 261bis est spécifique aux groupes protégés." },
      { art: "143bis", label: "Art. 143bis — Accès indu",
        explain: "Sans rapport avec le contenu du message." },
    ],
    correct: "261bis",
    note: "Art. 261bis = racisme. L'auteur doit savoir qu'il vise un groupe protégé. La diffusion publique (Twitter) est un élément constitutif."
  },
  {
    action: "Un suspect utilise un RAT (Remote Access Trojan) pour activer à distance la webcam d'une victime et enregistrer son intimité.",
    choices: [
      { art: "179quater", label: "Art. 179quater CP — Violation du domaine secret/privé par appareil de prise de vues",
        explain: "Art. 179quater CP — Enregistrement par appareil de prise de vues sans le consentement d'une personne dans son domaine privé." },
      { art: "143bis", label: "Art. 143bis CP — Accès indu",
        explain: "Art. 143bis s'applique aussi (accès à l'ordinateur), mais 179quater est l'article phare pour la prise de vue." },
      { art: "173", label: "Art. 173 CP — Diffamation",
        explain: "Pas de diffamation : il n'y a pas (encore) de publication." },
      { art: "197", label: "Art. 197 CP — Pornographie",
        explain: "Pertinent seulement si la victime est mineure ou si le contenu est publié." },
    ],
    correct: "179quater",
    note: "Concours : Art. 143bis (intrusion) + Art. 179quater (prise de vue). Si publication : Art. 197 possible selon le contenu."
  },
];


// ╔═══════════════════════════════════════════════════════════════════╗
// ║ 5. EMAIL_EXERCISES — Analyse d'en-têtes email                    ║
// ║    Utilisé par : genEmail                                         ║
// ║    Structure  : { scenario, question, choices: [{label, correct,  ║
// ║                                                    explain}] }    ║
// ╚═══════════════════════════════════════════════════════════════════╝

const EMAIL_EXERCISES = [
  {
    scenario: "Tu reçois un email de 'support@banque-populaire-ch.com'. L'en-tête contient :\n" +
              "From: Support Banque <support@banque-populaire-ch.com>\n" +
              "Return-Path: <bounce+7812@mailer-sender.xyz>\n" +
              "Received: from mail-sender-xyz.ru (185.220.12.34)\n" +
              "SPF: FAIL (banque-populaire-ch.com ne liste pas 185.220.12.34)",
    question: "Quel indice est le plus probant pour identifier un email de phishing ?",
    choices: [
      { text: "Le 'From' contient 'Support Banque' (trop formel)", correct: false,
        explain: "Le nom d'affichage est facilement falsifiable, ce n'est pas un indicateur technique." },
      { text: "Le SPF est en FAIL — le domaine émetteur ne reconnaît pas cette IP", correct: true,
        explain: "SPF FAIL signifie que le domaine prétendu n'autorise PAS cette IP à envoyer en son nom. Indicateur technique fort de spoofing." },
      { text: "L'IP est en Russie (185.220.12.34)", correct: false,
        explain: "La géolocalisation seule n'est pas décisive — des serveurs légitimes peuvent être n'importe où." },
      { text: "Le Return-Path contient un chiffre (bounce+7812)", correct: false,
        explain: "Les chiffres dans Return-Path sont courants pour le tracking de bounces, pas suspects en soi." },
    ]
  },
  {
    scenario: "En-tête d'un email suspect :\n" +
              "From: CEO <ceo@entreprise.ch>\n" +
              "Reply-To: ceo.urgent@proton.me\n" +
              "DKIM: PASS (entreprise.ch)\n" +
              "SPF: PASS",
    question: "DKIM et SPF passent. L'email est-il authentique ?",
    choices: [
      { text: "Oui — DKIM PASS = signature cryptographique valide, c'est authentique", correct: false,
        explain: "DKIM PASS prouve que le message vient bien du domaine signé, mais pas que l'expéditeur humain est celui qu'il prétend (compte compromis possible)." },
      { text: "Non — le Reply-To pointe vers un domaine tiers (proton.me), typique d'un CEO fraud", correct: true,
        explain: "Un Reply-To différent du From est un drapeau rouge classique du CEO fraud / BEC (Business Email Compromise). La réponse ira au fraudeur." },
      { text: "Oui — SPF PASS garantit que l'IP est autorisée", correct: false,
        explain: "SPF PASS valide l'IP, mais si le compte est compromis, tout PASS." },
      { text: "Impossible à dire sans analyser le contenu", correct: false,
        explain: "Le Reply-To divergent suffit à éveiller les soupçons techniques." },
    ]
  },
  {
    scenario: "Analyse forensique d'un email de phishing :\n" +
              "Received: from mx.attacker.ru (192.0.2.50)\n" +
              "Received: from relay.cloudflarenet.com (104.16.132.229)\n" +
              "Received: from internal.victim.com (10.0.0.5)",
    question: "Dans quel ordre lire ces lignes Received pour reconstituer le trajet ?",
    choices: [
      { text: "Du haut vers le bas (comme on lit normalement)", correct: false,
        explain: "Erreur classique. Les lignes Received sont empilées au fur et à mesure — la plus récente est en haut." },
      { text: "Du bas vers le haut — l'origine est en bas, la dernière machine en haut", correct: true,
        explain: "Chaque serveur ajoute une ligne Received EN TÊTE. Donc le trajet se lit de bas en haut : origine → relais → destination." },
      { text: "Dans un ordre aléatoire, les en-têtes ne sont pas fiables", correct: false,
        explain: "Les lignes Received sont standardisées et empilées dans un ordre précis." },
      { text: "Peu importe l'ordre, seule l'IP du From compte", correct: false,
        explain: "L'IP du From est absente des en-têtes — seules les Received donnent le trajet réel." },
    ]
  },
  {
    scenario: "Un email d'apparence interne contient cet en-tête :\n" +
              "From: jean.dupont@mairie-geneve.ch\n" +
              "DKIM: NONE\n" +
              "SPF: NEUTRAL\n" +
              "DMARC: p=none",
    question: "Que signifie 'DMARC: p=none' pour l'analyse forensique ?",
    choices: [
      { text: "DMARC est désactivé — le domaine n'applique aucune politique, le spoofing est trivial", correct: true,
        explain: "p=none signifie 'monitor only' — le domaine reçoit des rapports mais ne demande aucune action. Un attaquant peut spoof sans être bloqué." },
      { text: "DMARC fonctionne normalement", correct: false,
        explain: "p=none = politique inactive. Les politiques strictes sont p=quarantine ou p=reject." },
      { text: "DMARC a échoué", correct: false,
        explain: "p=none n'est pas un échec — c'est une politique volontairement inactive." },
      { text: "L'email est authentique", correct: false,
        explain: "Rien dans p=none ne garantit l'authenticité." },
    ]
  },
];


// ╔═══════════════════════════════════════════════════════════════════╗
// ║ 6. IR_EXERCISES — Incident Response (QCM scénarios)              ║
// ║    Utilisé par : genIR                                            ║
// ║    Structure  : { scenario, question, choices }                   ║
// ╚═══════════════════════════════════════════════════════════════════╝

const IR_EXERCISES = [
  {
    scenario: "16:32 — Un analyste SOC reçoit une alerte : 'Ransomware signature detected on HOST-WIN-42'. Le poste est connecté au réseau de production. Les sauvegardes sont sur un NAS accessible en SMB depuis le poste.",
    question: "Première action (phase NIST : Containment) ?",
    choices: [
      { text: "Éteindre le poste immédiatement par arrêt propre", correct: false,
        explain: "L'arrêt propre peut déclencher des scripts de shutdown du malware et détruire la RAM (clés de chiffrement en mémoire !)." },
      { text: "Isoler le poste du réseau (débrancher le câble) sans l'éteindre", correct: true,
        explain: "Isolation réseau immédiate = bloque la propagation ET le C2. Maintenir sous tension = préserve la RAM (forensique) et les clés de chiffrement." },
      { text: "Lancer un scan antivirus complet", correct: false,
        explain: "Un scan pendant une attaque en cours = modification du disque (écriture de logs AV) et possible destruction d'IOCs. Inutile ici." },
      { text: "Appeler immédiatement le CEO", correct: false,
        explain: "La communication est importante mais pas la PREMIÈRE action. Isoler d'abord, puis escalader." },
    ]
  },
  {
    scenario: "Un serveur web public montre des logs anormaux : requêtes POST massives vers /admin/upload.php depuis plusieurs IPs en 2h. Plusieurs fichiers .php ont été créés dans /uploads/ avec des noms aléatoires.",
    question: "Ordre d'investigation prioritaire ?",
    choices: [
      { text: "Supprimer les fichiers .php suspects immédiatement pour stopper l'attaque", correct: false,
        explain: "Supprimer sans acquérir = destruction de preuves. Il faut d'abord collecter pour l'investigation." },
      { text: "1. Dump RAM + image disque  →  2. Analyse webshells  →  3. Bloquer IPs  →  4. Patcher la faille", correct: true,
        explain: "Préserver les preuves d'abord (RAM + disque), analyser les webshells pour comprendre l'étendue, puis remédier (bloquer + patcher)." },
      { text: "Restaurer la dernière sauvegarde et reformater", correct: false,
        explain: "Restauration prématurée = perte totale des preuves et aucune compréhension de comment l'attaque a réussi." },
      { text: "Appeler la police et attendre leurs instructions", correct: false,
        explain: "Appel possible (obligatoire parfois), mais l'équipe IR interne doit d'abord préserver les preuves." },
    ]
  },
  {
    scenario: "Une enquête interne vient de commencer. Le suspect principal est un admin système qui a encore accès à ses comptes et aux serveurs. Délai avant interrogatoire : 48h.",
    question: "Stratégie de collecte dans ces 48h ?",
    choices: [
      { text: "Annoncer immédiatement l'enquête au suspect", correct: false,
        explain: "Donner 48h de préavis à un admin = il peut effacer logs, modifier timestamps, nettoyer sa trace. Catastrophique." },
      { text: "Collecte discrète : snapshots des serveurs, logs centralisés, sans alerter le suspect", correct: true,
        explain: "Collecte silencieuse AVANT l'interrogatoire. Une fois les preuves sécurisées, l'interrogatoire peut avoir lieu sans risque de destruction." },
      { text: "Bloquer tous ses accès immédiatement", correct: false,
        explain: "Blocage immédiat = alerte implicite. Le suspect saura qu'il y a enquête et pourra prévenir un complice, utiliser des accès de secours, etc." },
      { text: "Accorder le bénéfice du doute et attendre les 48h sans agir", correct: false,
        explain: "L'inaction laisse le suspect avec ses accès — il peut continuer à agir et effacer ses traces." },
    ]
  },
  {
    scenario: "Lors d'un incident, vous obtenez un dump mémoire (RAM) de 16 GB d'un poste suspect. Le malware suspect est 'fileless' (pas de fichier disque).",
    question: "Meilleur outil et approche ?",
    choices: [
      { text: "Analyser avec Notepad pour chercher des chaînes de caractères", correct: false,
        explain: "Impraticable sur 16 GB. Il faut un outil spécialisé." },
      { text: "Volatility avec les plugins pslist, malfind, netscan pour identifier processus/injections/C2", correct: true,
        explain: "Volatility est LE framework de référence. pslist=processus, malfind=injections de code, netscan=connexions réseau. Idéal pour fileless." },
      { text: "Lancer un antivirus sur le dump", correct: false,
        explain: "Les AV ne scannent pas les dumps RAM. Volatility ou Rekall sont nécessaires." },
      { text: "Faire un hash du fichier et vérifier sur VirusTotal", correct: false,
        explain: "Le dump mémoire est unique à ce poste — aucune base ne le reconnaîtra." },
    ]
  },
  {
    scenario: "Une entreprise suisse subit une violation de données personnelles. 50 000 clients potentiellement affectés. Les équipes IT commencent le confinement.",
    question: "Quelle obligation légale (LPD révisée, en vigueur depuis 09.2023) ?",
    choices: [
      { text: "Notification au PFPDT dans les meilleurs délais si la violation entraîne vraisemblablement un risque élevé pour les personnes concernées", correct: true,
        explain: "Art. 24 al. 1 LPD révisée : le responsable du traitement annonce au PFPDT « dans les meilleurs délais » toute violation susceptible d'entraîner un risque élevé. Canal officiel : databreach.edoeb.admin.ch." },
      { text: "Aucune obligation de notification — c'est une entreprise privée", correct: false,
        explain: "La LPD révisée impose des obligations strictes de notification aux entreprises privées comme aux organes fédéraux." },
      { text: "Notification obligatoire dans les 72 heures maximum comme pour le RGPD", correct: false,
        explain: "Piège classique : le RGPD fixe un délai strict de 72h, mais la LPD parle de « meilleurs délais » sans chiffre (seuil aussi différent : risque 'élevé' en CH vs simple 'risque' en UE)." },
      { text: "Seulement si plus de 100 000 personnes sont affectées", correct: false,
        explain: "Pas de seuil numérique. Le critère est le risque élevé pour la personnalité ou les droits fondamentaux des personnes concernées." },
    ]
  },
];


// ╔═══════════════════════════════════════════════════════════════════╗
// ║ 7. NETWORK_EXERCISES — Analyse PCAP / réseau                     ║
// ║    Utilisé par : genNetwork                                       ║
// ║    Structure  : { scenario, question, choices }                   ║
// ╚═══════════════════════════════════════════════════════════════════╝

const NETWORK_EXERCISES = [
  {
    scenario: "Dans un fichier PCAP, tu observes sur le port 53 (DNS) des milliers de requêtes TXT vers *.c2.evil.com, avec des sous-domaines aléatoires très longs (ex: aGVsbG9kYXJrbmVzc215b2xkZnJpZW5k.c2.evil.com).",
    question: "Que suggère ce schéma ?",
    choices: [
      { text: "Trafic DNS normal — les résolutions TXT sont courantes", correct: false,
        explain: "Les requêtes TXT normales sont peu fréquentes. Des milliers avec sous-domaines aléatoires = anormal." },
      { text: "DNS tunneling — exfiltration de données via requêtes DNS", correct: true,
        explain: "Les sous-domaines encodés en Base64 dans des requêtes TXT massives = technique d'exfiltration classique (DNScat2, Iodine, dnstunnel). Le DNS est souvent autorisé par les firewalls." },
      { text: "Attaque par force brute sur le DNS", correct: false,
        explain: "Le brute force DNS cible des noms valides, pas des sous-domaines aléatoires." },
      { text: "Scan de port", correct: false,
        explain: "Un scan de port ne passe pas par des requêtes DNS TXT." },
    ]
  },
  {
    scenario: "Filtre Wireshark : 'tcp.port == 443 and ssl.handshake.type == 1'. Tu observes un client qui se connecte à 847 IPs distinctes en 5 minutes, toutes différentes, avec des SNI aléatoires.",
    question: "Diagnostic ?",
    choices: [
      { text: "Navigation normale — un navigateur fait beaucoup de requêtes HTTPS", correct: false,
        explain: "Un navigateur contacte 10-50 domaines par page, pas 847 différents. Et les SNI ne sont jamais aléatoires." },
      { text: "Malware en scanning/C2 agile — possible bot botnet cherchant un C2 actif", correct: true,
        explain: "847 IPs distinctes + SNI aléatoires = comportement non humain. Caractéristique de malwares utilisant domain generation algorithms (DGA) ou de scanners." },
      { text: "Attaque DDoS amplifiée", correct: false,
        explain: "Un DDoS génère du volume, pas de la diversité d'IPs vers soi-même." },
      { text: "Test de charge légitime", correct: false,
        explain: "Les tests de charge ciblent généralement une seule IP/plage." },
    ]
  },
  {
    scenario: "Dans un PCAP d'une machine Windows compromise, tu vois une connexion TCP sortante vers 185.220.102.X:443 qui envoie 1.2 GB en 30 minutes, principalement en upload.",
    question: "Interprétation la plus probable ?",
    choices: [
      { text: "Synchronisation cloud normale (OneDrive, Google Drive)", correct: false,
        explain: "OneDrive/Drive utilisent des IPs Microsoft/Google, pas cette plage. 185.220.102.x est associé aux nœuds de sortie Tor." },
      { text: "Exfiltration de données — 1.2 GB en upload vers un hôte suspect", correct: true,
        explain: "Ratio upload >> download + volume important + IP Tor-exit = exfiltration typique. À corréler avec les processus actifs côté endpoint." },
      { text: "Mise à jour Windows", correct: false,
        explain: "Les mises à jour Windows vont vers windowsupdate.com et sont principalement en download." },
      { text: "Streaming vidéo", correct: false,
        explain: "Streaming = gros download, petit upload. Ici c'est l'inverse." },
    ]
  },
  {
    scenario: "Filtre Wireshark 'http.request.method == POST and http.content_length > 1000000'. Tu trouves une requête POST de 45 MB vers /api/upload.php d'un domaine .ru avec un User-Agent 'Mozilla/5.0 (compatible; X11)'.",
    question: "Pertinence pour une enquête d'intrusion ?",
    choices: [
      { text: "Trafic web légitime — les POST peuvent être volumineux", correct: false,
        explain: "Un POST de 45 MB vers un domaine non approuvé + UA suspect (mélange Mozilla et X11) = drapeau rouge." },
      { text: "Preuve potentielle d'exfiltration via HTTP POST — à creuser en priorité", correct: true,
        explain: "Les webshells et implants exfiltrent souvent via HTTP POST vers des domaines de contrôle. Le volume + destination + UA atypique justifient une analyse approfondie." },
      { text: "Attaque DoS", correct: false,
        explain: "Un DoS = beaucoup de petites requêtes, pas une grosse." },
      { text: "Hors scope d'une enquête forensique", correct: false,
        explain: "Au contraire, c'est un indicateur de premier plan." },
    ]
  },
];


// ╔═══════════════════════════════════════════════════════════════════╗
// ║ 8. BASES_EXERCISES — Conversions hex/bin/dec/ASCII                ║
// ║    Utilisé par : genBases                                         ║
// ║    Structure  : { gen: function() { return {...} } }              ║
// ║      Le moteur appelle ex.gen() pour générer dynamiquement.       ║
// ║                                                                   ║
// ║    Chaque gen() retourne un objet exercice. Le moteur inspecte    ║
// ║    ses propriétés pour afficher la question et vérifier.          ║
// ║    Comme je n'ai pas pu analyser le rendu en détail, je fournis   ║
// ║    une structure simple : { question, answer, hint, explain }     ║
// ╚═══════════════════════════════════════════════════════════════════╝

const BASES_EXERCISES = [
  {
    gen: () => {
      const val = Math.floor(Math.random() * 256);
      return {
        question: `Convertis <span class="hex">${val.toString(16).toUpperCase().padStart(2, '0')}</span> (hex) en décimal :`,
        answer: String(val),
        hint: `Un octet hex = 2 caractères. Chaque chiffre hex vaut 0–15. Formule : ${val.toString(16).toUpperCase().padStart(2, '0')} = (premier × 16) + second.`,
        explain: `0x${val.toString(16).toUpperCase().padStart(2, '0')} = ${val} en décimal.`
      };
    }
  },
  {
    gen: () => {
      const val = Math.floor(Math.random() * 256);
      return {
        question: `Convertis <strong>${val}</strong> (décimal) en hexadécimal (2 chiffres, majuscules) :`,
        answer: val.toString(16).toUpperCase().padStart(2, '0'),
        hint: `Divise par 16. Reste = chiffre des unités. Quotient = chiffre des dizaines (en hex).`,
        explain: `${val} en décimal = 0x${val.toString(16).toUpperCase().padStart(2, '0')} en hex.`
      };
    }
  },
  {
    gen: () => {
      const val = Math.floor(Math.random() * 256);
      const bin = val.toString(2).padStart(8, '0');
      return {
        question: `Convertis <span class="hex">${val.toString(16).toUpperCase().padStart(2, '0')}</span> (hex) en binaire (8 bits) :`,
        answer: bin,
        hint: `Chaque chiffre hex = 4 bits. Exemple : 0xA = 1010, 0xF = 1111.`,
        explain: `0x${val.toString(16).toUpperCase().padStart(2, '0')} = ${bin} en binaire.`
      };
    }
  },
  {
    gen: () => {
      // Petit mot ASCII aléatoire
      const words = ["HELP", "TEST", "CODE", "FILE", "HEX", "BIT", "MFT", "FAT"];
      const word = words[Math.floor(Math.random() * words.length)];
      const hex = [...word].map(c => c.charCodeAt(0).toString(16).toUpperCase()).join(' ');
      return {
        question: `Décode cette séquence ASCII : <span class="hex">${hex}</span>`,
        answer: word,
        hint: `Chaque octet hex représente un caractère ASCII. 'A'=0x41, 'a'=0x61. Table ASCII en mémoire.`,
        explain: `${hex} = "${word}" en ASCII.`
      };
    }
  },
  {
    gen: () => {
      const word = "HELLO";
      const hex = [...word].map(c => c.charCodeAt(0).toString(16).toUpperCase()).join(' ');
      return {
        question: `Encode le mot "<strong>${word}</strong>" en hexadécimal (ASCII, séparé par des espaces, majuscules) :`,
        answer: hex,
        hint: `'H'=0x48, 'e'=0x65. Additionne 0x20 pour minuscule → majuscule si besoin.`,
        explain: `"${word}" = ${hex} en ASCII hex.`
      };
    }
  },
];


// ═══════════════════════════════════════════════════════════════════
// FIN tp-data.js
// Variables globales exposées au moteur :
//   MAGIC_DB · MISMATCH_DB · GLOSSAIRE · DROIT_CASES
//   EMAIL_EXERCISES · IR_EXERCISES · NETWORK_EXERCISES · BASES_EXERCISES
// ═══════════════════════════════════════════════════════════════════
