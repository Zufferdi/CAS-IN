// ═══════════════════════════════════════════════════════════════
// tp-engine-carving.js — Exercices "carving" (signatures de fichiers)
//
// Module séparé de tp-engine.js pour faciliter la maintenance.
// Doit être chargé APRÈS tp-engine.js (dépendances : showTPHint,
// breakStreak, incSolved, formatChoiceFeedback, rand, pad, escAttr,
// encData, decData, GENERATORS, MAGIC_DB, MISMATCH_DB, STATE).
//
// Le dispatcher GENERATORS est patché ici pour enregistrer les 2 générateurs.
//
// Exercices couverts :
//   • genMagic / checkMagic       — Identification par signature hexadécimale
//                                    (1 fichier, 4 choix)
//   • genMismatch / checkMismatch — Détection extension trompeuse vs vraie
//                                    signature (5 fichiers, 4 choix chacun)
//
// v1.0 — 2026-05-02 (split de tp-engine.js v2.22)
// ═══════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════
// 5. MAGIC BYTES — IDENTIFICATION PAR SIGNATURE
// ═══════════════════════════════════════════════════
// [MAGIC_DB chargé depuis tp-data.js]

// Notes des choix proposés (stocké pour checkMagic)
let _magicNotes = [];

function genMagic() {
  const entry = MAGIC_DB[rand(0, MAGIC_DB.length - 1)];
  const sigBytes = entry.sig.split(' ');

  // Add decoy bytes after the signature
  const fullBytes = [...sigBytes];
  while (fullBytes.length < 12) fullBytes.push(pad(rand(0, 255).toString(16).toUpperCase(), 2));

  // Bug fix : filtrer par SIGNATURE (et non par ext) — sinon zip et docx
  // peuvent apparaître ensemble alors qu'ils partagent 50 4B 03 04, et la
  // « bonne » réponse devient ambiguë. On exclut tout ce qui partage le préfixe.
  const decoys = MAGIC_DB
    .filter(e => e.sig !== entry.sig && !e.sig.startsWith(entry.sig) && !entry.sig.startsWith(e.sig))
    .sort(() => Math.random() - .5)
    .slice(0, 3);
  const options = [entry, ...decoys].sort(() => Math.random() - .5);

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
      ${fullBytes.map((b, i) => `<span class="hex-byte ${i < sigBytes.length ? 'highlight' : 'dim-byte'}" title="${i < sigBytes.length ? 'Octet de signature' : 'Données'}">
        ${b}</span>`).join('')}
    </div>
    <div style="font-size:.72rem;color:var(--dim);margin-bottom:.75rem">
      <span style="color:var(--gold)">■</span> = octets de signature · <span style="color:var(--dim)">■</span> = données (ignorées pour l'identification)
    </div>

    <div class="sec-title">Quel est ce type de fichier ?</div>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.75rem" id="magic-choices">
      ${options.map((o, i) => `
        <button class="tp-choice" onclick="checkMagic(${i}, ${options.indexOf(entry)}, this)">
          <span class="tp-choice-letter">${String.fromCharCode(65 + i)}</span>
          <span><strong style="color:var(--cyan)">.${o.ext}</strong> — ${o.desc}</span>
        </button>`).join('')}
    </div>
    <div class="ex-feedback" id="ex-feedback-mg"></div>
    <button class="btn-next" id="btn-next-mg" onclick="newExercise()" style="margin-top:.5rem">Exercice suivant →</button>
  `;
  _magicNotes = options.map(o => o.note);
  return div;
}

function checkMagic(chosen, correct, btn) {
  const choices = document.querySelectorAll('#magic-choices button');
  if (choices.length && choices[0].disabled) return;
  choices.forEach((b, i) => {
    b.disabled = true;
    if (i === correct) {
      b.style.borderColor = 'var(--green)';
      b.style.background = 'rgba(48,232,138,.1)';
    } else if (i === chosen && chosen !== correct) {
      b.style.borderColor = 'var(--red)';
      b.style.background = 'rgba(255,64,96,.08)';
    }
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
// 6. SIGNATURE MISMATCH — DÉTECTION EXTENSION TROMPEUSE
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
      .${escAttr(opt.replace(/\//g, ' / '))}
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
    // Compter précisément les rangées résolues correctement
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
// Patch du dispatcher GENERATORS
// ═══════════════════════════════════════════════════
// tp-engine.js définit GENERATORS comme const, on le mute en place.

if (typeof GENERATORS !== 'undefined') {
  GENERATORS.magic    = genMagic;
  GENERATORS.mismatch = genMismatch;
}
