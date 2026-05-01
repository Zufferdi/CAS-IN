// ═══════════════════════════════════════════════════════════════
// tp-engine-windows.js — Exercices Windows artefacts (Registry, Prefetch, LNK)
//
// Module séparé de tp-engine.js pour faciliter la maintenance.
// Doit être chargé APRÈS tp-engine.js (dépendances : showTPHint, markHintUsed,
// breakStreak, incSolved, formatChoiceFeedback, renderHexDump, rand, pad, GENERATORS).
//
// Le dispatcher GENERATORS est patché ici pour enregistrer les 3 générateurs.
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 25. REGISTRY — PARSING DE CELLULES NK/VK (NTUSER.DAT)
// ═══════════════════════════════════════════════════════════════
//
// Sous-types :
//   0 — Identifier le type d'une cellule (NK = clé / VK = valeur)
//   1 — Lire le nom d'une valeur VK
//   2 — Décoder le type d'une valeur (REG_SZ, REG_DWORD, REG_BINARY)
//   3 — Décoder une donnée REG_DWORD (Little Endian, 4 octets)
//
// Format simplifié d'une cellule :
//   Cell size      : int32 LE (négatif = utilisé, positif = libre)
//   Signature      : 2 octets ASCII ('nk' ou 'vk')
//   ... champs spécifiques ...
//
function genRegistry() {
  const subtype = rand(0, 3);

  // Helpers LE
  const le16 = v => [v & 0xFF, (v>>8) & 0xFF];
  const le32 = v => [v&0xFF, (v>>8)&0xFF, (v>>16)&0xFF, (v>>24)&0xFF];
  const le32s = v => le32(v >>> 0);  // Gérer signed → unsigned
  const ascii = s => s.split('').map(c => c.charCodeAt(0));

  // Types de valeurs registry (REG_*)
  const REG_TYPES = {
    0x00: 'REG_NONE',
    0x01: 'REG_SZ',          // string Unicode
    0x02: 'REG_EXPAND_SZ',   // string avec %ENV%
    0x03: 'REG_BINARY',
    0x04: 'REG_DWORD',       // 32 bits Little Endian
    0x07: 'REG_MULTI_SZ',
    0x0B: 'REG_QWORD',       // 64 bits LE
  };

  // ── Sous-type 0 : Identifier nk vs vk ───────────────────────
  if (subtype === 0) {
    const isNK = Math.random() < 0.5;
    const sig = isNK ? 'nk' : 'vk';
    const sigBytes = ascii(sig);  // 0x6E 0x6B  ou  0x76 0x6B
    const cellSize = -(rand(8, 32) * 8);  // négatif = utilisé
    const cellSizeBytes = le32s(cellSize);

    // Construction du dump : 4 octets cell size + 2 octets sig + bourrage
    const dump = [...cellSizeBytes, ...sigBytes];
    while (dump.length < 16) dump.push(rand(0, 255));

    const answer = isNK ? 'NK (Key)' : 'VK (Value)';
    const choices = ['NK (Key)', 'VK (Value)', 'LF (Sub-key list)', 'SK (Security)'].sort(() => Math.random() - .5);

    const hints = [
      `Une cellule registry commence par 4 octets <strong>cell size</strong> (int32 LE, négatif = utilisée), suivis de la <strong>signature</strong> sur 2 octets ASCII.`,
      `Les 2 octets de signature sont aux <strong>offsets 0x04-0x05</strong>. Convertis-les en ASCII : 0x${pad(sigBytes[0].toString(16).toUpperCase(),2)} 0x${pad(sigBytes[1].toString(16).toUpperCase(),2)}`,
      `0x${pad(sigBytes[0].toString(16).toUpperCase(),2)} 0x${pad(sigBytes[1].toString(16).toUpperCase(),2)} = "${sig}" → <strong>${answer}</strong>`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';

    const dumpHTML = renderHexDump(
      [{ offset: '00000000', hex: dump.map(b => pad(b.toString(16).toUpperCase(),2)).join(' '), ascii: dump.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''), bytes: dump }],
      [{ start: 4, end: 5, color: 'gold' }],
      { cols: 16, title: 'Cellule registry (16 premiers octets)' }
    );

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-reg">📂</div>
        <div class="ex-title">Registry — Identifier le type de cellule</div>
        <span class="ex-badge easy">NTUSER.DAT · NK / VK</span>
      </div>
      <div class="ex-scenario">
        Tu analyses un dump brut de <code>NTUSER.DAT</code>. Une cellule commence à l'offset 0x00.<br>
        <strong>Quel est le type de cette cellule ?</strong>
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Type de cellule</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="reg-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:130px;font-family:var(--mono)"
            data-correct="${c === answer}">${c}</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="reg-h1">💡 Niveau 1 — Concept</button>
        <button class="btn-hint" id="reg-h2" disabled style="opacity:.45">💡 Niveau 2 — Bytes</button>
        <button class="btn-hint" id="reg-h3" disabled style="opacity:.45">💡 Niveau 3 — Décodage</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-reg" style="display:none"></div>
      <button class="btn-next" id="btn-next-reg" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#reg-h1').addEventListener('click', () => showTPHint(div, 'reg', 1, hints[0]));
    div.querySelector('#reg-h2').addEventListener('click', () => showTPHint(div, 'reg', 2, hints[1]));
    div.querySelector('#reg-h3').addEventListener('click', () => showTPHint(div, 'reg', 3, hints[2]));

    div.querySelectorAll('#reg-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#reg-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('registry');
        const fb = div.querySelector('#ex-feedback-reg');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `Signature aux offsets 0x04-0x05 = "${sig}" → <strong>${answer}</strong>.<br>
          <span style="font-size:.74rem;color:var(--dim)">NK (0x6E 0x6B) = Named Key (clé du registre).
          VK (0x76 0x6B) = Value Key (valeur d'une clé).</span>`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `Lis 2 octets ASCII à offset 0x04. "${sig}" → ${answer}.`);
        div.querySelector('#btn-next-reg').style.display = 'inline-block';
        div.querySelector('#ex-num-reg').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 1 : Lire le nom d'une valeur VK ───────────────
  // Format VK simplifié :
  //   0x00-0x03 : cell size (int32 LE)
  //   0x04-0x05 : 'vk'
  //   0x06-0x07 : name length (uint16 LE)
  //   0x08-0x0B : data size (uint32 LE)
  //   0x0C-0x0F : data offset/inline (uint32 LE)
  //   0x10-0x13 : data type (uint32 LE)
  //   0x14-0x15 : flags (uint16 LE)
  //   0x16-0x17 : padding
  //   0x18+     : nom ASCII (longueur = name length)
  if (subtype === 1) {
    const NAMES = ['ProxyEnable', 'StartPage', 'LastUser', 'Run', 'TypedURLs', 'OpenMRU', 'RecentDocs', 'UserName'];
    const valueName = NAMES[rand(0, NAMES.length-1)];
    const nameLen = valueName.length;
    const cellSize = -((24 + nameLen + 7) & ~7);  // arrondi à multiple de 8
    const dataType = 0x01;  // REG_SZ pour cet exo
    const dataSize = rand(20, 100);
    const dataOffset = rand(0x1000, 0xFFFF);

    // Build dump
    const dump = [
      ...le32s(cellSize),
      ...ascii('vk'),
      ...le16(nameLen),
      ...le32(dataSize),
      ...le32(dataOffset),
      ...le32(dataType),
      0x00, 0x01,            // flags = 0x0001 (compressed name)
      0x00, 0x00,            // padding
      ...ascii(valueName),
    ];
    while (dump.length < 32) dump.push(0);

    const distractors = NAMES.filter(n => n !== valueName).sort(()=>Math.random()-.5).slice(0, 3);
    const choices = [valueName, ...distractors].sort(() => Math.random() - .5);

    const hints = [
      `Dans une cellule VK, le nom de la valeur commence à l'<strong>offset 0x18</strong> (24 décimal). Sa longueur est donnée par le champ <strong>name length</strong> (uint16 LE) à l'offset 0x06-0x07.`,
      `Name length à l'offset 0x06 = ${nameLen} octets. Lis donc <strong>${nameLen} octets ASCII</strong> à partir de l'offset 0x18.`,
      `Octets 0x18..0x${(0x18 + nameLen - 1).toString(16).toUpperCase()} = "${valueName}" → <strong>${valueName}</strong>`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';

    const dumpRows = [];
    for (let i = 0; i < dump.length; i += 16) {
      const slice = dump.slice(i, i+16);
      dumpRows.push({
        offset: pad(i.toString(16).toUpperCase(), 8),
        hex: slice.map(b => pad(b.toString(16).toUpperCase(),2)).join(' '),
        ascii: slice.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''),
        bytes: slice,
      });
    }
    const dumpHTML = renderHexDump(dumpRows,
      [{ start: 0x06, end: 0x07, color: 'cyan' }, { start: 0x18, end: 0x18 + nameLen - 1, color: 'gold' }],
      { cols: 16, title: 'Cellule VK' });

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-reg">📂</div>
        <div class="ex-title">Registry — Lire le nom d'une valeur</div>
        <span class="ex-badge medium">VK · ASCII · uint16 LE</span>
      </div>
      <div class="ex-scenario">
        Cellule VK avec name length à 0x06-0x07 et nom ASCII à partir de 0x18.<br>
        <strong>Quel est le nom de cette valeur ?</strong>
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Nom de la valeur</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="reg-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:120px;font-family:var(--mono)"
            data-correct="${c === valueName}">${c}</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="reg-h1">💡 Niveau 1 — Format VK</button>
        <button class="btn-hint" id="reg-h2" disabled style="opacity:.45">💡 Niveau 2 — Longueur</button>
        <button class="btn-hint" id="reg-h3" disabled style="opacity:.45">💡 Niveau 3 — Réponse</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-reg" style="display:none"></div>
      <button class="btn-next" id="btn-next-reg" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#reg-h1').addEventListener('click', () => showTPHint(div, 'reg', 1, hints[0]));
    div.querySelector('#reg-h2').addEventListener('click', () => showTPHint(div, 'reg', 2, hints[1]));
    div.querySelector('#reg-h3').addEventListener('click', () => showTPHint(div, 'reg', 3, hints[2]));

    div.querySelectorAll('#reg-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#reg-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('registry');
        const fb = div.querySelector('#ex-feedback-reg');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `Name length = 0x${pad(nameLen.toString(16).toUpperCase(), 4)} (${nameLen} octets) à 0x06.<br>
          Nom = ${nameLen} octets ASCII à partir de 0x18 → <strong>"${valueName}"</strong>.`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `Lis ${nameLen} octets ASCII à 0x18 → "${valueName}".`);
        div.querySelector('#btn-next-reg').style.display = 'inline-block';
        div.querySelector('#ex-num-reg').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 2 : Décoder le type de valeur ─────────────────
  if (subtype === 2) {
    const TYPE_OPTIONS = [
      { code: 0x01, name: 'REG_SZ', desc: 'Chaîne Unicode (UTF-16 LE)' },
      { code: 0x02, name: 'REG_EXPAND_SZ', desc: 'Chaîne avec %VAR%' },
      { code: 0x03, name: 'REG_BINARY', desc: 'Données binaires brutes' },
      { code: 0x04, name: 'REG_DWORD', desc: 'Entier 32 bits LE' },
      { code: 0x07, name: 'REG_MULTI_SZ', desc: 'Tableau de strings' },
      { code: 0x0B, name: 'REG_QWORD', desc: 'Entier 64 bits LE' },
    ];
    const choice = TYPE_OPTIONS[rand(0, TYPE_OPTIONS.length-1)];

    // Build VK simplifié avec type à 0x10-0x13
    const dump = [
      ...le32s(-32), ...ascii('vk'),
      0x04, 0x00,                  // name length
      ...le32(0x10),               // data size
      ...le32(0x2000),             // data offset
      ...le32(choice.code),        // <-- TYPE
      0x00, 0x01, 0x00, 0x00,
      ...ascii('Test'),
    ];
    while (dump.length < 32) dump.push(0);

    const distractors = TYPE_OPTIONS.filter(t => t.code !== choice.code).sort(()=>Math.random()-.5).slice(0, 3);
    const options = [choice, ...distractors].sort(() => Math.random() - .5);

    const hints = [
      `Le <strong>type de donnée</strong> d'une valeur VK est encodé sur 4 octets (uint32 LE) à l'<strong>offset 0x10-0x13</strong>.`,
      `Octets à 0x10 = ${le32(choice.code).map(b => pad(b.toString(16).toUpperCase(), 2)).join(' ')}<br>
       Convertis en uint32 LE : 0x${pad(choice.code.toString(16).toUpperCase(), 8)}`,
      `Type 0x${pad(choice.code.toString(16).toUpperCase(), 2)} = <strong>${choice.name}</strong> (${choice.desc})`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';

    const dumpRows = [];
    for (let i = 0; i < dump.length; i += 16) {
      const slice = dump.slice(i, i+16);
      dumpRows.push({
        offset: pad(i.toString(16).toUpperCase(), 8),
        hex: slice.map(b => pad(b.toString(16).toUpperCase(),2)).join(' '),
        ascii: slice.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''),
        bytes: slice,
      });
    }
    const dumpHTML = renderHexDump(dumpRows,
      [{ start: 0x10, end: 0x13, color: 'gold' }],
      { cols: 16, title: 'Cellule VK — type à 0x10-0x13' });

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-reg">📂</div>
        <div class="ex-title">Registry — Décoder le type de valeur</div>
        <span class="ex-badge medium">REG_* · uint32 LE</span>
      </div>
      <div class="ex-scenario">
        Le champ <strong>data type</strong> à 0x10 indique le format de la donnée.<br>
        <strong>Quel est le type de cette valeur ?</strong>
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Type de donnée</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="reg-choices">
        ${options.map(o => `<button class="tp-choice" style="flex:1;min-width:160px;text-align:left"
            data-correct="${o.code === choice.code}">
            <strong style="font-family:var(--mono);color:var(--cyan)">${o.name}</strong><br>
            <span style="font-size:.7rem;color:var(--dim)">${o.desc}</span>
        </button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="reg-h1">💡 Niveau 1 — Position</button>
        <button class="btn-hint" id="reg-h2" disabled style="opacity:.45">💡 Niveau 2 — Bytes</button>
        <button class="btn-hint" id="reg-h3" disabled style="opacity:.45">💡 Niveau 3 — Type</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-reg" style="display:none"></div>
      <button class="btn-next" id="btn-next-reg" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#reg-h1').addEventListener('click', () => showTPHint(div, 'reg', 1, hints[0]));
    div.querySelector('#reg-h2').addEventListener('click', () => showTPHint(div, 'reg', 2, hints[1]));
    div.querySelector('#reg-h3').addEventListener('click', () => showTPHint(div, 'reg', 3, hints[2]));

    div.querySelectorAll('#reg-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#reg-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('registry');
        const fb = div.querySelector('#ex-feedback-reg');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `Type à 0x10-0x13 = 0x${pad(choice.code.toString(16).toUpperCase(),8)} → <strong>${choice.name}</strong> (${choice.desc}).`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `0x${pad(choice.code.toString(16).toUpperCase(),2)} = ${choice.name}.`);
        div.querySelector('#btn-next-reg').style.display = 'inline-block';
        div.querySelector('#ex-num-reg').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 3 : Décoder donnée REG_DWORD inline ───────────
  // Quand data size <= 4 octets, la donnée est stockée DIRECTEMENT dans le champ
  // data offset (au lieu d'être un offset vers une autre cellule).
  // Bit haut du data size (0x80000000) = "inline data".
  {
    const value = rand(1, 0xFFFF);  // Garder petit pour calcul mental
    const valueBytes = le32(value);
    // Build VK avec inline data
    const dataSize = 0x80000004;  // 4 octets, flag inline
    const dataOffset = value;     // la valeur EST stockée ici

    const dump = [
      ...le32s(-32), ...ascii('vk'),
      0x05, 0x00,                  // name length = 5
      ...le32(dataSize),           // data size avec flag inline
      ...le32(dataOffset),         // <-- LA DONNÉE elle-même
      0x04, 0x00, 0x00, 0x00,      // type = REG_DWORD
      0x00, 0x01, 0x00, 0x00,      // flags + padding
      ...ascii('Count'),
      0x00, 0x00, 0x00,
    ];
    while (dump.length < 32) dump.push(0);

    const distractors = [
      value + 256,
      ((valueBytes[3] << 24) | (valueBytes[2] << 16) | (valueBytes[1] << 8) | valueBytes[0]) >>> 0,  // BE inverse
      value * 2,
    ].filter(v => v !== value && v > 0).slice(0, 3);
    while (distractors.length < 3) distractors.push(value + rand(100, 9999));
    const choices = [value, ...distractors.slice(0,3)].sort(() => Math.random() - .5);

    const hints = [
      `Pour REG_DWORD avec data size ≤ 4 octets, la donnée est <strong>inline</strong> : elle est stockée directement dans le champ <strong>data offset</strong> (offset 0x0C-0x0F), pas via indirection. Le bit haut de data size (0x80000000) signale ce mode.`,
      `Lis 4 octets à l'offset 0x0C : <strong>${le32(dataOffset).map(b => pad(b.toString(16).toUpperCase(), 2)).join(' ')}</strong><br>
       Décode en <strong>uint32 Little Endian</strong> (octet faible en premier).`,
      `${le32(dataOffset).map(b => '0x'+pad(b.toString(16).toUpperCase(), 2)).join(' ')} en LE → 0x${pad(value.toString(16).toUpperCase(), 8)} = <strong>${value}</strong>`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';

    const dumpRows = [];
    for (let i = 0; i < dump.length; i += 16) {
      const slice = dump.slice(i, i+16);
      dumpRows.push({
        offset: pad(i.toString(16).toUpperCase(), 8),
        hex: slice.map(b => pad(b.toString(16).toUpperCase(),2)).join(' '),
        ascii: slice.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''),
        bytes: slice,
      });
    }
    const dumpHTML = renderHexDump(dumpRows,
      [{ start: 0x08, end: 0x0B, color: 'cyan' }, { start: 0x0C, end: 0x0F, color: 'gold' }],
      { cols: 16, title: 'Cellule VK — REG_DWORD inline' });

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-reg">📂</div>
        <div class="ex-title">Registry — Décoder REG_DWORD inline</div>
        <span class="ex-badge hard">Little Endian · Inline data</span>
      </div>
      <div class="ex-scenario">
        Cette valeur VK est de type <strong>REG_DWORD</strong> (4 octets). Data size a le bit 0x80000000 → données <strong>inline</strong> dans le champ data offset (0x0C-0x0F).<br>
        <strong>Quelle est la valeur décimale ?</strong>
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Valeur</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="reg-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:110px;font-family:var(--mono)"
            data-correct="${c === value}">${c.toLocaleString('fr-CH')}</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="reg-h1">💡 Niveau 1 — Inline data</button>
        <button class="btn-hint" id="reg-h2" disabled style="opacity:.45">💡 Niveau 2 — Lire LE</button>
        <button class="btn-hint" id="reg-h3" disabled style="opacity:.45">💡 Niveau 3 — Décimal</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-reg" style="display:none"></div>
      <button class="btn-next" id="btn-next-reg" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#reg-h1').addEventListener('click', () => showTPHint(div, 'reg', 1, hints[0]));
    div.querySelector('#reg-h2').addEventListener('click', () => showTPHint(div, 'reg', 2, hints[1]));
    div.querySelector('#reg-h3').addEventListener('click', () => showTPHint(div, 'reg', 3, hints[2]));

    div.querySelectorAll('#reg-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#reg-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('registry');
        const fb = div.querySelector('#ex-feedback-reg');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `Octets 0x0C-0x0F = ${le32(dataOffset).map(b => pad(b.toString(16).toUpperCase(),2)).join(' ')} en LE → 0x${pad(value.toString(16).toUpperCase(),8)} = <strong>${value.toLocaleString('fr-CH')}</strong>.`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `LE = inverser l'ordre des octets : ${le32(dataOffset).map(b => pad(b.toString(16).toUpperCase(),2)).reverse().join('')} = ${value}.`);
        div.querySelector('#btn-next-reg').style.display = 'inline-block';
        div.querySelector('#ex-num-reg').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }
}

// ═══════════════════════════════════════════════════════════════
// 26. PREFETCH — PARSING DE FICHIERS .PF
// ═══════════════════════════════════════════════════════════════
//
// Sous-types :
//   0 — Identifier la signature et la version d'un fichier .pf
//   1 — Lire le nom de l'exécutable (UTF-16 LE @ offset 0x10)
//   2 — Lire le run count (uint32 LE @ offset 0x98 - Win10/11)
//   3 — Lire le last run time (FILETIME 64 bits @ offset 0x80 - Win10/11)
//
function genPrefetch() {
  const subtype = rand(0, 3);

  const le16 = v => [v & 0xFF, (v>>8) & 0xFF];
  const le32 = v => [v&0xFF, (v>>8)&0xFF, (v>>16)&0xFF, (v>>24)&0xFF];
  const le64 = v => {
    const lo = Number(BigInt(v) & 0xFFFFFFFFn);
    const hi = Number((BigInt(v) >> 32n) & 0xFFFFFFFFn);
    return [...le32(lo), ...le32(hi)];
  };
  const ascii = s => s.split('').map(c => c.charCodeAt(0));
  // UTF-16 LE : chaque char ASCII = 2 octets (char + 0x00)
  const utf16le = s => {
    const r = [];
    for (const c of s) { r.push(c.charCodeAt(0) & 0xFF, (c.charCodeAt(0) >> 8) & 0xFF); }
    return r;
  };


  // ── Sous-type 0 : Signature + version ───────────────────────
  if (subtype === 0) {
    const VERSIONS = [
      { ver: 0x11, label: 'Win XP', sig: 'SCCA' },
      { ver: 0x17, label: 'Win 7',  sig: 'SCCA' },
      { ver: 0x1A, label: 'Win 8',  sig: 'SCCA' },
      { ver: 0x1E, label: 'Win 10', sig: 'MAM\x04' },  // En réalité Win 10 = compressé MAM
      { ver: 0x1F, label: 'Win 11', sig: 'MAM\x04' },
    ];
    const target = VERSIONS[rand(0, VERSIONS.length-1)];

    // Header brut : pour Win10/11, signature MAM + version dans data décompressé.
    // Simplifié pour exo : on considère version dans les 4 octets après SCCA OU MAM\x04
    const isCompressed = target.sig.startsWith('MAM');
    const dump = isCompressed
      ? [...ascii('MAM'), 0x04, ...le32(rand(0x4000, 0xF000)), ...new Array(8).fill(0)]
      : [...le32(target.ver), ...ascii('SCCA'), ...new Array(8).fill(0)];
    while (dump.length < 16) dump.push(0);

    const choices = VERSIONS.map(v => v.label).sort(() => Math.random() - .5);

    const hints = [
      `Un fichier .pf commence par sa <strong>signature</strong>. SCCA = format non compressé (XP/7/8). MAM\\x04 = format compressé (Win 10/11, LZXPRESS).`,
      isCompressed
        ? `Bytes 0x00-0x03 = "MAM\\x04" (4D 41 4D 04) → format compressé Win 10/11`
        : `Bytes 0x04-0x07 = "SCCA" (53 43 43 41) → format classique. Version sur les 4 premiers octets.`,
      `→ <strong>${target.label}</strong>`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';
    const dumpHTML = renderHexDump(
      [{ offset: '00000000', hex: dump.map(b => pad(b.toString(16).toUpperCase(),2)).join(' '),
         ascii: dump.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''), bytes: dump }],
      [{ start: 0, end: isCompressed ? 3 : 7, color: 'gold' }],
      { cols: 16, title: 'En-tête .pf — 16 premiers octets' }
    );

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-pf">⏱️</div>
        <div class="ex-title">Prefetch — Identifier la version Windows</div>
        <span class="ex-badge easy">SCCA / MAM</span>
      </div>
      <div class="ex-scenario">
        Tu analyses un fichier <code>NOTEPAD.EXE-XXXXXXXX.pf</code> dans <code>C:\\Windows\\Prefetch\\</code>.<br>
        <strong>De quelle version Windows provient ce fichier ?</strong>
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Version Windows</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="pf-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:100px;font-family:var(--mono)"
            data-correct="${c === target.label}">${c}</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="pf-h1">💡 Niveau 1 — Signature</button>
        <button class="btn-hint" id="pf-h2" disabled style="opacity:.45">💡 Niveau 2 — Bytes</button>
        <button class="btn-hint" id="pf-h3" disabled style="opacity:.45">💡 Niveau 3 — Version</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-pf" style="display:none"></div>
      <button class="btn-next" id="btn-next-pf" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#pf-h1').addEventListener('click', () => showTPHint(div, 'pf', 1, hints[0]));
    div.querySelector('#pf-h2').addEventListener('click', () => showTPHint(div, 'pf', 2, hints[1]));
    div.querySelector('#pf-h3').addEventListener('click', () => showTPHint(div, 'pf', 3, hints[2]));

    div.querySelectorAll('#pf-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#pf-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('prefetch');
        const fb = div.querySelector('#ex-feedback-pf');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `Signature ${isCompressed ? '"MAM\\x04"' : '"SCCA"'} → format ${isCompressed ? 'compressé' : 'classique'} → <strong>${target.label}</strong>.`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `${isCompressed ? 'MAM\\x04 = Win 10/11' : 'SCCA = XP/7/8'}.`);
        div.querySelector('#btn-next-pf').style.display = 'inline-block';
        div.querySelector('#ex-num-pf').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 1 : Lire le nom de l'exécutable (UTF-16 LE @ 0x10) ─
  if (subtype === 1) {
    const EXES = ['NOTEPAD.EXE', 'CHROME.EXE', 'CMD.EXE', 'EXPLORER.EXE', 'POWERSHELL.EXE', 'CALC.EXE', 'MSPAINT.EXE'];
    const exe = EXES[rand(0, EXES.length-1)];
    const exeBytes = utf16le(exe);

    // Header simplifié : version + SCCA + 8 octets + nom UTF-16 LE @ 0x10
    const dump = [
      ...le32(0x17),               // version Win 7
      ...ascii('SCCA'),
      ...new Array(8).fill(0),     // padding jusqu'à 0x10
      ...exeBytes,
      0x00, 0x00,                  // null terminator UTF-16
    ];
    while (dump.length < 64) dump.push(0);

    const distractors = EXES.filter(e => e !== exe).sort(()=>Math.random()-.5).slice(0, 3);
    const choices = [exe, ...distractors].sort(() => Math.random() - .5);

    const hints = [
      `Le nom de l'exécutable est stocké en <strong>UTF-16 Little Endian</strong> à partir de l'<strong>offset 0x10</strong>. Chaque caractère ASCII = 2 octets : <code>char</code> + <code>0x00</code>.`,
      `Lis les octets à 0x10. Pour chaque paire (octet, 0x00), interprète le 1er comme caractère ASCII. Continue jusqu'au double null (0x00 0x00).`,
      `Caractères décodés → <strong>"${exe}"</strong>`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';

    const dumpRows = [];
    for (let i = 0; i < dump.length; i += 16) {
      const slice = dump.slice(i, i+16);
      dumpRows.push({
        offset: pad(i.toString(16).toUpperCase(), 8),
        hex: slice.map(b => pad(b.toString(16).toUpperCase(),2)).join(' '),
        ascii: slice.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''),
        bytes: slice,
      });
    }
    const dumpHTML = renderHexDump(dumpRows,
      [{ start: 0x10, end: 0x10 + exeBytes.length - 1, color: 'gold' }],
      { cols: 16, title: 'En-tête .pf — nom UTF-16 LE @ 0x10' });

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-pf">⏱️</div>
        <div class="ex-title">Prefetch — Lire le nom de l'exécutable</div>
        <span class="ex-badge medium">UTF-16 LE · @ 0x10</span>
      </div>
      <div class="ex-scenario">
        Le nom de l'exécutable est stocké en <strong>UTF-16 Little Endian</strong> à partir de l'offset <code>0x10</code>.<br>
        <strong>Quel programme a été exécuté ?</strong>
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Nom de l'exécutable</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="pf-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:130px;font-family:var(--mono)"
            data-correct="${c === exe}">${c}</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="pf-h1">💡 Niveau 1 — UTF-16</button>
        <button class="btn-hint" id="pf-h2" disabled style="opacity:.45">💡 Niveau 2 — Décode</button>
        <button class="btn-hint" id="pf-h3" disabled style="opacity:.45">💡 Niveau 3 — Réponse</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-pf" style="display:none"></div>
      <button class="btn-next" id="btn-next-pf" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#pf-h1').addEventListener('click', () => showTPHint(div, 'pf', 1, hints[0]));
    div.querySelector('#pf-h2').addEventListener('click', () => showTPHint(div, 'pf', 2, hints[1]));
    div.querySelector('#pf-h3').addEventListener('click', () => showTPHint(div, 'pf', 3, hints[2]));

    div.querySelectorAll('#pf-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#pf-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('prefetch');
        const fb = div.querySelector('#ex-feedback-pf');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `UTF-16 LE @ 0x10 → <strong>"${exe}"</strong>.<br>
          <span style="font-size:.74rem;color:var(--dim)">Chaque char ASCII = byte + 0x00 padding.</span>`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `Décode UTF-16 LE → "${exe}".`);
        div.querySelector('#btn-next-pf').style.display = 'inline-block';
        div.querySelector('#ex-num-pf').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 2 : Run count (uint32 LE @ 0x98 sur Win10/11) ─────
  if (subtype === 2) {
    const runCount = rand(1, 50);
    const runCountBytes = le32(runCount);
    // Dump : on simule un fichier .pf décompressé (24 bytes header + ... + run count à 0x98)
    const dump = new Array(0xA0).fill(0);
    // Header simplifié
    [...le32(0x1E), ...ascii('SCCA')].forEach((b, i) => dump[i] = b);  // version Win 10
    // Run count à 0x98
    runCountBytes.forEach((b, i) => dump[0x98 + i] = b);
    // Last run time à 0x80 (FILETIME quelconque)
    le64(133000000000000000n + BigInt(rand(0, 1000000000))).forEach((b, i) => dump[0x80 + i] = b);

    const distractors = [
      runCount + 1, runCount + 10,
      ((runCountBytes[3] << 24) | (runCountBytes[2] << 16) | (runCountBytes[1] << 8) | runCountBytes[0]) >>> 0,
    ].filter(v => v !== runCount && v > 0).slice(0, 3);
    while (distractors.length < 3) distractors.push(runCount + rand(50, 500));
    const choices = [runCount, ...distractors.slice(0,3)].sort(() => Math.random() - .5);

    const hints = [
      `Sur Win 10/11, le <strong>run count</strong> (nombre d'exécutions) est stocké à l'offset <strong>0x98</strong> sur 4 octets en Little Endian.`,
      `Octets à 0x98-0x9B = ${runCountBytes.map(b => pad(b.toString(16).toUpperCase(),2)).join(' ')}<br>
       Inverse l'ordre (LE) pour décoder.`,
      `${runCountBytes.map(b => pad(b.toString(16).toUpperCase(),2)).reverse().join('')}₁₆ = <strong>${runCount}</strong>`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';

    const dumpRows = [];
    for (let i = 0; i < dump.length; i += 16) {
      const slice = dump.slice(i, i+16);
      dumpRows.push({
        offset: pad(i.toString(16).toUpperCase(), 8),
        hex: slice.map(b => pad(b.toString(16).toUpperCase(),2)).join(' '),
        ascii: slice.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''),
        bytes: slice,
      });
    }
    const dumpHTML = renderHexDump(dumpRows,
      [{ start: 0x98, end: 0x9B, color: 'gold' }],
      { cols: 16, title: 'Header .pf décompressé — run count @ 0x98' });

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-pf">⏱️</div>
        <div class="ex-title">Prefetch — Combien d'exécutions ?</div>
        <span class="ex-badge medium">uint32 LE · @ 0x98 (Win 10/11)</span>
      </div>
      <div class="ex-scenario">
        Le champ <strong>run count</strong> indique combien de fois ce binaire a été exécuté.<br>
        <strong>Combien de fois ${['NOTEPAD.EXE', 'CMD.EXE', 'CALC.EXE'][rand(0, 2)]} a-t-il été lancé ?</strong>
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Nombre d'exécutions</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="pf-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:90px;font-family:var(--mono)"
            data-correct="${c === runCount}">${c}</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="pf-h1">💡 Niveau 1 — Offset</button>
        <button class="btn-hint" id="pf-h2" disabled style="opacity:.45">💡 Niveau 2 — Bytes</button>
        <button class="btn-hint" id="pf-h3" disabled style="opacity:.45">💡 Niveau 3 — Décimal</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-pf" style="display:none"></div>
      <button class="btn-next" id="btn-next-pf" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#pf-h1').addEventListener('click', () => showTPHint(div, 'pf', 1, hints[0]));
    div.querySelector('#pf-h2').addEventListener('click', () => showTPHint(div, 'pf', 2, hints[1]));
    div.querySelector('#pf-h3').addEventListener('click', () => showTPHint(div, 'pf', 3, hints[2]));

    div.querySelectorAll('#pf-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#pf-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('prefetch');
        const fb = div.querySelector('#ex-feedback-pf');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `Octets 0x98-0x9B = ${runCountBytes.map(b => pad(b.toString(16).toUpperCase(),2)).join(' ')} en LE → <strong>${runCount}</strong>.`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `LE = inverse les 4 octets : ${runCountBytes.map(b => pad(b.toString(16).toUpperCase(),2)).reverse().join('')}₁₆ = ${runCount}.`);
        div.querySelector('#btn-next-pf').style.display = 'inline-block';
        div.querySelector('#ex-num-pf').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 3 : Last run time (FILETIME @ 0x80) ──────────────
  {
    // Date de lancement entre 2020 et 2024
    const year = rand(2020, 2024);
    const month = rand(1, 12);
    const day = rand(1, 28);
    const hour = rand(0, 23);
    // Conversion approximative année → FILETIME (intervalles de 100ns depuis 1601-01-01 UTC)
    // FILETIME ≈ (year - 1601) * 365.25 * 86400 * 10^7 + offset month/day/hour
    const baseSeconds = (year - 1601) * 365.25 * 86400 + (month - 1) * 30.5 * 86400 + (day - 1) * 86400 + hour * 3600;
    const filetime = BigInt(Math.floor(baseSeconds * 10000000));
    const ftBytes = le64(filetime);

    const dump = new Array(0xA0).fill(0);
    [...le32(0x1E), ...ascii('SCCA')].forEach((b, i) => dump[i] = b);
    ftBytes.forEach((b, i) => dump[0x80 + i] = b);
    le32(rand(1, 30)).forEach((b, i) => dump[0x98 + i] = b);

    // Choix : différentes années
    const distractorYears = [year - 1, year + 1, year - 5, year + 3].filter(y => y !== year && y >= 2010 && y <= 2025);
    const choices = [year, ...distractorYears.slice(0, 3)].sort(() => Math.random() - .5);

    const hints = [
      `<strong>FILETIME</strong> = entier 64 bits = nombre d'intervalles de 100 ns depuis le <strong>1er janvier 1601 UTC</strong>. À l'offset 0x80 sur 8 octets en LE.`,
      `Conversion : <code>seconds = filetime / 10^7</code> ; <code>year ≈ 1601 + seconds / (365.25 × 86400)</code>.<br>
       FILETIME ≈ ${(Number(filetime) / 1e15).toFixed(2)} × 10¹⁵`,
      `Calcul → <strong>année ${year}</strong>`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';

    const dumpRows = [];
    for (let i = 0; i < dump.length; i += 16) {
      const slice = dump.slice(i, i+16);
      dumpRows.push({
        offset: pad(i.toString(16).toUpperCase(), 8),
        hex: slice.map(b => pad(b.toString(16).toUpperCase(),2)).join(' '),
        ascii: slice.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''),
        bytes: slice,
      });
    }
    const dumpHTML = renderHexDump(dumpRows,
      [{ start: 0x80, end: 0x87, color: 'gold' }],
      { cols: 16, title: 'Header .pf — last run FILETIME @ 0x80' });

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-pf">⏱️</div>
        <div class="ex-title">Prefetch — Année du dernier lancement</div>
        <span class="ex-badge hard">FILETIME 64 bits · base 1601</span>
      </div>
      <div class="ex-scenario">
        Le <strong>last run time</strong> est un FILETIME (intervalles de 100 ns depuis 1601-01-01 UTC) sur 8 octets LE à 0x80.<br>
        <strong>En quelle année cet exécutable a-t-il été lancé pour la dernière fois ?</strong>
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Année</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="pf-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:90px;font-family:var(--mono)"
            data-correct="${c === year}">${c}</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="pf-h1">💡 Niveau 1 — FILETIME</button>
        <button class="btn-hint" id="pf-h2" disabled style="opacity:.45">💡 Niveau 2 — Formule</button>
        <button class="btn-hint" id="pf-h3" disabled style="opacity:.45">💡 Niveau 3 — Calcul</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-pf" style="display:none"></div>
      <button class="btn-next" id="btn-next-pf" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#pf-h1').addEventListener('click', () => showTPHint(div, 'pf', 1, hints[0]));
    div.querySelector('#pf-h2').addEventListener('click', () => showTPHint(div, 'pf', 2, hints[1]));
    div.querySelector('#pf-h3').addEventListener('click', () => showTPHint(div, 'pf', 3, hints[2]));

    div.querySelectorAll('#pf-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#pf-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('prefetch');
        const fb = div.querySelector('#ex-feedback-pf');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `FILETIME 0x80-0x87 → ~${year}-${pad(month,2)}-${pad(day,2)} ${pad(hour,2)}h. <strong>Année : ${year}</strong>.`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `FILETIME / 10^7 / 86400 / 365.25 + 1601 ≈ ${year}.`);
        div.querySelector('#btn-next-pf').style.display = 'inline-block';
        div.querySelector('#ex-num-pf').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }
}

// ═══════════════════════════════════════════════════════════════
// 27. LNK — PARSING DE FICHIERS RACCOURCIS WINDOWS
// ═══════════════════════════════════════════════════════════════
//
// Sous-types :
//   0 — Identifier la signature header (4C 00 00 00) et le CLSID raccourci
//   1 — Lire les LinkFlags (offset 0x14, uint32 LE — détecter HasLinkTargetIDList, HasName, etc.)
//   2 — Lire les FileAttributes (offset 0x18 — détecter ARCHIVE, HIDDEN, READ_ONLY)
//   3 — Lire la taille du fichier cible (offset 0x34, uint32 LE)
//
function genLNK() {
  const subtype = rand(0, 3);

  const le32 = v => [v&0xFF, (v>>8)&0xFF, (v>>16)&0xFF, (v>>24)&0xFF];
  const ascii = s => s.split('').map(c => c.charCodeAt(0));


  // CLSID standard d'un raccourci LNK : 00021401-0000-0000-C000-000000000046
  // Format LE en mémoire : 01 14 02 00  00 00  00 00  C0 00 00 00 00 00 00 46
  const LNK_CLSID = [0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46];
  // Header size standard
  const HEADER_SIZE = 0x4C;

  // ── Sous-type 0 : Identifier signature + CLSID ──────────────
  if (subtype === 0) {
    // Vrai header LNK ou faux ?
    const isReal = Math.random() < 0.5;
    const sig = isReal ? [0x4C, 0x00, 0x00, 0x00] : [0x50, 0x4B, 0x03, 0x04];  // ZIP signature comme distractor
    const clsid = isReal ? LNK_CLSID : new Array(16).fill(0).map(() => rand(0, 255));

    const dump = [...sig, ...clsid, ...new Array(12).fill(0)];

    const choices = ['LNK (raccourci Windows)', 'ZIP archive', 'PE executable', 'OLE Compound'].sort(() => Math.random() - .5);
    const answer = isReal ? 'LNK (raccourci Windows)' : 'ZIP archive';

    const hints = [
      `Un fichier <strong>.lnk</strong> commence par <code>4C 00 00 00</code> (header size = 0x4C = 76 octets), suivi du CLSID standard <code>00021401-0000-0000-C000-000000000046</code>.`,
      `4 premiers octets : ${sig.map(b => pad(b.toString(16).toUpperCase(),2)).join(' ')}<br>
       ${isReal ? '→ 4C 00 00 00 = LNK header size' : '→ 50 4B 03 04 = "PK\\x03\\x04" = ZIP magic'}`,
      `→ <strong>${answer}</strong>`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';
    const dumpHTML = renderHexDump(
      [{ offset: '00000000', hex: dump.slice(0, 16).map(b => pad(b.toString(16).toUpperCase(),2)).join(' '),
         ascii: dump.slice(0, 16).map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''), bytes: dump.slice(0, 16) },
       { offset: '00000010', hex: dump.slice(16, 32).map(b => pad(b.toString(16).toUpperCase(),2)).join(' '),
         ascii: dump.slice(16, 32).map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''), bytes: dump.slice(16, 32) }],
      [{ start: 0, end: 3, color: 'gold' }, { start: 4, end: 19, color: 'cyan' }],
      { cols: 16, title: 'Premiers 32 octets — sig + CLSID' }
    );

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-lnk">🔗</div>
        <div class="ex-title">LNK — Identifier le format</div>
        <span class="ex-badge easy">Header size · CLSID</span>
      </div>
      <div class="ex-scenario">
        Tu as récupéré un fichier sans extension. Sa signature et son CLSID indiquent son format.<br>
        <strong>Quel est ce format ?</strong>
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Format</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="lnk-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:170px"
            data-correct="${c === answer}">${c}</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="lnk-h1">💡 Niveau 1 — Header LNK</button>
        <button class="btn-hint" id="lnk-h2" disabled style="opacity:.45">💡 Niveau 2 — Bytes</button>
        <button class="btn-hint" id="lnk-h3" disabled style="opacity:.45">💡 Niveau 3 — Format</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-lnk" style="display:none"></div>
      <button class="btn-next" id="btn-next-lnk" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#lnk-h1').addEventListener('click', () => showTPHint(div, 'lnk', 1, hints[0]));
    div.querySelector('#lnk-h2').addEventListener('click', () => showTPHint(div, 'lnk', 2, hints[1]));
    div.querySelector('#lnk-h3').addEventListener('click', () => showTPHint(div, 'lnk', 3, hints[2]));

    div.querySelectorAll('#lnk-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#lnk-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('lnk');
        const fb = div.querySelector('#ex-feedback-lnk');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `Premiers 4 octets = ${sig.map(b => pad(b.toString(16).toUpperCase(),2)).join(' ')} → <strong>${answer}</strong>.`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `${isReal ? '4C 00 00 00 + CLSID 00021401 = LNK' : '50 4B 03 04 = ZIP'}.`);
        div.querySelector('#btn-next-lnk').style.display = 'inline-block';
        div.querySelector('#ex-num-lnk').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 1 : LinkFlags (uint32 LE @ 0x14) ──────────────
  if (subtype === 1) {
    const FLAGS = [
      { bit: 0,  name: 'HasLinkTargetIDList', desc: 'Le raccourci contient un IDList (chemin)' },
      { bit: 1,  name: 'HasLinkInfo',          desc: 'Présence d\'une LinkInfoSection' },
      { bit: 2,  name: 'HasName',              desc: 'Présence d\'une description (NAME_STRING)' },
      { bit: 3,  name: 'HasRelativePath',      desc: 'Chemin relatif présent' },
      { bit: 4,  name: 'HasWorkingDir',        desc: 'Working directory présent' },
      { bit: 5,  name: 'HasArguments',         desc: 'Arguments de ligne de commande' },
      { bit: 6,  name: 'HasIconLocation',      desc: 'Icône custom' },
      { bit: 7,  name: 'IsUnicode',            desc: 'Strings en Unicode' },
    ];
    // Choisir un set aléatoire de flags activés
    const activeFlags = FLAGS.filter(() => Math.random() < 0.4);
    if (activeFlags.length === 0) activeFlags.push(FLAGS[0]);  // au moins un
    const flagsValue = activeFlags.reduce((acc, f) => acc | (1 << f.bit), 0);

    // Build header
    const dump = new Array(64).fill(0);
    [0x4C, 0x00, 0x00, 0x00].forEach((b, i) => dump[i] = b);
    LNK_CLSID.forEach((b, i) => dump[4 + i] = b);
    le32(flagsValue).forEach((b, i) => dump[0x14 + i] = b);

    // Question : quel flag est PRÉSENT ?
    const question = activeFlags[rand(0, activeFlags.length-1)];
    const distractors = FLAGS.filter(f => !activeFlags.some(a => a.bit === f.bit)).slice(0, 3);
    const options = [question, ...distractors].sort(() => Math.random() - .5);

    const hints = [
      `Les <strong>LinkFlags</strong> sont sur 4 octets (uint32 LE) à l'offset <strong>0x14</strong>. Chaque bit représente une fonctionnalité.`,
      `Octets 0x14-0x17 = ${le32(flagsValue).map(b => pad(b.toString(16).toUpperCase(),2)).join(' ')} en LE = 0x${pad(flagsValue.toString(16).toUpperCase(), 8)} = binaire ${flagsValue.toString(2).padStart(8, '0')}`,
      `Bits actifs : ${activeFlags.map(f => `bit ${f.bit} (${f.name})`).join(', ')}`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';

    const dumpRows = [];
    for (let i = 0; i < dump.length; i += 16) {
      const slice = dump.slice(i, i+16);
      dumpRows.push({
        offset: pad(i.toString(16).toUpperCase(), 8),
        hex: slice.map(b => pad(b.toString(16).toUpperCase(),2)).join(' '),
        ascii: slice.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''),
        bytes: slice,
      });
    }
    const dumpHTML = renderHexDump(dumpRows,
      [{ start: 0x14, end: 0x17, color: 'gold' }],
      { cols: 16, title: 'En-tête LNK — LinkFlags @ 0x14' });

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-lnk">🔗</div>
        <div class="ex-title">LNK — Quel LinkFlag est activé ?</div>
        <span class="ex-badge medium">Bitmask uint32 LE</span>
      </div>
      <div class="ex-scenario">
        LinkFlags = 0x${pad(flagsValue.toString(16).toUpperCase(), 8)}<br>
        <strong>Lequel de ces flags est présent dans cette valeur ?</strong>
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Flag activé</div>
      <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="lnk-choices">
        ${options.map(o => `<button class="tp-choice" style="text-align:left"
            data-correct="${o.bit === question.bit}">
            <strong style="font-family:var(--mono);color:var(--cyan)">bit ${o.bit} — ${o.name}</strong><br>
            <span style="font-size:.7rem;color:var(--dim)">${o.desc}</span>
        </button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="lnk-h1">💡 Niveau 1 — Bitmask</button>
        <button class="btn-hint" id="lnk-h2" disabled style="opacity:.45">💡 Niveau 2 — Bytes</button>
        <button class="btn-hint" id="lnk-h3" disabled style="opacity:.45">💡 Niveau 3 — Bits</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-lnk" style="display:none"></div>
      <button class="btn-next" id="btn-next-lnk" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#lnk-h1').addEventListener('click', () => showTPHint(div, 'lnk', 1, hints[0]));
    div.querySelector('#lnk-h2').addEventListener('click', () => showTPHint(div, 'lnk', 2, hints[1]));
    div.querySelector('#lnk-h3').addEventListener('click', () => showTPHint(div, 'lnk', 3, hints[2]));

    div.querySelectorAll('#lnk-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#lnk-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('lnk');
        const fb = div.querySelector('#ex-feedback-lnk');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `LinkFlags = 0x${pad(flagsValue.toString(16).toUpperCase(),8)}, bit ${question.bit} = 1 → <strong>${question.name}</strong>.`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `Flags actifs : ${activeFlags.map(f => f.name).join(', ')}.`);
        div.querySelector('#btn-next-lnk').style.display = 'inline-block';
        div.querySelector('#ex-num-lnk').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 2 : FileAttributes (uint32 LE @ 0x18) ──────────
  if (subtype === 2) {
    const ATTRS = [
      { bit: 0, name: 'READONLY',  desc: 'Lecture seule' },
      { bit: 1, name: 'HIDDEN',    desc: 'Caché' },
      { bit: 2, name: 'SYSTEM',    desc: 'Fichier système' },
      { bit: 4, name: 'DIRECTORY', desc: 'Répertoire (cible)' },
      { bit: 5, name: 'ARCHIVE',   desc: 'Archive (modifié depuis backup)' },
      { bit: 7, name: 'NORMAL',    desc: 'Aucun attribut spécial' },
    ];
    const activeAttrs = ATTRS.filter(() => Math.random() < 0.4);
    if (activeAttrs.length === 0) activeAttrs.push({ bit: 5, name: 'ARCHIVE', desc: 'Archive' });
    const attrsValue = activeAttrs.reduce((acc, a) => acc | (1 << a.bit), 0);

    const dump = new Array(64).fill(0);
    [0x4C, 0x00, 0x00, 0x00].forEach((b, i) => dump[i] = b);
    LNK_CLSID.forEach((b, i) => dump[4 + i] = b);
    le32(attrsValue).forEach((b, i) => dump[0x18 + i] = b);

    const question = activeAttrs[rand(0, activeAttrs.length-1)];
    const distractors = ATTRS.filter(a => !activeAttrs.some(x => x.bit === a.bit)).slice(0, 3);
    const options = [question, ...distractors].sort(() => Math.random() - .5);

    const hints = [
      `<strong>FileAttributes</strong> du fichier cible : 4 octets (uint32 LE) à l'offset <strong>0x18</strong>. Bitmask Windows standard (mêmes valeurs que <code>GetFileAttributes()</code>).`,
      `Octets 0x18-0x1B = ${le32(attrsValue).map(b => pad(b.toString(16).toUpperCase(),2)).join(' ')} → 0x${pad(attrsValue.toString(16).toUpperCase(),8)} = binaire ${attrsValue.toString(2).padStart(8, '0')}`,
      `Attributs actifs : ${activeAttrs.map(a => a.name).join(', ')}`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';

    const dumpRows = [];
    for (let i = 0; i < dump.length; i += 16) {
      const slice = dump.slice(i, i+16);
      dumpRows.push({
        offset: pad(i.toString(16).toUpperCase(), 8),
        hex: slice.map(b => pad(b.toString(16).toUpperCase(),2)).join(' '),
        ascii: slice.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''),
        bytes: slice,
      });
    }
    const dumpHTML = renderHexDump(dumpRows,
      [{ start: 0x18, end: 0x1B, color: 'gold' }],
      { cols: 16, title: 'En-tête LNK — FileAttributes @ 0x18' });

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-lnk">🔗</div>
        <div class="ex-title">LNK — FileAttributes du fichier cible</div>
        <span class="ex-badge medium">Bitmask Windows · @ 0x18</span>
      </div>
      <div class="ex-scenario">
        Le champ FileAttributes décrit les propriétés du fichier cible.<br>
        <strong>Quel attribut est activé pour cette cible ?</strong>
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Attribut</div>
      <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="lnk-choices">
        ${options.map(o => `<button class="tp-choice" style="text-align:left"
            data-correct="${o.bit === question.bit}">
            <strong style="font-family:var(--mono);color:var(--cyan)">${o.name}</strong> (bit ${o.bit})<br>
            <span style="font-size:.7rem;color:var(--dim)">${o.desc}</span>
        </button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="lnk-h1">💡 Niveau 1 — Format</button>
        <button class="btn-hint" id="lnk-h2" disabled style="opacity:.45">💡 Niveau 2 — Bytes</button>
        <button class="btn-hint" id="lnk-h3" disabled style="opacity:.45">💡 Niveau 3 — Bits</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-lnk" style="display:none"></div>
      <button class="btn-next" id="btn-next-lnk" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#lnk-h1').addEventListener('click', () => showTPHint(div, 'lnk', 1, hints[0]));
    div.querySelector('#lnk-h2').addEventListener('click', () => showTPHint(div, 'lnk', 2, hints[1]));
    div.querySelector('#lnk-h3').addEventListener('click', () => showTPHint(div, 'lnk', 3, hints[2]));

    div.querySelectorAll('#lnk-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#lnk-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('lnk');
        const fb = div.querySelector('#ex-feedback-lnk');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `FileAttributes = 0x${pad(attrsValue.toString(16).toUpperCase(),8)}, bit ${question.bit} = 1 → <strong>${question.name}</strong>.`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `Attributs actifs : ${activeAttrs.map(a => a.name).join(', ')}.`);
        div.querySelector('#btn-next-lnk').style.display = 'inline-block';
        div.querySelector('#ex-num-lnk').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 3 : FileSize de la cible (uint32 LE @ 0x34) ───
  {
    const fileSize = rand(1024, 10485760);  // 1 KB - 10 MB
    const dump = new Array(0x4C).fill(0);
    [0x4C, 0x00, 0x00, 0x00].forEach((b, i) => dump[i] = b);
    LNK_CLSID.forEach((b, i) => dump[4 + i] = b);
    // FileSize @ 0x34
    le32(fileSize).forEach((b, i) => dump[0x34 + i] = b);

    // Choix : taille en KB
    const fileSizeKB = Math.round(fileSize / 1024);
    const distractors = [
      Math.round((fileSize * 2) / 1024),
      Math.round((fileSize / 2) / 1024),
      Math.round(fileSize / 1000),  // KB décimal piège
    ].filter(v => v !== fileSizeKB && v > 0).slice(0, 3);
    while (distractors.length < 3) distractors.push(fileSizeKB + rand(100, 5000));
    const choices = [fileSizeKB, ...distractors.slice(0, 3)].sort((a, b) => a - b);

    const fsBytes = le32(fileSize);
    const hints = [
      `Le champ <strong>FileSize</strong> (taille du fichier cible) est sur 4 octets (uint32 LE) à l'offset <strong>0x34</strong>.`,
      `Octets 0x34-0x37 = ${fsBytes.map(b => pad(b.toString(16).toUpperCase(),2)).join(' ')} → en LE = ${fsBytes.map(b => pad(b.toString(16).toUpperCase(),2)).reverse().join('')}₁₆ = ${fileSize} octets`,
      `${fileSize} o ÷ 1024 = <strong>${fileSizeKB} KB</strong>`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';

    const dumpRows = [];
    for (let i = 0; i < dump.length; i += 16) {
      const slice = dump.slice(i, i+16);
      dumpRows.push({
        offset: pad(i.toString(16).toUpperCase(), 8),
        hex: slice.map(b => pad(b.toString(16).toUpperCase(),2)).join(' '),
        ascii: slice.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join(''),
        bytes: slice,
      });
    }
    const dumpHTML = renderHexDump(dumpRows,
      [{ start: 0x34, end: 0x37, color: 'gold' }],
      { cols: 16, title: 'En-tête LNK — FileSize @ 0x34' });

    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-lnk">🔗</div>
        <div class="ex-title">LNK — Taille du fichier cible</div>
        <span class="ex-badge medium">uint32 LE · @ 0x34</span>
      </div>
      <div class="ex-scenario">
        Le champ FileSize (4 octets LE @ 0x34) indique la taille du fichier vers lequel pointe le raccourci.<br>
        <strong>Quelle est la taille approximative en KB ?</strong>
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Taille</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="lnk-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:110px;font-family:var(--mono)"
            data-correct="${c === fileSizeKB}">${c.toLocaleString('fr-CH')} KB</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="lnk-h1">💡 Niveau 1 — Offset</button>
        <button class="btn-hint" id="lnk-h2" disabled style="opacity:.45">💡 Niveau 2 — LE → octets</button>
        <button class="btn-hint" id="lnk-h3" disabled style="opacity:.45">💡 Niveau 3 — Conversion KB</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-lnk" style="display:none"></div>
      <button class="btn-next" id="btn-next-lnk" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#lnk-h1').addEventListener('click', () => showTPHint(div, 'lnk', 1, hints[0]));
    div.querySelector('#lnk-h2').addEventListener('click', () => showTPHint(div, 'lnk', 2, hints[1]));
    div.querySelector('#lnk-h3').addEventListener('click', () => showTPHint(div, 'lnk', 3, hints[2]));

    div.querySelectorAll('#lnk-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#lnk-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('lnk');
        const fb = div.querySelector('#ex-feedback-lnk');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `Octets 0x34-0x37 = ${fsBytes.map(b => pad(b.toString(16).toUpperCase(),2)).join(' ')} → ${fileSize.toLocaleString('fr-CH')} octets ÷ 1024 = <strong>${fileSizeKB} KB</strong>.`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `${fileSize} o ÷ 1024 = ${fileSizeKB} KB.`);
        div.querySelector('#btn-next-lnk').style.display = 'inline-block';
        div.querySelector('#ex-num-lnk').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }
}

// ───────────────────────────────────────────────────────────────
// Enregistrement dans le dispatcher GENERATORS (créé par tp-engine.js)
// ───────────────────────────────────────────────────────────────
if (typeof GENERATORS !== 'undefined') {
  GENERATORS.registry = genRegistry;
  GENERATORS.prefetch = genPrefetch;
  GENERATORS.lnk      = genLNK;
}
