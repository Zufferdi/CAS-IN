// ═══════════════════════════════════════════════════════════════════
// tp-engine-easy.js — CAS-IN TP delta v101 (REFONTE PRATIQUE)
// 4 TP "faciles, progressifs" : CIDR, AES, Cassage, PKI
// Chaque TP a 3 sous-types A → B → C (lecture → identification → calcul léger)
// Style : artefact concret (hexdump, dump openssl, hash brut) + input + 3 indices
// Chargé APRÈS tp-engine.js (utilise rand, STATE, renderHexDump, showTPHint, helpers)
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // HELPER : carte pratique standard (artefact + input + 3 indices)
  // ────────────────────────────────────────────────────────────────
  // opts: {
  //   prefix:  'cidr',
  //   icon:    '🌐',
  //   title:   'CIDR — Lecture IP',
  //   badge:   'lecture' | 'identification' | 'calcul',
  //   artefactHTML: '<div>...hexdump...</div>',   // le bloc visuel central
  //   question: 'Quelle est l\'adresse IP ?',
  //   inputLabel: 'Adresse :',
  //   placeholder: '192.168.1.1',
  //   expected: '192.168.1.10',                    // string attendue (comparaison normalisée)
  //   normalize: v => v.trim().replace(/\s/g,''),  // optionnel : normaliser avant compare
  //   hints: ['Méthode...', 'Où regarder...', 'Réponse étape par étape...'],
  //   explain: '✅ Explication finale après bonne réponse'
  // }
  function buildPracticeCard(opts) {
    const id = opts.prefix;
    const div = document.createElement('div');
    div.className = 'ex-card';

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-${id}">${opts.icon || '🔧'}</div>
        <div class="ex-title">${opts.title}</div>
        <span class="ex-badge easy">${opts.badge || 'pratique'}</span>
      </div>

      <div class="ex-scenario">
        ${opts.question}
      </div>

      <div style="margin:.7rem 0">
        ${opts.artefactHTML}
      </div>

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
        const ok = got === exp;

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
          fb.innerHTML = `✗ "<code>${escapeHTML(inp.value)}</code>" incorrect. Utilise les indices progressifs pour t'aider, ou réessaie.`;
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
        // Déverrouiller le niveau suivant
        if (level < 3) {
          const next = div.querySelector(`#btn-hint${level+1}-${id}`);
          if (next) { next.disabled = false; next.style.opacity = '1'; }
        }
        // Griser le niveau courant
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

  // Utilitaire : escape HTML pour affichage sûr d'entrée utilisateur dans le feedback
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // Utilitaire : générer un hexdump simple en tableau (sans renderHexDump complet)
  // Pour les petits dumps (< 32 octets) on a un rendu compact suffisant
  function tinyHexDump(bytes, opts) {
    opts = opts || {};
    const title = opts.title || '';
    const annotations = opts.annotations || []; // [{from, to, color, label}]
    const cols = opts.cols || 8;

    const hexCells = bytes.map((b, i) => {
      const ann = annotations.find(a => a.from <= i && i <= a.to);
      const color = ann ? `color:var(${ann.color || '--cyan'});font-weight:700;background:rgba(255,255,255,.05);border-radius:3px` : 'color:var(--text)';
      const tip = ann ? ` title="${ann.label || ''}"` : '';
      return `<span style="padding:2px 4px;display:inline-block;min-width:24px;text-align:center;${color}"${tip}>${b.toString(16).toUpperCase().padStart(2,'0')}</span>`;
    });

    // ASCII
    const ascii = bytes.map(b => (b >= 0x20 && b < 0x7F) ? String.fromCharCode(b) : '.').join('');

    // Découper en lignes de `cols` octets
    const lines = [];
    for (let i = 0; i < hexCells.length; i += cols) {
      const offset = i.toString(16).toUpperCase().padStart(4, '0');
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

  // ════════════════════════════════════════════════════════════════
  // TP 1 : CIDR — Lecture d'IPv4 en hexadécimal
  // ════════════════════════════════════════════════════════════════

  function genCIDR() {
    const level = rand(0, 2); // A, B, C
    const opts = { prefix: 'cidr', icon: '🌐', title: 'CIDR — Lecture IP en hex' };

    // ── Niveau A : convertir 4 octets hex → IP décimale ──
    if (level === 0) {
      const ipBytes = [
        rand(1, 223), rand(0, 255), rand(0, 255), rand(1, 254)
      ];
      // Éviter le 127.x.x.x (loopback) qui pourrait dérouter
      if (ipBytes[0] === 127) ipBytes[0] = 10;
      const ipStr = ipBytes.join('.');

      const artefactHTML = tinyHexDump(ipBytes, {
        title: 'Champ "Source IP" — paquet IPv4 (RFC 791)',
        annotations: [{from: 0, to: 3, color: '--cyan', label: 'Source IP'}],
        cols: 4
      });

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici 4 octets bruts extraits d'un en-tête IPv4. <strong>Quelle est cette adresse IP en notation décimale pointée</strong> ?`,
        inputLabel: 'IP :',
        placeholder: 'x.x.x.x',
        expected: ipStr,
        normalize: v => v.trim().replace(/\s/g, ''),
        hints: [
          `Chaque octet hex se convertit indépendamment en décimal (0–255). Le format final est <code>X.X.X.X</code> séparé par des points.`,
          `4 octets en hex : <code>${ipBytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code>. Convertis chacun en base 10.`,
          `<code>${ipBytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join('</code> = <code>')}</code> = <code>${ipBytes.join('</code>, <code>')}</code> → IP = <strong>${ipStr}</strong>`
        ],
        explain: `<code>${ipBytes.map(b => '0x'+b.toString(16).toUpperCase().padStart(2,'0')).join(', ')}</code> = <strong>${ipStr}</strong>. Chaque octet hex = 1 nombre décimal entre 0 et 255.`
      });
    }

    // ── Niveau B : IP + masque → notation CIDR /N ──
    if (level === 1) {
      const ipBytes = [
        rand(1, 223), rand(0, 255), rand(0, 255), rand(1, 254)
      ];
      if (ipBytes[0] === 127) ipBytes[0] = 10;
      const prefix = [8, 16, 24, 25, 26, 27, 28][rand(0, 6)];
      const maskBytes = [];
      let bits = prefix;
      for (let i = 0; i < 4; i++) {
        if (bits >= 8) { maskBytes.push(0xFF); bits -= 8; }
        else if (bits > 0) { maskBytes.push((0xFF << (8 - bits)) & 0xFF); bits = 0; }
        else { maskBytes.push(0); }
      }
      const ipStr = ipBytes.join('.');
      const cidrStr = `${ipStr}/${prefix}`;
      const allBytes = [...ipBytes, ...maskBytes];

      const artefactHTML = tinyHexDump(allBytes, {
        title: 'Routing table entry (extrait pcap)',
        annotations: [
          {from: 0, to: 3, color: '--cyan',  label: 'IP source'},
          {from: 4, to: 7, color: '--gold',  label: 'Subnet mask'}
        ],
        cols: 8
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Voici une entrée brute d'une table de routage : 4 octets d'IP suivis de 4 octets de masque. <strong>Quelle est l'adresse en notation CIDR</strong> (<code>x.x.x.x/y</code>) ?`,
        inputLabel: 'CIDR :',
        placeholder: '192.168.1.0/24',
        expected: cidrStr,
        normalize: v => v.trim().replace(/\s/g, ''),
        hints: [
          `Convertis d'abord les 4 premiers octets en IP décimale. Puis compte le nombre de bits à 1 dans le masque (= la valeur après le <code>/</code>).`,
          `IP : <code>${ipBytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code> = <code>${ipStr}</code>. Masque : <code>${maskBytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code> — compte les <strong>1</strong> en binaire.`,
          `Masque <code>${maskBytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code> = ${maskBytes.map(b => b.toString(2).padStart(8,'0')).join('.')} binaire = ${prefix} bits à 1 → /<strong>${prefix}</strong>. CIDR = <strong>${cidrStr}</strong>`
        ],
        explain: `IP <code>${ipStr}</code> + masque <code>${maskBytes.join('.')}</code> (= ${prefix} bits à 1) → <strong>${cidrStr}</strong>.`
      });
    }

    // ── Niveau C : IP + masque → adresse réseau (calcul léger) ──
    const oct3 = rand(0, 255);
    const ipBytes = [192, 168, oct3, rand(20, 254)];
    const prefix = [24, 26, 27, 28][rand(0, 3)];
    const maskBytes = [];
    {
      let bits = prefix;
      for (let i = 0; i < 4; i++) {
        if (bits >= 8) { maskBytes.push(0xFF); bits -= 8; }
        else if (bits > 0) { maskBytes.push((0xFF << (8 - bits)) & 0xFF); bits = 0; }
        else { maskBytes.push(0); }
      }
    }
    // Adresse réseau = IP AND masque
    const netBytes = ipBytes.map((b, i) => b & maskBytes[i]);
    const ipStr  = ipBytes.join('.');
    const netStr = netBytes.join('.');
    const allBytes = [...ipBytes, ...maskBytes];

    const artefactHTML = tinyHexDump(allBytes, {
      title: 'Firewall log — connexion',
      annotations: [
        {from: 0, to: 3, color: '--cyan', label: 'Client IP'},
        {from: 4, to: 7, color: '--gold', label: 'Subnet mask'}
      ],
      cols: 8
    });

    return buildPracticeCard({
      ...opts,
      badge: 'calcul',
      artefactHTML,
      question: `Une connexion est loguée avec son IP cliente et le masque de son sous-réseau. <strong>Quelle est l'adresse réseau (network address)</strong> de ce sous-réseau ?`,
      inputLabel: 'Network :',
      placeholder: '192.168.0.0',
      expected: netStr,
      normalize: v => v.trim().replace(/\s/g, ''),
      hints: [
        `L'adresse réseau s'obtient par <code>IP AND masque</code> (bit-à-bit). Tous les bits d'hôte (= bits à 0 dans le masque) deviennent 0.`,
        `IP = <code>${ipStr}</code>. Masque = <code>${maskBytes.join('.')}</code> = /${prefix}. Sur chaque octet, garde les bits où le masque est à 1.`,
        `Octet par octet : ${ipBytes.map((b, i) => `${b} AND ${maskBytes[i]} = ${b & maskBytes[i]}`).join(' | ')} → réseau = <strong>${netStr}</strong>`
      ],
      explain: `IP <code>${ipStr}</code> AND masque <code>${maskBytes.join('.')}</code> (/${prefix}) = <strong>${netStr}</strong>. Tous les bits d'hôte (les ${32-prefix} bits de poids faible) sont mis à 0.`
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TP 2 : AES — Décoder le header d'un fichier chiffré
  // ════════════════════════════════════════════════════════════════

  function genAES() {
    const level = rand(0, 2);
    const opts = { prefix: 'aes', icon: '🔐', title: 'AES — Décoder un header chiffré' };

    // ── Niveau A : magic header ASCII → identifier la version AES ──
    if (level === 0) {
      const variants = ['AES128', 'AES192', 'AES256'];
      const variant = variants[rand(0, 2)];
      // Header = ASCII bytes + 2 bytes padding 00
      const headerBytes = [...variant].map(c => c.charCodeAt(0));
      while (headerBytes.length < 8) headerBytes.push(0x00);

      const artefactHTML = tinyHexDump(headerBytes, {
        title: 'Premiers octets d\'un fichier .enc',
        annotations: [{from: 0, to: 5, color: '--cyan', label: 'Magic ASCII'}],
        cols: 8
      });

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici les 8 premiers octets d'un fichier <code>.enc</code> trouvé sur un poste. Le <strong>magic header</strong> identifie l'algorithme et la taille de clé. <strong>Quel variant AES a été utilisé</strong> ?`,
        inputLabel: 'Variant :',
        placeholder: 'AES128',
        expected: variant,
        normalize: v => v.trim().toUpperCase().replace(/[\s\-_]/g, ''),
        hints: [
          `Les magic headers commencent souvent par des octets ASCII lisibles. Regarde la colonne ASCII à droite du dump hex.`,
          `Les 6 premiers octets sont des caractères ASCII imprimables. Convertis chaque octet hex en caractère : <code>${headerBytes.slice(0,6).map(b => '0x'+b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code>.`,
          `<code>${headerBytes.slice(0,6).map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code> = ASCII <code>"${variant}"</code>. Réponse : <strong>${variant}</strong>`
        ],
        explain: `Le magic ASCII <code>"${variant}"</code> annonce <strong>${variant.replace('AES', 'AES-')}</strong>. Conventions courantes pour identifier l'algorithme + taille de clé en début de fichier chiffré.`
      });
    }

    // ── Niveau B : header + 16 octets IV → identifier la taille de clé en bits ──
    if (level === 1) {
      const sizes = [128, 192, 256];
      const keyBits = sizes[rand(0, 2)];
      const headerStr = `AES${keyBits}\0\0`;
      const headerBytes = [...headerStr].map(c => c.charCodeAt(0));
      const ivBytes = Array.from({length: 16}, () => rand(0, 255));
      const allBytes = [...headerBytes, ...ivBytes];

      const artefactHTML = tinyHexDump(allBytes, {
        title: 'Fichier confidentiel.enc (24 premiers octets)',
        annotations: [
          {from: 0, to: 7,   color: '--cyan', label: 'Magic header (8 octets)'},
          {from: 8, to: 23,  color: '--gold', label: 'IV — Initialization Vector (16 octets)'}
        ],
        cols: 8
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Un fichier chiffré a été récupéré. Les 8 premiers octets sont un magic header ASCII, suivi de 16 octets d'IV. <strong>Quelle est la taille de la clé en bits</strong> ?`,
        inputLabel: 'Bits :',
        placeholder: '128',
        expected: String(keyBits),
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `La taille de clé est encodée dans le magic ASCII en début de fichier. AES-N = clé de N bits.`,
          `Lis les 8 premiers octets en ASCII (colonne de droite). Tu y verras quelque chose comme <code>AESxxx</code>.`,
          `Le header est <code>"${headerStr.replace(/\0/g, '·')}"</code> = AES${keyBits}. La taille de clé = <strong>${keyBits} bits</strong> = ${keyBits/8} octets.`
        ],
        explain: `Header <code>AES${keyBits}</code> → clé de <strong>${keyBits} bits</strong> (${keyBits/8} octets). L'IV suit immédiatement, sur 16 octets — taille de bloc AES fixe (FIPS 197).`
      });
    }

    // ── Niveau C : extraire l'IV en hex (sans espaces) ──
    {
      const keyBits = [128, 256][rand(0, 1)];
      const headerStr = `AES${keyBits}\0\0`;
      const headerBytes = [...headerStr].map(c => c.charCodeAt(0));
      const ivBytes = Array.from({length: 16}, () => rand(0, 255));
      const allBytes = [...headerBytes, ...ivBytes];
      const ivHex = ivBytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');

      const artefactHTML = tinyHexDump(allBytes, {
        title: 'message_chiffre.enc — octets 0–23',
        annotations: [
          {from: 0, to: 7,   color: '--cyan', label: 'Magic header'},
          {from: 8, to: 23,  color: '--gold', label: 'IV (Initialization Vector)'}
        ],
        cols: 8
      });

      return buildPracticeCard({
        ...opts,
        badge: 'extraction',
        artefactHTML,
        question: `Pour déchiffrer ce fichier AES-${keyBits} en CBC, il te faut l'<strong>IV exact</strong>. Les 16 octets après le header sont l'IV. <strong>Extrais-les en hexadécimal continu</strong> (32 caractères, sans espaces).`,
        inputLabel: 'IV (hex) :',
        placeholder: '00112233445566778899AABBCCDDEEFF',
        expected: ivHex,
        normalize: v => v.trim().toUpperCase().replace(/[\s\-:]/g, ''),
        hints: [
          `L'IV fait toujours 16 octets pour AES (= taille de bloc, indépendamment de la taille de clé). Il commence à l'offset 8.`,
          `Lis les 16 octets entre l'offset <code>0x08</code> et <code>0x17</code>. Recopie-les en hex sans les espaces.`,
          `IV = <code style="font-size:.75rem;word-break:break-all">${ivHex}</code> (32 caractères hex = 16 octets).`
        ],
        explain: `IV de <strong>16 octets</strong> = ${ivHex}. Taille fixe AES (= taille de bloc, FIPS 197), indépendante de AES-128/192/256.`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 3 : Cassage — Identifier un hash réel
  // ════════════════════════════════════════════════════════════════

  // Générateurs de hash plausibles
  function _randomHex(len) {
    let s = '';
    for (let i = 0; i < len; i++) s += '0123456789abcdef'[rand(0, 15)];
    return s;
  }
  function _randomBcryptHash() {
    // Format $2y$10$22charsSalt53charsHash (réaliste)
    const cost = ['10', '12'][rand(0, 1)];
    const b64chars = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let salt = ''; for (let i = 0; i < 22; i++) salt += b64chars[rand(0, 63)];
    let hash = ''; for (let i = 0; i < 31; i++) hash += b64chars[rand(0, 63)];
    return `$2y$${cost}$${salt}${hash}`;
  }

  function genCracking() {
    const level = rand(0, 2);
    const opts = { prefix: 'crack', icon: '💥', title: 'Cassage — Identifier le hash' };

    // ── Niveau A : MD5 (32 hex) → identifier algo ──
    if (level === 0) {
      const hash = _randomHex(32);
      const contexts = [
        { src: 'fichiers téléchargés depuis le site officiel', note: 'Souvent fourni comme empreinte d\'intégrité (ex: téléchargement ISO Debian).' },
        { src: 'cache d\'un proxy web', note: 'Ancien usage : empreinte de fichier pour cache.' },
        { src: 'rapport antivirus VirusTotal (champ "MD5")', note: 'Standard pour identifier des binaires malveillants — bien que cryptographiquement cassé pour les passwords.' },
      ];
      const ctx = contexts[rand(0, contexts.length - 1)];

      const artefactHTML = `
        <div style="border:1px solid var(--border);border-radius:8px;background:var(--bg);padding:1rem">
          <div style="font-size:.7rem;color:var(--dim);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">Hash extrait des ${ctx.src}</div>
          <code style="display:block;font-family:var(--mono);color:var(--cyan);word-break:break-all;font-size:.95rem;letter-spacing:.04em;padding:.5rem;background:rgba(255,255,255,.03);border-radius:4px">${hash}</code>
          <div style="margin-top:.5rem;font-size:.75rem;color:var(--dim)">Longueur : <strong>${hash.length} caractères hexadécimaux</strong></div>
        </div>
      `;

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Voici un hash trouvé en investigation. <strong>Quel algorithme l'a produit</strong> ? (Indice : sa longueur en hex est une signature claire.)`,
        inputLabel: 'Algorithme :',
        placeholder: 'MD5',
        expected: 'MD5',
        normalize: v => v.trim().toUpperCase().replace(/[\s\-_]/g, ''),
        hints: [
          `Compte les caractères hexadécimaux. Chaque algo produit une longueur fixe.`,
          `${hash.length} caractères hex × 4 bits/caractère = <strong>${hash.length * 4} bits</strong>. Quel algo produit ${hash.length * 4} bits ?`,
          `${hash.length * 4} bits = <strong>MD5</strong> (Message Digest 5). 32 hex = 128 bits, signature unique de MD5.`
        ],
        explain: `<strong>32 hex = 128 bits = MD5</strong>. ${ctx.note} (Cassé depuis 2004 pour les collisions, mais encore vu en intégrité de fichiers.)`
      });
    }

    // ── Niveau B : SHA-256 (64 hex) → identifier algo ──
    if (level === 1) {
      const hash = _randomHex(64);
      const contexts = [
        'manifest npm — champ <code>"integrity"</code> sha256-...',
        'fichier <code>sha256sums.txt</code> d\'une distribution Linux',
        'API Bitcoin — empreinte de bloc',
        'output <code>shasum -a 256</code> sur un binaire malveillant',
      ];
      const ctx = contexts[rand(0, contexts.length - 1)];

      const artefactHTML = `
        <div style="border:1px solid var(--border);border-radius:8px;background:var(--bg);padding:1rem">
          <div style="font-size:.7rem;color:var(--dim);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">Hash extrait de : ${ctx}</div>
          <code style="display:block;font-family:var(--mono);color:var(--cyan);word-break:break-all;font-size:.85rem;letter-spacing:.04em;padding:.5rem;background:rgba(255,255,255,.03);border-radius:4px">${hash}</code>
          <div style="margin-top:.5rem;font-size:.75rem;color:var(--dim)">Longueur : <strong>${hash.length} caractères hexadécimaux</strong></div>
        </div>
      `;

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `<strong>Quel algorithme de hachage</strong> a produit ce condensat ?`,
        inputLabel: 'Algorithme :',
        placeholder: 'SHA-256',
        expected: 'SHA-256',
        normalize: v => v.trim().toUpperCase().replace(/[\s_]/g, '').replace('SHA256', 'SHA-256'),
        hints: [
          `Compte les caractères. Tableau de référence — MD5: 32, SHA-1: 40, SHA-256: 64, SHA-384: 96, SHA-512: 128.`,
          `${hash.length} caractères hex = ${hash.length * 4} bits. Cherche dans le tableau.`,
          `${hash.length * 4} bits = <strong>SHA-256</strong> (Secure Hash Algorithm 256 bits, famille SHA-2). Réponse : <strong>SHA-256</strong>.`
        ],
        explain: `<strong>64 hex = 256 bits = SHA-256</strong>. Algorithme NIST FIPS 180-4, largement utilisé pour les empreintes d'intégrité (npm, Linux, blockchain).`
      });
    }

    // ── Niveau C : bcrypt → mode hashcat ──
    {
      const hash = _randomBcryptHash();
      const cost = hash.split('$')[2];

      const artefactHTML = `
        <div style="border:1px solid var(--border);border-radius:8px;background:var(--bg);padding:1rem">
          <div style="font-size:.7rem;color:var(--dim);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">Ligne extraite de <code>/etc/shadow</code></div>
          <div style="font-family:var(--mono);font-size:.85rem">
            <span style="color:var(--text)">admin</span><span style="color:var(--dim)">:</span><code style="color:var(--cyan);word-break:break-all">${hash}</code><span style="color:var(--dim)">:19850:0:99999:7:::</span>
          </div>
          <div style="margin-top:.7rem;font-size:.75rem;color:var(--dim)">Tu veux tenter une attaque par dictionnaire avec <code>hashcat</code>.</div>
        </div>
      `;

      return buildPracticeCard({
        ...opts,
        badge: 'lookup',
        artefactHTML,
        question: `Pour cracker ce hash avec <code>hashcat</code>, tu dois spécifier le bon mode avec l'option <code>-m</code>. <strong>Quel est le numéro de mode hashcat</strong> pour ce type de hash ?`,
        inputLabel: 'Mode -m :',
        placeholder: '3200',
        expected: '3200',
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `Identifie d'abord le format. Le préfixe du hash (<code>$2a$</code>, <code>$2b$</code>, <code>$2y$</code>) trahit l'algorithme.`,
          `<code>$2y$${cost}$...</code> = bcrypt (cost ${cost} = 2^${cost} itérations). Cherche "bcrypt" dans la doc hashcat (<code>hashcat --help | grep -i bcrypt</code>).`,
          `bcrypt = mode hashcat <strong>3200</strong>. Commande : <code>hashcat -m 3200 hash.txt rockyou.txt</code>.`
        ],
        explain: `Préfixe <code>$2y$</code> = <strong>bcrypt</strong> → mode hashcat <strong>3200</strong>. Cost ${cost} = 2^${cost} = ${Math.pow(2, parseInt(cost))} itérations (volontairement lent, anti-GPU).`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 4 : PKI — Lire un dump openssl x509
  // ════════════════════════════════════════════════════════════════

  // Données réalistes pour générer des dumps
  const PKI_FIXTURES = [
    {
      cn: 'secure.bcv.ch',
      sans: ['secure.bcv.ch', 'www.bcv.ch', 'api.bcv.ch'],
      issuer: 'DigiCert Global Root CA',
      issuerO: 'DigiCert Inc',
      org: 'Banque Cantonale Vaudoise',
      country: 'CH',
      city: 'Lausanne'
    },
    {
      cn: 'mail.unil.ch',
      sans: ['mail.unil.ch', 'imap.unil.ch', 'smtp.unil.ch', 'webmail.unil.ch'],
      issuer: 'Sectigo RSA Domain Validation Secure Server CA',
      issuerO: 'Sectigo Limited',
      org: 'Université de Lausanne',
      country: 'CH',
      city: 'Lausanne'
    },
    {
      cn: 'app.swisscom.ch',
      sans: ['app.swisscom.ch', 'login.swisscom.ch'],
      issuer: 'GlobalSign RSA OV SSL CA 2018',
      issuerO: 'GlobalSign nv-sa',
      org: 'Swisscom (Schweiz) AG',
      country: 'CH',
      city: 'Bern'
    },
    {
      cn: 'portal.fedpol.admin.ch',
      sans: ['portal.fedpol.admin.ch', 'fedpol.admin.ch'],
      issuer: 'SwissSign RSA TLS OV ICA 2022 - 1',
      issuerO: 'SwissSign AG',
      org: 'Office fédéral de la police',
      country: 'CH',
      city: 'Bern'
    },
    {
      cn: 'api.crypto.ch',
      sans: ['api.crypto.ch', 'docs.crypto.ch', 'dev.crypto.ch'],
      issuer: 'Let\'s Encrypt R3',
      issuerO: 'Let\'s Encrypt',
      org: 'Crypto SA',
      country: 'CH',
      city: 'Zug'
    },
    {
      cn: 'banking.raiffeisen.ch',
      sans: ['banking.raiffeisen.ch', 'mobile.raiffeisen.ch', 'login.raiffeisen.ch', 'twint.raiffeisen.ch'],
      issuer: 'QuoVadis Global SSL ICA G3',
      issuerO: 'QuoVadis Trustlink Schweiz AG',
      org: 'Raiffeisen Schweiz Genossenschaft',
      country: 'CH',
      city: 'St. Gallen'
    },
    {
      cn: 'cas-in.ch',
      sans: ['cas-in.ch', 'www.cas-in.ch'],
      issuer: 'ISRG Root X1',
      issuerO: 'Internet Security Research Group',
      org: 'CAS Investigation Numérique',
      country: 'CH',
      city: 'Neuchâtel'
    },
    {
      cn: 'secure.zkb.ch',
      sans: ['secure.zkb.ch', 'app.zkb.ch', 'ebanking.zkb.ch'],
      issuer: 'Entrust Certification Authority - L1K',
      issuerO: 'Entrust Inc',
      org: 'Zürcher Kantonalbank',
      country: 'CH',
      city: 'Zürich'
    },
    {
      cn: 'webmail.epfl.ch',
      sans: ['webmail.epfl.ch', 'mail.epfl.ch', 'smtp.epfl.ch', 'imap.epfl.ch', 'calendar.epfl.ch'],
      issuer: 'DigiCert TLS RSA SHA256 2020 CA1',
      issuerO: 'DigiCert Inc',
      org: 'École polytechnique fédérale de Lausanne',
      country: 'CH',
      city: 'Lausanne'
    },
    {
      cn: 'auth.sbb.ch',
      sans: ['auth.sbb.ch', 'login.sbb.ch'],
      issuer: 'GlobalSign GCC R6 AlphaSSL CA 2023',
      issuerO: 'GlobalSign nv-sa',
      org: 'Schweizerische Bundesbahnen SBB',
      country: 'CH',
      city: 'Bern'
    },
    {
      cn: 'ehealth.bag.admin.ch',
      sans: ['ehealth.bag.admin.ch', 'covidcert.admin.ch', 'vaccins.admin.ch'],
      issuer: 'SwissSign RSA TLS EV ICA 2022 - 1',
      issuerO: 'SwissSign AG',
      org: 'Office fédéral de la santé publique',
      country: 'CH',
      city: 'Bern'
    },
    {
      cn: 'partners.kudelski.com',
      sans: ['partners.kudelski.com', 'cas.kudelski.com', 'cybersecurity.kudelski.com'],
      issuer: 'GeoTrust TLS RSA CA G1',
      issuerO: 'DigiCert Inc',
      org: 'Kudelski SA',
      country: 'CH',
      city: 'Cheseaux-sur-Lausanne'
    }
  ];

  function _opensslDump(f) {
    const sansLine = f.sans.map(d => `DNS:${d}`).join(', ');
    return `Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            0d:e7:b5:3a:6c:8f:21:4e:9b:1c
    Signature Algorithm: sha256WithRSAEncryption
        Issuer: C=US, O=${f.issuerO}, CN=${f.issuer}
        Validity
            Not Before: Mar 12 10:00:00 2025 GMT
            Not After : Apr 14 10:00:00 2026 GMT
        Subject: C=${f.country}, L=${f.city}, O=${f.org}, CN=${f.cn}
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                RSA Public-Key: (2048 bit)
        X509v3 extensions:
            X509v3 Subject Alternative Name:
                ${sansLine}
            X509v3 Key Usage: critical
                Digital Signature, Key Encipherment
            X509v3 Extended Key Usage:
                TLS Web Server Authentication, TLS Web Client Authentication
            X509v3 Basic Constraints: critical
                CA:FALSE`;
  }

  function _renderOpensslDump(text, highlights) {
    // Surligne les lignes contenant les patterns
    const lines = text.split('\n').map(line => {
      let cls = '';
      for (const h of (highlights || [])) {
        if (line.includes(h.match)) {
          cls = `background:rgba(126,192,255,.08);border-left:3px solid var(${h.color || '--cyan'});padding-left:.4rem;display:block;margin-left:-.4rem`;
          break;
        }
      }
      return `<div style="${cls}">${escapeHTML(line) || '&nbsp;'}</div>`;
    });
    return `
      <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--bg);overflow-x:auto;-webkit-overflow-scrolling:touch">
        <div style="padding:.4rem .8rem;font-size:.7rem;color:var(--gold);background:rgba(240,192,64,.05);border-bottom:1px solid var(--border);font-weight:700;letter-spacing:.05em;text-transform:uppercase">Output : openssl x509 -in cert.pem -text -noout</div>
        <pre style="margin:0;padding:.7rem .8rem;font-family:var(--mono);font-size:.78rem;line-height:1.5;color:var(--text);overflow-x:auto;-webkit-overflow-scrolling:touch">${lines.join('')}</pre>
      </div>
    `;
  }

  function genPKI() {
    const level = rand(0, 2);
    const opts = { prefix: 'pki', icon: '📜', title: 'PKI — Lire un dump X.509' };
    const f = PKI_FIXTURES[rand(0, PKI_FIXTURES.length - 1)];
    const dumpText = _opensslDump(f);

    // ── Niveau A : extraire le CN du Subject ──
    if (level === 0) {
      const artefactHTML = _renderOpensslDump(dumpText, [
        {match: 'Subject: C=', color: '--cyan'}
      ]);

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici la sortie de <code>openssl x509 -text</code> sur un certificat trouvé dans <code>/etc/letsencrypt/</code>. <strong>Quel est le Common Name (CN) du Subject</strong> ?`,
        inputLabel: 'CN :',
        placeholder: 'example.com',
        expected: f.cn,
        normalize: v => v.trim().toLowerCase(),
        hints: [
          `Cherche la ligne commençant par <code>Subject:</code>. Le CN est la dernière partie après <code>CN=</code>.`,
          `Subject: <code>C=${f.country}, L=${f.city}, O=${f.org}, CN=${f.cn}</code>. Le CN suit immédiatement <code>CN=</code>.`,
          `CN = <strong>${f.cn}</strong>. C'est le nom canonique du certificat — historiquement le FQDN, mais aujourd'hui les navigateurs préfèrent les SAN.`
        ],
        explain: `CN (Common Name) du Subject = <strong>${f.cn}</strong>. Champ historique du sujet. Depuis 2017 (RFC 6125 + politique CA/B Forum), les navigateurs valident via les SAN, pas le CN — mais il reste lisible.`
      });
    }

    // ── Niveau B : compter les SAN DNS ──
    if (level === 1) {
      const artefactHTML = _renderOpensslDump(dumpText, [
        {match: 'Subject Alternative Name', color: '--gold'},
        {match: 'DNS:', color: '--gold'}
      ]);

      return buildPracticeCard({
        ...opts,
        badge: 'extraction',
        artefactHTML,
        question: `<strong>Combien d'entrées DNS</strong> ce certificat couvre-t-il dans son Subject Alternative Name (SAN) ?`,
        inputLabel: 'Nombre :',
        placeholder: '1',
        expected: String(f.sans.length),
        normalize: v => v.trim().replace(/[^\d]/g, ''),
        hints: [
          `Trouve la section <code>X509v3 Subject Alternative Name</code>. Compte les entrées <code>DNS:...</code>.`,
          `SAN affiché : <code>${f.sans.map(d => 'DNS:' + d).join(', ')}</code>. Compte les <code>DNS:</code>.`,
          `<strong>${f.sans.length}</strong> entrées DNS : ${f.sans.map(d => '<code>' + d + '</code>').join(', ')}.`
        ],
        explain: `SAN compte <strong>${f.sans.length}</strong> domaine(s). C'est ce qui permet au cert de couvrir plusieurs FQDN (un seul cert pour ${f.sans.join(', ')}). RFC 5280, OID 2.5.29.17.`
      });
    }

    // ── Niveau C : extraire le CN de l'Issuer (pas le Subject) ──
    {
      const artefactHTML = _renderOpensslDump(dumpText, [
        {match: 'Issuer: C=', color: '--purple'}
      ]);

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `<strong>Quel est le Common Name (CN) de l'Issuer</strong> ? (= l'autorité de certification intermédiaire qui a signé ce certificat.)`,
        inputLabel: 'Issuer CN :',
        placeholder: 'Some CA',
        expected: f.issuer,
        normalize: v => v.trim().toLowerCase(),
        hints: [
          `Attention à ne pas confondre <code>Subject:</code> (qui possède le cert) et <code>Issuer:</code> (qui l'a signé). Tu cherches le CN de l'<strong>Issuer</strong>.`,
          `Cherche la ligne <code>Issuer: C=US, O=${f.issuerO}, CN=...</code>. Le CN est tout à droite.`,
          `Issuer CN = <strong>${f.issuer}</strong>. C'est une CA intermédiaire de <code>${f.issuerO}</code>.`
        ],
        explain: `Issuer CN = <strong>${f.issuer}</strong>. Hiérarchie PKI : Root CA → Intermediate CA (= cet Issuer) → certificat final (= ce Subject). La chaîne complète remonte jusqu'à une Root CA self-signed du trust store du navigateur.`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Enregistrement dans GENERATORS
  // ════════════════════════════════════════════════════════════════
  if (typeof window !== 'undefined' && window.GENERATORS) {
    window.GENERATORS.cidr     = genCIDR;
    window.GENERATORS.aes      = genAES;
    window.GENERATORS.cracking = genCracking;
    window.GENERATORS.pki      = genPKI;
  } else if (typeof GENERATORS !== 'undefined') {
    GENERATORS.cidr     = genCIDR;
    GENERATORS.aes      = genAES;
    GENERATORS.cracking = genCracking;
    GENERATORS.pki      = genPKI;
  }

  if (typeof window !== 'undefined') {
    window.genCIDR     = genCIDR;
    window.genAES      = genAES;
    window.genCracking = genCracking;
    window.genPKI      = genPKI;
  }
})();
