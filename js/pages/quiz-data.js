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

const AVATAR_EMOJIS = ['🔰', '🕵️', '🔬', '⚖️', '💀', '🧠', '👮', '🦊', '🐉', '🧬', '🛡️', '⚡', '🎯', '🔐', '🌐', '💻', '🗂️', '🔍', '📡', '🧩'];

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const MID_TIPS = {
  'Informatique de base': 'Revois les couches OSI, DNS, subnetting. Flash cards recommandées.',
  'Système de fichiers': 'Focus sur les structures FAT/NTFS/EXT. Dessine les diagrammes.',
  'Acquisition et analyse': 'Relis les procédures d\'acquisition — ordre de volatilité, write-blockers.',
  'Cryptologie': 'Retiens les tailles de hash MD5/SHA-1/SHA-256 et les modes de chiffrement.',
  'Spécificité des OS': 'Compare Windows/Linux/macOS : artefacts, registres, logs.',
  'Droit': 'Focus sur la procédure pénale et les conditions de perquisition.',
  'OSINT': 'Pratique les Google Dorks et les outils de pivotement.',
};

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
