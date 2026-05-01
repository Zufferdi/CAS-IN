#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// test-achievements-sync.js
//
// Vérifie que les définitions d'ACHIEVEMENTS sont SYNCHRONISÉES entre
// les deux sources de vérité :
//   - js/pages/quiz-app.js → const ACHIEVEMENTS (id, emoji, name, desc, check)
//   - js/core/cas-in-achievements.js → const QUIZ_ACH (id, emoji, name, desc, category, progress)
//
// Pourquoi 2 sources ?
//   - quiz-app.js a besoin des `check` (qui dépendent du runtime quiz `S`).
//   - cas-in-achievements.js a besoin des `category` et `progress` (utilisés
//     par profile-page.js sans charger tout quiz-app.js).
//
// Ce qui DOIT être identique entre les deux :
//   - L'ensemble des IDs (41 entries)
//   - Les emoji
//   - Les noms (name)
//
// Ce qui PEUT différer (toléré) :
//   - desc : abréviations possibles (ex: "questions" vs "Q")
//
// Lance ce test après toute modification d'ACHIEVEMENTS pour éviter dérive.
//
// Usage :
//   node tests/test-achievements-sync.js
//
// Exit code 0 si tout est cohérent, 1 si désynchronisation détectée.
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ─── Lire quiz-app.js et extraire le bloc ACHIEVEMENTS ───
const quizApp = fs.readFileSync(path.join(ROOT, 'js/pages/quiz-app.js'), 'utf8');

// Extraire le tableau via eval contrôlé
function extractAchievementsFromQuizApp(src) {
  const m = src.match(/const ACHIEVEMENTS\s*=\s*\[/);
  if (!m) throw new Error("ACHIEVEMENTS non trouvé dans quiz-app.js");
  const start = m.index;
  const bracketOpen = src.indexOf('[', start);
  let depth = 1;
  let pos = bracketOpen + 1;
  while (depth > 0 && pos < src.length) {
    if (src[pos] === '[') depth++;
    else if (src[pos] === ']') depth--;
    pos++;
  }
  const blockSrc = src.substring(bracketOpen, pos);
  // Eval dans contexte minimal
  const arr = eval(blockSrc);
  return arr.map(a => ({
    id: a.id,
    emoji: a.emoji,
    name: a.name,
    desc: a.desc,
    hasCheck: typeof a.check === 'function',
  }));
}

// ─── Lire cas-in-achievements.js et exécuter pour récupérer QUIZ_ACH ───
function extractFromAchievements() {
  // Mock minimal pour exécuter le module
  global.window = global;
  global.localStorage = { getItem: () => null, setItem: () => {} };
  global.document = { addEventListener: () => {} };

  // S'assurer qu'aucune définition existante ne pollue
  delete global.ACHIEVEMENTS_META;
  delete global.AchievementsCore;

  const code = fs.readFileSync(path.join(ROOT, 'js/core/cas-in-achievements.js'), 'utf8');
  eval(code);

  const meta = global.ACHIEVEMENTS_META;
  if (!Array.isArray(meta)) throw new Error("ACHIEVEMENTS_META non créé");

  // Filtrer les entries de catégorie quiz uniquement
  return meta.filter(a => a.category && (a.category.startsWith('Quiz') || a.category === 'Secrets 🤫'));
}

// ─── Comparer ───
let errors = 0;
const warnings = [];

console.log('═══ Test de synchronisation ACHIEVEMENTS ═══\n');

let quizAch, sharedAch;
try {
  quizAch = extractAchievementsFromQuizApp(quizApp);
  console.log(`✓ quiz-app.js : ${quizAch.length} achievements extraits`);
} catch (e) {
  console.error(`❌ Lecture quiz-app.js : ${e.message}`);
  process.exit(1);
}

try {
  sharedAch = extractFromAchievements();
  console.log(`✓ cas-in-achievements.js : ${sharedAch.length} achievements extraits\n`);
} catch (e) {
  console.error(`❌ Lecture cas-in-achievements.js : ${e.message}`);
  process.exit(1);
}

// 1. Compter
if (quizAch.length !== sharedAch.length) {
  errors++;
  console.error(`❌ Nombre différent : quiz-app=${quizAch.length}, achievements=${sharedAch.length}`);
}

// 2. Comparer par id
const quizMap = new Map(quizAch.map(a => [a.id, a]));
const sharedMap = new Map(sharedAch.map(a => [a.id, a]));

const allIds = new Set([...quizMap.keys(), ...sharedMap.keys()]);
let idMismatch = 0, emojiMismatch = 0, nameMismatch = 0, descAbbrev = 0;

for (const id of allIds) {
  const q = quizMap.get(id);
  const s = sharedMap.get(id);
  if (!q) {
    errors++;
    idMismatch++;
    console.error(`  ❌ ID '${id}' présent dans achievements.js mais ABSENT de quiz-app.js`);
    continue;
  }
  if (!s) {
    errors++;
    idMismatch++;
    console.error(`  ❌ ID '${id}' présent dans quiz-app.js mais ABSENT de achievements.js`);
    continue;
  }
  if (q.emoji !== s.emoji) {
    errors++;
    emojiMismatch++;
    console.error(`  ❌ Emoji différent pour '${id}' : '${q.emoji}' vs '${s.emoji}'`);
  }
  if (q.name !== s.name) {
    errors++;
    nameMismatch++;
    console.error(`  ❌ Name différent pour '${id}' : '${q.name}' vs '${s.name}'`);
  }
  if (q.desc !== s.desc) {
    descAbbrev++;
    warnings.push(`  ⚠ Desc différent pour '${id}' : '${q.desc}' vs '${s.desc}'`);
  }
}

// ─── Sortie ───
console.log(`\n─── Résumé ───`);
console.log(`  IDs absents dans une source : ${idMismatch}`);
console.log(`  Emojis différents          : ${emojiMismatch}`);
console.log(`  Names différents           : ${nameMismatch}`);
console.log(`  Descs abrégés (toléré)     : ${descAbbrev}`);

if (warnings.length > 0 && process.argv.includes('--verbose')) {
  console.log('\nDifférences de desc (toléré, mais à harmoniser si possible) :');
  warnings.slice(0, 10).forEach(w => console.log(w));
  if (warnings.length > 10) console.log(`  ... et ${warnings.length - 10} autres`);
}

if (errors > 0) {
  console.error(`\n❌ ${errors} erreur(s) critique(s) — les sources sont DÉSYNCHRONISÉES`);
  console.error(`   Corrige les divergences dans les 2 fichiers et relance le test.`);
  process.exit(1);
}

console.log(`\n✅ Sources synchronisées (${quizAch.length} achievements quiz)`);
if (descAbbrev > 0) {
  console.log(`   ${descAbbrev} desc divergent uniquement par abréviation — toléré.`);
  console.log(`   Pour voir le détail : node tests/test-achievements-sync.js --verbose`);
}
process.exit(0);
