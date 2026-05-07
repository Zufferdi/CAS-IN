// ═══════════════════════════════════════════════════════════════
// events-data.js — Event IDs Windows / Sysmon / PowerShell
// Page : events.html
// Référence DFIR : ~45 événements parmi les plus consultés.
// ═══════════════════════════════════════════════════════════════
window.REF_CONFIG = {

  // ── Métadonnées de page ─────────────────────────────────
  pageId:    'events',
  emoji:     '🪵',
  title:     'Event IDs',
  subtitle:  'Windows · Sysmon · PowerShell',
  description: 'Référence des Event IDs forensiquement intéressants — ce qu\'ils signifient, quand ils sont générés, et ce qu\'on en tire en analyse.',

  // ── Filtres ─────────────────────────────────────────────
  filters: [
    { id: 'channel',  label: 'Channel',     kind: 'select', autoOptions: true },
    { id: 'category', label: 'Catégorie',   kind: 'select', autoOptions: true },
    { id: 'severity', label: 'Sévérité',    kind: 'select', autoOptions: true },
    { id: 'q',        label: 'Recherche libre', kind: 'text', placeholder: 'ex: lsass, kerberos, persistence...' }
  ],

  // ── Colonnes de la table ────────────────────────────────
  columns: [
    { id: 'channel',  label: 'Channel',  kind: 'badge', sortable: true,
      badgeMap: { 'Security':'security', 'System':'system', 'Application':'application',
                  'Sysmon':'sysmon', 'PowerShell':'powershell', 'TaskScheduler':'cyan',
                  'TerminalServices':'purple', 'Defender':'green' } },
    { id: 'eventId',  label: 'ID',       kind: 'mono',  sortable: true },
    { id: 'name',     label: 'Nom',      kind: 'bold',  sortable: true },
    { id: 'category', label: 'Catégorie', kind: 'tag',  sortable: true },
    { id: 'severity', label: 'Sévérité', kind: 'badge', sortable: true,
      badgeMap: { 'Critique':'critical', 'Haute':'high', 'Moyenne':'medium', 'Basse':'low', 'Info':'info' } }
  ],

  // ── Détail dépliable ────────────────────────────────────
  detail: {
    titleField: 'name',
    callout: (d) => d.audit ? {
      tone: 'gold',
      html: `<b>⚙ Audit policy requise :</b> <code>${d.audit}</code> — sans ça l'événement n'est pas généré.`
    } : null,
    grid: [
      { label: 'Channel',     field: 'channel' },
      { label: 'Event ID',    render: d => `<span class="ref-mono">${d.eventId}</span>` },
      { label: 'Catégorie',   field: 'category' },
      { label: 'Sévérité',    field: 'severity' },
      { label: 'Versions',    render: d => Array.isArray(d.versions) ? d.versions.join(', ') : (d.versions || 'Toutes') }
    ],
    description: 'description',
    sections: [
      { label: 'Champs intéressants', field: 'fields',         kind: 'list' },
      { label: 'Valeur forensique',   field: 'forensicValue' },
      { label: 'Fausses alertes',     field: 'falsePositives' }
    ],
    notes: 'notes',
    related: 'related'
  },

  search: {
    fields: ['eventId', 'name', 'description', 'category', 'forensicValue',
             'falsePositives', 'fields', 'notes']
  },

  // ── Données ─────────────────────────────────────────────
  data: [

    // ── SECURITY (Authentication) ────────────────────────
    {
      channel: 'Security', eventId: '4624', name: 'Logon réussi', category: 'Authentification',
      severity: 'Info', versions: ['Vista','7','8','10','11','Server 2008+'],
      audit: 'Audit Logon — Success',
      description: "Un compte s'est connecté avec succès. C'est l'événement de connexion le plus consulté en DFIR.",
      fields: [
        '<b>Logon Type</b> : 2=interactive, 3=network (SMB/RPC), 4=batch (planifié), 5=service, 7=unlock, 8=network cleartext (mot de passe en clair !), 9=newcredentials (RunAs /netonly), 10=remote interactive (RDP), 11=cached interactive',
        '<b>Account Name</b> + <b>Account Domain</b>',
        '<b>Logon ID</b> : identifiant unique de session, à corréler avec 4634 (logoff)',
        '<b>Source Network Address</b> : IP source si type 3/10',
        '<b>Authentication Package</b> : NTLM / Kerberos / Negotiate'
      ],
      forensicValue: "Pivot principal pour reconstruire les sessions. Le <code>Logon Type</code> distingue local (2), réseau (3), RDP (10), et le suspect <code>Type 8</code> (mot de passe en clair, exfiltré ou ancien protocole).",
      falsePositives: "Type 3 sur DC = très bruyant (ouvertures de session SMB normales). Filtrer par Account Name ≠ ANONYMOUS LOGON et workstation domain ≠ DC.",
      notes: "Pour une chaîne complète : 4624 (logon) → activité → 4634 (logoff). Le LogonID lie les deux."
    },
    {
      channel: 'Security', eventId: '4625', name: 'Logon échoué', category: 'Authentification',
      severity: 'Moyenne', versions: ['Vista+'],
      audit: 'Audit Logon — Failure',
      description: "Tentative de connexion qui a échoué. Les sub-codes (Status / Sub Status) précisent la cause.",
      fields: [
        '<b>Status</b> / <b>Sub Status</b> : 0xC0000064=user does not exist, 0xC000006A=bad password, 0xC0000234=account locked, 0xC0000071=password expired, 0xC0000072=account disabled, 0xC0000133=clock skew (Kerberos), 0xC0000193=account expired, 0xC0000224=must change pwd',
        '<b>Logon Type</b>, <b>Account Name</b>, <b>Source Network Address</b>'
      ],
      forensicValue: "Détection de brute force, password spraying, énumération. Pic de 4625 avec même IP source = attaque distribuée.",
      falsePositives: "Mots de passe expirés en masse (politique), comptes désactivés mais clients pas mis à jour."
    },
    {
      channel: 'Security', eventId: '4634', name: 'Logoff', category: 'Authentification',
      severity: 'Info', versions: ['Vista+'],
      audit: 'Audit Logon — Success',
      description: "Fin de session. À corréler avec 4624 via le LogonID.",
      fields: ['<b>Logon ID</b>', '<b>Logon Type</b>'],
      forensicValue: "Permet de calculer la durée d'une session. Pas généré pour tous les types de logon (le 3 / network notamment).",
      notes: "L'événement 4647 (User Initiated Logoff) est plus fiable pour les logoffs interactifs."
    },
    {
      channel: 'Security', eventId: '4648', name: 'Logon explicite (RunAs)', category: 'Authentification',
      severity: 'Moyenne', versions: ['Vista+'],
      audit: 'Audit Logon — Success',
      description: "Un processus s'est explicitement loggé avec d'autres credentials (commande <code>runas</code>, <code>psexec -u</code>, schtasks /ru, etc.).",
      fields: [
        '<b>Subject Account</b> : qui a initié',
        '<b>Account Whose Credentials Were Used</b> : sous quelle identité',
        '<b>Target Server Name</b>',
        '<b>Process Information</b>'
      ],
      forensicValue: "Indicateur fort de mouvement latéral, élévation de privilège, ou utilisation d'un compte de service. Clé en chasse ATT&CK T1078.",
      falsePositives: "Comptes de service automatisés."
    },
    {
      channel: 'Security', eventId: '4672', name: 'Privilèges spéciaux assignés', category: 'Privilèges',
      severity: 'Moyenne', versions: ['Vista+'],
      audit: 'Audit Special Logon — Success',
      description: "Une session ouverte a obtenu des privilèges sensibles (SeDebugPrivilege, SeBackupPrivilege, SeImpersonatePrivilege, etc.). Indique un compte privilégié.",
      forensicValue: "Tracer toutes les sessions admin. Sur DC, à corréler systématiquement avec 4624.",
      falsePositives: "Très bruyant : tout admin local génère ça à chaque logon. Filtrer pour ne garder que les comptes inhabituels."
    },
    {
      channel: 'Security', eventId: '4768', name: 'TGT Kerberos demandé', category: 'Authentification',
      severity: 'Info', versions: ['Vista+ (DC)'],
      audit: 'Audit Kerberos Authentication Service — Success/Failure',
      description: "Demande d'un Ticket Granting Ticket (authentification Kerberos initiale). Généré sur le DC.",
      fields: [
        '<b>Account Name</b>, <b>Service Name</b> (=krbtgt)',
        '<b>Client Address</b> : IP du poste',
        '<b>Pre-Authentication Type</b> : 2=encrypted timestamp (normal), 0=AS-REP roastable (suspect !)',
        '<b>Ticket Encryption Type</b> : 0x12 (AES256), 0x17 (RC4-HMAC, downgrade suspect)'
      ],
      forensicValue: "Détection AS-REP roasting (Pre-Auth=0), chiffrement RC4 forcé (Kerberoasting préparation), comptes inhabituels.",
      related: [{ href: 'mitre.html?q=T1558.003', label: 'MITRE T1558.003 (Kerberoasting)' }]
    },
    {
      channel: 'Security', eventId: '4769', name: 'TGS Kerberos demandé', category: 'Authentification',
      severity: 'Info', versions: ['Vista+ (DC)'],
      audit: 'Audit Kerberos Service Ticket Operations — Success/Failure',
      description: "Demande d'un Ticket de service (accès à un service après TGT). Généré sur le DC.",
      fields: [
        '<b>Service Name</b> : SPN ciblé (ex: HTTP/server.dom)',
        '<b>Ticket Encryption Type</b> : 0x17=RC4 (potentiellement Kerberoasting), 0x12=AES256',
        '<b>Failure Code</b> : 0x1B, 0x6, 0x7 ...'
      ],
      forensicValue: "<b>Kerberoasting</b> : pic de 4769 avec encryption type 0x17 (RC4) sur des SPN inhabituels = compte de service ciblé pour cracking offline."
    },
    {
      channel: 'Security', eventId: '4776', name: 'Validation NTLM', category: 'Authentification',
      severity: 'Info', versions: ['Vista+'],
      audit: 'Audit Credential Validation',
      description: "Tentative de validation NTLM (succès ou échec). Sur DC pour comptes de domaine, sur poste pour comptes locaux.",
      fields: ['<b>Logon Account</b>', '<b>Source Workstation</b>', '<b>Error Code</b> (0x0=success, 0xC0000064/06A...)'],
      forensicValue: "Détection de pass-the-hash, brute force NTLM, énumération.",
      falsePositives: "NTLM est encore très utilisé en pratique — bruyant. Pivot par <i>Source Workstation</i> inhabituelle."
    },

    // ── SECURITY (Compte / Groupe) ───────────────────────
    {
      channel: 'Security', eventId: '4720', name: "Compte utilisateur créé", category: 'Compte',
      severity: 'Haute', versions: ['Vista+'],
      audit: 'Audit User Account Management',
      description: "Création d'un compte. Sur DC pour comptes de domaine. Toujours suspect en dehors d'une fenêtre IT planifiée.",
      forensicValue: "Persistance ATT&CK T1136. Corréler avec 4724 (mot de passe défini), 4732 (ajout au groupe).",
      related: [{ href: 'mitre.html?q=T1136', label: 'MITRE T1136 Create Account' }]
    },
    {
      channel: 'Security', eventId: '4724', name: "Reset de mot de passe", category: 'Compte',
      severity: 'Haute', versions: ['Vista+'],
      audit: 'Audit User Account Management',
      description: "Tentative de reset du mot de passe d'un autre utilisateur (admin reset, pas changement par l'utilisateur lui-même = 4723).",
      forensicValue: "Reset suspect = vol de compte ou backdoor. Comparer Subject (qui reset) et Target (compte affecté)."
    },
    {
      channel: 'Security', eventId: '4732', name: "Membre ajouté à groupe local", category: 'Privilèges',
      severity: 'Haute', versions: ['Vista+'],
      audit: 'Audit Security Group Management',
      description: "Compte ajouté à un groupe local — surveiller particulièrement Administrators, Remote Desktop Users, Backup Operators.",
      forensicValue: "Persistance / élévation. Le SID cible identifie le groupe."
    },
    {
      channel: 'Security', eventId: '4728', name: "Membre ajouté à groupe global de sécurité", category: 'Privilèges',
      severity: 'Haute', versions: ['Vista+ (DC)'],
      audit: 'Audit Security Group Management',
      description: "Ajout à un groupe global (Domain Admins, Enterprise Admins...). Toujours critique.",
      forensicValue: "Si Subject = compte standard → mouvement latéral / privesc."
    },

    // ── SECURITY (Process / Logs) ────────────────────────
    {
      channel: 'Security', eventId: '4688', name: "Création de processus", category: 'Process',
      severity: 'Info', versions: ['7+', 'Server 2008 R2+'],
      audit: 'Audit Process Creation (avec CommandLine via GPO)',
      description: "Lancement d'un processus. Avec la GPO 'Include command line in process creation events' activée, contient la ligne de commande complète.",
      fields: [
        '<b>New Process Name</b> : binaire',
        '<b>Process Command Line</b> : ligne complète (si GPO activée)',
        '<b>Creator Process Name</b> : process parent',
        '<b>Token Elevation Type</b> : %1936=full token, %1937=elevated token, %1938=limited'
      ],
      forensicValue: "Backbone de la chasse. Indispensable pour LOLBINs, scripts, élévations. Si pas de CommandLine, fallback sur Sysmon EID 1.",
      notes: "Sysmon Event ID 1 fait la même chose en plus riche (hash, parent GUID, ImageLoaded). Préférer Sysmon si dispo."
    },
    {
      channel: 'Security', eventId: '1102', name: "Audit log effacé", category: 'Anti-forensique',
      severity: 'Critique', versions: ['Vista+'],
      audit: 'Toujours généré',
      description: "Le journal d'audit Security a été effacé. Cet événement reste dans le nouveau log.",
      forensicValue: "Indicateur ATT&CK T1070.001 (Indicator Removal: Clear Windows Event Logs). Toujours suspect en dehors d'une rotation planifiée.",
      related: [{ href: 'mitre.html?q=T1070.001', label: 'MITRE T1070.001' }]
    },
    {
      channel: 'Security', eventId: '5140', name: "Partage réseau accédé", category: 'Network',
      severity: 'Info', versions: ['Vista+'],
      audit: 'Audit File Share',
      description: "Accès à un partage SMB. Le path est le partage (ex: \\\\server\\C$).",
      forensicValue: "Détection accès admin shares (C$, ADMIN$) = mouvement latéral classique."
    },
    {
      channel: 'Security', eventId: '4697', name: "Service installé", category: 'Persistance',
      severity: 'Haute', versions: ['Vista+'],
      audit: 'Audit Security System Extension',
      description: "Un service Windows a été installé. ATT&CK T1543.003.",
      fields: ['<b>Service Name</b>', '<b>Service File Name</b>', '<b>Service Type</b>', '<b>Service Start Type</b>'],
      forensicValue: "PsExec, ransomware, persistance malware passent souvent par un service. Comparer avec System EID 7045.",
      related: [{ href: 'mitre.html?q=T1543.003', label: 'MITRE T1543.003' }]
    },
    {
      channel: 'Security', eventId: '4798', name: "Énumération des groupes locaux", category: 'Discovery',
      severity: 'Basse', versions: ['10+', 'Server 2016+'],
      audit: 'Audit User Account Management',
      description: "Le SAM local a été énuméré (qui est admin local, etc.).",
      forensicValue: "Discovery T1087. Bruyant (logon scripts, MMC) mais pic anormal = recon."
    },
    {
      channel: 'Security', eventId: '4799', name: "Énumération de groupes de sécurité", category: 'Discovery',
      severity: 'Basse', versions: ['10+', 'Server 2016+'],
      audit: 'Audit Security Group Management',
      description: "Énumération des membres d'un groupe de sécurité local.",
      forensicValue: "Recon attaquant. Volumineux mais utile en correlation."
    },

    // ── SYSTEM ────────────────────────────────────────────
    {
      channel: 'System', eventId: '7045', name: "Service installé (System)", category: 'Persistance',
      severity: 'Haute', versions: ['7+', 'Server 2008 R2+'],
      description: "Installation d'un nouveau service. Le pendant de Security 4697 mais loggé sans audit policy spécifique.",
      fields: ['<b>Service Name</b>', '<b>Image Path</b>', '<b>Service Type</b>', '<b>Start Type</b>'],
      forensicValue: "Toujours regarder Image Path pour repérer des binaires en %TEMP%, scripts PowerShell encodés, paths inhabituels. Classique pour PsExec (psexesvc.exe).",
      notes: "Le journal System n'a pas besoin d'audit policy — toujours présent."
    },
    {
      channel: 'System', eventId: '7036', name: "Service état changé", category: 'Service',
      severity: 'Info', versions: ['XP+'],
      description: "Un service a été démarré ou arrêté.",
      forensicValue: "Très bruyant mais permet de corréler les arrêts (Defender stoppé !) avec actions attaquant.",
      falsePositives: "Énormément. Filtrer sur services ciblés (security tools)."
    },
    {
      channel: 'System', eventId: '7034', name: "Service crashed", category: 'Service',
      severity: 'Moyenne', versions: ['XP+'],
      description: "Un service s'est arrêté de manière inattendue.",
      forensicValue: "Crash de Defender, sysmon, EDR = signe d'attaque ciblée."
    },
    {
      channel: 'System', eventId: '6005', name: "Event Log démarré", category: 'Système',
      severity: 'Info', versions: ['XP+'],
      description: "Le service Event Log a démarré — équivalent au boot. Marqueur fiable d'allumage.",
      forensicValue: "Reconstruction de la timeline d'allumage / extinction. Couplé avec 6006 (arrêt propre) et 6008 (arrêt brutal).",
      notes: "<b>6005</b>=boot, <b>6006</b>=arrêt propre (shutdown -s), <b>6008</b>=arrêt brutal (crash, kill, panne), <b>6013</b>=uptime quotidien (XP/2003)."
    },
    {
      channel: 'System', eventId: '6008', name: "Arrêt brutal du système", category: 'Système',
      severity: 'Moyenne', versions: ['XP+'],
      description: "Le système s'est arrêté de manière non planifiée (crash, panne courant, kill power).",
      forensicValue: "Lié à anti-forensique : éteindre brutalement pour éviter écriture sur disque, ou symptôme de panne / instabilité."
    },
    {
      channel: 'System', eventId: '1074', name: "Reboot/Shutdown initié", category: 'Système',
      severity: 'Info', versions: ['XP+'],
      description: "Un utilisateur ou processus a initié un shutdown/reboot.",
      fields: ['<b>User</b>', '<b>Process</b> (qui a appelé InitiateSystemShutdown)', '<b>Reason</b>', '<b>Comment</b>'],
      forensicValue: "Identifier qui a éteint la machine et avec quel binaire."
    },

    // ── SYSMON ────────────────────────────────────────────
    {
      channel: 'Sysmon', eventId: '1', name: "Création de processus (Sysmon)", category: 'Process',
      severity: 'Info', versions: ['Sysmon 1+'],
      description: "Création de processus avec contexte enrichi : hash du binaire, ligne de commande, parent, GUID.",
      fields: [
        '<b>Image</b>, <b>CommandLine</b>, <b>CurrentDirectory</b>',
        '<b>Hashes</b> (MD5/SHA1/SHA256/IMPHASH)',
        '<b>ParentImage</b>, <b>ParentCommandLine</b>, <b>ParentProcessGuid</b>',
        '<b>User</b>, <b>LogonId</b>, <b>IntegrityLevel</b>'
      ],
      forensicValue: "Bien plus riche que Security 4688. Le ParentProcessGuid permet de chaîner toute la lignée d'un processus.",
      notes: "Nécessite Sysmon installé avec une config (SwiftOnSecurity, Olaf Hartong). Sans config = bruit."
    },
    {
      channel: 'Sysmon', eventId: '3', name: "Connexion réseau", category: 'Network',
      severity: 'Info', versions: ['Sysmon 1+'],
      description: "Un processus a établi une connexion réseau (TCP/UDP).",
      fields: ['<b>Image</b>', '<b>SourceIp</b>:<b>SourcePort</b>', '<b>DestinationIp</b>:<b>DestinationPort</b>', '<b>DestinationHostname</b>'],
      forensicValue: "Détection C2, exfiltration. Filtrer sur process inhabituels (notepad.exe → 8080, etc.).",
      falsePositives: "Très volumineux. Utiliser une config Sysmon qui filtre les process légitimes."
    },
    {
      channel: 'Sysmon', eventId: '7', name: "DLL chargée", category: 'Process',
      severity: 'Info', versions: ['Sysmon 1+'],
      description: "Un processus a chargé une DLL (Image Loaded).",
      forensicValue: "Détection DLL hijacking, sideloading. Très volumineux — n'activer que sur process critiques.",
      notes: "Désactivé par défaut dans la plupart des configs Sysmon (trop bruyant)."
    },
    {
      channel: 'Sysmon', eventId: '8', name: "CreateRemoteThread", category: 'Process',
      severity: 'Haute', versions: ['Sysmon 1+'],
      description: "Un processus a créé un thread dans un autre processus — technique d'injection de code.",
      forensicValue: "Indicateur fort d'injection (T1055). À corréler avec EID 10 (ProcessAccess)."
    },
    {
      channel: 'Sysmon', eventId: '10', name: "Process accédé (handle)", category: 'Process',
      severity: 'Moyenne', versions: ['Sysmon 1+'],
      description: "Un processus a ouvert un handle vers un autre processus avec des droits étendus.",
      forensicValue: "Détection LSASS dump (mimikatz, procdump lsass.exe, comsvcs.dll MiniDump). GrantedAccess 0x1010 = lecture mémoire LSASS.",
      related: [{ href: 'mitre.html?q=T1003.001', label: 'MITRE T1003.001 LSASS Memory' }]
    },
    {
      channel: 'Sysmon', eventId: '11', name: "Création de fichier", category: 'File',
      severity: 'Info', versions: ['Sysmon 1+'],
      description: "Création ou modification d'un fichier.",
      forensicValue: "Détection de drop de payload, fichiers temporaires d'attaquant. Filtrer sur extensions sensibles (.ps1, .exe, .dll dans %TEMP%, %APPDATA%)."
    },
    {
      channel: 'Sysmon', eventId: '13', name: "Modification de registre", category: 'Persistance',
      severity: 'Info', versions: ['Sysmon 1+'],
      description: "Modification d'une valeur de registre (Set ou Delete).",
      forensicValue: "Détection persistance (Run keys, Services, AppInit_DLLs). Très efficace en chasse."
    },
    {
      channel: 'Sysmon', eventId: '22', name: "DNS query", category: 'Network',
      severity: 'Info', versions: ['Sysmon 10+'],
      description: "Un processus a fait une requête DNS.",
      forensicValue: "Détection C2 (DGA, DoH), exfiltration DNS, beaconing. Très puissant."
    },

    // ── POWERSHELL ────────────────────────────────────────
    {
      channel: 'PowerShell', eventId: '4104', name: "ScriptBlock exécuté", category: 'Script',
      severity: 'Moyenne', versions: ['5.0+'],
      description: "Le contenu d'un bloc de script PowerShell exécuté est loggé (si Script Block Logging activé).",
      fields: ['<b>ScriptBlockText</b> : code complet exécuté', '<b>ScriptBlockId</b>'],
      forensicValue: "Une des sources les plus précieuses : on voit le script <i>déobfusqué</i>. Détecte les <code>Invoke-Expression</code>, encodés base64, downloads PowerShell, mimikatz embarqué.",
      notes: "Activer via GPO : 'Turn on PowerShell Script Block Logging'. Le warning EID 4104 capture les scripts <i>suspects</i> automatiquement même sans logging complet."
    },
    {
      channel: 'PowerShell', eventId: '4103', name: "Exécution module", category: 'Script',
      severity: 'Info', versions: ['5.0+'],
      description: "Pipeline d'exécution PowerShell — chaque commande exécutée.",
      forensicValue: "Vue ligne par ligne du pipeline. Plus bruyant que 4104 mais granulaire."
    },
    {
      channel: 'PowerShell', eventId: '400', name: "Engine state changed", category: 'Script',
      severity: 'Info', versions: ['2.0+'],
      description: "Démarrage du moteur PowerShell (Available state).",
      forensicValue: "Marqueur de session PS — utile pour borner les analyses sur des Windows 7/8 (où 4104 n'existe pas).",
      notes: "Même utilité sur les anciens systèmes que 4104 sur les nouveaux."
    },
    {
      channel: 'PowerShell', eventId: '600', name: "Provider lifecycle", category: 'Script',
      severity: 'Info', versions: ['2.0+'],
      description: "Démarrage/arrêt d'un provider PowerShell.",
      forensicValue: "Faible valeur — ignorer sauf en correlation."
    },

    // ── DEFENDER ──────────────────────────────────────────
    {
      channel: 'Defender', eventId: '1116', name: "Defender : malware détecté", category: 'Malware',
      severity: 'Critique', versions: ['8.1+', 'Server 2016+'],
      description: "Microsoft Defender a détecté une menace.",
      fields: ['<b>Threat Name</b>', '<b>Severity</b>', '<b>Path</b>', '<b>Action</b>'],
      forensicValue: "Indicateur direct. Path = où était le fichier."
    },
    {
      channel: 'Defender', eventId: '5001', name: "Defender : protection temps réel désactivée", category: 'Anti-forensique',
      severity: 'Critique', versions: ['8.1+'],
      description: "La protection en temps réel a été désactivée.",
      forensicValue: "Toujours suspect. Action attaquant pour exécuter payload."
    },
    {
      channel: 'Defender', eventId: '5007', name: "Defender : config modifiée", category: 'Anti-forensique',
      severity: 'Haute', versions: ['8.1+'],
      description: "La configuration de Defender a changé (exclusions, scans).",
      forensicValue: "Ajout d'exclusions est la marque d'un attaquant sérieux."
    },

    // ── TASK SCHEDULER ────────────────────────────────────
    {
      channel: 'TaskScheduler', eventId: '106', name: "Tâche planifiée créée", category: 'Persistance',
      severity: 'Haute', versions: ['Vista+'],
      description: "Une nouvelle tâche planifiée a été enregistrée. Channel : Microsoft-Windows-TaskScheduler/Operational",
      forensicValue: "Persistance T1053.005. Toujours regarder le user qui a créé et le binaire ciblé.",
      related: [{ href: 'mitre.html?q=T1053.005', label: 'MITRE T1053.005' }]
    },
    {
      channel: 'TaskScheduler', eventId: '200', name: "Action de tâche démarrée", category: 'Persistance',
      severity: 'Info', versions: ['Vista+'],
      description: "Une action d'une tâche a été démarrée (binaire/script lancé).",
      forensicValue: "Trace l'exécution réelle d'une tâche planifiée."
    },

    // ── TERMINAL SERVICES (RDP) ───────────────────────────
    {
      channel: 'TerminalServices', eventId: '21', name: "RDP : session logon", category: 'RDP',
      severity: 'Moyenne', versions: ['Vista+'],
      description: "Channel : Microsoft-Windows-TerminalServices-LocalSessionManager/Operational. Logon RDP réussi.",
      fields: ['<b>User</b>', '<b>Session ID</b>', '<b>Source Network Address</b>'],
      forensicValue: "Source plus claire que Security 4624 type 10 pour analyser RDP. Couvre RDP même si audit policy off."
    },
    {
      channel: 'TerminalServices', eventId: '24', name: "RDP : session disconnected", category: 'RDP',
      severity: 'Info', versions: ['Vista+'],
      description: "Déconnexion RDP (la session reste, peut être reconnectée).",
      forensicValue: "Distinguer disconnect (24) vs logoff (23). Sessions qui restent ouvertes = persistance."
    },
    {
      channel: 'TerminalServices', eventId: '1149', name: "RDP : authentification réussie", category: 'RDP',
      severity: 'Info', versions: ['7+'],
      description: "Channel : Microsoft-Windows-TerminalServices-RemoteConnectionManager/Operational. Authentification RDP réussie au niveau réseau.",
      forensicValue: "<b>Loggé MÊME si Security audit log a été effacé</b>. Source IP toujours présente. Crucial pour RDP brute force.",
      notes: "Souvent le seul reste après cleanup attaquant."
    }

  ]
};
