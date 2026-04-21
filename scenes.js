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

];
