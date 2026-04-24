/**
 * scenes.js — CAS-IN Scénarios DFIR · Fichier Consolidé
 * Compatible avec scene.html moteur v2 + UX Enhancements v2
 *
 * 47 scénarios organisés en trois blocs :
 *
 * ── BLOC 1 : Scénarios pédagogiques fondamentaux (custody → supply_chain_sante)
 *    Couverture : forensique, droit pénal CH, CPP, ACPO, LPD 2023
 *
 * ── BLOC 2 : Affaires suisses réelles 2023-2026
 *    sati-bec    — BEC 18.6M CHF, SATI Tessin 2024            [HARD]
 *    sms-blasters — IMSI catchers, Genève 2025                 [MEDIUM]
 *    xplain-play — Task Force fedpol, darknet 2023-24          [HARD]
 *    clone-vocal       — CEO Fraud deepfake vocal, Schwyz 2026         [MEDIUM]
 *    lockbit-victime   — Premier réflexe ransomware, Opération Cronos   [EASY]
 *    vetroz-akira      — AKIRA supply chain Valais, avril 2026             [MEDIUM]
 *    faux-policiers    — Vishing NE, 43 coursiers, mobile forensics         [MEDIUM]
 *    infostealer-magnus — Opération Magnus, RedLine/META, LBA Art.9         [MEDIUM]
 *
 * ── BLOC 3 : Jurisprudence ATF/TF publiée
 *    banquier-fantome  — Art. 143+147 al.2 CP, MPC 2024        [HARD]
 *    boutique-fantome  — ATF 150 IV 188, Art. 146/147 CP       [MEDIUM]
 *    telephone-scelles — TF 7B_102/2024 + 7B_145/2025, CPP    [MEDIUM]
 *
 * Structure par scénario :
 *   id, title, icon, difficulty, atmosphere, realCase?,
 *   narrative, tags, legalRefs, intro, alertLevel,
 *   objectives[], debrief, steps[], badgeFn()
 *
 * Structure par step :
 *   phase, situation, law, question, choices[]
 *
 * Structure par choice :
 *   text, ok, pts, fb, legal, critical, next
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
    alertLevel: "📋 AUDIT URGENT — Rapport non conforme détecté avant transmission MP",
    objectives: [
      { icon: "🔍", text: "Identifier chaque rupture de chaîne de custody" },
      { icon: "⚖️", text: "Connaître les conséquences procédurales (Art. 141 CPP)" },
      { icon: "📋", text: "Appliquer les principes ACPO" },
    ],
    debrief: "<p>La chaîne de custody est le pilier de la recevabilité de la preuve numérique. Chaque rupture crée une opportunité pour la défense de contester l'authenticité ou l'intégrité des éléments de preuve.</p><p>Les 6 ruptures dans ce scénario illustrent les erreurs les plus fréquentes : absence de hash de référence, transfert non documenté, stockage inapproprié, accès non loggué, mélange de pièces et rapport sans référence aux scellés.</p><p><strong>Référence CH</strong> : ATF 141 IV 87 — le TF rappelle que la traçabilité de chaque acte d'investigation conditionne la recevabilité des preuves (Art. 141 CPP). En pratique cantonale, la police vaudoise et zurichoise appliquent les ACPO Principles 1–4 comme standard de facto documenté dans leurs directives forensiques internes.</p>",
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
    alertLevel: "📍 PREUVE CONTESTABLE — Valeur probante EXIF à consolider avant audience",
    objectives: [
      { icon: "🧬", text: "Extraire et interpréter les métadonnées EXIF correctement" },
      { icon: "📋", text: "Formuler la conclusion au bon niveau d'affirmation" },
      { icon: "⚖️", text: "Résister à la contre-expertise sur la falsifiabilité des EXIF" },
    ],
    debrief: "<p>Les données EXIF sont une preuve numérique à haute valeur forensique — mais uniquement si elles sont préservées correctement. Prendre une photo de l'écran ou faire un screenshot détruit les métadonnées originales. L'extraction doit se faire sur le fichier original avec un outil dédié (ExifTool) sur une copie forensique.</p><p>La formulation dans le rapport doit rester factuelle : les coordonnées GPS sont des <em>données enregistrées</em>, pas une preuve absolue de présence — le téléphone aurait pu être prêté, piraté, ou les données modifiées.</p><p><strong>Référence CH</strong> : TF 6B_527/2023 (2023) — les métadonnées numériques constituent des preuves indirectes admissibles sous Art. 141 CPP à condition que leur chaîne d'extraction soit documentée. ATF 136 II 508 (Logistep) : les données techniques associées à un fichier (IP, timestamps) sont des données personnelles protégées — leur usage dans une procédure pénale requiert une base légale.</p>",
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
            critical: false, next: 1,
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
     2b. PREMIER_APPEL — Le Premier Appel  [EASY]
     Rôle du SPOC / premier intervenant : triage initial d'un signalement
  ══════════════════════════════════════════════════ */
  {
    id: "premier_appel",
    title: "Le Premier Appel",
    icon: "📞",
    difficulty: "easy",
    atmosphere: "",
    narrative: {
      success: "Le triage initial est exemplaire. Vous avez posé les bonnes questions, préservé les preuves sans interférer, et escaladé au bon niveau. L'équipe DFIR arrive sur une scène propre et dispose de toutes les informations utiles.",
      degraded: "Le triage est correct mais incomplet. L'équipe DFIR devra rattraper certaines informations manquantes. L'enquête est ralentie mais pas compromise.",
      failure: "Vos instructions ont aggravé la situation : preuves détruites par manipulation, escalade tardive, informations critiques perdues. L'enquête DFIR commence avec un handicap majeur."
    },
    tags: ["DROIT", "FORENSIQUE"],
    legalRefs: ["Manuel Ch. 10", "ACPO Principle 1", "Art. 302 CPP"],
    intro: "14h37. Vous êtes analyste au SOC. Appel sur la ligne d'urgence : le comptable d'une PME suisse panique — \"il y a un message bizarre sur mon écran qui dit que tout est chiffré\". L'équipe DFIR est à 90 minutes de route. Vos premières instructions vont conditionner la qualité de toute l'enquête à venir.",
    alertLevel: "📞 H+0 — PREMIER APPEL ENTRANT — Triage initial, chaque seconde compte",
    objectives: [
      { icon: "📞", text: "Mener un triage initial structuré par téléphone" },
      { icon: "🛡", text: "Préserver les preuves sans action technique prématurée" },
      { icon: "📋", text: "Documenter et escalader selon les procédures" },
    ],
    debrief: "<p>Le rôle du premier intervenant (SPOC — Single Point Of Contact) est souvent sous-estimé. Pourtant, c'est lui qui conditionne la qualité de toute l'investigation ultérieure. Les erreurs classiques du SPOC : donner de mauvaises instructions techniques au témoin, ne pas documenter l'horodatage initial, escalader trop tard ou trop superficiellement.</p><p>La règle d'or : <strong>rassurer sans agir techniquement à distance</strong>. Le SPOC structure l'information, préserve ce qui peut l'être par des instructions simples (ne pas éteindre, ne pas reformater, ne pas payer), et transmet un dossier propre à l'équipe DFIR.</p><p><strong>Référence CH</strong> : ATF 141 IV 87 consid. 2.3 — les mesures conservatoires d'urgence prises avant ordonnance formelle sont admissibles si elles respectent le principe de proportionnalité (Art. 197 CPP). La pratique des brigades cyber cantonales (Vaud, Zurich, Genève) reconnaît un délai de grâce de 30 minutes pour les premières mesures de containment en situation d'incident actif.</p>",
    steps: [
      {
        phase: "📞 Le triage initial",
        situation: "Le comptable est très inquiet. Il vous décrit un écran noir avec du texte rouge demandant du Bitcoin. Il a déjà essayé de redémarrer la machine (sans succès) et demande s'il doit l'éteindre définitivement. Il précise aussi avoir \"débranché le réseau par précaution\". Vous avez 3 minutes avant qu'il raccroche d'anxiété.",
        law: "<strong>Manuel Ch. 10</strong> — Premier intervenant : préservation des preuves volatiles.<br><strong>ACPO Principle 1</strong> — Aucune action ne doit modifier les données originales.",
        question: "<strong>Quelle est votre réponse immédiate à la question « dois-je éteindre ? »</strong>",
        choices: [
          {
            text: "« Éteignez immédiatement, ça arrêtera le chiffrement. »",
            ok: false, pts: -25,
            fb: "Erreur grave. L'extinction d'un système en cours d'incident détruit la RAM, qui peut contenir des clés de chiffrement, des processus malveillants actifs et des indicateurs de compromission cruciaux. Pour un ransomware ayant fini son action, c'est en plus inutile — le chiffrement est déjà terminé.",
            legal: "Manuel Ch. 11.1 + ACPO Principle 1 — Capture RAM obligatoire avant toute extinction.",
            critical: true, next: "end",
          },
          {
            text: "« Surtout ne rien faire de plus. Laissez l'ordinateur allumé dans l'état. L'équipe arrive dans 90 min. Ne touchez à rien, ne tapez rien, ne fermez rien. »",
            ok: true, pts: 25,
            fb: "Réponse parfaite du SPOC. Vous stoppez immédiatement l'auto-aggravation, rassurez par la prise en charge imminente, et donnez des instructions minimales claires. Le fait que le réseau soit déjà débranché est positif (il a bien agi).",
            legal: "Manuel Ch. 10 — SPOC : instructions minimales de préservation, escalade rapide.",
            critical: false, next: 1,
          },
          {
            text: "« Essayez Ctrl+Alt+Suppr et ouvrez le gestionnaire des tâches pour voir les processus suspects. »",
            ok: false, pts: -15,
            fb: "Demande technique inadaptée. Guider à distance un non-technicien stressé crée des risques (clic sur un fichier malveillant résiduel, modification d'état système). Le SPOC fait remonter l'information, pas l'investigation.",
            legal: "Manuel Ch. 10 — Pas d'investigation à distance via des utilisateurs non formés.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "📝 La documentation",
        situation: "Vous avez stabilisé l'appelant. Vous devez maintenant documenter la situation pour l'équipe DFIR qui va prendre le relais. L'appelant répond volontiers aux questions.",
        law: "<strong>Manuel Ch. 10.2</strong> — Documentation du premier contact.<br><strong>Art. 302 CPP</strong> — Obligation d'informer les autorités pour certaines infractions.",
        question: "<strong>Quelles informations demandez-vous en priorité ?</strong>",
        choices: [
          {
            text: "Uniquement le nom et l'adresse IP de la machine — le reste l'équipe le verra sur place.",
            ok: false, pts: -10,
            fb: "Insuffisant. Les données contextuelles (heure exacte de découverte, dernière action avant incident, accès récents, dispositifs connectés au moment T) ne seront plus accessibles sur place avec la même fraîcheur. Le SPOC récolte ces informations volatiles humaines.",
            legal: "Manuel Ch. 10.2 — Informations contextuelles = valeur forensique immédiate.",
            critical: false, next: 2,
          },
          {
            text: "(1) Horodatage précis de la découverte + de la dernière action normale. (2) Actions déjà entreprises par l'appelant (redémarrage, débranchement). (3) Nombre/nature d'autres dispositifs dans le même réseau. (4) Présence de sauvegardes. (5) Coordonnées précises + disponibilité pour l'équipe DFIR. (6) Transcription exacte du message à l'écran (photo si possible).",
            ok: true, pts: 25,
            fb: "Questionnaire SPOC exemplaire. Chaque information a une valeur forensique (timestamp = timeline), procédurale (actions entreprises = état actuel du système) ou opérationnelle (coordonnées, autres dispositifs exposés). C'est la pratique GovCERT standard.",
            legal: "Manuel Ch. 10.2 + Pratique GovCERT — Grille d'entretien SPOC structurée.",
            critical: false, next: 2,
          },
          {
            text: "Demander à l'appelant son numéro de carte bancaire pour un éventuel paiement de rançon.",
            ok: false, pts: -30,
            fb: "Absurde et illégal. Un SPOC ne gère jamais les questions financières. De plus, payer une rançon peut être pénalement qualifié si le groupe est listé (sanctions SECO). Demander des informations bancaires à un appelant stressé relève aussi du phishing interne.",
            legal: "SECO + GovCERT + Art. 146 CP — SPOC ne gère ni finances ni paiement.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📤 L'escalade",
        situation: "Le triage est terminé. Vous devez maintenant escalader à l'équipe DFIR. Votre SOC a plusieurs canaux : l'équipe de garde (1 personne, disponible 24/7, expertise standard), l'équipe DFIR niveau 2 (en journée uniquement, expertise approfondie), et le RSSI (uniquement pour incidents majeurs).",
        law: "<strong>NIST SP 800-61</strong> — Escalade hiérarchisée.<br><strong>Procédures internes SOC</strong> — Chaîne d'alerte.",
        question: "<strong>Comment structurez-vous votre escalade ?</strong>",
        choices: [
          {
            text: "Appeler uniquement l'équipe de garde — c'est 14h37, niveau 2 est occupé.",
            ok: false, pts: -15,
            fb: "Ransomware actif sur PME = généralement qualifié « incident majeur » (impact business + potentiel fuite de données personnelles → LPD 2023 Art. 24). La règle : escalade MULTIPLE simultanée vers tous les niveaux concernés, pas séquentielle.",
            legal: "NIST SP 800-61 + LPD 2023 — Incident ransomware = escalade incident majeur.",
            critical: false, next: "end",
          },
          {
            text: "Escalade simultanée : (1) Alerte l'équipe DFIR niveau 2 (ticket détaillé + appel), (2) Notifie le RSSI (SMS + email) — ransomware = potentiel incident majeur, (3) Inscrit dans le journal d'astreinte avec horodatage, (4) Envoie le dossier SPOC structuré (contenant les éléments du triage) aux destinataires, (5) Reste joignable pour questions.",
            ok: true, pts: 25,
            fb: "Escalade SOC exemplaire. Chaque acteur est informé selon sa responsabilité, avec les bons canaux et le bon contenu. Le dossier SPOC structuré évite aux équipes de rappeler l'appelant pour les mêmes informations. Le journal d'astreinte préserve la traçabilité.",
            legal: "NIST SP 800-61 + Pratique SOC — Escalade structurée documentée.",
            critical: false, next: "end",
          },
          {
            text: "Se rendre directement sur place en personne pour prendre les choses en main.",
            ok: false, pts: -20,
            fb: "Dépassement de rôle. Le SPOC reste au SOC (son poste), prépare le dossier et escalade. Quitter son poste = abandon des autres appels entrants + absence de capture du contexte SOC (logs, télémétrie). Chaque acteur joue son rôle.",
            legal: "Procédures SOC — Le SPOC reste SOC, l'équipe DFIR va sur le terrain.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "📞", title: "SPOC Exemplaire", sub: "Maîtrise parfaite du triage initial" };
      if (pct >= 60) return { icon: "🎧", title: "Analyste SOC", sub: "Bonnes bases du premier contact" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez Manuel Ch. 10 — Premier intervenant" };
    },
  },

  /* ══════════════════════════════════════════════════
     2c. PHISHING — Le Mail Suspect  [EASY]
     Analyse d'un email de phishing signalé par un employé
  ══════════════════════════════════════════════════ */
  {
    id: "phishing",
    title: "Le Mail Suspect",
    icon: "🎣",
    difficulty: "easy",
    atmosphere: "",
    narrative: {
      success: "Votre analyse confirme le phishing avec des indicateurs techniques clairs. Les IoC extraits permettent au SOC de détecter d'autres tentatives dans l'entreprise. L'employé est rassuré et félicité pour son signalement.",
      degraded: "L'analyse est globalement correcte mais certains indicateurs ont été mal interprétés. Le SOC doit compléter le travail. Le signalement a quand même permis de bloquer le phishing.",
      failure: "Diagnostic erroné. Soit un vrai phishing a été classé en faux positif (risque de propagation), soit un mail légitime a été qualifié de phishing (frustration utilisateur, blocage inutile). Votre crédibilité d'analyste est entamée."
    },
    tags: ["RÉSEAUX", "DROIT"],
    legalRefs: ["Art. 143bis CP", "Art. 146 CP", "MITRE ATT&CK T1566"],
    intro: "09h15. Un employé de l'entreprise signale via le bouton \"Signaler phishing\" d'Outlook un email qui lui semble suspect. L'objet : \"Validation urgente de votre compte — action requise sous 24h\". Vous êtes analyste SOC de garde. Le mail doit-il être bloqué ? Est-ce une vraie menace ?",
    alertLevel: "🎣 PHISHING ACTIF — Infrastructure malveillante toujours opérationnelle",
    objectives: [
      { icon: "🔍", text: "Analyser techniquement les en-têtes et le contenu d'un email" },
      { icon: "🎯", text: "Identifier les indicateurs de phishing (MITRE T1566)" },
      { icon: "📨", text: "Répondre de façon pédagogique à l'employé" },
    ],
    debrief: "<p>Le signalement d'emails phishing par les employés est le pilier le plus efficace de la défense contre l'ingénierie sociale. Un analyste SOC traite parfois 50-100 signalements par jour : il doit trier vite ET bien.</p><p>L'analyse repose sur : (1) l'examen des en-têtes SMTP (SPF/DKIM/DMARC, IP d'origine, routage), (2) l'analyse du contenu (urgence artificielle, liens, pièces jointes, fautes), (3) la corroboration avec threat intel (VirusTotal, URLScan, bases de phishing connu). La réponse à l'employé doit être pédagogique, jamais condescendante.</p><p><strong>Référence CH</strong> : MPC, acte d'accusation 04.04.2024 — dans l'affaire du réaltime-phishing bancaire suisse (CHF 2.4M, 2022-2025), le MPC a retenu Art. 147 al. 1 et al. 2 CP (utilisation frauduleuse par métier) pour les kits de phishing bancaires. TF 6B_683/2021 (2022) : l'aggravante du métier exige fréquence + montant + organisation professionnelle.</p>",
    steps: [
      {
        phase: "📧 L'analyse des en-têtes",
        situation: `Vous examinez les en-têtes techniques du mail :<br><br>
<div style="background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem;font-size:.76rem;line-height:1.6;font-family:monospace">
From: <span style="color:#ff6b9d">Support &lt;support@micros0ft-security.com&gt;</span><br>
Return-Path: <span style="color:#ff6b9d">support@micros0ft-security.com</span><br>
SPF: <span style="color:#ff6b9d">fail</span> (domaine non autorisé)<br>
DKIM: <span style="color:#ff6b9d">none</span> (pas de signature)<br>
DMARC: <span style="color:#ff6b9d">fail</span><br>
Received from: 185.220.101.X (nœud Tor)
</div>`,
        law: "<strong>SPF/DKIM/DMARC</strong> — Standards anti-usurpation email (RFC 7208, 6376, 7489).<br><strong>MITRE ATT&CK T1566.002</strong> — Spearphishing Link.",
        question: "<strong>Que concluez-vous des en-têtes ?</strong>",
        choices: [
          {
            text: "C'est probablement un faux positif — l'entreprise reçoit souvent des mails Microsoft légitimes.",
            ok: false, pts: -20,
            fb: "Lecture erronée. Le domaine est <code>micros0ft-security.com</code> (avec un zéro, pas un o) — c'est un typosquat classique. SPF/DKIM/DMARC tous en échec + origine nœud Tor = indicateurs cumulés incontestables de phishing. Microsoft envoie depuis <code>microsoft.com</code> avec SPF/DKIM valides.",
            legal: "RFC 7208/6376/7489 — Les 3 échecs simultanés sont un indicateur fort.",
            critical: false, next: 1,
          },
          {
            text: "Phishing confirmé : (1) Typosquat sur le domaine (micros0ft avec zéro), (2) SPF/DKIM/DMARC tous échoués, (3) Origine Tor = dissimulation de l'IP réelle. Tous les indicateurs techniques convergent.",
            ok: true, pts: 25,
            fb: "Analyse parfaite. Vous avez identifié les 3 faisceaux d'indicateurs : usurpation de marque (typosquat), échec des contrôles d'authentification, masquage de l'origine. Aucun n'est isolé — leur convergence rend la classification certaine.",
            legal: "MITRE ATT&CK T1566.002 + standards email — Classification technique solide.",
            critical: false, next: 1,
          },
          {
            text: "Impossible de trancher sans ouvrir le mail en sandbox.",
            ok: false, pts: -10,
            fb: "Trop prudent. Les en-têtes suffisent déjà à classifier. L'analyse en sandbox est utile pour les malwares en pièce jointe, pas pour un phishing classique. Ne pas bloquer immédiatement un phishing évident = exposer d'autres employés.",
            legal: "Pratique SOC — Priorisation : en-têtes + URL > sandbox pour phishing standard.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "🔗 L'analyse du lien",
        situation: "Le mail contient un lien : « Cliquez ici pour sécuriser votre compte ». L'URL réelle (révélée au survol) est <code>https://bit.ly/3xZ9kP2</code> — un raccourcisseur. Vous devez décider si vous investiguez plus loin ou si les en-têtes suffisent.",
        law: "<strong>URLScan.io</strong> / <strong>VirusTotal</strong> — Services d'analyse URL.<br><strong>MITRE ATT&CK T1204.001</strong> — User Execution: Malicious Link.",
        question: "<strong>Comment analysez-vous le lien ?</strong>",
        choices: [
          {
            text: "Cliquer sur le lien directement pour voir où il redirige.",
            ok: false, pts: -30,
            fb: "Violation majeure des bonnes pratiques. Cliquer = (1) signaler à l'attaquant que le mail a été ouvert (beacon), (2) exposer votre machine SOC à un exploit drive-by, (3) potentiellement divulguer l'adresse IP de votre organisation. Un analyste SOC ne clique JAMAIS sur les URL suspectes, même « pour vérifier ».",
            legal: "Pratique SOC + sandbox obligatoire — Jamais d'ouverture directe.",
            critical: true, next: "end",
          },
          {
            text: "Utiliser URLScan.io et VirusTotal pour analyser le lien sans l'ouvrir. Examiner la destination finale + captures d'écran + scores de détection.",
            ok: true, pts: 25,
            fb: "Méthode standard SOC. URLScan donne une capture de la page sans exposer votre IP. VirusTotal aggrège 70+ moteurs de détection. Combinés, ils donnent un verdict fiable sans aucun risque pour votre infrastructure.",
            legal: "OWASP + Pratique SOC — Analyse URL externalisée.",
            critical: false, next: 2,
          },
          {
            text: "Transférer le mail à l'employé en lui demandant de cliquer et de décrire ce qu'il voit.",
            ok: false, pts: -35,
            fb: "Inacceptable. Demander à un non-technicien d'interagir avec un phishing confirmé = l'exposer (ou des collègues) au vol d'identifiants. C'est l'opposé de votre mission de protection. Le bouton \"Signaler\" existe précisément pour que l'employé ne clique PAS.",
            legal: "Violation du devoir de protection + Art. 143bis CP potentiel si vol.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📤 La réponse à l'employé",
        situation: "L'analyse confirme un phishing. URLScan montre une page d'identification Microsoft contrefaite. Vous devez maintenant répondre à l'employé qui attend votre retour pour savoir s'il a « bien fait ».",
        law: "<strong>Principe de pédagogie positive</strong> — Renforcer les bons réflexes.<br><strong>Pratique GovCERT</strong> — Communication proactive.",
        question: "<strong>Quel ton adoptez-vous dans votre réponse ?</strong>",
        choices: [
          {
            text: "« Vous auriez dû reconnaître ce phishing évident. La prochaine fois, soyez plus vigilant. »",
            ok: false, pts: -25,
            fb: "Réponse contre-productive. Culpabiliser un employé qui a CORRECTEMENT signalé un phishing = décourager les futurs signalements. La formation à la détection viendra par les moyens habituels ; le SOC remercie et encourage.",
            legal: "Pratique GovCERT + psychologie de la sécurité — Jamais culpabiliser les bons réflexes.",
            critical: false, next: "end",
          },
          {
            text: "« Excellent réflexe de signalement ! Confirmation : c'était un phishing (typosquat Microsoft + page contrefaite). Le mail est bloqué pour tous. Si vous avez cliqué ou entré vos identifiants, contactez-moi immédiatement, sinon tout va bien. Bravo. »",
            ok: true, pts: 25,
            fb: "Réponse idéale. Vous félicitez (renforce le comportement), expliquez brièvement (pédagogie), informez de l'action prise (transparence), et ouvrez la porte si problème (sécurité). Ce type de réponse augmente mesurablement le taux de signalement dans les entreprises.",
            legal: "Bonnes pratiques SOC + communication positive — Standard moderne.",
            critical: false, next: "end",
          },
          {
            text: "Ne pas répondre — l'employé verra bien que le mail est supprimé.",
            ok: false, pts: -15,
            fb: "Occasion manquée. Sans retour, l'employé ne sait pas si son signalement a servi à quelque chose. La prochaine fois, il hésitera ou ne signalera pas. Un retour rapide (même bref) est un investissement dans la culture de sécurité.",
            legal: "Pratique moderne — Feedback loop = pilier de la sensibilisation cyber.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "🎣", title: "Chasseur de Phishing", sub: "Maîtrise parfaite de l'analyse email" };
      if (pct >= 60) return { icon: "📬", title: "Analyste Email", sub: "Bonnes bases en détection phishing" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez MITRE T1566 + analyse en-têtes" };
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
    alertLevel: "⚡ CRITIQUE — BitLocker actif · Clé en RAM · Elle disparaît si vous bougez l'appareil",
    objectives: [
      { icon: "💻", text: "Préserver la clé BitLocker avant toute action" },
      { icon: "⛓", text: "Respecter les scellés sans détruire les preuves volatiles" },
      { icon: "🔑", text: "Identifier les alternatives si la RAM n'a pas été capturée" },
    ],
    debrief: "<p>Ce scénario illustre le principe fondamental de la forensique numérique : <strong>ne jamais modifier la preuve</strong>, même involontairement. Éteindre un ordinateur BitLocker sans en avoir capturé la mémoire vive revient à détruire définitivement la clé de déchiffrement.</p><p><strong>Règle d'or (Manuel Ch. 11.1) :</strong> si le système est allumé et chiffré → live forensics d'abord. Le dump RAM est la priorité absolue. Les scellés (art. 248 CPP) ne s'opposent pas à l'acquisition — ils suspendent l'<em>analyse</em>, pas la <em>collecte</em>.</p><p><strong>Référence CH</strong> : TF 7B_145/2025 (2025) — les smartphones et supports chiffrés constituent des «&nbsp;documents personnels&nbsp;» au sens de l'Art. 264 al. 1 let. b CPP. Leur protection n'est pas absolue : le TMC peut lever les scellés si l'intérêt public à la poursuite prime (cf. affaire cocaïne Zurich, 7.18 kg — levée accordée). La clé de déchiffrement en RAM est un artefact volatile — ACPO Principle 2 s'applique avec une acuité particulière.</p>",
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
            critical: false, next: 1,
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
            critical: false, next: 2,
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
    alertLevel: "⚖️ RAPPORT JUDICIAIRE — Chaque mot peut être retourné contre vous à la barre",
    objectives: [
      { icon: "📋", text: "Distinguer fait / interprétation / opinion dans un rapport forensique" },
      { icon: "⚖️", text: "Respecter le rôle de l'expert (Art. 182 CPP)" },
      { icon: "🎯", text: "Formuler une conclusion proportionnelle aux preuves disponibles" },
    ],
    debrief: "<p>La distinction fait/interprétation/opinion (Manuel Ch. 29.3) est l'une des compétences les plus importantes d'un expert forensique. Un rapport qui mélange les trois niveaux expose son auteur à des attaques en contre-expertise.</p><p>Règle pratique : si vous pouvez mettre «&nbsp;probablement&nbsp;» ou «&nbsp;il semble que&nbsp;», c'est une interprétation. Si vous concluez sur l'intention ou la culpabilité, c'est une opinion — réservée au juge.</p><p><strong>Référence CH</strong> : ATF 144 IV 345 consid. 2.2 — en droit pénal suisse, la preuve indiciaire requiert des «&nbsp;indices concordants et convergents&nbsp;» — formulation distincte des systèmes français («&nbsp;graves, précis, concordants&nbsp;»). Art. 182 CPP : l'expert judiciaire répond à des questions précises, au niveau d'affirmation approprié (fait établi / opinion / possibilité) — son rôle est d'éclairer le juge, jamais de le remplacer.</p>",
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
            critical: false, next: 1,
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
    alertLevel: "🚨 IP ACCUSATRICE — Un nom. Une adresse. Est-ce suffisant pour une arrestation ?",
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
            critical: false, next: 1,
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
    legalRefs: ["LMAD Art. 100", "CPP Art. 245", "TF 7B_102/2024", "ATF 139 IV 128", "Art. 13 Cst."],
    intro: "Un voyageur en provenance de Moscou arrive à Zurich. Un douanier veut accéder au contenu de son laptop. Le voyageur refuse de donner son mot de passe. Quels sont les droits des douaniers ?",
    alertLevel: "🛂 AÉROPORT ZURICH — Voyageur suspect, refus de coopérer · Vos pouvoirs ?",
    objectives: [
      { icon: "🛂", text: "Connaître les limites des pouvoirs douaniers sur les données numériques" },
      { icon: "⚖️", text: "Appliquer la jurisprudence TF 7B_102/2024 et ATF 139 IV 128" },
      { icon: "🔍", text: "Procéder correctement à la saisie forensique avec mandat" },
    ],
    debrief: "<p>Le droit douanier suisse (LMAD) et la procédure pénale (CPP) créent un cadre différent du droit commun pour les contrôles frontaliers. Les autorités douanières ont des pouvoirs élargis dans la zone frontière — mais ces pouvoirs ont des limites claires pour les données numériques.</p><p><strong>TF 7B_102/2024</strong> est la jurisprudence de référence : toute fouille du contenu d'un smartphone ou laptop (messages, photos, applications) constitue une <em>perquisition</em> au sens de l'Art. 246 CPP, nécessitant un mandat de l'autorité compétente (Art. 241 al. 1 CPP). Seule la 'vérification simple' pour identifier une personne sans papiers est tolérée sans mandat (ATF 139 IV 128). Sans mandat et sans péril en la demeure : Art. 141 al. 2 CPP → preuves en principe inexploitables.</p>",
    steps: [
      {
        phase: "🛂 L'aéroport de Zurich",
        situation: "Un voyageur arrive à Zurich en provenance de Moscou. Un douanier le sélectionne pour un contrôle approfondi. Il veut <strong>accéder au contenu du laptop</strong> pour vérifier si des données classifiées y sont présentes. Le voyageur refuse de donner son mot de passe.",
        law: "<strong>LMAD Art. 100</strong> — Contrôle des marchandises (support physique) à la frontière.<br><strong>TF 7B_102/2024</strong> — Fouille du contenu d'un laptop/smartphone = perquisition (Art. 246 CPP) → mandat requis.<br><strong>ATF 139 IV 128</strong> — Exception : 'vérification simple' (répertoire pour identifier) sans mandat tolérée.",
        question: "<strong>Le douanier peut-il contraindre le voyageur à déverrouiller son laptop ?</strong>",
        choices: [
          {
            text: "Oui — la zone frontière donne des pouvoirs étendus aux douaniers.",
            ok: false, pts: -20,
            fb: "Non. La LMAD autorise le contrôle des marchandises (support physique) — pas l'accès au contenu numérique. TF 7B_102/2024 est clair : fouiller le contenu d'un laptop = perquisition au sens de l'Art. 246 CPP, nécessitant un mandat (Art. 241 al. 1 CPP). La zone frontière n'écarte pas cette exigence.",
            legal: "TF 7B_102/2024 consid. 2.4 — Consultation du contenu d'un appareil = perquisition Art. 246 CPP, mandat obligatoire.",
            critical: true, next: "end",
          },
          {
            text: "Non — sans mandat du MP ou soupçon documenté d'infraction pénale, le douanier ne peut accéder qu'à l'appareil physique, pas à son contenu numérique.",
            ok: true, pts: 25,
            fb: "Position correcte selon TF 7B_102/2024 et ATF 139 IV 128. Le douanier peut contrôler l'appareil physiquement (LMAD). Pour accéder au contenu numérique, il faut : soit un soupçon concret d'infraction et un mandat MP (Art. 245 CPP), soit le consentement volontaire du voyageur. La 'vérification simple' (répertoire pour identifier) reste tolérée sans mandat (ATF 139 IV 128), mais toute fouille du contenu dépasse ce cadre.",
            legal: "TF 7B_102/2024 + ATF 139 IV 128 — Contenu numérique : mandat requis. Art. 13 Cst. — Protection de la sphère privée en zone frontière.",
            critical: false, next: 1,
          },
          {
            text: "Peut-être — selon la nationalité du voyageur.",
            ok: false, pts: -15,
            fb: "La nationalité n'influence pas les droits fondamentaux devant les autorités suisses. Tous les voyageurs sur le territoire suisse bénéficient de la protection de l'art. 13 Cst.",
            legal: "Art. 13 Cst. — Protection de la sphère privée applicable à toute personne sur le territoire suisse.",
            critical: false, next: 1,
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
        situation: "Le Tribunal des mesures de contrainte (TMC) de Zurich examine la demande de levée des scellés 15 jours après la saisie. L'avocat conteste la légalité même du contrôle initial, invoquant TF 7B_102/2024 : la consultation du laptop sans mandat initial constituerait une perquisition illicite (Art. 246 CPP), rendant toute preuve subséquente inexploitable.",
        law: "<strong>TF 7B_102/2024</strong> — Fouille smartphone/laptop sans mandat = perquisition illicite → Art. 141 al. 2 CPP.<br><strong>ATF 139 IV 128</strong> — Exception : vérification simple d'identité tolérée.<br><strong>Art. 141 CPP</strong> — Exploitation des preuves illicites.",
        question: "<strong>Comment répondez-vous à l'argument TF 7B_102/2024 ?</strong>",
        choices: [
          {
            text: "TF 7B_102/2024 ne s'applique pas aux contrôles douaniers — il concerne les arrestations de police ordinaires.",
            ok: false, pts: -20,
            fb: "Lecture erronée. TF 7B_102/2024 pose un principe général : toute fouille du contenu d'un appareil = perquisition (Art. 246 CPP), indépendamment du contexte douanier ou policier. Soutenir que la douane est exemptée discrédite l'argumentation devant le TMC.",
            legal: "TF 7B_102/2024 consid. 2.4 — Principe général applicable en zone frontière et hors zone frontière.",
            critical: true, next: "end",
          },
          {
            text: "TF 7B_102/2024 exige une base légale que nous avons : le douanier a d'abord effectué une vérification physique (LMAD) licite, puis le soupçon concret (appareil non déclaré + documents militaires) a justifié l'obtention du mandat MP en 2h. Le contenu numérique n'a été accédé qu'avec ce mandat — procédure conforme.",
            ok: true, pts: 25,
            fb: "Argumentation solide et structurée. Vous distinguez : (1) vérification physique initiale = licite (LMAD, pas de mandat requis), (2) soupçon concret documenté → mandat MP, (3) accès numérique sur la base du mandat = conforme TF 7B_102/2024. La chronologie démontre que le contenu n'a jamais été consulté sans base légale.",
            legal: "TF 7B_102/2024 + Art. 245 CPP + LMAD — Contrôle physique → soupçon → mandat → accès numérique : séquence légale.",
            critical: false, next: "end",
          },
          {
            text: "Accepter la contestation et renoncer à la procédure pour éviter un arrêt défavorable.",
            ok: false, pts: -15,
            fb: "Capitulation prématurée. La procédure est juridiquement défendable si la chronologie est respectée (contrôle physique → soupçon documenté → mandat → accès numérique). Renoncer sans combattre fragilise les procédures similaires futures.",
            legal: "Pratique MP — Défendre une procédure conforme = préserver les outils d'enquête frontaliers.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 80 && custodyPct >= 75) return { icon: "🛂", title: "Expert Droit Frontalier", sub: "Maîtrise parfaite des pouvoirs douaniers numériques" };
      if (pct >= 60) return { icon: "⚖️", title: "Juriste Forensique", sub: "Bonnes bases sur les limites douanières" };
      return { icon: "📚", title: "Formation recommandée", sub: "Révisez TF 7B_102/2024, ATF 139 IV 128 et LMAD" };
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
    alertLevel: "🏥 03H00 — RANSOMWARE ACTIF · 12'000 dossiers patients menacés · Blocs opératoires en attente",
    objectives: [
      { icon: "🔬", text: "Capturer les preuves forensiques avant la remédiation" },
      { icon: "📣", text: "Respecter les obligations LPD 2023 (notification PFPDT)" },
      { icon: "⚖️", text: "Équilibrer impératifs opérationnels et forensiques" },
    ],
    debrief: "<p>Ce scénario illustre la tension entre les obligations légales (LPD 2023 — notification PFPDT), les impératifs opérationnels (maintien des soins) et les besoins forensiques (préservation des preuves avant toute remédiation).</p><p>La règle d'or : <strong>capturer les preuves avant d'éteindre ou de restaurer</strong>. Un ransomware actif en RAM peut laisser des clés de déchiffrement et des indicateurs de compromission. La restauration depuis backup détruit irrémédiablement ces preuves.</p><p><strong>Référence CH</strong> : LPD 2023 Art. 24 — la notification au PFPDT doit intervenir «&nbsp;dans les meilleurs délais&nbsp;» en cas de violation à risque élevé pour les personnes. Le PFPDT recommande une notification sous 72h par analogie avec le RGPD UE (Art. 33 RGPD) — mais ce délai n'est <em>pas inscrit dans la loi suisse</em>. La Suisse se distingue de l'UE sur ce point. Affaires de référence : Vidymed Lausanne (2024), Hôpital cantonal Zurich (2021).</p>",
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
            critical: false, next: 1,
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
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "📣 La notification LPD",
        situation: "48 heures plus tard, l'analyse confirme : <strong>données personnelles de 12'000 patients exfiltrées</strong> avant chiffrement. Le groupe ransomware menace de publier si la rançon n'est pas payée dans 72h.",
        law: "<strong>LPD 2023 Art. 24</strong> — Notification PFPDT obligatoire si risque élevé (sans délai légal fixe en droit suisse).<br><strong>PFPDT en pratique</strong> — Recommande 72h (analogie RGPD UE, non inscrit dans la LPD 2023).<br><strong>Remarque clé</strong> — La Suisse ≠ UE sur ce point : délai indicatif, pas impératif. «\u00a0dans les meilleurs délais\u00a0».",
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
    alertLevel: "⏱️ FENÊTRE CRITIQUE — La défense demande les scellés dans les prochaines minutes",
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
    alertLevel: "🔬 4 ARTEFACTS · 0 CERTITUDE SEULE · La convergence fait la preuve",
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
            critical: true, next: "end",
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
            critical: false, next: 1,
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
    legalRefs: ["Art. 147 CP", "Art. 146 CP", "Art. 143bis CP", "ATF 150 IV 188", "ATF 140 IV 11"],
    intro: "50'000 CHF virés à 03h47 via l'API bancaire. Manipulation de requêtes HTTP. L'API traite les virements de façon entièrement automatisée — aucun employé de banque ne voit ou valide les transactions. La qualification pénale est cruciale pour la poursuite.",
    alertLevel: "💰 03H47 — 50'000 CHF VIRÉS · Art. 146 ou 147 CP ? La qualification change tout",
    objectives: [
      { icon: "⚖️", text: "Distinguer Art. 146 CP (escroquerie) et Art. 147 CP (abus d'ordinateur)" },
      { icon: "🔍", text: "Identifier le concours d'infractions (Art. 9 CP)" },
      { icon: "📋", text: "Documenter la chaîne forensique : token JWT → API → virement" },
    ],
    debrief: "<p><strong>ATF 150 IV 188 (novembre 2024)</strong> est désormais l'arrêt de référence : Art. 147 CP (abus d'un ordinateur) s'applique UNIQUEMENT si le processus est entièrement automatisé — de la réception de la requête jusqu'à l'exécution, sans aucune intervention humaine. Si un employé de banque peut voir, valider ou annuler la transaction (même sans réel pouvoir décisionnel), c'est Art. 146 CP (escroquerie) qui prime, Art. 147 CP étant subsidiaire.</p><p>Dans ce scénario, l'API bancaire traite les virements de nuit de façon 100% automatisée — aucun humain ne valide les transactions entre 23h et 6h. Art. 147 CP s'applique donc correctement. Si la banque avait eu un système de validation humaine, même partielle, la qualification correcte aurait été Art. 146 CP.</p>",
    steps: [
      {
        phase: "💰 La fraude découverte",
        situation: "Un virement de <strong>50'000 CHF</strong> a été effectué depuis le compte d'une PME. L'analyse des logs montre : connexion depuis une IP externe via l'API bancaire, insertion de requêtes HTTP manipulées imitant une transaction légitime, aucune interaction avec un conseiller humain. Le tout s'est déroulé à 3h47.",
        law: "<strong>Art. 146 CP</strong> — Escroquerie : tromperie astucieuse d'une <em>personne physique</em>.<br><strong>Art. 147 CP</strong> — Abus d'un ordinateur : enrichissement via manipulation d'un processus <em>entièrement automatisé</em>.<br><strong>ATF 150 IV 188 (2024)</strong> — Art. 147 CP subsidiaire à Art. 146 CP. Critère décisif : qui valide in fine l'exécution — un système automatisé ou un être humain ?",
        question: "<strong>L'API bancaire traite les virements 100% automatiquement entre 23h et 6h (aucun employé en ligne). Quelle qualification pénale principale proposez-vous ?</strong>",
        choices: [
          {
            text: "Art. 146 CP — Escroquerie",
            ok: false, pts: -15,
            fb: "Pas nécessairement. ATF 150 IV 188 (2024) nuance : si un employé de banque peut voir et annuler la transaction (même sans pouvoir décisionnel réel), Art. 146 CP prime. Ici l'API traite les virements de nuit 100% automatiquement — aucun humain n'intervient entre 23h et 6h. Dans ce contexte précis, Art. 147 CP est correct. Mais si le même virement avait été soumis à validation humaine (même partielle), Art. 146 CP s'imposerait.",
            legal: "ATF 150 IV 188 consid. 4.9 — Art. 146 CP prime si un humain peut valider ou annuler. Art. 147 CP s'applique uniquement si le processus est ENTIÈREMENT automatisé.",
            critical: false, next: 1,
          },
          {
            text: "Art. 147 CP — Abus d'un ordinateur",
            ok: true, pts: 25,
            fb: "Qualification correcte dans ce contexte. L'API traite les virements de nuit 100% automatiquement — critère ATF 150 IV 188 satisfait (processus entièrement automatisé, aucun employé en mesure de valider ou d'annuler entre 23h et 6h). Art. 147 CP al. 1 punit quiconque influence un traitement de données pour s'enrichir illégitimement. Important : si la banque avait eu une validation humaine même partielle, Art. 146 CP aurait primé (ATF 150 IV 188 — Art. 147 est subsidiaire).",
            legal: "Art. 147 CP al. 1 + ATF 150 IV 188 — Condition : processus entièrement automatisé ✓. Si validation humaine → Art. 146 CP prime.",
            critical: false, next: 1,
          },
          {
            text: "Art. 143 CP — Soustraction de données",
            ok: false, pts: -10,
            fb: "Art. 143 CP vise la soustraction de données (les prendre sans autorisation). Ici, il n'y a pas de données soustraites mais un transfert d'argent obtenu par manipulation du système.",
            legal: "Art. 143 CP — Soustraction de données ≠ manipulation d'un système pour enrichissement financier.",
            critical: false, next: 1,
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
    alertLevel: "👥 COMPTE PARTAGÉ — Qui a vraiment appuyé sur Entrée à 02h34 ?",
    objectives: [
      { icon: "👤", text: "Identifier les artefacts différenciateurs sur un compte partagé" },
      { icon: "🔗", text: "Trianguler sources numériques et physiques (Art. 139 CPP)" },
      { icon: "📋", text: "Formuler l'attribution au niveau d'affirmation correct (Art. 182 CPP)" },
    ],
    debrief: "<p>L'attribution d'une action à un utilisateur spécifique sur un compte partagé est l'un des défis les plus délicats de la forensique Windows. La session utilisateur ne suffit pas — il faut croiser : Event ID 4624 (type de logon), biométrie (si configurée), photos de surveillance, comportements atypiques.</p><p>Le Manuel (Ch. 29.4) insiste : l'attribution humaine nécessite toujours plusieurs sources convergentes. Une session active ne prouve pas physiquement la présence d'une personne devant l'écran.</p><p><strong>Référence CH</strong> : ATF 136 II 508 (Logistep, 2010) — l'adresse IP dynamique est une donnée personnelle protégée. Elle identifie un <em>abonné</em>, non un <em>auteur</em>. En contexte de Carrier Grade NAT (CGN) — utilisé par Swisscom et Salt sur les connexions mobiles — une seule IP peut correspondre à des dizaines d'utilisateurs simultanés ; l'identification requiert alors le port source + timestamp précis. Art. 273 CPP : la réquisition d'abonné nécessite l'autorisation du MP.</p>",
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
            critical: false, next: 1,
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
    alertLevel: "❄️ MACHINE ÉTEINTE · BitLocker intact · Trouvez la clé avant de déclarer forfait",
    objectives: [
      { icon: "❄️", text: "Formuler honnêtement l'impossibilité de casser AES-256 (Manuel Ch. 28.4)" },
      { icon: "🔑", text: "Identifier les alternatives réalistes pour trouver la clé" },
      { icon: "⚖️", text: "Éviter les fausses promesses au MP (Art. 251 CP)" },
    ],
    debrief: "<p>Un système éteint avec BitLocker actif est l'un des défis les plus frustrants de la forensique numérique. La règle est simple : <strong>sans clé de déchiffrement, les données sont inaccessibles</strong>. L'analyste ne doit jamais promettre ce qu'il ne peut pas livrer.</p><p>La formulation correcte de l'impossibilité est une compétence forensique à part entière (Manuel Ch. 28.4). Elle doit être précise, technique et honnête.</p><p><strong>Référence CH</strong> : Art. 248 CPP + TF 7B_145/2025 — la mise sous scellés d'un support chiffré est un droit procédural fondamental du prévenu. Le TMC évalue la levée au cas par cas (gravité des faits vs protection de la sphère privée). Pour les volumes VeraCrypt, ATF 147 IV 16 (2020) rappelle que les preuves portant atteinte à la protection des données sans base légale sont irrecevables.</p>",
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
            critical: false, next: 1,
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
    alertLevel: "👻 FILELESS — Aucune trace sur disque · La RAM contient tout · Elle s'efface au reboot",
    objectives: [
      { icon: "⚡", text: "Comprendre le fonctionnement des malwares fileless" },
      { icon: "💾", text: "Appliquer la séquence correcte : isolation → RAM → Volatility" },
      { icon: "📋", text: "Formuler le rapport avec références MITRE ATT&CK" },
    ],
    debrief: "<p>Les malwares fileless opèrent entièrement en mémoire RAM, injectent du code dans des processus légitimes et ne laissent aucun exécutable sur le disque.</p><p>L'<strong>OFCS (GovCERT)</strong> recommande de capturer la RAM avant toute extinction lors d'une suspicion de malware fileless. La preuve de l'infection repose exclusivement sur l'analyse Volatility de la RAM. Sans dump préalable, la preuve est irrémédiablement perdue.</p><p><strong>Référence CH</strong> : Art. 144bis CP — la détérioration de données couvre les malwares sans fichier qui modifient la mémoire des processus légitimes (process hollowing, DLL injection). La preuve forensique repose sur les artefacts volatiles (RAM dump) — ACPO Principle 2 : la préservation de la mémoire vive prime sur toute autre action. TF 6B_361/2017 — les preuves forensiques obtenues selon les standards documentés (ACPO) sont présumées admissibles.</p>",
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
            critical: false, next: 1,
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
    alertLevel: "⚡ RAID EXÉCUTÉ — Systèmes partiellement chiffrés · Fenêtre de récupération : NOW",
    objectives: [
      { icon: "💾", text: "Comprendre les limites de RAID 5 face au chiffrement" },
      { icon: "🔍", text: "Appliquer la séquence forensique correcte (image d'abord)" },
      { icon: "🗣️", text: "Communiquer honnêtement sur la récupération AES-256" },
    ],
    debrief: "<p>RAID 5 tolère la perte d'un seul disque — mais un disque chiffré par un ransomware n'est pas «\u00a0perdu\u00a0» au sens du RAID. Le contrôleur RAID voit 3 disques fonctionnels dont l'un contient des données aléatoires (le chiffrement). La reconstruction RAID ne peut pas deviner que ce disque est chiffré.</p><p><strong>Référence CH</strong> : SECO / OFAS — avant tout paiement de rançon, vérifier si le groupe est sanctionné (listes SECO, OFAC US). Payer une entité sanctionnée constitue une infraction (Art. 9 LMB suisse). Après démantèlement d'un ransomware (ex. LockBit, opération Cronos 2024), des outils de déchiffrement gratuits sont disponibles via No More Ransom et l'OFCS — les contacter avant toute décision de paiement.</p>",
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
            critical: false, next: 1,
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
    alertLevel: "🕐 4 FUSEAUX HORAIRES · 3 PAYS · 1 HEURE DE DÉCALAGE CRITIQUE",
    objectives: [
      { icon: "🧩", text: "Normaliser tous les timestamps en UTC avant corrélation" },
      { icon: "📊", text: "Reconstruire la séquence causale correcte des événements" },
      { icon: "⚖️", text: "Documenter selon ATF 143 IV 330 pour valeur probante maximale" },
    ],
    debrief: "<p>La reconstruction chronologique (Manuel Ch. 29.4) est l'un des exercices les plus complexes en forensique numérique. Les timestamps de différents artefacts utilisent des fuseaux, des précisions et des origines différentes. Il faut normaliser avant de corréler.</p><p>Règle d'or : ne jamais prendre un timestamp pour argent comptant. Vérifier la source de l'horloge, le fuseau, et croiser avec au moins deux autres artefacts.</p><p><strong>Référence CH</strong> : Art. 307 CP — fausse déclaration d'expert devant le tribunal. En forensique temporelle, la normalisation UTC est une obligation professionnelle : une erreur de fuseau horaire sur un timestamp de log peut inverser la chronologie d'un crime et mener à un acquittement ou une condamnation injuste. Le TF a annulé des condamnations pour insuffisance de la preuve temporelle (TF 6B_946/2022, consid. 2.4).</p>",
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
    alertLevel: "🔐 VeraCrypt AES-256 — 50 Go de secrets · Impossible à casser · Comment en parler au MP ?",
    objectives: [
      { icon: "🔒", text: "Formuler la détection d'un volume chiffré sans sur-affirmer" },
      { icon: "⚖️", text: "Respecter le droit au silence du suspect (Art. 113 CPP — nemo tenetur)" },
      { icon: "🔑", text: "Identifier les alternatives réalistes (RAM dump, keyfile)" },
    ],
    debrief: "<p>Le Manuel (Ch. 24.2) est explicite : «\u00a0affirmer qu'un volume VeraCrypt contient des données compromettantes sans en connaître le contenu constitue une opinion inadmissible, non un fait forensique.\u00a0»</p><p>La détection d'un volume chiffré repose sur des indicateurs statistiques (haute entropie, absence de magic bytes) — jamais sur une certitude.</p><p><strong>Référence CH</strong> : Art. 113 CPP — le prévenu ne peut être contraint de fournir ses mots de passe. Art. 248 CPP — scellés sur les volumes chiffrés si protection de la sphère privée invoquée. ATF 147 IV 16 (2020) — irrecevabilité des preuves portant atteinte à la protection des données. En pratique suisse (brigades cyber VD, ZH), une expertise judiciaire sur la structure des volumes VeraCrypt est admissible sans nécessiter le déchiffrement.</p>",
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
            critical: false, next: 1,
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
    alertLevel: "🇨🇭 INCIDENT ÉTATIQUE — Infrastructure fédérale compromise · Genève surveille",
    objectives: [
      { icon: "🏛", text: "Définir correctement le périmètre du mandat forensique" },
      { icon: "🔍", text: "Analyser les conditions de stockage des données fédérales chez le prestataire" },
      { icon: "⚖️", text: "Identifier la responsabilité partagée prestataire/autorités" },
    ],
    debrief: "<p>L'affaire Xplain 2023 illustre une problématique croissante : la <strong>forensique d'un prestataire</strong> est distincte de la forensique sur l'attaquant. La question centrale n'est pas «\u00a0qui a attaqué ?\u00a0» mais «\u00a0pourquoi les données fédérales étaient-elles chez ce prestataire ?\u00a0»</p><p>L'OFCS (rapport mars 2024) a relevé que des données fedpol et militaires non chiffrées se trouvaient dans les environnements de test de Xplain — violation des principes de minimisation et de classification des données.</p><p><strong>Référence CH</strong> : Affaire Xplain (juin 2023) — violation de données du Secrétariat d'État à la police et d'autres entités fédérales via un prestataire IT externe. LPD 2023 Art. 9 : la responsabilité du sous-traitant IT s'applique dès lors qu'il traite des données personnelles pour le compte d'un responsable. Art. 24 LPD 2023 — chaque entité fédérale affectée devait notifier le PFPDT indépendamment.</p>",
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
            critical: false, next: 1,
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
            critical: false, next: 1,
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
    alertLevel: "🔭 APT DÉTECTÉE — Présence réseau de 6 mois · Que savent-ils vraiment ?",
    objectives: [
      { icon: "🎯", text: "Caractériser le modus operandi de l'APT sans alerter l'attaquant" },
      { icon: "📡", text: "Cartographier l'étendue de la compromission (timeline + lateral movement)" },
      { icon: "⚖️", text: "Respecter la discrétion opérationnelle imposée par MELANI/OFCS" },
    ],
    debrief: "<p>L'affaire RUAG 2016 illustre la difficulté d'une <strong>réponse à un APT déjà installé</strong>. Le rapport public MELANI distingue clairement trois phases : reconnaissance (rootkit Tavdig), escalade et persistance (Turla Carbon), exfiltration silencieuse via des canaux DNS détournés.</p><p>Le piège classique : <em>éteindre ou isoler brutalement prévient l'attaquant que sa couverture est grillée</em>. Les bonnes pratiques OFCS préconisent une surveillance accrue + collecte préalable d'IoC avant tout confinement.</p><p><strong>Référence CH</strong> : Rapport MELANI 2016 sur l'affaire RUAG — APT29 (Cozy Bear) actif 9 mois dans le réseau sans détection. Le rapport a déclenché la réorganisation du MELANI en OFCS (2023). Art. 86 LAM — protection des informations militaires sensibles : le vol de données de défense peut relever de l'espionnage économique (Art. 273 CP). NIST SP 800-161 — gestion du risque supply chain pour les contractants de défense.</p>",
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
            critical: false, next: 1,
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
    alertLevel: "🌍 INCIDENT HUMANITAIRE — Données de réfugiés exposées · Vies en jeu",
    objectives: [
      { icon: "🔍", text: "Identifier rapidement le vecteur d'intrusion (CVE exploitée)" },
      { icon: "🏛", text: "Respecter les obligations humanitaires spécifiques du CICR" },
      { icon: "📣", text: "Gérer la communication envers les populations concernées" },
    ],
    debrief: "<p>L'attaque contre le CICR de janvier 2022 reste l'une des cyberattaques les plus graves contre une organisation humanitaire. Elle a révélé une exploitation de <strong>CVE-2021-40539</strong> (Zoho ManageEngine ADSelfService Plus, patch publié 4 mois avant l'intrusion). Le délai de patching d'un composant critique a été la cause technique.</p><p>Sur le plan humanitaire, le CICR a fait un choix remarquable : <strong>communication publique complète dès la découverte</strong>, y compris un appel direct aux attaquants pour ne pas publier les données, au nom du droit humanitaire international.</p><p><strong>Référence CH</strong> : CICR / Genève, janvier 2022 — 515'000 données de personnes vulnérables volées via un sous-traitant ICRC (prestataire serveur externe). Le CICR invoque le droit international humanitaire (Protocoles additionnels aux Conventions de Genève) comme protection contre les cyberattaques visant ses données. En droit suisse, Art. 143 CP (soustraction de données) + Art. 273 CP (espionnage) peuvent s'appliquer si l'attaquant est localisable.</p>",
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
            critical: false, next: 1,
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
            critical: false, next: 2,
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
            critical: false, next: 2,
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
            critical: false, next: 3,
          },
          {
            text: "Communication minimaliste en interne pour ne pas compromettre l'enquête en cours.",
            ok: false, pts: -15,
            fb: "Contraire à la LPD 2023 et à la mission du CICR. Les personnes concernées — souvent en zone de conflit — doivent savoir que leurs données peuvent être compromises pour prendre leurs propres mesures de sécurité.",
            legal: "LPD 2023 Art. 24 — Notification obligatoire en cas de risque élevé pour les personnes concernées.",
            critical: false, next: 3,
          },
          {
            text: "Publier uniquement un communiqué technique sans mention des populations concernées pour éviter de paniquer.",
            ok: false, pts: -10,
            fb: "Insuffisant. Un communiqué purement technique laisse les familles dans l'ignorance du risque qui les concerne directement. Le droit humanitaire impose l'information des personnes en danger.",
            legal: "Convention IV — Protection active, pas seulement passive, des données humanitaires.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🌍 Les bénéficiaires en zone de conflit",
        situation: "Parmi les 515'000 personnes concernées : réfugiés syriens, familles yéménites, enfants séparés en Afghanistan, détenus en Amérique latine. Beaucoup sont en zones où les gouvernements recherchent activement ces personnes. La notification individuelle classique (email, courrier postal) est impossible ou dangereuse pour certains. Comment gérer ?",
        law: "<strong>Convention Genève IV Art. 26</strong> — Protection des familles dispersées.<br><strong>LPD 2023 Art. 24 al. 3</strong> — Information des personnes concernées.<br><strong>Principe de précaution humanitaire</strong> — Ne pas aggraver la vulnérabilité.",
        question: "<strong>Comment adaptez-vous la notification aux contextes à risque ?</strong>",
        choices: [
          {
            text: "Envoyer un email standard à toutes les 515'000 personnes — on ne peut pas discriminer.",
            ok: false, pts: -30,
            fb: "Danger létal potentiel. Un email mentionnant « vos données CICR concernant la recherche de famille ont fuité » peut, intercepté par un régime hostile, SIGNALER à ce régime qu'une personne recherche un proche disparu politiquement. La notification sans contextualisation peut causer la mort.",
            legal: "Principe humanitaire + Art. 8 CEDH — Protection active des vies.",
            critical: true, next: "end",
          },
          {
            text: "Stratégie différenciée par contexte : (1) Personnes en zones sûres → notification directe détaillée, (2) Personnes en zones sensibles → notification via les délégations CICR locales (canal sécurisé), (3) Personnes en danger imminent → contact uniquement par canal humanitaire confidentiel, (4) Appel public général qui permet à chacun de contacter le CICR pour vérifier son propre cas, sans signaler l'appartenance à la base.",
            ok: true, pts: 25,
            fb: "Approche humanitairement rigoureuse. La discrimination ici n'est pas une inégalité, mais une PROTECTION. Le canal adapté au risque individuel respecte à la fois l'obligation d'information LPD et le principe de précaution humanitaire.",
            legal: "Convention Genève IV + LPD 2023 + Doctrine CICR — Protection contextuelle.",
            critical: false, next: 4,
          },
          {
            text: "Ne notifier personne individuellement — publier uniquement un communiqué de presse général.",
            ok: false, pts: -15,
            fb: "Insuffisant légalement. Un communiqué de presse ne remplace pas une notification pour les personnes en zones où elles ont accès à l'information. La stratégie différenciée est plus rigoureuse.",
            legal: "LPD 2023 Art. 24 al. 3 — Information directe des personnes concernées quand possible.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "🔬 La cartographie précise de l'exfiltration",
        situation: "Vous analysez les logs réseau pour déterminer EXACTEMENT quelles données ont été exfiltrées (pas seulement accédées). L'attaquant est resté 70 jours dans le système (infiltration : novembre 2021, détection : janvier 2022). L'analyse des flux NetFlow montre : 18 GB exfiltrés au total via 47 sessions HTTPS sortantes vers 3 C2 différents.",
        law: "<strong>NetFlow (RFC 3954)</strong> — Traces bandwidth par session.<br><strong>Manuel Ch. 25.4</strong> — Analyse trafic sortant.<br><strong>Convention Genève IV</strong> — Volume et type de données déterminent la gravité.",
        question: "<strong>Comment analysez-vous précisément l'exfiltration ?</strong>",
        choices: [
          {
            text: "Présumer que tout ce qui était dans le système a été exfiltré (approche pessimiste, plus sûre).",
            ok: false, pts: -10,
            fb: "Trop pessimiste ET imprécis. Sans analyse technique, vous ne pouvez pas estimer ce qui a été réellement exfiltré. Un rapport honnête distingue : accédé (lu en place) vs exfiltré (copié vers C2 externe). Pour une base de 515'000, c'est une distinction capitale.",
            legal: "Manuel Ch. 29.3 — Rigueur dans la distinction accès / exfiltration.",
            critical: false, next: 5,
          },
          {
            text: "Corrélation systématique : (1) NetFlow pour volumes totaux par session C2, (2) logs applicatifs Zoho/ADSelfService pour identifier les requêtes ayant extrait des données, (3) hash des payloads HTTPS si capture complète disponible, (4) reconstruction des fichiers exfiltrés (TCP stream reassembly via Wireshark/Zeek), (5) estimation précise : sur 515'000 dossiers, probablement X ont été effectivement extraits vs Y juste consultés. Transparence sur les incertitudes résiduelles.",
            ok: true, pts: 25,
            fb: "Analyse forensique exemplaire. Cette distinction permet aux populations concernées de comprendre leur risque réel. Le CICR peut prioriser ses efforts de protection sur les personnes dont les données ont RÉELLEMENT fuité.",
            legal: "Manuel Ch. 25.4 + RFC 3954 + Art. 24 LPD — Précision forensique pour notification ciblée.",
            critical: false, next: 5,
          },
          {
            text: "Se baser uniquement sur les déclarations publiques des attaquants (ils disent avoir 515'000 dossiers).",
            ok: false, pts: -20,
            fb: "Source non fiable. Les attaquants bluffent souvent sur la volumétrie pour augmenter la pression. Baser un rapport officiel sur leurs dires = crédibiliser leur récit. L'analyse technique est obligatoire.",
            legal: "Manuel Ch. 29.3 — Source primaire technique, pas revendications attaquants.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "🤝 La collaboration avec les partenaires humanitaires",
        situation: "Le programme RLF fonctionne en réseau avec plusieurs organisations partenaires (HCR, MSF, UNICEF, Médecins du Monde). Certaines de leurs bases sont interconnectées avec celle du CICR. Vous devez déterminer si d'autres organisations sont touchées et coordonner la réponse internationale.",
        law: "<strong>Convention Genève IV Art. 81</strong> — Coopération humanitaire.<br><strong>Protocoles interinstitutionnels</strong> — Accords bilateraux ONG.<br><strong>Art. 320 CP</strong> — Secret de fonction (également applicable aux ONG).",
        question: "<strong>Comment gérez-vous la notification aux partenaires ?</strong>",
        choices: [
          {
            text: "Ne pas informer les partenaires — chaque ONG gère sa propre sécurité, ce n'est pas au CICR de les alerter.",
            ok: false, pts: -25,
            fb: "Manquement éthique grave. Dans un écosystème humanitaire interconnecté, si les attaquants ont accédé à la base CICR, ils ont probablement des liens vers les bases partenaires. Ne pas alerter = risquer de nouvelles victimes dans d'autres ONG.",
            legal: "Principe de solidarité humanitaire + Art. 81 Conv. Genève.",
            critical: true, next: "end",
          },
          {
            text: "Notification coordonnée : (1) Briefing technique immédiat aux CISO/CERT des partenaires directs (HCR, MSF, UNICEF) avec IoC complets (hashes Zoho exploit, IP C2, TTPs), (2) Alerte étendue au secteur humanitaire via réseaux dédiés (CyberPeace Institute, HumanitarianID), (3) Publication coordonnée d'IoC sanitized via MISP / fils CSIRT humanitaires, (4) Offre d'assistance technique pour audits rapides.",
            ok: true, pts: 25,
            fb: "Approche exemplaire de solidarité humanitaire. Chaque niveau (direct → secteur → communauté) a son canal adapté. IoC sanitized = partageable largement sans exposer les victimes individuellement. Le CICR a posé ce précédent de coopération transparente.",
            legal: "Conv. Genève Art. 81 + pratique CyberPeace Institute — Coopération IoC humanitaire.",
            critical: false, next: 6,
          },
          {
            text: "Envoyer un communiqué vague à tous les partenaires sans détails techniques.",
            ok: false, pts: -10,
            fb: "Insuffisant opérationnellement. Sans IoC précis (hashes, IP), les partenaires ne peuvent pas vérifier leurs propres systèmes. Un communiqué vague génère de l'anxiété sans permettre d'action. Mieux vaut un briefing technique précis sous confidentialité.",
            legal: "Pratique CERT — Information actionnable ou rien.",
            critical: false, next: 6,
          },
        ],
      },
      {
        phase: "📝 Les conclusions diplomatiques",
        situation: "L'attribution à un acteur étatique (vraisemblablement via des outils sophistiqués non commerciaux) ouvre une question diplomatique délicate. Le CICR est une organisation neutre par statut — elle ne peut pas publiquement accuser un État. Pourtant, ne rien dire sur le caractère étatique pourrait être interprété comme une dissimulation. Comment équilibrer ?",
        law: "<strong>Statut du CICR</strong> — Neutralité, impartialité, indépendance.<br><strong>Convention Genève</strong> — Organisation humanitaire.<br><strong>Principe Nemo judex in causa sua</strong>.",
        question: "<strong>Comment formulez-vous la conclusion sur l'attribution ?</strong>",
        choices: [
          {
            text: "Accuser publiquement l'État probable (Russie, Chine, Iran selon le profil technique) pour obtenir une réaction internationale.",
            ok: false, pts: -30,
            fb: "Violation fondamentale du statut du CICR. Accuser publiquement un État détruit instantanément la neutralité humanitaire, essentielle pour pouvoir continuer à opérer dans TOUS les conflits. Le CICR perd alors l'accès aux zones de conflit — catastrophe opérationnelle.",
            legal: "Statut CICR 1863 + Convention Genève — Neutralité = condition d'existence.",
            critical: true, next: "end",
          },
          {
            text: "Formulation : « Les techniques observées (outils custom, infrastructure sophistiquée, opsec avancée, persistance 70 jours) sont compatibles avec un acteur disposant de ressources étatiques. Le CICR, en tant qu'organisation humanitaire neutre, ne désigne aucun État spécifique. Nous invitons les autorités compétentes et les chercheurs indépendants à poursuivre l'attribution via leurs canaux. »",
            ok: true, pts: 25,
            fb: "Formulation diplomatiquement et techniquement exemplaire. Elle établit les faits techniques (compatible ressources étatiques) sans accuser d'État, préserve la neutralité, et délègue l'attribution aux acteurs compétents (CERT, services de renseignement, chercheurs). C'est la posture du CICR dans son communiqué de 2022.",
            legal: "Communiqué CICR 19.01.2022 — Modèle de formulation préservant la neutralité.",
            critical: false, next: 7,
          },
          {
            text: "Refuser toute mention du caractère étatique — trop politique.",
            ok: false, pts: -15,
            fb: "Dissimulation problématique. Cacher un fait technique avéré (sophistication = ressources étatiques) = manque de transparence. Le CICR peut mentionner la technicité sans désigner d'État.",
            legal: "Transparence opérationnelle + neutralité.",
            critical: false, next: 7,
          },
        ],
      },
      {
        phase: "🔐 La refonte sécuritaire post-incident",
        situation: "Un an après, le CICR doit présenter sa refonte sécuritaire aux donateurs (États, ONG, fondations privées). Certains menacent de couper leur soutien si la sécurité reste insuffisante. Le budget de refonte demandé est de 42M CHF sur 3 ans. Vous soutenez la demande avec l'analyse forensique.",
        law: "<strong>NIST CSF</strong> — 5 fonctions.<br><strong>ISO/IEC 27001</strong> — SMSI humanitaire.<br><strong>Principe de responsabilité</strong> — Red de confiance envers donateurs.",
        question: "<strong>Quels sont les piliers techniques que vous soutenez ?</strong>",
        choices: [
          {
            text: "Migration complète vers le cloud AWS / Azure pour bénéficier de leur sécurité.",
            ok: false, pts: -20,
            fb: "Risque stratégique. Le cloud sous juridiction américaine expose les données humanitaires au CLOUD Act (subpoenas US). Pour une ONG neutre, stocker des données de familles réfugiées en zones de conflit sur des serveurs soumis à une juridiction qui pourrait être partie au conflit = violation neutralité.",
            legal: "CLOUD Act + Convention Genève — Juridiction = enjeu de souveraineté humanitaire.",
            critical: true, next: "end",
          },
          {
            text: "Plan multi-piliers : (1) Souveraineté des données (hébergement Suisse neutre ou infrastructure privée chiffrée), (2) Patching systématique avec SLA 30j critique, 7j urgent, (3) Zero Trust architecture + segmentation réseau fine, (4) EDR + XDR + SOC 24/7 managé, (5) Red Team annuelle + pentests trimestriels, (6) Formation universelle (1300 employés RLF), (7) Plan de continuité avec bases offline redondantes, (8) Chiffrement E2E sur les données bénéficiaires. Coûts détaillés transparents pour donateurs.",
            ok: true, pts: 25,
            fb: "Plan stratégique exemplaire. Chaque pilier adresse une leçon de l'incident 2022. La transparence des coûts rassure les donateurs. La souveraineté des données est CRITIQUE pour une ONG neutre — c'est exactement l'approche que le CICR a développée post-incident.",
            legal: "NIST CSF + ISO 27001 + Statut CICR — Sécurité adaptée à la mission humanitaire neutre.",
            critical: false, next: "end",
          },
          {
            text: "Demander seulement une augmentation du budget SOC — c'est là que le problème est.",
            ok: false, pts: -15,
            fb: "Vision trop étroite. L'incident 2022 était multi-factoriel : patching défaillant (gouvernance), pas de Zero Trust (architecture), pas d'EDR (technique), pas d'alerte suffisante (détection). Un SOC plus fort seul n'aurait pas empêché l'exploit CVE-2021-40539 sur un système non patché.",
            legal: "Analyse racine multi-causale — Défense en profondeur.",
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
    alertLevel: "🏭 CHANTAGE TECHNOLOGIQUE — Données militaires volées · Espionnage industriel suisse",
    objectives: [
      { icon: "💰", text: "Arbitrer la question du paiement (GovCERT + SECO)" },
      { icon: "🛠", text: "Lancer la reconstruction tout en préservant les preuves" },
      { icon: "⚖️", text: "Gérer les aspects export-control (LFAIE) des documents à double usage" },
    ],
    debrief: "<p>L'affaire Stadler Rail 2020 a montré un groupe industriel suisse prendre une décision courageuse : <strong>ne pas payer la rançon</strong>, malgré la menace explicite de publication. Le raisonnement : payer finance la criminalité organisée, ne garantit pas la non-publication, et expose à des sanctions SECO si le destinataire est sur une liste.</p><p>La présence de <strong>documents à double usage</strong> (civil/militaire) a ajouté une dimension LFAIE : la publication de documents techniques de matériel militaire peut constituer une violation de contrôle à l'exportation.</p><p><strong>Référence CH</strong> : Stadler Rail AG, 2020 — double extorsion (chiffrement + publication de données confidentielles). Le groupe Dark Side a exigé une rançon après avoir exfiltré des données de production sensibles. Art. 162 CP — violation du secret de fabrication : les données exfiltrées incluaient des plans techniques d'armements légers, créant une dimension Art. 86 LAM. SECO sanctions : vérification obligatoire avant tout paiement (groupe Dark Side pré-sanctionné par l'OFAC US).</p>",
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
            critical: false, next: 1,
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
            critical: false, next: 3,
          },
          {
            text: "Notifier simultanément : PFPDT (données personnelles), GovCERT/OFCS (incident), SECO (biens à double usage), et éventuellement le MPC (plainte pénale).",
            ok: true, pts: 25,
            fb: "Correct. Une fuite de cette ampleur déclenche plusieurs obligations concurrentes. La notification coordonnée à toutes les autorités compétentes est la seule approche qui protège Stadler juridiquement.",
            legal: "LPD 2023 + LFMG + Ordonnance OFCS — Multi-notification obligatoire pour incident touchant plusieurs domaines régulés.",
            critical: false, next: 3,
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
      {
        phase: "🏛 La position publique",
        situation: "Un journaliste du <em>Tages-Anzeiger</em> appelle. Il a eu vent de l'attaque via le leak site de DoppelPaymer. Il demande à Stadler de confirmer et de se positionner sur le paiement. Les médias internationaux s'emparent de l'affaire. Le conseil d'administration doit décider d'une ligne de communication dans l'heure.",
        law: "<strong>Art. 10 Cst.</strong> — Liberté de la presse.<br><strong>Art. 27 LPD 2023</strong> — Droit à l'information.<br><strong>Doctrine GovCERT</strong> — Transparence sur refus de paiement = force publique.",
        question: "<strong>Quelle position publique recommandez-vous ?</strong>",
        choices: [
          {
            text: "« No comment » officiel pour ne rien confirmer aux attaquants.",
            ok: false, pts: -20,
            fb: "Stratégie contre-productive. Le silence est interprété comme (1) négociation en cours avec les attaquants, ou (2) dissimulation. Les médias combleront le vide avec des spéculations. Le silence nourrit les pires scénarios.",
            legal: "Pratique communication crise — Le silence amplifie l'incertitude.",
            critical: false, next: 4,
          },
          {
            text: "Communiqué officiel clair : (1) Confirmation de l'incident (sans détails tactiques), (2) Refus ferme de payer la rançon + motif (financement criminalité), (3) Action en cours avec autorités (fedpol + GovCERT + SECO), (4) Priorités : reconstruction + sécurité collaborateurs + transparence, (5) Pas de réponse aux demandes de détails sur documents spécifiques. Communiqué multilingue (DE/FR/EN/IT).",
            ok: true, pts: 25,
            fb: "Stratégie exemplaire. C'est exactement l'approche qu'a adoptée Stadler en mai 2020, devenue une référence suisse. La transparence sur la décision (refus) + la discrétion sur les détails tactiques = communication de crise réussie.",
            legal: "Communiqué Stadler Rail 05.2020 — Modèle de communication refus-de-payer.",
            critical: false, next: 4,
          },
          {
            text: "Démentir publiquement que l'attaque a eu lieu — gagner du temps.",
            ok: false, pts: -35,
            fb: "Mensonge pénalement risqué. Les attaquants publieront la preuve dans les heures qui suivent. Le démenti sera massacré publiquement + exposition pour fausse communication aux actionnaires (Art. 152 CP Gestion déloyale et autres). Fin de carrière pour les dirigeants impliqués.",
            legal: "Art. 152 CP + Art. 27 LPD 2023 — Obligation de véracité envers le public.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🔧 L'analyse forensique de l'intrusion",
        situation: "Votre équipe forensique reconstitue le chemin de l'attaque : (1) 28 avril 2020 - spearphishing contre un cadre commercial à Bussnang, (2) 2 mai - déploiement Cobalt Strike + escalade privilèges via Kerberoasting, (3) 4-5 mai - lateral movement vers domaine Active Directory de 3 sites (Bussnang, Altenrhein, Winterthur), (4) 5-8 mai - exfiltration 7 To via chunks HTTPS vers plusieurs C2, (5) 8 mai 02h00 - déploiement ransomware DoppelPaymer sur 1800 postes.",
        law: "<strong>MITRE ATT&CK</strong> — T1566 (phishing), T1558.003 (Kerberoasting), T1021 (lateral), T1486 (ransomware).<br><strong>Manuel Ch. 20</strong> — Kill chain reconstruction.",
        question: "<strong>Que concluez-vous sur les causes-racines dans le rapport ?</strong>",
        choices: [
          {
            text: "Blâmer le cadre commercial qui a ouvert le phishing.",
            ok: false, pts: -25,
            fb: "Approche destructrice et techniquement fausse. Le phishing est le vecteur, PAS la cause. Un seul clic malheureux ne devrait JAMAIS permettre de compromettre toute une entreprise — c'est une défaillance architecturale. Blâmer l'utilisateur = refuser d'adresser les vraies failles.",
            legal: "Principe defense-in-depth — Pas de single point of failure humain.",
            critical: true, next: "end",
          },
          {
            text: "Analyse multi-factorielle : (1) Awareness phishing insuffisante (formation annuelle formelle, pas de simulations), (2) Pas de MFA sur les comptes admin domain (permettant Kerberoasting), (3) Segmentation réseau insuffisante (propagation vers 3 sites facilement), (4) EDR manquant sur serveurs critiques (Cobalt Strike non détecté), (5) Monitoring sortant limité (exfiltration 7 To non détectée sur 3 jours), (6) Backup connecté au domaine (risque chiffrement couvrable). Chaque pilier aurait pu limiter l'incident.",
            ok: true, pts: 25,
            fb: "Analyse de causes-racines exemplaire. Vous remontez de symptôme en cause, identifiez les défenses manquantes, et évitez le blame-the-user. C'est ce type d'analyse qui permet de reconstruire plus fort. Le rapport Stadler post-2020 suit cette logique.",
            legal: "NIST SP 800-61 + Manuel Ch. 20 — Analyse multi-couches.",
            critical: false, next: 5,
          },
          {
            text: "Se concentrer uniquement sur le ransomware DoppelPaymer — c'est l'attaquant final qu'il faut identifier.",
            ok: false, pts: -10,
            fb: "Vision trop étroite. DoppelPaymer est le déploiement final ; la cause-racine du succès de l'attaque est l'écosystème défensif lacunaire qui a permis aux attaquants d'avancer 10 jours sans détection. Un rapport centré uniquement sur le ransomware rate l'essentiel.",
            legal: "Manuel Ch. 20 — Analyser toute la kill chain, pas juste le payload final.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "📂 Le tri des fuites post-publication",
        situation: "Les attaquants, face au refus de payer, publient progressivement les 7 To sur leur leak site. Chaque semaine, un nouveau lot. Vous surveillez les publications pour : (1) évaluer ce qui a réellement fui, (2) anticiper les impacts (clients, fournisseurs), (3) notifier les partenaires concernés. Mais télécharger depuis le leak site pose des questions légales.",
        law: "<strong>Art. 143 CP</strong> — Réception de données soustraites.<br><strong>Compétences fedpol cybercriminalité</strong> — Accès autorisé aux leaks.<br><strong>Pratique interne Stadler</strong> — Procédure coordonnée.",
        question: "<strong>Comment organisez-vous la surveillance du leak ?</strong>",
        choices: [
          {
            text: "Télécharger les publications directement pour analyse immédiate.",
            ok: false, pts: -25,
            fb: "Illégal. Télécharger depuis un leak criminel = réception de données volées (Art. 143 CP) même pour la victime d'origine. La voie passe par fedpol cybercriminalité.",
            legal: "Art. 143 CP — Le statut de victime ne légitime pas l'accès.",
            critical: true, next: "end",
          },
          {
            text: "(1) Coordination fedpol cybercriminalité (infrastructure autorisée pour télécharger), (2) Analyse conjointe Stadler + fedpol des publications, (3) Tri par criticité : clients, fournisseurs, double usage, employés, (4) Notifications ciblées adaptées par catégorie, (5) Mise à jour hebdomadaire du rapport d'impact, (6) Préservation forensique pour enquête pénale en cours.",
            ok: true, pts: 25,
            fb: "Stratégie légalement irréprochable et opérationnellement efficace. La chaîne fedpol→Stadler garantit la légalité tout en permettant la gestion proactive de l'impact. C'est la pratique moderne des grandes entreprises suisses victimes.",
            legal: "Compétences fedpol + Art. 184 CPP + Pratique doctrine 2024.",
            critical: false, next: 6,
          },
          {
            text: "Ignorer les publications — on ne peut rien y faire de toute façon.",
            ok: false, pts: -20,
            fb: "Passivité dangereuse. Ne pas surveiller = ne pas pouvoir anticiper les impacts, ni notifier les parties affectées (clients dont les données ont fui). Les obligations LPD 2023 exigent une connaissance active de l'exposition réelle.",
            legal: "LPD 2023 Art. 24 — Obligation de connaître précisément ce qui a fui pour notifier efficacement.",
            critical: false, next: 6,
          },
        ],
      },
      {
        phase: "🏗 Le plan de reconstruction défensive",
        situation: "Stadler investit 35M CHF sur 2 ans dans la refonte sécuritaire. Le CEO demande un plan d'amélioration en 10 points actionnables, avec chiffrage et timing. Vous avez carte blanche sur la technique, contraintes business : maintenir production ferroviaire continue.",
        law: "<strong>NIST CSF</strong> — Cadre de référence.<br><strong>CIS Controls v8</strong> — Top priorités.<br><strong>IEC 62443</strong> — Cybersécurité industrielle (OT/IT).",
        question: "<strong>Quelle structure de plan proposez-vous ?</strong>",
        choices: [
          {
            text: "10 points tous égaux en priorité, déployés simultanément pour aller vite.",
            ok: false, pts: -15,
            fb: "Ingérable. Déployer 10 projets simultanément sur 35M CHF sans ordre = chaos organisationnel + dépendances ignorées. Un plan de refonte doit être séquencé selon les dépendances techniques et les risques.",
            legal: "Pratique PMO — Séquencement sur les risques.",
            critical: false, next: 7,
          },
          {
            text: "Plan séquencé en 3 phases : PHASE 1 (0-6 mois, urgent) : MFA universel, EDR/XDR, segmentation réseau IT/OT, SOC 24/7, patching discipline. PHASE 2 (6-18 mois) : Zero Trust architecture, IEC 62443 sur production, Red Team quarterly, GRC tooling, supply chain audits. PHASE 3 (18-24 mois) : Resilience / DRP, exercices de crise, certification ISO 27001, intégration cybersécurité contrats commerciaux.",
            ok: true, pts: 25,
            fb: "Plan structuré exemplaire. Phase 1 adresse les failles critiques de l'incident, Phase 2 transforme l'architecture, Phase 3 institutionnalise la maturité. Les dépendances sont respectées (impossible de faire Zero Trust avant d'avoir segmenté). IEC 62443 reflète la spécificité industrielle de Stadler.",
            legal: "NIST CSF + IEC 62443 + CIS Controls v8 — Plan industriel adapté.",
            critical: false, next: 7,
          },
          {
            text: "Sous-traiter entièrement la cybersécurité à un MSSP global.",
            ok: false, pts: -25,
            fb: "Risque stratégique. Externaliser TOUTE la cyber d'une entreprise industrielle critique = perte de souveraineté sur des données sensibles (biens double usage !), dépendance au MSSP, absence de compétences internes. Un mix interne/externe est la norme.",
            legal: "LFMG + Pratique industrielle — Certaines fonctions doivent rester internes.",
            critical: false, next: 7,
          },
        ],
      },
      {
        phase: "⚖️ Les suites judiciaires",
        situation: "fedpol a identifié plusieurs suspects (opérateurs présumés de DoppelPaymer) en Russie et Ukraine. Une procédure pénale est ouverte en Suisse, mais l'extradition est peu probable. Stadler peut se constituer partie civile pour obtenir des dommages-intérêts si condamnation. Votre expertise technique est sollicitée pour le dossier MP.",
        law: "<strong>Art. 115 CPP</strong> — Plaignant.<br><strong>Art. 122 CPP</strong> — Conclusions civiles au pénal.<br><strong>Art. 182 CPP</strong> — Expertise.<br><strong>Art. 143bis + 144bis + 156 CP</strong> — Infractions retenues.",
        question: "<strong>Comment structurez-vous votre expertise pour le MP ?</strong>",
        choices: [
          {
            text: "Rapport très technique centré sur la preuve d'intrusion, laissant au MP la qualification pénale.",
            ok: true, pts: 20,
            fb: "Approche correcte pour un rapport d'expertise. L'expert documente les faits techniques (IoC, kill chain, dommages) avec précision. La qualification pénale (quelle infraction) relève du MP. Votre rôle : fournir LES preuves techniques solides.",
            legal: "Art. 182 CPP — L'expert décrit, le MP qualifie.",
            critical: false, next: "end",
          },
          {
            text: "Rapport complet avec : (A) reconstruction forensique de la kill chain (timeline + IoC + preuves), (B) évaluation chiffrée du dommage direct (reconstruction : 35M, production arrêtée : 12M, conseil : 4M), (C) évaluation du dommage indirect (réputation, contrats perdus), (D) identification des vulnérabilités pré-existantes (pour ventilation de responsabilité éventuelle), (E) évaluation des mesures postérieures (diligence démontrée). Structure adaptée à la constitution partie civile ET à la défense en cas de contestation.",
            ok: true, pts: 25,
            fb: "Expertise de grande valeur. Elle sert à la fois le pénal (preuve contre attaquants) et le civil (dommages-intérêts). L'identification des vulnérabilités pré-existantes est honnête — elle évite qu'un assureur ou adversaire conteste 100% du chiffre.",
            legal: "Art. 122 + 182 CPP + Pratique civile — Expertise multi-usage.",
            critical: false, next: "end",
          },
          {
            text: "Préparer deux rapports différents : un pour le MP, un pour la défense Stadler, avec des conclusions adaptées à chacun.",
            ok: false, pts: -30,
            fb: "Violation grave de l'éthique d'expert. Un expert produit UN rapport technique neutre, pas des versions « orientées » selon le destinataire. Deux rapports divergents = parjure possible + radiation.",
            legal: "Art. 182 CPP + Code déontologie — Un expert, un rapport.",
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
    alertLevel: "📢 FUITE CONFIRMÉE — 800'000 clients exposés · PFPDT attend votre appel",
    objectives: [
      { icon: "🔍", text: "Qualifier correctement l'étendue réelle de l'exfiltration" },
      { icon: "📣", text: "Respecter le délai de notification PFPDT (LPD 2023)" },
      { icon: "🛡", text: "Gérer la communication envers les clients concernés" },
    ],
    debrief: "<p>L'affaire Comparis 2021 illustre le dilemme classique du ransomware moderne : <strong>double extorsion</strong> (chiffrement + menace de publication). Comparis a choisi de refuser de payer tout en notifiant rapidement le PFPDT et en communiquant aux clients.</p><p>La décision clé : <strong>qualifier précisément les données exfiltrées</strong> avant la communication. Dire « peut-être des données clients » crée plus de panique qu'un inventaire précis. La rigueur forensique est au service de la qualité de communication.</p><p><strong>Référence CH</strong> : Comparis.ch, juillet 2021 — ransomware Hive, données de 800'000+ clients exposées. Art. 24 LPD 2023 (applicable rétrospectivement aux nouvelles obligations) — notification PFPDT. ATF 148 IV 432 : les prétentions civiles des victimes d'une violation de données sont fondées sur Art. 28 CC (protection de la personnalité) + Art. 41 CO (responsabilité délictuelle). Le PFPDT a ouvert une procédure de recommandation contre Comparis.</p>",
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
            critical: false, next: 1,
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
            critical: false, next: 2,
          },
          {
            text: "Envoyer un email ciblé aux 47'000 clients identifiés, décrivant précisément les données concernées, les actions à prendre, et un lien vers FAQ détaillée.",
            ok: true, pts: 20,
            fb: "Approche correcte. La communication ciblée, précise et actionnable respecte le principe de proportionnalité et maximise l'efficacité pour les personnes réellement en risque.",
            legal: "LPD 2023 Art. 24 al. 3 — Information des personnes concernées, proportionnelle au risque.",
            critical: false, next: 2,
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
      {
        phase: "🔐 Le credential stuffing massif",
        situation: "72 heures après la publication des identifiants sur le leak site Hive, votre équipe observe un pic massif de tentatives de connexion sur Comparis depuis des IP variées (90'000 tentatives/h). C'est du <strong>credential stuffing</strong> : les attaquants testent les couples email/hash sur d'autres services. Les CSO de Swisscom, Swiss Post et plusieurs banques vous contactent — ils voient aussi des tentatives sur leurs propres services avec les mêmes emails.",
        law: "<strong>Art. 143bis CP</strong> — Accès indu (même en cas de crédentials valides obtenus illicitement).<br><strong>MITRE ATT&CK T1110.004</strong> — Credential Stuffing.<br><strong>Bonnes pratiques OWASP</strong> — Rate limiting, détection anomalie, forced password reset.",
        question: "<strong>Quelle réponse coordonnée mettez-vous en place ?</strong>",
        choices: [
          {
            text: "Bloquer tous les IPs détectées au firewall et attendre que ça passe.",
            ok: false, pts: -20,
            fb: "Réaction isolationniste inefficace. Les attaquants utilisent des botnets avec IP rotatifs (dizaines de milliers) — bloquer est un jeu du chat et de la souris perdu. Par ailleurs, Comparis ne peut pas protéger Swisscom et les banques en se contentant de bloquer chez soi. Réponse coordonnée requise.",
            legal: "OWASP — Le blocage IP seul n'arrête pas un botnet moderne.",
            critical: false, next: 3,
          },
          {
            text: "(1) Chez Comparis : force-reset des 47'000 mots de passe + MFA obligatoire, rate limiting agressif, CAPTCHA. (2) Partage des hashes de mots de passe via fedpol avec Swisscom, banques, Swiss Post pour détection précoce. (3) Alerte GovCERT + NCSC pour diffusion communauté. (4) Communication publique sur le risque de credential stuffing + recommandation « have you been pwned » aux utilisateurs.",
            ok: true, pts: 25,
            fb: "Réponse de classe exemplaire. Mesures internes (reset + MFA + rate limiting) + coopération inter-entreprises + coordination CERT + communication publique. C'est exactement la chaîne de réponse que Comparis a coordonnée en 2021.",
            legal: "LPD 2023 Art. 8 + GovCERT/NCSC + pratique inter-banques — Réponse coordonnée credential stuffing.",
            critical: false, next: 3,
          },
          {
            text: "Demander publiquement à tous les internautes suisses de changer leurs mots de passe partout.",
            ok: false, pts: -15,
            fb: "Panique injustifiée. Le credential stuffing concerne UNIQUEMENT les emails dont le hash a fuité (les 47'000 clients Comparis). Créer une panique nationale = saturer les services de support des autres entreprises sans bénéfice proportionnel. Cible : les concernés.",
            legal: "LPD 2023 + principe proportionnalité — Message adapté à la population affectée.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "⚖️ La question du ransom",
        situation: "Hive propose, en parallèle de leur publication publique, une négociation privée : ils supprimeront les 8 Go restants (non encore publiés) contre 1M USD en BTC. Le CA de Comparis est divisé : (a) certains administrateurs veulent payer pour limiter les dégâts réputationnels futurs, (b) le CEO et le CISO refusent. On vous demande votre avis technique.",
        law: "<strong>GovCERT 2024</strong> — Position officielle de non-paiement.<br><strong>SECO Sanctions</strong> — Hive potentiellement listé.<br><strong>OFAC Advisory 2021</strong> — Sanctions ransomware.<br><strong>Art. 305bis CP</strong> — Blanchiment potentiel.",
        question: "<strong>Quel est votre avis technique au CA ?</strong>",
        choices: [
          {
            text: "« Payer 1M USD est peu cher pour éviter la publication des 8 Go restants. Recommandation : accepter. »",
            ok: false, pts: -30,
            fb: "Mauvaise analyse technique ET juridique. (1) Hive a un historique de non-respect de ses promesses (publication quand même dans plusieurs cas). (2) Hive est sur la surveillance SECO et OFAC — payer peut déclencher des sanctions suisses. (3) Payer finance le modèle et invite de nouvelles attaques contre Comparis et d'autres.",
            legal: "GovCERT + SECO + OFAC — Recommandation unanime de non-paiement.",
            critical: true, next: "end",
          },
          {
            text: "« Recommandation technique de ne pas payer : (1) Hive ne respecte pas systématiquement ses engagements (historique), (2) risque sanctions SECO/OFAC, (3) les données publiées servent déjà à du credential stuffing — payer ne rend pas les fuites précédentes inaccessibles, (4) payer signale à d'autres groupes que Comparis est payable, (5) recommandation : investir équivalent dans monitoring et durcissement. »",
            ok: true, pts: 25,
            fb: "Analyse technique et éthique complète. Vous fournissez au CA les éléments pour une décision informée. C'est la position qu'a tenue Comparis en 2021 et qui a protégé l'entreprise sur le long terme.",
            legal: "GovCERT/NCSC + SECO + OFAC 2021 Advisory — Non-paiement documenté.",
            critical: false, next: 4,
          },
          {
            text: "« Cette question est purement business, pas technique. Le CA décide seul. »",
            ok: false, pts: -15,
            fb: "Esquive. L'expert technique a un avis crucial à donner : probabilité que Hive respecte, risque technique de nouvelle attaque après paiement, conséquences techniques des sanctions. Se défausser = manquement au rôle d'expert consultant.",
            legal: "Art. 184 CPP + Déontologie conseil — L'expert éclaire la décision.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "🛡 L'analyse post-mortem",
        situation: "Quatre mois après, Comparis commande un audit complet pour identifier la cause racine. Votre analyse révèle : (1) vecteur initial = phishing + credential reuse par un admin partenaire externe, (2) mouvement latéral via un compte de service AD sans MFA, (3) exfiltration lente sur 12 jours via rclone vers backup illégitime (cloud Wasabi), (4) absence de DLP sur les flux sortants. Le CISO vous demande les 5 recommandations TOP priorité.",
        law: "<strong>NIST CSF</strong> — Identify, Protect, Detect, Respond, Recover.<br><strong>CIS Controls v8</strong> — Top 18.<br><strong>LPD 2023 Art. 8</strong> — Mesures appropriées.<br><strong>OWASP DLP</strong>.",
        question: "<strong>Quelles sont vos 5 recommandations prioritaires ?</strong>",
        choices: [
          {
            text: "1. Firewalls plus puissants, 2. Plus de pare-feu, 3. Antivirus premium, 4. Chiffrement fort, 5. Meilleur WiFi.",
            ok: false, pts: -15,
            fb: "Focus exclusif sur le périmètre qui n'est pas la cause racine. L'attaque est passée par phishing + credentials. Les firewalls et antivirus n'auraient rien arrêté. Diagnostic correct → recommandations ciblées.",
            legal: "NIST CSF — Défense adaptée au vecteur réel, pas générique.",
            critical: false, next: "end",
          },
          {
            text: "(1) MFA obligatoire pour TOUS les comptes admin (internes + partenaires externes) — coût 50k, impact énorme. (2) Détection credentials compromis via abonnement HIBP API + monitoring proactif. (3) DLP sur flux sortants avec alertes sur gros volumes inhabituels. (4) Segmentation réseau avec Zero Trust pour comptes de service (pas d'accès réseau large). (5) Formation réaliste phishing (simulations trimestrielles). Total ~200k + récurrent.",
            ok: true, pts: 25,
            fb: "Recommandations ciblées sur la cause racine. Chaque mesure adresse un maillon spécifique de la kill chain (phishing → credentials → admin → lateral → exfiltration). Ratio impact/coût optimisé. C'est le plan qu'a adopté Comparis post-2021.",
            legal: "NIST CSF + CIS Controls v8 + LPD 2023 Art. 8 — Recommandations alignées sur les failles.",
            critical: false, next: "end",
          },
          {
            text: "Sous-traiter toute la cybersécurité à un MSSP pour 2M/an et ne plus rien gérer en interne.",
            ok: false, pts: -20,
            fb: "Déresponsabilisation. Externaliser TOUT = perdre la compréhension interne des risques + dépendance totale + absence de compétences pour challenger le MSSP. Un mix interne-externe est la norme.",
            legal: "Pratique SECO/FINMA — Responsabilité ne s'externalise pas.",
            critical: false, next: "end",
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
    alertLevel: "🌐 DARKWEB ACTIF — Suspect technophile · Les preuves sont sur le dark net",
    objectives: [
      { icon: "🚪", text: "Conduire la perquisition sans compromettre les preuves numériques" },
      { icon: "💻", text: "Gérer un environnement Tails (OS amnésique) — live forensics critique" },
      { icon: "₿", text: "Identifier et saisir les portefeuilles crypto (hot + cold wallets)" },
    ],
    debrief: "<p>L'opération Darkmarket de janvier 2021 a illustré la complexité des <strong>perquisitions chez des suspects technophiles</strong>. Contrairement à un suspect ordinaire, le vendeur darknet utilise généralement : Tails (OS live amnésique), conteneurs chiffrés, 2FA matériel, hot wallets actifs et cold wallets dormants.</p><p>La règle d'or : <strong>la porte ouverte, l'écran allumé</strong>. L'intervention doit arriver pendant que la machine est active — sinon tout est chiffré et inaccessible. Le timing d'intervention est aussi critique que la procédure forensique elle-même.</p><p><strong>Référence CH</strong> : DarkMarket (janvier 2021) — opération internationale menée depuis Oldenburg (DE), implication de fedpol/Swiss cantons. Art. 305bis CP — blanchiment d'argent via Bitcoin : l'utilisation de cryptomonnaies pour dissimuler des produits d'infractions constitue du blanchiment (ATF 149 IV 248, consid. 6.3 — dol éventuel suffisant). Chainalysis REACTOR et Crystal Blockchain sont les outils de traçage crypto utilisés par le MPC.</p>",
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
            critical: false, next: 1,
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
            critical: false, next: 3,
          },
          {
            text: "Accepter la mise sous scellés de tous les éléments, documenter l'état actuel (photos, hash RAM dump, hash des disques images), et préparer une argumentation détaillée pour le TMC sur la levée partielle.",
            ok: true, pts: 20,
            fb: "Approche correcte. Les scellés sont acceptés (suspension de l'analyse). La documentation pré-scellés est validée par hash. Devant le TMC, on défend la levée ciblée : carnet = objet patrimonial lié à l'enquête, pas sphère privée intime.",
            legal: "Art. 248 CPP + TF 1B_602/2020 — Acceptation des scellés + argumentation structurée devant TMC.",
            critical: false, next: 3,
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
      {
        phase: "🔗 La blockchain forensique",
        situation: "Les 4 adresses Bitcoin identifiées (2 hot + 2 cold) contiennent au total <strong>8.4 BTC</strong> (valeur ~340'000 CHF). Vous utilisez <strong>Chainalysis Reactor</strong> pour tracer ces adresses : elles ont reçu 127 transactions en provenance de vendeurs Darkmarket identifiés, et ont envoyé vers plusieurs exchanges centralisés (Binance, Kraken, Bitstamp). Le suspect semble cash-out via Bitstamp.",
        law: "<strong>Chainalysis / CipherTrace</strong> — Outils d'analyse blockchain légalement utilisés par LE.<br><strong>Art. 70 CP</strong> — Confiscation des valeurs patrimoniales illicites.<br><strong>Coopération Bitstamp (enregistré Luxembourg)</strong> — Via MLAT LU-CH ou direct (entité européenne).",
        question: "<strong>Comment exploitez-vous cette piste blockchain ?</strong>",
        choices: [
          {
            text: "Présenter Chainalysis comme preuve définitive que toute la richesse du suspect provient de Darkmarket.",
            ok: false, pts: -15,
            fb: "Sur-interprétation. Chainalysis identifie des probabilités d'attribution selon des heuristiques (clustering, behavioral analysis). Ce sont des INDICES forts, pas des preuves définitives. Formuler en « analyse heuristique blockchain indique forte probabilité » plutôt que « preuve ».",
            legal: "Manuel Ch. 29.3 — Les outils blockchain donnent des heuristiques, pas des preuves absolues.",
            critical: false, next: 4,
          },
          {
            text: "Rapport structuré : (1) Description méthodologique de l'analyse Chainalysis (avec limites documentées), (2) Timeline des 127 transactions entrantes depuis vendeurs Darkmarket identifiés, (3) Cash-out pattern via Bitstamp (KYC applicable = identification facilitée), (4) Requête formelle Bitstamp via fedpol pour obtenir les IBAN de retrait, (5) Qualification provisoire Art. 305bis CP (blanchiment) + Art. 19 LStup (trafic narcotiques Darkmarket) + Art. 70 CP (confiscation proposée).",
            ok: true, pts: 25,
            fb: "Exploitation forensique exemplaire. Vous combinez analyse on-chain (Chainalysis) et off-chain (KYC exchange) pour construire une chaîne complète. Les qualifications CP proposées sont cohérentes. Le rapport soutient une confiscation robuste.",
            legal: "Art. 70 + 305bis CP + LStup + Guide fedpol crypto — Stratégie confiscation complète.",
            critical: false, next: 4,
          },
          {
            text: "Ignorer la blockchain et se contenter des wallets saisis physiquement.",
            ok: false, pts: -20,
            fb: "Énorme perte. L'analyse blockchain révèle l'écosystème criminel complet (fournisseurs, acheteurs, voies de cash-out). C'est la colonne vertébrale de la preuve pour un vendeur Darkmarket. Ignorer = limiter l'affaire à la saisie physique, perdre l'ampleur criminelle.",
            legal: "Art. 139 CPP + Guide fedpol — La blockchain est une source de preuve primaire pour cybercrime financier.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "🌐 La coopération Europol",
        situation: "Europol a coordonné Darkmarket au niveau international (140 arrestations dans 14 pays). La Suisse partage ses résultats via J-CAT (Joint Cybercrime Action Taskforce). Vous recevez une demande d'Europol : pouvez-vous transmettre les données techniques de votre perquisition (IoC, wallets, méthodologie) pour corréler avec d'autres arrestations simultanées ?",
        law: "<strong>Convention Budapest Art. 27</strong> — Coopération cybercriminalité.<br><strong>Accord Suisse-Europol</strong> — Canaux d'échange fedpol → Europol.<br><strong>LPD 2023 + LEIS</strong> — Transferts données personnelles à l'étranger.<br><strong>Principe de spécialité</strong> — Usage limité à l'enquête déclarée.",
        question: "<strong>Comment gérez-vous le partage avec Europol ?</strong>",
        choices: [
          {
            text: "Transmettre directement les données brutes à Europol par email sécurisé.",
            ok: false, pts: -25,
            fb: "Non-conforme. Tout transfert international de données personnelles doit passer par les canaux officiels (fedpol → accord Europol). Un transfert direct par l'expert = violation LEIS + risque contestation LPD.",
            legal: "LEIS + LPD 2023 — Transferts via autorités centrales désignées.",
            critical: true, next: "end",
          },
          {
            text: "Coordination formelle : (1) Rapport structuré transmis à fedpol, (2) fedpol anonymise selon besoin et transmet à Europol via J-CAT, (3) Données techniques partagées : wallets Bitcoin, IoC serveurs Darkmarket, IP, hashes binaires — données pseudonymisables pour le fonctionnement de l'enquête, (4) Données nominatives du suspect : partagées uniquement selon principe de spécialité et nécessité.",
            ok: true, pts: 25,
            fb: "Canal légal respecté. La distinction entre données techniques (largement partageables) et données nominatives (sous conditions strictes) est la base de la coopération pénale moderne. Europol obtient ce qui est utile à ses corrélations sans exposer le suspect au-delà du nécessaire.",
            legal: "Convention Budapest + Accord Suisse-Europol + LEIS — Partage structuré.",
            critical: false, next: 5,
          },
          {
            text: "Refuser le partage — priorité à l'enquête suisse.",
            ok: false, pts: -15,
            fb: "Occasion manquée. Sans partage, l'enquête suisse reste isolée et rate des corrélations utiles (le suspect Darkmarket peut être lié à des vendeurs arrêtés à Berlin, Amsterdam ou Paris). La coopération est le cœur d'Europol.",
            legal: "Convention Budapest + Pratique J-CAT — Coopération attendue dans les affaires transnationales.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "📱 L'analyse du GrapheneOS",
        situation: "Le smartphone Pixel sous GrapheneOS (Android dur) est saisi sous scellés. Après décision TMC, vous pouvez l'analyser. GrapheneOS est un OS extrêmement sécurisé : chiffrement file-based par défaut, verrouillage hardware-backed (Titan M2), pas de backup cloud automatique. Comment extraire les données ?",
        law: "<strong>GrapheneOS Security Docs</strong> — Hardening vs Android standard.<br><strong>Titan M2</strong> — Élément sécurisé Google Pixel, protection bruteforce.<br><strong>Cellebrite / MSAB XRY</strong> — Outils commerciaux limités sur GrapheneOS.",
        question: "<strong>Quelle approche technique pour le smartphone ?</strong>",
        choices: [
          {
            text: "Forcer un brute-force du PIN via Cellebrite avant que le Titan M2 n'applique des délais.",
            ok: false, pts: -20,
            fb: "Largement irréaliste. Titan M2 applique des délais exponentiels dès la 5ème tentative incorrecte (minutes, puis heures). Un PIN à 6 chiffres prend littéralement des années à bruteforcer. Des outils comme Cellebrite Advanced ont des taux de succès limités sur GrapheneOS récent.",
            legal: "GrapheneOS + Titan M2 — Résistance au bruteforce éprouvée.",
            critical: false, next: 6,
          },
          {
            text: "(1) Analyse externe : métadonnées IMEI, numéros de série, apps installées (via adb backup si USB debugging activé — peu probable mais vérifier), (2) Si accès refusé : saisie physique + documentation, rapport d'impossibilité d'extraction technique honnête. (3) Recherche d'alternatives : backup sur NAS/cloud privé, comptes cloud associés via email/SIM. (4) Si jamais le suspect coopère volontairement plus tard → déverrouillage avec consentement écrit.",
            ok: true, pts: 25,
            fb: "Approche forensique honnête et structurée. Reconnaître les limites techniques est essentiel. Un rapport d'impossibilité bien rédigé (documentant les tentatives) vaut mieux qu'une fausse promesse. Les alternatives (backups ailleurs) sont à explorer systématiquement.",
            legal: "Manuel Ch. 28.4 + GrapheneOS Security — Limites techniques documentées honnêtement.",
            critical: false, next: 6,
          },
          {
            text: "Envoyer le Pixel à un labo NSO (ou équivalent) pour exploit de niveau étatique.",
            ok: false, pts: -30,
            fb: "Irréaliste et illégal. (1) Les exploits 0-day sont des armes classifiées, pas accessibles pour une affaire criminelle ordinaire. (2) NSO Group est sous sanctions US depuis 2021 — collaborer serait illégal pour une autorité suisse. (3) Le budget serait démesuré pour une affaire Darkmarket.",
            legal: "US BIS Entity List + Pratique fedpol — NSO et équivalents inaccessibles.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "💰 La confiscation crypto",
        situation: "Après jugement (condamnation 5 ans), le tribunal ordonne la confiscation des 8.4 BTC. Problème pratique : les 2 cold wallets YubiKey + carnet sont identifiés, mais les hot wallets ont reçu entre-temps 2.3 BTC supplémentaires (paiements de clients Darkmarket post-arrestation). Comment procédez-vous concrètement au transfert vers un wallet d'État ?",
        law: "<strong>Art. 70 CP</strong> — Confiscation des valeurs patrimoniales illicites.<br><strong>Art. 267 CPP</strong> — Exécution des décisions de séquestre/confiscation.<br><strong>Guide fedpol cryptomonnaies</strong> — Procédure technique.<br><strong>Cold wallet fedpol</strong> — Infrastructure Confederation.",
        question: "<strong>Comment exécutez-vous techniquement la confiscation ?</strong>",
        choices: [
          {
            text: "Utiliser les clés privées extraites pour transférer les BTC vers votre propre wallet d'abord, puis vers le wallet d'État.",
            ok: false, pts: -30,
            fb: "Violation grave. Transférer vers son wallet personnel avant = détournement de fonds publics, même temporaire. La procédure exige un transfert direct vers le wallet fedpol officiel, en présence de témoins et documenté.",
            legal: "Art. 152 CP + Pratique fedpol — Transfert direct vers wallet officiel.",
            critical: true, next: "end",
          },
          {
            text: "(1) Cérémonie de transfert multi-parties : en présence MP + 2 techniciens fedpol + audit vidéo, (2) Utilisation des clés séquestrées pour signer une transaction vers l'adresse cold wallet fedpol (multi-sig 3-of-5), (3) Documentation cryptographique (txhash, blocs de confirmation), (4) Attestation de remise au DFF (Département fédéral finances) qui gère la revente éventuelle, (5) Sur les 2.3 BTC additionnels reçus post-arrestation : notification supplémentaire au MP pour extension de confiscation (saisie accessoire).",
            ok: true, pts: 25,
            fb: "Procédure exécutive exemplaire. Multi-parties + documentation + multi-sig + traçabilité = chaîne de custody préservée pour les fonds numériques. Le traitement des fonds additionnels post-arrestation évite qu'ils restent accessibles aux complices.",
            legal: "Art. 70 + 267 CPP + Guide fedpol 2023 — Procédure crypto canonique.",
            critical: false, next: 7,
          },
          {
            text: "Laisser les BTC sur les wallets saisis et notifier Bitstamp pour blocage côté exchange.",
            ok: false, pts: -20,
            fb: "Insuffisant. Les BTC sur les wallets privés ne sont pas exposés à Bitstamp (qui ne contrôle que son propre exchange). Laisser sur les wallets saisis = risque qu'un complice avec copie des seed phrases vide les wallets. Le transfert vers wallet fedpol est OBLIGATOIRE.",
            legal: "Art. 267 CPP — Exécution physique/numérique du séquestre.",
            critical: false, next: 7,
          },
        ],
      },
      {
        phase: "📊 Le rapport final Europol",
        situation: "Un an après l'opération, Europol publie son rapport d'évaluation Darkmarket 2021. Elle sollicite la contribution suisse pour un chapitre dédié aux arrestations helvétiques. Votre rapport (version appropriée au partage public) doit illustrer la contribution suisse sans compromettre les procédures en cours.",
        law: "<strong>LTrans</strong> — Publication/caviardage.<br><strong>Coopération Europol</strong> — Publication coordonnée internationale.<br><strong>Art. 320 CP</strong> — Secret de fonction.",
        question: "<strong>Quelle contribution rédigez-vous pour le rapport Europol ?</strong>",
        choices: [
          {
            text: "Détail complet de l'opération suisse : noms, adresses, wallets exacts, méthodes spécifiques.",
            ok: false, pts: -25,
            fb: "Violation secret de fonction + vie privée. Même si la condamnation est définitive, les détails nominatifs ne sont pas à publier dans un rapport international public. De plus, les méthodes spécifiques (techniques d'extraction) aideraient les futurs criminels à les contourner.",
            legal: "Art. 320 CP + LPD 2023 Art. 8 — Minimisation + secret de fonction.",
            critical: true, next: "end",
          },
          {
            text: "Contribution structurée : (A) Contexte suisse Darkmarket (anonymisé), (B) Méthodologie générique (capture RAM pour Tails, analyse blockchain, coopération internationale), (C) Résultats quantifiés (nombre d'arrestations, volume crypto confisqué, ampleur trafic démantelé), (D) Leçons apprises et recommandations aux collègues internationaux. Pas de détails nominatifs ni techniques spécifiques compromettants.",
            ok: true, pts: 25,
            fb: "Contribution internationale exemplaire. Elle valorise l'expertise suisse (méthodologie Tails, techniques blockchain) sans compromettre vie privée ni sécurité opérationnelle future. C'est exactement l'équilibre qu'Europol et la communauté DFIR internationale attendent.",
            legal: "LTrans + Art. 320 CP + Pratique Europol — Partage structuré anonymisé.",
            critical: false, next: "end",
          },
          {
            text: "Refuser de contribuer pour préserver la confidentialité totale.",
            ok: false, pts: -15,
            fb: "Dommage. La contribution suisse à Europol renforce la position du pays dans les réseaux internationaux de DFIR et contribue à la lutte collective contre le cybercrime. La capitalisation anonymisée est possible et bénéfique.",
            legal: "Coopération Europol — Contribution attendue des États membres.",
            critical: false, next: "end",
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
    alertLevel: "🎓 72H AVANT LA RENTRÉE — Systèmes universitaires chiffrés · 30'000 étudiants concernés",
    objectives: [
      { icon: "🚨", text: "Arbitrer l'urgence opérationnelle vs la préservation forensique" },
      { icon: "🔍", text: "Identifier le vecteur (VPN privé en télétravail)" },
      { icon: "📣", text: "Gérer la communication quand les données débarquent sur le darknet" },
    ],
    debrief: "<p>L'attaque de l'Université de Neuchâtel illustre un piège classique : le <strong>travail hybride</strong> a forcé les institutions à ouvrir leurs réseaux à des équipements personnels mal sécurisés. Le VPN, conçu comme une solution, est devenu le vecteur principal d'intrusion.</p><p>Le deuxième enseignement est la <strong>portée systémique</strong> de la fuite : les données publiées contenaient des contrats Fedpol, DDPS, Syngenta. Une université n'est pas qu'un campus — c'est un nœud de données sensibles qui dépasse largement sa mission académique.</p><p><strong>Référence CH</strong> : UniNE, mars 2022 — ransomware pendant la période d'examens. LPD 2023 Art. 24 : données personnelles d'étudiants et de chercheurs (données sensibles si santé ou origine). ATF 147 IV 16 (2020) — irrecevabilité des preuves numériques portant atteinte à la protection des données. La Convention Budapest Art. 29 a été utilisée pour la conservation urgente des preuves avant notification des fournisseurs d'accès étrangers.</p>",
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
            critical: false, next: 2,
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
            critical: false, next: 2,
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
            critical: false, next: 3,
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
      {
        phase: "🔬 L'analyse du malware Conti",
        situation: "L'équipe DFIR analyse les binaires Conti récupérés. Conti est un ransomware RaaS d'origine russe, associé au groupe Wizard Spider (ex-TrickBot). TTPs observés : (1) déploiement après lateral movement via Cobalt Strike (persistance 8 jours avant chiffrement), (2) ChaCha20 + RSA-4096 pour chiffrement fichiers, (3) ciblage spécifique des backups (suppression Shadow Copies + vssadmin), (4) kill switch automatique si locale CIS russe détectée. Les similitudes avec Ryuk sont frappantes.",
        law: "<strong>MITRE ATT&CK G0102</strong> — Wizard Spider.<br><strong>MITRE ATT&CK S0575</strong> — Conti.<br><strong>CISA AA21-265A</strong> — Alerte Conti ransomware.<br><strong>GovCERT advisory</strong> — Protection contre Conti.",
        question: "<strong>Comment qualifiez-vous Conti dans votre rapport au rectorat et au canton ?</strong>",
        choices: [
          {
            text: "« Un ransomware comme les autres — on reconstruit et on passe à autre chose. »",
            ok: false, pts: -20,
            fb: "Banalisation dangereuse. Conti n'est pas un ransomware générique : c'est un RaaS étatique-adjacent avec des capacités d'APT. Le minimiser sous-estime : (1) le risque de données exposées à long terme, (2) la persistance potentielle résiduelle, (3) l'implication de ressources sophistiquées. Rapport inadapté au destinataire.",
            legal: "Pratique DFIR — Qualifier l'adversaire est essentiel pour calibrer la réponse.",
            critical: false, next: 4,
          },
          {
            text: "« Conti est un ransomware-as-a-service opéré par le groupe Wizard Spider (ex-TrickBot), caractérisé par : sophistication d'APT, lien avec écosystème cybercriminel russophone, méthodologie double extorsion (chiffrement + leak), historique de ciblage secteur santé et éducation. Implications : persistance possible malgré remédiation partielle, risque de re-ciblage, nécessité coopération GovCERT + fedpol cybercriminalité. »",
            ok: true, pts: 25,
            fb: "Qualification complète et contextualisée. Vous fournissez les informations dont le rectorat + canton ont besoin pour prendre des décisions stratégiques (budget, communication, coopération). C'est l'approche qu'a adoptée l'UniNE en 2022.",
            legal: "CISA + GovCERT + MITRE ATT&CK — Qualification adversaire standard.",
            critical: false, next: 4,
          },
          {
            text: "« Cyberattaque de niveau militaire étatique russe » — dramatiser pour obtenir plus de budget.",
            ok: false, pts: -25,
            fb: "Exagération technique et diplomatique. Conti est opéré par un groupe cybercriminel tolérant, pas un service étatique. Dramatiser = attribuer à un État = problème diplomatique + discrédit futur si l'attribution est affinée vers « crime organisé ». Rester factuel.",
            legal: "Manuel Ch. 29.3 + Art. 54 Cst. — Neutralité technique.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "🎓 La protection des données étudiantes",
        situation: "Parmi les 26 Go publiés : <strong>photos d'étudiants (6'400 visages identifiables)</strong>, données médicales AI (arrêts maladie, certificats), évaluations académiques, et des dossiers de comités de discipline confidentiels. Certains étudiants sont mineurs (inscriptions passerelle 16-18 ans). D'autres ont le statut d'étudiants en programme d'asile ou viennent de pays à risque (Iran, Chine).",
        law: "<strong>LPD 2023 Art. 5</strong> — Données sensibles (santé, biométriques).<br><strong>LPD 2023 Art. 7</strong> — Protection spéciale des mineurs.<br><strong>CEDH Art. 8</strong> — Vie privée.<br><strong>Convention 108+ du Conseil de l'Europe</strong>.<br><strong>Risque vie étudiants de pays autoritaires</strong>.",
        question: "<strong>Quelle approche pour les catégories d'étudiants vulnérables ?</strong>",
        choices: [
          {
            text: "Notification email standard à tous les 6'400 étudiants concernés — traitement égalitaire.",
            ok: false, pts: -25,
            fb: "L'égalité formelle ignore les risques différenciés. Un étudiant iranien dont les données sont publiées depuis un serveur piraté pose un risque de représailles que n'a pas un étudiant suisse. L'approche différenciée n'est pas discriminatoire — elle protège.",
            legal: "Convention 108+ + doctrine CEDH — Protection proportionnée au risque.",
            critical: false, next: 5,
          },
          {
            text: "Stratégie différenciée : (1) 6'000 étudiants standard : notification email + conseil anti-phishing + monitoring identité gratuit 12 mois, (2) Étudiants mineurs : notification via tuteurs légaux + accompagnement psycho si photos, (3) Étudiants pays à risque (~200) : entretien individuel confidentiel + assistance d'un·e DPO dédié·e + évaluation menace avec fedpol Service protection des réfugiés, (4) Comités discipline : notification nominale + support juridique si nécessaire.",
            ok: true, pts: 25,
            fb: "Stratégie exemplaire. La différenciation reflète les risques réels. Pour les étudiants de pays autoritaires, la publication peut constituer un risque vital (pour eux ou leur famille restée au pays). Traiter ces cas comme « un incident LPD parmi d'autres » est irresponsable.",
            legal: "LPD 2023 Art. 5/7 + Convention 108+ + Doctrine fedpol réfugiés — Protection différenciée.",
            critical: false, next: 5,
          },
          {
            text: "Publier un communiqué de presse détaillé listant les catégories pour que les étudiants concernés se manifestent.",
            ok: false, pts: -30,
            fb: "Catastrophe potentielle. Publier publiquement « des données d'étudiants iraniens et chinois ont fuité » signale aux services de ces pays qu'il y a matière à enquêter. Confirmer publiquement ces catégories = amplifier le risque pour les personnes concernées.",
            legal: "LPD 2023 Art. 5/7 + Principe précaution — Confirmation publique déconseillée.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "💾 La restauration depuis les backups",
        situation: "Bonne nouvelle : l'UniNE avait des backups air-gapped sur infrastructure séparée de la production. Ils ont survécu à Conti (pas connectés au domaine). 700 des 800 machines peuvent être restaurées. 100 machines critiques (serveurs recherche ; certains données fragiles depuis années) ont des backups plus anciens (2-3 mois). Le rectorat décide : restauration complète depuis les backups propres.",
        law: "<strong>GovCERT Guide restauration</strong> — Vérification + propre avant reconnexion.<br><strong>Manuel Ch. 21</strong> — Remédiation post-ransomware.<br><strong>CISA Recovery Plan</strong>.",
        question: "<strong>Quelle procédure de restauration appliquez-vous ?</strong>",
        choices: [
          {
            text: "Restaurer directement depuis les backups sur l'infrastructure existante pour gagner du temps.",
            ok: false, pts: -30,
            fb: "Erreur classique. Restaurer sur du matériel potentiellement encore compromis (Conti peut avoir laissé des backdoors dans le firmware ou des implants résiduels) = réinfection garantie. Il faut reformater d'abord.",
            legal: "GovCERT + CISA Recovery — Jamais de restauration sur matériel suspect sans reformatage.",
            critical: true, next: "end",
          },
          {
            text: "Procédure en phases : (1) Reformatage complet des 800 machines + flash firmware (BIOS/UEFI) quand possible, (2) Réinstallation OS depuis images maîtres propres, (3) Vérification intégrité des backups par hash (anti-corruption), (4) Restauration des données par lots avec vérification à chaque palier, (5) Reconnexion réseau progressive avec monitoring renforcé, (6) EDR obligatoire sur TOUS les postes avant reconnexion, (7) Rotation complète des mots de passe + certificats domain, (8) Désactivation VPN personnels, migration matériel institutionnel.",
            ok: true, pts: 25,
            fb: "Procédure post-ransomware canonique. Chaque étape adresse un risque : firmware compromis → reflash, backup corrompu → hash, réinfection → EDR, vecteur initial → fin des VPN perso. C'est un plan de 10-14 jours réaliste correspondant à la promesse faite au rectorat.",
            legal: "GovCERT + CISA Recovery + Manuel Ch. 21 — Procédure standard.",
            critical: false, next: 6,
          },
          {
            text: "Abandonner les 100 machines avec backups anciens — perte acceptable.",
            ok: false, pts: -15,
            fb: "Décision trop brutale. Ces 100 machines peuvent contenir des données de recherche irremplaçables (thèses en cours, données de laboratoires). L'approche : restauration avec les backups disponibles (même anciens) + travail de reconstruction manuel avec les chercheurs pour les 2-3 mois de données perdues. Pas d'abandon.",
            legal: "Principe de proportionnalité — Toute donnée récupérable doit être récupérée.",
            critical: false, next: 6,
          },
        ],
      },
      {
        phase: "📚 Les leçons pour le secteur académique suisse",
        situation: "L'UniNE partage son retour d'expérience avec <strong>swissuniversities</strong> (conférence des recteurs) et <strong>SWITCH</strong> (CERT académique suisse). L'objectif : éviter que les autres universités suisses (EPFL, ETH, UNIGE, UNIL, UNIBE...) subissent la même attaque. Votre rapport REX doit être technique + actionnable + adapté à la spécificité académique.",
        law: "<strong>Convention 108+ + LPD 2023</strong> — Protection dans contexte éducatif.<br><strong>SWITCH-CERT</strong> — Partage d'IoC entre universités suisses.<br><strong>Programme ENISA</strong> — Cybersécurité du secteur académique européen.",
        question: "<strong>Quel format de REX pour la communauté académique ?</strong>",
        choices: [
          {
            text: "Présentation uniquement en interne à swissuniversities sans documentation écrite.",
            ok: false, pts: -15,
            fb: "Capitalisation insuffisante. Sans document écrit, les leçons se dilueront dans les changements de personnel. Les universités qui ne sont pas représentées à la réunion ne bénéficieront pas du partage. Un document structuré permet la réutilisation.",
            legal: "Principe de capitalisation — Écrit > oral seul.",
            critical: false, next: 7,
          },
          {
            text: "Package complet : (1) Rapport technique détaillé (confidentiel swissuniversities) : chronologie complète, IoC Conti, TTPs observés, faiblesses exploitées, (2) Résumé exécutif public (comm. rectorat) : principales leçons apprises, (3) Check-list actionnable pour DSI/CISO universitaires : contrôle VPN, segmentation, backups air-gapped, EDR, (4) IoC bundle STIX/TAXII pour SWITCH-CERT (détection précoce), (5) Présentation pédagogique ouverte pour formation des équipes IT academiques, (6) Offre d'accompagnement direct aux universités qui veulent audit similaire.",
            ok: true, pts: 25,
            fb: "Partage de retour d'expérience multi-niveau excellent. Chaque livrable s'adresse à une audience spécifique avec l'information adaptée. L'UniNE est devenue, après sa gestion transparente de 2022, une référence en cybersécurité académique en Suisse.",
            legal: "swissuniversities + SWITCH-CERT + ENISA Academic Security — Partage multi-niveau.",
            critical: false, next: 7,
          },
          {
            text: "Ne pas partager — exposer nos faiblesses pourrait nous rendre plus vulnérables à de futures attaques.",
            ok: false, pts: -25,
            fb: "Erreur stratégique + éthique. (1) Conti connaît déjà les faiblesses de l'UniNE. (2) Ne pas partager = laisser d'autres universités suisses subir la même attaque. (3) Le silence affaiblit collectivement l'écosystème académique suisse. La transparence entre institutions sœurs est le principe de base de la cyber-défense collective.",
            legal: "Principe de solidarité académique + SWITCH-CERT — Partage ou défaillance collective.",
            critical: false, next: 7,
          },
        ],
      },
      {
        phase: "🎙 La communication aux étudiants et enseignants",
        situation: "Mars 2022, 3 semaines après l'attaque. Les 2'500 étudiants + 400 enseignants sont en quasi-télétravail forcé. Les forums internes bruissent de rumeurs (données vendues à la mafia, autorités cachant la vérité, etc.). Le rectorat demande une session de communication live (assemblée virtuelle) avec Q&A ouvert. Vous êtes invité·e comme expert·e technique pour répondre aux questions.",
        law: "<strong>Art. 16 Cst.</strong> — Liberté d'expression et d'information.<br><strong>LPD 2023 Art. 27</strong> — Droit d'information sur le traitement.<br><strong>Art. 184 CPP</strong> — Expert en rôle pédagogique.",
        question: "<strong>Comment abordez-vous cette assemblée virtuelle ?</strong>",
        choices: [
          {
            text: "Refuser l'assemblée ouverte — trop imprévisible, préférer une vidéo préenregistrée soigneusement scriptée.",
            ok: false, pts: -15,
            fb: "Stratégie qui entretient la défiance. Une vidéo préenregistrée = « ils ne veulent pas répondre à nos vraies questions ». L'assemblée live avec Q&A, bien préparée, est le format qui restaure la confiance. Les étudiants et enseignants méritent un dialogue direct.",
            legal: "LPD 2023 Art. 27 + Principe de dialogue — Transparence active.",
            critical: false, next: "end",
          },
          {
            text: "Assemblée live avec : (1) Présentation technique claire (20 min) : quoi s'est passé, quelles données concernées, quelles mesures prises, (2) Q&A ouvert avec engagement à répondre honnêtement à toute question (sauf détails techniques compromettants), (3) Si question dépasse compétences : admettre et rediriger, (4) Écoute active des inquiétudes (pas seulement diffusion), (5) Engagement sur actions futures + suivi trimestriel, (6) Sous-titrage multilingue et enregistrement publié pour les absents.",
            ok: true, pts: 25,
            fb: "Approche exemplaire de communication crise académique. L'ouverture au dialogue + honnêteté sur les limites + engagement sur le futur = restauration de la confiance. Les universités qui ont adopté cette approche ont vu leur cohésion renforcée post-crise.",
            legal: "LPD 2023 Art. 27 + Doctrine UniNE 2022 — Dialogue ouvert et structuré.",
            critical: false, next: "end",
          },
          {
            text: "Accepter l'assemblée mais éviter les questions techniques en les renvoyant vers la DSI par email.",
            ok: false, pts: -10,
            fb: "Esquive qui nuit à l'objectif. L'expert technique est présent PRÉCISÉMENT pour répondre aux questions techniques devant la communauté. Renvoyer par email = refuser le dialogue public. Les étudiants et enseignants perçoivent immédiatement l'esquive.",
            legal: "Art. 184 CPP — L'expert vulgarise pour son audience directement.",
            critical: false, next: "end",
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
    alertLevel: "📡 FUITE MASSIVE SWISSCOM — 800'000+ clients · Les journalistes appellent déjà",
    objectives: [
      { icon: "🔗", text: "Reconstituer la chaîne de sous-traitance (CH → Genève → Tunisie)" },
      { icon: "⚖️", text: "Arbitrer la question de la communication publique (PFPDT + image)" },
      { icon: "🛡", text: "Qualifier correctement la « sensibilité » des données volées" },
    ],
    debrief: "<p>L'affaire Swisscom 2018 reste un cas d'école sur deux dimensions : la <strong>responsabilité en cascade de sous-traitance</strong>, et le <strong>rôle arbitral du PFPDT</strong>.</p><p>Swisscom avait initialement choisi de ne pas communiquer, qualifiant les données de « non sensibles » (une qualification juridique contestée par tous les experts depuis). Le PFPDT Adrian Lobsiger a exigé la communication publique, conformément au devoir légal d'information. La LPD 2023 a depuis intégré explicitement l'obligation de notification rapide — l'affaire Swisscom a été un des déclencheurs de cette réforme.</p><p><strong>Référence CH</strong> : Swisscom, janvier 2018 — 800'000 données clients volées via une vulnérabilité API. LPD 2023 Art. 9 (sous-traitance) — le partenaire commercial qui a exfiltré via une API mal sécurisée engage la responsabilité de Swisscom. ATF 4A_67/2023 (2024) — violation grave des règles anti-blanchiment et de sécurité = licenciement immédiat justifié. PFPDT recommandation 2018 : Swisscom a dû mettre en place un outil de vérification individuel pour les clients concernés.</p>",
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
            critical: false, next: 1,
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
            critical: false, next: 1,
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
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "📱 La gestion de la campagne SMS",
        situation: "Décision prise : notification par SMS aux 812'000 clients privés concernés. Problème technique : envoyer 812'000 SMS en quelques heures nécessite coordination avec l'opérateur de masse interne de Swisscom, et surtout gestion du pic massif d'appels au 444 qui suivra. Le centre d'appel estime recevoir ~200'000 appels dans les 48h. Comment préparer ?",
        law: "<strong>LPD 2023 Art. 24 al. 3</strong> — Information des personnes concernées.<br><strong>LTC Art. 43</strong> — Obligation de qualité de service.<br><strong>LPD 2023 Art. 28</strong> — Droit à l'information détaillée.",
        question: "<strong>Quelle organisation opérationnelle recommandez-vous ?</strong>",
        choices: [
          {
            text: "Envoyer tous les SMS en une seule vague pour que tous les clients soient informés simultanément.",
            ok: false, pts: -20,
            fb: "Saturation garantie. 812'000 SMS → 200'000 appels simultanés sur le 444. Service effondré pour TOUS (concernés et non-concernés). Les clients ne peuvent pas obtenir d'information = amplification de l'anxiété. Staging temporel obligatoire.",
            legal: "LTC Art. 43 — Qualité de service maintenue même en crise.",
            critical: false, next: 3,
          },
          {
            text: "Déploiement orchestré : (1) SMS en vagues sur 72h (ex: 80'000/h), (2) FAQ web détaillée disponible AVANT les SMS, (3) Renfort centre d'appel (staff temporaire + agents externes formés), (4) Chatbot IA pour questions fréquentes, (5) Priorisation des clients vulnérables (seniors, personnes isolées) pour les premières vagues. Coordination NOC Swisscom pour surveillance temps réel des capacités.",
            ok: true, pts: 25,
            fb: "Organisation opérationnelle exemplaire. Le staging temporel + FAQ en amont + chatbot + priorisation = prise en charge digne de chaque client. Les standards modernes de notification de masse (post-Swisscom 2018) sont exactement cela.",
            legal: "LPD 2023 Art. 24 + LTC Art. 43 + bonnes pratiques 2024.",
            critical: false, next: 3,
          },
          {
            text: "Envoyer uniquement un email générique (pas de SMS) car moins visible pour la presse.",
            ok: false, pts: -25,
            fb: "Contre-stratégie opaque. (1) Taux d'ouverture email bien plus faible que SMS (30% vs 98%). (2) Certains clients âgés n'ont pas d'email associé à leur compte. (3) Chercher à « cacher » la notification revient à nier son importance. Le PFPDT et le public verront la manœuvre.",
            legal: "LPD 2023 Art. 24 al. 3 — Information EFFECTIVE et appropriée.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🏛 Le contrôle des sous-traitants",
        situation: "Post-incident, Swisscom doit restructurer sa supervision des sous-traitants (plus de 300 partenaires actifs). Le PFPDT exige un plan d'action. La question : comment concrètement s'assurer qu'aucun futur cas « Tunis » ne se reproduise ? Vous êtes consulté comme expert sur la structure à mettre en place.",
        law: "<strong>LPD 2023 Art. 9</strong> — Obligations du responsable du traitement.<br><strong>ISO/IEC 27036</strong> — Sécurité des relations avec les fournisseurs.<br><strong>PFPDT Doctrine 2024</strong> — Contrôle des sous-traitants critiques.",
        question: "<strong>Quel dispositif de gouvernance mettez-vous en place ?</strong>",
        choices: [
          {
            text: "Interdire tout sous-traitant à l'étranger — seuls les Suisses peuvent manipuler les données.",
            ok: false, pts: -15,
            fb: "Irréaliste et contre-productif. Swisscom a 300+ sous-traitants, dont beaucoup sont en Europe ou au-delà pour des raisons légitimes (coût, compétences spécialisées). Et en principe, un sous-traitant européen RGPD peut être plus rigoureux qu'un petit acteur suisse. C'est le cadre contractuel + audit qui compte.",
            legal: "LPD 2023 + RGPD — Localisation ≠ sécurité.",
            critical: false, next: 4,
          },
          {
            text: "Dispositif structuré : (1) Classification des partenaires par sensibilité (accès données clients = catégorie critique), (2) Contrat-type avec clauses obligatoires (interdiction sous-sous-traitance sans approbation écrite, 2FA obligatoire, audit annuel, notification incidents < 24h), (3) Registre central des accès à la base clients avec révisions trimestrielles, (4) Audits techniques des sous-traitants critiques (2 fois/an), (5) Tests de compromission (red team) incluant les partenaires, (6) DPO dédié gestion sous-traitance.",
            ok: true, pts: 25,
            fb: "Dispositif complet et proportionné. Chaque niveau adresse un risque spécifique identifié dans l'incident 2018 (sous-sous-traitance non autorisée → clause interdictive, pas de 2FA → obligation contractuelle, pas d'audit → audit annuel). C'est ce type d'approche que la LPD 2023 Art. 9 exige implicitement.",
            legal: "LPD 2023 Art. 9 + ISO/IEC 27036 — Gouvernance sous-traitance structurée.",
            critical: false, next: 4,
          },
          {
            text: "Signer un contrat-type RGPD avec tous les partenaires et s'en remettre à leur autocertification.",
            ok: false, pts: -20,
            fb: "Insuffisant. Un contrat seul (sans audit ni monitoring) repose sur la bonne foi du sous-traitant. En 2017, la société genevoise avait probablement signé des clauses — elle n'en a pas moins transmis à la Tunisie sans autorisation. Les contrats sans contrôle sont du papier.",
            legal: "LPD 2023 Art. 9 + Doctrine PFPDT — Contrôle actif, pas confiance passive.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "📊 Le rapport PFPDT final",
        situation: "Trois mois après l'incident, vous rédigez le rapport final pour le PFPDT. Ce rapport sert à : (a) clore formellement la procédure PFPDT, (b) servir de référence pour la jurisprudence future, (c) alimenter les enseignements généraux du PFPDT. Le PFPDT Adrian Lobsiger a été transparent publiquement sur l'affaire — le rapport doit être à la hauteur.",
        law: "<strong>LPD 2023 Art. 49</strong> — Investigation PFPDT.<br><strong>LTrans</strong> — Publication potentielle.<br><strong>Rapport annuel PFPDT</strong> — Partage des cas instructifs.",
        question: "<strong>Quelle structure donnez-vous au rapport ?</strong>",
        choices: [
          {
            text: "Rapport minimaliste avec juste le strict nécessaire pour clore la procédure.",
            ok: false, pts: -10,
            fb: "Occasion manquée. Le PFPDT utilise les cas significatifs pour former et sensibiliser. Un rapport complet et pédagogique sert au-delà de cette affaire unique. Swisscom peut même transformer un incident en contribution positive à la communauté.",
            legal: "LPD 2023 Art. 58 + Mission PFPDT — Enseignements partagés.",
            critical: false, next: "end",
          },
          {
            text: "Rapport complet structuré : (A) Chronologie précise (T0 compromission → T+X notification → T+Y mesures), (B) Analyse causes racines multi-niveaux (Swisscom-Genève-Tunis), (C) Inventaire des mesures correctives déployées + chiffrage, (D) Retour d'expérience pédagogique pour autres entreprises, (E) Commentaire sur les améliorations réglementaires qui auraient aidé (anticipant LPD 2023). Proposition au PFPDT d'un résumé anonymisé pour son rapport annuel.",
            ok: true, pts: 25,
            fb: "Rapport exemplaire. Structure complète, vision multi-niveaux, dimension pédagogique. Ce type de rapport fait école — l'affaire Swisscom a directement inspiré certaines dispositions de la LPD 2023. Transformer un incident en amélioration structurelle sectorielle = marque de maturité.",
            legal: "LPD 2023 Art. 49/58 + Bonnes pratiques rapport PFPDT.",
            critical: false, next: "end",
          },
          {
            text: "Confidentialiser complètement le rapport — ne rien partager au-delà du PFPDT.",
            ok: false, pts: -15,
            fb: "Position défensive qui ignore la valeur collective. Un rapport partageable (anonymisé) sur les enseignements techniques et organisationnels profite à tout l'écosystème suisse. La confidentialité absolue prive les autres acteurs d'apprendre de vos erreurs.",
            legal: "LPD 2023 Art. 58 + Principe de capitalisation sectorielle.",
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
    alertLevel: "✈️ SYSTÈMES AÉROPORTUAIRES COMPROMIS — Fallback manuel · Vols en attente",
    objectives: [
      { icon: "🎯", text: "Arbitrer le maintien opérationnel vs la capture forensique" },
      { icon: "🛡", text: "Valider l'efficacité des air-gapped backups" },
      { icon: "📢", text: "Communiquer aux passagers + compagnies aériennes clients" },
    ],
    debrief: "<p>L'affaire Swissport 2022 a été un cas d'école de <strong>réponse réussie</strong> à un ransomware : contenu en 48h, 22 vols retardés seulement, reprise des opérations via fallback manuel et air-gapped backups. Swissport a refusé de payer, illustrant qu'une préparation sérieuse (backups isolés, procédures dégradées) rend le refus crédible.</p><p>BlackCat (aussi ALPHV, Noberus) était à l'époque remarquable pour être le <strong>premier ransomware codé en Rust</strong>, ce qui compliquait significativement l'analyse forensique classique. Les 1,6 To publiés sur leur leak site ont néanmoins été un coût réputationnel réel — même sans paiement, la <em>double extorsion</em> fait mal.</p><p><strong>Référence CH</strong> : Swissport AG, février 2022 — données RH et opérationnelles exfiltrées, groupe BlackCat/ALPHV. Art. 162 CP — secret professionnel (données RH = informations confidentielles). LMSI Art. 2 — protection des infrastructures critiques liées à l'aviation. Ordonnance sur la navigation aérienne — obligation de continuité des services aéroportuaires. Swissport gère les services au sol pour Swiss et Edelweiss à Zurich-Kloten.</p>",
    narrative: {
      success: "Le fallback manuel tient. 22 vols retardés de 3-20 minutes à Zurich, rien de plus. Les backups air-gapped permettent une restauration propre en 48h. Le refus du paiement tient, malgré la publication de 1,6 To sur le leak site BlackCat. Case study interne devenue référence chez les opérateurs aéroportuaires européens.",
      degraded: "Le fallback tient partiellement. Des retards importants sur 2-3 jours affectent plusieurs aéroports secondaires. Les compagnies aériennes clientes expriment leur mécontentement par écrit. La presse spécialisée (Aviation Week, Jet Service) couvre négativement la gestion de crise. L'image commerciale est entamée mais les opérations critiques sont préservées.",
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
            critical: false, next: 2,
          },
          {
            text: "(1) Monter les backups sur un environnement isolé (sandbox air-gap). (2) Scanner avec indicateurs BlackCat (hashes, YARA rules disponibles). (3) Vérifier l'intégrité de l'AD backup (comptes suspects, persistance). (4) Si clean : restaurer sur infrastructure propre ; sinon : utiliser un backup antérieur.",
            ok: true, pts: 25,
            fb: "Séquence correcte. Sandbox isolé = test sans risque. YARA rules BlackCat publiques depuis novembre 2021 = détection possible. Vérification AD = cruciale pour ransomware modernes. Si compromis : revenir à un backup antérieur, même si plus ancien.",
            legal: "GovCERT Guide ransomware 2022 + Manuel Ch. 24.3 — Validation backup en sandbox obligatoire avant restauration.",
            critical: false, next: 2,
          },
          {
            text: "Reconstruire tout de zéro sans restaurer — c'est plus sûr mais prendra 3 semaines.",
            ok: false, pts: -10,
            fb: "Conservateur à l'excès. 3 semaines d'impact opérationnel pour éviter une vérification qui prend 2-4h. Le coût opérationnel du choix est disproportionné alors que les outils de validation existent.",
            legal: "Principe de proportionnalité opérationnelle — La prudence ne justifie pas des délais disproportionnés.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🌍 La coordination internationale",
        situation: "Swissport opère dans 310 aéroports sur 50 pays. Les autorités locales de chaque pays veulent des informations. L'aviation civile américaine (FAA) et européenne (EASA) appellent. Chaque pays a son propre régulateur données (CNIL France, ICO UK, Garante Italie). Comment coordonner ?",
        law: "<strong>ICAO Security Manual Doc 8973</strong> — Coopération internationale aviation.<br><strong>RGPD Art. 33</strong> — Notification 72h européenne.<br><strong>LPD 2023</strong> — Notification suisse.<br><strong>One-Stop-Shop RGPD</strong> — CNIL désignée lead pour Swissport Europe.",
        question: "<strong>Quelle gouvernance de crise multi-juridictionnelle mettez-vous en place ?</strong>",
        choices: [
          {
            text: "Répondre individuellement à chaque régulateur national avec des détails spécifiques à leur juridiction.",
            ok: false, pts: -15,
            fb: "Chaos garanti. 50 pays × récits légèrement différents = risques d'incohérences, contradictions détectées par la presse, multiplication par 50 du coût opérationnel. Le one-stop-shop RGPD existe précisément pour éviter ce scénario en Europe.",
            legal: "RGPD Art. 56 — One-Stop-Shop via autorité chef de file.",
            critical: false, next: 3,
          },
          {
            text: "Structure coordonnée : (1) Cellule de crise unique avec représentants légaux multi-juridictions, (2) Communiqué unique multilingue (FR/EN/DE/IT/ES), (3) Notification lead regulator (CNIL pour l'UE via one-stop-shop), (4) LPD suisse au PFPDT, (5) Notifications spécifiques pays hors UE (US/UK/APAC), (6) FAQ commune pour compagnies aériennes clientes, (7) Point de contact central pour autorités aviation. Vérification légale croisée avant chaque communication.",
            ok: true, pts: 25,
            fb: "Gouvernance de crise exemplaire. Le one-stop-shop RGPD + notifications hors UE dédiées + canal unique autorités = cohérence et efficacité. Swissport a géré la crise 2022 sur ce modèle, ce qui a limité les sanctions cross-juridictions.",
            legal: "RGPD Art. 56 + LPD 2023 + ICAO Doc 8973 — Coordination multi-juridictionnelle structurée.",
            critical: false, next: 3,
          },
          {
            text: "Ne rien dire aux autorités étrangères — seule la Suisse est compétente puisque le siège est suisse.",
            ok: false, pts: -30,
            fb: "Faux juridiquement. Swissport opère dans 50 pays, ce qui déclenche des obligations locales dans chacun. Le RGPD s'applique dès qu'il y a des données de résidents UE (probable pour 310 aéroports). Ignorer = amendes cumulées pouvant atteindre 4% du CA mondial.",
            legal: "RGPD Art. 3 (territorialité) — Application extraterritoriale au traitement EU-related.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📢 La publication sur le leak site",
        situation: "BlackCat publie progressivement 1,6 To sur son leak site : passeports scannés de passagers (!), candidatures avec CV et entretiens, contrats commerciaux avec compagnies aériennes, documents sécurité aéroportuaire. Les passagers concernés (~400'000 passeports) sont inquiets. Les compagnies clientes menacent de résilier.",
        law: "<strong>LPD 2023 Art. 5</strong> — Données sensibles (passeports = identité forte).<br><strong>Art. 252 CP</strong> — Falsification documents identité (risque pour les personnes dont le passeport fuite).<br><strong>fedpol</strong> — Alerte identité.<br><strong>Schengen Information System</strong>.",
        question: "<strong>Quelle réponse coordonnée apportez-vous sur la fuite de passeports ?</strong>",
        choices: [
          {
            text: "Ne pas communiquer spécifiquement sur les passeports — les passagers s'inquièteront sans raison.",
            ok: false, pts: -25,
            fb: "Sous-estimation grave. Un passeport fuité = risque majeur de vol d'identité, ouverture de comptes bancaires frauduleux, voyages sous l'identité de la victime. C'est précisément le cas où la notification individuelle est obligatoire et où les autorités (fedpol pour CH, Interpol) doivent être impliquées.",
            legal: "LPD 2023 Art. 24 + Art. 252 CP + Alert fedpol identité.",
            critical: true, next: "end",
          },
          {
            text: "Plan d'action structuré : (1) Notification individuelle à chaque personne dont le passeport a fuité, (2) Coordination fedpol Service d'identité — inscription d'alerte sur les passeports concernés, (3) Conseil aux concernés : demander un nouveau passeport, surveiller crédit (abonnement monitoring 24 mois offert par Swissport), (4) Notification Schengen Information System pour éviter usage frauduleux aux frontières, (5) Coopération internationale avec Interpol.",
            ok: true, pts: 25,
            fb: "Réponse complète et protectrice. Chaque niveau adresse un risque concret (vol d'identité, usage aux frontières, crédit). Offrir le monitoring gratuit démontre la responsabilité. C'est le type de réponse qui limite les plaintes individuelles post-incident.",
            legal: "LPD 2023 + Art. 252 CP + Conv. Schengen + Coopération Interpol.",
            critical: false, next: 4,
          },
          {
            text: "Publier un communiqué général sur la fuite sans détails par type de document.",
            ok: false, pts: -15,
            fb: "Insuffisant. La fuite de passeports nécessite des mesures très spécifiques (invalidation administrative, surveillance Schengen) qu'un communiqué général ne déclenche pas. Les personnes concernées doivent être individuellement informées et guidées.",
            legal: "LPD 2023 Art. 24 al. 3 — Information effective et actionnable.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "📋 Le rapport d'enseignements",
        situation: "Après stabilisation, Swissport décide de partager publiquement ses enseignements avec la communauté aéroportuaire internationale (ACI Airports Council International). L'objectif : montrer qu'un refus de paiement est gérable avec la bonne préparation. Vous supervisez la rédaction du rapport.",
        law: "<strong>ACI Guidance</strong> — Partage d'expérience cyber aviation.<br><strong>Art. 320 CP</strong> — Secret commercial (équilibre avec transparence).<br><strong>Doctrine CyberPeace Institute</strong> — Capitalisation.",
        question: "<strong>Quelles sont les 5 leçons clés que vous mettez en avant ?</strong>",
        choices: [
          {
            text: "Mettre l'accent sur la chance qu'a eue Swissport de bien gérer.",
            ok: false, pts: -15,
            fb: "Narratif réducteur. Attribuer le succès à la chance = dévaloriser la préparation en amont (backups air-gapped, exercices de fallback, coordination pré-établie). Les autres aéroports ne peuvent pas tirer de leçons de « la chance ».",
            legal: "Principe de capitalisation — Expliquer les facteurs structurels du succès.",
            critical: false, next: "end",
          },
          {
            text: "5 leçons structurelles : (1) Backups air-gapped TESTÉS régulièrement (pas juste prévus), (2) Procédures fallback manuel documentées et EXERCÉES (simulation annuelle), (3) Segmentation IT/OT stricte (tapis bagages non connectés à l'AD), (4) Coordination multi-juridictionnelle pré-établie (cellule de crise virtuelle existant avant l'incident), (5) Décision sur paiement PRÉPARÉE en amont avec le CA (pas improvisée sous pression). Chaque leçon est un investissement, pas de la chance.",
            ok: true, pts: 25,
            fb: "Rapport d'enseignements exemplaire. Vous décrivez des leviers actionnables que les autres opérateurs peuvent reproduire. C'est exactement le modèle ACI salué après l'incident Swissport 2022. La transparence sur la préparation inspire d'autres investissements cyber dans l'industrie.",
            legal: "ACI Guidance + CyberPeace Institute + Art. 320 CP (équilibre) — Partage structurant.",
            critical: false, next: "end",
          },
          {
            text: "Ne rien publier en public — c'est un sujet de confidentialité concurrentielle.",
            ok: false, pts: -10,
            fb: "Vision défensive. L'incident est déjà public (BlackCat a publié 1,6 To). La réputation post-incident se construit sur la qualité de la réponse, y compris son enseignement à la communauté. Publier renforce l'image d'organisation mature.",
            legal: "Gestion réputationnelle + Principe capitalisation — Partage = force.",
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
    alertLevel: "🎯 ATTAQUE APT COORDONNÉE — Timing : veille d'une conférence diplomatique",
    objectives: [
      { icon: "📡", text: "Mitiger les DDoS en temps réel sans couper l'accès légitime" },
      { icon: "🎯", text: "Caractériser le profil de l'attaquant (hacktivisme, APT, ou hybride ?)" },
      { icon: "🇨🇭", text: "Coordonner la réponse entre acteurs fédéraux, cantonaux et privés" },
    ],
    debrief: "<p>Les vagues d'attaques NoName057 en 2023 illustrent le <strong>hacktivisme étatique</strong> : DDoS à motivation politique, revendiqués publiquement, ciblant des symboles démocratiques (parlement, administration). L'objectif, comme l'a dit Stéphane Duguin (CyberPeace Institute), est de <em>« diminuer la confiance dans les institutions étatiques »</em>, par petites doses.</p><p>La réponse technique (CDN, anti-DDoS, filtrage géographique) est connue. La difficulté est <strong>politique</strong> : rester fonctionnel pendant un discours symbolique comme celui de Zelensky sans couper l'accès citoyen aux services publics.</p><p><strong>Référence CH</strong> : NoName057(16), été 2023 — campagne DDoS pro-russe contre sites officiels suisses (Parlement fédéral, autres). Art. 144bis CP — détérioration de données / mise hors service de systèmes informatiques. Les attaques DDoS-for-hire sont qualifiées sous Art. 144bis al. 2 CP (aggravé si dommage considérable). L'OFCS recommande la souscription à des services anti-DDoS (scrubbing center) pour les entités publiques à risque.</p>",
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
            critical: false, next: 1,
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
            critical: false, next: 2,
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
            critical: false, next: 3,
          },
          {
            text: "Cadre fédéraliste : (1) OFCS comme hub d'information central et d'assistance technique volontaire. (2) Canaux sécurisés de partage d'IoC (MISP-CH). (3) Notification d'incident encouragée (puis obligatoire via future Loi InfoSec). (4) Cellules de crise activables par événement. (5) Communication publique coordonnée.",
            ok: true, pts: 20,
            fb: "Cadre correct et réaliste. Hub + partage volontaire + canaux sécurisés + notifications + cellules + com commune. C'est la direction qu'a prise l'OFCS depuis 2023, avec la préparation de la Loi InfoSec entrée en vigueur en 2024-25.",
            legal: "Ordonnance OFCS + Loi InfoSec (en préparation) — Coordination fédéraliste moderne, volontaire puis progressivement obligatoire.",
            critical: false, next: 3,
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
      {
        phase: "📱 La guerre de l'information",
        situation: "NoName057 amplifie ses revendications sur Telegram en temps réel : captures d'écran d'erreurs HTTP, graphiques de « temps de réponse », moqueries envers la Confédération. Plusieurs médias reprennent ces captures. Un parlementaire demande publiquement pourquoi « l'État suisse se fait humilier ». Les réseaux sociaux amplifient. La dimension informationnelle dépasse la dimension technique.",
        law: "<strong>Doctrine cyber-information</strong> — Les DDoS hacktivistes visent autant l'impact technique que l'impact informationnel.<br><strong>Communication crise OFCS</strong>.<br><strong>Art. 10 Cst.</strong> — Liberté d'information.",
        question: "<strong>Quelle stratégie informationnelle mettez-vous en place ?</strong>",
        choices: [
          {
            text: "Répondre publiquement à chaque tweet de NoName pour rétablir la vérité.",
            ok: false, pts: -20,
            fb: "Engagement dans un jeu perdant. Répondre aux trolls = leur donner de la visibilité et nourrir le cycle. NoName cherche précisément cette attention. La stratégie gagnante est une communication institutionnelle calme, pas un ping-pong Twitter.",
            legal: "Doctrine communication crise — Ne pas entrer dans le jeu de l'adversaire informationnel.",
            critical: false, next: 4,
          },
          {
            text: "Stratégie calme et factuelle : (1) Un communiqué OFCS clair après stabilisation technique : « des DDoS revendiqués par NoName057 ont été détectés ; les services essentiels restent accessibles ; les mesures techniques coordonnées absorbent les vagues ». (2) Porte-parole unique, pas de réponses individuelles aux provocations. (3) Mise en avant des faits positifs (discours Zelensky s'est tenu, services publics disponibles). (4) Briefing technique aux médias responsables pour qu'ils contextualisent (c'est du DDoS, pas une intrusion dans les systèmes).",
            ok: true, pts: 25,
            fb: "Stratégie informationnelle mature. Vous privez NoName de l'oxygène médiatique tout en rassurant la population. C'est l'approche de l'OFCS en 2023 qui a permis de dédramatiser. Les médias sérieux ont fini par contextualiser (DDoS ≠ piratage).",
            legal: "Doctrine OFCS 2023 + Communication crise — Calme factuel.",
            critical: false, next: 4,
          },
          {
            text: "Silence total — ne pas commenter pour ne pas amplifier.",
            ok: false, pts: -15,
            fb: "Silence = laissant le terrain à NoName et aux parlementaires anxieux. Dans une crise informationnelle, le silence institutionnel est interprété comme admission ou incompétence. Le bon équilibre est communication factuelle minimale, pas silence.",
            legal: "Communication crise — Le silence institutionnel alimente les rumeurs.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "🛠 Les enseignements structurels",
        situation: "L'épisode NoName révèle des faiblesses architecturales dans la Confédération : certains sites fédéraux n'avaient pas de CDN/anti-DDoS, la coordination inter-cantonale en temps réel était improvisée, les TTPs NoName n'étaient pas dans les watchlists SIEM. L'OFCS doit proposer un programme de renforcement 2024-2025 au Conseil fédéral, budget ~18M CHF.",
        law: "<strong>Ordonnance OFCS</strong> — Mandat de renforcement.<br><strong>Loi InfoSec 2024</strong> — Obligations en cours de définition.<br><strong>NIST CSF</strong> — Cadre de référence.",
        question: "<strong>Quel programme de renforcement proposez-vous ?</strong>",
        choices: [
          {
            text: "Concentrer tout le budget sur un super-WAF fédéral centralisé.",
            ok: false, pts: -15,
            fb: "Approche monolithique fragile. Un point unique de défense = un point unique de défaillance. L'architecture fédéraliste suisse exige une approche distribuée avec coordination, pas un goulot d'étranglement centralisé.",
            legal: "Principe de résilience distribuée — Redondance plutôt que centralisation.",
            critical: false, next: "end",
          },
          {
            text: "Programme 2024-25 : (1) Contrat-cadre CDN/anti-DDoS pour toutes les entités fédérales + cantons intéressés (achats groupés, 4M CHF), (2) Hub MISP-CH pour partage d'IoC en temps réel entre OFCS/cantons/privés (2M), (3) Exercices annuels de type CyberDefence (simulation attaque coordonnée, 1.5M), (4) Centre de fusion cyber inter-cantonal (3M), (5) Renforcement SOC fédéral 24/7 (4M), (6) Formation cadres publics (cyber literacy, 1M), (7) Programme de Bug Bounty pour sites fédéraux (1M), (8) Support PME critiques (1.5M). Total 18M avec ROI mesurable.",
            ok: true, pts: 25,
            fb: "Programme structuré et chiffré exemplaire. Chaque ligne adresse une faiblesse identifiée dans l'épisode NoName. Le mix technique (CDN, SOC) + gouvernance (MISP, exercices) + formation (cadres) = défense en profondeur au niveau national. C'est le type de plan qu'appréciera un CF et un Parlement.",
            legal: "Ordonnance OFCS + Loi InfoSec + NIST CSF — Programme national coordonné.",
            critical: false, next: "end",
          },
          {
            text: "Demander à chaque entité de gérer individuellement sa sécurité — l'OFCS ne peut pas tout faire.",
            ok: false, pts: -20,
            fb: "Abdication stratégique. L'un des enseignements NoName est précisément que la coordination centralisée (en fédéralisme) est essentielle. Laisser chacun seul = garantir des failles partout. Le rôle fédéral est l'orchestration.",
            legal: "Responsabilité fédérale + Loi InfoSec 2024 — L'OFCS joue un rôle moteur dans la résilience nationale.",
            critical: false, next: "end",
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

  /* ══════════════════════════════════════════════════
     27. EXPERT_FLAGSHIP — Opération « Palais Fédéral »  [EXPERT]
     Scénario fictif mais réaliste d'attaque multi-vecteurs coordonnée
     contre la Chancellerie fédérale — 11 étapes, niveau procureur expérimenté
  ══════════════════════════════════════════════════ */
  {
    id: "palais_federal",
    title: "Opération « Palais Fédéral »",
    icon: "🏛️",
    difficulty: "expert",
    atmosphere: "state",
    realCase: "Scénario fictif — synthèse d'éléments inspirés des affaires RUAG, Xplain, NoName, CICR et d'exercices CyberDefence OFCS/OFAE. Conçu pour l'entraînement de haut niveau des procureurs et experts DFIR du MPC.",
    tags: ["DROIT", "RÉSEAUX", "FORENSIQUE", "CRYPTO"],
    legalRefs: ["Art. 86 LAM", "Art. 169 Cst.", "Art. 267-268 CPP", "LFRC", "LMSI", "ATF 149 I 218", "CISA/CIRCIA", "Convention Budapest"],
    intro: "14 mars, 05h47. Vous êtes Procureur·e fédéral·e de garde au MPC. Appel chiffré : le chef OFCS vous informe qu'une intrusion active a été détectée sur l'infrastructure de la Chancellerie fédérale. Emails ministériels, documents classifiés CONFIDENTIEL et SECRET. Exfiltration en cours. Dans 14 heures, le Conseil fédéral doit prendre une décision diplomatique majeure. L'attaquant semble chercher à la connaître d'avance. Les décisions des 11 prochaines étapes engageront la souveraineté cyber de la Suisse.",
    alertLevel: "🔴 INCIDENT NATIONAL CRITIQUE — Procureur·e expérimenté·e requis·e",
    objectives: [
      { icon: "⚡", text: "Orchestrer la réponse multi-acteurs sous pression temporelle extrême" },
      { icon: "🏛️", text: "Arbitrer tensions MPC/OFCS/SRC/DFAE en respectant les compétences constitutionnelles" },
      { icon: "⚖️", text: "Maintenir la recevabilité procédurale malgré l'urgence étatique" },
      { icon: "🌐", text: "Gérer les implications diplomatiques, parlementaires et médiatiques" },
      { icon: "📜", text: "Produire des actes juridiques irréprochables sous temps contraint" },
    ],
    debrief: "<p>Ce scénario d'entraînement de haut niveau recoupe 5 dimensions simultanément : <strong>forensique de pointe</strong> (APT sophistiqué), <strong>droit pénal suisse</strong> (LAM, CPP, LFRC), <strong>coordination interinstitutionnelle</strong> (MPC-OFCS-SRC-DFAE-DélCdG), <strong>diplomatie</strong> (non-accusation étatique publique), et <strong>communication de crise</strong>. La maîtrise EXPERT suppose de naviguer ces dimensions en temps réel sans laisser aucune d'elles dégrader les autres.</p><p>Les séminaires CyberDefence de l'OFCS/OFAE s'inspirent de ce type de scénarios pour préparer les cadres fédéraux. Chaque choix de ce scénario Expert a une justification documentée dans la doctrine suisse publique (Rapport MELANI RUAG, Rapport OFCS Xplain, Communiqués CICR, etc.).</p><p><strong>Référence CH</strong> : Cyberattaque contre le Palais fédéral — contexte APT state-sponsored. Art. 86 LAM — protection des informations militaires. Art. 169 Cst. — immunité parlementaire ne couvre pas les actes délictueux sur les systèmes IT. Art. 269-279 CPP — surveillance des télécommunications : ordonnance formelle + autorisation TMC obligatoires, sans exception d'urgence étatique. LMSI Art. 2 — le Parlement fédéral est une infrastructure critique de niveau 1.</p>",
    narrative: {
      success: "La procédure pénale est irréprochable. Les preuves sont sauvées. Le Conseil fédéral prend sa décision diplomatique protégé. L'attribution étatique reste mesurée et confiée au SRC. Le rapport public 2 mois plus tard devient une référence internationale, citée par ENISA et CISA. La Suisse renforce sa crédibilité cyber.",
      degraded: "L'enquête pénale tient mais certains éléments sont contestables. Le Conseil fédéral a du compenser par une modification de dernière minute. La communication publique fragmentée donne lieu à des critiques parlementaires. L'affaire laisse des séquelles institutionnelles.",
      failure: "Erreurs en cascade : saisies invalidées, fuites aux médias, accusations diplomatiques prématurées, paralysie de la décision CF. Conséquences : démission de hauts cadres fédéraux, enquête DélCdG, perte de confiance internationale, remaniement stratégique douloureux sur 18 mois."
    },
    steps: [
      {
        phase: "⚡ 05h47 — L'alerte",
        situation: "Le Chef de l'OFCS vous appelle sur ligne chiffrée. Les faits : depuis environ 3 heures, leur sonde détecte un beacon C2 depuis l'infrastructure Chancellerie vers un domaine européen suspect (relay probable). Les volumes sortants sont faibles mais constants (exfiltration lente). Le Conseil fédéral se réunit à 20h00 pour décider d'une position diplomatique sensible. Vous avez 14 heures.",
        law: "<strong>Art. 23 LOAP</strong> — Compétence du MPC pour les infractions contre la Confédération.<br><strong>Art. 309 CPP</strong> — Ouverture d'une instruction.<br><strong>Art. 86 LAM</strong> — Secret militaire/étatique.<br><strong>LFRC Art. 6</strong> — Compétences SRC.",
        question: "<strong>Votre première décision comme Procureur·e ?</strong>",
        choices: [
          {
            text: "Ordonner immédiatement l'arrêt total des systèmes Chancellerie pour stopper l'exfiltration.",
            ok: false, pts: -30,
            fb: "Extinction aveugle catastrophique. (1) Destruction de la preuve volatile (RAM, C2 actif). (2) Signal clair à l'attaquant qu'il est détecté → wipe de ses traces résiduelles. (3) Paralysie d'une infrastructure étatique à 3h du CF. Une ouverture de procédure doit accompagner une stratégie de containment intelligente, pas la panique.",
            legal: "Art. 309 CPP + Manuel Ch. 11.1 — Ouverture + préservation avant action brutale.",
            critical: true, next: "end",
          },
          {
            text: "(1) Ouverture formelle de l'instruction pénale (Art. 309 CPP) avec mandat d'investigation élargi. (2) Coordination immédiate avec OFCS pour monitoring discret + capture forensique sans alerter l'attaquant. (3) Pré-alerte confidentielle SRC (attribution étatique possible) et DFAE (implications diplomatiques). (4) Pas de communication publique à ce stade. (5) Mise en place cellule de crise interinstitutionnelle sous ma direction procédurale.",
            ok: true, pts: 30,
            fb: "Décision procédurale exemplaire. Ouverture formelle + coordination multi-acteurs + préservation discrète + silence public. Chaque levier est activé selon sa compétence. Le MPC joue son rôle de chef d'orchestre pénal sans empiéter sur les autres (SRC, DFAE, OFCS gardent leurs attributions).",
            legal: "Art. 309 CPP + LOAP + LFRC + compétences DFAE — Coordination constitutionnelle.",
            critical: false, next: 1,
          },
          {
            text: "Informer immédiatement le Président de la Confédération et les médias pour transparence.",
            ok: false, pts: -35,
            fb: "Triple erreur procédurale. (1) Informer le Président hors canal SRC/OFCS = court-circuit des compétences. (2) Informer les médias = alerter l'attaquant + impact diplomatique incontrôlé + violation du secret d'instruction (Art. 73 CPP). (3) Aucun acte procédural formel n'est posé. Catastrophe institutionnelle.",
            legal: "Art. 73 CPP + LFRC + Compétences DFAE — Chaque canal a sa compétence.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🔬 07h15 — La cartographie de l'intrusion",
        situation: "L'OFCS a progressé en 90 min : 14 machines de la Chancellerie sont compromises, dont la DSI, le Secrétariat général, et 2 postes du Département des affaires étrangères. Une souche custom (pas de signature MITRE connue) installe des implants via PowerShell obfusqué + persistance WMI. Les télémétries d'exfiltration montrent du Signal (protocole) via DNS-over-HTTPS. Trop sophistiqué pour du cybercrime ordinaire.",
        law: "<strong>Art. 267 CPP</strong> — Séquestre.<br><strong>Art. 269 CPP</strong> — Surveillance de correspondance.<br><strong>MITRE ATT&CK T1572</strong> — Protocol Tunneling.<br><strong>LAM Art. 86</strong> — Secret étatique.",
        question: "<strong>Quel ordre procédural émettez-vous pour la phase forensique ?</strong>",
        choices: [
          {
            text: "Mandat de séquestre immédiat sur tous les serveurs Chancellerie + saisie de tout le parc machines.",
            ok: false, pts: -20,
            fb: "Disproportionné et contre-productif. Saisir physiquement la DSI de la Chancellerie à 08h = arrêt total de l'État + panique. Sans compter que le séquestre physique de machines vivantes sur des systèmes d'État exige des modalités particulières (continuité des fonctions régaliennes).",
            legal: "Art. 197 CPP + Principe de proportionnalité — Séquestre ciblé, pas massif.",
            critical: false, next: 2,
          },
          {
            text: "Ordre procédural structuré : (1) Mandat Art. 267 CPP limité aux 14 machines confirmées compromises + images forensiques prioritaires (RAM + disque) ; (2) Ordonnance Art. 269 CPP pour capture complète du trafic Chancellerie pendant 72h (incluant DNS-over-HTTPS) ; (3) Mandat de levée du secret de fonction (Art. 170 CPP) pour les collaborateurs OFCS/Chancellerie témoins ; (4) Préservation des logs SIEM historiques (90 jours) ; (5) Hash et scellés progressifs tout en maintenant le fonctionnement de l'État.",
            ok: true, pts: 30,
            fb: "Ordre procédural de haut niveau. Chaque acte est (a) proportionné, (b) ciblé, (c) juridiquement fondé, (d) compatible avec la continuité étatique. Les 5 éléments couvrent : preuves figées, surveillance active, déliaison de témoins, historique, chaîne de custody. C'est la pratique MPC moderne sur cas d'État.",
            legal: "Art. 197/267/269/170 CPP + LAM Art. 86 — Acte procédural complet et proportionné.",
            critical: false, next: 2,
          },
          {
            text: "Laisser l'OFCS investiguer seul, le MPC agira sur ses conclusions.",
            ok: false, pts: -25,
            fb: "Abdication procédurale. Si le MPC n'encadre pas juridiquement la collecte dès le début, les preuves obtenues par l'OFCS risquent d'être contestées (origine non pénalement mandatée). La direction procédurale du MPC est la garantie de recevabilité.",
            legal: "Art. 16 CPP + LFRC — Direction de la procédure par le MPC dès l'ouverture.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🌐 09h20 — La géopolitique",
        situation: "La souche custom est en cours de reverse par l'OFCS. Les premiers IoC sont partagés discrètement avec BSI (Allemagne), ANSSI (France), CISA (USA) via les canaux CERT. BSI revient 30 min plus tard : « similarités techniques avec TA450, APT Iranien. Confiance moyenne. » Le chef SRC vous demande si vous pouvez partager plus largement les IoC avec les partenaires des Five Eyes, dont l'UK et l'Australie.",
        law: "<strong>LFRC Art. 13</strong> — Coopération internationale SRC.<br><strong>LFRC Art. 6 al. 2</strong> — Limites.<br><strong>Convention Budapest Art. 26</strong> — Partage spontané d'information.<br><strong>Statut de neutralité</strong>.",
        question: "<strong>Votre position sur le partage Five Eyes ?</strong>",
        choices: [
          {
            text: "Partager immédiatement avec Five Eyes — plus on partage, plus on progresse.",
            ok: false, pts: -25,
            fb: "Précipitation problématique. Les Five Eyes est une alliance anglophone étroite. Partager AVANT cadrage diplomatique = signal politique fort (alignement). La Suisse, en tant qu'État neutre, doit mesurer ses alignements. Le partage doit être cadré par le DFAE + SRC, pas improvisé par le Procureur.",
            legal: "LFRC + Art. 54 Cst. + Neutralité — Alignements diplomatiques = compétence politique.",
            critical: false, next: 3,
          },
          {
            text: "Position de Procureur·e : (1) Le MPC limite son partage aux canaux judiciaires traditionnels (Convention Budapest, MLAT) et aux CERT partenaires pour IoC techniques ; (2) Le partage étendu Five Eyes relève de la compétence du SRC + DFAE (LFRC + politique étrangère) — je leur laisse cet arbitrage diplomatique ; (3) Je documente la séparation des compétences dans le dossier procédural.",
            ok: true, pts: 30,
            fb: "Maîtrise constitutionnelle remarquable. Vous respectez strictement la séparation des rôles : MPC = pénal/judiciaire, SRC = renseignement, DFAE = diplomatie. En refusant de trancher hors de votre compétence, vous protégez l'intégrité de chaque institution. C'est la posture d'un Procureur fédéral expérimenté.",
            legal: "LOAP + LFRC + Art. 54 Cst. + Convention Budapest — Séparation stricte des rôles.",
            critical: false, next: 3,
          },
          {
            text: "Refuser tout partage international pour protéger la souveraineté suisse.",
            ok: false, pts: -20,
            fb: "Isolationnisme contre-productif. Les IoC techniques sont précisément ce qui fonctionne en partage mondial (MISP, FIRST, BUDAPEST). Refuser = priver la Suisse de renseignements réciproques cruciaux. Le problème est le quoi/qui, pas le principe.",
            legal: "Convention Budapest — La coopération technique est la norme.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "⚔️ 12h00 — L'attaquant passe à l'offensive",
        situation: "Nouveau signal OFCS : l'attaquant a détecté qu'il est surveillé (probablement via un honeypot trop visible). Il active un <strong>wiper</strong> sur 2 machines. Il tente aussi un mouvement latéral vers le Secrétariat général du Conseil fédéral. Le temps file — le CF siège à 20h. Décision urgente : continuer la surveillance ou contenir ?",
        law: "<strong>Manuel Ch. 21</strong> — Containment vs continuité investigation.<br><strong>Art. 144bis CP</strong> — Dommages aux données (wiper).<br><strong>Art. 86 LAM</strong> — Protection des données étatiques.",
        question: "<strong>Votre décision procédurale d'urgence ?</strong>",
        choices: [
          {
            text: "Laisser la surveillance continuer pour obtenir plus d'IoC — les 2 machines sacrifiées sont peu de chose.",
            ok: false, pts: -35,
            fb: "Tolérer la destruction active de données étatiques pendant que vous regardez = complicité par omission (Art. 86 LAM + 144bis CP). Sans compter que le mouvement latéral vers le Secrétariat général pourrait toucher le CF en direct. La surveillance ne justifie pas l'inaction face à une attaque active.",
            legal: "Art. 86 LAM + 144bis CP — Obligation de protéger les données étatiques.",
            critical: true, next: "end",
          },
          {
            text: "Ordre de containment ciblé immédiat : (1) Isolation des 14 machines confirmées compromises + Secrétariat général en priorité ; (2) Blocage des C2 identifiés au niveau firewall fédéral ; (3) Rotation d'urgence des credentials AD Chancellerie ; (4) Documentation forensique simultanée ; (5) Continuation de la surveillance sur les canaux encore actifs (le wiper s'active déjà, l'attaquant sait qu'il est découvert). La sauvegarde de l'État passe avant la complétude forensique.",
            ok: true, pts: 30,
            fb: "Décision exécutive mature. Containment + protection + préservation simultanée. Vous reconnaissez qu'à partir du wiper, l'attaquant SAIT → la surveillance discrète n'a plus d'intérêt → priorité protection. La documentation continue protège la procédure future.",
            legal: "Manuel Ch. 21 + Art. 86 LAM + 144bis CP — Containment proportionné et documenté.",
            critical: false, next: 4,
          },
          {
            text: "Couper TOUT le réseau Chancellerie — risque zéro.",
            ok: false, pts: -25,
            fb: "Extinction totale = paralysie de l'exécutif fédéral 5h avant séance CF. Les machines NON compromises n'ont pas à être coupées. Le containment ciblé préserve la continuité de l'État tout en stoppant l'attaque active.",
            legal: "Art. 197 CPP — Proportionnalité.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "📞 13h30 — Le briefing à la DélCdG",
        situation: "La Délégation des Commissions de gestion (DélCdG) du Parlement a été alertée par le Chef OFCS. Elle convoque une séance secrète à 15h00 et vous demande un briefing technique. Compositions : 3 parlementaires des Commissions de gestion, habilités sécurité. Ils ont des questions ciblées sur l'étendue de la compromission et les responsabilités.",
        law: "<strong>Art. 169 Cst.</strong> — Haute surveillance parlementaire.<br><strong>LParl Art. 53</strong> — Compétences DélCdG.<br><strong>LFRC Art. 78</strong> — Accès DélCdG aux informations sensibles.<br><strong>Art. 320 CP</strong> — Secret de fonction.",
        question: "<strong>Comment préparez-vous ce briefing ?</strong>",
        choices: [
          {
            text: "Refuser le briefing — l'instruction pénale est secrète (Art. 73 CPP).",
            ok: false, pts: -30,
            fb: "Méconnaissance constitutionnelle grave. La DélCdG exerce la HAUTE SURVEILLANCE (Art. 169 Cst.) — elle a un droit d'accès aux informations sensibles (LFRC Art. 78). Le secret d'instruction ne s'oppose PAS à l'information des organes de haute surveillance. Refuser = infraction institutionnelle majeure.",
            legal: "Art. 169 Cst. + LParl Art. 53 + LFRC Art. 78 — Droit d'accès DélCdG.",
            critical: true, next: "end",
          },
          {
            text: "Briefing structuré : (1) Vérification préalable habilitations sécurité + salle SCIF ; (2) Exposé factuel : chronologie, étendue confirmée (14 machines), nature de l'attaquant (caractérisation technique sans attribution étatique publique), mesures prises ; (3) Questions/réponses sans détails opérationnels sensibles (identités opérations en cours, méthodes) ; (4) Coordination avec SRC et Chef DFAE qui briefent en parallèle leurs aspects ; (5) Document de synthèse remis à chaque parlementaire, numéroté, classifié CONFIDENTIEL, avec accusé de réception.",
            ok: true, pts: 30,
            fb: "Briefing institutionnellement exemplaire. La DélCdG est un organe clé de l'équilibre démocratique sur les affaires sensibles. Vous respectez son droit d'accès tout en préservant le secret opérationnel. La coordination SRC/DFAE évite les récits contradictoires.",
            legal: "Art. 169 Cst. + LFRC Art. 78 + Pratique DélCdG — Briefing maîtrisé.",
            critical: false, next: 5,
          },
          {
            text: "Transmettre tous les documents procéduraux bruts à la DélCdG pour qu'elle se fasse son avis.",
            ok: false, pts: -20,
            fb: "Surcharge inutile. La DélCdG fait du contrôle de haute surveillance, pas de l'analyse forensique. 500 pages brutes à 3 parlementaires à 15h = inutilisable. Un briefing synthétique + Q&A + document de 15 pages est plus efficace.",
            legal: "Pratique DélCdG — Briefing synthétique + accès sur demande aux détails.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "⚖️ 14h50 — L'ATF 149 I 218",
        situation: "Pour investiguer plus avant, l'OFCS demande l'autorisation d'accéder à du trafic chiffré (HTTPS) depuis certains postes Chancellerie. Techniquement, cela exige un MITM contrôlé via certificat racine fédéral interne. Sur le plan procédural, c'est une mesure de surveillance étendue. L'ATF 149 I 218 vient rappeler les exigences strictes sur l'interception numérique, même en contexte étatique.",
        law: "<strong>Art. 269-279 CPP</strong> — Surveillance des télécommunications.<br><strong>Art. 269ter CPP</strong> — Investigation secrète.<br><strong>ATF 149 I 218 (2023)</strong> — Interception numérique et bases légales.<br><strong>Art. 13 Cst.</strong> — Sphère privée.",
        question: "<strong>Votre décision procédurale sur l'interception HTTPS ?</strong>",
        choices: [
          {
            text: "Autoriser l'interception HTTPS par simple ordre écrit — urgence étatique justifie.",
            ok: false, pts: -40,
            fb: "Violation grave de l'Art. 269 CPP + ATF 149 I 218. Une mesure aussi intrusive (MITM HTTPS sur postes contenant aussi du trafic privé des agents de la Chancellerie) exige ordonnance formelle + autorisation TMC. L'urgence étatique ne suspend PAS les garanties procédurales — c'est précisément le rappel de l'ATF 149 I 218. Un contournement détruirait la recevabilité de TOUTES les preuves.",
            legal: "Art. 269 CPP + ATF 149 I 218 + Art. 13 Cst. — Urgence ≠ dispense procédurale.",
            critical: true, next: "end",
          },
          {
            text: "(1) Demande formelle d'ordonnance MPC Art. 269 CPP ciblée : interception HTTPS limitée aux 14 machines compromises, durée max 30 jours, finalité précise (détection beacons C2, exfiltration) ; (2) Soumission à l'autorisation du TMC en procédure accélérée (Art. 274 CPP) ; (3) Séparation technique obligatoire : trafic C2 suspect archivé pour procédure / trafic privé non exploité ; (4) Minimisation : interception auto-désactivée sur patterns identifiables (apps messaging personnel) ; (5) Documentation procédurale complète.",
            ok: true, pts: 30,
            fb: "Maîtrise juridico-procédurale exceptionnelle. Vous appliquez rigoureusement l'ATF 149 I 218 tout en obtenant la mesure nécessaire. Le TMC en procédure accélérée autorise dans les heures critiques. La séparation technique garantit la proportionnalité. Les preuves obtenues seront irréprochables.",
            legal: "Art. 269/274 CPP + ATF 149 I 218 + Art. 13 Cst. — Procédure accélérée respectée.",
            critical: false, next: 6,
          },
          {
            text: "Renoncer à l'interception HTTPS — trop risqué juridiquement.",
            ok: false, pts: -15,
            fb: "Sous-utilisation des outils légaux. L'Art. 269 CPP permet précisément ce type de surveillance dans les bonnes conditions. Renoncer prive l'investigation d'un outil clé. La bonne voie est la procédure formelle, pas l'abandon.",
            legal: "Art. 269 CPP — Disponible avec procédure appropriée.",
            critical: false, next: 6,
          },
        ],
      },
      {
        phase: "🌍 17h40 — La tentation diplomatique",
        situation: "Le Chef DFAE vous appelle directement. Le SRC a confirmé avec « confiance élevée » l'attribution à TA450 (APT iranien). Il existe une fenêtre diplomatique : le CF pourrait dénoncer publiquement l'attaque avant sa séance de 20h, ce qui renforcerait sa position de négociation. On demande votre avis sur l'usage public du dossier pénal en cours.",
        law: "<strong>Art. 73 CPP</strong> — Secret d'instruction.<br><strong>Art. 182 CPP</strong> — Rôle de l'expert.<br><strong>Art. 54 Cst.</strong> — Compétences DFAE.<br><strong>Art. 86 LAM</strong> — Secret.",
        question: "<strong>Votre position ?</strong>",
        choices: [
          {
            text: "Autoriser la publication : l'enjeu diplomatique justifie une entorse temporaire au secret.",
            ok: false, pts: -35,
            fb: "Violation grave Art. 73 CPP + dépassement du rôle. (1) Le secret d'instruction n'est pas une option politique. (2) Utiliser une procédure pénale active pour alimenter une position diplomatique = instrumentalisation. (3) Si l'attribution SRC est revue plus tard, l'accusation publique serait dévastatrice. (4) Vous liez le MPC à une position diplomatique qui n'est pas de sa compétence.",
            legal: "Art. 73 CPP + Art. 54 Cst. + Art. 182 CPP — Séparation stricte.",
            critical: true, next: "end",
          },
          {
            text: "« Le MPC ne peut pas utiliser l'instruction pénale active pour des fins diplomatiques (Art. 73 CPP). Je peux confirmer au DFAE : (a) qu'une intrusion technique sophistiquée est en cours, caractérisable comme APT ; (b) qu'une attribution SRC relève de sa propre évaluation ; (c) que toute communication publique de ma part doit rester limitée à la description factuelle technique. Le CF décidera souverainement avec les éléments à sa disposition (SRC + DFAE) — sans que mon dossier pénal en soit la base publique. »",
            ok: true, pts: 30,
            fb: "Maîtrise institutionnelle d'un très haut niveau. Vous distinguez avec précision : ce que vous pouvez partager institutionnellement (faits techniques) vs ce que vous ne pouvez pas instrumentaliser (dossier pénal pour diplomatie). Vous préservez l'indépendance du MPC tout en coopérant institutionnellement. C'est exactement la posture attendue d'un Procureur fédéral dans une affaire d'État.",
            legal: "Art. 73 CPP + LOAP + Art. 54 Cst. — Séparation rigoureuse.",
            critical: false, next: 7,
          },
          {
            text: "Refuser toute communication avec le DFAE — secret d'instruction absolu.",
            ok: false, pts: -20,
            fb: "Isolationnisme procédural. Le secret d'instruction n'empêche pas la coordination institutionnelle dans ses limites légales (pas de publicité, pas de diffusion externe). Refuser de parler au DFAE = rupture institutionnelle inutile. L'équilibre est la communication cadrée, pas le mutisme.",
            legal: "Art. 73 CPP + LOAP — Communication institutionnelle cadrée autorisée.",
            critical: false, next: 7,
          },
        ],
      },
      {
        phase: "🔐 18h30 — Le chiffrement inattendu",
        situation: "Les forensics progressent mais bloquent : l'attaquant a chiffré localement certains fichiers qu'il avait accédés (un « hold » classique des APT iraniens, pour relecture différée). Les fichiers protégés sont particulièrement sensibles : brouillons de la décision CF du soir ! Sans déchiffrement rapide, impossible de savoir ce qu'il a déjà lu. L'OFCS pense pouvoir tenter une extraction de clé en RAM mais cela exige d'agir dans les minutes qui suivent.",
        law: "<strong>Art. 263 CPP</strong> — Séquestre.<br><strong>Art. 248 CPP</strong> — Scellés.<br><strong>ACPO Principle 1</strong> — Intégrité des preuves.<br><strong>Urgence qualifiée</strong>.",
        question: "<strong>Votre ordre procédural immédiat ?</strong>",
        choices: [
          {
            text: "Autoriser l'extraction RAM immédiate sans formalisme — l'urgence l'impose.",
            ok: false, pts: -20,
            fb: "Court-circuit procédural coûteux. Même en urgence, une extraction RAM sur système étatique doit être documentée procéduralement. Sans acte formel = les preuves extraites deviennent contestables.",
            legal: "Art. 263/267 CPP + Manuel Ch. 11.1 — Urgence documentée, pas informelle.",
            critical: false, next: 8,
          },
          {
            text: "(1) Ordre oral immédiat au technicien OFCS de procéder à l'extraction RAM ciblée sur la machine concernée, avec témoin officiel présent ; (2) Confirmation écrite dans les 2h (Art. 263 CPP + procédure urgente) ; (3) Documentation vidéo obligatoire (time-stamp + écran + opérateurs) ; (4) Hash des données extraites avec scellés numériques ; (5) Analyse sur copie uniquement, jamais sur original ; (6) Si clé trouvée → déchiffrement documenté + comparaison avec brouillons CF pour établir ce qui a été lu.",
            ok: true, pts: 30,
            fb: "Gestion d'urgence exemplaire. Vous conciliez vitesse technique (extraction immédiate) et rigueur procédurale (ordre oral + confirmation écrite + vidéo + hash + scellés). Cette approche est consacrée par la pratique MPC et résiste à toute contestation ultérieure. La procédure urgente n'est PAS l'absence de procédure.",
            legal: "Art. 263/267 CPP + ACPO Principle 1-3 + pratique MPC — Urgence procédurale maîtrisée.",
            critical: false, next: 8,
          },
          {
            text: "Renoncer à l'extraction — trop risqué techniquement.",
            ok: false, pts: -25,
            fb: "Inaction préjudiciable. Sans savoir ce que l'attaquant a lu (brouillons CF !), impossible d'informer le CF correctement à 20h. L'enjeu dépasse la technique : c'est la capacité du CF à décider souverainement. L'extraction est possible procéduralement.",
            legal: "Art. 263 CPP + urgence qualifiée — L'extraction ciblée est fondée.",
            critical: false, next: 8,
          },
        ],
      },
      {
        phase: "🏛️ 19h45 — Le briefing final au Conseil fédéral",
        situation: "Vous présentez devant le CF à 19h45, 15 min avant leur décision. L'extraction RAM a réussi : vous savez que l'attaquant a lu 3 des 8 brouillons de décisions, mais PAS celui sur la position diplomatique principale du jour (timing !). Le CF doit décider : maintenir la position prévue, la modifier, ou reporter ?",
        law: "<strong>Art. 176 Cst.</strong> — Direction du Conseil fédéral.<br><strong>Art. 184 Cst.</strong> — Affaires étrangères.<br><strong>Art. 182 CPP</strong> — Rôle de l'expert.<br><strong>Principe du conseil</strong>.",
        question: "<strong>Quelle est votre contribution au CF ?</strong>",
        choices: [
          {
            text: "Recommander au CF de modifier sa position pour ne pas « donner le plaisir à l'attaquant ».",
            ok: false, pts: -30,
            fb: "Dépassement de rôle grave. Le CF décide souverainement de sa position diplomatique (Art. 184 Cst.) — le Procureur ne RECOMMANDE PAS sur le fond. Votre rôle est de fournir les FAITS techniques qui éclairent leur décision souveraine, pas d'orienter la politique étrangère.",
            legal: "Art. 184 Cst. + Art. 182 CPP — Séparation stricte faits/décision politique.",
            critical: true, next: "end",
          },
          {
            text: "Briefing factuel : (1) Situation forensique : compromission confirmée de 14 machines, caractérisation technique (APT sophistiqué) — attribution étatique relevant du SRC ; (2) Fuite établie : 3 brouillons lus par l'attaquant (détails énumérés), mais PAS la position diplomatique principale à l'ordre du jour ce soir ; (3) Neutralisation en cours : containment opérationnel, suivi forensique continu, procédure pénale active ; (4) Aucune recommandation sur la décision politique elle-même — décision souveraine du CF. Je reste disponible pour questions techniques.",
            ok: true, pts: 30,
            fb: "Briefing parfaitement cadré. Vous fournissez TOUS les éléments nécessaires à une décision éclairée SANS empiéter sur la souveraineté politique du CF. Les faits (dont la protection inespérée du brouillon principal) permettent au CF de maintenir sa position en toute connaissance. Un Procureur fédéral d'un grand niveau.",
            legal: "Art. 184 Cst. + Art. 176 Cst. + Art. 182 CPP + LOAP — Séparation constitutionnelle maîtrisée.",
            critical: false, next: 9,
          },
          {
            text: "Refuser de briefer le CF — c'est au SRC de le faire.",
            ok: false, pts: -25,
            fb: "Fuite de responsabilité. Le MPC a des éléments pénaux uniques (scope de la compromission, fuites précises) dont le SRC ne dispose pas. Votre briefing technique complète le SRC et est essentiel au CF. Refuser = l'État se prive d'une source clé d'information.",
            legal: "Art. 176 Cst. + LOAP — Coopération institutionnelle.",
            critical: false, next: 9,
          },
        ],
      },
      {
        phase: "🌅 Lendemain matin — La conférence de presse",
        situation: "Le CF a maintenu sa position. La presse a eu vent d'une « incident cyber » sur la Chancellerie via des fuites (probablement parlementaires). Tamedia, NZZ, SRF demandent une conférence de presse conjointe. Le DFAE + OFCS + SRC se préparent. Vous êtes invité·e comme représentant·e du MPC. L'enjeu : cadrer le narratif public sans compromettre l'instruction ni la position diplomatique fragile.",
        law: "<strong>Art. 73 CPP</strong> — Secret d'instruction.<br><strong>LTrans</strong> — Transparence fédérale.<br><strong>Art. 74 CPP</strong> — Information du public par le MPC.",
        question: "<strong>Quelle est votre préparation pour la conférence ?</strong>",
        choices: [
          {
            text: "Refuser de participer — le MPC ne communique pas sur les instructions en cours.",
            ok: false, pts: -20,
            fb: "Position trop rigide. L'Art. 74 CPP autorise précisément la communication encadrée du MPC sur une instruction d'intérêt public majeur. Refuser = laisser le récit aux autres (OFCS, SRC, DFAE, médias) sans contribution pénale = déséquilibre public.",
            legal: "Art. 74 CPP — Information publique du MPC autorisée sur motifs publics majeurs.",
            critical: false, next: 10,
          },
          {
            text: "Préparation coordonnée : (1) Points clés MPC : confirmation d'une procédure pénale ouverte, qualification pénale provisoire (Art. 143bis, 144bis CP), pas de noms d'individus, pas de détails tactiques ; (2) Coordination avant presse : alignement des messages entre MPC/OFCS/SRC/DFAE (pas de contradictions publiques) ; (3) Limite claire : aucune attribution étatique publique par le MPC (compétence SRC/DFAE si décision politique) ; (4) Q&A anticipé avec réponses types ; (5) Communiqué commun écrit fourni avant la conférence pour les journalistes ; (6) Disponibilité pour questions techniques sans toucher aux éléments opérationnels.",
            ok: true, pts: 30,
            fb: "Communication de crise institutionnelle de haut vol. Chaque acteur parle dans son domaine, sans redondance ni contradiction. Le cadrage MPC (procédure ouverte + qualification générique) établit la réalité pénale sans compromettre l'instruction. La séparation des rôles est respectée en public comme en privé.",
            legal: "Art. 74 CPP + pratique coordonnée MPC-OFCS-SRC-DFAE — Communication multi-acteurs maîtrisée.",
            critical: false, next: 10,
          },
          {
            text: "Annoncer publiquement le nom de l'APT soupçonné et l'État présumé responsable.",
            ok: false, pts: -35,
            fb: "Catastrophe diplomatique et procédurale. (1) Dépassement massif du rôle MPC (attribution = SRC/DFAE). (2) Compromission diplomatique irréversible. (3) Si l'attribution est revue ultérieurement = discrédit total. (4) L'enquête est compromise (l'attaquant adaptera ses TTPs). La presse doit entendre du factuel encadré, pas des accusations.",
            legal: "Art. 74 CPP + Art. 54 Cst. + Art. 182 CPP — Limites strictes.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📜 2 mois plus tard — Le rapport national",
        situation: "L'instruction pénale progresse (suspects identifiés via coopération internationale, en attente d'éventuelles extraditions — peu probables). Le CF décide de publier un rapport national de synthèse, sur le modèle MELANI RUAG 2016. Votre contribution MPC au rapport doit équilibrer : valeur pédagogique pour la communauté cyber suisse, protection de l'instruction en cours, respect du secret de fonction, préservation de la réputation des institutions.",
        law: "<strong>LTrans</strong> — Publication par défaut.<br><strong>Art. 73 CPP</strong> — Secret d'instruction pendant.<br><strong>Art. 8 LTrans</strong> — Exceptions.<br><strong>Art. 320 CP</strong> — Secret de fonction.",
        question: "<strong>Quelle est votre contribution au rapport public ?</strong>",
        choices: [
          {
            text: "Publier le maximum : chronologie complète, méthodes techniques, identités suspectes, documents saisis.",
            ok: false, pts: -30,
            fb: "Sur-publication compromettante. Révéler les méthodes techniques détaillées (IoC, TTPs détectés) peut aider l'attaquant à adapter. Les identités = violation présomption innocence. Les documents saisis = secret instruction. Un équilibre est nécessaire.",
            legal: "Art. 73 CPP + Art. 10 CPP + Art. 320 CP — Limites à la publication.",
            critical: false, next: "end",
          },
          {
            text: "Contribution structurée : (A) Chronologie publique (sans détails opérationnels encore sensibles) ; (B) IoC anonymisés partageables via MISP-CH (domaines, hashes, TTPs génériques) ; (C) Leçons méthodologiques (coordination MPC-OFCS-SRC-DFAE, procédure accélérée TMC, gestion DélCdG) ; (D) Recommandations structurelles (renforcement Chancellerie, exercices CyberDefence, Loi InfoSec) ; (E) Pas de détails sur l'instruction en cours ni sur les suspects identifiés ; (F) Annexes classifiées à DélCdG + CF pour le détail opérationnel. Modèle de transparence à la MELANI RUAG 2016.",
            ok: true, pts: 30,
            fb: "Contribution au rapport national d'un grand niveau. Vous distinguez finement : (1) ce que la communauté cyber peut apprendre (méthodologie, IoC), (2) ce qui doit rester classifié (suspects, détails instruction), (3) ce qui enrichit le cadre légal futur (Loi InfoSec). Le rapport devient une référence internationale. C'est le legs pédagogique d'une affaire exceptionnelle bien gérée.",
            legal: "LTrans + Art. 73 CPP + Pratique RUAG 2016 + Doctrine OFCS — Transparence maîtrisée.",
            critical: false, next: "end",
          },
          {
            text: "Refuser toute contribution — l'instruction est en cours.",
            ok: false, pts: -20,
            fb: "Occasion manquée de grande ampleur. Le rapport MELANI RUAG 2016 a été publié alors même que certaines investigations continuaient — avec une séparation claire des niveaux. Refuser = priver la communauté cyber suisse d'enseignements cruciaux. La séparation publication/instruction est possible et souhaitable.",
            legal: "LTrans + Pratique MELANI 2016 — Publication cadrée possible.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 90 && custodyPct >= 85) return { icon: "🎖️", title: "Procureur·e d'Élite", sub: "Maîtrise exceptionnelle des affaires cyber d'État — Niveau fedpol sénior" };
      if (pct >= 75) return { icon: "🏛️", title: "Procureur·e Expérimenté·e", sub: "Solide maîtrise des incidents cyber multi-institutionnels" };
      if (pct >= 55) return { icon: "⚖️", title: "Procureur·e Formé·e", sub: "Bonnes bases, approfondissement recommandé sur les cas d'État" };
      return { icon: "📚", title: "Formation avancée requise", sub: "Ce scénario Expert requiert une expérience sénior. Recommencez après Hard." };
    },
  },

  /* ══════════════════════════════════════════════════
     28. EXPERT_FLAGSHIP_2 — Supply-Chain Santé  [EXPERT]
     Compromission d'un prestataire SaaS critique de santé suisse —
     scénario fictif inspiré de Kaseya, Change Healthcare 2024, etc.
  ══════════════════════════════════════════════════ */
  {
    id: "supply_chain_sante",
    title: "Supply-Chain Santé",
    icon: "🏥",
    difficulty: "expert",
    atmosphere: "hospital",
    realCase: "Scénario fictif — synthèse d'éléments inspirés de Kaseya 2021, Change Healthcare 2024, et de risques réels identifiés par le eHealth Suisse. Simule la compromission d'un éditeur SaaS de santé utilisé par 140+ hôpitaux et cliniques suisses. Conçu pour l'entraînement sénior sur la gestion multi-acteurs en contexte vital.",
    tags: ["FORENSIQUE", "DROIT", "RÉSEAUX", "WINDOWS"],
    legalRefs: ["LPD 2023 Art. 5", "LPTh", "Art. 321 CP", "Ordonnance DEP", "ISO/IEC 27036", "NIST SP 800-161", "eHealth Suisse", "LAM", "CLOUD Act"],
    intro: "Dimanche 04h12. Vous êtes CISO-de-garde de <strong>MediSwiss SA</strong>, éditeur SaaS genevois de <em>MedFlow</em>, solution de prescription électronique utilisée par 140 hôpitaux et cliniques en Suisse (2.1 millions de patients). Appel d'urgence : votre SOC détecte des connexions anormales vers plusieurs C2 depuis vos serveurs de production. Les hôpitaux clients signalent des lenteurs. Dans 2 heures, les équipes médicales du dimanche matin vont prescrire. Vos décisions vont engager des vies.",
    alertLevel: "🔴 COMPROMISSION SAAS SANTÉ — 140 hôpitaux impactés, risque vital",
    objectives: [
      { icon: "⚡", text: "Gérer la tension continuité médicale vs sécurisation forensique" },
      { icon: "🏥", text: "Coordonner 140+ établissements clients avec urgences médicales actives" },
      { icon: "⚖️", text: "Respecter LPD 2023 + LPTh + Art. 321 CP (secret médical)" },
      { icon: "🔐", text: "Qualifier l'étendue technique d'une compromission multi-tenant" },
      { icon: "📜", text: "Gérer la communication DFF (subventions OFSP), eHealth Suisse, cantons" },
    ],
    debrief: "<p>Ce scénario illustre les <strong>attaques supply-chain sur SaaS santé</strong>, une menace croissante depuis Change Healthcare (USA, février 2024, 100M de patients). En Suisse, le Dossier Électronique du Patient (DEP) et les solutions SaaS de prescription concentrent un risque systémique. Une compromission d'un seul éditeur impacte 140 hôpitaux simultanément — c'est l'effet cascade.</p><p>Les 11 étapes mettent en tension cinq dimensions : <strong>médicale</strong> (vies en jeu → pas d'arrêt brutal sans plan de continuité), <strong>forensique</strong> (preuves multi-tenant complexes), <strong>juridique</strong> (LPD 2023 + LPTh + Art. 321 CP secret médical), <strong>coordination</strong> (140 clients + OFSP + eHealth Suisse + cantons), <strong>réputationnelle</strong> (la confiance en santé numérique).</p><p>La maîtrise Expert suppose de savoir équilibrer ces dimensions en temps réel, en protégeant d'abord les patients — puis les preuves, puis l'entreprise.</p>",
    narrative: {
      success: "La continuité médicale est maintenue grâce au mode dégradé coordonné. La compromission est contenue en 36h, le vecteur (dépendance npm compromise) est identifié et publié. Les 140 établissements clients sont rassurés par la transparence. Le rapport post-mortem devient un cas d'école pour eHealth Suisse. La confiance envers MediSwiss survit — renforcée, même, par la qualité de la gestion.",
      degraded: "La compromission est contenue mais avec des séquelles : 2 hôpitaux ont dû suspendre la prescription électronique sur 48h, créant des incidents médicaux mineurs. Certaines données patients ont été exfiltrées sans pouvoir être chiffrées rétrospectivement. L'affaire passe au PFPDT en procédure ouverte. MediSwiss survit mais avec des contrats clients affaiblis.",
      failure: "Cascade d'erreurs : arrêt brutal des services = chaos médical dans 140 établissements, incidents vitaux documentés, plaintes pénales par familles, intervention OFSP forcée, sanction PFPDT maximale, résiliation de contrats par les grands hôpitaux (HUG, CHUV, USZ). MediSwiss dépose le bilan en 18 mois. Cas d'école négatif pour toute la cyber-santé suisse."
    },
    steps: [
      {
        phase: "⚡ 04h12 — Le signal multi-tenant",
        situation: "Votre SOC détecte simultanément depuis 03h47 : (1) connexions sortantes inhabituelles depuis 23 de vos 47 serveurs de production vers 3 IP européennes (domaines suspects, enregistrés il y a 6 jours), (2) pics de latence sur l'API de prescription électronique chez 12 hôpitaux clients, (3) le worker de backup a tenté une restauration automatique à 03h58 (signal inhabituel). Les équipes médicales du dimanche arrivent à 06h30.",
        law: "<strong>LPD 2023 Art. 24</strong> — Notification PFPDT.<br><strong>LPTh</strong> — Loi sur les produits thérapeutiques.<br><strong>Manuel Ch. 11.1</strong> — Capture forensique préalable.",
        question: "<strong>Votre première décision CISO ?</strong>",
        choices: [
          {
            text: "Arrêter immédiatement tous les services MedFlow pour stopper la compromission.",
            ok: false, pts: -35,
            fb: "Catastrophe sanitaire. Arrêter la prescription électronique chez 140 hôpitaux sans plan B = retour au papier non préparé, ordonnances ralenties, erreurs de dosage, urgences bloquées. L'arrêt brutal CRÉE un incident médical plus grave que la compromission potentielle. La règle en santé : stabiliser AVANT d'agir.",
            legal: "LPTh + Devoir de continuité médicale — L'arrêt brutal est une faute grave en santé.",
            critical: true, next: "end",
          },
          {
            text: "Action coordonnée 04h15-05h30 : (1) Activer la cellule de crise (CISO + CTO + DPO + direction médicale externe) ; (2) Passer immédiatement les 140 clients en mode dégradé PRÉPARÉ (cache local + backup lecture seule, pas de nouvelle prescription sans validation humaine) ; (3) Capturer RAM + logs sur 5 serveurs représentatifs SANS les éteindre ; (4) Isoler progressivement les serveurs compromis au niveau réseau (VLAN quarantaine) ; (5) Alerter OFCS + PFPDT en pré-notification. Horizon : tenir jusqu'à 06h30 en mode sécurisé.",
            ok: true, pts: 30,
            fb: "Décision CISO sénior exemplaire. Vous priorisez la continuité médicale (mode dégradé préparé) sans sacrifier la réponse cyber (capture forensique + isolation progressive). La cellule de crise active les bons acteurs immédiatement. La pré-notification OFCS/PFPDT respecte les obligations sans précipiter la communication publique. C'est la pratique ISO/IEC 27036 + NIST SP 800-161 appliquée à la santé.",
            legal: "LPD 2023 + LPTh + ISO/IEC 27036 + Manuel Ch. 11.1 — Réponse multi-dimensions maîtrisée.",
            critical: false, next: 1,
          },
          {
            text: "Attendre 08h00 le début de la journée ouvrable pour décider avec l'équipe complète.",
            ok: false, pts: -40,
            fb: "Abandon de poste en contexte vital. 4 heures d'attente = 4 heures d'exfiltration supplémentaire, de risque d'escalade attaquant (wiper), et surtout de prescriptions médicales faites sur un système compromis. Le CISO-de-garde DOIT décider, c'est précisément son rôle. Attendre = faute grave engageant sa responsabilité personnelle.",
            legal: "Art. 717 CO + Devoir de diligence CISO — Responsabilité personnelle en urgence.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🔬 05h45 — La cartographie technique",
        situation: "La cellule de crise est en place. L'analyse forensique progresse : la souche identifiée est <strong>un implant chargé par une dépendance npm compromise</strong> (<code>@medi-utils/pdf-gen</code> v3.4.7, téléchargée il y a 11 jours dans votre pipeline CI/CD). L'implant scanne les BDD multi-tenants et exfiltre par chunks HTTPS les prescriptions + AVS des patients. L'analyse préliminaire estime 340 000 à 850 000 dossiers patients potentiellement touchés.",
        law: "<strong>NIST SP 800-161</strong> — Supply Chain Risk Management.<br><strong>MITRE ATT&CK T1195.002</strong> — Compromise Software Supply Chain.<br><strong>LPD 2023 Art. 5 al. 1 let. c</strong> — Données médicales = sensibles.",
        question: "<strong>Quelle stratégie d'investigation forensique adoptez-vous ?</strong>",
        choices: [
          {
            text: "Se concentrer uniquement sur la dépendance compromise — c'est la source, le reste est collatéral.",
            ok: false, pts: -20,
            fb: "Vision trop étroite. La dépendance npm est le VECTEUR INITIAL, mais après 11 jours l'attaquant a probablement établi des persistances indépendantes (comptes de service, tâches planifiées, backdoors dans l'infrastructure). Remplacer juste la dépendance sans audit exhaustif = laisser les backdoors en place.",
            legal: "NIST SP 800-161 + MITRE T1195 — Auditer au-delà du vecteur initial.",
            critical: false, next: 2,
          },
          {
            text: "Cartographie systématique multi-niveaux : (A) Reverse de l'implant npm (YARA rules, IoC), (B) Audit forensique des 47 serveurs (hash comparison vs baseline, detection de persistance, WMI/scheduled tasks, comptes de service créés), (C) Analyse des logs de BDD multi-tenant (quels tenants ont été accédés/exfiltrés), (D) Reconstruction de la timeline d'intrusion sur 11 jours, (E) Identification précise des IoC à partager (hashes, IP C2, patterns), (F) Validation croisée avec GovCERT sur similarités d'attaques connues.",
            ok: true, pts: 30,
            fb: "Plan d'investigation sénior complet. Chaque niveau a une finalité claire : reverse pour comprendre, audit infra pour le nettoyage, logs BDD pour la notification LPD précise, timeline pour la qualification pénale, IoC pour la communauté, validation externe pour l'attribution. C'est l'approche NIST SP 800-161 appliquée à un cas réel supply-chain.",
            legal: "NIST SP 800-161 + MITRE T1195 + Manuel Ch. 20 + Pratique GovCERT.",
            critical: false, next: 2,
          },
          {
            text: "Sous-traiter entièrement l'investigation à un cabinet externe (Mandiant, SEC-Consult).",
            ok: false, pts: -15,
            fb: "Externaliser n'exonère pas. Même avec Mandiant sur le dossier (bon choix externe), le CISO doit garder la maîtrise stratégique : direction des priorités, arbitrage continuité/forensique, liaison avec les autorités, communication clients. Externaliser TOUT = perdre le contrôle.",
            legal: "Pratique SECO/FINMA — Externalisation avec gouvernance, jamais déresponsabilisation.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🏥 07h00 — Les 140 directions d'établissement",
        situation: "Le mode dégradé tient. Les directions des 140 hôpitaux clients commencent à appeler : HUG, CHUV, Inselspital Bern, USZ, Kantonsspital St-Gallen, plus de nombreuses cliniques privées. Leurs questions : « Nos patients sont-ils concernés ? », « Devons-nous suspendre le DEP ? », « Quelle est votre responsabilité ? », « Quelles données ont fuité ? ». Vous devez communiquer mais les données forensiques sont encore préliminaires.",
        law: "<strong>Art. 321 CP</strong> — Secret médical.<br><strong>Contrats SLA clients</strong> — Obligations contractuelles de notification.<br><strong>eHealth Suisse Code de bonnes pratiques</strong>.",
        question: "<strong>Quelle communication aux 140 établissements ?</strong>",
        choices: [
          {
            text: "Attendre 12-24h d'avoir des données forensiques complètes avant de communiquer.",
            ok: false, pts: -35,
            fb: "Violation contractuelle + perte totale de confiance. Les contrats SaaS santé exigent une notification clients sous quelques heures (pas jours) pour les incidents majeurs. De plus, 140 directions hospitalières sans information = 140 prises de décisions divergentes (certains vont suspendre MedFlow, créant des incidents médicaux). La transparence rapide, même partielle, est obligatoire.",
            legal: "Contrats SLA + Devoir d'information + eHealth Suisse — Communication rapide obligatoire.",
            critical: true, next: "end",
          },
          {
            text: "Communiqué structuré 07h15 aux 140 clients : (1) Incident en cours, compromission confirmée d'une composante, investigation active ; (2) Mode dégradé MedFlow opérationnel, poursuite possible de l'activité médicale en suivant les instructions jointes ; (3) Analyse d'exposition en cours, aucun établissement confirmé comme ayant subi une fuite à ce stade, mise à jour prévue toutes les 2h ; (4) Hotline dédiée 24/7 pour les DSI hospitalières ; (5) Engagement de transparence totale au fur et à mesure de l'investigation. Signé CEO + CISO + Direction Médicale.",
            ok: true, pts: 30,
            fb: "Communication de crise sénior exemplaire. Transparence sans précipitation, mode dégradé opérationnel rassurant, fréquence de mise à jour claire, hotline dédiée, signature de haut niveau. Les 140 DSI savent quoi faire, comment continuer leur activité, et quand attendre les prochaines informations. C'est la confiance reconstruite en temps réel.",
            legal: "eHealth Suisse + Contrats SLA + Bonnes pratiques crise — Communication maîtrisée.",
            critical: false, next: 3,
          },
          {
            text: "Envoyer un communiqué général rassurant affirmant qu'il n'y a pas eu de fuite de données.",
            ok: false, pts: -40,
            fb: "Mensonge qui détruit tout. Affirmer « pas de fuite » alors que l'investigation est en cours = (1) potentiellement faux (révélation ultérieure = catastrophe), (2) exposition pénale (Art. 251 CP, fausse communication), (3) destruction de la crédibilité à vie. En santé, un seul mensonge documenté = fin du contrat avec tous les grands hôpitaux.",
            legal: "Art. 251 CP + Contrats SLA — Fausse communication = faute grave.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🏛️ 09h30 — La coordination fédérale",
        situation: "L'OFCS prend l'initiative d'activer une cellule de crise fédérale : eHealth Suisse (coordination DEP), OFSP (autorité santé), PFPDT (données), fedpol cybercriminalité, cantons concernés. Le chef OFCS vous propose de devenir le point d'entrée technique fédéral pour l'incident. C'est un honneur mais aussi un risque (engagement, exposition médiatique, sur-exposition juridique).",
        law: "<strong>Ordonnance OFCS</strong> — Coordination fédérale.<br><strong>LoiFédDEP</strong> — Dossier électronique patient.<br><strong>Art. 320 CP</strong> — Secret de fonction (conséquences implicites).",
        question: "<strong>Quelle est votre position ?</strong>",
        choices: [
          {
            text: "Accepter en tant que point d'entrée unique, gérer seul la coordination fédérale.",
            ok: false, pts: -25,
            fb: "Prise de risque démesurée. Gérer SEUL la coordination avec 5 autorités fédérales + 26 cantons + 140 clients + investigation technique = surcharge qui garantit des erreurs. De plus, une seule personne point-d'entrée = risque opérationnel (indisponibilité, burn-out) et juridique (exposition personnelle).",
            legal: "Principe de résilience organisationnelle — Pas de SPOF humain.",
            critical: false, next: 4,
          },
          {
            text: "Accepter le rôle avec cadrage : (1) Désigner une équipe de liaison (CISO + DPO + avocat externe + com) pour partager la charge ; (2) Protocole de communication défini (quelles infos circulent, à quelle fréquence, avec quels filtres LPD/Art. 321 CP) ; (3) Reporting quotidien documenté ; (4) Support juridique interne présent à chaque réunion interinstitutionnelle ; (5) Engagement sur délais réalistes (48h investigation, 96h premières conclusions) ; (6) Revue hebdomadaire avec le CA de MediSwiss pour la gouvernance.",
            ok: true, pts: 30,
            fb: "Acceptation avec cadrage professionnel. Vous acceptez la responsabilité tout en la structurant pour qu'elle soit tenable. Chaque pilier (équipe, protocole, reporting, juridique, délais, gouvernance) a une finalité précise. C'est l'attitude attendue d'un CISO sénior face à une crise d'ampleur nationale.",
            legal: "Ordonnance OFCS + Pratique crise santé 2024 — Coordination cadrée.",
            critical: false, next: 4,
          },
          {
            text: "Refuser — ce n'est pas au CISO de MediSwiss de faire de la coordination fédérale.",
            ok: false, pts: -30,
            fb: "Fuite de responsabilité. MediSwiss est l'épicentre de la crise (prestataire compromis) ; refuser de coordonner = laisser l'OFCS et eHealth Suisse improviser sans la connaissance technique interne, ce qui augmente les erreurs publiques. Le CISO est précisément le bon interlocuteur technique — le refus témoigne d'un manque de maturité crisis-management.",
            legal: "Devoir de diligence CISO + Principe de coopération — Refus inadéquat.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "🔐 Lundi 06h00 — Le dilemme du déchiffrement forcé",
        situation: "24h après l'alerte. L'analyse identifie le point exact où l'implant a exfiltré les données : un chunk chiffré de 8.4 To compressé vers un bucket Azure (Pays-Bas) puis relayé vers une infrastructure russe. Problème : dans ces 8.4 To, vos propres clés de chiffrement LPD (stockées en RAM sur les serveurs, donc exfiltrées avec le reste) permettraient à l'attaquant de déchiffrer les données à froid. Vous pouvez tenter une opération de récupération Azure avant les 7 jours de rétention, mais cela exige une coopération avec Microsoft (CLOUD Act applicable).",
        law: "<strong>CLOUD Act (USA)</strong> — Juridiction étendue US sur Microsoft.<br><strong>Art. 272 CPP</strong> — Coopération internationale.<br><strong>LPD 2023 Art. 16</strong> — Transferts internationaux.",
        question: "<strong>Quelle action ?</strong>",
        choices: [
          {
            text: "Demander directement à Microsoft de saisir le bucket — temps critique, on ne peut pas attendre.",
            ok: false, pts: -25,
            fb: "Précipitation juridiquement problématique. Demander à Microsoft une saisie hors cadre judiciaire suisse = aucune valeur légale si le tribunal rejette la preuve plus tard ; exposition au CLOUD Act (Microsoft doit répondre aux US avant la Suisse). La voie juridique formelle est plus lente mais protège la recevabilité et la souveraineté.",
            legal: "Art. 272 CPP + CLOUD Act + ATF 149 I 218 — Voie formelle obligatoire.",
            critical: false, next: 5,
          },
          {
            text: "Coordination juridique multi-niveaux : (1) Demande urgente au MP via fedpol cybercriminalité pour ordonnance de saisie internationale ; (2) Parallèlement, demande préliminaire à Microsoft Trust & Security via canaux officiels pour <em>preservation order</em> (gel des données pendant procédure) — usage légitime et fréquent ; (3) Coordination simultanée avec autorité néerlandaise (où est le bucket) via Eurojust ; (4) Documentation procédurale complète ; (5) Briefing PFPDT sur le risque d'accès tiers via CLOUD Act. Objectif : gel dans 24h, saisie formelle dans 72h.",
            ok: true, pts: 30,
            fb: "Procédure juridique sénior. Vous distinguez <em>preservation</em> (gel immédiat) et <em>acquisition</em> (voie judiciaire formelle) — pratique standard en e-discovery transfrontalier. Le gel Microsoft est légitime, rapide, et compatible avec la souveraineté suisse. La saisie formelle suit la voie MP → Eurojust → autorité NL. Votre connaissance de ces mécanismes marque le niveau Expert.",
            legal: "Art. 272 CPP + Convention Budapest + Eurojust + pratique Microsoft Trust & Security.",
            critical: false, next: 5,
          },
          {
            text: "Renoncer — les données sont perdues, concentrons-nous sur la reconstruction.",
            ok: false, pts: -30,
            fb: "Fatalisme inapproprié. Le gel Azure est techniquement et juridiquement faisable. Abandonner = (1) perdre la preuve pour l'enquête pénale, (2) autoriser l'attaquant à exploiter les données complètes, (3) manquer à votre devoir de protection des patients. Un CISO sénior tente toutes les voies légales disponibles avant d'abandonner.",
            legal: "Devoir de diligence CISO + Art. 7 LPD 2023 — Effort de récupération attendu.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "⚖️ Mardi — La qualification des dossiers exfiltrés",
        situation: "L'analyse des logs BDD multi-tenant progresse : <strong>627 412 dossiers patients confirmés</strong> touchés (sur 47 tenants hospitaliers exposés). Parmi eux : 12 400 dossiers VIH/hépatites, 89 000 dossiers oncologie, 340 000 prescriptions psychiatriques, 186 000 interruptions de grossesse. Les données les plus sensibles sont disproportionnellement représentées car concentrées sur les plus grands hôpitaux clients.",
        law: "<strong>LPD 2023 Art. 5 al. 1 let. c</strong> — Données de santé = sensibles.<br><strong>LPD 2023 Art. 7 al. 3</strong> — Responsable du traitement.<br><strong>Convention 108+ Conseil de l'Europe</strong>.<br><strong>CEDH Art. 8</strong>.",
        question: "<strong>Stratégie de notification individuelle ?</strong>",
        choices: [
          {
            text: "Notification email générique à tous les 627 000 patients avec le même message.",
            ok: false, pts: -30,
            fb: "Traitement inadéquat pour les données sensibles. La fuite d'un dossier IVG, d'un séropositivité, ou d'un suivi psychiatrique peut avoir des conséquences graves : discrimination employeur, violence familiale, suicide même. L'approche doit être différenciée par sensibilité, avec accompagnement adapté pour les catégories à risque vital.",
            legal: "LPD 2023 Art. 5 + CEDH Art. 8 + Devoir de précaution — Protection différenciée.",
            critical: true, next: "end",
          },
          {
            text: "Stratégie différenciée : (A) 540 000 patients avec données standard : notification email + FAQ + monitoring identité gratuit ; (B) 78 000 patients avec données sensibles courantes (prescriptions psychiatriques, oncologie) : notification personnalisée + accompagnement psychologique offert ; (C) 9 400 patients avec données à risque vital (VIH, IVG, hépatites) : contact individuel via médecin traitant, évaluation de risque (violence conjugale, discrimination), support spécialisé ; (D) Cellule d'écoute 24/7 ; (E) Coordination avec associations (Aide Suisse contre le Sida, ProFemmes, etc.) ; (F) Prise en charge 100% des frais de soutien.",
            ok: true, pts: 30,
            fb: "Notification sénior-niveau. Vous distinguez les niveaux de risque et adaptez l'approche à chacun. Le contact via médecin traitant pour les données à risque vital est essentiel : il préserve la confidentialité et offre un soutien professionnel. La coordination avec les associations apporte une expertise spécifique. C'est le modèle qui émerge des grandes fuites médicales 2024 (Change Healthcare aux USA a adopté une approche similaire sous pression).",
            legal: "LPD 2023 Art. 5/7 + CEDH Art. 8 + Convention 108+ + pratique 2024 — Notification protective.",
            critical: false, next: 6,
          },
          {
            text: "Notification uniquement via les hôpitaux clients — c'est leur responsabilité envers leurs patients.",
            ok: false, pts: -25,
            fb: "Déresponsabilisation inappropriée. MediSwiss est le responsable du traitement (Art. 7 al. 3 LPD 2023) — la responsabilité ne s'externalise pas aux clients. Les hôpitaux ont leur propre part (co-responsable), mais le prestataire technique a une responsabilité autonome de notification. Se défausser = sanctions PFPDT aggravées.",
            legal: "LPD 2023 Art. 7/9 — Co-responsabilité, pas défausse.",
            critical: false, next: 6,
          },
        ],
      },
      {
        phase: "💰 Mercredi — Le contact des attaquants",
        situation: "Mercredi 14h22. Un email chiffré arrive sur l'adresse publique du CEO : le groupe <em>BlackMatrix</em> (inconnu, mais TTPs proches de BlackCat/ALPHV) revendique l'exfiltration de 8.4 To et propose : soit paiement de 18M CHF en Monero (non traçable) sous 72h avec garantie de suppression ; soit publication progressive. Le CEO vous consulte en urgence. Le CA se réunit dans 2h.",
        law: "<strong>GovCERT 2024</strong> — Non-paiement officiel.<br><strong>SECO Sanctions</strong> — BlackMatrix potentiellement listé.<br><strong>OFAC Advisory 2021</strong>.<br><strong>Art. 305bis CP</strong> — Blanchiment.<br><strong>Responsabilité CA</strong>.",
        question: "<strong>Quelle recommandation au CA ?</strong>",
        choices: [
          {
            text: "Payer — 18M vs risque de 627 000 dossiers publiés c'est rentable, et les dossiers sensibles justifient le coût humain.",
            ok: false, pts: -40,
            fb: "Analyse morale et juridique fautive. (1) Aucune garantie de suppression (Monero intraçable ne permet AUCUN contrôle post-paiement). (2) Risque SECO si BlackMatrix est listé (sanctions possibles pour MediSwiss ET pour les administrateurs personnellement). (3) Payer crée un incitatif pour d'autres attaques sur le secteur santé suisse. (4) Les dossiers sont DÉJÀ exfiltrés ; payer ne restaure pas la situation. C'est un calcul biaisé par l'émotion compréhensible.",
            legal: "GovCERT + SECO + OFAC + Art. 305bis CP — Paiement contraire à l'intérêt collectif.",
            critical: true, next: "end",
          },
          {
            text: "Recommandation structurée au CA : (1) Ne pas payer — arguments : zéro garantie, risque sanctions, alimentation du modèle criminel, pas de restauration effective ; (2) Investir l'équivalent (18M) dans : soutien patients affectés, durcissement sécuritaire MediSwiss, coopération fedpol internationale ; (3) Engagement transparence publique sur cette décision (valeur morale + effet dissuasif pour d'autres entreprises) ; (4) Documentation de la décision par le CA avec vote consigné (protection juridique des administrateurs) ; (5) Communication avec patients affectés les informant de la non-négociation.",
            ok: true, pts: 30,
            fb: "Recommandation sénior éthique et stratégique. Vous présentez au CA une analyse complète, une alternative constructive (l'argent ailleurs), et vous protégez juridiquement les administrateurs (documentation du vote). La communication de la décision aux patients est psychologiquement importante — ils savent que leur vie privée n'a pas été « marchandée ». C'est exactement ce qu'a fait Change Healthcare en 2024 (malgré leur paiement réel ultérieur, contesté).",
            legal: "GovCERT + Art. 717 CO + Pratique éthique CA — Décision structurée.",
            critical: false, next: 7,
          },
          {
            text: "Déléguer la décision au CA sans recommandation — c'est leur responsabilité.",
            ok: false, pts: -20,
            fb: "Esquive inappropriée. Le CISO a le devoir de conseiller le CA avec sa recommandation technique et éthique. Laisser un CA sans avis expert = augmenter le risque qu'il décide mal par méconnaissance. La décision appartient au CA, mais le conseil appartient au CISO.",
            legal: "Art. 717 CO + Devoir CISO — Conseil = obligation.",
            critical: false, next: 7,
          },
        ],
      },
      {
        phase: "🏛 Jeudi — La DélCdG santé et le Parlement",
        situation: "La Commission de la Santé du Conseil national demande une audition urgente. Des parlementaires réclament publiquement la nationalisation d'MediSwiss, des interdictions de prestataires SaaS étrangers, et des enquêtes au Conseil fédéral. Un parlementaire vaudois tweete : « Ces incidents ne peuvent plus se reproduire — il faut un monopole d'État sur la cyber-santé ». Le CEO est convoqué. Vous devez le briefer.",
        law: "<strong>Art. 169 Cst.</strong> — Haute surveillance.<br><strong>LParl Art. 137</strong> — Auditions.<br><strong>Art. 94 Cst.</strong> — Liberté économique.",
        question: "<strong>Points clés du briefing CEO ?</strong>",
        choices: [
          {
            text: "Attaquer frontalement les parlementaires : « La nationalisation est une absurdité populiste qui affaiblirait la cyber-santé suisse. »",
            ok: false, pts: -30,
            fb: "Stratégie politique catastrophique. Attaquer les parlementaires en audition publique = transformation immédiate en ennemis, amplification médiatique contre MediSwiss, potentielle enquête parlementaire supplémentaire. L'audition exige humilité sur l'incident et rigueur sur les faits — pas de polémique politique.",
            legal: "Art. 169 Cst. + Pratique audition — Respect institutionnel.",
            critical: false, next: 8,
          },
          {
            text: "Briefing en 5 axes : (1) Humilité transparente sur l'incident (pas de minimisation, pas d'excuses faciles) ; (2) Faits techniques : c'est une attaque supply-chain sophistiquée, documentée MITRE T1195 — pas une négligence spécifique MediSwiss ; (3) Chiffres : investissement sécuritaire MediSwiss vs moyenne sectorielle, audits ISO, certifications, personnel dédié ; (4) Recommandations constructives : renforcement des obligations NIST SP 800-161 sur TOUS les SaaS santé suisses (pas spécifique MediSwiss), création d'un label eHealth Suisse Sécurisé, obligation d'audit annuel par Swissdigin (pas de politique anti-privé) ; (5) Engagement personnel du CEO à partager les enseignements pour élever tout le secteur.",
            ok: true, pts: 30,
            fb: "Briefing stratégique sénior-niveau. Vous préparez le CEO à transformer une audition hostile en opportunité de contribution sectorielle. L'humilité ouvre l'oreille des parlementaires ; les faits techniques éduquent ; les chiffres légitiment ; les recommandations constructives montrent la vision ; l'engagement personnel rassure. C'est le type de brief qui sauve une entreprise — et potentiellement une industrie.",
            legal: "Art. 169 Cst. + LParl + Pratique institutionnelle — Audition préparée.",
            critical: false, next: 8,
          },
          {
            text: "Recommander au CEO de ne pas se présenter et d'envoyer un avocat.",
            ok: false, pts: -35,
            fb: "Erreur institutionnelle majeure. Refuser une audition parlementaire sur un incident de santé affectant 627 000 citoyens = affront démocratique catastrophique. La presse amplifierait en « MediSwiss fuit ses responsabilités ». Les parlementaires interpréteraient comme aveu. Un CEO d'entreprise stratégique SE PRÉSENTE TOUJOURS à une audition de Commission de la Santé.",
            legal: "Art. 169 Cst. + Devoir de coopération — Refuser = faute démocratique.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🔬 Vendredi — Le post-mortem technique",
        situation: "Une semaine après. L'investigation a abouti. Vecteur confirmé : dépendance npm compromise via un token GitHub volé à un mainteneur. Persistance : 3 comptes de service créés + 2 tâches planifiées + 1 implant WMI. Les 140 clients sont progressivement remontés en mode sécurisé. Vous devez maintenant produire le post-mortem technique pour : (a) GovCERT (partage IoC communauté), (b) clients (détaillé avec remédiation), (c) régulateurs (LPD + LPTh), (d) public (version grand public).",
        law: "<strong>LPD 2023 Art. 49</strong> — Transparence PFPDT.<br><strong>eHealth Suisse</strong> — Code de bonnes pratiques.<br><strong>NIST SP 800-61 Rev. 3</strong> — Lessons learned.",
        question: "<strong>Stratégie post-mortem ?</strong>",
        choices: [
          {
            text: "Un seul rapport technique détaillé identique pour tous les destinataires — simplicité.",
            ok: false, pts: -15,
            fb: "Inadéquat aux audiences. GovCERT veut des IoC actionables ; les clients veulent de la remédiation concrète ; les régulateurs veulent des preuves de conformité ; le public veut de la clarté pédagogique. Un seul document est soit trop technique (public) soit trop simpliste (GovCERT). La déclinaison multi-audiences est une compétence CISO sénior.",
            legal: "Bonnes pratiques communication — Message adapté à l'audience.",
            critical: false, next: 9,
          },
          {
            text: "4 livrables adaptés : (A) <strong>GovCERT</strong> : IoC techniques (hashes SHA-256, IP, domaines, YARA rules), TTPs MITRE, stix/taxii bundle partageable avec la communauté internationale ; (B) <strong>Clients (140 DSI)</strong> : chronologie détaillée + vecteur + mesures applicables chez eux (audit npm dependencies, détection WMI implants, rotation tokens GitHub) ; (C) <strong>Régulateurs (PFPDT + OFSP)</strong> : conformité LPD 2023 point par point, preuves audits antérieurs, mesures correctives chiffrées, plan de rehaussement sécurité ; (D) <strong>Public</strong> : version pédagogique 3 pages expliquant ce qui s'est passé, ce que MediSwiss a fait, ce qui va changer — lisible par un non-technicien. Coordination simultanée des 4 publications.",
            ok: true, pts: 30,
            fb: "Post-mortem sénior structuré et adapté. Chaque livrable a une finalité précise et un format optimisé pour son audience. La coordination simultanée évite les fuites ou divergences entre versions. C'est le modèle qu'a adopté GitHub après la crise Log4Shell — devenu une référence en post-mortem transparent.",
            legal: "LPD 2023 + eHealth + NIST + Pratique GitHub/Cloudflare — Communication multi-canal.",
            critical: false, next: 9,
          },
          {
            text: "Ne publier qu'un rapport interne + notification PFPDT minimale — limiter l'exposition.",
            ok: false, pts: -20,
            fb: "Vision défensive contre-productive. Ne pas publier pour la communauté = (1) priver d'autres entreprises santé des enseignements (autres victimes possibles), (2) manque de crédibilité « on cache des choses », (3) manquer l'opportunité de repositionner MediSwiss comme leader de la transparence cyber. La santé numérique a besoin de partage d'enseignements.",
            legal: "eHealth Suisse + Devoir sectoriel — Partage attendu.",
            critical: false, next: 9,
          },
        ],
      },
      {
        phase: "💼 J+30 — Les recours et assurances",
        situation: "Un mois après. Des plaintes civiles commencent à arriver : 3 patients VIH menacent d'une action collective (tort moral + dommage), 2 hôpitaux clients demandent des dommages contractuels, et votre cyber-assurance (AXA) conteste certains aspects du sinistre (clause exclusion « négligence grave »). Vous devez coordonner la défense juridique avec le conseiller général tout en maintenant la transparence.",
        law: "<strong>Art. 41 CO</strong> — Responsabilité civile.<br><strong>Art. 97 CO</strong> — Inexécution contractuelle.<br><strong>LPD 2023 Art. 49 al. 3</strong> — Accès aux données.<br><strong>Police cyber-assurance</strong>.",
        question: "<strong>Stratégie défense juridique ?</strong>",
        choices: [
          {
            text: "Adopter une position combative : contester TOUT (plaintes patients, demandes hôpitaux, AXA) en parallèle.",
            ok: false, pts: -25,
            fb: "Stratégie sub-optimale. Combattre simultanément des patients VIH victimes, des hôpitaux clients, et votre propre assureur = triple front juridique + image désastreuse + coûts de défense massifs. Chaque front exige une stratégie adaptée : empathie + négociation transactionnelle pour patients, coopération + indemnisation partielle pour hôpitaux, expertise juridique pour AXA.",
            legal: "Art. 41/97 CO + Pratique contentieuse — Stratégie différenciée par adversaire.",
            critical: false, next: 10,
          },
          {
            text: "Stratégie différenciée : (A) <strong>Patients VIH</strong> : proposition de médiation + fonds de solidarité patients (1M CHF) + accompagnement psychologique à vie + engagement de confidentialité réciproque — éviter un procès médiatique destructeur ; (B) <strong>Hôpitaux clients</strong> : négociation d'indemnisation contractuelle fondée sur les SLA + renforcement sécuritaire offert + conservation des contrats long-terme ; (C) <strong>AXA (cyber-assurance)</strong> : défense vigoureuse avec preuves d'audits antérieurs (ISO 27001 renouvelé 3 mois avant), diligence technique documentée, contestation de la qualification « négligence grave » ; (D) Coordination globale pour cohérence narrative.",
            ok: true, pts: 30,
            fb: "Stratégie juridique sénior. Vous traitez chaque catégorie selon sa nature : humanité pour les victimes, commerce pour les clients, droit pour l'assureur. Le fonds de solidarité patients est une démarche humaniste mais aussi stratégique (évite l'action collective destructrice). L'indemnisation hôpitaux préserve la relation long-terme. La défense AXA préserve les ressources pour les mesures réparatrices. Maîtrise complète.",
            legal: "Art. 41/97 CO + LPD 2023 + Pratique contentieuse post-cyber 2024.",
            critical: false, next: 10,
          },
          {
            text: "Accepter toutes les demandes sans discussion pour éviter le contentieux.",
            ok: false, pts: -30,
            fb: "Stratégie aussi dommageable que le combat total. Accepter inconditionnellement = (1) risque d'épuisement financier de MediSwiss, (2) signal à l'assureur que vous admettez « négligence grave » (perte de couverture), (3) précédent juridique qui encourage d'autres plaintes infondées. La négociation structurée est la voie.",
            legal: "Art. 717 CO — Devoir de diligence du CISO/CA envers l'entreprise.",
            critical: false, next: 10,
          },
        ],
      },
      {
        phase: "🔮 6 mois après — La transformation",
        situation: "Six mois après. MediSwiss a survécu. Les 140 clients sont restés (95% de rétention). Le CA vous propose une promotion : CISO du nouveau <em>Groupe eHealth Résilience Suisse</em>, une initiative inter-entreprises pour mutualiser la cybersécurité du secteur santé. Objectif : faire d'un incident un point de bascule positif pour toute l'industrie. Vous devez rédiger votre acceptation et votre vision.",
        law: "<strong>eHealth Suisse 2025</strong> — Orientation sécurité.<br><strong>Engagement sectoriel</strong>.<br><strong>Art. 10 Cst.</strong> — Vision citoyenne.",
        question: "<strong>Quelle est votre vision pour ce nouveau rôle ?</strong>",
        choices: [
          {
            text: "Refuser — j'ai donné ce que je pouvais, il est temps de partir à la retraite ou dans une autre industrie.",
            ok: false, pts: -15,
            fb: "Choix personnel respectable mais occasion manquée. Vous avez acquis une expertise unique (cas d'école supply-chain santé, coordination fédérale, crise multi-dimensions) que peu de CISO suisses possèdent. Refuser = priver l'industrie d'une ressource rare au moment où elle en a le plus besoin.",
            legal: "Pas de reproche juridique, mais occasion sectorielle manquée.",
            critical: false, next: "end",
          },
          {
            text: "Vision en 6 piliers : (1) <strong>Standards communs</strong> — adoption collective NIST SP 800-161 pour tout prestataire SaaS santé, certification obligatoire ; (2) <strong>SOC mutualisé</strong> — SOC 24/7 partagé entre MediSwiss + autres éditeurs santé ; (3) <strong>Threat intel sectoriel</strong> — plateforme MISP dédiée santé-CH, partage IoC automatisé ; (4) <strong>Red team annuelle</strong> coordonnée sur tout l'écosystème ; (5) <strong>Formation continue</strong> — programme de 200 heures/an pour les équipes IT santé ; (6) <strong>Transparence publique annuelle</strong> — rapport d'état de la cyber-santé suisse, incidents anonymisés, enseignements. Objectif 3 ans : faire de la Suisse la référence européenne en cyber-santé.",
            ok: true, pts: 30,
            fb: "Vision sénior transformationnelle. Chaque pilier répond à un enseignement de la crise : les standards évitent la répétition, le SOC mutualisé démocratise l'excellence, le threat intel décuple la détection, la red team éprouve, la formation élève, la transparence responsabilise. L'objectif Europe = ambition portée par l'expérience. Ce type de leadership transforme un incident en saut qualitatif sectoriel — c'est exactement ce que le secteur santé suisse a besoin post-2024.",
            legal: "eHealth Suisse 2025 + NIST SP 800-161 + Pratique Nordique (modèle Estonie).",
            critical: false, next: "end",
          },
          {
            text: "Accepter mais sans vision claire, décider au fil du temps.",
            ok: false, pts: -20,
            fb: "Position réactive inadaptée. Un rôle de cette importance exige une vision explicite dès le départ pour mobiliser les 140+ parties prenantes. Un « on verra » engendrera des divergences, des priorités incompatibles, et un échec dans les 12 mois. Le CA, les clients, les autorités attendent une direction forte.",
            legal: "Principe de leadership — Vision = condition du rôle.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct, custodyPct) {
      if (pct >= 90 && custodyPct >= 85) return { icon: "🎖️", title: "Architecte Cyber-Santé", sub: "Maîtrise exceptionnelle des crises SaaS critiques multi-vies" };
      if (pct >= 75) return { icon: "🏥", title: "CISO Santé Sénior", sub: "Solide maîtrise des incidents en contexte vital" };
      if (pct >= 55) return { icon: "⚕️", title: "Responsable Sécurité Santé", sub: "Bonnes bases — approfondissement recommandé sur gouvernance multi-acteurs" };
      return { icon: "📚", title: "Formation sénior requise", sub: "Ce scénario exige de l'expérience Hard avancée" };
    },
  },


  /* ══════════════════════════════════════════════════════════
     SCÉNARIOS SUISSES RÉELS — Affaires 2023-2026
     Sources : SATI Tessin, fedpol, Brigade cyber Genève
  ══════════════════════════════════════════════════════════ */

  /* ══════════════════════════════════════════════════
     A. SATI-BEC — Récupération BEC 18.6M CHF [HARD]
     Source : Police cantonale tessinoise, section SATI, 2024
     Vérifié : SWIFT Recall procédure, MLAT CH-SG, MLAT CH-HK,
               Art. 147 + 305bis CP, HKPF TCSD, CLOUD Act
  ══════════════════════════════════════════════════ */
  {
    id: "sati-bec",
    title: "Opération SATI — 18.6M en suspens",
    icon: "💸",
    difficulty: "hard",
    atmosphere: "crypto",
    realCase: "Police cantonale tessinoise, section SATI, 2024",
    narrative: {
      success: "La section SATI bloque le virement à temps. 18.6 millions de francs sont gelés puis restitués intégralement à Costruzioni Riviera SA. Le dossier est transmis au MPC avec une chaîne de preuves irréprochable — référence nationale en réponse BEC.",
      degraded: "Une partie des fonds est récupérée, mais 3.2M CHF fragmentés sur des comptes mules restent introuvables. L'affaire est transmise au MPC avec des lacunes probatoires qui fragilisent la poursuite.",
      failure: "Les fonds quittent le système bancaire international avant toute réaction judiciaire. 18.6 millions de francs évaporés. L'enquête commence à partir de rien — aucun suspect identifié."
    },
    tags: ["BEC", "SWIFT", "RÉPONSE INCIDENT", "DROIT PÉNAL"],
    legalRefs: ["Art. 147 CP", "Art. 305bis CP", "Art. 143 CP", "Art. 72 CPP", "MLAT"],
    intro: "14h37 — Un analyste de la section SATI (Sezione Analisi Tecnica Informatica, police cantonale tessinoise) reçoit un appel urgent. Une PME de Lugano vient de virer 18.6 millions de francs vers un compte étranger suite à des instructions par e-mail du « CEO ». Le DAF réalise maintenant que le message était frauduleux. Chaque minute compte — la fenêtre de blocage est de 90 minutes maximum.",
    alertLevel: "🔴 INCIDENT ACTIF — FONDS EN TRANSIT SWIFT INTERNATIONAL",
    objectives: [
      { icon: "⚡", text: "Déclencher la procédure SWIFT Recall dans les 60 premières minutes" },
      { icon: "🏦", text: "Coordonner le gel via canaux bancaires et judiciaires simultanément" },
      { icon: "🔬", text: "Préserver les preuves numériques de la compromission Exchange Online" },
      { icon: "⚖️", text: "Qualifier correctement les infractions (Art. 143 + 147 + 305bis CP)" },
      { icon: "🌍", text: "Activer les canaux MLAT CH-SG et CH-HK pour gel à l'étranger" },
    ],
    debrief: `<p>Les affaires BEC (Business Email Compromise) sont caractérisées par une <strong>fenêtre d'intervention critique de 30 à 90 minutes</strong> avant que les fonds soient fragmentés sur des comptes mules et deviennent irrécupérables. La section SATI tessinoise a démontré en 2024 qu'une réaction ultra-rapide permet une récupération intégrale.</p>
<p>Séquence correcte : <strong>(1) SWIFT Recall immédiat via la banque</strong> → (2) Ouverture procédure MPC en urgence → (3) Forensique boîte mail → (4) MLAT parallèles si fonds fragmentés. La règle absolue : <strong>banque d'abord, judiciaire ensuite</strong> — un mandat de séquestre prend des heures, le Recall se fait en minutes.</p><p><strong>Référence CH</strong> : SECO circulaire 2024 — le paiement d'une rançon BEC à une entité sanctionnée (OFAC/SECO) constitue une violation de la LMB suisse, indépendamment du caractère forcé. ATF 6B_1016/2023 (2024) — TF confirme : Art. 305bis CP (blanchiment) s'applique aux mules bancaires utilisées pour fragmenter les fonds BEC. Le SWIFT Recall (procédure R-transactions SWIFT) est la seule voie efficace dans la fenêtre de 90 minutes — délai documenté par la section SATI tessinoise (2024).</p>`,
    steps: [
      {
        phase: "⚡ H+0 — L'alerte initiale",
        situation: `Il est 14h37. Le DAF de <em>Costruzioni Riviera SA</em> (Lugano) vous appelle, en panique :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📧 Ce matin, il a reçu un e-mail urgent de son «&nbsp;CEO&nbsp;» pour une acquisition confidentielle — virement immédiat de 18.6M CHF vers un compte UBS à Singapore.<br>
📧 L'e-mail provenait de <code>marco.ferrari@costruzioni-riviera.ch</code> — adresse exacte du CEO.<br>
💸 Le virement SWIFT a été exécuté il y a exactement <strong>23 minutes</strong>.<br>
📞 Le vrai CEO appelle depuis Zurich — il n'a jamais rien demandé.
</div>`,
        law: "<strong>SWIFT CSP 2.9A</strong> — Recall d'urgence : activable par la banque émettrice sans mandat dans les 4 premières heures.<br><strong>Art. 147 CP</strong> — Utilisation frauduleuse d'un ordinateur : enrichissement via manipulation de système bancaire.<br><strong>Art. 305bis CP</strong> — Blanchiment : tentative punissable dès le transfert.",
        question: "<strong>Quelle est votre PREMIÈRE action dans les 5 prochaines minutes ?</strong>",
        choices: [
          {
            text: "Appeler immédiatement le responsable compliance d'UBS Lugano pour initier un SWIFT Recall — AVANT toute démarche judiciaire formelle.",
            ok: true, pts: 25,
            fb: "Action correcte et critique. Le <strong>SWIFT Recall</strong> (MT192/MT292) est la seule mesure technique pouvant bloquer le virement si les fonds n'ont pas encore atteint la banque destinataire. La fenêtre SATI est de 30 à 90 minutes. Toute démarche judiciaire (mandat, MPC) prendrait des heures — incompatible avec l'urgence.",
            legal: "SWIFT CSP 2.9A + pratique SATI — Recall bancaire en priorité absolue. Les 18.6M CHF ont été récupérés intégralement grâce à cette réaction en 2024.",
            critical: false, next: 1,
          },
          {
            text: "Ouvrir immédiatement une procédure pénale formelle auprès du MPC et attendre le mandat de séquestre avant toute action bancaire.",
            ok: false, pts: -20,
            fb: "Erreur fatale de séquence. Un mandat de séquestre prend plusieurs heures. À ce rythme, les 18.6M CHF seront fragmentés sur des comptes mules bien avant toute action. Règle SATI : <strong>banque d'abord, judiciaire ensuite</strong> — mais les deux en parallèle dès que possible.",
            legal: "Art. 263 CPP — Séquestre : nécessite ordonnance MP, délai incompatible avec urgence BEC de 90 minutes.",
            critical: true, next: "end",
          },
          {
            text: "Démarrer l'investigation forensique de la boîte Exchange du DAF pour identifier le vecteur de compromission.",
            ok: false, pts: -10,
            fb: "Priorité inversée. La forensique est essentielle, mais elle peut attendre 20 minutes. Les fonds, eux, sont en transit maintenant. <strong>Save the money first, then save the evidence.</strong> La forensique commence dès que le Recall est déclenché.",
            legal: "Bonne pratique DFIR — Triage basé sur l'impact irréversible : perte financière immédiate prime sur investigation.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "🏦 H+15min — La banque répond",
        situation: `Le compliance officer d'UBS Lugano confirme :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
✅ Recall SWIFT MT192 émis vers DBS Bank Singapore.<br>
⏳ DBS accuse réception mais <strong>ne confirme pas encore le gel</strong>.<br>
🏦 DBS exige : une <strong>injonction judiciaire suisse ou singapourienne</strong> sous 4 heures, ou un <strong>engagement de garantie</strong> de 50k CHF en cas de recall abusif.<br>
⚠️ DBS prévient que le bénéficiaire a déjà initié un sous-virement de 3.2M CHF vers Hong Kong.
</div>`,
        law: "<strong>MLAT CH-SG 1998</strong> — Entraide judiciaire Suisse-Singapour, Art. 5 : mesures provisoires urgentes (réponse attendue 24-48h en procédure urgente).<br><strong>Art. 72 CPP</strong> — Séquestre international : transmission via MP fédéral.<br><strong>HKPF TCSD</strong> — Technology Crime Division, Hong Kong : unité spécialisée, réactive 24/7 sur dossiers BEC.",
        question: "<strong>Comment obtenir l'injonction judiciaire pour DBS Singapore ET bloquer les 3.2M partis vers Hong Kong ?</strong>",
        choices: [
          {
            text: "Contacter le procureur de piquet du MPC, ouvrir une procédure d'urgence, demander une ordonnance de séquestre transmise via MLAT CH-SG — ET simultanément notifier l'HKPF TCSD via fedpol pour les 3.2M à Hong Kong.",
            ok: true, pts: 25,
            fb: "Double action simultanée — approche SATI correcte. Le <strong>MPC a un piquet 24h/24</strong> précisément pour ce type d'urgence. Le canal MLAT CH-SG avec Singapour est réactif (Singapour coopère activement sur cybercrime financier). La notification HKPF via fedpol active le canal CH-HK en parallèle.",
            legal: "MLAT CH-SG 1998, Art. 5 + MLAT CH-HK 1996 + Art. 72 CPP — Deux canaux parallèles pour maximiser la récupération. Procédure utilisée par SATI en 2024.",
            critical: false, next: 2,
          },
          {
            text: "Payer la garantie de 50k CHF demandée par DBS et attendre la procédure normale pour Hong Kong.",
            ok: false, pts: -15,
            fb: "Approche passive sur deux points. La garantie ne suspend pas le délai — DBS peut libérer les fonds après 4h quand même. Et l'absence d'action immédiate sur Hong Kong laisse 3.2M CHF s'évaporer dans des comptes mules. La garantie peut être versée <em>en complément</em> du MLAT, pas à la place.",
            legal: "Pratique bancaire — La garantie est complémentaire à l'injonction judiciaire, non substitutive.",
            critical: false, next: 2,
          },
          {
            text: "Saisir directement un tribunal singapourien pour une Mareva injunction sur les fonds DBS.",
            ok: false, pts: -10,
            fb: "Voie trop lente et coûteuse pour l'urgence. Une Mareva injunction (gel d'avoirs) requiert un avocat admis au barreau de Singapour, une audition et des frais importants — délai minimum 48-72h. Le MLAT CH-SG est précisément le canal conçu pour éviter cette lourdeur en urgence internationale.",
            legal: "Mareva Injunction SG — Mesure conservatoire efficace mais inadaptée à l'urgence BEC de 4 heures.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🔬 H+45min — Forensique Exchange Online",
        situation: `Le DAF donne accès à l'infrastructure mail Microsoft 365. Vos premières investigations dans le Compliance Center révèlent :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📋 Logs Azure AD : 3 connexions réussies depuis IP roumaine (185.220.x.x) ce matin entre 06h12 et 07h34.<br>
📧 L'e-mail frauduleux a été envoyé à 09h17 <strong>depuis l'intérieur du tenant M365</strong> (pas un spoofing externe).<br>
🔑 Aucune authentification multi-facteur (MFA) active sur le compte CEO.<br>
🕳️ Une règle de transfert automatique vers <code>ext-backup01@protonmail.com</code> a été créée le 08h42 — tous les e-mails reçus sont copiés silencieusement.
</div>`,
        law: "<strong>ACPO Principle 2</strong> — Minimisation des modifications lors de l'acquisition de preuves numériques.<br><strong>Art. 141 CPP</strong> — Admissibilité : hash SHA-256 et chaîne de custody documentée requises.<br><strong>Microsoft Compliance Center</strong> — Logs Exchange Online disponibles 90 jours (eDiscovery, Content Search).",
        question: "<strong>Quelle est votre stratégie forensique pour les 20 prochaines minutes, dans le bon ordre ?</strong>",
        choices: [
          {
            text: "Séquence : (1) Export eDiscovery des logs Exchange 90j avec hash SHA-256, (2) capture des unified audit logs Azure AD, (3) désactivation de la règle de transfert ProtonMail, (4) réinitialisation des credentials CEO — dans cet ordre précis.",
            ok: true, pts: 25,
            fb: "<strong>Collect → Contain → Remediate</strong> — ordre DFIR correct. L'export eDiscovery avec hash garantit l'admissibilité (Art. 141 CPP). La désactivation de la règle stoppe l'exfiltration continue. La réinitialisation vient APRÈS la collect — sinon on perd la visibilité sur les artefacts en cours d'exfiltration. L'attaquant est toujours en écoute tant que la règle ProtonMail est active.",
            legal: "ACPO Principle 2 + Art. 141 CPP — Séquence : acquérir avant de remédier. Logs Azure AD = artefacts clés pour établir la chronologie d'accès.",
            critical: false, next: 3,
          },
          {
            text: "Réinitialiser immédiatement le mot de passe du CEO pour expulser l'attaquant, puis investiguer.",
            ok: false, pts: -15,
            fb: "Mauvais ordre. En réinitialisant en premier, (1) vous alertez potentiellement l'attaquant qui pourrait effacer des traces, (2) vous perdez la visibilité sur la règle de transfert ProtonMail toujours active. Principe DFIR : <strong>observer et collecter avant d'agir</strong> (sauf si l'attaque est destructive et en cours).",
            legal: "ACPO Principle 1 — Ne pas modifier ce qui n'est pas strictement nécessaire avant l'acquisition des preuves.",
            critical: false, next: 3,
          },
          {
            text: "Appeler Microsoft support pour signaler la compromission et suspendre le compte CEO.",
            ok: false, pts: -15,
            fb: "Microsoft ne suspend pas un compte sur appel téléphonique — il faut passer par le <strong>Law Enforcement Portal</strong> avec ordonnance formelle, ou accéder soi-même au Compliance Center (vous y avez accès). L'accès direct via eDiscovery est plus rapide que toute procédure Microsoft.",
            legal: "Microsoft LEAPP — Demandes de conservation d'urgence : formulaire légal obligatoire, pas un appel support.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "⚖️ H+2h — Qualification juridique",
        situation: `Le MPC a ouvert une procédure. La procureure de piquet demande votre qualification pénale pour rédiger l'ordonnance de séquestre transmise à DBS Singapore.<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
Faits établis à ce stade :<br>
① Connexion non autorisée au compte CEO M365 (credentials volés — phishing probable 2 semaines avant)<br>
② Envoi d'un e-mail frauduleux depuis le compte compromis au DAF<br>
③ Virement de 18.6M CHF exécuté par le DAF<br>
④ Règle de transfert pour exfiltration continue des réponses<br>
⑤ Fonds en transit Singapore + 3.2M CHF vers Hong Kong
</div>`,
        law: "<strong>Art. 143 CP</strong> — Accès indu à un système informatique (sans droit).<br><strong>Art. 147 CP</strong> — Utilisation frauduleuse d'un ordinateur : virement via système bancaire.<br><strong>Art. 146 CP</strong> — Escroquerie : tromperie astucieuse d'une personne physique.<br><strong>Art. 305bis CP</strong> — Blanchiment d'argent : tentative suffit pour séquestre préventif.",
        question: "<strong>Quelles infractions retenir dans l'ordonnance de séquestre pour maximiser sa solidité devant les autorités singapouriennes ?</strong>",
        choices: [
          {
            text: "Art. 146 CP (escroquerie) + Art. 305bis CP (blanchiment) — le DAF a été trompé et les fonds sont blanchis.",
            ok: false, pts: -15,
            fb: "Qualification incomplète. Art. 146 seul peut être contesté par la défense : la tromperie visait une personne physique (DAF) mais le virement lui-même a été exécuté via un système informatique bancaire automatisé. Art. 147 CP couvre précisément ce cas. Sans 143 CP, l'accès au système CEO n'est pas qualifié.",
            legal: "ATF 140 IV 11 — Art. 146 CP exige tromperie d'une personne physique. Art. 147 CP s'applique quand le vecteur est un système informatique. Les deux peuvent coexister.",
            critical: false, next: 4,
          },
          {
            text: "Art. 143 CP + Art. 147 CP + Art. 305bis CP — accès indu, utilisation frauduleuse du système bancaire, blanchiment.",
            ok: true, pts: 25,
            fb: "Qualification complète et stratégique. <strong>Art. 143 CP</strong> qualifie l'accès non autorisé au compte M365 CEO. <strong>Art. 147 CP</strong> qualifie l'utilisation du compte compromis pour déclencher le virement SWIFT via le système bancaire (traitement automatisé de données). <strong>Art. 305bis CP</strong> est crucial : la tentative de blanchiment suffit pour le séquestre préventif — argument central pour DBS Singapore.",
            legal: "Art. 143 + 147 + 305bis CP en concours réel (Art. 9 CP). ATF 140 IV 11 — Art. 147 applicable aux systèmes bancaires automatisés. Art. 305bis = fondement légal du séquestre international.",
            critical: false, next: 4,
          },
          {
            text: "Art. 143 + 143bis + 146 + 147 + 305bis CP — le plus large possible pour couvrir tous les cas.",
            ok: false, pts: -10,
            fb: "Sur-qualification contreproductive. Art. 143bis (perturbation de système) n'est pas caractérisé ici — il n'y a pas eu de perturbation ou déni de service. Une ordonnance trop chargée d'infractions non établies affaiblit la crédibilité devant les autorités singapouriennes et peut retarder le gel.",
            legal: "Principe de précision pénale — Ne retenir que les infractions clairement établies par les faits.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "🌍 H+4h — DBS Singapore et HKPF répondent",
        situation: `Deux réponses simultanées :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
🇸🇬 <strong>DBS Singapore</strong> : 15.4M CHF gelés sur compte séquestre DBS. ✅<br>
🇭🇰 <strong>HKPF TCSD</strong> : 3.2M CHF localisés sur compte OCBC Hong Kong — gel provisoire accordé. L'enquêteur HK demande une attestation formelle des faits dans les 48h.<br>
⚠️ DBS signale : le compte bénéficiaire appartient à une société écran enregistrée aux British Virgin Islands (BVI) — directeur fictif.
</div>`,
        law: "<strong>Art. 72 CPP</strong> — Confiscation valeurs patrimoniales d'origine criminelle.<br><strong>MLAT CH-HK 1996</strong> — Art. 5 : mesures provisoires urgentes.<br><strong>FATF Recommandation 38</strong> — Gel et confiscation rapides des avoirs d'origine criminelle.",
        question: "<strong>Comment consolider le gel des 3.2M CHF à Hong Kong dans les 48 heures ?</strong>",
        choices: [
          {
            text: "Transmettre à l'HKPF TCSD via fedpol : attestation MPC des faits + ordonnance de séquestre traduite + chronologie forensique complète (logs Azure AD, SWIFT trace, règle ProtonMail) + qualification pénale suisse. En parallèle, demander au MPC une demande formelle d'entraide MLAT CH-HK.",
            ok: true, pts: 25,
            fb: "Dossier complet et structuré pour Hong Kong. L'HKPF TCSD est très efficace mais exige de la substance : attestation des faits, qualification pénale, et traçabilité forensique du virement. La double voie (fedpol informel + MLAT formel) maximise la réactivité. C'est la procédure utilisée par SATI pour les 3.2M CHF en 2024.",
            legal: "MLAT CH-HK 1996 Art. 5 + FATF R.38 + pratique SATI/fedpol — Attestation + qualification + forensique = dossier HK complet.",
            critical: false, next: 5,
          },
          {
            text: "Contacter directement OCBC Hong Kong par email pour leur signaler le gel — les banques coopèrent voluntairement.",
            ok: false, pts: -20,
            fb: "Illusion de rapidité. OCBC ne peut pas maintenir un gel volontaire sans base juridique — cela engage leur responsabilité envers leur client (la société écran). Sans ordonnance ou demande formelle via HKPF, le gel provisoire tombe à l'expiration du délai de 48h que l'HKPF vous a accordé.",
            legal: "Droit bancaire HK — Les banques ne peuvent maintenir un gel que sur instruction d'une autorité compétente ou d'un tribunal.",
            critical: false, next: 5,
          },
          {
            text: "Se concentrer sur les 15.4M CHF déjà gelés à Singapore — les 3.2M de Hong Kong sont une perte acceptable.",
            ok: false, pts: -25,
            fb: "Abandon prématuré et unjustifié. L'HKPF a déjà accordé un gel provisoire et demande simplement une attestation dans 48h — c'est une procédure simple à compléter. Abandonner 3.2M CHF quand les autorités HK coopèrent activement constitue une faute professionnelle.",
            legal: "Obligation de diligence SATI — Maximiser la récupération pour la victime est l'objectif prioritaire.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📋 J+3 — Rapport DFIR final",
        situation: `<strong>Résultat final : 18.6M CHF récupérés intégralement</strong> — 15.4M via DBS Singapore, 3.2M via HKPF/OCBC Hong Kong. L'affaire est transmise au MPC pour identification et poursuite des auteurs. La procureure demande un rapport DFIR final admissible et exploitable.`,
        law: "<strong>NIST SP 800-61r3</strong> — Structure standard du rapport post-incident.<br><strong>Art. 141 CPP</strong> — Admissibilité des preuves numériques : intégrité et traçabilité documentées.<br><strong>Directive OFCS 2024</strong> — Format de rapport d'incident cyber pour autorités fédérales.",
        question: "<strong>Quels sont les éléments INDISPENSABLES pour que le rapport DFIR soit admissible devant le MPC et exploitable dans une procédure internationale ?</strong>",
        choices: [
          {
            text: "Chronologie des événements + captures d'écran des e-mails + confirmation du virement récupéré.",
            ok: false, pts: -15,
            fb: "Rapport de surface, insuffisant pour le MPC. Manquent : hashes SHA-256 des preuves numériques (intégrité), logs Exchange et Azure AD avec horodatage certifié NTP, chaîne de custody documentée, analyse du vecteur BEC (phishing initial — comment le credentials CEO a été volé), IoC complets (IP, domaines, règle ProtonMail, comptes mules, SWIFT BIC), qualification juridique articulée, recommandations de remédiation.",
            legal: "Art. 141 CPP — Sans hash et chaîne de custody, la preuve numérique est contestable par la défense.",
            critical: false, next: "end",
          },
          {
            text: "Structure en 7 points : (1) Chronologie certifiée (horodatage NTP), (2) Preuves numériques avec hashes SHA-256, (3) Chaîne de custody documentée, (4) Analyse technique du vecteur (phishing → AiTM probable, credentials CEO compromis), (5) IoC complets (IP 185.220.x.x, règle ProtonMail, comptes BVI, SWIFT BICs), (6) Qualification juridique (143+147+305bis CP avec références ATF), (7) Recommandations de remédiation (MFA, sensibilisation CEO fraud, procédure virement ≥50kCHF).",
            ok: true, pts: 30,
            fb: "Rapport complet et admissible. Chaque élément a une fonction : l'horodatage certifié ancre la chronologie judiciaire, les hashes garantissent l'intégrité (Art. 141 CPP), les IoC alimentent les bases OFCS et l'enquête internationale, la qualification articule le dossier pénal, les recommandations protègent la victime. Format conforme à la directive OFCS 2024 et au standard NIST SP 800-61r3.",
            legal: "NIST SP 800-61r3 + Directive OFCS 2024 + Art. 141 CPP — Rapport post-incident BEC complet et admissible.",
            critical: false, next: "end",
          },
          {
            text: "Un rapport technique exhaustif de 300 pages couvrant chaque artefact Exchange trouvé — prouver la rigueur par le volume.",
            ok: false, pts: -10,
            fb: "Erreur de format. 300 pages non structurées sont inutilisables pour une procureure. Le MPC a besoin d'un <strong>résumé exécutif de 2 pages + annexes techniques indexées</strong>. La règle : lisible par un juriste non-technicien ET vérifiable par un expert tiers. La rigueur se mesure à la précision, pas au volume.",
            legal: "Pratique MPC — Les rapports forensiques trop volumineux non structurés ralentissent la mise en accusation.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 90) return { icon: "🦅", title: "Agent SATI Élite", sub: "Récupération intégrale — Maîtrise parfaite de la réponse BEC internationale" };
      if (pct >= 70) return { icon: "💰", title: "Spécialiste BEC", sub: "Fonds majoritairement récupérés — Bonne maîtrise des canaux d'urgence" };
      if (pct >= 50) return { icon: "🕵️", title: "Analyste Financier", sub: "Résultat partiel — Approfondissez les procédures MLAT et la séquence DFIR" };
      return { icon: "📚", title: "Formation BEC requise", sub: "Maîtrisez les 90 premières minutes — fenêtre critique de récupération" };
    },
  },

  /* ══════════════════════════════════════════════════
     B. SMS-BLASTERS — Opération Antenne Fantôme [MEDIUM]
     Source : Brigade cyber Genève + Police vaudoise, 2025
     Vérifié : Art. 179novies CP (interception télécoms),
               Art. 143bis CP (accès indu réseau),
               LTC Art. 50 (brouillage fréquences),
               Art. 269 CPP (surveillance télécoms),
               OFCOM/BAKOM compétences
  ══════════════════════════════════════════════════ */
  {
    id: "sms-blasters",
    title: "Opération Antenne Fantôme — SMS Blasters",
    icon: "📡",
    difficulty: "medium",
    atmosphere: "network",
    realCase: "Brigade des cyber enquêtes Genève + Police vaudoise, 2025",
    narrative: {
      success: "Les trois opérateurs de SMS blasters sont arrêtés. Le matériel saisi — deux IMSI catchers de fabrication chinoise — est présenté comme pièces à conviction avec l'analyse forensique complète. Les 12'000 victimes de fausses amendes sont informées. Qualification pénale solide.",
      degraded: "Deux suspects sont arrêtés mais le matériel principal est partiellement détruit. La qualification pénale tient sur les infractions principales, mais certains chefs d'accusation sont fragilisés par des lacunes forensiques.",
      failure: "Les suspects disparaissent avant l'intervention. Le matériel IMSI catcher est introuvable. Les seules preuves restantes sont les relevés téléphoniques — insuffisants pour une condamnation."
    },
    tags: ["TELECOM", "FORENSIQUE", "ENQUÊTE", "DROIT"],
    legalRefs: ["Art. 179novies CP", "Art. 143bis CP", "Art. 269 CPP", "LTC Art. 50"],
    intro: "La Brigade des cyber enquêtes de Genève reçoit une série de plaintes inhabituelles : des centaines de citoyens ont reçu des SMS d'amendes de stationnement frauduleuses réclamant un paiement immédiat en ligne. Les SMS semblent provenir du numéro officiel de l'administration genevoise. L'analyse révèle rapidement une technologie peu connue du grand public : les <em>SMS blasters</em> (IMSI catchers en mode diffusion).",
    alertLevel: "🔴 FRAUDE TÉLÉCOM — 12'000 victimes potentielles en Romandie",
    objectives: [
      { icon: "📡", text: "Identifier et comprendre le fonctionnement d'un SMS blaster / IMSI catcher" },
      { icon: "⚖️", text: "Établir la base légale pour la surveillance et l'investigation" },
      { icon: "🔍", text: "Géolocaliser et saisir le matériel en préservant les preuves" },
      { icon: "🏛️", text: "Qualifier correctement les infractions pénales suisses applicables" },
    ],
    debrief: `<p>Les <strong>SMS blasters</strong> (appelés aussi IMSI catchers en mode actif) sont des dispositifs qui se font passer pour une antenne-relais légitime d'opérateur téléphonique. Ils forcent les téléphones à proximité à se connecter à eux, leur permettant d'envoyer des SMS massifs en contournant les filtres anti-spam des opérateurs nationaux.</p>
<p>En Suisse, cette pratique viole simultanément plusieurs lois : <strong>Art. 179novies CP</strong> (interception de télécommunications sans droit), <strong>Art. 143bis CP</strong> (accès indu au réseau téléphonique), et <strong>Art. 50 LTC</strong> (brouillage illicite des fréquences). L'OFCOM/BAKOM peut également intervenir pour la violation des concessions de fréquences.</p>`,
    steps: [
      {
        phase: "📡 La plainte initiale",
        situation: `Une employée de la Ville de Genève vous contacte :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📨 Des dizaines de citoyens appellent la mairie : ils ont reçu des SMS d'amende de stationnement de 60 CHF, payables via un lien <code>g3nève-parking.ch</code>.<br>
📱 Le SMS indique qu'il provient du numéro <code>+41 22 123 45 67</code> — numéro officiel d'une régie genevoise.<br>
🔍 Les victimes confirment : le SMS est apparu dans le même fil de conversation que de vrais SMS officiels reçus précédemment.<br>
📊 En 48h, vous comptabilisez déjà 847 plaintes — essentiellement dans un périmètre du centre-ville de Genève.
</div>`,
        law: "<strong>Spoofing d'identifiant SMS</strong> — Technique de falsification de l'expéditeur d'un SMS (différente de l'IMSI catcher).<br><strong>IMSI Catcher actif</strong> — Dispositif simulant une antenne-relais qui force les téléphones à se connecter et permet l'injection de SMS.<br><strong>Art. 179novies CP</strong> — Interception de télécommunications sans droit.",
        question: "<strong>Les victimes affirment que le SMS est apparu dans le fil des vrais messages officiels. Quel est le mécanisme technique probable ?</strong>",
        choices: [
          {
            text: "Du spoofing classique d'identifiant SMS — l'expéditeur falsifie le numéro d'envoi, le téléphone place le SMS dans le bon fil de conversation.",
            ok: false, pts: -10,
            fb: "Le spoofing est plausible mais insuffisant ici. Le spoofing simple est généralement filtré par les opérateurs suisses (SINCH, Twilio filtres). Le fait que 847 SMS aient contourné <strong>tous les filtres</strong> des opérateurs suisses (Swisscom, Salt, Sunrise) simultanément suggère fortement un IMSI catcher — qui injecte les SMS directement dans le réseau GSM au niveau de la couche radio, en amont de tout filtre opérateur.",
            legal: "Technique IMSI catcher actif — Injection directe au niveau radio contourne les filtres anti-spam des opérateurs.",
            critical: false, next: 1,
          },
          {
            text: "Un IMSI catcher en mode actif (SMS blaster) — le dispositif simule une antenne-relais, force les téléphones à s'y connecter, puis injecte les SMS directement au niveau radio, contournant tous les filtres opérateurs.",
            ok: true, pts: 25,
            fb: "Analyse correcte. La signature clé est le <strong>contournement simultané des filtres des trois opérateurs suisses</strong> et l'apparition dans les fils de conversation légitimes. Un SMS blaster/IMSI catcher opère au niveau de la couche radio (2G/3G GSM), en amont de toute infrastructure opérateur — invisible aux filtres. La concentration géographique des plaintes confirme : un dispositif physique se déplace dans le périmètre.",
            legal: "Art. 179novies CP al. 1 — Interception ou injection dans une transmission par télécommunication sans droit.",
            critical: false, next: 1,
          },
          {
            text: "Un accès illicite aux systèmes informatiques des opérateurs téléphoniques suisses — les attaquants ont compromis l'infrastructure SMS.",
            ok: false, pts: -15,
            fb: "Hypothèse trop complexe et infirmée par les indices. Compromettre simultanément Swisscom, Salt et Sunrise nécessiterait une attaque d'une sophistication extrême. La concentration géographique des plaintes (centre-ville) et la dynamique mobile des cas plaident contre cette hypothèse — un IMSI catcher se déplace, une infrastructure compromise est statique.",
            legal: "Art. 143bis CP — L'accès à l'infrastructure opérateur serait une infraction distincte, non retenue ici.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "🗺️ La géolocalisation du dispositif",
        situation: `Votre analyse des plaintes révèle une pattern remarquable :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📍 Les 847 plaintes se concentrent dans un rayon de 400 mètres autour de la Rue du Rhône (Genève), sur 3 jours différents.<br>
⏰ Les SMS arrivent par vagues de 300-400 en 15-20 minutes, puis s'arrêtent — comme si l'émetteur se déplace.<br>
🚗 Deux témoins mentionnent avoir vu une camionnette blanche garée pendant 20 minutes dans le périmètre avant de partir.<br>
📡 Les téléphones victimes montrent une déconnexion brève (1-2 secondes) juste avant la réception du SMS — signature typique d'un IMSI catcher forçant la reconnexion.
</div>`,
        law: "<strong>Art. 269 CPP</strong> — Surveillance des télécommunications : exige une ordonnance du MP, un soupçon fondé et un délit passible de plus d'un an.<br><strong>Art. 273 CPP</strong> — Renseignements sur les raccordements : identification de l'abonné d'un numéro.<br><strong>OFCOM/BAKOM</strong> — Compétent pour localiser des émetteurs radio non autorisés (Art. 50 LTC).",
        question: "<strong>Pour géolocaliser et intercepter les opérateurs en flagrant délit, quelle combinaison d'autorisations et de techniques est nécessaire ?</strong>",
        choices: [
          {
            text: "Déployer immédiatement une équipe de surveillance mobile sans autorisation préalable — la flagrance justifie l'action immédiate.",
            ok: false, pts: -20,
            fb: "Erreur procédurale. La surveillance de télécommunications et la localisation d'un dispositif radio exigent des bases légales spécifiques même en flagrance. Une action non autorisée risque de rendre les preuves irrecevables (Art. 141 CPP). De plus, les IMSI catchers sont des émetteurs radio — leur localisation via des équipements spécialisés relève de la compétence de l'OFCOM.",
            legal: "Art. 141 CPP — Action policière non autorisée = risque d'exclusion des preuves. Art. 269 CPP = ordonnance MP obligatoire pour surveillance télécoms.",
            critical: false, next: 2,
          },
          {
            text: "Triple approche simultanée : (1) Ordonnance MP Art. 269 CPP pour surveillance des raccordements téléphoniques dans le périmètre, (2) Coordination avec OFCOM/BAKOM pour déploiement de détecteurs d'émissions radio non autorisées (Art. 50 LTC), (3) Surveillance physique mobile du périmètre par la brigade.",
            ok: true, pts: 25,
            fb: "Approche complète et légalement solide. Art. 269 CPP couvre la surveillance télécom. L'<strong>OFCOM/BAKOM a des équipes et équipements spécialisés de goniométrie</strong> (localisation d'émetteurs radio) — leur coordination est essentielle et légitime pour localiser un IMSI catcher. La surveillance physique complète le dispositif.",
            legal: "Art. 269 CPP + Art. 50 LTC + OFCOM compétences — Triple coordination légale pour IMSI catcher. Procédure utilisée en Romandie en 2025.",
            critical: false, next: 2,
          },
          {
            text: "Demander aux opérateurs téléphoniques (Swisscom) de localiser le dispositif via leurs propres antennes-relais.",
            ok: false, pts: -5,
            fb: "Approche partiellement valide mais insuffisante seule. Les opérateurs peuvent détecter des perturbations réseau mais n'ont pas d'équipements de goniométrie radio permettant une localisation précise d'un IMSI catcher en mouvement. C'est le rôle de l'OFCOM. La requête aux opérateurs (Art. 273 CPP) est utile en complément, pas en principal.",
            legal: "Art. 273 CPP — Renseignements utiles mais localisation radio = compétence OFCOM/BAKOM.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🚔 L'interpellation",
        situation: `J+5 — Les équipes OFCOM et la brigade cyber ont localisé le dispositif dans une camionnette Toyota HiAce blanche. En coordination avec la police d'intervention, trois suspects sont interpellés en flagrant délit dans la Zone de Plainpalais (Genève).<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
Contenu de la camionnette :<br>
🔧 2 dispositifs IMSI catcher de fabrication chinoise (marque ShengXin, modèle SX-2000), branchés sur onduleur<br>
💻 1 laptop avec logiciel d'administration des IMSI catchers (interface en chinois)<br>
📱 12 smartphones « burner » prépayés<br>
💵 18'400 CHF en cash<br>
📋 Un tableau Excel avec listes de numéros de plaques (pour cibler les propriétaires dans des zones)
</div>`,
        law: "<strong>Art. 248 CPP</strong> — Scellés sur matériel saisi.<br><strong>ISO/IEC 27037</strong> — Acquisition forensique de dispositifs numériques sur scène.<br><strong>Art. 50 LTC</strong> — Matériel de brouillage : saisie immédiate compétence OFCOM.",
        question: "<strong>Quelle est la procédure d'acquisition forensique prioritaire sur la scène d'interpellation ?</strong>",
        choices: [
          {
            text: "Éteindre tous les dispositifs immédiatement et les mettre sous scellés — éviter tout risque de modification.",
            ok: false, pts: -15,
            fb: "Trop hâtif. Éteindre un laptop en cours d'opération détruit potentiellement des données en RAM (sessions actives, clés de chiffrement, logs en cours). Pour les IMSI catchers : documenter d'abord l'état actif (est-il en train d'émettre ?), mesurer les fréquences utilisées avec un analyseur de spectre OFCOM avant d'éteindre — cette mesure est une preuve de l'émission illicite.",
            legal: "ISO/IEC 27037 + ACPO Principle 2 — Documenter l'état avant intervention. Appliquer live forensics si dispositifs actifs.",
            critical: false, next: 3,
          },
          {
            text: "Séquence : (1) Mesure OFCOM des fréquences radio émises (preuve de l'émission illicite), (2) Photos et vidéo de la scène et des connexions, (3) Dump RAM du laptop (WinPmem) avant extinction, (4) Inventaire complet avec hashes, (5) Scellés individuels sur chaque dispositif avec identification S/N.",
            ok: true, pts: 25,
            fb: "Procédure exemplaire. La <strong>mesure OFCOM des fréquences est la preuve irréfutable de l'émission illicite</strong> — elle doit précéder l'extinction. Le dump RAM du laptop préserve les sessions actives du logiciel d'administration. La photo de la scène et des connexions documente l'état opérationnel. Les scellés individuels garantissent la chaîne de custody.",
            legal: "Art. 50 LTC + ISO/IEC 27037 + ACPO Principles — Séquence complète : mesurer, documenter, capturer RAM, inventorier, sceller.",
            critical: false, next: 3,
          },
          {
            text: "Appeler un expert technique IMSI catcher pour qu'il analyse les dispositifs sur place avant toute saisie.",
            ok: false, pts: -10,
            fb: "Délai inutile et risque de contamination de scène. Les experts forensiques de la brigade sont compétents pour la saisie initiale. L'analyse technique approfondie (reverse engineering du firmware) se fait en laboratoire. Sur scène : documenter, capturer RAM, inventorier, sceller — pas analyser.",
            legal: "ACPO Principle 2 — L'analyse approfondie se fait en laboratoire sur copie, pas sur la scène d'interpellation.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "💻 L'analyse forensique du laptop",
        situation: `Au laboratoire, vous analysez le dump RAM (32 Go) et l'image disque du laptop. Vous trouvez :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
🔍 En RAM : l'interface d'administration ShengXin SX-2000 encore active — journal des 2'847 SMS envoyés sur 5 jours, avec horodatage et fréquences GSM utilisées.<br>
📁 Sur disque : 3 semaines de logs d'opérations — 12'400 SMS envoyés en total, coordonnées GPS des opérations, templates des faux SMS d'amendes.<br>
💬 Dans l'historique WhatsApp (app non chiffrée) : échanges avec un contact «&nbsp;FR-Coord&nbsp;» donnant les instructions et les «&nbsp;zones cibles&nbsp;» — numéros de téléphone français.<br>
💰 Fichier Excel chiffré (mot de passe trouvé en RAM) : 47 comptes bancaires «&nbsp;mules&nbsp;» ayant reçu les paiements frauduleux.
</div>`,
        law: "<strong>Art. 269 CPP</strong> — Exploitation des données de surveillance télécom (ordonnance nécessaire pour accès WhatsApp).<br><strong>Art. 48a EIMP</strong> — Entraide judiciaire internationale pour le contact «&nbsp;FR-Coord&nbsp;» (France).<br><strong>Art. 141 CPP</strong> — Admissibilité selon la procédure d'acquisition.",
        question: "<strong>La RAM contient l'accès au fichier Excel chiffré. Pouvez-vous l'exploiter directement et comment ?</strong>",
        choices: [
          {
            text: "Oui — la clé de déchiffrement en RAM + le fichier Excel chiffré = exploitation directe, sans procédure supplémentaire.",
            ok: true, pts: 20,
            fb: "Correct dans ce contexte. Le laptop a été saisi légalement avec ordonnance et la RAM a été capturée selon ACPO Principles. La clé de déchiffrement en RAM fait partie du dump forensique — son exploitation est légitime. Documenter précisément l'extraction de la clé (offset, méthode Volatility) pour la transparence en audience.",
            legal: "ACPO Principle 3 — La clé extraite de la RAM fait partie de la preuve légalement saisie. Documenter la méthode d'extraction pour auditabilité.",
            critical: false, next: 4,
          },
          {
            text: "Non — il faut une ordonnance supplémentaire pour déchiffrer le fichier, même si la clé est en RAM.",
            ok: false, pts: -10,
            fb: "Excessive prudence. La saisie légale du laptop inclut tout son contenu — la clé en RAM en fait partie. Il n'y a pas d'obligation procédurale d'obtenir une ordonnance supplémentaire pour déchiffrer un fichier avec une clé trouvée légalement dans la saisie. Comparer avec BitLocker (Manuel Ch. 24.3) : même logique.",
            legal: "Pratique MPC suisse — La saisie d'un dispositif inclut l'ensemble de son contenu, y compris les clés en RAM.",
            critical: false, next: 4,
          },
          {
            text: "Exploiter la clé RAM mais appliquer des scellés sur le fichier Excel jusqu'à tri TMC, pour éviter toute contestation.",
            ok: false, pts: 0,
            fb: "Position défensive mais contre-productive sur le timing. Les scellés (Art. 248 CPP) sont un droit du suspect, pas une obligation systématique. Si les suspects n'ont pas demandé les scellés, l'application volontaire ralentit inutilement l'investigation. En revanche, si les suspects demandent les scellés a posteriori, il faudra respecter cette demande.",
            legal: "Art. 248 CPP — Scellés à la demande du suspect, pas automatiques. Exploiter sans scellés si non demandés.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "⚖️ La qualification pénale",
        situation: `Le Ministère public genevois prépare la mise en accusation. Les trois suspects (ressortissants moldaves sans domicile fixe en Suisse) nient toute connaissance du fonctionnement des dispositifs — ils affirment avoir été «&nbsp;engagés pour conduire une camionnette&nbsp;». Le contact «&nbsp;FR-Coord&nbsp;» (France) fait l'objet d'une demande d'entraide internationale. Vous devez consolider la qualification pénale.`,
        law: "<strong>Art. 179novies CP</strong> — Écoute et enregistrement de communications non publiques sans droit (jusqu'à 3 ans de prison).<br><strong>Art. 143bis CP</strong> — Accès indu au système (réseau téléphonique) sans droit.<br><strong>Art. 50 LTC</strong> — Brouillage illicite de fréquences radio (infraction administrative + pénale possible).<br><strong>Art. 147 CP</strong> — Utilisation frauduleuse d'un ordinateur (via la plateforme de paiement frauduleuse).<br><strong>Art. 24/25 CP</strong> — Complicité (si les suspects sont les exécutants d'un réseau dirigé de France).",
        question: "<strong>Quelles sont les infractions principales à retenir et quel est l'argument contre la défense « je conduisais juste »?</strong>",
        choices: [
          {
            text: "Art. 50 LTC uniquement — l'infraction principale est le brouillage de fréquences, les autres sont accessoires.",
            ok: false, pts: -20,
            fb: "Qualification minimale et erronée. Art. 50 LTC est une infraction administrative/pénale légère. Les infractions pénales principales (Art. 179novies CP, Art. 143bis CP, Art. 147 CP) sont beaucoup plus graves et mieux documentées par vos preuves. Limiter à LTC reviendrait à traiter cela comme une simple infraction de radio-amateur non déclaré.",
            legal: "Art. 50 LTC — infraction accessoire au plan pénal principal (Art. 179novies + 143bis + 147 CP).",
            critical: false, next: "end",
          },
          {
            text: "Art. 179novies CP + Art. 143bis CP + Art. 147 CP en concours réel, avec Art. 24/25 CP (complicité) pour les suspects qui nient le rôle décisionnel. Contre la défense : les logs en RAM et disque prouvent une opération continue sur 3 semaines — incompatible avec un simple chauffeur.",
            ok: true, pts: 25,
            fb: "Qualification complète et réfutation solide. <strong>Art. 179novies CP</strong> : injection de SMS dans des télécommunications privées sans droit. <strong>Art. 143bis CP</strong> : le réseau téléphonique est un système informatique — l'IMSI catcher y accède sans droit. <strong>Art. 147 CP</strong> : la plateforme de paiement frauduleuse est exploitée via un système informatique. La <strong>défense « chauffeur »</strong> est réfutée par 3 semaines de logs d'opérations avec coordonnées GPS concordant avec les emplacements des suspects — preuve de participation active.",
            legal: "Art. 179novies + 143bis + 147 CP en concours (Art. 9 CP) + Art. 24/25 CP. ATF — Complicité établie par participation matérielle documentée.",
            critical: false, next: "end",
          },
          {
            text: "Escroquerie (Art. 146 CP) + Art. 179novies CP — le cœur de l'affaire est la fraude financière.",
            ok: false, pts: -10,
            fb: "Art. 146 CP (escroquerie) est contestable dans ce cas : l'escroquerie exige une tromperie astucieuse d'une personne physique induisant une erreur. Les victimes ont payé une fausse amende par SMS — la tromperie est là mais le vecteur est technique. Art. 147 CP (utilisation frauduleuse d'un ordinateur) est plus précis que 146 pour qualifier la plateforme de paiement frauduleuse. Qualification incomplète.",
            legal: "Art. 146 vs Art. 147 CP — ATF 140 IV 11 : quand le vecteur est un système informatique, 147 est plus approprié que 146.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 85) return { icon: "📡", title: "Expert IMSI Counter", sub: "Maîtrise parfaite de l'investigation IMSI catcher — référence en télécoms forensiques" };
      if (pct >= 65) return { icon: "🔍", title: "Analyste Télécom", sub: "Bonnes bases en investigation IMSI catcher" };
      if (pct >= 45) return { icon: "📱", title: "Technicien SMS", sub: "Approfondissez LTC et Art. 179novies CP" };
      return { icon: "📚", title: "Formation Télécom requise", sub: "Révisez les IMSI catchers et la LTC" };
    },
  },

  /* ══════════════════════════════════════════════════
     C. XPLAIN-PLAY — Task Force fedpol & Darknet [HARD]
     Source : Attaque groupe Play contre Xplain SA,
              2023-2024, Task Force fedpol 60+ experts,
              65'000 documents sur darknet, HOOGAN compromis.
     Vérifié : Rapport fedpol/OFCS 2023,
               Art. 286 CPP (agent infiltré numérique),
               LPD 2023 Art. 24, Art. 328 CP,
               Policeordnung fedpol Art. 15
  ══════════════════════════════════════════════════ */
  {
    id: "xplain-play",
    title: "Task Force Xplain — Darknet & HOOGAN",
    icon: "🕵️",
    difficulty: "hard",
    atmosphere: "ransomware",
    realCase: "Fedpol Task Force — Groupe Play contre Xplain SA, 2023-2024",
    narrative: {
      success: "La Task Force maîtrise la crise : périmètre documenté, HOOGAN sécurisé, données darknet monitored et classifiées, MPC informé. Fedpol publie un rapport transparent qui fait référence en gestion d'incident supply chain sectoriel fédéral.",
      degraded: "Le périmètre est partiellement documenté, HOOGAN reste exposé plus longtemps que nécessaire. Le rapport final présente des lacunes qui fragilisent la communication publique.",
      failure: "La Task Force perd le contrôle de la communication. Des journalistes téléchargent et publient des données HOOGAN. Des supporters violents identifient leur statut — procès en responsabilité contre la Confédération."
    },
    tags: ["SUPPLY CHAIN", "RANSOMWARE", "DFIR", "DROIT"],
    legalRefs: ["LPD 2023 Art. 24", "Art. 286 CPP", "Art. 328 CP", "MLAT", "Art. 72 CPP"],
    intro: "Juin 2023. Xplain SA, prestataire informatique fournissant des logiciels à fedpol, à l'armée et à plusieurs cantons, est frappé par le groupe ransomware Play. 65'000 documents exfiltrés sont publiés sur le darknet. Fedpol monte une Task Force de 60+ experts travaillant 24h/24. Vous en faites partie. La question brûlante : 10% des données concernent fedpol directement, dont des extraits du système HOOGAN (fichier des supporters violents). Que faire ?",
    alertLevel: "🔴 COMPROMISSION SUPPLY CHAIN — Données fédérales sur darknet",
    objectives: [
      { icon: "📂", text: "Établir le périmètre exact des données fedpol compromises" },
      { icon: "🌑", text: "Déterminer la base légale pour accéder aux données darknet" },
      { icon: "🔒", text: "Gérer l'exposition des données sensibles HOOGAN" },
      { icon: "📣", text: "Respecter les obligations LPD 2023 et coordonner la communication" },
      { icon: "🏛️", text: "Appuyer le MPC dans l'attribution du groupe Play" },
    ],
    debrief: `<p>L'affaire Xplain/Play (2023) est le cas d'école des <strong>attaques de la chaîne d'approvisionnement</strong> (supply chain attacks) ciblant les prestataires IT du secteur public. La compromission de Xplain SA a exposé simultanément des données de fedpol, de l'armée, du FISC et de plusieurs cantons — sans que ces entités aient elles-mêmes été attaquées.</p>
<p>Enseignements clés : (1) <strong>La vérification des données darknet est légale en Suisse</strong> quand elles sont publiquement accessibles — mais leur téléchargement massif relève d'une base légale différente. (2) <strong>HOOGAN</strong> (système d'information sur les hooligans violents, Art. 24a LSCI) est une donnée particulièrement sensible dont la compromission peut mettre en danger les personnes fichées. (3) La gestion de crise d'un incident supply chain exige une coordination multi-agences (fedpol, OFCS, MPC, autorités cantonales).</p>`,
    steps: [
      {
        phase: "🔍 H+0 — Notification et premier périmètre",
        situation: `J-Day. Fedpol reçoit la notification d'Xplain SA : le groupe Play a chiffré leurs systèmes et publié sur leur site darknet 65'000 fichiers exfiltrés avant chiffrement.<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📁 Xplain estime que les données publiées incluent des documents de plusieurs clients fédéraux et cantonaux.<br>
🌑 L'URL du site darknet du groupe Play est connue — les 65'000 fichiers sont actuellement accessibles publiquement.<br>
⚠️ Xplain n'est pas en mesure d'établir précisément quels documents fedpol sont inclus — leurs systèmes d'indexation sont chiffrés.<br>
🕒 La presse suisse-alémanique a déjà repéré la publication sur des forums de cybersécurité.
</div>`,
        law: "<strong>LPD 2023 Art. 24</strong> — Notification du PFPDT obligatoire si violation de données personnelles à risque élevé.<br><strong>Art. 286 CPP</strong> — Enquêtes couvertes : accès à des plateformes en ligne pour enquêtes.<br><strong>Jurisprudence TF</strong> — L'accès à des données publiquement disponibles sur internet ne constitue pas en soi une interception illicite.",
        question: "<strong>Quelle est votre première action pour établir le périmètre des données fedpol compromises ?</strong>",
        choices: [
          {
            text: "Attendre qu'Xplain rétablisse ses systèmes et fournisse un inventaire complet — ne pas accéder au darknet par prudence.",
            ok: false, pts: -20,
            fb: "Approche passive inacceptable dans ce contexte. Rétablir les systèmes d'Xplain peut prendre des semaines. Pendant ce temps, les données fedpol sont publiquement accessibles. <strong>La Task Force a pour mission de savoir exactement ce qui est exposé</strong> — c'est une urgence de sécurité nationale. L'accès à des données publiques sur le darknet est juridiquement différent de leur téléchargement massif.",
            legal: "Obligation fedpol — Evaluer l'exposition des données souveraines est une priorité de sécurité nationale.",
            critical: false, next: 1,
          },
          {
            text: "Accéder manuellement au site darknet Play (via Tor) pour recenser les noms de fichiers visibles — sans téléchargement massif — afin d'établir une première liste des documents fedpol potentiellement compromis.",
            ok: true, pts: 25,
            fb: "Approche légalement correcte et opérationnellement urgente. <strong>L'accès à des données publiquement disponibles</strong> (le groupe Play a publié volontairement ces fichiers) n'est pas assimilé à une interception illicite en droit suisse — la TF confirme que la consultation de contenus délibérément rendus publics est différente d'une surveillance. La Task Force fedpol a utilisé cette approche pour établir le périmètre des 65'000 documents.",
            legal: "Jurisprudence TF + Art. 286 CPP — Accès à données publiques darknet : légal. Téléchargement massif non documenté : à éviter sans base légale spécifique.",
            critical: false, next: 1,
          },
          {
            text: "Télécharger l'intégralité des 65'000 fichiers pour indexation et analyse complète — c'est le seul moyen d'avoir un inventaire fiable.",
            ok: false, pts: -10,
            fb: "Approche juridiquement risquée sans cadre légal défini. Le téléchargement massif de données d'origine criminelle peut soulever des questions sur Art. 160 CP (recel de données) si non encadré par une autorisation explicite du MPC. De plus, télécharger 65'000 fichiers attire l'attention du groupe Play sur l'investigation. La revue manuelle et indexée est préférable dans un premier temps.",
            legal: "Art. 160 CP potentiel + prudence opérationnelle — Éviter le téléchargement massif sans autorisation MPC explicite.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "🔒 Le système HOOGAN",
        situation: `Après 8 heures d'analyse par la Task Force (60+ experts travaillant en rotation 24h/24), vous identifiez que parmi les 65'000 documents :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📊 ~6'500 fichiers concernent directement fedpol.<br>
🚨 Parmi eux : <strong>des extraits du système HOOGAN</strong> — le fichier national des supporters violents (Art. 24a LSCI, Loi sur les mesures d'accompagnement).<br>
👤 Les données HOOGAN incluent : noms, photos, interdictions de stade, niveaux de danger — pour des centaines de personnes.<br>
⚠️ Si des personnes fichées découvrent leur statut via des tiers mal intentionnés, cela peut les mettre en danger (représailles) ou leur permettre d'adapter leur comportement.
</div>`,
        law: "<strong>HOOGAN (Art. 24a LSCI)</strong> — Fichier fédéral des hooligans, données particulièrement sensibles (Art. 5 LPD 2023).<br><strong>LPD 2023 Art. 5 al. 1 let. c</strong> — Données sur la personne révélant des opinions politiques ou des activités religieuses, des données biométriques ou génétiques, des données sur la santé = catégories particulières.<br><strong>LPD 2023 Art. 24</strong> — Notification PFPDT dans les meilleurs délais si risque élevé.<br><strong>Art. 328 CP</strong> — Violation du secret de fonction.",
        question: "<strong>Les données HOOGAN sont maintenant sur le darknet. Quelle est la priorité immédiate pour limiter les dommages ?</strong>",
        choices: [
          {
            text: "Notifier immédiatement et publiquement les 847 personnes fichées dans HOOGAN que leurs données sont compromises.",
            ok: false, pts: -15,
            fb: "Notification prématurée et contre-productive. Une notification publique immédiate (1) révèle aux intéressés qu'ils sont fichés dans HOOGAN — ce qu'ils ne savent peut-être pas, (2) peut déclencher des contestations judiciaires massives interférant avec l'enquête, (3) alerte les personnes les plus dangereuses. La notification aux personnes concernées est une obligation LPD 2023, mais elle doit être <em>coordonnée</em> et <em>pilotée</em> après évaluation du risque individuel.",
            legal: "LPD 2023 — Notification aux personnes concernées : obligation réelle, mais coordonnée avec les autorités judiciaires et de sécurité.",
            critical: false, next: 2,
          },
          {
            text: "Notifier immédiatement le PFPDT (LPD 2023 Art. 24) + coordination avec le MPC + évaluation individuelle du risque pour chaque personne HOOGAN avant toute notification personnelle.",
            ok: true, pts: 25,
            fb: "Approche en 3 niveaux correcte. (1) <strong>PFPDT doit être notifié</strong> (Art. 24 LPD 2023 — données de catégorie particulière = risque élevé automatique). (2) <strong>Coordination MPC</strong> pour définir ce qui peut être communiqué sans compromettre l'enquête sur Play. (3) <strong>Évaluation individuelle HOOGAN</strong> — le risque pour un supporter d'un club de foot local ≠ risque pour un individu d'un groupe ultras avec antécédents de violence. Notification personnalisée après évaluation.",
            legal: "LPD 2023 Art. 24 al. 1 + HOOGAN Art. 24a LSCI — Notification PFPDT obligatoire + coordination judiciaire avant notification individuelle.",
            critical: false, next: 2,
          },
          {
            text: "Ne rien notifier — les données sont déjà compromises, les notifications attireraient l'attention sur la violation.",
            ok: false, pts: -25,
            fb: "Violation grave de la LPD 2023. L'obligation de notification au PFPDT (Art. 24 LPD 2023) est inconditionnelle quand il y a risque élevé pour les personnes concernées. Les données HOOGAN = catégorie particulière = risque élevé automatique. Ne pas notifier expose fedpol à des sanctions administratives et peut constituer une violation de l'Art. 328 CP (violation du secret de fonction par omission).",
            legal: "LPD 2023 Art. 24 + Art. 328 CP — Omission de notification = infraction. Fedpol ne peut pas décider seul de ne pas notifier.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🌑 Monitoring du darknet",
        situation: `J+14. La Task Force a documenté l'exposition initiale. La direction de fedpol vous mandate pour mettre en place un <strong>monitoring continu du darknet</strong> pour suivre la propagation et l'utilisation des données exfiltrées. Vous devez définir le cadre légal de cette surveillance.`,
        law: "<strong>Art. 15 loi sur fedpol (RS 360)</strong> — Fedpol peut consulter des sources ouvertes (OSINT) dans le cadre de ses missions légales.<br><strong>Art. 286 CPP</strong> — Enquêtes couvertes dans des espaces virtuels : exige ordonnance MP, durée limitée.<br><strong>Art. 269 CPP</strong> — Surveillance de télécommunications : cadre strict.<br><strong>Distinction</strong> — OSINT darknet (légal, Art. 15 fedpol) vs. surveillance active de forums privés (Art. 286 CPP requis).",
        question: "<strong>Quelle est la base légale appropriée pour le monitoring darknet de la Task Force ?</strong>",
        choices: [
          {
            text: "Art. 15 loi sur fedpol (RS 360) — le monitoring de sources ouvertes (darknet public) relève de l'OSINT fédéral sans ordonnance supplémentaire.",
            ok: true, pts: 20,
            fb: "Correct pour la surveillance passive. <strong>Art. 15 loi fedpol</strong> autorise la consultation de sources ouvertes dans le cadre des missions légales de fedpol. Le site darknet du groupe Play est <em>délibérément public</em> (c'est leur méthode d'extorsion : publier pour faire pression). La surveillance passive de ce contenu public = OSINT légitime. La limite : si l'investigation doit pénétrer dans des forums fermés ou créer des comptes infiltrés, Art. 286 CPP s'applique.",
            legal: "Art. 15 loi fedpol (RS 360) + distinction OSINT/infiltration. ATF — Consultation de contenu délibérément public ≠ surveillance protégée.",
            critical: false, next: 3,
          },
          {
            text: "Art. 286 CPP — toute investigation sur le darknet est une enquête couverte nécessitant une ordonnance MP.",
            ok: false, pts: -10,
            fb: "Trop restrictif. Art. 286 CPP vise les <em>investigations couvertes</em> (création de faux profils, infiltration de forums privés). La simple consultation d'un site darknet public — comme le site de publication du groupe Play — est du même ordre que consulter un journal en ligne : pas d'ordonnance requise. L'Art. 286 CPP s'applique si la Task Force crée des identités fictives pour interagir avec le groupe Play.",
            legal: "Art. 286 CPP — Applicable à l'infiltration active, pas à la consultation passive d'espaces publics.",
            critical: false, next: 3,
          },
          {
            text: "Art. 269 CPP — le darknet utilise le réseau Tor, c'est une surveillance de télécommunications.",
            ok: false, pts: -15,
            fb: "Confusion entre couche réseau et couche applicative. Art. 269 CPP concerne la surveillance des <em>métadonnées télécom</em> (qui appelle qui, quand, depuis où). Consulter un site web via Tor n'est pas une surveillance de télécommunications — c'est accéder à un contenu web, même si le réseau sous-jacent est Tor. C'est l'équivalent de lire un journal en kiosque qui utilise une livraison anonymisée.",
            legal: "Art. 269 CPP — surveillance des contenus et métadonnées de télécommunications, pas de navigation web.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🕵️ L'attribution du groupe Play",
        situation: `J+45. Le MPC a ouvert une procédure pénale pour identifier les auteurs. Le groupe Play est connu de plusieurs services de renseignement occidentaux (FBI, BKA, Europol). La Task Force fedpol coordonne avec ces partenaires.<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
Éléments techniques disponibles :<br>
🌐 L'infrastructure C2 du groupe Play utilise des serveurs en Russie et en Roumanie.<br>
🔐 Le ransomware Play utilise des techniques MITRE ATT&CK : T1055 (Process Injection), T1486 (Data Encrypted for Impact), T1567 (Exfiltration Over Web Service).<br>
📧 Un e-mail de négociation a été envoyé à Xplain depuis une adresse ProtonMail — sans IoC exploitable directement.<br>
🤝 Le FBI partage des TTPs et des IoC liés à Play dans le cadre d'une procédure MLAT.
</div>`,
        law: "<strong>MLAT CH-USA</strong> — Échange de renseignements techniques avec le FBI.<br><strong>Convention Budapest Art. 29</strong> — Injonction de conservation urgente de données chez des prestataires étrangers.<br><strong>Art. 69 CPP</strong> — Ordonnance d'entraide internationale.",
        question: "<strong>Pour progresser sur l'attribution, quelle est la demande MLAT la plus utile à adresser au FBI ?</strong>",
        choices: [
          {
            text: "Demander tous les renseignements que le FBI possède sur le groupe Play — large demande pour maximiser les informations.",
            ok: false, pts: -10,
            fb: "Demande trop large et contre-productive. Le FBI ne répond pas aux demandes MLAT vagues — elles doivent être spécifiques et justifiées. Une demande large augmente le délai de traitement et révèle moins de maturité investigative. Le MLAT doit cibler des éléments précis corrélables aux faits suisses.",
            legal: "Pratique MLAT — Les demandes doivent être spécifiques, proportionnées et liées à des faits établis.",
            critical: false, next: 4,
          },
          {
            text: "Demande ciblée : (1) Partage des IoC liés aux campagnes Play contre des cibles similaires (prestataires IT gouvernementaux) depuis 2022, (2) Corrélation des TTPs FBI avec ceux observés dans l'attaque Xplain (T1055, T1486, T1567), (3) Demande de conservation urgente (Convention Budapest Art. 29) pour les serveurs C2 Play en Roumanie via MLAT CH-RO.",
            ok: true, pts: 25,
            fb: "Demande MLAT structurée et exploitable. Chaque point est précis et justifié par les faits : (1) historique de Play contre des cibles similaires = pattern d'attribut, (2) corrélation de TTPs = renforcement de l'attribution technique, (3) conservation urgente en Roumanie via MLAT CH-RO = action préventive avant destruction de preuves. La Convention Budapest Art. 29 permet une conservation d'urgence sans attendre la procédure formelle.",
            legal: "MLAT CH-USA + Convention Budapest Art. 29 + MLAT CH-RO — Demande multi-canal ciblée. Procédure utilisée par fedpol dans l'affaire Play.",
            critical: false, next: 4,
          },
          {
            text: "Contacter directement Europol et interpeller les serveurs roumains sans MLAT — plus rapide.",
            ok: false, pts: -20,
            fb: "Double erreur. (1) Europol ne peut pas agir en Roumanie sans demande nationale via le BCN roumain — et Europol n'a pas de pouvoir d'arrestation ou de saisie. (2) L'interpellation de serveurs à l'étranger sans MLAT est une violation de souveraineté nationale potentiellement nuisible à toute la procédure judiciaire suisse (Art. 141 CPP — exclusion des preuves).",
            legal: "Souveraineté nationale + Art. 141 CPP — Action unilatérale à l'étranger = preuves irrecevables en Suisse.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📣 La communication publique",
        situation: `J+60. Après deux mois d'enquête intensive, la pression médiatique est maximale. Des journalistes d'investigation ont découvert l'existence des données HOOGAN sur le darknet. La direction de fedpol doit décider de la stratégie de communication publique. Vous participez à la cellule de crise communication.`,
        law: "<strong>LPD 2023 Art. 24</strong> — Communication aux personnes concernées si risque élevé.<br><strong>Transparence et obligation de rendre compte</strong> — Principe de bonne gouvernance.<br><strong>Art. 328 CP</strong> — Violation du secret de fonction par communication non autorisée.",
        question: "<strong>Quelle est la stratégie de communication optimale pour fedpol à ce stade ?</strong>",
        choices: [
          {
            text: "Ne rien publier — attendre la fin de l'enquête judiciaire pour ne pas compromettre les poursuites.",
            ok: false, pts: -20,
            fb: "Silence intenable à ce stade. Les journalistes ont déjà l'information — le silence de fedpol serait interprété comme dissimulation et alimenterait des spéculations bien pires que la réalité. De plus, l'obligation de notification LPD 2023 est une obligation légale, pas un choix de communication.",
            legal: "LPD 2023 Art. 24 + principe de gouvernance transparente — Le silence est une option pire que la transparence maîtrisée.",
            critical: false, next: 5,
          },
          {
            text: "Publication proactive en deux niveaux : (1) Communiqué fedpol confirmant l'incident, le périmètre (10% de données fedpol, dont HOOGAN partiellement), et les mesures prises — sans détails judiciaires. (2) Notification individuelle coordonnée aux personnes HOOGAN identifiées comme exposées, via des canaux sécurisés et en lien avec les services compétents.",
            ok: true, pts: 25,
            fb: "Stratégie de communication maîtrisée. La transparence proactive (sur les faits établis, sans détails judiciaires sensibles) est <strong>supérieure au secret</strong> dans ce contexte : fedpol reprend la main sur le récit, montre la diligence, respecte les obligations LPD 2023, et anticipe les questions des médias. La notification individuelle HOOGAN doit être préparée avec les services de sécurité (comment notifier une personne qui pourrait représenter un risque si elle sait qu'elle est fichée).",
            legal: "LPD 2023 Art. 24 + pratique fedpol/OFCS 2023-2024 — Communication transparente et coordonnée. Fedpol a effectivement adopté cette approche.",
            critical: false, next: 5,
          },
          {
            text: "Publier tous les détails immédiatement — transparence totale incluant l'enquête en cours et les IoC identifiés.",
            ok: false, pts: -15,
            fb: "Transparence excessive contre-productive. Publier les IoC, les TTPs et les détails de l'enquête en cours revient à <strong>informer le groupe Play de l'avancement de la traque</strong> — leur permettant d'effacer des traces. La transparence doit couvrir l'incident et les mesures prises, pas les détails opérationnels de l'investigation judiciaire.",
            legal: "Art. 69 CPP — Secret de l'instruction. Art. 328 CP — Divulgation non autorisée de l'enquête.",
            critical: false, next: 5,
          },
        ],
      },
      {
        phase: "📋 Le rapport de la Task Force",
        situation: `J+90. La Task Force clôture ses travaux. Vous rédigez le rapport final destiné à la Direction fedpol, au DFAE, au MPC et — dans une version expurgée — au PFPDT et au public. Ce rapport est un document de référence pour prévenir de futures supply chain attacks sur le secteur public suisse.`,
        law: "<strong>NIST SP 800-161</strong> — Cybersecurity Supply Chain Risk Management.<br><strong>Directive OFCS 2024</strong> — Gestion des incidents de sécurité dans l'administration fédérale.<br><strong>Art. 52 LOGA</strong> — Rapport administratif fédéral.",
        question: "<strong>Quelle est la recommandation structurelle principale pour prévenir une nouvelle supply chain attack sur un prestataire fédéral ?</strong>",
        choices: [
          {
            text: "Interdire aux prestataires IT de stocker des données fédérales — tout doit être géré en interne par la Confédération.",
            ok: false, pts: -10,
            fb: "Recommandation irréaliste et contreproductive. L'externalisation IT est une réalité économique et opérationnelle incontournable pour l'administration fédérale. L'interdire totale serait disproportionnée et creuserait un retard technologique. La solution est un <strong>cadre de certification des prestataires</strong>, pas leur exclusion.",
            legal: "Principe de proportionnalité + réalité économique — Recommandation inapplicable.",
            critical: false, next: "end",
          },
          {
            text: "Mise en place d'un référentiel de sécurité obligatoire pour tout prestataire IT fédéral : (1) Certification ISO 27001 avec audit tiers annuel, (2) Séparation physique des données fédérales des données commerciales, (3) Droit d'audit fedpol/OFCS chez les prestataires, (4) Obligation de notification dans les 24h de tout incident, (5) Tests de pénétration annuels sur les systèmes hébergeant des données fédérales, (6) Clause contractuelle de séquestre du code source en cas de défaillance.",
            ok: true, pts: 30,
            fb: "Recommandation structurée et réaliste. Chaque point répond à un enseignement de l'affaire Xplain : ISO 27001 manquant → certification obligatoire ; données fédérales mêlées aux données commerciales → séparation ; fedpol ne savait pas ce qu'Xplain hébergeait → droit d'audit ; 48h avant notification → réduction à 24h ; vulnérabilités non testées → pen tests obligatoires. C'est l'essence de NIST SP 800-161 adapté au contexte fédéral suisse.",
            legal: "NIST SP 800-161 + Directive OFCS 2024 + ISO 27001 — Référentiel supply chain fédéral. Fedpol a effectivement adopté des mesures similaires post-Xplain.",
            critical: false, next: "end",
          },
          {
            text: "Publier la liste de tous les prestataires IT fédéraux pour permettre une surveillance citoyenne de leur sécurité.",
            ok: false, pts: -20,
            fb: "Recommandation dangereuse. Publier la liste exhaustive des prestataires IT fédéraux est une information de valeur pour les groupes adversaires (identification des cibles de supply chain attack). La transparence sur les <em>exigences de sécurité</em> est utile ; la transparence sur les <em>fournisseurs sensibles</em> est contre-productive.",
            legal: "Sécurité opérationnelle — Information utile aux adversaires : à ne pas publier.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "🦁", title: "Chef de Task Force", sub: "Maîtrise exemplaire de la crise supply chain — référence fedpol" };
      if (pct >= 70) return { icon: "🕵️", title: "Analyste Task Force", sub: "Solide gestion de la crise Xplain — quelques lacunes à combler" };
      if (pct >= 50) return { icon: "🔍", title: "Expert Débutant", sub: "Bases présentes — approfondissez supply chain et MLAT" };
      return { icon: "📚", title: "Formation supply chain requise", sub: "Révisez NIST SP 800-161 et LPD 2023 Art. 24" };
    },
  },

  /* ══════════════════════════════════════════════════════════
     SCÉNARIOS JURISPRUDENCE ATF — Arrêts publiés 2022-2025
     Sources : ATF 150 IV 188, TF 7B_102/2024, MPC 2024
  ══════════════════════════════════════════════════════════ */

  /* ══════════════════════════════════════════════════════════
     A. BANQUIER FANTÔME — Social Engineering 5M CHF [HARD]
     Source : MPC communiqué 09.04.2024 + TF 6B_683/2021 (Art.147 métier)
     Affaire réelle : Ressortissant franco-israélien, CHF 5M, 2016-2018,
                      Suisse romande, extradition USA, condamné TPF 2025
  ══════════════════════════════════════════════════════════ */
  {
    id: "banquier-fantome",
    title: "Opération Banquier Fantôme",
    icon: "📞",
    difficulty: "hard",
    atmosphere: "crypto",
    realCase: "MPC / fedpol, procédure 2017-2025 — ressortissant franco-israélien condamné",
    narrative: {
      success: "Le réseau de social engineering est démonté. L'analyse forensique démontre l'aggravante du métier (Art. 147 al. 2 CP). L'extradition est exécutée, le prévenu condamné. 5 millions de CHF partiellement récupérés.",
      degraded: "La qualification par métier est difficile à prouver. Le prévenu écope d'une peine plus légère. Les fonds restent majoritairement irrécupérables.",
      failure: "L'investigation numérique est trop lacunaire. La défense obtient l'exclusion des preuves clés. Le prévenu bénéficie d'un non-lieu partiel."
    },
    tags: ["SOCIAL ENGINEERING", "DROIT PÉNAL", "RÉSEAUX", "FORENSIQUE"],
    legalRefs: ["Art. 143 CP", "Art. 143bis CP", "Art. 147 al. 2 CP", "Art. 49 CP", "MLAT CH-USA"],
    intro: "2017. Le Ministère public de la Confédération reprend une instruction ouverte par le MP de Neuchâtel. Une série d'arnaques dites 'au faux technicien bancaire' a frappé des entreprises de Suisse romande entre 2016 et 2018. Le préjudice total dépasse 5 millions de CHF. Les victimes ont reçu des appels de 'techniciens' de leur banque, leur demandant d'installer un logiciel de support à distance — qui permettait en réalité de vider leurs comptes. Vous êtes l'analyste forensique mandaté par le MPC.",
    alertLevel: "🔴 PROCÉDURE FÉDÉRALE — CHF 5M de détournements, auteur identifié à l'étranger",
    objectives: [
      { icon: "🔬", text: "Analyser les artefacts numériques des sessions de prise en main à distance" },
      { icon: "⚖️", text: "Qualifier correctement les infractions (Art. 143 + 143bis + 147 al. 2 CP)" },
      { icon: "📊", text: "Établir l'aggravante du 'métier' selon la jurisprudence TF" },
      { icon: "🌍", text: "Préparer le dossier d'extradition depuis les USA" },
    ],
    debrief: `<p>L'affaire du faux technicien bancaire illustre une forme sophistiquée de social engineering : l'attaquant se fait passer pour un collaborateur de la banque victime, convainc sa cible d'installer un outil de prise en main à distance (TeamViewer, AnyDesk), puis vide les comptes en temps réel. La qualification de l'art. 147 CP (utilisation frauduleuse d'un ordinateur) est appropriée car le processus bancaire est automatisé — la victime humaine est trompée mais c'est le système qui exécute le virement.</p>
<p>L'aggravante du <strong>métier (Art. 147 al. 2 CP)</strong> est centrale : selon TF 6B_683/2021 et TF 6B_368/2020, elle est établie par la fréquence des actes, le montant total, et l'organisation professionnelle de l'activité délictueuse. Le MPC a réussi à démontrer que le prévenu agissait comme un professionnel de la cyberfraude.</p>`,
    steps: [
      {
        phase: "🔬 L'analyse des sessions RDP/AnyDesk",
        situation: `L'investigation numérique des ordinateurs victimes révèle des traces cohérentes.<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
Artefacts récupérés sur 4 postes victimes :<br>
📋 Logs AnyDesk : sessions établies depuis des IPs résidentielles françaises (Paris, Lyon)<br>
💻 Prefetch : <code>AnyDesk.exe</code> exécuté 1-3 fois par victime, durée 8-22 minutes<br>
🏦 Logs bancaires : virements exécutés pendant les sessions AnyDesk (< 2 min après connexion)<br>
📧 E-mails préparatoires : chaque victime a reçu un e-mail de «&nbsp;sa banque&nbsp;» avant l'appel
</div>`,
        law: "<strong>Art. 143 CP</strong> — Soustraction de données : accès à des données non destinées à l'auteur.<br><strong>Art. 143bis al. 1 CP</strong> — Accès indu à un système informatique : connexion via AnyDesk autorisée par tromperie.<br><strong>Art. 147 al. 1 CP</strong> — Utilisation frauduleuse d'un ordinateur : virement bancaire via session RDP contrôlée.",
        question: "<strong>La session AnyDesk autorisée par la victime constitue-t-elle un accès indu au sens de l'Art. 143bis CP ?</strong>",
        choices: [
          {
            text: "Non — la victime a autorisé la connexion AnyDesk volontairement. Pas d'accès indu.",
            ok: false, pts: -15,
            fb: "Erreur de qualification. L'art. 143bis CP protège contre tout accès non autorisé à un système informatique. L'autorisation donnée sous tromperie (fausse identité de 'technicien bancaire') est viciée — elle ne constitue pas un consentement valable au sens du droit pénal suisse. La jurisprudence TF applique Art. 143bis CP même dans les cas de tromperie sur l'identité : TF 6B_369/2018.",
            legal: "Art. 143bis CP + TF 6B_369/2018 — Consentement obtenu par tromperie = pas de consentement valable → accès indu.",
            critical: false, next: 1,
          },
          {
            text: "Oui — l'autorisation est viciée par la tromperie sur l'identité. L'accès est indu au sens de l'Art. 143bis CP.",
            ok: true, pts: 20,
            fb: "Qualification correcte. L'Art. 143bis CP vise tout accès à un système informatique protégé sans droit. Le 'droit' d'accès présuppose un consentement libre et éclairé — or la victime n'aurait jamais accordé l'accès si elle avait su que l'appelant n'était pas un technicien de sa banque. La tromperie sur l'identité vicie le consentement → accès indu. C'est précisément l'infraction retenue par le MPC dans cette affaire.",
            legal: "Art. 143bis al. 1 CP + TF 6B_369/2018 — La tromperie sur l'identité de l'opérateur vicie le consentement → accès indu.",
            critical: false, next: 1,
          },
          {
            text: "Dépend du type de protection du système (Art. 143bis exige un système 'spécialement protégé').",
            ok: false, pts: -5,
            fb: "Nuance insuffisante. Art. 143bis CP al. 1 vise les systèmes 'protégés contre tout accès indu' — c'est le cas de tout système bancaire avec authentification (login/mot de passe). La condition est largement satisfaite dès qu'un système exige une procédure d'identification pour y accéder. La banque en ligne des victimes remplit cette condition.",
            legal: "Art. 143bis CP al. 1 — 'système protégé' = tout système avec procédure d'accès (login, MFA). Banque en ligne = SYSTEME PROTÉGÉ.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "⚖️ La qualification complète",
        situation: `Le MPC vous demande de qualifier toutes les infractions commises lors d'un épisode type : <strong>1 appel frauduleux → 1 victime → 1 virement de CHF 85'000</strong>. La session AnyDesk a duré 18 minutes. Le virement a été initié par l'attaquant via l'interface e-banking visible sur l'écran partagé, en utilisant les identifiants de la victime déjà connectée.`,
        law: "<strong>Art. 143 CP</strong> — Soustraction de données : identifiants bancaires observés.<br><strong>Art. 143bis CP</strong> — Accès indu au système (PC victime).<br><strong>Art. 147 al. 1 CP</strong> — Utilisation frauduleuse : exécution du virement via système e-banking.<br><strong>Art. 146 CP</strong> — Escroquerie : tromperie astucieuse de la victime humaine.",
        question: "<strong>Quelle est la qualification pénale complète et correcte pour cet épisode unique ?</strong>",
        choices: [
          {
            text: "Art. 146 CP (escroquerie) uniquement — la tromperie de la victime est l'élément central.",
            ok: false, pts: -10,
            fb: "Qualification incomplète. Art. 146 CP couvre la tromperie de la victime mais ne qualifie pas : (1) l'accès indu au PC (Art. 143bis CP), (2) la soustraction des identifiants bancaires (Art. 143 CP), (3) l'exécution automatisée du virement via le système e-banking (Art. 147 CP). Le MPC a retenu un concours réel de quatre infractions dans cette affaire.",
            legal: "Art. 9 CP — Concours réel : chaque infraction distincte doit être qualifiée.",
            critical: false, next: 2,
          },
          {
            text: "Art. 147 CP seul — l'ordinateur est le vecteur principal, les autres infractions sont absorbées.",
            ok: false, pts: -15,
            fb: "Erreur de concours. Art. 147 CP est SUBSIDIAIRE à Art. 146 CP (ATF 150 IV 188). Mais surtout, Art. 143bis CP (accès au PC de la victime) et Art. 143 CP (soustraction des identifiants vus à l'écran) sont des infractions distinctes et autonomes qui ne sont pas absorbées par Art. 147 CP.",
            legal: "TF 6B_683/2021 + ATF 150 IV 188 — Art. 147 CP subsidiaire à Art. 146 CP, mais Art. 143/143bis autonomes.",
            critical: false, next: 2,
          },
          {
            text: "Art. 143bis CP (accès indu PC) + Art. 143 CP (identifiants bancaires) + Art. 147 CP (virement e-banking automatisé) en concours réel. Art. 146 CP subsidiaire car Art. 147 prime quand le vecteur est entièrement automatisé.",
            ok: true, pts: 25,
            fb: "Qualification conforme au dossier MPC 2024. Art. 143bis CP = accès au PC de la victime via AnyDesk sans droit valable. Art. 143 CP = observation et utilisation des identifiants bancaires (données non destinées à l'auteur). Art. 147 CP = exécution du virement via l'interface e-banking 100% automatisée (le prévenu clique directement sur les boutons de virement — aucun employé de banque n'intervient dans le processus). Art. 146 CP reste en concours, la tromperie préalable coexistant avec Art. 147. Concours réel selon Art. 9 CP, peine d'ensemble Art. 49 CP.",
            legal: "MPC acte d'accusation 2024 + Art. 9 CP + Art. 49 CP — Art. 143 + 143bis + 147 en concours réel, Art. 146 subsidiaire/concurrent selon les actes.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "📊 L'aggravante du métier",
        situation: `Sur l'ensemble de la période 2016-2018, l'enquête documente :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📅 31 victimes identifiées sur 26 mois (Neuchâtel, Vaud, Genève, Fribourg)<br>
💰 Montant total détourné : CHF 5'074'300<br>
📞 Scripts d'appel retrouvés en perquisition (Français et Anglais)<br>
🏢 Compte bancaire dédié à l'activité en Israël<br>
📱 3 téléphones prépayés utilisés en rotation (rotation mensuelle des SIM)<br>
💼 Le prévenu avait cessé toute activité professionnelle légitime pendant la période
</div>`,
        law: "<strong>Art. 147 al. 2 CP</strong> — Par métier : peine aggravée (PPL jusqu'à 10 ans).<br><strong>TF 6B_683/2021</strong> — Critères du métier : fréquence + montant + organisation professionnelle.<br><strong>TF 6B_368/2020</strong> — Métier : revenus réguliers contribuant notablement aux coûts du mode de vie.<br><strong>Art. 49 CP</strong> — Peine d'ensemble (concours d'infractions).",
        question: "<strong>Sur la base des éléments documentés, l'aggravante du 'métier' (Art. 147 al. 2 CP) est-elle établie ?</strong>",
        choices: [
          {
            text: "Non — 31 cas sur 26 mois est une fréquence insuffisante pour caractériser le métier.",
            ok: false, pts: -15,
            fb: "Erroné. Selon TF 6B_368/2020 et TF 6B_683/2021, le métier est caractérisé par la combinaison : fréquence (plusieurs actes), montant (contribution au mode de vie), et organisation professionnelle. Ici : 31 actes / 26 mois = environ 1.2 acte/mois, CHF 5M de revenus illicites, scripts professionnels, compte dédié, téléphones en rotation. L'organisation démontre clairement un professionnel de la cyberfraude — bien au-delà des critères TF.",
            legal: "TF 6B_683/2021 consid. 5 — >20 commandes sur 2 ans = métier. Ici : 31 cas sur 26 mois = critère largement satisfait.",
            critical: false, next: 3,
          },
          {
            text: "Oui — les critères sont satisfaits : fréquence (31 actes/26 mois), montant substantiel (CHF 5M), organisation professionnelle (scripts, comptes dédiés, SIM rotation).",
            ok: true, pts: 25,
            fb: "Correct. TF 6B_683/2021 établit que >20 actes sur 2 ans avec CHF 55'000 de revenus = métier. Ici : 31 actes, CHF 5M, organisation professionnelle démontrée. La cessation de toute activité légitime pendant la période (le prévenu vivait de ses revenus frauduleux) est l'indice ultime du métier selon TF 6B_368/2020. L'aggravante Art. 147 al. 2 CP porte la peine maximale à 10 ans (vs 5 ans al. 1). Le TPF a retenu l'aggravante.",
            legal: "Art. 147 al. 2 CP + TF 6B_683/2021 (consid. 5) + TF 6B_368/2020 (consid. 1.3.2) — Métier établi : fréquence + montant + organisation + dépendance exclusive.",
            critical: false, next: 3,
          },
          {
            text: "Oui pour certains cas, non pour d'autres — le métier ne peut s'apprécier qu'acte par acte.",
            ok: false, pts: -5,
            fb: "Approche erronée. Le métier est une qualification globale de l'activité délictueuse sur la période considérée — pas une appréciation acte par acte. Le TF a confirmé que l'ensemble de l'activité sur la période doit être considéré pour caractériser le comportement professionnel (TF 6B_683/2021). Une seule qualification 'par métier' couvre l'ensemble de la série.",
            legal: "Art. 147 al. 2 CP — Qualification globale sur la période, pas acte par acte.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🌍 L'extradition depuis les USA",
        situation: `Le prévenu (franco-israélien) a fui aux USA après l'identification par le MPC. Fedpol émet un mandat d'arrêt international. Il est arrêté à l'aéroport de Newark en janvier 2022. La procédure d'extradition vers la Suisse est enclenchée. Mais les autorités américaines (SDNY) mènent une procédure similaire contre lui pour des faits aux USA.`,
        law: "<strong>MLAT CH-USA 1973</strong> — Traité d'extradition bilatéral.<br><strong>Art. 66 EIMP</strong> — Règle de la spécialité (la Suisse ne peut poursuivre que pour les faits extradés).<br><strong>Art. 55 EIMP</strong> — Transmission de la procédure à l'État étranger si plus efficace.",
        question: "<strong>Les autorités américaines (SDNY) souhaitent également poursuivre le prévenu pour des faits similaires aux USA. Quelle est la meilleure stratégie pour le MPC ?</strong>",
        choices: [
          {
            text: "Insister sur l'extradition exclusive vers la Suisse — les faits suisses sont plus graves.",
            ok: false, pts: -10,
            fb: "Stratégie sous-optimale. Obtenir une extradition exclusive implique des années de procédure devant les juridictions américaines. De plus, si les USA ont des faits propres, ils peuvent refuser l'extradition ou l'accorder après leur propre procédure. L'Art. 55 EIMP offre une alternative plus efficace.",
            legal: "MLAT CH-USA + EIMP — L'extradition exclusive n'est pas la seule option.",
            critical: false, next: 4,
          },
          {
            text: "Transmission de procédure (Art. 55 EIMP) : le MPC transmet à l'autorité américaine qui mène UNE seule procédure couvrant les faits suisses et américains, puis condamne selon sa loi. Le MPC classe sa propre procédure.",
            ok: true, pts: 25,
            fb: "Solution utilisée dans l'affaire réelle (MPC communiqué 29.07.2025). Les autorités britanniques (Crown Prosecution Service) — et non américaines, correction dans les faits réels — ont repris la procédure suisse et ont condamné le prévenu à 7 ans de prison (23.07.2025). Cette transmission (Art. 55 EIMP) permet d'éviter les délais d'extradition tout en garantissant que les faits suisses sont couverts par la condamnation étrangère. Le MPC classe sa procédure après la condamnation étrangère.",
            legal: "Art. 55 EIMP — Transmission de procédure à l'autorité étrangère plus efficace. Art. 66 EIMP — Règle de spécialité : les faits transmis doivent être couverts par la condamnation.",
            critical: false, next: 4,
          },
          {
            text: "Abandonner la procédure suisse — trop compliqué de poursuivre un binational depuis l'étranger.",
            ok: false, pts: -25,
            fb: "Abandon inacceptable. Le MPC est compétent pour les infractions commises sur le territoire suisse (Art. 3 CP — principe territorial). L'Art. 55 EIMP offre précisément les outils pour coordonner avec les autorités étrangères sans abandonner la procédure. Le classement n'intervient qu'APRÈS une condamnation étrangère couvrant les faits suisses.",
            legal: "Art. 3 CP — Compétence territoriale suisse. Art. 55 EIMP — Outil de coordination, pas d'abandon.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📋 La valeur probante des logs AnyDesk",
        situation: `Le prévenu conteste la valeur probante des logs AnyDesk invoquant que : (A) les logs peuvent être falsifiés, (B) une IP résidentielle française peut être une machine zombie, (C) AnyDesk ne prouve pas l'identité de l'opérateur. Son défenseur demande l'exclusion de ces preuves.`,
        law: "<strong>Art. 139 CPP</strong> — Liberté de la preuve.<br><strong>ATF 144 IV 345</strong> — Preuve par indices : indices concordants et convergents.<br><strong>Art. 141 CPP</strong> — Admissibilité des preuves.",
        question: "<strong>Comment établir la valeur probante des logs AnyDesk face à la défense ?</strong>",
        choices: [
          {
            text: "Les logs AnyDesk seuls sont insuffisants — admettre les lacunes et demander au MP d'abandonner ce chef.",
            ok: false, pts: -20,
            fb: "Capitulation injustifiée. Les logs AnyDesk ne sont qu'un élément parmi d'autres. La preuve par indices (ATF 144 IV 345) permet de combiner plusieurs éléments convergents pour établir les faits au-delà du doute raisonnable. Aucun indice seul n'est nécessairement suffisant.",
            legal: "ATF 144 IV 345 — Preuve par indices concordants et convergents. Pas besoin d'une preuve unique irréfutable.",
            critical: false, next: "end",
          },
          {
            text: "Présenter la convergence multi-source : (1) logs AnyDesk (timestamps corrélant avec les virements), (2) analyse téléphonique (appels depuis SIM françaises vers victimes juste avant sessions), (3) OSINT sur les IPs (réputation, pas de signature machine zombie documentée), (4) scripts d'appel retrouvés en perquisition (preuve documentaire indépendante), (5) profil linguistique des appels (voix identifiée sur enregistrements victimes). Chaque indice isolable, convergence accablante ensemble.",
            ok: true, pts: 25,
            fb: "Démonstration probatoire exemplaire conforme à ATF 144 IV 345. Vous utilisez cinq sources indépendantes qui convergent vers un même auteur. La défense peut contester chaque indice pris isolément, mais la convergence de cinq sources indépendantes dépasse le doute raisonnable. C'est exactement la méthode utilisée par le MPC dans cette affaire pour identifier puis condamner le prévenu.",
            legal: "ATF 144 IV 345 — Indices concordants et convergents : 5 sources × convergence = preuve suffisante malgré contestations isolées.",
            critical: false, next: "end",
          },
          {
            text: "Faire analyser les logs par un laboratoire d'expertise certifié — leur certification garantit l'authenticité.",
            ok: false, pts: 0,
            fb: "Réponse acceptable mais insuffisante. La certification d'un expert sur les logs AnyDesk répond au point (A) de la défense mais ne répond pas aux points (B) machine zombie et (C) identité de l'opérateur. La convergence multi-source est nécessaire pour répondre à TOUS les arguments défensifs simultanément.",
            legal: "ACPO Principle 3 + Art. 184 CPP — L'expertise est un outil parmi d'autres, pas une réponse complète.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "🕵️", title: "Expert MPC Anti-Cyberfraude", sub: "Maîtrise parfaite du social engineering et de l'Art. 147 al. 2 CP" };
      if (pct >= 70) return { icon: "🔍", title: "Analyste Cybercrime", sub: "Bonne maîtrise des qualifications et du concours d'infractions" };
      if (pct >= 50) return { icon: "📚", title: "Juriste en Formation", sub: "Révisez Art. 143+143bis+147 CP en concours et l'aggravante du métier" };
      return { icon: "📖", title: "Formation pénal numérique requise", sub: "Art. 143-147 CP + jurisprudence TF 6B_683/2021" };
    },
  },

  /* ══════════════════════════════════════════════════════════
     B. BOUTIQUE FANTÔME — ATF 150 IV 188 [MEDIUM]
     Source : ATF 150 IV 188, Tribunal fédéral, 16 novembre 2024
     Faits : commandes frauduleuses en ligne, société écran, téléphones,
             7 ans prison, Art. 146 vs Art. 147 CP — distinction cruciale
  ══════════════════════════════════════════════════════════ */
  {
    id: "boutique-fantome",
    title: "Boutique Fantôme — 146 ou 147 ?",
    icon: "🛒",
    difficulty: "medium",
    atmosphere: "network",
    realCase: "ATF 150 IV 188, Tribunal fédéral, 16 novembre 2024 (publié recueil officiel)",
    narrative: {
      success: "La qualification Art. 146 CP (escroquerie par métier) est retenue avec exactitude. La condamnation à 7 ans est confirmée. L'arrêt devient référence de pratique sur la distinction 146/147 CP.",
      degraded: "La qualification est partiellement correcte mais la frontière 146/147 est mal articulée. Le verdict tient mais la motivation est fragilisée.",
      failure: "La qualification Art. 147 CP est retenue à tort. La défense obtient partiellement gain de cause en appel — peine réduite, Art. 147 étant subsidiaire."
    },
    tags: ["DROIT PÉNAL", "E-COMMERCE", "FORENSIQUE"],
    legalRefs: ["Art. 146 CP", "Art. 147 CP", "ATF 150 IV 188", "Art. 49 CP"],
    intro: "Un homme est arrêté à Bâle pour avoir passé des centaines de commandes frauduleuses sur des sites de vente en ligne. Il utilisait de fausses identités et de vraies identités légèrement modifiées pour passer commande 'sur facture', récupérait les marchandises (téléphones, électronique), puis disparaissait sans payer. Le Tribunal pénal de Bâle-Ville l'a condamné à 7 ans d'emprisonnement et 8 ans d'expulsion. La qualification retenue : escroquerie par métier (Art. 146 al. 2 CP). En appel, le prévenu conteste et demande la requalification en Art. 147 CP. Vous êtes l'expert mandaté par le Tribunal fédéral pour clarifier la qualification.",
    alertLevel: "⚖️ QUESTION JURIDIQUE CENTRALE — Art. 146 vs Art. 147 CP : arrêt de principe",
    objectives: [
      { icon: "⚖️", text: "Maîtriser la distinction Art. 146 CP (escroquerie) / Art. 147 CP (ordinateur)" },
      { icon: "🔍", text: "Identifier le critère décisif : processus automatisé ou intervention humaine ?" },
      { icon: "📋", text: "Appliquer ATF 150 IV 188 à des faits concrets" },
      { icon: "🏛️", text: "Comprendre la subsidiarité de l'Art. 147 CP par rapport à l'Art. 146 CP" },
    ],
    debrief: `<p><strong>ATF 150 IV 188 (novembre 2024)</strong> est l'arrêt de principe définissant la frontière entre escroquerie (Art. 146 CP) et utilisation frauduleuse d'un ordinateur (Art. 147 CP) dans les commandes en ligne :</p>
<p><strong>Art. 147 CP</strong> = uniquement si le processus est ENTIÈREMENT automatisé (de la commande jusqu'à l'expédition, sans aucune intervention humaine, même marginale).</p>
<p><strong>Art. 146 CP</strong> (escroquerie) prime si UNE personne intervient dans le processus, même sans réel pouvoir de décision — il suffit qu'elle soit "habilitée et tenue d'annuler une commande si elle découvre l'absence de volonté de paiement".</p>
<p>Art. 147 CP est <strong>subsidiaire</strong> à Art. 146 CP. L'escroquerie prime quand il y a une interaction humaine, même partiellement automatisée.</p>`,
    steps: [
      {
        phase: "🔬 Les faits établis",
        situation: `Le prévenu a passé des commandes sur différents sites e-commerce. Voici deux exemples documentés :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
<strong>Site A (BIG-SHOP.ch)</strong> — entrepôt automatisé avec robots de préparation :<br>
  Commande → système valide automatiquement → robot prépare → livraison automatique. <br>
  <em>Aucun employé ne voit la commande avant expédition.</em><br><br>
<strong>Site B (SWISS-ELEC.ch)</strong> — boutique avec entrepôt semi-manuel :<br>
  Commande → employé de préparation reçoit bon de commande imprimé → prépare manuellement → livraison.<br>
  <em>L'employé pourrait en théorie rejeter une commande suspecte.</em>
</div>`,
        law: "<strong>Art. 146 CP</strong> — Escroquerie : tromperie astucieuse d'une <em>personne physique</em>.<br><strong>Art. 147 CP</strong> — Utilisation frauduleuse : influence sur un <em>processus entièrement automatisé</em>.<br><strong>ATF 150 IV 188 consid. 4.9</strong> — Critère décisif : qui décide in fine de l'expédition ?",
        question: "<strong>Selon ATF 150 IV 188, quelle qualification s'applique à chaque site ?</strong>",
        choices: [
          {
            text: "Site A = Art. 147 CP (entièrement automatisé). Site B = Art. 146 CP (employé intervient). Les deux peuvent coexister dans l'acte d'accusation.",
            ok: true, pts: 25,
            fb: "Exactement conforme à ATF 150 IV 188. Site A (processus 100% automatisé, robot de préparation) → Art. 147 CP applicable. Site B (employé de préparation qui <em>pourrait</em> annuler, même sans pouvoir décisionnel réel) → Art. 146 CP. Le TF précise qu'il suffit que l'employé soit 'habilité et tenu d'annuler' pour que l'escroquerie prime sur Art. 147. Dans ce cas, les deux qualifications peuvent coexister selon le site.",
            legal: "ATF 150 IV 188 consid. 4.9.2 — Critère : l'employé est-il 'habilité et tenu d'annuler si découverte absence de volonté de paiement' ? OUI = Art. 146. NON = Art. 147.",
            critical: false, next: 1,
          },
          {
            text: "Les deux sites = Art. 147 CP — internet est un système informatique, peu importe si un humain intervient.",
            ok: false, pts: -20,
            fb: "Erreur fondamentale. ATF 150 IV 188 est précisément l'arrêt qui rectifie cette lecture erronée. Art. 147 CP ne s'applique PAS simplement parce qu'internet est impliqué. La présence d'un être humain dans le processus (même marginalement) bascule la qualification vers Art. 146 CP. Art. 147 est réservé aux processus ENTIÈREMENT automatisés.",
            legal: "ATF 150 IV 188 — Art. 147 CP ≠ toute infraction via internet. = uniquement processus ENTIÈREMENT automatisé.",
            critical: true, next: "end",
          },
          {
            text: "Les deux sites = Art. 146 CP — la tromperie initiale de l'acheteur (fausse identité) vise toujours une personne.",
            ok: false, pts: -10,
            fb: "Qualification trop large. Pour le Site A, la fausse identité est saisie dans un formulaire qui est traité automatiquement, sans qu'aucun être humain ne la voie avant expédition. Dans ce cas, Art. 147 CP s'applique car c'est le traitement automatisé qui est trompé — pas une personne. L'ATF 150 IV 188 nuance précisément ce point : même si le client interagit initialement avec un formulaire web, seul compte qui traite la commande in fine.",
            legal: "ATF 150 IV 188 consid. 4.6 — Ce qui compte : le traitement IN FINE de la commande, pas l'interaction initiale avec le formulaire.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "🔑 La subsidiarité de l'Art. 147 CP",
        situation: `Le défenseur du prévenu argue : «&nbsp;En cas de doute sur le degré d'automatisation, il faut appliquer Art. 147 CP qui est plus favorable au prévenu (peine maximale 5 ans vs 10 ans pour escroquerie par métier Art. 146 al. 2 CP).&nbsp;» Il cite l'ATF 150 IV 188 lui-même pour dire que 147 s'applique quand 146 n'est pas prouvé.`,
        law: "<strong>ATF 150 IV 188 consid. 4.6</strong> — Art. 147 CP est subsidiaire à Art. 146 CP.<br><strong>Art. 10 CPP</strong> — In dubio pro reo (doute profite à l'accusé).<br><strong>Art. 146 al. 2 CP</strong> — Métier : PPL jusqu'à 10 ans.<br><strong>Art. 147 al. 2 CP</strong> — Métier : PPL jusqu'à 10 ans (même peine en réalité).",
        question: "<strong>L'argument du défenseur est-il fondé ?</strong>",
        choices: [
          {
            text: "Oui — si on ne peut pas prouver le degré d'automatisation, in dubio pro reo → Art. 147 CP.",
            ok: false, pts: -15,
            fb: "Argument partiellement fondé sur le principe mais ATF 150 IV 188 ne crée pas une règle 'en cas de doute → Art. 147'. L'arrêt dit que si on ne peut pas prouver QUE le processus était entièrement automatisé NI que aucune personne n'était trompée, on ne peut retenir ni l'un ni l'autre → TENTATIVE (Art. 22 CP) devient applicable. De plus : les peines maximales Art. 146 al. 2 et Art. 147 al. 2 sont identiques (10 ans) — l'argument du 'plus favorable' ne tient pas pour l'aggravante du métier.",
            legal: "ATF 150 IV 188 consid. 4.6-4.9 — En cas de doute sur les deux qualifications → tentative possible, pas automatiquement Art. 147.",
            critical: false, next: 2,
          },
          {
            text: "Non — Art. 147 CP est SUBSIDIAIRE à Art. 146 CP selon ATF 150 IV 188. Si Art. 146 est établi, Art. 147 ne s'applique pas même si Art. 147 semble aussi approprié.",
            ok: true, pts: 25,
            fb: "Correct. ATF 150 IV 188 est explicite : 'L'escroquerie prime sur l'utilisation frauduleuse d'un ordinateur, qui est subsidiaire' (consid. 4.6). Si Art. 146 CP est établi (tromperie d'une personne via astuce), Art. 147 n'est pas retenu en sus — sauf pour des actes distincts visant des processus entièrement automatisés (comme le Site A dans notre exemple). De plus, l'argument de peine plus douce ne tient pas : Art. 146 al. 2 et Art. 147 al. 2 (métier) = même maximum de 10 ans.",
            legal: "ATF 150 IV 188 consid. 4.6 — 'L'escroquerie prime sur l'utilisation frauduleuse d'un ordinateur, qui est subsidiaire.' Peine Art. 146 al. 2 CP = Art. 147 al. 2 CP = PPL jusqu'à 10 ans.",
            critical: false, next: 2,
          },
          {
            text: "L'argument est fondé seulement pour les faits antérieurs à ATF 150 IV 188 — l'arrêt ne vaut que pour l'avenir.",
            ok: false, pts: -10,
            fb: "Droit suisse n'a pas de principe d'irétroactivité de la jurisprudence de la même manière que la loi. ATF 150 IV 188 clarifie l'interprétation des art. 146 et 147 CP — mais ces articles existent et ont la même rédaction depuis longtemps. La qualification dépend des faits, pas de la date de l'arrêt. Pour les faits commis avant 2024, le même article s'applique — c'est seulement l'interprétation qui est précisée.",
            legal: "Droit pénal suisse — pas d'irétroactivité de la jurisprudence TF (contrairement au droit de la CEDH).",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🏛️ Le jugement et la peine",
        situation: `Le Tribunal pénal de Bâle-Ville avait condamné le prévenu à <strong>7 ans de prison et 8 ans d'expulsion</strong> pour 'escroquerie par métier et utilisation frauduleuse d'un ordinateur par métier en concours'. Le TF (ATF 150 IV 188) rectifie partiellement : Art. 146 CP prime pour la majorité des faits, Art. 147 CP ne subsiste que pour les faits impliquant un processus 100% automatisé. La peine d'ensemble est maintenue à 7 ans. Le TF 'admet très partiellement le recours sans renvoyer à l'instance précédente; l'admission partielle n'ayant pas d'incidence sur la peine.'`,
        law: "<strong>Art. 49 CP</strong> — Peine d'ensemble en cas de concours d'infractions.<br><strong>Art. 66a al. 1 CP</strong> — Expulsion obligatoire : infractions prévues par la liste de l'art. 66a (dont Art. 146 CP pour ressortissant étranger).",
        question: "<strong>Pourquoi la rectification de qualification (146→147 pour certains faits) n'affecte-t-elle pas la peine selon le TF ?</strong>",
        choices: [
          {
            text: "Parce que Art. 146 al. 2 CP et Art. 147 al. 2 CP ont des maximums identiques (10 ans), et la peine d'ensemble Art. 49 CP reste justifiée par l'ensemble des faits.",
            ok: true, pts: 20,
            fb: "Exactement. ATF 150 IV 188 : l'admission partielle du recours n'a pas d'incidence sur la peine car : (1) Art. 146 al. 2 CP = Art. 147 al. 2 CP = maximum 10 ans, (2) la peine d'ensemble Art. 49 CP est calculée sur la totalité des infractions — requalifier quelques actes de 146 en 147 ne change pas le calcul global, (3) la gravité des faits (CHF 5M+, 31 victimes, 26 mois) justifie indépendamment les 7 ans.",
            legal: "Art. 49 CP + ATF 150 IV 188 — Peine d'ensemble inchangée : même maximum, même calcul global.",
            critical: false, next: 3,
          },
          {
            text: "Parce que le TF ne remet jamais en cause les peines prononcées en première instance.",
            ok: false, pts: -15,
            fb: "Faux. Le TF peut et doit réformer les peines si la qualification change le cadre pénal. Dans ce cas précis, la peine est maintenue car les maximums sont identiques — mais si le TF avait totalement exclu Art. 146 CP pour retenir seulement Art. 147 al. 1 (sans métier → max 5 ans), la peine aurait nécessairement changé.",
            legal: "Art. 105 LTF — Le TF peut réformer les peines si la qualification l'impose.",
            critical: false, next: 3,
          },
          {
            text: "Parce que l'expulsion obligatoire (Art. 66a CP) s'applique identiquement à Art. 146 et Art. 147 CP.",
            ok: false, pts: -5,
            fb: "Partiellement vrai (Art. 66a al. 1 let. c CP liste l'escroquerie, mais pas directement Art. 147), mais ce n'est pas la raison principale. La peine d'emprisonnement est maintenue pour des raisons d'identité des maximums et de calcul de la peine d'ensemble Art. 49 CP — pas en raison de l'expulsion.",
            legal: "Art. 66a al. 1 let. c CP — escroquerie (Art. 146 CP) figurant dans la liste d'infractions entraînant l'expulsion obligatoire pour ressortissants étrangers.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "📚 L'enseignement pratique",
        situation: `En conclusion de votre expertise, le juge du TF vous pose la question-clé : <em>«&nbsp;Comment un analyste forensique peut-il aider à établir si un processus e-commerce est 'entièrement automatisé' ou non ?&nbsp;»</em> Votre réponse sera versée au dossier et citée dans le considérant.`,
        law: "<strong>ATF 150 IV 188</strong> — Critère déterminant : 'qui décide in fine de l'acceptation de la commande et de l'expédition des biens?'<br><strong>Art. 184 CPP</strong> — L'expert répond aux questions posées par l'autorité.",
        question: "<strong>Quelle est votre méthode forensique pour établir le degré d'automatisation d'un processus e-commerce ?</strong>",
        choices: [
          {
            text: "Demander au commerçant de décrire son processus — sa déclaration suffit.",
            ok: false, pts: -10,
            fb: "Insuffisant. Une déclaration du commerçant est sujette à contestation. L'expert forensique doit DOCUMENTER objectivement le processus, pas seulement le recueillir déclarativement. La défense pourra contester toute preuve non étayée par des artefacts numériques.",
            legal: "Art. 184 CPP — L'expert doit fonder ses conclusions sur des éléments objectivement vérifiables.",
            critical: false, next: "end",
          },
          {
            text: "Analyse technique en 4 axes : (1) logs du système de gestion des commandes (WMS) — y a-t-il une étape de validation humaine dans le workflow ? (2) architecture du système d'expédition — robot ou intervention manuelle ? (3) communications internes (e-mails, notifications) — des employés reçoivent-ils des alertes sur les commandes avant expédition ? (4) contrats de travail et fiches de poste des préparateurs — ont-ils le pouvoir de rejeter des commandes ?",
            ok: true, pts: 25,
            fb: "Méthode d'expert conforme à ATF 150 IV 188. Chaque axe répond directement au critère TF : (1) le WMS révèle les étapes du workflow ; (2) l'architecture prouve ou infirme l'automatisation physique ; (3) les communications internes montrent si des humains voient les commandes ; (4) les fiches de poste établissent qui est 'habilité et tenu d'annuler'. Cette méthode est objectivement vérifiable et reproductible — ce qu'un expert judiciaire doit produire.",
            legal: "ATF 150 IV 188 consid. 4.9.2 + Art. 184 CPP — Méthode objective vérifiable par un contre-expert. Critère TF : 'habilité et tenu d'annuler une commande si découverte absence de volonté de paiement.'",
            critical: false, next: "end",
          },
          {
            text: "Mesurer le temps entre commande et expédition — si < 1 minute, c'est automatisé.",
            ok: false, pts: -5,
            fb: "Critère trop simpliste. Un entrepôt très organisé peut expédier manuellement en quelques minutes. A contrario, un processus automatisé peut prendre des heures. Le critère ATF 150 IV 188 n'est pas le temps mais l'intervention humaine ou non dans la décision d'accepter et expédier. Le temps n'est qu'un indicateur indirect, pas le critère juridique.",
            legal: "ATF 150 IV 188 — Critère : présence ou non d'un être humain dans le processus décisionnel, pas la vitesse.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "⚖️", title: "Expert ATF 150 IV 188", sub: "Maîtrise parfaite de la distinction Art. 146/147 CP — référence jurisprudentielle" };
      if (pct >= 65) return { icon: "🔍", title: "Juriste Forensique", sub: "Bonne compréhension de la qualification pénale e-commerce" };
      if (pct >= 45) return { icon: "📚", title: "Étudiant en Droit Pénal", sub: "Révisez ATF 150 IV 188 et la subsidiarité de l'Art. 147 CP" };
      return { icon: "📖", title: "Formation qualifications requise", sub: "Art. 146 vs Art. 147 CP — une distinction fondamentale en droit suisse" };
    },
  },

  /* ══════════════════════════════════════════════════════════
     C. TÉLÉPHONE SOUS SCELLÉS — TF 7B_102/2024 [MEDIUM]
     Source : TF 7B_102/2024 (2024) + TF 7B_145/2025 (2025)
              ATF 139 IV 128 + Art. 141 CPP (admissibilité)
     Contexte : contrôle à la frontière + saisie smartphone
  ══════════════════════════════════════════════════════════ */
  {
    id: "telephone-scelles",
    title: "Le Téléphone sous Scellés",
    icon: "📵",
    difficulty: "medium",
    atmosphere: "legal",
    realCase: "TF 7B_102/2024 + TF 7B_145/2025 — jurisprudence 2024-2025",
    narrative: {
      success: "La procédure est menée correctement : mandat obtenu, scellés respectés si demandés, art. 141 CPP sauvegardé. Les preuves extraites du téléphone sont recevables. Le TMC accorde la levée des scellés sur les éléments pertinents.",
      degraded: "Certains éléments du téléphone sont inexploitables car la fouille initiale sans mandat crée une zone grise. Le TMC lève les scellés partiellement.",
      failure: "La fouille sans mandat invalide les preuves obtenues. Art. 141 al. 2 CPP — exclusion de preuves. L'accusé est libéré faute de preuve admissible."
    },
    tags: ["FORENSIQUE", "DROIT", "FRONTIÈRE", "CPP"],
    legalRefs: ["Art. 241 CPP", "Art. 246 CPP", "Art. 248 CPP", "Art. 264 CPP", "Art. 141 CPP"],
    intro: "Contrôle routier de nuit sur l'A2 à Chiasso (TI). Un passager d'un véhicule fait l'objet d'un contrôle par la police cantonale tessinoise. Il ne présente pas de papiers d'identité. Un agent consulte brièvement son smartphone pour trouver un numéro de téléphone d'urgence, puis, voyant des messages suspects sur l'écran, consulte les messages et photos. Le téléphone est saisi. Deux jours plus tard, le MP ordonne une analyse complète du téléphone. La défense demande la mise sous scellés et conteste la légalité des actes initiaux.",
    alertLevel: "⚖️ ADMISSIBILITÉ DES PREUVES — Fouille smartphone sans mandat",
    objectives: [
      { icon: "⚖️", text: "Distinguer 'vérification simple' et 'perquisition' d'un smartphone (ATF 139 IV 128)" },
      { icon: "🔒", text: "Comprendre quand la mise sous scellés (Art. 248 CPP) s'impose" },
      { icon: "📱", text: "Appliquer TF 7B_102/2024 sur la fouille smartphone sans mandat" },
      { icon: "⚠️", text: "Évaluer l'admissibilité des preuves selon Art. 141 CPP" },
    ],
    debrief: `<p><strong>TF 7B_102/2024</strong> clarifie la distinction entre deux situations face à un smartphone :</p>
<p>1. <strong>Vérification "simple"</strong> (ATF 139 IV 128) : consulter le répertoire téléphonique pour identifier l'utilisateur sans papiers = pas une perquisition au sens de l'Art. 246 CPP → sans mandat possible.</p>
<p>2. <strong>Perquisition</strong> (TF 7B_102/2024) : toute consultation allant au-delà de la vérification d'identité (messages, photos, applications) = perquisition au sens de l'Art. 246 CPP → mandat de l'autorité compétente obligatoire (Art. 241 al. 1 CPP).</p>
<p>Si la perquisition est faite sans mandat et sans "péril en la demeure" démontré → violation de l'Art. 241 al. 1 CPP → règle de <strong>validité</strong> (pas d'ordre) → Art. 141 <strong>al. 2 CPP</strong> → preuves inexploitables SAUF si infraction grave le justifie.</p>
<p><strong>TF 7B_145/2025</strong> nuance : les scellés sur un smartphone ne sont pas une protection absolue — si l'infraction est grave, l'intérêt à la poursuite peut primer sur la protection de la personnalité (Art. 264 al. 1 let. b CPP).</p>`,
    steps: [
      {
        phase: "🚔 Le contrôle routier",
        situation: `L'agent Matias B. décrit ses actes lors du contrôle :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
<strong>Acte 1 (sans mandat) :</strong> Le passager n'a pas de papiers. L'agent demande le téléphone pour consulter le répertoire et trouver un contact "en cas d'urgence" qui pourrait confirmer l'identité. ✅ ou ❌ ?<br><br>
<strong>Acte 2 (sans mandat) :</strong> En cherchant dans le répertoire, l'agent voit plusieurs messages de type "10 pièces", "livraison 22h". Curieux, il ouvre l'application de messagerie et lit 47 messages des 3 dernières semaines. ✅ ou ❌ ?<br><br>
<strong>Acte 3 (sans mandat) :</strong> L'agent ouvre la galerie photos et fait défiler les 200 dernières photos. Il en photographie 15 avec son propre téléphone. ✅ ou ❌ ?
</div>`,
        law: "<strong>Art. 246 CPP</strong> — Perquisition de supports de données : nécessite un mandat sauf péril en la demeure.<br><strong>Art. 241 al. 1 CPP</strong> — Mandat écrit de l'autorité compétente requis.<br><strong>ATF 139 IV 128</strong> — 'Vérification simple' ≠ perquisition.<br><strong>TF 7B_102/2024 consid. 2.4</strong> — Lecture des messages/photos = perquisition.",
        question: "<strong>Selon la jurisprudence TF actuelle, lesquels de ces trois actes nécessitaient un mandat ?</strong>",
        choices: [
          {
            text: "Acte 1 = OK sans mandat. Acte 2 = OK sans mandat (soupçon concret). Acte 3 = MANDAT requis (photos = données intimes).",
            ok: false, pts: -15,
            fb: "ATF 139 IV 128 et TF 7B_102/2024 ne font pas de distinction selon la nature des données (messages vs photos). La ligne de démarcation est 'vérification d'identité simple' vs 'consultation du contenu'. Dès l'Acte 2, l'agent a outrepassé la vérification simple en lisant des messages — c'est une perquisition (Art. 246 CPP). Le 'soupçon concret' ne remplace pas le mandat en l'absence de péril en la demeure prouvé.",
            legal: "TF 7B_102/2024 consid. 2.4 — La vue de messages suspects à l'écran ne justifie pas la consultation sans mandat. Le soupçon permet d'obtenir un mandat d'urgence.",
            critical: false, next: 1,
          },
          {
            text: "Acte 1 = OK sans mandat (ATF 139 IV 128 — vérification identité). Acte 2 = MANDAT requis (lecture messages = perquisition Art. 246 CPP). Acte 3 = MANDAT requis (idem).",
            ok: true, pts: 25,
            fb: "Analyse exacte conforme à TF 7B_102/2024. Acte 1 = consulter le répertoire pour identification = 'vérification simple' au sens ATF 139 IV 128 = OK sans mandat. Acte 2 = ouvrir et lire les messages = perquisition au sens Art. 246 CPP = mandat obligatoire (Art. 241 al. 1 CPP), sauf péril en la demeure prouvé (non invoqué ici). Acte 3 = même analyse → mandat requis. L'agent aurait dû, après Acte 1, saisir le téléphone et demander un mandat au MP de piquet pour Actes 2 et 3.",
            legal: "TF 7B_102/2024 consid. 2.4.4 — 'La fouille du téléphone portable constituait bel et bien une perquisition au sens de l'Art. 246 CPP.' ATF 139 IV 128 — vérification simple tolérée.",
            critical: false, next: 1,
          },
          {
            text: "Les trois actes nécessitent un mandat — tout accès à un smartphone est une perquisition.",
            ok: false, pts: -10,
            fb: "Trop absolu. ATF 139 IV 128 reconnaît que les 'vérifications simples' (notamment pour identifier quelqu'un sans papiers d'identité) sont possibles sans mandat. La distinction est qualitative : consulter le répertoire pour identifier ≠ perquisition. Ce n'est que lorsqu'on dépasse ce cadre strictement limité que l'Art. 246 CPP s'applique.",
            legal: "ATF 139 IV 128 consid. 1.7 — Vérification simple d'identité via téléphone sans mandat : admis.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "🔒 La demande de scellés",
        situation: `L'agent saisit le téléphone. Deux jours plus tard, le MP de Bellinzona demande l'analyse complète. L'avocat du prévenu dépose une demande de mise sous scellés (Art. 248 CPP) invoquant : (1) son client veut protéger sa correspondance privée, (2) des messages avec son avocat pourraient être dans le téléphone, (3) le téléphone est un 'document personnel' au sens Art. 264 al. 1 let. b CPP.`,
        law: "<strong>Art. 248 CPP</strong> — Mise sous scellés : droit du détenteur avant analyse.<br><strong>Art. 264 al. 1 let. b CPP</strong> — Objets protégés : documents personnels.<br><strong>TF 7B_145/2025</strong> — Smartphones = documents personnels Art. 264 CPP mais protection NON ABSOLUE.<br><strong>Art. 264 al. 1 let. c CPP</strong> — Correspondance avec avocat = protection renforcée.",
        question: "<strong>La demande de mise sous scellés est-elle recevable et comment le MP doit-il y répondre ?</strong>",
        choices: [
          {
            text: "La demande est irrecevable — un téléphone n'est pas un 'document personnel' au sens juridique, c'est un appareil électronique.",
            ok: false, pts: -20,
            fb: "Erreur grave. TF 7B_145/2025 (2025) affirme explicitement que 'les smartphones utilisés à titre privé entrent dans la catégorie des documents personnels au sens de l'Art. 264 al. 1 let. b CPP'. La demande de mise sous scellés est parfaitement recevable. Refuser les scellés = violation du droit procédural fondamental Art. 248 CPP = risque d'inexploitabilité totale.",
            legal: "TF 7B_145/2025 — Smartphone = 'document personnel' Art. 264 al. 1 let. b CPP. Scellés = droit, pas une option.",
            critical: true, next: "end",
          },
          {
            text: "La demande est recevable. Le MP doit accepter les scellés, documenter l'état actuel (hash), puis préparer un dossier argumenté pour le TMC démontrant que l'intérêt à la poursuite prime sur la protection de la personnalité — particulièrement pour les messages liés à l'enquête (trafic supposé), en excluant expressément la correspondance avocat-client.",
            ok: true, pts: 25,
            fb: "Procédure correcte conforme à TF 7B_145/2025. Le TF rappelle que la protection des données personnelles dans un smartphone n'est pas absolue. Le TMC peut lever les scellés si l'intérêt à la poursuite pénale prime (critères : gravité des faits, pertinence pour l'enquête, proportionnalité). La correspondance avocat-client (Art. 264 al. 1 let. c CPP) bénéficie d'une protection renforcée et doit être expressément exclue de la levée.",
            legal: "TF 7B_145/2025 consid. 3 + Art. 248 CPP + Art. 264 CPP — Scellés acceptés + dossier TMC = procédure correcte.",
            critical: false, next: 2,
          },
          {
            text: "La demande est recevable mais le MP peut la rejeter si les infractions sont suffisamment graves.",
            ok: false, pts: -15,
            fb: "Confusion des rôles. Le MP ne peut pas rejeter la mise sous scellés — c'est le TMC qui décide de la levée. Le MP est tenu d'accepter la demande de scellés (c'est un droit procédural absolu du détenteur, Art. 248 CPP), puis de soumettre au TMC une demande de levée. Seul le TMC peut décider si la levée est justifiée.",
            legal: "Art. 248 CPP — Mise sous scellés = droit du détenteur, le MP ne peut pas le rejeter. La levée = décision TMC.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "⚠️ L'admissibilité des preuves initiales",
        situation: `Le TMC lève les scellés sur les messages liés au trafic probable. Mais reste la question des <strong>Actes 2 et 3 initiaux</strong> (messages et photos consultés sans mandat par l'agent). La défense demande l'exclusion de toutes les preuves obtenues lors de ces actes illicites + les preuves 'dérivées' (utilisation de ces informations pour obtenir le mandat de l'agent).`,
        law: "<strong>Art. 141 al. 2 CPP</strong> — Preuves illicites : inexploitables sauf si indispensables pour élucider une infraction grave.<br><strong>Art. 141 al. 3 CPP</strong> — Prescriptions d'ordre : preuves exploitables.<br><strong>Art. 141 al. 4 CPP</strong> — Preuves dérivées : inexploitables si UNIQUEMENT obtenues grâce à la preuve illicite.<br><strong>TF 7B_102/2024 consid. 2.4.5</strong> — Fouille smartphone sans mandat = règle de VALIDITÉ (pas d'ordre).",
        question: "<strong>Selon Art. 141 CPP et TF 7B_102/2024, les preuves des Actes 2 et 3 sont-elles exploitables ?</strong>",
        choices: [
          {
            text: "Oui — la fouille initiale révélait un soupçon concret justifiant rétroactivement l'acte.",
            ok: false, pts: -20,
            fb: "Raisonnement circulaire inadmissible. On ne peut pas légitimer rétroactivement une fouille illicite par ses résultats. TF 7B_102/2024 est clair : la fouille sans mandat contrevient à l'Art. 241 al. 1 CPP — il s'agit d'une règle de VALIDITÉ (pas d'ordre). Les preuves tombent sous Art. 141 al. 2 CPP. Le 'soupçon ex-post' ne guérit pas l'irrégularité ex-ante.",
            legal: "TF 7B_102/2024 consid. 2.4.5 — Règle de validité, pas d'ordre. Art. 141 al. 2 CPP s'applique.",
            critical: true, next: "end",
          },
          {
            text: "Non, sauf si l'infraction est suffisamment grave (trafic de stupéfiants, crime grave) pour justifier l'exploitation au sens Art. 141 al. 2 CPP. Les preuves dérivées sont inexploitables si elles n'auraient pu être obtenues sans les actes illicites.",
            ok: true, pts: 25,
            fb: "Analyse correcte et nuancée conformément à Art. 141 CPP et TF 7B_102/2024. Étape 1 : les actes 2 et 3 violent Art. 241 al. 1 CPP (règle de validité) → preuves en principe inexploitables (Art. 141 al. 2). Étape 2 : l'Art. 141 al. 2 permet l'exploitation si 'indispensable pour élucider une infraction grave'. Étape 3 : les preuves dérivées (mandat obtenu sur base des actes illicites) → Art. 141 al. 4 CPP → inexploitables seulement si 'n'auraient pu être obtenues sans la preuve illicite'. Décision du juge du fond (pas du juge de la détention : ATF 143 IV 330).",
            legal: "Art. 141 al. 2 + al. 4 CPP + TF 7B_102/2024 + ATF 143 IV 330 — Analyse en 3 étapes : violation → exception infraction grave → preuves dérivées.",
            critical: false, next: 3,
          },
          {
            text: "Art. 141 al. 3 CPP s'applique — la fouille sans mandat est une simple prescription d'ordre, les preuves sont exploitables.",
            ok: false, pts: -15,
            fb: "Erreur de catégorie. TF 7B_102/2024 consid. 2.4.5 est explicite : 'la fouille du téléphone sans mandat contrevient à l'Art. 241 al. 1 CPP' — c'est une règle de VALIDITÉ, pas d'ordre. Art. 141 al. 3 CPP (prescriptions d'ordre → preuves exploitables) ne s'applique donc pas. L'ancienne jurisprudence ATF 139 IV 128 consid. 1.7 qui qualifiait la vérification de 'prescription d'ordre' est désormais dépassée par TF 7B_102/2024 pour les cas dépassant la vérification simple.",
            legal: "TF 7B_102/2024 consid. 2.4.5 — Fouille approfondie smartphone sans mandat = règle de VALIDITÉ → Art. 141 al. 2 CPP (pas al. 3).",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "📋 La décision du TMC",
        situation: `Devant le TMC de Bellinzona, le MP plaide pour la levée des scellés sur <strong>l'ensemble</strong> du téléphone. L'avocat de la défense invoque TF 7B_145/2025 pour défendre son client, mais cite l'affaire cocaïne (7.18 kg) comme un cas exceptionnel. Il argue que dans le cas présent (trafic supposé de quantités inconnues), l'intérêt à la poursuite ne prime pas. Il demande la restitution du téléphone.`,
        law: "<strong>TF 7B_145/2025</strong> — Levée des scellés smartphone : balancement intérêt poursuite vs protection personnalité.<br><strong>Art. 197 CPP</strong> — Proportionnalité des mesures de contrainte.<br><strong>Art. 264 al. 1 let. b CPP</strong> — Documents personnels : protection relative.",
        question: "<strong>Sur la base de TF 7B_145/2025, quelle décision le TMC devrait-il prendre ?</strong>",
        choices: [
          {
            text: "Lever les scellés sur l'ensemble du téléphone — l'intérêt public à la poursuite du trafic prime toujours sur la vie privée.",
            ok: false, pts: -10,
            fb: "Trop absolu. TF 7B_145/2025 ne dit pas que l'intérêt public 'prime toujours'. Il dit que la protection n'est 'pas absolue' et dépend d'un balancement au cas par cas. Lever les scellés sur l'ENSEMBLE sans distinction ne respecte pas l'Art. 197 CPP (proportionnalité). Il faut limiter la levée aux éléments pertinents pour l'enquête.",
            legal: "Art. 197 al. 1 let. d CPP — Proportionnalité : mesure de contrainte dans la mesure justifiée par le but poursuivi.",
            critical: false, next: "end",
          },
          {
            text: "Lever les scellés de façon ciblée : (1) messages/applications liés au trafic supposé → levée partielle justifiée par la gravité potentielle, (2) photos personnelles et correspondance avocat → maintien des scellés, (3) demander au MP de préciser quels éléments sont pertinents pour l'enquête avant la levée.",
            ok: true, pts: 25,
            fb: "Décision proportionnée conforme à TF 7B_145/2025 et Art. 197 CPP. Le TF a accordé la levée dans l'affaire cocaïne (7.18 kg) car la gravité des faits justifiait clairement la prééminence de l'intérêt public. Ici, si le trafic est établi comme 'grave', la levée ciblée est justifiée. Mais la proportionnalité (Art. 197 CPP) exige de ne lever que ce qui est pertinent pour l'enquête — pas l'ensemble du téléphone indistinctement. La correspondance avocat reste absolument protégée (Art. 264 al. 1 let. c CPP).",
            legal: "TF 7B_145/2025 + Art. 197 CPP + Art. 264 al. 1 let. b et c CPP — Levée partielle ciblée = décision proportionnée.",
            critical: false, next: "end",
          },
          {
            text: "Rejeter la demande de levée des scellés — la fouille initiale illégale disqualifie toute la procédure.",
            ok: false, pts: -15,
            fb: "Confusion entre deux questions distinctes. La legality de la fouille initiale (Actes 2 et 3) et la légalité de la procédure de scellés/levée sont deux questions séparées. Le TMC se prononce sur la levée des scellés demandée PAR LE MP — cette procédure est légale et distincte des actes initiaux contestables. La remédiation des actes illicites se fait via Art. 141 CPP devant le juge du fond, pas en rejetant la procédure TMC.",
            legal: "Art. 248 CPP — Procédure de scellés autonome. Les irrégularités initiales → Art. 141 CPP devant le juge du fond.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "📵", title: "Expert Scellés Numériques", sub: "Maîtrise parfaite Art. 141+246+248+264 CPP — référence jurisprudentielle 2024-2025" };
      if (pct >= 65) return { icon: "⚖️", title: "Juriste Forensique", sub: "Bonne maîtrise de l'admissibilité des preuves numériques" };
      if (pct >= 45) return { icon: "📱", title: "Praticien CPP", sub: "Révisez TF 7B_102/2024 et TF 7B_145/2025 — fondamentaux smartphone forensics" };
      return { icon: "📚", title: "Formation CPP requise", sub: "Art. 141 + 246 + 248 CPP — admissibilité des preuves numériques en Suisse" };
    },
  },

  /* ══════════════════════════════════════════════════════════
     NOUVELLES AFFAIRES SUISSES 2025-2026
  ══════════════════════════════════════════════════════════ */

  /* ── CLONE VOCAL — Deepfake CEO Fraud, Schwyz 2026 [MEDIUM · 5 étapes] ──
     Source : Police cantonale de Schwyz, janvier 2026
     Affaire réelle #6 de la liste — plusieurs millions extorqués via IA vocale
     Art. 146 CP (tromperie personne physique via deepfake),
     Art. 147 CP (si système de validation automatisé),
     Art. 143 CP (accès credentials), investigation audio forensique
  ─────────────────────────────────────────────────────── */
  {
    id: "clone-vocal",
    title: "Le Clone Vocal — CEO Fraud par IA",
    icon: "🎙️",
    difficulty: "medium",
    atmosphere: "crypto",
    realCase: "Police cantonale de Schwyz, enquête ouverte janvier 2026",
    narrative: {
      success: "L'investigation audio forensique démontre l'authenticité du deepfake. La qualification Art. 146 CP est solide. Les flux financiers sont tracés jusqu'à des comptes en Asie — les autorités de Hong Kong coopèrent. Un suspect est identifié en Moldavie.",
      degraded: "La qualification tient mais l'expertise audio est contestée par la défense. Un contre-expert remet en doute la détection du deepfake. La procédure s'enlise en bataille d'experts.",
      failure: "L'investigation audio n'est pas menée selon les standards. La défense fait valoir que les enregistrements sont irrecevables. Le chef d'entreprise perd ses millions sans condamnation."
    },
    tags: ["IA", "SOCIAL ENGINEERING", "AUDIO FORENSIQUE", "DROIT PÉNAL"],
    legalRefs: ["Art. 146 CP", "Art. 251 CP", "Art. 143 CP", "ENISA AI Fraud 2024"],
    intro: "Janvier 2026, canton de Schwyz. Un chef d'entreprise de taille moyenne reçoit un appel téléphonique de son partenaire commercial habituel — voix familière, vocabulaire précis, contexte cohérent. Ce «&nbsp;partenaire&nbsp;» lui demande un virement urgent vers un compte bancaire asiatique pour finaliser une acquisition confidentielle. Le chef d'entreprise exécute. Plusieurs millions de francs disparaissent. Quand il rappelle son partenaire le lendemain, celui-ci n'a jamais appelé. Votre mission : mener l'investigation.",
    alertLevel: "🎙️ DEEPFAKE VOCAL — Millions extorqués via clonage IA",
    objectives: [
      { icon: "🔬", text: "Analyser l'enregistrement audio pour détecter les artefacts IA" },
      { icon: "⚖️", text: "Qualifier correctement l'infraction (Art. 146 CP — tromperie personne physique)" },
      { icon: "💸", text: "Tracer les flux financiers et activer les canaux d'entraide" },
      { icon: "🧪", text: "Rédiger un rapport d'expertise audio admissible en justice" },
    ],
    debrief: `<p>Le clonage vocal par IA (Voice Cloning) utilise des modèles TTS (Text-to-Speech) neuronaux qui peuvent reproduire une voix à partir de quelques secondes d'échantillon audio — souvent prélevé sur des interviews publiques, des vidéos YouTube, ou des présentations de l'entreprise. Le résultat peut tromper l'oreille humaine dans 9 cas sur 10 (UCL, 2024).</p>
<p>En droit suisse, la qualification dépend du vecteur : si la tromperie vise une <strong>personne physique</strong> (qui décide du virement), c'est <strong>Art. 146 CP</strong> (escroquerie). Si le virement est exécuté via un système bancaire entièrement automatisé, Art. 147 CP peut coexister. L'<strong>investigation audio forensique</strong> — analyse spectrale, détection d'artefacts de synthèse, comparaison voix réelle — est la clé de la démonstration judiciaire.</p>`,
    steps: [
      {
        phase: "🎙️ L'enregistrement récupéré",
        situation: `La victime a enregistré la conversation sur son smartphone (application téléphonique). Vous récupérez le fichier audio (format m4a, 4m22s). Avant toute analyse, vous devez acquérir la preuve selon les standards forensiques.<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📱 Source : smartphone Samsung Galaxy (Android 14) de la victime<br>
🎵 Format : m4a, 44.1kHz stéréo, VBR, 4m22s<br>
📅 Timestamp EXIF : 15 janvier 2026, 14h37 UTC+1<br>
📞 Métadonnées réseau : numéro entrant +41 77 XXX XX XX (Swisscom prépayé)<br>
⚠️ La victime a écouté le fichier plusieurs fois depuis
</div>`,
        law: "<strong>ACPO Principle 2</strong> — Ne pas modifier la preuve originale lors de l'acquisition.<br><strong>Art. 141 CPP</strong> — Admissibilité : hash d'intégrité requis.<br><strong>ISO/IEC 27037</strong> — Acquisition de preuves numériques sur appareil mobile.",
        question: "<strong>Quelle est votre première action forensique sur le fichier audio ?</strong>",
        choices: [
          {
            text: "Copier le fichier m4a sur votre laptop d'analyse et commencer l'analyse spectrale immédiatement.",
            ok: false, pts: -15,
            fb: "Acquisition sans documentation d'intégrité. Copier sans calculer de hash préalable sur le fichier source ne garantit pas que le fichier n'a pas été modifié entre la récupération et l'analyse. La défense contestera l'intégrité.",
            legal: "ACPO Principle 2 + Art. 141 CPP — Hash de référence sur le fichier original AVANT toute manipulation.",
            critical: false, next: 1,
          },
          {
            text: "Extraction forensique via ADB (Android Debug Bridge) en mode lecture seule, hash SHA-256 du fichier source sur le device, puis copie sur support vierge préalablement hashé. Comparer les hashes avant/après. Sceller l'original du smartphone.",
            ok: true, pts: 25,
            fb: "Procédure exemplaire. L'extraction ADB en mode lecture seule évite de modifier les métadonnées du fichier. Le double hash (sur device + sur copie) prouve l'intégrité. Sceller le smartphone préserve l'original pour contre-expertise. Cette chaîne de custody est indispensable pour qu'un rapport audio soit recevable.",
            legal: "ACPO Principle 2 + ISO/IEC 27037 + Art. 141 CPP — Chaîne de custody audio : acquisition lecture seule + double hash + scellés.",
            critical: false, next: 1,
          },
          {
            text: "Demander à la victime d'envoyer le fichier par WhatsApp pour analyse rapide.",
            ok: false, pts: -25,
            fb: "Erreur critique. WhatsApp recompresse les fichiers audio (transcodage, perte de qualité, modification des métadonnées). Le fichier reçu ne serait plus la preuve originale — toute analyse spectrale porterait sur un artefact de compression, invalidant les conclusions. De plus, l'envoi via WhatsApp crée des copies non contrôlées.",
            legal: "ACPO Principle 1 — Toute action susceptible de modifier la preuve est interdite.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🔬 L'analyse spectrale",
        situation: `Vous analysez le fichier avec Audacity + Sox + un modèle de détection deepfake (DeepWave Detector v3.1). Résultats :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📊 Analyse spectrale (FFT) : coupure abrupte des harmoniques >8kHz — signature typique des modèles TTS VITS/Tortoise<br>
🔊 Analyse prosodique : micro-pauses artificielles entre syllabes (15-25ms), absentes du vrai locuteur<br>
🧠 DeepWave Detector : score de probabilité deepfake = 94.7% (seuil détection : 85%)<br>
🎵 Bruit de fond : aucun bruit ambiant naturel — environnement acoustique synthétique<br>
📞 Comparaison avec enregistrement authentique du partenaire (conférence 2024) : divergence formantique +23%
</div>`,
        law: "<strong>Art. 184 CPP</strong> — L'expert répond à des questions précises, avec méthode documentée.<br><strong>Art. 189 CPP</strong> — Expertise contradictoire possible.<br><strong>ENISA AI Fraud Threat Landscape 2024</strong> — Méthodes de détection deepfake audio.",
        question: "<strong>Comment formulez-vous votre conclusion d'expert dans le rapport forensique ?</strong>",
        choices: [
          {
            text: "«&nbsp;L'enregistrement est un deepfake à 94.7%. La voix n'est pas celle de M. X.&nbsp;»",
            ok: false, pts: -15,
            fb: "Formulation péremptoire non conforme au rôle d'expert. Un score algorithmique (94.7%) ne peut pas être traduit en certitude absolue. L'expert doit formuler au niveau d'affirmation correct (fait → interprétation → opinion) et indiquer les limites de la méthode. Un contre-expert contestera un tel excès.",
            legal: "Art. 182 + 184 CPP — L'expert ne tranche pas, il éclaire. Formulation probabiliste obligatoire.",
            critical: false, next: 2,
          },
          {
            text: "«&nbsp;L'analyse de 5 indicateurs indépendants (spectrale, prosodique, algorithme, bruit de fond, comparaison formantique) convergent vers une probabilité élevée d'enregistrement synthétisé par IA. Cette conclusion est soumise à vérification contradictoire par un second expert en phonétique forensique.&nbsp;»",
            ok: true, pts: 25,
            fb: "Formulation d'expert irréprochable. Vous citez 5 sources indépendantes qui convergent (preuve par indices — ATF 144 IV 345), vous utilisez le niveau d'affirmation correct (probabilité élevée, pas certitude), et vous proposez proactivement la contre-expertise. Un juge peut s'appuyer sur cette formulation solide.",
            legal: "Art. 184 CPP + ATF 144 IV 345 — Convergence multi-indicateurs + niveau d'affirmation correct + ouverture à la contradiction.",
            critical: false, next: 2,
          },
          {
            text: "«&nbsp;Il est impossible de conclure avec certitude. Des analyses complémentaires sont nécessaires.&nbsp;»",
            ok: false, pts: -10,
            fb: "Formulation trop prudente qui ne valorise pas les indices solides disponibles. 5 indicateurs convergents sont significatifs — ne pas les valoriser prive le MP d'une démonstration probatoire forte. L'expert peut conclure à une probabilité élevée sans attendre des certitudes absolues inexistantes.",
            legal: "Art. 184 CPP — L'expert doit répondre à la question posée avec les données disponibles. Le refus de conclure est évitable ici.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "⚖️ La qualification pénale",
        situation: `L'expertise audio établit la probabilité élevée d'un deepfake vocal. Le MP vous demande de qualifier les infractions. Les faits établis :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
① L'auteur a cloné la voix du partenaire commercial via IA (voix prélevée sur une vidéo LinkedIn publique)<br>
② Il a appelé le chef d'entreprise en usurpant l'identité vocale du partenaire<br>
③ Le chef d'entreprise, trompé, a ordonné lui-même à sa banque un virement de 3.2M CHF<br>
④ Le virement a été exécuté par un conseiller bancaire (sur instruction téléphonique de la victime)<br>
⑤ Des faux documents d'acquisition (PDF, tampon électronique) ont été envoyés par e-mail en parallèle
</div>`,
        law: "<strong>Art. 146 CP</strong> — Escroquerie : tromperie astucieuse d'une personne physique par «&nbsp;affirmations fallacieuses ou dissimulation de faits&nbsp;».<br><strong>Art. 147 CP</strong> — Abus d'ordinateur : influence sur traitement automatisé.<br><strong>Art. 251 CP</strong> — Faux dans les titres (documents PDF falsifiés).<br><strong>ATF 150 IV 188</strong> — Si humain impliqué dans le virement → Art. 146 CP prime.",
        question: "<strong>Quelles infractions retenir et pourquoi Art. 146 CP plutôt qu'Art. 147 CP prime ?</strong>",
        choices: [
          {
            text: "Art. 147 CP — le deepfake est une manipulation informatique = abus d'ordinateur.",
            ok: false, pts: -20,
            fb: "Erreur de qualification. ATF 150 IV 188 est décisif : le virement a été ordonné par la victime à un conseiller bancaire humain (qui l'a exécuté). Une personne physique a été trompée et a pris la décision. Art. 147 CP s'applique uniquement si le processus est entièrement automatisé — ce n'est pas le cas ici. C'est Art. 146 CP (escroquerie) qui prime.",
            legal: "ATF 150 IV 188 consid. 4.9 — Si un être humain décide : Art. 146 CP. Art. 147 CP = processus 100% automatisé.",
            critical: false, next: 3,
          },
          {
            text: "Art. 146 CP al. 1 (escroquerie — tromperie vocale de la victime) + Art. 251 CP (faux dans les titres — documents PDF falsifiés) en concours réel. Le deepfake vocal est le moyen 'astucieux' de l'Art. 146 CP.",
            ok: true, pts: 25,
            fb: "Qualification correcte et bien articulée. Art. 146 CP est parfait : l'auteur a utilisé un deepfake vocal pour «&nbsp;astucieusement induire en erreur une personne physique&nbsp;» (la victime) qui a ensuite ordonné le virement. Art. 251 CP couvre les faux documents PDF envoyés en parallèle (faux dans les titres = documents falsifiés utilisés comme preuve). Concours réel Art. 9 CP. ATF 150 IV 188 confirme que c'est Art. 146, pas 147.",
            legal: "Art. 146 al. 1 CP + Art. 251 CP en concours réel + ATF 150 IV 188 — Tromperie d'une personne physique via deepfake = escroquerie.",
            critical: false, next: 3,
          },
          {
            text: "Art. 146 + 147 + 143 + 251 CP — tout cumuler pour couvrir tous les aspects du deepfake.",
            ok: false, pts: -10,
            fb: "Sur-qualification. Art. 143 CP (soustraction de données) n'est pas caractérisé — l'auteur a accédé à une vidéo LinkedIn publique pour prélever la voix, ce qui n'est pas une soustraction de données au sens légal. Art. 147 CP est exclu par ATF 150 IV 188 (humain impliqué). Une qualification précise vaut mieux qu'un cumul de charges non établies.",
            legal: "Principe de précision pénale — Ne retenir que les infractions caractérisées par les faits.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "💸 Le traçage des fonds",
        situation: `Le virement de 3.2M CHF a transité en 3 étapes : compte UBS Zurich → compte fictif DBS Singapore → comptes fragmentés (8 sous-comptes) dans 4 pays asiatiques. La fragmentation s'est produite en 6 heures. Vous avez 48 heures avant que les fonds deviennent irrécupérables.`,
        law: "<strong>SWIFT gpi Tracker</strong> — Traçage des virements SWIFT en temps réel.<br><strong>MLAT CH-SG</strong> — Entraide judiciaire Suisse-Singapour.<br><strong>Art. 305bis CP</strong> — Blanchiment : la fragmentation est une manœuvre de blanchiment.",
        question: "<strong>Dans les 48 heures, quelle action a le plus d'impact pour bloquer les fonds fragmentés ?</strong>",
        choices: [
          {
            text: "Demander un rapport SWIFT gpi complet à UBS pour identifier tous les sous-comptes de destination.",
            ok: false, pts: -5,
            fb: "Utile mais insuffisant seul. Le SWIFT gpi trace jusqu'au compte DBS Singapore. Pour les 8 sous-comptes dans 4 pays, il faut activer les canaux MLAT en parallèle avec les autorités locales. Le rapport gpi seul ne bloque pas les fonds — il les localise.",
            legal: "SWIFT gpi = outil de traçage. Blocage = MLAT + canaux judiciaires locaux.",
            critical: false, next: 4,
          },
          {
            text: "Triple action simultanée : (1) SWIFT Recall + gpi trace depuis UBS vers DBS Singapore, (2) MPC de piquet → ordonnance séquestre → MLAT CH-SG pour les fonds Singapore, (3) fedpol → canaux INTERPOL financiers pour les 4 pays de fragmentation. En parallèle : signalement MROS (blanchiment Art. 305bis CP).",
            ok: true, pts: 25,
            fb: "Approche SATI-level optimale. Les trois actions en parallèle maximisent les chances : le Recall tente de bloquer à la source, le MLAT CH-SG cible les fonds Singapore (encore identifiables), les canaux INTERPOL permettent des gels provisoires dans les 4 pays. Le signalement MROS ajoute la LBA au dispositif et peut déclencher des gels bancaires automatiques dans les pays partenaires.",
            legal: "SWIFT gpi + MLAT CH-SG + INTERPOL FIN + Art. 305bis CP + LBA (MROS) — Réponse multi-canal conforme à la procédure SATI.",
            critical: false, next: 4,
          },
          {
            text: "Attendre l'identification du suspect avant d'agir — bloquer les fonds sans suspect identifié est juridiquement risqué.",
            ok: false, pts: -25,
            fb: "Erreur critique de timing. En matière de récupération d'avoirs criminels, l'attente de 48h est fatale — les fonds fragmentés en 8 sous-comptes dans 4 pays seront retirés en espèces ou convertis en crypto. Art. 305bis CP permet le séquestre préventif des valeurs patrimoniales d'origine criminelle AVANT identification du suspect. La récupération prime.",
            legal: "Art. 305bis CP + Art. 72 CPP — Séquestre préventif des avoirs sans identification préalable du suspect.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📋 Le rapport final et l'expertise",
        situation: `Trois mois plus tard. Les autorités singapouriennes ont gelé 2.1M CHF. 1.1M CHF restent introuvables. Un suspect est identifié en Moldavie — des demandes d'entraide internationale sont en cours. Le MP vous demande un rapport d'expertise final structuré pour la mise en accusation.`,
        law: "<strong>Art. 184 CPP</strong> — Rapport d'expertise : méthode, conclusions, limites.<br><strong>Art. 182 CPP</strong> — L'expert éclaire sans trancher.<br><strong>ATF 144 IV 345</strong> — Preuve par indices convergents.",
        question: "<strong>Quelle est la structure optimale de votre rapport d'expertise audio-forensique pour le MP ?</strong>",
        choices: [
          {
            text: "Rapport technique exhaustif de 150 pages avec tous les spectrogrammes bruts et logs d'analyse.",
            ok: false, pts: -10,
            fb: "Volume inadapté à l'audience MP. 150 pages non structurées ne permettent pas à un procureur de construire son acte d'accusation. Structure pyramidale requise : synthèse courte + détail technique en annexes.",
            legal: "Art. 184 CPP — L'expert adapte son rapport à l'audience judiciaire, pas technique.",
            critical: false, next: "end",
          },
          {
            text: "Structure en 4 niveaux : (1) Résumé exécutif 1 page (MP) — conclusion principale + force probante, (2) Analyse technique 8 pages — 5 indicateurs + méthodes + limites, (3) Annexes techniques — spectrogrammes, logs DeepWave, comparaison formantique avec hashes SHA-256, (4) Glossaire — vulgarisation des termes techniques pour le juge.",
            ok: true, pts: 25,
            fb: "Structure professionnelle optimale. Le résumé exécutif permet au MP de formuler ses chefs d'accusation immédiatement. L'analyse technique de 8 pages est suffisamment détaillée pour être vérifiable par un contre-expert. Les annexes avec hashes prouvent l'intégrité (Art. 141 CPP). Le glossaire rend le rapport accessible au juge non-spécialiste.",
            legal: "Art. 184 CPP + NIST SP 800-61r3 — Rapport pyramidal : accessible au juriste, vérifiable par l'expert.",
            critical: false, next: "end",
          },
          {
            text: "Rapport de 2 pages — les éléments essentiels suffisent, l'expertise audio est évidente.",
            ok: false, pts: -15,
            fb: "Trop succinct pour une infraction grave avec un préjudice de 3.2M CHF. La défense disposera certainement d'un contre-expert — sans documentation technique complète (spectrogrammes, logs, hashes), votre expertise ne résiste pas à la contradiction. Un rapport de 2 pages sera considéré comme superficiel.",
            legal: "Art. 189 CPP — Expertise contradictoire : vous devez anticiper et documenter face à un contre-expert.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "🎙️", title: "Expert Audio Forensique IA", sub: "Maîtrise parfaite du deepfake vocal et des qualifications Art. 146/251 CP" };
      if (pct >= 65) return { icon: "🔬", title: "Analyste Deepfake", sub: "Bonnes bases en forensique audio et droit pénal IA" };
      if (pct >= 45) return { icon: "🎵", title: "Technicien Audio", sub: "Approfondissez l'investigation audio forensique et ATF 150 IV 188" };
      return { icon: "📚", title: "Formation IA forensique requise", sub: "Deepfake, Art. 146 CP, expertise audio — compétences clés 2025-2026" };
    },
  },

  /* ── LOCKBIT VICTIME — Réponse à incident PME, Suisse 2024 [EASY · 3 étapes] ──
     Scénario d'entrée pour les novices — premier cas de ransomware
     Contexte : Opération Cronos (fedpol + 12 pays), outils de déchiffrement LockBit
     Procédures : isolation réseau, décision de payer / ne pas payer, signalement OFCS
  ─────────────────────────────────────────────────────── */
  {
    id: "lockbit-victime",
    title: "Ransomware — Premier Réflexe",
    icon: "🔒",
    difficulty: "easy",
    atmosphere: "ransomware",
    realCase: "Opération Cronos — fedpol + 12 pays, démantèlement LockBit 2024",
    narrative: {
      success: "L'isolation immédiate a limité la propagation. Les backups offline sont intacts. Le signalement à l'OFCS permet d'obtenir un outil de déchiffrement gratuit (Opération Cronos). Aucune rançon payée. L'entreprise reprend en 48h.",
      degraded: "La propagation partielle a chiffré 40% des données. Backups partiels disponibles. Reprise en 5 jours avec perte de données mineures.",
      failure: "La non-isolation initiale a permis au ransomware de chiffrer tout le réseau y compris les NAS de backup. Rançon de 80'000 CHF payée sans garantie de déchiffrement."
    },
    tags: ["RANSOMWARE", "RÉPONSE INCIDENT", "WINDOWS", "DROIT"],
    legalRefs: ["OFCS/GovCERT procédures", "LPD 2023 Art. 24", "SECO sanctions", "Art. 305bis CP"],
    intro: "Lundi 08h15. En arrivant au bureau, les écrans de la PME affichent tous le même message : « Vos fichiers sont chiffrés. Payez 80'000 CHF en Bitcoin dans 72h. » Vous êtes le responsable IT. C'est votre premier incident ransomware. Les 15 collaborateurs attendant vos instructions. Par où commencer ?",
    alertLevel: "🔴 RANSOMWARE ACTIF — 72h avant doublement de la rançon",
    objectives: [
      { icon: "🔌", text: "Isoler immédiatement le réseau pour stopper la propagation" },
      { icon: "💾", text: "Évaluer l'état des backups avant toute décision" },
      { icon: "📣", text: "Signaler à l'OFCS et au MP — procédures obligatoires" },
      { icon: "💰", text: "Appliquer la position suisse officielle sur le paiement de rançon" },
    ],
    debrief: `<p>La réponse aux 30 premières minutes d'un incident ransomware détermine l'issue. La séquence correcte est : <strong>(1) Isoler</strong> → (2) Évaluer les backups → (3) Signaler l'OFCS → (4) Ne pas payer → (5) Vérifier l'existence d'outils de déchiffrement (No More Ransom).</p>
<p><strong>LockBit</strong>, démantelé en février 2024 par une coalition de 12 pays dont la Suisse (Opération Cronos, fedpol), avait mis à disposition des outils de déchiffrement gratuits pour les victimes. Beaucoup de PME suisses auraient pu récupérer leurs données sans payer — si elles avaient signalé à l'OFCS. Le paiement de rançon finance la cybercriminalité et n'est pas recommandé par les autorités suisses.</p><p><strong>Référence CH</strong> : Opération Cronos (20-21 février 2024) — coalition de 12 pays dont fedpol a démantelé l'infrastructure LockBit. Le NCA britannique (National Crime Agency) a mis à disposition des clés de déchiffrement via le portail de l'OFCS/GovCERT. Art. 302 CPP — signalement à la police : facultatif pour les entreprises privées (sauf professions réglementées). LPD 2023 Art. 24 — notification PFPDT : obligation conditionnelle (données personnelles + risque élevé = notification obligatoire).</p>`,
    steps: [
      {
        phase: "🔌 Les 5 premières minutes",
        situation: `08h17 — Le message de rançon s'affiche partout. Certains postes semblent encore normaux. Le réseau est toujours actif. Un collaborateur dit «&nbsp;Je peux encore accéder à mes fichiers sur le NAS&nbsp;». Vous devez agir immédiatement.`,
        law: "<strong>ISO/IEC 27035</strong> — Gestion d'incident : Identification → Containment → Eradication.<br><strong>Manuel DFIR Ch. 11.1</strong> — Priorité absolue : contenir la propagation avant toute investigation.",
        question: "<strong>Quelle est votre action IMMÉDIATE dans les 5 prochaines minutes ?</strong>",
        choices: [
          {
            text: "Couper immédiatement TOUS les accès réseau (WiFi, LAN, VPN, connexion Internet) — isoler physiquement le réseau de l'entreprise.",
            ok: true, pts: 25,
            fb: "Décision critique et correcte. Le ransomware se propage via le réseau (SMB, partages). Chaque seconde de connectivité permet au chiffrement de progresser. Le NAS encore accessible doit être isolé immédiatement — c'est la priorité absolue avant tout le reste. Couper le réseau = arrêter le patient qui saigne.",
            legal: "ISO/IEC 27035 + Manuel DFIR — Containment first : isolation réseau prioritaire absolue. Les backups NAS doivent être physiquement déconnectés.",
            critical: false, next: 1,
          },
          {
            text: "Payer la rançon immédiatement pour récupérer les fichiers avant que la situation empire.",
            ok: false, pts: -30,
            fb: "Erreur grave à plusieurs niveaux. (1) Payer ne garantit pas le déchiffrement (moins de 60% des victimes récupèrent leurs données). (2) Vous financez des criminels. (3) Vous n'avez pas encore évalué vos backups — vous avez peut-être une solution gratuite. (4) Si LockBit est sanctionné par le SECO/OFAC, payer peut constituer une infraction. JAMAIS payer avant d'avoir évalué toutes les alternatives.",
            legal: "SECO + OFAS + OFCS : position suisse officielle = ne pas payer. Art. 305bis CP potentiel si paiement à entité sanctionnée.",
            critical: true, next: "end",
          },
          {
            text: "Appeler le fournisseur de services informatiques et attendre ses instructions.",
            ok: false, pts: -15,
            fb: "Trop passif. Chaque minute d'inaction laisse le ransomware chiffrer davantage de fichiers. Vous pouvez appeler votre prestataire — mais simultanément, pas à la place de l'isolation. Le prestataire vous dira d'abord : coupez le réseau. Agissez vous-même immédiatement.",
            legal: "ISO/IEC 27035 — Vous n'avez pas besoin d'experts pour couper le switch réseau.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "💾 L'état des backups",
        situation: `Réseau coupé. 08h22 — Vous évaluez les backups. État :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
✅ NAS de bureau (réseau local) : <strong>CHIFFRÉ</strong> — le ransomware avait accès réseau<br>
✅ Disque USB backup hebdomadaire (branché en permanence au serveur) : <strong>CHIFFRÉ</strong><br>
✅ Backup cloud OneDrive (synchronisation auto activée) : <strong>PARTIEL</strong> — fichiers récents chiffrés synchronisés<br>
🔴 Backup tape mensuel (stocké dans un coffre physique hors réseau) : <strong>INTACT</strong> — dernier backup il y a 18 jours
</div>`,
        law: "<strong>Règle 3-2-1 des backups</strong> — 3 copies, 2 supports différents, 1 hors site (offline).<br><strong>OFCS Guide Ransomware</strong> — Évaluation backups avant toute décision de paiement.",
        question: "<strong>Avec un backup tape intact vieux de 18 jours, quelle est votre position sur le paiement ?</strong>",
        choices: [
          {
            text: "Payer la rançon pour récupérer les 18 derniers jours de données manquants dans le backup.",
            ok: false, pts: -20,
            fb: "Décision prématurée et risquée. Avant de payer, vérifiez : (1) LockBit a été démantelé en 2024 — des outils de déchiffrement gratuits existent (No More Ransom, OFCS). (2) Les 18 jours manquants peuvent-ils être reconstitués depuis les e-mails, les versions locales sur les postes non chiffrés, ou le shadow copy Windows ? Payer avant d'explorer ces options est une erreur.",
            legal: "OFCS Guide Ransomware 2024 — Vérifier No More Ransom et outils de déchiffrement AVANT tout paiement.",
            critical: false, next: 2,
          },
          {
            text: "Ne pas payer. Restaurer depuis le backup tape (18j de perte) + signaler immédiatement à l'OFCS pour obtenir les outils de déchiffrement LockBit (Opération Cronos).",
            ok: true, pts: 25,
            fb: "Décision optimale et conforme aux recommandations suisses. Le backup tape intact permet la restauration (18j de perte = acceptable). L'OFCS/GovCERT a mis à disposition des outils de déchiffrement LockBit gratuits suite à l'Opération Cronos (février 2024). Signaler immédiatement permet d'obtenir ces outils ET de contribuer à l'enquête nationale contre LockBit. Position officielle suisse : ne pas payer.",
            legal: "OFCS/GovCERT + No More Ransom + Opération Cronos 2024 — Outils déchiffrement LockBit disponibles gratuitement post-démantèlement.",
            critical: false, next: 2,
          },
          {
            text: "Restaurer depuis le backup tape et ne rien signaler — pas besoin d'impliquer les autorités.",
            ok: false, pts: -15,
            fb: "Erreur de deux niveaux. (1) La LPD 2023 peut imposer une notification au PFPDT si des données personnelles ont été compromises (Art. 24 LPD 2023). (2) Ne pas signaler à l'OFCS prive les autorités d'informations sur LockBit et vous prive des outils de déchiffrement disponibles. Le signalement est dans votre intérêt ET dans l'intérêt collectif.",
            legal: "LPD 2023 Art. 24 (notification PFPDT si données personnelles compromises) + OFCS — Signalement recommandé.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "📣 Le signalement officiel",
        situation: `Vous signalez à l'OFCS (ofcs.admin.ch). Le GovCERT répond dans l'heure et confirme : LockBit v3.0 identifié, outils de déchiffrement disponibles pour les victimes ayant signalé avant le 01.06.2024. Votre incident est du 2024 — vous êtes éligible. Deux questions subsidiaires : (1) Faut-il aussi signaler à la police ? (2) La LPD 2023 impose-t-elle une notification ?`,
        law: "<strong>LPD 2023 Art. 24</strong> — Notification PFPDT si violation données personnelles à risque élevé.<br><strong>Art. 302 CPP</strong> — Signalement facultatif des infractions par les particuliers (sauf si obligation professionnelle).<br><strong>GovCERT procédures</strong> — Formulaire de signalement incident.",
        question: "<strong>Devez-vous aussi signaler à la police cantonale ET notifier le PFPDT ?</strong>",
        choices: [
          {
            text: "Non aux deux — l'OFCS suffit.",
            ok: false, pts: -10,
            fb: "Incomplet. La LPD 2023 est indépendante du signalement OFCS. Si l'analyse montre que des données personnelles de clients/employés ont été chiffrées (ou exfiltrées avant chiffrement — vérifier les logs réseau), une notification PFPDT s'impose si le risque est élevé (Art. 24 LPD 2023). Le signalement police est facultatif mais recommandé pour ouvrir une procédure pénale.",
            legal: "LPD 2023 Art. 24 = obligation si données personnelles + risque élevé. Police = démarche facultative mais utile.",
            critical: false, next: "end",
          },
          {
            text: "Police cantonale : démarche recommandée mais facultative pour une PME (Art. 302 CPP). PFPDT : obligatoire si des données personnelles clients/employés ont été compromises (LPD 2023 Art. 24) — vérifier d'abord si exfiltration avant chiffrement.",
            ok: true, pts: 25,
            fb: "Position nuancée et exacte. Le signalement police (Art. 302 CPP) est facultatif pour un particulier/entreprise — mais il ouvre une procédure pénale utile pour votre assurance cyber et contribue à l'enquête nationale. La notification PFPDT (LPD 2023 Art. 24) dépend de si des données personnelles ont été exposées — vérifier les logs réseau pour détecter une éventuelle exfiltration avant le chiffrement (technique LockBit : double extorsion).",
            legal: "Art. 302 CPP (signalement facultatif) + LPD 2023 Art. 24 (notification conditionnelle) + OFCS procédures.",
            critical: false, next: "end",
          },
          {
            text: "Les deux sont obligatoires dans tous les cas.",
            ok: false, pts: -5,
            fb: "Trop absolu. Le signalement à la police est facultatif pour une entreprise privée (Art. 302 CPP — les particuliers ne sont pas obligés de signaler, sauf certaines professions). La notification PFPDT n'est obligatoire que si des données personnelles sont compromises avec risque élevé — ce n'est pas automatique dans tout incident ransomware.",
            legal: "Art. 302 CPP — Signalement facultatif (sauf professions spécifiques). LPD 2023 Art. 24 — Notification conditionnelle (données personnelles + risque élevé).",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 85) return { icon: "🛡️", title: "Gestionnaire Incident Confirmé", sub: "Réflexes parfaits — isolation, backups, OFCS, LPD 2023" };
      if (pct >= 60) return { icon: "🔒", title: "Responsable IT Cyber-Averti", sub: "Bonnes bases en réponse ransomware" };
      return { icon: "📚", title: "Formation ransomware requise", sub: "Révisez l'OFCS Guide Ransomware et les procédures d'isolation" };
    },
  },

  /* ══════════════════════════════════════════════════════════
     NOUVELLES AFFAIRES — AVRIL 2026
  ══════════════════════════════════════════════════════════ */

  /* ── VÉTROZ-AKIRA — Supply Chain Attack Valais [MEDIUM · 5 étapes] ──
     Source : 20min.ch + Le Nouvelliste + RhôneFM + La Télé — 12-24 avril 2026
     Groupe AKIRA attaque prestataire IT valaisan → Vétroz, Abrifeu SA,
     Air-Glaciers, Foire du Valais. Plainte MPC + jonction procédure AKIRA 2024.
  ─────────────────────────────────────────────────────── */
  {
    id: "vetroz-akira",
    title: "Akira à Vétroz — Supply Chain Valais",
    icon: "🏔️",
    difficulty: "medium",
    atmosphere: "ransomware",
    realCase: "Commune de Vétroz + Air-Glaciers + Foire du Valais, 12 avril 2026 (AKIRA)",
    narrative: {
      success: "La crise est maîtrisée : sauvetages Air-Glaciers jamais interrompus, plainte jointe à la procédure MPC AKIRA, Vétroz rétabli en 10 jours. Référence romande de gestion supply chain.",
      degraded: "Rétablissement en 15 jours avec pertes de données partielles. Forensique prestataire lacunaire. PME valaisannes réclament des indemnisations.",
      failure: "Absence de coordination inter-victimes et forensique insuffisante. AKIRA non formellement identifié dans ce dossier. Données Abrifeu SA perdues."
    },
    tags: ["SUPPLY CHAIN", "RANSOMWARE", "RÉPONSE INCIDENT", "DROIT"],
    legalRefs: ["Art. 143bis CP", "Art. 144bis CP", "LPD 2023 Art. 24", "Art. 30 CPP", "Art. 302 CPP"],
    intro: "12 avril 2026, 07h45. La commune de Vétroz (VS) ne peut plus accéder à ses systèmes. Simultanément : Abrifeu SA (Riddes) perd facturation et stocks, Air-Glaciers voit ses serveurs affectés, la Foire du Valais perd sa comptabilité. Point commun : tous sont clients du même prestataire informatique valaisan. Le groupe AKIRA revendique l'attaque. Vous êtes mandaté par le prestataire pour gérer la crise.",
    alertLevel: "🏔️ AKIRA VALAIS — 4 VICTIMES · 1 PRESTATAIRE COMPROMIS · Air-Glaciers toujours en vol",
    objectives: [
      { icon: "🔌", text: "Isoler les systèmes du prestataire et cartographier l'étendue — 23 clients potentiellement touchés" },
      { icon: "✈️", text: "Prioriser la continuité opérationnelle d'Air-Glaciers (sauvetages héliportés)" },
      { icon: "📣", text: "Gérer les obligations LPD 2023 de chaque entité victime indépendamment" },
      { icon: "🏛️", text: "Structurer la jonction de la plainte à la procédure MPC AKIRA existante (Art. 30 CPP)" },
    ],
    debrief: `<p>L'affaire Vétroz illustre le risque des <strong>attaques supply chain</strong> : un seul prestataire compromis paralyse simultanément une commune, une entreprise de sécurité incendie, un opérateur de sauvetage héliporté et un organisateur d'événements. La surface d'attaque réelle n'est pas celle des victimes finales, mais celle de leur prestataire.</p>
<p>Points juridiques clés de l'affaire : (1) Chaque entité notifie le PFPDT indépendamment (LPD 2023 Art. 24 — le prestataire n'est pas le responsable de traitement). (2) Les données de santé Air-Glaciers = catégorie particulière → risque élevé automatique → notification prioritaire. (3) Dépôt direct au <strong>MPC avec demande de jonction (Art. 30 CPP)</strong> à la procédure AKIRA 2024 déjà ouverte — procédure utilisée par Vétroz le 24 avril 2026.</p>`,
    steps: [
      {
        phase: "🔌 07h50 — Isolation et cartographie d'urgence",
        situation: `Vous disposez de 30 minutes avant que les médias locaux soient informés.<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📡 23 clients du prestataire sur la même infrastructure centralisée<br>
🔒 Message AKIRA sur console de supervision : «&nbsp;Your files are encrypted&nbsp;»<br>
✈️ Air-Glaciers : fallback manuel activé — sauvetages maintenus<br>
🚒 Abrifeu SA : stocks, livraisons, facturation bloqués<br>
🎡 Foire du Valais : comptabilité + tourniquets sur 2 serveurs perdus<br>
🏛️ Commune de Vétroz : bases de données et logiciels essentiels inaccessibles
</div>`,
        law: "<strong>ISO/IEC 27035</strong> — Containment first : isoler avant d'investiguer.<br><strong>LPD 2023 Art. 7</strong> — Devoir de sécurité du sous-traitant IT.",
        question: "<strong>Quelle est votre priorité absolue dans les 30 premières minutes ?</strong>",
        choices: [
          {
            text: "Isoler immédiatement toute l'infrastructure (couper les accès réseaux de TOUS les clients) et les notifier simultanément pour qu'ils activent leurs plans de continuité.",
            ok: true, pts: 25,
            fb: "Décision correcte. L'isolation stoppe la propagation vers les 23 autres clients non encore touchés. La notification simultanée permet à Air-Glaciers de consolider son fallback, à Abrifeu de mettre ses livraisons en attente. Chaque minute sans isolation peut étendre les dégâts.",
            legal: "ISO/IEC 27035 — Containment : priorité absolue avant investigation.",
            critical: false, next: 1,
          },
          {
            text: "Commencer l'investigation forensique pour identifier le vecteur d'entrée AKIRA avant de toucher quoi que ce soit.",
            ok: false, pts: -15,
            fb: "Erreur de priorisation. AKIRA continue de chiffrer pendant l'analyse. Les 23 autres clients non touchés peuvent être compromis dans l'heure. Isoler d'abord — forensique sur systèmes isolés ensuite.",
            legal: "ISO/IEC 27035 — Containment avant Investigation. Le temps de forensique coûte ici des victimes supplémentaires.",
            critical: false, next: 1,
          },
          {
            text: "Appeler immédiatement le MPC et attendre leurs instructions avant toute action technique.",
            ok: false, pts: -20,
            fb: "Trop passif. Une procédure judiciaire prend des heures à s'activer. Isoler = action dans votre compétence immédiate. Contacter le MPC = parallèle, pas préalable à l'isolation.",
            legal: "ISO/IEC 27035 — Actions techniques d'urgence dans la compétence du prestataire.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "✈️ 09h15 — Air-Glaciers : le risque vital",
        situation: `Air-Glaciers a activé son fallback manuel. Les sauvetages héliportés sont maintenus. Mais deux de leurs serveurs sont chiffrés — et ils sont encore connectés au réseau du prestataire compromis. Si les systèmes de coordination des vols médicalisés sont atteints, des vies sont en jeu.`,
        law: "<strong>Ordonnance sur la navigation aérienne (ONA)</strong> — Priorité à la continuité des services de sauvetage aérien.<br><strong>Art. 97 CO</strong> — Responsabilité contractuelle du prestataire.",
        question: "<strong>Recommandez-vous la déconnexion immédiate d'Air-Glaciers du réseau prestataire ?</strong>",
        choices: [
          {
            text: "Oui — couper immédiatement tout lien réseau entre le prestataire compromis et Air-Glaciers, même si cela perturbe des services non critiques.",
            ok: true, pts: 25,
            fb: "Décision correcte. Le fallback manuel existe précisément pour ce scénario. Couper le lien protège les systèmes critiques de vol. La perturbation administrative est un risque acceptable. La compromission des systèmes de sauvetage ne l'est pas.",
            legal: "ONA + Art. 97 CO — Sécurité vitale prime sur continuité administrative.",
            critical: false, next: 2,
          },
          {
            text: "Non — surveiller intensivement mais ne pas couper pour éviter de perturber Air-Glaciers.",
            ok: false, pts: -25,
            fb: "Risque inacceptable. Une surveillance intensive ne peut pas stopper une propagation de ransomware en secondes. Si les systèmes de coordination de vols médicalisés sont chiffrés, des vies sont en danger. Ce n'est pas un risque pondérable contre la perturbation administrative.",
            legal: "Principe de précaution — Risque vital ne se pondère pas contre perturbation administrative.",
            critical: true, next: "end",
          },
          {
            text: "Laisser Air-Glaciers décider — c'est leur infrastructure.",
            ok: false, pts: -10,
            fb: "Déresponsabilisation inappropriée. En tant que prestataire ayant introduit le risque, vous avez une obligation de conseil. Recommandez clairement la déconnexion et expliquez le risque — la décision finale appartient à Air-Glaciers mais ils doivent être informés.",
            legal: "Art. 97 CO + Devoir de conseil — Informer et recommander, pas se défausser.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "📣 10h30 — LPD 2023 : qui notifie le PFPDT ?",
        situation: `AKIRA pratique la double extorsion — l'exfiltration avant chiffrement est leur mode opératoire documenté. Des données personnelles ont vraisemblablement été exfiltrées : données citoyens de Vétroz, données patients Air-Glaciers (données de santé !), données clients Abrifeu, données visiteurs Foire du Valais.`,
        law: "<strong>LPD 2023 Art. 24</strong> — Chaque <em>responsable du traitement</em> notifie le PFPDT indépendamment.<br><strong>LPD 2023 Art. 5 al. 1 let. c</strong> — Données de santé = catégorie particulière → risque élevé automatique.<br><strong>Art. 9 LPD 2023</strong> — Le prestataire est <em>sous-traitant</em>, pas responsable du traitement.",
        question: "<strong>Qui doit notifier le PFPDT, et dans quel ordre de priorité ?</strong>",
        choices: [
          {
            text: "Le prestataire IT notifie pour tous ses clients en une notification groupée — plus efficace.",
            ok: false, pts: -15,
            fb: "Impossible légalement. LPD 2023 Art. 24 : le <em>responsable du traitement</em> notifie — pas son sous-traitant. Vétroz notifie pour ses données communales, Abrifeu pour ses clients, Air-Glaciers pour les données santé, etc. Le prestataire informe ses clients de la violation, mais la notification PFPDT appartient à chacun.",
            legal: "LPD 2023 Art. 24 al. 1 + Art. 5 al. j — Responsable du traitement = chaque entité cliente.",
            critical: false, next: 3,
          },
          {
            text: "Chaque entité notifie le PFPDT indépendamment — Air-Glaciers en priorité absolue (données de santé = catégorie particulière = risque élevé automatique = notification sans délai).",
            ok: true, pts: 25,
            fb: "Procédure exacte. Art. 5 al. 1 let. c LPD 2023 : données de santé = catégorie particulière → risque élevé automatique → notification PFPDT obligatoire et prioritaire pour Air-Glaciers. Le mode opératoire AKIRA (exfiltration systématique documentée) rend la vraisemblance de l'exfiltration très élevée — pas besoin de confirmation absolue pour notifier.",
            legal: "LPD 2023 Art. 24 + Art. 5 al. 1 let. c — Données santé = priorité notification absolue.",
            critical: false, next: 3,
          },
          {
            text: "Attendre la confirmation que AKIRA publie les données avant de notifier — éviter les fausses alertes.",
            ok: false, pts: -20,
            fb: "Approche inacceptable pour les données de santé. Attendre qu'AKIRA publie signifie que les patients apprennent leur violation par la presse. LPD 2023 Art. 24 : notification quand violation 'vraisemblablement établie'. Avec une revendication AKIRA et leur mode opératoire documenté, la vraisemblance est très élevée.",
            legal: "LPD 2023 Art. 24 — Notification sur vraisemblance, pas seulement certitude.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "🏛️ J+2 — Plainte pénale et jonction MPC",
        situation: `La commune de Vétroz souhaite porter plainte. Le MPC a une procédure ouverte contre AKIRA depuis avril 2024. Comment structurer la plainte pour qu'elle soit traitée efficacement ?`,
        law: "<strong>Art. 30 CPP</strong> — Jonction de procédures connexes.<br><strong>Art. 24 al. 2 CPP</strong> — Compétence MPC pour cybercriminalité transfrontalière.<br><strong>Convention Budapest Art. 29</strong> — Conservation urgente des preuves électroniques.",
        question: "<strong>Comment structurer la plainte de Vétroz pour maximiser l'efficacité judiciaire ?</strong>",
        choices: [
          {
            text: "Déposer auprès du MP cantonal valaisan — Vétroz est une commune valaisanne.",
            ok: false, pts: -15,
            fb: "Mauvaise juridiction. AKIRA = groupe transnational → compétence MPC (Art. 24 al. 2 CPP). Le MP valaisan renverra au MPC. Aller directement au MPC évite ce délai.",
            legal: "Art. 24 al. 2 CPP — Cybercriminalité transfrontalière = compétence fédérale MPC.",
            critical: false, next: 4,
          },
          {
            text: "Déposer directement au MPC avec demande explicite de jonction à la procédure AKIRA 2024 (Art. 30 CPP), en produisant les éléments forensiques disponibles et la liste des victimes valaisannes.",
            ok: true, pts: 25,
            fb: "Stratégie optimale — exactement ce que Vétroz a fait (La Télé, 24 avril 2026). La jonction (Art. 30 CPP) évite la duplication : le MPC dispose déjà des TTPs AKIRA, IoC, contacts Europol. Votre dossier renforce l'accusation globale. Inclure la liste des victimes valaisannes permet au MPC d'évaluer l'ampleur totale.",
            legal: "Art. 30 CPP + Art. 24 al. 2 CPP — Procédure utilisée par Vétroz, 24 avril 2026.",
            critical: false, next: 4,
          },
          {
            text: "Attendre la fin de la restauration pour constituer un dossier complet avant de déposer plainte.",
            ok: false, pts: -10,
            fb: "Délai contre-productif. Les preuves forensiques se dégradent pendant la restauration. De plus, la Convention Budapest Art. 29 permet des mesures de conservation urgente que le MPC peut activer rapidement après une plainte.",
            legal: "Convention Budapest Art. 29 — Conservation urgente des preuves : activer tôt.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "📋 J+10 — Remédiation structurelle",
        situation: `Dix jours après. Vétroz fonctionne presque normalement. Air-Glaciers et la Foire du Valais ont rétabli leurs systèmes critiques. Abrifeu SA reconstruit depuis des sauvegardes partielles. Le prestataire vous demande un plan pour éviter la récidive.`,
        law: "<strong>NIST SP 800-161</strong> — Cybersecurity Supply Chain Risk Management.<br><strong>ISO/IEC 27001</strong> — Certification sécurité prestataires IT.<br><strong>LPD 2023 Art. 8</strong> — Sécurité par défaut.",
        question: "<strong>Quelle mesure structurelle est la plus importante pour prévenir une nouvelle supply chain attack ?</strong>",
        choices: [
          {
            text: "Ne plus externaliser — chaque entité gère son IT en interne.",
            ok: false, pts: -10,
            fb: "Irréaliste pour une commune de 1'300 habitants et des PME. L'externalisation est inévitable à cette échelle. La solution est un encadrement contractuel et technique renforcé, pas l'abandon de l'externalisation.",
            legal: "Principe de proportionnalité — Sécurité adaptée aux moyens réels des entités.",
            critical: false, next: "end",
          },
          {
            text: "Clauses contractuelles renforcées : audit sécurité annuel tiers, séparation réseau inter-clients, obligation de notification sous 2h, droit d'audit, backups offline vérifiés, MFA obligatoire admin — clause résolutoire si non respecté.",
            ok: true, pts: 25,
            fb: "Plan précis et actionnable. Chaque clause répond à un enseignement de l'affaire : séparation réseau évite la propagation inter-clients, notification rapide permet l'isolation, MFA bloque l'accès initial via credentials volés (TTPs AKIRA documentés), backups offline résistent au chiffrement.",
            legal: "NIST SP 800-161 + ISO/IEC 27001 + LPD 2023 Art. 8 — Standards supply chain IT collectivités/PME.",
            critical: false, next: "end",
          },
          {
            text: "Changer de prestataire immédiatement.",
            ok: false, pts: -5,
            fb: "Réaction compréhensible mais insuffisante. Changer de prestataire sans renforcer les exigences contractuelles reproduira le problème. La vulnérabilité exploitée par AKIRA peut affecter n'importe quel prestataire. La solution est systémique.",
            legal: "NIST SP 800-161 — Gestion du risque supply chain = processus, pas choix de fournisseur unique.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "🏔️", title: "Expert Supply Chain Valaisan", sub: "Gestion parfaite — AKIRA Vétroz 2026, référence romande" };
      if (pct >= 65) return { icon: "🔒", title: "Gestionnaire Incident Multi-Victimes", sub: "Bonne maîtrise des crises supply chain IT" };
      if (pct >= 45) return { icon: "🛡️", title: "Responder IT", sub: "Approfondissez LPD 2023 Art. 24 et Art. 30 CPP jonction" };
      return { icon: "📚", title: "Formation supply chain requise", sub: "NIST SP 800-161 + gestion multi-victimes" };
    },
  },

  /* ── FAUX-POLICIERS — Vishing Neuchâtel 2025 [MEDIUM · 4 étapes] ──
     Source : Affaire #14 liste originale — 43 coursiers arrêtés
     Art. 146 CP, Art. 179septies CP, forensique mobile Android,
     scripts d'appels, centres commandement Strasbourg/Lyon, EIMP France
  ─────────────────────────────────────────────────────── */
  {
    id: "faux-policiers",
    title: "Les Faux Policiers — Vishing Neuchâtel",
    icon: "👮",
    difficulty: "medium",
    atmosphere: "network",
    realCase: "Démantèlement réseau faux policiers, Neuchâtel 2025 — 43 coursiers",
    narrative: {
      success: "L'analyse forensique des 43 smartphones trace les scripts jusqu'aux centres FR. L'EIMP avec la France permet l'identification des cerveaux à Strasbourg. Qualification Art. 146 CP + complicité Art. 25 CP pour les coursiers. Dossier solide.",
      degraded: "15 téléphones analysés sur 43. Preuves suffisantes pour le réseau mais les centres de commandement difficiles à prouver formellement. Coursiers condamnés pour complicité, cerveaux protégés par la distance.",
      failure: "Forensique non conforme aux standards. Scripts non authentifiés. Défense obtient l'exclusion des preuves numériques. Acquittement des coursiers faute de dol prouvé."
    },
    tags: ["VISHING", "FORENSIQUE", "MOBILE", "DROIT PÉNAL"],
    legalRefs: ["Art. 146 CP", "Art. 25 CP", "Art. 179septies CP", "ACPO Principles", "Art. 48a EIMP"],
    intro: "Neuchâtel, 2025. Des 'policiers' et 'procureurs' appellent des victimes âgées, leur demandant de remettre leurs économies à un 'coursier de la police'. Après des semaines d'enquête, une opération simultanée dans 6 cantons interpelle 43 coursiers. Vous êtes l'analyste DFIR chargé de l'analyse forensique de ces 43 smartphones Android — en 48 heures, avant que les demandes de scellés arrivent.",
    alertLevel: "📞 43 SMARTPHONES SAISIS — Les scripts d'appels mènent à Strasbourg · 48h avant les scellés",
    objectives: [
      { icon: "📱", text: "Établir une procédure d'acquisition forensique de masse (43 appareils, 48h)" },
      { icon: "📋", text: "Extraire et authentifier les scripts d'appels comme preuves d'escroquerie organisée" },
      { icon: "🗺️", text: "Reconstruire la hiérarchie réseau via GPS et communications" },
      { icon: "⚖️", text: "Qualifier le dol éventuel des coursiers (Art. 12 al. 2 CP + Art. 25 CP)" },
    ],
    debrief: `<p>Les arnaques au faux policier (vishing) utilisent des scripts sophistiqués préparés par des centres de commandement à l'étranger. Les coursiers lisent souvent un texte sans en comprendre pleinement la nature criminelle. La preuve du <strong>dol éventuel</strong> (Art. 12 al. 2 CP) est centrale : ils auraient pu et dû comprendre qu'ils participaient à une fraude.</p>
<p>L'analyse forensique des téléphones permet de remonter la chaîne : scripts → numéros donneurs d'ordre → coordonnées GPS → identification des centres (Strasbourg, Lyon). L'entraide judiciaire franco-suisse (EIMP, convention bilatérale) permet ensuite l'identification des cerveaux. Enjeu forensique : <strong>authenticité des scripts</strong> (hash + chaîne de custody) pour qu'ils soient recevables comme preuves de l'organisation criminelle.</p>`,
    steps: [
      {
        phase: "📱 L'acquisition de masse — 43 téléphones, 48h",
        situation: `43 smartphones devant vous. Certains déverrouillés, d'autres verrouillés. Tous ont la connectivité cellulaire active — risque de remote wipe si les cerveaux du réseau réalisent les arrestations.<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
⚡ 12 téléphones : écran actif, déverrouillés<br>
🔒 28 téléphones : verrouillés (PIN/pattern)<br>
💀 3 téléphones : éteints<br>
📡 TOUS : connectivité cellulaire active — risque remote wipe<br>
⏱️ 48h avant que les avocats demandent les scellés
</div>`,
        law: "<strong>ACPO Principle 1</strong> — Aucune action ne doit modifier les données sur les appareils saisis.<br><strong>ISO/IEC 27037</strong> — Acquisition appareils mobiles : isolation RF obligatoire.<br><strong>Art. 248 CPP</strong> — Scellés : peuvent être demandés à tout moment par la défense.",
        question: "<strong>Quelle est votre première action sur les 43 appareils ?</strong>",
        choices: [
          {
            text: "Placer tous les appareils dans des sacs Faraday immédiatement pour couper la connectivité, puis trier par état (déverrouillé/verrouillé/éteint) pour prioriser l'acquisition.",
            ok: true, pts: 25,
            fb: "Action critique et correcte. Les sacs Faraday éliminent le risque de remote wipe — si le réseau criminel réalise les arrestations, il tentera d'effacer les téléphones à distance. L'isolation RF est la priorité absolue avant toute acquisition. Le tri par état permet ensuite de prioriser : appareils déverrouillés d'abord (accès immédiat), verrouillés ensuite (outils de déverrouillage), éteints en dernier (risque BitLocker si Android chiffré).",
            legal: "ISO/IEC 27037 + ACPO Principle 1 — Isolation RF : priorité absolue avant acquisition mobile.",
            critical: false, next: 1,
          },
          {
            text: "Commencer immédiatement l'acquisition des 12 appareils déverrouillés via ADB — c'est l'opportunité pendant qu'ils sont accessibles.",
            ok: false, pts: -15,
            fb: "Erreur critique d'ordre. Les 31 autres appareils connectés peuvent être effacés à distance pendant que vous acquérez les 12. L'isolation RF de TOUS les appareils est la priorité — ensuite seulement l'acquisition. Perdre 31 appareils par remote wipe pendant que vous acquérez 12 est un désastre forensique.",
            legal: "ISO/IEC 27037 — Isolation RF de tous les appareils avant toute acquisition individuelle.",
            critical: true, next: "end",
          },
          {
            text: "Demander à chaque suspect de déverrouiller son téléphone — plus rapide pour l'accès.",
            ok: false, pts: -20,
            fb: "Violation du droit au silence (Art. 113 CPP). Un suspect ne peut pas être contraint de fournir son code PIN — c'est une donnée auto-incriminante. Demander = risque d'invalidation de la procédure. De plus, l'accès à des appareils connectés sans isolation RF expose au remote wipe.",
            legal: "Art. 113 CPP — Droit au silence inclut le refus de communiquer ses codes d'accès.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "📋 Les scripts d'appels — preuve centrale",
        situation: `Sur 15 des 43 appareils analysés, vous trouvez des fichiers textes (.txt, .docx, WhatsApp) contenant des scripts d'appels : «&nbsp;Bonjour, je suis l'inspecteur Müller de la police fédérale. Nous avons découvert que votre compte bancaire est utilisé dans une affaire criminelle. Pour protéger vos avoirs, vous devez retirer 10'000 CHF et les remettre à notre coursier...&nbsp;». Les scripts sont en français, allemand et italien. Certains fichiers datent de 3 semaines.`,
        law: "<strong>Art. 141 CPP</strong> — Admissibilité des preuves numériques : intégrité requise.<br><strong>Art. 146 CP</strong> — Escroquerie : tromperie astucieuse d'une personne physique.<br><strong>Art. 25 CP</strong> — Complicité : participation à l'infraction d'un tiers.",
        question: "<strong>Comment authentifier les scripts pour qu'ils soient recevables et démontrent le dol des coursiers ?</strong>",
        choices: [
          {
            text: "Capturer des screenshots des scripts et les imprimer pour le dossier — format accessible pour le MP.",
            ok: false, pts: -20,
            fb: "Preuve non authentifiable. Un screenshot peut être fabriqué. Sans hash SHA-256 du fichier source, sans extraction forensique documentée depuis l'appareil avec chaîne de custody, la défense contestera l'authenticité. Le MP ne peut pas s'appuyer sur des screenshots pour prouver que le script était sur le téléphone du prévenu.",
            legal: "Art. 141 CPP — Preuves numériques : intégrité via hash + chaîne de custody. Screenshot = preuve contestable.",
            critical: false, next: 2,
          },
          {
            text: "Extraction forensique avec hash SHA-256 de chaque fichier script (UFED/Cellebrite ou ADB + dd), documentation de la chaîne de custody (appareil → extraction → hash → copie de travail), et corrélation des métadonnées (date de création, modifications, origine WhatsApp/Telegram) pour établir la timeline d'utilisation.",
            ok: true, pts: 25,
            fb: "Procédure forensique complète et admissible. Le hash SHA-256 garantit l'intégrité (Art. 141 CPP). La chaîne de custody prouve que le fichier est bien celui du prévenu. Les métadonnées (date création, envoi WhatsApp) établissent la timeline et démontrent que le script était utilisé activement — élément clé pour prouver le dol (savoir qu'on participait à une fraude).",
            legal: "ACPO Principles + Art. 141 CPP — Hash + chaîne de custody + métadonnées = preuve admissible et probante.",
            critical: false, next: 2,
          },
          {
            text: "Regrouper les 15 scripts identiques dans un fichier PDF unique pour simplifier le dossier.",
            ok: false, pts: -10,
            fb: "Perte de valeur probante individuelle. Chaque script doit être lié à un appareil spécifique (et donc à un prévenu spécifique). Un fichier PDF groupé efface ce lien. De plus, les métadonnées propres à chaque fichier (date, origine, appareil source) disparaissent. Le MP a besoin de prouver QUI avait le script, pas seulement qu'il existait.",
            legal: "Art. 141 CPP — Lien preuve → prévenu : chaque extraction individualisée par appareil.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "⚖️ Le dol éventuel des coursiers",
        situation: `Les 43 coursiers interpellés utilisent tous la même défense : «&nbsp;Je ne savais pas que c'était une fraude. J'ai été engagé pour livrer des enveloppes. On m'a dit que c'était légal.&nbsp;» Vous devez, à partir des éléments forensiques, aider le MP à établir le dol éventuel (Art. 12 al. 2 CP).`,
        law: "<strong>Art. 12 al. 2 CP</strong> — Dol éventuel : l'auteur envisage la réalisation de l'infraction comme possible et l'accepte.<br><strong>Art. 25 CP</strong> — Complicité : prêter assistance sachant ou pouvant savoir que l'acte principal est délictueux.<br><strong>ATF 133 IV 9</strong> — Dol éventuel : conscience du risque + acceptation.",
        question: "<strong>Quels éléments forensiques permettent d'établir le dol éventuel des coursiers ?</strong>",
        choices: [
          {
            text: "Les scripts suffisent — si le coursier avait le script sur son téléphone, il savait que c'était une fraude.",
            ok: false, pts: -10,
            fb: "Argument trop direct. La défense répondra : 'Mon client a reçu ce fichier sans le lire, il ne savait pas ce qu'il contenait.' Le dol éventuel nécessite de démontrer la <em>conscience</em> du risque + <em>l'acceptation</em>. Les scripts seuls ne suffisent pas — il faut des indices d'utilisation active.",
            legal: "Art. 12 al. 2 CP + ATF 133 IV 9 — Dol éventuel = conscience + acceptation, pas simple possession.",
            critical: false, next: 3,
          },
          {
            text: "Faisceau d'indices : (1) Lecture documentée des scripts (temps de consultation, scroll des fichiers via métadonnées), (2) Communications avec les donneurs d'ordre juste avant chaque collecte, (3) Montants anormalement élevés collectés (10'000-50'000 CHF en cash), (4) Déplacements répétés chez des personnes âgées, (5) Utilisation de téléphones prépayés anonymes — comportement de dissimulation.",
            ok: true, pts: 25,
            fb: "Faisceau d'indices conforme à ATF 133 IV 9. Chaque indice contribue : (1) La consultation des scripts prouve la connaissance du contenu. (2) Les communications juste avant les collectes démontrent l'encadrement actif. (3) Les montants anormaux (aucun légal ne demande 50'000 CHF en cash à une personne âgée) auraient dû alerter. (4) La répétition chez des profils similaires = pattern criminel évident. (5) Le téléphone prépayé = comportement de dissimulation incompatible avec une activité légale.",
            legal: "ATF 133 IV 9 + Art. 12 al. 2 CP — Faisceau d'indices concordants = dol éventuel établi.",
            critical: false, next: 3,
          },
          {
            text: "Le montant en cash suffit — personne de bonne foi ne collecte 50'000 CHF en liquide chez une personne âgée.",
            ok: false, pts: 0,
            fb: "Argument fort mais insuffisant seul. Le montant en cash est un indice important, mais la défense peut inventer une justification (investissement immobilier, aide familiale). Combiné avec les scripts, les communications et le pattern répétitif, il devient convaincant. Seul, il peut laisser un doute.",
            legal: "ATF 133 IV 9 — Un seul indice peut suffire si très fort, mais le faisceau multiple est plus robuste.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🌐 J+7 — La piste française",
        situation: `Les métadonnées et les communications téléphoniques pointent vers deux numéros français qui ont coordonné les 43 coursiers depuis Strasbourg et Lyon. Les coordonnées GPS de plusieurs téléphones correspondent à des déplacements jusqu'aux centres de commandement en France. Vous préparez la demande d'entraide internationale.`,
        law: "<strong>Art. 48a EIMP</strong> — Entraide judiciaire internationale simplifiée avec la France.<br><strong>Convention Franco-Suisse d'entraide</strong> — Accord bilatéral CH-FR (exécution rapide).<br><strong>Convention Budapest Art. 29</strong> — Conservation urgente des données en France.",
        question: "<strong>Quelle est la stratégie optimale pour obtenir rapidement des éléments sur les centres FR ?</strong>",
        choices: [
          {
            text: "Demande formelle MLAT CH-FR via le MPC — voie officielle complète.",
            ok: false, pts: -5,
            fb: "Voie correcte mais lente (6-12 mois pour une demande formelle MLAT). En parallèle, activer Art. 48a EIMP (entraide simplifiée bilatérale CH-FR) pour les mesures urgentes et Art. 29 Convention Budapest pour la conservation des données chez les opérateurs français — avant que les numéros de coordination ne disparaissent.",
            legal: "Art. 48a EIMP + Convention Budapest Art. 29 — Entraide rapide en parallèle de la voie formelle.",
            critical: false, next: "end",
          },
          {
            text: "Triple voie simultanée : (1) Art. 48a EIMP pour l'entraide simplifiée et rapide CH-FR, (2) Convention Budapest Art. 29 pour conservation urgente des données opérateurs français (numéros de coordination), (3) Partage des IoC avec Europol/SIENA pour les structures similaires dans d'autres pays.",
            ok: true, pts: 25,
            fb: "Approche multi-canal optimale. Art. 48a EIMP est plus rapide que la voie MLAT classique (accord bilatéral CH-FR simplifié). La conservation urgente Art. 29 Budapest préserve les données des numéros français avant qu'elles ne soient supprimées (conservation légale limitée). Le partage Europol/SIENA est utile car ces réseaux de vishing opèrent souvent dans plusieurs pays simultanément.",
            legal: "Art. 48a EIMP + Convention Budapest Art. 29 + Europol SIENA — Triple canal pour identification rapide des cerveaux.",
            critical: false, next: "end",
          },
          {
            text: "Contacter directement la police de Strasbourg par email — contact informel plus rapide.",
            ok: false, pts: -20,
            fb: "Contact informel sans valeur juridique. Les preuves obtenues informellement ne sont pas utilisables dans une procédure pénale suisse. La coopération policière opérationnelle (canaux informels) peut servir à vérifier des hypothèses, mais tout élément probatoire doit passer par une voie d'entraide formelle.",
            legal: "Art. 141 CPP — Preuves obtenues par canaux informels non formalisés : risque d'irrecevabilité.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "👮", title: "Expert Vishing DFIR", sub: "Maîtrise parfaite — forensique mobile, dol éventuel, EIMP" };
      if (pct >= 65) return { icon: "📱", title: "Analyste Mobile Forensics", sub: "Bonne maîtrise de la forensique mobile en contexte vishing" };
      if (pct >= 45) return { icon: "🔍", title: "Technicien Mobile", sub: "Approfondissez l'isolation RF et Art. 12 CP dol éventuel" };
      return { icon: "📚", title: "Formation mobile forensics requise", sub: "ISO/IEC 27037 + ACPO mobile + Art. 25-146 CP" };
    },
  },

  /* ── INFOSTEALER — Opération Magnus, Suisse 2024 [MEDIUM · 4 étapes] ──
     Source : Affaire #16 liste originale — fedpol associé à Opération Magnus
     Démantèlement RedLine + META stealers (octobre 2024)
     Accès total aux serveurs C2, listes identifiants suisses volés
     Art. 143 CP, Art. 143bis CP, MROS (LBA Art. 9), Art. 305bis CP,
     forensique malware, analyse C2, notification OFCS
  ─────────────────────────────────────────────────────── */
  {
    id: "infostealer-magnus",
    title: "Opération Magnus — Infostealers RedLine & META",
    icon: "🦠",
    difficulty: "medium",
    atmosphere: "network",
    realCase: "Fedpol + Europol — Opération Magnus, démantèlement RedLine & META, octobre 2024",
    narrative: {
      success: "L'analyse forensique des serveurs C2 extraite les listes d'identifiants suisses. Les victimes sont notifiées via l'OFCS. Le prestataire de service bancaire identifié parmi les identifiants volés déclenche un reset massif. La procédure MPC vise les distributeurs suisses de la MaaS (Malware-as-a-Service).",
      degraded: "Les identifiants suisses sont identifiés mais la notification des victimes est partielle. Les comptes les plus sensibles (e-banking) sont réinitialisés, mais certaines victimes subissent des fraudes avant d'être alertées.",
      failure: "Les données des serveurs C2 ne sont pas exploitées forensiquement avant leur destruction. Les identifiants suisses circulent sur des forums de revente. Les victimes ne sont pas notifiées."
    },
    tags: ["MALWARE", "FORENSIQUE", "RÉSEAUX", "DROIT PÉNAL"],
    legalRefs: ["Art. 143 CP", "Art. 143bis CP", "Art. 305bis CP", "LBA Art. 9", "OFCS GovCERT"],
    intro: "Octobre 2024. Fedpol est associé à l'Opération Magnus coordonnée par Europol — démantèlement de l'infrastructure des infostealers RedLine et META, les malwares les plus répandus en Suisse pour le vol de credentials. Europol fournit à fedpol un 'accès total' aux serveurs de commande et contrôle (C2) démantelés. Les données révèlent des listes massives d'identifiants suisses volés. Votre mission : analyser forensiquement les données C2 et coordonner la réponse.",
    alertLevel: "🦠 SERVEURS C2 DÉMANTELÉS — Listes identifiants suisses exposées · Victimes à notifier d'urgence",
    objectives: [
      { icon: "🔬", text: "Analyser forensiquement les données C2 pour isoler les victimes suisses" },
      { icon: "📣", text: "Coordonner la notification des victimes via l'OFCS/GovCERT" },
      { icon: "⚖️", text: "Qualifier les infractions applicables aux distributeurs suisses de la MaaS" },
      { icon: "🏦", text: "Évaluer les obligations des institutions financières (LBA Art. 9, MROS)" },
    ],
    debrief: `<p>Les <strong>infostealers</strong> (RedLine, META, Raccoon, Vidar) sont des malwares vendus en Malware-as-a-Service (MaaS) sur des forums criminels. Ils collectent automatiquement : mots de passe sauvegardés dans les navigateurs, cookies de session, données de remplissage automatique, wallets crypto, captures d'écran. Un seul serveur C2 peut contenir les données de centaines de milliers de victimes mondiales.</p>
<p>En droit suisse : <strong>Art. 143 CP</strong> (soustraction de données) pour les victimes dont les données ont été collectées, <strong>Art. 143bis CP</strong> (accès indu) pour l'accès aux systèmes via le malware. Les distributeurs suisses du MaaS (acheteurs de licences RedLine/META) engagent leur responsabilité pénale même s'ils n'ont pas développé le malware. La notification des victimes via <strong>OFCS/GovCERT</strong> est le rôle de l'autorité, pas des banques qui ne doivent pas agir seules.</p>`,
    steps: [
      {
        phase: "🔬 L'analyse des données C2",
        situation: `Europol vous transmet un accès aux données extraites des serveurs C2 RedLine et META démantelés. Le volume est considérable :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📊 Volume total : 87 millions d'enregistrements de victimes mondiales<br>
🇨🇭 Filtre «&nbsp;.ch&nbsp;» sur les domaines/e-mails : ~340'000 enregistrements suisses<br>
🏦 Parmi eux : credentials e-banking (UBS, PostFinance, Raiffeisen), wallets crypto, identifiants d'accès VPN d'entreprises<br>
📅 Données collectées entre janvier 2022 et octobre 2024<br>
⚠️ Certains identifiants peuvent avoir été déjà utilisés par les acheteurs de la MaaS
</div>`,
        law: "<strong>Art. 143 CP</strong> — Soustraction de données : les victimes sont les 340'000 personnes dont les données ont été volées.<br><strong>Loi fédérale sur le renseignement en matière pénale (LRENS)</strong> — Traitement des données dans le cadre d'une procédure fédérale.<br><strong>OFCS GovCERT procédures</strong> — Notification des victimes de compromissions massives.",
        question: "<strong>Comment prioriser l'analyse des 340'000 enregistrements suisses ?</strong>",
        choices: [
          {
            text: "Analyser tous les 340'000 enregistrements exhaustivement avant toute notification — prendre 3-4 semaines pour un travail complet.",
            ok: false, pts: -15,
            fb: "Trop lent. Les credentials e-banking parmi les 340'000 sont exploitables maintenant par les acheteurs de la MaaS. Chaque jour de délai signifie potentiellement des fraudes bancaires contre des victimes suisses. Prioriser par criticité : e-banking et VPN d'entreprise en premier.",
            legal: "Principe de proportionnalité + urgence — Les données financières nécessitent une réponse sous 72h.",
            critical: false, next: 1,
          },
          {
            text: "Triage en 3 niveaux de criticité : (1) Urgence absolue — credentials e-banking et authentifiants VPN entreprises (notification banques sous 24h), (2) Haute priorité — wallets crypto et accès messagerie (notification OFCS 48h), (3) Standard — autres identifiants .ch (notification progressive via Have I Been Pwned CH ou OFCS).",
            ok: true, pts: 25,
            fb: "Triage correct et actionnable. Les credentials e-banking exposent directement à des fraudes financières immédiates — les banques doivent être informées sous 24h pour forcer un reset des comptes concernés. Les VPN d'entreprise peuvent permettre des intrusions en cours. Le triage permet de concentrer les efforts là où le risque est le plus immédiat.",
            legal: "OFCS GovCERT procédures + LBA Art. 9 — Triage par risque financier immédiat.",
            critical: false, next: 1,
          },
          {
            text: "Transmettre directement les 340'000 enregistrements aux banques suisses pour qu'elles identifient leurs propres clients.",
            ok: false, pts: -20,
            fb: "Violation de la protection des données. Transmettre 340'000 enregistrements à des entités privées (banques) sans base légale et sans anonymisation est une violation de la LPD 2023. L'OFCS/GovCERT est l'intermédiaire approprié pour les notifications — il contacte les banques via des canaux formels avec uniquement les données pertinentes.",
            legal: "LPD 2023 Art. 6 — Toute communication de données personnelles nécessite une base légale. OFCS = voie officielle.",
            critical: true, next: "end",
          },
        ],
      },
      {
        phase: "📣 La notification des victimes",
        situation: `L'OFCS/GovCERT prépare la notification des victimes suisses. Une décision s'impose : notifier individuellement chaque victime (340'000 personnes) ou passer par les banques pour les credentials e-banking ?`,
        law: "<strong>LPD 2023 Art. 24 al. 3</strong> — Information directe des personnes concernées si risque élevé.<br><strong>OFCS procédures</strong> — Notification de masse via Have I Been Pwned et partenaires.<br><strong>LBA Art. 9</strong> — Obligation de signalement MROS pour les banques identifiant des transactions suspectes liées à des credentials volés.",
        question: "<strong>Comment notifier efficacement les victimes dont les credentials e-banking sont dans les listes ?</strong>",
        choices: [
          {
            text: "Publier un communiqué de presse général conseillant à tout le monde de changer ses mots de passe — plus simple.",
            ok: false, pts: -15,
            fb: "Inefficace. Un communiqué général ne cible pas les 340'000 victimes concernées. La plupart ne le liront pas ou ne sauront pas si elles sont concernées. Pour les credentials e-banking, une réinitialisation forcée par les banques est bien plus efficace qu'une recommandation générale.",
            legal: "LPD 2023 Art. 24 al. 3 — Information directe si risque élevé : un communiqué général ne suffit pas.",
            critical: false, next: 2,
          },
          {
            text: "Double voie : (1) OFCS notifie les banques concernées avec les hashes des identifiants (pas les credentials en clair) → les banques forcent un reset des comptes affectés, (2) OFCS intègre les domaines suisses dans Have I Been Pwned et le portail de vérification OFCS → notification directe via e-mail ou SMS si adresse connue.",
            ok: true, pts: 25,
            fb: "Approche optimale et conforme à la pratique GovCERT. La notification aux banques via hashes (pas en clair) respecte la minimisation des données LPD 2023 tout en permettant l'identification des comptes concernés. Have I Been Pwned et le portail OFCS permettent aux individus de vérifier eux-mêmes. Cette double voie maximise la portée tout en respectant la protection des données.",
            legal: "OFCS procédures + LPD 2023 Art. 24 al. 3 + LBA Art. 9 — Notification structurée, minimisation des données.",
            critical: false, next: 2,
          },
          {
            text: "Envoyer un e-mail individuel à chacune des 340'000 victimes avec leur liste de credentials compromis.",
            ok: false, pts: -20,
            fb: "Double problème. (1) Envoyer les credentials en clair par e-mail crée un nouveau risque de sécurité — les e-mails peuvent être interceptés. (2) Envoyer 340'000 e-mails révèle à chaque personne l'étendue des données collectées sur elle, risque de panique disproportionnée et de phishing exploitant la situation.",
            legal: "LPD 2023 Art. 5 (sécurité des données) — Transmettre des credentials par e-mail non chiffré = violation de sécurité.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "⚖️ Les distributeurs suisses de la MaaS",
        situation: `L'analyse des données C2 révèle des logs d'acheteurs du service RedLine/META. Parmi eux : 3 adresses IP suisses ayant payé des licences MaaS et reçu des lots de credentials suisses. Ces acheteurs n'ont pas développé le malware mais l'ont utilisé activement pour collecter des données.`,
        law: "<strong>Art. 143 CP</strong> — Soustraction de données : dessein d'enrichissement illégitime requis.<br><strong>Art. 143bis CP</strong> — Accès indu aux systèmes des victimes via le malware.<br><strong>Art. 24 CP</strong> — Instigation : l'acheteur MaaS instige l'infraction via le développeur.<br><strong>Art. 144bis CP</strong> — Détérioration de données : installation d'un malware = détérioration.",
        question: "<strong>Quelles infractions qualifier contre les acheteurs suisses de la licence RedLine/META ?</strong>",
        choices: [
          {
            text: "Seul le développeur est responsable — les acheteurs utilisent juste un outil disponible sur internet.",
            ok: false, pts: -25,
            fb: "Raisonnement erroné. En droit suisse, l'utilisation intentionnelle d'un outil illicite engage la responsabilité pénale de l'utilisateur. L'acheteur MaaS (1) accède à des systèmes tiers via le malware (Art. 143bis CP), (2) soustrait les données collectées (Art. 143 CP), (3) peut être complice ou instigateur selon son rôle dans la chaîne (Art. 24/25 CP). L'ignorance de la nature illicite est difficile à plaider pour quelqu'un qui paie pour un 'infostealer' sur un forum criminel.",
            legal: "Art. 143 + 143bis CP — Responsabilité de l'utilisateur d'un malware, pas seulement du développeur.",
            critical: true, next: "end",
          },
          {
            text: "Art. 143bis CP (accès indu aux systèmes des victimes via malware) + Art. 143 CP (soustraction des credentials — dessein d'enrichissement illégitime via revente ou utilisation frauduleuse) + Art. 144bis CP (installation du malware = détérioration du système des victimes) en concours réel.",
            ok: true, pts: 25,
            fb: "Qualification solide. Art. 143bis CP : le malware accède aux navigateurs des victimes sans leur consentement. Art. 143 CP : les credentials collectés sont des données auxquelles les acheteurs n'ont pas droit, avec dessein d'enrichissement (revente ou utilisation frauduleuse). Art. 144bis CP : l'installation d'un malware est assimilée à une 'détérioration de données' (modification du système). Concours réel Art. 9 CP.",
            legal: "Art. 143 + 143bis + 144bis CP en concours réel — Qualification pour acheteurs MaaS actifs.",
            critical: false, next: 3,
          },
          {
            text: "Art. 144bis CP uniquement (détérioration de données) — c'est l'infraction informatique la plus directe.",
            ok: false, pts: -10,
            fb: "Incomplète. Art. 144bis CP qualifie l'installation du malware mais pas la collecte ni l'exploitation des données. Art. 143 CP (soustraction) et Art. 143bis CP (accès indu) sont nécessaires pour qualifier l'ensemble du comportement — accès, collecte, et exploitation.",
            legal: "Art. 9 CP — Concours réel : chaque infraction distincte doit être qualifiée séparément.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🏦 Les banques et le MROS",
        situation: `Parmi les 340'000 enregistrements suisses, certaines banques suisses identifient que des credentials de leurs clients ont été compromis ET que des transactions suspectes ont eu lieu dans les semaines suivantes. Le responsable compliance d'une banque romande vous demande : ses obligations MROS (signalement de blanchiment) s'appliquent-elles ?`,
        law: "<strong>LBA Art. 9</strong> — Obligation de communication au MROS si soupçon fondé de blanchiment.<br><strong>Art. 305bis CP</strong> — Blanchiment d'argent : valeurs patrimoniales d'origine criminelle.<br><strong>FINMA Circulaire 2017/1</strong> — Gestion des risques liés à la criminalité informatique.",
        question: "<strong>La banque a-t-elle une obligation de signalement MROS si elle identifie des transactions suspectes liées aux credentials volés ?</strong>",
        choices: [
          {
            text: "Non — le vol de credentials est une infraction informatique, pas du blanchiment. La banque n'a pas à signaler au MROS.",
            ok: false, pts: -20,
            fb: "Raisonnement incomplet. Si des fonds ont été transférés frauduleusement DEPUIS les comptes des victimes à l'aide des credentials volés, ces fonds sont d'origine criminelle (la fraude est le crime préalable). Leur transfert constitue du blanchiment (Art. 305bis CP). La banque qui identifie ce lien a une obligation de signalement MROS (LBA Art. 9).",
            legal: "LBA Art. 9 + Art. 305bis CP — Transactions liées à des credentials volés → soupçon de blanchiment → MROS obligatoire.",
            critical: false, next: "end",
          },
          {
            text: "Oui, si la banque identifie des transactions inhabituelles sur des comptes dont les credentials sont dans les listes C2 — c'est un soupçon fondé de blanchiment (argent d'origine criminelle — fraude via credentials volés). Obligation de signalement MROS sans délai.",
            ok: true, pts: 25,
            fb: "Qualification exacte. Transactions suspectes sur compte compromis = soupçon fondé que les valeurs patrimoniales transférées ont une origine criminelle (fraude via credentials volés = crime préalable à Art. 305bis CP). LBA Art. 9 impose le signalement MROS dès ce soupçon fondé. La banque doit également bloquer les transactions (LBA Art. 10 — obligation de blocage en cas de soupçon).",
            legal: "LBA Art. 9 + Art. 10 + Art. 305bis CP — Soupçon de blanchiment lié à des credentials volés → MROS + blocage.",
            critical: false, next: "end",
          },
          {
            text: "Peut-être — attendre que les clients portent plainte avant d'agir.",
            ok: false, pts: -10,
            fb: "Passivité inacceptable. LBA Art. 9 oblige la banque à signaler proactivement — pas à attendre une plainte du client. La banque dispose des éléments nécessaires (transactions inhabituelles + correspondance avec les listes de credentials compromis). Attendre que le client réalise la fraude et porte plainte contrevient à l'obligation de diligence LBA.",
            legal: "LBA Art. 9 — Signalement proactif, pas réactif. La banque est acteur de la lutte anti-blanchiment.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "🦠", title: "Expert Infostealer CH", sub: "Maîtrise parfaite — forensique C2, notification OFCS, LBA Art. 9" };
      if (pct >= 65) return { icon: "🔍", title: "Analyste Malware", sub: "Bonne maîtrise de l'Opération Magnus et des infostealers" };
      if (pct >= 45) return { icon: "🛡️", title: "Analyste Sécurité", sub: "Approfondissez Art. 143 CP et les obligations LBA/MROS" };
      return { icon: "📚", title: "Formation malware requise", sub: "Art. 143+143bis CP + LBA Art. 9 + GovCERT procédures" };
    },
  },
  /* ══════════════════════════════════════════════════════════
     PROTECTION DES MINEURS EN LIGNE — SCÉNARIOS INVESTIGATION
     Note pédagogique : Ces scénarios traitent exclusivement de
     la PROCÉDURE D'INVESTIGATION et du CADRE LÉGAL suisse.
     Ils forment les enquêteurs DFIR à leurs obligations légales,
     aux procédures correctes et à la protection des victimes.
     Aucune description de contenu illicite n'est présente.
  ══════════════════════════════════════════════════════════ */

  /* ── NCMEC-VAUD — Circuit CyberTip → Perquisition [MEDIUM · 4 étapes] ──
     Sources :
     - Police cantonale vaudoise, opération décembre 2022 :
       96 interpellations, 42 perquisitions, 311 supports saisis,
       153 jours-agents, signalements NCMEC via fedpol
     - RC3 (police genevoise) : monitoring réseaux P2P
     - Blick/Le Nouvelliste (Valais 2025) : 80 CyberTips/an,
       profil numérique comme indicateur de passage à l'acte
     - Police cantonale de Fribourg : procédures grooming
     Art. 197 CP (al. 4 et 5), Art. 187 CP, Art. 263 CPP,
     Art. 248 CPP, NCMEC CyberTipline → fedpol → cantons
  ─────────────────────────────────────────────────────── */
  {
    id: "ncmec-cypertip",
    title: "CyberTip NCMEC — Du Signalement à la Perquisition",
    icon: "🛡️",
    difficulty: "medium",
    atmosphere: "legal",
    realCase: "Police cantonale vaudoise, décembre 2022 — 96 interpellations, 311 supports saisis",
    narrative: {
      success: "La procédure est irréprochable : chaîne NCMEC → fedpol → canton respectée, ordonnance MP obtenue, perquisition forensique conforme aux standards. Le profil numérique permet une qualification précise. Les preuves sont recevables. Le MP peut mettre en accusation.",
      degraded: "La saisie est effectuée mais la qualification est insuffisante. La défense conteste la chaîne probatoire NCMEC. Le dossier tient mais la peine est réduite.",
      failure: "La procédure non conforme vicie les preuves. Art. 141 al. 2 CPP — exclusion. Le suspect est libéré. La victime potentielle n'est pas identifiée ni protégée."
    },
    tags: ["PÉDOCRIMINALITÉ", "FORENSIQUE", "DROIT PÉNAL", "NCMEC"],
    legalRefs: ["Art. 197 CP", "Art. 187 CP", "Art. 263 CPP", "Art. 286 CPP", "Art. 141 CPP"],
    intro: "Un CyberTip arrive de fedpol : le National Center for Missing and Exploited Children (NCMEC) a signalé qu'un utilisateur domicilié dans le canton de Vaud a téléchargé depuis une plateforme américaine du contenu à caractère pédopornographique. fedpol a effectué les premières vérifications et transmet le dossier à la police cantonale vaudoise pour suite. Vous êtes l'enquêteur de la cellule cyberpédophilie de la brigade criminelle. Votre objectif : procéder correctement, protéger les éventuelles victimes, et construire un dossier admissible.",
    alertLevel: "🛡️ CYBERTIP NCMEC — Enfants potentiellement en danger · Procédure stricte obligatoire",
    objectives: [
      { icon: "📋", text: "Comprendre le circuit NCMEC → fedpol → canton et ses implications légales" },
      { icon: "⚖️", text: "Maîtriser la qualification Art. 197 CP (al. 4 consommation vs al. 5 possession vs aggravantes)" },
      { icon: "🔬", text: "Conduire la perquisition et la saisie forensique selon les standards ACPO" },
      { icon: "🛡️", text: "Prioriser la protection des victimes potentielles dès les premières heures" },
    ],
    debrief: `<p>La lutte contre la pédocriminalité en ligne repose en Suisse sur un circuit bien établi : le <strong>NCMEC</strong> (National Center for Missing and Exploited Children, basé aux USA) reçoit les signalements des plateformes numériques américaines, les transmet à <strong>fedpol</strong> qui les analyse et les adresse au canton de domicile du suspect. En parallèle, le <strong>RC3</strong> (Réseau de Compétences Cybercriminalité, police genevoise) monitore les réseaux P2P pour identifier les échanges illicites en Romandie.</p>
<p>Cadre légal clé — <strong>Art. 197 CP</strong> : al. 4 (production/diffusion/acquisition de représentations sexuelles impliquant des mineurs = peine privative jusqu'à 5 ans), al. 5 (simple possession/consommation sans transmission = jusqu'à 1 an ou peine pécuniaire). La qualification dépend du rôle exact : a-t-il uniquement consommé, ou aussi partagé (réseau P2P = partage automatique) ? Le volume et la nature des fichiers peuvent constituer une circonstance aggravante. La présence d'enfants dans l'entourage immédiat du suspect est un facteur déterminant pour l'évaluation du risque.</p>`,
    steps: [
      {
        phase: "📋 Le CyberTip transmis par fedpol",
        situation: `Vous recevez le CyberTip de fedpol. Il contient :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📡 Source : NCMEC CyberTipline n° CH-2024-XXXXX<br>
🌐 Plateforme signalante : fournisseur d'accès américain<br>
🗓️ Date du signalement : 3 semaines avant réception<br>
📍 Adresse IP : identifiée, abonné localisé à Lausanne — vérifiée par fedpol via Swisscom<br>
📁 Éléments transmis : hash des fichiers signalés (format PhotoDNA), horodatages des échanges<br>
👤 Informations abonné : homme, 34 ans, employé dans une école primaire, père de deux enfants mineurs
</div>`,
        law: "<strong>Art. 197 al. 4 CP</strong> — Représentations sexuelles impliquant des mineurs : peine privative jusqu'à 5 ans.<br><strong>Art. 197 al. 5 CP</strong> — Simple consommation/possession sans diffusion : jusqu'à 1 an.<br><strong>NCMEC CyberTipline</strong> — Canal officiel de signalement, transmis via fedpol aux cantons concernés.",
        question: "<strong>Vous avez le CyberTip. La profession et la situation familiale du suspect sont connues. Quelle est votre priorité immédiate avant toute démarche judiciaire ?</strong>",
        choices: [
          {
            text: "Procéder immédiatement à l'arrestation du suspect pour l'empêcher d'accéder aux enfants.",
            ok: false, pts: -15,
            fb: "Trop hâtif et procéduralement incorrect. Une arrestation nécessite un mandat ou une flagrance. Un CyberTip n'est pas en soi une preuve suffisante pour une arrestation — il indique un soupçon à vérifier. De plus, une arrestation prématurée sans dossier solide fragilise la procédure et peut permettre au suspect de bénéficier d'un acquittement rapide.",
            legal: "Art. 217 CPP — Arrestation provisoire : flagrant délit ou danger imminent. CyberTip seul = pas de flagrance.",
            critical: false, next: 1,
          },
          {
            text: "Évaluer immédiatement le risque pour les enfants dans l'entourage (enfants propres, élèves) en coordination avec le Service de protection de la jeunesse, PUIS obtenir l'ordonnance MP pour la perquisition — les deux démarches en parallèle.",
            ok: true, pts: 25,
            fb: "Approche correcte et conforme aux meilleures pratiques suisses. La profession (enseignant école primaire) et la présence d'enfants mineurs dans la famille imposent une évaluation du risque immédiate et confidentielle. Le Service de protection de la jeunesse (SPJ) est l'interlocuteur approprié pour cette évaluation — pas la police seule. La demande d'ordonnance MP se fait en parallèle, pas après.",
            legal: "Art. 197 CP + Pratique cellule cyberpédophilie vaudoise — Évaluation du risque pour les mineurs = priorité simultanée à la procédure pénale.",
            critical: false, next: 1,
          },
          {
            text: "Demander l'ordonnance MP et attendre la perquisition avant de faire quoi que ce soit — ne pas contacter le SPJ qui pourrait alerter le suspect.",
            ok: false, pts: -10,
            fb: "Risque d'exposition des mineurs. Si le suspect a accès à des enfants maintenant (ses propres enfants, ses élèves), différer l'évaluation du risque peut laisser des victimes potentielles exposées. La confidentialité peut être préservée lors de l'évaluation SPJ sans alerter le suspect — c'est précisément le rôle des professionnels de la protection de l'enfance.",
            legal: "Art. 307 CC + Pratique SPJ — Protection des mineurs : obligation des autorités de signalement même sans certitude.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "🔬 La perquisition et la saisie",
        situation: `Le MP ordonne la perquisition. Elle a lieu à 06h00 au domicile du suspect. Présents : vous, deux collègues, un représentant du MP. Le suspect est réveillé, coopératif mais silencieux (Art. 113 CPP). Sur le bureau, un laptop ouvert en veille. Dans la chambre, un smartphone et une tablette.`,
        law: "<strong>Art. 241 CPP</strong> — Ordonnance de perquisition écrite.<br><strong>Art. 246 CPP</strong> — Perquisition de supports de données.<br><strong>ACPO Principles</strong> — Saisie sans modification des données originales.<br><strong>Art. 248 CPP</strong> — Droit de mise sous scellés du suspect.",
        question: "<strong>Le laptop est en veille (écran noir, ventilateur actif). Quelle est votre première action forensique ?</strong>",
        choices: [
          {
            text: "Fermer le laptop et le saisir éteint sous scellés — plus simple à transporter.",
            ok: false, pts: -20,
            fb: "Erreur critique. Fermer un laptop en veille peut déclencher la mise en hibernation ou BitLocker si Windows est configuré ainsi. La RAM — qui peut contenir des clés de déchiffrement, des sessions actives, des preuves volatiles — est effacée. Priorité absolue : capture RAM avant toute fermeture.",
            legal: "Manuel DFIR Ch. 11.1 + ISO/IEC 27037 — Laptop allumé/en veille = live forensics en priorité. RAM volatile.",
            critical: true, next: "end",
          },
          {
            text: "Brancher une clé USB avec WinPmem et capturer la RAM (dump mémoire complet), puis photographier l'écran, puis saisir le laptop en état.",
            ok: true, pts: 25,
            fb: "Procédure correcte. La RAM peut contenir des sessions actives, des clés de déchiffrement, des historiques de navigation non flushés. La capture RAM avant toute action est la priorité. La photo de l'écran documente l'état initial. Le laptop est ensuite saisi en état (ne pas éteindre si possible — préserver l'état de veille avec isolation de l'alimentation si nécessaire).",
            legal: "ACPO Principle 2 + Manuel DFIR Ch. 11.1 — RAM first, documentation, saisie en état.",
            critical: false, next: 2,
          },
          {
            text: "Demander au suspect son mot de passe pour déverrouiller l'appareil directement.",
            ok: false, pts: -15,
            fb: "Violation du droit au silence. Art. 113 CPP : le suspect n'est pas obligé de fournir ses codes d'accès. Une demande insistante peut être qualifiée de contrainte. La forensique doit procéder par des moyens techniques légaux, pas par coercition.",
            legal: "Art. 113 CPP — Droit au silence inclut les codes d'accès. Procédure forensique par moyens techniques.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "⚖️ La qualification — Art. 197 CP",
        situation: `L'analyse forensique du laptop révèle plusieurs types de fichiers. Vous devez qualifier précisément les infractions pour l'acte d'accusation.<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📂 <strong>Catégorie A</strong> : Fichiers téléchargés via réseau P2P — présents dans un dossier partagé (automatiquement mis à disposition des autres utilisateurs du réseau)<br>
📂 <strong>Catégorie B</strong> : Fichiers stockés hors dossier partagé — usage personnel uniquement, pas de mise à disposition<br>
📂 <strong>Catégorie C</strong> : Un seul fichier montrant une victime potentiellement identifiable et localisable<br>
💬 <strong>Catégorie D</strong> : Conversations dans une application de messagerie chiffrée avec un mineur — contenu textuel à caractère sexuel (grooming)
</div>`,
        law: "<strong>Art. 197 al. 4 CP</strong> — Production, importation, stockage, mise à disposition, diffusion = peine privative jusqu'à 5 ans.<br><strong>Art. 197 al. 5 CP</strong> — Consommation/possession sans mise à disposition = jusqu'à 1 an.<br><strong>Art. 187 al. 1 CP</strong> — Actes d'ordre sexuel avec des enfants (peut couvrir le grooming textuel selon ATF 133 IV 31).",
        question: "<strong>Comment qualifiez-vous correctement les infractions par catégorie ?</strong>",
        choices: [
          {
            text: "Art. 197 al. 5 CP pour tout — il n'a pas produit le contenu, seulement consommé.",
            ok: false, pts: -20,
            fb: "Qualification erronée pour les Catégories A, C et D. Art. 197 al. 5 CP (simple consommation) ne couvre que la possession sans diffusion. Catégorie A : le dossier partagé P2P = mise à disposition automatique = Art. 197 al. 4 CP (diffusion). Catégorie C : l'identification d'une victime réelle ouvre la procédure de protection immédiate. Catégorie D : le grooming textuel peut relever de Art. 187 CP selon le contenu.",
            legal: "ATF 133 IV 31 + Art. 197 CP — Distinction al. 4 (diffusion/mise à disposition) vs al. 5 (possession seule).",
            critical: false, next: 3,
          },
          {
            text: "Art. 197 al. 4 CP pour A (mise à disposition P2P = diffusion) + Art. 197 al. 5 CP pour B (possession sans diffusion) + Art. 197 al. 4 CP pour C (acquisition/possession de matériel avec victime identifiable) + Art. 187 al. 1 CP potentiel pour D (grooming) — qualification distincte par catégorie.",
            ok: true, pts: 25,
            fb: "Qualification précise et correcte. La distinction clé pour la Catégorie A : dans un réseau P2P, le dossier partagé met automatiquement les fichiers à disposition d'autres utilisateurs — c'est une diffusion au sens de Art. 197 al. 4 CP (même si l'utilisateur ne l'a pas fait consciemment, le fait qu'il ait accepté les termes du logiciel P2P suffit selon la jurisprudence). La Catégorie C déclenche en plus une procédure d'identification de la victime via CyberTip inverse (fedpol → NCMEC → USA).",
            legal: "Art. 197 al. 4 + al. 5 CP + Art. 187 CP — Qualification par catégorie conforme à la pratique du MP vaudois.",
            critical: false, next: 3,
          },
          {
            text: "Tout sous Art. 197 al. 4 CP — c'est plus simple et couvre tout le spectre.",
            ok: false, pts: -10,
            fb: "Sur-qualification pour la Catégorie B. La défense contestera l'Art. 197 al. 4 CP pour des fichiers clairement hors dossier partagé et sans preuve de mise à disposition. Une qualification excessive fragilise l'ensemble du dossier. La précision protège la procédure.",
            legal: "Principe de précision pénale — Ne qualifier que ce qui est caractérisé par les faits.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🛡️ La victime potentielle — Catégorie C",
        situation: `L'expert en analyse d'images de l'unité spécialisée (formé aux techniques ICSE — International Child Sexual Exploitation database d'Interpol) a identifié dans la Catégorie C un fichier correspondant potentiellement à une victime non encore référencée dans les bases de données internationales — ce qui suggère un abus en cours ou récent non encore signalé.`,
        law: "<strong>Base ICSE (Interpol)</strong> — Base internationale de comparaison d'images, permet d'identifier les victimes.<br><strong>Art. 307 CC</strong> — Protection de l'enfant en danger : obligation d'intervention immédiate.<br><strong>Convention de Lanzarote (2007)</strong> — Ratifiée par la Suisse : obligation de protection et d'investigation des victimes.",
        question: "<strong>Le fichier suggère une victime non encore identifiée. Quelle est votre action prioritaire ?</strong>",
        choices: [
          {
            text: "Terminer d'abord l'analyse complète du disque avant de transmettre — avoir un dossier complet pour Interpol.",
            ok: false, pts: -20,
            fb: "Priorité inversée. Si un enfant est victime d'abus en cours ou récent, chaque jour compte. L'identification de la victime est une urgence humanitaire indépendante de la procédure pénale contre le suspect. Transmettre immédiatement le hash via le canal ICSE d'Interpol — l'analyse du disque continue en parallèle.",
            legal: "Convention de Lanzarote Art. 12 + Art. 307 CC — Protection immédiate des victimes : obligation légale.",
            critical: false, next: "end",
          },
          {
            text: "Transmettre immédiatement le hash du fichier via le canal ICSE Interpol (fedpol comme point de contact national) pour comparaison et identification de la victime — en parallèle de l'analyse continue du disque.",
            ok: true, pts: 25,
            fb: "Procédure correcte et conforme aux obligations suisses découlant de la Convention de Lanzarote. fedpol est le point de contact national pour la base ICSE d'Interpol. Une correspondance positive permet d'identifier la victime et, si l'abus est en cours, d'intervenir pour la protéger — quelle que soit l'avancement de la procédure pénale contre le suspect. Protection de la victime et procédure pénale sont deux obligations parallèles, pas séquentielles.",
            legal: "Convention de Lanzarote + Base ICSE Interpol via fedpol — Protection de la victime : obligation immédiate et parallèle à la procédure.",
            critical: false, next: "end",
          },
          {
            text: "Ne rien faire avec ce fichier spécifique pour l'instant — il n'est pas au cœur de la procédure pénale contre le suspect.",
            ok: false, pts: -30,
            fb: "Violation grave des obligations légales. Art. 307 CC et la Convention de Lanzarote imposent la protection immédiate des enfants en danger. Ne pas signaler un fichier suggérant une victime potentiellement en danger actuel constitue une faute professionnelle grave et potentiellement une infraction pénale (omission de porter secours selon les circonstances).",
            legal: "Art. 307 CC + Convention de Lanzarote — Omission de protection d'un enfant en danger = obligation légale violée.",
            critical: true, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "🛡️", title: "Expert Protection Enfants Cyber", sub: "Maîtrise parfaite — NCMEC, Art. 197 CP, protection simultanée des victimes" };
      if (pct >= 65) return { icon: "🔍", title: "Enquêteur Cyberpédocriminalité", sub: "Bonne maîtrise du circuit NCMEC et des procédures de protection" };
      if (pct >= 45) return { icon: "📋", title: "Analyste DFIR Spécialisé", sub: "Approfondissez Art. 197 CP et Convention de Lanzarote" };
      return { icon: "📚", title: "Formation protection enfants requise", sub: "Art. 197 CP + NCMEC circuit + Convention de Lanzarote" };
    },
  },

  /* ── OPÉRATION ALICE — Enquête couverte darknet [HARD · 5 étapes] ──
     Sources :
     - Opération Alice contre «Alice with Violence» (mars 2026),
       fedpol + polices cantonales Lucerne, St-Gall, Thurgovie, Zurich,
       coordonnée par Europol, 23 pays, 5 CH détenus
     - KidFlix (avril 2025) : 10 arrestations CH, 7 cantons, 1.8M users
     - Police IFC St-Gall : infiltration forums darknet, Art. 286 CPP
     - Police valaisanne : 80 CyberTips/an, profil numérique
     Art. 286 CPP (enquête couverte — règles très strictes en Suisse),
     Art. 197 CP, Art. 340 al. 1bis CPP (compétence fédérale),
     protection psychologique des enquêteurs, Europol coordination
  ─────────────────────────────────────────────────────── */
  {
    id: "operation-alice",
    title: "Opération Alice — Enquête Couverte Darknet",
    icon: "🔐",
    difficulty: "hard",
    atmosphere: "legal",
    realCase: "Opération Alice (mars 2026) — fedpol + Europol, 23 États, 5 arrestations CH",
    narrative: {
      success: "L'enquête couverte est menée selon les règles strictes de l'Art. 286 CPP. Les preuves récoltées sont recevables. La coordination Europol permet l'identification du cerveau présumé en Chine. Les 5 suspects suisses sont mis en accusation. Les victimes potentiellement identifiables sont transmises via ICSE Interpol.",
      degraded: "L'enquête couverte est partiellement valide. Certaines preuves sont contestées par la défense. La coordination internationale retarde les poursuites. Deux suspects bénéficient d'un non-lieu faute de preuves admissibles.",
      failure: "L'enquête couverte non autorisée selon Art. 286 CPP vicie toutes les preuves. Art. 141 al. 2 CPP — exclusion totale. Les 5 suspects sont libérés. L'opération internationale est compromise côté suisse."
    },
    tags: ["PÉDOCRIMINALITÉ", "ENQUÊTE COUVERTE", "DARKNET", "DROIT PÉNAL"],
    legalRefs: ["Art. 286 CPP", "Art. 197 CP", "Art. 340 CPP", "Art. 141 CPP", "Convention Lanzarote"],
    intro: "Europol coordonne l'Opération Alice — démantèlement d'une plateforme de pédocriminalité sur le darknet, active dans 23 pays. fedpol mandate une équipe d'enquêteurs suisses pour participer à la phase d'infiltration numérique de la plateforme. Des suspects suisses ont été identifiés parmi les utilisateurs. Vous dirigez l'équipe suisse. Votre défi : l'enquête couverte en ligne est soumise en Suisse à des règles procédurales très strictes (Art. 286 CPP) — bien plus strictes que dans certains pays partenaires.",
    alertLevel: "🔐 OPÉRATION ALICE — Europol coordonne · Règles Art. 286 CPP très strictes · 5 suspects CH identifiés",
    objectives: [
      { icon: "⚖️", text: "Maîtriser les conditions légales de l'enquête couverte suisse (Art. 286 CPP) vs pratiques étrangères" },
      { icon: "🌐", text: "Coordonner avec Europol sans violer le droit procédural suisse" },
      { icon: "🔬", text: "Utiliser les preuves Europol dans le dossier pénal suisse (admissibilité)" },
      { icon: "🛡️", text: "Protéger les enquêteurs exposés à du contenu traumatisant (obligations de l'employeur)" },
    ],
    debrief: `<p>L'<strong>enquête couverte en ligne</strong> (Art. 286 CPP) est soumise en Suisse à des conditions strictes, plus contraignantes que dans de nombreux pays partenaires : elle nécessite une ordonnance du MP et l'autorisation du Tribunal des mesures de contrainte (TMC), doit être proportionnée, ne peut pas provoquer l'infraction (interdiction de l'agent provocateur — Art. 293 CPP), et doit être utilisée comme mesure de dernier recours.</p>
<p>Enjeu particulier dans les opérations Europol : les preuves récoltées par des enquêteurs étrangers (ex. allemands ou américains) dans le cadre de leurs propres législations doivent être intégrées dans le dossier pénal suisse via des mécanismes d'entraide (EIMP). La recevabilité dépend de la conformité avec les standards minimaux suisses (Art. 141 CPP). Enfin, l'exposition répétée à du contenu traumatisant crée des obligations légales pour l'employeur (protection de la santé au travail — Art. 6 LTr).</p>`,
    steps: [
      {
        phase: "⚖️ L'autorisation d'enquête couverte — Art. 286 CPP",
        situation: `Europol souhaite que l'équipe suisse crée des profils d'infiltration sur la plateforme darknet pour documenter l'activité des 5 suspects suisses. Les autorités allemandes le font déjà sans autorisation préalable de juge. fedpol vous presse d'agir rapidement pour ne pas retarder l'opération.`,
        law: "<strong>Art. 286 CPP</strong> — Enquête couverte : ordonnance MP + autorisation TMC obligatoires.<br><strong>Art. 293 CPP</strong> — Interdiction de l'agent provocateur : l'enquêteur ne peut pas inciter à commettre une infraction.<br><strong>Art. 141 CPP</strong> — Preuves obtenues sans autorisation : en principe inexploitables.",
        question: "<strong>Les Allemands infiltrent sans juge. fedpol vous presse. Que faites-vous ?</strong>",
        choices: [
          {
            text: "Commencer l'infiltration immédiatement — l'urgence de l'opération internationale justifie d'agir d'abord et de régulariser ensuite.",
            ok: false, pts: -25,
            fb: "Erreur procédurale grave. Art. 286 CPP est clair : l'enquête couverte requiert ordonnance MP + autorisation TMC AVANT de commencer. Il n'y a pas de possibilité de régularisation a posteriori. Toutes les preuves obtenues sans cette autorisation seront exclues (Art. 141 al. 2 CPP) — ce qui compromet l'ensemble du volet suisse de l'opération.",
            legal: "Art. 286 al. 1 CPP — Autorisation préalable du TMC obligatoire, sans exception d'urgence pour les enquêtes couvertes.",
            critical: true, next: "end",
          },
          {
            text: "Demander en urgence l'ordonnance MP et l'autorisation TMC (procédure accélérée — 24-48h en urgence), en expliquant à Europol le cadre légal suisse. Si refus TMC ou délai trop long, proposer d'utiliser les preuves collectées par les partenaires étrangers via EIMP.",
            ok: true, pts: 25,
            fb: "Position correcte et diplomatiquement solide. Le TMC peut statuer en urgence (24-48h). Expliquer le cadre suisse à Europol est non seulement légalement nécessaire mais démontre la rigueur de la procédure suisse — ce qui protège la recevabilité des preuves devant les tribunaux suisses. L'alternative via EIMP (preuves étrangères) est un backup valide si le TMC refuse ou si les délais ne permettent pas la participation directe.",
            legal: "Art. 286 CPP + Art. 274 CPP (procédure accélérée) + EIMP — Voie légale respectée, opération internationale préservée.",
            critical: false, next: 1,
          },
          {
            text: "Refuser toute participation — l'opération est trop risquée procéduralement pour la Suisse.",
            ok: false, pts: -10,
            fb: "Trop passif. La Suisse peut participer via l'EIMP en utilisant les preuves des partenaires, ou obtenir rapidement l'autorisation TMC. Un refus total prive l'opération de la coordination suisse et ne protège pas les 5 suspects suisses identifiés — qui pourraient être alertés si les opérations étrangères procèdent sans coordination.",
            legal: "Art. 48a EIMP + Art. 286 CPP — Alternatives légales disponibles.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "🚫 L'interdiction de l'agent provocateur",
        situation: `Le TMC autorise l'enquête couverte. Votre enquêteur infiltré a établi un contact avec un suspect suisse sur la plateforme. Ce suspect lui demande de lui procurer du contenu illicite spécifique qu'il ne trouve pas sur la plateforme. L'enquêteur vous contacte : peut-il simuler de lui procurer ce contenu pour maintenir la couverture et obtenir des preuves supplémentaires ?`,
        law: "<strong>Art. 293 CPP</strong> — Interdiction de l'agent provocateur : l'enquêteur ne peut pas inciter ou faciliter la commission d'une infraction.<br><strong>ATF 134 IV 266</strong> — Jurisprudence TF sur l'agent provocateur : les preuves obtenues par provocation = inexploitables + violation CEDH Art. 6.",
        question: "<strong>L'enquêteur peut-il simuler de procurer le contenu demandé ?</strong>",
        choices: [
          {
            text: "Oui — c'est une simulation, pas un vrai acte. Aucun enfant n'est réellement en danger.",
            ok: false, pts: -25,
            fb: "Violation grave de l'Art. 293 CPP. L'interdiction de l'agent provocateur ne concerne pas l'impact réel de l'acte, mais le fait d'inciter le suspect à commettre une infraction qu'il n'aurait pas commise sans la provocation. La simulation d'une offre de contenu illicite revient à faciliter une demande d'acquisition — exactement ce que l'Art. 293 CPP interdit. ATF 134 IV 266 : les preuves ainsi obtenues sont inexploitables.",
            legal: "Art. 293 CPP + ATF 134 IV 266 + CEDH Art. 6 — Agent provocateur : preuves inexploitables et violation des droits fondamentaux.",
            critical: true, next: "end",
          },
          {
            text: "Non — l'enquêteur doit décliner poliment ou dévier la conversation. La demande du suspect constitue en elle-même une preuve de son intention criminelle qu'il faut documenter sans y répondre favorablement.",
            ok: true, pts: 25,
            fb: "Position correcte. La demande du suspect est en elle-même un élément de preuve (intention d'acquérir) qui doit être documentée (sauvegarde de la conversation + rapport d'enquête). L'enquêteur dédie la conversation ou exprime son incapacité à répondre à cette demande spécifique. Tout acte qui faciliterait ou inciterait davantage l'infraction est interdit par Art. 293 CPP. Le dossier est déjà enrichi par cette demande sans avoir besoin d'aller plus loin.",
            legal: "Art. 293 CPP — L'enquêteur documente sans provoquer. La demande du suspect = preuve de son intention.",
            critical: false, next: 2,
          },
          {
            text: "Oui, mais uniquement avec du matériel légal (images non illicites) pour maintenir la couverture sans vraiment aider.",
            ok: false, pts: -15,
            fb: "Toujours une violation. Même en utilisant du matériel légal, répondre positivement à une demande de contenu illicite entretient et encourage le comportement délictueux du suspect. C'est une forme d'incitation indirecte interdite par l'esprit de l'Art. 293 CPP. De plus, cela pourrait être interprété comme une ruse envers le suspect qui pensait recevoir du contenu illicite.",
            legal: "Art. 293 CPP — Esprit de l'interdiction : ne pas faciliter ni encourager, même indirectement.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🌐 Les preuves Europol — admissibilité en droit suisse",
        situation: `Les autorités allemandes ont collecté, en vertu de leur droit national, des preuves contre les 5 suspects suisses (logs de la plateforme, transactions de paiement, adresses IP). Ces preuves sont disponibles via Europol. Elles ont été obtenues sans les autorisations requises par le droit suisse (pas d'équivalent Art. 286 CPP en droit allemand). Sont-elles admissibles dans le dossier pénal suisse ?`,
        law: "<strong>Art. 141 al. 1 CPP</strong> — Preuves obtenues illicitement : inexploitables.<br><strong>Art. 140 CPP</strong> — Méthodes d'administration des preuves interdites.<br><strong>ATF 143 IV 270</strong> — Preuves obtenues à l'étranger : admissibilité conditionnelle selon les standards minimaux suisses.<br><strong>EIMP Art. 12 + 74</strong> — Utilisation des preuves obtenues en entraide.",
        question: "<strong>Les preuves allemandes (obtenues légalement en Allemagne mais pas selon les standards suisses) sont-elles utilisables dans le procès suisse ?</strong>",
        choices: [
          {
            text: "Non — les preuves doivent toujours respecter le droit suisse, peu importe leur provenance.",
            ok: false, pts: -10,
            fb: "Trop absolu. ATF 143 IV 270 apporte une nuance essentielle : les preuves obtenues à l'étranger par des autorités étrangères agissant légalement selon leur propre droit sont admissibles en Suisse sous conditions — notamment si elles ne violent pas les droits fondamentaux reconnus par la CEDH et si leur utilisation est proportionnée. Ce n'est pas la procédure suisse qui s'applique aux actes étrangers, mais un contrôle des standards minimaux.",
            legal: "ATF 143 IV 270 — Preuves étrangères : admissibilité conditionnelle selon standards minimaux suisses et CEDH.",
            critical: false, next: 3,
          },
          {
            text: "Oui, sous conditions : (1) les autorités allemandes ont agi légalement selon leur propre droit, (2) les preuves ne violent pas les droits fondamentaux reconnus par la CEDH (Art. 6 — procès équitable, Art. 8 — vie privée), (3) elles sont transmises via un canal formel (EIMP ou Europol) avec documentation de leur mode d'obtention pour que le juge suisse puisse en apprécier la valeur.",
            ok: true, pts: 25,
            fb: "Raisonnement conforme à ATF 143 IV 270. Les preuves étrangères ne doivent pas être obtenues selon le droit suisse, mais selon le droit du pays d'origine — la Suisse contrôle les standards minimaux (droits fondamentaux CEDH). La transmission via EIMP/Europol avec documentation de la méthode d'obtention permet au juge suisse d'exercer ce contrôle. Ces preuves peuvent enrichir le dossier si ces conditions sont satisfaites.",
            legal: "ATF 143 IV 270 + EIMP Art. 12 + Art. 74 — Admissibilité conditionnelle des preuves étrangères.",
            critical: false, next: 3,
          },
          {
            text: "Oui sans conditions — ce serait contraire à la coopération internationale de refuser des preuves légalement obtenues.",
            ok: false, pts: -10,
            fb: "Trop permissif. Les preuves obtenues par torture ou méthodes coercitives illégales à l'étranger (même légales dans ce pays) restent inadmissibles en Suisse (Art. 140 CPP + CEDH Art. 3). Le contrôle des standards minimaux est impératif — c'est l'essence d'ATF 143 IV 270.",
            legal: "Art. 140 CPP + ATF 143 IV 270 — Contrôle des standards minimaux obligatoire même pour les preuves étrangères.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🛡️ La protection des enquêteurs",
        situation: `L'enquête dure depuis 6 mois. Deux enquêteurs de votre équipe montrent des signes de détresse : troubles du sommeil, irritabilité, désengagement. Un troisième refuse désormais certaines sessions d'analyse. Le médecin cantonal signale que ces symptômes sont cohérents avec un état de stress post-traumatique (ESPT) lié à l'exposition répétée à du contenu traumatisant.`,
        law: "<strong>Art. 6 LTr (Loi sur le travail)</strong> — Obligation de l'employeur de protéger la santé physique et psychique des employés.<br><strong>Art. 328 CO</strong> — Obligation de protection de la personnalité des travailleurs.<br><strong>OPA (Ordonnance sur la prévention des accidents)</strong> — Risques psychosociaux liés au travail.",
        question: "<strong>Vous êtes le responsable de l'équipe. Quelles mesures concrètes prenez-vous immédiatement ?</strong>",
        choices: [
          {
            text: "Continuer l'opération — les enquêteurs ont accepté ce travail, c'est inhérent au métier. Le médecin peut les voir après l'opération.",
            ok: false, pts: -25,
            fb: "Violation grave de l'Art. 6 LTr et de l'Art. 328 CO. L'employeur (police cantonale) a une obligation légale de protection de la santé psychique, même — et surtout — dans des métiers à risque. Les symptômes d'ESPT documentés créent une urgence médicale que l'employeur ne peut pas différer. 'Inhérent au métier' n'exonère pas de cette obligation.",
            legal: "Art. 6 LTr + Art. 328 CO — Obligation de protection immédiate, pas différable.",
            critical: true, next: "end",
          },
          {
            text: "Rotation immédiate des enquêteurs exposés (remplacement par des collègues non exposés), consultation psychologique obligatoire (traumatothérapie spécialisée) dès cette semaine, limitation des sessions d'analyse à 2h maximum avec pause obligatoire, et débrief psychologique collectif hebdomadaire — tout en maintenant l'opération.",
            ok: true, pts: 25,
            fb: "Réponse employeur exemplaire et légalement conforme. La rotation protège les enquêteurs exposés sans compromettre l'opération. La consultation spécialisée en traumatologie (pas la psychologie générale — il faut des spécialistes de l'ESPT) est la réponse médicale appropriée. La limitation des sessions est une mesure préventive pour les remplaçants. Cette approche respecte Art. 6 LTr, Art. 328 CO et OPA, et préserve l'équipe pour de futures opérations.",
            legal: "Art. 6 LTr + Art. 328 CO + OPA — Rotation, consultation spécialisée, limitation des expositions.",
            critical: false, next: 4,
          },
          {
            text: "Proposer la consultation psychologique aux enquêteurs concernés — mais de façon volontaire, pour respecter leur autonomie.",
            ok: false, pts: -10,
            fb: "Insuffisant. Les études montrent que les professionnels exposés refusent souvent le soutien psychologique par peur du jugement professionnel ou de désignation. Face à des symptômes d'ESPT documentés, l'employeur a l'obligation d'agir proactivement, pas seulement de proposer. La consultation volontaire est insuffisante — une prise en charge active est requise.",
            legal: "Art. 6 LTr — Obligation active de l'employeur, pas seulement de proposer.",
            critical: false, next: 4,
          },
        ],
      },
      {
        phase: "📋 La coordination Europol — partage d'informations",
        situation: `Europol demande à la Suisse de partager les résultats de l'enquête couverte suisse (profils des 5 suspects, logs de surveillance, transaction darknet) avec tous les 23 États participants pour enrichir leurs propres dossiers nationaux.`,
        law: "<strong>Art. 340 al. 1bis CPP</strong> — Compétence MPC pour cybercriminalité transfrontalière.<br><strong>EIMP Art. 67a</strong> — Transmission spontanée d'informations aux autorités étrangères : conditions.<br><strong>LPD 2023 Art. 17</strong> — Communication de données personnelles à l'étranger : conditions.",
        question: "<strong>Pouvez-vous partager librement les données de votre enquête avec les 23 États Europol ?</strong>",
        choices: [
          {
            text: "Oui — l'opération est coordonnée par Europol, le partage est implicitement autorisé.",
            ok: false, pts: -15,
            fb: "Incorrecte. La participation à une opération Europol ne crée pas une autorisation générale de partage. Chaque transmission de données à l'étranger est soumise aux conditions de l'EIMP (Art. 67a) et de la LPD 2023 (Art. 17). La Suisse doit vérifier que les pays destinataires offrent une protection adéquate des données et que le partage est proportionné aux finalités.",
            legal: "EIMP Art. 67a + LPD 2023 Art. 17 — Partage conditionnel, pas automatique.",
            critical: false, next: "end",
          },
          {
            text: "Oui, sous conditions : (1) autorisation du MP suisse (EIMP Art. 67a — transmission spontanée conditionnelle), (2) vérification que les 23 États offrent une protection adéquate des données (LPD 2023 Art. 17), (3) limitation du partage aux informations strictement nécessaires (proportionnalité), (4) les suspects suisses ne peuvent pas être jugés à l'étranger sans procédure d'extradition séparée.",
            ok: true, pts: 25,
            fb: "Cadre juridique correct. EIMP Art. 67a permet la transmission spontanée (sans demande formelle) sous conditions strictes. LPD 2023 Art. 17 exige une protection adéquate dans l'État destinataire (pour les 23 États, vérifier si accord d'adéquation ou garanties individuelles). Le principe de spécialité de l'EIMP s'applique : les informations partagées ne peuvent pas être utilisées pour d'autres finalités que celles déclarées.",
            legal: "EIMP Art. 67a + LPD 2023 Art. 17 + Principe de spécialité — Partage conditionnel avec garanties.",
            critical: false, next: "end",
          },
          {
            text: "Non — les données d'une enquête couverte suisse ne peuvent jamais être partagées à l'étranger.",
            ok: false, pts: -10,
            fb: "Trop absolu. L'EIMP prévoit précisément les mécanismes de partage d'informations entre États dans le cadre de la coopération judiciaire. Un refus total rendrait la participation suisse à des opérations Europol sans valeur ajoutée. La règle est le partage conditionnel, pas l'interdiction absolue.",
            legal: "EIMP Art. 67a — Partage conditionnel possible, pas interdit.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "🔐", title: "Expert Enquêtes Couvertes CH", sub: "Maîtrise Art. 286+293 CPP, admissibilité preuves étrangères, protection enquêteurs" };
      if (pct >= 65) return { icon: "🛡️", title: "Enquêteur Cyber Spécialisé", sub: "Bonne maîtrise des opérations Europol et du cadre Art. 286 CPP" };
      if (pct >= 45) return { icon: "🌐", title: "Analyste DFIR Cyber", sub: "Approfondissez Art. 286/293 CPP et ATF 143 IV 270 sur preuves étrangères" };
      return { icon: "📚", title: "Formation enquêtes couvertes requise", sub: "Art. 286 CPP + protection enquêteurs + admissibilité preuves étrangères" };
    },
  },

  /* ══════════════════════════════════════════════════════════
     4 NOUVEAUX SCÉNARIOS — THÈMES MANQUANTS
  ══════════════════════════════════════════════════════════ */

  {
    id: "poweroff-ddos",
    title: "Opération PowerOFF — DDoS-for-Hire",
    icon: "⚡",
    difficulty: "medium",
    atmosphere: "network",
    realCase: "Fedpol + Europol, Opération PowerOFF, avril 2026 — 53 domaines saisis",
    narrative: {
      success: "Saisie propre de 53 domaines. Art. 144bis al. 2 CP retenu. Clients suisses identifiés. Plusieurs procédures cantonales ouvertes.",
      degraded: "31 domaines saisis sur 53. Identification clients incomplète. Deux procédures cantonales ouvertes.",
      failure: "Saisie sans ordonnance préalable. Preuves inexploitables Art. 141 al. 2 CPP. Utilisateurs suisses non poursuivis."
    },
    tags: ["DDOS", "RÉSEAUX", "DROIT PÉNAL", "FORENSIQUE"],
    legalRefs: ["Art. 144bis CP", "Art. 143bis CP", "Convention Budapest Art. 29", "Art. 72 CPP"],
    intro: "Avril 2026. Europol coordonne l'Opération PowerOFF — démantèlement de 53 plateformes DDoS-for-hire dans 15 pays. Ces services permettaient de louer des attaques pour quelques euros. Fedpol est chargé de la saisie des domaines d'infrastructure suisses. Les bases de données récupérées contiennent 3 millions de comptes, dont plusieurs centaines de clients suisses. Vous êtes l'analyste DFIR de l'équipe fedpol.",
    alertLevel: "⚡ OPÉRATION POWEROFF — 53 DOMAINES · 3M COMPTES · Clients CH à identifier",
    objectives: [
      { icon: "⚖️", text: "Qualifier correctement les services DDoS-for-hire sous Art. 144bis CP" },
      { icon: "🔬", text: "Analyser les logs des bases de données saisies pour identifier les clients suisses" },
      { icon: "⚖️", text: "Qualifier les infractions des commanditaires (clients du service)" },
      { icon: "🌍", text: "Coordonner la saisie internationale via Convention Budapest" },
    ],
    debrief: `<p>Les services DDoS-for-hire (Booter/Stresser) permettent à quiconque de louer une attaque par déni de service. L'opérateur fournit l'infrastructure, le client commande la cible. <strong>Art. 144bis CP</strong> — détérioration de données / mise hors service de systèmes informatiques : al. 1 (jusqu'à 3 ans), al. 2 aggravé si «&nbsp;dommage considérable&nbsp;» (seuil CHF 10'000 selon ATF 106 IV 24, jusqu'à 5 ans). Les clients commanditaires engagent Art. 144bis CP + Art. 25 CP (complicité avec l'opérateur).</p>
<p><strong>Convention Budapest Art. 29</strong> — conservation urgente des données chez les hébergeurs étrangers : mécanisme clé pour préserver les preuves avant que les opérateurs les effacent. La saisie des serveurs suisses requiert une ordonnance MP (Art. 263 CPP) sans autorisation TMC préalable — le TMC n'intervient que pour la surveillance télécom (Art. 272 CPP) et la détention. Art. 24 CPP — compétence fédérale pour cybercriminalité transfrontalière : MPC pour les opérateurs, MP cantonaux pour les clients.</p>`,
    steps: [
      {
        phase: "⚖️ La qualification Art. 144bis CP",
        situation: `Un service DDoS-for-hire suisse génère 500 attaques/mois. Les victimes incluent un hôpital vaudois. Le dommage total sur 8 mois est estimé à CHF 120'000.<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
🎮 Cibles : serveurs gaming, e-commerce, hôpital VD<br>
📊 Volume : 500 attaques/mois × 8 mois<br>
💰 Dommage total : CHF 120'000<br>
🖥️ Infrastructure : 3 serveurs en Suisse, C2 aux Pays-Bas
</div>`,
        law: "<strong>Art. 144bis al. 1 CP</strong> — Mise hors service : jusqu'à 3 ans.<br><strong>Art. 144bis al. 2 CP</strong> — Aggravé si dommage considérable (ATF 106 IV 24 : seuil CHF 10'000) : jusqu'à 5 ans.<br><strong>Art. 24 CP</strong> — Instigation : l'opérateur instige les infractions de ses clients.",
        question: "<strong>Quelle qualification pour l'opérateur du service DDoS-for-hire suisse ?</strong>",
        choices: [
          {
            text: "Art. 144bis al. 1 CP — chaque attaque individuelle est souvent sous le seuil de CHF 10'000.",
            ok: false, pts: -10,
            fb: "Le dommage s'apprécie globalement sur l'ensemble de l'activité délictueuse. CHF 120'000 total >> CHF 10'000. Art. 144bis al. 2 CP s'applique.",
            legal: "ATF 106 IV 24 — Dommage considérable : appréciation globale de l'activité.",
            critical: false, next: 1,
          },
          {
            text: "Art. 144bis al. 2 CP (CHF 120'000 >> seuil CHF 10'000) + Art. 24 CP (instigation de chaque attaque clients) + Art. 143bis CP (accès indu aux systèmes victimes) en concours réel. Jusqu'à 5 ans + peine d'ensemble Art. 49 CP.",
            ok: true, pts: 25,
            fb: "Qualification solide. Art. 144bis al. 2 CP : dommage global établi. Art. 24 CP : l'opérateur sait que les 'stress tests' sont de vraies attaques — il instige chaque infraction en encaissant le paiement. Art. 143bis CP : accès indu aux systèmes des victimes saturées.",
            legal: "Art. 144bis al. 2 CP + Art. 24 CP + Art. 143bis CP — ATF 106 IV 24.",
            critical: false, next: 1,
          },
          {
            text: "Uniquement Art. 143bis CP — c'est un accès indu, pas une vraie destruction.",
            ok: false, pts: -15,
            fb: "Art. 144bis CP vise précisément la mise hors service — l'effet d'un DDoS par définition. Les deux infractions coexistent.",
            legal: "Art. 144bis al. 1 CP — 'Met hors service des systèmes informatiques' = DDoS.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "🔬 Triage des clients suisses",
        situation: `3.1M comptes dans la base saisie. Filtre IP suisse : 8'400 comptes. Paiements majoritairement en Monero. Emails : 340 adresses @bluewin.ch, @sunrise.ch. Logs d'attaques : cible IP + durée + timestamp pour chaque commande.`,
        law: "<strong>Art. 14 CPP</strong> — Compétence matérielle des MP cantonaux.<br><strong>EIMP Art. 67a</strong> — Transmission spontanée d'informations aux autorités cantonales.<br><strong>Art. 197 CPP</strong> — Proportionnalité des mesures.",
        question: "<strong>Comment prioriser la transmission aux MP cantonaux ?</strong>",
        choices: [
          {
            text: "Envoyer la liste complète des 8'400 comptes à tous les MP cantonaux.",
            ok: false, pts: -15,
            fb: "Transmission non ciblée et disproportionnée. EIMP Art. 67a impose la proportionnalité — seules les informations pertinentes pour une poursuite spécifique peuvent être transmises.",
            legal: "EIMP Art. 67a — Proportionnalité : seuls les éléments pertinents pour la poursuite.",
            critical: false, next: 2,
          },
          {
            text: "Triage 3 niveaux : (1) Priorité — cibles infrastructures critiques CH (hôpitaux, communes) → MPC, (2) Haute — comptes actifs >5 attaques identifiables → MP cantonal domicile, (3) Standard — 1 attaque ou inactifs → information sans procédure immédiate.",
            ok: true, pts: 25,
            fb: "Triage proportionné conforme Art. 197 CPP et EIMP Art. 67a. Cibles critiques → compétence MPC (Art. 24 CPP — cybercriminalité transfrontalière + infrastructures critiques). Volume d'attaques comme critère de priorisation : rationnel et défendable.",
            legal: "Art. 24 CPP + EIMP Art. 67a + Art. 197 CPP — Triage par gravité et compétence.",
            critical: false, next: 2,
          },
          {
            text: "Traiter uniquement les 340 emails identifiables — les IP seules ne sont pas exploitables.",
            ok: false, pts: -10,
            fb: "L'IP + logs d'attaques (cible + durée + timestamp + paiement) constitue un faisceau d'indices (ATF 144 IV 345) suffisant pour ouvrir une enquête. Les deux sources se combinent.",
            legal: "ATF 144 IV 345 — Faisceau d'indices convergents IP + logs + emails.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "⚖️ Le commanditaire — son dol",
        situation: `Un entrepreneur bernois a commandé 23 attaques DDoS contre le site de son concurrent. Dommage : CHF 34'000. Il argue : «&nbsp;Je pensais tester la robustesse de son serveur.&nbsp;»`,
        law: "<strong>Art. 12 al. 1 CP</strong> — Dol direct.<br><strong>Art. 12 al. 2 CP</strong> — Dol éventuel : envisage et accepte le résultat.<br><strong>Art. 144bis al. 2 CP</strong> — CHF 34'000 >> seuil CHF 10'000.",
        question: "<strong>Quel dol retenir pour cet entrepreneur ?</strong>",
        choices: [
          {
            text: "L'argument est plausible — classement sans suite.",
            ok: false, pts: -20,
            fb: "23 attaques répétées contre un concurrent précis, corrélées avec ses périodes d'activité. Dol direct démontrable : le pattern ne laisse aucun doute sur l'intention.",
            legal: "Art. 12 al. 1 CP — 23 attaques ciblées = intention claire.",
            critical: false, next: 3,
          },
          {
            text: "Dol direct (Art. 12 al. 1 CP) probable — 23 attaques contre un concurrent identifié = intention délibérée. Art. 144bis al. 2 CP (CHF 34'000 considérable) + Art. 25 CP (complicité avec l'opérateur).",
            ok: true, pts: 25,
            fb: "Correct. Dol direct : 23 attaques répétées pendant des périodes commerciales clés contre un concurrent identifié. CHF 34'000 >> CHF 10'000 = aggravante al. 2. Art. 25 CP : l'entrepreneur a activement commandé le service.",
            legal: "Art. 12 al. 1 CP + Art. 144bis al. 2 CP + Art. 25 CP — ATF 106 IV 24.",
            critical: false, next: 3,
          },
          {
            text: "Art. 144bis al. 1 CP uniquement — l'entrepreneur n'est qu'un utilisateur.",
            ok: false, pts: -5,
            fb: "CHF 34'000 >> seuil CHF 10'000 = al. 2 s'applique, quelle que soit la qualité d'opérateur ou client.",
            legal: "Art. 144bis al. 2 CP — s'applique à l'auteur ET au complice si dommage considérable.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "🌍 La saisie internationale à 06h00",
        situation: `4 serveurs d'infrastructure sont hébergés en Suisse. Europol prévoit une saisie simultanée dans 15 pays à 06h00 UTC. L'ordonnance MP peut-elle être préparée la veille ?`,
        law: "<strong>Art. 263 CPP</strong> — Séquestre : ordonnance MP obligatoire (pas de TMC).<br><strong>Convention Budapest Art. 29</strong> — Conservation urgente chez les hébergeurs étrangers.<br><strong>Art. 141 al. 2 CPP</strong> — Saisie sans ordonnance = preuves inexploitables.",
        question: "<strong>Quelle procédure préalable est indispensable pour les 4 serveurs suisses ?</strong>",
        choices: [
          {
            text: "Aucune — urgence cybercriminalité = exception au mandat.",
            ok: false, pts: -20,
            fb: "Il n'existe pas d'exception d'urgence générale pour le séquestre de serveurs. Saisie sans ordonnance = Art. 141 al. 2 CPP → preuves inexploitables.",
            legal: "Art. 263 CPP — Séquestre : ordonnance MP OBLIGATOIRE. Pas d'exception d'urgence.",
            critical: true, next: "end",
          },
          {
            text: "Ordonnance de séquestre MP (Art. 263 CPP) préparée la veille + Convention Budapest Art. 29 (conservation urgente aux hébergeurs étrangers 24h avant). Saisie des 4 serveurs à 06h00 avec ordonnance valide.",
            ok: true, pts: 25,
            fb: "Procédure correcte. L'ordonnance est préparée en amont de l'opération coordonnée Europol. Art. 263 CPP ne requiert pas le TMC (uniquement la surveillance télécom). Convention Budapest Art. 29 pour les 49 domaines hébergés à l'étranger.",
            legal: "Art. 263 CPP (séquestre ordonnance MP) + Convention Budapest Art. 29 (conservation urgente étrangers).",
            critical: false, next: "end",
          },
          {
            text: "Autorisation TMC en urgence — le séquestre de serveurs nécessite un juge.",
            ok: false, pts: -5,
            fb: "Le TMC n'est pas requis pour un séquestre ordinaire. Art. 263 CPP : ordonnance MP suffit. Le TMC intervient pour la surveillance télécom (Art. 272 CPP) et la détention provisoire.",
            legal: "Art. 263 CPP — Séquestre : ordonnance MP (sans TMC).",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "⚡", title: "Expert DDoS-for-Hire CH", sub: "Art. 144bis CP + coordination Europol maîtrisés" };
      if (pct >= 65) return { icon: "🌐", title: "Analyste Cybercrime", sub: "Bonne maîtrise des qualifications DDoS" };
      if (pct >= 45) return { icon: "🔍", title: "Juriste Numérique", sub: "Approfondissez Art. 144bis CP et Convention Budapest" };
      return { icon: "📚", title: "Formation DDoS requise", sub: "Art. 144bis CP + ATF 106 IV 24" };
    },
  },

  {
    id: "osint-licite",
    title: "Les Limites de l'OSINT — Légal vs Illégal",
    icon: "🔭",
    difficulty: "easy",
    atmosphere: "legal",
    narrative: {
      success: "OSINT conduit dans les limites légales. Rapport recevable. Enquête poursuivie sur bases solides.",
      degraded: "Sources partiellement contestées. Dossier fragilisé sur certains éléments.",
      failure: "OSINT dépasse les limites. Art. 273 CP invoqué. Preuves exclues. Procédure disciplinaire."
    },
    tags: ["OSINT", "DROIT", "FORENSIQUE"],
    legalRefs: ["ATF 136 II 508", "Art. 273 CP", "Art. 179novies CP", "LPD 2023"],
    intro: "Vous êtes un analyste DFIR mandaté par le MP pour rechercher des informations sur un suspect dans une affaire de fraude. Avant de commencer votre OSINT, vous devez savoir exactement où s'arrête le légal en Suisse. Un OSINT mal conduit peut vous exposer à des poursuites pénales.",
    alertLevel: "🔭 OSINT EN SUISSE — La ligne entre enquête légitime et infraction est plus fine qu'ailleurs",
    objectives: [
      { icon: "⚖️", text: "Identifier les sources OSINT légales vs celles qui franchissent la ligne pénale" },
      { icon: "📋", text: "Comprendre ATF 136 II 508 (Logistep) — IP = donnée personnelle, Carrier Grade NAT" },
      { icon: "🛡️", text: "Éviter Art. 273 CP (espionnage économique) et Art. 179novies CP" },
    ],
    debrief: `<p>L'OSINT n'est pas juridiquement neutre en Suisse. <strong>Art. 179novies CP</strong> — soustraction de données personnelles non publiques. <strong>Art. 273 CP</strong> — renseignements économiques : collecter des secrets d'affaires d'entreprises suisses pour des concurrents = infraction pénale, même via des sources ostensiblement «&nbsp;publiques&nbsp;». <strong>Art. 28 CC</strong> — atteinte à la personnalité pour la compilation de profils détaillés sans motif légitime.</p>
<p><strong>ATF 136 II 508 (Logistep, 2010)</strong> — arrêt fondateur : même les adresses IP collectées pour identification future sont des données personnelles protégées. Une entreprise privée ne peut pas collecter des IP pour les transmettre à des tiers sans violer la LPD. En contexte OSINT : l'IP visible dans un log public peut être notée ; la collecter systématiquement pour identifier des utilisateurs requiert une base légale. En Carrier Grade NAT (Swisscom mobile, Salt) : l'IP seule est insuffisante — il faut IP + port source + timestamp + réquisition Art. 273 CPP.</p>`,
    steps: [
      {
        phase: "🔭 Sources OSINT — légal vs illégal",
        situation: `Vous cherchez des informations sur Marc D., 38 ans, entrepreneur zurichois. Lesquelles de ces sources pouvez-vous utiliser ?<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
A) LinkedIn public de Marc D. — profil et historique emploi<br>
B) Registre du commerce zefix.admin.ch<br>
C) Compte Instagram public — photos, localisations<br>
D) Groupe WhatsApp privé (vous n'y êtes pas invité)<br>
E) Forum darknet nécessitant une inscription<br>
F) Boîte mail via un outil de password reset exploitant une faille
</div>`,
        law: "<strong>Art. 179novies CP</strong> — Soustraction de données non publiques.<br><strong>Art. 143bis CP</strong> — Accès indu à un système.<br><strong>Données publiques</strong> — Consultables sans restriction si accessibles à tous sans authentification.",
        question: "<strong>Parmi ces 6 sources, lesquelles sont légalement utilisables ?</strong>",
        choices: [
          {
            text: "Toutes — enquêteur mandaté MP = immunité pour recherche de preuves.",
            ok: false, pts: -25,
            fb: "Il n'existe pas d'immunité générale. D (WhatsApp privé sans invitation), F (accès frauduleux boîte mail) constituent des infractions quelle que soit la qualité de l'auteur. Un mandat ou une commission rogatoire sont les voies légales.",
            legal: "Art. 143bis CP + Art. 179novies CP — S'appliquent aussi aux enquêteurs sans autorisation.",
            critical: true, next: "end",
          },
          {
            text: "A, B, C uniquement — données volontairement publiques, sans authentification ni manipulation.",
            ok: true, pts: 25,
            fb: "Correct. LinkedIn public, zefix (registre officiel) et Instagram public : données que la personne a rendues publiques — Art. 28 CC : collecte licite. D = groupe privé (Art. 179novies CP). E = forum avec inscription = accès indu possible. F = Art. 143bis CP systématiquement.",
            legal: "LPD 2023 + Art. 28 CC — Données volontairement publiques : collecte licite. Privées : mandat requis.",
            critical: false, next: 1,
          },
          {
            text: "A, B, C, E — le darknet est public par essence.",
            ok: false, pts: -10,
            fb: "Si le forum darknet requiert une inscription ou invitation (fréquent dans les forums criminels), l'accès sans autorisation = Art. 143bis CP. Participer sous couverture = Art. 286 CPP (autorisation TMC requise).",
            legal: "Art. 143bis CP + Art. 286 CPP — Darknet fermé : accès indu. Couverture : autorisation TMC.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "📋 L'IP et ATF 136 II 508 — Carrier Grade NAT",
        situation: `Vous trouvez l'IP utilisée par Marc D. sur un forum public il y a 8 mois. L'opérateur est Swisscom mobile — qui utilise le Carrier Grade NAT (CGN). Cette IP est partagée par des dizaines d'utilisateurs simultanément.`,
        law: "<strong>ATF 136 II 508 (Logistep, 2010)</strong> — IP = donnée personnelle protégée.<br><strong>Art. 273 CPP</strong> — Réquisition d'abonné via MP (délai 6 mois, Art. 27 LSCPT).<br><strong>Carrier Grade NAT</strong> — Identification requiert IP + port source + timestamp.",
        question: "<strong>Pouvez-vous identifier Marc D. directement depuis cette IP ?</strong>",
        choices: [
          {
            text: "Oui — une IP identifie un utilisateur selon ATF 136 II 508.",
            ok: false, pts: -15,
            fb: "ATF 136 II 508 dit le contraire : l'IP identifie un abonné (via réquisition), pas l'auteur. Avec le CGN Swisscom, l'IP identifie un pool d'abonnés. Il faut IP + port source + timestamp précis → réquisition Swisscom via Art. 273 CPP.",
            legal: "ATF 136 II 508 — IP = abonné, pas auteur. CGN : IP insuffisante seule.",
            critical: false, next: 2,
          },
          {
            text: "Non sans mandat. L'IP seule ne suffit pas (abonné ≠ auteur) et le CGN exige en plus le port source + timestamp — réquisition formelle à Swisscom (Art. 273 CPP) via ordonnance MP obligatoire.",
            ok: true, pts: 25,
            fb: "Exact. ATF 136 II 508 : IP = donnée personnelle → réquisition légale. CGN Swisscom : IP seule insuffisante même avec mandat — il faut le port source + timestamp pour isoler l'abonné parmi les dizaines partageant l'IP. Art. 273 CPP + ordonnance MP.",
            legal: "Art. 273 CPP + ATF 136 II 508 + réalité technique CGN — Réquisition avec IP + port + timestamp.",
            critical: false, next: 2,
          },
          {
            text: "Oui — l'IP est dans un post public, donc information publique libre d'usage.",
            ok: false, pts: -10,
            fb: "La visibilité publique de l'IP ne crée pas de base légale pour l'identifier. ATF 136 II 508 : la collecter dans le but d'identifier une personne = traitement de données personnelles requérant une base légale.",
            legal: "ATF 136 II 508 consid. 3 — Collecte d'IP dans un but d'identification = traitement de données personnelles.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🚨 Art. 273 CP — Espionnage économique",
        situation: `Votre client (société concurrente) vous demande d'élargir l'investigation pour collecter des informations sur «&nbsp;la stratégie, les clients et les contrats&nbsp;» de l'entreprise de Marc D. — qui est directeur d'une filiale d'une entreprise de défense suisse. Ces informations ne sont pas publiques.`,
        law: "<strong>Art. 273 CP</strong> — Renseignements économiques : collecter des secrets d'affaires suisses pour des concurrents = jusqu'à 3 ans.<br><strong>Art. 162 CP</strong> — Violation du secret commercial.<br><strong>LPD 2023</strong> — Base légale nécessaire pour tout traitement.",
        question: "<strong>Pouvez-vous accepter cet élargissement de mission ?</strong>",
        choices: [
          {
            text: "Oui — c'est de l'intelligence économique, pratique courante.",
            ok: false, pts: -25,
            fb: "Collecter des secrets commerciaux d'une entreprise de défense suisse pour un concurrent = exactement ce que vise Art. 273 CP. Doublement sensible : secrets commerciaux + informations liées à la sécurité nationale.",
            legal: "Art. 273 CP — Renseignements économiques : infraction pénale même sous couvert 'OSINT'.",
            critical: true, next: "end",
          },
          {
            text: "Non — Art. 273 CP + Art. 162 CP s'appliquent. Refuser et documenter le refus.",
            ok: true, pts: 25,
            fb: "Correct et professionnellement responsable. Art. 273 CP s'applique au résultat (mettre à disposition des secrets) pas seulement à la méthode. Documenter le refus protège l'analyste d'une mise en cause future.",
            legal: "Art. 273 CP + Art. 162 CP — Refus et documentation : protection de l'analyste.",
            critical: false, next: "end",
          },
          {
            text: "Peut-être — si je n'utilise que des sources réellement publiques.",
            ok: false, pts: -10,
            fb: "Art. 273 CP incrimine la mise à disposition des informations secrètes — pas seulement la méthode. Même via sources publiques, si la compilation reconstitue des secrets commerciaux transmis à un concurrent, c'est une infraction.",
            legal: "Art. 273 CP — Incrimine la mise à disposition, pas uniquement la méthode.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "🔭", title: "Expert OSINT Légal CH", sub: "ATF 136 II 508 et Art. 273 CP maîtrisés" };
      if (pct >= 65) return { icon: "⚖️", title: "Analyste OSINT Averti", sub: "Bonne compréhension des limites OSINT suisses" };
      return { icon: "📚", title: "Formation OSINT légal requise", sub: "ATF 136 II 508 + Art. 273 CP + Art. 179novies CP" };
    },
  },

  {
    id: "mros-banquier",
    title: "Le Banquier Diligent — Art. 305ter CP",
    icon: "🏦",
    difficulty: "medium",
    atmosphere: "crypto",
    realCase: "ATF 6B_1180/2023, Tribunal fédéral, 24 septembre 2024",
    narrative: {
      success: "Banquier acquitté de Art. 305bis CP : violations LBA établies (Art. 305ter CP) mais dol éventuel non prouvé. Analyse forensique correcte. Sanction FINMA administrative.",
      degraded: "Condamné pour Art. 305ter CP, acquitté Art. 305bis CP. Sanction administrative FINMA.",
      failure: "Condamné pour Art. 305bis CP. Analyse forensique trop superficielle n'a pas démontré la bonne foi relative."
    },
    tags: ["BLANCHIMENT", "LBA", "MROS", "DROIT PÉNAL"],
    legalRefs: ["Art. 305bis CP", "Art. 305ter CP", "LBA Art. 9", "ATF 6B_1180/2023", "ATF 149 IV 248"],
    intro: "Un gestionnaire de fortune genevois ouvre un compte et investit CHF 21.5M pour un client présenté comme 'investisseur immobilier'. Deux ans plus tard, le MPC l'accuse de blanchiment (Art. 305bis CP). L'employé soutient avoir suivi les procédures internes. Vous êtes l'expert forensique financier mandaté par le MP.",
    alertLevel: "🏦 CHF 21.5M INVESTIS — Art. 305bis ou Art. 305ter CP ? La ligne ATF 6B_1180/2023",
    objectives: [
      { icon: "⚖️", text: "Distinguer Art. 305bis CP (blanchiment intentionnel) et Art. 305ter CP (négligence)" },
      { icon: "🔬", text: "Analyser les transactions pour établir ou réfuter le dol éventuel" },
      { icon: "📣", text: "Identifier le moment exact déclenchant l'obligation MROS (LBA Art. 9)" },
      { icon: "📋", text: "Rédiger un rapport conforme Art. 184 CPP selon ATF 6B_1180/2023" },
    ],
    debrief: `<p><strong>ATF 6B_1180/2023 (TF, 24 septembre 2024)</strong> — arrêt fondateur : la violation des obligations de diligence LBA ne permet pas <em>à elle seule</em> de présumer l'intention délictueuse. Pour condamner pour Art. 305bis CP (blanchiment), il faut prouver que l'auteur <em>savait ou présumait</em> que les fonds provenaient d'un crime — le dol éventuel suffit (ATF 149 IV 248) mais doit être établi positivement.</p>
<p><strong>Distinction cruciale</strong> : <strong>Art. 305ter CP</strong> — violation grave des obligations LBA (négligence grave, sanctionnable). <strong>Art. 305bis CP</strong> — blanchiment, requiert en plus que l'auteur ait su ou dû présumer l'origine criminelle. Un banquier négligent mais sans indice concret d'infraction préalable peut être condamné pour Art. 305ter CP sans l'être pour Art. 305bis CP — c'est précisément le résultat dans l'affaire ATF 6B_1180/2023. <strong>LBA Art. 9</strong> : signalement MROS sur soupçon fondé (pas certitude). LBA Art. 11 : immunité pour communication de bonne foi.</p>`,
    steps: [
      {
        phase: "🔬 L'analyse des transactions",
        situation: `18 mois de mouvements sur le compte :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
💰 Versement initial : CHF 21.5M en une opération depuis Dubaï<br>
🔄 34 transactions sortantes vers 12 pays en 18 mois<br>
📋 Justificatifs : factures immobilières — approuvées par Private Wealth Management<br>
⚠️ Red flags : client sans historique, opération unique très élevée, destinations Pakistan/Nigeria/Panama<br>
📝 KYC banquier : formulaires complétés, pas d'enquête approfondie sur l'origine des fonds
</div>`,
        law: "<strong>LBA Art. 6</strong> — Obligation de diligence : vérifier l'origine des fonds.<br><strong>Art. 305ter CP</strong> — Violation grave des obligations LBA.<br><strong>ATF 6B_1180/2023</strong> — Violations LBA seules insuffisantes pour présumer le dol éventuel.",
        question: "<strong>Le banquier a-t-il violé ses obligations LBA ? Avec quelle qualification ?</strong>",
        choices: [
          {
            text: "Non — le département interne a approuvé. Il a suivi les procédures.",
            ok: false, pts: -15,
            fb: "ATF 6B_1180/2023 : l'approbation interne ne remplace pas les obligations légales LBA. Si les procédures internes sont insuffisantes, l'employé peut être mis en cause même en les ayant suivies.",
            legal: "LBA Art. 6 — Obligation légale indépendante des procédures internes.",
            critical: false, next: 1,
          },
          {
            text: "Oui, violation grave LBA (Art. 305ter CP) : les red flags imposaient une vérification renforcée sur l'origine des fonds. Mais cela ne prouve pas encore le dol éventuel pour Art. 305bis CP.",
            ok: true, pts: 25,
            fb: "Analyse exacte et conforme à ATF 6B_1180/2023. Red flags (montant, source, destinations) = signaux d'alerte LBA Art. 6. Absence de vérification approfondie = Art. 305ter CP. Mais dol éventuel (savait-il ?) = question distincte à établir séparément.",
            legal: "LBA Art. 6 + Art. 305ter CP + ATF 6B_1180/2023 — Violation LBA ≠ présomption de dol.",
            critical: false, next: 1,
          },
          {
            text: "Art. 305bis CP directement — CHF 21.5M d'une source opaque = le banquier devait savoir.",
            ok: false, pts: -10,
            fb: "ATF 6B_1180/2023 exige une preuve positive du dol éventuel. Les red flags ne suffisent pas à établir automatiquement que le banquier savait ou devait présumer l'origine criminelle.",
            legal: "ATF 6B_1180/2023 consid. 2.1.3 — Violations LBA ≠ preuve automatique de dol éventuel.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "🔍 Le dol éventuel — établir ou réfuter",
        situation: `Éléments additionnels trouvés :<br><br>
<div style="background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;font-size:.8rem;line-height:1.8">
📧 E-mail interne banquier (18 mois avant) : «&nbsp;Ce client semble en ordre.&nbsp;»<br>
📋 Notes KYC : «&nbsp;client recommandé par M.X&nbsp;» (référent surveillé par MROS 6 mois plus tard)<br>
📰 Aucun article négatif sur le client avant l'ouverture du compte<br>
🔎 Worldcheck : résultat négatif à l'époque<br>
💬 Déposition : «&nbsp;Mon supérieur a approuvé.&nbsp;»
</div>`,
        law: "<strong>Art. 305bis CP</strong> — Dol éventuel : l'auteur devait présumer l'origine criminelle.<br><strong>ATF 149 IV 248 consid. 6.3</strong> — Dol éventuel : connaissance de soupçons 'pressants' requis.<br><strong>Art. 10 al. 3 CPP</strong> — In dubio pro reo.",
        question: "<strong>Le dol éventuel Art. 305bis CP est-il établi ?</strong>",
        choices: [
          {
            text: "Oui — les red flags suffisent à prouver qu'il devait savoir.",
            ok: false, pts: -15,
            fb: "ATF 6B_1180/2023 rejette cette déduction automatique. Worldcheck négatif, aucune presse négative, approbation interne, e-mail de bonne foi — ces éléments affaiblissent la preuve du dol. In dubio pro reo.",
            legal: "ATF 149 IV 248 — Dol éventuel : connaissance de soupçons 'pressants', pas simples anomalies.",
            critical: false, next: 2,
          },
          {
            text: "Probablement non pour Art. 305bis CP — négligence grave établie mais pas conscience des soupçons. La surveillance MROS du référent est postérieure et ne peut pas établir rétroactivement le dol.",
            ok: true, pts: 25,
            fb: "Raisonnement conforme à ATF 6B_1180/2023. Worldcheck négatif + approbation interne + e-mail de bonne foi relative = doute sur le dol. La surveillance MROS du référent est postérieure — elle ne peut pas établir rétroactivement que le banquier 'savait'. In dubio pro reo (Art. 10 al. 3 CPP).",
            legal: "ATF 6B_1180/2023 + Art. 10 al. 3 CPP — In dubio pro reo : doute sur le dol = acquittement Art. 305bis CP.",
            critical: false, next: 2,
          },
          {
            text: "Impossible à dire — le juge décidera.",
            ok: false, pts: -5,
            fb: "L'expert doit conclure au niveau d'affirmation approprié (Art. 184 CPP). Sur la base des éléments disponibles, une conclusion est possible : 'violation LBA établie, preuve du dol insuffisante selon ATF 6B_1180/2023, sous réserve d'éléments supplémentaires'.",
            legal: "Art. 184 CPP — L'expert conclut avec le niveau d'affirmation approprié.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "📣 Le signalement MROS — quand ?",
        situation: `Six mois après l'ouverture du compte, un analyste compliance détecte les anomalies. Il hésite entre signaler au MROS immédiatement ou investiguer en interne d'abord.`,
        law: "<strong>LBA Art. 9</strong> — Obligation de communiquer au MROS si soupçon fondé.<br><strong>LBA Art. 10</strong> — Blocage des transactions dès la communication MROS.<br><strong>LBA Art. 11</strong> — Protection : communication de bonne foi non punissable.",
        question: "<strong>À quel moment l'obligation de communication MROS est-elle déclenchée ?</strong>",
        choices: [
          {
            text: "Seulement si on a la certitude — sinon risque de dénonciation calomnieuse.",
            ok: false, pts: -20,
            fb: "LBA Art. 9 : communication obligatoire sur soupçon fondé — pas certitude. LBA Art. 11 : immunité totale pour communication de bonne foi, même si elle s'avère infondée. Attendre la certitude = violation LBA.",
            legal: "LBA Art. 9 — Soupçon fondé suffit. LBA Art. 11 — Immunité pour bonne foi.",
            critical: false, next: 3,
          },
          {
            text: "Dès soupçon fondé (pas certitude). LBA Art. 10 : bloquer les transactions suspectes en parallèle jusqu'à décision MROS.",
            ok: true, pts: 25,
            fb: "Procédure exacte. LBA Art. 9 : communication sur soupçon fondé. LBA Art. 10 : blocage automatique des transactions dès la communication — la banque ne peut plus exécuter d'ordres sur le compte. LBA Art. 11 : protection totale pour communication de bonne foi.",
            legal: "LBA Art. 9 + Art. 10 + Art. 11 — Communication sur soupçon + blocage + immunité.",
            critical: false, next: 3,
          },
          {
            text: "Après 30 jours d'investigations internes — la loi donne ce délai.",
            ok: false, pts: -15,
            fb: "Il n'existe pas de délai légal de 30 jours. LBA Art. 9 : communication 'sans délai' dès le soupçon fondé. Une investigation interne prolongée pendant laquelle des transactions sont exécutées constitue elle-même une violation.",
            legal: "LBA Art. 9 — 'Sans délai' : pas de délai légal pour investigations internes préalables.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "📋 Le rapport forensique",
        situation: `Le MP vous demande des conclusions forensiques sur la responsabilité du banquier. Votre analyse est complète.`,
        law: "<strong>Art. 184 CPP</strong> — L'expert répond aux questions, avec méthode et niveau d'affirmation approprié.<br><strong>Art. 182 CPP</strong> — L'expert éclaire, ne tranche pas.<br><strong>ATF 6B_1180/2023</strong> — Distinction Art. 305ter CP / Art. 305bis CP.",
        question: "<strong>Quelle formulation de conclusions est correcte ?</strong>",
        choices: [
          {
            text: "'Le banquier est coupable de blanchiment d'argent.'",
            ok: false, pts: -20,
            fb: "L'expert ne prononce pas la culpabilité — prérogative exclusive du tribunal. Art. 182 CPP : l'expert éclaire sans trancher.",
            legal: "Art. 182 CPP — Culpabilité = prérogative du juge, jamais de l'expert.",
            critical: false, next: "end",
          },
          {
            text: "Volet A : violations LBA établies — liste des obligations non respectées (LBA Art. 6, points spécifiques). Volet B : dol éventuel insuffisamment établi sur la base disponible : Worldcheck négatif, approbation interne, absence de presse, e-mail de bonne foi. Recommandation : Art. 305ter CP retenu ; Art. 305bis CP nécessite éléments supplémentaires.",
            ok: true, pts: 25,
            fb: "Rapport exemplaire conforme Art. 184 CPP + ATF 6B_1180/2023. Deux volets distincts (faits / qualification recommandée), niveau d'affirmation correct (recommandation, pas verdict), ouvert à des éléments supplémentaires. Protège l'expertise contre la contestation défense.",
            legal: "Art. 184 CPP + ATF 6B_1180/2023 — Deux volets : faits établis + évaluation du dol avec niveau d'affirmation.",
            critical: false, next: "end",
          },
          {
            text: "'Violations LBA établies mais je ne peux pas me prononcer sur le dol — trop juridique.'",
            ok: false, pts: -5,
            fb: "Art. 184 CPP : l'expert répond aux questions posées. Si le MP demande d'évaluer les éléments constitutifs du dol éventuel, vous devez fournir une évaluation technique (chronologie, vérifications, red flags connus). Refuser n'est pas une réponse d'expert suffisante.",
            legal: "Art. 184 CPP — Répondre aux questions posées dans les limites de la compétence.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "🏦", title: "Expert Forensique Financier", sub: "ATF 6B_1180/2023 et distinction 305bis/305ter maîtrisés" };
      if (pct >= 65) return { icon: "💼", title: "Analyste Anti-Blanchiment", sub: "Bonne maîtrise LBA + distinction dol éventuel/violation" };
      if (pct >= 45) return { icon: "📋", title: "Juriste Financier", sub: "Approfondissez ATF 149 IV 248 et ATF 6B_1180/2023" };
      return { icon: "📚", title: "Formation LBA requise", sub: "Art. 305bis/ter CP + LBA Art. 9 + MROS" };
    },
  },

  {
    id: "kks-deepfake",
    title: "Deepfake — Personnalité Publique & Art. 179decies CP",
    icon: "🎭",
    difficulty: "hard",
    atmosphere: "legal",
    narrative: {
      success: "Qualification Art. 179decies CP correcte. Deepfake authentifié forensiquement. Domaines publicitaires tracés. Voie civile Art. 28a CC : retrait en 48h. EIMP pour les auteurs.",
      degraded: "Qualification tient. Trace s'arrête aux registrars anonymes. Art. 173 CP applicable pour la diffusion. Auteurs non identifiés.",
      failure: "Qualification erronée (173 CP seul). Personnalité ne peut pas agir efficacement. Contenu continue de circuler."
    },
    tags: ["DEEPFAKE", "IA", "DROIT PÉNAL", "FORENSIQUE"],
    legalRefs: ["Art. 179decies CP", "Art. 173 CP", "Art. 146 CP", "ATF 146 IV 23", "Art. 28a CC"],
    intro: "Alerte du NCSC. Une campagne publicitaire frauduleuse utilise un deepfake vidéo d'une haute personnalité officielle suisse recommandant un investissement crypto. En une semaine : 2.3 millions de vues, CHF 800'000 versés par 340 victimes. Vous êtes l'analyste DFIR de l'équipe fedpol.",
    alertLevel: "🎭 DEEPFAKE OFFICIEL — CHF 800'000 VICTIMES · Art. 179decies CP EN JEU",
    objectives: [
      { icon: "⚖️", text: "Maîtriser Art. 179decies CP (en vigueur 1er sept. 2023) — représentation non consentie" },
      { icon: "🔬", text: "Authentifier le deepfake par 5 marqueurs forensiques convergents" },
      { icon: "🌐", text: "Tracer l'infrastructure publicitaire frauduleuse" },
      { icon: "⚖️", text: "Activer la voie civile Art. 28a CC pour retrait rapide" },
    ],
    debrief: `<p><strong>Art. 179decies CP</strong> (en vigueur 1er septembre 2023) — le droit suisse punit désormais la représentation non consentie d'une personne réelle dans un contexte fallacieux via technologies de traitement de l'image/son, dans le dessein de nuire ou s'enrichir. Peine : jusqu'à 3 ans ou peine pécuniaire.</p>
<p>Infractions en concours dans cette affaire : <strong>Art. 179decies CP</strong> (représentation non consentie — deepfake), <strong>Art. 146 CP</strong> (escroquerie — CHF 800'000 de victimes trompées), <strong>Art. 173 CP</strong> (diffamation — si atteinte à l'honneur). <strong>ATF 146 IV 23</strong> : celui qui «&nbsp;like&nbsp;» ou partage un contenu diffamatoire engage sa propre responsabilité pénale. Voie civile parallèle : <strong>Art. 28a CC</strong> (mesures provisionnelles) permet le retrait du contenu en 48-72h sans attendre la procédure pénale — bien plus rapide pour limiter les dégâts.</p>`,
    steps: [
      {
        phase: "⚖️ La qualification complète",
        situation: `Le deepfake montre la personnalité officielle «&nbsp;recommandant&nbsp;» un investissement crypto. 2.3M de vues. 340 victimes pour CHF 800'000. La personnalité n'a jamais participé.`,
        law: "<strong>Art. 179decies CP</strong> (1er sept. 2023) — Représentation non consentie par technologie, dessein d'enrichissement ou de nuisance.<br><strong>Art. 146 CP</strong> — Escroquerie : les 340 victimes trompées par le deepfake 'astucieux'.<br><strong>Art. 173 CP</strong> — Diffamation si atteinte à l'honneur.",
        question: "<strong>Quelle est la qualification pénale complète ?</strong>",
        choices: [
          {
            text: "Art. 173 CP (diffamation) uniquement.",
            ok: false, pts: -15,
            fb: "Art. 179decies CP a été créé pour combler ce vide : représentation via technologies. Art. 146 CP couvre les victimes financières. Les trois infractions coexistent en concours réel.",
            legal: "Art. 179decies CP + Art. 173 CP + Art. 146 CP — Art. 9 CP concours réel.",
            critical: false, next: 1,
          },
          {
            text: "Art. 179decies CP (deepfake non consenti) + Art. 146 CP (escroquerie 340 victimes — CHF 800'000) + Art. 173 CP (diffamation) en concours réel. Peine d'ensemble Art. 49 CP.",
            ok: true, pts: 25,
            fb: "Qualification complète. Art. 179decies CP : personnalité non consentante représentée dans un contexte fallacieux avec dessein d'enrichissement. Art. 146 CP : deepfake 'astucieux' par définition (simule vérité vérifiable). ATF 146 IV 23 : diffuseurs de la vidéo aussi responsables.",
            legal: "Art. 179decies CP + Art. 146 CP + Art. 173 CP + ATF 146 IV 23 (diffuseurs).",
            critical: false, next: 1,
          },
          {
            text: "Art. 146 CP seul — les victimes financières sont le préjudice principal.",
            ok: false, pts: -10,
            fb: "La personnalité est aussi victime — Art. 179decies CP la protège indépendamment du préjudice financier des tiers. Elle peut se constituer partie plaignante sur ce chef spécifiquement.",
            legal: "Art. 179decies CP — Protection de la personnalité : infraction autonome.",
            critical: false, next: 1,
          },
        ],
      },
      {
        phase: "🔬 Authentification forensique du deepfake",
        situation: `La défense argue que la vidéo est «&nbsp;simplement une publicité satirique&nbsp;». Vous devez authentifier la nature synthétique par méthodes forensiques documentées.`,
        law: "<strong>Art. 184 CPP</strong> — Méthode documentée et reproductible.<br><strong>ENISA AI Fraud 2024</strong> — Standards détection deepfake audio-vidéo.<br><strong>ATF 144 IV 345</strong> — Preuve par indices convergents.",
        question: "<strong>Quels marqueurs forensiques fiables pour authentifier un deepfake vidéo ?</strong>",
        choices: [
          {
            text: "La qualité de l'image est inférieure — les deepfakes sont de moins bonne qualité.",
            ok: false, pts: -20,
            fb: "Critère dépassé. En 2024-2026, les deepfakes professionnels sont indiscernables à l'œil nu (UCL 2024 : 9/10 humains trompés). La qualité perçue n'est plus un indicateur fiable.",
            legal: "ENISA 2024 — Qualité ≠ critère de détection. Analyse spectrale requise.",
            critical: false, next: 2,
          },
          {
            text: "5 marqueurs convergents : (1) Spectrale FFT — coupures harmoniques >8kHz (signature TTS), (2) Pattern de clignement incompatible avec profil physiologique de la personne, (3) Divergence formantique vocale >15% vs enregistrements authentiques, (4) Incohérence shadow map vs source lumineuse, (5) Artefacts compression JPEG anormaux autour du visage.",
            ok: true, pts: 25,
            fb: "Méthode d'expert conforme ENISA 2024. 5 marqueurs indépendants convergents = preuve par indices (ATF 144 IV 345). La divergence formantique (>15%) est particulièrement solide car comparée à des enregistrements authentiques — difficile à contester. Les artefacts JPEG révèlent le compositing même dans les deepfakes haute qualité.",
            legal: "ENISA 2024 + ATF 144 IV 345 — 5 marqueurs convergents = preuve forensique solide.",
            critical: false, next: 2,
          },
          {
            text: "Soumettre à un outil IA de détection — résultat objectif.",
            ok: false, pts: -10,
            fb: "Un seul outil IA n'est pas suffisant comme preuve judiciaire — taux de faux positifs, méthodologie non auditable. La combinaison de 5 marqueurs techniques documentés par un expert humain est bien plus robuste devant un tribunal.",
            legal: "Art. 184 CPP — Méthode documentée et reproductible. Score IA seul = contestable.",
            critical: false, next: 2,
          },
        ],
      },
      {
        phase: "🌐 Traçage de l'infrastructure publicitaire",
        situation: `Vidéo diffusée via publicités payantes. Domaines enregistrés anonymement chez Njalla (Seychelles). Paiements publicitaires par cartes prépayées. Fonds victimes vers comptes en Asie du Sud-Est.`,
        law: "<strong>DSA Art. 9</strong> — Obligation des plateformes de coopérer avec les autorités judiciaires.<br><strong>Convention Budapest Art. 29</strong> — Conservation urgente chez les registrars.<br><strong>Art. 48a EIMP</strong> — Entraide simplifiée.",
        question: "<strong>Quelle stratégie pour identifier les opérateurs derrière Njalla ?</strong>",
        choices: [
          {
            text: "Demande directe à Njalla (Seychelles) — obligation Budapest.",
            ok: false, pts: -10,
            fb: "Njalla est réputé pour sa politique de non-divulgation. La stratégie directe a de faibles chances. Combiner : DSA Art. 9 (plateformes publicitaires) pour données de paiement des campagnes + forensique blockchain sur les fonds victimes = voies plus productives.",
            legal: "DSA Art. 9 + blockchain = voies prioritaires vs registrar anonyme.",
            critical: false, next: 3,
          },
          {
            text: "Triple stratégie : (1) Convention Budapest Art. 29 — conservation urgente Njalla, (2) DSA Art. 9 — demande aux plateformes publicitaires pour données de paiement campagnes et comptes annonceurs, (3) Chainalysis/Crystal sur flux crypto victimes — remonter aux exchanges avec KYC.",
            ok: true, pts: 25,
            fb: "Stratégie multi-canal optimale. DSA Art. 9 souvent sous-utilisé : Meta et Google ont des obligations de coopération judiciaire — les données de paiement des campagnes publicitaires sont plus précises que les données registrar. Forensique blockchain : remonter aux exchanges avec KYC en quelques semaines.",
            legal: "DSA Art. 9 + Convention Budapest Art. 29 + blockchain — Triple canal.",
            critical: false, next: 3,
          },
          {
            text: "Infiltrer les réseaux de distribution du deepfake.",
            ok: false, pts: -15,
            fb: "L'infiltration en ligne = Art. 286 CPP (ordonnance MP + autorisation TMC). Mesure de dernier recours (Art. 197 CPP). Les voies légales classiques (DSA, blockchain) sont plus rapides et moins risquées.",
            legal: "Art. 286 CPP — Enquête couverte : mesure de dernier recours.",
            critical: false, next: 3,
          },
        ],
      },
      {
        phase: "⚖️ Le retrait rapide — voie civile",
        situation: `La personnalité officielle veut faire retirer la vidéo d'urgence, indépendamment de la procédure pénale en cours qui prendra des années.`,
        law: "<strong>Art. 28a CC</strong> — Mesures provisionnelles : cessation de l'atteinte à la personnalité en 48-72h.<br><strong>DSA Art. 16</strong> — Mécanisme de signalement de contenu illicite aux plateformes.<br><strong>Art. 28l CC</strong> — Réparation du tort moral.",
        question: "<strong>Quelle voie permet le retrait le plus rapide de la vidéo ?</strong>",
        choices: [
          {
            text: "Attendre la condamnation pénale — elle s'imposera aux plateformes.",
            ok: false, pts: -15,
            fb: "La procédure pénale dure des années. La vidéo accumule des victimes pendant ce temps. Art. 28a CC : retrait possible en 48-72h via mesures provisionnelles civiles — sans attendre le pénal.",
            legal: "Art. 28a CC — Mesures provisionnelles : retrait en 48-72h sans attendre jugement pénal.",
            critical: false, next: "end",
          },
          {
            text: "Requête en mesures provisionnelles (Art. 28a CC) — retrait immédiat en 48-72h. Parallèlement : notification DSA Art. 16 aux plateformes pour retrait volontaire encore plus rapide.",
            ok: true, pts: 25,
            fb: "Stratégie optimale. Art. 28a CC : le juge civil peut ordonner la cessation immédiate de l'atteinte à la personnalité en urgence. DSA Art. 16 (signalement contenu illicite) peut déclencher un retrait volontaire encore plus rapide. Ces deux voies agissent en parallèle du pénal.",
            legal: "Art. 28a CC (mesures provisionnelles rapides) + DSA Art. 16 (signalement plateformes).",
            critical: false, next: "end",
          },
          {
            text: "Porter plainte pénale pour Art. 179decies CP — la voie pénale suffit.",
            ok: false, pts: -5,
            fb: "La plainte pénale est nécessaire mais n'ordonne pas directement le retrait de la vidéo des plateformes. Art. 28a CC est le seul mécanisme permettant d'ordonner à une tierce partie (plateforme) de retirer le contenu en urgence.",
            legal: "Voie pénale = poursuite auteurs. Art. 28a CC = retrait immédiat du contenu.",
            critical: false, next: "end",
          },
        ],
      },
    ],
    badgeFn: function(pct) {
      if (pct >= 88) return { icon: "🎭", title: "Expert Art. 179decies CP", sub: "Deepfake légal, forensique audio-vidéo, Art. 28a CC maîtrisés" };
      if (pct >= 65) return { icon: "🔬", title: "Analyste IA Forensique", sub: "Bonne maîtrise d'Art. 179decies CP et de la détection deepfake" };
      if (pct >= 45) return { icon: "⚖️", title: "Juriste Numérique", sub: "Approfondissez Art. 179decies CP et Art. 28a CC" };
      return { icon: "📚", title: "Formation deepfake légal requise", sub: "Art. 179decies CP + forensique + DSA" };
    },
  },

];
