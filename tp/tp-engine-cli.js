// ═══════════════════════════════════════════════════════════════════
// tp-engine-cli.js — CAS-IN TP delta v134 (extension 49 exercices)
//
// Phase 2 du TP Ligne de commande. 7 catégories, multi-OS.
//
// Catégories (49 exercices total) :
//   cli_basics  (7 ex · easy 5XP · QCM)         — ls/dir, cat/type, cd, pwd, mkdir, cp, sudo
//   cli_logs    (7 ex · medium 15XP · mix)      — grep -c, head/tail, grep -i, -v, -A/-B, multi-pattern
//   cli_pipes   (7 ex · hard 30XP · freestyle)  — Top 5 IPs, find -mtime, cut+sort -u, ps, status codes...
//   cli_extract (7 ex · hard 30XP · freestyle)  — sha256, base64, xxd, strings, file, tar, exiftool
//   cli_ps      (7 ex · hard 30XP · freestyle)  — Get-FileHash, Get-WinEvent, Select-String, Get-NetTCP...
//   cli_dfir    (7 ex · hard 30XP · freestyle)  — TSK : mmls, fls, icat, mactime, fsstat, blkstat...
//   cli_network (7 ex · hard 30XP · freestyle)  — tshark, tcpdump, ss, dig, whois, curl, nmap
//
// Validation freestyle : regex souple (casse + espaces ignorés, ordre des
// options accepté, guillemets optionnels, variantes équivalentes).
//
// Chargé APRÈS tp-engine.js
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // EXERCISES — pool des 49 exercices, organisés par catégorie
  // ────────────────────────────────────────────────────────────────

  const EXERCISES = {

    // ════════ CLI BASICS — easy · QCM (7 ex) ═══════════════════════
    cli_basics: [
      {
        id: 'cli_basics_01', icon: '🐧', title: 'Lister les fichiers — Linux',
        format: 'qcm',
        scenario: `Tu viens d'ouvrir un terminal Linux. Tu dois afficher le contenu du dossier courant pour identifier les fichiers de logs présents.<br><br><span class="dim">Quelle commande utilises-tu ?</span>`,
        choices: [
          { text: 'ls', correct: true, explain: '<code>ls</code> (list) est la commande UNIX historique. Variantes : <code>ls -l</code> (détails), <code>ls -lah</code> (détails + cachés + tailles humaines).' },
          { text: 'dir', correct: false, explain: '<code>dir</code> existe sous Linux mais c\'est la convention Windows cmd. Pas l\'usage natif.' },
          { text: 'show', correct: false, explain: 'N\'existe pas comme commande standard.' },
          { text: 'list', correct: false, explain: 'N\'existe pas comme commande standard.' }
        ]
      },
      {
        id: 'cli_basics_02', icon: '🪟', title: 'Lister les fichiers — Windows cmd',
        format: 'qcm',
        scenario: `Sur une machine Windows en investigation, tu veux lister les fichiers du dossier <code>C:\\Users\\suspect\\Downloads</code> via cmd.exe.<br><br><span class="dim">Quelle commande ?</span>`,
        choices: [
          { text: 'dir', correct: true, explain: '<code>dir</code> commande native cmd Windows. Variantes : <code>dir /s</code> (récursif), <code>dir /od</code> (tri date), <code>dir /a:h</code> (cachés).' },
          { text: 'ls', correct: false, explain: '<code>ls</code> est Linux. Marche dans WSL/Git Bash/PowerShell mais pas en cmd natif.' },
          { text: 'list', correct: false, explain: 'N\'existe pas en cmd natif.' },
          { text: 'show /files', correct: false, explain: 'Syntaxe invalide.' }
        ]
      },
      {
        id: 'cli_basics_03', icon: '📄', title: 'Lire un fichier — Linux vs Windows',
        format: 'qcm',
        scenario: `Affiche le contenu de <code>/etc/passwd</code> (Linux) ou <code>C:\\Windows\\System32\\drivers\\etc\\hosts</code> (Windows cmd).<br><br><span class="dim">Quelle paire est correcte ?</span>`,
        choices: [
          { text: 'Linux: <code>cat /etc/passwd</code> · Windows: <code>type ...hosts</code>', correct: true, explain: '<code>cat</code> (concatenate) sur Linux, <code>type</code> sur Windows cmd. PowerShell : <code>Get-Content</code> (alias <code>gc</code>, <code>cat</code>, <code>type</code>).' },
          { text: 'Linux: <code>read /etc/passwd</code> · Windows: <code>open hosts</code>', correct: false, explain: '<code>read</code> en bash lit l\'entrée standard, pas un fichier. <code>open</code> n\'existe pas en cmd.' },
          { text: 'Linux: <code>show /etc/passwd</code> · Windows: <code>display hosts</code>', correct: false, explain: 'Ni <code>show</code> ni <code>display</code> ne sont des commandes standards.' },
          { text: 'Linux: <code>print /etc/passwd</code> · Windows: <code>echo hosts</code>', correct: false, explain: '<code>print</code> envoie à l\'imprimante. <code>echo hosts</code> affiche juste "hosts".' }
        ]
      },
      {
        id: 'cli_basics_04', icon: '📁', title: 'Changer de répertoire',
        format: 'qcm',
        scenario: `Tu veux te déplacer dans <code>/var/log</code> (Linux) ou <code>C:\\Logs</code> (Windows). Même commande utilisée.<br><br><span class="dim">Laquelle ?</span>`,
        choices: [
          { text: '<code>cd /var/log</code> ou <code>cd C:\\Logs</code>', correct: true, explain: '<code>cd</code> (change directory) est universel : Linux, Windows cmd et PowerShell. Variantes : <code>cd ..</code> (parent), <code>cd ~</code> ou <code>cd</code> seul (home Linux), <code>cd \\</code> (racine du lecteur Windows).' },
          { text: '<code>chdir /var/log</code>', correct: false, explain: '<code>chdir</code> existe en Windows comme alias de <code>cd</code> mais <code>cd</code> est le standard.' },
          { text: '<code>goto /var/log</code>', correct: false, explain: '<code>goto</code> est une instruction de scripts batch, pas une commande de navigation.' },
          { text: '<code>move /var/log</code>', correct: false, explain: '<code>move</code> déplace un fichier (Windows). Rien à voir avec la navigation.' }
        ]
      },
      {
        id: 'cli_basics_05', icon: '📌', title: 'Afficher le chemin courant',
        format: 'qcm',
        scenario: `Tu veux savoir dans quel dossier tu te trouves actuellement.<br><br><span class="dim">Linux et Windows cmd :</span>`,
        choices: [
          { text: 'Linux: <code>pwd</code> · Windows: <code>cd</code> (sans argument)', correct: true, explain: '<code>pwd</code> (print working directory) Linux. Sur Windows cmd, <code>cd</code> seul affiche le chemin. Sur PowerShell : <code>Get-Location</code> ou alias <code>pwd</code>.' },
          { text: 'Linux: <code>here</code> · Windows: <code>where</code>', correct: false, explain: '<code>here</code> n\'existe pas. <code>where</code> sur Windows cherche un exécutable dans le PATH.' },
          { text: 'Linux: <code>cwd</code> · Windows: <code>pwd</code>', correct: false, explain: '<code>cwd</code> n\'existe pas en commande. <code>pwd</code> sur Windows cmd ne fonctionne pas (mais OK en PowerShell).' },
          { text: 'Linux: <code>path</code> · Windows: <code>location</code>', correct: false, explain: '<code>path</code> affiche la variable PATH (env), pas le dossier courant. <code>location</code> n\'existe pas.' }
        ]
      },
      {
        id: 'cli_basics_06', icon: '📂', title: 'Créer un répertoire',
        format: 'qcm',
        scenario: `Tu veux créer un dossier nommé <code>evidence</code> dans le dossier courant.<br><br><span class="dim">Commande commune Linux + Windows :</span>`,
        choices: [
          { text: '<code>mkdir evidence</code>', correct: true, explain: '<code>mkdir</code> (make directory) fonctionne sur Linux, Windows cmd et PowerShell. Sur Windows : <code>md</code> est aussi un alias. Linux : <code>mkdir -p a/b/c</code> crée toute la hiérarchie.' },
          { text: '<code>create evidence</code>', correct: false, explain: 'N\'existe pas comme commande de création de dossier.' },
          { text: '<code>newdir evidence</code>', correct: false, explain: 'N\'existe pas.' },
          { text: '<code>md +evidence</code>', correct: false, explain: '<code>md</code> existe (Windows) mais sans le <code>+</code> qui n\'est pas la syntaxe.' }
        ]
      },
      {
        id: 'cli_basics_07', icon: '🔑', title: 'Élévation de privilèges',
        format: 'qcm',
        scenario: `Tu dois exécuter une commande avec les droits administrateur depuis ton compte utilisateur.<br><br><span class="dim">Linux vs Windows :</span>`,
        choices: [
          { text: 'Linux: <code>sudo &lt;commande&gt;</code> · Windows: <code>runas /user:Administrator &lt;commande&gt;</code>', correct: true, explain: '<code>sudo</code> (substitute user do) exécute en tant que root par défaut. Windows: <code>runas</code> lance une commande sous un autre compte. PowerShell : <code>Start-Process -Verb RunAs</code> pour élévation UAC.' },
          { text: 'Linux: <code>admin &lt;commande&gt;</code> · Windows: <code>su admin</code>', correct: false, explain: '<code>admin</code> n\'existe pas. <code>su admin</code> est Linux (switch user), pas Windows.' },
          { text: 'Linux: <code>root &lt;commande&gt;</code> · Windows: <code>elevate &lt;commande&gt;</code>', correct: false, explain: 'Ni <code>root</code> en commande, ni <code>elevate</code>.' },
          { text: 'Linux: <code>!! root</code> · Windows: <code>sudo &lt;commande&gt;</code>', correct: false, explain: '<code>!!</code> bash relance la dernière commande, pas une élévation. <code>sudo</code> n\'est pas natif Windows (existe avec Windows 11 récent en preview, sinon non).' }
        ]
      }
    ],

    // ════════ CLI LOGS — medium · mix QCM + freestyle (7 ex) ═══════
    cli_logs: [
      {
        id: 'cli_logs_01', icon: '🔢', title: 'Compter les tentatives échouées',
        format: 'freestyle',
        scenario: `Tu analyses <code>auth.log</code> d'un serveur Linux. Compte le <strong>nombre total</strong> de lignes contenant exactement la chaîne <code>"Failed password"</code>.<br><br><pre class="cli-snippet">May 30 14:23:01 srv sshd[12451]: Failed password for root from 203.0.113.7 port 41234
May 30 14:23:04 srv sshd[12451]: Failed password for root from 203.0.113.7 port 41235
May 30 14:23:07 srv sshd[12451]: Failed password for admin from 192.168.1.42 port 51234
...
<span class="dim">[50 000 lignes au total]</span></pre>`,
        placeholder: '$ ',
        patterns: [
          /^grep\s+-c\s+["']?Failed password["']?\s+\.?\/?auth\.log\s*$/i,
          /^grep\s+["']?Failed password["']?\s+\.?\/?auth\.log\s*\|\s*wc\s+-l\s*$/i
        ],
        hints: [
          'Tu veux <em>compter</em> les lignes qui matchent un motif. <code>grep</code> a une option pour ça.',
          'Soit <code>grep -c</code> (count direct), soit <code>grep ... | wc -l</code> (pipe vers word count).',
          '<code>grep -c "Failed password" auth.log</code> ou <code>grep "Failed password" auth.log | wc -l</code>'
        ],
        explain: '<code>grep -c</code> compte directement les lignes qui matchent. La variante avec <code>| wc -l</code> est plus modulaire (utile si tu ajoutes d\'autres filtres dans le pipeline).'
      },
      {
        id: 'cli_logs_02', icon: '⏪', title: 'Premières lignes d\'un log',
        format: 'qcm',
        scenario: `Tu reçois un <code>syslog</code> volumineux. Tu veux voir les <strong>20 premières lignes</strong> pour identifier le début de l'incident.`,
        choices: [
          { text: '<code>head -20 syslog</code>', correct: true, explain: '<code>head</code> = début. <code>head -20</code> ou <code>head -n 20</code>. Pour les 20 <strong>dernières</strong> : <code>tail -20</code>. Pour suivre en temps réel : <code>tail -f syslog</code>.' },
          { text: '<code>top 20 syslog</code>', correct: false, explain: '<code>top</code> est un moniteur de processus système.' },
          { text: '<code>first 20 syslog</code>', correct: false, explain: 'N\'existe pas.' },
          { text: '<code>cat -20 syslog</code>', correct: false, explain: '<code>cat</code> n\'accepte pas <code>-20</code>. Erreur garantie.' }
        ]
      },
      {
        id: 'cli_logs_03', icon: '🔍', title: 'Filtrer insensible à la casse',
        format: 'freestyle',
        scenario: `Tu analyses <code>application.log</code> et tu veux toutes les lignes contenant <code>ERROR</code>, <code>Error</code>, <code>error</code>… <strong>insensible à la casse</strong>.<br><br><pre class="cli-snippet">2026-05-30 14:23:01 [INFO] Application started
2026-05-30 14:23:15 [ERROR] Database connection lost
2026-05-30 14:24:02 [error] Retry attempt 1 failed
2026-05-30 14:24:08 [Error] Final retry failed, aborting
...</pre>`,
        placeholder: '$ ',
        patterns: [
          /^grep\s+-i\s+["']?ERROR["']?\s+application\.log\s*$/i,
          /^grep\s+["']?ERROR["']?\s+-i\s+application\.log\s*$/i
        ],
        hints: [
          'L\'option courte de grep pour ignorer la casse commence par <code>-i</code>.',
          'Forme générale : <code>grep -i MOTIF FICHIER</code>.',
          '<code>grep -i "ERROR" application.log</code>'
        ],
        explain: '<code>-i</code> (ou <code>--ignore-case</code>) rend <code>grep</code> insensible à la casse. Très utile sur les logs où le niveau de sévérité peut être écrit différemment selon les composants.'
      },
      {
        id: 'cli_logs_04', icon: '⏩', title: 'Suivre un log en temps réel',
        format: 'qcm',
        scenario: `Tu enquêtes en direct sur un serveur. Tu veux <strong>voir s'afficher les nouvelles lignes</strong> de <code>/var/log/nginx/access.log</code> au fil de leur écriture.`,
        choices: [
          { text: '<code>tail -f /var/log/nginx/access.log</code>', correct: true, explain: '<code>tail -f</code> (follow) suit le fichier en temps réel. Bonus : <code>tail -F</code> (majuscule) tolère la rotation de log. Pour suivre plusieurs fichiers : <code>multitail</code> ou <code>tail -f f1 f2</code>.' },
          { text: '<code>watch cat /var/log/nginx/access.log</code>', correct: false, explain: 'Refait afficher tout le fichier toutes les 2s, gaspille les ressources.' },
          { text: '<code>tail -100 /var/log/nginx/access.log</code>', correct: false, explain: 'Affiche les 100 dernières lignes une fois, puis termine. Pas du temps réel.' },
          { text: '<code>cat -live /var/log/nginx/access.log</code>', correct: false, explain: '<code>cat</code> n\'a pas d\'option <code>-live</code>.' }
        ]
      },
      {
        id: 'cli_logs_05', icon: '🔄', title: 'Inverser le filtrage',
        format: 'freestyle',
        scenario: `Tu analyses <code>syslog</code>. Affiche toutes les lignes <strong>SAUF</strong> celles contenant <code>DEBUG</code> (pour réduire le bruit).`,
        placeholder: '$ ',
        patterns: [
          /^grep\s+-v\s+["']?DEBUG["']?\s+syslog\s*$/i,
          /^grep\s+["']?DEBUG["']?\s+-v\s+syslog\s*$/i,
          /^grep\s+-v\s+-i\s+["']?DEBUG["']?\s+syslog\s*$/i
        ],
        hints: [
          'L\'option qui <em>inverse</em> le matching de grep commence par <code>-v</code>.',
          'Forme : <code>grep -v MOTIF FICHIER</code>',
          '<code>grep -v "DEBUG" syslog</code>'
        ],
        explain: '<code>grep -v</code> = "<em>invert match</em>". Très utile pour retirer le bruit. Combinable avec <code>-i</code> : <code>grep -vi debug</code>. Pour exclure plusieurs motifs : <code>grep -vE \'DEBUG|INFO\'</code>.'
      },
      {
        id: 'cli_logs_06', icon: '📐', title: 'Contexte avant/après',
        format: 'freestyle',
        scenario: `Tu trouves une ligne d'erreur dans <code>app.log</code>. Tu veux <strong>3 lignes avant ET 3 lignes après</strong> chaque occurrence de <code>"FATAL"</code> pour le contexte.`,
        placeholder: '$ ',
        patterns: [
          /^grep\s+-A\s*3\s+-B\s*3\s+["']?FATAL["']?\s+app\.log\s*$/i,
          /^grep\s+-B\s*3\s+-A\s*3\s+["']?FATAL["']?\s+app\.log\s*$/i,
          /^grep\s+-C\s*3\s+["']?FATAL["']?\s+app\.log\s*$/i
        ],
        hints: [
          'Trois options possibles : avant (<code>-B</code>), après (<code>-A</code>), ou les deux symétriquement (<code>-C</code>).',
          'Forme : <code>grep -B 3 -A 3 MOTIF FICHIER</code> ou <code>grep -C 3 MOTIF FICHIER</code>.',
          '<code>grep -A 3 -B 3 "FATAL" app.log</code> ou <code>grep -C 3 "FATAL" app.log</code>'
        ],
        explain: '<code>-A</code> = After, <code>-B</code> = Before, <code>-C</code> = Context (= -A + -B). Très pratique en analyse de stack traces ou de chaînes causales dans les logs.'
      },
      {
        id: 'cli_logs_07', icon: '🎯', title: 'Multi-pattern alternatif',
        format: 'freestyle',
        scenario: `Tu veux toutes les lignes de <code>system.log</code> contenant <code>"ERROR"</code> <strong>OU</strong> <code>"CRITICAL"</code> <strong>OU</strong> <code>"FATAL"</code> en une seule passe.`,
        placeholder: '$ ',
        patterns: [
          /^grep\s+-E\s+["']?(ERROR|CRITICAL|FATAL|(\(ERROR\|CRITICAL\|FATAL\)))["']?\s+system\.log\s*$/i,
          /^egrep\s+["']?(ERROR|CRITICAL|FATAL|(\(ERROR\|CRITICAL\|FATAL\)))["']?\s+system\.log\s*$/i,
          /^grep\s+-E\s+["']?\(ERROR\|CRITICAL\|FATAL\)["']?\s+system\.log\s*$/i,
          /^grep\s+["']?ERROR\|CRITICAL\|FATAL["']?\s+system\.log\s*$/i
        ],
        hints: [
          'Pour activer les regex étendues (qui permettent l\'alternation avec <code>|</code>), utilise l\'option <code>-E</code> de grep.',
          'Pattern : <code>grep -E "A|B|C" FICHIER</code>',
          '<code>grep -E "ERROR|CRITICAL|FATAL" system.log</code>'
        ],
        explain: 'Sans <code>-E</code> (mode basique BRE), le <code>|</code> n\'est pas un opérateur d\'alternation et doit être échappé (<code>\\|</code>). <code>-E</code> active ERE (Extended Regular Expressions). Alternative historique : la commande <code>egrep</code> = <code>grep -E</code>.'
      }
    ],

    // ════════ CLI PIPES — hard · freestyle Linux (7 ex) ════════════
    cli_pipes: [
      {
        id: 'cli_pipes_01', icon: '🥇', title: 'Top 5 IPs · auth.log',
        format: 'freestyle',
        scenario: `Tu enquêtes sur une attaque par force brute SSH. Liste les <strong>5 adresses IP</strong> ayant le plus de tentatives <code>Failed password</code> dans <code>auth.log</code>, avec leur compteur.<br><br><pre class="cli-snippet">May 30 14:23:01 srv sshd: Failed password for root from 203.0.113.7 port 41234
May 30 14:23:04 srv sshd: Failed password for root from 203.0.113.7 port 41235
May 30 14:23:07 srv sshd: Failed password for admin from 192.168.1.42 port 51234
...
<span class="dim">[IP en 11ᵉ champ]</span></pre>`,
        placeholder: '$ ',
        patterns: [
          /^grep\s+["']?Failed password["']?\s+auth\.log\s*\|\s*awk\s+["']?\{?print\s*\$11\}?["']?\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-(rn|nr)\s*\|\s*head\s+-n?\s*5\s*$/i,
          /^grep\s+["']?Failed["']?\s+auth\.log\s*\|\s*grep\s+-oE?\s+["'][^"']*\\d.+["']\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-(rn|nr)\s*\|\s*head\s+-n?\s*5\s*$/i
        ],
        hints: [
          'Pipeline : filtrer "Failed password" → extraire colonne IP (champ 11) → trier → dédupliquer avec compteur → re-trier par compteur décroissant → top 5.',
          'Outils : <code>grep</code> · <code>awk</code> (champ 11) · <code>sort</code> · <code>uniq -c</code> · <code>sort -rn</code> · <code>head -5</code>',
          '<code>grep "Failed password" auth.log | awk \'{print $11}\' | sort | uniq -c | sort -rn | head -5</code>'
        ],
        explain: 'Pattern classique d\'analyse sécurité : <strong>filter → extract → sort → uniq -c → sort -rn → head</strong>. <code>uniq -c</code> exige l\'entrée triée. <code>sort -rn</code> = numerical reverse.'
      },
      {
        id: 'cli_pipes_02', icon: '🕐', title: 'Fichiers .exe modifiés < 24h',
        format: 'freestyle',
        scenario: `Sur un serveur Linux compromis, identifie tous les fichiers <code>.exe</code> sous <code>/tmp</code> qui ont été <strong>modifiés dans les dernières 24 heures</strong>.`,
        placeholder: '$ ',
        patterns: [
          /^find\s+\/?tmp\/?\s+-(i?name)\s+["']?\*\.exe["']?\s+-mtime\s+-1\s*$/i,
          /^find\s+\/?tmp\/?\s+-mtime\s+-1\s+-(i?name)\s+["']?\*\.exe["']?\s*$/i,
          /^find\s+\/?tmp\/?\s+-type\s+f\s+-(i?name)\s+["']?\*\.exe["']?\s+-mtime\s+-1\s*$/i
        ],
        hints: [
          'Commande de référence : <code>find</code>. Combiner recherche par nom + filtre temporel.',
          '<code>-name "*.exe"</code> pour le pattern, <code>-mtime -1</code> = modifié dans les dernières 24h (signe <code>-</code> = "moins de").',
          '<code>find /tmp -name "*.exe" -mtime -1</code>'
        ],
        explain: '<code>-mtime -1</code> = moins de 1 jour. <code>-mtime +7</code> = plus de 7 jours. Pour minutes : <code>-mmin -N</code>. Pour ctime (changement d\'inode) : <code>-ctime</code>.'
      },
      {
        id: 'cli_pipes_03', icon: '🔢', title: 'Emails uniques dans un CSV',
        format: 'freestyle',
        scenario: `<code>export.csv</code> séparé par virgules, la <strong>3ᵉ colonne est l'email</strong>. Compte les adresses email <strong>uniques</strong>.<br><br><pre class="cli-snippet">id,name,email,phone
1,Alice,alice@example.com,+41761234567
2,Bob,bob@example.com,+41769876543
3,Alice,alice@example.com,+41761234567
...</pre>`,
        placeholder: '$ ',
        patterns: [
          /^cut\s+-d["']?,["']?\s+-f\s*3\s+export\.csv\s*\|\s*sort\s+-u\s*\|\s*wc\s+-l\s*$/i,
          /^cut\s+-d["']?,["']?\s+-f\s*3\s+export\.csv\s*\|\s*sort\s*\|\s*uniq\s*\|\s*wc\s+-l\s*$/i,
          /^awk\s+-F["']?,["']?\s+["']?\{?print\s*\$3\}?["']?\s+export\.csv\s*\|\s*sort\s+-u\s*\|\s*wc\s+-l\s*$/i
        ],
        hints: [
          'Étape 1 : extraire la 3ᵉ colonne (séparateur virgule). Étape 2 : dédupliquer. Étape 3 : compter.',
          'Outils : <code>cut -d, -f3</code> ou <code>awk -F, \'{print $3}\'</code> · <code>sort -u</code> · <code>wc -l</code>',
          '<code>cut -d\',\' -f3 export.csv | sort -u | wc -l</code>'
        ],
        explain: '<code>sort -u</code> = trier + dédupliquer en un seul appel (équivalent <code>sort | uniq</code>). L\'en-tête CSV est inclus si tu ne l\'exclus pas (<code>| tail -n +2</code>).'
      },
      {
        id: 'cli_pipes_04', icon: '📊', title: 'Top 10 User-Agents · nginx',
        format: 'freestyle',
        scenario: `Analyse <code>access.log</code> nginx (format combined). Liste les <strong>10 User-Agents</strong> les plus fréquents.<br><br><pre class="cli-snippet">192.168.1.10 - - [30/May/2026:14:23:01 +0200] "GET / HTTP/1.1" 200 1234 "-" "Mozilla/5.0 (X11; Linux x86_64) Firefox/120"
203.0.113.7 - - [30/May/2026:14:23:02 +0200] "POST /api HTTP/1.1" 401 89 "-" "curl/7.88.1"
...
<span class="dim">[User-Agent = champ après le dernier guillemet ouvrant]</span></pre>`,
        placeholder: '$ ',
        patterns: [
          /^awk\s+-F["']?\s*\\?["]?\s*["']?\s+["']?\{?print\s*\$6\}?["']?\s+access\.log\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-(rn|nr)\s*\|\s*head\s+-n?\s*10\s*$/i,
          /^cut\s+-d["']?\\?["]?["']?\s+-f\s*6\s+access\.log\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-(rn|nr)\s*\|\s*head\s+-n?\s*10\s*$/i,
          /^awk\s+-F["']?\\?"["']?\s+["']?\{?print\s*\$6\}?["']?\s+access\.log\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-(rn|nr)\s*\|\s*head\s+-n?\s*10\s*$/i
        ],
        hints: [
          'Le User-Agent est <em>entre guillemets</em>. Pour l\'extraire : utiliser <code>"</code> comme séparateur de champ avec awk.',
          'Forme : <code>awk -F\'"\' \'{print $6}\' access.log | ...</code> (le User-Agent est le 6ᵉ champ quand séparé par <code>"</code>).',
          '<code>awk -F\'"\' \'{print $6}\' access.log | sort | uniq -c | sort -rn | head -10</code>'
        ],
        explain: 'Format nginx combined : <code>$remote_addr - - [time] "request" status bytes "referer" "user_agent"</code>. Quand on split par <code>"</code>, le User-Agent tombe en champ 6 (champs vides comptent).'
      },
      {
        id: 'cli_pipes_05', icon: '💾', title: 'Fichiers volumineux',
        format: 'freestyle',
        scenario: `Trouve tous les fichiers de <strong>plus de 100 Mo</strong> dans le répertoire <code>/var</code> et ses sous-dossiers.`,
        placeholder: '$ ',
        patterns: [
          /^find\s+\/?var\/?\s+-(type\s+f\s+)?-size\s+\+100M\s*$/i,
          /^find\s+\/?var\/?\s+-size\s+\+100M\s*(-type\s+f\s*)?$/i,
          /^find\s+\/?var\/?\s+-type\s+f\s+-size\s+\+100M\s*$/i
        ],
        hints: [
          'Commande : <code>find</code>. Option de taille avec unité : <code>-size</code>.',
          'Forme : <code>find CHEMIN -size +TAILLE</code>. Unité <code>M</code> = mégaoctets (1048576 octets en find).',
          '<code>find /var -size +100M</code> ou <code>find /var -type f -size +100M</code>'
        ],
        explain: 'Unités <code>-size</code> : <code>c</code> (octets), <code>k</code> (KiB), <code>M</code> (MiB), <code>G</code> (GiB). Signe <code>+</code> = plus que, <code>-</code> = moins que, sans signe = exactement. <code>-type f</code> filtre uniquement les fichiers (pas les dossiers).'
      },
      {
        id: 'cli_pipes_06', icon: '🔁', title: 'Lignes dupliquées dans un fichier',
        format: 'freestyle',
        scenario: `Identifie les lignes qui apparaissent <strong>plus d'une fois</strong> dans <code>users.txt</code>, avec leur nombre d'occurrences.`,
        placeholder: '$ ',
        patterns: [
          /^sort\s+users\.txt\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-(rn|nr)\s*\|\s*awk\s+["']?\$1\s*>\s*1["']?\s*$/i,
          /^sort\s+users\.txt\s*\|\s*uniq\s+-cd\s*$/i,
          /^sort\s+users\.txt\s*\|\s*uniq\s+-dc\s*$/i,
          /^sort\s+users\.txt\s*\|\s*uniq\s+-d\s*$/i
        ],
        hints: [
          '<code>uniq</code> a une option pour ne garder que les doublons.',
          '<code>uniq -d</code> n\'affiche que les lignes dupliquées. <code>-c</code> ajoute le compteur. Combiné : <code>-cd</code>.',
          '<code>sort users.txt | uniq -cd</code> (compteur + doublons uniquement)'
        ],
        explain: '<code>uniq</code> nécessite l\'entrée triée. <code>uniq -d</code> = duplicates only, <code>uniq -c</code> = with count, <code>uniq -u</code> = unique only (lignes sans doublons). Combinable : <code>sort | uniq -cd | sort -rn</code> = doublons les plus fréquents en premier.'
      },
      {
        id: 'cli_pipes_07', icon: '🧠', title: 'Top 5 processus consommant RAM',
        format: 'freestyle',
        scenario: `Sur un serveur Linux, identifie les <strong>5 processus consommant le plus de RAM</strong> (en pourcentage du total).<br><br><span class="dim">Hint : la colonne %MEM dans <code>ps aux</code> est la 4ᵉ.</span>`,
        placeholder: '$ ',
        patterns: [
          /^ps\s+aux\s*\|\s*sort\s+-(rn|nr)k\s*4\s*\|\s*head\s+-n?\s*5\s*$/i,
          /^ps\s+aux\s+--sort=-?%mem\s*\|\s*head\s+-n?\s*5\s*$/i,
          /^ps\s+aux\s+--sort=-%mem\s*\|\s*head\s+-n?\s*6\s*$/i,
          /^ps\s+-eo\s+pid,user,%mem,cmd\s+--sort=-?%mem\s*\|\s*head\s+-n?\s*5\s*$/i
        ],
        hints: [
          'Lister les processus : <code>ps aux</code>. Puis trier par la 4ᵉ colonne (numérique), décroissant. Garder le top 5.',
          'Option 1 : pipe vers <code>sort -rnk4</code>. Option 2 : laisser ps trier avec <code>--sort=-%mem</code>.',
          '<code>ps aux | sort -rnk4 | head -5</code> ou <code>ps aux --sort=-%mem | head -5</code>'
        ],
        explain: 'Colonnes <code>ps aux</code> : USER, PID, %CPU, %MEM, VSZ, RSS, TTY, STAT, START, TIME, COMMAND. Pour la RAM en absolu (kilo-octets) : RSS = colonne 6 → <code>sort -rnk6</code>. Variante : <code>top -b -n 1 -o %MEM | head -12</code>.'
      }
    ],

    // ════════ CLI EXTRACT — hard · freestyle (7 ex) ════════════════
    cli_extract: [
      {
        id: 'cli_extract_01', icon: '🔐', title: 'SHA-256 d\'un fichier suspect',
        format: 'freestyle',
        scenario: `Tu as téléchargé <code>suspect.bin</code>. Calcule son hash <strong>SHA-256</strong> pour le comparer aux IOCs publiés.`,
        placeholder: '$ ',
        patterns: [
          /^sha256sum\s+suspect\.bin\s*$/i,
          /^shasum\s+-a\s+256\s+suspect\.bin\s*$/i,
          /^openssl\s+(sha256|dgst\s+-sha256)\s+suspect\.bin\s*$/i
        ],
        hints: [
          'Trois utilitaires selon ta distribution : <code>sha256sum</code> (Linux), <code>shasum -a 256</code> (BSD/macOS), <code>openssl</code>.',
          'Le plus court : <code>sha256sum FICHIER</code>',
          '<code>sha256sum suspect.bin</code>'
        ],
        explain: 'Pour la chaîne de custody forensique (art. 192 CPP), hash calculé avant et après chaque manipulation, comparé, documenté. SHA-256 est le standard actuel. MD5 et SHA-1 sont obsolètes pour usage cryptographique mais admis comme empreinte d\'intégrité.'
      },
      {
        id: 'cli_extract_02', icon: '🔡', title: 'Décoder du base64',
        format: 'freestyle',
        scenario: `Une chaîne base64 a été extraite d\'un malware : <code>Q0FTLUlOIERGSVI=</code><br><br>Décode-la en clair depuis le terminal.`,
        placeholder: '$ ',
        patterns: [
          /^echo\s+-?n?\s*["']?Q0FTLUlOIERGSVI=["']?\s*\|\s*base64\s+(-d|--decode|-D)\s*$/i,
          /^printf\s+["']?Q0FTLUlOIERGSVI=["']?\s*\|\s*base64\s+(-d|--decode|-D)\s*$/i,
          /^base64\s+(-d|--decode|-D)\s+<\s*<\s*<\s*["']?Q0FTLUlOIERGSVI=["']?\s*$/i
        ],
        hints: [
          'Passe la chaîne à <code>base64</code> en mode décodage.',
          'Pattern : <code>echo "CHAINE" | base64 -d</code>',
          '<code>echo "Q0FTLUlOIERGSVI=" | base64 -d</code>'
        ],
        explain: '<code>base64 -d</code> (ou <code>--decode</code>) lit l\'entrée standard et décode. Sur macOS : option <code>-D</code> (majuscule). Pour encoder : <code>echo "CAS-IN DFIR" | base64</code>. Cobalt Strike/PowerShell utilisent souvent du base64 imbriqué multi-niveaux.'
      },
      {
        id: 'cli_extract_03', icon: '🔬', title: 'Hexdump d\'un payload',
        format: 'freestyle',
        scenario: `Inspecte les <strong>48 premiers octets</strong> de <code>payload.bin</code> en hexadécimal avec offsets, pour identifier le magic byte.`,
        placeholder: '$ ',
        patterns: [
          /^xxd\s+-l\s+48\s+payload\.bin\s*$/i,
          /^xxd\s+payload\.bin\s*\|\s*head\s+-n?\s*3\s*$/i,
          /^hexdump\s+-C\s+-n\s+48\s+payload\.bin\s*$/i,
          /^od\s+-A\s*x\s+-t\s+x1z?\s+-N\s+48\s+payload\.bin\s*$/i
        ],
        hints: [
          'Trois utilitaires : <code>xxd</code>, <code>hexdump -C</code>, <code>od</code>.',
          'Soit limiter à 48 octets (<code>-l 48</code> pour xxd, <code>-n 48</code> pour hexdump), soit piper vers <code>head -3</code>.',
          '<code>xxd -l 48 payload.bin</code> · <code>hexdump -C -n 48 payload.bin</code>'
        ],
        explain: '<code>xxd</code> affiche 16 octets/ligne par défaut (48 octets = 3 lignes). Magic bytes utiles : <code>4D 5A</code> (PE), <code>7F 45 4C 46</code> (ELF), <code>89 50 4E 47</code> (PNG), <code>FF D8 FF</code> (JPEG), <code>25 50 44 46</code> (PDF).'
      },
      {
        id: 'cli_extract_04', icon: '🆔', title: 'Identifier le type d\'un fichier',
        format: 'freestyle',
        scenario: `Un attaquant a renommé son malware en <code>document.pdf</code> mais tu doutes que ce soit vraiment un PDF. Identifie le <strong>vrai type</strong> du fichier.`,
        placeholder: '$ ',
        patterns: [
          /^file\s+document\.pdf\s*$/i,
          /^file\s+-i\s+document\.pdf\s*$/i,
          /^file\s+--mime-type\s+document\.pdf\s*$/i
        ],
        hints: [
          'La commande qui identifie un fichier d\'après son contenu (et pas son extension) commence par <code>f</code>.',
          'Forme : <code>file FICHIER</code>',
          '<code>file document.pdf</code>'
        ],
        explain: '<code>file</code> utilise la base de données <code>/etc/magic</code> ou <code>/usr/share/misc/magic</code> pour identifier le type d\'après les magic bytes. Très utile contre l\'extension spoofing (qui est trivial pour un attaquant). Options : <code>-i</code> donne le type MIME, <code>-b</code> donne juste le type sans le nom de fichier.'
      },
      {
        id: 'cli_extract_05', icon: '🔠', title: 'Extraire les chaînes d\'un binaire',
        format: 'freestyle',
        scenario: `Tu analyses <code>malware.bin</code> sans le faire tourner. Extrais toutes les chaînes ASCII de <strong>longueur minimum 8</strong> caractères qui contiennent <code>"http"</code>.`,
        placeholder: '$ ',
        patterns: [
          /^strings\s+-n\s*8\s+malware\.bin\s*\|\s*grep\s+["']?http["']?\s*$/i,
          /^strings\s+-n\s*8\s+malware\.bin\s*\|\s*grep\s+-i\s+["']?http["']?\s*$/i,
          /^strings\s+-n\s+8\s+malware\.bin\s*\|\s*grep\s+["']?http["']?\s*$/i
        ],
        hints: [
          'Commande pour extraire les chaînes : <code>strings</code>. Pour fixer la longueur minimale : option <code>-n</code>.',
          'Pipeline : <code>strings -n 8 FICHIER | grep PATTERN</code>',
          '<code>strings -n 8 malware.bin | grep "http"</code>'
        ],
        explain: '<code>strings</code> extrait les séquences de caractères imprimables d\'au moins N caractères consécutifs (défaut N=4). Très utile pour : URLs hardcodées (C2), commandes embarquées, noms de mutex, clés de registre, etc. Combinable avec <code>grep -E</code> pour regex avancée.'
      },
      {
        id: 'cli_extract_06', icon: '📦', title: 'Décompresser une archive .tar.gz',
        format: 'freestyle',
        scenario: `Tu as récupéré <code>logs_evidence.tar.gz</code> d\'un suspect. Décompresse l\'archive dans le dossier courant (sans options exotiques).`,
        placeholder: '$ ',
        patterns: [
          /^tar\s+-?xzf\s+logs_evidence\.tar\.gz\s*$/i,
          /^tar\s+-?xvzf\s+logs_evidence\.tar\.gz\s*$/i,
          /^tar\s+-?zxf\s+logs_evidence\.tar\.gz\s*$/i,
          /^tar\s+--extract\s+--gzip\s+--file\s+logs_evidence\.tar\.gz\s*$/i,
          /^tar\s+-x\s+-z\s+-f\s+logs_evidence\.tar\.gz\s*$/i
        ],
        hints: [
          'Commande : <code>tar</code>. Options nécessaires : extraire (<code>x</code>), gzip (<code>z</code>), fichier (<code>f</code>).',
          'Pattern : <code>tar -xzf ARCHIVE.tar.gz</code> (mémo : "<em>xtract-zee-file</em>")',
          '<code>tar -xzf logs_evidence.tar.gz</code> ou <code>tar xzf logs_evidence.tar.gz</code> (le tiret est optionnel)'
        ],
        explain: 'Options tar usuelles : <code>x</code>=extract, <code>c</code>=create, <code>t</code>=list, <code>z</code>=gzip, <code>j</code>=bzip2, <code>J</code>=xz, <code>f</code>=file, <code>v</code>=verbose, <code>C</code>=change to dir. Pour lister sans extraire : <code>tar -tzf archive.tar.gz</code>. Avant extraction sur preuve forensique : vérifier les chemins absolus et <code>../</code> (path traversal).'
      },
      {
        id: 'cli_extract_07', icon: '📷', title: 'Métadonnées EXIF d\'une image',
        format: 'freestyle',
        scenario: `Une photo <code>suspect.jpg</code> a été partagée par un témoin. Extrais toutes les <strong>métadonnées EXIF</strong> (date, GPS, appareil) avec l'outil dédié.`,
        placeholder: '$ ',
        patterns: [
          /^exiftool\s+suspect\.jpg\s*$/i,
          /^exiv2\s+(-pa\s+)?suspect\.jpg\s*$/i,
          /^exiftool\s+-(all|All|G)\s+suspect\.jpg\s*$/i,
          /^identify\s+-verbose\s+suspect\.jpg\s*$/i
        ],
        hints: [
          'L\'outil de référence forensique pour les métadonnées EXIF est nommé <code>exif…</code>',
          'Forme la plus simple : <code>exiftool FICHIER</code> (lit tout par défaut).',
          '<code>exiftool suspect.jpg</code> · alternative : <code>exiv2 -pa suspect.jpg</code>'
        ],
        explain: '<code>exiftool</code> (Phil Harvey) est le standard de facto en forensique d\'images : lit/écrit ~200 formats. Données précieuses : <code>GPS Latitude/Longitude</code>, <code>Create Date</code> vs <code>Modify Date</code>, <code>Make/Model</code> appareil, <code>Software</code> retouche. Astuce : <code>exiftool -G</code> regroupe par catégorie, <code>-a</code> montre les tags dupliqués.'
      }
    ],

    // ════════ CLI POWERSHELL — hard · freestyle Windows (7 ex) ═════
    cli_ps: [
      {
        id: 'cli_ps_01', icon: '🔐', title: 'Get-FileHash — SHA-256',
        format: 'freestyle',
        scenario: `Sur un poste Windows en investigation, calcule le hash <strong>SHA-256</strong> de <code>C:\\IR\\suspect.exe</code> via PowerShell.`,
        placeholder: 'PS> ',
        patterns: [
          /^Get-FileHash\s+(-Path\s+)?["']?C:\\IR\\suspect\.exe["']?\s+(-Algorithm\s+)?SHA256\s*$/i,
          /^Get-FileHash\s+(-Algorithm\s+)?SHA256\s+(-Path\s+)?["']?C:\\IR\\suspect\.exe["']?\s*$/i,
          /^Get-FileHash\s+(-Path\s+)?["']?C:\\IR\\suspect\.exe["']?\s*$/i
        ],
        hints: [
          'Cmdlet : <code>Get-FileHash</code>. Par défaut SHA-256 (donc <code>-Algorithm</code> optionnel).',
          'Forme : <code>Get-FileHash -Path "CHEMIN" -Algorithm SHA256</code>',
          '<code>Get-FileHash "C:\\IR\\suspect.exe" -Algorithm SHA256</code>'
        ],
        explain: '<code>Get-FileHash</code> = équivalent PowerShell de <code>sha256sum</code>. Algos : SHA1, SHA256, SHA384, SHA512, MD5. Comparaison rapide à un IOC : <code>(Get-FileHash file.exe).Hash -eq "ABC123..."</code>'
      },
      {
        id: 'cli_ps_02', icon: '📋', title: 'Get-WinEvent — Security 10 derniers',
        format: 'freestyle',
        scenario: `Récupère les <strong>10 derniers événements</strong> du journal <code>Security</code> via PowerShell, pour traquer Event ID 4625 (logon failed) ou 4688 (process created).`,
        placeholder: 'PS> ',
        patterns: [
          /^Get-WinEvent\s+-LogName\s+Security\s+-MaxEvents\s+10\s*$/i,
          /^Get-WinEvent\s+-MaxEvents\s+10\s+-LogName\s+Security\s*$/i,
          /^Get-WinEvent\s+(-LogName\s+)?["']?Security["']?\s+(-MaxEvents\s+)?10\s*$/i
        ],
        hints: [
          'Cmdlet : <code>Get-WinEvent</code>. Paramètres clés : <code>-LogName</code> et <code>-MaxEvents</code>.',
          'Forme : <code>Get-WinEvent -LogName Security -MaxEvents 10</code>',
          '<code>Get-WinEvent -LogName Security -MaxEvents 10</code>'
        ],
        explain: 'Logs clés : <strong>Security</strong> (authent, audit), <strong>System</strong> (services, drivers), <strong>Application</strong> (apps). Filtrer par Event ID : <code>Get-WinEvent -FilterHashtable @{LogName="Security"; ID=4625} -MaxEvents 50</code>. Remplace l\'ancien <code>Get-EventLog</code> (déprécié).'
      },
      {
        id: 'cli_ps_03', icon: '🔎', title: 'Select-String — grep en PowerShell',
        format: 'freestyle',
        scenario: `Cherche le pattern <code>Failed</code> dans tous les <code>*.log</code> de <code>C:\\IR\\logs\\</code> via PowerShell.`,
        placeholder: 'PS> ',
        patterns: [
          /^Select-String\s+(-Pattern\s+)?["']?Failed["']?\s+(-Path\s+)?["']?C:\\IR\\logs\\\*\.log["']?\s*$/i,
          /^Select-String\s+(-Path\s+)?["']?C:\\IR\\logs\\\*\.log["']?\s+(-Pattern\s+)?["']?Failed["']?\s*$/i,
          /^(Get-ChildItem|gci|ls|dir)\s+(-Path\s+)?["']?C:\\IR\\logs\\\*\.log["']?\s*\|\s*Select-String\s+(-Pattern\s+)?["']?Failed["']?\s*$/i
        ],
        hints: [
          'Cmdlet équivalent à <code>grep</code> : <code>Select-String</code> (alias <code>sls</code>).',
          'Forme : <code>Select-String -Pattern PATTERN -Path "FICHIERS"</code>',
          '<code>Select-String -Pattern "Failed" -Path "C:\\IR\\logs\\*.log"</code>'
        ],
        explain: '<code>Select-String</code> : regex natif, <code>-Context N</code> (lignes avant/après comme <code>grep -B/-A</code>), <code>-NotMatch</code>, <code>-CaseSensitive</code> (par défaut insensible, l\'inverse de grep !). Récursif : <code>Get-ChildItem -Recurse "*.log" | Select-String "Failed"</code>.'
      },
      {
        id: 'cli_ps_04', icon: '📁', title: 'Get-ChildItem récursif filtré',
        format: 'freestyle',
        scenario: `Liste tous les fichiers <code>*.dll</code> sous <code>C:\\Windows\\System32\\</code> et ses sous-dossiers via PowerShell.`,
        placeholder: 'PS> ',
        patterns: [
          /^Get-ChildItem\s+(-Path\s+)?["']?C:\\Windows\\System32\\["']?\s+(-Recurse|-r)\s+(-Filter\s+)?["']?\*\.dll["']?\s*$/i,
          /^Get-ChildItem\s+(-Filter\s+)?["']?\*\.dll["']?\s+(-Recurse|-r)\s+(-Path\s+)?["']?C:\\Windows\\System32\\["']?\s*$/i,
          /^gci\s+(-Path\s+)?["']?C:\\Windows\\System32\\["']?\s+(-Recurse|-r)\s+(-Filter\s+)?["']?\*\.dll["']?\s*$/i,
          /^Get-ChildItem\s+(-Path\s+)?["']?C:\\Windows\\System32\\["']?\s+(-Recurse|-r)\s+["']?\*\.dll["']?\s*$/i
        ],
        hints: [
          'Cmdlet : <code>Get-ChildItem</code> (alias <code>gci</code>, <code>ls</code>, <code>dir</code>). Options : <code>-Recurse</code> et <code>-Filter "*.dll"</code>.',
          'Forme : <code>Get-ChildItem -Path "CHEMIN" -Recurse -Filter "*.ext"</code>',
          '<code>Get-ChildItem -Path "C:\\Windows\\System32\\" -Recurse -Filter "*.dll"</code>'
        ],
        explain: '<code>-Filter</code> est plus rapide que <code>-Include</code> (filtrage côté FS via API, pas côté PowerShell). Pour chercher par nom <em>ET</em> par taille : <code>gci -Recurse "*.dll" | Where-Object {$_.Length -gt 1MB}</code>. Astuce : <code>-File</code> ne retourne que les fichiers (équivalent <code>find -type f</code>).'
      },
      {
        id: 'cli_ps_05', icon: '⚙️', title: 'Get-Process — top CPU',
        format: 'freestyle',
        scenario: `Affiche les <strong>5 processus consommant le plus de CPU</strong> sur le poste compromis via PowerShell.`,
        placeholder: 'PS> ',
        patterns: [
          /^Get-Process\s*\|\s*Sort-Object\s+(-Property\s+)?CPU\s+(-Descending)?\s*\|\s*Select(-Object)?\s+(-First\s+)?5\s*$/i,
          /^Get-Process\s*\|\s*Sort-Object\s+CPU\s+-Descending\s*\|\s*Select(-Object)?\s+-First\s+5\s*$/i,
          /^ps\s*\|\s*sort\s+CPU\s+-Descending\s*\|\s*select\s+-First\s+5\s*$/i,
          /^Get-Process\s*\|\s*Sort\s+CPU\s+-Descending\s*\|\s*Select\s+-First\s+5\s*$/i
        ],
        hints: [
          'Pipeline : <code>Get-Process</code> → trier par CPU décroissant → garder les 5 premiers.',
          'Outils : <code>Sort-Object -Property CPU -Descending</code>, <code>Select-Object -First 5</code>',
          '<code>Get-Process | Sort-Object CPU -Descending | Select-Object -First 5</code>'
        ],
        explain: 'Alias usuels : <code>ps</code> = <code>Get-Process</code>, <code>sort</code> = <code>Sort-Object</code>, <code>select</code> = <code>Select-Object</code>. Pour rafraîchir en boucle : encapsuler dans <code>while ($true) { ...; Start-Sleep 2; Clear-Host }</code>. Filtrer par propriétaire : <code>Get-Process -IncludeUserName | Where-Object UserName -eq "DOMAIN\\suspect"</code>.'
      },
      {
        id: 'cli_ps_06', icon: '🌐', title: 'Get-NetTCPConnection — connexions actives',
        format: 'freestyle',
        scenario: `Liste toutes les <strong>connexions TCP établies</strong> (état Established) sur le poste via PowerShell, équivalent de <code>netstat -an | findstr ESTABLISHED</code>.`,
        placeholder: 'PS> ',
        patterns: [
          /^Get-NetTCPConnection\s+(-State\s+)?Established\s*$/i,
          /^Get-NetTCPConnection\s*\|\s*Where-Object\s+(-Property\s+)?State\s+-eq\s+["']?Established["']?\s*$/i,
          /^Get-NetTCPConnection\s*\|\s*\?\s+State\s+-eq\s+["']?Established["']?\s*$/i,
          /^Get-NetTCPConnection\s*\|\s*Where\s+State\s+-eq\s+["']?Established["']?\s*$/i
        ],
        hints: [
          'Cmdlet : <code>Get-NetTCPConnection</code>. Filtre direct via paramètre <code>-State</code>.',
          'Pattern : <code>Get-NetTCPConnection -State Established</code>',
          '<code>Get-NetTCPConnection -State Established</code> ou <code>... | Where-Object State -eq Established</code>'
        ],
        explain: 'Remplace <code>netstat -an</code> avec un objet riche : RemoteAddress, RemotePort, LocalPort, OwningProcess, State. Pour joindre le PID au process : <code>Get-NetTCPConnection -State Established | ForEach-Object { $_; (Get-Process -Id $_.OwningProcess).ProcessName }</code>. États : Listen, Established, TimeWait, CloseWait.'
      },
      {
        id: 'cli_ps_07', icon: '🛡', title: 'Test-Path & permissions',
        format: 'freestyle',
        scenario: `Vérifie les <strong>permissions ACL</strong> sur le dossier <code>C:\\Secrets\\</code> pour voir qui a les droits dessus.`,
        placeholder: 'PS> ',
        patterns: [
          /^Get-Acl\s+(-Path\s+)?["']?C:\\Secrets\\?["']?\s*$/i,
          /^Get-Acl\s+(-Path\s+)?["']?C:\\Secrets\\?["']?\s*\|\s*(Format-List|fl|Select-Object|select)\s*.*$/i,
          /^\(Get-Acl\s+(-Path\s+)?["']?C:\\Secrets\\?["']?\s*\)\.Access\s*$/i
        ],
        hints: [
          'Cmdlet : <code>Get-Acl</code>. Forme courte sans options spéciales : <code>Get-Acl CHEMIN</code>.',
          'Pour voir le détail des entrées : ajouter <code>.Access</code> ou pipeline vers <code>Format-List</code>.',
          '<code>Get-Acl "C:\\Secrets\\"</code> ou <code>(Get-Acl "C:\\Secrets\\").Access</code>'
        ],
        explain: '<code>Get-Acl</code> retourne un objet avec <code>.Owner</code>, <code>.Group</code>, <code>.Access</code> (liste des ACE). Pour les permissions effectives d\'un user spécifique : analyser les SIDs. Modifier : <code>Set-Acl</code>. Audit avancé : combiner avec <code>Get-Aduser</code> pour résoudre les SIDs en noms.'
      }
    ],

    // ════════ CLI DFIR — hard · freestyle TSK (7 ex) ═══════════════
    cli_dfir: [
      {
        id: 'cli_dfir_01', icon: '💽', title: 'mmls — table de partitions',
        format: 'freestyle',
        scenario: `Tu as une image disque <code>disk.dd</code> (acquisition <code>dd</code>). Affiche le <strong>tableau des partitions</strong> avec les offsets de début (cluster), longueurs, et types de partition.`,
        placeholder: '$ ',
        patterns: [
          /^mmls\s+disk\.dd\s*$/i,
          /^mmls\s+-t\s+(dos|gpt|mac|sun|bsd)\s+disk\.dd\s*$/i,
          /^sudo\s+mmls\s+disk\.dd\s*$/i
        ],
        hints: [
          'Commande du Sleuth Kit (TSK) qui liste les partitions : trois lettres, commence par <code>mm</code>.',
          'Forme : <code>mmls IMAGE</code>',
          '<code>mmls disk.dd</code> — détecte automatiquement le schéma (MBR/GPT)'
        ],
        explain: '<code>mmls</code> (media management list) du TSK. Donne : slot, start sector, end sector, length, description (Linux/NTFS/etc.). L\'offset de début est CRUCIAL pour passer ensuite à <code>fls -o OFFSET</code> ou <code>fsstat -o OFFSET</code>. Forcer le type : <code>mmls -t gpt</code> ou <code>-t dos</code>.'
      },
      {
        id: 'cli_dfir_02', icon: '📂', title: 'fls — lister fichiers d\'une partition',
        format: 'freestyle',
        scenario: `Sur la partition NTFS commençant à l'offset secteur <code>2048</code> de <code>disk.dd</code>, liste <strong>tous les fichiers récursivement</strong>.`,
        placeholder: '$ ',
        patterns: [
          /^fls\s+-r\s+-o\s+2048\s+disk\.dd\s*$/i,
          /^fls\s+-o\s+2048\s+-r\s+disk\.dd\s*$/i,
          /^fls\s+-rp\s+-o\s+2048\s+disk\.dd\s*$/i,
          /^fls\s+-o\s+2048\s+-rp\s+disk\.dd\s*$/i
        ],
        hints: [
          'Commande TSK : <code>fls</code> (file list). Options nécessaires : récursif + offset de partition.',
          '<code>-r</code> pour récursif, <code>-o OFFSET</code> pour démarrer à un secteur.',
          '<code>fls -r -o 2048 disk.dd</code>'
        ],
        explain: '<code>fls</code> liste les entrées d\'un FS (FAT/NTFS/ext/HFS+). Colonnes : type/name, inode number, name. Options : <code>-r</code> récursif, <code>-d</code> uniquement supprimés, <code>-D</code> uniquement les dossiers, <code>-p</code> chemin complet, <code>-m PREFIX</code> sortie format <code>mactime</code> (timeline).'
      },
      {
        id: 'cli_dfir_03', icon: '📥', title: 'icat — extraire un fichier par inode',
        format: 'freestyle',
        scenario: `Tu as identifié dans <code>fls</code> qu'un fichier suspect a l'<strong>inode 1564</strong> sur la partition offset 2048 de <code>disk.dd</code>. Extrais son contenu vers <code>extract.bin</code>.`,
        placeholder: '$ ',
        patterns: [
          /^icat\s+-o\s+2048\s+disk\.dd\s+1564\s*>\s*extract\.bin\s*$/i,
          /^icat\s+-o\s+2048\s+disk\.dd\s+1564\s*>>\s*extract\.bin\s*$/i,
          /^icat\s+disk\.dd\s+1564\s+-o\s+2048\s*>\s*extract\.bin\s*$/i
        ],
        hints: [
          'Commande TSK : <code>icat</code> (inode cat). Forme : <code>icat -o OFFSET IMAGE INODE</code>. Rediriger vers fichier.',
          'Pattern complet : <code>icat -o 2048 disk.dd 1564 > extract.bin</code>',
          '<code>icat -o 2048 disk.dd 1564 > extract.bin</code>'
        ],
        explain: '<code>icat</code> = "<em>inode cat</em>" : sort sur stdout les <em>data blocks</em> associés à un inode. Couplé à <code>fls</code> pour identifier l\'inode. Pour les fichiers supprimés mais récupérables : l\'inode peut encore exister (<code>fls -d</code>) et <code>icat</code> récupère les clusters. Vérifier intégrité avec <code>file extract.bin</code> + hash.'
      },
      {
        id: 'cli_dfir_04', icon: '🕰', title: 'mactime — timeline forensique',
        format: 'freestyle',
        scenario: `Tu as préparé un <strong>body file</strong> nommé <code>timeline.body</code> (issu de <code>fls -m</code>). Génère la <strong>timeline CSV</strong> chronologique.`,
        placeholder: '$ ',
        patterns: [
          /^mactime\s+-b\s+timeline\.body\s*$/i,
          /^mactime\s+-b\s+timeline\.body\s+-d\s*$/i,
          /^mactime\s+-b\s+timeline\.body\s*>\s*timeline\.csv\s*$/i,
          /^mactime\s+-d\s+-b\s+timeline\.body\s*>\s*timeline\.csv\s*$/i
        ],
        hints: [
          'Commande TSK : <code>mactime</code>. Option pour le body file : <code>-b</code>. Option pour la sortie CSV : <code>-d</code>.',
          'Forme : <code>mactime -b BODYFILE [-d] [> OUTPUT.csv]</code>',
          '<code>mactime -b timeline.body</code> ou avec CSV : <code>mactime -d -b timeline.body > timeline.csv</code>'
        ],
        explain: '<code>mactime</code> transforme un body file (lignes <code>pipe-separated</code> avec MAC times) en timeline chronologique. Body file généré par <code>fls -m "/" -r -o 2048 disk.dd > timeline.body</code>. Output : MTIME, ATIME, CTIME, CRTIME = 4 timestamps par entrée. <code>-d</code> = format CSV-friendly pour Excel/log2timeline.'
      },
      {
        id: 'cli_dfir_05', icon: '📊', title: 'fsstat — info système de fichiers',
        format: 'freestyle',
        scenario: `Affiche les <strong>caractéristiques du système de fichiers</strong> de la partition offset 2048 sur <code>disk.dd</code> : type, taille bloc, nb inodes, etc.`,
        placeholder: '$ ',
        patterns: [
          /^fsstat\s+-o\s+2048\s+disk\.dd\s*$/i,
          /^fsstat\s+-o\s+2048\s+-f\s+(ntfs|fat32|ext4)\s+disk\.dd\s*$/i,
          /^fsstat\s+disk\.dd\s+-o\s+2048\s*$/i
        ],
        hints: [
          'Commande TSK : <code>fsstat</code>. Option offset : <code>-o</code>.',
          'Forme : <code>fsstat -o OFFSET IMAGE</code>',
          '<code>fsstat -o 2048 disk.dd</code>'
        ],
        explain: '<code>fsstat</code> donne des infos cruciales : type de FS, signature, taille de cluster/block, nombre total de blocks/inodes, allocation bitmap, etc. Pour NTFS : info MFT (taille record, locations), pour FAT : copies de FAT, root dir cluster, etc. Aide à choisir les options de récupération.'
      },
      {
        id: 'cli_dfir_06', icon: '🧱', title: 'blkstat — état d\'un cluster',
        format: 'freestyle',
        scenario: `Tu veux savoir si le <strong>cluster 524288</strong> (offset partition 2048) est alloué ou libre, et lire son contenu hexa.`,
        placeholder: '$ ',
        patterns: [
          /^blkstat\s+-o\s+2048\s+disk\.dd\s+524288\s*$/i,
          /^blkstat\s+disk\.dd\s+524288\s+-o\s+2048\s*$/i,
          /^blkcat\s+-o\s+2048\s+disk\.dd\s+524288\s*$/i
        ],
        hints: [
          'Commandes TSK : <code>blkstat</code> (statut alloué/libre) ou <code>blkcat</code> (contenu).',
          'Forme : <code>blkstat -o OFFSET IMAGE BLOCK_NUM</code>',
          '<code>blkstat -o 2048 disk.dd 524288</code>'
        ],
        explain: 'Famille TSK des blocks : <code>blkstat</code> (alloué ?), <code>blkcat</code> (dump contenu), <code>blkls</code> (extraire tous les non-alloués pour carving). Pour récupérer un fichier supprimé sans inode connu : <code>blkls</code> + <code>foremost</code> ou <code>scalpel</code> sur la sortie.'
      },
      {
        id: 'cli_dfir_07', icon: '🩹', title: 'tsk_recover — récupération en masse',
        format: 'freestyle',
        scenario: `Récupère <strong>tous les fichiers supprimés</strong> de la partition offset 2048 de <code>disk.dd</code> vers le dossier <code>./recovered/</code>.`,
        placeholder: '$ ',
        patterns: [
          /^tsk_recover\s+-o\s+2048\s+disk\.dd\s+\.?\/?recovered\/?\s*$/i,
          /^tsk_recover\s+-o\s+2048\s+disk\.dd\s+recovered\s*$/i,
          /^tsk_recover\s+disk\.dd\s+\.?\/?recovered\/?\s+-o\s+2048\s*$/i
        ],
        hints: [
          'Commande TSK : <code>tsk_recover</code>. Forme : <code>tsk_recover -o OFFSET IMAGE OUT_DIR</code>.',
          'Le dossier de sortie doit exister ou être créé.',
          '<code>tsk_recover -o 2048 disk.dd ./recovered/</code>'
        ],
        explain: '<code>tsk_recover</code> extrait par défaut <strong>tous les fichiers supprimés ET allouéss</strong>. Pour ne récupérer QUE les supprimés : ajouter <code>-d</code>. Sortie organisée par chemin original. Couplé à <code>foremost</code> ou <code>scalpel</code> pour aller au-delà des fichiers reconnus par le FS (carving sur clusters non-alloués).'
      }
    ],

    // ════════ CLI NETWORK — hard · freestyle (7 ex) ════════════════
    cli_network: [
      {
        id: 'cli_network_01', icon: '🦈', title: 'tshark — filtre HTTP capture',
        format: 'freestyle',
        scenario: `Tu analyses <code>capture.pcap</code>. Extrais uniquement les <strong>requêtes HTTP GET</strong> avec leur URL.`,
        placeholder: '$ ',
        patterns: [
          /^tshark\s+-r\s+capture\.pcap\s+-Y\s+["']?http\.request\.method\s*==\s*["']?GET["']?["']?\s*$/i,
          /^tshark\s+-r\s+capture\.pcap\s+-Y\s+["']?http\.request\.method\s*==\s*["']?GET["']?["']?\s+-T\s+fields\s+-e\s+http\.host\s+-e\s+http\.request\.uri\s*$/i,
          /^tshark\s+-r\s+capture\.pcap\s+["']?-Y["']?\s+["']?http\.request\.method\s*==\s*["']?GET["']?["']?\s*$/i
        ],
        hints: [
          'Commande : <code>tshark</code> (Wireshark CLI). Options : <code>-r FICHIER</code> lit un pcap, <code>-Y FILTRE</code> applique un display filter.',
          'Display filter Wireshark : <code>http.request.method == "GET"</code>',
          '<code>tshark -r capture.pcap -Y \'http.request.method == "GET"\'</code>'
        ],
        explain: 'Filtres Wireshark utiles : <code>http.request.method == "POST"</code>, <code>tcp.port == 443</code>, <code>ip.addr == 192.168.1.1</code>, <code>dns.qry.name contains "evil"</code>. Pour formater la sortie : <code>-T fields -e CHAMP1 -e CHAMP2</code>. Pour exporter en JSON : <code>-T json</code>. Plus rapide que Wireshark GUI sur des fichiers >1 GB.'
      },
      {
        id: 'cli_network_02', icon: '📡', title: 'tcpdump — capturer HTTP en live',
        format: 'freestyle',
        scenario: `Sur l'interface <code>eth0</code>, capture en <strong>live</strong> tout le <strong>trafic HTTP (port 80)</strong> et écris dans <code>output.pcap</code>.`,
        placeholder: '$ ',
        patterns: [
          /^(sudo\s+)?tcpdump\s+-i\s+eth0\s+(-w\s+output\.pcap\s+)?(port\s+80|tcp\s+port\s+80)\s*(-w\s+output\.pcap)?\s*$/i,
          /^(sudo\s+)?tcpdump\s+-i\s+eth0\s+(tcp\s+)?port\s+80\s+-w\s+output\.pcap\s*$/i,
          /^(sudo\s+)?tcpdump\s+-w\s+output\.pcap\s+-i\s+eth0\s+(tcp\s+)?port\s+80\s*$/i
        ],
        hints: [
          'Commande : <code>tcpdump</code>. Options nécessaires : interface (<code>-i</code>), écriture (<code>-w</code>), filtre BPF.',
          'Filtre BPF (capture filter) pour HTTP : <code>port 80</code> ou <code>tcp port 80</code>.',
          '<code>sudo tcpdump -i eth0 port 80 -w output.pcap</code>'
        ],
        explain: 'BPF (Berkeley Packet Filter) ≠ display filter Wireshark. Syntaxe différente, plus brute. Exemples : <code>host 1.2.3.4</code>, <code>port 443</code>, <code>net 10.0.0.0/8</code>, <code>tcp[tcpflags] & tcp-syn != 0</code> (SYNs). Options utiles : <code>-c N</code> stop après N paquets, <code>-s 0</code> capture entier (sinon snaplen ~262144), <code>-G N</code> rotation toutes N secondes.'
      },
      {
        id: 'cli_network_03', icon: '🔌', title: 'ss — sockets en écoute',
        format: 'freestyle',
        scenario: `Liste tous les <strong>ports TCP en écoute</strong> sur la machine Linux (remplacement moderne de <code>netstat -tlnp</code>).`,
        placeholder: '$ ',
        patterns: [
          /^ss\s+-tlnp?\s*$/i,
          /^ss\s+-tln\s*$/i,
          /^(sudo\s+)?ss\s+-tlnp\s*$/i,
          /^ss\s+-(t|l|n|p)*tlnp(t|l|n|p)*\s*$/i,
          /^ss\s+-l\s+-t\s+-n\s*$/i
        ],
        hints: [
          'Commande : <code>ss</code> (socket statistics). Options : <code>-t</code> TCP, <code>-l</code> listening, <code>-n</code> numérique (pas de DNS), <code>-p</code> process associé.',
          'Combinaison classique : <code>-tlnp</code>',
          '<code>ss -tlnp</code> (avec sudo pour voir les PIDs des autres users)'
        ],
        explain: '<code>ss</code> remplace <code>netstat</code> (plus rapide, plus de fonctionnalités). Pour UDP : <code>-u</code>. Pour les sockets unix : <code>-x</code>. Toutes (établies + listening) : <code>-a</code>. Filtre par état : <code>ss state established</code>. Filtre par port : <code>ss -tn dport = :443</code>.'
      },
      {
        id: 'cli_network_04', icon: '🔍', title: 'dig — résolution DNS',
        format: 'freestyle',
        scenario: `Récupère uniquement les <strong>enregistrements MX</strong> (mail exchangers) du domaine <code>example.ch</code>, en sortie courte (juste les valeurs, pas le bloc complet).`,
        placeholder: '$ ',
        patterns: [
          /^dig\s+(\+short\s+)?example\.ch\s+MX\s*(\+short)?\s*$/i,
          /^dig\s+MX\s+example\.ch\s+\+short\s*$/i,
          /^dig\s+\+short\s+MX\s+example\.ch\s*$/i,
          /^dig\s+\+short\s+example\.ch\s+MX\s*$/i
        ],
        hints: [
          'Commande : <code>dig</code>. Type d\'enregistrement après le domaine. Option pour sortie courte : <code>+short</code>.',
          'Forme : <code>dig +short DOMAINE TYPE</code>',
          '<code>dig +short example.ch MX</code>'
        ],
        explain: '<code>dig</code> (Domain Information Groper) : outil de référence pour DNS. Types : A, AAAA, MX, TXT, NS, SOA, CNAME, PTR, SRV, CAA. Options : <code>+short</code> minimal, <code>+trace</code> trace complète depuis racine, <code>@8.8.8.8</code> serveur spécifique, <code>-x IP</code> reverse PTR. Alternative moderne : <code>delv</code>, <code>kdig</code>.'
      },
      {
        id: 'cli_network_05', icon: '🆔', title: 'whois — info domaine/IP',
        format: 'freestyle',
        scenario: `Tu enquêtes sur l'IP suspecte <code>203.0.113.7</code> qui apparaît dans tes logs. Récupère les <strong>informations whois</strong> pour identifier le propriétaire/registrar.`,
        placeholder: '$ ',
        patterns: [
          /^whois\s+203\.0\.113\.7\s*$/i,
          /^whois\s+-h\s+\S+\s+203\.0\.113\.7\s*$/i
        ],
        hints: [
          'Commande quasi-éponyme : <code>whois</code>.',
          'Forme la plus simple : <code>whois CIBLE</code>',
          '<code>whois 203.0.113.7</code>'
        ],
        explain: 'Pour les IPs, <code>whois</code> retourne le bloc d\'attribution (RIPE, ARIN, APNIC...). Info clé : <code>OrgName</code>, <code>NetRange</code>, <code>Country</code>, <code>OrgAbuseEmail</code>. Pour signaler un abus : utiliser OrgAbuseEmail. Pour les domaines, info : registrar, dates création/expiration, name servers, registrant (souvent masqué via WHOIS Privacy maintenant).'
      },
      {
        id: 'cli_network_06', icon: '🌐', title: 'curl — récupérer headers HTTP',
        format: 'freestyle',
        scenario: `Tu veux voir <strong>uniquement les en-têtes HTTP</strong> retournés par <code>https://example.ch/login</code>, sans télécharger le corps de la réponse. <strong>Suis les redirections</strong> si présentes.`,
        placeholder: '$ ',
        patterns: [
          /^curl\s+-I\s+-L\s+https:\/\/example\.ch\/login\s*$/i,
          /^curl\s+-L\s+-I\s+https:\/\/example\.ch\/login\s*$/i,
          /^curl\s+-IL\s+https:\/\/example\.ch\/login\s*$/i,
          /^curl\s+-LI\s+https:\/\/example\.ch\/login\s*$/i,
          /^curl\s+--head\s+--location\s+https:\/\/example\.ch\/login\s*$/i
        ],
        hints: [
          'Options : <code>-I</code> (HEAD = headers seulement), <code>-L</code> (suivre redirections).',
          'Forme : <code>curl -I -L URL</code>',
          '<code>curl -IL https://example.ch/login</code>'
        ],
        explain: 'Options curl utiles : <code>-I</code> méthode HEAD (headers only), <code>-L</code> follow redirects, <code>-v</code> verbose (TLS handshake, etc.), <code>-k</code> insecure (skip TLS verif — DANGEREUX), <code>-x PROXY</code>, <code>-d "data"</code> POST body, <code>-H "Header: value"</code>, <code>-o OUTPUT</code> sauvegarde, <code>-w "%{http_code}"</code> stats.'
      },
      {
        id: 'cli_network_07', icon: '🛰', title: 'nmap — scan rapide',
        format: 'freestyle',
        scenario: `Tu enquêtes sur un serveur potentiellement compromis à <code>10.0.0.5</code>. Effectue un <strong>scan rapide des 100 ports les plus communs</strong> (option <code>-F</code> de nmap).`,
        placeholder: '$ ',
        patterns: [
          /^nmap\s+-F\s+10\.0\.0\.5\s*$/i,
          /^nmap\s+10\.0\.0\.5\s+-F\s*$/i,
          /^(sudo\s+)?nmap\s+-F\s+10\.0\.0\.5\s*$/i,
          /^nmap\s+-F\s+-Pn\s+10\.0\.0\.5\s*$/i,
          /^nmap\s+-Pn\s+-F\s+10\.0\.0\.5\s*$/i
        ],
        hints: [
          'Commande : <code>nmap</code>. L\'option pour le scan rapide (100 ports communs) est une seule lettre majuscule.',
          'Forme : <code>nmap -F CIBLE</code>',
          '<code>nmap -F 10.0.0.5</code>'
        ],
        explain: '<code>nmap -F</code> scanne uniquement les 100 ports les plus communs (au lieu des 1000 par défaut). Autres options clés : <code>-sS</code> SYN scan (rapide, furtif, root), <code>-sV</code> détection de version, <code>-O</code> OS detection, <code>-p-</code> tous les 65535 ports, <code>-Pn</code> skip host discovery, <code>-A</code> agressif. <strong>Important légal :</strong> scanner sans autorisation = art. 143bis CP (sanction pénale).'
      }
    ]
  };


  // ────────────────────────────────────────────────────────────────
  // HELPERS de normalisation et de validation
  // ────────────────────────────────────────────────────────────────

  function normalizeCommand(s) {
    return String(s || '')
      .replace(/^\s*(PS\s*>|\$\s|>)\s*/i, '')
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
        <span class="ex-badge ${difficulty}">QCM</span>
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

    const shuffled = ex.choices.map((c, i) => ({ ...c, idx: i })).sort(() => Math.random() - 0.5);

    shuffled.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'qcm-choice';
      btn.style.cssText = 'text-align:left;padding:.6rem .9rem;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:8px;cursor:pointer;font-size:.85rem;line-height:1.4';
      btn.innerHTML = `<span style="color:var(--dim);margin-right:.5rem">${String.fromCharCode(65 + i)}.</span>${choice.text}`;
      btn.onclick = () => {
        choicesContainer.querySelectorAll('button').forEach(b => b.disabled = true);
        btn.style.borderColor = choice.correct ? 'var(--green)' : 'var(--red)';
        btn.style.background = choice.correct ? 'rgba(48,232,138,.15)' : 'rgba(255,80,80,.15)';
        fb.className = 'ex-feedback ' + (choice.correct ? 'correct' : 'wrong');
        fb.innerHTML = (choice.correct ? '✓ Correct ! ' : '✗ Incorrect. ') + choice.explain;
        nextBtn.style.display = 'inline-block';
        if (choice.correct) {
          const card = btn.closest('.ex-card');
          if (card) card.className = 'ex-card solved';
          if (typeof incSolved === 'function' && typeof STATE !== 'undefined' && !STATE.hintUsed) {
            incSolved(cat);
          }
        }
      };
      choicesContainer.appendChild(btn);
    });

    nextBtn.onclick = () => { if (typeof newExercise === 'function') newExercise(); };
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

      h1.onclick = () => {
        if (typeof STATE !== 'undefined') STATE.hintUsed = true;
        fb.className = 'ex-feedback hint';
        fb.innerHTML = '💡 ' + ex.hints[0];
        h1.disabled = true; h1.style.opacity = '.4';
        h2.disabled = false; h2.style.opacity = '1';
      };
      h2.onclick = () => {
        if (typeof STATE !== 'undefined') STATE.hintUsed = true;
        fb.className = 'ex-feedback hint';
        fb.innerHTML = '💡💡 ' + ex.hints[1];
        h2.disabled = true; h2.style.opacity = '.4';
        h3.disabled = false; h3.style.opacity = '1';
      };
      h3.onclick = () => {
        if (typeof STATE !== 'undefined') STATE.hintUsed = true;
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
  // DISPATCHER + REGISTRATION
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

  if (typeof window !== 'undefined') {
    window.genCLIBasics  = () => genCLI('cli_basics');
    window.genCLILogs    = () => genCLI('cli_logs');
    window.genCLIPipes   = () => genCLI('cli_pipes');
    window.genCLIExtract = () => genCLI('cli_extract');
    window.genCLIPs      = () => genCLI('cli_ps');
    window.genCLIDfir    = () => genCLI('cli_dfir');
    window.genCLINetwork = () => genCLI('cli_network');

    if (typeof GENERATORS !== 'undefined') {
      GENERATORS.cli_basics  = window.genCLIBasics;
      GENERATORS.cli_logs    = window.genCLILogs;
      GENERATORS.cli_pipes   = window.genCLIPipes;
      GENERATORS.cli_extract = window.genCLIExtract;
      GENERATORS.cli_ps      = window.genCLIPs;
      GENERATORS.cli_dfir    = window.genCLIDfir;
      GENERATORS.cli_network = window.genCLINetwork;
    }
  }

})();
