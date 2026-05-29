/* ═══════════════════════════════════════════════════════════════
   cas-in-competences.js — v121e
   
   Système de compétences techniques par domaine, calculées
   automatiquement depuis scenesTagCount (tags des scènes complétées).
   
   Lecture seule : ne stocke rien (recalcul à la demande depuis le
   snapshot Profile). Pas de migration nécessaire.
   
   Expose :
     window.Competences.getAll() → tableau enrichi des 10 compétences
     window.Competences.get(id) → détail d'une compétence
     window.Competences.getStats() → stats globales
     window.Competences.computeBadge(score) → insigne (decouverte/novice/.../maitre)
     window.Competences.COMPETENCES → metadata
   
   v1.0 — 2026-05-27 (v121e)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // Insignes par palier (cohérent avec design v120)
  // ─────────────────────────────────────────────────────────────
  const BADGES = [
    { id: 'non-debutee',  icon: '🔒', label: 'Non débutée', min: 0,    color: '#475569' },
    { id: 'decouverte',   icon: '🌱', label: 'Découverte',  min: 0.01, color: '#4ade80' },
    { id: 'novice',       icon: '🥉', label: 'Novice',      min: 0.25, color: '#cd7f32' },
    { id: 'confirme',     icon: '🥈', label: 'Confirmé·e',  min: 0.50, color: '#c0c0c0' },
    { id: 'expert',       icon: '🥇', label: 'Expert·e',    min: 0.75, color: '#ffd700' },
    { id: 'maitre',       icon: '🏆', label: 'Maître',      min: 0.95, color: '#c084fc' },
  ];

  function computeBadge(score) {
    let result = BADGES[0];
    for (const b of BADGES) {
      if (score >= b.min) result = b;
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // 10 compétences techniques par domaine
  //
  // Pour chaque compétence :
  //   - id, label, icon, description
  //   - tags: array de tags qui contribuent à cette compétence
  //   - threshold: nombre de scènes maîtrisées (≥80% ou ≥60% selon le seuil)
  //     pour atteindre 100% sur cette compétence
  //   - bonus_tags: tags qui donnent un bonus ×2 (forte spécialisation)
  // ─────────────────────────────────────────────────────────────
  const COMPETENCES = [
    {
      id: 'EIMP',
      label: 'EIMP — Entraide pénale internationale',
      shortLabel: 'EIMP',
      icon: '🌐',
      description: 'Loi fédérale sur l\'entraide internationale en matière pénale',
      tags: ['EIMP', 'ENTRAIDE', 'EUROJUST', 'JIT', 'COORDINATION INTERNATIONALE', 'BKA', 'LKA-BAYERN', 'INTERPOL', 'OFJ'],
      bonus_tags: ['ART. 64 EIMP', 'ART. 67 EIMP', 'ART. 80H EIMP'],
      threshold: 10,
    },
    {
      id: 'LPD',
      label: 'LPD — Protection des données',
      shortLabel: 'LPD',
      icon: '🔒',
      description: 'Loi fédérale sur la protection des données + PFPDT',
      tags: ['LPD', 'PFPDT', 'PRIVACY CAMP', 'IAPP', 'CONSEIL DE L\'EUROPE T-PD'],
      bonus_tags: ['ART. 8 LPD', 'ART. 24 LPD', 'NOTIFICATION POST-CLÔTURE'],
      threshold: 8,
    },
    {
      id: 'ART_141_CPP',
      label: 'Art. 141 CPP — Preuves illicites',
      shortLabel: 'Art. 141 CPP',
      icon: '⚖️',
      description: 'Doctrine des preuves illicites + faisceau contraire EncroChat',
      tags: ['ART. 141 CPP', 'PREUVES ILLICITES', 'FAISCEAU CONTRAIRE', 'ATTRIBUTION'],
      bonus_tags: ['ENCROCHAT', 'SKY ECC'],
      threshold: 5,
    },
    {
      id: 'ORG_CRIM_260TER',
      label: 'Art. 260ter CP — Organisation criminelle',
      shortLabel: 'Art. 260ter',
      icon: '🏛️',
      description: 'Organisation criminelle et al. 5 (collaboration repentir)',
      tags: ['ART. 260TER CP', 'ORGANISATION CRIMINELLE', 'OC ALBANAISE', 'COOPÉRATION'],
      bonus_tags: ['260TER AL. 5'],
      threshold: 6,
    },
    {
      id: 'GESTION_CRISE_CYBER',
      label: 'Gestion de crise cyber',
      shortLabel: 'Crise cyber',
      icon: '🚨',
      description: 'Ransomware, PCA, cellule de crise, communication de crise',
      tags: ['RANSOMWARE', 'CELLULE DE CRISE', 'GESTION DE CRISE', 'PCA', 'PLAN DE CONTINUITÉ', 'CRISE LPD', 'CRISE UTILISATEURS', 'CISO'],
      bonus_tags: ['DOCTRINE NON-PAIEMENT', 'BACKUP IMMUTABLE'],
      threshold: 10,
    },
    {
      id: 'LCYS_NOTIFICATION',
      label: 'LCyS — Notification incidents',
      shortLabel: 'LCyS',
      icon: '🛡️',
      description: 'Loi sur la cybersécurité — notification 24h NCSC',
      tags: ['LCYS', 'NCSC', 'NOTIFICATION NCSC', 'GOVCERT'],
      bonus_tags: ['LCYS SANTÉ'],
      threshold: 6,
    },
    {
      id: 'FORENSIQUE',
      label: 'Forensique numérique (DFIR)',
      shortLabel: 'Forensique',
      icon: '🔬',
      description: 'Acquisition, analyse, chaîne de possession (ISO 27037)',
      tags: ['FORENSIQUE', 'WINDOWS', 'CHAÎNE DE POSSESSION', 'CHAÎNE PROBATOIRE', 'FORENSIQUE MAIL', 'FORENSIQUE OT', 'WAV', 'DFIR'],
      bonus_tags: ['ISO 27037', 'AEROSCOPE', 'EXTRACTION TECHNIQUE'],
      threshold: 12,
    },
    {
      id: 'CRYPTO_TRACING',
      label: 'Crypto-tracing & blanchiment',
      shortLabel: 'Crypto-tracing',
      icon: '🪙',
      description: 'Traçage blockchain, mixers, LBA, MROS',
      tags: ['CRYPTO', 'CHAINALYSIS', 'USDT-TRON', 'BLANCHIMENT', 'CRYPTO-TRACING', 'MIXER', 'OTC DESK', 'MROS', 'BCFI', 'ART. 305BIS CP', 'ART. 9 LBA', 'ART. 11 LBA'],
      bonus_tags: ['HONG KONG', 'SINGAPOUR'],
      threshold: 10,
    },
    {
      id: 'CPP_PROCEDURE',
      label: 'CPP — Procédure pénale',
      shortLabel: 'CPP',
      icon: '📜',
      description: 'Code de procédure pénale : audition, perquisition, scellement, classement',
      tags: ['ART. 158 CPP', 'ART. 244 CPP', 'ART. 248 CPP', 'ART. 264 CPP', 'ART. 319 CPP', 'ART. 324 CPP', 'CPP', 'SCELLEMENT', 'SCELLÉS', 'AUDIENCE', 'MANDAT REJETÉ', 'CLASSEMENT PARTIEL', 'PROPORTIONNALITÉ'],
      bonus_tags: ['TMC VAUD', 'RECOURS'],
      threshold: 12,
    },
    {
      id: 'PLAN_SKI_SANTE',
      label: 'Plan SKI niveau 3 — Santé',
      shortLabel: 'Plan SKI Santé',
      icon: '🏥',
      description: 'Plan SKI niveau 3 critique santé, doctrine H+ Suisse',
      tags: ['LCYS SANTÉ', 'H+ SUISSE', 'PLAN SKI', 'HRHP', 'INFRASTRUCTURE CRITIQUE', 'DOCTRINE H+'],
      bonus_tags: ['LCYS SANTÉ', 'INTERVENTION PARLEMENT'],
      threshold: 6,
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // Calcul du score 0-1 pour une compétence donnée
  //
  // Stratégie :
  //   - Pour chaque scène complétée avec un tag de cette compétence,
  //     on ajoute un crédit selon la qualité (pct).
  //   - Si tag bonus_tags, ×2.
  //   - Score = crédits / (threshold × 1.0) plafonné à 1.0.
  //
  // Crédit par scène :
  //   pct >= 95 : 1.5 (excellence)
  //   pct >= 80 : 1.0 (maîtrise)
  //   pct >= 60 : 0.5 (réussite)
  //   pct < 60  : 0.0 (échec — ne compte pas)
  // ─────────────────────────────────────────────────────────────
  function computeScore(competence) {
    // Lit scene_results pour obtenir pct + tags
    let results;
    try {
      results = JSON.parse(localStorage.getItem('scene_results') || '{}') || {};
    } catch (_) {
      return { score: 0, scenes_count: 0, scenes_mastered: 0, bonus_count: 0 };
    }

    const compTagsUpper = competence.tags.map(t => t.toUpperCase().trim());
    const bonusTagsUpper = (competence.bonus_tags || []).map(t => t.toUpperCase().trim());

    let credits = 0;
    let scenesCount = 0;
    let scenesMastered = 0;
    let bonusCount = 0;

    Object.entries(results).forEach(([sceneId, r]) => {
      if (!r || typeof r.pct !== 'number') return;
      const pct = r.pct;
      if (pct < 60) return; // scènes échouées ignorées

      const sceneTagsUpper = (r.tags || []).map(t => String(t).toUpperCase().trim());

      // Vérifier au moins un tag de la compétence
      const hasCompTag = compTagsUpper.some(tag =>
        sceneTagsUpper.some(st => st === tag || st.includes(tag))
      );
      if (!hasCompTag) return;

      // Crédit selon qualité
      let creditBase;
      if (pct >= 95) { creditBase = 1.5; scenesMastered++; }
      else if (pct >= 80) { creditBase = 1.0; scenesMastered++; }
      else { creditBase = 0.5; }

      // Bonus si tag bonus
      const hasBonusTag = bonusTagsUpper.some(tag =>
        sceneTagsUpper.some(st => st === tag || st.includes(tag))
      );
      if (hasBonusTag) {
        creditBase *= 2;
        bonusCount++;
      }

      credits += creditBase;
      scenesCount++;
    });

    const score = Math.min(1.0, credits / competence.threshold);
    return {
      score: score,
      credits: credits,
      scenes_count: scenesCount,
      scenes_mastered: scenesMastered,
      bonus_count: bonusCount,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // API publique
  // ─────────────────────────────────────────────────────────────
  function get(competenceId) {
    const comp = COMPETENCES.find(c => c.id === competenceId);
    if (!comp) return null;
    const calc = computeScore(comp);
    const badge = computeBadge(calc.score);
    return {
      ...comp,
      ...calc,
      score_pct: Math.round(calc.score * 100),
      badge: badge,
    };
  }

  function getAll() {
    return COMPETENCES.map(c => get(c.id));
  }

  function getStats() {
    const all = getAll();
    const started = all.filter(c => c.score > 0).length;
    const above_50 = all.filter(c => c.score >= 0.50).length;
    const above_75 = all.filter(c => c.score >= 0.75).length;
    const at_master = all.filter(c => c.score >= 0.95).length;
    const total_score = all.reduce((sum, c) => sum + c.score, 0);
    const avg_score = all.length > 0 ? total_score / all.length : 0;

    return {
      total: all.length,
      started,
      above_50,
      above_75,
      at_master,
      avg_score,
      avg_pct: Math.round(avg_score * 100),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Export
  // ─────────────────────────────────────────────────────────────
  window.Competences = Object.freeze({
    get,
    getAll,
    getStats,
    computeBadge,
    BADGES: Object.freeze(BADGES.map(b => Object.freeze({ ...b }))),
    COMPETENCES: Object.freeze(COMPETENCES.map(c => Object.freeze({ ...c }))),
  });

})();
