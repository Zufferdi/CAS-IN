// ═══════════════════════════════════════════════════════════════════
// tp-engine-artefacts.js — CAS-IN TP delta v102 (REFONTE PRATIQUE)
// 4 TP "artefacts OS" : EXT4, Windows Events, Linux, macOS
// Chaque TP a 3 niveaux progressifs A → B → C
// Artefact concret (hex/XML/log/SQLite output) + input + 3 indices
// Chargé APRÈS tp-engine.js et tp-engine-easy.js (réutilise buildPracticeCard si dispo)
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // HELPERS partagés (autonomes — pas de dépendance à tp-engine-easy)
  // ────────────────────────────────────────────────────────────────
  function buildPracticeCard(opts) {
    const id = opts.prefix;
    const div = document.createElement('div');
    div.className = 'ex-card';

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-${id}">${opts.icon || '🧩'}</div>
        <div class="ex-title">${opts.title}</div>
        <span class="ex-badge easy">${opts.badge || 'pratique'}</span>
      </div>
      <div class="ex-scenario">${opts.question}</div>
      <div style="margin:.7rem 0">${opts.artefactHTML}</div>
      <div class="ex-input-row" style="flex-wrap:wrap;gap:8px">
        ${opts.inputLabel ? `<span class="ex-input-label">${opts.inputLabel}</span>` : ''}
        <input class="ex-input" id="inp-${id}" placeholder="${opts.placeholder || ''}" autocomplete="off" spellcheck="false" >
        <button class="btn-hint" id="btn-hint1-${id}" type="button">💡 Méthode</button>
        <button class="btn-hint" id="btn-hint2-${id}" type="button" disabled style="opacity:.4">💡💡 Où regarder</button>
        <button class="btn-hint" id="btn-hint3-${id}" type="button" disabled style="opacity:.4">💡💡💡 Réponse</button>
        <button class="btn-validate" id="btn-validate-${id}" type="button">Valider ✓</button>
        <button class="btn-next" id="btn-next-${id}" type="button" style="display:none">Exercice suivant →</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-${id}"></div>
    `;

    setTimeout(() => {
      const inp = div.querySelector(`#inp-${id}`);
      const fb  = div.querySelector(`#ex-feedback-${id}`);
      const nextBtn = div.querySelector(`#btn-next-${id}`);
      const valBtn  = div.querySelector(`#btn-validate-${id}`);
      const normalize = opts.normalize || (v => v.trim().toLowerCase().replace(/\s+/g, ''));

      function validate() {
        if (!inp || !fb) return;
        const got = normalize(inp.value);
        const exp = normalize(opts.expected);
        const ok  = got === exp;

        if (ok) {
          inp.className = 'ex-input correct';
          valBtn.disabled = true;
          nextBtn.style.display = 'inline-block';
          const card = inp.closest('.ex-card');
          if (card) card.className = 'ex-card solved';
          const numEl = document.getElementById(`ex-num-${id}`);
          if (numEl) numEl.className = 'ex-num solved';
          fb.className = 'ex-feedback correct';
          fb.innerHTML = `✓ Correct ! ${opts.explain || ''}`;
          if (typeof STATE !== 'undefined' && !STATE.hintUsed && typeof incSolved === 'function') {
            incSolved(STATE.cat);
          }
        } else {
          inp.className = 'ex-input wrong';
          fb.className = 'ex-feedback wrong';
          fb.innerHTML = `✗ "<code>${escapeHTML(inp.value)}</code>" incorrect. Utilise les indices progressifs ou réessaie.`;
          if (typeof breakStreak === 'function') breakStreak();
          setTimeout(() => { if (inp) inp.className = 'ex-input'; }, 700);
        }
      }

      function showHint(level) {
        if (typeof markHintUsed === 'function') markHintUsed();
        if (!fb || !opts.hints || !opts.hints[level-1]) return;
        fb.className = 'ex-feedback correct';
        const labels = ['Méthode', 'Où regarder', 'Réponse étape par étape'];
        fb.innerHTML = `💡 <strong>Niveau ${level} — ${labels[level-1]}</strong><br>${opts.hints[level-1]}`;
        if (level < 3) {
          const next = div.querySelector(`#btn-hint${level+1}-${id}`);
          if (next) { next.disabled = false; next.style.opacity = '1'; }
        }
        const cur = div.querySelector(`#btn-hint${level}-${id}`);
        if (cur) cur.style.opacity = '.4';
      }

      div.querySelector(`#btn-hint1-${id}`).addEventListener('click', () => showHint(1));
      div.querySelector(`#btn-hint2-${id}`).addEventListener('click', () => showHint(2));
      div.querySelector(`#btn-hint3-${id}`).addEventListener('click', () => showHint(3));
      valBtn.addEventListener('click', validate);
      nextBtn.addEventListener('click', () => { if (typeof newExercise === 'function') newExercise(); });
      if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') validate(); });
    }, 50);

    return div;
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // Hexdump compact pour artefacts EXT4
  function tinyHexDump(bytes, opts) {
    opts = opts || {};
    const title = opts.title || '';
    const annotations = opts.annotations || [];
    const cols = opts.cols || 8;
    const baseOffset = opts.baseOffset || 0;

    const hexCells = bytes.map((b, i) => {
      const ann = annotations.find(a => a.from <= i && i <= a.to);
      const color = ann ? `color:var(${ann.color || '--cyan'});font-weight:700;background:rgba(255,255,255,.05);border-radius:3px` : 'color:var(--text)';
      const tip = ann ? ` title="${ann.label || ''}"` : '';
      return `<span style="padding:2px 4px;display:inline-block;min-width:24px;text-align:center;${color}"${tip}>${b.toString(16).toUpperCase().padStart(2,'0')}</span>`;
    });
    const ascii = bytes.map(b => (b >= 0x20 && b < 0x7F) ? String.fromCharCode(b) : '.').join('');
    const lines = [];
    for (let i = 0; i < hexCells.length; i += cols) {
      const offset = (baseOffset + i).toString(16).toUpperCase().padStart(4, '0');
      const hexLine = hexCells.slice(i, i + cols).join('');
      const asciiLine = ascii.slice(i, i + cols).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
      lines.push(`<tr>
        <td style="padding:.25rem .6rem;color:var(--dim);font-size:.7rem;font-family:var(--mono);border-right:1px solid rgba(255,255,255,.05)">${offset}</td>
        <td style="padding:.25rem .4rem;font-family:var(--mono);font-size:.85rem;letter-spacing:.04em">${hexLine}</td>
        <td style="padding:.25rem .6rem;color:var(--dim);font-size:.75rem;font-family:var(--mono);border-left:1px solid rgba(255,255,255,.05)">${asciiLine}</td>
      </tr>`);
    }
    return `
      <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch">
        ${title ? `<div style="padding:.4rem .8rem;font-size:.7rem;color:var(--gold);background:rgba(240,192,64,.05);border-bottom:1px solid var(--border);font-weight:700;letter-spacing:.05em;text-transform:uppercase">${title}</div>` : ''}
        <table style="border-collapse:collapse;width:100%">${lines.join('')}</table>
      </div>
    `;
  }

  // Rendu d'un bloc texte type log/XML/output (monospace, scrollable)
  function renderTextBlock(text, opts) {
    opts = opts || {};
    const title = opts.title || '';
    const highlights = opts.highlights || []; // [{match: 'string', color: '--cyan'}]
    const lines = text.split('\n').map(line => {
      let cls = '';
      for (const h of highlights) {
        if (line.includes(h.match)) {
          cls = `background:rgba(126,192,255,.08);border-left:3px solid var(${h.color || '--cyan'});padding-left:.4rem;display:block;margin-left:-.4rem`;
          break;
        }
      }
      return `<div style="${cls}">${escapeHTML(line) || '&nbsp;'}</div>`;
    });
    return `
      <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch">
        ${title ? `<div style="padding:.4rem .8rem;font-size:.7rem;color:var(--gold);background:rgba(240,192,64,.05);border-bottom:1px solid var(--border);font-weight:700;letter-spacing:.05em;text-transform:uppercase">${title}</div>` : ''}
        <pre style="margin:0;padding:.7rem .8rem;font-family:var(--mono);font-size:.78rem;line-height:1.5;color:var(--text);overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:pre">${lines.join('')}</pre>
      </div>
    `;
  }

  // Convertir un int32 en 4 octets little-endian
  function le32(v) {
    return [v & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, (v >> 24) & 0xFF];
  }

  // ════════════════════════════════════════════════════════════════
  // TP 1 : EXT4 — Inode / superbloc
  // ════════════════════════════════════════════════════════════════

  function genEXT4() {
    const level = rand(0, 2);
    const opts = { prefix: 'ext4', icon: '🐧', title: 'EXT4 — Superbloc & Inode' };

    // ── Niveau A : magic number du superbloc (0xEF53) ──
    if (level === 0) {
      // Construire le bloc magic + s_state + s_errors typique
      // En EXT4, le magic est à l'offset 0x38 du superbloc, sur 2 octets LE
      // On stocke en disque : 53 EF (little endian)
      const bytes = [];
      // Quelques octets bidon avant le magic pour le contexte (offset 0x30-0x37)
      const sLastMount = Math.floor(Date.now() / 1000) - 86400 * rand(10, 100);
      const lmBytes = le32(sLastMount);
      bytes.push(...lmBytes);              // offset 0x30 : s_lastcheck (4 octets)
      bytes.push(0xFF, 0xFF, 0xFF, 0xFF);  // offset 0x34 : s_checkinterval (4 octets)
      bytes.push(0x53, 0xEF);              // offset 0x38 : s_magic (le53EF = 0xEF53)
      bytes.push(0x01, 0x00);              // offset 0x3A : s_state (1=clean)
      bytes.push(0x01, 0x00);              // offset 0x3C : s_errors (1=continue)
      bytes.push(0x00, 0x00);              // offset 0x3E : s_minor_rev_level
      bytes.push(0x00, 0x00, 0x00, 0x00);  // padding pour aligner

      const magicOffsetInDump = 8; // position du 0x53 dans le bytes[]

      const artefactHTML = tinyHexDump(bytes, {
        title: 'Superbloc EXT4 — offset 0x1030–0x1043 (extrait debugfs)',
        baseOffset: 0x1030,
        annotations: [{
          from: magicOffsetInDump,
          to: magicOffsetInDump + 1,
          color: '--cyan',
          label: 's_magic (2 octets LE)'
        }],
        cols: 8
      });

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici un extrait du superbloc d'un système de fichiers. Tu sais que c'est de la famille EXT (ext2/3/4). <strong>Quels sont les 2 octets du magic number en little-endian (sur disque)</strong>, exprimés en valeur hex 16-bits ?<br><span style="color:var(--dim);font-size:.85rem">Format attendu : <code>0xEF53</code> (la valeur 16-bit lue, pas les octets bruts).</span>`,
        inputLabel: 's_magic =',
        placeholder: '0xEF53',
        expected: '0xEF53',
        normalize: v => {
          let s = v.trim().toUpperCase().replace(/\s/g, '');
          if (!s.startsWith('0X')) s = '0X' + s;
          // Nettoie 0X et zéros initiaux pour comparer numériquement
          const num = parseInt(s.replace('0X', ''), 16);
          return '0X' + num.toString(16).toUpperCase().padStart(4, '0');
        },
        hints: [
          `Le superbloc EXT contient à l'offset <code>0x38</code> un champ <code>s_magic</code> sur 2 octets, en little-endian. Sur disque tu vois les octets dans l'ordre inverse de la valeur 16-bit.`,
          `Les 2 octets surlignés sont <code>53 EF</code>. En little-endian, l'octet de poids faible est stocké en premier — donc la valeur lue est <code>0x[poids fort][poids faible]</code>.`,
          `Octets disque : <code>53 EF</code> (LE) → valeur 16-bit = <code>0xEF53</code>. C'est le magic number EXT2/3/4 (FIPS-compatible signature).`
        ],
        explain: `Magic <strong>0xEF53</strong> à l'offset 0x38 du superbloc → famille EXT. Stocké LE : sur disque tu lis <code>53 EF</code>, mais la valeur 16-bit est bien <code>0xEF53</code>.`
      });
    }

    // ── Niveau B : permissions inode (i_mode) en octal ──
    if (level === 1) {
      // i_mode est à l'offset 0x00 d'un inode, 2 octets LE
      // Bits hauts : type fichier (0x8000 = regular, 0x4000 = directory)
      // Bits bas : permissions UNIX (9 bits)
      const fileType = [0x8000, 0x4000][rand(0, 1)];  // regular ou directory
      const permsOctal = ['0644', '0755', '0600', '0700', '0666', '0777'][rand(0, 5)];
      const permsNum = parseInt(permsOctal, 8);
      const iMode = fileType | permsNum;
      const iModeBytes = [iMode & 0xFF, (iMode >> 8) & 0xFF]; // LE

      // Pad : i_uid (2), i_size (4), i_atime (4), i_ctime (4), i_mtime (4)
      const bytes = [];
      bytes.push(...iModeBytes);              // 0x00 : i_mode
      bytes.push(rand(0, 255), rand(0, 255)); // 0x02 : i_uid (2 octets LE bas)
      const sizeBytes = le32(rand(100, 50000));
      bytes.push(...sizeBytes);               // 0x04 : i_size_lo (4)
      const now = Math.floor(Date.now() / 1000);
      bytes.push(...le32(now - 3600));        // 0x08 : i_atime
      bytes.push(...le32(now - 7200));        // 0x0C : i_ctime
      bytes.push(...le32(now - 86400));       // 0x10 : i_mtime

      const artefactHTML = tinyHexDump(bytes, {
        title: 'Inode EXT4 — début (debugfs : stat <inode>)',
        baseOffset: 0x00,
        annotations: [{
          from: 0,
          to: 1,
          color: '--gold',
          label: 'i_mode (type fichier + permissions, LE)'
        }],
        cols: 8
      });

      const typeLabel = fileType === 0x8000 ? 'fichier régulier' : 'répertoire';

      return buildPracticeCard({
        ...opts,
        badge: 'extraction',
        artefactHTML,
        question: `Voici le début d'un inode (${typeLabel}). Les 2 premiers octets sont <code>i_mode</code> en little-endian. <strong>Quelles sont les permissions UNIX</strong> de ce fichier en notation octale (4 chiffres) ?`,
        inputLabel: 'Permissions :',
        placeholder: '0755',
        expected: permsOctal,
        normalize: v => {
          let s = v.trim().replace(/[^\d]/g, '');
          if (s.length === 3) s = '0' + s; // accepter 755 ou 0755
          return s;
        },
        hints: [
          `<code>i_mode</code> contient 2 infos : les 4 bits de poids fort = type de fichier (<code>0x8</code>=regular, <code>0x4</code>=directory), les 9 bits de poids faible = permissions UNIX (rwxrwxrwx).`,
          `Lis les 2 octets en little-endian : <code>${iModeBytes.map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code> = <code>0x${iMode.toString(16).toUpperCase().padStart(4,'0')}</code>. Garde les 9 bits de poids faible (mask <code>0x01FF</code>) et convertis en octal.`,
          `<code>0x${iMode.toString(16).toUpperCase().padStart(4,'0')} AND 0x01FF</code> = <code>0x${permsNum.toString(16).toUpperCase().padStart(3,'0')}</code> = <strong>${permsOctal}</strong> en octal (= ${(permsNum & 0o400)?'r':'-'}${(permsNum & 0o200)?'w':'-'}${(permsNum & 0o100)?'x':'-'}${(permsNum & 0o040)?'r':'-'}${(permsNum & 0o020)?'w':'-'}${(permsNum & 0o010)?'x':'-'}${(permsNum & 0o004)?'r':'-'}${(permsNum & 0o002)?'w':'-'}${(permsNum & 0o001)?'x':'-'}).`
        ],
        explain: `<code>i_mode = 0x${iMode.toString(16).toUpperCase().padStart(4,'0')}</code> → type ${typeLabel} + perms <strong>${permsOctal}</strong>. Format identique à ce que renvoie <code>stat</code> ou <code>ls -l</code>.`
      });
    }

    // ── Niveau C : timestamps inode → date ISO ──
    {
      // i_atime à l'offset 0x08 d'un inode EXT4, sur 4 octets LE (epoch Unix)
      // Date plausible : entre 2020 et 2026
      const epoch = rand(1577836800, 1748736000); // 2020-01-01 à 2025-05-31 environ
      const d = new Date(epoch * 1000);
      const iso = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const epochBytes = le32(epoch);

      // Construire un inode partiel avec atime à 0x08
      const bytes = [];
      const iMode = 0x81A4; // regular + 0644
      bytes.push(iMode & 0xFF, (iMode >> 8) & 0xFF);  // 0x00 : i_mode
      bytes.push(0xE8, 0x03);                          // 0x02 : i_uid (1000)
      bytes.push(...le32(4096));                       // 0x04 : i_size
      bytes.push(...epochBytes);                       // 0x08 : i_atime ← cible

      const artefactHTML = tinyHexDump(bytes, {
        title: 'Inode EXT4 (extrait debugfs : stat <inode>)',
        baseOffset: 0x00,
        annotations: [{
          from: 8,
          to: 11,
          color: '--purple',
          label: 'i_atime (4 octets LE, epoch Unix seconds)'
        }],
        cols: 8
      });

      return buildPracticeCard({
        ...opts,
        badge: 'calcul',
        artefactHTML,
        question: `Le champ <code>i_atime</code> est à l'offset <code>0x08</code> d'un inode EXT4, sur 4 octets little-endian, en secondes Unix epoch. <strong>Quelle est la date (YYYY-MM-DD)</strong> de dernier accès à ce fichier ?`,
        inputLabel: 'Date :',
        placeholder: '2025-03-15',
        expected: iso,
        normalize: v => v.trim().replace(/[^\d-]/g, ''),
        hints: [
          `Lis les 4 octets en little-endian (inverser l'ordre). Le résultat est un nombre = secondes depuis le 1er janvier 1970 UTC (epoch Unix).`,
          `Octets disque : <code>${epochBytes.map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code>. En LE : <code>0x${epochBytes.slice().reverse().map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join('')}</code> = <code>${epoch}</code> secondes depuis le 1970-01-01.`,
          `<code>${epoch}</code> secondes après epoch = <strong>${iso}</strong>. Utilise <code>date -d @${epoch}</code> sur Linux ou <code>new Date(${epoch}*1000)</code> en JS pour vérifier.`
        ],
        explain: `Epoch <code>${epoch}</code> = <strong>${iso}</strong> ${d.toUTCString().split(' ').slice(0,4).join(' ')}. EXT4 stocke 4 timestamps : <code>i_atime</code>, <code>i_ctime</code>, <code>i_mtime</code>, <code>i_crtime</code> (crtime = nouveauté EXT4).`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 2 : Windows Event Logs — EVTX XML
  // ════════════════════════════════════════════════════════════════

  const EVTX_FIXTURES = [
    { logonType: 2,  desc: 'Interactive (console locale)' },
    { logonType: 3,  desc: 'Network (SMB, IPC$)' },
    { logonType: 4,  desc: 'Batch (tâche planifiée)' },
    { logonType: 5,  desc: 'Service' },
    { logonType: 7,  desc: 'Unlock (déverrouillage écran)' },
    { logonType: 10, desc: 'RemoteInteractive (RDP)' },
    { logonType: 11, desc: 'CachedInteractive (cred cachés)' }
  ];

  function _ipExt() {
    // IP "externe" plausible
    const ranges = [
      [185, 220], [203, 0],   // exemple TOR, RFC 5737
      [45, 33],   [193, 32],  // génériques
      [104, 21],  [142, 250]  // CDN/Google
    ];
    const r = ranges[rand(0, ranges.length-1)];
    return `${r[0]}.${r[1]}.${rand(0,255)}.${rand(1,254)}`;
  }
  function _ipInt() {
    // IP "interne" RFC 1918
    return `192.168.${rand(0,255)}.${rand(1,254)}`;
  }

  function _evtxXML(opts) {
    const ts = opts.timestamp || '2025-09-12T14:23:47.142Z';
    const eventID = opts.eventID || 4624;
    const logonType = opts.logonType !== undefined ? opts.logonType : 10;
    const account = opts.account || 'Administrator';
    const ip = opts.ip || '185.220.101.42';
    const workstation = opts.workstation || 'EXTERNE';
    return `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="Microsoft-Windows-Security-Auditing" Guid="{54849625-5478-4994-A5BA-3E3B0328C30D}"/>
    <EventID>${eventID}</EventID>
    <Version>2</Version>
    <Level>0</Level>
    <Task>12544</Task>
    <Opcode>0</Opcode>
    <Keywords>0x8020000000000000</Keywords>
    <TimeCreated SystemTime="${ts}"/>
    <EventRecordID>184523</EventRecordID>
    <Correlation/>
    <Execution ProcessID="688" ThreadID="4296"/>
    <Channel>Security</Channel>
    <Computer>DC01.contoso.local</Computer>
    <Security/>
  </System>
  <EventData>
    <Data Name="SubjectUserSid">S-1-0-0</Data>
    <Data Name="SubjectUserName">-</Data>
    <Data Name="TargetUserSid">S-1-5-21-3623811015-3361044348-30300820-500</Data>
    <Data Name="TargetUserName">${account}</Data>
    <Data Name="TargetDomainName">CONTOSO</Data>
    <Data Name="LogonType">${logonType}</Data>
    <Data Name="LogonProcessName">User32</Data>
    <Data Name="AuthenticationPackageName">Negotiate</Data>
    <Data Name="WorkstationName">${workstation}</Data>
    <Data Name="LogonGuid">{00000000-0000-0000-0000-000000000000}</Data>
    <Data Name="ProcessName">C:\\Windows\\System32\\winlogon.exe</Data>
    <Data Name="IpAddress">${ip}</Data>
    <Data Name="IpPort">51234</Data>
  </EventData>
</Event>`;
  }

  function genWinEvents() {
    const level = rand(0, 2);
    const opts = { prefix: 'winev', icon: '📋', title: 'Windows Events — EVTX XML' };

    // ── Niveau A : extraire l'EventID ──
    if (level === 0) {
      const eventID = [4624, 4625, 4634, 4648, 4672, 4688][rand(0, 5)];
      const xml = _evtxXML({ eventID, logonType: rand(2, 10), account: 'jdupont' });

      const artefactHTML = renderTextBlock(xml, {
        title: 'Sortie : Get-WinEvent -LogName Security | Select-Object -First 1 | Format-Xml',
        highlights: [{ match: '<EventID>', color: '--cyan' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici un événement extrait du journal Security d'un poste Windows. <strong>Quel est son Event ID</strong> ?`,
        inputLabel: 'Event ID :',
        placeholder: '4624',
        expected: String(eventID),
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `L'Event ID est encodé dans la balise <code>&lt;EventID&gt;...&lt;/EventID&gt;</code> dans la section <code>&lt;System&gt;</code> du XML.`,
          `Cherche la ligne <code>&lt;EventID&gt;...&lt;/EventID&gt;</code> juste après <code>&lt;Provider .../&gt;</code>.`,
          `Event ID = <strong>${eventID}</strong>. ${eventID === 4624 ? 'Logon réussi.' : eventID === 4625 ? 'Échec de logon.' : eventID === 4634 ? 'Logoff.' : eventID === 4648 ? 'Logon avec credentials explicites (runas).' : eventID === 4672 ? 'Privilèges spéciaux assignés.' : 'Process Create.'}`
        ],
        explain: `Event ID <strong>${eventID}</strong> (${eventID === 4624 ? 'Logon réussi' : eventID === 4625 ? 'Échec logon' : eventID === 4634 ? 'Logoff' : eventID === 4648 ? 'Logon credentials explicites' : eventID === 4672 ? 'Privilèges spéciaux' : 'Process Create'}). Journal : <code>Security</code>.`
      });
    }

    // ── Niveau B : extraire le LogonType ──
    if (level === 1) {
      const f = EVTX_FIXTURES[rand(0, EVTX_FIXTURES.length - 1)];
      const ip = f.logonType === 10 ? _ipExt() : (f.logonType === 3 ? _ipInt() : _ipInt());
      const xml = _evtxXML({
        eventID: 4624,
        logonType: f.logonType,
        account: ['Administrator', 'jdupont', 'msmith', 'svc_backup'][rand(0,3)],
        ip
      });

      const artefactHTML = renderTextBlock(xml, {
        title: 'Event 4624 (Logon réussi) — extrait Security.evtx',
        highlights: [
          { match: 'LogonType', color: '--gold' },
          { match: 'IpAddress', color: '--gold' }
        ]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'extraction',
        artefactHTML,
        question: `Voici un Event 4624 (logon réussi). Le champ <code>LogonType</code> indique <strong>comment</strong> l'utilisateur s'est connecté. <strong>Quelle est la valeur de LogonType</strong> ?`,
        inputLabel: 'LogonType :',
        placeholder: '10',
        expected: String(f.logonType),
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `Le LogonType est dans la section <code>&lt;EventData&gt;</code>, sous forme <code>&lt;Data Name="LogonType"&gt;X&lt;/Data&gt;</code>.`,
          `Cherche dans <code>&lt;EventData&gt;</code> la balise dont l'attribut <code>Name="LogonType"</code>. La valeur est entre les balises.`,
          `LogonType = <strong>${f.logonType}</strong> → <strong>${f.desc}</strong>.`
        ],
        explain: `LogonType <strong>${f.logonType}</strong> = ${f.desc}. Crucial en triage : LogonType 10 + IP externe = RDP exposé = signal fort de compromission ou de brute force.`
      });
    }

    // ── Niveau C : identifier le scénario d'attaque ──
    {
      // 3 scénarios typés
      const scenarios = [
        {
          ip: _ipExt(),
          logonType: 10,
          account: 'Administrator',
          workstation: 'EXTERNE',
          attackType: 'RDP externe',
          aliases: ['rdp externe', 'rdp', 'remote desktop', 'rdp depuis internet', 'rdp non autorisé'],
          desc: 'LogonType 10 + IP externe + compte privilégié = RDP exposé/abusé'
        },
        {
          ip: _ipInt(),
          logonType: 3,
          account: 'svc_backup',
          workstation: 'WORKSTATION-04',
          attackType: 'lateral movement',
          aliases: ['lateral movement', 'mouvement lateral', 'pivot smb', 'smb lateral'],
          desc: 'LogonType 3 + IP interne + compte de service utilisé hors session = pivot SMB'
        },
        {
          ip: '127.0.0.1',
          logonType: 5,
          account: 'SYSTEM',
          workstation: '-',
          attackType: 'service legitime',
          aliases: ['service legitime', 'service système', 'service', 'normal', 'légitime'],
          desc: 'LogonType 5 + IP loopback + compte SYSTEM = démarrage d\'un service Windows (bénin)'
        }
      ];
      const s = scenarios[rand(0, scenarios.length - 1)];
      const xml = _evtxXML({
        eventID: 4624,
        logonType: s.logonType,
        account: s.account,
        ip: s.ip,
        workstation: s.workstation
      });

      const artefactHTML = renderTextBlock(xml, {
        title: 'Event 4624 (Logon) — triage forensique',
        highlights: [
          { match: 'LogonType', color: '--purple' },
          { match: 'IpAddress', color: '--purple' },
          { match: 'TargetUserName', color: '--purple' }
        ]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Cet événement seul ne suffit pas à juger : il faut croiser <code>LogonType</code> + <code>IpAddress</code> + <code>TargetUserName</code>. <strong>Quelle interprétation</strong> correspond le mieux à ce contexte ?<br><span style="color:var(--dim);font-size:.85rem">Réponse attendue parmi : <code>RDP externe</code>, <code>lateral movement</code>, <code>service legitime</code></span>`,
        inputLabel: 'Type :',
        placeholder: 'RDP externe',
        expected: s.attackType,
        normalize: v => {
          const norm = v.trim().toLowerCase().replace(/[éèê]/g, 'e').replace(/[\s\-_]/g, '');
          // Vérifier contre tous les alias
          for (const alias of s.aliases) {
            const aliasNorm = alias.toLowerCase().replace(/[éèê]/g, 'e').replace(/[\s\-_]/g, '');
            if (norm === aliasNorm) return s.attackType.toLowerCase().replace(/[\s]/g, '');
          }
          return norm;
        },
        hints: [
          `Analyse les 3 champs clés ensemble : <code>LogonType</code> (comment), <code>IpAddress</code> (d'où), <code>TargetUserName</code> (qui). Chaque combinaison raconte une histoire différente.`,
          `Ici : LogonType=<strong>${s.logonType}</strong> (${EVTX_FIXTURES.find(f=>f.logonType===s.logonType)?.desc || 'autre'}), IP=<code>${s.ip}</code>, compte=<code>${s.account}</code>. ${s.attackType === 'RDP externe' ? 'IP externe + compte privilégié = signal d\'alerte.' : s.attackType === 'lateral movement' ? 'IP interne + compte de service hors contexte = pivot.' : 'IP loopback + SYSTEM = boot service normal.'}`,
          `Interprétation : <strong>${s.attackType}</strong>. ${s.desc}.`
        ],
        explain: `${s.desc}. Pattern reconnaissable au triage : combiner toujours LogonType + IP + compte cible pour distinguer normal vs malveillant.`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 3 : Linux — auth.log analyse
  // ════════════════════════════════════════════════════════════════

  function _genAuthLogLine(opts) {
    opts = opts || {};
    const ts = opts.ts || 'Sep 12 14:23:47';
    const host = opts.host || 'srv-web01';
    const pid = opts.pid || rand(1000, 9999);
    const type = opts.type || 'failed';
    const ip = opts.ip || _ipExt();
    const user = opts.user || 'root';
    const port = opts.port || rand(40000, 60000);

    if (type === 'failed') {
      return `${ts} ${host} sshd[${pid}]: Failed password for ${user === 'invalid' ? 'invalid user ' + opts.invalidUser : user} from ${ip} port ${port} ssh2`;
    } else if (type === 'accepted') {
      return `${ts} ${host} sshd[${pid}]: Accepted password for ${user} from ${ip} port ${port} ssh2`;
    } else if (type === 'sudo') {
      return `${ts} ${host} sudo: ${user} : TTY=pts/0 ; PWD=/home/${user} ; USER=root ; COMMAND=${opts.cmd || '/usr/bin/cat /etc/shadow'}`;
    } else if (type === 'session_open') {
      return `${ts} ${host} sshd[${pid}]: pam_unix(sshd:session): session opened for user ${user} by (uid=0)`;
    }
    return '';
  }

  function _fakeTimestamps(count, baseHour) {
    // Génère des timestamps consécutifs de quelques secondes d'écart
    const ts = [];
    let h = baseHour, m = rand(0, 59), s = rand(0, 59);
    for (let i = 0; i < count; i++) {
      ts.push(`Sep 12 ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      s += rand(1, 8);
      if (s >= 60) { s -= 60; m++; }
      if (m >= 60) { m -= 60; h++; }
    }
    return ts;
  }

  function genLinuxArtefacts() {
    const level = rand(0, 2);
    const opts = { prefix: 'linux', icon: '🐧', title: 'Linux — Analyse auth.log' };

    // ── Niveau A : extraire l'IP attaquant d'une ligne unique ──
    if (level === 0) {
      const ip = _ipExt();
      const line = _genAuthLogLine({ type: 'failed', ip, user: 'root', port: rand(40000, 60000) });
      const artefactHTML = renderTextBlock(line, {
        title: 'Extrait : /var/log/auth.log',
        highlights: [{ match: 'Failed password', color: '--cyan' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici une ligne unique extraite de <code>/var/log/auth.log</code> sur un serveur web exposé. <strong>Quelle est l'IP source de cette tentative de connexion</strong> ?`,
        inputLabel: 'IP :',
        placeholder: '192.168.1.1',
        expected: ip,
        normalize: v => v.trim().replace(/\s/g, ''),
        hints: [
          `Les lignes SSH d'échec ont le format <code>... Failed password for &lt;user&gt; from &lt;IP&gt; port &lt;port&gt; ssh2</code>. L'IP suit immédiatement le mot-clé <code>from</code>.`,
          `Repère <code>from</code> dans la ligne — l'IP est le mot juste après.`,
          `IP = <strong>${ip}</strong>. C'est la source de la tentative SSH.`
        ],
        explain: `IP attaquant = <strong>${ip}</strong>. Pour bloquer : <code>iptables -A INPUT -s ${ip} -j DROP</code> (ou via fail2ban / firewalld).`
      });
    }

    // ── Niveau B : compter les tentatives échouées depuis 1 IP ──
    if (level === 1) {
      const targetIP = _ipExt();
      const failCount = rand(5, 12);
      const noiseCount = rand(2, 4); // lignes de "bruit" : autres événements
      const lines = [];
      const ts = _fakeTimestamps(failCount + noiseCount, rand(8, 22));

      // Lignes d'échec depuis l'IP cible
      const users = ['admin', 'administrator', 'root', 'pi', 'oracle', 'ubuntu', 'postgres'];
      for (let i = 0; i < failCount; i++) {
        lines.push(_genAuthLogLine({
          ts: ts[i],
          type: 'failed',
          ip: targetIP,
          user: users[rand(0, users.length-1)],
          port: rand(40000, 60000)
        }));
      }
      // Bruit : autres événements
      for (let i = 0; i < noiseCount; i++) {
        const t = ['accepted', 'sudo', 'session_open'][rand(0,2)];
        if (t === 'sudo') lines.push(_genAuthLogLine({ ts: ts[failCount + i], type: 'sudo', user: 'jdupont' }));
        else lines.push(_genAuthLogLine({ ts: ts[failCount + i], type: t, ip: _ipInt(), user: 'jdupont' }));
      }
      // Mélanger
      lines.sort(() => Math.random() - 0.5);

      const artefactHTML = renderTextBlock(lines.join('\n'), {
        title: `Extrait : /var/log/auth.log (${lines.length} lignes)`,
        highlights: [{ match: targetIP, color: '--gold' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'extraction',
        artefactHTML,
        question: `<strong>Combien de tentatives de connexion SSH ÉCHOUÉES</strong> ont été faites depuis l'IP <code>${targetIP}</code> ? (Ignorer les autres événements : sudo, sessions, etc.)`,
        inputLabel: 'Nombre :',
        placeholder: '7',
        expected: String(failCount),
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `Cherche les lignes contenant à la fois <code>Failed password</code> ET l'IP cible. Le pattern shell typique : <code>grep "Failed password" auth.log | grep ${targetIP} | wc -l</code>.`,
          `Compte uniquement les lignes <code>Failed password ... from ${targetIP}</code>. Les lignes <code>Accepted password</code>, <code>sudo:</code> ou <code>session opened</code> ne comptent pas même si l'IP y figure.`,
          `Nombre de <code>Failed password</code> depuis ${targetIP} = <strong>${failCount}</strong>.`
        ],
        explain: `<strong>${failCount} tentatives échouées</strong> depuis ${targetIP}. Signature brute force SSH. Réaction : ban via fail2ban (<code>fail2ban-client set sshd banip ${targetIP}</code>) + investigation des autres logs.`
      });
    }

    // ── Niveau C : identifier l'utilisateur ciblé en majorité ──
    {
      const ip = _ipExt();
      const targets = ['root', 'admin', 'administrator', 'ubuntu'];
      const targetUser = targets[rand(0, targets.length-1)];
      // Le targetUser apparaît N fois, les autres 1-2 fois
      const nTarget = rand(6, 10);
      const lines = [];
      const ts = _fakeTimestamps(nTarget + 6, rand(0, 23));

      for (let i = 0; i < nTarget; i++) {
        lines.push(_genAuthLogLine({
          ts: ts[i], type: 'failed', ip, user: targetUser, port: rand(40000, 60000)
        }));
      }
      // Autres utilisateurs (max 2 chacun pour ne pas concurrencer)
      const others = targets.filter(u => u !== targetUser);
      let idx = nTarget;
      for (const u of others) {
        const n = rand(1, 2);
        for (let i = 0; i < n; i++) {
          lines.push(_genAuthLogLine({
            ts: ts[idx++], type: 'failed', ip, user: u, port: rand(40000, 60000)
          }));
        }
      }
      lines.sort(() => Math.random() - 0.5);

      const artefactHTML = renderTextBlock(lines.join('\n'), {
        title: `Extrait : /var/log/auth.log (${lines.length} lignes — toutes depuis ${ip})`,
        highlights: [{ match: targetUser, color: '--purple' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Toutes ces tentatives viennent de la même IP, mais ciblent différents comptes. <strong>Quel compte utilisateur est ciblé majoritairement</strong> (= le plus de fois) ?`,
        inputLabel: 'Utilisateur :',
        placeholder: 'root',
        expected: targetUser,
        normalize: v => v.trim().toLowerCase(),
        hints: [
          `Pour chaque ligne <code>Failed password for &lt;user&gt; from ...</code>, extrais le <code>&lt;user&gt;</code>. Compte les occurrences. Shell : <code>grep "Failed password" auth.log | awk '{print $9}' | sort | uniq -c | sort -rn</code>.`,
          `Cherche le mot juste après <code>Failed password for</code> sur chaque ligne. Compte combien de fois chaque nom apparaît.`,
          `Utilisateur le plus ciblé : <strong>${targetUser}</strong> (${nTarget} tentatives). Attaque par dictionnaire d'usernames sur compte privilégié.`
        ],
        explain: `<strong>${targetUser}</strong> ciblé ${nTarget} fois sur ${lines.length}. Compte privilégié = forte priorité pour l'attaquant. Recommandation : désactiver login SSH direct pour root (<code>PermitRootLogin no</code>) et n'autoriser que des clés.`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 4 : macOS — KnowledgeC.db query
  // ════════════════════════════════════════════════════════════════

  const MACOS_APPS = [
    { bundleId: 'com.apple.Safari',          name: 'Safari' },
    { bundleId: 'com.apple.mail',            name: 'Mail' },
    { bundleId: 'com.tinyspeck.slackmacgap', name: 'Slack' },
    { bundleId: 'com.microsoft.Word',        name: 'Microsoft Word' },
    { bundleId: 'com.google.Chrome',         name: 'Google Chrome' },
    { bundleId: 'com.mozilla.firefox',       name: 'Firefox' },
    { bundleId: 'com.apple.iCal',            name: 'Calendar' },
    { bundleId: 'com.spotify.client',        name: 'Spotify' },
    { bundleId: 'com.tor-project.TorBrowser',name: 'Tor Browser' },
    { bundleId: 'org.signal.Signal',         name: 'Signal' },
    { bundleId: 'com.protonmail.protonmail', name: 'ProtonMail' }
  ];

  function _macTimestamp(date) {
    // Format : 2025-09-12 14:23:47
    return date.toISOString().replace('T',' ').slice(0, 19);
  }

  function _kc_dbQuery(rows) {
    // Format réaliste sqlite3 -separator '|'
    return rows.map(r =>
      `${r.start}|${r.end}|${r.bundleId}|${r.duration}`
    ).join('\n');
  }

  function genMacOSArtefacts() {
    const level = rand(0, 2);
    const opts = { prefix: 'macos', icon: '🍎', title: 'macOS — KnowledgeC.db' };

    // ── Niveau A : 1 ligne, extraire bundle ID ──
    if (level === 0) {
      const app = MACOS_APPS[rand(0, MACOS_APPS.length - 1)];
      const start = new Date(Date.now() - rand(1, 30) * 3600 * 1000);
      const end = new Date(start.getTime() + rand(300, 3600) * 1000);
      const duration = Math.floor((end - start) / 1000);

      const query = `sqlite3 ~/Library/Application\\ Support/Knowledge/knowledgeC.db <<EOF
.headers on
.separator "|"
SELECT
  datetime(ZSTARTDATE+978307200, 'unixepoch', 'localtime') AS start,
  datetime(ZENDDATE+978307200,   'unixepoch', 'localtime') AS end,
  ZVALUESTRING AS bundle_id,
  CAST(ZENDDATE - ZSTARTDATE AS INTEGER) AS duration_sec
FROM ZOBJECT
WHERE ZSTREAMNAME = '/app/inFocus'
ORDER BY ZSTARTDATE DESC
LIMIT 1;
EOF

start|end|bundle_id|duration_sec
${_macTimestamp(start)}|${_macTimestamp(end)}|${app.bundleId}|${duration}`;

      const artefactHTML = renderTextBlock(query, {
        title: 'Output : analyse KnowledgeC.db (table ZOBJECT, stream /app/inFocus)',
        highlights: [{ match: app.bundleId, color: '--cyan' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici le résultat d'une requête SQLite sur <code>KnowledgeC.db</code> (artefact macOS qui trace l'activité utilisateur). Le stream <code>/app/inFocus</code> enregistre quelle application était au premier plan. <strong>Quel est le bundle ID de l'application</strong> utilisée ?`,
        inputLabel: 'Bundle ID :',
        placeholder: 'com.apple.Safari',
        expected: app.bundleId,
        normalize: v => v.trim().toLowerCase(),
        hints: [
          `Le bundle ID est dans la colonne <code>bundle_id</code> (= champ <code>ZVALUESTRING</code> dans la table <code>ZOBJECT</code>). Il commence typiquement par <code>com.</code>, <code>org.</code> ou similaire.`,
          `Regarde la 3e colonne (séparée par <code>|</code>) sous l'en-tête.`,
          `Bundle ID = <strong>${app.bundleId}</strong> (= ${app.name}).`
        ],
        explain: `<strong>${app.bundleId}</strong> = ${app.name}. KnowledgeC.db trace toutes les apps lancées + durée — mine d'or forensique documentée par Sarah Edwards (mac4n6.com). Outils : APOLLO, mac_apt.`
      });
    }

    // ── Niveau B : plusieurs lignes, app à une heure donnée ──
    if (level === 1) {
      // 4 lignes, on demande l'app utilisée à une heure ciblée
      const rows = [];
      const apps = [...MACOS_APPS].sort(() => Math.random() - 0.5).slice(0, 4);
      let cursor = new Date();
      cursor.setHours(rand(8, 18), 0, 0, 0);
      for (let i = 0; i < 4; i++) {
        const start = new Date(cursor);
        const dur = rand(600, 2400);
        const end = new Date(start.getTime() + dur * 1000);
        rows.push({
          start: _macTimestamp(start),
          end: _macTimestamp(end),
          bundleId: apps[i].bundleId,
          name: apps[i].name,
          duration: dur
        });
        cursor = new Date(end.getTime() + rand(60, 300) * 1000);
      }
      // Choisir une heure dans la 2e ou 3e session
      const target = rows[rand(1, 2)];
      const midTime = new Date((new Date(target.start + 'Z').getTime() + new Date(target.end + 'Z').getTime()) / 2);
      const probeTime = _macTimestamp(midTime);

      const tableText = `start|end|bundle_id|duration_sec\n${_kc_dbQuery(rows)}`;
      const artefactHTML = renderTextBlock(tableText, {
        title: 'Output : sessions /app/inFocus (KnowledgeC.db, dernières 4 lignes)',
        highlights: [{ match: target.bundleId, color: '--gold' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'extraction',
        artefactHTML,
        question: `À <strong>${probeTime}</strong>, quelle application était au premier plan ? <strong>Donne son bundle ID</strong>.`,
        inputLabel: 'Bundle ID :',
        placeholder: 'com.apple.Safari',
        expected: target.bundleId,
        normalize: v => v.trim().toLowerCase(),
        hints: [
          `Pour chaque ligne, regarde l'intervalle <code>[start, end]</code>. Trouve celle dont l'intervalle contient <code>${probeTime}</code>.`,
          `Cherche la ligne où <code>start ≤ ${probeTime} ≤ end</code>. Plage cible : entre <code>${target.start}</code> et <code>${target.end}</code>.`,
          `À <code>${probeTime}</code>, l'app active était <strong>${target.bundleId}</strong> (= ${target.name}).`
        ],
        explain: `App active à ${probeTime} : <strong>${target.bundleId}</strong> (${target.name}). KnowledgeC.db permet de reconstituer la timeline d'usage avec précision seconde par seconde.`
      });
    }

    // ── Niveau C : durée totale d'usage en minutes ──
    {
      const app = MACOS_APPS[rand(0, MACOS_APPS.length - 1)];
      const others = MACOS_APPS.filter(a => a !== app).slice(0, 3);
      // Sessions de l'app cible (3-4 sessions)
      const nSessions = rand(3, 4);
      const rows = [];
      let cursor = new Date();
      cursor.setHours(rand(8, 12), 0, 0, 0);
      let totalAppSec = 0;

      const sessionList = [];
      for (let i = 0; i < nSessions; i++) {
        sessionList.push({ isTarget: true, dur: rand(180, 900) });
      }
      // Ajouter des sessions d'autres apps
      for (let i = 0; i < 3; i++) {
        sessionList.push({ isTarget: false, dur: rand(120, 600), bundleId: others[i].bundleId });
      }
      sessionList.sort(() => Math.random() - 0.5);

      for (const s of sessionList) {
        const start = new Date(cursor);
        const end = new Date(start.getTime() + s.dur * 1000);
        rows.push({
          start: _macTimestamp(start),
          end: _macTimestamp(end),
          bundleId: s.isTarget ? app.bundleId : s.bundleId,
          duration: s.dur
        });
        if (s.isTarget) totalAppSec += s.dur;
        cursor = new Date(end.getTime() + rand(30, 120) * 1000);
      }
      const totalMin = Math.round(totalAppSec / 60);

      const tableText = `start|end|bundle_id|duration_sec\n${_kc_dbQuery(rows)}`;
      const artefactHTML = renderTextBlock(tableText, {
        title: `Output : toutes sessions /app/inFocus (${rows.length} lignes)`,
        highlights: [{ match: app.bundleId, color: '--purple' }]
      });

      return buildPracticeCard({
        ...opts,
        badge: 'calcul',
        artefactHTML,
        question: `<strong>Quelle est la durée totale d'utilisation de <code>${app.bundleId}</code></strong> (en minutes, arrondi à l'entier le plus proche) sur cette période ?`,
        inputLabel: 'Minutes :',
        placeholder: '15',
        expected: String(totalMin),
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `Filtre les lignes où <code>bundle_id = ${app.bundleId}</code>. Pour chaque ligne, prends la colonne <code>duration_sec</code>. Additionne, puis divise par 60.`,
          `Sessions de <code>${app.bundleId}</code> : ${rows.filter(r => r.bundleId === app.bundleId).map(r => r.duration + 's').join(' + ')} = ${totalAppSec}s. En minutes : ${totalAppSec} / 60.`,
          `Total = ${totalAppSec} secondes = <strong>${totalMin} minutes</strong> (arrondi).`
        ],
        explain: `Durée d'usage de ${app.name} : <strong>${totalMin} minutes</strong> (${totalAppSec} sec sur ${nSessions} sessions). Méthode forensique standard pour reconstituer le temps réel passé sur une app.`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Enregistrement dans GENERATORS
  // ════════════════════════════════════════════════════════════════
  if (typeof window !== 'undefined' && window.GENERATORS) {
    window.GENERATORS.ext4  = genEXT4;
    window.GENERATORS.winev = genWinEvents;
    window.GENERATORS.linux = genLinuxArtefacts;
    window.GENERATORS.macos = genMacOSArtefacts;
  } else if (typeof GENERATORS !== 'undefined') {
    GENERATORS.ext4  = genEXT4;
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
