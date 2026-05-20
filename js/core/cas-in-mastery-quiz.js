// ═══════════════════════════════════════════════════════════════
// cas-in-mastery-quiz.js — v3.49 (chantier #2 roadmap pédagogique)
// Système Mastery par chapitre de quiz
//
// Complète cas-in-mastery.js qui couvre les scènes.
// Ce module gère la maîtrise des CHAPITRES de quiz (43 chapitres actifs).
//
// Source de données :
//   - lsGet('byChapter') = { [chapter]: { ok, tot } }  (existant v2.70)
//   - lsGet('chapterHistory') = { [chapter]: [{ok, ts, diff}, ...] }  (NEW v3.49)
//
// Score de maîtrise (0-100) :
//   - Base : précision % (ok/tot)
//   - Pondération difficulté : easy x1.0, medium x1.2, hard x1.5
//   - Pondération récence : les 10 dernières réponses comptent 60%, global 40%
//   - Confidence : si tot < 5, score plafonné à 50 (échantillon insuffisant)
//   - Bonus streak : +5 si 5 dernières toutes OK ; -5 si 5 dernières toutes KO
//
// Tier mastery :
//   0-19   → 🔴 critique (à attaquer en priorité)
//   20-39  → 🟠 faible (à retravailler)
//   40-59  → 🟡 moyen (à consolider)
//   60-79  → 🟢 bon (à entretenir)
//   80-100 → 🌟 maîtrisé (entretien léger)
//
// API :
//   window.MasteryQuiz = {
//     recordAnswer(chapter, ok, diff)  — appelé depuis quiz-app.js validate()
//     computeMastery(chapter)          → { score, tier, confidence, meta }
//     getAllMastery()                  → [{ chapter, score, tier, ... }, ...]
//     getWeakConcepts(n)               → top N concepts à réviser
//     getGlobalMastery()               → { score, tier, conceptCount }
//     tierEmoji(tier) / tierLabel(tier)
//   }
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const HISTORY_MAX = 30;
  const DIFF_WEIGHT = { easy: 1.0, medium: 1.2, hard: 1.5 };

  function lsGet(key, fb) {
    try {
      const r = localStorage.getItem(key);
      return r === null ? fb : JSON.parse(r);
    } catch (e) { return fb; }
  }

  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) { /* localStorage plein */ }
  }

  function recordAnswer(chapter, ok, diff) {
    if (!chapter) return;
    const hist = lsGet('chapterHistory', {}) || {};
    if (!hist[chapter]) hist[chapter] = [];
    hist[chapter].push({ ok: !!ok, ts: Date.now(), diff: diff || 'medium' });
    if (hist[chapter].length > HISTORY_MAX) {
      hist[chapter] = hist[chapter].slice(-HISTORY_MAX);
    }
    lsSet('chapterHistory', hist);
  }

  function computeMastery(chapter) {
    const byChapter = lsGet('byChapter', {}) || {};
    const stats = byChapter[chapter];
    const hist = (lsGet('chapterHistory', {}) || {})[chapter] || [];

    if (!stats || !stats.tot) {
      return {
        score: 0, tier: 'untouched', confidence: 'none',
        meta: { ok: 0, tot: 0, recent: 0, recentOk: 0,
                baseAccuracy: 0, recentAccuracy: 0 },
      };
    }

    const baseAccuracy = stats.ok / stats.tot;

    const recent = hist.slice(-10);
    let recentOk = 0, recentWeight = 0;
    recent.forEach(r => {
      const w = DIFF_WEIGHT[r.diff] || 1.0;
      recentWeight += w;
      if (r.ok) recentOk += w;
    });
    const recentAccuracy = recentWeight > 0 ? recentOk / recentWeight : baseAccuracy;

    // Score = 40% global + 60% récent
    let score = Math.round((baseAccuracy * 0.4 + recentAccuracy * 0.6) * 100);

    // Bonus / pénalité streak (5 dernières)
    const last5 = recent.slice(-5);
    if (last5.length === 5 && last5.every(r => r.ok)) {
      score = Math.min(100, score + 5);
    }
    if (last5.length === 5 && last5.every(r => !r.ok)) {
      score = Math.max(0, score - 5);
    }

    // Confidence
    let confidence;
    if (stats.tot < 5) {
      confidence = 'low';
      score = Math.min(score, 50);
    } else if (stats.tot < 15) {
      confidence = 'medium';
    } else {
      confidence = 'high';
    }

    let tier;
    if (score < 20) tier = 'critique';
    else if (score < 40) tier = 'faible';
    else if (score < 60) tier = 'moyen';
    else if (score < 80) tier = 'bon';
    else tier = 'maitrise';

    return {
      score, tier, confidence,
      meta: {
        ok: stats.ok, tot: stats.tot,
        recent: recent.length,
        recentOk: recent.filter(r => r.ok).length,
        baseAccuracy: Math.round(baseAccuracy * 100),
        recentAccuracy: Math.round(recentAccuracy * 100),
      },
    };
  }

  function getWeakConcepts(n) {
    n = n || 5;
    const byChapter = lsGet('byChapter', {}) || {};
    const results = [];
    Object.keys(byChapter).forEach(chapter => {
      const m = computeMastery(chapter);
      if (m.tier === 'untouched') return;
      if (m.meta.tot < 3) return;
      results.push({ chapter, ...m });
    });
    results.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return b.meta.tot - a.meta.tot;
    });
    return results.slice(0, n);
  }

  function getAllMastery() {
    const byChapter = lsGet('byChapter', {}) || {};
    const results = [];
    Object.keys(byChapter).forEach(chapter => {
      results.push({ chapter, ...computeMastery(chapter) });
    });
    return results;
  }

  function getGlobalMastery() {
    const all = getAllMastery();
    if (!all.length) return { score: 0, tier: 'untouched', conceptCount: 0, totalConcepts: 0 };
    let weightedSum = 0, totalWeight = 0;
    all.forEach(m => {
      if (m.tier === 'untouched') return;
      const w = Math.log(m.meta.tot + 1);
      weightedSum += m.score * w;
      totalWeight += w;
    });
    const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    let tier;
    if (score < 20) tier = 'critique';
    else if (score < 40) tier = 'faible';
    else if (score < 60) tier = 'moyen';
    else if (score < 80) tier = 'bon';
    else tier = 'maitrise';
    return {
      score, tier,
      conceptCount: all.filter(m => m.tier !== 'untouched').length,
      totalConcepts: all.length,
    };
  }

  function tierEmoji(tier) {
    return ({
      critique: '🔴', faible: '🟠', moyen: '🟡',
      bon: '🟢', maitrise: '🌟', untouched: '⚪',
    })[tier] || '⚪';
  }

  function tierLabel(tier) {
    return ({
      critique: 'Critique',
      faible: 'Faible',
      moyen: 'Moyen',
      bon: 'Bon',
      maitrise: 'Maîtrisé',
      untouched: 'Non travaillé',
    })[tier] || 'Inconnu';
  }

  function tierColor(tier) {
    return ({
      critique: '#ff4060', faible: '#ff8040', moyen: '#ffcc40',
      bon: '#30e88a', maitrise: '#7ec0ff', untouched: '#555',
    })[tier] || '#555';
  }

  window.MasteryQuiz = {
    recordAnswer,
    computeMastery,
    getAllMastery,
    getWeakConcepts,
    getGlobalMastery,
    tierEmoji,
    tierLabel,
    tierColor,
  };
})();
