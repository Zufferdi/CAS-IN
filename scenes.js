/**
 * scenes.js — CAS-IN Scénarios DFIR
 * Converti depuis les JSON sources (13 scénarios)
 * Compatible avec scene.html moteur v2
 *
 * Structure par scénario :
 *   id, title, icon, difficulty, tags, legalRefs,
 *   intro, alertLevel, objectives, debrief,
 *   steps[], badgeFn()
 *
 * Structure par step :
 *   phase, situation, law, question, choices[]
 *
 * Structure par choice :
 *   text, ok, pts, fb, legal, critical, source, next
 *   next: number = index step suivant | "end" = fin scénario
 */

// eslint-disable-next-line no-unused-vars
const SCENES = [

  /* ══════════════════════════════════════════════════
     1. CUSTODY — Audit Chaîne de Possession  [EASY]
  ══════════════════════════════════════════════════ */
  {
    id: "custody",
    title: "Audit Chaîne de Possession",
    icon: "⛓",
    difficulty: "easy",
    atmosphere: "legal",
    narrative: {
      success: "Le rapport corrigé est transmis au Ministère public. Aucune rupture de chaîne de custody ne permet à la défense de contester les preuves. L'enquête avance sur des bases solides.",
      degraded: "Le rapport est transmis avec des réserves. Certaines preuves pourront être contestées par la défense. Le dossier reste recevable mais fragilisé.",
      failure: "Le rapport est rejeté par le Ministère public. Des preuves cruciales sont désormais irrémédiablement exclues. L'enquête recommence à zéro — quand c'est encore possible."
    },
    tags: ["FORENSIQUE", "DROIT"],
    legalRefs: ["ACPO Principles 1–4", "Art. 141 CPP"],
    intro: "Vous relisez un rapport d'investigation reçu d'un collègue. Quelque chose ne va pas. Saurez-vous identifier toutes les ruptures de chaîne de custody ?",
    alertLevel: "CONTRÔLE QUALITÉ — Rapport à valider avant transmission au MP",
    objectives: [
      { icon: "🔍", text: "Identifier chaque rupture de chaîne de custody" },
      { icon: "⚖️", text: "Connaître les conséquences procédurales (Art. 141 CPP)" },
      { icon: "📋", text: "Appliquer les principes ACPO" },
    ],
    debrief: "<p>La chaîne de custody est le pilier de la recevabilité de la preuve numérique. Chaque rupture crée une opportunité pour la défense de contester l'authenticité ou l'intégrité des éléments de preuve.</p><p>Les 6 ruptures dans ce scénario illustrent les erreurs les plus fréquentes : absence de hash de référence, transfert non documenté, stockage inapproprié, accès non loggué, mélange de pièces et rapport sans référence aux scellés.</p>",
    steps: [
      {
        phase: "📋 Le rapport douteux",
        situation: `Vous relisez un rapport d'investigation reçu d'un collègue. Il contient ces points :<br><br>
<div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem;font-size:.78rem;line-height:1.8">
① Le disque dur <em>(marque, modèle, S/N non précisés)</em> a été saisi le 12 mars.<br>
② Hash calculé <em>après</em> l'acquisition — «&nbsp;pour aller plus vite sur la scène.&nbsp;»<br>
③ Le disque a été transporté dans le coffre de la voiture personnelle de l'inspecteur, sans pochette antistatique.<br>
④ En laboratoire, le disque a été branché directement sur la station forensique <em>sans write blocker</em>.<br>
⑤ L'analyse a été effectuée par deux analystes différents sur deux journées, sans journal d'accès.<br>
⑥ Le rapport mentionne «&nbsp;un volume chiffré&nbsp;» mais ne précise pas s'il figure dans les pièces sous scellés.
</div>`,
        law: "<strong>ACPO Principle 3</strong> — Journal d'audit complet, reproductible par un tiers.<br><strong>Art. 141 CPP</strong> — Preuve illicite ou non traçable : risque d'exclusion.",
        question: "<strong>Combien de ruptures de chaîne de custody identifiez-vous dans ce rapport ?</strong>",
        choices: [
          {
            text: "3 ruptures — hash tardif, sans write blocker, journal d'accès manquant.",
            ok: false, pts: -5,
            fb: "Incomplet. Il y en a 6 : (1) support non identifié précisément, (2) hash calculé après acquisition, (3) transport non sécurisé, (4) absence de write blocker, (5) accès multiple sans journal, (6) volume chiffré non référencé dans les scellés.",
            legal: "ACPO Principle 3 — Toute action doit être documentée et reproductible.",
            critical: false, next: 1,
          },
          {
            text: "6 ruptures — le rapport est fondamentalement non conforme.",
            ok: true, pts: 25,
            fb: "Correct. Les 6 ruptures : ① support non identifié (S/N manquant), ② hash post-acquisition, ③ transport non sécurisé (antistatique + véhicule privatif), ④ write blocker absent, ⑤ double accès sans log, ⑥ volume non référencé dans les scellés.",
            legal: "Art. 141 CPP — Chaque rupture est une porte d'entrée pour la défense.",
            critical: false, next: 1,
          },
          {
            text: "0 rupture — les pratiques décrites sont courantes en investigation.",
            ok: false, pts: -30,
            fb: "Erreur grave. «&nbsp;Courant&nbsp;» ne signifie pas «&nbsp;correct&nbsp;». Chacune des 6 pratiques viole un principe fondamental de la forensique numérique.",
            legal: "Art. 141 CPP — La coutume interne ne protège pas contre l'exclusion judiciaire.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🔧 La correction",
        situation: "Vous informez votre collègue des ruptures identifiées. Il vous demande comment corriger le rapport avant transmission au Ministère public demain.",
        law: "<strong>ACPO Principle 4</strong> — Responsabilité : la personne en charge de la preuve est identifiable à tout moment.<br><strong>Manuel DFIR Ch. 29</strong> — Annexes techniques et hash de vérification.",
        question: "<strong>Quelle est l'approche correcte pour corriger le rapport ?</strong>",
        choices: [
          {
            text: "Réécrire le rapport en omettant les points problématiques — «&nbsp;ce qui n'est pas écrit n'existe pas procéduralement.&nbsp;»",
            ok: false, pts: -25,
            fb: "Erreur éthique et procédurale grave. Omettre sciemment des faits dans un rapport d'expertise constitue un faux dans les titres (Art. 251 CP). De plus, la défense peut obtenir les journaux techniques et prouver l'omission.",
            legal: "Art. 251 CP — Le faux intellectuel dans un rapport d'expertise est punissable.",
            critical: true, next: "end",
          },
          {
            text: "Documenter honnêtement chaque rupture, recalculer les hashes depuis l'image existante si possible, et annexer une évaluation de l'impact sur chaque preuve.",
            ok: true, pts: 25,
            fb: "Correct. La transparence est la seule voie défendable. Le rapport doit documenter les manquements, les tentatives de correction, et une évaluation réaliste de la recevabilité. Un magistrat apprécie la rigueur, pas la dissimulation.",
            legal: "ACPO Principle 3 + pratique TF — L'honnêteté procédurale renforce la crédibilité globale.",
            critical: false, next: 2,
          },
          {
            text: "Laisser le rapport tel quel — c'est le travail du collègue, pas le vôtre.",
            ok: false, pts: -15,
            fb: "Position intenable. En relisant le rapport, vous devenez co-responsable de sa transmission. Un expert qui « laisse passer » engage sa propre responsabilité professionnelle.",
            legal: "Code de déontologie DFIR — Chaque relecteur engage sa responsabilité.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "⚖️ L'audience",
        situation: "Le rapport corrigé est transmis. Trois mois plus tard, à l'audience, l'avocat de la défense s'attaque précisément aux points documentés comme ruptures. Il demande l'exclusion de toutes les pièces numériques.",
        law: "<strong>Art. 141 al. 2 CPP</strong> — Exploitation des preuves obtenues en violation de prescriptions d'ordre.<br><strong>TF 6B_361/2017</strong> — Jurisprudence sur l'exclusion de preuves numériques non conformes.",
        question: "<strong>Quelle est votre position d'expert à la barre ?</strong>",
        choices: [
          {
            text: "Confirmer sereinement les ruptures documentées, expliquer leur nature et leur impact réel sur chaque élément, et rappeler que la documentation de ces ruptures est elle-même un gage de rigueur.",
            ok: true, pts: 25,
            fb: "Position experte optimale. La défense obtiendra peut-être l'exclusion de certaines pièces, mais votre honnêteté protège la crédibilité globale du dossier et de votre expertise. Le juge distinguera ce qui est irrecevable de ce qui l'est.",
            legal: "TF 6B_361/2017 — Le juge applique la proportionnalité dans l'exclusion des preuves.",
            critical: false, next: "end",
          },
          {
            text: "Minimiser les ruptures en audience, en espérant que le juge n'ait pas lu attentivement le rapport.",
            ok: false, pts: -25,
            fb: "Double erreur : (1) contradiction avec votre propre rapport, (2) parjure possible. Les juges fédéraux lisent les rapports. Minimiser à l'oral ce qui est écrit à l'écrit détruit votre crédibilité d'expert pour toujours.",
            legal: "Art. 307 CP — Fausse déposition en justice = peine privative jusqu'à 5 ans.",
            critical: true, next: "end",
          },
          {
            text: "Refuser de répondre aux questions sur les ruptures, en invoquant le secret professionnel.",
            ok: false, pts: -20,
            fb: "Le secret professionnel de l'expert ne couvre PAS les éléments de son propre rapport. Un expert à la barre DOIT répondre honnêtement aux questions sur sa méthodologie. Refus = mise en cause de l'expertise.",
            legal: "Art. 183 CPP — L'expert est soumis à l'obligation de répondre.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 80) return { icon: "🏆", title: "Expert Chaîne de Custody", sub: "Maîtrise parfaite des ACPO Principles" };
      if (pct >= 60) return { icon: "🔍", title: "Analyste Rigoureux", sub: "Bonnes bases en chaîne de custody" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez les ACPO Principles et Art. 141 CPP" };
    },
  },

  /* ══════════════════════════════════════════════════
     2. METADATA — La Métadonnée Fatale  [EASY]
  ══════════════════════════════════════════════════ */
  {
    id: "metadata",
    title: "La Métadonnée Fatale",
    icon: "📸",
    difficulty: "easy",
    atmosphere: "network",
    narrative: {
      success: "Le rapport EXIF tient en audience. L'avocat tente de contester la valeur probante, mais la triangulation avec les logs Instagram et les tours GSM rend sa contestation vaine. Le suspect est confondu.",
      degraded: "Le juge accepte les métadonnées EXIF mais ordonne une expertise contradictoire. L'enquête continue, ralentie.",
      failure: "L'expert contradictoire démonte le rapport. Les métadonnées EXIF sont écartées des débats, votre crédibilité d'expert est entamée."
    },
    tags: ["FORENSIQUE", "OUTILS"],
    legalRefs: ["Manuel Ch. 4.3", "Manuel Ch. 29.3", "ACPO Principle 3"],
    intro: "Un suspect a posté une photo sur Instagram le jour du délit. L'iPhone saisi contient le fichier original. ExifTool révèle des coordonnées GPS précises. Comment exploitez-vous cette preuve ?",
    alertLevel: "PREUVE GPS — Valeur probante à établir correctement",
    objectives: [
      { icon: "🧬", text: "Extraire et interpréter les métadonnées EXIF correctement" },
      { icon: "📋", text: "Formuler la conclusion au bon niveau d'affirmation" },
      { icon: "⚖️", text: "Résister à la contre-expertise sur la falsifiabilité des EXIF" },
    ],
    debrief: "<p>Les données EXIF sont une preuve numérique à haute valeur forensique — mais uniquement si elles sont préservées correctement. Prendre une photo de l'écran ou faire un screenshot détruit les métadonnées originales. L'extraction doit se faire sur le fichier original avec un outil dédié (ExifTool) sur une copie forensique.</p><p>La formulation dans le rapport doit rester factuelle : les coordonnées GPS sont des <em>données enregistrées</em>, pas une preuve absolue de présence — le téléphone aurait pu être prêté, piraté, ou les données modifiées.</p>",
    steps: [
      {
        phase: "🧬 La photo sur Instagram",
        situation: `Lors d'une enquête sur un suspect, vous découvrez qu'il a posté une photo sur Instagram depuis son smartphone le jour du délit. L'original du fichier se trouve sur l'iPhone saisi. ExifTool révèle dans le JPEG :<br><br><code>GPS Latitude : 47.3769° N<br>GPS Longitude : 8.5417° E<br>Date/Time Original : 2024-04-15 14:32:07 UTC+2<br>Make : Apple · Model : iPhone 15 Pro<br>Software : iOS 17.4.1</code>`,
        law: "<strong>EXIF (Exchangeable Image File Format)</strong> — Métadonnées intégrées au fichier image par l'appareil.<br><strong>Manuel Ch. 4.3</strong> — Les métadonnées internes sont une preuve forensique distincte des métadonnées du système de fichiers.",
        question: "<strong>Comment exploitez-vous ces données GPS dans votre rapport ?</strong>",
        choices: [
          {
            text: "«\u00a0Le suspect se trouvait au 47.3769°N, 8.5417°E (Zurich-Bellevue) le 15 avril à 14h32.\u00a0»",
            ok: false, pts: -20,
            fb: "Sur-interprétation. Les données EXIF indiquent que le téléphone était à cet endroit — pas nécessairement le suspect. Le téléphone aurait pu être prêté, volé ou les données EXIF modifiées.",
            legal: "Manuel Ch. 29.3 — Fait : coordonnées enregistrées. Interprétation : le téléphone était là. Opinion : le suspect était là.",
            critical: true, next: "end",
          },
          {
            text: "«\u00a0Les données EXIF du fichier IMG_4821.jpg indiquent des coordonnées GPS : 47.3769°N, 8.5417°E, enregistrées le 2024-04-15 à 14:32:07 (UTC+2). Ces coordonnées correspondent au quartier Bellevue de Zurich.\u00a0»",
            ok: true, pts: 25,
            fb: "Formulation correcte. Elle distingue les données brutes (coordonnées, timestamp), leur source (EXIF du fichier), et leur correspondance géographique (fait vérifiable). Elle n'affirme pas la présence du suspect.",
            legal: "Manuel Ch. 29.3 + Ch. 4.3 — Les métadonnées EXIF sont un fait vérifiable, leur interprétation est une inférence à soutenir par d'autres artefacts.",
            critical: false, next: 1,
          },
          {
            text: "Faire une capture d'écran de l'affichage ExifTool pour le dossier.",
            ok: false, pts: -15,
            fb: "Méthode insuffisante. Une capture d'écran ne permet pas à un expert contradictoire de vérifier l'extraction. Il faut joindre le fichier original (hash vérifié) et le rapport complet d'ExifTool exporté en texte.",
            legal: "ACPO Principle 3 — Reproductibilité. L'expert contradictoire doit pouvoir exécuter la même extraction.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "📍 La corrélation",
        situation: "Les coordonnées GPS pointent vers la Bahnhofstrasse de Zurich — là où le vol à l'étalage a eu lieu. Mais l'avocat argue que les données EXIF peuvent être falsifiées avec des outils librement disponibles (comme ExifTool lui-même).",
        law: "<strong>Manuel Ch. 4.3</strong> — Vérification de l'authenticité des métadonnées : cohérence interne, logs du serveur Instagram.",
        question: "<strong>Comment répondez-vous à l'argument de falsification ?</strong>",
        choices: [
          {
            text: "Les données EXIF ne peuvent pas être falsifiées — c'est une technologie sécurisée.",
            ok: false, pts: -20,
            fb: "Faux. ExifTool et de nombreux outils permettent de modifier les données EXIF librement. Un expert qui affirme l'inaltérabilité des EXIF perd immédiatement en crédibilité.",
            legal: "Réalité technique — Les EXIF ne sont pas signés numériquement sur les appareils grand public.",
            critical: true, next: "end",
          },
          {
            text: "Croiser avec les logs de localisation d'Instagram et les tours GSM. La cohérence entre 3 sources indépendantes rend la falsification coordonnée hautement improbable.",
            ok: true, pts: 20,
            fb: "Approche correcte. Une falsification isolée des EXIF est possible, mais une falsification simultanée et cohérente des EXIF, des logs Instagram et des données GSM est quasi-impossible.",
            legal: "Manuel Ch. 2.5 — La convergence de sources indépendantes augmente la valeur probante.",
            critical: false, next: 2,
          },
          {
            text: "Changer de stratégie : abandonner la preuve EXIF et ne se baser que sur les témoignages oculaires.",
            ok: false, pts: -10,
            fb: "Capitulation prématurée. Les EXIF restent une source valide même si falsifiables — c'est la convergence avec d'autres sources qui établit la valeur probante. Les abandonner unilatéralement affaiblit tout le dossier.",
            legal: "Art. 10 CPP — Libre appréciation des preuves par le juge, mais l'expert doit défendre ses analyses valides.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🔒 La demande de réquisition",
        situation: "Pour renforcer la preuve, vous voulez obtenir les logs serveur d'Instagram (Meta Platforms Inc., USA) : horodatage de l'upload, IP source, fingerprint de l'appareil. Le Ministère public vous demande comment procéder — la demande doit être juridiquement solide.",
        law: "<strong>Art. 273 CPP</strong> — Surveillance des télécommunications, ordonnance du MP validée par TMC.<br><strong>Convention Cybercriminalité Budapest Art. 32</strong> — Accès transfrontière aux données.<br><strong>US CLOUD Act</strong> — Obligation pour Meta de répondre aux demandes étrangères légales via MLAT.",
        question: "<strong>Quelle procédure recommandez-vous au MP ?</strong>",
        choices: [
          {
            text: "Demander directement à Meta via son portail Law Enforcement, sans passer par fedpol.",
            ok: false, pts: -15,
            fb: "Possible pour les urgences (preservation request), mais insuffisant pour des données de contenu. Meta exige une MLAT pour les logs détaillés depuis les autorités suisses. Sans MLAT, la réponse sera partielle ou refusée.",
            legal: "Meta Law Enforcement Guidelines — MLAT requise pour données de contenu non-urgentes.",
            critical: false, next: "end",
          },
          {
            text: "Ordonnance MP validée par TMC, transmission via fedpol (DIR) qui coordonne avec le FBI via MLAT USA-Suisse, puis requête formelle à Meta.",
            ok: true, pts: 25,
            fb: "Procédure correcte et juridiquement défendable. Le circuit fedpol → MLAT → Meta garantit la recevabilité des données obtenues. Compter 3-6 mois de délai — à anticiper dans la stratégie procédurale.",
            legal: "Art. 273 CPP + MLAT CH-USA 1973 — Voie officielle, preuves pleinement recevables devant TF.",
            critical: false, next: "end",
          },
          {
            text: "Se connecter au compte Instagram du suspect depuis son iPhone saisi pour voir les métadonnées du post directement.",
            ok: false, pts: -30,
            fb: "Violation grave. L'accès aux comptes en ligne du suspect sans mandat spécifique (art. 269 CPP) constitue une surveillance illégale. Toute donnée obtenue sera écartée (art. 141 CPP) et vous risquez une plainte pénale pour abus de pouvoir.",
            legal: "Art. 269 CPP — La surveillance d'un compte en ligne exige une ordonnance distincte.",
            critical: true, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 80) return { icon: "🏆", title: "Expert EXIF", sub: "Maîtrise parfaite de la preuve métadonnées" };
      if (pct >= 60) return { icon: "📸", title: "Analyste Numérique", sub: "Bonnes bases sur les métadonnées" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez Manuel Ch. 4.3 et 29.3" };
    },
  },

  /* ══════════════════════════════════════════════════
     3. BITLOCKER — Le Dilemme de l'Intervenant  [MEDIUM]
  ══════════════════════════════════════════════════ */
  {
    id: "bitlocker",
    title: "Le Dilemme de l'Intervenant",
    icon: "🔐",
    difficulty: "medium",
    atmosphere: "crypto",
    narrative: {
      success: "La clé FVEK est capturée à temps depuis la RAM. Volatility l'extrait avec précision, le disque est déchiffré en laboratoire. L'enquête avance — 750 Go de preuves accessibles.",
      degraded: "La capture RAM est partielle. Quelques indices exploitables, mais la clé complète manque. Il faudra explorer les canaux alternatifs (compte Microsoft, Active Directory).",
      failure: "Le laptop a été éteint avant la capture RAM. La clé BitLocker est perdue à jamais — AES-256 reste inviolable. Des téraoctets de preuves potentielles sont désormais inaccessibles."
    },
    tags: ["WINDOWS", "FORENSIQUE"],
    legalRefs: ["Art. 248 CPP", "Manuel Ch. 11.1", "ISO/IEC 27037"],
    intro: "Vous arrivez dans un appartement zurichois. Sur le bureau : un laptop Windows allumé avec session active et BitLocker activé. Votre collègue s'apprête à fermer l'écran. Chaque seconde compte.",
    alertLevel: "CRITIQUE — BitLocker actif, clé en RAM volatile",
    objectives: [
      { icon: "💻", text: "Préserver la clé BitLocker avant toute action" },
      { icon: "⛓", text: "Respecter les scellés sans détruire les preuves volatiles" },
      { icon: "🔑", text: "Identifier les alternatives si la RAM n'a pas été capturée" },
    ],
    debrief: "<p>Ce scénario illustre le principe fondamental de la forensique numérique : <strong>ne jamais modifier la preuve</strong>, même involontairement. Éteindre un ordinateur BitLocker sans en avoir capturé la mémoire vive revient à détruire définitivement la clé de déchiffrement.</p><p><strong>Règle d'or (Manuel Ch. 11.1) :</strong> si le système est allumé et chiffré → live forensics d'abord. Le dump RAM est la priorité absolue. Les scellés (art. 248 CPP) ne s'opposent pas à l'acquisition — ils suspendent l'<em>analyse</em>, pas la <em>collecte</em>.</p>",
    steps: [
      {
        phase: "💻 La découverte",
        situation: "Vous arrivez dans un appartement zurichois. Sur le bureau : un laptop Windows allumé avec session active. Dans l'angle inférieur droit, une icône indique <strong>BitLocker activé</strong>. Votre collègue s'apprête à fermer l'écran. Le propriétaire vient d'être arrêté à l'extérieur.",
        law: "<strong>Art. 248 CPP</strong> — Les scellés suspendent l'analyse, pas l'acquisition.<br><strong>Manuel Ch. 11.1</strong> — Priorité : volatilité des données. La RAM contient la clé BitLocker.",
        question: "<strong>Votre collègue s'apprête à fermer le laptop. Que faites-vous ?</strong>",
        choices: [
          {
            text: "Le laisser fermer — c'est plus simple pour le transport et les scellés.",
            ok: false, pts: -25,
            fb: "Erreur critique. Fermer l'écran peut déclencher la mise en veille ou l'hibernation — BitLocker rechiffre immédiatement la RAM. La clé de déchiffrement est perdue sans retour possible.",
            legal: "Manuel Ch. 11.1 — Un système BitLocker éteint sans capture RAM préalable équivaut à une destruction de preuve involontaire.",
            critical: true, next: "end",
          },
          {
            text: "Brancher immédiatement un outil de dump RAM (WinPmem sur clé USB) avant tout déplacement.",
            ok: true, pts: 25,
            fb: "Décision correcte. La RAM contient la clé de chiffrement BitLocker active. WinPmem capture la mémoire sans modifier le contenu du disque. C'est la priorité absolue en live forensics.",
            legal: "Manuel Ch. 11.1 + ISO/IEC 27037 — volatilité des données : RAM en premier, disque ensuite.",
            critical: false, next: 1,
          },
          {
            text: "Photographier l'écran et demander immédiatement les scellés.",
            ok: false, pts: -10,
            fb: "Incomplète. Photographier l'écran ne capture pas la clé BitLocker. Les scellés suspendent l'analyse mais la RAM volatile sera perdue dès qu'on déplace l'appareil.",
            legal: "Art. 248 CPP — Les scellés n'interdisent pas la capture RAM préalable, qui est une mesure de préservation.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🔑 La clé de récupération",
        situation: "Vous avez capturé la RAM (14 Go, 8 minutes). Volatility confirme : la clé BitLocker FVEK est présente à l'offset 0x7F3A2400. Mais votre supérieur vous demande maintenant de trouver une clé de récupération <em>sans</em> exploiter la RAM — pour des raisons procédurales.",
        law: "<strong>BitLocker Recovery Key</strong> peut être dans : compte Microsoft, Active Directory, fichier texte sauvegardé, clé USB de récupération.",
        question: "<strong>Où chercher la clé de récupération BitLocker sans exploiter la RAM ?</strong>",
        choices: [
          {
            text: "Compte Microsoft associé à la session Windows — microsoft.com/devicemanagement",
            ok: true, pts: 20,
            fb: "Principal emplacement de sauvegarde pour les particuliers. Si le propriétaire utilise un compte Microsoft, la clé de récupération y est souvent stockée automatiquement. Nécessite une réquisition judiciaire à Microsoft.",
            legal: "Manuel Ch. 24.3 — Récupération clés BitLocker : compte MS > AD > fichier sauvegardé.",
            critical: false, next: "end",
          },
          {
            text: "Brute force sur le chiffrement AES-256.",
            ok: false, pts: -20,
            fb: "Irréalisable. AES-256 avec une clé aléatoire de 256 bits nécessiterait plus d'énergie que le soleil ne peut en produire pour être cassé par force brute. Cette option n'existe pas dans l'arsenal forensique réaliste.",
            legal: "AES-256 — aucun ordinateur existant ne peut casser par force brute en temps raisonnable.",
            critical: true, next: "end",
          },
          {
            text: "Chercher un fichier .txt ou .pdf de sauvegarde sur les autres supports de l'appartement.",
            ok: true, pts: 15,
            fb: "Méthode valide. Beaucoup d'utilisateurs sauvegardent leur clé de récupération dans un fichier texte ou l'impriment. Vérifier aussi les clés USB, smartphones et le cloud.",
            legal: "Manuel Ch. 24.3 — La recherche physique de supports de sauvegarde est une étape légitime.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "📋 La réquisition Microsoft",
        situation: "Le compte Microsoft du suspect est identifié (compte@outlook.com). Vous préparez la réquisition à Microsoft Corporation (Redmond, USA) pour obtenir la clé de récupération BitLocker associée. Le Ministère public doit signer l'ordonnance — mais les délais MLAT USA-Suisse sont de 3 à 6 mois.",
        law: "<strong>MLAT CH-USA 1973</strong> — Traité d'entraide judiciaire, voie officielle.<br><strong>Art. 273 CPP</strong> — Surveillance télécommunications.<br><strong>US CLOUD Act 2018</strong> — Microsoft peut répondre directement à des demandes étrangères légales.",
        question: "<strong>Comment procédez-vous pour limiter les délais ?</strong>",
        choices: [
          {
            text: "Attendre les 6 mois MLAT par principe de rigueur procédurale.",
            ok: false, pts: -10,
            fb: "Trop conservateur. Depuis le CLOUD Act 2018, Microsoft peut répondre à des ordonnances étrangères légales directement via son portail Law Enforcement, sans MLAT. Le délai peut passer à 2-4 semaines.",
            legal: "CLOUD Act + Microsoft Law Enforcement Portal — Raccourci légal pour autorités validées.",
            critical: false, next: 3,
          },
          {
            text: "Soumettre en parallèle : ordonnance MP via le portail Law Enforcement Microsoft (réponse sous 2-4 semaines) et MLAT en backup (réponse sous 3-6 mois). La première qui aboutit est utilisée.",
            ok: true, pts: 25,
            fb: "Stratégie optimale. Le portail direct couvre 90% des demandes en quelques semaines. Le MLAT reste en backup pour les cas où Microsoft demande validation étatique. Deux voies = sécurité procédurale.",
            legal: "Pratique fedpol + CLOUD Act — Approche double canal recommandée pour les données cloud.",
            critical: false, next: 3,
          },
          {
            text: "Contacter Microsoft par email informel via le compte de support grand public.",
            ok: false, pts: -25,
            fb: "Aucune valeur juridique. Microsoft ne traite les demandes d'autorités que via le portail Law Enforcement avec vérification d'identité officielle. Une demande informelle sera ignorée ou classée sans suite.",
            legal: "Microsoft Online Services Terms — Demandes légales via canaux authentifiés uniquement.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🧪 Le déchiffrement en laboratoire",
        situation: "La clé FVEK est obtenue (via RAM + confirmée par Microsoft). Vous procédez au déchiffrement du disque en laboratoire. Votre technicien propose deux méthodes : (A) monter l'image en lecture seule via <code>dislocker-fuse</code>, ou (B) produire une image déchiffrée complète via <code>dislocker-file</code>.",
        law: "<strong>ACPO Principle 1</strong> — Aucune modification de la preuve originale.<br><strong>Manuel Ch. 12.2</strong> — Travail sur copie, toujours.",
        question: "<strong>Quelle méthode recommandez-vous pour l'analyse ?</strong>",
        choices: [
          {
            text: "Dislocker-file : produire une image déchiffrée complète de 500 Go, puis analyser cette image avec les outils habituels (X-Ways, Autopsy).",
            ok: true, pts: 25,
            fb: "Correct. L'image déchiffrée complète permet des analyses forensiques lourdes sans dépendance au mount FUSE. Hash de vérification sur l'image déchiffrée avant/après analyse. Méthode reproductible par un expert tiers.",
            legal: "ACPO Principle 3 — Reproductibilité via image déchiffrée indépendante.",
            critical: false, next: 4,
          },
          {
            text: "Monter directement le disque BitLocker original en écriture avec la clé, pour explorer plus rapidement.",
            ok: false, pts: -30,
            fb: "Violation grave d'ACPO Principle 1. Toute modification du disque original (même une simple mise à jour de timestamps par Windows) peut invalider toute l'analyse. Travailler toujours sur une COPIE forensique.",
            legal: "ACPO Principle 1 + Manuel Ch. 12.2 — Interdiction absolue de modifier la preuve originale.",
            critical: true, next: "end",
          },
          {
            text: "Dislocker-fuse : monter l'image déchiffrée en live, plus rapide mais dépend du mount actif.",
            ok: false, pts: 0,
            fb: "Méthode acceptable pour exploration rapide mais moins robuste qu'une image complète. Le mount FUSE peut tomber, les outils ne peuvent pas tous lire via FUSE. Pour un dossier pénal sérieux, préférer une image complète.",
            legal: "Manuel Ch. 12.2 — Préférer l'image statique pour la défense devant juge.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "⚖️ La présentation au MP",
        situation: "Le disque est déchiffré. Vous identifiez 12 Go de documents techniques confidentiels + 340 emails chiffrés avec OpenPGP. Le Ministère public veut savoir ce qui est exploitable en audience et ce qui nécessite une procédure supplémentaire.",
        law: "<strong>Art. 248 CPP</strong> — Scellés sur données personnelles.<br><strong>Art. 264 CPP</strong> — Objets non saisissables (correspondance avocat-client).<br><strong>TF 1B_602/2020</strong> — Tri préalable obligatoire.",
        question: "<strong>Comment qualifiez-vous le matériel pour le MP ?</strong>",
        choices: [
          {
            text: "Tout est exploitable puisque le disque est déchiffré — le MP peut consulter l'intégralité.",
            ok: false, pts: -25,
            fb: "Erreur procédurale. Le déchiffrement technique n'équivaut pas à recevabilité procédurale. Les emails avec l'avocat (Art. 264 CPP) et les données non pertinentes doivent être triés préalablement par le TMC.",
            legal: "Art. 264 CPP + TF 1B_602/2020 — Tri préalable OBLIGATOIRE avant toute consultation par le MP.",
            critical: true, next: "end",
          },
          {
            text: "Distinguer : (1) documents techniques → exploitables après tri TMC, (2) emails OpenPGP → tri spécifique avant déchiffrement (correspondance avocat ?), (3) données non pertinentes → écartées dès le tri.",
            ok: true, pts: 25,
            fb: "Position correcte. Le déchiffrement technique et la recevabilité juridique sont deux étapes distinctes. Un bon rapport distingue clairement ce qui est disponible techniquement de ce qui est consultable légalement après tri TMC.",
            legal: "Art. 248 + 264 CPP + TF 1B_602/2020 — Séparation nette entre capacité technique et légalité procédurale.",
            critical: false, next: "end",
          },
          {
            text: "Ne présenter au MP que ce qui semble directement compromettant, écarter le reste en silence.",
            ok: false, pts: -15,
            fb: "Sélection biaisée interdite. L'expert forensique doit présenter un inventaire complet et neutre ; c'est au MP et au juge de qualifier la pertinence. Filtrer en amont = empiéter sur la fonction judiciaire.",
            legal: "Art. 182 CPP — L'expert présente des faits, pas une opinion sélective.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "🏆", title: "Expert BitLocker", sub: "Maîtrise parfaite du live forensics" };
      if (pct >= 60) return { icon: "🔐", title: "Analyste Forensique", sub: "Bonnes réflexes en live forensics" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez Manuel Ch. 11.1 — Live Forensics" };
    },
  },

  /* ══════════════════════════════════════════════════
     4. CONCLUSION — Rédiger la Conclusion  [MEDIUM]
  ══════════════════════════════════════════════════ */
  {
    id: "conclusion",
    title: "Rédiger la Conclusion",
    icon: "📋",
    difficulty: "medium",
    atmosphere: "legal",
    narrative: {
      success: "Le rapport passe l'examen du juge d'instruction sans difficulté. Les niveaux d'affirmation sont justes, la distinction fait/interprétation/opinion respectée. Votre expertise s'impose en audience.",
      degraded: "Le rapport est accepté avec des réserves. Certaines formulations devront être reprises lors de l'audience contradictoire.",
      failure: "Le rapport est renvoyé pour correction. Votre crédibilité d'expert est durablement entamée — les prochains mandats tarderont à venir."
    },
    tags: ["FORENSIQUE", "DROIT"],
    legalRefs: ["Manuel Ch. 29.3", "Art. 182 CPP", "Art. 251 CP"],
    intro: "Un fichier Excel a été copié sur une clé USB depuis la session de jmartin. Les caméras confirment sa présence. Vous rédigez le rapport. Chaque mot compte devant le tribunal.",
    alertLevel: "RAPPORT JUDICIAIRE — Chaque formulation engage votre responsabilité",
    objectives: [
      { icon: "📋", text: "Distinguer fait / interprétation / opinion dans un rapport forensique" },
      { icon: "⚖️", text: "Respecter le rôle de l'expert (Art. 182 CPP)" },
      { icon: "🎯", text: "Formuler une conclusion proportionnelle aux preuves disponibles" },
    ],
    debrief: "<p>La distinction fait/interprétation/opinion (Manuel Ch. 29.3) est l'une des compétences les plus importantes d'un expert forensique. Un rapport qui mélange les trois niveaux expose son auteur à des attaques en contre-expertise.</p><p>Règle pratique : si vous pouvez mettre «&nbsp;probablement&nbsp;» ou «&nbsp;il semble que&nbsp;», c'est une interprétation. Si vous concluez sur l'intention ou la culpabilité, c'est une opinion — réservée au juge.</p>",
    steps: [
      {
        phase: "📋 Le bon niveau d'affirmation",
        situation: "Vous avez découvert qu'un fichier Excel nommé <code>salaires_concurrents.xlsx</code> a été copié depuis le réseau de l'entreprise sur une clé USB le 14 mars à 17h42, depuis la session de l'utilisateur <em>jmartin</em>. Le fichier n'est plus présent sur la clé USB mais son .lnk subsiste.",
        law: "<strong>Manuel Ch. 29.3</strong> — Fait : ce qui est observable et vérifiable. Interprétation : conclusion logique des faits. Opinion : jugement sur l'intention, réservé au juge.",
        question: "<strong>Quelle formulation est forensiquement correcte pour votre rapport ?</strong>",
        choices: [
          {
            text: "«\u00a0J. Martin a volé des données confidentielles de son employeur le 14 mars.\u00a0»",
            ok: false, pts: -25,
            fb: "Opinion inadmissible. «\u00a0Vol\u00a0» est une qualification juridique. La session peut avoir été utilisée par quelqu'un d'autre. L'expert forensique ne qualifie pas les infractions.",
            legal: "Art. 251 CP — Un expert qui présente une opinion comme un fait engage sa responsabilité.",
            critical: true, next: "end",
          },
          {
            text: "«\u00a0Les journaux système indiquent qu'un fichier nommé salaires_concurrents.xlsx a été copié vers le périphérique USB (S/N : 4C530000000) le 2024-03-14 à 17:42:11, depuis la session utilisateur jmartin. Un fichier de raccourci (.lnk) référençant ce fichier a été retrouvé dans C:\\Users\\jmartin\\Recent.\u00a0»",
            ok: true, pts: 25,
            fb: "Formulation forensiquement correcte. Elle ne dit que ce qui est vérifiable : les journaux (source), le nom du fichier, le périphérique (S/N traçable), l'horodatage précis, la session (pas la personne). Elle cite les artefacts avec leur emplacement.",
            legal: "Manuel Ch. 29.3 — Fait : journaux + artefacts. L'identification humaine → interprétation à étayer par d'autres preuves.",
            critical: false, next: 1,
          },
          {
            text: "«\u00a0Il semble que quelqu'un ait copié un fichier de salaires. Nous pensons que c'est jmartin.\u00a0»",
            ok: false, pts: -15,
            fb: "Trop vague. «\u00a0Il semble\u00a0» et «\u00a0nous pensons\u00a0» sont des formulations d'opinion non étayée. Un rapport forensique doit citer des artefacts précis — jamais des impressions.",
            legal: "Manuel Ch. 29.3 — Les formulations vagues sans référence aux artefacts n'ont pas de valeur forensique.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "⚖️ Le niveau suivant",
        situation: "Vous savez que jmartin est le seul utilisateur qui connaissait l'emplacement de ce fichier (selon les ACL). Les caméras de surveillance montrent jmartin à son poste à 17h42. Pouvez-vous désormais faire une affirmation plus forte ?",
        law: "<strong>Manuel Ch. 29.3</strong> — La convergence d'artefacts numériques et physiques peut élever une interprétation au niveau d'un fait consolidé.",
        question: "<strong>Quelle formulation est maintenant justifiée ?</strong>",
        choices: [
          {
            text: "«\u00a0La convergence du journal système (session jmartin), des images de vidéosurveillance (jmartin au poste à 17h42) et des ACL (seul jmartin avait accès) désigne jmartin comme l'auteur probable de la copie.\u00a0»",
            ok: true, pts: 20,
            fb: "Formulation correcte. Elle monte d'un niveau (de 'fait' à 'interprétation fondée') en citant explicitement les 3 sources convergentes. Le mot 'probable' maintient l'honnêteté intellectuelle.",
            legal: "Manuel Ch. 29.4 — Corrélation multi-sources → interprétation fondée. Jamais d'affirmation absolue sur l'identité humaine sans aveu ou témoin direct.",
            critical: false, next: 2,
          },
          {
            text: "«\u00a0jmartin a commis l'infraction de vol de données (art. 143 CP) le 14 mars à 17h42.\u00a0»",
            ok: false, pts: -15,
            fb: "Encore trop loin. Même avec la convergence, qualifier pénalement l'acte (art. 143 CP) dépasse le rôle de l'expert forensique. La qualification pénale appartient au MP et au juge.",
            legal: "Art. 182 CPP — L'expert forensique ne se substitue pas au juge dans la qualification juridique.",
            critical: false, next: 2,
          },
          {
            text: "«\u00a0Les trois sources prouvent que jmartin est coupable.\u00a0»",
            ok: false, pts: -20,
            fb: "Le mot « coupable » est une qualification juridique réservée au juge. Un expert ne prouve pas la culpabilité — il établit des faits techniques.",
            legal: "Art. 10 CPP + Art. 182 CPP — Présomption d'innocence + rôle de l'expert.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🔍 L'objection de la défense",
        situation: "La défense produit un document RH prouvant que jmartin a prêté ses identifiants à un stagiaire pendant 3 semaines (politique interne confirmée par l'IT). Elle demande l'exclusion du rapport en arguant que « session jmartin » ≠ « jmartin physiquement ».",
        law: "<strong>Manuel Ch. 29.5</strong> — Défis d'attribution : une session n'identifie pas une personne.<br><strong>TF 6B_361/2017</strong> — L'attribution numérique requiert corroboration par sources indépendantes.",
        question: "<strong>Comment répondez-vous au juge d'instruction ?</strong>",
        choices: [
          {
            text: "Maintenir la conclusion : les caméras montrent jmartin au poste à 17h42, donc c'est lui.",
            ok: false, pts: -15,
            fb: "Raisonnement fragile. Les caméras montrent qu'UNE personne ressemblant à jmartin est au poste — mais le prêt d'identifiants introduit un doute raisonnable. Un expert doit savoir nuancer quand un fait nouveau émerge.",
            legal: "TF 6B_361/2017 — Le doute raisonnable profite à l'accusé (in dubio pro reo).",
            critical: false, next: 3,
          },
          {
            text: "Réviser le rapport : « Les données techniques désignent la session jmartin comme active. La reconnaissance visuelle sur les caméras suggère jmartin en personne, mais le prêt d'identifiants documenté introduit un doute sur l'attribution personnelle. Des éléments complémentaires (badge d'accès, biométrie, logs téléphone) seraient nécessaires. »",
            ok: true, pts: 25,
            fb: "Réponse d'expert correcte. Reconnaître la limite de l'attribution est une force, pas une faiblesse. Le rapport révisé propose des pistes complémentaires concrètes. C'est ce qu'un magistrat attend d'un expert honnête.",
            legal: "Manuel Ch. 29.5 + Art. 182 CPP — Ajuster les conclusions aux faits nouveaux = rigueur d'expert.",
            critical: false, next: 3,
          },
          {
            text: "Retirer entièrement le rapport — il n'est plus fiable.",
            ok: false, pts: -20,
            fb: "Surréaction. Le rapport reste techniquement correct ; seule la conclusion d'attribution personnelle doit être nuancée. Les faits techniques (copie vers USB S/N précis, timestamp) demeurent valides.",
            legal: "Art. 189 CPP — L'expert adapte son rapport, il ne le retire pas sans motif grave.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "📎 Les annexes techniques",
        situation: "Le juge vous demande comment joindre les preuves techniques au rapport pour garantir la reproductibilité par un expert de la défense. Vous disposez de : images disque (hash SHA-256), extractions Volatility, logs SIEM, captures réseau.",
        law: "<strong>ACPO Principle 3</strong> — Reproductibilité par un tiers.<br><strong>Manuel Ch. 29.7</strong> — Annexes techniques d'un rapport forensique.",
        question: "<strong>Quelle structure d'annexes proposez-vous ?</strong>",
        choices: [
          {
            text: "Joindre toutes les données brutes (images complètes 500 Go) sur disque dur chiffré, transmises au greffe.",
            ok: false, pts: -5,
            fb: "Trop lourd procéduralement. La transmission physique de données brutes pose des problèmes de volumétrie, de chaîne de custody et d'accessibilité. Les annexes doivent être exploitables pour le juge et la défense.",
            legal: "Pratique TMC — Volumes importants = liste des éléments + accès contrôlé en laboratoire.",
            critical: false, next: 4,
          },
          {
            text: "Joindre : (1) un inventaire hashé de tous les artefacts avec leur emplacement dans la chaîne de custody, (2) les rapports d'outils en format texte (ExifTool, Volatility, plaso), (3) un protocole de reproductibilité étape par étape, (4) les images complètes restant au laboratoire mais accessibles sur demande au TMC.",
            ok: true, pts: 25,
            fb: "Structure optimale. Inventaire hashé = transparence. Rapports exportés = consultables par la défense. Protocole reproductible = pilier ACPO. Images physiques au labo = praticité + chaîne de custody préservée.",
            legal: "ACPO Principle 3 + Manuel Ch. 29.7 — Annexes structurées = meilleure défense contre contestation.",
            critical: false, next: 4,
          },
          {
            text: "Ne pas joindre d'annexes techniques pour ne pas « polluer » le rapport principal.",
            ok: false, pts: -25,
            fb: "Erreur grave. L'absence d'annexes rend le rapport non reproductible — un expert adverse peut invoquer ce manquement pour faire écarter l'ensemble. Les annexes techniques sont la colonne vertébrale de la recevabilité.",
            legal: "ACPO Principle 3 — Sans annexes reproductibles, le rapport est juridiquement fragile.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🎯 La soutenance orale",
        situation: "Audience au Tribunal correctionnel de Zurich. L'avocat de la défense vous demande à la barre : « Êtes-vous absolument certain que c'est M. Martin qui a copié ce fichier ? Répondez par oui ou non. »",
        law: "<strong>Art. 185 CPP</strong> — L'expert peut refuser une réponse simpliste si elle trahit la complexité du fait.<br><strong>Art. 307 CP</strong> — Fausse déposition.",
        question: "<strong>Que répondez-vous ?</strong>",
        choices: [
          {
            text: "« Oui, j'en suis absolument certain. »",
            ok: false, pts: -30,
            fb: "Parjure possible. « Absolument certain » contredit votre propre rapport révisé (qui admet le doute lié au prêt d'identifiants). Cette réponse expose à l'art. 307 CP et détruit votre crédibilité à vie.",
            legal: "Art. 307 CP — Fausse déposition en justice : jusqu'à 5 ans de peine privative.",
            critical: true, next: "end",
          },
          {
            text: "« Monsieur le Président, une réponse par oui/non trahirait la complexité technique. Ma conclusion, détaillée au rapport, est que les éléments désignent la session de M. Martin. L'attribution à la personne de M. Martin reste sujette au doute soulevé par le prêt d'identifiants. »",
            ok: true, pts: 25,
            fb: "Position d'expert exemplaire. Refuser la simplification tout en restant factuel. Cela force le juge et les parties à considérer la complexité réelle. C'est ce qui distingue un expert rigoureux d'un témoin ordinaire.",
            legal: "Art. 185 CPP — L'expert peut nuancer, c'est même son devoir.",
            critical: false, next: "end",
          },
          {
            text: "« Non, je ne suis pas certain. »",
            ok: false, pts: -10,
            fb: "Réponse trop tranchée dans l'autre sens. Vous avez des éléments techniques solides ; « non certain » les minimise injustement. Le juste milieu est de nuancer, pas de capituler.",
            legal: "Art. 182 CPP — L'expert donne un avis technique nuancé, ni sur-affirmatif ni défaitiste.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "⚖️", title: "Expert Rédaction", sub: "Maîtrise parfaite des niveaux d'affirmation" };
      if (pct >= 60) return { icon: "📋", title: "Analyste Rigoureux", sub: "Bonne compréhension des limites du rôle" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez Manuel Ch. 29.3 — Fait/Interprétation/Opinion" };
    },
  },

  /* ══════════════════════════════════════════════════
     5. IP_ACCUSATRICE — L'Adresse IP Accusatrice  [MEDIUM]
  ══════════════════════════════════════════════════ */
  {
    id: "ip_accusatrice",
    title: "L'Adresse IP Accusatrice",
    icon: "🌐",
    difficulty: "medium",
    atmosphere: "network",
    narrative: {
      success: "L'arrestation est différée jusqu'à l'analyse du Raspberry Pi. Découverte : c'est un appareil compromis par un botnet. M. Dupont est victime, pas auteur. Votre rigueur a évité une erreur judiciaire grave.",
      degraded: "L'enquête s'oriente dans plusieurs directions — l'IP seule ne suffit pas, les pistes restent partielles.",
      failure: "M. Dupont est arrêté sur la seule base de l'IP. Après 48h de garde à vue, l'analyse forensique le disculpe. Il poursuit l'État pour arrestation arbitraire — et gagne."
    },
    tags: ["RÉSEAUX", "DROIT"],
    legalRefs: ["ATF 136 II 508", "Manuel Ch. 25.6", "Art. 197 CPP"],
    intro: "Les logs d'un serveur piraté pointent vers une IP attribuée à M. Dupont par Swisscom. Le MP veut une arrestation immédiate. Mais une IP identifie-t-elle vraiment une personne ?",
    alertLevel: "ARRESTATION POTENTIELLE — Fondements à vérifier",
    objectives: [
      { icon: "🌐", text: "Comprendre les limites probatoires d'une adresse IP (ATF 136 II 508)" },
      { icon: "🔍", text: "Identifier les artefacts complémentaires nécessaires" },
      { icon: "⚖️", text: "Appliquer le principe de proportionnalité (Art. 197 CPP)" },
    ],
    debrief: "<p>Le Manuel (Ch. 25.6) est explicite : <strong>une adresse IP identifie un abonné, pas une personne physique</strong>. En environnement NAT, une IP publique peut correspondre à des centaines d'appareils et d'utilisateurs distincts.</p><p>L'ATF 136 II 508 a établi que la communication des données d'un abonné nécessite une base légale spécifique. L'IP seule n'est pas une preuve suffisante d'attribution sans artefacts complémentaires.</p>",
    steps: [
      {
        phase: "🌐 L'IP suspecte",
        situation: "Les logs d'un serveur piraté montrent des connexions depuis l'IP <code>85.195.241.178</code>. Swisscom, contactée via réquisition judiciaire, indique que cette IP est assignée à M. Dupont, <strong>un abonné résidentiel à Berne</strong>. Le MP veut procéder immédiatement à l'arrestation.",
        law: "<strong>ATF 136 II 508</strong> — IP identifie un abonné, pas un auteur.<br><strong>Manuel Ch. 25.6</strong> — NAT : une IP publique = plusieurs appareils derrière un routeur.",
        question: "<strong>L'IP attribuée à M. Dupont suffit-elle pour l'arrestation ?</strong>",
        choices: [
          {
            text: "Oui — Swisscom a confirmé. C'est suffisant pour l'arrestation.",
            ok: false, pts: -25,
            fb: "Non. L'IP identifie l'abonné — pas l'auteur de l'acte. M. Dupont peut avoir un réseau WiFi partagé, des appareils d'un tiers connectés, un WiFi non sécurisé exploité par un voisin, ou être lui-même victime.",
            legal: "ATF 136 II 508 — L'IP est un indice, pas une preuve d'identité de l'auteur.",
            critical: true, next: "end",
          },
          {
            text: "Non — l'IP identifie l'abonné, pas l'auteur. Il faut des artefacts supplémentaires avant l'arrestation.",
            ok: true, pts: 25,
            fb: "Position correcte. L'IP est un point de départ — pas une preuve d'attribution. Il faut : logs de connexion chez M. Dupont (router logs, DHCP), identification de l'appareil source (MAC address), artefacts sur l'appareil (Prefetch, browser history).",
            legal: "ATF 136 II 508 — L'IP ne prouve que l'abonnement. Art. 197 CPP — proportionnalité des mesures de contrainte.",
            critical: false, next: 1,
          },
          {
            text: "Peut-être — selon la gravité de l'infraction.",
            ok: false, pts: -10,
            fb: "La gravité de l'infraction n'influence pas la valeur probante de l'IP. Une IP insuffisante pour une infraction mineure est aussi insuffisante pour une infraction grave.",
            legal: "Art. 139 CPP — Mode de preuve : applicable uniformément, indépendamment de la gravité.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🔍 La perquisition confirmée",
        situation: "Une perquisition chez M. Dupont révèle un routeur avec 4 appareils connectés : son laptop, son smartphone, une Smart TV et <strong>un Raspberry Pi non identifié</strong>. Les logs du routeur montrent les connexions vers le serveur piraté — depuis l'adresse MAC du Raspberry Pi.",
        law: "<strong>MAC Address</strong> — Identifie physiquement une interface réseau, pas un utilisateur.",
        question: "<strong>Que concluez-vous forensiquement ?</strong>",
        choices: [
          {
            text: "M. Dupont est innocenté — c'est le Raspberry Pi qui a attaqué.",
            ok: false, pts: -15,
            fb: "Conclusion prématurée. Le Raspberry Pi peut appartenir à M. Dupont et avoir été utilisé délibérément comme intermédiaire. Il faut analyser le Pi pour déterminer s'il était contrôlé par Dupont ou par un tiers (botnet, compromis).",
            legal: "Manuel Ch. 29.4 — Ne pas tirer de conclusions avant d'avoir analysé tous les artefacts disponibles.",
            critical: false, next: 2,
          },
          {
            text: "Les connexions suspectes proviennent du Raspberry Pi (MAC confirmé). Il faut saisir et analyser le Pi pour déterminer : propriétaire, configuration, si Dupont l'a contrôlé délibérément ou si c'est un appareil compromis.",
            ok: true, pts: 20,
            fb: "Approche correcte. Les logs MAC identifient l'appareil source — mais pas encore l'auteur humain. L'analyse forensique du Raspberry Pi permettra de déterminer si Dupont l'a utilisé consciemment.",
            legal: "Manuel Ch. 29.4 — Chaîne de causalité : IP → abonné → appareil → utilisateur. Chaque maillon doit être prouvé.",
            critical: false, next: 2,
          },
          {
            text: "Saisir uniquement le Raspberry Pi, laisser le reste.",
            ok: false, pts: -5,
            fb: "Trop restrictif. Les autres appareils peuvent révéler des informations sur la configuration du Pi (commandes SSH depuis le laptop, échanges d'emails mentionnant le Pi). Saisir tout l'écosystème réseau est nécessaire.",
            legal: "Art. 263 CPP — La saisie englobe ce qui peut servir à élucider l'infraction.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🔬 L'analyse du Raspberry Pi",
        situation: "L'analyse forensique du Raspberry Pi (Raspberry Pi OS Lite, SD card 32 Go) révèle : (1) shell bash en root permanent, (2) un binaire <code>/usr/local/bin/xmrig</code> tournant en service, (3) fichier <code>/etc/cron.d/update-agent</code> qui télécharge et exécute des scripts depuis <code>185.234.218.42</code> toutes les heures, (4) aucun bash_history utilisateur, (5) SSH écoutant sur un port non standard (2222).",
        law: "<strong>MITRE ATT&CK T1105</strong> — Ingress Tool Transfer (téléchargement depuis C2).<br><strong>XMRig</strong> — Miner Monero, souvent installé sur botnet.",
        question: "<strong>Qu'est-ce que cette configuration révèle ?</strong>",
        choices: [
          {
            text: "M. Dupont est un cryptomineur professionnel qui utilise son Pi pour générer du Monero.",
            ok: false, pts: -20,
            fb: "Conclusion contraire aux indices. Le cron.d télécharge depuis un serveur C2 externe (185.234.218.42) — un mineur légitime n'a pas besoin de recevoir des ordres d'un tiers. L'absence de bash_history et le SSH port 2222 sont typiques d'un appareil compromis par botnet.",
            legal: "Manuel Ch. 25.6 — Analyse technique objective avant qualification.",
            critical: false, next: 3,
          },
          {
            text: "Le Pi est compromis par un botnet : xmrig + C2 + cron de mise à jour + absence de bash_history + SSH non standard = signature typique d'un appareil enrôlé dans un botnet minier. M. Dupont est probablement victime.",
            ok: true, pts: 25,
            fb: "Analyse correcte. Tous les indices convergent vers une compromission externe : exfiltration de cycles CPU (xmrig) + serveur C2 connu (à vérifier dans les IoC publics) + absence de logs d'activité humaine (pas de bash_history). M. Dupont utilise probablement le Pi pour du domotique sans savoir qu'il est infecté.",
            legal: "Manuel Ch. 25.6 + MITRE T1105 — Configuration typique d'un botnet IoT (Mirai variant possible).",
            critical: false, next: 3,
          },
          {
            text: "On ne peut pas conclure sans analyser 6 mois de logs système.",
            ok: false, pts: -5,
            fb: "Trop prudent. Les indices actuels (xmrig + C2 + cron + absence bash_history) sont suffisants pour orienter l'enquête. L'analyse approfondie peut suivre, mais une qualification initiale est possible.",
            legal: "Manuel Ch. 29.3 — Conclusions provisoires fondées sur artefacts observables.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🛡 La protection collective",
        situation: "L'IoC <code>185.234.218.42</code> est un serveur C2 jusque-là inconnu du GovCERT. Vous estimez qu'il contrôle probablement des dizaines voire centaines d'autres Raspberry Pi compromis en Suisse. Que faites-vous de cette information ?",
        law: "<strong>Ordonnance OFCS</strong> — Partage volontaire d'IoC avec GovCERT/NCSC.<br><strong>Secret de fonction (Art. 320 CP)</strong> — Contraintes sur la divulgation.",
        question: "<strong>Quelle est la marche à suivre ?</strong>",
        choices: [
          {
            text: "Partager l'IoC sur Twitter immédiatement pour alerter la communauté infosec suisse.",
            ok: false, pts: -20,
            fb: "Violation du secret de fonction. Partager publiquement un IoC issu d'une enquête en cours peut alerter les attaquants (qui changeront d'infrastructure) et compromettre d'autres procédures coordonnées par le GovCERT.",
            legal: "Art. 320 CP — Secret de fonction. Les canaux officiels existent pour le partage d'IoC.",
            critical: true, next: "end",
          },
          {
            text: "Soumettre l'IoC au GovCERT/NCSC via MISP-CH avec contexte technique. Le GovCERT coordonne avec les FAI suisses pour identifier et alerter les abonnés concernés, puis diffuse l'IoC anonymisé à la communauté internationale.",
            ok: true, pts: 25,
            fb: "Procédure optimale. MISP-CH est le canal officiel. Le GovCERT dispose des relais pour une protection collective coordonnée, sans compromettre l'enquête en cours. C'est la culture de responsabilité civique en cybersécurité.",
            legal: "Ordonnance OFCS + MISP-CH — Canal officiel de partage d'IoC anonymisés.",
            critical: false, next: 4,
          },
          {
            text: "Garder l'IoC confidentiel pour l'usage exclusif de l'enquête en cours.",
            ok: false, pts: -10,
            fb: "Position trop restrictive. Un IoC partagé avec le GovCERT protège collectivement sans compromettre l'enquête (partage anonymisé). Le garder strictement pour soi prive la communauté d'une protection.",
            legal: "Ordonnance OFCS — Le partage responsable d'IoC est une pratique encouragée.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "⚖️ La notification à M. Dupont",
        situation: "Vous êtes convaincu : M. Dupont est victime d'un botnet, pas auteur. Le MP doit clore la procédure à son encontre. Comment gérez-vous la communication avec M. Dupont, qui a subi perquisition et saisie de matériel ?",
        law: "<strong>Art. 320 CPP</strong> — Classement de la procédure.<br><strong>Art. 429 CPP</strong> — Indemnisation du prévenu injustement inquiété.<br><strong>LPD 2023 Art. 33</strong> — Droit à l'information sur les données traitées.",
        question: "<strong>Quelle est la marche à suivre ?</strong>",
        choices: [
          {
            text: "Restituer le matériel sans explication — M. Dupont ne saura pas qu'il a failli être arrêté.",
            ok: false, pts: -20,
            fb: "Incorrect. M. Dupont a subi une atteinte à sa sphère privée ; il a droit à une information complète (notification de classement, raison, possibilité d'indemnisation). Le silence viole la LPD et le CPP.",
            legal: "Art. 320 + 429 CPP — Classement notifié avec motif et droits d'indemnisation.",
            critical: true, next: "end",
          },
          {
            text: "Notifier le classement avec : (1) raison technique (botnet, pas vous), (2) informations pour désinfecter ses appareils, (3) droit à indemnisation art. 429 CPP, (4) signalement préventif de l'IP botnet à Swisscom/GovCERT pour protéger d'autres abonnés.",
            ok: true, pts: 25,
            fb: "Procédure complète et éthique. Non seulement vous respectez les droits de M. Dupont, mais vous contribuez à la protection collective en signalant le botnet. C'est un DFIR responsable.",
            legal: "Art. 320 + 429 CPP + LPD 2023 Art. 33 — Classement + information + protection collective.",
            critical: false, next: "end",
          },
          {
            text: "Garder le matériel comme pièce à conviction, au cas où M. Dupont se révèlerait complice.",
            ok: false, pts: -15,
            fb: "Incorrect. Si l'enquête technique conclut à l'innocence, conserver le matériel est disproportionné (art. 197 CPP). La rétention abusive expose l'État à des poursuites.",
            legal: "Art. 197 CPP — Principe de proportionnalité : mesures ajustées aux indices.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "🌐", title: "Expert Réseau", sub: "Maîtrise parfaite de l'attribution IP" };
      if (pct >= 60) return { icon: "🔍", title: "Analyste Réseau", sub: "Bonnes bases sur les limites des IP" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez ATF 136 II 508 et Manuel Ch. 25.6" };
    },
  },

  /* ══════════════════════════════════════════════════
     6. FRONTIERES — Contrôle aux Frontières  [MEDIUM]
  ══════════════════════════════════════════════════ */
  {
    id: "frontieres",
    title: "Contrôle aux Frontières",
    icon: "🛂",
    difficulty: "medium",
    atmosphere: "legal",
    narrative: {
      success: "La procédure est respectée. Le mandat du MP obtenu en 2h a permis une saisie incontestable. Les preuves trouvées seront pleinement recevables en audience.",
      degraded: "La saisie est effectuée mais avec des réserves. Un recours du voyageur sur le fondement de l'art. 13 Cst. reste possible et peut ralentir la procédure.",
      failure: "La saisie est déclarée illégale par le TMC. Toutes les preuves obtenues sont écartées. Le voyageur dépose plainte contre l'Administration fédérale des douanes."
    },
    tags: ["DROIT", "RÉSEAUX"],
    legalRefs: ["LMAD Art. 100", "CPP Art. 245", "ATF 149 I 218", "Art. 13 Cst."],
    intro: "Un voyageur en provenance de Moscou arrive à Zurich. Un douanier veut accéder au contenu de son laptop. Le voyageur refuse de donner son mot de passe. Quels sont les droits des douaniers ?",
    alertLevel: "ZONE FRONTIÈRE — Pouvoirs et limites des autorités douanières",
    objectives: [
      { icon: "🛂", text: "Connaître les limites des pouvoirs douaniers sur les données numériques" },
      { icon: "⚖️", text: "Appliquer la jurisprudence ATF 149 I 218 (2023)" },
      { icon: "🔍", text: "Procéder correctement à la saisie forensique avec mandat" },
    ],
    debrief: "<p>Le droit douanier suisse (LMAD) et la procédure pénale (CPP) créent un cadre différent du droit commun pour les contrôles frontaliers. Les autorités douanières ont des pouvoirs élargis dans la zone frontière — mais ces pouvoirs ont des limites claires, notamment pour les données numériques et la sphère privée.</p><p>Le TF a rappelé (ATF 149 I 218, 2023) que l'accès au contenu d'un appareil numérique va au-delà du contrôle douanier ordinaire et nécessite une base légale spécifique ou un soupçon concret et documenté.</p>",
    steps: [
      {
        phase: "🛂 L'aéroport de Zurich",
        situation: "Un voyageur arrive à Zurich en provenance de Moscou. Un douanier le sélectionne pour un contrôle approfondi. Il veut <strong>accéder au contenu du laptop</strong> pour vérifier si des données classifiées y sont présentes. Le voyageur refuse de donner son mot de passe.",
        law: "<strong>LMAD Art. 100</strong> — Contrôle des marchandises à la frontière.<br><strong>CPP Art. 245</strong> — Perquisition de supports : nécessite un mandat du MP.",
        question: "<strong>Le douanier peut-il contraindre le voyageur à déverrouiller son laptop ?</strong>",
        choices: [
          {
            text: "Oui — la zone frontière donne des pouvoirs étendus aux douaniers.",
            ok: false, pts: -20,
            fb: "Non. La LMAD autorise le contrôle des marchandises (matériel physique) — pas l'accès au contenu de données numériques. L'accès aux données d'un appareil nécessite une décision du MP.",
            legal: "ATF 149 I 218 (2023) — L'accès au contenu d'un appareil numérique dépasse le contrôle douanier ordinaire.",
            critical: true, next: "end",
          },
          {
            text: "Non — sans mandat du MP ou soupçon documenté d'infraction pénale, le douanier ne peut accéder qu'à l'appareil physique, pas à son contenu numérique.",
            ok: true, pts: 25,
            fb: "Position correcte selon la jurisprudence récente. Le contrôle douanier couvre le support physique. L'accès aux données nécessite soit un soupçon concret d'infraction pénale et un ordre du MP, soit le consentement volontaire.",
            legal: "ATF 149 I 218 (2023) — Contrôle numérique aux frontières : base légale exigée. Art. 13 Cst. — Protection de la sphère privée.",
            critical: false, next: 1,
          },
          {
            text: "Peut-être — selon la nationalité du voyageur.",
            ok: false, pts: -15,
            fb: "La nationalité n'influence pas les droits fondamentaux devant les autorités suisses. Tous les voyageurs sur le territoire suisse bénéficient de la protection de l'art. 13 Cst.",
            legal: "Art. 13 Cst. — Protection de la sphère privée applicable à toute personne sur le territoire suisse.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🚨 Le soupçon se précise",
        situation: "Le douanier a trouvé dans les bagages un appareil non déclaré et des documents à en-tête d'une entreprise militaire russe. Une ordonnance du MP est obtenue en 2 heures.",
        law: "<strong>Art. 245 CPP</strong> — Perquisition de supports de données avec ordonnance du MP.",
        question: "<strong>La perquisition du laptop est maintenant possible. Comment procéder ?</strong>",
        choices: [
          {
            text: "Allumer le laptop sur place et parcourir les fichiers avec le douanier.",
            ok: false, pts: -20,
            fb: "Procédure incorrecte. Allumer un appareil directement sans write blocker risque de modifier des timestamps et des fichiers système. La perquisition forensique doit être faite en laboratoire.",
            legal: "Manuel Ch. 11.1 — Ne jamais allumer un appareil directement lors d'une saisie. ACPO Principle 1 — Aucune action ne doit modifier des données.",
            critical: true, next: "end",
          },
          {
            text: "Saisir le laptop éteint sous scellés, documenter l'état, transférer au laboratoire forensique pour acquisition avec write blocker.",
            ok: true, pts: 20,
            fb: "Procédure correcte. Saisie documentée + scellés + transfer en laboratoire. Si le laptop est allumé au moment de la saisie, le dilemme live/dead forensics s'applique.",
            legal: "Art. 267 CPP — Saisie documentée. Manuel Ch. 11.1 — Acquisition en laboratoire avec write blocker.",
            critical: false, next: 2,
          },
          {
            text: "Demander au voyageur de déverrouiller lui-même l'appareil avant la saisie.",
            ok: false, pts: -10,
            fb: "Le voyageur n'a aucune obligation de coopérer (Art. 113 CPP — droit au silence). Une demande insistante peut être qualifiée de contrainte et invalider la saisie. Procéder avec l'appareil verrouillé et s'en remettre au laboratoire.",
            legal: "Art. 113 CPP — Droit au silence de la personne visée par la mesure.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🧳 Les affaires personnelles",
        situation: "Outre le laptop, le voyageur a un smartphone Android chiffré, deux clés USB non déclarées (suspectes), une clé de sécurité YubiKey, et un carnet manuscrit avec des suites de mots en russe. Le MP demande si tout doit être saisi.",
        law: "<strong>Art. 263 CPP</strong> — Séquestre ciblé, proportionnalité.<br><strong>Art. 248 CPP</strong> — Scellés sur objets saisis.<br><strong>Art. 264 CPP</strong> — Objets protégés (correspondance privée).",
        question: "<strong>Quel périmètre de saisie recommandez-vous ?</strong>",
        choices: [
          {
            text: "Saisir uniquement le laptop — c'est lui qui fait l'objet du soupçon.",
            ok: false, pts: -15,
            fb: "Trop restrictif. Le smartphone et les clés USB peuvent contenir des éléments corrélatifs critiques (communications, crypto keys, backup). La YubiKey peut protéger des conteneurs chiffrés. Le carnet peut contenir une seed phrase crypto ou BIP-39.",
            legal: "Art. 263 CPP — Saisie proportionnée à l'objectif : ici, un écosystème numérique cohérent.",
            critical: false, next: 3,
          },
          {
            text: "Saisir l'écosystème complet (laptop, smartphone, clés USB, YubiKey, carnet) sous scellés, avec inventaire détaillé. Le tri TMC décidera ensuite de ce qui peut être analysé.",
            ok: true, pts: 25,
            fb: "Approche correcte. En DFIR moderne, les appareils fonctionnent en écosystème : un volume chiffré sur laptop peut être déverrouillé par YubiKey + seed dans carnet. Saisir tout sous scellés préserve la cohérence, et le TMC triera.",
            legal: "Art. 263 + 248 CPP — Saisie cohérente + scellés = chaîne de custody préservée jusqu'au tri judiciaire.",
            critical: false, next: 3,
          },
          {
            text: "Saisir tout, y compris les affaires personnelles du voyageur (vêtements, livres non numériques).",
            ok: false, pts: -20,
            fb: "Disproportionné. Le séquestre doit cibler les supports de données et objets liés à l'infraction soupçonnée. Les vêtements, livres non numériques, nourriture etc. ne relèvent pas d'une saisie numérique.",
            legal: "Art. 197 CPP — Principe de proportionnalité dans les mesures de contrainte.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🔐 La demande de scellés",
        situation: "Le voyageur, assisté par avocat, invoque l'Art. 248 CPP et demande la mise sous scellés de tous les dispositifs saisis. Il argue que certaines données concernent sa défense pénale et relèvent du secret professionnel avocat-client.",
        law: "<strong>Art. 248 CPP</strong> — Scellés : suspension de l'analyse jusqu'à décision TMC.<br><strong>Art. 264 CPP</strong> — Objets protégés (correspondance avec avocat).<br><strong>TF 1B_602/2020</strong> — Tri préalable obligatoire.",
        question: "<strong>Quelle position prenez-vous face à cette demande ?</strong>",
        choices: [
          {
            text: "Refuser la mise sous scellés — le mandat du MP l'emporte sur l'art. 248 CPP.",
            ok: false, pts: -25,
            fb: "Erreur grave. L'art. 248 CPP est un droit procédural indépendant du mandat. Refuser les scellés est une violation qui invalide l'ensemble de la saisie. Le mandat MP permet la saisie, pas l'analyse sans scellés quand demandés.",
            legal: "Art. 248 CPP — Droit fondamental non subordonné au mandat de saisie.",
            critical: true, next: "end",
          },
          {
            text: "Accepter les scellés, documenter l'état actuel (hashes, photos), préparer un dossier solide pour le TMC argumentant la levée partielle sur les éléments non-protégés.",
            ok: true, pts: 25,
            fb: "Procédure correcte. L'acceptation des scellés est obligatoire. La documentation pré-scellés + argumentaire TMC permet une levée ciblée sur les éléments pertinents à l'enquête (hors correspondance avocat).",
            legal: "Art. 248 CPP + TF 1B_602/2020 — Acceptation + tri judiciaire ciblé.",
            critical: false, next: 4,
          },
          {
            text: "Accepter les scellés sur tout sans contester, même sur les éléments techniques non-protégés.",
            ok: false, pts: -10,
            fb: "Position trop passive. Certains éléments (clés USB, laptop hors emails avocat) ne sont pas protégés par le secret professionnel. Ne pas préparer d'argumentation pour le TMC = perdre 6 mois d'analyse possible.",
            legal: "Art. 264 CPP — Seuls les éléments spécifiquement protégés bénéficient de l'exemption.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "⚖️ L'audience TMC",
        situation: "Le Tribunal des mesures de contrainte (TMC) de Zurich examine la demande de levée des scellés 15 jours après la saisie. L'avocat conteste la légalité même du contrôle initial en frontière, invoquant l'ATF 149 I 218.",
        law: "<strong>ATF 149 I 218 (2023)</strong> — Contrôle numérique aux frontières exige base légale spécifique.<br><strong>Art. 141 CPP</strong> — Exploitation des preuves.",
        question: "<strong>Comment répondez-vous à l'argument ATF 149 I 218 ?</strong>",
        choices: [
          {
            text: "L'ATF ne s'applique pas aux contrôles douaniers — il concerne les contrôles de police ordinaires.",
            ok: false, pts: -20,
            fb: "Lecture erronée. L'ATF 149 I 218 s'applique précisément au contexte douanier numérique. Soutenir le contraire devant le TMC discrédite toute la procédure.",
            legal: "ATF 149 I 218 (2023) — Jurisprudence valable en zone frontière pour données numériques.",
            critical: true, next: "end",
          },
          {
            text: "L'ATF 149 I 218 exige une base légale : nous l'avons (ordonnance MP obtenue après soupçon concret documenté — appareil non déclaré + documents sensibles). Le contrôle initial était matériel (marchandise), l'accès numérique a été fait sur ordre MP.",
            ok: true, pts: 25,
            fb: "Argument juridique solide. L'ATF n'interdit pas le contrôle numérique en frontière — il exige une base légale. Ici, la chronologie (contrôle physique → soupçon concret → ordre MP → saisie numérique) respecte les exigences ATF.",
            legal: "ATF 149 I 218 + Art. 245 CPP — Conformité procédurale établie.",
            critical: false, next: "end",
          },
          {
            text: "Accepter la contestation et renoncer à la procédure pour éviter un arrêt défavorable.",
            ok: false, pts: -15,
            fb: "Capitulation prématurée. La procédure est juridiquement défendable si les étapes ont été correctement respectées. Renoncer envoie un signal faible à la défense et aux autres enquêtes similaires.",
            legal: "Pratique MP — Défendre une procédure conforme = préserver les outils d'enquête futurs.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "🛂", title: "Expert Droit Frontalier", sub: "Maîtrise parfaite des pouvoirs douaniers numériques" };
      if (pct >= 60) return { icon: "⚖️", title: "Juriste Forensique", sub: "Bonnes bases sur les limites douanières" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez ATF 149 I 218 et LMAD" };
    },
  },

  /* ══════════════════════════════════════════════════
     7. RANSOMWARE (Hôpital)  [MEDIUM]
  ══════════════════════════════════════════════════ */
  {
    id: "ransomware",
    title: "Ransomware à l'Hôpital",
    icon: "🏥",
    difficulty: "medium",
    atmosphere: "hospital",
    narrative: {
      success: "Les preuves forensiques sont préservées, le PFPDT notifié dans les délais, l'hôpital restaure depuis des backups sains. L'équipe DFIR identifie le groupe criminel. Aucune sanction LPD. Les blocs opératoires n'ont jamais été interrompus.",
      degraded: "La restauration a eu lieu mais certaines preuves sont perdues. Le PFPDT est notifié tardivement. Une enquête administrative est ouverte — l'hôpital devra renforcer ses procédures.",
      failure: "Les preuves sont détruites par la restauration hâtive. Le PFPDT apprend la violation par la presse. L'hôpital écope d'une sanction LPD maximale et d'une couverture médiatique désastreuse. 12'000 patients poursuivent."
    },
    tags: ["WINDOWS", "DROIT"],
    legalRefs: ["LPD 2023 Art. 24", "Manuel Ch. 11.1", "ISO/IEC 27035"],
    intro: "03h00. L'hôpital cantonal est frappé par un ransomware. L'équipe IT veut restaurer depuis les backups immédiatement. Mais capturer les preuves maintenant ou les perdre à jamais ?",
    alertLevel: "INCIDENT CRITIQUE — Données de 12'000 patients menacées",
    objectives: [
      { icon: "🔬", text: "Capturer les preuves forensiques avant la remédiation" },
      { icon: "📣", text: "Respecter les obligations LPD 2023 (notification PFPDT)" },
      { icon: "⚖️", text: "Équilibrer impératifs opérationnels et forensiques" },
    ],
    debrief: "<p>Ce scénario illustre la tension entre les obligations légales (LPD 2023 — notification PFPDT), les impératifs opérationnels (maintien des soins) et les besoins forensiques (préservation des preuves avant toute remédiation).</p><p>La règle d'or : <strong>capturer les preuves avant d'éteindre ou de restaurer</strong>. Un ransomware actif en RAM peut laisser des clés de déchiffrement et des indicateurs de compromission. La restauration depuis backup détruit irrémédiablement ces preuves.</p>",
    steps: [
      {
        phase: "🏥 L'alerte à 3h du matin",
        situation: "L'hôpital cantonal est frappé par un ransomware. Les serveurs de dossiers patients affichent une demande de rançon. <strong>Les blocs opératoires fonctionnent toujours sur des systèmes isolés</strong>. L'équipe IT veut restaurer depuis les backups immédiatement.",
        law: "<strong>LPD 2023 Art. 24</strong> — Notification PFPDT «\u00a0dans les meilleurs délais\u00a0».<br><strong>Manuel Ch. 11.1</strong> — Capturer les preuves avant toute remédiation.",
        question: "<strong>L'équipe IT veut restaurer dans l'heure. Quelle est votre position ?</strong>",
        choices: [
          {
            text: "Autoriser la restauration immédiate — les vies des patients priment sur les preuves.",
            ok: false, pts: -15,
            fb: "Trop hâtif. Les blocs opératoires fonctionnent sur systèmes isolés — il n'y a pas d'urgence vitale immédiate sur les serveurs administratifs. Une capture rapide des preuves (30-60 min) est faisable avant restauration.",
            legal: "Manuel Ch. 11.1 — La restauration sans capture préalable détruit les preuves. Raisonnement proportionnel obligatoire.",
            critical: false, next: "end",
          },
          {
            text: "Capture prioritaire : dump RAM des serveurs affectés + snapshot réseau avant toute action IT.",
            ok: true, pts: 25,
            fb: "Décision correcte. 30-60 minutes de capture forensique permettent de récupérer : clés de déchiffrement potentielles en RAM, IOC, latéralisation réseau. Les systèmes de soins critiques sont isolés et non impactés.",
            legal: "Manuel Ch. 11.1 — RAM first. L'attribution forensique nécessite les artefacts des systèmes compromis avant remédiation.",
            critical: false, next: 1,
          },
          {
            text: "Couper internet de l'hôpital et attendre les forces de l'ordre.",
            ok: false, pts: -10,
            fb: "Partiellement correct (isolation réseau = bonne pratique) mais attendre passivement est une erreur. L'isolation réseau doit s'accompagner d'une capture forensique active.",
            legal: "ISO/IEC 27035 — Isolation + capture simultanées lors d'un incident de sécurité.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "📣 La notification LPD",
        situation: "48 heures plus tard, l'analyse confirme : <strong>données personnelles de 12'000 patients exfiltrées</strong> avant chiffrement. Le groupe ransomware menace de publier si la rançon n'est pas payée dans 72h.",
        law: "<strong>LPD 2023 Art. 24</strong> — Notification au PFPDT obligatoire si risque élevé.<br><strong>PFPDT</strong> — Délai : «\u00a0dans les meilleurs délais\u00a0».",
        question: "<strong>Quand et comment notifier le PFPDT ?</strong>",
        choices: [
          {
            text: "Notifier le PFPDT immédiatement, avant même de connaître l'étendue de la violation.",
            ok: false, pts: -5,
            fb: "Trop précipité. La LPD 2023 demande une notification quand on peut évaluer le risque. Une notification incomplète avec des informations erronées est pire qu'une notification un peu tardive mais précise.",
            legal: "LPD 2023 Art. 24 — Notifier avec les informations disponibles sur la nature, les catégories de données et les mesures prises.",
            critical: false, next: 2,
          },
          {
            text: "Notifier le PFPDT avec les éléments confirmés : 12'000 patients, données de santé, exfiltration confirmée, mesures prises.",
            ok: true, pts: 20,
            fb: "Correct. La notification LPD 2023 doit contenir : nature de la violation, catégories et volume de données, groupes de personnes concernées, conséquences probables, mesures prises.",
            legal: "LPD 2023 Art. 24 al. 1 — Données de santé → risque élevé par définition.",
            critical: false, next: 2,
          },
          {
            text: "Payer la rançon discrètement pour éviter la publication et notifier dans 30 jours.",
            ok: false, pts: -30,
            fb: "Erreur grave à double niveau. (1) Payer finance des activités criminelles et ne garantit pas la non-publication. (2) 30 jours = violation flagrante de la LPD 2023.",
            legal: "LPD 2023 Art. 24 — Délai : meilleurs délais ≠ 30 jours. GovCERT déconseille fortement le paiement de rançons.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🧪 L'identification du groupe",
        situation: "L'analyse forensique révèle : note de rançon signée <code>Ryuk</code>, note écrite en anglais approximatif, utilisation de TrickBot en préambule, extension <code>.ryk</code> sur les fichiers chiffrés, propagation via PsExec + SMB. Le GovCERT vous demande une attribution provisoire.",
        law: "<strong>MITRE ATT&CK</strong> — TTPs Ryuk : T1566 (phishing) → T1219 (TrickBot) → T1021.002 (SMB lateral).<br><strong>Manuel Ch. 29.1</strong> — L'attribution technique précède l'attribution géopolitique.",
        question: "<strong>Comment formulez-vous l'attribution pour le GovCERT ?</strong>",
        choices: [
          {
            text: "« L'attaque est signée Ryuk, donc menée par le groupe Wizard Spider basé en Russie. »",
            ok: false, pts: -15,
            fb: "Attribution géopolitique prématurée. Les TTPs Ryuk sont vendus/loués sur des marketplaces. Une signature Ryuk n'implique plus automatiquement Wizard Spider. L'attribution étatique est réservée aux services de renseignement.",
            legal: "Manuel Ch. 29.1 — Distinguer TTP technique (observable) et attribution géopolitique (réservée aux services).",
            critical: false, next: 4,
          },
          {
            text: "« Les TTPs observés (note Ryuk, TrickBot-loader, chiffrement .ryk, propagation SMB) correspondent au profil technique du ransomware Ryuk / variant Conti. L'attribution à un groupe spécifique relève des services de renseignement et n'est pas de notre ressort. »",
            ok: true, pts: 25,
            fb: "Formulation forensique correcte. Elle établit les faits techniques (TTPs observés) sans préjuger de l'identité des opérateurs. Le GovCERT peut ensuite corréler avec ses propres sources.",
            legal: "Manuel Ch. 29.1 — Attribution technique observable + séparation des rôles DFIR/renseignement.",
            critical: false, next: 4,
          },
          {
            text: "Refuser toute attribution — on ne peut rien conclure.",
            ok: false, pts: -10,
            fb: "Trop défaitiste. Les TTPs observables permettent une attribution technique qui aide à anticiper le comportement de l'attaquant (chiffrement, exfiltration, contact). Refuser l'analyse = priver l'équipe de réponse d'informations utiles.",
            legal: "Manuel Ch. 29.1 — L'attribution technique est un livrable forensique attendu.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "👪 L'annonce aux patients",
        situation: "L'analyse confirme : données de 12'000 patients exfiltrées. Parmi elles, des diagnostics psychiatriques, des traitements VIH, des suivis oncologiques — des données ultra-sensibles. La direction hésite entre (A) envoi postal individuel, (B) email de masse, (C) communiqué de presse public uniquement.",
        law: "<strong>LPD 2023 Art. 24 al. 3</strong> — Information des personnes concernées si risque élevé.<br><strong>Secret médical (Art. 321 CP)</strong> — Devoir renforcé pour données de santé.<br><strong>CEDH Art. 8</strong> — Protection de la vie privée.",
        question: "<strong>Quelle stratégie d'annonce recommandez-vous ?</strong>",
        choices: [
          {
            text: "Communiqué de presse public uniquement — plus rapide et moins coûteux.",
            ok: false, pts: -25,
            fb: "Insuffisant. Les patients concernés ne liront peut-être pas le communiqué. La LPD 2023 exige une information DIRECTE quand le risque est élevé — ce qui est le cas pour des données de santé.",
            legal: "LPD 2023 Art. 24 al. 3 — Information directe obligatoire (pas uniquement presse).",
            critical: true, next: "end",
          },
          {
            text: "Envoi postal individuel aux 12'000 patients avec : (1) nature précise de leurs données concernées, (2) actions à prendre (vigilance phishing, signalement), (3) hotline dédiée, (4) droit à indemnisation, (5) communiqué public séparé sans nommer de patients.",
            ok: true, pts: 25,
            fb: "Approche conforme et éthique. Le postal garantit la réception par des patients parfois peu numériques (personnes âgées notamment). La hotline rassure. Le communiqué public assume publiquement l'incident sans violer le secret médical individuel.",
            legal: "LPD 2023 Art. 24 al. 3 + Art. 321 CP — Information directe + respect du secret médical.",
            critical: false, next: 4,
          },
          {
            text: "Email de masse aux 12'000 patients.",
            ok: false, pts: -10,
            fb: "Acceptable pour informations de masse mais insuffisant pour des données sensibles médicales. Certains patients (âgés, vulnérables) n'ont pas d'email actif ou ne liront pas ce type de communication. Préférer le courrier pour des données de santé.",
            legal: "LPD 2023 + Pratique PFPDT — Canal adapté à la population concernée et à la gravité.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "💰 Le dilemme du paiement",
        situation: "Le CEO de l'hôpital vous consulte : le groupe demande 800'000 USD en BTC. Argument : « c'est moins cher que les frais juridiques, l'amende PFPDT et les dégâts réputationnels combinés ». Le conseil d'administration se réunit dans 2h.",
        law: "<strong>GovCERT/NCSC</strong> — Recommandation officielle : ne pas payer.<br><strong>SECO</strong> — Paiement à groupes sanctionnés = infraction pénale.<br><strong>OFAC / EU Sanctions</strong> — Plusieurs opérateurs ransomware sont listés.",
        question: "<strong>Votre conseil au CEO ?</strong>",
        choices: [
          {
            text: "Payer rapidement pour éviter la publication — c'est une décision économique rationnelle.",
            ok: false, pts: -30,
            fb: "Erreur multiple. (1) Aucune garantie de non-publication ou de déchiffrement. (2) Financement direct de la criminalité, favorise les attaques futures. (3) Si le groupe est sous sanctions (vérifier OFAC/SECO), infraction pénale ajoutée. (4) Statistiques : 80% des payeurs sont re-attaqués dans l'année.",
            legal: "GovCERT 2023 + SECO Sanctions — Paiement = risques juridiques, financiers et stratégiques cumulés.",
            critical: true, next: "end",
          },
          {
            text: "Refuser le paiement. Investir le budget équivalent dans (1) reconstruction depuis backups validés, (2) renforcement technique (EDR, MFA, segmentation), (3) communication transparente aux patients. Position publique claire : l'hôpital ne finance pas la criminalité.",
            ok: true, pts: 25,
            fb: "Position conforme à la doctrine GovCERT et aux cas modèles suisses (Stadler Rail 2020, Comparis 2021). Le refus, bien communiqué, devient un atout réputationnel. Les patients apprécient une institution qui défend ses principes.",
            legal: "GovCERT/NCSC + retour d'expérience Stadler 2020 — Le refus du paiement = standard suisse.",
            critical: false, next: "end",
          },
          {
            text: "Négocier à 400'000 USD pour « limiter la casse ».",
            ok: false, pts: -20,
            fb: "Négocier valide le modèle criminel. Le groupe apprend que cet hôpital est un payeur — une prochaine attaque suivra. De plus, la moitié du montant reste une somme colossale détournée des soins.",
            legal: "Doctrine GovCERT — Négocier reconnaît la valeur du chantage.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "🏥", title: "Expert DFIR Hospitalier", sub: "Maîtrise parfaite de la réponse à incident" };
      if (pct >= 60) return { icon: "🔍", title: "Analyste Incident", sub: "Bonnes bases en réponse à incident" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez Manuel Ch. 11.1 et LPD 2023 Art. 24" };
    },
  },

  /* ══════════════════════════════════════════════════
     8. SMARTPHONE — Le Smartphone Déverrouillé  [MEDIUM]
  ══════════════════════════════════════════════════ */
  {
    id: "smartphone",
    title: "Le Smartphone Déverrouillé",
    icon: "📱",
    difficulty: "medium",
    atmosphere: "legal",
    narrative: {
      success: "Le TMC ordonne un tri préalable par un juge neutre. Les données pertinentes à l'enquête sont remises — les données privées non pertinentes restent scellées. La défense ne peut rien contester, la procédure est irréprochable.",
      degraded: "La procédure est suivie mais le délai de 20 jours bloque significativement l'enquête. Le MP grogne mais ne peut rien faire.",
      failure: "L'analyse prématurée entraîne l'exclusion totale des preuves du téléphone (art. 141 CPP). L'avocat a gagné — et Signal protège à jamais les échanges qu'il aurait fallu analyser."
    },
    tags: ["DROIT", "FORENSIQUE"],
    legalRefs: ["Art. 248 CPP", "Art. 141 CPP", "TF 1B_602/2020"],
    intro: "L'iPhone du suspect est posé sur la table, déverrouillé. Des notifications Signal sont visibles. L'avocat de la défense entre dans l'appartement et annonce les scellés. Chaque seconde compte.",
    alertLevel: "SCELLÉS IMMINENTS — Fenêtre d'action légale très limitée",
    objectives: [
      { icon: "📱", text: "Agir dans le cadre légal face à une demande de scellés (Art. 248 CPP)" },
      { icon: "🛡️", text: "Préserver les preuves sans violer la procédure" },
      { icon: "⚖️", text: "Défendre une levée partielle des scellés devant le TMC" },
    ],
    debrief: "<p>Le mécanisme des scellés (art. 248 CPP) est une spécificité helvétique. Une fois demandés, <strong>toute analyse doit cesser immédiatement</strong>. Mais la mise sous Faraday préalable est une mesure de préservation, non d'analyse — elle est donc compatible avec une demande de scellés.</p><p><strong>TF 1B_602/2020</strong> : quand le propriétaire désigne avec précision les données privées, le TMC ordonne un tri préalable. Le résultat : l'enquête est bloquée 20 jours minimum.</p>",
    steps: [
      {
        phase: "📱 Le téléphone ouvert",
        situation: "Lors d'une perquisition, vous trouvez l'iPhone du suspect posé sur la table, <strong>déverrouillé et avec une session active</strong>. Les notifications de l'app Signal sont visibles à l'écran. L'avocat de la défense entre dans l'appartement.",
        law: "<strong>Art. 248 CPP</strong> — Demande de scellés possible à tout moment par le propriétaire ou son représentant.<br><strong>Art. 245 CPP</strong> — La saisie est autorisée par le mandat en cours.",
        question: "<strong>L'avocat annonce qu'il va demander les scellés. Quelle est votre première action ?</strong>",
        choices: [
          {
            text: "Commencer immédiatement l'extraction des données Signal pendant que vous en avez encore accès.",
            ok: false, pts: -30,
            fb: "Erreur grave. Une fois l'avocat présent et la demande de scellés annoncée, toute analyse est une violation procédurale (art. 141 CPP). Les données obtenues seraient potentiellement exclues.",
            legal: "Art. 141 CPP — Preuve illicite : exclusion possible si violation essentielle de la procédure.",
            critical: true, next: "end",
          },
          {
            text: "Placer immédiatement le téléphone dans une pochette Faraday et documenter l'état de l'écran.",
            ok: true, pts: 25,
            fb: "Action correcte. La pochette Faraday isole le téléphone du réseau (empêche effacement à distance) sans constituer une analyse. C'est une mesure de préservation compatible avec les scellés à venir.",
            legal: "Manuel Ch. 11.2 — Isolation réseau = préservation, pas analyse. Art. 248 CPP ne s'oppose pas à la préservation physique.",
            critical: false, next: 1,
          },
          {
            text: "Photographier l'écran pour documenter les notifications Signal visibles.",
            ok: true, pts: 10,
            fb: "Acceptable mais insuffisant seul. Photographier ce qui est visible à l'écran documente l'état initial — ce n'est pas une analyse forensique. Mais la Faraday reste la priorité.",
            legal: "Manuel Ch. 11.1 — Documentation de l'état initial : action légitime avant mise sous scellés.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "⚖️ Le TMC tranche",
        situation: "Le TMC a reçu la demande de scellés. L'avocat a précisément listé : app Signal, Photos personnelles, app Mail. Il invoque la sphère privée. Le TMC a 20 jours pour statuer (art. 248 al. 3 CPP). Il vous demande votre position sur la levée des scellés.",
        law: "<strong>TF 1B_602/2020</strong> — Désignation précise → tri préalable obligatoire.<br><strong>Art. 248 al. 3 CPP</strong> — TMC statue dans les 20 jours.",
        question: "<strong>Quelle position défendez-vous devant le TMC ?</strong>",
        choices: [
          {
            text: "Levée totale — l'enquête criminelle prime sur la sphère privée.",
            ok: false, pts: -10,
            fb: "Trop radical. Le TF a clairement dit (1B_602/2020) que quand le propriétaire désigne précisément des données privées, un tri préalable s'impose. Une levée totale sera refusée.",
            legal: "TF 1B_602/2020 — Obligation de tri quand désignation précise des données privées.",
            critical: false, next: 2,
          },
          {
            text: "Levée partielle avec tri : accès aux apps de communication professionnelle et metadata, exclusion des photos et messages privés non liés à l'enquête.",
            ok: true, pts: 20,
            fb: "Position conforme à la jurisprudence fédérale. Le TMC peut ordonner un tri par un juge neutre qui remet à l'enquête uniquement les données pertinentes.",
            legal: "TF 1B_602/2020 — Tri préalable par un juge neutre, remise des seules données pertinentes à l'enquête.",
            critical: false, next: 2,
          },
          {
            text: "Refus de levée — l'argumentation de l'avocat est correcte.",
            ok: false, pts: -5,
            fb: "Trop défaitiste. La désignation précise de certaines données privées ne bloque pas l'accès à toutes les données — un tri permet d'accéder aux éléments pertinents.",
            legal: "Art. 248 CPP — La protection de la sphère privée est proportionnelle. Elle ne bloque pas l'enquête, elle la canalise.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🔬 Le tri par le juge neutre",
        situation: "Le TMC désigne un juge neutre pour procéder au tri. Votre rôle d'expert DFIR : fournir une extraction forensique complète du téléphone (via Cellebrite UFED) et une liste d'IoC/mots-clés permettant au juge de filtrer ce qui est pertinent à l'enquête.",
        law: "<strong>TF 1B_602/2020</strong> — L'expert fournit les outils, le juge décide.<br><strong>Cellebrite UFED Physical</strong> — Extraction iPhone avec keychain access.",
        question: "<strong>Que fournissez-vous au juge neutre ?</strong>",
        choices: [
          {
            text: "L'image forensique complète brute (100 Go), en disant au juge de « chercher lui-même ».",
            ok: false, pts: -20,
            fb: "Irresponsable. Un juge n'est pas technicien : il ne peut pas naviguer dans une image forensique brute. Votre rôle d'expert est de rendre les données exploitables pour la décision judiciaire — sinon le tri n'aboutit jamais.",
            legal: "Art. 184 CPP — L'expert facilite la compréhension technique pour le juge.",
            critical: false, next: 3,
          },
          {
            text: "L'extraction complète + un index navigable par catégorie (Signal, Mail, Photos, Contacts, Browser) + une liste de mots-clés liés à l'enquête (noms, dates, montants) que le juge peut appliquer en filtre. Interface Cellebrite Reader simplifiée.",
            ok: true, pts: 25,
            fb: "Approche optimale. L'index catégorisé + mots-clés ciblés permettent au juge neutre d'identifier efficacement ce qui est pertinent. Cellebrite Reader est conçu précisément pour les non-techniciens.",
            legal: "TF 1B_602/2020 + Art. 184 CPP — Outils adaptés = tri efficace.",
            critical: false, next: 3,
          },
          {
            text: "Fournir uniquement les données que vous jugez pertinentes — plus efficace pour le juge.",
            ok: false, pts: -25,
            fb: "Violation grave du rôle d'expert. Pré-filtrer les données avant le tri judiciaire revient à se substituer au juge. Le tri est par définition la prérogative judiciaire. L'expert fournit tout, le juge trie.",
            legal: "TF 1B_602/2020 — Le tri est judiciaire, pas technique.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📡 Le compte cloud",
        situation: "Le téléphone est synchronisé avec iCloud. Vous remarquez que des échanges Signal ont été archivés dans iCloud (en chiffré Apple). Le MP demande si on peut accéder à ces archives. Le compte iCloud du suspect est opérationnel sur un autre appareil.",
        law: "<strong>Art. 269 CPP</strong> — Surveillance de correspondance (déjà délivrée → données passées).<br><strong>MLAT CH-USA + Apple Law Enforcement Guidelines</strong>.<br><strong>iCloud E2E encryption (Advanced Data Protection)</strong> — Apple ne peut pas décrypter si activé.",
        question: "<strong>Comment procédez-vous pour les archives iCloud ?</strong>",
        choices: [
          {
            text: "Se connecter à iCloud avec les identifiants trouvés sur le téléphone et télécharger tout.",
            ok: false, pts: -30,
            fb: "Surveillance illégale caractérisée. L'accès à un compte cloud vivant (où de nouvelles données arrivent) constitue une surveillance de télécommunications (Art. 269 CPP) qui exige une ordonnance SPÉCIFIQUE distincte de la saisie du téléphone. Sans elle, toutes les données obtenues sont exclues + plainte pénale possible.",
            legal: "Art. 269 CPP — La surveillance d'un compte en ligne exige ordonnance dédiée.",
            critical: true, next: "end",
          },
          {
            text: "Demander au MP une ordonnance Art. 269 CPP spécifique, puis requête MLAT/Apple Law Enforcement Portal pour obtenir les backups iCloud non-E2E. Si Advanced Data Protection activé → accès impossible, inutile d'essayer.",
            ok: true, pts: 25,
            fb: "Procédure correcte. Ordonnance dédiée → voie officielle Apple. Si l'utilisateur a activé Advanced Data Protection (E2E), Apple ne possède pas les clés et ne peut rien fournir — un fait technique à accepter.",
            legal: "Art. 269 CPP + Apple LE Guidelines — Canal officiel, respect de la chiffrement E2E.",
            critical: false, next: 4,
          },
          {
            text: "Extraire uniquement les données présentes localement sur l'iPhone — ignorer iCloud.",
            ok: false, pts: -5,
            fb: "Trop restrictif. Les archives iCloud peuvent contenir des messages supprimés localement mais conservés en cloud. Renoncer sans tenter la voie légale = perdre des preuves potentielles. La bonne approche est de tenter via ordonnance dédiée.",
            legal: "Pratique DFIR — Exhaustivité des sources + respect du cadre légal.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "📋 La rédaction du rapport final",
        situation: "Le tri judiciaire a abouti : 180 messages Signal, 23 emails et 47 photos sont déclarés pertinents et remis à l'enquête. Les autres sont écartés. Vous rédigez le rapport forensique final pour le MP.",
        law: "<strong>Manuel Ch. 29.3</strong> — Distinction fait/interprétation/opinion.<br><strong>Art. 141 CPP</strong> — Exploitation des preuves.",
        question: "<strong>Comment structurez-vous la section « résultats de l'extraction » ?</strong>",
        choices: [
          {
            text: "Présenter les 250 éléments comme un tout indifférencié, en les mélangeant sans distinguer la procédure de tri.",
            ok: false, pts: -15,
            fb: "Mélange dangereux. Si le rapport confond les éléments admis par le tri avec ceux exclus, la défense pourra contester l'ensemble. La structure claire par catégorie de recevabilité est essentielle.",
            legal: "Art. 141 CPP — Distinction nette entre preuves exploitables et non exploitables.",
            critical: false, next: "end",
          },
          {
            text: "Structurer en 3 sections : (1) Éléments admis par le tri TMC (détaillés), (2) Éléments écartés par le tri (mention sans contenu), (3) Éléments non extraits (encore chiffrés, cloud E2E). Chaque section documente la procédure et les hashes associés.",
            ok: true, pts: 25,
            fb: "Structure forensique exemplaire. Elle distingue clairement les statuts procéduraux, permet au MP et à la défense de contrôler la conformité du tri, et préserve la recevabilité des éléments admis.",
            legal: "Manuel Ch. 29.7 + Art. 141 CPP — Structure rigoureuse = robustesse devant juge.",
            critical: false, next: "end",
          },
          {
            text: "Ne mentionner que les éléments admis, passer sous silence les éléments écartés.",
            ok: false, pts: -20,
            fb: "Omission problématique. Mentionner l'existence d'éléments écartés (sans révéler leur contenu) est important pour la transparence procédurale. Taire leur existence peut être qualifié de dissimulation en cas de recours.",
            legal: "Art. 182 CPP — Transparence de la procédure, même sur les éléments non exploitables.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "📱", title: "Expert Scellés", sub: "Maîtrise parfaite de la procédure de scellés suisse" };
      if (pct >= 60) return { icon: "⚖️", title: "Juriste Forensique", sub: "Bonnes bases sur Art. 248 CPP" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez Art. 248 CPP et TF 1B_602/2020" };
    },
  },

  /* ══════════════════════════════════════════════════
     9. TROIS_ARTEFACTS — Les 3 Artefacts  [MEDIUM]
  ══════════════════════════════════════════════════ */
  {
    id: "trois_artefacts",
    title: "Les 3 Artefacts",
    icon: "🔍",
    difficulty: "medium",
    atmosphere: "",
    narrative: {
      success: "La corrélation des 3 artefacts convaincs le juge. La défense tente l'argument du logiciel de synchronisation, mais ne peut pas l'étayer techniquement face à votre démonstration. Condamnation obtenue pour vol de données.",
      degraded: "Le juge accepte la corrélation mais demande une expertise contradictoire. L'affaire traîne plusieurs mois.",
      failure: "L'expert de la défense obtient le rejet du rapport. Les 3 artefacts sont écartés individuellement, la corrélation n'est pas retenue. Le suspect est acquitté au bénéfice du doute."
    },
    tags: ["FORENSIQUE", "WINDOWS"],
    legalRefs: ["Manuel Ch. 2.5", "Art. 139 CPP", "Manuel Ch. 18", "ATF 147 IV 409"],
    intro: "X-Ways vous présente 3 artefacts convergents : ShellBag, USBSTOR, fichier .lnk. Tout pointe vers le même événement. Mais comment formuler la conclusion et résister à l'avocat de la défense ?",
    alertLevel: "PREUVE INDICIAIRE — Corrélation multi-artefacts requise",
    objectives: [
      { icon: "🔍", text: "Corréler 3 artefacts forensiques indépendants" },
      { icon: "📋", text: "Formuler la conclusion au niveau d'affirmation correct" },
      { icon: "⚖️", text: "Répondre à l'objection de la défense sur les logiciels de sync" },
    ],
    debrief: "<p>Ce scénario illustre la règle fondamentale du Manuel (Ch. 2.5) : <em>«\u00a0un artefact numérique isolé n'est jamais une preuve. La preuve naît de la corrélation.\u00a0»</em></p><p>En droit suisse, l'<strong>art. 139 CPP</strong> autorise la preuve par indices (<em>Indizienbeweis</em>). Trois artefacts convergents et indépendants constituent une présomption sérieuse. Le TF a rappelé (ATF 147 IV 409) que l'absence de preuve directe ne fait pas obstacle à la condamnation si les indices sont graves, précis et concordants.</p>",
    steps: [
      {
        phase: "🔍 Analyse des artefacts",
        situation: `Vous analysez le laptop d'un suspect (affaire de vol de données). X-Ways présente trois artefacts :<br><br>
<div style="display:grid;gap:.5rem;margin-top:.3rem">
<div style="background:rgba(0,229,204,.05);border:1px solid rgba(0,229,204,.2);border-radius:8px;padding:.65rem .9rem;font-size:.78rem">
<strong style="color:var(--cyan)">① ShellBag</strong><br>
Clé BagMRU : <code>HKCU\\Software\\Classes\\Local Settings\\...\\BagMRU</code><br>
Chemin reconstitué : <code>E:\\Projets\\Client_Nexia\\Contrats_2023\\</code><br>
Timestamp dernière visite : <code>2024-03-15 10h43:22</code>
</div>
<div style="background:rgba(48,232,138,.05);border:1px solid rgba(48,232,138,.2);border-radius:8px;padding:.65rem .9rem;font-size:.78rem">
<strong style="color:var(--green)">② USBSTOR (registre SYSTEM)</strong><br>
Appareil : <code>SanDisk Ultra 64GB — S/N: 4C530000000</code><br>
Lettre assignée : <code>E:\\</code> · Première connexion : <code>2024-03-15 10h41:05</code>
</div>
<div style="background:rgba(240,192,64,.05);border:1px solid rgba(240,192,64,.2);border-radius:8px;padding:.65rem .9rem;font-size:.78rem">
<strong style="color:var(--gold)">③ Fichier .lnk</strong><br>
Cible : <code>E:\\Projets\\Client_Nexia\\Contrats_2023\\Contrat_Nexia_Final.docx</code><br>
Timestamp créé : <code>2024-03-15 10h44:37</code> · Volume S/N cible : <code>4C530000000</code>
</div>
</div>`,
        law: "<strong>Manuel Ch. 18</strong> — ShellBags : navigation humaine prouvée. USBSTOR : connexion physique. .lnk : ouverture de fichier.<br><strong>Ch. 2.5 + Art. 139 CPP</strong> — Preuve par indices convergents.",
        question: "<strong>Quelle conclusion est forensiquement défendable devant le juge ?</strong>",
        choices: [
          {
            text: "L'utilisateur a volé les fichiers Nexia sur la clé SanDisk — c'est prouvé.",
            ok: false, pts: -20,
            fb: "Sur-interprétation grave. Les artefacts prouvent navigation, connexion et ouverture — pas un 'vol'. L'intention criminelle ne peut pas être déduite d'artefacts numériques seuls.",
            legal: "Manuel Ch. 29.3 — 'Vol' est une qualification juridique réservée au juge.",
            critical: true, next: 1,
          },
          {
            text: "La corrélation des 3 artefacts établit qu'un utilisateur a navigué dans E:\\Projets\\Client_Nexia\\ et ouvert Contrat_Nexia_Final.docx le 15 mars 2024 à 10h44, depuis une clé SanDisk (S/N 4C530000000) connectée à 10h41.",
            ok: true, pts: 25,
            fb: "Formulation forensiquement parfaite. Elle corrèle 3 sources indépendantes, précise l'horodatage, identifie le périphérique par S/N et reste dans les faits démontrables.",
            legal: "Manuel Ch. 29.4 — Corrélation multi-artefacts. Ch. 18.4 — USBSTOR + ShellBag + .lnk forment une démonstration solide.",
            critical: false, next: 1,
          },
          {
            text: "On ne peut rien conclure — sans le fichier original, pas de preuve.",
            ok: false, pts: -10,
            fb: "Trop conservateur. Un .lnk survit à la suppression du fichier cible — c'est précisément son intérêt forensique. 3 artefacts convergents forment une preuve solide.",
            legal: "Manuel Ch. 18.1 — 'Un raccourci survit souvent à la suppression du fichier référencé.'",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "⚖️ L'objection de l'avocat",
        situation: "L'avocat de la défense : <em>«\u00a0Ces artefacts ont pu être générés par un logiciel de synchronisation automatique (OneDrive, Dropbox) sans intervention humaine délibérée.\u00a0»</em>",
        law: "<strong>Manuel Ch. 18.3</strong> — ShellBags sont créés par l'Explorateur Windows, pas par des scripts ou logiciels de sync.",
        question: "<strong>Quelle réponse technique apportez-vous ?</strong>",
        choices: [
          {
            text: "Les ShellBags sont créés uniquement par l'Explorateur Windows (interface graphique). Un logiciel de sync n'utilise pas l'Explorateur. La séquence temporelle 10h41→10h44 (3 minutes) est cohérente avec une interaction humaine.",
            ok: true, pts: 20,
            fb: "Réponse technique solide. ShellBags = interface graphique uniquement. La chronologie serrée renforce l'argument. Vérification complémentaire : chercher OneDrive/Dropbox dans les artefacts d'exécution (Prefetch).",
            legal: "Manuel Ch. 18.3 — ShellBags créés par le shell graphique, pas par des malwares ou logiciels d'automatisation.",
            critical: false, next: 2,
          },
          {
            text: "L'avocat a raison — on ne peut pas l'exclure. Retirer la conclusion.",
            ok: false, pts: -15,
            fb: "Trop défaitiste. L'hypothèse doit être évaluée, pas automatiquement acceptée. Un expert qui capitule sans vérification perd sa crédibilité.",
            legal: "Manuel Ch. 2.5 — La contre-hypothèse doit être testée, pas simplement acceptée par défaut.",
            critical: false, next: 2,
          },
          {
            text: "Accuser l'avocat de mauvaise foi devant le juge.",
            ok: false, pts: -25,
            fb: "Rupture professionnelle. Un expert ne qualifie jamais les intentions des avocats. Les objections de la défense doivent être traitées techniquement, pas personnellement. Le juge pénalisera fortement un expert qui s'emporte.",
            legal: "Art. 184 CPP + code de déontologie — Neutralité de l'expert.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🔬 La vérification Prefetch",
        situation: "Suivant votre propre conseil, vous vérifiez les artefacts Prefetch de Windows (<code>C:\\Windows\\Prefetch</code>) pour déterminer si OneDrive.exe ou Dropbox.exe tournaient à 10h41-10h44. Résultat : <strong>OneDrive.exe</strong> présent mais dernière exécution à 08h12 (pas 10h41). Aucun Dropbox installé. <strong>Explorer.exe</strong> exécuté de 08h00 à 18h34, pic d'I/O disk à 10h42.",
        law: "<strong>Prefetch (.pf)</strong> — Fichiers créés/modifiés à chaque exécution d'un binaire Windows.<br><strong>Manuel Ch. 19.2</strong> — Prefetch = source primaire pour reconstitution d'exécution.",
        question: "<strong>Comment interprétez-vous ces données Prefetch dans votre rapport complémentaire ?</strong>",
        choices: [
          {
            text: "« Les artefacts Prefetch invalident définitivement l'hypothèse d'un logiciel de sync. L'Explorateur Windows est confirmé actif au moment des faits. »",
            ok: true, pts: 25,
            fb: "Formulation correcte. OneDrive n'était pas actif à 10h41 (dernière exec 08h12 = 2h30 avant). Dropbox absent. Explorer actif avec pic I/O à 10h42 = cohérent avec interaction humaine. L'hypothèse de la défense est techniquement réfutée.",
            legal: "Manuel Ch. 19.2 + Ch. 2.5 — Réfutation technique étayée de la contre-hypothèse.",
            critical: false, next: 3,
          },
          {
            text: "Ignorer les Prefetch — les artefacts précédents suffisaient.",
            ok: false, pts: -10,
            fb: "Trop confiant. La vérification systématique de la contre-hypothèse renforce la démonstration. Les Prefetch sont précisément l'outil qui tranche. Ne pas les mentionner = laisser un doute exploitable par la défense.",
            legal: "Manuel Ch. 2.5 — Tester chaque contre-hypothèse, documenter la démarche.",
            critical: false, next: 3,
          },
          {
            text: "« Les Prefetch montrent OneDrive actif ce jour-là, l'hypothèse de la défense reste possible. »",
            ok: false, pts: -20,
            fb: "Lecture erronée et potentiellement fatale. OneDrive exécuté à 08h12 ≠ actif à 10h41. Cette mauvaise lecture du timing réintroduit un doute artificiel. Un expert rigoureux distingue « exécuté à T » de « actif à T ».",
            legal: "Manuel Ch. 19.2 — Prefetch = moment d'exécution, pas durée d'activité permanente.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📋 La synthèse pour le MP",
        situation: "Le MP prépare la mise en accusation. Il vous demande une synthèse en 1 page présentant la force probante de votre démonstration. L'audience est dans 3 semaines.",
        law: "<strong>Art. 139 CPP</strong> — Preuve par indices autorisée.<br><strong>ATF 147 IV 409</strong> — Indices graves, précis, concordants = condamnation possible.",
        question: "<strong>Comment structurez-vous la synthèse en 1 page ?</strong>",
        choices: [
          {
            text: "Détail technique exhaustif sur les 3 artefacts + Prefetch, avec captures ExifTool, extraits de registre, tout en une page compacte.",
            ok: false, pts: -10,
            fb: "Trop technique pour un MP. Une synthèse doit être lisible par un non-technicien. Le MP doit pouvoir expliquer au juge de façon accessible. Le détail technique va dans les annexes.",
            legal: "Art. 184 CPP — L'expert vulgarise pour les autorités judiciaires.",
            critical: false, next: 4,
          },
          {
            text: "Format structuré : (1) Constat en 2 phrases simples, (2) Tableau « artefact → fait observable » pour les 3 artefacts + Prefetch, (3) Conclusion : 4 sources indépendantes convergentes = indices graves, précis, concordants (ATF 147 IV 409), (4) Renvoi aux annexes techniques.",
            ok: true, pts: 25,
            fb: "Synthèse optimale. Format lisible par non-expert, référence jurisprudence clé (ATF 147 IV 409), structure claire. Le MP peut l'utiliser directement devant le juge.",
            legal: "ATF 147 IV 409 + Manuel Ch. 29.7 — Synthèse structurée = argumentaire efficace.",
            critical: false, next: 4,
          },
          {
            text: "Affirmer clairement la culpabilité : « les artefacts prouvent que X est coupable ».",
            ok: false, pts: -30,
            fb: "Dépassement grave du rôle d'expert. La culpabilité est une qualification juridique EXCLUSIVEMENT réservée au juge. Un expert qui affirme la culpabilité sort de son rôle et expose son rapport à l'exclusion.",
            legal: "Art. 182 CPP + Art. 10 CPP — Séparation stricte expert/juge, présomption d'innocence.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🎙 L'audience",
        situation: "À l'audience, la défense fait appel à un expert contre-analyste (Dr. K., ancien Kudelski Security) qui conteste la méthodologie. Il affirme que l'absence de hash de la table MFT invalide votre reconstruction.",
        law: "<strong>MFT (Master File Table)</strong> — Métadonnées NTFS.<br><strong>Art. 189 CPP</strong> — Expertise contradictoire : complète sans invalider automatiquement.",
        question: "<strong>Comment réagissez-vous à l'attaque méthodologique ?</strong>",
        choices: [
          {
            text: "Admettre publiquement l'erreur pour préserver votre crédibilité.",
            ok: false, pts: -20,
            fb: "Admission inappropriée si l'erreur n'est pas réelle. Un hash de MFT n'est pas exigé par les standards (ISO/IEC 27037, ACPO) pour ce type d'analyse — l'image disque complète a son propre hash, ce qui couvre la MFT incluse. Céder injustement = perdre la preuve.",
            legal: "ISO/IEC 27037 — Hash global de l'image = standard admis.",
            critical: false, next: "end",
          },
          {
            text: "« L'image disque complète (hash SHA-256 vérifié) inclut par définition la table MFT. Un hash MFT séparé est un raffinement non exigé par ISO/IEC 27037. Je défie mon confrère de citer un standard qui l'exige. » Rester factuel, citer les références internationales.",
            ok: true, pts: 25,
            fb: "Réponse d'expert sénior. Techniquement solide, cite les standards internationaux, et invite courtoisement le contre-expert à étayer son affirmation. C'est exactement ce que le juge veut entendre : un débat technique argumenté.",
            legal: "ISO/IEC 27037 + ACPO + Manuel Ch. 11.2 — Hash global = standard établi.",
            critical: false, next: "end",
          },
          {
            text: "Attaquer personnellement le contre-expert sur son passé professionnel.",
            ok: false, pts: -30,
            fb: "Attaque ad hominem inadmissible. Un expert ne discute jamais le parcours d'un confrère à la barre. Le juge sanctionnera immédiatement et votre rapport perdra en crédibilité globale.",
            legal: "Code de déontologie — Respect professionnel entre experts.",
            critical: true, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "🔬", title: "Expert Corrélation", sub: "Maîtrise parfaite de la preuve indiciaire" };
      if (pct >= 60) return { icon: "🔍", title: "Analyste Forensique", sub: "Bonnes bases en corrélation d'artefacts" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez Manuel Ch. 2.5 et 18" };
    },
  },

  /* ══════════════════════════════════════════════════
     10. VIREMENT — Le Virement Frauduleux  [MEDIUM]
  ══════════════════════════════════════════════════ */
  {
    id: "virement",
    title: "Le Virement Frauduleux",
    icon: "💰",
    difficulty: "medium",
    atmosphere: "network",
    narrative: {
      success: "Les qualifications 143bis + 147 en concours réel permettent une poursuite complète. L'auteur est identifié via la remontée des logs Tor (erreur OPSEC) puis arrêté à Lugano. Condamnation à 4 ans ferme.",
      degraded: "La qualification est partiellement correcte, la peine d'ensemble reste symbolique.",
      failure: "La qualification erronée empêche toute poursuite efficace. L'auteur s'en sort avec une amende dérisoire. Les 50'000 CHF restent introuvables."
    },
    tags: ["DROIT", "RÉSEAUX"],
    legalRefs: ["Art. 147 CP", "Art. 146 CP", "Art. 143bis CP", "ATF 140 IV 11"],
    intro: "50'000 CHF virés à 03h47 via l'API bancaire. Manipulation de requêtes HTTP. Aucun humain impliqué côté banque. La qualification pénale est cruciale pour la poursuite.",
    alertLevel: "FRAUDE BANCAIRE — Qualification pénale déterminante",
    objectives: [
      { icon: "⚖️", text: "Distinguer Art. 146 CP (escroquerie) et Art. 147 CP (abus d'ordinateur)" },
      { icon: "🔍", text: "Identifier le concours d'infractions (Art. 9 CP)" },
      { icon: "📋", text: "Documenter la chaîne forensique : token JWT → API → virement" },
    ],
    debrief: "<p>Art. 147 CP (abus d'un ordinateur) est distinct de l'escroquerie (art. 146 CP). L'escroquerie requiert la <em>tromperie d'une personne physique</em> par un comportement astucieux. L'abus d'ordinateur vise l'obtention d'un avantage pécuniaire par manipulation d'un <em>système informatique</em> — sans qu'une personne soit trompée directement.</p><p>Dans une fraude bancaire entièrement automatisée, c'est art. 147 CP qui s'applique.</p>",
    steps: [
      {
        phase: "💰 La fraude découverte",
        situation: "Un virement de <strong>50'000 CHF</strong> a été effectué depuis le compte d'une PME. L'analyse des logs montre : connexion depuis une IP externe via l'API bancaire, insertion de requêtes HTTP manipulées imitant une transaction légitime, aucune interaction avec un conseiller humain. Le tout s'est déroulé à 3h47.",
        law: "<strong>Art. 146 CP</strong> — Escroquerie : tromperie astucieuse d'une personne physique.<br><strong>Art. 147 CP</strong> — Abus d'un ordinateur : enrichissement via manipulation d'un système informatique.",
        question: "<strong>Quelle qualification pénale principale proposez-vous au MP ?</strong>",
        choices: [
          {
            text: "Art. 146 CP — Escroquerie",
            ok: false, pts: -15,
            fb: "L'escroquerie (art. 146 CP) exige la tromperie astucieuse d'une personne physique. Ici, l'API bancaire est un système automatisé — aucune personne n'a été trompée. La qualification correcte est art. 147 CP.",
            legal: "ATF 140 IV 11 — Art. 146 CP requiert un être humain trompé. La manipulation de système relève de 147 CP.",
            critical: false, next: "end",
          },
          {
            text: "Art. 147 CP — Abus d'un ordinateur",
            ok: true, pts: 25,
            fb: "Qualification correcte. Art. 147 CP punit quiconque, dans le dessein de se procurer un enrichissement illégitime, influence le résultat d'un traitement de données. L'API bancaire automatisée est un traitement de données.",
            legal: "Art. 147 CP al. 1 — Manipulation électronique d'un traitement de données pour enrichissement.",
            critical: false, next: 1,
          },
          {
            text: "Art. 143 CP — Soustraction de données",
            ok: false, pts: -10,
            fb: "Art. 143 CP vise la soustraction de données (les prendre sans autorisation). Ici, il n'y a pas de données soustraites mais un transfert d'argent obtenu par manipulation du système.",
            legal: "Art. 143 CP — Soustraction de données ≠ manipulation d'un système pour enrichissement financier.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🔍 La trace forensique",
        situation: "Les logs de l'API bancaire montrent 847 requêtes en 4 minutes depuis l'IP 185.220.101.48 (nœud de sortie Tor). Le token JWT d'authentification utilisé était légitime — exfiltré 3 semaines plus tôt via phishing.",
        law: "<strong>Art. 143bis CP</strong> — Accès indu au système (via token volé).<br><strong>Art. 147 CP</strong> — Abus pour le virement frauduleux.",
        question: "<strong>Quelles infractions cumulez-vous dans votre rapport ?</strong>",
        choices: [
          {
            text: "Art. 147 CP seul — le virement est l'infraction principale.",
            ok: false, pts: -5,
            fb: "Incomplet. L'utilisation du token JWT volé constitue un accès indu au système (art. 143bis CP) distinct du virement (art. 147 CP). Le concours réel d'infractions doit être retenu.",
            legal: "Art. 9 CP — Concours d'infractions : chaque infraction distincte doit être qualifiée séparément.",
            critical: false, next: 2,
          },
          {
            text: "Art. 143bis CP (accès indu via token volé) + Art. 147 CP (virement frauduleux) en concours réel.",
            ok: true, pts: 20,
            fb: "Correct. Deux infractions distinctes : (1) l'utilisation du JWT volé pour accéder au système sans droit (143bis), (2) l'exécution du virement frauduleux via manipulation de l'API (147).",
            legal: "Art. 143bis + 147 CP en concours réel. Peine d'ensemble selon art. 49 CP.",
            critical: false, next: 2,
          },
          {
            text: "Ajouter aussi art. 144 CP (dommages à la donnée) pour couvrir tout le spectre.",
            ok: false, pts: -10,
            fb: "Qualification excessive. L'art. 144 vise la destruction/altération de données, ce qui n'a pas eu lieu ici (lecture + manipulation, pas destruction). Une qualification trop large affaiblit le dossier en diluant les charges solides.",
            legal: "Principe de précision pénale — Ne retenir que les infractions caractérisées.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🧅 L'attribution via Tor",
        situation: "L'IP 185.220.101.48 est un nœud de sortie Tor — par définition, elle ne remonte pas à l'auteur. Cependant, le tracing serveur révèle une anomalie : 2 des 847 requêtes ont été envoyées AVANT que le flux Tor soit établi, depuis une IP résidentielle bernoise (<code>85.195.108.221</code>, Swisscom). Une erreur OPSEC classique.",
        law: "<strong>Tor Project Docs</strong> — Les premières requêtes peuvent fuiter si le client envoie avant établissement du circuit.<br><strong>Manuel Ch. 25.6</strong> — IP résidentielle = indice, pas preuve d'identité.",
        question: "<strong>Que concluez-vous de cette erreur OPSEC ?</strong>",
        choices: [
          {
            text: "L'auteur est identifié : l'abonné Swisscom de l'IP 85.195.108.221.",
            ok: false, pts: -20,
            fb: "Sur-interprétation (cf. scénario IP accusatrice). L'IP identifie un abonné, pas un auteur. De plus, un attaquant compétent utilise parfois une machine zombie comme point de départ. Il faut investiguer cet abonné ET vérifier la machine source.",
            legal: "ATF 136 II 508 — IP = abonné, pas auteur.",
            critical: false, next: 3,
          },
          {
            text: "Indice fort à exploiter : réquisition Swisscom pour identifier l'abonné (Art. 273 CPP), puis perquisition pour analyser la machine source et confirmer/infirmer l'auteur. L'erreur OPSEC est précieuse mais pas déterminante seule.",
            ok: true, pts: 25,
            fb: "Approche méthodique correcte. L'erreur OPSEC ouvre une piste, mais l'attribution complète nécessite : identification abonné → perquisition → analyse machine → corrélation avec autres artefacts (fichiers, logs, caméras). Enquête à continuer.",
            legal: "Art. 273 CPP + Manuel Ch. 25.6 — Chaîne d'investigation disciplinée.",
            critical: false, next: 3,
          },
          {
            text: "Tor protège l'auteur, abandonner cette piste.",
            ok: false, pts: -15,
            fb: "Capitulation prématurée. L'erreur OPSEC est précisément ce qui permet de remonter à l'auteur derrière Tor. C'est une opportunité rare à exploiter avec rigueur.",
            legal: "Manuel Ch. 25.7 — Tor n'est pas infaillible, les erreurs OPSEC ouvrent des brèches.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🏠 La perquisition à Berne",
        situation: "L'abonné Swisscom est identifié : un étudiant en informatique à l'EPFL, 24 ans. Perquisition à son appartement à Berne. Vous trouvez : laptop Arch Linux, 3 machines virtuelles Windows, une grande quantité de wallets crypto, un Raspberry Pi avec notes manuscrites <code>«&nbsp;test phishing&nbsp;»</code>. Le suspect invoque son droit au silence.",
        law: "<strong>Art. 113 CPP</strong> — Droit au silence.<br><strong>Art. 197 CPP</strong> — Proportionnalité des mesures.<br><strong>Art. 263 CPP</strong> — Séquestre.",
        question: "<strong>Quelle est votre priorité forensique in situ ?</strong>",
        choices: [
          {
            text: "Interroger agressivement le suspect pour obtenir des aveux.",
            ok: false, pts: -25,
            fb: "Le suspect a invoqué Art. 113 CPP. L'interroger malgré cela est une violation grave qui peut invalider toute la procédure. L'interrogatoire se fait sous supervision judiciaire, pas sur la scène de perquisition.",
            legal: "Art. 113 + 158 CPP — Droit au silence inviolable. Interrogatoire formel ultérieur.",
            critical: true, next: "end",
          },
          {
            text: "Dump RAM de tous les systèmes allumés (laptop + VMs + Pi), capture réseau locale, documentation photographique, puis saisie sous scellés de l'ensemble. Ne pas interroger le suspect.",
            ok: true, pts: 25,
            fb: "Priorisation parfaite. En présence d'un technicien (Arch, VMs, crypto), les preuves volatiles sont critiques : wallets déchiffrés en RAM, VMs actives avec preuves du phishing. Le silence du suspect n'empêche pas la capture technique.",
            legal: "Manuel Ch. 11.1 + Art. 263 CPP — RAM first + saisie documentée.",
            critical: false, next: 4,
          },
          {
            text: "Saisir uniquement le laptop principal — le reste est anecdotique.",
            ok: false, pts: -20,
            fb: "Erreur grave. Les wallets crypto sont probablement le produit de la fraude (50'000 CHF convertis en crypto). Le Pi avec notes « test phishing » est une preuve directe. Ignorer ces éléments perd l'affaire.",
            legal: "Art. 263 CPP — Séquestre complet des éléments liés à l'infraction.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "💸 Le suivi de l'argent",
        situation: "L'analyse révèle : les 50'000 CHF ont été convertis en Bitcoin via Binance, puis passés dans un tumbler (Wasabi Wallet CoinJoin) avant d'aboutir sur 3 cold wallets. Le MP vous demande comment procéder au « follow the money » pour confiscation (art. 70 CP).",
        law: "<strong>Art. 70 CP</strong> — Confiscation des valeurs patrimoniales illicites.<br><strong>Art. 305bis CP</strong> — Blanchiment d'argent (conversion en crypto = potentiellement aggravant).<br><strong>Chainalysis / CipherTrace</strong> — Outils d'analyse blockchain.",
        question: "<strong>Quelle approche technique recommandez-vous ?</strong>",
        choices: [
          {
            text: "Abandonner : le tumbler CoinJoin rend la traçabilité impossible.",
            ok: false, pts: -15,
            fb: "Trop défaitiste. CoinJoin dégrade la traçabilité mais ne l'annihile pas. L'analyse heuristique (Chainalysis, CipherTrace) peut souvent percer un tumbler partiellement. De plus, les 3 cold wallets saisis physiquement contiennent peut-être déjà les fonds.",
            legal: "Pratique fedpol 2023 — Analyse blockchain même après tumbler = résultats partiels exploitables.",
            critical: false, next: "end",
          },
          {
            text: "(1) Analyse heuristique blockchain (Chainalysis) pour tracer malgré le tumbler, (2) Saisie physique des 3 cold wallets identifiés (seed phrases écrites ?), (3) Coopération Binance pour le premier hop avant tumbler, (4) Qualification art. 305bis CP (blanchiment) en plus de 147 CP.",
            ok: true, pts: 25,
            fb: "Approche complète et moderne. Combiner analyse technique blockchain + saisie physique + coopération exchange + qualification aggravée = maximisation des chances de récupération des fonds + peine d'ensemble aggravée.",
            legal: "Art. 70 + 305bis CP + Guide fedpol crypto — Approche multicanale optimale.",
            critical: false, next: "end",
          },
          {
            text: "Demander à Binance de geler tous les comptes suisses en préventive.",
            ok: false, pts: -20,
            fb: "Disproportionné et illégal. Un gel préventif doit être ciblé sur des avoirs précis (art. 263 CPP). Demander un gel de masse sans fondement est abusif et peut conduire à des poursuites civiles.",
            legal: "Art. 263 + 197 CPP — Proportionnalité et ciblage des mesures de séquestre.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "⚖️", title: "Expert Cyberdroit", sub: "Maîtrise parfaite des qualifications CP" };
      if (pct >= 60) return { icon: "💼", title: "Analyste Juridique", sub: "Bonnes bases en droit pénal numérique" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez Art. 143bis, 146, 147 CP" };
    },
  },

  /* ══════════════════════════════════════════════════
     11. ATTRIBUTION — Attribution Incertaine  [HARD]
  ══════════════════════════════════════════════════ */
  {
    id: "attribution",
    title: "Attribution Incertaine",
    icon: "👤",
    difficulty: "hard",
    atmosphere: "",
    narrative: {
      success: "L'attribution triangulée (RDP + DHCP + badgeuse + pattern horaire) est retenue par le juge. Alice est confondue par la convergence des 4 sources. Elle finit par reconnaître les faits et révèle avoir agi pour le compte du concurrent.",
      degraded: "L'attribution est acceptée avec réserves. Alice nie fermement, mais ne peut pas contester techniquement. L'affaire va en appel.",
      failure: "L'attribution repose sur trop peu de sources indépendantes. Le doute profite à Alice. Elle est acquittée — le vrai coupable, peut-être elle, peut-être un autre, reste impuni."
    },
    tags: ["WINDOWS", "FORENSIQUE"],
    legalRefs: ["Manuel Ch. 29.4", "Art. 139 CPP", "Art. 182 CPP"],
    intro: "Une infraction a eu lieu depuis un compte Windows partagé par 3 collaborateurs. Il faut désigner l'auteur probable — sans jamais outrepasser le rôle de l'expert forensique.",
    alertLevel: "COMPTE PARTAGÉ — Attribution individuelle complexe",
    objectives: [
      { icon: "👤", text: "Identifier les artefacts différenciateurs sur un compte partagé" },
      { icon: "🔗", text: "Trianguler sources numériques et physiques (Art. 139 CPP)" },
      { icon: "📋", text: "Formuler l'attribution au niveau d'affirmation correct (Art. 182 CPP)" },
    ],
    debrief: "<p>L'attribution d'une action à un utilisateur spécifique sur un compte partagé est l'un des défis les plus délicats de la forensique Windows. La session utilisateur ne suffit pas — il faut croiser : Event ID 4624 (type de logon), biométrie (si configurée), photos de surveillance, comportements atypiques.</p><p>Le Manuel (Ch. 29.4) insiste : l'attribution humaine nécessite toujours plusieurs sources convergentes. Une session active ne prouve pas physiquement la présence d'une personne devant l'écran.</p>",
    steps: [
      {
        phase: "👤 Le compte partagé",
        situation: "Une infraction (envoi de données confidentielles à un concurrent) a eu lieu depuis le compte Windows <code>svc_compta</code>. Ce compte est utilisé par <strong>3 collaborateurs</strong> du service comptabilité : Alice, Bob et Carole. L'infraction a eu lieu le vendredi 14 mars à 23h47 — en dehors des heures de bureau.",
        law: "<strong>Event ID 4624</strong> — Type de logon (2=local, 3=réseau, 10=RDP, 7=déverrouillage).<br><strong>Manuel Ch. 29.4</strong> — Attribution humaine : croiser sources numériques et physiques.",
        question: "<strong>Quels artefacts permettent de distinguer les trois utilisateurs ?</strong>",
        choices: [
          {
            text: "Le nom de la session svc_compta — il identifie l'utilisateur.",
            ok: false, pts: -20,
            fb: "Insufficient. svc_compta est un compte partagé — tous les trois l'utilisent. Le nom de session n'identifie pas l'individu physique.",
            legal: "Manuel Ch. 29.4 — Compte partagé = session insuffisante. Nécessite différenciateurs complémentaires.",
            critical: true, next: "end",
          },
          {
            text: "Event ID 4624 (type de logon + poste source) + badges d'accès physique + caméras de surveillance + habitudes comportementales (heure, vitesse de frappe).",
            ok: true, pts: 25,
            fb: "Approche complète. L'Event ID 4624 donne le type de connexion (RDP = à distance). Les badges d'accès indiquent qui était physiquement dans le bâtiment. Les caméras confirment la présence. Les habitudes comportementales permettent d'identifier le profil.",
            legal: "Manuel Ch. 29.4 — Attribution triangulée : numérique + physique + comportemental.",
            critical: false, next: 1,
          },
          {
            text: "L'adresse MAC de la machine utilisée — elle identifie l'appareil et donc l'utilisateur.",
            ok: false, pts: -10,
            fb: "L'adresse MAC identifie l'appareil, pas l'utilisateur. Sur un poste partagé, la MAC ne distingue pas Alice de Bob si les deux utilisent la même machine.",
            legal: "Manuel Ch. 25.6 — MAC = appareil ≠ utilisateur. Nécessite corrélation avec session active et présence physique.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🎯 La convergence",
        situation: "L'analyse révèle : Event ID 4624 Type 10 (RDP) depuis 192.168.1.47 (poste d'Alice, identifié par DHCP lease). Badgeuse : seule Alice a badgé hors du bâtiment à 22h30 ce soir-là. Ses accès habituels sont toujours le soir entre 22h et minuit. Bob et Carole sont badgés sortis à 18h00.",
        law: "<strong>Art. 139 CPP</strong> — Preuve par indices convergents.",
        question: "<strong>Quelle conclusion forensique rédigez-vous ?</strong>",
        choices: [
          {
            text: "«\u00a0Alice a commis l'infraction de transmission de données confidentielles (art. 143 CP).\u00a0»",
            ok: false, pts: -15,
            fb: "Trop affirmatif et dépasse le rôle de l'expert. La qualification pénale appartient au juge. «\u00a0Alice a commis\u00a0» est une conclusion sur l'intention qui va au-delà des artefacts numériques.",
            legal: "Art. 182 CPP — L'expert formule des constatations techniques, pas des verdicts.",
            critical: false, next: 2,
          },
          {
            text: "«\u00a0La convergence de 4 sources indépendantes (RDP depuis le poste d'Alice, DHCP lease confirmé, badgeuse — seule personne présente physiquement, pattern horaire habituel d'Alice) désigne le compte d'Alice comme source la plus probable de l'action du 14 mars à 23h47.\u00a0»",
            ok: true, pts: 20,
            fb: "Formulation correcte. Elle cite explicitement les 4 sources, utilise «\u00a0probable\u00a0» pour maintenir l'honnêteté intellectuelle, et identifie le compte (fait vérifiable) plutôt que la personne.",
            legal: "Manuel Ch. 29.3 + Art. 139 CPP — Preuve par indices convergents, formulée avec le niveau d'affirmation approprié.",
            critical: false, next: 2,
          },
          {
            text: "«\u00a0Il est impossible de distinguer les 3 utilisateurs du compte partagé.\u00a0»",
            ok: false, pts: -10,
            fb: "Trop défaitiste au vu des 4 sources convergentes. La triangulation réalisée PERMET la distinction probable. Ne pas l'utiliser = priver l'enquête d'une conclusion solide.",
            legal: "Art. 139 CPP — Les indices convergents sont une preuve valide en droit pénal suisse.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🛡 La défense biométrique",
        situation: "Alice, interrogée, affirme : « Quelqu'un a dû utiliser mon poste pendant que j'allais aux toilettes. Mon écran n'était peut-être pas verrouillé. » Vous cherchez des éléments de biométrie qui trancheraient. Windows Hello facial était configuré sur son poste. Les logs montrent : 4624 Type 7 (Unlock) à 22h03 avec biometric flag = true, puis activité continue jusqu'à 23h59.",
        law: "<strong>Windows Hello</strong> — Biométrie locale stockée dans le TPM.<br><strong>Event ID 4624 Type 7</strong> — Déverrouillage, avec LogonAuthenticationPackageName = NGC (biométrie).<br><strong>Manuel Ch. 29.4</strong> — Biométrie = preuve très forte d'identité physique.",
        question: "<strong>Comment interprétez-vous la preuve biométrique pour le rapport ?</strong>",
        choices: [
          {
            text: "« Alice s'est authentifiée biométriquement à 22h03, puis l'activité a continué sans interruption jusqu'à l'infraction. Aucune nouvelle authentification n'est visible. »",
            ok: true, pts: 25,
            fb: "Formulation forensique optimale. Elle établit l'authentification biométrique d'Alice, décrit l'absence d'interruption, et permet au lecteur de conclure sur la présence continue. La défense « quelqu'un d'autre » est techniquement difficile à maintenir : il aurait fallu voler l'écran déverrouillé puis voler le visage d'Alice.",
            legal: "Art. 139 CPP + Manuel Ch. 29.4 — Biométrie = indice quasi-décisif sur la présence physique.",
            critical: false, next: 3,
          },
          {
            text: "« Windows Hello identifie Alice avec certitude absolue. Sa défense est un mensonge manifeste. »",
            ok: false, pts: -20,
            fb: "Sur-affirmation. Windows Hello n'est pas infaillible (faux positifs rares mais documentés). « Mensonge manifeste » = qualification de l'intention, hors du rôle expert. Un bon rapport décrit les faits techniques, le juge qualifie.",
            legal: "Art. 182 CPP — L'expert ne qualifie pas la véracité des déclarations.",
            critical: false, next: 3,
          },
          {
            text: "Considérer Windows Hello peu fiable, mentionner seulement brièvement.",
            ok: false, pts: -15,
            fb: "Sous-estimation. Windows Hello avec TPM est reconnu comme une authentification robuste par Microsoft Security Docs. C'est précisément le différenciateur technique qui tranche ce cas. Le minimiser = perdre la preuve la plus forte.",
            legal: "Microsoft Security Docs + NIST SP 800-63B — Windows Hello classé authentification de niveau AAL2/AAL3.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🕹 L'argument du malware",
        situation: "L'avocat d'Alice fait valoir qu'un malware (RAT) aurait pu se connecter à distance et exécuter l'infraction. Il exige une contre-expertise pour vérifier. Votre analyse de la machine montre : aucun processus suspect actif à l'heure des faits, pas de fichier exécutable récent non signé, pas de connexion réseau sortante anormale, pas d'entrée de registre malveillante.",
        law: "<strong>MITRE ATT&CK T1021</strong> — Remote Services, techniques de contrôle à distance.<br><strong>Manuel Ch. 20</strong> — Analyse anti-malware en forensique.<br><strong>Art. 189 CPP</strong> — Contre-expertise.",
        question: "<strong>Comment répondez-vous à l'hypothèse malware ?</strong>",
        choices: [
          {
            text: "Accepter la contre-expertise et attendre — elle pourrait invalider votre travail.",
            ok: false, pts: -10,
            fb: "Capitulation injustifiée. Votre analyse anti-malware est complète et négative. La contre-expertise peut avoir lieu, mais votre rapport principal reste solide. Ne pas préparer de défense technique = abandonner le dossier.",
            legal: "Art. 189 CPP — La contre-expertise est un droit, pas une invalidation automatique.",
            critical: false, next: 4,
          },
          {
            text: "Documenter précisément : scan YARA des exécutables, analyse Volatility de la RAM (processus, connexions, hooks), vérification de l'intégrité du kernel (Autoruns + Sigcheck), comparaison avec baseline Windows propre. Conclusion : aucun artefact de RAT détecté sur la machine. L'hypothèse malware n'est pas étayée par les faits observables.",
            ok: true, pts: 25,
            fb: "Réponse d'expert solide. Vous listez les vérifications anti-malware réalisées et concluez de façon factuelle. Le contre-expert devra trouver ce qui a échappé à votre analyse — peu probable vu la rigueur décrite.",
            legal: "Manuel Ch. 20 + MITRE ATT&CK — Liste de vérifications anti-malware standard.",
            critical: false, next: 4,
          },
          {
            text: "Rejeter l'hypothèse sans l'analyser : « C'est manifestement une tactique dilatoire de la défense. »",
            ok: false, pts: -25,
            fb: "Position inacceptable. Toute hypothèse de la défense mérite vérification technique. La rejeter sans analyse = manque de rigueur + manque de respect pour la procédure. Un expert neutre examine toute contre-hypothèse.",
            legal: "Art. 182 CPP — L'expert est neutre et rigoureux, pas partisan.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🎥 La corroboration CCTV",
        situation: "La CCTV du bâtiment confirme : Alice est vue entrant dans le bureau à 22h01, sortant à 23h59. Aucune autre personne n'est vue entrer. Un plan lumineux indique qu'Alice a utilisé son téléphone pendant une pause à 23h12 (trahissant son visage devant la caméra). Cependant, la CCTV du couloir a une zone aveugle entre 22h40 et 22h55.",
        law: "<strong>Art. 179quater CP</strong> — Violation de la sphère privée par dispositifs de prise de vue (consent des employés obligatoire).<br><strong>LPD 2023 Art. 27</strong> — Surveillance des employés : proportionnalité et information.",
        question: "<strong>Comment intégrez-vous la CCTV au rapport ?</strong>",
        choices: [
          {
            text: "Utiliser la CCTV comme preuve principale, même si elle a été installée sans information préalable des employés.",
            ok: false, pts: -30,
            fb: "Violation grave de la LPD et CPP. Une CCTV employés installée sans information préalable est une surveillance illégale (Art. 179quater CP). Son exploitation judiciaire est contestable (Art. 141 CPP) et expose l'entreprise à des poursuites LPD. Toujours vérifier la conformité de la CCTV AVANT de l'utiliser.",
            legal: "Art. 179quater CP + LPD 2023 Art. 27 — CCTV employés = consentement/information obligatoires.",
            critical: true, next: "end",
          },
          {
            text: "Intégrer la CCTV en précisant : conformité LPD vérifiée (panneaux d'information affichés, consentement signé), zone aveugle 22h40-22h55 mentionnée honnêtement, corroboration avec Windows Hello (pas d'autre entrée) + activité continue en session = Alice présente de façon prolongée.",
            ok: true, pts: 25,
            fb: "Formulation exemplaire. Conformité LPD vérifiée, honnêteté sur la zone aveugle (un expert loyal mentionne les limites), et convergence avec les autres sources. La zone aveugle de 15 min ne suffit pas à expliquer une activité continue de 2h.",
            legal: "LPD 2023 Art. 27 + Art. 139 CPP — CCTV légale + transparence sur les limites.",
            critical: false, next: 5,
          },
          {
            text: "Ignorer la CCTV pour éviter toute complication juridique.",
            ok: false, pts: -15,
            fb: "Sous-optimal. Si la CCTV est LPD-compliant, elle est une source précieuse. Ignorer une preuve valide par précaution excessive = prive l'enquête d'un indice solide.",
            legal: "Art. 139 CPP — Chaque source conforme doit être exploitée.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "⌨️ Les biométries comportementales",
        situation: "Votre analyse va plus loin : les logs de l'application CRM (utilisée par le service compta) incluent les KeystrokeTiming (intervalles entre touches) et MouseVelocity. Vous comparez avec les sessions antérieures d'Alice, Bob et Carole. Résultat : la session du 14 mars à 23h47 a un profil keystroke identique à 96% à celui d'Alice (baseline de 400 sessions historiques). Bob = 41%, Carole = 38%.",
        law: "<strong>Biométrie comportementale</strong> — Reconnaissance par dynamique de frappe (NIST SP 800-63B).<br><strong>ATF 147 IV 409</strong> — Indices précis et concordants.",
        question: "<strong>Comment intégrez-vous cette donnée dans le rapport ?</strong>",
        choices: [
          {
            text: "La présenter comme preuve définitive : 96% = Alice est prouvée.",
            ok: false, pts: -20,
            fb: "Sur-interprétation. 96% est un score statistique élevé mais pas une « preuve définitive ». La biométrie comportementale est admise comme indice, pas comme empreinte digitale infaillible. Formuler comme « indice très fort » convient mieux.",
            legal: "NIST SP 800-63B — Biométrie comportementale = AAL1/AAL2, indice renforcé mais non décisif seul.",
            critical: false, next: 6,
          },
          {
            text: "La présenter comme indice supplémentaire convergent avec les 5 autres sources déjà établies, en précisant la méthodologie (baseline 400 sessions, score 96% vs 41%/38%) et les limites statistiques de l'approche.",
            ok: true, pts: 25,
            fb: "Intégration exemplaire. La biométrie comportementale renforce la convergence déjà solide. La transparence sur la méthode et les limites = crédibilité d'expert. Avec 6 sources indépendantes, le doute raisonnable est presque épuisé.",
            legal: "Art. 139 CPP + NIST SP 800-63B — Biométrie comportementale comme indice renforcé.",
            critical: false, next: 6,
          },
          {
            text: "Ne pas la mentionner — c'est trop technique pour un tribunal.",
            ok: false, pts: -15,
            fb: "Sous-optimisation. Le rôle de l'expert est précisément de rendre le technique compréhensible. Avec une explication claire de la méthode (« on compare comment Alice tape vs Bob/Carole »), le juge peut l'utiliser.",
            legal: "Art. 184 CPP — L'expert rend le technique accessible, il ne l'omet pas.",
            critical: false, next: 6,
          },
        ],
      },
      {
        phase: "🎙 L'audience pénale",
        situation: "Audience au Tribunal de district. Alice, désormais accompagnée d'un avocat sénior, tente une dernière ligne de défense : « L'expert a travaillé pour le concurrent il y a 2 ans — il a un conflit d'intérêts. » Cette information est publique (LinkedIn). Le juge vous demande une réponse immédiate.",
        law: "<strong>Art. 183 CPP</strong> — L'expert doit être indépendant et sans conflit d'intérêts.<br><strong>Art. 56 CPP</strong> — Récusation.<br><strong>Art. 182 CPP</strong> — Devoir de divulgation proactif.",
        question: "<strong>Comment réagissez-vous ?</strong>",
        choices: [
          {
            text: "Nier tout conflit : « J'étais un simple contractant il y a 2 ans, sans lien actif. Ma probité est intacte. »",
            ok: false, pts: -25,
            fb: "Erreur stratégique grave. Si l'information est publique (LinkedIn), nier crée une impression de dissimulation. De plus, si vous n'avez pas divulgué ce lien au moment de votre mandat d'expert, c'est une violation de l'Art. 183 CPP.",
            legal: "Art. 182/183 CPP — Obligation de divulgation proactive des liens passés.",
            critical: true, next: "end",
          },
          {
            text: "Reconnaître le fait, contextualiser : « J'ai travaillé 8 mois pour [concurrent] en 2022 comme contractant externe sur un projet sans lien avec la partie qui m'oppose aujourd'hui à Alice. Je l'ai déclaré dans ma lettre d'acceptation du mandat (pièce PV-12). Le MP en était informé. Si le tribunal estime que cela constitue un motif de récusation, je me retire immédiatement. »",
            ok: true, pts: 25,
            fb: "Réponse d'expert exemplaire. Vous reconnaissez le fait (honnêteté), vous contextualisez (nature limitée du lien), vous prouvez la divulgation préalable (pièce PV-12), et vous offrez la récusation spontanée. Le juge appréciera cette intégrité.",
            legal: "Art. 56/182/183 CPP — Transparence + offre de récusation volontaire = crédibilité maximale.",
            critical: false, next: 7,
          },
          {
            text: "Attaquer l'avocat : « C'est une manœuvre dilatoire honteuse qui discrédite la défense. »",
            ok: false, pts: -30,
            fb: "Inacceptable. Un expert à la barre ne qualifie jamais les stratégies de la défense. L'émotion qui transparaît ici trahit un déséquilibre professionnel. Le juge sanctionnera immédiatement.",
            legal: "Code de déontologie expert — Neutralité et réserve à la barre.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "⚖️ Le verdict",
        situation: "Le juge retient l'ensemble des 6 sources convergentes (RDP+DHCP / badgeuse / pattern horaire / Windows Hello / CCTV / biométrie comportementale). Il condamne Alice à 18 mois de peine privative avec sursis + 50'000 CHF de dommages-intérêts au profit de l'employeur. Alice fait appel. Le MP vous demande comment soutenir le jugement en appel.",
        law: "<strong>Art. 393 CPP</strong> — Recours.<br><strong>ATF 147 IV 409</strong> — Indices graves, précis, concordants.",
        question: "<strong>Que préparez-vous pour l'appel ?</strong>",
        choices: [
          {
            text: "Compléter le rapport avec de nouvelles analyses « au cas où » — plus de preuves c'est mieux.",
            ok: false, pts: -15,
            fb: "Mauvaise stratégie. En appel, on défend le rapport existant, on n'ajoute pas de nouveaux éléments (sauf faits nouveaux). Ajouter = suggérer que le rapport initial était incomplet, fragiliser le jugement de première instance.",
            legal: "Art. 393 CPP + pratique TF — Défense de l'existant en appel, sauf faits nouveaux authentiques.",
            critical: false, next: "end",
          },
          {
            text: "Préparer un mémoire de synthèse pour l'appel : (1) rappel des 6 sources convergentes et de leur indépendance, (2) jurisprudence ATF 147 IV 409 sur les indices concordants, (3) anticipation des arguments probables de la défense avec réponses techniques préparées, (4) disponibilité pour audition complémentaire si requise.",
            ok: true, pts: 25,
            fb: "Stratégie optimale. Vous consolidez le rapport existant, armez le MP d'arguments jurisprudentiels, et anticipez la défense. C'est exactement ce qu'un MP attend d'un expert rigoureux en appel.",
            legal: "Art. 393 CPP + ATF 147 IV 409 — Défense articulée et anticipative.",
            critical: false, next: "end",
          },
          {
            text: "Refuser de s'impliquer en appel : « Mon mandat s'est terminé en première instance. »",
            ok: false, pts: -20,
            fb: "Refus problématique. Un expert reste disponible pour les instances d'appel — c'est implicite dans le mandat initial. Refuser = laisser le MP sans soutien technique et fragiliser la procédure.",
            legal: "Art. 183 CPP — Disponibilité de l'expert jusqu'à clôture définitive.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 85 && custodyPct >= 75) return { icon: "🦅", title: "Expert Attribution", sub: "Maîtrise avancée de l'attribution humaine" };
      if (pct >= 65) return { icon: "🔬", title: "Analyste Confirmé", sub: "Bonne compréhension de l'attribution" };
      return { icon: "📚", title: "Formation requise", sub: "Révisez Manuel Ch. 29.4 — Attribution humaine" };
    },
  },

  /* ══════════════════════════════════════════════════
     12. BITLOCKER_FROID — BitLocker à Froid  [HARD]
  ══════════════════════════════════════════════════ */
  {
    id: "bitlocker_froid",
    title: "BitLocker à Froid",
    icon: "❄️",
    difficulty: "hard",
    atmosphere: "crypto",
    narrative: {
      success: "La clé de récupération est retrouvée via le compte Microsoft après réquisition judiciaire. 2 To de données exploitables s'ouvrent. L'enquête peut enfin avancer sur le contenu réel du laptop.",
      degraded: "La clé n'est pas trouvée, mais votre rapport d'impossibilité est honnête et bien documenté. Le MP accepte, l'enquête continue sans les données chiffrées.",
      failure: "Vous avez promis l'impossible au MP. Semaines perdues à tenter du brute-force inutile. Quand vous devez reconnaître l'échec, votre crédibilité d'expert est atteinte — et le temps a fait son œuvre."
    },
    tags: ["WINDOWS", "CRYPTO"],
    legalRefs: ["Manuel Ch. 24.3", "Manuel Ch. 28.4", "Art. 251 CP"],
    intro: "Le laptop du suspect est éteint. L'écran affiche la demande de clé BitLocker. Aucune clé trouvée dans l'appartement. Le MP veut savoir combien de temps pour déchiffrer. Votre réponse va définir toute la stratégie d'enquête.",
    alertLevel: "SYSTÈME CHIFFRÉ HORS LIGNE — Options limitées",
    objectives: [
      { icon: "❄️", text: "Formuler honnêtement l'impossibilité de casser AES-256 (Manuel Ch. 28.4)" },
      { icon: "🔑", text: "Identifier les alternatives réalistes pour trouver la clé" },
      { icon: "⚖️", text: "Éviter les fausses promesses au MP (Art. 251 CP)" },
    ],
    debrief: "<p>Un système éteint avec BitLocker actif est l'un des défis les plus frustrants de la forensique numérique. La règle est simple : <strong>sans clé de déchiffrement, les données sont inaccessibles</strong>. L'analyste ne doit jamais promettre ce qu'il ne peut pas livrer.</p><p>La formulation correcte de l'impossibilité est une compétence forensique à part entière (Manuel Ch. 28.4). Elle doit être précise, technique et honnête.</p>",
    steps: [
      {
        phase: "🔒 Le laptop éteint",
        situation: "Lors d'une perquisition, le laptop du suspect est <strong>éteint</strong>. L'écran de démarrage affiche «\u00a0BitLocker Drive Encryption. Enter recovery key to start.\u00a0» Aucune clé de récupération n'a été trouvée dans l'appartement. Le compte Microsoft du suspect est inconnu.",
        law: "<strong>Manuel Ch. 24.3</strong> — BitLocker éteint sans clé = Dead Forensics seul possible.<br><strong>AES-256</strong> — Inviolable par force brute dans tout horizon temporel humain.",
        question: "<strong>Le MP demande : «\u00a0Combien de temps pour déchiffrer ?\u00a0» Que répondez-vous ?</strong>",
        choices: [
          {
            text: "«\u00a0Plusieurs semaines avec du matériel puissant.\u00a0»",
            ok: false, pts: -25,
            fb: "Affirmation fausse et dangereuse. AES-256 ne peut pas être cassé par force brute en quelques semaines. Mentir au MP sur les capacités forensiques compromet l'enquête et la crédibilité de l'expert.",
            legal: "Art. 251 CP — Un rapport forensique contenant de fausses affirmations constitue un faux dans les titres.",
            critical: true, next: "end",
          },
          {
            text: "«\u00a0Sans clé de déchiffrement ou accès au compte Microsoft, AES-256 (BitLocker) est inviolable dans tout horizon temporel judiciaire raisonnable. Je vais chercher la clé de récupération via les canaux disponibles.\u00a0»",
            ok: true, pts: 25,
            fb: "Réponse correcte et honnête. Elle exprime l'impossibilité technique clairement, sans surestimer ni sous-estimer. Et elle propose une alternative constructive (recherche de la clé).",
            legal: "Manuel Ch. 28.4 — L'impossibilité bien documentée est un résultat forensique.",
            critical: false, next: 1,
          },
          {
            text: "«\u00a0Ce n'est pas possible du tout — il faut abandonner cette piste.\u00a0»",
            ok: false, pts: -10,
            fb: "Trop défaitiste. Sans avoir épuisé toutes les alternatives (compte Microsoft, AD d'entreprise, fichier de récupération), déclarer forfait est prématuré.",
            legal: "Manuel Ch. 28.4 — L'impossibilité ne se déclare qu'après épuisement documenté des alternatives.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🔑 La recherche de clé",
        situation: "Vous avez accès à l'historique de navigation du suspect. Il a un compte Microsoft (outlook.com). Une réquisition à Microsoft a été obtenue. Le casier judiciaire indique qu'il travaillait dans une PME avec Active Directory.",
        law: "<strong>Art. 18 LSCPT</strong> — Réquisition auprès d'un fournisseur de services.",
        question: "<strong>Classez les sources par priorité pour trouver la clé BitLocker.</strong>",
        choices: [
          {
            text: "1. Compte Microsoft → 2. Active Directory de l'ancienne entreprise → 3. Backups cloud",
            ok: true, pts: 20,
            fb: "Ordre correct. Microsoft stocke automatiquement les clés BitLocker des comptes personnels. L'AD d'entreprise peut avoir une ancienne clé. Les backups cloud sont une troisième option.",
            legal: "Manuel Ch. 24.3 — Microsoft: account.microsoft.com/devices. AD: Get-BitLockerKeyProtector.",
            critical: false, next: 2,
          },
          {
            text: "1. Backups cloud → 2. Compte Microsoft → 3. Active Directory",
            ok: false, pts: -5,
            fb: "Ordre sous-optimal. Le compte Microsoft est de loin la source la plus fréquente pour les particuliers — il doit être consulté en priorité avant les backups cloud.",
            legal: "Manuel Ch. 24.3 — Microsoft est le dépôt principal pour Windows 10/11 grand public.",
            critical: false, next: 2,
          },
          {
            text: "Tenter brute-force sur le TPM 2.0 — il peut présenter des vulnérabilités.",
            ok: false, pts: -20,
            fb: "Irréaliste à l'échelle judiciaire. Même les vulnérabilités TPM documentées (TPM-Fail, Faulty TPM) nécessitent des attaques matérielles sophistiquées en laboratoire spécialisé. Pas d'application judiciaire pratique.",
            legal: "Manuel Ch. 28.4 — Le TPM 2.0 avec PCR correctement configurés résiste aux attaques pratiques.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "📨 La réquisition Microsoft",
        situation: "Vous soumettez la demande à Microsoft via le portail Law Enforcement. Microsoft répond 12 jours plus tard : le compte existe, mais la sauvegarde automatique de la clé de récupération BitLocker <strong>n'est pas activée</strong>. Aucune clé stockée. Cependant, Microsoft indique qu'un backup iCloud... ah non, c'est Microsoft, ils ont OneDrive. OneDrive contient 400 Go synchronisés.",
        law: "<strong>Microsoft Law Enforcement Guidelines</strong> — Données cloud accessibles sur demande.<br><strong>Art. 273 CPP</strong> — Ordonnance pour données de compte.<br><strong>OneDrive Personal Vault</strong> — Zone chiffrée E2E (accès limité).",
        question: "<strong>Comment exploitez-vous cette information partielle ?</strong>",
        choices: [
          {
            text: "Récupérer les 400 Go OneDrive — le chiffrement BitLocker est contourné puisque les fichiers sont en clair dans le cloud.",
            ok: true, pts: 25,
            fb: "Excellente tactique. OneDrive Personal = synchronisation en clair (hors Personal Vault). Si l'utilisateur a synchronisé ses documents, le BitLocker du disque local est contourné par le cloud. Un seul point de friction : demander les bonnes ordonnances Art. 273 CPP pour les données cloud.",
            legal: "Art. 273 CPP + Microsoft LE Guidelines — Données cloud = voie alternative au BitLocker local.",
            critical: false, next: 3,
          },
          {
            text: "Abandonner : sans clé BitLocker, les données ne sont pas exploitables.",
            ok: false, pts: -25,
            fb: "Erreur grave. Le disque local est inaccessible, certes, mais 400 Go de données cloud en clair = souvent la majorité des documents de travail (Word, Excel, PDF). Renoncer = perdre probablement l'essentiel de l'enquête.",
            legal: "Manuel Ch. 28.4 — Toujours chercher les voies alternatives avant de conclure à l'impossibilité.",
            critical: false, next: 3,
          },
          {
            text: "Attaquer OneDrive par injection de requêtes API.",
            ok: false, pts: -30,
            fb: "Violation grave. Attaquer un service cloud est une intrusion illégale dans un système informatique (Art. 143bis CP) même dans un cadre d'enquête. La voie légale est la réquisition Microsoft.",
            legal: "Art. 143bis CP — Interdiction absolue, même pour les autorités, sans ordonnance.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🏢 L'Active Directory de l'ancienne PME",
        situation: "Le laptop avait auparavant été utilisé dans une PME suisse (50 employés) avec Active Directory. Le suspect a démissionné il y a 14 mois. La PME a changé d'administrateur système entre-temps. Vous contactez l'IT actuel pour vérifier si une clé BitLocker historique existe encore dans l'AD.",
        law: "<strong>Active Directory</strong> — Attribut <code>msFVE-RecoveryInformation</code>.<br><strong>Politique GPO</strong> — BitLocker peut forcer la sauvegarde en AD.<br><strong>Art. 273 CPP</strong> — Réquisition envers une personne morale.",
        question: "<strong>Que demandez-vous à l'administrateur IT actuel ?</strong>",
        choices: [
          {
            text: "L'export complet de l'AD — tant qu'à faire, prenons tout.",
            ok: false, pts: -20,
            fb: "Surdimensionné et problématique. Un export AD complet contient des données personnelles de tous les employés actuels (hors enquête) = violation LPD. La demande doit être ciblée sur le compte du suspect uniquement.",
            legal: "LPD 2023 Art. 8 + Art. 197 CPP — Principe de minimisation des données.",
            critical: true, next: "end",
          },
          {
            text: "Une recherche ciblée : <code>Get-BitLockerKeyProtector</code> sur les objets Computer associés au laptop du suspect (par S/N), plus <code>Get-ADObject</code> filtrant <code>msFVE-RecoveryInformation</code> avec timestamp correspondant à la période d'utilisation.",
            ok: true, pts: 25,
            fb: "Requête technique ciblée et LPD-compliant. Vous demandez uniquement ce qui concerne le suspect + le matériel spécifique + la période. L'admin peut exécuter ces commandes PowerShell spécifiques sans exposer d'autres données.",
            legal: "Art. 273 CPP + LPD 2023 Art. 8 — Réquisition ciblée et proportionnée.",
            critical: false, next: 4,
          },
          {
            text: "Demander un accès direct au serveur AD pour chercher vous-même.",
            ok: false, pts: -15,
            fb: "Inapproprié. L'accès direct par un tiers à un serveur AD d'entreprise dépasse le cadre de la réquisition. La PME doit faire la recherche avec son admin et livrer uniquement le résultat ciblé.",
            legal: "Pratique fedpol — Les données sont produites par leur détenteur, pas extraites par l'enquêteur.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "🎯 La clé retrouvée",
        situation: "L'AD contient bien une clé BitLocker historique pour le laptop (msFVE-RecoveryPassword : <code>523910-118456-223781-987654-001122-334455-667788-990011</code>). L'admin la transmet avec attestation d'authenticité. Vous êtes au laboratoire, prêt à déchiffrer.",
        law: "<strong>Manuel Ch. 12.2</strong> — Chiffrement connu : déchiffrement sur copie uniquement.<br><strong>ACPO Principle 1</strong> — Aucune modification de la preuve originale.<br><strong>dislocker-file</strong> — Déchiffrement offline Linux.",
        question: "<strong>Comment procédez-vous au déchiffrement ?</strong>",
        choices: [
          {
            text: "Boot Windows en entrant la clé de récupération, puis copier les fichiers.",
            ok: false, pts: -30,
            fb: "Violation grave d'ACPO Principle 1. Booter Windows modifie des centaines de timestamps, met à jour des registres, déclenche des télémétries. La preuve originale est altérée.",
            legal: "ACPO Principle 1 + Manuel Ch. 12.2 — Modification de la preuve originale inadmissible.",
            critical: true, next: "end",
          },
          {
            text: "Image bit-à-bit du disque d'origine (DD + hash), puis sur la copie : <code>dislocker-file -V image.dd -p RECOVERY_KEY -- decrypted.dd</code>. Hash de la copie déchiffrée, analyse avec X-Ways sur la version déchiffrée.",
            ok: true, pts: 25,
            fb: "Procédure DFIR exemplaire. Image → hash → déchiffrement offline → hash de vérification → analyse sur copie. L'original reste intouché et vérifiable. La procédure est reproductible par un contre-expert.",
            legal: "ACPO Principle 1-3 + Manuel Ch. 12.2 — Procédure forensique canonique.",
            critical: false, next: 5,
          },
          {
            text: "Utiliser Elcomsoft Forensic Disk Decryptor en un clic — plus rapide.",
            ok: false, pts: -5,
            fb: "Acceptable techniquement mais manque de transparence. Les outils commerciaux propriétaires sont moins reproductibles qu'une chaîne open-source (dislocker). Préférer des outils auditables pour l'audience.",
            legal: "ACPO Principle 3 — Reproductibilité par un expert tiers = préférer les outils standards open-source.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "🔍 L'analyse du disque déchiffré",
        situation: "Le disque de 2 To déchiffré révèle : 180 Go de documents, 800 Go de photos/vidéos, 50 Go de correspondance (Outlook PST), 3 VMs VirtualBox, et un dossier crypté VeraCrypt de 50 Go (encore non ouvert). Le MP veut savoir ce qui est exploitable immédiatement et ce qui demande encore du travail.",
        law: "<strong>Art. 248 CPP</strong> — Scellés toujours applicables sur les données sensibles.<br><strong>Art. 264 CPP</strong> — Objets protégés (correspondance avocat-client).<br><strong>TF 1B_602/2020</strong> — Tri préalable.",
        question: "<strong>Comment classifiez-vous l'inventaire pour le MP ?</strong>",
        choices: [
          {
            text: "Exploitable immédiatement : tout. Le déchiffrement BitLocker légitime l'accès total.",
            ok: false, pts: -25,
            fb: "Confusion grave entre capacité technique et légitimité procédurale. Le déchiffrement BitLocker ouvre le stockage physique, mais : (1) PST Outlook peut contenir correspondance avocat (Art. 264 CPP), (2) VMs peuvent contenir données tiers, (3) VeraCrypt = conteneur séparé, chiffrement distinct. Tri TMC obligatoire.",
            legal: "TF 1B_602/2020 — Séparer ouverture technique et recevabilité procédurale.",
            critical: true, next: "end",
          },
          {
            text: "Classification en 4 niveaux : (1) immédiatement exploitable après tri TMC (documents liés à l'enquête), (2) nécessitant tri spécifique (PST Outlook — correspondance avocat possible), (3) analyse technique complémentaire (VMs à extraire individuellement), (4) chiffrement additionnel (VeraCrypt — nouvelle investigation requise).",
            ok: true, pts: 25,
            fb: "Classification rigoureuse. Vous distinguez clairement les paliers procéduraux et techniques. Le MP peut prioriser : commencer par le (1), puis (2), pendant que le (3) et (4) sont investigués en parallèle.",
            legal: "Art. 248 + 264 CPP + TF 1B_602/2020 — Inventaire structuré selon statut procédural.",
            critical: false, next: 6,
          },
          {
            text: "Restreindre au minimum : ne présenter que 10 Go de documents les plus pertinents.",
            ok: false, pts: -20,
            fb: "Filtrage biaisé par l'expert = dépassement du rôle. L'inventaire exhaustif revient au forensique ; la sélection procédurale revient au TMC/MP. Pré-filtrer = empiéter sur la fonction judiciaire.",
            legal: "Art. 182 CPP — L'expert présente, le juge trie.",
            critical: false, next: 6,
          },
        ],
      },
      {
        phase: "⚔️ L'objection sur la clé",
        situation: "L'avocat de la défense conteste la provenance de la clé : « Cette clé AD date de 14 mois. Comment prouvez-vous qu'elle n'a pas été modifiée par l'ancien employeur pour nuire à mon client ? » Il demande l'exclusion des preuves obtenues via cette clé.",
        law: "<strong>Art. 189 CPP</strong> — Expertise contradictoire.<br><strong>Art. 141 CPP</strong> — Exploitation des preuves.<br><strong>Manuel Ch. 24.3</strong> — Vérification de l'intégrité des clés tierces.",
        question: "<strong>Comment défendez-vous la validité de la clé ?</strong>",
        choices: [
          {
            text: "Argumenter : (1) attestation d'authenticité signée par l'admin IT actuel (sous sa responsabilité pénale Art. 251 CP), (2) timestamp msFVE-WhenCreated dans l'AD correspond à la période d'utilisation, (3) la clé FONCTIONNE (preuve empirique du déchiffrement réussi), (4) test de non-régression : déchiffrer un secteur et vérifier qu'il correspond à du contenu Windows cohérent.",
            ok: true, pts: 25,
            fb: "Défense technique solide. Chaque point est vérifiable : attestation juridique + timestamp AD + preuve empirique + test cohérence. Une clé modifiée ne déchiffrerait pas le disque — la réussite du déchiffrement est la meilleure garantie d'authenticité.",
            legal: "Art. 141 + 251 CPP + Manuel Ch. 24.3 — Authenticité prouvée par convergence multi-sources.",
            critical: false, next: 7,
          },
          {
            text: "Reconnaître le risque et proposer de refaire le déchiffrement avec une autre source de clé.",
            ok: false, pts: -15,
            fb: "Capitulation injustifiée. Il n'existe pas d'« autre source » disponible (Microsoft n'avait pas la clé, les backups utilisateur absents). Céder sans raison technique = accepter l'exclusion abusive de preuves valides.",
            legal: "Art. 141 CPP — L'exclusion nécessite une violation établie, pas un simple doute.",
            critical: false, next: 7,
          },
          {
            text: "Ignorer l'objection : « C'est à la défense de prouver la manipulation, pas à nous. »",
            ok: false, pts: -20,
            fb: "Réponse procédurale incorrecte. En principe de libre appréciation des preuves (Art. 10 CPP), c'est à la partie qui produit qui doit démontrer l'authenticité. Votre rapport doit établir la provenance de la clé de façon convaincante.",
            legal: "Art. 10 CPP — Fardeau partagé : production et authenticité à la charge de celui qui invoque.",
            critical: false, next: 7,
          },
        ],
      },
      {
        phase: "📋 Le rapport d'impossibilité partielle",
        situation: "Le conteneur VeraCrypt de 50 Go reste inaccessible. Aucune passphrase trouvée (pas dans notes papier, pas dans gestionnaire de mots de passe du Windows déchiffré, pas dans la RAM puisque machine éteinte). Le MP vous demande de formaliser cette impossibilité pour clore ce volet.",
        law: "<strong>Manuel Ch. 28.4</strong> — Rapport d'impossibilité : exigences formelles.<br><strong>Art. 251 CP</strong> — Fausses affirmations dans un rapport officiel.<br><strong>VeraCrypt</strong> — AES-256 + PBKDF2 avec 500k+ itérations → brute force impraticable.",
        question: "<strong>Que contient votre rapport d'impossibilité pour le VeraCrypt ?</strong>",
        choices: [
          {
            text: "Déclaration laconique : « Déchiffrement du conteneur VeraCrypt impossible. »",
            ok: false, pts: -10,
            fb: "Trop sommaire. Un rapport d'impossibilité doit documenter les tentatives effectuées, les raisons techniques de l'échec, et les conditions éventuelles d'un déchiffrement futur (ex : si passphrase obtenue par interrogatoire). Cela permet au MP de décider en connaissance.",
            legal: "Manuel Ch. 28.4 — Impossibilité documentée ≠ déclaration laconique.",
            critical: false, next: "end",
          },
          {
            text: "Rapport structuré : (1) description technique du conteneur VeraCrypt (AES-256, PBKDF2-SHA512, 500k itérations estimées), (2) alternatives tentées (dictionnaires, variantes de mots de passe trouvés ailleurs, recherche de key file sur le disque déchiffré), (3) raisons techniques de l'impossibilité (espace de clés > 2^256), (4) conditions de déchiffrement futur (passphrase par témoignage, key file découvert), (5) recommandation : interrogatoire du suspect sur une éventuelle passphrase.",
            ok: true, pts: 25,
            fb: "Rapport d'impossibilité exemplaire. Il distingue ce qui a été tenté de ce qui reste possible (si nouvelles informations), offre une recommandation actionnable au MP, et maintient l'honnêteté technique. L'Art. 251 CP est scrupuleusement respecté.",
            legal: "Manuel Ch. 28.4 + Art. 251 CP — Rapport d'impossibilité complet et honnête.",
            critical: false, next: "end",
          },
          {
            text: "Proposer d'embaucher un cabinet spécialisé en cryptanalyse pour tenter l'impossible.",
            ok: false, pts: -20,
            fb: "Proposition trompeuse. Aucun cabinet ne peut casser du VeraCrypt AES-256 correctement configuré. Suggérer cette voie = faire miroiter un espoir faux au MP, gaspiller ressources, décrédibiliser l'expertise initiale.",
            legal: "Art. 251 CP + déontologie DFIR — Ne pas entretenir de fausses espérances techniques.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 85 && custodyPct >= 75) return { icon: "❄️", title: "Expert Chiffrement", sub: "Maîtrise parfaite du forensique BitLocker à froid" };
      if (pct >= 65) return { icon: "🔐", title: "Analyste Confirmé", sub: "Bonnes bases sur le chiffrement forensique" };
      return { icon: "📚", title: "Formation requise", sub: "Révisez Manuel Ch. 24.3 et 28.4" };
    },
  },

  /* ══════════════════════════════════════════════════
     13. FILELESS — Malware Fileless  [HARD]
  ══════════════════════════════════════════════════ */
  {
    id: "fileless",
    title: "Malware Fileless",
    icon: "⚡",
    difficulty: "hard",
    atmosphere: "network",
    narrative: {
      success: "La RAM est capturée à temps. Volatility identifie l'injection T1055 dans svchost.exe avec précision. La compromission est documentée, les IoC extraits, le CERT national alerté. L'intrusion est endiguée sur toute la flotte bancaire.",
      degraded: "La RAM est partielle, les IoC fragmentaires. L'attribution reste floue, mais le compromis sur cette machine est avéré.",
      failure: "Le système a été éteint trop vite « pour stopper l'attaque ». Le malware fileless disparaît avec la RAM. Aucune preuve technique exploitable. La banque ne saura jamais ce qui a été exfiltré."
    },
    tags: ["RÉSEAUX", "FORENSIQUE"],
    legalRefs: ["Manuel Ch. 11.2", "Art. 143bis CP", "MITRE ATT&CK T1055", "LPD 2023 Art. 24"],
    intro: "Un IDS alerte sur des connexions sortantes suspectes depuis un poste bancaire. L'antivirus ne trouve rien. Aucun exécutable suspect sur le disque. Pourtant le malware est actif. Comment le prouver ?",
    alertLevel: "MALWARE SANS FICHIER — RAM = seule preuve possible",
    objectives: [
      { icon: "⚡", text: "Comprendre le fonctionnement des malwares fileless" },
      { icon: "💾", text: "Appliquer la séquence correcte : isolation → RAM → Volatility" },
      { icon: "📋", text: "Formuler le rapport avec références MITRE ATT&CK" },
    ],
    debrief: "<p>Les malwares fileless opèrent entièrement en mémoire RAM, injectent du code dans des processus légitimes et ne laissent aucun exécutable sur le disque.</p><p>L'<strong>OFCS (GovCERT)</strong> recommande de capturer la RAM avant toute extinction lors d'une suspicion de malware fileless. La preuve de l'infection repose exclusivement sur l'analyse Volatility de la RAM. Sans dump préalable, la preuve est irrémédiablement perdue.</p>",
    steps: [
      {
        phase: "⚡ Le système compromis",
        situation: "Un IDS a déclenché une alerte sur le réseau d'une banque. Le système suspect est <strong>allumé et actif</strong>. L'analyse antivirus ne trouve rien. Aucun fichier exécutable suspect sur le disque. Pourtant, des connexions sortantes vers 185.x.x.x (IP malveillante connue) sont actives.",
        law: "<strong>Manuel Ch. 11.2</strong> — Malware fileless : RAM = seule preuve possible.<br><strong>Art. 143bis CP</strong> — Accès indu même si aucun fichier persistant sur le disque.<br><strong>GovCERT / OFCS</strong> — Recommandation : isolation réseau puis capture RAM avant extinction.",
        question: "<strong>Quelle est votre priorité absolue ?</strong>",
        choices: [
          {
            text: "Éteindre le système pour stopper les connexions malveillantes.",
            ok: false, pts: -25,
            fb: "Erreur critique. Éteindre détruit la RAM — et avec elle la seule preuve de l'infection fileless. Les connexions peuvent être coupées en isolant réseau sans éteindre.",
            legal: "Manuel Ch. 11.2 — Malware fileless : RAM = seule preuve. Extinction = destruction de preuve.",
            critical: true, next: "end",
          },
          {
            text: "Isoler le réseau (débrancher câble Ethernet, désactiver WiFi) puis capturer immédiatement la RAM avec WinPmem.",
            ok: true, pts: 25,
            fb: "Procédure correcte. Isolation réseau = stoppe les connexions malveillantes sans éteindre. Capture RAM = préserve la preuve de l'infection. L'ordre est critique : d'abord isoler, ensuite capturer.",
            legal: "Manuel Ch. 11.2 — Malware fileless : séquence isolation réseau → capture RAM → analyse avec Volatility.",
            critical: false, next: 1,
          },
          {
            text: "Lancer une analyse forensique du disque avec X-Ways en live.",
            ok: false, pts: -10,
            fb: "Inadapté. Un malware fileless ne laisse rien sur le disque — l'analyse disque ne trouvera pas la cause. La priorité est la RAM, pas le disque.",
            legal: "Manuel Ch. 11.2 — Pour un malware fileless, l'analyse disque est une perte de temps. RAM first.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🔍 L'analyse Volatility",
        situation: "Vous avez capturé 16 Go de RAM. Volatility 3 montre : le processus <code>svchost.exe</code> (PID 1284) a des connexions actives vers 185.x.x.x:443. La commande <code>malfind</code> détecte une zone mémoire avec droits RWX (lecture-écriture-exécution) contenant du shellcode.",
        law: "<strong>Volatility 3 / malfind</strong> — Détecte zones mémoire RWX avec shellcode.<br><strong>MITRE ATT&CK T1055</strong> — Process Injection : technique référencée internationalement.",
        question: "<strong>Que concluez-vous et comment le formulez-vous dans le rapport ?</strong>",
        choices: [
          {
            text: "«\u00a0Le système est infecté par un malware.\u00a0»",
            ok: false, pts: -10,
            fb: "Trop vague. Un rapport forensique doit être précis et référencé. Quelle preuve ? Quel artefact ? Quelle commande Volatility ?",
            legal: "Manuel Ch. 29.1 — Précision et traçabilité. Chaque conclusion doit être étayée par un artefact spécifique.",
            critical: false, next: 2,
          },
          {
            text: "«\u00a0L'analyse RAM (Volatility 3, commande malfind) révèle que le processus svchost.exe (PID 1284) contient une zone mémoire à droits RWX avec du shellcode non signé. Ce processus maintient une connexion active vers 185.x.x.x:443 (voir netscan). Ces éléments sont caractéristiques d'une injection de code en mémoire (technique T1055 MITRE ATT&CK).\u00a0»",
            ok: true, pts: 25,
            fb: "Formulation forensiquement correcte. Elle cite : l'outil (Volatility 3), la commande (malfind, netscan), les artefacts spécifiques (PID, droits RWX, shellcode, IP cible) et une référence de classification (MITRE T1055). Reproductible et vérifiable.",
            legal: "Manuel Ch. 29.1 — Précision + traçabilité + reproductibilité. MITRE ATT&CK comme référence standardisée.",
            critical: false, next: 2,
          },
          {
            text: "« Svchost.exe est un processus Windows normal, probablement un faux positif. »",
            ok: false, pts: -25,
            fb: "Erreur grave. Les malwares utilisent précisément des processus légitimes (svchost, rundll32, powershell) pour se cacher. Les caractéristiques observées (RWX + shellcode + C2 externe) sont INCOMPATIBLES avec un svchost légitime.",
            legal: "MITRE ATT&CK T1055 — Process injection via processus légitimes = technique courante.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🎯 L'extraction du shellcode",
        situation: "Vous dumpez la zone mémoire suspecte avec <code>vol.py windows.malfind.Malfind --dump</code>. Le shellcode extrait (~180 KB) est analysé avec Ghidra. Il révèle : décodage XOR avec clé <code>0xDEADBEEF</code>, chaîne C2 hardcoded <code>185.34.218.42:443</code>, fonctions d'exfiltration ciblant <code>%LOCALAPPDATA%\\Microsoft\\Outlook\\*.pst</code>, et une chaîne UTF-16 <code>« Cobalt Strike Beacon »</code>.",
        law: "<strong>Cobalt Strike</strong> — Framework offensif légitime (licence commerciale) détourné par cybercriminels.<br><strong>MITRE ATT&CK G0102</strong> — Groupes utilisant Cobalt Strike (APT29, FIN7, BlackCat, etc.).",
        question: "<strong>Comment interprétez-vous le beacon Cobalt Strike trouvé ?</strong>",
        choices: [
          {
            text: "« Nous avons identifié un beacon Cobalt Strike, donc il s'agit d'APT29 (groupe russe affilié au FSB). »",
            ok: false, pts: -20,
            fb: "Attribution géopolitique prématurée. Cobalt Strike est vendu commercialement + versions crackées disponibles. De nombreux groupes l'utilisent (APT29, FIN7, ransomware operators, red teams légitimes). Attribuer à un groupe spécifique nécessite plus d'indices.",
            legal: "Manuel Ch. 29.1 — Outil ≠ groupe. Attribution nécessite convergence multi-indicateurs.",
            critical: false, next: 3,
          },
          {
            text: "« Le shellcode correspond à un beacon Cobalt Strike 4.x (observations : obfuscation XOR avec 0xDEADBEEF, C2 configuration). C'est un framework d'attaque utilisé par de multiples groupes. L'attribution à un acteur spécifique nécessitera des IoC supplémentaires (domaines enregistrés, modus operandi, TTPs complets). »",
            ok: true, pts: 25,
            fb: "Formulation correcte. Vous identifiez l'outil techniquement sans sur-attribuer. Vous ouvrez la voie à l'enrichissement d'indicateurs (domaines, TTPs) sans présumer d'un acteur. Le GovCERT appréciera cette rigueur.",
            legal: "Manuel Ch. 29.1 + MITRE ATT&CK — Identification technique vs attribution d'acteur.",
            critical: false, next: 3,
          },
          {
            text: "« On ne peut rien conclure d'un simple beacon. »",
            ok: false, pts: -10,
            fb: "Sous-estimation. L'identification d'un beacon Cobalt Strike a une valeur considérable : il indique un attaquant sophistiqué (pas un script kiddie), permet d'anticiper les étapes suivantes (lateral movement, ransomware, exfiltration), et fournit des IoC exploitables (C2 IP, fingerprint beacon).",
            legal: "Manuel Ch. 29.1 — L'identification technique est un livrable forensique majeur.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🌐 L'analyse des connexions réseau",
        situation: "Volatility 3 <code>netscan</code> révèle : connexion active TCP vers <code>185.34.218.42:443</code> depuis svchost.exe (PID 1284). L'analyse pcap (capture réseau 48h rétroactive via SIEM) montre un pattern de beaconing : requêtes HTTPS sortantes toutes les 60 secondes (jitter 10%), taille 2-4 KB, payload chiffré. Pic d'exfiltration à 03h47 (6 MB envoyés en 4 minutes).",
        law: "<strong>MITRE ATT&CK T1071</strong> — Application Layer Protocol (C2 via HTTPS).<br><strong>Manuel Ch. 25.3</strong> — Analyse de traffic C2.<br><strong>ExplosionMode Beacon</strong> — Caractéristiques typiques Cobalt Strike.",
        question: "<strong>Comment documentez-vous l'activité C2 et l'exfiltration ?</strong>",
        choices: [
          {
            text: "« Le malware communique avec un serveur externe et a exfiltré 6 MB. »",
            ok: false, pts: -10,
            fb: "Trop vague. Les détails techniques sont la valeur de votre rapport : pattern exact (periodicity + jitter), volumes, horaires, cibles probables. Un SOC bancaire attend ces chiffres précis pour calibrer ses mesures.",
            legal: "Manuel Ch. 25.3 — Précision technique = actionnabilité pour la défense.",
            critical: false, next: 4,
          },
          {
            text: "« Beaconing HTTPS sortant vers 185.34.218.42:443 (autonomous system AS-RU, fournisseur BulletProof), pattern 60s ±10% typique d'un heartbeat Cobalt Strike. Pic d'exfiltration identifié le [date] à 03h47:12 UTC+1 : 6.2 MB (via analyse pcap SIEM), probablement des .pst Outlook (cohérent avec l'analyse du shellcode). Durée de compromission estimée (première connexion C2) : 47 heures avant détection IDS. »",
            ok: true, pts: 25,
            fb: "Formulation exemplaire. Chaque fait est précis, horodaté, contextualisé (AS-RU BulletProof = indice supplémentaire). La durée de compromission permet au SOC de mesurer la fenêtre d'exposition. Le rapport est actionnable.",
            legal: "Manuel Ch. 25.3 + MITRE T1071 — Analyse C2 standard et détaillée.",
            critical: false, next: 4,
          },
          {
            text: "Bloquer l'IP 185.34.218.42 immédiatement sur le firewall et considérer le problème résolu.",
            ok: false, pts: -30,
            fb: "Double erreur. (1) Bloquer unilatéralement pendant une investigation = risque de tipper l'attaquant. (2) Un attaquant Cobalt Strike a généralement plusieurs C2 secondaires — bloquer une IP ne règle rien. La coordination avec le SOC et le GovCERT est essentielle.",
            legal: "Manuel Ch. 25.4 — Blocage réseau coordonné, jamais unilatéral.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🔎 La recherche du point d'entrée",
        situation: "Vous remontez la chronologie via les logs SIEM : la première connexion C2 date de 47h avant la détection. L'Event ID 4688 (Process Creation) de cette période montre : <code>winword.exe</code> parent de <code>cmd.exe</code> parent de <code>powershell.exe -enc [base64 long]</code>. Le base64 décodé est un téléchargeur qui injecte le beacon en mémoire. L'email avec pièce jointe Word suspecte est retrouvé dans les logs Exchange.",
        law: "<strong>MITRE ATT&CK T1566.001</strong> — Spearphishing Attachment.<br><strong>T1059.001</strong> — PowerShell encoded commands.<br><strong>T1204.002</strong> — User Execution: Malicious File.",
        question: "<strong>Comment qualifiez-vous la chaîne d'attaque dans le rapport ?</strong>",
        choices: [
          {
            text: "« Attaque détectée » — sans plus de détails pour ne pas compliquer le rapport.",
            ok: false, pts: -15,
            fb: "Rapport sans valeur défensive. La chaîne d'attaque précise (phishing → macro Word → cmd → PowerShell encodé → injection mémoire) permet au SOC de : (1) bloquer des techniques similaires, (2) former les utilisateurs, (3) déployer détections ciblées. Omettre ces détails = gaspiller l'investigation.",
            legal: "Manuel Ch. 29.1 — Détails techniques = valeur défensive actionnable.",
            critical: false, next: 5,
          },
          {
            text: "Kill chain complète : (1) Phishing (T1566.001) — email reçu par [utilisateur] à [horaire], (2) Execution (T1204.002) — ouverture pièce jointe Word avec macro, (3) Defense Evasion + Execution (T1059.001) — cmd → PowerShell encodé en base64, (4) Privilege Escalation NON observée (déjà compte utilisateur suffisant), (5) Persistence (à vérifier — registry Run keys, scheduled tasks), (6) C2 (T1071.001) — beacon HTTPS vers 185.34.218.42, (7) Collection + Exfiltration (T1114 + T1041) — .pst Outlook.",
            ok: true, pts: 25,
            fb: "Chaîne d'attaque MITRE ATT&CK exemplaire. Chaque étape documentée avec référence standardisée. Le SOC peut déployer des détections spécifiques à chaque technique. Le rapport devient un outil défensif de grande valeur.",
            legal: "MITRE ATT&CK + Manuel Ch. 29.1 — Kill chain structurée = standard international.",
            critical: false, next: 5,
          },
          {
            text: "Se concentrer uniquement sur le point d'entrée (phishing) pour simplifier.",
            ok: false, pts: -10,
            fb: "Incomplet. Le phishing est juste une étape sur 7 dans la kill chain. Omettre les autres techniques prive le SOC d'informations critiques sur le comportement post-exploitation (injection, beacon, exfiltration).",
            legal: "Manuel Ch. 29.1 — Kill chain complète = valeur défensive maximale.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "🚨 La notification LPD et au GovCERT",
        situation: "L'analyse confirme : les .pst Outlook exfiltrés contenaient des correspondances client de la banque — données personnelles financières de ~2'400 clients suisses. Le DPO bancaire est contacté. La banque craint une notification LPD tardive. Votre rôle d'expert : conseiller sur la stratégie de notification.",
        law: "<strong>LPD 2023 Art. 24</strong> — Notification PFPDT « meilleurs délais » pour violations à risque élevé.<br><strong>FINMA Circulaire 2023/1</strong> — Notification cyberincidents dans les 24h.<br><strong>Art. 271 CP</strong> — Attention aux correspondances internationales (secret bancaire).",
        question: "<strong>Conseil de notification multi-canaux ?</strong>",
        choices: [
          {
            text: "Attendre l'analyse complète avant toute notification — éviter de communiquer sur des informations partielles.",
            ok: false, pts: -25,
            fb: "Violation des délais réglementaires. La FINMA exige une première notification dans les 24h même si incomplète. Attendre = amende réglementaire + atteinte à la confiance des régulateurs. Une notification préliminaire suivie de mises à jour est la norme.",
            legal: "FINMA Circulaire 2023/1 — Notification initiale sous 24h, mises à jour progressives.",
            critical: true, next: "end",
          },
          {
            text: "Stratégie coordonnée : (1) FINMA dans les 24h (cyberincident), (2) PFPDT « meilleurs délais » (LPD 2023 — données personnelles exfiltrées), (3) GovCERT/NCSC pour partage d'IoC, (4) Prévention clients : communication proactive à ~2'400 clients avec conseils de vigilance (phishing), (5) Rapport FINMA détaillé sous 30 jours.",
            ok: true, pts: 25,
            fb: "Stratégie complète et conforme aux obligations multi-niveaux d'un établissement financier suisse. Chaque canal a son délai et son objectif. La communication proactive aux clients prévient les dommages secondaires et démontre la maturité de l'institution.",
            legal: "FINMA + LPD 2023 + Doctrine NCSC — Gestion coordonnée des notifications bancaires.",
            critical: false, next: 6,
          },
          {
            text: "Notifier uniquement le PFPDT — la FINMA peut attendre.",
            ok: false, pts: -20,
            fb: "Non-conformité FINMA. Les établissements soumis à LBA sont tenus de notifier la FINMA en priorité pour cyberincidents. Omettre = sanction disciplinaire + risque de retrait de licence dans les cas graves.",
            legal: "FINMA Circulaire 2023/1 — Notification obligatoire pour établissements surveillés.",
            critical: false, next: 6,
          },
        ],
      },
      {
        phase: "🛠 La reconstruction et le durcissement",
        situation: "L'investigation terminée, la banque doit décider : reconstruire l'ensemble des postes suspects (~80 machines du service concerné) ou cibler uniquement les confirmées compromises ? Le CISO vous consulte sur la stratégie de remédiation.",
        law: "<strong>Manuel Ch. 21</strong> — Remédiation post-incident.<br><strong>NIST SP 800-61</strong> — Incident Response Lifecycle.<br><strong>Zero Trust</strong> — Principe : considérer comme compromis si doute.",
        question: "<strong>Quelle est votre recommandation technique ?</strong>",
        choices: [
          {
            text: "Reformater seulement le poste source (1 machine) — les autres sont probablement OK.",
            ok: false, pts: -25,
            fb: "Risque majeur. Cobalt Strike a des capacités de mouvement latéral (Pass-the-Hash, PsExec, WMI). 47h de présence = potentiellement des dizaines d'autres machines compromises. Limiter à une machine = laisser des backdoors en place.",
            legal: "MITRE ATT&CK T1550 + Manuel Ch. 21 — Mouvement latéral probable en cas de Cobalt Strike prolongé.",
            critical: true, next: "end",
          },
          {
            text: "Scan ciblé : (1) Analyse Volatility de la RAM des 80 postes du service (recherche d'IoC Cobalt Strike : connexions 185.x, shellcode RWX, pattern beaconing), (2) Reformatage + réinstallation depuis master propre de tous les postes confirmés compromis + quelques autres par principe de précaution, (3) Rotation complète des credentials domain des utilisateurs impactés, (4) Déploiement EDR avec règles MITRE ATT&CK spécifiques à Cobalt Strike.",
            ok: true, pts: 25,
            fb: "Remédiation complète et proportionnée. Scan IoC ciblé = identification précise, reformatage = élimination garantie, rotation credentials = invalidation des captures éventuelles, EDR + règles = prévention récidive. C'est le standard NIST SP 800-61.",
            legal: "NIST SP 800-61 + Manuel Ch. 21 — Remédiation par phases structurées.",
            critical: false, next: 7,
          },
          {
            text: "Reformater TOUS les 80 postes du service par précaution maximale, sans analyse préalable.",
            ok: false, pts: -5,
            fb: "Excessif. Le reformatage de masse sans analyse préalable (1) perd des preuves forensiques sur les postes compromis non encore analysés, (2) crée une interruption d'activité disproportionnée, (3) ne renseigne pas sur l'étendue exacte de la compromission. Scan IoC d'abord, reformatage ciblé ensuite.",
            legal: "Manuel Ch. 11 + Principe de proportionnalité — Investiguer avant de détruire les preuves.",
            critical: false, next: 7,
          },
        ],
      },
      {
        phase: "🎙 L'audience civile",
        situation: "Un client bancaire particulièrement impacté (chef d'entreprise, 230 emails exfiltrés, victime ultérieure de whaling via des infos tirées des .pst) intente une action civile contre la banque pour manquement à la sécurité. Il vous demande (comme expert du MP) à être cité comme témoin dans son action civile.",
        law: "<strong>Art. 171 CPC</strong> — Secret de fonction dans un procès civil.<br><strong>Art. 320 CP</strong> — Violation du secret de fonction.<br><strong>Art. 42 al. 2 CO</strong> — Preuve du dommage.<br><strong>Mandat d'expertise</strong> — Limité à la procédure pénale.",
        question: "<strong>Comment gérez-vous cette demande ?</strong>",
        choices: [
          {
            text: "Accepter de témoigner et partager toutes les conclusions techniques de votre rapport pénal.",
            ok: false, pts: -30,
            fb: "Violation grave. Votre rapport d'expertise a été commandé par le MP dans un cadre pénal spécifique. Le transposer dans une action civile sans autorisation = violation du secret de fonction (Art. 320 CP) + dépassement du mandat d'expertise.",
            legal: "Art. 171 CPC + Art. 320 CP — Secret de fonction, transfert d'expertise non autorisé.",
            critical: true, next: "end",
          },
          {
            text: "« Je ne peux témoigner que si : (1) le MP autorise la transmission de mes conclusions au civil, (2) un mandat d'expertise civile m'est délivré formellement (ou j'interviens comme témoin de faits factuels). Mon rapport pénal ne peut être produit en civil qu'après levée du secret de fonction par l'autorité compétente. »",
            ok: true, pts: 25,
            fb: "Position procédurale exemplaire. Vous distinguez clairement les cadres pénal et civil, respectez le secret de fonction, et offrez des voies légales pour votre intervention civile ultérieure. La partie civile peut alors introduire les demandes appropriées.",
            legal: "Art. 171 CPC + Art. 320 CP + pratique MP — Séparation stricte pénal/civil.",
            critical: false, next: "end",
          },
          {
            text: "Refuser catégoriquement sans explication.",
            ok: false, pts: -10,
            fb: "Refus trop abrupt. La partie civile a droit à une explication procédurale claire. Sans explication, elle peut intenter des recours incidents inutiles. Un refus motivé juridiquement évite les malentendus.",
            legal: "Déontologie expert — Communication respectueuse des limites procédurales.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 85 && custodyPct >= 75) return { icon: "🦅", title: "Expert Malware", sub: "Maîtrise avancée du forensique fileless" };
      if (pct >= 65) return { icon: "🔬", title: "Analyste Malware", sub: "Bonnes bases sur les malwares fileless" };
      return { icon: "📚", title: "Formation requise", sub: "Révisez Manuel Ch. 11.2 et MITRE T1055" };
    },
  },

  /* ══════════════════════════════════════════════════
     14. RANSOMWARE_RAID — Ransomware + RAID 5  [HARD]
  ══════════════════════════════════════════════════ */
  {
    id: "ransomware_raid",
    title: "Ransomware + RAID 5",
    icon: "💾",
    difficulty: "hard",
    atmosphere: "ransomware",
    narrative: {
      success: "60% des données sont récupérées depuis les disques 1 et 3. Le rapport honnête sur les 40% irrécupérables est accepté par le DG. La PME survit grâce aux imageries forensiques préalables et à la méthode rigoureuse.",
      degraded: "La récupération est partielle, la méthode fait débat en interne. La PME survit mais garde des séquelles.",
      failure: "La reconstruction RAID hâtive sur les 3 disques propage la corruption. La PME perd 100% de ses données — 18 ans de business effacés en une nuit. Faillite prononcée 6 mois plus tard."
    },
    tags: ["FORENSIQUE", "CRYPTO"],
    legalRefs: ["Manuel Ch. 24.3", "Manuel Ch. 28.4", "GovCERT recommandations"],
    intro: "RAID 5 sur 3 disques. Un disque chiffré par ransomware. Le backup également chiffré. 60% des données potentiellement récupérables. La stratégie de récupération engage votre crédibilité.",
    alertLevel: "RANSOMWARE RAID — Récupération partielle possible",
    objectives: [
      { icon: "💾", text: "Comprendre les limites de RAID 5 face au chiffrement" },
      { icon: "🔍", text: "Appliquer la séquence forensique correcte (image d'abord)" },
      { icon: "🗣️", text: "Communiquer honnêtement sur la récupération AES-256" },
    ],
    debrief: "<p>RAID 5 tolère la perte d'un seul disque — mais un disque chiffré par un ransomware n'est pas «\u00a0perdu\u00a0» au sens du RAID. Le contrôleur RAID voit 3 disques fonctionnels dont l'un contient des données aléatoires (le chiffrement). La reconstruction RAID ne peut pas deviner que ce disque est chiffré.</p>",
    steps: [
      {
        phase: "💾 L'infrastructure compromise",
        situation: `Vous êtes appelé après une attaque ransomware sur un serveur de PME. Le serveur a un <strong>RAID 5 sur 3 disques de 4 To chacun</strong>.<br><br>
<div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem;font-size:.78rem;margin-top:.5rem">
💽 Disque 1 : <span style="color:var(--green)">INTACT</span> — données en clair<br>
💽 Disque 2 : <span style="color:var(--red)">CHIFFRÉ</span> — contenu aléatoire (ransomware)<br>
💽 Disque 3 : <span style="color:var(--green)">INTACT</span> — données en clair<br>
☁️ Backup hebdomadaire : <span style="color:var(--gold)">CHIFFRÉ</span> — mot de passe perdu
</div>`,
        law: "<strong>RAID 5</strong> — Tolérance : 1 disque. Reconstruction possible si 1 seul disque manquant.<br><strong>Manuel Ch. 24.3</strong> — Options de récupération RAID en contexte forensique.",
        question: "<strong>Que peut-on récupérer et comment ?</strong>",
        choices: [
          {
            text: "Reconstruire le RAID avec les 2 disques sains et récupérer 100% des données.",
            ok: false, pts: -20,
            fb: "Impossible. RAID 5 avec 3 disques tolère la perte d'1 seul disque. Avec le disque 2 chiffré (présent avec données aléatoires), le contrôleur RAID voit 3 disques — dont un avec des données corrompues.",
            legal: "Principe RAID 5 — La tolérance aux pannes s'applique aux disques absents, pas aux disques contenant des données corrompues actives.",
            critical: true, next: "end",
          },
          {
            text: "Imager les 2 disques sains, analyser les données accessibles (blocs des disques 1 et 3), puis tenter de reconstruire par parité pour les blocs endommagés.",
            ok: true, pts: 25,
            fb: "Approche correcte. Les disques 1 et 3 contiennent des données en clair — imager et analyser d'abord. Ensuite, la reconstruction partielle par parité peut être tentée pour certains blocs.",
            legal: "Manuel Ch. 24.3 — Forensique RAID : imager chaque disque individuellement avant toute reconstruction. Travail sur les images, jamais sur les originaux.",
            critical: false, next: 1,
          },
          {
            text: "Payer la rançon pour obtenir la clé de déchiffrement.",
            ok: false, pts: -15,
            fb: "Non recommandé. GovCERT et la plupart des CSIRT déconseillent le paiement : il finance la cybercriminalité, ne garantit pas la clé, et peut exposer à des sanctions si le groupe est sur une liste de sanctions internationales.",
            legal: "GovCERT — Ne pas payer les rançons. Possibles sanctions SECO si paiement à un groupe sanctionné.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🔍 Le backup chiffré",
        situation: "Vous avez récupéré 60% des données via les disques sains. Le backup chiffré (AES-256 avec mot de passe perdu) contient potentiellement le 40% restant. Le DG demande si vous pouvez le déchiffrer.",
        law: "<strong>AES-256</strong> — Inviolable par force brute.",
        question: "<strong>Comment répondez-vous au DG sur le backup chiffré ?</strong>",
        choices: [
          {
            text: "«\u00a0Avec suffisamment de ressources, on peut casser AES-256.\u00a0»",
            ok: false, pts: -25,
            fb: "Techniquement faux. AES-256 est mathématiquement inviolable par force brute avec les technologies actuelles et prévisibles. Faire croire le contraire est une erreur grave.",
            legal: "AES-256 — Sécurité asymptotique. Pas de vulnérabilité connue exploitable.",
            critical: true, next: "end",
          },
          {
            text: "«\u00a0Sans le mot de passe, le backup AES-256 est inaccessible. Nous pouvons tenter une attaque par dictionnaire si vous connaissez des patterns du mot de passe. Sinon, ce 40% est perdu.\u00a0»",
            ok: true, pts: 20,
            fb: "Réponse honnête et constructive. Elle exprime l'impossibilité technique, propose la seule alternative réaliste (dictionnaire ciblé si pattern connu) et donne une réponse claire.",
            legal: "Manuel Ch. 28.4 — Formuler l'impossibilité honnêtement tout en proposant les alternatives disponibles.",
            critical: false, next: 2,
          },
          {
            text: "Promettre une récupération à 90% dans les 2 semaines pour rassurer le DG.",
            ok: false, pts: -30,
            fb: "Mensonge professionnel inacceptable. Promettre l'impossible pour rassurer = faux dans les titres (Art. 251 CP) + rupture de la confiance d'expert. Quand l'échec arrivera, la crédibilité sera définitivement détruite.",
            legal: "Art. 251 CP + déontologie DFIR — Honnêteté sans compromis sur les capacités techniques.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🧠 L'attaque dictionnaire intelligente",
        situation: "Le DG révèle que le mot de passe du backup a été créé par son directeur IT (décédé récemment). Vous avez accès au laptop de ce directeur. L'OSINT révèle : marié à Sophie, 2 enfants (Marc 12 ans, Julie 8 ans), fan de football (FC Bâle), chat nommé « Whisker ». Le laptop contient un fichier texte avec notes de mots de passe similaires.",
        law: "<strong>Manuel Ch. 28.5</strong> — Attaque par dictionnaire ciblé OSINT.<br><strong>Hashcat</strong> — Règles de mutation (apostrophe, capitalisation, nombres).",
        question: "<strong>Comment construisez-vous le dictionnaire ciblé ?</strong>",
        choices: [
          {
            text: "Dictionnaire générique de 14M mots (rockyou.txt) + brute force sans ciblage.",
            ok: false, pts: -10,
            fb: "Inefficace. Un AES-256 avec bcrypt/PBKDF2 résiste à rockyou en moins d'une heure. Sans ciblage, la tentative est vouée à l'échec. L'efficacité vient du dictionnaire PERSONNEL.",
            legal: "Manuel Ch. 28.5 — Dictionnaire ciblé > brute force générique.",
            critical: false, next: 3,
          },
          {
            text: "Dictionnaire personnalisé : (1) termes OSINT (Sophie, Marc, Julie, Whisker, FCBasel), (2) dates clés (mariage, naissances), (3) patterns observés dans les autres mots de passe du directeur (capitalisation, suffixes numériques, caractères spéciaux), (4) variations : CUPP (Common User Passwords Profiler), règles Hashcat (rules/best64.rule).",
            ok: true, pts: 25,
            fb: "Approche ciblée optimale. CUPP + règles Hashcat personnalisées = dictionnaire hautement probable. Si le directeur suivait ses patterns habituels, le mot de passe sera trouvé en quelques heures. Toujours essayer l'approche OSINT avant d'abandonner.",
            legal: "Manuel Ch. 28.5 — OSINT + Hashcat rules = approche DFIR standard.",
            critical: false, next: 3,
          },
          {
            text: "Contacter la veuve du directeur pour demander directement les mots de passe de son mari.",
            ok: false, pts: -15,
            fb: "Délicat. La veuve n'est probablement pas dépositaire des mots de passe professionnels. De plus, l'approche doit passer par le DG qui peut coordonner une demande sensible de façon respectueuse. L'expert forensique ne contacte pas directement les familles des décédés.",
            legal: "Déontologie professionnelle — Respect des proches, communication via les canaux appropriés.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🎉 Le mot de passe retrouvé",
        situation: "Après 14 heures de Hashcat avec dictionnaire personnalisé, le mot de passe est trouvé : <code>SophieMarcJulie2012!</code>. Le backup est déchiffré. Vous découvrez qu'il contient les 40% manquants, mais aussi des informations très sensibles : comptes bancaires personnels des employés, dossiers médicaux, discussions internes RH très confidentielles. Le DG vous demande ce qu'il peut consulter.",
        law: "<strong>Art. 248 CPP</strong> — Scellés (si demandés).<br><strong>LPD 2023 Art. 8 + Art. 27</strong> — Principe de minimisation, surveillance employés.<br><strong>Art. 321 CP</strong> — Secret professionnel (données médicales).",
        question: "<strong>Quel conseil donnez-vous au DG ?</strong>",
        choices: [
          {
            text: "« Le backup est à vous, consultez tout ce que vous voulez. »",
            ok: false, pts: -25,
            fb: "Autorisation dangereuse. Même si le backup appartient techniquement à la PME, les données personnelles des employés (médicales, RH, bancaires) sont protégées par la LPD 2023. Le DG ne peut pas les consulter librement.",
            legal: "LPD 2023 Art. 8 + Art. 321 CP — Minimisation + secret professionnel des données RH/médicales.",
            critical: true, next: "end",
          },
          {
            text: "« Restrictions : (1) Données business (documents projet, comptabilité) : accès DG légitime, (2) Données RH confidentielles : accès limité au DRH + DG dans le besoin strict, (3) Données médicales employés : interdites d'accès managérial (Art. 321 CP), à traiter par le médecin du travail uniquement, (4) Comptes bancaires personnels : suppression immédiate, aucun usage légitime. Plan de traitement documenté et notification interne LPD. »",
            ok: true, pts: 25,
            fb: "Conseil juridiquement solide et éthique. Vous distinguez les catégories de données, appliquez le principe de minimisation LPD 2023, et protégez la vie privée des employés. Le DG évite ainsi des violations LPD graves.",
            legal: "LPD 2023 + Art. 321 CP + Manuel Ch. 29.6 — Gestion par catégorie de sensibilité.",
            critical: false, next: 4,
          },
          {
            text: "Refuser de partager le backup avec le DG — les données sont trop sensibles.",
            ok: false, pts: -15,
            fb: "Refus excessif. Le backup appartient à la PME qui est le mandant. Refuser de le rendre = abus de position d'expert. La solution est de le rendre avec un cadre d'usage clair, pas de le retenir.",
            legal: "Pratique DFIR — Le dépositaire rend les données avec recommandations d'usage.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "🔬 L'analyse du ransomware",
        situation: "Parallèlement à la récupération, vous analysez l'échantillon du ransomware (binaire présent sur le disque 2 avant qu'il ne s'auto-supprime). Ghidra révèle : empreinte BlackCat/ALPHV (ransomware RaaS), chiffrement ChaCha20-Poly1305 + AES-256 en couches, ID de victime unique, URL Tor du négociateur, note de rançon en JSON embarqué. La PME hésite à négocier.",
        law: "<strong>SECO Sanctions</strong> — BlackCat/ALPHV opère potentiellement sous sanctions.<br><strong>GovCERT/NCSC</strong> — Déconseille paiement.<br><strong>OFAC US</strong> — Certains affiliés sanctionnés.",
        question: "<strong>Que recommandez-vous à la PME concernant le paiement ?</strong>",
        choices: [
          {
            text: "« Négociez discrètement — la PME doit survivre, peu importe les considérations éthiques. »",
            ok: false, pts: -25,
            fb: "Double erreur. (1) BlackCat a déchiffré correctement dans moins de 70% des cas documentés (beaucoup de victimes paient sans recevoir de clé fonctionnelle). (2) Si BlackCat est listé par OFAC, le paiement expose la PME et ses dirigeants à des sanctions pénales suisses (Art. 9 al. 1 let. e LMB).",
            legal: "SECO + OFAC + Art. 9 al. 1 let. e LMB — Paiement à entité sanctionnée = infraction pénale.",
            critical: true, next: "end",
          },
          {
            text: "« Ne pas payer. (1) Vérifier le statut de sanctions BlackCat via le portail SECO avant toute décision. (2) Les 60% récupérés + le backup déchiffré couvrent probablement l'essentiel. (3) Investir le budget rançon dans la reconstruction + durcissement (EDR, MFA, backups offline). (4) Notification obligatoire fedpol (cybercrime) pour contribuer à l'enquête nationale. »",
            ok: true, pts: 25,
            fb: "Recommandation conforme aux standards suisses. Vérification légale préalable + alternative constructive + contribution à l'enquête collective = comportement exemplaire d'une PME victime. Le GovCERT et fedpol saluent ce type de réaction.",
            legal: "SECO + GovCERT/NCSC + Art. 10a CP (cybercrime) — Standard suisse anti-ransomware.",
            critical: false, next: 5,
          },
          {
            text: "Négocier pour gagner du temps (faire semblant d'envisager) sans réelle intention de payer.",
            ok: false, pts: -15,
            fb: "Risqué. Entrer en négociation même factice (1) envoie un signal que la PME est solvable, (2) peut entraîner des menaces supplémentaires (publication données), (3) n'apporte pas de bénéfice opérationnel. Le silence ou le refus clair et public est souvent plus stratégique.",
            legal: "Doctrine NCSC — Silence ou refus clair plutôt que simulation de négociation.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "📊 Le rapport de récupération",
        situation: "Vous devez produire un rapport formel pour le DG et le conseil d'administration. Vous devez documenter : ce qui a été récupéré, ce qui est perdu définitivement, les causes de l'incident, les recommandations pour éviter une récidive.",
        law: "<strong>Manuel Ch. 29.7</strong> — Structure d'un rapport forensique post-incident.<br><strong>NIST SP 800-61</strong> — Lessons Learned.<br><strong>FINMA Circulaire 2023/1</strong> — Rapport d'incident.",
        question: "<strong>Quelle structure choisissez-vous pour le rapport ?</strong>",
        choices: [
          {
            text: "Rapport technique de 200 pages avec tous les détails forensiques.",
            ok: false, pts: -10,
            fb: "Inadapté à l'audience. Un CA ne lira pas 200 pages. Structure pyramidale obligatoire : synthèse exécutive d'1 page + rapport technique détaillé en annexe pour les spécialistes.",
            legal: "Manuel Ch. 29.7 — Adapter le niveau de détail à chaque audience.",
            critical: false, next: 6,
          },
          {
            text: "Rapport pyramidal : (1) Synthèse exécutive 1 page (CA), (2) Résumé technique 5 pages (DG/CISO), (3) Rapport détaillé 80 pages + annexes techniques (équipe IT/audit). Chaque niveau couvre : timeline factuelle, récupération (60%+40% via dictionnaire = 98%, 2% perdus), causes racines (email phishing, pas de MFA admin, backup unique), 7 recommandations actionnables avec priorités + chiffrages.",
            ok: true, pts: 25,
            fb: "Structure professionnelle optimale. Chaque audience reçoit le niveau d'information adapté. Les recommandations sont actionnables et chiffrées (facilite la décision CA). C'est le standard NIST SP 800-61 adapté au contexte suisse.",
            legal: "NIST SP 800-61 + Manuel Ch. 29.7 — Rapport incident standard.",
            critical: false, next: 6,
          },
          {
            text: "Rapport oral uniquement en réunion du CA, pas de trace écrite pour éviter les fuites.",
            ok: false, pts: -25,
            fb: "Manquement grave. Un rapport écrit est nécessaire pour : (1) traçabilité juridique, (2) base pour plan d'action, (3) éléments pour assurances cyber, (4) archive pour futurs incidents. L'oral sans trace = perte de valeur considérable.",
            legal: "FINMA + pratique assurance cyber — Rapport écrit obligatoire pour traçabilité.",
            critical: false, next: 6,
          },
        ],
      },
      {
        phase: "🏥 La question assurance cyber",
        situation: "La PME a une assurance cyber avec franchise de 50'000 CHF et couverture max 500'000 CHF. L'assureur demande un rapport d'expertise détaillé pour approuver l'indemnisation. Le DG vous demande si vous êtes disponible pour cette expertise supplémentaire.",
        law: "<strong>Art. 56 CPC</strong> — Indépendance de l'expert.<br><strong>Loi fédérale assurances (LCA)</strong> — Expertise contradictoire.<br><strong>Art. 168 CPC</strong> — Moyens de preuve.",
        question: "<strong>Quelle est votre position sur ce double mandat ?</strong>",
        choices: [
          {
            text: "Accepter immédiatement — plus de mandats = plus de revenus.",
            ok: false, pts: -25,
            fb: "Conflit d'intérêts potentiel. Si vous êtes mandaté par la PME pour la récupération ET pour l'expertise d'assurance, votre neutralité peut être contestée par l'assureur. Il faut distinguer les rôles.",
            legal: "Art. 56 CPC + déontologie expert — Éviter tout conflit de rôles.",
            critical: true, next: "end",
          },
          {
            text: "« Je peux fournir mon rapport technique existant à l'assureur (avec autorisation de la PME). Pour une expertise spécifique au sinistre (évaluation du dommage, recommandations post-sinistre), je recommande un expert indépendant mandaté conjointement par la PME et l'assureur. Cette séparation des rôles protège toutes les parties. »",
            ok: true, pts: 25,
            fb: "Position exemplaire. Vous distinguez rapport technique existant (transmissible) et expertise d'évaluation (qui doit être indépendante). C'est la meilleure protection de l'intégrité de vos analyses. Les assureurs préfèrent cette approche.",
            legal: "Art. 56 CPC + LCA + pratique assurance cyber — Séparation des mandats.",
            critical: false, next: 7,
          },
          {
            text: "Refuser catégoriquement toute interaction avec l'assureur — c'est l'affaire de la PME.",
            ok: false, pts: -10,
            fb: "Position trop rigide. Votre rapport technique est un livrable que la PME peut utiliser (avec votre autorisation). Refuser toute interaction pénalise votre mandant sans raison valable.",
            legal: "Pratique — L'expert peut autoriser l'usage extensif de son rapport, c'est la nouvelle expertise qui pose problème.",
            critical: false, next: 7,
          },
        ],
      },
      {
        phase: "🛠 Le plan de durcissement",
        situation: "La PME veut éviter une récidive. Le budget de durcissement est de 80'000 CHF. Vous devez recommander les 5 mesures les plus efficaces, priorisées par ratio impact/coût.",
        law: "<strong>NIST CSF</strong> — Identify, Protect, Detect, Respond, Recover.<br><strong>CIS Controls v8</strong> — Contrôles prioritaires.<br><strong>GovCERT Guide PME</strong> — Recommandations contextualisées.",
        question: "<strong>Quelle est votre priorisation pour 80'000 CHF ?</strong>",
        choices: [
          {
            text: "Tout investir dans un SIEM enterprise sophistiqué + consultant permanent.",
            ok: false, pts: -15,
            fb: "Inadapté à la taille. Un SIEM enterprise coûte 100-300k/an en licences + personnel. Pour une PME de 30 personnes, c'est surdimensionné et inexploitable. Commencer par les fondamentaux CIS Controls.",
            legal: "CIS Controls v8 + Guide GovCERT PME — Adapter les solutions à la taille.",
            critical: false, next: "end",
          },
          {
            text: "Priorisation par impact/coût : (1) MFA obligatoire partout (2k CHF, impact énorme), (2) Backups offline + immuables sur site séparé (15k), (3) EDR managé (type Microsoft Defender for Business, 8k/an), (4) Formation phishing réaliste + simulations (5k/an), (5) Segmentation réseau + VLAN (12k one-shot) + audit annuel (3k). Total ~45k implémentation + 11k/an récurrent. Budget restant = buffer sécurité.",
            ok: true, pts: 25,
            fb: "Priorisation exemplaire. Chaque mesure cible un vecteur démontré (phishing → formation, credentials → MFA, ransomware → backups immuables + EDR, lateral movement → segmentation). Ratio impact/coût optimal pour une PME. Conforme aux guides GovCERT et CIS Controls.",
            legal: "CIS Controls v8 + NIST CSF + Guide GovCERT PME — Approche pragmatique PME.",
            critical: false, next: "end",
          },
          {
            text: "Recommander une cyber-assurance plus importante plutôt que du durcissement technique.",
            ok: false, pts: -20,
            fb: "Erreur stratégique. L'assurance couvre les dommages post-incident mais ne prévient rien. De plus, les assureurs exigent de plus en plus des mesures techniques minimales (MFA, EDR) avant de couvrir. Investir dans la prévention = réduire les primes et les risques.",
            legal: "LCA + pratique cyber-assurance 2024+ — MFA et EDR deviennent prérequis contractuels.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 85 && custodyPct >= 75) return { icon: "💾", title: "Expert RAID Forensique", sub: "Maîtrise avancée de la récupération RAID" };
      if (pct >= 65) return { icon: "🔬", title: "Analyste Forensique", sub: "Bonnes bases en forensique RAID" };
      return { icon: "📚", title: "Formation requise", sub: "Révisez Manuel Ch. 24.3 et les principes RAID" };
    },
  },

  /* ══════════════════════════════════════════════════
     15. TIMELINE — Corrélation Timeline  [HARD]
  ══════════════════════════════════════════════════ */
  {
    id: "timeline",
    title: "Corrélation Timeline",
    icon: "🧩",
    difficulty: "hard",
    atmosphere: "",
    narrative: {
      success: "La chronologie normalisée UTC est acceptée par le juge. La séquence causale est limpide : connexion → lancement → navigation → ouverture. Le suspect est confondu, la timeline est irréfutable.",
      degraded: "La chronologie est acceptée mais contestée par la défense qui invoque des imprécisions de fuseau. L'affaire traîne.",
      failure: "Les erreurs de fuseau horaire invalident toute la timeline. Le juge la rejette intégralement. L'enquête perd son pilier chronologique."
    },
    tags: ["FORENSIQUE", "WINDOWS"],
    legalRefs: ["Manuel Ch. 29.4", "Art. 139 CPP", "ATF 143 IV 330"],
    intro: "5 artefacts, 5 timestamps, 2 fuseaux différents. Vous devez reconstruire la chronologie exacte des événements. Une seule erreur de conversion UTC peut invalider toute votre analyse.",
    alertLevel: "TIMELINE COMPLEXE — Normalisation UTC obligatoire",
    objectives: [
      { icon: "🧩", text: "Normaliser tous les timestamps en UTC avant corrélation" },
      { icon: "📊", text: "Reconstruire la séquence causale correcte des événements" },
      { icon: "⚖️", text: "Documenter selon ATF 143 IV 330 pour valeur probante maximale" },
    ],
    debrief: "<p>La reconstruction chronologique (Manuel Ch. 29.4) est l'un des exercices les plus complexes en forensique numérique. Les timestamps de différents artefacts utilisent des fuseaux, des précisions et des origines différentes. Il faut normaliser avant de corréler.</p><p>Règle d'or : ne jamais prendre un timestamp pour argent comptant. Vérifier la source de l'horloge, le fuseau, et croiser avec au moins deux autres artefacts.</p>",
    steps: [
      {
        phase: "🧩 Les 5 artefacts",
        situation: `Vous avez 5 artefacts avec des timestamps différents pour la même période :<br><br>
<div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-top:.5rem">
<table style="width:100%;border-collapse:collapse;font-size:.77rem">
<tr style="background:var(--surface2)"><th style="padding:.5rem .75rem;text-align:left;border-bottom:1px solid var(--border)">Artefact</th><th style="padding:.5rem .75rem;text-align:left;border-bottom:1px solid var(--border)">Timestamp</th><th style="padding:.5rem .75rem;text-align:left;border-bottom:1px solid var(--border)">Fuseau</th></tr>
<tr><td style="padding:.45rem .75rem;border-bottom:1px solid var(--border)">Event ID 4624 (connexion)</td><td style="padding:.45rem .75rem;border-bottom:1px solid var(--border);font-family:monospace">10:41:05</td><td style="padding:.45rem .75rem;border-bottom:1px solid var(--border)">UTC</td></tr>
<tr style="background:rgba(255,255,255,.02)"><td style="padding:.45rem .75rem;border-bottom:1px solid var(--border)">Prefetch EXCEL.EXE</td><td style="padding:.45rem .75rem;border-bottom:1px solid var(--border);font-family:monospace">11:43:07</td><td style="padding:.45rem .75rem;border-bottom:1px solid var(--border)">UTC+1 (heure locale PC)</td></tr>
<tr><td style="padding:.45rem .75rem;border-bottom:1px solid var(--border)">ShellBag E:\\Projets\\</td><td style="padding:.45rem .75rem;border-bottom:1px solid var(--border);font-family:monospace">10:43:22</td><td style="padding:.45rem .75rem;border-bottom:1px solid var(--border)">UTC (NTFS)</td></tr>
<tr style="background:rgba(255,255,255,.02)"><td style="padding:.45rem .75rem;border-bottom:1px solid var(--border)">USBSTOR connexion</td><td style="padding:.45rem .75rem;border-bottom:1px solid var(--border);font-family:monospace">10:41:05</td><td style="padding:.45rem .75rem;border-bottom:1px solid var(--border)">UTC (SYSTEM hive)</td></tr>
<tr><td style="padding:.45rem .75rem">Fichier .lnk créé</td><td style="padding:.45rem .75rem;font-family:monospace">11:44:37</td><td style="padding:.45rem .75rem">UTC+1 (NTFS $SI)</td></tr>
</table>
</div>`,
        law: "<strong>Manuel Ch. 29.4</strong> — Normalisation UTC obligatoire avant corrélation.<br><strong>Art. 139 CPP</strong> — Preuve par indices : la chronologie normalisée vaut indice grave si étayée par plusieurs artefacts indépendants.",
        question: "<strong>Quelle est la chronologie correcte après normalisation en UTC ?</strong>",
        choices: [
          {
            text: "10:41:05 → 10:41:05 → 10:43:22 → 11:43:07 → 11:44:37 (sans conversion)",
            ok: false, pts: -15,
            fb: "Erreur. Le Prefetch (11:43:07 UTC+1) et le .lnk (11:44:37 UTC+1) sont en heure locale. Convertis en UTC : 10:43:07 et 10:44:37. L'ordre sans conversion mélange UTC et UTC+1.",
            legal: "Manuel Ch. 29.4 — Toujours normaliser en UTC avant de corréler.",
            critical: false, next: 1,
          },
          {
            text: "10:41:05 (login + USB) → 10:43:07 (Excel lancé) → 10:43:22 (navigation ShellBag) → 10:44:37 (.lnk créé) — tout normalisé en UTC.",
            ok: true, pts: 25,
            fb: "Chronologie correcte. Après normalisation : Prefetch 11:43:07 UTC+1 = 10:43:07 UTC. .lnk 11:44:37 UTC+1 = 10:44:37 UTC. Séquence logique : connexion → lancement Excel → navigation → ouverture du fichier cible.",
            legal: "Manuel Ch. 29.4 — Normalisation UTC obligatoire. Séquence causalement cohérente.",
            critical: false, next: 1,
          },
          {
            text: "Les timestamps sont incohérents — la corrélation est impossible.",
            ok: false, pts: -10,
            fb: "Les timestamps ne sont pas incohérents — ils utilisent des fuseaux différents, ce qui est normal. La normalisation en UTC est la solution standard.",
            legal: "Manuel Ch. 29.4 — L'incohérence apparente des fuseaux est résolue par normalisation, pas par abandon.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "⏱ L'heure d'été",
        situation: "Les faits ont eu lieu le <strong>26 mars à 10h41 UTC</strong>. Or ce jour-là, la Suisse est passée de CET (UTC+1) à CEST (UTC+2) à 02h00 dans la nuit. Les horloges système locales du PC sont soudainement avancées d'une heure. Certains de vos artefacts datent d'avant 02h et d'autres après — comment gérer la cohérence ?",
        law: "<strong>IANA Timezone Database</strong> — Historique des transitions DST.<br><strong>Manuel Ch. 29.4</strong> — DST : toujours stocker en UTC, appliquer le fuseau local pour affichage uniquement.",
        question: "<strong>Comment traitez-vous ces timestamps autour du changement d'heure ?</strong>",
        choices: [
          {
            text: "Utiliser systématiquement le fuseau UTC+1 puisque c'était le fuseau au début de la journée.",
            ok: false, pts: -20,
            fb: "Erreur grave. Après 02h00 ce jour-là, le fuseau local est UTC+2 (CEST). Utiliser UTC+1 introduit 1h d'erreur sur tous les timestamps post-02h. Cette confusion peut invalider toute la timeline à l'audience.",
            legal: "IANA Database + Manuel Ch. 29.4 — Les transitions DST sont des points critiques de la forensique temporelle.",
            critical: true, next: "end",
          },
          {
            text: "Convertir chaque timestamp en UTC via la base IANA en tenant compte de la transition CET→CEST à 02h00 le 26 mars. Documenter explicitement la conversion dans le rapport pour chaque artefact.",
            ok: true, pts: 25,
            fb: "Approche rigoureuse. Utiliser la base IANA garantit la précision même autour des transitions DST. Documenter explicitement la conversion protège contre les contestations de la défense. C'est le standard DFIR international.",
            legal: "IANA Database + ISO 8601 + Manuel Ch. 29.4 — Normalisation UTC documentée.",
            critical: false, next: 2,
          },
          {
            text: "Ignorer les timestamps et se baser uniquement sur la séquence des Event IDs.",
            ok: false, pts: -15,
            fb: "Trop restrictif. La séquence des Event IDs ne donne pas la durée entre événements, ni la corrélation avec des artefacts externes (USBSTOR d'un autre processus). L'horodatage précis est valeur ajoutée majeure — le normaliser correctement, pas l'ignorer.",
            legal: "Manuel Ch. 29.4 — L'horodatage reste la colonne vertébrale de la timeline.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🔧 L'outil plaso / log2timeline",
        situation: "Pour automatiser la normalisation, vous décidez d'utiliser plaso (log2timeline) qui ingère une image forensique et produit une timeline unifiée en UTC. Le tech-support suggère d'utiliser aussi Timesketch pour visualiser. Vous lancez : <code>log2timeline.py storage.plaso image.E01 --parsers=winreg,prefetch,mft,usnjrnl,evtx</code>. L'ingestion prend 6h pour 500 Go.",
        law: "<strong>plaso / log2timeline</strong> — Framework open-source de référence.<br><strong>Timesketch</strong> — Interface de visualisation collaborative.<br><strong>ACPO Principle 3</strong> — Reproductibilité via outils standards.",
        question: "<strong>Comment documentez-vous l'utilisation de plaso dans le rapport ?</strong>",
        choices: [
          {
            text: "Indiquer seulement : « Timeline produite avec plaso. »",
            ok: false, pts: -15,
            fb: "Insuffisant pour reproductibilité. Un contre-expert doit pouvoir reproduire exactement la timeline. Préciser : version de plaso, commande exacte, parsers utilisés, hash de l'image source, hash du fichier storage.plaso produit.",
            legal: "ACPO Principle 3 — Reproductibilité exige documentation complète.",
            critical: false, next: 3,
          },
          {
            text: "Documenter : (1) plaso version 20230717, (2) commande complète + parameters, (3) parsers activés (winreg, prefetch, mft, usnjrnl, evtx), (4) hash SHA-256 de l'image E01 source, (5) hash SHA-256 du fichier storage.plaso résultant, (6) version IANA tz database (tzdata2024a), (7) requête psort utilisée pour filtrage final.",
            ok: true, pts: 25,
            fb: "Documentation forensique exemplaire. Tous les éléments nécessaires à la reproductibilité exacte sont présents. Un contre-expert peut répliquer votre analyse bit-pour-bit. C'est le standard ACPO appliqué à un outil moderne.",
            legal: "ACPO Principle 3 + Manuel Ch. 29.7 — Documentation reproductible complète.",
            critical: false, next: 3,
          },
          {
            text: "Ne pas utiliser plaso — faire la timeline manuellement pour garder le contrôle.",
            ok: false, pts: -10,
            fb: "Sous-optimal. plaso automatise la normalisation de 150+ formats de timestamps, ce qui serait chronophage et error-prone à faire manuellement sur 500 Go. L'important est de documenter l'usage, pas de renoncer à l'outil standard.",
            legal: "Manuel Ch. 29.4 — Outils standards documentés > reconstruction manuelle.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🕵 L'anti-forensique détectée",
        situation: "La timeline plaso révèle une anomalie : un gap de 14 minutes (10h28 à 10h42) sans AUCUN événement, alors que l'utilisateur était actif avant et après. Cela ressemble à un effacement ciblé. Vous investiguez les logs Event ID 1102 (Clearing of audit log), USN Journal ($UsnJrnl $J), et scripts récents exécutés.",
        law: "<strong>Event ID 1102</strong> — Security log cleared (traces d'effacement).<br><strong>$UsnJrnl</strong> — Ne peut pas être effacé sans laisser de trace (wrap autour).<br><strong>Art. 251 CP</strong> — Suppression de preuves.",
        question: "<strong>Que recherchez-vous et comment interprétez-vous le gap ?</strong>",
        choices: [
          {
            text: "Considérer le gap comme simple absence d'activité utilisateur — rien à investiguer.",
            ok: false, pts: -20,
            fb: "Interprétation trop indulgente. Un gap de 14 min dans une session active est suspect. Surtout coincidant avec la fenêtre d'intérêt judiciaire. L'hypothèse d'effacement ciblé doit être testée, pas écartée par défaut.",
            legal: "Manuel Ch. 20 — L'anti-forensique doit être systématiquement recherchée.",
            critical: false, next: 4,
          },
          {
            text: "Chercher : (1) Event 1102 dans la Security log, (2) traces dans $UsnJrnl $J (qui conserve les opérations NTFS même après suppression), (3) Shadow Copies antérieures (vssadmin list shadows), (4) scripts exécutés dans PowerShell History, (5) si Event 104 (System log cleared) présent, (6) patterns de overwrite dans le journal. Ces artefacts permettent de distinguer absence d'activité et effacement délibéré.",
            ok: true, pts: 25,
            fb: "Investigation exhaustive et correcte. Les artefacts anti-forensiques laissent toujours des traces indirectes. $UsnJrnl est particulièrement précieux : même si les logs principaux sont effacés, les opérations sur le NTFS y sont encore (jusqu'au wrap). Shadow Copies peuvent conserver une version antérieure des logs.",
            legal: "Manuel Ch. 20 + Art. 251 CP — Détection systématique des tentatives d'effacement.",
            critical: false, next: 4,
          },
          {
            text: "Considérer le gap comme preuve automatique d'effacement et de culpabilité.",
            ok: false, pts: -15,
            fb: "Sur-interprétation. Un gap peut avoir plusieurs causes : pause naturelle, crash système, mise en veille, bug logiciel. Conclure à l'effacement sans en prouver les traces = spéculation. Il faut démontrer techniquement.",
            legal: "Manuel Ch. 29.3 — Ne jamais conclure à l'anti-forensique sans preuve positive.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "📈 La visualisation Timesketch",
        situation: "Vous importez la timeline dans Timesketch (270'000 événements au total). Vous devez filtrer pour présenter au juge uniquement les événements pertinents autour de la fenêtre 10h00-11h00 le 26 mars. La défense demandera à voir aussi la timeline « non filtrée » pour vérifier qu'aucun élément décharge n'a été caché.",
        law: "<strong>Art. 147 CPP</strong> — Droit de participation aux actes d'instruction.<br><strong>Manuel Ch. 29.6</strong> — Divulgation des éléments favorables à la défense.<br><strong>Art. 141 CPP</strong> — Exploitation des preuves.",
        question: "<strong>Comment gérez-vous la visualisation et le filtrage ?</strong>",
        choices: [
          {
            text: "Produire uniquement la timeline filtrée 10h00-11h00 pour le juge — plus lisible.",
            ok: false, pts: -25,
            fb: "Violation du principe de divulgation. La défense a droit à la timeline COMPLÈTE pour identifier d'éventuels éléments à décharge. Filtrer unilatéralement sans donner accès au complet = présomption de dissimulation = exclusion probable.",
            legal: "Art. 147 CPP + Manuel Ch. 29.6 — Transparence totale envers les parties.",
            critical: true, next: "end",
          },
          {
            text: "Produire deux livrables : (1) synthèse filtrée 10h00-11h00 avec graphique pour l'audience, (2) timeline complète (270k événements) dans le storage.plaso joint aux annexes, consultable par toutes les parties. Documenter les critères de filtrage pour permettre reproduction.",
            ok: true, pts: 25,
            fb: "Approche optimale. Le filtrage pour présentation (audience) + disponibilité intégrale (annexes) = transparence + utilisabilité. La défense peut refaire ses propres filtres. C'est la pratique DFIR moderne combinée aux exigences procédurales suisses.",
            legal: "Art. 147 CPP + ACPO Principle 3 — Transparence + reproductibilité.",
            critical: false, next: 5,
          },
          {
            text: "Produire la timeline complète sans filtrage — que le juge se débrouille.",
            ok: false, pts: -10,
            fb: "Manquement au rôle d'expert. 270k événements bruts sont inutilisables pour un juge. L'expert doit synthétiser tout en préservant l'accès aux données brutes. Sans synthèse = rapport inefficace.",
            legal: "Art. 184 CPP — L'expert rend le technique accessible pour la décision judiciaire.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "🎯 La contre-expertise",
        situation: "L'avocat de la défense mandate un contre-expert (ancien RTS investigation, reconverti). Ce dernier produit sa propre timeline avec des timestamps divergents de 30 secondes sur certains événements. Il conclut que « la séquence n'est pas établie au-delà du doute raisonnable ».",
        law: "<strong>Art. 189 CPP</strong> — Expertise contradictoire.<br><strong>NTP (Network Time Protocol)</strong> — Dérive maximale acceptable généralement 1-2 secondes sur un PC bien configuré.<br><strong>Manuel Ch. 29.4</strong> — Tolérance temporelle inter-sources.",
        question: "<strong>Comment répondez-vous à la divergence de 30 secondes ?</strong>",
        choices: [
          {
            text: "Admettre que 30 secondes de divergence invalident la timeline.",
            ok: false, pts: -20,
            fb: "Capitulation injustifiée. 30 secondes sur une séquence où les événements sont séparés de plusieurs minutes ne changent pas l'ordre causal. C'est le ratio divergence/intervalle qui compte, pas la valeur absolue.",
            legal: "Manuel Ch. 29.4 — La tolérance temporelle doit être proportionnée aux intervalles observés.",
            critical: false, next: 6,
          },
          {
            text: "Démontrer : (1) Analyse du Time Service Windows (w32tm) — dérive maximale observée 2.3s dans les 30 derniers jours, cohérent avec les 30s de divergence si le contre-expert n'a pas synchronisé sur la même source NTP. (2) La séquence CAUSALE reste identique : les 30s ne changent pas l'ordre. (3) Proposer un test commun : re-parser l'image source avec les mêmes paramètres pour réconciliation.",
            ok: true, pts: 25,
            fb: "Réponse d'expert. Vous distinguez divergence absolue (30s) et séquence causale (inchangée). Vous proposez un test reproductible qui lèvera le doute. Un juge apprécie ce type de démarche constructive vs un débat d'experts stérile.",
            legal: "Art. 189 CPP + Manuel Ch. 29.4 — Confrontation technique réconciliable.",
            critical: false, next: 6,
          },
          {
            text: "Accuser le contre-expert d'incompétence en public.",
            ok: false, pts: -30,
            fb: "Comportement inacceptable. Attaquer un confrère en audience = rupture de la déontologie professionnelle. Même si le contre-expert commet des erreurs, la réponse doit rester technique et courtoise.",
            legal: "Code de déontologie — Respect entre experts à la barre.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "⚖️ L'argument ATF 143 IV 330",
        situation: "À l'audience, la défense invoque l'ATF 143 IV 330 (TF 2017) qui a rappelé que « les preuves numériques temporelles doivent être corroborées par au moins une source indépendante pour constituer un indice grave ». L'avocat argue que votre timeline, basée principalement sur les artefacts NTFS, ne satisfait pas ce critère.",
        law: "<strong>ATF 143 IV 330 (2017)</strong> — Exigence de corroboration multi-sources pour timestamps.<br><strong>Art. 139 CPP</strong> — Preuve par indices.<br><strong>NTP / Windows Time</strong> — Sources externes de vérification.",
        question: "<strong>Comment défendez-vous votre timeline face à l'ATF 143 IV 330 ?</strong>",
        choices: [
          {
            text: "Démontrer : (1) Mes artefacts ne sont pas uniquement NTFS — ils incluent Event Logs (source différente : Security provider), USBSTOR (Registry hive SYSTEM), ShellBags (Registry hive NTUSER.DAT), et .lnk NTFS. Ce sont 4 subsystems indépendants avec mécanismes d'horodatage distincts. (2) Corroboration externe : les logs NTP Windows (w32tm stripchart) montrent synchronisation continue avec ntp.swisscom.ch. (3) La convergence des 4 sources à ±2 secondes satisfait largement le critère de l'ATF.",
            ok: true, pts: 25,
            fb: "Défense juridique et technique exemplaire. Vous démontrez que votre timeline n'est PAS mono-source (confusion de la défense entre NTFS et « Windows »), et vous fournissez une corroboration externe (NTP). L'ATF 143 IV 330 est respecté par la convergence multi-sources documentée.",
            legal: "ATF 143 IV 330 + Manuel Ch. 29.4 — Multi-sources démontrée + corroboration NTP externe.",
            critical: false, next: 7,
          },
          {
            text: "Reconnaître que l'ATF invalide votre approche et retirer la timeline.",
            ok: false, pts: -25,
            fb: "Retrait injustifié. L'ATF 143 IV 330 n'interdit pas les timelines — il exige la corroboration multi-sources, ce que vous avez. Céder sans débat technique = abandonner une preuve valide devant un argument juridique mal interprété.",
            legal: "ATF 143 IV 330 — Exige corroboration, n'interdit pas les timelines.",
            critical: false, next: 7,
          },
          {
            text: "Argumenter que l'ATF 143 IV 330 est dépassé technologiquement.",
            ok: false, pts: -30,
            fb: "Argument irrecevable. Les ATF restent contraignants jusqu'à leur révision par le TF. Déclarer un ATF « dépassé » à l'audience = discrédit immédiat. La bonne approche est de montrer que votre travail REPOND aux exigences de l'ATF, pas de contester son autorité.",
            legal: "Hiérarchie des sources — Les ATF s'appliquent tant qu'ils ne sont pas révisés.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📝 Le rapport final consolidé",
        situation: "Le juge accepte votre timeline. Vous consolidez le rapport pour le dossier définitif. Il doit tenir face à un éventuel recours en appel. Vous incluez également une section « Tests de stress » où vous avez volontairement tenté de falsifier votre propre analyse pour prouver sa robustesse.",
        law: "<strong>Manuel Ch. 29.7</strong> — Auto-vérification par tests contradictoires.<br><strong>ACPO Principle 4</strong> — Responsabilité personnelle de l'expert.",
        question: "<strong>Que contient votre section « Tests de stress » ?</strong>",
        choices: [
          {
            text: "Des éloges de la méthode utilisée et de sa robustesse.",
            ok: false, pts: -15,
            fb: "Auto-satisfaction inappropriée. Une section « tests de stress » doit documenter des tentatives RÉELLES de falsifier sa propre analyse, pas auto-célébrer. C'est l'équivalent scientifique de la réplication : si on n'arrive PAS à casser sa propre analyse, elle est robuste.",
            legal: "Méthode scientifique + ACPO Principle 4 — Tester ses propres hypothèses.",
            critical: false, next: "end",
          },
          {
            text: "Documenter : (1) Test 1 : re-parser avec plaso version antérieure (2022) → même timeline ±2s. (2) Test 2 : re-parser avec outil concurrent (EnCase Timeline) → même séquence. (3) Test 3 : simulation d'un gap d'heure d'été mal géré → produirait un ordre différent (réfutation). (4) Test 4 : vérification de la clock skew sur d'autres machines du domaine à la même période → cohérente. Conclusion : l'hypothèse « la timeline est fausse » n'a pas résisté aux tests.",
            ok: true, pts: 25,
            fb: "Section de rigueur scientifique exceptionnelle. Chaque test documenté prouve que votre analyse résiste à la falsification. C'est le standard de l'expertise forensique de haut niveau : non seulement établir le fait, mais démontrer sa robustesse empirique.",
            legal: "Méthode scientifique + Manuel Ch. 29.7 — Validation par auto-falsification.",
            critical: false, next: "end",
          },
          {
            text: "Omettre la section pour éviter de donner des munitions à la défense.",
            ok: false, pts: -20,
            fb: "Stratégie à courte vue. Une section tests de stress RENFORCE le rapport — c'est une démonstration de rigueur. L'omettre revient à priver le rapport d'un pilier méthodologique. La défense peut toujours tenter ses propres tests ; autant anticiper.",
            legal: "Manuel Ch. 29.7 — La transparence méthodologique renforce la crédibilité.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 85 && custodyPct >= 75) return { icon: "🧩", title: "Expert Timeline", sub: "Maîtrise avancée de la corrélation temporelle" };
      if (pct >= 65) return { icon: "🔬", title: "Analyste Temporel", sub: "Bonnes bases en normalisation UTC" };
      return { icon: "📚", title: "Formation requise", sub: "Révisez Manuel Ch. 29.4 — Normalisation UTC" };
    },
  },

  /* ══════════════════════════════════════════════════
     16. VERACRYPT — Le Volume VeraCrypt  [HARD]
  ══════════════════════════════════════════════════ */
  {
    id: "veracrypt",
    title: "Le Volume VeraCrypt",
    icon: "🔒",
    difficulty: "hard",
    atmosphere: "crypto",
    narrative: {
      success: "Le rapport formulé correctement (entropie + absence de signature = probable conteneur chiffré) est accepté sans réserve. Le droit au silence du suspect est respecté. Le volume reste inaccessible, mais le rapport tient juridiquement.",
      degraded: "Le rapport est accepté avec réserves. Le contenu reste inaccessible — les 8 Go gardent leur secret.",
      failure: "Votre affirmation trop forte (« contient des données compromettantes ») est qualifiée de faux dans les titres (art. 251 CP). Plainte est déposée contre vous. Votre carrière d'expert s'arrête."
    },
    tags: ["CRYPTO", "DROIT"],
    legalRefs: ["Manuel Ch. 24.2", "Art. 113 CPP", "Art. 251 CP", "Manuel Ch. 28.4"],
    intro: "Un fichier de 8 Go avec entropie 0.998. Aucune signature reconnue. Probablement un volume VeraCrypt. Le MP veut savoir ce qu'il contient. Mais sans la clé, que peut-on affirmer ?",
    alertLevel: "VOLUME CHIFFRÉ — Limites forensiques à communiquer",
    objectives: [
      { icon: "🔒", text: "Formuler la détection d'un volume chiffré sans sur-affirmer" },
      { icon: "⚖️", text: "Respecter le droit au silence du suspect (Art. 113 CPP — nemo tenetur)" },
      { icon: "🔑", text: "Identifier les alternatives réalistes (RAM dump, keyfile)" },
    ],
    debrief: "<p>Le Manuel (Ch. 24.2) est explicite : «\u00a0affirmer qu'un volume VeraCrypt contient des données compromettantes sans en connaître le contenu constitue une opinion inadmissible, non un fait forensique.\u00a0»</p><p>La détection d'un volume chiffré repose sur des indicateurs statistiques (haute entropie, absence de magic bytes) — jamais sur une certitude.</p>",
    steps: [
      {
        phase: "🔐 Le fichier mystérieux",
        situation: "Sur le disque analysé, X-Ways signale un fichier de 8 Go nommé <code>backup_photos.dat</code> avec une entropie de 0.998 (quasi-maximale). Aucune magic bytes reconnue. Le fichier n'a aucune structure interne identifiable.",
        law: "<strong>Manuel Ch. 24.2</strong> — Entropie maximale = probable chiffrement ou compression forte.<br><strong>Art. 113 CPP</strong> — Le suspect peut refuser de déchiffrer : nemo tenetur.",
        question: "<strong>Comment qualifiez-vous ce fichier dans votre rapport ?</strong>",
        choices: [
          {
            text: "«\u00a0Le fichier backup_photos.dat est un volume VeraCrypt contenant des données cachées.\u00a0»",
            ok: false, pts: -25,
            fb: "Affirmation inadmissible. Sans déchiffrement du volume, il est impossible de prouver qu'il s'agit de VeraCrypt ni qu'il contient quoi que ce soit.",
            legal: "Art. 251 CP — Un expert qui présente une opinion comme un fait engage sa responsabilité pénale.",
            critical: true, next: "end",
          },
          {
            text: "«\u00a0Le fichier backup_photos.dat présente une entropie de 0.998/1.000 et ne contient aucune signature de format reconnue, conditions caractéristiques d'un conteneur chiffré. Son contenu ne peut être examiné sans la clé de déchiffrement.\u00a0»",
            ok: true, pts: 25,
            fb: "Formulation forensique correcte. Elle décrit les faits mesurables (entropie, absence de signature), leur interprétation probable (conteneur chiffré) et la limite claire de l'analyse.",
            legal: "Manuel Ch. 29.3 — Fait (entropie mesurée) → interprétation (probable chiffrement) → limite (sans clé, inaccessible).",
            critical: false, next: 1,
          },
          {
            text: "«\u00a0Il s'agit probablement d'une image disque compressée ou d'un fichier corrompu.\u00a0»",
            ok: false, pts: -10,
            fb: "Inexact. Une entropie de 0.998 est trop élevée pour une compression standard (qui conserve des patterns) et une image disque compressée aurait des headers reconnaissables.",
            legal: "Manuel Ch. 24.2 — Entropie 0.99+ avec absence de structure = chiffrement fort, pas compression.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🔑 La demande de clé",
        situation: "Le MP veut contraindre le suspect à fournir le mot de passe VeraCrypt. Le suspect invoque le droit au silence (art. 113 CPP). Le MP vous demande s'il existe une alternative technique.",
        law: "<strong>Art. 113 CPP</strong> — Nemo tenetur : nul n'est tenu de s'auto-incriminer.<br><strong>Manuel Ch. 24.3</strong> — Alternatives : RAM dump, keyfile externe, historique de montage.",
        question: "<strong>Quelles alternatives techniques proposez-vous ?</strong>",
        choices: [
          {
            text: "Brute force du mot de passe VeraCrypt.",
            ok: false, pts: -20,
            fb: "Irréalisable dans un délai judiciaire raisonnable. VeraCrypt utilise PBKDF2/Argon2 avec un grand nombre d'itérations précisément pour rendre le brute force impossible.",
            legal: "Manuel Ch. 24.3 — VeraCrypt est conçu pour résister au brute force.",
            critical: true, next: "end",
          },
          {
            text: "Analyser le dump RAM capturé lors du live forensics — le volume monté y laisse des traces de clé.",
            ok: true, pts: 20,
            fb: "Méthode valide si le dump a été fait pendant que le volume était monté. Volatility peut extraire les clés AES de la RAM.",
            legal: "Manuel Ch. 11.1 — La RAM d'un système avec VeraCrypt monté contient la clé de déchiffrement en clair.",
            critical: false, next: 2,
          },
          {
            text: "Chercher un keyfile sur les autres supports saisis (USB, cloud, NAS).",
            ok: true, pts: 15,
            fb: "Approche valide. Un keyfile est un fichier binaire qui remplace ou complète le mot de passe. Si trouvé, il permet l'ouverture du volume.",
            legal: "Manuel Ch. 24.2 — Keyfile : alternative au mot de passe, chercher sur tous les supports saisis.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🧠 L'extraction Volatility",
        situation: "Heureusement, le live forensics a capturé 32 Go de RAM avant que le suspect n'éteigne son laptop. Vous lancez <code>vol.py -f memory.raw windows.registry.userassist</code> qui révèle une exécution récente de <code>VeraCrypt.exe</code>, puis <code>windows.memmap --pid=veracrypt.exe</code> + analyse du heap avec le plugin <code>vcrypthunt</code> (plugin custom).",
        law: "<strong>Volatility 3</strong> — Plugins <code>vcrypthunt</code>, <code>bitlockerhunt</code> pour clés en RAM.<br><strong>Elcomsoft Forensic Disk Decryptor</strong> — Alternative commerciale.<br><strong>Manuel Ch. 24.3</strong> — Workflow d'extraction de clé depuis RAM.",
        question: "<strong>Comment procédez-vous à l'extraction de la clé ?</strong>",
        choices: [
          {
            text: "Lancer directement Elcomsoft sur la RAM sans préparer de dump de backup.",
            ok: false, pts: -20,
            fb: "Risque de perte. Une opération unique sur le seul dump RAM sans sauvegarde = si l'outil crash ou corrompt, la preuve est perdue. Règle DFIR : toujours travailler sur une COPIE du dump.",
            legal: "ACPO Principle 1 — Travailler sur copie, jamais sur l'original.",
            critical: false, next: 3,
          },
          {
            text: "(1) Hash + copie du dump RAM, (2) Analyse sur copie : vcrypthunt plugin Volatility cherche les AES Key Schedule en mémoire (patterns caractéristiques de l'expansion de clé AES-256), (3) Si trouvée : extraction + test de montage du volume avec <code>veracrypt --mount-cryptsetup</code>, (4) Si échec : Elcomsoft en fallback commercial, (5) Documentation complète du protocole.",
            ok: true, pts: 25,
            fb: "Workflow DFIR exemplaire. Backup + analyse sur copie + outils open-source en premier + commercial en fallback + documentation. Reproductible par un contre-expert. Conforme ACPO + Manuel Ch. 24.3.",
            legal: "ACPO Principle 1-3 + Manuel Ch. 24.3 — Workflow standard extraction clé RAM.",
            critical: false, next: 3,
          },
          {
            text: "Abandonner : extraire une clé AES de RAM est trop incertain.",
            ok: false, pts: -15,
            fb: "Trop pessimiste. vcrypthunt et outils similaires ont un taux de succès documenté de 60-80% sur volumes récemment montés. Même un échec est documentable — mais abandonner sans essayer = prive l'enquête.",
            legal: "Manuel Ch. 24.3 — L'extraction RAM est une technique standard avec taux de succès documenté.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🎯 La clé retrouvée",
        situation: "Après 8 heures d'analyse, vcrypthunt détecte un candidat AES-256 Key Schedule à l'offset <code>0x7FD23A00</code> du heap processus VeraCrypt.exe. Vous testez : la clé ouvre effectivement le volume. Contenu révélé : 120 Go de photos dont certaines suspectes, 15 Go de documents, un dossier « Projets Privés » de 4 Go.",
        law: "<strong>Art. 141 CPP</strong> — Exploitation des preuves : obtenues dans le respect des procédures.<br><strong>ACPO Principle 1</strong> — Ne pas modifier le volume.<br><strong>Art. 248 CPP</strong> — Scellés sur les données sensibles.",
        question: "<strong>Quelle est la suite procédurale correcte ?</strong>",
        choices: [
          {
            text: "Parcourir immédiatement tout le contenu pour qualifier les images.",
            ok: false, pts: -30,
            fb: "Violation grave. (1) Vous modifiez les timestamps d'accès (même en monté « read-only », certains systèmes écrivent). (2) Sans scellés ni tri TMC, l'exploration personnelle = preuve illicite. (3) Si images CSAM, obligations spéciales LCPE + Art. 197 CP (détention inadmissible, même pour expertise).",
            legal: "ACPO Principle 1 + Art. 141 + 197 CP — Accès légal strict, surtout pour contenus sensibles.",
            critical: true, next: "end",
          },
          {
            text: "(1) Monter le volume en lecture seule stricte (<code>dislocker --readonly</code> ou FUSE read-only), (2) Image forensique complète du contenu déchiffré, (3) Hash de l'image, (4) Démontage, (5) Inventaire structurel uniquement (noms de fichiers + tailles, PAS d'ouverture), (6) Transmission au MP pour ordonnance de tri TMC (notamment si présence suspectée d'images sensibles).",
            ok: true, pts: 25,
            fb: "Procédure impeccable. L'inventaire structurel permet au MP de décider des investigations détaillées. Le tri TMC protège les parties et assure la recevabilité. Pour les éventuelles images CSAM, la procédure spéciale LCPE doit être déclenchée sans aucun accès personnel.",
            legal: "ACPO Principle 1 + Art. 141 + 248 CPP — Préservation + tri judiciaire.",
            critical: false, next: 4,
          },
          {
            text: "Signaler immédiatement à la direction la « preuve de culpabilité ».",
            ok: false, pts: -25,
            fb: "Dépassement du rôle expert. Vous n'avez pas encore analysé le contenu — qualifier de « preuve de culpabilité » = spéculation + pression sur la hiérarchie. L'expert reste factuel et procédural.",
            legal: "Art. 182 CPP — L'expert constate, il ne qualifie pas.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "🚨 La découverte sensible",
        situation: "Lors de l'inventaire structurel initial (noms uniquement), vous détectez des noms de fichiers fortement suspects évoquant des contenus CSAM (child sexual abuse material). Les règles suisses sur ce type de contenu sont strictes et immédiates.",
        law: "<strong>Art. 197 al. 4-5 CP</strong> — Pornographie enfantine, détention pénalement réprimée même pour enquête (sauf exceptions strictes).<br><strong>LCPE (Loi fédérale sur les pédocriminels)</strong> — Procédure spéciale.<br><strong>fedpol / Service pédophilie</strong> — Traitement centralisé obligatoire.",
        question: "<strong>Quelle est votre réaction immédiate ?</strong>",
        choices: [
          {
            text: "Ouvrir quelques fichiers pour vérifier s'il s'agit bien de CSAM avant de rapporter.",
            ok: false, pts: -40,
            fb: "VIOLATION GRAVISSIME. L'ouverture de fichiers CSAM suspectés, même pour « vérification », constitue une infraction pénale (Art. 197 al. 4-5 CP) sauf dans le cadre précis du Service pédophilie de fedpol. Vous vous exposez à une condamnation personnelle + la preuve devient inutilisable.",
            legal: "Art. 197 al. 4-5 CP — Détention CSAM pénalement réprimée sans dérogation spéciale fedpol.",
            critical: true, next: "end",
          },
          {
            text: "(1) Démonter immédiatement le volume, (2) NE PAS ouvrir le moindre fichier suspect, (3) Notifier immédiatement le MP avec la nature suspectée des contenus, (4) Demander l'intervention du Service pédophilie de fedpol qui dispose des autorisations légales pour expertiser ce type de contenus, (5) Remettre le matériel en custody stricte.",
            ok: true, pts: 25,
            fb: "Réaction légalement irréprochable. Le Service pédophilie de fedpol est la SEULE entité autorisée à examiner ces contenus dans le cadre d'enquêtes. Votre rôle s'arrête à la détection + transmission immédiate. Cette ligne rouge protège vous-même, la procédure et le dossier.",
            legal: "Art. 197 CP + LCPE + Procédure fedpol — Chaîne spécialisée obligatoire pour CSAM.",
            critical: false, next: 5,
          },
          {
            text: "Continuer l'inventaire général comme si de rien n'était — vous traiterez ces contenus plus tard.",
            ok: false, pts: -35,
            fb: "Manquement grave. La détection de CSAM déclenche une obligation immédiate de procédure spéciale. Ignorer = complicité passive + risque de destruction de preuves + responsabilité personnelle engagée.",
            legal: "Art. 197 CP + obligation d'annonce — Action immédiate obligatoire.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🔐 L'hidden volume VeraCrypt",
        situation: "Après investigation du Service pédophilie sur les contenus initiaux, vous analysez plus en profondeur le fichier VeraCrypt. Vous soupçonnez la présence d'un <strong>hidden volume</strong> (fonctionnalité VeraCrypt : un volume caché à l'intérieur du volume visible, avec un deuxième mot de passe indépendant). L'espace « libre » du volume visible présente en effet une entropie très élevée.",
        law: "<strong>VeraCrypt Hidden Volume</strong> — Plausible deniability : impossible de prouver l'existence sans la seconde clé.<br><strong>Art. 113 CPP</strong> — Droit au silence : le suspect n'est pas tenu de révéler l'existence d'un hidden volume.<br><strong>Manuel Ch. 24.2</strong> — Limites forensiques du plausible deniability.",
        question: "<strong>Comment formulez-vous la suspicion d'hidden volume dans le rapport ?</strong>",
        choices: [
          {
            text: "Affirmer l'existence d'un hidden volume et exiger sa divulgation.",
            ok: false, pts: -25,
            fb: "Sur-affirmation + violation du droit au silence. VeraCrypt est précisément conçu pour que l'on ne puisse PAS prouver l'existence d'un hidden volume. Affirmer = erreur technique. Exiger la divulgation = contraire à Art. 113 CPP (nemo tenetur).",
            legal: "Art. 113 CPP + principe VeraCrypt plausible deniability — Interdiction d'affirmer + d'exiger.",
            critical: true, next: "end",
          },
          {
            text: "« L'espace non alloué du volume VeraCrypt visible présente une entropie uniformément élevée (0.997±0.001), compatible avec la présence éventuelle d'un hidden volume VeraCrypt. Cette caractéristique est indiscernable techniquement d'un espace réellement vide dans un conteneur bien configuré. Aucune affirmation sur la présence ou absence d'un hidden volume n'est techniquement défendable. »",
            ok: true, pts: 25,
            fb: "Formulation exemplaire. Elle décrit les observations (entropie), mentionne l'hypothèse hidden volume, et reconnaît explicitement l'indécidabilité technique. C'est précisément ce que VeraCrypt promet à ses utilisateurs, et un rapport honnête doit l'admettre.",
            legal: "Manuel Ch. 24.2 + Art. 113 CPP — Honnêteté technique face au plausible deniability.",
            critical: false, next: 6,
          },
          {
            text: "Ne pas mentionner l'hypothèse hidden volume pour ne pas affaiblir le dossier.",
            ok: false, pts: -15,
            fb: "Omission problématique. L'hypothèse hidden volume fait partie des faits techniques observables (entropie). La taire = incomplet. Un expert adverse peut la pointer plus tard et accuser de dissimulation. Transparence obligatoire.",
            legal: "Manuel Ch. 29.3 — L'exhaustivité technique protège l'expert.",
            critical: false, next: 6,
          },
        ],
      },
      {
        phase: "⚖️ L'audience : la cinquième amendement suisse",
        situation: "À l'audience, l'avocat invoque nemo tenetur : « Mon client ne peut être contraint à révéler le mot de passe VeraCrypt, même si cela bloque l'enquête. C'est un principe constitutionnel. » Le juge vous demande comment vous avez respecté ce principe.",
        law: "<strong>Art. 113 CPP</strong> — Nemo tenetur (personne n'est tenu de témoigner contre soi).<br><strong>Art. 32 Cst.</strong> — Garanties procédurales.<br><strong>CEDH Art. 6</strong> — Procès équitable.<br><strong>ATF 138 IV 47</strong> — Limites de nemo tenetur face à mesures de contrainte numériques.",
        question: "<strong>Comment répondez-vous au juge ?</strong>",
        choices: [
          {
            text: "« Ma démarche a respecté strictement Art. 113 CPP : aucune demande de mot de passe n'a été adressée au suspect. La clé a été extraite de la RAM — un artefact technique indépendant de la volonté du suspect. Cette méthode contourne légitimement nemo tenetur sans le violer. Le TF a confirmé dans l'ATF 138 IV 47 que les mesures techniques passives sur des artefacts déjà existants sont compatibles avec le droit au silence. »",
            ok: true, pts: 25,
            fb: "Argument juridique solide. La distinction critique : nemo tenetur protège contre la CONTRAINTE du suspect à produire un mot de passe, pas contre la capture technique d'artefacts laissés par son usage. L'ATF 138 IV 47 soutient cette distinction.",
            legal: "Art. 113 CPP + ATF 138 IV 47 — Nemo tenetur préserve contre contrainte, pas contre artefacts passifs.",
            critical: false, next: 7,
          },
          {
            text: "Argumenter que nemo tenetur ne s'applique pas aux données numériques.",
            ok: false, pts: -25,
            fb: "Argument faux. Nemo tenetur s'applique pleinement aux données numériques — l'ATF 138 IV 47 le confirme. Le nier = discrédit immédiat à l'audience.",
            legal: "ATF 138 IV 47 — Nemo tenetur s'applique aux mots de passe comme à tout secret cognitif.",
            critical: true, next: "end",
          },
          {
            text: "Reconnaître que la procédure d'extraction RAM pose problème et proposer d'écarter cette preuve.",
            ok: false, pts: -20,
            fb: "Capitulation injustifiée. L'extraction RAM est un acte forensique standard sur un système saisi — pas une contrainte au suspect. La confondre avec une violation de nemo tenetur = méconnaissance du droit.",
            legal: "Art. 113 CPP + ATF 138 IV 47 — La capture technique d'artefacts reste légale.",
            critical: false, next: 7,
          },
        ],
      },
      {
        phase: "📋 Le rapport d'expertise final",
        situation: "Le juge demande le rapport consolidé. Vous structurez : (A) Détection technique du conteneur (entropie + absence signature), (B) Procédure d'extraction clé (live forensics + Volatility), (C) Tri du contenu (procédure TMC), (D) Transmission CSAM au Service pédophilie fedpol, (E) Discussion hidden volume (indécidable), (F) Conformité nemo tenetur.",
        law: "<strong>Manuel Ch. 29.7</strong> — Rapport expertal structuré.<br><strong>Art. 189 CPP</strong> — Complément d'expertise.",
        question: "<strong>Quelle conclusion générale formulez-vous ?</strong>",
        choices: [
          {
            text: "« L'analyse a permis d'établir la culpabilité du suspect. »",
            ok: false, pts: -30,
            fb: "Culpabilité = qualification juridique RÉSERVÉE au juge. Un expert ne conclut JAMAIS à la culpabilité. C'est la ligne rouge absolue du rôle d'expert.",
            legal: "Art. 182 CPP — Séparation stricte expert/juge.",
            critical: true, next: "end",
          },
          {
            text: "« L'analyse technique a permis : (1) détection d'un conteneur VeraCrypt, (2) extraction de la clé par voie technique indépendante du suspect, (3) inventaire structurel du contenu, (4) transmission des éléments suspectés au Service pédophilie fedpol selon la procédure spéciale, (5) discussion honnête des limites (hidden volume indécidable). Le juge dispose des éléments factuels nécessaires à sa décision. »",
            ok: true, pts: 25,
            fb: "Conclusion forensique exemplaire. Vous énumérez les faits techniques établis, les procédures respectées, et les limites reconnues. Vous remettez explicitement la décision au juge. C'est la posture d'expert impeccable.",
            legal: "Art. 182 + 184 CPP + Manuel Ch. 29.7 — Conclusion factuelle et procédurale.",
            critical: false, next: "end",
          },
          {
            text: "« L'enquête est en échec — nous n'avons pas pu prouver suffisamment les faits. »",
            ok: false, pts: -15,
            fb: "Auto-dévaluation injustifiée. L'analyse a établi de nombreux faits techniques solides. Qualifier d'« échec » = minimiser le travail + décrédibiliser. Un rapport factuel laisse le juge juger de la force probante, sans jugement de valeur de l'expert.",
            legal: "Art. 182 CPP — L'expert présente, il ne juge pas la qualité globale de l'enquête.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 85 && custodyPct >= 75) return { icon: "🔒", title: "Expert VeraCrypt", sub: "Maîtrise avancée du forensique chiffrement" };
      if (pct >= 65) return { icon: "🔬", title: "Analyste Chiffrement", sub: "Bonnes bases sur VeraCrypt forensique" };
      return { icon: "📚", title: "Formation requise", sub: "Révisez Manuel Ch. 24.2 et 24.3" };
    },
  },

  /* ══════════════════════════════════════════════════
     17. XPLAIN — Affaire Xplain (2023)  [HARD]
  ══════════════════════════════════════════════════ */
  {
    id: "xplain",
    title: "Affaire Xplain (2023)",
    icon: "🏛",
    difficulty: "hard",
    atmosphere: "state",
    realCase: "Affaire Xplain, juin 2023 — 907 Go de données fédérales suisses (fedpol, SRC, Armée, CFF, cantons) publiées sur le darknet par le groupe ransomware Play. Rapport OFCS mars 2024.",
    narrative: {
      success: "Le rapport OFCS est rendu et retient l'attention des autorités. Il met en évidence la responsabilité partagée Xplain/autorités. De nouvelles directives contractuelles strictes sont imposées à tous les prestataires IT de la Confédération — minimisation, classification, chiffrement obligatoire.",
      degraded: "Le rapport identifie les failles principales mais reste partiel. Les réformes tardent à être adoptées, les prestataires conservent leurs pratiques.",
      failure: "Le rapport mal cadré passe à côté de l'essentiel (la responsabilité contractuelle). Aucune leçon structurelle n'est tirée. La même catégorie d'incident se reproduira chez un autre prestataire 18 mois plus tard."
    },
    tags: ["DROIT", "RÉSEAUX"],
    legalRefs: ["Art. 143bis CP", "Art. 144bis CP", "LPD 2023", "OFCS Rapport 2024"],
    intro: "907 Go de données fédérales publiées sur le darknet par le groupe Play. Données fedpol, SRC, Armée, CFF. L'OFCS vous mandate. Quelle est la vraie question forensique ?",
    alertLevel: "INCIDENT ÉTATIQUE — Données fédérales exfiltrées",
    objectives: [
      { icon: "🏛", text: "Définir correctement le périmètre du mandat forensique" },
      { icon: "🔍", text: "Analyser les conditions de stockage des données fédérales chez le prestataire" },
      { icon: "⚖️", text: "Identifier la responsabilité partagée prestataire/autorités" },
    ],
    debrief: "<p>L'affaire Xplain 2023 illustre une problématique croissante : la <strong>forensique d'un prestataire</strong> est distincte de la forensique sur l'attaquant. La question centrale n'est pas «\u00a0qui a attaqué ?\u00a0» mais «\u00a0pourquoi les données fédérales étaient-elles chez ce prestataire ?\u00a0»</p><p>L'OFCS (rapport mars 2024) a relevé que des données fedpol et militaires non chiffrées se trouvaient dans les environnements de test de Xplain — violation des principes de minimisation et de classification des données.</p>",
    steps: [
      {
        phase: "🏛 La révélation",
        situation: "Le groupe Play publie <strong>907 Go de données</strong> sur le darknet. Parmi elles : données fedpol, SRC (renseignement), Armée, CFF, canton de Vaud. Xplain est un prestataire IT qui fournit des logiciels aux autorités. L'OFCS vous mandate pour l'analyse forensique.",
        law: "<strong>Art. 143bis CP</strong> — Accès indu au système Xplain.<br><strong>Art. 144bis CP</strong> — Dommages aux données par chiffrement ransomware.<br><strong>LPD 2023</strong> — Violation de données personnelles à grande échelle.",
        question: "<strong>Quelle est la question forensique centrale de ce mandat ?</strong>",
        choices: [
          {
            text: "Identifier les membres du groupe Play et les attributer à un État.",
            ok: false, pts: -5,
            fb: "C'est une question d'attribution — elle relève du renseignement, pas du forensique judiciaire suisse. La question forensique opérationnelle est : comment les données fédérales se retrouvaient-elles chez un prestataire privé ?",
            legal: "Manuel Ch. 29.1 — Attribution étatique = renseignement, pas forensique judiciaire ordinaire.",
            critical: false, next: "end",
          },
          {
            text: "Déterminer quelles données fédérales étaient chez Xplain, comment elles y étaient stockées, et si elles étaient protégées conformément aux directives.",
            ok: true, pts: 25,
            fb: "Question correcte. L'enquête forensique doit établir : catalogue des données fédérales chez Xplain, conditions de stockage (chiffrement ?), base contractuelle, conformité aux directives de classification.",
            legal: "OFCS Rapport mars 2024 — Données fedpol dans environnements de test non chiffrés : violation des principes de minimisation et classification.",
            critical: false, next: 1,
          },
          {
            text: "Récupérer les 907 Go publiés et identifier les fichiers les plus sensibles.",
            ok: false, pts: -10,
            fb: "Problématique légalement. Télécharger des données publiées par un groupe criminel peut constituer une réception de données volées. L'analyse se fait sur les systèmes Xplain avec autorisation.",
            legal: "Art. 143 CP — Réception de données soustraites sans droit.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🔍 La question contractuelle",
        situation: "Votre analyse révèle que Xplain stockait <strong>des données fedpol réelles dans ses environnements de développement et de test</strong>, sans chiffrement supplémentaire. Les contrats entre Xplain et les autorités ne l'interdisaient pas explicitement.",
        law: "<strong>Rapport OFCS 2024</strong> — Absence de directives claires sur la minimisation des données dans les contrats avec les prestataires.",
        question: "<strong>Que concluez-vous forensiquement sur la responsabilité ?</strong>",
        choices: [
          {
            text: "Responsabilité exclusive de Xplain — ils n'auraient pas dû stocker ces données ainsi.",
            ok: false, pts: -10,
            fb: "Trop partiel. Si le contrat ne l'interdisait pas explicitement, la responsabilité de Xplain est atténuée. Les autorités fédérales qui ont transmis des données réelles sans imposer de mesures de protection partagent la responsabilité.",
            legal: "OFCS 2024 — Responsabilité partagée : prestataire + autorités mandantes.",
            critical: false, next: 2,
          },
          {
            text: "Responsabilité partagée : Xplain pour les mesures de sécurité, les autorités fédérales pour l'absence de directives contractuelles de classification.",
            ok: true, pts: 20,
            fb: "Analyse correcte selon les conclusions de l'OFCS. Les données réelles n'auraient pas dû être dans les environnements de test (principe de minimisation). Mais les contrats ne l'interdisant pas, les autorités mandantes ont une part de responsabilité.",
            legal: "OFCS Rapport 2024 + LPD 2023 Art. 7 — Responsabilité du responsable du traitement d'imposer ces standards contractuellement.",
            critical: false, next: 2,
          },
          {
            text: "Responsabilité exclusive du groupe Play — sans l'attaque, rien ne serait arrivé.",
            ok: false, pts: -15,
            fb: "Raisonnement superficiel. Le ransomware est le vecteur, pas la cause racine de l'exposition des données. Un système correctement durci (minimisation, chiffrement, segmentation) aurait limité les dégâts. Ignorer la part des victimes = rater les leçons structurelles.",
            legal: "OFCS 2024 + Art. 7 LPD — La protection des données est une obligation préventive continue.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "📊 Le tri des 907 Go publiés",
        situation: "Le MP veut savoir précisément ce qui est dans les 907 Go publiés sur le darknet. Problème : télécharger directement depuis le .onion de Play peut être qualifié de réception de données volées (Art. 143 CP). Cependant, le Service fedpol cybercriminalité a une autorisation spéciale pour examiner de tels leaks. Comment organisez-vous l'analyse ?",
        law: "<strong>Art. 143 CP</strong> — Soustraction de données.<br><strong>Service fedpol cybercriminalité</strong> — Autorisation spéciale d'analyse de leaks.<br><strong>Art. 320 CP</strong> — Secret de fonction.",
        question: "<strong>Comment organisez-vous l'accès aux données publiées ?</strong>",
        choices: [
          {
            text: "Télécharger moi-même les 907 Go pour analyser — je suis expert mandaté.",
            ok: false, pts: -30,
            fb: "Violation grave. Votre mandat OFCS ne vous autorise PAS à télécharger depuis des plateformes criminelles. Le téléchargement = réception de données illégales (Art. 143 CP) + infraction disciplinaire. Le Service fedpol est la SEULE entité légalement autorisée.",
            legal: "Art. 143 CP + compétences fedpol — Accès aux leaks réservé au service spécialisé.",
            critical: true, next: "end",
          },
          {
            text: "Coordination avec le Service fedpol cybercriminalité : (1) fedpol télécharge via son infrastructure isolée et sécurisée, (2) fedpol effectue un premier tri de classification, (3) fedpol transmet à l'expert (vous) uniquement les données nécessaires à votre mandat sur Xplain, (4) votre analyse se fait dans un environnement forensique isolé, avec traçabilité complète.",
            ok: true, pts: 25,
            fb: "Procédure légalement irréprochable. La chaîne fedpol → expert mandaté respecte les compétences légales et protège toutes les parties. Votre mandat est ciblé (Xplain) — vous n'avez pas besoin des 907 Go complets, juste du sous-ensemble fedpol/Xplain.",
            legal: "Compétences fedpol + Art. 184 CPP — Chaîne d'accès légale + mandat ciblé.",
            critical: false, next: 3,
          },
          {
            text: "Demander à un journaliste qui a déjà téléchargé le leak de partager avec moi.",
            ok: false, pts: -25,
            fb: "Illégal et risqué. Recevoir des données volées via un tiers n'en change pas la nature juridique. Impliquer un journaliste crée aussi un problème de source/confidentialité pour lui. La voie est fedpol.",
            legal: "Art. 143 CP — La transmission via tiers ne légitime pas la réception.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🗂 L'inventaire fedpol/Xplain",
        situation: "Après tri fedpol, vous recevez le sous-ensemble relatif à votre mandat : 180 Go de données Xplain contenant des informations fédérales. Vous identifiez 4 catégories : (A) 60 Go — code source de Xplain (normal), (B) 80 Go — données fedpol en environnement de test (anormal — données réelles pas synthétiques), (C) 30 Go — emails internes Xplain mentionnant fedpol/SRC (sensible), (D) 10 Go — sauvegardes anciennes de données cantonales.",
        law: "<strong>LPD 2023 Art. 8</strong> — Minimisation : seules les données nécessaires doivent être traitées.<br><strong>Art. 267 CPP</strong> — Inventaire des saisies.<br><strong>Classification fédérale</strong> — Interne / Confidentiel / Secret.",
        question: "<strong>Comment structurez-vous votre inventaire critique ?</strong>",
        choices: [
          {
            text: "Décrire en détail le contenu de chaque catégorie pour que l'OFCS ait une vue complète.",
            ok: false, pts: -10,
            fb: "Risque de surabondance. Un inventaire forensique structure PAR PROBLÉMATIQUE, pas par volume. L'OFCS veut savoir : quelles violations, quelle ampleur, quelles responsabilités — pas un catalogue brut de 180 Go.",
            legal: "Art. 267 CPP + Manuel Ch. 29.7 — Inventaire analytique, pas descriptif.",
            critical: false, next: 4,
          },
          {
            text: "Inventaire analytique : (A) Présence de données réelles au lieu de données synthétiques dans env. de test — violation principe minimisation LPD Art. 8 → critique. (B) Absence de chiffrement additionnel sur données classifiées → violation classification fédérale → critique. (C) Mentions fedpol/SRC dans emails non restreints → violation compartimentage → grave. (D) Sauvegardes anciennes non purgées → violation politique de rétention → modéré. Pour chaque point : référence légale + recommandation.",
            ok: true, pts: 25,
            fb: "Inventaire OFCS exemplaire. Structure par type de violation, hiérarchisation par gravité, références légales précises, recommandations actionnables. C'est exactement ce qu'attend un rapport d'inspection fédéral.",
            legal: "LPD 2023 + Manuel Ch. 29.7 + Pratique OFCS — Inventaire analytique structuré.",
            critical: false, next: 4,
          },
          {
            text: "Se concentrer uniquement sur ce que contenaient les données (noms, adresses, etc.).",
            ok: false, pts: -15,
            fb: "Perspective trop étroite. La question principale de l'affaire Xplain n'est PAS « quelles personnes sont dans les données » (c'est la LPD 2023 qui traite ça via les notifications individuelles). C'est « POURQUOI ces données étaient chez ce prestataire dans cet état ». Un rapport OFCS doit adresser le système.",
            legal: "Pratique OFCS 2024 — Focus sur les failles systémiques, pas sur l'exposition individuelle.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "⏳ La chronologie d'intrusion",
        situation: "L'analyse forensique de l'infrastructure Xplain (avec leur coopération totale) révèle la kill chain : (1) 15 février 2023 — exploitation CVE-2023-XXXX sur serveur VPN non patché, (2) 18 février — création compte admin persistant, (3) 5-22 mars — reconnaissance interne + découverte env. test, (4) 23-30 mars — exfiltration 907 Go vers C2, (5) 1er juin — déploiement ransomware. Soit <strong>3,5 mois de compromission silencieuse</strong>.",
        law: "<strong>MITRE ATT&CK</strong> — Phases standard attack.<br><strong>Manuel Ch. 29.4</strong> — Timeline forensique documentée.<br><strong>LPD 2023 Art. 8</strong> — Obligation de détecter dans un délai raisonnable.",
        question: "<strong>Comment qualifiez-vous cette durée de compromission (3.5 mois) dans le rapport ?</strong>",
        choices: [
          {
            text: "Qualifier de « défaillance grave de détection » — un SOC compétent aurait détecté plus tôt.",
            ok: false, pts: -10,
            fb: "Jugement de valeur sans benchmark. Le Dwell Time médian observé par Mandiant en 2023 est de 16 jours, mais les APT sophistiqués et les attaques ciblées restent souvent 3-6 mois. Qualifier sans contextualiser = trop subjectif.",
            legal: "Manuel Ch. 29.3 — Factualité sans jugement de valeur non étayé.",
            critical: false, next: 5,
          },
          {
            text: "« Dwell Time observé : 3.5 mois, supérieur au Dwell Time médian industrie (16 jours selon Mandiant 2023) mais dans la plage haute courante pour des attaques ciblées prolongées. La détection aurait pu être accélérée par : (1) monitoring réseau sortant (serait détecté lors de la phase d'exfiltration C2 avril-mai), (2) DLP sur volumes importants, (3) alertes sur création de comptes admin. Recommandations techniques actionnables. »",
            ok: true, pts: 25,
            fb: "Analyse nuancée et constructive. Vous contextualisez par rapport à l'industrie (Mandiant), identifiez les points spécifiques où une détection aurait été possible, et proposez des améliorations techniques concrètes. Conforme à la rigueur OFCS.",
            legal: "Manuel Ch. 29.4 + Pratique Mandiant/CrowdStrike — Benchmarking industrie + recommandations.",
            critical: false, next: 5,
          },
          {
            text: "Ne pas discuter la durée — ce n'est pas l'objet du mandat.",
            ok: false, pts: -15,
            fb: "Omission stratégique. Le Dwell Time est un élément CENTRAL : il détermine l'étendue probable de l'exfiltration et la qualité du SOC victime. Pour une affaire de cette ampleur, l'ignorer = rapport incomplet.",
            legal: "Manuel Ch. 29.4 — La chronologie est structurante dans un rapport incident.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "🏛 Les implications constitutionnelles",
        situation: "Les données SRC (Service de renseignement) compromises contiennent des informations sur des opérations de surveillance nationales. Le droit fédéral soumet ces informations au Art. 86 Loi militaire / Art. 329 CP (divulgation secret militaire). La Délégation des Commissions de gestion (DélCdG) du Parlement veut un briefing. Comment gérez-vous cette dimension politique ?",
        law: "<strong>Art. 329 CP</strong> — Divulgation de secrets militaires.<br><strong>LMSI (Loi sur les mesures de sécurité intérieure)</strong>.<br><strong>Art. 169 Cst.</strong> — Haute surveillance parlementaire.<br><strong>Secret de fonction (Art. 320 CP)</strong>.",
        question: "<strong>Comment préparez-vous le briefing DélCdG ?</strong>",
        choices: [
          {
            text: "Refuser le briefing — le Parlement n'a pas à connaître les détails techniques.",
            ok: false, pts: -25,
            fb: "Méconnaissance constitutionnelle. La DélCdG exerce la haute surveillance sur les services de renseignement (Art. 169 Cst.). Elle a un droit d'accès étendu aux informations de sécurité nationale. Refuser = violation de l'obligation de renseignement envers la haute surveillance.",
            legal: "Art. 169 Cst. + Art. 53 Loi sur le Parlement — Droit d'accès DélCdG.",
            critical: true, next: "end",
          },
          {
            text: "Briefing en séance secrète : (1) vérification préalable des habilitations sécuritaires des députés présents, (2) présentation de la chronologie, (3) catégorisation des données SRC exposées (sans divulguer opérations spécifiques sauf demande explicite), (4) implications structurelles (contrats prestataires, minimisation), (5) recommandations d'amélioration. Coordination avec le Chef du DFAE (information Conseil fédéral).",
            ok: true, pts: 25,
            fb: "Approche institutionnelle correcte. Séance secrète + habilitations + coordination Exécutif = respect de l'équilibre haute surveillance / secret nécessaire. Les parlementaires de la DélCdG peuvent alors recommander des réformes en connaissance de cause.",
            legal: "Art. 169 Cst. + LParl + Pratique DélCdG — Briefing en formation restreinte et habilitée.",
            critical: false, next: 6,
          },
          {
            text: "Transmettre toutes les données brutes à la DélCdG pour qu'elle se fasse sa propre opinion.",
            ok: false, pts: -20,
            fb: "Disproportionné. La DélCdG contrôle, elle n'effectue pas d'expertise technique. Transmettre 180 Go brut = inutilisable + risque de fuite supplémentaire. Un briefing synthétique + Q&A est l'approche standard.",
            legal: "LParl + Pratique DélCdG — Mission de haute surveillance, pas d'expertise technique.",
            critical: false, next: 6,
          },
        ],
      },
      {
        phase: "🛠 Les recommandations structurelles",
        situation: "L'OFCS attend de vous les 10 recommandations structurelles prioritaires pour éviter qu'un « nouveau Xplain » ne se produise chez un autre prestataire fédéral. Vous disposez d'un budget d'étude généreux pour formuler des mesures actionnables.",
        law: "<strong>Ordonnance OFCS</strong> — Mandat d'amélioration continue.<br><strong>Contrats-types fédéraux</strong> — Clauses de cybersécurité.<br><strong>LPD 2023 Art. 7</strong> — Responsabilité du responsable du traitement.",
        question: "<strong>Quelle est votre stratégie de recommandations ?</strong>",
        choices: [
          {
            text: "Recommander l'internalisation de tous les services IT fédéraux — plus de prestataires = plus de risque.",
            ok: false, pts: -15,
            fb: "Irréaliste. La Confédération ne peut pas internaliser tous les services IT (compétences, coûts, agilité). La solution n'est pas l'absence de prestataires, mais leur cadre contractuel et leur audit.",
            legal: "Pragmatisme institutionnel — L'externalisation bien encadrée reste nécessaire.",
            critical: false, next: 7,
          },
          {
            text: "10 recommandations actionnables : (1) Contrats-types avec clauses cybersécurité obligatoires (chiffrement, minimisation, audit), (2) Interdiction de données réelles en environnements test (sauf justification + compensation technique), (3) Classification obligatoire avant transmission, (4) Audit technique annuel des prestataires critiques, (5) Dwell Time maximum contractuel (notification 30 jours), (6) MFA obligatoire tous accès prestataires, (7) Segmentation réseau entre clients, (8) Registre central des contrats IT fédéraux, (9) Formation obligatoire pour COSI (délégués protection données), (10) Exercices de crise annuels multi-prestataires.",
            ok: true, pts: 25,
            fb: "Recommandations structurelles exemplaires. Chaque mesure adresse une faille identifiée dans l'affaire Xplain, avec un levier actionnable (contrat, audit, technique). Conformes aux standards NIST/ENISA appliqués à la Confédération.",
            legal: "LPD 2023 + Ordonnance OFCS + Pratique NIST/ENISA — Cadre d'amélioration structuré.",
            critical: false, next: 7,
          },
          {
            text: "Recommandation unique : interdire les prestataires étrangers et travailler uniquement avec des entreprises suisses.",
            ok: false, pts: -20,
            fb: "Xplain est une entreprise suisse ! Le problème n'est pas la nationalité mais le cadre contractuel et technique. Cette recommandation est à côté de l'analyse factuelle et pourrait être perçue comme nationaliste sans valeur ajoutée sécurité.",
            legal: "Pratique OFCS — Les recommandations sont basées sur les faits, pas sur les préjugés.",
            critical: false, next: 7,
          },
        ],
      },
      {
        phase: "📄 Le rapport public",
        situation: "L'OFCS décide de publier son rapport (comme c'est devenu la tradition depuis l'affaire RUAG 2016). Vous supervisez la rédaction. Certaines parties sont classifiées et doivent être retirées pour la version publique, tout en maintenant la valeur pédagogique.",
        law: "<strong>LTrans (Loi sur la transparence)</strong> — Publication par défaut, caviardage exception.<br><strong>Art. 8 LTrans</strong> — Exceptions classifiées.<br><strong>Principe de transparence</strong> — Responsabilité envers la population.",
        question: "<strong>Quelle est votre stratégie de publication ?</strong>",
        choices: [
          {
            text: "Publier uniquement une version édulcorée de 5 pages sans détails techniques.",
            ok: false, pts: -15,
            fb: "Manque d'ambition. Le rapport MELANI/OFCS 2016 sur RUAG est devenu une référence internationale précisément parce qu'il contenait des détails techniques substantiels. Un rapport trop léger = pas d'impact.",
            legal: "Pratique OFCS 2016 (RUAG) — Les rapports techniques détaillés sont attendus.",
            critical: false, next: "end",
          },
          {
            text: "Structure en 2 versions : (1) Rapport public détaillé (80-120 pages) avec tous les TTPs, timeline, analyses techniques, recommandations. Caviardage minimal uniquement sur : identités opérations SRC spécifiques, détails permettant d'identifier les vulnérabilités encore non patchées chez d'autres prestataires, noms individuels. (2) Annexes classifiées pour DélCdG/Conseil fédéral contenant le détail complet. Le public reçoit la valeur pédagogique + structurelle, le politique reçoit le détail opérationnel.",
            ok: true, pts: 25,
            fb: "Stratégie de publication exemplaire. Maximise la transparence pédagogique (bénéfice pour la communauté cyber suisse) tout en protégeant les éléments sensibles opérationnels. C'est ce qui a fait le succès du rapport RUAG 2016 et qui doit être reproduit.",
            legal: "LTrans + Art. 8 LTrans + Pratique OFCS — Transparence maximale, caviardage minimal.",
            critical: false, next: "end",
          },
          {
            text: "Ne pas publier du tout — trop sensible, laisser le dossier aux autorités.",
            ok: false, pts: -20,
            fb: "Occasion manquée. Un rapport public force l'amélioration systémique (pression publique sur les acteurs), sert la formation des futurs DFIR, et contribue à la maturité cyber suisse. Ne pas publier = priver la communauté d'enseignements structurants.",
            legal: "LTrans — La transparence est le principe, le secret l'exception.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 85 && custodyPct >= 75) return { icon: "🏛", title: "Expert Forensique Étatique", sub: "Maîtrise avancée des incidents prestataires" };
      if (pct >= 65) return { icon: "🔬", title: "Analyste Sécurité", sub: "Bonnes bases sur la forensique prestataire" };
      return { icon: "📚", title: "Formation requise", sub: "Révisez le rapport OFCS Xplain 2024" };
    },
  },

  /* ══════════════════════════════════════════════════
     18. RUAG_2016 — APT chez le Fournisseur Défense  [HARD]
     Basé sur le rapport Melani/OFCS 2016 (entreprise d'armement suisse)
  ══════════════════════════════════════════════════ */
  {
    id: "ruag_2016",
    title: "APT chez RUAG",
    icon: "🛡",
    difficulty: "hard",
    atmosphere: "state",
    realCase: "Affaire RUAG, mai 2016 — APT Turla (Epic Turla / Tavdig / Carbon) présent depuis septembre 2014, exfiltration d'environ 23 Go de données de défense pendant 21 mois. Rapport MELANI/OFCS du 23 mai 2016.",
    tags: ["RÉSEAUX", "FORENSIQUE"],
    legalRefs: ["Rapport MELANI 2016", "Art. 143bis CP", "Art. 86 Loi militaire", "MITRE ATT&CK T1071"],
    intro: "L'entreprise d'armement RUAG détecte un trafic DNS suspect. L'analyse révèle un APT présent depuis 21 mois. Le nombre de machines infectées n'est pas encore connu. Melani vous mandate.",
    alertLevel: "INCIDENT ÉTATIQUE — Intrusion APT de longue durée suspectée",
    objectives: [
      { icon: "🎯", text: "Caractériser le modus operandi de l'APT sans alerter l'attaquant" },
      { icon: "📡", text: "Cartographier l'étendue de la compromission (timeline + lateral movement)" },
      { icon: "⚖️", text: "Respecter la discrétion opérationnelle imposée par MELANI/OFCS" },
    ],
    debrief: "<p>L'affaire RUAG 2016 illustre la difficulté d'une <strong>réponse à un APT déjà installé</strong>. Le rapport public MELANI distingue clairement trois phases : reconnaissance (rootkit Tavdig), escalade et persistance (Turla Carbon), exfiltration silencieuse via des canaux DNS détournés.</p><p>Le piège classique : <em>éteindre ou isoler brutalement prévient l'attaquant que sa couverture est grillée</em>. Les bonnes pratiques OFCS préconisent une surveillance accrue + collecte préalable d'IoC avant tout confinement.</p>",
    narrative: {
      success: "Les IoC sont collectés discrètement pendant 3 semaines. La cartographie complète est rendue à MELANI. Le confinement coordonné préserve les preuves et neutralise l'APT sans alerter les opérateurs. Le rapport public de mai 2016 devient une référence internationale.",
      degraded: "La détection tardive et les actions précipitées limitent la visibilité. Le rapport est rendu mais avec des lacunes. L'APT s'est peut-être déjà redéployé ailleurs.",
      failure: "L'isolement hâtif alerte l'attaquant qui efface ses traces. Pas de cartographie complète possible, pas d'IoC exploitables par la communauté internationale. L'APT migre vers d'autres cibles suisses avant qu'on puisse le documenter."
    },
    steps: [
      {
        phase: "📡 Le trafic DNS suspect",
        situation: "Le SOC de RUAG détecte un trafic DNS anormal vers <code>rasp.sanjosemaps.com</code> depuis une machine du département développement. La résolution ne correspond à aucun service légitime. Le SOC veut bloquer immédiatement le domaine au niveau firewall.",
        law: "<strong>MITRE ATT&CK T1071.004</strong> — DNS tunneling : canal d'exfiltration discret, souvent utilisé par les APT étatiques.<br><strong>Bonne pratique MELANI/OFCS</strong> — Surveillance passive avant confinement pour cartographier l'étendue réelle.",
        question: "<strong>Quelle est la première action correcte ?</strong>",
        choices: [
          {
            text: "Bloquer immédiatement le domaine au firewall pour stopper l'exfiltration.",
            ok: false, pts: -20,
            fb: "Erreur stratégique. Bloquer alerte l'APT qui va effacer ses traces et se redéployer. Vous perdez la visibilité sur l'étendue de la compromission.",
            legal: "Bonne pratique OFCS — Ne jamais alerter l'attaquant avant d'avoir cartographié son implantation.",
            critical: true, next: "end",
          },
          {
            text: "Mettre en place une surveillance passive (DNS sinkhole, capture réseau complète) pour identifier toutes les machines affectées avant tout confinement.",
            ok: true, pts: 25,
            fb: "Approche correcte. Un sinkhole DNS permet de répondre aux requêtes de manière contrôlée et d'identifier toutes les machines compromises sans alerter l'APT. Collecte des IoC avant toute action de confinement.",
            legal: "Rapport MELANI 2016 — Surveillance préalable permet la cartographie complète avant isolation coordonnée.",
            critical: false, next: 1,
          },
          {
            text: "Demander à l'utilisateur de la machine s'il a récemment installé un logiciel suspect.",
            ok: false, pts: -15,
            fb: "Contre-productif. Si la machine est compromise, l'utilisateur peut être impliqué involontairement — ou être utilisé pour transmettre l'information à l'attaquant. Aucune enquête APT ne passe par l'interrogatoire direct de l'utilisateur en phase initiale.",
            legal: "Bonne pratique DFIR — Phase d'observation discrète avant toute interaction humaine.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🔬 Cartographie silencieuse",
        situation: "Après 3 semaines de surveillance passive, vous avez identifié <strong>32 machines compromises</strong> réparties sur 4 sites (Emmen, Thun, Altdorf, Zurich). Le malware ressemble à <strong>Tavdig/Carbon</strong>, associé au groupe Turla (attribution étatique selon plusieurs CERT). MELANI demande un rapport opérationnel.",
        law: "<strong>Art. 86 Loi militaire</strong> — Protection des informations militaires sensibles.<br><strong>Rapport public MELANI</strong> — Transparence vs sécurité opérationnelle.",
        question: "<strong>Quelle formulation adoptez-vous dans le rapport public ?</strong>",
        choices: [
          {
            text: "Publier l'analyse technique complète avec tous les IoC (hashes, domaines C2, TTPs, attribution Turla).",
            ok: true, pts: 25,
            fb: "Approche correcte — c'est exactement ce qu'a fait MELANI en mai 2016. Publier les IoC permet à la communauté internationale (autres CERT) de détecter l'APT sur d'autres réseaux. Le rapport public est devenu une référence.",
            legal: "Rapport MELANI 23.05.2016 — Publication des TTP et IoC pour le bénéfice de la communauté DFIR internationale.",
            critical: false, next: 2,
          },
          {
            text: "Garder le rapport strictement confidentiel pour ne pas révéler les capacités de détection suisses.",
            ok: false, pts: -15,
            fb: "Trop prudent. Le silence protège les futures cibles de l'APT ? Non : il les prive d'IoC qui pourraient les alerter. La Suisse a choisi la transparence — avec succès.",
            legal: "Doctrine MELANI — La transparence contrôlée sur les IoC renforce la sécurité collective.",
            critical: false, next: 2,
          },
          {
            text: "Publier un communiqué vague sans IoC « pour ne pas aider les attaquants ».",
            ok: false, pts: -10,
            fb: "L'inverse est vrai : les attaquants connaissent déjà leurs propres outils. Les IoC publiés aident uniquement les défenseurs qui ne les connaissent pas.",
            legal: "Principe de sécurité collective — Security through obscurity ≠ sécurité réelle.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "📊 L'analyse du modus operandi",
        situation: "L'analyse forensique approfondie révèle le modus operandi de Turla : (1) phase de reconnaissance via <strong>rootkit Tavdig</strong> (septembre 2014 — le patient zero), (2) escalade et persistance via <strong>Carbon</strong> (mars 2015), (3) exfiltration via DNS tunneling depuis février 2016. Durée totale : 21 mois. Volume exfiltré estimé : <strong>23 Go</strong>. Cible : données classifiées du département armement.",
        law: "<strong>Art. 86 Loi militaire</strong> — Secret militaire.<br><strong>Convention Genève art. 39</strong> — Protection d'infrastructures militaires.<br><strong>MITRE ATT&CK</strong> — T1547 (Persistence), T1071 (C2 via DNS), T1041 (Exfiltration via C2).",
        question: "<strong>Comment présentez-vous la chronologie d'intrusion au Conseil fédéral ?</strong>",
        choices: [
          {
            text: "Présenter les 23 Go comme une exfiltration \"massive et dévastatrice\" pour alerter sur l'urgence.",
            ok: false, pts: -20,
            fb: "Dramatisation sans fondement technique. 23 Go sur 21 mois = 36 MB/jour en moyenne — faible taux (à dessein, pour éviter la détection). Dramatiser = perdre crédibilité technique. La présentation doit être factuelle.",
            legal: "Manuel Ch. 29.3 — Exposé des faits objectifs et mesurés.",
            critical: false, next: 3,
          },
          {
            text: "Chronologie factuelle : (1) phases Tavdig → Carbon → DNS exfiltration, (2) volume 23 Go total sur 21 mois (faible bande passante pour rester furtif), (3) TTPs documentés avec références MITRE ATT&CK, (4) profil d'APT étatique compatible avec Turla (groupe associé aux services russes selon multiple attributions CERT, dont CISA/NSA). L'attribution étatique finale reste de compétence SRC.",
            ok: true, pts: 25,
            fb: "Présentation technique et institutionnellement correcte. Vous distinguez TTP observables (votre rôle) et attribution géopolitique (SRC/services de renseignement). Le Conseil fédéral a besoin des deux dimensions pour décider.",
            legal: "Manuel Ch. 29.1 + Art. 86 LAM + pratique SRC — Séparation TTP / attribution.",
            critical: false, next: 3,
          },
          {
            text: "Refuser de présenter au Conseil fédéral — trop sensible politiquement.",
            ok: false, pts: -25,
            fb: "Manquement grave. Un incident de cette ampleur contre une entreprise d'armement fédérale exige un reporting au CF. Refuser = obstruction institutionnelle.",
            legal: "Art. 176 Cst. + Art. 86 LAM — Obligation de reporting en sécurité nationale.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🎯 Le confinement coordonné",
        situation: "Après 3 semaines de cartographie complète (32 machines identifiées, C2 listés, TTPs documentés), il faut enfin confiner l'APT. Le défi : le faire simultanément sur tous les sites pour que Turla ne puisse pas réactiver des machines non encore identifiées ailleurs. Plus de 40 techniciens doivent agir en même temps.",
        law: "<strong>Bonne pratique NIST SP 800-61</strong> — Containment coordonné.<br><strong>Manuel Ch. 21</strong> — Plans de réponse à incident.",
        question: "<strong>Comment orchestrez-vous le confinement ?</strong>",
        choices: [
          {
            text: "Commencer par le site principal d'Emmen, puis les autres progressivement sur 2 semaines.",
            ok: false, pts: -25,
            fb: "Erreur fatale. Dès qu'Emmen est confinée, Turla détectera (ses C2 ne répondent plus depuis Emmen) et pourra alerter ses autres implants AVANT confinement. Résultat : destruction des traces sur les 3 autres sites.",
            legal: "NIST SP 800-61 + retour d'expérience MELANI 2016 — Confinement simultané obligatoire pour APT actifs.",
            critical: true, next: "end",
          },
          {
            text: "Confinement SIMULTANÉ sur les 4 sites à une heure convenue (ex: 03h00 UTC, quand activité faible). Pré-préparé : scripts de réponse distribués à chaque équipe site, checklists (isolation VLAN, révocation credentials, réinitialisation AD), rendez-vous téléphonique commun pour coordination, analyse forensique post-confinement à J+1.",
            ok: true, pts: 25,
            fb: "Orchestration exemplaire. La synchronisation temporelle précise + scripts pré-distribués = contexte où Turla ne peut plus communiquer avec ses implants ni les déclencher en mode destruction. C'est exactement l'approche documentée dans le rapport MELANI.",
            legal: "MELANI 2016 + NIST SP 800-61 — Blitz-containment coordonné pour APT étatiques.",
            critical: false, next: 4,
          },
          {
            text: "Communiquer publiquement l'attaque avant confinement pour créer une pression sur Turla.",
            ok: false, pts: -30,
            fb: "Stratégie catastrophique. L'annonce publique AVANT confinement alerte Turla qui activera ses mécanismes d'auto-destruction (wipe logs, suicide implants). Toute l'investigation discrète de 3 semaines est perdue.",
            legal: "Pratique OFCS — Communication après confinement uniquement.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🧪 L'analyse malware approfondie",
        situation: "Post-confinement, vous récupérez les binaires Tavdig et Carbon. Votre équipe les analyse en sandbox isolée. Tavdig fait 180 KB packé (Themida), Carbon 340 KB. Le reversing révèle : chiffrement RC4 des communications, domain generation algorithm (DGA) avec seed basée sur date UTC, mécanisme de persistence via scheduled tasks + WMI events, anti-VM checks, kill switches.",
        law: "<strong>MITRE ATT&CK</strong> — T1480 (Execution Guardrails), T1497 (Virtualization Evasion), T1546 (Event Triggered Execution).<br><strong>Manuel Ch. 20</strong> — Reverse engineering forensique.<br><strong>Art. 143bis CP</strong> — Usage limité : création ET diffusion de malware prohibées.",
        question: "<strong>Comment traitez-vous les échantillons pour la communauté DFIR ?</strong>",
        choices: [
          {
            text: "Publier les binaires Tavdig/Carbon complets sur VirusTotal pour que la communauté puisse les analyser.",
            ok: false, pts: -20,
            fb: "Problématique légal. Publier les binaires complets d'un malware étatique = (1) Art. 144 CP si utilisé par un tiers pour attaquer, (2) risque que les auteurs les récupèrent pour créer des variants. La diffusion se fait via YARA rules et hashes, pas les binaires.",
            legal: "Art. 144 CP + pratique CERT — Publier YARA rules et IoC, pas les binaires complets.",
            critical: true, next: "end",
          },
          {
            text: "Livrables communautaires : (1) YARA rules détectant Tavdig/Carbon, (2) hashes SHA-256 + MD5 + SSDEEP, (3) IoC (domaines C2, DGA pattern, IP), (4) STIX/TAXII bundle pour plateformes collaboratives, (5) règles Snort/Suricata pour détection réseau, (6) règles Sigma pour SIEM. Binaires partagés UNIQUEMENT avec CERT partenaires sous accord de confidentialité.",
            ok: true, pts: 25,
            fb: "Partage communautaire exemplaire. YARA + IoC + STIX permettent à des milliers d'organisations de se protéger SANS exposer les binaires au détournement. C'est le standard international porté par MISP, FIRST, ENISA.",
            legal: "MISP + FIRST + Art. 144 CP — Partage responsable des indicateurs sans outil.",
            critical: false, next: 5,
          },
          {
            text: "Garder toute l'analyse confidentielle — RUAG est une entreprise fédérale, c'est une information d'État.",
            ok: false, pts: -15,
            fb: "Position trop rigide. Le rapport MELANI public de mai 2016 est devenu une référence internationale précisément parce qu'il a partagé. La rétention totale d'IoC prive la communauté de protection et n'apporte aucun bénéfice à la Suisse.",
            legal: "Rapport MELANI 2016 — Le partage anonymisé d'IoC est standard.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "🛡 La remédiation RUAG",
        situation: "RUAG doit reconstruire sa sécurité. Budget : 15M CHF sur 2 ans. Vous êtes consulté sur les priorités techniques. Les 32 machines compromises seront reformatées intégralement. Mais la problématique est systémique : comment éviter qu'un nouvel APT s'installe ?",
        law: "<strong>NIST CSF</strong> — 5 fonctions (Identify, Protect, Detect, Respond, Recover).<br><strong>CIS Controls v8</strong> — Top 18.<br><strong>ISO/IEC 27001</strong> — SMSI.<br><strong>MITRE ATT&CK</strong> — Défensif par TTP.",
        question: "<strong>Quelle stratégie de remédiation proposez-vous ?</strong>",
        choices: [
          {
            text: "Concentrer 80% du budget sur des firewalls nouvelle génération.",
            ok: false, pts: -15,
            fb: "Déséquilibre. Un NGFW seul n'arrête pas un APT qui entre par spearphishing + malware custom. L'attaquant passe par les utilisateurs, pas le périmètre. Approche équilibrée nécessaire : détection interne (EDR, SIEM, UEBA) + segmentation + 0-trust.",
            legal: "NIST CSF + MITRE ATT&CK Defense — Défense en profondeur équilibrée.",
            critical: false, next: 6,
          },
          {
            text: "Plan multi-axes : (1) Détection : déploiement EDR flotte complète + SIEM centralisé + SOC 24/7 managé, (2) Réseau : segmentation par fonction (dev/prod/admin), 0-trust avec MFA partout, DLP, (3) Endpoints : application whitelisting, disabled PowerShell legacy, USB control, (4) Humain : formation phishing réaliste + exercices Red Team annuels, (5) Gouvernance : CISO élevé au niveau Board, reporting mensuel, (6) Supply chain : audit fournisseurs sensibles, (7) Threat Intelligence : abonnements CTI + MISP + FIRST.",
            ok: true, pts: 25,
            fb: "Plan stratégique complet et équilibré. Chaque axe adresse un aspect différent de la kill chain APT. La combinaison EDR + segmentation + 0-trust + exercices Red Team est précisément ce qui permet de détecter un APT en moins de 3 mois (vs 21 mois en 2014-2016).",
            legal: "NIST CSF + CIS Controls v8 + Pratique RUAG post-2016 — Défense en profondeur moderne.",
            critical: false, next: 6,
          },
          {
            text: "Demander une garantie à 100% contre toute intrusion future avant tout investissement.",
            ok: false, pts: -20,
            fb: "Illusion. Aucun expert sérieux ne peut garantir 100%. Contre un APT étatique motivé, la question n'est pas \"SI\" mais \"QUAND\". L'objectif réaliste est de détecter rapidement (Dwell Time court) et contenir efficacement, pas d'éliminer le risque.",
            legal: "Principe de sécurité réaliste — Defense-in-depth sans garantie absolue.",
            critical: false, next: 6,
          },
        ],
      },
      {
        phase: "🌐 La coopération internationale",
        situation: "L'attribution à Turla (groupe associé à FSB selon CISA/NSA) ouvre des questions diplomatiques. Les CERT de Allemagne, France, Pays-Bas, États-Unis partagent des IoC similaires. MELANI propose un partage coordonné. La question politique : faut-il accuser publiquement la Russie ?",
        law: "<strong>Attribution souveraine</strong> — Réservée aux autorités politiques/SRC, pas au DFIR.<br><strong>Convention Budapest</strong> — Coopération cybercriminalité.<br><strong>Art. 184 CPP</strong> — Expert dans son rôle technique.",
        question: "<strong>Quelle est votre position d'expert sur la question d'attribution ?</strong>",
        choices: [
          {
            text: "Signer publiquement une déclaration conjointe avec les CERT étrangers attribuant à la Russie.",
            ok: false, pts: -25,
            fb: "Dépassement du rôle technique. L'attribution à un État est un acte politique qui engage les relations diplomatiques. Un expert DFIR fournit les TTPs observables, pas l'attribution étatique. Cette dernière relève du Conseil fédéral / SRC / DFAE.",
            legal: "Art. 184 CPP + Art. 54 Cst. — Attribution étatique = compétence politique.",
            critical: true, next: "end",
          },
          {
            text: "« Mon rôle : documenter techniquement les TTPs et les liens avec d'autres incidents Turla (signature malware, infrastructure C2 partagée, modus operandi). L'attribution à un État est une décision politique qui appartient au Conseil fédéral après analyse SRC. Je fournis les éléments techniques, les autorités politiques décident de la position diplomatique. »",
            ok: true, pts: 25,
            fb: "Posture institutionnellement correcte. Vous respectez la séparation des rôles : technique (votre domaine) vs politique (Conseil fédéral). Cette approche protège l'indépendance technique du DFIR et respecte la souveraineté politique.",
            legal: "Art. 184 CPP + Art. 54 Cst. + Pratique MELANI/OFCS — Séparation rôles technique/politique.",
            critical: false, next: 7,
          },
          {
            text: "Refuser tout partage avec les CERT étrangers pour préserver l'indépendance suisse.",
            ok: false, pts: -20,
            fb: "Isolationnisme contre-productif. Le partage d'IoC avec les CERT partenaires (via FIRST, MISP, accords bilateraux) améliore la sécurité collective. Refuser = priver la Suisse de renseignements réciproques sans bénéfice.",
            legal: "Convention Budapest + accords FIRST — Coopération internationale bénéfique.",
            critical: false, next: 7,
          },
        ],
      },
      {
        phase: "📚 L'héritage pédagogique",
        situation: "8 ans après, le rapport MELANI RUAG 2016 reste une référence internationale. Vous êtes invité à donner des conférences dans les universités (EPFL, ETH, HEIG-VD) et les écoles DFIR (SANS, OSForensics). Quelle est votre approche pédagogique ?",
        law: "<strong>Art. 320 CP</strong> — Secret de fonction (toujours applicable, même post-incident).<br><strong>Principe de capitalisation</strong> — Partage des enseignements.<br><strong>Droit d'auteur</strong> — Sur les analyses techniques.",
        question: "<strong>Comment structurez-vous votre enseignement ?</strong>",
        choices: [
          {
            text: "Partager tous les détails confidentiels pour un enseignement maximal.",
            ok: false, pts: -20,
            fb: "Violation du secret de fonction. Même 8 ans après, les éléments classifiés restent tels. Partager au-delà du rapport public = rupture de confiance institutionnelle + risque Art. 320 CP.",
            legal: "Art. 320 CP — Secret de fonction perdure indépendamment du temps.",
            critical: true, next: "end",
          },
          {
            text: "Enseignement basé EXCLUSIVEMENT sur le rapport public MELANI 2016 : (1) analyse TTPs publiés (Tavdig, Carbon, DGA, DNS tunneling), (2) leçons méthodologiques (surveillance passive avant confinement, blitz-containment), (3) lessons learned (dwell time 21 mois, importance Threat Intelligence), (4) exercices pratiques à partir des IoC publiés. Aucune divulgation au-delà du rapport public.",
            ok: true, pts: 25,
            fb: "Approche pédagogique exemplaire. Le rapport public MELANI contient DÉJÀ assez de matière pour enseigner l'essentiel. La discipline de s'en tenir au public respecte le secret tout en formant la prochaine génération DFIR. C'est ainsi que l'héritage Turla continue de protéger la Suisse.",
            legal: "Art. 320 CP + LTrans + Rapport MELANI 2016 — Enseignement sur base publique uniquement.",
            critical: false, next: "end",
          },
          {
            text: "Refuser toutes les invitations — trop risqué.",
            ok: false, pts: -10,
            fb: "Dommage. La communauté DFIR suisse a besoin d'expertise concrète pour se former. Refuser = priver une génération de l'expérience acquise. Le bon équilibre est l'enseignement rigoureux sur base publique.",
            legal: "Principe de capitalisation — Transmission responsable des connaissances.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 85 && custodyPct >= 75) return { icon: "🛡", title: "Expert Contre-APT", sub: "Maîtrise avancée de la réponse à APT étatique" };
      if (pct >= 65) return { icon: "🎯", title: "Analyste APT", sub: "Bonnes bases sur la détection d'APT longue durée" };
      return { icon: "📚", title: "Formation requise", sub: "Révisez le rapport MELANI RUAG 2016" };
    },
  },

  /* ══════════════════════════════════════════════════
     19. CICR_2022 — Attaque contre la Croix-Rouge  [HARD]
     Basé sur l'attaque de janvier 2022 contre un serveur hébergeant le
     programme "Rétablissement des Liens Familiaux" — 515'000 personnes.
  ══════════════════════════════════════════════════ */
  {
    id: "cicr_2022",
    title: "La Croix-Rouge Compromise",
    icon: "🏥",
    difficulty: "hard",
    atmosphere: "hospital",
    realCase: "CICR, janvier 2022 — Compromission d'un serveur externe hébergeant le programme « Rétablissement des liens familiaux ». Données de 515'000 personnes vulnérables exposées. Exploitation d'une vulnérabilité Zoho ManageEngine ADSelfService Plus (CVE-2021-40539). Intrusion attribuée à un acteur étatique.",
    tags: ["RÉSEAUX", "DROIT"],
    legalRefs: ["CVE-2021-40539", "LPD 2023", "Conv. Genève (droit humanitaire)", "Communiqué CICR 19.01.2022"],
    intro: "Le CICR détecte un accès non autorisé sur le serveur du programme « Rétablissement des liens familiaux ». 515'000 personnes déplacées, disparues ou séparées de leur famille pourraient être exposées. L'enjeu humanitaire est vital — chaque décision compte.",
    alertLevel: "INCIDENT HUMANITAIRE CRITIQUE — Données de personnes vulnérables",
    objectives: [
      { icon: "🔍", text: "Identifier rapidement le vecteur d'intrusion (CVE exploitée)" },
      { icon: "🏛", text: "Respecter les obligations humanitaires spécifiques du CICR" },
      { icon: "📣", text: "Gérer la communication envers les populations concernées" },
    ],
    debrief: "<p>L'attaque contre le CICR de janvier 2022 reste l'une des cyberattaques les plus graves contre une organisation humanitaire. Elle a révélé une exploitation de <strong>CVE-2021-40539</strong> (Zoho ManageEngine ADSelfService Plus, patch publié 4 mois avant l'intrusion). Le délai de patching d'un composant critique a été la cause technique.</p><p>Sur le plan humanitaire, le CICR a fait un choix remarquable : <strong>communication publique complète dès la découverte</strong>, y compris un appel direct aux attaquants pour ne pas publier les données, au nom du droit humanitaire international.</p>",
    narrative: {
      success: "L'intrusion est contenue, le vecteur (Zoho ManageEngine non patché) est identifié. Le communiqué public du 19 janvier 2022 du CICR fait référence. Les attaquants, bien qu'étatiques présumés, ne publient aucune donnée — un succès diplomatique humanitaire sans précédent.",
      degraded: "L'intrusion est contenue mais certains artefacts sont perdus. La communication arrive tardivement. L'incident est géré, mais la confiance envers l'outil numérique du CICR est durablement atteinte.",
      failure: "Réponse chaotique, preuves détruites, communication incohérente. Les données des 515'000 personnes vulnérables finissent publiées. Des personnes en danger sont retrouvées et tuées par leurs persécuteurs. Le programme RLF est suspendu mondialement."
    },
    steps: [
      {
        phase: "🚨 L'alerte initiale",
        situation: "Le SOC du CICR détecte un accès inhabituel sur le serveur RLF (<em>Restoring Family Links</em>) à 02h47. Le serveur héberge Zoho ManageEngine pour la gestion des identités. Vous arrivez sur site 35 minutes plus tard. <strong>L'attaquant est peut-être encore actif</strong>.",
        law: "<strong>CVE-2021-40539</strong> — Zoho ManageEngine ADSelfService Plus, RCE non authentifiée, patch publié en septembre 2021.<br><strong>Convention IV Genève</strong> — Protection spéciale des données humanitaires du CICR.",
        question: "<strong>Quelle est votre première action ?</strong>",
        choices: [
          {
            text: "Arrêter immédiatement le serveur pour stopper l'intrusion et préserver l'intégrité des données.",
            ok: false, pts: -25,
            fb: "Erreur critique. Un arrêt brutal détruit la RAM et les indicateurs de compromission en cours. Sans IoC, on ne peut ni identifier le vecteur (quelle CVE ?), ni estimer l'étendue, ni chasser l'attaquant sur d'autres systèmes.",
            legal: "Manuel Ch. 11.1 — Capture RAM obligatoire avant arrêt sur tout système suspect d'intrusion active.",
            critical: true, next: "end",
          },
          {
            text: "Capturer la RAM et le trafic réseau en direct, puis isoler logiquement le serveur (VLAN quarantaine) sans l'éteindre.",
            ok: true, pts: 25,
            fb: "Approche correcte. Capture RAM + isolation VLAN préserve les preuves volatiles tout en coupant l'exfiltration active. Permet ensuite d'analyser les processus, connexions et mémoire sans alerter l'attaquant par un arrêt brutal.",
            legal: "GovCERT/OFCS — Isolation logique plutôt qu'extinction pour préserver les preuves d'une intrusion active.",
            critical: false, next: 1,
          },
          {
            text: "Informer immédiatement la presse pour que les 515'000 personnes concernées puissent se protéger.",
            ok: false, pts: -20,
            fb: "Prématuré. Sans analyse, impossible de dire si les données ont été exfiltrées ou simplement consultées. Une communication sans éléments concrets crée la panique et nuit à la confiance envers le CICR.",
            legal: "LPD 2023 Art. 24 — Notification dans les meilleurs délais une fois les éléments factuels établis.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🔬 Le vecteur d'intrusion",
        situation: "L'analyse mémoire révèle un shell déposé via un endpoint ZohoFormsLogs. Le serveur fait tourner <strong>Zoho ManageEngine ADSelfService Plus version 6.1.18</strong>. La CVE-2021-40539 (RCE) affecte toutes les versions antérieures à 6.1.19. Le patch a été publié le 6 septembre 2021 — l'intrusion a eu lieu le 9 novembre 2021 (soit 4 mois après).",
        law: "<strong>LPD 2023 Art. 8</strong> — Sécurité des données : mesures techniques et organisationnelles appropriées.<br><strong>CVE-2021-40539</strong> — Exploitation active documentée par CISA dès septembre 2021.",
        question: "<strong>Comment qualifiez-vous cette situation dans le rapport ?</strong>",
        choices: [
          {
            text: "« L'intrusion est le fait d'un acteur sophistiqué, aucune mesure raisonnable n'aurait pu l'empêcher. »",
            ok: false, pts: -20,
            fb: "Formulation malhonnête. La vulnérabilité était publique depuis 4 mois, activement exploitée selon CISA, avec patch disponible. Minimiser la responsabilité technique affaiblit la crédibilité et compromet les leçons à tirer.",
            legal: "Art. 251 CP — Un rapport minimisant sciemment une faute de gestion engage la responsabilité pénale de l'expert.",
            critical: false, next: "end",
          },
          {
            text: "« Le vecteur d'intrusion est la CVE-2021-40539 (RCE sur Zoho ADSelfService Plus). Le patch était disponible depuis 4 mois. Le cycle de patching sur ce système critique n'a pas été respecté, ce qui constitue une faille de gestion documentée. »",
            ok: true, pts: 25,
            fb: "Formulation forensique correcte. Elle identifie le vecteur technique (CVE), documente le délai (4 mois), et qualifie honnêtement la faille de gestion. C'est ce type de rapport factuel qui permet d'améliorer la sécurité globale.",
            legal: "LPD 2023 Art. 8 — Les mesures « appropriées » incluent un cycle de patching raisonnable pour les systèmes critiques.",
            critical: false, next: 2,
          },
          {
            text: "« L'intrusion prouve que Zoho est un logiciel dangereux à bannir. »",
            ok: false, pts: -10,
            fb: "Simpliste et techniquement faux. Toutes les suites logicielles ont eu des CVE critiques. Le problème n'est pas Zoho — c'est le cycle de patching. Un rapport qui stigmatise un produit plutôt qu'une pratique n'a pas de valeur.",
            legal: "Manuel Ch. 29.1 — Analyse des causes-racines, pas des marques.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🕊️ L'appel humanitaire",
        situation: "L'analyse confirme l'exfiltration de <strong>515'000 dossiers</strong> de personnes vulnérables (familles séparées par la guerre, détenus, migrants). L'attribution est étatique présumée. La direction du CICR vous consulte sur l'approche communication.",
        law: "<strong>Convention de Genève IV, Art. 26</strong> — Obligation spéciale de protéger les données des personnes cherchant leur famille.<br><strong>LPD 2023 Art. 24</strong> — Notification PFPDT.",
        question: "<strong>Quelle approche communication recommandez-vous ?</strong>",
        choices: [
          {
            text: "Communication publique complète (vecteur, volume, populations concernées) et appel direct aux attaquants au nom du droit humanitaire international.",
            ok: true, pts: 25,
            fb: "Approche retenue par le CICR dans son communiqué du 19 janvier 2022. La transparence complète a renforcé la crédibilité, et l'appel humanitaire direct aux attaquants a eu un effet — aucune donnée n'a jamais été publiée malgré l'attribution étatique présumée.",
            legal: "Communiqué CICR 19.01.2022 — Transparence + appel humanitaire = modèle de réponse pour incidents contre ONG.",
            critical: false, next: "end",
          },
          {
            text: "Communication minimaliste en interne pour ne pas compromettre l'enquête en cours.",
            ok: false, pts: -15,
            fb: "Contraire à la LPD 2023 et à la mission du CICR. Les personnes concernées — souvent en zone de conflit — doivent savoir que leurs données peuvent être compromises pour prendre leurs propres mesures de sécurité.",
            legal: "LPD 2023 Art. 24 — Notification obligatoire en cas de risque élevé pour les personnes concernées.",
            critical: false, next: "end",
          },
          {
            text: "Publier uniquement un communiqué technique sans mention des populations concernées pour éviter de paniquer.",
            ok: false, pts: -10,
            fb: "Insuffisant. Un communiqué purement technique laisse les familles dans l'ignorance du risque qui les concerne directement. Le droit humanitaire impose l'information des personnes en danger.",
            legal: "Convention IV — Protection active, pas seulement passive, des données humanitaires.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 85 && custodyPct >= 75) return { icon: "🕊️", title: "Gardien Humanitaire", sub: "Maîtrise parfaite de la réponse en contexte humanitaire" };
      if (pct >= 65) return { icon: "🏥", title: "Analyste Incident ONG", sub: "Bonnes bases sur la réponse spécifique aux ONG" };
      return { icon: "📚", title: "Formation requise", sub: "Révisez la réponse CICR janvier 2022" };
    },
  },

  /* ══════════════════════════════════════════════════
     20. STADLER_2020 — Chantage Industriel  [HARD]
     Basé sur la cyberattaque de mai 2020 contre Stadler Rail (Bussnang)
  ══════════════════════════════════════════════════ */
  {
    id: "stadler_2020",
    title: "Chantage chez Stadler Rail",
    icon: "🚆",
    difficulty: "hard",
    atmosphere: "ransomware",
    realCase: "Stadler Rail, mai 2020 — Ransomware + exfiltration. Attaquants réclament environ 6 millions USD en Bitcoin. Stadler refuse de payer. Publication partielle de documents sensibles sur le darknet, y compris des documents de projets de matériel militaire.",
    tags: ["WINDOWS", "DROIT"],
    legalRefs: ["Art. 147 CP", "Art. 156 CP (chantage)", "LFAIE", "GovCERT Guide ransomware"],
    intro: "Stadler Rail (Bussnang, TG) est frappé par un ransomware. Les attaquants revendiquent 7 To exfiltrés et demandent 6M USD en BTC. Parmi les fichiers menacés : des documents de contrats militaires (biens à double usage). Le CEO vous appelle.",
    alertLevel: "CHANTAGE INDUSTRIEL — Biens à double usage menacés",
    objectives: [
      { icon: "💰", text: "Arbitrer la question du paiement (GovCERT + SECO)" },
      { icon: "🛠", text: "Lancer la reconstruction tout en préservant les preuves" },
      { icon: "⚖️", text: "Gérer les aspects export-control (LFAIE) des documents à double usage" },
    ],
    debrief: "<p>L'affaire Stadler Rail 2020 a montré un groupe industriel suisse prendre une décision courageuse : <strong>ne pas payer la rançon</strong>, malgré la menace explicite de publication. Le raisonnement : payer finance la criminalité organisée, ne garantit pas la non-publication, et expose à des sanctions SECO si le destinataire est sur une liste.</p><p>La présence de <strong>documents à double usage</strong> (civil/militaire) a ajouté une dimension LFAIE : la publication de documents techniques de matériel militaire peut constituer une violation de contrôle à l'exportation.</p>",
    narrative: {
      success: "La reconstruction depuis backups isolés est réussie. Le refus de payer, bien communiqué aux collaborateurs, devient une position publique forte. La publication partielle sur le darknet a lieu, mais sans catastrophe commerciale ni sanction SECO. Stadler sort renforcé.",
      degraded: "La reconstruction est longue et coûteuse. La publication partielle crée des tensions commerciales avec certains clients défense. L'affaire laisse des cicatrices.",
      failure: "Paiement discret de la rançon : les attaquants publient quand même, la SECO ouvre une enquête (paiement à un groupe sanctionné). Stadler écope d'une amende fédérale et voit ses contrats défense résiliés."
    },
    steps: [
      {
        phase: "💰 Le dilemme du paiement",
        situation: "Les attaquants (groupe DoppelPaymer présumé) exigent 6 millions USD en BTC sous 72h. Ils ont publié un échantillon de 50 fichiers sur leur leak site incluant des schémas techniques de rames <em>Flirt</em> en configuration militarisée pour un client étranger. Le CEO hésite — le paiement éviterait une crise.",
        law: "<strong>GovCERT/NCSC</strong> — Recommandation officielle : <em>ne pas payer</em>.<br><strong>SECO</strong> — Paiement à un groupe sous sanctions internationales = infraction pénale.",
        question: "<strong>Que recommandez-vous au CEO ?</strong>",
        choices: [
          {
            text: "Payer discrètement via un intermédiaire crypto — 6M USD est dérisoire face à une publication de documents militaires.",
            ok: false, pts: -30,
            fb: "Erreur grave à triple titre. (1) Aucune garantie de non-publication. (2) Possibles sanctions SECO si le groupe est listé. (3) Financement direct de la criminalité organisée. L'argument « dérisoire » est exactement ce que ciblent les attaquants.",
            legal: "GovCERT + SECO — Payer = financer la cybercriminalité ET s'exposer à des sanctions pénales si le destinataire est listé.",
            critical: true, next: "end",
          },
          {
            text: "Refuser le paiement, lancer la reconstruction depuis les backups isolés, préparer un communiqué public assumant la position éthique.",
            ok: true, pts: 25,
            fb: "Position conforme aux recommandations officielles et à la décision réelle de Stadler en 2020. Le refus du paiement, accompagné d'une reconstruction solide, est la seule stratégie qui ne renforce pas l'écosystème criminel.",
            legal: "GovCERT/NCSC 2023 — Position officielle : ne pas payer. Stadler Rail en 2020 a été un cas modèle.",
            critical: false, next: 1,
          },
          {
            text: "Négocier à la baisse (proposer 1M USD) pour gagner du temps.",
            ok: false, pts: -15,
            fb: "Négocier, c'est déjà reconnaître la valeur du chantage. Gagner du temps à ce prix alimente la confiance des attaquants dans la méthode. La décision doit être ferme et communiquée en interne comme en externe.",
            legal: "Doctrine GovCERT — Négocier nourrit le modèle économique criminel.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🛠 La reconstruction forensique",
        situation: "Vous devez reconstruire les systèmes Active Directory depuis les backups Veeam (offline, non chiffrés). L'équipe IT veut restaurer immédiatement pour minimiser l'arrêt de production. 2'400 employés sont au chômage technique depuis 48h.",
        law: "<strong>Manuel Ch. 11.1</strong> — Capture forensique avant toute remédiation.<br><strong>GovCERT Guide ransomware</strong> — Vérification backup + reconstruction depuis système propre.",
        question: "<strong>Quelle séquence opérationnelle adoptez-vous ?</strong>",
        choices: [
          {
            text: "Restaurer immédiatement depuis les backups sur les serveurs existants — la production doit reprendre.",
            ok: false, pts: -25,
            fb: "Erreur classique. Restaurer sur des machines potentiellement compromises réintroduit l'infection. Le ransomware peut avoir créé des comptes de persistance dans l'AD sauvegardé. Il faut reconstruire de zéro sur infrastructure nettoyée.",
            legal: "GovCERT — Ne jamais restaurer sur des systèmes potentiellement compromis.",
            critical: true, next: "end",
          },
          {
            text: "(1) Imager les systèmes compromis pour preuves. (2) Reconstruire sur infrastructure propre. (3) Restaurer les données depuis backup vérifié. (4) Auditer l'AD restauré avant mise en production.",
            ok: true, pts: 25,
            fb: "Séquence correcte. Préservation des preuves (pour enquête et réquisition pénale), reconstruction propre (pas de réinfection), vérification AD (pas de backdoor persistante dans les backups). Plus lent mais solide.",
            legal: "Manuel Ch. 11.1 + GovCERT — Imagerie forensique → reconstruction → restauration → audit final.",
            critical: false, next: 2,
          },
          {
            text: "Payer la rançon pour accélérer la reprise — la séquence forensique peut attendre.",
            ok: false, pts: -30,
            fb: "Contredit la décision précédente. Cohérence stratégique cruciale : le refus du paiement doit s'accompagner d'une reconstruction solide, pas d'une marche arrière.",
            legal: "GovCERT — Le refus du paiement suppose une capacité de reconstruction indépendante.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "⚖️ Les documents à double usage",
        situation: "Parmi les 7 To exfiltrés : des schémas techniques du tram <em>Flirt</em> en version militarisée pour un client étranger non-OTAN. Ces documents relèvent potentiellement de la <strong>LFAIE</strong> (Loi fédérale sur l'acquisition d'immeubles par des personnes à l'étranger — et par extension le contrôle de l'exportation de biens à double usage). Le SECO doit-il être informé ?",
        law: "<strong>LFAIE / LFMG</strong> — Biens militaires et à double usage : contrôle d'exportation obligatoire.<br><strong>Art. 86 Loi militaire</strong> — Secret des données militaires.",
        question: "<strong>Quelle est votre obligation de notification ?</strong>",
        choices: [
          {
            text: "Notifier uniquement le PFPDT (LPD 2023) — c'est une fuite de données personnelles d'employés.",
            ok: false, pts: -15,
            fb: "Incomplet. La fuite concerne AUSSI des documents à double usage. La notification au SECO est obligatoire pour les biens sous contrôle d'exportation. Sinon, Stadler s'expose à des sanctions additionnelles.",
            legal: "LFMG/LFAIE — Notification SECO pour toute compromission de données de biens militaires ou à double usage.",
            critical: false, next: "end",
          },
          {
            text: "Notifier simultanément : PFPDT (données personnelles), GovCERT/OFCS (incident), SECO (biens à double usage), et éventuellement le MPC (plainte pénale).",
            ok: true, pts: 25,
            fb: "Correct. Une fuite de cette ampleur déclenche plusieurs obligations concurrentes. La notification coordonnée à toutes les autorités compétentes est la seule approche qui protège Stadler juridiquement.",
            legal: "LPD 2023 + LFMG + Ordonnance OFCS — Multi-notification obligatoire pour incident touchant plusieurs domaines régulés.",
            critical: false, next: "end",
          },
          {
            text: "Ne notifier personne — les documents sont maintenant dans la nature, inutile d'ajouter des ennuis administratifs.",
            ok: false, pts: -25,
            fb: "Erreur grave. L'absence de notification SECO sur des biens à double usage exfiltrés constitue elle-même une infraction. Les autorités apprennent tôt ou tard par le darknet ou par la presse — avec des conséquences bien pires que la notification spontanée.",
            legal: "LFMG Art. 33 — L'omission de notification est elle-même punissable.",
            critical: true, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 85 && custodyPct >= 75) return { icon: "🚆", title: "Expert Gestion de Crise", sub: "Maîtrise parfaite d'un chantage industriel complexe" };
      if (pct >= 65) return { icon: "🛠", title: "Gestionnaire Incident", sub: "Bonnes bases sur les ransomware industriels" };
      return { icon: "📚", title: "Formation requise", sub: "Révisez le dossier Stadler Rail 2020 + Guide GovCERT" };
    },
  },

  /* ══════════════════════════════════════════════════
     21. COMPARIS_2021 — Hive chez le Comparateur  [MEDIUM]
     Basé sur l'attaque Hive ransomware contre Comparis.ch, juillet 2021
  ══════════════════════════════════════════════════ */
  {
    id: "comparis_2021",
    title: "Hive frappe Comparis",
    icon: "💸",
    difficulty: "medium",
    atmosphere: "ransomware",
    realCase: "Comparis.ch, juillet 2021 — Ransomware Hive. Environ 20 Go de données clients exfiltrés (identifiants, recherches d'assurance). Comparis refuse de payer. Publication partielle sur le leak site Hive. Notification au PFPDT effectuée.",
    tags: ["DROIT", "FORENSIQUE"],
    legalRefs: ["LPD (ancienne)", "LPD 2023 Art. 24", "Art. 143bis CP", "GovCERT Hive report"],
    intro: "Comparis.ch, comparateur en ligne, est frappé par le ransomware Hive. Les attaquants revendiquent 20 Go exfiltrés : identifiants clients, historiques de recherche d'assurance. Ils exigent 1M USD en BTC. Le CEO vous mandate pour l'analyse et la stratégie.",
    alertLevel: "FUITE DE DONNÉES CLIENTS — Notification PFPDT critique",
    objectives: [
      { icon: "🔍", text: "Qualifier correctement l'étendue réelle de l'exfiltration" },
      { icon: "📣", text: "Respecter le délai de notification PFPDT (LPD 2023)" },
      { icon: "🛡", text: "Gérer la communication envers les clients concernés" },
    ],
    debrief: "<p>L'affaire Comparis 2021 illustre le dilemme classique du ransomware moderne : <strong>double extorsion</strong> (chiffrement + menace de publication). Comparis a choisi de refuser de payer tout en notifiant rapidement le PFPDT et en communiquant aux clients.</p><p>La décision clé : <strong>qualifier précisément les données exfiltrées</strong> avant la communication. Dire « peut-être des données clients » crée plus de panique qu'un inventaire précis. La rigueur forensique est au service de la qualité de communication.</p>",
    narrative: {
      success: "L'inventaire précis des données exfiltrées permet une notification PFPDT conforme et une communication clients factuelle. Le refus du paiement et la transparence communicationnelle renforcent plutôt qu'affaiblissent la marque Comparis. Les clients informés prennent leurs mesures (changement de mots de passe).",
      degraded: "La notification arrive, mais avec des imprécisions. Certains clients mal informés se plaignent publiquement. L'image de marque est atteinte temporairement.",
      failure: "Paiement en catimini, notification retardée ou omise. Le PFPDT apprend par la presse, ouvre une procédure. Les clients, informés tardivement, perdent confiance. Comparis perd 15% de parts de marché en 6 mois."
    },
    steps: [
      {
        phase: "🔍 Qualifier l'exfiltration",
        situation: "Hive revendique 20 Go exfiltrés. Votre analyse des logs réseau montre <strong>12 Go de trafic sortant suspect</strong> sur 4 jours. L'équipe IT veut annoncer immédiatement « 20 Go exfiltrés » pour être transparent. Le CEO hésite — c'est peut-être exagéré.",
        law: "<strong>LPD 2023 Art. 24</strong> — Notification PFPDT « dans les meilleurs délais ».<br><strong>Manuel Ch. 29.1</strong> — Rigueur factuelle dans les communications incident.",
        question: "<strong>Quelle qualification retenez-vous dans la notification ?</strong>",
        choices: [
          {
            text: "Reprendre le chiffre de Hive (20 Go) — l'attaquant est la meilleure source.",
            ok: false, pts: -15,
            fb: "Faux. L'attaquant a intérêt à gonfler les chiffres pour la pression négociation. Reprendre ses chiffres = lui donner le contrôle du narratif. Votre propre analyse forensique est la seule source crédible.",
            legal: "Manuel Ch. 29.1 — Ne jamais reprendre les chiffres de l'attaquant sans vérification indépendante.",
            critical: false, next: "end",
          },
          {
            text: "« Nos logs confirment 12 Go de trafic sortant anormal. La revendication de Hive (20 Go) ne peut être ni confirmée ni infirmée à ce stade. Des identifiants clients et historiques de recherche sont probablement concernés. »",
            ok: true, pts: 25,
            fb: "Formulation forensique impeccable. Elle distingue fait mesuré (12 Go), revendication attaquant (20 Go, non vérifiable), et nature probable (basée sur les systèmes accédés). Honnête, précise, défendable.",
            legal: "LPD 2023 Art. 24 + Manuel Ch. 29.3 — Notification factuelle avec niveaux d'affirmation distincts.",
            critical: false, next: 1,
          },
          {
            text: "Minimiser : « Aucune donnée sensible n'a été confirmée exfiltrée. »",
            ok: false, pts: -20,
            fb: "Dangereusement faux. 12 Go de trafic sortant anormal sont des faits. Minimiser sciemment expose à une procédure PFPDT et à des plaintes civiles clients si des données apparaissent plus tard.",
            legal: "LPD 2023 Art. 24 + Art. 251 CP — La minimisation fautive est sanctionnable pénalement.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📣 Communication aux clients",
        situation: "La notification PFPDT est envoyée dans les 48h. Il faut maintenant communiquer aux clients concernés. L'équipe marketing veut envoyer un email générique « Possible incident, par précaution changez votre mot de passe ». Vous avez identifié <strong>47'000 comptes</strong> probablement concernés par l'exfiltration de 12 Go.",
        law: "<strong>LPD 2023 Art. 24 al. 3</strong> — Information des personnes concernées si risque élevé.<br><strong>Bonne pratique</strong> — Communication ciblée plutôt que générique.",
        question: "<strong>Quelle stratégie de communication adoptez-vous ?</strong>",
        choices: [
          {
            text: "Envoyer un email générique aux 3 millions d'utilisateurs par précaution.",
            ok: false, pts: -10,
            fb: "Approche floue qui crée de la panique inutile chez 2,95M clients non concernés et dilue le message pour les 47'000 réellement touchés. La précision protège la marque et les clients.",
            legal: "LPD 2023 — Information proportionnée au risque réel.",
            critical: false, next: "end",
          },
          {
            text: "Envoyer un email ciblé aux 47'000 clients identifiés, décrivant précisément les données concernées, les actions à prendre, et un lien vers FAQ détaillée.",
            ok: true, pts: 20,
            fb: "Approche correcte. La communication ciblée, précise et actionnable respecte le principe de proportionnalité et maximise l'efficacité pour les personnes réellement en risque.",
            legal: "LPD 2023 Art. 24 al. 3 — Information des personnes concernées, proportionnelle au risque.",
            critical: false, next: "end",
          },
          {
            text: "Ne rien communiquer aux clients — le PFPDT est notifié, l'obligation légale est remplie.",
            ok: false, pts: -20,
            fb: "Faux. La notification PFPDT et l'information aux clients sont deux obligations distinctes en cas de risque élevé (LPD 2023 Art. 24 al. 3). Des identifiants et historiques = risque élevé de phishing ciblé.",
            legal: "LPD 2023 Art. 24 al. 3 — Obligation d'information directe des personnes concernées.",
            critical: true, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "💸", title: "Expert Gestion Fuite", sub: "Maîtrise parfaite de la réponse à une fuite clients" };
      if (pct >= 60) return { icon: "🔍", title: "Analyste Fuite", sub: "Bonnes bases sur la gestion d'une fuite B2C" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez le cas Comparis 2021 et LPD 2023 Art. 24" };
    },
  },

  /* ══════════════════════════════════════════════════
     22. DARKMARKET_2021 — Opération Darkmarket  [HARD]
     Basé sur le démantèlement de Darkmarket, janvier 2021 (Europol + Allemagne + Suisse)
  ══════════════════════════════════════════════════ */
  {
    id: "darkmarket_2021",
    title: "Opération Darkmarket",
    icon: "🕵",
    difficulty: "hard",
    atmosphere: "raid",
    realCase: "Opération Darkmarket, janvier 2021 — Démantèlement coordonné Europol / BKA Allemagne / fedpol Suisse de la plus grande marketplace darknet de l'époque (500'000 utilisateurs). Perquisitions en plusieurs pays. Saisie de serveurs en Ukraine et Moldavie. Arrestations de vendeurs identifiés, y compris en Suisse.",
    tags: ["RÉSEAUX", "DROIT"],
    legalRefs: ["Art. 244 CPP", "Art. 248 CPP", "Art. 19 LStup", "Coordination Europol"],
    intro: "Fedpol coordonne avec Europol la perquisition d'un vendeur identifié sur Darkmarket (marketplace darknet). L'intervention a lieu à Zurich, 6h00. Le suspect est un informaticien expérimenté. Matériel suspecté : Tails, HDD chiffrés, portefeuilles crypto. L'opération doit être discrète — d'autres vendeurs sont ciblés simultanément.",
    alertLevel: "OPÉRATION COORDONNÉE — Suspect technophile, preuves numériques complexes",
    objectives: [
      { icon: "🚪", text: "Conduire la perquisition sans compromettre les preuves numériques" },
      { icon: "💻", text: "Gérer un environnement Tails (OS amnésique) — live forensics critique" },
      { icon: "₿", text: "Identifier et saisir les portefeuilles crypto (hot + cold wallets)" },
    ],
    debrief: "<p>L'opération Darkmarket de janvier 2021 a illustré la complexité des <strong>perquisitions chez des suspects technophiles</strong>. Contrairement à un suspect ordinaire, le vendeur darknet utilise généralement : Tails (OS live amnésique), conteneurs chiffrés, 2FA matériel, hot wallets actifs et cold wallets dormants.</p><p>La règle d'or : <strong>la porte ouverte, l'écran allumé</strong>. L'intervention doit arriver pendant que la machine est active — sinon tout est chiffré et inaccessible. Le timing d'intervention est aussi critique que la procédure forensique elle-même.</p>",
    narrative: {
      success: "L'intervention à 6h00 trouve le suspect connecté. Tails actif = RAM exploitable. 4 wallets Bitcoin identifiés (2 hot, 2 cold via seed phrases papier). Le rapport lie 340'000 CHF en BTC aux transactions Darkmarket. Condamnation à 5 ans ferme + confiscation. Opération modèle pour les formations futures.",
      degraded: "L'intervention trouve le suspect éveillé mais rapide. Tails partiellement capturé. Certains wallets identifiés, d'autres restent inaccessibles. Condamnation partielle.",
      failure: "Intervention mal chronométrée : suspect a eu le temps d'éteindre. Tails = rien en mémoire, rien sur disque (amnésique par design). Wallets chiffrés sans clé. Pas de lien crypto établi. Suspect ressort libre faute de preuves."
    },
    steps: [
      {
        phase: "🚪 L'entrée",
        situation: "06h02. La porte du suspect s'ouvre. Dans le salon : un laptop ThinkPad allumé avec un bureau <strong>Tails 4.xx</strong> actif, session déverrouillée. À côté, un smartphone Pixel sous GrapheneOS (écran éteint) et un <strong>YubiKey</strong> branché en USB. Sur le bureau, un carnet manuscrit ouvert.",
        law: "<strong>Tails</strong> — Live OS amnésique : tout disparaît à l'extinction. Les données utiles sont en RAM ou sur volumes chiffrés montés.<br><strong>Art. 244 CPP</strong> — Perquisition du domicile sur mandat.",
        question: "<strong>Quelle est votre première action forensique ?</strong>",
        choices: [
          {
            text: "Débrancher immédiatement l'alimentation du laptop pour préserver l'état du disque.",
            ok: false, pts: -30,
            fb: "Erreur catastrophique sur Tails. Tails est amnésique : à l'extinction, la RAM est effacée et aucune persistance n'existe sur le disque (sauf si Persistent Volume activé, déchiffré en RAM). Couper = tout détruire.",
            legal: "Manuel Ch. 11.1 — Tails exige une capture RAM préalable obligatoire. Jamais d'extinction brutale.",
            critical: true, next: "end",
          },
          {
            text: "(1) Photographier l'écran et le carnet. (2) Lancer immédiatement un dump RAM via clé USB (WinPmem/LiME). (3) Ne rien fermer ni éteindre. (4) Ne pas retirer le YubiKey.",
            ok: true, pts: 25,
            fb: "Séquence correcte. Tails = RAM only = dump RAM critique. Ne pas éteindre. Ne pas retirer le YubiKey (il peut déverrouiller des conteneurs). Carnet = peut contenir des seed phrases de wallets cold.",
            legal: "Manuel Ch. 11.1 + bonnes pratiques OFCS — Perquisition d'un environnement live : RAM first, photographier, ne jamais désactiver.",
            critical: false, next: 1,
          },
          {
            text: "Demander immédiatement au suspect son mot de passe Tails pour sécuriser la procédure.",
            ok: false, pts: -15,
            fb: "Possible mais problématique. Le suspect peut invoquer le nemo tenetur (Art. 113 CPP). De plus, cela n'empêche pas la dégradation de la RAM si vous attendez avant le dump. Priorité : action technique, pas interaction humaine.",
            legal: "Art. 113 CPP — Droit au silence. La contrainte directe à déverrouiller est contestable.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "₿ Les portefeuilles crypto",
        situation: "Le dump RAM est réussi. Volatility identifie : <strong>2 hot wallets</strong> Bitcoin Core et Electrum actifs en mémoire (avec clés privées en clair). Le carnet manuscrit contient 24 mots suspects écrits en colonne — <strong>probable seed phrase BIP-39</strong> pour un cold wallet. Le YubiKey protège probablement un deuxième cold wallet.",
        law: "<strong>Art. 263 CPP</strong> — Séquestre de valeurs patrimoniales.<br><strong>BIP-39</strong> — 12/24 mots permettent de reconstituer n'importe quel wallet compatible.",
        question: "<strong>Comment procédez-vous à la saisie des wallets ?</strong>",
        choices: [
          {
            text: "Extraire toutes les clés privées identifiées et transférer immédiatement les fonds vers un wallet fedpol sécurisé pour éviter le vol par un complice.",
            ok: false, pts: -20,
            fb: "Erreur procédurale grave. Le transfert sans décision du MP peut constituer un détournement. Le séquestre se fait en documentant les clés et en bloquant les transferts — pas en transférant soi-même.",
            legal: "Art. 263 CPP — Le séquestre n'autorise pas le transfert de fonds, seulement leur blocage et documentation.",
            critical: true, next: "end",
          },
          {
            text: "(1) Documenter chaque wallet identifié (adresse + clé privée) avec hash. (2) Photographier le carnet (seed phrase). (3) Saisir physiquement le YubiKey sous scellés. (4) Demander ordonnance de séquestre au MP pour blocage des adresses via exchanges centralisés.",
            ok: true, pts: 25,
            fb: "Procédure correcte. Documentation forensique + scellés physiques + séquestre judiciaire via MP. Les exchanges reçoivent ensuite les adresses à bloquer. Chaîne de custody préservée, pas d'action unilatérale sur les fonds.",
            legal: "Art. 263 CPP + Guide fedpol cryptomonnaies — Documentation + scellés + séquestre MP.",
            critical: false, next: 2,
          },
          {
            text: "Laisser les wallets en place et revenir avec un expert crypto plus tard.",
            ok: false, pts: -25,
            fb: "Impossible. La session Tails sera perdue dès qu'elle s'éteint (écran de veille, coupure électrique). Les clés privées présentes en RAM disparaîtront. Revenir « plus tard » = tout perdre.",
            legal: "Manuel Ch. 11.1 — Les preuves volatiles exigent une action immédiate, pas différée.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "⚖️ Les scellés",
        situation: "L'analyse terminée, le suspect invoque <strong>Art. 248 CPP</strong> et demande la mise sous scellés de tous les dispositifs numériques. Il désigne précisément : le laptop Tails, le smartphone GrapheneOS, le YubiKey, <em>et le carnet manuscrit</em> (qu'il qualifie de « journal intime »).",
        law: "<strong>Art. 248 CPP</strong> — Scellés : suspension de l'analyse, pas de la saisie.<br><strong>TF 1B_602/2020</strong> — Désignation précise = tri préalable obligatoire.",
        question: "<strong>Comment répondez-vous à la demande de scellés, notamment sur le carnet ?</strong>",
        choices: [
          {
            text: "Refuser les scellés sur le carnet — une seed phrase BIP-39 n'est pas un « journal intime ».",
            ok: false, pts: -10,
            fb: "Position à nuancer. Vous ne pouvez pas refuser la demande de scellés — c'est le TMC qui tranche. Mais vous pouvez argumenter devant lui que le contenu n'est pas un journal intime mais un outil technique d'accès à des avoirs patrimoniaux.",
            legal: "Art. 248 CPP — La décision sur la levée des scellés appartient exclusivement au TMC.",
            critical: false, next: "end",
          },
          {
            text: "Accepter la mise sous scellés de tous les éléments, documenter l'état actuel (photos, hash RAM dump, hash des disques images), et préparer une argumentation détaillée pour le TMC sur la levée partielle.",
            ok: true, pts: 20,
            fb: "Approche correcte. Les scellés sont acceptés (suspension de l'analyse). La documentation pré-scellés est validée par hash. Devant le TMC, on défend la levée ciblée : carnet = objet patrimonial lié à l'enquête, pas sphère privée intime.",
            legal: "Art. 248 CPP + TF 1B_602/2020 — Acceptation des scellés + argumentation structurée devant TMC.",
            critical: false, next: "end",
          },
          {
            text: "Refuser totalement les scellés — la perquisition était régulière, il n'y a rien à contester.",
            ok: false, pts: -20,
            fb: "Faux. L'art. 248 CPP est un droit procédural du propriétaire, indépendant de la régularité de la saisie. Refuser les scellés est une violation procédurale qui peut invalider toute la perquisition.",
            legal: "Art. 248 CPP — Droit fondamental, non subordonné à la régularité de l'opération.",
            critical: true, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 85 && custodyPct >= 75) return { icon: "🕵", title: "Expert Perquisition Darknet", sub: "Maîtrise avancée des interventions techno-criminelles" };
      if (pct >= 65) return { icon: "🚪", title: "Intervenant Spécialisé", sub: "Bonnes bases en live forensics et crypto" };
      return { icon: "📚", title: "Formation requise", sub: "Révisez le guide fedpol cryptomonnaies + Op. Darkmarket" };
    },
  },

  /* ══════════════════════════════════════════════════
     23. UNINE_2022 — Université de Neuchâtel  [HARD]
     Ransomware Conti, 17 février 2022 — 800 machines Windows touchées
  ══════════════════════════════════════════════════ */
  {
    id: "unine_2022",
    title: "Conti frappe l'Université",
    icon: "🎓",
    difficulty: "hard",
    atmosphere: "ransomware",
    realCase: "Université de Neuchâtel, 17 février 2022 — Ransomware Conti. ~800 machines Windows touchées (80-90% du parc). Vecteur probable : VPN avec matériel privé en télétravail. 26 Go de données publiés sur le darknet fin février (salaires, photos étudiants, données médicales AI, contrats Fedpol/DDPS/Syngenta). Fuite étendue au-delà du campus (cantons, Confédération).",
    tags: ["WINDOWS", "DROIT"],
    legalRefs: ["LPD (ancienne → LPD 2023)", "Art. 144bis CP", "Manuel Ch. 11.1", "Rapport Le Temps mars 2022"],
    intro: "17 février 2022, 22h50. Les services informatiques de l'Université de Neuchâtel reçoivent les premières alertes : des fichiers sont chiffrés un à un. La rentrée du printemps a lieu dans 72h. 800 ordinateurs sont potentiellement touchés. L'équipe IT doit arbitrer : préserver ou restaurer ?",
    alertLevel: "INCIDENT CRITIQUE — Rentrée académique dans 72h",
    objectives: [
      { icon: "🚨", text: "Arbitrer l'urgence opérationnelle vs la préservation forensique" },
      { icon: "🔍", text: "Identifier le vecteur (VPN privé en télétravail)" },
      { icon: "📣", text: "Gérer la communication quand les données débarquent sur le darknet" },
    ],
    debrief: "<p>L'attaque de l'Université de Neuchâtel illustre un piège classique : le <strong>travail hybride</strong> a forcé les institutions à ouvrir leurs réseaux à des équipements personnels mal sécurisés. Le VPN, conçu comme une solution, est devenu le vecteur principal d'intrusion.</p><p>Le deuxième enseignement est la <strong>portée systémique</strong> de la fuite : les données publiées contenaient des contrats Fedpol, DDPS, Syngenta. Une université n'est pas qu'un campus — c'est un nœud de données sensibles qui dépasse largement sa mission académique.</p>",
    narrative: {
      success: "La segmentation rapide du réseau limite Conti à ~100 machines sur les 800. La capture forensique pré-extinction permet d'identifier le vecteur VPN. Le PFPDT est notifié dans les 24h. Quand les données débarquent sur le darknet fin février, la communication honnête (étendue + tiers concernés) préserve la crédibilité de l'institution.",
      degraded: "La restauration a lieu mais certaines preuves sont perdues. Les données sont publiées. La communication tardive laisse des traces dans la presse.",
      failure: "Extinction massive sans capture = vecteur inconnu. Restauration depuis backups infectés = réinfection. Publication darknet + révélation des contrats Fedpol/DDPS = crise politique nationale. L'affaire Le Temps (mars 2022) devient un cas d'école de mauvaise gestion."
    },
    steps: [
      {
        phase: "🚨 La vague de chiffrement",
        situation: "23h15. Le SOC reçoit 47 alertes en 8 minutes depuis des postes physiques du campus. Les logs montrent des connexions <strong>depuis des VPN personnels</strong> vers des partages SMB internes. L'équipe IT veut éteindre tous les postes touchés immédiatement pour stopper la propagation.",
        law: "<strong>Manuel Ch. 11.1</strong> — Capture forensique avant toute remédiation massive.<br><strong>GovCERT Guide ransomware</strong> — Segmentation > extinction brutale.",
        question: "<strong>Quelle action prenez-vous en priorité ?</strong>",
        choices: [
          {
            text: "Éteindre immédiatement tous les postes du campus pour stopper la propagation.",
            ok: false, pts: -25,
            fb: "Erreur. L'extinction massive détruit les preuves volatiles (RAM, connexions actives) sur les machines potentiellement saines. Vous perdez la visibilité sur le vecteur d'intrusion — ici, le VPN personnel. Sans vecteur identifié, la restauration propre est impossible.",
            legal: "Manuel Ch. 11.1 — Préserver les preuves avant toute action de masse. La panique est le meilleur ami du ransomware.",
            critical: true, next: "end",
          },
          {
            text: "(1) Isoler le VLAN affecté au niveau firewall (segmentation). (2) Bloquer immédiatement tous les accès VPN. (3) Lancer une capture RAM sur 3-5 machines représentatives avant tout arrêt. (4) Communiquer aux utilisateurs d'éteindre leurs postes <em>personnels</em> et de ne pas se reconnecter.",
            ok: true, pts: 25,
            fb: "Approche correcte. Segmentation = coupe la propagation sans détruire les preuves. Blocage VPN = stoppe l'afflux. Captures ciblées = échantillonnage forensique suffisant. Instruction aux utilisateurs = coupe le vecteur à la source.",
            legal: "GovCERT recommandations 2022 — Segmentation + capture ciblée + communication claire aux utilisateurs en télétravail.",
            critical: false, next: 1,
          },
          {
            text: "Négocier avec Conti pour gagner du temps avant la rentrée.",
            ok: false, pts: -30,
            fb: "Erreur grave. Négocier avant même de comprendre l'étendue = donner l'initiative aux attaquants. De plus, Conti (groupe russophone) est sur plusieurs listes de sanctions — payer exposerait à une sanction SECO en plus du préjudice.",
            legal: "GovCERT + SECO — Pas de négociation avec groupes sanctionnés, même pour urgence opérationnelle.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🔍 Le vecteur identifié",
        situation: "La capture RAM de 3 machines révèle le vecteur : un <strong>VPN configuré sur un ordinateur personnel</strong> d'un enseignant, compromis par un malware Emotet déposé via phishing. Le vecteur touche potentiellement tous les 400+ enseignants/chercheurs qui utilisent le VPN avec leur matériel privé. Le rectorat demande si l'on peut garantir que la rentrée aura lieu dans 72h.",
        law: "<strong>LPD (ancienne)</strong> — Obligation de mesures techniques appropriées.<br><strong>Art. 182 CPP</strong> — L'expert forensique ne surestime pas ses capacités.",
        question: "<strong>Quelle réponse donnez-vous au rectorat ?</strong>",
        choices: [
          {
            text: "« Oui, nous aurons tout restauré pour lundi. »",
            ok: false, pts: -20,
            fb: "Promesse imprudente. Reconstruire un Active Directory + vérifier 800 machines en 72h sans retomber dans une réinfection par un VPN personnel non audité est techniquement impossible. Une promesse non tenue casse la confiance.",
            legal: "Art. 182 CPP — L'expert formule des constats techniques, pas des promesses commerciales.",
            critical: false, next: "end",
          },
          {
            text: "« L'enseignement à distance continue normalement. Les services critiques (emails, visio) seront rétablis pour lundi sur infrastructure isolée. Le parc Windows nécessitera 10-14 jours supplémentaires. Les VPN personnels sont désormais interdits — seul le matériel institutionnel est autorisé. »",
            ok: true, pts: 25,
            fb: "Réponse correcte. Elle priorise ce qui est tenable (à distance + services critiques), annonce honnêtement le délai réaliste (10-14 jours pour 800 machines), et tire les leçons du vecteur (fin des VPN privés). C'est exactement la position adoptée par l'UniNE en 2022.",
            legal: "Retour d'expérience UniNE 2022 — La reprise en phases annoncée honnêtement protège la crédibilité de l'institution.",
            critical: false, next: 2,
          },
          {
            text: "« Nous ne pouvons pas rouvrir — tout est à l'arrêt indéfiniment. »",
            ok: false, pts: -15,
            fb: "Trop défaitiste. L'enseignement à distance reste fonctionnel. Les services critiques peuvent être remontés en isolation. Annoncer un « arrêt indéfini » dramatise inutilement et nuit à la mission de l'institution.",
            legal: "Art. 182 CPP — L'expertise doit être pondérée : ni optimiste, ni catastrophiste.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "📣 Les données sur le darknet",
        situation: "Fin février. Conti publie <strong>26 Go de données</strong> sur son leak site — 5% du volume exfiltré selon eux. Parmi les fichiers : salaires d'employés, données médicales AI, photos d'étudiants, contrats avec le DDPS, Fedpol et Syngenta, rondes des agents de sécurité du campus. Le canton, la Confédération et des multinationales sont concernés au-delà de l'université. La presse (Le Temps) a les fichiers.",
        law: "<strong>LPD (ancienne → LPD 2023)</strong> — Notification des personnes concernées en cas de risque élevé.<br><strong>Art. 86 Loi militaire</strong> — Les contrats DDPS/Fedpol ont un régime de protection spécifique.",
        question: "<strong>Quelle stratégie de communication adoptez-vous ?</strong>",
        choices: [
          {
            text: "Minimiser : « Une partie mineure de données administratives a été concernée. »",
            ok: false, pts: -30,
            fb: "Mensonge qui se retourne dans les 48h. Le Temps a les fichiers. Minimiser crée un effet amplificateur catastrophique quand la presse révèle l'ampleur réelle. C'est l'erreur classique que l'UniNE a évitée en 2022.",
            legal: "LPD 2023 Art. 24 — Minimisation fautive = sanction PFPDT aggravée.",
            critical: true, next: "end",
          },
          {
            text: "Communiqué public détaillé : inventaire précis des catégories publiées, notification directe aux personnes concernées (employés + étudiants + partenaires externes Fedpol/DDPS/Syngenta), transparence totale sur le vecteur (VPN personnel) et les mesures prises.",
            ok: true, pts: 25,
            fb: "Correct. Transparence complète + notification aux tiers = seule stratégie qui préserve la crédibilité quand la presse a déjà les faits. Les institutions qui minimisent en 2022 ont toutes été humiliées publiquement ; celles qui ont été transparentes ont gardé leur autorité morale.",
            legal: "Retour d'expérience LPD 2023 — La transparence précoce réduit l'impact réputationnel de 60-80%.",
            critical: false, next: "end",
          },
          {
            text: "Nier publiquement puis publier une rectification discrète dans 15 jours.",
            ok: false, pts: -25,
            fb: "Double erreur : le déni public crée une perte de crédibilité immédiate ; la rectification discrète est ignorée médiatiquement. Combinaison pire que l'une ou l'autre isolément.",
            legal: "Art. 251 CP — Le déni fautif dans une communication officielle engage la responsabilité.",
            critical: true, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 85 && custodyPct >= 75) return { icon: "🎓", title: "Expert Réponse Académique", sub: "Maîtrise parfaite de la gestion d'incident universitaire" };
      if (pct >= 65) return { icon: "🏫", title: "Analyste EDU", sub: "Bonnes bases sur les incidents en milieu académique" };
      return { icon: "📚", title: "Formation requise", sub: "Révisez le dossier UniNE 2022 et rapport Le Temps" };
    },
  },

  /* ══════════════════════════════════════════════════
     24. SWISSCOM_2018 — Fuite 800k clients  [MEDIUM]
     Vol via sous-traitant tunisien, annoncée en février 2018
  ══════════════════════════════════════════════════ */
  {
    id: "swisscom_2018",
    title: "La Fuite du Sous-Traitant",
    icon: "📡",
    difficulty: "medium",
    atmosphere: "legal",
    realCase: "Swisscom, automne 2017 (annoncée février 2018) — Vol des données de 812'000 clients privés + 75'000 clients d'affaires. Nom, prénom, adresse, date de naissance, numéro de téléphone. Vecteur : une société de marketing genevoise avait transmis l'accès à un sous-traitant en Tunisie, où le login a été compromis. Swisscom initialement réticent à communiquer publiquement (décision forcée par le PFPDT).",
    tags: ["DROIT", "RÉSEAUX"],
    legalRefs: ["LPD 2023 Art. 24", "LPD 2023 Art. 9 (sous-traitance)", "Art. 143 CP", "Rapport PFPDT 2018"],
    intro: "Octobre 2017. Swisscom découvre le vol des données de 800'000+ clients via l'accès compromis d'un partenaire commercial. Le vol remonte à l'été. Le Conseil d'administration hésite : faut-il communiquer publiquement ? Le PFPDT a son mot à dire.",
    alertLevel: "FUITE MASSIVE — 800'000+ clients concernés, communication en débat",
    objectives: [
      { icon: "🔗", text: "Reconstituer la chaîne de sous-traitance (CH → Genève → Tunisie)" },
      { icon: "⚖️", text: "Arbitrer la question de la communication publique (PFPDT + image)" },
      { icon: "🛡", text: "Qualifier correctement la « sensibilité » des données volées" },
    ],
    debrief: "<p>L'affaire Swisscom 2018 reste un cas d'école sur deux dimensions : la <strong>responsabilité en cascade de sous-traitance</strong>, et le <strong>rôle arbitral du PFPDT</strong>.</p><p>Swisscom avait initialement choisi de ne pas communiquer, qualifiant les données de « non sensibles » (une qualification juridique contestée par tous les experts depuis). Le PFPDT Adrian Lobsiger a exigé la communication publique, conformément au devoir légal d'information. La LPD 2023 a depuis intégré explicitement l'obligation de notification rapide — l'affaire Swisscom a été un des déclencheurs de cette réforme.</p>",
    narrative: {
      success: "La communication rapide après notification PFPDT est saluée. Les 812'000 clients privés sont notifiés via SMS (info au 444). Les mesures techniques (2FA, alertes, limitation volume) sont imposées à tous les partenaires. La confiance envers Swisscom est ébréchée mais pas détruite.",
      degraded: "La communication arrive mais avec réticence visible. La qualification « non sensible » crée une controverse médiatique qui dure des mois.",
      failure: "Décision unilatérale de ne pas communiquer. Fuite révélée par la presse. Procédure PFPDT ouverte d'office. L'affaire devient un scandale national, accélérant la réforme LPD 2023 — à vos dépens."
    },
    steps: [
      {
        phase: "🔗 Reconstituer la chaîne",
        situation: "Votre analyse technique révèle la cascade :<br><br><div style='background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem;font-size:.78rem;line-height:1.8'>① <strong>Swisscom</strong> octroie un accès à la base clients à une société de marketing.<br>② La société marketing, basée à <strong>Genève</strong>, transmet l'accès à un <strong>sous-traitant en Tunisie</strong> pour du télémarketing low-cost.<br>③ Le login tunisien est compromis (phishing ou malware).<br>④ L'attaquant utilise une <strong>IP française</strong> pour siphonner la base entre août et octobre 2017.</div>",
        law: "<strong>LPD 2023 Art. 9</strong> — Sous-traitance : le responsable reste garant, même en cascade. Contrat obligatoire à chaque niveau.<br><strong>Swisscom interne</strong> — Politique « données traitées en Suisse uniquement ».",
        question: "<strong>Quelle est votre analyse de la responsabilité dans votre rapport ?</strong>",
        choices: [
          {
            text: "Responsabilité exclusive du sous-traitant tunisien — c'est là que le login a été compromis.",
            ok: false, pts: -20,
            fb: "Analyse juridiquement fausse. La LPD place le responsable du traitement (Swisscom) comme garant de la chaîne entière. Le sous-traitant tunisien a exécuté, mais l'autorisation de la chaîne Genève→Tunisie a été donnée par Swisscom (qui savait, selon les documents révélés par la loi sur la transparence en 2021).",
            legal: "LPD Art. 10a (ancienne) / Art. 9 (2023) — Responsabilité du responsable sur toute la chaîne de traitement.",
            critical: false, next: "end",
          },
          {
            text: "Responsabilité en cascade : Swisscom (responsable principal de la chaîne autorisée), société genevoise (sous-traitant direct, transmission non autorisée contractuellement ?), sous-traitant tunisien (exécutant immédiat de la compromission).",
            ok: true, pts: 25,
            fb: "Analyse correcte. Les trois niveaux ont une responsabilité propre. Le rapport doit les distinguer clairement : Swisscom pour la politique contractuelle, Genève pour la transmission effective, Tunis pour la compromission. Le PFPDT doit pouvoir identifier la chaîne complète.",
            legal: "LPD 2023 Art. 9 + Rapport PFPDT 2018 — Responsabilité en cascade, pas exclusive.",
            critical: false, next: 1,
          },
          {
            text: "Responsabilité exclusive de Swisscom — c'est eux qui ont donné l'accès initial.",
            ok: false, pts: -10,
            fb: "Simplification excessive. Swisscom a effectivement autorisé la chaîne, mais les deux maillons suivants ont leurs propres manquements (audit du sous-traitant, mesures de sécurité techniques, stockage des accès). Le rapport forensique doit refléter la complexité.",
            legal: "LPD 2023 — Responsabilité du responsable ≠ exonération des sous-traitants.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "⚖️ La question de la communication",
        situation: "Le Conseil d'administration de Swisscom vous consulte. Position initiale du CA : <strong>ne pas communiquer publiquement</strong>, qualifier les données de « non sensibles » selon la LPD (nom, prénom, adresse, date de naissance, téléphone) et prendre des mesures techniques discrètes. Le PFPDT, consulté, voudrait être rassuré sur l'information aux clients.",
        law: "<strong>LPD (ancienne)</strong> — Notification PFPDT si risque élevé ; notification aux personnes concernées si protection nécessaire.<br><strong>LPD 2023</strong> — Notification obligatoire dans les meilleurs délais.",
        question: "<strong>Quel conseil donnez-vous au Conseil d'administration ?</strong>",
        choices: [
          {
            text: "Ne pas communiquer publiquement. Les données sont techniquement « non sensibles » au sens de la loi. Mesures techniques + silence préservent la réputation.",
            ok: false, pts: -25,
            fb: "Conseil dangereux. « Non sensible » juridiquement ≠ « sans risque ». Ces données permettent le social engineering ciblé (se faire passer pour Swisscom au téléphone, phishing personnalisé). Et surtout : quand le PFPDT sera informé, il forcera la communication — autant la faire volontairement.",
            legal: "Réalité 2018 — C'est exactement ce que Swisscom voulait faire. Le PFPDT les a forcés à communiquer. La réputation a souffert bien plus de la perception d'opacité que des données elles-mêmes.",
            critical: true, next: "end",
          },
          {
            text: "Communication publique complète : conférence de presse, notification des 812'000 clients privés via SMS (service au 444), inventaire précis des données, description des mesures prises (2FA pour partenaires, limitation volume, alertes automatiques).",
            ok: true, pts: 25,
            fb: "Position qui a finalement été adoptée par Swisscom en février 2018 (sous pression PFPDT). Le SMS au 444 « Info » a permis à chaque client de vérifier s'il était concerné. La stratégie a limité le dommage réputationnel — imparfaite mais correcte.",
            legal: "LPD 2023 Art. 24 + précédent Swisscom 2018 — Transparence rapide + outil de vérification individuel = standard.",
            critical: false, next: 2,
          },
          {
            text: "Communication partielle : communiqué technique vague sans mention du sous-traitant tunisien, « pour ne pas compliquer l'enquête ».",
            ok: false, pts: -15,
            fb: "Stratégie qui éclate tôt ou tard. En 2021, la loi sur la transparence a révélé l'existence du sous-traitant tunisien — occulté en 2018. La révélation a généré un second scandale, trois ans après. Mieux vaut tout dire au départ.",
            legal: "Loi sur la transparence (LTrans) — Les omissions dans les communications initiales finissent par être révélées.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "📡", title: "Expert Sous-Traitance", sub: "Maîtrise parfaite de la responsabilité en cascade" };
      if (pct >= 60) return { icon: "🔗", title: "Analyste Partenariats", sub: "Bonnes bases sur la chaîne de responsabilité" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez le cas Swisscom 2018 et LPD 2023 Art. 9" };
    },
  },

  /* ══════════════════════════════════════════════════
     25. SWISSPORT_2022 — BlackCat à Zurich  [MEDIUM]
     Ransomware BlackCat/ALPHV, 3 février 2022 — aéroport de Zurich
  ══════════════════════════════════════════════════ */
  {
    id: "swissport_2022",
    title: "BlackCat à l'Aéroport",
    icon: "✈️",
    difficulty: "medium",
    atmosphere: "ransomware",
    realCase: "Swissport, 3 février 2022 — Ransomware BlackCat/ALPHV (premier ransomware codé en Rust). Attaque contenue en 48h via infrastructures air-gapped et fallback manuel. 22 vols retardés à Zurich (3-20 min). 1,6 To revendiqués exfiltrés, publiés sur le leak site BlackCat (passeports, candidatures, documents internes).",
    tags: ["FORENSIQUE", "WINDOWS"],
    legalRefs: ["Manuel Ch. 11.1", "LPD (ancienne)", "Ordonnance Aviation", "ICAO Security Manual"],
    intro: "3 février 2022, 6h00. L'aéroport de Zurich entre dans sa pointe matinale. Swissport, opérateur des services au sol (check-in, bagages, ravitaillement), détecte un ransomware sur son infrastructure IT globale. 310 aéroports dans 50 pays dépendent de ces systèmes. Les fallbacks manuels doivent tenir.",
    alertLevel: "INFRASTRUCTURE AÉRONAUTIQUE — Fallback manuel critique",
    objectives: [
      { icon: "🎯", text: "Arbitrer le maintien opérationnel vs la capture forensique" },
      { icon: "🛡", text: "Valider l'efficacité des air-gapped backups" },
      { icon: "📢", text: "Communiquer aux passagers + compagnies aériennes clients" },
    ],
    debrief: "<p>L'affaire Swissport 2022 a été un cas d'école de <strong>réponse réussie</strong> à un ransomware : contenu en 48h, 22 vols retardés seulement, reprise des opérations via fallback manuel et air-gapped backups. Swissport a refusé de payer, illustrant qu'une préparation sérieuse (backups isolés, procédures dégradées) rend le refus crédible.</p><p>BlackCat (aussi ALPHV, Noberus) était à l'époque remarquable pour être le <strong>premier ransomware codé en Rust</strong>, ce qui compliquait significativement l'analyse forensique classique. Les 1,6 To publiés sur leur leak site ont néanmoins été un coût réputationnel réel — même sans paiement, la <em>double extorsion</em> fait mal.</p>",
    narrative: {
      success: "Le fallback manuel tient. 22 vols retardés de 3-20 minutes à Zurich, rien de plus. Les backups air-gapped permettent une restauration propre en 48h. Le refus du paiement tient, malgré la publication de 1,6 To sur le leak site BlackCat. Case study interne devenue référence chez les opérateurs aéroportuaires européens.",
      degraded: "Le fallback tient partiellement. Des retards importants sur 2-3 jours. Image commerciale entamée mais opérations préservées.",
      failure: "Pas de fallback efficace. Chaos sur 72h aux 310 aéroports. Compagnies aériennes clients résilient leurs contrats. Le paiement finit par être fait en urgence — Swissport finit devant la SECO pour paiement à un groupe listé."
    },
    steps: [
      {
        phase: "✈️ L'alerte à 6h du matin",
        situation: "Le SOC détecte le chiffrement. Les systèmes de check-in, de planning et de gestion bagages sont touchés sur <strong>une partie de l'infrastructure mondiale</strong>. Les opérations physiques (tapis bagages, agents de piste) sont techniquement indépendantes. 22 vols décolleront dans les 90 minutes. Le directeur opérations veut activer immédiatement les procédures manuelles.",
        law: "<strong>Manuel Ch. 11.1</strong> — Capture forensique préalable obligatoire.<br><strong>ICAO Security</strong> — Continuité opérationnelle prioritaire pour sécurité aviation.",
        question: "<strong>Comment conciliez-vous forensique et continuité opérationnelle ?</strong>",
        choices: [
          {
            text: "Tout arrêter pour capture forensique complète. Les vols attendront.",
            ok: false, pts: -30,
            fb: "Erreur catastrophique en contexte aéronautique. Chaque heure de blocage à Zurich = des centaines de vols affectés en cascade sur l'Europe. La forensique doit s'adapter au contexte critique, pas l'inverse.",
            legal: "ICAO Security Manual — Priorité absolue à la sécurité et continuité des opérations aériennes.",
            critical: true, next: "end",
          },
          {
            text: "(1) Activer immédiatement les fallback manuels (check-in papier, tableaux physiques). (2) Capturer en parallèle la RAM + images disque d'un échantillon représentatif (3-5 serveurs) pendant que les autres continuent de servir en mode dégradé. (3) Isoler progressivement les systèmes touchés pour restauration depuis backups air-gapped.",
            ok: true, pts: 25,
            fb: "Approche correcte, exactement celle adoptée par Swissport en 2022. Continuité opérationnelle via fallback manuel + forensique ciblée sur échantillon + isolation progressive. 22 vols retardés de 3-20 min seulement au final.",
            legal: "Retour d'expérience Swissport 2022 — Fallback + échantillonnage forensique + isolation progressive = modèle pour opérations critiques.",
            critical: false, next: 1,
          },
          {
            text: "Payer discrètement la rançon pour restaurer rapidement — les enjeux opérationnels justifient le paiement.",
            ok: false, pts: -30,
            fb: "Erreur double. (1) Le paiement ne garantit rien et prend 12-48h de négociation. (2) Swissport a démontré qu'avec des air-gapped backups, le paiement est inutile. (3) Payer BlackCat (présumé lié à DarkSide/Colonial Pipeline) = risque SECO.",
            legal: "GovCERT + SECO — Le paiement n'est ni rapide, ni fiable, ni légal pour groupes listés.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🛡 Les backups air-gapped",
        situation: "La capture forensique confirme : <strong>BlackCat/ALPHV</strong>, codé en Rust (premier ransomware dans ce langage — complexité forensique accrue). L'infection est propagée via Active Directory. L'équipe IT propose de restaurer depuis les backups air-gapped datant de 18h la veille. Le CISO hésite : est-on sûr que les backups ne sont pas compromis ?",
        law: "<strong>Manuel Ch. 24.3</strong> — Vérification backup avant restauration sur système potentiellement compromis.<br><strong>Principe air-gap</strong> — Isolation physique = protection contre propagation.",
        question: "<strong>Quelle séquence de validation des backups adoptez-vous ?</strong>",
        choices: [
          {
            text: "Restaurer directement les backups — ils étaient déconnectés physiquement, donc intacts par définition.",
            ok: false, pts: -15,
            fb: "Raccourci dangereux. Les backups air-gapped protègent contre le chiffrement en live, mais pas contre un malware qui y aurait été <em>déjà présent</em> au moment du dernier backup (dormant, pas encore activé). Une vérification préalable hors-ligne est obligatoire.",
            legal: "Manuel Ch. 24.3 — Restauration = vérification préalable dans un environnement isolé.",
            critical: false, next: "end",
          },
          {
            text: "(1) Monter les backups sur un environnement isolé (sandbox air-gap). (2) Scanner avec indicateurs BlackCat (hashes, YARA rules disponibles). (3) Vérifier l'intégrité de l'AD backup (comptes suspects, persistance). (4) Si clean : restaurer sur infrastructure propre ; sinon : utiliser un backup antérieur.",
            ok: true, pts: 25,
            fb: "Séquence correcte. Sandbox isolé = test sans risque. YARA rules BlackCat publiques depuis novembre 2021 = détection possible. Vérification AD = cruciale pour ransomware modernes. Si compromis : revenir à un backup antérieur, même si plus ancien.",
            legal: "GovCERT Guide ransomware 2022 + Manuel Ch. 24.3 — Validation backup en sandbox obligatoire avant restauration.",
            critical: false, next: "end",
          },
          {
            text: "Reconstruire tout de zéro sans restaurer — c'est plus sûr mais prendra 3 semaines.",
            ok: false, pts: -10,
            fb: "Conservateur à l'excès. 3 semaines d'impact opérationnel pour éviter une vérification qui prend 2-4h. Le coût opérationnel du choix est disproportionné alors que les outils de validation existent.",
            legal: "Principe de proportionnalité opérationnelle — La prudence ne justifie pas des délais disproportionnés.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "✈️", title: "Expert Aviation Resilience", sub: "Maîtrise parfaite des incidents en infrastructure aéronautique" };
      if (pct >= 60) return { icon: "🛫", title: "Analyste Infrastructure Critique", sub: "Bonnes bases en continuité opérationnelle" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez le dossier Swissport 2022 et principes air-gap" };
    },
  },

  /* ══════════════════════════════════════════════════
     26. NONAME_2023 — Hacktivisme Étatique  [MEDIUM]
     NoName057 — DDoS pro-russes contre la Suisse, juin 2023
  ══════════════════════════════════════════════════ */
  {
    id: "noname_2023",
    title: "Vague Pro-Russe sur la Suisse",
    icon: "💥",
    difficulty: "medium",
    atmosphere: "state",
    realCase: "NoName057, juin 2023 — Vague coordonnée d'attaques DDoS contre l'administration suisse durant le discours vidéo de Volodymyr Zelensky au Parlement (15 juin). Cibles : Parlement, Armée suisse, La Poste, aéroport de Genève, aéroport de Berne, Südostbahn, administration fédérale. Revendication publique par NoName sur Telegram.",
    tags: ["RÉSEAUX", "DROIT"],
    legalRefs: ["Art. 144bis CP (entrave)", "Ordonnance OFCS", "Rapport OFCS 2023", "Sanctions SECO Russie"],
    intro: "15 juin 2023, 13h45. Zelensky doit s'adresser au Parlement suisse par vidéo à 14h. Depuis 48h, NoName057 a revendiqué des DDoS contre plusieurs sites d'administration fédérale. L'OFCS vous mandate pour coordonner la réponse. Les mesures prises dans les 15 prochaines minutes détermineront si le discours aura lieu normalement.",
    alertLevel: "ATTAQUE ÉTATIQUE COORDONNÉE — Timing politique, pression temps critique",
    objectives: [
      { icon: "📡", text: "Mitiger les DDoS en temps réel sans couper l'accès légitime" },
      { icon: "🎯", text: "Caractériser le profil de l'attaquant (hacktivisme, APT, ou hybride ?)" },
      { icon: "🇨🇭", text: "Coordonner la réponse entre acteurs fédéraux, cantonaux et privés" },
    ],
    debrief: "<p>Les vagues d'attaques NoName057 en 2023 illustrent le <strong>hacktivisme étatique</strong> : DDoS à motivation politique, revendiqués publiquement, ciblant des symboles démocratiques (parlement, administration). L'objectif, comme l'a dit Stéphane Duguin (CyberPeace Institute), est de <em>« diminuer la confiance dans les institutions étatiques »</em>, par petites doses.</p><p>La réponse technique (CDN, anti-DDoS, filtrage géographique) est connue. La difficulté est <strong>politique</strong> : rester fonctionnel pendant un discours symbolique comme celui de Zelensky sans couper l'accès citoyen aux services publics.</p>",
    narrative: {
      success: "Le discours de Zelensky se déroule normalement. Les mitigations CDN absorbent les vagues DDoS. Le OFCS coordonne en temps réel avec les cantons et les opérateurs critiques. L'attaque révèle des faiblesses d'architecture qui deviennent un programme de renforcement en 2024. NoName revendique mais ne parvient pas à entraver réellement.",
      degraded: "Le discours a lieu mais avec des services publics indisponibles par intermittence. Impact symbolique réel — NoName publie des captures d'écran d'erreur.",
      failure: "Saturation massive. Le discours Zelensky est partiellement coupé. Plusieurs services fédéraux sont indisponibles durant 4-6h. NoName057 célèbre publiquement sur Telegram. La presse internationale amplifie. Cause politique réelle : perte de confiance dans la capacité de la Confédération à protéger l'accès numérique aux institutions."
    },
    steps: [
      {
        phase: "📡 Mitigation d'urgence",
        situation: "13h47. Les premiers pics DDoS arrivent. <strong>Plusieurs dizaines de milliers de requêtes/seconde</strong> depuis botnets distribués. L'IP source principale est russe, mais 60% du trafic provient de botnets mondiaux (IoT compromis). Le OFCS doit choisir une stratégie de mitigation immédiate.",
        law: "<strong>Art. 144bis CP</strong> — L'entrave au bon fonctionnement d'un système est pénalement réprimée.<br><strong>Ordonnance OFCS</strong> — Coordination fédérale pour infrastructures critiques.",
        question: "<strong>Quelle stratégie de mitigation activez-vous ?</strong>",
        choices: [
          {
            text: "Blocage géographique : couper tout le trafic depuis la Russie et les pays associés.",
            ok: false, pts: -20,
            fb: "Inefficace techniquement (60% du trafic vient de botnets mondiaux, pas de Russie) et problématique politiquement (blocage géographique d'un État est un acte qui peut être vu comme hostile). De plus, des citoyens/journalistes russes peuvent avoir un besoin légitime d'accès.",
            legal: "Principe de proportionnalité — Le blocage géographique massif est rarement proportionnel à la menace DDoS.",
            critical: false, next: "end",
          },
          {
            text: "Activation de la protection CDN anti-DDoS (Cloudflare/Akamai) avec challenge JavaScript et rate-limiting IP. Filtrage progressif des patterns NoName connus (User-Agent, signatures de requêtes). Alerte OFCS aux autres entités (cantons, opérateurs) pour préparation.",
            ok: true, pts: 25,
            fb: "Stratégie correcte. La mitigation moderne combine CDN + challenge progressif + signatures connues + coordination. Elle préserve l'accès légitime tout en absorbant la vague. C'est exactement ce que l'OFCS a coordonné en juin 2023.",
            legal: "Rapport OFCS 2023 + bonnes pratiques — CDN + challenge + signatures + coordination = standard moderne.",
            critical: false, next: 1,
          },
          {
            text: "Couper complètement les sites ciblés pour rétablir plus tard — éviter l'escalade.",
            ok: false, pts: -25,
            fb: "C'est exactement l'objectif de NoName : faire tomber les sites. Couper volontairement = livrer la victoire à l'adversaire. Le symbole politique (discours Zelensky) sera impacté, ce qui est précisément le but recherché.",
            legal: "Doctrine cyber — Capituler devant un DDoS = reconnaître la victoire de l'attaquant.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🎯 Caractérisation de l'adversaire",
        situation: "Les vagues DDoS continuent mais sont absorbées. Le rectorat communication demande un rapport rapide sur le profil de l'adversaire pour le communiqué : <strong>« est-ce un acteur étatique russe ? »</strong> La tentation politique est d'affirmer clairement l'attribution.",
        law: "<strong>Manuel Ch. 29.1</strong> — Attribution étatique : prudence extrême, réservée aux agences spécialisées.<br><strong>Art. 182 CPP</strong> — L'expert ne se substitue pas au politique.",
        question: "<strong>Quelle caractérisation retenez-vous dans votre rapport public ?</strong>",
        choices: [
          {
            text: "« Ces attaques sont le fait de services de renseignement russes visant à déstabiliser la démocratie suisse. »",
            ok: false, pts: -25,
            fb: "Attribution étatique directe sans base technique forte. NoName057 se revendique « hacktivistes pro-russes indépendants » — la frontière avec un acteur étatique est floue et discutée. Une affirmation aussi forte sans preuve engage la Suisse diplomatiquement.",
            legal: "Manuel Ch. 29.1 + prudence diplomatique — L'attribution étatique publique engage l'État suisse ; elle ne se fait pas à la légère.",
            critical: true, next: "end",
          },
          {
            text: "« Les attaques sont revendiquées par le groupe hacktiviste pro-russe NoName057. L'outillage technique et les motivations politiques sont cohérentes avec cette revendication. Une attribution étatique directe n'est pas établie à ce stade et relève des services spécialisés. »",
            ok: true, pts: 25,
            fb: "Formulation forensique et diplomatiquement prudente. Elle rapporte le fait (revendication), caractérise techniquement (outillage), laisse l'attribution étatique aux services spécialisés (SRC). C'est exactement la posture adoptée par l'OFCS en juin 2023.",
            legal: "Rapport OFCS 2023 — Attribution mesurée, factuelle, ne se substituant pas au renseignement.",
            critical: false, next: 2,
          },
          {
            text: "« L'origine des attaques n'est pas clairement identifiable, aucune revendication crédible. »",
            ok: false, pts: -15,
            fb: "Faux. NoName057 a revendiqué publiquement sur Telegram, avec captures d'écran à l'appui. Prétendre ignorer la revendication = déni d'un fait public, décrédibilise l'expertise.",
            legal: "Manuel Ch. 29.1 — Rapporter les faits publics observables, même si leur auteur est controversé.",
            critical: false, next: "end",
          },
        ],
      },
      {
        phase: "🇨🇭 Coordination fédérale",
        situation: "La vague se poursuit sur plusieurs jours. Des cantons (Argovie, Vaud, Genève) sont également ciblés. Des opérateurs critiques privés (La Poste, Swiss) reçoivent des attaques similaires. Le Conseil fédéral vous demande un <strong>cadre de coordination</strong> pour la suite.",
        law: "<strong>Ordonnance OFCS</strong> — Coordination volontaire entre Confédération, cantons, opérateurs critiques.<br><strong>Future Loi InfoSec (en préparation)</strong> — Obligation de notification d'incident en cours de consolidation.",
        question: "<strong>Quel cadre de coordination proposez-vous ?</strong>",
        choices: [
          {
            text: "Centralisation totale : tout est géré par l'OFCS, les cantons et privés doivent suivre.",
            ok: false, pts: -15,
            fb: "Politiquement et juridiquement impossible. La Suisse a une structure fédérale : les cantons ont leurs compétences propres. Les opérateurs privés aussi. Le rôle de l'OFCS est de <em>coordonner</em>, pas de commander. Une tentative de centralisation crée des résistances et paralyse.",
            legal: "Fédéralisme suisse — Coordination ≠ centralisation. Le rôle de l'OFCS est cadré par ordonnance.",
            critical: false, next: "end",
          },
          {
            text: "Cadre fédéraliste : (1) OFCS comme hub d'information central et d'assistance technique volontaire. (2) Canaux sécurisés de partage d'IoC (MISP-CH). (3) Notification d'incident encouragée (puis obligatoire via future Loi InfoSec). (4) Cellules de crise activables par événement. (5) Communication publique coordonnée.",
            ok: true, pts: 20,
            fb: "Cadre correct et réaliste. Hub + partage volontaire + canaux sécurisés + notifications + cellules + com commune. C'est la direction qu'a prise l'OFCS depuis 2023, avec la préparation de la Loi InfoSec entrée en vigueur en 2024-25.",
            legal: "Ordonnance OFCS + Loi InfoSec (en préparation) — Coordination fédéraliste moderne, volontaire puis progressivement obligatoire.",
            critical: false, next: "end",
          },
          {
            text: "Laisser faire — chaque entité gère de son côté, la guerre cyber n'est pas un sujet pour la Confédération.",
            ok: false, pts: -30,
            fb: "Position inacceptable dans un contexte de hacktivisme étatique coordonné. Laisser les cantons et privés isolés face à des attaques mondialement coordonnées = garantir leur défaite individuelle. Le rôle de l'État fédéral est précisément la coordination en cyber-résilience nationale.",
            legal: "Responsabilité fédérale — La cybersécurité des infrastructures critiques est une mission d'État, pas un optionnel.",
            critical: true, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "💥", title: "Expert Cyber-Coordination", sub: "Maîtrise parfaite de la réponse nationale coordonnée" };
      if (pct >= 60) return { icon: "🛰", title: "Analyste Hacktivisme", sub: "Bonnes bases sur les attaques étatiques coordonnées" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez le Rapport OFCS 2023 + doctrine cyber-défense suisse" };
    },
  },

];
