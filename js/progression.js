/**
 * CAS-IN — Module Progression
 * Version : 1.0 (v120)
 *
 * Responsabilité : calcul automatique des compétences, réputation,
 * et relations PNJ à partir des choix faits dans les scènes.
 */

// Mapping tags scène → compétences
const TAG_TO_COMPETENCE = {
  'EIMP': 'EIMP',
  'EUROJUST': 'EIMP',
  'ENTRAIDE': 'EIMP',
  'ART. 141 CPP': 'ART_141_CPP',
  'PREUVES ILLICITES': 'ART_141_CPP',
  'ART. 260TER CP': 'cyber_OC_260ter',
  'ORGANISATION CRIMINELLE': 'cyber_OC_260ter',
  'LPD': 'privacy_LPD',
  'PFPDT': 'privacy_LPD',
  'ART. 24 LPD': 'privacy_LPD',
  'ART. 8 LPD': 'privacy_LPD',
  'LCyS': 'LCyS_notification',
  'NCSC': 'LCyS_notification',
  'PLAN SKI': 'plan_SKI_sante',
  'RANSOMWARE': 'gestion_crise_cyber',
  'PCA': 'gestion_crise_cyber',
  'CELLULE DE CRISE': 'gestion_crise_cyber',
  'ART. 19 LStup': 'LStup',
  'TRAFIC STUPÉFIANTS': 'LStup',
  'LStup': 'LStup',
  'AVOCAT PÉNALISTE': 'code_FSA_defense',
  'ART. 158 CPP': 'code_FSA_defense',
  'STRATÉGIE DÉFENSE': 'code_FSA_defense',
  'DÉFENSE': 'code_FSA_defense',
  'FAISCEAU CONTRAIRE': 'doctrine_4_axes_EncroChat',
  'ATTRIBUTION': 'doctrine_4_axes_EncroChat',
  'ENCROCHAT': 'doctrine_4_axes_EncroChat',
  'SKY ECC': 'doctrine_4_axes_EncroChat',
};

// Mapping institutions mentionnées → réputation
const INSTITUTION_KEYWORDS = {
  'MPC': 'MPC',
  'MPC-CYBER': 'MPC',
  'OFJ': 'OFJ',
  'EIMP': 'OFJ',
  'NCSC': 'NCSC',
  'GovCERT': 'NCSC',
  'OFCS': 'OFCS',
  'PLAN SKI': 'OFCS',
  'PFPDT': 'PFPDT',
  'LPD': 'PFPDT',
  'H+ SUISSE': 'H_plus_Suisse',
  'H_PLUS': 'H_plus_Suisse',
  'FSA': 'FSA',
  'AVOCAT': 'FSA',
  'EUROJUST': 'Eurojust',
  'OFAC': 'OFAC_US',
  'CONSEIL EUROPE': 'Conseil_Europe',
  'T-PD': 'Conseil_Europe',
};

// Seuils insignes
const INSIGNE_SEUILS = [
  { min: 0, name: 'non-debutee', icon: '🔒', label: 'Non débutée' },
  { min: 0.01, name: 'decouverte', icon: '🌱', label: 'Découverte' },
  { min: 0.25, name: 'novice', icon: '🥉', label: 'Novice' },
  { min: 0.50, name: 'confirme', icon: '🥈', label: 'Confirmé' },
  { min: 0.75, name: 'expert', icon: '🥇', label: 'Expert' },
  { min: 0.95, name: 'maitre', icon: '🏆', label: 'Maître' },
];

/**
 * Calculer l'insigne pour un score donné (0-1)
 */
function computeInsigne(score) {
  let result = INSIGNE_SEUILS[0];
  for (const seuil of INSIGNE_SEUILS) {
    if (score >= seuil.min) {
      result = seuil;
    }
  }
  return result;
}

/**
 * Identifier les compétences impactées par une scène
 * Basé sur les tags et legalRefs de la scène
 */
function identifyCompetencesFromScene(sceneIndex) {
  const competences = new Map();

  const allTags = [
    ...(sceneIndex.tags || []),
    ...(sceneIndex.legalRefs || []).map(r => typeof r === 'string' ? r : (r.label || '')),
  ];

  for (const tag of allTags) {
    const tagUpper = (tag || '').toUpperCase();
    for (const [key, competence] of Object.entries(TAG_TO_COMPETENCE)) {
      if (tagUpper.includes(key.toUpperCase())) {
        const current = competences.get(competence) || 0;
        competences.set(competence, current + 1);
      }
    }
  }

  return competences;
}

/**
 * Identifier les institutions impactées par une scène
 */
function identifyInstitutionsFromScene(sceneIndex) {
  const institutions = new Map();

  const allTags = [
    ...(sceneIndex.tags || []),
    ...(sceneIndex.legalRefs || []).map(r => typeof r === 'string' ? r : (r.label || '')),
    sceneIndex.alertLevel || '',
    sceneIndex.intro || '',
  ];

  const combined = allTags.join(' | ').toUpperCase();

  for (const [keyword, institution] of Object.entries(INSTITUTION_KEYWORDS)) {
    if (combined.includes(keyword.toUpperCase())) {
      const current = institutions.get(institution) || 0;
      institutions.set(institution, current + 1);
    }
  }

  return institutions;
}

/**
 * Mettre à jour les compétences après complétion d'une scène
 *
 * @param {Object} profile - profil utilisateur
 * @param {Object} sceneIndex - entrée index.json de la scène
 * @param {Number} score - points obtenus dans la scène
 * @param {Number} scoreMax - points maximum théoriques
 */
function updateCompetences(profile, sceneIndex, score, scoreMax) {
  const competences = identifyCompetencesFromScene(sceneIndex);
  const qualite = scoreMax > 0 ? Math.max(0, score / scoreMax) : 0;
  const updates = [];

  for (const [competenceId, poids] of competences) {
    const competence = profile.competences[competenceId];
    if (!competence) continue;

    const oldScore = competence.score;
    // Formule simple : +X% selon poids et qualité, plafonné à 1.0
    const gain = (poids * qualite) * 0.04; // ~4% par scène avec poids 1 et qualité parfaite
    const newScore = Math.min(1.0, oldScore + gain);

    competence.score = newScore;
    competence.insigne = computeInsigne(newScore).name;
    competence.history.push({
      at: new Date().toISOString(),
      scene_id: sceneIndex.id,
      delta: newScore - oldScore,
      gain_raw: gain,
    });

    if (competence.history.length > 50) {
      competence.history = competence.history.slice(-50);
    }

    updates.push({
      competence: competenceId,
      old_score: oldScore,
      new_score: newScore,
      delta: newScore - oldScore,
      old_insigne: computeInsigne(oldScore).name,
      new_insigne: computeInsigne(newScore).name,
    });
  }

  return updates;
}

/**
 * Mettre à jour la réputation après complétion d'une scène
 */
function updateReputation(profile, sceneIndex, score, scoreMax) {
  const institutions = identifyInstitutionsFromScene(sceneIndex);
  const qualite = scoreMax > 0 ? Math.max(0, score / scoreMax) : 0;
  const updates = [];

  for (const [institutionId, poids] of institutions) {
    if (!(institutionId in profile.reputation)) continue;

    const oldRep = profile.reputation[institutionId];
    // Formule : +0 à +5 par scène selon poids et qualité, plafonné à 100
    const gain = Math.round(poids * qualite * 2);
    const newRep = Math.min(100, oldRep + gain);

    profile.reputation[institutionId] = newRep;
    if (gain !== 0) {
      updates.push({
        institution: institutionId,
        old_value: oldRep,
        new_value: newRep,
        delta: gain,
      });
    }
  }

  return updates;
}

/**
 * Mettre à jour les relations PNJ après complétion d'une scène
 */
function updatePnjRelations(profile, sceneIndex, score, scoreMax) {
  const pnjs = sceneIndex.npcs || [];
  const qualite = scoreMax > 0 ? Math.max(0, score / scoreMax) : 0;
  const updates = [];

  for (const pnjId of pnjs) {
    const existing = profile.relations_pnj[pnjId] || {
      niveau: 0,
      rencontres: 0,
      premiere_rencontre_scene: sceneIndex.id,
      qualite_globale: 0,
      qualites_history: [],
      deblocages: [],
    };

    const wasNew = existing.rencontres === 0;
    existing.rencontres += 1;
    existing.derniere_rencontre_scene = sceneIndex.id;
    existing.qualites_history.push(qualite);

    if (existing.qualites_history.length > 20) {
      existing.qualites_history = existing.qualites_history.slice(-20);
    }

    // Qualité globale = moyenne des qualités
    const sum = existing.qualites_history.reduce((a, b) => a + b, 0);
    existing.qualite_globale = sum / existing.qualites_history.length;

    // Niveau = round(qualité × 5), majoré par 1 par tranche de 2 rencontres
    const niveauTheorique = Math.round(existing.qualite_globale * 5);
    const niveauMax = Math.min(5, 1 + Math.floor(existing.rencontres / 2));
    const oldNiveau = existing.niveau;
    existing.niveau = Math.min(niveauTheorique, niveauMax);

    profile.relations_pnj[pnjId] = existing;

    if (wasNew || existing.niveau !== oldNiveau) {
      updates.push({
        pnj_id: pnjId,
        old_niveau: oldNiveau,
        new_niveau: existing.niveau,
        rencontres: existing.rencontres,
        is_new: wasNew,
      });
    }
  }

  return updates;
}

/**
 * Synthèse globale après complétion d'une scène
 * Renvoie un objet exploitable pour l'écran fin-de-scène
 */
function processSceneCompletion(profile, sceneIndex, score, scoreMax) {
  const competencesUpdated = updateCompetences(profile, sceneIndex, score, scoreMax);
  const reputationUpdated = updateReputation(profile, sceneIndex, score, scoreMax);
  const pnjUpdated = updatePnjRelations(profile, sceneIndex, score, scoreMax);

  return {
    competences: competencesUpdated,
    reputation: reputationUpdated,
    pnj: pnjUpdated,
  };
}

// Export
export {
  TAG_TO_COMPETENCE,
  INSTITUTION_KEYWORDS,
  INSIGNE_SEUILS,
  computeInsigne,
  identifyCompetencesFromScene,
  identifyInstitutionsFromScene,
  updateCompetences,
  updateReputation,
  updatePnjRelations,
  processSceneCompletion,
};
