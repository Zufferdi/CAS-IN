// ═══════════════════════════════════════════════════════════════
// exam-app.js — Mode examen blanc CAS-IN
//
// Extrait de exam.html v3.0 → fichier séparé pour :
//   • Cache navigateur séparé du HTML
//   • Versioning indépendant via le Service Worker
//   • Lisibilité (le HTML descend de 945 → ~333 lignes)
//
// Bit-pour-bit identique au bloc <script> original.
// Toutes les fonctions appelées par onclick (startExam, nextQ,
// toggleFlag, togglePause, revNav, restartExam, etc.) restent
// globales (window.*).
//
// Fonctionnalités :
//   • Tirage de questions chronométrées (mode certif simulé)
//   • Calcul de score, pourcentage, seuil de passage
//   • Drapeau de question pour révision
//   • Pause/reprise + minuteur global
//   • Historique des examens passés (persisté localStorage)
//   • Mode révision sur l'examen précédent
//   • Raccourcis clavier (1-5 pour réponse, F pour flag, etc.)
// ═══════════════════════════════════════════════════════════════


// ── Raccourcis clavier ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  // Pendant l'examen
  if (document.getElementById('s-exam').classList.contains('on')) {
    // 1-5 : sélectionner une réponse
    if (e.key >= '1' && e.key <= '5') {
      const idx = parseInt(e.key) - 1;
      const btns = document.querySelectorAll('.ans-btn:not(:disabled)');
      if (btns[idx]) btns[idx].click();
    }
    // Espace/Entrée : suivant ou passer
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const nextBtn = document.getElementById('next-btn');
      const skipBtn = document.getElementById('skip-btn');
      if (nextBtn.style.display !== 'none') nextBtn.click();
      else skipBtn.click();
    }
    // Escape : pause
    if (e.key === 'Escape') { e.preventDefault(); togglePause(); }
    // F : flag
    if (e.key === 'f' || e.key === 'F') toggleFlag();
  }
  // Pendant la pause
  if (document.getElementById('pause-overlay').classList.contains('on')) {
    if (e.key === 'Escape') togglePause();
  }
});

// ── Module map ───────────────────────────────────────────────
const MOD_MAP = {
  '01':['legal','droit','loi','cpp','lscpt','nlpd','eimp','tor','darkweb','preuve'],
  '02':['methodologie','acquisition','rapport','ir','incident','ram','format','magic','mac','timeline','premier'],
  '03':['fat','ntfs','ext','hfs','apfs','exfat','refs','f2fs','filesys','systeme','fichier','cluster','mft','inode'],
  '04':['windows','registre','shellbag','prefetch','amcache','shimcache','evtx','log','usb','wsl','volatility','active_directory'],
  '05':['macos','linux','mobile','cloud','disque','encodage','iot','vm','vehicule','virtualisation'],
  '06':['reseau','wireshark','pcap','email','messagerie','dns','siem','sigma','splunk','tcp','smtp'],
  '07':['crypto','pki','certificat','chiffrement','hash','malware','ransomware','bitcoin','steganographie','cassage','bitlocker'],
  '08':['osint','autopsy','zimmerman','browser','sqlite','kape','velociraptor','xways','winhex']
};
const MOD_LABELS = {
  '01':'⚖️ Cadre Légal','02':'📥 Méthodologie','03':'💾 Systèmes de Fichiers',
  '04':'🪟 Windows','05':'💻 Autres Systèmes','06':'📡 Réseaux',
  '07':'🔐 Cryptologie','08':'🛠 Outils DFIR'
};
const MOD_COLORS = {
  '01':'#00e5cc','02':'#4f8ef7','03':'#f0c040','04':'#30e88a',
  '05':'#a78bfa','06':'#ff4060','07':'#fb923c','08':'#8b949e'
};

// ── State ─────────────────────────────────────────────────────

// ── Sanitisation XSS ─────────────────────────────────────────
function escHtml(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

let allQ = [], examQ = [], cur = 0, answered = [], flagged = new Set();
let examFinished = false;
let timerSec = 0, timerElapsed = 0, timerInterval = null, paused = false;
let cfg = { dur: 30, nq: 20, mods: ['all'] };

// ── Config UI ─────────────────────────────────────────────────
document.querySelectorAll('#dur-opts .cfg-opt').forEach(el => {
  el.onclick = () => { document.querySelectorAll('#dur-opts .cfg-opt').forEach(e=>e.classList.remove('on')); el.classList.add('on'); cfg.dur = +el.dataset.dur; };
});
document.querySelectorAll('#nq-opts .cfg-opt').forEach(el => {
  el.onclick = () => { document.querySelectorAll('#nq-opts .cfg-opt').forEach(e=>e.classList.remove('on')); el.classList.add('on'); cfg.nq = +el.dataset.nq; };
});
document.querySelectorAll('#mod-opts .cfg-mod').forEach(el => {
  el.onclick = () => {
    const m = el.dataset.mod;
    if (m === 'all') {
      document.querySelectorAll('#mod-opts .cfg-mod').forEach(e=>e.classList.remove('on'));
      el.classList.add('on'); cfg.mods = ['all'];
    } else {
      document.querySelector('[data-mod="all"]').classList.remove('on');
      el.classList.toggle('on');
      cfg.mods = [...document.querySelectorAll('#mod-opts .cfg-mod.on')].map(e=>e.dataset.mod).filter(x=>x!=='all');
      if (!cfg.mods.length) { document.querySelector('[data-mod="all"]').classList.add('on'); cfg.mods=['all']; }
    }
    const sc = document.getElementById('mod-sel-count');
    sc.textContent = cfg.mods[0]==='all' ? 'Tous' : cfg.mods.length + ' sélectionnés';
  };
});

// ── Guess module from question ────────────────────────────────
function guessModule(q) {
  const txt = ((q.question||'')+(q.category||'')+(q.tags||[]).join(' ')+(q.module||'')).toLowerCase();
  for (const [mod, kws] of Object.entries(MOD_MAP)) {
    if (kws.some(k => txt.includes(k))) return mod;
  }
  return '??';
}

// ── Start exam ────────────────────────────────────────────────
async function startExam() {
  // Lire le timer personnalisé si l'option "custom" est sélectionnée
  const activeDur = document.querySelector('#dur-opts .cfg-opt.on');
  if (activeDur && activeDur.dataset.dur === 'custom') {
    const v = parseInt(document.getElementById('dur-custom')?.value || '45');
    cfg.dur = Math.max(5, Math.min(300, v || 45));
  }
  document.getElementById('start-btn').disabled = true;
  document.getElementById('start-btn').textContent = 'Chargement…';
  try {
    const r = await fetch('questions.json');
    if (!r.ok) throw new Error('HTTP '+r.status);
    const data = await r.json();
    allQ = Array.isArray(data) ? data : (data.questions || data.items || []);
    if (!allQ.length) throw new Error('vide');
  } catch(e) {
    showScreen('s-err'); return;
  }

  // Normalize questions — compatible questions.json (format CAS-IN v2)
  // Format v2 : q.q, q.opts[], q.answers=[idx], q.expl_ok/ko, q.theme, q.diff
  // Format legacy : q.question, q.answers[]=textes, q.correct=idx, q.explanation
  allQ = allQ.map(q => {
    // Détecter le format v2 CAS-IN : q.opts existe ET q.answers est un tableau d'indices
    const isV2 = Array.isArray(q.opts) && q.opts.length >= 2
                 && Array.isArray(q.answers) && typeof q.answers[0] === 'number';

    const question  = q.question || q.q || q.text || '';
    const answers   = isV2 ? q.opts : (q.answers || q.options || q.choices || []);
    const correct   = isV2 ? q.answers[0]
                           : (typeof q.correct === 'number' ? q.correct : (q.correctIndex ?? 0));
    // Explication : quand bonne réponse → expl_ok, sinon expl_ko
    const explanation = q.explanation || q.explication || q.expl_ok || '';

    // Mapping thème CAS-IN → module exam (01-08)
    const THEME_TO_MOD = {
      'Droit':                '01',
      'Acquisition et analyse':'02',
      'FORENSIQUE':           '02',
      'Système de fichiers':  '03',
      'Spécificité des OS':   '04',
      'Informatique de base': '05',
      'RÉSEAUX':              '06',
      'Cryptologie':          '07',
      'OSINT':                '08',
      'OUTILS':               '08',
    };
    const module = q.module || THEME_TO_MOD[q.theme] || guessModule(q);

    return { question, answers, correct, explanation,
             category: q.category || q.theme || q.module || '',
             module,
             diff: q.diff || 'medium' };
  }).filter(q => q.question && q.answers.length >= 2);

  // Filter by selected modules
  let pool = allQ;
  if (cfg.mods[0] !== 'all') {
    pool = allQ.filter(q => cfg.mods.includes(q.module));
    if (pool.length < 5) pool = allQ; // fallback
  }

  // Sampling proportionnel par module + complétion jusqu'à cfg.nq
  const modGroups = {};
  pool.forEach(q => { const m = q.module||'??'; if(!modGroups[m]) modGroups[m]=[]; modGroups[m].push(q); });
  const mods = Object.keys(modGroups);
  const perMod = Math.max(1, Math.floor(cfg.nq / mods.length));
  examQ = [];
  mods.forEach(m => {
    const arr = [...modGroups[m]].sort(() => Math.random()-.5);
    examQ.push(...arr.slice(0, perMod));
  });
  // Fisher-Yates shuffle
  for (let i=examQ.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[examQ[i],examQ[j]]=[examQ[j],examQ[i]];}
  examQ = examQ.slice(0, cfg.nq);
  // Compléter jusqu'à cfg.nq si déficit
  if (examQ.length < cfg.nq) {
    const used = new Set(examQ);
    const extra = pool.filter(q=>!used.has(q)).sort(()=>Math.random()-.5);
    examQ.push(...extra.slice(0, cfg.nq - examQ.length));
    for (let i=examQ.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[examQ[i],examQ[j]]=[examQ[j],examQ[i]];}
  }

  answered = new Array(examQ.length).fill(null);
  flagged.clear();
  cur = 0;
  timerSec = cfg.dur * 60;
  timerElapsed = 0;

  showScreen('s-exam');
  renderQ();
  startTimer();
}

// ── Timer ─────────────────────────────────────────────────────
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (paused) return;
    timerSec--;
    timerElapsed++;
    updateTimer();
    if (timerSec <= 0) { clearInterval(timerInterval); finishExam(); }
  }, 1000);
  updateTimer();
}

function updateTimer() {
  const m = Math.floor(timerSec/60), s = timerSec%60;
  const el = document.getElementById('timer');
  el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  const pct = timerSec / (cfg.dur*60) * 100;
  el.classList.toggle('warn', pct <= 25 && pct > 10);
  el.classList.toggle('crit', pct <= 10);
}

function togglePause() {
  paused = !paused;
  document.getElementById('pause-overlay').classList.toggle('on', paused);
}
function quitExam() { clearInterval(timerInterval); showScreen('s-cfg'); document.getElementById('start-btn').disabled=false; document.getElementById('start-btn').textContent='▶ Démarrer l\'examen blanc'; }

// ── Render question ───────────────────────────────────────────
function renderQ() {
  if (cur >= examQ.length) { finishExam(); return; }
  const q = examQ[cur];
  const mod = q.module || '??';

  // Module badge
  const badge = document.getElementById('mod-badge');
  badge.textContent = MOD_LABELS[mod] || ('Module '+mod);
  badge.style.background = (MOD_COLORS[mod]||'#8b949e')+'18';
  badge.style.color = MOD_COLORS[mod]||'#8b949e';
  badge.style.border = '1px solid '+(MOD_COLORS[mod]||'#8b949e')+'40';

  document.getElementById('question-text').textContent = q.question;
  document.getElementById('qnum').textContent = (cur+1)+'/'+examQ.length;
  document.getElementById('prog-fill').style.width = ((cur+1)/examQ.length*100)+'%';
  document.getElementById('flag-btn').classList.toggle('on', flagged.has(cur));

  const exEl = document.getElementById('explanation');
  exEl.classList.remove('on'); exEl.textContent='';

  const cont = document.getElementById('answers');
  cont.innerHTML = '';
  const letters = ['A','B','C','D','E'];
  q.answers.forEach((a, i) => {
    const btn = document.createElement('button');
    btn.className = 'ans-btn';
    btn.innerHTML = `<span class="ans-letter">${letters[i]}</span><span class="ans-text">${a}</span>`;
    btn.onclick = () => answer(i);
    if (answered[cur] !== null) {
      btn.disabled = true;
      if (i === q.correct) btn.classList.add('correct');
      if (i === answered[cur] && answered[cur] !== q.correct) btn.classList.add('wrong');
    }
    cont.appendChild(btn);
  });

  const skipBtn = document.getElementById('skip-btn');
  const nextBtn = document.getElementById('next-btn');
  if (answered[cur] !== null) { skipBtn.style.display='none'; nextBtn.style.display=''; } 
  else { skipBtn.style.display=''; nextBtn.style.display='none'; }

  if (answered[cur] !== null && q.explanation) {
    exEl.textContent = '💡 ' + q.explanation;
    exEl.classList.add('on');
  }
}

function answer(i) {
  const q = examQ[cur];
  answered[cur] = i;
  renderQ();
}

function toggleFlag() { flagged.has(cur) ? flagged.delete(cur) : flagged.add(cur); document.getElementById('flag-btn').classList.toggle('on', flagged.has(cur)); }

function nextQ(skip) {
  if (skip) answered[cur] = -1;
  cur++;
  if (cur >= examQ.length) finishExam();
  else renderQ();
}

// ── Finish ────────────────────────────────────────────────────
function finishExam() {
  if (examFinished) return;
  examFinished = true;
  clearInterval(timerInterval);
  const correct = answered.filter((a,i) => a === examQ[i].correct).length;
  const wrong = answered.filter((a,i) => a !== null && a !== -1 && a !== examQ[i].correct).length;
  const skipped = answered.filter(a => a === null || a === -1).length;
  const total = examQ.length;
  if (!total) { showScreen('s-cfg'); return; } // guard division par zéro
  const pct = Math.round(correct/total*100);

  document.getElementById('res-score').textContent = pct+'%';
  const grade = document.getElementById('res-grade');
  if (pct >= 75) { grade.textContent='✓ RÉUSSI'; grade.className='res-grade grade-pass'; }
  else if (pct >= 60) { grade.textContent='~ MOYEN — Révision recommandée'; grade.className='res-grade grade-ok'; }
  else { grade.textContent='✗ INSUFFISANT — Révision nécessaire'; grade.className='res-grade grade-fail'; }

  document.getElementById('rs-correct').textContent = correct;
  document.getElementById('rs-wrong').textContent = wrong;
  document.getElementById('rs-skipped').textContent = skipped;
  const min = Math.floor(timerElapsed/60), sec = timerElapsed%60;
  document.getElementById('rs-time').textContent = min+'m'+String(sec).padStart(2,'0');

  // Per-module stats
  const modStats = {};
  examQ.forEach((q,i) => {
    const m = q.module||'??';
    if (!modStats[m]) modStats[m] = {c:0,t:0};
    modStats[m].t++;
    if (answered[i] === q.correct) modStats[m].c++;
  });

  const modRes = document.getElementById('mod-results');
  modRes.innerHTML = '';
  Object.entries(modStats).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([m,s]) => {
    const p = Math.round(s.c/s.t*100);
    const color = p>=75?'var(--green)':p>=50?'var(--gold)':'var(--red)';
    modRes.innerHTML += `<div class="mod-result">
      <div class="mr-name">${MOD_LABELS[m]||('Module '+m)}</div>
      <div class="mr-bar"><div class="mr-fill" style="width:${p}%;background:${color}"></div></div>
      <div class="mr-pct" style="color:${color}">${p}%</div>
    </div>`;
  });

  // Radar chart
  drawRadarResponsive(modStats);

  // Save to localStorage for dashboard
  try {
    const history = JSON.parse(localStorage.getItem('casIn_examHistory')||'[]');
    history.unshift({date:Date.now(),score:pct,correct,total,modStats,dur:timerElapsed});
    localStorage.setItem('casIn_examHistory', JSON.stringify(history.slice(0,20)));
  } catch(e){}

  // Afficher les questions incorrectes
  const wrongList = document.getElementById('wrong-list');
  const wrongReview = document.getElementById('wrong-review');
  const wrongs = examQ.map((q,i)=>({q,i,a:answered[i]}))
    .filter(({q,i,a})=> a !== null && a !== -1 && a !== q.correct);
  if (wrongs.length > 0) {
    wrongList.innerHTML = wrongs.slice(0,10).map(({q,a}) => `
      <div class="wr-item">
        <div class="wr-q">${escHtml(q.question)}</div>
        <div class="wr-ans wrong">✗ Votre réponse : ${escHtml(q.answers[a]||'—')}</div>
        <div class="wr-ans correct">✓ Bonne réponse : ${q.answers[q.correct]||'—'}</div>
        ${q.explanation?`<div class="wr-expl">💡 ${q.explanation}</div>`:''}
      </div>`).join('');
    wrongReview.style.display = 'block';
    if (wrongs.length > 10) wrongList.innerHTML += `<div style="font-size:.72rem;color:var(--dim);text-align:center;padding:.5rem">… et ${wrongs.length-10} autres questions incorrectes</div>`;
  } else {
    wrongReview.style.display = 'none';
  }
  // Sauvegarder dans l'historique
  const _elapsed = timerElapsed || 0;
  saveHistory(
    Math.round(correct / examQ.length * 100),
    correct, examQ.length,
    _elapsed,
    modStats
  );
    showScreen('s-res');
}

function drawRadar(modStats) {
  const canvas = document.getElementById('radar-canvas');
  // Canvas responsive
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W = Math.round((rect.width || 680) * dpr);
  const H = Math.round((rect.width || 680) * 0.5 * dpr);
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const cW = W/dpr, cH = H/dpr;
  const cx = cW/2, cy = cH/2, r = Math.min(cW, cH)*0.35;
  ctx.clearRect(0,0,cW,cH);

  const entries = Object.entries(modStats).sort((a,b)=>a[0].localeCompare(b[0]));
  const n = entries.length;
  if (n < 3) return;

  const angles = entries.map((_,i) => -Math.PI/2 + (i/n)*Math.PI*2);

  // Grid
  [0.25,0.5,0.75,1].forEach(f => {
    ctx.beginPath();
    angles.forEach((a,i) => { const x=cx+Math.cos(a)*r*f, y=cy+Math.sin(a)*r*f; i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
    ctx.closePath();
    ctx.strokeStyle='rgba(255,255,255,.08)';
    ctx.stroke();
  });

  // Spokes
  angles.forEach(a => {
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r);
    ctx.strokeStyle='rgba(255,255,255,.06)';
    ctx.stroke();
  });

  // Data
  ctx.beginPath();
  entries.forEach(([m,s],i) => {
    const f = s.c/s.t;
    const x=cx+Math.cos(angles[i])*r*f, y=cy+Math.sin(angles[i])*r*f;
    i?ctx.lineTo(x,y):ctx.moveTo(x,y);
  });
  ctx.closePath();
  ctx.fillStyle='rgba(0,229,204,.15)';
  ctx.fill();
  ctx.strokeStyle='#00e5cc';
  ctx.lineWidth=2;
  ctx.stroke();

  // Points + labels
  entries.forEach(([m,s],i) => {
    const f = s.c/s.t;
    const x=cx+Math.cos(angles[i])*r*f, y=cy+Math.sin(angles[i])*r*f;
    ctx.beginPath();
    ctx.arc(x,y,5,0,Math.PI*2);
    const pctPt = s.t > 0 ? s.c/s.t : 0;
    ctx.fillStyle = pctPt >= .75 ? '#30e88a' : pctPt >= .5 ? '#f0c040' : '#ff4060';
    ctx.fill();

    const lx=cx+Math.cos(angles[i])*(r+22), ly=cy+Math.sin(angles[i])*(r+22);
    ctx.fillStyle='rgba(255,255,255,.7)';
    ctx.font='11px system-ui';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText((MOD_LABELS[m]||m).replace(/^[0-9]+\s*[^\s]*\s*/,'').slice(0,14), lx, ly);
  });
}

let _radarStats = null;
function drawRadarResponsive(modStats) {
  _radarStats = modStats;
  drawRadar(modStats);
  if (!window._radarObs && window.ResizeObserver) {
    const canvas = document.getElementById('radar-canvas');
    if (canvas) {
      window._radarObs = new ResizeObserver(() => { if (_radarStats) drawRadar(_radarStats); });
      window._radarObs.observe(canvas.parentElement || canvas);
    }
  }
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById(id).classList.add('on');
}

function restartExam() {
  showScreen('s-cfg');
  document.getElementById('start-btn').disabled=false;
  document.getElementById('start-btn').textContent='▶ Démarrer l\'examen blanc';
}



// ── Sauvegarder un examen dans l'historique ───────────────────
function saveHistory(score, correct, total, dur, modStats) {
  const entry = {
    date: new Date().toISOString(),
    score, correct, total,
    dur: dur,
    modStats: modStats
  };
  let history = [];
  try { history = JSON.parse(localStorage.getItem('casIn_examHistory')||'[]'); } catch(_) {}
  history.unshift(entry);
  if (history.length > 50) history = history.slice(0, 50);
  try { localStorage.setItem('casIn_examHistory', JSON.stringify(history)); } catch(e) {
    try { localStorage.setItem('casIn_examHistory', JSON.stringify(history.slice(0,10))); } catch(_) {}
  }
}

// ── Historique des examens ────────────────────────────────────
function showHistory() {
  let history = [];
  try { history = JSON.parse(localStorage.getItem('casIn_examHistory')||'[]'); } catch(_){}
  const list = document.getElementById('hist-list');
  const empty = document.getElementById('hist-empty');
  if (!history.length) {
    list.innerHTML=''; empty.style.display='block';
  } else {
    empty.style.display='none';
    const gradeLabel = p => p>=75?{t:'Réussi',c:'var(--green)'}:p>=60?{t:'Moyen',c:'var(--gold)'}:{t:'Insuffisant',c:'var(--red)'};
    list.innerHTML = history.map((h,i) => {
      const d = new Date(h.date);
      const dateStr = d.toLocaleDateString('fr-CH',{day:'2-digit',month:'2-digit',year:'numeric'});
      const timeStr = d.toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'});
      const dur = h.dur ? Math.floor(h.dur/60)+'m'+String(h.dur%60).padStart(2,'0') : '—';
      const g = gradeLabel(h.score);
      return `<div class="hist-item">
        <div class="hist-score">${h.score}%</div>
        <div class="hist-meta">
          <div style="color:var(--text);font-size:.8rem;margin-bottom:.2rem">${dateStr} à ${timeStr} · ${dur} · ${h.correct}/${h.total} correctes</div>
          <div style="display:flex;gap:.4rem;flex-wrap:wrap">
            ${Object.entries(h.modStats||{}).sort((a,b)=>a[0].localeCompare(b[0])).map(([m,s])=>{
              const p=Math.round(s.c/s.t*100);
              return `<span style="font-family:var(--mono);font-size:.65rem;padding:.1rem .4rem;border-radius:3px;
                background:rgba(255,255,255,.04);color:var(--dim)">${MOD_LABELS[m]||m} ${p}%</span>`;
            }).join('')}
          </div>
        </div>
        <span class="hist-grade" style="background:rgba(0,0,0,.2);color:${g.c};border:1px solid ${g.c}40">${g.t}</span>
      </div>`;
    }).join('');
  }
  // Mini graphe progression
  if (history.length >= 2) {
    const scores = history.map(h=>h.score).reverse();
    const trend = scores[scores.length-1] - scores[0];
    const trendEl = document.createElement('div');
    trendEl.style.cssText='text-align:center;font-size:.78rem;color:var(--dim);margin-bottom:1rem;padding:.5rem;background:var(--surface);border-radius:8px;border:1px solid var(--border)';
    trendEl.innerHTML = `${history.length} examens · Moyenne : <strong style="color:var(--cyan)">${Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)}%</strong> · Tendance : <strong style="color:${trend>=0?'var(--green)':'var(--red)'}">${trend>=0?'+':''}${Math.round(trend)}%</strong>`;
    list.prepend(trendEl);
  }
  showScreen('s-hist');
}

function clearHistory() {
  if (!confirm("Effacer tout l'historique des examens ?")) return;
  try { localStorage.removeItem('casIn_examHistory'); } catch(_){}
  showHistory();
}

// ── Mode révision ─────────────────────────────────────────────
let revCur = 0;

function startRevision() {
  if (!examQ.length) return;
  revCur = 0;
  renderRevQ();
  showScreen('s-rev');
}

function revNav(dir) {
  revCur = Math.max(0, Math.min(examQ.length-1, revCur+dir));
  renderRevQ();
}

function renderRevQ() {
  const q = examQ[revCur];
  const a = answered[revCur];
  const isCorrect = a === q.correct;
  const wasSkipped = a === null || a === -1;
  document.getElementById('rev-qnum').textContent = (revCur+1)+'/'+examQ.length;
  document.getElementById('rev-prog').style.width = ((revCur+1)/examQ.length*100)+'%';

  const letters = ['A','B','C','D','E'];
  const mod = q.module||'??';

  document.getElementById('rev-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.85rem;flex-wrap:wrap">
      <div class="mod-badge" style="background:${(MOD_COLORS[mod]||'#8b949e')}18;color:${MOD_COLORS[mod]||'#8b949e'};border:1px solid ${(MOD_COLORS[mod]||'#8b949e')}40;display:inline-flex;align-items:center;gap:.35rem;font-family:var(--mono);font-size:.62rem;padding:.2rem .6rem;border-radius:4px;font-weight:600">
        ${MOD_LABELS[mod]||mod}
      </div>
      ${wasSkipped?'<span style="font-size:.72rem;color:var(--dim);font-family:var(--mono)">⏭ Passée</span>':
        isCorrect?'<span style="font-size:.72rem;color:var(--green);font-family:var(--mono)">✓ Correcte</span>':
        '<span style="font-size:.72rem;color:var(--red);font-family:var(--mono)">✗ Incorrecte</span>'}
    </div>
    <div class="question">${escHtml(q.question)}</div>
    <div class="answers" style="margin-bottom:1rem">
      ${q.answers.map((ans,i) => {
        const isAns = i===a, isCorr = i===q.correct;
        let cls='ans-btn';
        if(isCorr) cls+=' correct';
        else if(isAns&&!isCorr) cls+=' wrong';
        return `<div class="${cls}" style="cursor:default">
          <span class="ans-letter">${letters[i]}</span>
          <span class="ans-text">${ans}</span>
        </div>`;
      }).join('')}
    </div>
    ${q.explanation?`<div class="explanation on">💡 ${q.explanation}</div>`:''}
    <div style="display:flex;justify-content:space-between;margin-top:1rem">
      <button type="button" class="nav-btn skip-btn" onclick="revNav(-1)" ${revCur===0?'disabled':''}>← Précédente</button>
      <span style="font-size:.72rem;color:var(--dim);align-self:center">${revCur+1} / ${examQ.length}</span>
      <button type="button" class="nav-btn next-btn" onclick="revNav(1)" ${revCur===examQ.length-1?'disabled style="opacity:.4"':''}>Suivante →</button>
    </div>`;
}

// ── Gestion du timer personnalisé ─────────────────────────────
document.querySelectorAll('#dur-opts .cfg-opt').forEach(el => {
  const orig = el.onclick;
  el.onclick = () => {
    document.querySelectorAll('#dur-opts .cfg-opt').forEach(e=>e.classList.remove('on'));
    el.classList.add('on');
    if (el.dataset.dur === 'custom') {
      cfg.dur = Math.max(5, parseInt(document.getElementById('dur-custom').value)||45);
    } else {
      cfg.dur = +el.dataset.dur;
    }
  };
});
// Mise à jour en temps réel du champ custom
document.addEventListener('DOMContentLoaded', () => {
  const customInput = document.getElementById('dur-custom');
  if (customInput) {
    customInput.addEventListener('input', () => {
      const val = Math.max(5, parseInt(customInput.value)||45);
      cfg.dur = val;
    });
  }
});

