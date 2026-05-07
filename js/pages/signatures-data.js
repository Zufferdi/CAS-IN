// ═══════════════════════════════════════════════════════════════
// signatures-data.js — Catalogue de signatures (magic bytes)
// Page : signatures.html
// Complément du *calculateur* magic bytes dans tools.html, qui
// fait l'inverse (input hex → guess format).
// ═══════════════════════════════════════════════════════════════
window.REF_CONFIG = {

  pageId:    'signatures',
  emoji:     '🔮',
  title:     'Magic bytes',
  subtitle:  'Signatures de fichiers · Headers / footers',
  description: "Catalogue de signatures binaires utilisées en file carving et identification. Pour chaque format : header hex, footer si applicable, offset, particularités.",

  filters: [
    { id: 'category', label: 'Catégorie',  kind: 'select', autoOptions: true },
    { id: 'q',        label: 'Recherche',  kind: 'text',   placeholder: 'ex: jpeg, pe, zip...' }
  ],

  columns: [
    { id: 'name',      label: 'Format',    kind: 'bold',  sortable: true },
    { id: 'extension', label: 'Extension', kind: 'mono',  sortable: true },
    { id: 'category',  label: 'Catégorie', kind: 'tag',   sortable: true },
    { id: 'hexHeader', label: 'Header (hex)', kind: 'mono', sortable: false },
    { id: 'offset',    label: 'Offset',    kind: 'plain', sortable: true,
      render: d => `<span class="ref-mono">${d.offset != null ? d.offset : 0}</span>` }
  ],

  detail: {
    titleField: 'name',
    callout: d => d.offset != null && d.offset !== 0 ? {
      tone: 'gold',
      html: `<b>⚠ Attention :</b> magic bytes situés à l'offset <code>${d.offset}</code> (pas le début du fichier).`
    } : null,
    grid: [
      { label: 'Extensions',    field: 'extensions' },
      { label: 'Catégorie',     field: 'category' },
      { label: 'Header (hex)',  render: d => `<span class="ref-mono">${d.hexHeader}</span>` },
      { label: 'Header (ASCII)',render: d => d.asciiHeader ? `<span class="ref-mono">${d.asciiHeader}</span>` : '<span class="ref-dim">non imprimable</span>' },
      { label: 'Footer (hex)',  render: d => d.hexFooter ? `<span class="ref-mono">${d.hexFooter}</span>` : '<span class="ref-dim">aucun</span>' },
      { label: 'Offset',        render: d => `<span class="ref-mono">${d.offset != null ? d.offset : 0}</span>` },
      { label: 'Taille typique',field: 'typicalSize' }
    ],
    description: 'description',
    sections: [
      { label: 'Variantes / sous-formats', field: 'variants',  kind: 'list' },
      { label: 'Polyglots connus',         field: 'polyglots' },
      { label: 'Support carving',          field: 'carving' }
    ],
    notes: 'notes',
    related: 'related'
  },

  search: {
    fields: ['name', 'extension', 'extensions', 'category', 'description',
             'hexHeader', 'hexFooter', 'asciiHeader', 'variants', 'polyglots']
  },

  data: [

    // ── IMAGES ───────────────────────────────────────────
    {
      name: 'JPEG / JFIF / EXIF', extension: '.jpg / .jpeg', extensions: '.jpg, .jpeg, .jpe, .jfif',
      category: 'Image',
      hexHeader: 'FF D8 FF', asciiHeader: 'ÿØÿ',
      hexFooter: 'FF D9', offset: 0,
      typicalSize: '20 KB – 10 MB',
      description: "Format compressé lossy. Header SOI (Start Of Image), footer EOI (End Of Image).",
      variants: [
        '<code>FF D8 FF E0</code> = JFIF',
        '<code>FF D8 FF E1</code> = EXIF',
        '<code>FF D8 FF DB</code> = SAMSUNG/raw',
        '<code>FF D8 FF EE</code> = Adobe'
      ],
      polyglots: "JPEG/ZIP polyglot (JAR/JPG) — exploitable en watermarking ou attaques cachées.",
      carving: "Bien supporté (PhotoRec, foremost, scalpel). Footer fiable mais peut apparaître dans le payload (penser à scanner après).",
      notes: "Métadonnées EXIF dans segment APP1 (FF E1) — GPS, modèle d'appareil, timestamps."
    },
    {
      name: 'PNG', extension: '.png', extensions: '.png',
      category: 'Image',
      hexHeader: '89 50 4E 47 0D 0A 1A 0A', asciiHeader: '.PNG\\r\\n.\\n',
      hexFooter: '49 45 4E 44 AE 42 60 82', offset: 0,
      typicalSize: '5 KB – 5 MB',
      description: "Lossless. Structure en chunks. Le header inclut une signature de 8 octets fixe.",
      variants: [
        'IHDR (Image Header) — premier chunk obligatoire après signature',
        'IDAT (Image Data) — chunks de pixels compressés zlib',
        'IEND — chunk de fin (toujours <code>49 45 4E 44 AE 42 60 82</code>)',
        'tEXt / iTXt — chunks de métadonnées'
      ],
      carving: "Très bien supporté. Footer constant rend le carving fiable.",
      notes: "Stéganographie classique : LSB sur bytes IDAT non compressés."
    },
    {
      name: 'GIF87a / GIF89a', extension: '.gif', extensions: '.gif',
      category: 'Image',
      hexHeader: '47 49 46 38 37 61', asciiHeader: 'GIF87a',
      hexFooter: '00 3B', offset: 0,
      typicalSize: '50 KB – 5 MB',
      description: "Animations et images palettisées. Deux variantes : 87a (statique, premier) et 89a (avec animation).",
      variants: [
        'GIF87a : <code>47 49 46 38 37 61</code>',
        'GIF89a : <code>47 49 46 38 39 61</code>'
      ],
      polyglots: "GIFAR (GIF + JAR) — historiquement exploité dans Web/Java.",
      carving: "Footer <code>00 3B</code> peut apparaître ailleurs dans le fichier (false positives en carving)."
    },
    {
      name: 'BMP', extension: '.bmp', extensions: '.bmp, .dib',
      category: 'Image',
      hexHeader: '42 4D', asciiHeader: 'BM',
      offset: 0,
      typicalSize: '100 KB – 50 MB (non compressé)',
      description: "Bitmap Microsoft. Header très court. La taille du fichier est dans les octets 2-5 (little endian).",
      carving: "Difficile (header trop court → faux positifs). Vérifier la taille déclarée dans l'header."
    },
    {
      name: 'TIFF (Intel)', extension: '.tif / .tiff', extensions: '.tif, .tiff',
      category: 'Image',
      hexHeader: '49 49 2A 00', asciiHeader: 'II*.',
      offset: 0,
      typicalSize: '500 KB – 500 MB',
      description: "Tag Image File Format. Deux endianness possibles : Intel (II) et Motorola (MM).",
      variants: [
        'Intel little-endian : <code>49 49 2A 00</code>',
        'Motorola big-endian : <code>4D 4D 00 2A</code>'
      ],
      notes: "Format racine pour beaucoup de RAW d'appareils photo (CR2, NEF, etc.)."
    },
    {
      name: 'WEBP', extension: '.webp', extensions: '.webp',
      category: 'Image',
      hexHeader: '52 49 46 46 ?? ?? ?? ?? 57 45 42 50', asciiHeader: 'RIFF....WEBP',
      offset: 0,
      typicalSize: '20 KB – 2 MB',
      description: "Format Google basé sur conteneur RIFF. Octets 8-11 = 'WEBP'.",
      notes: "Header RIFF partagé avec WAV, AVI — ne pas se fier aux 4 premiers octets seuls."
    },
    {
      name: 'HEIC / HEIF', extension: '.heic / .heif', extensions: '.heic, .heif',
      category: 'Image',
      hexHeader: '00 00 00 ?? 66 74 79 70 68 65 69 63', asciiHeader: '....ftypheic',
      offset: 4,
      typicalSize: '500 KB – 5 MB',
      description: "Format moderne d'Apple (iOS 11+) basé sur container ISO BMFF. Magic à offset 4.",
      variants: [
        '<code>ftypheic</code> = HEIC',
        '<code>ftypheix</code> = HEIC extended',
        '<code>ftypmif1</code> = HEIF generic'
      ],
      notes: "Acquisitions iPhone récentes : photos par défaut en HEIC. Les outils plus anciens peuvent ne pas parser correctement."
    },

    // ── VIDÉO ────────────────────────────────────────────
    {
      name: 'MP4 / MOV', extension: '.mp4 / .mov', extensions: '.mp4, .m4v, .mov, .3gp',
      category: 'Vidéo',
      hexHeader: '?? ?? ?? ?? 66 74 79 70', asciiHeader: '....ftyp',
      offset: 4,
      typicalSize: '10 MB – 10 GB',
      description: "Container ISO BMFF. Les 4 premiers octets = taille du box ftyp, puis 'ftyp', puis brand.",
      variants: [
        '<code>ftypisom</code> = MP4 ISO',
        '<code>ftypmp42</code> = MP4 v2',
        '<code>ftypqt  </code> = QuickTime MOV (notez l\'espace)',
        '<code>ftyp3gp4</code> = 3GP mobile',
        '<code>ftypM4A </code> = audio iTunes'
      ],
      carving: "Tricky : pas de footer, taille dans le header de chaque box. Carving naïf échoue souvent.",
      notes: "Métadonnées dans <code>moov</code> atom (souvent à la fin pour streaming-friendly)."
    },
    {
      name: 'AVI', extension: '.avi', extensions: '.avi',
      category: 'Vidéo',
      hexHeader: '52 49 46 46 ?? ?? ?? ?? 41 56 49 20', asciiHeader: 'RIFF....AVI ',
      offset: 0,
      typicalSize: '50 MB – 5 GB',
      description: "Container Microsoft basé sur RIFF. Encore très présent sur caméras de surveillance.",
      notes: "Note l'espace après 'AVI'."
    },

    // ── ARCHIVES ─────────────────────────────────────────
    {
      name: 'ZIP', extension: '.zip', extensions: '.zip, .jar, .docx, .xlsx, .pptx, .apk, .ipa',
      category: 'Archive',
      hexHeader: '50 4B 03 04', asciiHeader: 'PK..',
      hexFooter: '50 4B 05 06', offset: 0,
      typicalSize: '10 KB – plusieurs GB',
      description: "Format ZIP. <b>Très important : tous les formats Office moderne (.docx/.xlsx/.pptx), JAR Java, APK Android, IPA iOS sont des fichiers ZIP.</b>",
      variants: [
        '<code>PK\\x03\\x04</code> = local file header',
        '<code>PK\\x01\\x02</code> = central directory file header',
        '<code>PK\\x05\\x06</code> = end of central directory (footer)',
        '<code>PK\\x07\\x08</code> = empty/spanned archive'
      ],
      polyglots: "ZIP polyglots fréquents : ZIP/JPG, ZIP/PNG (le ZIP étant lu depuis la fin).",
      carving: "Bien supporté. Pour ZIPs corrompus ou tronqués, l'EOCD peut être manquant.",
      notes: "Pour identifier un ZIP comme docx vs xlsx vs apk : extraire et regarder le contenu (mimetype, AndroidManifest.xml, etc.)."
    },
    {
      name: 'RAR', extension: '.rar', extensions: '.rar',
      category: 'Archive',
      hexHeader: '52 61 72 21 1A 07 00', asciiHeader: 'Rar!..',
      offset: 0,
      typicalSize: '10 KB – plusieurs GB',
      description: "Archive WinRAR. Deux versions de format.",
      variants: [
        'RAR 4.x : <code>52 61 72 21 1A 07 00</code> (7 octets)',
        'RAR 5.0+ : <code>52 61 72 21 1A 07 01 00</code> (8 octets)'
      ],
      notes: "Mots de passe AES — non cassable hors brute force / dictionnaire (hashcat -m 13000)."
    },
    {
      name: '7-Zip', extension: '.7z', extensions: '.7z',
      category: 'Archive',
      hexHeader: '37 7A BC AF 27 1C', asciiHeader: '7z¼¯\\\'',
      offset: 0,
      typicalSize: '10 KB – plusieurs GB',
      description: "Format 7-Zip. Compression LZMA/LZMA2.",
      notes: "Mots de passe AES-256 — chiffrement headers possible (rend impossible la liste des fichiers sans mot de passe)."
    },
    {
      name: 'GZIP', extension: '.gz', extensions: '.gz, .tgz, .gzip',
      category: 'Archive',
      hexHeader: '1F 8B', asciiHeader: '..',
      offset: 0,
      typicalSize: '1 KB – 100 MB',
      description: "Compression gzip (RFC 1952). 3ème octet = méthode (08 = deflate).",
      variants: ['<code>1F 8B 08</code> = gzip avec deflate (le seul vraiment utilisé)'],
      notes: "Tar.gz = TAR puis gzip. Le header gzip est sur le tar."
    },

    // ── EXÉCUTABLES ──────────────────────────────────────
    {
      name: 'PE (Windows EXE/DLL)', extension: '.exe / .dll', extensions: '.exe, .dll, .sys, .scr, .ocx, .cpl, .efi',
      category: 'Exécutable',
      hexHeader: '4D 5A', asciiHeader: 'MZ',
      offset: 0,
      typicalSize: '5 KB – 100 MB',
      description: "Portable Executable. <code>MZ</code> en hommage à Mark Zbikowski. Le vrai PE header est plus loin (signature 'PE\\0\\0' à offset spécifié dans MZ).",
      variants: [
        '<code>MZ</code> + offset PE pointant vers <code>50 45 00 00</code> (PE\\0\\0)',
        'COM (legacy) : header MZ aussi mais pas de PE',
        'EFI : peut être PE/COFF avec subsystem EFI'
      ],
      polyglots: "PE/JAR, PE/PDF possibles.",
      carving: "Bien supporté mais signatures multiples — préférer parsing léger pour valider.",
      notes: "Indicateurs malware : sections .upx, sections RWE, importation kernel32!LoadLibraryA + GetProcAddress, IMPHASH suspect."
    },
    {
      name: 'ELF (Linux exec)', extension: '(divers)', extensions: '(pas d\'extension standard)',
      category: 'Exécutable',
      hexHeader: '7F 45 4C 46', asciiHeader: '.ELF',
      offset: 0,
      typicalSize: '10 KB – 500 MB',
      description: "Executable and Linkable Format. Format unifié Linux/BSD/Unix.",
      variants: [
        '5e octet : 01=32 bits, 02=64 bits',
        '6e octet : 01=little endian, 02=big endian',
        '<code>7F 45 4C 46 02 01</code> = ELF 64 LE (le plus courant)'
      ],
      notes: "Sections : .text, .data, .rodata, .bss, .got, .plt, .dynsym, .dynstr."
    },
    {
      name: 'Mach-O (macOS exec)', extension: '(divers)', extensions: '(pas d\'extension standard)',
      category: 'Exécutable',
      hexHeader: 'FE ED FA CE / FE ED FA CF / CA FE BA BE', offset: 0,
      typicalSize: '10 KB – 500 MB',
      description: "Format binaire Apple (macOS, iOS).",
      variants: [
        '<code>FE ED FA CE</code> = Mach-O 32-bit big-endian',
        '<code>CE FA ED FE</code> = Mach-O 32-bit little-endian',
        '<code>FE ED FA CF</code> = Mach-O 64-bit big-endian',
        '<code>CF FA ED FE</code> = Mach-O 64-bit little-endian',
        '<code>CA FE BA BE</code> = Universal/Fat binary (multi-arch)'
      ],
      notes: "<code>CA FE BA BE</code> est le même magic que Java .class ! Discriminer par la suite (count d'archs vs major/minor version)."
    },
    {
      name: 'Java class', extension: '.class', extensions: '.class',
      category: 'Exécutable',
      hexHeader: 'CA FE BA BE', asciiHeader: 'Êþº¾',
      offset: 0,
      typicalSize: '500 B – 100 KB',
      description: "Bytecode Java compilé.",
      notes: "<b>Collision exacte</b> avec Mach-O Universal — vérifier les octets 4-7 (version Java vs nb d'arches Mach-O)."
    },

    // ── DOCUMENTS ────────────────────────────────────────
    {
      name: 'PDF', extension: '.pdf', extensions: '.pdf',
      category: 'Document',
      hexHeader: '25 50 44 46 2D', asciiHeader: '%PDF-',
      hexFooter: '25 25 45 4F 46', offset: 0,
      typicalSize: '50 KB – 100 MB',
      description: "Portable Document Format. Header en ASCII, lisible. Footer <code>%%EOF</code>.",
      variants: [
        '<code>%PDF-1.4</code>, <code>%PDF-1.5</code>, ... <code>%PDF-2.0</code>',
        'Ordre : %PDF → objects → xref → trailer → %%EOF',
        'Plusieurs %%EOF possibles (incremental updates)'
      ],
      polyglots: "PDF est extrêmement souvent polyglottisé (PDF/JS, PDF/JAR, PDF/EXE en ressources embed).",
      carving: "Bien supporté. Mais : (1) plusieurs %%EOF possibles, (2) PDF linéarisé peut tronquer, (3) carve = besoin de réparer xref.",
      notes: "Vecteur d'attaque historique (CVE Acrobat). Toujours analyser objets /JavaScript, /Launch, /SubmitForm."
    },
    {
      name: 'Office binary (CFB)', extension: '.doc / .xls / .ppt', extensions: '.doc, .xls, .ppt, .msg, .msi',
      category: 'Document',
      hexHeader: 'D0 CF 11 E0 A1 B1 1A E1', asciiHeader: '...à¡±.á',
      offset: 0,
      typicalSize: '50 KB – 100 MB',
      description: "Compound File Binary (CFB) — anciennement OLE2 / SSCS. Format historique Office (avant 2007), MSG (Outlook), MSI.",
      polyglots: "Macros VBA dans <code>VBA</code> stream — vecteur d'attaque historique.",
      notes: "Pour parser : <code>oletools</code> (oleid, olevba, olemap)."
    },
    {
      name: 'Office OOXML', extension: '.docx / .xlsx / .pptx', extensions: '.docx, .xlsx, .pptx, .docm, .xlsm, .pptm',
      category: 'Document',
      hexHeader: '50 4B 03 04', asciiHeader: 'PK..',
      offset: 0,
      typicalSize: '20 KB – 100 MB',
      description: "Office 2007+ : ZIP contenant XML. <b>Magic = ZIP.</b>",
      variants: [
        'Vérifier <code>[Content_Types].xml</code> à la racine',
        'word/document.xml = .docx',
        'xl/workbook.xml = .xlsx',
        'ppt/presentation.xml = .pptx'
      ],
      polyglots: "Macros : .docm/.xlsm/.pptm contiennent vbaProject.bin (CFB) dans le ZIP.",
      notes: "Ne pas se fier à l'extension : un fichier renommé .docx peut être .xlsx (ouvrir le ZIP)."
    },
    {
      name: 'RTF', extension: '.rtf', extensions: '.rtf',
      category: 'Document',
      hexHeader: '7B 5C 72 74 66', asciiHeader: '{\\rtf',
      offset: 0,
      typicalSize: '5 KB – 50 MB',
      description: "Rich Text Format. ASCII (header lisible).",
      polyglots: "Vecteur d'attaque historique CVE-2017-11882 (Equation Editor) — RTF malicieux dans phishing."
    },

    // ── DISQUE / FS ──────────────────────────────────────
    {
      name: 'NTFS Boot Sector', extension: 'N/A', extensions: 'partition',
      category: 'Disque/FS',
      hexHeader: 'EB 52 90 4E 54 46 53 20 20 20 20', asciiHeader: '.R.NTFS    ',
      offset: 0,
      typicalSize: '512 octets',
      description: "Boot sector d'une partition NTFS. <code>4E 54 46 53</code> = 'NTFS' à offset 3.",
      notes: "Présence sur premier secteur de partition. À distinguer du secteur 0 du disque (MBR/GPT)."
    },
    {
      name: 'FAT32 Boot Sector', extension: 'N/A', extensions: 'partition',
      category: 'Disque/FS',
      hexHeader: 'EB ?? 90 ... 46 41 54 33 32', asciiHeader: '...FAT32',
      offset: 82,
      typicalSize: '512 octets',
      description: "Boot sector FAT32. La signature 'FAT32' est à offset 82.",
      variants: [
        'FAT12 : <code>46 41 54 31 32</code> à offset 54',
        'FAT16 : <code>46 41 54 31 36</code> à offset 54',
        'FAT32 : <code>46 41 54 33 32</code> à offset 82',
        'exFAT : <code>45 58 46 41 54 20 20 20</code> à offset 3'
      ]
    },
    {
      name: 'EXT2/3/4 Superblock', extension: 'N/A', extensions: 'partition',
      category: 'Disque/FS',
      hexHeader: '53 EF', offset: 1080,
      typicalSize: '1024 octets',
      description: "Magic number EXT (s_magic) à offset 1080 (partition + 1024).",
      notes: "Distinction ext2/3/4 par les feature flags (s_feature_compat, s_feature_incompat) du superblock."
    },
    {
      name: 'MBR', extension: 'N/A', extensions: 'disk',
      category: 'Disque/FS',
      hexHeader: '... 55 AA', offset: 510,
      typicalSize: '512 octets',
      description: "Master Boot Record — secteur 0 d'un disque legacy. Signature de fin <code>55 AA</code> à offset 510.",
      notes: "Table de partition à offset 446 (4 entrées de 16 octets)."
    },
    {
      name: 'GPT Header', extension: 'N/A', extensions: 'disk',
      category: 'Disque/FS',
      hexHeader: '45 46 49 20 50 41 52 54', asciiHeader: 'EFI PART',
      offset: 0,
      typicalSize: '512 octets',
      description: "GUID Partition Table header — secteur 1 (LBA 1) sur disques modernes. MBR factice (protective MBR) en LBA 0.",
      notes: "Sauvegarde du header GPT en dernier secteur du disque."
    },
    {
      name: 'VHD (Microsoft)', extension: '.vhd', extensions: '.vhd',
      category: 'Disque/FS',
      hexHeader: '63 6F 6E 65 63 74 69 78', asciiHeader: 'conectix',
      offset: -512,
      typicalSize: 'variable',
      description: "Virtual Hard Disk. <b>Footer</b> à la fin du fichier (offset = taille - 512).",
      notes: "VHDX (nouveau format) a un magic différent : <code>76 68 64 78 66 69 6C 65</code> ('vhdxfile') en début."
    },

    // ── CRYPTO / KEY ─────────────────────────────────────
    {
      name: 'Veracrypt / TrueCrypt', extension: '(aucune)', extensions: 'volume chiffré',
      category: 'Crypto',
      hexHeader: '(pas de header lisible)', offset: 0,
      typicalSize: 'variable',
      description: "Volumes chiffrés VeraCrypt/TrueCrypt n'ont <b>volontairement aucune signature</b> pour ressembler à du random.",
      notes: "Détection : taille pile-poil (multiples de secteurs), entropie ~7.99/8, pas de structure FS détectable. Volume hidden = encore plus difficile."
    },
    {
      name: 'PGP / GnuPG', extension: '.gpg / .pgp / .asc', extensions: '.gpg, .pgp, .asc',
      category: 'Crypto',
      hexHeader: '(binaire) 95 ?? / 99 ??     | (ASCII) 2D 2D 2D 2D 2D 42 45 47 49 4E',
      asciiHeader: '-----BEGIN', offset: 0,
      typicalSize: '1 KB – plusieurs MB',
      description: "Format binaire (95 / 99 = packet PGP) ou armored (ASCII : -----BEGIN PGP MESSAGE-----).",
      notes: "L'ASCII armor est plus facilement carvable (header/footer textuels)."
    },
    {
      name: 'BitLocker FVE', extension: 'N/A', extensions: 'partition',
      category: 'Crypto',
      hexHeader: '2D 46 56 45 2D 46 53 2D', asciiHeader: '-FVE-FS-',
      offset: 3,
      typicalSize: 'variable',
      description: "Magic <code>-FVE-FS-</code> signal d'une partition BitLocker.",
      notes: "Récupération possible via Recovery Key, TPM auto-unlock, ou clear key (rare)."
    },

    // ── DATABASES / TEXT ─────────────────────────────────
    {
      name: 'SQLite', extension: '.sqlite / .db / .sqlite3', extensions: '.sqlite, .db, .sqlite3, .db3',
      category: 'Database',
      hexHeader: '53 51 4C 69 74 65 20 66 6F 72 6D 61 74 20 33 00', asciiHeader: 'SQLite format 3\\0',
      offset: 0,
      typicalSize: '4 KB – 10 GB',
      description: "Database SQLite — la base mobile (iOS, Android), browsers, beaucoup d'apps.",
      notes: "<b>Critique en DFIR mobile.</b> WAL (Write-Ahead Log) = .sqlite-wal — peut contenir des données effacées non synchronisées."
    },
    {
      name: 'XML', extension: '.xml', extensions: '.xml, .svg (XML basé)',
      category: 'Texte structuré',
      hexHeader: '3C 3F 78 6D 6C', asciiHeader: '<?xml',
      offset: 0,
      typicalSize: '1 KB – plusieurs GB',
      description: "Si déclaration XML présente. Mais XML peut commencer par BOM UTF-8/16.",
      variants: [
        'BOM UTF-8 + <code>&lt;?xml</code> : <code>EF BB BF 3C 3F 78 6D 6C</code>',
        'BOM UTF-16 LE : <code>FF FE 3C 00 3F 00 78 00</code>'
      ]
    }

  ]
};
