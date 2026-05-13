/* ═══════════════════════════════════════════════════════════════
 * cas-in-quality-badges-v1.js — v3.3 (Badges qualitatifs)
 *
 * Ajoute 10 badges récompensant la QUALITÉ du raisonnement plutôt que
 * la quantité d'activité. Modèle d'intégration calqué sur scene-lobby-v3.js
 * (push dans GLOBAL_BADGES + wrap de getStatsSnapshot).
 *
 *   1. Chaîne hospitalière      — 100% custody sur 3 scènes 'hospital'
 *   2. L'élève qui révise       — 3 améliorations +30 pts au replay
 *   3. Affaire Sarine linéaire  — 5 actes Sarine en first-try ≥70%
 *   4. Affaire Viège linéaire   — 7 actes Viège en first-try ≥70%
 *   5. Triangulation deepfake   — 3 scènes IA/DEEPFAKE distinctes ≥80%
 *   6. Maître du premier coup   — 5 scènes consécutives first-try ≥80%
 *   7. Praticien EIMP           — 5 EU ≥80% dont 2 transfrontaliers
 *   8. Hors zone de confort     — 5 atmosphères distinctes touchées ≥70%
 *   9. Enquêteur frugal         — 10 scènes Hard ≥70% avec ≤1 hint chacune
 *   10. Inébranlable sous pression — Expert raid/state, 0 erreur, custody ≥90%
 *   11. Conscience de soi       — 3 scènes Expert via override gating ≥70%
 *
 * Architecture :
 *   - IIFE auto-installée, idempotente
 *   - Wrap window.showReport pour capturer l'état G en fin de scène
 *     (G.hintUsedForStep, G.hadCriticalError, scene.atmosphere) et
 *     persister les compteurs cas_*
 *   - Push dans GLOBAL_BADGES (détection auto via getUnlockedBadges)
 *   - Push dans ACHIEVEMENTS_META (affichage profil)
 *   - Wrap window.getStatsSnapshot pour ajouter les métriques dérivées
 *     (custody100_byAtm, atmospheres_touched_70, etc.)
 *
 * Storage :
 *   cas_first_try_won_set    [sceneId, ...]  — first-try ≥70% (saga linéaire)
 *   cas_first_try_streak     int             — streak first-try ≥80%
 *   cas_first_try_streak_max int             — max ever
 *   cas_improvements_30      int             — replays gagnant ≥+30 pts
 *   cas_hard_frugal_won      int             — hard ≥70% avec ≤1 hint
 *   cas_ironclad_wins        int             — expert raid/state irréprochable
 *   cas_gating_override_won  int             — expert via override gating
 *
 * Pas de modification des fichiers scenes/*.json ni de scene-app.js.
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__casInQualityBadges) return;
  window.__casInQualityBadges = true;

  // ─── Helpers LS ──────────────────────────────────────────────
  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (_) { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (_) { /* noop */ }
  }
  function lsGetInt(key, fallback) {
    const v = parseInt(lsGet(key, fallback), 10);
    return Number.isFinite(v) ? v : (fallback || 0);
  }
  function lsBumpInt(key) {
    lsSet(key, lsGetInt(key, 0) + 1);
  }

  // ─── Constantes ──────────────────────────────────────────────
  const SAGA_SARINE_PREFIX = 'fr-affaire-sarine-';
  const SAGA_VIEGE_PREFIX  = 'vs-affaire-viege-';
  const SAGA_SARINE_ACTS = 5;
  const SAGA_VIEGE_ACTS  = 7;

  // Tags considérés "coopération transfrontalière" pour eimp_practitioner
  // (normalisés en MAJUSCULES sans accents pour matching robuste)
  const CROSS_BORDER_TAGS = new Set([
    'EIMP', 'MLAT', 'ENTRAIDE', 'COOPERATION', 'COOPÉRATION',
    'BUDAPEST', 'EUROJUST', 'EUROPOL', 'JIT', 'TRANSFRONTALIER',
  ]);

  // Tags considérés "IA/deepfake" pour deepfake_triangulation
  const IA_DEEPFAKE_TAGS = new Set([
    'IA', 'DEEPFAKE', 'AUDIO FORENSIQUE', 'DESINFORMATION', 'DÉSINFORMATION',
  ]);

  // Atmosphères Expert "sous pression" pour ironclad_under_fire
  const HIGH_PRESSURE_ATMOSPHERES = new Set(['raid', 'state', 'tactique', 'tendu']);

  // ─── Définitions badges + métadonnées ────────────────────────
  const NEW_BADGES = [
    {
      id: 'custody_hospital',
      icon: '🏥', title: 'Chaîne hospitalière',
      desc: '100% custody sur 3 scénarios à atmosphère hospitalière',
      category: 'Scènes · Éthique',
      check: s => (s.q_custody100_byAtm && s.q_custody100_byAtm.hospital || 0) >= 3,
      progress: s => ({
        current: (s.q_custody100_byAtm && s.q_custody100_byAtm.hospital) || 0,
        target: 3,
      }),
    },
    {
      id: 'studious_redemption',
      icon: '📚', title: "L'élève qui révise",
      desc: '3 scénarios où un replay dépasse le 1ᵉʳ run de +30 points',
      category: 'Scènes · Comportement',
      check: s => (s.q_improvements_30 || 0) >= 3,
      progress: s => ({ current: s.q_improvements_30 || 0, target: 3 }),
    },
    {
      id: 'saga_linear_sarine',
      icon: '🏛', title: 'Affaire Sarine — linéaire',
      desc: 'Compléter les 5 actes Sarine ≥70% sans rejouer aucun acte',
      category: 'Scènes · Arcs PNJ',
      check: s => !!s.q_saga_linear_sarine,
    },
    {
      id: 'saga_linear_viege',
      icon: '🏔', title: 'Affaire Viège — linéaire',
      desc: 'Compléter les 7 actes Viège ≥70% sans rejouer aucun acte',
      category: 'Scènes · Arcs PNJ',
      check: s => !!s.q_saga_linear_viege,
    },
    {
      id: 'deepfake_triangulation',
      icon: '🎭', title: 'Triangulation deepfake',
      desc: '3 scénarios IA/deepfake DIFFÉRENTS résolus à ≥80%',
      category: 'Scènes · Spécialité',
      check: s => (s.q_ia_deepfake_80 || 0) >= 3,
      progress: s => ({ current: s.q_ia_deepfake_80 || 0, target: 3 }),
    },
    {
      id: 'first_try_master',
      icon: '🎯', title: 'Maître du premier coup',
      desc: '5 scénarios consécutifs réussis ≥80% sans rejouer',
      category: 'Scènes · Comportement',
      check: s => (s.q_first_try_streak_max || 0) >= 5,
      progress: s => ({
        current: s.q_first_try_streak_max || 0,
        target: 5,
      }),
    },
    {
      id: 'eimp_practitioner',
      icon: '🤝', title: 'Praticien EIMP',
      desc: '5 scénarios européens ≥80% dont au moins 2 transfrontaliers',
      category: 'Scènes · Europe',
      check: s => (s.eu_won_80 || 0) >= 5 && (s.q_cross_border_won || 0) >= 2,
    },
    {
      id: 'out_of_comfort_zone',
      icon: '🧭', title: 'Hors zone de confort',
      desc: 'Premier scénario complété ≥70% dans 5 atmosphères différentes',
      category: 'Scènes · Comportement',
      check: s => (s.q_atmospheres_touched_70 || 0) >= 5,
      progress: s => ({ current: s.q_atmospheres_touched_70 || 0, target: 5 }),
    },
    {
      id: 'frugal_investigator',
      icon: '🔦', title: 'Enquêteur frugal',
      desc: '10 scénarios Difficiles ≥70% avec ≤1 hint utilisé chacun',
      category: 'Scènes · Comportement',
      check: s => (s.q_hard_frugal_won || 0) >= 10,
      progress: s => ({ current: s.q_hard_frugal_won || 0, target: 10 }),
    },
    {
      id: 'ironclad_under_fire',
      icon: '🛡', title: 'Inébranlable sous pression',
      desc: 'Scénario Expert (raid/state) : 0 erreur critique, custody ≥90%',
      category: 'Scènes · Éthique',
      check: s => (s.q_ironclad_wins || 0) >= 1,
    },
    {
      id: 'self_aware',
      icon: '🪞', title: 'Conscience de soi',
      desc: '3 scénarios Expert démarrés via override du gating, complétés ≥70%',
      category: 'Scènes · Comportement',
      check: s => (s.q_gating_override_won || 0) >= 3,
      progress: s => ({ current: s.q_gating_override_won || 0, target: 3 }),
    },
  ];

  // ─── Installation : push dans GLOBAL_BADGES + ACHIEVEMENTS_META ──
  function installBadgeExtension() {
    if (window.__casQualityBadgesInstalled) return;

    // GLOBAL_BADGES n'est pas toujours défini au moment du DOMContentLoaded
    // (scene-app.js l'expose comme const top-level dans son IIFE → accessible
    // via window.GLOBAL_BADGES ou via la closure). On retry si pas encore là.
    const gb = (typeof GLOBAL_BADGES !== 'undefined' && GLOBAL_BADGES)
            || (window.GLOBAL_BADGES);
    if (!gb || !Array.isArray(gb)) return false;

    NEW_BADGES.forEach(b => {
      if (!gb.find(x => x.id === b.id)) {
        // Format GLOBAL_BADGES : { id, icon, title, desc, check }
        gb.push({
          id: b.id,
          icon: b.icon,
          title: b.title,
          desc: b.desc,
          check: b.check,
        });
      }
    });

    // ACHIEVEMENTS_META : format légèrement différent (emoji, name, desc, category)
    if (window.ACHIEVEMENTS_META && Array.isArray(window.ACHIEVEMENTS_META)) {
      NEW_BADGES.forEach(b => {
        if (!window.ACHIEVEMENTS_META.find(x => x.id === b.id)) {
          window.ACHIEVEMENTS_META.push({
            id: b.id,
            emoji: b.icon,
            name: b.title,
            desc: b.desc,
            category: b.category,
            progress: b.progress,
          });
        }
      });
    }

    window.__casQualityBadgesInstalled = true;
    return true;
  }

  // ─── Extension de getStatsSnapshot ───────────────────────────
  function installSnapshotExtension() {
    if (window.__casQualitySnapshotInstalled) return;

    const origSnapshot = window.getStatsSnapshot;
    if (typeof origSnapshot !== 'function') return false;

    window.getStatsSnapshot = function () {
      const snap = origSnapshot.apply(this, arguments);
      try {
        enrichSnapshot(snap);
      } catch (e) {
        console.warn('[quality-badges] enrichSnapshot failed:', e);
      }
      return snap;
    };

    window.__casQualitySnapshotInstalled = true;
    return true;
  }

  function enrichSnapshot(snap) {
    const results = lsGet('scene_results', {}) || {};
    const scenes = (typeof window.SCENES !== 'undefined' && window.SCENES) || [];
    const byId = Object.create(null);
    scenes.forEach(s => { if (s && s.id) byId[s.id] = s; });

    // 1. Custody 100% groupé par atmosphère
    const custody100_byAtm = Object.create(null);
    for (const [sid, r] of Object.entries(results)) {
      if (!r || r.custodyPct !== 100) continue;
      const sc = byId[sid];
      const atm = sc && sc.atmosphere;
      if (!atm) continue;
      custody100_byAtm[atm] = (custody100_byAtm[atm] || 0) + 1;
    }
    snap.q_custody100_byAtm = custody100_byAtm;

    // 2. Atmosphères distinctes touchées ≥70%
    const atmsTouched70 = new Set();
    for (const [sid, r] of Object.entries(results)) {
      if (!r || r.pct < 70) continue;
      const sc = byId[sid];
      if (sc && sc.atmosphere) atmsTouched70.add(sc.atmosphere);
    }
    snap.q_atmospheres_touched_70 = atmsTouched70.size;

    // 3. IA / Deepfake distincts ≥80%
    let iaDfCount = 0;
    for (const [sid, r] of Object.entries(results)) {
      if (!r || r.pct < 80) continue;
      // r.tags est persisté depuis v2.91, mais on sécurise via byId
      const tags = (r.tags || (byId[sid] && byId[sid].tags) || []).map(t => String(t).toUpperCase());
      if (tags.some(t => IA_DEEPFAKE_TAGS.has(t))) iaDfCount++;
    }
    snap.q_ia_deepfake_80 = iaDfCount;

    // 4. Transfrontaliers ≥80%
    let crossBorderWon = 0;
    for (const [sid, r] of Object.entries(results)) {
      if (!r || r.pct < 80) continue;
      const tags = (r.tags || (byId[sid] && byId[sid].tags) || []).map(t => String(t).toUpperCase());
      if (tags.some(t => CROSS_BORDER_TAGS.has(t))) crossBorderWon++;
    }
    snap.q_cross_border_won = crossBorderWon;

    // 5. Sagas linéaires : tous les actes en first-try-won
    const firstTryWonSet = new Set(lsGet('cas_first_try_won_set', []) || []);
    snap.q_saga_linear_sarine = isSagaLinear(SAGA_SARINE_PREFIX, SAGA_SARINE_ACTS, firstTryWonSet, results);
    snap.q_saga_linear_viege  = isSagaLinear(SAGA_VIEGE_PREFIX,  SAGA_VIEGE_ACTS,  firstTryWonSet, results);

    // 6-10. Compteurs persistés
    snap.q_improvements_30      = lsGetInt('cas_improvements_30', 0);
    snap.q_first_try_streak     = lsGetInt('cas_first_try_streak', 0);
    snap.q_first_try_streak_max = lsGetInt('cas_first_try_streak_max', 0);
    snap.q_hard_frugal_won      = lsGetInt('cas_hard_frugal_won', 0);
    snap.q_ironclad_wins        = lsGetInt('cas_ironclad_wins', 0);
    snap.q_gating_override_won  = lsGetInt('cas_gating_override_won', 0);
  }

  function isSagaLinear(prefix, expectedActs, firstTryWonSet, results) {
    // Pour chaque acte i, on cherche un sceneId qui commence par prefix+i
    // (les ids réels sont fr-affaire-sarine-1-premier-appel, etc.)
    // ET qui est :
    //   • présent dans scene_results (donc complété au moins une fois)
    //   • présent dans firstTryWonSet (donc gagné en first-try ≥70%)
    for (let i = 1; i <= expectedActs; i++) {
      const matchPrefix = prefix + i + '-';
      const found = Object.keys(results).some(sid =>
        sid.startsWith(matchPrefix) && firstTryWonSet.has(sid)
      );
      if (!found) return false;
    }
    return true;
  }

  // ─── Wrap showReport pour capturer G et persister les compteurs ──
  function installShowReportHook() {
    if (window.__casQualityReportInstalled) return;
    const orig = window.showReport;
    if (typeof orig !== 'function') return false;

    window.showReport = function () {
      // Capture l'état G AVANT que showReport ne le reset (sécurité)
      let captured = null;
      try {
        if (typeof G !== 'undefined' && G && G.scene) {
          captured = {
            sceneId: G.scene.id,
            difficulty: G.scene.difficulty || 'medium',
            atmosphere: G.scene.atmosphere || '',
            tags: (G.scene.tags || []).slice(),
            hintsUsed: G.hintUsedForStep
              ? Object.keys(G.hintUsedForStep).length
              : 0,
            hadCriticalError: !!G.hadCriticalError,
            // Lecture de l'état "avant écriture" pour détecter first-attempt
            wasFirstAttempt: !(lsGet('scene_results', {})[G.scene.id]),
            // pct/custodyPct seront lus depuis scene_results après orig()
          };
        }
      } catch (_) {}

      // Exécution originale (met à jour scene_results, run_buffer, etc.)
      const ret = orig.apply(this, arguments);

      // Évaluation post-scène : utiliser captured + scene_results à jour
      if (captured) {
        try {
          evaluatePostScene(captured);
        } catch (e) {
          console.warn('[quality-badges] evaluatePostScene failed:', e);
        }
      }
      return ret;
    };
    window.__casQualityReportInstalled = true;
    return true;
  }

  function evaluatePostScene(c) {
    // Garde anti-mode-révision : scene-engine-v4 wrap showReport et retourne
    // AVANT scene-app.js's showReport en mode révision. Du coup pas de push
    // dans cas_run_buffer. Si le dernier entry du buffer ne correspond pas
    // à cette scène (et récent), on est probablement en review mode ou autre
    // court-circuit → on n'incrémente pas les compteurs.
    const buffer = lsGet('cas_run_buffer', []) || [];
    const last = buffer[buffer.length - 1];
    if (!last || last.sceneId !== c.sceneId || (Date.now() - (last.ts || 0)) > 5000) {
      return;
    }

    // IMPORTANT : on lit pct/custodyPct depuis le buffer (run actuel), PAS
    // depuis scene_results — qui ne reflète que le MEILLEUR run jamais joué.
    // Si l'utilisateur rejoue et fait pire, scene_results n'est pas mis à jour
    // mais le buffer contient bien le run actuel.
    const pct = last.pct;
    const custodyPct = last.custodyPct;
    const wasFirstAttempt = c.wasFirstAttempt;

    // ─── First-try tracking (saga linéaire + streak) ───────────
    if (wasFirstAttempt) {
      // Aggregate set pour sagas linéaires (gardé même si buffer rotate)
      if (pct >= 70) {
        const set = new Set(lsGet('cas_first_try_won_set', []) || []);
        set.add(c.sceneId);
        lsSet('cas_first_try_won_set', [...set]);
      }

      // Streak first-try ≥80% — reset sur first-try <80%
      if (pct >= 80) {
        const newStreak = lsGetInt('cas_first_try_streak', 0) + 1;
        lsSet('cas_first_try_streak', newStreak);
        const max = lsGetInt('cas_first_try_streak_max', 0);
        if (newStreak > max) lsSet('cas_first_try_streak_max', newStreak);
      } else {
        lsSet('cas_first_try_streak', 0);
      }
    }
    // NB : un replay (firstAttempt=false) ne casse pas le streak (le streak
    //      mesure "scènes nouvelles bien faites consécutivement", pas
    //      "scènes consécutives en général").

    // ─── Improvement +30 ───────────────────────────────────────
    // Détecté en comparant le pct actuel à un éventuel premier run dans
    // cas_run_buffer (sceneId apparaît au moins 2 fois).
    if (!wasFirstAttempt) {
      const sceneRuns = buffer
        .filter(b => b && b.sceneId === c.sceneId)
        .sort((a, b) => (a.ts || 0) - (b.ts || 0));
      if (sceneRuns.length >= 2) {
        const firstRun = sceneRuns[0];
        const latestRun = sceneRuns[sceneRuns.length - 1];
        if (latestRun.pct >= firstRun.pct + 30) {
          // Pour éviter double-comptage : marqueur par sceneId
          const tracked = new Set(lsGet('cas_improvements_30_set', []) || []);
          if (!tracked.has(c.sceneId)) {
            tracked.add(c.sceneId);
            lsSet('cas_improvements_30_set', [...tracked]);
            lsBumpInt('cas_improvements_30');
          }
        }
      }
    }

    // ─── Hard frugal (≤1 hint, hard, ≥70%) ─────────────────────
    if (c.difficulty === 'hard' && pct >= 70 && c.hintsUsed <= 1) {
      // Idempotence : un seul incrément par scène
      const tracked = new Set(lsGet('cas_hard_frugal_set', []) || []);
      if (!tracked.has(c.sceneId)) {
        tracked.add(c.sceneId);
        lsSet('cas_hard_frugal_set', [...tracked]);
        lsBumpInt('cas_hard_frugal_won');
      }
    }

    // ─── Ironclad (Expert raid/state, 0 critical, custody ≥90%) ─
    if (c.difficulty === 'expert'
        && HIGH_PRESSURE_ATMOSPHERES.has(c.atmosphere)
        && !c.hadCriticalError
        && custodyPct >= 90) {
      const tracked = new Set(lsGet('cas_ironclad_set', []) || []);
      if (!tracked.has(c.sceneId)) {
        tracked.add(c.sceneId);
        lsSet('cas_ironclad_set', [...tracked]);
        lsBumpInt('cas_ironclad_wins');
      }
    }

    // ─── Gating override (Expert via override dialog, ≥70%) ────
    if (c.difficulty === 'expert' && pct >= 70) {
      const allowed = new Set(lsGet('cas_gating_allowed', []) || []);
      if (allowed.has(c.sceneId)) {
        const tracked = new Set(lsGet('cas_gating_override_set', []) || []);
        if (!tracked.has(c.sceneId)) {
          tracked.add(c.sceneId);
          lsSet('cas_gating_override_set', [...tracked]);
          lsBumpInt('cas_gating_override_won');
        }
      }
    }
  }

  // ─── Init avec retry ─────────────────────────────────────────
  // Les dépendances (GLOBAL_BADGES, getStatsSnapshot, showReport) viennent
  // de scene-app.js qui charge en defer. On retry quelques fois si elles
  // ne sont pas encore là au DOMContentLoaded.
  function tryInstall() {
    const ok1 = installBadgeExtension();
    const ok2 = installSnapshotExtension();
    const ok3 = installShowReportHook();
    return ok1 && ok2 && ok3;
  }

  // ─── Migration one-shot pour les users existants ─────────────
  // Avant v3.3, on ne traquait pas cas_first_try_won_set. Pour ne pas
  // pénaliser les users qui ont déjà complété des sagas en first-try, on
  // backfille depuis cas_run_buffer (best effort : le buffer est capé à 50
  // donc on peut manquer des anciennes runs, mais c'est mieux que rien).
  function migrateBackfill() {
    if (lsGet('cas_quality_migrated_v33', false)) return;
    try {
      const buffer = lsGet('cas_run_buffer', []) || [];
      const set = new Set(lsGet('cas_first_try_won_set', []) || []);
      let maxConsecutive = 0, current = 0;
      buffer
        .slice()
        .sort((a, b) => (a.ts || 0) - (b.ts || 0))
        .forEach(b => {
          if (!b || !b.sceneId) return;
          if (b.firstAttempt && b.pct >= 70) set.add(b.sceneId);
          if (b.firstAttempt) {
            if (b.pct >= 80) {
              current++;
              if (current > maxConsecutive) maxConsecutive = current;
            } else {
              current = 0;
            }
          }
        });
      lsSet('cas_first_try_won_set', [...set]);
      // Backfill streak max si supérieur à ce qui est déjà stocké
      const currentMax = lsGetInt('cas_first_try_streak_max', 0);
      if (maxConsecutive > currentMax) {
        lsSet('cas_first_try_streak_max', maxConsecutive);
      }
      lsSet('cas_first_try_streak', current);
    } catch (e) {
      console.warn('[quality-badges] migration backfill failed:', e);
    }
    lsSet('cas_quality_migrated_v33', true);
  }

  function init() {
    migrateBackfill();
    if (tryInstall()) return;
    // Retry à intervalle court, max 20 fois (~2s)
    let attempts = 0;
    const iv = setInterval(() => {
      attempts++;
      if (tryInstall() || attempts >= 20) clearInterval(iv);
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── API publique (debug + reset) ────────────────────────────
  window.CasInQualityBadges = {
    listBadges: () => NEW_BADGES.map(b => ({ id: b.id, title: b.title })),
    getCounters: () => ({
      first_try_won_set:     lsGet('cas_first_try_won_set', []),
      first_try_streak:      lsGetInt('cas_first_try_streak', 0),
      first_try_streak_max:  lsGetInt('cas_first_try_streak_max', 0),
      improvements_30:       lsGetInt('cas_improvements_30', 0),
      hard_frugal_won:       lsGetInt('cas_hard_frugal_won', 0),
      ironclad_wins:         lsGetInt('cas_ironclad_wins', 0),
      gating_override_won:   lsGetInt('cas_gating_override_won', 0),
    }),
    reset: () => {
      const keys = [
        'cas_first_try_won_set', 'cas_first_try_streak', 'cas_first_try_streak_max',
        'cas_improvements_30', 'cas_improvements_30_set',
        'cas_hard_frugal_won', 'cas_hard_frugal_set',
        'cas_ironclad_wins', 'cas_ironclad_set',
        'cas_gating_override_won', 'cas_gating_override_set',
      ];
      keys.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
    },
  };
})();
