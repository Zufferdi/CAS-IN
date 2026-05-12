/* ═══════════════════════════════════════════════════════════════
 * cas-in-skill-branches.js — v2.98 (refacto A2)
 *
 * Source de vérité partagée pour les 6 branches de compétences.
 * Auparavant dupliqué entre scene-app.js (SKILL_BRANCHES) et
 * scene-dossiers-v1.js (BRANCH_FILTERS) → désynchronisation
 * possible quand on ajoutait une branche d'un côté seulement.
 *
 * Doit être chargé AVANT scene-app.js et scene-dossiers-v1.js.
 * 
 * Expose :
 *   window.CasInSkillBranches = {
 *     ALL_BRANCHES: [...],        // les 6 branches
 *     FILTER_BRANCHES: [...],     // les 6 + "Toutes" en tête
 *     getBranchScenes(branch, allScenes)
 *     matchesBranch(scene, branchId)
 *   }
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.CasInSkillBranches) return;

  // Spec canonique des branches. Chaque branche peut être matchée par :
  //   - matchTags    : tags forcément présents dans scene.tags
  //   - matchRegion  : scene.region exact
  //   - matchAll     : matche n'importe quelle scène (pour "comportement")
  const ALL_BRANCHES = [
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
      matchTags: [],
      matchRegion: 'EU',
      badges: ['eu_first_mlat', 'eu_jit_master', 'eu_budapest_spec', 'eu_eurojust_vet', 'eu_tour_europe'],
    },
    {
      id: 'comportement', icon: '🎯', color: '#c084fc',
      title: 'Discipline & exploration',
      desc: 'Régularité, sans-faute, exploration de tous les cantons',
      matchTags: [],
      matchAll: true,
      badges: ['first_blood', 'rookie_5', 'veteran_10', 'completionist',
               'ethics_warden', 'ethics_knight', 'ethics_legend',
               'night_owl', 'early_bird', 'sniper', 'tour_de_suisse',
               'perseverant', 'unstoppable', 'historian'],
    },
  ];

  // Version "filtres" : les mêmes + un préfixe "Toutes"
  const FILTER_BRANCHES = [
    { id: 'all', label: 'Toutes', icon: '✦', matchAll: true },
    ...ALL_BRANCHES.map(b => ({
      id: b.id,
      label: b.title.split(/[&]/)[0].trim().split(' ').slice(0, 2).join(' '),  // label court
      icon: b.icon,
      matchTags: b.matchTags,
      matchRegion: b.matchRegion,
    })),
  ];

  // Helper : est-ce qu'une scène matche une branche donnée ?
  function matchesBranch(scene, branchId) {
    if (!scene) return false;
    if (branchId === 'all') return true;
    const b = ALL_BRANCHES.find(x => x.id === branchId)
           || FILTER_BRANCHES.find(x => x.id === branchId);
    if (!b) return false;
    if (b.matchAll) return true;
    if (b.matchRegion && scene.region === b.matchRegion) return true;
    if (b.matchTags && b.matchTags.length) {
      const tags = scene.tags || [];
      return tags.some(t => b.matchTags.includes(t));
    }
    return false;
  }

  // Helper : filtre toutes les scènes pour une branche
  function getBranchScenes(branch, allScenes) {
    if (!Array.isArray(allScenes)) return [];
    if (branch.matchAll) return allScenes.slice();
    if (branch.matchRegion) return allScenes.filter(s => s.region === branch.matchRegion);
    if (branch.matchTags && branch.matchTags.length) {
      return allScenes.filter(s => (s.tags || []).some(t => branch.matchTags.includes(t)));
    }
    return [];
  }

  window.CasInSkillBranches = {
    ALL_BRANCHES,
    FILTER_BRANCHES,
    matchesBranch,
    getBranchScenes,
  };
})();
