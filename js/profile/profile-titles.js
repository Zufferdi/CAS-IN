/* ============================================================
   CAS-IN · profile-titles.js
   Catalogue des titres déblocables et helpers d'évaluation.

   Un titre est défini par :
     - id          : string court
     - label       : libellé affiché (ex: "Le Masochiste")
     - desc        : description / flavor (RPG style)
     - category    : "Généraliste" | "Quiz" | "Scènes" | "TP" | "Fiches"
     - check(snap) : function → true si débloqué

   Les checks lisent uniquement Profile.snapshot() — pas de localStorage
   direct. Le module est self-contained et chargeable sur n'importe quelle
   page qui charge Profile (profile.html, scene.html, tp.html, quiz.html).

   Expose : window.ProfileTitles
   ============================================================ */
(function () {
  'use strict';

  const TITLES = [
    // ─────────── Généralistes (basés sur le compteur d'achievements) ───────────
    {
      id: 'init',
      label: "L'Initié",
      desc: "Tu as posé un pied dans le dossier.",
      category: 'Généraliste',
      check: s => (s.achievements || []).length >= 5,
    }, {
      id: 'vet',
      label: 'Le Vétéran',
      desc: 'Plus de paperasse derrière toi que devant.',
      category: 'Généraliste',
      check: s => (s.achievements || []).length >= 20,
    }, {
      id: 'legend',
      label: 'La Légende',
      desc: 'Les plus jeunes te chuchotent ton nom.',
      category: 'Généraliste',
      check: s => (s.achievements || []).length >= 50,
    }, {
      id: 'master_abs',
      label: 'Maître Absolu',
      desc: "Tu as à peu près tout vu, tout fait, tout signé.",
      category: 'Généraliste',
      check: s => (s.achievements || []).length >= 75,
    },

    // ─────────── Quiz ───────────
    {
      id: 't_masochiste',
      label: 'Le Masochiste',
      desc: 'Tu choisis la version difficile par principe.',
      category: 'Quiz',
      check: s => has(s, 'hard50'),
    }, {
      id: 't_elite',
      label: "L'Élite",
      desc: 'Tu te trompes rarement, et ça se voit.',
      category: 'Quiz',
      check: s => has(s, 'acc95'),
    }, {
      id: 't_marathonien',
      label: 'Le Marathonien',
      desc: '500 questions, c\'est un marathon. Toi tu cours.',
      category: 'Quiz',
      check: s => has(s, 'five00'),
    }, {
      id: 't_legende_vivante',
      label: 'Légende Vivante',
      desc: '2000 questions. Tu fais ça pour la beauté du geste.',
      category: 'Quiz',
      check: s => has(s, 'twoK'),
    }, {
      id: 't_polymathe',
      label: 'Le Polymathe',
      desc: 'Tu refuses les spécialisations.',
      category: 'Quiz',
      check: s => has(s, 'allthemes'),
    }, {
      id: 't_phenix',
      label: 'Le Phénix',
      desc: 'Tu remontes des cendres comme d\'autres descendent l\'escalier.',
      category: 'Quiz',
      check: s => has(s, 'comeback'),
    }, {
      id: 't_inepuisable',
      label: "L'Inépuisable",
      desc: '50 bonnes réponses de suite. C\'est presque suspect.',
      category: 'Quiz',
      check: s => has(s, 'streak50'),
    }, {
      id: 't_assidu',
      label: "L'Assidu",
      desc: '30 jours d\'affilée. Sérieux.',
      category: 'Quiz',
      check: s => has(s, 'daily30'),
    },

    // ─────────── Scènes ───────────
    {
      id: 't_premier_sang',
      label: 'Le Premier Sang',
      desc: 'Première scène bouclée. Bienvenue dans le bain.',
      category: 'Scènes',
      check: s => has(s, 'first_blood'),
    }, {
      id: 't_completionniste',
      label: 'Le Complétionniste',
      desc: 'Toutes les scènes. Toutes.',
      category: 'Scènes',
      check: s => has(s, 'completionist'),
    }, {
      id: 't_chaine',
      label: 'Maître de la Chaîne',
      desc: 'Personne n\'a jamais cassé ton custody.',
      category: 'Scènes',
      check: s => has(s, 'chain_master'),
    }, {
      id: 't_ransom',
      label: 'Spécialiste Ransomware',
      desc: 'Tu connais les rançonneurs par leur prénom.',
      category: 'Scènes',
      check: s => has(s, 'ransom_expert'),
    }, {
      id: 't_crypto',
      label: 'Sage du Chiffrement',
      desc: 'Les clés ne te font plus peur.',
      category: 'Scènes',
      check: s => has(s, 'crypto_sage'),
    }, {
      id: 't_forensic',
      label: 'Pro du Forensique',
      desc: 'L\'image disque, c\'est ton terrain de chasse.',
      category: 'Scènes',
      check: s => has(s, 'forensic_pro'),
    }, {
      id: 't_juriste',
      label: 'Juriste Confirmé',
      desc: 'Le CPP, tu le cites de mémoire.',
      category: 'Scènes',
      check: s => has(s, 'swiss_jurist'),
    }, {
      id: 't_conscience',
      label: 'Conscience Irréprochable',
      desc: '20 scènes propres. La probité incarnée.',
      category: 'Scènes',
      check: s => has(s, 'ethics_legend'),
    }, {
      id: 't_sniper',
      label: 'Le Sniper',
      desc: 'Pas d\'indice. Pas d\'erreur. Au revoir.',
      category: 'Scènes',
      check: s => has(s, 'sniper'),
    }, {
      id: 't_suisse',
      label: 'Tour-de-Suisse',
      desc: 'Au moins une scène par canton. Respect.',
      category: 'Scènes',
      check: s => has(s, 'tour_de_suisse'),
    }, {
      id: 't_unstop',
      label: "L'Inarrêtable",
      desc: 'Trois jours, trois combos. Tu n\'as pas dormi.',
      category: 'Scènes',
      check: s => has(s, 'unstoppable'),
    }, {
      id: 't_eu_tour',
      label: "Tour d'Europe",
      desc: 'Toutes les scènes EU. Le passeport est plein.',
      category: 'Scènes',
      check: s => has(s, 'eu_tour_europe'),
    },

    // ─────────── TP ───────────
    {
      id: 't_artisan',
      label: "L'Artisan",
      desc: '100 TP. Les hex te font des clins d\'œil.',
      category: 'TP',
      check: s => has(s, 'tp_100'),
    }, {
      id: 't_polymath_tp',
      label: 'Polymath TP',
      desc: 'Tu n\'as peur d\'aucun système de fichiers.',
      category: 'TP',
      check: s => has(s, 'tp_categories15'),
    }, {
      id: 't_maitre_disc',
      label: "Maître d'une Discipline",
      desc: '50 TP dans une seule catégorie. Spécialisation totale.',
      category: 'TP',
      check: s => has(s, 'tp_master_cat'),
    },

    // ─────────── Fiches ───────────
    {
      id: 't_etudiant',
      label: "L'Étudiant Assidu",
      desc: 'Trente fiches lues. Et tu en redemandes.',
      category: 'Fiches',
      check: s => has(s, 'fiche_30'),
    }, {
      id: 't_encyclopediste',
      label: "L'Encyclopédiste",
      desc: 'Toutes les fiches. Vraiment toutes.',
      category: 'Fiches',
      check: s => has(s, 'fiche_all'),
    },
  ];

  // Ordre des catégories pour l'affichage
  const CATEGORIES = ['Généraliste', 'Quiz', 'Scènes', 'TP', 'Fiches'];

  // ─────── Helpers ───────
  function has(snap, achievementId) {
    return Array.isArray(snap.achievements) && snap.achievements.includes(achievementId);
  }

  const _byId = {};
  TITLES.forEach(t => { _byId[t.id] = t; });

  function listAll() {
    return TITLES.slice();
  }

  function listUnlocked(snap) {
    if (!snap) return [];
    return TITLES.filter(t => {
      try { return !!t.check(snap); } catch (_) { return false; }
    });
  }

  function isUnlocked(id, snap) {
    const t = _byId[id];
    if (!t || !snap) return false;
    try { return !!t.check(snap); } catch (_) { return false; }
  }

  function getById(id) {
    return _byId[id] || null;
  }

  function byCategory() {
    const out = {};
    CATEGORIES.forEach(c => { out[c] = []; });
    TITLES.forEach(t => {
      if (!out[t.category]) out[t.category] = [];
      out[t.category].push(t);
    });
    return out;
  }

  /**
   * Récupère le titre actuellement équipé (ou null). Si un id est posé
   * mais que le titre n'est pas/plus débloqué, on retourne null
   * (sans toucher au stockage : le user peut redébloquer plus tard).
   */
  function getEquipped(snap) {
    if (!snap || !snap.preferences) return null;
    const id = snap.preferences.equippedTitle;
    if (!id) return null;
    const t = _byId[id];
    if (!t) return null;
    try {
      return t.check(snap) ? t : null;
    } catch (_) { return null; }
  }

  // Expose
  window.ProfileTitles = {
    listAll,
    listUnlocked,
    isUnlocked,
    getById,
    byCategory,
    getEquipped,
    CATEGORIES,
  };
})();
