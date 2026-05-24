// ═══════════════════════════════════════════════════════════════════
// tp-engine-classic-crypto.js — CAS-IN TP delta v105
// 2 TP : Cryptographie classique (Base64/César/XOR) + Stéganographie
// 3 niveaux progressifs par TP, modèle standard v101-v104
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // HELPERS partagés
  // ────────────────────────────────────────────────────────────────
  function buildPracticeCard(opts) {
    const id = opts.prefix;
    const div = document.createElement('div');
    div.className = 'ex-card';

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-${id}">${opts.icon || '🔐'}</div>
        <div class="ex-title">${opts.title}</div>
        <span class="ex-badge easy">${opts.badge || 'pratique'}</span>
      </div>
      <div class="ex-scenario">${opts.question}</div>
      <div style="margin:.7rem 0">${opts.artefactHTML}</div>
      <div class="ex-input-row" style="flex-wrap:wrap;gap:8px">
        ${opts.inputLabel ? `<span class="ex-input-label">${opts.inputLabel}</span>` : ''}
        <input class="ex-input" id="inp-${id}" placeholder="${opts.placeholder || ''}" autocomplete="off" spellcheck="false" style="width:100%;max-width:340px;font-family:var(--mono);min-height:40px;box-sizing:border-box">
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

  function renderTextBlock(text, opts) {
    opts = opts || {};
    const title = opts.title || '';
    const highlights = opts.highlights || [];
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
      <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--bg)">
        ${title ? `<div style="padding:.4rem .8rem;font-size:.7rem;color:var(--gold);background:rgba(240,192,64,.05);border-bottom:1px solid var(--border);font-weight:700;letter-spacing:.05em;text-transform:uppercase">${title}</div>` : ''}
        <pre style="margin:0;padding:.7rem .8rem;font-family:var(--mono);font-size:.78rem;line-height:1.5;color:var(--text);overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:pre">${lines.join('')}</pre>
      </div>
    `;
  }

  // Hexdump compact (sans annotations, juste offset + hex + ascii)
  function tinyHexDump(bytes, opts) {
    opts = opts || {};
    const title = opts.title || '';
    const annotations = opts.annotations || [];
    const cols = opts.cols || 8;

    const hexCells = bytes.map((b, i) => {
      const ann = annotations.find(a => a.from <= i && i <= a.to);
      const color = ann ? `color:var(${ann.color || '--cyan'});font-weight:700;background:rgba(255,255,255,.05);border-radius:3px` : 'color:var(--text)';
      const tip = ann ? ` title="${ann.label || ''}"` : '';
      return `<span style="padding:2px 4px;display:inline-block;min-width:24px;text-align:center;${color}"${tip}>${b.toString(16).toUpperCase().padStart(2,'0')}</span>`;
    });
    const ascii = bytes.map(b => (b >= 0x20 && b < 0x7F) ? String.fromCharCode(b) : '.').join('');
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

  // ────────────────────────────────────────────────────────────────
  // Helpers crypto classique
  // ────────────────────────────────────────────────────────────────
  // Base64 encode pur JS (sans btoa pour rester déterministe et lisible)
  function _b64encode(str) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < str.length) {
      // Combien d'octets lus dans cette triplet (1, 2 ou 3)
      const remaining = str.length - i;
      const a = str.charCodeAt(i);
      const b = remaining > 1 ? str.charCodeAt(i + 1) : 0;
      const c = remaining > 2 ? str.charCodeAt(i + 2) : 0;
      const triplet = (a << 16) | (b << 8) | c;
      result += chars[(triplet >> 18) & 0x3F]
              + chars[(triplet >> 12) & 0x3F]
              + (remaining > 1 ? chars[(triplet >> 6) & 0x3F] : '=')
              + (remaining > 2 ? chars[triplet & 0x3F] : '=');
      i += 3;
    }
    return result;
  }

  // Chiffrement César : shift positions à droite (A→D si shift=3)
  function _caesar(text, shift) {
    return text.split('').map(c => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90)  return String.fromCharCode(((code - 65 + shift) % 26 + 26) % 26 + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26 + 26) % 26 + 97);
      return c; // espace, ponctuation, chiffres inchangés
    }).join('');
  }

  // XOR byte-à-byte avec clé 1-byte
  function _xorWithByte(bytes, key) {
    return bytes.map(b => b ^ key);
  }

  // Convertit array de bytes en hex string
  function _bytesToHex(bytes) {
    return bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  }

  // Convertit string ASCII en array de bytes
  function _strToBytes(s) {
    return [...s].map(c => c.charCodeAt(0));
  }

  // ════════════════════════════════════════════════════════════════
  // TP 1 : Cryptographie classique (Base64 / César / XOR)
  // ════════════════════════════════════════════════════════════════

  const PHRASES_CLAIR = [
    'CAS-IN 2026',
    'Forensique Suisse',
    'Police Bern',
    'Procureur GE',
    'DFIR Lausanne',
    'Cybercrime',
    'Mimikatz dump',
    'Cobalt Strike',
    'Carving JPEG',
    'NTFS MFT'
  ];

  const PHRASES_FR_COURTES = [
    // Mots ou courtes phrases en majuscules, faciles à reconnaître après déchiffrement
    'BONJOUR LE MONDE',
    'MOT DE PASSE',
    'CHAINE DE POSSESSION',
    'PREUVE NUMERIQUE',
    'PROCES VERBAL',
    'INSPECTEUR',
    'PERQUISITION',
    'TEMOIN OCULAIRE'
  ];

  function genClassicCrypto() {
    const level = rand(0, 2);
    const opts = { prefix: 'classic', icon: '🔤', title: 'Crypto classique — Base64 / César / XOR' };

    // ── Niveau A : décoder Base64 ──
    if (level === 0) {
      const clair = PHRASES_CLAIR[rand(0, PHRASES_CLAIR.length - 1)];
      const encoded = _b64encode(clair);

      const artefactHTML = renderTextBlock(
        `# Chaîne suspecte extraite d'une commande PowerShell :\n\n  $payload = "${encoded}"\n\n# Tu sais que ce contenu est encodé en Base64.\n# La cible décode ensuite avec :\n  [System.Text.Encoding]::UTF8.GetString(\n    [System.Convert]::FromBase64String($payload)\n  )`,
        {
          title: 'Extrait d\'un script — chaîne encodée',
          highlights: [{ match: '$payload', color: '--cyan' }]
        }
      );

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Voici une chaîne encodée en <strong>Base64</strong> trouvée dans un script PowerShell. <strong>Quelle est la chaîne claire (décodée)</strong> ?<br><span style="color:var(--dim);font-size:.85rem">Astuce : <code>echo "${encoded}" | base64 -d</code> en bash, ou <code>atob("${encoded}")</code> en JavaScript.</span>`,
        inputLabel: 'Clair :',
        placeholder: 'Hello World',
        expected: clair,
        normalize: v => v.trim().toLowerCase().replace(/\s+/g, ' '),
        hints: [
          `Base64 utilise 64 caractères (A-Z, a-z, 0-9, +, /) pour encoder 3 octets binaires en 4 caractères. Le signe <code>=</code> à la fin est du padding (1 ou 2 selon la longueur d'origine modulo 3).`,
          `Utilise <code>atob("${encoded}")</code> dans la console du navigateur (DevTools → Console), ou <code>echo "${encoded}" \\| base64 -d</code> en terminal. La longueur du résultat ≈ <code>${Math.floor((encoded.length * 3) / 4)}</code> caractères.`,
          `Décodage : <code>${encoded}</code> = <strong>${clair}</strong>`
        ],
        explain: `Clair = <strong>${clair}</strong>. Base64 ratio = 4/3 (3 octets in → 4 chars out). Les attaquants l'utilisent souvent pour cacher des commandes PowerShell (<code>-EncodedCommand</code>), des URL de C2, ou des binaires dans des scripts — signature dans Sigma : <code>powershell.*-enc</code>.`
      });
    }

    // ── Niveau B : déchiffrer un César avec shift inconnu ──
    if (level === 1) {
      const clair = PHRASES_FR_COURTES[rand(0, PHRASES_FR_COURTES.length - 1)];
      const shift = rand(3, 10);
      const cipher = _caesar(clair, shift);

      const artefactHTML = renderTextBlock(
        `# Note manuscrite trouvée sur le suspect :\n\n  ${cipher}\n\n# Tu suspectes un chiffrement César (shift entre 1 et 25 lettres).\n# Le suspect parle français — le clair devrait avoir un sens.`,
        {
          title: 'Note suspecte — chiffrement César',
          highlights: [{ match: cipher, color: '--cyan' }]
        }
      );

      return buildPracticeCard({
        ...opts,
        badge: 'cassage',
        artefactHTML,
        question: `Ce texte est chiffré avec un <strong>code de César</strong> (shift inconnu entre 1 et 25). <strong>Quel est le texte clair</strong> (en majuscules, comme dans le chiffré) ?`,
        inputLabel: 'Clair :',
        placeholder: 'MOT DE PASSE',
        expected: clair,
        normalize: v => v.trim().toUpperCase().replace(/\s+/g, ' '),
        hints: [
          `Code de César : chaque lettre est décalée de N positions dans l'alphabet. Pour déchiffrer, essaie les 25 shifts possibles (force brute facile). La bonne valeur de N donne un texte ayant du sens.`,
          `Compare la première lettre du chiffré (<code>${cipher[0]}</code>) avec des lettres françaises probables (E, A, S, T, L). Le décalage entre <code>${cipher[0]}</code> et la lettre cible te donne le shift à appliquer (en sens inverse) sur tout le texte.`,
          `Shift utilisé = <strong>${shift}</strong>. Application : chaque lettre du chiffré, on recule de ${shift} positions dans l'alphabet (A→${String.fromCharCode(((26 - shift) % 26) + 65)}, B→${String.fromCharCode(((27 - shift) % 26) + 65)}, ...). Clair = <strong>${clair}</strong>.`
        ],
        explain: `Shift = ${shift} → clair = <strong>${clair}</strong>. Le code de César (1er siècle av. J.-C., utilisé par Jules César dans ses correspondances militaires) est l'ancêtre du chiffrement par substitution. Trivialement cassable aujourd'hui : 25 shifts à tester max, ou analyse fréquentielle pour des textes plus longs.`
      });
    }

    // ── Niveau C : XOR avec clé 1-byte (brute force 256 essais max) ──
    {
      const clair = PHRASES_CLAIR[rand(0, PHRASES_CLAIR.length - 1)];
      const key = rand(1, 255); // clé 1-byte
      const clairBytes = _strToBytes(clair);
      const cipherBytes = _xorWithByte(clairBytes, key);
      const cipherHex = _bytesToHex(cipherBytes);
      // Premiers 3 caractères du clair en hint
      const hint3chars = clair.slice(0, 3);
      const hint3bytes = _strToBytes(hint3chars);

      const artefactHTML = renderTextBlock(
        `# Cipher capturé sur un canal C2 (longueur ${cipherBytes.length} octets) :\n\n  ${cipherHex}\n\n# Tu sais que :\n#  - chiffrement = XOR octet-à-octet avec une clé de 1 octet\n#  - le clair commence par les caractères "${hint3chars}..."\n#  - donc la clé K satisfait : K = byte[0] XOR ASCII('${hint3chars[0]}')`,
        {
          title: 'Cipher XOR 1-byte — clé inconnue',
          highlights: [
            { match: cipherHex.substring(0, 8), color: '--cyan' }
          ]
        }
      );

      return buildPracticeCard({
        ...opts,
        badge: 'cassage',
        artefactHTML,
        question: `Le cipher est chiffré par <strong>XOR avec une clé 1-byte</strong>. <strong>Quelle est la clé K (en hex, 2 caractères)</strong> ?<br><span style="color:var(--dim);font-size:.85rem">Astuce : XOR est réversible. Si <code>cipher[0] = clair[0] XOR K</code>, alors <code>K = cipher[0] XOR clair[0]</code>.</span>`,
        inputLabel: 'Clé K =',
        placeholder: '0x42',
        expected: '0x' + key.toString(16).toUpperCase().padStart(2, '0'),
        normalize: v => {
          let s = v.trim().toUpperCase().replace(/\s/g, '');
          if (!s.startsWith('0X')) s = '0X' + s;
          const num = parseInt(s.replace('0X', ''), 16);
          return isNaN(num) ? v : '0X' + num.toString(16).toUpperCase().padStart(2, '0');
        },
        hints: [
          `Propriété fondamentale du XOR : <code>A XOR B = C</code> implique <code>A XOR C = B</code> et <code>B XOR C = A</code>. Donc si tu connais 1 octet du clair, tu peux récupérer la clé : <code>K = cipher[i] XOR clair[i]</code>.`,
          `Premier octet du cipher : <code>0x${cipherBytes[0].toString(16).toUpperCase().padStart(2,'0')}</code>. Premier caractère du clair : <code>'${hint3chars[0]}'</code> = ASCII <code>0x${hint3bytes[0].toString(16).toUpperCase().padStart(2,'0')}</code>. Calcule <code>0x${cipherBytes[0].toString(16).toUpperCase().padStart(2,'0')} XOR 0x${hint3bytes[0].toString(16).toUpperCase().padStart(2,'0')}</code>.`,
          `<code>0x${cipherBytes[0].toString(16).toUpperCase().padStart(2,'0')} XOR 0x${hint3bytes[0].toString(16).toUpperCase().padStart(2,'0')}</code> = <strong>0x${key.toString(16).toUpperCase().padStart(2,'0')}</strong>. C'est la clé. Vérification : applique <code>K = 0x${key.toString(16).toUpperCase().padStart(2,'0')}</code> en XOR à tout le cipher → clair = "${clair}".`
        ],
        explain: `Clé K = <strong>0x${key.toString(16).toUpperCase().padStart(2,'0')}</strong> (= ${key} en décimal). Clair = "${clair}". XOR 1-byte est trivial à casser : avec ne serait-ce qu'un seul caractère connu du clair (known-plaintext attack), tu retrouves la clé en 1 opération. Sinon, brute force 256 valeurs et inspection visuelle suffisent.`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TP 2 : Stéganographie
  // ════════════════════════════════════════════════════════════════

  function genStegano() {
    const level = rand(0, 2);
    const opts = { prefix: 'stegano', icon: '🎭', title: 'Stéganographie — Détection & extraction' };

    // ── Niveau A : Whitespace stégano (tab=1, espace=0) ──
    if (level === 0) {
      // Cacher 1 caractère ASCII (entre 'A' et 'Z')
      const hiddenChar = String.fromCharCode(rand(65, 90)); // A-Z
      const charCode = hiddenChar.charCodeAt(0);
      const bits = charCode.toString(2).padStart(8, '0'); // ex: "01000001" pour 'A'
      // Construire un texte avec tabs/espaces selon les bits
      // Format : mot1 [tab/space selon bit 0] mot2 [tab/space selon bit 1] mot3 ...
      const words = ['Hello', 'how', 'are', 'you', 'today', 'this', 'is', 'fine'];
      const visualBits = bits.split('').map(b => b === '1' ? '⇥' : '·').join(' ');
      // Construire la ligne : mot suivi de tab (\t) si bit=1, espace ( ) si bit=0
      let line = words[0];
      for (let i = 0; i < 8; i++) {
        line += (bits[i] === '1' ? '\t' : ' ') + words[i + 1];
      }

      const artefactHTML = renderTextBlock(
        line + '\n\n# Indice : entre chaque mot, l\'expéditeur a choisi :\n#   un ESPACE  (·) = bit 0\n#   une TAB    (⇥) = bit 1\n#\n# Pattern visible : ' + visualBits + '\n#\n# 8 bits cachés = 1 caractère ASCII (binaire → décimal → table ASCII)',
        {
          title: 'Message OSINT — espaces/tabs entre les mots',
          highlights: [{ match: 'Pattern visible', color: '--cyan' }]
        }
      );

      return buildPracticeCard({
        ...opts,
        badge: 'lecture',
        artefactHTML,
        question: `Un message contient des espaces et des tabulations subtilement placés entre les mots. <strong>Tab = 1, Espace = 0</strong>. Lis les 8 bits dans l'ordre, convertis en ASCII. <strong>Quel est le caractère caché</strong> ?<br><span style="color:var(--dim);font-size:.85rem">Format de réponse : une lettre majuscule (A-Z).</span>`,
        inputLabel: 'Caractère :',
        placeholder: 'A',
        expected: hiddenChar,
        normalize: v => v.trim().toUpperCase().slice(0, 1),
        hints: [
          `Lis les séparateurs entre les mots dans l'ordre : <code>⇥</code> ou <code>·</code>. Note les bits dans une chaîne binaire de 8 chiffres. Convertis le binaire en décimal, puis en ASCII (A=65, B=66, ...).`,
          `Bits dans l'ordre : <code>${bits}</code>. Converti en décimal : ${charCode}. Cherche le caractère ASCII correspondant (A=65, B=66, ..., Z=90).`,
          `<code>${bits}</code><sub>2</sub> = <code>${charCode}</code><sub>10</sub> = ASCII <strong>'${hiddenChar}'</strong>.`
        ],
        explain: `Caractère caché : <strong>'${hiddenChar}'</strong> (= ${charCode} décimal = <code>${bits}</code> binaire). La stégano par whitespace est très discrète — invisible à l'œil dans un texte rendu normalement (les tabs ne se distinguent pas des espaces dans un texte justifié). Outil détecteur : <code>stegsnow</code> (Matthew Kwan, 1998).`
      });
    }

    // ── Niveau B : Polyglot file detection (JPEG + ZIP combinés) ──
    if (level === 1) {
      // Hexdump avec début JPEG (FF D8 FF E0) + un peu de contenu + fin ZIP (50 4B 03 04 magic)
      // Construire les bytes
      const bytes = [
        // JPEG header
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        // contenu JPEG (factice)
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        // ZIP local file header inséré (PK..)
        0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00, 0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC,
        // contenu ZIP (factice — nom de fichier "secret.txt")
        0x0B, 0x00, 0x00, 0x00, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74, 0x2E, 0x74, 0x78, 0x74, 0x00, 0x00,
      ];

      const artefactHTML = tinyHexDump(bytes, {
        title: 'photo_innocente.jpg — hexdump (premiers 64 octets)',
        annotations: [
          { from: 0, to: 3,   color: '--cyan', label: 'Magic JPEG (FF D8 FF E0)' },
          { from: 32, to: 35, color: '--gold', label: 'Magic ZIP local header (PK..)' }
        ],
        cols: 16
      });

      return buildPracticeCard({
        ...opts,
        badge: 'identification',
        artefactHTML,
        question: `Le fichier porte l'extension <code>.jpg</code>. Mais en regardant le hexdump, tu remarques DEUX magic numbers de formats différents. Le premier (<code>FF D8 FF E0</code>) est celui du JPEG. <strong>Quel est le second format détecté</strong> (à l'offset 0x20) ?<br><span style="color:var(--dim);font-size:.85rem">Format de réponse : 3 lettres en majuscules (le nom court du format).</span>`,
        inputLabel: 'Format :',
        placeholder: 'PDF',
        expected: 'ZIP',
        normalize: v => v.trim().toUpperCase().replace(/[\s.]/g, ''),
        hints: [
          `Les magic numbers sont les premiers octets qui identifient un format. <code>FF D8 FF</code> = JPEG. Compare les 4 octets à l'offset <code>0x20</code> avec une table de magic bytes connue (Wikipedia "List of file signatures").`,
          `À l'offset <code>0x20</code> : <code>50 4B 03 04</code>. En ASCII : <code>${String.fromCharCode(0x50)}${String.fromCharCode(0x4B)}..</code>. Le <code>50 4B</code> sont les initiales de l'inventeur du format.`,
          `<code>50 4B 03 04</code> = ASCII "<strong>PK</strong>..." = <strong>Phil Katz</strong>, inventeur de <strong>PKZIP</strong> (1986). Magic du format <strong>ZIP</strong>.`
        ],
        explain: `Format ZIP détecté à l'offset 0x20. C'est un <strong>polyglot file</strong> (JPEG + ZIP). Technique classique en stégano/CTF : un viewer image affiche la photo, mais <code>unzip photo.jpg</code> ou un renommage en <code>.zip</code> révèle des fichiers cachés. Détection : <code>binwalk photo.jpg</code> liste tous les magic embeddés. Variations connues : Phracking (PHP+RAR), GIFAR (GIF+JAR — vulnérabilité historique Java).`
      });
    }

    // ── Niveau C : LSB extraction (1 caractère depuis 8 octets RGB) ──
    {
      // Cacher 1 caractère ASCII A-Z dans les LSB de 8 octets RGB
      const hiddenChar = String.fromCharCode(rand(65, 90));
      const charCode = hiddenChar.charCodeAt(0);
      const bits = charCode.toString(2).padStart(8, '0').split('').map(Number);
      // Pour chaque bit, générer un octet RGB plausible (0-255) avec le LSB = bit
      const pixels = bits.map(bit => {
        // Base aléatoire dans [0, 255], puis force le LSB à `bit`
        const base = rand(50, 250);
        return (base & 0xFE) | bit; // efface le LSB, le remplace par bit
      });

      const artefactHTML = tinyHexDump(pixels, {
        title: '8 octets RGB extraits d\'un bitmap suspect (1 octet par pixel)',
        annotations: [{ from: 0, to: 7, color: '--purple', label: 'Octets dont les LSB cachent 1 caractère' }],
        cols: 8
      });

      // Affichage pédagogique du binaire de chaque octet
      const pixelLines = pixels.map((p, i) => {
        const binStr = p.toString(2).padStart(8, '0');
        const msb = binStr.slice(0, 7);
        const lsb = binStr.slice(7);
        return `  pixel[${i}] = ${String(p).padStart(3)} = ${msb}\u200B${lsb} ← LSB = ${lsb}`;
      }).join('\n');

      const artefactHTML2 = renderTextBlock(
        `Décomposition binaire des 8 octets (le bit de poids faible / LSB est isolé) :\n\n${pixelLines}\n\nAssemble les 8 LSB dans l'ordre (du pixel 0 au pixel 7), tu obtiens 8 bits.\nConvertis ces 8 bits binaires en ASCII pour révéler le caractère caché.`,
        {
          title: 'Analyse LSB pixel par pixel',
          highlights: [{ match: '← LSB', color: '--purple' }]
        }
      );

      return buildPracticeCard({
        ...opts,
        badge: 'extraction',
        artefactHTML: artefactHTML + '<div style="margin-top:.6rem">' + artefactHTML2 + '</div>',
        question: `Une technique de stégano LSB cache 1 bit par pixel (le <strong>Least Significant Bit</strong>, bit de poids faible). En lisant les LSB des 8 octets ci-dessous dans l'ordre, on obtient 8 bits = 1 caractère ASCII. <strong>Quel caractère est caché</strong> ?<br><span style="color:var(--dim);font-size:.85rem">Format : une lettre majuscule (A-Z).</span>`,
        inputLabel: 'Caractère :',
        placeholder: 'A',
        expected: hiddenChar,
        normalize: v => v.trim().toUpperCase().slice(0, 1),
        hints: [
          `LSB = Least Significant Bit = bit de poids faible (le tout dernier en écriture binaire). Pour chaque octet, isole ce bit unique. Assemble les 8 LSB dans l'ordre des pixels (0 → 7) pour former un octet. Convertis en ASCII.`,
          `LSB de chaque octet (déjà calculés ci-dessus) : <code>${bits.join('')}</code>. Convertis ce binaire en décimal, puis en ASCII (A=65, B=66, ..., Z=90).`,
          `<code>${bits.join('')}</code><sub>2</sub> = <code>${charCode}</code><sub>10</sub> = ASCII <strong>'${hiddenChar}'</strong>.`
        ],
        explain: `Caractère caché : <strong>'${hiddenChar}'</strong> (= ${charCode} décimal = <code>${bits.join('')}</code> binaire LSB). La stégano LSB est la méthode la plus simple en image — invisible à l'œil (modifier ±1 sur un octet RGB est imperceptible visuellement). Outils de détection : <code>stegsolve</code>, <code>zsteg</code>, <code>steghide</code>. Variantes plus subtiles : utiliser plusieurs bits par octet, distribuer pseudo-aléatoirement avec une clé, etc.`
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Enregistrement dans GENERATORS
  // ════════════════════════════════════════════════════════════════
  if (typeof window !== 'undefined' && window.GENERATORS) {
    window.GENERATORS.classic = genClassicCrypto;
    window.GENERATORS.stegano = genStegano;
  } else if (typeof GENERATORS !== 'undefined') {
    GENERATORS.classic = genClassicCrypto;
    GENERATORS.stegano = genStegano;
  }
  if (typeof window !== 'undefined') {
    window.genClassicCrypto = genClassicCrypto;
    window.genStegano = genStegano;
  }
})();
