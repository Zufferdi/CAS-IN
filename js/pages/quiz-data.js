// ═══════════════════════════════════════════════════════════════
// quiz-data.js — Constantes data du quiz (extraites de quiz-app.js)
//
// Ce fichier contient les TABLEAUX/OBJETS de DATA PURE consommés par
// quiz-app.js. Aucune logique de runtime ici, juste des configurations.
//
// Ordre de chargement : DOIT être chargé AVANT quiz-app.js.
//
// Extraction v2.13 : ~1500 lignes déplacées depuis quiz-app.js pour
// alléger le fichier principal et améliorer le caching séparé.
// Les constantes restent globales (window.*) car quiz-app.js est non-IIFE
// et les utilise directement.
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// RANKS legacy (Abby Sciuto, Sherlock Holmes, etc.) — DÉSACTIVÉ en v2.61
//
// Ce tableau a été remplacé par le système Profile.tracks (4 carrières
// avec ~15 rangs chacune, basé sur l'XP TOTALE du profil et non plus sur
// l'XP cumulée du quiz uniquement).
//
// Le module quiz-ranks.js (v2.61) lit désormais les rangs depuis
// Profile.snapshot().rank et Profile.getAllRanks(trackKey).
//
// On garde un tableau vide ici pour la rétrocompatibilité avec les
// références encore présentes dans quiz-app.js (RANKS[idx], RANKS.find,
// etc.) — quiz-ranks.js a un fallback qui gère ce cas gracieusement.
//
// Le bloc original (~26 entrées, ~111 KB) a été supprimé ; pour
// l'historique voir docs/CHANGELOG.md v2.61 et l'archive git.
// ═══════════════════════════════════════════════════════════════
const RANKS = [];


const MISSION_PHASES = [
  {
    num: 1, icon: '🔍', color: '#00e5cc',
    title: "Identification sur scène",
    desc: "Arrivée sur les lieux — identification des équipements, évaluation des risques, premières décisions critiques.",
    chapters: ["Technologie des disques","Représentation des données","Formats de fichiers et Magic Bytes","Méthodologie forensique","Méthodologie et bonnes pratiques"],
    questions_per_phase: 5,
  },
  {
    num: 2, icon: '📷', color: '#58a6ff',
    title: "Acquisition forensique",
    desc: "Sécurisation et copie des preuves numériques — intégrité, write blocker, formats d'image, hash.",
    chapters: ["Acquisition et préservation","Artefacts temporels et MAC times","Logiciels et outils forensiques"],
    questions_per_phase: 5,
  },
  {
    num: 3, icon: '💾', color: '#7affea',
    title: "Analyse système de fichiers",
    desc: "Examen des structures FAT, NTFS, exFAT, EXT — récupération de données, timestamps, entrées supprimées.",
    chapters: ["FAT12 / FAT16 / FAT32","exFAT","NTFS","EXT2 / EXT3 / EXT4","HFS+ et APFS"],
    questions_per_phase: 5,
  },
  {
    num: 4, icon: '🖥', color: '#ff6b9d',
    title: "Analyse artefacts OS",
    desc: "Registre Windows, prefetch, event logs, artefacts macOS et Linux — preuves d'exécution et d'accès.",
    chapters: ["Windows — Artefacts et exécution","Windows — Registre et artefacts","Windows — Journaux et Event Logs","macOS — Artefacts et analyse","Linux — Artefacts et analyse"],
    questions_per_phase: 5,
  },
  {
    num: 5, icon: '🔐', color: '#f0c040',
    title: "Cryptologie et réseau",
    desc: "Chiffrement, hachage, protocoles réseau, OSINT technique — attribution et identification de l'acteur.",
    chapters: ["Chiffrement symétrique","Chiffrement asymétrique et RSA","PKI et certificats","Hachage et intégrité","Réseau, protocoles et Internet","Infrastructure, DNS et pivots","Adressage IP","Cassage et attaques"],
    questions_per_phase: 5,
  },
  {
    num: 6, icon: '⚖', color: '#ff8c42',
    title: "Rapport et droit",
    desc: "Rédaction de l'expertise, procédure pénale suisse, perquisition, séquestre, entraide internationale.",
    chapters: ["Procédure pénale","Perquisition de documents","Séquestre informatique","Droit pénal informatique","Expertise et rapport judiciaire","Entraide judiciaire internationale"],
    questions_per_phase: 5,
  },
];

// ═══════════════════════════════════════════════════════════════
// SECTION v2.21 — Migration depuis quiz-app.js
//   Ces constantes étaient restées dans quiz-app.js ; déplacées ici
//   pour cohérence avec le reste des données statiques.
// ═══════════════════════════════════════════════════════════════

      const DIFF_LABELS = {
        easy: 'Facile',
        medium: 'Moyen',
        hard: 'Difficile'
      };
      const DIFF_PTS = {
        easy: 1,
        medium: 2,
        hard: 3
      };
      const TC = {
        'Informatique de base': '#7ab8ff',
        'Acquisition et analyse': '#00e5cc',
        'Système de fichiers': '#7affea',
        'Spécificité des OS': '#ff6b9d',
        'Cryptologie': '#f0c040',
        'OSINT': '#ffd580',
        'Droit': '#ff8c42',
        'Forensique': '#fb923c'
      };

      const ACHIEVEMENTS = [{
        id: 'first',
        emoji: '🎯',
        name: 'Premier pas',
        desc: 'Répondre à 1 question',
        check: s => s.total >= 1
      }, {
        id: 'ten',
        emoji: '🔟',
        name: 'Décollage',
        desc: 'Répondre à 10 questions',
        check: s => s.total >= 10
      }, {
        id: 'fifty',
        emoji: '5️⃣0️⃣',
        name: 'Cinquantaine',
        desc: 'Répondre à 50 questions',
        check: s => s.total >= 50
      }, {
        id: 'hundred',
        emoji: '💯',
        name: 'Centurion',
        desc: 'Répondre à 100 questions',
        check: s => s.total >= 100
      }, {
        id: 'five00',
        emoji: '🚀',
        name: 'Marathon',
        desc: 'Répondre à 500 questions',
        check: s => s.total >= 500
      }, {
        id: 'thou',
        emoji: '🌟',
        name: 'Millénaire',
        desc: 'Répondre à 1000 questions',
        check: s => s.total >= 1000
      }, {
        id: 'twoK',
        emoji: '🔱',
        name: 'Légende vivante',
        desc: 'Répondre à 2000 questions',
        check: s => s.total >= 2000
      }, {
        id: 'streak1',
        emoji: '✊',
        name: 'La première',
        desc: '1 bonne réponse — ça commence toujours ainsi',
        check: s => s.streak >= 1
      }, {
        id: 'streak3',
        emoji: '⚡',
        name: 'C\'est parti !',
        desc: '3 bonnes réponses de suite',
        check: s => s.streak >= 3
      }, {
        id: 'streak5',
        emoji: '🔥',
        name: 'Série de feu',
        desc: '5 bonnes réponses de suite',
        check: s => s.streak >= 5
      }, {
        id: 'streak10',
        emoji: '💥',
        name: 'Inarrêtable',
        desc: '10 bonnes réponses de suite',
        check: s => s.streak >= 10
      }, {
        id: 'streak20',
        emoji: '🌋',
        name: 'Mode Dieu',
        desc: '20 bonnes réponses de suite',
        check: s => s.streak >= 20
      }, {
        id: 'streak50',
        emoji: '👑',
        name: 'Légende de la série',
        desc: '50 bonnes réponses de suite — irréel',
        check: s => s.streak >= 50
      }, {
        id: 'acc90',
        emoji: '🎓',
        name: 'Précision laser',
        desc: '90%+ sur 50 questions minimum',
        check: s => s.total >= 50 && Math.round(s.correct / s.total * 100) >= 90
      }, {
        id: 'acc95',
        emoji: '💎',
        name: 'Mode élite',
        desc: '95%+ sur 100 questions minimum',
        check: s => s.total >= 100 && Math.round(s.correct / s.total * 100) >= 95
      }, {
        id: 'perfect',
        emoji: '🏆',
        name: 'Examen parfait',
        desc: '100% à un examen ≥ 10 questions',
        check: s => s.perfectExam
      }, {
        id: 'perfect20',
        emoji: '🎖️',
        name: 'Héros de l\'examen',
        desc: '100% à un examen ≥ 20 questions',
        check: s => s.perfectExam20
      }, {
        id: 'combo',
        emoji: '⚡',
        name: 'Combinaison ×2',
        desc: 'Atteindre le multiplicateur ×2',
        check: s => s.maxCombo >= 6
      }, {
        id: 'combo3',
        emoji: '🔱',
        name: 'Triple Kill',
        desc: 'Atteindre le multiplicateur ×3',
        check: s => s.maxCombo >= 12
      }, {
        id: 'hard10',
        emoji: '💀',
        name: 'Masochiste',
        desc: '10 questions difficiles correctes',
        check: s => (s.byDiff.hard?.ok || 0) >= 10
      }, {
        id: 'hard50',
        emoji: '🔥',
        name: 'Cherche la douleur',
        desc: '50 questions difficiles correctes',
        check: s => (s.byDiff.hard?.ok || 0) >= 50
      }, {
        id: 'daily3',
        emoji: '📅',
        name: 'Régularité',
        desc: 'Jouer 3 jours de suite',
        check: s => s.dayStreak >= 3
      }, {
        id: 'daily7',
        emoji: '🗓️',
        name: 'Abonné',
        desc: 'Jouer 7 jours de suite',
        check: s => s.dayStreak >= 7
      }, {
        id: 'daily10',
        emoji: '🔟',
        name: 'Double semaine',
        desc: 'Jouer 10 jours de suite',
        check: s => s.dayStreak >= 10
      }, {
        id: 'daily14',
        emoji: '📆',
        name: 'Quinzaine',
        desc: 'Jouer 14 jours de suite',
        check: s => s.dayStreak >= 14
      }, {
        id: 'daily30',
        emoji: '🏅',
        name: 'Mensuel',
        desc: 'Jouer 30 jours de suite — respect total',
        check: s => s.dayStreak >= 30
      }, {
        id: 'night',
        emoji: '🌙',
        name: 'Nuit blanche',
        desc: 'Jouer après minuit — l\'enquête attend',
        check: s => s.nightOwl
      }, {
        id: 'comeback',
        emoji: '🦋',
        name: 'Come-back',
        desc: '5 bonnes réponses après 3 mauvaises',
        check: s => s.comeback
      }, {
        id: 'allthemes',
        emoji: '🗺️',
        name: 'Polymathes',
        desc: 'Questions répondues dans 5 thèmes différents',
        check: s => Object.values(s.byTheme).filter(t => t.tot > 0).length >= 5
      }, {
        id: 'book10',
        emoji: '⭐',
        name: 'Collectionneur',
        desc: '10 questions mises en favoris',
        check: s => s.bookmarks.size >= 10
      }, {
        id: 'book25',
        emoji: '📚',
        name: 'Bibliothécaire',
        desc: '25 questions mises en favoris',
        check: s => s.bookmarks.size >= 25
      }, {
        id: 'smart50',
        emoji: '🧠',
        name: 'Révision ×50',
        desc: '50 questions en mode Révision Intelligente',
        check: s => s.smartCount >= 50
      }, {
        id: 'smart200',
        emoji: '🤖',
        name: 'Machine de révision',
        desc: '200 questions en mode Révision Intelligente',
        check: s => s.smartCount >= 200
      }, {
        id: 'daily_ch',
        emoji: '⚡',
        name: 'Défi relevé',
        desc: 'Terminer le défi du jour',
        check: s => s.dailyDone
      }, {
        id: 'hint',
        emoji: '💡',
        name: 'J\'avais besoin d\'un coup de pouce',
        desc: 'Utiliser un indice',
        check: s => s.hintsUsed >= 1
      }, {
        id: 's_3am',
        emoji: '🦇',
        name: '???',
        desc: '???',
        secret: true,
        check: s => s._secretFlags?.at3am
      }, {
        id: 's_42',
        emoji: '🌌',
        name: '???',
        desc: '???',
        secret: true,
        check: s => s._secretFlags?.exam42
      }, {
        id: 's_13',
        emoji: '🎱',
        name: '???',
        desc: '???',
        secret: true,
        check: s => s._secretFlags?.streak13
      }, {
        id: 's_hints3',
        emoji: '🧙',
        name: '???',
        desc: '???',
        secret: true,
        check: s => s._secretFlags?.hints3day
      }, {
        id: 's_speed5',
        emoji: '🏎️',
        name: '???',
        desc: '???',
        secret: true,
        check: s => s._secretFlags?.speed5row
      }, {
        id: 's_skip',
        emoji: '🙈',
        name: '???',
        desc: '???',
        secret: true,
        check: s => s._secretFlags?.skip20
      }, ];



      const STREAK_MSGS = {
        1: '⚡ 1 — ça commence !',
        2: '⚡ 2 de suite !',
        3: '⚡ 3 d\'affilée !',
        5: '🔥 5 en série !',
        7: '🔥 7 ! Tu brûles !',
        10: '🔥🔥 10 de suite !',
        12: '💥 12 ! Inarrêtable !',
        15: '💥 15 ! On est chauds !',
        20: '🚀 20 ! Mode Dieu !',
        25: '🌋 25 ! Mythe vivant !',
        30: '👑 30 ! LÉGENDE !',
        50: '🏆 50 ! IMPOSSIBLE… et pourtant.',
        75: '🏆 75 ! Banzaï ! On est bons.',
      };
