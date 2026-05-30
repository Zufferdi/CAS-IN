// ═══════════════════════════════════════════════════════════════════
// tp-engine-cli.js — CAS-IN TP delta v133 (MVP TP CLI)
// 5 catégories de TP ligne de commande, multi-OS (Linux + Windows + PowerShell)
//
// Niveaux : easy (5 XP) → medium (15 XP) → hard (30 XP)
// Catégories :
//   cli_basics  — bases (ls/dir, cat/type, cd) · easy · QCM
//   cli_logs    — analyse logs (grep, head, tail) · medium · mix QCM+freestyle
//   cli_pipes   — pipes & filtres (awk, sort, uniq, find) · hard · freestyle
//   cli_extract — artefacts (sha256, base64, xxd) · hard · freestyle
//   cli_ps      — PowerShell forensique (Get-FileHash, Get-WinEvent) · hard · freestyle
//
// MVP : 15 exercices (3 par catégorie). Extension prévue v134 → 60-100 ex.
//
// Validation freestyle : regex souple (accepte les variantes équivalentes).
// Normalisation : casse ignorée + espaces multiples collapsés.
//
// Chargé APRÈS tp-engine.js (utilise STATE, incSolved, showTPHint, helpers)
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // POOL D'EXERCICES (MVP : 3 par catégorie)
  // ────────────────────────────────────────────────────────────────

  const EXERCISES = {
    // ═══ CLI BASICS — easy · QCM ════════════════════════════════
    cli_basics: [
      {
        id: 'cli_basics_01',
        icon: '🐧',
        title: 'Lister les fichiers — Linux',
        format: 'qcm',
        scenario: `Tu viens d'ouvrir un terminal Linux. Tu dois afficher le contenu du dossier courant pour identifier les fichiers de logs présents.<br><br><span class="dim">Quelle commande utilises-tu ?</span>`,
        choices: [
          { text: 'ls', correct: true, explain: '<code>ls</code> (list) est la commande UNIX historique. Variantes utiles : <code>ls -l</code> (détails), <code>ls -lah</code> (détails + cachés + tailles humaines).' },
          { text: 'dir', correct: false, explain: '<code>dir</code> existe sous Linux (alias de <code>ls -C -b</code>) mais c\'est la convention Windows cmd. Pas l\'usage natif Linux.' },
          { text: 'show', correct: false, explain: 'N\'existe pas comme commande standard. Penser à <code>ls</code>.' },
          { text: 'list', correct: false, explain: 'N\'existe pas comme commande standard. Penser à <code>ls</code>.' }
        ]
      },
      {
        id: 'cli_basics_02',
        icon: '🪟',
        title: 'Lister les fichiers — Windows cmd',
        format: 'qcm',
        scenario: `Tu es sur une machine Windows en investigation, dans une invite cmd.exe. Tu veux lister les fichiers du dossier courant <code>C:\\Users\\suspect\\Downloads</code>.<br><br><span class="dim">Quelle commande utilises-tu ?</span>`,
        choices: [
          { text: 'dir', correct: true, explain: '<code>dir</code> est la commande native Windows. Variantes : <code>dir /s</code> (récursif), <code>dir /od</code> (tri par date), <code>dir /a:h</code> (cachés).' },
          { text: 'ls', correct: false, explain: '<code>ls</code> est Linux. Sur Windows, ça marche dans WSL/Git Bash/PowerShell (alias) mais pas en cmd natif.' },
          { text: 'list', correct: false, explain: 'N\'existe pas en cmd natif.' },
          { text: 'show /files', correct: false, explain: 'Syntaxe invalide.' }
        ]
      },
      {
        id: 'cli_basics_03',
        icon: '📄',
        title: 'Lire un fichier — Linux vs Windows',
        format: 'qcm',
        scenario: `Tu veux afficher rapidement le contenu de <code>/etc/passwd</code> (Linux) OU <code>C:\\Windows\\System32\\drivers\\etc\\hosts</code> (Windows cmd).<br><br><span class="dim">Quelle paire de commandes est correcte ?</span>`,
        choices: [
          { text: 'Linux : <code>cat /etc/passwd</code> · Windows : <code>type C:\\...\\hosts</code>', correct: true, explain: '<code>cat</code> (concatenate) sur Linux, <code>type</code> sur Windows cmd. PowerShell équivalent : <code>Get-Content</code> (alias <code>gc</code>, <code>cat</code>, <code>type</code>).' },
          { text: 'Linux : <code>read /etc/passwd</code> · Windows : <code>open hosts</code>', correct: false, explain: '<code>read</code> en bash sert à lire l\'entrée standard. <code>open</code> n\'existe pas en cmd.' },
          { text: 'Linux : <code>show /etc/passwd</code> · Windows : <code>display hosts</code>', correct: false, explain: 'Ni <code>show</code> ni <code>display</code> ne sont des commandes standards.' },
          { text: 'Linux : <code>print /etc/passwd</code> · Windows : <code>echo hosts</code>', correct: false, explain: '<code>print</code> envoie à l\'imprimante. <code>echo hosts</code> affiche juste le mot "hosts".' }
        ]
      }
    ],

    // ═══ CLI LOGS — medium · mix QCM + freestyle ════════════════
    cli_logs: [
      {
        id: 'cli_logs_01',
        icon: '🔢',
        title: 'Compter les tentatives échouées',
        format: 'freestyle',
        scenario: `Tu analyses <code>auth.log</code> d'un serveur Linux. Compte le <strong>nombre total</strong> de lignes contenant exactement la chaîne <code>"Failed password"</code>.<br><br><pre class="cli-snippet">May 30 14:23:01 srv sshd[12451]: Failed password for root from 203.0.113.7 port 41234
May 30 14:23:04 srv sshd[12451]: Failed password for root from 203.0.113.7 port 41235
May 30 14:23:07 srv sshd[12451]: Failed password for admin from 192.168.1.42 port 51234
May 30 14:23:09 srv sshd[12451]: Accepted password for backup from 10.0.0.5 port 22001
...
<span class="dim">[50 000 lignes au total]</span></pre>`,
        placeholder: '$ ',
        patterns: [
          /^grep\s+-c\s+["']?Failed password["']?\s+auth\.log\s*$/i,
          /^grep\s+["']?Failed password["']?\s+auth\.log\s*\|\s*wc\s+-l\s*$/i,
          /^grep\s+-c\s+["']?Failed password["']?\s+\.?\/?auth\.log\s*$/i
        ],
        hints: [
          'Tu veux <em>compter</em> les lignes qui matchent un motif. <code>grep</code> a une option pour ça.',
          'Soit <code>grep -c</code> (count direct), soit <code>grep ... | wc -l</code> (pipe vers word count).',
          '<code>grep -c "Failed password" auth.log</code> ou <code>grep "Failed password" auth.log | wc -l</code>'
        ],
        explain: '<code>grep -c</code> compte directement les lignes qui matchent. La variante avec <code>| wc -l</code> est plus modulaire (utile si tu veux ajouter d\'autres filtres dans le pipeline).'
      },
      {
        id: 'cli_logs_02',
        icon: '⏪',
        title: 'Premières et dernières lignes',
        format: 'qcm',
        scenario: `Tu reçois un <code>syslog</code> volumineux. Tu veux voir les <strong>20 premières lignes</strong> pour identifier le début de l'incident.<br><br><span class="dim">Quelle commande utilises-tu ?</span>`,
        choices: [
          { text: '<code>head -20 syslog</code>', correct: true, explain: '<code>head</code> affiche le début. <code>head -20</code> ou <code>head -n 20</code> = 20 premières lignes. Pour les <strong>20 dernières</strong> : <code>tail -20 syslog</code>. Pour suivre en temps réel : <code>tail -f syslog</code>.' },
          { text: '<code>top 20 syslog</code>', correct: false, explain: '<code>top</code> est un moniteur de processus système, pas un afficheur de fichier.' },
          { text: '<code>first 20 syslog</code>', correct: false, explain: 'N\'existe pas.' },
          { text: '<code>cat -20 syslog</code>', correct: false, explain: '<code>cat</code> n\'accepte pas <code>-20</code>. Cette commande déclenchera une erreur.' }
        ]
      },
      {
        id: 'cli_logs_03',
        icon: '🔍',
        title: 'Filtrer insensible à la casse',
        format: 'freestyle',
        scenario: `Tu analyses <code>application.log</code> et tu veux toutes les lignes contenant <code>ERROR</code>, <code>Error</code>, <code>error</code>… <strong>insensible à la casse</strong>.<br><br><pre class="cli-snippet">2026-05-30 14:23:01 [INFO] Application started
2026-05-30 14:23:15 [ERROR] Database connection lost
2026-05-30 14:24:02 [error] Retry attempt 1 failed
2026-05-30 14:24:08 [Error] Final retry failed, aborting
...</pre>`,
        placeholder: '$ ',
        patterns: [
          /^grep\s+-i\s+["']?ERROR["']?\s+application\.log\s*$/i,
          /^grep\s+["']?ERROR["']?\s+-i\s+application\.log\s*$/i,
          /^grep\s+-i\s+["']?error["']?\s+application\.log\s*$/i,
          /^grep\s+["']?error["']?\s+-i\s+application\.log\s*$/i
        ],
        hints: [
          'L\'option courte de grep pour ignorer la casse commence par <code>-i</code>.',
          'Forme générale : <code>grep -i MOTIF FICHIER</code>.',
          '<code>grep -i "ERROR" application.log</code>'
        ],
        explain: '<code>-i</code> (ou <code>--ignore-case</code>) rend <code>grep</code> insensible à la casse. Très utile sur les logs où le niveau de sévérité peut être écrit différemment selon les composants.'
      }
    ],

    // ═══ CLI PIPES — hard · freestyle Linux ═════════════════════
    cli_pipes: [
      {
        id: 'cli_pipes_01',
        icon: '🥇',
        title: 'Top 5 IPs · auth.log',
        format: 'freestyle',
        scenario: `Tu enquêtes sur une attaque par force brute SSH. Liste les <strong>5 adresses IP</strong> ayant le plus de tentatives <code>Failed password</code> dans <code>auth.log</code>, avec leur compteur de tentatives.<br><br><pre class="cli-snippet">May 30 14:23:01 srv sshd[12451]: Failed password for root from 203.0.113.7 port 41234
May 30 14:23:04 srv sshd[12451]: Failed password for root from 203.0.113.7 port 41235
May 30 14:23:07 srv sshd[12451]: Failed password for admin from 192.168.1.42 port 51234
May 30 14:23:11 srv sshd[12451]: Failed password for ubuntu from 203.0.113.7 port 41244
...
<span class="dim">[50 000 lignes — IP en 11ᵉ champ]</span></pre>`,
        placeholder: '$ ',
        patterns: [
          /^grep\s+["']?Failed password["']?\s+auth\.log\s*\|\s*awk\s+["']?\{?print\s*\$11\}?["']?\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-(rn|nr)\s*\|\s*head\s+-n?\s*5\s*$/i,
          /^grep\s+["']?Failed["']?\s+auth\.log\s*\|\s*grep\s+-oE?\s+["'][^"']*\\d.+["']\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-(rn|nr)\s*\|\s*head\s+-n?\s*5\s*$/i,
          /^awk\s+["']?\/Failed password\/.+\$11.+["']?\s+auth\.log\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-(rn|nr)\s*\|\s*head\s+-n?\s*5\s*$/i
        ],
        hints: [
          'Pipeline : filtrer les "Failed password" → extraire la colonne IP (champ 11) → trier → dédupliquer en comptant → re-trier par compteur décroissant → garder le top 5.',
          'Outils : <code>grep</code> · <code>awk</code> (champ 11) · <code>sort</code> · <code>uniq -c</code> · <code>sort -rn</code> · <code>head -5</code>',
          '<code>grep "Failed password" auth.log | awk \'{print $11}\' | sort | uniq -c | sort -rn | head -5</code>'
        ],
        explain: 'Pattern <em>classique</em> d\'analyse de logs sécurité : <strong>filter → extract → sort → uniq -c → sort -rn → head</strong>. <code>uniq -c</code> exige que l\'entrée soit triée (d\'où le <code>sort</code> avant). <code>sort -rn</code> trie en numérique inverse.'
      },
      {
        id: 'cli_pipes_02',
        icon: '🕐',
        title: 'Fichiers .exe modifiés < 24h',
        format: 'freestyle',
        scenario: `Sur un serveur Linux compromis, identifie tous les fichiers <code>.exe</code> (téléchargés sous /tmp) qui ont été <strong>modifiés dans les dernières 24 heures</strong>.<br><br><span class="dim">Hint : <code>find</code> avec ses options de temps.</span>`,
        placeholder: '$ ',
        patterns: [
          /^find\s+\/?tmp\/?\s+-(i?name)\s+["']?\*\.exe["']?\s+-mtime\s+-1\s*$/i,
          /^find\s+\/?tmp\/?\s+-mtime\s+-1\s+-(i?name)\s+["']?\*\.exe["']?\s*$/i,
          /^find\s+\/?tmp\/?\s+-type\s+f\s+-(i?name)\s+["']?\*\.exe["']?\s+-mtime\s+-1\s*$/i
        ],
        hints: [
          'Commande de référence : <code>find</code>. Options à combiner : recherche par nom + filtre temporel.',
          '<code>-name "*.exe"</code> pour le pattern, <code>-mtime -1</code> pour modifié dans les dernières 24h (le <code>-</code> avant le 1 signifie "moins de").',
          '<code>find /tmp -name "*.exe" -mtime -1</code>'
        ],
        explain: '<code>find</code> avec <code>-mtime -1</code> = fichiers modifiés il y a moins de 1 jour (24h). <code>-mtime +7</code> = plus de 7 jours. Pour les <strong>dernières N minutes</strong> : <code>-mmin -N</code>. Pour le ctime (changement d\'inode) : <code>-ctime</code>.'
      },
      {
        id: 'cli_pipes_03',
        icon: '🔢',
        title: 'Emails uniques dans un CSV',
        format: 'freestyle',
        scenario: `Tu as <code>export.csv</code> séparé par virgules. La <strong>3ᵉ colonne est l'email</strong>. Combien y a-t-il d'adresses email <strong>uniques</strong> dans le fichier ?<br><br><pre class="cli-snippet">id,name,email,phone
1,Alice,alice@example.com,+41761234567
2,Bob,bob@example.com,+41769876543
3,Alice,alice@example.com,+41761234567
4,Carla,carla@example.org,+33612345678
...</pre>`,
        placeholder: '$ ',
        patterns: [
          /^cut\s+-d["']?,["']?\s+-f\s*3\s+export\.csv\s*\|\s*sort\s+-u\s*\|\s*wc\s+-l\s*$/i,
          /^cut\s+-d["']?,["']?\s+-f\s*3\s+export\.csv\s*\|\s*sort\s*\|\s*uniq\s*\|\s*wc\s+-l\s*$/i,
          /^awk\s+-F["']?,["']?\s+["']?\{?print\s*\$3\}?["']?\s+export\.csv\s*\|\s*sort\s+-u\s*\|\s*wc\s+-l\s*$/i,
          /^awk\s+-F["']?,["']?\s+["']?\{?print\s*\$3\}?["']?\s+export\.csv\s*\|\s*sort\s*\|\s*uniq\s*\|\s*wc\s+-l\s*$/i
        ],
        hints: [
          'Étape 1 : extraire la 3ᵉ colonne (séparateur virgule). Étape 2 : dédupliquer. Étape 3 : compter.',
          'Outils : <code>cut -d, -f3</code> ou <code>awk -F, \'{print $3}\'</code> · <code>sort -u</code> · <code>wc -l</code>',
          '<code>cut -d\',\' -f3 export.csv | sort -u | wc -l</code>'
        ],
        explain: '<code>sort -u</code> = trier + dédupliquer en un seul appel. Équivalent à <code>sort | uniq</code>. Attention : l\'en-tête CSV (1ʳᵉ ligne) est inclus si tu ne le filtres pas. Pour exclure : ajouter <code>| tail -n +2</code> au début ou utiliser <code>awk \'NR>1 {print $3}\'</code>.'
      }
    ],

    // ═══ CLI EXTRACT — hard · freestyle artefacts ═══════════════
    cli_extract: [
      {
        id: 'cli_extract_01',
        icon: '🔐',
        title: 'SHA-256 d\'un fichier suspect',
        format: 'freestyle',
        scenario: `Tu as téléchargé un fichier suspect <code>suspect.bin</code>. Calcule son hash <strong>SHA-256</strong> pour le comparer aux IOCs publiés sur VirusTotal.`,
        placeholder: '$ ',
        patterns: [
          /^sha256sum\s+suspect\.bin\s*$/i,
          /^shasum\s+-a\s+256\s+suspect\.bin\s*$/i,
          /^openssl\s+(sha256|dgst\s+-sha256)\s+suspect\.bin\s*$/i,
          /^openssl\s+dgst\s+-sha256\s+suspect\.bin\s*$/i
        ],
        hints: [
          'Trois utilitaires possibles selon ta distribution Linux : <code>sha256sum</code> (Linux standard), <code>shasum -a 256</code> (BSD/macOS), <code>openssl</code>.',
          'Le plus court : <code>sha256sum FICHIER</code>',
          '<code>sha256sum suspect.bin</code> · <code>openssl sha256 suspect.bin</code> · <code>shasum -a 256 suspect.bin</code>'
        ],
        explain: 'Pour la <em>chaîne de custody</em> forensique (art. 192 CPP), le hash doit être calculé avant et après chaque manipulation, comparé, et documenté. SHA-256 est le standard actuel (MD5 et SHA-1 sont obsolètes pour usage cryptographique mais encore admis comme empreinte d\'intégrité).'
      },
      {
        id: 'cli_extract_02',
        icon: '🔡',
        title: 'Décoder du base64',
        format: 'freestyle',
        scenario: `Tu analyses un malware obfusqué. Une chaîne base64 a été extraite : <code>Q0FTLUlOIERGSVI=</code><br><br>Décode-la en clair depuis le terminal.`,
        placeholder: '$ ',
        patterns: [
          /^echo\s+["']?Q0FTLUlOIERGSVI=["']?\s*\|\s*base64\s+(-d|--decode|-D)\s*$/i,
          /^echo\s+-n?\s+["']?Q0FTLUlOIERGSVI=["']?\s*\|\s*base64\s+(-d|--decode|-D)\s*$/i,
          /^printf\s+["']?Q0FTLUlOIERGSVI=["']?\s*\|\s*base64\s+(-d|--decode|-D)\s*$/i
        ],
        hints: [
          'Tu dois <em>passer</em> la chaîne à la commande <code>base64</code> en mode décodage.',
          'Pattern : <code>echo "CHAINE" | base64 -d</code>',
          '<code>echo "Q0FTLUlOIERGSVI=" | base64 -d</code>'
        ],
        explain: '<code>base64 -d</code> (ou <code>--decode</code>) lit l\'entrée standard et la décode. Sur macOS, l\'option est <code>-D</code> (majuscule). Pour <strong>encoder</strong> : <code>echo "CAS-IN DFIR" | base64</code>. Pour décoder un base64 imbriqué (Cobalt Strike, etc.) : enchaîner les <code>| base64 -d</code>.'
      },
      {
        id: 'cli_extract_03',
        icon: '🔬',
        title: 'Hexdump d\'un payload',
        format: 'freestyle',
        scenario: `Tu veux inspecter les <strong>48 premiers octets</strong> de <code>payload.bin</code> en hexadécimal (avec offsets), pour identifier le magic byte du fichier.`,
        placeholder: '$ ',
        patterns: [
          /^xxd\s+-l\s+48\s+payload\.bin\s*$/i,
          /^xxd\s+payload\.bin\s*\|\s*head\s+-n?\s*3\s*$/i,
          /^hexdump\s+-C\s+-n\s+48\s+payload\.bin\s*$/i,
          /^hexdump\s+-C\s+payload\.bin\s*\|\s*head\s+-n?\s*3\s*$/i,
          /^od\s+-A\s*x\s+-t\s+x1z?\s+-N\s+48\s+payload\.bin\s*$/i
        ],
        hints: [
          'Trois utilitaires possibles : <code>xxd</code>, <code>hexdump -C</code>, <code>od</code>.',
          'Soit limiter directement à 48 octets (<code>-l 48</code> pour xxd, <code>-n 48</code> pour hexdump), soit piper vers <code>head -3</code> (3 lignes ≈ 48 octets en xxd).',
          '<code>xxd -l 48 payload.bin</code> · <code>hexdump -C -n 48 payload.bin</code> · <code>xxd payload.bin | head -3</code>'
        ],
        explain: '<code>xxd</code> affiche par défaut 16 octets/ligne (donc 48 octets = 3 lignes). Magic bytes les plus utiles : <code>4D 5A</code> = PE (Windows exe), <code>7F 45 4C 46</code> = ELF (Linux), <code>89 50 4E 47</code> = PNG, <code>FF D8 FF</code> = JPEG, <code>25 50 44 46</code> = PDF (<code>%PDF</code>).'
      }
    ],

    // ═══ CLI POWERSHELL — hard · freestyle Windows ══════════════
    cli_ps: [
      {
        id: 'cli_ps_01',
        icon: '🔐',
        title: 'Get-FileHash — SHA-256',
        format: 'freestyle',
        scenario: `Sur un poste Windows en investigation, tu veux calculer le <strong>hash SHA-256</strong> de <code>C:\\IR\\suspect.exe</code> via PowerShell pour le comparer aux IOCs MISP.`,
        placeholder: 'PS> ',
        patterns: [
          /^Get-FileHash\s+(-Path\s+)?["']?C:\\IR\\suspect\.exe["']?\s+(-Algorithm\s+)?SHA256\s*$/i,
          /^Get-FileHash\s+(-Algorithm\s+)?SHA256\s+(-Path\s+)?["']?C:\\IR\\suspect\.exe["']?\s*$/i,
          /^Get-FileHash\s+(-Path\s+)?["']?C:\\IR\\suspect\.exe["']?\s*$/i
        ],
        hints: [
          'Cmdlet PowerShell : <code>Get-FileHash</code>. Par défaut elle utilise SHA-256 (donc <code>-Algorithm</code> est optionnel ici).',
          'Forme : <code>Get-FileHash -Path "CHEMIN" -Algorithm SHA256</code> ou la version courte <code>Get-FileHash "CHEMIN"</code>.',
          '<code>Get-FileHash "C:\\IR\\suspect.exe" -Algorithm SHA256</code>'
        ],
        explain: '<code>Get-FileHash</code> est l\'équivalent PowerShell de <code>sha256sum</code>. Algorithmes supportés : <strong>SHA1, SHA256, SHA384, SHA512, MD5</strong>. Pour comparer rapidement à une liste d\'IOCs : <code>(Get-FileHash file.exe).Hash -eq "ABC123..."</code>'
      },
      {
        id: 'cli_ps_02',
        icon: '📋',
        title: 'Get-WinEvent — derniers événements Security',
        format: 'freestyle',
        scenario: `Sur un poste Windows compromis, récupère les <strong>10 derniers événements</strong> du journal <code>Security</code> via PowerShell, pour traquer les Event ID 4625 (logon failed) ou 4688 (process created).`,
        placeholder: 'PS> ',
        patterns: [
          /^Get-WinEvent\s+-LogName\s+Security\s+-MaxEvents\s+10\s*$/i,
          /^Get-WinEvent\s+-MaxEvents\s+10\s+-LogName\s+Security\s*$/i,
          /^Get-WinEvent\s+(-LogName\s+)?["']?Security["']?\s+(-MaxEvents\s+)?10\s*$/i
        ],
        hints: [
          'Cmdlet : <code>Get-WinEvent</code>. Paramètres clés : <code>-LogName</code> (nom du log) et <code>-MaxEvents</code> (limite).',
          'Forme : <code>Get-WinEvent -LogName Security -MaxEvents 10</code>',
          '<code>Get-WinEvent -LogName Security -MaxEvents 10</code>'
        ],
        explain: 'Logs Windows clés : <strong>Security</strong> (authent, audit), <strong>System</strong> (services, drivers), <strong>Application</strong> (apps). Pour filtrer par Event ID : <code>Get-WinEvent -FilterHashtable @{LogName="Security"; ID=4625} -MaxEvents 50</code>. <code>Get-WinEvent</code> remplace l\'ancien <code>Get-EventLog</code> (encore présent mais déprécié).'
      },
      {
        id: 'cli_ps_03',
        icon: '🔎',
        title: 'Select-String — grep en PowerShell',
        format: 'freestyle',
        scenario: `Cherche le pattern <code>Failed</code> dans <strong>tous les fichiers <code>*.log</code></strong> du dossier <code>C:\\IR\\logs\\</code> via PowerShell.`,
        placeholder: 'PS> ',
        patterns: [
          /^Select-String\s+(-Pattern\s+)?["']?Failed["']?\s+(-Path\s+)?["']?C:\\IR\\logs\\\*\.log["']?\s*$/i,
          /^Select-String\s+(-Path\s+)?["']?C:\\IR\\logs\\\*\.log["']?\s+(-Pattern\s+)?["']?Failed["']?\s*$/i,
          /^Get-ChildItem\s+(-Path\s+)?["']?C:\\IR\\logs\\\*\.log["']?\s*\|\s*Select-String\s+(-Pattern\s+)?["']?Failed["']?\s*$/i,
          /^gci\s+(-Path\s+)?["']?C:\\IR\\logs\\\*\.log["']?\s*\|\s*Select-String\s+(-Pattern\s+)?["']?Failed["']?\s*$/i
        ],
        hints: [
          'Cmdlet équivalent à <code>grep</code> : <code>Select-String</code> (alias <code>sls</code>).',
          'Soit direct : <code>Select-String -Pattern PATTERN -Path "FICHIERS"</code>. Soit via pipeline avec <code>Get-ChildItem</code>.',
          '<code>Select-String -Pattern "Failed" -Path "C:\\IR\\logs\\*.log"</code>'
        ],
        explain: '<code>Select-String</code> est très puissant : supporte regex natif, <code>-Context</code> (lignes avant/après comme <code>grep -B/-A</code>), <code>-NotMatch</code> (inverse), <code>-CaseSensitive</code> (par défaut insensible, l\'inverse de grep !). Pour chercher dans une arborescence complète : <code>Get-ChildItem -Recurse "*.log" | Select-String "Failed"</code>.'
      }
    ]
  };


  // ────────────────────────────────────────────────────────────────
  // HELPERS de normalisation et de validation
  // ────────────────────────────────────────────────────────────────

  function normalizeCommand(s) {
    // Trim, collapse multiple spaces, retirer un éventuel prompt initial ($ ou PS>)
    return String(s || '')
      .replace(/^\s*(PS\s*>|\$\s|>)\s*/i, '')  // virer un éventuel prompt copié
      .replace(/\s+/g, ' ')
      .trim();
  }

  function matchesAnyPattern(userInput, patterns) {
    const norm = normalizeCommand(userInput);
    return patterns.some(re => re.test(norm));
  }


  // ────────────────────────────────────────────────────────────────
  // BUILDER : carte QCM (4 choix)
  // ────────────────────────────────────────────────────────────────

  function buildQCMCard(ex, cat) {
    const id = ex.id;
    const div = document.createElement('div');
    div.className = 'ex-card';
    const difficulty = (cat === 'cli_basics') ? 'easy' : 'medium';

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-${id}">${ex.icon || '🖥️'}</div>
        <div class="ex-title">${ex.title}</div>
        <span class="ex-badge ${difficulty}">${difficulty === 'easy' ? 'QCM' : 'QCM'}</span>
      </div>
      <div class="ex-scenario">${ex.scenario}</div>
      <div class="ex-choices" id="choices-${id}" style="display:flex;flex-direction:column;gap:.5rem;margin-top:.8rem"></div>
      <div class="ex-feedback" id="ex-feedback-${id}"></div>
      <div style="margin-top:.6rem;display:flex;gap:.4rem">
        <button class="btn-next" id="btn-next-${id}" type="button" style="display:none">Exercice suivant →</button>
      </div>
    `;

    const choicesContainer = div.querySelector(`#choices-${id}`);
    const fb = div.querySelector(`#ex-feedback-${id}`);
    const nextBtn = div.querySelector(`#btn-next-${id}`);

    // Shuffle choices
    const shuffled = ex.choices.map((c, i) => ({ ...c, idx: i })).sort(() => Math.random() - 0.5);

    shuffled.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'qcm-choice';
      btn.style.cssText = 'text-align:left;padding:.6rem .9rem;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:8px;cursor:pointer;font-size:.85rem;line-height:1.4';
      btn.innerHTML = `<span style="color:var(--dim);margin-right:.5rem">${String.fromCharCode(65 + i)}.</span>${choice.text}`;
      btn.onclick = () => {
        // Désactiver tous les boutons
        choicesContainer.querySelectorAll('button').forEach(b => b.disabled = true);
        btn.style.borderColor = choice.correct ? 'var(--green)' : 'var(--red)';
        btn.style.background = choice.correct ? 'rgba(48,232,138,.15)' : 'rgba(255,80,80,.15)';
        fb.className = 'ex-feedback ' + (choice.correct ? 'correct' : 'wrong');
        fb.innerHTML = (choice.correct ? '✓ Correct ! ' : '✗ Incorrect. ') + choice.explain;
        nextBtn.style.display = 'inline-block';
        if (choice.correct) {
          const card = btn.closest('.ex-card');
          if (card) card.className = 'ex-card solved';
          // XP
          if (typeof incSolved === 'function' && typeof STATE !== 'undefined') {
            if (!STATE.hintUsed) incSolved(cat);
          }
        }
      };
      choicesContainer.appendChild(btn);
    });

    nextBtn.onclick = () => {
      if (typeof newExercise === 'function') newExercise();
    };

    return div;
  }


  // ────────────────────────────────────────────────────────────────
  // BUILDER : carte FREESTYLE (input + validation regex souple)
  // ────────────────────────────────────────────────────────────────

  function buildFreestyleCard(ex, cat) {
    const id = ex.id;
    const div = document.createElement('div');
    div.className = 'ex-card';

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-${id}">${ex.icon || '🖥️'}</div>
        <div class="ex-title">${ex.title}</div>
        <span class="ex-badge hard">freestyle</span>
      </div>
      <div class="ex-scenario">${ex.scenario}</div>
      <div class="ex-input-row" style="flex-wrap:wrap;gap:8px;margin-top:.8rem;align-items:center">
        <span class="ex-input-label" style="font-family:var(--mono);color:var(--cyan);font-size:.9rem">${ex.placeholder || '$ '}</span>
        <input class="ex-input" id="inp-${id}" placeholder="ta commande..." autocomplete="off" spellcheck="false" style="flex:1;min-width:200px;font-family:var(--mono);font-size:.85rem">
        <button class="btn-hint" id="btn-hint1-${id}" type="button">💡 Méthode</button>
        <button class="btn-hint" id="btn-hint2-${id}" type="button" disabled style="opacity:.4">💡💡 Outils</button>
        <button class="btn-hint" id="btn-hint3-${id}" type="button" disabled style="opacity:.4">💡💡💡 Réponse</button>
        <button class="btn-validate" id="btn-validate-${id}" type="button">Valider ✓</button>
        <button class="btn-next" id="btn-next-${id}" type="button" style="display:none">Suivant →</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-${id}"></div>
    `;

    setTimeout(() => {
      const inp = div.querySelector(`#inp-${id}`);
      const fb = div.querySelector(`#ex-feedback-${id}`);
      const valBtn = div.querySelector(`#btn-validate-${id}`);
      const nextBtn = div.querySelector(`#btn-next-${id}`);
      const h1 = div.querySelector(`#btn-hint1-${id}`);
      const h2 = div.querySelector(`#btn-hint2-${id}`);
      const h3 = div.querySelector(`#btn-hint3-${id}`);

      // Hints progressifs
      let hintLevel = 0;
      h1.onclick = () => {
        if (typeof STATE !== 'undefined') STATE.hintUsed = true;
        hintLevel = Math.max(hintLevel, 1);
        fb.className = 'ex-feedback hint';
        fb.innerHTML = '💡 ' + ex.hints[0];
        h1.disabled = true; h1.style.opacity = '.4';
        h2.disabled = false; h2.style.opacity = '1';
      };
      h2.onclick = () => {
        if (typeof STATE !== 'undefined') STATE.hintUsed = true;
        hintLevel = Math.max(hintLevel, 2);
        fb.className = 'ex-feedback hint';
        fb.innerHTML = '💡💡 ' + ex.hints[1];
        h2.disabled = true; h2.style.opacity = '.4';
        h3.disabled = false; h3.style.opacity = '1';
      };
      h3.onclick = () => {
        if (typeof STATE !== 'undefined') STATE.hintUsed = true;
        hintLevel = Math.max(hintLevel, 3);
        fb.className = 'ex-feedback hint';
        fb.innerHTML = '💡💡💡 ' + ex.hints[2];
        h3.disabled = true; h3.style.opacity = '.4';
      };

      function validate() {
        const userInput = inp.value;
        if (!userInput.trim()) {
          fb.className = 'ex-feedback wrong';
          fb.innerHTML = '✗ Tape une commande avant de valider.';
          return;
        }
        const ok = matchesAnyPattern(userInput, ex.patterns);
        if (ok) {
          inp.className = 'ex-input correct';
          valBtn.disabled = true;
          nextBtn.style.display = 'inline-block';
          const card = inp.closest('.ex-card');
          if (card) card.className = 'ex-card solved';
          fb.className = 'ex-feedback correct';
          fb.innerHTML = '✓ Correct ! ' + (ex.explain || '');
          if (typeof incSolved === 'function' && typeof STATE !== 'undefined' && !STATE.hintUsed) {
            incSolved(cat);
          }
        } else {
          inp.className = 'ex-input wrong';
          fb.className = 'ex-feedback wrong';
          fb.innerHTML = '✗ Pas tout à fait. Vérifie la syntaxe, ou utilise les indices.';
          setTimeout(() => { inp.className = 'ex-input'; }, 1500);
        }
      }
      valBtn.onclick = validate;
      inp.onkeydown = (e) => { if (e.key === 'Enter') validate(); };
      nextBtn.onclick = () => { if (typeof newExercise === 'function') newExercise(); };
    }, 0);

    return div;
  }


  // ────────────────────────────────────────────────────────────────
  // DISPATCHER : pioche un exercice dans la catégorie + construit la carte
  // ────────────────────────────────────────────────────────────────

  function genCLI(cat) {
    const pool = EXERCISES[cat];
    if (!pool || !pool.length) {
      const div = document.createElement('div');
      div.className = 'ex-card';
      div.innerHTML = `<div class="ex-scenario">Catégorie CLI inconnue : ${cat}</div>`;
      return div;
    }
    const ex = pool[Math.floor(Math.random() * pool.length)];
    return ex.format === 'qcm' ? buildQCMCard(ex, cat) : buildFreestyleCard(ex, cat);
  }


  // ────────────────────────────────────────────────────────────────
  // REGISTRATION
  // ────────────────────────────────────────────────────────────────

  if (typeof window !== 'undefined') {
    window.genCLIBasics  = () => genCLI('cli_basics');
    window.genCLILogs    = () => genCLI('cli_logs');
    window.genCLIPipes   = () => genCLI('cli_pipes');
    window.genCLIExtract = () => genCLI('cli_extract');
    window.genCLIPs      = () => genCLI('cli_ps');

    if (typeof GENERATORS !== 'undefined') {
      GENERATORS.cli_basics  = window.genCLIBasics;
      GENERATORS.cli_logs    = window.genCLILogs;
      GENERATORS.cli_pipes   = window.genCLIPipes;
      GENERATORS.cli_extract = window.genCLIExtract;
      GENERATORS.cli_ps      = window.genCLIPs;
    }
  }

})();
