// ═══════════════════════════════════════════════════════════════
// mitre-data.js — MITRE ATT&CK Enterprise (browser filtré)
// Page : mitre.html
// ~35 techniques parmi les plus rencontrées en DFIR.
// ═══════════════════════════════════════════════════════════════
window.REF_CONFIG = {

  pageId:    'mitre',
  emoji:     '🎯',
  title:     'MITRE ATT&CK',
  subtitle:  'Tactics · Techniques · Detection',
  description: "Techniques d'attaque mappées sur le framework MITRE ATT&CK Enterprise. Pour chaque T-number : description, plateforme, sources de détection (Event IDs, artefacts), atténuations.",

  filters: [
    { id: 'tactic',    label: 'Tactic',     kind: 'select', autoOptions: true },
    { id: 'platforms', label: 'Plateforme', kind: 'select', autoOptions: true },
    { id: 'q',         label: 'Recherche',  kind: 'text',   placeholder: 'ex: lsass, kerberos, T1003...' }
  ],

  columns: [
    { id: 'tactic',     label: 'Tactic',    kind: 'tag',   sortable: true },
    { id: 'techniqueId',label: 'ID',        kind: 'mono',  sortable: true },
    { id: 'name',       label: 'Technique', kind: 'bold',  sortable: true },
    { id: 'platforms',  label: 'Plateforme', kind: 'plain', render: d => (d.platforms||[]).map(p =>
        `<span class="ref-badge ref-badge--${p.toLowerCase().replace(/[^a-z0-9]/g,'-')}">${p}</span>`).join(' ') }
  ],

  detail: {
    titleField: 'name',
    callout: d => d.subOf ? {
      tone: 'purple',
      html: `<b>↪ Sub-technique de :</b> <code>${d.subOf}</code>`
    } : null,
    grid: [
      { label: 'Tactic',           field: 'tactic' },
      { label: 'Technique ID',     render: d => `<span class="ref-mono">${d.techniqueId}</span>` },
      { label: 'Plateformes',      render: d => (d.platforms||[]).join(', ') },
      { label: 'Data Sources',     render: d => (d.dataSources||[]).join(', ') }
    ],
    description: 'description',
    sections: [
      { label: "Procédure d'attaque",   field: 'procedure' },
      { label: 'Détection (Event IDs / artefacts)', field: 'detection' },
      { label: 'Atténuation',           field: 'mitigation' },
      { label: 'Exemples connus',       field: 'examples' }
    ],
    related: 'related',
    notes: 'notes'
  },

  search: {
    fields: ['techniqueId', 'name', 'description', 'tactic', 'procedure',
             'detection', 'mitigation', 'examples', 'platforms']
  },

  data: [

    // ── INITIAL ACCESS (TA0001) ──────────────────────────
    {
      tactic: 'Initial Access', techniqueId: 'T1566', name: 'Phishing',
      platforms: ['Windows','macOS','Linux','Office365','SaaS','Google Workspace'],
      dataSources: ['Email Gateway','Network Traffic','File Creation'],
      description: "Adversaires envoient des emails malveillants pour exécuter du code sur la cible.",
      procedure: "Pièce jointe (T1566.001), lien (T1566.002), ou via service (T1566.003 - LinkedIn, Teams).",
      detection: "Email gateway logs, en-têtes SMTP suspects, attachments avec macros (Word/Excel), URLs raccourcies. Sysmon EID 1 pour outlook.exe → cmd.exe/powershell.exe.",
      mitigation: "Sandbox emails, désactiver macros par défaut (M1042), formation utilisateur (M1017), DMARC/SPF/DKIM strict.",
      examples: "APT29, FIN7, Conti — la quasi-totalité des incidents commencent par phishing.",
      related: [{ href: 'fiches/email_forensique.html', label: 'Fiche email forensique' }]
    },
    {
      tactic: 'Initial Access', techniqueId: 'T1078', name: 'Valid Accounts',
      platforms: ['Windows','macOS','Linux','Cloud','SaaS'],
      dataSources: ['Logon Session','User Account'],
      description: "Utilisation de credentials légitimes obtenus (achetés, phishing, breach) pour accéder.",
      procedure: "Default accounts (T1078.001), Domain (T1078.002), Local (T1078.003), Cloud (T1078.004).",
      detection: "Security 4624 logon types inhabituels, Source IP géographique anormale, horaires hors heures bureau, 4625 puis 4624 sur même IP.",
      mitigation: "MFA partout (M1032), monitoring des comptes privilégiés (M1018), désactivation comptes par défaut.",
      notes: "Difficile à détecter — l'auth est techniquement légitime."
    },
    {
      tactic: 'Initial Access', techniqueId: 'T1190', name: 'Exploit Public-Facing Application',
      platforms: ['Windows','macOS','Linux','Network'],
      dataSources: ['Network Traffic','Application Log'],
      description: "Exploitation d'une vuln dans une app exposée à internet (Exchange, VPN, web app).",
      detection: "WAF logs, pics 4xx/5xx, IIS/Apache logs, EDR sur web server. Patterns Exchange: ECP folder, ProxyLogon URLs.",
      mitigation: "Patch management agressif (M1051), WAF, segmentation, audit pre-prod.",
      examples: "Hafnium (ProxyLogon), MOVEit (Cl0p), Citrix Bleed."
    },

    // ── EXECUTION (TA0002) ───────────────────────────────
    {
      tactic: 'Execution', techniqueId: 'T1059', name: 'Command and Scripting Interpreter',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['Process Creation','Command Execution','Script'],
      description: "Exécution via un interpréteur (cmd, powershell, bash, AppleScript, Python).",
      procedure: "Sub-techniques : .001 PowerShell, .002 AppleScript, .003 cmd, .004 Unix shell, .005 Visual Basic, .006 Python, .007 JS, .008 Network Device CLI.",
      detection: "<b>PowerShell EID 4104</b> (script block logging), Sysmon EID 1 (CommandLine), Security 4688. AMSI pour PS suspect.",
      mitigation: "Constrained Language Mode (M1038), AppLocker/WDAC (M1038), désactiver macros."
    },
    {
      tactic: 'Execution', techniqueId: 'T1059.001', name: 'PowerShell',
      subOf: 'T1059',
      platforms: ['Windows'],
      dataSources: ['Process Creation','Script','Module Load'],
      description: "Utilisation de PowerShell pour exécuter du code.",
      detection: "PowerShell EID 4104 (ScriptBlock), 4103 (Pipeline), Security 4688 + CommandLine. Patterns: <code>-enc</code>, <code>IEX</code>, <code>DownloadString</code>, longueur de ligne >1000.",
      mitigation: "ScriptBlock Logging GPO, PSConstrainedLanguageMode, AppLocker, JEA (Just Enough Admin)."
    },
    {
      tactic: 'Execution', techniqueId: 'T1204', name: 'User Execution',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['Process Creation','File Creation'],
      description: "L'utilisateur exécute lui-même un fichier malveillant (double-clic, ouverture macro).",
      detection: "Sysmon EID 11 (drop) → EID 1 (exec), parent = explorer/winrar/outlook.",
      mitigation: "Désactiver macros, SmartScreen, formation."
    },

    // ── PERSISTENCE (TA0003) ─────────────────────────────
    {
      tactic: 'Persistence', techniqueId: 'T1547.001', name: 'Registry Run Keys / Startup Folder',
      subOf: 'T1547',
      platforms: ['Windows'],
      dataSources: ['Registry','File Creation'],
      description: "Persistance via clés Run/RunOnce dans le registre, ou Startup folder.",
      procedure: "<code>HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run</code>, idem HKLM, RunOnce, RunOnceEx, Userinit, Shell, AppInit_DLLs.",
      detection: "Sysmon EID 12/13 (registry write), AutoRuns (Sysinternals), KAPE/RegRipper sur NTUSER.DAT/SOFTWARE. Cross-link artifacts.html.",
      mitigation: "Restreindre écriture HKLM, monitorer Run keys.",
      related: [{ href: 'artifacts.html?q=run', label: 'artifacts.html : Run keys' }]
    },
    {
      tactic: 'Persistence', techniqueId: 'T1543.003', name: 'Windows Service',
      subOf: 'T1543',
      platforms: ['Windows'],
      dataSources: ['Service Creation','Process Creation','Registry'],
      description: "Création/modification d'un service Windows pour persister.",
      detection: "<b>System EID 7045</b> (service installed) + <b>Security 4697</b>. Examiner ImagePath, ServiceDLL. Sysmon EID 13 sur HKLM\\SYSTEM\\CurrentControlSet\\Services.",
      mitigation: "Restreindre privilèges création service, monitoring sc.exe / New-Service."
    },
    {
      tactic: 'Persistence', techniqueId: 'T1053.005', name: 'Scheduled Task',
      subOf: 'T1053',
      platforms: ['Windows'],
      dataSources: ['Process Creation','File Creation','Scheduled Job'],
      description: "Création d'une tâche planifiée.",
      detection: "TaskScheduler EID 106 (task registered), 200 (action started), Security 4698 (task created). Fichier XML dans <code>C:\\Windows\\System32\\Tasks\\</code>.",
      mitigation: "Restriction GPO, monitoring schtasks.exe, At.exe."
    },
    {
      tactic: 'Persistence', techniqueId: 'T1136', name: 'Create Account',
      platforms: ['Windows','macOS','Linux','Cloud','Network'],
      dataSources: ['User Account','Process Creation'],
      description: "Création d'un compte pour persister sans avoir besoin de credentials existants.",
      detection: "Security 4720 (création), 4724 (mot de passe défini), 4732/4728 (ajout groupe admin).",
      mitigation: "Audit des créations de compte, monitoring Active Directory."
    },

    // ── PRIVILEGE ESCALATION (TA0004) ────────────────────
    {
      tactic: 'Privilege Escalation', techniqueId: 'T1068', name: 'Exploitation for Privilege Escalation',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['Process Creation','Driver Load'],
      description: "Exploitation d'une vulnérabilité du noyau / driver / service privilégié.",
      detection: "BYOVD (Bring Your Own Vulnerable Driver) : Sysmon EID 6 (driver loaded), Defender 1116. Crashes service (System 7034).",
      mitigation: "Patch, kernel-mode signature enforcement (HVCI), driver blocklist Windows.",
      examples: "Mimikatz drv (mimidrv.sys), procexp.sys, RTCore64.sys (Capcom)."
    },

    // ── DEFENSE EVASION (TA0005) ─────────────────────────
    {
      tactic: 'Defense Evasion', techniqueId: 'T1027', name: 'Obfuscated Files or Information',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['File Content','Process Creation'],
      description: "Obfuscation de fichier/code pour échapper à la détection (base64, XOR, packing).",
      detection: "Entropie élevée (>7.5/8), strings avec ratio non-imprimables, AMSI bypass patterns, PowerShell <code>-enc</code> avec base64 long.",
      mitigation: "AMSI, EDR comportemental, AV heuristique."
    },
    {
      tactic: 'Defense Evasion', techniqueId: 'T1070.001', name: 'Clear Windows Event Logs',
      subOf: 'T1070',
      platforms: ['Windows'],
      dataSources: ['Process Creation','Sensor Health'],
      description: "Effacement des journaux d'événements Windows.",
      detection: "<b>Security 1102</b> (audit log cleared), <b>System 104</b>, processus wevtutil.exe ou Clear-EventLog.",
      mitigation: "Logging redirigé en temps réel (SIEM), Windows Event Forwarding (WEF)."
    },
    {
      tactic: 'Defense Evasion', techniqueId: 'T1112', name: 'Modify Registry',
      platforms: ['Windows'],
      dataSources: ['Registry','Process Creation'],
      description: "Modification de clés de registre pour désactiver sécurité ou persister.",
      detection: "Sysmon EID 13/14, focus sur DisableRealtimeMonitoring (Defender), modification Image File Execution Options (IFEO).",
      mitigation: "Tamper Protection Defender, WDAC, monitoring."
    },
    {
      tactic: 'Defense Evasion', techniqueId: 'T1218.011', name: 'Rundll32',
      subOf: 'T1218',
      platforms: ['Windows'],
      dataSources: ['Process Creation','Command Execution'],
      description: "Utilisation de rundll32.exe (LOLBin) pour exécuter du code via DLL.",
      detection: "Sysmon EID 1 sur rundll32.exe avec arguments inhabituels (URL, .tmp, JS via mshtml).",
      mitigation: "AppLocker/WDAC, EDR comportemental.",
      examples: "Cobalt Strike : rundll32.exe shell32.dll,Control_RunDLL <payload>."
    },

    // ── CREDENTIAL ACCESS (TA0006) ───────────────────────
    {
      tactic: 'Credential Access', techniqueId: 'T1003.001', name: 'LSASS Memory',
      subOf: 'T1003',
      platforms: ['Windows'],
      dataSources: ['Process Access','Process Creation'],
      description: "Dump de la mémoire LSASS pour extraire credentials (NTLM, Kerberos tickets, mots de passe en clair).",
      procedure: "mimikatz, procdump -ma lsass.exe, comsvcs.dll MiniDump, taskmgr → Create Dump File, NanoDump.",
      detection: "<b>Sysmon EID 10</b> (ProcessAccess) sur lsass.exe avec GrantedAccess 0x1010, 0x1410, 0x1438, 0x143A. Sysmon EID 11 fichier .dmp.",
      mitigation: "Credential Guard (M1043), LSA Protection (RunAsPPL), EDR avec PPL bypass detection.",
      examples: "Toutes les ops APT/ransomware modernes incluent un dump LSASS."
    },
    {
      tactic: 'Credential Access', techniqueId: 'T1110', name: 'Brute Force',
      platforms: ['Windows','macOS','Linux','Cloud','SaaS'],
      dataSources: ['User Account Authentication','Application Log'],
      description: "Tentatives répétées de mot de passe (brute force, password spraying, credential stuffing).",
      detection: "Pic Security 4625 (échec) puis 4624 (succès), même IP source, plusieurs comptes (spraying) ou plusieurs passwords/compte (brute force).",
      mitigation: "MFA, account lockout policies, rate limiting, CAPTCHA, Azure AD smart lockout."
    },
    {
      tactic: 'Credential Access', techniqueId: 'T1558.003', name: 'Kerberoasting',
      subOf: 'T1558',
      platforms: ['Windows'],
      dataSources: ['Service Ticket','User Account Authentication'],
      description: "Demande de tickets de service Kerberos chiffrés en RC4 pour cracking offline du mot de passe du compte de service.",
      detection: "<b>Security 4769</b> avec Ticket Encryption Type = 0x17 (RC4) sur SPN inhabituels en pic.",
      mitigation: "Mots de passe complexes pour comptes de service (>25 chars), gMSA, AES-only."
    },
    {
      tactic: 'Credential Access', techniqueId: 'T1555', name: 'Credentials from Password Stores',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['Process Creation','File Access'],
      description: "Vol de credentials stockés (browsers, gestionnaires de mots de passe, keychain, Credential Manager).",
      detection: "Process accédant à <code>%APPDATA%\\Local\\Google\\Chrome\\User Data\\Login Data</code>, <code>%APPDATA%\\Microsoft\\Credentials\\</code>.",
      mitigation: "Browser policies, BitLocker pour DPAPI keys."
    },

    // ── DISCOVERY (TA0007) ────────────────────────────────
    {
      tactic: 'Discovery', techniqueId: 'T1083', name: 'File and Directory Discovery',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['Process Creation','Command Execution'],
      description: "Énumération de fichiers et répertoires pour identifier des cibles.",
      detection: "Sysmon EID 1 : dir /s, find, Get-ChildItem -Recurse, tree.",
      mitigation: "Difficile — comportement normal. Détecter via volume / pattern."
    },
    {
      tactic: 'Discovery', techniqueId: 'T1087', name: 'Account Discovery',
      platforms: ['Windows','macOS','Linux','Cloud','SaaS'],
      dataSources: ['Process Creation','Command Execution'],
      description: "Énumération des comptes locaux ou de domaine.",
      detection: "<code>net user</code>, <code>net group \"Domain Admins\" /domain</code>, BloodHound (SharpHound). Security 4798/4799.",
      mitigation: "Restreindre LDAP queries, Microsoft Defender for Identity."
    },

    // ── LATERAL MOVEMENT (TA0008) ────────────────────────
    {
      tactic: 'Lateral Movement', techniqueId: 'T1021.001', name: 'Remote Desktop Protocol',
      subOf: 'T1021',
      platforms: ['Windows'],
      dataSources: ['Logon Session','Network Connection'],
      description: "Mouvement latéral via RDP.",
      detection: "Security 4624 type 10, TerminalServices EID 21/24/1149, port 3389. Source : Bitmap Cache (\\AppData\\Local\\Microsoft\\Terminal Server Client\\Cache).",
      mitigation: "Network Level Authentication (NLA), MFA, jump hosts, pas de RDP exposé internet.",
      related: [{ href: 'artifacts.html?q=rdp', label: 'artifacts.html : RDP cache' }]
    },
    {
      tactic: 'Lateral Movement', techniqueId: 'T1021.002', name: 'SMB / Admin Shares',
      subOf: 'T1021',
      platforms: ['Windows'],
      dataSources: ['Logon Session','Network Share'],
      description: "Accès aux admin shares (C$, ADMIN$, IPC$) pour copier/exécuter à distance.",
      detection: "Security 5140/5145 (file share), 4624 type 3, source : <code>\\\\target\\C$</code>. PsExec = service psexesvc.exe (System EID 7045).",
      mitigation: "Désactiver admin shares (HKLM\\System\\CurrentControlSet\\Services\\LanmanServer\\Parameters\\AutoShareWks=0), SMB signing, segmentation."
    },

    // ── COLLECTION (TA0009) ──────────────────────────────
    {
      tactic: 'Collection', techniqueId: 'T1005', name: 'Data from Local System',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['Process Creation','File Access'],
      description: "Collecte de données depuis le système compromis avant exfiltration.",
      detection: "Sysmon EID 1 + 11, focus archives (.zip, .rar, .7z) créées dans %TEMP%, <code>tar</code>, <code>Compress-Archive</code>.",
      mitigation: "DLP, monitoring fichiers sensibles."
    },

    // ── EXFILTRATION (TA0010) ────────────────────────────
    {
      tactic: 'Exfiltration', techniqueId: 'T1041', name: 'Exfiltration Over C2 Channel',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['Network Traffic'],
      description: "Exfiltration via le même canal que la C2.",
      detection: "Volume sortant atypique (host vs baseline), Sysmon EID 3 vers IP C2 connue.",
      mitigation: "Network egress filtering, DNS sinkhole IOCs, DLP."
    },
    {
      tactic: 'Exfiltration', techniqueId: 'T1567.002', name: 'Exfiltration to Cloud Storage',
      subOf: 'T1567',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['Network Traffic','File Transfer'],
      description: "Exfiltration via Mega.nz, Dropbox, Google Drive, OneDrive...",
      detection: "DNS queries vers mega.io, dropbox.com, anonfiles. Volume upload élevé.",
      mitigation: "Block cloud storage non sanctionnés au proxy, CASB."
    },

    // ── COMMAND AND CONTROL (TA0011) ─────────────────────
    {
      tactic: 'Command and Control', techniqueId: 'T1071.001', name: 'Web Protocols (HTTP/S)',
      subOf: 'T1071',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['Network Traffic'],
      description: "C2 via HTTP/HTTPS pour se cacher dans le trafic légitime.",
      detection: "User-Agent inhabituels, beaconing à intervalles réguliers (jitter), domains nouveaux/typosquatting, JA3/JA3S fingerprints. Sysmon EID 22 (DNS).",
      mitigation: "TLS inspection, proxy avec catégorisation, DNS sinkhole."
    },
    {
      tactic: 'Command and Control', techniqueId: 'T1573', name: 'Encrypted Channel',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['Network Traffic'],
      description: "C2 chiffré (custom crypto, asymmetric).",
      detection: "Entropie réseau élevée + destinations rares. JA3 atypique.",
      mitigation: "TLS interception (avec considérations légales)."
    },
    {
      tactic: 'Command and Control', techniqueId: 'T1090', name: 'Proxy',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['Network Traffic'],
      description: "Utilisation de proxies (Tor, fast flux) pour cacher la vraie destination.",
      detection: "Connexions vers nœuds Tor connus, fast-flux DNS (TTL très court, IPs changeantes).",
      mitigation: "Block listes Tor, monitoring DNS TTL anomalies."
    },

    // ── IMPACT (TA0040) ──────────────────────────────────
    {
      tactic: 'Impact', techniqueId: 'T1486', name: 'Data Encrypted for Impact',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['File Modification','Process Creation'],
      description: "Ransomware : chiffrement des données pour rançon.",
      detection: "Sysmon EID 11 : volume énorme de modifications fichiers, extensions inhabituelles ajoutées. Note de rançon (.txt) dans tous les répertoires.",
      mitigation: "Backups offline (3-2-1), Volume Shadow Copy protection, EDR avec rollback (T1490).",
      examples: "LockBit, Conti, Cl0p, BlackCat (ALPHV)."
    },
    {
      tactic: 'Impact', techniqueId: 'T1490', name: 'Inhibit System Recovery',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['Process Creation','Command Execution'],
      description: "Suppression de Volume Shadow Copies, désactivation de la récupération.",
      detection: "Sysmon EID 1 : <code>vssadmin delete shadows /all</code>, <code>wmic shadowcopy delete</code>, <code>bcdedit /set {default} recoveryenabled No</code>, <code>wbadmin delete catalog</code>.",
      mitigation: "Tamper protection VSS, WDAC bloquer vssadmin pour utilisateurs non-admin.",
      examples: "Quasi tous les ransomwares modernes (LockBit, Conti, BlackCat)."
    },
    {
      tactic: 'Impact', techniqueId: 'T1485', name: 'Data Destruction',
      platforms: ['Windows','macOS','Linux'],
      dataSources: ['File Deletion','Process Creation'],
      description: "Destruction (wiper) — différent de T1486 (chiffrement). Pas de récupération possible.",
      detection: "Sysmon EID 23 (FileDelete), patterns sdelete, format, dd if=/dev/zero, MBR overwrite.",
      examples: "NotPetya (faux ransomware = wiper), HermeticWiper, WhisperGate."
    },

    // ── RECONNAISSANCE (TA0043) ──────────────────────────
    {
      tactic: 'Reconnaissance', techniqueId: 'T1595', name: 'Active Scanning',
      platforms: ['PRE'],
      dataSources: ['Network Traffic'],
      description: "Reconnaissance active de l'infrastructure (port scan, vuln scan).",
      detection: "IDS/Suricata, firewall logs : volume connexions échouées, scans sur plages port.",
      mitigation: "Honeypots, rate-limiting, masquerading services."
    },

    // ── RESOURCE DEVELOPMENT (TA0042) ────────────────────
    {
      tactic: 'Resource Development', techniqueId: 'T1583.001', name: 'Acquire Domains',
      subOf: 'T1583',
      platforms: ['PRE'],
      dataSources: ['Domain Registration'],
      description: "Achat de domaines pour C2 ou phishing, parfois en typosquatting.",
      detection: "Threat Intel : DomainTools, Whoxy, certificats Let's Encrypt récents pour domaines suspects.",
      mitigation: "Domain monitoring, brand protection."
    }

  ]
};
