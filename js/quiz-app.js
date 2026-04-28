// ═══════════════════════════════════════════════════════════════
// quiz-app.js — Logique principale du quiz CAS-IN
//
// Extrait de quiz.html v2.4 → fichier séparé pour :
//   • Cache navigateur séparé du HTML (les corrections rapides du HTML
//     ne forcent plus le re-téléchargement de 365 KB de JS)
//   • Source map et debug
//   • Gzip plus efficace sur du JS pur
//   • Versioning indépendant via le Service Worker
//
// IMPORTANT : ce fichier est intentionnellement non-IIFE.
// Toutes les fonctions exposées via onclick="..." dans le HTML
// (renderQuestion, validate, openSettings, …) doivent rester
// globales (window.*). Ne pas wrapper.
//
// Sections (utilise Cmd-F dans ton éditeur) :
//   1. CONSTANTES         — DIFF_LABELS, RANKS, ACHIEVEMENTS, MILESTONES, …
//   2. PERSONAS / TIPS    — FORENSIC_QUOTES, PERSONAS, FORENSIC_TIPS, AVATAR_EMOJIS
//   3. CŒUR DU QUIZ       — renderQuestion, validate, doSkip, nextQuestion
//   4. UI MODALES         — openExplModal, openSettings, openHelp, openBilan
//   5. EXAM / SURVIE      — openExam, startExam, examNext, showExamResults, lives
//   6. GAMIFICATION       — XP, rangs, streak, combo, achievements, milestones
//   7. SM2                — getSM2Data, updateSM2, getSM2Due, activateSM2Mode
//   8. RADAR & GLOSSAIRE  — drawRadar, GLOSSARY, initGlossary
//   9. SHARE CARD         — drawShareCard, downloadShareCard, shareNative
//  10. MID-SESSION        — maybeTriggerMidSession, MID_TIPS
//  11. MODES SECRETS      — God Mode (Konami), Double-or-Nothing
//  12. UTILS               — applyFontSize, sanitizeHTML, saveSessionSnapshot
//
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
      const RANKS = [{
        name: '🔰 Stagiaire',
        min: 0,
        emoji: '🔰',
        flavor: 'Premier jour. Le café est dans la salle de pause.'
      }, {
        name: '📝 Analyste junior',
        min: 75,
        emoji: '📝',
        flavor: 'Tu sais déjà ouvrir un rapport sans paniquer.'
      }, {
        name: '🕵️ Inspecteur Morse',
        min: 150,
        emoji: '🕵️',
        flavor: 'L\'instinct commence à s\'éveiller.'
      }, {
        name: '🔍 Enquêteur terrain',
        min: 250,
        emoji: '🔍',
        flavor: 'Chaque détail commence à compter.'
      }, {
        name: '💻 Elliot Alderson Jr.',
        min: 400,
        emoji: '💻',
        flavor: 'Mr. Robot niveau 1. fsociety approve.'
      }, {
        name: '⌨️ Pentester amateur',
        min: 650,
        emoji: '⌨️',
        flavor: 'Tu tapes plus vite que ton ombre.'
      }, {
        name: '🔬 Abby Sciuto',
        min: 900,
        emoji: '🔬',
        flavor: 'Reine du labo forensique. CafPow obligatoire.'
      }, {
        name: '🧪 Analyste forensic',
        min: 1300,
        emoji: '🧪',
        flavor: 'Les artefacts n\'ont plus de secrets.'
      }, {
        name: '🦴 Dr Temperance Brennan',
        min: 1800,
        emoji: '🦴',
        flavor: 'Les os parlent. Et ils ne mentent jamais.'
      }, {
        name: '📚 Profiler certifié',
        min: 2600,
        emoji: '📚',
        flavor: 'Lecture comportementale activée.'
      }, {
        name: '🧠 Spencer Reid',
        min: 3500,
        emoji: '🧠',
        flavor: 'QI 187. Mémoire photographique. Tout.'
      }, {
        name: '💀 Expert',
        min: 6500,
        emoji: '💀',
        flavor: 'Locard Exchange Principle : maîtrisé.'
      }, {
        name: '🛡️ Chef d\'unité',
        min: 8500,
        emoji: '🛡️',
        flavor: 'Tu diriges désormais les opérations.'
      }, {
        name: '🔍 Sherlock Holmes',
        min: 11000,
        emoji: '🔍',
        flavor: 'Élémentaire, mon cher Watson.'
      }, {
        name: '🕶️ Ghost Analyst',
        min: 14500,
        emoji: '🕶️',
        flavor: 'Invisible, méthodique, implacable.'
      }, {
        name: '🦹 Lisbeth Salander',
        min: 18000,
        emoji: '🦹',
        flavor: 'Le dragon tatoué. Rien ne résiste.'
      }, {
        name: '⚔️ Cyber Hunter',
        min: 23000,
        emoji: '⚔️',
        flavor: 'Prédateur des menaces numériques.'
      }, {
        name: '⚖️ Maître Locard',
        min: 28000,
        emoji: '⚖️',
        flavor: 'Père de la criminalistique. 1910.'
      }, {
        name: '🧬 Alan Turing',
        min: 42000,
        emoji: '🧬',
        flavor: 'Père de l\'informatique. Indéchiffrable.'
      }, {
        name: '👑 Grand Maître DFIR',
        min: 52000,
        emoji: '👑',
        flavor: 'Ton expertise fait jurisprudence.'
      }, {
        name: '👑 Maître RR',
        min: 65000,
        emoji: '👑',
        flavor: 'Au-delà de la légende. C\'est toi la légende.'
      }, ];
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
      const MILESTONES = [{
        id: 'm50',
        emoji: '🦉',
        title: 'BIEN JOUÉ !',
        sub: 'Never Out Of Sight !',
        minQ: 50,
        minAcc: 75
      }, {
        id: 'm90',
        emoji: '🏆',
        title: 'EXCEPTIONNEL !',
        sub: 'Maîtrise parfaite',
        minQ: 50,
        minAcc: 90
      }, {
        id: 'm100',
        emoji: '💯',
        title: 'CENTAINE !',
        sub: '100 questions, pas tremblé !',
        minQ: 100,
        minAcc: 75
      }, {
        id: 'm200',
        emoji: '🎯',
        title: 'MARATHON',
        sub: '200 questions répondues !',
        minQ: 200,
        minAcc: 70
      }, {
        id: 'm500',
        emoji: '🚀',
        title: '500 QUESTIONS !',
        sub: 'Tu es un monstre.',
        minQ: 500,
        minAcc: 65
      }, {
        id: 'm1000',
        emoji: '🌟',
        title: 'MILLÉNAIRE !',
        sub: '1000 questions. La légende commence.',
        minQ: 1000,
        minAcc: 60
      }, {
        id: 'ms10',
        emoji: '🔥',
        title: 'SÉRIE ×10 !',
        sub: '10 bonnes réponses d\'affilée !',
        streakOnly: true,
        minStreak: 10
      }, {
        id: 'ms20',
        emoji: '🌋',
        title: 'SÉRIE ×20 !',
        sub: '20 de suite ! Mode Dieu activé.',
        streakOnly: true,
        minStreak: 20
      }, {
        id: 'ms50',
        emoji: '👑',
        title: 'SÉRIE ×50 !',
        sub: '50 de suite. C\'est impossible… et pourtant.',
        streakOnly: true,
        minStreak: 50
      }, {
        id: 'rank1',
        emoji: '🕵️',
        title: 'INSPECTEUR MORSE !',
        sub: 'L\'instinct commence à te guider.',
        rankMin: 1
      }, {
        id: 'rank2',
        emoji: '💻',
        title: 'ELLIOT ALDERSON !',
        sub: 'fsociety s\'incline.',
        rankMin: 2
      }, {
        id: 'rank3',
        emoji: '🔬',
        title: 'ABBY SCIUTO !',
        sub: 'Welcome to the forensic lab !',
        rankMin: 3
      }, {
        id: 'rank5',
        emoji: '🧠',
        title: 'SPENCER REID !',
        sub: 'QI 187. Mémoire photographique.',
        rankMin: 5
      }, {
        id: 'rank7',
        emoji: '🔍',
        title: 'SHERLOCK HOLMES !',
        sub: 'Élémentaire, mon cher Watson.',
        rankMin: 7
      }, {
        id: 'rank9',
        emoji: '⚖️',
        title: 'MAÎTRE LOCARD !',
        sub: 'Tout contact laisse une trace.',
        rankMin: 9
      }, {
        id: 'rank11',
        emoji: '👑',
        title: 'MAÎTRE RR !',
        sub: 'Au sommet absolu. Tu es la trace.',
        rankMin: 11
      }, ];
      const FEEDBACK_OK = ['✅ Exact !',
  '✅ Parfait !',
  '✅ Bien vu !',
  '✅ Nickel !',
  '✅ Dans le mille !',
  '✅ Correct !',
  '✅ Chapeau !',
  '✅ Bravo !',
  '✅ Excellent !',
  '✅ Impeccable !',
  '✅ Solide réponse !',
  '✅ Bien joué !',
  '✅ Rien à redire !',
  '✅ Réponse validée.',
  '✅ Analyse confirmée.',
  '✅ Locard approuve !',
  '✅ Élémentaire, mon cher.',
  '✅ Le labo confirme !',
  '✅ Preuve recevable en justice.',
  '✅ Rapport validé par le juge.',
  '✅ Expertise approuvée.',
  '✅ Dossier bouclé.',
  '✅ Témoignage crédible.',
  '✅ Enquête validée.',
  '✅ DFIR validé !',
  '✅ Analyse forensic conforme.',
  '✅ Acquisition certifiée.',
  '✅ Abby Sciuto dirait la même chose.',
  '✅ Le MFT ne ment pas !',
  '✅ 0xE5 pour les autres, correct pour toi.',
  '✅ La chaîne de custody est intacte.',
  '✅ Hash vérifié.',
  '✅ Intégrité confirmée.',
  '✅ X-Ways confirme !',
  '✅ Autopsy approuve.',
  '✅ Wireshark applaudit.',
  '✅ Sherlock est jaloux.',
  '✅ Bien décodé, Elliot.',
  '✅ Spencer Reid acquiesce.',
  '✅ Brennan valide l’analyse.',
  '✅ Le malware est neutralisé.',
  '✅ Le suspect avoue.',
  '✅ L’alibi tient.',
  '✅ Aucun doute raisonnable.',
  '✅ Acquisition propre.',
  '✅ Analyse impeccable.',
  '✅ Trace confirmée.',
  '✅ Empreinte concordante.',
  '✅ Corrélation parfaite.',
  '✅ Signature identifiée.',
  '✅ Aucun faux positif.',
  '✅ L’artefact parle de lui-même.',
  '✅ Le jury est convaincu.',
  '✅ Expertise incontestable.',
  '✅ Cas résolu.',
  '✅ Affaire classée.',
  '✅ Le tribunal acquiesce.',
  '✅ L’enquête avance bien.',
  '✅ Aucun appel nécessaire.',
  '✅ Le rapport part à l’impression.',
  '✅ Le parquet valide.',
  '✅ L’hexadécimal te respecte.',
  '✅ Les octets s’inclinent.',
  '✅ Le registre confirme.',
  '✅ Le Prefetch t’applaudit.',
  '✅ Le hash matche parfaitement.',
  '✅ Signature numérique validée.',
  '✅ Corrélé comme un SIEM.',
  '✅ IOC confirmé.',
  '✅ Beacon neutralisé.',
  '✅ Malware identifié.',
  '✅ Le C2 est coupé.',
  '✅ Packet analysé avec succès.',
  '✅ RAM dump approuvé.',
  '✅ Le suspect transpire.',
  '✅ Watson prend des notes.',
  '✅ Moriarty est contrarié.',
  '✅ Batman t’embauche.',
  '✅ Neo voit la matrice.',
  '✅ Le mode expert est activé.',
  '✅ Verdict favorable.', ];
      const FEEDBACK_KO = ['❌ Raté !',
  '❌ Faux positif détecté.',
  '❌ Résultat rejeté par le labo.',
  '❌ Conclusion invalide.',
  '❌ Hypothèse abandonnée.',
  '❌ Analyse hors périmètre.',
  '❌ Données insuffisantes.',
  '❌ Corrélation échouée.',
  '❌ Signature absente.',
  '❌ Aucune trace exploitable.',
  '❌ Artefact non authentifié.',
  '❌ Chaîne d’analyse interrompue.',
  '❌ Intégrité compromise.',
  '❌ Hash mismatch détecté.',
  '❌ Checksum invalide.',
  '❌ Donnée corrompue.',
  '❌ Segment mémoire inexploitable.',
  '❌ Dump RAM illisible.',
  '❌ Indexation échouée.',
  '❌ Parsing impossible.',
  '❌ Requête rejetée par le système.',
  '❌ Accès refusé aux preuves.',
  '❌ IOC non confirmé.',
  '❌ Aucune activité suspecte détectée.',
  '❌ Beacon non identifié.',
  '❌ C2 introuvable.',
  '❌ Trafic réseau non concluant.',
  '❌ Packet drop intellectuel.',
  '❌ Logs insuffisants pour conclure.',
  '❌ Timeline incohérente.',
  '❌ Chronologie cassée.',
  '❌ Mauvaise interprétation des logs.',
  '❌ Registre Windows non concordant.',
  '❌ Prefetch inexploitable.',
  '❌ ShimCache silencieux.',
  '❌ Amcache vide de sens.',
  '❌ OSINT sans résultat.',
  '❌ Source non fiable.',
  '❌ Mauvaise piste OSINT.',
  '❌ OSINT trop bruité.',
  '❌ Sherlock secoue la tête.',
  '❌ Watson abandonne.',
  '❌ Spock désapprouve.',
  '❌ HAL refuse de répondre.',
  '❌ Neo se trompe de réalité.',
  '❌ Batman rentre au commissariat.',
  '❌ Moriarty sourit.',
  '❌ Le juge clôt l’affaire.',
  '❌ Verdict défavorable.',
  '❌ Défense victorieuse.',
  '❌ Dossier classé sans suite.',
  '❌ Retour à la case départ.',
  '❌ Niveau d’investigation insuffisant.',
  '❌ Analyse abandonnée.',
  '❌ Le laboratoire refuse de valider.',
  '❌ Pas tout à fait…',
  '❌ Incorrect',
  '❌ Presque, mais non.',
  '❌ À retravailler !',
  '❌ Nope.',
  '❌ Dommage…',
  '❌ La chaîne de custody est rompue.',
  '❌ Le juge n\'est pas convaincu.',
  '❌ Locard se retourne dans sa tombe.',
  '❌ Retour au cours !',
  '❌ Sherlock aurait trouvé.',
  '❌ La défense l\'emporte.',
  '❌ Acquitté faute de preuve.',
  '❌ 0xE5 — supprimé de ta mémoire.',
  '❌ Preuve irrecevable.',
  '❌ Analyse contaminée.',
  '❌ Empreinte non concordante.',
  '❌ Résultat non concluant.',
  '❌ Rapport d’expertise rejeté.',
  '❌ Hypothèse invalidée.',
  '❌ Artefact mal interprété.',
  '❌ Mauvaise corrélation temporelle.',
  '❌ Trace inexploitable.',
  '❌ Échantillon compromis.',
  '❌ Ton alibi ne tient pas.',
  '❌ Mauvaise piste.',
  '❌ Le suspect rigole.',
  '❌ Cette réponse est en garde à vue.',
  '❌ Interrogatoire à recommencer.',
  '❌ Mauvais flair d’enquêteur.',
  '❌ Le stagiaire du labo fait mieux.',
  '❌ Même Watson doute de toi.',
  '❌ La BAC est déçue.',
  '❌ On a connu de meilleurs témoins.',
  '❌ Moriarty applaudit ton erreur.',
  '❌ Dexter n’aurait pas validé.',
  '❌ Gibbs te retire ton badge.',
  '❌ Reid hausse un sourcil.',
  '❌ Batman est déçu.',
  '❌ La Force n’était pas avec toi.',
  '❌ This is not the answer you’re looking for.',
  '❌ Game over, investigator.',
  '❌ Le doute raisonnable subsiste.',
  '❌ Le jury délibère… et refuse.',
  '❌ Ton expertise est contestée.',
  '❌ Mauvaise lecture de la scène de crime.',
  '❌ Le rapport part au broyeur.',
  '❌ Affaire classée sans suite.', ];
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
      const VISUAL_THEMES = [{
        id: 'default',
        name: 'CAS-IN Dark',
        desc: 'Thème original',
        colors: ['#060b12',
  '#00e5cc',
  '#f0c040']
      }, {
        id: 'hacker',
        name: 'Hacker Green',
        desc: 'Débloqué à 200 XP',
        colors: ['#000800',
  '#00ff41',
  '#aaff00'],
        minXp: 200
      }, {
        id: 'crimson',
        name: 'Crimson Lab',
        desc: 'Débloqué à 600 XP',
        colors: ['#120006',
  '#ff2060',
  '#ff8c42'],
        minXp: 600
      }, {
        id: 'retro',
        name: 'Retro Terminal',
        desc: 'Débloqué à 1500 XP',
        colors: ['#0a0800',
  '#ffcc00',
  '#ff8800'],
        minXp: 1500
      }, {
        id: 'blueprint',
        name: 'Blueprint',
        desc: 'Thème clair technique',
        colors: ['#f0f4f8',
  '#1a5fa8',
  '#b06000']
      }, ];
      const FORENSIC_QUOTES = [{
        q: "Tout contact laisse une trace.",
        a: "Edmond Locard"
      }, {
        q: "When you eliminate the impossible, whatever remains must be the truth.",
        a: "Sherlock Holmes"
      }, {
        q: "Data! Data! Data! I can't make bricks without clay!",
        a: "Sherlock Holmes"
      }, {
        q: "Hash first, ask questions later.",
        a: "1er commandement DFIR"
      }, {
        q: "Evidence never lies. People do.",
        a: "Proverbe forensique"
      }, {
        q: "Un fichier supprimé n'est pas un fichier perdu.",
        a: "Forensique FAT"
      }, {
        q: "In God we trust. All others bring data.",
        a: "W. Edwards Deming"
      }, {
        q: "Le diable est dans les détails — et dans les métadonnées.",
        a: "Proverbe DFIR"
      }, {
        q: "The digital trail never lies.",
        a: "Analyse forensique"
      }, {
        q: "We are all suspects until proven innocent by the data.",
        a: "Kevin Mitnick"
      }, {
        q: "There is no patch for human stupidity.",
        a: "Kevin Mitnick"
      }, {
        q: "Les octets ne mentent pas. Les humains, si.",
        a: "Analyste anonyme"
      }, {
        q: "Écrire avant d'exécuter. Photographier avant de toucher.",
        a: "Chaîne de custody"
      }, {
        q: "On est bons?",
        a: "Romain Roubaty"
      }, {
        q: "0xE5 ne signifie pas disparu. Ça signifie caché.",
        a: "FAT Forensics 101"
      }, {
        q: "L'internet n'est pas écrit au crayon, Mark. C'est écrit à l'encre.",
        a: "Erica Albright"
      }, {
        q: "Les preuves parlent en données.",
        a: "CAS-IN 25-26"
      }, {
        q: "Les hommes oublient, les serveurs se souviennent.",
        a: "CAS-IN 25-26"
      }, {
        q: "Un disque dur parle mieux qu’un témoin.",
        a: "CAS-IN 25-26"
      }, {
        q: "Les alibis s’effacent, les logs restent.",
        a: "CAS-IN 25-26"
      }, {
        q: "Derrière chaque écran, une trace.",
        a: "CAS-IN 25-26"
      }, {
        q: "Chaque octet peut devenir un indice.",
        a: "CAS-IN 25-26"
      }, {
        q: "On ne lit pas les pensées, on lit les disques.",
        a: "CAS-IN 25-26"
      }, ];
      const PERSONAS = [{
        id: 'stagiaire',
        icon: '🔰',
        label: 'Stagiaire',
        desc: 'Questions faciles uniquement',
        diffs: ['easy']
      }, {
        id: 'analyste',
        icon: '🔬',
        label: 'Analyste',
        desc: 'Facile + Moyen',
        diffs: ['easy',
  'medium']
      }, {
        id: 'enqueteur',
        icon: '🕵️',
        label: 'Enquêteur',
        desc: 'Moyen + Difficile',
        diffs: ['medium',
  'hard']
      }, {
        id: 'expert',
        icon: '⚖️',
        label: 'Expert',
        desc: 'Difficile uniquement — sans filet',
        diffs: ['hard']
      }, {
        id: 'all',
        icon: '🌐',
        label: 'Tous niveaux',
        desc: 'Toutes difficultés',
        diffs: ['easy',
  'medium',
  'hard']
      }, ];
      const FORENSIC_TIPS = ['💡 En FAT, <strong>0xE5</strong> au premier octet = fichier supprimé. <strong>0x00</strong> = jamais utilisé.',
  '💡 En NTFS, le <strong>$MFT</strong> contient un enregistrement de 1 Ko par fichier/dossier.',
  '💡 La <strong>chaîne de conservation</strong> documente chaque manipulation d\'une preuve.',
  '💡 <strong>MD5</strong> = 32 hex (128 bits). <strong>SHA - 1</strong> = 40 hex. <strong>SHA - 256</strong> = 64 hex.',
  '💡 En exFAT, <strong>0x85</strong> = File Entry. <strong>0x05</strong> = même entrée, supprimée.',
  '💡 <strong>MZ</strong> (4D 5A) au début d\'un fichier = exécutable Windows PE — même renommé en.jpg.',
  '💡 <strong>DFIR</strong> = Digital Forensics &amp; Incident Response.',
  '💡 En EXT2, l\'<strong>inode 2</strong> est toujours le répertoire racine <code>/</code>.',
  '💡 Timestamps <strong>HFS +</strong> : epoch au 1er janvier 1904 — pas 1970. ±66 ans d\'écart !',
  '💡 <strong>Locard</strong> : tout contact laisse une trace. Vrai pour les bits aussi.',
  '💡 En RSA, <code>e× d≡ 1(mod φ(n))</code>. Sans ça, pas de déchiffrement.',
  '💡 <strong>Data runlist NTFS</strong> : nibble haut = taille offset | nibble bas = taille longueur.',
  '💡 <strong>bcrypt</strong> (coût 12) ≈ 5 000 h/s sur GPU vs MD5≈ 20 milliards.Pas la même chose.',
  '💡 Le <strong>$USNJrnl</strong> NTFS enregistre chaque modification de fichier — mine d\'or forensique.',
  '💡 <strong>PCAP</strong> signature : <code>D4 C3 B2 A1</code> (little-endian) ou <code>A1 B2 C3 D4</code> (big-endian).',
  '💡 Les 16 premiers octets d\'un SQLite : <code>SQLite format 3\\ 0</code> — lisible à l\'œil nu.',
  '💡 Un fichier <strong>.lnk</strong> contient les timestamps de la cible ET le volume serial du disque source.',
  '💡 <strong>Autopsy</strong> est l\'interface graphique de The Sleuth Kit (TSK) — gratuit et open source.',
  '💡 Le <strong>$I30</strong> NTFS d\'un répertoire peut conserver des nœuds B-tree orphelins de fichiers supprimés.',
  '💡 En <strong>Vigenère</strong>, l\'indice de coïncidence (IC) ≈ 0.038 révèle un chiffrement polyalphabétique.',
  '💡 Une incohérence de timestamp entre MFT et logs système est souvent un premier signal de falsification.',
  '💡 Les extensions de fichiers peuvent être trompeuses : seul le magic byte fait foi.',
  '💡 Un malware peut supprimer ses fichiers mais laisser des traces dans Prefetch ou Amcache.',
  '💡 Les artefacts de navigation (browser history, cache, cookies) survivent souvent à la suppression de fichiers.',
  '💡 Les timestamps Windows peuvent être altérés via des outils légitimes (ex: PowerShell, API SetFileTime).',
  '💡 Les artefacts LNK peuvent révéler des chemins de fichiers sur des disques externes non connectés.',
  '💡 En investigation réseau, les DNS logs sont souvent plus fiables que les IP brutes.',
  '💡 Une exécution “sans fichier” peut laisser des traces uniquement en mémoire (fileless malware).',
  '💡 Les journaux Windows Event sont souvent fragmentés mais corrélables via Event ID + timestamp.',
  '💡 Un fichier supprimé peut encore exister dans la Master File Table tant qu’il n’est pas réutilisé.',
  '💡 Les artefacts USB (SetupAPI logs) permettent de retracer les périphériques connectés à une machine.',
  '💡 Le USN Journal peut révéler des opérations même si les fichiers n’existent plus.',
  '💡 Les artefacts de persistance (Scheduled Tasks, Run keys) sont des points d’entrée classiques des malwares.',
  '💡 Une activité suspecte répétitive à intervalle fixe est un indicateur fort de beaconing C2.',
  '💡 Les fichiers temporaires (Temp, AppData) contiennent souvent des preuves indirectes d’exécution.',
  '💡 En NTFS, les attributs alternatifs peuvent être utilisés pour cacher des charges utiles.',
  '💡 Une suppression rapide suivie d’un nettoyage indique souvent une tentative de anti-forensics.',
  '💡 Les logs proxy peuvent révéler des domaines malveillants même si le contenu HTTPS est chiffré.',
  '💡 Les artefacts mémoire permettent de récupérer des connexions réseau actives au moment du dump.',
  '💡 Une timeline forensique fiable repose toujours sur la corrélation multi-source (disk + RAM + logs + réseau).',
  '💡 Les attaques modernes combinent souvent plusieurs artefacts faibles plutôt qu’un seul indicateur fort.', ];
 let _qRenderTime = 0;
 const LOADING_MSGS = ['🔍 Analyse du disque dur forensique…',
  '🧬 Calcul du hash MD5 du quiz…',
  '🕵️ Interrogatoire de la base de données…',
  '⛓️ Vérification de la chaîne de custody…',
  '🔐 Déchiffrement RSA des questions…',
  '📁 Montage de l\'image disque…',
  '🧪 Analyse des traces numériques…',
  '💾 Lecture du $MFT en cours…',
  '📡 Connexion au serveur DFIR…',
  '🔬 Extraction des artefacts volatils…',
  '⚖️ Consultation du Maître Locard…',
  '🦴 Authentification par Temperance Brennan…',
  '🧠 Chargement de la mémoire de Spencer Reid…',
  '💻 Elliot Alderson en train de hacker le quiz…',
  '🔍 Sherlock analyse les octets suspects…',
  '🛡️ Scan antivirus des questions…',
  '📊 Indexation des 1210 questions…',
  '🗂️ Tri des preuves par thème…',
  '🔎 Recherche des doublons de preuves…',
  '📝 Rédaction du rapport préliminaire…',
  '🧾 Parsing des logs Windows Event…',
  '📌 Corrélation temporelle des artefacts…',
  '🧠 Reconstruction de la timeline forensic…',
  '🔍 Analyse des entrées registre suspectes…',
  '💿 Carving des fichiers supprimés…',
  '📂 Exploration des shadow copies…',
  '🛰️ Géolocalisation des artefacts réseau…',
  '🕳️ Détection des zones non allouées…',
  '🧮 Calcul d’entropie des fichiers suspects…',
  '🔬 Reverse engineering des binaires…',
  '📈 Analyse comportementale des IOC…',
  '🧷 Extraction des métadonnées EXIF…',
  '🗃️ Reconstruction du système de fichiers…',
  '🧬 Analyse hexadécimale des fragments mémoire…',
  '🧯 Neutralisation du malware dormant…',
  '📜 Lecture du journal d’événements système…',
  '🧠 Synchronisation des neurones investigatifs…',
  '🔍 Inspection des secteurs défectueux…',
  '🧬 Vérification de l’intégrité des preuves…',
  '📂 Ouverture du dossier confidentiel…',
  '🛠️ Initialisation de la mallette forensic…',
  '📸 Capture de la scène numérique…',
  '🧹 Dépoussiérage des empreintes digitales…',
  '🧪 Préparation des réactifs du labo…',
  '🔦 Inspection UV des artefacts cachés…',
  '📈 Corrélation des indicateurs de compromission…',
  '🛰️ Scan des communications réseau suspectes…',
  '🔐 Déverrouillage des partitions chiffrées…',
  '💽 Vérification des secteurs bootables…',
  '📡 Interception des paquets en transit…',
  '🧾 Génération de la chaîne de preuve…',
  '🗄️ Archivage des pièces à conviction…',
  '🧩 Reconstitution des fragments effacés…',
  '🧠 Consultation de la base de connaissances FBI…',
  '🕶️ Activation du mode cyberdétective…',
  '⚙️ Calibration des outils d’investigation…',
  '🔎 Recherche de signatures malveillantes…',
  '📋 Vérification de conformité procédurale…',
  '🧬 Alignement des séquences d’indices…',
  '💻 Initialisation de l’environnement sandbox…',
  '🧱 Isolation des éléments suspects…',
  '🛡️ Déploiement des contre-mesures…',
  '🚨 Détection d’activité anormale…',
  '📍 Cartographie de la scène d’incident…',
  '🧠 Consultation de la mémoire cache analytique…',
  '☕ Pause café de l’analyste SOC…',
  '🧙 Invocation des anciens scripts Python…',
  '🕶️ Chargement des lunettes de hacker…',
  '👣 Recherche des empreintes de Moriarty…',
  '🦇 Consultation de la Batcomputer…',
  '🤖 HAL 9000 vérifie les réponses…', ];
 let _loadMsgInt = null;

 function startLoadingMessages() {
 const el = document.getElementById('loading-msg');
 if (!el) return;
 let i = Math.floor(Math.random() * LOADING_MSGS.length);
 el.textContent = LOADING_MSGS[i];
 _loadMsgInt = setInterval(() => {
 i = (i + 1) % LOADING_MSGS.length;
 el.style.animation = 'none';
 void el.offsetWidth; // reflow to restart animation
 el.style.animation = '';
 el.textContent = LOADING_MSGS[i];
 }, 1800);
 }

 function stopLoadingMessages() {
 if (_loadMsgInt) {
 clearInterval(_loadMsgInt);
 _loadMsgInt = null;
 }
 }

 function getDailyDate() {
 return new Date().toISOString().slice(0, 10);
 }

 function seededRng(seed) {
 let h = seed;
 return () => {
 h = Math.imul(h ^ h >>> 16, 0x45d9f3b);
 h = Math.imul(h ^ h >>> 15, 0x2b9c4d);
 return (h ^ h >>> 13) >>> 0;
 };
 }

 function getDailySeed() {
 const d = getDailyDate();
 return d.split('-').reduce((a, v) => a * 100 + parseInt(v), 0);
 }
 let ALL_Q = [],
 ALL_T = [],
 ALL_C = [];
 let SOUND_ON = true;
 let S = {
 score: 0,
 correct: 0,
 total: 0,
 streak: 0,
 maxStreak: 0,
 answered: false,
 sel: new Set(),
 selCorrect: new Map(),
 curQ: null,
 curIdx: -1,
 byDiff: {
 easy: {
 ok: 0,
 tot: 0
 },
 medium: {
 ok: 0,
 tot: 0
 },
 hard: {
 ok: 0,
 tot: 0
 }
 },
 byTheme: {},
 byChapter: {},
 errors: [],
 bookmarks: new Set(),
 activeT: new Set(),
 activeD: new Set(['easy',
  'medium',
  'hard']),
 activeC: new Set(),
 timerSec: 0,
 timerLeft: 0,
 timerInt: null,
 mode: 'normal',
 pool: [],
 pi: 0,
 qstats: {},
 xp: 0,
 combo: 1,
 maxCombo: 0,
 perfectExam: false,
 perfectExam20: false,
 nightOwl: false,
 smartCount: 0,
 dayStreak: 0,
 lastPlayDate: null,
 dailyDone: false,
 dailyScore: 0,
 comeback: false,
 hintsLeft: 3,
 hintsUsed: 0,
 _wrongRun: 0,
 _rightAfterWrong: 0,
 lives: 3,
 survivalBest: 0,
 sm2Queue: [],
 _swipeStartX: 0,
 _swipeStartY: 0,
 avatarEmoji: '🔰',
 avatarName: 'Enquêteur',
 _midShown: new Set(),
 _secretFlags: {},
 streakFreezes: 1,
 skipsTotal: 0,
 _speedCorrect: 0,
 };

 function lsGet(k, d) {
 try {
 const v = localStorage.getItem(k);
 return v !== null ? JSON.parse(v) : d;
 } catch {
 return d;
 }
 }

 function lsSet(k, v) {
 try {
 localStorage.setItem(k, JSON.stringify(v));
 } catch {}
 }

 function loadPersist() {
 S.bookmarks = new Set(lsGet('bm', []));
 S.timerSec = lsGet('timer', 0);
 const at = lsGet('at', ALL_T);
 S.activeT = new Set(at.filter(t => ALL_T.includes(t)));
 if (!S.activeT.size) S.activeT = new Set(ALL_T);
 S.activeD = new Set(lsGet('ad', ['easy',
  'medium',
  'hard']));
 const ac = lsGet('ac', ALL_C);
 S.activeC = new Set(ac.filter(c => ALL_C.includes(c)));
 if (!S.activeC.size) S.activeC = new Set(ALL_C);
 S.qstats = lsGet('qs', {});
 S.xp = lsGet('xp', 0);
 S.maxCombo = lsGet('maxCombo', 0);
 S.perfectExam = lsGet('perfectExam', false);
 S.perfectExam20 = lsGet('perfectExam20', false);
 S.nightOwl = lsGet('nightOwl', false);
 S.smartCount = lsGet('smartCount', 0);
 S.comeback = lsGet('comeback', false);
 S.hintsUsed = lsGet('hintsUsed', 0);
 S.survivalBest = lsGet('survivalBest', 0);
 S.avatarEmoji = lsGet('avatarEmoji',
  '🔰');
 S.avatarName = lsGet('avatarName',
  'Enquêteur');
 updateAvatarChip();
 applyFontSize(lsGet('fontSize',
  'normal'));
 S.sm2Queue = lsGet('sm2q', []);
 S.streakFreezes = lsGet('freezes', 1);
 S._secretFlags = lsGet('secretFlags', {});
 S.dayStreak = lsGet('dayStreak', 0);
 S.lastPlayDate = lsGet('lastPlayDate', null);
 S.dailyDone = lsGet('dailyDone_' + getDailyDate(), false);
 S.dailyScore = lsGet('dailyScore_' + getDailyDate(), 0);
 SOUND_ON = lsGet('soundOn', true);
 document.getElementById('sound-btn').textContent = SOUND_ON ? '🔊' : '🔇';
 const h = new Date().getHours();
 if (h >= 0 && h < 5) {
 S.nightOwl = true;
 lsSet('nightOwl', true);
 }
 updateDayStreak();
 const vt = lsGet('visualTheme',
  'default');
 applyVisualTheme(vt);
 }

 function savePersist() {
 lsSet('bm', [...S.bookmarks]);
 lsSet('timer', S.timerSec);
 lsSet('at', [...S.activeT]);
 lsSet('ad', [...S.activeD]);
 lsSet('ac', [...S.activeC]);
 lsSet('qs', S.qstats);
 lsSet('xp', S.xp);
 lsSet('maxCombo', S.maxCombo);
 lsSet('perfectExam', S.perfectExam);
 lsSet('perfectExam20', S.perfectExam20);
 lsSet('nightOwl', S.nightOwl);
 lsSet('smartCount', S.smartCount);
 lsSet('comeback', S.comeback);
 lsSet('hintsUsed', S.hintsUsed);
 lsSet('survivalBest', S.survivalBest);
 lsSet('sm2q', S.sm2Queue);
 lsSet('avatarEmoji', S.avatarEmoji);
 lsSet('avatarName', S.avatarName);
 lsSet('freezes', S.streakFreezes);
 lsSet('secretFlags', S._secretFlags);
 }

 function saveSession() {
 const h = lsGet('sessions', []);
 const acc = S.total ? Math.round(S.correct / S.total * 100) : 0;
 const entry = {
 date: new Date().toLocaleDateString('fr'),
 score: S.score,
 acc,
 total: S.total,
 week: getWeekKey()
 };
 h.push(entry);
 if (h.length > 20) h.shift();
 lsSet('sessions', h);
 const wk = getWeekKey();
 const wl = lsGet('weeklyLB', {});
 if (!wl[wk] || S.score > wl[wk].score) {
 wl[wk] = {
 score: S.score,
 acc,
 date: entry.date
 };
 lsSet('weeklyLB', wl);
 }
 }

 function getWeekKey() {
 const d = new Date();
 const day = d.getDay() || 7;
 d.setDate(d.getDate() - day + 1);
 return d.toISOString().slice(0, 10);
 }

 function updateDayStreak() {
 const today = getDailyDate();
 const last = S.lastPlayDate;
 if (!last) {
 return;
 }
 const d1 = new Date(last),
 d2 = new Date(today);
 const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
 if (diff === 0) {} else if (diff === 1) {
 S.dayStreak++;
 lsSet('dayStreak', S.dayStreak);
 } else if (diff > 1) {
 S.dayStreak = 1;
 lsSet('dayStreak', S.dayStreak);
 }
 }

 function markPlayedToday() {
 const today = getDailyDate();
 if (S.lastPlayDate !== today) {
 S.lastPlayDate = today;
 lsSet('lastPlayDate', today);
 }
 }

 function shuffle(a, rng) {
 const b = [...a];
 for (let i = b.length - 1; i > 0; i--) {
 const j = rng ? Math.floor(rng() / (0xffffffff + 1) * (i + 1)) : 0 | Math.random() * (i + 1);
 [b[i], b[j]] = [b[j], b[i]];
 }
 return b;
 }

 function buildPool() {
 let p;
 if (S.mode === 'survival') {
 p = ALL_Q.map((q, i) => ({
 q,
 idx: i
 })).filter(x => S.activeT.has(x.q.theme) && S.activeD.has(x.q.diff) && S.activeC.has(x.q.chapter));
 S.lives = 3;
 updateLivesDisplay();
 } else if (S.mode === 'sm2') {
 p = getSM2Due().map(i => ({
 q: ALL_Q[i],
 idx: i
 })).filter(x => x.q);
 if (!p.length) p = ALL_Q.map((q, i) => ({
 q,
 idx: i
 })).filter(x => S.activeT.has(x.q.theme));
 } else if (S.mode === 'bookmarks') p = [...S.bookmarks].map(i => ({
 q: ALL_Q[i],
 idx: i
 })).filter(x => x.q);
 else if (S.mode === 'errors') p = S.errors.map(i => ({
 q: ALL_Q[i],
 idx: i
 })).filter(x => x.q);
 else if (S.mode === 'daily') {
 const rng = seededRng(getDailySeed());
 const base = ALL_Q.map((q, i) => ({
 q,
 idx: i
 }));
 p = shuffle(base, rng).slice(0, 20);
 } else if (S.mode === 'smart') {
 const base = ALL_Q.map((q, i) => ({
 q,
 idx: i
 })).filter(x => S.activeT.has(x.q.theme) && S.activeD.has(x.q.diff) && S.activeC.has(x.q.chapter));
 p = [];
 base.forEach(item => {
 const qs = S.qstats[item.idx] || {
 ok: 0,
 tot: 0
 };
 const rate = qs.tot > 0 ? qs.ok / qs.tot : 0.5;
 const weight = qs.tot === 0 ? 1 : Math.max(1, Math.round((1 - rate) * 4));
 for (let w = 0; w < weight; w++) p.push(item);
 });
 if (!p.length) p = base;
 } else p = ALL_Q.map((q, i) => ({
 q,
 idx: i
 })).filter(x => S.activeT.has(x.q.theme) && S.activeD.has(x.q.diff) && S.activeC.has(x.q.chapter));
 if (!p.length) p = ALL_Q.map((q, i) => ({
 q,
 idx: i
 }));
 S.pool = shuffle(p);
 S.pi = 0;
 const _pb = document.getElementById('q-progress-bar');
 if (_pb) _pb.style.width = '0%';
 }

 function getNext() {
 if (S.pi >= S.pool.length) {
 if (S.mode === 'normal' || S.mode === 'smart') buildPool();
 else S.pi = 0;
 }
 return S.pool[S.pi++] || {
 q: ALL_Q[0],
 idx: 0
 };
 }

 function stopTimer() {
 if (S.timerInt) {
 clearInterval(S.timerInt);
 S.timerInt = null;
 }
 document.getElementById('timer-bar-wrap').style.display = S.timerSec > 0 ? '' : 'none';
 }

 function startTimer() {
 stopTimer();
 if (!S.timerSec) return;
 const wrap = document.getElementById('timer-bar-wrap'),
 bar = document.getElementById('timer-bar');
 wrap.style.display = '';
 S.timerLeft = S.timerSec;
 bar.style.width = '100%';
 bar.style.background = 'var(--cyan)';
 S.timerInt = setInterval(() => {
 S.timerLeft--;
 const p = Math.max(0, S.timerLeft / S.timerSec * 100);
 bar.style.width = p + '%';
 bar.style.background = p < 33 ? 'var(--red)' : p < 66 ? 'var(--gold)' : 'var(--cyan)';
 if (S.timerLeft <= 0) {
 stopTimer();
 if (!S.answered) doSkip();
 }
 }, 1000);
 }

 function getRank(xp) {
 for (let i = RANKS.length - 1; i >= 0; i--)
 if (xp >= RANKS[i].min) return {
 rank: RANKS[i],
 idx: i
 };
 return {
 rank: RANKS[0],
 idx: 0
 };
 }

 function addXp(pts) {
 const prev = getRank(S.xp);
 S.xp += pts;
 lsSet('xp', S.xp);
 const curr = getRank(S.xp);
 updateXpBar();
 updateRankFlavor();
 if (curr.idx > prev.idx) {
 showRankUp(curr.rank);
 checkMilestoneByRank(curr.idx);
 } else {
 // Toast when close to next rank
 checkCloseToNextRank(prev.idx);
 }
 }
 // Thresholds at which we notify (XP remaining)
 const RANK_CLOSE_THRESHOLDS = [50, 20, 5];
 let _lastRankCloseNotif = 0;

 function checkCloseToNextRank(rankIdx) {
 const next = RANKS[rankIdx + 1];
 if (!next) return; // already max rank
 const remaining = next.min - S.xp;
 for (const threshold of RANK_CLOSE_THRESHOLDS) {
 if (remaining <= threshold && remaining > 0) {
 // Only notify once per threshold crossing (debounce 10s)
 const now = Date.now();
 if (now - _lastRankCloseNotif < 10000) return;
 _lastRankCloseNotif = now;
 const {
 rank
 } = getRank(S.xp);
 showToast('streak-toast', `⬆️ Plus que ${remaining} XP pour ${next.emoji} ${next.name} !`, 3500);
 return;
 }
 }
 }

 function updateXpBar() {
 const {
 rank,
 idx
 } = getRank(S.xp);
 const next = RANKS[idx + 1];
 const pct = next ? Math.min(100, Math.round((S.xp - rank.min) / (next.min - rank.min) * 100)) : 100;
 document.getElementById('rank-badge').textContent = rank.name;
 const em = document.getElementById('rank-emoji-display');
 if (em) em.textContent = rank.emoji;
 // SVG ring: circumference = 2π×14 ≈ 87.96
 const ring = document.getElementById('xp-ring-fill');
 if (ring) ring.style.strokeDashoffset = String(Math.round(87.96 * (1 - pct / 100) * 100) / 100);
 // Tooltip
 const wrap = document.getElementById('xp-wrap');
 if (wrap) wrap.title = (next ? `${S.xp} XP · ${next.min-S.xp} XP jusqu\'à ${next.name}` : `${S.xp} XP · Rang maximum !`);
 }

 function getComboMultiplier() {
 if (S.streak >= 12) return 3;
 if (S.streak >= 6) return 2;
 if (S.streak >= 3) return 1.5;
 return 1;
 }

 function updateComboDisplay() {
 const m = getComboMultiplier();
 const cd = document.getElementById('combo-display');
 const cb = document.getElementById('combo-badge');
 if (m > 1) {
 cd.style.display = '';
 cd.textContent = `⚡ ×${m}`;
 cd.style.color = m >= 2 ? 'var(--gold)' : 'var(--red)';
 if (cb) {
 cb.style.display = '';
 cb.textContent = `⚡ COMBO ×${m}`;
 }
 document.body.style.setProperty('--grid-speed', m >= 2 ? '8s' : '15s');
 document.getElementById('question-card').classList.toggle('combo-x2', m >= 2);
 document.getElementById('question-card').classList.toggle('combo-active', m >= 1.5 && m < 2);
 } else {
 cd.style.display = 'none';
 if (cb) cb.style.display = 'none';
 document.body.style.setProperty('--grid-speed',
  '30s');
 document.getElementById('question-card').classList.remove('combo-active',
  'combo-x2');
 }
 S.maxCombo = Math.max(S.maxCombo, S.streak);
 }

 function updateStreakDisplay() {
 const el = document.getElementById('streak-display');
 if (!el) return;
 const n = S.streak;
 el.textContent = n >= 5 ? '🔥 ' + n : n >= 2 ? '⚡ ' + n : '🔥 ' + n;
 el.className = '';
 if (n >= 10) el.classList.add('fire');
 else if (n >= 5) el.classList.add('hot');
 updateComboDisplay();
 }
 let _toastTimers = {};

 function showToast(id, msg, duration = 2200) {
 const t = document.getElementById(id);
 if (!t) return;
 t.textContent = msg;
 t.classList.add('show');
 clearTimeout(_toastTimers[id]);
 _toastTimers[id] = setTimeout(() => t.classList.remove('show'), duration);
 }

 function spawnParticles(x, y, ok) {
 const wrap = document.getElementById('particles-wrap');
 const cols = ok ? ['#30e88a',
  '#00e5cc',
  '#7affea',
  '#ffffff'] : ['#ff4060',
  '#ff8080',
  '#ffd0d0'];
        const count = ok ? 18 : 8;
        for (let i = 0; i < count; i++) {
          const el = document.createElement('div');
          const sz = 4 + Math.random() * 6;
          const angle = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 80;
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist - 50;
          el.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:${Math.random()>.5?'50%':'2px'};background:${cols[0|Math.random()*cols.length]};left:${x}px;top:${y}px;pointer-events:none;--dx:${dx}px;--dy:${dy}px;--rot:${Math.random()*720}deg;animation:particleFly ${0.5+Math.random()*.4}s ease-out forwards;`;
          wrap.appendChild(el);
          setTimeout(() => el.remove(), 900);
        }
      }

      function renderQuestion(item) {
        const {
          q,
          idx
        } = item;
        S.curQ = q;
        S.curIdx = idx;
        S.answered = false;
        S.sel = new Set();
        S.selCorrect = new Map();
        S._hintUsedThisQ = false;
        _qRenderTime = Date.now();
        const hb = document.getElementById('hint-btn');
        if (hb) {
          hb.disabled = S.hintsLeft <= 0;
          const hc = document.getElementById('hint-count');
          if (hc) hc.textContent = S.hintsLeft;
        }
        const isBoss = (S.total > 0 && S.total % 50 === 0 && q.diff === 'hard');
        const card = document.getElementById('question-card');
        card.className = 'card ' + q.diff + (isBoss ? ' boss' : '');
        if (isBoss) {
          showToast('combo-toast', '💀 BOSS QUESTION — difficulté maximale !', 3000);
          spawnParticles(window.innerWidth / 2, window.innerHeight / 2, false);
        }
        const tt = document.getElementById('theme-tag');
        tt.textContent = '▸ ' + q.theme;
        tt.style.color = TC[q.theme] || 'var(--text)';
        const ct = document.getElementById('chapter-tag');
        if (ct) {
          ct.textContent = q.chapter || '';
          ct.style.display = q.chapter ? '' : 'none';
        }
        const db = document.getElementById('diff-badge');
        db.className = 'diff-badge ' + q.diff;
        document.getElementById('diff-text').textContent = DIFF_LABELS[q.diff];
        const m = getComboMultiplier();
        const basePts = DIFF_PTS[q.diff];
        const bonusPts = m > 1 ? Math.round(basePts * (m - 1)) : 0;
        document.getElementById('pts-text').textContent = basePts + (bonusPts > 0 ? ` +${bonusPts}` : '') + ' pt' + (basePts > 1 ? 's' : '');
        updateComboDisplay();
        const qc = document.getElementById('q-counter');
        if (qc && S.pool.length) {
          const cur = Math.min(S.pi, S.pool.length);
          const tot = S.pool.length;
          const pct = Math.round(cur / tot * 100);
          const ctEl = document.getElementById('q-counter-text');
          const ptEl = document.getElementById('q-counter-pct');
          if (ctEl) ctEl.textContent = `Question ${cur} / ${tot}`;
          if (ptEl) ptEl.textContent = pct + '%';
          const pb = document.getElementById('q-progress-bar');
          if (pb) pb.style.width = pct + '%';
        }
        document.getElementById('question-text').innerHTML = sanitizeHTML(q.q);
        document.getElementById('multi-hint').style.display = q.type === 'multi' ? '' : 'none';
        const bb = document.getElementById('bookmark-btn');
        bb.textContent = S.bookmarks.has(idx) ? '⭐' : '☆';
        bb.className = 'bookmark-btn' + (S.bookmarks.has(idx) ? ' active' : '');
        const ch = document.getElementById('choices');
        ch.innerHTML = '';
        const L = ['A', 'B', 'C', 'D', 'E'];
        const shuffled = [...q.opts.map((_, i) => i)];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = 0 | Math.random() * (i + 1);
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const ansSet = new Set(q.answers);
        shuffled.forEach((origI, newI) => {
          const btn = document.createElement('button');
          btn.className = 'choice-btn';
          btn.dataset.idx = newI;
          btn.dataset.origIdx = origI;
          btn.innerHTML = `
																	
										
												
																		<span class="choice-letter">${L[newI]}</span>
																		<span>${q.opts[origI]}</span>`;
          const isCorrect = ansSet.has(origI);
          btn.addEventListener('click', () => toggleChoice(btn, newI, q.type, isCorrect));
          ch.appendChild(btn);
        });
        document.getElementById('feedback').style.display = 'none';
        document.getElementById('feedback').innerHTML = '';
        document.getElementById('feedback').dataset.pendingExpl = '';
        const eb2 = document.getElementById('expl-btn');
        if (eb2) eb2.style.display = 'none';
        const vb = document.getElementById('validate-btn');
        vb.style.display = q.type === 'multi' ? 'block' : 'none';
        vb.disabled = true;
        vb.textContent = 'Valider';
        document.getElementById('skip-btn').style.display = 'block';
        document.getElementById('next-btn').style.display = 'none';
        startTimer();
        clearGodModeHints();
        if (_godMode) setTimeout(revealGodModeHints, 50);
      }

      function toggleChoice(btn, i, type, isCorrect) {
        if (S.answered) return;
        if (type === 'single') {
          document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
          S.sel = new Set([i]);
          S.selCorrect = new Map([
            [i, isCorrect]
          ]);
          btn.classList.add('selected');
          validate();
        } else {
          if (!S.selCorrect) S.selCorrect = new Map();
          if (S.sel.has(i)) {
            S.sel.delete(i);
            S.selCorrect.delete(i);
            btn.classList.remove('selected');
          } else {
            S.sel.add(i);
            S.selCorrect.set(i, isCorrect);
            btn.classList.add('selected');
          }
          const vb = document.getElementById('validate-btn');
          vb.disabled = S.sel.size === 0;
          vb.textContent = S.sel.size > 0 ? 'Valider (' + S.sel.size + ' sél.)' : 'Valider';
        }
      }

      function validate() {
        if (S.answered || !S.sel.size) return;
        stopTimer();
        S.answered = true;
        const q = S.curQ;
        const selCorrect = S.selCorrect || new Map();
        const ok = [...selCorrect.values()].filter(Boolean).length === q.answers.length && S.sel.size === q.answers.length;
        const basePts = ok ? DIFF_PTS[q.diff] : 0;
        const m = getComboMultiplier();
        const pts = ok ? Math.round(basePts * m) : 0;
        S.total++;
        markPlayedToday();
        maybeShowForensicAlert();
        if (ok) {
          const hintPenalty = S._hintUsedThisQ ? 0.5 : 1;
          const elapsed = (Date.now() - _qRenderTime) / 1000;
          const speedBonus = (elapsed < 5 && !S.timerSec && !S._hintUsedThisQ) ? 1 : 0;
          S.score += pts;
          S.correct++;
          S.streak++;
          S.maxStreak = Math.max(S.maxStreak, S.streak);
          S.maxCombo = Math.max(S.maxCombo, S.streak);
          addXp(Math.max(1, Math.round(pts * hintPenalty)) + speedBonus);
          if (speedBonus) showToast('combo-toast', '⚡ Speed bonus +1 XP !', 1500);
          checkDorOffer();
          if (STREAK_MSGS[S.streak]) showToast('streak-toast', STREAK_MSGS[S.streak]);
          if (S.streak === 6 || S.streak === 12) {
            const cm = getComboMultiplier();
            showToast('combo-toast', `⚡ COMBO ×${cm} ! Points ×${cm} !`, 3000);
          }
          if (S.mode === 'smart') S.smartCount++;
        } else {
          S.streak = 0;
          S.errors.push(S.curIdx);
          triggerScreenShake();
          if (S.mode === 'survival') {
            loseLife();
          }
        }
        resolveDor(ok);
        trackComeback(ok);
        if (navigator.vibrate) {
          navigator.vibrate(ok ? [50] : [80, 30, 80]);
        }
        checkSecrets(ok);
        updateSM2(S.curIdx, ok);
        S.byDiff[q.diff].tot++;
        if (ok) S.byDiff[q.diff].ok++;
        if (!S.byTheme[q.theme]) S.byTheme[q.theme] = {
          ok: 0,
          tot: 0
        };
        S.byTheme[q.theme].tot++;
        if (ok) S.byTheme[q.theme].ok++;
        if (q.chapter) {
          if (!S.byChapter[q.chapter]) S.byChapter[q.chapter] = {
            ok: 0,
            tot: 0
          };
          S.byChapter[q.chapter].tot++;
          if (ok) S.byChapter[q.chapter].ok++;
          if (ok) { checkBossTrigger(q.chapter); checkFicheUnlock(q.chapter); }
        }
        const qs = S.qstats[S.curIdx] || {
          ok: 0,
          tot: 0
        };
        qs.tot++;
        if (ok) qs.ok++;
        S.qstats[S.curIdx] = qs;
        const sd = document.getElementById('score-display');
        sd.textContent = S.score + ' pts';
        if (ok) {
          sd.classList.remove('bump');
          void sd.offsetWidth;
          sd.classList.add('bump');
        }
        updateStreakDisplay();
        document.querySelectorAll('.choice-btn').forEach(btn => {
          btn.disabled = true;
          const origI = +btn.dataset.origIdx;
          const newI = +btn.dataset.idx;
          if (q.answers.includes(origI)) btn.classList.add('correct');
          else if (S.sel.has(newI)) {
            btn.classList.add('wrong');
          }
        });
        if (ok) {
          const firstCorrect = document.querySelector('.choice-btn.correct');
          if (firstCorrect) {
            const r = firstCorrect.getBoundingClientRect();
            const wrap = document.getElementById('particles-wrap');
            const wr = wrap.getBoundingClientRect();
            spawnParticles(r.left - wr.left + r.width / 2, r.top - wr.top + r.height / 2, true);
          }
        }
        const fb = document.getElementById('feedback');
        fb.className = ok ? 'ok' : 'ko';
        const _pname = S.avatarName && S.avatarName !== 'Enquêteur' ? ` ${S.avatarName} !` : '!';
        const msg = ok ? FEEDBACK_OK[Math.floor(Math.random() * FEEDBACK_OK.length)].replace('!', _pname) : FEEDBACK_KO[Math.floor(Math.random() * FEEDBACK_KO.length)];
        const ptsLine = ok && pts > basePts ? `
																		
										
												
																		<span class="pts-earned"> +${pts} pts (×${m} combo !)</span>` : (ok ? `
																		
										
												
																		<span class="pts-earned"> +${pts} pt${pts>1?'s':''}</span>` : '');
        const showTip = Math.random() < 0.25;
        const tipLine = showTip ? `
																			
										
												
																		<div style="margin-top:10px;padding:8px 10px;border-radius:7px;background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);font-size:12px;color:var(--dim)">${FORENSIC_TIPS[Math.floor(Math.random()*FORENSIC_TIPS.length)]}</div>` : '';
        const explTxt = sanitizeHTML(ok ? (q.expl_ok || q.expl_ko || '') : (q.expl_ko || q.expl_ok || ''));
        const explStyle = ok ? 'margin-top:10px;padding:9px 11px;border-radius:7px;font-size:12px;line-height:1.65;background:rgba(48,232,138,.15);border:1px solid rgba(48,232,138,.3);color:var(--text-ok)' : 'margin-top:10px;padding:9px 11px;border-radius:7px;font-size:12px;line-height:1.65;background:rgba(255,64,96,.15);border:1px solid rgba(255,64,96,.3);color:#ffe0e5';
        const explLine = explTxt ? `
																		<div class="feedback-expl" style="${explStyle}">${explTxt}</div>` : '';
        const refsLine = (q.refs && q.refs.length) ? `<div style="margin-top:8px;padding:6px 10px;border-radius:6px;font-size:11px;line-height:1.5;background:rgba(120,120,180,.08);border:1px solid rgba(120,120,180,.18);color:var(--dim)">📚 ${q.refs.map(r=>`<em>${sanitizeHTML(r)}</em>`).join(' · ')}</div>` : '';
        fb.innerHTML = msg + ptsLine + tipLine + explLine + refsLine;
        fb.dataset.pendingExpl = explTxt;
        fb.dataset.pendingOk = ok ? '1' : '0';
        fb.style.display = 'block';
        requestAnimationFrame(() => fb.scrollIntoView({ // one-shot RAF
          behavior: 'smooth',
          block: 'nearest'
        }));
        document.getElementById('validate-btn').style.display = 'none';
        document.getElementById('skip-btn').style.display = 'none';
        document.getElementById('next-btn').style.display = 'block';
        const eb = document.getElementById('expl-btn');
        eb.style.display = 'none'; // explication déjà inline
        clearGodModeHints();
        playSound(ok);
        savePersist();
        checkAchievements();
        checkMilestone();
        maybeTriggerMidSession();
      }

      function doSkip() {
        stopTimer();
        S.streak = 0;
        S.skipsTotal++;
        if (S.skipsTotal >= 20) {
          if (!S._secretFlags.skip20) {
            S._secretFlags.skip20 = true;
            lsSet('secretFlags', S._secretFlags);
          }
        }
        updateStreakDisplay();
        playSound(null);
        nextQuestion();
      }

      function nextQuestion() {
        const card = document.getElementById('question-card');
        if (!card) {
          renderQuestion(getNext());
          return;
        }
        card.classList.add('card-flipping-out');
        setTimeout(() => {
          card.classList.remove('card-flipping-out');
          // Hide during DOM swap to prevent ghost frame
          card.style.visibility = 'hidden';
          card.style.animation = 'none';
          renderQuestion(getNext());
          // Double rAF (one-shot): first commits DOM, second triggers paint
          requestAnimationFrame(() => requestAnimationFrame(() => {
            card.style.animation = '';
            card.style.visibility = '';
            card.classList.add('card-flipping-in');
            setTimeout(() => card.classList.remove('card-flipping-in'), 240);
          }));
        }, 190);
      }

      function openExplModal() {
        const fb = document.getElementById('feedback');
        const expl = fb.dataset.pendingExpl || '';
        const ok = fb.dataset.pendingOk === '1';
        if (!expl) return;
        const overlay = document.getElementById('expl-overlay');
        const badge = document.getElementById('expl-status-badge');
        const body = document.getElementById('expl-body');
        badge.textContent = ok ? '✓ Correct' : '✗ Incorrect';
        badge.style.background = ok ? 'rgba(48,232,138,.12)' : 'rgba(255,64,96,.12)';
        badge.style.color = ok ? 'var(--green)' : 'var(--red)';
        badge.style.border = ok ? '1px solid rgba(48,232,138,.3)' : '1px solid rgba(255,64,96,.3)';
        body.innerHTML = expl;
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }

      function closeExplModal(e) {
        if (e && e.target && e.target !== document.getElementById('expl-overlay')) return;
        document.getElementById('expl-overlay').style.display = 'none';
        document.body.style.overflow = '';
      }

      function toggleBookmark() {
        const idx = S.curIdx;
        S.bookmarks.has(idx) ? S.bookmarks.delete(idx) : S.bookmarks.add(idx);
        const bb = document.getElementById('bookmark-btn');
        bb.textContent = S.bookmarks.has(idx) ? '⭐' : '☆';
        bb.className = 'bookmark-btn' + (S.bookmarks.has(idx) ? ' active' : '');
        savePersist();
      }
      let _ac = null;

      function ac() {
        if (!_ac) try {
          _ac = new(window.AudioContext || window.webkitAudioContext)();
        } catch {}
        return _ac;
      }

      function playSound(ok) {
        if (!SOUND_ON) return;
        const a = ac();
        if (!a) return;
        const t = a.currentTime;
        if (ok === null) {
          const o = a.createOscillator(),
            g = a.createGain();
          o.connect(g);
          g.connect(a.destination);
          o.frequency.setValueAtTime(350, t);
          o.frequency.linearRampToValueAtTime(250, t + .15);
          g.gain.setValueAtTime(.08, t);
          g.gain.exponentialRampToValueAtTime(.001, t + .2);
          o.start(t);
          o.stop(t + .2);
        } else if (ok) {
          const m = getComboMultiplier();
          const notes = m >= 2 ? [523, 659, 784, 1047] : [523, 659, 784];
          notes.forEach((f, i) => {
            const o = a.createOscillator(),
              g = a.createGain();
            o.connect(g);
            g.connect(a.destination);
            o.frequency.value = f;
            g.gain.setValueAtTime(.12, t + i * .07);
            g.gain.exponentialRampToValueAtTime(.001, t + i * .07 + .2);
            o.start(t + i * .07);
            o.stop(t + i * .07 + .25);
          });
        } else {
          const o = a.createOscillator(),
            g = a.createGain();
          o.connect(g);
          g.connect(a.destination);
          o.frequency.setValueAtTime(220, t);
          o.frequency.exponentialRampToValueAtTime(110, t + .3);
          g.gain.setValueAtTime(.18, t);
          g.gain.exponentialRampToValueAtTime(.001, t + .3);
          o.start(t);
          o.stop(t + .3);
        }
      }

      function toggleSound() {
        SOUND_ON = !SOUND_ON;
        lsSet('soundOn', SOUND_ON);
        document.getElementById('sound-btn').textContent = SOUND_ON ? '🔊' : '🔇';
        if (SOUND_ON) playSound(true);
      }

      function applyVisualTheme(id) {
        document.body.dataset.theme = id === 'default' ? '' : id;
        lsSet('visualTheme', id);
      }

      function buildVisualThemeUI() {
        const wrap = document.getElementById('visual-themes');
        if (!wrap) return;
        wrap.innerHTML = '';
        VISUAL_THEMES.forEach(t => {
          const locked = t.minXp && S.xp < t.minXp;
          const curr = lsGet('visualTheme', 'default');
          const d = document.createElement('div');
          d.className = 'theme-card' + (curr === t.id ? ' active' : '') + (locked ? ' locked' : '');
          const preview = document.createElement('div');
          preview.className = 'theme-preview';
          preview.style.background = `linear-gradient(135deg,${t.colors[0]},${t.colors[1]})`;
          d.innerHTML = `
																				
										
												
																		<div class="theme-name" style="color:${locked?'var(--dim)':t.colors[1]}">${locked?'🔒 ':''} ${t.name}</div>
																		<div class="theme-desc">${locked?'Requis: '+t.minXp+' XP':t.desc}</div>`;
          d.prepend(preview);
          if (!locked) {
            d.onclick = () => {
              applyVisualTheme(t.id);
              wrap.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
              d.classList.add('active');
            };
          }
          wrap.appendChild(d);
        });
      }

      function openSettings() {
        const tc = document.getElementById('theme-chips');
        tc.innerHTML = '';
        ALL_T.forEach(t => {
          const c = document.createElement('span');
          c.className = 'chip' + (S.activeT.has(t) ? ' active' : '');
          c.textContent = t;
          c.style.color = TC[t] || '#fff';
          if (S.activeT.has(t)) c.style.borderColor = TC[t] || '#fff';
          c.onclick = () => {
            if (S.activeT.has(t)) {
              S.activeT.delete(t);
              c.classList.remove('active');
              c.style.borderColor = '';
            } else {
              S.activeT.add(t);
              c.classList.add('active');
              c.style.borderColor = TC[t] || '#fff';
            }
          };
          tc.appendChild(c);
        });
        const cc = document.getElementById('chapter-chips');
        cc.innerHTML = '';
        ALL_T.forEach(t => {
          const chs = (window.THEME_CHAPTERS || {})[t];
          if (!chs || !chs.length) return;
          // Sous-titre thème avec tout ✓ / tout ✗ par groupe
          const grpHdr = document.createElement('div');
          grpHdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:10px 0 4px';
          grpHdr.innerHTML = `<span style="font-size:10px;color:${TC[t]||'var(--dim)'};text-transform:uppercase;font-weight:700;letter-spacing:.05em">${t}</span>
            <span style="font-size:10px;display:flex;gap:6px">
              <a href="#" style="color:var(--cyan);text-decoration:none" onclick="(function(){${JSON.stringify(chs)}.forEach(ch=>{S.activeC.add(ch);cc.querySelectorAll('[data-ch]').forEach(el=>{if(el.dataset.ch===ch)el.classList.add('active')})});return false})()" >tout ✓</a>
              <a href="#" style="color:var(--dim);text-decoration:none" onclick="(function(){${JSON.stringify(chs)}.forEach(ch=>{S.activeC.delete(ch);cc.querySelectorAll('[data-ch]').forEach(el=>{if(el.dataset.ch===ch)el.classList.remove('active')})});return false})()">tout ✗</a>
            </span>`;
          cc.appendChild(grpHdr);
          chs.forEach(ch => {
            const c = document.createElement('span');
            c.className = 'chip' + (S.activeC.has(ch) ? ' active' : '');
            c.dataset.ch = ch;
            c.textContent = ch;
            c.onclick = () => {
              if (S.activeC.has(ch)) {
                S.activeC.delete(ch);
                c.classList.remove('active');
              } else {
                S.activeC.add(ch);
                c.classList.add('active');
              }
            };
            cc.appendChild(c);
          });
        });
        const dc = document.getElementById('diff-chips');
        dc.innerHTML = '';
        ['easy', 'medium', 'hard'].forEach(d => {
          const col = d === 'easy' ? 'var(--easy)' : d === 'medium' ? 'var(--medium)' : 'var(--hard)';
          const c = document.createElement('span');
          c.className = 'chip' + (S.activeD.has(d) ? ' active' : '');
          c.dataset.d = d;
          c.textContent = DIFF_LABELS[d];
          c.style.color = col;
          if (S.activeD.has(d)) c.style.borderColor = col;
          c.onclick = () => {
            if (S.activeD.has(d)) {
              S.activeD.delete(d);
              c.classList.remove('active');
              c.style.borderColor = '';
            } else {
              S.activeD.add(d);
              c.classList.add('active');
              c.style.borderColor = col;
            }
          };
          dc.appendChild(c);
        });
        buildPersonaChips();
        const to = document.getElementById('timer-opts');
        to.innerHTML = '';
        [{
          l: 'Off',
          v: 0
        }, {
          l: '30s',
          v: 30
        }, {
          l: '60s',
          v: 60
        }, {
          l: '90s',
          v: 90
        }, {
          l: '2 min',
          v: 120
        }].forEach(o => {
          const b = document.createElement('button');
          b.className = 'timer-opt' + (S.timerSec === o.v ? ' active' : '');
          b.textContent = o.l;
          b.onclick = () => {
            S.timerSec = o.v;
            to.querySelectorAll('.timer-opt').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
          };
          to.appendChild(b);
        });
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === S.mode));
        buildVisualThemeUI();
        document.getElementById('settings-overlay').classList.add('show');
      }

      function pickMode(btn) {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        S.mode = btn.dataset.mode;
      }


      function selectAllChips(type) {
        if (type === 'theme') ALL_T.forEach(t => S.activeT.add(t));
        else if (type === 'chapter') ALL_C.forEach(c => S.activeC.add(c));
        openSettings();
      }
      function deselectAllChips(type) {
        if (type === 'theme') S.activeT.clear();
        else if (type === 'chapter') S.activeC.clear();
        openSettings();
      }


      // Sanitize HTML pour prévenir les injections XSS depuis le JSON
      function sanitizeHTML(raw) {
        const tmp = document.createElement('div');
        tmp.innerHTML = raw || '';
        tmp.querySelectorAll('script,iframe,object,embed,link,meta').forEach(el => el.remove());
        tmp.querySelectorAll('*').forEach(el => {
          [...el.attributes].forEach(attr => {
            if (attr.name.startsWith('on') ||
                (attr.name === 'href' && /^javascript:/i.test(attr.value)) ||
                (attr.name === 'src'  && /^javascript:/i.test(attr.value))) {
              el.removeAttribute(attr.name);
            }
          });
        });
        return tmp.innerHTML;
      }

      function applySettings() {
        if (!S.activeT.size) {
          showToast('streak-toast', '⚠️ Sélectionne au moins un thème pour continuer', 2800);
          return;
        }
        if (!S.activeD.size) {
          showToast('streak-toast', '⚠️ Sélectionne au moins une difficulté', 2800);
          return;
        }
        savePersist();
        saveSession();
        S.score = 0;
        S.correct = 0;
        S.total = 0;
        S.streak = 0;
        S.maxStreak = 0;
        S.combo = 1;
        S.byDiff = {
          easy: {
            ok: 0,
            tot: 0
          },
          medium: {
            ok: 0,
            tot: 0
          },
          hard: {
            ok: 0,
            tot: 0
          }
        };
        S.byTheme = {};
        S.byChapter = {};
        document.getElementById('score-display').textContent = '0 pts';
        updateStreakDisplay();
        buildPool();
        closeOverlay('settings-overlay');
        renderQuestion(getNext());
      }

      function showDailyBanner() {
        const banner = document.getElementById('daily-banner');
        const info = document.getElementById('db-info');
        const scoreEl = document.getElementById('db-score');
        const btn = document.getElementById('db-btn');
        info.textContent = '20 questions · même tirage pour tous';
        if (S.dailyDone) {
          scoreEl.textContent = `Score : ${S.dailyScore} pts`;
          btn.textContent = 'Rejouer';
          btn.style.opacity = '.6';
        } else {
          scoreEl.textContent = '';
          btn.textContent = 'Jouer';
          btn.style.opacity = '1';
        }
        banner.style.display = 'flex';
      }

      function startDailyChallenge() {
        S.mode = 'daily';
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'daily'));
        applySettings();
      }
      let EX = {
        n: 10,
        themes: new Set(),
        chapters: new Set(),
        pool: [],
        idx: 0,
        answers: [],
        sel: new Set()
      };

      function openExam() {
        EX.themes = new Set(ALL_T);
        EX.chapters = new Set(ALL_C);
        EX.n = 10;
        const tc = document.getElementById('exam-theme-chips');
        tc.innerHTML = '';
        ALL_T.forEach(t => {
          const c = document.createElement('span');
          c.className = 'chip active';
          c.textContent = t;
          c.style.color = TC[t] || '#fff';
          c.style.borderColor = TC[t] || '#fff';
          c.onclick = () => {
            if (EX.themes.has(t)) {
              EX.themes.delete(t);
              c.classList.remove('active');
              c.style.borderColor = '';
            } else {
              EX.themes.add(t);
              c.classList.add('active');
              c.style.borderColor = TC[t] || '#fff';
            }
          };
          tc.appendChild(c);
        });
        const cc = document.getElementById('exam-chapter-chips');
        cc.innerHTML = '';
        ALL_C.forEach(ch => {
          const c = document.createElement('span');
          c.className = 'chip active';
          c.textContent = ch;
          c.onclick = () => {
            if (EX.chapters.has(ch)) {
              EX.chapters.delete(ch);
              c.classList.remove('active');
            } else {
              EX.chapters.add(ch);
              c.classList.add('active');
            }
          };
          cc.appendChild(c);
        });
        document.querySelectorAll('[data-n]').forEach(c => c.classList.toggle('active', +c.dataset.n === 10));
        document.getElementById('exam-setup').style.display = '';
        document.getElementById('exam-active').style.display = 'none';
        document.getElementById('exam-results').style.display = 'none';
        document.getElementById('exam-overlay').classList.add('show');
      }

      function pickExamN(c) {
        document.querySelectorAll('[data-n]').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        EX.n = +c.dataset.n;
      }

      function startExam() {
        let p = ALL_Q.map((q, i) => ({
          q,
          idx: i
        })).filter(x => EX.themes.has(x.q.theme) && EX.chapters.has(x.q.chapter));
        EX.pool = shuffle(p).slice(0, EX.n);
        EX.idx = 0;
        EX.answers = [];
        document.getElementById('exam-setup').style.display = 'none';
        document.getElementById('exam-active').style.display = '';
        renderExamQ();
      }

      function renderExamQ() {
        const {
          q
        } = EX.pool[EX.idx];
        EX.sel = new Set();
        const prog = document.getElementById('exam-progress');
        prog.innerHTML = `
																				
										
												
																		<span style="font-size:12px;color:var(--dim)">${EX.idx+1} / ${EX.pool.length}</span>
																		<div class="exam-prog-bar">
																			<div class="exam-prog-fill" style="width:${EX.idx/EX.pool.length*100}%"></div>
																		</div>`;
        const tt = document.getElementById('exam-theme-tag');
        tt.textContent = '▸ ' + q.theme;
        tt.style.color = TC[q.theme] || '#fff';
        const ect = document.getElementById('exam-chapter-tag');
        if (ect) {
          ect.textContent = q.chapter || '';
          ect.style.display = q.chapter ? '' : 'none';
        }
        document.getElementById('exam-diff-badge').textContent = DIFF_LABELS[q.diff];
        document.getElementById('exam-diff-badge').className = 'diff-badge ' + q.diff;
        document.getElementById('exam-question-text').innerHTML = sanitizeHTML(q.q);
        document.getElementById('exam-multi-hint').style.display = q.type === 'multi' ? '' : 'none';
        const ch = document.getElementById('exam-choices');
        ch.innerHTML = '';
        const L = ['A', 'B', 'C', 'D', 'E'];
        const shuffled = [...q.opts.map((_, i) => i)];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = 0 | Math.random() * (i + 1);
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        shuffled.forEach((origI, newI) => {
          const btn = document.createElement('button');
          btn.className = 'choice-btn';
          btn.dataset.origIdx = origI;
          btn.dataset.newIdx = newI;
          btn.innerHTML = `
																				
										
												
																		<span class="choice-letter">${L[newI]}</span>
																		<span>${q.opts[origI]}</span>`;
          btn.onclick = () => {
            if (q.type === 'single') {
              ch.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
              EX.sel = new Set([origI]);
            } else {
              EX.sel.has(origI) ? (EX.sel.delete(origI), btn.classList.remove('selected')) : (EX.sel.add(origI));
            }
            btn.classList.toggle('selected', EX.sel.has(origI));
            const nb = document.getElementById('exam-next-btn');
            if (nb) {
              nb.disabled = EX.sel.size === 0;
              nb.style.opacity = EX.sel.size ? '1' : '.4';
            }
          };
          ch.appendChild(btn);
        });
        const nb = document.getElementById('exam-next-btn');
        if (nb) {
          nb.disabled = true;
          nb.style.opacity = '.4';
        }
      }

      function examNext() {
        if (EX.sel.size === 0) return;
        const {
          q,
          idx
        } = EX.pool[EX.idx];
        const sel = [...EX.sel].sort(),
          ans = [...q.answers].sort();
        const ok = sel.length === ans.length && sel.every((v, i) => v === ans[i]);
        EX.answers.push({
          q,
          idx,
          sel,
          ans,
          ok
        });
        EX.idx++;
        if (EX.idx >= EX.pool.length) {
          showExamResults();
          return;
        }
        renderExamQ();
      }

      function showExamResults() {
        document.getElementById('exam-active').style.display = 'none';
        document.getElementById('exam-results').style.display = '';
        const n = EX.answers.filter(a => a.ok).length,
          pct = Math.round(n / EX.answers.length * 100);
        const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '😎' : pct >= 50 ? '🤔' : pct >= 30 ? '😬' : '💀';
        const verdict = pct >= 90 ? 'Maîtrise parfaite !' : pct >= 70 ? 'Beau travail !' : pct >= 50 ? 'Encore un effort…' : pct >= 30 ? 'À retravailler !' : 'GG pour la tentative 😅';
        document.getElementById('exam-emoji').textContent = emoji;
        const vd = document.getElementById('exam-verdict');
        vd.textContent = verdict;
        vd.style.color = pct >= 70 ? 'var(--green)' : 'var(--red)';
        document.getElementById('exam-stat-grid').innerHTML = `
																				
										
												
																		<div class="stat-box">
																			<div class="stat-val">${n}/${EX.answers.length}</div>
																			<div class="stat-lbl">Bonnes réponses</div>
																		</div>
																		<div class="stat-box">
																			<div class="stat-val" style="color:${pct>=70?'var(--green)':'var(--red)'}">${pct}%</div>
																			<div class="stat-lbl">Score</div>
																		</div>`;
        // Save to exam history
        const examRec = {
          date: new Date().toLocaleDateString('fr-CH', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          n: EX.answers.length,
          correct: n,
          pct,
          themes: [...new Set(EX.answers.map(a => a.q.theme))].join(', '),
          emoji,
        };
        const examHist = lsGet('examHist', []);
        examHist.unshift(examRec);
        if (examHist.length > 20) examHist.pop();
        lsSet('examHist', examHist);
        if (pct === 100 && EX.answers.length >= 10) {
          S.perfectExam = true;
          lsSet('perfectExam', true);
        }
        checkExam42(pct);
        if (pct === 100 && EX.answers.length >= 20) {
          S.perfectExam20 = true;
          lsSet('perfectExam20', true);
        }
        checkAchievements();
        const xpBonus = Math.round(n * 2 * (1 + pct / 100));
        addXp(xpBonus);
        const rev = document.getElementById('exam-review');
        rev.innerHTML = '<h3 style="font-size:11px;color:var(--dim);text-transform:uppercase;margin-bottom:8px">Révision</h3>';
        EX.answers.forEach((a, i) => {
          const d = document.createElement('div');
          d.className = 'exam-result-item ' + (a.ok ? 'correct' : 'wrong');
          d.innerHTML = `
																				
										
												
																		<strong>${i+1}. ${a.q.q}</strong>
																		<br>
																			<span style="color:var(--dim)">Ta réponse : ${a.sel.map(s=>a.q.opts[s]).join(', ')||'—'}</span>
      ${!a.ok?`
																					
											
													
																			<br>
																				<span style="color:var(--green)">✓ Bonne réponse : ${a.ans.map(s=>a.q.opts[s]).join(', ')}</span>`:''}
      ${(a.ok?(a.q.expl_ok||a.q.expl_ko):(a.q.expl_ko||a.q.expl_ok))?`
																						
												
														
																				<br>
																					<div style="margin-top:8px;padding:8px 10px;border-radius:6px;font-size:12px;line-height:1.55;${a.ok?'background:rgba(48,232,138,.12);border:1px solid rgba(48,232,138,.25);color:var(--text-ok)':'background:rgba(255,64,96,.12);border:1px solid rgba(255,64,96,.25);color:#ffe0e5'}">${a.ok?(a.q.expl_ok||a.q.expl_ko):(a.q.expl_ko||a.q.expl_ok)}</div>`:''}
      ${(a.q.refs&&a.q.refs.length)?`<div style="margin-top:6px;padding:5px 9px;border-radius:5px;font-size:11px;line-height:1.5;background:rgba(120,120,180,.08);border:1px solid rgba(120,120,180,.18);color:var(--dim)">📚 ${a.q.refs.map(r=>'<em>'+r+'</em>').join(' · ')}</div>`:''}`;
          rev.appendChild(d);
        });
        checkAchievements();
      }

      function openBilan() {
        const acc = S.total ? Math.round(S.correct / S.total * 100) : 0;
        const {
          rank
        } = getRank(S.xp);
        document.getElementById('bilan-stats').innerHTML = `
																							
													
															
																					<div class="stat-box">
																						<div class="stat-val">${S.score}</div>
																						<div class="stat-lbl">Score</div>
																					</div>
																					<div class="stat-box">
																						<div class="stat-val">${S.total}</div>
																						<div class="stat-lbl">Questions</div>
																					</div>
																					<div class="stat-box">
																						<div class="stat-val" style="color:${acc>=70?'var(--green)':'var(--red)'}">${acc}%</div>
																						<div class="stat-lbl">Précision</div>
																					</div>
																					<div class="stat-box">
																						<div class="stat-val" style="color:var(--gold)">${S.maxStreak}</div>
																						<div class="stat-lbl">🔥 Meilleure série</div>
																					</div>
																					<div class="stat-box">
																						<div class="stat-val" style="color:var(--purple)">${S.xp}</div>
																						<div class="stat-lbl">XP Total</div>
																					</div>
																					<div class="stat-box">
																						<div class="stat-val" style="font-size:18px">${rank.emoji}</div>
																						<div class="stat-lbl">${rank.name.replace(/^[^ ]+ /,'')}</div>
																					</div>`;
        document.getElementById('bilan-diffs').innerHTML = ['easy', 'medium', 'hard'].map(d => {
          const {
            ok,
            tot
          } = S.byDiff[d];
          const p = tot ? Math.round(ok / tot * 100) : 0;
          const col = d === 'easy' ? 'var(--easy)' : d === 'medium' ? 'var(--medium)' : 'var(--hard)';
          return `
																							
													
															
																					<div class="diff-pill">
																						<div class="dv" style="color:${col}">${p}%</div>
																						<div class="dl">${DIFF_LABELS[d]}</div>
																					</div>`;
        }).join('');
        const tb = document.getElementById('theme-bars');
        tb.innerHTML = '';
        ALL_T.forEach(t => {
          const {
            ok,
            tot
          } = S.byTheme[t] || {
            ok: 0,
            tot: 0
          };
          const p = tot ? Math.round(ok / tot * 100) : 0;
          const row = document.createElement('div');
          row.className = 'tbar-row';
          row.innerHTML = `
																							
													
															
																					<span class="tbar-name" style="color:${TC[t]||'#fff'}">${t}</span>
																					<div class="tbar-bg">
																						<div class="tbar-fill" style="width:${p}%;background:${TC[t]||'#fff'}"></div>
																					</div>
																					<span class="tbar-pct">${tot?p+'%':'—'}</span>`;
          tb.appendChild(row);
        });
        const cbSection = document.getElementById('chapter-bars-section');
        const cb = document.getElementById('chapter-bars');
        if (cb) {
          cb.innerHTML = '';
          const activeChapters = ALL_C.filter(c => S.byChapter[c] && S.byChapter[c].tot > 0);
          if (activeChapters.length > 0) {
            if (cbSection) cbSection.style.display = '';
            activeChapters.forEach(c => {
              const {
                ok,
                tot
              } = S.byChapter[c] || {
                ok: 0,
                tot: 0
              };
              const p = tot ? Math.round(ok / tot * 100) : 0;
              const col = p >= 70 ? 'var(--green)' : p >= 40 ? 'var(--gold)' : 'var(--red)';
              const row = document.createElement('div');
              row.className = 'tbar-row';
              row.innerHTML = `
																							
													
															
																					<span class="tbar-name" style="color:var(--dim);font-size:10px" title="${c}">${c.length>14?c.substring(0,13)+'…':c}</span>
																					<div class="tbar-bg">
																						<div class="tbar-fill" style="width:${p}%;background:${col}"></div>
																					</div>
																					<span class="tbar-pct">${p}%</span>`;
              cb.appendChild(row);
            });
          } else {
            if (cbSection) cbSection.style.display = 'none';
          }
        }
        const calWrap = document.getElementById('streak-calendar');
        const dsInfo = document.getElementById('daily-streak-info');
        if (calWrap) {
          calWrap.innerHTML = '';
          const today = getDailyDate();
          const playdates = lsGet('playdates', []);
          const playSet = new Set(playdates);
          dsInfo.textContent = `🔥 ${S.dayStreak} jour${S.dayStreak>1?'s':''} de suite`;
          for (let i = 20; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const ds = d.toISOString().slice(0, 10);
            const dot = document.createElement('div');
            if (ds === today) dot.className = 'day-dot ' + (playSet.has(ds) ? 'today-done' : 'today-pending');
            else dot.className = 'day-dot ' + (playSet.has(ds) ? 'done' : '');
            dot.title = ds;
            calWrap.appendChild(dot);
          }
        }
        const c = document.getElementById('evo-canvas');
        const ctx = c.getContext('2d');
        c.width = c.offsetWidth || 560;
        c.height = 80;
        ctx.clearRect(0, 0, c.width, c.height);
        const hist = lsGet('sessions', []);
        if (hist.length >= 2) {
          const vals = hist.map(h => h.acc),
            n = vals.length;
          const xp = i => i * (c.width / (n - 1));
          const yp = v => c.height - 6 - (v / 100) * (c.height - 12);
          const grad = ctx.createLinearGradient(0, 0, 0, c.height);
          grad.addColorStop(0, 'rgba(0,229,204,.25)');
          grad.addColorStop(1, 'rgba(0,229,204,0)');
          ctx.beginPath();
          ctx.moveTo(xp(0), c.height);
          vals.forEach((v, i) => ctx.lineTo(xp(i), yp(v)));
          ctx.lineTo(xp(n - 1), c.height);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.strokeStyle = '#00e5cc';
          ctx.lineWidth = 2;
          ctx.beginPath();
          vals.forEach((v, i) => i === 0 ? ctx.moveTo(xp(i), yp(v)) : ctx.lineTo(xp(i), yp(v)));
          ctx.stroke();
          vals.forEach((v, i) => {
            ctx.fillStyle = '#00e5cc';
            ctx.beginPath();
            ctx.arc(xp(i), yp(v), 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#6a80a8';
            ctx.font = '10px sans-serif';
            ctx.fillText(v + '%', xp(i) - 8, yp(v) - 6);
          });
        } else {
          ctx.fillStyle = '#6a80a8';
          ctx.font = '12px sans-serif';
          ctx.fillText('Pas encore assez de sessions', 10, 40);
        }
        const fl = document.getElementById('flop-list');
        fl.innerHTML = '';
        const flops = Object.entries(S.qstats).filter(([, s]) => s.tot >= 2 && s.ok / s.tot < .6).sort((a, b) => a[1].ok / a[1].tot - b[1].ok / b[1].tot).slice(0, 5);
        if (!flops.length) fl.innerHTML = '<p style="font-size:12px;color:var(--dim)">🎉 Pas encore assez de données — ou tu es inarrêtable.</p>';
        else flops.forEach(([idx, s]) => {
          const q = ALL_Q[idx];
          if (!q) return;
          const d = document.createElement('div');
          d.className = 'flop-item';
          d.innerHTML = `
																							
													
															
																					<span class="flop-pct">${Math.round(s.ok/s.tot*100)}%</span>${q.q.substring(0,80)}…`;
          fl.appendChild(d);
        });
        // Exam history
        const examHistEl = document.getElementById('exam-hist-list');
        if (examHistEl) {
          const hist = lsGet('examHist', []);
          if (!hist.length) {
            examHistEl.innerHTML = `
																					<p style="font-size:12px;color:var(--dim)">Aucun examen passé pour l'instant.</p>`;
          } else {
            examHistEl.innerHTML = hist.map(h => {
              const pctColor = h.pct >= 80 ? 'var(--green)' : h.pct >= 50 ? 'var(--gold)' : 'var(--red)';
              return `
																							
												
															
																					<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;background:rgba(16,28,48,.7);border:1px solid rgba(26,45,74,.8);margin-bottom:6px;font-size:12px">
																						<span style="font-size:18px">${h.emoji}</span>
																						<span style="font-family:var(--font-mono);font-weight:700;color:${pctColor};min-width:36px">${h.pct}%</span>
																						<span style="color:var(--dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h.themes}</span>
																						<span style="color:var(--dim);font-size:10px;white-space:nowrap">${h.n}Q · ${h.date}</span>
																					</div>`;
            }).join('');
          }
        }
        document.getElementById('bilan-overlay').classList.add('show');
        renderWeeklyLB();
        setTimeout(drawRadar, 80);
      }

      function renderWeeklyLB() {
        const el = document.getElementById('weekly-lb');
        if (!el) return;
        const wl = lsGet('weeklyLB', {});
        const weeks = Object.entries(wl).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 4);
        if (!weeks.length) {
          el.innerHTML = '<p style="font-size:12px;color:var(--dim);text-align:center">Aucun score enregistré cette semaine.</p>';
          return;
        }
        el.innerHTML = weeks.map(([wk, v], i) => {
          const label = i === 0 ? 'Cette semaine' : i === 1 ? 'Semaine passée' : `S-${i+1}`;
          return `
																							
												
															
																					<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;background:rgba(16,28,48,.7);border:1px solid rgba(26,45,74,.8);margin-bottom:6px;font-size:13px">
																						<span style="font-size:16px">${i===0?'🥇':i===1?'🥈':'🥉'}</span>
																						<span style="color:var(--dim);font-size:11px;width:90px;flex-shrink:0">${label}</span>
																						<span style="font-family:var(--font-mono);color:var(--gold);font-weight:700">${v.score} pts</span>
																						<span style="color:var(--dim);font-size:11px;margin-left:auto">${v.acc}% · ${v.date}</span>
																					</div>`;
        }).join('');
      }

      function shareBilan() {
        const {
          rank
        } = getRank(S.xp);
        const acc = S.total ? Math.round(S.correct / S.total * 100) : 0;
        const text = `🕵️ CAS-IN Investigation Numérique\n${rank.emoji} ${rank.name}\n📊 ${S.correct}/${S.total} correctes · ${acc}% · ${S.score} pts\n🔥 Meilleure série : ${S.maxStreak}\n⚡ ${S.xp} XP total\n\n#DFIR #Forensics #CAS_IN`;
        if (navigator.share) {
          navigator.share({
            title: 'Mon bilan CAS-IN',
            text
          }).catch(() => {});
        } else {
          navigator.clipboard?.writeText(text).then(() => showToast('streak-toast', '📋 Bilan copié dans le presse-papier !', 2500)).catch(() => prompt('Copier ce texte :', text));
        }
      }

      function checkAchievements() {
        const unlocked = new Set(lsGet('achievements', []));
        let newOnes = [];
        ACHIEVEMENTS.forEach(a => {
          if (unlocked.has(a.id)) return;
          try {
            if (a.check(S)) {
              unlocked.add(a.id);
              newOnes.push(a);
            }
          } catch {}
        });
        if (newOnes.length) {
          lsSet('achievements', [...unlocked]);
          newOnes.forEach((a, i) => setTimeout(() => showAchievementPopup(a), i * 2500));
        }
      }

      function showAchievementPopup(a) {
        document.getElementById('ap-emoji').textContent = a.emoji;
        document.getElementById('ap-name').textContent = a.name;
        document.getElementById('ap-desc').textContent = a.desc;
        const p = document.getElementById('achievement-popup');
        p.classList.add('show');
        setTimeout(() => p.classList.remove('show'), 3000);
        playSound(true);
        addXp(25);
      }

      function openAchievements() {
        const unlocked = new Set(lsGet('achievements', []));
        const {
          rank,
          idx
        } = getRank(S.xp);
        const next = RANKS[idx + 1];
        const pct = next ? Math.min(100, Math.round((S.xp - rank.min) / (next.min - rank.min) * 100)) : 100;
        document.getElementById('xp-rank-panel').innerHTML = `
    
																							
												
															
																					<div class="rank-display">
																						<span class="rank-emoji">${rank.emoji}</span>
																						<div class="rank-info">
																							<div class="rank-name">${rank.name}</div>
																							<div style="font-size:10px;color:var(--purple);font-style:italic;margin-bottom:2px">${rank.flavor||''}</div>
																							<div class="rank-xp">${S.xp} XP${next?' · Prochain : '+next.name+' ('+next.min+' XP)':' · Rang maximum !'}</div>
																							<div class="rank-bar-outer">
																								<div class="rank-bar-inner" style="width:${pct}%"></div>
																							</div>
																						</div>
																					</div>
																					<div style="font-size:11px;color:var(--dim);margin-top:8px;text-align:center">
      ${unlocked.size} / ${ACHIEVEMENTS.length} succès débloqués
    </div>`;
        const grid = document.getElementById('achiev-grid');
        grid.innerHTML = '';
        const cats = [{
          label: 'Quantité',
          ids: ['first', 'ten', 'fifty', 'hundred', 'five00', 'thou', 'twoK']
        }, {
          label: 'Séries',
          ids: ['streak1', 'streak3', 'streak5', 'streak10', 'streak20', 'streak50']
        }, {
          label: 'Précision',
          ids: ['acc90', 'acc95', 'perfect', 'perfect20']
        }, {
          label: 'Combo',
          ids: ['combo', 'combo3']
        }, {
          label: 'Difficile',
          ids: ['hard10', 'hard50']
        }, {
          label: 'Régularité',
          ids: ['daily3', 'daily7', 'daily10', 'daily14', 'daily30']
        }, {
          label: 'Spéciaux',
          ids: ['night', 'comeback', 'allthemes', 'book10', 'book25', 'smart50', 'smart200', 'daily_ch', 'hint']
        }, {
          label: 'Secrets 🤫',
          ids: ['s_3am', 's_42', 's_13', 's_hints3', 's_speed5', 's_skip']
        }, ];
        cats.forEach(cat => {
          const catItems = ACHIEVEMENTS.filter(a => cat.ids.includes(a.id));
          if (!catItems.length) return;
          const h = document.createElement('div');
          h.className = 'achiev-cat';
          h.textContent = cat.label;
          grid.appendChild(h);
          catItems.forEach(a => {
            const ok = unlocked.has(a.id);
            const d = document.createElement('div');
            d.className = 'achiev-item' + (ok ? ' unlocked' : '');
            const isSecret = a.secret && !ok;
            d.className = 'achiev-item' + (ok ? ' unlocked' : '') + (a.secret ? ' secret' : '');
            d.innerHTML = `
																							
												
															
																					<span class="achiev-emoji">${isSecret?'❓':a.emoji}</span>
																					<div class="achiev-name">${isSecret?'???':a.name}</div>
																					<div class="achiev-desc">${isSecret?'Succès secret — à découvrir...':a.desc}</div>`;
            grid.appendChild(d);
          });
        });
        document.getElementById('achievements-overlay').classList.add('show');
      }

      function checkMilestone() {
        if (!S.total) return;
        const acc = Math.round(S.correct / S.total * 100);
        const shown = lsGet('ms', []);
        const {
          idx: rankIdx
        } = getRank(S.xp);
        MILESTONES.forEach(m => {
          if (shown.includes(m.id)) return;
          let cond = false;
          if (m.rankMin != null) cond = rankIdx >= m.rankMin;
          else if (m.streakOnly) cond = S.maxStreak >= m.minStreak;
          else cond = S.total >= m.minQ && acc >= m.minAcc;
          if (cond) {
            shown.push(m.id);
            lsSet('ms', shown);
            document.getElementById('ms-emoji').textContent = m.emoji;
            document.getElementById('ms-title').textContent = m.title;
            document.getElementById('ms-sub').textContent = m.sub;
            document.getElementById('ms-stats').textContent = S.total + ' questions · ' + acc + '% de réussite';
            document.getElementById('milestone-overlay').classList.add('show');
            launchConfetti(S.curQ?.theme);
          }
        });
      }

      function checkMilestoneByRank(idx) {
        const m = MILESTONES.find(m => m.rankMin === idx);
        if (m) {
          const shown = lsGet('ms', []);
          if (!shown.includes(m.id)) {
            shown.push(m.id);
            lsSet('ms', shown);
            document.getElementById('ms-emoji').textContent = m.emoji;
            document.getElementById('ms-title').textContent = m.title;
            document.getElementById('ms-sub').textContent = m.sub;
            document.getElementById('ms-stats').textContent = 'Rang atteint !';
            document.getElementById('milestone-overlay').classList.add('show');
            launchConfetti(S.curQ?.theme);
          }
        }
      }

      function closeMilestone() {
        document.getElementById('milestone-overlay').classList.remove('show');
        document.getElementById('confetti-wrap').innerHTML = '';
      }
      const THEME_CONFETTI = {
        'Informatique de base': ['💻', '🖥️', '🔌', '📱', '⌨️'],
        'Acquisition et analyse': ['🔍', '🧪', '📊', '🗂️', '🔎'],
        'Système de fichiers': ['📁', '📂', '💾', '🗃️', '📋'],
        'Spécificité des OS': ['🐧', '🪟', '🍎', '⚙️', '🖥️'],
        'Cryptologie': ['🔐', '🔑', '🛡️', '🔒', '⚖️'],
        'OSINT': ['🕵️', '🌐', '📡', '🗺️', '👁️'],
        'Droit': ['⚖️', '📜', '🏛️', '📋', '🔏'],
      };

      function launchConfetti(theme) {
        const w = document.getElementById('confetti-wrap');
        w.innerHTML = '';
        const cols = ['#00e5cc', '#f0c040', '#ff6b9d', '#30e88a', '#7ab8ff', '#a78bfa'];
        const emojis = theme && THEME_CONFETTI[theme] ? THEME_CONFETTI[theme] : null;
        for (let i = 0; i < 100; i++) {
          const p = document.createElement('div');
          if (emojis && Math.random() > 0.45) {
            // Emoji particle
            const em = emojis[Math.floor(Math.random() * emojis.length)];
            const sz = 14 + Math.random() * 12;
            p.style.cssText = `position:absolute;font-size:${sz}px;left:${Math.random()*100}%;top:-20px;pointer-events:none;user-select:none;animation:cffall ${1.4+Math.random()*2}s ${Math.random()*.6}s forwards`;
            p.textContent = em;
          } else {
            // Classic color particle
            const sz = 5 + Math.random() * 9;
            p.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:${Math.random()>.5?'50%':'2px'};background:${cols[0|Math.random()*6]};left:${Math.random()*100}%;top:-10px;animation:cffall ${1.2+Math.random()*2}s ${Math.random()*.5}s forwards`;
          }
          w.appendChild(p);
        }
      }

      function showRankUp(rank) {
        updateAvatarChip();
        const t = document.getElementById('rankup-toast');
        if (!t) return;
        document.getElementById('ru-emoji').textContent = rank.emoji;
        document.getElementById('ru-name').textContent = rank.name;
        document.getElementById('ru-flavor').textContent = rank.flavor || '';
        t.classList.remove('show');
        void t.offsetWidth;
        t.classList.add('show');
        const a = ac();
        if (a && SOUND_ON) {
          const t2 = a.currentTime;
          [523, 659, 784, 1047, 1319].forEach((f, i) => {
            const o = a.createOscillator(),
              g = a.createGain();
            o.connect(g);
            g.connect(a.destination);
            o.frequency.value = f;
            g.gain.setValueAtTime(.15, t2 + i * .1);
            g.gain.exponentialRampToValueAtTime(.001, t2 + i * .1 + .3);
            o.start(t2 + i * .1);
            o.stop(t2 + i * .1 + .35);
          });
        }
        setTimeout(() => t.classList.remove('show'), 3500);
        launchConfetti(S.curQ?.theme);
      }

      function useHint() {
        if (S.hintsLeft <= 0 || S.answered) return;
        const q = S.curQ;
        if (!q) return;
        const btns = [...document.querySelectorAll('.choice-btn:not(.hint-eliminated):not(:disabled)')];
        const wrong = btns.filter(btn => !q.answers.includes(+btn.dataset.origIdx));
        if (!wrong.length) return;
        const victim = wrong[Math.floor(Math.random() * wrong.length)];
        victim.classList.add('hint-eliminated');
        victim.disabled = true;
        S.hintsLeft--;
        S.hintsUsed++;
        S._hintUsedThisQ = true;
        lsSet('hintsUsed', S.hintsUsed);
        lsSet('hintsLeft', S.hintsLeft);
        const hc = document.getElementById('hint-count');
        if (hc) hc.textContent = S.hintsLeft;
        const hb = document.getElementById('hint-btn');
        if (hb && S.hintsLeft === 0) hb.disabled = true;
        checkAchievements();
        showToast('streak-toast', '💡 Indice utilisé — XP réduit de 50% pour cette question', 2000);
      }

      function resetHints() {
        const today = getDailyDate();
        if (lsGet('hintDate', '') !== today) {
          lsSet('hintDate', today);
          S.hintsLeft = 3;
          lsSet('hintsLeft', 3);
        } else {
          S.hintsLeft = lsGet('hintsLeft', 3);
        }
        const hc = document.getElementById('hint-count');
        if (hc) hc.textContent = S.hintsLeft;
        const hb = document.getElementById('hint-btn');
        if (hb) hb.disabled = S.hintsLeft <= 0;
      }

      function buildPersonaChips() {
        const wrap = document.getElementById('persona-chips');
        if (!wrap) return;
        wrap.innerHTML = '';
        PERSONAS.forEach(p => {
          const b = document.createElement('button');
          b.className = 'persona-btn';
          b.innerHTML = `${p.icon} ${p.label}`;
          b.title = p.desc;
          b.onclick = () => applyPersona(p);
          wrap.appendChild(b);
        });
      }

      function applyPersona(p) {
        S.activeD = new Set(p.diffs);
        document.querySelectorAll('[data-d]').forEach(c => {
          c.classList.toggle('active', S.activeD.has(c.dataset.d));
        });
        document.querySelectorAll('.persona-btn').forEach(b => {
          b.classList.toggle('active', b.title === p.desc);
        });
        showToast('streak-toast', `${p.icon} Profil ${p.label} activé`, 1800);
      }

      function showDailyQuote() {
        const seed = getDailySeed();
        const q = FORENSIC_QUOTES[seed % FORENSIC_QUOTES.length];
        const tb = document.getElementById('qb-text');
        const ab = document.getElementById('qb-author');
        if (tb && ab) {
          tb.textContent = '"' + q.q + '"';
          ab.textContent = '— ' + q.a;
        }
      }

      function trackComeback(correct) {
        if (!correct) {
          S._wrongRun = (S._wrongRun || 0) + 1;
          S._rightAfterWrong = 0;
          if (S._wrongRun >= 3) S._comebackPrimed = true;
        } else {
          if (S._comebackPrimed) {
            S._rightAfterWrong = (S._rightAfterWrong || 0) + 1;
            if (S._rightAfterWrong >= 5 && !S.comeback) {
              S.comeback = true;
              lsSet('comeback', true);
            }
          }
          S._wrongRun = 0;
        }
      }

      function updateRankFlavor() {
        const {
          rank
        } = getRank(S.xp);
        const fl = document.getElementById('rank-flavor');
        if (fl && rank.flavor) fl.textContent = rank.flavor;
      }

      function closeOverlay(id) {
        document.getElementById(id).classList.remove('show');
      }

      function openHelp() {
        document.getElementById('help-overlay').classList.add('show');
      }
      document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'Escape') {
          // Fermer la modale d'explication
          const eo = document.getElementById('expl-overlay');
          if (eo && eo.style.display === 'flex') {
            eo.style.display = 'none';
            document.body.style.overflow = '';
            return;
          }
          // Fermeture universelle : tous les overlays visibles
          const allOverlays = [
            'settings-overlay','exam-overlay','bilan-overlay',
            'achievements-overlay','help-overlay','avatar-overlay',
            'share-overlay','scene-overlay','fiches-overlay'
          ];
          let closed = false;
          allOverlays.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.classList.contains('show')) {
              closeOverlay(id);
              closed = true;
            }
          });
          closeMilestone();
          return;
        }
        if (e.key === '?' || e.key === '/') {
          openHelp();
          return;
        }
        const numKey = parseInt(e.key);
        if (numKey >= 1 && numKey <= 4 && !S.answered) {
          const btns = [...document.querySelectorAll('.choice-btn:not(.hint-eliminated):not(:disabled)')];
          const btn = btns[numKey - 1];
          if (btn) btn.click();
          return;
        }
        if (e.key === ' ') {
          e.preventDefault();
          if (S.answered) {
            const nb = document.getElementById('next-btn');
            if (nb && nb.style.display !== 'none') nextQuestion();
          } else {
            const vb = document.getElementById('validate-btn');
            if (vb && vb.style.display !== 'none' && !vb.disabled) validate();
          }
          return;
        }
        if ((e.key === 'Enter' || e.key === 'ArrowRight') && S.answered) {
          const nb = document.getElementById('next-btn');
          if (nb && nb.style.display !== 'none') nextQuestion();
          return;
        }
        if (e.key === 'h' || e.key === 'H') {
          if (!S.answered) useHint();
          return;
        }
        if (e.key === 'b' || e.key === 'B') {
          toggleBookmark();
          return;
        }
        if ((e.key === 'e' || e.key === 'E') && S.answered) {
          openExplModal();
          return;
        }
      });

      function trackPlayedDate() {
        const today = getDailyDate();
        const dates = new Set(lsGet('playdates', []));
        dates.add(today);
        lsSet('playdates', [...dates].slice(-60));
      }
      startLoadingMessages();
      fetch(new URL('questions.json', document.baseURI)).then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' — questions.json introuvable');
        return r.json();
      }).then(data => {
        ALL_Q = data;
        ALL_T = [...new Set(ALL_Q.map(q => q.theme))].sort();
        ALL_C = [...new Set(ALL_Q.map(q => q.chapter).filter(Boolean))].sort();
        // Mapping thème → chapitres (pour affichage groupé dans les filtres)
        window.THEME_CHAPTERS = {};
        ALL_Q.forEach(q => {
          if (q.theme && q.chapter) {
            if (!window.THEME_CHAPTERS[q.theme]) window.THEME_CHAPTERS[q.theme] = new Set();
            window.THEME_CHAPTERS[q.theme].add(q.chapter);
          }
        });
        Object.keys(window.THEME_CHAPTERS).forEach(t => {
          window.THEME_CHAPTERS[t] = [...window.THEME_CHAPTERS[t]].sort();
        });
        ALL_T.forEach(t => {
          S.byTheme[t] = {
            ok: 0,
            tot: 0
          };
        });
        ALL_C.forEach(c => {
          S.byChapter[c] = {
            ok: 0,
            tot: 0
          };
        });
        loadPersist();
        trackPlayedDate();
        buildPersonaChips();
        showDailyQuote();
        resetHints();
        updateRankFlavor();
        if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone && !lsGet('installDismissed', false)) {
          document.getElementById('install-banner').style.display = 'flex';
        }
        buildPool();
        initSwipe();
        updateSM2Badge();
        initGlossary();
        updateFreezeBtn();
        stopLoadingMessages();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main').style.display = 'flex';
        updateStreakDisplay();
        updateXpBar();
        showDailyBanner();
        showSessionResumeToast();
        renderQuestion(getNext());
      }).catch(err => {
        document.getElementById('loading').innerHTML = `
      
																								
												
															
																					<div style="text-align:center;padding:20px;max-width:380px">
																						<div style="font-size:48px;margin-bottom:12px">🕵️</div>
																						<p style="font-weight:700;color:var(--red);margin-bottom:8px">Fichier introuvable !</p>
																						<p style="font-size:13px;color:var(--dim);margin-bottom:12px">${err.message}</p>
																						<p style="font-size:12px;color:var(--dim)">Vérifiez que 
																										
														
																	
																							<code style="background:rgba(255,255,255,.08);padding:2px 5px;border-radius:3px">questions.json</code> est dans le même dossier.
																									
													
																
																						</p>
																						<button type="button" onclick="location.reload()" style="margin-top:16px;padding:8px 20px;border-radius:8px;background:var(--cyan);color:#08101c;font-weight:700;cursor:pointer;">Réessayer</button>
																					</div>`;
      });

      function updateLivesDisplay() {
        const el = document.getElementById('lives-display');
        if (!el) return;
        if (S.mode === 'survival') {
          el.classList.add('active');
          el.innerHTML = '';
          for (let i = 0; i < 3; i++) {
            const span = document.createElement('span');
            span.className = 'life' + (i >= S.lives ? ' lost' : '');
            span.textContent = '❤️';
            el.appendChild(span);
          }
        } else {
          el.classList.remove('active');
        }
      }

      function loseLife() {
        if (S.mode !== 'survival') return;
        S.lives--;
        const hearts = [...document.querySelectorAll('#lives-display .life')];
        const losing = hearts.filter(h => !h.classList.contains('lost'))[hearts.filter(h => !h.classList.contains('lost')).length - 1];
        if (losing) {
          losing.classList.add('losing');
          setTimeout(() => {
            losing.classList.remove('losing');
            losing.classList.add('lost');
          }, 400);
        }
        if (S.lives <= 0) {
          setTimeout(() => showSurvivalGameOver(), 600);
        }
      }

      function showSurvivalGameOver() {
        const go = document.getElementById('survival-gameover');
        const score = document.getElementById('go-score');
        const sub = document.getElementById('go-sub');
        if (S.score > S.survivalBest) {
          S.survivalBest = S.score;
          lsSet('survivalBest', S.survivalBest);
        }
        score.textContent = `Score : ${S.score} pts · ${S.correct} bonnes réponses`;
        sub.textContent = `Record personnel : ${S.survivalBest} pts`;
        go.classList.add('show');
        launchConfetti();
        playSound(false);
      }

      function restartSurvival() {
        document.getElementById('survival-gameover').classList.remove('show');
        S.score = 0;
        S.correct = 0;
        S.total = 0;
        S.streak = 0;
        S.maxStreak = 0;
        S.lives = 3;
        S.byDiff = {
          easy: {
            ok: 0,
            tot: 0
          },
          medium: {
            ok: 0,
            tot: 0
          },
          hard: {
            ok: 0,
            tot: 0
          }
        };
        S.byTheme = {};
        S.byChapter = {};
        document.getElementById('score-display').textContent = '0 pts';
        updateStreakDisplay();
        updateLivesDisplay();
        buildPool();
        renderQuestion(getNext());
      }

      function exitSurvival() {
        document.getElementById('survival-gameover').classList.remove('show');
        S.mode = 'normal';
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'normal'));
        updateLivesDisplay();
        buildPool();
        renderQuestion(getNext());
      }

      function getSM2Data(idx) {
        const d = lsGet('sm2_' + idx, null);
        return d || {
          interval: 1,
          ef: 2.5,
          due: getDailyDate(),
          reps: 0
        };
      }

      function saveSM2Data(idx, d) {
        lsSet('sm2_' + idx, d);
      }

      function updateSM2(idx, ok) {
        const d = getSM2Data(idx);
        const q = ok ? 5 : 1;
        let {
          interval,
          ef,
          reps
        } = d;
        if (q >= 3) {
          if (reps === 0) interval = 1;
          else if (reps === 1) interval = 6;
          else interval = Math.round(interval * ef);
          reps++;
        } else {
          reps = 0;
          interval = 1;
        }
        ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
        const due = new Date();
        due.setDate(due.getDate() + interval);
        saveSM2Data(idx, {
          interval,
          ef,
          due: due.toISOString().slice(0, 10),
          reps
        });
        updateSM2Badge();
      }

      function getSM2Due() {
        const today = getDailyDate();
        const due = [];
        Object.keys(localStorage).forEach(k => {
          if (!k.startsWith('sm2_')) return;
          try {
            const idx = parseInt(k.slice(4));
            const d = JSON.parse(localStorage.getItem(k));
            if (d && d.due <= today) due.push(idx);
          } catch {}
        });
        return due;
      }

      function updateSM2Badge() {
        const due = getSM2Due();
        const badge = document.getElementById('sm2-badge');
        const count = document.getElementById('sm2-count');
        if (!badge || !count) return;
        if (due.length > 0) {
          badge.classList.remove('hidden');
          count.textContent = due.length;
        } else {
          badge.classList.add('hidden');
        }
      }

      function activateSM2Mode() {
        S.mode = 'sm2';
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'sm2'));
        buildPool();
        renderQuestion(getNext());
        showToast('streak-toast', `🃏 Mode SM-2 : ${getSM2Due().length} questions dues`, 2500);
      }

      function drawRadar() {
        const canvas = document.getElementById('radar-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const themes = Object.keys(TC);
        const n = themes.length;
        // Use actual pixel size (CSS may scale it, use canvas intrinsic size)
        const W = canvas.width,
          H = canvas.height;
        const cx = W / 2,
          cy = H / 2;
        // Leave 52px margin on each side for labels
        const R = Math.min(cx, cy) - 52;
        ctx.clearRect(0, 0, W, H);
        // Grid rings
        [0.25, 0.5, 0.75, 1].forEach(frac => {
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * R * frac,
              y = cy + Math.sin(angle) * R * frac;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = frac === 1 ? 'rgba(0,229,204,.25)' : 'rgba(26,45,74,.5)';
          ctx.lineWidth = frac === 1 ? 1.5 : 0.8;
          ctx.stroke();
          // Percentage label on the right axis at each ring
          if (frac < 1) {
            ctx.fillStyle = 'rgba(106,128,168,.5)';
            ctx.font = '8px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(frac * 100) + '%', cx + R * frac + 3, cy);
          }
        });
        // Axis lines
        themes.forEach((_, i) => {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
          ctx.strokeStyle = 'rgba(26,45,74,.7)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
        // Data polygon
        ctx.beginPath();
        themes.forEach((t, i) => {
          const {
            ok,
            tot
          } = S.byTheme[t] || {
            ok: 0,
            tot: 0
          };
          const pct = tot > 0 ? ok / tot : 0;
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(angle) * R * pct,
            y = cy + Math.sin(angle) * R * pct;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,229,204,.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,229,204,.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Helper: draw text with optional second line
        function drawLabel(ctx, lines, x, y, align, baseline, color, bold) {
          ctx.fillStyle = color;
          ctx.font = (bold ? '600 ' : '400 ') + '10px Inter, sans-serif';
          ctx.textAlign = align;
          ctx.textBaseline = baseline;
          const lh = 13; // line height
          const totalH = (lines.length - 1) * lh;
          const startY = baseline === 'middle' ? y - totalH / 2 : baseline === 'bottom' ? y - totalH : y;
          lines.forEach((line, li) => ctx.fillText(line, x, startY + li * lh));
        }
        // Labels per theme — two-line splits for long names
        const LABEL_MAP = {
          'Informatique de base': ['Info.', 'de base'],
          'Acquisition et analyse': ['Acquisition', '& analyse'],
          'Système de fichiers': ['Sys. de', 'fichiers'],
          'Spécificité des OS': ['Spéc.', 'des OS'],
          'Cryptologie': ['Cryptologie'],
          'OSINT': ['OSINT'],
          'Droit': ['Droit'],
        };
        themes.forEach((t, i) => {
          const {
            ok,
            tot
          } = S.byTheme[t] || {
            ok: 0,
            tot: 0
          };
          const pct = tot > 0 ? ok / tot : 0;
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          // Data point dot
          const dx = cx + Math.cos(angle) * R * pct,
            dy = cy + Math.sin(angle) * R * pct;
          ctx.beginPath();
          ctx.arc(dx, dy, 4, 0, Math.PI * 2);
          ctx.fillStyle = TC[t] || '#00e5cc';
          ctx.fill();
          // Label position: push further out to avoid overlap with ring
          const labelDist = R + 32;
          const lx = cx + Math.cos(angle) * labelDist;
          const ly = cy + Math.sin(angle) * labelDist;
          // Alignment based on angle quadrant
          const cos = Math.cos(angle),
            sin = Math.sin(angle);
          const hAlign = Math.abs(cos) < 0.2 ? 'center' : cos > 0 ? 'left' : 'right';
          const vAlign = Math.abs(sin) < 0.2 ? 'middle' : sin > 0 ? 'top' : 'bottom';
          const lines = LABEL_MAP[t] || [t];
          const color = tot > 0 ? (TC[t] || 'var(--text)') : 'rgba(100,120,168,.4)';
          drawLabel(ctx, lines, lx, ly, hAlign, vAlign, color, tot > 0);
          // Score annotation near dot (only if data exists)
          if (tot > 0) {
            ctx.fillStyle = 'rgba(204,216,240,.6)';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Offset annotation slightly away from center
            const annDist = Math.max(R * pct + 12, 18);
            const ax = cx + Math.cos(angle) * annDist;
            const ay = cy + Math.sin(angle) * annDist;
            ctx.fillText(Math.round(pct * 100) + '%', ax, ay);
          }
        });
        // Center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,229,204,.4)';
        ctx.fill();
        // No-data message
        const hasData = themes.some(t => (S.byTheme[t]?.tot || 0) > 0);
        if (!hasData) {
          ctx.fillStyle = 'rgba(106,128,168,.5)';
          ctx.font = '11px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Réponds à des questions pour', cx, cy - 8);
          ctx.fillText('voir ton radar de compétences', cx, cy + 8);
        }
      }

      function initSwipe() {
        const card = document.getElementById('question-card');
        if (!card) return;
        let sx = 0,
          sy = 0;
        card.addEventListener('touchstart', e => {
          sx = e.touches[0].clientX;
          sy = e.touches[0].clientY;
        }, {
          passive: true
        });
        card.addEventListener('touchend', e => {
          const dx = e.changedTouches[0].clientX - sx;
          const dy = e.changedTouches[0].clientY - sy;
          if (Math.abs(dx) < Math.abs(dy) * 1.5 || Math.abs(dx) < 50) return;
          if (S.answered) return;
          if (dx < -50) {
            card.style.transition = 'transform .25s ease,opacity .25s';
            card.style.transform = 'translateX(-60px)';
            card.style.opacity = '.5';
            setTimeout(() => {
              card.style.transition = '';
              card.style.transform = '';
              card.style.opacity = '';
              doSkip();
            }, 250);
          } else if (dx > 50) {
            toggleBookmark();
            card.style.transition = 'transform .2s ease';
            card.style.transform = 'translateX(12px)';
            setTimeout(() => {
              card.style.transition = '';
              card.style.transform = '';
            }, 200);
            showToast('streak-toast', S.bookmarks.has(S.curIdx) ? '⭐ Ajouté aux favoris' : '☆ Retiré des favoris', 1500);
          }
        }, {
          passive: true
        });
      }
      const GLOSSARY = {
        'MFT': {
          full: 'Master File Table',
          def: 'Table centrale de NTFS : un enregistrement de 1 Ko par fichier/dossier. Les 16 premiers sont réservés aux métafichiers systèmes.'
        },
        '$MFT': {
          full: 'Master File Table',
          def: 'Métafichier NTFS #0. Contient un enregistrement pour chaque fichier du volume. Jamais fragmenté volontairement.'
        },
        'ADS': {
          full: 'Alternate Data Stream',
          def: 'Flux de données alternatif NTFS. Syntaxe : fichier.ext:nom_stream. Invisible dans l\'Explorateur — utilisé pour la dissimulation de données.'
        },
        'LFN': {
          full: 'Long File Name',
          def: 'Entrée de répertoire FAT spéciale (attribut 0x0F) pour stocker des noms > 8.3 caractères en UTF-16, par tranches de 13 chars.'
        },
        'SFN': {
          full: 'Short File Name',
          def: 'Nom de fichier court FAT au format 8.3 (8 chars nom + 3 chars extension). L\'entrée de 32 octets est le format natif FAT.'
        },
        'VCN': {
          full: 'Virtual Cluster Number',
          def: 'Numéro de cluster logique au sein d\'un fichier NTFS (0 = début du fichier). Traduit en LCN via les data runs.'
        },
        'LCN': {
          full: 'Logical Cluster Number',
          def: 'Numéro de cluster physique sur le volume NTFS. Les data runs mappent VCN→LCN.'
        },
        'pgcd': {
          full: 'Plus Grand Commun Diviseur',
          def: 'En RSA : pgcd(e, φ(n)) doit être égal à 1 pour que l\'inverse modulaire d existe. Calculé par l\'algorithme d\'Euclide.'
        },
        'φ(n)': {
          full: 'Indicatrice d\'Euler',
          def: 'Pour RSA : φ(n) = (p−1)(q−1). Nombre d\'entiers entre 1 et n premiers avec n. Fondamental pour calculer d.'
        },
        'CNID': {
          full: 'Catalog Node ID',
          def: 'Identifiant unique HFS+ de chaque fichier/dossier. Analogue au numéro d\'inode EXT. CNID 2 = répertoire racine.'
        },
        'DFIR': {
          full: 'Digital Forensics & Incident Response',
          def: 'Discipline combinant l\'analyse post-mortem des systèmes compromis et la réponse en temps réel aux incidents de sécurité.'
        },
        'OTP': {
          full: 'One-Time Pad',
          def: 'Chiffrement théoriquement incassable si la clé est aussi longue que le message, aléatoire, et utilisée une seule fois (Shannon, 1949).'
        },
        'PE': {
          full: 'Portable Executable',
          def: 'Format des exécutables Windows (.exe, .dll, .sys). Signature : MZ (4D 5A) en en-tête. Contient sections .text, .data, .rdata…'
        },
        'IC': {
          full: 'Indice de Coïncidence',
          def: 'Mesure statistique de Friedman (1920). Texte anglais/fr : ~0.065. Vigenère : ~0.038. Permet d\'identifier le type de chiffrement.'
        },
        'SM-2': {
          full: 'SuperMemo 2',
          def: 'Algorithme de répétition espacée (Wozniak, 1987). Calcule l\'intervalle optimal de révision selon la qualité de rappel (1–5).'
        },
        'EFS': {
          full: 'Encrypting File System',
          def: 'Chiffrement transparent de NTFS. Les données sont chiffrées avec AES-256. Un second attribut $DATA stocke le descripteur de clé EFS.'
        },
        'PCAP': {
          full: 'Packet Capture',
          def: 'Format de capture réseau. Magic bytes : A1B2C3D4 (big-endian) ou D4C3B2A1 (little-endian x86). Utilisé par Wireshark/tcpdump.'
        },
        'MBR': {
          full: 'Master Boot Record',
          def: 'Premier secteur d\'un disque (512 octets). Signature : 55 AA aux offsets 510-511. Contient le code de boot et la table des partitions.'
        },
        'GPT': {
          full: 'GUID Partition Table',
          def: 'Standard moderne remplaçant le MBR. Supporte > 2 To et > 4 partitions. Le Protective MBR contient une partition de type 0xEE.'
        },
        'SHA-256': {
          full: 'Secure Hash Algorithm 256',
          def: 'Fonction de hachage cryptographique. Produit 64 caractères hex (256 bits). Résistant aux collisions. Standard NIST pour l\'intégrité forensique.'
        },
        'FAT': {
          full: 'File Allocation Table',
          def: 'Système de fichiers Microsoft (FAT12/16/32). La table FAT est une liste chaînée de clusters. Octets 0xE5 = supprimé, 0x00 = libre, 0xF8 = media descriptor.'
        },
        'exFAT': {
    file: 'fiches/exfat.html',
          full: 'Extended FAT',
          def: 'Successeur de FAT32 pour les cartes SD et clés USB > 32 Go. Pas de table FAT : utilise une Allocation Bitmap et une Up-case Table.'
        },
        'NTFS': {
    file: 'fiches/ntfs.html',
          full: 'New Technology File System',
          def: 'Système de fichiers Windows depuis NT 3.1. Basé sur le $MFT, supporte les ADS, l\'EFS, les quotas, et les journaux ($LogFile, $USNJrnl).'
        },
        'EXT4': {
          full: 'Fourth Extended Filesystem',
          def: 'Système de fichiers Linux. Journalisé, supporte jusqu\'à 1 exbioctet. Les inodes contiennent les métadonnées ; inode 2 = répertoire racine.'
        },
        'HFS+': {
          full: 'Hierarchical File System Plus',
          def: 'Système de fichiers Apple (Mac OS 8.1 – macOS 10.15). Epoch au 1er janvier 1904. Remplacé par APFS en 2017.'
        },
        'APFS': {
          full: 'Apple File System',
          def: 'Système de fichiers Apple depuis 2017. Optimisé pour les SSD, chiffrement natif, snapshots copy-on-write, clones à coût nul.'
        },
        'inode': {
          full: 'Index Node',
          def: 'Structure EXT stockant les métadonnées d\'un fichier (permissions, timestamps, pointeurs de blocs). PAS le nom du fichier — celui-ci est dans le répertoire.'
        },
        '$USNJrnl': {
          full: 'Update Sequence Number Journal',
          def: 'Journal des modifications NTFS. Enregistre toute création, modification, suppression de fichier avec timestamp et raison. Goldmine forensique.'
        },
        '$LogFile': {
          full: 'Log File',
          def: 'Journal transactionnel NTFS qui garantit la cohérence après un crash. Distinct du $USNJrnl (qui trace l\'historique utilisateur).'
        },
        '$I30': {
          full: 'Directory Index',
          def: 'Attribut NTFS de répertoire contenant un B-tree d\'index des fichiers enfants. Les nœuds orphelins peuvent révéler des fichiers supprimés.'
        },
        'VBR': {
          full: 'Volume Boot Record',
          def: 'Premier secteur d\'un volume (partition). Contient le BPB (BIOS Parameter Block) avec la géométrie du système de fichiers.'
        },
        'BPB': {
          full: 'BIOS Parameter Block',
          def: 'Structure dans le VBR décrivant le volume : taille de secteur, taille de cluster, nombre de FATs, taille du volume. Essentiel pour parser FAT/NTFS.'
        },
        'slack': {
          full: 'File Slack / Cluster Slack',
          def: 'Espace inutilisé entre la fin d\'un fichier et la fin de son dernier cluster. Peut contenir des résidus de fichiers précédents — exploitable en forensique.'
        },
        'LBA': {
          full: 'Logical Block Addressing',
          def: 'Mode d\'adressage des secteurs disque. LBA 0 = MBR. Remplace le CHS (Cylinder-Head-Sector). Chaque LBA = 512 octets (classique) ou 4096 (Advanced Format).'
        },
        'RAID': {
          full: 'Redundant Array of Independent Disks',
          def: 'Regroupement de disques pour la performance et/ou la redondance. RAID 0 = stripping (perf), RAID 1 = miroir, RAID 5 = parité distribuée.'
        },
        'hash': {
          full: 'Fonction de hachage',
          def: 'Algorithme produisant une empreinte de taille fixe à partir de données quelconques. MD5 (128 bits), SHA-1 (160 bits), SHA-256 (256 bits). Irréversible par définition.'
        },
        'MD5': {
          full: 'Message Digest 5',
          def: 'Fonction de hachage produisant 32 caractères hex (128 bits). Considérée cassée pour la cryptographie mais standard en forensique pour vérifier l\'intégrité d\'une image.'
        },
        'SHA-1': {
          full: 'Secure Hash Algorithm 1',
          def: 'Fonction de hachage produisant 40 hex (160 bits). Dépréciée depuis 2017 (collision SHAttered). Encore utilisée dans les vieux systèmes PKI.'
        },
        'RSA': {
          full: 'Rivest–Shamir–Adleman',
          def: 'Algorithme asymétrique basé sur la difficulté de factoriser n = p×q. Clé publique (n,e), clé privée (n,d). Chiffrement : c = m^e mod n. Déchiffrement : m = c^d mod n.'
        },
        'PKI': {
          full: 'Public Key Infrastructure',
          def: 'Infrastructure de gestion des clés publiques. Comprend les AC (Autorité de Certification), les CRL (listes de révocation), et les certificats X.509.'
        },
        'X.509': {
          full: 'Certificat X.509',
          def: 'Standard ITU-T définissant le format des certificats numériques. Contient : clé publique, sujet, émetteur, période de validité, signature de l\'AC.'
        },
        'S/MIME': {
          full: 'Secure/Multipurpose Internet Mail Extensions',
          def: 'Standard pour chiffrer et signer les emails. Utilise des certificats X.509. Chiffrement asymétrique de la clé de session + chiffrement symétrique du message.'
        },
        'AES': {
          full: 'Advanced Encryption Standard',
          def: 'Chiffrement symétrique par blocs de 128 bits, clés 128/192/256 bits. Standard NIST depuis 2001. Modes courants : CBC, CTR, GCM. Remplace DES/3DES.'
        },
        'IV': {
          full: 'Initialization Vector',
          def: 'Valeur aléatoire ajoutée au premier bloc d\'un chiffrement par blocs (CBC/CTR). Évite que deux messages identiques produisent le même chiffré. Ne doit pas se répéter.'
        },
        'XOR': {
          full: 'Exclusive OR',
          def: 'Opération bit à bit : 0⊕0=0, 1⊕1=0, 0⊕1=1. Base du chiffrement de flux et de nombreux algorithmes. Propriété clé : A⊕B⊕B = A (annulation).'
        },
        'Vigenère': {
          full: 'Chiffre de Vigenère',
          def: 'Chiffrement polyalphabétique par substitution avec une clé répétée. IC ≈ 0.038 → texte chiffré. Longueur de clé trouvable par l\'indice de coïncidence de Friedman.'
        },
        'OSINT': {
          full: 'Open Source Intelligence',
          def: 'Collecte de renseignements à partir de sources ouvertes : web, réseaux sociaux, registres WHOIS, métadonnées, images. Cadre légal important.'
        },
        'WHOIS': {
          full: 'WHOIS Protocol',
          def: 'Protocole de requête pour obtenir les infos d\'enregistrement d\'un domaine (registrant, DNS, dates). Données souvent masquées par les services de privacy proxy.'
        },
        'EXIF': {
          full: 'Exchangeable Image File Format',
          def: 'Métadonnées embarquées dans les fichiers JPEG/TIFF. Peuvent contenir : GPS, appareil, date/heure, paramètres de prise de vue. Souvent négligées par l\'auteur.'
        },
        'Shodan': {
          full: 'Shodan Search Engine',
          def: 'Moteur de recherche OSINT pour les appareils connectés (IoT, serveurs, caméras). Indexe les bannières de services. Très utilisé en reconnaissance réseau.'
        },
        'IP': {
          full: 'Internet Protocol Address',
          def: 'Identifiant réseau d\'un hôte. IPv4 = 32 bits (ex: 192.168.1.1), IPv6 = 128 bits. L\'IP source dans un paquet peut être usurpée (spoofing).'
        },
        'TTL': {
          full: 'Time To Live',
          def: 'Champ IP limitant le nombre de sauts d\'un paquet. Valeur initiale typique : 64 (Linux), 128 (Windows), 255 (réseau). Diminue de 1 à chaque routeur.'
        },
        'DNS': {
          full: 'Domain Name System',
          def: 'Protocole de résolution de noms. Requête A = IPv4, AAAA = IPv6, MX = mail, TXT = texte. Les logs DNS sont une source forensique majeure.'
        },
        'TCP': {
          full: 'Transmission Control Protocol',
          def: 'Protocole fiable orienté connexion. Handshake SYN/SYN-ACK/ACK. Flags courants en analyse : SYN, ACK, FIN, RST, PSH. Port source + destination identifient la session.'
        },
        'CoC': {
          full: 'Chain of Custody',
          def: 'Documentation traçant chaque manipulation d\'une preuve depuis sa saisie jusqu\'au tribunal. Une rupture invalide la recevabilité de la preuve en justice.'
        },
        'image': {
          full: 'Image forensique',
          def: 'Copie bit-à-bit exacte d\'un support (DD, E01, AFF). Inclut les espaces libres, slack space et secteurs endommagés. Vérifiée par hash avant/après acquisition.'
        },
        'E01': {
          full: 'Expert Witness Format',
          def: 'Format propriétaire EnCase pour les images forensiques. Supporte la compression, le chiffrement, les métadonnées cas, et les hash intégrés par segment.'
        },
        'Autopsy': {
          full: 'Autopsy Forensic Browser',
          def: 'Interface graphique open-source pour The Sleuth Kit (TSK). Permet l\'analyse de disques, la récupération de fichiers supprimés, la recherche par mots-clés.'
        },
        'TSK': {
          full: 'The Sleuth Kit',
          def: 'Suite d\'outils CLI open-source pour l\'analyse forensique de systèmes de fichiers. Commandes clés : fls (liste), icat (extraction), fsstat (infos volume).'
        },
        'RAM': {
          full: 'Random Access Memory / Mémoire volatile',
          def: 'Mémoire perdue à l\'extinction. Contient : processus actifs, connexions réseau, clés de chiffrement, mots de passe en clair. L\'acquisition RAM doit être prioritaire sur disque.'
        },
        'write-blocker': {
          full: 'Bloqueur en écriture',
          def: 'Dispositif matériel ou logiciel empêchant toute écriture sur le support original lors d\'une acquisition. Obligatoire pour préserver l\'intégrité des preuves.'
        },
        'IOC': {
          full: 'Indicator of Compromise',
          def: 'Artefact indiquant une compromission potentielle : hash malveillant, IP suspecte, domaine C2, clé registre anormale, mutex malware, etc. Base du threat hunting.'
        },
        'IOA': {
          full: 'Indicator of Attack',
          def: 'Comportement révélant une attaque en cours plutôt qu’un simple artefact statique. Ex : PowerShell encodé + création de tâche planifiée + connexion externe.'
        },
        'YARA': {
          full: 'Yet Another Recursive Acronym',
          def: 'Langage de règles permettant d’identifier des fichiers/malwares par signatures textuelles, hexadécimales ou comportementales. Standard du malware hunting.'
        },
        'SIEM': {
          full: 'Security Information and Event Management',
          def: 'Plateforme centralisant et corrélant les logs de multiples sources (EDR, firewall, AD, IDS, DNS…) pour détection d’incidents et investigation.'
        },
        'EDR': {
          full: 'Endpoint Detection and Response',
          def: 'Solution de sécurité surveillant les endpoints pour détecter et répondre aux comportements suspects. Fournit souvent télémétrie et isolation à distance.'
        },
        'C2': {
          full: 'Command and Control',
          def: 'Infrastructure utilisée par un attaquant pour piloter un malware/implant à distance. Peut utiliser HTTP, DNS, HTTPS, TOR ou canaux covert.'
        },
        'Beaconing': {
          full: 'Beaconing',
          def: 'Communication périodique et régulière d’un malware vers son serveur C2. Signature classique observable en analyse réseau.'
        },
        'Prefetch': {
          full: 'Windows Prefetch',
          def: 'Fichiers .pf créés par Windows pour accélérer le lancement des programmes. Très utile en forensique pour prouver l’exécution d’un binaire.'
        },
        'Amcache': {
          full: 'Application Compatibility Cache',
          def: 'Base de données Windows enregistrant les exécutables lancés/présents. Source précieuse pour retracer l’activité utilisateur et malware.'
        },
        'ShimCache': {
          full: 'Application Compatibility Shim Cache',
          def: 'Cache Windows stockant des traces d’exécution de binaires. Aussi appelé AppCompatCache. Utilisé pour identifier des programmes exécutés historiquement.'
        },
        'Registry': {
          full: 'Windows Registry',
          def: 'Base hiérarchique de configuration Windows contenant paramètres système, logiciels, utilisateurs et nombreuses traces forensiques.'
        },
        'Hive': {
          full: 'Registry Hive',
          def: 'Fichier physique stockant une portion du registre Windows. Ex : SAM, SYSTEM, SOFTWARE, NTUSER.DAT.'
        },
        'SAM': {
          full: 'Security Account Manager',
          def: 'Base Windows contenant les hashes des mots de passe locaux et informations d’authentification des comptes machine.'
        },
        'Volatility': {
          full: 'Volatility Framework',
          def: 'Framework open-source d’analyse mémoire RAM. Permet extraction de processus, DLL, connexions réseau, hooks, malwares injectés.'
        },
        'Malfind': {
          full: 'Malfind Plugin',
          def: 'Plugin Volatility détectant du code injecté/suspect dans les espaces mémoire de processus. Très utilisé en malware forensics.'
        },
        'Steganography': {
          full: 'Steganography',
          def: 'Technique consistant à dissimuler des données dans un autre support (image, audio, vidéo…) sans éveiller de soupçon visible.'
        },
        'Bruteforce': {
          full: 'Brute Force Attack',
          def: 'Méthode consistant à tester exhaustivement toutes les combinaisons possibles jusqu’à trouver la bonne clé/mot de passe.'
        },
        'Salt': {
          full: 'Cryptographic Salt',
          def: 'Valeur aléatoire ajoutée avant hashage d’un mot de passe pour empêcher rainbow tables et collisions entre mots identiques.'
        },
        'Rainbow Table': {
          full: 'Rainbow Table',
          def: 'Table pré-calculée de hashes utilisée pour casser rapidement des mots de passe non salés.'
        },
        'MITM': {
          full: 'Man-In-The-Middle',
          def: 'Attaque où l’attaquant intercepte/altère les communications entre deux parties sans qu’elles le sachent.'
        },
        'VPN': {
          full: 'Virtual Private Network',
          def: 'Tunnel chiffré encapsulant le trafic réseau entre un client et un serveur distant pour confidentialité ou accès privé.'
        },
        'TOR': {
          full: 'The Onion Router',
          def: 'Réseau d’anonymisation en couches relayant le trafic via plusieurs nœuds pour masquer l’origine de la connexion.'
        },
      };

      function initGlossary() {
        const expl = document.getElementById('feedback');
        if (!expl) return;
        const popup = document.getElementById('gloss-popup');
        const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

        function processNode(node) {
          if (node.nodeType === 3) {
            let text = node.textContent;
            let changed = false;
            const frag = document.createDocumentFragment();
            let last = 0;
            const matches = [];
            terms.forEach(term => {
              const re = new RegExp('\\b' + term.replace('$', '\\$').replace('φ', 'φ').replace('(', '\\(').replace(')', '\\)') + '\\b', 'g');
              let m;
              while ((m = re.exec(text)) !== null) {
                matches.push({
                  start: m.index,
                  end: m.index + term.length,
                  term
                });
              }
            });
            matches.sort((a, b) => a.start - b.start);
            const clean = [];
            let cursor = 0;
            matches.forEach(m => {
              if (m.start >= cursor) {
                clean.push(m);
                cursor = m.end;
              }
            });
            if (!clean.length) return;
            clean.forEach(m => {
              if (m.start > last) frag.appendChild(document.createTextNode(text.slice(last, m.start)));
              const span = document.createElement('span');
              span.className = 'gloss-term';
              span.textContent = text.slice(m.start, m.end);
              span.dataset.term = m.term;
              frag.appendChild(span);
              last = m.end;
              changed = true;
            });
            frag.appendChild(document.createTextNode(text.slice(last)));
            if (changed && node.parentNode) node.parentNode.replaceChild(frag, node);
          } else if (node.nodeType === 1 && !['script', 'style'].includes(node.tagName.toLowerCase())) {
            [...node.childNodes].forEach(processNode);
          }
        }
        const observer = new MutationObserver(() => {
          if (expl.style.display !== 'none') {
            [...expl.childNodes].forEach(processNode);
          }
        });
        observer.observe(expl, {
          childList: true,
          subtree: false,
          characterData: true
        });
        document.addEventListener('mouseover', e => {
          const t = e.target.closest('.gloss-term');
          if (!t || !popup) return;
          const term = t.dataset.term;
          const g = GLOSSARY[term];
          if (!g) return;
          popup.innerHTML = `
																															
												
															
																					<strong>${term}</strong> — ${g.full}
																															
												
															
																					<br>
																						<span style="color:var(--text);font-size:12px">${g.def}</span>`;
          popup.classList.add('show');
          const r = t.getBoundingClientRect();
          let left = r.left + window.scrollX;
          let top = r.bottom + window.scrollY + 6;
          if (left + 300 > window.innerWidth - 10) left = window.innerWidth - 310;
          popup.style.left = left + 'px';
          popup.style.top = top + 'px';
        });
        document.addEventListener('mouseout', e => {
          if (!e.target.closest('.gloss-term')) popup.classList.remove('show');
        });
        document.addEventListener('click', e => {
          const t = e.target.closest('.gloss-term');
          if (t) {
            e.preventDefault();
            t.dispatchEvent(new MouseEvent('mouseover', {
              bubbles: true
            }));
          } else popup.classList.remove('show');
        });
      }

      function useStreakFreeze() {
        if (S.streakFreezes <= 0) return;
        S.streakFreezes--;
        lsSet('freezes', S.streakFreezes);
        const today = getDailyDate();
        const dates = new Set(lsGet('playdates', []));
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dates.add(tomorrow.toISOString().slice(0, 10));
        lsSet('playdates', [...dates].slice(-60));
        lsSet('freezeUsed_' + today, true);
        updateFreezeBtn();
        showToast('streak-toast', '🧊 Streak Freeze activé ! Ta série est protégée pour demain.', 3000);
      }

      function updateFreezeBtn() {
        const btn = document.getElementById('freeze-btn');
        const badge = document.getElementById('fz-badge');
        if (btn) {
          btn.disabled = S.streakFreezes <= 0;
        }
        if (badge) badge.textContent = S.streakFreezes;
        if (S.dayStreak > 0 && S.dayStreak % 7 === 0 && S.streakFreezes < 3) {
          S.streakFreezes++;
          lsSet('freezes', S.streakFreezes);
          if (badge) badge.textContent = S.streakFreezes;
          showToast('streak-toast', '🧊 Nouveau Streak Freeze gagné !', 2500);
        }
      }
      const SECRET_REVEALS = {
        's_3am': {
          emoji: '🦇',
          name: 'Créature de la nuit',
          desc: 'Répondre entre 3h00 et 3h59 du matin — les vampires révisent aussi.'
        },
        's_42': {
          emoji: '🌌',
          name: 'La réponse ultime',
          desc: 'Obtenir exactement 42% à un examen — La Vie, l\'Univers et tout le reste.'
        },
        's_13': {
          emoji: '🎱',
          name: 'Baker Street 13',
          desc: 'Maintenir une série de 13 exactement avant de se tromper.'
        },
        's_hints3': {
          emoji: '🧙',
          name: 'Gandalf en détresse',
          desc: 'Utiliser les 3 indices dans la même journée — même Gandalf demande de l\'aide.'
        },
        's_speed5': {
          emoji: '🏎️',
          name: 'Speed runner DFIR',
          desc: '5 speed bonuses consécutifs — Elliot Alderson approuve.'
        },
        's_skip': {
          emoji: '🙈',
          name: 'Voir rien faire rien',
          desc: 'Passer 20 questions — la chaîne de custody est rompue.'
        },
      };

      function checkSecrets(ok) {
        const sf = S._secretFlags;
        const h = new Date().getHours();
        if (h === 3 && !sf.at3am) {
          sf.at3am = true;
        }
        if (S.streak === 13 && !sf.streak13) {
          sf.streak13 = true;
        }
        if (ok) {
          const elapsed = (Date.now() - _qRenderTime) / 1000;
          if (elapsed < 5 && !S._hintUsedThisQ) {
            S._speedCorrect = (S._speedCorrect || 0) + 1;
            if (S._speedCorrect >= 5 && !sf.speed5row) {
              sf.speed5row = true;
            }
          } else {
            S._speedCorrect = 0;
          }
        } else {
          S._speedCorrect = 0;
        }
        if (S.hintsLeft === 0 && !sf.hints3day) {
          sf.hints3day = true;
        }
        lsSet('secretFlags', sf);
        const unlocked = new Set(lsGet('achievements', []));
        ACHIEVEMENTS.filter(a => a.secret).forEach(a => {
          if (unlocked.has(a.id)) return;
          try {
            if (a.check(S)) {
              const reveal = SECRET_REVEALS[a.id];
              if (reveal) {
                a.emoji = reveal.emoji;
                a.name = reveal.name;
                a.desc = reveal.desc;
                a.secret = false;
              }
            }
          } catch {}
        });
        checkAchievements();
      }

      function checkExam42(pct) {
        if (pct === 42 && !S._secretFlags.exam42) {
          S._secretFlags.exam42 = true;
          lsSet('secretFlags', S._secretFlags);
          checkSecrets(false);
        }
      }
      // ══════════════════════════════════════════════════════════
      // SCREEN SHAKE
      // ══════════════════════════════════════════════════════════
      function triggerScreenShake() {
        const main = document.getElementById('main');
        if (!main) return;
        main.classList.remove('shake');
        void main.offsetWidth; // reflow
        main.classList.add('shake');
        main.addEventListener('animationend', () => main.classList.remove('shake'), {
          once: true
        });
      }
      // ══════════════════════════════════════════════════════════
      // AVATAR + PSEUDO
      // ══════════════════════════════════════════════════════════
      const AVATAR_EMOJIS = ['🔰', '🕵️', '🔬', '⚖️', '💀', '🧠', '👮', '🦊', '🐉', '🧬', '🛡️', '⚡', '🎯', '🔐', '🌐', '💻', '🗂️', '🔍', '📡', '🧩'];

      function updateAvatarChip() {
        const em = document.getElementById('avatar-emoji');
        const nm = document.getElementById('avatar-name');
        if (em) em.textContent = S.avatarEmoji;
        if (nm) nm.textContent = S.avatarName || 'Enquêteur';
      }

      function openAvatarSetup() {
        // Build avatar grid
        const grid = document.getElementById('avatar-options');
        if (grid) {
          grid.innerHTML = '';
          AVATAR_EMOJIS.forEach(em => {
            const btn = document.createElement('button');
            btn.className = 'av-opt' + (em === S.avatarEmoji ? ' active' : '');
            btn.textContent = em;
            btn.onclick = () => {
              grid.querySelectorAll('.av-opt').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              S.avatarEmoji = em;
            };
            grid.appendChild(btn);
          });
        }
        const inp = document.getElementById('avatar-name-input');
        if (inp) inp.value = S.avatarName;
        document.getElementById('avatar-overlay').classList.add('show');
      }

      function saveAvatar() {
        const inp = document.getElementById('avatar-name-input');
        const name = inp ? inp.value.trim() : '';
        S.avatarName = name || 'Enquêteur';
        lsSet('avatarEmoji', S.avatarEmoji);
        lsSet('avatarName', S.avatarName);
        updateAvatarChip();
        closeOverlay('avatar-overlay');
        showToast('streak-toast', `👤 Profil enregistré ! Bonjour ${S.avatarName} 👋`, 2500);
      }
      // Personalised toasts — patch FEEDBACK_OK/KO display with name
      function personalizedGreeting() {
        const name = S.avatarName && S.avatarName !== 'Enquêteur' ? ` ${S.avatarName}` : '';
        return name;
      }
      // ══════════════════════════════════════════════════════════
      // SHARE CARD (Canvas)
      // ══════════════════════════════════════════════════════════
      function openShareCard() {
        document.getElementById('share-overlay').classList.add('show');
        setTimeout(drawShareCard, 80); // let overlay render first
      }

      function drawShareCard() {
        const canvas = document.getElementById('share-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = 760,
          H = 420;
        canvas.width = W;
        canvas.height = H;
        const {
          rank
        } = getRank(S.xp);
        const acc = S.total ? Math.round(S.correct / S.total * 100) : 0;
        const theme = lsGet('visualTheme', 'default');
        // Background palette per theme
        const palettes = {
          default: {
            bg1: '#060b12',
            bg2: '#0d1a2e',
            accent: '#00e5cc',
            accent2: '#f0c040',
            dim: '#6a80a8'
          },
          hacker: {
            bg1: '#000800',
            bg2: '#001200',
            accent: '#00ff41',
            accent2: '#aaff00',
            dim: '#005500'
          },
          crimson: {
            bg1: '#120006',
            bg2: '#1e0010',
            accent: '#ff2060',
            accent2: '#ff8c42',
            dim: '#8a3050'
          },
          retro: {
            bg1: '#0a0800',
            bg2: '#1a1400',
            accent: '#ffcc00',
            accent2: '#ff8800',
            dim: '#664400'
          },
        };
        const P = palettes[theme] || palettes.default;
        // BG gradient
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, P.bg1);
        bgGrad.addColorStop(1, P.bg2);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);
        // Grid lines
        ctx.strokeStyle = P.accent + '18';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 44) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 0; y < H; y += 44) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        // Glow circle
        const radGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 320);
        radGrad.addColorStop(0, P.accent + '12');
        radGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, W, H);
        // Border
        ctx.strokeStyle = P.accent + '40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(8, 8, W - 16, H - 16, 12);
        ctx.stroke();
        // Avatar + Name top-left
        ctx.font = '36px serif';
        ctx.fillText(S.avatarEmoji, 32, 62);
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillStyle = P.accent;
        ctx.fillText(S.avatarName, 80, 50);
        ctx.font = '13px "JetBrains Mono", monospace';
        ctx.fillStyle = P.dim;
        ctx.fillText(rank.name, 80, 68);
        // Title center
        ctx.textAlign = 'center';
        ctx.font = 'bold 28px "Syne", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('CAS-IN · Investigation Numérique', W / 2, 44);
        // Main score — big number
        ctx.font = 'bold 80px "JetBrains Mono", monospace';
        ctx.fillStyle = P.accent2;
        ctx.shadowColor = P.accent2;
        ctx.shadowBlur = 20;
        ctx.fillText(S.score + ' pts', W / 2, 185);
        ctx.shadowBlur = 0;
        // Stat pills
        const stats = [{
          label: 'Précision',
          val: acc + '%',
          color: acc >= 70 ? '#30e88a' : '#ff4060'
        }, {
          label: 'Questions',
          val: S.total + '',
          color: P.accent
        }, {
          label: 'Série max',
          val: S.maxStreak + '',
          color: P.accent2
        }, {
          label: 'XP total',
          val: S.xp + '',
          color: '#a78bfa'
        }, ];
        const pillW = 150,
          pillH = 64,
          gap = 18;
        const totalPills = pillW * stats.length + gap * (stats.length - 1);
        const startX = (W - totalPills) / 2;
        stats.forEach((st, i) => {
          const x = startX + i * (pillW + gap);
          const y = 215;
          // pill bg
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.beginPath();
          ctx.roundRect(x, y, pillW, pillH, 8);
          ctx.fill();
          ctx.strokeStyle = st.color + '40';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x, y, pillW, pillH, 8);
          ctx.stroke();
          // value
          ctx.font = 'bold 26px "JetBrains Mono", monospace';
          ctx.fillStyle = st.color;
          ctx.fillText(st.val, x + pillW / 2, y + 34);
          // label
          ctx.font = '11px "Inter", sans-serif';
          ctx.fillStyle = P.dim;
          ctx.fillText(st.label, x + pillW / 2, y + 52);
        });
        // Theme bar (top themes by accuracy)
        const topThemes = Object.entries(S.byTheme).filter(([, v]) => v.tot >= 3).map(([t, v]) => ({
          t,
          pct: Math.round(v.ok / v.tot * 100)
        })).sort((a, b) => b.pct - a.pct).slice(0, 3);
        if (topThemes.length) {
          ctx.textAlign = 'center';
          ctx.font = '11px "Inter", sans-serif';
          ctx.fillStyle = P.dim;
          ctx.fillText('Top thèmes', W / 2, 310);
          topThemes.forEach((th, i) => {
            const barW = 200,
              barH = 6,
              bx = W / 2 - barW / 2,
              by = 318 + i * 22;
            // bg
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath();
            ctx.roundRect(bx, by, barW, barH, 3);
            ctx.fill();
            // fill
            ctx.fillStyle = P.accent;
            ctx.beginPath();
            ctx.roundRect(bx, by, barW * th.pct / 100, barH, 3);
            ctx.fill();
            // label
            ctx.textAlign = 'left';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = P.dim;
            ctx.fillText(th.t.substring(0, 22), bx, by - 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = P.accent;
            ctx.fillText(th.pct + '%', bx + barW, by - 2);
          });
        }
        // Footer
        ctx.textAlign = 'center';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = P.dim;
        ctx.fillText('#DFIR  #Forensics  #CAS_IN', W / 2, H - 18);
        // Streak badge top-right
        if (S.maxStreak >= 5) {
          ctx.textAlign = 'right';
          ctx.font = '13px "JetBrains Mono", monospace';
          ctx.fillStyle = P.accent2;
          ctx.fillText('🔥 ' + S.maxStreak + ' streak', W - 30, 55);
        }
      }

      function downloadShareCard() {
        drawShareCard();
        const canvas = document.getElementById('share-canvas');
        const a = document.createElement('a');
        a.download = 'casin-score.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
      async function copyShareCard() {
        drawShareCard();
        const canvas = document.getElementById('share-canvas');
        try {
          canvas.toBlob(async blob => {
            await navigator.clipboard.write([new ClipboardItem({
              'image/png': blob
            })]);
            showToast('streak-toast', '📋 Image copiée dans le presse-papier !', 2500);
          });
        } catch {
          showToast('streak-toast', '⚠️ Copie non supportée — essaie le téléchargement', 2500);
        }
      }

      function shareNative() {
        drawShareCard();
        const canvas = document.getElementById('share-canvas');
        canvas.toBlob(async blob => {
          const file = new File([blob], 'casin-score.png', {
            type: 'image/png'
          });
          if (navigator.canShare?.({
              files: [file]
            })) {
            await navigator.share({
              files: [file],
              title: 'Mon score CAS-IN'
            }).catch(() => {});
          } else {
            downloadShareCard();
          }
        });
      }
      // ══════════════════════════════════════════════════════════
      // MID-SESSION REVIEW (every 20 questions)
      // ══════════════════════════════════════════════════════════
      const MID_TIPS = {
        'Informatique de base': 'Revois les couches OSI, DNS, subnetting. Flash cards recommandées.',
        'Système de fichiers': 'Focus sur les structures FAT/NTFS/EXT. Dessine les diagrammes.',
        'Acquisition et analyse': 'Relis les procédures d\'acquisition — ordre de volatilité, write-blockers.',
        'Cryptologie': 'Retiens les tailles de hash MD5/SHA-1/SHA-256 et les modes de chiffrement.',
        'Spécificité des OS': 'Compare Windows/Linux/macOS : artefacts, registres, logs.',
        'Droit': 'Focus sur la procédure pénale et les conditions de perquisition.',
        'OSINT': 'Pratique les Google Dorks et les outils de pivotement.',
      };

      function maybeTriggerMidSession() {
        if (S.total > 0 && S.total % 20 === 0 && !S._midShown.has(S.total)) {
          S._midShown.add(S.total);
          setTimeout(showMidSession, 700);
        }
      }

      function showMidSession() {
        const allThemes = ALL_T;
        const scored = allThemes.map(t => {
          const d = S.byTheme[t] || {
            ok: 0,
            tot: 0
          };
          return {
            t,
            ok: d.ok,
            tot: d.tot,
            pct: d.tot ? Math.round(d.ok / d.tot * 100) : null
          };
        }).filter(x => x.tot >= 2).sort((a, b) => (a.pct ?? 100) - (b.pct ?? 100));
        if (!scored.length) return;
        const acc = Math.round(S.correct / S.total * 100);
        const name = S.avatarName !== 'Enquêteur' ? `, ${S.avatarName}` : '';
        document.getElementById('ms-sub-txt').textContent = `${S.total} questions · ${acc}% de précision globale${name}`;
        const weakList = document.getElementById('ms-weak-list');
        weakList.innerHTML = '<div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">📉 Points faibles</div>';
        const weak = scored.slice(0, 3);
        weak.forEach(w => {
          const col = w.pct >= 70 ? 'var(--green)' : w.pct >= 40 ? 'var(--gold)' : 'var(--red)';
          const tip = MID_TIPS[w.t] || 'Revois les notions fondamentales de ce thème.';
          const div = document.createElement('div');
          div.className = 'weak-item';
          div.innerHTML = `
      
																																				
													
																
																						<div class="weak-theme" style="color:${col}">${w.t}</div>
																						<div class="weak-stat">${w.ok}/${w.tot} correctes · ${w.pct}%</div>
																						<div class="weak-bar">
																							<div class="weak-bar-fill" style="width:${w.pct}%;background:${col}"></div>
																						</div>
																						<div class="weak-tip">💡 ${tip}</div>`;
          weakList.appendChild(div);
        });
        // Strong themes
        const strong = scored.filter(x => x.pct >= 80).slice(-2);
        const strongEl = document.getElementById('ms-strong');
        if (strong.length) {
          strongEl.innerHTML = `
																																				
													
																
																						<div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin:12px 0 6px">✅ Points forts</div>` + strong.map(s => `
																																				
													
																
																						<span style="display:inline-block;margin:3px 4px;padding:4px 10px;border-radius:16px;font-size:11px;font-weight:700;background:rgba(48,232,138,.1);border:1px solid rgba(48,232,138,.3);color:var(--green)">${s.t} · ${s.pct}%</span>`).join('');
        } else {
          strongEl.innerHTML = '';
        }
        document.getElementById('midsession-overlay').classList.add('show');
      }

      function closeMidSession() {
        document.getElementById('midsession-overlay').classList.remove('show');
      }
      // ══════════════════════════════════════════════════════════
      // FOCUS MODE
      // ══════════════════════════════════════════════════════════
      let _focusMode = false;

      function toggleFocusMode() {
        _focusMode = !_focusMode;
        document.body.classList.toggle('focus-mode', _focusMode);
        if (_focusMode) showToast('streak-toast', '🎯 Mode Focus activé — ESC pour quitter', 2000);
      }
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && _focusMode) toggleFocusMode();
      });
      // ══════════════════════════════════════════════════════════
      // ALERTE FORENSIQUE SIMULÉE
      // ══════════════════════════════════════════════════════════
      let _forensicShown = false;

      function maybeShowForensicAlert() {
        if (_forensicShown || S.total !== 100) return;
        if (lsGet('forensicShown', false)) return;
        _forensicShown = true;
        lsSet('forensicShown', true);
        setTimeout(showForensicAlert, 800);
      }

      function showForensicAlert() {
        const overlay = document.getElementById('forensic-alert');
        const output = document.getElementById('forensic-output');
        const prompt = document.getElementById('forensic-prompt');
        if (!overlay || !output) return;
        overlay.classList.add('show');
        const hash = Array.from({
          length: 32
        }, () => '0123456789abcdef' [Math.floor(Math.random() * 16)]).join('');
        const lines = [{
          text: '[ALERT] Activité suspecte détectée sur le volume.',
          cls: 'alert-line',
          delay: 0
        }, {
          text: '[SCAN]  Fichier : /quiz/sessions/answers.db',
          cls: '',
          delay: 600
        }, {
          text: '[HASH]  MD5 calculé : ' + hash,
          cls: 'hash-line',
          delay: 1300
        }, {
          text: '[MATCH] Signature connue : POSSIBLE EXFILTRATION',
          cls: 'alert-line',
          delay: 2100
        }, {
          text: '',
          cls: '',
          delay: 2700
        }, {
          text: "Lancer l'analyse complète du volume ?",
          cls: '',
          delay: 2900
        }, ];
        output.innerHTML = '';
        const cursor = document.createElement('span');
        cursor.className = 'forensic-cursor';
        output.appendChild(cursor);
        lines.forEach(({
          text,
          cls,
          delay
        }) => {
          setTimeout(() => {
            if (text === '') {
              output.insertBefore(document.createElement('br'), cursor);
              return;
            }
            const line = document.createElement('div');
            if (cls) line.className = cls;
            line.textContent = text;
            output.insertBefore(line, cursor);
            output.scrollTop = output.scrollHeight;
          }, delay);
        });
        setTimeout(() => {
          prompt.style.display = 'flex';
        }, 3200);
      }

      function forensicAnswer(yes) {
        const prompt = document.getElementById('forensic-prompt');
        const scanWrap = document.getElementById('forensic-scan-wrap');
        const output = document.getElementById('forensic-output');
        const bar = document.getElementById('forensic-scan-bar-inner');
        prompt.style.display = 'none';
        if (!yes) {
          const line = document.createElement('div');
          line.textContent = '[ANNULÉ] Rapport non généré. Preuve potentielle perdue.';
          line.style.color = '#ff4400';
          output.appendChild(line);
          setTimeout(() => {
            document.getElementById('forensic-alert').classList.remove('show');
          }, 1800);
          return;
        }
        scanWrap.style.display = 'block';
        const phases = [{
          pct: 15,
          msg: '[SCAN]  Lecture de la table FAT...',
          delay: 0
        }, {
          pct: 32,
          msg: '[SCAN]  Analyse du $MFT...',
          delay: 600
        }, {
          pct: 54,
          msg: '[SCAN]  Vérification des ADS cachés...',
          delay: 1200
        }, {
          pct: 71,
          msg: '[SCAN]  Contrôle chaîne de custody...',
          delay: 1900
        }, {
          pct: 88,
          msg: '[SCAN]  Calcul du SHA-256...',
          delay: 2600
        }, {
          pct: 100,
          msg: '[OK]    INTÉGRITÉ VÉRIFIÉE — Aucune exfiltration.',
          delay: 3300,
          cls: 'ok-line'
        }, ];
        phases.forEach(({
          pct,
          msg,
          delay,
          cls
        }) => {
          setTimeout(() => {
            if (bar) bar.style.width = pct + '%';
            const line = document.createElement('div');
            line.textContent = msg;
            if (cls) line.className = cls;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
            if (pct === 100) {
              setTimeout(() => {
                document.getElementById('forensic-alert').classList.remove('show');
                showToast('streak-toast', '🔍 Analyse forensique : INTÉGRITÉ CONFIRMÉE', 3000);
              }, 1200);
            }
          }, delay);
        });
      }
      // ══════════════════════════════════════════════════════════
      // CODE KONAMI — God Mode
      // ══════════════════════════════════════════════════════════
      const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
      let _konamiPos = 0;
      let _godMode = false;
      let _godModeTimer = null;
      document.addEventListener('keydown', e => {
        // Konami tracking
        if (e.key === KONAMI[_konamiPos]) {
          _konamiPos++;
          if (_konamiPos === KONAMI.length) {
            _konamiPos = 0;
            activateGodMode();
          }
        } else {
          _konamiPos = (e.key === KONAMI[0]) ? 1 : 0;
        }
      });

      function activateGodMode() {
        _godMode = true;
        clearTimeout(_godModeTimer);
        showToast('combo-toast', '🕹️ GOD MODE — La honte sera dans les logs.', 4000);
        // Reveal all wrong answers as dimmed gray for this question
        revealGodModeHints();
        // Auto-disable after 3 questions or 90s
        _godModeTimer = setTimeout(deactivateGodMode, 90000);
        // Konami visual flash
        document.body.style.transition = 'filter .15s';
        document.body.style.filter = 'brightness(1.3) hue-rotate(180deg)';
        setTimeout(() => {
          document.body.style.filter = '';
        }, 200);
      }

      function deactivateGodMode() {
        _godMode = false;
        clearTimeout(_godModeTimer);
      }

      function revealGodModeHints() {
        if (!_godMode || !S.curQ || S.answered) return;
        const q = S.curQ;
        document.querySelectorAll('.choice-btn:not(:disabled)').forEach(btn => {
          const origI = +btn.dataset.origIdx;
          if (!q.answers.includes(origI)) {
            // Wrong answer — show as very dim
            btn.style.opacity = '0.35';
            btn.style.filter = 'grayscale(1)';
          }
        });
      }

      function clearGodModeHints() {
        document.querySelectorAll('.choice-btn').forEach(btn => {
          btn.style.opacity = '';
          btn.style.filter = '';
        });
      }
      // ══════════════════════════════════════════════════════════
      // MODE DOUBLE OU RIEN
      // ══════════════════════════════════════════════════════════
      let _dorActive = false;
      let _dorSessionScore = 0; // score accumulé pendant la série
      function checkDorOffer() {
        // Offer after exactly 5 correct in a row (and not already active)
        if (S.streak === 5 && !_dorActive) {
          showDorBanner();
        }
      }

      function showDorBanner() {
        const b = document.getElementById('dor-banner');
        if (b) {
          b.classList.add('show');
          // Save the current streak score to know what's at stake
          _dorSessionScore = S.score;
        }
      }

      function hideDorBanner() {
        const b = document.getElementById('dor-banner');
        if (b) b.classList.remove('show');
      }

      function activateDor() {
        _dorActive = true;
        hideDorBanner();
        showToast('combo-toast', '🎲 Double ou Rien activé ! Prochaine réponse decisive…', 3000);
        document.getElementById('question-card')?.classList.add('dor-active');
      }

      function resolveDor(correct) {
        if (!_dorActive) return;
        _dorActive = false;
        document.getElementById('question-card')?.classList.remove('dor-active');
        if (correct) {
          // Double the points earned since DOR activation
          const bonusPoints = DIFF_PTS[S.curQ?.diff || 'easy'] * Math.round(getComboMultiplier());
          S.score += bonusPoints;
          addXp(bonusPoints);
          document.getElementById('score-display').textContent = S.score + ' pts';
          showToast('streak-toast', `🎲 Double ou Rien GAGNÉ ! +${bonusPoints} pts bonus !`, 3000);
        } else {
          // Lose the streak score accumulated
          const lost = Math.max(0, S.streak * DIFF_PTS[S.curQ?.diff || 'easy']);
          S.score = Math.max(0, S.score - lost);
          document.getElementById('score-display').textContent = S.score + ' pts';
          showToast('streak-toast', `🎲 Double ou Rien PERDU — Série brisée !`, 3000);
        }
      }
      // ══════════════════════════════════════════════════════════
      // TAILLE DE POLICE
      // ══════════════════════════════════════════════════════════
      function applyFontSize(size) {
        document.body.dataset.font = (size === 'normal' ? '' : size);
        lsSet('fontSize', size);
        // Update button states if panel is open
        document.querySelectorAll('.font-opt').forEach(b => {
          b.classList.toggle('active', b.dataset.font === size || (size === 'normal' && b.dataset.font === 'normal'));
        });
      }

      function setFontSize(size, btn) {
        applyFontSize(size);
      }
      // ══════════════════════════════════════════════════════════
      // RÉSUMÉ DE SESSION — sauvegarde continue
      // ══════════════════════════════════════════════════════════
      function saveSessionSnapshot() {
        if (!S.total) return;
        const acc = Math.round(S.correct / S.total * 100);
        const snap = {
          total: S.total,
          acc,
          date: new Date().toLocaleDateString('fr-CH', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          }),
          dateKey: new Date().toISOString().slice(0, 10),
          score: S.score,
        };
        lsSet('sessionSnap', snap);
      }

      function showSessionResumeToast() {
        const snap = lsGet('sessionSnap', null);
        if (!snap) return;
        const todayKey = new Date().toISOString().slice(0, 10);
        // Only show if the snapshot is from a previous day (avoid same-session spam)
        if (snap.dateKey === todayKey) return;
        // Show after a short delay so the quiz is fully loaded
        setTimeout(() => {
          const when = snap.dateKey === new Date(Date.now() - 86400000).toISOString().slice(0, 10) ? 'Hier' : snap.date;
          showToast('streak-toast', `👋 ${when} : ${snap.total} questions · ${snap.acc}% · ${snap.score} pts`, 4000);
        }, 1200);
      }
    
const CHEATSHEETS = {
  "Technologie des disques": {
    file: "fiches/disques.html",
    icon: "\ud83d\udcbf",
    points: ["HDD : plateaux magnétiques, têtes de lecture, rotation 5400–7200 tr/min. Adressage CHS → LBA", "SSD : mémoire flash NAND, contrôleur, pas de partie mécanique. TRIM efface les blocs libérés — données irrécupérables après TRIM", "Secteur = 512 octets (logique). Cluster = N × secteurs (unité d'allocation du FS)", "HPA (Host Protected Area) et DCO (Device Configuration Overlay) : zones cachées du firmware — vérifier systématiquement", "Write blocker matériel obligatoire : empêche toute écriture accidentelle sur l'original"],
    values: ["Signature MBR : <code>55 AA</code> (octets 510–511)", "MBR : secteur 0, max 4 partitions primaires", "GPT : limite 2,2 To dépassée, backup header en fin de disque", "Secteur logique : 512 octets (4096 octets sur disques « Advanced Format »)"],
    tip: "Sur scène : ne jamais connecter un disque sans write blocker. Un simple accès Windows modifie les timestamps. Photographier l'état avant toute manipulation."
  },
  "FAT12 / FAT16 / FAT32": {
    file: "fiches/fat16.html",
    icon: "\ud83d\uddc2",
    points: ["4 zones : Reserved Area (VBR/BPB) → FAT Area (FAT1 + FAT2 copie) → Root Directory (FAT12/16 seulement) → Data Area", "FAT1 active, FAT2 backup (non utilisée sauf corruption). Forensiquement : FAT2 peut contenir des états anciens", "Suppression : 1er octet du SFN → <code>0xE5</code>, chaînage FAT → <code>0x0000</code>. Contenu des clusters intact jusqu'à réécriture", "SFN : 8+3 caractères (majuscule). LFN : 255 caractères UTF-16, entrées de 32 octets avant le SFN. Attribut LFN = <code>0x0F</code>", "Timestamps FAT : précision 2 secondes (champ secondes divisé par 2). Fuseaux horaires non gérés nativement"],
    values: ["FAT12 : entrée 1,5 octet, max ~4 096 clusters", "FAT16 : entrée 2 octets, max 65 536 clusters", "FAT32 : entrée 4 octets, max 4 Go par fichier (champ taille sur 32 bits)", "Entrée répertoire : 32 octets. Root Directory FAT16 : max 512 entrées (fixe)"],
    tip: "Un fichier supprimé en FAT perd la 1re lettre de son nom (remplacée par 0xE5 dans le SFN). Le LFN la contient encore. X-Ways peut reconstituer le nom complet."
  },
  "exFAT": {
    file: "fiches/exfat.html",
    icon: "\ud83d\uddc3",
    points: ["Créé en 2006 par Microsoft : entre FAT32 (trop limité) et NTFS (trop lourd pour supports amovibles)", "Pas de table FAT pour les fichiers contigus (flag NoFatChain = 1) → accès direct au premier cluster", "Allocation Bitmap : 1 bit par cluster (cluster libre = 0, occupé = 1). Commence au cluster 2", "Suppression : bit 7 de l'entrée primaire (type 0x85) mis à 0 → devient 0x05. Entrées secondaires intactes", "3 entrées par fichier : primaire (0x85 File Entry) + Stream Extension (0xC0) + File Name (0xC1)"],
    values: ["Taille max fichier : 2⁶⁴ octets (~16 exaoctets)", "Timestamp précision : 10 ms (vs 2 s en FAT32)", "Signature OEM : chaîne ASCII <code>EXFAT</code> à l'offset 0x03 du boot sector", "Signature boot : <code>AA 55</code> à l'offset 0x1FE"],
    tip: "L'exFAT est le format par défaut des cartes SDXC > 32 Go. NoFatChain = 1 → les données sont contiguës, carving plus facile. NoFatChain = 0 → il faut suivre la FAT exFAT."
  },
  "NTFS": {
    file: "fiches/ntfs.html",
    icon: "\ud83c\udfd7",
    points: ["Philosophie : 'Tout est fichier' — MFT, journal, bitmap sont des fichiers. Pas de zone réservée cachée", "MFT : base de données centrale, records de 1 Ko. Signature record : <code>FILE</code> (46 49 4C 45)", "Attributs clés : <code>$STANDARD_INFORMATION</code> (timestamps modifiables) et <code>$FILE_NAME</code> (timestamps noyau uniquement). Divergence → timestomping", "Journalisation : $LogFile (transactions NTFS), $USNJrnl/$J (historique modifications). Source forensique majeure même après suppression", "Fichiers système réservés (records 0–15) : $MFT(0), $MFTMirr(1), $LogFile(2), $Volume(3), $AttrDef(4), .(5), $Bitmap(6), $Boot(7), $BadClus(8), $Secure(9), $UpCase(10)"],
    values: ["Record MFT : 1 024 octets (1 Ko)", "File Reference : 48 bits numéro d'entrée + 16 bits séquence", "MFT Zone réservée : ~12,5% du volume pour éviter la fragmentation de la MFT", "Timestamps NTFS : 4 × (MACE) en $STANDARD_INFORMATION + 4 × en $FILE_NAME"],
    tip: "Le $I30 ($INDEX_ALLOCATION) d'un répertoire peut contenir des entrées résiduelles de fichiers supprimés même si la MFT est écrasée. Source forensique de dernier recours."
  },
  "EXT2 / EXT3 / EXT4": {
    file: "fiches/ext.html",
    icon: "\ud83d\udc27",
    points: ["Architecture en groupes de blocs : chaque groupe a son propre superbloc (copie), GDT, bitmap blocs, bitmap inodes, table inodes", "Inode : métadonnées de chaque fichier (128 octets en EXT2/3, extensible en EXT4). Inodes réservés : 0=inexistant, 1=bad blocks, 2=racine /", "EXT2 : pointe sur les blocs individuels (pointeurs simples/doubles/triples). EXT3 : ajoute journalisation. EXT4 : extents (plages contiguës) + block pointer zeroing à la suppression", "Journalisation EXT3/4 : protège la cohérence mais complique la récupération (les pointeurs de blocs sont effacés à la suppression en EXT3/4)", "HTree (Hash B-Tree) pour les grands répertoires (EXT3/4) : répertoires indexés par hash du nom"],
    values: ["Taille bloc typique : 4 096 octets", "Groupe de blocs : 8 × taille_bloc × 8 blocs (typiquement 32 768 blocs de 4 Ko = 128 Mo)", "Formule groupe d'un inode : (inode − 1) ÷ s_inodes_per_group", "EXT4 stable depuis décembre 2008"],
    tip: "EXT4 efface les pointeurs de blocs à la suppression (block pointer zeroing). La récupération passe par le journal EXT4 (contient les anciennes valeurs) ou le carving sur l'espace non alloué."
  },
  "HFS+ et APFS": {
    file: "fiches/hfs.html",
    icon: "\ud83c\udf4e",
    points: ["HFS+ (Mac OS Extended, 1998) : Big Endian, B-Trees pour toutes les structures (Catalog, Extents Overflow, Attributes, Startup)", "CNID : identifiant unique persistant de chaque objet (≈ inode EXT). CNIDs réservés : 1=parent fictif, 2=racine, 3=Extents Overflow, 4=Attributes, 5=Startup", "Catalog File B-Tree : répertoire principal de tous les fichiers/dossiers. Après suppression, les nœuds peuvent subsister (forensique residuelle)", "APFS (2017) : optimisé SSD, snapshots instantanés (copy-on-write), chiffrement multi-clés natif, volumes conteneurs partagés", "Resource Fork (HFS+) : données structurées Mac classiques (icônes, ressources). Forensiquement intéressant sur les anciens systèmes"],
    values: ["Volume Header HFS+ : offset 1024, signature <code>0x482B</code> ('H+') ou <code>0x4858</code> ('HX' journalisé)", "Endianness HFS+ : Big Endian (inverse de Windows)", "Allocation Block (≈ cluster) : taille variable, généralement 4 Ko", "APFS introduit : macOS 10.13 High Sierra (2017)"],
    tip: "Contrairement à NTFS et FAT, HFS+ se lit en Big Endian. Les outils (X-Ways, Autopsy) convertissent automatiquement, mais lors d'une lecture manuelle en hex, inverser les octets de chaque valeur multi-octets."
  },
  "Acquisition et préservation": {
    file: "fiches/acquisition.html",
    icon: "\ud83d\udd2c",
    points: ["Ordre de volatilité (RFC 3227) : RAM > connexions réseau > processus > disque > logs distants. Capturer du plus volatil au plus stable", "Machine allumée + BitLocker/LUKS/FileVault actif → Live Forensics d'abord (clé en RAM). Machine éteinte ou non chiffrée → Dead Forensics", "Isolation réseau immédiate : mode avion ou câble réseau débranché (sans éteindre). Faraday bag pour téléphones", "Documentation avant action : photographier l'écran, les câbles, la disposition. Chaque action doit être horodatée et justifiée", "Write blocker matériel ENTRE le disque original et le système d'analyse. Jamais d'accès direct sans protection"],
    values: ["Hash intégrité : SHA-256 de préférence (MD5 obsolète pour la preuve, toléré en complément)", "Commande dd Linux : <code>dd if=/dev/sda of=image.dd bs=4M conv=noerror,sync</code>", "WinPmem / DumpIt : capture RAM Windows", "Chain of custody : qui, quand, quoi, pourquoi — pour chaque transfert de preuve"],
    tip: "ISO/IEC 27037 : 4 phases — Identification, Collecte, Acquisition, Préservation. Le hash est calculé sur l'original ET sur chaque copie. L'original est mis sous scellés et ne sera plus touché."
  },
  "Formats de fichiers et Magic Bytes": {
    file: "fiches/acquisition.html",
    icon: "\ud83d\udd22",
    points: ["Magic bytes (file signatures) : octets en début de fichier identifiant son format réel — indépendant de l'extension", "File carving : recherche de signatures dans l'espace brut (alloué + non alloué) pour récupérer des fichiers sans métadonnées", "Limites du carving : fichiers fragmentés → reconstruction partielle. Pas de métadonnées (nom, dates). Dépend de la présence des footer", "ZIP est un format container : .docx, .xlsx, .pptx, .apk, .jar sont tous des ZIP. Vérifier le contenu réel", "Entropie élevée (≈ 8 bits/octet) : données chiffrées ou compressées. Entropie basse : données texte ou peu compressées"],
    values: ["<code>FF D8 FF</code> → JPEG | <code>89 50 4E 47</code> → PNG | <code>4D 5A</code> → PE Windows (EXE/DLL)", "<code>50 4B 03 04</code> → ZIP/DOCX/APKQ | <code>7F 45 4C 46</code> → ELF Linux | <code>25 50 44 46</code> → PDF", "<code>D4 C3 B2 A1</code> → PCAP little-endian | <code>A1 B2 C3 D4</code> → PCAP big-endian", "<code>4B 44 4D 56</code> → VMDK VMware"],
    tip: "Source de référence : Gary Kessler File Signatures Table (filesignatures.net). En X-Ways : Refine Snapshot → 'Identify file types by content' détecte les fausses extensions."
  },
  "Artefacts temporels et MAC times": {
    file: "fiches/acquisition.html",
    icon: "\u23f1",
    points: ["NTFS : 4 timestamps MACE × 2 (en $STANDARD_INFORMATION et $FILE_NAME). $SI modifiable par programmes, $FN par le noyau seulement", "Timestomping : modification de $SI pour brouiller la timeline. Détectable par divergence $SI/$FN ou valeur $FN antérieure à $SI", "FAT : précision 2 secondes (secondes divisées par 2). Timezone non gérée → attention aux décalages lors de l'analyse", "exFAT : précision 10 ms + champ UtcOffset pour la timezone", "Outils timeline : log2timeline/Plaso (super-timeline multiformat), MFTECmd (export CSV de la MFT entière)"],
    values: ["NTFS Mtime : dernière modification contenu | Atime : dernier accès | Ctime : modification métadonnées | Btime (crtime) : création", "Format timestamp NTFS : nombre de 100-nanosecondes depuis le 1er janvier 1601", "Format timestamp FAT : 16 bits date + 16 bits heure en Little Endian", "Commande Plaso : <code>log2timeline.py timeline.plaso image.E01</code>"],
    tip: "Une copie de fichier sur Windows met à jour le Btime (création) mais pas le Mtime. Un fichier 'créé' après sa 'modification' → probablement copié depuis un autre support."
  },
  "Logiciels et outils forensiques": {
    file: "fiches/outils.html",
    icon: "\ud83d\udee0",
    points: ["X-Ways Forensics : outil de référence, rien n'est automatisé sans validation. Volume Snapshot → Refine Snapshot → Analyse", "Autopsy/TSK : open-source, modules d'ingestion automatiques, bon pour débuter. Moins précis que X-Ways sur les cas complexes", "Suite Zimmerman (gratuite) : PECmd (Prefetch), MFTECmd (MFT), LECmd (.lnk), ShellBags Explorer, EvtxECmd (Event Logs)", "Volatility3 : analyse mémoire RAM, détection d'injection, extraction de processus et connexions réseau", "Magnet AXIOM : unifié mobile + desktop + cloud, corrélation cross-appareils. Cellebrite UFED : extraction mobile spécialisée"],
    values: ["X-Ways accès physique : F9 → Physical Media (bypasse l'OS, lit tout)", "PECmd : <code>PECmd.exe -d C:\\Windows\\Prefetch --csv output.csv</code>", "Volatility : <code>vol.py -f mem.raw windows.pslist</code> | <code>windows.netscan</code> | <code>windows.malfind</code>", "Guymager (Linux) : acquisition AFF/E01 avec interface graphique"],
    tip: "Règle d'or X-Ways : toujours ouvrir en Physical Media, pas Logical Drive. Créer un nouveau cas pour chaque investigation. Le Volume Snapshot est la base de tout — bien le configurer avant de lancer le Refine."
  },
  "Méthodologie et bonnes pratiques": {
    file: "fiches/acquisition.html",
    icon: "\ud83d\udccb",
    points: ["5 phases ISO/IEC 27037 + NIST : Identification → Collecte → Acquisition → Analyse → Interprétation & Rapport", "Chaîne de custody (chain of custody) : traçabilité complète de la preuve — qui, quand, comment, pourquoi, à chaque transfert", "Principe de Locard numérique : toute action laisse une trace. L'analyste qui touche le système laisse aussi sa trace", "Reproductibilité : un autre expert avec les mêmes outils doit obtenir les mêmes résultats. Documenter chaque commande", "Distinction fait / interprétation / opinion : dans le rapport, clairement séparer ce que montrent les données, ce qu'elles semblent indiquer, et l'avis de l'expert"],
    values: ["ISO/IEC 27037 : lignes directrices pour l'identification, collecte et préservation des preuves numériques", "NIST SP 800-86 : guide d'intégration des techniques forensiques", "INTERPOL Guidelines for Digital Forensics Laboratories (2019)", "RFC 3227 : ordre de volatilité pour la collecte"],
    tip: "L'expert ne prononce jamais la culpabilité — c'est le tribunal. Le rapport forensique établit des faits et propose des interprétations. Toute conclusion doit être formulée avec le niveau de certitude approprié."
  },
  "Méthodologie forensique": {
    file: "fiches/acquisition.html",
    icon: "\ud83d\udd0d",
    points: ["Dead Box Forensics : système éteint → acquisition statique. Avantage : pas d'altération. Risque : perte RAM et clés de chiffrement", "Live Forensics : système allumé → capture RAM puis disque. Obligatoire si chiffrement actif (BitLocker, FileVault, LUKS)", "Triage forensique : analyse rapide sur site (10–30 min) pour prioriser. Outils : Triage-G2 (Windows), Binalyze AIR", "Anti-forensique : timestomping, secure delete (Eraser, DoD wipe), chiffrement, steganographie. Les outils de nettoyage laissent eux-mêmes des traces", "File carving : récupération par signatures dans l'espace brut, sans système de fichiers. Scalpel, Foremost, PhotoRec"],
    values: ["Ordre priorité sur scène allumée : 1. RAM → 2. Logs réseau → 3. Processus → 4. Image disque", "WinPmem / DumpIt : capture RAM Windows sans installation", "Scalpel : <code>scalpel -o output/ image.dd</code>", "Bloqueur écriture : Tableau T35689iu, WiebeTech, etc."],
    tip: "Les outils anti-forensiques laissent des traces paradoxales : CCleaner dans Prefetch, entrées de registre, logs d'installation. L'absence totale de traces est elle-même suspecte."
  },
  "Windows — Artefacts et exécution": {
    file: "fiches/windows.html",
    icon: "\ud83e\ude9f",
    points: ["Prefetch : fichiers .pf dans C:\\Windows\\Prefetch\\. Prouve l'exécution, nombre de lancements, jusqu'à 8 timestamps, DLL chargées", "Amcache.hve : ruche de registre C:\\Windows\\AppCompat\\Programs\\Amcache.hve. Hash SHA-1 des exécutables — prouve la présence physique sur le disque", "ShimCache (AppCompatCache) : HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\AppCompatCache. Prouve la présence d'un exécutable (pas nécessairement l'exécution)", "UserAssist : HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist — programmes lancés par l'utilisateur via l'interface graphique", "Event ID 4688 : création d'un processus. Nécessite l'audit 'Process Creation' activé dans les GPO"],
    values: ["Prefetch désactivé par défaut sur Windows Server. Vérifier : HKLM\\SYSTEM\\...\\PrefetchParameters", "PECmd d'Eric Zimmerman : outil de référence pour parser les .pf", "Prefetch filename = NOM_PROGRAMME-HASH_CHEMIN.pf (le hash est calculé sur le chemin d'accès)", "Amcache conserve les infos même après désinstallation du programme"],
    tip: "Corrélation puissante : Prefetch (quand exécuté) + ShimCache (était présent) + Amcache (hash = quel binaire exactement) + UserAssist (lancé par qui via GUI) = preuve d'exécution difficile à réfuter."
  },
  "Windows — Registre et artefacts": {
    file: "fiches/windows.html",
    icon: "\ud83d\udddd",
    points: ["5 ruches système (C:\\Windows\\System32\\Config\\) : SYSTEM, SOFTWARE, SAM, SECURITY, DEFAULT", "Ruche utilisateur : NTUSER.DAT (C:\\Users\\<nom>\\) et USRCLASS.DAT (C:\\Users\\<nom>\\AppData\\Local\\Microsoft\\Windows\\)", "USBSTOR : HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR — historique complet des USB avec numéros de série et timestamps", "Run Keys (persistance) : HKLM\\SOFTWARE\\...\\Run (tous utilisateurs, droits admin) et HKCU\\SOFTWARE\\...\\Run (utilisateur seul, sans droits admin)", "WMI Subscriptions : C:\\Windows\\System32\\wbem\\Repository\\ — mécanisme de persistance très furtif, absent des Run Keys"],
    values: ["Event ID 7045 : nouveau service installé (dans System.evtx)", "Event ID 4698 : tâche planifiée créée | 4702 : modifiée (Security.evtx si audit activé)", "Tâches planifiées : C:\\Windows\\System32\\Tasks\\ (fichiers XML)", "MountPoints2 : HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\MountPoints2 — volumes montés"],
    tip: "HKCU ne nécessite pas de droits administrateur — les malwares sans élévation de privilèges s'installent dans HKCU\\...\\Run. Vérifier les deux hives (HKLM et HKCU) systématiquement."
  },
  "Windows — Journaux et Event Logs": {
    file: "fiches/windows.html",
    icon: "\ud83d\udcdc",
    points: ["Fichiers .evtx dans C:\\Windows\\System32\\winevt\\Logs\\. Les plus importants : Security.evtx, System.evtx, Application.evtx", "Chaque événement a un EventID, un timestamp, un niveau (Info/Warning/Error), et des données structurées", "Corrélation puissante : Event ID 4624 (connexion) + ShellBag créé même instant + Prefetch horodaté = tableau cohérent difficile à contester", "EvtxECmd de Zimmerman : extraction et normalisation des logs en CSV pour analyse temporelle", "Effacement des logs : Event ID 1102 (log Security effacé) est lui-même journalisé si l'audit est actif — paradoxe utile"],
    values: ["4624 : connexion réussie (type 2=local, 3=réseau, 10=RDP) | 4625 : échec", "4688 : création processus | 4698 : tâche planifiée | 7045 : nouveau service", "4663 : accès objet (audit fichiers) | 4720 : compte créé | 4634 : déconnexion", "EvtxECmd : <code>EvtxECmd.exe -d C:\\Windows\\System32\\winevt\\Logs --csv output\\</code>"],
    tip: "Les Event Logs sont souvent effacés lors d'une compromission. Chercher aussi les logs IIS (C:\\inetpub\\logs), Apache (/var/log/apache2), les logs antivirus — sources souvent oubliées par l'attaquant."
  },
  "macOS — Artefacts et analyse": {
    file: "fiches/macos-linux.html",
    icon: "\ud83c\udf4f",
    points: ["Unified Log (depuis macOS 10.12) : remplace les anciens logs, binaire .tracev3. Commande : <code>log show --last 24h</code>", "QuarantineEventsV2 : ~/Library/Application Support/com.apple.LaunchServices/com.apple.launchservices.quarantineeventsv2 — URL source de chaque téléchargement", "FSEvents : enregistrement des modifications de fichiers dans /.fseventsd (similaire à $USNJrnl NTFS). Survit aux redémarrages", "Downloads.plist + BrowserState.db Safari : persistent après effacement de l'historique Safari", "LaunchDaemons (/Library/LaunchDaemons/) : persistance au niveau système (root, sans session). LaunchAgents : au niveau utilisateur"],
    values: ["~/Library/Preferences/com.apple.recentitems.plist : fichiers récents", "/var/log/system.log : logs système (avant Unified Log)", "~/Library/Safari/History.db et Downloads.plist : historique Safari", "Spotlight : ~/.Spotlight-V100/Store-V2/ (index de recherche, artefact riche)"],
    tip: "Les .plist peuvent être en format XML ou binaire (bplist). Convertir : <code>plutil -convert xml1 fichier.plist</code>. X-Ways et Autopsy les lisent nativement. Les timestamps plist sont en secondes depuis le 1er janvier 2001 (pas 1970)."
  },
  "Linux — Artefacts et analyse": {
    file: "fiches/macos-linux.html",
    icon: "\ud83d\udc27",
    points: ["Logs : /var/log/auth.log (authentifications), /var/log/syslog, /var/log/kern.log. journald : <code>journalctl</code>", "Bash history : ~/.bash_history (effacé par <code>history -c && unset HISTFILE</code>). Alternatives : /proc/<pid>/environ, journald", "Crontabs utilisateur : /var/spool/cron/crontabs/<user>. Système : /etc/cron.d/, /etc/cron.hourly/, etc.", "Corbeille FreeDesktop : ~/.local/share/Trash/files/ (contenu) + ~/.local/share/Trash/info/*.trashinfo (métadonnées : chemin original + date suppression)", "/tmp/ effacé au redémarrage (souvent tmpfs). /var/tmp/ persiste entre les redémarrages — vérifier systématiquement"],
    values: ["Inode 2 = racine / (universel sur tous les volumes EXT)", "Permissions Unix : 0644 = rw-r--r-- | 0777 = rwxrwxrwx | 0755 = rwxr-xr-x", "SSH persisance : ~/.ssh/authorized_keys — accès permanent sans mot de passe", "Systemd persistence : /etc/systemd/system/ | ~/.config/systemd/user/"],
    tip: "La suppression avec <code>rm</code> sur EXT3/4 efface les pointeurs de blocs (block pointer zeroing) — contrairement à EXT2. La récupération passe par le journal EXT4 ou le carving. Sur EXT2, les données restent accessibles tant que les blocs ne sont pas réalloués."
  },
  "Chiffrement symétrique": {
    file: "fiches/crypto.html",
    icon: "\ud83d\udd10",
    points: ["XOR : réversible (appliquer deux fois = original). Piège : réutilisation de clé → C1 XOR C2 = P1 XOR P2 (two-time pad)", "AES (Advanced Encryption Standard) : standard depuis 2001. Blocs de 128 bits, clés 128/192/256 bits. 10/12/14 tours selon la taille de clé", "Modes opératoires : ECB (dangereux, motifs visibles) → CBC (IV aléatoire, attention padding oracle) → CTR (flux, nonce unique obligatoire) → GCM (authentifié = standard actuel)", "Principe de Kerckhoffs (1883) : la sécurité repose sur la clé, pas sur le secret de l'algorithme. Les algorithmes publics sont plus fiables", "En forensique : on n'attaque presque jamais l'algorithme. On attaque l'écosystème : mot de passe faible, clé en RAM, sauvegarde non protégée"],
    values: ["AES-128 : 10 tours | AES-192 : 12 tours | AES-256 : 14 tours", "Mode CTR : réutilisation nonce = catastrophe. Mode GCM = CTR + authentification (standard)", "LUKS header : premiers 512 octets → clés chiffrées. En RAM si volume monté", "BitLocker VMK (Volume Master Key) récupérable en RAM, dans l'AD ou le TPM"],
    tip: "AES-256 ne sera pas cassé par force brute (2^256 opérations). Ce qui cède : le mot de passe (dictionnaire + règles), la clé stockée en clair dans un fichier de config, la session non verrouillée avec la clé en RAM."
  },
  "Chiffrement asymétrique et RSA": {
    file: "fiches/crypto.html",
    icon: "\ud83d\udd11",
    points: ["RSA : clé publique (e, n) pour chiffrer, clé privée (d, n) pour déchiffrer. n = p × q (deux grands premiers). φ(n) = (p-1)(q-1)", "Chiffrement : C = M^e mod n | Déchiffrement : M = C^d mod n | Signature : S = M^d mod n | Vérification : M = S^e mod n", "Condition clé privée : e × d ≡ 1 (mod φ(n)). Calculé via algorithme d'Euclide étendu", "Diffie-Hellman (1976) : échange de clé symétrique sur canal non sécurisé. Base de la Perfect Forward Secrecy (PFS) en TLS", "Attaque de Håstad : même message chiffré pour 3 destinataires avec e=3 → CRT permet de retrouver M (sans connaître les clés privées)"],
    values: ["RSA-512 : cassé (1999). RSA-1024 : déconseillé. RSA-2048 : minimum actuel. RSA-4096 : recommandé long terme", "PKCS#12 (.p12/.pfx) : conteneur chiffré = certificat X.509 + clé privée. Criticité maximale si cracké", "Side-channel attacks : timing, power analysis — exploitent l'implémentation, pas l'algorithme", "Algorithme de Shor (quantique) : casserait RSA/DH. Post-quantique : CRYSTALS-Kyber, NTRU"],
    tip: "Un fichier .p12 obtenu avec son mot de passe donne accès à la clé privée complète — l'attaquant peut alors se faire passer pour la victime, déchiffrer toutes les communications passées enregistrées, et signer des documents."
  },
  "PKI et certificats": {
    file: "fiches/crypto.html",
    icon: "\ud83d\udcdc",
    points: ["PKI : hiérarchie Root CA → Intermediate CA → Certificat final (leaf). Chaque niveau signe le suivant", "X.509 : format standard des certificats. Contient : sujet, émetteur, clé publique, validité, usage, signature de la CA", "Révocation : CRL (Certificate Revocation List, téléchargée périodiquement) ou OCSP (Online Certificate Status Protocol, temps réel)", "Certificate Transparency (CT logs) : tous les certificats publics sont loggés. Utilisable en OSINT pour trouver des sous-domaines", "Certificate Pinning : l'application fixe le hash du certificat attendu. Bloque les proxy MITM (Burp Suite, mitmproxy)"],
    values: ["Ports : HTTPS=443, IMAPS=993, SMTPS=465/587, LDAPS=636", "TLS 1.3 (2018) : RSA key exchange supprimé, PFS obligatoire (ECDHE/DHE uniquement)", "ACME (RFC 8555) : protocole Let's Encrypt pour automatiser l'émission de certificats", "CSR (PKCS#10) : clé publique + infos sujet signés par le demandeur → envoyé à la CA"],
    tip: "Pour découvrir les sous-domaines d'une cible OSINT : consulter crt.sh (Certificate Transparency logs). Tous les certificats émis publiquement y sont référencés, y compris les sous-domaines de dev/staging souvent oubliés."
  },
  "Hachage et intégrité": {
    file: "fiches/crypto.html",
    icon: "\ud83d\udd0f",
    points: ["Propriétés d'un hash cryptographique : déterministe, résistance aux préimages (pas de retour en arrière), résistance aux collisions, effet avalanche", "Effet avalanche : 1 bit modifié → hash complètement différent. Propriété clé pour la forensique : un hash identique = données identiques", "MD5 (128 bits) : rapide, mais collisions trouvées. Acceptable pour les usages forensiques internes mais pas pour la signature", "SHA-1 (160 bits) : cassé en 2017 par SHAttered (Google/CWI). Ne plus utiliser pour les signatures", "bcrypt/Argon2 : fonctions de hachage lentes pour les mots de passe (facteur de coût configurable). MD5/SHA pour les mots de passe = erreur critique"],
    values: ["MD5 : 128 bits (32 hex) | SHA-1 : 160 bits (40 hex) | SHA-256 : 256 bits (64 hex)", "Fuzzy hashing (ssdeep) : compare la similarité entre fichiers. Score 85% = 85% de contenu commun", "NSRL (National Software Reference Library) : base de hash de logiciels connus — pour éliminer les fichiers système", "SHAttered (2017) : 2 PDF différents avec le même SHA-1 hash. 9,2 × 10^18 opérations SHA-1"],
    tip: "SHA-256 est le standard forensique actuel pour les chaînes de custody. Toujours calculer ET vérifier le hash sur l'original ET sur chaque copie. Une copie avec un hash différent de l'original est inadmissible."
  },
  "Cassage et attaques": {
    file: "fiches/crypto.html",
    icon: "\u26a1",
    points: ["Attaque par dictionnaire : tester des mots de passe probables (rockyou.txt, listes localisées). Le plus efficace pour les mots de passe humains", "Attaque par masque (hashcat -a 3) : exploiter la structure connue du mot de passe (?d?d?d?d = 4 chiffres, ?l?u?d?s = complexe)", "Attaque hybride : dictionnaire + règles (ajouter chiffres en fin, remplacer e→3, a→@, etc.)", "Tables arc-en-ciel (Rainbow tables) : hashes précalculés. Contrecarrées par le sel (salt) dans bcrypt/Argon2", "Padding oracle (CBC) : si serveur différencie 'mauvais padding' de 'mauvais déchiffrement' → récupération du plaintext sans clé"],
    values: ["Hashcat GPU : MD5 → milliards/s | SHA-256 → centaines M/s | bcrypt → milliers/s (volontairement lent)", "Hashcat modes : 0=dictionnaire, 1=combinaison, 3=masque, 6=hybride dict+masque", "?l = minuscule | ?u = majuscule | ?d = chiffre | ?s = symbole | ?a = tout", "Cold boot attack : clés AES en RAM récupérables quelques minutes après extinction (mémoire rémanente)"],
    tip: "Un mot de passe basé sur un lieu + année ('Sierre2024!') est le premier testé lors d'une attaque ciblée avec OSINT préalable. Recommander un gestionnaire de mots de passe avec génération aléatoire (Bitwarden, 1Password, KeePass)."
  },
  "Procédure pénale": {
    file: "fiches/droit.html",
    icon: "\u2696",
    points: ["CPP suisse (RS 312.0) : entrée en vigueur le 1er janvier 2011. Unifie les 26 codes cantonaux", "Présomption d'innocence (art. 6 CPP + art. 32 Cst.) : le prévenu est présumé innocent jusqu'à condamnation définitive", "Nemo tenetur (art. 113 CPP) : personne n'est tenu de s'auto-incriminer. S'applique aussi aux mots de passe biométriques", "Défense obligatoire (art. 130 CPP) : si détention > 10 jours, peine probable > 1 an, ou prévenu incapable de se défendre seul", "Libre appréciation des preuves (art. 10 CPP) : le juge apprécie librement les preuves — pas de hiérarchie légale"],
    values: ["Délai recours (art. 393 CPP) : 10 jours dès notification", "Délai appel (art. 398 CPP) : 20 jours — contrôle complet en fait et en droit", "Détention provisoire (art. 221 CPP) : ordonnée par le TMC", "Principe de célérité (art. 5 CPP) : procédure conduite sans délai injustifié"],
    tip: "La preuve numérique suit les mêmes exigences que toute preuve : légalité (mandat), intégrité (hash), chaîne de custody (traçabilité), reproductibilité (autre expert = mêmes résultats). Sans ces 4 piliers, la défense peut contester la recevabilité."
  },
  "Perquisition de documents": {
    file: "fiches/droit.html",
    icon: "\ud83d\udcc2",
    points: ["Perquisition (art. 244–248 CPP) : nécessite un mandat du MP ou une autorisation urgente du policier avec ratification ultérieure", "Mise sous scellés (art. 248 CPP) : le détenteur peut demander la mise sous scellés → accès suspendu jusqu'à décision du TMC", "Depuis 2024 (ATF 151 IV 30 + ATF 151 IV 175) : secrets commerciaux, d'affaires, de fabrication et bancaire ne bloquent plus l'accès aux données", "Proportionnalité (art. 197 CPP) : la saisie doit être proportionnée au but poursuivi — limiter aux données pertinentes", "Obligation de remise (art. 265 CPP) : le détenteur doit remettre les données sur demande. Exceptions : secrets professionnels qualifiés"],
    values: ["Principe de proportionnalité : saisir le minimum nécessaire. Si possible, copie sur place > emport physique", "Hébergeur suisse : obligation de dépôt (art. 265) → données d'inscription, logs, contenu", "Art. 247 CPP : procédure de tri. Le détenteur est informé de son droit d'opposition", "Hébergeur étranger : entraide judiciaire (MLAT) requise — délai plusieurs mois"],
    tip: "La mise sous scellés (art. 248 CPP) est une arme procédurale qui suspend l'enquête. En pratique, cela peut retarder l'accès aux données de plusieurs semaines ou mois. Anticiper cette possibilité dans la planification de l'investigation."
  },
  "Séquestre informatique": {
    file: "fiches/droit.html",
    icon: "\ud83d\udd12",
    points: ["Séquestre probatoire (art. 263 al. 1 let. a CPP) : pour préserver des preuves", "Durée : pas de limite légale fixe — dure le temps nécessaire à la procédure. Doit être levé dès que le motif disparaît (art. 267 CPP)", "Séquestre d'un serveur en entreprise : préférer la copie forensique sur site (principe de proportionnalité) si l'entreprise en dépend", "Legal hold (conservation légale) : mesure interne d'entreprise, différente du séquestre pénal — pas de force exécutoire directe", "Durée maximale de conservation des données par les prestataires : variable selon le pays et le type de données (en Suisse : 6 mois pour les FAI selon la LSCPT)"],
    values: ["Art. 263–268 CPP : séquestre et confiscation", "Art. 267 CPP : levée du séquestre dès disparition du motif", "Art. 248 CPP : mise sous scellés (recours possible devant le TMC)", "LSCPT : Loi sur la surveillance de la correspondance par poste et télécommunication"],
    tip: "Un suspect peut demander la restitution des objets séquestrés (art. 267 CPP) dès que la procédure le permet. La copie forensique (image du disque) est souvent restituée à la place de l'original pour permettre la continuité des opérations."
  },
  "Droit pénal informatique": {
    file: "fiches/droit.html",
    icon: "\u26a0",
    points: ["Art. 143 CP : accès indu à un système informatique (connexion à un système protégé sans autorisation)", "Art. 143bis CP : violation du domaine secret ou privé à l'aide de l'informatique (interception de communications)", "Art. 147 CP : utilisation frauduleuse d'un ordinateur (escroquerie informatique). Exemple classique : skimming", "Art. 179octies CP : système de traitement de données — corruption, destruction, modification de données", "Art. 179decies CP (depuis 2023) : usurpation d'identité numérique — nuisance matérielle ou immatérielle d'un certain degré requise"],
    values: ["Convention de Budapest (STE n°185, 2001) : premier traité international sur la cybercriminalité", "Art. 5 nLPD : données sensibles incluent données sur sanctions pénales/administratives", "Art. 179quater CP : violation du domaine secret | Art. 179 CP : violation du secret de fabrication", "Dommage qualifié (art. 147 CP) : CHF 10'000 (jurisprudence cantonale) à CHF 40'000–82'000 (fédérale)"],
    tip: "La cybercriminalité est souvent transfrontalière — compétence suisse possible si l'acte ou le résultat se produit en Suisse (art. 3 CP, principe de territorialité). Pour les infractions commises depuis l'étranger, l'entraide judiciaire (EIMP) est nécessaire."
  },
  "Expertise et rapport judiciaire": {
    file: "fiches/droit.html",
    icon: "\ud83d\udcc4",
    points: ["Mandat écrit obligatoire (art. 184 CPP) : nom de l'expert, questions précises à élucider, délai. Un mandat oral est insuffisant", "Structure d'une expertise : Rubrum → Mandat → Instructions → Sources → Méthode/Observations/Constatations → Conclusions", "Distinction fondamentale : fait (ce que les données montrent) ≠ interprétation (ce qu'elles semblent indiquer) ≠ opinion (avis de l'expert)", "L'expert ne prononce JAMAIS la culpabilité — c'est le tribunal. Formulation : 'les données sont cohérentes avec l'hypothèse X'", "Complément d'expertise (art. 189 CPP) : si incomplète, peu claire, ou si les experts divergent"],
    values: ["Art. 184–188 CPP : réglementation des expertises en Suisse", "Art. 189 CPP : trois motifs de complément : incomplète, peu claire, ou experts en désaccord", "Délai réponse expert : fixé dans le mandat, prorogeable sur demande motivée", "ISO/IEC 27041 : lignes directrices pour l'assurance des méthodes de forensique numérique"],
    tip: "Un rapport attaqué en défense l'est souvent sur la forme : mandat non respecté, méthode non documentée, conclusions trop absolues. Formuler chaque conclusion avec son niveau de certitude et citer les normes appliquées (ISO/IEC 27037, NIST SP 800-86)."
  },
  "Entraide judiciaire internationale": {
    file: "fiches/droit.html",
    icon: "\ud83c\udf0d",
    points: ["Souveraineté territoriale : agir sur le territoire d'un autre État sans autorisation = violation du droit international", "EIMP (Loi fédérale suisse sur l'entraide internationale en matière pénale) et OEIMP = cadre légal suisse", "Petite entraide (entraide au sens strict) : remise de documents, auditions, perquisitions, séquestres", "Grande entraide : extradition (remise d'une personne à un autre État pour jugement ou exécution de peine)", "Information spontanée (art. 67a EIMP) : transmission sans demande préalable si les informations pourraient aider un État étranger dans une procédure"],
    values: ["MLAT (Mutual Legal Assistance Treaty) : traité bilatéral d'entraide. La Suisse en a avec 130+ pays", "Délai MLAT classique : plusieurs mois (voire années pour les cas complexes)", "Quick freeze (art. 75a EIMP) : gel urgent des données électroniques — mesure provisoire rapide", "Convention de Budapest : encourage l'entraide et la conservation des données numériques (art. 29–35)"],
    tip: "Pour les données stockées chez un hébergeur étranger (AWS, Google, Meta), même en cas d'urgence, l'accès direct sans MLAT est illégal. La Convention de Budapest prévoit des procédures d'urgence (quick freeze) pour les données volatiles."
  },
  "Représentation des données": {
    file: "fiches/disques.html",
    icon: "\ud83d\udd22",
    points: ["Bit (0 ou 1) → Nibble (4 bits) → Octet/Byte (8 bits) → Word (16 bits) → Dword (32 bits) → Qword (64 bits)", "Hexadécimal : base 16 (0–9, A–F). 1 octet = 2 digits hex. 0xFF = 255. 0x4D 0x5A = signature PE Windows (MZ)", "Little Endian (Intel/Windows) : octet de poids faible en premier. Big Endian : poids fort en premier (HFS+, réseau)", "ASCII : 127 caractères (7 bits). UTF-8 : 1–4 octets par caractère. UTF-16 : 2 octets par caractère (utilisé dans les LFN FAT)", "Signed vs Unsigned : 0xFF = 255 (unsigned) ou -1 (signed, complément à 2)"],
    values: ["0xFF = 255 | 0xE5 = 229 (marqueur FAT supprimé) | 0x00 = 0 (jamais utilisé FAT) | 0x4D 0x5A = PE", "Conversion : 0x1A = 1×16 + 10 = 26 | 0xAB = 10×16 + 11 = 171", "Nibble : groupe de 4 bits. Ex: 0xAB = nibble haut A (1010) + nibble bas B (1011)", "ROT13 : substitution de 13 positions. Appliqué deux fois = original"],
    tip: "En forensique, tout est en Little Endian sur les systèmes Windows/x86 (FAT, NTFS, exFAT). HFS+ est Big Endian. Les protocoles réseau (IP, TCP) sont Big Endian. La confusion endianness est l'erreur la plus fréquente en lecture manuelle d'un dump hex."
  },
  "Adressage IP": {
    file: "fiches/reseau.html",
    icon: "\ud83c\udf10",
    points: ["IPv4 : 32 bits, notation dotted-decimal (192.168.1.1). Classes A/B/C dépassées → CIDR (192.168.0.0/24)", "Adresses privées (RFC 1918) : 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Non routable sur Internet", "NAT : plusieurs machines privées partagent une IP publique → IP seule insuffisante pour identifier un individu", "IPv6 : 128 bits, notation hexadécimale (2001:db8::1). Loopback : ::1. Link-local : fe80::/10", "Adresses spéciales : 127.0.0.1 (loopback), 0.0.0.0 (non spécifiée), 255.255.255.255 (broadcast), 224.0.0.0/4 (multicast)"],
    values: ["Port HTTP : 80 | HTTPS : 443 | SSH : 22 | FTP : 21 | DNS : 53 (UDP) | SMTP : 25", "TTL par défaut : Windows = 128 | Linux = 64 | Cisco = 255 — permet de deviner l'OS", "TCP 3-way handshake : SYN → SYN-ACK → ACK. RST = terminaison brutale", "Logs DHCP = adresse MAC + IP + horodatage + nom d'hôte → pivot vers une machine précise"],
    tip: "Une adresse IP publique identifie un opérateur (FAI, hébergeur), pas un individu. Pour remonter à la machine précise derrière un NAT : logs DHCP du routeur (MAC address + timestamp) + logs du FAI (IP publique + port source NAT)."
  },
  "Réseau, protocoles et Internet": {
    file: "fiches/reseau.html",
    icon: "\ud83d\udce1",
    points: ["Modèle OSI 7 couches vs TCP/IP 4 couches. Forensique réseau : couche 2 (MAC/ARP), 3 (IP/ICMP), 4 (TCP/UDP), 7 (HTTP/DNS)", "DNS passif (pDNS) : historique des résolutions DNS archivé. Permet de retrouver l'IP d'un domaine avant Cloudflare", "BGP hijacking : détournement de routes BGP pour intercepter ou blackholer du trafic. Source ASN visible dans les logs", "Tor : 3 nœuds (Guard, Middle, Exit). Timing attack : corrélation trafic entrée/sortie par un adversaire global", "Beaconing C2 : connexions régulières vers un serveur C2. Interval fixe + payload minimal + persistance = signature"],
    values: ["DNS : port 53 UDP (requêtes) / TCP (transferts de zone). DoH : port 443", "WHOIS : port 43 TCP | Passive DNS : SecurityTrails, RiskIQ, VirusTotal", "NGFW (Palo Alto, Fortinet) : logs = application_name + user + threat + URL", "NetFlow : metadata trafic (IP src/dst, ports, bytes, durée) — sans le contenu"],
    tip: "Shodan (shodan.io) indexe les services exposés sur Internet (ports ouverts, bannières, certificats). Pour une investigation OSINT d'infrastructure : Shodan + pDNS + Certificate Transparency = cartographie complète d'une cible sans la toucher."
  },
  "Infrastructure, DNS et pivots": {
    file: "fiches/reseau.html",
    icon: "\ud83d\uddfa",
    points: ["Favicon hash (MurmurHash3) : indexé par Shodan. Même favicon sur plusieurs serveurs = infrastructure partagée de l'attaquant", "NS partagés entre plusieurs domaines malveillants = pivot puissant (même acteur, même hébergeur)", "Certificate Transparency (crt.sh) : tous les certificats publics loggés. Permet de découvrir des sous-domaines oubliés", "ASN (Autonomous System Number) : identifie l'organisation gérant un bloc d'IP. Un IP hébergeur ≠ identité de l'auteur", "pDNS historique : retrouver l'IP d'un domaine avant mise en place de Cloudflare ou changement de registrar"],
    values: ["Shodan : <code>http.favicon.hash:116323821</code> pour chercher par favicon hash", "RIR européen : RIPE NCC (stat.ripe.net) | Américain : ARIN | Asie : APNIC", "BGPView (bgpview.io) : cartographie des ASN et routes BGP", "crt.sh : <code>%.domaine.com</code> pour trouver tous les sous-domaines"],
    tip: "Même avec Cloudflare + privacy WHOIS, des traces persistent : CT logs (crt.sh révèle les certificats émis avant Cloudflare), pDNS (ancienne IP), erreurs de configuration (sous-domaine qui bypasse Cloudflare), SPF/DKIM records."
  },
  "Fondamentaux OSINT": {
    file: "fiches/osint.html",
    icon: "\ud83d\udd75",
    points: ["Cycle du renseignement : Planification → Collecte → Traitement → Analyse → Diffusion", "Règle d'or : corroboration multi-sources. 1 source = indice. 3 sources indépendantes = assertion défendable", "Cloisonnement obligatoire : navigateur dédié (Brave/Firefox profil vierge) + VPN/Tor + comptes dédiés", "LinkedIn notifie les visites de profil → toujours utiliser un compte anonyme ou le mode incognito de LinkedIn Sales Navigator", "Sources suisses : Zefix (zefix.ch) registre du commerce, FOSC (feuille officielle suisse du commerce), Shab.ch"],
    values: ["Wayback Machine (archive.org) : snapshots de pages web depuis 1996", "Google cache : <code>cache:url.com</code> — accès à la version en cache de Google", "HIBP (Have I Been Pwned) : vérifier si un email est dans des fuites de données connues", "Cycle OODA : Observer → Orienter → Décider → Agir — adapté à l'OSINT rapide"],
    tip: "En OSINT forensique, toute action doit être documentée (URL, date d'accès, capture d'écran). Les sources web changent ou disparaissent. Archiver immédiatement chaque découverte avec un outil comme SingleFile ou archive.org."
  },
  "Outils et automatisation OSINT": {
    file: "fiches/osint.html",
    icon: "\u2699",
    points: ["Maltego : graphe de pivot visuel — une entité → transforms automatiques → sous-domaines, emails, IPs, certificats. Valeur en audience : la chaîne de connexions devient visuelle", "theHarvester : collecte d'emails et sous-domaines depuis moteurs de recherche et sources publiques", "Recon-ng : framework Python modulaire, similaire à Maltego en ligne de commande", "Sherlock : recherche d'un pseudonyme sur 300+ plateformes simultanément", "SpiderFoot : automatisation OSINT complète (domaines, IPs, emails, réseaux sociaux)"],
    values: ["Shodan : <code>org:'Company Name'</code> | <code>ssl:'domain.com'</code> pour trouver les IPs d'une organisation", "theHarvester : <code>theHarvester -d domain.com -b google,bing,linkedin</code>", "Sherlock : <code>python3 sherlock.py username</code>", "WiGLE.net : géolocalisation de réseaux WiFi par BSSID (adresse MAC du routeur)"],
    tip: "Maltego est particulièrement efficace en contexte judiciaire : le graphe visualise les connexions entre entités d'une façon immédiatement compréhensible par un juge non-technique. Exporter en PNG pour le rapport d'expertise."
  },
  "Recherche web et Google Dorks": {
    file: "fiches/osint.html",
    icon: "\ud83d\udd0e",
    points: ["Google Dorking (Google Hacking) : combinaison d'opérateurs pour trouver des données exposées involontairement", "Opérateurs essentiels : <code>site:</code> (limiter à un domaine), <code>filetype:</code> (type de fichier), <code>inurl:</code> (URL), <code>intitle:</code> (titre), <code>intext:</code> (contenu)", "Passive OSINT : ne pas accéder directement à la cible. Utiliser le cache Google, Wayback Machine, Shodan", "GAN images (IA générative) : reconnaître par les artefacts (texte illisible, asymétrie oreilles/yeux, arrière-plan flou, dents aberrantes)", "Google Alerts : surveillance automatique des mentions d'une cible sur le web — configurer avec le nom + variantes"],
    values: ["<code>filetype:xls \"username\" \"password\"</code> → fichiers Excel avec credentials", "<code>site:linkedin.com \"Company Name\" \"infosec\"</code> → profils LinkedIn ciblés", "<code>inurl:wp-admin</code> → panneaux d'administration WordPress", "<code>\"index of\" filetype:pdf confidential</code> → répertoires ouverts avec PDFs"],
    tip: "Les Google Dorks ne sont légaux que dans le cadre de bug bounties, de tests autorisés, ou de recherche OSINT sur des sujets publics. L'accès à des données trouvées via Dorking sur des systèmes non autorisés reste une infraction (art. 143 CP en Suisse)."
  },
  "Métadonnées et EXIF": {
    file: "fiches/osint.html",
    icon: "\ud83d\udcf7",
    points: ["EXIF (Exchangeable Image File Format) : métadonnées embarquées dans les images JPEG/TIFF. Incluent coordonnées GPS, modèle appareil, paramètres, timestamps", "GPS EXIF : coordonnées WGS84 en degrés-minutes-secondes. Précision jusqu'à 3 mètres avec smartphone moderne", "Même sans GPS : horodatage + modèle appareil = lien avec un suspect (achat, IMEI, compte iCloud/Google Photos)", "Les plateformes sociales (Facebook, Instagram, Twitter) suppriment les EXIF à l'upload — mais les photos envoyées par message privé ou mail les conservent", "exiftool : outil de référence multiformat (JPEG, PNG, PDF, DOCX, MP4). Lecture, modification et suppression des métadonnées"],
    values: ["Commande : <code>exiftool photo.jpg</code> | <code>exiftool -GPS* photo.jpg</code> (GPS uniquement)", "Timestamps EXIF : DateTimeOriginal (prise de vue) ≠ FileModifyDate (système de fichiers)", "Numéro de série appareil photo dans les EXIF JPEG : lien direct avec le propriétaire", "PDF : auteur, organisation, logiciel, dates de création/modification dans les métadonnées XMP/DocInfo"],
    tip: "Les fichiers Office (.docx, .xlsx) embarquent : auteur (nom d'utilisateur Windows), organisation (licence Office), templates utilisés, chemins complets des fichiers liés, dates de création/révision, parfois des versions antérieures dans les métadonnées XML internes."
  },
};

function openFiches() {
  document.getElementById('fiches-overlay').classList.add('show');
  renderFicheHeatmap();
  renderFiche(Object.keys(CHEATSHEETS)[0]);
}
function closeFiches() {
  document.getElementById('fiches-overlay').classList.remove('show');
}
function renderFiche(chapter) {
  const data = CHEATSHEETS[chapter];
  if (!data) return;
  document.querySelectorAll('.fiche-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector('.fiche-tab[data-ch="'+CSS.escape(chapter)+'"]');
  if (tab) { tab.classList.add('active'); tab.scrollIntoView({block:'nearest',inline:'center'}); }
  const el = document.getElementById('fiche-content');
  const ptsHtml = data.points.map(p=>`<li>${p}</li>`).join('');
  const valsHtml = data.values.map(v=>`<li>${v}</li>`).join('');
  // Badge progression
  const stat = S.byChapter[chapter];
  let badgeHtml = '';
  if (stat && stat.tot > 0) {
    const pct = Math.round(stat.ok / stat.tot * 100);
    const col = pct >= 70 ? '#30e88a' : pct >= 40 ? '#f0c040' : '#ff4060';
    badgeHtml = `<div style="display:flex;align-items:center;gap:8px;margin-left:auto">
      <div style="font-size:11px;color:var(--dim)">${stat.ok}/${stat.tot} correctes</div>
      <div style="font-size:13px;font-weight:700;color:${col};background:${col}22;padding:3px 10px;border-radius:20px;border:1px solid ${col}55">${pct}%</div>
    </div>`;
  }
  el.innerHTML = `
    <div class="fiche-header">
      <span class="fiche-icon">${data.icon}</span>
      <h3 class="fiche-title">${chapter}</h3>
      ${badgeHtml}
    </div>
    <div class="fiche-section">
      <div class="fiche-section-label">Points clés</div>
      <ul class="fiche-list">${ptsHtml}</ul>
    </div>
    <div class="fiche-section">
      <div class="fiche-section-label">Valeurs &amp; formules</div>
      <ul class="fiche-list fiche-list--values">${valsHtml}</ul>
    </div>
    <div class="fiche-tip">
      <span class="fiche-tip-label">💡 Tip forensique</span>
      <span>${data.tip}</span>
    </div>
    <button type="button" onclick="drillChapter(${JSON.stringify(chapter)})" style="margin-top:14px;width:100%;padding:10px;border-radius:8px;border:1px solid var(--acc);background:rgba(0,229,204,.08);color:var(--acc);font-size:13px;font-weight:600;cursor:pointer">
      ▶ Réviser ce chapitre (questions uniquement)
    </button>
    ${data.file ? `<a href="${data.file}" target="_blank" style="display:block;margin-top:8px;width:100%;padding:9px;border-radius:8px;border:1px solid rgba(240,192,64,.35);background:rgba(240,192,64,.07);color:var(--gold);font-size:12px;font-weight:600;text-align:center;text-decoration:none;box-sizing:border-box">📖 Fiche complète détaillée ↗</a>` : ''}`;
}

function drillChapter(chapter) {
  // Fermer les fiches, activer le filtre chapitre, lancer
  closeFiches();
  S.activeC = new Set([chapter]);
  S.mode = 'normal';
  startGame();
}

function renderFicheHeatmap() {
  const el = document.getElementById('fiche-heatmap');
  if (!el) return;
  const chapters = Object.keys(CHEATSHEETS);
  el.innerHTML = chapters.map(ch => {
    const stat = S.byChapter[ch];
    let bg = 'rgba(255,255,255,.05)';
    let title = ch + ' — non commencé';
    if (stat && stat.tot > 0) {
      const pct = Math.round(stat.ok / stat.tot * 100);
      if (pct >= 70) { bg = 'rgba(48,232,138,.55)'; title = ch + ' — ' + pct + '% ✅'; }
      else if (pct >= 40) { bg = 'rgba(240,192,64,.55)'; title = ch + ' — ' + pct + '% ⚠️'; }
      else { bg = 'rgba(255,64,96,.45)'; title = ch + ' — ' + pct + '% ❌'; }
    }
    return `<div class="hm-cell" title="${title}" onclick="renderFiche(${JSON.stringify(ch)})" style="background:${bg}">${CHEATSHEETS[ch].icon}</div>`;
  }).join('');
}



// ═══════════════════════════════════════════════════════════════
// NIVEAU 1 — Boss Battle par chapitre
// ═══════════════════════════════════════════════════════════════

// Mapping chapters → fiche thème (pour la carte territoire)
const CHAPTER_TO_THEME_FILE = {
  "Technologie des disques": "fiches/disques.html",
  "Représentation des données": "fiches/disques.html",
  "FAT12 / FAT16 / FAT32": "fiches/fat16.html",
  "exFAT": "fiches/exfat.html",
  "NTFS": "fiches/ntfs.html",
  "EXT2 / EXT3 / EXT4": "fiches/ext.html",
  "HFS+ et APFS": "fiches/hfs.html",
  "Acquisition et préservation": "fiches/acquisition.html",
  "Formats de fichiers et Magic Bytes": "fiches/acquisition.html",
  "Artefacts temporels et MAC times": "fiches/acquisition.html",
  "Méthodologie forensique": "fiches/acquisition.html",
  "Méthodologie et bonnes pratiques": "fiches/acquisition.html",
  "Logiciels et outils forensiques": "fiches/outils.html",
  "Windows — Artefacts et exécution": "fiches/windows.html",
  "Windows — Registre et artefacts": "fiches/windows.html",
  "Windows — Journaux et Event Logs": "fiches/windows.html",
  "macOS — Artefacts et analyse": "fiches/macos-linux.html",
  "Linux — Artefacts et analyse": "fiches/macos-linux.html",
  "Chiffrement symétrique": "fiches/crypto.html",
  "Chiffrement asymétrique et RSA": "fiches/crypto.html",
  "PKI et certificats": "fiches/crypto.html",
  "Hachage et intégrité": "fiches/crypto.html",
  "Cassage et attaques": "fiches/crypto.html",
  "Procédure pénale": "fiches/droit.html",
  "Perquisition de documents": "fiches/droit.html",
  "Séquestre informatique": "fiches/droit.html",
  "Droit pénal informatique": "fiches/droit.html",
  "Expertise et rapport judiciaire": "fiches/droit.html",
  "Entraide judiciaire internationale": "fiches/droit.html",
  "Adressage IP": "fiches/reseau.html",
  "Réseau, protocoles et Internet": "fiches/reseau.html",
  "Infrastructure, DNS et pivots": "fiches/reseau.html",
  "Fondamentaux OSINT": "fiches/osint.html",
  "Outils et automatisation OSINT": "fiches/osint.html",
  "Recherche web et Google Dorks": "fiches/osint.html",
  "Métadonnées et EXIF": "fiches/osint.html",
};

const TERRITORY_THEMES = [
  { key: "Système de fichiers",    icon: "💾", name: "Filesystems",     color: "#7affea",
    chapters: ["Technologie des disques","FAT12 / FAT16 / FAT32","exFAT","NTFS","EXT2 / EXT3 / EXT4","HFS+ et APFS","Représentation des données"] },
  { key: "Acquisition et analyse", icon: "🔬", name: "Acquisition",     color: "#00e5cc",
    chapters: ["Acquisition et préservation","Formats de fichiers et Magic Bytes","Artefacts temporels et MAC times","Méthodologie forensique","Méthodologie et bonnes pratiques","Logiciels et outils forensiques"] },
  { key: "Spécificité des OS",     icon: "💻", name: "OS Forensics",    color: "#ff6b9d",
    chapters: ["Windows — Artefacts et exécution","Windows — Registre et artefacts","Windows — Journaux et Event Logs","macOS — Artefacts et analyse","Linux — Artefacts et analyse"] },
  { key: "Cryptologie",            icon: "🔐", name: "Cryptologie",     color: "#f0c040",
    chapters: ["Chiffrement symétrique","Chiffrement asymétrique et RSA","PKI et certificats","Hachage et intégrité","Cassage et attaques"] },
  { key: "Droit",                  icon: "⚖",  name: "Droit CH",        color: "#ff8c42",
    chapters: ["Procédure pénale","Perquisition de documents","Séquestre informatique","Droit pénal informatique","Expertise et rapport judiciaire","Entraide judiciaire internationale"] },
  { key: "OSINT",                  icon: "🕵",  name: "OSINT",           color: "#ffd580",
    chapters: ["Fondamentaux OSINT","Outils et automatisation OSINT","Recherche web et Google Dorks","Métadonnées et EXIF"] },
  { key: "Informatique de base",   icon: "📡", name: "Réseaux",         color: "#7ab8ff",
    chapters: ["Adressage IP","Réseau, protocoles et Internet","Infrastructure, DNS et pivots"] },
];

// State boss battle
const BOSS_THRESHOLD  = 20;  // bonnes réponses pour déclencher
const BOSS_QUESTIONS  = 5;   // questions dans le boss
const BOSS_TIME       = 18;  // secondes par question

let bossState = {
  active: false,
  chapter: null,
  questions: [],
  qi: 0,
  correct: 0,
  timerInt: null,
  timeLeft: BOSS_TIME,
  dots: [],
  beaten: new Set(JSON.parse(localStorage.getItem('bossBeaten') || '[]')),
};

// Fiches débloquées : une fiche se débloque quand ≥5 bonnes réponses sur un de ses chapitres
let ficheUnlocked = new Set(JSON.parse(localStorage.getItem('ficheUnlocked') || '[]'));

function saveBossState() {
  localStorage.setItem('bossBeaten', JSON.stringify([...bossState.beaten]));
}
function saveFicheUnlocked() {
  localStorage.setItem('ficheUnlocked', JSON.stringify([...ficheUnlocked]));
}

// ── Vérifier si un boss se déclenche après une bonne réponse ──
function checkBossTrigger(chapter) {
  if (!chapter) return;
  if (bossState.beaten.has(chapter)) return;  // déjà battu
  const stat = S.byChapter[chapter] || { ok: 0, tot: 0 };
  
  // Warning à THRESHOLD-5
  const warn = BOSS_THRESHOLD - 5;
  if (stat.ok === warn) {
    const wEl = document.getElementById('boss-warning');
    const cd  = document.getElementById('boss-countdown');
    if (wEl && cd) {
      cd.textContent = 5;
      wEl.style.display = 'block';
      let count = 5;
      const wi = setInterval(() => {
        count--;
        if (cd) cd.textContent = count;
        if (count <= 0) { clearInterval(wi); wEl.style.display = 'none'; }
      }, 1000);
    }
  }
  
  // Déclencher le boss
  if (stat.ok >= BOSS_THRESHOLD && !bossState.active) {
    bossState.active = true;
    bossState.chapter = chapter;
    // Sélectionner 5 questions hard du chapitre
    const pool = ALL_Q.filter(q => q.chapter === chapter && q.diff === 'hard');
    const shuffled = pool.sort(() => Math.random() - .5).slice(0, BOSS_QUESTIONS);
    bossState.questions = shuffled;
    bossState.qi = 0;
    bossState.correct = 0;
    // Lancer avec délai pour que le feedback de la bonne réponse s'affiche
    setTimeout(launchBoss, 1200);
  }
}

function launchBoss() {
  const overlay = document.getElementById('boss-overlay');
  if (!overlay) return;
  document.getElementById('boss-chapter-name').textContent = bossState.chapter;
  document.getElementById('boss-sub').textContent = "💀 " + BOSS_QUESTIONS + " questions · " + BOSS_TIME + "s chacune · Sans indice · Difficulté maximale";
  buildBossDots();
  renderBossQuestion();
  overlay.classList.add('show');
}

function buildBossDots() {
  const cont = document.getElementById('boss-progress');
  if (!cont) return;
  cont.innerHTML = '';
  bossState.dots = [];
  for (let i = 0; i < BOSS_QUESTIONS; i++) {
    const d = document.createElement('div');
    d.className = 'boss-dot' + (i === 0 ? ' current' : '');
    cont.appendChild(d);
    bossState.dots.push(d);
  }
}

function renderBossQuestion() {
  const q = bossState.questions[bossState.qi];
  if (!q) { bossEnd(); return; }
  
  document.getElementById('boss-result').style.display = 'none';
  document.getElementById('boss-continue').style.display = 'none';
  document.getElementById('boss-question-text').textContent = q.question;
  
  const ch = document.getElementById('boss-choices');
  ch.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.style.cssText = 'padding:8px 14px;border-radius:7px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:var(--text);font-size:.8rem;cursor:pointer;text-align:left;transition:.15s;font-family:monospace';
    btn.onclick = () => answerBoss(i, q, ch);
    ch.appendChild(btn);
  });
  
  startBossTimer();
}

function startBossTimer() {
  clearInterval(bossState.timerInt);
  bossState.timeLeft = BOSS_TIME;
  const fill = document.getElementById('boss-timer-fill');
  if (fill) fill.style.width = '100%';
  bossState.timerInt = setInterval(() => {
    bossState.timeLeft--;
    const pct = (bossState.timeLeft / BOSS_TIME) * 100;
    if (fill) {
      fill.style.width = pct + '%';
      fill.style.background = pct > 50
        ? 'linear-gradient(90deg,var(--green),var(--cyan))'
        : pct > 25
          ? 'linear-gradient(90deg,var(--gold),#ff8c42)'
          : 'linear-gradient(90deg,var(--red),#ff6b6b)';
    }
    if (bossState.timeLeft <= 0) answerBoss(-1, bossState.questions[bossState.qi], null);
  }, 1000);
}

function answerBoss(chosen, q, choicesEl) {
  clearInterval(bossState.timerInt);
  const correct = q.type === 'single' ? q.answers[0] : null;
  const isOk = q.type === 'single'
    ? chosen === q.answers[0]
    : q.answers.includes(chosen);
  
  if (isOk) bossState.correct++;
  
  // Coloriser les boutons
  if (choicesEl) {
    [...choicesEl.children].forEach((btn, i) => {
      btn.disabled = true;
      if (q.answers.includes(i)) {
        btn.style.background = 'rgba(48,232,138,.25)';
        btn.style.borderColor = '#30e88a';
        btn.style.color = '#30e88a';
      } else if (i === chosen && !isOk) {
        btn.style.background = 'rgba(255,64,96,.25)';
        btn.style.borderColor = '#ff4060';
        btn.style.color = '#ff4060';
      }
    });
  }
  
  // Mise à jour du dot
  if (bossState.dots[bossState.qi]) {
    bossState.dots[bossState.qi].classList.remove('current');
    bossState.dots[bossState.qi].classList.add(isOk ? 'done' : 'fail');
  }
  if (bossState.qi + 1 < BOSS_QUESTIONS && bossState.dots[bossState.qi + 1]) {
    bossState.dots[bossState.qi + 1].classList.add('current');
  }
  
  bossState.qi++;
  
  const cont = document.getElementById('boss-continue');
  if (cont) {
    cont.style.display = 'block';
    cont.style.cssText += bossState.qi >= BOSS_QUESTIONS
      ? ';background:linear-gradient(135deg,var(--green),var(--cyan));border-color:var(--green);color:#000'
      : ';background:rgba(0,229,204,.1);border-color:rgba(0,229,204,.5);color:var(--cyan)';
    cont.textContent = bossState.qi >= BOSS_QUESTIONS ? 'Voir le résultat →' : 'Question suivante →';
  }
}

function bossNext() {
  if (bossState.qi >= BOSS_QUESTIONS) {
    bossEnd();
  } else {
    renderBossQuestion();
  }
}

function bossEnd() {
  clearInterval(bossState.timerInt);
  const won = bossState.correct >= Math.ceil(BOSS_QUESTIONS * 0.6); // 60% pour gagner
  
  document.getElementById('boss-choices').innerHTML = '';
  document.getElementById('boss-question-text').textContent = '';
  document.getElementById('boss-timer-bar').style.display = 'none';
  
  const res = document.getElementById('boss-result');
  if (res) {
    res.style.display = 'block';
    res.className = 'boss-result ' + (won ? 'win' : 'fail');
    res.innerHTML = won
      ? `🏆 BOSS VAINCU !<br><span style="font-size:.8rem;font-weight:400;color:var(--text)">${bossState.correct}/${BOSS_QUESTIONS} correctes — Fiche débloquée !</span>`
      : `💔 Pas encore…<br><span style="font-size:.8rem;font-weight:400;color:var(--text)">${bossState.correct}/${BOSS_QUESTIONS} — Reviens après plus de pratique.</span>`;
  }
  
  const cont = document.getElementById('boss-continue');
  if (cont) {
    cont.style.display = 'block';
    cont.textContent = won ? '🎉 Continuer' : 'Retourner au quiz';
    cont.style.cssText += won
      ? ';background:linear-gradient(135deg,var(--green),var(--cyan));border-color:var(--green);color:#000'
      : ';background:rgba(255,64,96,.1);border-color:rgba(255,64,96,.4);color:var(--red)';
    cont.onclick = () => {
      document.getElementById('boss-overlay').classList.remove('show');
      document.getElementById('boss-timer-bar').style.display = 'block';
      bossState.active = false;
      
      if (won) {
        bossState.beaten.add(bossState.chapter);
        saveBossState();
        addXp(100); // Bonus XP boss
        // Débloquer la fiche si pas encore fait
        const fichePath = CHAPTER_TO_THEME_FILE[bossState.chapter];
        if (fichePath && !ficheUnlocked.has(fichePath)) {
          unlockFiche(fichePath);
        }
        spawnParticles(window.innerWidth/2, window.innerHeight/2, true);
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// NIVEAU 2 — Fiches débloquables
// ═══════════════════════════════════════════════════════════════

function checkFicheUnlock(chapter) {
  if (!chapter) return;
  const stat = S.byChapter[chapter] || { ok: 0 };
  const fichePath = CHAPTER_TO_THEME_FILE[chapter];
  if (!fichePath || ficheUnlocked.has(fichePath)) return;
  
  if (stat.ok >= 5) {
    unlockFiche(fichePath);
  }
}

function unlockFiche(fichePath) {
  if (ficheUnlocked.has(fichePath)) return;
  ficheUnlocked.add(fichePath);
  saveFicheUnlocked();
  
  // Mettre à jour les tabs
  document.querySelectorAll('.fiche-tab').forEach(tab => {
    const ch = tab.dataset.ch;
    if (CHAPTER_TO_THEME_FILE[ch] === fichePath) {
      tab.classList.remove('locked');
    }
  });
  
  // Notification visuelle
  showUnlockNotif(fichePath);
}

function showUnlockNotif(fichePath) {
  const name = fichePath.replace('fiches/','').replace('.html','').toUpperCase();
  const notif = document.createElement('div');
  notif.className = 'unlock-notif';
  notif.innerHTML = '🔓 Fiche ' + sanitizeHTML(name) + ' débloquée ! <a href="' + fichePath + '" target="_blank" style="color:var(--cyan);margin-left:8px;text-decoration:underline">Ouvrir →</a>';
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 4500);
}

function isFicheUnlocked(chapter) {
  const fichePath = CHAPTER_TO_THEME_FILE[chapter];
  if (!fichePath) return true; // pas de fiche = toujours accessible
  return ficheUnlocked.has(fichePath) || bossState.beaten.has(chapter);
}

function applyFicheLocks() {
  document.querySelectorAll('.fiche-tab').forEach(tab => {
    const ch = tab.dataset.ch;
    const locked = !isFicheUnlocked(ch);
    tab.classList.toggle('locked', locked);
  });
}

// ═══════════════════════════════════════════════════════════════
// NIVEAU 2 — Carte des territoires
// ═══════════════════════════════════════════════════════════════

function renderTerritoryMap() {
  const el = document.getElementById('territory-map');
  if (!el) return;
  
  el.innerHTML = TERRITORY_THEMES.map(terr => {
    // Calculer le % moyen des chapitres de ce territoire
    let totalOk = 0, totalTot = 0;
    terr.chapters.forEach(ch => {
      const stat = S.byChapter[ch] || { ok: 0, tot: 0 };
      totalOk += stat.ok;
      totalTot += stat.tot;
    });
    const pct = totalTot > 0 ? Math.round(totalOk / totalTot * 100) : 0;
    const beaten = bossState.beaten;
    const bossCount = terr.chapters.filter(ch => beaten.has(ch)).length;
    
    // Couleur de fond
    let bg, textCol;
    if (pct === 0)      { bg = 'rgba(106,128,168,.06)'; textCol = '#6a80a8'; }
    else if (pct < 40)  { bg = 'rgba(255,64,96,.15)';   textCol = '#ff6680'; }
    else if (pct < 70)  { bg = 'rgba(240,192,64,.15)';  textCol = '#f0c040'; }
    else                { bg = 'rgba(48,232,138,.18)';   textCol = '#30e88a'; }
    
    const conquered = pct >= 70;
    const bossIcon = bossCount > 0 ? `<span title="${bossCount} boss vaincus" style="position:absolute;top:2px;right:3px;font-size:8px">💀×${bossCount}</span>` : '';
    
    // Fiche pour ce territoire (prendre le premier chapitre)
    const ficheLink = CHAPTER_TO_THEME_FILE[terr.chapters[0]] || '#';
    
    return `<div class="terr${conquered ? ' terr-conquered' : ''}" 
               style="background:${bg};border-color:${pct>0 ? textCol+'40' : 'var(--border)'}"
               onclick="window.open('${ficheLink}','_blank')"
               title="${terr.key} — ${pct}% maîtrisé${bossCount ? ' · '+bossCount+' boss vaincus' : ''}">
      ${bossIcon}
      <div class="terr-icon">${terr.icon}</div>
      <div class="terr-name">${terr.name}</div>
      <div class="terr-pct" style="color:${textCol}">${pct > 0 ? pct + '%' : '–'}</div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// HOOKS — Intégration dans le flux existant
// ═══════════════════════════════════════════════════════════════

// Appelé après chaque bonne réponse
const _orig_processAnswer = typeof processAnswer === 'function' ? processAnswer : null;

// Hook sur openBilan pour mettre à jour la carte
const _orig_openBilan = openBilan;
openBilan = function() {
  _orig_openBilan.apply(this, arguments);
  renderTerritoryMap();
};

// Hook sur openFiches pour appliquer les locks
const _orig_openFiches = openFiches;
openFiches = function() {
  _orig_openFiches.apply(this, arguments);
  applyFicheLocks();
};

// Hook sur drillChapter pour check boss + fiche unlock
const _orig_drillChapter = drillChapter;
drillChapter = function(chapter) {
  _orig_drillChapter.apply(this, arguments);
};

// Patch de la fonction qui enregistre les bonnes réponses
// On cherche où S.byChapter[q.chapter].ok++ et on ajoute nos checks après
// Puisqu'on ne peut pas patcher inline, on overrride nextQ / le flux

// Vérification au démarrage
document.addEventListener('DOMContentLoaded', () => {
  // Appliquer les locks initiaux dès que les tabs sont dans le DOM
  setTimeout(applyFicheLocks, 500);
});

// Observer les mutations du DOM pour les fiches tabs (elles sont générées dynamiquement)
const _ficheObserver = new MutationObserver(() => {
  const tabs = document.querySelectorAll('.fiche-tab:not([data-lock-checked])');
  if (tabs.length) {
    applyFicheLocks();
    tabs.forEach(t => t.setAttribute('data-lock-checked','1'));
  }
});
_ficheObserver.observe(document.body, { childList: true, subtree: true });



// ═══════════════════════════════════════════════════════════════
// MODE SCÈNE DE CRIME — Niveau 1
// ═══════════════════════════════════════════════════════════════

const SCENES = [
  {
    id: 'gabriel-ssd',
    icon: '💾',
    color: '#00e5cc',
    title: "L'affaire du SSD",
    agent: 'Gabriel',
    intro: "Gabriel reçoit un appel à 6h30. Perquisition chez un suspect de fraude informatique. Sur le bureau : un SSD Samsung 980 Pro. La machine est allumée. Le temps presse.",
    debrief: "Bilan d'enquête : Gabriel a correctement identifié les risques du SSD (TRIM), effectué une acquisition live, analysé la MFT NTFS pour récupérer les fichiers supprimés, corrélé les timestamps, et préparé son rapport pour le juge. Chaque étape était irréversible si mal exécutée.",
    steps: [
      { chapter: "Technologie des disques",       narrative: "Le SSD est sous tension. Gabriel sait que le TRIM peut s'activer et effacer les données à tout moment. Il doit d'abord comprendre ce à quoi il a affaire…" },
      { chapter: "Acquisition et préservation",   narrative: "SSD identifié, machine toujours allumée. BitLocker est actif — la clé est en RAM. Gabriel ne peut pas éteindre. Il choisit le Live Forensics. Mais quelle est la bonne procédure ?" },
      { chapter: "NTFS",                           narrative: "Image RAM capturée, clé BitLocker extraite. L'image du SSD est montée en lecture seule. Gabriel ouvre X-Ways et navigue vers la MFT. Il y a des fichiers supprimés récemment…" },
      { chapter: "Artefacts temporels et MAC times", narrative: "Dans la MFT, Gabriel note une divergence entre $STANDARD_INFORMATION et $FILE_NAME sur un fichier suspect. Est-ce de la manipulation de timestamp ?" },
      { chapter: "Procédure pénale",              narrative: "Les preuves sont solides. Il reste à formaliser le tout dans un rapport judiciaire recevable. Le juge attend. Gabriel rédige ses conclusions…" },
    ]
  },
  {
    id: 'javier-reseau',
    icon: '📡',
    color: '#7ab8ff',
    title: "Opération Javier",
    agent: 'Javier',
    intro: "3h du matin. Une alerte SIEM déclenche une alarme critique sur le réseau de l'entreprise. Javier, analyste réseau de garde, ouvre son terminal. Des connexions sortantes vers une IP inconnue toutes les 4 minutes.",
    debrief: "Résultat de l'enquête : Javier a identifié un beaconing C2, retracé l'infrastructure via le DNS passif et Shodan, attribué l'IP à un hébergeur bullet-proof, corrélé avec les Event Logs Windows sur l'hôte compromis, et pivoté vers l'acteur menaçant via OSINT. Une chaîne de preuve complète.",
    steps: [
      { chapter: "Réseau, protocoles et Internet",  narrative: "Javier capture le trafic avec Wireshark. Les connexions sortantes ont un intervalle trop régulier. Ce n'est pas du trafic applicatif normal…" },
      { chapter: "Infrastructure, DNS et pivots",   narrative: "L'IP cible ne répond pas au ping, mais Shodan la connaît. Javier interroge le pDNS — cette IP a hébergé plusieurs domaines malveillants il y a 3 mois…" },
      { chapter: "Adressage IP",                    narrative: "Javier remonte l'ASN de l'IP. Un hébergeur bulletproof en Europe de l'Est. Mais l'IP publique de sortie de l'entreprise ne suffit pas — il faut le log DHCP interne pour identifier la machine…" },
      { chapter: "Windows — Journaux et Event Logs", narrative: "Machine interne identifiée. Javier l'isole du réseau et ouvre les Event Logs. Event ID 4688 révèle un processus PowerShell lancé depuis une macro Word à 14h37 — le patient zéro…" },
      { chapter: "Fondamentaux OSINT",             narrative: "L'adresse email de l'expéditeur du Word malveillant est connue. Javier lance une recherche OSINT pour attribuer l'attaque. Corroboration multi-sources obligatoire…" },
    ]
  },
  {
    id: 'dimitri-usb',
    icon: '🗃',
    color: '#f0c040',
    title: "La clé de Dimitri",
    agent: 'Dimitri',
    intro: "Dimitri, journaliste d'investigation, a trouvé une clé USB sans étiquette dans la boîte aux lettres de son bureau. Elle contient peut-être des documents sensibles sur une affaire de corruption. Il contacte un expert forensique — vous.",
    debrief: "Ce que la clé a révélé : un système FAT32 avec des fichiers supprimés récupérables, des photos avec coordonnées GPS révélatrices, et une trace EXIF menant à un appareil photo enregistré sous une identité connue. La clé était piégée pour identifier les lanceurs d'alerte — ou pour en trouver de nouveaux.",
    steps: [
      { chapter: "Formats de fichiers et Magic Bytes", narrative: "La clé est branchée via un write blocker. X-Ways analyse les magic bytes des fichiers. Certains ont une fausse extension — un fichier .jpg qui commence par 50 4B 03 04…" },
      { chapter: "FAT12 / FAT16 / FAT32",            narrative: "La clé est formatée en FAT32. Dans le répertoire racine, des entrées avec 0xE5 en premier octet — des fichiers supprimés. Le chaînage FAT est mis à zéro, mais les données sont intactes…" },
      { chapter: "Artefacts temporels et MAC times",  narrative: "Les timestamps des fichiers récupérés sont suspects : tous créés à la même seconde. Quelqu'un a utilisé un outil de timestomping. Mais la précision FAT est de 2 secondes — une erreur de calcul trahit l'auteur…" },
      { chapter: "Métadonnées et EXIF",              narrative: "Les photos sur la clé contiennent des données EXIF. GPS activé, modèle d'appareil photo visible. Les coordonnées GPS placent la prise de vue à 47.9° N, 7.3° E — une ville suisse très précise…" },
      { chapter: "Fondamentaux OSINT",               narrative: "Le modèle d'appareil photo correspond à un achat tracé. Dimitri a maintenant un fil — mais il faut corroborer via 3 sources indépendantes avant de publier…" },
    ]
  },
  {
    id: 'ludovic-droit',
    icon: '⚖',
    color: '#ff8c42',
    title: "Le dossier Ludovic",
    agent: 'Ludovic',
    intro: "Ludovic, avocat pénaliste, défend un prévenu accusé d'accès indu à un système informatique. Son client affirme être innocent. L'expert forensique de l'accusation a produit un rapport, mais Ludovic veut le contre-expertiser. Il a 72 heures.",
    debrief: "La défense de Ludovic a révélé : une saisie sous scellés potentiellement contestable, un hash SHA-256 non vérifié dans le rapport d'accusation, et une question d'entraide internationale pour les données hébergées à l'étranger non résolue. Parfois, l'acquittement vient d'une erreur de procédure, pas d'une innocence prouvée.",
    steps: [
      { chapter: "Droit pénal informatique",          narrative: "Ludovic examine les infractions retenues : art. 143 CP et art. 147 CP. La qualification juridique est-elle correcte ? Quels éléments constitutifs doit prouver l'accusation ?" },
      { chapter: "Procédure pénale",                 narrative: "Le rapport mentionne une 'perquisition informatique urgente' sans mandat initial. Ludovic vérifie la légalité de la saisie selon le CPP suisse…" },
      { chapter: "Expertise et rapport judiciaire",  narrative: "Le rapport de l'expert adverse est de 47 pages. Ludovic cherche les failles méthodologiques : les hashes sont-ils calculés sur l'original et la copie ? La chaîne de custody est-elle documentée ?" },
      { chapter: "Perquisition de documents",        narrative: "Les données saisies incluent des emails professionnels. Le prévenu a demandé la mise sous scellés — le TMC a rendu sa décision. Quelle en est la conséquence sur la procédure ?" },
      { chapter: "Entraide judiciaire internationale", narrative: "Certaines données sont hébergées chez un prestataire américain. L'accusation prétend les avoir obtenues directement. Ludovic conteste — quelle procédure était requise ?" },
    ]
  },
  {
    id: 'nuit-chiffree',
    icon: '🔐',
    color: '#a78bfa',
    title: "Nuit chiffrée",
    agent: 'Équipe DFIR',
    intro: "22h45. La police cantonale est appelée chez un suspect de cybercriminalité. Surprise : l'ordinateur est allumé, VeraCrypt ouvert, et le suspect s'apprête à appuyer sur Effacer. L'équipe DFIR a 30 secondes pour décider.",
    debrief: "Ce qui s'est joué en 30 secondes a déterminé toute l'enquête. La clé VeraCrypt était en RAM — une erreur dans la procédure d'acquisition aurait perdu toute la preuve. Le volume caché a été identifié par son entropie maximale, les artefacts Windows ont confirmé l'utilisation de VeraCrypt, et le hash du volume a fourni l'empreinte judiciaire.",
    steps: [
      { chapter: "Acquisition et préservation",     narrative: "Machine allumée, VeraCrypt monté. La clé AES-256 est quelque part en RAM. Éteindre = tout perdre. L'équipe a 30 secondes pour prendre la bonne décision…" },
      { chapter: "Chiffrement symétrique",           narrative: "Le container VeraCrypt utilise AES-256-XTS (mode disque). L'équipe a capturé la RAM avec DumpIt. La clé est dans le dump — mais où, et comment l'identifier ?" },
      { chapter: "Windows — Registre et artefacts", narrative: "Pendant l'analyse du dump RAM, un collègue examine le registre. Des traces de VeraCrypt dans les MRU, des chemins de containers dans les Recently Opened Files. Combien de volumes y a-t-il ?" },
      { chapter: "Cassage et attaques",              narrative: "Un second container VeraCrypt n'était pas monté — mais le suspect a un mot de passe faible, construit sur son prénom et une date. L'équipe configure Hashcat. Quel mode d'attaque ?" },
      { chapter: "Méthodologie forensique",          narrative: "Tout est documenté. Maintenant il faut structurer le rapport pour que chaque étape soit reproductible. Le juge d'instruction attend les conclusions…" },
    ]
  },
  {
    id: 'sofia-macos',
    icon: '🍎',
    color: '#a78bfa',
    title: "Le MacBook de Sofia",
    agent: 'Sofia',
    intro: "Sofia, analyste forensique senior, reçoit un MacBook Pro M2 saisi lors d'une perquisition. L'avocat de la défense réclame l'accès dans 48h. Le disque est en HFS+, FileVault activé. Sofia n'a pas le mot de passe.",
    debrief: "Sofia a navigué entre les spécificités d'HFS+ (Big Endian, B-tree Catalog), récupéré les artefacts macOS (QuarantineDB, FSEvents, Safari history), identifié des traces Linux dans une VM Parallels, et conclu son analyse avec un rapport certifié ISO 27037. L'avocat a obtenu son accès — aux preuves.",
    steps: [
      { chapter: "HFS+ et APFS",              narrative: "Le MacBook est éteint. Sofia monte l'image avec Arsenal Image Mounter. HFS+ apparaît — Big Endian, B-tree Catalog. Elle cherche le Catalog File pour localiser les fichiers supprimés…" },
      { chapter: "macOS — Artefacts et analyse", narrative: "Volume monté en lecture seule. Sofia cible les artefacts macOS : QuarantineDB, unified logs, Safari history. Quelques fichiers ont une date de quarantaine suspecte — ils ont été ouverts après la date officielle de la saisie…" },
      { chapter: "Linux — Artefacts et analyse", narrative: "Dans le dossier Parallels, Sofia trouve une VM Linux. Elle monte l'image ext4 — des scripts Python dans ~/.bash_history, des connexions SSH sortantes dans les logs systemd. L'adminstrateur système niait toute compétence Linux…" },
      { chapter: "Hachage et intégrité",       narrative: "Sofia doit prouver que l'image est intacte depuis la saisie. Elle compare le hash SHA-256 calculé à la réception avec celui du rapport d'acquisition d'origine. Il y a une divergence d'un bit. Que signifie-t-elle ?" },
      { chapter: "Expertise et rapport judiciaire", narrative: "L'heure du rapport. Sofia structure ses conclusions pour le juge d'instruction. Chaque fait doit être sourcé, chaque timestamp en UTC. L'avocat de la défense attend pour contre-expertiser dans 12 heures…" },
    ]
  },
  {
    id: 'marco-ransomware',
    icon: '🏥',
    color: '#f87171',
    title: "Incident à l'hôpital",
    agent: 'Marco',
    intro: "3h14. Les serveurs du CHUV sont chiffrés. Les moniteurs cardiaques basculent sur papier. Marco, RSSI de garde, doit identifier le patient zéro, contenir la propagation et préparer la notification PFPDT — tout en maintenant les soins.",
    debrief: "Marco a retracé le ransomware depuis un email de phishing (artefacts Windows exécution), suivi la propagation latérale via les Event Logs, extrait des IOC réseau pour bloquer les C2, utilisé les outils forensiques pour l'image live, et notifié le PFPDT dans les délais légaux. Un manuel de crise en 5 actes.",
    steps: [
      { chapter: "Windows — Artefacts et exécution", narrative: "Marco isole le premier serveur suspect. Prefetch, Amcache, ShimCache — un exécutable inconnu lancé à 2h47. C'est le patient zéro. Mais comment est-il entré dans le réseau hospitalier ?" },
      { chapter: "Windows — Journaux et Event Logs", narrative: "Event ID 4624 Type 3 en cascade entre 23 machines entre 2h47 et 3h14. Le ransomware s'est propagé via SMB. Event 7045 sur 4 serveurs — un service malveillant installé. Marco a maintenant la carte complète du mouvement latéral…" },
      { chapter: "Réseau, protocoles et Internet", narrative: "Wireshark révèle des connexions HTTPS vers 3 IPs inconnues toutes les 4 minutes exactement — du beaconing C2. Marco doit identifier et bloquer les serveurs de commande sans couper le réseau médical critique…" },
      { chapter: "Logiciels et outils forensiques", narrative: "Le DSI veut une image live du serveur central sans l'éteindre — les dossiers patients critiques y sont. Marco choisit son outil d'acquisition. Write-blocker physique inutilisable en live forensics. Quelle est la procédure correcte ?" },
      { chapter: "Perquisition de documents",   narrative: "La police cantonale arrive. Mandat en main. Elle veut saisir les serveurs physiquement. Marco s'y oppose — arrêt des serveurs = rupture potentielle de soins. Quel article du CPP encadre la saisie des systèmes en exploitation continue ?" },
    ]
  },
  {
    id: 'elena-osint',
    icon: '🕵',
    color: '#34d399',
    title: "Opération Elena",
    agent: 'Elena',
    intro: "Un journaliste suisse reçoit des menaces de mort par email. L'expéditeur utilise un alias, une adresse jetable, un VPN. La police cantonale mandate Elena, experte OSINT, pour identifier l'auteur sans compromettre l'enquête ni brûler les sources.",
    debrief: "Elena a pivoté depuis un alias vers une infrastructure réelle : reverse image search sur une photo de profil, corrélation de métadonnées EXIF, analyse DNS passive, et identification via un compte oublié sur un forum de 2017. La clé : la constance des erreurs humaines à travers le temps.",
    steps: [
      { chapter: "Fondamentaux OSINT",           narrative: "Elena commence par cartographier ce qu'elle sait : alias, adresse email, style d'écriture, fuseaux horaires des envois. Elle choisit ses outils et prépare son infrastructure — cloisonnement obligatoire. Par où commencer sans se griller ?" },
      { chapter: "Outils et automatisation OSINT", narrative: "Maltego, Shodan, SpiderFoot. L'alias apparaît sur 3 forums différents. Elena automatise la collecte mais doit corroborer chaque source de façon indépendante. Un seul résultat non corroboré n'est pas une preuve recevable…" },
      { chapter: "Recherche web et Google Dorks", narrative: "Un Google Dork sur l'adresse email révèle une inscription sur un site datant de 2019. Le profil est supprimé, mais Google Cache et Wayback Machine gardent tout. Elena plonge dans les archives — ce qui est effacé n'est pas toujours parti…" },
      { chapter: "Métadonnées et EXIF",          narrative: "L'un des emails contient une pièce jointe image. Elena extrait les métadonnées EXIF — coordonnées GPS, modèle d'appareil, fuseau horaire. Le téléphone était à Genève un mardi à 14h32. La géolocalisation est plus précise que prévu…" },
      { chapter: "Infrastructure, DNS et pivots", narrative: "L'IP de connexion change, mais le certificat TLS du serveur VPN a été réutilisé sur une autre infrastructure 6 mois plus tôt. Passive DNS révèle un nom de domaine enregistré avec une vraie adresse email. Le pivot est trouvé…" },
    ]
  },
  {
    id: 'thomas-ext4',
    icon: '🐧',
    color: '#60a5fa',
    title: "Le Serveur de Thomas",
    agent: 'Thomas',
    intro: "Un administrateur système est accusé d'avoir exfiltré la base de données clients de son employeur avant de démissionner. Le serveur Linux tourne en EXT4. Thomas, expert forensique, doit prouver — ou infirmer — l'exfiltration.",
    debrief: "Thomas a reconstruit la timeline complète depuis les inodes EXT4, corrélé les logs systemd avec les connexions SSH, retrouvé des fichiers supprimés par carving, et identifié un script cron malveillant. La preuve décisive : un fichier .tar.gz créé à 23h47, transféré via rsync, effacé — mais l'inode était encore dans le journal EXT4.",
    steps: [
      { chapter: "EXT2 / EXT3 / EXT4",          narrative: "Thomas monte l'image du serveur Linux. Système EXT4, journalisation activée. Il cherche les fichiers supprimés récemment — les inodes libérés contiennent encore des métadonnées. Un .tar.gz de 4,2 Go disparu à 23h47…" },
      { chapter: "Linux — Artefacts et analyse", narrative: "Thomas fouille /var/log — auth.log révèle 3 connexions SSH depuis une IP externe entre 23h30 et 0h15. ~/.bash_history a été effacé, mais le journal EXT4 en garde une trace partielle. Le suspect pensait avoir tout supprimé…" },
      { chapter: "Artefacts temporels et MAC times", narrative: "Les timestamps sur les fichiers suspects sont trop propres — tous modifiés à la même seconde. Quelqu'un a utilisé 'touch' pour masquer l'activité. Mais le journal EXT4 conserve les vraies dates d'allocation de blocs…" },
      { chapter: "Logiciels et outils forensiques", narrative: "Thomas lance Autopsy sur l'image. Le carving retrouve des fragments du .tar.gz dans l'espace non alloué. Il reconstruit l'artefact partiel — 847 enregistrements clients visibles. Quel outil pour valider l'intégrité des fragments ?" },
      { chapter: "Hachage et intégrité",         narrative: "Thomas doit prouver que son image est identique au serveur original. Il compare les hash SHA-256 — ils correspondent. Mais l'avocat de la défense conteste la procédure de copie à chaud. Thomas doit défendre chaque étape de sa méthode…" },
    ]
  },
  {
    id: 'clara-pki',
    icon: '🔑',
    color: '#fbbf24',
    title: "La Fausse Signature",
    agent: 'Clara',
    intro: "Une entreprise genevoise découvre qu'un contrat de 2,3 millions de francs a été signé électroniquement en son nom — sans que personne ne l'ait autorisé. Le certificat est valide. Clara doit déterminer si la signature est légitime ou usurpée.",
    debrief: "Clara a décortiqué la PKI : validation de la chaîne de certificats, vérification OCSP, analyse des logs HSM, et reconstruction du moment de signature via les timestamps RFC 3161. La conclusion : le certificat était valide, mais la clé privée avait été exportée illégalement 3 semaines avant la signature.",
    steps: [
      { chapter: "PKI et certificats",            narrative: "Clara examine le certificat utilisé pour signer. Émetteur, période de validité, algorithme de signature, extensions critiques. La chaîne de confiance remonte à une AC suisse reconnue. Mais le certificat est-il révoqué ? Comment le vérifier sans prévenir le suspect ?" },
      { chapter: "Chiffrement asymétrique et RSA", narrative: "La signature RSA est techniquement valide — la vérification cryptographique passe. Cela prouve seulement que la clé privée a signé, pas que le propriétaire légal l'a fait. Clara cherche comment la clé aurait pu être compromise sans laisser de trace visible…" },
      { chapter: "Windows — Registre et artefacts", narrative: "Sur le poste du PDG, Clara cherche des traces d'export de certificat. Le registre Windows et les Event Logs (Event 70 — export de clé privée) révèlent que certutil a été utilisé pour exporter le .pfx à 19h23 un vendredi soir…" },
      { chapter: "Logiciels et outils forensiques", narrative: "Clara analyse les logs du HSM (Hardware Security Module) de l'entreprise. Elle cherche quand la clé privée a quitté l'environnement sécurisé. Les outils forensiques doivent s'adapter à un environnement PKI non standard avec des logs propriétaires…" },
      { chapter: "Droit pénal informatique",      narrative: "La clé a été exportée illégalement. Clara rédige ses conclusions pour le Ministère public. Quelle infraction caractérise l'usurpation de signature électronique qualifiée en droit suisse ? Quelles preuves numériques sont recevables devant le tribunal ?" },
    ]
  },
  {
    id: 'yuki-exfat',
    icon: '📷',
    color: '#f97316',
    title: "La Carte Mémoire de Yuki",
    agent: 'Yuki',
    intro: "Une photographe de guerre suisse est détenue à une frontière. Sa carte SD de 128 Go est confisquée. Elle contient des photos de témoins protégés. L'ambassade suisse mandate Yuki pour une analyse contradictoire — vérifier ce que les autorités frontalières ont réellement récupéré.",
    debrief: "Yuki a analysé l'image bit-à-bit de la carte SD exFAT, identifié les fichiers supprimés via le $Bitmap, retrouvé des photos par carving JPEG, et détecté une tentative d'effacement partiel. Ses conclusions ont permis d'établir quelles images avaient réellement été accessibles et lesquelles restaient irrécupérables.",
    steps: [
      { chapter: "exFAT",                        narrative: "La carte SD est en exFAT — standard pour les cartes > 64 Go. Yuki monte l'image avec un write-blocker. Elle ouvre le $Bitmap pour cartographier les clusters utilisés et libres. Des clusters marqués libres affichent une entropie anormalement élevée…" },
      { chapter: "Formats de fichiers et Magic Bytes", narrative: "Yuki lance un carving sur l'espace non alloué. Des magic bytes JPEG — FF D8 FF — apparaissent dans des clusters marqués libres. Des photos supprimées mais pas écrasées. Elle les reconstruit une par une pour inventorier ce qui a été accessible…" },
      { chapter: "Métadonnées et EXIF",           narrative: "Les photos récupérées contiennent des métadonnées EXIF intactes : coordonnées GPS, horodatage, modèle d'appareil. Yuki peut prouver où et quand chaque photo a été prise. Mais quelqu'un a modifié les dates de certains fichiers après la saisie…" },
      { chapter: "Artefacts temporels et MAC times", narrative: "Les timestamps exFAT ont une précision de 10 ms — bien supérieure au FAT32 (2 s). Yuki compare les timestamps des fichiers existants avec ceux des fichiers récupérés. Une incohérence trahit une modification effectuée après la confiscation officielle…" },
      { chapter: "Acquisition et préservation",   narrative: "Yuki doit présenter ses résultats comme preuve contradictoire. Elle documente sa chaîne de custody, ses hash MD5+SHA-256, et sa procédure step-by-step. L'expert adverse va tout vérifier — chaque étape doit être reproductible et défendable…" },
    ]
  },
  {
    id: 'alex-sequestr',
    icon: '⚖',
    color: '#e879f9',
    title: "Scellés sous tension",
    agent: 'Alex',
    intro: "Alex est chargé de la saisie informatique dans une fiduciaire soupçonnée de blanchiment. Au moment d'apposer les scellés, l'avocat de la société invoque le secret professionnel et demande la mise sous scellés. Le Tribunal des mesures de contrainte doit trancher dans 5 jours.",
    debrief: "Alex a navigué l'un des cas les plus complexes du CPP suisse : la procédure de scellés. Entre le droit à la preuve de l'accusation, le secret professionnel de l'avocat, et la compétence du TMC pour le tri, chaque étape procédurale était un piège potentiel. La complexité du droit numérique suisse dans toute sa subtilité.",
    steps: [
      { chapter: "Séquestre informatique",        narrative: "Alex doit saisir les serveurs. L'avocat invoque immédiatement les scellés sur 'tous les fichiers professionnels'. Alex doit décider : saisir l'entier du serveur ou trier sur place ? Le CPP est précis sur ce point — une erreur ici annule tout." },
      { chapter: "Perquisition de documents",    narrative: "Le TMC doit trier les fichiers sous scellés pour séparer ce qui est couvert par le secret professionnel de ce qui ne l'est pas. Alex prépare une liste technique des fichiers. Comment prouver qu'un fichier n'est pas couvert par le secret sans en révéler le contenu ?" },
      { chapter: "Droit pénal informatique",     narrative: "Pendant la procédure de scellés, Alex découvre que les serveurs synchronisent automatiquement vers un cloud étranger — les données partent en temps réel. Peut-il saisir les données cloud ? Quelle infraction caractérise l'obstruction numérique à la justice ?" },
      { chapter: "Expertise et rapport judiciaire", narrative: "Alex est nommé expert technique par le TMC pour le tri des fichiers sous scellés. Il doit produire un rapport listant chaque fichier, son contenu probable, et sa pertinence pour l'enquête — sans violer le secret professionnel dans le rapport lui-même…" },
      { chapter: "Entraide judiciaire internationale", narrative: "Une partie des données est hébergée en Allemagne. L'entreprise a un bureau à Francfort. Alex doit obtenir les logs du serveur allemand. Quelle procédure d'entraide judiciaire s'applique entre la Suisse et l'UE ? Dans quel délai réaliste ?" },
    ]
  },
];

// État de la scène courante
let sceneState = {
  active: false,
  scene: null,
  qi: 0,          // index question dans la scène
  questions: [],  // pool de questions pour chaque étape
  correct: 0,
  beaten: new Set(JSON.parse(localStorage.getItem('scenesBeaten') || '[]')),
};

function saveSceneBeaten() {
  localStorage.setItem('scenesBeaten', JSON.stringify([...sceneState.beaten]));
}

// ── Sélection de scène ──
function openSceneMode() {
  closeOverlay('scene-overlay');
  const el = document.getElementById('scene-cards');
  if (!el) return;
  
  el.innerHTML = SCENES.map(scene => {
    const done = sceneState.beaten.has(scene.id);
    const stepsHtml = scene.steps.map(s =>
      `<span class="scene-step-chip">${s.chapter.split(' ')[0]}…</span>`
    ).join('');
    return `<div class="scene-card" onclick="launchScene('${scene.id}')" style="border-color:${scene.color}22">
      <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${scene.color};border-radius:3px 0 0 3px"></div>
      <div class="scene-card-icon">${scene.icon}</div>
      <div class="scene-card-body">
        <div class="scene-card-title" style="color:${scene.color}">${scene.title}</div>
        <div class="scene-card-sub">Enquêteur : <em>${scene.agent}</em> · 5 questions séquencées<br>${scene.intro.slice(0,100)}…</div>
        <div class="scene-steps-preview">${stepsHtml}</div>
      </div>
      ${done ? '<span class="scene-card-badge scene-badge-done">✅ Résolue</span>' : '<span class="scene-card-badge scene-badge-new">Nouvelle</span>'}
    </div>`;
  }).join('');
  
  document.getElementById('scene-overlay').classList.add('show');
}

function launchScene(sceneId) {
  const scene = SCENES.find(s => s.id === sceneId);
  if (!scene) return;
  
  closeOverlay('scene-overlay');
  
  // Construire le pool : 1 question par étape depuis le chapitre correspondant
  const pool = scene.steps.map((step, i) => {
    const candidates = ALL_Q
      .map((q, idx) => ({ q, idx }))
      .filter(x => x.q.chapter === step.chapter);
    if (!candidates.length) return null;
    // Utiliser l'index de scène + jour comme seed pour varier sans être totalement aléatoire
    const seed = sceneId.length * 7 + i * 31 + new Date().getDate();
    return candidates[seed % candidates.length];
  }).filter(Boolean);
  
  if (pool.length < 3) {
    showToast('combo-toast', '⚠ Questions insuffisantes pour cette scène', 2000);
    return;
  }
  
  sceneState = {
    ...sceneState,
    active: true,
    scene: scene,
    qi: 0,
    questions: pool,
    correct: 0,
  };
  
  // Passer en mode scène
  S.mode = 'scene';
  S.pool = pool;
  S.pi = 0;
  
  // Afficher l'intro de la scène
  showToast('combo-toast', `🔍 ${scene.title} — ${scene.agent} entre en scène`, 2800);
  
  // Construire les dots de progression scène dans le q-counter
  const qc = document.getElementById('q-counter');
  if (qc) {
    qc.innerHTML = buildSceneProgressDots(0, pool.length);
  }
  
  // Lancer la première question
  renderQuestion(pool[0]);
}

function buildSceneProgressDots(currentIdx, total) {
  const label = sceneState.scene ? `<span style="font-size:10px;color:var(--cyan);font-weight:600;margin-right:6px">🔍 ${sceneState.scene.icon}</span>` : '';
  const dots = Array.from({length: total}, (_, i) =>
    `<span class="sq-dot ${i < currentIdx ? 'done' : i === currentIdx ? 'current' : ''}"></span>`
  ).join('');
  return `<div style="display:flex;align-items:center;gap:4px">${label}<div id="scene-progress" style="display:flex;gap:4px">${dots}</div><span style="font-size:11px;color:var(--dim);margin-left:6px">${currentIdx+1}/${total}</span></div>`;
}

function updateSceneBanner(qi) {
  const banner = document.getElementById('scene-banner');
  const label  = document.getElementById('scene-step-label');
  const narr   = document.getElementById('scene-narrative');
  
  if (!banner || !sceneState.active || !sceneState.scene) {
    if (banner) banner.style.display = 'none';
    return;
  }
  
  const step = sceneState.scene.steps[qi];
  if (!step) { banner.style.display = 'none'; return; }
  
  banner.style.display = 'block';
  label.textContent  = `Étape ${qi + 1}/${sceneState.scene.steps.length} · ${sceneState.scene.agent}`;
  narr.textContent   = step.narrative;
}

// ── Hook sur renderQuestion pour la scène ──
const _scene_orig_renderQ = renderQuestion;
renderQuestion = function(item) {
  _scene_orig_renderQ.apply(this, arguments);
  
  if (sceneState.active && sceneState.scene) {
    const qi = sceneState.questions.indexOf(item);
    const effectiveQi = qi >= 0 ? qi : sceneState.qi;
    updateSceneBanner(effectiveQi);
    
    const qc = document.getElementById('q-counter');
    if (qc) qc.innerHTML = buildSceneProgressDots(effectiveQi, sceneState.questions.length);
  }
};

// ── Hook sur validate pour avancer dans la scène ──
const _scene_orig_validate = validate;
validate = function() {
  _scene_orig_validate.apply(this, arguments);
  
  if (!sceneState.active) return;
  
  // Vérifier si c'est la dernière question de la scène
  // S.pi a déjà avancé après getNext() dans nextQuestion
};

// ── Hook sur nextQuestion pour détecter fin de scène ──
const _scene_orig_nextQ = nextQuestion;
nextQuestion = function() {
  if (sceneState.active && S.mode === 'scene') {
    // Compter la question qui vient d'être répondue
    if (S.answered) {
      const q = S.curQ;
      const selCorrect = S.selCorrect || new Map();
      const ok = [...selCorrect.values()].filter(Boolean).length === q.answers.length
                 && S.sel.size === q.answers.length;
      if (ok) sceneState.correct++;
      sceneState.qi++;
    }
    
    // Si plus de questions dans la scène → fin
    if (S.pi >= sceneState.questions.length) {
      setTimeout(endScene, 800);
      return;
    }
  }
  _scene_orig_nextQ.apply(this, arguments);
};

function endScene() {
  sceneState.active = false;
  S.mode = 'normal';
  
  const scene = sceneState.scene;
  const correct = sceneState.correct;
  const total = sceneState.questions.length;
  const won = correct >= Math.ceil(total * 0.6);
  
  // Masquer la bannière scène
  const banner = document.getElementById('scene-banner');
  if (banner) banner.style.display = 'none';
  
  // Bonus XP
  const xpBonus = won ? correct * 25 + 50 : correct * 10;
  addXp(xpBonus);
  
  if (won && !sceneState.beaten.has(scene.id)) {
    sceneState.beaten.add(scene.id);
    saveSceneBeaten();
  }
  
  // Afficher l'overlay de fin
  const overlay = document.getElementById('scene-end-overlay');
  document.getElementById('scene-end-icon').textContent = won ? scene.icon + ' 🏆' : scene.icon + ' 💔';
  document.getElementById('scene-end-title').textContent = won ? 'Affaire résolue !' : 'Enquête incomplète';
  document.getElementById('scene-end-title').style.color = won ? 'var(--green)' : 'var(--red)';
  document.getElementById('scene-end-result').textContent =
    `${correct}/${total} étapes réussies · +${xpBonus} XP · ${scene.title}`;
  document.getElementById('scene-end-debrief').innerHTML =
    `<strong style="color:var(--cyan)">Bilan d'enquête</strong><br>${scene.debrief}`;
  
  overlay.style.display = 'flex';
  if (won) spawnParticles(window.innerWidth/2, window.innerHeight/2, true);
}

function closeSceneEnd() {
  document.getElementById('scene-end-overlay').style.display = 'none';
  const qc = document.getElementById('q-counter');
  if (qc) qc.textContent = '';
  buildPool();
  renderQuestion(getNext());
}

// Mode 'scene' dans buildPool — pool déjà défini par launchScene, ne pas le reconstruire
const _scene_orig_buildPool = buildPool;
buildPool = function() {
  if (S.mode === 'scene') return; // Le pool scène est géré par launchScene
  _scene_orig_buildPool.apply(this, arguments);
};



// ═══════════════════════════════════════════════════════════════
// NIVEAU 4A — RAPPORT D'EXPERTISE JUDICIAIRE (PDF simulé)
// ═══════════════════════════════════════════════════════════════

// Générateurs d'erreurs forensiques par chapitre
const FORENSIC_ERROR_TEMPLATES = {
  "NTFS": (q, wrong, correct) => ({
    category: "Analyse NTFS",
    error: `L'expert a affirmé que "${wrong}" concernant la structure NTFS, alors que "${correct}" est la réalité technique.`,
    consequence: "Cette confusion entre les attributs $STANDARD_INFORMATION et $FILE_NAME, ou entre le MFT record et ses attributs, est susceptible d'être attaquée par la défense sur la base de l'intégrité méthodologique.",
    severity: "MAJEURE",
  }),
  "FAT12 / FAT16 / FAT32": (q, wrong, correct) => ({
    category: "Analyse FAT",
    error: `L'expert a caractérisé la structure FAT en indiquant "${wrong}", ce qui est inexact — la réponse correcte est "${correct}".`,
    consequence: "Une erreur sur la structure FAT (chaînage, entrées SFN/LFN, valeurs spéciales) invalide potentiellement la reconstruction du système de fichiers présentée au tribunal.",
    severity: "SIGNIFICATIVE",
  }),
  "exFAT": (q, wrong, correct) => ({
    category: "Analyse exFAT",
    error: `Concernant exFAT, l'expert a conclu "${wrong}" au lieu de "${correct}".`,
    consequence: "L'inexactitude sur la bitmap d'allocation, les offsets du boot sector ou le flag NoFatChain peut compromettre la preuve d'accès ou de suppression de fichiers.",
    severity: "SIGNIFICATIVE",
  }),
  "Acquisition et préservation": (q, wrong, correct) => ({
    category: "Protocole d'acquisition",
    error: `L'expert a appliqué la procédure suivante : "${wrong}", alors que le standard forensique requiert "${correct}".`,
    consequence: "Toute déviation au protocole d'acquisition (RFC 3227, ISO/IEC 27037) expose l'intégrité de la preuve à une contestation d'irrecevabilité devant le Tribunal pénal fédéral.",
    severity: "CRITIQUE",
  }),
  "Artefacts temporels et MAC times": (q, wrong, correct) => ({
    category: "Analyse temporelle",
    error: `L'expert a conclu sur les timestamps en indiquant "${wrong}", alors que "${correct}" est la valeur exacte ou la bonne interprétation.`,
    consequence: "Une erreur sur les MAC times NTFS ou la précision FAT (2s) peut invalider toute la chronologie présentée — argument central de la défense dans les affaires de timestomping.",
    severity: "MAJEURE",
  }),
  "Windows — Artefacts et exécution": (q, wrong, correct) => ({
    category: "Artefacts Windows — Exécution",
    error: `L'expert a déclaré que "${wrong}" concernant les artefacts d'exécution Windows, alors que "${correct}".`,
    consequence: "Confondre Prefetch, Amcache et ShimCache — ou leurs significations forensiques — affaiblit la preuve d'exécution d'un programme malveillant devant un expert contradicteur.",
    severity: "MAJEURE",
  }),
  "Windows — Registre et artefacts": (q, wrong, correct) => ({
    category: "Registre Windows",
    error: `Concernant le registre Windows, l'expert a affirmé "${wrong}" en lieu et place de "${correct}".`,
    consequence: "Une méprise sur les ruches (HKLM vs HKCU), les clés de persistance ou USBSTOR fragilise la démonstration de la présence ou de l'action d'un acteur sur le système.",
    severity: "SIGNIFICATIVE",
  }),
  "Windows — Journaux et Event Logs": (q, wrong, correct) => ({
    category: "Event Logs Windows",
    error: `L'expert a cité l'Event ID ou l'interprétation suivante : "${wrong}", alors que "${correct}" est la valeur correcte.`,
    consequence: "Confondre les Event IDs (4624/4625, 4688, 7045) ou leur signification expose le rapport à une contradiction technique immédiate lors de la confrontation d'experts.",
    severity: "MAJEURE",
  }),
  "Chiffrement symétrique": (q, wrong, correct) => ({
    category: "Cryptographie symétrique",
    error: `Sur le chiffrement symétrique, l'expert a avancé "${wrong}" alors que "${correct}" est exact.`,
    consequence: "Une confusion sur les modes AES (ECB/CBC/GCM) ou les propriétés de XOR peut conduire à surévaluer ou sous-évaluer la difficulté d'accès aux données chiffrées.",
    severity: "SIGNIFICATIVE",
  }),
  "Chiffrement asymétrique et RSA": (q, wrong, correct) => ({
    category: "Cryptographie asymétrique — RSA",
    error: `L'expert a formulé "${wrong}" en matière de RSA/PKI, alors que la réponse exacte est "${correct}".`,
    consequence: "Une erreur sur RSA (rôles clé publique/privée, signature vs chiffrement) invalide l'argument de non-répudiation ou de confidentialité dans le rapport.",
    severity: "MAJEURE",
  }),
  "Procédure pénale": (q, wrong, correct) => ({
    category: "Droit — Procédure pénale (CPP)",
    error: `L'expert a avancé "${wrong}" sur une question de procédure pénale, alors que "${correct}" est la disposition applicable.`,
    consequence: "Une erreur de droit procédural (CPP suisse) dans un rapport d'expertise est particulièrement grave — la défense peut demander la nullité de la procédure sur cette base.",
    severity: "CRITIQUE",
  }),
  "Perquisition de documents": (q, wrong, correct) => ({
    category: "Droit — Perquisition et saisie",
    error: `Concernant la perquisition informatique, l'expert a indiqué "${wrong}" au lieu de "${correct}".`,
    consequence: "Une erreur sur les règles de perquisition (art. 244–248 CPP, mise sous scellés) peut entraîner l'irrecevabilité des preuves obtenues.",
    severity: "CRITIQUE",
  }),
  "Expertise et rapport judiciaire": (q, wrong, correct) => ({
    category: "Méthodologie du rapport",
    error: `L'expert a répondu "${wrong}" sur une question relative à la rédaction d'une expertise judiciaire (réponse exacte : "${correct}").`,
    consequence: "Une erreur sur les exigences formelles du rapport (art. 184–188 CPP, distinction fait/opinion) fragilise l'admissibilité même du document.",
    severity: "CRITIQUE",
  }),
  "Hachage et intégrité": (q, wrong, correct) => ({
    category: "Intégrité des preuves — Hachage",
    error: `L'expert a affirmé "${wrong}" concernant les fonctions de hachage, alors que "${correct}".`,
    consequence: "Confondre MD5, SHA-1 et SHA-256, ou mal interpréter la chaîne de custody hashée, permet à la défense de contester l'intégrité de l'image forensique elle-même.",
    severity: "MAJEURE",
  }),
  "Fondamentaux OSINT": (q, wrong, correct) => ({
    category: "OSINT — Méthodologie",
    error: `Sur la méthodologie OSINT, l'expert a indiqué "${wrong}" alors que "${correct}".`,
    consequence: "Une erreur de méthode OSINT (corroboration insuffisante, cloisonnement absent) expose les conclusions à une contestation sur la fiabilité des sources.",
    severity: "SIGNIFICATIVE",
  }),
  "Réseau, protocoles et Internet": (q, wrong, correct) => ({
    category: "Forensique réseau",
    error: `Concernant les protocoles réseau, l'expert a conclu "${wrong}" alors que "${correct}" est correct.`,
    consequence: "Confondre les couches OSI, les flags TCP ou les mécanismes DNS fragilise l'attribution de l'action à un équipement ou à une personne.",
    severity: "SIGNIFICATIVE",
  }),
  "_default": (q, wrong, correct) => ({
    category: q.chapter || "Analyse forensique",
    error: `L'expert a répondu "${wrong}" à la question relative à ${q.chapter || "ce domaine"}, alors que la réponse exacte est "${correct}".`,
    consequence: "Cette erreur technique peut être exploitée par un expert contradicteur pour affaiblir la crédibilité globale du rapport d'expertise.",
    severity: "SIGNIFICATIVE",
  }),
};

function getSeverityColor(severity) {
  if (severity === "CRITIQUE") return "#ff4060";
  if (severity === "MAJEURE") return "#f0883e";
  return "#f0c040";
}

function generateExpertReport() {
  const wrong = EX.answers.filter(a => !a.ok);
  const correct = EX.answers.filter(a => a.ok);
  const pct = Math.round(EX.answers.filter(a=>a.ok).length / EX.answers.length * 100);
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-CH', {day:'2-digit',month:'long',year:'numeric'});
  const refNum = 'EXP-' + now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + Math.floor(Math.random()*9000+1000);
  
  // Générer les erreurs
  const errors = wrong.map((a, i) => {
    const tmpl = FORENSIC_ERROR_TEMPLATES[a.q.chapter] || FORENSIC_ERROR_TEMPLATES["_default"];
    const wrongText = a.sel.map(s => a.q.opts[s]).join(', ') || '(sans réponse)';
    const correctText = a.ans.map(s => a.q.opts[s]).join(', ');
    return { ...tmpl(a.q, wrongText, correctText), num: i+1, chapter: a.q.chapter, question: a.q.q };
  });
  
  const noteNum = pct >= 85 ? 6 : pct >= 70 ? 5 : pct >= 60 ? 4 : pct >= 50 ? 3 : pct >= 30 ? 2 : 1;
  const noteColor = noteNum >= 5 ? '#30e88a' : noteNum >= 4 ? '#f0c040' : '#ff4060';
  
  const criticCount = errors.filter(e => e.severity === 'CRITIQUE').length;
  const majorCount = errors.filter(e => e.severity === 'MAJEURE').length;
  
  const reportHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport d'expertise — ${refNum}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap');
  :root { --red:#cc2233; --gold:#b8860b; --green:#1a7a3a; --text:var(--bg); --muted:var(--dim); --border:#ccc; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'IBM Plex Serif',Georgia,serif; color:var(--text); background:#f8f7f3; font-size:11pt; line-height:1.6; }
  .page { max-width:800px; margin:0 auto; background:var(--text); box-shadow:0 2px 20px rgba(0,0,0,.1); }
  
  /* EN-TÊTE */
  .page-header { padding:28px 48px 20px; border-bottom:3px solid var(--text); position:relative; }
  .header-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
  .logo-block { font-family:'IBM Plex Mono',monospace; }
  .logo-main { font-size:22pt; font-weight:600; letter-spacing:-1px; color:var(--text); }
  .logo-sub { font-size:8pt; color:var(--muted); letter-spacing:.1em; text-transform:uppercase; margin-top:2px; }
  .ref-block { text-align:right; font-family:'IBM Plex Mono',monospace; font-size:8pt; color:var(--muted); }
  .doc-title { font-size:15pt; font-weight:600; letter-spacing:.05em; text-transform:uppercase; text-align:center; color:var(--text); margin:10px 0 4px; }
  .doc-subtitle { text-align:center; font-size:9pt; color:var(--muted); font-style:italic; }
  
  /* CORPS */
  .page-body { padding:28px 48px; }
  
  /* FICHE RÉSUMÉ */
  .summary-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; border:1px solid var(--border); margin:16px 0; }
  .sg-row { display:contents; }
  .sg-label { padding:7px 14px; font-size:9pt; color:var(--muted); text-transform:uppercase; letter-spacing:.07em; border-bottom:1px solid var(--border); background:#f9f9f9; border-right:1px solid var(--border); }
  .sg-value { padding:7px 14px; font-size:10pt; border-bottom:1px solid var(--border); }
  .sg-row:last-child .sg-label, .sg-row:last-child .sg-value { border-bottom:none; }
  
  /* NOTE */
  .grade-block { display:flex; align-items:center; justify-content:center; gap:24px; padding:18px; border:2px solid; border-radius:4px; margin:16px 0; }
  .grade-num { font-family:'IBM Plex Mono',monospace; font-size:42pt; font-weight:600; line-height:1; }
  .grade-label { font-size:10pt; line-height:1.5; }
  
  /* ERREURS */
  .section-title { font-size:11pt; font-weight:600; text-transform:uppercase; letter-spacing:.08em; border-bottom:2px solid var(--text); padding-bottom:4px; margin:20px 0 12px; }
  .error-item { border:1px solid var(--border); border-left:4px solid; border-radius:2px; padding:12px 14px; margin-bottom:12px; }
  .error-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
  .error-num { font-family:'IBM Plex Mono',monospace; font-size:8pt; color:var(--muted); }
  .error-category { font-size:8pt; font-weight:600; text-transform:uppercase; letter-spacing:.08em; padding:2px 8px; border-radius:2px; }
  .error-severity { font-family:'IBM Plex Mono',monospace; font-size:7.5pt; font-weight:600; padding:2px 6px; border:1px solid; border-radius:2px; }
  .error-question { font-size:8.5pt; color:var(--muted); font-style:italic; margin-bottom:8px; border-left:2px solid #ddd; padding-left:8px; }
  .error-text { font-size:10pt; margin-bottom:8px; }
  .error-consequence { font-size:9pt; color:var(--muted); padding:8px 10px; background:#f9f9f9; border-radius:2px; border-left:3px solid #ccc; }
  .error-consequence strong { color:var(--text); }
  
  /* CONCLUSION */
  .conclusion-box { padding:14px; background:#f5f5f5; border:1px solid var(--border); margin-top:16px; font-size:9.5pt; line-height:1.65; }
  .conclusion-box h3 { font-size:10pt; text-transform:uppercase; letter-spacing:.07em; margin-bottom:8px; }
  
  /* SIGNATURE */
  .signature-block { margin-top:28px; padding-top:16px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:flex-end; font-size:9pt; color:var(--muted); }
  
  /* PIED DE PAGE */
  .page-footer { padding:10px 48px; border-top:1px solid var(--border); display:flex; justify-content:space-between; font-size:7.5pt; color:var(--muted); font-family:'IBM Plex Mono',monospace; }
  
  /* PRINT */
  @media print {
    body { background:var(--text); }
    .page { box-shadow:none; max-width:100%; }
    .no-print { display:none !important; }
    .error-item { break-inside:avoid; }
  }
  .no-print { display:flex; justify-content:center; gap:12px; padding:16px; background:#f0f0f0; border-top:1px solid var(--border); }
  .btn-print { padding:8px 24px; background:var(--bg); color:var(--text); border:none; border-radius:4px; font-size:10pt; cursor:pointer; font-family:'IBM Plex Mono',monospace; }
  .btn-close-r { padding:8px 24px; background:transparent; color:var(--dim); border:1px solid #ccc; border-radius:4px; font-size:10pt; cursor:pointer; font-family:'IBM Plex Mono',monospace; }
</style>
</head>
<body>
<div class="no-print">
  <button type="button" class="btn-print" onclick="window.print()">🖨 Imprimer / Enregistrer en PDF</button>
  <button type="button" class="btn-close-r" onclick="window.close()">✕ Fermer</button>
</div>
<div class="page">

  <!-- EN-TÊTE -->
  <div class="page-header">
    <div class="header-top">
      <div class="logo-block">
        <div class="logo-main">CAS-IN</div>
        <div class="logo-sub">Forensique numérique · Simulation judiciaire</div>
      </div>
      <div class="ref-block">
        Réf. : ${refNum}<br>
        Date : ${dateStr}<br>
        Confidentiel — usage pédagogique
      </div>
    </div>
    <div class="doc-title">Rapport d'expertise judiciaire</div>
    <div class="doc-subtitle">Document simulé à des fins de formation — ne constitue pas un acte judiciaire</div>
  </div>

  <!-- CORPS -->
  <div class="page-body">

    <!-- Fiche résumé -->
    <div class="section-title">I. Identification du mandat</div>
    <div class="summary-grid">
      <div class="sg-row"><div class="sg-label">Mandant simulé</div><div class="sg-value">Tribunal pénal fédéral — Bellinzone (fictif)</div></div>
      <div class="sg-row"><div class="sg-label">Expert désigné</div><div class="sg-value">Analyste CAS-IN — Simulation de formation</div></div>
      <div class="sg-row"><div class="sg-label">Mission</div><div class="sg-value">Analyse forensique d'un support numérique · Avis d'expert</div></div>
      <div class="sg-row"><div class="sg-label">Questions posées</div><div class="sg-value">${EX.answers.length} questions d'évaluation de compétences</div></div>
      <div class="sg-row"><div class="sg-label">Base normative</div><div class="sg-value">ISO/IEC 27037 · NIST SP 800-86 · CPP suisse (RS 312.0)</div></div>
    </div>

    <!-- Note globale -->
    <div class="section-title">II. Évaluation globale</div>
    <div class="grade-block" style="border-color:${noteColor}20;background:${noteColor}08">
      <div class="grade-num" style="color:${noteColor}">${noteNum}<span style="font-size:22pt;color:#888">/6</span></div>
      <div class="grade-label">
        <strong>${pct}% de réponses correctes</strong><br>
        ${correct.length} / ${EX.answers.length} questions exactes<br>
        ${criticCount} erreur(s) <strong style="color:#cc2233">CRITIQUE</strong> · ${majorCount} <strong style="color:#b8860b">MAJEURE</strong> · ${errors.length - criticCount - majorCount} <strong style="color:#b8860b">SIGNIFICATIVE</strong>
      </div>
    </div>

    ${errors.length === 0 ? `
    <div class="conclusion-box" style="border-left:4px solid #1a7a3a;background:#f0fff4">
      <h3 style="color:#1a7a3a">Aucune erreur relevée</h3>
      L'expert a répondu correctement à l'ensemble des questions soumises. Le rapport ne présente aucune vulnérabilité méthodologique identifiable sur la base de cette évaluation.
    </div>` : `

    <!-- Erreurs -->
    <div class="section-title" style="page-break-before:auto">III. Erreurs méthodologiques relevées</div>
    <p style="font-size:9pt;color:var(--dim);margin-bottom:14px;font-style:italic">Les points suivants constituent des lacunes ou erreurs susceptibles d'être soulevées lors d'une confrontation d'experts ou d'une mise en cause de la qualité du rapport.</p>
    
    ${errors.map(err => `
    <div class="error-item" style="border-left-color:${getSeverityColor(err.severity)}">
      <div class="error-header">
        <span class="error-num">Erreur n° ${err.num} — ${err.chapter}</span>
        <span class="error-severity" style="color:${getSeverityColor(err.severity)};border-color:${getSeverityColor(err.severity)}40">${err.severity}</span>
      </div>
      <div class="error-question">« ${err.question.replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0,200)}${err.question.length>200?'…':''} »</div>
      <div class="error-text">${err.error}</div>
      <div class="error-consequence"><strong>Risque :</strong> ${err.consequence}</div>
    </div>`).join('')}
    `}

    <!-- Conclusion -->
    <div class="section-title">IV. Conclusions et recommandations</div>
    <div class="conclusion-box">
      <h3>Avis de l'évaluateur</h3>
      ${noteNum >= 5 ? `
      L'expert démontre une maîtrise solide des techniques forensiques numériques. Les quelques imprécisions relevées n'affectent pas substantiellement la crédibilité globale du rapport. <strong>Compétences jugées suffisantes</strong> pour intervenir dans une procédure pénale sous réserve des précisions indiquées.
      ` : noteNum >= 4 ? `
      L'expert présente un niveau de compétence satisfaisant avec des lacunes ponctuelles. Les erreurs identifiées sont rectifiables par une révision ciblée des domaines concernés. <strong>Rapport acceptable</strong> avec recommandation de vérification des points signalés avant dépôt auprès du tribunal.
      ` : noteNum >= 3 ? `
      Des lacunes significatives ont été identifiées dans plusieurs domaines clés. Le rapport, tel que simulé, comporterait des vulnérabilités exploitables par la défense. <strong>Complément de formation recommandé</strong> avant toute intervention judiciaire.
      ` : `
      Des erreurs critiques ont été identifiées dans des domaines fondamentaux (procédure, intégrité des preuves, protocole d'acquisition). En l'état, ce rapport serait susceptible d'être écarté lors d'une confrontation d'experts. <strong>Formation complémentaire nécessaire</strong> avant toute mission forensique.
      `}
    </div>

    <!-- Signature -->
    <div class="signature-block">
      <div>CAS-IN · Simulation pédagogique<br>Quiz forensique numérique</div>
      <div style="text-align:right">
        <div style="width:160px;border-bottom:1px solid #999;margin-bottom:4px"></div>
        Expert simulé<br>${dateStr}
      </div>
    </div>

  </div><!-- /page-body -->
  
  <div class="page-footer">
    <span>${refNum}</span>
    <span>Document pédagogique — usage interne CAS-IN</span>
    <span>${dateStr}</span>
  </div>

</div><!-- /page -->
</body>
</html>`;

  const blob = new Blob([reportHTML], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ═══════════════════════════════════════════════════════════════
// NIVEAU 4B — MISSION COMPLÈTE (30 questions / 6 phases)
// ═══════════════════════════════════════════════════════════════

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

let missionState = {
  active: false,
  phaseIdx: 0,
  phaseAnswers: [], // answers per phase: [{q, ok}]
  allAnswers: [],
  pool: [],         // all 30 questions
  qi: 0,
  beaten: new Set(JSON.parse(localStorage.getItem('missionBeaten') || '[]')),
};

function openMission() {
  document.getElementById('mission-overlay').style.display = 'flex';
  // Build preview
  const prev = document.getElementById('mission-phases-preview');
  prev.innerHTML = MISSION_PHASES.map(p => `
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px;text-align:center">
      <div style="font-size:22px">${p.icon}</div>
      <div style="font-size:9px;font-weight:600;color:${p.color};margin-top:3px;text-transform:uppercase;letter-spacing:.05em">Phase ${p.num}</div>
      <div style="font-size:10px;color:var(--text);margin-top:2px;line-height:1.3">${p.title}</div>
    </div>`).join('');
}

function closeMissionIntro() {
  document.getElementById('mission-overlay').style.display = 'none';
}

function startMission() {
  document.getElementById('mission-overlay').style.display = 'none';
  
  // Construire le pool de 30 questions (5 par phase)
  const pool = [];
  MISSION_PHASES.forEach((phase, pi) => {
    const candidates = ALL_Q.map((q,i) => ({q,i}))
      .filter(x => phase.chapters.includes(x.q.chapter));
    const seed = pi * 37 + new Date().getDate();
    const picked = shuffle([...candidates]).slice(0, phase.questions_per_phase);
    pool.push(...picked.map(x => ({ q: x.q, idx: x.i, phaseIdx: pi })));
  });
  
  missionState = {
    ...missionState,
    active: true,
    phaseIdx: 0,
    phaseAnswers: MISSION_PHASES.map(() => []),
    allAnswers: [],
    pool,
    qi: 0,
  };
  
  S.mode = 'mission';
  S.pool = pool.map(x => ({q: x.q, idx: x.idx}));
  S.pi = 0;
  
  showMissionPhaseTransition(0, () => {
    renderQuestion(S.pool[0]);
  });
}

function showMissionPhaseTransition(phaseIdx, callback) {
  const phase = MISSION_PHASES[phaseIdx];
  const overlay = document.getElementById('mission-phase-overlay');
  
  document.getElementById('mp-icon').textContent = phase.icon;
  document.getElementById('mp-phase').textContent = `Phase ${phase.num} sur ${MISSION_PHASES.length}`;
  document.getElementById('mp-title').style.color = phase.color;
  document.getElementById('mp-title').textContent = phase.title;
  document.getElementById('mp-desc').textContent = phase.desc;
  
  const fill = document.getElementById('mp-progress-fill');
  const pct = (phaseIdx / MISSION_PHASES.length) * 100;
  fill.style.width = pct + '%';
  fill.style.background = `linear-gradient(90deg, ${MISSION_PHASES[0].color}, ${phase.color})`;
  
  const btn = document.getElementById('mp-continue');
  btn.textContent = phaseIdx === 0 ? '🚀 Démarrer la mission' : `Phase ${phase.num} — Commencer →`;
  btn.onclick = () => {
    overlay.style.display = 'none';
    if (callback) callback();
  };
  
  overlay.style.display = 'flex';
}

function continueMission() {
  document.getElementById('mission-phase-overlay').style.display = 'none';
  if (S.pi < S.pool.length) renderQuestion(S.pool[S.pi]);
}

// Hook nextQuestion pour la mission
const _mission_orig_nextQ = nextQuestion;
nextQuestion = function() {
  if (!missionState.active || S.mode !== 'mission') {
    _mission_orig_nextQ.apply(this, arguments);
    return;
  }
  
  // Enregistrer la réponse de la phase courante
  if (S.answered) {
    const q = S.curQ;
    const selCorrect = S.selCorrect || new Map();
    const ok = [...selCorrect.values()].filter(Boolean).length === q.answers.length
               && S.sel.size === q.answers.length;
    
    const poolItem = missionState.pool[missionState.qi];
    const phaseIdx = poolItem ? poolItem.phaseIdx : missionState.phaseIdx;
    missionState.phaseAnswers[phaseIdx].push({ q, ok });
    missionState.allAnswers.push({ q, ok, phaseIdx });
    missionState.qi++;
    
    // Fin de phase ?
    const nextItem = missionState.pool[missionState.qi];
    const nextPhase = nextItem ? nextItem.phaseIdx : -1;
    
    if (nextPhase > phaseIdx && nextPhase < MISSION_PHASES.length) {
      missionState.phaseIdx = nextPhase;
      // Transition de phase après un délai pour voir le feedback
      setTimeout(() => {
        _mission_orig_nextQ.apply(this, arguments);
        showMissionPhaseTransition(nextPhase, null);
      }, 1200);
      return;
    }
  }
  
  // Fin de mission ?
  if (S.pi >= S.pool.length) {
    setTimeout(endMission, 1200);
    return;
  }
  
  _mission_orig_nextQ.apply(this, arguments);
};

function endMission() {
  missionState.active = false;
  S.mode = 'normal';
  
  const total = missionState.allAnswers.length;
  const correct = missionState.allAnswers.filter(a => a.ok).length;
  const pct = total > 0 ? Math.round(correct / total * 100) : 0;
  const noteNum = pct >= 85 ? 6 : pct >= 70 ? 5 : pct >= 60 ? 4 : pct >= 50 ? 3 : pct >= 30 ? 2 : 1;
  const noteColor = noteNum >= 5 ? '#30e88a' : noteNum >= 4 ? '#f0c040' : '#ff4060';
  
  const verdicts = {
    6: ["🏆 Mission accomplie avec brio", "Maîtrise exemplaire de tous les domaines forensiques."],
    5: ["🎯 Mission réussie", "Solide expertise forensique — quelques nuances à peaufiner."],
    4: ["✅ Mission acceptable", "Niveau satisfaisant. Certains domaines nécessitent un renforcement."],
    3: ["⚠ Mission partielle", "Lacunes significatives dans plusieurs phases. Révision recommandée."],
    2: ["❌ Mission échouée", "Des erreurs critiques compromettent la valeur probante du travail."],
    1: ["💀 Mission abandonnée", "Niveau insuffisant. Formation approfondie requise avant toute mission réelle."],
  };
  
  addXp(correct * 30 + (noteNum >= 5 ? 200 : 0));
  
  if (noteNum >= 5 && !missionState.beaten.has('mission')) {
    missionState.beaten.add('mission');
    localStorage.setItem('missionBeaten', JSON.stringify([...missionState.beaten]));
  }
  
  // Afficher l'overlay de fin
  const overlay = document.getElementById('mission-end-overlay');
  document.getElementById('me-icon').textContent = verdicts[noteNum][0].split(' ')[0];
  document.getElementById('me-grade').innerHTML = `<span style="color:${noteColor}">${noteNum}</span><span style="font-size:1.5rem;color:var(--dim)">/6</span>`;
  document.getElementById('me-verdict').textContent = verdicts[noteNum][0];
  document.getElementById('me-verdict').style.color = noteColor;
  document.getElementById('me-score').textContent = `${correct}/${total} correctes (${pct}%) · ${verdicts[noteNum][1]}`;
  
  const grid = document.getElementById('me-phases-grid');
  grid.innerHTML = MISSION_PHASES.map((phase, i) => {
    const pa = missionState.phaseAnswers[i] || [];
    const pOk = pa.filter(a => a.ok).length;
    const pTot = pa.length;
    const pPct = pTot ? Math.round(pOk/pTot*100) : 0;
    const col = pPct >= 70 ? '#30e88a' : pPct >= 50 ? '#f0c040' : '#ff4060';
    return `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px;display:flex;gap:8px;align-items:center">
      <span style="font-size:20px">${phase.icon}</span>
      <div style="flex:1">
        <div style="font-size:10px;color:${phase.color};font-weight:600;text-transform:uppercase;letter-spacing:.05em">Phase ${phase.num}</div>
        <div style="font-size:11px;color:var(--text)">${phase.title}</div>
      </div>
      <div style="font-size:16px;font-weight:700;color:${col}">${pPct}%</div>
    </div>`;
  }).join('');
  
  overlay.style.display = 'flex';
  if (noteNum >= 5) spawnParticles(window.innerWidth/2, window.innerHeight/2, true);
}

function closeMissionEnd() {
  document.getElementById('mission-end-overlay').style.display = 'none';
  buildPool();
  renderQuestion(getNext());
}

function generateMissionReport() {
  // Reconstruire EX.answers depuis missionState pour réutiliser generateExpertReport
  const savedAnswers = EX.answers;
  EX.answers = missionState.allAnswers.map(a => ({
    q: { q: a.q.q, chapter: a.q.chapter, opts: a.q.options, expl_ok: a.q.expl_ok, expl_ko: a.q.expl_ko },
    sel: [],
    ans: a.q.answers,
    ok: a.ok,
  }));
  generateExpertReport();
  EX.answers = savedAnswers;
}

// Mode 'mission' dans buildPool — pool géré par startMission
const _mission_orig_buildPool = buildPool;
buildPool = function() {
  if (S.mode === 'mission') return;
  _mission_orig_buildPool.apply(this, arguments);
};



// ── Dropdown Enquête ──
function toggleEnqueteMenu() {
  const menu = document.getElementById('enquete-menu');
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  closeEnqueteMenu();
  if (!isOpen) menu.classList.add('open');
}
function closeEnqueteMenu() {
  const menu = document.getElementById('enquete-menu');
  if (menu) menu.classList.remove('open');
}
// Fermer le dropdown si clic ailleurs
document.addEventListener('click', e => {
  const dd = document.getElementById('enquete-dropdown');
  if (dd && !dd.contains(e.target)) closeEnqueteMenu();
});

// ── Partager intégré dans Bilan ──
let _bilanShareOpen = false;
let _bilanShareDrawn = false;

function toggleBilanShare() {
  const content = document.getElementById('bilan-share-content');
  const label   = document.getElementById('share-toggle-label');
  if (!content) return;
  _bilanShareOpen = !_bilanShareOpen;
  content.style.display = _bilanShareOpen ? 'block' : 'none';
  label.textContent = _bilanShareOpen ? 'Masquer la carte' : 'Générer ma carte de score';
  if (_bilanShareOpen && !_bilanShareDrawn) {
    drawBilanCard();
    _bilanShareDrawn = true;
  }
}

// Reset quand on ferme le bilan
const _orig_closeOverlay = closeOverlay;
closeOverlay = function(id) {
  if (id === 'bilan-overlay') {
    _bilanShareOpen = false;
    _bilanShareDrawn = false;
    const c = document.getElementById('bilan-share-content');
    if (c) c.style.display = 'none';
    const l = document.getElementById('share-toggle-label');
    if (l) l.textContent = 'Générer ma carte de score';
  }
  _orig_closeOverlay.apply(this, arguments);
};

function drawBilanCard() {
  const canvas = document.getElementById('bilan-share-canvas');
  if (!canvas) return;
  const W = 760, H = 420;
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = '100%';
  // Réutiliser la logique de drawShareCard en copiant le canvas share
  drawShareCard && drawShareCard();
  const src = document.getElementById('share-canvas');
  if (src) {
    const ctx = canvas.getContext('2d');
    // petit délai pour laisser drawShareCard terminer
    setTimeout(() => { try { ctx.drawImage(src, 0, 0, W, H); } catch(e) {} }, 200);
  }
}

function downloadBilanCard() {
  drawBilanCard();
  setTimeout(() => {
    const c = document.getElementById('bilan-share-canvas');
    if (!c) return;
    const a = document.createElement('a');
    a.download = 'casin-score.png';
    a.href = c.toDataURL('image/png');
    a.click();
  }, 300);
}

async function copyBilanCard() {
  drawBilanCard();
  setTimeout(async () => {
    const c = document.getElementById('bilan-share-canvas');
    if (!c) return;
    try {
      c.toBlob(async blob => {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('combo-toast', '📋 Image copiée !', 2000);
      });
    } catch(e) { showToast('combo-toast', '⚠ Copie non supportée sur ce navigateur', 2000); }
  }, 300);
}

async function shareBilanCard() {
  drawBilanCard();
  setTimeout(async () => {
    const c = document.getElementById('bilan-share-canvas');
    if (!c) return;
    try {
      c.toBlob(async blob => {
        const file = new File([blob], 'casin-score.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Mon score CAS-IN', text: 'Quiz Investigation Numérique' });
        } else { downloadBilanCard(); }
      });
    } catch(e) { downloadBilanCard(); }
  }, 300);
}
