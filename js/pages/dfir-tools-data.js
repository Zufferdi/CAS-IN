// ═══════════════════════════════════════════════════════════════
// dfir-tools-data.js — Catalogue d'outils DFIR
// Page : dfir-tools.html
// ~32 outils parmi les plus utilisés en investigation numérique.
// ═══════════════════════════════════════════════════════════════
window.REF_CONFIG = {

  pageId:    'dfir-tools',
  emoji:     '🧰',
  title:     'Outils DFIR',
  subtitle:  'Acquisition · Analyse · Mémoire · Réseau · Mobile',
  description: "Catalogue d'outils utilisés en investigation numérique. Pour chacun : OS, licence, capacités, formats supportés, alternatives, gotchas.",

  filters: [
    { id: 'category', label: 'Catégorie', kind: 'select', autoOptions: true },
    { id: 'os',       label: 'OS',         kind: 'select', autoOptions: true },
    { id: 'license',  label: 'Licence',    kind: 'select', autoOptions: true },
    { id: 'maturity', label: 'Maturité',   kind: 'select', autoOptions: true },
    { id: 'q',        label: 'Recherche',  kind: 'text',   placeholder: 'ex: memory, mft, sqlite...' }
  ],

  columns: [
    { id: 'name',     label: 'Outil',     kind: 'bold',  sortable: true },
    { id: 'category', label: 'Catégorie', kind: 'tag',   sortable: true },
    { id: 'os',       label: 'OS',        kind: 'plain', render: d => (d.os||[]).map(o =>
        `<span class="ref-badge ref-badge--${o.toLowerCase().replace(/[^a-z0-9]/g,'-')}">${o}</span>`).join(' ') },
    { id: 'license',  label: 'Licence',   kind: 'badge', sortable: true,
      badgeMap: { 'Libre':'free', 'Commercial':'commercial', 'Mixte':'gold' } },
    { id: 'maturity', label: 'Maturité',  kind: 'badge', sortable: true,
      badgeMap: { 'Production':'green', 'Standard':'cyan', 'Beta':'orange', 'Legacy':'gray' } }
  ],

  detail: {
    titleField: 'name',
    callout: d => d.warning ? { tone: 'gold', html: `<b>⚠</b> ${d.warning}` } : null,
    grid: [
      { label: 'Catégorie',    field: 'category' },
      { label: 'OS',           render: d => (d.os||[]).join(', ') },
      { label: 'Licence',      field: 'license' },
      { label: 'Maturité',     field: 'maturity' },
      { label: 'Auteur / Vendeur', field: 'vendor' },
      { label: 'Site officiel', render: d => d.url
          ? `<a href="${d.url}" target="_blank" rel="noopener">${d.url}</a>` : '<span class="ref-dim">—</span>' }
    ],
    description: 'description',
    sections: [
      { label: 'Capacités principales', field: 'capabilities', kind: 'list' },
      { label: 'Formats supportés',     field: 'formats',      kind: 'list' },
      { label: 'Alternatives',          field: 'alternatives' },
      { label: 'Gotchas / pièges',      field: 'gotchas' }
    ],
    notes: 'notes',
    related: 'related'
  },

  search: {
    fields: ['name', 'description', 'category', 'capabilities', 'formats',
             'alternatives', 'gotchas', 'vendor', 'os']
  },

  data: [

    // ── ACQUISITION ──────────────────────────────────────
    {
      name: 'FTK Imager', category: 'Acquisition', os: ['Windows'], license: 'Libre',
      maturity: 'Production', vendor: 'Exterro (ex-AccessData)',
      url: 'https://www.exterro.com/digital-forensics-software/ftk-imager',
      description: "Outil d'acquisition gratuit (binaire propriétaire) pour disques, mémoire et fichiers individuels. Référence absolue en sandbox Windows.",
      capabilities: ['Image disque (E01, AD1, raw)', 'Capture de mémoire (memdump)', 'Acquisition de fichiers logiques', 'Exploration sans modification (read-only)', 'Vérification de hash post-acquisition'],
      formats: ['E01 (Expert Witness)', 'AD1 (AccessData)', 'DD/raw', 'VHD'],
      alternatives: 'EnCase Imager, Magnet Acquire, dd, Linen, MAGNET DumpIt (mémoire seule)',
      gotchas: "Ne supporte pas LX/L01 nativement. Mémoire : capture single-thread (peut prendre du temps sur 64GB+).",
      notes: "Standard de facto pour les acquisitions Windows en lab Suisse."
    },
    {
      name: 'dd / dcfldd', category: 'Acquisition', os: ['Linux','macOS'], license: 'Libre',
      maturity: 'Standard', vendor: 'GNU coreutils / DCFL',
      description: "Outil bas-niveau pour copier des octets. <code>dcfldd</code> est un fork avec hashing à la volée.",
      capabilities: ['Acquisition raw bit-à-bit', 'Hashing pendant la copie (dcfldd)', 'Statut de progression (dcfldd)', 'Découpage en chunks'],
      formats: ['Raw / DD'],
      alternatives: 'dc3dd (encore mieux pour DFIR), ewfacquire (pour E01 sous Linux)',
      gotchas: "<code>dd</code> classique = aucune barre de progression, aucun hash. Toujours préférer dc3dd ou dcfldd. Si bs trop petit = très lent ; trop grand = échec sur secteurs défectueux.",
      notes: "Indispensable pour acquisitions sous Kali, SIFT, Tsurugi."
    },
    {
      name: 'Cellebrite UFED', category: 'Acquisition', os: ['Windows'], license: 'Commercial',
      maturity: 'Production', vendor: 'Cellebrite',
      url: 'https://cellebrite.com/',
      description: "Suite d'acquisition mobile leader sur le marché. Hardware (Touch, Premium) + software (4PC). Supporte iOS et Android avec exploits propriétaires.",
      capabilities: ['Logical / File System / Physical extraction', 'Bypass de PIN/pattern (selon modèle)', 'Decoding de centaines d\'apps', 'Cloud Connector (iCloud, GDrive)'],
      formats: ['UFD (UFED)', 'XML', 'CSV pour rapports'],
      alternatives: 'Magnet AXIOM, MSAB XRY, Oxygen Forensic, GreyKey (focus iOS)',
      gotchas: "Coût élevé (50k+ CHF/an). Update lag pour iOS récents. Premium requis pour iPhone après bypass de Secure Enclave.",
      notes: "Souvent fourni en équipement de labo cantonal en Suisse."
    },
    {
      name: 'Magnet AXIOM', category: 'Acquisition', os: ['Windows'], license: 'Commercial',
      maturity: 'Production', vendor: 'Magnet Forensics',
      url: 'https://www.magnetforensics.com/',
      description: "Suite intégrée acquisition + analyse pour ordinateurs, mobiles, cloud. Concurrent direct de FTK et EnCase.",
      capabilities: ['Acquisition disque/mobile/cloud', 'Timeline unifiée', 'AXIOM Cyber pour DFIR enterprise', 'Decoder \"AXIOM Process\" auto'],
      formats: ['MFDB (interne)', 'E01', 'XRY/UFD'],
      alternatives: 'EnCase, FTK, Belkasoft Evidence Center',
      gotchas: "Très consommateur RAM/CPU sur gros datasets. Licence par module."
    },

    // ── ANALYSE FILESYSTEM ───────────────────────────────
    {
      name: 'Autopsy', category: 'Analyse FS', os: ['Windows','Linux','macOS'], license: 'Libre',
      maturity: 'Production', vendor: 'Basis Technology',
      url: 'https://www.autopsy.com/',
      description: "Suite forensique open source basée sur The Sleuth Kit. Interface graphique, modules d'analyse extensibles, multi-utilisateur (Autopsy Multi-User Case).",
      capabilities: ['Timeline', 'Keyword search', 'Hash matching (NSRL)', 'Web artifacts (browsers)', 'Communications', 'Plugin Python'],
      formats: ['E01', 'AFF', 'Raw / DD', 'VHDX / VMDK', 'L01'],
      alternatives: 'X-Ways, EnCase, FTK, TSK CLI seul',
      gotchas: "Memory-hungry sur gros cas (>1TB). Indexation Solr lourde — prévoir SSD + RAM.",
      notes: "Parfait pour le CAS : gratuit, complet, bien documenté.",
      related: [{ href: 'fiches/autopsy.html', label: 'Fiche Autopsy' }]
    },
    {
      name: 'X-Ways Forensics', category: 'Analyse FS', os: ['Windows'], license: 'Commercial',
      maturity: 'Production', vendor: 'X-Ways Software Technology AG',
      url: 'https://www.x-ways.net/forensics/',
      description: "Analyse forensique commerciale légère (~50 MB), exécutable sans install. Connue pour sa rapidité et son carving puissant.",
      capabilities: ['Carving avancé', 'NTFS deep dive (ADS, $LogFile)', 'Parsing registre', 'Timeline', 'Templates analyse manuelle'],
      formats: ['E01', 'Ex01', 'DD', 'AFF', 'VHD'],
      alternatives: 'Autopsy, EnCase',
      gotchas: "Interface dense, courbe d'apprentissage forte. Excelle là où Autopsy peut peiner (carving fragmenté)."
    },
    {
      name: 'EnCase Forensic', category: 'Analyse FS', os: ['Windows'], license: 'Commercial',
      maturity: 'Production', vendor: 'OpenText (ex-Guidance Software)',
      description: "Standard historique en cyber-forensique légale. Largement reconnu en cour aux USA.",
      capabilities: ['EnScript pour automation', 'Triage live', 'Acquisition + analyse + reporting', 'Validé pour usage en cour'],
      formats: ['E01 (format de référence)', 'Ex01', 'L01', 'AFF', 'DD'],
      alternatives: 'X-Ways, FTK, Autopsy',
      gotchas: "Très cher. Versions récentes ont migré vers OpenText (UI changements). Dongle hardware historiquement requis."
    },
    {
      name: 'The Sleuth Kit (TSK)', category: 'Analyse FS', os: ['Linux','macOS','Windows'], license: 'Libre',
      maturity: 'Production', vendor: 'Brian Carrier',
      url: 'https://www.sleuthkit.org/',
      description: "Bibliothèque CLI bas-niveau (fls, mmls, icat, fsstat, blkstat, jcat, etc.). Cœur d'Autopsy.",
      capabilities: ['Parsing FS bas-niveau', 'Récupération slack/free space', 'Lecture journal NTFS / ext journals'],
      formats: ['Raw', 'E01 (avec libewf)'],
      alternatives: 'Autopsy (GUI), pytsk',
      gotchas: "Pure CLI — courbe d'apprentissage. Mais incomparable pour scripting et reproductibilité."
    },
    {
      name: 'KAPE', category: 'Triage', os: ['Windows'], license: 'Mixte',
      maturity: 'Production', vendor: 'Eric Zimmerman / Kroll',
      url: 'https://www.kroll.com/en/services/cyber/incident-response-litigation-support/kroll-artifact-parser-extractor-kape',
      description: "Triage artefact rapide. Targets (collecte) + Modules (parsing avec EZ tools, RegRipper, etc.).",
      capabilities: ['Collecte ciblée d\'artefacts', 'Parsing automatisé via modules', 'Output structuré (CSV, JSON)', 'Très rapide (minutes vs heures)'],
      formats: ['Lit raw FS, image E01, dossier copié'],
      alternatives: 'Velociraptor, CyLR, Magnet RESPONSE, F-Response',
      gotchas: "Licence usage non-commercial gratuite, commercial payant. Sans configuration, on collecte trop ou trop peu.",
      notes: "Le go-to pour first-response : 'donne-moi les artefacts utiles en 10 min'."
    },
    {
      name: 'Velociraptor', category: 'Triage', os: ['Windows','Linux','macOS'], license: 'Libre',
      maturity: 'Production', vendor: 'Rapid7 / Mike Cohen',
      url: 'https://docs.velociraptor.app/',
      description: "Plateforme DFIR / EDR libre. Endpoint-based queries (VQL), hunts massifs.",
      capabilities: ['Hunts à l\'échelle (1000+ endpoints)', 'VQL pour queries forensiques', 'Triage et collecte ciblée', 'EDR-like avec server central'],
      formats: ['Sortie JSON, CSV', 'Lit endpoint live'],
      alternatives: 'KAPE (file-based), GRR Rapid Response',
      gotchas: "Setup serveur + déploiement d'agents nécessaire. Excellent en post-incident enterprise.",
      notes: "Devient un standard en IR Enterprise à coût zéro."
    },
    {
      name: 'Eric Zimmerman tools', category: 'Analyse FS', os: ['Windows'], license: 'Libre',
      maturity: 'Production', vendor: 'Eric Zimmerman',
      url: 'https://ericzimmerman.github.io/',
      description: "Suite de parseurs CLI/GUI : MFTECmd, RECmd, RECmd, EvtxECmd, JLECmd, AppCompatCacheParser, ShellBagsExplorer, etc.",
      capabilities: ['Parsing MFT (MFTECmd)', 'Parsing registre (RECmd)', 'Parsing EVTX (EvtxECmd)', 'Parsing Jump Lists (JLECmd)', 'Parsing Prefetch (PECmd)'],
      formats: ['CSV/JSON output ready for Timeline Explorer'],
      alternatives: 'plaso (log2timeline)',
      gotchas: "Aucun, vraiment. Modulaires, rapides, gratuits. Les modules KAPE les utilisent.",
      notes: "<b>À connaître par cœur pour DFIR Windows.</b>"
    },

    // ── MÉMOIRE ──────────────────────────────────────────
    {
      name: 'Volatility 3', category: 'Mémoire', os: ['Linux','macOS','Windows'], license: 'Libre',
      maturity: 'Production', vendor: 'Volatility Foundation',
      url: 'https://volatility3.readthedocs.io/',
      description: "Framework Python d'analyse de mémoire. v3 = refonte (plus de profil manuel, JSON symbol files automatiques).",
      capabilities: ['windows.pslist', 'windows.netscan', 'windows.malfind', 'windows.cmdline', 'linux.pslist', 'mac.pslist', 'symbol auto-detection'],
      formats: ['Raw memdump', 'crash dump', 'VMware vmem', 'AVML format', 'AFF4'],
      alternatives: 'Rekall (abandonné), MemProcFS, WinDbg',
      gotchas: "Plugins Volatility 2 PAS compatibles avec v3. Mémoire récente Windows peut nécessiter le dernier symbol pack.",
      notes: "Standard de fait. v2 reste utile pour anciens cas / plugins exotiques."
    },
    {
      name: 'MemProcFS', category: 'Mémoire', os: ['Windows','Linux'], license: 'Libre',
      maturity: 'Production', vendor: 'Ulf Frisk',
      url: 'https://github.com/ufrisk/MemProcFS',
      description: "Approche radicalement différente : monte la mémoire comme un système de fichiers. Navigation avec explorer.exe / find.",
      capabilities: ['Mount memdump as filesystem', 'Live memory analysis (PCILeech)', 'Yara rule scanning', 'Forensic mode'],
      formats: ['Raw', 'AVML', 'crash dump', 'Live memory via PCILeech FPGA'],
      alternatives: 'Volatility',
      gotchas: "Performances impressionnantes mais setup peut être tricky. Forensic mode crée même un timeline.",
      notes: "Combiné avec Volatility = couverture totale."
    },
    {
      name: 'Magnet RAM Capture', category: 'Mémoire', os: ['Windows'], license: 'Libre',
      maturity: 'Production', vendor: 'Magnet Forensics',
      description: "Petit outil dédié à la capture de mémoire physique Windows. Fonctionne sur systèmes vivants.",
      capabilities: ['Capture RAM live (single tool)', 'Format RAW ou .raw'],
      formats: ['Raw memory dump'],
      alternatives: 'FTK Imager (capture mémoire), DumpIt, WinPmem',
      gotchas: "Capture single-threaded sur très gros RAM peut prendre du temps. Pas de hashing intégré.",
      notes: "Pratique pour first responders sans déployer toute une suite."
    },

    // ── RÉSEAU ───────────────────────────────────────────
    {
      name: 'Wireshark', category: 'Réseau', os: ['Windows','Linux','macOS'], license: 'Libre',
      maturity: 'Production', vendor: 'Wireshark Foundation',
      url: 'https://www.wireshark.org/',
      description: "Analyseur de protocoles réseau de référence. Decode des centaines de protocoles, GUI complète + tshark CLI.",
      capabilities: ['Capture live ou fichier', 'Display filters puissants', 'Follow TCP/HTTP stream', 'Statistiques (I/O, conversations)', 'Décryptage TLS avec keylog'],
      formats: ['PCAP', 'PCAPNG', 'ETL (partiellement)'],
      alternatives: 'tshark (CLI), tcpdump (capture), NetworkMiner (artefact-focus)',
      gotchas: "Display filter ≠ capture filter (syntaxe différente !). Sur gros PCAP (>1GB), filtrer en CLI avant d'ouvrir GUI.",
      notes: "Indispensable. Maîtriser au minimum les display filters de base et Follow Stream."
    },
    {
      name: 'NetworkMiner', category: 'Réseau', os: ['Windows','Linux','macOS'], license: 'Mixte',
      maturity: 'Production', vendor: 'Netresec',
      url: 'https://www.netresec.com/?page=NetworkMiner',
      description: "PCAP → artefacts. Extrait fichiers, images, credentials, hosts, sessions de manière passive.",
      capabilities: ['File extraction depuis PCAP', 'Credential extraction (HTTP, FTP, etc.)', 'OS fingerprinting', 'Host/session view'],
      formats: ['PCAP', 'PCAPNG'],
      alternatives: 'Wireshark + manuel, Suricata (file extraction option)',
      gotchas: "Version Pro payante = SMB extraction, AD analysis, plus de protocoles.",
      notes: "Complète Wireshark : Wireshark = paquet, NetworkMiner = artefact."
    },
    {
      name: 'tcpdump', category: 'Réseau', os: ['Linux','macOS','Windows'], license: 'Libre',
      maturity: 'Standard', vendor: 'tcpdump.org',
      description: "Capture de paquets CLI. Léger, scriptable, indispensable sur serveurs sans GUI.",
      capabilities: ['Capture en BPF filter', 'Rotation de fichiers (-G, -W)', 'Lecture de PCAP'],
      formats: ['PCAP'],
      alternatives: 'Wireshark / dumpcap, tshark',
      gotchas: "Privilèges root requis. -nn pour pas de DNS lookup (essentiel sur capture en prod).",
      notes: "Toujours présent dans /usr/sbin sur Linux."
    },
    {
      name: 'Zeek', category: 'Réseau', os: ['Linux','macOS'], license: 'Libre',
      maturity: 'Production', vendor: 'Corelight (Zeek Project)',
      url: 'https://zeek.org/',
      description: "Network monitoring framework qui transforme du trafic en logs structurés (conn, http, dns, ssl, files, x509).",
      capabilities: ['Pipeline event-driven scriptable', 'File extraction', 'Centaines de scripts community', 'Logs Splunk/ELK-friendly'],
      formats: ['PCAP en input', 'Logs JSON/TSV en output'],
      alternatives: 'Suricata (avec EVE JSON)',
      gotchas: "Apprentissage du langage Zeek script si besoin de custom rules.",
      notes: "Standard dans les SOC enterprise pour la network visibility."
    },
    {
      name: 'Suricata', category: 'Réseau', os: ['Linux','macOS','Windows'], license: 'Libre',
      maturity: 'Production', vendor: 'OISF',
      url: 'https://suricata.io/',
      description: "IDS/IPS multi-thread avec moteur de règles Snort-compatible et output EVE JSON riche.",
      capabilities: ['Detection (Snort/Emerging Threats rules)', 'EVE JSON output', 'TLS fingerprint (JA3/JA3S)', 'File extraction (md5)'],
      formats: ['PCAP en replay', 'Logs JSON / unified2'],
      alternatives: 'Snort, Zeek',
      gotchas: "Performances dépendent du tuning des threads (af-packet, RSS).",
      notes: "Excellent en post-incident pour rejouer un PCAP avec rules updated."
    },

    // ── MOBILE ───────────────────────────────────────────
    {
      name: 'iLEAPP / ALEAPP', category: 'Mobile', os: ['Windows','Linux','macOS'], license: 'Libre',
      maturity: 'Production', vendor: 'Alexis Brignoni / abrignoni',
      url: 'https://github.com/abrignoni/iLEAPP',
      description: "iOS Logs, Events And Plists Parser (et version Android). Parse extractions iOS/Android et produit des rapports HTML lisibles.",
      capabilities: ['Parsing extraction iOS / Android', '500+ artefacts', 'Output HTML / SQLite / TSV', 'Plugin-based (Python)'],
      formats: ['Backup iTunes (iOS)', 'GrayKey FFS', 'AFL', 'Folder Android (logical)'],
      alternatives: 'Cellebrite Reader, Magnet AXIOM',
      gotchas: "Pas d'acquisition (parse seulement). Combiner avec libimobiledevice ou GrayKey.",
      notes: "Open source remarquable. Surclasse beaucoup d'outils commerciaux sur certains parses iOS récents."
    },

    // ── CARVING ──────────────────────────────────────────
    {
      name: 'PhotoRec', category: 'Carving', os: ['Windows','Linux','macOS'], license: 'Libre',
      maturity: 'Standard', vendor: 'CGSecurity',
      url: 'https://www.cgsecurity.org/wiki/PhotoRec',
      description: "File carving basé sur signatures (header/footer). Récupère fichiers indépendamment du FS.",
      capabilities: ['Carving 480+ formats', 'Récupération sans FS', 'Mode pause/reprise'],
      formats: ['Disque raw, image E01 (avec libewf)'],
      alternatives: 'foremost, scalpel, bulk_extractor',
      gotchas: "Files fragmentés = problématique (carving =/= reconstruction de FS). Output = beaucoup de bruit.",
      notes: "Inclus dans TestDisk. CLI rudimentaire mais efficace."
    },
    {
      name: 'bulk_extractor', category: 'Carving', os: ['Linux','macOS','Windows'], license: 'Libre',
      maturity: 'Production', vendor: 'Simson Garfinkel',
      url: 'https://github.com/simsong/bulk_extractor',
      description: "Multi-thread feature scanner (emails, URLs, IBANs, MAC addresses, etc.) sans parsing FS.",
      capabilities: ['Extraction de features (regex, scanners)', 'Histograms par feature', 'Très rapide (multi-thread)', 'Mode forensique'],
      formats: ['Disque, image E01, fichier individuel'],
      alternatives: 'Strings + grep (pauvre), Autopsy keyword search',
      gotchas: "Volumineux output (gigas de feature files). Nécessite filtering ensuite.",
      notes: "Excellent pour 'que contient ce dump' en première passe."
    },

    // ── SCRIPTS / TIMELINING ─────────────────────────────
    {
      name: 'plaso (log2timeline)', category: 'Timeline', os: ['Linux','macOS','Windows'], license: 'Libre',
      maturity: 'Production', vendor: 'plaso project',
      url: 'https://plaso.readthedocs.io/',
      description: "Création de super timelines forensiques. log2timeline collecte, psort filtre/sort/output.",
      capabilities: ['200+ parseurs (Windows registry, EVTX, browser, MFT, plist...)', 'Super timeline unifié', 'Output CSV/JSON pour Timeline Explorer ou Splunk'],
      formats: ['Plaso storage (.plaso)', 'CSV', 'JSON', 'Sleuthkit body'],
      alternatives: 'EZ tools individuels + Timeline Explorer',
      gotchas: "Très lent sur gros volumes. v20231120+ recommandé. Output peut être 100GB+ — prévoir disque.",
      notes: "Standard académique pour reproductibilité."
    },

    // ── REVERSE / MALWARE ────────────────────────────────
    {
      name: 'Ghidra', category: 'Reverse Engineering', os: ['Windows','Linux','macOS'], license: 'Libre',
      maturity: 'Production', vendor: 'NSA',
      url: 'https://ghidra-sre.org/',
      description: "Suite de RE open source publiée par la NSA en 2019. Concurrent direct d'IDA Pro.",
      capabilities: ['Désassemblage', 'Décompilation (C-like)', 'Multi-arch', 'Scripting Java/Python', 'Collaboration multi-utilisateur'],
      formats: ['PE, ELF, Mach-O, Android DEX, ROM dumps...'],
      alternatives: 'IDA Pro (commercial), Binary Ninja, radare2',
      gotchas: "Java requis. Un peu lourd. Décompilateur excellent mais parfois génère du code pas idiomatique.",
      notes: "Devenu standard en CTI/RE depuis 2019."
    },
    {
      name: 'YARA', category: 'Malware', os: ['Windows','Linux','macOS'], license: 'Libre',
      maturity: 'Production', vendor: 'VirusTotal / Victor Alvarez',
      url: 'https://yara.readthedocs.io/',
      description: "Pattern matching pour identifier et classifier malware via règles.",
      capabilities: ['Règles strings + boolean logic', 'Modules PE/ELF/Math/Hash', 'Scan disque, memdump, network'],
      formats: ['Règles .yar / .yara', 'Scanne tout binaire'],
      alternatives: 'Sigma (pour logs)',
      gotchas: "Faux positifs si règles trop génériques. À combiner avec hash matching et threat intel.",
      notes: "Indispensable pour hunt et triage. Sources : Florian Roth, Yara-Rules repo, VirusTotal Hunting."
    },

    // ── CLOUD ────────────────────────────────────────────
    {
      name: 'MSTICPy', category: 'Cloud', os: ['Linux','macOS','Windows'], license: 'Libre',
      maturity: 'Production', vendor: 'Microsoft',
      url: 'https://github.com/microsoft/msticpy',
      description: "Bibliothèque Python pour CTI et hunting cloud (Azure Sentinel principalement).",
      capabilities: ['Connecteurs Sentinel/Splunk/M365', 'Threat intel lookups', 'Visualisation timelines/graphs', 'Notebook DFIR'],
      formats: ['Pandas DataFrames', 'KQL queries'],
      alternatives: 'Custom KQL, Splunk SOAR',
      gotchas: "Très orienté Microsoft. Apprentissage Jupyter notebook nécessaire."
    },

    // ── HASH / HASHING ───────────────────────────────────
    {
      name: 'NSRL (RDS)', category: 'Hash database', os: ['Cross-platform'], license: 'Libre',
      maturity: 'Production', vendor: 'NIST',
      url: 'https://www.nist.gov/itl/ssd/software-quality-group/national-software-reference-library-nsrl',
      description: "National Software Reference Library — base de hashes connus (Windows OS files, applications). Permet d'éliminer les fichiers 'good known'.",
      capabilities: ['Hash database (MD5/SHA-1/SHA-256)', 'Reduces noise in DFIR analysis', 'Updated quarterly'],
      formats: ['RDS Hash Sets (NSRL Modern, Legacy, Android, iOS)'],
      alternatives: 'Bit9 hash database, custom whitelisting',
      gotchas: "Base TRÈS large (>50M hashes). Format propre à parser. NSRL Modern = OS récents.",
      notes: "Intégré dans Autopsy via Hash Lookup module."
    },

    // ── DISK / FS UTILITIES ──────────────────────────────
    {
      name: 'Sleuth Kit Body file → mactime', category: 'Timeline', os: ['Linux','macOS','Windows'], license: 'Libre',
      maturity: 'Production', vendor: 'TSK',
      description: "Combo classique : <code>fls -r -m / image.E01 > body.txt</code> puis <code>mactime -b body.txt -d</code> = timeline FS minimal.",
      capabilities: ['Timeline MAC times du FS', 'CSV format', 'Léger (pas plaso)'],
      formats: ['Sleuthkit body file → CSV mactime'],
      alternatives: 'plaso (super timeline plus riche)',
      notes: "Souvent suffisant pour question simple : 'qu\\'a fait l\\'attaquant entre 14h et 16h ?'"
    },

    // ── HEX EDITORS ──────────────────────────────────────
    {
      name: 'HxD / 010 Editor', category: 'Hex Editor', os: ['Windows'], license: 'Mixte',
      maturity: 'Production', vendor: 'Maël Hörz / SweetScape',
      description: "HxD = gratuit, simple. 010 Editor = commercial, supporte des templates (parse PE, NTFS, ELF, etc.).",
      capabilities: ['Édition binaire', 'Comparaison de fichiers', 'Templates parsing (010)', 'Recherche hex/string'],
      formats: ['Tout format binaire'],
      alternatives: 'wxHexEditor (Linux), ImHex (récent, FOSS, riche)',
      gotchas: "010 Editor = templates puissants mais payant. ImHex est le challenger FOSS de plus en plus utilisé."
    },
    {
      name: 'ImHex', category: 'Hex Editor', os: ['Windows','Linux','macOS'], license: 'Libre',
      maturity: 'Production', vendor: 'WerWolv',
      url: 'https://imhex.werwolv.net/',
      description: "Hex editor moderne pour reverse engineers. Pattern language puissant pour parser des structures.",
      capabilities: ['Pattern language (.hexpat)', 'Visualisation entropie', 'Disassembler intégré', 'Provider plugins'],
      formats: ['Tout format binaire'],
      alternatives: 'HxD, 010 Editor',
      notes: "Devient le standard FOSS pour les hex editors riches."
    },

    // ── BROWSER ARTIFACT TOOLS ───────────────────────────
    {
      name: 'Hindsight', category: 'Browser', os: ['Linux','macOS','Windows'], license: 'Libre',
      maturity: 'Standard', vendor: 'Ryan Benson',
      url: 'https://github.com/obsidianforensics/hindsight',
      description: "Parsing complet des artefacts Chrome / Edge Chromium / Brave (history, cache, cookies, downloads, autofill, FileSystem API).",
      capabilities: ['Multi-profil', 'Output HTML / Excel / SQLite', 'Parsing extensif Chromium'],
      formats: ['Chromium User Data folder'],
      alternatives: 'BrowsingHistoryView (NirSoft), Magnet AXIOM',
      gotchas: "Profils Chrome récents : timestamps en webkit format (microsec depuis 1601-01-01)."
    },

    // ── CONTAINERS / DOCKER ──────────────────────────────
    {
      name: 'docker-explorer', category: 'Container', os: ['Linux','macOS'], license: 'Libre',
      maturity: 'Beta', vendor: 'Google',
      url: 'https://github.com/google/docker-explorer',
      description: "Explore et reconstruit l'état d'un container/image Docker depuis un FS dump (offline forensics).",
      capabilities: ['Liste containers/images', 'Reconstruction layered FS', 'Mount-fs offline'],
      formats: ['Docker root dir (var/lib/docker)'],
      alternatives: 'Manuel via overlayfs, dive',
      notes: "Outil de niche mais essentiel quand un container Docker est compromis."
    }

  ]
};
