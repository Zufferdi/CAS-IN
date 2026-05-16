// ═══════════════════════════════════════════════════════════════
// tp-engine-disk.js — Exercices "Disk family" (4 catégories)
//
// Module séparé de tp-engine.js pour faciliter la maintenance (PR 4.3
// du plan Phase 4). Doit être chargé APRÈS tp-engine.js (dépendances :
// STATE, GENERATORS, rand, pad, esc, escAttr, encData, decData, le16, le32,
// hexRow, showTPHint, markHintUsed, breakStreak, incSolved, renderHexDump,
// formatChoiceFeedback).
//
// Le dispatcher GENERATORS est patché en fin de fichier pour enregistrer
// les 4 générateurs.
//
// ─── Catégories couvertes ──────────────────────────────────────
//   • endian    (🔄 « Endianness »)        — LE/BE, lecture hex
//   • timestamp (⏱ « Timestamps FAT »)     — décodage FAT date/time
//   • mbr       (💽 « MBR / GPT »)         — table de partitions
//   • hexdump   (🔬 « Dump Hex en contexte ») — localiser/décoder un champ
//
// ─── Note design (PR 4.3) ──────────────────────────────────────
// HINT_LIBRARY (système d'indices contextuel) reste dans le noyau
// tp-engine.js car c'est un dictionnaire partagé indexé par toutes
// les catégories — y compris celles déjà extraites en PR 4.1/4.2.
// Refactorer en hints distribués serait hors scope Phase 4.
// ═══════════════════════════════════════════════════════════════

// ── 1. ENDIANNESS ──────────────────────────────────
// Sous-types : 0=LE→décimal, 1=BE→décimal, 2=détecter endian, 3=encodage inverse (LE), 4=encodage inverse (BE)
function genEndian() {
  const subtype = rand(0, 4);

  // Valeurs forensiques raisonnables : max 4 octets, chiffres pas trop grands
  // On choisit dans des plages réalistes pour FAT/NTFS
  const FORENSIC_VALS_4 = [
    { val: 0x00000002, label: 'nombre de FATs = 2' },
    { val: 0x00000200, label: 'taille secteur = 512 o' },
    { val: 0x00000008, label: 'SectorsPerCluster = 8' },
    { val: 0x0000003E, label: 'secteurs réservés = 62' },
    { val: 0x00000004, label: 'cluster racine = 4' },
    { val: 0x00000003, label: 'cluster racine = 3' },
    { val: 0x00001000, label: 'offset = 4 096 o' },
    { val: 0x00004000, label: 'offset = 16 384 o' },
    { val: 0x00010000, label: 'taille = 65 536 o' },
    { val: 0x00000100, label: 'valeur = 256' },
    { val: 0x00000010, label: 'valeur = 16' },
    { val: 0x000000FF, label: 'valeur = 255' },
  ];
  const FORENSIC_VALS_2 = [
    { val: 0x0200, label: 'BPS = 512' },
    { val: 0x0020, label: 'RootEntries lo' },
    { val: 0x003E, label: 'reserved = 62' },
    { val: 0x0008, label: 'SPC = 8' },
    { val: 0x00FF, label: 'valeur = 255' },
    { val: 0x0100, label: 'valeur = 256' },
    { val: 0x1234, label: 'valeur = 4 660' },
    { val: 0x00A0, label: 'valeur = 160' },
  ];

  // Contextes forensiques selon le type de champ
  const CONTEXTS_4 = [
    { field: 'Total Sectors',     fs: 'FAT32 BPB offset 0x20', endian: 'LE' },
    { field: 'FAT Size (sectors)',fs: 'FAT32 BPB offset 0x24', endian: 'LE' },
    { field: 'Root Cluster',      fs: 'FAT32 BPB offset 0x2C', endian: 'LE' },
    { field: 'File Size',         fs: 'Directory Entry offset 0x1C', endian: 'LE' },
    { field: 'Partition Start LBA',fs: 'MBR Partition Entry offset 0x08', endian: 'LE' },
    { field: 'Partition Size',    fs: 'MBR Partition Entry offset 0x0C', endian: 'LE' },
    { field: 'Block Count',       fs: 'HFS+ Volume Header offset 0x04', endian: 'BE' },
    { field: 'Block Size',        fs: 'HFS+ Volume Header offset 0x14', endian: 'BE' },
    { field: 'Total Blocks',      fs: 'EXT4 Superblock offset 0x04', endian: 'LE' },
  ];
  const CONTEXTS_2 = [
    { field: 'Bytes Per Sector',  fs: 'BPB FAT offset 0x0B', endian: 'LE' },
    { field: 'Reserved Sectors',  fs: 'BPB FAT offset 0x0E', endian: 'LE' },
    { field: 'Last Modified Time',fs: 'Directory Entry offset 0x16', endian: 'LE' },
    { field: 'Starting Cluster',  fs: 'Directory Entry offset 0x1A', endian: 'LE' },
    { field: 'Volume Header Sig', fs: 'HFS+ Volume Header offset 0x00', endian: 'BE' },
    { field: 'EXT4 Magic',        fs: 'EXT4 Superblock offset 0x38', endian: 'LE' },
  ];

  // Utilitaires internes
  function toLeBytes(val, n) {
    const b = [];
    let v = val;
    for (let i = 0; i < n; i++) { b.push(v & 0xFF); v >>>= 8; }
    return b; // b[0] = LSB
  }
  function toBeBytes(val, n) {
    return toLeBytes(val, n).reverse(); // b[0] = MSB
  }
  function hexStr(bytes) {
    return bytes.map(b => pad(b.toString(16).toUpperCase(), 2)).join(' ');
  }
  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - .5);
  }

  // ─── Sous-type 0 : Little Endian → Décimal ───
  if (subtype <= 1) {
    const isLE = (subtype === 0);
    const nBytes = Math.random() < 0.5 ? 4 : 2;
    const pool = nBytes === 4 ? FORENSIC_VALS_4 : FORENSIC_VALS_2;
    const chosen = pool[rand(0, pool.length - 1)];
    const ctxPool = nBytes === 4 ? CONTEXTS_4 : CONTEXTS_2;
    // Filtrer par endian correspondant
    const ctxFiltered = ctxPool.filter(c => c.endian === (isLE ? 'LE' : 'BE'));
    const ctx = ctxFiltered.length ? ctxFiltered[rand(0, ctxFiltered.length - 1)] : ctxPool[rand(0, ctxPool.length - 1)];

    const val = chosen.val & (nBytes === 4 ? 0xFFFFFFFF : 0xFFFF);
    const leBytes = toLeBytes(val, nBytes);
    const beBytes = toBeBytes(val, nBytes);
    const displayBytes = isLE ? leBytes : beBytes;

    // Étapes
    const revBytes = isLE ? [...leBytes].reverse() : leBytes;
    const hexCat = '0x' + revBytes.map(b => pad(b.toString(16).toUpperCase(), 2)).join('');

    // Distracteurs : valeur BE quand on demande LE, et inversement
    const wrongVal1 = isLE
      ? (nBytes === 4 ? (leBytes[0]<<24|leBytes[1]<<16|leBytes[2]<<8|leBytes[3])>>>0 : (leBytes[0]<<8|leBytes[1])>>>0)
      : (nBytes === 4 ? leBytes.reduce((a,b,i)=>a+(b<<(8*i)),0) : leBytes.reduce((a,b,i)=>a+(b<<(8*i)),0));
    const wrongVal2 = val === 0 ? 1 : Math.max(1, val >> 1);
    const wrongVal3 = val + (nBytes === 4 ? 256 : 16);
    // Garantir 4 choix distincts (palindromes / val=0 peuvent dédupliquer)
    const candidates = [val, wrongVal1, wrongVal2, wrongVal3, val * 2 + 1, val ^ 0xFF, val + 1];
    const uniq = [...new Set(candidates.filter(v => v >= 0 && v <= 0xFFFFFFFF))];
    const choices = shuffle(uniq.slice(0, 4));

    const endianLabel = isLE ? 'Little Endian' : 'Big Endian';
    const endianNote = isLE
      ? 'Les octets sont stockés du moins significatif (LSB) au plus significatif (MSB).'
      : 'Les octets sont stockés du plus significatif (MSB) au moins significatif (LSB).';

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-1">🔄</div>
        <div class="ex-title">Conversion ${endianLabel} → Décimal</div>
        <span class="ex-badge ${isLE ? 'medium' : 'hard'}">${endianLabel}</span>
      </div>
      <div class="ex-scenario">
        Tu analyses le champ <strong>${ctx.field}</strong> (<em>${ctx.fs}</em>).<br>
        Les ${nBytes} octets suivants sont stockés en <strong>${endianLabel}</strong> dans le dump :<br>
        <span style="font-size:.7rem;color:var(--dim)">${endianNote}</span>
      </div>
      <div class="sec-title">Séquence hexadécimale (${endianLabel})</div>
      <div class="hex-display" id="hex-display">
        ${displayBytes.map((b,i)=>`<span class="hex-byte" id="hb${i}" title="Octet à l'adresse +${i}">${pad(b.toString(16).toUpperCase(),2)}</span>`).join('<span class="hex-sep">·</span>')}
      </div>
      <div class="sec-title" style="margin-top:.75rem">Étapes de résolution</div>
      <div class="steps-wrap" id="steps-wrap">
        ${isLE
          ? `<div class="step-item pending"><span class="step-num">1</span><div>Inverser les octets (LE→BE) : <span class="step-val" id="step1-val">?</span></div></div>
             <div class="step-item pending"><span class="step-num">2</span><div>Concaténer : <span class="step-val" id="step2-val">?</span></div></div>
             <div class="step-item pending"><span class="step-num">3</span><div>Convertir en décimal : <span class="step-val" id="step3-val">?</span></div></div>`
          : `<div class="step-item pending"><span class="step-num">1</span><div>Lire les octets tels quels (MSB en premier) : <span class="step-val" id="step1-val">?</span></div></div>
             <div class="step-item pending"><span class="step-num">2</span><div>Concaténer : <span class="step-val" id="step2-val">?</span></div></div>
             <div class="step-item pending"><span class="step-num">3</span><div>Convertir en décimal : <span class="step-val" id="step3-val">?</span></div></div>`}
      </div>
      <div class="sec-title" style="margin-top:.75rem">Quelle est la valeur décimale ?</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="endian-choices">
        ${choices.map(c=>`<button class="tp-choice" style="flex:1;min-width:100px" data-correct="${c===val}" data-choice="${c}">
          ${c.toLocaleString('fr-CH')}</button>`).join('')}
      </div>
      <div class="ex-feedback" id="ex-feedback"></div>
      <button class="btn-next" id="btn-next" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    div.querySelectorAll('#endian-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const c = parseInt(b.dataset.choice);
        checkEndianChoice(b, c === val, val, displayBytes, revBytes);
      });
    });
    return div;
  }

  // ─── Sous-type 2 : Détecter l'endianness ───
  if (subtype === 2) {
    const nBytes = 4;
    const pool = FORENSIC_VALS_4;
    const chosen = pool[rand(0, pool.length - 1)];
    const val = chosen.val;
    const isLE = Math.random() < 0.5;
    const leBytes = toLeBytes(val, nBytes);
    const beBytes = toBeBytes(val, nBytes);
    const displayBytes = isLE ? leBytes : beBytes;

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-1">🔄</div>
        <div class="ex-title">Détecter l'ordre d'octets</div>
        <span class="ex-badge medium">Boutisme</span>
      </div>
      <div class="ex-scenario">
        Un analyste décode ces 4 octets et obtient la valeur <strong>${val.toLocaleString('fr-CH')}</strong>
        (<code>0x${val.toString(16).toUpperCase().padStart(8,'0')}</code>).<br>
        Quel ordre d'octets a-t-il utilisé ?
      </div>
      <div class="sec-title">Octets dans le dump</div>
      <div class="hex-display">
        ${displayBytes.map((b,i)=>`<span class="hex-byte" id="hb${i}">${pad(b.toString(16).toUpperCase(),2)}</span>`).join('<span class="hex-sep">·</span>')}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin:.75rem 0" id="endian-choices">
        ${shuffle(['Little Endian (x86, FAT, NTFS)', 'Big Endian (réseau, HFS+)', 'Middle Endian (PDP-11)', 'Aucun ordre défini']).map(c=>{
          const isCorrect = (isLE && c.startsWith('Little')) || (!isLE && c.startsWith('Big'));
          return `<button class="tp-choice" style="flex:1;min-width:140px" data-correct="${isCorrect}" data-is-correct="${isCorrect}">
            ${c}</button>`;
        }).join('')}
      </div>
      <div class="ex-feedback" id="ex-feedback"></div>
      <button class="btn-next" id="btn-next" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    div.querySelectorAll('#endian-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isCorrect = b.dataset.isCorrect === 'true';
        checkEndianChoice(b, isCorrect, 0, displayBytes, isLE ? leBytes : beBytes);
      });
    });
    return div;
  }

  // ─── Sous-types 3 & 4 : Encodage inverse (quelle séquence dans le dump ?) ───
  const isLE = (subtype === 3);
  const nBytes = Math.random() < 0.5 ? 4 : 2;
  const pool = nBytes === 4 ? FORENSIC_VALS_4 : FORENSIC_VALS_2;
  const chosen = pool[rand(0, pool.length - 1)];
  const val = chosen.val & (nBytes === 4 ? 0xFFFFFFFF : 0xFFFF);
  const correctBytes = isLE ? toLeBytes(val, nBytes) : toBeBytes(val, nBytes);
  const wrongBytes1  = isLE ? toBeBytes(val, nBytes) : toLeBytes(val, nBytes);
  // Distracteur : décalé d'un octet
  const wrongBytes2 = [...correctBytes.slice(1), correctBytes[0]];
  // Distracteur : un octet modifié
  const wrongBytes3 = [...correctBytes];
  wrongBytes3[0] = (wrongBytes3[0] + 1) & 0xFF;

  function shuffle(arr) { return [...arr].sort(() => Math.random() - .5); }
  const options = shuffle([correctBytes, wrongBytes1, wrongBytes2, wrongBytes3]);
  const endianLabel = isLE ? 'Little Endian' : 'Big Endian';

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-1">🔄</div>
      <div class="ex-title">Encodage ${endianLabel} — quelle séquence ?</div>
      <span class="ex-badge ${isLE ? 'medium' : 'hard'}">${endianLabel}</span>
    </div>
    <div class="ex-scenario">
      Tu dois stocker la valeur <code>0x${val.toString(16).toUpperCase().padStart(nBytes*2,'0')}</code>
      (= <strong>${val.toLocaleString('fr-CH')}</strong> — ${chosen.label})
      sur ${nBytes} octets en <strong>${endianLabel}</strong>.<br>
      Quelle séquence apparaît dans le dump hexadécimal ?
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin:.75rem 0" id="endian-choices">
      ${options.map(opt => {
        const isCorrect = hexStr(opt) === hexStr(correctBytes);
        return `<button class="tp-choice" style="flex:1;min-width:130px;font-family:var(--mono)"
          data-correct="${isCorrect}" data-is-correct="${isCorrect}">
          ${hexStr(opt)}</button>`;
      }).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback"></div>
    <button class="btn-next" id="btn-next" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  div.querySelectorAll('#endian-choices .tp-choice').forEach(b => {
    b.addEventListener('click', () => {
      const isCorrect = b.dataset.isCorrect === 'true';
      checkEndianChoice(b, isCorrect, 0, correctBytes, isLE ? [...correctBytes].reverse() : correctBytes);
    });
  });
  return div;
}

function checkEndianChoice(btn, isCorrect, expectedVal, displayBytes, orderedBytes) {
  document.querySelectorAll('#endian-choices .tp-choice').forEach(b => { b.disabled = true; });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (isCorrect) { if (!STATE.hintUsed) incSolved('endian'); }
  else { breakStreak();
    document.querySelectorAll('#endian-choices .tp-choice').forEach(b => {
      if (b.dataset.correct === 'true') b.classList.add('correct');
      else if (b !== btn) b.classList.add('dim');
    });
  }
  // Afficher les étapes
  document.querySelectorAll('.step-item').forEach((s,i) => {
    s.className = 'step-item active';
    const hexOrdered = orderedBytes.map(b=>pad(b.toString(16).toUpperCase(),2)).join(' ');
    const hexCat = '0x' + orderedBytes.map(b=>pad(b.toString(16).toUpperCase(),2)).join('');
    const decVal = parseInt(orderedBytes.map(b=>pad(b.toString(16).toUpperCase(),2)).join(''), 16);
    const el1 = document.getElementById('step1-val');
    const el2 = document.getElementById('step2-val');
    const el3 = document.getElementById('step3-val');
    if (el1) el1.textContent = hexOrdered;
    if (el2) el2.textContent = hexCat;
    if (el3) el3.textContent = decVal.toLocaleString('fr-CH');
  });
  // Highlight hex bytes
  displayBytes.forEach((_,i) => {
    const el = document.getElementById('hb'+i);
    if (el) el.className = 'hex-byte highlight';
  });
  const fb = document.getElementById('ex-feedback');
  if (fb) {
    fb.className = 'ex-feedback ' + (isCorrect ? 'correct' : 'wrong');
    const ordHex = orderedBytes.map(b=>pad(b.toString(16).toUpperCase(),2)).join(' ');
    const ordCat = '0x'+orderedBytes.map(b=>pad(b.toString(16).toUpperCase(),2)).join('');
    const decVal = parseInt(ordCat.slice(2),16);
    fb.innerHTML = isCorrect
      ? `✅ Correct ! Octets dans l'ordre canonique : <code>${ordHex}</code> → <code>${ordCat}</code> = ${decVal.toLocaleString('fr-CH')}`
      : `❌ Incorrect. Octets dans l'ordre canonique : <code>${ordHex}</code> → <code>${ordCat}</code> = ${decVal.toLocaleString('fr-CH')}`;
  }
  const next = document.getElementById('btn-next');
  if (next) next.style.display = 'inline-block';
}

// ── 2. HORODATAGES MS-DOS ─────────────────────────
function genTimestamp() {
  // Mode 0 = FAT timestamp, Mode 1 = NTFS FILETIME, Mode 2 = EXT4 Unix epoch
  const tsMode = rand(0, 2);
  if (tsMode === 1) {
    // NTFS FILETIME : intervalles de 100ns depuis 01/01/1601 UTC
    // Bug fix : (yr - 1601) * 365.25 * 24 * 3600 * 1e7 dépasse Number.MAX_SAFE_INTEGER
    // (~9e15) dès 2003. On passe en BigInt et on calcule l'offset via Date.UTC.
    const yr = rand(2015, 2024);
    // Différence en millisecondes entre Date.UTC(yr,0,1) et l'epoch FILETIME 01/01/1601
    const FILETIME_EPOCH_DIFF_MS = 11644473600000n; // ms entre 1601-01-01 et 1970-01-01
    const msSinceUnix = BigInt(Date.UTC(yr, 0, 1)); // 01 janv yr UTC
    const msSince1601 = msSinceUnix + FILETIME_EPOCH_DIFF_MS;
    const filetime = msSince1601 * 10000n; // 100ns ticks (10000 ticks/ms)

    // Décomposer en 8 octets Little Endian via shift BigInt
    const b = [];
    let v = filetime;
    for (let i = 0; i < 8; i++) {
      b.push(Number(v & 0xFFn));
      v >>= 8n;
    }
    const hexBytes = b.map(x=>pad(x.toString(16).toUpperCase(),2));
    // Pour l'affichage scientifique de FILETIME — on prend le log approximatif
    const filetimeApprox = Number(filetime / 10000000n); // secondes depuis 1601
    const filetimeExp = filetimeApprox.toExponential(3);

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-ts">🕐</div>
        <div class="ex-title">NTFS FILETIME — Epoch 1601</div>
        <span class="ex-badge hard">NTFS · $STANDARD_INFORMATION</span>
      </div>
      <div class="ex-scenario">
        Les timestamps NTFS ($STANDARD_INFORMATION, $FILE_NAME) utilisent le format <strong>FILETIME</strong> :
        intervalles de <strong>100 nanosecondes</strong> depuis le <strong>01 janvier 1601 00:00:00 UTC</strong>.<br>
        Les 8 octets ci-dessous représentent un timestamp FILETIME en Little Endian.
        À quelle <strong>année approximative</strong> correspond cette valeur ?
      </div>
      <div class="sec-title">Octets FILETIME (Little Endian, 8 octets)</div>
      <div class="hex-display">${hexBytes.map(h=>`<span class="hex-byte highlight">${h}</span>`).join('')}</div>
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.65rem 1rem;margin:.75rem 0;font-size:.78rem">
        <div style="color:var(--dim);margin-bottom:.3rem">Formule :</div>
        <div style="font-family:var(--mono);color:var(--cyan)">date = 1601 + (FILETIME ÷ 10<sup>7</sup>) ÷ (365.25 × 86400)</div>
        <div style="color:var(--dim);margin-top:.3rem;font-size:.7rem">📌 Astuce mémo : <em>« Bill is from 1601 »</em> · 1 sec = 10⁷ ticks (100ns)</div>
      </div>
      <div class="ex-input-row">
        <span class="ex-input-label">Année :</span>
        <input class="ex-input" id="ans-year" type="number" placeholder="${yr}" style="max-width:90px" min="1970" max="2100">
        <button class="btn-hint" onclick="document.getElementById('ex-feedback-ts').innerHTML='💡 FILETIME en secondes ≈ ${filetimeExp}. Diviser par 31 557 600 = années depuis 1601. Ajouter 1601.';document.getElementById('ex-feedback-ts').style.display='block';markHintUsed();">💡 Méthode</button>
        <button class="btn-validate" onclick="(function(){
          const v=parseInt(document.getElementById('ans-year').value);
          const fb=document.getElementById('ex-feedback-ts');
          const ok=Math.abs(v-${yr})<=1;
          document.getElementById('ans-year').className='ex-input '+(ok?'correct':'wrong');
          fb.className='ex-feedback '+(ok?'correct':'wrong');
          fb.innerHTML=ok?'✅ Correct ! Année ≈ ${yr} — FILETIME = ${filetimeExp} secondes depuis 1601.':'❌ Réponse attendue : <strong>${yr}</strong> (±1 an accepté). FILETIME ≈ ${filetimeExp} sec → ÷ 31 557 600 = années → +1601.';
          fb.style.display='block';
          if(ok && !STATE.hintUsed){incSolved('timestamp');} else if(!ok){breakStreak();}
          document.getElementById('btn-next-ts').style.display='inline-block';
        })()">Valider ✓</button>
        <button class="btn-next" id="btn-next-ts" onclick="newExercise()" style="display:none">Exercice suivant →</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-ts" style="display:none"></div>
    `;
    return div;
  }
  // ── Mode 2 : EXT4 / Unix epoch (uint32, secondes depuis 01/01/1970 UTC) ──
  if (tsMode === 2) {
    // Plage 2010–2024 — valeurs uint32 calculables mentalement par approximation
    const yr   = rand(2010, 2024);
    const mon  = rand(1, 12);
    const day  = rand(1, 28);
    const hour = rand(0, 23);
    const min  = rand(0, 59);
    // Calcul précis de l'epoch Unix via Date.UTC
    const epoch = Math.floor(Date.UTC(yr, mon-1, day, hour, min, 0) / 1000);
    // Représentation LE32 (4 octets)
    const b = [epoch & 0xFF, (epoch>>8)&0xFF, (epoch>>16)&0xFF, (epoch>>>24)&0xFF];
    const hexBytes = b.map(x => pad(x.toString(16).toUpperCase(), 2));
    // Valeur hex BE pour l'affichage (ordre réseau, plus lisible)
    const epochHex = '0x' + epoch.toString(16).toUpperCase().padStart(8, '0');
    // Années depuis 1970 — approximation mentale : epoch ÷ 31 557 600
    const approxYears = Math.floor(epoch / 31557600);
    // Distracteurs : ±1 an
    const dists = [yr - 1, yr + 1, yr - 2].filter(v => v !== yr && v >= 2000 && v <= 2030);

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-ts">🐧</div>
        <div class="ex-title">EXT4 — Unix Timestamp (epoch 1970)</div>
        <span class="ex-badge medium">Linux · uint32 · inode ctime/mtime/atime</span>
      </div>
      <div class="ex-scenario">
        Les systèmes EXT2/3/4 stockent les timestamps dans les <strong>inodes</strong> sous forme d'un entier de 32 bits non signé
        représentant le nombre de <strong>secondes écoulées depuis le 1er janvier 1970 00:00:00 UTC</strong> (Unix epoch).<br><br>
        Les 4 octets ci-dessous sont extraits du champ <code>i_mtime</code> d'un inode EXT4, en <strong>Little Endian</strong>.
        À quelle <strong>année</strong> correspond ce timestamp ?
      </div>
      <div class="sec-title">Champ i_mtime — 4 octets Little Endian</div>
      <div class="hex-display">${hexBytes.map(h => `<span class="hex-byte highlight">${h}</span>`).join('')}</div>
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.65rem 1rem;margin:.75rem 0;font-size:.78rem">
        <div style="color:var(--dim);margin-bottom:.4rem">Méthode de décodage :</div>
        <div style="font-family:var(--mono);color:var(--cyan);margin-bottom:.25rem">1. Inverser LE → valeur uint32 = ${epochHex}</div>
        <div style="font-family:var(--mono);color:var(--muted);margin-bottom:.25rem">2. Convertir en décimal = ${epoch.toLocaleString('fr-CH')} secondes</div>
        <div style="font-family:var(--mono);color:var(--muted)">3. Diviser par 31 557 600 (sec/an) → ≈ ${approxYears} ans depuis 1970</div>
        <div style="margin-top:.4rem;color:var(--dim);font-size:.7rem">📌 Mémo : <em>« Unix is born in 1970 »</em> · 1 an ≈ 31,5 M secondes · Limite uint32 : <strong>19 janvier 2038</strong> (Year 2038 problem)</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="ts-choices">
        ${[yr, ...dists].sort(() => Math.random() - .5).map(y =>
          `<button class="tp-choice" style="flex:1;min-width:80px;font-family:var(--mono)"
            data-correct="${y === yr}">${y}</button>`).join('')}
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="ts-h1">💡 Niveau 1 — Inverser LE</button>
        <button class="btn-hint" id="ts-h2" disabled style="opacity:.45">💡 Niveau 2 — Valeur décimale</button>
        <button class="btn-hint" id="ts-h3" disabled style="opacity:.45">💡 Niveau 3 — Calcul de l'année</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-ts" style="display:none"></div>
      <button class="btn-next" id="btn-next-ts" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    const hints = [
      `Inverser les 4 octets (Little Endian) : <code>${hexBytes.join(' ')}</code> → <code>${[...hexBytes].reverse().join(' ')}</code> = <strong>${epochHex}</strong>`,
      `${epochHex} en décimal = <strong>${epoch.toLocaleString('fr-CH')}</strong> secondes depuis le 01/01/1970.`,
      `${epoch.toLocaleString('fr-CH')} ÷ 31 557 600 ≈ <strong>${approxYears} ans</strong> depuis 1970 → année <strong>${yr}</strong>.`,
    ];
    function showTSHintEXT(level) {
      markHintUsed();
      const fb = div.querySelector('#ex-feedback-ts');
      fb.style.display = 'block'; fb.className = 'ex-feedback correct';
      fb.innerHTML = `<div style="font-size:.7rem;color:var(--dim);margin-bottom:.2rem">Indice ${level}/3</div>${hints[level-1]}`;
      const next = div.querySelector('#ts-h'+( level+1));
      if (next) { next.disabled = false; next.style.opacity = '1'; }
      div.querySelector('#ts-h'+level).style.opacity = '.35';
    }
    div.querySelector('#ts-h1').addEventListener('click', () => showTSHintEXT(1));
    div.querySelector('#ts-h2').addEventListener('click', () => showTSHintEXT(2));
    div.querySelector('#ts-h3').addEventListener('click', () => showTSHintEXT(3));

    div.querySelectorAll('#ts-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#ts-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('timestamp');
        const fb = div.querySelector('#ex-feedback-ts');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `${epochHex} = ${epoch.toLocaleString('fr-CH')} s depuis 1970 → ÷ 31 557 600 ≈ ${approxYears} ans → <strong>${yr}</strong>.`;
        fb.innerHTML = isOk
          ? `✅ Correct ! ${explain} Date exacte : ${yr}-${pad(mon,2)}-${pad(day,2)} ${pad(hour,2)}:${pad(min,2)}:00 UTC`
          : `❌ Attendu : <strong>${yr}</strong>. ${explain}`;
        div.querySelector('#btn-next-ts').style.display = 'inline-block';
        div.querySelector('#ex-num-ts').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.querySelector('.ex-card').className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Mode 0 : FAT timestamp ────────────────────────────────────
  // Time FAT : bits 15-11 = heures, 10-5 = minutes, 4-0 = secondes/2
  const year  = rand(1990, 2024); const month = rand(1,12); const day = rand(1,28);
  const hours = rand(0,23);       const mins  = rand(0,59); const secs = rand(0,29)*2;

  const dateWord = ((year-1980)<<9) | (month<<5) | day;
  const timeWord = (hours<<11) | (mins<<5) | Math.floor(secs/2);

  const dateLo = dateWord & 0xFF; const dateHi = (dateWord>>8) & 0xFF;
  const timeLo = timeWord & 0xFF; const timeHi = (timeWord>>8) & 0xFF;
  // Stored: time (LE), then date (LE)
  const bytes = [timeLo, timeHi, dateLo, dateHi];

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-ts">1</div>
      <div class="ex-title">Reconstruction d'un horodatage FAT MS-DOS</div>
      <span class="ex-badge medium">medium</span>
    </div>
    <div class="ex-scenario">
      Tu analyses une entrée de répertoire FAT32. Les octets <strong>0x16–0x17</strong> (heure) et <strong>0x18–0x19</strong> (date) sont extraits ci-dessous.<br>
      Reconstitue la <strong>date et l'heure exactes</strong> de cette entrée.
    </div>

    <div class="sec-title">Octets extraits (Little Endian)</div>
    <div class="hex-display">
      <span style="font-size:.72rem;color:var(--dim);margin-right:8px">Heure :</span>
      <span class="hex-byte highlight" title="Octet de poids faible (Heure)">${pad(timeLo.toString(16).toUpperCase(),2)}</span>
      <span class="hex-byte highlight" title="Octet de poids fort (Heure)">${pad(timeHi.toString(16).toUpperCase(),2)}</span>
      <span class="hex-sep" style="margin:0 12px">|</span>
      <span style="font-size:.72rem;color:var(--dim);margin-right:8px">Date :</span>
      <span class="hex-byte selected" title="Octet de poids faible (Date)">${pad(dateLo.toString(16).toUpperCase(),2)}</span>
      <span class="hex-byte selected" title="Octet de poids fort (Date)">${pad(dateHi.toString(16).toUpperCase(),2)}</span>
    </div>

    <div class="sec-title">Structure des bits (après inversion Little Endian)</div>
    <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.75rem;margin-bottom:1rem;font-family:var(--mono);font-size:.75rem">
      <div style="margin-bottom:.5rem;color:var(--dim)">Mot TIME = <span style="color:var(--gold)">0x${pad(timeWord.toString(16).toUpperCase(),4)}</span> = <span style="color:var(--cyan)">${pad(timeWord.toString(2),16)}</span></div>
      <div style="display:flex;gap:2px;flex-wrap:wrap;margin-bottom:4px">
        ${Array.from({length:16},(_,i)=>{
          const bit = (timeWord>>(15-i))&1;
          const grp = i<5?'gold':i<11?'green':'purple';
          return `<span class="bit bit-${bit}" style="border-color:rgba(${grp==='gold'?'240,192,64':grp==='green'?'48,232,138':'167,139,250'},.3)">${bit}</span>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:2px;color:var(--dim);font-size:.6rem;margin-bottom:.75rem">
        <span style="color:var(--purple)">HH HH H</span>·<span style="color:var(--green)">MM MM MM</span>·<span style="color:var(--gold)">SS SS SS S</span>
        <span style="margin-left:8px;color:var(--dim)">// bits 15-11=h · 10-5=m · 4-0=s/2</span>
      </div>
      <div style="margin-bottom:.5rem;color:var(--dim)">Mot DATE = <span style="color:var(--gold)">0x${pad(dateWord.toString(16).toUpperCase(),4)}</span> = <span style="color:var(--cyan)">${pad(dateWord.toString(2),16)}</span></div>
      <div style="display:flex;gap:2px;flex-wrap:wrap;margin-bottom:4px">
        ${Array.from({length:16},(_,i)=>{
          const bit = (dateWord>>(15-i))&1;
          return `<span class="bit bit-${bit}">${bit}</span>`;
        }).join('')}
      </div>
      <div style="font-size:.6rem;color:var(--dim)">bits 15-9 = année (+ 1980) · 8-5 = mois · 4-0 = jour</div>
    </div>

    <div class="ex-input-row" style="flex-wrap:wrap;gap:.5rem">
      <input class="ex-input" id="ans-year"  type="number" placeholder="Année" style="max-width:90px" min="1980" max="2107">
      <span class="ex-input-label">-</span>
      <input class="ex-input" id="ans-month" type="number" placeholder="Mois"  style="max-width:80px" min="1" max="12">
      <span class="ex-input-label">-</span>
      <input class="ex-input" id="ans-day"   type="number" placeholder="Jour"  style="max-width:80px" min="1" max="31">
      <span class="ex-input-label" style="margin:0 4px">à</span>
      <input class="ex-input" id="ans-hour"  type="number" placeholder="HH"   style="max-width:75px" min="0" max="23">
      <span class="ex-input-label">:</span>
      <input class="ex-input" id="ans-min"   type="number" placeholder="MM"   style="max-width:75px" min="0" max="59">
      <span class="ex-input-label">:</span>
      <input class="ex-input" id="ans-sec"   type="number" placeholder="SS"   style="max-width:75px" min="0" max="58">
    </div>
    <div class="ex-input-row" style="margin-top:.5rem">
      <button class="btn-hint" onclick="showTSHint(${year},${month},${day},${hours},${mins},${secs})">💡 Calculs</button>
      <button class="btn-validate" onclick="checkTimestamp(${year},${month},${day},${hours},${mins},${secs})">Valider ✓</button>
      <button class="btn-next" id="btn-next-ts" onclick="newExercise()">Exercice suivant →</button>
    </div>
    <div class="ex-feedback" id="ex-feedback-ts"></div>
  `;
  return div;
}

// Fix : feedback visuel global quand un indice est utilisé
function markHintUsed() {
  if (STATE.hintUsed) return;  // déjà marqué, ne rien re-afficher
  STATE.hintUsed = true;
  // Petit toast discret pour informer
  if (!document.getElementById('hint-toast')) {
    const toast = document.createElement('div');
    toast.id = 'hint-toast';
    toast.textContent = '💡 Indice utilisé — cet exercice ne comptera pas pour le score';
    toast.style.cssText = `
      position:fixed; bottom:75px; left:50%; transform:translateX(-50%);
      background:rgba(240,192,64,.15); border:1px solid rgba(240,192,64,.4);
      color:var(--gold); padding:.4rem .9rem; border-radius:999px;
      font-size:.72rem; z-index:9000; animation: fadeInOut 2.5s ease;
      pointer-events:none;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
}
// CSS animation du toast (une seule fois)
if (typeof document !== 'undefined' && !document.querySelector('#hint-toast-style')) {
  const s = document.createElement('style');
  s.id = 'hint-toast-style';
  s.textContent = `@keyframes fadeInOut{0%{opacity:0;transform:translate(-50%,10px)}20%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0}}`;
  document.head.appendChild(s);
}

function showTSHint(y,mo,d,h,mi,s) {
  const timeWord = (h<<11)|(mi<<5)|Math.floor(s/2);
  const dateWord = ((y-1980)<<9)|(mo<<5)|d;
  const fb = document.getElementById('ex-feedback-ts');
  fb.className = 'ex-feedback correct';
  fb.style.display = 'block';
  fb.innerHTML = `
    <strong>Décomposition :</strong><br>
    Time = 0x${pad(timeWord.toString(16).toUpperCase(),4)} → bits 15-11 = <strong>${h}h</strong> · bits 10-5 = <strong>${mi}min</strong> · bits 4-0 × 2 = <strong>${s}s</strong><br>
    Date = 0x${pad(dateWord.toString(16).toUpperCase(),4)} → bits 15-9 + 1980 = <strong>${y}</strong> · bits 8-5 = <strong>${mo}</strong> · bits 4-0 = <strong>${d}</strong>
  `;
  markHintUsed();
}

function checkTimestamp(ey, emo, ed, eh, emi, es) {
  const yr = parseInt(document.getElementById('ans-year').value);
  const mo = parseInt(document.getElementById('ans-month').value);
  const dy = parseInt(document.getElementById('ans-day').value);
  const hr = parseInt(document.getElementById('ans-hour').value);
  const mn = parseInt(document.getElementById('ans-min').value);
  const sc = parseInt(document.getElementById('ans-sec').value);
  const fb = document.getElementById('ex-feedback-ts');

  if ([yr,mo,dy,hr,mn,sc].some(isNaN)) {
    fb.className='ex-feedback wrong'; fb.innerHTML='✗ Remplis tous les champs.'; return;
  }
  // MS-DOS seconds are rounded to 2s precision
  const secOk = Math.abs(sc - es) <= 2;
  const ok = yr===ey && mo===emo && dy===ed && hr===eh && mn===emi && secOk;

  if (ok) {
    document.querySelector('.btn-validate').disabled = true;
    document.getElementById('btn-next-ts').style.display = 'block';
    document.querySelector('.ex-card').className = 'ex-card solved';
    document.getElementById('ex-num-ts').className = 'ex-num solved';
    fb.className='ex-feedback correct';
    fb.innerHTML=`✓ Correct ! Date : <strong>${ey}-${pad(emo,2)}-${pad(ed,2)}</strong> à <strong>${pad(eh,2)}:${pad(emi,2)}:${pad(es,2)}</strong> — Maîtrise des horodatages FAT validée.`;
    if (!STATE.hintUsed) incSolved(STATE.cat);
  } else {
    fb.className='ex-feedback wrong';
    fb.innerHTML=`✗ Incorrect. Tu as saisi : ${yr}-${pad(mo,2)}-${pad(dy,2)} ${pad(hr,2)}:${pad(mn,2)}:${pad(sc,2)}<br>Utilise "💡 Calculs" pour voir la décomposition bit par bit.`;
    breakStreak();
  }
}


// ═══════════════════════════════════════════════════════════════
// 21. MBR / GPT — PARSING DE TABLE DE PARTITIONS
// ═══════════════════════════════════════════════════════════════
//
// Sous-types :
//   0 — Lire un champ précis d'une partition entry MBR (LBA start, size, type)
//   1 — Calculer l'offset absolu d'une partition (LBA start × 512)
//   2 — Identifier le type de partition via le byte de type (0x07, 0x0B, 0x83…)
//   3 — Détecter MBR vs GPT depuis le premier secteur
//
function genMBR() {
  const subtype = rand(0, 3);

  // ── Palette de types de partitions réalistes ────────────────
  const PART_TYPES = [
    { byte: 0x07, name: 'NTFS / exFAT',    note: '0x07 = NTFS (Windows) ou exFAT. Le plus courant sur les disques Windows modernes.' },
    { byte: 0x0B, name: 'FAT32 (CHS)',      note: '0x0B = FAT32 adressé en CHS. 0x0C = FAT32 LBA — plus courant sur les supports récents.' },
    { byte: 0x0C, name: 'FAT32 (LBA)',      note: '0x0C = FAT32 adressé en LBA. Identique à 0x0B côté structure, différent côté adressage.' },
    { byte: 0x83, name: 'Linux (ext2/3/4)', note: '0x83 = partition Linux native (ext2, ext3, ext4). Identifiable par le superbloc à offset 1024.' },
    { byte: 0x82, name: 'Linux swap',       note: '0x82 = espace de swap Linux. Pas de système de fichiers — zone de pagination RAM.' },
    { byte: 0x05, name: 'Étendue (CHS)',    note: '0x05 = partition étendue — contient des partitions logiques. 0x0F = étendue LBA.' },
    { byte: 0xEE, name: 'GPT protective',   note: '0xEE = Protective MBR — indique un disque GPT. Le vrai schéma de partitions est dans le GPT header à LBA 1.' },
    { byte: 0xAB, name: 'macOS Boot',       note: '0xAB = macOS Recovery / boot. Visible sur les Macs avec EFI.' },
  ];

  // ── Utilitaires Little Endian ───────────────────────────────
  const le32 = v => [v & 0xFF, (v>>8)&0xFF, (v>>16)&0xFF, (v>>24)&0xFF];

  // ── Générateur de partition entry réaliste (16 octets) ──────
  // On garde les valeurs petites pour que le calcul soit faisable mentalement.
  // LBA start : multiple de 2048 (alignement 1 Mo classique), max ~256 Mo → max LBA ~524288
  // Size      : entre 2048 et 65536 secteurs (1 Mo à 32 Mo)
  function makePartEntry(typeObj, lbaStart, lbaSize) {
    const b = new Array(16).fill(0);
    b[0]  = 0x80;                      // Status : 0x80 = bootable, 0x00 = non-bootable
    // CHS Begin (3 octets) — on met 0xFE 0xFF 0xFF pour indiquer "CHS non utilisable"
    b[1]  = 0xFE; b[2] = 0xFF; b[3] = 0xFF;
    b[4]  = typeObj.byte;              // Partition type
    // CHS End
    b[5]  = 0xFE; b[6] = 0xFF; b[7] = 0xFF;
    // LBA Start (LE32)
    le32(lbaStart).forEach((x,i) => b[8+i]  = x);
    // LBA Size (LE32)
    le32(lbaSize).forEach((x,i)  => b[12+i] = x);
    return b;
  }

  // ── Sous-type 0 : lire un champ depuis la partition entry ───
  if (subtype === 0) {
    const typeObj  = PART_TYPES[rand(0, PART_TYPES.length - 1)];
    const lbaStart = rand(1, 128) * 2048;          // 2048..262144
    const lbaSize  = rand(1,  32) * 2048;          // 2048..65536
    const entry    = makePartEntry(typeObj, lbaStart, lbaSize);

    // On choisit quel champ on demande
    const field = rand(0, 2);
    let answer, qText, hlFrom, hlTo, hlColor, hlLabel, explain, hints;

    if (field === 0) {
      // LBA Start
      answer   = lbaStart;
      qText    = `Lis le champ <strong>LBA Start</strong> de cette partition entry.<br>
                  <span style="color:var(--dim);font-size:.78rem">Offset dans l'entry : 0x08 sur 4 octets Little Endian</span>`;
      hlFrom   = 8; hlTo = 11; hlColor = '--cyan'; hlLabel = 'LBA Start (LE32)';
      explain  = `LBA Start @ offset 0x08 : ${entry.slice(8,12).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} en LE → 0x${lbaStart.toString(16).toUpperCase()} = ${lbaStart.toLocaleString('fr-CH')} secteurs.`;
      hints    = [
        `LBA Start est à l'offset <strong>0x08</strong> dans l'entry, encodé sur <strong>4 octets Little Endian</strong>.`,
        `Lis les 4 octets à partir de l'offset 0x08 : <code>${entry.slice(8,12).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code>. Inverse l'ordre.`,
        `Inversé : <code>${entry.slice(8,12).reverse().map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code> → 0x${lbaStart.toString(16).toUpperCase()} = ${lbaStart} secteurs`,
      ];
    } else if (field === 1) {
      // LBA Size
      answer   = lbaSize;
      qText    = `Lis le champ <strong>LBA Size</strong> (nombre de secteurs) de cette partition entry.<br>
                  <span style="color:var(--dim);font-size:.78rem">Offset dans l'entry : 0x0C sur 4 octets Little Endian</span>`;
      hlFrom   = 12; hlTo = 15; hlColor = '--gold'; hlLabel = 'LBA Size (LE32)';
      explain  = `LBA Size @ offset 0x0C : ${entry.slice(12,16).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} en LE → ${lbaSize.toLocaleString('fr-CH')} secteurs = ${Math.round(lbaSize*512/1024/1024)} Mo.`;
      hints    = [
        `LBA Size est à l'offset <strong>0x0C</strong> dans l'entry, encodé sur <strong>4 octets Little Endian</strong>.`,
        `Lis les 4 octets : <code>${entry.slice(12,16).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code>, inverse, convertis.`,
        `→ 0x${lbaSize.toString(16).toUpperCase()} = ${lbaSize} secteurs ≈ ${Math.round(lbaSize*512/1024/1024)} Mo`,
      ];
    } else {
      // Type byte
      answer   = typeObj.byte;
      qText    = `Lis le <strong>Type byte</strong> de cette partition entry.<br>
                  <span style="color:var(--dim);font-size:.78rem">Offset dans l'entry : 0x04 sur 1 octet</span>`;
      hlFrom   = 4; hlTo = 4; hlColor = '--purple'; hlLabel = 'Partition Type';
      explain  = `Type @ offset 0x04 = 0x${typeObj.byte.toString(16).toUpperCase()} → ${typeObj.name}. ${typeObj.note}`;
      hints    = [
        `Le type byte est à l'offset <strong>0x04</strong> — un seul octet, pas besoin d'inverser.`,
        `Offset 0x04 dans le dump : <code>${entry[4].toString(16).toUpperCase().padStart(2,'0')}</code>.`,
        `0x${typeObj.byte.toString(16).toUpperCase()} = "${typeObj.name}".`,
      ];
    }

    // Distracteurs pour QCM
    const makeDist = (base) => {
      const d = [];
      if (field === 2) {
        // Pour le type byte, prendre d'autres types
        d.push(...PART_TYPES.filter(t => t.byte !== typeObj.byte).map(t => t.byte).sort(() => Math.random()-.5).slice(0,3));
      } else {
        d.push(answer + 2048, answer - 2048, answer * 2);
      }
      return d.filter(v => v !== answer && v > 0).slice(0,3);
    };
    const distractors = makeDist(answer);
    const choices = [answer, ...distractors].sort(() => Math.random()-.5);

    const dumpHTML = renderHexDump(
      [{ offset: '00000000', bytes: entry }],
      [
        { from:0, to:0, color:'--dim', label:'Status (0x80=bootable)' },
        { from:1, to:3, color:'--dim', label:'CHS Begin' },
        { from:hlFrom, to:hlTo, color:hlColor, label:hlLabel },
        { from:5, to:7, color:'--dim', label:'CHS End' },
      ],
      { cols: 16, title: 'Partition Entry MBR (16 octets)' }
    );

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-mbr">💽</div>
        <div class="ex-title">Lecture d'une Partition Entry MBR</div>
        <span class="ex-badge medium">MBR · Little Endian</span>
      </div>
      <div class="ex-scenario">
        Tu analyses la <strong>table de partitions MBR</strong> d'un disque suspect.<br>
        Chaque partition entry fait <strong>16 octets</strong>, offset 0x1BE dans le MBR.<br>
        ${qText}
      </div>
      <div class="sec-title">Partition Entry (16 octets)</div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Structure d'une Partition Entry</div>
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.6rem 1rem;margin-bottom:.75rem;font-family:var(--mono);font-size:.72rem;display:grid;grid-template-columns:auto auto 1fr;gap:.2rem .8rem">
        <span style="color:var(--dim)">0x00</span><span style="color:var(--text)">1 o</span><span style="color:var(--muted)">Status (0x80=boot, 0x00=inactif)</span>
        <span style="color:var(--dim)">0x01</span><span style="color:var(--text)">3 o</span><span style="color:var(--muted)">CHS Begin (souvent FE FF FF si LBA)</span>
        <span style="color:var(--purple);font-weight:700">0x04</span><span style="color:var(--text)">1 o</span><span style="color:var(--purple)">Type byte (FS)</span>
        <span style="color:var(--dim)">0x05</span><span style="color:var(--text)">3 o</span><span style="color:var(--muted)">CHS End (souvent FE FF FF si LBA)</span>
        <span style="color:var(--cyan);font-weight:700">0x08</span><span style="color:var(--text)">4 o</span><span style="color:var(--cyan)">LBA Start (LE32)</span>
        <span style="color:var(--gold);font-weight:700">0x0C</span><span style="color:var(--text)">4 o</span><span style="color:var(--gold)">LBA Size (LE32, nb secteurs)</span>
      </div>
      <div class="sec-title">Réponse</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="mbr-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:100px;font-family:var(--mono)"
            data-correct="${c === answer}" data-val="${c}">
            ${field === 2 ? '0x' + c.toString(16).toUpperCase().padStart(2,'0') : c.toLocaleString('fr-CH')}
          </button>`).join('')}
      </div>
      <div style="display:flex;gap:.5rem;margin-bottom:.5rem">
        <button class="btn-hint" id="btn-mbr-hint">💡 Indice</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-mbr" style="display:none"></div>
      <button class="btn-next" id="btn-next-mbr" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    let hintLevel = 0;
    div.querySelector('#btn-mbr-hint').addEventListener('click', () => {
      markHintUsed();
      const fb = div.querySelector('#ex-feedback-mbr');
      fb.style.display = 'block';
      fb.className = 'ex-feedback correct';
      fb.innerHTML = '💡 ' + hints[Math.min(hintLevel, hints.length-1)];
      hintLevel++;
    });
    div.querySelectorAll('#mbr-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        document.querySelectorAll('#mbr-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('mbr');
        const fb = div.querySelector('#ex-feedback-mbr');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        fb.innerHTML = formatChoiceFeedback(isOk, explain,
          `La valeur lue n'est pas correcte. ${explain}`);
        div.querySelector('#btn-next-mbr').style.display = 'inline-block';
        div.querySelector('#ex-num-mbr').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 1 : calculer l'offset absolu en octets ────────
  if (subtype === 1) {
    const typeObj  = PART_TYPES[rand(0, PART_TYPES.length - 1)];
    const lbaStart = rand(1, 64) * 2048;    // 2048..131072 — volontairement petit
    const lbaSize  = rand(1, 16) * 2048;
    const bps      = 512;                   // toujours 512 pour simplifier
    const entry    = makePartEntry(typeObj, lbaStart, lbaSize);
    const answer   = lbaStart * bps;        // offset absolu en octets

    const distractors = [
      lbaSize * bps,                // confusion start/size
      lbaStart * 4096,              // mauvais BPS
      lbaStart + bps,               // addition au lieu de multiplication
    ].filter(v => v !== answer && v > 0);
    const choices = [answer, ...distractors].sort(() => Math.random()-.5);

    const dumpHTML = renderHexDump(
      [{ offset: '00000000', bytes: entry }],
      [
        { from:8, to:11, color:'--cyan', label:'LBA Start (LE32)' },
        { from:12,to:15, color:'--dim',  label:'LBA Size' },
      ],
      { cols: 16, title: 'Partition Entry MBR (16 octets)' }
    );

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-mbr">💽</div>
        <div class="ex-title">MBR → Offset absolu de la partition</div>
        <span class="ex-badge hard">LBA × BPS</span>
      </div>
      <div class="ex-scenario">
        Tu as lu la partition entry ci-dessous. Le disque utilise des secteurs de
        <strong>${bps} octets</strong>.<br>
        À quel <strong>offset absolu</strong> (en octets) commence cette partition sur le disque ?
      </div>
      ${dumpHTML}
      <div style="background:rgba(0,229,204,.04);border:1px solid rgba(0,229,204,.15);border-radius:8px;padding:.6rem .9rem;margin-bottom:.75rem;font-size:.78rem">
        <strong style="color:var(--cyan)">Formule :</strong>
        <span style="font-family:var(--mono);color:var(--text)"> Offset = LBA_Start × Bytes_Per_Sector</span>
        <div style="margin-top:.3rem;color:var(--dim);font-size:.72rem">LBA Start est à l'offset <strong>0x08</strong> de l'entry — 4 octets Little Endian.</div>
      </div>
      <div class="sec-title">Offset absolu (octets)</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="mbr-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:120px;font-family:var(--mono)"
            data-correct="${c === answer}" data-val="${c}">
            ${c.toLocaleString('fr-CH')} o
          </button>`).join('')}
      </div>
      <div style="display:flex;gap:.5rem;margin-bottom:.5rem">
        <button class="btn-hint" id="btn-mbr-hint">💡 Étapes</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-mbr" style="display:none"></div>
      <button class="btn-next" id="btn-next-mbr" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    const stepsHtml = `
      💡 Étapes :
      <ol style="margin:.4rem 0 0 1.2rem;line-height:1.8;font-size:.78rem">
        <li>Lire LBA Start à l'offset 0x08 : <code style="color:var(--cyan)">${entry.slice(8,12).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code></li>
        <li>Inverser (Little Endian) → <code>0x${lbaStart.toString(16).toUpperCase()}</code> = ${lbaStart.toLocaleString('fr-CH')} secteurs</li>
        <li>Offset = ${lbaStart.toLocaleString('fr-CH')} × ${bps} = <strong>${answer.toLocaleString('fr-CH')} octets</strong></li>
      </ol>`;
    div.querySelector('#btn-mbr-hint').addEventListener('click', () => {
      markHintUsed();
      const fb = div.querySelector('#ex-feedback-mbr');
      fb.style.display = 'block'; fb.className = 'ex-feedback correct';
      fb.innerHTML = stepsHtml;
    });
    div.querySelectorAll('#mbr-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        document.querySelectorAll('#mbr-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('mbr');
        const fb = div.querySelector('#ex-feedback-mbr');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `LBA Start = ${lbaStart} secteurs × ${bps} o/secteur = <strong>${answer.toLocaleString('fr-CH')} octets</strong>.`;
        fb.innerHTML = formatChoiceFeedback(isOk, explain,
          `Erreur de calcul. ${explain}`);
        div.querySelector('#btn-next-mbr').style.display = 'inline-block';
        div.querySelector('#ex-num-mbr').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 2 : identifier le type de partition ────────────
  if (subtype === 2) {
    const typeObj = PART_TYPES[rand(0, PART_TYPES.length - 1)];
    const lbaStart = rand(1, 32) * 2048;
    const lbaSize  = rand(1, 16) * 2048;
    const entry    = makePartEntry(typeObj, lbaStart, lbaSize);

    const others  = PART_TYPES.filter(t => t.byte !== typeObj.byte).sort(() => Math.random()-.5).slice(0,3);
    const choices = [...others, typeObj].sort(() => Math.random()-.5);

    const dumpHTML = renderHexDump(
      [{ offset: '00000000', bytes: entry }],
      [{ from:4, to:4, color:'--purple', label:'Type byte' }],
      { cols: 16, title: 'Partition Entry MBR (16 octets)' }
    );

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-mbr">💽</div>
        <div class="ex-title">MBR — Identifier le type de partition</div>
        <span class="ex-badge medium">Partition Type</span>
      </div>
      <div class="ex-scenario">
        Tu examines une partition entry MBR. Le <strong>type byte</strong> (offset 0x04) est mis en évidence.<br>
        Quel système de fichiers ou type de partition ce byte désigne-t-il ?
      </div>
      ${dumpHTML}
      <div class="sec-title" style="margin-top:.6rem">Type de partition</div>
      <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="mbr-choices">
        ${choices.map(c => `
          <button class="tp-choice" data-correct="${c.byte === typeObj.byte}" data-val="${c.byte}"
              data-explain="${encData(c.note)}" style="text-align:left">
            <span class="tp-choice-letter" style="font-family:var(--mono);min-width:52px">0x${c.byte.toString(16).toUpperCase().padStart(2,'0')}</span>
            <span>${c.name}</span>
          </button>`).join('')}
      </div>
      <div class="ex-feedback" id="ex-feedback-mbr" style="display:none"></div>
      <button class="btn-next" id="btn-next-mbr" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    div.querySelectorAll('#mbr-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        document.querySelectorAll('#mbr-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('mbr');
        const fb = div.querySelector('#ex-feedback-mbr');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const note = decData(b.dataset.explain) || typeObj.note;
        fb.innerHTML = formatChoiceFeedback(isOk,
          `0x${typeObj.byte.toString(16).toUpperCase().padStart(2,'0')} = <strong>${typeObj.name}</strong>. ${typeObj.note}`,
          `${note} — La bonne réponse est <strong>0x${typeObj.byte.toString(16).toUpperCase().padStart(2,'0')} (${typeObj.name})</strong>.`);
        div.querySelector('#btn-next-mbr').style.display = 'inline-block';
        div.querySelector('#ex-num-mbr').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 3 : MBR vs GPT ─────────────────────────────────
  {
    const isGPT = Math.random() < 0.5;
    const SECTOR_SIZE = 512;

    // MBR : 4 partitions normales, signature AA55 à l'offset 510
    // GPT : protective MBR avec type 0xEE, reste à zéro, signature AA55
    const sectorBytes = new Array(SECTOR_SIZE).fill(0);

    // Signature boot à l'offset 510
    sectorBytes[510] = 0x55; sectorBytes[511] = 0xAA;

    let hint1Text, hint2Text, correctExplain, wrongExplain;

    if (!isGPT) {
      // MBR classique : 2 entrées réalistes à 0x1BE et 0x1CE
      const e1 = makePartEntry(PART_TYPES[2], 2048, 32768);   // FAT32
      const e2 = makePartEntry(PART_TYPES[0], 34816, 65536);  // NTFS
      e1.forEach((b,i) => sectorBytes[0x1BE+i] = b);
      e2.forEach((b,i) => sectorBytes[0x1CE+i] = b);
      // Marquer les 2 autres entrées comme vides
      hint1Text = 'L\'offset 0x1C2 contient le type byte de la première partition.';
      hint2Text = `Type byte @ 0x1C2 = 0x0C (FAT32 LBA) — pas 0xEE. C'est un MBR classique, pas un GPT.`;
      correctExplain = `MBR classique : première partition type 0x0C (FAT32), deuxième type 0x07 (NTFS). Aucune entrée 0xEE (GPT protective). Signature 0x55AA à l'offset 510.`;
      wrongExplain   = `Ce secteur n'est pas un GPT. Le type 0xEE (protective MBR) est absent. Les deux partitions ont des types FAT32/NTFS normaux.`;
    } else {
      // GPT protective MBR : une seule entrée type 0xEE, le reste à zéro
      const gptEntry = makePartEntry(PART_TYPES.find(t=>t.byte===0xEE), 1, 0xFFFFFFFF);
      gptEntry.forEach((b,i) => sectorBytes[0x1BE+i] = b);
      hint1Text = 'L\'offset 0x1C2 contient le type byte de la première partition.';
      hint2Text = `Type byte @ 0x1C2 = 0xEE = "GPT Protective MBR". Le vrai schéma de partitions est dans l'en-tête GPT à LBA 1.`;
      correctExplain = `Type 0xEE (GPT Protective MBR) à l'offset 0x1C2 — ce disque utilise GPT. Le schéma de partitions réel est dans le GPT Header à LBA 1 (offset 512). Les autres entries sont vides.`;
      wrongExplain   = `Ce secteur IS un GPT : présence du type 0xEE (GPT Protective) à 0x1C2. Un MBR classique n'aurait jamais ce type ici.`;
    }

    // On affiche seulement les 64 derniers octets du secteur (0x1C0..0x1FF) — zone des partitions
    const partZone = sectorBytes.slice(0x1B0, 0x200); // 80 octets : 16 bytes clé + 4 entries + signature
    const dumpHTML = renderHexDump(
      [{ offset: '000001B0', bytes: partZone }],
      [
        { from: 0x1BE, to: 0x1CD, color: '--cyan',   label: 'Partition Entry 1 (16 o)' },
        { from: 0x1C2, to: 0x1C2, color: '--purple',  label: 'Type byte' },
        { from: 0x1FE, to: 0x1FF, color: '--gold',   label: 'Signature 0x55AA' },
      ],
      { cols: 16, title: 'Zone de partitions MBR (offset 0x1B0 → 0x1FF)' }
    );

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-mbr">💽</div>
        <div class="ex-title">MBR ou GPT ?</div>
        <span class="ex-badge medium">Type 0xEE · Protective MBR</span>
      </div>
      <div class="ex-scenario">
        Tu examines la <strong>zone de partitions</strong> du premier secteur d'un disque inconnu.<br>
        Ce secteur contient-il un <strong>MBR classique</strong> ou un <strong>Protective MBR (GPT)</strong> ?
      </div>
      ${dumpHTML}
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.6rem 1rem;margin-bottom:.75rem;font-size:.76rem;font-family:var(--mono)">
        <div style="margin-bottom:.3rem;color:var(--dim)">Indices de diagnostic :</div>
        <div>• Type byte <strong style="color:var(--purple)">0xEE</strong> à l'offset 0x1C2 = GPT Protective MBR → disque GPT</div>
        <div>• Tout autre type (0x07, 0x0B, 0x0C, 0x83…) = partition réelle → MBR classique</div>
        <div>• Signature <strong style="color:var(--gold)">55 AA</strong> @ offset 0x1FE présente dans les deux cas</div>
      </div>
      <div class="ex-input-row" style="gap:.5rem;flex-wrap:wrap" id="mbr-choices">
        <button class="tp-choice" style="flex:1;min-width:180px" data-correct="${!isGPT}" data-val="mbr">
          <span class="tp-choice-letter">A</span> MBR classique (partitions réelles)
        </button>
        <button class="tp-choice" style="flex:1;min-width:180px" data-correct="${isGPT}" data-val="gpt">
          <span class="tp-choice-letter">B</span> Protective MBR → disque GPT
        </button>
      </div>
      <div style="display:flex;gap:.5rem;margin:.5rem 0">
        <button class="btn-hint" id="btn-mbr-hint">💡 Indice</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-mbr" style="display:none"></div>
      <button class="btn-next" id="btn-next-mbr" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    let hintLevel = 0;
    const hints = [hint1Text, hint2Text];
    div.querySelector('#btn-mbr-hint').addEventListener('click', () => {
      markHintUsed();
      const fb = div.querySelector('#ex-feedback-mbr');
      fb.style.display = 'block'; fb.className = 'ex-feedback correct';
      fb.innerHTML = '💡 ' + hints[Math.min(hintLevel, hints.length-1)];
      hintLevel++;
    });
    div.querySelectorAll('#mbr-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        document.querySelectorAll('#mbr-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('mbr');
        const fb = div.querySelector('#ex-feedback-mbr');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        fb.innerHTML = formatChoiceFeedback(isOk, correctExplain, wrongExplain);
        div.querySelector('#btn-next-mbr').style.display = 'inline-block';
        div.querySelector('#ex-num-mbr').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }
}

// 23. DUMP HEX EN CONTEXTE — localiser + décoder un champ dans un secteur brut
// ═══════════════════════════════════════════════════════════════
//
// Principe : un vrai dump de 512 octets (secteur complet) est affiché.
// L'analyste doit (1) trouver l'offset d'un champ donné, (2) lire ses octets,
// (3) le décoder (LE, type, ASCII…).
// Indices progressifs sur 3 niveaux :
//   Niveau 1 — "Quel offset chercher ?"   (nom du champ + offset brut)
//   Niveau 2 — "Quels octets ?"           (octets bruts mis en évidence)
//   Niveau 3 — "Comment décoder ?"        (résultat intermédiaire + formule)
//
// Scénarios :
//   0 — FAT32 BPB : BytesPerSector @ 0x0B
//   1 — FAT32 BPB : SectorsPerCluster @ 0x0D
//   2 — FAT32 BPB : ReservedSectors @ 0x0E
//   3 — FAT32 BPB : NumFATs @ 0x10
//   4 — NTFS Boot : OEM ID @ 0x03 (ASCII)
//   5 — NTFS Boot : BytesPerSector @ 0x0B
//   6 — MBR       : Partition type byte @ 0x1C2
//   7 — MBR       : Boot signature @ 0x1FE
//   8 — EXT4 Superbloc : Magic @ 0x438 (0xEF53)
//   9 — FAT32 BPB : SectorsPerFAT @ 0x24 (extended BPB)
//
function genHexDump() {
  const scenario = rand(0, 12);

  const le16 = v => [v & 0xFF, (v>>8) & 0xFF];
  const le32 = v => [v & 0xFF,(v>>8)&0xFF,(v>>16)&0xFF,(v>>24)&0xFF];

  // ── Helpers hex ─────────────────────────────────────────────
  function bytesToHexStr(arr) {
    return arr.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ');
  }

  // ── Constructeurs de secteurs ────────────────────────────────

  function makeFAT32Sector() {
    const bps  = [512, 1024, 2048][rand(0,2)];
    const spc  = [2, 4, 8, 16][rand(0,3)];
    const rsvd = [32, 64][rand(0,1)];
    const nfats= 2;
    const spf  = rand(16, 128);   // SectorsPerFAT32 (extended)
    const b = new Array(512).fill(0);
    // Jump + OEM
    b[0]=0xEB; b[1]=0x58; b[2]=0x90;
    'MSWIN4.1'.split('').forEach((c,i)=>b[3+i]=c.charCodeAt(0));
    // BPB
    le16(bps).forEach((x,i)=>b[0x0B+i]=x);
    b[0x0D]=spc;
    le16(rsvd).forEach((x,i)=>b[0x0E+i]=x);
    b[0x10]=nfats;
    b[0x11]=0; b[0x12]=0;  // RootEntryCount=0 (FAT32)
    b[0x13]=0; b[0x14]=0;  // TotalSectors16=0
    b[0x15]=0xF8;
    b[0x16]=0; b[0x17]=0;  // FATSz16=0
    // Extended BPB FAT32 — SectorsPerFAT32 @ 0x24
    le32(spf).forEach((x,i)=>b[0x24+i]=x);
    // Signature
    b[510]=0x55; b[511]=0xAA;
    return { b, bps, spc, rsvd, nfats, spf };
  }

  function makeNTFSSector() {
    const bps = [512, 4096][rand(0,1)];
    const spc = [4, 8][rand(0,1)];
    const b = new Array(512).fill(0);
    b[0]=0xEB; b[1]=0x52; b[2]=0x90;
    'NTFS    '.split('').forEach((c,i)=>b[3+i]=c.charCodeAt(0));
    le16(bps).forEach((x,i)=>b[0x0B+i]=x);
    b[0x0D]=spc;
    b[510]=0x55; b[511]=0xAA;
    return { b, bps, spc };
  }

  function makeMBRSector() {
    const TYPES = [
      {byte:0x07, name:'NTFS / exFAT'},
      {byte:0x0B, name:'FAT32 (CHS)'},
      {byte:0x0C, name:'FAT32 (LBA)'},
      {byte:0x83, name:'Linux ext4'},
      {byte:0xEE, name:'GPT Protective'},
    ];
    const t = TYPES[rand(0,TYPES.length-1)];
    const lbaStart = rand(1, 32) * 2048;
    const b = new Array(512).fill(0);
    // Entry 1 @ 0x1BE
    b[0x1BE]=0x80;   // bootable
    b[0x1BF]=0xFE; b[0x1C0]=0xFF; b[0x1C1]=0xFF; // CHS begin
    b[0x1C2]=t.byte; // TYPE BYTE ← cible
    b[0x1C3]=0xFE; b[0x1C4]=0xFF; b[0x1C5]=0xFF; // CHS end
    le32(lbaStart).forEach((x,i)=>b[0x1C6+i]=x);  // LBA start
    le32(65536).forEach((x,i)=>b[0x1CA+i]=x);     // size
    // Signature
    b[510]=0x55; b[511]=0xAA;
    return { b, typeObj:t, lbaStart };
  }

  function makeEXT4Superbloc() {
    // Superbloc EXT4 : commence à offset 1024 dans le volume
    // On simule un secteur qui représente l'offset 0x400
    const b = new Array(512).fill(0);
    // Dans un superbloc, le magic 0xEF53 est à l'offset 0x38 DU superbloc
    // = offset 0x438 du volume, soit 0x38 dans notre fenêtre (offset de base 0x400)
    b[0x38]=0x53; b[0x39]=0xEF;  // magic LE
    b[0x18]=0x02; b[0x19]=0x00; b[0x1A]=0x00; b[0x1B]=0x00; // log_block_size=2 → 4096
    return { b };
  }

  // ── HFS+ Volume Header ─────────────────────────────────────
  // Volume Header = 1024 octets, démarre à offset 0x400 du volume.
  // Big Endian (Apple legacy). Signature 'H+' (0x482B) à offset 0x000.
  // version 4 (0x0004) à offset 0x002. blockSize uint32 BE @ 0x028.
  function makeHFSPlusVolumeHeader() {
    const b = new Array(512).fill(0);
    // Signature 'H+' BE
    b[0x00] = 0x48; b[0x01] = 0x2B;
    // Version 4 BE
    b[0x02] = 0x00; b[0x03] = 0x04;
    // Attributes (BE) @ 0x004 — kHFSVolumeJournaled = 0x00002000
    b[0x04] = 0x00; b[0x05] = 0x00; b[0x06] = 0x20; b[0x07] = 0x00;
    // lastMountedVersion = 'HFSJ' (journaling) @ 0x008
    'HFSJ'.split('').forEach((c, i) => b[0x08 + i] = c.charCodeAt(0));
    // blockSize = 4096 (0x00001000) en BE @ 0x028
    b[0x28] = 0x00; b[0x29] = 0x00; b[0x2A] = 0x10; b[0x2B] = 0x00;
    // totalBlocks BE @ 0x02C — par exemple 0x00100000 = 1M blocs
    b[0x2C] = 0x00; b[0x2D] = 0x10; b[0x2E] = 0x00; b[0x2F] = 0x00;
    return { b, blockSize: 4096, totalBlocks: 0x00100000 };
  }

  // ── exFAT Boot Sector ─────────────────────────────────────
  // exFAT : 512 octets, signature 'EXFAT   ' (8 octets ASCII) à offset 0x03.
  // VolumeSerialNumber uint32 LE @ 0x064.
  // Le FS est entièrement Little Endian.
  function makeExFATSector() {
    const b = new Array(512).fill(0);
    // Jump
    b[0] = 0xEB; b[1] = 0x76; b[2] = 0x90;
    // Signature 'EXFAT   ' (8 chars dont 3 espaces)
    'EXFAT   '.split('').forEach((c, i) => b[3 + i] = c.charCodeAt(0));
    // PartitionOffset (uint64 LE) @ 0x040 — placeholder
    b[0x40] = 0x00; b[0x41] = 0x08; b[0x42] = 0x00; b[0x43] = 0x00;
    // VolumeLength (uint64 LE) @ 0x048
    b[0x48] = 0x00; b[0x49] = 0x00; b[0x4A] = 0x10; b[0x4B] = 0x00;
    // VolumeSerialNumber (uint32 LE) @ 0x064 — valeur unique, ex 0xC1A2B3D4
    const serial = 0xC1A2B3D4;
    b[0x64] = serial & 0xFF;
    b[0x65] = (serial >> 8) & 0xFF;
    b[0x66] = (serial >> 16) & 0xFF;
    b[0x67] = (serial >> 24) & 0xFF;
    // FileSystemRevision (uint16) @ 0x068
    b[0x68] = 0x00; b[0x69] = 0x01;
    // BytesPerSectorShift @ 0x06C — 9 = 2^9 = 512 octets
    b[0x6C] = 0x09;
    // SectorsPerClusterShift @ 0x06D — 8 = 2^8 = 256 sectors
    b[0x6D] = 0x08;
    // Boot signature
    b[510] = 0x55; b[511] = 0xAA;
    return { b, serial };
  }

  // ── GPT Primary Header ─────────────────────────────────────
  // Le GPT Primary Header se trouve au LBA 1 (offset 0x200 du disque).
  // Signature 8 octets ASCII 'EFI PART' @ 0x000.
  // Revision uint32 LE @ 0x008. HeaderSize uint32 LE @ 0x00C.
  // CurrentLBA uint64 LE @ 0x018. NumberOfPartitionEntries uint32 LE @ 0x050.
  function makeGPTHeader() {
    const b = new Array(512).fill(0);
    // Signature 'EFI PART' (8 ASCII)
    'EFI PART'.split('').forEach((c, i) => b[i] = c.charCodeAt(0));
    // Revision 0x00010000 LE
    b[0x08] = 0x00; b[0x09] = 0x00; b[0x0A] = 0x01; b[0x0B] = 0x00;
    // HeaderSize 0x5C (92 octets) LE
    b[0x0C] = 0x5C; b[0x0D] = 0x00; b[0x0E] = 0x00; b[0x0F] = 0x00;
    // HeaderCRC32 placeholder
    b[0x10] = 0x12; b[0x11] = 0x34; b[0x12] = 0x56; b[0x13] = 0x78;
    // Reserved (4) @ 0x014
    // CurrentLBA = 1 (uint64 LE) @ 0x018
    b[0x18] = 0x01;
    // BackupLBA placeholder @ 0x020
    b[0x20] = 0xFF; b[0x21] = 0xFF; b[0x22] = 0xFF; b[0x23] = 0x00;
    // FirstUsableLBA = 34 LE @ 0x028
    b[0x28] = 0x22;
    // LastUsableLBA placeholder @ 0x030
    b[0x30] = 0xCE; b[0x31] = 0xFF; b[0x32] = 0xFF; b[0x33] = 0x00;
    // DiskGUID 16 octets @ 0x038 (placeholder)
    for (let i = 0; i < 16; i++) b[0x38 + i] = (i * 17) & 0xFF;
    // PartitionEntriesLBA = 2 LE @ 0x048
    b[0x48] = 0x02;
    // NumberOfPartitionEntries = 128 LE @ 0x050
    b[0x50] = 0x80; b[0x51] = 0x00; b[0x52] = 0x00; b[0x53] = 0x00;
    // SizeOfPartitionEntry = 128 LE @ 0x054
    b[0x54] = 0x80; b[0x55] = 0x00; b[0x56] = 0x00; b[0x57] = 0x00;
    return { b, numEntries: 128, sizeEntry: 128 };
  }

  // ── Scénario ─────────────────────────────────────────────────
  let sector, title, baseOffset;
  let qText, fieldName, fieldOffset, fieldLen, answerRaw, answerDisplay;
  let hints = [];            // 3 entrées
  let distFn;                // fonction qui génère 3 distracteurs
  let isQCM = true;          // tous sauf ASCII (OEM ID) sont QCM
  let highlightColor = '--cyan';

  // FAT32 scenarios
  if (scenario <= 3 || scenario === 9) {
    const fat = makeFAT32Sector();
    sector = fat.b;
    title  = 'Secteur de boot FAT32 (512 octets)';
    baseOffset = 0;

    if (scenario === 0) {
      fieldName   = 'BytesPerSector';
      fieldOffset = 0x0B;
      fieldLen    = 2;
      answerRaw   = fat.bps;
      answerDisplay = `${fat.bps}`;
      highlightColor = '--cyan';
      hints = [
        `<strong>BytesPerSector</strong> se trouve à l'offset <code>0x0B</code> dans le BPB FAT, sur <strong>2 octets en Little Endian</strong>.`,
        `Cherche l'offset <code>0x0B</code> dans le dump. Les 2 octets sont : <code style="color:var(--cyan)">${bytesToHexStr(sector.slice(0x0B,0x0D))}</code>`,
        `Inverse l'ordre (Little Endian) : <code>${bytesToHexStr(sector.slice(0x0B,0x0D).reverse())}</code> → décimal = <strong>${fat.bps}</strong> octets/secteur`,
      ];
      distFn = () => [512,1024,2048,4096].filter(v=>v!==fat.bps).slice(0,3);

    } else if (scenario === 1) {
      fieldName   = 'SectorsPerCluster';
      fieldOffset = 0x0D;
      fieldLen    = 1;
      answerRaw   = fat.spc;
      answerDisplay = `${fat.spc}`;
      highlightColor = '--green';
      hints = [
        `<strong>SectorsPerCluster</strong> est à l'offset <code>0x0D</code> — <strong>1 seul octet</strong>, pas de Little Endian à appliquer.`,
        `L'offset <code>0x0D</code> vaut : <code style="color:var(--green)">${bytesToHexStr([sector[0x0D]])}</code>`,
        `0x${sector[0x0D].toString(16).toUpperCase().padStart(2,'0')} en décimal = <strong>${fat.spc}</strong> secteur(s) par cluster`,
      ];
      distFn = () => [1,2,4,8,16,32].filter(v=>v!==fat.spc).slice(0,3);

    } else if (scenario === 2) {
      fieldName   = 'ReservedSectors';
      fieldOffset = 0x0E;
      fieldLen    = 2;
      answerRaw   = fat.rsvd;
      answerDisplay = `${fat.rsvd}`;
      highlightColor = '--gold';
      hints = [
        `<strong>ReservedSectors</strong> (secteurs réservés avant la première FAT) est à l'offset <code>0x0E</code>, sur <strong>2 octets Little Endian</strong>.`,
        `Offset <code>0x0E</code> : <code style="color:var(--gold)">${bytesToHexStr(sector.slice(0x0E,0x10))}</code> — inverse et convertis.`,
        `LE → ${fat.rsvd} secteurs réservés. Pour FAT32 cette valeur est souvent 32 ou 64.`,
      ];
      distFn = () => [8,16,32,64,128].filter(v=>v!==fat.rsvd).slice(0,3);

    } else if (scenario === 3) {
      fieldName   = 'NumFATs';
      fieldOffset = 0x10;
      fieldLen    = 1;
      answerRaw   = 2;
      answerDisplay = '2';
      highlightColor = '--purple';
      hints = [
        `<strong>NumFATs</strong> (nombre de copies de la FAT) est à l'offset <code>0x10</code> — <strong>1 octet</strong>.`,
        `Offset <code>0x10</code> : <code style="color:var(--purple)">${bytesToHexStr([sector[0x10]])}</code>`,
        `Presque toujours 2 — une copie principale + une copie de sauvegarde. Valeur ici = <strong>2</strong>.`,
      ];
      distFn = () => [1, 3, 4];

    } else { // scenario === 9 — SectorsPerFAT32
      fieldName   = 'SectorsPerFAT32';
      fieldOffset = 0x24;
      fieldLen    = 4;
      answerRaw   = fat.spf;
      answerDisplay = `${fat.spf}`;
      highlightColor = '--orange';
      hints = [
        `En FAT32, la taille de la FAT est dans le BPB étendu à l'offset <code>0x24</code>, sur <strong>4 octets Little Endian</strong> (FATSz32).`,
        `Offset <code>0x24</code> : <code style="color:var(--orange)">${bytesToHexStr(sector.slice(0x24,0x28))}</code> — inverse les 4 octets.`,
        `LE → 0x${fat.spf.toString(16).toUpperCase()} = <strong>${fat.spf}</strong> secteurs par FAT.`,
      ];
      distFn = () => [fat.spf+8, fat.spf-8, fat.spf*2].filter(v=>v!==fat.spf&&v>0).slice(0,3);
    }

  } else if (scenario === 4 || scenario === 5) {
    // NTFS scenarios
    const ntfs = makeNTFSSector();
    sector = ntfs.b;
    title  = 'Secteur de boot NTFS (512 octets)';
    baseOffset = 0;

    if (scenario === 4) {
      // OEM ID ASCII — saisie libre
      fieldName   = 'OEM ID (ASCII)';
      fieldOffset = 0x03;
      fieldLen    = 8;
      answerRaw   = 'NTFS    ';
      answerDisplay = 'NTFS    ';
      isQCM = false;
      highlightColor = '--purple';
      hints = [
        `L'<strong>OEM ID</strong> est à l'offset <code>0x03</code> — <strong>8 octets ASCII</strong> (les espaces comptent !).`,
        `Offset <code>0x03</code> sur 8 octets : <code style="color:var(--purple)">${bytesToHexStr(sector.slice(0x03,0x0B))}</code>`,
        `Converti ASCII : <strong>NTFS    </strong> (4 lettres + 4 espaces). La présence de "NTFS    " à cet offset identifie formellement ce FS.`,
      ];

    } else { // scenario === 5 — BPS NTFS
      fieldName   = 'BytesPerSector';
      fieldOffset = 0x0B;
      fieldLen    = 2;
      answerRaw   = ntfs.bps;
      answerDisplay = `${ntfs.bps}`;
      highlightColor = '--cyan';
      hints = [
        `<strong>BytesPerSector</strong> est à <code>0x0B</code> dans le BPB NTFS, sur <strong>2 octets Little Endian</strong> — même position que FAT.`,
        `Offset <code>0x0B</code> : <code style="color:var(--cyan)">${bytesToHexStr(sector.slice(0x0B,0x0D))}</code>`,
        `LE → <strong>${ntfs.bps}</strong> octets/secteur. Valeurs typiques : 512 (disques classiques) ou 4096 (Advanced Format).`,
      ];
      distFn = () => [512,1024,2048,4096].filter(v=>v!==ntfs.bps).slice(0,3);
    }

  } else if (scenario === 6 || scenario === 7) {
    // MBR scenarios
    const mbr = makeMBRSector();
    sector = mbr.b;

    if (scenario === 6) {
      title       = 'MBR — zone partitions (offset 0x1B0 → 0x1FF affiché)';
      baseOffset  = 0x1B0;
      fieldName   = 'Partition Type byte';
      fieldOffset = 0x1C2;
      fieldLen    = 1;
      answerRaw   = mbr.typeObj.byte;
      answerDisplay = `0x${mbr.typeObj.byte.toString(16).toUpperCase().padStart(2,'0')}`;
      highlightColor = '--purple';
      hints = [
        `Le <strong>type byte</strong> de la première partition entry est à l'offset absolu <code>0x1C2</code> dans le MBR (entry 1 commence à <code>0x1BE</code>, le type est son 5ème octet → <code>0x1BE + 0x04 = 0x1C2</code>).`,
        `Cherche la ligne <code>000001C0</code> dans le dump. Le type byte est à la colonne <code>02</code> de cette ligne.`,
        `Valeur : <code style="color:var(--purple)">${bytesToHexStr([mbr.typeObj.byte])}</code> = <strong>${mbr.typeObj.name}</strong>.`,
      ];
      // QCM : les choix sont des bytes hexadécimaux
      const ALL_TYPES = [0x07,0x0B,0x0C,0x83,0x82,0x05,0xEE,0xAB];
      distFn = () => ALL_TYPES.filter(v=>v!==mbr.typeObj.byte).sort(()=>Math.random()-.5).slice(0,3);

    } else { // scenario === 7 — signature boot
      title       = 'MBR — secteur complet (512 octets)';
      baseOffset  = 0;
      fieldName   = 'Signature de boot';
      fieldOffset = 0x1FE;
      fieldLen    = 2;
      answerRaw   = 0xAA55; // vu en BE sur le disque mais souvent dit "55 AA"
      answerDisplay = '55 AA';
      highlightColor = '--gold';
      isQCM = true;
      hints = [
        `La <strong>signature de boot</strong> est toujours aux 2 derniers octets d'un secteur de boot (offset <code>0x1FE–0x1FF</code>).`,
        `Cherche la toute dernière ligne du dump. Les 2 derniers octets sont : <code style="color:var(--gold)">${bytesToHexStr([sector[0x1FE],sector[0x1FF]])}</code>`,
        `<strong>55 AA</strong> = signature valide pour MBR, VBR, GPT. Sans elle, le BIOS refuse de booter ce secteur.`,
      ];
      distFn = () => ['AA 55','00 00','FF FF'];
    }

  } else if (scenario === 8) { // EXT4 magic
    const ext4 = makeEXT4Superbloc();
    sector = ext4.b;
    title  = 'Superbloc EXT4 (offset 0x400 du volume — 512 octets affichés)';
    baseOffset = 0x400;
    fieldName   = 'Magic EXT2/3/4';
    fieldOffset = 0x438;  // = baseOffset + 0x38
    fieldLen    = 2;
    answerRaw   = 0xEF53;
    answerDisplay = 'EF 53';
    highlightColor = '--green';
    hints = [
      `Le <strong>magic du superbloc EXT4</strong> est à l'offset absolu <code>0x438</code> dans le volume (superbloc à <code>0x400</code> + champ <code>s_magic</code> à <code>+0x38</code>), sur 2 octets Little Endian.`,
      `Dans ce dump (base <code>0x400</code>), cherche la ligne <code>00000430</code>, colonne <code>08–09</code> : <code style="color:var(--green)">${bytesToHexStr([sector[0x38],sector[0x39]])}</code>`,
      `LE → 0xEF53 — identifiant universel EXT2/3/4. La valeur brute est <strong>53 EF</strong> en mémoire (Little Endian).`,
    ];
    distFn = () => ['EF 53','53 EF','EF 00'].filter(v=>v!==answerDisplay).slice(0,3);

  } else if (scenario === 10) { // HFS+ Volume Header — signature
    const hfs = makeHFSPlusVolumeHeader();
    sector = hfs.b;
    title  = 'Volume Header HFS+ (offset 0x400 du volume — Big Endian)';
    baseOffset = 0x400;
    fieldName   = 'Signature HFS+';
    fieldOffset = 0x400;  // = baseOffset + 0x00
    fieldLen    = 2;
    answerDisplay = '48 2B';
    highlightColor = '--gold';
    hints = [
      `<strong>HFS+ (Apple)</strong> est <strong>Big Endian</strong> contrairement aux FS Windows. La <strong>signature</strong> est 'H+' = <code>0x482B</code> sur 2 octets, à l'<strong>offset 0x000 du Volume Header</strong> (= 0x400 du volume).`,
      `Lis les 2 premiers octets de la fenêtre : <code style="color:var(--gold)">${bytesToHexStr([sector[0],sector[1]])}</code>. En BE, lit dans l'ordre direct (octet de poids fort en premier).`,
      `'H' = 0x48, '+' = 0x2B → signature <strong>"H+"</strong>. La version (4) à l'offset 0x002 confirme HFS Plus (HFSX serait 0x0005).`,
    ];
    distFn = () => ['48 2B', '2B 48', '48 5A', 'EF 53'].filter(v => v !== answerDisplay).slice(0,3);

  } else if (scenario === 11) { // exFAT — VolumeSerialNumber
    const xfat = makeExFATSector();
    sector = xfat.b;
    title  = 'Boot Sector exFAT — 512 octets (Little Endian)';
    baseOffset = 0;
    fieldName   = 'VolumeSerialNumber';
    fieldOffset = 0x064;
    fieldLen    = 4;
    answerRaw   = xfat.serial;
    answerDisplay = '0x' + xfat.serial.toString(16).toUpperCase().padStart(8, '0');
    highlightColor = '--cyan';
    hints = [
      `Le <strong>VolumeSerialNumber</strong> exFAT identifie une partition de manière unique. Stocké sur 4 octets <strong>Little Endian</strong> à l'offset <code>0x064</code>. Utilisé pour distinguer 2 volumes formatés exFAT identiques.`,
      `À l'offset <code>0x064</code> de la fenêtre, lis 4 octets : <code style="color:var(--cyan)">${bytesToHexStr(sector.slice(0x64, 0x68))}</code>. Inverse l'ordre pour LE → BE.`,
      `LE octets ${bytesToHexStr(sector.slice(0x64, 0x68))} → 0x${xfat.serial.toString(16).toUpperCase().padStart(8,'0')} = <strong>${xfat.serial.toLocaleString('fr-CH')}</strong> en décimal.`,
    ];
    // Distracteurs : version BE (inversée) et autres serials plausibles
    const reversed = ((xfat.serial & 0xFF) << 24) | ((xfat.serial & 0xFF00) << 8) | ((xfat.serial & 0xFF0000) >>> 8) | ((xfat.serial >>> 24) & 0xFF);
    distFn = () => [
      '0x' + (reversed >>> 0).toString(16).toUpperCase().padStart(8, '0'),
      '0x' + ((xfat.serial + 0x10000) >>> 0).toString(16).toUpperCase().padStart(8, '0'),
      '0x00000000',
    ].filter(v => v !== answerDisplay).slice(0, 3);

  } else if (scenario === 12) { // GPT Primary Header — NumberOfPartitionEntries
    const gpt = makeGPTHeader();
    sector = gpt.b;
    title  = 'GPT Primary Header (LBA 1 = offset 0x200 du disque, 512 octets)';
    baseOffset = 0x200;
    fieldName   = 'NumberOfPartitionEntries';
    fieldOffset = 0x200 + 0x050;
    fieldLen    = 4;
    answerRaw   = gpt.numEntries;
    answerDisplay = `${gpt.numEntries}`;
    highlightColor = '--purple';
    hints = [
      `Le <strong>GPT Primary Header</strong> est au <strong>LBA 1</strong> (offset <code>0x200</code> du disque) — juste après le Protective MBR. La signature <code>'EFI PART'</code> à l'offset 0x000 le confirme. <strong>NumberOfPartitionEntries</strong> est un uint32 LE à l'offset <code>0x050</code> du header (= 0x250 du disque).`,
      `Cherche la ligne <code>00000250</code>, lis 4 octets : <code style="color:var(--purple)">${bytesToHexStr(sector.slice(0x50, 0x54))}</code>. Convertis en uint32 LE.`,
      `LE → 0x${gpt.numEntries.toString(16).toUpperCase().padStart(8,'0')} = <strong>${gpt.numEntries}</strong>. C'est le maximum d'entrées de partition réservées (typiquement 128 sur Windows/Linux/macOS, soit 16 KB pour la table à 128 octets/entrée).`,
    ];
    distFn = () => ['64', '256', '512', '1024'].filter(v => v !== answerDisplay).slice(0, 3);
  }

  // ── Construire les lignes du dump ────────────────────────────
  // On n'affiche pas les 512 octets entiers — on extrait une fenêtre pertinente
  // centrée sur le champ cible (max 8 lignes × 16 octets = 128 octets)
  const WIN = 128;   // octets à afficher
  const relOff = fieldOffset - baseOffset;  // offset du champ dans sector[]
  // Centrer la fenêtre sur le champ
  let winStart = Math.max(0, relOff - 48);
  winStart = winStart - (winStart % 16); // aligner sur 16
  const winEnd = Math.min(sector.length, winStart + WIN);
  const winBytes = sector.slice(winStart, winEnd);

  const dumpRows = [];
  for (let i = 0; i < winBytes.length; i += 16) {
    dumpRows.push({
      offset: (baseOffset + winStart + i).toString(16).toUpperCase().padStart(8,'0'),
      bytes:  winBytes.slice(i, i+16),
    });
  }

  // Highlight : offset absolu dans le buffer complet
  const hlFrom = fieldOffset;
  const hlTo   = fieldOffset + fieldLen - 1;

  const dumpHTML = renderHexDump(dumpRows,
    [{ from: hlFrom, to: hlTo, color: highlightColor, label: fieldName }],
    { cols: 16, title }
  );

  // ── Choix QCM ───────────────────────────────────────────────
  let choicesHTML = '';
  if (isQCM) {
    const dists = distFn();
    const allChoices = [answerDisplay, ...dists].sort(()=>Math.random()-.5);
    choicesHTML = `
      <div class="sec-title">Valeur du champ</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="hd-choices">
        ${allChoices.map(c => `<button class="tp-choice" style="flex:1;min-width:90px;font-family:var(--mono)"
            data-correct="${String(c) === String(answerDisplay)}">
            ${scenario === 7 || scenario === 6 || scenario === 8
              ? c   // déjà formaté hex
              : typeof c === 'number' ? c.toLocaleString('fr-CH') : c}
          </button>`).join('')}
      </div>`;
  } else {
    // Saisie libre pour OEM ID ASCII
    choicesHTML = `
      <div class="sec-title">Valeur ASCII du champ (8 caractères exacts)</div>
      <div class="ex-input-row" style="gap:.5rem">
        <input class="ex-input" id="hd-text-input" type="text" maxlength="8" placeholder="XXXXXXXX"
          style="font-family:var(--mono);letter-spacing:.1em;width:160px;text-transform:uppercase">
        <button class="btn-validate" id="hd-val-btn">Valider ✓</button>
        <button class="btn-next" id="btn-next-hd" onclick="newExercise()" style="display:none">Exercice suivant →</button>
      </div>`;
  }

  // ── Création du div ──────────────────────────────────────────
  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-hd">🔬</div>
      <div class="ex-title">Dump Hex en contexte — ${fieldName}</div>
      <span class="ex-badge medium">Localiser · Lire · Décoder</span>
    </div>
    <div class="ex-scenario">
      Tu as le dump brut d'un secteur ci-dessous.<br>
      <strong>Lis la valeur du champ <span style="color:var(${highlightColor})">${fieldName}</span>
      (mis en évidence) et décode-la.</strong>
    </div>
    ${dumpHTML}
    <div style="background:rgba(0,0,0,.28);border:1px solid var(--border);border-radius:8px;padding:.55rem .9rem;margin-bottom:.75rem;font-size:.76rem">
      <span style="color:var(--dim)">Champ cible : </span>
      <strong style="color:var(${highlightColor})">${fieldName}</strong>
      <span style="color:var(--dim)"> · offset absolu </span>
      <code>0x${fieldOffset.toString(16).toUpperCase()}</code>
      <span style="color:var(--dim)"> · ${fieldLen} octet${fieldLen>1?'s':''}</span>
      ${fieldLen > 1 && scenario !== 4 && scenario !== 7 && scenario !== 6 && scenario !== 8
        ? `<span style="color:var(--dim)"> · Little Endian</span>` : ''}
    </div>
    ${choicesHTML}
    <div style="display:flex;gap:.5rem;margin-bottom:.4rem" id="hd-hint-row">
      <button class="btn-hint" id="hd-hint-1">💡 Niveau 1 — Où chercher ?</button>
      <button class="btn-hint" id="hd-hint-2" style="opacity:.5" disabled>💡 Niveau 2 — Quels octets ?</button>
      <button class="btn-hint" id="hd-hint-3" style="opacity:.5" disabled>💡 Niveau 3 — Comment décoder ?</button>
    </div>
    <div class="ex-feedback" id="ex-feedback-hd" style="display:none"></div>
    ${isQCM ? `<button class="btn-next" id="btn-next-hd" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>` : ''}
  `;

  // ── Logique indices progressifs ──────────────────────────────
  function showHint(level, hintText) {
    markHintUsed();
    const fb = div.querySelector('#ex-feedback-hd');
    fb.style.display = 'block';
    fb.className = 'ex-feedback correct';
    fb.innerHTML = `<div style="font-size:.78rem;color:var(--dim);margin-bottom:.2rem">Indice niveau ${level} / 3</div>${hintText}`;
    // Déverrouiller le prochain niveau
    if (level < 3) {
      const next = div.querySelector(`#hd-hint-${level+1}`);
      if (next) { next.disabled = false; next.style.opacity = '1'; }
    }
    // Styler le niveau actif
    const cur = div.querySelector(`#hd-hint-${level}`);
    if (cur) cur.style.opacity = '.4';
  }

  div.querySelector('#hd-hint-1').addEventListener('click', () => showHint(1, hints[0]));
  div.querySelector('#hd-hint-2').addEventListener('click', () => showHint(2, hints[1]));
  div.querySelector('#hd-hint-3').addEventListener('click', () => showHint(3, hints[2]));

  // ── QCM handler ─────────────────────────────────────────────
  if (isQCM) {
    div.querySelectorAll('#hd-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#hd-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('hexdump');
        const fb = div.querySelector('#ex-feedback-hd');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explainFull = `${fieldName} @ 0x${fieldOffset.toString(16).toUpperCase()} = <strong style="color:var(${highlightColor})">${answerDisplay}</strong>. ${hints[2]}`;
        fb.innerHTML = formatChoiceFeedback(isOk, explainFull,
          `Mauvaise lecture. ${explainFull}`);
        div.querySelector('#btn-next-hd').style.display = 'inline-block';
        div.querySelector('#ex-num-hd').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
  } else {
    // Saisie libre OEM ID
    const validate = () => {
      const raw = div.querySelector('#hd-text-input').value.toUpperCase().padEnd(8,' ');
      const isOk = raw === answerDisplay;
      if (!isOk && !STATE.hintUsed) breakStreak();
      if (isOk && !STATE.hintUsed) incSolved('hexdump');
      const fb = div.querySelector('#ex-feedback-hd');
      fb.style.display = 'block';
      fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
      fb.innerHTML = isOk
        ? `✅ Correct ! OEM ID = <strong style="color:var(--purple)">"${answerDisplay}"</strong>. ${hints[2]}`
        : `❌ Valeur attendue : <strong>"${answerDisplay}"</strong> — 4 lettres + 4 espaces. ${hints[1]}`;
      div.querySelector('#btn-next-hd').style.display = 'inline-block';
      div.querySelector('#ex-num-hd').className = 'ex-num ' + (isOk ? 'solved' : 'error');
      div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
    };
    div.querySelector('#hd-val-btn').addEventListener('click', validate);
    div.querySelector('#hd-text-input').addEventListener('keydown', e => { if(e.key==='Enter') validate(); });
  }

  return div;
}

// ═══════════════════════════════════════════════════════════════
// Enregistrement dans le dispatcher GENERATORS
// ═══════════════════════════════════════════════════════════════
if (typeof GENERATORS !== 'undefined') {
  GENERATORS.endian    = genEndian;
  GENERATORS.timestamp = genTimestamp;
  GENERATORS.mbr       = genMBR;
  GENERATORS.hexdump   = genHexDump;
}
