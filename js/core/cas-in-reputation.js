/* ═══════════════════════════════════════════════════════════════
   cas-in-reputation.js — v121d
   
   Système de réputation institutionnelle 10 institutions.
   Calculée automatiquement depuis les tags des scènes complétées.
   
   Stockage localStorage : 'casIn_reputation' { MPC: 42, OFJ: 18, ... }
   
   Expose :
     window.Reputation.get(institution) → 0-100
     window.Reputation.getAll() → { MPC, OFJ, ... }
     window.Reputation.recordSceneOutcome(scene, pct) → deltas appliqués
     window.Reputation.computeDeltas(scene, pct) → deltas SANS écriture (preview)
     window.Reputation.INSTITUTIONS → metadata des 10 institutions
   
   v1.0 — 2026-05-27 (v121d)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STORAGE_KEY = 'casIn_reputation';

  // ─────────────────────────────────────────────────────────────
  // 10 institutions avec leur metadata
  // ─────────────────────────────────────────────────────────────
  const INSTITUTIONS = [
    { id: 'MPC',            label: 'MPC',                fullName: 'Ministère public de la Confédération',     icon: '⚖️', color: '#c97df5' },
    { id: 'OFJ',            label: 'OFJ',                fullName: 'Office fédéral de la justice',             icon: '🏛️', color: '#7ec0ff' },
    { id: 'NCSC',           label: 'NCSC',               fullName: 'National Cyber Security Centre',           icon: '🛡️', color: '#30e88a' },
    { id: 'OFCS',           label: 'OFCS',               fullName: 'Office fédéral de la cybersécurité',       icon: '🔐', color: '#22d3ee' },
    { id: 'PFPDT',          label: 'PFPDT',              fullName: 'Préposé fédéral à la protection des données', icon: '🔒', color: '#a78bfa' },
    { id: 'H_PLUS',         label: 'H+ Suisse',          fullName: 'Association des hôpitaux suisses',         icon: '🏥', color: '#f0c040' },
    { id: 'FSA',            label: 'FSA',                fullName: 'Fédération suisse des avocats',            icon: '⚖️', color: '#ff7a40' },
    { id: 'EUROJUST',       label: 'Eurojust',           fullName: 'Agence européenne de coopération judiciaire', icon: '🇪🇺', color: '#6ab8ff' },
    { id: 'OFAC',           label: 'OFAC',               fullName: 'Office of Foreign Assets Control (US)',    icon: '🇺🇸', color: '#ff4060' },
    { id: 'CONSEIL_EUROPE', label: 'Conseil de l\'Europe', fullName: 'Conseil de l\'Europe (T-PD, GREVIO)',     icon: '🇪🇺', color: '#3b82f6' },
  ];

  // ─────────────────────────────────────────────────────────────
  // Mapping tags → institutions (avec poids relatif)
  // Un tag peut contribuer à plusieurs institutions avec des poids différents.
  // ─────────────────────────────────────────────────────────────
  // Format : 'TAG NORMALIZED' → { INSTITUTION: poids 0-1 }
  const TAG_TO_INSTITUTIONS = {
    // MPC — Ministère public de la Confédération
    'MPC':                     { MPC: 1.0 },
    'MP-VD':                   { MPC: 0.3 }, // cantonal mais lié
    'MP-GE':                   { MPC: 0.3 },
    'MP-GR':                   { MPC: 0.3 },
    'TPF BELLINZONE':          { MPC: 0.8 },

    // OFJ — Office fédéral de la justice (entraide internationale)
    'OFJ':                     { OFJ: 1.0 },
    'EIMP':                    { OFJ: 0.7 },
    'ENTRAIDE':                { OFJ: 0.7 },
    'ENTRAIDE FR-CH':          { OFJ: 0.8 },
    'ART. 64 EIMP':            { OFJ: 0.6 },
    'ART. 67 EIMP':            { OFJ: 0.6 },
    'ART. 80H EIMP':           { OFJ: 0.6 },

    // NCSC — National Cyber Security Centre
    'NCSC':                    { NCSC: 1.0 },
    'GOVCERT':                 { NCSC: 0.6 },
    'NOTIFICATION NCSC':       { NCSC: 0.8 },

    // OFCS — Office fédéral de la cybersécurité
    'OFCS':                    { OFCS: 1.0 },
    'PLAN SKI':                { OFCS: 0.8 },
    'LCYS':                    { OFCS: 0.7 },
    'LCYS SANTÉ':              { OFCS: 0.8, H_PLUS: 0.5 },
    'INFRASTRUCTURE CRITIQUE': { OFCS: 0.7 },

    // PFPDT — Préposé fédéral à la protection des données
    'PFPDT':                   { PFPDT: 1.0 },
    'LPD':                     { PFPDT: 0.7 },
    'ART. 8 LPD':              { PFPDT: 0.5 },
    'ART. 24 LPD':             { PFPDT: 0.6 },
    'NOTIFICATION POST-CLÔTURE': { PFPDT: 0.7 },
    'PRIVACY CAMP':            { PFPDT: 0.4 },

    // H+ Suisse — Association des hôpitaux
    'H+ SUISSE':               { H_PLUS: 1.0 },
    'HRHP':                    { H_PLUS: 0.5 },
    'CISO':                    { H_PLUS: 0.3 },

    // FSA — Fédération suisse des avocats
    'FSA':                     { FSA: 1.0 },
    'AVOCAT PÉNALISTE':        { FSA: 0.7 },
    'DÉFENSE':                 { FSA: 0.5 },
    'MANHART':                 { FSA: 0.4 },

    // Eurojust
    'EUROJUST':                { EUROJUST: 1.0 },
    'JIT':                     { EUROJUST: 0.6 },
    'COORDINATION INTERNATIONALE': { EUROJUST: 0.5 },
    'BKA':                     { EUROJUST: 0.4 },
    'LKA-BAYERN':              { EUROJUST: 0.4 },

    // OFAC US
    'OFAC':                    { OFAC: 1.0 },
    'SANCTIONS US':            { OFAC: 0.8 },

    // Conseil de l'Europe
    'CONSEIL DE L\'EUROPE T-PD': { CONSEIL_EUROPE: 1.0 },
    'CONSEIL EUROPE':          { CONSEIL_EUROPE: 1.0 },
    'IAPP':                    { CONSEIL_EUROPE: 0.3, PFPDT: 0.3 },
  };

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function ensureReputation() {
    let rep = lsGet(STORAGE_KEY, null);
    if (!rep || typeof rep !== 'object') {
      rep = {};
      INSTITUTIONS.forEach(inst => { rep[inst.id] = 0; });
      lsSet(STORAGE_KEY, rep);
    } else {
      // Assurer toutes les institutions présentes (migration)
      INSTITUTIONS.forEach(inst => {
        if (typeof rep[inst.id] !== 'number') rep[inst.id] = 0;
      });
    }
    return rep;
  }

  // ─────────────────────────────────────────────────────────────
  // API publique
  // ─────────────────────────────────────────────────────────────
  function get(institutionId) {
    const rep = ensureReputation();
    return Math.max(0, Math.min(100, rep[institutionId] || 0));
  }

  function getAll() {
    return ensureReputation();
  }

  /**
   * Calcule les deltas potentiels SANS les appliquer (preview).
   * @param {Object} scene - objet scène (avec .tags)
   * @param {Number} pct - score % (0-100)
   * @returns {Object} { MPC: +5, NCSC: +3, ... } — uniquement les institutions avec delta ≠ 0
   */
  function computeDeltas(scene, pct) {
    if (!scene || !Array.isArray(scene.tags)) return {};
    if (typeof pct !== 'number' || isNaN(pct)) pct = 0;

    // Qualité : 0..1, plafonnée à 1.5 pour les scores exceptionnels (≥90%)
    const quality = pct >= 90 ? 1.5 : pct >= 70 ? 1.0 : pct >= 60 ? 0.5 : pct >= 40 ? 0.2 : 0;
    if (quality === 0) return {}; // scène échouée → pas d'impact

    // Pour chaque tag, additionner les contributions aux institutions
    const contributions = {};
    scene.tags.forEach(rawTag => {
      const tag = String(rawTag || '').toUpperCase().trim();
      const mapping = TAG_TO_INSTITUTIONS[tag];
      if (!mapping) return;
      Object.entries(mapping).forEach(([instId, weight]) => {
        contributions[instId] = (contributions[instId] || 0) + weight;
      });
    });

    // Convertir en deltas : chaque point de contribution = base 2 XP, × qualité
    // Plafond par scène : +10 par institution (évite l'inflation rapide)
    const deltas = {};
    Object.entries(contributions).forEach(([instId, contrib]) => {
      const raw = Math.round(contrib * 2 * quality);
      const delta = Math.min(10, raw);
      if (delta > 0) deltas[instId] = delta;
    });

    return deltas;
  }

  /**
   * Applique les deltas en lecture du scene + pct. Persiste.
   * Cap chaque institution à [0..100].
   * @returns deltas réellement appliqués (peut être inférieur au calcul si plafonné)
   */
  function recordSceneOutcome(scene, pct) {
    const deltas = computeDeltas(scene, pct);
    if (Object.keys(deltas).length === 0) return {};

    const rep = ensureReputation();
    const applied = {};
    Object.entries(deltas).forEach(([instId, delta]) => {
      const oldVal = rep[instId] || 0;
      const newVal = Math.max(0, Math.min(100, oldVal + delta));
      const realDelta = newVal - oldVal;
      if (realDelta !== 0) {
        rep[instId] = newVal;
        applied[instId] = realDelta;
      }
    });

    if (Object.keys(applied).length > 0) {
      lsSet(STORAGE_KEY, rep);
    }
    return applied;
  }

  /**
   * Reset (debug / réinitialisation profil)
   */
  function reset() {
    const rep = {};
    INSTITUTIONS.forEach(inst => { rep[inst.id] = 0; });
    lsSet(STORAGE_KEY, rep);
    return rep;
  }

  /**
   * Stats globales
   */
  function getStats() {
    const rep = ensureReputation();
    const total = INSTITUTIONS.reduce((sum, inst) => sum + (rep[inst.id] || 0), 0);
    const max = INSTITUTIONS.length * 100;
    const avg = INSTITUTIONS.length > 0 ? Math.round(total / INSTITUTIONS.length) : 0;
    const above50 = INSTITUTIONS.filter(inst => (rep[inst.id] || 0) >= 50).length;
    const at100 = INSTITUTIONS.filter(inst => (rep[inst.id] || 0) >= 100).length;
    return {
      total,
      max,
      pct: Math.round((total / max) * 100),
      avg,
      institutions_above_50: above50,
      institutions_at_100: at100,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Export
  // ─────────────────────────────────────────────────────────────
  window.Reputation = Object.freeze({
    get,
    getAll,
    computeDeltas,
    recordSceneOutcome,
    reset,
    getStats,
    INSTITUTIONS: Object.freeze(INSTITUTIONS.map(i => Object.freeze({ ...i }))),
  });

})();
