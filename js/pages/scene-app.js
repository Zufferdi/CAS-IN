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
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; } catch { return d; } }function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

// ═══════════════════════════════════════════════════
// COLOR UTILS — palette 5 paliers du score de scène
//   0–32  → rouge foncé   (échec)
//   33–49 → orange        (passable)
//   50–74 → vert très clair (correct)
//   75–99 → vert moyen    (bien)
//   100   → vert vif      (parfait)
// ═══════════════════════════════════════════════════
function getScoreColor(pct) {
  if (pct >= 100) return '#10b981'; // vert vif (emerald-500)
  if (pct >=  75) return '#22c55e'; // vert moyen (green-500)
  if (pct >=  50) return '#86efac'; // vert très clair (green-300)
  if (pct >=  33) return '#f97316'; // orange vif (orange-500)
  return '#991b1b';                  // rouge foncé (red-800)
}

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
// DAILY STREAK — v2.55 : migration vers Profile (volet N — nettoyage)
//
// L'ancien système 'cas_streak' (count + lastDate) est désormais doublonné
// avec Profile.streak (current + max + lastDate). Le bridge intercepte déjà
// les écritures cas_streak vers Profile.bumpStreak/breakStreak.
//
// On expose ici des wrappers compatibles avec l'ancien shape { count, lastDate }
// qui lisent en réalité Profile.getStreak() pour avoir UNE seule source de
// vérité. Les fonctions legacy (getStreak/setStreak/updateStreakOnActivity)
// continuent d'exister pour ne pas casser les call-sites mais utilisent
// Profile en interne.
// ═══════════════════════════════════════════════════
function getStreak() {
  // Source unique : Profile (le bridge maintient cas_streak en miroir)
  if (window.Profile && typeof window.Profile.getStreak === 'function') {
    const s = window.Profile.getStreak();
    return { count: s.current || 0, lastDate: s.lastDate || null };
  }
  // Mini-fallback hors-PWA : lit cas_streak directement (LS uniquement)
  return lsGet('cas_streak', { count: 0, lastDate: null });
}

function setStreak(s) {
  // Plus utilisé directement en v2.55 : la source unique est Profile.
  // On garde le no-op pour ne pas casser d'éventuels appels legacy.
  // (Le bridge écoute déjà les writes cas_streak et les redirige.)
  lsSet('cas_streak', s);
}

function updateStreakOnActivity() {
  // v2.55 : la mise à jour réelle est gérée par Profile.recordActivity('scene')
  // appelé depuis le bridge. Ici on laisse une trace pour les anciens chemins
  // de code qui appelleraient encore cette fonction.
  if (window.Profile && typeof window.Profile.recordActivity === 'function') {
    window.Profile.recordActivity('scene');
    return getStreak();
  }
  // Fallback minimaliste (très ancien chemin) — calcule localement
  const today = new Date().toISOString().slice(0, 10);
  const s = lsGet('cas_streak', { count: 0, lastDate: null });
  if (s.lastDate === today) return s;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (s.lastDate === yesterday) {
    s.count++;
  } else {
    s.count = 1;
  }
  s.lastDate = today;
  lsSet('cas_streak', s);
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
// ═══════════════════════════════════════════════════════════════
// v2.60 — Suggestions intelligentes après une scène
// Combinaison de tags overlap + état joueur + difficulté progressive.
// ═══════════════════════════════════════════════════════════════
function computeNextStepSuggestions(currentScene) {
  if (!currentScene || typeof SCENES === 'undefined') return [];
  const saved = lsGet('scene_results', {});
  const goodResult = id => saved[id] && saved[id].pct >= 80;
  const currentTags = new Set((currentScene.tags || []).map(t => String(t).toUpperCase()));

  // Score chaque autre scène
  const candidates = [];
  SCENES.forEach(s => {
    if (s.id === currentScene.id) return;
    const tagsS = new Set((s.tags || []).map(t => String(t).toUpperCase()));
    const shared = [...currentTags].filter(t => tagsS.has(t));
    const sharedCount = shared.length;
    const isUntouched = saved[s.id] === undefined;
    const isMastered = goodResult(s.id);
    const sameDiff = s.difficulty === currentScene.difficulty;
    const harderDiff = ['easy','medium','hard','expert'].indexOf(s.difficulty) ===
                       ['easy','medium','hard','expert'].indexOf(currentScene.difficulty) + 1;

    // Score (heuristique simple)
    let score = 0;
    score += sharedCount * 10;          // priorité tags overlap
    if (isUntouched) score += 8;         // jamais joué
    else if (!isMastered) score += 3;    // à perfectionner
    else score -= 5;                     // déjà maîtrisée → pénalisé
    if (harderDiff) score += 4;          // 1 niveau plus haut = progression
    if (sameDiff && !isMastered) score += 2;
    if (s.realCase) score += 1;          // léger boost affaires réelles

    if (score <= 0) return; // Filtre les vraiment hors-sujet
    candidates.push({ scene: s, score, sharedCount, shared, isUntouched, isMastered });
  });

  // Trier par score, prendre top 3
  candidates.sort((a, b) => b.score - a.score);
  const top3 = candidates.slice(0, 3);

  // Construire la "raison" pour chaque
  return top3.map(c => {
    let reason;
    if (c.sharedCount >= 2) {
      reason = `Thèmes liés : ${c.shared.slice(0, 2).join(' · ')}`;
    } else if (c.isUntouched) {
      reason = 'Nouveau scénario';
    } else if (!c.isMastered) {
      const pct = saved[c.scene.id].pct;
      reason = `À perfectionner — score actuel ${pct}%`;
    } else if (c.sharedCount === 1) {
      reason = `Thème lié : ${c.shared[0]}`;
    } else {
      reason = 'Suggestion';
    }
    return { scene: c.scene, reason, shared: c.shared };
  });
}

function launchSceneById(sceneId) {
  // v2.61 — Fix régression v2.60 : utiliser hydrateScene + startScene comme
  // launchSceneFromTree() le fait déjà, au lieu du hash qui ne fait que scroller.
  const scene = SCENES.find(s => s.id === sceneId);
  if (!scene) return;
  hydrateScene(scene).then(startScene).catch(err => {
    console.error('[scenes] launchSceneById failed:', err);
    showToast('⚠ Scène introuvable');
  });
}

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

  // ─── v2.62 — Enrichissement (200+ entrées) ───────────────
  // CPP supplémentaires
  "AFD": "Administration fédérale des douanes (renommée OFDF en 2022).",
  "AI Act": "Règlement UE 2024/1689 sur l'intelligence artificielle, en vigueur progressive 2024-2027.",
  "AI Act Annexe III": "Liste des systèmes IA à haut risque par domaine d'application.",
  "AI Act Annexe III §6": "Systèmes IA en application de la loi (procédure pénale) : à haut risque.",
  "AI Act Annexe III §6 — systèmes IA en application de la loi (procédure pénale)": "Les systèmes IA utilisés en procédure pénale sont classés à haut risque.",
  "AI Act art. 26": "Obligations des utilisateurs (déployeurs) de systèmes IA à haut risque.",
  "AI Act art. 26 — obligations utilisateurs (déployeurs)": "Devoirs des organisations qui déploient des systèmes IA à haut risque.",
  "AI Act art. 50": "Obligations de transparence : marquage IA, deepfakes, chatbots.",
  "AI Act art. 50 — obligations transparence": "Marquage obligatoire des contenus générés par IA et des interactions avec chatbots.",
  "AI Act art. 6": "Classification des systèmes IA à haut risque (annexes I et III).",
  "AI Act art. 6 — classification systèmes IA haut risque": "Critères pour qualifier un système IA de haut risque.",
  "AI Act art. 8-15": "Obligations applicables aux systèmes IA à haut risque (gestion des risques, données, documentation, transparence, surveillance humaine, robustesse).",
  "AI Act art. 8-15 — obligations systèmes IA haut risque": "Suite d'obligations pour les fournisseurs et déployeurs de systèmes IA à haut risque.",
  "AI Office": "Bureau européen de l'IA (Commission, DG CNECT) créé en février 2024 pour superviser l'AI Act.",
  "AI Office (Commission européenne, DG CNECT, créé février 2024)": "Bureau de la Commission européenne chargé de la mise en œuvre de l'AI Act.",
  "ANSSI doctrine notification cyber": "Agence nationale de sécurité des systèmes d'information (FR), doctrine post-Xplain 2023 + Endgame 2024.",
  "ANSSI doctrine notification cyber (post-Xplain 2023 + Endgame 2024)": "Doctrine ANSSI mise à jour après les opérations Xplain et Endgame.",
  "ATF 116 IV 319": "Sur la violation du secret professionnel : portée de l'art. 321 CP.",
  "ATF 129 IV 253": "Conditions de l'art. 305bis CP (blanchiment) : connaissance de l'origine illicite.",
  "ATF 137 II 209": "Limites de l'information parlementaire et secret de fonction.",
  "ATF 137 II 209 — Limites de l'information parlementaire": "Limites posées par le TF à l'information du Parlement par le CF (haute surveillance).",
  "ATF 137 IV 33": "Recevabilité des preuves recueillies par particuliers (preuves illicites privées).",
  "ATF 137 IV 33 (preuves recueillies par particuliers)": "Cadre d'admissibilité des preuves obtenues par des particuliers.",
  "ATF 139 IV 128": "Sur les conditions de la détention provisoire (art. 220 CPP).",
  "ATF 141 IV 142": "Soustraction de données informatiques (art. 143 CP) : étendue de la protection.",
  "ATF 141 IV 142 — Soustraction de données informatiques": "Précision sur l'art. 143 CP appliqué au numérique.",
  "ATF 142 IV 16": "Capacité de discernement et fin de vie (art. 19 CP).",
  "ATF 142 IV 16 — Capacité de discernement et fin de vie": "Sur l'application de l'art. 19 CP (capacité de discernement).",
  "ATF 142 IV 388": "Recevabilité d'actes coordonnés multilatéralement.",
  "ATF 142 IV 388 — Recevabilité d'actes coordonnés multilatéralement": "Sur la coordination internationale d'actes d'instruction.",
  "ATF 142 IV 49": "Droits du mineur en procédure pénale.",
  "ATF 142 IV 49 — Droits du mineur en procédure pénale": "Droits spécifiques du mineur prévenu en procédure.",
  "ATF 143 IV 270": "Conditions du séquestre (art. 263 CPP).",
  "ATF 144 IV 23": "Limites de l'investigation secrète (art. 285a ss CPP).",
  "ATF 144 IV 23 — Limites de l'investigation secrète": "Précisions sur les art. 285a-289 CPP.",
  "ATF 144 IV 28": "Distinction art. 162 CP (secret de fabrication) / 273 CP (espionnage économique).",
  "ATF 144 IV 28 — Distinction art. 162 / 273 CP": "Différence entre violation du secret commercial et espionnage économique.",
  "ATF 146 IV 23": "Sur la portée de l'art. 263 CPP (séquestre).",
  "ATF 147 IV 16": "Proportionnalité dans l'usage des données génétiques.",
  "ATF 147 IV 16 — Proportionnalité dans l'usage des données génétiques": "Application du principe de proportionnalité aux profils ADN.",
  "ATF 148 IV 152": "Sur l'art. 269 CPP (surveillance des télécommunications).",
  "ATF 149 IV 248": "Sur les preuves illicites (art. 141 CPP).",
  "ATF 150 IV 188": "Jurisprudence récente sur les mesures de contrainte numériques.",
  "ATF 6B_1180/2023": "Jurisprudence récente sur les preuves cyber.",
  "ATF 6B_157/2019 — seuil de minimis consommation personnelle": "Seuil de minimis pour consommation personnelle de stupéfiants.",
  "ATF 6B_392/2018 — Conditions du dol éventuel art. 305bis CP": "Précision sur le dol éventuel en matière de blanchiment.",
  "ATF nov. 2025 (rajeunissement IA)": "Jurisprudence récente sur l'usage de l'IA en procédure (à confirmer publication).",
  "Accord Schengen-CH 2009": "Modèle d'accord ad hoc EU+CH : association à Schengen depuis 2008.",
  "Accord Schengen-CH 2009 — modèle d'accord ad hoc EU+CH": "Accord d'association de la Suisse à l'espace Schengen.",
  "Accord électrique CH-UE 2014 (suspendu)": "Précédent diplomatique : accord négocié mais jamais ratifié.",
  "Accord électrique CH-UE 2014 (suspendu) — précédent diplomatique": "Cet accord négocié mais jamais signé sert de précédent pour les accords sectoriels CH-UE.",
  "Art. 10 Cst.": "Droit à la vie et liberté personnelle (interdiction torture, peine de mort).",
  "Art. 100 CPP": "Tenue du dossier : pièces enregistrées, ordre chronologique, accès garanti.",
  "Art. 101 CPP": "Consultation du dossier par les parties (droit de la défense).",
  "Art. 12 CPP": "Autorités pénales : MP cantonal/MPC, police, tribunaux. Définition des compétences.",
  "Art. 13 CPP": "Tribunaux : compétences matérielles selon les cantons et la nature de l'infraction.",
  "Art. 138 CP": "Abus de confiance : usage indu d'une chose confiée.",
  "Art. 139 CP": "Vol : soustraction d'une chose mobilière appartenant à autrui.",
  "Art. 14 CPP": "Désignation et organisation des autorités : compétences cantonales.",
  "Art. 140 CP": "Brigandage : vol avec violence ou menace.",
  "Art. 140 CPP": "Méthodes d'administration interdites : torture, tromperie, contrainte physique grave.",
  "Art. 141 al. 1 CPP": "Preuves absolument inexploitables : violation grave des règles de validité.",
  "Art. 141 al. 2 CPP": "Preuves illicites : exploitabilité possible si nécessaire pour élucider une infraction grave (pondération in casu).",
  "Art. 141 al. 2 CPP — Preuves illicites": "Preuves obtenues en violation simple : exploitabilité possible si nécessaire pour élucider une infraction grave.",
  "Art. 141 al. 4 CPP": "Théorie du fruit empoisonné : preuves dérivées d'une preuve illicite également exclues.",
  "Art. 144 CP": "Dommages à la propriété : destruction ou détérioration de biens.",
  "Art. 145 CPP": "Rapports écrits : substituts à l'audition orale dans certains cas.",
  "Art. 147 al. 2 CP": "Cas grave : profession ou bande, peine majorée.",
  "Art. 157 CP": "Usure : exploitation d'une situation de faiblesse pour des avantages disproportionnés.",
  "Art. 158 CP": "Gestion déloyale : atteinte aux intérêts pécuniaires d'autrui par violation de devoir.",
  "Art. 158 CPP": "Information du prévenu : droits, accusation, droit au silence (premier interrogatoire).",
  "Art. 158 CPP — Information du prévenu": "Premier interrogatoire : information sur les charges, droit au silence, droit à l'avocat.",
  "Art. 159 CPP": "Mise en garde du prévenu et avocat de la première heure.",
  "Art. 16 CPP": "Ministère public : conduite de la procédure, ouverture instruction, mise en accusation.",
  "Art. 16 Cst.": "Liberté d'opinion et d'information.",
  "Art. 162 CP": "Violation du secret de fabrication ou commercial.",
  "Art. 162 CP — Violation du secret de fabrication ou commercial": "Protège les secrets industriels et commerciaux des entreprises.",
  "Art. 168 CPP": "Droit de refuser de témoigner : raisons familiales.",
  "Art. 17 CPP": "Autorités pénales compétentes en matière de contraventions (autorités administratives).",
  "Art. 17 Cst.": "Liberté des médias, secret rédactionnel.",
  "Art. 171 CPP": "Secret professionnel des avocats, médecins, ecclésiastiques (refus de témoigner).",
  "Art. 173 CPP": "Secret de fonction des fonctionnaires (limité, dérogeable par l'autorité supérieure).",
  "Art. 173-178 CP": "Atteintes à l'honneur : diffamation, calomnie, injure.",
  "Art. 179 CP": "Violation de domaine secret ou privé : enregistrements sans consentement.",
  "Art. 179bis CP": "Écoute et enregistrement de conversations entre tiers.",
  "Art. 179decies CP": "Usurpation d'identité (en vigueur depuis 2024).",
  "Art. 179novies CP": "Soustraction de données personnelles (anciennement art. 35 LPD).",
  "Art. 179quater CP": "Violation du domaine secret par appareils de prise de vue.",
  "Art. 179quinquies CP": "Détention/diffusion d'enregistrements obtenus illégalement.",
  "Art. 179ter CP": "Enregistrement non autorisé de conversations.",
  "Art. 18 CP": "État de nécessité licite : sauvegarde d'un bien juridique au prix d'un autre.",
  "Art. 18-19 CP — Actes commis sous mission": "Cadre des actes commis dans le cadre d'une mission légale.",
  "Art. 180 CPP": "Personnes appelées à donner des renseignements (ni prévenu, ni témoin).",
  "Art. 185 CPP": "Établissement de l'expertise : règles, contradictoire, présence des parties.",
  "Art. 187 CP": "Actes d'ordre sexuel avec des enfants (mineurs <16 ans).",
  "Art. 188 CPP": "Force probante de l'expertise : libre appréciation par le juge.",
  "Art. 19 CP": "Irresponsabilité et responsabilité restreinte : troubles psychiques, capacité de discernement.",
  "Art. 195 CP": "Encouragement à la prostitution.",
  "Art. 195-196 CP": "Traite des êtres humains à fins sexuelles.",
  "Art. 196 CP": "Actes d'ordre sexuel avec des mineurs contre rémunération.",
  "Art. 196 CPP": "Mesures de contrainte : définition générale, conditions cumulatives.",
  "Art. 197 CP": "Pornographie : production, diffusion, possession (interdiction enfants <16).",
  "Art. 197 al. 4-5 CP": "Pornographie enfantine : possession et consommation (qualifications aggravées).",
  "Art. 198 CPP": "Compétence pour ordonner des mesures de contrainte (MP, tribunal, TMC).",
  "Art. 215 CPP": "Appréhension : police peut interpeller toute personne pour vérifier identité.",
  "Art. 217 CPP": "Arrestation provisoire par la police (flagrant délit).",
  "Art. 22 LPD": "Données génétiques sensibles : traitement à risque élevé, DPIA obligatoire.",
  "Art. 22 LPD — Données génétiques sensibles": "Données génétiques = sensibles, traitement à risque élevé, DPIA obligatoire.",
  "Art. 220 CPP": "Détention provisoire : conditions (forts soupçons + risque de fuite/collusion/réitération).",
  "Art. 224 CPP": "Procédure de détention : audition par MP, demande au TMC dans les 48h.",
  "Art. 24 CPP": "Compétence fédérale du MPC : crimes contre la Confédération, criminalité organisée transfrontalière, terrorisme.",
  "Art. 246 CPP": "Perquisition de documents et enregistrements électroniques.",
  "Art. 252 CP": "Faux dans les certificats.",
  "Art. 255-259 CPP": "Profils ADN forensiques : prélèvement, analyse, conservation, effacement.",
  "Art. 255-259 CPP — Profils ADN forensiques": "Régime des profils ADN en procédure pénale (prélèvement, analyse, fichier).",
  "Art. 26 CPP": "Compétences fédérales en cas de plusieurs États atteints (extraterritorialité).",
  "Art. 27 Cst.": "Liberté économique.",
  "Art. 270 CPP": "Objet de la surveillance : raccordements, télécommunications, courriers.",
  "Art. 271 CP": "Actes exécutés sans droit pour un État étranger : espionnage non militaire.",
  "Art. 271 CP — Actes exécutés sans droit pour un État étranger": "Espionnage non militaire pour un État étranger sur sol suisse.",
  "Art. 271 CP — Actes pour État étranger": "Forme abrégée : actes exécutés sans droit pour un État étranger.",
  "Art. 271 CPP": "Sauvegarde du secret professionnel pendant les surveillances.",
  "Art. 272 CP": "Service de renseignements politiques au préjudice de la Suisse.",
  "Art. 272 CPP": "Autorisation de surveillance par le TMC dans les 24h.",
  "Art. 273 CP": "Service de renseignements économiques (espionnage industriel).",
  "Art. 273 CP — Service de renseignements économiques": "Espionnage économique au profit d'une organisation étrangère.",
  "Art. 280 CPP": "Recours à des dispositifs techniques de surveillance (sons et images).",
  "Art. 285a CPP": "Investigation secrète : définition (agent infiltré sous fausse identité).",
  "Art. 285a CPP — Investigation secrète (définition)": "Définition : agent infiltré sous fausse identité dans un milieu criminel.",
  "Art. 286 CPP": "Conditions de l'investigation secrète (gravité, subsidiarité, proportionnalité).",
  "Art. 286 CPP — Conditions": "Conditions de l'investigation secrète : gravité de l'infraction, subsidiarité, proportionnalité.",
  "Art. 287 CPP": "Compétence et durée de l'investigation secrète (max 12 mois prolongeable).",
  "Art. 287 CPP — Compétence et durée (max 12 mois prolongeable)": "MP autorise, durée max 12 mois prolongeable par TMC.",
  "Art. 288 CPP": "Mission et formation de l'agent infiltré.",
  "Art. 288 CPP — Mission et formation de l'agent": "L'agent infiltré est formé, sa mission est précisément délimitée.",
  "Art. 289 CPP": "Témoignage de l'agent infiltré en procédure (anonymat possible).",
  "Art. 289 CPP — Témoignage en procédure": "L'agent infiltré peut témoigner avec mesures de protection (anonymat).",
  "Art. 29 Cst.": "Garanties générales de procédure (droit d'être entendu, jugement dans délai raisonnable).",
  "Art. 295 CPP": "Recherches secrètes : différent de l'investigation secrète, sans fausse identité.",
  "Art. 298 CPP": "Observation policière préventive (phase pré-procédurale).",
  "Art. 302 CPP": "Obligation de dénoncer pour les autorités (fonctionnaires).",
  "Art. 305ter CP": "Défaut de vigilance en matière d'opérations financières.",
  "Art. 31 CPP": "Compétence territoriale : lieu de commission de l'infraction.",
  "Art. 312 CP": "Abus d'autorité par fonctionnaire (ou pers. en charge tâche publique).",
  "Art. 318 CPP": "Clôture de l'instruction : non-lieu, mise en accusation, ordonnance pénale.",
  "Art. 322septies CP": "Corruption d'agents publics étrangers.",
  "Art. 322ter CP": "Corruption d'agents publics suisses.",
  "Art. 352 CPP": "Ordonnance pénale : peine pécuniaire ou TIG, contestable par opposition.",
  "Art. 36 Cst.": "Restrictions des droits fondamentaux : base légale, intérêt public, proportionnalité, noyau intangible.",
  "Art. 36 Cst. — Restriction des droits fondamentaux": "Toute restriction des droits fondamentaux doit reposer sur une base légale, un intérêt public, être proportionnée.",
  "Art. 393 CPP": "Recours : voie ordinaire contre les décisions du MP et TMC.",
  "Art. 422-426 CPP": "Frais de procédure : honoraires expertise, indemnité du conseil d'office.",
  "Art. 49 CP": "Concours d'infractions : aggravation au plus à la moitié maximum + cumul.",
  "Art. 56 CPP": "Récusation : motifs (intérêt personnel, parenté, etc.) pour magistrat ou expert.",
  "Art. 6 CEDH": "Droit à un procès équitable.",
  "Art. 6 CPP": "Maxime de l'instruction : autorités pénales recherchent d'office la vérité (faits à charge ET à décharge).",
  "Art. 7 Cst.": "Dignité humaine : doit être respectée et protégée.",
  "Art. 72 CPP": "Délégation des actes d'instruction : autorité requérante, autorité requise.",
  "Art. 73 CPP": "Confidentialité de la procédure : secret de l'instruction, sanctions en cas de fuite.",
  "Art. 73 CPP — Confidentialité de la procédure": "Secret de l'instruction : interdiction de divulguer les actes hors procédure.",
  "Art. 74 CPP": "Information du public : équilibre entre transparence et présomption d'innocence.",
  "Art. 75 CPP": "Obligations de discrétion : interdiction d'identifier les parties hors procédure.",
  "Art. 8 CEDH": "Droit au respect de la vie privée et familiale.",
  "Art. 8 Cst.": "Égalité juridique et interdiction de discrimination.",
  "Art. 9 CPP": "Maxime accusatoire : le tribunal n'est saisi que des faits décrits dans l'acte d'accusation.",
  "Art. 9 LBA — Obligation de communiquer (MROS)": "Communication obligatoire des intermédiaires financiers en cas de soupçons fondés (LBA art. 9).",
  "Autopsy": "Plateforme open-source d'investigation numérique (basée sur The Sleuth Kit).",
  "CCPF": "Commission consultative sur la sécurité préventive de la Confédération.",
  "CDF": "Contrôle fédéral des finances : audit indépendant des finances et de la performance.",
  "CEDH": "Convention européenne des droits de l'homme (1950) : socle européen des libertés fondamentales.",
  "CER": "Directive (UE) 2022/2557 sur la résilience des entités critiques (Critical Entities Resilience).",
  "CO": "Code des obligations (RS 220) : droit civil, contrats, responsabilité.",
  "CRA": "Cyber Resilience Act (UE 2024/2847) : exigences de cybersécurité pour les produits avec éléments numériques.",
  "Cellebrite": "Suite d'extraction et d'analyse mobile (UFED) : standard policier mondial.",
  "Censys": "Moteur de recherche similaire à Shodan, basé sur scans Internet quotidiens.",
  "Convention Lanzarote": "Convention du Conseil de l'Europe sur la protection des enfants contre l'exploitation et les abus sexuels (2007).",
  "Convention de Vienne": "Convention de Vienne sur les relations diplomatiques (1961) : immunités diplomatiques.",
  "CrEDH S. and Marper v. UK 2008": "Conservation des profils ADN : viole l'art. 8 CEDH si conservation indéfinie sans tri.",
  "CrEDH S. and Marper v. UK 2008 — Conservation des profils ADN": "La CrEDH a jugé contraire à l'art. 8 CEDH la conservation indéfinie de profils ADN.",
  "DORA": "Digital Operational Resilience Act (UE 2022/2554) : résilience numérique du secteur financier.",
  "Directive CER": "Directive (UE) 2022/2557 : résilience physique et cyber des entités critiques (énergie, eau, transports).",
  "Directive NIS2": "Directive (UE) 2022/2555, transposition par les États membres avant 17.10.2024.",
  "EIMP": "Loi fédérale sur l'entraide pénale internationale (RS 351.1) : régit les commissions rogatoires.",
  "ENISA": "Agence européenne de cybersécurité, basée à Athènes/Héraklion.",
  "ENTSO-E": "European Network of Transmission System Operators for Electricity : réseau européen des gestionnaires de transport.",
  "Egmont Group": "Réseau international de FIU (~170 pays), facilite l'échange d'informations entre FIU.",
  "Encase": "Suite forensique commerciale (OpenText/Guidance) : acquisition, analyse, rapports judiciaires.",
  "Eurojust": "Agence de coopération judiciaire pénale de l'UE (La Haye).",
  "Europol": "Office européen de police (La Haye), CH associée depuis 2004.",
  "FATF / GAFI": "Groupe d'action financière (Paris) : standards anti-blanchiment et anti-financement du terrorisme.",
  "FINMA": "Autorité fédérale de surveillance des marchés financiers (Berne).",
  "FIU": "Financial Intelligence Unit : cellule nationale de renseignement financier (MROS en CH).",
  "FTK": "Forensic Toolkit (AccessData/Exterro) : suite d'analyse forensique informatique.",
  "FedPol": "Office fédéral de la police (Berne) : police judiciaire fédérale, Interpol-Europol-MROS.",
  "FinCEN": "Financial Crimes Enforcement Network (USA) : bureau du Trésor US, FIU américaine.",
  "GovCERT": "GovCERT.ch : équipe de réponse aux incidents informatiques de la Confédération (intégrée à l'OFCS).",
  "GovCERT.ch": "Équipe nationale de réponse aux incidents cyber, rattachée à l'OFCS depuis 2024.",
  "GrayKey": "Outil d'extraction iOS (Grayshift) : déverrouillage de codes utilisateur.",
  "Hashcat": "Cracker de mots de passe haute performance (GPU).",
  "I2P": "Invisible Internet Project : réseau anonyme garlic-routing.",
  "ISO/IEC 27001": "Norme internationale pour les systèmes de management de la sécurité de l'information (SMSI).",
  "ISO/IEC 27041": "Assurance de l'adéquation et de la pertinence des méthodes d'investigation incident.",
  "ISO/IEC 27042": "Lignes directrices pour l'analyse et l'interprétation des preuves numériques.",
  "ISO/IEC 27043": "Principes et processus d'investigation des incidents.",
  "Interpol": "Organisation internationale de police criminelle (Lyon), 196 États membres.",
  "John the Ripper": "Cracker de mots de passe open-source (CPU/GPU).",
  "LADN": "Loi fédérale sur l'utilisation de profils d'ADN dans les procédures pénales (RS 363).",
  "LADN — Loi fédérale sur les profils d'ADN": "Loi fédérale sur l'utilisation de profils d'ADN en procédure pénale (RS 363).",
  "LBA": "Loi fédérale sur le blanchiment d'argent (RS 955.0) : intermédiaires financiers, vigilance, communication MROS.",
  "LBA Art. 9": "Obligation de communiquer au MROS en cas de soupçons fondés (devoir, pas droit).",
  "LBA art. 9 — Communication MROS": "Communication obligatoire des intermédiaires financiers en cas de soupçons fondés de blanchiment ou financement du terrorisme.",
  "LCR": "Loi fédérale sur la circulation routière (RS 741.01).",
  "LMSI": "Loi fédérale instituant des mesures visant au maintien de la sûreté intérieure (abrogée par LRens).",
  "LP": "Loi fédérale sur la poursuite pour dettes et la faillite (RS 281.1).",
  "LPD (ancienne)": "Ancienne LPD de 1992, abrogée le 01.09.2023 et remplacée par la LPD 2023 totalement révisée.",
  "LPD 2023": "Loi fédérale sur la protection des données (RS 235.1), version totalement révisée entrée en vigueur 01.09.2023.",
  "LPD 2023 Art. 19": "Information de la personne concernée lors de la collecte.",
  "LPD 2023 Art. 22": "Analyse d'impact (DPIA) : obligatoire si traitement à risque élevé.",
  "LPD 2023 Art. 25": "Droit d'accès de la personne concernée (sous 30 jours).",
  "LPD 2023 Art. 6": "Principes du traitement : licéité, finalité, proportionnalité, exactitude.",
  "LRens": "Loi sur le renseignement (RS 121) : encadre l'activité du SRC.",
  "LSCPT": "Loi fédérale sur la surveillance de la correspondance par poste et télécommunication (RS 780.1).",
  "LSI": "Loi fédérale sur la sécurité de l'information (RS 128.0, entrée en vigueur 2024).",
  "LSI Art. 74c": "Obligation de notification d'incidents cyber pour les exploitants d'infrastructures critiques (à l'OFCS).",
  "LStup": "Loi fédérale sur les stupéfiants (RS 812.121).",
  "Loi fédérale sur la sécurité de l'information (LSI, 2024)": "LSI : cadre fédéral pour la cybersécurité, oblige les opérateurs critiques à notifier les incidents à l'OFCS.",
  "MELANI": "Centrale d'enregistrement et d'analyse pour la sûreté de l'information (ancien nom de GovCERT/OFCS).",
  "MLAT CH-USA": "Traité d'entraide judiciaire entre la Suisse et les États-Unis (1973).",
  "Magnet Axiom": "Suite forensique multi-sources (mobile, PC, cloud).",
  "Maltego": "Outil OSINT de visualisation de graphes d'entités et leurs relations.",
  "NIS2": "Directive (UE) 2022/2555 sur la sécurité des réseaux et systèmes d'information : obligations cyber pour entités essentielles/importantes.",
  "NIST SP 800-184": "Guide pour la récupération après cyber-incident.",
  "NIST SP 800-86": "Guide forensique : 'Guide to Integrating Forensic Techniques into Incident Response'.",
  "OFAC": "Office of Foreign Assets Control (USA) : agence du Trésor US chargée des sanctions économiques.",
  "OFDF": "Office fédéral de la douane et de la sécurité des frontières (anciennement AFD).",
  "RTS / SSR": "Radio Télévision Suisse (RTS) / Société Suisse de Radiodiffusion (SSR) : service public audiovisuel.",
  "STIX/TAXII": "Standards d'échange d'indicateurs de menace (Structured Threat Information Expression / Trusted Automated Exchange).",
  "Shodan": "Moteur de recherche pour systèmes connectés (devices IoT, ICS, services exposés).",
  "Sleuth Kit": "Bibliothèque open-source d'analyse de systèmes de fichiers (TSK).",
  "Swissgrid": "Société nationale suisse pour l'exploitation du réseau électrique de transport (380/220 kV).",
  "TF 6B_1180/2023": "Jurisprudence récente sur l'application des règles cyber.",
  "TF 6B_157/2019": "Seuil de minimis : consommation personnelle stupéfiants (LStup).",
  "TF 6B_392/2018": "Conditions du dol éventuel art. 305bis CP (blanchiment).",
  "TRACFIN": "Traitement du renseignement et action contre les circuits financiers clandestins (FR) : FIU française.",
  "Tor": "The Onion Router : réseau anonymisant par routage en oignon.",
  "VPN": "Virtual Private Network : tunnel chiffré masquant l'IP source.",
  "Wireshark": "Analyseur de paquets réseau open-source : capture et inspection du trafic.",
  "art. 144bis CP (détérioration de données)": "Modification ou effacement illégitime de données électroniques (ransomware, sabotage).",
  "tcpdump": "Outil ligne de commande de capture de paquets réseau.",

  // ─── v2.62 batch 2 — EIMP, LB, conventions, normes ──────
  "ATF 142 IV 250": "Distinction données de connexion / contenu (art. 269 ss CPP).",
  "ATF 144 II 233": "Juridiction sur données dans le cloud : compétence territoriale extraterritoriale.",
  "Art. 10 LBA": "Interdiction d'aviser le client d'une communication MROS (tipping-off).",
  "Art. 10 LBA — Interdiction d'aviser le client": "Tipping-off interdit : l'intermédiaire ne peut pas avertir le client.",
  "Art. 117 CP": "Homicide par négligence : décès causé par négligence.",
  "Art. 117 CP — Homicide par négligence (en cas de décès dû à l'incident)": "Homicide par négligence (peine pécuniaire ou peine privative jusqu'à 3 ans).",
  "Art. 122 CP": "Lésions corporelles graves : atteinte sérieuse à l'intégrité physique.",
  "Art. 141 CPP (preuves illicites)": "Régime des preuves illicites en procédure pénale.",
  "Art. 179octies CP": "Mise sous écoute autorisée : exception au secret de la correspondance.",
  "Art. 179octies CP — Mise sous écoute": "Cadre légal des écoutes autorisées (différent de 179bis).",
  "Art. 181 CP": "Contrainte : forcer autrui à faire/ne pas faire/tolérer.",
  "Art. 181 CP — Contrainte": "Délit de contrainte : forcer autrui par violence ou menace.",
  "Art. 183 CP": "Séquestration et enlèvement : privation illégale de liberté.",
  "Art. 19 al. 2 DPMin": "Mesures pour mineurs/jeunes adultes 18-25 ans (placement spécifique).",
  "Art. 19 al. 2 DPMin — Mesures pour mineurs/jeunes adultes (18-25 ans)": "Régime particulier de mesures pour les jeunes adultes 18-25 ans.",
  "Art. 22 CP": "Tentative : début d'exécution sans achèvement.",
  "Art. 22 CPP": "Compétence cantonale (règle générale) : MP du canton où l'infraction a été commise.",
  "Art. 22 CPP — compétence cantonale (règle générale)": "Règle générale : MP cantonal compétent du lieu de commission.",
  "Art. 23 CPP": "Compétence fédérale : exceptions à la compétence cantonale.",
  "Art. 23 CPP — compétence fédérale (infractions fédérales)": "Compétence fédérale du MPC pour certaines infractions.",
  "Art. 24 CP": "Instigation : déterminer autrui à commettre une infraction.",
  "Art. 25 CP": "Complicité : aider intentionnellement un auteur.",
  "Art. 26 CP": "Concours de personnes : co-auteurs, instigateurs, complices.",
  "Art. 260quinquies CP": "Financement du terrorisme : peine privative jusqu'à 5 ans.",
  "Art. 260quinquies CP — Financement du terrorisme": "Financement du terrorisme : infraction autonome.",
  "Art. 260sexies CP": "Actes préparatoires délictueux (terrorisme).",
  "Art. 260sexies CP — Actes préparatoires délictueux (terrorisme)": "Actes préparatoires en matière terroriste : criminalisation anticipée.",
  "Art. 260ter CP": "Organisation criminelle : participation, soutien (terrorisme inclus).",
  "Art. 260ter CP — Organisation criminelle (incl. terroriste)": "Participation/soutien à organisation criminelle ou terroriste.",
  "Art. 276 CPP": "Information mutuelle entre autorités pénales (canton/MPC, etc.).",
  "Art. 276 CPP — Information mutuelle entre autorités": "Coordination entre autorités pénales suisses.",
  "Art. 28 CPP": "Jonction de procédures : poursuite groupée d'infractions liées.",
  "Art. 28 CPP — jonction de procédures": "Possibilité de joindre plusieurs procédures connexes.",
  "Art. 28b CC": "Protection de la personnalité contre la violence (mesures civiles).",
  "Art. 28b CC — Protection de la personnalité contre la violence": "Mesures civiles d'éloignement contre auteurs de violence.",
  "Art. 296-302 CP": "Crimes contre les États étrangers : neutralité, espionnage.",
  "Art. 296-302 CP — Crimes contre les États étrangers": "Régime des infractions contre la neutralité et les États étrangers.",
  "Art. 351 CP": "Service de renseignements politiques (en miroir avec art. 272).",
  "Art. 351 CP — Service de renseignements politiques (en miroir)": "Variante de l'art. 272 CP (espionnage politique).",
  "Art. 47 CP": "Fixation de la peine : critères (faute, antécédents, circonstances).",
  "Art. 47 LB": "Secret bancaire suisse : violation = peine privative jusqu'à 3 ans.",
  "Art. 47 LB — Secret bancaire suisse": "Article fondamental du secret bancaire en Suisse (LB = Loi sur les banques).",
  "Art. 50 CP": "Motivation de la peine : justification écrite obligatoire.",
  "Art. 61 LDA": "Violation du droit d'auteur à des fins commerciales (sanction pénale).",
  "Art. 61 LDA — Violation du droit d'auteur à des fins commerciales": "Sanction pénale aggravée pour violation du droit d'auteur à des fins lucratives.",
  "Art. 64 EIMP": "Mesures de contrainte en entraide : conditions, proportionnalité.",
  "Art. 64 EIMP — Mesures de contrainte (entraide)": "Cadre des mesures de contrainte exécutées en entraide pénale internationale.",
  "Art. 67 EIMP": "Principe de spécialité : les preuves transmises ne peuvent être utilisées que pour les infractions citées.",
  "Art. 67 EIMP — Principe de spécialité": "Limite l'usage des preuves transmises aux infractions visées par la commission rogatoire.",
  "Art. 72 CP": "Confiscation des valeurs patrimoniales d'une organisation criminelle.",
  "Art. 72 CP — Confiscation des valeurs patrimoniales": "Confiscation patrimoniale des valeurs d'une organisation criminelle (charge de la preuve renversée).",
  "Art. 75 EIMP": "Forme et contenu des demandes d'entraide : exigences formelles.",
  "Art. 75 EIMP — Forme et contenu des demandes": "Conditions formelles de validité d'une demande d'entraide.",
  "Art. 75 LD": "Infractions douanières : déclaration fausse ou incomplète.",
  "Art. 75 LD — Infractions douanières": "Régime pénal des infractions douanières (déclaration fausse/incomplète).",
  "Art. 75 LD — Infractions douanières : déclaration fausse ou incomplète": "Infraction de déclaration douanière mensongère.",
  "Art. 80a EIMP": "Décision de clôture : transmission effective des preuves à l'État requérant.",
  "Art. 80a EIMP — Décision de clôture": "Acte par lequel la Suisse remet finalement les preuves à l'État étranger.",
  "Art. 80b EIMP": "Recours contre la décision de clôture : 30 jours, effet suspensif.",
  "Art. 80c EIMP": "Procédure simplifiée : remise immédiate avec accord de l'intéressé.",
  "Art. 97 CO": "Responsabilité contractuelle pour inexécution.",
  "Art. 97 CO (responsabilité contractuelle)": "Responsabilité contractuelle pour inexécution ou exécution défectueuse.",
  "COBIT": "Control Objectives for Information Technology : référentiel de gouvernance IT (ISACA).",
  "COBIT 2019": "Version 2019 du référentiel COBIT.",
  "COBIT 2019 — Référentiel d'audit": "Référentiel ISACA de gouvernance IT (2019).",
  "CPP art. 24": "Compétence fédérale du MPC : crimes contre la Confédération, terrorisme, criminalité transfrontalière.",
  "CPP art. 24 — Compétence MPC": "Compétence fédérale du MPC sur certaines infractions (terrorisme, etc.).",
  "CPP art. 24 — Compétence MPC (terrorisme = compétence fédérale)": "Le terrorisme tombe automatiquement sous compétence MPC.",
  "CPP art. 269 ss": "Surveillance de la correspondance par télécommunication (art. 269-279).",
  "CPP art. 269 ss — Surveillance des télécommunications": "Régime de la surveillance des télécommunications en CH.",
  "CPP art. 269bis": "GovWare (chevaux de Troie d'État) : dispositifs techniques particuliers.",
  "CPP art. 269bis — GovWare (dispositifs techniques d'investigation)": "Cadre légal des chevaux de Troie d'État (GovWare) introduit en 2018.",
  "CPP art. 280": "Surveillance par dispositifs techniques : sons et images.",
  "CPP art. 280 — Surveillance par dispositifs techniques": "Surveillance audiovisuelle hors domaine privé sécurisé.",
  "CVE-2021-40539": "Vulnérabilité critique ManageEngine ADSelfService Plus (auth bypass + RCE), exploitée par APT.",
  "Code de procédure pénale art. 263": "Séquestre : voir Art. 263 CPP.",
  "Code de procédure pénale art. 263 — Séquestre": "Variation textuelle de l'art. 263 CPP (séquestre).",
  "Code des douanes UE": "Règlement (UE) 952/2013 : code des douanes de l'Union.",
  "Code des douanes UE — Bloc de fonds suspects": "Permet aux douanes UE de bloquer les fonds suspects en provenance/destination de pays sanctionnés.",
  "Communiqué CICR 19.01.2022": "Communiqué du CICR du 19.01.2022 (cyberattaque contre le CICR).",
  "Conv. Genève (droit humanitaire)": "Conventions de Genève (1949) : protection humanitaire en temps de conflit.",
  "Convention LCB-FT": "Convention de diligence des banques (CDB) : KYC, identification de l'ayant droit économique.",
  "Convention LCB-FT — Communication MROS": "Convention de diligence ASB : règles pratiques anti-blanchiment.",
  "Convention de Budapest (CETS 185)": "Convention sur la cybercriminalité (Conseil de l'Europe, 2001).",
  "Convention de Budapest (CETS 185) — Cybercriminalité": "Convention internationale sur la cybercriminalité (Budapest 2001).",
  "Convention de Budapest art. 29": "Conservation rapide de données stockées (preservation order).",
  "Convention de Budapest art. 29 — Conservation rapide des données": "Permet de demander la conservation rapide de données électroniques en attendant l'entraide.",
  "Convention de La Haye 1907": "Convention de La Haye sur la neutralité en cas de guerre.",
  "Convention de La Haye 1907 — Neutralité": "Définit les obligations des États neutres en temps de guerre.",
  "Convention de Schengen": "Convention d'application de l'accord de Schengen (1990) : frontières + coopération policière.",
  "Convention de Schengen — Coopération policière": "Cadre Schengen pour la coopération policière transfrontalière (SIS, art. 39-46 CAS).",
  "Convention européenne d'entraide judiciaire": "Convention européenne d'entraide judiciaire en matière pénale (Strasbourg 1959).",
  "Convention européenne d'entraide judiciaire (CEEJ)": "Convention de Strasbourg 1959 (CEEJ) : entraide pénale européenne.",
  "Convention européenne d'entraide judiciaire (CEEJ) art. 1": "Champ d'application de la CEEJ : entraide la plus large possible.",
  "Convention européenne d'entraide judiciaire en matière pénale (1959)": "Convention de Strasbourg : socle de l'entraide pénale en Europe.",
  "Cst. art. 173 al. 1 let. a": "Compétence du Parlement en matière de relations extérieures.",
  "Cst. art. 173 al. 1 let. a — Compétence en relations extérieures": "L'Assemblée fédérale traite les questions de politique extérieure.",
  "CyberStratVS": "Stratégie cyber du canton du Valais (mesures M1 à M3 inclus M3.2c).",
  "CyberStratVS mesure M3.2c": "Mesure spécifique de la stratégie cyber valaisanne.",
  "DPMin": "Loi fédérale régissant la condition pénale des mineurs (RS 311.1).",
  "Doctrine ATF 142 IV 250": "Jurisprudence sur la distinction données de connexion (métadonnées) vs contenu.",
  "Doctrine ATF 142 IV 250 — Distinction données de connexion / contenu": "Précise la frontière entre métadonnées (art. 273) et contenu (art. 269).",
  "Doctrine ATF 144 II 233 — Juridiction sur données dans le cloud": "Précise la compétence des autorités CH sur des données stockées hors CH.",
  "Doctrine OFSP 2024": "Doctrine OFSP 2024 sur la cybersécurité hospitalière.",
  "Doctrine OFSP 2024 — Cybersécurité hospitalière": "Doctrine 2024 de l'Office fédéral de la santé publique sur la sécurité IT des hôpitaux.",
  "Doctrine TF 6B_2024/X": "Jurisprudence récente sur le stalking par objet connecté (à confirmer).",
  "Doctrine TF 6B_2024/X — Stalking par objet connecté": "Jurisprudence émergente sur l'usage d'objets connectés dans les violences conjugales.",
  "ISAE 3402": "Norme internationale d'audit pour les contrôles internes des prestataires de services.",
  "ISAE 3402 Type 2 / SOC 2": "Audits de contrôle interne (Type 2 = effectivité sur période ; SOC 2 = sécurité, dispo, confidentialité).",
  "LAVI": "Loi fédérale sur l'aide aux victimes (RS 312.5) : conseil, indemnisation, accompagnement.",
  "LAVI — Loi sur l'aide aux victimes": "Cadre fédéral d'aide aux victimes d'infractions (centres LAVI cantonaux).",
  "LD": "Loi sur les douanes (RS 631.0).",
  "LDA": "Loi fédérale sur le droit d'auteur (RS 231.1).",
  "LIE": "Loi sur l'information et la sécurité (infrastructures critiques) — non standard, libellé corpus.",
  "LIE — Loi sur l'information et la sécurité (infrastructure critique)": "Cadre fédéral sur la sécurité de l'information dans les infrastructures critiques.",
  "LSFin": "Loi sur les services financiers (RS 950.1) : protection des investisseurs, devoir d'information.",
  "Loi al-Qaïda / EI": "Loi fédérale interdisant les groupes 'Al-Qaïda', 'État islamique' et organisations apparentées (RS 122).",
  "Loi al-Qaïda / EI (RS 122)": "Loi fédérale interdisant Al-Qaïda et État islamique (compétence MPC pour les infractions).",
  "Loi al-Qaïda / EI (RS 122) — interdiction et procédure": "Loi fédérale d'interdiction Al-Qaïda/EI : procédure pénale spécifique (compétence MPC).",
  "Loi sur les services financiers (LSFin)": "Loi fédérale sur les services financiers (RS 950.1).",
  "Loi sur les services financiers (LSFin) — Mise en garde devoir d'information": "Devoirs d'information et de mise en garde des prestataires financiers (LSFin).",
  "Recommandations GAFI": "40 recommandations du GAFI : standards anti-blanchiment et anti-financement du terrorisme.",
  "Recommandations GAFI 24 et 25": "Transparence des personnes morales et fiduciaires (bénéficiaire effectif).",
  "Recommandations GAFI 24 et 25 — Transparence des personnes morales et fiduciaires": "Standards GAFI sur la transparence des bénéficiaires effectifs.",
  "Règlement EUROPOL": "Règlement (UE) 2016/794 sur Europol.",
  "Règlement EUROPOL 2016/794": "Règlement (UE) 2016/794 sur Europol et la coopération policière.",
  "Règlement UE ICS2": "Système d'information préalable sur les envois (Import Control System 2).",
  "Règlement UE ICS2 — Système d'information préalable sur les envois": "Système douanier UE de pré-déclaration des marchandises entrant en UE.",
  "SOC 2": "Service Organization Control 2 : audit AICPA sur sécurité, disponibilité, confidentialité, intégrité.",
  "Traité MLAT Suisse-USA (1973)": "Traité d'entraide judiciaire CH-USA (1973) : voie privilégiée mais avec restrictions.",
  "art. 122 CP (lésions corporelles graves)": "Lésions corporelles graves : atteintes sérieuses à l'intégrité physique.",
  "art. 141 CPP (preuves illicites)": "Régime des preuves illicites en procédure pénale.",
  "art. 173-174 CP (atteinte à l'honneur)": "Diffamation, calomnie (Art. 173-178 CP).",
  "art. 181 CP (contrainte)": "Délit de contrainte (Art. 181 CP).",
  "art. 183 CP (séquestration)": "Séquestration : privation illégale de la liberté.",
  "art. 187 CP (actes d'ordre sexuel avec enfants)": "Actes sexuels avec mineur de moins de 16 ans (Art. 187 CP).",
  "art. 197 CP (pornographie, y compris simulée par adulte)": "Pornographie, y compris contenus simulant des mineurs (Art. 197 CP).",
  "art. 198 CP (désagréments d'ordre sexuel) — distinct du 198 français": "Délits de désagréments sexuels (variation suisse).",
  "nLPD": "Nouvelle LPD (RS 235.1) : version 2023, totalement révisée.",
  "nLPD art. 24": "Annonce des violations de sécurité au PFPDT (équivalent art. 24 LPD 2023).",
  "nLPD art. 24 — Annonce des violations de la sécurité des données": "Notification obligatoire au PFPDT en cas de fuite de données à risque élevé.",
};

// ═══════════════════════════════════════════════════
// GRADES legacy : SUPPRIMÉ en v2.55 (volet N — nettoyage)
//
// Ancien système hérité du moteur quiz (table de 8 paliers : Stagiaire,
// Inspecteur, Enquêteur Spécialisé, Expert Forensique, Juge d'Instruction,
// Procureur Fédéral, Procureur d'Élite, Procureur Européen).
//
// Aujourd'hui remplacé partout par window.Profile.getRank() + getTrackLadder()
// (système v3 unifié, 12 rangs par track choisi par l'utilisateur).
//
// Si Profile est indisponible (cas dégradé hors PWA) on utilise un mini
// fallback minimaliste qui ne fait que renvoyer le titre "Stagiaire" pour
// éviter un crash. La logique métier réelle passe systématiquement par
// Profile dans tous les call-sites.
// ═══════════════════════════════════════════════════
function getGradeFallback() {
  return { min: 0, title: 'Stagiaire', icon: '🎓', sub: 'Profil non disponible', index: 0, next: null };
}

function getXP() {
  return lsGet('cas_xp', 0);
}

function addXP(amount, tags) {
  const prev = getXP();
  // Préfère la voie directe Profile.addXp (qui applique le bonus thématique
  // selon le rôle actif si tags fournis). Sinon fallback legacy via cas_xp.
  let gained = amount;
  let bonus = 0;
  let multiplier = 1.0;
  let profileApplied = false;
  if (window.Profile && typeof window.Profile.addXp === 'function' && Array.isArray(tags)) {
    const r = window.Profile.addXp(amount, 'scene', { tags });
    if (r) {
      gained = r.gained;
      bonus = r.bonus || 0;
      multiplier = r.multiplier || 1.0;
      profileApplied = true;
    }
  }
  const next = Math.max(0, prev + gained);

  // Si Profile.addXp a déjà été appelé, le bridge va re-intercepter
  // l'écriture de 'cas_xp' et ajouter encore le delta → double comptage.
  // Pour l'éviter on positionne un flag que le bridge sait reconnaître.
  if (profileApplied) {
    try { window.__casInProfileApplied = true; } catch {}
  }
  lsSet('cas_xp', next);
  if (profileApplied) {
    try { window.__casInProfileApplied = false; } catch {}
  }

  // Rank-up via Profile (échelle v3 lissée, 12 rangs par track).
  // En v2.55 : suppression du fallback GRADES legacy. Si Profile est
  // indisponible (cas très dégradé), on saute la détection rank-up
  // (l'animation NEW RANK ne s'affichera juste pas).
  let gradeUp = false;
  let gradeUpName = '';
  if (window.Profile && typeof window.Profile.getRank === 'function') {
    const ladder = window.Profile.getTrackLadder
      ? window.Profile.getTrackLadder()
      : null;
    if (ladder && ladder.length) {
      const findIdx = xp => {
        let idx = 0;
        for (let i = ladder.length - 1; i >= 0; i--) {
          if (xp >= ladder[i].min) { idx = i; break; }
        }
        return idx;
      };
      const prevIdx = findIdx(prev);
      const nextIdx = findIdx(next);
      gradeUp = nextIdx > prevIdx;
      gradeUpName = ladder[nextIdx].name;
    }
  }

  return { prev, next, gradeUp, gradeUpName, base: amount, gained, bonus, multiplier };
}

function updateGradeDisplay() {
  const xp = getXP();

  // ───────────────────────────────────────────────────────────
  // v2.10+ : Profile.getRank (système unifié, échelle v3 lissée,
  // 12 rangs par track choisi par l'utilisateur).
  // v2.55 : suppression du fallback GRADES legacy. Si Profile est
  // indisponible, on garde le mini-fallback Stagiaire pour ne pas crasher.
  // ───────────────────────────────────────────────────────────
  let icon, title, sub, minXp, nextMin, nextLabel;
  if (window.Profile && typeof window.Profile.getRank === 'function') {
    const rank = window.Profile.getRank();
    icon       = rank.emoji;
    title      = rank.name;
    sub        = rank.flavor || rank.trackLabel || '';
    minXp      = rank.min;
    nextMin    = rank.next ? rank.next.min : null;
    nextLabel  = rank.next ? rank.next.name : null;
  } else {
    const grade = getGradeFallback();
    icon       = grade.icon;
    title      = grade.title;
    sub        = grade.sub;
    minXp      = grade.min;
    nextMin    = null;
    nextLabel  = null;
  }

  // Phase 2 v2.10 : grade-mini retiré du header (info redondante avec profile-banner).
  // On garde les call-sites mais on guard chaque accès DOM.
  // Header mini (peut être absent depuis Phase 2)
  const miniIcon = document.getElementById('grade-mini-icon');
  if (miniIcon) miniIcon.textContent = icon;
  const miniTitle = document.getElementById('grade-mini-title');
  if (miniTitle) miniTitle.textContent = title;
  const miniXp = document.getElementById('grade-mini-xp');
  if (miniXp) miniXp.textContent = xp + ' XP';

  // Lobby card (toujours présente)
  const cardIcon = document.getElementById('grade-card-icon');
  if (cardIcon) cardIcon.textContent = icon;
  const cardTitle = document.getElementById('grade-card-title');
  if (cardTitle) cardTitle.textContent = title;
  const cardSub = document.getElementById('grade-card-subtitle');
  if (cardSub) cardSub.textContent = sub;

  const progXp = document.getElementById('grade-progress-xp');
  const progNext = document.getElementById('grade-progress-next');
  const progFill = document.getElementById('grade-progress-fill');
  if (nextMin != null) {
    const range = nextMin - minXp;
    const progress = xp - minXp;
    const pct = Math.min(100, Math.max(0, (progress / range) * 100));
    if (progXp) progXp.textContent = `${xp} / ${nextMin} XP`;
    if (progNext) progNext.textContent = `→ ${nextLabel}`;
    if (progFill) progFill.style.width = pct + '%';
  } else {
    if (progXp) progXp.textContent = `${xp} XP — RANG MAX`;
    if (progNext) progNext.textContent = '★ Légende du domaine ★';
    if (progFill) progFill.style.width = '100%';
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
  // ═══════════════════════════════════════════════════
  // BADGES v2.26 — spécialités cantonales + PNJ + thèmes techniques
  // (s'appuient sur scene_results, npcs.json, et les tags de scènes)
  // ═══════════════════════════════════════════════════
  { id: "fr_detective",   icon: "🧀", title: "Détective fribourgeois",  desc: "3 scénarios fribourgeois complétés ≥80%",      check: (s) => (s.canton80['FR'] || 0) >= 3 },
  { id: "ti_sherlock",    icon: "🇮🇹", title: "Sherlock du Tessin",      desc: "3 scénarios tessinois complétés ≥80%",         check: (s) => (s.canton80['TI'] || 0) >= 3 },
  { id: "vd_procureur",   icon: "⚖️", title: "Procureur vaudois",       desc: "5 scénarios vaudois complétés ≥80%",           check: (s) => (s.canton80['VD'] || 0) >= 5 },
  { id: "apple_forensic", icon: "🍎", title: "Forensicien Apple",       desc: "3 scénarios AFU/BFU iPhone-MacBook ≥80%",      check: (s) => s.apple_forensic_wins >= 3 },
  { id: "anti_deepfake",  icon: "🎭", title: "Anti-deepfake",           desc: "Scénario deepfake résolu à ≥90%",              check: (s) => s.deepfake_excellence >= 1 },
  { id: "npc_collector",  icon: "👥", title: "Tour des protagonistes",  desc: "Rencontrer ≥8 PNJ différents dans les scènes", check: (s) => s.npcs_met >= 8 },
  // ═══════════════════════════════════════════════════
  // BADGES v2.56 (EXTEND) — first-clear bonus + mastery par scène
  // ═══════════════════════════════════════════════════
  { id: "pioneer_25",     icon: "🌟", title: "Pionnier·ère",        desc: "25 scénarios découverts (first-clear ≥60%)", check: (s) => s.first_clears >= 25 },
  { id: "pioneer_50",     icon: "✨", title: "Explorateur·rice",    desc: "50 scénarios découverts (first-clear ≥60%)", check: (s) => s.first_clears >= 50 },
  { id: "mastery_bronze", icon: "🥉", title: "Apprenti·e des scènes", desc: "5 scénarios 'Touchés' (≥60%)",              check: (s) => s.mastery_touched >= 5 },
  { id: "mastery_silver", icon: "🥈", title: "Médaille d'argent",   desc: "10 scénarios 'Réussis' (≥80%)",              check: (s) => s.mastery_cleared >= 10 },
  { id: "mastery_gold",   icon: "🥇", title: "Médaille d'or",       desc: "5 scénarios 'Maîtrisés' (3 runs ≥80% sur 2 modes)", check: (s) => s.mastery_mastered >= 5 },
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

  // v2.26 : métriques pour les badges spécialités cantonales + PNJ + thèmes
  // canton80[CANTON] = nombre de scènes de ce canton complétées à ≥80%
  snap.canton80 = {};
  if (typeof CANTON_DATA !== 'undefined') {
    Object.entries(CANTON_DATA).forEach(([code, canton]) => {
      let n = 0;
      canton.scenarios.forEach(sid => {
        const r = results[sid];
        if (r && r.pct >= 80) n++;
      });
      snap.canton80[code] = n;
    });
  }

  // apple_forensic_wins : scènes EPFL (AFU/BFU MacBook) ou Lugano (iPhone) à ≥80%
  // — on utilise une heuristique sur les tags/IDs car aucun champ explicite
  const APPLE_SCENES = ['epfl-laboratoire-ia-medicale-chine', 'lugano-dpfl-mafia-finance'];
  snap.apple_forensic_wins = APPLE_SCENES.filter(sid =>
    results[sid] && results[sid].pct >= 80
  ).length;

  // deepfake_excellence : scène HCFR deepfake résolue à ≥90%
  const r_hcfr = results['hcfr-bec-transfer-deepfake'];
  snap.deepfake_excellence = (r_hcfr && r_hcfr.pct >= 90) ? 1 : 0;

  // npcs_met : compteur cumulé de PNJ rencontrés (alimenté à chaque scène
  // ouverte par le bridge scene-npcs ; lu depuis localStorage 'cas_npcs_met').
  // Set unique stocké en JSON. Fallback 0 si jamais initialisé.
  const npcsMetSet = lsGet('cas_npcs_met', []);
  snap.npcs_met = Array.isArray(npcsMetSet) ? npcsMetSet.length : 0;

  // v2.56 (EXTEND) : compteurs first-clears + mastery
  // first_clears : taille du Set 'cas_first_clears' (sceneIds first-cleared)
  const firstClearsList = lsGet('cas_first_clears', []);
  snap.first_clears = Array.isArray(firstClearsList) ? firstClearsList.length : 0;

  // mastery_* : compteurs par tier (touched / cleared / mastered)
  // Calcul lazy : si window.Mastery est dispo on l'utilise, sinon 0.
  if (window.Mastery && typeof window.Mastery.getStats === 'function') {
    const m = window.Mastery.getStats();
    snap.mastery_touched  = m.touched  || 0;
    snap.mastery_cleared  = m.cleared  || 0;
    snap.mastery_mastered = m.mastered || 0;
  } else {
    snap.mastery_touched = snap.mastery_cleared = snap.mastery_mastered = 0;
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

// v2.62 — Cache des clés normalisées pour matching tolérant
let _glossNormalized = null;
function _normalizeForMatch(s) {
  return String(s).toLowerCase()
    .replace(/[—–-]/g, ' ')             // Tirets longs/courts → espace
    .replace(/\s+/g, ' ')                // Espaces multiples → 1
    .trim();
}
function _ensureGlossNormalized() {
  if (_glossNormalized) return _glossNormalized;
  _glossNormalized = Object.keys(GLOSSARY).map(k => ({
    key: k,
    norm: _normalizeForMatch(k),
  }));
  // Trier par longueur décroissante : matches plus spécifiques d'abord
  _glossNormalized.sort((a, b) => b.norm.length - a.norm.length);
  return _glossNormalized;
}

function findGlossaryMatch(term) {
  if (!term) return null;
  // 1. Match exact (le plus rapide)
  if (GLOSSARY[term]) return { key: term, def: GLOSSARY[term] };

  // 2. Match normalisé (case + tirets + espaces)
  const termNorm = _normalizeForMatch(term);
  const candidates = _ensureGlossNormalized();

  // 2a. Match exact normalisé
  for (const { key, norm } of candidates) {
    if (norm === termNorm) return { key, def: GLOSSARY[key] };
  }

  // 2b. Match prefix normalisé (clé contenue au début)
  for (const { key, norm } of candidates) {
    if (norm.length >= 4 && termNorm.startsWith(norm + ' ')) {
      return { key, def: GLOSSARY[key] };
    }
  }

  // 2c. Match contenu normalisé (clé citée dans le terme, avec word boundary)
  for (const { key, norm } of candidates) {
    if (norm.length >= 5 && termNorm.includes(norm)) {
      return { key, def: GLOSSARY[key] };
    }
  }

  // 3. Fallback "famille de loi" (v2.62) :
  // Si le terme a la forme "Art. X LOI" ou "LOI art. X" et qu'on connaît
  // la LOI, on retourne au moins une définition générique de la loi.
  // Évite les "ref-tag" muettes pour le candidat.
  const lawFamilyMap = {
    'CPP': 'Code de procédure pénale (RS 312.0) — règles uniformes de procédure pénale en CH.',
    'CP': 'Code pénal suisse (RS 311.0) — sanctions et infractions.',
    'CO': 'Code des obligations (RS 220) — droit civil, contrats, responsabilité.',
    'CC': 'Code civil suisse (RS 210) — droit des personnes, famille, successions, biens.',
    'LBA': 'Loi sur le blanchiment d\'argent (RS 955.0) — lutte anti-blanchiment.',
    'LB': 'Loi sur les banques (RS 952.0) — secret bancaire, surveillance des banques.',
    'LPD': 'Loi sur la protection des données (RS 235.1) — version 2023 totalement révisée.',
    'EIMP': 'Loi fédérale sur l\'entraide pénale internationale (RS 351.1).',
    'LSI': 'Loi sur la sécurité de l\'information (RS 128.0, 2024) — cybersécurité publique.',
    'LStup': 'Loi sur les stupéfiants (RS 812.121).',
    'LCR': 'Loi sur la circulation routière (RS 741.01).',
    'LDA': 'Loi sur le droit d\'auteur (RS 231.1).',
    'LD': 'Loi sur les douanes (RS 631.0).',
    'LSCPT': 'Loi sur la surveillance de la correspondance par poste et télécom (RS 780.1).',
    'LRens': 'Loi sur le renseignement (RS 121).',
    'LSFin': 'Loi sur les services financiers (RS 950.1).',
    'LADN': 'Loi sur les profils d\'ADN dans les procédures pénales (RS 363).',
    'LAVI': 'Loi sur l\'aide aux victimes (RS 312.5).',
    'DPMin': 'Droit pénal des mineurs (RS 311.1).',
    'Cst.': 'Constitution fédérale de la Confédération suisse (RS 101).',
  };
  // Pattern : "Art. X LAW" ou "LAW art. X" ou "Art. X LAW — texte"
  const lawPattern = /\b(CPP|CP|CO|CC|LBA|LB|LPD|EIMP|LSI|LStup|LCR|LDA|LD|LSCPT|LRens|LSFin|LADN|LAVI|DPMin|Cst\.)\b/;
  const lm = term.match(lawPattern);
  if (lm && lawFamilyMap[lm[1]]) {
    return {
      key: lm[1] + ' (loi)',
      def: lawFamilyMap[lm[1]] + ' (Article spécifique non détaillé dans le glossaire actuel.)',
    };
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
    // v2.60 — data-canton pour filtre cantonal dans le lobby
    if (scene.regionDetail && scene.regionDetail.code) {
      card.dataset.canton = scene.regionDetail.code;
    }

    const statusHTML = res
      ? `<span class="scene-status done" style="color:${getScoreColor(res.pct)}">✓ ${res.pct}%</span>`
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
          return `<span class="scene-lb-pill ${cls}" title="Top ${j+1}" style="color:${getScoreColor(r.pct)}">#${j+1} · ${r.pct}%</span>`;
        }).join('')}
      </div>
    ` : '';

    const notesIndicator = notes[scene.id] ? '<span class="scene-notes-indicator" title="Notes personnelles">📝</span>' : '';
    const euTag = isEU ? '<span class="scene-eu-tag">🇪🇺 EU</span>' : '';
    // v2.56 (EXTEND) : Médaille Mastery (🥉/🥈/🥇) sur la card si score atteint
    let masteryMedal = '';
    if (window.Mastery && typeof window.Mastery.getMedal === 'function') {
      const medal = window.Mastery.getMedal(scene.id);
      if (medal) {
        const tier = window.Mastery.getTier(scene.id);
        const tierLabel = tier === 'mastered' ? 'Maîtrisée'
                        : tier === 'cleared' ? 'Réussie'
                        : 'Touchée';
        masteryMedal = `<span class="scene-mastery-medal mastery-${tier}" title="Scène ${tierLabel}">${medal}</span>`;
      }
    }

    card.innerHTML = `
      ${notesIndicator}
      ${masteryMedal}
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

    ${(function(scene) {
      // v2.71 — Bandeau "Relations PNJ" : affiche l'état actuel des PNJ
      // déjà rencontrés dans cette scène (trust, état, dernière interaction)
      if (!window.NpcState || !scene.npcs || scene.npcs.length === 0) return '';
      if (typeof window.NPC_DATA === 'undefined') return '';

      const known = [];
      scene.npcs.forEach(n => {
        const nid = typeof n === 'string' ? n : n.id;
        if (!nid) return;
        const state = window.NpcState.get(nid);
        if (!state || !state.interactions || state.interactions.length === 0) return;
        const npcInfo = window.NPC_DATA[nid];
        if (!npcInfo) return;
        known.push({
          id: nid,
          name: npcInfo.name || nid,
          icon: npcInfo.icon || '👤',
          trust: state.trust,
          state: state.state,
          interactions: state.interactions,
        });
      });

      if (known.length === 0) return '';

      const items = known.map(k => {
        const last = k.interactions[k.interactions.length - 1];
        const lastSceneLabel = last && last.scene ? last.scene.replace(/-/g, ' ') : '?';
        const stateColor = k.state === 'hostile' ? '#dc3c46' :
                           k.state === 'méfiant' ? '#e68232' :
                           k.state === 'professionnel' ? '#a8b0c0' : '#32b464';
        return `
          <div class="npc-relation-item">
            <span class="npc-relation-icon">${k.icon}</span>
            <div class="npc-relation-body">
              <div class="npc-relation-name">${k.name}</div>
              <div class="npc-relation-state" style="color:${stateColor}">
                ${window.NpcState.stateLabel(k.state)} · trust ${k.trust}/100
              </div>
              <div class="npc-relation-history">
                ${k.interactions.length} interaction${k.interactions.length > 1 ? 's' : ''}
              </div>
            </div>
            ${window.NpcState.trustBar(k.trust, 80)}
          </div>`;
      }).join('');

      return `
        <div class="npc-relations-banner">
          <div class="npc-relations-banner-title">🤝 Relations connues sur cette affaire</div>
          ${items}
        </div>`;
    })(scene)}

    <div class="alert-box">
      <strong>⚠ ${scene.alertLevel || 'ATTENTION'}</strong>
      Chaque décision est irréversible. Les erreurs critiques réduisent l'intégrité de la chaîne de custody.
    </div>

    ${(function(intro) {
      // v2.62 — Intros longues (>800 chars) repliées par défaut sur mobile.
      // Le contenu n'est PAS tronqué, juste replié visuellement avec un
      // teaser de la première phrase, et un bouton "Voir le contexte complet".
      if (!intro) return '';
      const length = intro.length;
      if (length <= 800) {
        return `<div class="context-text">${intro}</div>`;
      }
      // Pour les longs : extraire un teaser propre (1ère phrase ou ~250 chars
      // jusqu'à un point d'arrêt naturel)
      let teaserEnd = intro.indexOf('. ', 200);
      if (teaserEnd === -1 || teaserEnd > 350) teaserEnd = 280;
      else teaserEnd += 1; // inclure le point
      const teaser = intro.substring(0, teaserEnd);
      const rest = intro.substring(teaserEnd);
      return `<div class="context-text context-text--collapsible" data-collapsed="1">
        <div class="context-teaser">${teaser}</div>
        <div class="context-rest" hidden>${rest}</div>
        <button type="button" class="context-toggle"
                onclick="(function(b){
                  const w = b.parentNode;
                  const rest = w.querySelector('.context-rest');
                  const collapsed = w.dataset.collapsed === '1';
                  if (collapsed) {
                    rest.hidden = false;
                    w.dataset.collapsed = '0';
                    b.textContent = '↑ Replier le contexte';
                  } else {
                    rest.hidden = true;
                    w.dataset.collapsed = '1';
                    b.textContent = '↓ Voir le contexte complet (${length - teaserEnd} caractères)';
                  }
                })(this)">↓ Voir le contexte complet (${length - teaserEnd} caractères)</button>
      </div>`;
    })(scene.intro || '')}

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

  // ─── v2.26 : Hook panneau "Acteurs en présence" (scene-npcs.js) ───
  // Idempotent + non-bloquant : si le composant n'est pas chargé ou
  // si la scène n'a pas de champ `npcs`, rien ne s'affiche.
  if (window.SceneNPCs && typeof window.SceneNPCs.injectInBriefing === 'function') {
    setTimeout(() => {
      try { window.SceneNPCs.injectInBriefing(scene); } catch (_) {}
    }, 0);
  }
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

        // v2.71 — Support des variantes texte selon état des PNJ de la scène
        // Format scène : choice.text_variants = { complice: "...", méfiant: "...", ... }
        // Si tous les PNJ partagent un état, on utilise la variante. Sinon → text par défaut.
        let displayText = c.text;
        if (c.text_variants && window.NpcState && scene.npcs && scene.npcs.length > 0) {
          const npcIds = scene.npcs.map(n => typeof n === 'string' ? n : (n && n.id)).filter(Boolean);
          const states = npcIds.map(id => window.NpcState.getState(id)).filter(Boolean);
          if (states.length > 0) {
            // Si tous les PNJ partagent le même état, on utilise la variante
            const uniformState = states.every(s => s === states[0]) ? states[0] : null;
            if (uniformState && c.text_variants[uniformState]) {
              displayText = c.text_variants[uniformState];
            }
          }
        }

        return `
          <button class="choice-btn${eliminated ? ' eliminated' : ''}" data-orig-idx="${origIdx}" onclick="selectChoice(${origIdx}, this)"${eliminated ? ' disabled style="opacity:.3;text-decoration:line-through"' : ''}>
            <span class="choice-letter" title="Raccourci clavier : ${L[newIdx]}">${L[newIdx]}<span class="choice-kbd">${L[newIdx]}</span></span>
            <span>${displayText}</span>
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

  // ─── v2.56 (EXTEND) : First-clear bonus +20 XP ───
  // Premier passage d'une scène à ≥60% → bonus +20 XP. Tracké via
  // 'cas_first_clears' (set des sceneIds first-cleared).
  let firstClearBonus = 0;
  if (pct >= 60) {
    const fcSet = new Set(lsGet('cas_first_clears', []) || []);
    if (!fcSet.has(scene.id)) {
      fcSet.add(scene.id);
      lsSet('cas_first_clears', [...fcSet]);
      firstClearBonus = 20;
    }
  }

  // Save XP — passe les tags de la scène pour activer le bonus thématique
  // (Profile.addXp applique +20% si un tag matche le rôle choisi)
  const xpResult = addXP(xpGained, scene.tags || []);
  if (firstClearBonus > 0) {
    addXP(firstClearBonus); // pas de tags ici : c'est un bonus exploration neutre
    // Celebration différée (pour éviter de stacker sur d'autres celebrations)
    setTimeout(() => {
      if (window.Celebration && typeof window.Celebration.show === 'function') {
        window.Celebration.show({
          icon: '🌟',
          title: 'Première fois !',
          subtitle: 'Tu as découvert ' + scene.title,
          xp: firstClearBonus,
        });
      }
    }, 600);
  }

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

  // ─── v2.55 (volet G) : Run buffer pour le système Quests ───
  // On stocke un journal des runs des 7 derniers jours pour permettre aux
  // quêtes journalières d'évaluer leurs conditions (firstAttempt, improvedScore,
  // hadCriticalError, mode procureur, tags, EU, ts pour 'session intensive').
  // Le buffer est rotatif (cap 50 entrées) pour rester léger.
  try {
    const runBuffer = lsGet('cas_run_buffer', []);
    const wasFirstAttempt = !prev;
    const improvedScore = !!(prev && pct > prev.pct);
    runBuffer.push({
      sceneId: scene.id,
      pct,
      custodyPct,
      score,
      mode: G.mode,
      difficulty: scene.difficulty,
      tags: scene.tags || [],
      isEU: scene.region === 'EU',
      hadCriticalError: !!G.hadCriticalError,
      firstAttempt: wasFirstAttempt,
      improvedScore,
      ts: Date.now(),
      dateISO: new Date().toISOString().slice(0, 10),
    });
    // Rotation : garder 50 derniers max
    while (runBuffer.length > 50) runBuffer.shift();
    lsSet('cas_run_buffer', runBuffer);
  } catch (_) {}

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
  let outcome = 'failure';  // v2.71 — Default outcome
  if (scene.narrative) {
    if (pct >= 75 && custodyPct >= 75) {
      narrative = scene.narrative.success;
      outcome = 'success';
    }
    else if (pct >= 50) {
      narrative = scene.narrative.degraded;
      outcome = 'degraded';
    }
    else {
      narrative = scene.narrative.failure;
      outcome = 'failure';
    }
  }

  // v2.71 — Mise à jour de l'état des PNJ liés à cette scène
  // Trust ajusté selon outcome ; criticalChoiceFailed le pénalise davantage.
  if (window.NpcState && scene.npcs && scene.npcs.length > 0) {
    const npcIds = scene.npcs.map(n => typeof n === 'string' ? n : (n && n.id))
                              .filter(Boolean);
    // criticalFailed (raté un choix avec critical:true) → pénalité supplémentaire
    const finalOutcome = (typeof G !== 'undefined' && G.criticalFailed) ? 'critical' : outcome;
    try {
      window.NpcState.recordInteraction(npcIds, scene.id, finalOutcome);
    } catch (e) {
      console.warn('NpcState.recordInteraction failed:', e);
    }
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

  // Score ring — palette 5 paliers (rouge foncé / orange / vert clair / vert moyen / vert vif)
  const radius = 42, circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;
  const ringColor = getScoreColor(pct);
  const titleColor = ringColor; // titre du rapport aligné sur la même palette

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
    <span class="xp-gained-new-grade">🎖 Nouveau rang débloqué : <strong>${xpResult.gradeUpName}</strong></span>
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
            <span class="report-lb-score" style="color:${getScoreColor(r.pct)}">${r.pct}%</span>
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

  // Compute next scenario suggestions for "continue" section (v2.60)
  // Stratégie : 3 cartes ciblées par tag overlap + état joueur
  const nextSuggestions = computeNextStepSuggestions(scene);
  const hasNextScene = nextSuggestions.length > 0;

  document.getElementById('report-content').innerHTML = `
    <div class="report-header">
      <div class="report-badge">${badge.icon}</div>
      <div class="report-title" style="color:${titleColor}">${badge.title}</div>
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
      <span class="xp-gained-text">+${xpResult.gained != null ? xpResult.gained : xpGained} XP</span>
      ${(xpResult.multiplier && xpResult.multiplier > 1) ? `<span class="xp-gained-role-bonus" title="Bonus de spécialité du rôle choisi">🎯 Bonus rôle ×${xpResult.multiplier.toFixed(2)} (+${xpResult.bonus || 0} XP)</span>` : ''}
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
      <button class="back-btn" onclick="goLobby()">← Retour au lobby</button>
    </div>

    ${hasNextScene ? `
    <div class="next-step-section">
      <div class="next-step-title">🚀 Continuer avec…</div>
      <div class="next-step-grid">
        ${nextSuggestions.map(sug => `
          <button class="next-step-card" onclick="launchSceneById('${sug.scene.id}')">
            <div class="next-step-icon">${sug.scene.icon || '🔍'}</div>
            <div class="next-step-body">
              <div class="next-step-stitle">${sug.scene.title}</div>
              <div class="next-step-reason">${sug.reason}</div>
              <div class="next-step-meta">
                <span class="next-step-diff diff-${sug.scene.difficulty}">${({easy:'Facile',medium:'Moyen',hard:'Difficile',expert:'Expert'})[sug.scene.difficulty] || sug.scene.difficulty}</span>
                ${sug.shared ? `<span class="next-step-shared">${sug.shared.length} thème${sug.shared.length>1?'s':''} commun${sug.shared.length>1?'s':''}</span>` : ''}
              </div>
            </div>
          </button>
        `).join('')}
      </div>
    </div>
    ` : ''}
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
  // v2.55 : utilise Profile.getRank() au lieu de getGrade() legacy
  let gradeIcon = '🎓';
  let gradeTitle = 'Stagiaire';
  if (window.Profile && typeof window.Profile.getRank === 'function') {
    const rank = window.Profile.getRank();
    gradeIcon = rank.emoji || '🎓';
    gradeTitle = rank.name || 'Stagiaire';
  }
  const badges = getUnlockedBadges();
  const results = lsGet('scene_results', {});
  const streak = getStreak();

  document.getElementById('profile-content').innerHTML = `
    <div class="stats-header">
      <div class="stats-title">Mon profil</div>
      <div class="stats-subtitle">${gradeIcon} ${gradeTitle} · ${xp} XP · ${badges.length} badge${badges.length>1?'s':''}</div>
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
  VD: { name: "Vaud", scenarios: ["ncmec-cypertip","lockbit-victime","comparis_2021","unine_2022","epfl-recherche-lai-fuite-chine","epfl-laboratoire-ia-medicale-chine","crypto-tinder-pig-butchering-vaud","logitech-clop-zero-day-supply-chain"] },
  VS: { name: "Valais", scenarios: ["vetroz-akira","sati-bec","rajeunissement-ia","saxon-curatelle","competence-mpc-vs","hydro-valais"] },
  FR: { name: "Fribourg", scenarios: ["dab-villaz","gruyere-coop-affinage-stuxnet","hcfr-bec-transfer-deepfake","cyber-justicier-vigilante-fr"] },
  NE: { name: "Neuchâtel", scenarios: ["faux-policiers","harcelement-ne","handala-hack-iran-rhne-stryker"] },
  JU: { name: "Jura", scenarios: ["delemont-forum","jura-vishing-1m"] },
  BE: { name: "Berne", scenarios: ["ruag_2016","palais_federal","deepfake-electoral","src-fonctionnaire-russe-kaspersky"] },
  ZH: { name: "Zurich", scenarios: ["attribution","bitlocker","bitlocker_froid","mini-natels-prison-pochwies"] },
  SZ: { name: "Schwyz", scenarios: ["clone-vocal"] },
  TI: { name: "Tessin", scenarios: ["sati-bec","lugano-dpfl-mafia-finance"] },
  SG: { name: "Saint-Gall", scenarios: ["operation-alice","stgall-infiltration"] },
  AG: { name: "Argovie", scenarios: ["operation-alice","attentat-deja-couteau-mineur","drone-laufenburg-swissgrid-aargau"] },
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
        ? `<span style="color:${getScoreColor(result.pct)}">${result.pct}%</span> · ${({easy:'F',medium:'M',hard:'D',expert:'X'})[scene.difficulty]||'?'}`
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

  // v2.54 : si l'URL contient #scene-{id}, scroller + surligner la scène concernée
  // (utilisé par les liens depuis la page profil — section Arcs PNJ)
  const sceneHashMatch = window.location.hash.match(/^#scene-([\w-]+)$/);
  if (sceneHashMatch) {
    const targetId = sceneHashMatch[1];
    loadSceneIndex().then(() => {
      setTimeout(() => {
        const card = document.querySelector(`[data-scene-id="${targetId}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('scene-card--highlighted');
          setTimeout(() => card.classList.remove('scene-card--highlighted'), 2400);
        } else {
          // Fallback : si la card n'a pas d'attribut data-scene-id, on tente l'ID DOM
          const fallback = document.getElementById('scene-' + targetId) || document.getElementById(targetId);
          if (fallback) {
            fallback.scrollIntoView({ behavior: 'smooth', block: 'center' });
            fallback.classList.add('scene-card--highlighted');
            setTimeout(() => fallback.classList.remove('scene-card--highlighted'), 2400);
          }
        }
      }, 400);
    });
  }
});
