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

      // ═══════════════════════════════════════════════════════════════
      // LOADING_MSGS — Messages de chargement affichés pendant la
      // préparation d'une session de quiz. Tournent toutes les 1.8s.
      // Ajoutés en v2.64 (correction d'un bug de référence).
      // ═══════════════════════════════════════════════════════════════
      const LOADING_MSGS = [
        '🔍 Analyse des indices…',
        '📂 Ouverture du dossier…',
        '🧪 Calibrage des outils forensiques…',
        '⚖️ Vérification des bases légales…',
        '🔐 Établissement de la chaîne de custody…',
        '📡 Connexion aux serveurs de l\'enquête…',
        '🧬 Préparation des analyses ADN numériques…',
        '🗂 Tri des preuves recueillies…',
        '📜 Lecture des articles du CPP…',
        '🎯 Ciblage des questions pertinentes…',
        '🇨🇭 Connexion aux registres fédéraux…',
        '☕ Café froid prêt, on commence…',
        '📞 Mme Brägger en ligne…',
        '🔬 Sandbox prête, échantillons isolés…',
        '🛰 Satellites OSINT en orbite…',
      ];

      // ═══════════════════════════════════════════════════════════════
      // v2.66 — Constantes restaurées (bugs ReferenceError signalés)
      //   PERSONAS, AVATAR_EMOJIS, FORENSIC_QUOTES, FORENSIC_TIPS,
      //   CHAPTER_TO_THEME_FILE
      // Ces constantes étaient référencées dans quiz-app.js mais jamais
      // définies → ReferenceError en boucle (MutationObserver applyFicheLocks)
      // bloquant le chargement du quiz.
      // ═══════════════════════════════════════════════════════════════

      // PERSONAS — profils de difficulté préconfigurés (boutons rapides)
      const PERSONAS = [
        {
          icon: '🌱', label: 'Débutant',
          desc: 'Questions niveau 1 uniquement, démarrer doucement',
          diffs: ['1']
        },
        {
          icon: '📚', label: 'Apprenti',
          desc: 'Niveaux 1 et 2, consolidation des bases',
          diffs: ['1', '2']
        },
        {
          icon: '🎯', label: 'Confirmé',
          desc: 'Niveaux 2 et 3, montée en compétence',
          diffs: ['2', '3']
        },
        {
          icon: '🔥', label: 'Expert',
          desc: 'Niveaux 3 et 4, défi sérieux',
          diffs: ['3', '4']
        },
        {
          icon: '🏆', label: 'Tout',
          desc: 'Tous les niveaux, mix complet',
          diffs: ['1', '2', '3', '4']
        },
      ];

      // AVATAR_EMOJIS — émojis sélectionnables comme avatar utilisateur
      const AVATAR_EMOJIS = [
        '🕵️', '🕵️‍♀️', '🔍', '🧠', '🎯', '⚖️', '🛡', '🔐',
        '👮', '👮‍♀️', '👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🔬', '👩‍🔬', '🧙',
        '🦊', '🦉', '🐺', '🐯', '🐉', '🦅', '🦈', '🐙',
        '⚡', '🔥', '💎', '🌟', '⭐', '✨', '🎖', '🏆',
      ];

      // FORENSIC_QUOTES — citations affichées sur la landing/quiz
      // (rotation déterministe par jour via getDailySeed)
      const FORENSIC_QUOTES = [
        { q: "Toute trace est une histoire. Toute absence en est une aussi.", a: "Edmond Locard (1877-1966), pionnier de la criminalistique" },
        { q: "L'évidence est l'ennemi du raisonnement.", a: "Sherlock Holmes" },
        { q: "Quand vous avez éliminé l'impossible, ce qui reste, si improbable soit-il, est la vérité.", a: "Arthur Conan Doyle" },
        { q: "Un seul indice mal collecté peut faire écrouler une enquête entière.", a: "Doctrine forensique ISO/IEC 27037" },
        { q: "La chaîne de custody n'est pas une formalité, c'est la colonne vertébrale de la preuve.", a: "Pratique judiciaire suisse" },
        { q: "Le doute profite à l'accusé. Mais la rigueur profite à tous.", a: "Adage du droit pénal" },
        { q: "On ne conteste pas un hash MD5. On l'utilise comme empreinte.", a: "Manuel forensique" },
        { q: "Tout système informatique laisse des traces. Le défi est de savoir où regarder.", a: "Brian Carrier, créateur du Sleuth Kit" },
        { q: "La RAM oublie. Mais avant qu'elle ne le fasse, capturez-la.", a: "Doctrine analyse de mémoire vive" },
        { q: "Les métadonnées sont les bavardages des fichiers.", a: "Adage OSINT" },
        { q: "Un suspect ne sait jamais ce que son téléphone a déjà raconté.", a: "Pratique mobile forensique" },
        { q: "L'art de l'investigation, c'est de poser la bonne question, pas d'avoir toutes les réponses.", a: "Maxime de l'enquête criminelle" },
        { q: "La cybersécurité commence par savoir ce qu'on protège.", a: "Doctrine NIST CSF" },
        { q: "Un mot de passe partagé est un mot de passe perdu.", a: "Pratique sécurité" },
        { q: "L'attaquant ne se repose jamais. Le défenseur a le luxe du sommeil — mais pas tous les jours.", a: "Adage SOC" },
      ];

      // FORENSIC_TIPS — astuces affichées en bas de questions (random)
      const FORENSIC_TIPS = [
        "💡 Hash SHA-256 = 64 caractères hex. Hash MD5 = 32. À l'œil seul.",
        "💡 NTFS = Windows. EXT = Linux. APFS = macOS. HFS+ = ancien macOS.",
        "💡 La pratique CH n'utilise plus MD5 seul depuis 2018 — toujours coupler SHA-256.",
        "💡 Art. 248 CPP : mise sous scellés sur demande, TMC tranche dans les 20 jours.",
        "💡 ISO 27037 : 4 phases — identification, collecte, acquisition, préservation.",
        "💡 RAM volatile = capture en priorité absolue avant tout autre acte.",
        "💡 Une image dd est bit-à-bit. Une copie 'normale' ne l'est PAS.",
        "💡 Les write-blockers existent en hardware ET software. Préférez le hardware.",
        "💡 EXIF : métadonnées photos. Garde GPS, appareil, heure. Souvent retiré sur réseaux sociaux.",
        "💡 Wireshark filtre 'tcp.flags.syn==1' = vues sur les ouvertures de connexion TCP.",
        "💡 Volatility = analyse de RAM. Plugins selon profile OS.",
        "💡 Tor : 3 nœuds de relais. L'IP de sortie n'est pas l'IP d'origine.",
        "💡 BIP-39 : 12 ou 24 mots = clé privée Bitcoin. Toute personne avec les mots possède les fonds.",
        "💡 LPD 2023 art. 24 : notification PFPDT \"dans les meilleurs délais\" si risque élevé.",
        "💡 MROS : seul destinataire des communications LBA en Suisse.",
        "💡 Art. 269 CPP : surveillance des télécommunications nécessite autorisation TMC dans les 24h.",
        "💡 OSINT licite ≠ OSINT discret. La traçabilité fait la valeur judiciaire.",
        "💡 MITRE ATT&CK : référentiel TTPs adversaires. T1566 = phishing.",
        "💡 Article 143bis CP : accès indu à un système (hacking sans extraction).",
        "💡 Article 144bis CP : détérioration de données (ransomware, defacement).",
      ];

      // CHAPTER_TO_THEME_FILE — mapping chapitre quiz → fiche associée
      // Utilisé pour le déblocage des fiches après progression dans le quiz
      // (isFicheUnlocked, applyFicheLocks dans quiz-app.js).
      const CHAPTER_TO_THEME_FILE = {
        // Filesystems
        'NTFS': 'fiches/ntfs.html',
        'FAT12 / FAT16 / FAT32': 'fiches/fat32.html',
        'exFAT': 'fiches/exfat.html',
        'EXT2 / EXT3 / EXT4': 'fiches/ext.html',
        'HFS+ et APFS': 'fiches/apfs.html',
        // Acquisition / méthodologie
        'Acquisition et préservation': 'fiches/acquisition.html',
        'Méthodologie et bonnes pratiques': 'fiches/methodologie.html',
        'Méthodologie forensique': 'fiches/methodologie.html',
        'Techniques et méthodologie': 'fiches/methodologie.html',
        'Analyse et recovery': 'fiches/data_carving.html',
        'Artefacts temporels et MAC times': 'fiches/mac_times.html',
        'Formats de fichiers et Magic Bytes': 'fiches/formats.html',
        'Logiciels et outils forensiques': 'fiches/outils.html',
        'Technologie des disques': 'fiches/disques.html',
        // Crypto
        'Chiffrement asymétrique et RSA': 'fiches/crypto.html',
        'Chiffrement symétrique': 'fiches/crypto.html',
        'Hachage et intégrité': 'fiches/hash.html',
        'Cassage et attaques': 'fiches/cassage_mdp.html',
        'PKI et certificats': 'fiches/pki_certificats.html',
        // OS-spécifiques
        'Windows — Artefacts et exécution': 'fiches/windows_forensique.html',
        'Windows — Journaux et Event Logs': 'fiches/logs_windows.html',
        'Windows — Registre et artefacts': 'fiches/registre_windows.html',
        'Linux — Artefacts et analyse': 'fiches/linux_forensique.html',
        'macOS — Artefacts et analyse': 'fiches/macos_forensique.html',
        // Réseau / OSINT
        'Adressage IP': 'fiches/reseau.html',
        'Réseau, protocoles et Internet': 'fiches/reseau.html',
        'Infrastructure, DNS et pivots': 'fiches/dns_forensique.html',
        'Fondamentaux OSINT': 'fiches/osint.html',
        'Outils et automatisation OSINT': 'fiches/osint.html',
        'Recherche web et Google Dorks': 'fiches/osint.html',
        // Données / représentation
        'Représentation des données': 'fiches/encodage.html',
        'Métadonnées et EXIF': 'fiches/metadata_avancees.html',
        // Droit
        'Droit pénal informatique': 'fiches/droit.html',
        'Procédure pénale': 'fiches/preuve.html',
        'Perquisition de documents': 'fiches/preuve.html',
        'Séquestre informatique': 'fiches/preuve.html',
        'Entraide judiciaire internationale': 'fiches/eimp_entraide.html',
        'Expertise et rapport judiciaire': 'fiches/rapport_forensique.html',
        // Spécial
        'ICS / SCADA / OT Forensique': 'fiches/ics_forensique.html',
      };

      // ═══════════════════════════════════════════════════════════════
      // v2.67 — Encore 7 constantes restaurées (audit exhaustif)
      // KONAMI, FEEDBACK_OK, FEEDBACK_KO, MILESTONES, CHEATSHEETS,
      // MID_TIPS, VISUAL_THEMES — toutes référencées dans quiz-app.js
      // sans définition. Source des bugs ReferenceError persistants.
      // ═══════════════════════════════════════════════════════════════

      // KONAMI — Code Konami (séquence ↑↑↓↓←→←→BA) pour activer God Mode
      const KONAMI = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'b', 'a'
      ];

      // FEEDBACK_OK / FEEDBACK_KO — messages affichés après une question
      // Le ! est remplacé par le nom d'avatar via .replace('!', ` ${name}!`)
      const FEEDBACK_OK = [
        '✓ Excellent !',
        '✓ Bravo !',
        '✓ Parfait !',
        '✓ Bien vu !',
        '✓ Sans hésitation !',
        '✓ Magistral !',
        '✓ Tu maîtrises !',
        '✓ Bonne pioche !',
        '✓ Vu d\'œil !',
        '✓ Pile poil !',
        '✓ Net et précis !',
        '✓ Le réflexe !',
      ];

      const FEEDBACK_KO = [
        '✗ Pas tout à fait',
        '✗ Raté',
        '✗ À revoir',
        '✗ Mauvaise piste',
        '✗ Hop, on note pour plus tard',
        '✗ Dommage',
        '✗ Pas cette fois',
        '✗ La logique est ailleurs',
      ];

      // MILESTONES — paliers d'accomplissement (XP / streak / précision)
      // Format : { id, label, icon, rankMin? OU minQ+minAcc OU streakOnly+minStreak }
      const MILESTONES = [
        { id: 'first_q',     label: '1ère question',         icon: '🎯', minQ: 1,   minAcc: 0   },
        { id: 'q_50',        label: '50 questions',          icon: '📚', minQ: 50,  minAcc: 0   },
        { id: 'q_200',       label: '200 questions',         icon: '📖', minQ: 200, minAcc: 0   },
        { id: 'q_500',       label: '500 questions',         icon: '🎓', minQ: 500, minAcc: 0   },
        { id: 'q_1000',      label: '1000 questions',        icon: '🏆', minQ: 1000,minAcc: 0   },
        { id: 'acc_70',      label: '70% précision (>50q)',  icon: '🎯', minQ: 50,  minAcc: 70  },
        { id: 'acc_85',      label: '85% précision (>100q)', icon: '🔬', minQ: 100, minAcc: 85  },
        { id: 'streak_10',   label: 'Streak ×10',            icon: '🔥', streakOnly: true, minStreak: 10 },
        { id: 'streak_25',   label: 'Streak ×25',            icon: '💥', streakOnly: true, minStreak: 25 },
        { id: 'streak_50',   label: 'Streak ×50',            icon: '🌋', streakOnly: true, minStreak: 50 },
        { id: 'rank_3',      label: 'Rang 3 atteint',        icon: '🥉', rankMin: 3 },
        { id: 'rank_5',      label: 'Rang 5 atteint',        icon: '🥈', rankMin: 5 },
        { id: 'rank_8',      label: 'Rang 8 atteint',        icon: '🥇', rankMin: 8 },
        { id: 'rank_12',     label: 'Rang 12 atteint',       icon: '👑', rankMin: 12 },
        { id: 'rank_max',    label: 'Légende',               icon: '🌟', rankMin: 14 },
      ];

      // CHEATSHEETS — données fiches affichées dans le panneau (renderFiche)
      // Format : { [chapter]: { icon, ...autres champs si présents } }
      // En pratique le code utilise surtout .icon, le reste vient du HTML de la fiche.
      // Mapping minimal pour ne pas casser : fournit l'icône de chaque chapitre.
      const CHEATSHEETS = {
        // Filesystems
        'NTFS':                              { icon: '🪟' },
        'FAT12 / FAT16 / FAT32':             { icon: '💾' },
        'exFAT':                             { icon: '💾' },
        'EXT2 / EXT3 / EXT4':                { icon: '🐧' },
        'HFS+ et APFS':                      { icon: '🍎' },
        // Acquisition / méthodologie
        'Acquisition et préservation':       { icon: '📥' },
        'Méthodologie et bonnes pratiques':  { icon: '🧭' },
        'Méthodologie forensique':           { icon: '🧭' },
        'Techniques et méthodologie':        { icon: '🛠' },
        'Analyse et recovery':               { icon: '🔬' },
        'Artefacts temporels et MAC times':  { icon: '⏱' },
        'Formats de fichiers et Magic Bytes':{ icon: '📁' },
        'Logiciels et outils forensiques':   { icon: '🛠' },
        'Technologie des disques':           { icon: '💽' },
        // Crypto
        'Chiffrement asymétrique et RSA':    { icon: '🔐' },
        'Chiffrement symétrique':            { icon: '🔑' },
        'Hachage et intégrité':              { icon: '🔢' },
        'Cassage et attaques':               { icon: '⚔️' },
        'PKI et certificats':                { icon: '📜' },
        // OS-spécifiques
        'Windows — Artefacts et exécution':  { icon: '🪟' },
        'Windows — Journaux et Event Logs':  { icon: '📋' },
        'Windows — Registre et artefacts':   { icon: '📒' },
        'Linux — Artefacts et analyse':      { icon: '🐧' },
        'macOS — Artefacts et analyse':      { icon: '🍎' },
        // Réseau / OSINT
        'Adressage IP':                      { icon: '🌐' },
        'Réseau, protocoles et Internet':    { icon: '🌐' },
        'Infrastructure, DNS et pivots':     { icon: '🛰' },
        'Fondamentaux OSINT':                { icon: '🔭' },
        'Outils et automatisation OSINT':    { icon: '🤖' },
        'Recherche web et Google Dorks':     { icon: '🔍' },
        // Données / représentation
        'Représentation des données':        { icon: '🔢' },
        'Métadonnées et EXIF':               { icon: '🏷' },
        // Droit
        'Droit pénal informatique':          { icon: '⚖️' },
        'Procédure pénale':                  { icon: '📜' },
        'Perquisition de documents':         { icon: '📂' },
        'Séquestre informatique':            { icon: '🔒' },
        'Entraide judiciaire internationale':{ icon: '🌍' },
        'Expertise et rapport judiciaire':   { icon: '📑' },
        // Spécial
        'ICS / SCADA / OT Forensique':       { icon: '⚙️' },
      };

      // MID_TIPS — conseil affiché en bilan de session pour chaque thème faible
      const MID_TIPS = {
        'Système de fichiers': 'Reprends les structures NTFS, FAT, EXT et leurs métadonnées (MFT, $LogFile, MAC times).',
        'Acquisition et analyse': 'Révise ISO 27037 et les outils standards : dd, FTK Imager, write-blockers, hashs SHA-256.',
        'Spécificité des OS': 'Concentre-toi sur les artefacts spécifiques OS : Registre Windows, plist macOS, syslog Linux.',
        'Informatique de base': 'Solidifie les fondamentaux : encodage, structures de données, hexadécimal, binaire.',
        'Droit': 'Relis les articles clés du CPP (244-263), CP (143-147bis, 305bis), LPD 2023.',
        'Cryptologie': 'Différencie symétrique (AES) / asymétrique (RSA) / hash (SHA-256), et leurs cas d\'usage.',
        'OSINT': 'Pratique les Google Dorks, les analyses DNS, les outils Maltego/Shodan/Censys.',
        'Forensique': 'Méthodologie d\'investigation : timeline, chaîne de custody, rapport d\'expertise.',
      };

      // VISUAL_THEMES — thèmes visuels sélectionnables (palette couleurs)
      // Format : { id, label, icon, minXp? }
      const VISUAL_THEMES = [
        { id: 'default',    label: 'Forensique',    icon: '🔍', minXp: 0     },
        { id: 'matrix',     label: 'Matrix',        icon: '💚', minXp: 250   },
        { id: 'noir',       label: 'Film noir',     icon: '🎬', minXp: 500   },
        { id: 'helvetia',   label: 'Helvetia',      icon: '🇨🇭', minXp: 1000  },
        { id: 'neon',       label: 'Néon',          icon: '🌃', minXp: 2000  },
        { id: 'midnight',   label: 'Minuit',        icon: '🌙', minXp: 4000  },
      ];

      // ═══════════════════════════════════════════════════════════════
      // v2.68 — GLOSSARY (tooltips quiz)
      // Format différent du GLOSSARY de scene-app.js : { term: {full, def} }
      // Affiche un tooltip quand on survole le terme dans le feedback quiz.
      // Liste limitée aux termes vraiment techniques utilisés en feedback.
      // ═══════════════════════════════════════════════════════════════
      const GLOSSARY = {
        'MFT':       { full: 'Master File Table',         def: 'Index NTFS contenant les métadonnées de tous les fichiers du volume.' },
        'NTFS':      { full: 'New Technology File System', def: 'Système de fichiers Windows depuis NT 3.1 (1993). Métadonnées riches.' },
        'FAT32':     { full: 'File Allocation Table 32',  def: 'Système de fichiers ancien (1996). Limite : 4 GB par fichier.' },
        'exFAT':     { full: 'Extended File Allocation Table', def: 'Évolution FAT pour clés USB et SD modernes (>4 GB).' },
        'EXT4':      { full: 'Fourth Extended Filesystem', def: 'Système de fichiers Linux par défaut depuis 2008.' },
        'APFS':      { full: 'Apple File System',         def: 'Système de fichiers macOS/iOS depuis 2017. Snapshots, chiffrement natif.' },
        'HFS+':      { full: 'Hierarchical File System Plus', def: 'Ancien système de fichiers Apple, remplacé par APFS.' },
        'SHA-256':   { full: 'Secure Hash Algorithm 256', def: 'Fonction de hachage cryptographique. 64 caractères hex.' },
        'MD5':       { full: 'Message Digest 5',           def: 'Hash 32 caractères hex. Considéré faible depuis ~2005, ne jamais utiliser seul.' },
        'SHA-1':     { full: 'Secure Hash Algorithm 1',   def: 'Hash 40 caractères hex. Collisions trouvées en 2017, déconseillé.' },
        'AES':       { full: 'Advanced Encryption Standard', def: 'Standard chiffrement symétrique. AES-256 = niveau actuel recommandé.' },
        'RSA':       { full: 'Rivest-Shamir-Adleman',     def: 'Algorithme chiffrement asymétrique. Clés 2048 bits minimum aujourd\'hui.' },
        'TLS':       { full: 'Transport Layer Security',  def: 'Protocole de chiffrement des communications (HTTPS). TLS 1.3 actuel.' },
        'PKI':       { full: 'Public Key Infrastructure', def: 'Infrastructure à clés publiques : autorités de certification, certificats X.509.' },
        'DNS':       { full: 'Domain Name System',         def: 'Système de résolution de noms de domaine en adresses IP.' },
        'IP':        { full: 'Internet Protocol',          def: 'Protocole d\'adressage Internet. IPv4 (32 bits) ou IPv6 (128 bits).' },
        'TCP':       { full: 'Transmission Control Protocol', def: 'Protocole de transport fiable, orienté connexion (3-way handshake).' },
        'UDP':       { full: 'User Datagram Protocol',    def: 'Protocole de transport sans connexion, plus rapide mais non fiable.' },
        'HTTP':      { full: 'HyperText Transfer Protocol', def: 'Protocole web non chiffré. Toujours préférer HTTPS.' },
        'HTTPS':     { full: 'HTTP Secure',                 def: 'HTTP sur TLS. Chiffre les communications client-serveur.' },
        'VPN':       { full: 'Virtual Private Network',   def: 'Tunnel chiffré masquant l\'adresse IP source.' },
        'Tor':       { full: 'The Onion Router',          def: 'Réseau d\'anonymisation par routage en oignon (3 nœuds relais).' },
        'OSINT':     { full: 'Open Source Intelligence',  def: 'Renseignement obtenu à partir de sources publiquement accessibles.' },
        'CPP':       { full: 'Code de procédure pénale',  def: 'RS 312.0 — règles uniformes de procédure pénale en CH.' },
        'CP':        { full: 'Code pénal',                 def: 'RS 311.0 — sanctions et infractions pénales en CH.' },
        'LPD':       { full: 'Loi sur la protection des données', def: 'RS 235.1 — version 2023 totalement révisée.' },
        'RGPD':      { full: 'Règlement général sur la protection des données', def: 'UE 2016/679, applicable depuis 2018.' },
        'EIMP':      { full: 'Loi sur l\'entraide pénale internationale', def: 'RS 351.1 — entraide judiciaire entre la CH et l\'étranger.' },
        'LBA':       { full: 'Loi sur le blanchiment d\'argent', def: 'RS 955.0 — lutte anti-blanchiment et anti-financement du terrorisme.' },
        'MROS':      { full: 'Money Laundering Reporting Office Switzerland', def: 'Bureau CH de communication en matière de blanchiment.' },
        'FedPol':    { full: 'Office fédéral de la police', def: 'Berne. Abrite la PJF, MROS, bureau Interpol/Europol.' },
        'MPC':       { full: 'Ministère public de la Confédération', def: 'Procureur général fédéral CH (terrorisme, criminalité organisée).' },
        'TMC':       { full: 'Tribunal des mesures de contrainte', def: 'Tribunal qui valide la détention provisoire et autorise certaines mesures.' },
        'PFPDT':     { full: 'Préposé fédéral à la protection des données et à la transparence', def: 'Autorité de surveillance LPD en CH.' },
        'OFCS':      { full: 'Office fédéral de la cybersécurité', def: 'Centre national de cybersécurité, opérationnel depuis 2024.' },
        'GovCERT':   { full: 'GovCERT.ch',                  def: 'Équipe nationale de réponse aux incidents cyber, intégrée à l\'OFCS.' },
        'SRC':       { full: 'Service de renseignement de la Confédération', def: 'Service de renseignement intérieur et extérieur (DDPS).' },
        'API':       { full: 'Application Programming Interface', def: 'Interface logicielle entre deux systèmes.' },
        'ADS':       { full: 'Alternate Data Stream',     def: 'Flux de données alternatifs NTFS, parfois utilisés pour cacher des données.' },
        'EXIF':      { full: 'Exchangeable Image File Format', def: 'Métadonnées photos : GPS, appareil, heure, paramètres.' },
        'BIP-39':    { full: 'Bitcoin Improvement Proposal 39', def: 'Standard 12 ou 24 mots = clé privée Bitcoin déterministe.' },
      };
