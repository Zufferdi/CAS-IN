// ═══════════════════════════════════════════════════════════════
// scene-app.js — Logique principale des scénarios DFIR
//
// v2.7 : SCENES split en scenes/index.json + scenes/{id}.json
//   • Boot : fetch scenes/index.json (~64 KB) au lieu de scenes.js (~1.6 MB)
//   • Lancement d'une scène : fetch scenes/{id}.json à la demande, mémoïsé
//   • SCENES global toujours présent → contient l'index (méta), pas les steps
//   • Compatibilité : si scenes.js est encore chargé en fallback, on l'utilise
//
// Sections :
//   • Storage utils (lsGet, lsSet)
//   • PRNG Mulberry32 (seedEncode/Decode pour défis quotidiens)
//   • Boot : loadSceneIndex() + loadFullScene(id) avec cache LRU
//   • Streak quotidien + bannière
//   • Challenge hebdo + recommandations
//   • Profile : XP, badges, ranking, export/import
//   • Stats screen + radar par module
//   • Cinema mode / canton map / timeline popup
//   • Lobby (sélection scène, filtre difficulté, modes)
//   • Run scenario : advanceStep, selectChoice, abort, replay
//
// IMPORTANT : toutes les fonctions exposées via onclick="..." dans le HTML
// (advanceStep, selectChoice, launchScene, exportProfile, …) restent
// globales (window.*).
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
// STORAGE UTILS
// ═══════════════════════════════════════════════════
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; } catch { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

// ═══════════════════════════════════════════════════
// LAZY-LOAD SCENES (v2.7)
//
// Architecture :
//   - Boot : loadSceneIndex() fetch scenes/index.json (~64 KB)
//             remplace SCENES par les méta légères (lobby + recherche)
//   - Run  : loadFullScene(id) fetch scenes/{id}.json à la demande,
//             mémoïsé en RAM (LRU 12 dernières), retourne la scène complète
//             avec steps[], choices, debrief, narrative, alertLevel détaillé.
//
// Compatibilité : si scenes.js est encore chargé (legacy), SCENES contient
// déjà les scènes complètes ⇒ on s'en sert directement (court-circuit).
// ═══════════════════════════════════════════════════
const SCENE_CACHE = new Map();           // id → scène complète (LRU)
const SCENE_CACHE_MAX = 12;
const SCENE_INDEX_URL = 'scenes/index.json';
const SCENE_FILE_URL = (id) => 'scenes/' + encodeURIComponent(id) + '.json';

let _sceneIndexLoaded = false;
let _sceneIndexPromise = null;

// Détecte si une "scène" en main est en fait juste une entrée d'index
// (pas de steps[]) ⇒ il faut hydrater avant lancement.
function isSceneFullyLoaded(scene) {
  return !!(scene && Array.isArray(scene.steps) && scene.steps.length > 0
            && scene.steps[0] && Array.isArray(scene.steps[0].choices));
}

// Charge l'index (idempotent, mémoïsé). Remplit SCENES si nécessaire.
function loadSceneIndex() {
  if (_sceneIndexLoaded) return Promise.resolve(SCENES);
  if (_sceneIndexPromise) return _sceneIndexPromise;

  // Si scenes.js (legacy) a déjà fourni des scènes complètes, on s'en sert.
  if (Array.isArray(SCENES) && SCENES.length > 0 && isSceneFullyLoaded(SCENES[0])) {
    // Pré-remplir le cache LRU avec les scènes déjà disponibles
    SCENES.forEach(s => { if (s && s.id) SCENE_CACHE.set(s.id, s); });
    _sceneIndexLoaded = true;
    return Promise.resolve(SCENES);
  }

  _sceneIndexPromise = fetch(SCENE_INDEX_URL, { cache: 'no-cache' })
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' on ' + SCENE_INDEX_URL);
      return r.json();
    })
    .then(idx => {
      if (!Array.isArray(idx)) throw new Error('Index format invalid (not an array)');
      // Réassigner SCENES — préserve la sémantique globale du code existant
      SCENES.length = 0;
      Array.prototype.push.apply(SCENES, idx);
      _sceneIndexLoaded = true;
      console.log('[scenes] Index chargé : ' + idx.length + ' scènes');
      return SCENES;
    })
    .catch(err => {
      console.error('[scenes] Index échec :', err.message);
      _sceneIndexPromise = null; // permettre un retry
      throw err;
    });

  return _sceneIndexPromise;
}

// Charge une scène complète (mémoïsée). Si la scène en cache contient déjà
// .steps[], on retourne directement.
function loadFullScene(id) {
  if (!id) return Promise.reject(new Error('loadFullScene: id manquant'));

  // 1. Cache hit ?
  const cached = SCENE_CACHE.get(id);
  if (cached && isSceneFullyLoaded(cached)) {
    // Refresh LRU position
    SCENE_CACHE.delete(id);
    SCENE_CACHE.set(id, cached);
    return Promise.resolve(cached);
  }

  // 2. SCENES contient peut-être la scène complète (cas legacy scenes.js)
  const fromGlobal = Array.isArray(SCENES)
    ? SCENES.find(s => s && s.id === id)
    : null;
  if (fromGlobal && isSceneFullyLoaded(fromGlobal)) {
    SCENE_CACHE.set(id, fromGlobal);
    return Promise.resolve(fromGlobal);
  }

  // 3. Fetch
  return fetch(SCENE_FILE_URL(id), { cache: 'default' })
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' on ' + SCENE_FILE_URL(id));
      return r.json();
    })
    .then(full => {
      // Mettre en cache LRU avec éviction
      if (SCENE_CACHE.size >= SCENE_CACHE_MAX) {
        const oldest = SCENE_CACHE.keys().next().value;
        SCENE_CACHE.delete(oldest);
      }
      SCENE_CACHE.set(id, full);
      // Aussi : mettre à jour SCENES (qui contient l'entrée d'index) pour
      // que les futurs SCENES.find(...) retournent la scène complète.
      const idx = SCENES.findIndex(s => s && s.id === id);
      if (idx !== -1) SCENES[idx] = full;
      return full;
    });
}

// Hydrate une scène (passée en valeur shallow ou full). Retourne toujours
// une scène complète. Utilisée avant startScene().
function hydrateScene(sceneOrShallow) {
  if (!sceneOrShallow) return Promise.reject(new Error('hydrateScene: scène nulle'));
  if (isSceneFullyLoaded(sceneOrShallow)) return Promise.resolve(sceneOrShallow);
  return loadFullScene(sceneOrShallow.id);
}


// ═══════════════════════════════════════════════════
// PRNG — Mulberry32 seeded random
// ═══════════════════════════════════════════════════
function mulberry32(seed) {
  let s = seed | 0;
  return function() {
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// Global RNG, either seeded or Math.random
let RNG = Math.random;

function seededShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(RNG() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Encode a 32-bit integer to a 7-char code like "A7F2-K3M8"
function seedEncode(n) {
  const s = (n >>> 0).toString(36).toUpperCase().padStart(7, '0');
  return s.slice(0, 4) + '-' + s.slice(4);
}
function seedDecode(code) {
  const clean = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 7) return null;
  const n = parseInt(clean, 36);
  return isNaN(n) ? null : n;
}
function generateSeed() {
  return Math.floor(Math.random() * 0xFFFFFFFF);
}

// ═══════════════════════════════════════════════════
// DAILY STREAK
// ═══════════════════════════════════════════════════
function getStreak() { return lsGet('cas_streak', { count: 0, lastDate: null }); }
function setStreak(s) { lsSet('cas_streak', s); }

function updateStreakOnActivity() {
  const today = new Date().toISOString().slice(0, 10);
  const s = getStreak();
  if (s.lastDate === today) return s; // already counted today
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (s.lastDate === yesterday) {
    s.count++;
  } else {
    s.count = 1;
  }
  s.lastDate = today;
  setStreak(s);
  return s;
}

function streakBonus(count) {
  if (count >= 30) return 1.5;
  if (count >= 7) return 1.25;
  if (count >= 3) return 1.10;
  return 1.0;
}

function renderStreakBanner() {
  const s = getStreak();
  const banner = document.getElementById('streak-banner');
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const active = s.lastDate === today || s.lastDate === yesterday;

  if (!active || s.count === 0) {
    banner.style.display = 'none';
    return;
  }
  banner.style.display = '';
  document.getElementById('streak-days').textContent = s.count + (s.count > 1 ? ' jours' : ' jour');
  const bonus = streakBonus(s.count);
  document.getElementById('streak-bonus').textContent = 'XP ×' + bonus.toFixed(2);
}

function renderNoCritBanner() {
  const count = lsGet('cas_no_crit_streak', 0);
  const banner = document.getElementById('nocrit-banner');
  if (count < 1) {
    banner.style.display = 'none';
    return;
  }
  banner.style.display = '';
  document.getElementById('nocrit-count').textContent = count;
  // Next milestone: 5, 10, 20, then stay at 20+
  let next;
  if (count < 5) next = '→ ' + (5 - count) + ' pour badge Gardien';
  else if (count < 10) next = '→ ' + (10 - count) + ' pour Chevalier';
  else if (count < 20) next = '→ ' + (20 - count) + ' pour Légende';
  else next = '✨ Conscience Irréprochable';
  document.getElementById('nocrit-next').textContent = next;
}

// ═══════════════════════════════════════════════════
// RECOMMENDED LEARNING PATH
// Progression : easy → medium → hard → expert
// Priorise les scénarios non complétés ou à améliorer (<80%)
// ═══════════════════════════════════════════════════
function computeRecommendedScene() {
  const saved = lsGet('scene_results', {});
  const hasResult = id => saved[id] !== undefined;
  const goodResult = id => saved[id] && saved[id].pct >= 80;

  // Progression order by difficulty
  const difficulties = ['easy', 'medium', 'hard', 'expert'];

  // Rule 1: if the user has no results at all, recommend the first easy
  if (Object.keys(saved).length === 0) {
    const firstEasy = SCENES.find(s => s.difficulty === 'easy');
    if (firstEasy) return { scene: firstEasy, reason: "Commencez par les bases — Le premier scénario Easy pose les fondamentaux du DFIR." };
  }

  // Rule 2: find the earliest difficulty level where coverage is incomplete
  for (const diff of difficulties) {
    const scenesOfDiff = SCENES.filter(s => s.difficulty === diff);
    const untouched = scenesOfDiff.filter(s => !hasResult(s.id));
    const notMastered = scenesOfDiff.filter(s => hasResult(s.id) && !goodResult(s.id));

    // Gate: to progress past a difficulty, you need to have done at least 60% of it at 80%+
    const masteredCount = scenesOfDiff.filter(s => goodResult(s.id)).length;
    const masteryRatio = scenesOfDiff.length ? masteredCount / scenesOfDiff.length : 1;

    // Priority A: an untouched scenario at the current difficulty level
    if (untouched.length > 0) {
      const s = untouched[0];
      const diffLabel = {
        easy: 'Débutant', medium: 'Intermédiaire', hard: 'Avancé', expert: 'Expert'
      }[diff];
      return {
        scene: s,
        reason: `<strong>${diffLabel}</strong> · Nouveau scénario : « ${s.title} »`
      };
    }

    // Priority B: a scenario done but not mastered at this difficulty
    if (notMastered.length > 0 && masteryRatio < 0.6) {
      const s = notMastered[0];
      const pct = saved[s.id].pct;
      return {
        scene: s,
        reason: `Réviser « ${s.title} » — score actuel ${pct}% · objectif 80%+`
      };
    }

    // If this difficulty is globally mastered, move to the next one
    if (masteryRatio >= 0.6) continue;

    // Otherwise, stay on this difficulty to perfect it
    if (notMastered.length > 0) {
      const s = notMastered[0];
      return {
        scene: s,
        reason: `Améliorer « ${s.title} » avant de passer au niveau supérieur`
      };
    }
  }

  // All done: suggest perfect replay of lowest scoring scene
  const all = SCENES.filter(s => hasResult(s.id));
  if (all.length === 0) return null;
  all.sort((a, b) => saved[a.id].pct - saved[b.id].pct);
  const s = all[0];
  return {
    scene: s,
    reason: `🏆 Tous les scénarios complétés ! Rejouez « ${s.title} » pour perfectionner.`
  };
}

let RECOMMENDED_SCENE_ID = null;

function renderPathBanner() {
  const banner = document.getElementById('path-banner');
  const rec = computeRecommendedScene();
  if (!rec || !rec.scene) {
    banner.style.display = 'none';
    RECOMMENDED_SCENE_ID = null;
    return;
  }
  banner.style.display = '';
  RECOMMENDED_SCENE_ID = rec.scene.id;
  document.getElementById('path-suggestion').innerHTML = rec.reason;
}

function launchRecommendedScene() {
  if (!RECOMMENDED_SCENE_ID) return;
  const scene = SCENES.find(s => s.id === RECOMMENDED_SCENE_ID);
  if (scene) hydrateScene(scene).then(startScene).catch(err => {
    console.error('[scenes] launchRecommendedScene failed:', err);
    showToast('⚠ Scène introuvable : ' + RECOMMENDED_SCENE_ID);
  });
}

// ═══════════════════════════════════════════════════
// WEEKLY CHALLENGES
// ═══════════════════════════════════════════════════
const WEEKLY_CHALLENGES = [
  { id: 'three_hard',     icon: '⚔️', title: 'Triple Hard', desc: 'Complétez 3 scénarios Difficile cette semaine', target: 3, reward: 100, match: (r, s) => s.difficulty === 'hard' && r.pct >= 60 },
  { id: 'two_no_crit',    icon: '🛡',  title: 'Protocole Impeccable', desc: '2 scénarios sans erreur critique', target: 2, reward: 80,  match: (r, s) => r.custodyPct >= 90 },
  { id: 'five_any',       icon: '🎯', title: 'Marathon Hebdo', desc: '5 scénarios complétés cette semaine', target: 5, reward: 75,  match: () => true },
  { id: 'procureur_win',  icon: '⚖️', title: 'Défi Procureur', desc: 'Complétez 2 scénarios en mode Procureur', target: 2, reward: 120, match: (r) => r.mode === 'procureur' && r.pct >= 60 },
  { id: 'real_cases_3',   icon: '📜', title: 'Historien', desc: '3 affaires réelles complétées', target: 3, reward: 100, match: (r, s) => s.realCase && r.pct >= 60 },
  { id: 'crypto_master',  icon: '🔐', title: 'Semaine Crypto', desc: '2 scénarios avec tag CRYPTO ou WINDOWS à 80%+', target: 2, reward: 90, match: (r, s) => (s.tags.includes('CRYPTO') || s.tags.includes('WINDOWS')) && r.pct >= 80 },
  { id: 'expert_run',     icon: '🎓', title: 'Procureur Expérimenté', desc: 'Complétez 1 scénario Expert à 70%+', target: 1, reward: 200, match: (r, s) => s.difficulty === 'expert' && r.pct >= 70 },
];

function isoWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const diff = d - firstThursday;
  const week = 1 + Math.floor(diff / (7 * 86400000));
  return d.getFullYear() + '-W' + String(week).padStart(2, '0');
}

function getCurrentChallenge() {
  const week = isoWeek();
  let state = lsGet('cas_challenge', null);
  if (!state || state.week !== week) {
    // Pick a new challenge deterministically from week
    const seed = week.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const ch = WEEKLY_CHALLENGES[seed % WEEKLY_CHALLENGES.length];
    state = { week, id: ch.id, runs: [], completed: false, xpAwarded: false };
    lsSet('cas_challenge', state);
  }
  return state;
}

function updateChallengeOnRun(scene, runResult) {
  const state = getCurrentChallenge();
  const ch = WEEKLY_CHALLENGES.find(c => c.id === state.id);
  if (!ch || state.completed) return { unlocked: false };
  if (ch.match(runResult, scene)) {
    // Only count once per scenario per week
    if (!state.runs.includes(scene.id)) {
      state.runs.push(scene.id);
      if (state.runs.length >= ch.target && !state.completed) {
        state.completed = true;
        lsSet('cas_challenge', state);
        return { unlocked: true, reward: ch.reward };
      }
      lsSet('cas_challenge', state);
    }
  }
  return { unlocked: false };
}

function renderChallengeBanner() {
  const state = getCurrentChallenge();
  const ch = WEEKLY_CHALLENGES.find(c => c.id === state.id);
  if (!ch) return;
  const banner = document.getElementById('challenge-banner');
  banner.style.display = '';
  banner.classList.toggle('completed', state.completed);
  document.getElementById('challenge-icon').textContent = ch.icon;
  document.getElementById('challenge-title').textContent = state.completed ? '✓ ' + ch.title + ' — Accompli' : ch.title;
  document.getElementById('challenge-desc').textContent = ch.desc;
  const pct = Math.min(100, (state.runs.length / ch.target) * 100);
  document.getElementById('challenge-progress-fill').style.width = pct + '%';
  document.getElementById('challenge-progress-text').textContent = state.runs.length + ' / ' + ch.target;
  document.getElementById('challenge-reward').textContent = '+' + ch.reward + ' XP';

  // v2.8 : update tag + time remaining
  const tagEl = document.getElementById('challenge-tag');
  const timeEl = document.getElementById('challenge-time-left');
  if (tagEl) tagEl.textContent = state.completed ? '✓ ACCOMPLI' : '⚡ DÉFI HEBDO';
  if (timeEl) {
    if (state.completed) {
      timeEl.textContent = '✓ Récompense réclamée';
    } else {
      // Compute days remaining until end of ISO week (Sunday 23:59)
      const now = new Date();
      const day = now.getDay() === 0 ? 7 : now.getDay(); // Mon=1...Sun=7
      const daysLeft = 8 - day;
      const hoursLeft = 24 - now.getHours();
      if (daysLeft <= 1) {
        timeEl.textContent = `⏰ ${hoursLeft}h restantes`;
        timeEl.style.color = 'var(--red)';
      } else {
        timeEl.textContent = `⏰ ${daysLeft} jour${daysLeft>1?'s':''} restant${daysLeft>1?'s':''}`;
        timeEl.style.color = '';
      }
    }
  }
}

// ═══════════════════════════════════════════════════
// LEADERBOARD (top 3 per scenario, local)
// ═══════════════════════════════════════════════════
function getLeaderboard(sceneId) {
  const all = lsGet('cas_leaderboards', {});
  return all[sceneId] || [];
}

function addToLeaderboard(sceneId, run) {
  const all = lsGet('cas_leaderboards', {});
  const list = all[sceneId] || [];
  // Insert in sorted order by pct desc, then custody desc
  list.push(run);
  list.sort((a, b) => (b.pct - a.pct) || ((b.custodyPct || 0) - (a.custodyPct || 0)));
  all[sceneId] = list.slice(0, 3);
  lsSet('cas_leaderboards', all);
  return all[sceneId].findIndex(r => r === run);  // may not find after slice; caller handles
}

// ═══════════════════════════════════════════════════
// REVIEW FILTER
// ═══════════════════════════════════════════════════
let REVIEW_FILTER_ACTIVE = false;
function toggleReviewFilter() {
  REVIEW_FILTER_ACTIVE = !REVIEW_FILTER_ACTIVE;
  document.getElementById('review-filter-btn').classList.toggle('active', REVIEW_FILTER_ACTIVE);
  initLobby();
  showToast(REVIEW_FILTER_ACTIVE ? '🔍 Filtre actif : scénarios à améliorer' : '✨ Tous les scénarios affichés');
}

// ═══════════════════════════════════════════════════
// RANDOM SCENARIO
// ═══════════════════════════════════════════════════
function launchRandomScene() {
  const saved = lsGet('scene_results', {});
  // Eligible: unlocked scenarios
  const eligible = SCENES.filter((s, i) => i === 0 || saved[SCENES[i - 1].id]);
  if (eligible.length === 0) return;
  const pick = eligible[Math.floor(Math.random() * eligible.length)];
  showToast('🎲 Scénario aléatoire : ' + pick.title);
  setTimeout(() => {
    hydrateScene(pick).then(startScene).catch(err => {
      console.error('[scenes] launchRandomScene failed:', err);
      showToast('⚠ Scène introuvable');
    });
  }, 400);
}

// ═══════════════════════════════════════════════════
// NOTES (per scenario)
// ═══════════════════════════════════════════════════
function getNote(sceneId) {
  const all = lsGet('cas_notes', {});
  return all[sceneId] || '';
}
function setNote(sceneId, text) {
  const all = lsGet('cas_notes', {});
  if (text && text.trim()) all[sceneId] = text.trim();
  else delete all[sceneId];
  lsSet('cas_notes', all);
}

// ═══════════════════════════════════════════════════
// RADAR CHART (SVG, 6 themes)
// ═══════════════════════════════════════════════════
const RADAR_THEMES = ['FORENSIQUE', 'DROIT', 'WINDOWS', 'CRYPTO', 'RÉSEAUX', 'OUTILS', 'INTERNATIONAL'];

function computeThemeMastery() {
  const results = lsGet('scene_results', {});
  const mastery = {};
  RADAR_THEMES.forEach(t => mastery[t] = { sum: 0, count: 0 });
  Object.entries(results).forEach(([id, r]) => {
    const scene = SCENES.find(s => s.id === id);
    if (!scene) return;
    (scene.tags || []).forEach(tag => {
      if (mastery[tag]) {
        mastery[tag].sum += r.pct;
        mastery[tag].count++;
      }
    });
    // EU region scenarios automatically count toward INTERNATIONAL track
    if (scene.region === 'EU' && mastery.INTERNATIONAL) {
      mastery.INTERNATIONAL.sum += r.pct;
      mastery.INTERNATIONAL.count++;
    }
  });
  const result = {};
  RADAR_THEMES.forEach(t => {
    result[t] = mastery[t].count > 0 ? Math.round(mastery[t].sum / mastery[t].count) : 0;
  });
  return result;
}

function renderRadar() {
  const mastery = computeThemeMastery();
  const wrap = document.getElementById('radar-canvas-wrap');
  const legend = document.getElementById('radar-legend');
  const n = RADAR_THEMES.length;
  const cx = 100, cy = 100, rMax = 70;

  // Polygon for mastery values
  const masteryPoints = RADAR_THEMES.map((theme, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const v = mastery[theme] / 100;
    const r = v * rMax;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0].map(f => {
    const pts = RADAR_THEMES.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return `${cx + rMax * f * Math.cos(angle)},${cy + rMax * f * Math.sin(angle)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="var(--border)" stroke-width="0.5" opacity="0.6"/>`;
  }).join('');

  // Axes
  const axes = RADAR_THEMES.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return `<line x1="${cx}" y1="${cy}" x2="${cx + rMax * Math.cos(angle)}" y2="${cy + rMax * Math.sin(angle)}" stroke="var(--border)" stroke-width="0.5"/>`;
  }).join('');

  // Labels at each axis tip
  const labels = RADAR_THEMES.map((theme, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const lx = cx + (rMax + 12) * Math.cos(angle);
    const ly = cy + (rMax + 12) * Math.sin(angle);
    const active = mastery[theme] >= 60;
    return `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" class="radar-axis-label${active ? ' active' : ''}">${theme.slice(0, 7)}</text>`;
  }).join('');

  // Mastery polygon + dots
  const masteryPath = masteryPoints.map(p => p.join(',')).join(' ');
  const dots = masteryPoints.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="var(--cyan)"/>`).join('');

  wrap.innerHTML = `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      ${rings}
      ${axes}
      <polygon points="${masteryPath}" fill="var(--cyan)" fill-opacity="0.15" stroke="var(--cyan)" stroke-width="1.5"/>
      ${dots}
      ${labels}
    </svg>
  `;

  legend.innerHTML = RADAR_THEMES.map(theme => {
    const v = mastery[theme];
    let cls = 't-none';
    if (v >= 80) cls = 't-high';
    else if (v >= 50) cls = 't-mid';
    else if (v > 0) cls = 't-low';
    return `
      <div class="radar-legend-row">
        <span class="radar-legend-theme">${theme}</span>
        <span class="radar-legend-pct ${cls}">${v ? v + '%' : '—'}</span>
      </div>
    `;
  }).join('');
}

function toggleRadar() {
  const grid = document.getElementById('radar-grid');
  const chev = document.getElementById('radar-chevron');
  const open = grid.style.display === '';
  grid.style.display = open ? 'none' : 'grid';
  chev.style.transform = open ? '' : 'rotate(180deg)';
  if (!open) renderRadar();
}

// ═══════════════════════════════════════════════════
// SVG ILLUSTRATIONS PER SCENARIO (abstract)
// ═══════════════════════════════════════════════════
const ILLUSTRATIONS = {
  // Chain icon for custody
  legal: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><g stroke="var(--atm-accent)" stroke-width="1.2" fill="none"><path d="M60,50 L80,50 M120,50 L140,50" stroke-dasharray="3 3"/><rect x="70" y="40" width="25" height="20" rx="10" stroke-width="2"/><rect x="105" y="40" width="25" height="20" rx="10" stroke-width="2"/><circle cx="100" cy="50" r="3" fill="var(--atm-accent)"/></g></svg>`,
  crypto: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><g stroke="var(--atm-accent)" stroke-width="1.2" fill="none"><path d="M100,20 L100,50 M85,50 L115,50 L115,80 L85,80 Z" stroke-width="2"/><path d="M90,30 Q100,18 110,30" stroke-width="2"/><circle cx="100" cy="65" r="3" fill="var(--atm-accent)"/></g></svg>`,
  network: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><g stroke="var(--atm-accent)" stroke-width="1" fill="none"><circle cx="60" cy="50" r="6" stroke-width="1.5"/><circle cx="140" cy="50" r="6" stroke-width="1.5"/><circle cx="100" cy="25" r="6" stroke-width="1.5"/><circle cx="100" cy="75" r="6" stroke-width="1.5"/><path d="M65,48 L95,30 M105,30 L135,48 M65,52 L95,72 M105,72 L135,52 M100,31 L100,69"/></g></svg>`,
  hospital: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><g stroke="var(--atm-accent)" stroke-width="1.2" fill="none"><rect x="80" y="25" width="40" height="50" rx="4" stroke-width="2"/><path d="M100,35 L100,65 M88,50 L112,50" stroke-width="2"/><path d="M50,85 L150,85" stroke-dasharray="2 2"/></g></svg>`,
  ransomware: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><g stroke="var(--atm-accent)" stroke-width="1.2" fill="none"><rect x="75" y="40" width="50" height="40" rx="2" stroke-width="2"/><path d="M85,40 L85,30 Q85,20 100,20 Q115,20 115,30 L115,40" stroke-width="2"/><path d="M90,60 L110,60 M90,68 L105,68" stroke="var(--red)"/><circle cx="100" cy="50" r="2" fill="var(--red)"/></g></svg>`,
  state: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><g stroke="var(--atm-accent)" stroke-width="1.2" fill="none"><path d="M70,75 L130,75 L130,45 L115,45 L115,30 L85,30 L85,45 L70,45 Z" stroke-width="2"/><path d="M85,55 L85,65 M95,55 L95,65 M105,55 L105,65 M115,55 L115,65" stroke-width="1.5"/><circle cx="100" cy="40" r="3" fill="var(--atm-accent)"/></g></svg>`,
  raid: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><g stroke="var(--atm-accent)" stroke-width="1.2" fill="none"><rect x="70" y="35" width="60" height="45" rx="4" stroke-width="2"/><path d="M85,50 L95,60 L115,40" stroke-width="2"/><circle cx="100" cy="25" r="5" stroke-width="1.5"/><path d="M100,30 L100,35"/></g></svg>`,
  default: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><g stroke="var(--atm-accent)" stroke-width="1.2" fill="none"><circle cx="100" cy="50" r="25" stroke-width="2"/><path d="M118,68 L135,85" stroke-width="3"/><circle cx="100" cy="50" r="10"/></g></svg>`,
};

function getIllustration(scene) {
  return ILLUSTRATIONS[scene.atmosphere] || ILLUSTRATIONS.default;
}

// ═══════════════════════════════════════════════════
// CONFETTI (on 100% runs)
// ═══════════════════════════════════════════════════
let confettiAnim = null;
function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.classList.add('active');

  const colors = ['#00e5cc', '#f0c040', '#30e88a', '#c97df5', '#ff9f40'];
  const particles = [];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 3,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * -15 - 5,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 15,
    });
  }

  const start = Date.now();
  function frame() {
    const elapsed = Date.now() - start;
    if (elapsed > 4500) {
      canvas.classList.remove('active');
      confettiAnim = null;
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;  // gravity
      p.vx *= 0.99;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    confettiAnim = requestAnimationFrame(frame);
  }
  frame();
}

// ═══════════════════════════════════════════════════
// GLITCH EFFECT
// ═══════════════════════════════════════════════════
function triggerGlitch() {
  document.body.classList.add('glitching');
  setTimeout(() => document.body.classList.remove('glitching'), 400);
}

// ═══════════════════════════════════════════════════
// TYPEWRITER
// ═══════════════════════════════════════════════════
let typewriterTimer = null;
function typewriter(element, text, speed, onComplete) {
  if (typewriterTimer) clearTimeout(typewriterTimer);
  element.innerHTML = '<span class="typewriter-cursor"></span>';
  let i = 0;
  function tick() {
    if (i > text.length) {
      element.innerHTML = text;
      if (onComplete) onComplete();
      return;
    }
    element.innerHTML = text.slice(0, i) + '<span class="typewriter-cursor"></span>';
    i++;
    typewriterTimer = setTimeout(tick, speed);
  }
  tick();
}

// ═══════════════════════════════════════════════════
// CINEMA MODE
// ═══════════════════════════════════════════════════
function toggleCinemaMode() {
  document.body.classList.toggle('cinema-mode');
  showToast(document.body.classList.contains('cinema-mode') ? '🎬 Mode immersif' : '↩ Mode standard');
}

// ═══════════════════════════════════════════════════
// DYNAMIC VIGNETTE
// ═══════════════════════════════════════════════════
function updateVignette(custodyPct) {
  const v = document.getElementById('vignette');
  if (custodyPct >= 80) {
    v.style.boxShadow = 'inset 0 0 0 rgba(255,64,96,0)';
  } else if (custodyPct >= 50) {
    v.style.boxShadow = 'inset 0 0 60px rgba(240,192,64,0.12)';
  } else {
    const intensity = 0.12 + (50 - custodyPct) * 0.008;
    v.style.boxShadow = `inset 0 0 120px rgba(255,64,96,${intensity.toFixed(2)})`;
  }
}

// ═══════════════════════════════════════════════════

// GRADE / XP SYSTEM
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
// GLOSSAIRE — références légales Suisse + forensique
// Définitions synthétiques pour tooltips pédagogiques
// ═══════════════════════════════════════════════════
const GLOSSARY = {
  // CPP (Code de procédure pénale suisse)
  "Art. 113 CPP": "Nemo tenetur : le prévenu n'est pas tenu de s'auto-incriminer (droit au silence).",
  "Art. 139 CPP": "Preuve par indices : admet les faisceaux convergents comme preuves en l'absence de preuve directe.",
  "Art. 141 CPP": "Exploitabilité des preuves : règles d'exclusion pour les preuves obtenues illégalement.",
  "Art. 147 CPP": "Droit de participation aux actes d'instruction : parties présentes, contradictoire.",
  "Art. 170 CPP": "Levée du secret de fonction : autorisation judiciaire pour témoigner sur des faits couverts.",
  "Art. 182 CPP": "Expertise : l'expert décrit les faits techniques, il ne qualifie pas juridiquement.",
  "Art. 184 CPP": "L'expert rend accessible le technique pour les autorités judiciaires.",
  "Art. 189 CPP": "Contre-expertise : droit de demander un second expert pour contester le premier.",
  "Art. 197 CPP": "Proportionnalité des mesures de contrainte.",
  "Art. 244 CPP": "Perquisition de domicile : mandat + conditions formelles.",
  "Art. 245 CPP": "Perquisition de supports informatiques : avec ordonnance MP.",
  "Art. 248 CPP": "Scellés : suspension de l'analyse d'une preuve sur demande du propriétaire, TMC décide.",
  "Art. 263 CPP": "Séquestre : saisie provisoire d'objets ou valeurs liés à une infraction.",
  "Art. 264 CPP": "Objets protégés par le secret professionnel (avocat, médecin, prêtre).",
  "Art. 267 CPP": "Mandat de séquestre : exécution formalisée.",
  "Art. 269 CPP": "Surveillance de correspondance par télécommunications : ordonnance TMC requise.",
  "Art. 273 CPP": "Collecte de métadonnées et réquisitions envers des prestataires.",
  "Art. 309 CPP": "Ouverture d'instruction par le ministère public.",
  // CP (Code pénal)
  "Art. 143 CP": "Soustraction de données : accès + extraction illégitime de données protégées.",
  "Art. 143bis CP": "Accès indu à un système informatique (hacking).",
  "Art. 144bis CP": "Détérioration de données : modification/destruction illégitime de données.",
  "Art. 146 CP": "Escroquerie : tromperie d'une personne physique avec dommage patrimonial.",
  "Art. 147 CP": "Utilisation frauduleuse d'un ordinateur : manipulation de système pour enrichissement.",
  "Art. 156 CP": "Extorsion / chantage.",
  "Art. 251 CP": "Faux dans les titres : falsification de documents à valeur probante.",
  "Art. 305bis CP": "Blanchiment d'argent.",
  "Art. 320 CP": "Violation du secret de fonction (fonctionnaires).",
  "Art. 321 CP": "Violation du secret professionnel (médecins, avocats, etc.).",
  // Constitution
  "Art. 13 Cst.": "Droit à la sphère privée et à la protection des données.",
  "Art. 32 Cst.": "Garanties procédurales : présomption d'innocence, procès équitable.",
  "Art. 169 Cst.": "Haute surveillance parlementaire sur le Conseil fédéral et l'administration.",
  // LPD 2023
  "LPD 2023 Art. 5": "Données sensibles : santé, biométrie, opinions, vie intime — protection renforcée.",
  "LPD 2023 Art. 7": "Responsable du traitement : obligation de garantir la protection tout au long de la chaîne.",
  "LPD 2023 Art. 8": "Sécurité des données : mesures techniques et organisationnelles appropriées.",
  "LPD 2023 Art. 9": "Sous-traitance : cascade de responsabilité, le responsable reste garant.",
  "LPD 2023 Art. 24": "Notification des violations au PFPDT dans les meilleurs délais si risque élevé.",
  "LPD 2023 Art. 27": "Information des personnes concernées en cas de risque élevé.",
  // ATF
  "ATF 136 II 508": "Une adresse IP identifie un abonné, pas nécessairement l'auteur d'un acte.",
  "ATF 138 IV 47": "Nemo tenetur protège contre la contrainte cognitive mais pas contre la capture technique passive.",
  "ATF 140 IV 11": "Art. 146 CP (escroquerie) exige la tromperie d'une personne physique.",
  "ATF 143 IV 330": "Timestamps numériques : corroboration multi-sources obligatoire pour valeur probante.",
  "ATF 147 IV 409": "Indices graves, précis et concordants = condamnation possible sans preuve directe.",
  "ATF 149 I 218": "Contrôle numérique en zone frontière : exige base légale spécifique (2023).",
  "TF 1B_602/2020": "Scellés : tri préalable judiciaire quand le propriétaire désigne précisément des données privées.",
  "TF 6B_361/2017": "Chaîne de custody : sa rupture peut exclure la preuve (Art. 141 CPP).",
  // Standards internationaux
  "ACPO": "Association of Chief Police Officers (UK) : 4 principes de forensique numérique internationalement adoptés.",
  "ACPO Principle 1": "Aucune action ne doit modifier les données de l'original.",
  "ACPO Principle 2": "Si accès à l'original nécessaire : opérateur compétent et justification documentée.",
  "ACPO Principle 3": "Audit trail : reproductibilité par un tiers expert.",
  "ACPO Principle 4": "Responsabilité personnelle de l'expert sur l'intégrité de la chaîne.",
  "ISO/IEC 27037": "Lignes directrices internationales pour l'identification, collecte, acquisition et préservation de preuves numériques.",
  "ISO/IEC 27036": "Sécurité des relations avec les fournisseurs et sous-traitants.",
  "NIST SP 800-61": "Computer Security Incident Handling Guide : cycle Preparation → Detection → Containment → Recovery.",
  "NIST SP 800-63B": "Authentification numérique : niveaux AAL1/AAL2/AAL3 selon fiabilité.",
  "NIST CSF": "Cybersecurity Framework : 5 fonctions (Identify, Protect, Detect, Respond, Recover).",
  "CIS Controls v8": "18 contrôles prioritaires de cybersécurité, recommandés pour PME.",
  "IEC 62443": "Cybersécurité des systèmes industriels (OT/IT).",
  "MITRE ATT&CK": "Framework de référence des tactiques, techniques et procédures (TTPs) adversariales.",
  "Convention Budapest": "Convention du Conseil de l'Europe sur la cybercriminalité (coopération internationale).",
  "Convention Genève IV": "Droit humanitaire : protection des familles dispersées (Art. 26).",
  "CLOUD Act": "Loi US autorisant les autorités à demander des données stockées par des prestataires américains, y compris à l'étranger.",
  "MLAT": "Mutual Legal Assistance Treaty : traité bilatéral d'entraide judiciaire.",
  "RGPD": "Règlement général UE sur la protection des données (Art. 33 notification 72h).",
  // Techniques
  "BitLocker": "Chiffrement disque Windows (AES-256 par défaut, clé stockée TPM/AD/Microsoft).",
  "VeraCrypt": "Outil open-source de chiffrement de conteneurs avec plausible deniability (hidden volumes).",
  "Cobalt Strike": "Framework offensif commercial détourné par cybercriminels (implants, C2, lateral movement).",
  "Tails": "OS live amnésique : rien n'est persistant à l'extinction (exceptions : Persistent Volume chiffré).",
  "Volatility": "Framework open-source d'analyse forensique de RAM (dumps mémoire).",
  "YARA": "Moteur de règles pour identification de familles de malwares par signatures.",
  "Chainalysis": "Outil commercial d'analyse heuristique blockchain utilisé en law enforcement.",
  "BIP-39": "Standard de phrase mnémonique (12/24 mots) pour wallets cryptomonnaies.",
  "TMC": "Tribunal des mesures de contrainte : autorité qui décide de la levée des scellés.",
  "MP": "Ministère public : chef d'orchestre de l'instruction pénale.",
  "MPC": "Ministère public de la Confédération : compétent pour les infractions fédérales.",
  "fedpol": "Office fédéral de la police : coordination cybercriminalité, identité, Interpol.",
  "OFCS": "Office fédéral de la cybersécurité (ex-NCSC, ex-MELANI) : CERT national et coordination.",
  "SRC": "Service de renseignement de la Confédération : attribution étatique, contre-espionnage.",
  "DélCdG": "Délégation des Commissions de gestion : haute surveillance parlementaire sur services secrets.",
  "PFPDT": "Préposé fédéral à la protection des données et à la transparence.",
  "SECO": "Secrétariat d'État à l'économie : sanctions, contrôle d'exportation (LFMG/LFAIE).",
};

const GRADES = [
  { min: 0,    title: "Stagiaire",              icon: "🎓", sub: "Débutant en forensique numérique" },
  { min: 100,  title: "Inspecteur·rice",        icon: "🔍", sub: "Premiers pas en investigation" },
  { min: 300,  title: "Enquêteur·rice Spécialisé·e", icon: "🎖",  sub: "Investigations complexes maîtrisées" },
  { min: 600,  title: "Expert·e Forensique",    icon: "⚔️", sub: "Témoin expert devant tribunal" },
  { min: 1000, title: "Juge d'Instruction",     icon: "⚖️", sub: "Autorité suprême de l'enquête" },
  { min: 1500, title: "Procureur·e Fédéral·e",  icon: "🏛", sub: "Maîtrise absolue du droit pénal numérique" },
  { min: 2500, title: "Procureur·e d'Élite",    icon: "🎖️", sub: "Référence nationale en cyber-justice — palier Expert débloqué" },
  { min: 4000, title: "Procureur·e Européen·ne", icon: "🇪🇺", sub: "Maîtrise de la coopération internationale — Eurojust, EIMP, MLAT" },
];

function getGrade(xp) {
  for (let i = GRADES.length - 1; i >= 0; i--) {
    if (xp >= GRADES[i].min) return { ...GRADES[i], index: i, next: GRADES[i+1] || null };
  }
  return { ...GRADES[0], index: 0, next: GRADES[1] };
}

function getXP() {
  return lsGet('cas_xp', 0);
}

function addXP(amount) {
  const prev = getXP();
  const next = Math.max(0, prev + amount);
  lsSet('cas_xp', next);
  return { prev, next, gradeUp: getGrade(prev).index !== getGrade(next).index };
}

function updateGradeDisplay() {
  const xp = getXP();
  const grade = getGrade(xp);

  // Header mini
  document.getElementById('grade-mini-icon').textContent = grade.icon;
  document.getElementById('grade-mini-title').textContent = grade.title;
  document.getElementById('grade-mini-xp').textContent = xp + ' XP';

  // Lobby card
  document.getElementById('grade-card-icon').textContent = grade.icon;
  document.getElementById('grade-card-title').textContent = grade.title;
  document.getElementById('grade-card-subtitle').textContent = grade.sub;

  if (grade.next) {
    const range = grade.next.min - grade.min;
    const progress = xp - grade.min;
    const pct = Math.min(100, (progress / range) * 100);
    document.getElementById('grade-progress-xp').textContent = `${xp} / ${grade.next.min} XP`;
    document.getElementById('grade-progress-next').textContent = `→ ${grade.next.title}`;
    document.getElementById('grade-progress-fill').style.width = pct + '%';
  } else {
    document.getElementById('grade-progress-xp').textContent = `${xp} XP — GRADE MAX`;
    document.getElementById('grade-progress-next').textContent = '★ Maître du domaine ★';
    document.getElementById('grade-progress-fill').style.width = '100%';
  }
}

// ═══════════════════════════════════════════════════
// GLOBAL BADGES
// ═══════════════════════════════════════════════════
const GLOBAL_BADGES = [
  { id: "first_blood",   icon: "🩸", title: "Premier Sang",       desc: "Premier scénario complété",                       check: (s) => s.completed >= 1 },
  { id: "rookie_5",      icon: "🥉", title: "Recrue",              desc: "5 scénarios complétés",                           check: (s) => s.completed >= 5 },
  { id: "veteran_10",    icon: "🥈", title: "Vétéran",             desc: "10 scénarios complétés",                          check: (s) => s.completed >= 10 },
  { id: "completionist", icon: "🥇", title: "Complétionniste",     desc: "Tous les scénarios complétés",                    check: (s) => s.completed >= s.total },
  { id: "chain_master",  icon: "⛓",  title: "Maître de la Chaîne", desc: "100% custody sur 3 scénarios",                    check: (s) => s.full_custody >= 3 },
  { id: "perfectionist", icon: "💎", title: "Perfectionniste",      desc: "100% de score sur un scénario",                   check: (s) => s.hundreds >= 1 },
  { id: "ransom_expert", icon: "💀", title: "Spécialiste Ransomware", desc: "3 scénarios RANSOMWARE ≥80%",                  check: (s) => (s.tag80.RANSOMWARE || 0) >= 3 },
  { id: "crypto_sage",   icon: "🔐", title: "Sage du Chiffrement",  desc: "2 scénarios CRYPTO ≥80%",                         check: (s) => (s.tag80.CRYPTO || 0) >= 2 },
  { id: "forensic_pro",  icon: "🔬", title: "Pro du Forensique",   desc: "5 scénarios FORENSIQUE ≥80%",                     check: (s) => (s.tag80.FORENSIQUE || 0) >= 5 },
  { id: "swiss_jurist",  icon: "⚖️", title: "Juriste Confirmé",    desc: "4 scénarios DROIT ≥80%",                          check: (s) => (s.tag80.DROIT || 0) >= 4 },
  { id: "windows_guru",  icon: "🪟", title: "Guru Windows",         desc: "3 scénarios WINDOWS ≥80%",                         check: (s) => (s.tag80.WINDOWS || 0) >= 3 },
  { id: "network_ninja", icon: "🌐", title: "Ninja Réseau",         desc: "3 scénarios RÉSEAUX ≥80%",                         check: (s) => (s.tag80['RÉSEAUX'] || 0) >= 3 },
  { id: "ethics_warden", icon: "🛡", title: "Gardien de l'Éthique", desc: "0 erreur critique sur 5 scénarios",              check: (s) => s.no_critical_streak >= 5 },
  { id: "ethics_knight", icon: "🛡️", title: "Chevalier Déontologique", desc: "0 erreur critique sur 10 scénarios",         check: (s) => s.no_critical_streak >= 10 },
  { id: "ethics_legend", icon: "✨", title: "Conscience Irréprochable", desc: "0 erreur critique sur 20 scénarios",         check: (s) => s.no_critical_streak >= 20 },
  { id: "expert_clean",  icon: "🎖️", title: "Procureur·e Sans Faute",  desc: "Scénario Expert complété sans erreur critique", check: (s) => s.expert_clean_wins >= 1 },
  { id: "speed_demon",   icon: "⚡", title: "Démon de la Vitesse", desc: "Mode Procureur complété à ≥70%",                 check: (s) => s.procureur_wins >= 1 },
  { id: "prosecutor",    icon: "🏛", title: "Accusation Implacable", desc: "3 scénarios Procureur à ≥70%",                   check: (s) => s.procureur_wins >= 3 },
  { id: "historian",     icon: "📜", title: "Historien du DFIR",   desc: "3 affaires réelles complétées ≥70%",              check: (s) => s.real_cases_won >= 3 },
  // ═══════════════════════════════════════════════════
  // BADGES EUROPÉENS — débloqués via scénarios EU
  // ═══════════════════════════════════════════════════
  { id: "eu_first_mlat",     icon: "🇪🇺", title: "Premier MLAT",          desc: "Premier scénario européen complété",                  check: (s) => s.eu_completed >= 1 },
  { id: "eu_jit_master",     icon: "🤝", title: "JIT Master",            desc: "3 scénarios européens complétés ≥80%",                check: (s) => s.eu_won_80 >= 3 },
  { id: "eu_budapest_spec",  icon: "📜", title: "Spécialiste Budapest",   desc: "5 scénarios européens complétés",                    check: (s) => s.eu_completed >= 5 },
  { id: "eu_eurojust_vet",   icon: "⚖️", title: "Eurojust Veteran",       desc: "5 scénarios européens complétés ≥80%",                check: (s) => s.eu_won_80 >= 5 },
  { id: "eu_tour_europe",    icon: "🌍", title: "Tour d'Europe",         desc: "Tous les scénarios européens complétés",              check: (s) => s.eu_completed >= s.eu_total && s.eu_total > 0 },
  // ═══════════════════════════════════════════════════
  // BADGES v2.8 — défis comportementaux et exploration
  // ═══════════════════════════════════════════════════
  { id: "night_owl",     icon: "🦉", title: "Couche-tard",       desc: "5 scénarios complétés après 23h",                    check: (s) => s.night_owl_count >= 5 },
  { id: "early_bird",    icon: "🌅", title: "Lève-tôt",          desc: "5 scénarios complétés avant 7h",                     check: (s) => s.early_bird_count >= 5 },
  { id: "sniper",        icon: "🎯", title: "Sniper",            desc: "3 scénarios consécutifs sans hint, 1ʳᵉ réponse correcte partout", check: (s) => s.sniper_streak >= 3 },
  { id: "tour_de_suisse", icon: "🌐", title: "Tour de Suisse",   desc: "Au moins 1 scénario par canton sur la carte",        check: (s) => s.cantons_visited >= s.cantons_total && s.cantons_total > 0 },
  { id: "perseverant",   icon: "🔁", title: "Persévérant",       desc: "Score amélioré de ≥20 points sur 3 scénarios",        check: (s) => s.improvements_20 >= 3 },
  { id: "unstoppable",   icon: "🔥", title: "Inarrêtable",       desc: "3 scénarios à ≥70% dans la même journée (×3 jours)",  check: (s) => s.combo_days >= 3 },
];

function getStatsSnapshot() {
  const results = lsGet('scene_results', {});
  const euScenes = SCENES.filter(s => s.region === 'EU');
  const chScenes = SCENES.filter(s => s.region !== 'EU');
  const snap = {
    total: SCENES.length,
    completed: Object.keys(results).length,
    full_custody: 0,
    hundreds: 0,
    tag80: {},
    no_critical_streak: lsGet('cas_no_crit_streak', 0),
    procureur_wins: lsGet('cas_procureur_wins', 0),
    expert_clean_wins: lsGet('cas_expert_clean_wins', 0),
    real_cases_won: 0,
    // EU tracking
    eu_total: euScenes.length,
    eu_completed: 0,
    eu_won_80: 0,
    ch_total: chScenes.length,
    ch_completed: 0,
    // v2.8 : nouvelles métriques pour les 5 nouveaux badges
    night_owl_count: lsGet('cas_night_owl', 0),
    early_bird_count: lsGet('cas_early_bird', 0),
    sniper_streak: lsGet('cas_sniper_streak', 0),
    improvements_20: lsGet('cas_improvements_20', 0),
    cantons_visited: 0,  // computed below
    combo_days: (lsGet('cas_combo_days', []) || []).length,
  };
  Object.entries(results).forEach(([id, r]) => {
    if (r.custodyPct >= 100) snap.full_custody++;
    if (r.pct >= 100) snap.hundreds++;
    const scene = SCENES.find(s => s.id === id);
    if (scene && r.pct >= 80) {
      (scene.tags || []).forEach(t => { snap.tag80[t] = (snap.tag80[t] || 0) + 1; });
    }
    if (scene && scene.realCase && r.pct >= 70) snap.real_cases_won++;
    // EU/CH split
    if (scene && scene.region === 'EU') {
      snap.eu_completed++;
      if (r.pct >= 80) snap.eu_won_80++;
    } else if (scene) {
      snap.ch_completed++;
    }
  });

  // v2.8 : count distinct cantons visited (any scene completed)
  if (typeof CANTON_DATA !== 'undefined') {
    const completedIds = Object.keys(results);
    let cantonsSeen = 0;
    Object.values(CANTON_DATA).forEach(canton => {
      if (canton.scenarios.some(sid => completedIds.includes(sid))) {
        cantonsSeen++;
      }
    });
    snap.cantons_visited = cantonsSeen;
    snap.cantons_total = Object.keys(CANTON_DATA).length;
  }

  return snap;
}

function getUnlockedBadges() {
  const snap = getStatsSnapshot();
  return GLOBAL_BADGES.filter(b => b.check(snap)).map(b => b.id);
}

function detectNewBadges(beforeIds, afterIds) {
  return afterIds.filter(id => !beforeIds.includes(id));
}

function renderBadgesGrid() {
  const unlocked = getUnlockedBadges();
  const grid = document.getElementById('badges-grid');
  const count = document.getElementById('badges-count');
  count.textContent = `${unlocked.length} / ${GLOBAL_BADGES.length}`;

  grid.innerHTML = GLOBAL_BADGES.map(b => `
    <div class="badge-tile ${unlocked.includes(b.id) ? 'unlocked' : ''}">
      <div class="badge-tile-icon">${b.icon}</div>
      <div class="badge-tile-title">${b.title}</div>
      <div class="badge-tile-desc">${b.desc}</div>
    </div>
  `).join('');
}

function toggleBadges() {
  document.getElementById('badges-section').classList.toggle('open');
}

function openBadgesPanel() {
  const sec = document.getElementById('badges-section');
  sec.classList.add('open');
  sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ═══════════════════════════════════════════════════
// MODE (standard / procureur)
// ═══════════════════════════════════════════════════
function getMode() { return lsGet('cas_mode', 'normal'); }
function setMode(m) {
  lsSet('cas_mode', m);
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  showToast(m === 'procureur' ? '⚖️ Mode Procureur activé — Timer + points doublés' : '🎯 Mode Standard');
}

function initModeToggle() {
  const mode = getMode();
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}

// ═══════════════════════════════════════════════════
// ATMOSPHERE
// ═══════════════════════════════════════════════════
function setAtmosphere(atm) {
  document.body.setAttribute('data-atmosphere', atm || '');
}

// ═══════════════════════════════════════════════════
// STATE (current run)
// ═══════════════════════════════════════════════════
let G = {
  scene: null,
  stepIdx: 0,
  decisions: [],
  score: 0,
  maxScore: 0,
  okCount: 0,
  errCount: 0,
  custodyPct: 100,
  answered: false,
  nextTarget: 'auto',
  mode: 'normal',
  procureurTimer: null,
  procureurTimeLeft: 0,
  procureurDuration: 60,
  hadCriticalError: false,
  beforeBadges: [],
  seed: null,           // current run seed (number or null)
  hintUsedForStep: {},  // { stepIdx: eliminatedChoiceIdx }
  stepChoicesOrder: [], // remembered shuffled order for current step
};

// ═══════════════════════════════════════════════════
// SCREEN ROUTING
// ═══════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

// ═══════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════
let toastTimer;
function showToast(msg, variant) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = '';
  t.classList.add('show');
  if (variant) t.classList.add(variant);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ═══════════════════════════════════════════════════
// GLOSSARY — tooltips for legal/technical terms
// ═══════════════════════════════════════════════════
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}

function findGlossaryMatch(term) {
  // Exact match first
  if (GLOSSARY[term]) return { key: term, def: GLOSSARY[term] };
  // Try partial: for terms like "Art. 248 CPP + ..." take the first recognizable part
  const keys = Object.keys(GLOSSARY);
  for (const k of keys) {
    if (term.startsWith(k)) return { key: k, def: GLOSSARY[k] };
    if (term.includes(k)) return { key: k, def: GLOSSARY[k] };
  }
  return null;
}

function renderRefTag(ref) {
  const match = findGlossaryMatch(ref);
  const safe = escapeHTML(ref);
  if (match) {
    return `<span class="ref-tag has-gloss" data-gloss-key="${escapeHTML(match.key)}" onclick="showGlossTooltip(event)">${safe}</span>`;
  }
  return `<span class="ref-tag">${safe}</span>`;
}

function showGlossTooltip(evt) {
  evt.stopPropagation();
  closeAllGlossTooltips();
  const el = evt.currentTarget;
  const key = el.getAttribute('data-gloss-key');
  const def = GLOSSARY[key];
  if (!def) return;

  const tip = document.createElement('div');
  tip.className = 'gloss-tooltip';
  tip.innerHTML = `<span class="gloss-close" onclick="event.stopPropagation();this.parentElement.remove()">✕</span><strong>${escapeHTML(key)}</strong>${escapeHTML(def)}`;
  document.body.appendChild(tip);

  const rect = el.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  let left = rect.left + window.scrollX;
  let top = rect.bottom + window.scrollY + 6;
  // Don't overflow right edge
  if (left + tipRect.width > window.innerWidth - 12) {
    left = window.innerWidth - tipRect.width - 12;
  }
  if (left < 12) left = 12;
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';

  setTimeout(() => {
    document.addEventListener('click', closeAllGlossTooltips, { once: true });
  }, 50);
}

function closeAllGlossTooltips() {
  document.querySelectorAll('.gloss-tooltip').forEach(t => t.remove());
}

function renderGlossarySection(legalRefs) {
  if (!legalRefs || !legalRefs.length) return '';
  const matched = [];
  const seen = new Set();
  legalRefs.forEach(r => {
    const m = findGlossaryMatch(r);
    if (m && !seen.has(m.key)) { seen.add(m.key); matched.push(m); }
  });
  if (!matched.length) return '';
  return `
    <div class="glossary-section">
      <div class="glossary-section-title">📚 Glossaire du scénario</div>
      <div class="glossary-list">
        ${matched.map(m => `
          <div class="glossary-item">
            <span class="glossary-item-term">${escapeHTML(m.key)}</span>
            <span class="glossary-item-def">${escapeHTML(m.def)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════
// SOUND
// ═══════════════════════════════════════════════════
let _ac = null;
function getAC() { if (!_ac) try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch {} return _ac; }
function playSound(type) {
  const a = getAC(); if (!a) return;
  const t = a.currentTime;
  if (type === 'ok') {
    [523, 659, 784].forEach((f, i) => {
      const o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination);
      o.frequency.value = f;
      g.gain.setValueAtTime(0.1, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
      o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.2);
    });
  } else if (type === 'ko') {
    const o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(110, t + 0.4);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.start(t); o.stop(t + 0.4);
  } else if (type === 'critical') {
    [180, 140, 100].forEach((f, i) => {
      const o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination);
      o.frequency.value = f;
      g.gain.setValueAtTime(0.18, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.25);
      o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.25);
    });
  } else if (type === 'badge') {
    [440, 554, 659, 880].forEach((f, i) => {
      const o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination);
      o.frequency.value = f;
      o.type = 'triangle';
      g.gain.setValueAtTime(0.08, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.3);
      o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.3);
    });
  }
}

// ═══════════════════════════════════════════════════
// LOBBY
// ═══════════════════════════════════════════════════
function initLobby() {
  setAtmosphere('');
  updateGradeDisplay();
  renderBadgesGrid();
  initModeToggle();
  renderStreakBanner();
  renderNoCritBanner();
  renderPathBanner();
  renderChallengeBanner();

  const grid = document.getElementById('scene-grid');
  grid.innerHTML = '';

  const saved = lsGet('scene_results', {});
  const done = Object.keys(saved).length;
  const scores = Object.values(saved).map(r => r.pct);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const custodys = Object.values(saved).map(r => r.custodyPct || 0);
  const bestCustody = custodys.length ? Math.max(...custodys) : null;

  document.getElementById('ls-completed').textContent = done;
  document.getElementById('ls-avg').textContent = avg !== null ? avg + '%' : '—';
  document.getElementById('ls-custody').textContent = bestCustody !== null ? bestCustody + '%' : '—';

  // Radar stays collapsed by default but update data
  // (actual render happens on open)

  if (!SCENES || SCENES.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="es-icon">⏳</div><div>Aucun scénario disponible.</div></div>';
    return;
  }

  // ═══════════════════════════════════════════════════
  // SPLIT CH / EU
  // ═══════════════════════════════════════════════════
  const allScenes = SCENES.map((scene, i) => ({ scene, i, res: saved[scene.id] }));
  const chScenes = allScenes.filter(x => !x.scene.region || x.scene.region !== 'EU');
  const euScenes = allScenes.filter(x => x.scene.region === 'EU');
  const allCHCompleted = chScenes.length > 0 && chScenes.every(x => saved[x.scene.id]);

  // Detect first-time EU unlock for cinematic
  const wasEUUnlocked = lsGet('cas_eu_unlocked_seen', false);
  const triggerCinematic = allCHCompleted && !wasEUUnlocked && euScenes.length > 0;

  // Apply review filter to BOTH sections
  const filteredCH = REVIEW_FILTER_ACTIVE
    ? chScenes.filter(x => x.res && x.res.pct < 100)
    : chScenes;
  const filteredEU = REVIEW_FILTER_ACTIVE
    ? euScenes.filter(x => x.res && x.res.pct < 100)
    : euScenes;

  if (filteredCH.length === 0 && filteredEU.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="es-icon">🌟</div><div>Aucun scénario à réviser.<br>Tous vos runs sont parfaits !</div></div>';
    return;
  }

  const notes = lsGet('cas_notes', {});

  const buildCard = ({ scene, i, res }, opts = {}) => {
    const { lockedAlt = null, isEU = false } = opts;
    // CH lock logic — sequential as before
    // EU lock logic — all unlocked simultaneously when allCHCompleted
    let isLocked;
    if (isEU) {
      isLocked = !allCHCompleted;
    } else {
      // For CH scenes, find the prior CH scene only
      const chOnly = SCENES.filter(s => !s.region || s.region !== 'EU');
      const idx = chOnly.findIndex(s => s.id === scene.id);
      isLocked = idx > 0 && !saved[chOnly[idx - 1].id];
    }

    const card = document.createElement('div');
    card.className = 'scene-card' + (isLocked ? ' locked' : '') + (isEU ? ' eu' : '');
    card.dataset.diff = scene.difficulty;
    card.dataset.sceneId = scene.id;
    card.dataset.title = scene.title || '';
    card.dataset.tags = (scene.tags || []).join(' ');
    card.dataset.real = scene.realCase ? '1' : '0';
    if (isEU) card.dataset.region = 'EU';

    const statusHTML = res
      ? `<span class="scene-status done">✓ ${res.pct}%</span>`
      : isLocked
        ? `<span class="scene-status locked-lbl">🔒 ${lockedAlt || 'Verrouillé'}</span>`
        : `<span class="scene-status" style="color:${isEU ? 'var(--gold)' : 'var(--cyan)'}">→ Jouer</span>`;

    const diffLabel = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile', expert: 'Expert' }[scene.difficulty];

    // Mini leaderboard display
    const lb = getLeaderboard(scene.id);
    const lbHTML = lb.length > 0 ? `
      <div class="scene-leaderboard">
        ${lb.slice(0, 3).map((r, j) => {
          const cls = j === 0 ? 'gold' : j === 1 ? 'silver' : 'bronze';
          return `<span class="scene-lb-pill ${cls}" title="Top ${j+1}">#${j+1} · ${r.pct}%</span>`;
        }).join('')}
      </div>
    ` : '';

    const notesIndicator = notes[scene.id] ? '<span class="scene-notes-indicator" title="Notes personnelles">📝</span>' : '';
    const euTag = isEU ? '<span class="scene-eu-tag">🇪🇺 EU</span>' : '';

    card.innerHTML = `
      ${notesIndicator}
      <div class="scene-icon">${scene.icon}</div>
      <div class="scene-info">
        <div class="scene-title">
          ${scene.title}
          ${euTag}
          ${scene.realCase ? '<span class="scene-real-badge">📜 AFFAIRE RÉELLE</span>' : ''}
        </div>
        <div class="scene-desc">${scene.intro ? scene.intro.substring(0, 90) + '…' : ''}</div>
        <div class="scene-meta">
          <span class="diff-badge ${scene.difficulty}">${diffLabel}</span>
          <span class="scene-steps-count">${(scene.stepCount || (scene.steps && scene.steps.length) || 0)} décision${((scene.stepCount || (scene.steps && scene.steps.length) || 0) > 1) ? 's' : ''}</span>
          ${(scene.tags || []).slice(0,2).map(t => `<span class="scene-steps-count" style="color:var(--cyan);border:1px solid var(--border);padding:1px 5px;border-radius:3px;font-size:10px">${t}</span>`).join('')}
        </div>
        ${lbHTML}
      </div>
      ${statusHTML}
    `;

    if (!isLocked) {
      card.addEventListener('click', () => {
        hydrateScene(scene).then(startScene).catch(err => {
          console.error('[scenes] card click failed:', err);
          showToast('⚠ Scène introuvable');
        });
      });
    } else {
      const msg = isEU
        ? '🔒 Complétez d\'abord les 47 scénarios suisses pour débloquer le Mode Européen'
        : '🔒 Complétez le scénario précédent d\'abord';
      card.addEventListener('click', () => showToast(msg));
    }

    return card;
  };

  // Render CH section
  filteredCH.forEach(item => grid.appendChild(buildCard(item, { isEU: false })));

  // Render EU section header + cards
  if (filteredEU.length > 0) {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'eu-section-header' + (allCHCompleted ? ' unlocked' : ' locked');
    if (allCHCompleted) {
      sectionHeader.innerHTML = `
        <div class="eu-section-title">🇪🇺 MODE EUROPÉEN</div>
        <div class="eu-section-sub">Coopération internationale · EIMP · MLAT · Eurojust · Convention Budapest</div>
      `;
    } else {
      const remaining = chScenes.length - chScenes.filter(x => saved[x.scene.id]).length;
      sectionHeader.innerHTML = `
        <div class="eu-section-title">🔒 MODE EUROPÉEN — Verrouillé</div>
        <div class="eu-section-sub">Encore ${remaining} scénario${remaining > 1 ? 's' : ''} suisse${remaining > 1 ? 's' : ''} à compléter pour débloquer</div>
      `;
    }
    grid.appendChild(sectionHeader);

    filteredEU.forEach(item => grid.appendChild(buildCard(item, { isEU: true })));
  }

  // Apply active filters after grid is rebuilt
  applyLobbyFilters();

  // Trigger EU unlock cinematic if first-time
  if (triggerCinematic) {
    setTimeout(() => triggerEUUnlockCinematic(), 600);
    lsSet('cas_eu_unlocked_seen', true);
  }
}

// ═══════════════════════════════════════════════════
// EU UNLOCK CINEMATIC
// ═══════════════════════════════════════════════════
function triggerEUUnlockCinematic() {
  // Confetti via existing function
  if (typeof fireConfetti === 'function') {
    try { fireConfetti(); } catch(e) {}
  }

  // Persistent overlay toast
  const overlay = document.createElement('div');
  overlay.className = 'eu-unlock-overlay';
  overlay.innerHTML = `
    <div class="eu-unlock-modal">
      <div class="eu-unlock-flag">🇪🇺</div>
      <div class="eu-unlock-title">MODE EUROPÉEN DÉBLOQUÉ</div>
      <div class="eu-unlock-sub">Coopération internationale activée</div>
      <div class="eu-unlock-desc">
        Vous avez complété les 47 scénarios suisses.<br>
        Vous accédez maintenant à <strong>8 scénarios européens</strong> traitant
        de la coopération transfrontière, de l'EIMP, de la Convention de Budapest,
        des MLAT et des JIT Eurojust.<br><br>
        Un nouveau grade prestige vous attend : <strong>🇪🇺 Procureur·e Européen·ne</strong>
      </div>
      <button class="eu-unlock-close" onclick="this.closest('.eu-unlock-overlay').remove()">Découvrir les scénarios EU →</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Auto-fade after 30s if not closed
  setTimeout(() => { overlay.classList.add('fade-out'); }, 30000);
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 32000);
}

// ═══════════════════════════════════════════════════
// BRIEFING
// ═══════════════════════════════════════════════════
function startScene(scene) {
  G.scene = scene;
  setAtmosphere(scene.atmosphere || '');

  const diff = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile', expert: 'Expert' };
  const mode = getMode();

  const realCaseHTML = scene.realCase ? `
    <div class="real-case-banner">
      📜 <strong>AFFAIRE RÉELLE</strong> — ${scene.realCase}
    </div>
  ` : '';

  const procureurNotice = mode === 'procureur' ? `
    <div class="alert-box" style="border-color:var(--red);background:#1a0008">
      <strong>⚖️ MODE PROCUREUR ACTIF</strong>
      Timer par décision. Points doublés. Une seule erreur critique interrompt le scénario.
    </div>
  ` : '';

  document.getElementById('briefing-content').innerHTML = `
    <div class="svg-illustration">${getIllustration(scene)}</div>

    <div class="briefing-top">
      <div class="briefing-icon">${scene.icon}</div>
      <div>
        <div class="briefing-title">${scene.title}</div>
        <div class="briefing-subtitle">
          <span class="diff-badge ${scene.difficulty}" style="margin-right:6px">${diff[scene.difficulty]}</span>
          ${scene.steps.length} décisions · ${(scene.tags || []).join(' · ')}
        </div>
      </div>
    </div>

    ${realCaseHTML}
    ${procureurNotice}

    <div class="alert-box">
      <strong>⚠ ${scene.alertLevel || 'ATTENTION'}</strong>
      Chaque décision est irréversible. Les erreurs critiques réduisent l'intégrité de la chaîne de custody.
    </div>

    <div class="context-text">${scene.intro}</div>

    <div class="objective-list">
      ${(scene.objectives || []).map(o => `
        <div class="objective-item">
          <span class="obj-icon">${o.icon}</span>
          <span>${o.text}</span>
        </div>
      `).join('')}
    </div>

    <div class="refs-row">
      ${(scene.legalRefs || []).map(r => renderRefTag(r)).join('')}
    </div>

    <div class="seed-input-row">
      <label for="seed-input-briefing">SEED :</label>
      <input type="text" class="seed-input" id="seed-input-briefing" placeholder="Laisser vide pour aléatoire (ex: A7F2-K3M8)" maxlength="9" />
    </div>

    <div class="briefing-actions">
      <button class="back-briefing-btn" onclick="goLobby()">← Retour</button>
      <button class="start-btn ${mode === 'procureur' ? 'procureur' : ''}" onclick="launchScene()">
        ${mode === 'procureur' ? '⚖️ Débuter (Procureur)' : '🚨 Débuter l\'intervention'}
      </button>
    </div>
  `;

  showScreen('briefing');
}

// ═══════════════════════════════════════════════════
// SCENE LAUNCH
// ═══════════════════════════════════════════════════
function launchScene() {
  // Seed handling
  const seedInput = document.getElementById('seed-input-briefing');
  const seedCode = seedInput ? seedInput.value.trim() : '';
  if (seedCode) {
    const decoded = seedDecode(seedCode);
    if (decoded !== null) {
      G.seed = decoded;
      RNG = mulberry32(decoded);
      showToast('🔗 Seed chargée : ' + seedEncode(decoded));
    } else {
      G.seed = generateSeed();
      RNG = mulberry32(G.seed);
      showToast('⚠ Seed invalide, seed aléatoire générée');
    }
  } else {
    G.seed = generateSeed();
    RNG = mulberry32(G.seed);
  }

  G.stepIdx = 0;
  G.decisions = [];
  G.score = 0;
  G.maxScore = G.scene.steps.reduce((sum, step) => sum + Math.max(...step.choices.map(c => c.pts)), 0);
  G.okCount = 0;
  G.errCount = 0;
  G.custodyPct = 100;
  G.answered = false;
  G.nextTarget = 'auto';
  G.mode = getMode();
  G.hadCriticalError = false;
  G.beforeBadges = getUnlockedBadges();
  G.hintUsedForStep = {};
  G.stepChoicesOrder = [];

  // Update streak on activity
  updateStreakOnActivity();
  renderStreakBanner();

  // Procureur timer duration by difficulty
  G.procureurDuration = { easy: 45, medium: 60, hard: 75, expert: 90 }[G.scene.difficulty] || 60;

  // Show/hide procureur timer bar
  document.getElementById('procureur-timer').style.display = G.mode === 'procureur' ? '' : 'none';

  // Reset vignette
  updateVignette(100);

  showScreen('scene');
  renderStep();
}

// ═══════════════════════════════════════════════════
// STEP RENDERER
// ═══════════════════════════════════════════════════
function renderStep() {
  const scene = G.scene;
  const step = scene.steps[G.stepIdx];
  G.answered = false;

  // Progress
  const pct = (G.stepIdx / scene.steps.length) * 100;
  document.getElementById('prog-title').textContent = `Étape ${G.stepIdx + 1} / ${scene.steps.length}`;
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-ok').textContent = G.okCount;
  document.getElementById('prog-err').textContent = G.errCount;

  renderTimeline();
  updateCustodyBar();

  // Reset feedback
  document.getElementById('feedback-area').style.display = 'none';
  document.getElementById('critical-area').style.display = 'none';
  document.getElementById('next-step-btn').disabled = true;

  // Shuffle choices using seeded RNG (deterministic with seed)
  const L = ['A', 'B', 'C', 'D', 'E'];
  const order = G.stepChoicesOrder[G.stepIdx] || seededShuffle([...step.choices.keys()]);
  G.stepChoicesOrder[G.stepIdx] = order;

  const card = document.getElementById('situation-card');
  card.innerHTML = `
    <div class="situation-top">
      <span class="step-counter">Étape ${G.stepIdx + 1}/${scene.steps.length}</span>
      <span class="situation-scene-tag">${step.phase || (scene.icon + ' ' + scene.title)}</span>
    </div>
    ${step.situation ? `<div class="situation-text">${step.situation}</div>` : ''}
    ${step.context ? `<div class="situation-context">📍 ${step.context}</div>` : ''}
    ${step.law ? `<div class="law-box">⚖️ ${step.law}</div>` : ''}
    <div class="situation-question">▶ ${step.question}</div>
    <div class="choices-list" id="choices-list">
      ${order.map((origIdx, newIdx) => {
        const c = step.choices[origIdx];
        const eliminated = G.hintUsedForStep[G.stepIdx] === origIdx;
        return `
          <button class="choice-btn${eliminated ? ' eliminated' : ''}" data-orig-idx="${origIdx}" onclick="selectChoice(${origIdx}, this)"${eliminated ? ' disabled style="opacity:.3;text-decoration:line-through"' : ''}>
            <span class="choice-letter" title="Raccourci clavier : ${L[newIdx]}">${L[newIdx]}<span class="choice-kbd">${L[newIdx]}</span></span>
            <span>${c.text}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;

  // Update hint button availability
  updateHintButton();

  // Start procureur timer
  if (G.mode === 'procureur') startProcureurTimer();
}

// Backward-compat shuffle (some legacy paths may call it)
function shuffle(arr) {
  return seededShuffle(arr);
}

// ═══════════════════════════════════════════════════
// PROCUREUR TIMER
// ═══════════════════════════════════════════════════
function startProcureurTimer() {
  stopProcureurTimer();
  G.procureurTimeLeft = G.procureurDuration;

  const fill = document.getElementById('procureur-timer-fill');
  const val = document.getElementById('procureur-timer-val');
  fill.style.width = '100%';
  fill.style.background = 'var(--green)';
  val.style.color = 'var(--green)';
  val.textContent = G.procureurTimeLeft + 's';

  G.procureurTimer = setInterval(() => {
    G.procureurTimeLeft--;
    const p = (G.procureurTimeLeft / G.procureurDuration) * 100;
    fill.style.width = p + '%';
    val.textContent = G.procureurTimeLeft + 's';

    let color;
    if (p < 25) color = 'var(--red)';
    else if (p < 50) color = 'var(--orange)';
    else color = 'var(--green)';
    fill.style.background = color;
    val.style.color = color;

    if (G.procureurTimeLeft <= 0) {
      stopProcureurTimer();
      if (!G.answered) procureurTimeout();
    }
  }, 1000);
}

function stopProcureurTimer() {
  if (G.procureurTimer) {
    clearInterval(G.procureurTimer);
    G.procureurTimer = null;
  }
}

function procureurTimeout() {
  if (G.answered) return;
  G.answered = true;
  G.errCount++;
  G.custodyPct = Math.max(0, G.custodyPct - 15);
  G.decisions[G.stepIdx] = { ok: false, pts: 0, fb: 'Temps écoulé. Décision non prise dans les délais procureur.', legal: null, critical: false, timeout: true };

  updateCustodyBar();
  renderTimeline();
  playSound('critical');

  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

  const fbArea = document.getElementById('feedback-area');
  fbArea.style.display = '';
  fbArea.innerHTML = `
    <div class="feedback-box ko">
      <span class="fb-pts">⏱ Timeout</span>
      ❌ Temps écoulé — En mode Procureur, l'indécision compte comme un échec procédural.
      <div class="fb-legal">⚖️ En intervention réelle, la lenteur décisionnelle peut aggraver la compromission de preuves.</div>
    </div>
  `;

  const nextBtn = document.getElementById('next-step-btn');
  nextBtn.disabled = false;
  const isLast = G.stepIdx >= G.scene.steps.length - 1;
  nextBtn.textContent = isLast ? 'Voir le rapport final →' : 'Étape suivante →';
  G.nextTarget = 'auto';
}

// ═══════════════════════════════════════════════════
// TIMELINE (interactive)
// ═══════════════════════════════════════════════════
function renderTimeline() {
  const scene = G.scene;
  const tl = document.getElementById('timeline');
  tl.innerHTML = '';

  scene.steps.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'tl-step';

    const d = G.decisions[i];
    let dotClass = 'tl-dot';
    let dotText = i + 1;

    if (i === G.stepIdx) dotClass += ' current';
    else if (d) { dotClass += d.ok ? ' done-ok' : ' done-ko'; dotText = d.ok ? '✓' : '✗'; }

    const clickable = d ? ` data-step="${i}" onclick="showTimelinePopup(event, ${i})"` : '';
    dot.innerHTML = `<div class="${dotClass}"${clickable}>${dotText}</div>`;
    tl.appendChild(dot);

    if (i < scene.steps.length - 1) {
      const line = document.createElement('div');
      line.className = 'tl-line' + (G.decisions[i] ? ' done' : '');
      tl.appendChild(line);
    }
  });
}

function showTimelinePopup(event, stepIdx) {
  event.stopPropagation();
  // Remove any existing popup
  document.querySelectorAll('.tl-popup').forEach(p => p.remove());

  const d = G.decisions[stepIdx];
  if (!d) return;
  const step = G.scene.steps[stepIdx];
  const popup = document.createElement('div');
  popup.className = 'tl-popup';
  popup.innerHTML = `
    <span class="tl-popup-close" onclick="this.parentElement.remove()">✕</span>
    <span class="tl-popup-step">Étape ${stepIdx + 1} — ${step.phase || 'Décision'}</span>
    <span class="tl-popup-status ${d.ok ? 'ok' : 'ko'}">${d.ok ? 'BONNE DÉCISION' : 'MAUVAISE DÉCISION'} · ${d.pts >= 0 ? '+' : ''}${d.pts} pts</span>
    <div class="tl-popup-fb">${d.fb}</div>
  `;

  // Position near the clicked element
  const rect = event.target.getBoundingClientRect();
  popup.style.left = Math.min(window.innerWidth - 300, rect.left) + 'px';
  popup.style.top = (rect.bottom + 8) + 'px';
  document.body.appendChild(popup);

  // Click outside to close
  setTimeout(() => {
    document.addEventListener('click', function closer() {
      popup.remove();
      document.removeEventListener('click', closer);
    }, { once: true });
  }, 50);
}

// ═══════════════════════════════════════════════════
// HINT SYSTEM (-25 XP to eliminate a wrong choice)
// ═══════════════════════════════════════════════════
const HINT_COST = 25;

function updateHintButton() {
  const btn = document.getElementById('hint-btn');
  if (!btn) return;
  const step = G.scene.steps[G.stepIdx];
  const usedThisStep = G.hintUsedForStep[G.stepIdx] !== undefined;
  const totalXP = lsGet('cas_xp', 0);

  // Count wrong choices remaining (must have at least 2 wrong to eliminate one)
  const wrongCount = step.choices.filter((c, i) => !c.ok && G.hintUsedForStep[G.stepIdx] !== i).length;

  btn.disabled = usedThisStep || G.answered || totalXP < HINT_COST || wrongCount < 2;
  btn.classList.toggle('used', usedThisStep);
  if (usedThisStep) {
    btn.innerHTML = '💡 <span>Utilisé</span>';
  } else {
    btn.innerHTML = `💡 <span>Indice (−${HINT_COST} XP)</span>`;
  }
}

function useHint() {
  if (G.answered) return;
  if (G.hintUsedForStep[G.stepIdx] !== undefined) return;

  const totalXP = lsGet('cas_xp', 0);
  if (totalXP < HINT_COST) {
    showToast('⚠ XP insuffisants (' + HINT_COST + ' XP requis)');
    return;
  }

  const step = G.scene.steps[G.stepIdx];
  const wrongIdx = step.choices
    .map((c, i) => !c.ok ? i : -1)
    .filter(i => i !== -1);

  if (wrongIdx.length < 2) {
    showToast('⚠ Indice indisponible pour cette question');
    return;
  }

  // Pick one random wrong choice to eliminate
  const eliminate = wrongIdx[Math.floor(RNG() * wrongIdx.length)];
  G.hintUsedForStep[G.stepIdx] = eliminate;

  // Deduct XP
  lsSet('cas_xp', totalXP - HINT_COST);
  updateGradeDisplay();

  // Mark the button visually
  const order = G.stepChoicesOrder[G.stepIdx];
  const visualIdx = order.indexOf(eliminate);
  const btns = document.querySelectorAll('.choice-btn');
  if (btns[visualIdx]) {
    btns[visualIdx].disabled = true;
    btns[visualIdx].classList.add('eliminated');
    btns[visualIdx].style.opacity = '.3';
    btns[visualIdx].style.textDecoration = 'line-through';
  }

  updateHintButton();
  showToast('💡 Une mauvaise réponse a été éliminée');
  playSound('ok');
}

// ═══════════════════════════════════════════════════
// CUSTODY BAR
// ═══════════════════════════════════════════════════
function updateCustodyBar() {
  const pct = G.custodyPct;
  const fill = document.getElementById('custody-fill');
  const label = document.getElementById('custody-pct');

  fill.style.width = pct + '%';
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--gold)' : 'var(--red)';
  fill.style.background = color;
  label.style.color = color;
  label.textContent = pct + '%';

  // Dynamic vignette update
  updateVignette(pct);
}

// ═══════════════════════════════════════════════════
// CHOICE SELECTION
// ═══════════════════════════════════════════════════
function selectChoice(choiceIdx, btn) {
  if (G.answered) return;
  G.answered = true;
  stopProcureurTimer();

  const step = G.scene.steps[G.stepIdx];
  const choice = step.choices[choiceIdx];

  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
  btn.classList.add(choice.ok ? 'selected-ok' : 'selected-ko');

  // Apply points — x2 in procureur mode
  let pts = choice.pts || 0;
  if (G.mode === 'procureur' && pts > 0) pts *= 2;

  G.score += pts;
  if (choice.ok) G.okCount++; else G.errCount++;
  // v2.8 : firstChoiceOk = correct AND no hint used on this step (for Sniper badge)
  const hintUsedThisStep = G.hintUsedForStep && G.hintUsedForStep[G.stepIdx] !== undefined;
  G.decisions[G.stepIdx] = {
    ok: choice.ok, pts, fb: choice.fb, legal: choice.legal, critical: choice.critical,
    firstChoiceOk: choice.ok && !hintUsedThisStep
  };

  if (choice.critical) {
    G.hadCriticalError = true;
    G.custodyPct = Math.max(0, G.custodyPct - 25);
    triggerGlitch();
  } else if (!choice.ok) {
    G.custodyPct = Math.max(0, G.custodyPct - 10);
  }

  updateCustodyBar();
  renderTimeline();
  playSound(choice.critical ? 'critical' : choice.ok ? 'ok' : 'ko');

  const fbArea = document.getElementById('feedback-area');
  fbArea.style.display = '';
  fbArea.innerHTML = `
    <div class="feedback-box ${choice.ok ? 'ok' : 'ko'}">
      <span class="fb-pts">${pts > 0 ? '+' : ''}${pts} pts</span>
      ${choice.ok ? '✅' : '❌'} ${choice.fb}
      ${choice.legal ? `<div class="fb-legal">📖 ${choice.legal}</div>` : ''}
    </div>
  `;

  if (choice.critical) {
    const critArea = document.getElementById('critical-area');
    critArea.style.display = '';
    critArea.innerHTML = `
      <div class="critical-banner">
        <strong>🚨 ERREUR CRITIQUE — Impact sur la chaîne de custody</strong>
        Cette décision pourrait invalider des preuves devant le Tribunal fédéral. Chaîne de custody réduite à ${G.custodyPct}%.
        ${G.mode === 'procureur' ? '<br><em>Mode Procureur : le scénario prend fin immédiatement.</em>' : ''}
      </div>
    `;
  }

  // In procureur mode, critical error = end
  if (G.mode === 'procureur' && choice.critical) {
    G.nextTarget = 'end';
  } else {
    G.nextTarget = (choice.next !== undefined) ? choice.next : 'auto';
  }

  const nextBtn = document.getElementById('next-step-btn');
  nextBtn.disabled = false;

  const isEnd = G.nextTarget === 'end';
  const isLast = G.stepIdx >= G.scene.steps.length - 1;
  nextBtn.textContent = (isEnd || isLast) ? 'Voir le rapport final →' : 'Étape suivante →';
}

// ═══════════════════════════════════════════════════
// ADVANCE
// ═══════════════════════════════════════════════════
function advanceStep() {
  const target = G.nextTarget;
  const isLast = G.stepIdx >= G.scene.steps.length - 1;

  if (target === 'end' || isLast) { showReport(); return; }

  if (typeof target === 'number') G.stepIdx = target;
  else G.stepIdx++;

  if (G.stepIdx >= G.scene.steps.length) { showReport(); return; }

  renderStep();
  document.getElementById('screen-scene').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function abortScene() {
  if (!confirm('Abandonner ce scénario ? Votre progression actuelle sera perdue.')) return;
  stopProcureurTimer();
  setAtmosphere('');
  goLobby();
}

// ═══════════════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════════════
function showReport() {
  stopProcureurTimer();

  const scene = G.scene;
  const maxScore = G.mode === 'procureur' ? G.maxScore * 2 : G.maxScore;
  const score = G.score;
  const pct = maxScore > 0 ? Math.max(0, Math.min(100, Math.round((score / maxScore) * 100))) : 0;
  const custodyPct = G.custodyPct;

  // XP calculation with streak bonus
  const diffMult = { easy: 1, medium: 1.5, hard: 2, expert: 2.5 }[scene.difficulty] || 1;
  const modeMult = G.mode === 'procureur' ? 1.5 : 1;
  const streak = getStreak();
  const sBonus = streakBonus(streak.count);
  const baseXP = Math.round(pct * diffMult * modeMult * 0.8);
  const xpGained = Math.round(baseXP * sBonus);

  // Save XP
  const xpResult = addXP(xpGained);

  // No-critical-error streak
  if (!G.hadCriticalError) {
    lsSet('cas_no_crit_streak', lsGet('cas_no_crit_streak', 0) + 1);
  } else {
    lsSet('cas_no_crit_streak', 0);
  }

  // Expert clean win (no critical error on Expert scenario)
  if (scene.difficulty === 'expert' && !G.hadCriticalError && pct >= 70) {
    lsSet('cas_expert_clean_wins', lsGet('cas_expert_clean_wins', 0) + 1);
  }

  // Procureur win counter
  if (G.mode === 'procureur' && pct >= 70) {
    lsSet('cas_procureur_wins', lsGet('cas_procureur_wins', 0) + 1);
  }

  // ─── v2.8 : nouveau tracking pour 5 nouveaux badges ───
  const nowDate = new Date();
  const hour = nowDate.getHours();

  // Night owl (23h-3h) and early bird (5h-7h) — only count if scenario passed
  if (pct >= 60) {
    if (hour >= 23 || hour < 3) {
      lsSet('cas_night_owl', lsGet('cas_night_owl', 0) + 1);
    }
    if (hour >= 5 && hour < 7) {
      lsSet('cas_early_bird', lsGet('cas_early_bird', 0) + 1);
    }
  }

  // Sniper streak: scenario without any hint AND first choice correct on every step
  const noHintsUsed = Object.keys(G.hintUsedForStep || {}).length === 0;
  const allFirstChoiceOk = G.decisions && G.decisions.every(d => d.firstChoiceOk);
  if (pct >= 70 && noHintsUsed && allFirstChoiceOk) {
    lsSet('cas_sniper_streak', lsGet('cas_sniper_streak', 0) + 1);
  } else {
    lsSet('cas_sniper_streak', 0);
  }

  // Improvement tracker: did this run beat the previous score on the same scene?
  const previousResult = (lsGet('scene_results', {}))[scene.id];
  if (previousResult && pct >= previousResult.pct + 20) {
    lsSet('cas_improvements_20', lsGet('cas_improvements_20', 0) + 1);
  }

  // Save result (keep best pct)
  const saved = lsGet('scene_results', {});
  const prev = saved[scene.id];
  if (!prev || pct > prev.pct) {
    saved[scene.id] = { pct, custodyPct, score, mode: G.mode, date: new Date().toLocaleDateString('fr') };
    lsSet('scene_results', saved);
  }

  // Record daily activity
  const activity = lsGet('cas_activity', []);
  const today = new Date().toISOString().slice(0, 10);
  if (!activity.includes(today)) {
    activity.push(today);
    lsSet('cas_activity', activity);
  }

  // ─── v2.8 : Daily combo system ───
  // 3 scénarios à ≥70% le même jour → +50 XP bonus + badge "Inarrêtable"
  let comboBonus = 0;
  let comboTriggered = false;
  if (pct >= 70) {
    const comboState = lsGet('cas_daily_combo', { date: '', count: 0, triggered: false });
    if (comboState.date !== today) {
      // New day: reset
      comboState.date = today;
      comboState.count = 1;
      comboState.triggered = false;
    } else {
      comboState.count++;
    }
    // Trigger combo at exactly 3 (first time of the day)
    if (comboState.count === 3 && !comboState.triggered) {
      comboBonus = 50;
      comboTriggered = true;
      comboState.triggered = true;
      // Track for the "Inarrêtable" badge: count distinct days where combo was triggered
      const comboDays = lsGet('cas_combo_days', []);
      if (!comboDays.includes(today)) {
        comboDays.push(today);
        lsSet('cas_combo_days', comboDays);
      }
    }
    lsSet('cas_daily_combo', comboState);
  }
  // Apply combo bonus to XP
  if (comboBonus > 0) {
    addXP(comboBonus);
  }

  // Add to leaderboard
  const runRecord = {
    pct, custodyPct, score, mode: G.mode,
    date: new Date().toLocaleDateString('fr'),
    seed: G.seed ? seedEncode(G.seed) : null,
    ts: Date.now(),
  };
  const lbBefore = getLeaderboard(scene.id);
  const lbAfter = [...lbBefore, runRecord].sort((a, b) =>
    (b.pct - a.pct) || ((b.custodyPct || 0) - (a.custodyPct || 0))
  ).slice(0, 3);
  lsSet('cas_leaderboards', { ...lsGet('cas_leaderboards', {}), [scene.id]: lbAfter });
  const isNewTop3 = lbAfter.some(r => r.ts === runRecord.ts);

  // Weekly challenge
  const challengeResult = updateChallengeOnRun(scene, { pct, custodyPct, mode: G.mode });
  if (challengeResult.unlocked) {
    addXP(challengeResult.reward);
    setTimeout(() => showToast('🎯 Défi hebdomadaire accompli ! +' + challengeResult.reward + ' XP bonus'), 800);
  }

  // Detect new badges
  const afterBadges = getUnlockedBadges();
  const newBadges = detectNewBadges(G.beforeBadges, afterBadges);
  if (newBadges.length > 0) playSound('badge');

  // Scenario badge
  const badge = scene.badgeFn ? scene.badgeFn(pct, custodyPct) : { icon: '🔍', title: 'Terminé', sub: '' };

  // Narrative ending
  let narrative = null;
  if (scene.narrative) {
    if (pct >= 75 && custodyPct >= 75) narrative = scene.narrative.success;
    else if (pct >= 50) narrative = scene.narrative.degraded;
    else narrative = scene.narrative.failure;
  }

  // Custody result text
  let custodyClass, custodyText;
  if (custodyPct >= 80) {
    custodyClass = 'intact';
    custodyText = `✅ Chaîne de custody intacte (${custodyPct}%) — Preuves recevables au Tribunal fédéral.`;
  } else if (custodyPct >= 50) {
    custodyClass = 'degraded';
    custodyText = `⚠ Chaîne de custody dégradée (${custodyPct}%) — Certaines preuves pourraient être contestées.`;
  } else {
    custodyClass = 'compromised';
    custodyText = `❌ Chaîne de custody compromise (${custodyPct}%) — Les preuves risquent d'être déclarées irrecevables.`;
  }

  // Score ring
  const radius = 42, circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;
  const ringColor = pct >= 70 ? '#30e88a' : pct >= 50 ? '#f0c040' : '#ff4060';

  // Decision review
  const reviewHTML = G.decisions.map((d, i) => {
    const step = scene.steps[i];
    return `
      <div class="review-item ${d.ok ? 'ok' : 'ko'}">
        <div class="review-item-q">Étape ${i + 1} — ${step.question.replace(/<[^>]+>/g, '')}</div>
        <div class="review-item-a ${d.ok ? 'ok' : 'ko'}">${d.ok ? '✓' : '✗'} ${d.fb ? d.fb.split('.')[0] + '.' : ''}</div>
        ${d.legal ? `<div class="review-item-fb">📖 ${d.legal}</div>` : ''}
      </div>
    `;
  }).join('');

  // Mode badge
  const modeBadge = G.mode === 'procureur' ? `<span style="display:inline-block;padding:2px 8px;background:rgba(255,64,96,0.15);border:1px solid var(--red);color:var(--red);border-radius:3px;font-size:10px;font-family:var(--font-mono);letter-spacing:.5px;margin-left:6px">⚖️ PROCUREUR</span>` : '';

  // Grade up notification
  const gradeUpHTML = xpResult.gradeUp ? `
    <span class="xp-gained-new-grade">🎖 Nouveau grade débloqué : <strong>${getGrade(xpResult.next).title}</strong></span>
  ` : '';

  // Streak bonus indicator
  const streakBonusHTML = sBonus > 1 ? `<span style="font-size:11px;color:var(--orange);margin-left:8px">🔥 ×${sBonus.toFixed(2)} streak</span>` : '';

  // v2.8 : Combo bonus banner
  const comboBonusHTML = comboTriggered ? `
    <div style="margin:10px 0;padding:10px 14px;background:linear-gradient(135deg,rgba(255,140,66,0.18),rgba(240,192,64,0.08));border:1px solid var(--orange);border-radius:8px;display:flex;align-items:center;gap:10px;animation:comboBannerIn 0.6s cubic-bezier(.2,.8,.2,1)">
      <span style="font-size:24px">🔥</span>
      <div style="flex:1">
        <div style="font-size:11px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.5px">COMBO QUOTIDIEN ×3</div>
        <div style="font-size:12px;color:var(--text);margin-top:2px">Trois scénarios à ≥70% en une journée — bonus <strong style="color:var(--yellow)">+50 XP</strong> appliqué</div>
      </div>
    </div>
  ` : '';

  // New badges HTML
  const newBadgesHTML = newBadges.length > 0 ? `
    <div class="new-badges">
      <div class="new-badges-title">🏅 Nouvelles distinctions</div>
      ${newBadges.map(id => {
        const b = GLOBAL_BADGES.find(x => x.id === id);
        return `<span class="new-badge-pill"><span>${b.icon}</span><span>${b.title}</span></span>`;
      }).join('')}
    </div>
  ` : '';

  // Leaderboard HTML
  const leaderboardHTML = lbAfter.length > 0 ? `
    <div class="report-leaderboard">
      <div class="report-lb-title">🏆 Top 3 de ce scénario</div>
      ${lbAfter.map((r, i) => {
        const isNew = r.ts === runRecord.ts;
        return `
          <div class="report-lb-row">
            <span class="report-lb-rank r${i+1}">#${i+1}</span>
            <span class="report-lb-score">${r.pct}%</span>
            <span class="report-lb-mode ${r.mode || 'normal'}">${(r.mode || 'normal').toUpperCase()}</span>
            <span class="report-lb-date">${r.date || '—'}${isNew ? ' <span class="report-lb-new">NEW</span>' : ''}</span>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  // Seed share HTML
  const seedCode = G.seed ? seedEncode(G.seed) : null;
  const seedShareHTML = seedCode ? `
    <div class="seed-share">
      <div class="seed-share-title">🔗 Partager ce run</div>
      <div class="seed-share-row">
        <div class="seed-code" id="seed-display">${seedCode}</div>
        <button class="seed-copy-btn" onclick="copySeed('${seedCode}')">📋 Copier</button>
      </div>
    </div>
  ` : '';

  // Notes area
  const currentNote = getNote(scene.id);
  const notesHTML = `
    <div class="notes-area">
      <div class="notes-title">📝 Notes personnelles</div>
      <textarea class="notes-textarea" id="notes-textarea" placeholder="Qu'avez-vous appris de ce scénario ? (sauvegarde automatique)" oninput="saveNote('${scene.id}', this.value)">${currentNote.replace(/"/g, '&quot;')}</textarea>
      <div class="notes-hint">Vos notes sont sauvegardées localement et réapparaissent quand vous revenez sur le scénario.</div>
    </div>
  `;

  // Compute next scenario for "continue" button
  const currentIdx = SCENES.findIndex(s => s.id === scene.id);
  const hasNextScene = currentIdx !== -1 && currentIdx < SCENES.length - 1;
  const nextScene = hasNextScene ? SCENES[currentIdx + 1] : null;
  const nextSceneTitle = nextScene ? nextScene.title : '';

  document.getElementById('report-content').innerHTML = `
    <div class="report-header">
      <div class="report-badge">${badge.icon}</div>
      <div class="report-title" style="color:${pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--gold)' : 'var(--red)'}">${badge.title}</div>
      <div class="report-subtitle">${badge.sub}${modeBadge}</div>
    </div>

    ${narrative ? `
    <div class="narrative-ending">
      <div class="narrative-ending-label">Dénouement judiciaire</div>
      <div class="narrative-ending-text" id="narrative-text-target"></div>
    </div>
    ` : ''}

    <div class="score-ring-wrap">
      <div class="score-ring">
        <svg viewBox="0 0 100 100" width="110" height="110">
          <circle cx="50" cy="50" r="${radius}" fill="none" stroke="var(--border)" stroke-width="8"/>
          <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${ringColor}" stroke-width="8"
            stroke-dasharray="${dash} ${circ}" stroke-linecap="round"/>
        </svg>
        <div class="score-ring-center">
          <span class="score-ring-pct" style="color:${ringColor}">${pct}%</span>
          <span class="score-ring-lbl">Score</span>
        </div>
      </div>
    </div>

    <div class="report-stats">
      <div class="rstat"><div class="rstat-val" style="color:var(--green)">${G.okCount}</div><div class="rstat-lbl">Bonnes décisions</div></div>
      <div class="rstat"><div class="rstat-val" style="color:var(--red)">${G.errCount}</div><div class="rstat-lbl">Erreurs</div></div>
      <div class="rstat"><div class="rstat-val" style="color:var(--gold)">${G.score}</div><div class="rstat-lbl">Points</div></div>
    </div>

    <div class="xp-gained">
      <span class="xp-gained-icon">✨</span>
      <span class="xp-gained-text">+${xpGained} XP</span>
      ${streakBonusHTML}
      ${gradeUpHTML}
    </div>

    ${comboBonusHTML}

    ${newBadgesHTML}

    <div class="custody-result ${custodyClass}">${custodyText}</div>

    ${leaderboardHTML}

    ${seedShareHTML}

    ${notesHTML}

    <div class="review-section">
      <div class="review-title">Revue des décisions</div>
      ${reviewHTML}
    </div>

    ${scene.debrief ? `
    <div class="debrief-section">
      <div class="review-title">📖 Analyse pédagogique</div>
      <div class="debrief-content">${scene.debrief}</div>
    </div>
    ` : ''}

    <div class="refs-row">
      ${(scene.legalRefs || []).map(r => renderRefTag(r)).join('')}
    </div>

    ${renderGlossarySection(scene.legalRefs)}

    <div class="report-actions">
      <button class="retry-btn" onclick="launchScene()">🔄 Recommencer ce scénario</button>
      ${hasNextScene ? `<button class="next-scene-btn" onclick="launchNextScene()">🚀 Scénario suivant : ${nextSceneTitle} →</button>` : ''}
      <button class="back-btn" onclick="goLobby()">← Retour au lobby</button>
    </div>
  `;

  showScreen('report');

  // Cinematic reveal of narrative via typewriter
  if (narrative) {
    const target = document.getElementById('narrative-text-target');
    if (target) {
      setTimeout(() => typewriter(target, narrative, 25), 300);
    }
  }

  // Confetti on 100% runs
  if (pct === 100 && custodyPct >= 90) {
    setTimeout(() => fireConfetti(), 600);
  }

  // Reset vignette (leaving scene)
  updateVignette(100);
}

// Notes save helper (debounced light)
let notesTimer = null;
function saveNote(sceneId, text) {
  if (notesTimer) clearTimeout(notesTimer);
  notesTimer = setTimeout(() => setNote(sceneId, text), 500);
}

// Seed copy helper
function copySeed(code) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(
      () => showToast('📋 Seed copiée : ' + code),
      () => showToast('⚠ Impossible de copier automatiquement')
    );
  } else {
    // Fallback: select the element
    const el = document.getElementById('seed-display');
    if (el) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      showToast('📋 Seed sélectionnée — Ctrl+C pour copier');
    }
  }
}

// ═══════════════════════════════════════════════════
// STATS SCREEN
// ═══════════════════════════════════════════════════
function openStatsScreen() {
  const activity = lsGet('cas_activity', []);
  const activitySet = new Set(activity);
  const results = lsGet('scene_results', {});
  const xp = lsGet('cas_xp', 0);

  // Last 98 days heatmap (14 weeks × 7 days)
  const heatmapDays = [];
  const now = new Date();
  for (let i = 97; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    heatmapDays.push({ iso, active: activitySet.has(iso) });
  }

  const heatmapHTML = heatmapDays.map(d => {
    const cls = d.active ? 'l4' : '';
    return `<div class="heatmap-day ${cls}" title="${d.iso}${d.active ? ' — Actif' : ''}"></div>`;
  }).join('');

  // Distribution by tag
  const tagCounts = {};
  Object.entries(results).forEach(([id, r]) => {
    const s = SCENES.find(x => x.id === id);
    if (s && s.tags) s.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
  });
  const totalRuns = Object.keys(results).length;
  const totalPct = Object.values(results).reduce((a, r) => a + r.pct, 0);
  const avgScore = totalRuns > 0 ? Math.round(totalPct / totalRuns) : 0;

  // Difficulty breakdown
  const diffCounts = { easy: 0, medium: 0, hard: 0, expert: 0 };
  Object.entries(results).forEach(([id]) => {
    const s = SCENES.find(x => x.id === id);
    if (s) diffCounts[s.difficulty]++;
  });

  // Mastery breakdown
  const mastery = computeThemeMastery();

  document.getElementById('stats-content').innerHTML = `
    <div class="stats-header">
      <div class="stats-title">Statistiques détaillées</div>
      <div class="stats-subtitle">${totalRuns} scénarios complétés · ${xp} XP · ${activity.length} jours d'activité</div>
    </div>

    <div class="stats-section">
      <div class="stats-section-title">📅 Activité (14 dernières semaines)</div>
      <div class="stats-heatmap">${heatmapHTML}</div>
      <div class="heatmap-legend">
        <span>Inactif</span>
        <div class="heatmap-legend-box" style="background:var(--surface2);border:1px solid var(--border)"></div>
        <div class="heatmap-legend-box l4" style="background:#30e88a"></div>
        <span>Actif</span>
      </div>
    </div>

    <div class="stats-section">
      <div class="stats-section-title">📊 Vue d'ensemble</div>
      <div class="report-stats">
        <div class="rstat"><div class="rstat-val" style="color:var(--cyan)">${avgScore}%</div><div class="rstat-lbl">Score moyen</div></div>
        <div class="rstat"><div class="rstat-val" style="color:var(--gold)">${diffCounts.hard}</div><div class="rstat-lbl">Hard terminés</div></div>
        <div class="rstat"><div class="rstat-val" style="color:var(--purple)">${Object.values(lsGet('cas_leaderboards',{})).length}</div><div class="rstat-lbl">Scénarios rejoués</div></div>
      </div>
    </div>

    <div class="stats-section">
      <div class="stats-section-title">🧭 Maîtrise par thème</div>
      <div style="display:flex;flex-direction:column;gap:6px">
      ${RADAR_THEMES.map(t => {
        const v = mastery[t];
        const color = v >= 80 ? 'var(--green)' : v >= 50 ? 'var(--gold)' : v > 0 ? 'var(--red)' : 'var(--dim)';
        return `
          <div style="display:flex;align-items:center;gap:10px;font-size:12px">
            <span style="min-width:80px;color:var(--text)">${t}</span>
            <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${v}%;background:${color};transition:width 0.6s ease"></div>
            </div>
            <span style="min-width:40px;text-align:right;font-family:var(--font-mono);font-size:11px;color:${color};font-weight:700">${v}%</span>
          </div>
        `;
      }).join('')}
      </div>
    </div>

    <div class="report-actions">
      <button class="back-btn" onclick="goLobby()">← Retour au lobby</button>
    </div>
  `;

  showScreen('stats');
}

// ═══════════════════════════════════════════════════
// PROFILE SCREEN (export/import)
// ═══════════════════════════════════════════════════
function openProfileModal() {
  const xp = lsGet('cas_xp', 0);
  const grade = getGrade(xp);
  const badges = getUnlockedBadges();
  const results = lsGet('scene_results', {});
  const streak = getStreak();

  document.getElementById('profile-content').innerHTML = `
    <div class="stats-header">
      <div class="stats-title">Mon profil</div>
      <div class="stats-subtitle">${grade.icon} ${grade.title} · ${xp} XP · ${badges.length} badge${badges.length>1?'s':''}</div>
    </div>

    <div class="stats-section">
      <div class="stats-section-title">📊 Résumé</div>
      <div class="report-stats">
        <div class="rstat"><div class="rstat-val" style="color:var(--gold)">${xp}</div><div class="rstat-lbl">XP</div></div>
        <div class="rstat"><div class="rstat-val" style="color:var(--cyan)">${Object.keys(results).length}</div><div class="rstat-lbl">Scénarios</div></div>
        <div class="rstat"><div class="rstat-val" style="color:var(--orange)">${streak.count}</div><div class="rstat-lbl">Jours de série</div></div>
      </div>
    </div>

    <div class="stats-section">
      <div class="stats-section-title">💾 Sauvegarde du profil</div>
      <div class="profile-actions">
        <button class="profile-btn" onclick="exportProfile()">
          ⬇️ Exporter mon profil (JSON)
        </button>
        <label class="profile-btn" style="cursor:pointer">
          ⬆️ Importer un profil (JSON)
          <input type="file" accept=".json,application/json" style="display:none" onchange="importProfile(event)" />
        </label>
        <button class="profile-btn danger" onclick="resetProfile()">
          🗑 Réinitialiser la progression
        </button>
      </div>
    </div>

    <div class="report-actions">
      <button class="back-btn" onclick="goLobby()">← Retour au lobby</button>
    </div>
  `;

  showScreen('profile');
}

function buildProfileJSON() {
  return {
    version: 1,
    exported: new Date().toISOString(),
    xp: lsGet('cas_xp', 0),
    results: lsGet('scene_results', {}),
    leaderboards: lsGet('cas_leaderboards', {}),
    notes: lsGet('cas_notes', {}),
    streak: lsGet('cas_streak', { count: 0, lastDate: null }),
    challenge: lsGet('cas_challenge', null),
    activity: lsGet('cas_activity', []),
    noCritStreak: lsGet('cas_no_crit_streak', 0),
    procureurWins: lsGet('cas_procureur_wins', 0),
    expertCleanWins: lsGet('cas_expert_clean_wins', 0),
  };
}

function exportProfile() {
  const data = buildProfileJSON();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cas-in-profile-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('⬇️ Profil exporté');
}

function importProfile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.version) throw new Error('Format invalide');
      if (!confirm('Importer ce profil écrasera votre progression actuelle. Continuer ?')) return;
      if (data.xp !== undefined) lsSet('cas_xp', data.xp);
      if (data.results) lsSet('scene_results', data.results);
      if (data.leaderboards) lsSet('cas_leaderboards', data.leaderboards);
      if (data.notes) lsSet('cas_notes', data.notes);
      if (data.streak) lsSet('cas_streak', data.streak);
      if (data.challenge) lsSet('cas_challenge', data.challenge);
      if (data.activity) lsSet('cas_activity', data.activity);
      if (data.noCritStreak !== undefined) lsSet('cas_no_crit_streak', data.noCritStreak);
      if (data.procureurWins !== undefined) lsSet('cas_procureur_wins', data.procureurWins);
      if (data.expertCleanWins !== undefined) lsSet('cas_expert_clean_wins', data.expertCleanWins);
      showToast('⬆️ Profil importé — rechargement…');
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      showToast('⚠ Fichier invalide : ' + err.message);
    }
  };
  reader.readAsText(file);
}

function resetProfile() {
  if (!confirm('⚠ ATTENTION — Cette action supprimera DÉFINITIVEMENT toute votre progression.\n\nVoulez-vous vraiment continuer ?')) return;
  if (!confirm('Dernière confirmation : toutes les XP, badges, scores et notes seront perdus. Continuer ?')) return;

  ['user_xp', 'scene_results', 'cas_leaderboards', 'cas_notes', 'cas_streak',
   'cas_challenge', 'cas_activity', 'cas_no_crit_streak', 'cas_procureur_wins',
   'cas_expert_clean_wins', 'cas_xp']
    .forEach(k => localStorage.removeItem(k));

  showToast('🗑 Progression réinitialisée');
  setTimeout(() => location.reload(), 800);
}

// ═══════════════════════════════════════════════════
// SEED SCREEN (launch from shared seed)
// ═══════════════════════════════════════════════════
function openSeedModal() {
  const scenesList = SCENES.map(s => `
    <option value="${s.id}">${s.icon} ${s.title} [${s.difficulty}]</option>
  `).join('');

  document.getElementById('seed-content').innerHTML = `
    <div class="stats-header">
      <div class="stats-title">Lancer une seed</div>
      <div class="stats-subtitle">Rejouez le run exact d'un collègue</div>
    </div>

    <div class="stats-section">
      <div class="stats-section-title">🎯 Scénario cible</div>
      <select id="seed-scene-select" class="notes-textarea" style="min-height:auto;padding:8px 10px;font-family:var(--font-body);font-size:13px">
        ${scenesList}
      </select>
    </div>

    <div class="stats-section">
      <div class="stats-section-title">🔗 Code seed</div>
      <input type="text" class="seed-input" id="seed-input-modal" placeholder="Ex : A7F2-K3M8" maxlength="9" style="width:100%;padding:10px 12px;font-size:14px" />
      <div class="notes-hint" style="margin-top:6px">Format : 7 caractères alphanumériques (avec tiret optionnel au milieu)</div>
    </div>

    <div class="report-actions">
      <button class="retry-btn" onclick="launchFromSeed()">🚀 Lancer le run</button>
      <button class="back-btn" onclick="goLobby()">← Retour</button>
    </div>
  `;

  showScreen('seed');
}

function launchFromSeed() {
  const sceneId = document.getElementById('seed-scene-select').value;
  const seedCode = document.getElementById('seed-input-modal').value.trim();

  if (!seedCode) {
    showToast('⚠ Entrez un code seed');
    return;
  }
  const decoded = seedDecode(seedCode);
  if (decoded === null) {
    showToast('⚠ Code seed invalide');
    return;
  }

  const scene = SCENES.find(s => s.id === sceneId);
  if (!scene) return;

  // Launch and inject seed
  hydrateScene(scene).then(full => {
    startScene(full);
    setTimeout(() => {
      const inp = document.getElementById('seed-input-briefing');
      if (inp) inp.value = seedCode;
    }, 100);
  }).catch(err => {
    console.error('[scenes] launchFromSeed failed:', err);
    showToast('⚠ Scène introuvable');
  });
}

// ═══════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════
function goLobby() {
  setAtmosphere('');
  initLobby();
  showScreen('lobby');
}

// Launch the next scenario after the current one
function launchNextScene() {
  const currentIdx = SCENES.findIndex(s => s.id === G.scene.id);
  if (currentIdx === -1 || currentIdx >= SCENES.length - 1) { goLobby(); return; }
  const nextScene = SCENES[currentIdx + 1];
  // Check if locked (shouldn't be, since previous was just completed)
  const saved = lsGet('scene_results', {});
  if (currentIdx > 0 && !saved[SCENES[currentIdx].id]) {
    // still locked somehow — go to lobby
    showToast('🔒 Scénario suivant encore verrouillé');
    goLobby();
    return;
  }
  // hydrate avant de démarrer (en cas où SCENES contient juste l'index)
  hydrateScene(nextScene).then(startScene).catch(err => {
    console.error('[scenes] launchNextScene failed:', err);
    showToast('⚠ Scène introuvable');
    goLobby();
  });
}



// ═══════════════════════════════════════════════════
// CANTON MAP
// ═══════════════════════════════════════════════════
const CANTON_DATA = {
  GE: { name: "Genève", scenarios: ["sms-blasters","darkmarket_2021"] },
  VD: { name: "Vaud", scenarios: ["ncmec-cypertip","lockbit-victime","comparis_2021","unine_2022"] },
  VS: { name: "Valais", scenarios: ["vetroz-akira","sati-bec","rajeunissement-ia","saxon-curatelle","competence-mpc-vs","hydro-valais"] },
  FR: { name: "Fribourg", scenarios: ["dab-villaz"] },
  NE: { name: "Neuchâtel", scenarios: ["faux-policiers","harcelement-ne"] },
  JU: { name: "Jura", scenarios: ["delemont-forum","jura-vishing-1m"] },
  BE: { name: "Berne", scenarios: ["ruag_2016","palais_federal","deepfake-electoral"] },
  ZH: { name: "Zurich", scenarios: ["attribution","bitlocker","bitlocker_froid"] },
  SZ: { name: "Schwyz", scenarios: ["clone-vocal"] },
  TI: { name: "Tessin", scenarios: ["sati-bec"] },
  SG: { name: "Saint-Gall", scenarios: ["operation-alice","stgall-infiltration"] },
  AG: { name: "Argovie", scenarios: ["operation-alice"] },
  LU: { name: "Lucerne", scenarios: ["operation-alice"] },
  TG: { name: "Thurgovie", scenarios: ["operation-alice"] },
};

function initCantonMap() {
  const saved = lsGet('scene_results', {});
  const svgPaths = document.querySelectorAll('#canton-svg path');
  svgPaths.forEach(path => {
    const id = path.id;
    const data = CANTON_DATA[id] || { name: id, scenarios: [] };
    const count = data.scenarios.length;
    const done  = data.scenarios.filter(s => saved[s]).length;
    path.dataset.count = Math.min(count, 4);

    const tip = document.getElementById('canton-tooltip');
    path.addEventListener('mouseenter', e => {
      if (!count) return;
      const sceneTitles = data.scenarios.map(sid => {
        const s = SCENES.find(x => x.id === sid);
        const isDone = saved[sid];
        return `${isDone ? '✓' : '○'} ${s ? s.title : sid}`;
      }).join('<br>');
      tip.innerHTML = `<strong>${data.name}</strong><br>${sceneTitles}`;
      tip.style.display = 'block';
    });
    path.addEventListener('mousemove', e => {
      const tip = document.getElementById('canton-tooltip');
      tip.style.left = (e.clientX + 12) + 'px';
      tip.style.top  = (e.clientY - 10) + 'px';
    });
    path.addEventListener('mouseleave', () => {
      document.getElementById('canton-tooltip').style.display = 'none';
    });
    path.addEventListener('click', () => {
      if (data.scenarios.length === 0) return;
      const firstUndone = data.scenarios.find(s => !saved[s]);
      const targetId = firstUndone || data.scenarios[0];
      const scene = SCENES.find(x => x.id === targetId);
      if (scene) hydrateScene(scene).then(startScene).catch(err => {
        console.error('[scenes] canton click failed:', err);
        showToast('⚠ Scène introuvable');
      });
    });
  });
}

function toggleCantonMap() {
  const sec = document.getElementById('canton-map-section');
  const wasOpen = sec.classList.toggle('open');
  if (wasOpen) initCantonMap();
}

// ═══════════════════════════════════════════════════
// SKILL TREE (v2.8) — vue alternative au lobby
// Affiche les scénarios groupés par "branche de compétence"
// avec les badges associés à chaque branche.
// ═══════════════════════════════════════════════════
const SKILL_BRANCHES = [
  {
    id: 'forensique', icon: '🔬', color: '#fb923c',
    title: 'Forensique technique',
    desc: 'Acquisition, hash, file system, journaux, timestomping',
    matchTags: ['FORENSIQUE', 'WINDOWS'],
    badges: ['forensic_pro', 'windows_guru', 'chain_master', 'perfectionist'],
  },
  {
    id: 'crypto', icon: '🔐', color: '#f0c040',
    title: 'Cryptographie & ransomwares',
    desc: 'Chiffrement, BitLocker, ransomware, attaques sur clés',
    matchTags: ['CRYPTO', 'RANSOMWARE'],
    badges: ['crypto_sage', 'ransom_expert'],
  },
  {
    id: 'droit', icon: '⚖️', color: '#ff8c42',
    title: 'Droit pénal & procédure',
    desc: 'CPP, perquisition, scellés, secret professionnel, séquestre',
    matchTags: ['DROIT', 'CPP'],
    badges: ['swiss_jurist', 'speed_demon', 'prosecutor', 'expert_clean'],
  },
  {
    id: 'reseau', icon: '🌐', color: '#38bdf8',
    title: 'Réseau & infrastructure',
    desc: 'Pcaps, DNS, attribution, attaques DDoS, supply chain',
    matchTags: ['RÉSEAUX', 'TELECOM'],
    badges: ['network_ninja'],
  },
  {
    id: 'international', icon: '🇪🇺', color: '#9b8cff',
    title: 'Coopération internationale',
    desc: 'EIMP, MLAT, Eurojust, JIT, entraide pénale',
    matchTags: [],  // matched via region === 'EU'
    matchRegion: 'EU',
    badges: ['eu_first_mlat', 'eu_jit_master', 'eu_budapest_spec', 'eu_eurojust_vet', 'eu_tour_europe'],
  },
  {
    id: 'comportement', icon: '🎯', color: '#c084fc',
    title: 'Discipline & exploration',
    desc: 'Régularité, sans-faute, exploration de tous les cantons',
    matchTags: [],
    matchAll: true,  // any scenario counts
    badges: ['first_blood', 'rookie_5', 'veteran_10', 'completionist',
             'ethics_warden', 'ethics_knight', 'ethics_legend',
             'night_owl', 'early_bird', 'sniper', 'tour_de_suisse',
             'perseverant', 'unstoppable', 'historian'],
  },
];

function getBranchScenes(branch) {
  if (branch.matchAll) return SCENES;
  if (branch.matchRegion) {
    return SCENES.filter(s => s.region === branch.matchRegion);
  }
  return SCENES.filter(s => (s.tags || []).some(t => branch.matchTags.includes(t)));
}

function renderSkillTree() {
  const container = document.getElementById('skilltree-container');
  if (!container) return;
  const results = lsGet('scene_results', {});
  const unlockedBadges = new Set(getUnlockedBadges());

  // Subtitle: total badges
  const totalBadges = GLOBAL_BADGES.length;
  document.getElementById('skilltree-subtitle').textContent =
    `${unlockedBadges.size} / ${totalBadges} distinctions débloquées`;

  container.innerHTML = SKILL_BRANCHES.map(branch => {
    const branchScenes = getBranchScenes(branch);
    const completed = branchScenes.filter(s => results[s.id]).length;
    const total = branchScenes.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Up to 6 scenes shown per branch (sorted: completed first, then unlocked, then locked)
    const scenesSorted = [...branchScenes].sort((a, b) => {
      const aDone = results[a.id] ? 1 : 0;
      const bDone = results[b.id] ? 1 : 0;
      if (aDone !== bDone) return bDone - aDone;
      return (a.title || '').localeCompare(b.title || '');
    }).slice(0, 12);

    const nodesHTML = scenesSorted.map(scene => {
      const result = results[scene.id];
      const isDone = !!result;
      const cls = isDone ? 'skill-node completed' : 'skill-node';
      const meta = isDone
        ? `${result.pct}% · ${({easy:'F',medium:'M',hard:'D',expert:'X'})[scene.difficulty]||'?'}`
        : `${({easy:'Facile',medium:'Moyen',hard:'Difficile',expert:'Expert'})[scene.difficulty]||scene.difficulty}`;
      return `
        <div class="${cls}" onclick="launchSceneFromTree('${scene.id}')">
          <span class="skill-node-icon">${scene.icon || '🎯'}</span>
          <div class="skill-node-body">
            <div class="skill-node-title" title="${(scene.title||'').replace(/"/g,'&quot;')}">${scene.title || scene.id}</div>
            <div class="skill-node-meta">${meta}</div>
          </div>
        </div>
      `;
    }).join('');

    const moreHTML = branchScenes.length > scenesSorted.length
      ? `<div class="skill-node-meta" style="margin-top:8px;text-align:center">+ ${branchScenes.length - scenesSorted.length} autres scénarios</div>`
      : '';

    const badgesHTML = (branch.badges || []).map(bid => {
      const b = GLOBAL_BADGES.find(x => x.id === bid);
      if (!b) return '';
      const unlocked = unlockedBadges.has(bid);
      return `
        <span class="skill-branch-badge ${unlocked ? 'unlocked' : ''}" title="${b.desc}">
          <span class="skill-branch-badge-icon">${b.icon}</span>
          <span>${b.title}${unlocked ? ' ✓' : ''}</span>
        </span>
      `;
    }).join('');

    return `
      <div class="skill-branch" style="--branch-color:${branch.color}">
        <div class="skill-branch-header">
          <span class="skill-branch-icon">${branch.icon}</span>
          <div class="skill-branch-info">
            <h3 class="skill-branch-title">${branch.title}</h3>
            <div class="skill-branch-desc">${branch.desc}</div>
          </div>
          <div class="skill-branch-progress">
            <div class="skill-branch-bar"><div class="skill-branch-bar-fill" style="width:${pct}%"></div></div>
            <div class="skill-branch-pct">${completed}/${total}</div>
          </div>
        </div>
        <div class="skill-nodes">${nodesHTML}</div>
        ${moreHTML}
        ${badgesHTML ? `<div class="skill-branch-badges">${badgesHTML}</div>` : ''}
      </div>
    `;
  }).join('');
}

function openSkillTree() {
  // S'assurer que SCENES (l'index) est chargé avant d'afficher
  loadSceneIndex().then(() => {
    renderSkillTree();
    showScreen('skilltree');
  }).catch(err => {
    console.error('[skilltree] load failed:', err);
    showToast('⚠ Impossible de charger l\'arbre');
  });
}

function launchSceneFromTree(sceneId) {
  const scene = SCENES.find(s => s.id === sceneId);
  if (!scene) return;
  hydrateScene(scene).then(startScene).catch(err => {
    console.error('[skilltree] launch failed:', err);
    showToast('⚠ Scène introuvable');
  });
}

// ═══════════════════════════════════════════════════
// LOBBY FILTERS & SEARCH
// ═══════════════════════════════════════════════════
let ACTIVE_DIFF_FILTER = 'all';

function setDiffFilter(diff, btn) {
  ACTIVE_DIFF_FILTER = diff;
  document.querySelectorAll('.fchip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyLobbyFilters();
}

function applyLobbyFilters() {
  const q = (document.getElementById('lobby-search')?.value || '').toLowerCase().trim();
  const saved = lsGet('scene_results', {});
  const cards = document.querySelectorAll('#scene-grid .scene-card[data-scene-id]');
  let visible = 0, total = cards.length;

  cards.forEach(card => {
    const id  = card.dataset.sceneId;
    const diff = card.dataset.diff;
    const isReal = card.dataset.real === '1';
    const isDone = !!saved[id];
    const title = (card.dataset.title || '').toLowerCase();
    const tags  = (card.dataset.tags  || '').toLowerCase();

    let show = true;
    if (ACTIVE_DIFF_FILTER === 'real')   show = isReal;
    else if (ACTIVE_DIFF_FILTER === 'done') show = isDone;
    else if (ACTIVE_DIFF_FILTER !== 'all') show = (diff === ACTIVE_DIFF_FILTER);
    if (show && q) show = title.includes(q) || tags.includes(q);

    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  const lbl = document.getElementById('lobby-filter-count');
  if (lbl) lbl.textContent = (q || ACTIVE_DIFF_FILTER !== 'all')
    ? `${visible} scénario${visible !== 1 ? 's' : ''} affiché${visible !== 1 ? 's' : ''}`
    : '';

  const ph = document.getElementById('grid-header-progress');
  const hdr = document.getElementById('grid-header-label');
  const doneCount = Object.keys(saved).length;
  if (ph) ph.textContent = `${doneCount} / ${SCENES.length}`;
  if (hdr) hdr.textContent = (q || ACTIVE_DIFF_FILTER !== 'all')
    ? `${visible} résultat${visible !== 1 ? 's' : ''}`
    : 'Scénarios';
}

// ═══════════════════════════════════════════════════
// KEYBOARD SHORTCUTS — A/B/C for choices
// ═══════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  // Only active in scene screen, not in inputs
  if (document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA') return;

  const screen = document.querySelector('.screen.active');
  if (!screen || screen.id !== 'screen-scene') return;

  const keys = { KeyA: 0, KeyB: 1, KeyC: 2, KeyD: 3 };
  if (e.code in keys) {
    const buttons = [...document.querySelectorAll('.choice-btn:not(:disabled)')];
    const idx = keys[e.code];
    if (buttons[idx]) {
      buttons[idx].click();
      e.preventDefault();
    }
  }

  // Enter/Space to advance (next-step-btn)
  if (e.code === 'Space' || e.code === 'Enter') {
    const nextBtn = document.querySelector('.next-step-btn:not(:disabled):not(.counting)');
    if (nextBtn && nextBtn.offsetParent !== null) {
      nextBtn.click();
      e.preventDefault();
    }
  }
});

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════

// ── Service Worker Registration (PWA) ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[CAS-IN] SW enregistré:', reg.scope))
      .catch(err => console.warn('[CAS-IN] SW échec:', err));
  });
}

window.addEventListener('DOMContentLoaded', () => {
  // Reset filter state on load
  ACTIVE_DIFF_FILTER = 'all';
  // Charger l'index avant de rendre le lobby. Si scenes.js (legacy) est
  // déjà chargé, loadSceneIndex() détecte SCENES rempli et résout direct.
  loadSceneIndex().then(() => {
    initLobby();
  }).catch(err => {
    console.error('[scenes] Boot index échec:', err);
    // Fallback : tenter d'init quand même (peut-être que scenes.js est OK)
    initLobby();
    showToast('⚠ Index des scènes indisponible — mode dégradé');
  });

  // Si l'URL contient #random, lancer une scène aléatoire après l'index
  if (window.location.hash === '#random') {
    loadSceneIndex().then(() => setTimeout(launchRandomScene, 300));
  }
});
