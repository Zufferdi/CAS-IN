// ═══════════════════════════════════════════════════════════════
// tp-engine-ntfs.js — Exercices "NTFS family" (2 catégories)
//
// Module séparé de tp-engine.js pour faciliter la maintenance (PR 4.2
// du plan Phase 4). Doit être chargé APRÈS tp-engine.js (dépendances :
// STATE, GENERATORS, rand, pad, esc, escAttr, encData, decData, le16, le32,
// showTPHint, markHintUsed, breakStreak, incSolved, renderHexDump,
// formatChoiceFeedback).
//
// Le dispatcher GENERATORS est patché en fin de fichier pour enregistrer
// les 2 générateurs.
//
// ─── Catégories couvertes ──────────────────────────────────────
//   • runlist      (🧩 « Run List NTFS »)
//       — genRunList : décoder nibble par nibble (~123 L)
//       — genRunListClassify : sparse vs contigu vs fragmenté (~160 L)
//       — Helpers : encodeVarInt, encodeSignedVarInt, buildRunListHex,
//         showRunListHint, checkRunList
//
//   • timestomping (🕰 « Timestomping »)
//       — randDate : helper de génération de dates (utilisé uniquement
//         par genTimestomping, déplacé ici en PR 4.2)
//       — genTimestomping : 4 cas (normal / SI altéré / FN cohérent /
//         double anomalie)
//       — checkTimestomping
// ═══════════════════════════════════════════════════════════════

// 7. RUN LIST NTFS
// ═══════════════════════════════════════════════════

function genRunList() {
  // Sous-type 0 (default, ~70%) : décodage classique des fragments (existant)
  // Sous-type 1 (~30%)         : QCM identifier le type de RunList (dense/sparse/compressée)
  const subtype = Math.random() < 0.3 ? 1 : 0;

  if (subtype === 1) {
    return genRunListClassify();
  }

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

// ───────────────────────────────────────────────────────────────
// genRunListClassify — Sous-type QCM
// Affiche une RunList et demande d'identifier son type :
//   • Dense        : runs normaux avec LCN ≥ 0
//   • Sparse       : un run avec header=0x0X (delta=0) → "hole"
//   • Compressée   : un run avec length < expected (signature LZNT1 NTFS)
// Pédagogie : forensique NTFS, $DATA non-resident attribute, sparse files
// ───────────────────────────────────────────────────────────────
function genRunListClassify() {
  // Choix du type cible : dense, sparse, compressed
  const types = ['dense', 'sparse', 'compressed'];
  const target = types[rand(0, types.length - 1)];

  // Build une runlist avec le pattern correspondant
  // Format simplifié pour l'affichage : on affiche du hex pré-construit
  // pour rester lisible et focus sur la classification (pas le décodage byte-par-byte)
  let hexDisplay, structure, kicker;

  if (target === 'dense') {
    // Run normal : 2-3 fragments avec LCN différents, pas de delta=0
    const f1Len = rand(8, 30), f1Lcn = rand(100, 500);
    const f2Len = rand(8, 30), f2Delta = rand(50, 200);
    hexDisplay = `21 ${f1Len.toString(16).padStart(2,'0').toUpperCase()} ${(f1Lcn & 0xFF).toString(16).padStart(2,'0').toUpperCase()} ${((f1Lcn >> 8) & 0xFF).toString(16).padStart(2,'0').toUpperCase()} 11 ${f2Len.toString(16).padStart(2,'0').toUpperCase()} ${f2Delta.toString(16).padStart(2,'0').toUpperCase()} 00`;
    structure = `Frag 1 : header 0x21 → length=1 oct, delta=2 oct  →  ${f1Len} clusters @ LCN ${f1Lcn}<br>Frag 2 : header 0x11 → length=1 oct, delta=1 oct  →  ${f2Len} clusters @ LCN ${f1Lcn + f2Delta}`;
    kicker = `Tous les runs ont une partie <strong>delta LCN ≠ 0</strong> (nibble haut du header > 0). Les clusters sont <strong>physiquement alloués</strong>.`;
  } else if (target === 'sparse') {
    // Sparse run : un fragment avec nibble haut = 0 → "hole"
    const f1Len = rand(10, 30), f1Lcn = rand(100, 400);
    const holeLen = rand(20, 60);
    const f3Len = rand(5, 20), f3Delta = rand(80, 200);
    hexDisplay = `21 ${f1Len.toString(16).padStart(2,'0').toUpperCase()} ${(f1Lcn & 0xFF).toString(16).padStart(2,'0').toUpperCase()} ${((f1Lcn >> 8) & 0xFF).toString(16).padStart(2,'0').toUpperCase()} 01 ${holeLen.toString(16).padStart(2,'0').toUpperCase()} 11 ${f3Len.toString(16).padStart(2,'0').toUpperCase()} ${f3Delta.toString(16).padStart(2,'0').toUpperCase()} 00`;
    structure = `Frag 1 : header 0x21 → ${f1Len} clusters @ LCN ${f1Lcn}<br><strong style="color:var(--gold)">Frag 2 : header 0x01 → length=1 oct, delta=<span style="color:var(--red)">0 oct</span></strong>  →  ${holeLen} clusters virtuels (HOLE)<br>Frag 3 : header 0x11 → ${f3Len} clusters @ LCN ${f1Lcn + f3Delta}`;
    kicker = `Le <strong>fragment 2 a un header 0x01</strong> : nibble haut = 0 → <strong>aucun delta LCN</strong>. C'est un trou (sparse run / "hole") : ces clusters ne sont <strong>pas physiquement alloués</strong> sur le disque, le FS retourne des zéros à la lecture. Économise l'espace disque pour les fichiers à grandes zones nulles (DB sparse, VM disks).`;
  } else { // compressed
    // Compressed : NTFS LZNT1 — pattern où length de la dernière unité = 16 et le run est "padded"
    // Signature : un fragment de 16 clusters logiques (1 unité de compression) avec moins de blocs alloués réels
    const f1Len = 16; // 1 unité de compression NTFS = 16 clusters
    const f1Lcn = rand(200, 600);
    const compRatio = rand(8, 14); // 8-14 clusters réellement alloués pour 16 logiques
    const padding = 16 - compRatio;
    hexDisplay = `21 ${compRatio.toString(16).padStart(2,'0').toUpperCase()} ${(f1Lcn & 0xFF).toString(16).padStart(2,'0').toUpperCase()} ${((f1Lcn >> 8) & 0xFF).toString(16).padStart(2,'0').toUpperCase()} 01 ${padding.toString(16).padStart(2,'0').toUpperCase()} 00`;
    structure = `Frag 1 : header 0x21 → <strong style="color:var(--gold)">${compRatio} clusters réels</strong> @ LCN ${f1Lcn}<br>Frag 2 : header 0x01 → length=1 oct, delta=0  →  <strong>${padding} clusters virtuels</strong> (padding compression)<br>Total logique : ${compRatio} + ${padding} = <strong>16 clusters</strong> (1 unité LZNT1)`;
    kicker = `Pattern caractéristique : <strong>${compRatio} clusters réels suivis de ${padding} clusters virtuels</strong>, total = <strong>16</strong> (taille d'une unité de compression NTFS LZNT1, voir <code>$ATTRIBUTE_LIST</code> + flag <code>0x0001</code> dans <code>$STANDARD_INFORMATION</code>). NTFS lit les ${compRatio} clusters et décompresse vers 16 clusters logiques. Économise ~${Math.round(100*(1-compRatio/16))}% d'espace.`;
  }

  // Choices QCM
  const choices = [
    { type: 'dense', label: '<strong>Dense</strong> — fragments normaux, tous physiquement alloués',
      explain: 'Une RunList dense a tous ses runs avec un delta LCN ≠ 0 (nibble haut du header > 0). Cas le plus courant pour les fichiers continus.' },
    { type: 'sparse', label: '<strong>Sparse</strong> — contient un "hole" (cluster non alloué)',
      explain: 'Une RunList sparse contient un run avec header de la forme 0x0X (nibble haut = 0). Ce fragment représente un trou : aucun cluster physique alloué, lecture retourne 0x00. Caractéristique des fichiers sparse (DB, disques VM).' },
    { type: 'compressed', label: '<strong>Compressée</strong> — LZNT1 (NTFS native compression)',
      explain: 'Pattern : N clusters réels suivis de (16-N) clusters virtuels totalisant 16 (taille d\'unité de compression NTFS LZNT1). Le flag 0x0001 dans $STANDARD_INFORMATION confirme la compression.' },
  ];
  const shuffled = choices.map(c => ({
    text: c.label,
    correct: c.type === target,
    explain: c.type === target
      ? `<strong>Bonne réponse.</strong> ${c.explain}<br><br>${kicker}`
      : `Ce n'est pas une RunList ${c.type}. ${c.explain}`,
  })).sort(() => Math.random() - 0.5);
  const correctIdx = shuffled.findIndex(c => c.correct);
  const correctExplain = shuffled[correctIdx].explain;

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">🧩</div>
      <div class="ex-title">Classification d'une Run List NTFS</div>
      <span class="ex-badge medium">medium</span>
    </div>
    <div class="ex-scenario">
      Tu analyses un attribut <strong>$DATA non-resident</strong> d'un fichier NTFS et trouves cette Run List.<br>
      <em style="color:var(--dim);font-size:.78rem">Rappel : header byte = nibble haut (octets delta LCN) | nibble bas (octets length). 0x00 = fin.</em>
    </div>

    <div class="sec-title">Séquence Run List</div>
    <div class="hex-display" style="margin-bottom:.75rem;font-family:var(--mono);font-size:.85rem;padding:.6rem;background:var(--bg);border-radius:6px;letter-spacing:.1em">
      ${hexDisplay}
    </div>

    <div class="sec-title">Décomposition</div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem;margin-bottom:1rem;font-size:.85rem;line-height:1.6">
      ${structure}
    </div>

    <div class="sec-title">À quel type de Run List as-tu affaire ?</div>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="rlc-choices">
      ${shuffled.map((c, i) => `<button class="tp-choice"
        data-correct="${c.correct}"
        data-explain="${encData(c.explain)}"
        data-correct-explain="${encData(correctExplain)}">
        <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span><span>${c.text}</span></button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-rlc" style="display:none"></div>
    <button class="btn-next" id="btn-next-rlc" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  setTimeout(() => {
    div.querySelectorAll('#rlc-choices .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        const explain = decData(b.dataset.explain) || '';
        const correctEx = decData(b.dataset.correctExplain) || '';
        document.querySelectorAll('#rlc-choices .tp-choice').forEach(btn => { btn.disabled = true; });
        b.classList.add(isOk ? 'correct' : 'wrong');
        if (isOk) { if (!STATE.hintUsed) incSolved('runlist'); }
        else {
          breakStreak();
          document.querySelectorAll('#rlc-choices .tp-choice').forEach(btn => {
            if (btn.dataset.correct === 'true') btn.classList.add('correct');
            else if (btn !== b) btn.classList.add('dim');
          });
        }
        const fb = document.getElementById('ex-feedback-rlc');
        if (fb) {
          fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
          fb.innerHTML = formatChoiceFeedback(isOk, correctEx || explain, explain);
          fb.style.display = 'block';
        }
        document.getElementById('btn-next-rlc').style.display = 'inline-block';
      });
    });
  }, 0);
  return div;
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
// Enregistrement dans le dispatcher GENERATORS
// ═══════════════════════════════════════════════════════════════
if (typeof GENERATORS !== 'undefined') {
  GENERATORS.runlist      = genRunList;
  GENERATORS.timestomping = genTimestomping;
}
