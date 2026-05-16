// ═══════════════════════════════════════════════════════════════
// tp-engine-fat.js — Exercices "FAT family" (5 catégories)
//
// Module séparé de tp-engine.js pour faciliter la maintenance (PR 4.1
// du plan Phase 4). Doit être chargé APRÈS tp-engine.js (dépendances :
// STATE, GENERATORS, rand, pad, esc, escAttr, hexRow, encData, decData,
// showTPHint, markHintUsed, breakStreak, incSolved, renderHexDump,
// formatChoiceFeedback).
//
// Le dispatcher GENERATORS est patché en fin de fichier pour enregistrer
// les 5 générateurs.
//
// ─── Catégories couvertes ──────────────────────────────────────
//   • fat         (⛓ « Chaîne FAT »)         — parcourir les entrées
//   • bitmap      (🗺 « Bitmap exFAT/FAT »)   — lecture bitmap allocation
//   • effacement  (🗑 « Effacement FAT »)     — entrées 0xE5 supprimées
//   • slackspace  (🪣 « Slack Space »)        — file/RAM slack, calculs
//   • direntry    (📁 « Directory Entry FAT ») — entrée 32 octets décodée
// ═══════════════════════════════════════════════════════════════

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

// ─── v2.23 : carving exercises (genMagic, checkMagic, genMismatch,
// buildMismatchChoices, checkMismatch, _magicNotes, _mismatchAnswered)
// extraits vers tp/tp-engine-carving.js (chargé après ce fichier).

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  newExercise();
});



// ═══════════════════════════════════════════════════

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

    div.querySelector('#ss-h1').addEventListener('click', () => showTPHint(div, 'ss', 1, hints[0]));
    div.querySelector('#ss-h2').addEventListener('click', () => showTPHint(div, 'ss', 2, hints[1]));
    div.querySelector('#ss-h3').addEventListener('click', () => showTPHint(div, 'ss', 3, hints[2]));

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

    div.querySelector('#ss-h1').addEventListener('click', () => showTPHint(div, 'ss', 1, hints[0]));
    div.querySelector('#ss-h2').addEventListener('click', () => showTPHint(div, 'ss', 2, hints[1]));
    div.querySelector('#ss-h3').addEventListener('click', () => showTPHint(div, 'ss', 3, hints[2]));

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

    div.querySelector('#ss-h1').addEventListener('click', () => showTPHint(div, 'ss', 1, hints[0]));
    div.querySelector('#ss-h2').addEventListener('click', () => showTPHint(div, 'ss', 2, hints[1]));
    div.querySelector('#ss-h3').addEventListener('click', () => showTPHint(div, 'ss', 3, hints[2]));

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

    div.querySelector('#ss-h1').addEventListener('click', () => showTPHint(div, 'ss', 1, hints[0]));
    div.querySelector('#ss-h2').addEventListener('click', () => showTPHint(div, 'ss', 2, hints[1]));
    div.querySelector('#ss-h3').addEventListener('click', () => showTPHint(div, 'ss', 3, hints[2]));

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
// Enregistrement dans le dispatcher GENERATORS
// (s'exécute au load du script, après tp-engine.js qui a déclaré
// la constante GENERATORS = {...})
// ═══════════════════════════════════════════════════════════════
if (typeof GENERATORS !== 'undefined') {
  GENERATORS.fat        = genFAT;
  GENERATORS.bitmap     = genBitmap;
  GENERATORS.effacement = genEffacement;
  GENERATORS.slackspace = genSlackSpace;
  GENERATORS.direntry   = genDirEntry;
}
