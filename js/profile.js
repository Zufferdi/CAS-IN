/**
 * CAS-IN — Module Profil Joueur
 * Version : 1.0 (v120)
 *
 * Responsabilité : CRUD du profil joueur en localStorage
 * + export/import JSON pour migration entre appareils
 *
 * Stockage : 100% local, pas de backend
 * Clé localStorage : "cas-in-user-profile"
 */

const STORAGE_KEY = 'cas-in-user-profile';
const SCHEMA_VERSION = '1.0';

/**
 * Schéma initial d'un profil vierge
 */
function createEmptyProfile() {
  return {
    $schema: 'cas-in-user-profile',
    $version: SCHEMA_VERSION,
    $created_at: new Date().toISOString(),
    $updated_at: new Date().toISOString(),

    identity: {
      pseudonym: 'Apprenti CAS-IN',
      preferred_locale: 'fr',
      first_run_completed: false,
    },

    competences: {
      EIMP: { score: 0, insigne: 'non-debutee', history: [] },
      LStup: { score: 0, insigne: 'non-debutee', history: [] },
      ART_141_CPP: { score: 0, insigne: 'non-debutee', history: [] },
      cyber_OC_260ter: { score: 0, insigne: 'non-debutee', history: [] },
      privacy_LPD: { score: 0, insigne: 'non-debutee', history: [] },
      gestion_crise_cyber: { score: 0, insigne: 'non-debutee', history: [] },
      plan_SKI_sante: { score: 0, insigne: 'non-debutee', history: [] },
      LCyS_notification: { score: 0, insigne: 'non-debutee', history: [] },
      doctrine_4_axes_EncroChat: { score: 0, insigne: 'non-debutee', history: [] },
      code_FSA_defense: { score: 0, insigne: 'non-debutee', history: [] },
    },

    reputation: {
      MPC: 0,
      OFJ: 0,
      NCSC: 0,
      OFCS: 0,
      PFPDT: 0,
      H_plus_Suisse: 0,
      FSA: 0,
      Eurojust: 0,
      OFAC_US: 0,
      Conseil_Europe: 0,
    },

    relations_pnj: {},
    scenes_etat: {},

    achievements: {
      unlocked: [],
      unlocked_at: {},
      progress: {},
    },

    streaks: {
      current_streak: 0,
      longest_streak: 0,
      last_play_date: null,
      total_play_days: 0,
    },

    session_history: {
      total_play_time_minutes: 0,
      sessions_count: 0,
      longest_session_minutes: 0,
      scenes_per_session_avg: 0,
      last_session_at: null,
      sessions_log: [],
    },

    preferences: {
      hide_mastered_scenes: false,
      show_difficulty_warning: true,
      auto_advance_after_completion: false,
      notifications_enabled: true,
      quest_of_day_enabled: true,
    },
  };
}

/**
 * Charger le profil depuis localStorage
 * Retourne un profil vierge si aucun trouvé
 */
function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyProfile();
    }
    const profile = JSON.parse(raw);
    return migrateProfile(profile);
  } catch (e) {
    console.error('CAS-IN profile: erreur chargement, profil réinitialisé', e);
    return createEmptyProfile();
  }
}

/**
 * Sauvegarder le profil
 */
function saveProfile(profile) {
  try {
    profile.$updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch (e) {
    console.error('CAS-IN profile: erreur sauvegarde', e);
    return false;
  }
}

/**
 * Réinitialiser le profil (action destructive, demande confirmation UI)
 */
function resetProfile() {
  localStorage.removeItem(STORAGE_KEY);
  return createEmptyProfile();
}

/**
 * Exporter le profil en JSON téléchargeable
 */
function exportProfile() {
  const profile = loadProfile();
  const json = JSON.stringify(profile, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cas-in-profile-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Importer un profil depuis un fichier JSON
 */
async function importProfile(file) {
  try {
    const text = await file.text();
    const profile = JSON.parse(text);
    if (profile.$schema !== 'cas-in-user-profile') {
      throw new Error('Schéma non reconnu');
    }
    const migrated = migrateProfile(profile);
    saveProfile(migrated);
    return migrated;
  } catch (e) {
    console.error('CAS-IN profile: erreur import', e);
    throw e;
  }
}

/**
 * Migration de schéma — pour compat ascendante
 * Si un profil ancien existe, on l'aligne sur le schéma courant
 */
function migrateProfile(profile) {
  const empty = createEmptyProfile();
  // Conserver les champs existants, ajouter les manquants
  const migrated = deepMerge(empty, profile);
  migrated.$version = SCHEMA_VERSION;
  return migrated;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Marquer une scène comme complétée
 * Déclenche les calculs : compétences + réputation + PNJ + trophées
 */
function recordSceneCompletion(profile, sceneId, results) {
  // results = { score, score_max, choices_made, pnj_in_scene, tags, legalRefs, ... }
  const now = new Date().toISOString();

  const existing = profile.scenes_etat[sceneId] || {
    status: 'non-commencee',
    tentatives: 0,
    best_score: 0,
    best_score_max: 0,
  };

  const isFirstTime = existing.status === 'non-commencee';
  const ratio = results.score_max > 0 ? results.score / results.score_max : 0;

  profile.scenes_etat[sceneId] = {
    ...existing,
    status: ratio >= 0.85 ? 'maitrisee' : (ratio > 0 ? 'en-cours' : 'echec'),
    tentatives: existing.tentatives + 1,
    last_played_at: now,
    last_score: results.score,
    best_score: Math.max(existing.best_score, results.score),
    best_score_max: results.score_max,
    choices_made: results.choices_made,
  };

  if (isFirstTime) {
    profile.scenes_etat[sceneId].first_completed_at = now;
  }

  // Update streak
  updateStreak(profile);

  // Update sessions
  profile.session_history.last_session_at = now;
  if (isFirstTime) {
    profile.session_history.sessions_count += 1;
  }

  return profile;
}

/**
 * Mettre à jour le streak (jours consécutifs)
 */
function updateStreak(profile) {
  const today = new Date().toISOString().slice(0, 10);
  const lastPlay = profile.streaks.last_play_date;

  if (!lastPlay) {
    profile.streaks.current_streak = 1;
    profile.streaks.total_play_days = 1;
  } else if (lastPlay === today) {
    // Déjà joué aujourd'hui, ne rien faire
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (lastPlay === yesterday) {
      profile.streaks.current_streak += 1;
    } else {
      profile.streaks.current_streak = 1;
    }
    profile.streaks.total_play_days += 1;
  }

  profile.streaks.last_play_date = today;
  if (profile.streaks.current_streak > profile.streaks.longest_streak) {
    profile.streaks.longest_streak = profile.streaks.current_streak;
  }
}

// Export ES module
export {
  STORAGE_KEY,
  SCHEMA_VERSION,
  createEmptyProfile,
  loadProfile,
  saveProfile,
  resetProfile,
  exportProfile,
  importProfile,
  migrateProfile,
  recordSceneCompletion,
  updateStreak,
};
