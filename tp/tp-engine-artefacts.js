// ═══════════════════════════════════════════════════════════════════
// tp-engine-artefacts.js — CAS-IN Travaux Pratiques (delta v98)
// 4 TP "artefacts" : EXT4, Windows Event Logs, Linux artefacts, macOS artefacts
// Chargé APRÈS tp-engine.js (utilise rand, STATE, GENERATORS, helpers)
// Réutilise buildQCMCard / handleChoice si déjà chargés (tp-engine-easy.js)
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // HELPER : buildQCMCard standalone (si tp-engine-easy.js absent)
  // ────────────────────────────────────────────────────────────────
  function buildQCMCard(opts) {
    const id = opts.prefix;
    const div = document.createElement('div');
    div.className = 'ex-card';
    const choicesHTML = opts.choices.map((c, i) => `
      <button class="ex-choice" data-idx="${i}" id="ch-${id}-${i}">
        <span class="ex-choice-letter">${String.fromCharCode(65+i)}</span>
        <span class="ex-choice-text">${c.text}</span>
      </button>`).join('');

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-${id}">${opts.icon || '🧩'}</div>
        <div class="ex-title">${opts.title}</div>
        <span class="ex-badge easy">${opts.badge || 'artefact'}</span>
      </div>
      <div class="ex-scenario">${opts.scenario}</div>
      <div class="ex-choices">${choicesHTML}</div>
      ${opts.hintFn ? `<div style="margin-top:.6rem"><button class="btn-hint" id="btn-hint-${id}">💡 Indice</button></div>` : ''}
      <div class="ex-feedback" id="ex-feedback-${id}"></div>
      <button class="btn-next" id="btn-next-${id}" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    setTimeout(() => {
      opts.choices.forEach((c, i) => {
        const btn = div.querySelector(`#ch-${id}-${i}`);
        if (btn) btn.addEventListener('click', () => handleChoice(id, i, c.correct, c.explain, opts.choices));
      });
      if (opts.hintFn) {
        const hb = div.querySelector(`#btn-hint-${id}`);
        if (hb) hb.addEventListener('click', () => {
          if (typeof markHintUsed === 'function') markHintUsed();
          const fb = document.getElementById(`ex-feedback-${id}`);
          if (fb) { fb.className = 'ex-feedback correct'; fb.innerHTML = `💡 ${opts.hintFn()}`; }
        });
      }
    }, 50);
    return div;
  }

  function handleChoice(prefix, idx, isCorrect, explain, allChoices) {
    const fb = document.getElementById(`ex-feedback-${prefix}`);
    const choiceBtn = document.getElementById(`ch-${prefix}-${idx}`);
    const nextBtn = document.getElementById(`btn-next-${prefix}`);
    if (!fb || !choiceBtn) return;

    if (isCorrect) {
      choiceBtn.classList.add('correct');
      allChoices.forEach((_, i) => {
        const b = document.getElementById(`ch-${prefix}-${i}`);
        if (b) b.disabled = true;
      });
      fb.className = 'ex-feedback correct';
      fb.innerHTML = `✓ Correct ! ${explain}`;
      const card = choiceBtn.closest('.ex-card');
      if (card) card.classList.add('solved');
      const numEl = document.getElementById(`ex-num-${prefix}`);
      if (numEl) numEl.classList.add('solved');
      if (nextBtn) nextBtn.style.display = 'inline-flex';
      if (typeof STATE !== 'undefined' && !STATE.hintUsed && typeof incSolved === 'function') {
        incSolved(STATE.cat);
      }
    } else {
      choiceBtn.classList.add('wrong');
      choiceBtn.disabled = true;
      fb.className = 'ex-feedback wrong';
      fb.innerHTML = `✗ ${explain || 'Mauvaise réponse.'}`;
      if (typeof breakStreak === 'function') breakStreak();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 1 : EXT4 / Inodes Linux
  // ════════════════════════════════════════════════════════════════

  function genEXT4() {
    const qType = rand(0, 6);
    const opts = { prefix: 'ext4', icon: '🐧', title: 'EXT2/EXT3/EXT4 — Inodes & journal', badge: 'artefact' };

    if (qType === 0) {
      // Timestamps : EXT4 ajoute crtime
      const choices = [
        { text: '4 timestamps : <strong>atime, ctime, mtime, crtime</strong> (crtime = creation, EXT4 only)', correct: true,
          explain: `EXT4 ajoute <strong>crtime</strong> (birth/creation time) par rapport à EXT2/EXT3 qui n'avaient que 3 timestamps. Lecture : <code>stat -c '%w'</code> (birth) sur Linux récent (kernel ≥ 4.11 et util-linux ≥ 2.32). <code>debugfs</code> permet de lire les 4 en hex (<code>stat &lt;inode&gt;</code>).` },
        { text: '3 timestamps : atime, ctime, mtime', correct: false,
          explain: `Vrai pour EXT2/EXT3, mais EXT4 ajoute crtime (creation/birth time) dans le champ <code>i_crtime</code> de l'inode.` },
        { text: '5 timestamps : atime, ctime, mtime, dtime, crtime', correct: false,
          explain: `dtime (deletion time) n'est plus utilisé en EXT4 (présent en EXT2/EXT3 mais fixé à 0 quand le fichier existe). On compte 4 timestamps actifs.` },
        { text: '2 timestamps : ctime, mtime', correct: false,
          explain: `Tous les systèmes de fichiers Unix modernes maintiennent au moins atime/ctime/mtime. EXT4 va plus loin avec crtime.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Combien de timestamps un <strong>inode EXT4</strong> contient-il, et lesquels ?`,
        choices,
        hintFn: () => `EXT2/3 : 3 timestamps (atime, ctime, mtime). EXT4 ajoute crtime (creation). Attention : ctime ≠ creation time, c'est <em>change time</em> = modif métadonnées inode.`
      });
    }

    if (qType === 1) {
      // ctime vs crtime confusion
      const choices = [
        { text: '<strong>ctime</strong> = change time (métadonnées inode modifiées : permissions, owner, etc.). <strong>crtime</strong> = creation/birth time (date de création réelle).', correct: true,
          explain: `Confusion classique : <strong>ctime</strong> change à chaque modif de l'inode (chmod, chown, mv, taille...) tandis que <strong>crtime/btime</strong> est fixé une seule fois à la création. <code>stat</code> affiche : Access (atime), Modify (mtime), Change (ctime), Birth (crtime).` },
        { text: 'ctime et crtime sont identiques, deux noms du même timestamp', correct: false,
          explain: `Faux. ctime change souvent (toute modif métadonnées). crtime est posé à la création et reste fixe.` },
        { text: 'ctime = creation time, crtime = checked time (dernier fsck)', correct: false,
          explain: `Erreur classique mais incorrecte. ctime = <strong>change</strong> time, pas creation. crtime n'a rien à voir avec fsck.` },
        { text: 'ctime = clock time système, crtime = creation time par utilisateur', correct: false,
          explain: `ctime se réfère bien à un horodatage, mais sa sémantique est "change time" (métadonnées). Pas un clock système.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quelle est la différence entre <strong>ctime</strong> et <strong>crtime</strong> sur EXT4 ?`,
        choices,
        hintFn: () => `Sur Unix, ctime = change time (métadonnées modifiées). crtime/btime = birth/creation time (uniquement EXT4, XFS, Btrfs récents). Confusion fréquente en forensique.`
      });
    }

    if (qType === 2) {
      // Magic number superbloc
      const choices = [
        { text: '<strong>0xEF53</strong> (53EF en little-endian sur disque)', correct: true,
          explain: `Le magic number EXT2/EXT3/EXT4 est <strong>0xEF53</strong> dans le superbloc à l'offset 0x38 (56 décimal) depuis le début du superbloc, lui-même à l'offset 1024 du début de la partition. Reconnaissable avec <code>hexdump -s 1080 -n 2 disk.img</code> ou <code>file -s</code>.` },
        { text: '0x4D5A (MZ)', correct: false,
          explain: `0x4D5A = "MZ" = magic d'un exécutable Windows PE. Aucun rapport avec EXT.` },
        { text: '0xCAFEBABE', correct: false,
          explain: `0xCAFEBABE = magic d'un fichier Java class ou d'un Mach-O Universal binary (fat binary). Pas EXT.` },
        { text: '0xFEEDBABE', correct: false,
          explain: `Pas un magic standard. (0xFEEDFACE = Mach-O 32-bit, 0xFEEDFACF = Mach-O 64-bit.)` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel est le <strong>magic number</strong> du superbloc EXT2/EXT3/EXT4 ?`,
        choices,
        hintFn: () => `Offset 1080 (= 1024 + 56) du début de partition. Permet à <code>file -s</code> et aux outils forensiques d'identifier le FS. Stocké en little-endian : sur disque on voit "53 EF".`
      });
    }

    if (qType === 3) {
      // Journal EXT4 = jbd2
      const choices = [
        { text: '<strong>jbd2</strong> (Journaling Block Device 2)', correct: true,
          explain: `<strong>jbd2</strong> est le système de journalisation de EXT4 (et XFS). Successeur de jbd (EXT3). Stocké dans un inode réservé (inode 8) dont le contenu est invisible via le FS normal. Format documenté dans le kernel Linux (fs/jbd2/). Analyse forensique : <code>debugfs</code> ou <code>jcat</code>.` },
        { text: 'NTFS $LogFile', correct: false,
          explain: `$LogFile est le journal de NTFS (Windows), pas EXT. Concept similaire mais format totalement différent.` },
        { text: 'ZFS Intent Log (ZIL)', correct: false,
          explain: `ZIL est le journal de ZFS, pas EXT4. EXT4 utilise jbd2.` },
        { text: 'systemd-journald', correct: false,
          explain: `systemd-journald gère les logs système (journalctl), pas la journalisation du système de fichiers. Confusion fréquente !` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Comment s'appelle le système de <strong>journalisation</strong> utilisé par EXT4 ?`,
        choices,
        hintFn: () => `EXT4 et XFS utilisent jbd2 (Journaling Block Device 2). EXT3 utilisait jbd (premier du nom). Inode réservé n°8. Permet recovery après crash.`
      });
    }

    if (qType === 4) {
      // Mode journal par défaut
      const choices = [
        { text: '<strong>ordered</strong> — métadonnées journalisées, données écrites <em>avant</em> que la transaction métadonnées soit committée', correct: true,
          explain: `<strong>data=ordered</strong> est le mode par défaut depuis EXT3. Compromis performance/intégrité : seules les métadonnées sont dans le journal, mais l'ordre garantit qu'on ne voit jamais des métadonnées pointant vers des données non écrites. Les 2 autres modes : <strong>journal</strong> (data + métadonnées dans le journal, plus lent mais plus sûr) et <strong>writeback</strong> (pas d'ordre, plus rapide mais risque de corruption).` },
        { text: 'journal — toutes les données ET métadonnées dans le journal', correct: false,
          explain: `Mode <code>data=journal</code> existe mais n'est pas le défaut (plus sûr mais 2× plus lent : tout est écrit 2 fois). Activable explicitement.` },
        { text: 'writeback — pas d\'ordre garanti, performance max', correct: false,
          explain: `Mode <code>data=writeback</code> existe mais pas le défaut. Risque : voir des métadonnées pointant vers d'anciennes données après crash.` },
        { text: 'sync — synchrone, pas de journal', correct: false,
          explain: `Pas un mode EXT4 standard. <code>sync</code> est une option de mount qui force toute écriture synchrone, indépendamment du mode journal.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel est le <strong>mode de journalisation par défaut</strong> de EXT4 ?`,
        choices,
        hintFn: () => `3 modes : journal (data + meta, lent), <strong>ordered</strong> (meta seulement + ordre, défaut), writeback (rapide, risqué). Voir <code>mount -o data=...</code> ou <code>/proc/mounts</code>.`
      });
    }

    if (qType === 5) {
      // Outil pour parser un inode
      const choices = [
        { text: '<strong>debugfs</strong> (e2fsprogs) — shell interactif sur image EXT', correct: true,
          explain: `<code>debugfs disk.img</code> ouvre un shell où l'on peut faire <code>stat &lt;inode&gt;</code>, <code>cat &lt;inode&gt;</code>, <code>ls -l</code>, <code>logdump</code> pour le journal jbd2. <strong>The Sleuth Kit</strong> (<code>fls</code>, <code>icat</code>, <code>istat</code>) offre une alternative cross-FS plus orientée forensique.` },
        { text: 'regedit', correct: false,
          explain: `regedit = éditeur de registre Windows. Aucun rapport avec EXT4.` },
        { text: 'Volatility', correct: false,
          explain: `Volatility = analyse mémoire RAM, pas système de fichiers sur disque.` },
        { text: 'Wireshark', correct: false,
          explain: `Wireshark = analyse PCAP réseau.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel outil permet d'<strong>inspecter directement</strong> un inode EXT4 (timestamps, blocs alloués, journal) ?`,
        choices,
        hintFn: () => `e2fsprogs fournit debugfs, dumpe2fs, e2fsck, mke2fs. Pour la forensique : The Sleuth Kit (icat, fls, istat) cross-FS. extundelete pour récupération de fichiers supprimés.`
      });
    }

    // qType === 6 : extundelete vs alternatives
    const choices = [
      { text: '<strong>extundelete</strong> — récupère depuis le journal jbd2 et les inodes orphelins', correct: true,
        explain: `<strong>extundelete</strong> est l'outil dédié pour EXT3/EXT4. Lit le journal pour retrouver les anciens états d'inodes (avant suppression). Limite : EXT4 zéroïse les pointeurs de blocs à la suppression, donc seul ce qui est encore dans le journal est récupérable. PhotoRec (carving par signature) peut compléter mais perd les noms.` },
      { text: 'recuva.exe', correct: false,
        explain: `Recuva est un outil Windows pour NTFS/FAT, ne lit pas EXT4.` },
      { text: 'TestDisk pour la table des partitions', correct: false,
        explain: `TestDisk récupère des partitions perdues, pas des fichiers supprimés à l'intérieur d'un FS EXT4 sain.` },
      { text: 'foremost ne fonctionne que sur FAT', correct: false,
        explain: `foremost est un carver générique (signatures) qui fonctionne sur tout type de support brut, EXT4 inclus. Mais il perd les métadonnées (noms, timestamps).` },
    ].sort(() => Math.random() - 0.5);
    return buildQCMCard({
      ...opts,
      scenario: `Quel outil tente de <strong>récupérer des fichiers supprimés</strong> sur EXT3/EXT4 en exploitant le journal ?`,
      choices,
      hintFn: () => `EXT4 efface les pointeurs de blocs à la suppression (contrairement à EXT3 qui les gardait). extundelete consulte le journal jbd2 pour retrouver les anciens états avant zéroïsation. PhotoRec/foremost en complément (carving par signature).`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TP 2 : Windows Event Logs (EVTX, Sysmon)
  // ════════════════════════════════════════════════════════════════

  function genWinEvents() {
    const qType = rand(0, 6);
    const opts = { prefix: 'winev', icon: '📋', title: 'Windows — Event Logs', badge: 'artefact' };

    if (qType === 0) {
      // Event ID 4624
      const events = [
        { id: 4624, label: 'Logon réussi', wrong1: 4625, wrong2: 4634, wrong3: 4648 },
        { id: 4625, label: 'Échec de logon', wrong1: 4624, wrong2: 4647, wrong3: 4776 },
        { id: 4634, label: 'Logoff (déconnexion)', wrong1: 4624, wrong2: 4647, wrong3: 4625 },
        { id: 4647, label: 'Logoff initié par l\'utilisateur', wrong1: 4634, wrong2: 4624, wrong3: 4648 },
        { id: 4648, label: 'Logon avec credentials explicites (runas)', wrong1: 4624, wrong2: 4672, wrong3: 4688 },
        { id: 4672, label: 'Privilèges spéciaux assignés au logon', wrong1: 4624, wrong2: 4625, wrong3: 4648 },
        { id: 4688, label: 'Process creation', wrong1: 4689, wrong2: 4624, wrong3: 1 },
      ];
      const target = events[rand(0, events.length - 1)];
      const wrongLabels = {
        4624: 'Logon réussi', 4625: 'Échec de logon', 4634: 'Logoff (déconnexion)',
        4647: 'Logoff initié par l\'utilisateur', 4648: 'Logon avec credentials explicites (runas)',
        4672: 'Privilèges spéciaux assignés', 4688: 'Process creation', 4689: 'Process termination',
        4776: 'Validation NTLM', 1: 'Sysmon — Process Create'
      };
      const choices = [
        { text: target.label, correct: true,
          explain: `<strong>Event ID ${target.id}</strong> dans le journal <code>Security</code> = <strong>${target.label}</strong>. Documentation Microsoft : <code>docs.microsoft.com/en-us/windows/security/threat-protection/auditing/event-${target.id}</code>.` },
        { text: wrongLabels[target.wrong1] || ('Event ' + target.wrong1), correct: false,
          explain: `${wrongLabels[target.wrong1]} = Event ID <strong>${target.wrong1}</strong>, pas ${target.id}.` },
        { text: wrongLabels[target.wrong2] || ('Event ' + target.wrong2), correct: false,
          explain: `${wrongLabels[target.wrong2]} = Event ID <strong>${target.wrong2}</strong>, pas ${target.id}.` },
        { text: wrongLabels[target.wrong3] || ('Event ' + target.wrong3), correct: false,
          explain: `${wrongLabels[target.wrong3]} = Event ID <strong>${target.wrong3}</strong>, pas ${target.id}.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `À quoi correspond l'<strong>Event ID ${target.id}</strong> dans le journal Security de Windows ?`,
        choices,
        hintFn: () => `Logon : 4624 (succès) / 4625 (échec) / 4634 (logoff). Privilèges : 4672. Process : 4688 (create) / 4689 (terminate). Runas/explicit : 4648.`
      });
    }

    if (qType === 1) {
      // LogonType
      const types = [
        { code: 2, label: 'Interactive — utilisateur à la console (clavier local)' },
        { code: 3, label: 'Network — accès SMB, IPC$, partages réseau' },
        { code: 4, label: 'Batch — tâche planifiée' },
        { code: 5, label: 'Service — démarrage d\'un service Windows' },
        { code: 7, label: 'Unlock — déverrouillage après lockscreen' },
        { code: 8, label: 'NetworkCleartext — credentials en clair (rare)' },
        { code: 10, label: 'RemoteInteractive — RDP / Terminal Server' },
        { code: 11, label: 'CachedInteractive — credentials cachés (offline)' },
      ];
      const target = types[rand(0, types.length - 1)];
      const others = types.filter(t => t !== target);
      const distractors = [];
      while (distractors.length < 3) {
        distractors.push(others.splice(rand(0, others.length - 1), 1)[0]);
      }
      const choices = [
        { text: target.label, correct: true,
          explain: `<strong>LogonType ${target.code}</strong> = <strong>${target.label}</strong>. Champ critique des Event 4624/4625 pour la triage forensique (distinguer console vs RDP vs réseau).` },
        ...distractors.map(d => ({
          text: d.label, correct: false,
          explain: `Ça c'est LogonType <strong>${d.code}</strong>, pas ${target.code}.`
        }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Dans un Event ID 4624, le champ <strong>LogonType ${target.code}</strong> indique quel type de connexion ?`,
        choices,
        hintFn: () => `Types courants : 2 (interactive console), 3 (network/SMB), 4 (batch/task), 5 (service), 7 (unlock), 10 (RDP/RemoteInteractive), 11 (cached). Crucial en triage : 3 + IP externe = pivot SMB possible.`
      });
    }

    if (qType === 2) {
      // Format EVTX
      const choices = [
        { text: '<strong>.evtx</strong> — XML binaire compressé, depuis Windows Vista / Server 2008', correct: true,
          explain: `Le format <strong>.evtx</strong> remplace l'ancien <code>.evt</code> binaire (XP/2003). Stockage : <code>C:\\Windows\\System32\\winevt\\Logs\\</code>. Lecture native : Event Viewer (eventvwr.msc), <code>wevtutil qe</code>, <code>Get-WinEvent</code> PowerShell. Outils forensiques tiers : <code>EvtxECmd</code> (Eric Zimmerman), <code>python-evtx</code>, libevtx.` },
        { text: '.evt binaire propriétaire (depuis Windows 3.1)', correct: false,
          explain: `.evt = format pré-Vista (NT 4.0, 2000, XP, 2003). Remplacé par .evtx en 2007.` },
        { text: '.log texte ASCII rotatif', correct: false,
          explain: `Format des logs Unix (/var/log/...), pas Windows. Windows utilise un format binaire structuré.` },
        { text: '.syslog au format RFC 5424', correct: false,
          explain: `Syslog est un protocole Unix (RFC 3164/5424), pas le format natif Windows. Windows peut <em>forwarder</em> ses events en syslog mais le stockage natif est .evtx.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Sous quel <strong>format de fichier</strong> Windows Vista et plus récent stocke-t-il ses journaux d'événements ?`,
        choices,
        hintFn: () => `EVTX = XML binaire (depuis Vista/2008). EVT = ancien format (XP/2003). Path : <code>%SystemRoot%\\System32\\winevt\\Logs\\</code>. Outils forensiques majeurs : EvtxECmd (Eric Zimmerman) et chainsaw (Sigma rules sur EVTX).`
      });
    }

    if (qType === 3) {
      // Localisation des EVTX
      const choices = [
        { text: '<code>C:\\Windows\\System32\\winevt\\Logs\\</code>', correct: true,
          explain: `Path standard depuis Vista. Contient Security.evtx, System.evtx, Application.evtx, plus les journaux applicatifs (<code>Microsoft-Windows-*</code> dont Sysmon, PowerShell, TaskScheduler, etc.). Acquisition forensique = copier ce dossier entier.` },
        { text: '<code>C:\\Windows\\System32\\config\\</code>', correct: false,
          explain: `Ce dossier contient les <em>ruches du registre</em> (SAM, SYSTEM, SOFTWARE, SECURITY) — pas les EVTX. À acquérir aussi en forensique mais distinct.` },
        { text: '<code>C:\\ProgramData\\EventLogs\\</code>', correct: false,
          explain: `Path inventé. Aucun journal Windows n'y est stocké par défaut.` },
        { text: '<code>%APPDATA%\\Microsoft\\Logs\\</code>', correct: false,
          explain: `%APPDATA% est le profil utilisateur, alors que les EVTX sont machine-wide (System32).` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Où sont stockés les fichiers <strong>EVTX</strong> sur un système Windows moderne ?`,
        choices,
        hintFn: () => `Path canonique : <code>%SystemRoot%\\System32\\winevt\\Logs\\</code>. Indispensable à copier lors d'une acquisition forensique (avec C:\\Windows\\System32\\config\\ pour le registre).`
      });
    }

    if (qType === 4) {
      // Sysmon Event ID 1
      const sysmon = [
        { id: 1, label: 'Process Create — détail complet (CommandLine, hash, parent)' },
        { id: 3, label: 'Network connection' },
        { id: 7, label: 'Image loaded (DLL)' },
        { id: 11, label: 'File create' },
        { id: 13, label: 'Registry value set' },
        { id: 22, label: 'DNS query' },
      ];
      const target = sysmon[rand(0, sysmon.length - 1)];
      const others = sysmon.filter(s => s !== target);
      const distractors = [];
      while (distractors.length < 3) {
        distractors.push(others.splice(rand(0, others.length - 1), 1)[0]);
      }
      const choices = [
        { text: target.label, correct: true,
          explain: `<strong>Sysmon Event ID ${target.id}</strong> = <strong>${target.label}</strong>. Journal dédié : <code>Microsoft-Windows-Sysmon/Operational</code>. Sysmon (Sysinternals, Mark Russinovich) enrichit massivement la télémétrie Windows pour la détection.` },
        ...distractors.map(d => ({
          text: d.label, correct: false,
          explain: `Sysmon Event ID <strong>${d.id}</strong>, pas ${target.id}.`
        }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Dans le journal Sysmon, à quoi correspond l'<strong>Event ID ${target.id}</strong> ?`,
        choices,
        hintFn: () => `Sysmon events principaux : 1 (process create), 3 (network), 7 (DLL load), 8 (CreateRemoteThread), 11 (file create), 13 (registry set), 22 (DNS), 25 (process tampering).`
      });
    }

    if (qType === 5) {
      // Quel journal pour PowerShell scripts
      const choices = [
        { text: '<code>Microsoft-Windows-PowerShell/Operational</code> — Event ID <strong>4104</strong> (script block logging)', correct: true,
          explain: `Le journal <code>Microsoft-Windows-PowerShell/Operational</code> contient l'Event ID <strong>4104</strong> qui logue le <em>script block</em> exécuté (le code lui-même). Active par défaut depuis PS 5.0 (Windows 10). Crucial pour détecter des scripts obfusqués (la deobfuscation finale apparaît dans 4104).` },
        { text: 'Security.evtx, Event 4688 uniquement', correct: false,
          explain: `4688 (Process Create) loge l'exécution de <code>powershell.exe</code> et sa ligne de commande, mais pas le contenu du script lui-même. 4104 (PS Operational) loge le code exécuté.` },
        { text: 'Application.evtx', correct: false,
          explain: `Le journal Application ne capture pas spécifiquement PowerShell.` },
        { text: 'C:\\Windows\\Temp\\powershell.log', correct: false,
          explain: `Pas un emplacement standard. Le logging PowerShell se fait via Event Log, pas via fichier plat.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel journal Windows contient le <strong>code des scripts PowerShell</strong> exécutés ?`,
        choices,
        hintFn: () => `PowerShell 5+ : Script Block Logging dans <code>Microsoft-Windows-PowerShell/Operational</code> Event 4104. Module Logging (4103) et Transcription (4105/4106) sont aussi des sources utiles. Configuration via GPO ou registre.`
      });
    }

    // qType === 6 : Event ID 4624 vs 4625 — succès/échec
    const isSuccess = Math.random() < 0.5;
    const scenarioText = isSuccess ?
      `Vous voyez dans Security.evtx un Event ID <strong>4624</strong>, LogonType=10, IpAddress=203.0.113.42 (IP externe), AccountName=Administrator. Que se passe-t-il ?` :
      `Vous voyez dans Security.evtx <strong>500 Events 4625</strong> consécutifs, IpAddress=185.220.101.42, AccountName variant (admin, administrator, root, Administrator). Diagnostic ?`;
    const choices = isSuccess ? [
      { text: 'Connexion RDP <strong>réussie</strong> du compte Administrator depuis une IP externe — incident sérieux à investiguer', correct: true,
        explain: `4624 = succès. LogonType 10 = RDP. IP externe + compte privilégié = potentiel compromission. Actions : vérifier l'historique des connexions de ce compte, isoler le poste, capturer mémoire, vérifier 4672 (privileges spéciaux) associé.` },
      { text: 'Tentative de connexion RDP qui a échoué', correct: false,
        explain: `4624 = succès. L'échec serait 4625.` },
      { text: 'Configuration normale d\'un domaine', correct: false,
        explain: `Configuration normale ≠ Administrator depuis IP externe. Anomalie majeure.` },
      { text: 'Heartbeat système Windows toutes les 30s', correct: false,
        explain: `Aucun heartbeat n'utilise 4624. Cet event est strictement un logon authentifié.` },
    ] : [
      { text: '<strong>Brute force RDP/SMB</strong> en cours — compte le plus probable : Administrator', correct: true,
        explain: `500× 4625 + variations de username = brute force classique. Actions : bloquer l'IP au firewall, vérifier si des 4624 ont suivi (succès), examiner les comptes ciblés, activer account lockout policy.` },
      { text: 'Synchronisation Active Directory normale', correct: false,
        explain: `La synchronisation AD ne génère pas 500 échecs avec usernames variant.` },
      { text: 'Mise à jour Windows en arrière-plan', correct: false,
        explain: `Windows Update n'utilise pas le logon Windows.` },
      { text: 'L\'utilisateur a oublié son mot de passe', correct: false,
        explain: `500 tentatives + IP unique externe + variations de username = clairement automatisé, pas un humain.` },
    ];
    return buildQCMCard({
      ...opts,
      scenario: scenarioText,
      choices: choices.sort(() => Math.random() - 0.5),
      hintFn: () => `4624 (succès) vs 4625 (échec). LogonType 10 = RDP, 3 = network (SMB). Pattern brute force : centaines d'échecs depuis 1 IP avec usernames variés.`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TP 3 : Linux artefacts
  // ════════════════════════════════════════════════════════════════

  function genLinuxArtefacts() {
    const qType = rand(0, 6);
    const opts = { prefix: 'linux', icon: '🐧', title: 'Linux — Artefacts forensiques', badge: 'artefact' };

    if (qType === 0) {
      // bash_history
      const choices = [
        { text: '<code>~/.bash_history</code> — texte plat, une commande par ligne', correct: true,
          explain: `<strong>~/.bash_history</strong> (= <code>/home/user/.bash_history</code>) sauvegarde l'historique des commandes bash à la sortie du shell (sauf si <code>HISTFILE</code> est vidé). Format texte plat. Variables associées : <code>HISTSIZE</code> (taille mémoire), <code>HISTFILESIZE</code> (taille fichier), <code>HISTCONTROL</code> (filtre ignoredups/ignorespace). Tu peux ajouter <code>HISTTIMEFORMAT</code> pour avoir des timestamps. Si <code>HISTFILE=/dev/null</code> ou <code>unset HISTFILE</code> : pas d'historique sauvé (anti-forensique).` },
        { text: '<code>/var/log/bash.log</code> — log système', correct: false,
          explain: `Pas un emplacement standard. Bash n'écrit pas dans /var/log par défaut.` },
        { text: '<code>~/.shell_history</code> — base SQLite', correct: false,
          explain: `Bash utilise un format texte plat, pas SQLite. .shell_history n'est pas standard.` },
        { text: '<code>/etc/bash_history</code> — partagé entre tous les utilisateurs', correct: false,
          explain: `bash_history est <em>par utilisateur</em> dans son home, jamais centralisé dans /etc/.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Où est stocké l'<strong>historique des commandes bash</strong> sur un système Linux standard ?`,
        choices,
        hintFn: () => `<code>~/.bash_history</code> pour bash. <code>~/.zsh_history</code> pour zsh (macOS default). <code>~/.local/share/fish/fish_history</code> pour fish. Anti-forensique courante : <code>unset HISTFILE</code>, <code>ln -s /dev/null ~/.bash_history</code>, ou <code>export HISTSIZE=0</code>.`
      });
    }

    if (qType === 1) {
      // /var/log/auth.log
      const choices = [
        { text: 'Authentifications (SSH, sudo, su) et événements PAM', correct: true,
          explain: `<strong>/var/log/auth.log</strong> (Debian/Ubuntu) ou <strong>/var/log/secure</strong> (RHEL/CentOS/Fedora) loge les tentatives d'auth : SSH (succès/échecs), sudo (commandes), su, login console, événements PAM. Critique en triage : SSH brute force, escalade sudo, login root direct, etc.` },
        { text: 'Connexions HTTP du serveur web Apache/Nginx', correct: false,
          explain: `Les logs web sont dans <code>/var/log/apache2/access.log</code> (Debian) ou <code>/var/log/nginx/access.log</code>. Pas auth.log.` },
        { text: 'Boot logs du kernel', correct: false,
          explain: `Boot logs : <code>/var/log/kern.log</code>, <code>/var/log/dmesg</code>, ou <code>journalctl -k</code>.` },
        { text: 'Logs cron / tâches planifiées', correct: false,
          explain: `<code>/var/log/cron.log</code> (Debian) ou <code>/var/log/cron</code> (RHEL). Pas auth.log.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Que contient <code>/var/log/auth.log</code> (Debian/Ubuntu) ?`,
        choices,
        hintFn: () => `auth.log = authentifications (SSH, sudo, su, PAM). Sur RHEL/CentOS : /var/log/secure. Pour SSH spécifiquement : grep "sshd" auth.log. Crucial en post-incident.`
      });
    }

    if (qType === 2) {
      // Commandes last/lastb/who
      const cmds = [
        { name: 'last', file: '/var/run/utmp et /var/log/wtmp', purpose: 'logins/logouts <em>réussis</em>' },
        { name: 'lastb', file: '/var/log/btmp', purpose: 'tentatives de login <em>échouées</em>' },
        { name: 'who', file: '/var/run/utmp', purpose: 'utilisateurs <em>actuellement</em> connectés' },
        { name: 'lastlog', file: '/var/log/lastlog', purpose: '<em>dernier</em> login de chaque utilisateur du système' },
      ];
      const target = cmds[rand(0, cmds.length - 1)];
      const others = cmds.filter(c => c !== target);
      const choices = [
        { text: target.purpose.replace(/<\/?em>/g, ''), correct: true,
          explain: `<code>${target.name}</code> lit ${target.file} et affiche ${target.purpose}. Forensique : <code>last -f /mnt/evidence/wtmp</code> permet d'analyser une copie hors-ligne.` },
        ...others.slice(0, 3).map(c => ({
          text: c.purpose.replace(/<\/?em>/g, ''), correct: false,
          explain: `Ça c'est <code>${c.name}</code> (qui lit ${c.file}), pas ${target.name}.`
        }))
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Que fait la commande <code>${target.name}</code> sur Linux ?`,
        choices,
        hintFn: () => `utmp = qui est connecté MAINTENANT (who). wtmp = historique TOUS logins (last). btmp = ÉCHECS (lastb). lastlog = dernier login par user. Tous binaires, lisibles avec leurs commandes dédiées ou strings.`
      });
    }

    if (qType === 3) {
      // sudoers logging
      const choices = [
        { text: '<code>/var/log/auth.log</code> (ou <code>/var/log/secure</code>) + parfois <code>/var/log/sudo.log</code> si configuré', correct: true,
          explain: `Par défaut sudo loge via syslog → <code>auth.log</code> (Debian) ou <code>secure</code> (RHEL). Format : <code>sudo: user : TTY=pts/0 ; PWD=/home/user ; USER=root ; COMMAND=/usr/bin/whatever</code>. Un fichier dédié <code>/var/log/sudo.log</code> peut être configuré via <code>Defaults logfile=...</code> dans <code>/etc/sudoers</code>.` },
        { text: '<code>/var/log/sudo.log</code> uniquement', correct: false,
          explain: `Pas le défaut. Ce fichier n'existe que si configuré explicitement dans /etc/sudoers.` },
        { text: '<code>/etc/sudoers</code> (qui agit comme log)', correct: false,
          explain: `/etc/sudoers est la <em>configuration</em> de sudo (qui peut faire quoi), pas un log.` },
        { text: '<code>~/.sudo_history</code> par utilisateur', correct: false,
          explain: `N'existe pas. Sudo loge centralisé via syslog, pas par utilisateur.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Où sont logées par défaut les <strong>commandes sudo</strong> exécutées sur un système Linux ?`,
        choices,
        hintFn: () => `Sudo via syslog (facility = auth/authpriv) → auth.log/secure. Logging dédié activable avec <code>Defaults logfile=/var/log/sudo.log</code>. Pour de l'audit poussé : sudo_logsrvd (centralized) ou auditd.`
      });
    }

    if (qType === 4) {
      // journalctl avec systemd
      const choices = [
        { text: '<code>journalctl</code> — interface unique pour les logs systemd-journald (incluant kernel, services, boot)', correct: true,
          explain: `<strong>journalctl</strong> lit le journal binaire de <code>systemd-journald</code> stocké dans <code>/var/log/journal/&lt;machine-id&gt;/</code>. Options forensiques : <code>--since</code>, <code>--until</code>, <code>-u service.service</code>, <code>-b</code> (boot courant), <code>-b -1</code> (boot précédent), <code>-o json</code> (export structuré). Persistant si /var/log/journal/ existe, volatile sinon (mémoire seulement).` },
        { text: '<code>syslogd</code> — uniquement', correct: false,
          explain: `syslogd est l'ancien (ou rsyslogd/syslog-ng). Sur systèmes systemd modernes (Debian 8+, RHEL 7+), journald est primaire. syslog peut coexister mais journalctl est l'outil natif.` },
        { text: '<code>logreader</code>', correct: false,
          explain: `N'existe pas comme outil standard.` },
        { text: '<code>tail -f /var/log/messages</code>', correct: false,
          explain: `tail -f sur /var/log/messages fonctionnait avant systemd. Avec systemd, le journal est binaire et nécessite journalctl.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quelle commande affiche les logs sur un système Linux moderne avec <strong>systemd</strong> ?`,
        choices,
        hintFn: () => `systemd-journald stocke un journal binaire structuré dans /var/log/journal/. journalctl est l'interface. Forensique : <code>journalctl -b -1</code> (boot précédent), <code>-o json</code> pour parser, <code>--since "2026-05-01 14:00:00"</code> pour filtrer.`
      });
    }

    if (qType === 5) {
      // .ssh/authorized_keys et persistance
      const choices = [
        { text: '<code>~/.ssh/authorized_keys</code> — clés publiques autorisées à se connecter sans mot de passe', correct: true,
          explain: `<strong>authorized_keys</strong> liste les clés publiques SSH autorisées pour un compte. Format : <code>ssh-rsa AAAAB3... user@host</code>. Mécanisme de <strong>persistance majeur</strong> : un attaquant ajoute sa propre clé publique → accès permanent SSH même si le mot de passe est changé. Vérifier en triage : <code>find / -name authorized_keys 2>/dev/null</code> + comparer aux clés légitimes connues.` },
        { text: '<code>~/.ssh/known_hosts</code>', correct: false,
          explain: `known_hosts liste les <em>serveurs</em> auxquels tu t'es déjà connecté (avec leur fingerprint). N'autorise pas de logins, ne contient pas de clés privées d'auth.` },
        { text: '<code>/etc/ssh/sshd_config</code>', correct: false,
          explain: `Config du serveur SSH (ports, méthodes d'auth, etc.). Ne liste pas les clés.` },
        { text: '<code>/root/.ssh/id_rsa</code>', correct: false,
          explain: `id_rsa = clé privée. Permet à root de se connecter ailleurs, ne reçoit pas de connexions.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel fichier permet à un utilisateur (ou un attaquant) de se connecter en SSH <strong>sans mot de passe</strong> grâce à une clé publique ?`,
        choices,
        hintFn: () => `~/.ssh/authorized_keys = clés publiques acceptées pour ce compte. Vecteur de persistance classique. Triage : lister, comparer, dater (stat ctime). authorized_keys2 (legacy) parfois utilisé aussi.`
      });
    }

    // qType === 6 : Crontab user vs system
    const choices = [
      { text: '<code>/var/spool/cron/crontabs/&lt;user&gt;</code> (user) et <code>/etc/cron.{d,daily,hourly,...}/</code> + <code>/etc/crontab</code> (system)', correct: true,
        explain: `Cron utilisateur : <code>/var/spool/cron/crontabs/user</code> (Debian) ou <code>/var/spool/cron/user</code> (RHEL), édité via <code>crontab -e</code>. Cron système : <code>/etc/crontab</code> + <code>/etc/cron.d/*</code> + dossiers <code>cron.{hourly,daily,weekly,monthly}/</code>. Vecteur de persistance classique : <code>crontab -l</code> par user + lister /etc/cron.* + systemd timers (<code>systemctl list-timers</code>) en complément.` },
      { text: '<code>/root/.crontab</code> uniquement', correct: false,
        explain: `Le crontab de root est dans /var/spool/cron/crontabs/root, pas /root/.crontab.` },
      { text: '<code>~/.crontab</code> par utilisateur', correct: false,
        explain: `Faux emplacement. La commande <code>crontab -e</code> édite /var/spool/cron/crontabs/&lt;user&gt;.` },
      { text: '<code>/var/log/cron</code>', correct: false,
        explain: `/var/log/cron est le log d'exécution, pas la configuration des tâches.` },
    ].sort(() => Math.random() - 0.5);
    return buildQCMCard({
      ...opts,
      scenario: `Où sont stockés les <strong>crontab</strong> (tâches planifiées) sur Linux ?`,
      choices,
      hintFn: () => `User : /var/spool/cron/crontabs/&lt;user&gt; (Debian) ou /var/spool/cron/&lt;user&gt; (RHEL). System : /etc/crontab + /etc/cron.d/* + /etc/cron.{daily,hourly,...}/. Ne pas oublier les systemd timers (<code>systemctl list-timers --all</code>) — vecteur de persistance moderne.`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TP 4 : macOS artefacts
  // ════════════════════════════════════════════════════════════════

  function genMacOSArtefacts() {
    const qType = rand(0, 6);
    const opts = { prefix: 'macos', icon: '🍎', title: 'macOS — Artefacts forensiques', badge: 'artefact' };

    if (qType === 0) {
      // unified.log
      const choices = [
        { text: '<strong>macOS 10.12 Sierra (2016)</strong>', correct: true,
          explain: `Le <strong>unified logging system</strong> (Apple) remplace ASL et syslog depuis <strong>macOS Sierra (10.12, septembre 2016)</strong>. Stockage binaire compressé dans <code>/var/db/diagnostics/</code> et <code>/var/db/uuidtext/</code>. Lecture : <code>log show --predicate '...'</code> (live) ou <code>log collect</code> + outils forensiques (<code>UnifiedLogReader</code> de Sarah Edwards / mac4n6.com, <code>macos-UnifiedLogs</code> de Mandiant).` },
        { text: 'macOS 10.10 Yosemite (2014)', correct: false,
          explain: `Trop tôt. Yosemite utilisait encore ASL (Apple System Log).` },
        { text: 'macOS 10.14 Mojave (2018)', correct: false,
          explain: `Trop tard. Mojave est postérieur de 2 ans à l'introduction du unified log (Sierra 2016).` },
        { text: 'macOS 11 Big Sur (2020)', correct: false,
          explain: `Big Sur a apporté beaucoup de changements (CryptexFS, etc.) mais le unified logging existe depuis Sierra (2016).` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `À partir de quelle version de macOS le <strong>unified logging system</strong> a-t-il remplacé ASL/syslog ?`,
        choices,
        hintFn: () => `macOS 10.12 Sierra, septembre 2016. Stockage : /var/db/diagnostics/ (traces .tracev3) + /var/db/uuidtext/ (chaînes UUID). Outils : log show (live), UnifiedLogReader (Mandiant, Sarah Edwards mac4n6.com).`
      });
    }

    if (qType === 1) {
      // KnowledgeC.db
      const choices = [
        { text: 'Une base SQLite qui trace l\'<strong>activité utilisateur</strong> : apps lancées, notifications, état Screen Time, Safari, devices Bluetooth', correct: true,
          explain: `<strong>KnowledgeC.db</strong> est une base SQLite située à <code>/private/var/db/CoreDuet/Knowledge/knowledgeC.db</code> (system) et <code>~/Library/Application Support/Knowledge/knowledgeC.db</code> (user). Trace : applications lancées (<code>/app/inFocus</code>), notifications reçues, devices connectés, Screen Time, état batterie. Une mine d'or forensique documentée par Sarah Edwards (mac4n6.com). Parseurs : <code>APOLLO</code> (Sarah Edwards), <code>mac_apt</code>.` },
        { text: 'Un cache de pages web Safari', correct: false,
          explain: `Le cache Safari est dans <code>~/Library/Caches/com.apple.Safari/</code>. KnowledgeC trace les activités globales utilisateur, pas spécifiquement Safari.` },
        { text: 'Les certificats X.509 acceptés par le keychain', correct: false,
          explain: `Les certificats sont dans <code>~/Library/Keychains/</code>, pas dans KnowledgeC.` },
        { text: 'L\'index Spotlight des fichiers indexés', correct: false,
          explain: `Spotlight = <code>/.Spotlight-V100/</code> avec mdimporters et stores. KnowledgeC trace les activités, pas l'indexation de fichiers.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Que contient <code>KnowledgeC.db</code> sur macOS et iOS ?`,
        choices,
        hintFn: () => `Base SQLite, /private/var/db/CoreDuet/Knowledge/knowledgeC.db (system) ou ~/Library/.../Knowledge/ (user). Trace énormément d'activité user. Outil de référence : APOLLO (Sarah Edwards, mac4n6.com).`
      });
    }

    if (qType === 2) {
      // FSEvents
      const choices = [
        { text: '<strong>FSEvents</strong> — log binaire des modifications du système de fichiers (creates/deletes/modifications)', correct: true,
          explain: `<strong>FSEvents</strong> (<code>/.fseventsd/</code> par volume) enregistre les changements du FS pour Spotlight, Time Machine, et les apps qui s'y abonnent (API <code>FSEventStreamCreate</code>). Format binaire propriétaire. Parsing forensique : <code>FSEventsParser</code> (G-C Partners / David Cowen) ou <code>mac_apt</code>. Indique <em>qu'il y a eu une modif</em> sur un path, sans toujours dire quoi (selon le flag).` },
        { text: 'inotify (équivalent macOS)', correct: false,
          explain: `inotify est un mécanisme Linux. macOS utilise FSEvents (kqueue VNODE events à bas niveau, FSEvents API au-dessus).` },
        { text: 'AuditLog du noyau XNU', correct: false,
          explain: `BSM/audit existe sur macOS (<code>/var/audit/</code>) mais c'est distinct de FSEvents. BSM trace les syscalls audités, FSEvents les changements FS via une API dédiée.` },
        { text: 'Spotlight metadata', correct: false,
          explain: `Spotlight (.Spotlight-V100) consomme FSEvents pour savoir quoi réindexer. FSEvents est la source primaire.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Comment macOS trace-t-il les <strong>modifications du système de fichiers</strong> au niveau OS ?`,
        choices,
        hintFn: () => `FSEvents : /.fseventsd/ par volume, format binaire gzippé. Consommé par Spotlight, Time Machine, applis. Forensique : FSEventsParser, mac_apt. Indique le path modifié mais pas toujours le détail de la modif.`
      });
    }

    if (qType === 3) {
      // Quarantine attribute
      const choices = [
        { text: '<code>com.apple.quarantine</code> — extended attribute attaché aux fichiers téléchargés', correct: true,
          explain: `<strong>com.apple.quarantine</strong> est un <em>extended attribute</em> (xattr) ajouté par Safari, Mail, AirDrop, etc., aux fichiers téléchargés. Format : <code>0083;hex_timestamp;App;UUID</code>. Déclenche le Gatekeeper au premier lancement (« voulez-vous vraiment ouvrir ce fichier téléchargé d'Internet ? »). Lecture forensique : <code>xattr -p com.apple.quarantine fichier</code> ou <code>mdls fichier</code> (champ <code>kMDItemDownloadedDate</code>, etc.).` },
        { text: '<code>.DS_Store</code>', correct: false,
          explain: `.DS_Store stocke les préférences d'affichage Finder (icônes, position fenêtre). Pas la quarantaine.` },
        { text: '<code>com.apple.metadata:kMDItemWhereFroms</code> uniquement', correct: false,
          explain: `kMDItemWhereFroms est aussi un xattr utile (URL d'origine) mais distinct de quarantine. Souvent les deux coexistent sur un fichier téléchargé.` },
        { text: '<code>.Trash/</code> seulement', correct: false,
          explain: `~/.Trash/ est la corbeille. Sans rapport avec la quarantaine système.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Quel mécanisme macOS marque les fichiers <strong>téléchargés depuis Internet</strong> pour déclencher l'avertissement Gatekeeper ?`,
        choices,
        hintFn: () => `Extended attribute (xattr) <code>com.apple.quarantine</code>. Ajouté par Safari/Mail/AirDrop. Format : flags;timestamp;app;uuid. Voir avec <code>xattr -p</code> ou <code>mdls</code>. Important en triage : tracer l'origine d'un payload malveillant.`
      });
    }

    if (qType === 4) {
      // Plist formats
      const choices = [
        { text: 'Soit <strong>XML lisible</strong> soit <strong>binaire compact</strong> (binary plist) — décodable avec <code>plutil -convert</code>', correct: true,
          explain: `Les <strong>property lists (plist)</strong> existent en deux formats :<br>• <strong>XML</strong> (lisible avec un éditeur texte)<br>• <strong>Binary plist</strong> (bplist00, plus compact, défaut depuis OS X 10.4)<br>Conversion : <code>plutil -convert xml1 file.plist</code> ou <code>plutil -convert binary1</code>. Lecture forensique : <code>plistutil</code>, <code>plistlib</code> en Python, ou simplement <code>plutil -p</code>.` },
        { text: 'JSON exclusivement', correct: false,
          explain: `macOS n'utilise pas JSON pour ses plist (sauf nouvelles configurations modernes). Format XML ou binary plist.` },
        { text: 'SQLite uniquement', correct: false,
          explain: `Certains fichiers de configuration macOS sont SQLite (KnowledgeC, History.db, etc.), mais les .plist sont XML/binary plist, pas SQLite.` },
        { text: 'Texte ASCII flat sans structure', correct: false,
          explain: `Les plist sont structurés (clés/valeurs hiérarchiques) en XML ou binary. Pas du flat ASCII.` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Sous quel format les fichiers de configuration <strong>.plist</strong> sont-ils stockés sur macOS ?`,
        choices,
        hintFn: () => `XML (lisible) ou bplist00 (binaire). <code>plutil -p file.plist</code> affiche en clair quel que soit le format. <code>plutil -convert xml1/binary1</code> pour convertir. Python : <code>plistlib</code>.`
      });
    }

    if (qType === 5) {
      // Spotlight metadata
      const choices = [
        { text: '<code>.Spotlight-V100/</code> à la racine du volume + métadonnées via <code>mdls</code> / <code>mdfind</code>', correct: true,
          explain: `Spotlight indexe chaque volume dans <code>.Spotlight-V100/</code> (racine du volume) avec des fichiers <em>Store-V2</em>. Métadonnées par fichier : <code>mdls /path/file</code> (affiche kMDItem*). Recherche par contenu : <code>mdfind 'kMDItemContentType == "public.image"'</code>. Important en forensique : les métadonnées Spotlight survivent à la suppression du fichier original (cache).` },
        { text: '<code>~/Library/Spotlight/</code>', correct: false,
          explain: `Path inexistant. Spotlight indexe par volume, racine, dossier .Spotlight-V100.` },
        { text: '<code>/private/var/spotlight/</code>', correct: false,
          explain: `Path inexistant. Index Spotlight = .Spotlight-V100 à la racine du volume.` },
        { text: '<code>/usr/local/spotlight/</code>', correct: false,
          explain: `Pas un path Spotlight. /usr/local est pour les programmes installés par l'utilisateur (Homebrew, etc.).` },
      ].sort(() => Math.random() - 0.5);
      return buildQCMCard({
        ...opts,
        scenario: `Où Spotlight stocke-t-il son <strong>index de métadonnées</strong> de fichiers sur macOS ?`,
        choices,
        hintFn: () => `<code>/.Spotlight-V100/</code> à la racine de chaque volume indexé. CLI : <code>mdls fichier</code> (lecture), <code>mdfind 'requête'</code> (recherche), <code>mdimport</code> (forcer indexation). Cache Spotlight peut persister après suppression du fichier !`
      });
    }

    // qType === 6 : Time Machine
    const choices = [
      { text: 'Dossier <code>Backups.backupdb</code> sur le volume de sauvegarde, avec hardlinks pour les fichiers inchangés', correct: true,
        explain: `<strong>Time Machine</strong> (depuis Mac OS X 10.5 Leopard, 2007) sauvegarde dans <code>/Volumes/&lt;disque&gt;/Backups.backupdb/&lt;hostname&gt;/&lt;timestamp&gt;/</code>. Sur HFS+ utilisait des hardlinks de dossiers (extension Apple). Sur APFS (depuis Big Sur, 2020) utilise des snapshots APFS. Forensique : chaque snapshot = état complet du système à un instant T, énorme valeur pour reconstituer la chronologie.` },
      { text: 'Une image disque .dmg unique chiffrée', correct: false,
        explain: `Time Machine produit une <em>arborescence</em> par snapshot, pas un .dmg monolithique. Sur APFS récent : snapshots APFS natifs.` },
      { text: 'Backup cloud iCloud uniquement', correct: false,
        explain: `Time Machine vise un disque externe ou un réseau (Time Capsule, Synology). iCloud Backup est différent (sauvegarde iOS / certains éléments macOS).` },
      { text: 'Fichiers .tar.gz datés', correct: false,
        explain: `Pas le format Time Machine. Snapshots HFS+/APFS, pas archive tar.` },
    ].sort(() => Math.random() - 0.5);
    return buildQCMCard({
      ...opts,
      scenario: `Comment <strong>Time Machine</strong> stocke-t-il ses sauvegardes sur le disque cible ?`,
      choices,
      hintFn: () => `HFS+ : Backups.backupdb avec hardlinks de dossiers (extension Apple unique). APFS : snapshots natifs (Big Sur+). Chaque snapshot ≈ état complet à un instant T → reconstitution de chronologie post-incident.`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // Enregistrement dans GENERATORS
  // ════════════════════════════════════════════════════════════════
  if (typeof window !== 'undefined' && window.GENERATORS) {
    window.GENERATORS.ext4 = genEXT4;
    window.GENERATORS.winev = genWinEvents;
    window.GENERATORS.linux = genLinuxArtefacts;
    window.GENERATORS.macos = genMacOSArtefacts;
  } else if (typeof GENERATORS !== 'undefined') {
    GENERATORS.ext4 = genEXT4;
    GENERATORS.winev = genWinEvents;
    GENERATORS.linux = genLinuxArtefacts;
    GENERATORS.macos = genMacOSArtefacts;
  }

  if (typeof window !== 'undefined') {
    window.genEXT4 = genEXT4;
    window.genWinEvents = genWinEvents;
    window.genLinuxArtefacts = genLinuxArtefacts;
    window.genMacOSArtefacts = genMacOSArtefacts;
  }
})();
