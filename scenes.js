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
            critical: false, next: "end",
          },
          {
            text: "6 ruptures — le rapport est fondamentalement non conforme.",
            ok: true, pts: 25,
            fb: "Correct. Les 6 ruptures : ① support non identifié (S/N manquant), ② hash post-acquisition, ③ transport non sécurisé (antistatique + véhicule privatif), ④ write blocker absent, ⑤ double accès sans log, ⑥ volume non référencé dans les scellés.",
            legal: "Art. 141 CPP — Chaque rupture est une porte d'entrée pour la défense.",
            critical: false, next: "end",
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
            critical: false, next: "end",
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
            critical: false, next: "end",
          },
          {
            text: "«\u00a0jmartin a commis l'infraction de vol de données (art. 143 CP) le 14 mars à 17h42.\u00a0»",
            ok: false, pts: -15,
            fb: "Encore trop loin. Même avec la convergence, qualifier pénalement l'acte (art. 143 CP) dépasse le rôle de l'expert forensique. La qualification pénale appartient au MP et au juge.",
            legal: "Art. 182 CPP — L'expert forensique ne se substitue pas au juge dans la qualification juridique.",
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
            critical: false, next: "end",
          },
          {
            text: "Les connexions suspectes proviennent du Raspberry Pi (MAC confirmé). Il faut saisir et analyser le Pi pour déterminer : propriétaire, configuration, si Dupont l'a contrôlé délibérément ou si c'est un appareil compromis.",
            ok: true, pts: 20,
            fb: "Approche correcte. Les logs MAC identifient l'appareil source — mais pas encore l'auteur humain. L'analyse forensique du Raspberry Pi permettra de déterminer si Dupont l'a utilisé consciemment.",
            legal: "Manuel Ch. 29.4 — Chaîne de causalité : IP → abonné → appareil → utilisateur. Chaque maillon doit être prouvé.",
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
            critical: false, next: "end",
          },
          {
            text: "Notifier le PFPDT avec les éléments confirmés : 12'000 patients, données de santé, exfiltration confirmée, mesures prises.",
            ok: true, pts: 20,
            fb: "Correct. La notification LPD 2023 doit contenir : nature de la violation, catégories et volume de données, groupes de personnes concernées, conséquences probables, mesures prises.",
            legal: "LPD 2023 Art. 24 al. 1 — Données de santé → risque élevé par définition.",
            critical: false, next: "end",
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
            critical: false, next: "end",
          },
          {
            text: "Levée partielle avec tri : accès aux apps de communication professionnelle et metadata, exclusion des photos et messages privés non liés à l'enquête.",
            ok: true, pts: 20,
            fb: "Position conforme à la jurisprudence fédérale. Le TMC peut ordonner un tri par un juge neutre qui remet à l'enquête uniquement les données pertinentes.",
            legal: "TF 1B_602/2020 — Tri préalable par un juge neutre, remise des seules données pertinentes à l'enquête.",
            critical: false, next: "end",
          },
          {
            text: "Refus de levée — l'argumentation de l'avocat est correcte.",
            ok: false, pts: -5,
            fb: "Trop défaitiste. La désignation précise de certaines données privées ne bloque pas l'accès à toutes les données — un tri permet d'accéder aux éléments pertinents.",
            legal: "Art. 248 CPP — La protection de la sphère privée est proportionnelle. Elle ne bloque pas l'enquête, elle la canalise.",
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
            critical: false, next: "end",
          },
          {
            text: "L'avocat a raison — on ne peut pas l'exclure. Retirer la conclusion.",
            ok: false, pts: -15,
            fb: "Trop défaitiste. L'hypothèse doit être évaluée, pas automatiquement acceptée. Un expert qui capitule sans vérification perd sa crédibilité.",
            legal: "Manuel Ch. 2.5 — La contre-hypothèse doit être testée, pas simplement acceptée par défaut.",
            critical: false, next: "end",
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
            critical: false, next: "end",
          },
          {
            text: "Art. 143bis CP (accès indu via token volé) + Art. 147 CP (virement frauduleux) en concours réel.",
            ok: true, pts: 20,
            fb: "Correct. Deux infractions distinctes : (1) l'utilisation du JWT volé pour accéder au système sans droit (143bis), (2) l'exécution du virement frauduleux via manipulation de l'API (147).",
            legal: "Art. 143bis + 147 CP en concours réel. Peine d'ensemble selon art. 49 CP.",
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
            critical: false, next: "end",
          },
          {
            text: "«\u00a0La convergence de 4 sources indépendantes (RDP depuis le poste d'Alice, DHCP lease confirmé, badgeuse — seule personne présente physiquement, pattern horaire habituel d'Alice) désigne le compte d'Alice comme source la plus probable de l'action du 14 mars à 23h47.\u00a0»",
            ok: true, pts: 20,
            fb: "Formulation correcte. Elle cite explicitement les 4 sources, utilise «\u00a0probable\u00a0» pour maintenir l'honnêteté intellectuelle, et identifie le compte (fait vérifiable) plutôt que la personne.",
            legal: "Manuel Ch. 29.3 + Art. 139 CPP — Preuve par indices convergents, formulée avec le niveau d'affirmation approprié.",
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
            critical: false, next: "end",
          },
          {
            text: "1. Backups cloud → 2. Compte Microsoft → 3. Active Directory",
            ok: false, pts: -5,
            fb: "Ordre sous-optimal. Le compte Microsoft est de loin la source la plus fréquente pour les particuliers — il doit être consulté en priorité avant les backups cloud.",
            legal: "Manuel Ch. 24.3 — Microsoft est le dépôt principal pour Windows 10/11 grand public.",
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
            critical: false, next: "end",
          },
          {
            text: "«\u00a0L'analyse RAM (Volatility 3, commande malfind) révèle que le processus svchost.exe (PID 1284) contient une zone mémoire à droits RWX avec du shellcode non signé. Ce processus maintient une connexion active vers 185.x.x.x:443 (voir netscan). Ces éléments sont caractéristiques d'une injection de code en mémoire (technique T1055 MITRE ATT&CK).\u00a0»",
            ok: true, pts: 25,
            fb: "Formulation forensiquement correcte. Elle cite : l'outil (Volatility 3), la commande (malfind, netscan), les artefacts spécifiques (PID, droits RWX, shellcode, IP cible) et une référence de classification (MITRE T1055). Reproductible et vérifiable.",
            legal: "Manuel Ch. 29.1 — Précision + traçabilité + reproductibilité. MITRE ATT&CK comme référence standardisée.",
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
            critical: false, next: "end",
          },
          {
            text: "10:41:05 (login + USB) → 10:43:07 (Excel lancé) → 10:43:22 (navigation ShellBag) → 10:44:37 (.lnk créé) — tout normalisé en UTC.",
            ok: true, pts: 25,
            fb: "Chronologie correcte. Après normalisation : Prefetch 11:43:07 UTC+1 = 10:43:07 UTC. .lnk 11:44:37 UTC+1 = 10:44:37 UTC. Séquence logique : connexion → lancement Excel → navigation → ouverture du fichier cible.",
            legal: "Manuel Ch. 29.4 — Normalisation UTC obligatoire. Séquence causalement cohérente.",
            critical: false, next: "end",
          },
          {
            text: "Les timestamps sont incohérents — la corrélation est impossible.",
            ok: false, pts: -10,
            fb: "Les timestamps ne sont pas incohérents — ils utilisent des fuseaux différents, ce qui est normal. La normalisation en UTC est la solution standard.",
            legal: "Manuel Ch. 29.4 — L'incohérence apparente des fuseaux est résolue par normalisation, pas par abandon.",
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
            critical: false, next: "end",
          },
          {
            text: "Chercher un keyfile sur les autres supports saisis (USB, cloud, NAS).",
            ok: true, pts: 15,
            fb: "Approche valide. Un keyfile est un fichier binaire qui remplace ou complète le mot de passe. Si trouvé, il permet l'ouverture du volume.",
            legal: "Manuel Ch. 24.2 — Keyfile : alternative au mot de passe, chercher sur tous les supports saisis.",
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
            critical: false, next: "end",
          },
          {
            text: "Responsabilité partagée : Xplain pour les mesures de sécurité, les autorités fédérales pour l'absence de directives contractuelles de classification.",
            ok: true, pts: 20,
            fb: "Analyse correcte selon les conclusions de l'OFCS. Les données réelles n'auraient pas dû être dans les environnements de test (principe de minimisation). Mais les contrats ne l'interdisant pas, les autorités mandantes ont une part de responsabilité.",
            legal: "OFCS Rapport 2024 + LPD 2023 Art. 7 — Responsabilité du responsable du traitement d'imposer ces standards contractuellement.",
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
            critical: false, next: "end",
          },
          {
            text: "Garder le rapport strictement confidentiel pour ne pas révéler les capacités de détection suisses.",
            ok: false, pts: -15,
            fb: "Trop prudent. Le silence protège les futures cibles de l'APT ? Non : il les prive d'IoC qui pourraient les alerter. La Suisse a choisi la transparence — avec succès.",
            legal: "Doctrine MELANI — La transparence contrôlée sur les IoC renforce la sécurité collective.",
            critical: false, next: "end",
          },
          {
            text: "Publier un communiqué vague sans IoC « pour ne pas aider les attaquants ».",
            ok: false, pts: -10,
            fb: "L'inverse est vrai : les attaquants connaissent déjà leurs propres outils. Les IoC publiés aident uniquement les défenseurs qui ne les connaissent pas.",
            legal: "Principe de sécurité collective — Security through obscurity ≠ sécurité réelle.",
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
