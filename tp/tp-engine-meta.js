// ═══════════════════════════════════════════════════════════════
// tp-engine-meta.js — Exercices "soft" (droit, glossaire, IR, email, network)
//
// Module séparé de tp-engine.js. Doit être chargé APRÈS tp-engine.js
// (dépendances : showTPHint, breakStreak, incSolved, formatChoiceFeedback,
// rand, pad, GENERATORS, et les datasets DROIT_*, GLOSSAIRE_*, EMAIL_*,
// IR_*, NETWORK_* définis dans tp-data.js).
//
// Le dispatcher GENERATORS est patché ici pour enregistrer les 5 générateurs.
// ═══════════════════════════════════════════════════════════════

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

// ───────────────────────────────────────────────────────────────
// Enregistrement dans le dispatcher GENERATORS
// ───────────────────────────────────────────────────────────────
if (typeof GENERATORS !== 'undefined') {
  GENERATORS.droitpenal = genDroitPenal;
  GENERATORS.glossaire  = genGlossaire;
  GENERATORS.email      = genEmail;
  GENERATORS.ir         = genIR;
  GENERATORS.network    = genNetwork;
}
