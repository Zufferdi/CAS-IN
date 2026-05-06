/**
 * CAS-IN Test Suite v3 — node test-cas-in.js fichier1 fichier2 ...
 * Source de vérité syntaxe = node --check (pas le compteur brut d'accolades)
 */
const fs   = require('fs');
const path = require('path');
const {execSync} = require('child_process');
const os   = require('os');

const C = {
  ok:   s => `\x1b[32m✅ ${s}\x1b[0m`,
  fail: s => `\x1b[31m❌ ${s}\x1b[0m`,
  warn: s => `\x1b[33m⚠️  ${s}\x1b[0m`,
  head: s => `\x1b[1m\x1b[36m${s}\x1b[0m`,
  dim:  s => `\x1b[2m${s}\x1b[0m`,
};

let passed = 0, failed = 0, warned = 0;
const ok   = l => { console.log('  ' + C.ok(l));   passed++; };
const fail = l => { console.log('  ' + C.fail(l)); failed++; };
const warn = l => { console.log('  ' + C.warn(l)); warned++; };
const sec  = s => console.log('\n' + C.head(`── ${s} ──`));
const chk  = (c, la, lb) => c ? ok(la) : fail(lb || la);

function extractJS(html, baseDir = '') {
  // 1) inline <script>…</script> blocks
  const inline = (html.match(/<script>([\s\S]*?)<\/script>/g) || [])
    .map(s => s.replace(/<\/?script>/g, '')).join('\n');
  // 2) external <script src="…"> — résout les chemins relatifs depuis baseDir
  //    (post v2.10 : tools-app.js / exam-app.js / quiz-app.js / etc.
  //    sont externalisés et désormais sous js/pages/, js/core/, …)
  const external = [];
  const re = /<script[^>]+src="([^":]+\.js)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const p = path.join(baseDir, m[1]);
    try {
      if (fs.existsSync(p)) external.push(fs.readFileSync(p, 'utf8'));
    } catch (_) {}
  }
  return inline + '\n' + external.join('\n');
}

// Concatène HTML + CSS externes liés (pour les checks @media et autres).
function extractCSS(html, baseDir = '') {
  const inline = (html.match(/<style>([\s\S]*?)<\/style>/g) || [])
    .map(s => s.replace(/<\/?style>/g, '')).join('\n');
  const external = [];
  const re = /<link[^>]+href="([^":]+\.css)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const p = path.join(baseDir, m[1]);
    try {
      if (fs.existsSync(p)) external.push(fs.readFileSync(p, 'utf8'));
    } catch (_) {}
  }
  return inline + '\n' + external.join('\n');
}

// Seule source de vérité fiable pour la syntaxe JS
function checkJSSyntax(js) {
  const tmp = path.join(os.tmpdir(), `cas-in-${Date.now()}.js`);
  try {
    fs.writeFileSync(tmp, js);
    execSync(`node --check "${tmp}"`, { stdio: 'pipe' });
    ok('node --check : aucune SyntaxError');
    return true;
  } catch (e) {
    const msg = (e.stderr || '').toString().split('\n').find(l => l.includes(':')) || '';
    fail(`SyntaxError: ${msg.trim().slice(0, 80)}`);
    return false;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

function countItems(src, varName, ...keys) {
  const idx = src.indexOf(`const ${varName}`);
  if (idx === -1) return 0;
  const bracket = src.indexOf('[', idx);
  let depth = 0, end = bracket;
  for (let i = bracket; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (!depth) { end = i; break; } }
  }
  const block = src.slice(bracket, end);
  return Math.max(...keys.map(k => (block.match(new RegExp(`\\b${k}:`, 'g')) || []).length));
}

// ══════════════════════════════════════════════════════════════════════
function testSyntaxJS(src, label) {
  sec(`Syntaxe JS — ${label}`);
  // node --check = source de vérité
  const ok_syntax = checkJSSyntax(src);
  // Note: le comptage des backticks est laissé à node --check (gestion des strings imbriquées)
  return ok_syntax;
}

function testToolsHTML(src, baseDir) {
  sec('tools.html — Structure et fonctions');
  const js = extractJS(src, baseDir);
  const css = extractCSS(src, baseDir);

  // Bijectif : extraire les IDs proprement
  const navSet   = new Set((src.match(/showTool\('(\w+)'/g) || []).map(m => m.match(/'(\w+)'/)[1]));
  const panelSet = new Set((src.match(/id="tool-(\w+)"/g) || []).map(m => m.match(/tool-(\w+)/)[1]));
  chk([...navSet].every(k => panelSet.has(k)) && navSet.size === panelSet.size,
    `${navSet.size} onglets = ${panelSet.size} panels (bijectif)`,
    `Onglets sans panel: ${[...navSet].filter(k => !panelSet.has(k))}`);

  for (const fn of ['showTool','showResult','copyResult','decodeSFN','identifyMagic',
                     'decodeBitmap','identifyHash','calcCluster','decodeMFT',
                     'calcTS','calcRL','calcFAT','calcNTFS','restoreLastVals']) {
    chk(js.includes(`function ${fn}`), `${fn}() défini`, `${fn}() MANQUANT`);
  }

  const scriptBlock = src.match(/<script>([\s\S]*?)<\/script>/)?.[1] || '';
  chk(!/<div\s+id="tool-/.test(scriptBlock), 'Pas de HTML dans <script>');
  chk(src.includes('role="tablist"'), 'ARIA role=tablist');
  chk(src.includes('role="tab"'),     'ARIA role=tab');
  chk(css.includes('@media'),         'Media queries responsive');
  chk(js.includes('restoreLastVals'), 'restoreLastVals()');
}

function testExamHTML(src, baseDir) {
  sec('exam.html — Structure et fonctions');
  const js = extractJS(src, baseDir);
  const css = extractCSS(src, baseDir);

  for (const fn of ['startExam','finishExam','restartExam','quitExam','renderQ',
                     'showScreen','escHtml','showHistory','startRevision',
                     'renderRevQ','saveHistory','drawRadar']) {
    chk(js.includes(`function ${fn}`) || js.includes(`async function ${fn}`),
      `${fn}()`, `${fn}() MANQUANT`);
  }

  chk(js.includes('escHtml(q.question)'),             'escHtml sur q.question');
  chk(!js.includes("escHtml(q.answers[a]||'—'}"),     'Parenthèse escHtml correcte');
  chk(js.includes('if (examFinished) return'),         'Guard finishExam');
  chk(js.includes('examFinished = false'),             'examFinished reset');
  chk(js.includes('dur-custom'),                       'Timer personnalisé');
  chk(js.includes('casIn_examHistory'),                'Historique localStorage');
  chk(js.includes('ResizeObserver'),                   'ResizeObserver radar');
  chk(css.includes('@media print'),                    '@media print PDF');

  // THEME_TO_MOD : doit exister DANS startExam (n'importe où dedans)
  const startIdx = js.indexOf('async function startExam');
  const endStart = (() => { let d=0,i=startIdx; while(i<js.length){ if(js[i]==='{')d++; else if(js[i]==='}'){d--;if(!d&&i>startIdx)return i;} i++; } return js.length; })();
  chk(js.indexOf('THEME_TO_MOD', startIdx) < endStart && js.indexOf('THEME_TO_MOD', startIdx) > startIdx,
    'THEME_TO_MOD dans startExam()');

  for (const s of ['s-cfg','s-exam','s-res','s-err','s-hist','s-rev']) {
    chk(src.includes(`id="${s}"`), `Écran ${s}`);
  }
}

function testTPEngine(src) {
  sec('tp-engine.js — Fonctions et structure');

  for (const fn of ['genEndian','genTimestamp','genBitmap','genFAT','genMagic',
                     'genMismatch','genRunList','genEffacement','genTimestomping',
                     'genDroitPenal','genGlossaire','genEmail','genIR','genNetwork',
                     'genOffset','genHexTable','genFSIdentify','genHashIdentify','genExamen']) {
    chk(src.includes(`function ${fn}`), fn+'()', fn+'() MANQUANT');
  }

  chk(src.includes('function _lsGet'),         '_lsGet()');
  chk(src.includes('function _lsSet'),         '_lsSet()');
  chk(src.includes("try { return JSON.parse"), 'STATE init safe');
  chk((src.match(/incSolved\('[^']+'\)/g)||[]).length === 0,
    'incSolved(STATE.cat) partout', `incSolved hardcodé ${(src.match(/incSolved\('[^']+'\)/g)||[]).length}×`);
  chk((src.match(/function shuffle/g)||[]).length === 1, 'shuffle unique');
  chk(src.includes("fs: 'APFS'"),      'APFS dans fsOptions');
  chk(/rand\(0,\s*3\)/.test(src),      'genTimestamp 4 modes');
  chk(src.includes('tsMode === 2'),    'Mode Unix Epoch');
  chk(src.includes('tsMode === 3'),    'Mode APFS ns');

  // Modes dans genTimestamp
  const ts0 = src.indexOf('function genTimestamp');
  let d=0, tsE=ts0, si=ts0;
  while(si<src.length){ if(src[si]==='{')d++; else if(src[si]==='}'){ d--; if(!d&&si>ts0){tsE=si;break;} } si++; }
  chk(src.indexOf('tsMode === 2')>ts0 && src.indexOf('tsMode === 2')<tsE, 'Mode 2 dans genTimestamp');
  chk(src.indexOf('tsMode === 3')>ts0 && src.indexOf('tsMode === 3')<tsE, 'Mode 3 dans genTimestamp');

  chk(src.includes('function startChrono'), 'startChrono()');
  chk(src.includes('STATE.droitIdx'),       'droitIdx dans STATE');
  chk(src.includes('STATE.glossIdx'),       'glossIdx dans STATE');

  for (const fn of ['makeBootSectorExercise','makeRunListExercise','makeBitmapExercise',
                     'makeFAT16SFNExercise','makeNTFSMFTAttributeExercise',
                     'makeFAT16LFNExercise','makeExFATDirentExercise']) {
    chk(src.includes(`function ${fn}`), fn);
  }
}

function testTPData(src) {
  sec('tp-data.js — Contenu des exercices');
  const cfg = {
    MAGIC_DB:          { min: 20, keys: ['sig']               },
    MISMATCH_DB:       { min: 10, keys: ['fake','real']       },
    GLOSSAIRE:         { min: 30, keys: ['fr','en']           },
    DROIT_CASES:       { min:  6, keys: ['action','choices']  },
    EMAIL_EXERCISES:   { min: 12, keys: ['scenario']          },
    IR_EXERCISES:      { min:  4, keys: ['scenario']          },
    NETWORK_EXERCISES: { min: 12, keys: ['scenario']          },
    BASES_EXERCISES:   { min:  4, keys: ['category','question']},
  };
  for (const [v, {min, keys}] of Object.entries(cfg)) {
    chk(src.includes(`const ${v}`), `${v} défini`);
    const n = countItems(src, v, ...keys);
    if (n >= min)    ok(`${v}: ${n} entrées (min ${min})`);
    else if (n > 0) warn(`${v}: ${n} entrées (min recommandé: ${min})`);
    else            fail(`${v}: 0 entrées`);
  }
}

function testSWJS(src) {
  sec('sw.js — Service Worker');
  const ver = (src.match(/CACHE_VERSION\s*=\s*'([^']+)'/) || [])[1];
  chk(!!ver, `Version: ${ver || '???'}`);
  for (const f of ['tp-data.js','tp-engine.js','exam.html','tools.html','data/questions.json']) {
    chk(src.includes(f), `${f} dans STATIC_ASSETS`);
  }
  chk(src.includes('networkFirst('),         'Network-first (helper)');
  chk(src.includes('caches.match'),         'Cache-first');
  chk(src.includes('self.skipWaiting()'),   'skipWaiting()');
  chk(src.includes('self.clients.claim'),   'clients.claim()');
}

// ══════════════════════════════════════════════════════════════════════
function runFile(filePath) {
  const src  = fs.readFileSync(filePath, 'utf-8');
  const name = path.basename(filePath);
  const baseDir = path.dirname(filePath);
  console.log(C.head(`\n╔══════════════════════════════════════════════════╗`));
  console.log(C.head(`║  CAS-IN Tests — ${name.padEnd(31)}║`));
  console.log(C.head(`╚══════════════════════════════════════════════════╝`));

  const js = name.endsWith('.html') ? extractJS(src, baseDir) : src;
  testSyntaxJS(js, name);

  if      (name === 'tools.html')    testToolsHTML(src, baseDir);
  else if (name === 'exam.html')     testExamHTML(src, baseDir);
  else if (name === 'tp-engine.js')  testTPEngine(src);
  else if (name === 'tp-data.js')    testTPData(src);
  else if (name === 'sw.js')         testSWJS(src);

  console.log(`\n  ${C.dim('─'.repeat(50))}`);
  const t = passed + failed + warned;
  console.log(`  ${C.ok(`${passed} OK`)}  ${failed > 0 ? C.fail(`${failed} FAIL`) : C.dim('0 FAIL')}  ${warned > 0 ? C.warn(`${warned} WARN`) : C.dim('0 WARN')}  ${C.dim(`/ ${t}`)}`);
  return failed;
}

const files = process.argv.slice(2);
if (!files.length) { console.log(C.warn('Usage: node test-cas-in.js f1 f2 ...')); process.exit(1); }
let total = 0;
for (const f of files) {
  const abs = path.resolve(f);
  if (!fs.existsSync(abs)) { console.log(C.fail(`Non trouvé: ${f}`)); total++; continue; }
  passed = failed = warned = 0;
  total += runFile(abs);
}
process.exit(total > 0 ? 1 : 0);
