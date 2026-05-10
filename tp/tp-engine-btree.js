// ═══════════════════════════════════════════════════════════════
// tp-engine-btree.js — Exercices B-Tree (HFS+ Catalog & NTFS $INDEX)
//
// Module séparé de tp-engine.js pour faciliter la maintenance.
// Doit être chargé APRÈS tp-engine.js (dépendances : showTPHint, markHintUsed,
// breakStreak, incSolved, formatChoiceFeedback, renderHexDump, rand, pad,
// encData, decData, escAttr, GENERATORS, STATE).
//
// Le dispatcher GENERATORS est patché ici pour enregistrer les 2 générateurs.
//
// ─── Catégories ajoutées ────────────────────────────────────────
//
// hfsbtree (🌳 « B-Tree HFS+ ») — Apple TN1150
//   0 — QCM : identifier le kind d'un BTNodeDescriptor (leaf / index / header / map)
//   1 — Numérique : lire numRecords (UInt16 BE) à offset 0x0A
//   2 — Numérique (hex) : décoder le parentID (CNID) d'une HFSPlusCatalogKey
//   3 — Numérique : suivre fLink (UInt32 BE) — chaînage des leaves
//   4 — QCM forensique : où peut survivre une entrée supprimée du Catalog ?
//
// ntfsindex (📇 « $INDEX NTFS ») — Russon/Fledel libntfs
//   0 — QCM : reconnaître la signature "INDX" vs "FILE" / "BAAD" / "RCRD"
//   1 — QCM : décoder les flags d'une Index Entry (bit 0=subnode, bit 1=last)
//   2 — Numérique : lire la référence MFT (6 octets numéro + 2 octets seq, LE)
//   3 — Numérique (hex) : décoder la VCN du sous-nœud (UInt64 LE) en fin d'entrée
//   4 — QCM : $INDEX_ROOT (0x90, résident) vs $INDEX_ALLOCATION (0xA0, non-résident)
//
// ═══════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
// 28. HFSBTREE — B-TREE HFS+ (CATALOG)
// ═══════════════════════════════════════════════════════════════
function genHFSBTree() {
  const subtype = rand(0, 4);

  // ── Helpers Big Endian (HFS+ est BE, contrairement à FAT/NTFS) ──
  const be16 = v => [(v >>> 8) & 0xFF, v & 0xFF];
  const be32 = v => [(v >>> 24) & 0xFF, (v >>> 16) & 0xFF, (v >>> 8) & 0xFF, v & 0xFF];

  // ─────────────────────────────────────────────────────────────
  // Sous-type 0 : Identifier le kind (QCM)
  // ─────────────────────────────────────────────────────────────
  if (subtype === 0) {
    // BTNodeDescriptor (Apple TN1150) — 14 octets, tout BE :
    //   0x00 fLink       UInt32 BE  — next node same level
    //   0x04 bLink       UInt32 BE  — previous node same level
    //   0x08 kind        SInt8      — -1=leaf (0xFF), 0=index, 1=header, 2=map
    //   0x09 height      UInt8      — 0=header/map, 1=leaf, >1=index node
    //   0x0A numRecords  UInt16 BE  — nombre d'enregistrements actifs
    //   0x0C reserved    UInt16 BE
    const KINDS = [
      { value: 0xFF, name: 'Leaf node',   shortName: 'leaf',
        explain: 'kind = <code>-1</code> (0xFF en SInt8) → <strong>leaf node</strong> : contient les vraies entrées du Catalog (fichiers, dossiers, threads). Source primaire des métadonnées récupérables.' },
      { value: 0x00, name: 'Index node',  shortName: 'index',
        explain: 'kind = <code>0</code> → <strong>index node</strong> : pointe vers des nœuds enfants (intermédiaires). Sa hauteur est strictement &gt; 1.' },
      { value: 0x01, name: 'Header node', shortName: 'header',
        explain: 'kind = <code>1</code> → <strong>header node</strong> : toujours le nœud n°0 du B-Tree. Contient le BTHeaderRec (root node, leafRecords, nodeSize, treeDepth…). Indispensable pour démarrer une analyse.' },
      { value: 0x02, name: 'Map node',    shortName: 'map',
        explain: 'kind = <code>2</code> → <strong>map node</strong> : contient une bitmap supplémentaire pour suivre l\'allocation des nœuds quand le header node n\'a plus assez de place. Rare sauf gros B-Trees.' },
    ];
    const target = KINDS[rand(0, 3)];

    // Hauteur cohérente avec le kind
    let height;
    if (target.value === 0xFF)      height = 1;          // leaf
    else if (target.value === 0x00) height = rand(2, 3); // index
    else                            height = 0;          // header / map

    // numRecords : un header en a typiquement 3 (header rec + map rec + user data rec)
    const numRecs = (target.value === 0x01) ? 3 : rand(2, 14);
    const fLink = rand(0x10, 0x9FF);
    const bLink = rand(0x00, 0x9FF);

    const desc = [
      ...be32(fLink),       // 0x00–0x03
      ...be32(bLink),       // 0x04–0x07
      target.value, height, // 0x08, 0x09
      ...be16(numRecs),     // 0x0A–0x0B
      0x00, 0x00,           // 0x0C–0x0D reserved
    ];
    // Padding pour avoir 32 octets affichés (2 lignes de 16) — début du record stack
    const bytes = [...desc];
    while (bytes.length < 32) bytes.push(rand(0, 255));

    const rows = [
      { offset: '00000000', bytes: bytes.slice(0, 16) },
      { offset: '00000010', bytes: bytes.slice(16, 32) },
    ];
    const dumpHTML = renderHexDump(rows, [
      { from: 0x00, to: 0x03, color: '--dim',    label: 'fLink (UInt32 BE)' },
      { from: 0x04, to: 0x07, color: '--dim',    label: 'bLink (UInt32 BE)' },
      { from: 0x08, to: 0x08, color: '--gold',   label: 'kind (SInt8)' },
      { from: 0x09, to: 0x09, color: '--cyan',   label: 'height (UInt8)' },
      { from: 0x0A, to: 0x0B, color: '--green',  label: 'numRecords (UInt16 BE)' },
      { from: 0x0C, to: 0x0D, color: '--dim',    label: 'reserved' },
    ], { cols: 16, title: 'BTNodeDescriptor (14 octets, Big Endian) — Apple TN1150' });

    const correctExplain = `<strong>Bonne réponse.</strong> ${target.explain}<br><br>📌 height=<code>${height}</code>, numRecords=<code>${numRecs}</code> — cohérent avec un ${target.name.toLowerCase()}.`;
    const choices = KINDS.map(k => ({
      text: `<strong>0x${k.value.toString(16).toUpperCase().padStart(2,'0')}</strong> — ${k.name}`,
      correct: k.value === target.value,
      explain: k.value === target.value ? correctExplain
                                        : `Ce n'est pas un ${k.name.toLowerCase()}. ${k.explain}`,
    })).sort(() => Math.random() - 0.5);

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num">🌳</div>
        <div class="ex-title">B-Tree HFS+ — Identifier le type de nœud</div>
        <span class="ex-badge medium">medium</span>
      </div>
      <div class="ex-scenario">
        Tu analyses un nœud d'un fichier <strong>Catalog</strong> HFS+ (Apple TN1150).<br>
        Le <strong>BTNodeDescriptor</strong> (14 octets, Big Endian) entête chaque nœud du B-Tree.<br>
        <em style="color:var(--dim);font-size:.78rem">⚠ HFS+ est en Big Endian, contrairement à FAT/NTFS.</em>
      </div>
      ${dumpHTML}
      <div class="sec-title">Quel est le <code>kind</code> de ce nœud ?</div>
      <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="hbt-choices-0">
        ${choices.map((c, i) => `<button class="tp-choice"
          data-correct="${c.correct}"
          data-explain="${encData(c.explain)}"
          data-correct-explain="${encData(correctExplain)}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span><span>${c.text}</span></button>`).join('')}
      </div>
      <div class="ex-feedback" id="ex-feedback-hbt-0" style="display:none"></div>
      <button class="btn-next" id="btn-next-hbt-0" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    setTimeout(() => {
      div.querySelectorAll('#hbt-choices-0 .tp-choice').forEach(b => {
        b.addEventListener('click', () => {
          const isOk = b.dataset.correct === 'true';
          const explain = decData(b.dataset.explain) || '';
          const correctEx = decData(b.dataset.correctExplain) || '';
          div.querySelectorAll('#hbt-choices-0 .tp-choice').forEach(btn => { btn.disabled = true; });
          b.classList.add(isOk ? 'correct' : 'wrong');
          if (isOk) { if (!STATE.hintUsed) incSolved('hfsbtree'); }
          else {
            breakStreak();
            div.querySelectorAll('#hbt-choices-0 .tp-choice').forEach(btn => {
              if (btn.dataset.correct === 'true') btn.classList.add('correct');
              else if (btn !== b) btn.classList.add('dim');
            });
          }
          const fb = div.querySelector('#ex-feedback-hbt-0');
          fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
          fb.innerHTML = formatChoiceFeedback(isOk, correctEx, explain);
          fb.style.display = 'block';
          div.querySelector('#btn-next-hbt-0').style.display = 'inline-block';
        });
      });
    }, 0);
    return div;
  }

  // ─────────────────────────────────────────────────────────────
  // Sous-type 1 : Lire numRecords (numérique)
  // ─────────────────────────────────────────────────────────────
  if (subtype === 1) {
    const numRecs = rand(3, 47);     // valeurs réalistes pour un leaf node
    const fLink = rand(0x100, 0x7FF);
    const bLink = rand(0x100, 0x7FF);
    const desc = [
      ...be32(fLink),
      ...be32(bLink),
      0xFF,                  // kind = leaf
      0x01,                  // height = 1
      ...be16(numRecs),
      0x00, 0x00,
    ];
    const bytes = [...desc];
    while (bytes.length < 32) bytes.push(rand(0, 255));

    const rows = [
      { offset: '00000000', bytes: bytes.slice(0, 16) },
      { offset: '00000010', bytes: bytes.slice(16, 32) },
    ];
    const dumpHTML = renderHexDump(rows, [
      { from: 0x00, to: 0x03, color: '--dim',    label: 'fLink (UInt32 BE)' },
      { from: 0x04, to: 0x07, color: '--dim',    label: 'bLink (UInt32 BE)' },
      { from: 0x08, to: 0x08, color: '--gold',   label: 'kind = 0xFF (leaf)' },
      { from: 0x09, to: 0x09, color: '--cyan',   label: 'height = 1' },
      { from: 0x0A, to: 0x0B, color: '--green',  label: 'numRecords (UInt16 BE)' },
    ], { cols: 16, title: 'BTNodeDescriptor (Big Endian) — Leaf node Catalog HFS+' });

    const hi = (numRecs >>> 8) & 0xFF, lo = numRecs & 0xFF;
    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num">🌳</div>
        <div class="ex-title">B-Tree HFS+ — numRecords du nœud</div>
        <span class="ex-badge easy">easy</span>
      </div>
      <div class="ex-scenario">
        Voici un <strong>leaf node</strong> du Catalog HFS+. Combien d'enregistrements actifs contient-il ?<br>
        <em style="color:var(--dim);font-size:.78rem">numRecords = UInt16 <strong>Big Endian</strong> à offset <code>0x0A</code>.</em>
      </div>
      ${dumpHTML}
      <div class="ex-input-row" style="margin-top:.75rem">
        <span class="ex-input-label">numRecords =</span>
        <input class="ex-input" id="hbt-1-ans" type="number" placeholder="?" style="max-width:120px" min="0">
      </div>
      <div class="ex-input-row" style="margin-top:.5rem">
        <button class="btn-hint" id="hbt-1-h1">💡 Indice 1</button>
        <button class="btn-hint" id="hbt-1-h2" disabled style="opacity:.35">💡 Indice 2</button>
        <button class="btn-hint" id="hbt-1-h3" disabled style="opacity:.35">💡 Indice 3</button>
        <button class="btn-validate" id="hbt-1-val">Valider ✓</button>
        <button class="btn-next" id="btn-next-hbt-1" onclick="newExercise()" style="display:none">Exercice suivant →</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-hbt-1" style="display:none"></div>
    `;
    div.querySelector('#hbt-1-h1').addEventListener('click', () => showTPHint(div, 'hbt-1', 1,
      `Le BTNodeDescriptor fait 14 octets : 4 (fLink) + 4 (bLink) + 1 (kind) + 1 (height) + 2 (numRecords) + 2 (reserved). Cherche les 2 octets à <strong>l'offset 0x0A</strong>.`));
    div.querySelector('#hbt-1-h2').addEventListener('click', () => showTPHint(div, 'hbt-1', 2,
      `À l'offset 0x0A on lit : <span style="color:var(--green);font-weight:700">${hi.toString(16).toUpperCase().padStart(2,'0')} ${lo.toString(16).toUpperCase().padStart(2,'0')}</span>. HFS+ = Big Endian → octet de poids fort EN PREMIER.`));
    div.querySelector('#hbt-1-h3').addEventListener('click', () => showTPHint(div, 'hbt-1', 3,
      `BE : valeur = (0x${hi.toString(16).toUpperCase().padStart(2,'0')} × 256) + 0x${lo.toString(16).toUpperCase().padStart(2,'0')} = ${hi*256} + ${lo} = <strong>${numRecs}</strong>.`));
    div.querySelector('#hbt-1-val').addEventListener('click', () => {
      const v = parseInt(div.querySelector('#hbt-1-ans').value);
      if (isNaN(v)) return;
      const isOk = v === numRecs;
      const fb = div.querySelector('#ex-feedback-hbt-1');
      fb.style.display = 'block';
      fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
      if (isOk) {
        if (!STATE.hintUsed) incSolved('hfsbtree');
        fb.innerHTML = `✅ Correct ! numRecords = <strong>${numRecs}</strong> (0x${hi.toString(16).toUpperCase().padStart(2,'0')}${lo.toString(16).toUpperCase().padStart(2,'0')} BE). Ce leaf contient ${numRecs} entrées Catalog actives.`;
        div.className = 'ex-card solved';
      } else {
        breakStreak();
        fb.innerHTML = `❌ Attendu : <strong>${numRecs}</strong>. Bytes BE à 0x0A = <code>${hi.toString(16).toUpperCase().padStart(2,'0')} ${lo.toString(16).toUpperCase().padStart(2,'0')}</code> = ${hi*256}+${lo} = ${numRecs}.`;
      }
      div.querySelector('#btn-next-hbt-1').style.display = 'inline-block';
    });
    return div;
  }

  // ─────────────────────────────────────────────────────────────
  // Sous-type 2 : Décoder le parentID d'une HFSPlusCatalogKey
  // ─────────────────────────────────────────────────────────────
  if (subtype === 2) {
    // HFSPlusCatalogKey :
    //   0x00 keyLength   UInt16 BE  — taille du reste de la clé (sans inclure ces 2 octets)
    //   0x02 parentID    UInt32 BE  — CNID du dossier parent
    //   0x06 nodeName    HFSUniStr255 :
    //          0x06 length     UInt16 BE  — nb de chars UTF-16
    //          0x08 chars      UTF-16 BE  — 2 octets/char
    //
    // CNID typiques pour un user folder : 0x100+ (le CNID démarre à 16 et croît).
    // Quelques CNID réservés célèbres : 2=root, 3=Extents, 4=Catalog, 6=Allocation, 8=Attributes.
    const PARENT_PROFILES = [
      { cnid: 0x00000002, hint: 'racine du volume' },
      { cnid: rand(0x100, 0x9FFF), hint: 'dossier utilisateur' },
      { cnid: rand(0x10000, 0x9FFFF), hint: 'dossier d\'un volume bien rempli' },
    ];
    const profile = PARENT_PROFILES[rand(0, 2)];
    const parentID = profile.cnid;
    const parentHex = parentID.toString(16).toUpperCase().padStart(8, '0');

    // Nom court UTF-16 BE pour rester lisible
    const NAMES = ['Notes', 'Photos', 'report', 'data', 'cache', 'log', 'tmp', 'kex'];
    const name = NAMES[rand(0, NAMES.length - 1)];
    const nameLen = name.length;
    const nameBytes = [];
    for (const c of name) {
      const cc = c.charCodeAt(0);
      nameBytes.push((cc >>> 8) & 0xFF, cc & 0xFF); // UTF-16 BE
    }
    // keyLength = 4 (parentID) + 2 (nameLength) + nameLen*2 — sans les 2 octets de keyLength lui-même
    const keyLength = 4 + 2 + nameLen * 2;

    const keyBytes = [
      ...be16(keyLength),
      ...be32(parentID),
      ...be16(nameLen),
      ...nameBytes,
    ];
    // Pad à 32 octets pour affichage
    const bytes = [...keyBytes];
    while (bytes.length < 32) bytes.push(rand(0, 255));

    const rows = [
      { offset: '00000000', bytes: bytes.slice(0, 16) },
      { offset: '00000010', bytes: bytes.slice(16, 32) },
    ];
    const nameEnd = 0x08 + nameLen * 2 - 1;
    const dumpHTML = renderHexDump(rows, [
      { from: 0x00, to: 0x01, color: '--dim',   label: 'keyLength (UInt16 BE)' },
      { from: 0x02, to: 0x05, color: '--cyan',  label: 'parentID = CNID parent (UInt32 BE)' },
      { from: 0x06, to: 0x07, color: '--purple',label: 'nameLength en chars UTF-16 (UInt16 BE)' },
      { from: 0x08, to: nameEnd, color: '--green', label: 'nodeName en UTF-16 BE' },
    ], { cols: 16, title: 'HFSPlusCatalogKey (Big Endian) — clé d\'une entrée Catalog' });

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num">🌳</div>
        <div class="ex-title">B-Tree HFS+ — CNID parent dans une clé Catalog</div>
        <span class="ex-badge medium">medium</span>
      </div>
      <div class="ex-scenario">
        Tu as extrait une <strong>HFSPlusCatalogKey</strong> d'un nœud leaf du Catalog (Apple TN1150).<br>
        Le fichier nommé "<code>${name}</code>" est rangé dans un dossier dont le <strong>CNID parent</strong>
        est encodé à l'offset <code>0x02</code>.<br>
        <em style="color:var(--dim);font-size:.78rem">Toutes les valeurs sont en Big Endian.</em>
      </div>
      ${dumpHTML}
      <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.55rem .9rem;margin-bottom:.75rem;font-size:.78rem;color:var(--dim)">
        Structure : <code>[keyLength 2o][<span style="color:var(--cyan)">parentID 4o BE</span>][nameLength 2o][name UTF-16 BE]</code><br>
        CNID réservés : <code>2</code>=root · <code>3</code>=Extents · <code>4</code>=Catalog · <code>6</code>=Allocation · <code>8</code>=Attributes.
      </div>
      <div class="ex-input-row" style="margin-top:.5rem">
        <span class="ex-input-label">CNID parent (hex 8 chiffres, sans 0x) :</span>
        <input class="ex-input" id="hbt-2-ans" type="text" placeholder="00000000" style="max-width:160px;text-transform:uppercase" maxlength="10">
      </div>
      <div class="ex-input-row" style="margin-top:.5rem">
        <button class="btn-hint" id="hbt-2-h1">💡 Indice 1</button>
        <button class="btn-hint" id="hbt-2-h2" disabled style="opacity:.35">💡 Indice 2</button>
        <button class="btn-hint" id="hbt-2-h3" disabled style="opacity:.35">💡 Indice 3</button>
        <button class="btn-validate" id="hbt-2-val">Valider ✓</button>
        <button class="btn-next" id="btn-next-hbt-2" onclick="newExercise()" style="display:none">Exercice suivant →</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-hbt-2" style="display:none"></div>
    `;
    div.querySelector('#hbt-2-h1').addEventListener('click', () => showTPHint(div, 'hbt-2', 1,
      `Le parentID est l'<strong>UInt32 BE</strong> à l'offset <code>0x02</code> (juste après les 2 octets de keyLength). En BE, l'octet à 0x02 est l'octet de plus haut poids.`));
    div.querySelector('#hbt-2-h2').addEventListener('click', () => showTPHint(div, 'hbt-2', 2,
      `Lis les 4 octets <code>${bytes.slice(2,6).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code> en Big Endian = directement la valeur hex (pas d'inversion contrairement à NTFS).`));
    div.querySelector('#hbt-2-h3').addEventListener('click', () => showTPHint(div, 'hbt-2', 3,
      `Concatène les 4 octets BE → parentID = <code>0x${parentHex}</code> (= ${profile.hint}).`));
    div.querySelector('#hbt-2-val').addEventListener('click', () => {
      const raw = (div.querySelector('#hbt-2-ans').value || '').trim();
      if (!raw) return;
      const norm = normAns(raw);
      const isOk = norm === parentHex || norm === parentID.toString(16).toUpperCase();
      const fb = div.querySelector('#ex-feedback-hbt-2');
      fb.style.display = 'block';
      fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
      if (isOk) {
        if (!STATE.hintUsed) incSolved('hfsbtree');
        fb.innerHTML = `✅ Correct ! parentID = <strong>0x${parentHex}</strong> (${parentID}). Le fichier "${name}" est rangé sous ce CNID.`;
        div.className = 'ex-card solved';
      } else {
        breakStreak();
        fb.innerHTML = `❌ Attendu : <strong>0x${parentHex}</strong>. Octets BE à 0x02–0x05 : <code>${bytes.slice(2,6).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code>. En BE on concatène directement.`;
      }
      div.querySelector('#btn-next-hbt-2').style.display = 'inline-block';
    });
    return div;
  }

  // ─────────────────────────────────────────────────────────────
  // Sous-type 3 : Suivre fLink (numérique)
  // ─────────────────────────────────────────────────────────────
  if (subtype === 3) {
    const fLink = rand(0x100, 0x4FFF);  // numéro de nœud raisonnable
    const bLink = rand(0x100, 0x4FFF);
    const numRecs = rand(8, 30);

    const desc = [
      ...be32(fLink),
      ...be32(bLink),
      0xFF, 0x01,
      ...be16(numRecs),
      0x00, 0x00,
    ];
    const bytes = [...desc];
    while (bytes.length < 32) bytes.push(rand(0, 255));

    const rows = [
      { offset: '00000000', bytes: bytes.slice(0, 16) },
      { offset: '00000010', bytes: bytes.slice(16, 32) },
    ];
    const dumpHTML = renderHexDump(rows, [
      { from: 0x00, to: 0x03, color: '--cyan',  label: 'fLink — next leaf node (UInt32 BE)' },
      { from: 0x04, to: 0x07, color: '--dim',   label: 'bLink (UInt32 BE)' },
      { from: 0x08, to: 0x08, color: '--gold',  label: 'kind = 0xFF (leaf)' },
      { from: 0x09, to: 0x09, color: '--dim',   label: 'height = 1' },
      { from: 0x0A, to: 0x0B, color: '--dim',   label: 'numRecords (UInt16 BE)' },
    ], { cols: 16, title: 'BTNodeDescriptor (Big Endian) — Leaf node, lien chaîné' });

    const fLinkBytes = bytes.slice(0, 4).map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ');
    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num">🌳</div>
        <div class="ex-title">B-Tree HFS+ — Suivre fLink vers le leaf suivant</div>
        <span class="ex-badge medium">medium</span>
      </div>
      <div class="ex-scenario">
        Tu parcours les leaves du Catalog en suivant les liens chaînés <code>fLink</code> (forensique : permet
        de continuer même si l'arbre interne est corrompu).<br>
        <strong>fLink</strong> = numéro du <strong>prochain leaf au même niveau</strong>, UInt32 BE à offset <code>0x00</code>.
      </div>
      ${dumpHTML}
      <div class="ex-input-row" style="margin-top:.75rem">
        <span class="ex-input-label">Numéro du nœud suivant (décimal) :</span>
        <input class="ex-input" id="hbt-3-ans" type="number" placeholder="?" style="max-width:140px" min="0">
      </div>
      <div class="ex-input-row" style="margin-top:.5rem">
        <button class="btn-hint" id="hbt-3-h1">💡 Indice 1</button>
        <button class="btn-hint" id="hbt-3-h2" disabled style="opacity:.35">💡 Indice 2</button>
        <button class="btn-hint" id="hbt-3-h3" disabled style="opacity:.35">💡 Indice 3</button>
        <button class="btn-validate" id="hbt-3-val">Valider ✓</button>
        <button class="btn-next" id="btn-next-hbt-3" onclick="newExercise()" style="display:none">Exercice suivant →</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-hbt-3" style="display:none"></div>
    `;
    div.querySelector('#hbt-3-h1').addEventListener('click', () => showTPHint(div, 'hbt-3', 1,
      `<code>fLink</code> = 4 premiers octets du BTNodeDescriptor (offset 0x00–0x03), encodés en Big Endian.`));
    div.querySelector('#hbt-3-h2').addEventListener('click', () => showTPHint(div, 'hbt-3', 2,
      `Octets bruts à 0x00 : <span style="color:var(--cyan);font-weight:700">${fLinkBytes}</span>. En BE = octet de poids fort EN PREMIER.`));
    div.querySelector('#hbt-3-h3').addEventListener('click', () => showTPHint(div, 'hbt-3', 3,
      `Conversion BE : 0x${fLink.toString(16).toUpperCase().padStart(8,'0')} = <strong>${fLink}</strong> en décimal.`));
    div.querySelector('#hbt-3-val').addEventListener('click', () => {
      const v = parseInt(div.querySelector('#hbt-3-ans').value);
      if (isNaN(v)) return;
      const isOk = v === fLink;
      const fb = div.querySelector('#ex-feedback-hbt-3');
      fb.style.display = 'block';
      fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
      if (isOk) {
        if (!STATE.hintUsed) incSolved('hfsbtree');
        fb.innerHTML = `✅ Correct ! fLink = <strong>${fLink}</strong> (0x${fLink.toString(16).toUpperCase().padStart(8,'0')} BE). Le prochain leaf à parcourir porte ce numéro.`;
        div.className = 'ex-card solved';
      } else {
        breakStreak();
        fb.innerHTML = `❌ Attendu : <strong>${fLink}</strong> (0x${fLink.toString(16).toUpperCase().padStart(8,'0')}). Octets BE 0x00–0x03 : <code>${fLinkBytes}</code> → concaténer directement.`;
      }
      div.querySelector('#btn-next-hbt-3').style.display = 'inline-block';
    });
    return div;
  }

  // ─────────────────────────────────────────────────────────────
  // Sous-type 4 : QCM forensique — entrée résiduelle
  // ─────────────────────────────────────────────────────────────
  // 4 propositions sur "où / comment retrouver une entrée supprimée du Catalog HFS+ ?"
  // (cf. fiche hfs.html ligne 138 et 251)
  const FORENSIC_CHOICES = [
    { correct: true,
      label: 'Dans le slack des nœuds B-Tree libérés mais non réécrits, et dans les anciens nœuds non encore réalloués',
      explain: 'Quand HFS+ supprime une entrée, le nœud B-Tree qui la contenait est marqué libre dans le header node, mais ses octets ne sont pas écrasés tant que le nœud n\'est pas réalloué. Outils : <code>hfsinspect --btree catalog</code>, plugin HFS d\'Autopsy.' },
    { correct: false,
      label: 'Uniquement dans le journal Time Machine — sans Time Machine, l\'entrée est définitivement perdue',
      explain: 'Faux : Time Machine est un mécanisme de backup applicatif. Même sans TM, les nœuds B-Tree libérés conservent les octets de l\'entrée jusqu\'à réécriture du nœud. La récupération est possible directement sur le volume.' },
    { correct: false,
      label: 'Dans le bitmap d\'allocation ($Bitmap équivalent) qui mémorise la dernière entrée supprimée',
      explain: 'Faux : l\'Allocation File HFS+ (CNID 6) tracke uniquement l\'allocation des Allocation Blocks (1 bit/bloc). Il ne contient aucune métadonnée d\'entrée Catalog.' },
    { correct: false,
      label: 'Dans le Volume Header — il garde un ring buffer des 256 dernières entrées supprimées',
      explain: 'Faux : le Volume Header HFS+ (à offset 1024) contient des compteurs et pointeurs vers les fichiers spéciaux, mais aucun historique d\'entrées supprimées. Cette structure n\'existe pas dans le format.' },
  ];
  const correctIdx = 0;
  const correctExplainText = FORENSIC_CHOICES[correctIdx].explain;
  const shuffled = FORENSIC_CHOICES.map(c => ({
    text: c.label,
    correct: c.correct,
    explain: c.correct
      ? `<strong>Bonne réponse.</strong> ${c.explain}`
      : c.explain,
  })).sort(() => Math.random() - 0.5);
  const correctExplainShuffled = shuffled.find(c => c.correct).explain;

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">🌳</div>
      <div class="ex-title">B-Tree HFS+ — Récupération forensique d'entrée supprimée</div>
      <span class="ex-badge hard">hard</span>
    </div>
    <div class="ex-scenario">
      Un suspect a supprimé un fichier sur un volume HFS+ avant l'arrivée des enquêteurs.<br>
      Le volume est saisi <strong>quelques minutes plus tard</strong> (pas de réécriture significative).<br>
      <strong>Où chercher en priorité l'entrée Catalog effacée ?</strong>
    </div>
    <div class="sec-title">Choisir la bonne stratégie</div>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="hbt-choices-4">
      ${shuffled.map((c, i) => `<button class="tp-choice"
        data-correct="${c.correct}"
        data-explain="${encData(c.explain)}"
        data-correct-explain="${encData(correctExplainShuffled)}">
        <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span><span>${c.text}</span></button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-hbt-4" style="display:none"></div>
    <button class="btn-next" id="btn-next-hbt-4" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  setTimeout(() => {
    div.querySelectorAll('#hbt-choices-4 .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        const explain = decData(b.dataset.explain) || '';
        const correctEx = decData(b.dataset.correctExplain) || '';
        div.querySelectorAll('#hbt-choices-4 .tp-choice').forEach(btn => { btn.disabled = true; });
        b.classList.add(isOk ? 'correct' : 'wrong');
        if (isOk) { if (!STATE.hintUsed) incSolved('hfsbtree'); }
        else {
          breakStreak();
          div.querySelectorAll('#hbt-choices-4 .tp-choice').forEach(btn => {
            if (btn.dataset.correct === 'true') btn.classList.add('correct');
            else if (btn !== b) btn.classList.add('dim');
          });
        }
        const fb = div.querySelector('#ex-feedback-hbt-4');
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        fb.innerHTML = formatChoiceFeedback(isOk, correctEx, explain,
          'Cf. fiche HFS+ section « Récupération forensique » : les nœuds B-Tree libérés conservent leurs octets jusqu\'à réallocation.');
        fb.style.display = 'block';
        div.querySelector('#btn-next-hbt-4').style.display = 'inline-block';
      });
    });
  }, 0);
  return div;
}


// ═══════════════════════════════════════════════════════════════
// 29. NTFSINDEX — B+TREE NTFS ($INDEX_ROOT / $INDEX_ALLOCATION)
// ═══════════════════════════════════════════════════════════════
function genNTFSIndex() {
  const subtype = rand(0, 4);

  // ── Helpers Little Endian (NTFS = LE, contrairement à HFS+) ──
  const le16 = v => [v & 0xFF, (v >>> 8) & 0xFF];
  const le32 = v => [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF];
  const ascii = s => s.split('').map(c => c.charCodeAt(0));

  // ─────────────────────────────────────────────────────────────
  // Sous-type 0 : Reconnaître la signature INDX (QCM)
  // ─────────────────────────────────────────────────────────────
  if (subtype === 0) {
    // 4 signatures NTFS courantes :
    //   "INDX" 49 4E 44 58 — bloc Index Allocation (B+Tree de répertoire)
    //   "FILE" 46 49 4C 45 — entrée MFT
    //   "BAAD" 42 41 41 44 — entrée MFT corrompue (chkdsk)
    //   "RCRD" 52 43 52 44 — record du $LogFile
    const SIGS = [
      { magic: 'INDX', name: '$INDEX_ALLOCATION block (B+Tree de répertoire)',
        explain: '"INDX" (<code>49 4E 44 58</code>) marque le début d\'un bloc Index Allocation — un nœud du B+Tree d\'un répertoire NTFS. Suivi par UpdateSequenceArray, LSN, VCN, IndexHeader, puis les Index Entries.' },
      { magic: 'FILE', name: 'Entrée MFT (File Record)',
        explain: '"FILE" (<code>46 49 4C 45</code>) = entrée MFT standard de 1024 octets. Contient les attributs $STANDARD_INFORMATION, $FILE_NAME, $DATA, etc. Pas un nœud de B+Tree.' },
      { magic: 'BAAD', name: 'Entrée MFT marquée corrompue par chkdsk',
        explain: '"BAAD" (<code>42 41 41 44</code>) = ancienne entrée "FILE" que chkdsk a marquée comme corrompue lors d\'une vérification d\'intégrité. Forensiquement intéressant : les anciennes données peuvent encore y subsister.' },
      { magic: 'RCRD', name: 'Record du $LogFile',
        explain: '"RCRD" (<code>52 43 52 44</code>) = record du journal transactionnel $LogFile. Pas un B+Tree non plus, mais utile pour rejouer l\'historique récent.' },
    ];
    const target = SIGS[rand(0, 3)];
    const magicBytes = ascii(target.magic);
    // Padding aléatoire pour simuler un dump réaliste
    const bytes = [...magicBytes];
    while (bytes.length < 32) bytes.push(rand(0, 255));

    const rows = [
      { offset: '00000000', bytes: bytes.slice(0, 16) },
      { offset: '00000010', bytes: bytes.slice(16, 32) },
    ];
    const dumpHTML = renderHexDump(rows, [
      { from: 0x00, to: 0x03, color: '--gold', label: 'Magic / Signature (4 octets ASCII)' },
    ], { cols: 16, title: 'Premiers 32 octets d\'un secteur NTFS — quelle structure ?' });

    const correctExplain = `<strong>Bonne réponse.</strong> ${target.explain}`;
    const choices = SIGS.map(s => ({
      text: `<code>${s.magic}</code> — ${s.name}`,
      correct: s.magic === target.magic,
      explain: s.magic === target.magic ? correctExplain : s.explain,
    })).sort(() => Math.random() - 0.5);

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num">📇</div>
        <div class="ex-title">$INDEX NTFS — Reconnaître la signature</div>
        <span class="ex-badge easy">easy</span>
      </div>
      <div class="ex-scenario">
        Tu carves un volume NTFS et tombes sur ces 4 octets ASCII en début de secteur.<br>
        <strong>Quelle structure NTFS commence ainsi ?</strong>
      </div>
      ${dumpHTML}
      <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="ntx-choices-0">
        ${choices.map((c, i) => `<button class="tp-choice"
          data-correct="${c.correct}"
          data-explain="${encData(c.explain)}"
          data-correct-explain="${encData(correctExplain)}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span><span>${c.text}</span></button>`).join('')}
      </div>
      <div class="ex-feedback" id="ex-feedback-ntx-0" style="display:none"></div>
      <button class="btn-next" id="btn-next-ntx-0" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    setTimeout(() => {
      div.querySelectorAll('#ntx-choices-0 .tp-choice').forEach(b => {
        b.addEventListener('click', () => {
          const isOk = b.dataset.correct === 'true';
          const explain = decData(b.dataset.explain) || '';
          const correctEx = decData(b.dataset.correctExplain) || '';
          div.querySelectorAll('#ntx-choices-0 .tp-choice').forEach(btn => { btn.disabled = true; });
          b.classList.add(isOk ? 'correct' : 'wrong');
          if (isOk) { if (!STATE.hintUsed) incSolved('ntfsindex'); }
          else {
            breakStreak();
            div.querySelectorAll('#ntx-choices-0 .tp-choice').forEach(btn => {
              if (btn.dataset.correct === 'true') btn.classList.add('correct');
              else if (btn !== b) btn.classList.add('dim');
            });
          }
          const fb = div.querySelector('#ex-feedback-ntx-0');
          fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
          fb.innerHTML = formatChoiceFeedback(isOk, correctEx, explain);
          fb.style.display = 'block';
          div.querySelector('#btn-next-ntx-0').style.display = 'inline-block';
        });
      });
    }, 0);
    return div;
  }

  // ─────────────────────────────────────────────────────────────
  // Sous-type 1 : Décoder les flags d'une Index Entry (QCM)
  // ─────────────────────────────────────────────────────────────
  if (subtype === 1) {
    // Index Entry header (16 octets, LE) :
    //   0x00 MFTReference  — 6 octets numéro + 2 octets seq (UInt64 LE total)
    //   0x08 EntrySize     — UInt16 LE
    //   0x0A KeyLength     — UInt16 LE  (taille du $FILE_NAME qui suit)
    //   0x0C Flags         — UInt32 LE  (bit 0 = subnode présent, bit 1 = last entry)
    //   0x10 ...           — Key data ($FILE_NAME)
    //
    // Combinaisons réalistes :
    //   0x00 — entrée normale, pas de subnode, pas la dernière
    //   0x01 — entrée avec subnode (les 8 derniers octets sont la VCN du child)
    //   0x02 — last entry sentinelle (sans nom)
    //   0x03 — last entry avec subnode (très courant : la "fin" pointe vers la dernière branche)
    const FLAG_PROFILES = [
      { flags: 0x00, label: 'Aucun flag — entrée normale, dernière non, pas de sous-nœud',
        explain: 'flags = 0x00000000 → entrée standard avec un $FILE_NAME complet, et le B+Tree continue dans ce nœud (pas la sentinelle finale).' },
      { flags: 0x01, label: 'Bit 0 seulement — entrée pointe vers un sous-nœud (descendre dans le B+Tree)',
        explain: 'flags = 0x00000001 → bit 0 = sub-node présent : les 8 derniers octets de l\'entrée contiennent la VCN du nœud enfant à parcourir.' },
      { flags: 0x02, label: 'Bit 1 seulement — sentinelle de fin de nœud (sans clé valide)',
        explain: 'flags = 0x00000002 → bit 1 = last entry : sentinelle sans $FILE_NAME, marque la fin des entrées de ce nœud.' },
      { flags: 0x03, label: 'Bits 0 et 1 — sentinelle finale ET pointeur vers sous-nœud',
        explain: 'flags = 0x00000003 → bits 0+1 : c\'est la sentinelle finale du nœud, qui pointe en plus vers le dernier sous-nœud (cas très courant dans les B+Trees NTFS internes).' },
    ];
    const profile = FLAG_PROFILES[rand(0, 3)];
    const flags = profile.flags;
    const hasSub = (flags & 0x01) !== 0;

    // MFT ref pour habiller (cohérent avec la nature de l'entrée)
    const mftNum = (flags & 0x02) ? 0 : rand(20, 9999);  // sentinelle = mftNum 0
    const mftSeq = (flags & 0x02) ? 0 : rand(1, 5);
    const entrySize = hasSub ? 0x60 : 0x50;
    const keyLength = (flags & 0x02) ? 0 : 0x40;

    const bytes = [
      // 0x00–0x05 : record number LE 6 octets
      mftNum & 0xFF, (mftNum >>> 8) & 0xFF, (mftNum >>> 16) & 0xFF, 0, 0, 0,
      // 0x06–0x07 : seq LE 2 octets
      mftSeq & 0xFF, (mftSeq >>> 8) & 0xFF,
      // 0x08–0x09 : EntrySize LE
      ...le16(entrySize),
      // 0x0A–0x0B : KeyLength LE
      ...le16(keyLength),
      // 0x0C–0x0F : Flags LE
      ...le32(flags),
    ];
    while (bytes.length < 32) bytes.push(rand(0, 255));

    const rows = [
      { offset: '00000000', bytes: bytes.slice(0, 16) },
      { offset: '00000010', bytes: bytes.slice(16, 32) },
    ];
    const dumpHTML = renderHexDump(rows, [
      { from: 0x00, to: 0x07, color: '--dim',    label: 'MFT Reference (8 octets LE)' },
      { from: 0x08, to: 0x09, color: '--dim',    label: 'EntrySize (UInt16 LE)' },
      { from: 0x0A, to: 0x0B, color: '--dim',    label: 'KeyLength (UInt16 LE)' },
      { from: 0x0C, to: 0x0F, color: '--gold',   label: 'Flags (UInt32 LE)' },
    ], { cols: 16, title: 'Index Entry header (16 octets, Little Endian)' });

    const correctExplain = `<strong>Bonne réponse.</strong> ${profile.explain}`;
    const choices = FLAG_PROFILES.map(p => ({
      text: `<code>0x${p.flags.toString(16).toUpperCase().padStart(8,'0')}</code> — ${p.label}`,
      correct: p.flags === flags,
      explain: p.flags === flags ? correctExplain : p.explain,
    })).sort(() => Math.random() - 0.5);

    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num">📇</div>
        <div class="ex-title">$INDEX NTFS — Décoder les flags d'une Index Entry</div>
        <span class="ex-badge medium">medium</span>
      </div>
      <div class="ex-scenario">
        Voici l'en-tête (16 octets) d'une <strong>Index Entry</strong> dans un répertoire NTFS.<br>
        Les flags occupent 4 octets en <strong>Little Endian</strong> à l'offset <code>0x0C</code>.<br>
        <em style="color:var(--dim);font-size:.78rem">bit 0 (0x01) = sous-nœud présent · bit 1 (0x02) = sentinelle de fin de nœud</em>
      </div>
      ${dumpHTML}
      <div class="sec-title">Quelle est la signification de ces flags ?</div>
      <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="ntx-choices-1">
        ${choices.map((c, i) => `<button class="tp-choice"
          data-correct="${c.correct}"
          data-explain="${encData(c.explain)}"
          data-correct-explain="${encData(correctExplain)}">
          <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span><span>${c.text}</span></button>`).join('')}
      </div>
      <div class="ex-feedback" id="ex-feedback-ntx-1" style="display:none"></div>
      <button class="btn-next" id="btn-next-ntx-1" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
    `;
    setTimeout(() => {
      div.querySelectorAll('#ntx-choices-1 .tp-choice').forEach(b => {
        b.addEventListener('click', () => {
          const isOk = b.dataset.correct === 'true';
          const explain = decData(b.dataset.explain) || '';
          const correctEx = decData(b.dataset.correctExplain) || '';
          div.querySelectorAll('#ntx-choices-1 .tp-choice').forEach(btn => { btn.disabled = true; });
          b.classList.add(isOk ? 'correct' : 'wrong');
          if (isOk) { if (!STATE.hintUsed) incSolved('ntfsindex'); }
          else {
            breakStreak();
            div.querySelectorAll('#ntx-choices-1 .tp-choice').forEach(btn => {
              if (btn.dataset.correct === 'true') btn.classList.add('correct');
              else if (btn !== b) btn.classList.add('dim');
            });
          }
          const fb = div.querySelector('#ex-feedback-ntx-1');
          fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
          fb.innerHTML = formatChoiceFeedback(isOk, correctEx, explain);
          fb.style.display = 'block';
          div.querySelector('#btn-next-ntx-1').style.display = 'inline-block';
        });
      });
    }, 0);
    return div;
  }

  // ─────────────────────────────────────────────────────────────
  // Sous-type 2 : Lire la référence MFT (numérique)
  // ─────────────────────────────────────────────────────────────
  if (subtype === 2) {
    // MFT Reference = 8 octets LE :
    //   0x00–0x05 : record number (6 octets, LE → 48 bits, on reste sur 24 bits réalistes)
    //   0x06–0x07 : sequence number (2 octets LE)
    const mftNum = rand(50, 99999);   // numéro raisonnable
    const mftSeq = rand(1, 9);
    const entrySize = 0x58;
    const keyLength = 0x48;
    const flags = 0x00;

    const bytes = [
      mftNum & 0xFF, (mftNum >>> 8) & 0xFF, (mftNum >>> 16) & 0xFF, 0, 0, 0,
      mftSeq & 0xFF, (mftSeq >>> 8) & 0xFF,
      ...le16(entrySize),
      ...le16(keyLength),
      ...le32(flags),
    ];
    while (bytes.length < 32) bytes.push(rand(0, 255));

    const rows = [
      { offset: '00000000', bytes: bytes.slice(0, 16) },
      { offset: '00000010', bytes: bytes.slice(16, 32) },
    ];
    const dumpHTML = renderHexDump(rows, [
      { from: 0x00, to: 0x05, color: '--cyan',  label: 'Record number (6 octets LE)' },
      { from: 0x06, to: 0x07, color: '--purple',label: 'Sequence number (UInt16 LE)' },
      { from: 0x08, to: 0x09, color: '--dim',   label: 'EntrySize' },
      { from: 0x0A, to: 0x0B, color: '--dim',   label: 'KeyLength' },
      { from: 0x0C, to: 0x0F, color: '--dim',   label: 'Flags' },
    ], { cols: 16, title: 'Index Entry — MFT Reference (Little Endian)' });

    const recBytes = bytes.slice(0, 6).map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ');
    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num">📇</div>
        <div class="ex-title">$INDEX NTFS — Référence MFT pointée par l'entrée</div>
        <span class="ex-badge medium">medium</span>
      </div>
      <div class="ex-scenario">
        Cette Index Entry pointe vers une entrée MFT (le fichier listé dans le répertoire).<br>
        Les <strong>6 premiers octets</strong> à l'offset <code>0x00</code> sont le <strong>numéro d'enregistrement MFT</strong> en Little Endian.<br>
        <em style="color:var(--dim);font-size:.78rem">Les 2 octets suivants (0x06–0x07) sont le sequence number — pas demandé ici.</em>
      </div>
      ${dumpHTML}
      <div class="ex-input-row" style="margin-top:.75rem">
        <span class="ex-input-label">#MFT (décimal) :</span>
        <input class="ex-input" id="ntx-2-ans" type="number" placeholder="?" style="max-width:140px" min="0">
      </div>
      <div class="ex-input-row" style="margin-top:.5rem">
        <button class="btn-hint" id="ntx-2-h1">💡 Indice 1</button>
        <button class="btn-hint" id="ntx-2-h2" disabled style="opacity:.35">💡 Indice 2</button>
        <button class="btn-hint" id="ntx-2-h3" disabled style="opacity:.35">💡 Indice 3</button>
        <button class="btn-validate" id="ntx-2-val">Valider ✓</button>
        <button class="btn-next" id="btn-next-ntx-2" onclick="newExercise()" style="display:none">Exercice suivant →</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-ntx-2" style="display:none"></div>
    `;
    div.querySelector('#ntx-2-h1').addEventListener('click', () => showTPHint(div, 'ntx-2', 1,
      `Lis les 6 octets à <code>0x00–0x05</code>. NTFS = Little Endian → octet de poids faible EN PREMIER (inversion).`));
    div.querySelector('#ntx-2-h2').addEventListener('click', () => showTPHint(div, 'ntx-2', 2,
      `Octets bruts à 0x00 : <span style="color:var(--cyan);font-weight:700">${recBytes}</span>. Inverse l'ordre pour obtenir la valeur hex.`));
    div.querySelector('#ntx-2-h3').addEventListener('click', () => showTPHint(div, 'ntx-2', 3,
      `Bytes inversés (LE → BE pour lecture) : <code>${bytes.slice(0,6).slice().reverse().map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code> = 0x${mftNum.toString(16).toUpperCase().padStart(12,'0')} = <strong>${mftNum}</strong>.`));
    div.querySelector('#ntx-2-val').addEventListener('click', () => {
      const v = parseInt(div.querySelector('#ntx-2-ans').value);
      if (isNaN(v)) return;
      const isOk = v === mftNum;
      const fb = div.querySelector('#ex-feedback-ntx-2');
      fb.style.display = 'block';
      fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
      if (isOk) {
        if (!STATE.hintUsed) incSolved('ntfsindex');
        fb.innerHTML = `✅ Correct ! #MFT = <strong>${mftNum}</strong> (sequence number = ${mftSeq}). Cette entrée d'index pointe vers la file record n°${mftNum} de la $MFT.`;
        div.className = 'ex-card solved';
      } else {
        breakStreak();
        fb.innerHTML = `❌ Attendu : <strong>${mftNum}</strong>. Bytes LE 0x00–0x05 : <code>${recBytes}</code> → inverser → ${mftNum}.`;
      }
      div.querySelector('#btn-next-ntx-2').style.display = 'inline-block';
    });
    return div;
  }

  // ─────────────────────────────────────────────────────────────
  // Sous-type 3 : Décoder la VCN du sous-nœud (numérique hex)
  // ─────────────────────────────────────────────────────────────
  if (subtype === 3) {
    // Index Entry avec flag 0x01 (subnode) : les 8 derniers octets de l'entrée
    // contiennent la VCN du child node dans $INDEX_ALLOCATION (UInt64 LE).
    //
    // On affiche une entrée complète : header 16 o + key data (32 o) + VCN 8 o = 56 o
    const vcn = rand(0, 0xFFFFF);  // VCN raisonnable (volumes < ~256 To avec clusters 4Ko)
    const vcnHex = vcn.toString(16).toUpperCase().padStart(16, '0');
    const mftNum = rand(50, 9999);
    const mftSeq = rand(1, 5);
    const entrySize = 0x38;     // 56 octets
    const keyLength = 0x20;     // 32 octets de clé $FILE_NAME (simulée)
    const flags = 0x01;         // bit 0 = subnode

    const bytes = [
      // header 16 o
      mftNum & 0xFF, (mftNum >>> 8) & 0xFF, (mftNum >>> 16) & 0xFF, 0, 0, 0,
      mftSeq & 0xFF, (mftSeq >>> 8) & 0xFF,
      ...le16(entrySize),
      ...le16(keyLength),
      ...le32(flags),
      // key data (32 octets simulés — $FILE_NAME tronqué)
      ...Array(32).fill(0).map(() => rand(0, 255)),
      // VCN UInt64 LE (8 octets) = derniers de l'entrée
      vcn & 0xFF, (vcn >>> 8) & 0xFF, (vcn >>> 16) & 0xFF, (vcn >>> 24) & 0xFF,
      0, 0, 0, 0,
    ];

    const rows = [];
    for (let i = 0; i < 64; i += 16) {
      rows.push({ offset: i.toString(16).toUpperCase().padStart(8,'0'), bytes: bytes.slice(i, i+16) });
    }
    const vcnStart = 16 + keyLength;     // 0x30
    const vcnEnd = vcnStart + 7;         // 0x37
    const dumpHTML = renderHexDump(rows, [
      { from: 0x00, to: 0x07, color: '--dim',    label: 'MFT Reference' },
      { from: 0x08, to: 0x09, color: '--dim',    label: 'EntrySize = 0x38 (56)' },
      { from: 0x0A, to: 0x0B, color: '--dim',    label: 'KeyLength = 0x20 (32)' },
      { from: 0x0C, to: 0x0F, color: '--gold',   label: 'Flags = 0x01 (subnode)' },
      { from: 0x10, to: 0x2F, color: '--dim',    label: 'Key data ($FILE_NAME)' },
      { from: vcnStart, to: vcnEnd, color: '--cyan', label: 'VCN du sous-nœud (UInt64 LE) — 8 derniers octets' },
    ], { cols: 16, title: 'Index Entry avec sub-node — entrée complète 56 octets' });

    const vcnBytes = bytes.slice(vcnStart, vcnEnd + 1).map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(' ');
    const div = document.createElement('div');
    div.className = 'ex-card';
    div.innerHTML = `
      <div class="ex-header">
        <div class="ex-num">📇</div>
        <div class="ex-title">$INDEX NTFS — VCN du sous-nœud (descente B+Tree)</div>
        <span class="ex-badge hard">hard</span>
      </div>
      <div class="ex-scenario">
        Cette Index Entry a son <strong>flag 0x01</strong> activé : elle pointe vers un sous-nœud du B+Tree.<br>
        La <strong>VCN du child node</strong> (UInt64 LE) occupe <strong>les 8 derniers octets</strong> de l'entrée
        (offset <code>0x${vcnStart.toString(16).toUpperCase().padStart(2,'0')}–0x${vcnEnd.toString(16).toUpperCase().padStart(2,'0')}</code>).<br>
        <em style="color:var(--dim);font-size:.78rem">Cette VCN sert d'index dans <code>$INDEX_ALLOCATION</code> pour récupérer le bloc INDX enfant.</em>
      </div>
      ${dumpHTML}
      <div class="ex-input-row" style="margin-top:.75rem">
        <span class="ex-input-label">VCN (hex 16 chiffres, sans 0x) :</span>
        <input class="ex-input" id="ntx-3-ans" type="text" placeholder="0000000000000000" style="max-width:200px;text-transform:uppercase" maxlength="18">
      </div>
      <div class="ex-input-row" style="margin-top:.5rem">
        <button class="btn-hint" id="ntx-3-h1">💡 Indice 1</button>
        <button class="btn-hint" id="ntx-3-h2" disabled style="opacity:.35">💡 Indice 2</button>
        <button class="btn-hint" id="ntx-3-h3" disabled style="opacity:.35">💡 Indice 3</button>
        <button class="btn-validate" id="ntx-3-val">Valider ✓</button>
        <button class="btn-next" id="btn-next-ntx-3" onclick="newExercise()" style="display:none">Exercice suivant →</button>
      </div>
      <div class="ex-feedback" id="ex-feedback-ntx-3" style="display:none"></div>
    `;
    div.querySelector('#ntx-3-h1').addEventListener('click', () => showTPHint(div, 'ntx-3', 1,
      `EntrySize = 0x${entrySize.toString(16).toUpperCase()} (${entrySize} octets). La VCN occupe les <strong>8 derniers octets</strong> avant la prochaine entrée → offset 0x${vcnStart.toString(16).toUpperCase().padStart(2,'0')}.`));
    div.querySelector('#ntx-3-h2').addEventListener('click', () => showTPHint(div, 'ntx-3', 2,
      `Octets bruts à 0x${vcnStart.toString(16).toUpperCase().padStart(2,'0')} : <span style="color:var(--cyan);font-weight:700">${vcnBytes}</span>. Little Endian → inverser pour obtenir la valeur.`));
    div.querySelector('#ntx-3-h3').addEventListener('click', () => showTPHint(div, 'ntx-3', 3,
      `LE inversé = <code>${bytes.slice(vcnStart, vcnEnd+1).slice().reverse().map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')}</code> → VCN = <strong>0x${vcnHex}</strong>.`));
    div.querySelector('#ntx-3-val').addEventListener('click', () => {
      const raw = (div.querySelector('#ntx-3-ans').value || '').trim();
      if (!raw) return;
      const norm = normAns(raw);
      const isOk = norm === vcnHex || norm === vcn.toString(16).toUpperCase();
      const fb = div.querySelector('#ex-feedback-ntx-3');
      fb.style.display = 'block';
      fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
      if (isOk) {
        if (!STATE.hintUsed) incSolved('ntfsindex');
        fb.innerHTML = `✅ Correct ! VCN = <strong>0x${vcnHex}</strong> (${vcn} décimal). Pour suivre : aller chercher le bloc INDX à VCN ${vcn} dans <code>$INDEX_ALLOCATION</code>.`;
        div.className = 'ex-card solved';
      } else {
        breakStreak();
        fb.innerHTML = `❌ Attendu : <strong>0x${vcnHex}</strong>. Bytes LE : <code>${vcnBytes}</code> → inverser → 0x${vcnHex}.`;
      }
      div.querySelector('#btn-next-ntx-3').style.display = 'inline-block';
    });
    return div;
  }

  // ─────────────────────────────────────────────────────────────
  // Sous-type 4 : QCM — $INDEX_ROOT vs $INDEX_ALLOCATION
  // ─────────────────────────────────────────────────────────────
  // Présente un scénario : un répertoire avec N fichiers → quels attributs présents ?
  // Cas A : petit répertoire (~3 fichiers) → $INDEX_ROOT seul, résident
  // Cas B : gros répertoire (>20 fichiers) → $INDEX_ROOT + $INDEX_ALLOCATION + $BITMAP
  const SCENARIOS = [
    { fileCount: rand(2, 5), big: false,
      correct: '$INDEX_ROOT (0x90) résident uniquement',
      explain: 'Pour un petit répertoire, toutes les entrées tiennent dans le $INDEX_ROOT (0x90, toujours résident dans la MFT). Pas besoin de $INDEX_ALLOCATION ni de $BITMAP.' },
    { fileCount: rand(50, 500), big: true,
      correct: '$INDEX_ROOT (0x90) résident + $INDEX_ALLOCATION (0xA0) non-résident + $BITMAP (0xB0)',
      explain: 'Quand un répertoire dépasse la capacité du $INDEX_ROOT, NTFS bascule en B+Tree multi-nœuds : $INDEX_ROOT garde la racine, $INDEX_ALLOCATION (0xA0, toujours non-résident) stocke les blocs INDX via une runlist, et $BITMAP (0xB0) tracke quelles VCN sont allouées.' },
  ];
  const scenario = SCENARIOS[rand(0, 1)];

  const ATTR_CHOICES = [
    { key: 'small', label: '$INDEX_ROOT (0x90) résident uniquement' },
    { key: 'big',   label: '$INDEX_ROOT (0x90) résident + $INDEX_ALLOCATION (0xA0) non-résident + $BITMAP (0xB0)' },
    { key: 'res',   label: '$INDEX_ROOT (0x90) ET $INDEX_ALLOCATION (0xA0), tous deux résidents' },
    { key: 'alloc', label: '$INDEX_ALLOCATION (0xA0) seul, résident' },
  ];
  const correctKey = scenario.big ? 'big' : 'small';
  const wrongExplains = {
    res:   '$INDEX_ALLOCATION (0xA0) est <strong>toujours non-résident</strong> par définition NTFS — il contient les blocs INDX qui sont stockés via une runlist, jamais inline.',
    alloc: 'Un répertoire ne peut pas exister sans $INDEX_ROOT (0x90), qui contient au minimum la racine du B+Tree. Et 0xA0 ne peut jamais être résident.',
    small: 'Pour ' + scenario.fileCount + ' fichiers, $INDEX_ROOT seul suffit — on n\'a pas besoin de $INDEX_ALLOCATION tant que les entrées tiennent dans la MFT.',
    big:   'Pour seulement ' + scenario.fileCount + ' fichiers, tout tient dans $INDEX_ROOT. Pas besoin de bloc INDX externe ni de bitmap.',
  };
  const correctExplainScn = `<strong>Bonne réponse.</strong> ${scenario.explain}`;
  const choices = ATTR_CHOICES.map(c => ({
    text: c.label,
    correct: c.key === correctKey,
    explain: c.key === correctKey ? correctExplainScn : wrongExplains[c.key],
  })).sort(() => Math.random() - 0.5);

  const div = document.createElement('div');
  div.className = 'ex-card';
  div.innerHTML = `
    <div class="ex-header">
      <div class="ex-num">📇</div>
      <div class="ex-title">$INDEX NTFS — Résident ou non-résident ?</div>
      <span class="ex-badge medium">medium</span>
    </div>
    <div class="ex-scenario">
      Tu analyses la MFT entry d'un répertoire NTFS contenant <strong>${scenario.fileCount} fichiers</strong>.<br>
      <strong>Quels attributs $INDEX_* attendre dans cette entrée ?</strong>
    </div>
    <div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.6rem .9rem;margin-bottom:.75rem;font-size:.78rem;color:var(--dim);line-height:1.6">
      <strong style="color:var(--gold)">Rappel :</strong><br>
      · <code>0x90 = $INDEX_ROOT</code> — racine du B+Tree, <strong>toujours résident</strong>.<br>
      · <code>0xA0 = $INDEX_ALLOCATION</code> — blocs INDX, <strong>toujours non-résident</strong> (runlist vers Data Area).<br>
      · <code>0xB0 = $BITMAP</code> — quelles VCN de $INDEX_ALLOCATION sont allouées.
    </div>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="ntx-choices-4">
      ${choices.map((c, i) => `<button class="tp-choice"
        data-correct="${c.correct}"
        data-explain="${encData(c.explain)}"
        data-correct-explain="${encData(correctExplainScn)}">
        <span class="tp-choice-letter">${String.fromCharCode(65+i)}</span><span>${c.text}</span></button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-ntx-4" style="display:none"></div>
    <button class="btn-next" id="btn-next-ntx-4" onclick="newExercise()" style="display:none;margin-top:.5rem">Exercice suivant →</button>
  `;
  setTimeout(() => {
    div.querySelectorAll('#ntx-choices-4 .tp-choice').forEach(b => {
      b.addEventListener('click', () => {
        const isOk = b.dataset.correct === 'true';
        const explain = decData(b.dataset.explain) || '';
        const correctEx = decData(b.dataset.correctExplain) || '';
        div.querySelectorAll('#ntx-choices-4 .tp-choice').forEach(btn => { btn.disabled = true; });
        b.classList.add(isOk ? 'correct' : 'wrong');
        if (isOk) { if (!STATE.hintUsed) incSolved('ntfsindex'); }
        else {
          breakStreak();
          div.querySelectorAll('#ntx-choices-4 .tp-choice').forEach(btn => {
            if (btn.dataset.correct === 'true') btn.classList.add('correct');
            else if (btn !== b) btn.classList.add('dim');
          });
        }
        const fb = div.querySelector('#ex-feedback-ntx-4');
        fb.className = 'ex-feedback ' + (isOk ? 'correct' : 'wrong');
        fb.innerHTML = formatChoiceFeedback(isOk, correctEx, explain,
          'Forensique : un répertoire qui passe de petit→gros peut laisser des fragments d\'entrées dans l\'ancien $INDEX_ROOT (cf. fiche NTFS § B-Tree).');
        fb.style.display = 'block';
        div.querySelector('#btn-next-ntx-4').style.display = 'inline-block';
      });
    });
  }, 0);
  return div;
}


// ───────────────────────────────────────────────────────────────
// Enregistrement dans le dispatcher GENERATORS (créé par tp-engine.js)
// ───────────────────────────────────────────────────────────────
if (typeof GENERATORS !== 'undefined') {
  GENERATORS.hfsbtree  = genHFSBTree;
  GENERATORS.ntfsindex = genNTFSIndex;
}
