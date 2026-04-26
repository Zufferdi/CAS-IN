// ═══════════════════════════════════════════════════════════════════
// tp-engine.js — CAS-IN Travaux Pratiques
// Logique : STATE, générateurs, vérificateurs, UI
// Dépend de tp-data.js (chargé avant)
// ═══════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════
// ÉTAT GLOBAL
// ═══════════════════════════════════════════════════
// Lecture sécurisée localStorage (Safari Private Browsing safe)
function _lsGet(key, fallback) {
  try { return localStorage.getItem(key); } catch(_) { return null; }
}
function _lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch(_) {}
}
function _lsDel(key) {
  try { localStorage.removeItem(key); } catch(_) {}
}

const STATE = {
  cat: 'endian',
  solved: (function(){ try { return JSON.parse(_lsGet('tp_solved') || '{}'); } catch(_){ return {}; } })(),
  total: {
    endian:0, timestamp:0, bitmap:0, fat:0, magic:0, mismatch:0,
    runlist:0, effacement:0, timestomping:0, hextable:0, fsidentify:0,
    offset:0, bases:0, hash:0, email:0, network:0, ir:0,
    droitpenal:0, glossaire:0, examen:0
  },
  hintUsed: false,
  streak:     parseInt(_lsGet('tp_streak')     || '0', 10),
  bestStreak: parseInt(_lsGet('tp_bestStreak') || '0', 10),
  droitIdx:   parseInt(_lsGet('tp_droitIdx')   || '0', 10),
  glossIdx:   parseInt(_lsGet('tp_glossIdx')   || '0', 10),
};

function saveState() {
  _lsSet('tp_solved', JSON.stringify(STATE.solved));
  _lsSet('tp_streak', String(STATE.streak));
  _lsSet('tp_bestStreak', String(STATE.bestStreak));
  _lsSet('tp_droitIdx', String(STATE.droitIdx));
  _lsSet('tp_glossIdx', String(STATE.glossIdx));
}
function getSolved(cat) { return STATE.solved[cat] || 0; }
function getTotalSolved() { return Object.values(STATE.solved).reduce((a,b)=>a+(b||0),0); }


// ── Chrono Mode ───────────────────────────────────────────────
let _chronoTimer = null, _chronoSec = 0, _chronoActive = false;

function startChrono(seconds, onExpire) {
  stopChrono();
  _chronoSec = seconds;
  _chronoActive = true;
  updateChronoDisplay(_chronoSec);
  _chronoTimer = setInterval(() => {
    _chronoSec--;
    updateChronoDisplay(_chronoSec);
    if (_chronoSec <= 0) {
      stopChrono();
      onExpire();
    }
  }, 1000);
}

function stopChrono() {
  if (_chronoTimer) { clearInterval(_chronoTimer); _chronoTimer = null; }
  _chronoActive = false;
}

function updateChronoDisplay(sec) {
  const el = document.getElementById('chrono-display');
  if (!el) return;
  el.textContent = sec + 's';
  el.style.color = sec <= 5 ? 'var(--red)' : sec <= 10 ? 'var(--gold)' : 'var(--cyan)';
  el.style.fontWeight = sec <= 5 ? '800' : '600';
}

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
function dec2hex(n, bytes=1) { return n.toString(16).toUpperCase().padStart(bytes*2,'0').match(/.{2}/g).join(' '); }
function hex2bytes(hexStr) { return hexStr.trim().split(/\s+/).map(h => parseInt(h,16)); }
function bytesToBits(bytes) { return bytes.map(b => pad(b.toString(2),8)).join(' '); }

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

function renderHexBytes(bytes, classes=[]) {
  return bytes.map((b,i) => {
    const cls = classes[i] || '';
    return `<span class="hex-byte ${cls}">${pad(b.toString(16).toUpperCase(),2)}</span>`;
  }).join('');
}

function renderBits(byte, groups=[8]) {
  const bits = pad(byte.toString(2),8).split('');
  return bits.map((b,i) => `<span class="bit bit-${b}">${b}</span>`).join('');
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
    const choices = shuffle([...new Set([val, wrongVal1, wrongVal2, wrongVal3])].slice(0,4));

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
        ${choices.map(c=>`<button type="button" class="tp-choice" style="flex:1;min-width:100px" data-correct="${c===val}"
          onclick="checkEndianChoice(this,${c===val},${val},${JSON.stringify(displayBytes)},${JSON.stringify(revBytes)})">
          ${c.toLocaleString('fr-CH')}</button>`).join('')}
      </div>
      <div class="ex-feedback" id="ex-feedback"></div>
      <button type="button" class="btn-next" id="btn-next" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
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
    const decodedVal = val; // Les deux donnent la même valeur si les octets correspondent

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
          return `<button type="button" class="tp-choice" style="flex:1;min-width:140px" data-correct="${isCorrect}"
            onclick="checkEndianChoice(this,${isCorrect},0,${JSON.stringify(displayBytes)},${JSON.stringify(isLE?leBytes:beBytes)})">
            ${c}</button>`;
        }).join('')}
      </div>
      <div class="ex-feedback" id="ex-feedback"></div>
      <button type="button" class="btn-next" id="btn-next" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
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
        return `<button type="button" class="tp-choice" style="flex:1;min-width:130px;font-family:var(--mono)"
          data-correct="${isCorrect}"
          onclick="checkEndianChoice(this,${isCorrect},0,${JSON.stringify(correctBytes)},${JSON.stringify(isLE ? [...correctBytes].reverse() : correctBytes)})">
          ${hexStr(opt)}</button>`;
      }).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback"></div>
    <button type="button" class="btn-next" id="btn-next" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  return div;
}

function checkEndianChoice(btn, isCorrect, expectedVal, displayBytes, orderedBytes) {
  document.querySelectorAll('#endian-choices .tp-choice').forEach(b => { b.disabled = true; });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (isCorrect) { if (!STATE.hintUsed) incSolved(STATE.cat); }
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
  // Mode 0 = FAT timestamp (existant), Mode 1 = NTFS FILETIME
  const tsMode = rand(0, 3);
  if (tsMode === 1) {
    // NTFS FILETIME : intervalles de 100ns depuis 01/01/1601
    // Valeur type : ~133000000000000000 (env. 2023)
    const yr = rand(2015, 2024);
    // Approximation : epoch FILETIME pour le 01/01/yr
    const secsSince1601 = (yr - 1601) * 365.25 * 24 * 3600;
    const filetime = Math.floor(secsSince1601 * 1e7);
    const ft_lo = filetime % 0x100000000;
    const ft_hi = Math.floor(filetime / 0x100000000);
    const b = [ft_lo&0xFF, (ft_lo>>8)&0xFF, (ft_lo>>16)&0xFF, (ft_lo>>24)&0xFF,
               ft_hi&0xFF, (ft_hi>>8)&0xFF, (ft_hi>>16)&0xFF, (ft_hi>>24)&0xFF];
    const hexBytes = b.map(x=>pad(x.toString(16).toUpperCase(),2));
    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-ts-ntfs">🕐</div>
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
      </div>
      <div class="ex-input-row">
        <span class="ex-input-label">Année :</span>
        <input class="ex-input" id="ans-year" type="number" placeholder="${yr}" style="max-width:90px" min="1970" max="2100">
        <button type="button" class="btn-hint" onclick="document.getElementById('ex-feedback-ts').innerHTML='💡 FILETIME en décimal ≈ ${filetime.toExponential(2)}. Diviser par 10 000 000 = secondes depuis 1601. Diviser par 31 557 600 = années depuis 1601. Ajouter 1601.';document.getElementById('ex-feedback-ts').style.display='block'">💡 Méthode</button>
        <button type="button" class="btn-validate" onclick="(function(){
          const v=parseInt(document.getElementById('ans-year').value);
          const fb=document.getElementById('ex-feedback-ts');
          const ok=Math.abs(v-${yr})<=1;
          document.getElementById('ans-year').className='ex-input '+(ok?'correct':'wrong');
          const fb=document.getElementById('ex-feedback-ts');
          fb.className='ex-feedback '+(ok?'correct':'wrong');
          fb.innerHTML=ok?'✅ Correct ! Année ≈ ${yr} — FILETIME = ${filetime.toExponential(3)} intervalles de 100ns depuis 1601.':'❌ Réponse attendue : <strong>${yr}</strong> (±1 an accepté). FILETIME ≈ ${filetime.toExponential(3)} → ÷10⁷ = secondes → ÷31 557 600 = années → +1601.';
          fb.style.display='block';
          if(ok){incSolved(STATE.cat);}
          document.getElementById('btn-next-ts-ntfs').style.display='inline-block';
        })()">Valider ✓</button>
        <button type="button" class="btn-next" id="btn-next-ts-ntfs" onclick="newExercise()" style="display:none">Exercice suivant →</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-ts" style="display:none"></div>
    `;
    return div;
  }
  // Date FAT : bits 15-9 = année (offset 1980), 8-5 = mois, 4-0 = jour
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
      <button type="button" class="btn-hint" onclick="showTSHint(${year},${month},${day},${hours},${mins},${secs})">💡 Calculs</button>
      <button type="button" class="btn-validate" onclick="checkTimestamp(${year},${month},${day},${hours},${mins},${secs})">Valider ✓</button>
      <button type="button" class="btn-next" id="btn-next-ts" onclick="newExercise()">Exercice suivant →</button>
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


  // ── Mode 2 : Unix Epoch → Date ──────────────────────────────
  if (tsMode === 2) {
    const yr = rand(2015, 2024), mo = rand(1,12), dy = rand(1,28);
    const d = new Date(yr, mo-1, dy, rand(0,23), rand(0,59), rand(0,59));
    const unix = Math.floor(d.getTime() / 1000);
    const hexBytes = [
      (unix>>>0)&0xFF, (unix>>8)&0xFF, (unix>>16)&0xFF, (unix>>24)&0xFF
    ].map(x=>pad(x.toString(16).toUpperCase(),2));
    const correct = `${yr}-${pad(mo,2)}-${pad(dy,2)}`;
    const distractors = [
      new Date((unix+86400)*1000).toISOString().slice(0,10),
      new Date((unix-86400)*1000).toISOString().slice(0,10),
      new Date((unix+3600)*1000).toISOString().slice(0,10),
    ].filter(d=>d!==correct);
    const choices = shuffle([correct,...distractors.slice(0,3)])
      .map(c=>({text:c, correct:c===correct}));
    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-ts">🕐</div>
        <div class="ex-title">Unix Epoch — Timestamp 32-bit LE</div>
      </div>
      <p class="ex-desc">Convertis ce timestamp <strong>Unix Epoch</strong> (secondes depuis le 01/01/1970 UTC) en date lisible.</p>
      <div class="ex-hex-display">${hexBytes.join(' ')}</div>
      <div style="font-size:.75rem;color:var(--dim);margin:.4rem 0 .75rem">
        Valeur LE = <code style="color:var(--cyan)">0x${unix.toString(16).toUpperCase().padStart(8,'0')}</code>
        = <strong style="color:var(--gold)">${unix}</strong> secondes depuis le 01/01/1970
      </div>
      <div class="ex-feedback" id="ex-feedback-ts"></div>
      <div class="tp-choices" id="ex-choices-ts">
        ${choices.map((c,i)=>`<button type="button" class="tp-choice" onclick="(function(){
          const fb=document.getElementById('ex-feedback-ts');
          const btns=document.querySelectorAll('#ex-choices-ts .tp-choice');
          btns.forEach(b=>b.disabled=true);
          if(${JSON.stringify(c.correct)}){
            this.className='tp-choice correct';
            fb.className='ex-feedback correct';
            fb.innerHTML='✓ Correct. Unix Epoch : 0 = 01/01/1970 00:00:00 UTC. Convertir : octets LE → valeur → date. En forensique : les timestamps Unix sont courants sur Linux, macOS, iOS et de nombreuses bases de données.';
            if(!STATE.hintUsed) incSolved(STATE.cat);
            updateStreak(true);
          } else {
            this.className='tp-choice wrong';
            fb.className='ex-feedback wrong';
            fb.innerHTML='✗ Incorrect. La date correcte est <strong>${correct}</strong>. Unix seconds = ${unix} = ${correct}.';
            breakStreak();
          }
          document.getElementById('btn-next-ts').style.display='inline-block';
        }).call(this)">${c.text}</button>`).join('')}
      </div>
      <button type="button" class="btn-next" id="btn-next-ts" style="display:none" onclick="newExercise()">Suivant →</button>
    `;
    return void document.getElementById('ex-container').replaceChildren(div);
  }

  // ── Mode 3 : APFS nanoseconds → timestamp ───────────────────
  if (tsMode === 3) {
    const yr = rand(2018, 2024), mo = rand(1,12), dy = rand(1,28);
    const d = new Date(yr, mo-1, dy, rand(0,23), rand(0,59));
    // APFS utilise nanosecondes depuis le 01/01/2001 00:00:00 UTC
    const APFS_EPOCH_OFFSET = 978307200; // secondes entre 1970 et 2001
    const unix = Math.floor(d.getTime()/1000);
    const apfsNs = (unix - APFS_EPOCH_OFFSET) * 1000000000;
    // Afficher en hexa 64-bit LE
    const lo = apfsNs % 0x100000000, hi = Math.floor(apfsNs / 0x100000000);
    const hexBytes = [
      lo&0xFF,(lo>>8)&0xFF,(lo>>16)&0xFF,(lo>>24)&0xFF,
      hi&0xFF,(hi>>8)&0xFF,(hi>>16)&0xFF,(hi>>24)&0xFF
    ].map(x=>pad(x.toString(16).toUpperCase(),2));
    const correct = `${yr}-${pad(mo,2)}-${pad(dy,2)}`;
    const distractors = [
      new Date((unix+86400)*1000).toISOString().slice(0,10),
      new Date((unix-86400)*1000).toISOString().slice(0,10),
      `${yr+1}-${pad(mo,2)}-${pad(dy,2)}`,
    ].filter(d=>d!==correct);
    const choices = shuffle([correct,...distractors.slice(0,3)])
      .map(c=>({text:c, correct:c===correct}));
    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num" id="ex-num-ts">🍎</div>
        <div class="ex-title">APFS Timestamp — Nanosecondes depuis 2001</div>
      </div>
      <p class="ex-desc">Convertis ce timestamp <strong>APFS</strong> (nanosecondes depuis le 01/01/2001 00:00:00 UTC) en date lisible.</p>
      <div class="ex-hex-display">${hexBytes.join(' ')}</div>
      <div style="font-size:.75rem;color:var(--dim);margin:.4rem 0 .75rem">
        Epoch APFS : <code style="color:var(--cyan)">01/01/2001</code> (≠ Unix 1970, ≠ NTFS 1601)<br>
        Unité : <strong style="color:var(--gold)">nanosecondes</strong> × 10⁻⁹ = secondes
      </div>
      <div class="ex-feedback" id="ex-feedback-ts"></div>
      <div class="tp-choices" id="ex-choices-ts">
        ${choices.map((c,i)=>`<button type="button" class="tp-choice" onclick="(function(){
          const fb=document.getElementById('ex-feedback-ts');
          const btns=document.querySelectorAll('#ex-choices-ts .tp-choice');
          btns.forEach(b=>b.disabled=true);
          if(${JSON.stringify(c.correct)}){
            this.className='tp-choice correct';
            fb.className='ex-feedback correct';
            fb.innerHTML='✓ Correct. Les 4 epochs à mémoriser : NTFS=1601, Unix=1970, APFS/CoreData=2001, FAT=1980. Convertir APFS : valeur ÷ 10⁹ + 978307200 (secondes entre 1970 et 2001) = timestamp Unix.';
            if(!STATE.hintUsed) incSolved(STATE.cat);
            updateStreak(true);
          } else {
            this.className='tp-choice wrong';
            fb.className='ex-feedback wrong';
            fb.innerHTML='✗ Incorrect. Date correcte : <strong>${correct}</strong>. APFS nanosecondes ÷ 10⁹ + 978307200 = Unix timestamp → date.';
            breakStreak();
          }
          document.getElementById('btn-next-ts').style.display='inline-block';
        }).call(this)">${c.text}</button>`).join('')}
      </div>
      <button type="button" class="btn-next" id="btn-next-ts" style="display:none" onclick="newExercise()">Suivant →</button>
    `;
    return void document.getElementById('ex-container').replaceChildren(div);
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
      <button type="button" class="btn-validate" onclick="checkBitmap('${expectedHex}')">Valider ✓</button>
      <button type="button" class="btn-next" id="btn-next-bm" onclick="newExercise()" style="display:none">Exercice suivant →</button>
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
  const chainLen = rand(3, 7);
  const startCluster = rand(2, 50);
  const chain = [startCluster];
  for (let i = 1; i < chainLen; i++) chain.push(chain[i-1] + rand(1,5));

  // Build FAT entries (sparse)
  const fatEntries = {};
  for (let i = 0; i < chain.length - 1; i++) fatEntries[chain[i]] = chain[i+1];
  fatEntries[chain[chain.length-1]] = 0x0FFFFFFF; // EOC

  // Add some decoy entries
  for (let i = 0; i < 5; i++) {
    const decoy = rand(2, 100);
    if (!fatEntries[decoy]) fatEntries[decoy] = rand(2, 100);
  }

  const allClusters = [...new Set([...chain, ...Object.keys(fatEntries).map(Number)])].sort((a,b)=>a-b);

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num" id="ex-num-fat">1</div>
      <div class="ex-title">Reconstruction d'une chaîne FAT</div>
      <span class="ex-badge medium">medium</span>
    </div>
    <div class="ex-scenario">
      Dans une table FAT, chaque entrée pointe vers le cluster suivant d'un fichier.<br>
      Reconstitue la chaîne complète à partir du cluster <strong>${startCluster}</strong>.<br>
      <em style="color:var(--dim);font-size:.78rem">0x0FFFFFFF = fin de chaîne (EOC) · 0x00000000 = cluster libre</em>
    </div>

    <div class="sec-title">Table FAT (extrait)</div>
    <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:1rem">
      <div style="display:grid;grid-template-columns:auto auto auto;font-size:.78rem;font-family:var(--mono)">
        <div style="padding:.4rem .75rem;background:var(--surface2);color:var(--dim);font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">Cluster</div>
        <div style="padding:.4rem .75rem;background:var(--surface2);color:var(--dim);font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">Entrée FAT</div>
        <div style="padding:.4rem .75rem;background:var(--surface2);color:var(--dim);font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">Signification</div>
        ${allClusters.map(c => {
          const entry = fatEntries[c] || 0;
          const isChain = chain.includes(c);
          const sig = entry === 0x0FFFFFFF ? 'Fin de chaîne' : entry === 0 ? 'Libre' : `→ cluster ${entry}`;
          return `<div style="padding:.35rem .75rem;border-bottom:1px solid rgba(255,255,255,.04);${isChain?'color:var(--cyan)':''}">${c}</div>
                  <div style="padding:.35rem .75rem;border-bottom:1px solid rgba(255,255,255,.04);${isChain?'color:var(--cyan)':''}">${entry === 0x0FFFFFFF ? '0x0FFFFFFF' : '0x'+pad(entry.toString(16).toUpperCase(),8)}</div>
                  <div style="padding:.35rem .75rem;border-bottom:1px solid rgba(255,255,255,.04);color:var(--dim);font-size:.72rem">${sig}</div>`;
        }).join('')}
      </div>
    </div>

    <div class="ex-input-row">
      <span class="ex-input-label">Chaîne (clusters séparés par →) :</span>
      <input class="ex-input" id="ans-fat" placeholder="${chain[0]} → ${chain[1]} → … → EOC" style="min-width:200px" autocomplete="off">
    </div>
    <div class="ex-input-row" style="margin-top:.5rem">
      <button type="button" class="btn-validate" onclick="checkFAT('${chain.join(',')}')">Valider ✓</button>
      <button type="button" class="btn-next" id="btn-next-fat" onclick="newExercise()">Exercice suivant →</button>
    </div>
    <div class="ex-feedback" id="ex-feedback-fat"></div>
  `;
  setTimeout(() => {
    const inp = div.querySelector('#ans-fat');
    if (inp) inp.addEventListener('keydown', e => { if(e.key==='Enter') checkFAT(chain.join(',')); });
  }, 50);
  return div;
}

function checkFAT(expected) {
  const inp = document.getElementById('ans-fat');
  const fb = document.getElementById('ex-feedback-fat');
  const raw = inp.value.replace(/[^0-9,→\->\s]/g,'');
  const parsed = raw.split(/[\s,→\->]+/).map(Number).filter(n => !isNaN(n) && n > 0);
  const exp = expected.split(',').map(Number);

  const ok = parsed.length === exp.length && parsed.every((v,i) => v === exp[i]);
  if (ok) {
    document.querySelector('.btn-validate').disabled = true;
    document.getElementById('btn-next-fat').style.display = 'block';
    document.querySelector('.ex-card').className = 'ex-card solved';
    document.getElementById('ex-num-fat').className = 'ex-num solved';
    fb.className='ex-feedback correct';
    fb.innerHTML=`✓ Correct ! Chaîne : <span style="font-family:var(--mono);color:var(--cyan)">${exp.join(' → ')} → EOC</span>`;
    if (!STATE.hintUsed) incSolved(STATE.cat);
  } else {
    fb.className='ex-feedback wrong';
    fb.innerHTML=`✗ Chaîne incorrecte. Tu as saisi : <span style="font-family:var(--mono)">${parsed.join(' → ') || '—'}</span><br>Suis chaque entrée FAT à partir du cluster de départ jusqu'au 0x0FFFFFFF.`;
    breakStreak();
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

  const decoys = MAGIC_DB.filter(e => e.ext !== entry.ext).sort(()=>Math.random()-.5).slice(0,3);
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
        <button type="button" class="tp-choice" onclick="checkMagic(${i}, ${options.indexOf(entry)}, this)">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span><strong style="color:var(--cyan)">.${o.ext}</strong> — ${o.desc}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-mg"></div>
    <button type="button" class="btn-next" id="btn-next-mg" onclick="newExercise()" style="margin-top:.5rem">Exercice suivant →</button>
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
  // Fix #6 : toujours afficher la note du BON choix pour un contenu pédagogique utile
  const noteCorrect = _magicNotes[correct] || '';
  const noteChosen  = _magicNotes[chosen]  || '';
  const fb = document.getElementById('ex-feedback-mg');
  fb.className = 'ex-feedback ' + (ok ? 'correct' : 'wrong');
  fb.innerHTML = ok
    ? '✓ Correct ! <strong>Note forensique :</strong> ' + noteCorrect
    : '✗ Incorrect. <strong>La bonne réponse :</strong> ' + noteCorrect +
      (noteChosen && noteChosen !== noteCorrect
        ? `<div style="margin-top:.4rem;padding:.4rem .6rem;background:rgba(255,64,96,.05);border-radius:5px;font-size:.75rem;color:var(--dim)">Ton choix portait sur : ${noteChosen}</div>`
        : '');
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
      <button type="button" class="btn-next" id="btn-next-mm" onclick="newExercise()" style="display:none">Exercice suivant →</button>
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
  if (isOk) row.dataset.answeredOk = '1';
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
      if (r.dataset.answeredOk === '1') correctCount++;
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
      <button type="button" class="btn-hint" onclick="showRunListHint(${JSON.stringify(encodedFragments.map(f=>({l:f.length,d:f.delta,lcn:f.lcn})))})">💡 Décomposition</button>
      <button type="button" class="btn-validate" id="btn-rl-validate" onclick="checkRunList(${JSON.stringify(encodedFragments.map(f=>({l:f.length,lcn:f.lcn})))}, ${numFragments})">Valider ✓</button>
      <button type="button" class="btn-next" id="btn-next-rl" onclick="newExercise()" style="display:none">Exercice suivant →</button>
    </div>
    <div class="ex-feedback" id="rl-feedback-global"></div>
  `;
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

let _hintPanel = null;
let _currentHints = [];
let _currentHintIdx = 0;

function initHintSystem(cat) {
  _currentHints = HINT_LIBRARY[cat] || HINT_LIBRARY.endian;
  _currentHintIdx = 0;
}

function showContextHint(cat) {
  initHintSystem(cat || STATE.cat);
  const existing = document.getElementById('ctx-hint-panel');
  if (existing) { existing.remove(); return; }

  const panel = document.createElement('div');
  panel.id = 'ctx-hint-panel';
  panel.style.cssText = `
    position:fixed; bottom:70px; right:16px; width:320px; max-width:90vw;
    background:linear-gradient(135deg,#0c1422,#101c30);
    border:1px solid rgba(240,192,64,.4); border-radius:12px;
    padding:14px 16px; z-index:8000;
    box-shadow: 0 8px 32px rgba(0,0,0,.6);
    animation: slideUp .25s ease;
    font-size:.8rem; line-height:1.65;
  `;

  function render() {
    const hints = _currentHints;
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:.72rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.1em">💡 Aide contextuelle</span>
        <button id="ctx-hint-close"
          style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:16px;line-height:1;padding:0">✕</button>
      </div>
      <div id="ctx-hint-text" style="color:var(--text);margin-bottom:10px">${hints[_currentHintIdx]}</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span id="ctx-hint-idx" style="font-size:.68rem;color:var(--dim)">${_currentHintIdx+1} / ${hints.length}</span>
        <div style="display:flex;gap:6px">
          <button id="ctx-hint-prev"
            style="padding:3px 10px;border-radius:5px;border:1px solid rgba(255,255,255,.15);background:transparent;color:var(--dim);cursor:pointer;font-size:.75rem;font-family:var(--mono)">←</button>
          <button id="ctx-hint-next"
            style="padding:3px 10px;border-radius:5px;border:1px solid rgba(255,255,255,.15);background:transparent;color:var(--dim);cursor:pointer;font-size:.75rem;font-family:var(--mono)">→</button>
        </div>
      </div>
    `;
    // Fix : bind les handlers ici pour éviter les bugs de sélecteurs
    panel.querySelector('#ctx-hint-close').onclick = () => panel.remove();
    panel.querySelector('#ctx-hint-prev').onclick = () => {
      _currentHintIdx = Math.max(0, _currentHintIdx - 1);
      updateHintPanel();
    };
    panel.querySelector('#ctx-hint-next').onclick = () => {
      _currentHintIdx = Math.min(_currentHints.length - 1, _currentHintIdx + 1);
      updateHintPanel();
    };
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
  btn.title = 'Aide contextuelle';
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
      <button type="button" class="btn-hint" onclick="showBasesHint('${data.hint.replace(/'/g,"\\'")}')">💡 Méthode</button>
      <button type="button" class="btn-validate" onclick="checkBases(this, '${data.answer.replace(/'/g,"\\'")}', '${data.explain.replace(/'/g,"\\'")}')">Valider ✓</button>
      <button type="button" class="btn-next" id="btn-next-bs" onclick="newExercise()">Exercice suivant →</button>
    </div>
    <div class="ex-feedback" id="ex-feedback-bs"></div>
  `;
  setTimeout(() => {
    const inp = div.querySelector('#inp-bases');
    if (inp) inp.addEventListener('keydown', e => { if(e.key==='Enter') div.querySelector('.btn-validate').click(); });
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
      choices: ["0x00 (zéro)", "0xE5 (sigma)", "0xFF (effacement)", "Le nom est supprimé"],
      correct: 1,
      explain: "0xE5 remplace le premier octet du nom de fichier dans l'entrée du répertoire. C'est le marqueur d'effacement FAT depuis MS-DOS — 0xE5 correspond au caractère σ.",
      note: "Les données ne sont PAS effacées — seule l'entrée de répertoire est marquée. C'est pourquoi la récupération forensique est possible."
    },
    {
      q: `Que deviennent les entrées FAT des clusters ${clusters.join(', ')} après l'effacement de <strong>${filename}</strong> ?`,
      choices: [
        `Elles passent à 0x0000 (cluster libre)`,
        `Elles passent à 0xFFFF (fin de chaîne)`,
        `Elles sont supprimées physiquement du disque`,
        `Elles restent inchangées — FAT ne se met pas à jour`
      ],
      correct: 0,
      explain: `Les entrées FAT des clusters ${clusters.join(', ')} passent à 0x0000, les marquant comme libres. Mais les données dans ces clusters restent intactes sur le disque jusqu'à réécriture.`,
      note: "C'est le principe de la récupération forensique FAT : les données survivent à l'effacement."
    },
    {
      q: `Un fichier <strong>${filename}</strong> de ${sizeMB} Mo vient d'être effacé. Ses données sont-elles récupérables ?`,
      choices: [
        "Non — les données sont immédiatement écrasées",
        "Oui — si les clusters n'ont pas été réalloués",
        "Seulement si le disque a un journal (journaling)",
        "Non — l'effacement supprime les données et l'entrée FAT"
      ],
      correct: 1,
      explain: `Oui, les données sont potentiellement récupérables. L'effacement FAT ne fait que marquer les clusters comme libres (0x0000). Les données physiques dans les clusters ${clusters.join(', ')} restent jusqu'à ce qu'un nouveau fichier les réécrive.`,
      note: `En forensique, on recherche les entrées avec 0xE5 en premier octet pour identifier les fichiers effacés. La taille (${sizeMB} Mo) et le cluster de départ sont encore lisibles dans l'entrée corrompue.`
    },
  ];

  const q = questions[rand(0, questions.length-1)];
  const opts = q.choices.map((c,i) => ({text:c, correct: i===q.correct})).sort(()=>Math.random()-.5);
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
        <button type="button" class="tp-choice" onclick="checkEffacement(this, ${i===correctIdx}, '${q.explain.replace(/'/g,"\\'")}', '${q.note.replace(/'/g,"\\'")}')">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${o.text}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-ef"></div>
    <button type="button" class="btn-next" id="btn-next-ef" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  return div;
}

function checkEffacement(btn, isOk, explain, note) {
  const btns = document.querySelectorAll('#ef-choices .tp-choice');
  if (btns[0].disabled) return;
  btns.forEach(b => { b.disabled = true; b.style.cursor='default'; });
  btn.style.borderColor = isOk ? 'var(--green)' : 'var(--red)';
  btn.style.background  = isOk ? 'rgba(48,232,138,.1)' : 'rgba(255,64,96,.08)';
  btn.style.color       = isOk ? 'var(--green)' : 'var(--red)';
  const fb = document.getElementById('ex-feedback-ef');
  fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
  fb.innerHTML = (isOk ? '✓ ' : '✗ ') + explain + `<div style="margin-top:6px;padding:6px 8px;background:rgba(0,229,204,.06);border-radius:6px;font-size:.76rem;color:var(--cyan)">📌 Note forensique : ${note}</div>`;
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

// Générateur de dumps hex réalistes
function fakeHexRow(offset, bytes) {
  const hex = bytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ');
  const ascii = bytes.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
  return { offset: offset.toString(16).toUpperCase().padStart(8,'0'), hex, ascii, bytes };
}

function renderHexDump(rows, highlights=[]) {
  return `<div style="background:rgba(0,0,0,.45);border:1px solid var(--border);border-radius:8px;overflow:auto;margin:.6rem 0;font-family:var(--mono);font-size:.76rem">
    <table style="border-collapse:collapse;width:100%">
      <thead><tr style="background:var(--surface2)">
        <th style="padding:.3rem .6rem;color:var(--dim);font-size:.65rem;text-align:left;border-bottom:1px solid var(--border)">Offset</th>
        <th style="padding:.3rem .6rem;color:var(--dim);font-size:.65rem;text-align:left;border-bottom:1px solid var(--border)">0  1  2  3  4  5  6  7   8  9  A  B  C  D  E  F</th>
        <th style="padding:.3rem .6rem;color:var(--dim);font-size:.65rem;border-bottom:1px solid var(--border)">ASCII</th>
      </tr></thead>
      <tbody>
        ${rows.map(r => `<tr style="border-bottom:1px solid rgba(255,255,255,.03)">
          <td style="padding:.3rem .6rem;color:var(--dim)">${r.offset}</td>
          <td style="padding:.3rem .8rem">${r.bytes.map((b,i) => {
            const globalIdx = r.offset ? parseInt(r.offset,16) + i : i;
            const isHL = highlights.some(h => h.from <= (parseInt(r.offset,16)+i) && (parseInt(r.offset,16)+i) <= h.to);
            const col = highlights.find(h => h.from <= (parseInt(r.offset,16)+i) && (parseInt(r.offset,16)+i) <= h.to);
            const style = col ? `color:var(${col.color||'--cyan'});font-weight:700` : `color:var(--text)`;
            return `<span style="${style}" title="${col?col.label:''}">${b.toString(16).toUpperCase().padStart(2,'0')}</span>`;
          }).join(' ')}</td>
          <td style="padding:.3rem .6rem;color:var(--dim);font-size:.7rem">${r.bytes.map(b=>(b>=32&&b<127)?String.fromCharCode(b):'.').join('')}</td>
        </tr>`).join('')}
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
    ]),
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
    hexDump: renderHexDump(rows, highlights),
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
    const paddedSlice = slice.length < 16 ? [...slice, ...new Array(16-slice.length).fill(null)] : slice;
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
    ]),
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
    ]),
    legend: `<div style="font-size:.7rem;color:var(--dim);margin-top:.25rem">🔵 Offset 0x00–0x07 : Nom · 0x08–0x0A : Ext · 0x0B : Attr · 0x10–0x11 : Date création · 0x18–0x19 : Date écriture · 0x1A–0x1B : Cluster départ · 0x1C–0x1F : Taille</div>`,
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
  const usedAll   = true; // problème = root plein

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
  }

  return {
    title: 'FAT16 — Répertoire Racine',
    category: 'Système de fichiers FAT',
    difficulty: 'easy',
    scenario: `Extrait du répertoire racine d'une clé USB FAT16. Le 1er octet de l'entrée indique son statut. Le 2ème offset commence une entrée supprimée (0xE5).`,
    hexDump: renderHexDump([row0, row1, row2, row3], [
      {from:0x00, to:0x00, color:'--cyan', label:'État 1ère entrée'},
      {from:0x20, to:0x20, color:'--red',  label:'0xE5 = supprimée'},
    ]),
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
    const nonResidentAttr = attrSet.find(a => a === 0x80) || attrSet[0];
    const nrOffset = attrOffsets[nonResidentAttr] + 8; // flag non-résident
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
    ]),
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
  // Ajouter des entrées fixes
  const allEntries = [
    { name: '.',             inode: 2,                type: 0x02 },
    { name: '..',            inode: 2,                type: 0x02 },
    { name: 'lost+found',    inode: 11,               type: 0x02 },
    ...files,
  ];

  // Target = le 3ème fichier (fichier de vrai type)
  const target = files[rand16(0, files.length-1)];
  const targetInode = target.inode;
  const targetInodeHex = targetInode.toString(16).toUpperCase().padStart(8,'0');

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
    ]),
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
    ]),
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
  const qText = `Cette entrée de répertoire FAT contient un <strong>Long File Name (LFN)</strong> réparti sur <strong>${numEntries} entrée(s)</strong> de 32 octets, suivi d'une entrée SFN. Reconstitue le <strong>nom complet du fichier</strong> (y compris extension — la casse et les espaces sont ignorés pour la validation).`;
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
    ]),
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
    ]),
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
      <button type="button" class="btn-hint" id="exam-hint-btn" onclick="nextExamHint()">💡 Indice (${_examHints.length})</button>
      <button type="button" class="btn-validate" onclick="checkExamen()">Valider ✓</button>
      <button type="button" class="btn-next" id="btn-next-ex" onclick="newExercise()" style="display:none">Exercice suivant →</button>
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



function showExamHint(hint) {
  markHintUsed();
  const fb = document.getElementById('ex-feedback-ex');
  if (fb) { fb.className='ex-feedback correct'; fb.innerHTML=`💡 Indice : ${hint}`; }
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

  // Coloration : cas 1 = rouge sur "Créé" seulement ; cas 2 = rouge sur toutes les lignes SI
  const siSuspect = isTimestomped && (caseType === 1 ? label.includes('Créé') : true);
  const renderRow = (label, SI, FN) => `
    <tr>
      <td style="padding:.4rem .6rem;color:var(--dim);font-family:var(--mono);font-size:.72rem;white-space:nowrap">${label}</td>
      <td style="padding:.4rem .6rem;font-family:var(--mono);font-size:.75rem;color:${isTimestomped && (caseType===1 ? label.includes('Créé') : true) ? 'var(--red)' : 'var(--cyan)'}">${SI.str}</td>
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
        <button type="button" class="tp-choice" onclick="checkTimestomping(true, ${isTimestomped}, '${explanation.replace(/'/g,"\\'").replace(/\n/g,' ')}', this)">
          <span class="tp-choice-letter">A</span>
          <span>✅ Oui — des horodatages ont été manipulés</span>
        </button>
        <button type="button" class="tp-choice" onclick="checkTimestomping(false, ${isTimestomped}, '${explanation.replace(/'/g,"\\'").replace(/\n/g,' ')}', this)">
          <span class="tp-choice-letter">B</span>
          <span>❌ Non — chronologie normale, pas de timestomping</span>
        </button>
      </div>
    </div>
    <div class="ex-feedback" id="ex-feedback-tss"></div>
    <div id="ts-indicator" style="display:none;margin-top:.5rem;font-size:.72rem;font-family:var(--mono);color:var(--dim)">${indicator}</div>
    <button type="button" class="btn-next" id="btn-next-ts2" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
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
  const fb = document.getElementById('ex-feedback-tss');
  fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
  fb.innerHTML = (isOk ? '✓ ' : '✗ ') + explanation;
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
function genDroitPenal() {
  const case_ = DROIT_CASES[STATE.droitIdx % DROIT_CASES.length];
  STATE.droitIdx++;
  saveState();

  const opts = [...case_.choices].sort(() => Math.random() - .5);
  const correctOpt = opts.find(o => o.art === case_.correct || (case_.correct === 'both' && o.art === '143bis') || (case_.correct === '269' && o.art === '269'));
  const correctIdx = opts.indexOf(correctOpt || opts.find(o => o.art === case_.correct));

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
        <button type="button" class="tp-choice" onclick="checkDroitPenal(this, ${i === correctIdx}, '${o.explain.replace(/'/g,"\\'")}', '${case_.note.replace(/'/g,"\\'")}')">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${o.label}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-dp"></div>
    <button type="button" class="btn-next" id="btn-next-dp" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  return div;
}

function checkDroitPenal(btn, isOk, explain, note) {
  const btns = document.querySelectorAll('#dp-choices .tp-choice');
  if (btns[0].disabled) return;
  if (!isOk) breakStreak();
  btns.forEach(b => { b.disabled = true; b.style.cursor = 'default'; });
  btn.style.borderColor = isOk ? 'var(--green)' : 'var(--red)';
  btn.style.background  = isOk ? 'rgba(48,232,138,.1)' : 'rgba(255,64,96,.08)';
  btn.style.color       = isOk ? 'var(--green)' : 'var(--red)';
  const fb = document.getElementById('ex-feedback-dp');
  fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
  fb.innerHTML = (isOk ? '✓ ' : '✗ ') + explain +
    `<div style="margin-top:.5rem;padding:.5rem .75rem;background:rgba(240,192,64,.06);border:1px solid rgba(240,192,64,.2);border-radius:6px;font-size:.75rem;color:var(--gold)">📌 ${note}</div>`;
  document.getElementById('ex-num-dp').className = 'ex-num ' + (isOk ? 'solved' : 'error');
  document.querySelector('.ex-card').className = 'ex-card ' + (isOk ? 'solved' : 'error');
  document.getElementById('btn-next-dp').style.display = 'block';
  if (isOk && !STATE.hintUsed) incSolved(STATE.cat);
}


// ═══════════════════════════════════════════════════════════════
// GLOSSAIRE BILINGUE — FLASHCARDS
// ═══════════════════════════════════════════════════════════════

// [GLOSSAIRE chargé depuis tp-data.js]
let _glossMode = 'fr_to_en'; // 'fr_to_en' or 'en_to_fr'
let _glossSessionCorrect = 0;
let _glossSessionTotal = 0;

function genGlossaire() {
  const term = GLOSSAIRE[STATE.glossIdx % GLOSSAIRE.length];
  STATE.glossIdx++;
  saveState();
  _glossSessionTotal++;

  // Alterner le mode
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
        <button type="button" class="tp-choice" onclick="checkGlossaire(this, ${o.isCorrect}, '${correct.replace(/'/g,"\\'")}', '${term.note.replace(/'/g,"\\'")}')">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span style="font-size:.78rem">${o.text}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-gl"></div>
    <button type="button" class="btn-next" id="btn-next-gl" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
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
        <button type="button" class="tp-choice" data-correct="${i === correctIdx}" data-explain="${encData(c.explain)}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${escAttr(c.text)}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-email"></div>
    <button type="button" class="btn-next" id="btn-next-email" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  // Fix #2 : event delegation (évite le bug JSON dans onclick="...")
  setTimeout(() => {
    div.querySelectorAll('#email-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isCorrect = b.dataset.correct === 'true';
        const explain = decData(b.dataset.explain) || '';
        checkEmail(b, isCorrect, explain);
      });
    });
  }, 0);
  return div;
}

function checkEmail(btn, isCorrect, explain) {
  const choices = document.querySelectorAll('#email-choices .tp-choice');
  if (!choices.length || choices[0].disabled) return;
  choices.forEach(b => { b.disabled = true; });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (isCorrect) {
    choices.forEach(b => { if (b !== btn) b.classList.add('dim'); });
    if (!STATE.hintUsed) incSolved(STATE.cat);
  } else {
    choices.forEach(b => {
      if (b.dataset.correct === 'true') b.classList.add('correct');
    });
    breakStreak();
  }
  const fb = document.getElementById('ex-feedback-email');
  if (fb) {
    fb.className = 'ex-feedback ' + (isCorrect ? 'correct' : 'wrong');
    fb.innerHTML = (isCorrect ? '✓ ' : '✗ ') + escAttr(explain);
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
        <button type="button" class="tp-choice" data-correct="${i === correctIdx}" data-explain="${encData(c.explain)}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${escAttr(c.text)}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-ir"></div>
    <button type="button" class="btn-next" id="btn-next-ir" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  setTimeout(() => {
    div.querySelectorAll('#ir-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isCorrect = b.dataset.correct === 'true';
        const explain = decData(b.dataset.explain) || '';
        checkIR(b, isCorrect, explain);
      });
    });
  }, 0);
  return div;
}

function checkIR(btn, isCorrect, explain) {
  const choices = document.querySelectorAll('#ir-choices .tp-choice');
  if (!choices.length || choices[0].disabled) return;
  choices.forEach(b => { b.disabled = true; });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    choices.forEach(b => { if (b.dataset.correct === 'true') b.classList.add('correct'); });
    breakStreak();
  } else if (!STATE.hintUsed) {
    incSolved(STATE.cat);
  }
  const fb = document.getElementById('ex-feedback-ir');
  if (fb) {
    fb.className = 'ex-feedback ' + (isCorrect ? 'correct' : 'wrong');
    fb.innerHTML = (isCorrect ? '✓ ' : '✗ ') + escAttr(explain);
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
        <button type="button" class="tp-choice" data-correct="${i === correctIdx}" data-explain="${encData(c.explain)}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${escAttr(c.text)}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-net"></div>
    <button type="button" class="btn-next" id="btn-next-net" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  setTimeout(() => {
    div.querySelectorAll('#net-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isCorrect = b.dataset.correct === 'true';
        const explain = decData(b.dataset.explain) || '';
        checkNetwork(b, isCorrect, explain);
      });
    });
  }, 0);
  return div;
}

function checkNetwork(btn, isCorrect, explain) {
  const choices = document.querySelectorAll('#net-choices .tp-choice');
  if (!choices.length || choices[0].disabled) return;
  choices.forEach(b => { b.disabled = true; });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    choices.forEach(b => { if (b.dataset.correct === 'true') b.classList.add('correct'); });
    breakStreak();
  } else if (!STATE.hintUsed) {
    incSolved(STATE.cat);
  }
  const fb = document.getElementById('ex-feedback-net');
  if (fb) {
    fb.className = 'ex-feedback ' + (isCorrect ? 'correct' : 'wrong');
    fb.innerHTML = (isCorrect ? '✓ ' : '✗ ') + escAttr(explain);
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
    answer + cs * 2,
    Math.max(cs, Math.round(answer * 2)),
    answer + 512,
    answer + cs * 3,
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
        <button type="button" class="tp-choice" onclick="checkOffset(this, ${i === correctIdx}, ${JSON.stringify(data.steps)}, ${answer})">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span>
          <span>${c.toLocaleString('fr-CH')} ${data.unit}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-offset"></div>
    <button type="button" class="btn-next" id="btn-next-offset" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  return div;
}

function checkOffset(btn, isCorrect, steps, answer) {
  document.querySelectorAll('#offset-choices .tp-choice').forEach(b => { b.disabled = true; });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (isCorrect) { if (!STATE.hintUsed) incSolved(STATE.cat); }
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
  const COLS = 16;
  let rows = '';
  for (let r = 0; r < bytes.length; r += COLS) {
    const rowBytes = bytes.slice(r, r + COLS);
    const offHex = r.toString(16).toUpperCase().padStart(8,'0');
    const hexPart = rowBytes.map((b,i) =>
      `<span class="hex-byte" data-offset="${r+i}">${b.toString(16).toUpperCase().padStart(2,'0')}</span>`
    ).join(' ');
    const ascii = rowBytes.map(b => (b>=0x20&&b<0x7F) ? String.fromCharCode(b) : '.').join('');
    rows += `<div class="hex-row"><span class="hex-offset">${offHex}</span>${hexPart}<span class="hex-ascii">${ascii}</span></div>`;
  }
  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">🗺</div>
      <div class="ex-title">Table Hex — ${cfg.name}</div>
      <span class="ex-badge hard">Offset</span>
    </div>
    <div class="ex-scenario">${cfg.scenario}</div>
    <div style="font-family:var(--mono);font-size:.72rem;line-height:1.9;overflow-x:auto;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:.65rem 1rem;margin:.5rem 0">${rows}</div>
    <div class="sec-title" style="margin-top:.75rem">À quel offset (hex) se trouve le champ demandé ?</div>
    <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin-bottom:.5rem">
      <span style="font-size:.8rem;color:var(--muted)">0x</span>
      <input class="ex-input" id="inp-hextable" placeholder="ex: 0D" maxlength="4" style="width:90px;text-transform:uppercase" autocomplete="off">
      <button type="button" class="btn-hint" id="ht-hint-btn" onclick="showHexTableHint(${JSON.stringify(ex.hint1)},${JSON.stringify(ex.hint2)})">💡 Indice</button>
      <button type="button" class="btn-validate" onclick="checkHexTable(${JSON.stringify(ex.answer)},${JSON.stringify(ex.explain)},${ex.answer_val})">Valider ✓</button>
      <button type="button" class="btn-next" id="btn-next-ht" onclick="newExercise()" style="display:none">Exercice suivant →</button>
    </div>
    <div class="hint-box" id="hint-ht" style="display:none"></div>
    <div class="ex-feedback" id="ex-feedback-ht" style="display:none"></div>
  `;
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
    if (!STATE.hintUsed) incSolved(STATE.cat);
    const off = parseInt(correctOff, 16);
    document.querySelectorAll(`[data-offset="${off}"]`).forEach(el => el.classList.add('highlight'));
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
  const ALL_FS = ['FAT12','FAT16','FAT32','NTFS','exFAT','EXT4','HFS+','APFS'];

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
      },
    {
      fs: 'APFS',
      context: 'Volume Apple File System — macOS 10.13+, iOS 10.3+',
      build: () => {
        const bytes = new Array(64).fill(0x00);
        // APFS Container Superblock : magic 'NXSB' (4E 58 53 42) à offset 0x20
        // (le header commence par le checksum Fletcher-64 sur 8 octets)
        bytes[8]=0x4E; bytes[9]=0x58; bytes[10]=0x53; bytes[11]=0x42;
        // Block size 4096 LE32 à offset 0x28
        bytes[0x28]=0x00; bytes[0x29]=0x10; bytes[0x2A]=0x00; bytes[0x2B]=0x00;
        // APFS magic alternatif visible en pratique (superblock APSB)
        // Pour l'exercice : on simule les premiers octets reconnaissables
        bytes[0]=0x4E; bytes[1]=0x58; bytes[2]=0x53; bytes[3]=0x42;
        return {
          bytes,
          key: 'Magic "NXSB" (4E 58 53 42) = APFS Container Superblock. ' +
               'Caractéristiques : Copy-on-Write, snapshots, chiffrement AES-XTS natif, ' +
               'timestamps en nanosecondes depuis 01/01/2001, clones de fichiers O(1). ' +
               'macOS 10.13+ / iOS 10.3+ / iPadOS / T2/M1.'
        };
      }
    }
    }
  ];

  const cfg = fsOptions[rand(0, fsOptions.length - 1)];
  const ex = cfg.build();
  const bytes = ex.bytes;

  // Garantir que la bonne réponse est toujours dans les choix
  const others = ALL_FS.filter(f => f !== cfg.fs).sort(() => Math.random() - .5).slice(0, 4);
  const choices = [...others, cfg.fs].sort(() => Math.random() - .5);

  const COLS = 16;
  let rows = '';
  for (let r = 0; r < bytes.length; r += COLS) {
    const rb = bytes.slice(r, r + COLS);
    const off = r.toString(16).toUpperCase().padStart(8, '0');
    const hexP = rb.map(b => `<span class="hex-byte">${b.toString(16).toUpperCase().padStart(2,'0')}</span>`).join(' ');
    const ascii = rb.map(b => (b >= 0x20 && b < 0x7F) ? String.fromCharCode(b) : '.').join('');
    rows += `<div class="hex-row"><span class="hex-offset">${off}</span>${hexP}<span class="hex-ascii">${ascii}</span></div>`;
  }

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
    <div style="font-family:var(--mono);font-size:.72rem;line-height:1.9;overflow-x:auto;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:.65rem 1rem;margin:.5rem 0">${rows}</div>
    <div class="sec-title" style="margin-top:.75rem">Système de fichiers</div>
    <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem" id="fsid-choices">
      ${choices.map(c => `<button type="button" class="tp-choice" style="flex:1;min-width:90px" data-correct="${c === cfg.fs}"
        onclick="checkFSIdentify(this,'${c}','${cfg.fs}',${JSON.stringify(ex.key)})">${c}</button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-fsid" style="display:none"></div>
    <button type="button" class="btn-next" id="btn-next-fsid" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  return div;
}

function checkFSIdentify(btn, chosen, correct, expl) {
  document.querySelectorAll('#fsid-choices .tp-choice').forEach(b=>{ b.disabled=true; });
  const ok = chosen===correct;
  btn.classList.add(ok ? 'correct' : 'wrong');
  if (ok) { if (!STATE.hintUsed) incSolved(STATE.cat); }
  else {
    breakStreak();
    document.querySelectorAll('#fsid-choices .tp-choice').forEach(b=>{
      if(b.dataset.correct==='true') b.classList.add('correct');
      else if(b!==btn) b.classList.add('dim');
    });
  }
  const fb=document.getElementById('ex-feedback-fsid');
  if(fb){fb.className='ex-feedback '+(ok?'correct':'wrong');fb.innerHTML=(ok?'✅ ':'❌ Réponse : <strong>'+correct+'</strong> — ')+expl;fb.style.display='block';}
  document.getElementById('btn-next-fsid').style.display='inline-block';
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
      ${shuffled.map((c,i)=>`<button type="button" class="tp-choice" data-correct="${c.correct}" onclick="checkHashIdentify(this,${c.correct},${JSON.stringify(c.explain)})">
        <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span><span>${c.text}</span></button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-hash" style="display:none"></div>
    <button type="button" class="btn-next" id="btn-next-hash" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  return div;
}

function checkHashIdentify(btn, isOk, explain) {
  document.querySelectorAll('#hash-choices .tp-choice').forEach(b=>{ b.disabled=true; });
  btn.classList.add(isOk ? 'correct' : 'wrong');
  if (isOk) { if (!STATE.hintUsed) incSolved(STATE.cat); }
  else {
    breakStreak();
    document.querySelectorAll('#hash-choices .tp-choice').forEach(b=>{
      if(b.dataset.correct==='true') b.classList.add('correct');
      else if(b!==btn) b.classList.add('dim');
    });
  }
  const fb=document.getElementById('ex-feedback-hash');
  if(fb){fb.className='ex-feedback '+(isOk?'correct':'wrong');fb.textContent=explain;fb.style.display='block';}
  document.getElementById('btn-next-hash').style.display='inline-block';
}
