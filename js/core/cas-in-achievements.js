// ═══════════════════════════════════════════════════════════════
// cas-in-achievements.js — Métadonnées des succès (achievements)
//
// Source unique de la liste des achievements pour TOUTES les pages.
// Les fonctions `check` restent dans quiz-app.js (où elles sont évaluées).
// Ce module fournit uniquement {id, emoji, name, desc} pour l'affichage.
//
// Usage : window.ACHIEVEMENTS_META disponible globalement après chargement.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const ACHIEVEMENTS_META = [{
        id: 'first',
        emoji: '🎯',
        name: 'Premier pas',
        desc: 'Répondre à 1 question',
      }, {
        id: 'ten',
        emoji: '🔟',
        name: 'Décollage',
        desc: 'Répondre à 10 questions',
      }, {
        id: 'fifty',
        emoji: '5️⃣0️⃣',
        name: 'Cinquantaine',
        desc: 'Répondre à 50 questions',
      }, {
        id: 'hundred',
        emoji: '💯',
        name: 'Centurion',
        desc: 'Répondre à 100 questions',
      }, {
        id: 'five00',
        emoji: '🚀',
        name: 'Marathon',
        desc: 'Répondre à 500 questions',
      }, {
        id: 'thou',
        emoji: '🌟',
        name: 'Millénaire',
        desc: 'Répondre à 1000 questions',
      }, {
        id: 'twoK',
        emoji: '🔱',
        name: 'Légende vivante',
        desc: 'Répondre à 2000 questions',
      }, {
        id: 'streak1',
        emoji: '✊',
        name: 'La première',
        desc: '1 bonne réponse — ça commence toujours ainsi',
      }, {
        id: 'streak3',
        emoji: '⚡',
        name: 'C\'est parti !',
        desc: '3 bonnes réponses de suite',
      }, {
        id: 'streak5',
        emoji: '🔥',
        name: 'Série de feu',
        desc: '5 bonnes réponses de suite',
      }, {
        id: 'streak10',
        emoji: '💥',
        name: 'Inarrêtable',
        desc: '10 bonnes réponses de suite',
      }, {
        id: 'streak20',
        emoji: '🌋',
        name: 'Mode Dieu',
        desc: '20 bonnes réponses de suite',
      }, {
        id: 'streak50',
        emoji: '👑',
        name: 'Légende de la série',
        desc: '50 bonnes réponses de suite — irréel',
      }, {
        id: 'acc90',
        emoji: '🎓',
        name: 'Précision laser',
        desc: '90%+ sur 50 questions minimum',
      }, {
        id: 'acc95',
        emoji: '💎',
        name: 'Mode élite',
        desc: '95%+ sur 100 questions minimum',
      }, {
        id: 'perfect',
        emoji: '🏆',
        name: 'Examen parfait',
        desc: '100% à un examen ≥ 10 questions',
      }, {
        id: 'perfect20',
        emoji: '🎖️',
        name: 'Héros de l\'examen',
        desc: '100% à un examen ≥ 20 questions',
      }, {
        id: 'combo',
        emoji: '⚡',
        name: 'Combinaison ×2',
        desc: 'Atteindre le multiplicateur ×2',
      }, {
        id: 'combo3',
        emoji: '🔱',
        name: 'Triple Kill',
        desc: 'Atteindre le multiplicateur ×3',
      }, {
        id: 'hard10',
        emoji: '💀',
        name: 'Masochiste',
        desc: '10 questions difficiles correctes',
      }, {
        id: 'hard50',
        emoji: '🔥',
        name: 'Cherche la douleur',
        desc: '50 questions difficiles correctes',
      }, {
        id: 'daily3',
        emoji: '📅',
        name: 'Régularité',
        desc: 'Jouer 3 jours de suite',
      }, {
        id: 'daily7',
        emoji: '🗓️',
        name: 'Abonné',
        desc: 'Jouer 7 jours de suite',
      }, {
        id: 'daily10',
        emoji: '🔟',
        name: 'Double semaine',
        desc: 'Jouer 10 jours de suite',
      }, {
        id: 'daily14',
        emoji: '📆',
        name: 'Quinzaine',
        desc: 'Jouer 14 jours de suite',
      }, {
        id: 'daily30',
        emoji: '🏅',
        name: 'Mensuel',
        desc: 'Jouer 30 jours de suite — respect total',
      }, {
        id: 'night',
        emoji: '🌙',
        name: 'Nuit blanche',
        desc: 'Jouer après minuit — l\'enquête attend',
      }, {
        id: 'comeback',
        emoji: '🦋',
        name: 'Come-back',
        desc: '5 bonnes réponses après 3 mauvaises',
      }, {
        id: 'allthemes',
        emoji: '🗺️',
        name: 'Polymathes',
        desc: 'Questions répondues dans 5 thèmes différents',
      }, {
        id: 'book10',
        emoji: '⭐',
        name: 'Collectionneur',
        desc: '10 questions mises en favoris',
      }, {
        id: 'book25',
        emoji: '📚',
        name: 'Bibliothécaire',
        desc: '25 questions mises en favoris',
      }, {
        id: 'smart50',
        emoji: '🧠',
        name: 'Révision ×50',
        desc: '50 questions en mode Révision Intelligente',
      }, {
        id: 'smart200',
        emoji: '🤖',
        name: 'Machine de révision',
        desc: '200 questions en mode Révision Intelligente',
      }, {
        id: 'daily_ch',
        emoji: '⚡',
        name: 'Défi relevé',
        desc: 'Terminer le défi du jour',
      }, {
        id: 'hint',
        emoji: '💡',
        name: 'J\'avais besoin d\'un coup de pouce',
        desc: 'Utiliser un indice',
      }, {
        id: 's_3am',
        emoji: '🦇',
        name: '???',
        desc: '???',
        secret: true,
      }, {
        id: 's_42',
        emoji: '🌌',
        name: '???',
        desc: '???',
        secret: true,
      }, {
        id: 's_13',
        emoji: '🎱',
        name: '???',
        desc: '???',
        secret: true,
      }, {
        id: 's_hints3',
        emoji: '🧙',
        name: '???',
        desc: '???',
        secret: true,
      }, {
        id: 's_speed5',
        emoji: '🏎️',
        name: '???',
        desc: '???',
        secret: true,
      }, {
        id: 's_skip',
        emoji: '🙈',
        name: '???',
        desc: '???',
        secret: true,
      }, ];

  // Expose au global pour profile-page.js et autres consommateurs
  window.ACHIEVEMENTS_META = ACHIEVEMENTS_META;

  // Backward-compat : si window.ACHIEVEMENTS n'est pas (encore) défini
  // par quiz-app.js (page profile par exemple), on fournit la metadata
  // pour que renderAchievements() trouve nom/emoji/desc.
  if (typeof window.ACHIEVEMENTS === 'undefined') {
    window.ACHIEVEMENTS = ACHIEVEMENTS_META;
  }
})();
