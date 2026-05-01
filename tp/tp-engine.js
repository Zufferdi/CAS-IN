// ═══════════════════════════════════════════════════════════════════
// tp-engine.js — CAS-IN Travaux Pratiques
// Logique : STATE, générateurs, vérificateurs, UI
// Dépend de tp-data.js (chargé avant)
// ═══════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════
// ÉTAT GLOBAL
// ═══════════════════════════════════════════════════
const STATE = {
  cat: 'endian',
  solved: JSON.parse(localStorage.getItem('tp_solved') || '{}'),
  // { cat: count }
  total: {
    endian:0, timestamp:0, bitmap:0, fat:0, magic:0, mismatch:0,
    runlist:0, effacement:0, timestomping:0, hextable:0, fsidentify:0,
    offset:0, bases:0, hash:0, email:0, network:0, ir:0,
    droitpenal:0, glossaire:0, examen:0, mbr:0, direntry:0, hexdump:0, slackspace:0
  },
  hintUsed: false,
  // Gamification étendue
  streak:     parseInt(localStorage.getItem('tp_streak')     || '0', 10),
  bestStreak: parseInt(localStorage.getItem('tp_bestStreak') || '0', 10),
};

function saveState() {
  localStorage.setItem('tp_solved', JSON.stringify(STATE.solved));
  localStorage.setItem('tp_streak', String(STATE.streak));
  localStorage.setItem('tp_bestStreak', String(STATE.bestStreak));
}
function getSolved(cat) { return STATE.solved[cat] || 0; }
function getTotalSolved() { return Object.values(STATE.solved).reduce((a,b)=>a+(b||0),0); }
function incSolved(cat) {
  STATE.solved[cat] = (STATE.solved[cat]||0)+1;
  STATE.streak++;
  if (STATE.streak > STATE.bestStreak) STATE.bestStreak = STATE.streak;
  saveState();
  updateProgress();
}
function breakStreak() {
  if (STATE.streak > 0) {
    STATE.streak = 0;
    saveState();
    updateProgress();
  }
}

// ── Affichage du seuil de maîtrise (badge bronze/argent/or par catégorie)
function masteryBadge(n) {
  if (n >= 50) return '🥇';
  if (n >= 25) return '🥈';
  if (n >= 10) return '🥉';
  return '';
}

// ═══════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n, w, z='0') { return String(n).padStart(w, z); }

// ── Fix #1, #2 : Helpers d'échappement ────────────────────────
// Pour injecter du texte libre dans un attribut HTML entre doubles quotes.
function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
// Pour injecter du texte dans un attribut data-* ET pouvoir le relire sans surprise.
// On stocke en base64 des données JSON — aucun problème de quotes/doubles quotes/accolades/accents.
function encData(obj) {
  try {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch (_) { return ''; }
}
function decData(s) {
  try {
    const binary = atob(s);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (_) { return null; }
}
// Normalisation des réponses textuelles (accents insensibles, casse ignorée, espaces ignorés,
// zéros de padding tolérés dans les nombres : "04" ≡ "4")
function normAns(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // enlève diacritiques
    .replace(/\s+/g,'')                                  // compresse espaces
    .toUpperCase()
    .replace(/^0X/, '')
    .replace(/\b0+(\d)/g, '$1');                         // "04" → "4"
}

// ─── Helper unifié : feedback QCM avec « pourquoi c'est faux » + bonne réponse
// Tu m'as demandé : « Seulement la mauvaise réponse choisie + la bonne »
// → wrongExplain (en rouge) + correctExplain (en vert) si !isOk
// → seulement correctExplain (en vert) si isOk
function formatChoiceFeedback(isOk, correctExplain, wrongExplain, extraNote) {
  let html = isOk
    ? `✓ ${correctExplain}`
    : `✗ <strong style="color:var(--red)">Pourquoi ce choix est faux :</strong> ${wrongExplain}
       <div style="margin-top:.5rem;padding:.45rem .65rem;background:rgba(48,232,138,.06);border-left:3px solid var(--green);border-radius:5px;font-size:.78rem;color:var(--text)">
         <strong style="color:var(--green)">Réponse correcte :</strong> ${correctExplain}
       </div>`;
  if (extraNote) {
    html += `<div style="margin-top:.5rem;padding:.45rem .65rem;background:rgba(0,229,204,.05);border-radius:5px;font-size:.74rem;color:var(--cyan)">📌 ${extraNote}</div>`;
  }
  return html;
}

// ═══════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════
function switchCat(cat, btn) {
  STATE.cat = cat;
  STATE.hintUsed = false;
  document.querySelectorAll('.tp-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  updateProgress();
  newExercise();
}

function updateProgress() {
  const cat = STATE.cat;
  const solved = getSolved(cat);
  const total  = getTotalSolved();
  const medal  = masteryBadge(solved);
  const pt = document.getElementById('tp-progress-text');
  if (pt) pt.innerHTML =
    `Catégorie : <strong>${cat}</strong> · Total global : <strong>${total}</strong>` +
    (STATE.streak > 0 ? ` · 🔥 Série en cours : <strong>${STATE.streak}</strong>` : '') +
    (STATE.bestStreak > 0 ? ` · ⭐ Meilleur : ${STATE.bestStreak}` : '');
  const badge = document.getElementById('tp-score-badge');
  if (badge) badge.innerHTML = `${medal} ${solved} résolus ✅`;

  // Mettre à jour les onglets avec un petit compteur
  document.querySelectorAll('.tp-tab').forEach(t => {
    const c = t.dataset.cat;
    if (!c) return;
    const n = getSolved(c);
    // Supprimer ancien compteur s'il existe
    const old = t.querySelector('.tab-count');
    if (old) old.remove();
    if (n > 0) {
      const span = document.createElement('span');
      span.className = 'tab-count';
      span.textContent = n;
      span.style.cssText = 'margin-left:.35rem;padding:.05rem .4rem;border-radius:999px;background:rgba(48,232,138,.15);color:var(--green);font-size:.65rem;font-weight:700';
      t.appendChild(span);
    }
  });
}

function newExercise() {
  STATE.hintUsed = false;
  const gen = GENERATORS[STATE.cat];
  if (!gen) return;
  const ex = gen();
  document.getElementById('ex-container').innerHTML = '';
  document.getElementById('ex-container').appendChild(ex);
}

// ═══════════════════════════════════════════════════
// GÉNÉRATEURS D'EXERCICES
// ═══════════════════════════════════════════════════

const GENERATORS = {
  endian:      genEndian,
  timestamp:   genTimestamp,
  bitmap:      genBitmap,
  fat:         genFAT,
  magic:       genMagic,
  mismatch:    genMismatch,
  runlist:     genRunList,
  effacement:  genEffacement,
  timestomping:genTimestomping,
  hextable:    genHexTable,
  fsidentify:  genFSIdentify,
  offset:      genOffset,
  bases:       genBases,
  hash:        genHashIdentify,
  email:       genEmail,
  network:     genNetwork,
  ir:          genIR,
  droitpenal:  genDroitPenal,
  glossaire:   genGlossaire,
  examen:      genExamen,
  mbr:         genMBR,
  direntry:    genDirEntry,
  hexdump:     genHexDump,
  slackspace:  genSlackSpace,
  registry:    genRegistry,
  prefetch:    genPrefetch,
  lnk:         genLNK,
};

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

// ── 3. BITMAP exFAT / FAT ──────────────────────────
function genBitmap() {
  const numClusters = [8, 16, 32, 64][rand(0,3)];
  // Fix : borner occupiedCount à numClusters-1 pour éviter boucle infinie (bug original)
  const occupiedCount = rand(3, Math.min(10, numClusters - 1));
  const occupied = new Set();
  while (occupied.size < occupiedCount) occupied.add(rand(0, numClusters-1));
  const occupiedArr = [...occupied].sort((a,b)=>a-b);

  // Compute expected hex bytes
  const bytes = [];
  for (let i = 0; i < numClusters; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      if (occupied.has(i + b)) byte |= (1 << b); // LSB first
    }
    bytes.push(byte);
  }
  const expectedHex = bytes.map(b=>pad(b.toString(16).toUpperCase(),2)).join(' ');

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-bm">1</div>
      <div class="ex-title">Représentation d'une Bitmap d'allocation</div>
      <span class="ex-badge hard">hard</span>
    </div>
    <div class="ex-scenario">
      Sur un volume exFAT, la bitmap d'allocation indique que les clusters <strong>${occupiedArr.join(', ')}</strong> sont occupés (les autres sont libres).<br>
      Détermine la représentation hexadécimale des <strong>${Math.ceil(numClusters/8)} octets</strong> de bitmap.<br>
      <em style="color:var(--dim);font-size:.75rem">→ Clique les clusters occupés dans la grille pour les activer, puis valide.</em>
    </div>

    <div class="sec-title">Grille de clusters (clique sur chaque cluster occupé)</div>
    <div class="bitmap-grid" id="bm-grid"></div>
    <div style="display:flex;gap:1rem;margin:.5rem 0;font-size:.72rem;color:var(--dim);flex-wrap:wrap">
      <span>🔴 = occupé (bit 1)</span>
      <span>⬛ = libre (bit 0)</span>
      <span style="color:var(--dim)">LSB first : cluster 0 = bit 0 de l'octet 0</span>
    </div>

    <div class="sec-title">Résultat hexadécimal calculé</div>
    <div class="bm-hex-result" id="bm-hex-result">—</div>

    <div class="ex-input-row">
      <button class="btn-validate" onclick="checkBitmap('${expectedHex}')">Valider ✓</button>
      <button class="btn-next" id="btn-next-bm" onclick="newExercise()" style="display:none">Exercice suivant →</button>
    </div>
    <div class="ex-feedback" id="ex-feedback-bm"></div>
  `;

  // Fix #5 : grille TOUTE VIDE, à l'utilisateur de cliquer
  setTimeout(() => {
    const grid = document.getElementById('bm-grid');
    if (!grid) return;
    for (let i = 0; i < numClusters; i++) {
      const cell = document.createElement('div');
      cell.className = 'bm-cell free';  // ← toutes libres au départ
      cell.innerHTML = `<span>${i}</span><span class="bm-label">0</span>`;
      cell.onclick = () => {
        const isOcc = cell.classList.contains('occupied');
        cell.className = 'bm-cell ' + (isOcc ? 'free' : 'occupied');
        cell.querySelector('.bm-label').textContent = isOcc ? '0' : '1';
        updateBitmapResult();
      };
      grid.appendChild(cell);
    }
    updateBitmapResult();  // affiche "00 00..." au départ
  }, 50);
  return div;
}

function updateBitmapResult() {
  const cells = document.querySelectorAll('#bm-grid .bm-cell');
  const bytes = [];
  for (let i = 0; i < cells.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8 && (i+b) < cells.length; b++) {
      if (cells[i+b].classList.contains('occupied')) byte |= (1 << b);
    }
    bytes.push(pad(byte.toString(16).toUpperCase(),2));
  }
  const hexResult = document.getElementById('bm-hex-result');
  if (hexResult) hexResult.textContent = bytes.join(' ') || '—';
}

function checkBitmap(expected) {
  const fb = document.getElementById('ex-feedback-bm');
  const hexResult = document.getElementById('bm-hex-result');
  const current = (hexResult?.textContent || '').trim().toUpperCase();
  const expNorm = expected.trim().toUpperCase();

  if (current === expNorm) {
    document.querySelector('.btn-validate').disabled = true;
    document.getElementById('btn-next-bm').style.display = 'block';
    document.querySelector('.ex-card').className = 'ex-card solved';
    document.getElementById('ex-num-bm').className = 'ex-num solved';
    fb.className='ex-feedback correct';
    fb.innerHTML=`✓ Correct ! <span style="font-family:var(--mono);color:var(--cyan)">${expected}</span> — Bitmap maîtrisée.`;
    if (!STATE.hintUsed) incSolved(STATE.cat);
  } else {
    breakStreak();
    fb.className='ex-feedback wrong';
    fb.innerHTML=`✗ Valeur actuelle : <span style="font-family:var(--mono)">${current||'—'}</span><br>Attendu : <span style="font-family:var(--mono);color:var(--cyan)">${expNorm}</span><br>Rappel : bit 0 de l'octet 0 = cluster 0, bit 1 = cluster 1, etc. (LSB first). Clique chaque cluster occupé dans la grille.`;
  }
}

// ── 4. CHAÎNE FAT ──────────────────────────────────
function genFAT() {
  // Sous-types :
  //   0 — FAT32 : reconstruire la chaîne (existant, amélioré)
  //   1 — FAT16 : chaîne avec EOC 0xFFFF, valeurs 16 bits
  //   2 — Identifier un cluster défectueux (0xFFF7 / 0x0FFFFFF7)
  //   3 — Compter les clusters libres dans un extrait de FAT
  const subtype = rand(0, 3);

  // ── Helpers ──────────────────────────────────────────────────
  const isFAT16 = (subtype === 1);
  const EOC  = isFAT16 ? 0xFFFF    : 0x0FFFFFFF;
  const BAD  = isFAT16 ? 0xFFF7    : 0x0FFFFFF7;
  const FREE = 0x0000;
  const fmtEntry = (v) => isFAT16
    ? '0x' + pad(v.toString(16).toUpperCase(), 4)
    : '0x' + pad(v.toString(16).toUpperCase(), 8);

  function sigOf(v) {
    if (v === EOC)  return isFAT16 ? 'Fin de chaîne (EOC)' : 'Fin de chaîne (EOC)';
    if (v === BAD)  return '⚠ Cluster défectueux';
    if (v === FREE) return 'Cluster libre';
    return `→ cluster ${v}`;
  }
  function colorOf(isChain) { return isChain ? 'color:var(--cyan)' : ''; }

  // ── Sous-type 0 & 1 : reconstruction de chaîne ──────────────
  if (subtype <= 1) {
    const chainLen    = rand(3, 6);
    const startCluster= rand(2, 40);
    const chain = [startCluster];
    for (let i = 1; i < chainLen; i++) chain.push(chain[i-1] + rand(1, 4));

    const fatEntries = {};
    for (let i = 0; i < chain.length - 1; i++) fatEntries[chain[i]] = chain[i+1];
    fatEntries[chain[chain.length-1]] = EOC;

    // Leurres : clusters libres et un cluster hors-chaîne
    for (let i = 0; i < 4; i++) {
      const decoy = rand(2, 80);
      if (fatEntries[decoy] === undefined) fatEntries[decoy] = rand(2, 60);
    }

    const allClusters = [...new Set([...chain, ...Object.keys(fatEntries).map(Number)])].sort((a,b)=>a-b);

    const badge = isFAT16 ? 'FAT16 · EOC 0xFFFF · 16 bits' : 'FAT32 · EOC 0x0FFFFFFF · 32 bits';
    const title = isFAT16 ? 'Reconstruction d\'une chaîne FAT16' : 'Reconstruction d\'une chaîne FAT32';

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-fat">⛓</div>
        <div class="ex-title">${title}</div>
        <span class="ex-badge medium">${badge}</span>
      </div>
      <div class="ex-scenario">
        Dans une table ${isFAT16 ? 'FAT16' : 'FAT32'}, chaque entrée de
        <strong>${isFAT16 ? '2 octets (16 bits)' : '4 octets (32 bits)'}</strong>
        pointe vers le cluster suivant d'un fichier.<br>
        Reconstitue la chaîne complète à partir du cluster <strong>${startCluster}</strong>.<br>
        <em style="color:var(--dim);font-size:.78rem">
          ${fmtEntry(EOC)} = fin de chaîne (EOC) ·
          ${fmtEntry(FREE)} = cluster libre
          ${isFAT16 ? '· ' + fmtEntry(BAD) + ' = défectueux' : ''}
        </em>
      </div>
      <div class="sec-title">Table FAT${isFAT16?'16':'32'} (extrait)</div>
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:1rem">
        <div style="display:grid;grid-template-columns:auto auto auto;font-size:.78rem;font-family:var(--mono)">
          <div style="padding:.4rem .75rem;background:var(--surface2);color:var(--dim);font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">Cluster</div>
          <div style="padding:.4rem .75rem;background:var(--surface2);color:var(--dim);font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">Entrée FAT</div>
          <div style="padding:.4rem .75rem;background:var(--surface2);color:var(--dim);font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">Signification</div>
          ${allClusters.map(c => {
            const entry   = fatEntries[c] !== undefined ? fatEntries[c] : FREE;
            const isChain = chain.includes(c);
            return `<div style="padding:.35rem .75rem;border-bottom:1px solid rgba(255,255,255,.04);${colorOf(isChain)}">${c}</div>
                    <div style="padding:.35rem .75rem;border-bottom:1px solid rgba(255,255,255,.04);${colorOf(isChain)}">${fmtEntry(entry)}</div>
                    <div style="padding:.35rem .75rem;border-bottom:1px solid rgba(255,255,255,.04);color:var(--dim);font-size:.72rem">${sigOf(entry)}</div>`;
          }).join('')}
        </div>
      </div>
      <div class="ex-input-row">
        <span class="ex-input-label">Chaîne (clusters séparés par →) :</span>
        <input class="ex-input" id="ans-fat" placeholder="${chain[0]} → ${chain[1]} → … → EOC" style="min-width:200px" autocomplete="off">
      </div>
      <div class="ex-input-row" style="margin-top:.5rem">
        <button class="btn-hint" id="fat-hint-btn">💡 Indice</button>
        <button class="btn-validate" id="fat-val-btn">Valider ✓</button>
        <button class="btn-next" id="btn-next-fat" onclick="newExercise()" style="display:none">Exercice suivant →</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-fat" style="display:none"></div>
    `;

    div.querySelector('#fat-hint-btn').addEventListener('click', () => {
      markHintUsed();
      const fb = div.querySelector('#ex-feedback-fat');
      fb.style.display = 'block'; fb.className = 'ex-feedback correct';
      fb.innerHTML = `💡 Commence au cluster <strong>${startCluster}</strong>. Lis son entrée → cluster suivant. Continue jusqu'à ${fmtEntry(EOC)}.
        <br>Premiers pas : ${startCluster} → ${fatEntries[startCluster]} → ...`;
    });

    const validate = () => {
      const inp = div.querySelector('#ans-fat');
      const raw = inp.value.replace(/[^0-9\s,→\-]/g, '');
      const parsed = raw.split(/[\s,→\-]+/).map(Number).filter(n => !isNaN(n) && n > 0);
      const isOk = parsed.length === chain.length && parsed.every((v,i) => v === chain[i]);
      if (!isOk) { breakStreak(); }
      else if (!STATE.hintUsed) incSolved('fat');
      const fb = div.querySelector('#ex-feedback-fat');
      fb.style.display = 'block';
      fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
      fb.innerHTML = isOk
        ? `✅ Correct ! Chaîne : <span style="font-family:var(--mono);color:var(--cyan)">${chain.join(' → ')} → EOC</span>`
        : `❌ Incorrect. Saisi : <span style="font-family:var(--mono)">${parsed.join(' → ') || '—'}</span><br>Suis chaque entrée depuis le cluster ${startCluster} jusqu'à ${fmtEntry(EOC)}.`;
      div.querySelector('#btn-next-fat').style.display = 'inline-block';
      div.querySelector('#ex-num-fat').className = 'ex-num ' + (isOk ? 'solved' : 'error');
      div.querySelector('.ex-card').className = 'ex-card ' + (isOk ? 'solved' : 'error');
    };
    div.querySelector('#fat-val-btn').addEventListener('click', validate);
    setTimeout(() => { div.querySelector('#ans-fat')?.addEventListener('keydown', e => { if(e.key==='Enter') validate(); }); }, 50);
    return div;
  }

  // ── Sous-type 2 : identifier un cluster défectueux ───────────
  if (subtype === 2) {
    // Construire un extrait FAT32 avec 1 cluster BAD parmi des clusters libres et normaux
    const badCluster  = rand(5, 20);
    const chainCluster= rand(21, 35);
    const nextCluster = chainCluster + rand(1, 3);

    const tableData = [];
    for (let c = 2; c <= 30; c++) {
      let val, meaning, isBad = false, isHighlight = false;
      if (c === badCluster)   { val = 0x0FFFFFF7; meaning = '???'; isBad = true; isHighlight = true; }
      else if (c === chainCluster) { val = nextCluster; meaning = `→ cluster ${nextCluster}`; isHighlight = true; }
      else if (c === nextCluster)  { val = 0x0FFFFFFF; meaning = 'EOC'; isHighlight = true; }
      else val = 0x00000000, meaning = 'Libre';
      tableData.push({ c, val, meaning, isBad, isHighlight });
    }

    const choices = [
      { val: 'bad',    label: `Cluster défectueux (bad sector) — ${fmtEntry(0x0FFFFFF7)}`, correct: true },
      { val: 'free',   label: `Cluster libre — ${fmtEntry(0x00000000)}`,                  correct: false },
      { val: 'eoc',    label: `Fin de chaîne (EOC) — ${fmtEntry(0x0FFFFFFF)}`,            correct: false },
      { val: 'chain',  label: `Pointeur vers le cluster suivant`,                          correct: false },
    ].sort(() => Math.random() - .5);

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-fat">⛓</div>
        <div class="ex-title">FAT32 — Valeur spéciale : cluster défectueux</div>
        <span class="ex-badge hard">FAT32 · 0x0FFFFFF7 · Bad Cluster</span>
      </div>
      <div class="ex-scenario">
        Dans l'extrait de FAT32 ci-dessous, le cluster <strong>${badCluster}</strong>
        contient la valeur <strong style="color:var(--red)">${fmtEntry(0x0FFFFFF7)}</strong>.<br>
        Que signifie cette valeur ?
      </div>
      <div class="sec-title">Extrait FAT32 (cluster ${badCluster} mis en évidence)</div>
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:1rem;max-height:280px;overflow-y:auto">
        <div style="display:grid;grid-template-columns:auto auto auto;font-size:.75rem;font-family:var(--mono)">
          <div style="padding:.3rem .75rem;background:var(--surface2);color:var(--dim);font-size:.65rem;text-transform:uppercase;border-bottom:1px solid var(--border)">Cluster</div>
          <div style="padding:.3rem .75rem;background:var(--surface2);color:var(--dim);font-size:.65rem;text-transform:uppercase;border-bottom:1px solid var(--border)">Entrée FAT32</div>
          <div style="padding:.3rem .75rem;background:var(--surface2);color:var(--dim);font-size:.65rem;text-transform:uppercase;border-bottom:1px solid var(--border)">Rôle</div>
          ${tableData.map(({c, val, meaning, isBad, isHighlight}) => {
            const style = isBad
              ? 'color:var(--red);background:rgba(255,64,96,.08);font-weight:700'
              : isHighlight ? 'color:var(--cyan)' : 'color:var(--dim)';
            return `<div style="padding:.3rem .75rem;border-bottom:1px solid rgba(255,255,255,.04);${style}">${c}${isBad?' ◄':''}</div>
                    <div style="padding:.3rem .75rem;border-bottom:1px solid rgba(255,255,255,.04);${style}">${fmtEntry(val)}</div>
                    <div style="padding:.3rem .75rem;border-bottom:1px solid rgba(255,255,255,.04);${style};font-size:.68rem">${meaning}</div>`;
          }).join('')}
        </div>
      </div>
      <div class="sec-title">Signification de ${fmtEntry(0x0FFFFFF7)}</div>
      <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="fat-choices">
        ${choices.map(c => `
          <button class="tp-choice" data-correct="${c.correct}" style="text-align:left">
            <span class="tp-choice-letter" style="font-family:var(--mono);min-width:30px">${c.correct?'✓':'·'}</span>
            ${c.label}
          </button>`).join('')}
      </div>
      <div style="display:flex;gap:.5rem;margin-bottom:.4rem">
        <button class="btn-hint" id="fat-hint-btn">💡 Indice</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-fat" style="display:none"></div>
      <button class="btn-next" id="btn-next-fat" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#fat-hint-btn').addEventListener('click', () => {
      markHintUsed();
      const fb = div.querySelector('#ex-feedback-fat');
      fb.style.display = 'block'; fb.className = 'ex-feedback correct';
      fb.innerHTML = `💡 Mémo des valeurs FAT32 spéciales :<br>
        <span style="font-family:var(--mono);font-size:.76rem">
        0x00000000 = libre · 0x0FFFFFF7 = <strong>bad cluster</strong> · 0x0FFFFFF8–0x0FFFFFFF = EOC
        </span>`;
    });

    div.querySelectorAll('#fat-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#fat-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('fat');
        const fb = div.querySelector('#ex-feedback-fat');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        fb.innerHTML = isOk
          ? `✅ Correct ! <code>0x0FFFFFF7</code> = <strong>cluster défectueux</strong> (bad cluster). L'OS marque ce cluster et ne l'alloue plus. Les données qui y étaient sont perdues. En FAT16 : <code>0xFFF7</code>.`
          : `❌ Incorrect. <code>0x0FFFFFF7</code> = cluster défectueux — l'OS le détecte via CHKDSK ou lors du formatage et le marque pour ne plus l'utiliser.`;
        div.querySelector('#btn-next-fat').style.display = 'inline-block';
        div.querySelector('#ex-num-fat').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.querySelector('.ex-card').className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 3 : compter les clusters libres ────────────────
  {
    // Petit extrait de FAT32 (10–16 entrées) mélant libres, chaînes et EOC
    const total   = rand(10, 16);
    const start   = rand(2, 10);
    const freeCount = rand(3, Math.floor(total / 2));
    const entries = [];
    const freeSet = new Set();

    // Choisir aléatoirement les clusters libres
    while (freeSet.size < freeCount) freeSet.add(rand(0, total - 1));

    // Construire les entrées
    for (let i = 0; i < total; i++) {
      const c = start + i;
      if (freeSet.has(i)) { entries.push({ c, val: 0x00000000, meaning: 'Libre' }); }
      else {
        const next = start + i + rand(1, 3);
        const isLast = i === total - 1 || (!freeSet.has(i+1) && rand(0,1));
        const val = isLast ? 0x0FFFFFFF : Math.min(next, start + total - 1);
        entries.push({ c, val, meaning: val === 0x0FFFFFFF ? 'EOC' : `→ ${val}` });
      }
    }

    const answer = freeCount;
    const distractors = [answer + 1, answer - 1, answer + 2].filter(v => v !== answer && v >= 0);
    const choices = [answer, ...distractors].sort(() => Math.random() - .5);

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-fat">⛓</div>
        <div class="ex-title">FAT32 — Compter les clusters libres</div>
        <span class="ex-badge easy">FAT32 · 0x00000000 · Espace libre</span>
      </div>
      <div class="ex-scenario">
        Dans l'extrait de FAT32 ci-dessous, identifie les clusters dont l'entrée vaut
        <strong style="color:var(--green)">0x00000000</strong> (cluster libre).<br>
        <strong>Combien de clusters libres y a-t-il dans cet extrait ?</strong>
      </div>
      <div class="sec-title">Extrait FAT32 (clusters ${start}–${start+total-1})</div>
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:1rem">
        <div style="display:grid;grid-template-columns:auto auto auto;font-size:.75rem;font-family:var(--mono)">
          <div style="padding:.3rem .75rem;background:var(--surface2);color:var(--dim);font-size:.65rem;text-transform:uppercase;border-bottom:1px solid var(--border)">Cluster</div>
          <div style="padding:.3rem .75rem;background:var(--surface2);color:var(--dim);font-size:.65rem;text-transform:uppercase;border-bottom:1px solid var(--border)">Entrée FAT32</div>
          <div style="padding:.3rem .75rem;background:var(--surface2);color:var(--dim);font-size:.65rem;text-transform:uppercase;border-bottom:1px solid var(--border)">État</div>
          ${entries.map(({c, val, meaning}) => {
            const isFree = val === 0x00000000;
            const style  = isFree ? 'color:var(--green)' : val === 0x0FFFFFFF ? 'color:var(--gold)' : 'color:var(--cyan)';
            return `<div style="padding:.3rem .75rem;border-bottom:1px solid rgba(255,255,255,.04);${style}">${c}</div>
                    <div style="padding:.3rem .75rem;border-bottom:1px solid rgba(255,255,255,.04);${style}">${fmtEntry(val)}</div>
                    <div style="padding:.3rem .75rem;border-bottom:1px solid rgba(255,255,255,.04);${style};font-size:.68rem">${meaning}</div>`;
          }).join('')}
        </div>
      </div>
      <div class="sec-title">Nombre de clusters libres</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="fat-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:60px;font-family:var(--mono)"
            data-correct="${c === answer}">${c}</button>`).join('')}
      </div>
      <div style="display:flex;gap:.5rem;margin-bottom:.4rem">
        <button class="btn-hint" id="fat-hint-btn">💡 Indice</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-fat" style="display:none"></div>
      <button class="btn-next" id="btn-next-fat" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#fat-hint-btn').addEventListener('click', () => {
      markHintUsed();
      const fb = div.querySelector('#ex-feedback-fat');
      fb.style.display = 'block'; fb.className = 'ex-feedback correct';
      const freeClusters = entries.filter(e => e.val === 0).map(e => e.c);
      fb.innerHTML = `💡 Les clusters libres ont la valeur <code>0x00000000</code>.<br>
        Clusters libres dans cet extrait : <strong>${freeClusters.join(', ')}</strong> → total = <strong>${freeCount}</strong>`;
    });

    div.querySelectorAll('#fat-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#fat-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('fat');
        const fb = div.querySelector('#ex-feedback-fat');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const freeClusters = entries.filter(e => e.val === 0).map(e => e.c);
        fb.innerHTML = isOk
          ? `✅ Correct ! ${freeCount} cluster(s) libre(s) : clusters ${freeClusters.join(', ')}.`
          : `❌ Incorrect. Clusters libres (0x00000000) : ${freeClusters.join(', ')} → ${freeCount} au total.`;
        div.querySelector('#btn-next-fat').style.display = 'inline-block';
        div.querySelector('#ex-num-fat').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.querySelector('.ex-card').className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }
}

// ── 5. MAGIC BYTES ─────────────────────────────────
// [MAGIC_DB chargé depuis tp-data.js]
function genMagic() {
  const entry = MAGIC_DB[rand(0, MAGIC_DB.length-1)];
  const sigBytes = entry.sig.split(' ');

  // Add decoy bytes after the signature
  const fullBytes = [...sigBytes];
  while (fullBytes.length < 12) fullBytes.push(pad(rand(0,255).toString(16).toUpperCase(),2));

  // Bug fix : filtrer par SIGNATURE (et non par ext) — sinon zip et docx
  // peuvent apparaître ensemble alors qu'ils partagent 50 4B 03 04, et la
  // « bonne » réponse devient ambiguë. On exclut tout ce qui partage le préfixe.
  const decoys = MAGIC_DB
    .filter(e => e.sig !== entry.sig && !e.sig.startsWith(entry.sig) && !entry.sig.startsWith(e.sig))
    .sort(()=>Math.random()-.5)
    .slice(0,3);
  const options = [entry, ...decoys].sort(()=>Math.random()-.5);

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-mg">1</div>
      <div class="ex-title">Identification par Magic Bytes</div>
      <span class="ex-badge easy">easy</span>
    </div>
    <div class="ex-scenario">
      Lors d'une acquisition, X-Ways affiche les premiers octets d'un fichier dont l'extension a été modifiée.<br>
      Identifie le type réel de ce fichier à partir de sa <strong>signature hexadécimale</strong>.
    </div>

    <div class="sec-title">Premiers octets du fichier</div>
    <div class="hex-display">
      ${fullBytes.map((b,i) => `<span class="hex-byte ${i < sigBytes.length ? 'highlight' : 'dim-byte'}" title="${i < sigBytes.length ? 'Octet de signature' : 'Données'}">
        ${b}</span>`).join('')}
    </div>
    <div style="font-size:.72rem;color:var(--dim);margin-bottom:.75rem">
      <span style="color:var(--gold)">■</span> = octets de signature · <span style="color:var(--dim)">■</span> = données (ignorées pour l'identification)
    </div>

    <div class="sec-title">Quel est ce type de fichier ?</div>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="magic-choices">
      ${options.map((o,i) => `
        <button class="tp-choice" onclick="checkMagic(${i}, ${options.indexOf(entry)}, this)">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span><strong style="color:var(--cyan)">.${o.ext}</strong> — ${o.desc}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-mg"></div>
    <button class="btn-next" id="btn-next-mg" onclick="newExercise()" style="margin-top:.5rem">Exercice suivant →</button>
  `;
  _magicNotes = options.map(o => o.note);
  return div;
}// Les notes sont stockées dans _magicNotes par genMagic()
let _magicNotes = [];

function checkMagic(chosen, correct, btn) {
  const choices = document.querySelectorAll('#magic-choices button');
  if (choices.length && choices[0].disabled) return;
  choices.forEach((b,i) => {
    b.disabled = true;
    if (i === correct) { b.style.borderColor='var(--green)'; b.style.background='rgba(48,232,138,.1)'; }
    else if (i === chosen && chosen !== correct) { b.style.borderColor='var(--red)'; b.style.background='rgba(255,64,96,.08)'; }
  });
  const ok = chosen === correct;
  const noteCorrect = _magicNotes[correct] || '';
  const noteChosen  = _magicNotes[chosen]  || '';
  const fb = document.getElementById('ex-feedback-mg');
  fb.className = 'ex-feedback ' + (ok ? 'correct' : 'wrong');
  fb.innerHTML = formatChoiceFeedback(ok, noteCorrect, noteChosen);
  document.querySelector('.ex-card').className = 'ex-card ' + (ok ? 'solved' : 'error');
  document.getElementById('ex-num-mg').className = 'ex-num ' + (ok ? 'solved' : 'error');
  document.getElementById('btn-next-mg').style.display = 'block';
  if (ok && !STATE.hintUsed) incSolved(STATE.cat);
  else if (!ok) breakStreak();
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  newExercise();
});


// ═══════════════════════════════════════════════════
// 6. SIGNATURE MISMATCH (File Carving)
// ═══════════════════════════════════════════════════

// [MISMATCH_DB chargé depuis tp-data.js]
let _mismatchAnswered = false;

function genMismatch() {
  _mismatchAnswered = false;
  const items = [...MISMATCH_DB].sort(() => Math.random() - .5).slice(0, 5);

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-mm">🎭</div>
      <div class="ex-title">Identification par Signature — Extension Trompeuse</div>
      <span class="ex-badge medium">medium</span>
    </div>
    <div class="ex-scenario">
      Lors d'une acquisition, tu analyses un répertoire contenant des fichiers suspects.<br>
      Plusieurs fichiers ont des <strong>extensions ne correspondant pas</strong> à leurs premiers octets (magic bytes).<br>
      Pour chacun, identifie le <strong>vrai type</strong> du fichier.
    </div>

    <div class="sec-title" style="margin-top:.75rem">Fichiers à analyser</div>
    <div id="mm-items">
      ${items.map((item, i) => `
        <div class="mm-row" id="mm-row-${i}" style="margin-bottom:.75rem;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:.85rem 1rem;transition:.2s">
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.6rem;flex-wrap:wrap">
            <span style="font-family:var(--mono);font-size:.85rem;font-weight:700;color:var(--text)">📄 ${escAttr(item.fake)}</span>
            <div class="hex-display" style="margin:0;padding:.3rem .6rem;flex:1;min-width:160px">
              ${item.bytes.split(' ').map(b => `<span class="hex-byte" style="font-size:.8rem;padding:.25rem .45rem">${b}</span>`).join('')}
            </div>
          </div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap" id="mm-choices-${i}">
            ${buildMismatchChoices(item, i, items)}
          </div>
          <div class="ex-feedback" id="mm-fb-${i}"></div>
        </div>`).join('')}
    </div>
    <div style="margin-top:.75rem;display:flex;gap:.6rem">
      <button class="btn-next" id="btn-next-mm" onclick="newExercise()" style="display:none">Exercice suivant →</button>
    </div>
  `;
  // Fix #1 : event delegation plutôt qu'onclick inline (évite les bugs d'escape de quotes)
  setTimeout(() => {
    div.querySelectorAll('.mm-choice-btn').forEach(b => {
      b.addEventListener('click', () => {
        const data = decData(b.dataset.meta);
        if (!data) return;
        checkMismatch(b, data.correct, data.sig_name, data.note);
      });
    });
  }, 0);
  return div;
}

function buildMismatchChoices(item, idx, allItems) {
  // 4 choix : le bon + 3 distracteurs
  const correct = item.real;
  const pool = MISMATCH_DB.map(d => d.real).filter(r => r !== correct);
  const shuffled = pool.sort(() => Math.random() - .5).slice(0, 3);
  const options = [...new Set([correct, ...shuffled])].slice(0, 4).sort(() => Math.random() - .5);

  return options.map((opt, i) => {
    const isCorrect = opt === correct;
    // Fix #1 : stocker les données en base64 JSON dans data-meta (pas de problème de quotes)
    const meta = encData({
      correct: isCorrect,
      sig_name: item.sig_name,
      note: item.note,
    });
    return `<button class="mm-choice-btn" data-correct="${isCorrect}" data-row="${idx}" data-meta="${meta}"
      style="padding:.4rem .85rem;border-radius:6px;border:1px solid var(--border);background:rgba(255,255,255,.03);
             color:var(--dim);font-size:.76rem;font-family:var(--mono);cursor:pointer;transition:.15s;white-space:nowrap">
      .${escAttr(opt.replace(/\//g,' / '))}
    </button>`;
  }).join('');
}

function checkMismatch(btn, isCorrect, sigName, note) {
  const rowIdx = btn.dataset.row;
  const row = document.getElementById('mm-row-' + rowIdx);
  if (!row || row.dataset.answered) return;
  row.dataset.answered = '1';

  const isOk = isCorrect === true || isCorrect === 'true';
  const allBtns = row.querySelectorAll('.mm-choice-btn');

  allBtns.forEach(b => {
    b.disabled = true;
    b.style.cursor = 'default';
    if (b.dataset.correct === 'true') {
      b.style.borderColor = 'var(--green)';
      b.style.background  = 'rgba(48,232,138,.12)';
      b.style.color       = 'var(--green)';
    } else if (b === btn && !isOk) {
      b.style.borderColor = 'var(--red)';
      b.style.background  = 'rgba(255,64,96,.1)';
      b.style.color       = 'var(--red)';
    }
  });

  row.style.borderColor = isOk ? 'rgba(48,232,138,.4)' : 'rgba(255,64,96,.3)';

  const fb = document.getElementById('mm-fb-' + rowIdx);
  fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
  fb.innerHTML = (isOk ? '✓ ' : '✗ ') + '<strong>' + escAttr(sigName) + '</strong> — ' + escAttr(note);

  if (!isOk) breakStreak();

  // Vérifier si tout est répondu
  const rowsAnswered = document.querySelectorAll('.mm-row[data-answered]');
  const total = document.querySelectorAll('.mm-row').length;
  if (rowsAnswered.length >= total) {
    document.getElementById('btn-next-mm').style.display = 'block';
    // Compter précisément les rangées résolues correctement via dataset.answered et data-correct
    let correctCount = 0;
    document.querySelectorAll('.mm-row').forEach(r => {
      // La rangée est résolue correctement si aucun bouton n'est marqué rouge
      const red = r.querySelector('.mm-choice-btn[data-correct="false"][style*="--red"]');
      if (!red) correctCount++;
    });
    if (correctCount >= total) incSolved(STATE.cat);
  }
}

// ═══════════════════════════════════════════════════
// 7. RUN LIST NTFS
// ═══════════════════════════════════════════════════

function genRunList() {
  // Générer une Run List aléatoire avec 1 à 3 fragments
  const numFragments = rand(1, 3);
  const fragments = [];

  let prevLCN = 0;
  for (let i = 0; i < numFragments; i++) {
    const length  = rand(1, 40);      // clusters du fragment
    const offset  = rand(1, 200);     // delta LCN
    const lcn     = prevLCN + offset;
    prevLCN = lcn;
    fragments.push({ length, delta: offset, lcn });
  }

  // Encoder chaque fragment en bytes Run List NTFS
  // Header byte : nibble haut = taille delta, nibble bas = taille longueur
  const encodedFragments = fragments.map(f => {
    const lenBytes  = encodeVarInt(f.length);
    const deltaBytes = encodeSignedVarInt(f.delta);
    const headerByte = ((deltaBytes.length << 4) | lenBytes.length);
    return {
      ...f,
      headerByte,
      lenBytes,
      deltaBytes,
      raw: [headerByte, ...lenBytes, ...deltaBytes],
    };
  });

  // Construire la séquence hex complète
  const allBytes = [...encodedFragments.flatMap(f => f.raw), 0x00]; // 0x00 = terminaison
  const hexStr = allBytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ');

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-rl">🧩</div>
      <div class="ex-title">Décodage d'une Run List NTFS</div>
      <span class="ex-badge hard">hard</span>
    </div>
    <div class="ex-scenario">
      Dans un attribut <strong>$DATA</strong> d'un enregistrement MFT, tu trouves cette séquence de Run List.<br>
      Décode <strong>chaque fragment</strong> : nombre de clusters alloués et LCN de départ.<br>
      <em style="color:var(--dim);font-size:.78rem">Format : [Header][Length][Delta] · 0x00 = fin · LCN delta = relatif au fragment précédent</em>
    </div>

    <div class="sec-title">Séquence Run List</div>
    <div class="hex-display" style="margin-bottom:1rem">
      ${buildRunListHex(encodedFragments, allBytes)}
    </div>

    <div class="sec-title">Structure du Header Byte</div>
    <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem;margin-bottom:1rem;font-family:var(--mono);font-size:.8rem">
      <div style="margin-bottom:.4rem"><span style="color:var(--purple);font-weight:700">Nibble haut (bits 7-4)</span> = nombre d'octets pour le delta LCN</div>
      <div style="margin-bottom:.6rem"><span style="color:var(--cyan);font-weight:700">Nibble bas (bits 3-0)</span> = nombre d'octets pour la longueur (run length)</div>
      <div>Ex : <span style="color:var(--gold)">0x21</span> → <span style="color:var(--purple)">2</span> octets delta, <span style="color:var(--cyan)">1</span> octet longueur</div>
    </div>

    <div class="sec-title">Décodage par fragment</div>
    <div id="rl-inputs">
      ${encodedFragments.map((f, i) => `
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem;margin-bottom:.6rem">
          <div style="font-size:.75rem;font-weight:700;color:var(--dim);margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.05em">Fragment ${i+1}</div>
          <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin-bottom:.4rem">
            <span class="ex-input-label">Header :</span>
            <span style="font-family:var(--mono);font-weight:700;color:var(--gold)">0x${f.headerByte.toString(16).toUpperCase().padStart(2,'0')}</span>
            <span class="ex-input-label" style="margin-left:.5rem">→ delta:</span>
            <span style="color:var(--purple);font-family:var(--mono);font-weight:700">${f.deltaBytes.length} octet(s)</span>
            <span class="ex-input-label">/ longueur:</span>
            <span style="color:var(--cyan);font-family:var(--mono);font-weight:700">${f.lenBytes.length} octet(s)</span>
          </div>
          <div class="ex-input-row" style="margin-top:.4rem">
            <span class="ex-input-label">Nb clusters :</span>
            <input class="ex-input" id="rl-len-${i}" type="number" placeholder="?" style="max-width:100px" min="1">
            <span class="ex-input-label" style="margin-left:.5rem">LCN départ :</span>
            <input class="ex-input" id="rl-lcn-${i}" type="number" placeholder="?" style="max-width:120px" min="0">
          </div>
          <div class="ex-feedback" id="rl-fb-${i}"></div>
        </div>`).join('')}
    </div>
    <div class="ex-input-row" style="margin-top:.5rem">
      <button class="btn-hint" id="btn-rl-hint">💡 Décomposition</button>
      <button class="btn-validate" id="btn-rl-validate">Valider ✓</button>
      <button class="btn-next" id="btn-next-rl" onclick="newExercise()" style="display:none">Exercice suivant →</button>
    </div>
    <div class="ex-feedback" id="rl-feedback-global"></div>
  `;
  // Attacher les événements après injection HTML pour éviter les problèmes de JSON dans onclick inline
  const hintData = encodedFragments.map(f => ({l:f.length, d:f.delta, lcn:f.lcn}));
  const validateData = encodedFragments.map(f => ({l:f.length, lcn:f.lcn}));
  div.querySelector('#btn-rl-hint').addEventListener('click', () => showRunListHint(hintData));
  div.querySelector('#btn-rl-validate').addEventListener('click', () => checkRunList(validateData, numFragments));
  return div;
}

function encodeVarInt(val) {
  if (val <= 0xFF)       return [val & 0xFF];
  if (val <= 0xFFFF)     return [val & 0xFF, (val >> 8) & 0xFF];
  if (val <= 0xFFFFFF)   return [val & 0xFF, (val >> 8) & 0xFF, (val >> 16) & 0xFF];
  return [val & 0xFF, (val >> 8) & 0xFF, (val >> 16) & 0xFF, (val >> 24) & 0xFF];
}
function encodeSignedVarInt(val) {
  // On génère des valeurs positives uniquement ici (exercice pédagogique)
  return encodeVarInt(val);
}

function buildRunListHex(fragments, allBytes) {
  let byteIdx = 0;
  const colors = ['--cyan', '--green', '--gold', '--purple'];
  let html = '';
  fragments.forEach((f, fi) => {
    const col = colors[fi % colors.length];
    // Header byte
    html += `<span class="hex-byte" style="border-color:rgba(255,255,255,.3);color:var(--gold)" title="Header fragment ${fi+1}: 0x${f.headerByte.toString(16).toUpperCase()}">${f.headerByte.toString(16).toUpperCase().padStart(2,'0')}</span>`;
    byteIdx++;
    // Length bytes
    f.lenBytes.forEach(b => {
      html += `<span class="hex-byte" style="color:var(${col})" title="Longueur frag ${fi+1}">${b.toString(16).toUpperCase().padStart(2,'0')}</span>`;
      byteIdx++;
    });
    // Delta bytes
    f.deltaBytes.forEach(b => {
      html += `<span class="hex-byte highlight" title="Delta LCN frag ${fi+1}">${b.toString(16).toUpperCase().padStart(2,'0')}</span>`;
      byteIdx++;
    });
    if (fi < fragments.length - 1) html += `<span class="hex-sep">·</span>`;
  });
  html += `<span class="hex-byte dim-byte" title="Fin de Run List">00</span>`;
  return html;
}

function showRunListHint(frags) {
  markHintUsed();
  frags.forEach((f, i) => {
    const fb = document.getElementById('rl-fb-' + i);
    if (fb) {
      fb.className = 'ex-feedback correct';
      fb.style.display = 'block';
      fb.innerHTML = `Fragment ${i+1} : <strong>${f.l} clusters</strong> · delta = <strong>+${f.d}</strong> → LCN = <strong>${f.lcn}</strong>`;
    }
    const lenEl = document.getElementById('rl-len-' + i);
    const lcnEl = document.getElementById('rl-lcn-' + i);
    if (lenEl) { lenEl.value = f.l; lenEl.className = 'ex-input correct'; }
    if (lcnEl) { lcnEl.value = f.lcn; lcnEl.className = 'ex-input correct'; }
  });
}

function checkRunList(expected, numFragments) {
  let allOk = true;
  let score = 0;

  for (let i = 0; i < numFragments; i++) {
    const lenVal = parseInt(document.getElementById('rl-len-' + i)?.value);
    const lcnVal = parseInt(document.getElementById('rl-lcn-' + i)?.value);
    const exp = expected[i];
    const fb  = document.getElementById('rl-fb-' + i);

    const lenOk = lenVal === exp.l;
    const lcnOk = lcnVal === exp.lcn;
    const ok = lenOk && lcnOk;

    if (!ok) allOk = false; else score++;

    const lenEl = document.getElementById('rl-len-' + i);
    const lcnEl = document.getElementById('rl-lcn-' + i);
    if (lenEl) lenEl.className = 'ex-input ' + (lenOk ? 'correct' : 'wrong');
    if (lcnEl) lcnEl.className = 'ex-input ' + (lcnOk ? 'correct' : 'wrong');

    if (fb) {
      fb.className = 'ex-feedback ' + (ok ? 'correct' : 'wrong');
      if (!ok) {
        fb.innerHTML = `✗ Fragment ${i+1} : attendu ${exp.l} clusters, LCN ${exp.lcn}.${!lenOk ? ` (clusters: ${lenVal||'?'} ≠ ${exp.l})` : ''}${!lcnOk ? ` (LCN: ${lcnVal||'?'} ≠ ${exp.lcn})` : ''}`;
      } else {
        fb.innerHTML = `✓ Fragment ${i+1} correct : ${exp.l} clusters @ LCN ${exp.lcn}`;
      }
    }
  }

  const globalFb = document.getElementById('rl-feedback-global');
  if (allOk) {
    document.querySelector('.ex-card').className = 'ex-card solved';
    document.getElementById('ex-num-rl').className = 'ex-num solved';
    document.getElementById('btn-rl-validate').disabled = true;
    document.getElementById('btn-next-rl').style.display = 'block';
    if (globalFb) {
      globalFb.className = 'ex-feedback correct';
      globalFb.innerHTML = `✓ Run List complète décodée — ${numFragments} fragment(s) · Connaissance NTFS validée.`;
    }
    if (!STATE.hintUsed) incSolved(STATE.cat);
  } else {
    if (globalFb) {
      globalFb.className = 'ex-feedback wrong';
      globalFb.innerHTML = `✗ ${score}/${numFragments} fragments corrects. Utilise "💡 Décomposition" pour voir le calcul.`;
    }
    breakStreak();
  }
}



// ═══════════════════════════════════════════════════════════════
// SYSTÈME D'INDICES CONTEXTUEL
// ═══════════════════════════════════════════════════════════════

const HINT_LIBRARY = {
  endian: [
    "Les octets Little Endian se lisent de droite à gauche. Le premier octet est le moins significatif (LSB).",
    "Exemple : 0A 7A 00 00 → inverser → 00 00 7A 0A → 0x00007A0A = 31242 en décimal.",
    "Sur Windows, presque toutes les valeurs multi-octets sont en Little Endian.",
  ],
  timestamp: [
    "Format FAT MS-DOS : Time (2 octets LE) puis Date (2 octets LE).",
    "Date : bits 15-9 = année (+1980), bits 8-5 = mois (1-12), bits 4-0 = jour.",
    "Heure : bits 15-11 = heures, bits 10-5 = minutes, bits 4-0 = secondes ÷ 2 (précision 2s).",
    "La précision MS-DOS est de 2 secondes — c'est pourquoi les secondes sont toujours paires.",
  ],
  bitmap: [
    "Dans une bitmap d'allocation, chaque bit représente un cluster : 0 = libre, 1 = occupé.",
    "L'ordre est LSB first : le cluster 0 correspond au bit 0 de l'octet 0 (bit de poids faible).",
    "Exemple : clusters 0, 1, 3 occupés → byte 0 = 00001011 = 0x0B (bit 0, bit 1, bit 3 à 1).",
  ],
  fat: [
    "Chaque entrée FAT16 est sur 2 octets (Little Endian). Lire : 0x07 0x00 → 0x0007 = cluster 7.",
    "Valeurs spéciales FAT16 : 0xFFFF = fin de chaîne, 0x0000 = cluster libre, 0xFFF7 = défectueux.",
    "Suivre la chaîne : cluster de départ → entrée FAT → cluster suivant → ... → 0xFFFF (EOC).",
  ],
  runlist: [
    "Header byte : nibble haut = nb octets pour le delta LCN, nibble bas = nb octets pour la longueur.",
    "Exemple 0x21 : 2 octets de delta, 1 octet de longueur. Lire ensuite 1 octet longueur puis 2 octets delta.",
    "Les valeurs longueur et delta sont en Little Endian. Le delta est relatif au fragment précédent.",
    "0x00 = terminateur de Run List (fin des fragments).",
  ],
  bases: [
    "Hex → Binaire : chaque chiffre hex = 4 bits (F = 1111, A = 1010, 0 = 0000).",
    "Décimal → Hex : diviser par 16 répétitivement, les restes donnent les chiffres hex.",
    "BCD : chaque groupe de 4 bits encode un chiffre décimal (0-9 uniquement, pas A-F).",
    "Complément à 2 : pour un nombre négatif, inverser tous les bits et ajouter 1.",
  ],
  effacement: [
    "En FAT, effacer un fichier = remplacer le premier octet du nom par 0xE5 (σ en DOS).",
    "Les entrées FAT correspondantes sont mises à 0x0000 (cluster libre).",
    "Les données sur le disque ne sont PAS effacées — elles restent jusqu'à réécriture.",
    "C'est pourquoi la récupération de fichiers FAT est souvent possible.",
  ],
  examen: [
    "Les examens CAS-IN combinent lecture hex directe, calculs LE et connaissance des structures.",
    "Commencer toujours par identifier le contexte : FAT12/16/32, exFAT, NTFS, EXT, HFS+.",
    "Pour les offsets : toujours lire en Little Endian sauf HFS+ (Big Endian).",
  ],
  timestomping: [
    "$STANDARD_INFORMATION (0x10) est modifiable par n'importe quelle application — c'est la cible de l'anti-forensique.",
    "$FILE_NAME (0x30) est mis à jour par le noyau Windows uniquement — difficile à falsifier.",
    "Si $SI.Created > $FN.Created : impossible, le fichier ne peut pas être créé après avoir été nommé → timestomping détecté.",
    "Si $SI et $FN ont exactement les mêmes dates au milliseconde près : probablement naturel (copie fraîche).",
  ],
  droitpenal: [
    "Art. 143 CP — Soustraction de données : obtenir sans droit des données protégées, dans un dessein d'enrichissement. Inclut la copie selon la jurisprudence du TF.",
    "Art. 143bis CP — Accès indu : pénétrer dans un système informatique sans autorisation, même sans intention de nuire.",
    "Art. 144bis CP — Dommages aux données : modifier, effacer, rendre inutilisable (inclut le chiffrement par ransomware).",
    "Art. 147 CP — Utilisation frauduleuse d'un ordinateur : obtenir un enrichissement illégitime par manipulation informatique (fraude CEO, virements détournés).",
  ],
  glossaire: [
    "Méthode : voir le terme, deviner la traduction, vérifier. Alterner FR→EN et EN→FR.",
    "Focus sur les termes qui trompent : 'décrypter' n'existe pas en bon français — on dit 'déchiffrer'.",
    "Les termes MAC times = Modified, Accessed, Created — trois horodatages distincts en forensique.",
  ],
};

// ═══════════════════════════════════════════════════════════════
// MNEMONIC_LIBRARY — Astuces mémo / mnémoniques par catégorie
// Affichées comme indices complémentaires (en plus des indices pas-à-pas)
// ═══════════════════════════════════════════════════════════════
const MNEMONIC_LIBRARY = {
  endian: [
    "🧠 <em>« Little = Lecture inverse »</em> — en LE, lis de droite à gauche pour reconstituer la valeur.",
    "🧠 <em>« x86 = LE, Réseau = BE »</em> — Intel est Little, IP/TCP sont Big. Apple HFS+ aussi BE.",
    "🧠 Octet faible = LSB = à <strong>gauche</strong> en LE. Octet fort = MSB = à <strong>gauche</strong> en BE.",
    "🧠 Mot de passe mémo : <strong>« BE-Bonne Écriture »</strong> (l'humain écrit 1 234 = milliers à gauche).",
  ],
  timestamp: [
    "🧠 Date FAT = <strong>YYYYYYY MMMM DDDDD</strong> (7+4+5 bits = 16). Année depuis 1980.",
    "🧠 Heure FAT = <strong>HHHHH MMMMMM SSSSS</strong> (5+6+5 bits = 16). Secondes ÷ 2 → toujours paires.",
    "🧠 FILETIME : <em>« Bill is from 1601 »</em> · 1 sec = 10<sup>7</sup> ticks (100ns).",
    "🧠 Unix epoch = 01/01/1970. FAT epoch = 01/01/1980. NTFS epoch = 01/01/1601. HFS+ = 01/01/1904.",
    "🧠 Astuce : si secondes impaires → <strong>pas un timestamp FAT</strong> (perte de précision).",
  ],
  bitmap: [
    "🧠 <em>« LSB first »</em> = bit 0 (poids faible) = cluster 0 dans l'octet 0.",
    "🧠 0xFF = 11111111 = 8 clusters occupés. 0x00 = 8 clusters libres.",
    "🧠 Pour trouver le 1<sup>er</sup> cluster libre : cherche le 1<sup>er</sup> bit à 0 en partant du bit 0 de l'octet 0.",
    "🧠 exFAT : clusters 0 et 1 sont <strong>réservés</strong> → bit 0 octet 0 = cluster 2.",
  ],
  fat: [
    "🧠 EOC FAT12 = 0xFFF · FAT16 = 0xFFFF · FAT32 = 0x0FFFFFFF (les 4 bits hauts ignorés).",
    "🧠 Cluster libre = 0x0000. Cluster défectueux FAT16 = 0xFFF7.",
    "🧠 <em>« Suivre la chaîne »</em> : chaque entrée = adresse du <strong>suivant</strong>.",
    "🧠 FAT entries en LE : 0x07 0x00 → 0x0007 = cluster 7.",
  ],
  magic: [
    "🧠 <strong>FF D8 FF</strong> = JPEG (toujours, quel que soit le 4<sup>e</sup> octet).",
    "🧠 <strong>89 50 4E 47</strong> = PNG (le 0x89 piège la corruption 7-bit).",
    "🧠 <strong>50 4B 03 04</strong> = ZIP <em>OU</em> docx/xlsx/pptx/jar/apk (toutes archives ZIP).",
    "🧠 <strong>25 50 44 46</strong> = '%PDF' en ASCII.",
    "🧠 <strong>4D 5A</strong> = MZ = exécutable Windows (PE). 'MZ' = Mark Zbikowski (dev MS-DOS).",
    "🧠 <strong>D0 CF 11 E0</strong> = OLE2 = vieux Office (.doc/.xls/.ppt 97-2003).",
  ],
  mismatch: [
    "🧠 Toujours vérifier <strong>signature ≠ extension</strong> en file carving.",
    "🧠 Un .jpg avec MZ en tête = <strong>exécutable déguisé</strong> (phishing classique).",
    "🧠 .docx/.xlsx/.pptx sont en réalité des archives ZIP — d'où `50 4B 03 04` en tête.",
    "🧠 Outil terrain : <code>file</code> (Linux/macOS) ou <code>TrID</code> (Windows) confirment le vrai type.",
  ],
  runlist: [
    "🧠 Header byte : <em>« Délai-Longueur »</em> (haut-bas) → nibble haut = nb octets delta, nibble bas = nb octets longueur.",
    "🧠 0x21 → 2 octets delta + 1 octet longueur. 0x32 → 3+2.",
    "🧠 0x00 = <strong>terminateur</strong> de Run List.",
    "🧠 Delta LCN = relatif au fragment précédent (peut être négatif → fragments « en arrière »).",
  ],
  bases: [
    "🧠 Hex ↔ Binaire : 1 chiffre hex = 4 bits. <em>« 4 bits c'est 1 doigt »</em> sur la main hex.",
    "🧠 Table à mémoriser : 0=0000, 5=0101, A=1010, F=1111. Le reste se déduit.",
    "🧠 BCD = Binary Coded Decimal : un chiffre décimal (0-9) par groupe de 4 bits. Les valeurs A-F sont <strong>invalides</strong> en BCD.",
    "🧠 Complément à 2 : pour négatifs, inverser tous les bits puis +1. MSB=1 → négatif.",
  ],
  effacement: [
    "🧠 <em>« E5 = Effacé »</em> (la lettre σ en DOS).",
    "🧠 0x00 en 1<sup>er</sup> octet d'une entrée SFN = <strong>fin du répertoire</strong>, pas effacé.",
    "🧠 Effacer en FAT ne touche PAS les données — uniquement l'entrée de répertoire et la chaîne FAT.",
    "🧠 <strong>TRIM</strong> sur SSD = effacement physique → la récupération devient impossible.",
  ],
  examen: [
    "🧠 SFN = 32 octets : 8.3 + attr + dates + cluster + taille.",
    "🧠 NTFS attributs : 10-30-80 = <strong>SI-FN-DATA</strong> (à mémoriser).",
    "🧠 Chaque enregistrement MFT = 1024 octets, commence par <strong>'FILE'</strong> (46 49 4C 45).",
    "🧠 HFS+ Volume Header @ offset 1024, signature <strong>'H+'</strong> = 0x482B en BE.",
    "🧠 EXT magic = <strong>0xEF53</strong> (53 EF en LE) à offset 0x38 du superbloc (offset 1024 du volume).",
    "🧠 exFAT : <em>« 85, C0, C1 »</em> = File / Stream / Name (3 entrées par fichier).",
  ],
  timestomping: [
    "🧠 <em>« $SI ment, $FN dit la vérité »</em> — $STANDARD_INFORMATION est modifiable, $FILE_NAME ne l'est que par le noyau.",
    "🧠 Si <strong>$SI.Created &gt; $FN.Created</strong> → physiquement impossible → timestomping.",
    "🧠 4 timestamps $SI identiques à la seconde près = écrasement en bloc (outil <code>timestomp</code>, <code>SetFileTime</code>).",
    "🧠 Précision normale : $SI sub-microseconde, jamais des dates « rondes » (ex: minuit pile).",
  ],
  hextable: [
    "🧠 BPB FAT — l'OEM démarre à 0x03, BPS à 0x0B, SPC à 0x0D, FATs à 0x10.",
    "🧠 SFN — Cluster à <strong>0x1A</strong>, Taille à <strong>0x1C</strong>.",
    "🧠 NTFS Boot — <strong>'NTFS    '</strong> à 0x03 (4 espaces), MFT LCN à 0x30.",
    "🧠 EXT Superbloc — magic <strong>0x53 0xEF</strong> à offset 0x38.",
  ],
  fsidentify: [
    "🧠 <strong>OEM ID</strong> à offset 0x03 trahit souvent le FS : <em>MSDOS5.0, MSWIN4.1, NTFS, EXFAT</em>.",
    "🧠 RootEntries (0x11) > 0 → FAT12/16. RootEntries = 0 → FAT32 ou autre.",
    "🧠 NTFS = NumFATs (0x10) à zéro — le BPB classique est ignoré.",
    "🧠 EXT4 superbloc commence à offset 1024 du volume (saute le boot).",
    "🧠 HFS+ : signature 'H+' = 0x48 0x2B en BE à offset 1024.",
  ],
  offset: [
    "🧠 NTFS — Offset $MFT = <strong>LCN × taille_cluster</strong>.",
    "🧠 FAT32 — Offset cluster N = <code>(reserved + nFATs × FATSize) × BPS + (N − 2) × cluster_size</code>.",
    "🧠 exFAT — Offset cluster N = <code>ClusterHeapOffset × BPS + (N − 2) × cluster_size</code>.",
    "🧠 EXT4 inode N : <em>groupe = (N−1) ÷ inodes_per_group</em>, puis index dans le groupe.",
    "🧠 HFS+ (et NTFS) : pas de « cluster 0 = libre » comme FAT — l'index commence à 0.",
  ],
  hash: [
    "🧠 MD5 = 128 bits = 32 hex chars. SHA-1 = 160 bits = 40. SHA-256 = 256 bits = 64. SHA-512 = 512 bits = 128.",
    "🧠 Formule : <em>n_chars_hex = bits ÷ 4</em>.",
    "🧠 Standard ISO/IEC 27037 : <strong>SHA-256 minimum</strong> en forensique (MD5/SHA-1 ont des collisions connues).",
    "🧠 Hash identique avant/après transport = chaîne de custody intacte. Hash différent = preuve compromise.",
  ],
  email: [
    "🧠 <strong>SPF</strong> vérifie l'IP émettrice. <strong>DKIM</strong> signe le message. <strong>DMARC</strong> applique une politique (none/quarantine/reject).",
    "🧠 Lire les <code>Received:</code> du <strong>bas vers le haut</strong> pour reconstituer le trajet.",
    "🧠 <em>Reply-To ≠ From</em> = drapeau rouge classique (CEO fraud / BEC).",
    "🧠 SPF PASS + DKIM PASS ne garantissent pas l'authenticité humaine — un compte compromis passe tous les contrôles.",
  ],
  network: [
    "🧠 DNS tunneling = sous-domaines aléatoires longs + requêtes TXT massives.",
    "🧠 IP <strong>185.220.x.x</strong> = nœuds de sortie Tor (fréquent en exfiltration).",
    "🧠 Beaucoup d'<strong>IPs distinctes en peu de temps</strong> + SNI aléatoires = DGA / scan / botnet.",
    "🧠 Ratio upload >> download vers IP suspecte = exfiltration probable.",
  ],
  ir: [
    "🧠 Containment (NIST) : <strong>isoler ≠ éteindre</strong>. Maintenir sous tension préserve la RAM.",
    "🧠 Ordre RFC 3227 : <em>RAM → réseau → processus → disque → backups → archives</em> (du plus volatile au plus stable).",
    "🧠 Volatility = framework RAM. Plugins phares : <code>pslist</code>, <code>malfind</code>, <code>netscan</code>, <code>pstree</code>.",
    "🧠 Ne JAMAIS prévenir un suspect avant d'avoir sécurisé les preuves.",
    "🧠 LPD CH révisée : notification PFPDT « dans les meilleurs délais » (≠ RGPD 72h).",
  ],
  droitpenal: [
    "🧠 <strong>Art. 143</strong> = soustraction (copie illicite, dessein d'enrichissement).",
    "🧠 <strong>Art. 143bis</strong> = accès indu (l'intrusion elle-même, sans intention de nuire).",
    "🧠 <strong>Art. 144bis</strong> = détérioration (chiffrer = détériorer → ransomware).",
    "🧠 <strong>Art. 147</strong> = utilisation frauduleuse d'un ordinateur (CEO fraud, virements détournés).",
    "🧠 <strong>Art. 156</strong> = extorsion (la rançon).",
    "🧠 <strong>Art. 179quater</strong> = prise de vue dans le domaine privé (RAT + webcam).",
  ],
  glossaire: [
    "🧠 <em>« Décrypter » n'existe pas en français — on dit déchiffrer.</em>",
    "🧠 MAC times = <strong>M</strong>odified · <strong>A</strong>ccessed · <strong>C</strong>reated.",
    "🧠 IoC = Indicator of Compromise (hash, IP, nom de fichier, clé registre).",
    "🧠 EIMP = Entraide internationale en matière pénale (loi suisse).",
  ],
};

let _currentHints = [];
let _currentHintIdx = 0;

function initHintSystem(cat) {
  // Indices techniques uniquement (pas-à-pas).
  // Les mnémoniques (MNEMONIC_LIBRARY) sont affichées dans l'onglet « Mémo »
  // séparé du panneau d'aide flottant — pas dans la pagination linéaire.
  _currentHints = HINT_LIBRARY[cat] || HINT_LIBRARY.endian;
  _currentHintIdx = 0;
}

function showContextHint(cat) {
  initHintSystem(cat || STATE.cat);
  const existing = document.getElementById('ctx-hint-panel');
  if (existing) { existing.remove(); return; }

  const currentCat = cat || STATE.cat;
  const mnemos = (typeof MNEMONIC_LIBRARY !== 'undefined' && MNEMONIC_LIBRARY[currentCat]) ? MNEMONIC_LIBRARY[currentCat] : [];

  const panel = document.createElement('div');
  panel.id = 'ctx-hint-panel';
  panel.style.cssText = `
    position:fixed; bottom:70px; right:16px; width:340px; max-width:92vw;
    max-height:78vh; overflow:auto;
    background:linear-gradient(135deg,#0c1422,#101c30);
    border:1px solid rgba(240,192,64,.4); border-radius:12px;
    padding:14px 16px; z-index:8000;
    box-shadow: 0 8px 32px rgba(0,0,0,.6);
    animation: slideUp .25s ease;
    font-size:.8rem; line-height:1.65;
  `;

  // Onglets : "Indices" (existant, paginé) et "Mémo" (nouveau, liste)
  let activeTab = 'hints'; // 'hints' | 'memo'

  function renderTabs() {
    const hintsActive = activeTab === 'hints';
    const memoActive  = activeTab === 'memo';
    return `
      <div style="display:flex;gap:4px;margin-bottom:10px;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:8px">
        <button data-tab="hints" style="flex:1;padding:5px 8px;border-radius:6px;border:1px solid ${hintsActive?'rgba(240,192,64,.4)':'rgba(255,255,255,.08)'};background:${hintsActive?'rgba(240,192,64,.10)':'transparent'};color:${hintsActive?'var(--gold)':'var(--dim)'};cursor:pointer;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em">💡 Indices</button>
        <button data-tab="memo" style="flex:1;padding:5px 8px;border-radius:6px;border:1px solid ${memoActive?'rgba(0,229,204,.4)':'rgba(255,255,255,.08)'};background:${memoActive?'rgba(0,229,204,.10)':'transparent'};color:${memoActive?'var(--cyan)':'var(--dim)'};cursor:pointer;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em">🧠 Mémo${mnemos.length?` (${mnemos.length})`:''}</button>
      </div>`;
  }

  function renderHintsTab() {
    const hints = _currentHints;
    if (!hints || !hints.length) return `<div style="color:var(--dim);font-size:.8rem;text-align:center;padding:1rem">Aucun indice pour cette catégorie.</div>`;
    return `
      <div id="ctx-hint-text" style="color:var(--text);margin-bottom:10px;min-height:60px">${hints[_currentHintIdx]}</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span id="ctx-hint-idx" style="font-size:.68rem;color:var(--dim)">${_currentHintIdx+1} / ${hints.length}</span>
        <div style="display:flex;gap:6px">
          <button id="ctx-hint-prev" style="padding:3px 10px;border-radius:5px;border:1px solid rgba(255,255,255,.15);background:transparent;color:var(--dim);cursor:pointer;font-size:.75rem;font-family:var(--mono)">←</button>
          <button id="ctx-hint-next" style="padding:3px 10px;border-radius:5px;border:1px solid rgba(255,255,255,.15);background:transparent;color:var(--dim);cursor:pointer;font-size:.75rem;font-family:var(--mono)">→</button>
        </div>
      </div>`;
  }

  function renderMemoTab() {
    if (!mnemos.length) {
      return `<div style="color:var(--dim);font-size:.78rem;text-align:center;padding:1rem;line-height:1.6">Pas encore d'astuce mémo pour cette catégorie.<br><span style="font-size:.7rem;opacity:.7">Reviens plus tard ou consulte une autre catégorie.</span></div>`;
    }
    // Les mnémoniques sont des strings HTML (déjà formatés avec balises)
    return mnemos.map(m => `
      <div style="margin-bottom:.55rem;padding:.55rem .75rem;background:rgba(0,229,204,.05);border:1px solid rgba(0,229,204,.18);border-left:3px solid var(--cyan);border-radius:6px;font-size:.76rem;color:var(--text);line-height:1.55">
        ${m}
      </div>`).join('');
  }

  function render() {
    const tabContent = activeTab === 'hints' ? renderHintsTab() : renderMemoTab();
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:.7rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.1em">Aide — ${currentCat}</span>
        <button id="ctx-hint-close" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:16px;line-height:1;padding:0">✕</button>
      </div>
      ${renderTabs()}
      <div id="ctx-tab-body">${tabContent}</div>
    `;
    // Bind handlers
    panel.querySelector('#ctx-hint-close').onclick = () => panel.remove();
    panel.querySelectorAll('button[data-tab]').forEach(b => {
      b.onclick = () => { activeTab = b.dataset.tab; render(); };
    });
    if (activeTab === 'hints') {
      const prev = panel.querySelector('#ctx-hint-prev');
      const next = panel.querySelector('#ctx-hint-next');
      if (prev) prev.onclick = () => {
        _currentHintIdx = Math.max(0, _currentHintIdx - 1);
        updateHintPanel();
      };
      if (next) next.onclick = () => {
        _currentHintIdx = Math.min(_currentHints.length - 1, _currentHintIdx + 1);
        updateHintPanel();
      };
    }
  }
  function updateHintPanel() {
    const hints = _currentHints;
    const textEl = panel.querySelector('#ctx-hint-text');
    const idxEl  = panel.querySelector('#ctx-hint-idx');
    if (textEl) textEl.innerHTML = hints[_currentHintIdx];
    if (idxEl)  idxEl.textContent = `${_currentHintIdx+1} / ${hints.length}`;
  }

  render();
  document.body.appendChild(panel);
}

// Bouton flottant d'aide
function addFloatingHelp() {
  if (document.getElementById('float-help')) return;
  const btn = document.createElement('button');
  btn.id = 'float-help';
  btn.innerHTML = '💡';
  btn.title = 'Aide contextuelle — Indices + 🧠 Astuces mémo';
  btn.style.cssText = `
    position:fixed; bottom:20px; right:16px;
    width:44px; height:44px; border-radius:50%;
    background:rgba(240,192,64,.15); border:1px solid rgba(240,192,64,.4);
    color:var(--gold); font-size:20px; cursor:pointer;
    box-shadow:0 4px 16px rgba(0,0,0,.4);
    transition:.2s; z-index:7999;
    display:flex; align-items:center; justify-content:center;
  `;
  btn.onclick = () => showContextHint(STATE.cat);
  btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
  btn.onmouseleave = () => btn.style.transform = 'scale(1)';
  document.body.appendChild(btn);
}

// CSS animation
if (!document.querySelector('#hint-anim-style')) {
  const s = document.createElement('style');
  s.id = 'hint-anim-style';
  s.textContent = `@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`;
  document.head.appendChild(s);
}

document.addEventListener('DOMContentLoaded', addFloatingHelp);


// ═══════════════════════════════════════════════════════════════
// 8. BASES & ENCODAGES (inspiré de l'examen 2022)
// ═══════════════════════════════════════════════════════════════

// [BASES_EXERCISES chargé depuis tp-data.js]
function genBases() {
  const ex = BASES_EXERCISES[rand(0, BASES_EXERCISES.length-1)];
  const data = ex.gen();
  const id = `bases-${Date.now()}`;

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-bs">🔢</div>
      <div class="ex-title">Bases & Encodages — Examen CAS-IN</div>
      <span class="ex-badge easy">calcul</span>
    </div>
    <div class="ex-scenario">${data.question}</div>
    <div class="ex-input-row">
      <span class="ex-input-label">${data.label}</span>
      <input class="ex-input" id="inp-bases" placeholder="${data.placeholder}" autocomplete="off" style="max-width:200px">
      <button class="btn-hint" id="btn-hint-bs">💡 Méthode</button>
      <button class="btn-validate" id="btn-validate-bs">Valider ✓</button>
      <button class="btn-next" id="btn-next-bs" onclick="newExercise()">Exercice suivant →</button>
    </div>
    <div class="ex-feedback" id="ex-feedback-bs"></div>
  `;
  setTimeout(() => {
    const inp = div.querySelector('#inp-bases');
    if (inp) inp.addEventListener('keydown', e => { if(e.key==='Enter') div.querySelector('#btn-validate-bs').click(); });
    const hintBtn = div.querySelector('#btn-hint-bs');
    if (hintBtn) hintBtn.addEventListener('click', () => showBasesHint(data.hint));
    const validateBtn = div.querySelector('#btn-validate-bs');
    if (validateBtn) validateBtn.addEventListener('click', () => checkBases(validateBtn, data.answer, data.explain));
  }, 50);
  return div;
}

function showBasesHint(hint) {
  markHintUsed();
  const fb = document.getElementById('ex-feedback-bs');
  if (!fb) return;
  fb.className = 'ex-feedback correct';
  fb.innerHTML = `💡 Méthode : ${hint}`;
}

function checkBases(btn, expected, explain) {
  const inp = document.getElementById('inp-bases');
  const fb  = document.getElementById('ex-feedback-bs');
  const val = inp.value.trim();
  const ok  = val.toUpperCase().replace(/\s/g,'') === expected.toUpperCase().replace(/\s/g,'') || val === expected;

  if (ok) {
    inp.className = 'ex-input correct';
    btn.disabled = true;
    document.getElementById('btn-next-bs').style.display = 'block';
    document.querySelector('.ex-card').className = 'ex-card solved';
    document.getElementById('ex-num-bs').className = 'ex-num solved';
    fb.className = 'ex-feedback correct';
    fb.innerHTML = `✓ Correct ! ${explain}`;
    if (!STATE.hintUsed) incSolved(STATE.cat);
  } else {
    inp.className = 'ex-input wrong';
    fb.className = 'ex-feedback wrong';
    fb.innerHTML = `✗ "${val}" incorrect. Réponse attendue : <strong>${expected}</strong>. Utilise 💡 Méthode pour voir les étapes.`;
    breakStreak();
    setTimeout(() => inp.className = 'ex-input', 700);
  }
}


// ═══════════════════════════════════════════════════════════════
// 9. EFFACEMENT FAT (inspiré Q4 examen système de fichiers)
// ═══════════════════════════════════════════════════════════════

function genEffacement() {
  const noms = ["Jules", "rapport", "vacances", "notes", "budget", "config", "archive", "backup"];
  const extensions = ["txt", "docx", "pdf", "jpg", "xlsx"];
  const nom = noms[rand(0, noms.length-1)];
  const ext = extensions[rand(0, extensions.length-1)];
  const filename = `${nom}.${ext}`;
  const sfn = nom.toUpperCase().padEnd(8,' ').slice(0,8) + ext.toUpperCase().padEnd(3,' ').slice(0,3);
  const sfnBytes = sfn.split('').map(c => c.charCodeAt(0).toString(16).toUpperCase().padStart(2,'0'));

  const numClusters = rand(2, 5);
  const startCluster = rand(2, 50);
  const clusters = [startCluster];
  for (let i = 1; i < numClusters; i++) clusters.push(clusters[i-1] + rand(1,10));

  const sizeMB = rand(1, 10);
  const questions = [
    {
      q: `Par quoi est remplacé le premier octet du nom <strong>${filename}</strong> dans son entrée de répertoire FAT ?`,
      choices: [
        { text: "0x00 (zéro)", correct: false, why: "0x00 en 1<sup>er</sup> octet d'une entrée SFN signifie « <strong>fin du répertoire</strong> » — aucune entrée valide n'existe au-delà. C'est utilisé pour le slot vierge initial, pas pour marquer un effacement." },
        { text: "0xE5 (sigma)", correct: true,  why: "" },
        { text: "0xFF (effacement)", correct: false, why: "0xFF est utilisé en exFAT comme padding bitmap mais <strong>pas</strong> comme marqueur d'effacement FAT. C'est un piège classique." },
        { text: "Le nom est supprimé", correct: false, why: "Le nom n'est <strong>pas effacé</strong> — seul le 1<sup>er</sup> octet change. Les 10 autres caractères du nom (8.3) restent lisibles, ce qui permet la récupération forensique." },
      ],
      correctExplain: "0xE5 remplace le premier octet du nom de fichier dans l'entrée de répertoire. C'est le marqueur d'effacement FAT depuis MS-DOS — 0xE5 correspond au caractère σ.",
      note: "Les données ne sont PAS effacées — seule l'entrée de répertoire est marquée. C'est pourquoi la récupération forensique est possible."
    },
    {
      q: `Que deviennent les entrées FAT des clusters ${clusters.join(', ')} après l'effacement de <strong>${filename}</strong> ?`,
      choices: [
        { text: `Elles passent à 0x0000 (cluster libre)`, correct: true, why: "" },
        { text: `Elles passent à 0xFFFF (fin de chaîne)`, correct: false, why: "0xFFFF (FAT16) ou 0x0FFFFFFF (FAT32) marque la <strong>fin d'une chaîne active</strong>, pas un cluster libre. Mettre cette valeur ferait croire que le cluster appartient toujours à un fichier." },
        { text: `Elles sont supprimées physiquement du disque`, correct: false, why: "Une entrée FAT n'est jamais « supprimée » — elle est <strong>réécrite</strong>. Et même réécrite, les <strong>données</strong> dans les clusters référencés restent intactes jusqu'à réallocation." },
        { text: `Elles restent inchangées — FAT ne se met pas à jour`, correct: false, why: "Faux : sans mise à jour de la FAT, l'OS continuerait à voir les clusters comme occupés et ne pourrait jamais les réutiliser. Le FS deviendrait « plein » sans raison." },
      ],
      correctExplain: `Les entrées FAT des clusters ${clusters.join(', ')} passent à 0x0000, les marquant comme libres. Mais les données dans ces clusters restent intactes sur le disque jusqu'à réécriture.`,
      note: "C'est le principe de la récupération forensique FAT : les données survivent à l'effacement."
    },
    {
      q: `Un fichier <strong>${filename}</strong> de ${sizeMB} Mo vient d'être effacé. Ses données sont-elles récupérables ?`,
      choices: [
        { text: "Non — les données sont immédiatement écrasées", correct: false, why: "Faux : l'effacement FAT ne touche <strong>jamais</strong> les données dans les clusters. L'OS marque seulement les clusters comme libres dans la FAT et le 1<sup>er</sup> octet du nom à 0xE5." },
        { text: "Oui — si les clusters n'ont pas été réalloués", correct: true, why: "" },
        { text: "Seulement si le disque a un journal (journaling)", correct: false, why: "FAT n'a <strong>pas</strong> de journal (contrairement à NTFS, EXT4). Pourtant la récupération FAT est très efficace car les données persistent dans les clusters libres." },
        { text: "Non — l'effacement supprime les données et l'entrée FAT", correct: false, why: "Faux : l'effacement est purement <strong>logique</strong>. Pour réellement supprimer les données, il faut un effacement sécurisé (DBAN, <code>shred</code>, TRIM sur SSD)." },
      ],
      correctExplain: `Oui, les données sont potentiellement récupérables. L'effacement FAT ne fait que marquer les clusters comme libres (0x0000). Les données physiques dans les clusters ${clusters.join(', ')} restent jusqu'à ce qu'un nouveau fichier les réécrive.`,
      note: `En forensique, on recherche les entrées avec 0xE5 en premier octet pour identifier les fichiers effacés. La taille (${sizeMB} Mo) et le cluster de départ sont encore lisibles dans l'entrée corrompue.`
    },
  ];

  const q = questions[rand(0, questions.length-1)];
  // Préparer les choix avec their per-option wrong-explanation
  const opts = q.choices.map((c,i) => ({...c, originalIdx: i})).sort(() => Math.random() - .5);
  const correctIdx = opts.findIndex(o => o.correct);

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-ef">🗑</div>
      <div class="ex-title">Effacement de fichier — FAT</div>
      <span class="ex-badge medium">medium</span>
    </div>
    <div class="ex-scenario">
      Tu analyses une clé USB FAT16. Un suspect vient d'effacer le fichier <strong>${filename}</strong>
      (${sizeMB} Mo, clusters ${clusters.join(' → ')}).
    </div>
    <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.75rem;margin-bottom:.75rem">
      <div style="font-size:.72rem;font-weight:700;color:var(--dim);margin-bottom:.4rem;text-transform:uppercase;letter-spacing:.05em">Entrée de répertoire avant effacement</div>
      <div class="hex-display" style="font-size:.8rem;margin:0;flex-wrap:wrap;gap:3px">
        ${sfnBytes.map((b,i) => `<span class="hex-byte ${i===0?'highlight':''}" title="${i<8?'Nom: '+sfn[i]:i<11?'Ext: '+sfn[i]:'Attributs'}">${b}</span>`).join('')}
        <span class="hex-sep">···</span>
      </div>
      <div style="font-size:.7rem;color:var(--dim);margin-top:.3rem">Premier octet = <span style="color:var(--gold)">${sfnBytes[0]}</span> = "${sfn[0]}" du nom</div>
    </div>

    <div class="sec-title">Question</div>
    <div class="ex-scenario">${q.q}</div>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin:.75rem 0" id="ef-choices">
      ${opts.map((o,i) => `
        <button class="tp-choice"
          data-correct="${o.correct}"
          data-why="${encData(o.why || '')}"
          data-correct-explain="${encData(q.correctExplain)}"
          data-note="${encData(q.note)}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${o.text}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-ef"></div>
    <button class="btn-next" id="btn-next-ef" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  // Bind handlers via event delegation (évite les bugs de quotes)
  setTimeout(() => {
    div.querySelectorAll('#ef-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        const why  = decData(b.dataset.why) || '';
        const correctExplain = decData(b.dataset.correctExplain) || '';
        const note = decData(b.dataset.note) || '';
        checkEffacement(b, isOk, correctExplain, why, note);
      });
    });
  }, 0);
  return div;
}

function checkEffacement(btn, isOk, correctExplain, wrongExplain, note) {
  const btns = document.querySelectorAll('#ef-choices .tp-choice');
  if (btns[0].disabled) return;
  btns.forEach(b => { b.disabled = true; b.style.cursor='default'; });
  // Coloriser le bouton cliqué + révéler la bonne réponse si erreur
  btn.style.borderColor = isOk ? 'var(--green)' : 'var(--red)';
  btn.style.background  = isOk ? 'rgba(48,232,138,.1)' : 'rgba(255,64,96,.08)';
  btn.style.color       = isOk ? 'var(--green)' : 'var(--red)';
  if (!isOk) {
    btns.forEach(b => {
      if (b !== btn && b.dataset.correct === 'true') {
        b.style.borderColor = 'var(--green)';
        b.style.background  = 'rgba(48,232,138,.08)';
        b.style.color       = 'var(--green)';
      }
    });
  }
  const fb = document.getElementById('ex-feedback-ef');
  fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
  fb.innerHTML = formatChoiceFeedback(isOk, correctExplain, wrongExplain, note);
  document.getElementById('ex-num-ef').className = 'ex-num ' + (isOk ? 'solved' : 'error');
  document.querySelector('.ex-card').className = 'ex-card ' + (isOk ? 'solved' : 'error');
  document.getElementById('btn-next-ef').style.display = 'block';
  if (isOk && !STATE.hintUsed) incSolved(STATE.cat);
  else if (!isOk) breakStreak();
}


// ═══════════════════════════════════════════════════════════════
// 10. SÉRIE EXAMEN (questions inspirées des vrais examens CAS-IN)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// SÉRIE EXAMEN — Questions originales avec tables hex et indices
// ═══════════════════════════════════════════════════════════════

// renderHexDump — version refondue (avril 2026)
// Signature : renderHexDump(rows, highlights, opts)
//   rows       : [{offset:'00000010', bytes:[...] }] — TOUTE découpe est acceptée
//                (4, 16, 32, 80 octets…) ; la fonction ré-aplatit puis re-découpe.
//   highlights : [{from, to, color, label}]  — offsets ABSOLUS dans le buffer
//   opts.cols  : 16 (défaut) ou 32 — largeur de ligne
//   opts.title : titre optionnel au-dessus du dump
//
// Améliorations :
//   • En-tête de colonnes (00 01 … 0F) parfaitement aligné via colspan d'une <th>
//     par octet (chaque cellule = 2.4ch, monospace) — ASCII en colonne dédiée.
//   • Séparateur visuel toutes les 8 colonnes (groupes de 8 octets).
//   • Highlights par span coloré + tooltip (title=).
//   • Mode 32 colonnes : idéal pour SFN/exFAT/MFT (1 entrée = 1 ligne).
function renderHexDump(rows, highlights=[], opts={}) {
  const COLS = (opts.cols === 32) ? 32 : 16;
  const HALF = COLS / 2;

  // Aplatir tous les bytes en gardant l'offset de base
  const baseOff = rows.length ? parseInt(rows[0].offset, 16) : 0;
  const allBytes = rows.flatMap(r => r.bytes);

  // Re-découper en lignes de COLS octets
  const newRows = [];
  for (let i = 0; i < allBytes.length; i += COLS) {
    newRows.push({
      offset: (baseOff + i).toString(16).toUpperCase().padStart(8, '0'),
      bytes:  allBytes.slice(i, i + COLS),
      _start: baseOff + i,
    });
  }

  // En-tête : générer les indices de colonne 00 01 … (COLS-1)
  const colHeaders = [];
  for (let c = 0; c < COLS; c++) {
    const sep = (c === HALF) ? 'border-left:1px solid rgba(255,255,255,.08);padding-left:.45rem' : '';
    colHeaders.push(
      `<th style="padding:.25rem .15rem;color:var(--dim);font-size:.6rem;font-weight:600;text-align:center;border-bottom:1px solid var(--border);${sep}">${c.toString(16).toUpperCase().padStart(2,'0')}</th>`
    );
  }

  // Construction des lignes de bytes
  const bodyRows = newRows.map(r => {
    const tds = [];
    for (let i = 0; i < COLS; i++) {
      const b = r.bytes[i];
      const sep = (i === HALF) ? 'border-left:1px solid rgba(255,255,255,.08);padding-left:.45rem' : '';
      if (b === undefined) {
        tds.push(`<td style="padding:.25rem .15rem;color:var(--dim);text-align:center;${sep}">  </td>`);
        continue;
      }
      const abs = r._start + i;
      const hl  = highlights.find(h => h.from <= abs && abs <= h.to);
      const baseStyle = hl
        ? `color:var(${hl.color||'--cyan'});font-weight:700;background:rgba(255,255,255,.04);border-radius:3px`
        : `color:var(--text)`;
      const title = hl ? ` title="${escAttr(hl.label || '')}"` : '';
      tds.push(`<td style="padding:.25rem .15rem;text-align:center;${sep};${baseStyle}"${title}>${b.toString(16).toUpperCase().padStart(2,'0')}</td>`);
    }
    const ascii = r.bytes.map(b => (b!==undefined && b>=0x20 && b<0x7F) ? String.fromCharCode(b) : '.').join('');
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.025)">
      <td style="padding:.3rem .6rem;color:var(--dim);font-size:.7rem;border-right:1px solid rgba(255,255,255,.05)">${r.offset}</td>
      ${tds.join('')}
      <td style="padding:.3rem .6rem;color:var(--dim);font-size:.7rem;border-left:1px solid rgba(255,255,255,.05);text-align:left">${escAttr(ascii)}</td>
    </tr>`;
  }).join('');

  const titleHTML = opts.title
    ? `<div style="padding:.4rem .8rem;font-size:.7rem;color:var(--gold);background:rgba(240,192,64,.05);border-bottom:1px solid var(--border);font-weight:700;letter-spacing:.05em;text-transform:uppercase">${escAttr(opts.title)}</div>`
    : '';

  return `<div style="background:rgba(0,0,0,.45);border:1px solid var(--border);border-radius:8px;overflow:auto;margin:.6rem 0;font-family:var(--mono);font-size:.74rem">
    ${titleHTML}
    <table style="border-collapse:collapse;min-width:100%">
      <thead><tr style="background:var(--surface2)">
        <th style="padding:.25rem .6rem;color:var(--dim);font-size:.6rem;text-align:left;border-bottom:1px solid var(--border);border-right:1px solid rgba(255,255,255,.05)">Offset</th>
        ${colHeaders.join('')}
        <th style="padding:.25rem .6rem;color:var(--dim);font-size:.6rem;border-bottom:1px solid var(--border);border-left:1px solid rgba(255,255,255,.05);text-align:left">ASCII</th>
      </tr></thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  </div>`;
}

// ── Exercice type FAT Boot Sector ──
function makeBootSectorExercise() {
  // Paramètres réalistes aléatoires
  const bps   = [512, 1024, 2048][rand(0,2)];
  const spc   = [1,2,4,8,16][rand(0,4)];
  const rsvd  = rand(2, 8);
  const nFATs = 2;
  const sectPerFAT = rand(2, 16);
  const rootEntries = 512;
  
  // Encoder en Little Endian
  const le16 = v => [v & 0xFF, (v >> 8) & 0xFF];
  const le32 = v => [v & 0xFF, (v>>8)&0xFF, (v>>16)&0xFF, (v>>24)&0xFF];

  const bytes = new Array(64).fill(0);
  // OEM at 0x03
  "MSDOS5.0".split('').forEach((c,i) => bytes[3+i] = c.charCodeAt(0));
  // BPB
  le16(bps).forEach((b,i)   => bytes[0x0B+i] = b);  // BytesPerSector
  bytes[0x0D] = spc;                                  // SectorsPerCluster
  le16(rsvd).forEach((b,i)  => bytes[0x0E+i] = b);  // ReservedSectors
  bytes[0x10] = nFATs;                                // NumFATs
  le16(rootEntries).forEach((b,i) => bytes[0x11+i] = b); // RootEntryCount
  le16(sectPerFAT).forEach((b,i) => bytes[0x16+i] = b); // SectorsPerFAT

  const question = rand(0,2);
  let qText, answer, hints, explain;

  if (question === 0) {
    answer = sectPerFAT;
    qText = `Combien de secteurs occupe <strong>chacune des FAT</strong> de ce volume ?`;
    hints = [
      `L'offset de SectorsPerFAT (FAT16) est <strong>0x16</strong> sur 2 octets en Little Endian.`,
      `Localise l'offset 0x16 dans le dump. Lis 2 octets, inverse (Little Endian), convertis en décimal.`,
      `Offset 0x16 = octets <span style="color:var(--cyan);font-weight:700">${bytes[0x16].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x17].toString(16).toUpperCase().padStart(2,'0')}</span> → LE → ${sectPerFAT} secteurs`,
    ];
    explain = `SectorsPerFAT @ 0x16 = ${bytes[0x16].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x17].toString(16).toUpperCase().padStart(2,'0')} en LE = ${sectPerFAT} secteurs par FAT.`;
  } else if (question === 1) {
    answer = bps;
    qText = `Quelle est la taille d'un <strong>secteur</strong> (en octets) sur ce volume ?`;
    hints = [
      `BytesPerSector se trouve à l'offset <strong>0x0B</strong> sur 2 octets Little Endian dans le BPB.`,
      `Offset 0x0B dans le dump : lis 2 octets consécutifs, inverse l'ordre des octets (LE).`,
      `0x0B = octets <span style="color:var(--cyan);font-weight:700">${bytes[0x0B].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x0C].toString(16).toUpperCase().padStart(2,'0')}</span> → LE → ${bps} octets/secteur`,
    ];
    explain = `BytesPerSector @ 0x0B = ${bytes[0x0B].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x0C].toString(16).toUpperCase().padStart(2,'0')} → LE → ${bps} octets.`;
  } else {
    answer = spc;
    qText = `Combien de secteurs contient <strong>chaque cluster</strong> sur ce volume ?`;
    hints = [
      `SectorsPerCluster est à l'offset <strong>0x0D</strong> sur 1 seul octet — pas de Little Endian sur 1 octet.`,
      `Offset 0x0D → lire directement 1 octet et convertir en décimal.`,
      `0x0D = octet <span style="color:var(--cyan);font-weight:700">${bytes[0x0D].toString(16).toUpperCase().padStart(2,'0')}</span> = ${spc} secteurs/cluster`,
    ];
    explain = `SectorsPerCluster @ 0x0D = 0x${bytes[0x0D].toString(16).toUpperCase().padStart(2,'0')} = ${spc} secteur(s) par cluster.`;
  }

  const row0 = { offset: '00000000', bytes: bytes.slice(0, 16) };
  const row1 = { offset: '00000010', bytes: bytes.slice(16, 32) };
  const row2 = { offset: '00000020', bytes: bytes.slice(32, 48) };
  const rows = [row0, row1, row2];

  const hlTarget = question === 0 ? {from:0x16,to:0x17,color:'--gold',label:'SectorsPerFAT'}
                 : question === 1 ? {from:0x0B,to:0x0C,color:'--cyan',label:'BytesPerSector'}
                 : {from:0x0D,to:0x0D,color:'--green',label:'SectorsPerCluster'};

  return {
    title: "FAT — Lecture du Boot Sector (BPB)",
    category: "Système de fichiers",
    difficulty: "medium",
    scenario: `Tu examines le <strong>secteur de boot</strong> d'une clé USB FAT16.`,
    hexDump: renderHexDump(rows, [
      {from:0x03,to:0x0A,color:'--dim',label:'OEM ID'},
      hlTarget
    ], {cols: 16, title: 'Boot sector FAT — premiers 48 octets (BPB)'}),
    question: qText,
    type: "number",
    answer: String(answer),
    hints,
    explain,
  };
}

// ── Exercice type Run List NTFS ──
function makeRunListExercise() {
  // Générer 2-4 fragments réalistes
  const n = rand(2,4);
  const fragments = [];
  let lcn = 0;

  for (let i = 0; i < n; i++) {
    const len   = rand(1, 30);
    const delta = rand(1, 100);
    lcn += delta;
    const lenOcts  = len  <= 0xFF ? 1 : 2;
    const delOcts  = delta <= 0xFF ? 1 : 2;
    const header   = (delOcts << 4) | lenOcts;
    const lenBytes = lenOcts === 1 ? [len] : [len & 0xFF, (len >> 8) & 0xFF];
    const delBytes = delOcts === 1 ? [delta] : [delta & 0xFF, (delta >> 8) & 0xFF];
    fragments.push({ len, delta, lcn, header, lenBytes, delBytes });
  }

  const allBytes = [
    ...fragments.flatMap(f => [f.header, ...f.lenBytes, ...f.delBytes]),
    0x00
  ];

  const hexStr = allBytes.map(b => b.toString(16).toUpperCase().padStart(2,'0'));

  const question = rand(0,2);
  let qText, answer, hints, explain;

  if (question === 0) {
    answer = String(n);
    qText = "Sur combien de <strong>fragments</strong> (runs) ce fichier est-il réparti ?";
    hints = [
      `Chaque fragment commence par un <strong>octet header</strong>. L'octet <span style="color:var(--gold)">0x00</span> est le terminateur — il marque la fin de la Run List.`,
      `Header : nibble haut (bits 7-4) = nb octets pour le delta LCN, nibble bas (bits 3-0) = nb octets pour la longueur. Un header ≠ 0x00 = un fragment.`,
      `Lis chaque header, saute ses octets longueur + delta, puis passe au header suivant. Compte les headers jusqu'au 0x00.`,
    ];
    explain = `${n} headers non-nuls avant le 0x00 terminateur = ${n} fragments.`;
  } else if (question === 1) {
    answer = String(fragments[0].len);
    qText = `Combien de clusters contient le <strong>premier fragment</strong> ?`;
    hints = [
      `Le premier octet est le header : <span style="color:var(--gold)">${fragments[0].header.toString(16).toUpperCase().padStart(2,'0')}</span>. Nibble bas = nombre d'octets pour la longueur (Run Length).`,
      `Nibble bas de 0x${fragments[0].header.toString(16).toUpperCase().padStart(2,'0')} = ${fragments[0].header & 0xF}. Lis ${fragments[0].header & 0xF} octet(s) en Little Endian après le header.`,
      `Octet(s) longueur : ${fragments[0].lenBytes.map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} → LE → <strong>${fragments[0].len} clusters</strong>`,
    ];
    explain = `Header 0x${fragments[0].header.toString(16).toUpperCase().padStart(2,'0')} → nibble bas=${fragments[0].header&0xF} → ${fragments[0].header&0xF} octet(s) longueur = ${fragments[0].lenBytes.map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} (LE) = ${fragments[0].len} clusters.`;
  } else {
    answer = String(fragments[0].lcn);
    qText = `À quel <strong>LCN (Logical Cluster Number)</strong> débute le premier fragment ?`;
    hints = [
      `Après le header et les octets longueur, les octets delta indiquent le LCN de départ (relatif au début pour le premier fragment).`,
      `Header 0x${fragments[0].header.toString(16).toUpperCase().padStart(2,'0')} → nibble haut=${fragments[0].header>>4} → ${fragments[0].header>>4} octet(s) de delta après les ${fragments[0].header&0xF} octet(s) de longueur.`,
      `Octets delta : ${fragments[0].delBytes.map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} → LE → <strong>${fragments[0].lcn}</strong>`,
    ];
    explain = `Octets delta du fragment 1 : ${fragments[0].delBytes.map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} (LE) = ${fragments[0].lcn}. (Delta relatif : premier fragment → LCN absolu.)`;
  }

  // Colorier les bytes par fragment
  const rows = [];
  for (let i = 0; i < allBytes.length; i += 16) {
    const slice = allBytes.slice(i, i+16);
    rows.push({ offset: i.toString(16).toUpperCase().padStart(8,'0'), bytes: slice });
  }

  // Build highlights
  const highlights = [];
  let pos = 0;
  fragments.forEach((f, fi) => {
    const colors = ['--cyan','--green','--gold','--purple'];
    highlights.push({from:pos, to:pos, color:'--gold', label:`Header F${fi+1}`});
    pos++;
    highlights.push({from:pos, to:pos+f.lenBytes.length-1, color:colors[fi%4], label:`Longueur F${fi+1}`});
    pos += f.lenBytes.length;
    highlights.push({from:pos, to:pos+f.delBytes.length-1, color:'--orange', label:`Delta F${fi+1}`});
    pos += f.delBytes.length;
  });
  highlights.push({from:pos, to:pos, color:'--dim', label:'Terminateur 0x00'});

  return {
    title: "NTFS — Décodage d'une Run List",
    category: "Système de fichiers",
    difficulty: "hard",
    scenario: `Dans un attribut <strong>$DATA</strong> non-résident d'un enregistrement MFT, tu trouves cette Run List.`,
    hexDump: renderHexDump(rows, highlights, {cols: 16, title: 'Run List dans attribut $DATA non-résident'}),
    question: qText,
    type: "number",
    answer,
    hints,
    explain,
    legend: `<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:.7rem;margin-top:.4rem">
      <span><span style="color:var(--gold)">■</span> Header</span>
      <span><span style="color:var(--cyan)">■</span> Longueur</span>
      <span><span style="color:var(--orange)">■</span> Delta LCN</span>
      <span><span style="color:var(--dim)">■</span> Terminateur</span>
    </div>`,
  };
}

// ── Exercice Bitmap exFAT ──
function makeBitmapExercise() {
  // Générer des octets bitmap réalistes avec des clusters occupés
  const bitmapOctets = Array.from({length:24}, () => rand(0,255));
  // Assurer qu'il y a au moins un octet non-FF
  let firstFreeOctetIdx = -1;
  for (let i = 0; i < bitmapOctets.length; i++) {
    if (bitmapOctets[i] !== 0xFF) { firstFreeOctetIdx = i; break; }
  }
  if (firstFreeOctetIdx === -1) {
    bitmapOctets[rand(4,12)] = rand(0, 254);
    for (let i = 0; i < bitmapOctets.length; i++) {
      if (bitmapOctets[i] !== 0xFF) { firstFreeOctetIdx = i; break; }
    }
  }

  // Trouver le premier bit libre
  let firstFreeCluster = -1;
  for (let i = 0; i < bitmapOctets.length; i++) {
    const b = bitmapOctets[i];
    for (let bit = 0; bit < 8; bit++) {
      if (!((b >> bit) & 1)) {
        firstFreeCluster = 2 + i * 8 + bit; // exFAT commence à 2
        break;
      }
    }
    if (firstFreeCluster >= 0) break;
  }

  const question = rand(0,1);
  let qText, answer, hints, explain;

  const firstFreeOctet = bitmapOctets[firstFreeOctetIdx];
  const firstFreeBit   = [...Array(8)].findIndex((_,b) => !((firstFreeOctet >> b) & 1));

  if (question === 0) {
    answer = String(firstFreeCluster);
    qText = `Quel est le numéro du <strong>premier cluster libre</strong> sur ce volume exFAT ?`;
    hints = [
      `En exFAT, la bitmap d'allocation est <strong>LSB first</strong> : le bit 0 de l'octet 0 correspond au cluster 2 (les clusters 0 et 1 sont réservés).`,
      `Un bit à <strong>1</strong> = cluster occupé. Un bit à <strong>0</strong> = cluster libre. Cherche le premier bit 0 en lisant de gauche à droite, bit 0 à bit 7 dans chaque octet.`,
      `Offset 0x${(firstFreeOctetIdx).toString(16).padStart(2,'0')} = <span style="color:var(--gold);font-weight:700">0x${firstFreeOctet.toString(16).toUpperCase().padStart(2,'0')}</span> = ${firstFreeOctet.toString(2).padStart(8,'0')}b. Le bit ${firstFreeBit} est à 0 → cluster ${2 + firstFreeOctetIdx*8 + firstFreeBit}.`,
    ];
    explain = `Octet ${firstFreeOctetIdx} = 0x${firstFreeOctet.toString(16).toUpperCase().padStart(2,'0')} = ${firstFreeOctet.toString(2).padStart(8,'0')}. Bit ${firstFreeBit} = 0 → cluster 2 + ${firstFreeOctetIdx}×8 + ${firstFreeBit} = <strong>${firstFreeCluster}</strong>.`;
  } else {
    const targetOctet = firstFreeOctetIdx;
    const hexVal = bitmapOctets[targetOctet].toString(16).toUpperCase().padStart(2,'0');
    answer = `0x${hexVal}`;
    qText = `L'offset <strong>0x${targetOctet.toString(16).toUpperCase().padStart(2,'0').padStart(4,'0')}</strong> de la bitmap correspond à quels clusters ? Donne la valeur hex de cet octet.`;
    hints = [
      `Chaque octet représente 8 clusters consécutifs. L'octet à l'offset N représente les clusters 2+N×8 à 2+N×8+7.`,
      `Offset 0x${targetOctet.toString(16)} → clusters ${2+targetOctet*8} à ${2+targetOctet*8+7}. Lis directement la valeur hex à cet offset.`,
      `L'octet est <span style="color:var(--gold);font-weight:700">0x${hexVal}</span> = ${bitmapOctets[targetOctet].toString(2).padStart(8,'0')}b. Les bits à 0 indiquent les clusters libres dans cette plage.`,
    ];
    explain = `Offset 0x${targetOctet.toString(16).padStart(4,'0')} = 0x${hexVal}. Représente les clusters ${2+targetOctet*8}-${2+targetOctet*8+7}.`;
    answer = hexVal;
  }

  const rows = [];
  for (let i = 0; i < bitmapOctets.length; i += 16) {
    const slice = bitmapOctets.slice(i, i+16);
    rows.push({
      offset: i.toString(16).toUpperCase().padStart(8,'0'),
      bytes: slice,
    });
  }

  return {
    title: "exFAT — Analyse de la $Bitmap",
    category: "Système de fichiers",
    difficulty: "hard",
    scenario: `Tu examines la <strong>bitmap d'allocation</strong> ($Bitmap) d'un volume exFAT.`,
    hexDump: renderHexDump(rows, [
      {from: firstFreeOctetIdx, to: firstFreeOctetIdx, color:'--gold', label:'Premier octet avec cluster libre'},
    ], {cols: 16, title: '$Bitmap exFAT — chaque octet = 8 clusters (LSB first)'}),
    question: qText,
    type: "text",
    answer,
    hints,
    explain,
  };
}

// ── Exercice Entier signé Little Endian ──
function makeSignedLEExercise() {
  const bits = [16,24,32][rand(0,2)];
  const nBytes = bits / 8;
  const isNeg  = Math.random() > 0.4;
  const maxAbs = Math.min(Math.pow(2, bits-1)-1, 0xFFFFFF);
  const absVal = rand(256, maxAbs);
  const val    = isNeg ? -absVal : absVal;
  let raw = isNeg ? (Math.pow(2, bits) + val) : val;
  const leBytes = [];
  for (let i = 0; i < nBytes; i++) { leBytes.push(raw & 0xFF); raw >>= 8; }

  const context = rand(0,2);
  const scenarios = [
    `À l'offset <strong>0x1A</strong> d'un enregistrement MFT, tu trouves un entier <strong>signé ${bits} bits</strong> en Little Endian.`,
    `Dans un header de volume FAT, l'offset <strong>0x2C</strong> contient un entier <strong>signé ${bits} bits</strong> LE.`,
    `Lors d'une analyse de RAM dump, tu repères ces ${nBytes} octets correspondant à une valeur <strong>signée ${bits} bits</strong> LE.`,
  ];

  const row0 = { offset: '00000000', bytes: [...new Array(nBytes>1?rand(0,4):0).fill(0), ...leBytes, ...new Array(16-nBytes).fill(0)].slice(0,16) };

  return {
    title: `Entier signé ${bits} bits — Little Endian`,
    category: "Représentation des données",
    difficulty: bits === 16 ? "easy" : bits === 24 ? "medium" : "hard",
    scenario: scenarios[context],
    hexDump: `<div class="hex-display" style="gap:6px;margin:.5rem 0">
      ${leBytes.map(b => `<span class="hex-byte highlight">${b.toString(16).toUpperCase().padStart(2,'0')}</span>`).join('')}
      <span class="hex-sep" style="margin-left:4px">(${nBytes} octets, LE)</span>
    </div>`,
    question: `Quelle est la <strong>valeur décimale signée</strong> de cet entier ${bits} bits ?`,
    type: "number",
    answer: String(val),
    hints: [
      `Inverser les octets (Little Endian) : ${[...leBytes].reverse().map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} → 0x${[...leBytes].reverse().map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join('')}`,
      isNeg
        ? `Le bit de poids fort est à 1 → nombre négatif. Appliquer le complément à 2 : complément de 0x${[...leBytes].reverse().map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join('')} sur ${bits} bits.`
        : `Le bit de poids fort est à 0 → nombre positif. Convertir directement en décimal.`,
      `Résultat : <strong>${val.toLocaleString('fr-CH')}</strong>`,
    ],
    explain: `Octets LE inversés : 0x${[...leBytes].reverse().map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join('')}${isNeg ? ` → négatif (complément à 2) → ${val}` : ` = ${val}`}`,
  };
}

// ── Exercice Représentation binaire ──
function makeBinaryExercise() {
  const mode = rand(0,3);
  let qText, answer, hints, explain, display;

  if (mode === 0) {
    // Hex → Binaire
    const val = rand(16, 255);
    const hex = val.toString(16).toUpperCase().padStart(2,'0');
    const bin = val.toString(2).padStart(8,'0');
    answer = bin;
    display = `<span class="hex-byte" style="font-size:1.1rem;padding:.4rem .8rem">0x${hex}</span>`;
    qText = `Donner la <strong>représentation binaire sur 8 bits</strong> de <span class="hex-byte">0x${hex}</span>`;
    hints = [
      `Chaque chiffre hexadécimal = 4 bits. ${hex[0]} (0x${hex[0]}) = ${parseInt(hex[0],16).toString(2).padStart(4,'0')} · ${hex[1]} (0x${hex[1]}) = ${parseInt(hex[1],16).toString(2).padStart(4,'0')}`,
      `${hex} = ${parseInt(hex[0],16)} × 16 + ${parseInt(hex[1],16)} = ${val}. ${val} en binaire = ?`,
      `Réponse : <strong>${bin}</strong> (vérif : ${bin.split('').map((b,i)=>b==='1'?Math.pow(2,7-i):0).reduce((a,b)=>a+b)} = ${val})`,
    ];
    explain = `0x${hex} = ${val} = <strong>${bin}</strong>. Méthode : ${hex[0]}→${parseInt(hex[0],16).toString(2).padStart(4,'0')}, ${hex[1]}→${parseInt(hex[1],16).toString(2).padStart(4,'0')}`;
  } else if (mode === 1) {
    // Binaire → Hex
    const val = rand(16, 255);
    const hex = val.toString(16).toUpperCase().padStart(2,'0');
    const bin = val.toString(2).padStart(8,'0');
    answer = hex;
    display = `<div class="bits-row" style="margin:.5rem 0">${bin.split('').map(b=>`<span class="bit bit-${b}">${b}</span>`).join('')}</div>`;
    qText = `Convertir ce nombre binaire 8 bits en <strong>hexadécimal</strong> :`;
    hints = [
      `Diviser en 2 groupes de 4 bits : ${bin.slice(0,4)} | ${bin.slice(4,8)}`,
      `${bin.slice(0,4)} = ${parseInt(bin.slice(0,4),2)} = 0x${parseInt(bin.slice(0,4),2).toString(16).toUpperCase()} · ${bin.slice(4,8)} = ${parseInt(bin.slice(4,8),2)} = 0x${parseInt(bin.slice(4,8),2).toString(16).toUpperCase()}`,
      `→ <strong>0x${hex}</strong>`,
    ];
    explain = `${bin} → ${bin.slice(0,4)}=${parseInt(bin.slice(0,4),2)} (0x${parseInt(bin.slice(0,4),2).toString(16).toUpperCase()}) | ${bin.slice(4,8)}=${parseInt(bin.slice(4,8),2)} (0x${parseInt(bin.slice(4,8),2).toString(16).toUpperCase()}) → <strong>0x${hex}</strong>`;
  } else if (mode === 2) {
    // Bits minimum pour N caractères
    const n = rand(3, 200);
    const bits = Math.ceil(Math.log2(n));
    answer = String(bits);
    display = `<div style="font-size:1.2rem;font-weight:700;color:var(--cyan);margin:.5rem 0">${n} caractères</div>`;
    qText = `Combien de <strong>bits minimum</strong> faut-il pour représenter <strong>${n} caractères distincts</strong> ?`;
    hints = [
      `Avec N bits, on peut représenter 2ᴺ combinaisons différentes. Il faut 2ᴺ ≥ ${n}.`,
      `2^${bits-1} = ${Math.pow(2,bits-1)} ${Math.pow(2,bits-1) < n ? `< ${n}` : `≥ ${n}`}. 2^${bits} = ${Math.pow(2,bits)} ${Math.pow(2,bits) >= n ? `≥ ${n}` : ``}. Donc ${bits} bits.`,
      `⌈log₂(${n})⌉ = <strong>${bits} bits</strong>`,
    ];
    explain = `2^${bits-1}=${Math.pow(2,bits-1)} < ${n} ≤ ${Math.pow(2,bits)}=2^${bits} → <strong>${bits} bits</strong> minimum.`;
  } else {
    // BCD
    const digits = [rand(0,9), rand(0,9), rand(0,9)];
    const bcd = digits.map(d => d.toString(2).padStart(4,'0')).join(' ');
    const dec = digits[0]*100 + digits[1]*10 + digits[2];
    answer = String(dec);
    display = `<code style="font-size:1rem;color:var(--cyan);letter-spacing:.12em">${bcd}</code>`;
    qText = `Quelle est la valeur en <strong>base 10</strong> de ce nombre en <strong>BCD</strong> ?`;
    hints = [
      `BCD (Binary Coded Decimal) : chaque groupe de 4 bits encode UN chiffre décimal (0–9).`,
      `${digits[0].toString(2).padStart(4,'0')} → ${digits[0]} · ${digits[1].toString(2).padStart(4,'0')} → ${digits[1]} · ${digits[2].toString(2).padStart(4,'0')} → ${digits[2]}`,
      `→ <strong>${dec}</strong>`,
    ];
    explain = `${bcd} → chiffres ${digits.join(', ')} → <strong>${dec}</strong>`;
  }

  return {
    title: "Représentation — Bases & Encodages",
    category: "Représentation des données",
    difficulty: "easy",
    scenario: "Exercice de représentation des données, fondamental en forensique numérique.",
    hexDump: display,
    question: qText,
    type: "text",
    answer,
    hints,
    explain,
  };
}

// ── Registre des générateurs ──
// ═══════════════════════════════════════════════════════════════
// EXERCICES D'EXAMEN — NOUVEAUX
// ═══════════════════════════════════════════════════════════════

// ── EX-EXAM-1 : FAT16 — Lire cluster + date dans une entrée SFN ──
function makeFAT16SFNExercise() {
  const le16 = v => [v & 0xFF, (v >> 8) & 0xFF];
  const le32 = v => [v & 0xFF, (v>>8)&0xFF, (v>>16)&0xFF, (v>>24)&0xFF];
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;

  // Générer un cluster de départ réaliste pour FAT16
  const cluster = rand16(2, 255);
  // Générer une date FAT16 : bits 15-9=années depuis 1980, 8-5=mois, 4-0=jour
  const year  = rand16(10, 43); // 1990-2023
  const month = rand16(1, 12);
  const day   = rand16(1, 28);
  const dateWord = (year << 9) | (month << 5) | day;

  // Générer une taille de fichier
  const filesize = rand16(1024, 500000);

  // Construire les 32 octets SFN
  const sfn = new Array(32).fill(0);
  // Nom + extension
  const names = ['RAPPORT ', 'IMAGES  ', 'RAPPORT ', 'PHOTOS  ', 'DONNEES '];
  const exts  = ['TXT', 'JPG', 'PDF', 'DOC', 'XLS'];
  const ni = rand16(0, names.length-1);
  names[ni].split('').forEach((c,i) => sfn[i] = c.charCodeAt(0));
  exts[ni].split('').forEach((c,i) => sfn[8+i] = c.charCodeAt(0));
  sfn[0x0B] = 0x20; // archive
  // Date écriture at 0x18-0x19
  le16(dateWord).forEach((b,i) => sfn[0x18+i] = b);
  // Date création at 0x10-0x11 (même)
  le16(dateWord).forEach((b,i) => sfn[0x10+i] = b);
  // Cluster de départ at 0x1A-0x1B
  le16(cluster).forEach((b,i) => sfn[0x1A+i] = b);
  // Taille at 0x1C-0x1F
  le32(filesize).forEach((b,i) => sfn[0x1C+i] = b);

  const row0 = { offset: '00000000', bytes: sfn.slice(0,16) };
  const row1 = { offset: '00000010', bytes: sfn.slice(16,32) };

  const questionType = rand16(0,1);
  let qText, answer, hints, explain;

  const clusterHex = cluster.toString(16).toUpperCase().padStart(4,'0');
  const dateHex    = dateWord.toString(16).toUpperCase().padStart(4,'0');

  const monthNames = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

  if (questionType === 0) {
    // Demander le cluster de départ
    answer = clusterHex;
    qText = `Quel est le <strong>numéro de cluster de départ</strong> du fichier (en hexadécimal) ?`;
    hints = [
      `Le cluster de départ est aux offsets <strong>0x1A–0x1B</strong> sur 2 octets en Little Endian.`,
      `Lis les octets aux positions 0x1A et 0x1B (bytes 26-27 de l'entrée).`,
      `Octets = <span style="color:var(--cyan);font-weight:700">${sfn[0x1A].toString(16).toUpperCase().padStart(2,'0')} ${sfn[0x1B].toString(16).toUpperCase().padStart(2,'0')}</span> → Little Endian → inverse les deux octets.`,
      `Cluster = <strong>${clusterHex}</strong> (0x${sfn[0x1B].toString(16).toUpperCase()}${sfn[0x1A].toString(16).toUpperCase().padStart(2,'0')})`
    ];
    explain = `Offset 0x1A-0x1B = <code>${sfn[0x1A].toString(16).toUpperCase().padStart(2,'0')} ${sfn[0x1B].toString(16).toUpperCase().padStart(2,'0')}</code> → Little Endian → cluster <strong>0x${clusterHex}</strong> = ${cluster} déc.`;
  } else {
    // Demander la date
    answer = `${String(day).padStart(2,'0')} ${monthNames[month-1]} ${1980+year}`;
    qText = `Quelle est la <strong>date de création</strong> du fichier (jj mois aaaa) ? <em>Offset 0x10–0x11</em>`;
    hints = [
      `La date est encodée sur 2 octets à l'offset <strong>0x10–0x11</strong> en Little Endian.`,
      `Lis les 2 octets, inverse (LE), tu obtiens le mot de date (16 bits).`,
      `Mot de date = <span style="color:var(--gold);font-weight:700">0x${dateHex}</span> = ${dateWord} en décimal = ${dateWord.toString(2).padStart(16,'0')} en binaire.`,
      `Bits 15-9 = années depuis 1980 (${year} → ${1980+year}), bits 8-5 = mois (${month} = ${monthNames[month-1]}), bits 4-0 = jour (${day}).`,
      `Réponse : <strong>${String(day).padStart(2,'0')} ${monthNames[month-1]} ${1980+year}</strong>`
    ];
    explain = `0x${sfn[0x10].toString(16).toUpperCase().padStart(2,'0')} ${sfn[0x11].toString(16).toUpperCase().padStart(2,'0')} → LE → 0x${dateHex} = ${dateWord.toString(2).padStart(16,'0')} → année=${1980+year}, mois=${monthNames[month-1]}, jour=${day}.`;
  }

  return {
    title: 'FAT16 — Lecture d\'une entrée SFN',
    category: 'Système de fichiers FAT',
    difficulty: 'medium',
    scenario: `Tu analyses une entrée SFN (Short File Name) de 32 octets issue du répertoire racine d'une clé USB FAT16.`,
    hexDump: renderHexDump([row0, row1], [
      questionType === 0
        ? {from:0x1A,to:0x1B,color:'--cyan',label:'Cluster départ'}
        : {from:0x10,to:0x11,color:'--gold',label:'Date création'},
    ], {cols: 32, title: 'Entrée SFN (32 octets) — répertoire racine FAT16'}),
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">Layout SFN : <code>0x00–07</code> Nom · <code>0x08–0A</code> Ext · <code>0x0B</code> Attr · <code>0x10–11</code> Date créa · <code>0x18–19</code> Date écrit · <code>0x1A–1B</code> Cluster · <code>0x1C–1F</code> Taille</div>`,
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-2 : FAT16 — Diagnostic Root Directory plein ──
function makeFAT16RootFullExercise() {
  // Générer un nombre d'entrées root aléatoire
  const rootCount = [64, 128, 224, 512][Math.floor(Math.random()*4)];

  // Simuler une entrée SFN normale au début du root dir
  const sfn = new Array(32).fill(0);
  'FICHIER '.split('').forEach((c,i) => sfn[i] = c.charCodeAt(0));
  'TXT'.split('').forEach((c,i) => sfn[8+i] = c.charCodeAt(0));
  sfn[0x0B] = 0x20;
  // Date quelconque
  [0x24, 0x58].forEach((b,i) => sfn[0x10+i] = b);
  // Taille 2 Ko
  [0x00, 0x08, 0x00, 0x00].forEach((b,i) => sfn[0x1C+i] = b);
  // Cluster
  [0x03, 0x00].forEach((b,i) => sfn[0x1A+i] = b);

  // Entrée qui semble vide (0xE5 = effacée, pas libre)
  const sfnDel = new Array(32).fill(0);
  sfnDel[0] = 0xE5; // effacée
  'ANCIEN  '.slice(1).split('').forEach((c,i) => sfnDel[i+1] = c.charCodeAt(0));
  'DOC'.split('').forEach((c,i) => sfnDel[8+i] = c.charCodeAt(0));
  sfnDel[0x0B] = 0x20;
  [0x02, 0x00].forEach((b,i) => sfnDel[0x1A+i] = b);
  [0x00, 0x10, 0x00, 0x00].forEach((b,i) => sfnDel[0x1C+i] = b);

  const row0 = { offset: '00000000', bytes: sfn.slice(0,16) };
  const row1 = { offset: '00000010', bytes: sfn.slice(16,32) };
  const row2 = { offset: '00000020', bytes: sfnDel.slice(0,16) };
  const row3 = { offset: '00000030', bytes: sfnDel.slice(16,32) };

  const q = Math.floor(Math.random()*2);
  let qText, answer, hints, explain;
  // Bug fix : la 2ème question (RootEntryCount) ne nécessite pas le dump SFN
  // → on affiche un dump différent (BPB) ou pas de dump du tout selon la question
  let useDump = true;

  if (q === 0) {
    // Fix #4 : la question demande maintenant la valeur hex du marqueur,
    // ce qui est cohérent avec la réponse "0xE5"
    answer = '0xe5';
    qText = `Dans le répertoire racine FAT16, quel est le <strong>code hexadécimal</strong> qui marque une entrée SFN comme <em>supprimée</em> (l'entrée visible à l'offset 0x20 a justement ce marqueur) ?`;
    hints = [
      `L'octet 0 d'une entrée SFN indique son état. Regarde le 1er octet à l'offset 0x20.`,
      `0x00 = fin du répertoire (aucune entrée valide après). Il existe un autre marqueur pour "supprimé".`,
      `Le marqueur est <strong>0xE5</strong> — entrée marquée comme supprimée (les données peuvent encore être récupérées par carving).`,
    ];
    explain = `<strong>0xE5</strong> = entrée supprimée. Les clusters et la taille sont souvent encore présents → récupération possible par file carving.`;
  } else {
    answer = String(rootCount);
    qText = `Un volume FAT16 a <strong>RootEntryCount = ${rootCount}</strong> (offset BPB 0x11). Combien d'entrées de fichiers/dossiers au maximum peut contenir ce répertoire racine ?`;
    hints = [
      `En FAT16, le Root Directory est de <strong>taille fixe</strong>. Il contient exactement RootEntryCount entrées de 32 octets chacune.`,
      `Taille total root dir = ${rootCount} × 32 = ${rootCount*32} octets.`,
      `Le nombre max d'entrées (fichiers + dossiers + LFN) = <strong>${rootCount}</strong>.`,
      `En FAT32, ce problème n'existe plus : le Root Dir est dynamique dans la zone de données.`,
    ];
    explain = `FAT16 Root Entry Count = ${rootCount} → maximum ${rootCount} entrées. Chaque LFN utilise 1 entrée supplémentaire par tranche de 13 caractères.`;
    useDump = false; // pas de dump SFN pour cette question — le sujet est le BPB
  }

  return {
    title: 'FAT16 — Répertoire Racine',
    category: 'Système de fichiers FAT',
    difficulty: 'easy',
    scenario: useDump
      ? `Extrait du répertoire racine d'une clé USB FAT16. Le 1er octet de l'entrée indique son statut. Le 2ème offset commence une entrée supprimée (0xE5).`
      : `Tu analyses le BPB d'un volume FAT16. Le champ <code>RootEntryCount</code> à l'offset 0x11 (LE 2 octets) vaut <strong>${rootCount}</strong>.`,
    hexDump: useDump
      ? renderHexDump([row0, row1, row2, row3], [
          {from:0x00, to:0x00, color:'--cyan', label:'État 1ère entrée'},
          {from:0x20, to:0x20, color:'--red',  label:'0xE5 = supprimée'},
        ], {cols: 32, title: 'Répertoire racine — 2 entrées SFN consécutives'})
      : '',
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-3 : NTFS — Identifier les attributs dans une entrée MFT ──
function makeNTFSMFTAttributeExercise() {
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;

  // Attributs NTFS courants
  const ATTRS = {
    0x10: '$STANDARD_INFORMATION',
    0x30: '$FILE_NAME',
    0x40: '$OBJECT_ID',
    0x80: '$DATA',
    0x90: '$INDEX_ROOT',
    0xA0: '$INDEX_ALLOCATION',
    0xB0: '$BITMAP',
  };

  // Générer 3-4 attributs pour cet enregistrement MFT
  const attrSet = [0x10, 0x30, 0x80]; // standard, filename, data (toujours présents)
  if (Math.random() > 0.5) attrSet.push(0x40); // object id

  // Construire une représentation simplifiée de la MFT entry
  // Header MFT (16 octets simplifiés)
  const mft = [];

  // FILE signature
  [0x46,0x49,0x4C,0x45, 0x30,0x00, 0x03,0x00, 0x00,0x00,0x00,0x00,0x00,0x00, 0x01,0x00].forEach(b => mft.push(b));
  // Record flags + size
  [0x01,0x00, 0x00,0x01, 0x00,0x04, 0x00,0x00].forEach(b => mft.push(b));

  // Offset vers 1er attribut (0x38 typique)
  const attrStart = 0x38;
  [attrStart,0x00].forEach(b => mft.push(b));
  [0x00,0x00,0x00,0x00,0x00,0x00].forEach(b => mft.push(b));

  // Numéro d'entrée MFT
  const mftNum = rand16(100,9999);
  [mftNum & 0xFF, (mftNum>>8)&0xFF, 0x00, 0x00, 0x01, 0x00].forEach(b => mft.push(b));

  // Padding jusqu'à attrStart
  while (mft.length < attrStart) mft.push(0);

  // Encoder les attributs
  const attrOffsets = {};
  for (const aType of attrSet) {
    attrOffsets[aType] = mft.length;
    mft.push(aType); mft.push(0x00); mft.push(0x00); mft.push(0x00); // type
    const aLen = aType === 0x80 ? 0x48 : 0x38; // DATA plus long
    [aLen, 0x00, 0x00, 0x00].forEach(b => mft.push(b)); // length
    mft.push(aType === 0x80 ? 0x01 : 0x00); // non-resident flag (0x80 = non-résidant)
    mft.push(0x00); // name length
    [0x18, 0x00].forEach(b => mft.push(b)); // attr offset
    [0x00, 0x00].forEach(b => mft.push(b)); // flags
    [0x00, 0x00].forEach(b => mft.push(b)); // ID
    // Body simplifié
    const bodyLen = aLen - 0x10;
    for (let i=0; i<bodyLen; i++) mft.push(Math.floor(Math.random()*256));
  }
  // END marker
  [0xFF, 0xFF, 0xFF, 0xFF].forEach(b => mft.push(b));

  // Construire les rows pour affichage (max 6 rows = 96 octets)
  const rows = [];
  for (let i=0; i < Math.min(mft.length, 96); i+=16) {
    rows.push({
      offset: i.toString(16).toUpperCase().padStart(8,'0'),
      bytes: mft.slice(i, i+16).map(b => b || 0)
    });
  }

  // Question sur le type d'attribut
  const qAttrType = attrSet[rand16(0, attrSet.length-1)];
  const qOffset = attrOffsets[qAttrType];
  const attrTypeHex = qAttrType.toString(16).toUpperCase().padStart(2,'0');

  let qText, answer, hints, explain;
  const q = rand16(0,2);

  if (q === 0) {
    answer = ATTRS[qAttrType];
    qText = `À l'offset <strong>0x${qOffset.toString(16).toUpperCase()}</strong>, le type d'attribut commence par l'octet <span style="color:var(--cyan);font-weight:700">0x${attrTypeHex} 00 00 00</span>. Quel est le <strong>nom de cet attribut NTFS</strong> ?`;
    hints = [
      `Les attributs NTFS ont un type encodé sur 4 octets en Little Endian au début de chaque attribut.`,
      `0x10 = $STANDARD_INFORMATION · 0x30 = $FILE_NAME · 0x80 = $DATA · 0x90 = $INDEX_ROOT`,
      `Type 0x${attrTypeHex} = <strong>${ATTRS[qAttrType]}</strong>`,
    ];
    explain = `Type 0x${attrTypeHex} → <strong>${ATTRS[qAttrType]}</strong>. Chaque attribut commence par son type sur 4 octets LE.`;
  } else if (q === 1) {
    answer = 'FILE';
    qText = `Quels sont les <strong>4 premiers octets</strong> (signature) d'un enregistrement MFT valide ? (répondre en ASCII)`;
    hints = [
      `La signature MFT est visible aux offsets 0x00–0x03.`,
      `0x46 = 'F', 0x49 = 'I', 0x4C = 'L', 0x45 = 'E'`,
      `Signature = <strong>"FILE"</strong>`,
    ];
    explain = `Tout enregistrement MFT valide commence par la signature ASCII <strong>"FILE"</strong> (0x46 0x49 0x4C 0x45).`;
  } else {
    answer = 'NON RESIDENT';
    qText = `L'attribut <strong>$DATA</strong> (type 0x80) a son flag Non-Résident (offset 0x08 dans l'attribut) mis à <strong>0x01</strong>. Que signifie cela ?`;
    hints = [
      `Le flag Non-Résident est à l'offset 0x08 de chaque header d'attribut.`,
      `0x00 = Résident → les données sont <strong>dans l'enregistrement MFT lui-même</strong>.`,
      `0x01 = Non-Résident → les données sont dans la <strong>zone de données</strong>, pointées par une runlist.`,
      `Réponse : le contenu de l'attribut est stocké <strong>hors du MFT</strong> dans la zone de données.`,
    ];
    explain = `Non-Résident (flag=1) = les données de l'attribut sont trop grandes pour tenir dans le MFT. Une runlist (Data Runs) pointe vers les clusters de la zone de données.`;
  }

  return {
    title: 'NTFS — Enregistrement MFT',
    category: 'Système de fichiers NTFS',
    difficulty: 'hard',
    scenario: `Tu examines un enregistrement MFT de 1024 octets (extrait simplifié). La signature "FILE" confirme un enregistrement valide. Les attributs s'enchaînent après l'offset 0x38.`,
    hexDump: renderHexDump(rows, [
      {from:0x00, to:0x03, color:'--green',  label:'Signature FILE'},
      {from:attrOffsets[qAttrType], to:attrOffsets[qAttrType]+3, color:'--cyan', label:'Type attribut'},
    ], {cols: 16, title: `Enregistrement MFT (FILE record) — entrée n°${mftNum}`}),
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-4 : EXT3 — Lire l'inode d'une entrée de répertoire ──
function makeEXT3InodeExercise() {
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;
  const le32   = v => [v & 0xFF, (v>>8)&0xFF, (v>>16)&0xFF, (v>>24)&0xFF];
  const le16   = v => [v & 0xFF, (v >> 8) & 0xFF];

  // Fichiers avec leurs inodes aléatoires
  const files = [
    { name: 'rapport_final.pdf', inode: rand16(10, 99), type: 0x01 },
    { name: 'image.jpg',          inode: rand16(100,999), type: 0x01 },
    { name: 'script.sh',          inode: rand16(10, 99), type: 0x01 },
  ];

  // Target = le 3ème fichier (fichier de vrai type)
  const target = files[rand16(0, files.length-1)];
  const targetInode = target.inode;

  // Construire le dump hex du répertoire EXT3
  // Structure ext3 dir_entry_2 : inode(4) + rec_len(2) + name_len(1) + file_type(1) + name(name_len)
  const buildEntry = (entry, isLast) => {
    const nameBytes = entry.name.split('').map(c => c.charCodeAt(0));
    const nameLen = nameBytes.length;
    // rec_len aligné sur 4 : minimum 8 + nameLen, padded to multiple of 4
    const minLen = 8 + nameLen;
    const recLen = isLast ? 128 : (Math.ceil(minLen/4)*4);
    const bytes = [
      ...le32(entry.inode),
      ...le16(recLen),
      nameLen,
      entry.type,
      ...nameBytes,
      ...new Array(recLen - 8 - nameLen).fill(0)
    ];
    return bytes;
  };

  // Construire un bloc de ~128 octets avec 2-3 entrées
  const entryBytes = [];
  const displayEntries = [
    { name: '.', inode: 2, type: 0x02 },
    { name: '..', inode: 2, type: 0x02 },
    target
  ];
  displayEntries.forEach((e, i) => {
    const isLast = i === displayEntries.length-1;
    entryBytes.push(...buildEntry(e, isLast));
  });

  // Rows hex (max 128 octets = 8 rows)
  const rows = [];
  for (let i=0; i < Math.min(entryBytes.length, 96); i+=16) {
    rows.push({
      offset: i.toString(16).toUpperCase().padStart(8,'0'),
      bytes: entryBytes.slice(i, i+16).map(b => b||0)
    });
  }

  // Trouver l'offset de l'inode du target dans le dump
  let targetOffset = 0;
  let pos = 0;
  for (let e of displayEntries) {
    if (e === target) { targetOffset = pos; break; }
    const nameLen = e.name.length;
    const minLen = 8 + nameLen;
    const recLen = Math.ceil(minLen/4)*4;
    pos += recLen;
  }

  const answer = String(targetInode);
  const qText = `Dans ce contenu de répertoire EXT3, à quel <strong>numéro d'inode</strong> dois-tu aller pour trouver les informations du fichier <strong>"${target.name}"</strong> ?`;
  const hints = [
    `En EXT3, le répertoire stocke pour chaque fichier : inode (4 octets LE) + rec_len (2 octets) + name_len (1 octet) + file_type (1 octet) + nom.`,
    `Les entrées "." et ".." viennent en premier. L'entrée "<strong>${target.name}</strong>" suit.`,
    `Les 4 premiers octets de l'entrée target sont <span style="color:var(--cyan);font-weight:700">${le32(targetInode).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</span> → LE → inode = <strong>${targetInode}</strong>.`,
    `Réponse : numéro d'inode = <strong>${targetInode}</strong>`,
  ];
  const explain = `Structure EXT3 dir_entry : 4 octets inode (LE) → ${le32(targetInode).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} → inode <strong>${targetInode}</strong> pour "${target.name}".`;

  return {
    title: 'EXT3 — Répertoire et Inodes',
    category: 'Système de fichiers EXT',
    difficulty: 'hard',
    scenario: `Tu examines un bloc de répertoire EXT3 en liste chaînée. Chaque entrée contient : inode (4 o LE), rec_len (2 o), name_len (1 o), file_type (1 o), puis le nom.`,
    hexDump: renderHexDump(rows, [
      {from: targetOffset, to: targetOffset+3, color:'--cyan', label:'Inode du fichier cible'},
    ], {cols: 16, title: 'Bloc de répertoire EXT3 — entrées en liste chaînée'}),
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">Structure dir_entry_2 EXT3 : [Inode 4o LE] [rec_len 2o] [name_len 1o] [type 1o] [nom]<br>file_type : 0x01 = fichier ordinaire · 0x02 = répertoire · 0x07 = symlink (spec ext2/3/4)</div>`,
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-5 : HFS+ — Trouver le cluster de début (Extents Overflow) ──
function makeHFSPlusClusterExercise() {
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;

  // Générer un numéro de cluster de départ pour un fichier HFS+
  const startBlock = rand16(0x100, 0xFFFF);
  const blockCount = rand16(10, 200); // nombre de blocs contigus
  const startBlockHex = startBlock.toString(16).toUpperCase().padStart(8,'0');
  // logicalSize = blocCount × blockSize (on simule blockSize = 4096 = 0x1000)
  const logicalSize = blockCount * 4096;
  // clumpSize typique : 0 (hint à l'implémentation, souvent 0)
  const clumpSize = 0;

  // HFS+ HFSPlusForkData (Apple TN1150) — Big Endian, 80 octets total :
  //   0x00-0x07 : logicalSize (UInt64 BE)
  //   0x08-0x0B : clumpSize   (UInt32 BE)
  //   0x0C-0x0F : totalBlocks (UInt32 BE)
  //   0x10-0x6F : 8 × HFSPlusExtentDescriptor (8 octets : startBlock + blockCount, tous 2 en BE)
  const forkBytes = [];

  // logicalSize UInt64 BE (8 octets) — valeur assez grande pour tenir dans 64 bits
  // On divise en 2 UInt32 pour gérer la taille côté JS (limite 32 bits sur shift)
  const logicalHi = Math.floor(logicalSize / 0x100000000); // partie haute
  const logicalLo = logicalSize % 0x100000000;              // partie basse
  forkBytes.push(
    (logicalHi>>>24)&0xFF, (logicalHi>>>16)&0xFF, (logicalHi>>>8)&0xFF, logicalHi&0xFF,
    (logicalLo>>>24)&0xFF, (logicalLo>>>16)&0xFF, (logicalLo>>>8)&0xFF, logicalLo&0xFF
  );
  // clumpSize UInt32 BE (4 octets)
  forkBytes.push(
    (clumpSize>>>24)&0xFF, (clumpSize>>>16)&0xFF, (clumpSize>>>8)&0xFF, clumpSize&0xFF
  );
  // totalBlocks UInt32 BE (4 octets)
  forkBytes.push(
    (blockCount>>>24)&0xFF, (blockCount>>>16)&0xFF, (blockCount>>>8)&0xFF, blockCount&0xFF
  );

  // Extent 0 (premier et seul) à l'offset 0x10
  forkBytes.push(
    (startBlock>>>24)&0xFF, (startBlock>>>16)&0xFF, (startBlock>>>8)&0xFF, startBlock&0xFF, // startBlock BE
    (blockCount>>>24)&0xFF, (blockCount>>>16)&0xFF, (blockCount>>>8)&0xFF, blockCount&0xFF  // blockCount BE
  );

  // 7 extents vides
  for (let i=0; i<7; i++) {
    forkBytes.push(0,0,0,0, 0,0,0,0);
  }

  // Padding jusqu'à 80 octets (5 × 16)
  while (forkBytes.length < 80) forkBytes.push(0);

  const rows = [];
  for (let i=0; i<80; i+=16) {
    rows.push({
      offset: i.toString(16).toUpperCase().padStart(8,'0'),
      bytes: forkBytes.slice(i, i+16)
    });
  }

  const answer = startBlockHex;
  const qText = `Ce HFSPlusForkData décrit un fichier occupant <strong>${blockCount} blocs dans un seul extent</strong>. À quel <strong>numéro de bloc de départ</strong> (startBlock du premier extent) se trouvent les données ? (en hexadécimal, 8 chiffres)`;
  const hints = [
    `En HFS+, les données sont organisées en "forks" (data fork + resource fork). Chaque fork est décrit par un HFSPlusForkData de 80 octets.`,
    `Structure HFSPlusForkData (Apple TN1150) : logicalSize (UInt64 BE, 8 o) + clumpSize (UInt32 BE, 4 o) + totalBlocks (UInt32 BE, 4 o) + 8 extents × 8 o.`,
    `Le premier extent commence à l'offset <strong>0x10</strong> (après les 16 octets d'en-tête). Il contient startBlock (4 o BE) puis blockCount (4 o BE).`,
    `Octets 0x10–0x13 = <span style="color:var(--cyan);font-weight:700">${[((startBlock>>>24)&0xFF),((startBlock>>>16)&0xFF),((startBlock>>>8)&0xFF),(startBlock&0xFF)].map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</span> → Big Endian → startBlock = <strong>0x${startBlockHex}</strong>`,
  ];
  const explain = `HFS+ utilise le Big Endian (contrairement à FAT/NTFS). Offset 0x10–0x13 = startBlock du premier extent = <strong>0x${startBlockHex}</strong> = ${startBlock} décimal.`;

  return {
    title: 'HFS+ — HFSPlusForkData (Catalog)',
    category: 'Système de fichiers HFS+',
    difficulty: 'hard',
    scenario: `Tu analyses un <strong>HFSPlusForkData</strong> issu du fichier Catalog (Apple TN1150). Ce format est en <strong>Big Endian</strong> (contrairement à FAT/NTFS). Le fichier tient dans un seul extent.`,
    hexDump: renderHexDump(rows, [
      {from:0x00, to:0x07, color:'--dim',  label:'logicalSize (UInt64 BE)'},
      {from:0x08, to:0x0B, color:'--dim',  label:'clumpSize (UInt32 BE)'},
      {from:0x0C, to:0x0F, color:'--gold', label:'totalBlocks (UInt32 BE)'},
      {from:0x10, to:0x13, color:'--cyan', label:'startBlock extent 0 (BE)'},
      {from:0x14, to:0x17, color:'--green',label:'blockCount extent 0 (BE)'},
    ], {cols: 16, title: 'HFSPlusForkData (80 octets, Big Endian) — Apple TN1150'}),
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">⚠️ HFS+ = <strong>Big Endian</strong> · Structure HFSPlusForkData (Apple TN1150) :<br>[logicalSize 8o BE][clumpSize 4o BE][totalBlocks 4o BE][extent0: startBlock 4o + blockCount 4o][extents 1-7…]</div>`,
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-6 : FAT16 — Reconstruction d'un Long File Name (LFN) ──
// Inspiré de l'examen rattrapage 2023-2024 Q2a (fichier "Bear").
// Structure LFN : chaque entrée LFN (32 octets) porte l'attribut 0x0F à l'offset 0x0B.
//   - Offset 0x00 : numéro de séquence (bit 6 = 0x40 pour la DERNIÈRE entrée logique).
//   - Offsets 0x01–0x0A : 5 caractères UTF-16 LE (10 octets)
//   - Offsets 0x0E–0x19 : 6 caractères UTF-16 LE (12 octets)
//   - Offsets 0x1C–0x1F : 2 caractères UTF-16 LE (4 octets)
// Les entrées sont stockées à l'envers : la dernière entrée (bit 0x40) est en tête,
// puis #N-1, ... jusqu'à #1 juste avant le SFN.
function makeFAT16LFNExercise() {
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;

  // Choisir un nom de fichier réaliste avec extension
  const names = [
    'Ma petite présentation finale.pptx',
    'Vacances été 2023 - Italie.jpg',
    'Rapport annuel intermédiaire.docx',
    'Photo famille Noël 2022.png',
    'Document confidentiel secret.pdf',
    'Sauvegarde clients janvier.xlsx',
    'Reçu dîner anniversaire Anne.pdf',
    'Mon super projet forensique.txt',
  ];
  const longName = names[rand16(0, names.length-1)];
  // Le LFN est terminé par 0x0000 et padde avec 0xFFFF
  // Chaque entrée LFN porte 13 caractères UTF-16
  const charsPerEntry = 13;
  const numEntries = Math.ceil((longName.length + 1) / charsPerEntry); // +1 pour le \0 terminal

  // Construire la séquence complète de caractères UTF-16 (code points ASCII simplifiés)
  const utf16 = [];
  for (const c of longName) utf16.push(c.charCodeAt(0));
  utf16.push(0x0000); // terminateur
  // Padder avec 0xFFFF jusqu'à numEntries * 13 caractères
  while (utf16.length < numEntries * charsPerEntry) utf16.push(0xFFFF);

  // Construire les entrées LFN (stockées du haut vers le bas : #N en premier, #1 en dernier)
  const lfnEntries = []; // tableau d'arrays de 32 octets
  for (let e = numEntries; e >= 1; e--) {
    const entry = new Array(32).fill(0x00);
    // Octet 0 : numéro de séquence, bit 6 (0x40) pour la dernière logique = #N
    entry[0] = (e === numEntries) ? (0x40 | e) : e;
    entry[0x0B] = 0x0F; // Attribut LFN
    entry[0x0C] = 0x00; // reserved
    entry[0x0D] = 0x00; // checksum (simplifié à 0 pour l'exo)
    entry[0x1A] = 0x00; entry[0x1B] = 0x00; // cluster first always 0 pour LFN

    // Les 13 caractères de cette entrée dans l'ordre logique
    // Entrée #e contient les chars [ (e-1)*13 .. e*13 [
    const charBase = (e - 1) * charsPerEntry;
    // 5 chars UTF-16 LE à l'offset 0x01-0x0A
    for (let i = 0; i < 5; i++) {
      const c = utf16[charBase + i];
      entry[0x01 + 2*i]     = c & 0xFF;
      entry[0x01 + 2*i + 1] = (c >> 8) & 0xFF;
    }
    // 6 chars UTF-16 LE à l'offset 0x0E-0x19
    for (let i = 0; i < 6; i++) {
      const c = utf16[charBase + 5 + i];
      entry[0x0E + 2*i]     = c & 0xFF;
      entry[0x0E + 2*i + 1] = (c >> 8) & 0xFF;
    }
    // 2 chars UTF-16 LE à l'offset 0x1C-0x1F
    for (let i = 0; i < 2; i++) {
      const c = utf16[charBase + 11 + i];
      entry[0x1C + 2*i]     = c & 0xFF;
      entry[0x1C + 2*i + 1] = (c >> 8) & 0xFF;
    }
    lfnEntries.push(entry);
  }

  // Construire une entrée SFN minimaliste qui suit les LFN
  const sfn = new Array(32).fill(0x00);
  // Short name = "BEAR    TXT" style (simplifié à partir du vrai nom)
  const base = longName.split('.')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) + '~1';
  const ext = (longName.split('.').pop() || 'TXT').toUpperCase().slice(0, 3).padEnd(3, ' ');
  for (let i = 0; i < 8; i++) sfn[i] = (base.charAt(i) || ' ').charCodeAt(0);
  for (let i = 0; i < 3; i++) sfn[8+i] = ext.charCodeAt(i);
  sfn[0x0B] = 0x20; // archive
  // Cluster + taille quelconques
  sfn[0x1A] = 0x08; sfn[0x1B] = 0x00;
  sfn[0x1C] = 0x00; sfn[0x1D] = 0x20; sfn[0x1E] = 0x00; sfn[0x1F] = 0x00;

  // Assembler les rows hex (toutes les LFN + le SFN, 32 octets = 2 rows de 16)
  const allBytes = [];
  lfnEntries.forEach(e => e.forEach(b => allBytes.push(b)));
  sfn.forEach(b => allBytes.push(b));

  const rows = [];
  for (let i = 0; i < allBytes.length; i += 16) {
    rows.push({
      offset: i.toString(16).toUpperCase().padStart(8,'0'),
      bytes: allBytes.slice(i, i+16)
    });
  }

  // Question : reconstituer le long nom du fichier
  const answer = longName;
  const qText = `Cette entrée de répertoire FAT contient un <strong>Long File Name (LFN)</strong> réparti sur <strong>${numEntries} entrée(s)</strong> de 32 octets, suivi d'une entrée SFN. Reconstitue le <strong>nom complet du fichier</strong> (extension comprise — accents, casse et espaces sont tolérés à la validation).`;
  const hints = [
    `Les entrées LFN ont l'attribut <strong>0x0F</strong> à l'offset 0x0B (facile à repérer).`,
    `Chaque entrée LFN porte 13 caractères en UTF-16 LE aux offsets : 0x01–0x0A (5 chars) + 0x0E–0x19 (6 chars) + 0x1C–0x1F (2 chars).`,
    `L'ordre physique est <strong>inverse</strong> de l'ordre logique : la 1ère entrée en mémoire porte le bit 0x40 sur son premier octet → c'est la <strong>dernière</strong> entrée logique (contient la fin du nom).`,
    `Lis les entrées à l'envers : assemble les caractères dans l'ordre #1, #2, …, #${numEntries}. Les octets <code>FF FF</code> = padding, <code>00 00</code> = terminateur.`,
    `Réponse : <strong>${longName}</strong>`,
  ];
  const explain = `LFN reconstruit : <strong>${longName}</strong>. Chaque entrée LFN se reconnaît à l'attribut 0x0F @ offset 0x0B. Ordre logique : entrée portant le bit 0x40 = dernière du nom ; les entrées précédentes contiennent le début. Encodage UTF-16 LE aux offsets 0x01 (5 chars), 0x0E (6 chars), 0x1C (2 chars).`;

  return {
    title: 'FAT16 — Reconstruction d\'un Long File Name (LFN)',
    category: 'Système de fichiers FAT',
    difficulty: 'hard',
    scenario: `Extrait du répertoire racine d'une clé USB FAT16. Le fichier porte un nom long (> 8.3), réparti sur plusieurs entrées LFN (attribut 0x0F) suivies d'une entrée SFN classique.`,
    hexDump: renderHexDump(rows, [
      {from:0x00, to:0x00, color:'--gold', label:'Seq # + bit 0x40 (dernière)'},
      {from:0x0B, to:0x0B, color:'--cyan', label:'Attr 0x0F = LFN'},
    ], {cols: 32, title: `LFN (${numEntries} entrée${numEntries>1?'s':''}) + SFN — 1 ligne = 1 entrée de 32 octets`}),
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">Structure entrée LFN (32 o) : [seq 1o][chars UTF-16 LE : 5 @ 0x01, 6 @ 0x0E, 2 @ 0x1C][attr=0x0F @ 0x0B]. Ordre physique inverse de l'ordre logique. Padding 0xFFFF, terminateur 0x0000.</div>`,
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-7 : NTFS Run List — Total de clusters occupés ──
// Inspiré de l'examen Q8 (runlist "12 11 01 30 00" → combien de clusters ?).
// On génère une Run List à 2-4 fragments et on demande la SOMME des length.
function makeNTFSRunListTotalExercise() {
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;
  const encodeVar = (val) => {
    if (val <= 0xFF)     return [val & 0xFF];
    if (val <= 0xFFFF)   return [val & 0xFF, (val >> 8) & 0xFF];
    if (val <= 0xFFFFFF) return [val & 0xFF, (val >> 8) & 0xFF, (val >> 16) & 0xFF];
    return [val & 0xFF, (val >> 8) & 0xFF, (val >> 16) & 0xFF, (val >> 24) & 0xFF];
  };

  // Générer 2 à 4 fragments
  const numFragments = rand16(2, 4);
  const fragments = [];
  let prevLCN = 0;
  for (let i = 0; i < numFragments; i++) {
    const length = rand16(1, 50);
    const delta  = rand16(1, 200);
    const lcn    = prevLCN + delta;
    prevLCN = lcn;
    fragments.push({ length, delta, lcn });
  }

  const totalClusters = fragments.reduce((s, f) => s + f.length, 0);

  // Encoder la Run List
  const allBytes = [];
  const fragBytes = fragments.map(f => {
    const lenBytes   = encodeVar(f.length);
    const deltaBytes = encodeVar(f.delta);
    const header     = (deltaBytes.length << 4) | lenBytes.length;
    return { header, lenBytes, deltaBytes, ...f };
  });
  fragBytes.forEach(f => {
    allBytes.push(f.header);
    f.lenBytes.forEach(b => allBytes.push(b));
    f.deltaBytes.forEach(b => allBytes.push(b));
  });
  allBytes.push(0x00); // terminator

  const hexStr = allBytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ');

  // Construction HTML : séquence hex colorée avec chaque fragment distinctivement coloré
  const colors = ['--cyan', '--green', '--gold', '--purple'];
  let hexDump = `<div class="hex-display" style="flex-wrap:wrap;gap:4px">`;
  let idx = 0;
  fragBytes.forEach((f, fi) => {
    const col = colors[fi % colors.length];
    // Header byte
    hexDump += `<span class="hex-byte" style="color:var(${col});font-weight:700" title="Header fragment ${fi+1}">${f.header.toString(16).toUpperCase().padStart(2,'0')}</span>`;
    idx++;
    // Length bytes
    f.lenBytes.forEach((b, j) => {
      hexDump += `<span class="hex-byte" style="color:var(${col});border:1px dashed rgba(255,255,255,.2)" title="Length fragment ${fi+1}, octet ${j+1}">${b.toString(16).toUpperCase().padStart(2,'0')}</span>`;
      idx++;
    });
    // Delta bytes
    f.deltaBytes.forEach((b, j) => {
      hexDump += `<span class="hex-byte" style="color:var(${col});opacity:.6" title="Delta fragment ${fi+1}, octet ${j+1}">${b.toString(16).toUpperCase().padStart(2,'0')}</span>`;
      idx++;
    });
    if (fi < fragBytes.length - 1) hexDump += `<span style="color:var(--dim);padding:0 4px">·</span>`;
  });
  hexDump += `<span class="hex-byte dim-byte" title="Terminator">00</span>`;
  hexDump += `</div>`;

  const answer = String(totalClusters);
  const fragDesc = fragBytes.map((f, i) => `fragment ${i+1} : ${f.length} clusters`).join(' · ');
  const calc = fragBytes.map(f => f.length).join(' + ');

  const qText = `Quel est le <strong>nombre total de clusters</strong> occupés par ce fichier ? (somme des longueurs de tous les fragments)`;
  const hints = [
    `Chaque fragment a un header : nibble haut = nb d'octets du delta LCN, nibble bas = nb d'octets de la longueur.`,
    `On se moque des deltas LCN pour ce calcul — ce qui compte, c'est la <strong>longueur</strong> (run length) de chaque fragment.`,
    `Les fragments détectés : ${fragDesc}.`,
    `Total = ${calc} = <strong>${totalClusters} clusters</strong>.`,
  ];
  const explain = `Total = ${calc} = <strong>${totalClusters} clusters</strong>. La Run List décrit ${numFragments} fragments, chacun avec sa propre longueur. Pour le total, on ignore les deltas LCN et on additionne uniquement les longueurs.`;

  return {
    title: 'NTFS Run List — Total de clusters du fichier',
    category: 'Système de fichiers NTFS',
    difficulty: 'medium',
    scenario: `Dans l'attribut <code>$DATA</code> non-résident d'une entrée MFT, tu trouves cette Run List. Le fichier est fragmenté sur ${numFragments} fragments.`,
    hexDump,
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">Run List : [header][length bytes][delta bytes] · 0x00 = fin. Header : nibble haut = taille delta, nibble bas = taille length. Les couleurs distinguent les fragments.</div>`,
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── EX-EXAM-8 : exFAT — FirstCluster d'un fichier depuis son Stream Extension ──
// Inspiré de l'examen Q11 (cluster du fichier aBoire.txt).
// En exFAT, un fichier = 1 File Directory Entry (type 0x85) + 1 Stream Extension (type 0xC0)
// + 1+ File Name (type 0xC1). Le FirstCluster est dans le Stream Extension à l'offset 0x14 (4 octets LE).
function makeExFATDirentExercise() {
  const rand16 = (lo,hi) => Math.floor(Math.random()*(hi-lo+1))+lo;

  const fileNames = ['rapport.txt', 'photo.jpg', 'notes.md', 'secret.pdf', 'archive.zip', 'config.ini', 'donnees.csv'];
  const fileName = fileNames[rand16(0, fileNames.length-1)];
  const firstCluster = rand16(0x04, 0xFFF); // cluster entre 4 et 4095 (valeurs lisibles)
  const fileSize     = rand16(100, 10000);
  const firstClusterHex = firstCluster.toString(16).toUpperCase().padStart(8,'0');

  // Construire les 3 entrées (3 × 32 octets = 96 octets)
  const bytes = new Array(96).fill(0x00);

  // === Entrée 1 : File Directory Entry (0x85) @ offset 0x00 ===
  bytes[0x00] = 0x85; // EntryType = File
  bytes[0x01] = 0x02; // SecondaryCount = 2 (stream + name)
  // Checksum (simplifié)
  bytes[0x02] = 0xC8; bytes[0x03] = 0x7D;
  // FileAttributes (0x20 = Archive, LE 2 octets)
  bytes[0x04] = 0x20; bytes[0x05] = 0x00;
  // Reserved1 (2 octets)
  // CreateTimestamp (4 octets LE)
  bytes[0x08] = 0x48; bytes[0x09] = 0x7B; bytes[0x0A] = 0x66; bytes[0x0B] = 0x2F;
  // LastModifiedTimestamp (4 octets LE)
  bytes[0x0C] = 0x48; bytes[0x0D] = 0x7B; bytes[0x0E] = 0x66; bytes[0x0F] = 0x2F;
  // LastAccessedTimestamp (4 octets LE)
  bytes[0x10] = 0x48; bytes[0x11] = 0x7B; bytes[0x12] = 0x66; bytes[0x13] = 0x2F;

  // === Entrée 2 : Stream Extension (0xC0) @ offset 0x20 ===
  bytes[0x20] = 0xC0; // EntryType = Stream Extension
  bytes[0x21] = 0x03; // GeneralSecondaryFlags
  // Reserved (1 byte) @ 0x22
  bytes[0x23] = fileName.length; // NameLength (nombre de chars UTF-16)
  // NameHash (2 octets)
  bytes[0x24] = 0xD9; bytes[0x25] = 0x7D;
  // Reserved (2 octets)
  // ValidDataLength (8 octets LE) @ 0x28
  bytes[0x28] = fileSize & 0xFF;
  bytes[0x29] = (fileSize >> 8) & 0xFF;
  bytes[0x2A] = (fileSize >> 16) & 0xFF;
  bytes[0x2B] = (fileSize >> 24) & 0xFF;
  // Reserved (4 octets) @ 0x30
  // FirstCluster (4 octets LE) @ 0x34  ← L'INFO CRITIQUE
  bytes[0x34] = firstCluster & 0xFF;
  bytes[0x35] = (firstCluster >> 8) & 0xFF;
  bytes[0x36] = (firstCluster >> 16) & 0xFF;
  bytes[0x37] = (firstCluster >> 24) & 0xFF;
  // DataLength (8 octets LE) @ 0x38
  bytes[0x38] = fileSize & 0xFF;
  bytes[0x39] = (fileSize >> 8) & 0xFF;
  bytes[0x3A] = (fileSize >> 16) & 0xFF;
  bytes[0x3B] = (fileSize >> 24) & 0xFF;

  // === Entrée 3 : File Name Extension (0xC1) @ offset 0x40 ===
  bytes[0x40] = 0xC1;
  bytes[0x41] = 0x00;
  // Nom en UTF-16 LE à partir de 0x42 (max 15 chars par entrée)
  for (let i = 0; i < fileName.length && i < 15; i++) {
    bytes[0x42 + 2*i]     = fileName.charCodeAt(i) & 0xFF;
    bytes[0x42 + 2*i + 1] = (fileName.charCodeAt(i) >> 8) & 0xFF;
  }

  // Rows pour affichage
  const rows = [];
  for (let i = 0; i < 96; i += 16) {
    rows.push({
      offset: i.toString(16).toUpperCase().padStart(8,'0'),
      bytes: bytes.slice(i, i+16)
    });
  }

  const answer = firstClusterHex;
  const hexBytes = `${bytes[0x34].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x35].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x36].toString(16).toUpperCase().padStart(2,'0')} ${bytes[0x37].toString(16).toUpperCase().padStart(2,'0')}`;

  const qText = `Dans quelle cluster se trouve le <strong>début des données</strong> du fichier <strong>"${fileName}"</strong> ? (numéro de cluster en hexadécimal, 8 chiffres)`;
  const hints = [
    `En exFAT, un fichier = 3 entrées : File (0x85) + Stream Extension (0xC0) + File Name (0xC1). Le FirstCluster est dans le Stream Extension.`,
    `Le type d'entrée est le 1er octet : 0x85 à l'offset 0x00 → File · 0xC0 à l'offset 0x20 → Stream Extension · 0xC1 à 0x40 → File Name.`,
    `Dans le Stream Extension, <strong>FirstCluster est à l'offset relatif 0x14</strong> (donc 0x20 + 0x14 = <strong>0x34 absolu</strong>) sur 4 octets en Little Endian.`,
    `Octets 0x34–0x37 = <span style="color:var(--cyan);font-weight:700">${hexBytes}</span> → Little Endian → inverse → <strong>0x${firstClusterHex}</strong> = ${firstCluster} décimal.`,
  ];
  const explain = `FirstCluster @ offset 0x34 (= 0x20 + 0x14 dans le Stream Extension) = <code>${hexBytes}</code> LE → <strong>0x${firstClusterHex}</strong> = ${firstCluster} décimal.`;

  return {
    title: 'exFAT — Cluster de départ d\'un fichier',
    category: 'Système de fichiers exFAT',
    difficulty: 'hard',
    scenario: `Tu analyses le répertoire racine d'une clé USB exFAT. Ces 3 entrées consécutives (96 octets) décrivent le fichier <strong>"${fileName}"</strong>. Retrouve son cluster de départ.`,
    hexDump: renderHexDump(rows, [
      {from:0x00, to:0x00, color:'--gold',  label:'0x85 = File Entry'},
      {from:0x20, to:0x20, color:'--green', label:'0xC0 = Stream Ext'},
      {from:0x34, to:0x37, color:'--cyan',  label:'FirstCluster (LE)'},
      {from:0x40, to:0x40, color:'--purple',label:'0xC1 = File Name'},
    ], {cols: 32, title: '3 entrées exFAT consécutives — 1 ligne = 1 entrée de 32 octets'}),
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">exFAT dirent : File (0x85) + Stream Extension (0xC0) + File Name (0xC1). FirstCluster @ Stream+0x14 = abs 0x34 (4 o LE). Nom à partir de 0x42 en UTF-16 LE.</div>`,
    question: qText,
    answer,
    hints,
    explain,
  };
}

// ── Registre des générateurs ──
const EXAM_GENERATORS = [
  makeBootSectorExercise,
  makeRunListExercise,
  makeBitmapExercise,
  makeSignedLEExercise,
  makeBinaryExercise,
  makeFAT16SFNExercise,
  makeFAT16RootFullExercise,
  makeFAT16LFNExercise,              // ← NOUVEAU : LFN reconstruction (examen Q2a)
  makeNTFSMFTAttributeExercise,
  makeNTFSRunListTotalExercise,      // ← NOUVEAU : total clusters Run List (examen Q8)
  makeEXT3InodeExercise,
  makeExFATDirentExercise,           // ← NOUVEAU : FirstCluster exFAT (examen Q11)
  makeHFSPlusClusterExercise,
];

// État multi-indices
let _examHintIdx = 0;
let _examHints   = [];
let _examData    = null;

function genExamen() {
  _examHintIdx = 0;
  const gen = EXAM_GENERATORS[rand(0, EXAM_GENERATORS.length - 1)];
  _examData = gen();

  const d = _examData;
  _examHints = d.hints || [];

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-ex">📋</div>
      <div class="ex-title">${d.title}</div>
      <span class="ex-badge ${d.difficulty}">${d.difficulty}</span>
    </div>
    <div style="margin-bottom:.5rem;font-size:.7rem;color:var(--dim);font-family:var(--mono);background:rgba(48,232,138,.05);border:1px solid rgba(48,232,138,.15);border-radius:5px;padding:.3rem .7rem;display:inline-block">
      🧩 ${d.category}
    </div>
    <div class="ex-scenario">${d.scenario}</div>

    ${d.hexDump}
    ${d.legend || ''}

    <div class="sec-title" style="margin-top:.75rem">Question</div>
    <div style="font-size:.85rem;color:var(--text);line-height:1.6;margin-bottom:.75rem">${d.question}</div>

    <div class="ex-input-row">
      <input class="ex-input" id="inp-exam" placeholder="Votre réponse" autocomplete="off"
             style="max-width:200px" type="text">
      <button class="btn-hint" id="exam-hint-btn" onclick="nextExamHint()">💡 Indice (${_examHints.length})</button>
      <button class="btn-validate" onclick="checkExamen()">Valider ✓</button>
      <button class="btn-next" id="btn-next-ex" onclick="newExercise()" style="display:none">Exercice suivant →</button>
    </div>
    <div class="ex-feedback" id="ex-feedback-ex"></div>
    <div id="exam-hint-display" style="margin-top:.5rem;display:none;padding:.65rem .9rem;background:rgba(240,192,64,.06);border:1px solid rgba(240,192,64,.2);border-radius:7px;font-size:.8rem;color:var(--text);line-height:1.6"></div>
  `;
  setTimeout(() => {
    const inp = div.querySelector('#inp-exam');
    if (inp) inp.addEventListener('keydown', e => { if(e.key==='Enter') checkExamen(); });
  }, 50);
  return div;
}

function nextExamHint() {
  if (!_examHints.length) return;
  markHintUsed();
  const hdisplay = document.getElementById('exam-hint-display');
  const hbtn     = document.getElementById('exam-hint-btn');
  if (!hdisplay) return;

  const hint = _examHints[_examHintIdx];
  _examHintIdx = Math.min(_examHintIdx + 1, _examHints.length - 1);

  hdisplay.style.display = 'block';
  hdisplay.innerHTML = `<strong style="color:var(--gold)">Indice ${_examHintIdx} / ${_examHints.length} :</strong> ${hint}`;
  if (hbtn) hbtn.textContent = _examHintIdx < _examHints.length
    ? `💡 Indice suivant (${_examHints.length - _examHintIdx} restants)`
    : `💡 Tous les indices affichés`;
}

function checkExamen() {
  if (!_examData) return;
  const inp = document.getElementById('inp-exam');
  const fb  = document.getElementById('ex-feedback-ex');
  // Normalisation : insensible aux accents, à la casse, aux espaces, et au préfixe 0x
  const val = normAns(inp.value);
  const exp = normAns(_examData.answer);
  const ok  = val === exp;

  if (ok) {
    inp.className = 'ex-input correct';
    document.querySelector('.btn-validate').disabled = true;
    document.getElementById('btn-next-ex').style.display = 'block';
    document.querySelector('.ex-card').className = 'ex-card solved';
    document.getElementById('ex-num-ex').className = 'ex-num solved';
    fb.className = 'ex-feedback correct';
    fb.innerHTML = `✓ Correct ! ${_examData.explain}`;
    if (!STATE.hintUsed) incSolved(STATE.cat);
  } else {
    inp.className = 'ex-input wrong';
    fb.className  = 'ex-feedback wrong';
    fb.innerHTML  = `✗ Réponse incorrecte. Utilise 💡 Indice pour progresser étape par étape.`;
    breakStreak();
    setTimeout(() => inp.className='ex-input', 700);
  }
}



function randDate(yearFrom, yearTo) {
  const y = rand(yearFrom, yearTo);
  const m = rand(1, 12);
  const d = rand(1, 28);
  const h = rand(0, 23);
  const mi = rand(0, 59);
  const s  = rand(0, 59);
  return { y, m, d, h, mi, s,
    str: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} ${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}:${String(s).padStart(2,'0')}` };
}

function genTimestomping() {
  // 4 cas possibles
  const caseType = rand(0, 3);

  let SI_created, SI_modified, SI_accessed, SI_mftchanged;
  let FN_created, FN_modified, FN_accessed, FN_mftchanged;
  let isTimestomped = false;
  let explanation = "";
  let indicator = "";

  if (caseType === 0) {
    // CAS NORMAL — tout cohérent
    const base = randDate(2018, 2023);
    SI_created   = { ...base };
    FN_created   = { ...base };
    const mod = randDate(base.y, 2024);
    SI_modified  = mod;
    FN_modified  = mod;
    SI_accessed  = randDate(mod.y, 2024);
    FN_accessed  = { ...SI_accessed };
    SI_mftchanged = SI_modified;
    FN_mftchanged = FN_modified;
    isTimestomped = false;
    explanation = `Aucune anomalie. $STANDARD_INFORMATION et $FILE_NAME sont cohérents entre eux. Les dates de création sont identiques, les modifications postérieures à la création. Pas de timestomping détecté.`;
    indicator = "Dates $SI et $FN cohérentes · Chronologie logique";

  } else if (caseType === 1) {
    // SI_created APRÈS FN_created — impossible → timestomping classique
    FN_created   = randDate(2018, 2020);
    SI_created   = randDate(2021, 2024); // postérieur → impossible
    FN_modified  = randDate(FN_created.y, 2021);
    SI_modified  = randDate(2015, 2017); // aussi dans le passé → double anomalie
    SI_accessed  = randDate(2015, 2017);
    FN_accessed  = randDate(2022, 2024);
    SI_mftchanged = SI_modified;
    FN_mftchanged = FN_modified;
    isTimestomped = true;
    explanation = `Timestomping détecté — double anomalie : (1) $SI.Created (${SI_created.str}) est POSTÉRIEUR à $FN.Created (${FN_created.str}), ce qui est physiquement impossible — le fichier ne peut pas être créé après avoir été nommé. (2) $SI.Modified est antérieur à $FN.Created, suggérant une manipulation dans le passé. Outil probable : timestomp, Meterpreter ou manipulation manuelle via SetFileTime().`;
    indicator = "⚠️ $SI.Created > $FN.Created — physiquement impossible";

  } else if (caseType === 2) {
    // SI dates toutes identiques à la seconde près → timestamps écrasés en bloc
    const fakeDate = randDate(2010, 2015);
    SI_created = SI_modified = SI_accessed = SI_mftchanged = fakeDate;
    FN_created   = randDate(2019, 2022);
    FN_modified  = randDate(FN_created.y, 2023);
    FN_accessed  = randDate(FN_modified.y, 2024);
    FN_mftchanged = FN_modified;
    isTimestomped = true;
    explanation = `Timestomping détecté — les 4 timestamps $STANDARD_INFORMATION sont identiques à la seconde près (${SI_created.str}). Une utilisation normale d'un fichier ne produit jamais 4 dates strictement identiques. Cela indique un écrasement en bloc via SetFileTime() ou l'outil timestomp. Les dates $FILE_NAME, plus difficiles à modifier, révèlent la chronologie réelle.`;
    indicator = "⚠️ 4 timestamps $SI identiques — écrasement en bloc suspect";

  } else {
    // CAS NORMAL avec légère différence acceptable
    const base = randDate(2020, 2022);
    SI_created   = { ...base };
    FN_created   = { ...base };
    // +quelques secondes — normal lors d'une copie
    const mod = randDate(base.y, 2024);
    SI_modified  = mod; FN_modified = mod;
    SI_accessed  = randDate(mod.y, 2024);
    FN_accessed  = { ...SI_accessed };
    SI_mftchanged = mod; FN_mftchanged = mod;
    isTimestomped = false;
    explanation = `Aucune anomalie détectée. Les timestamps $STANDARD_INFORMATION et $FILE_NAME sont cohérents. La chronologie Création → Modification → Accès est logique. La légère différence entre $SI et $FN (quelques secondes) est normale lors d'une copie Windows.`;
    indicator = "Cohérence $SI ↔ $FN · Chronologie normale";
  }

  const renderRow = (label, SI, FN) => `
    <tr>
      <td style="padding:.4rem .6rem;color:var(--dim);font-family:var(--mono);font-size:.72rem;white-space:nowrap">${label}</td>
      <td style="padding:.4rem .6rem;font-family:var(--mono);font-size:.75rem;color:${isTimestomped && label.includes('Créé') ? 'var(--red)' : 'var(--cyan)'}">${SI.str}</td>
      <td style="padding:.4rem .6rem;font-family:var(--mono);font-size:.75rem;color:${isTimestomped && label.includes('Créé') ? 'var(--gold)' : 'var(--green)'}">${FN.str}</td>
    </tr>`;

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-ts">🕰</div>
      <div class="ex-title">Détection de Timestomping</div>
      <span class="ex-badge medium">NTFS · $MFT</span>
    </div>
    <div class="ex-scenario">
      Tu analyses l'entrée MFT d'un fichier suspect sur un volume NTFS. X-Ways affiche les timestamps des deux attributs.<br>
      <strong>Y a-t-il eu manipulation des horodatages (timestomping) ?</strong>
    </div>

    <div class="sec-title">Attributs de l'entrée MFT</div>
    <div style="background:rgba(0,0,0,.4);border:1px solid var(--border);border-radius:8px;overflow:auto;margin-bottom:.75rem">
      <table style="border-collapse:collapse;width:100%;min-width:500px">
        <thead><tr style="background:var(--surface2)">
          <th style="padding:.4rem .6rem;font-size:.68rem;color:var(--dim);text-align:left;border-bottom:1px solid var(--border)">Horodatage</th>
          <th style="padding:.4rem .6rem;font-size:.68rem;color:var(--cyan);text-align:left;border-bottom:1px solid var(--border)">$STANDARD_INFORMATION (0x10)</th>
          <th style="padding:.4rem .6rem;font-size:.68rem;color:var(--green);text-align:left;border-bottom:1px solid var(--border)">$FILE_NAME (0x30)</th>
        </tr></thead>
        <tbody>
          ${renderRow('Créé (Created)', SI_created, FN_created)}
          ${renderRow('Modifié (Modified)', SI_modified, FN_modified)}
          ${renderRow('Accédé (Accessed)', SI_accessed, FN_accessed)}
          ${renderRow('MFT modifié', SI_mftchanged, FN_mftchanged)}
        </tbody>
      </table>
    </div>

    <div style="background:rgba(0,229,204,.04);border:1px solid rgba(0,229,204,.15);border-radius:8px;padding:.6rem .9rem;margin-bottom:.75rem;font-size:.75rem">
      <strong style="color:var(--cyan)">Rappel :</strong> $STANDARD_INFORMATION est modifiable par les applications. $FILE_NAME est mis à jour uniquement par le noyau Windows — beaucoup plus difficile à falsifier.
    </div>

    <div class="ex-input-row" style="flex-direction:column;align-items:flex-start;gap:.5rem">
      <div style="display:flex;gap:.5rem;flex-wrap:wrap" id="ts-choices">
        <button class="tp-choice" id="ts-btn-yes">
          <span class="tp-choice-letter">A</span>
          <span>✅ Oui — des horodatages ont été manipulés</span>
        </button>
        <button class="tp-choice" id="ts-btn-no">
          <span class="tp-choice-letter">B</span>
          <span>❌ Non — chronologie normale, pas de timestomping</span>
        </button>
      </div>
    </div>
    <div class="ex-feedback" id="ex-feedback-tss"></div>
    <div id="ts-indicator" style="display:none;margin-top:.5rem;font-size:.72rem;font-family:var(--mono);color:var(--dim)">${indicator}</div>
    <button class="btn-next" id="btn-next-ts2" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  div.querySelector('#ts-btn-yes').addEventListener('click', function() {
    checkTimestomping(true, isTimestomped, explanation, this);
  });
  div.querySelector('#ts-btn-no').addEventListener('click', function() {
    checkTimestomping(false, isTimestomped, explanation, this);
  });
  return div;
}

function checkTimestomping(userSaysYes, isActuallyTimestomped, explanation, btn) {
  const btns = document.querySelectorAll('#ts-choices .tp-choice');
  if (btns[0].disabled) return;
  btns.forEach(b => { b.disabled = true; b.style.cursor = 'default'; });
  const isOk = userSaysYes === isActuallyTimestomped;
  btn.style.borderColor = isOk ? 'var(--green)' : 'var(--red)';
  btn.style.background  = isOk ? 'rgba(48,232,138,.1)' : 'rgba(255,64,96,.08)';
  btn.style.color       = isOk ? 'var(--green)' : 'var(--red)';
  // Révéler la bonne réponse si erreur
  if (!isOk) {
    btns.forEach(b => {
      if (b !== btn) {
        b.style.borderColor = 'var(--green)';
        b.style.background  = 'rgba(48,232,138,.08)';
        b.style.color       = 'var(--green)';
      }
    });
  }
  const fb = document.getElementById('ex-feedback-tss');
  fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
  // Choix utilisateur invalide → on a explicitement dit l'inverse
  const wrongExplain = isActuallyTimestomped
    ? `Tu as répondu « pas de timestomping », mais les indicateurs trahissent une manipulation.`
    : `Tu as répondu « timestomping détecté », mais aucune anomalie n'est présente — la chronologie est cohérente.`;
  fb.innerHTML = formatChoiceFeedback(isOk, explanation, wrongExplain);
  document.getElementById('ts-indicator').style.display = 'block';
  document.getElementById('ex-num-ts').className = 'ex-num ' + (isOk ? 'solved' : 'error');
  document.querySelector('.ex-card').className = 'ex-card ' + (isOk ? 'solved' : 'error');
  document.getElementById('btn-next-ts2').style.display = 'block';
  if (isOk && !STATE.hintUsed) incSolved(STATE.cat);
  else if (!isOk) breakStreak();
}


// ═══════════════════════════════════════════════════════════════
// DROIT PÉNAL — QUALIFICATIONS
// ═══════════════════════════════════════════════════════════════

// [DROIT_CASES chargé depuis tp-data.js]
// (Tirage aléatoire dans genDroitPenal — plus de _droitIdx séquentiel)

function genDroitPenal() {
  // Bug fix : tirage aléatoire au lieu de cycle séquentiel
  const case_ = DROIT_CASES[rand(0, DROIT_CASES.length - 1)];

  const opts = [...case_.choices].sort(() => Math.random() - .5);
  const correctOpt = opts.find(o => o.art === case_.correct || (case_.correct === 'both' && o.art === '143bis') || (case_.correct === '269' && o.art === '269'));
  const correctIdx = opts.indexOf(correctOpt || opts.find(o => o.art === case_.correct));
  const correctExplain = (correctOpt || opts[correctIdx]).explain;

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-dp">⚖️</div>
      <div class="ex-title">Qualification pénale — Droit suisse</div>
      <span class="ex-badge medium">CP / CPP</span>
    </div>
    <div class="ex-scenario">${case_.action}</div>
    <div class="sec-title">Quel article s'applique principalement ?</div>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="dp-choices">
      ${opts.map((o, i) => `
        <button class="tp-choice"
          data-correct="${i === correctIdx}"
          data-why="${encData(o.explain)}"
          data-correct-explain="${encData(correctExplain)}"
          data-note="${encData(case_.note)}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${o.label}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-dp"></div>
    <button class="btn-next" id="btn-next-dp" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  setTimeout(() => {
    div.querySelectorAll('#dp-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        const why  = decData(b.dataset.why) || '';
        const correctEx = decData(b.dataset.correctExplain) || '';
        const note = decData(b.dataset.note) || '';
        checkDroitPenal(b, isOk, correctEx, why, note);
      });
    });
  }, 0);
  return div;
}

function checkDroitPenal(btn, isOk, correctExplain, wrongExplain, note) {
  const btns = document.querySelectorAll('#dp-choices .tp-choice');
  if (btns[0].disabled) return;
  if (!isOk) breakStreak();
  btns.forEach(b => { b.disabled = true; b.style.cursor = 'default'; });
  btn.style.borderColor = isOk ? 'var(--green)' : 'var(--red)';
  btn.style.background  = isOk ? 'rgba(48,232,138,.1)' : 'rgba(255,64,96,.08)';
  btn.style.color       = isOk ? 'var(--green)' : 'var(--red)';
  // Révéler la bonne réponse si erreur
  if (!isOk) {
    btns.forEach(b => {
      if (b !== btn && b.dataset.correct === 'true') {
        b.style.borderColor = 'var(--green)';
        b.style.background  = 'rgba(48,232,138,.08)';
        b.style.color       = 'var(--green)';
      }
    });
  }
  const fb = document.getElementById('ex-feedback-dp');
  fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
  fb.innerHTML = formatChoiceFeedback(isOk, correctExplain, wrongExplain, note);
  document.getElementById('ex-num-dp').className = 'ex-num ' + (isOk ? 'solved' : 'error');
  document.querySelector('.ex-card').className = 'ex-card ' + (isOk ? 'solved' : 'error');
  document.getElementById('btn-next-dp').style.display = 'block';
  if (isOk && !STATE.hintUsed) incSolved(STATE.cat);
}


// ═══════════════════════════════════════════════════════════════
// GLOSSAIRE BILINGUE — FLASHCARDS
// ═══════════════════════════════════════════════════════════════

// [GLOSSAIRE chargé depuis tp-data.js]
let _glossIdx = 0;
let _glossMode = 'fr_to_en'; // 'fr_to_en' or 'en_to_fr'
let _glossSessionCorrect = 0;
let _glossSessionTotal = 0;

function genGlossaire() {
  // Tirage aléatoire pour éviter de revoir les termes dans le même ordre
  const term = GLOSSAIRE[rand(0, GLOSSAIRE.length - 1)];
  _glossIdx++;
  _glossSessionTotal++;

  // Alterner le mode (basé sur le compteur de session)
  _glossMode = (_glossIdx % 2 === 0) ? 'fr_to_en' : 'en_to_fr';

  // Générer 3 distracteurs
  const pool = GLOSSAIRE.filter(t => t !== term);
  const distractors = pool.sort(() => Math.random() - .5).slice(0, 3);
  const correct = _glossMode === 'fr_to_en' ? term.en : term.fr;
  const question = _glossMode === 'fr_to_en' ? term.fr : term.en;
  const options = [
    { text: correct, isCorrect: true },
    ...distractors.map(d => ({ text: _glossMode === 'fr_to_en' ? d.en : d.fr, isCorrect: false })),
  ].sort(() => Math.random() - .5);

  const langLabel = _glossMode === 'fr_to_en' ? '🇫🇷 → 🇬🇧' : '🇬🇧 → 🇫🇷';

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-gl">🗂</div>
      <div class="ex-title">Glossaire Bilingue ${langLabel}</div>
      <span class="ex-badge easy">${_glossSessionCorrect}/${_glossSessionTotal} cette session</span>
    </div>
    <div class="ex-scenario">
      <div style="text-align:center;padding:.5rem 0">
        <div style="font-size:1.3rem;font-weight:800;color:var(--text);font-family:var(--sans);margin-bottom:.3rem">${question}</div>
        <div style="font-size:.75rem;color:var(--dim)">${term.note}</div>
      </div>
    </div>
    <div class="sec-title">Quelle est la traduction correcte ?</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin-bottom:.75rem" id="gl-choices">
      ${options.map((o, i) => `
        <button class="tp-choice" data-is-correct="${o.isCorrect}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span style="font-size:.78rem">${o.text}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-gl"></div>
    <button class="btn-next" id="btn-next-gl" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  div.querySelectorAll('#gl-choices .tp-choice').forEach(b => {
    b.addEventListener('click', () => {
      const isOk = b.dataset.isCorrect === 'true';
      checkGlossaire(b, isOk, correct, term.note);
    });
  });
  return div;
}

function checkGlossaire(btn, isOk, correct, note) {
  const btns = document.querySelectorAll('#gl-choices .tp-choice');
  if (btns[0].disabled) return;
  if (!isOk) breakStreak();
  btns.forEach(b => {
    b.disabled = true; b.style.cursor = 'default';
    const bText = b.querySelector('span:last-child').textContent;
    if (bText === correct) { b.style.borderColor='var(--green)'; b.style.background='rgba(48,232,138,.1)'; b.style.color='var(--green)'; }
    else if (b === btn && !isOk) { b.style.borderColor='var(--red)'; b.style.background='rgba(255,64,96,.08)'; b.style.color='var(--red)'; }
  });
  if (isOk) _glossSessionCorrect++;
  const fb = document.getElementById('ex-feedback-gl');
  fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
  fb.innerHTML = (isOk ? `✓ Correct — ` : `✗ La bonne réponse était : <strong>${correct}</strong> — `) + note;
  document.getElementById('ex-num-gl').className = 'ex-num ' + (isOk ? 'solved' : 'error');
  document.getElementById('btn-next-gl').style.display = 'block';
  if (isOk && !STATE.hintUsed) incSolved(STATE.cat);
}


// ═══════════════════════════════════════════════════
// 14. EMAIL FORENSIQUE
// ═══════════════════════════════════════════════════
function genEmail() {
  if (typeof EMAIL_EXERCISES === 'undefined' || !EMAIL_EXERCISES.length) {
    return genFallback("Email forensique non disponible — vérifiez tp-data.js");
  }
  const ex = EMAIL_EXERCISES[rand(0, EMAIL_EXERCISES.length - 1)];
  const shuffled = [...ex.choices].sort(() => Math.random() - .5);
  const correctIdx = shuffled.findIndex(c => c.correct);
  const correctExplain = shuffled[correctIdx].explain;

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-email">✉️</div>
      <div class="ex-title">Email Forensics — Authentification SMTP</div>
      <span class="ex-badge medium">SPF · DKIM · DMARC</span>
    </div>
    <div class="ex-scenario">${ex.scenario.replace(/\n/g, '<br>')}</div>
    <div class="sec-title">Question</div>
    <div style="font-size:.85rem;color:var(--text);line-height:1.6;margin-bottom:.75rem">${ex.question}</div>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="email-choices">
      ${shuffled.map((c, i) => `
        <button class="tp-choice"
          data-correct="${i === correctIdx}"
          data-explain="${encData(c.explain)}"
          data-correct-explain="${encData(correctExplain)}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${escAttr(c.text)}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-email"></div>
    <button class="btn-next" id="btn-next-email" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  // Fix #2 : event delegation (évite le bug JSON dans onclick="...")
  setTimeout(() => {
    div.querySelectorAll('#email-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isCorrect = b.dataset.correct === 'true';
        const explain = decData(b.dataset.explain) || '';
        const correctEx = decData(b.dataset.correctExplain) || '';
        checkEmail(b, isCorrect, explain, correctEx);
      });
    });
  }, 0);
  return div;
}

function checkEmail(btn, isCorrect, wrongExplain, correctExplain) {
  const choices = document.querySelectorAll('#email-choices .tp-choice');
  if (!choices.length || choices[0].disabled) return;
  choices.forEach(b => { b.disabled = true; });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (isCorrect) {
    choices.forEach(b => { if (b !== btn) b.classList.add('dim'); });
    if (!STATE.hintUsed) incSolved('email');
  } else {
    choices.forEach(b => {
      if (b.dataset.correct === 'true') b.classList.add('correct');
    });
    breakStreak();
  }
  const fb = document.getElementById('ex-feedback-email');
  if (fb) {
    fb.className = 'ex-feedback ' + (isCorrect ? 'correct' : 'wrong');
    fb.innerHTML = formatChoiceFeedback(isCorrect, correctExplain || wrongExplain, wrongExplain);
    fb.style.display = 'block';
  }
  const next = document.getElementById('btn-next-email');
  if (next) next.style.display = 'inline-block';
}

// ═══════════════════════════════════════════════════
// 15. INCIDENT RESPONSE
// ═══════════════════════════════════════════════════
let _irIdx = 0;
let _irShuffled = null;
function genIR() {
  if (typeof IR_EXERCISES === 'undefined' || !IR_EXERCISES.length) {
    return genFallback("Exercices IR non disponibles — vérifiez tp-data.js");
  }
  // Permutation persistante pour la session : parcours aléatoire sans répétition
  if (!_irShuffled || _irIdx >= _irShuffled.length) {
    _irShuffled = [...IR_EXERCISES.keys()].sort(() => Math.random() - .5);
    _irIdx = 0;
  }
  const ex = IR_EXERCISES[_irShuffled[_irIdx]];
  _irIdx++;
  const shuffled = [...ex.choices].sort(() => Math.random() - .5);
  const correctIdx = shuffled.findIndex(c => c.correct);
  const correctExplain = shuffled[correctIdx].explain;

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">🚨</div>
      <div class="ex-title">Incident Response — Décision critique</div>
      <span class="ex-badge hard">NIST SP 800-61</span>
    </div>
    <div class="ex-scenario">${ex.scenario}</div>
    <div class="sec-title">Question</div>
    <div style="font-size:.85rem;color:var(--text);line-height:1.6;margin-bottom:.75rem">${ex.question}</div>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="ir-choices">
      ${shuffled.map((c, i) => `
        <button class="tp-choice"
          data-correct="${i === correctIdx}"
          data-explain="${encData(c.explain)}"
          data-correct-explain="${encData(correctExplain)}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${escAttr(c.text)}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-ir"></div>
    <button class="btn-next" id="btn-next-ir" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  setTimeout(() => {
    div.querySelectorAll('#ir-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isCorrect = b.dataset.correct === 'true';
        const explain = decData(b.dataset.explain) || '';
        const correctEx = decData(b.dataset.correctExplain) || '';
        checkIR(b, isCorrect, explain, correctEx);
      });
    });
  }, 0);
  return div;
}

function checkIR(btn, isCorrect, wrongExplain, correctExplain) {
  const choices = document.querySelectorAll('#ir-choices .tp-choice');
  if (!choices.length || choices[0].disabled) return;
  choices.forEach(b => { b.disabled = true; });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    choices.forEach(b => { if (b.dataset.correct === 'true') b.classList.add('correct'); });
    breakStreak();
  } else if (!STATE.hintUsed) {
    incSolved('ir');
  }
  const fb = document.getElementById('ex-feedback-ir');
  if (fb) {
    fb.className = 'ex-feedback ' + (isCorrect ? 'correct' : 'wrong');
    fb.innerHTML = formatChoiceFeedback(isCorrect, correctExplain || wrongExplain, wrongExplain);
    fb.style.display = 'block';
  }
  const next = document.getElementById('btn-next-ir');
  if (next) next.style.display = 'inline-block';
}

// ═══════════════════════════════════════════════════
// 16. RÉSEAU & PCAP
// ═══════════════════════════════════════════════════
let _netIdx = 0;
let _netShuffled = null;
function genNetwork() {
  if (typeof NETWORK_EXERCISES === 'undefined' || !NETWORK_EXERCISES.length) {
    return genFallback("Exercices réseau non disponibles — vérifiez tp-data.js");
  }
  if (!_netShuffled || _netIdx >= _netShuffled.length) {
    _netShuffled = [...NETWORK_EXERCISES.keys()].sort(() => Math.random() - .5);
    _netIdx = 0;
  }
  const ex = NETWORK_EXERCISES[_netShuffled[_netIdx]];
  _netIdx++;
  const shuffled = [...ex.choices].sort(() => Math.random() - .5);
  const correctIdx = shuffled.findIndex(c => c.correct);
  const correctExplain = shuffled[correctIdx].explain;

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">📡</div>
      <div class="ex-title">Réseau & PCAP — Analyse de trafic</div>
      <span class="ex-badge medium">Wireshark · tcpdump</span>
    </div>
    <div class="ex-scenario">${ex.scenario}</div>
    <div class="sec-title">Question</div>
    <div style="font-size:.85rem;color:var(--text);line-height:1.6;margin-bottom:.75rem">${ex.question}</div>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="net-choices">
      ${shuffled.map((c, i) => `
        <button class="tp-choice"
          data-correct="${i === correctIdx}"
          data-explain="${encData(c.explain)}"
          data-correct-explain="${encData(correctExplain)}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${escAttr(c.text)}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-net"></div>
    <button class="btn-next" id="btn-next-net" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  setTimeout(() => {
    div.querySelectorAll('#net-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isCorrect = b.dataset.correct === 'true';
        const explain = decData(b.dataset.explain) || '';
        const correctEx = decData(b.dataset.correctExplain) || '';
        checkNetwork(b, isCorrect, explain, correctEx);
      });
    });
  }, 0);
  return div;
}

function checkNetwork(btn, isCorrect, wrongExplain, correctExplain) {
  const choices = document.querySelectorAll('#net-choices .tp-choice');
  if (!choices.length || choices[0].disabled) return;
  choices.forEach(b => { b.disabled = true; });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    choices.forEach(b => { if (b.dataset.correct === 'true') b.classList.add('correct'); });
    breakStreak();
  } else if (!STATE.hintUsed) {
    incSolved('network');
  }
  const fb = document.getElementById('ex-feedback-net');
  if (fb) {
    fb.className = 'ex-feedback ' + (isCorrect ? 'correct' : 'wrong');
    fb.innerHTML = formatChoiceFeedback(isCorrect, correctExplain || wrongExplain, wrongExplain);
    fb.style.display = 'block';
  }
  const next = document.getElementById('btn-next-net');
  if (next) next.style.display = 'inline-block';
}

// ═══════════════════════════════════════════════════
// 17. CALCUL OFFSET FS (NTFS, FAT32, exFAT, EXT4, HFS+)
// ═══════════════════════════════════════════════════
function genOffset() {
  const fsType = rand(0, 4);

  const configs = [
    { // 0 — NTFS : offset de la $MFT
      name: 'NTFS', badge: 'MFT Offset',
      bps:     [512, 512, 4096][rand(0,2)],
      spc:     [4, 8, 16][rand(0,2)],
      mft_lcn: rand(2, 8),           // LCN petit pour des résultats lisibles
      color: 'var(--purple)',
      compute(bps, spc, mft_lcn) {
        const cs = bps * spc;
        const answer = mft_lcn * cs;
        return {
          answer,
          cs,
          question: `BPB NTFS — BytesPerSector = <strong>${bps}</strong>, SectorsPerCluster = <strong>${spc}</strong>, MFT LCN = <strong>${mft_lcn}</strong>.<br>Calculer l'offset de la <code>$MFT</code> en octets.`,
          steps: [
            `Taille cluster = ${bps} × ${spc} = ${cs} o`,
            `Offset $MFT = LCN × taille_cluster = ${mft_lcn} × ${cs} = ${answer} o`
          ],
          unit: 'octets'
        };
      }
    },
    { // 1 — FAT32 : offset d'un cluster dans la zone données
      name: 'FAT32', badge: 'Cluster Offset',
      bps:      512,
      spc:      [4, 8, 16][rand(0,2)],
      reserved: [32, 64][rand(0,1)],
      fat_size: rand(16, 64),        // FAT size petite pour des nombres raisonnables
      cluster_n: rand(3, 12),
      color: 'var(--green)',
      compute(bps, spc, reserved, fat_size, cluster_n) {
        const cs = bps * spc;
        const data_start = (reserved + 2 * fat_size) * bps;
        const answer = data_start + (cluster_n - 2) * cs;
        return {
          answer,
          cs,
          question: `FAT32 BPB — BPS=${bps}, SPC=${spc}, Réservés=${reserved} sect., FAT size=${fat_size} sect. (×2 FATs).<br>Calculer l'offset du cluster <strong>${cluster_n}</strong> en octets.`,
          steps: [
            `Taille cluster = ${bps} × ${spc} = ${cs} o`,
            `Début zone données = (${reserved} + 2×${fat_size}) × ${bps} = ${data_start} o`,
            `Offset cluster ${cluster_n} = ${data_start} + (${cluster_n}−2) × ${cs} = ${answer} o`
          ],
          unit: 'octets'
        };
      }
    },
    { // 2 — exFAT : offset d'un cluster
      name: 'exFAT', badge: 'Cluster Offset',
      bpss: [9, 9, 12][rand(0,2)],   // 512 ou 4096 o/sect
      spcs: [0, 3, 4][rand(0,2)],    // 1, 8, ou 16 sect/cluster
      heap_offset: rand(128, 512),   // plus petit que l'original
      cluster_n: rand(3, 10),
      color: 'var(--orange)',
      compute(bpss, spcs, heap_offset, cluster_n) {
        const bps = Math.pow(2, bpss);
        const cs  = Math.pow(2, spcs) * bps;
        const answer = heap_offset * bps + (cluster_n - 2) * cs;
        return {
          answer,
          cs,
          question: `exFAT BPB — BytesPerSectorShift=<strong>${bpss}</strong> (→${bps} o/sect), SectorsPerClusterShift=<strong>${spcs}</strong> (→${Math.pow(2,spcs)} sect/cluster), ClusterHeapOffset=<strong>${heap_offset}</strong> secteurs.<br>Calculer l'offset du cluster <strong>${cluster_n}</strong> en octets.`,
          steps: [
            `BPS = 2^${bpss} = ${bps} o`,
            `Taille cluster = 2^${spcs} × ${bps} = ${cs} o`,
            `Offset cluster ${cluster_n} = ${heap_offset}×${bps} + (${cluster_n}−2)×${cs} = ${answer} o`
          ],
          unit: 'octets'
        };
      }
    },
    { // 3 — EXT4 : offset d'un inode (cas simple : groupe 0)
      name: 'EXT4', badge: 'Inode Offset',
      blockSize:      [1024, 4096][rand(0,1)],
      inodesPerGroup: [512, 1024][rand(0,1)],  // plus petit = résultats lisibles
      inodeSize:      256,
      inode_n:        rand(2, 50),              // inodes petits → groupe 0 certain
      color: 'var(--blue)',
      compute(blockSize, inodesPerGroup, inodeSize, inode_n) {
        const group = Math.floor((inode_n - 1) / inodesPerGroup); // = 0 vu les petites valeurs
        const indexInGroup = (inode_n - 1) % inodesPerGroup;
        // En EXT4 : superbloc (1 bloc) + descripteurs (1 bloc) = 2 blocs avant l'inode table
        const inodeTableOffset = (group === 0 ? 2 : group * 8 + 2) * blockSize;
        const answer = inodeTableOffset + indexInGroup * inodeSize;
        return {
          answer,
          cs: blockSize,
          question: `EXT4 Superblock — blockSize=<strong>${blockSize}</strong> o, inodesPerGroup=<strong>${inodesPerGroup}</strong>, inodeSize=<strong>${inodeSize}</strong> o.<br>Calculer l'offset de l'inode <strong>${inode_n}</strong> en octets (groupe 0, inode table après 2 blocs de métadonnées).`,
          steps: [
            `Groupe = (${inode_n}−1) ÷ ${inodesPerGroup} = ${group}`,
            `Index dans groupe = (${inode_n}−1) mod ${inodesPerGroup} = ${indexInGroup}`,
            `Inode table = ${group===0?2:group*8+2} blocs × ${blockSize} = ${inodeTableOffset} o`,
            `Offset inode ${inode_n} = ${inodeTableOffset} + ${indexInGroup}×${inodeSize} = ${answer} o`
          ],
          unit: 'octets'
        };
      }
    },
    { // 4 — HFS+ : offset d'un allocation block
      name: 'HFS+', badge: 'Allocation Block Offset',
      blockSize: [4096, 8192][rand(0,1)],
      block_n:   rand(2, 30),          // petit → résultat lisible
      color: 'var(--gold)',
      compute(blockSize, block_n) {
        const answer = block_n * blockSize;
        return {
          answer,
          cs: blockSize,
          question: `HFS+ Volume Header — blockSize=<strong>${blockSize}</strong> o (allocation block).<br>Calculer l'offset du bloc <strong>${block_n}</strong> en octets.<br><span style="font-size:.75rem;color:var(--dim)">Note : en HFS+ les blocs commencent à 0, contrairement à FAT qui commence à 2.</span>`,
          steps: [
            `HFS+ : les blocs commencent à l\'index 0`,
            `Offset = ${block_n} × ${blockSize} = ${answer} o`
          ],
          unit: 'octets'
        };
      }
    }
  ];

  const cfg = configs[fsType];
  let data;
  if      (fsType === 0) data = cfg.compute(cfg.bps, cfg.spc, cfg.mft_lcn);
  else if (fsType === 1) data = cfg.compute(cfg.bps, cfg.spc, cfg.reserved, cfg.fat_size, cfg.cluster_n);
  else if (fsType === 2) data = cfg.compute(cfg.bpss, cfg.spcs, cfg.heap_offset, cfg.cluster_n);
  else if (fsType === 3) data = cfg.compute(cfg.blockSize, cfg.inodesPerGroup, cfg.inodeSize, cfg.inode_n);
  else                   data = cfg.compute(cfg.blockSize, cfg.block_n);

  const answer = data.answer;
  const cs     = data.cs || 512; // fallback safe

  // Distracteurs plausibles (jamais négatifs, jamais égaux à la bonne réponse)
  const rawDistractors = [
    answer + cs,
    answer - cs,
    Math.round(answer * 2),
    answer + 512,
  ].filter(d => d !== answer && d > 0);
  const distractors = [...new Set(rawDistractors)].sort(() => Math.random() - .5).slice(0, 3);
  const choices = [answer, ...distractors].sort(() => Math.random() - .5);
  const correctIdx = choices.indexOf(answer);

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.id = 'offset-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">📐</div>
      <div class="ex-title">Calcul d'offset — ${cfg.name}</div>
      <span class="ex-badge hard" style="color:${cfg.color}">${cfg.badge}</span>
    </div>
    <div class="ex-scenario">${data.question}</div>
    <div class="sec-title">Choisir l'offset correct</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.75rem" id="offset-choices">
      ${choices.map((c, i) => `
        <button class="tp-choice" data-correct="${i === correctIdx}" data-idx="${i}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${c.toLocaleString('fr-CH')} ${data.unit}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-offset"></div>
    <button class="btn-next" id="btn-next-offset" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  div.querySelectorAll('#offset-choices .tp-choice').forEach((b, i) => {
    b.addEventListener('click', () => {
      const isCorrect = b.dataset.correct === 'true';
      checkOffset(b, isCorrect, data.steps, answer);
    });
  });
  return div;
}

function checkOffset(btn, isCorrect, steps, answer) {
  document.querySelectorAll('#offset-choices .tp-choice').forEach(b => { b.disabled = true; });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (isCorrect) { if (!STATE.hintUsed) incSolved('offset'); }
  else breakStreak();
  const fb = document.getElementById('ex-feedback-offset');
  if (fb) {
    fb.className = 'ex-feedback ' + (isCorrect ? 'correct' : 'wrong');
    const stepsHtml = steps.map(s => `<div style="font-size:.78rem;margin:.15rem 0;opacity:.9">→ ${s}</div>`).join('');
    fb.innerHTML = (isCorrect ? '✅ Correct !' : `❌ Réponse : ${answer.toLocaleString()} octets`) + stepsHtml;
    fb.style.display = 'block';
  }
  const next = document.getElementById('btn-next-offset');
  if (next) next.style.display = 'inline-block';
}

// ── Helper générique pour erreur de chargement ──
function genFallback(msg) {
  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `<div class="ex-header"><div class="ex-num">⚠️</div><div class="ex-title">${msg}</div></div>`;
  return div;
}

// ═══════════════════════════════════════════════════
// 18. TABLE HEX — "À quel offset se trouve X ?"
// ═══════════════════════════════════════════════════
const HEX_TABLE_EXERCISES = [
  {
    name: 'BPB FAT — SectorsPerCluster',
    scenario: 'Secteur de boot FAT32. Retrouve le champ SectorsPerCluster dans le BPB.',
    build: () => {
      const spc = [4,8,16][rand(0,2)];
      const bps = 512;
      const rsvd = [32,64][rand(0,1)];
      const bytes = new Array(64).fill(0);
      'MSDOS5.0'.split('').forEach((c,i) => bytes[3+i] = c.charCodeAt(0));
      bytes[0x0B] = bps & 0xFF; bytes[0x0C] = (bps>>8) & 0xFF;
      bytes[0x0D] = spc;
      bytes[0x0E] = rsvd & 0xFF; bytes[0x0F] = (rsvd>>8) & 0xFF;
      bytes[0x10] = 2; bytes[0x11] = 0x00; bytes[0x12] = 0x02;
      return { bytes, answer: '0D', answer_val: spc,
        hint1: 'Le BPB commence à 0x0B. BytesPerSector occupe 0x0B–0x0C (2 octets).',
        hint2: 'SectorsPerCluster est à 0x0B + 2 = <strong>0x0D</strong> (1 octet).',
        explain: `Offset <strong>0x0D</strong> = SectorsPerCluster = <strong>${spc}</strong>.` };
    }
  },
  {
    name: 'NTFS Boot — MFT LCN',
    scenario: 'Secteur de boot NTFS (64 octets). Retrouve le LCN de la $MFT.',
    build: () => {
      const mftLcn = rand(0x100, 0x4000);
      const bytes = new Array(64).fill(0);
      bytes[0]=0xEB; bytes[1]=0x52; bytes[2]=0x90;
      'NTFS    '.split('').forEach((c,i) => bytes[3+i] = c.charCodeAt(0));
      bytes[0x0B]=0x00; bytes[0x0C]=0x02; bytes[0x0D]=8;
      bytes[0x30] = mftLcn & 0xFF; bytes[0x31] = (mftLcn>>8) & 0xFF;
      bytes[0x32] = (mftLcn>>16) & 0xFF; bytes[0x33] = (mftLcn>>24) & 0xFF;
      return { bytes, answer: '30', answer_val: mftLcn,
        hint1: 'Le BPB NTFS a des champs spécifiques à partir de 0x28. 0x28 = TotalSectors (8 o).',
        hint2: 'MFT LCN est à 0x28 + 8 = <strong>0x30</strong> (8 octets Little Endian).',
        explain: `Offset <strong>0x30</strong> = MFT LCN = <strong>0x${mftLcn.toString(16).toUpperCase()}</strong> (${mftLcn}). Offset $MFT = LCN × TailleCluster.` };
    }
  },
  {
    name: 'SFN FAT — Cluster de départ',
    scenario: 'Entrée SFN (Short File Name) FAT, 32 octets. Retrouve le cluster de départ du fichier.',
    build: () => {
      const cluster = rand(3, 0x3FFF);
      const size = rand(512, 400000);
      const bytes = new Array(32).fill(0);
      'RAPPORT '.split('').forEach((c,i) => bytes[i] = c.charCodeAt(0));
      'TXT'.split('').forEach((c,i) => bytes[8+i] = c.charCodeAt(0));
      bytes[0x0B] = 0x20;
      bytes[0x1A] = cluster & 0xFF; bytes[0x1B] = (cluster>>8) & 0xFF;
      bytes[0x1C] = size & 0xFF; bytes[0x1D] = (size>>8) & 0xFF;
      bytes[0x1E] = (size>>16) & 0xFF; bytes[0x1F] = (size>>24) & 0xFF;
      return { bytes, answer: '1A', answer_val: cluster,
        hint1: 'Layout SFN : 0x00 nom(8) · 0x08 ext(3) · 0x0B attr · 0x0E–0x19 timestamps · 0x1A cluster · 0x1C taille.',
        hint2: 'Le cluster de départ est à l\'offset <strong>0x1A–0x1B</strong> (2 octets Little Endian).',
        explain: `Offset <strong>0x1A</strong> = cluster de départ = <strong>${cluster}</strong> (0x${cluster.toString(16).toUpperCase()}).` };
    }
  },
  {
    name: 'exFAT Boot — ClusterHeapOffset',
    scenario: 'Secteur de boot exFAT (64 premiers octets). Retrouve le champ ClusterHeapOffset.',
    build: () => {
      const heapOff = rand(300, 700);
      const bytes = new Array(64).fill(0);
      bytes[0]=0xEB; bytes[1]=0x76; bytes[2]=0x90;
      'EXFAT   '.split('').forEach((c,i) => bytes[3+i] = c.charCodeAt(0));
      bytes[0x6C % 64] = 9; bytes[0x6D % 64] = 3;
      bytes[0x58 % 64] = heapOff & 0xFF; bytes[0x59 % 64] = (heapOff>>8) & 0xFF;
      return { bytes, answer: '18', answer_val: heapOff,
        hint1: 'En exFAT, les champs du BPB sont différents de FAT32. Cherche "EXFAT" à l\'offset 0x03.',
        hint2: 'ClusterHeapOffset est à l\'offset <strong>0x58</strong> (absolu dans le secteur). Dans nos 64 octets affichés : 0x18.',
        explain: `Offset <strong>0x58</strong> (0x18 dans cet extrait) = ClusterHeapOffset = <strong>${heapOff}</strong> secteurs.` };
    }
  },
  {
    name: 'EXT4 Superbloc — s_inodes_per_group',
    scenario: 'Début du superbloc EXT4 (offset 1024 du volume). Retrouve s_inodes_per_group.',
    build: () => {
      const ipg = [1024,2048,4096,8192][rand(0,3)];
      const bytes = new Array(64).fill(0);
      const total = ipg * rand(10,50);
      bytes[0]=total&0xFF; bytes[1]=(total>>8)&0xFF; bytes[2]=(total>>16)&0xFF; bytes[3]=(total>>24)&0xFF;
      bytes[0x28%64]=ipg&0xFF; bytes[0x29%64]=(ipg>>8)&0xFF;
      bytes[0x38%64]=0xEF; bytes[0x39%64]=0x53;
      return { bytes, answer: '28', answer_val: ipg,
        hint1: 'Le superbloc EXT est à l\'offset 1024. s_magic (EF 53) est à 0x38. Les compteurs sont en début de structure.',
        hint2: 's_inodes_per_group est à l\'offset <strong>0x28</strong> (4 octets Little Endian).',
        explain: `Offset <strong>0x28</strong> = s_inodes_per_group = <strong>${ipg}</strong>. Formule groupe : (inode-1) ÷ ${ipg}.` };
    }
  }
];

let _hexTableIdx = 0;
let _hexTableHintStep = 0;

function genHexTable() {
  const cfg = HEX_TABLE_EXERCISES[_hexTableIdx % HEX_TABLE_EXERCISES.length];
  _hexTableIdx++;
  _hexTableHintStep = 0;
  const ex = cfg.build();
  const bytes = ex.bytes;

  // Utiliser renderHexDump (avec en-tête de colonnes) — 16 colonnes pour BPB
  const dumpRows = [{ offset: '00000000', bytes: bytes }];
  // Highlight de l'octet correct (sera révélé après réponse)
  const dumpHTML = renderHexDump(dumpRows, [], {cols: 16, title: cfg.name});

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">🗺</div>
      <div class="ex-title">Table Hex — ${cfg.name}</div>
      <span class="ex-badge hard">Offset</span>
    </div>
    <div class="ex-scenario">${cfg.scenario}</div>
    ${dumpHTML}
    <div class="sec-title" style="margin-top:.75rem">À quel offset (hex) se trouve le champ demandé ?</div>
    <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin-bottom:.5rem">
      <span style="font-size:.8rem;color:var(--muted)">0x</span>
      <input class="ex-input" id="inp-hextable" placeholder="ex: 0D" maxlength="4" style="width:90px;text-transform:uppercase" autocomplete="off">
      <button class="btn-hint" id="ht-hint-btn">💡 Indice</button>
      <button class="btn-validate" id="ht-validate-btn">Valider ✓</button>
      <button class="btn-next" id="btn-next-ht" onclick="newExercise()" style="display:none">Exercice suivant →</button>
    </div>
    <div class="hint-box" id="hint-ht" style="display:none"></div>
    <div class="ex-feedback" id="ex-feedback-ht" style="display:none"></div>
  `;
  setTimeout(() => {
    const inp = div.querySelector('#inp-hextable');
    if (inp) inp.addEventListener('keydown', e => { if(e.key==='Enter') div.querySelector('#ht-validate-btn').click(); });
    const hintBtn = div.querySelector('#ht-hint-btn');
    if (hintBtn) hintBtn.addEventListener('click', () => showHexTableHint(ex.hint1, ex.hint2));
    const validateBtn = div.querySelector('#ht-validate-btn');
    if (validateBtn) validateBtn.addEventListener('click', () => checkHexTable(ex.answer, ex.explain, ex.answer_val));
  }, 50);
  return div;
}

function showHexTableHint(h1, h2) {
  _hexTableHintStep++;
  const box = document.getElementById('hint-ht');
  if (!box) return;
  box.innerHTML = `💡 <strong>Indice ${_hexTableHintStep} :</strong> ${_hexTableHintStep===1?h1:h2}`;
  box.style.display = 'block';
  if (_hexTableHintStep >= 2) {
    const btn = document.getElementById('ht-hint-btn');
    if (btn) { btn.disabled = true; btn.textContent = '✅ Indices épuisés'; }
  }
}

function checkHexTable(correctOff, explain, val) {
  const inp = document.getElementById('inp-hextable');
  const fb  = document.getElementById('ex-feedback-ht');
  const nx  = document.getElementById('btn-next-ht');
  if (!inp) return;
  const raw = inp.value.trim().replace(/^0x/i,'').toUpperCase().padStart(2,'0');
  const isOk = raw === correctOff.toUpperCase().padStart(2,'0');
  inp.className = 'ex-input ' + (isOk ? 'correct' : 'wrong');
  if (isOk) {
    if (!STATE.hintUsed) incSolved('hextable');
  } else {
    breakStreak();
  }
  if (fb) {
    fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
    fb.innerHTML = isOk ? `✅ ${explain}` : `❌ L'offset correct est <strong>0x${correctOff}</strong> (valeur = ${val}) — ${explain}`;
    fb.style.display = 'block';
  }
  if (nx) nx.style.display = 'inline-block';
}

// ═══════════════════════════════════════════════════
// 19. IDENTIFIER LE SYSTÈME DE FICHIERS
// ═══════════════════════════════════════════════════
function genFSIdentify() {
  const ALL_FS = ['FAT12','FAT16','FAT32','NTFS','exFAT','EXT4','HFS+'];

  const fsOptions = [
    {
      fs: 'FAT12',
      context: 'Secteur de boot — disquette ou très petite partition',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        bytes[0]=0xEB; bytes[1]=0x3C; bytes[2]=0x90;
        'MSDOS5.0'.split('').forEach((c,i)=>bytes[3+i]=c.charCodeAt(0));
        bytes[0x0B]=0x00; bytes[0x0C]=0x02; // BPS=512
        bytes[0x0D]=0x01;                    // SPC=1
        bytes[0x0E]=0x01; bytes[0x0F]=0x00; // Reserved=1
        bytes[0x10]=0x02;                    // NumFATs=2
        bytes[0x11]=0xE0; bytes[0x12]=0x00; // RootEntries=224
        bytes[0x13]=0x40; bytes[0x14]=0x0B; // TotalSectors16=2880
        bytes[0x15]=0xF0;                    // Media=0xF0 (removable)
        bytes[0x16]=0x09; bytes[0x17]=0x00; // FATsize=9
        // FS type label à 0x36
        if (0x36+8 <= 64) 'FAT12   '.split('').forEach((c,i)=>bytes[0x36+i]=c.charCodeAt(0));
        return { bytes, key: 'OEM "MSDOS5.0" + RootEntries=224 + MediaType=0xF0 (amovible) + label "FAT12   " à 0x36 → FAT12 (disquette 1.44 Mo).' };
      }
    },
    {
      fs: 'FAT16',
      context: 'Secteur de boot — partition entre 32 Mo et 2 Go',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        bytes[0]=0xEB; bytes[1]=0x58; bytes[2]=0x90;
        'MSDOS5.0'.split('').forEach((c,i)=>bytes[3+i]=c.charCodeAt(0));
        bytes[0x0B]=0x00; bytes[0x0C]=0x02; // BPS=512
        bytes[0x0D]=0x04;                    // SPC=4
        bytes[0x0E]=0x04; bytes[0x0F]=0x00; // Reserved=4
        bytes[0x10]=0x02;                    // NumFATs=2
        bytes[0x11]=0x00; bytes[0x12]=0x02; // RootEntries=512
        bytes[0x13]=0x00; bytes[0x14]=0x00; // TotalSectors16=0 → utiliser TotalSectors32
        bytes[0x15]=0xF8;                    // Media=0xF8 (fixe)
        bytes[0x16]=0xFA; bytes[0x17]=0x00; // FATsize=250
        if (0x36+8 <= 64) 'FAT16   '.split('').forEach((c,i)=>bytes[0x36+i]=c.charCodeAt(0));
        return { bytes, key: 'RootEntries=512 (0x0200) aux offsets 0x11-0x12 ≠ 0, label "FAT16   " à 0x36 → FAT16. MediaType=0xF8 = partition fixe.' };
      }
    },
    {
      fs: 'FAT32',
      context: 'Secteur de boot — partition > 2 Go (carte SD, USB, HDD)',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        bytes[0]=0xEB; bytes[1]=0x58; bytes[2]=0x90;
        'MSWIN4.1'.split('').forEach((c,i)=>bytes[3+i]=c.charCodeAt(0));
        bytes[0x0B]=0x00; bytes[0x0C]=0x02; // BPS=512
        bytes[0x0D]=0x08;                    // SPC=8
        bytes[0x0E]=0x20; bytes[0x0F]=0x00; // Reserved=32
        bytes[0x10]=0x02;                    // NumFATs=2
        bytes[0x11]=0x00; bytes[0x12]=0x00; // RootEntries=0 → FAT32 !
        bytes[0x13]=0x00; bytes[0x14]=0x00; // TotalSectors16=0
        bytes[0x15]=0xF8;                    // Media=0xF8
        bytes[0x16]=0x00; bytes[0x17]=0x00; // FATSz16=0 → voir FAT32 BPB étendu
        return { bytes, key: 'OEM "MSWIN4.1" + RootEntryCount=0 (offsets 0x11-0x12) + FATSz16=0 → FAT32. Le répertoire racine est dans la zone données (cluster 2+).' };
      }
    },
    {
      fs: 'NTFS',
      context: 'Boot sector NTFS — partition Windows moderne',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        bytes[0]=0xEB; bytes[1]=0x52; bytes[2]=0x90;
        'NTFS    '.split('').forEach((c,i)=>bytes[3+i]=c.charCodeAt(0)); // 4 espaces !
        bytes[0x0B]=0x00; bytes[0x0C]=0x02; // BPS=512
        bytes[0x0D]=0x08;                    // SPC=8
        bytes[0x0E]=0x00; bytes[0x0F]=0x00; // Reserved=0 (NTFS n'utilise pas ce champ)
        bytes[0x10]=0x00;                    // NumFATs=0
        bytes[0x11]=0x00; bytes[0x12]=0x00; // RootEntries=0
        bytes[0x13]=0x00; bytes[0x14]=0x00; // TotalSectors16=0
        bytes[0x15]=0xF8;
        return { bytes, key: 'OEM ID "NTFS    " (exactement 4 espaces) à l\'offset 0x03 identifie NTFS. NumFATs=0 et Reserved=0 confirment (NTFS ignore le BPB standard).' };
      }
    },
    {
      fs: 'exFAT',
      context: 'Boot sector exFAT — clés USB/SDXC > 32 Go',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        bytes[0]=0xEB; bytes[1]=0x76; bytes[2]=0x90;
        'EXFAT   '.split('').forEach((c,i)=>bytes[3+i]=c.charCodeAt(0)); // 3 espaces
        // offsets 0x0B à 0x3F DOIVENT être à zéro en exFAT
        // (déjà à 0 grâce à fill(0))
        bytes[0x40]=0x00; bytes[0x41]=0x00; // VolumeSerialNumber lo
        bytes[0x42]=0x01; bytes[0x43]=0x00; // (simulé)
        return { bytes, key: '"EXFAT   " (3 espaces) à l\'offset 0x03 + octets 0x0B–0x3F tous à zéro = signature exFAT. BPS et SPC utilisent des champs décalés (0x6C+).' };
      }
    },
    {
      fs: 'EXT4',
      context: 'Superbloc EXT4 — commence à l\'offset 1024 du volume',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        // s_inodes_count (LE32) à 0x00
        bytes[0]=0x00; bytes[1]=0x80; bytes[2]=0x00; bytes[3]=0x00; // 32768 inodes
        // s_blocks_count (LE32) à 0x04
        bytes[4]=0x00; bytes[5]=0x00; bytes[6]=0x04; bytes[7]=0x00; // 262144 blocs
        // s_log_block_size (LE32) à 0x18 : 2 → blocksize=4096
        bytes[0x18]=0x02; bytes[0x19]=0x00; bytes[0x1A]=0x00; bytes[0x1B]=0x00;
        // s_magic (LE16) à 0x38 : 0xEF53 → 53 EF en mémoire
        bytes[0x38]=0x53; bytes[0x39]=0xEF;
        // s_rev_level à 0x3C : 1 = dynamic (EXT3/4)
        bytes[0x3C]=0x01; bytes[0x3D]=0x00; bytes[0x3E]=0x00; bytes[0x3F]=0x00;
        return { bytes, key: 'Magic 0xEF53 (53 EF en Little Endian) à l\'offset 0x38 du superbloc (offset 1024 du volume) identifie EXT2/3/4. s_log_block_size=2 → taille bloc = 4096 o.' };
      }
    },
    {
      fs: 'HFS+',
      context: 'Volume Header HFS+ — commence à l\'offset 1024 du volume (Big Endian)',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        // signature 0x482B = 'H+' en Big Endian
        bytes[0]=0x48; bytes[1]=0x2B;
        // version = 4 (HFS+) en Big Endian
        bytes[2]=0x00; bytes[3]=0x04;
        // attributes (Big Endian) à 0x04
        bytes[4]=0x00; bytes[5]=0x00; bytes[6]=0x80; bytes[7]=0x00;
        // blockSize (Big Endian) à 0x14 = 4096 = 0x00001000
        bytes[0x14]=0x00; bytes[0x15]=0x00; bytes[0x16]=0x10; bytes[0x17]=0x00;
        // totalBlocks (Big Endian) à 0x18
        bytes[0x18]=0x00; bytes[0x19]=0x10; bytes[0x1A]=0x00; bytes[0x1B]=0x00;
        return { bytes, key: 'Signature 0x482B ("H+") en Big Endian à l\'offset 0 du Volume Header (= offset 1024 du volume). Tout HFS+ est Big Endian, contrairement aux FS Windows. Version=4.' };
      }
    }
  ];

  const cfg = fsOptions[rand(0, fsOptions.length - 1)];
  const ex = cfg.build();
  const bytes = ex.bytes;

  // Garantir que la bonne réponse est toujours dans les choix
  const others = ALL_FS.filter(f => f !== cfg.fs).sort(() => Math.random() - .5).slice(0, 4);
  const choices = [...others, cfg.fs].sort(() => Math.random() - .5);

  // Pourquoi chaque mauvais choix est faux dans ce contexte particulier
  const WRONG_REASONS = {
    'FAT12': "FAT12 a un MediaType 0xF0 (amovible), RootEntries=224 (typique disquette 1.44 Mo), et un label 'FAT12' à 0x36. Aucune de ces signatures n'est ici.",
    'FAT16': "FAT16 a RootEntries entre 1 et 65535 (≠ 0) à 0x11–0x12 et un label 'FAT16' à 0x36. Manquant ici.",
    'FAT32': "FAT32 a RootEntryCount=0 (signature distinctive) à 0x11–0x12 et FATSz16=0 à 0x16. Le BPB étendu commence à 0x24.",
    'NTFS':  "NTFS a OEM ID 'NTFS    ' (avec 4 espaces) à 0x03 et NumFATs=0 à 0x10. Le boot n'utilise pas le BPB FAT classique.",
    'exFAT': "exFAT a OEM ID 'EXFAT   ' (3 espaces) à 0x03 et tous les octets de 0x0B à 0x3F sont à 0 (champs déplacés à 0x6C+).",
    'EXT4':  "EXT4 commence à offset 1024 du volume (superbloc), magic 0xEF53 à offset 0x38. Pas de BPB classique en début.",
    'HFS+':  "HFS+ commence à offset 1024 du volume, signature 0x482B ('H+') en Big Endian à offset 0x00 du Volume Header.",
  };

  // Utilise le nouveau renderer 16 cols avec en-tête
  const dumpRows = [{ offset: '00000000', bytes: bytes }];
  const dumpHTML = renderHexDump(dumpRows, [], {cols: 16, title: '64 premiers octets — secteur de boot ou superbloc'});

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">🔍</div>
      <div class="ex-title">Identifier le système de fichiers</div>
      <span class="ex-badge medium">OEM ID · Magic · BPB</span>
    </div>
    <div class="ex-scenario">
      <strong>Contexte :</strong> ${cfg.context}<br>
      Analyse les 64 premiers octets ci-dessous et identifie le système de fichiers.
    </div>
    ${dumpHTML}
    <div class="sec-title" style="margin-top:.75rem">Système de fichiers</div>
    <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="fsid-choices">
      ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:90px"
        data-correct="${c === cfg.fs}"
        data-fs="${escAttr(c)}"
        data-wrong-reason="${encData(WRONG_REASONS[c] || '')}"
        data-correct-explain="${encData(ex.key)}">${c}</button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-fsid" style="display:none"></div>
    <button class="btn-next" id="btn-next-fsid" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  setTimeout(() => {
    div.querySelectorAll('#fsid-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        const wrongReason = decData(b.dataset.wrongReason) || '';
        const correctEx = decData(b.dataset.correctExplain) || '';
        checkFSIdentify(b, isOk, correctEx, wrongReason, cfg.fs);
      });
    });
  }, 0);
  return div;
}

function checkFSIdentify(btn, isOk, correctExplain, wrongReason, correctFs) {
  document.querySelectorAll('#fsid-choices .tp-choice').forEach(b => { b.disabled = true; });
  btn.classList.add(isOk ? 'correct' : 'wrong');
  if (isOk) {
    if (!STATE.hintUsed) incSolved('fsidentify');
  } else {
    breakStreak();
    document.querySelectorAll('#fsid-choices .tp-choice').forEach(b => {
      if (b.dataset.correct === 'true') b.classList.add('correct');
      else if (b !== btn) b.classList.add('dim');
    });
  }
  const fb = document.getElementById('ex-feedback-fsid');
  if (fb) {
    fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
    const wrongFull = isOk
      ? ''
      : `${wrongReason ? wrongReason + ' ' : ''}La bonne réponse est <strong>${correctFs}</strong>.`;
    fb.innerHTML = formatChoiceFeedback(isOk, correctExplain, wrongFull);
    fb.style.display = 'block';
  }
  document.getElementById('btn-next-fsid').style.display = 'inline-block';
}

// ═══════════════════════════════════════════════════
// 20. HASH & INTÉGRITÉ
// ═══════════════════════════════════════════════════
const HASH_SAMPLES = {
  'MD5':     { bits:128, len:32,  note:'128 bits → 32 hex chars. Collisions connues — insuffisant seul en forensique (RFC 6151).' },
  'SHA-1':   { bits:160, len:40,  note:'160 bits → 40 hex chars. Collisions SHAttered (2017) — ne pas utiliser seul.' },
  'SHA-256': { bits:256, len:64,  note:'256 bits → 64 hex chars. Standard forensique actuel — requis par ISO/IEC 27037.' },
  'SHA-512': { bits:512, len:128, note:'512 bits → 128 hex chars. Utilisé pour les images très critiques.' },
};

function genHashIdentify() {
  const types = Object.keys(HASH_SAMPLES);
  const target = types[rand(0, types.length-1)];
  const qType = rand(0, 2);
  let scenario, choices;

  if (qType === 0) {
    const hash = Array.from({length: HASH_SAMPLES[target].len}, ()=>'0123456789abcdef'[rand(0,15)]).join('');
    scenario = `Quel algorithme a produit ce hash ?<br><code style="color:var(--cyan);word-break:break-all;font-size:.7rem;display:block;margin-top:.4rem;padding:.4rem;background:var(--bg);border-radius:4px">${hash}</code>`;
    choices = types.map(t=>({text:`${t} — ${HASH_SAMPLES[t].len} caractères (${HASH_SAMPLES[t].bits} bits)`, correct:t===target, explain:HASH_SAMPLES[t].note}));
  } else if (qType === 1) {
    scenario = `Combien de <strong>caractères hexadécimaux</strong> contient un hash <strong>${target}</strong> ?`;
    const info = HASH_SAMPLES[target];
    const wrongs = types.filter(t=>t!==target).map(t=>HASH_SAMPLES[t].len);
    const allLens = [...new Set([info.len,...wrongs])].sort(()=>Math.random()-.5);
    choices = allLens.map(l=>({text:`${l} caractères`,correct:l===info.len,explain:`${target} = ${info.bits} bits ÷ 4 bits/hex = <strong>${info.len} caractères</strong>. ${info.note}`}));
  } else {
    scenario = 'Lequel de ces scénarios <strong>invalide</strong> une chaîne de custody basée sur le hash ?';
    choices = [
      {text:'Hash SHA-256 identique avant et après transport', correct:false, explain:'Hashes identiques = intégrité prouvée. Chaîne de custody valide.'},
      {text:'Hash recalculé après copie : résultat différent de l\'original', correct:true, explain:'Hash différent = altération détectée. Preuve potentiellement irrecevable (art. 141 CPP). Toute divergence doit être documentée.'},
      {text:'Deux analystes obtiennent le même hash sur la même image', correct:false, explain:'Reproductibilité confirmée — l\'un des 4 critères ISO/IEC 27037.'},
      {text:'Hash calculé immédiatement après acquisition avec write-blocker', correct:false, explain:'Procédure correcte selon RFC 3227 et ISO/IEC 27037 §8.3.'},
    ];
    choices = choices.sort(()=>Math.random()-.5);
  }

  const shuffled = choices.sort(()=>Math.random()-.5);
  const correctIdx = shuffled.findIndex(c => c.correct);
  const correctExplain = shuffled[correctIdx].explain;

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">🔑</div>
      <div class="ex-title">Hash &amp; Intégrité forensique</div>
      <span class="ex-badge easy">MD5 · SHA-1 · SHA-256 · SHA-512</span>
    </div>
    <div class="ex-scenario">${scenario}</div>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="hash-choices">
      ${shuffled.map((c,i)=>`<button class="tp-choice"
        data-correct="${c.correct}"
        data-explain="${encData(c.explain)}"
        data-correct-explain="${encData(correctExplain)}">
        <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span><span>${c.text}</span></button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-hash" style="display:none"></div>
    <button class="btn-next" id="btn-next-hash" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  setTimeout(() => {
    div.querySelectorAll('#hash-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        const explain = decData(b.dataset.explain) || '';
        const correctEx = decData(b.dataset.correctExplain) || '';
        checkHashIdentify(b, isOk, explain, correctEx);
      });
    });
  }, 0);
  return div;
}

function checkHashIdentify(btn, isOk, wrongExplain, correctExplain) {
  document.querySelectorAll('#hash-choices .tp-choice').forEach(b=>{ b.disabled=true; });
  btn.classList.add(isOk ? 'correct' : 'wrong');
  if (isOk) { if (!STATE.hintUsed) incSolved('hash'); }
  else {
    breakStreak();
    document.querySelectorAll('#hash-choices .tp-choice').forEach(b=>{
      if(b.dataset.correct==='true') b.classList.add('correct');
      else if(b!==btn) b.classList.add('dim');
    });
  }
  const fb=document.getElementById('ex-feedback-hash');
  if(fb){
    fb.className='ex-feedback '+(isOk?'correct':'wrong');
    fb.innerHTML = formatChoiceFeedback(isOk, correctExplain || wrongExplain, wrongExplain);
    fb.style.display='block';
  }
  document.getElementById('btn-next-hash').style.display='inline-block';
}


// ═══════════════════════════════════════════════════════════════
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
  const scenario = rand(0, 9);

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

  } else { // scenario === 8 — EXT4 magic
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
// 24. SLACK SPACE — calcul d'espace résiduel dans un cluster
// ═══════════════════════════════════════════════════════════════
//
// Sous-types :
//   0 — Calculer le file slack (taille logique → espace résiduel dans le dernier cluster)
//   1 — Calculer le RAM slack (dernier secteur partiellement rempli, zéros de padding)
//   2 — Calculer la taille logique max d'un fichier sans slack (fichier "parfait")
//   3 — Cas inverse : donner le slack → retrouver la taille du fichier
//
// Valeurs volontairement petites : BPS=512, SPC ≤ 8, taille fichier ≤ 32 Ko
//
function genSlackSpace() {
  const subtype = rand(0, 3);

  // Palette de configurations BPS × SPC réalistes et calculables mentalement
  const CONFIGS = [
    { bps: 512, spc: 1 },   // cluster = 512 o  (FAT12 disquette, petit)
    { bps: 512, spc: 2 },   // cluster = 1024 o
    { bps: 512, spc: 4 },   // cluster = 2048 o  (FAT16 typique)
    { bps: 512, spc: 8 },   // cluster = 4096 o  (FAT32/NTFS courant)
  ];
  const cfg = CONFIGS[rand(0, CONFIGS.length - 1)];
  const bps = cfg.bps;
  const spc = cfg.spc;
  const cs  = bps * spc;   // taille d'un cluster en octets

  // Helper unifié pour les indices progressifs (réutilisé par les 4 sous-types).
  function showSSHint(div, level, html) {
    markHintUsed();
    const fb = div.querySelector('#ex-feedback-ss');
    fb.style.display = 'block'; fb.className = 'ex-feedback correct';
    fb.innerHTML = `<div style="font-size:.7rem;color:var(--dim);margin-bottom:.25rem">Indice ${level}/3</div>${html}`;
    const next = div.querySelector(`#ss-h${level+1}`);
    if (next) { next.disabled = false; next.style.opacity = '1'; }
    div.querySelector(`#ss-h${level}`).style.opacity = '.35';
  }

  // ── Sous-type 0 : File Slack = cluster_slack ─────────────────
  // Taille fichier quelconque → dernier cluster partiellement rempli
  // On force le fichier à ne PAS être un multiple exact de cs pour avoir un slack ≠ 0
  if (subtype === 0) {
    // Nombre de clusters complets + octets résiduels
    const fullClusters = rand(1, 6);
    const residual     = rand(1, cs - 1);         // 1..cs-1 → slack ≠ 0
    const fileSize     = fullClusters * cs + residual;
    const fileSlack    = cs - residual;            // octets inutilisés dans le dernier cluster
    const totalAlloc   = (fullClusters + 1) * cs;

    const distractors = [
      cs,           // confusion avec taille cluster
      residual,     // confusion résiduel vs slack
      bps - (residual % bps) === bps ? 1 : bps - (residual % bps),  // RAM slack
      fileSize % cs // confusion
    ].filter(v => v !== fileSlack && v > 0 && v < cs).slice(0, 3);
    // Compléter si besoin
    while (distractors.length < 3) distractors.push(distractors[0] + rand(1,4) * bps);
    const choices = [fileSlack, ...distractors.slice(0,3)].sort(() => Math.random() - .5);

    const lastSectorResidual = residual % bps;         // octets dans le dernier secteur
    const ramSlack = lastSectorResidual === 0 ? 0 : bps - lastSectorResidual;

    const hints = [
      `Le <strong>file slack</strong> = espace non utilisé à la fin du dernier cluster alloué.<br>
       Formule : <code>file_slack = taille_cluster − (taille_fichier mod taille_cluster)</code><br>
       Si le fichier est un multiple exact → slack = 0. Sinon, un cluster entier est alloué pour les octets résiduels.`,

      `Taille cluster = ${bps} × ${spc} = <strong>${cs} octets</strong>.<br>
       Octets résiduels dans le dernier cluster = ${fileSize} mod ${cs} = <strong>${residual} o</strong>.<br>
       File slack = ${cs} − ${residual} = <strong>? octets</strong>`,

      `File slack = ${cs} − ${residual} = <strong>${fileSlack} octets</strong>.<br>
       Ces ${fileSlack} octets sont alloués sur le disque mais non utilisés par le fichier.<br>
       Ils peuvent contenir des données résiduelles d'un fichier précédent — zone forensiquement intéressante.`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-ss">🪣</div>
        <div class="ex-title">Slack Space — File Slack</div>
        <span class="ex-badge medium">FAT · Cluster · Résiduel</span>
      </div>
      <div class="ex-scenario">
        Un fichier de <strong>${fileSize.toLocaleString('fr-CH')} octets</strong> est stocké sur un volume FAT avec :<br>
        <span style="font-family:var(--mono)">BytesPerSector = ${bps} · SectorsPerCluster = ${spc} · Taille cluster = <strong>${cs} o</strong></span><br><br>
        <strong>Quel est le file slack de ce fichier ?</strong>
        <span style="color:var(--dim);font-size:.77rem;display:block;margin-top:.3rem">(espace résiduel non utilisé à la fin du dernier cluster)</span>
      </div>
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.7rem 1rem;margin-bottom:.8rem">
        <div style="font-size:.76rem;color:var(--dim);margin-bottom:.5rem">Visualisation de l'allocation :</div>
        <div style="display:flex;gap:2px;flex-wrap:wrap;margin-bottom:.4rem">
          ${Array.from({length: fullClusters}, (_,i) =>
            `<div title="Cluster ${i+1} — plein" style="height:22px;flex:1;min-width:28px;background:var(--cyan);opacity:.7;border-radius:3px;font-size:.62rem;display:flex;align-items:center;justify-content:center;color:#000;font-weight:700">${cs}</div>`
          ).join('')}
          <div title="Dernier cluster — partiellement utilisé" style="height:22px;flex:1;min-width:80px;border-radius:3px;overflow:hidden;display:flex">
            <div style="width:${Math.round(residual/cs*100)}%;background:var(--cyan);opacity:.7;display:flex;align-items:center;justify-content:center;font-size:.6rem;color:#000;font-weight:700">${residual}o</div>
            <div style="flex:1;background:var(--red);opacity:.4;display:flex;align-items:center;justify-content:center;font-size:.6rem;color:var(--red);font-weight:700">?</div>
          </div>
        </div>
        <div style="font-size:.7rem;display:flex;gap:1rem">
          <span><span style="display:inline-block;width:10px;height:10px;background:var(--cyan);opacity:.7;border-radius:2px;margin-right:3px"></span>Données fichier</span>
          <span><span style="display:inline-block;width:10px;height:10px;background:var(--red);opacity:.4;border-radius:2px;margin-right:3px"></span>File slack (à calculer)</span>
        </div>
      </div>
      <div style="background:rgba(0,0,0,.25);border:1px solid var(--border);border-radius:8px;padding:.55rem .9rem;margin-bottom:.75rem;font-family:var(--mono);font-size:.76rem">
        <div>Taille fichier   = <strong>${fileSize.toLocaleString('fr-CH')} o</strong></div>
        <div>Clusters alloués = <strong>${fullClusters + 1}</strong> (${totalAlloc.toLocaleString('fr-CH')} o au total)</div>
        <div>Taille cluster   = <strong>${cs} o</strong></div>
      </div>
      <div class="sec-title">File slack (octets)</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="ss-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:90px;font-family:var(--mono)"
            data-correct="${c === fileSlack}">${c.toLocaleString('fr-CH')} o</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="ss-h1">💡 Niveau 1 — Concept</button>
        <button class="btn-hint" id="ss-h2" disabled style="opacity:.45">💡 Niveau 2 — Calcul intermédiaire</button>
        <button class="btn-hint" id="ss-h3" disabled style="opacity:.45">💡 Niveau 3 — Résultat</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-ss" style="display:none"></div>
      <button class="btn-next" id="btn-next-ss" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#ss-h1').addEventListener('click', () => showSSHint(div, 1, hints[0]));
    div.querySelector('#ss-h2').addEventListener('click', () => showSSHint(div, 2, hints[1]));
    div.querySelector('#ss-h3').addEventListener('click', () => showSSHint(div, 3, hints[2]));

    div.querySelectorAll('#ss-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#ss-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('slackspace');
        const fb = div.querySelector('#ex-feedback-ss');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `File slack = ${cs} − (${fileSize} mod ${cs}) = ${cs} − ${residual} = <strong>${fileSlack} octets</strong>.
          <div style="margin-top:.4rem;font-size:.76rem;color:var(--dim)">
            Ces ${fileSlack} o sont alloués sur le disque mais vides — ils peuvent contenir des résidus du fichier précédent qui occupait ces clusters.<br>
            RAM slack (dernier secteur) : ${ramSlack === 0 ? '0 o (secteur plein)' : `${ramSlack} o — remplis de zéros par l'OS.`}
          </div>`;
        fb.innerHTML = isOk
          ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain,
              `Rappel : file_slack = taille_cluster − (taille_fichier mod taille_cluster) = ${cs} − ${residual} = ${fileSlack} o`);
        div.querySelector('#btn-next-ss').style.display = 'inline-block';
        div.querySelector('#ex-num-ss').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 1 : RAM Slack ──────────────────────────────────
  // Le dernier secteur utilisé du fichier n'est que partiellement rempli.
  // L'OS (DOS/Win) complète le reste du secteur avec le contenu de la RAM (ou zéros sur NT).
  if (subtype === 1) {
    // Taille fichier : nombre entier de secteurs complets + octets résiduels dans le dernier secteur
    const fullSectors  = rand(1, spc * 4);
    const residualBytes= rand(1, bps - 1);       // jamais 0 → RAM slack ≠ 0
    const fileSize     = fullSectors * bps + residualBytes;
    const ramSlack     = bps - residualBytes;    // octets de padding dans le dernier secteur
    // File slack = le reste du dernier cluster (secteurs non utilisés × bps)
    const usedSectorsInLastCluster = (Math.ceil(fileSize / bps)) % spc || spc;
    const fileSlack = (spc - usedSectorsInLastCluster) * bps;

    const distractors = [
      bps - residualBytes + bps,
      residualBytes,
      bps,
    ].filter(v => v !== ramSlack && v > 0).slice(0, 3);
    const choices = [ramSlack, ...distractors].sort(() => Math.random() - .5);

    const hints = [
      `Le <strong>RAM slack</strong> (aussi appelé "sector slack") est l'espace entre la fin logique du fichier et la fin du dernier <em>secteur</em> utilisé.<br>
       Formule : <code>ram_slack = BPS − (taille_fichier mod BPS)</code><br>
       Si taille_fichier mod BPS = 0 → pas de RAM slack. Sinon, l'OS remplit le reste du secteur (zéros sur Windows NT+).`,

      `BPS = ${bps} octets.<br>
       ${fileSize} mod ${bps} = <strong>${residualBytes} octets</strong> utilisés dans le dernier secteur.<br>
       RAM slack = ${bps} − ${residualBytes} = <strong>? octets</strong>`,

      `RAM slack = ${bps} − ${residualBytes} = <strong>${ramSlack} octets</strong>.<br>
       File slack additionnel = ${fileSlack} o (secteurs entiers non utilisés dans le dernier cluster).<br>
       Slack total = ${ramSlack} + ${fileSlack} = <strong>${ramSlack + fileSlack} o</strong>.`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-ss">🪣</div>
        <div class="ex-title">Slack Space — RAM Slack (Sector Slack)</div>
        <span class="ex-badge hard">Secteur · Padding · Résidus RAM</span>
      </div>
      <div class="ex-scenario">
        Un fichier de <strong>${fileSize.toLocaleString('fr-CH')} octets</strong> sur un volume :<br>
        <span style="font-family:var(--mono)">BPS = ${bps} · SPC = ${spc} · Cluster = ${cs} o</span><br><br>
        <strong>Quel est le RAM slack de ce fichier ?</strong>
        <span style="color:var(--dim);font-size:.77rem;display:block;margin-top:.3rem">(octets de padding entre fin du fichier et fin du dernier secteur utilisé)</span>
      </div>
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.7rem 1rem;margin-bottom:.8rem">
        <div style="font-size:.75rem;color:var(--dim);margin-bottom:.4rem">Dernier secteur du fichier :</div>
        <div style="display:flex;height:20px;border-radius:4px;overflow:hidden;margin-bottom:.35rem">
          <div style="width:${Math.round(residualBytes/bps*100)}%;background:var(--cyan);opacity:.75;display:flex;align-items:center;justify-content:center;font-size:.62rem;color:#000;font-weight:700">${residualBytes} o (fichier)</div>
          <div style="flex:1;background:var(--gold);opacity:.5;display:flex;align-items:center;justify-content:center;font-size:.62rem;color:var(--gold);font-weight:700">RAM slack ?</div>
        </div>
        <div style="font-size:.7rem;display:flex;gap:1rem">
          <span><span style="display:inline-block;width:10px;height:10px;background:var(--cyan);opacity:.75;border-radius:2px;margin-right:3px"></span>Données fichier</span>
          <span><span style="display:inline-block;width:10px;height:10px;background:var(--gold);opacity:.5;border-radius:2px;margin-right:3px"></span>RAM slack (zéros / résidus RAM)</span>
        </div>
      </div>
      <div style="background:rgba(0,0,0,.25);border:1px solid var(--border);border-radius:8px;padding:.55rem .9rem;margin-bottom:.75rem;font-family:var(--mono);font-size:.76rem">
        <div>Taille fichier       = <strong>${fileSize.toLocaleString('fr-CH')} o</strong></div>
        <div>Bytes per sector     = <strong>${bps} o</strong></div>
        <div>${fileSize} mod ${bps} = <strong>${residualBytes} o</strong> (dans le dernier secteur)</div>
      </div>
      <div class="sec-title">RAM slack (octets)</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="ss-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:90px;font-family:var(--mono)"
            data-correct="${c === ramSlack}">${c.toLocaleString('fr-CH')} o</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="ss-h1">💡 Niveau 1 — Concept</button>
        <button class="btn-hint" id="ss-h2" disabled style="opacity:.45">💡 Niveau 2 — Calcul intermédiaire</button>
        <button class="btn-hint" id="ss-h3" disabled style="opacity:.45">💡 Niveau 3 — Résultat + slack total</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-ss" style="display:none"></div>
      <button class="btn-next" id="btn-next-ss" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#ss-h1').addEventListener('click', () => showSSHint(div, 1, hints[0]));
    div.querySelector('#ss-h2').addEventListener('click', () => showSSHint(div, 2, hints[1]));
    div.querySelector('#ss-h3').addEventListener('click', () => showSSHint(div, 3, hints[2]));

    div.querySelectorAll('#ss-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#ss-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('slackspace');
        const fb = div.querySelector('#ex-feedback-ss');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `RAM slack = BPS − (${fileSize} mod ${bps}) = ${bps} − ${residualBytes} = <strong>${ramSlack} o</strong>.
          <div style="margin-top:.35rem;font-size:.76rem;color:var(--dim)">
            Ces ${ramSlack} o sont écrits par l'OS à la fin du dernier secteur (zéros sur Windows NT/XP+, contenu de la RAM sur DOS/Win9x).<br>
            File slack en plus : ${fileSlack} o (secteurs du cluster non alloués au fichier). Slack total = ${ramSlack + fileSlack} o.
          </div>`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain,
              `RAM slack = BPS − (taille_fichier mod BPS) = ${bps} − ${residualBytes} = ${ramSlack} o.`);
        div.querySelector('#btn-next-ss').style.display = 'inline-block';
        div.querySelector('#ex-num-ss').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 2 : taille max sans slack (fichier "parfait") ──
  // Donner N clusters alloués → quelle est la taille logique max pour que le slack soit nul ?
  if (subtype === 2) {
    const nClusters = rand(2, 8);
    const answer = nClusters * cs;   // taille = multiple exact → slack = 0

    const distractors = [
      answer - 1,
      answer + 1,
      answer - bps,
      nClusters * bps,   // confusion SPC
    ].filter(v => v !== answer && v > 0).slice(0, 3);
    const choices = [answer, ...distractors].sort(() => Math.random() - .5);

    const hints = [
      `Le slack est <strong>nul</strong> quand la taille du fichier est un <strong>multiple exact de la taille du cluster</strong>.<br>
       Formule : <code>taille_max_sans_slack = N_clusters × taille_cluster</code>`,

      `${nClusters} clusters × ${cs} o/cluster = <strong>? octets</strong><br>
       Si la taille est exactement ce multiple, le dernier cluster est utilisé à 100% → slack = 0.`,

      `${nClusters} × ${cs} = <strong>${answer.toLocaleString('fr-CH')} octets</strong> — taille pour laquelle le slack est strictement nul.<br>
       1 octet de plus → 1 nouveau cluster alloué → ${cs - 1} o de slack.`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-ss">🪣</div>
        <div class="ex-title">Slack Space — Taille sans slack</div>
        <span class="ex-badge easy">Cluster · Multiple exact</span>
      </div>
      <div class="ex-scenario">
        Un volume FAT avec : <span style="font-family:var(--mono)">BPS = ${bps} · SPC = ${spc} · Cluster = <strong>${cs} o</strong></span><br>
        Un fichier occupe exactement <strong>${nClusters} clusters</strong>.<br><br>
        <strong>Quelle est la taille logique maximale pour que le file slack soit nul ?</strong>
      </div>
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.6rem 1rem;margin-bottom:.8rem;font-size:.76rem">
        <div style="color:var(--dim);margin-bottom:.3rem">Condition de slack nul :</div>
        <div style="font-family:var(--mono)">taille_fichier mod taille_cluster = 0</div>
        <div style="color:var(--dim);margin-top:.2rem;font-size:.72rem">→ le fichier remplit exactement ses clusters, sans octet résiduel.</div>
      </div>
      <div class="sec-title">Taille logique (octets)</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="ss-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:100px;font-family:var(--mono)"
            data-correct="${c === answer}">${c.toLocaleString('fr-CH')} o</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="ss-h1">💡 Niveau 1 — Concept</button>
        <button class="btn-hint" id="ss-h2" disabled style="opacity:.45">💡 Niveau 2 — Calcul</button>
        <button class="btn-hint" id="ss-h3" disabled style="opacity:.45">💡 Niveau 3 — Résultat</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-ss" style="display:none"></div>
      <button class="btn-next" id="btn-next-ss" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#ss-h1').addEventListener('click', () => showSSHint(div, 1, hints[0]));
    div.querySelector('#ss-h2').addEventListener('click', () => showSSHint(div, 2, hints[1]));
    div.querySelector('#ss-h3').addEventListener('click', () => showSSHint(div, 3, hints[2]));

    div.querySelectorAll('#ss-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#ss-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('slackspace');
        const fb = div.querySelector('#ex-feedback-ss');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `${nClusters} clusters × ${cs} o = <strong>${answer.toLocaleString('fr-CH')} o</strong> → slack = 0.<br>
          <span style="font-size:.75rem;color:var(--dim)">À ${answer + 1} o, un ${nClusters + 1}ème cluster serait alloué → file slack = ${cs - 1} o.</span>`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain, `Taille max sans slack = N × CS = ${nClusters} × ${cs} = ${answer} o.`);
        div.querySelector('#btn-next-ss').style.display = 'inline-block';
        div.querySelector('#ex-num-ss').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 3 : cas inverse — slack donné → taille du fichier ─
  // On donne le nombre de clusters, la taille cluster, et le file slack → retrouver la taille logique
  {
    const nClusters   = rand(2, 7);
    const fileSlack   = rand(1, cs - 1);       // slack ≠ 0, < cs
    const residual    = cs - fileSlack;        // octets utiles dans le dernier cluster
    const fileSize    = (nClusters - 1) * cs + residual;
    const totalAlloc  = nClusters * cs;

    const distractors = [
      totalAlloc,            // confusion avec espace alloué
      fileSize + fileSlack,  // = totalAlloc, même confusion
      (nClusters - 1) * cs, // oubli du dernier cluster partiel
      fileSize + bps,        // erreur d'un secteur
    ].filter(v => v !== fileSize && v > 0).slice(0, 3);
    const choices = [fileSize, ...distractors].sort(() => Math.random() - .5);

    const hints = [
      `On te donne le <strong>file slack</strong> et le nombre de clusters. La taille logique du fichier est :<br>
       <code>taille = (N_clusters − 1) × taille_cluster + (taille_cluster − file_slack)</code><br>
       Autrement dit : tous les clusters sont pleins sauf le dernier, qui contient <code>CS − slack</code> octets utiles.`,

      `${nClusters} clusters × ${cs} o = ${totalAlloc} o alloués au total.<br>
       File slack = ${fileSlack} o → le dernier cluster contient ${cs} − ${fileSlack} = <strong>${residual} o</strong> de données réelles.<br>
       Taille fichier = ${totalAlloc} − <strong>${fileSlack}</strong> = <strong>? o</strong>`,

      `Taille fichier = ${totalAlloc} − ${fileSlack} = <strong>${fileSize.toLocaleString('fr-CH')} o</strong>.<br>
       Vérification : ${fileSize} mod ${cs} = ${residual} → file slack = ${cs} − ${residual} = ${fileSlack} ✓`,
    ];

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-ss">🪣</div>
        <div class="ex-title">Slack Space — Retrouver la taille du fichier</div>
        <span class="ex-badge hard">Inverse · Slack → Taille logique</span>
      </div>
      <div class="ex-scenario">
        Lors de l'analyse d'un fichier supprimé, tu connais :<br>
        <ul style="margin:.4rem 0 .4rem 1.2rem;font-size:.82rem;line-height:1.8">
          <li>Clusters alloués : <strong>${nClusters}</strong></li>
          <li>Taille cluster : <strong>${cs} o</strong> (BPS=${bps}, SPC=${spc})</li>
          <li>File slack mesuré : <strong>${fileSlack} o</strong></li>
        </ul>
        <strong>Quelle était la taille logique du fichier ?</strong>
      </div>
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.6rem 1rem;margin-bottom:.8rem;font-family:var(--mono);font-size:.76rem">
        <div>Espace alloué total = ${nClusters} × ${cs} = <strong>${totalAlloc.toLocaleString('fr-CH')} o</strong></div>
        <div>File slack mesuré  = <strong>${fileSlack} o</strong></div>
        <div style="margin-top:.3rem;color:var(--dim);font-size:.72rem">Rappel : file_slack = taille_cluster − (taille_fichier mod taille_cluster)</div>
      </div>
      <div class="sec-title">Taille logique du fichier (octets)</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="ss-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:110px;font-family:var(--mono)"
            data-correct="${c === fileSize}">${c.toLocaleString('fr-CH')} o</button>`).join('')}
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">
        <button class="btn-hint" id="ss-h1">💡 Niveau 1 — Formule inverse</button>
        <button class="btn-hint" id="ss-h2" disabled style="opacity:.45">💡 Niveau 2 — Calcul intermédiaire</button>
        <button class="btn-hint" id="ss-h3" disabled style="opacity:.45">💡 Niveau 3 — Résultat + vérif</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-ss" style="display:none"></div>
      <button class="btn-next" id="btn-next-ss" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;

    div.querySelector('#ss-h1').addEventListener('click', () => showSSHint(div, 1, hints[0]));
    div.querySelector('#ss-h2').addEventListener('click', () => showSSHint(div, 2, hints[1]));
    div.querySelector('#ss-h3').addEventListener('click', () => showSSHint(div, 3, hints[2]));

    div.querySelectorAll('#ss-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        div.querySelectorAll('#ss-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('slackspace');
        const fb = div.querySelector('#ex-feedback-ss');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `Taille = espace alloué − slack = ${totalAlloc} − ${fileSlack} = <strong>${fileSize.toLocaleString('fr-CH')} o</strong>.<br>
          <span style="font-size:.75rem;color:var(--dim)">Vérif : ${fileSize} mod ${cs} = ${residual} → slack = ${cs} − ${residual} = ${fileSlack} ✓</span>`;
        fb.innerHTML = isOk ? `✅ Correct ! ${explain}`
          : formatChoiceFeedback(false, explain,
              `Taille logique = total_alloué − file_slack = ${totalAlloc} − ${fileSlack} = ${fileSize} o.`);
        div.querySelector('#btn-next-ss').style.display = 'inline-block';
        div.querySelector('#ex-num-ss').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
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


// ═══════════════════════════════════════════════════════════════
// 22. DIRECTORY ENTRY FAT — LECTURE COMPLÈTE (32 OCTETS)
// ═══════════════════════════════════════════════════════════════
//
// Sous-types :
//   0 — Lire le nom SFN (8.3) et détecter l'état (actif / effacé / fin)
//   1 — Lire les attributs (archive, répertoire, lecture seule, hidden, system)
//   2 — Lire le premier cluster et la taille du fichier
//   3 — Déduire la date/heure de modification depuis les champs bruts
//
function genDirEntry() {
  const subtype = rand(0, 3);

  // ── Attribut flags ──────────────────────────────────────────
  const ATTR = {
    READ_ONLY: 0x01,
    HIDDEN:    0x02,
    SYSTEM:    0x04,
    VOLUME_ID: 0x08,
    DIRECTORY: 0x10,
    ARCHIVE:   0x20,
    LFN:       0x0F, // combinaison spéciale LFN
  };

  // ── LE helpers ──────────────────────────────────────────────
  const le16 = v => [v & 0xFF, (v>>8) & 0xFF];
  const le32 = v => [v&0xFF,(v>>8)&0xFF,(v>>16)&0xFF,(v>>24)&0xFF];

  // ── Constructeur d'une directory entry de 32 octets ─────────
  // name8  : 8 chars (espaces = padding)
  // ext3   : 3 chars (espaces = padding)
  // attr   : byte d'attribut
  // cluster: numéro de premier cluster (uint16, gardé petit)
  // size   : taille en octets (uint32, gardée petite)
  // year/month/day, hour/min/sec : date/heure de modification
  function buildEntry({ name8, ext3, attr, cluster, size, year, month, day, hour, min, sec, status }) {
    const b = new Array(32).fill(0);
    // Nom 8.3
    const fullName = (name8 + '        ').slice(0,8);
    const fullExt  = (ext3  + '   ').slice(0,3);
    fullName.split('').forEach((c,i) => b[i]   = c.charCodeAt(0));
    fullExt.split('').forEach( (c,i) => b[8+i] = c.charCodeAt(0));
    // Status du premier octet
    if (status === 'deleted') b[0] = 0xE5;
    else if (status === 'end') b[0] = 0x00;
    // Attributs
    b[11] = attr;
    // Réservé (0x0C) — on y met NTRes = 0x00
    b[12] = 0x00;
    // CrtTimeTenth @ 0x0D (ignoré ici)
    b[13] = 0x00;
    // Heure de modification @ 0x16 (2 octets LE)
    // Time : bits 15-11=h, 10-5=m, 4-0=s/2
    const timeWord = (hour<<11)|(min<<5)|Math.floor(sec/2);
    le16(timeWord).forEach((x,i) => b[0x16+i] = x);
    // Date de modification @ 0x18 (2 octets LE)
    // Date : bits 15-9=year-1980, 8-5=month, 4-0=day
    const dateWord = ((year-1980)<<9)|(month<<5)|day;
    le16(dateWord).forEach((x,i) => b[0x18+i] = x);
    // First cluster (high word @ 0x14, low word @ 0x1A)
    le16(cluster & 0xFFFF).forEach((x,i) => b[0x1A+i] = x);
    le16((cluster>>16)&0xFFFF).forEach((x,i) => b[0x14+i] = x);
    // File size @ 0x1C
    le32(size).forEach((x,i) => b[0x1C+i] = x);
    return b;
  }

  // ── Palette de noms de fichiers plausibles ───────────────────
  const FILE_SCENARIOS = [
    { name8:'RAPPORT ', ext3:'DOC', attr: ATTR.ARCHIVE,                  desc:'rapport.doc (fichier archive Word)' },
    { name8:'CONFIG  ', ext3:'INI', attr: ATTR.ARCHIVE|ATTR.HIDDEN,       desc:'config.ini (archive + caché)' },
    { name8:'SYSTEM  ', ext3:'   ', attr: ATTR.DIRECTORY,                 desc:'SYSTEM (répertoire)' },
    { name8:'BOOT    ', ext3:'INI', attr: ATTR.ARCHIVE|ATTR.SYSTEM|ATTR.READ_ONLY, desc:'boot.ini (archive + système + read-only)' },
    { name8:'IMAGE   ', ext3:'JPG', attr: ATTR.ARCHIVE,                   desc:'IMAGE.JPG (fichier archive)' },
    { name8:'MALWARE ', ext3:'EXE', attr: ATTR.ARCHIVE|ATTR.HIDDEN|ATTR.SYSTEM, desc:'MALWARE.EXE (caché + système — suspect)' },
    { name8:'LOG     ', ext3:'TXT', attr: ATTR.ARCHIVE|ATTR.READ_ONLY,    desc:'LOG.TXT (lecture seule)' },
    { name8:'BACKUP  ', ext3:'ZIP', attr: ATTR.ARCHIVE,                   desc:'BACKUP.ZIP' },
  ];

  const scen     = FILE_SCENARIOS[rand(0, FILE_SCENARIOS.length-1)];
  const cluster  = rand(2, 255);                 // petit pour calcul mental
  const sizeMult = rand(1, 64);
  const size     = sizeMult * 512;               // toujours multiple de 512 → lisible
  const year     = rand(2018, 2024);
  const month    = rand(1, 12);
  const day      = rand(1, 28);
  const hour     = rand(0, 23);
  const min      = rand(0, 59);
  const sec      = rand(0, 29) * 2;             // précision 2 secondes FAT

  // ── Sous-type 0 : lire le nom SFN et l'état ─────────────────
  if (subtype === 0) {
    // 3 cas : actif, effacé (0xE5), fin de répertoire (0x00)
    const entryState = ['active','deleted','end'][rand(0,2)];
    const entry = buildEntry({ ...scen, cluster, size, year, month, day, hour, min, sec, status: entryState });

    const stateLabels = {
      active:  { label: 'Fichier actif',                    explain: `Le premier octet (0x${entry[0].toString(16).toUpperCase().padStart(2,'0')}) est un caractère ASCII valide — entrée active. Le nom complet est "${scen.name8.trim()}.${scen.ext3.trim()}".` },
      deleted: { label: 'Fichier supprimé (0xE5)',          explain: `0xE5 = entrée supprimée en FAT. Le système a écrit 0xE5 à la place du premier caractère du nom. Les données sont potentiellement récupérables si le cluster n'a pas été réalloué.` },
      end:     { label: 'Fin de répertoire (0x00)',         explain: `0x00 = marqueur de fin de répertoire. Toutes les entrées suivantes sont libres ou inexistantes. La lecture du répertoire s'arrête ici.` },
    };

    const choices = [
      { val: 'active',  text: 'Fichier actif',             explain: stateLabels.active.explain  },
      { val: 'deleted', text: 'Fichier supprimé (0xE5)',   explain: stateLabels.deleted.explain },
      { val: 'end',     text: 'Fin de répertoire (0x00)',  explain: stateLabels.end.explain     },
    ].sort(() => Math.random()-.5);

    const correctState = stateLabels[entryState];

    const dumpHTML = renderHexDump(
      [{ offset: '00000000', bytes: entry }],
      [
        { from:0, to:0, color:'--purple', label:'Premier octet (status)' },
        { from:1, to:7, color:'--cyan',   label:'Nom (7 octets restants)' },
        { from:8,to:10, color:'--gold',   label:'Extension' },
      ],
      { cols: 16, title: 'Directory Entry FAT (32 octets)' }
    );

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-de">📁</div>
        <div class="ex-title">Directory Entry — État et nom SFN</div>
        <span class="ex-badge medium">FAT · 8.3 · Status byte</span>
      </div>
      <div class="ex-scenario">
        Tu analyses une entrée de répertoire FAT (32 octets).<br>
        <strong>Quel est l'état de cette entrée ?</strong> Identifie le premier octet.
      </div>
      ${dumpHTML}
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.6rem 1rem;margin-bottom:.75rem;font-size:.76rem;font-family:var(--mono)">
        <div style="color:var(--dim);margin-bottom:.3rem">Décodage du premier octet :</div>
        <div>• <strong style="color:var(--green)">0x00</strong> = fin de répertoire (toutes les entrées suivantes sont libres)</div>
        <div>• <strong style="color:var(--red)">0xE5</strong> = fichier supprimé (données potentiellement récupérables)</div>
        <div>• <strong style="color:var(--cyan)">autre</strong> = premier caractère du nom en ASCII (entrée active)</div>
      </div>
      <div class="sec-title">État de l'entrée</div>
      <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="de-choices">
        ${choices.map(c => `
          <button class="tp-choice" data-correct="${c.val === entryState}"
              data-explain="${encData(c.explain)}" style="text-align:left">
            <span class="tp-choice-letter">${c.val === 'active'?'A':c.val==='deleted'?'B':'C'}</span>
            ${c.text}
          </button>`).join('')}
      </div>
      <div class="ex-feedback" id="ex-feedback-de" style="display:none"></div>
      <button class="btn-next" id="btn-next-de" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    div.querySelectorAll('#de-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        document.querySelectorAll('#de-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('direntry');
        const note = decData(b.dataset.explain) || '';
        const fb = div.querySelector('#ex-feedback-de');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        fb.innerHTML = formatChoiceFeedback(isOk, correctState.explain,
          `${note} — Bonne réponse : <strong>${correctState.label}</strong>.`);
        div.querySelector('#btn-next-de').style.display = 'inline-block';
        div.querySelector('#ex-num-de').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 1 : lire les attributs ─────────────────────────
  if (subtype === 1) {
    const entry = buildEntry({ ...scen, cluster, size, year, month, day, hour, min, sec, status: 'active' });
    const attr  = scen.attr;

    const ATTR_FLAGS = [
      { bit:0x01, name:'Read-Only',  abbr:'R', desc:'Fichier en lecture seule — modification bloquée par l\'OS.' },
      { bit:0x02, name:'Hidden',     abbr:'H', desc:'Fichier caché — ne s\'affiche pas par défaut dans l\'explorateur.' },
      { bit:0x04, name:'System',     abbr:'S', desc:'Fichier système — utilisé par l\'OS.' },
      { bit:0x08, name:'Volume ID',  abbr:'V', desc:'Label de volume — un seul dans un répertoire.' },
      { bit:0x10, name:'Directory',  abbr:'D', desc:'Répertoire — l\'entrée pointe vers un sous-répertoire.' },
      { bit:0x20, name:'Archive',    abbr:'A', desc:'Archive — bit mis à 1 dès qu\'un fichier est créé ou modifié. Utile pour les backups.' },
    ];

    const activeFlags = ATTR_FLAGS.filter(f => (attr & f.bit) !== 0);
    const correctNames = activeFlags.map(f => f.name).sort().join(', ');

    const dumpHTML = renderHexDump(
      [{ offset: '00000000', bytes: entry }],
      [
        { from:0, to:10, color:'--dim',    label:'Nom 8.3' },
        { from:11,to:11, color:'--purple', label:'Attributs (1 octet)' },
      ],
      { cols: 16, title: 'Directory Entry FAT (32 octets)' }
    );

    // QCM : quels attributs sont positionnés ?
    // On génère 3 alternatives fausses en combinant autrement les bits
    function randomAttrCombo(exclude) {
      let combo;
      do {
        const bits = ATTR_FLAGS.filter(f => f.bit !== 0x08 && f.bit !== 0x10 && f.bit !== 0x0F);
        const chosen = bits.filter(() => Math.random() > .5);
        combo = chosen.reduce((a,f) => a|f.bit, 0);
      } while (combo === exclude || combo === 0);
      return combo;
    }
    const distAttrs = [randomAttrCombo(attr), randomAttrCombo(attr), randomAttrCombo(attr)];
    const allCombos = [attr, ...distAttrs].sort(() => Math.random()-.5);

    function attrToString(a) {
      return ATTR_FLAGS.filter(f => (a & f.bit) !== 0).map(f => f.name).join(' + ') || '(aucun)';
    }

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-de">📁</div>
        <div class="ex-title">Directory Entry — Attributs</div>
        <span class="ex-badge medium">FAT · Attribute byte · offset 0x0B</span>
      </div>
      <div class="ex-scenario">
        Tu analyses l'octet d'attributs (offset <strong>0x0B</strong>) d'une directory entry FAT.<br>
        <strong>Quels attributs sont positionnés sur ce fichier ?</strong>
      </div>
      ${dumpHTML}
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.6rem 1rem;margin-bottom:.75rem;font-size:.76rem">
        <div style="font-family:var(--mono);color:var(--dim);margin-bottom:.4rem">Octet @ 0x0B = <strong style="color:var(--purple)">0x${attr.toString(16).toUpperCase().padStart(2,'0')}</strong> = ${pad(attr.toString(2),8)}<sub>2</sub></div>
        <div style="display:flex;gap:1rem;flex-wrap:wrap">
          ${ATTR_FLAGS.map(f => {
            const on = (attr & f.bit) !== 0;
            return `<span style="font-family:var(--mono);font-size:.72rem;color:${on?'var(--cyan)':'var(--dim)'};font-weight:${on?700:400}">
              bit ${f.bit.toString(16).toUpperCase()}=${on?'1':'0'} <span style="color:${on?'var(--text)':'var(--dim)'}">${f.abbr}</span>
            </span>`;
          }).join('')}
        </div>
      </div>
      <div class="sec-title">Attributs actifs</div>
      <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="de-choices">
        ${allCombos.map((combo,i) => `
          <button class="tp-choice" data-correct="${combo === attr}" style="text-align:left;font-family:var(--mono);font-size:.78rem">
            <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
            ${attrToString(combo)}
          </button>`).join('')}
      </div>
      <div class="ex-feedback" id="ex-feedback-de" style="display:none"></div>
      <button class="btn-next" id="btn-next-de" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    div.querySelectorAll('#de-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        document.querySelectorAll('#de-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('direntry');
        const fb = div.querySelector('#ex-feedback-de');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        const explain = `0x${attr.toString(16).toUpperCase().padStart(2,'0')} = ${pad(attr.toString(2),8)}₂. Attributs actifs : <strong>${correctNames || '(aucun)'}</strong>.<br>
          ${activeFlags.map(f=>`<span style="margin-right:.6rem;color:var(--cyan)">${f.name} (bit 0x${f.bit.toString(16).toUpperCase()}) : ${f.desc}</span>`).join('<br>')}`;
        fb.innerHTML = formatChoiceFeedback(isOk, explain,
          `Calcul incorrect. ${explain}`);
        div.querySelector('#btn-next-de').style.display = 'inline-block';
        div.querySelector('#ex-num-de').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 2 : premier cluster + taille ───────────────────
  if (subtype === 2) {
    const entry = buildEntry({ ...scen, cluster, size, year, month, day, hour, min, sec, status: 'active' });

    // On demande soit le cluster, soit la taille
    const askCluster = Math.random() < 0.5;
    const answer = askCluster ? cluster : size;

    const dumpHTML = renderHexDump(
      [{ offset: '00000000', bytes: entry }],
      [
        { from:0x1A, to:0x1B, color: askCluster?'--cyan':'--dim', label:'First Cluster Low (LE16)' },
        { from:0x1C, to:0x1F, color: askCluster?'--dim':'--gold', label:'File Size (LE32)' },
      ],
      { cols: 16, title: 'Directory Entry FAT (32 octets)' }
    );

    const makeDist = (base, step) =>
      [base+step, base-step, base*2, base+1]
        .filter(v => v !== base && v > 0).slice(0,3);

    const distractors = askCluster ? makeDist(cluster, 1) : makeDist(size, 512);
    const choices = [answer, ...distractors].sort(() => Math.random()-.5);

    const explain = askCluster
      ? `First Cluster Low @ 0x1A : ${entry.slice(0x1A,0x1C).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} en LE = cluster <strong>${cluster}</strong>. C'est le point d'entrée dans la table FAT.`
      : `File Size @ 0x1C : ${entry.slice(0x1C,0x20).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')} en LE = <strong>${size.toLocaleString('fr-CH')} octets</strong>.`;

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-de">📁</div>
        <div class="ex-title">Directory Entry — ${askCluster ? 'Premier cluster' : 'Taille du fichier'}</div>
        <span class="ex-badge medium">FAT · LE${askCluster?'16':'32'} · offset ${askCluster?'0x1A':'0x1C'}</span>
      </div>
      <div class="ex-scenario">
        Tu analyses une directory entry FAT (${scen.desc}).<br>
        <strong>${askCluster ? 'Quel est le numéro du premier cluster de ce fichier ?' : 'Quelle est la taille du fichier en octets ?'}</strong>
      </div>
      ${dumpHTML}
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.6rem 1rem;margin-bottom:.75rem;font-size:.76rem;font-family:var(--mono)">
        ${askCluster
          ? `<span style="color:var(--dim)">First Cluster Low @ </span><strong style="color:var(--cyan)">0x1A</strong><span style="color:var(--dim)"> — 2 octets Little Endian (pour FAT32, combiner avec First Cluster High @ 0x14)</span>`
          : `<span style="color:var(--dim)">File Size @ </span><strong style="color:var(--gold)">0x1C</strong><span style="color:var(--dim)"> — 4 octets Little Endian · 0 pour les répertoires</span>`}
      </div>
      <div class="sec-title">Réponse</div>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="de-choices">
        ${choices.map(c => `<button class="tp-choice" style="flex:1;min-width:100px;font-family:var(--mono)"
            data-correct="${c === answer}">
            ${c.toLocaleString('fr-CH')}${!askCluster?' o':''}
          </button>`).join('')}
      </div>
      <div style="display:flex;gap:.5rem;margin:.3rem 0">
        <button class="btn-hint" id="btn-de-hint">💡 Indice</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-de" style="display:none"></div>
      <button class="btn-next" id="btn-next-de" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    const hintBytes = askCluster
      ? entry.slice(0x1A,0x1C).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')
      : entry.slice(0x1C,0x20).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ');
    div.querySelector('#btn-de-hint').addEventListener('click', () => {
      markHintUsed();
      const fb = div.querySelector('#ex-feedback-de');
      fb.style.display = 'block'; fb.className = 'ex-feedback correct';
      fb.innerHTML = `💡 Octets à l'offset ${askCluster?'0x1A':'0x1C'} : <code style="color:var(--cyan)">${hintBytes}</code> — inverse (LE) et convertis en décimal.`;
    });
    div.querySelectorAll('#de-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        document.querySelectorAll('#de-choices .tp-choice').forEach(x => {
          x.disabled = true;
          if (x.dataset.correct === 'true') x.classList.add('correct');
          else if (x !== b) x.classList.add('dim');
        });
        if (!isOk) { b.classList.add('wrong'); breakStreak(); }
        else if (!STATE.hintUsed) incSolved('direntry');
        const fb = div.querySelector('#ex-feedback-de');
        fb.style.display = 'block';
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        fb.innerHTML = formatChoiceFeedback(isOk, explain, `Mauvaise lecture. ${explain}`);
        div.querySelector('#btn-next-de').style.display = 'inline-block';
        div.querySelector('#ex-num-de').className = 'ex-num ' + (isOk ? 'solved' : 'error');
        div.className = 'ex-card ' + (isOk ? 'solved' : 'error');
      });
    });
    return div;
  }

  // ── Sous-type 3 : déduire date/heure de modification ─────────
  {
    const entry = buildEntry({ ...scen, cluster, size, year, month, day, hour, min, sec, status: 'active' });
    const timeWord = (hour<<11)|(min<<5)|Math.floor(sec/2);
    const dateWord = ((year-1980)<<9)|(month<<5)|day;
    const timeLo = entry[0x16]; const timeHi = entry[0x17];
    const dateLo = entry[0x18]; const dateHi = entry[0x19];

    const dumpHTML = renderHexDump(
      [{ offset: '00000000', bytes: entry }],
      [
        { from:0x16, to:0x17, color:'--cyan',   label:'Write Time (LE16)' },
        { from:0x18, to:0x19, color:'--gold',   label:'Write Date (LE16)' },
      ],
      { cols: 16, title: 'Directory Entry FAT (32 octets)' }
    );

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-de">📁</div>
        <div class="ex-title">Directory Entry — Date et heure de modification</div>
        <span class="ex-badge hard">FAT timestamps · bits</span>
      </div>
      <div class="ex-scenario">
        Tu analyses les champs de date/heure d'une directory entry FAT.<br>
        Offsets <strong>0x16–0x17</strong> (heure) et <strong>0x18–0x19</strong> (date), encodés en Little Endian.<br>
        <strong>Reconstituez la date et l'heure de dernière modification.</strong>
      </div>
      ${dumpHTML}
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.65rem 1rem;margin-bottom:.75rem;font-family:var(--mono);font-size:.75rem">
        <div style="color:var(--dim);margin-bottom:.35rem">Structure des champs (après inversion LE) :</div>
        <div style="margin-bottom:.25rem">
          <span style="color:var(--cyan)">Time</span> = 0x${pad(timeWord.toString(16).toUpperCase(),4)} →
          <span style="color:var(--purple)">bits 15-11</span> = heures ·
          <span style="color:var(--green)">bits 10-5</span> = minutes ·
          <span style="color:var(--gold)">bits 4-0 × 2</span> = secondes
        </div>
        <div>
          <span style="color:var(--gold)">Date</span> = 0x${pad(dateWord.toString(16).toUpperCase(),4)} →
          <span style="color:var(--purple)">bits 15-9 + 1980</span> = année ·
          <span style="color:var(--green)">bits 8-5</span> = mois ·
          <span style="color:var(--gold)">bits 4-0</span> = jour
        </div>
      </div>
      <div class="ex-input-row" style="flex-wrap:wrap;gap:.5rem">
        <input class="ex-input" id="ans-y"  type="number" placeholder="Année" style="max-width:90px" min="1980" max="2107">
        <span class="ex-input-label">-</span>
        <input class="ex-input" id="ans-mo" type="number" placeholder="Mois"  style="max-width:75px" min="1" max="12">
        <span class="ex-input-label">-</span>
        <input class="ex-input" id="ans-d"  type="number" placeholder="Jour"  style="max-width:75px" min="1" max="31">
        <span class="ex-input-label" style="margin:0 4px">à</span>
        <input class="ex-input" id="ans-h"  type="number" placeholder="HH"   style="max-width:70px" min="0" max="23">
        <span class="ex-input-label">:</span>
        <input class="ex-input" id="ans-mi" type="number" placeholder="MM"   style="max-width:70px" min="0" max="59">
        <span class="ex-input-label">:</span>
        <input class="ex-input" id="ans-s"  type="number" placeholder="SS"   style="max-width:70px" min="0" max="58">
      </div>
      <div class="ex-input-row" style="margin-top:.5rem">
        <button class="btn-hint" id="btn-de-hint">💡 Décomposition</button>
        <button class="btn-validate" id="btn-de-val">Valider ✓</button>
        <button class="btn-next" id="btn-next-de" onclick="newExercise()" style="display:none">Exercice suivant →</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-de" style="display:none"></div>
    `;
    div.querySelector('#btn-de-hint').addEventListener('click', () => {
      markHintUsed();
      const fb = div.querySelector('#ex-feedback-de');
      fb.style.display = 'block'; fb.className = 'ex-feedback correct';
      fb.innerHTML = `💡 Time = 0x${pad(timeWord.toString(16).toUpperCase(),4)} → h=${hour}, m=${min}, s=${sec}<br>
        Date = 0x${pad(dateWord.toString(16).toUpperCase(),4)} → année=${year}, mois=${month}, jour=${day}`;
    });
    div.querySelector('#btn-de-val').addEventListener('click', () => {
      const getV = id => parseInt(div.querySelector('#'+id).value);
      const vy=getV('ans-y'), vmo=getV('ans-mo'), vd=getV('ans-d');
      const vh=getV('ans-h'), vmi=getV('ans-mi'), vs=getV('ans-s');
      if ([vy,vmo,vd,vh,vmi,vs].some(isNaN)) return;
      const isOk = vy===year && vmo===month && vd===day && vh===hour && vmi===min && Math.abs(vs-sec)<=2;
      const fb = div.querySelector('#ex-feedback-de');
      fb.style.display = 'block';
      fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
      if (isOk) {
        if (!STATE.hintUsed) incSolved('direntry');
        fb.innerHTML = `✅ Correct ! ${year}-${pad(month,2)}-${pad(day,2)} à ${pad(hour,2)}:${pad(min,2)}:${pad(sec,2)}`;
        div.className = 'ex-card solved';
        div.querySelector('#ex-num-de').className = 'ex-num solved';
      } else {
        breakStreak();
        fb.innerHTML = `❌ Attendu : <strong>${year}-${pad(month,2)}-${pad(day,2)} ${pad(hour,2)}:${pad(min,2)}:${pad(sec,2)}</strong> — utilise 💡 pour la décomposition.`;
      }
      div.querySelector('#btn-next-de').style.display = 'inline-block';
    });
    return div;
  }
}

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

  // Helper showHint factorisable mais on garde local pour éviter conflit
  function showRegHint(div, level, html) {
    markHintUsed();
    const fb = div.querySelector('#ex-feedback-reg');
    fb.style.display = 'block'; fb.className = 'ex-feedback correct';
    fb.innerHTML = `<div style="font-size:.7rem;color:var(--dim);margin-bottom:.25rem">Indice ${level}/3</div>${html}`;
    const next = div.querySelector(`#reg-h${level+1}`);
    if (next) { next.disabled = false; next.style.opacity = '1'; }
    div.querySelector(`#reg-h${level}`).style.opacity = '.35';
  }

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

    div.querySelector('#reg-h1').addEventListener('click', () => showRegHint(div, 1, hints[0]));
    div.querySelector('#reg-h2').addEventListener('click', () => showRegHint(div, 2, hints[1]));
    div.querySelector('#reg-h3').addEventListener('click', () => showRegHint(div, 3, hints[2]));

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

    div.querySelector('#reg-h1').addEventListener('click', () => showRegHint(div, 1, hints[0]));
    div.querySelector('#reg-h2').addEventListener('click', () => showRegHint(div, 2, hints[1]));
    div.querySelector('#reg-h3').addEventListener('click', () => showRegHint(div, 3, hints[2]));

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

    div.querySelector('#reg-h1').addEventListener('click', () => showRegHint(div, 1, hints[0]));
    div.querySelector('#reg-h2').addEventListener('click', () => showRegHint(div, 2, hints[1]));
    div.querySelector('#reg-h3').addEventListener('click', () => showRegHint(div, 3, hints[2]));

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

    div.querySelector('#reg-h1').addEventListener('click', () => showRegHint(div, 1, hints[0]));
    div.querySelector('#reg-h2').addEventListener('click', () => showRegHint(div, 2, hints[1]));
    div.querySelector('#reg-h3').addEventListener('click', () => showRegHint(div, 3, hints[2]));

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

  function showPFHint(div, level, html) {
    markHintUsed();
    const fb = div.querySelector('#ex-feedback-pf');
    fb.style.display = 'block'; fb.className = 'ex-feedback correct';
    fb.innerHTML = `<div style="font-size:.7rem;color:var(--dim);margin-bottom:.25rem">Indice ${level}/3</div>${html}`;
    const next = div.querySelector(`#pf-h${level+1}`);
    if (next) { next.disabled = false; next.style.opacity = '1'; }
    div.querySelector(`#pf-h${level}`).style.opacity = '.35';
  }

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

    div.querySelector('#pf-h1').addEventListener('click', () => showPFHint(div, 1, hints[0]));
    div.querySelector('#pf-h2').addEventListener('click', () => showPFHint(div, 2, hints[1]));
    div.querySelector('#pf-h3').addEventListener('click', () => showPFHint(div, 3, hints[2]));

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

    div.querySelector('#pf-h1').addEventListener('click', () => showPFHint(div, 1, hints[0]));
    div.querySelector('#pf-h2').addEventListener('click', () => showPFHint(div, 2, hints[1]));
    div.querySelector('#pf-h3').addEventListener('click', () => showPFHint(div, 3, hints[2]));

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

    div.querySelector('#pf-h1').addEventListener('click', () => showPFHint(div, 1, hints[0]));
    div.querySelector('#pf-h2').addEventListener('click', () => showPFHint(div, 2, hints[1]));
    div.querySelector('#pf-h3').addEventListener('click', () => showPFHint(div, 3, hints[2]));

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

    div.querySelector('#pf-h1').addEventListener('click', () => showPFHint(div, 1, hints[0]));
    div.querySelector('#pf-h2').addEventListener('click', () => showPFHint(div, 2, hints[1]));
    div.querySelector('#pf-h3').addEventListener('click', () => showPFHint(div, 3, hints[2]));

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

  function showLNKHint(div, level, html) {
    markHintUsed();
    const fb = div.querySelector('#ex-feedback-lnk');
    fb.style.display = 'block'; fb.className = 'ex-feedback correct';
    fb.innerHTML = `<div style="font-size:.7rem;color:var(--dim);margin-bottom:.25rem">Indice ${level}/3</div>${html}`;
    const next = div.querySelector(`#lnk-h${level+1}`);
    if (next) { next.disabled = false; next.style.opacity = '1'; }
    div.querySelector(`#lnk-h${level}`).style.opacity = '.35';
  }

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

    div.querySelector('#lnk-h1').addEventListener('click', () => showLNKHint(div, 1, hints[0]));
    div.querySelector('#lnk-h2').addEventListener('click', () => showLNKHint(div, 2, hints[1]));
    div.querySelector('#lnk-h3').addEventListener('click', () => showLNKHint(div, 3, hints[2]));

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

    div.querySelector('#lnk-h1').addEventListener('click', () => showLNKHint(div, 1, hints[0]));
    div.querySelector('#lnk-h2').addEventListener('click', () => showLNKHint(div, 2, hints[1]));
    div.querySelector('#lnk-h3').addEventListener('click', () => showLNKHint(div, 3, hints[2]));

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

    div.querySelector('#lnk-h1').addEventListener('click', () => showLNKHint(div, 1, hints[0]));
    div.querySelector('#lnk-h2').addEventListener('click', () => showLNKHint(div, 2, hints[1]));
    div.querySelector('#lnk-h3').addEventListener('click', () => showLNKHint(div, 3, hints[2]));

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

    div.querySelector('#lnk-h1').addEventListener('click', () => showLNKHint(div, 1, hints[0]));
    div.querySelector('#lnk-h2').addEventListener('click', () => showLNKHint(div, 2, hints[1]));
    div.querySelector('#lnk-h3').addEventListener('click', () => showLNKHint(div, 3, hints[2]));

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
