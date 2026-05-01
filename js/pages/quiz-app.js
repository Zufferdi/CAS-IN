// ═══════════════════════════════════════════════════════════════
// quiz-app.js — Logique principale du quiz CAS-IN
//
// Extrait de quiz.html v2.4 → fichier séparé pour :
//   • Cache navigateur séparé du HTML (les corrections rapides du HTML
//     ne forcent plus le re-téléchargement de 365 KB de JS)
//   • Source map et debug
//   • Gzip plus efficace sur du JS pur
//   • Versioning indépendant via le Service Worker
//
// IMPORTANT : ce fichier est intentionnellement non-IIFE.
// Toutes les fonctions exposées via onclick="..." dans le HTML
// (renderQuestion, validate, openSettings, …) doivent rester
// globales (window.*). Ne pas wrapper.
//
// Sections (utilise Cmd-F dans ton éditeur) :
//   1. CONSTANTES         — DIFF_LABELS, RANKS, ACHIEVEMENTS, MILESTONES, …
//   2. PERSONAS / TIPS    — FORENSIC_QUOTES, PERSONAS, FORENSIC_TIPS, AVATAR_EMOJIS
//   3. CŒUR DU QUIZ       — renderQuestion, validate, doSkip, nextQuestion
//   4. UI MODALES         — openExplModal, openSettings, openHelp, openBilan
//   5. EXAM / SURVIE      — openExam, startExam, examNext, showExamResults, lives
//   6. GAMIFICATION       — XP, rangs, streak, combo, achievements, milestones
//   7. SM2                — getSM2Data, updateSM2, getSM2Due, activateSM2Mode
//   8. RADAR & GLOSSAIRE  — drawRadar, GLOSSARY, initGlossary
//   9. SHARE CARD         — drawShareCard, downloadShareCard, shareNative
//  10. MID-SESSION        — maybeTriggerMidSession, MID_TIPS
//  11. MODES SECRETS      — God Mode (Konami), Double-or-Nothing
//  12. UTILS               — applyFontSize, sanitizeHTML, saveSessionSnapshot
//
// ═══════════════════════════════════════════════════════════════

      const DIFF_LABELS = {
        easy: 'Facile',
        medium: 'Moyen',
        hard: 'Difficile'
      };
      const DIFF_PTS = {
        easy: 1,
        medium: 2,
        hard: 3
      };
      const TC = {
        'Informatique de base': '#7ab8ff',
        'Acquisition et analyse': '#00e5cc',
        'Système de fichiers': '#7affea',
        'Spécificité des OS': '#ff6b9d',
        'Cryptologie': '#f0c040',
        'OSINT': '#ffd580',
        'Droit': '#ff8c42',
        'Forensique': '#fb923c'
      };

      const ACHIEVEMENTS = [{
        id: 'first',
        emoji: '🎯',
        name: 'Premier pas',
        desc: 'Répondre à 1 question',
        check: s => s.total >= 1
      }, {
        id: 'ten',
        emoji: '🔟',
        name: 'Décollage',
        desc: 'Répondre à 10 questions',
        check: s => s.total >= 10
      }, {
        id: 'fifty',
        emoji: '5️⃣0️⃣',
        name: 'Cinquantaine',
        desc: 'Répondre à 50 questions',
        check: s => s.total >= 50
      }, {
        id: 'hundred',
        emoji: '💯',
        name: 'Centurion',
        desc: 'Répondre à 100 questions',
        check: s => s.total >= 100
      }, {
        id: 'five00',
        emoji: '🚀',
        name: 'Marathon',
        desc: 'Répondre à 500 questions',
        check: s => s.total >= 500
      }, {
        id: 'thou',
        emoji: '🌟',
        name: 'Millénaire',
        desc: 'Répondre à 1000 questions',
        check: s => s.total >= 1000
      }, {
        id: 'twoK',
        emoji: '🔱',
        name: 'Légende vivante',
        desc: 'Répondre à 2000 questions',
        check: s => s.total >= 2000
      }, {
        id: 'streak1',
        emoji: '✊',
        name: 'La première',
        desc: '1 bonne réponse — ça commence toujours ainsi',
        check: s => s.streak >= 1
      }, {
        id: 'streak3',
        emoji: '⚡',
        name: 'C\'est parti !',
        desc: '3 bonnes réponses de suite',
        check: s => s.streak >= 3
      }, {
        id: 'streak5',
        emoji: '🔥',
        name: 'Série de feu',
        desc: '5 bonnes réponses de suite',
        check: s => s.streak >= 5
      }, {
        id: 'streak10',
        emoji: '💥',
        name: 'Inarrêtable',
        desc: '10 bonnes réponses de suite',
        check: s => s.streak >= 10
      }, {
        id: 'streak20',
        emoji: '🌋',
        name: 'Mode Dieu',
        desc: '20 bonnes réponses de suite',
        check: s => s.streak >= 20
      }, {
        id: 'streak50',
        emoji: '👑',
        name: 'Légende de la série',
        desc: '50 bonnes réponses de suite — irréel',
        check: s => s.streak >= 50
      }, {
        id: 'acc90',
        emoji: '🎓',
        name: 'Précision laser',
        desc: '90%+ sur 50 questions minimum',
        check: s => s.total >= 50 && Math.round(s.correct / s.total * 100) >= 90
      }, {
        id: 'acc95',
        emoji: '💎',
        name: 'Mode élite',
        desc: '95%+ sur 100 questions minimum',
        check: s => s.total >= 100 && Math.round(s.correct / s.total * 100) >= 95
      }, {
        id: 'perfect',
        emoji: '🏆',
        name: 'Examen parfait',
        desc: '100% à un examen ≥ 10 questions',
        check: s => s.perfectExam
      }, {
        id: 'perfect20',
        emoji: '🎖️',
        name: 'Héros de l\'examen',
        desc: '100% à un examen ≥ 20 questions',
        check: s => s.perfectExam20
      }, {
        id: 'combo',
        emoji: '⚡',
        name: 'Combinaison ×2',
        desc: 'Atteindre le multiplicateur ×2',
        check: s => s.maxCombo >= 6
      }, {
        id: 'combo3',
        emoji: '🔱',
        name: 'Triple Kill',
        desc: 'Atteindre le multiplicateur ×3',
        check: s => s.maxCombo >= 12
      }, {
        id: 'hard10',
        emoji: '💀',
        name: 'Masochiste',
        desc: '10 questions difficiles correctes',
        check: s => (s.byDiff.hard?.ok || 0) >= 10
      }, {
        id: 'hard50',
        emoji: '🔥',
        name: 'Cherche la douleur',
        desc: '50 questions difficiles correctes',
        check: s => (s.byDiff.hard?.ok || 0) >= 50
      }, {
        id: 'daily3',
        emoji: '📅',
        name: 'Régularité',
        desc: 'Jouer 3 jours de suite',
        check: s => s.dayStreak >= 3
      }, {
        id: 'daily7',
        emoji: '🗓️',
        name: 'Abonné',
        desc: 'Jouer 7 jours de suite',
        check: s => s.dayStreak >= 7
      }, {
        id: 'daily10',
        emoji: '🔟',
        name: 'Double semaine',
        desc: 'Jouer 10 jours de suite',
        check: s => s.dayStreak >= 10
      }, {
        id: 'daily14',
        emoji: '📆',
        name: 'Quinzaine',
        desc: 'Jouer 14 jours de suite',
        check: s => s.dayStreak >= 14
      }, {
        id: 'daily30',
        emoji: '🏅',
        name: 'Mensuel',
        desc: 'Jouer 30 jours de suite — respect total',
        check: s => s.dayStreak >= 30
      }, {
        id: 'night',
        emoji: '🌙',
        name: 'Nuit blanche',
        desc: 'Jouer après minuit — l\'enquête attend',
        check: s => s.nightOwl
      }, {
        id: 'comeback',
        emoji: '🦋',
        name: 'Come-back',
        desc: '5 bonnes réponses après 3 mauvaises',
        check: s => s.comeback
      }, {
        id: 'allthemes',
        emoji: '🗺️',
        name: 'Polymathes',
        desc: 'Questions répondues dans 5 thèmes différents',
        check: s => Object.values(s.byTheme).filter(t => t.tot > 0).length >= 5
      }, {
        id: 'book10',
        emoji: '⭐',
        name: 'Collectionneur',
        desc: '10 questions mises en favoris',
        check: s => s.bookmarks.size >= 10
      }, {
        id: 'book25',
        emoji: '📚',
        name: 'Bibliothécaire',
        desc: '25 questions mises en favoris',
        check: s => s.bookmarks.size >= 25
      }, {
        id: 'smart50',
        emoji: '🧠',
        name: 'Révision ×50',
        desc: '50 questions en mode Révision Intelligente',
        check: s => s.smartCount >= 50
      }, {
        id: 'smart200',
        emoji: '🤖',
        name: 'Machine de révision',
        desc: '200 questions en mode Révision Intelligente',
        check: s => s.smartCount >= 200
      }, {
        id: 'daily_ch',
        emoji: '⚡',
        name: 'Défi relevé',
        desc: 'Terminer le défi du jour',
        check: s => s.dailyDone
      }, {
        id: 'hint',
        emoji: '💡',
        name: 'J\'avais besoin d\'un coup de pouce',
        desc: 'Utiliser un indice',
        check: s => s.hintsUsed >= 1
      }, {
        id: 's_3am',
        emoji: '🦇',
        name: '???',
        desc: '???',
        secret: true,
        check: s => s._secretFlags?.at3am
      }, {
        id: 's_42',
        emoji: '🌌',
        name: '???',
        desc: '???',
        secret: true,
        check: s => s._secretFlags?.exam42
      }, {
        id: 's_13',
        emoji: '🎱',
        name: '???',
        desc: '???',
        secret: true,
        check: s => s._secretFlags?.streak13
      }, {
        id: 's_hints3',
        emoji: '🧙',
        name: '???',
        desc: '???',
        secret: true,
        check: s => s._secretFlags?.hints3day
      }, {
        id: 's_speed5',
        emoji: '🏎️',
        name: '???',
        desc: '???',
        secret: true,
        check: s => s._secretFlags?.speed5row
      }, {
        id: 's_skip',
        emoji: '🙈',
        name: '???',
        desc: '???',
        secret: true,
        check: s => s._secretFlags?.skip20
      }, ];



      const STREAK_MSGS = {
        1: '⚡ 1 — ça commence !',
        2: '⚡ 2 de suite !',
        3: '⚡ 3 d\'affilée !',
        5: '🔥 5 en série !',
        7: '🔥 7 ! Tu brûles !',
        10: '🔥🔥 10 de suite !',
        12: '💥 12 ! Inarrêtable !',
        15: '💥 15 ! On est chauds !',
        20: '🚀 20 ! Mode Dieu !',
        25: '🌋 25 ! Mythe vivant !',
        30: '👑 30 ! LÉGENDE !',
        50: '🏆 50 ! IMPOSSIBLE… et pourtant.',
        75: '🏆 75 ! Banzaï ! On est bons.',
      };




 let _qRenderTime = 0;

 let _loadMsgInt = null;

 function startLoadingMessages() {
 const el = document.getElementById('loading-msg');
 if (!el) return;
 let i = Math.floor(Math.random() * LOADING_MSGS.length);
 el.textContent = LOADING_MSGS[i];
 _loadMsgInt = setInterval(() => {
 i = (i + 1) % LOADING_MSGS.length;
 el.style.animation = 'none';
 void el.offsetWidth; // reflow to restart animation
 el.style.animation = '';
 el.textContent = LOADING_MSGS[i];
 }, 1800);
 }

 function stopLoadingMessages() {
 if (_loadMsgInt) {
 clearInterval(_loadMsgInt);
 _loadMsgInt = null;
 }
 }

 function getDailyDate() {
 return new Date().toISOString().slice(0, 10);
 }

 function seededRng(seed) {
 let h = seed;
 return () => {
 h = Math.imul(h ^ h >>> 16, 0x45d9f3b);
 h = Math.imul(h ^ h >>> 15, 0x2b9c4d);
 return (h ^ h >>> 13) >>> 0;
 };
 }

 function getDailySeed() {
 const d = getDailyDate();
 return d.split('-').reduce((a, v) => a * 100 + parseInt(v), 0);
 }
 let ALL_Q = [],
 ALL_T = [],
 ALL_C = [];
 let SOUND_ON = true;
 let S = {
 score: 0,
 correct: 0,
 total: 0,
 streak: 0,
 maxStreak: 0,
 answered: false,
 sel: new Set(),
 selCorrect: new Map(),
 curQ: null,
 curIdx: -1,
 byDiff: {
 easy: {
 ok: 0,
 tot: 0
 },
 medium: {
 ok: 0,
 tot: 0
 },
 hard: {
 ok: 0,
 tot: 0
 }
 },
 byTheme: {},
 byChapter: {},
 errors: [],
 bookmarks: new Set(),
 activeT: new Set(),
 activeD: new Set(['easy',
  'medium',
  'hard']),
 activeC: new Set(),
 timerSec: 0,
 timerLeft: 0,
 timerInt: null,
 mode: 'normal',
 pool: [],
 pi: 0,
 qstats: {},
 xp: 0,
 combo: 1,
 maxCombo: 0,
 perfectExam: false,
 perfectExam20: false,
 nightOwl: false,
 smartCount: 0,
 dayStreak: 0,
 lastPlayDate: null,
 dailyDone: false,
 dailyScore: 0,
 comeback: false,
 hintsLeft: 3,
 hintsUsed: 0,
 _wrongRun: 0,
 _rightAfterWrong: 0,
 lives: 3,
 survivalBest: 0,
 sm2Queue: [],
 _swipeStartX: 0,
 _swipeStartY: 0,
 avatarEmoji: '🔰',
 avatarName: 'Enquêteur',
 _midShown: new Set(),
 _secretFlags: {},
 streakFreezes: 1,
 skipsTotal: 0,
 _speedCorrect: 0,
 };

 function lsGet(k, d) {
 try {
 const v = localStorage.getItem(k);
 return v !== null ? JSON.parse(v) : d;
 } catch {
 return d;
 }
 }

 function lsSet(k, v) {
 try {
 localStorage.setItem(k, JSON.stringify(v));
 } catch {}
 }

 function loadPersist() {
 S.bookmarks = new Set(lsGet('bm', []));
 S.timerSec = lsGet('timer', 0);
 const at = lsGet('at', ALL_T);
 S.activeT = new Set(at.filter(t => ALL_T.includes(t)));
 if (!S.activeT.size) S.activeT = new Set(ALL_T);
 S.activeD = new Set(lsGet('ad', ['easy',
  'medium',
  'hard']));
 const ac = lsGet('ac', ALL_C);
 S.activeC = new Set(ac.filter(c => ALL_C.includes(c)));
 if (!S.activeC.size) S.activeC = new Set(ALL_C);
 S.qstats = lsGet('qs', {});
 S.xp = lsGet('xp', 0);
 S.maxCombo = lsGet('maxCombo', 0);
 S.perfectExam = lsGet('perfectExam', false);
 S.perfectExam20 = lsGet('perfectExam20', false);
 S.nightOwl = lsGet('nightOwl', false);
 S.smartCount = lsGet('smartCount', 0);
 S.comeback = lsGet('comeback', false);
 S.hintsUsed = lsGet('hintsUsed', 0);
 S.survivalBest = lsGet('survivalBest', 0);
 S.avatarEmoji = lsGet('avatarEmoji',
  '🔰');
 S.avatarName = lsGet('avatarName',
  'Enquêteur');
 updateAvatarChip();
 applyFontSize(lsGet('fontSize',
  'normal'));
 S.sm2Queue = lsGet('sm2q', []);
 S.streakFreezes = lsGet('freezes', 1);
 S._secretFlags = lsGet('secretFlags', {});
 S.dayStreak = lsGet('dayStreak', 0);
 S.lastPlayDate = lsGet('lastPlayDate', null);
 S.dailyDone = lsGet('dailyDone_' + getDailyDate(), false);
 S.dailyScore = lsGet('dailyScore_' + getDailyDate(), 0);
 SOUND_ON = lsGet('soundOn', true);
 document.getElementById('sound-btn').textContent = SOUND_ON ? '🔊' : '🔇';
 const h = new Date().getHours();
 if (h >= 0 && h < 5) {
 S.nightOwl = true;
 lsSet('nightOwl', true);
 }
 updateDayStreak();
 const vt = lsGet('visualTheme',
  'default');
 applyVisualTheme(vt);
 }

 function savePersist() {
 lsSet('bm', [...S.bookmarks]);
 lsSet('timer', S.timerSec);
 lsSet('at', [...S.activeT]);
 lsSet('ad', [...S.activeD]);
 lsSet('ac', [...S.activeC]);
 lsSet('qs', S.qstats);
 lsSet('xp', S.xp);
 lsSet('maxCombo', S.maxCombo);
 lsSet('perfectExam', S.perfectExam);
 lsSet('perfectExam20', S.perfectExam20);
 lsSet('nightOwl', S.nightOwl);
 lsSet('smartCount', S.smartCount);
 lsSet('comeback', S.comeback);
 lsSet('hintsUsed', S.hintsUsed);
 lsSet('survivalBest', S.survivalBest);
 lsSet('sm2q', S.sm2Queue);
 lsSet('avatarEmoji', S.avatarEmoji);
 lsSet('avatarName', S.avatarName);
 lsSet('freezes', S.streakFreezes);
 lsSet('secretFlags', S._secretFlags);
 }

 function saveSession() {
 const h = lsGet('sessions', []);
 const acc = S.total ? Math.round(S.correct / S.total * 100) : 0;
 const entry = {
 date: new Date().toLocaleDateString('fr'),
 score: S.score,
 acc,
 total: S.total,
 week: getWeekKey()
 };
 h.push(entry);
 if (h.length > 20) h.shift();
 lsSet('sessions', h);
 const wk = getWeekKey();
 const wl = lsGet('weeklyLB', {});
 if (!wl[wk] || S.score > wl[wk].score) {
 wl[wk] = {
 score: S.score,
 acc,
 date: entry.date
 };
 lsSet('weeklyLB', wl);
 }
 }

 function getWeekKey() {
 const d = new Date();
 const day = d.getDay() || 7;
 d.setDate(d.getDate() - day + 1);
 return d.toISOString().slice(0, 10);
 }

 function updateDayStreak() {
 const today = getDailyDate();
 const last = S.lastPlayDate;
 if (!last) {
 return;
 }
 const d1 = new Date(last),
 d2 = new Date(today);
 const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
 if (diff === 0) {} else if (diff === 1) {
 S.dayStreak++;
 lsSet('dayStreak', S.dayStreak);
 } else if (diff > 1) {
 S.dayStreak = 1;
 lsSet('dayStreak', S.dayStreak);
 }
 }

 function markPlayedToday() {
 const today = getDailyDate();
 if (S.lastPlayDate !== today) {
 S.lastPlayDate = today;
 lsSet('lastPlayDate', today);
 }
 }

 function shuffle(a, rng) {
 const b = [...a];
 for (let i = b.length - 1; i > 0; i--) {
 const j = rng ? Math.floor(rng() / (0xffffffff + 1) * (i + 1)) : 0 | Math.random() * (i + 1);
 [b[i], b[j]] = [b[j], b[i]];
 }
 return b;
 }

 function buildPool() {
 let p;
 if (S.mode === 'survival') {
 p = ALL_Q.map((q, i) => ({
 q,
 idx: i
 })).filter(x => S.activeT.has(x.q.theme) && S.activeD.has(x.q.diff) && S.activeC.has(x.q.chapter));
 S.lives = 3;
 updateLivesDisplay();
 } else if (S.mode === 'sm2') {
 p = getSM2Due().map(i => ({
 q: ALL_Q[i],
 idx: i
 })).filter(x => x.q);
 if (!p.length) p = ALL_Q.map((q, i) => ({
 q,
 idx: i
 })).filter(x => S.activeT.has(x.q.theme));
 } else if (S.mode === 'bookmarks') p = [...S.bookmarks].map(i => ({
 q: ALL_Q[i],
 idx: i
 })).filter(x => x.q);
 else if (S.mode === 'errors') p = S.errors.map(i => ({
 q: ALL_Q[i],
 idx: i
 })).filter(x => x.q);
 else if (S.mode === 'daily') {
 const rng = seededRng(getDailySeed());
 const base = ALL_Q.map((q, i) => ({
 q,
 idx: i
 }));
 p = shuffle(base, rng).slice(0, 20);
 } else if (S.mode === 'smart') {
 const base = ALL_Q.map((q, i) => ({
 q,
 idx: i
 })).filter(x => S.activeT.has(x.q.theme) && S.activeD.has(x.q.diff) && S.activeC.has(x.q.chapter));
 p = [];
 base.forEach(item => {
 const qs = S.qstats[item.idx] || {
 ok: 0,
 tot: 0
 };
 const rate = qs.tot > 0 ? qs.ok / qs.tot : 0.5;
 const weight = qs.tot === 0 ? 1 : Math.max(1, Math.round((1 - rate) * 4));
 for (let w = 0; w < weight; w++) p.push(item);
 });
 if (!p.length) p = base;
 } else p = ALL_Q.map((q, i) => ({
 q,
 idx: i
 })).filter(x => S.activeT.has(x.q.theme) && S.activeD.has(x.q.diff) && S.activeC.has(x.q.chapter));
 if (!p.length) p = ALL_Q.map((q, i) => ({
 q,
 idx: i
 }));
 S.pool = shuffle(p);
 S.pi = 0;
 const _pb = document.getElementById('q-progress-bar');
 if (_pb) _pb.style.width = '0%';
 }

 function getNext() {
 if (S.pi >= S.pool.length) {
 if (S.mode === 'normal' || S.mode === 'smart') buildPool();
 else S.pi = 0;
 }
 return S.pool[S.pi++] || {
 q: ALL_Q[0],
 idx: 0
 };
 }

 function stopTimer() {
 if (S.timerInt) {
 clearInterval(S.timerInt);
 S.timerInt = null;
 }
 document.getElementById('timer-bar-wrap').style.display = S.timerSec > 0 ? '' : 'none';
 }

 function startTimer() {
 stopTimer();
 if (!S.timerSec) return;
 const wrap = document.getElementById('timer-bar-wrap'),
 bar = document.getElementById('timer-bar');
 wrap.style.display = '';
 S.timerLeft = S.timerSec;
 bar.style.width = '100%';
 bar.style.background = 'var(--cyan)';
 S.timerInt = setInterval(() => {
 S.timerLeft--;
 const p = Math.max(0, S.timerLeft / S.timerSec * 100);
 bar.style.width = p + '%';
 bar.style.background = p < 33 ? 'var(--red)' : p < 66 ? 'var(--gold)' : 'var(--cyan)';
 if (S.timerLeft <= 0) {
 stopTimer();
 if (!S.answered) doSkip();
 }
 }, 1000);
 }

 function getRank(xp) {
 for (let i = RANKS.length - 1; i >= 0; i--)
 if (xp >= RANKS[i].min) return {
 rank: RANKS[i],
 idx: i
 };
 return {
 rank: RANKS[0],
 idx: 0
 };
 }

 function addXp(pts, contextTags) {
   const prev = getRank(S.xp);
   S.xp += pts;
   // Publication des tags pour le bridge (lecture juste avant lsSet('xp'))
   try { window.__casInBonusTags = Array.isArray(contextTags) ? contextTags.slice() : null; } catch {}
   lsSet('xp', S.xp);
   try { window.__casInBonusTags = null; } catch {}
   const curr = getRank(S.xp);
   updateXpBar();
   updateRankFlavor();
   if (curr.idx > prev.idx) {
     showRankUp(curr.rank);
 checkMilestoneByRank(curr.idx);
 } else {
 // Toast when close to next rank
 checkCloseToNextRank(prev.idx);
 }
 }
 // Thresholds at which we notify (XP remaining)
 const RANK_CLOSE_THRESHOLDS = [50, 20, 5];
 let _lastRankCloseNotif = 0;

 function checkCloseToNextRank(rankIdx) {
 const next = RANKS[rankIdx + 1];
 if (!next) return; // already max rank
 const remaining = next.min - S.xp;
 for (const threshold of RANK_CLOSE_THRESHOLDS) {
 if (remaining <= threshold && remaining > 0) {
 // Only notify once per threshold crossing (debounce 10s)
 const now = Date.now();
 if (now - _lastRankCloseNotif < 10000) return;
 _lastRankCloseNotif = now;
 const {
 rank
 } = getRank(S.xp);
 showToast('streak-toast', `⬆️ Plus que ${remaining} XP pour ${next.emoji} ${next.name} !`, 3500);
 return;
 }
 }
 }

 function updateXpBar() {
 // Phase 2 v2.10 : éléments d'affichage déplacés vers profile-banner (transversal).
 // Stub conservé : les call-sites appellent encore cette fonction, mais l'affichage
 // est désormais géré par js/profile/profile-banner.js qui réagit aux events Profile.
 }

 function getComboMultiplier() {
 if (S.streak >= 12) return 3;
 if (S.streak >= 6) return 2;
 if (S.streak >= 3) return 1.5;
 return 1;
 }

 function updateComboDisplay() {
 const m = getComboMultiplier();
 const cd = document.getElementById('combo-display');
 const cb = document.getElementById('combo-badge');
 if (m > 1) {
 cd.style.display = '';
 cd.textContent = `⚡ ×${m}`;
 cd.style.color = m >= 2 ? 'var(--gold)' : 'var(--red)';
 if (cb) {
 cb.style.display = '';
 cb.textContent = `⚡ COMBO ×${m}`;
 }
 document.body.style.setProperty('--grid-speed', m >= 2 ? '8s' : '15s');
 document.getElementById('question-card').classList.toggle('combo-x2', m >= 2);
 document.getElementById('question-card').classList.toggle('combo-active', m >= 1.5 && m < 2);
 } else {
 cd.style.display = 'none';
 if (cb) cb.style.display = 'none';
 document.body.style.setProperty('--grid-speed',
  '30s');
 document.getElementById('question-card').classList.remove('combo-active',
  'combo-x2');
 }
 S.maxCombo = Math.max(S.maxCombo, S.streak);
 }

 function updateStreakDisplay() {
 // Phase 2 v2.10 : #streak-display déplacé vers profile-banner.
 // On préserve uniquement l'appel à updateComboDisplay() qui touche
 // #combo-display, #combo-badge, #question-card (toujours présents).
 updateComboDisplay();
 }
 let _toastTimers = {};

 function showToast(id, msg, duration = 2200) {
 const t = document.getElementById(id);
 if (!t) return;
 t.textContent = msg;
 t.classList.add('show');
 clearTimeout(_toastTimers[id]);
 _toastTimers[id] = setTimeout(() => t.classList.remove('show'), duration);
 }

 function spawnParticles(x, y, ok) {
 const wrap = document.getElementById('particles-wrap');
 const cols = ok ? ['#30e88a',
  '#00e5cc',
  '#7affea',
  '#ffffff'] : ['#ff4060',
  '#ff8080',
  '#ffd0d0'];
        const count = ok ? 18 : 8;
        for (let i = 0; i < count; i++) {
          const el = document.createElement('div');
          const sz = 4 + Math.random() * 6;
          const angle = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 80;
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist - 50;
          el.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:${Math.random()>.5?'50%':'2px'};background:${cols[0|Math.random()*cols.length]};left:${x}px;top:${y}px;pointer-events:none;--dx:${dx}px;--dy:${dy}px;--rot:${Math.random()*720}deg;animation:particleFly ${0.5+Math.random()*.4}s ease-out forwards;`;
          wrap.appendChild(el);
          setTimeout(() => el.remove(), 900);
        }
      }

      function renderQuestion(item) {
        const {
          q,
          idx
        } = item;
        S.curQ = q;
        S.curIdx = idx;
        S.answered = false;
        S.sel = new Set();
        S.selCorrect = new Map();
        S._hintUsedThisQ = false;
        _qRenderTime = Date.now();
        const hb = document.getElementById('hint-btn');
        if (hb) {
          hb.disabled = S.hintsLeft <= 0;
          const hc = document.getElementById('hint-count');
          if (hc) hc.textContent = S.hintsLeft;
        }
        const isBoss = (S.total > 0 && S.total % 50 === 0 && q.diff === 'hard');
        const card = document.getElementById('question-card');
        card.className = 'card ' + q.diff + (isBoss ? ' boss' : '');
        if (isBoss) {
          showToast('combo-toast', '💀 BOSS QUESTION — difficulté maximale !', 3000);
          spawnParticles(window.innerWidth / 2, window.innerHeight / 2, false);
        }
        const tt = document.getElementById('theme-tag');
        tt.textContent = '▸ ' + q.theme;
        tt.style.color = TC[q.theme] || 'var(--text)';
        const ct = document.getElementById('chapter-tag');
        if (ct) {
          ct.textContent = q.chapter || '';
          ct.style.display = q.chapter ? '' : 'none';
        }
        const db = document.getElementById('diff-badge');
        db.className = 'diff-badge ' + q.diff;
        document.getElementById('diff-text').textContent = DIFF_LABELS[q.diff];
        const m = getComboMultiplier();
        const basePts = DIFF_PTS[q.diff];
        const bonusPts = m > 1 ? Math.round(basePts * (m - 1)) : 0;
        document.getElementById('pts-text').textContent = basePts + (bonusPts > 0 ? ` +${bonusPts}` : '') + ' pt' + (basePts > 1 ? 's' : '');
        updateComboDisplay();
        const qc = document.getElementById('q-counter');
        if (qc && S.pool.length) {
          const cur = Math.min(S.pi, S.pool.length);
          const tot = S.pool.length;
          const pct = Math.round(cur / tot * 100);
          const ctEl = document.getElementById('q-counter-text');
          const ptEl = document.getElementById('q-counter-pct');
          if (ctEl) ctEl.textContent = `Question ${cur} / ${tot}`;
          if (ptEl) ptEl.textContent = pct + '%';
          const pb = document.getElementById('q-progress-bar');
          if (pb) pb.style.width = pct + '%';
        }
        document.getElementById('question-text').innerHTML = sanitizeHTML(q.q);
        document.getElementById('multi-hint').style.display = q.type === 'multi' ? '' : 'none';
        const bb = document.getElementById('bookmark-btn');
        bb.textContent = S.bookmarks.has(idx) ? '⭐' : '☆';
        bb.className = 'bookmark-btn' + (S.bookmarks.has(idx) ? ' active' : '');
        const ch = document.getElementById('choices');
        ch.innerHTML = '';
        const L = ['A', 'B', 'C', 'D', 'E'];
        const shuffled = [...q.opts.map((_, i) => i)];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = 0 | Math.random() * (i + 1);
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const ansSet = new Set(q.answers);
        shuffled.forEach((origI, newI) => {
          const btn = document.createElement('button');
          btn.className = 'choice-btn';
          btn.dataset.idx = newI;
          btn.dataset.origIdx = origI;
          btn.innerHTML = `
          																		<span class="choice-letter">${L[newI]}</span>
																		<span>${q.opts[origI]}</span>`;
          const isCorrect = ansSet.has(origI);
          btn.addEventListener('click', () => toggleChoice(btn, newI, q.type, isCorrect));
          ch.appendChild(btn);
        });
        document.getElementById('feedback').style.display = 'none';
        document.getElementById('feedback').innerHTML = '';
        document.getElementById('feedback').dataset.pendingExpl = '';
        const vb = document.getElementById('validate-btn');
        vb.style.display = q.type === 'multi' ? 'block' : 'none';
        vb.disabled = true;
        vb.textContent = 'Valider';
        document.getElementById('skip-btn').style.display = 'block';
        document.getElementById('next-btn').style.display = 'none';
        startTimer();
        clearGodModeHints();
        if (_godMode) setTimeout(revealGodModeHints, 50);
      }

      function toggleChoice(btn, i, type, isCorrect) {
        if (S.answered) return;
        if (type === 'single') {
          document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
          S.sel = new Set([i]);
          S.selCorrect = new Map([
            [i, isCorrect]
          ]);
          btn.classList.add('selected');
          validate();
        } else {
          if (!S.selCorrect) S.selCorrect = new Map();
          if (S.sel.has(i)) {
            S.sel.delete(i);
            S.selCorrect.delete(i);
            btn.classList.remove('selected');
          } else {
            S.sel.add(i);
            S.selCorrect.set(i, isCorrect);
            btn.classList.add('selected');
          }
          const vb = document.getElementById('validate-btn');
          vb.disabled = S.sel.size === 0;
          vb.textContent = S.sel.size > 0 ? 'Valider (' + S.sel.size + ' sél.)' : 'Valider';
        }
      }

      function validate() {
        if (S.answered || !S.sel.size) return;
        stopTimer();
        S.answered = true;
        const q = S.curQ;
        const selCorrect = S.selCorrect || new Map();
        const ok = [...selCorrect.values()].filter(Boolean).length === q.answers.length && S.sel.size === q.answers.length;
        const basePts = ok ? DIFF_PTS[q.diff] : 0;
        const m = getComboMultiplier();
        const pts = ok ? Math.round(basePts * m) : 0;
        S.total++;
        markPlayedToday();
        maybeShowForensicAlert();
        if (ok) {
          const hintPenalty = S._hintUsedThisQ ? 0.5 : 1;
          const elapsed = (Date.now() - _qRenderTime) / 1000;
          const speedBonus = (elapsed < 5 && !S.timerSec && !S._hintUsedThisQ) ? 1 : 0;
          S.score += pts;
          S.correct++;
          S.streak++;
          S.maxStreak = Math.max(S.maxStreak, S.streak);
          S.maxCombo = Math.max(S.maxCombo, S.streak);
          addXp(Math.max(1, Math.round(pts * hintPenalty)) + speedBonus, q.theme ? [q.theme] : null);
          if (speedBonus) showToast('combo-toast', '⚡ Speed bonus +1 XP !', 1500);
          checkDorOffer();
          if (STREAK_MSGS[S.streak]) showToast('streak-toast', STREAK_MSGS[S.streak]);
          if (S.streak === 6 || S.streak === 12) {
            const cm = getComboMultiplier();
            showToast('combo-toast', `⚡ COMBO ×${cm} ! Points ×${cm} !`, 3000);
          }
          if (S.mode === 'smart') S.smartCount++;
        } else {
          S.streak = 0;
          S.errors.push(S.curIdx);
          triggerScreenShake();
          if (S.mode === 'survival') {
            loseLife();
          }
        }
        resolveDor(ok);
        trackComeback(ok);
        if (navigator.vibrate) {
          navigator.vibrate(ok ? [50] : [80, 30, 80]);
        }
        checkSecrets(ok);
        const sm2Result = updateSM2(S.curIdx, ok);
        // En mode SM-2, afficher la prochaine révision pour ancrer la mémorisation
        if (S.mode === 'sm2' && sm2Result) {
          const intervalLabel = sm2Result.interval === 1
            ? 'demain'
            : sm2Result.interval < 7
              ? `dans ${sm2Result.interval} jours`
              : sm2Result.interval < 30
                ? `dans ${Math.round(sm2Result.interval / 7)} semaines`
                : `dans ${Math.round(sm2Result.interval / 30)} mois`;
          const icon = ok ? '✓' : '↻';
          const msg = ok
            ? `${icon} Prochaine révision ${intervalLabel}`
            : `${icon} Carte remise à zéro — révision demain`;
          setTimeout(() => showToast('streak-toast', `🃏 ${msg}`, 2200), 1200);
        }
        S.byDiff[q.diff].tot++;
        if (ok) S.byDiff[q.diff].ok++;
        if (!S.byTheme[q.theme]) S.byTheme[q.theme] = {
          ok: 0,
          tot: 0
        };
        S.byTheme[q.theme].tot++;
        if (ok) S.byTheme[q.theme].ok++;
        if (q.chapter) {
          if (!S.byChapter[q.chapter]) S.byChapter[q.chapter] = {
            ok: 0,
            tot: 0
          };
          S.byChapter[q.chapter].tot++;
          if (ok) S.byChapter[q.chapter].ok++;
          if (ok) { checkBossTrigger(q.chapter); checkFicheUnlock(q.chapter); }
        }
        const qs = S.qstats[S.curIdx] || {
          ok: 0,
          tot: 0
        };
        qs.tot++;
        if (ok) qs.ok++;
        S.qstats[S.curIdx] = qs;
        const sd = document.getElementById('score-display');
        sd.textContent = S.score + ' pts';
        if (ok) {
          sd.classList.remove('bump');
          void sd.offsetWidth;
          sd.classList.add('bump');
        }
        updateStreakDisplay();
        document.querySelectorAll('.choice-btn').forEach(btn => {
          btn.disabled = true;
          const origI = +btn.dataset.origIdx;
          const newI = +btn.dataset.idx;
          if (q.answers.includes(origI)) btn.classList.add('correct');
          else if (S.sel.has(newI)) {
            btn.classList.add('wrong');
          }
        });
        if (ok) {
          const firstCorrect = document.querySelector('.choice-btn.correct');
          if (firstCorrect) {
            const r = firstCorrect.getBoundingClientRect();
            const wrap = document.getElementById('particles-wrap');
            const wr = wrap.getBoundingClientRect();
            spawnParticles(r.left - wr.left + r.width / 2, r.top - wr.top + r.height / 2, true);
          }
        }
        const fb = document.getElementById('feedback');
        fb.className = ok ? 'ok' : 'ko';
        const _pname = S.avatarName && S.avatarName !== 'Enquêteur' ? ` ${S.avatarName} !` : '!';
        const msg = ok ? FEEDBACK_OK[Math.floor(Math.random() * FEEDBACK_OK.length)].replace('!', _pname) : FEEDBACK_KO[Math.floor(Math.random() * FEEDBACK_KO.length)];
        const ptsLine = ok && pts > basePts ? `
          																		<span class="pts-earned"> +${pts} pts (×${m} combo !)</span>` : (ok ? `
          																		<span class="pts-earned"> +${pts} pt${pts>1?'s':''}</span>` : '');
        const showTip = Math.random() < 0.25;
        const tipLine = showTip ? `
          																		<div style="margin-top:10px;padding:8px 10px;border-radius:7px;background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);font-size:12px;color:var(--dim)">${FORENSIC_TIPS[Math.floor(Math.random()*FORENSIC_TIPS.length)]}</div>` : '';
        const explTxt = sanitizeHTML(ok ? (q.expl_ok || q.expl_ko || '') : (q.expl_ko || q.expl_ok || ''));
        const explStyle = ok ? 'margin-top:10px;padding:9px 11px;border-radius:7px;font-size:12px;line-height:1.65;background:rgba(48,232,138,.15);border:1px solid rgba(48,232,138,.3);color:var(--text-ok)' : 'margin-top:10px;padding:9px 11px;border-radius:7px;font-size:12px;line-height:1.65;background:rgba(255,64,96,.15);border:1px solid rgba(255,64,96,.3);color:#ffe0e5';
        const explLine = explTxt ? `
																		<div class="feedback-expl" style="${explStyle}">${explTxt}</div>` : '';
        const refsLine = (q.refs && q.refs.length) ? `<div style="margin-top:8px;padding:6px 10px;border-radius:6px;font-size:11px;line-height:1.5;background:rgba(120,120,180,.08);border:1px solid rgba(120,120,180,.18);color:var(--dim)">📚 ${q.refs.map(r=>`<em>${sanitizeHTML(r)}</em>`).join(' · ')}</div>` : '';
        fb.innerHTML = msg + ptsLine + tipLine + explLine + refsLine;
        fb.dataset.pendingExpl = explTxt;
        fb.dataset.pendingOk = ok ? '1' : '0';
        fb.style.display = 'block';
        requestAnimationFrame(() => fb.scrollIntoView({ // one-shot RAF
          behavior: 'smooth',
          block: 'nearest'
        }));
        document.getElementById('validate-btn').style.display = 'none';
        document.getElementById('skip-btn').style.display = 'none';
        document.getElementById('next-btn').style.display = 'block';
        // Phase 2 v2.10 : #expl-btn supprimé (explication désormais inline dans #feedback).
        clearGodModeHints();
        playSound(ok);
        savePersist();
        checkAchievements();
        checkMilestone();
        maybeTriggerMidSession();
      }

      function doSkip() {
        stopTimer();
        S.streak = 0;
        S.skipsTotal++;
        if (S.skipsTotal >= 20) {
          if (!S._secretFlags.skip20) {
            S._secretFlags.skip20 = true;
            lsSet('secretFlags', S._secretFlags);
          }
        }
        updateStreakDisplay();
        playSound(null);
        nextQuestion();
      }

      function nextQuestion() {
        const card = document.getElementById('question-card');
        if (!card) {
          renderQuestion(getNext());
          return;
        }
        card.classList.add('card-flipping-out');
        setTimeout(() => {
          card.classList.remove('card-flipping-out');
          // Hide during DOM swap to prevent ghost frame
          card.style.visibility = 'hidden';
          card.style.animation = 'none';
          renderQuestion(getNext());
          // Double rAF (one-shot): first commits DOM, second triggers paint
          requestAnimationFrame(() => requestAnimationFrame(() => {
            card.style.animation = '';
            card.style.visibility = '';
            card.classList.add('card-flipping-in');
            setTimeout(() => card.classList.remove('card-flipping-in'), 240);
          }));
        }, 190);
      }

      function openExplModal() {
        const fb = document.getElementById('feedback');
        const expl = fb.dataset.pendingExpl || '';
        const ok = fb.dataset.pendingOk === '1';
        if (!expl) return;
        const overlay = document.getElementById('expl-overlay');
        const badge = document.getElementById('expl-status-badge');
        const body = document.getElementById('expl-body');
        badge.textContent = ok ? '✓ Correct' : '✗ Incorrect';
        badge.style.background = ok ? 'rgba(48,232,138,.12)' : 'rgba(255,64,96,.12)';
        badge.style.color = ok ? 'var(--green)' : 'var(--red)';
        badge.style.border = ok ? '1px solid rgba(48,232,138,.3)' : '1px solid rgba(255,64,96,.3)';
        body.innerHTML = expl;
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }

      function closeExplModal(e) {
        if (e && e.target && e.target !== document.getElementById('expl-overlay')) return;
        document.getElementById('expl-overlay').style.display = 'none';
        document.body.style.overflow = '';
      }

      function toggleBookmark() {
        const idx = S.curIdx;
        S.bookmarks.has(idx) ? S.bookmarks.delete(idx) : S.bookmarks.add(idx);
        const bb = document.getElementById('bookmark-btn');
        bb.textContent = S.bookmarks.has(idx) ? '⭐' : '☆';
        bb.className = 'bookmark-btn' + (S.bookmarks.has(idx) ? ' active' : '');
        savePersist();
      }
      let _ac = null;

      function ac() {
        if (!_ac) try {
          _ac = new(window.AudioContext || window.webkitAudioContext)();
        } catch {}
        return _ac;
      }

      function playSound(ok) {
        if (!SOUND_ON) return;
        const a = ac();
        if (!a) return;
        const t = a.currentTime;
        if (ok === null) {
          const o = a.createOscillator(),
            g = a.createGain();
          o.connect(g);
          g.connect(a.destination);
          o.frequency.setValueAtTime(350, t);
          o.frequency.linearRampToValueAtTime(250, t + .15);
          g.gain.setValueAtTime(.08, t);
          g.gain.exponentialRampToValueAtTime(.001, t + .2);
          o.start(t);
          o.stop(t + .2);
        } else if (ok) {
          const m = getComboMultiplier();
          const notes = m >= 2 ? [523, 659, 784, 1047] : [523, 659, 784];
          notes.forEach((f, i) => {
            const o = a.createOscillator(),
              g = a.createGain();
            o.connect(g);
            g.connect(a.destination);
            o.frequency.value = f;
            g.gain.setValueAtTime(.12, t + i * .07);
            g.gain.exponentialRampToValueAtTime(.001, t + i * .07 + .2);
            o.start(t + i * .07);
            o.stop(t + i * .07 + .25);
          });
        } else {
          const o = a.createOscillator(),
            g = a.createGain();
          o.connect(g);
          g.connect(a.destination);
          o.frequency.setValueAtTime(220, t);
          o.frequency.exponentialRampToValueAtTime(110, t + .3);
          g.gain.setValueAtTime(.18, t);
          g.gain.exponentialRampToValueAtTime(.001, t + .3);
          o.start(t);
          o.stop(t + .3);
        }
      }

      function toggleSound() {
        SOUND_ON = !SOUND_ON;
        lsSet('soundOn', SOUND_ON);
        document.getElementById('sound-btn').textContent = SOUND_ON ? '🔊' : '🔇';
        if (SOUND_ON) playSound(true);
      }

      function applyVisualTheme(id) {
        document.body.dataset.theme = id === 'default' ? '' : id;
        lsSet('visualTheme', id);
      }

      function buildVisualThemeUI() {
        const wrap = document.getElementById('visual-themes');
        if (!wrap) return;
        wrap.innerHTML = '';
        VISUAL_THEMES.forEach(t => {
          const locked = t.minXp && S.xp < t.minXp;
          const curr = lsGet('visualTheme', 'default');
          const d = document.createElement('div');
          d.className = 'theme-card' + (curr === t.id ? ' active' : '') + (locked ? ' locked' : '');
          const preview = document.createElement('div');
          preview.className = 'theme-preview';
          preview.style.background = `linear-gradient(135deg,${t.colors[0]},${t.colors[1]})`;
          d.innerHTML = `
          																		<div class="theme-name" style="color:${locked?'var(--dim)':t.colors[1]}">${locked?'🔒 ':''} ${t.name}</div>
																		<div class="theme-desc">${locked?'Requis: '+t.minXp+' XP':t.desc}</div>`;
          d.prepend(preview);
          if (!locked) {
            d.onclick = () => {
              applyVisualTheme(t.id);
              wrap.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
              d.classList.add('active');
            };
          }
          wrap.appendChild(d);
        });
      }

      function openSettings() {
        const tc = document.getElementById('theme-chips');
        tc.innerHTML = '';
        ALL_T.forEach(t => {
          const c = document.createElement('span');
          c.className = 'chip' + (S.activeT.has(t) ? ' active' : '');
          c.textContent = t;
          c.style.color = TC[t] || '#fff';
          if (S.activeT.has(t)) c.style.borderColor = TC[t] || '#fff';
          c.onclick = () => {
            if (S.activeT.has(t)) {
              S.activeT.delete(t);
              c.classList.remove('active');
              c.style.borderColor = '';
            } else {
              S.activeT.add(t);
              c.classList.add('active');
              c.style.borderColor = TC[t] || '#fff';
            }
          };
          tc.appendChild(c);
        });
        const cc = document.getElementById('chapter-chips');
        cc.innerHTML = '';
        ALL_T.forEach(t => {
          const chs = (window.THEME_CHAPTERS || {})[t];
          if (!chs || !chs.length) return;
          // Sous-titre thème avec tout ✓ / tout ✗ par groupe (DOM API : pas de JSON.stringify dans onclick)
          const grpHdr = document.createElement('div');
          grpHdr.className = 'chip-group-header';
          const titleSpan = document.createElement('span');
          titleSpan.className = 'chip-group-title';
          titleSpan.style.color = TC[t] || 'var(--dim)';
          titleSpan.textContent = t;
          const actionsSpan = document.createElement('span');
          actionsSpan.className = 'chip-group-actions';
          const btnAll = document.createElement('button');
          btnAll.type = 'button';
          btnAll.className = 'link-cyan';
          btnAll.textContent = 'tout ✓';
          btnAll.onclick = (e) => {
            e.preventDefault();
            chs.forEach(ch => {
              S.activeC.add(ch);
              cc.querySelectorAll('[data-ch]').forEach(el => {
                if (el.dataset.ch === ch) el.classList.add('active');
              });
            });
          };
          const btnNone = document.createElement('button');
          btnNone.type = 'button';
          btnNone.className = 'link-dim';
          btnNone.textContent = 'tout ✗';
          btnNone.onclick = (e) => {
            e.preventDefault();
            chs.forEach(ch => {
              S.activeC.delete(ch);
              cc.querySelectorAll('[data-ch]').forEach(el => {
                if (el.dataset.ch === ch) el.classList.remove('active');
              });
            });
          };
          actionsSpan.appendChild(btnAll);
          actionsSpan.appendChild(btnNone);
          grpHdr.appendChild(titleSpan);
          grpHdr.appendChild(actionsSpan);
          cc.appendChild(grpHdr);
          chs.forEach(ch => {
            const c = document.createElement('span');
            c.className = 'chip' + (S.activeC.has(ch) ? ' active' : '');
            c.dataset.ch = ch;
            c.textContent = ch;
            c.onclick = () => {
              if (S.activeC.has(ch)) {
                S.activeC.delete(ch);
                c.classList.remove('active');
              } else {
                S.activeC.add(ch);
                c.classList.add('active');
              }
            };
            cc.appendChild(c);
          });
        });
        const dc = document.getElementById('diff-chips');
        dc.innerHTML = '';
        ['easy', 'medium', 'hard'].forEach(d => {
          const col = d === 'easy' ? 'var(--easy)' : d === 'medium' ? 'var(--medium)' : 'var(--hard)';
          const c = document.createElement('span');
          c.className = 'chip' + (S.activeD.has(d) ? ' active' : '');
          c.dataset.d = d;
          c.textContent = DIFF_LABELS[d];
          c.style.color = col;
          if (S.activeD.has(d)) c.style.borderColor = col;
          c.onclick = () => {
            if (S.activeD.has(d)) {
              S.activeD.delete(d);
              c.classList.remove('active');
              c.style.borderColor = '';
            } else {
              S.activeD.add(d);
              c.classList.add('active');
              c.style.borderColor = col;
            }
          };
          dc.appendChild(c);
        });
        buildPersonaChips();
        const to = document.getElementById('timer-opts');
        to.innerHTML = '';
        [{
          l: 'Off',
          v: 0
        }, {
          l: '30s',
          v: 30
        }, {
          l: '60s',
          v: 60
        }, {
          l: '90s',
          v: 90
        }, {
          l: '2 min',
          v: 120
        }].forEach(o => {
          const b = document.createElement('button');
          b.className = 'timer-opt' + (S.timerSec === o.v ? ' active' : '');
          b.textContent = o.l;
          b.onclick = () => {
            S.timerSec = o.v;
            to.querySelectorAll('.timer-opt').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
          };
          to.appendChild(b);
        });
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === S.mode));
        buildVisualThemeUI();
        document.getElementById('settings-overlay').classList.add('show');
      }


      function selectAllChips(type) {
        if (type === 'theme') ALL_T.forEach(t => S.activeT.add(t));
        else if (type === 'chapter') ALL_C.forEach(c => S.activeC.add(c));
        openSettings();
      }
      function deselectAllChips(type) {
        if (type === 'theme') S.activeT.clear();
        else if (type === 'chapter') S.activeC.clear();
        openSettings();
      }


      // Sanitize HTML pour prévenir les injections XSS depuis le JSON
      function sanitizeHTML(raw) {
        const tmp = document.createElement('div');
        tmp.innerHTML = raw || '';
        tmp.querySelectorAll('script,iframe,object,embed,link,meta').forEach(el => el.remove());
        tmp.querySelectorAll('*').forEach(el => {
          [...el.attributes].forEach(attr => {
            if (attr.name.startsWith('on') ||
                (attr.name === 'href' && /^javascript:/i.test(attr.value)) ||
                (attr.name === 'src'  && /^javascript:/i.test(attr.value))) {
              el.removeAttribute(attr.name);
            }
          });
        });
        return tmp.innerHTML;
      }

      function applySettings() {
        if (!S.activeT.size) {
          showToast('streak-toast', '⚠️ Sélectionne au moins un thème pour continuer', 2800);
          return;
        }
        if (!S.activeD.size) {
          showToast('streak-toast', '⚠️ Sélectionne au moins une difficulté', 2800);
          return;
        }
        savePersist();
        saveSession();
        S.score = 0;
        S.correct = 0;
        S.total = 0;
        S.streak = 0;
        S.maxStreak = 0;
        S.combo = 1;
        S.byDiff = {
          easy: {
            ok: 0,
            tot: 0
          },
          medium: {
            ok: 0,
            tot: 0
          },
          hard: {
            ok: 0,
            tot: 0
          }
        };
        S.byTheme = {};
        S.byChapter = {};
        document.getElementById('score-display').textContent = '0 pts';
        updateStreakDisplay();
        buildPool();
        closeOverlay('settings-overlay');
        renderQuestion(getNext());
      }

      function showDailyBanner() {
        const banner = document.getElementById('daily-banner');
        const info = document.getElementById('db-info');
        const scoreEl = document.getElementById('db-score');
        const btn = document.getElementById('db-btn');
        info.textContent = '20 questions · même tirage pour tous';
        if (S.dailyDone) {
          scoreEl.textContent = `Score : ${S.dailyScore} pts`;
          btn.textContent = 'Rejouer';
          btn.style.opacity = '.6';
        } else {
          scoreEl.textContent = '';
          btn.textContent = 'Jouer';
          btn.style.opacity = '1';
        }
        banner.style.display = 'flex';
      }

      function startDailyChallenge() {
        S.mode = 'daily';
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'daily'));
        applySettings();
      }
      let EX = {
        n: 10,
        themes: new Set(),
        chapters: new Set(),
        pool: [],
        idx: 0,
        answers: [],
        sel: new Set()
      };

      function openExam() {
        EX.themes = new Set(ALL_T);
        EX.chapters = new Set(ALL_C);
        EX.n = 10;
        const tc = document.getElementById('exam-theme-chips');
        tc.innerHTML = '';
        ALL_T.forEach(t => {
          const c = document.createElement('span');
          c.className = 'chip active';
          c.textContent = t;
          c.style.color = TC[t] || '#fff';
          c.style.borderColor = TC[t] || '#fff';
          c.onclick = () => {
            if (EX.themes.has(t)) {
              EX.themes.delete(t);
              c.classList.remove('active');
              c.style.borderColor = '';
            } else {
              EX.themes.add(t);
              c.classList.add('active');
              c.style.borderColor = TC[t] || '#fff';
            }
          };
          tc.appendChild(c);
        });
        const cc = document.getElementById('exam-chapter-chips');
        cc.innerHTML = '';
        ALL_C.forEach(ch => {
          const c = document.createElement('span');
          c.className = 'chip active';
          c.textContent = ch;
          c.onclick = () => {
            if (EX.chapters.has(ch)) {
              EX.chapters.delete(ch);
              c.classList.remove('active');
            } else {
              EX.chapters.add(ch);
              c.classList.add('active');
            }
          };
          cc.appendChild(c);
        });
        document.querySelectorAll('[data-n]').forEach(c => c.classList.toggle('active', +c.dataset.n === 10));
        document.getElementById('exam-setup').style.display = '';
        document.getElementById('exam-active').style.display = 'none';
        document.getElementById('exam-results').style.display = 'none';
        document.getElementById('exam-overlay').classList.add('show');
      }

      function pickExamN(c) {
        document.querySelectorAll('[data-n]').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        EX.n = +c.dataset.n;
      }

      function startExam() {
        let p = ALL_Q.map((q, i) => ({
          q,
          idx: i
        })).filter(x => EX.themes.has(x.q.theme) && EX.chapters.has(x.q.chapter));
        EX.pool = shuffle(p).slice(0, EX.n);
        EX.idx = 0;
        EX.answers = [];
        document.getElementById('exam-setup').style.display = 'none';
        document.getElementById('exam-active').style.display = '';
        renderExamQ();
      }

      function renderExamQ() {
        const {
          q
        } = EX.pool[EX.idx];
        EX.sel = new Set();
        const prog = document.getElementById('exam-progress');
        prog.innerHTML = `
          																		<span style="font-size:12px;color:var(--dim)">${EX.idx+1} / ${EX.pool.length}</span>
																		<div class="exam-prog-bar">
																			<div class="exam-prog-fill" style="width:${EX.idx/EX.pool.length*100}%"></div>
																		</div>`;
        const tt = document.getElementById('exam-theme-tag');
        tt.textContent = '▸ ' + q.theme;
        tt.style.color = TC[q.theme] || '#fff';
        const ect = document.getElementById('exam-chapter-tag');
        if (ect) {
          ect.textContent = q.chapter || '';
          ect.style.display = q.chapter ? '' : 'none';
        }
        document.getElementById('exam-diff-badge').textContent = DIFF_LABELS[q.diff];
        document.getElementById('exam-diff-badge').className = 'diff-badge ' + q.diff;
        document.getElementById('exam-question-text').innerHTML = sanitizeHTML(q.q);
        document.getElementById('exam-multi-hint').style.display = q.type === 'multi' ? '' : 'none';
        const ch = document.getElementById('exam-choices');
        ch.innerHTML = '';
        const L = ['A', 'B', 'C', 'D', 'E'];
        const shuffled = [...q.opts.map((_, i) => i)];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = 0 | Math.random() * (i + 1);
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        shuffled.forEach((origI, newI) => {
          const btn = document.createElement('button');
          btn.className = 'choice-btn';
          btn.dataset.origIdx = origI;
          btn.dataset.newIdx = newI;
          btn.innerHTML = `
          																		<span class="choice-letter">${L[newI]}</span>
																		<span>${q.opts[origI]}</span>`;
          btn.onclick = () => {
            if (q.type === 'single') {
              ch.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
              EX.sel = new Set([origI]);
            } else {
              EX.sel.has(origI) ? (EX.sel.delete(origI), btn.classList.remove('selected')) : (EX.sel.add(origI));
            }
            btn.classList.toggle('selected', EX.sel.has(origI));
            const nb = document.getElementById('exam-next-btn');
            if (nb) {
              nb.disabled = EX.sel.size === 0;
              nb.style.opacity = EX.sel.size ? '1' : '.4';
            }
          };
          ch.appendChild(btn);
        });
        const nb = document.getElementById('exam-next-btn');
        if (nb) {
          nb.disabled = true;
          nb.style.opacity = '.4';
        }
      }

      function examNext() {
        if (EX.sel.size === 0) return;
        const {
          q,
          idx
        } = EX.pool[EX.idx];
        const sel = [...EX.sel].sort(),
          ans = [...q.answers].sort();
        const ok = sel.length === ans.length && sel.every((v, i) => v === ans[i]);
        EX.answers.push({
          q,
          idx,
          sel,
          ans,
          ok
        });
        EX.idx++;
        if (EX.idx >= EX.pool.length) {
          showExamResults();
          return;
        }
        renderExamQ();
      }

      function showExamResults() {
        document.getElementById('exam-active').style.display = 'none';
        document.getElementById('exam-results').style.display = '';
        const n = EX.answers.filter(a => a.ok).length,
          pct = Math.round(n / EX.answers.length * 100);
        const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '😎' : pct >= 50 ? '🤔' : pct >= 30 ? '😬' : '💀';
        const verdict = pct >= 90 ? 'Maîtrise parfaite !' : pct >= 70 ? 'Beau travail !' : pct >= 50 ? 'Encore un effort…' : pct >= 30 ? 'À retravailler !' : 'GG pour la tentative 😅';
        document.getElementById('exam-emoji').textContent = emoji;
        const vd = document.getElementById('exam-verdict');
        vd.textContent = verdict;
        vd.style.color = pct >= 70 ? 'var(--green)' : 'var(--red)';
        document.getElementById('exam-stat-grid').innerHTML = `
          																		<div class="stat-box">
																			<div class="stat-val">${n}/${EX.answers.length}</div>
																			<div class="stat-lbl">Bonnes réponses</div>
																		</div>
																		<div class="stat-box">
																			<div class="stat-val" style="color:${pct>=70?'var(--green)':'var(--red)'}">${pct}%</div>
																			<div class="stat-lbl">Score</div>
																		</div>`;
        // Save to exam history
        const examRec = {
          date: new Date().toLocaleDateString('fr-CH', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          n: EX.answers.length,
          correct: n,
          pct,
          themes: [...new Set(EX.answers.map(a => a.q.theme))].join(', '),
          emoji,
        };
        const examHist = lsGet('examHist', []);
        examHist.unshift(examRec);
        if (examHist.length > 20) examHist.pop();
        lsSet('examHist', examHist);
        if (pct === 100 && EX.answers.length >= 10) {
          S.perfectExam = true;
          lsSet('perfectExam', true);
        }
        checkExam42(pct);
        if (pct === 100 && EX.answers.length >= 20) {
          S.perfectExam20 = true;
          lsSet('perfectExam20', true);
        }
        checkAchievements();
        const xpBonus = Math.round(n * 2 * (1 + pct / 100));
        addXp(xpBonus);
        const rev = document.getElementById('exam-review');
        rev.innerHTML = '<h3 style="font-size:11px;color:var(--dim);text-transform:uppercase;margin-bottom:8px">Révision</h3>';
        EX.answers.forEach((a, i) => {
          const d = document.createElement('div');
          d.className = 'exam-result-item ' + (a.ok ? 'correct' : 'wrong');
          d.innerHTML = `
          																		<strong>${i+1}. ${a.q.q}</strong>
																		<br>
																			<span style="color:var(--dim)">Ta réponse : ${a.sel.map(s=>a.q.opts[s]).join(', ')||'—'}</span>
      ${!a.ok?`
          																			<br>
																				<span style="color:var(--green)">✓ Bonne réponse : ${a.ans.map(s=>a.q.opts[s]).join(', ')}</span>`:''}
      ${(a.ok?(a.q.expl_ok||a.q.expl_ko):(a.q.expl_ko||a.q.expl_ok))?`
          																				<br>
																					<div style="margin-top:8px;padding:8px 10px;border-radius:6px;font-size:12px;line-height:1.55;${a.ok?'background:rgba(48,232,138,.12);border:1px solid rgba(48,232,138,.25);color:var(--text-ok)':'background:rgba(255,64,96,.12);border:1px solid rgba(255,64,96,.25);color:#ffe0e5'}">${a.ok?(a.q.expl_ok||a.q.expl_ko):(a.q.expl_ko||a.q.expl_ok)}</div>`:''}
      ${(a.q.refs&&a.q.refs.length)?`<div style="margin-top:6px;padding:5px 9px;border-radius:5px;font-size:11px;line-height:1.5;background:rgba(120,120,180,.08);border:1px solid rgba(120,120,180,.18);color:var(--dim)">📚 ${a.q.refs.map(r=>'<em>'+r+'</em>').join(' · ')}</div>`:''}`;
          rev.appendChild(d);
        });
        checkAchievements();
      }

      function openBilan() {
        // === ÉTAT VIDE / ACTIF — bascule selon le nombre de questions répondues ===
        const isEmpty = !S.total;
        const emptyEl = document.getElementById('bilan-empty');
        const mainEl = document.getElementById('bilan-main');
        if (emptyEl && mainEl) {
          emptyEl.style.display = isEmpty ? 'block' : 'none';
          mainEl.style.display  = isEmpty ? 'none'  : 'block';
        }
        if (isEmpty) {
          // On affiche tout de même la modale (le HTML est ouvert ailleurs : event handler du bouton bilan)
          return;
        }

        const acc = S.total ? Math.round(S.correct / S.total * 100) : 0;
        const {
          rank
        } = getRank(S.xp);

        // === HERO CARD — rang en proéminence avec jauge XP + précision ===
        const heroEl = document.getElementById('bilan-hero');
        if (heroEl) {
          // Calcul progression vers prochain rang
          const nextRank = (typeof RANKS !== 'undefined' && Array.isArray(RANKS))
            ? RANKS.find(r => r.min > S.xp) : null;
          const prevMin = (typeof RANKS !== 'undefined' && Array.isArray(RANKS))
            ? (RANKS.filter(r => r.min <= S.xp).pop()?.min || 0) : 0;
          const nextMin = nextRank ? nextRank.min : (S.xp + 500);
          const xpInRank = S.xp - prevMin;
          const xpToNext = nextMin - prevMin;
          const xpPct = xpToNext > 0 ? Math.min(100, Math.round((xpInRank / xpToNext) * 100)) : 100;
          const accColor = acc >= 75 ? 'var(--green)' : acc >= 60 ? 'var(--gold)' : 'var(--red)';

          heroEl.innerHTML = '';
          const frag = document.createDocumentFragment();
          const left = document.createElement('div');
          left.className = 'bilan-hero-left';
          const emoji = document.createElement('div');
          emoji.className = 'bilan-hero-emoji';
          emoji.textContent = rank.emoji;
          left.appendChild(emoji);

          const mid = document.createElement('div');
          mid.className = 'bilan-hero-mid';
          const lbl = document.createElement('div');
          lbl.className = 'bilan-hero-label';
          lbl.textContent = 'Rang';
          const name = document.createElement('div');
          name.className = 'bilan-hero-name';
          name.textContent = rank.name.replace(/^[^ ]+ /, '');
          const track = document.createElement('div');
          track.className = 'bilan-hero-track';
          const fill = document.createElement('div');
          fill.className = 'bilan-hero-fill';
          fill.style.width = xpPct + '%';
          track.appendChild(fill);
          const sub = document.createElement('div');
          sub.className = 'bilan-hero-sub';
          sub.textContent = nextRank
            ? `${S.xp.toLocaleString()} / ${nextMin.toLocaleString()} XP · 🔥 série max ${S.maxStreak||0}`
            : `${S.xp.toLocaleString()} XP · Rang max · 🔥 série max ${S.maxStreak||0}`;
          mid.appendChild(lbl);
          mid.appendChild(name);
          mid.appendChild(track);
          mid.appendChild(sub);

          const right = document.createElement('div');
          right.className = 'bilan-hero-right';
          const accVal = document.createElement('div');
          accVal.className = 'bilan-hero-acc';
          accVal.textContent = acc + '%';
          accVal.style.color = accColor;
          const accLbl = document.createElement('div');
          accLbl.className = 'bilan-hero-acc-lbl';
          accLbl.textContent = 'Précision';
          right.appendChild(accVal);
          right.appendChild(accLbl);

          frag.appendChild(left);
          frag.appendChild(mid);
          frag.appendChild(right);
          heroEl.appendChild(frag);
        }

        document.getElementById('bilan-stats').innerHTML = `
          																					<div class="stat-box">
																						<div class="stat-val">${S.score}</div>
																						<div class="stat-lbl">Score</div>
																					</div>
																					<div class="stat-box">
																						<div class="stat-val">${S.total}</div>
																						<div class="stat-lbl">Questions</div>
																					</div>
																					<div class="stat-box">
																						<div class="stat-val" style="color:${acc>=70?'var(--green)':'var(--red)'}">${acc}%</div>
																						<div class="stat-lbl">Précision</div>
																					</div>
																					<div class="stat-box">
																						<div class="stat-val" style="color:var(--gold)">${S.maxStreak}</div>
																						<div class="stat-lbl">🔥 Meilleure série</div>
																					</div>
																					<div class="stat-box">
																						<div class="stat-val" style="color:var(--purple)">${S.xp}</div>
																						<div class="stat-lbl">XP Total</div>
																					</div>
																					<div class="stat-box">
																						<div class="stat-val" style="font-size:18px">${rank.emoji}</div>
																						<div class="stat-lbl">${rank.name.replace(/^[^ ]+ /,'')}</div>
																					</div>`;
        document.getElementById('bilan-diffs').innerHTML = ['easy', 'medium', 'hard'].map(d => {
          const {
            ok,
            tot
          } = S.byDiff[d];
          const p = tot ? Math.round(ok / tot * 100) : 0;
          const col = d === 'easy' ? 'var(--easy)' : d === 'medium' ? 'var(--medium)' : 'var(--hard)';
          return `
          																					<div class="diff-pill">
																						<div class="dv" style="color:${col}">${p}%</div>
																						<div class="dl">${DIFF_LABELS[d]}</div>
																					</div>`;
        }).join('');
        const tb = document.getElementById('theme-bars');
        tb.innerHTML = '';
        ALL_T.forEach(t => {
          const {
            ok,
            tot
          } = S.byTheme[t] || {
            ok: 0,
            tot: 0
          };
          const p = tot ? Math.round(ok / tot * 100) : 0;
          const row = document.createElement('div');
          row.className = 'tbar-row';
          row.innerHTML = `
          																					<span class="tbar-name" style="color:${TC[t]||'#fff'}">${t}</span>
																					<div class="tbar-bg">
																						<div class="tbar-fill" style="width:${p}%;background:${TC[t]||'#fff'}"></div>
																					</div>
																					<span class="tbar-pct">${tot?p+'%':'—'}</span>`;
          tb.appendChild(row);
        });
        const cbSection = document.getElementById('chapter-bars-section');
        const cb = document.getElementById('chapter-bars');
        if (cb) {
          cb.innerHTML = '';
          const activeChapters = ALL_C.filter(c => S.byChapter[c] && S.byChapter[c].tot > 0);
          if (activeChapters.length > 0) {
            if (cbSection) cbSection.style.display = '';
            activeChapters.forEach(c => {
              const {
                ok,
                tot
              } = S.byChapter[c] || {
                ok: 0,
                tot: 0
              };
              const p = tot ? Math.round(ok / tot * 100) : 0;
              const col = p >= 70 ? 'var(--green)' : p >= 40 ? 'var(--gold)' : 'var(--red)';
              const row = document.createElement('div');
              row.className = 'tbar-row';
              row.innerHTML = `
          																					<span class="tbar-name" style="color:var(--dim);font-size:10px" title="${c}">${c.length>14?c.substring(0,13)+'…':c}</span>
																					<div class="tbar-bg">
																						<div class="tbar-fill" style="width:${p}%;background:${col}"></div>
																					</div>
																					<span class="tbar-pct">${p}%</span>`;
              cb.appendChild(row);
            });
          } else {
            if (cbSection) cbSection.style.display = 'none';
          }
        }
        const calWrap = document.getElementById('streak-calendar');
        const dsInfo = document.getElementById('daily-streak-info');
        if (calWrap) {
          calWrap.innerHTML = '';
          const today = getDailyDate();
          const playdates = lsGet('playdates', []);
          const playSet = new Set(playdates);
          dsInfo.textContent = `🔥 ${S.dayStreak} jour${S.dayStreak>1?'s':''} de suite`;
          for (let i = 20; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const ds = d.toISOString().slice(0, 10);
            const dot = document.createElement('div');
            if (ds === today) dot.className = 'day-dot ' + (playSet.has(ds) ? 'today-done' : 'today-pending');
            else dot.className = 'day-dot ' + (playSet.has(ds) ? 'done' : '');
            dot.title = ds;
            calWrap.appendChild(dot);
          }
        }
        const c = document.getElementById('evo-canvas');
        const ctx = c.getContext('2d');
        c.width = c.offsetWidth || 560;
        c.height = 80;
        ctx.clearRect(0, 0, c.width, c.height);
        const hist = lsGet('sessions', []);
        if (hist.length >= 2) {
          const vals = hist.map(h => h.acc),
            n = vals.length;
          const xp = i => i * (c.width / (n - 1));
          const yp = v => c.height - 6 - (v / 100) * (c.height - 12);
          const grad = ctx.createLinearGradient(0, 0, 0, c.height);
          grad.addColorStop(0, 'rgba(0,229,204,.25)');
          grad.addColorStop(1, 'rgba(0,229,204,0)');
          ctx.beginPath();
          ctx.moveTo(xp(0), c.height);
          vals.forEach((v, i) => ctx.lineTo(xp(i), yp(v)));
          ctx.lineTo(xp(n - 1), c.height);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.strokeStyle = '#00e5cc';
          ctx.lineWidth = 2;
          ctx.beginPath();
          vals.forEach((v, i) => i === 0 ? ctx.moveTo(xp(i), yp(v)) : ctx.lineTo(xp(i), yp(v)));
          ctx.stroke();
          vals.forEach((v, i) => {
            ctx.fillStyle = '#00e5cc';
            ctx.beginPath();
            ctx.arc(xp(i), yp(v), 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#6a80a8';
            ctx.font = '10px sans-serif';
            ctx.fillText(v + '%', xp(i) - 8, yp(v) - 6);
          });
        } else {
          ctx.fillStyle = '#6a80a8';
          ctx.font = '12px sans-serif';
          ctx.fillText('Pas encore assez de sessions', 10, 40);
        }
        const fl = document.getElementById('flop-list');
        fl.innerHTML = '';
        const flops = Object.entries(S.qstats).filter(([, s]) => s.tot >= 2 && s.ok / s.tot < .6).sort((a, b) => a[1].ok / a[1].tot - b[1].ok / b[1].tot).slice(0, 5);
        if (!flops.length) fl.innerHTML = '<p style="font-size:12px;color:var(--dim)">🎉 Pas encore assez de données — ou tu es inarrêtable.</p>';
        else flops.forEach(([idx, s]) => {
          const q = ALL_Q[idx];
          if (!q) return;
          const d = document.createElement('div');
          d.className = 'flop-item';
          d.innerHTML = `
          																					<span class="flop-pct">${Math.round(s.ok/s.tot*100)}%</span>${q.q.substring(0,80)}…`;
          fl.appendChild(d);
        });
        // Exam history
        const examHistEl = document.getElementById('exam-hist-list');
        if (examHistEl) {
          const hist = lsGet('examHist', []);
          if (!hist.length) {
            examHistEl.innerHTML = `
																					<p style="font-size:12px;color:var(--dim)">Aucun examen passé pour l'instant.</p>`;
          } else {
            examHistEl.innerHTML = hist.map(h => {
              const pctColor = h.pct >= 80 ? 'var(--green)' : h.pct >= 50 ? 'var(--gold)' : 'var(--red)';
              return `
          																					<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;background:rgba(16,28,48,.7);border:1px solid rgba(26,45,74,.8);margin-bottom:6px;font-size:12px">
																						<span style="font-size:18px">${h.emoji}</span>
																						<span style="font-family:var(--font-mono);font-weight:700;color:${pctColor};min-width:36px">${h.pct}%</span>
																						<span style="color:var(--dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h.themes}</span>
																						<span style="color:var(--dim);font-size:10px;white-space:nowrap">${h.n}Q · ${h.date}</span>
																					</div>`;
            }).join('');
          }
        }
        document.getElementById('bilan-overlay').classList.add('show');
        renderWeeklyLB();
        setTimeout(drawRadar, 80);
      }

      function renderWeeklyLB() {
        const el = document.getElementById('weekly-lb');
        if (!el) return;
        const wl = lsGet('weeklyLB', {});
        const weeks = Object.entries(wl).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 4);
        if (!weeks.length) {
          el.innerHTML = '<p style="font-size:12px;color:var(--dim);text-align:center">Aucun score enregistré cette semaine.</p>';
          return;
        }
        el.innerHTML = weeks.map(([wk, v], i) => {
          const label = i === 0 ? 'Cette semaine' : i === 1 ? 'Semaine passée' : `S-${i+1}`;
          return `
          																					<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;background:rgba(16,28,48,.7);border:1px solid rgba(26,45,74,.8);margin-bottom:6px;font-size:13px">
																						<span style="font-size:16px">${i===0?'🥇':i===1?'🥈':'🥉'}</span>
																						<span style="color:var(--dim);font-size:11px;width:90px;flex-shrink:0">${label}</span>
																						<span style="font-family:var(--font-mono);color:var(--gold);font-weight:700">${v.score} pts</span>
																						<span style="color:var(--dim);font-size:11px;margin-left:auto">${v.acc}% · ${v.date}</span>
																					</div>`;
        }).join('');
      }

      function checkAchievements() {
        const unlocked = new Set(lsGet('achievements', []));
        let newOnes = [];
        ACHIEVEMENTS.forEach(a => {
          if (unlocked.has(a.id)) return;
          try {
            if (a.check(S)) {
              unlocked.add(a.id);
              newOnes.push(a);
            }
          } catch {}
        });
        if (newOnes.length) {
          lsSet('achievements', [...unlocked]);
          newOnes.forEach((a, i) => setTimeout(() => showAchievementPopup(a), i * 2500));
        }
      }

      function showAchievementPopup(a) {
        document.getElementById('ap-emoji').textContent = a.emoji;
        document.getElementById('ap-name').textContent = a.name;
        document.getElementById('ap-desc').textContent = a.desc;
        const p = document.getElementById('achievement-popup');
        p.classList.add('show');
        setTimeout(() => p.classList.remove('show'), 3000);
        playSound(true);
        addXp(25);
      }

      function openAchievements() {
        const unlocked = new Set(lsGet('achievements', []));
        const {
          rank,
          idx
        } = getRank(S.xp);
        const next = RANKS[idx + 1];
        const pct = next ? Math.min(100, Math.round((S.xp - rank.min) / (next.min - rank.min) * 100)) : 100;
        document.getElementById('xp-rank-panel').innerHTML = `
          																					<div class="rank-display">
																						<span class="rank-emoji">${rank.emoji}</span>
																						<div class="rank-info">
																							<div class="rank-name">${rank.name}</div>
																							<div style="font-size:10px;color:var(--purple);font-style:italic;margin-bottom:2px">${rank.flavor||''}</div>
																							<div class="rank-xp">${S.xp} XP${next?' · Prochain : '+next.name+' ('+next.min+' XP)':' · Rang maximum !'}</div>
																							<div class="rank-bar-outer">
																								<div class="rank-bar-inner" style="width:${pct}%"></div>
																							</div>
																						</div>
																					</div>
																					<div style="font-size:11px;color:var(--dim);margin-top:8px;text-align:center">
      ${unlocked.size} / ${ACHIEVEMENTS.length} succès débloqués
    </div>`;
        const grid = document.getElementById('achiev-grid');
        grid.innerHTML = '';
        const cats = [{
          label: 'Quantité',
          ids: ['first', 'ten', 'fifty', 'hundred', 'five00', 'thou', 'twoK']
        }, {
          label: 'Séries',
          ids: ['streak1', 'streak3', 'streak5', 'streak10', 'streak20', 'streak50']
        }, {
          label: 'Précision',
          ids: ['acc90', 'acc95', 'perfect', 'perfect20']
        }, {
          label: 'Combo',
          ids: ['combo', 'combo3']
        }, {
          label: 'Difficile',
          ids: ['hard10', 'hard50']
        }, {
          label: 'Régularité',
          ids: ['daily3', 'daily7', 'daily10', 'daily14', 'daily30']
        }, {
          label: 'Spéciaux',
          ids: ['night', 'comeback', 'allthemes', 'book10', 'book25', 'smart50', 'smart200', 'daily_ch', 'hint']
        }, {
          label: 'Secrets 🤫',
          ids: ['s_3am', 's_42', 's_13', 's_hints3', 's_speed5', 's_skip']
        }, ];
        cats.forEach(cat => {
          const catItems = ACHIEVEMENTS.filter(a => cat.ids.includes(a.id));
          if (!catItems.length) return;
          const h = document.createElement('div');
          h.className = 'achiev-cat';
          h.textContent = cat.label;
          grid.appendChild(h);
          catItems.forEach(a => {
            const ok = unlocked.has(a.id);
            const d = document.createElement('div');
            d.className = 'achiev-item' + (ok ? ' unlocked' : '');
            const isSecret = a.secret && !ok;
            d.className = 'achiev-item' + (ok ? ' unlocked' : '') + (a.secret ? ' secret' : '');
            d.innerHTML = `
          																					<span class="achiev-emoji">${isSecret?'❓':a.emoji}</span>
																					<div class="achiev-name">${isSecret?'???':a.name}</div>
																					<div class="achiev-desc">${isSecret?'Succès secret — à découvrir...':a.desc}</div>`;
            grid.appendChild(d);
          });
        });
        document.getElementById('achievements-overlay').classList.add('show');
      }

      function checkMilestone() {
        if (!S.total) return;
        const acc = Math.round(S.correct / S.total * 100);
        const shown = lsGet('ms', []);
        const {
          idx: rankIdx
        } = getRank(S.xp);
        MILESTONES.forEach(m => {
          if (shown.includes(m.id)) return;
          let cond = false;
          if (m.rankMin != null) cond = rankIdx >= m.rankMin;
          else if (m.streakOnly) cond = S.maxStreak >= m.minStreak;
          else cond = S.total >= m.minQ && acc >= m.minAcc;
          if (cond) {
            shown.push(m.id);
            lsSet('ms', shown);
            document.getElementById('ms-emoji').textContent = m.emoji;
            document.getElementById('ms-title').textContent = m.title;
            document.getElementById('ms-sub').textContent = m.sub;
            document.getElementById('ms-stats').textContent = S.total + ' questions · ' + acc + '% de réussite';
            document.getElementById('milestone-overlay').classList.add('show');
            launchConfetti(S.curQ?.theme);
          }
        });
      }

      function checkMilestoneByRank(idx) {
        const m = MILESTONES.find(m => m.rankMin === idx);
        if (m) {
          const shown = lsGet('ms', []);
          if (!shown.includes(m.id)) {
            shown.push(m.id);
            lsSet('ms', shown);
            document.getElementById('ms-emoji').textContent = m.emoji;
            document.getElementById('ms-title').textContent = m.title;
            document.getElementById('ms-sub').textContent = m.sub;
            document.getElementById('ms-stats').textContent = 'Rang atteint !';
            document.getElementById('milestone-overlay').classList.add('show');
            launchConfetti(S.curQ?.theme);
          }
        }
      }

      function closeMilestone() {
        document.getElementById('milestone-overlay').classList.remove('show');
        document.getElementById('confetti-wrap').innerHTML = '';
      }
      const THEME_CONFETTI = {
        'Informatique de base': ['💻', '🖥️', '🔌', '📱', '⌨️'],
        'Acquisition et analyse': ['🔍', '🧪', '📊', '🗂️', '🔎'],
        'Système de fichiers': ['📁', '📂', '💾', '🗃️', '📋'],
        'Spécificité des OS': ['🐧', '🪟', '🍎', '⚙️', '🖥️'],
        'Cryptologie': ['🔐', '🔑', '🛡️', '🔒', '⚖️'],
        'OSINT': ['🕵️', '🌐', '📡', '🗺️', '👁️'],
        'Droit': ['⚖️', '📜', '🏛️', '📋', '🔏'],
      };

      function launchConfetti(theme) {
        const w = document.getElementById('confetti-wrap');
        w.innerHTML = '';
        const cols = ['#00e5cc', '#f0c040', '#ff6b9d', '#30e88a', '#7ab8ff', '#a78bfa'];
        const emojis = theme && THEME_CONFETTI[theme] ? THEME_CONFETTI[theme] : null;
        for (let i = 0; i < 100; i++) {
          const p = document.createElement('div');
          if (emojis && Math.random() > 0.45) {
            // Emoji particle
            const em = emojis[Math.floor(Math.random() * emojis.length)];
            const sz = 14 + Math.random() * 12;
            p.style.cssText = `position:absolute;font-size:${sz}px;left:${Math.random()*100}%;top:-20px;pointer-events:none;user-select:none;animation:cffall ${1.4+Math.random()*2}s ${Math.random()*.6}s forwards`;
            p.textContent = em;
          } else {
            // Classic color particle
            const sz = 5 + Math.random() * 9;
            p.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:${Math.random()>.5?'50%':'2px'};background:${cols[0|Math.random()*6]};left:${Math.random()*100}%;top:-10px;animation:cffall ${1.2+Math.random()*2}s ${Math.random()*.5}s forwards`;
          }
          w.appendChild(p);
        }
      }

      function showRankUp(rank) {
        updateAvatarChip();
        const t = document.getElementById('rankup-toast');
        if (!t) return;
        document.getElementById('ru-emoji').textContent = rank.emoji;
        document.getElementById('ru-name').textContent = rank.name;
        document.getElementById('ru-flavor').textContent = rank.flavor || '';
        t.classList.remove('show');
        void t.offsetWidth;
        t.classList.add('show');
        const a = ac();
        if (a && SOUND_ON) {
          const t2 = a.currentTime;
          [523, 659, 784, 1047, 1319].forEach((f, i) => {
            const o = a.createOscillator(),
              g = a.createGain();
            o.connect(g);
            g.connect(a.destination);
            o.frequency.value = f;
            g.gain.setValueAtTime(.15, t2 + i * .1);
            g.gain.exponentialRampToValueAtTime(.001, t2 + i * .1 + .3);
            o.start(t2 + i * .1);
            o.stop(t2 + i * .1 + .35);
          });
        }
        setTimeout(() => t.classList.remove('show'), 3500);
        launchConfetti(S.curQ?.theme);
      }

      function useHint() {
        if (S.hintsLeft <= 0 || S.answered) return;
        const q = S.curQ;
        if (!q) return;
        const btns = [...document.querySelectorAll('.choice-btn:not(.hint-eliminated):not(:disabled)')];
        const wrong = btns.filter(btn => !q.answers.includes(+btn.dataset.origIdx));
        if (!wrong.length) return;
        const victim = wrong[Math.floor(Math.random() * wrong.length)];
        victim.classList.add('hint-eliminated');
        victim.disabled = true;
        S.hintsLeft--;
        S.hintsUsed++;
        S._hintUsedThisQ = true;
        lsSet('hintsUsed', S.hintsUsed);
        lsSet('hintsLeft', S.hintsLeft);
        const hc = document.getElementById('hint-count');
        if (hc) hc.textContent = S.hintsLeft;
        const hb = document.getElementById('hint-btn');
        if (hb && S.hintsLeft === 0) hb.disabled = true;
        checkAchievements();
        showToast('streak-toast', '💡 Indice utilisé — XP réduit de 50% pour cette question', 2000);
      }

      function resetHints() {
        const today = getDailyDate();
        if (lsGet('hintDate', '') !== today) {
          lsSet('hintDate', today);
          S.hintsLeft = 3;
          lsSet('hintsLeft', 3);
        } else {
          S.hintsLeft = lsGet('hintsLeft', 3);
        }
        const hc = document.getElementById('hint-count');
        if (hc) hc.textContent = S.hintsLeft;
        const hb = document.getElementById('hint-btn');
        if (hb) hb.disabled = S.hintsLeft <= 0;
      }

      function buildPersonaChips() {
        const wrap = document.getElementById('persona-chips');
        if (!wrap) return;
        wrap.innerHTML = '';
        PERSONAS.forEach(p => {
          const b = document.createElement('button');
          b.className = 'persona-btn';
          b.innerHTML = `${p.icon} ${p.label}`;
          b.title = p.desc;
          b.onclick = () => applyPersona(p);
          wrap.appendChild(b);
        });
      }

      function applyPersona(p) {
        S.activeD = new Set(p.diffs);
        document.querySelectorAll('[data-d]').forEach(c => {
          c.classList.toggle('active', S.activeD.has(c.dataset.d));
        });
        document.querySelectorAll('.persona-btn').forEach(b => {
          b.classList.toggle('active', b.title === p.desc);
        });
        showToast('streak-toast', `${p.icon} Profil ${p.label} activé`, 1800);
      }

      function showDailyQuote() {
        const seed = getDailySeed();
        const q = FORENSIC_QUOTES[seed % FORENSIC_QUOTES.length];
        const tb = document.getElementById('qb-text');
        const ab = document.getElementById('qb-author');
        if (tb && ab) {
          tb.textContent = '"' + q.q + '"';
          ab.textContent = '— ' + q.a;
        }
      }

      function trackComeback(correct) {
        if (!correct) {
          S._wrongRun = (S._wrongRun || 0) + 1;
          S._rightAfterWrong = 0;
          if (S._wrongRun >= 3) S._comebackPrimed = true;
        } else {
          if (S._comebackPrimed) {
            S._rightAfterWrong = (S._rightAfterWrong || 0) + 1;
            if (S._rightAfterWrong >= 5 && !S.comeback) {
              S.comeback = true;
              lsSet('comeback', true);
            }
          }
          S._wrongRun = 0;
        }
      }

      function updateRankFlavor() {
        // Phase 2 v2.10 : #rank-flavor déplacé vers profile-banner.
        // Stub conservé pour compatibilité avec les call-sites existants.
      }

      function closeOverlay(id) {
        document.getElementById(id).classList.remove('show');
      }

      function openHelp() {
        document.getElementById('help-overlay').classList.add('show');
      }
      document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'Escape') {
          // Fermer la modale d'explication
          const eo = document.getElementById('expl-overlay');
          if (eo && eo.style.display === 'flex') {
            eo.style.display = 'none';
            document.body.style.overflow = '';
            return;
          }
          // Fermeture universelle : tous les overlays visibles
          const allOverlays = [
            'settings-overlay','exam-overlay','bilan-overlay',
            'achievements-overlay','help-overlay','avatar-overlay',
            'share-overlay','scene-overlay','fiches-overlay'
          ];
          let closed = false;
          allOverlays.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.classList.contains('show')) {
              closeOverlay(id);
              closed = true;
            }
          });
          closeMilestone();
          return;
        }
        if (e.key === '?' || e.key === '/') {
          openHelp();
          return;
        }
        const numKey = parseInt(e.key);
        if (numKey >= 1 && numKey <= 4 && !S.answered) {
          const btns = [...document.querySelectorAll('.choice-btn:not(.hint-eliminated):not(:disabled)')];
          const btn = btns[numKey - 1];
          if (btn) btn.click();
          return;
        }
        if (e.key === ' ') {
          e.preventDefault();
          if (S.answered) {
            const nb = document.getElementById('next-btn');
            if (nb && nb.style.display !== 'none') nextQuestion();
          } else {
            const vb = document.getElementById('validate-btn');
            if (vb && vb.style.display !== 'none' && !vb.disabled) validate();
          }
          return;
        }
        if ((e.key === 'Enter' || e.key === 'ArrowRight') && S.answered) {
          const nb = document.getElementById('next-btn');
          if (nb && nb.style.display !== 'none') nextQuestion();
          return;
        }
        if (e.key === 'h' || e.key === 'H') {
          if (!S.answered) useHint();
          return;
        }
        if (e.key === 'b' || e.key === 'B') {
          toggleBookmark();
          return;
        }
        if ((e.key === 'e' || e.key === 'E') && S.answered) {
          openExplModal();
          return;
        }
      });

      function trackPlayedDate() {
        const today = getDailyDate();
        const dates = new Set(lsGet('playdates', []));
        dates.add(today);
        lsSet('playdates', [...dates].slice(-60));
      }
      startLoadingMessages();
      fetch(new URL('data/questions.json', document.baseURI)).then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' — data/questions.json introuvable');
        return r.json();
      }).then(data => {
        ALL_Q = data;
        ALL_T = [...new Set(ALL_Q.map(q => q.theme))].sort();
        ALL_C = [...new Set(ALL_Q.map(q => q.chapter).filter(Boolean))].sort();
        // Mapping thème → chapitres (pour affichage groupé dans les filtres)
        window.THEME_CHAPTERS = {};
        ALL_Q.forEach(q => {
          if (q.theme && q.chapter) {
            if (!window.THEME_CHAPTERS[q.theme]) window.THEME_CHAPTERS[q.theme] = new Set();
            window.THEME_CHAPTERS[q.theme].add(q.chapter);
          }
        });
        Object.keys(window.THEME_CHAPTERS).forEach(t => {
          window.THEME_CHAPTERS[t] = [...window.THEME_CHAPTERS[t]].sort();
        });
        ALL_T.forEach(t => {
          S.byTheme[t] = {
            ok: 0,
            tot: 0
          };
        });
        ALL_C.forEach(c => {
          S.byChapter[c] = {
            ok: 0,
            tot: 0
          };
        });
        loadPersist();
        trackPlayedDate();
        buildPersonaChips();
        showDailyQuote();
        resetHints();
        updateRankFlavor();
        if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone && !lsGet('installDismissed', false)) {
          document.getElementById('install-banner').style.display = 'flex';
        }
        buildPool();
        initSwipe();
        updateSM2Badge();
        initGlossary();
        updateFreezeBtn();
        stopLoadingMessages();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main').style.display = 'flex';
        updateStreakDisplay();
        updateXpBar();
        showDailyBanner();
        showSessionResumeToast();
        renderQuestion(getNext());
      }).catch(err => {
        document.getElementById('loading').innerHTML = `
          																					<div style="text-align:center;padding:20px;max-width:380px">
																						<div style="font-size:48px;margin-bottom:12px">🕵️</div>
																						<p style="font-weight:700;color:var(--red);margin-bottom:8px">Fichier introuvable !</p>
																						<p style="font-size:13px;color:var(--dim);margin-bottom:12px">${err.message}</p>
																						<p style="font-size:12px;color:var(--dim)">Vérifiez que 
																										
														
																	
																							<code style="background:rgba(255,255,255,.08);padding:2px 5px;border-radius:3px">data/questions.json</code> est accessible.
																									
													
																
																						</p>
																						<button type="button" onclick="location.reload()" style="margin-top:16px;padding:8px 20px;border-radius:8px;background:var(--cyan);color:#08101c;font-weight:700;cursor:pointer;">Réessayer</button>
																					</div>`;
      });

      function updateLivesDisplay() {
        const el = document.getElementById('lives-display');
        if (!el) return;
        if (S.mode === 'survival') {
          el.classList.add('active');
          el.innerHTML = '';
          for (let i = 0; i < 3; i++) {
            const span = document.createElement('span');
            span.className = 'life' + (i >= S.lives ? ' lost' : '');
            span.textContent = '❤️';
            el.appendChild(span);
          }
        } else {
          el.classList.remove('active');
        }
      }

      function loseLife() {
        if (S.mode !== 'survival') return;
        S.lives--;
        const hearts = [...document.querySelectorAll('#lives-display .life')];
        const losing = hearts.filter(h => !h.classList.contains('lost'))[hearts.filter(h => !h.classList.contains('lost')).length - 1];
        if (losing) {
          losing.classList.add('losing');
          setTimeout(() => {
            losing.classList.remove('losing');
            losing.classList.add('lost');
          }, 400);
        }
        if (S.lives <= 0) {
          setTimeout(() => showSurvivalGameOver(), 600);
        }
      }

      function showSurvivalGameOver() {
        const go = document.getElementById('survival-gameover');
        const score = document.getElementById('go-score');
        const sub = document.getElementById('go-sub');
        if (S.score > S.survivalBest) {
          S.survivalBest = S.score;
          lsSet('survivalBest', S.survivalBest);
        }
        score.textContent = `Score : ${S.score} pts · ${S.correct} bonnes réponses`;
        sub.textContent = `Record personnel : ${S.survivalBest} pts`;
        go.classList.add('show');
        launchConfetti();
        playSound(false);
      }

      function restartSurvival() {
        document.getElementById('survival-gameover').classList.remove('show');
        S.score = 0;
        S.correct = 0;
        S.total = 0;
        S.streak = 0;
        S.maxStreak = 0;
        S.lives = 3;
        S.byDiff = {
          easy: {
            ok: 0,
            tot: 0
          },
          medium: {
            ok: 0,
            tot: 0
          },
          hard: {
            ok: 0,
            tot: 0
          }
        };
        S.byTheme = {};
        S.byChapter = {};
        document.getElementById('score-display').textContent = '0 pts';
        updateStreakDisplay();
        updateLivesDisplay();
        buildPool();
        renderQuestion(getNext());
      }

      function exitSurvival() {
        document.getElementById('survival-gameover').classList.remove('show');
        S.mode = 'normal';
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'normal'));
        updateLivesDisplay();
        buildPool();
        renderQuestion(getNext());
      }

      function getSM2Data(idx) {
        const d = lsGet('sm2_' + idx, null);
        return d || {
          interval: 1,
          ef: 2.5,
          due: getDailyDate(),
          reps: 0
        };
      }

      function saveSM2Data(idx, d) {
        lsSet('sm2_' + idx, d);
      }

      function updateSM2(idx, ok) {
        const d = getSM2Data(idx);
        const q = ok ? 5 : 1;
        let {
          interval,
          ef,
          reps
        } = d;
        if (q >= 3) {
          if (reps === 0) interval = 1;
          else if (reps === 1) interval = 6;
          else interval = Math.round(interval * ef);
          reps++;
        } else {
          reps = 0;
          interval = 1;
        }
        ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
        const due = new Date();
        due.setDate(due.getDate() + interval);
        saveSM2Data(idx, {
          interval,
          ef,
          due: due.toISOString().slice(0, 10),
          reps
        });
        updateSM2Badge();
        // Retourne l'intervalle pour permettre l'affichage UX "Prochaine révision dans X jours"
        return { interval, reps, ef: ef.toFixed(2) };
      }

      // ── SM-2 Statistiques (vue agrégée pour UX) ──────────────────
      // Renvoie : { total, dueToday, dueThisWeek, mature, learning, avgEF, longestInterval }
      function getSM2Stats() {
        const today = getDailyDate();
        const todayD = new Date(today);
        const weekFromNow = new Date(todayD);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const weekDate = weekFromNow.toISOString().slice(0, 10);

        const cards = [];
        Object.keys(localStorage).forEach(k => {
          if (!k.startsWith('sm2_')) return;
          try {
            const d = JSON.parse(localStorage.getItem(k));
            if (d) cards.push(d);
          } catch {}
        });

        const stats = {
          total: cards.length,
          dueToday: 0,
          dueThisWeek: 0,
          mature: 0,        // reps >= 3 (la carte est "apprise")
          learning: 0,      // reps < 3
          avgEF: 0,
          longestInterval: 0,
        };
        if (!cards.length) return stats;

        let sumEF = 0;
        cards.forEach(c => {
          if (c.due <= today) stats.dueToday++;
          if (c.due <= weekDate) stats.dueThisWeek++;
          if ((c.reps || 0) >= 3) stats.mature++;
          else stats.learning++;
          sumEF += (c.ef || 2.5);
          stats.longestInterval = Math.max(stats.longestInterval, c.interval || 0);
        });
        stats.avgEF = (sumEF / cards.length).toFixed(2);
        return stats;
      }

      // ── SM-2 Reset complet (purge toutes les cartes) ────────────
      // Utile en début de préparation examen pour repartir à zéro.
      function resetSM2() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('sm2_'));
        if (!keys.length) {
          showToast('streak-toast', '🃏 Aucune carte SM-2 à réinitialiser', 2000);
          return false;
        }
        if (!confirm(`Réinitialiser tes ${keys.length} cartes de révision SM-2 ?\n\nCette action est IRRÉVERSIBLE.\nUtile en début de préparation à un examen.`)) {
          return false;
        }
        keys.forEach(k => localStorage.removeItem(k));
        S.smartCount = 0;
        lsSet('smartCount', 0);
        S.sm2Queue = [];
        lsSet('sm2q', []);
        updateSM2Badge();
        showToast('streak-toast', `🔄 ${keys.length} cartes SM-2 réinitialisées`, 2500);
        return true;
      }
      // Exposer pour usage depuis HTML/console
      window.resetSM2 = resetSM2;
      window.getSM2Stats = getSM2Stats;

      function getSM2Due() {
        const today = getDailyDate();
        const due = [];
        Object.keys(localStorage).forEach(k => {
          if (!k.startsWith('sm2_')) return;
          try {
            const idx = parseInt(k.slice(4));
            const d = JSON.parse(localStorage.getItem(k));
            if (d && d.due <= today) due.push(idx);
          } catch {}
        });
        return due;
      }

      function updateSM2Badge() {
        const due = getSM2Due();
        const badge = document.getElementById('sm2-badge');
        const count = document.getElementById('sm2-count');
        if (!badge || !count) return;
        if (due.length > 0) {
          badge.classList.remove('hidden');
          count.textContent = due.length;
        } else {
          badge.classList.add('hidden');
        }
      }

      function activateSM2Mode() {
        S.mode = 'sm2';
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'sm2'));
        buildPool();
        renderQuestion(getNext());
        showToast('streak-toast', `🃏 Mode SM-2 : ${getSM2Due().length} questions dues`, 2500);
      }

      function drawRadar() {
        const canvas = document.getElementById('radar-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const themes = Object.keys(TC);
        const n = themes.length;
        // Use actual pixel size (CSS may scale it, use canvas intrinsic size)
        const W = canvas.width,
          H = canvas.height;
        const cx = W / 2,
          cy = H / 2;
        // Leave 52px margin on each side for labels
        const R = Math.min(cx, cy) - 52;
        ctx.clearRect(0, 0, W, H);
        // Grid rings
        [0.25, 0.5, 0.75, 1].forEach(frac => {
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * R * frac,
              y = cy + Math.sin(angle) * R * frac;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = frac === 1 ? 'rgba(0,229,204,.25)' : 'rgba(26,45,74,.5)';
          ctx.lineWidth = frac === 1 ? 1.5 : 0.8;
          ctx.stroke();
          // Percentage label on the right axis at each ring
          if (frac < 1) {
            ctx.fillStyle = 'rgba(106,128,168,.5)';
            ctx.font = '8px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(frac * 100) + '%', cx + R * frac + 3, cy);
          }
        });
        // Axis lines
        themes.forEach((_, i) => {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
          ctx.strokeStyle = 'rgba(26,45,74,.7)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
        // Data polygon
        ctx.beginPath();
        themes.forEach((t, i) => {
          const {
            ok,
            tot
          } = S.byTheme[t] || {
            ok: 0,
            tot: 0
          };
          const pct = tot > 0 ? ok / tot : 0;
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(angle) * R * pct,
            y = cy + Math.sin(angle) * R * pct;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,229,204,.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,229,204,.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Helper: draw text with optional second line
        function drawLabel(ctx, lines, x, y, align, baseline, color, bold) {
          ctx.fillStyle = color;
          ctx.font = (bold ? '600 ' : '400 ') + '10px Inter, sans-serif';
          ctx.textAlign = align;
          ctx.textBaseline = baseline;
          const lh = 13; // line height
          const totalH = (lines.length - 1) * lh;
          const startY = baseline === 'middle' ? y - totalH / 2 : baseline === 'bottom' ? y - totalH : y;
          lines.forEach((line, li) => ctx.fillText(line, x, startY + li * lh));
        }
        // Labels per theme — two-line splits for long names
        const LABEL_MAP = {
          'Informatique de base': ['Info.', 'de base'],
          'Acquisition et analyse': ['Acquisition', '& analyse'],
          'Système de fichiers': ['Sys. de', 'fichiers'],
          'Spécificité des OS': ['Spéc.', 'des OS'],
          'Cryptologie': ['Cryptologie'],
          'OSINT': ['OSINT'],
          'Droit': ['Droit'],
        };
        themes.forEach((t, i) => {
          const {
            ok,
            tot
          } = S.byTheme[t] || {
            ok: 0,
            tot: 0
          };
          const pct = tot > 0 ? ok / tot : 0;
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          // Data point dot
          const dx = cx + Math.cos(angle) * R * pct,
            dy = cy + Math.sin(angle) * R * pct;
          ctx.beginPath();
          ctx.arc(dx, dy, 4, 0, Math.PI * 2);
          ctx.fillStyle = TC[t] || '#00e5cc';
          ctx.fill();
          // Label position: push further out to avoid overlap with ring
          const labelDist = R + 32;
          const lx = cx + Math.cos(angle) * labelDist;
          const ly = cy + Math.sin(angle) * labelDist;
          // Alignment based on angle quadrant
          const cos = Math.cos(angle),
            sin = Math.sin(angle);
          const hAlign = Math.abs(cos) < 0.2 ? 'center' : cos > 0 ? 'left' : 'right';
          const vAlign = Math.abs(sin) < 0.2 ? 'middle' : sin > 0 ? 'top' : 'bottom';
          const lines = LABEL_MAP[t] || [t];
          const color = tot > 0 ? (TC[t] || 'var(--text)') : 'rgba(100,120,168,.4)';
          drawLabel(ctx, lines, lx, ly, hAlign, vAlign, color, tot > 0);
          // Score annotation near dot (only if data exists)
          if (tot > 0) {
            ctx.fillStyle = 'rgba(204,216,240,.6)';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Offset annotation slightly away from center
            const annDist = Math.max(R * pct + 12, 18);
            const ax = cx + Math.cos(angle) * annDist;
            const ay = cy + Math.sin(angle) * annDist;
            ctx.fillText(Math.round(pct * 100) + '%', ax, ay);
          }
        });
        // Center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,229,204,.4)';
        ctx.fill();
        // No-data message
        const hasData = themes.some(t => (S.byTheme[t]?.tot || 0) > 0);
        if (!hasData) {
          ctx.fillStyle = 'rgba(106,128,168,.5)';
          ctx.font = '11px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Réponds à des questions pour', cx, cy - 8);
          ctx.fillText('voir ton radar de compétences', cx, cy + 8);
        }
      }

      function initSwipe() {
        const card = document.getElementById('question-card');
        if (!card) return;
        let sx = 0,
          sy = 0;
        card.addEventListener('touchstart', e => {
          sx = e.touches[0].clientX;
          sy = e.touches[0].clientY;
        }, {
          passive: true
        });
        card.addEventListener('touchend', e => {
          const dx = e.changedTouches[0].clientX - sx;
          const dy = e.changedTouches[0].clientY - sy;
          if (Math.abs(dx) < Math.abs(dy) * 1.5 || Math.abs(dx) < 50) return;
          if (S.answered) return;
          if (dx < -50) {
            card.style.transition = 'transform .25s ease,opacity .25s';
            card.style.transform = 'translateX(-60px)';
            card.style.opacity = '.5';
            setTimeout(() => {
              card.style.transition = '';
              card.style.transform = '';
              card.style.opacity = '';
              doSkip();
            }, 250);
          } else if (dx > 50) {
            toggleBookmark();
            card.style.transition = 'transform .2s ease';
            card.style.transform = 'translateX(12px)';
            setTimeout(() => {
              card.style.transition = '';
              card.style.transform = '';
            }, 200);
            showToast('streak-toast', S.bookmarks.has(S.curIdx) ? '⭐ Ajouté aux favoris' : '☆ Retiré des favoris', 1500);
          }
        }, {
          passive: true
        });
      }


      function initGlossary() {
        const expl = document.getElementById('feedback');
        if (!expl) return;
        const popup = document.getElementById('gloss-popup');
        const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

        function processNode(node) {
          if (node.nodeType === 3) {
            let text = node.textContent;
            let changed = false;
            const frag = document.createDocumentFragment();
            let last = 0;
            const matches = [];
            terms.forEach(term => {
              const re = new RegExp('\\b' + term.replace('$', '\\$').replace('φ', 'φ').replace('(', '\\(').replace(')', '\\)') + '\\b', 'g');
              let m;
              while ((m = re.exec(text)) !== null) {
                matches.push({
                  start: m.index,
                  end: m.index + term.length,
                  term
                });
              }
            });
            matches.sort((a, b) => a.start - b.start);
            const clean = [];
            let cursor = 0;
            matches.forEach(m => {
              if (m.start >= cursor) {
                clean.push(m);
                cursor = m.end;
              }
            });
            if (!clean.length) return;
            clean.forEach(m => {
              if (m.start > last) frag.appendChild(document.createTextNode(text.slice(last, m.start)));
              const span = document.createElement('span');
              span.className = 'gloss-term';
              span.textContent = text.slice(m.start, m.end);
              span.dataset.term = m.term;
              frag.appendChild(span);
              last = m.end;
              changed = true;
            });
            frag.appendChild(document.createTextNode(text.slice(last)));
            if (changed && node.parentNode) node.parentNode.replaceChild(frag, node);
          } else if (node.nodeType === 1 && !['script', 'style'].includes(node.tagName.toLowerCase())) {
            [...node.childNodes].forEach(processNode);
          }
        }
        const observer = new MutationObserver(() => {
          if (expl.style.display !== 'none') {
            [...expl.childNodes].forEach(processNode);
          }
        });
        observer.observe(expl, {
          childList: true,
          subtree: false,
          characterData: true
        });
        document.addEventListener('mouseover', e => {
          const t = e.target.closest('.gloss-term');
          if (!t || !popup) return;
          const term = t.dataset.term;
          const g = GLOSSARY[term];
          if (!g) return;
          popup.innerHTML = `
          																					<strong>${term}</strong> — ${g.full}
																															
												
															
																					<br>
																						<span style="color:var(--text);font-size:12px">${g.def}</span>`;
          popup.classList.add('show');
          const r = t.getBoundingClientRect();
          let left = r.left + window.scrollX;
          let top = r.bottom + window.scrollY + 6;
          if (left + 300 > window.innerWidth - 10) left = window.innerWidth - 310;
          popup.style.left = left + 'px';
          popup.style.top = top + 'px';
        });
        document.addEventListener('mouseout', e => {
          if (!e.target.closest('.gloss-term')) popup.classList.remove('show');
        });
        document.addEventListener('click', e => {
          const t = e.target.closest('.gloss-term');
          if (t) {
            e.preventDefault();
            t.dispatchEvent(new MouseEvent('mouseover', {
              bubbles: true
            }));
          } else popup.classList.remove('show');
        });
      }

      function useStreakFreeze() {
        if (S.streakFreezes <= 0) return;
        S.streakFreezes--;
        lsSet('freezes', S.streakFreezes);
        const today = getDailyDate();
        const dates = new Set(lsGet('playdates', []));
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dates.add(tomorrow.toISOString().slice(0, 10));
        lsSet('playdates', [...dates].slice(-60));
        lsSet('freezeUsed_' + today, true);
        updateFreezeBtn();
        showToast('streak-toast', '🧊 Streak Freeze activé ! Ta série est protégée pour demain.', 3000);
      }

      function updateFreezeBtn() {
        const btn = document.getElementById('freeze-btn');
        const badge = document.getElementById('fz-badge');
        if (btn) {
          btn.disabled = S.streakFreezes <= 0;
        }
        // Phase 2 v2.10 : badge vide quand 0 → masqué via CSS :empty
        if (badge) badge.textContent = S.streakFreezes > 0 ? S.streakFreezes : '';
        if (S.dayStreak > 0 && S.dayStreak % 7 === 0 && S.streakFreezes < 3) {
          S.streakFreezes++;
          lsSet('freezes', S.streakFreezes);
          if (badge) badge.textContent = S.streakFreezes > 0 ? S.streakFreezes : '';
          showToast('streak-toast', '🧊 Nouveau Streak Freeze gagné !', 2500);
        }
      }
      const SECRET_REVEALS = {
        's_3am': {
          emoji: '🦇',
          name: 'Créature de la nuit',
          desc: 'Répondre entre 3h00 et 3h59 du matin — les vampires révisent aussi.'
        },
        's_42': {
          emoji: '🌌',
          name: 'La réponse ultime',
          desc: 'Obtenir exactement 42% à un examen — La Vie, l\'Univers et tout le reste.'
        },
        's_13': {
          emoji: '🎱',
          name: 'Baker Street 13',
          desc: 'Maintenir une série de 13 exactement avant de se tromper.'
        },
        's_hints3': {
          emoji: '🧙',
          name: 'Gandalf en détresse',
          desc: 'Utiliser les 3 indices dans la même journée — même Gandalf demande de l\'aide.'
        },
        's_speed5': {
          emoji: '🏎️',
          name: 'Speed runner DFIR',
          desc: '5 speed bonuses consécutifs — Elliot Alderson approuve.'
        },
        's_skip': {
          emoji: '🙈',
          name: 'Voir rien faire rien',
          desc: 'Passer 20 questions — la chaîne de custody est rompue.'
        },
      };

      function checkSecrets(ok) {
        const sf = S._secretFlags;
        const h = new Date().getHours();
        if (h === 3 && !sf.at3am) {
          sf.at3am = true;
        }
        if (S.streak === 13 && !sf.streak13) {
          sf.streak13 = true;
        }
        if (ok) {
          const elapsed = (Date.now() - _qRenderTime) / 1000;
          if (elapsed < 5 && !S._hintUsedThisQ) {
            S._speedCorrect = (S._speedCorrect || 0) + 1;
            if (S._speedCorrect >= 5 && !sf.speed5row) {
              sf.speed5row = true;
            }
          } else {
            S._speedCorrect = 0;
          }
        } else {
          S._speedCorrect = 0;
        }
        if (S.hintsLeft === 0 && !sf.hints3day) {
          sf.hints3day = true;
        }
        lsSet('secretFlags', sf);
        const unlocked = new Set(lsGet('achievements', []));
        ACHIEVEMENTS.filter(a => a.secret).forEach(a => {
          if (unlocked.has(a.id)) return;
          try {
            if (a.check(S)) {
              const reveal = SECRET_REVEALS[a.id];
              if (reveal) {
                a.emoji = reveal.emoji;
                a.name = reveal.name;
                a.desc = reveal.desc;
                a.secret = false;
              }
            }
          } catch {}
        });
        checkAchievements();
      }

      function checkExam42(pct) {
        if (pct === 42 && !S._secretFlags.exam42) {
          S._secretFlags.exam42 = true;
          lsSet('secretFlags', S._secretFlags);
          checkSecrets(false);
        }
      }
      // ══════════════════════════════════════════════════════════
      // SCREEN SHAKE
      // ══════════════════════════════════════════════════════════
      function triggerScreenShake() {
        const main = document.getElementById('main');
        if (!main) return;
        main.classList.remove('shake');
        void main.offsetWidth; // reflow
        main.classList.add('shake');
        main.addEventListener('animationend', () => main.classList.remove('shake'), {
          once: true
        });
      }
      // ══════════════════════════════════════════════════════════
      // AVATAR + PSEUDO
      // ══════════════════════════════════════════════════════════


      function updateAvatarChip() {
        // Phase 2 v2.10 : #avatar-emoji et #avatar-name déplacés vers profile-banner.
        // Stub conservé pour compatibilité avec les call-sites existants.
      }

      function openAvatarSetup() {
        // Build avatar grid
        const grid = document.getElementById('avatar-options');
        if (grid) {
          grid.innerHTML = '';
          AVATAR_EMOJIS.forEach(em => {
            const btn = document.createElement('button');
            btn.className = 'av-opt' + (em === S.avatarEmoji ? ' active' : '');
            btn.textContent = em;
            btn.onclick = () => {
              grid.querySelectorAll('.av-opt').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              S.avatarEmoji = em;
            };
            grid.appendChild(btn);
          });
        }
        const inp = document.getElementById('avatar-name-input');
        if (inp) inp.value = S.avatarName;
        document.getElementById('avatar-overlay').classList.add('show');
      }

      function saveAvatar() {
        const inp = document.getElementById('avatar-name-input');
        const name = inp ? inp.value.trim() : '';
        S.avatarName = name || 'Enquêteur';
        lsSet('avatarEmoji', S.avatarEmoji);
        lsSet('avatarName', S.avatarName);
        updateAvatarChip();
        closeOverlay('avatar-overlay');
        showToast('streak-toast', `👤 Profil enregistré ! Bonjour ${S.avatarName} 👋`, 2500);
      }
      // ══════════════════════════════════════════════════════════
      // SHARE CARD (Canvas)
      // ══════════════════════════════════════════════════════════
      function drawShareCard() {
        const canvas = document.getElementById('share-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = 760,
          H = 420;
        canvas.width = W;
        canvas.height = H;
        const {
          rank
        } = getRank(S.xp);
        const acc = S.total ? Math.round(S.correct / S.total * 100) : 0;
        const theme = lsGet('visualTheme', 'default');
        // Background palette per theme
        const palettes = {
          default: {
            bg1: '#060b12',
            bg2: '#0d1a2e',
            accent: '#00e5cc',
            accent2: '#f0c040',
            dim: '#6a80a8'
          },
          hacker: {
            bg1: '#000800',
            bg2: '#001200',
            accent: '#00ff41',
            accent2: '#aaff00',
            dim: '#005500'
          },
          crimson: {
            bg1: '#120006',
            bg2: '#1e0010',
            accent: '#ff2060',
            accent2: '#ff8c42',
            dim: '#8a3050'
          },
          retro: {
            bg1: '#0a0800',
            bg2: '#1a1400',
            accent: '#ffcc00',
            accent2: '#ff8800',
            dim: '#664400'
          },
        };
        const P = palettes[theme] || palettes.default;
        // BG gradient
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, P.bg1);
        bgGrad.addColorStop(1, P.bg2);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);
        // Grid lines
        ctx.strokeStyle = P.accent + '18';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 44) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 0; y < H; y += 44) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        // Glow circle
        const radGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 320);
        radGrad.addColorStop(0, P.accent + '12');
        radGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, W, H);
        // Border
        ctx.strokeStyle = P.accent + '40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(8, 8, W - 16, H - 16, 12);
        ctx.stroke();
        // Avatar + Name top-left
        ctx.font = '36px serif';
        ctx.fillText(S.avatarEmoji, 32, 62);
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillStyle = P.accent;
        ctx.fillText(S.avatarName, 80, 50);
        ctx.font = '13px "JetBrains Mono", monospace';
        ctx.fillStyle = P.dim;
        ctx.fillText(rank.name, 80, 68);
        // Title center
        ctx.textAlign = 'center';
        ctx.font = 'bold 28px "Syne", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('CAS-IN · Investigation Numérique', W / 2, 44);
        // Main score — big number
        ctx.font = 'bold 80px "JetBrains Mono", monospace';
        ctx.fillStyle = P.accent2;
        ctx.shadowColor = P.accent2;
        ctx.shadowBlur = 20;
        ctx.fillText(S.score + ' pts', W / 2, 185);
        ctx.shadowBlur = 0;
        // Stat pills
        const stats = [{
          label: 'Précision',
          val: acc + '%',
          color: acc >= 70 ? '#30e88a' : '#ff4060'
        }, {
          label: 'Questions',
          val: S.total + '',
          color: P.accent
        }, {
          label: 'Série max',
          val: S.maxStreak + '',
          color: P.accent2
        }, {
          label: 'XP total',
          val: S.xp + '',
          color: '#a78bfa'
        }, ];
        const pillW = 150,
          pillH = 64,
          gap = 18;
        const totalPills = pillW * stats.length + gap * (stats.length - 1);
        const startX = (W - totalPills) / 2;
        stats.forEach((st, i) => {
          const x = startX + i * (pillW + gap);
          const y = 215;
          // pill bg
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.beginPath();
          ctx.roundRect(x, y, pillW, pillH, 8);
          ctx.fill();
          ctx.strokeStyle = st.color + '40';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x, y, pillW, pillH, 8);
          ctx.stroke();
          // value
          ctx.font = 'bold 26px "JetBrains Mono", monospace';
          ctx.fillStyle = st.color;
          ctx.fillText(st.val, x + pillW / 2, y + 34);
          // label
          ctx.font = '11px "Inter", sans-serif';
          ctx.fillStyle = P.dim;
          ctx.fillText(st.label, x + pillW / 2, y + 52);
        });
        // Theme bar (top themes by accuracy)
        const topThemes = Object.entries(S.byTheme).filter(([, v]) => v.tot >= 3).map(([t, v]) => ({
          t,
          pct: Math.round(v.ok / v.tot * 100)
        })).sort((a, b) => b.pct - a.pct).slice(0, 3);
        if (topThemes.length) {
          ctx.textAlign = 'center';
          ctx.font = '11px "Inter", sans-serif';
          ctx.fillStyle = P.dim;
          ctx.fillText('Top thèmes', W / 2, 310);
          topThemes.forEach((th, i) => {
            const barW = 200,
              barH = 6,
              bx = W / 2 - barW / 2,
              by = 318 + i * 22;
            // bg
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath();
            ctx.roundRect(bx, by, barW, barH, 3);
            ctx.fill();
            // fill
            ctx.fillStyle = P.accent;
            ctx.beginPath();
            ctx.roundRect(bx, by, barW * th.pct / 100, barH, 3);
            ctx.fill();
            // label
            ctx.textAlign = 'left';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = P.dim;
            ctx.fillText(th.t.substring(0, 22), bx, by - 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = P.accent;
            ctx.fillText(th.pct + '%', bx + barW, by - 2);
          });
        }
        // Footer
        ctx.textAlign = 'center';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = P.dim;
        ctx.fillText('#DFIR  #Forensics  #CAS_IN', W / 2, H - 18);
        // Streak badge top-right
        if (S.maxStreak >= 5) {
          ctx.textAlign = 'right';
          ctx.font = '13px "JetBrains Mono", monospace';
          ctx.fillStyle = P.accent2;
          ctx.fillText('🔥 ' + S.maxStreak + ' streak', W - 30, 55);
        }
      }

      function downloadShareCard() {
        drawShareCard();
        const canvas = document.getElementById('share-canvas');
        const a = document.createElement('a');
        a.download = 'casin-score.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
      async function copyShareCard() {
        drawShareCard();
        const canvas = document.getElementById('share-canvas');
        try {
          canvas.toBlob(async blob => {
            await navigator.clipboard.write([new ClipboardItem({
              'image/png': blob
            })]);
            showToast('streak-toast', '📋 Image copiée dans le presse-papier !', 2500);
          });
        } catch {
          showToast('streak-toast', '⚠️ Copie non supportée — essaie le téléchargement', 2500);
        }
      }

      function shareNative() {
        drawShareCard();
        const canvas = document.getElementById('share-canvas');
        canvas.toBlob(async blob => {
          const file = new File([blob], 'casin-score.png', {
            type: 'image/png'
          });
          if (navigator.canShare?.({
              files: [file]
            })) {
            await navigator.share({
              files: [file],
              title: 'Mon score CAS-IN'
            }).catch(() => {});
          } else {
            downloadShareCard();
          }
        });
      }
      // ══════════════════════════════════════════════════════════
      // MID-SESSION REVIEW (every 20 questions)
      // ══════════════════════════════════════════════════════════


      function maybeTriggerMidSession() {
        if (S.total > 0 && S.total % 20 === 0 && !S._midShown.has(S.total)) {
          S._midShown.add(S.total);
          setTimeout(showMidSession, 700);
        }
      }

      function showMidSession() {
        const allThemes = ALL_T;
        const scored = allThemes.map(t => {
          const d = S.byTheme[t] || {
            ok: 0,
            tot: 0
          };
          return {
            t,
            ok: d.ok,
            tot: d.tot,
            pct: d.tot ? Math.round(d.ok / d.tot * 100) : null
          };
        }).filter(x => x.tot >= 2).sort((a, b) => (a.pct ?? 100) - (b.pct ?? 100));
        if (!scored.length) return;
        const acc = Math.round(S.correct / S.total * 100);
        const name = S.avatarName !== 'Enquêteur' ? `, ${S.avatarName}` : '';
        document.getElementById('ms-sub-txt').textContent = `${S.total} questions · ${acc}% de précision globale${name}`;
        const weakList = document.getElementById('ms-weak-list');
        weakList.innerHTML = '<div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">📉 Points faibles</div>';
        const weak = scored.slice(0, 3);
        weak.forEach(w => {
          const col = w.pct >= 70 ? 'var(--green)' : w.pct >= 40 ? 'var(--gold)' : 'var(--red)';
          const tip = MID_TIPS[w.t] || 'Revois les notions fondamentales de ce thème.';
          const div = document.createElement('div');
          div.className = 'weak-item';
          div.innerHTML = `
          																						<div class="weak-theme" style="color:${col}">${w.t}</div>
																						<div class="weak-stat">${w.ok}/${w.tot} correctes · ${w.pct}%</div>
																						<div class="weak-bar">
																							<div class="weak-bar-fill" style="width:${w.pct}%;background:${col}"></div>
																						</div>
																						<div class="weak-tip">💡 ${tip}</div>`;
          weakList.appendChild(div);
        });
        // Strong themes
        const strong = scored.filter(x => x.pct >= 80).slice(-2);
        const strongEl = document.getElementById('ms-strong');
        if (strong.length) {
          strongEl.innerHTML = `
          																						<div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin:12px 0 6px">✅ Points forts</div>` + strong.map(s => `
          																						<span style="display:inline-block;margin:3px 4px;padding:4px 10px;border-radius:16px;font-size:11px;font-weight:700;background:rgba(48,232,138,.1);border:1px solid rgba(48,232,138,.3);color:var(--green)">${s.t} · ${s.pct}%</span>`).join('');
        } else {
          strongEl.innerHTML = '';
        }
        document.getElementById('midsession-overlay').classList.add('show');
      }

      function closeMidSession() {
        document.getElementById('midsession-overlay').classList.remove('show');
      }
      // ══════════════════════════════════════════════════════════
      // FOCUS MODE
      // ══════════════════════════════════════════════════════════
      let _focusMode = false;

      function toggleFocusMode() {
        _focusMode = !_focusMode;
        document.body.classList.toggle('focus-mode', _focusMode);
        if (_focusMode) showToast('streak-toast', '🎯 Mode Focus activé — ESC pour quitter', 2000);
      }
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && _focusMode) toggleFocusMode();
      });
      // ══════════════════════════════════════════════════════════
      // ALERTE FORENSIQUE SIMULÉE
      // ══════════════════════════════════════════════════════════
      let _forensicShown = false;

      function maybeShowForensicAlert() {
        if (_forensicShown || S.total !== 100) return;
        if (lsGet('forensicShown', false)) return;
        _forensicShown = true;
        lsSet('forensicShown', true);
        setTimeout(showForensicAlert, 800);
      }

      function showForensicAlert() {
        const overlay = document.getElementById('forensic-alert');
        const output = document.getElementById('forensic-output');
        const prompt = document.getElementById('forensic-prompt');
        if (!overlay || !output) return;
        overlay.classList.add('show');
        const hash = Array.from({
          length: 32
        }, () => '0123456789abcdef' [Math.floor(Math.random() * 16)]).join('');
        const lines = [{
          text: '[ALERT] Activité suspecte détectée sur le volume.',
          cls: 'alert-line',
          delay: 0
        }, {
          text: '[SCAN]  Fichier : /quiz/sessions/answers.db',
          cls: '',
          delay: 600
        }, {
          text: '[HASH]  MD5 calculé : ' + hash,
          cls: 'hash-line',
          delay: 1300
        }, {
          text: '[MATCH] Signature connue : POSSIBLE EXFILTRATION',
          cls: 'alert-line',
          delay: 2100
        }, {
          text: '',
          cls: '',
          delay: 2700
        }, {
          text: "Lancer l'analyse complète du volume ?",
          cls: '',
          delay: 2900
        }, ];
        output.innerHTML = '';
        const cursor = document.createElement('span');
        cursor.className = 'forensic-cursor';
        output.appendChild(cursor);
        lines.forEach(({
          text,
          cls,
          delay
        }) => {
          setTimeout(() => {
            if (text === '') {
              output.insertBefore(document.createElement('br'), cursor);
              return;
            }
            const line = document.createElement('div');
            if (cls) line.className = cls;
            line.textContent = text;
            output.insertBefore(line, cursor);
            output.scrollTop = output.scrollHeight;
          }, delay);
        });
        setTimeout(() => {
          prompt.style.display = 'flex';
        }, 3200);
      }

      function forensicAnswer(yes) {
        const prompt = document.getElementById('forensic-prompt');
        const scanWrap = document.getElementById('forensic-scan-wrap');
        const output = document.getElementById('forensic-output');
        const bar = document.getElementById('forensic-scan-bar-inner');
        prompt.style.display = 'none';
        if (!yes) {
          const line = document.createElement('div');
          line.textContent = '[ANNULÉ] Rapport non généré. Preuve potentielle perdue.';
          line.style.color = '#ff4400';
          output.appendChild(line);
          setTimeout(() => {
            document.getElementById('forensic-alert').classList.remove('show');
          }, 1800);
          return;
        }
        scanWrap.style.display = 'block';
        const phases = [{
          pct: 15,
          msg: '[SCAN]  Lecture de la table FAT...',
          delay: 0
        }, {
          pct: 32,
          msg: '[SCAN]  Analyse du $MFT...',
          delay: 600
        }, {
          pct: 54,
          msg: '[SCAN]  Vérification des ADS cachés...',
          delay: 1200
        }, {
          pct: 71,
          msg: '[SCAN]  Contrôle chaîne de custody...',
          delay: 1900
        }, {
          pct: 88,
          msg: '[SCAN]  Calcul du SHA-256...',
          delay: 2600
        }, {
          pct: 100,
          msg: '[OK]    INTÉGRITÉ VÉRIFIÉE — Aucune exfiltration.',
          delay: 3300,
          cls: 'ok-line'
        }, ];
        phases.forEach(({
          pct,
          msg,
          delay,
          cls
        }) => {
          setTimeout(() => {
            if (bar) bar.style.width = pct + '%';
            const line = document.createElement('div');
            line.textContent = msg;
            if (cls) line.className = cls;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
            if (pct === 100) {
              setTimeout(() => {
                document.getElementById('forensic-alert').classList.remove('show');
                showToast('streak-toast', '🔍 Analyse forensique : INTÉGRITÉ CONFIRMÉE', 3000);
              }, 1200);
            }
          }, delay);
        });
      }
      // ══════════════════════════════════════════════════════════
      // CODE KONAMI — God Mode
      // ══════════════════════════════════════════════════════════

      let _konamiPos = 0;
      let _godMode = false;
      let _godModeTimer = null;
      document.addEventListener('keydown', e => {
        // Konami tracking
        if (e.key === KONAMI[_konamiPos]) {
          _konamiPos++;
          if (_konamiPos === KONAMI.length) {
            _konamiPos = 0;
            activateGodMode();
          }
        } else {
          _konamiPos = (e.key === KONAMI[0]) ? 1 : 0;
        }
      });

      function activateGodMode() {
        _godMode = true;
        clearTimeout(_godModeTimer);
        showToast('combo-toast', '🕹️ GOD MODE — La honte sera dans les logs.', 4000);
        // Reveal all wrong answers as dimmed gray for this question
        revealGodModeHints();
        // Auto-disable after 3 questions or 90s
        _godModeTimer = setTimeout(deactivateGodMode, 90000);
        // Konami visual flash
        document.body.style.transition = 'filter .15s';
        document.body.style.filter = 'brightness(1.3) hue-rotate(180deg)';
        setTimeout(() => {
          document.body.style.filter = '';
        }, 200);
      }

      function deactivateGodMode() {
        _godMode = false;
        clearTimeout(_godModeTimer);
      }

      function revealGodModeHints() {
        if (!_godMode || !S.curQ || S.answered) return;
        const q = S.curQ;
        document.querySelectorAll('.choice-btn:not(:disabled)').forEach(btn => {
          const origI = +btn.dataset.origIdx;
          if (!q.answers.includes(origI)) {
            // Wrong answer — show as very dim
            btn.style.opacity = '0.35';
            btn.style.filter = 'grayscale(1)';
          }
        });
      }

      function clearGodModeHints() {
        document.querySelectorAll('.choice-btn').forEach(btn => {
          btn.style.opacity = '';
          btn.style.filter = '';
        });
      }
      // ══════════════════════════════════════════════════════════
      // MODE DOUBLE OU RIEN
      // ══════════════════════════════════════════════════════════
      let _dorActive = false;
      let _dorSessionScore = 0; // score accumulé pendant la série
      function checkDorOffer() {
        // Offer after exactly 5 correct in a row (and not already active)
        if (S.streak === 5 && !_dorActive) {
          showDorBanner();
        }
      }

      function showDorBanner() {
        const b = document.getElementById('dor-banner');
        if (b) {
          b.classList.add('show');
          // Save the current streak score to know what's at stake
          _dorSessionScore = S.score;
        }
      }

      function hideDorBanner() {
        const b = document.getElementById('dor-banner');
        if (b) b.classList.remove('show');
      }

      function activateDor() {
        _dorActive = true;
        hideDorBanner();
        showToast('combo-toast', '🎲 Double ou Rien activé ! Prochaine réponse decisive…', 3000);
        document.getElementById('question-card')?.classList.add('dor-active');
      }

      function resolveDor(correct) {
        if (!_dorActive) return;
        _dorActive = false;
        document.getElementById('question-card')?.classList.remove('dor-active');
        if (correct) {
          // Double the points earned since DOR activation
          const bonusPoints = DIFF_PTS[S.curQ?.diff || 'easy'] * Math.round(getComboMultiplier());
          S.score += bonusPoints;
          addXp(bonusPoints);
          document.getElementById('score-display').textContent = S.score + ' pts';
          showToast('streak-toast', `🎲 Double ou Rien GAGNÉ ! +${bonusPoints} pts bonus !`, 3000);
        } else {
          // Lose the streak score accumulated
          const lost = Math.max(0, S.streak * DIFF_PTS[S.curQ?.diff || 'easy']);
          S.score = Math.max(0, S.score - lost);
          document.getElementById('score-display').textContent = S.score + ' pts';
          showToast('streak-toast', `🎲 Double ou Rien PERDU — Série brisée !`, 3000);
        }
      }
      // ══════════════════════════════════════════════════════════
      // TAILLE DE POLICE
      // ══════════════════════════════════════════════════════════
      function applyFontSize(size) {
        document.body.dataset.font = (size === 'normal' ? '' : size);
        lsSet('fontSize', size);
        // Update button states if panel is open
        document.querySelectorAll('.font-opt').forEach(b => {
          b.classList.toggle('active', b.dataset.font === size || (size === 'normal' && b.dataset.font === 'normal'));
        });
      }

      function setFontSize(size, btn) {
        applyFontSize(size);
      }
      // ══════════════════════════════════════════════════════════
      // RÉSUMÉ DE SESSION — sauvegarde continue
      // ══════════════════════════════════════════════════════════
      function saveSessionSnapshot() {
        if (!S.total) return;
        const acc = Math.round(S.correct / S.total * 100);
        const snap = {
          total: S.total,
          acc,
          date: new Date().toLocaleDateString('fr-CH', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          }),
          dateKey: new Date().toISOString().slice(0, 10),
          score: S.score,
        };
        lsSet('sessionSnap', snap);
      }

      function showSessionResumeToast() {
        const snap = lsGet('sessionSnap', null);
        if (!snap) return;
        const todayKey = new Date().toISOString().slice(0, 10);
        // Only show if the snapshot is from a previous day (avoid same-session spam)
        if (snap.dateKey === todayKey) return;
        // Show after a short delay so the quiz is fully loaded
        setTimeout(() => {
          const when = snap.dateKey === new Date(Date.now() - 86400000).toISOString().slice(0, 10) ? 'Hier' : snap.date;
          showToast('streak-toast', `👋 ${when} : ${snap.total} questions · ${snap.acc}% · ${snap.score} pts`, 4000);
        }, 1200);
      }


function openFiches() {
  document.getElementById('fiches-overlay').classList.add('show');
  renderFicheHeatmap();
  renderFiche(Object.keys(CHEATSHEETS)[0]);
}
function closeFiches() {
  document.getElementById('fiches-overlay').classList.remove('show');
}
function renderFiche(chapter) {
  const data = CHEATSHEETS[chapter];
  if (!data) return;
  document.querySelectorAll('.fiche-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector('.fiche-tab[data-ch="'+CSS.escape(chapter)+'"]');
  if (tab) { tab.classList.add('active'); tab.scrollIntoView({block:'nearest',inline:'center'}); }
  const el = document.getElementById('fiche-content');
  const ptsHtml = data.points.map(p=>`<li>${p}</li>`).join('');
  const valsHtml = data.values.map(v=>`<li>${v}</li>`).join('');
  // Badge progression
  const stat = S.byChapter[chapter];
  let badgeHtml = '';
  if (stat && stat.tot > 0) {
    const pct = Math.round(stat.ok / stat.tot * 100);
    const col = pct >= 70 ? '#30e88a' : pct >= 40 ? '#f0c040' : '#ff4060';
    badgeHtml = `<div style="display:flex;align-items:center;gap:8px;margin-left:auto">
      <div style="font-size:11px;color:var(--dim)">${stat.ok}/${stat.tot} correctes</div>
      <div style="font-size:13px;font-weight:700;color:${col};background:${col}22;padding:3px 10px;border-radius:20px;border:1px solid ${col}55">${pct}%</div>
    </div>`;
  }
  el.innerHTML = `
    <div class="fiche-header">
      <span class="fiche-icon">${data.icon}</span>
      <h3 class="fiche-title">${chapter}</h3>
      ${badgeHtml}
    </div>
    <div class="fiche-section">
      <div class="fiche-section-label">Points clés</div>
      <ul class="fiche-list">${ptsHtml}</ul>
    </div>
    <div class="fiche-section">
      <div class="fiche-section-label">Valeurs &amp; formules</div>
      <ul class="fiche-list fiche-list--values">${valsHtml}</ul>
    </div>
    <div class="fiche-tip">
      <span class="fiche-tip-label">💡 Tip forensique</span>
      <span>${data.tip}</span>
    </div>
    <button type="button" onclick="drillChapter(${JSON.stringify(chapter)})" style="margin-top:14px;width:100%;padding:10px;border-radius:8px;border:1px solid var(--acc);background:rgba(0,229,204,.08);color:var(--acc);font-size:13px;font-weight:600;cursor:pointer">
      ▶ Réviser ce chapitre (questions uniquement)
    </button>
    ${data.file ? `<a href="${data.file}" target="_blank" style="display:block;margin-top:8px;width:100%;padding:9px;border-radius:8px;border:1px solid rgba(240,192,64,.35);background:rgba(240,192,64,.07);color:var(--gold);font-size:12px;font-weight:600;text-align:center;text-decoration:none;box-sizing:border-box">📖 Fiche complète détaillée ↗</a>` : ''}`;
}

function drillChapter(chapter) {
  // Fermer les fiches, activer le filtre chapitre, lancer
  closeFiches();
  S.activeC = new Set([chapter]);
  S.mode = 'normal';
  startGame();
}

function renderFicheHeatmap() {
  const el = document.getElementById('fiche-heatmap');
  if (!el) return;
  const chapters = Object.keys(CHEATSHEETS);
  el.innerHTML = chapters.map(ch => {
    const stat = S.byChapter[ch];
    let bg = 'rgba(255,255,255,.05)';
    let title = ch + ' — non commencé';
    if (stat && stat.tot > 0) {
      const pct = Math.round(stat.ok / stat.tot * 100);
      if (pct >= 70) { bg = 'rgba(48,232,138,.55)'; title = ch + ' — ' + pct + '% ✅'; }
      else if (pct >= 40) { bg = 'rgba(240,192,64,.55)'; title = ch + ' — ' + pct + '% ⚠️'; }
      else { bg = 'rgba(255,64,96,.45)'; title = ch + ' — ' + pct + '% ❌'; }
    }
    return `<div class="hm-cell" title="${title}" onclick="renderFiche(${JSON.stringify(ch)})" style="background:${bg}">${CHEATSHEETS[ch].icon}</div>`;
  }).join('');
}



// ═══════════════════════════════════════════════════════════════
// NIVEAU 1 — Boss Battle par chapitre
// ═══════════════════════════════════════════════════════════════

// Mapping chapters → fiche thème (pour la carte territoire)


const TERRITORY_THEMES = [
  { key: "Système de fichiers",    icon: "💾", name: "Filesystems",     color: "#7affea",
    chapters: ["Technologie des disques","FAT12 / FAT16 / FAT32","exFAT","NTFS","EXT2 / EXT3 / EXT4","HFS+ et APFS","Représentation des données"] },
  { key: "Acquisition et analyse", icon: "🔬", name: "Acquisition",     color: "#00e5cc",
    chapters: ["Acquisition et préservation","Formats de fichiers et Magic Bytes","Artefacts temporels et MAC times","Méthodologie forensique","Méthodologie et bonnes pratiques","Logiciels et outils forensiques"] },
  { key: "Spécificité des OS",     icon: "💻", name: "OS Forensics",    color: "#ff6b9d",
    chapters: ["Windows — Artefacts et exécution","Windows — Registre et artefacts","Windows — Journaux et Event Logs","macOS — Artefacts et analyse","Linux — Artefacts et analyse"] },
  { key: "Cryptologie",            icon: "🔐", name: "Cryptologie",     color: "#f0c040",
    chapters: ["Chiffrement symétrique","Chiffrement asymétrique et RSA","PKI et certificats","Hachage et intégrité","Cassage et attaques"] },
  { key: "Droit",                  icon: "⚖",  name: "Droit CH",        color: "#ff8c42",
    chapters: ["Procédure pénale","Perquisition de documents","Séquestre informatique","Droit pénal informatique","Expertise et rapport judiciaire","Entraide judiciaire internationale"] },
  { key: "OSINT",                  icon: "🕵",  name: "OSINT",           color: "#ffd580",
    chapters: ["Fondamentaux OSINT","Outils et automatisation OSINT","Recherche web et Google Dorks","Métadonnées et EXIF"] },
  { key: "Informatique de base",   icon: "📡", name: "Réseaux",         color: "#7ab8ff",
    chapters: ["Adressage IP","Réseau, protocoles et Internet","Infrastructure, DNS et pivots"] },
];

// State boss battle
const BOSS_THRESHOLD  = 20;  // bonnes réponses pour déclencher
const BOSS_QUESTIONS  = 5;   // questions dans le boss
const BOSS_TIME       = 18;  // secondes par question

let bossState = {
  active: false,
  chapter: null,
  questions: [],
  qi: 0,
  correct: 0,
  timerInt: null,
  timeLeft: BOSS_TIME,
  dots: [],
  beaten: new Set(JSON.parse(localStorage.getItem('bossBeaten') || '[]')),
};

// Fiches débloquées : une fiche se débloque quand ≥5 bonnes réponses sur un de ses chapitres
let ficheUnlocked = new Set(JSON.parse(localStorage.getItem('ficheUnlocked') || '[]'));

function saveBossState() {
  localStorage.setItem('bossBeaten', JSON.stringify([...bossState.beaten]));
}
function saveFicheUnlocked() {
  localStorage.setItem('ficheUnlocked', JSON.stringify([...ficheUnlocked]));
}

// ── Vérifier si un boss se déclenche après une bonne réponse ──
function checkBossTrigger(chapter) {
  if (!chapter) return;
  if (bossState.beaten.has(chapter)) return;  // déjà battu
  const stat = S.byChapter[chapter] || { ok: 0, tot: 0 };
  
  // Warning à THRESHOLD-5
  const warn = BOSS_THRESHOLD - 5;
  if (stat.ok === warn) {
    const wEl = document.getElementById('boss-warning');
    const cd  = document.getElementById('boss-countdown');
    if (wEl && cd) {
      cd.textContent = 5;
      wEl.style.display = 'block';
      let count = 5;
      const wi = setInterval(() => {
        count--;
        if (cd) cd.textContent = count;
        if (count <= 0) { clearInterval(wi); wEl.style.display = 'none'; }
      }, 1000);
    }
  }
  
  // Déclencher le boss
  if (stat.ok >= BOSS_THRESHOLD && !bossState.active) {
    bossState.active = true;
    bossState.chapter = chapter;
    // Sélectionner 5 questions hard du chapitre
    const pool = ALL_Q.filter(q => q.chapter === chapter && q.diff === 'hard');
    const shuffled = pool.sort(() => Math.random() - .5).slice(0, BOSS_QUESTIONS);
    bossState.questions = shuffled;
    bossState.qi = 0;
    bossState.correct = 0;
    // Lancer avec délai pour que le feedback de la bonne réponse s'affiche
    setTimeout(launchBoss, 1200);
  }
}

function launchBoss() {
  const overlay = document.getElementById('boss-overlay');
  if (!overlay) return;
  document.getElementById('boss-chapter-name').textContent = bossState.chapter;
  document.getElementById('boss-sub').textContent = "💀 " + BOSS_QUESTIONS + " questions · " + BOSS_TIME + "s chacune · Sans indice · Difficulté maximale";
  buildBossDots();
  renderBossQuestion();
  overlay.classList.add('show');
}

function buildBossDots() {
  const cont = document.getElementById('boss-progress');
  if (!cont) return;
  cont.innerHTML = '';
  bossState.dots = [];
  for (let i = 0; i < BOSS_QUESTIONS; i++) {
    const d = document.createElement('div');
    d.className = 'boss-dot' + (i === 0 ? ' current' : '');
    cont.appendChild(d);
    bossState.dots.push(d);
  }
}

function renderBossQuestion() {
  const q = bossState.questions[bossState.qi];
  if (!q) { bossEnd(); return; }
  
  document.getElementById('boss-result').style.display = 'none';
  document.getElementById('boss-continue').style.display = 'none';
  document.getElementById('boss-question-text').textContent = q.question;
  
  const ch = document.getElementById('boss-choices');
  ch.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.style.cssText = 'padding:8px 14px;border-radius:7px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:var(--text);font-size:.8rem;cursor:pointer;text-align:left;transition:.15s;font-family:monospace';
    btn.onclick = () => answerBoss(i, q, ch);
    ch.appendChild(btn);
  });
  
  startBossTimer();
}

function startBossTimer() {
  clearInterval(bossState.timerInt);
  bossState.timeLeft = BOSS_TIME;
  const fill = document.getElementById('boss-timer-fill');
  if (fill) fill.style.width = '100%';
  bossState.timerInt = setInterval(() => {
    bossState.timeLeft--;
    const pct = (bossState.timeLeft / BOSS_TIME) * 100;
    if (fill) {
      fill.style.width = pct + '%';
      fill.style.background = pct > 50
        ? 'linear-gradient(90deg,var(--green),var(--cyan))'
        : pct > 25
          ? 'linear-gradient(90deg,var(--gold),#ff8c42)'
          : 'linear-gradient(90deg,var(--red),#ff6b6b)';
    }
    if (bossState.timeLeft <= 0) answerBoss(-1, bossState.questions[bossState.qi], null);
  }, 1000);
}

function answerBoss(chosen, q, choicesEl) {
  clearInterval(bossState.timerInt);
  const correct = q.type === 'single' ? q.answers[0] : null;
  const isOk = q.type === 'single'
    ? chosen === q.answers[0]
    : q.answers.includes(chosen);
  
  if (isOk) bossState.correct++;
  
  // Coloriser les boutons
  if (choicesEl) {
    [...choicesEl.children].forEach((btn, i) => {
      btn.disabled = true;
      if (q.answers.includes(i)) {
        btn.style.background = 'rgba(48,232,138,.25)';
        btn.style.borderColor = '#30e88a';
        btn.style.color = '#30e88a';
      } else if (i === chosen && !isOk) {
        btn.style.background = 'rgba(255,64,96,.25)';
        btn.style.borderColor = '#ff4060';
        btn.style.color = '#ff4060';
      }
    });
  }
  
  // Mise à jour du dot
  if (bossState.dots[bossState.qi]) {
    bossState.dots[bossState.qi].classList.remove('current');
    bossState.dots[bossState.qi].classList.add(isOk ? 'done' : 'fail');
  }
  if (bossState.qi + 1 < BOSS_QUESTIONS && bossState.dots[bossState.qi + 1]) {
    bossState.dots[bossState.qi + 1].classList.add('current');
  }
  
  bossState.qi++;
  
  const cont = document.getElementById('boss-continue');
  if (cont) {
    cont.style.display = 'block';
    cont.style.cssText += bossState.qi >= BOSS_QUESTIONS
      ? ';background:linear-gradient(135deg,var(--green),var(--cyan));border-color:var(--green);color:#000'
      : ';background:rgba(0,229,204,.1);border-color:rgba(0,229,204,.5);color:var(--cyan)';
    cont.textContent = bossState.qi >= BOSS_QUESTIONS ? 'Voir le résultat →' : 'Question suivante →';
  }
}

function bossNext() {
  if (bossState.qi >= BOSS_QUESTIONS) {
    bossEnd();
  } else {
    renderBossQuestion();
  }
}

function bossEnd() {
  clearInterval(bossState.timerInt);
  const won = bossState.correct >= Math.ceil(BOSS_QUESTIONS * 0.6); // 60% pour gagner
  
  document.getElementById('boss-choices').innerHTML = '';
  document.getElementById('boss-question-text').textContent = '';
  document.getElementById('boss-timer-bar').style.display = 'none';
  
  const res = document.getElementById('boss-result');
  if (res) {
    res.style.display = 'block';
    res.className = 'boss-result ' + (won ? 'win' : 'fail');
    res.innerHTML = won
      ? `🏆 BOSS VAINCU !<br><span style="font-size:.8rem;font-weight:400;color:var(--text)">${bossState.correct}/${BOSS_QUESTIONS} correctes — Fiche débloquée !</span>`
      : `💔 Pas encore…<br><span style="font-size:.8rem;font-weight:400;color:var(--text)">${bossState.correct}/${BOSS_QUESTIONS} — Reviens après plus de pratique.</span>`;
  }
  
  const cont = document.getElementById('boss-continue');
  if (cont) {
    cont.style.display = 'block';
    cont.textContent = won ? '🎉 Continuer' : 'Retourner au quiz';
    cont.style.cssText += won
      ? ';background:linear-gradient(135deg,var(--green),var(--cyan));border-color:var(--green);color:#000'
      : ';background:rgba(255,64,96,.1);border-color:rgba(255,64,96,.4);color:var(--red)';
    cont.onclick = () => {
      document.getElementById('boss-overlay').classList.remove('show');
      document.getElementById('boss-timer-bar').style.display = 'block';
      bossState.active = false;
      
      if (won) {
        bossState.beaten.add(bossState.chapter);
        saveBossState();
        addXp(100); // Bonus XP boss
        // Débloquer la fiche si pas encore fait
        const fichePath = CHAPTER_TO_THEME_FILE[bossState.chapter];
        if (fichePath && !ficheUnlocked.has(fichePath)) {
          unlockFiche(fichePath);
        }
        spawnParticles(window.innerWidth/2, window.innerHeight/2, true);
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// NIVEAU 2 — Fiches débloquables
// ═══════════════════════════════════════════════════════════════

function checkFicheUnlock(chapter) {
  if (!chapter) return;
  const stat = S.byChapter[chapter] || { ok: 0 };
  const fichePath = CHAPTER_TO_THEME_FILE[chapter];
  if (!fichePath || ficheUnlocked.has(fichePath)) return;
  
  if (stat.ok >= 5) {
    unlockFiche(fichePath);
  }
}

function unlockFiche(fichePath) {
  if (ficheUnlocked.has(fichePath)) return;
  ficheUnlocked.add(fichePath);
  saveFicheUnlocked();
  
  // Mettre à jour les tabs
  document.querySelectorAll('.fiche-tab').forEach(tab => {
    const ch = tab.dataset.ch;
    if (CHAPTER_TO_THEME_FILE[ch] === fichePath) {
      tab.classList.remove('locked');
    }
  });
  
  // Notification visuelle
  showUnlockNotif(fichePath);
}

function showUnlockNotif(fichePath) {
  const name = fichePath.replace('fiches/','').replace('.html','').toUpperCase();
  const notif = document.createElement('div');
  notif.className = 'unlock-notif';
  notif.innerHTML = '🔓 Fiche ' + sanitizeHTML(name) + ' débloquée ! <a href="' + fichePath + '" target="_blank" style="color:var(--cyan);margin-left:8px;text-decoration:underline">Ouvrir →</a>';
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 4500);
}

function isFicheUnlocked(chapter) {
  const fichePath = CHAPTER_TO_THEME_FILE[chapter];
  if (!fichePath) return true; // pas de fiche = toujours accessible
  return ficheUnlocked.has(fichePath) || bossState.beaten.has(chapter);
}

function applyFicheLocks() {
  document.querySelectorAll('.fiche-tab').forEach(tab => {
    const ch = tab.dataset.ch;
    const locked = !isFicheUnlocked(ch);
    tab.classList.toggle('locked', locked);
  });
}

// ═══════════════════════════════════════════════════════════════
// NIVEAU 2 — Carte des territoires
// ═══════════════════════════════════════════════════════════════

function renderTerritoryMap() {
  const el = document.getElementById('territory-map');
  if (!el) return;
  
  el.innerHTML = TERRITORY_THEMES.map(terr => {
    // Calculer le % moyen des chapitres de ce territoire
    let totalOk = 0, totalTot = 0;
    terr.chapters.forEach(ch => {
      const stat = S.byChapter[ch] || { ok: 0, tot: 0 };
      totalOk += stat.ok;
      totalTot += stat.tot;
    });
    const pct = totalTot > 0 ? Math.round(totalOk / totalTot * 100) : 0;
    const beaten = bossState.beaten;
    const bossCount = terr.chapters.filter(ch => beaten.has(ch)).length;
    
    // Couleur de fond
    let bg, textCol;
    if (pct === 0)      { bg = 'rgba(106,128,168,.06)'; textCol = '#6a80a8'; }
    else if (pct < 40)  { bg = 'rgba(255,64,96,.15)';   textCol = '#ff6680'; }
    else if (pct < 70)  { bg = 'rgba(240,192,64,.15)';  textCol = '#f0c040'; }
    else                { bg = 'rgba(48,232,138,.18)';   textCol = '#30e88a'; }
    
    const conquered = pct >= 70;
    const bossIcon = bossCount > 0 ? `<span title="${bossCount} boss vaincus" style="position:absolute;top:2px;right:3px;font-size:8px">💀×${bossCount}</span>` : '';
    
    // Fiche pour ce territoire (prendre le premier chapitre)
    const ficheLink = CHAPTER_TO_THEME_FILE[terr.chapters[0]] || '#';
    
    return `<div class="terr${conquered ? ' terr-conquered' : ''}" 
               style="background:${bg};border-color:${pct>0 ? textCol+'40' : 'var(--border)'}"
               onclick="window.open('${ficheLink}','_blank')"
               title="${terr.key} — ${pct}% maîtrisé${bossCount ? ' · '+bossCount+' boss vaincus' : ''}">
      ${bossIcon}
      <div class="terr-icon">${terr.icon}</div>
      <div class="terr-name">${terr.name}</div>
      <div class="terr-pct" style="color:${textCol}">${pct > 0 ? pct + '%' : '–'}</div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// HOOKS — Intégration dans le flux existant
// ═══════════════════════════════════════════════════════════════

// Hook sur openBilan pour mettre à jour la carte
const _orig_openBilan = openBilan;
openBilan = function() {
  _orig_openBilan.apply(this, arguments);
  renderTerritoryMap();
};

// Hook sur openFiches pour appliquer les locks
const _orig_openFiches = openFiches;
openFiches = function() {
  _orig_openFiches.apply(this, arguments);
  applyFicheLocks();
};

// Hook sur drillChapter pour check boss + fiche unlock
const _orig_drillChapter = drillChapter;
drillChapter = function(chapter) {
  _orig_drillChapter.apply(this, arguments);
};

// Patch de la fonction qui enregistre les bonnes réponses
// On cherche où S.byChapter[q.chapter].ok++ et on ajoute nos checks après
// Puisqu'on ne peut pas patcher inline, on overrride nextQ / le flux

// Vérification au démarrage
document.addEventListener('DOMContentLoaded', () => {
  // Appliquer les locks initiaux dès que les tabs sont dans le DOM
  setTimeout(applyFicheLocks, 500);
});

// Observer les mutations du DOM pour les fiches tabs (elles sont générées dynamiquement)
const _ficheObserver = new MutationObserver(() => {
  const tabs = document.querySelectorAll('.fiche-tab:not([data-lock-checked])');
  if (tabs.length) {
    applyFicheLocks();
    tabs.forEach(t => t.setAttribute('data-lock-checked','1'));
  }
});
_ficheObserver.observe(document.body, { childList: true, subtree: true });



// ═══════════════════════════════════════════════════════════════
// MODE SCÈNE DE CRIME — Niveau 1
// ═══════════════════════════════════════════════════════════════


// État de la scène courante
let sceneState = {
  active: false,
  scene: null,
  qi: 0,          // index question dans la scène
  questions: [],  // pool de questions pour chaque étape
  correct: 0,
  beaten: new Set(JSON.parse(localStorage.getItem('scenesBeaten') || '[]')),
};

function saveSceneBeaten() {
  localStorage.setItem('scenesBeaten', JSON.stringify([...sceneState.beaten]));
}

// ── Sélection de scène ──
function openSceneMode() {
  closeOverlay('scene-overlay');
  const el = document.getElementById('scene-cards');
  if (!el) return;
  
  el.innerHTML = SCENES.map(scene => {
    const done = sceneState.beaten.has(scene.id);
    const stepsHtml = scene.steps.map(s =>
      `<span class="scene-step-chip">${s.chapter.split(' ')[0]}…</span>`
    ).join('');
    return `<div class="scene-card" onclick="launchScene('${scene.id}')" style="border-color:${scene.color}22">
      <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${scene.color};border-radius:3px 0 0 3px"></div>
      <div class="scene-card-icon">${scene.icon}</div>
      <div class="scene-card-body">
        <div class="scene-card-title" style="color:${scene.color}">${scene.title}</div>
        <div class="scene-card-sub">Enquêteur : <em>${scene.agent}</em> · 5 questions séquencées<br>${scene.intro.slice(0,100)}…</div>
        <div class="scene-steps-preview">${stepsHtml}</div>
      </div>
      ${done ? '<span class="scene-card-badge scene-badge-done">✅ Résolue</span>' : '<span class="scene-card-badge scene-badge-new">Nouvelle</span>'}
    </div>`;
  }).join('');
  
  document.getElementById('scene-overlay').classList.add('show');
}

function launchScene(sceneId) {
  const scene = SCENES.find(s => s.id === sceneId);
  if (!scene) return;
  
  closeOverlay('scene-overlay');
  
  // Construire le pool : 1 question par étape depuis le chapitre correspondant
  const pool = scene.steps.map((step, i) => {
    const candidates = ALL_Q
      .map((q, idx) => ({ q, idx }))
      .filter(x => x.q.chapter === step.chapter);
    if (!candidates.length) return null;
    // Utiliser l'index de scène + jour comme seed pour varier sans être totalement aléatoire
    const seed = sceneId.length * 7 + i * 31 + new Date().getDate();
    return candidates[seed % candidates.length];
  }).filter(Boolean);
  
  if (pool.length < 3) {
    showToast('combo-toast', '⚠ Questions insuffisantes pour cette scène', 2000);
    return;
  }
  
  sceneState = {
    ...sceneState,
    active: true,
    scene: scene,
    qi: 0,
    questions: pool,
    correct: 0,
  };
  
  // Passer en mode scène
  S.mode = 'scene';
  S.pool = pool;
  S.pi = 0;
  
  // Afficher l'intro de la scène
  showToast('combo-toast', `🔍 ${scene.title} — ${scene.agent} entre en scène`, 2800);
  
  // Construire les dots de progression scène dans le q-counter
  const qc = document.getElementById('q-counter');
  if (qc) {
    qc.innerHTML = buildSceneProgressDots(0, pool.length);
  }
  
  // Lancer la première question
  renderQuestion(pool[0]);
}

function buildSceneProgressDots(currentIdx, total) {
  const label = sceneState.scene ? `<span style="font-size:10px;color:var(--cyan);font-weight:600;margin-right:6px">🔍 ${sceneState.scene.icon}</span>` : '';
  const dots = Array.from({length: total}, (_, i) =>
    `<span class="sq-dot ${i < currentIdx ? 'done' : i === currentIdx ? 'current' : ''}"></span>`
  ).join('');
  return `<div style="display:flex;align-items:center;gap:4px">${label}<div id="scene-progress" style="display:flex;gap:4px">${dots}</div><span style="font-size:11px;color:var(--dim);margin-left:6px">${currentIdx+1}/${total}</span></div>`;
}

function updateSceneBanner(qi) {
  const banner = document.getElementById('scene-banner');
  const label  = document.getElementById('scene-step-label');
  const narr   = document.getElementById('scene-narrative');
  
  if (!banner || !sceneState.active || !sceneState.scene) {
    if (banner) banner.style.display = 'none';
    return;
  }
  
  const step = sceneState.scene.steps[qi];
  if (!step) { banner.style.display = 'none'; return; }
  
  banner.style.display = 'block';
  label.textContent  = `Étape ${qi + 1}/${sceneState.scene.steps.length} · ${sceneState.scene.agent}`;
  narr.textContent   = step.narrative;
}

// ── Hook sur renderQuestion pour la scène ──
const _scene_orig_renderQ = renderQuestion;
renderQuestion = function(item) {
  _scene_orig_renderQ.apply(this, arguments);
  
  if (sceneState.active && sceneState.scene) {
    const qi = sceneState.questions.indexOf(item);
    const effectiveQi = qi >= 0 ? qi : sceneState.qi;
    updateSceneBanner(effectiveQi);
    
    const qc = document.getElementById('q-counter');
    if (qc) qc.innerHTML = buildSceneProgressDots(effectiveQi, sceneState.questions.length);
  }
};

// ── Hook sur validate pour avancer dans la scène ──
const _scene_orig_validate = validate;
validate = function() {
  _scene_orig_validate.apply(this, arguments);
  
  if (!sceneState.active) return;
  
  // Vérifier si c'est la dernière question de la scène
  // S.pi a déjà avancé après getNext() dans nextQuestion
};

// ── Hook sur nextQuestion pour détecter fin de scène ──
const _scene_orig_nextQ = nextQuestion;
nextQuestion = function() {
  if (sceneState.active && S.mode === 'scene') {
    // Compter la question qui vient d'être répondue
    if (S.answered) {
      const q = S.curQ;
      const selCorrect = S.selCorrect || new Map();
      const ok = [...selCorrect.values()].filter(Boolean).length === q.answers.length
                 && S.sel.size === q.answers.length;
      if (ok) sceneState.correct++;
      sceneState.qi++;
    }
    
    // Si plus de questions dans la scène → fin
    if (S.pi >= sceneState.questions.length) {
      setTimeout(endScene, 800);
      return;
    }
  }
  _scene_orig_nextQ.apply(this, arguments);
};

function endScene() {
  sceneState.active = false;
  S.mode = 'normal';
  
  const scene = sceneState.scene;
  const correct = sceneState.correct;
  const total = sceneState.questions.length;
  const won = correct >= Math.ceil(total * 0.6);
  
  // Masquer la bannière scène
  const banner = document.getElementById('scene-banner');
  if (banner) banner.style.display = 'none';
  
  // Bonus XP
  const xpBonus = won ? correct * 25 + 50 : correct * 10;
  addXp(xpBonus);
  
  if (won && !sceneState.beaten.has(scene.id)) {
    sceneState.beaten.add(scene.id);
    saveSceneBeaten();
  }
  
  // Afficher l'overlay de fin
  const overlay = document.getElementById('scene-end-overlay');
  document.getElementById('scene-end-icon').textContent = won ? scene.icon + ' 🏆' : scene.icon + ' 💔';
  document.getElementById('scene-end-title').textContent = won ? 'Affaire résolue !' : 'Enquête incomplète';
  document.getElementById('scene-end-title').style.color = won ? 'var(--green)' : 'var(--red)';
  document.getElementById('scene-end-result').textContent =
    `${correct}/${total} étapes réussies · +${xpBonus} XP · ${scene.title}`;
  document.getElementById('scene-end-debrief').innerHTML =
    `<strong style="color:var(--cyan)">Bilan d'enquête</strong><br>${scene.debrief}`;
  
  overlay.style.display = 'flex';
  if (won) spawnParticles(window.innerWidth/2, window.innerHeight/2, true);
}

function closeSceneEnd() {
  document.getElementById('scene-end-overlay').style.display = 'none';
  const qc = document.getElementById('q-counter');
  if (qc) qc.textContent = '';
  buildPool();
  renderQuestion(getNext());
}

// Mode 'scene' dans buildPool — pool déjà défini par launchScene, ne pas le reconstruire
const _scene_orig_buildPool = buildPool;
buildPool = function() {
  if (S.mode === 'scene') return; // Le pool scène est géré par launchScene
  _scene_orig_buildPool.apply(this, arguments);
};



// ═══════════════════════════════════════════════════════════════
// NIVEAU 4A — RAPPORT D'EXPERTISE JUDICIAIRE (PDF simulé)
// ═══════════════════════════════════════════════════════════════

// Générateurs d'erreurs forensiques par chapitre
const FORENSIC_ERROR_TEMPLATES = {
  "NTFS": (q, wrong, correct) => ({
    category: "Analyse NTFS",
    error: `L'expert a affirmé que "${wrong}" concernant la structure NTFS, alors que "${correct}" est la réalité technique.`,
    consequence: "Cette confusion entre les attributs $STANDARD_INFORMATION et $FILE_NAME, ou entre le MFT record et ses attributs, est susceptible d'être attaquée par la défense sur la base de l'intégrité méthodologique.",
    severity: "MAJEURE",
  }),
  "FAT12 / FAT16 / FAT32": (q, wrong, correct) => ({
    category: "Analyse FAT",
    error: `L'expert a caractérisé la structure FAT en indiquant "${wrong}", ce qui est inexact — la réponse correcte est "${correct}".`,
    consequence: "Une erreur sur la structure FAT (chaînage, entrées SFN/LFN, valeurs spéciales) invalide potentiellement la reconstruction du système de fichiers présentée au tribunal.",
    severity: "SIGNIFICATIVE",
  }),
  "exFAT": (q, wrong, correct) => ({
    category: "Analyse exFAT",
    error: `Concernant exFAT, l'expert a conclu "${wrong}" au lieu de "${correct}".`,
    consequence: "L'inexactitude sur la bitmap d'allocation, les offsets du boot sector ou le flag NoFatChain peut compromettre la preuve d'accès ou de suppression de fichiers.",
    severity: "SIGNIFICATIVE",
  }),
  "Acquisition et préservation": (q, wrong, correct) => ({
    category: "Protocole d'acquisition",
    error: `L'expert a appliqué la procédure suivante : "${wrong}", alors que le standard forensique requiert "${correct}".`,
    consequence: "Toute déviation au protocole d'acquisition (RFC 3227, ISO/IEC 27037) expose l'intégrité de la preuve à une contestation d'irrecevabilité devant le Tribunal pénal fédéral.",
    severity: "CRITIQUE",
  }),
  "Artefacts temporels et MAC times": (q, wrong, correct) => ({
    category: "Analyse temporelle",
    error: `L'expert a conclu sur les timestamps en indiquant "${wrong}", alors que "${correct}" est la valeur exacte ou la bonne interprétation.`,
    consequence: "Une erreur sur les MAC times NTFS ou la précision FAT (2s) peut invalider toute la chronologie présentée — argument central de la défense dans les affaires de timestomping.",
    severity: "MAJEURE",
  }),
  "Windows — Artefacts et exécution": (q, wrong, correct) => ({
    category: "Artefacts Windows — Exécution",
    error: `L'expert a déclaré que "${wrong}" concernant les artefacts d'exécution Windows, alors que "${correct}".`,
    consequence: "Confondre Prefetch, Amcache et ShimCache — ou leurs significations forensiques — affaiblit la preuve d'exécution d'un programme malveillant devant un expert contradicteur.",
    severity: "MAJEURE",
  }),
  "Windows — Registre et artefacts": (q, wrong, correct) => ({
    category: "Registre Windows",
    error: `Concernant le registre Windows, l'expert a affirmé "${wrong}" en lieu et place de "${correct}".`,
    consequence: "Une méprise sur les ruches (HKLM vs HKCU), les clés de persistance ou USBSTOR fragilise la démonstration de la présence ou de l'action d'un acteur sur le système.",
    severity: "SIGNIFICATIVE",
  }),
  "Windows — Journaux et Event Logs": (q, wrong, correct) => ({
    category: "Event Logs Windows",
    error: `L'expert a cité l'Event ID ou l'interprétation suivante : "${wrong}", alors que "${correct}" est la valeur correcte.`,
    consequence: "Confondre les Event IDs (4624/4625, 4688, 7045) ou leur signification expose le rapport à une contradiction technique immédiate lors de la confrontation d'experts.",
    severity: "MAJEURE",
  }),
  "Chiffrement symétrique": (q, wrong, correct) => ({
    category: "Cryptographie symétrique",
    error: `Sur le chiffrement symétrique, l'expert a avancé "${wrong}" alors que "${correct}" est exact.`,
    consequence: "Une confusion sur les modes AES (ECB/CBC/GCM) ou les propriétés de XOR peut conduire à surévaluer ou sous-évaluer la difficulté d'accès aux données chiffrées.",
    severity: "SIGNIFICATIVE",
  }),
  "Chiffrement asymétrique et RSA": (q, wrong, correct) => ({
    category: "Cryptographie asymétrique — RSA",
    error: `L'expert a formulé "${wrong}" en matière de RSA/PKI, alors que la réponse exacte est "${correct}".`,
    consequence: "Une erreur sur RSA (rôles clé publique/privée, signature vs chiffrement) invalide l'argument de non-répudiation ou de confidentialité dans le rapport.",
    severity: "MAJEURE",
  }),
  "Procédure pénale": (q, wrong, correct) => ({
    category: "Droit — Procédure pénale (CPP)",
    error: `L'expert a avancé "${wrong}" sur une question de procédure pénale, alors que "${correct}" est la disposition applicable.`,
    consequence: "Une erreur de droit procédural (CPP suisse) dans un rapport d'expertise est particulièrement grave — la défense peut demander la nullité de la procédure sur cette base.",
    severity: "CRITIQUE",
  }),
  "Perquisition de documents": (q, wrong, correct) => ({
    category: "Droit — Perquisition et saisie",
    error: `Concernant la perquisition informatique, l'expert a indiqué "${wrong}" au lieu de "${correct}".`,
    consequence: "Une erreur sur les règles de perquisition (art. 244–248 CPP, mise sous scellés) peut entraîner l'irrecevabilité des preuves obtenues.",
    severity: "CRITIQUE",
  }),
  "Expertise et rapport judiciaire": (q, wrong, correct) => ({
    category: "Méthodologie du rapport",
    error: `L'expert a répondu "${wrong}" sur une question relative à la rédaction d'une expertise judiciaire (réponse exacte : "${correct}").`,
    consequence: "Une erreur sur les exigences formelles du rapport (art. 184–188 CPP, distinction fait/opinion) fragilise l'admissibilité même du document.",
    severity: "CRITIQUE",
  }),
  "Hachage et intégrité": (q, wrong, correct) => ({
    category: "Intégrité des preuves — Hachage",
    error: `L'expert a affirmé "${wrong}" concernant les fonctions de hachage, alors que "${correct}".`,
    consequence: "Confondre MD5, SHA-1 et SHA-256, ou mal interpréter la chaîne de custody hashée, permet à la défense de contester l'intégrité de l'image forensique elle-même.",
    severity: "MAJEURE",
  }),
  "Fondamentaux OSINT": (q, wrong, correct) => ({
    category: "OSINT — Méthodologie",
    error: `Sur la méthodologie OSINT, l'expert a indiqué "${wrong}" alors que "${correct}".`,
    consequence: "Une erreur de méthode OSINT (corroboration insuffisante, cloisonnement absent) expose les conclusions à une contestation sur la fiabilité des sources.",
    severity: "SIGNIFICATIVE",
  }),
  "Réseau, protocoles et Internet": (q, wrong, correct) => ({
    category: "Forensique réseau",
    error: `Concernant les protocoles réseau, l'expert a conclu "${wrong}" alors que "${correct}" est correct.`,
    consequence: "Confondre les couches OSI, les flags TCP ou les mécanismes DNS fragilise l'attribution de l'action à un équipement ou à une personne.",
    severity: "SIGNIFICATIVE",
  }),
  "_default": (q, wrong, correct) => ({
    category: q.chapter || "Analyse forensique",
    error: `L'expert a répondu "${wrong}" à la question relative à ${q.chapter || "ce domaine"}, alors que la réponse exacte est "${correct}".`,
    consequence: "Cette erreur technique peut être exploitée par un expert contradicteur pour affaiblir la crédibilité globale du rapport d'expertise.",
    severity: "SIGNIFICATIVE",
  }),
};

function getSeverityColor(severity) {
  if (severity === "CRITIQUE") return "#ff4060";
  if (severity === "MAJEURE") return "#f0883e";
  return "#f0c040";
}

function generateExpertReport() {
  const wrong = EX.answers.filter(a => !a.ok);
  const correct = EX.answers.filter(a => a.ok);
  const pct = Math.round(EX.answers.filter(a=>a.ok).length / EX.answers.length * 100);
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-CH', {day:'2-digit',month:'long',year:'numeric'});
  const refNum = 'EXP-' + now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + Math.floor(Math.random()*9000+1000);
  
  // Générer les erreurs
  const errors = wrong.map((a, i) => {
    const tmpl = FORENSIC_ERROR_TEMPLATES[a.q.chapter] || FORENSIC_ERROR_TEMPLATES["_default"];
    const wrongText = a.sel.map(s => a.q.opts[s]).join(', ') || '(sans réponse)';
    const correctText = a.ans.map(s => a.q.opts[s]).join(', ');
    return { ...tmpl(a.q, wrongText, correctText), num: i+1, chapter: a.q.chapter, question: a.q.q };
  });
  
  const noteNum = pct >= 85 ? 6 : pct >= 70 ? 5 : pct >= 60 ? 4 : pct >= 50 ? 3 : pct >= 30 ? 2 : 1;
  const noteColor = noteNum >= 5 ? '#30e88a' : noteNum >= 4 ? '#f0c040' : '#ff4060';
  
  const criticCount = errors.filter(e => e.severity === 'CRITIQUE').length;
  const majorCount = errors.filter(e => e.severity === 'MAJEURE').length;
  
  const reportHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport d'expertise — ${refNum}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap');
  :root { --red:#cc2233; --gold:#b8860b; --green:#1a7a3a; --text:var(--bg); --muted:var(--dim); --border:#ccc; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'IBM Plex Serif',Georgia,serif; color:var(--text); background:#f8f7f3; font-size:11pt; line-height:1.6; }
  .page { max-width:800px; margin:0 auto; background:var(--text); box-shadow:0 2px 20px rgba(0,0,0,.1); }
  
  /* EN-TÊTE */
  .page-header { padding:28px 48px 20px; border-bottom:3px solid var(--text); position:relative; }
  .header-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
  .logo-block { font-family:'IBM Plex Mono',monospace; }
  .logo-main { font-size:22pt; font-weight:600; letter-spacing:-1px; color:var(--text); }
  .logo-sub { font-size:8pt; color:var(--muted); letter-spacing:.1em; text-transform:uppercase; margin-top:2px; }
  .ref-block { text-align:right; font-family:'IBM Plex Mono',monospace; font-size:8pt; color:var(--muted); }
  .doc-title { font-size:15pt; font-weight:600; letter-spacing:.05em; text-transform:uppercase; text-align:center; color:var(--text); margin:10px 0 4px; }
  .doc-subtitle { text-align:center; font-size:9pt; color:var(--muted); font-style:italic; }
  
  /* CORPS */
  .page-body { padding:28px 48px; }
  
  /* FICHE RÉSUMÉ */
  .summary-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; border:1px solid var(--border); margin:16px 0; }
  .sg-row { display:contents; }
  .sg-label { padding:7px 14px; font-size:9pt; color:var(--muted); text-transform:uppercase; letter-spacing:.07em; border-bottom:1px solid var(--border); background:#f9f9f9; border-right:1px solid var(--border); }
  .sg-value { padding:7px 14px; font-size:10pt; border-bottom:1px solid var(--border); }
  .sg-row:last-child .sg-label, .sg-row:last-child .sg-value { border-bottom:none; }
  
  /* NOTE */
  .grade-block { display:flex; align-items:center; justify-content:center; gap:24px; padding:18px; border:2px solid; border-radius:4px; margin:16px 0; }
  .grade-num { font-family:'IBM Plex Mono',monospace; font-size:42pt; font-weight:600; line-height:1; }
  .grade-label { font-size:10pt; line-height:1.5; }
  
  /* ERREURS */
  .section-title { font-size:11pt; font-weight:600; text-transform:uppercase; letter-spacing:.08em; border-bottom:2px solid var(--text); padding-bottom:4px; margin:20px 0 12px; }
  .error-item { border:1px solid var(--border); border-left:4px solid; border-radius:2px; padding:12px 14px; margin-bottom:12px; }
  .error-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
  .error-num { font-family:'IBM Plex Mono',monospace; font-size:8pt; color:var(--muted); }
  .error-category { font-size:8pt; font-weight:600; text-transform:uppercase; letter-spacing:.08em; padding:2px 8px; border-radius:2px; }
  .error-severity { font-family:'IBM Plex Mono',monospace; font-size:7.5pt; font-weight:600; padding:2px 6px; border:1px solid; border-radius:2px; }
  .error-question { font-size:8.5pt; color:var(--muted); font-style:italic; margin-bottom:8px; border-left:2px solid #ddd; padding-left:8px; }
  .error-text { font-size:10pt; margin-bottom:8px; }
  .error-consequence { font-size:9pt; color:var(--muted); padding:8px 10px; background:#f9f9f9; border-radius:2px; border-left:3px solid #ccc; }
  .error-consequence strong { color:var(--text); }
  
  /* CONCLUSION */
  .conclusion-box { padding:14px; background:#f5f5f5; border:1px solid var(--border); margin-top:16px; font-size:9.5pt; line-height:1.65; }
  .conclusion-box h3 { font-size:10pt; text-transform:uppercase; letter-spacing:.07em; margin-bottom:8px; }
  
  /* SIGNATURE */
  .signature-block { margin-top:28px; padding-top:16px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:flex-end; font-size:9pt; color:var(--muted); }
  
  /* PIED DE PAGE */
  .page-footer { padding:10px 48px; border-top:1px solid var(--border); display:flex; justify-content:space-between; font-size:7.5pt; color:var(--muted); font-family:'IBM Plex Mono',monospace; }
  
  /* PRINT */
  @media print {
    body { background:var(--text); }
    .page { box-shadow:none; max-width:100%; }
    .no-print { display:none !important; }
    .error-item { break-inside:avoid; }
  }
  .no-print { display:flex; justify-content:center; gap:12px; padding:16px; background:#f0f0f0; border-top:1px solid var(--border); }
  .btn-print { padding:8px 24px; background:var(--bg); color:var(--text); border:none; border-radius:4px; font-size:10pt; cursor:pointer; font-family:'IBM Plex Mono',monospace; }
  .btn-close-r { padding:8px 24px; background:transparent; color:var(--dim); border:1px solid #ccc; border-radius:4px; font-size:10pt; cursor:pointer; font-family:'IBM Plex Mono',monospace; }
</style>
</head>
<body>
<div class="no-print">
  <button type="button" class="btn-print" onclick="window.print()">🖨 Imprimer / Enregistrer en PDF</button>
  <button type="button" class="btn-close-r" onclick="window.close()">✕ Fermer</button>
</div>
<div class="page">

  <!-- EN-TÊTE -->
  <div class="page-header">
    <div class="header-top">
      <div class="logo-block">
        <div class="logo-main">CAS-IN</div>
        <div class="logo-sub">Forensique numérique · Simulation judiciaire</div>
      </div>
      <div class="ref-block">
        Réf. : ${refNum}<br>
        Date : ${dateStr}<br>
        Confidentiel — usage pédagogique
      </div>
    </div>
    <div class="doc-title">Rapport d'expertise judiciaire</div>
    <div class="doc-subtitle">Document simulé à des fins de formation — ne constitue pas un acte judiciaire</div>
  </div>

  <!-- CORPS -->
  <div class="page-body">

    <!-- Fiche résumé -->
    <div class="section-title">I. Identification du mandat</div>
    <div class="summary-grid">
      <div class="sg-row"><div class="sg-label">Mandant simulé</div><div class="sg-value">Tribunal pénal fédéral — Bellinzone (fictif)</div></div>
      <div class="sg-row"><div class="sg-label">Expert désigné</div><div class="sg-value">Analyste CAS-IN — Simulation de formation</div></div>
      <div class="sg-row"><div class="sg-label">Mission</div><div class="sg-value">Analyse forensique d'un support numérique · Avis d'expert</div></div>
      <div class="sg-row"><div class="sg-label">Questions posées</div><div class="sg-value">${EX.answers.length} questions d'évaluation de compétences</div></div>
      <div class="sg-row"><div class="sg-label">Base normative</div><div class="sg-value">ISO/IEC 27037 · NIST SP 800-86 · CPP suisse (RS 312.0)</div></div>
    </div>

    <!-- Note globale -->
    <div class="section-title">II. Évaluation globale</div>
    <div class="grade-block" style="border-color:${noteColor}20;background:${noteColor}08">
      <div class="grade-num" style="color:${noteColor}">${noteNum}<span style="font-size:22pt;color:#888">/6</span></div>
      <div class="grade-label">
        <strong>${pct}% de réponses correctes</strong><br>
        ${correct.length} / ${EX.answers.length} questions exactes<br>
        ${criticCount} erreur(s) <strong style="color:#cc2233">CRITIQUE</strong> · ${majorCount} <strong style="color:#b8860b">MAJEURE</strong> · ${errors.length - criticCount - majorCount} <strong style="color:#b8860b">SIGNIFICATIVE</strong>
      </div>
    </div>

    ${errors.length === 0 ? `
    <div class="conclusion-box" style="border-left:4px solid #1a7a3a;background:#f0fff4">
      <h3 style="color:#1a7a3a">Aucune erreur relevée</h3>
      L'expert a répondu correctement à l'ensemble des questions soumises. Le rapport ne présente aucune vulnérabilité méthodologique identifiable sur la base de cette évaluation.
    </div>` : `

    <!-- Erreurs -->
    <div class="section-title" style="page-break-before:auto">III. Erreurs méthodologiques relevées</div>
    <p style="font-size:9pt;color:var(--dim);margin-bottom:14px;font-style:italic">Les points suivants constituent des lacunes ou erreurs susceptibles d'être soulevées lors d'une confrontation d'experts ou d'une mise en cause de la qualité du rapport.</p>
    
    ${errors.map(err => `
    <div class="error-item" style="border-left-color:${getSeverityColor(err.severity)}">
      <div class="error-header">
        <span class="error-num">Erreur n° ${err.num} — ${err.chapter}</span>
        <span class="error-severity" style="color:${getSeverityColor(err.severity)};border-color:${getSeverityColor(err.severity)}40">${err.severity}</span>
      </div>
      <div class="error-question">« ${err.question.replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0,200)}${err.question.length>200?'…':''} »</div>
      <div class="error-text">${err.error}</div>
      <div class="error-consequence"><strong>Risque :</strong> ${err.consequence}</div>
    </div>`).join('')}
    `}

    <!-- Conclusion -->
    <div class="section-title">IV. Conclusions et recommandations</div>
    <div class="conclusion-box">
      <h3>Avis de l'évaluateur</h3>
      ${noteNum >= 5 ? `
      L'expert démontre une maîtrise solide des techniques forensiques numériques. Les quelques imprécisions relevées n'affectent pas substantiellement la crédibilité globale du rapport. <strong>Compétences jugées suffisantes</strong> pour intervenir dans une procédure pénale sous réserve des précisions indiquées.
      ` : noteNum >= 4 ? `
      L'expert présente un niveau de compétence satisfaisant avec des lacunes ponctuelles. Les erreurs identifiées sont rectifiables par une révision ciblée des domaines concernés. <strong>Rapport acceptable</strong> avec recommandation de vérification des points signalés avant dépôt auprès du tribunal.
      ` : noteNum >= 3 ? `
      Des lacunes significatives ont été identifiées dans plusieurs domaines clés. Le rapport, tel que simulé, comporterait des vulnérabilités exploitables par la défense. <strong>Complément de formation recommandé</strong> avant toute intervention judiciaire.
      ` : `
      Des erreurs critiques ont été identifiées dans des domaines fondamentaux (procédure, intégrité des preuves, protocole d'acquisition). En l'état, ce rapport serait susceptible d'être écarté lors d'une confrontation d'experts. <strong>Formation complémentaire nécessaire</strong> avant toute mission forensique.
      `}
    </div>

    <!-- Signature -->
    <div class="signature-block">
      <div>CAS-IN · Simulation pédagogique<br>Quiz forensique numérique</div>
      <div style="text-align:right">
        <div style="width:160px;border-bottom:1px solid #999;margin-bottom:4px"></div>
        Expert simulé<br>${dateStr}
      </div>
    </div>

  </div><!-- /page-body -->
  
  <div class="page-footer">
    <span>${refNum}</span>
    <span>Document pédagogique — usage interne CAS-IN</span>
    <span>${dateStr}</span>
  </div>

</div><!-- /page -->
</body>
</html>`;

  const blob = new Blob([reportHTML], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ═══════════════════════════════════════════════════════════════
// NIVEAU 4B — MISSION COMPLÈTE (30 questions / 6 phases)
// ═══════════════════════════════════════════════════════════════


let missionState = {
  active: false,
  phaseIdx: 0,
  phaseAnswers: [], // answers per phase: [{q, ok}]
  allAnswers: [],
  pool: [],         // all 30 questions
  qi: 0,
  beaten: new Set(JSON.parse(localStorage.getItem('missionBeaten') || '[]')),
};

function openMission() {
  document.getElementById('mission-overlay').style.display = 'flex';

  // En-tête narratif (réécrit dynamiquement à l'ouverture)
  const narrativeEl = document.getElementById('mission-narrative');
  if (narrativeEl) {
    const beaten = missionState.beaten.size;
    const totalPhases = MISSION_PHASES.length;
    if (beaten === 0) {
      narrativeEl.textContent = "Une cybercriminalité vient d'être signalée. De la perquisition au rapport judiciaire, vous menez l'enquête.";
    } else if (beaten < totalPhases) {
      narrativeEl.textContent = `Vous avez déjà résolu ${beaten} phase${beaten>1?'s':''}. Continuez l'enquête jusqu'au verdict final.`;
    } else {
      narrativeEl.textContent = "Vous avez déjà bouclé une mission complète. Replongez dans une nouvelle enquête pour battre votre record.";
    }
  }

  // Récap budget : durée estimée, XP max, récompense
  const totalQ = MISSION_PHASES.reduce((s,p) => s + p.questions_per_phase, 0);
  const xpMax = totalQ * 10; // estimation : ~10 XP par bonne réponse
  const minutes = Math.round(totalQ * 0.5);  // ~30s par question
  const budgetEl = document.getElementById('mission-budget');
  if (budgetEl) {
    budgetEl.innerHTML = '';
    const items = [
      { icon: '⏱', text: '~' + minutes + ' min' },
      { icon: '⚡', text: '+' + xpMax + ' XP max', color: 'var(--purple)' },
      { icon: '🏅', text: 'Badge "Inspecteur"', color: 'var(--gold)' },
    ];
    items.forEach((it,i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'mission-budget-sep';
        sep.textContent = '·';
        budgetEl.appendChild(sep);
      }
      const sp = document.createElement('span');
      sp.className = 'mission-budget-item';
      if (it.color) sp.style.color = it.color;
      sp.textContent = it.icon + ' ' + it.text;
      budgetEl.appendChild(sp);
    });
  }

  // Timeline des phases (au lieu de la grille 3×2)
  const prev = document.getElementById('mission-phases-preview');
  prev.innerHTML = '';
  prev.className = 'mission-timeline';
  MISSION_PHASES.forEach(p => {
    const isBeaten = missionState.beaten.has(p.num);
    const row = document.createElement('div');
    row.className = 'mission-phase-row' + (isBeaten ? ' is-beaten' : '');
    row.style.setProperty('--phase-color', p.color);

    const icon = document.createElement('span');
    icon.className = 'mission-phase-icon';
    icon.textContent = p.icon;

    const body = document.createElement('div');
    body.className = 'mission-phase-body';
    const lbl = document.createElement('div');
    lbl.className = 'mission-phase-label';
    lbl.textContent = `Phase ${p.num} · ${p.questions_per_phase} q`;
    const ttl = document.createElement('div');
    ttl.className = 'mission-phase-title';
    ttl.textContent = p.title;
    body.appendChild(lbl);
    body.appendChild(ttl);

    const status = document.createElement('span');
    status.className = 'mission-phase-status';
    status.textContent = isBeaten ? '✓' : '○';

    row.appendChild(icon);
    row.appendChild(body);
    row.appendChild(status);
    prev.appendChild(row);
  });
}

function closeMissionIntro() {
  document.getElementById('mission-overlay').style.display = 'none';
}

function startMission() {
  document.getElementById('mission-overlay').style.display = 'none';
  
  // Construire le pool de 30 questions (5 par phase)
  const pool = [];
  MISSION_PHASES.forEach((phase, pi) => {
    const candidates = ALL_Q.map((q,i) => ({q,i}))
      .filter(x => phase.chapters.includes(x.q.chapter));
    const seed = pi * 37 + new Date().getDate();
    const picked = shuffle([...candidates]).slice(0, phase.questions_per_phase);
    pool.push(...picked.map(x => ({ q: x.q, idx: x.i, phaseIdx: pi })));
  });
  
  missionState = {
    ...missionState,
    active: true,
    phaseIdx: 0,
    phaseAnswers: MISSION_PHASES.map(() => []),
    allAnswers: [],
    pool,
    qi: 0,
  };
  
  S.mode = 'mission';
  S.pool = pool.map(x => ({q: x.q, idx: x.idx}));
  S.pi = 0;
  
  showMissionPhaseTransition(0, () => {
    renderQuestion(S.pool[0]);
  });
}

function showMissionPhaseTransition(phaseIdx, callback) {
  const phase = MISSION_PHASES[phaseIdx];
  const overlay = document.getElementById('mission-phase-overlay');
  
  document.getElementById('mp-icon').textContent = phase.icon;
  document.getElementById('mp-phase').textContent = `Phase ${phase.num} sur ${MISSION_PHASES.length}`;
  document.getElementById('mp-title').style.color = phase.color;
  document.getElementById('mp-title').textContent = phase.title;
  document.getElementById('mp-desc').textContent = phase.desc;
  
  const fill = document.getElementById('mp-progress-fill');
  const pct = (phaseIdx / MISSION_PHASES.length) * 100;
  fill.style.width = pct + '%';
  fill.style.background = `linear-gradient(90deg, ${MISSION_PHASES[0].color}, ${phase.color})`;
  
  const btn = document.getElementById('mp-continue');
  btn.textContent = phaseIdx === 0 ? '🚀 Démarrer la mission' : `Phase ${phase.num} — Commencer →`;
  btn.onclick = () => {
    overlay.style.display = 'none';
    if (callback) callback();
  };
  
  overlay.style.display = 'flex';
}

function continueMission() {
  document.getElementById('mission-phase-overlay').style.display = 'none';
  if (S.pi < S.pool.length) renderQuestion(S.pool[S.pi]);
}

// Hook nextQuestion pour la mission
const _mission_orig_nextQ = nextQuestion;
nextQuestion = function() {
  if (!missionState.active || S.mode !== 'mission') {
    _mission_orig_nextQ.apply(this, arguments);
    return;
  }
  
  // Enregistrer la réponse de la phase courante
  if (S.answered) {
    const q = S.curQ;
    const selCorrect = S.selCorrect || new Map();
    const ok = [...selCorrect.values()].filter(Boolean).length === q.answers.length
               && S.sel.size === q.answers.length;
    
    const poolItem = missionState.pool[missionState.qi];
    const phaseIdx = poolItem ? poolItem.phaseIdx : missionState.phaseIdx;
    missionState.phaseAnswers[phaseIdx].push({ q, ok });
    missionState.allAnswers.push({ q, ok, phaseIdx });
    missionState.qi++;
    
    // Fin de phase ?
    const nextItem = missionState.pool[missionState.qi];
    const nextPhase = nextItem ? nextItem.phaseIdx : -1;
    
    if (nextPhase > phaseIdx && nextPhase < MISSION_PHASES.length) {
      missionState.phaseIdx = nextPhase;
      // Transition de phase après un délai pour voir le feedback
      setTimeout(() => {
        _mission_orig_nextQ.apply(this, arguments);
        showMissionPhaseTransition(nextPhase, null);
      }, 1200);
      return;
    }
  }
  
  // Fin de mission ?
  if (S.pi >= S.pool.length) {
    setTimeout(endMission, 1200);
    return;
  }
  
  _mission_orig_nextQ.apply(this, arguments);
};

function endMission() {
  missionState.active = false;
  S.mode = 'normal';
  
  const total = missionState.allAnswers.length;
  const correct = missionState.allAnswers.filter(a => a.ok).length;
  const pct = total > 0 ? Math.round(correct / total * 100) : 0;
  const noteNum = pct >= 85 ? 6 : pct >= 70 ? 5 : pct >= 60 ? 4 : pct >= 50 ? 3 : pct >= 30 ? 2 : 1;
  const noteColor = noteNum >= 5 ? '#30e88a' : noteNum >= 4 ? '#f0c040' : '#ff4060';
  
  const verdicts = {
    6: ["🏆 Mission accomplie avec brio", "Maîtrise exemplaire de tous les domaines forensiques."],
    5: ["🎯 Mission réussie", "Solide expertise forensique — quelques nuances à peaufiner."],
    4: ["✅ Mission acceptable", "Niveau satisfaisant. Certains domaines nécessitent un renforcement."],
    3: ["⚠ Mission partielle", "Lacunes significatives dans plusieurs phases. Révision recommandée."],
    2: ["❌ Mission échouée", "Des erreurs critiques compromettent la valeur probante du travail."],
    1: ["💀 Mission abandonnée", "Niveau insuffisant. Formation approfondie requise avant toute mission réelle."],
  };
  
  addXp(correct * 30 + (noteNum >= 5 ? 200 : 0));
  
  if (noteNum >= 5 && !missionState.beaten.has('mission')) {
    missionState.beaten.add('mission');
    localStorage.setItem('missionBeaten', JSON.stringify([...missionState.beaten]));
  }
  
  // Afficher l'overlay de fin
  const overlay = document.getElementById('mission-end-overlay');
  document.getElementById('me-icon').textContent = verdicts[noteNum][0].split(' ')[0];
  document.getElementById('me-grade').innerHTML = `<span style="color:${noteColor}">${noteNum}</span><span style="font-size:1.5rem;color:var(--dim)">/6</span>`;
  document.getElementById('me-verdict').textContent = verdicts[noteNum][0];
  document.getElementById('me-verdict').style.color = noteColor;
  document.getElementById('me-score').textContent = `${correct}/${total} correctes (${pct}%) · ${verdicts[noteNum][1]}`;
  
  const grid = document.getElementById('me-phases-grid');
  grid.innerHTML = MISSION_PHASES.map((phase, i) => {
    const pa = missionState.phaseAnswers[i] || [];
    const pOk = pa.filter(a => a.ok).length;
    const pTot = pa.length;
    const pPct = pTot ? Math.round(pOk/pTot*100) : 0;
    const col = pPct >= 70 ? '#30e88a' : pPct >= 50 ? '#f0c040' : '#ff4060';
    return `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px;display:flex;gap:8px;align-items:center">
      <span style="font-size:20px">${phase.icon}</span>
      <div style="flex:1">
        <div style="font-size:10px;color:${phase.color};font-weight:600;text-transform:uppercase;letter-spacing:.05em">Phase ${phase.num}</div>
        <div style="font-size:11px;color:var(--text)">${phase.title}</div>
      </div>
      <div style="font-size:16px;font-weight:700;color:${col}">${pPct}%</div>
    </div>`;
  }).join('');
  
  overlay.style.display = 'flex';
  if (noteNum >= 5) spawnParticles(window.innerWidth/2, window.innerHeight/2, true);
}

function closeMissionEnd() {
  document.getElementById('mission-end-overlay').style.display = 'none';
  buildPool();
  renderQuestion(getNext());
}

function generateMissionReport() {
  // Reconstruire EX.answers depuis missionState pour réutiliser generateExpertReport
  const savedAnswers = EX.answers;
  EX.answers = missionState.allAnswers.map(a => ({
    q: { q: a.q.q, chapter: a.q.chapter, opts: a.q.options, expl_ok: a.q.expl_ok, expl_ko: a.q.expl_ko },
    sel: [],
    ans: a.q.answers,
    ok: a.ok,
  }));
  generateExpertReport();
  EX.answers = savedAnswers;
}

// Mode 'mission' dans buildPool — pool géré par startMission
const _mission_orig_buildPool = buildPool;
buildPool = function() {
  if (S.mode === 'mission') return;
  _mission_orig_buildPool.apply(this, arguments);
};



// ── Dropdown Enquête ──
function toggleEnqueteMenu() {
  const menu = document.getElementById('enquete-menu');
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  closeEnqueteMenu();
  if (!isOpen) menu.classList.add('open');
}
function closeEnqueteMenu() {
  const menu = document.getElementById('enquete-menu');
  if (menu) menu.classList.remove('open');
}
// Fermer le dropdown si clic ailleurs
document.addEventListener('click', e => {
  const dd = document.getElementById('enquete-dropdown');
  if (dd && !dd.contains(e.target)) closeEnqueteMenu();
});

// ── Partager intégré dans Bilan ──
let _bilanShareOpen = false;
let _bilanShareDrawn = false;

function toggleBilanShare() {
  const content = document.getElementById('bilan-share-content');
  const label   = document.getElementById('share-toggle-label');
  if (!content) return;
  _bilanShareOpen = !_bilanShareOpen;
  content.style.display = _bilanShareOpen ? 'block' : 'none';
  label.textContent = _bilanShareOpen ? 'Masquer la carte' : 'Générer ma carte de score';
  if (_bilanShareOpen && !_bilanShareDrawn) {
    drawBilanCard();
    _bilanShareDrawn = true;
  }
}

// Reset quand on ferme le bilan
const _orig_closeOverlay = closeOverlay;
closeOverlay = function(id) {
  if (id === 'bilan-overlay') {
    _bilanShareOpen = false;
    _bilanShareDrawn = false;
    const c = document.getElementById('bilan-share-content');
    if (c) c.style.display = 'none';
    const l = document.getElementById('share-toggle-label');
    if (l) l.textContent = 'Générer ma carte de score';
  }
  _orig_closeOverlay.apply(this, arguments);
};

function drawBilanCard() {
  const canvas = document.getElementById('bilan-share-canvas');
  if (!canvas) return;
  const W = 760, H = 420;
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = '100%';
  // Réutiliser la logique de drawShareCard en copiant le canvas share
  drawShareCard && drawShareCard();
  const src = document.getElementById('share-canvas');
  if (src) {
    const ctx = canvas.getContext('2d');
    // petit délai pour laisser drawShareCard terminer
    setTimeout(() => { try { ctx.drawImage(src, 0, 0, W, H); } catch(e) {} }, 200);
  }
}

function downloadBilanCard() {
  drawBilanCard();
  setTimeout(() => {
    const c = document.getElementById('bilan-share-canvas');
    if (!c) return;
    const a = document.createElement('a');
    a.download = 'casin-score.png';
    a.href = c.toDataURL('image/png');
    a.click();
  }, 300);
}

async function copyBilanCard() {
  drawBilanCard();
  setTimeout(async () => {
    const c = document.getElementById('bilan-share-canvas');
    if (!c) return;
    try {
      c.toBlob(async blob => {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('combo-toast', '📋 Image copiée !', 2000);
      });
    } catch(e) { showToast('combo-toast', '⚠ Copie non supportée sur ce navigateur', 2000); }
  }, 300);
}

async function shareBilanCard() {
  drawBilanCard();
  setTimeout(async () => {
    const c = document.getElementById('bilan-share-canvas');
    if (!c) return;
    try {
      c.toBlob(async blob => {
        const file = new File([blob], 'casin-score.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Mon score CAS-IN', text: 'Quiz Investigation Numérique' });
        } else { downloadBilanCard(); }
      });
    } catch(e) { downloadBilanCard(); }
  }, 300);
}
