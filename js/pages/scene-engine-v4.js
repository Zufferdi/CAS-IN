/**
 * CAS-IN — Scene Engine v4
 * ──────────────────────────────────────────────────────────────
 * 4 améliorations pédagogiques majeures, en patch non-intrusif :
 *
 *   1. BRIEFING REPENSÉ
 *      Fiche d'identité (durée, articles centraux, atmosphère, niveau),
 *      objectifs pédagogiques visibles (gère string ET {icon,text}),
 *      pré-warning automatique pour les scénarios sensibles.
 *
 *   2. RÉCAP DÉCISIONNEL EXPORTABLE
 *      Boutons "📑 Exporter MD" et "📋 Copier" sur l'écran rapport.
 *      Génère un markdown complet : décisions prises + non prises,
 *      feedbacks, références juridiques, badges.
 *
 *   3. MODE RÉVISION
 *      Bouton "📖 Réviser" sur le rapport. Rejoue la scène en mode
 *      étude : toutes les options visibles avec leur ok/pts/fb,
 *      pas de timer, pas de score, pas de critique.
 *
 *   4. GLOSSAIRE ARTICLES DE LOI
 *      Tooltip click-to-expand sur "art. X CPP/CP/CC/...".
 *      Lien vers la fiche /fiches/*.html quand pertinente.
 *      Idempotent (ne re-wrap pas).
 *
 * Le patch wrap les fonctions globales (startScene, showReport,
 * renderStep, selectChoice). Aucune modification du noyau.
 * Rollback total : retirer la ligne <script src="..."> de scene.html.
 */
(function() {
  'use strict';

  if (window.__casEngineV4Installed) return;

  // ═══════════════════════════════════════════════════════════
  //  GLOSSAIRE DES ARTICLES — ~80 entrées pour les ~60 plus cités
  // ═══════════════════════════════════════════════════════════
  const LEGAL_GLOSSARY = {
    // ═══ CPP — Code de procédure pénale ═══
    'art. 24 CPP':         { title: 'Compétences MPC', summary: 'Liste les infractions de compétence fédérale (terrorisme, criminalité organisée, blanchiment international).', fiche: 'autorites_competences_ch.html' },
    'art. 73 CPP':         { title: 'Confidentialité de la procédure', summary: 'Les autorités pénales gardent secrets les éléments de procédure. Base de l\'art. 320 CP pour le procureur.', fiche: 'droit.html' },
    'art. 140 CPP':        { title: 'Méthodes interdites', summary: 'Tromperie, contrainte, menaces, promesses interdites. Aucune exception, même en urgence vitale (ATF 135 IV 130).', fiche: 'droit.html' },
    'art. 141 CPP':        { title: 'Preuves illicites', summary: 'Al. 1 : nullité absolue. Al. 2 : balance d\'intérêts. Al. 4 : fruit de l\'arbre empoisonné.', fiche: 'preuve.html' },
    'art. 141 al. 2 CPP':  { title: 'Preuves illicites — balance', summary: 'Preuves recueillies en violation de prescriptions de validité = inexploitables sauf si indispensables pour des infractions graves.', fiche: 'preuve.html' },
    'art. 158 CPP':        { title: 'Information du prévenu', summary: 'Avant toute audition : faits reprochés, droit au silence, droit à un avocat, droit à un interprète.', fiche: 'premier_intervenant.html' },
    'art. 158 al. 2 CPP':  { title: 'Sanction art. 158', summary: 'Auditions menées sans information préalable des droits = irrecevables (art. 141 al. 2 CPP).', fiche: 'premier_intervenant.html' },
    'art. 184 CPP':        { title: 'Expertise', summary: 'Mandat d\'expertise par la direction de procédure. L\'expert est désigné par l\'autorité, pas par les parties.', fiche: 'expert_witness_ch.html' },
    'art. 195 CPP':        { title: 'Audition de témoins', summary: 'Témoins entendus selon procédure formelle (PV signé, droits notifiés).', fiche: 'preuve.html' },
    'art. 197 CPP':        { title: 'Conditions des mesures de contrainte', summary: 'Admissible si : (a) prévue par la loi, (b) soupçons suffisants, (c) proportionnée, (d) gravité justifiée.', fiche: 'preuve.html' },
    'art. 219 CPP':        { title: 'Garde à vue (24h max)', summary: 'Police peut détenir un suspect 24h max. Au-delà, présentation au procureur ou au juge des mineurs.', fiche: 'premier_intervenant.html' },
    'art. 220 CPP':        { title: 'Détention provisoire', summary: 'Conditions : soupçons graves + risque de fuite, collusion ou récidive. Décision TMC.' },
    'art. 221 CPP':        { title: 'Motifs de détention', summary: 'Soupçons graves + risque de fuite (a), collusion (b), réitération (c) ou de passage à l\'acte (d).' },
    'art. 248 CPP':        { title: 'Mise sous scellés', summary: 'À la demande de l\'intéressé, scellés posés sur les supports saisis. Procédure de levée par le TMC.', fiche: 'preuve.html' },
    'art. 255 CPP':        { title: 'Profil ADN — prélèvement', summary: 'Conditions strictes : soupçon individualisé, infractions graves. Pas de prélèvement contraint sans base.' },
    'art. 263 CPP':        { title: 'Séquestre', summary: 'Saisie d\'objets ou valeurs susceptibles d\'être confisqués, restitués ou servir comme preuves.' },
    'art. 269 CPP':        { title: 'Surveillance des télécommunications', summary: 'Écoutes téléphoniques sur autorisation TMC. Conditions : infractions du catalogue, soupçons graves, subsidiarité.', fiche: 'lscpt.html' },
    'art. 280 CPP':        { title: 'Surveillance par dispositifs techniques', summary: 'Caméras, balises GPS, micros cachés sur autorisation TMC. Mêmes garanties que art. 269 CPP.' },
    'art. 269bis CPP':     { title: 'GovWare (State trojans)', summary: 'Logiciels d\'investigation déployés sur des appareils. Conditions strictes : autorisation TMC, traçabilité, minimisation.' },
    'art. 277 CPP':        { title: 'Surveillance — exploitation des résultats', summary: 'Les éléments collectés par surveillance ne peuvent être utilisés que pour les infractions ayant motivé l\'autorisation.' },
    'art. 11 CPP':         { title: 'Ne bis in idem', summary: 'Aucune personne ne peut être poursuivie ou condamnée 2 fois pour les mêmes faits. Principe de l\'unité de la procédure.' },
    'art. 22 CPP':         { title: 'Compétence à raison du lieu', summary: 'Compétence cantonale au lieu de commission. Plusieurs lieux possibles = procureur saisi en premier.' },
    'art. 24 al. 1 CPP':   { title: 'Compétences MPC — al. 1', summary: 'Liste des infractions de compétence fédérale obligatoire (terrorisme, organisation criminelle, blanchiment international).' },
    'art. 24 al. 2 CPP':   { title: 'Compétences MPC — al. 2', summary: 'Compétences fédérales subsidiaires : si l\'auteur a agi à l\'étranger ou si plusieurs cantons sont touchés.' },
    'art. 26 CPP':         { title: 'Conflit de compétence', summary: 'Tranché par le Tribunal pénal fédéral (TPF) si litige entre cantons ou entre canton et MPC.' },
    'art. 28 CPP':         { title: 'Délégation à la Confédération', summary: 'Le canton peut déléguer une procédure à la Confédération si l\'enjeu dépasse le cadre cantonal.' },
    'art. 113 CPP':        { title: 'Droit de garder le silence', summary: 'Le prévenu n\'est pas tenu de déposer ni de collaborer. Refus de répondre = pas une preuve à charge.' },
    'art. 139 CPP':        { title: 'Administration des preuves', summary: 'L\'autorité administre les preuves nécessaires à l\'établissement des faits. Toute preuve pertinente doit être recueillie.' },
    'art. 141 al. 4 CPP':  { title: 'Fruit de l\'arbre empoisonné', summary: 'Les preuves dérivées d\'une preuve illicite sont également inexploitables, sauf si découvrables indépendamment.', fiche: 'preuve.html' },
    'art. 159 CPP':        { title: 'Audition par la police', summary: 'Première audition policière — l\'avocat peut assister dès la première audition. Information art. 158 CPP préalable.' },
    'art. 168 CPP':        { title: 'Témoin par alliance familiale', summary: 'Conjoint, parents, enfants peuvent refuser de témoigner. Protection de la cohésion familiale.' },
    'art. 186 CP':         { title: 'Violation de domicile', summary: 'Pénétrer dans un domicile contre la volonté de l\'occupant. Délit poursuivi sur plainte.' },
    'art. 241 al. 3 CPP':  { title: 'Perquisition — domicile', summary: 'Perquisition au domicile d\'une personne sans son consentement nécessite l\'autorisation du procureur.' },
    'art. 245 CPP':        { title: 'Fouille de personnes', summary: 'Fouille corporelle. Conditions : soupçons + proportionnalité. Personne du même sexe pour fouille intime.' },
    'art. 280 CP':         { title: 'Falsification du résultat d\'une votation', summary: 'Manipulation des résultats de votations/élections. Application possible aux deepfakes pré-scrutin.' },
    'art. 304 CP':         { title: 'Fausse dénonciation', summary: 'Imputer faussement une infraction à quelqu\'un en sachant qu\'il est innocent.' },
    'art. 67 al. 2 EIMP':  { title: 'Spécialité — exceptions', summary: 'Le principe de spécialité connaît des exceptions étroites (poursuite des faits connexes, accord de l\'État requis).' },
    'art. 11 Cst':         { title: 'Protection des enfants et des jeunes', summary: 'Droit constitutionnel à une protection particulière de l\'intégrité et au développement.' },
    'art. 13 Cst':         { title: 'Protection de la sphère privée', summary: 'Droit au respect de la vie privée et familiale. Pendant constitutionnel de l\'art. 8 CEDH.' },
    'art. 29 al. 2 Cst':   { title: 'Droit d\'être entendu', summary: 'Toute personne a le droit d\'être entendue dans une procédure la concernant. Pilier de l\'État de droit.' },
    'art. 34 Cst':         { title: 'Droits politiques', summary: 'Garantie de la libre formation de l\'opinion et de l\'expression fidèle du vote. Base anti-deepfake électoral.' },
    'art. 19 LPD':         { title: 'Information lors de la collecte', summary: 'Le responsable doit informer la personne concernée de la finalité du traitement, du destinataire et de l\'existence de transferts à l\'étranger.' },
    'art. 35 LPD':         { title: 'Registre des activités', summary: 'Le responsable du traitement tient un registre des activités. Obligatoire au-delà d\'un certain seuil.' },
    'art. 22a al. 5 LPers':{ title: 'Lanceur d\'alerte — protection', summary: 'Protection contre les représailles : pas de licenciement, pas de mesure défavorable suite à un signalement de bonne foi.' },
    'art. 45 LMP':         { title: 'Sanctions administratives (marchés publics)', summary: 'Exclusion des marchés publics, amendes, dommages-intérêts. Procédure devant la CFM.' },
    'art. 23 CC':          { title: 'Domicile', summary: 'Le domicile d\'une personne est le lieu où elle réside avec l\'intention de s\'y établir.' },
    'art. 3 CP':           { title: 'Champ d\'application territorial', summary: 'Le CP s\'applique à quiconque commet un crime ou un délit en Suisse.' },
    'art. 8 CP':           { title: 'Lieu de commission', summary: 'Une infraction est réputée commise tant au lieu où l\'auteur a agi qu\'au lieu où le résultat s\'est produit.' },
    'art. 146 al. 2 CP':   { title: 'Escroquerie aggravée', summary: 'Escroquerie par métier ou en bande. Peine privative jusqu\'à 10 ans.' },
    'art. 144bis al. 2 CP':{ title: 'Détérioration de données aggravée', summary: 'Cas grave : par métier, dommage important, atteinte à infrastructure. Peine jusqu\'à 5 ans.' },
    'art. 2 CEDH':         { title: 'Droit à la vie', summary: 'Droit garanti par la loi. Aucune exception possible. Inclut obligation positive de l\'État de protéger.' },
    'art. 282 CPP':        { title: 'Observation policière', summary: 'Observation de personnes et de lieux par la police. Pas d\'autorisation TMC requise pour observation simple.' },
    'art. 285a CPP':       { title: 'Investigation secrète — définition', summary: 'Agents avec identité fictive infiltrent un milieu criminel pour élucider des infractions graves.' },
    'art. 286 CPP':        { title: 'Investigation secrète — conditions', summary: 'Conditions : gravité, subsidiarité, proportionnalité. Al. 4 : interdiction absolue de provocation.' },
    'art. 286 al. 4 CPP':  { title: 'Interdiction de provocation', summary: 'L\'agent ne peut pas inciter à une infraction qui n\'aurait pas eu lieu sans lui (ATF 144 IV 23).' },
    'art. 287 CPP':        { title: 'Investigation secrète — durée', summary: 'Durée max 12 mois, prolongeable de 6 mois sur autorisation TMC.' },
    'art. 289 CPP':        { title: 'Investigation secrète — procédure', summary: 'Décision écrite du TMC requise avant et pendant l\'opération, avec rapports périodiques.' },
    'art. 366 CPP':        { title: 'Procédure par défaut', summary: 'Possibilité de juger un prévenu absent si toutes les voies pour l\'amener au procès ont échoué.' },
    // ═══ CP — Code pénal ═══
    'art. 17 CP':          { title: 'État de nécessité', summary: 'Acte commis pour préserver un bien menacé d\'un danger imminent, non causé par l\'auteur, et proportionné.' },
    'art. 17a CP':         { title: 'Lanceur d\'alerte (depuis 2023)', summary: 'Justification pénale pour lanceur d\'alerte de bonne foi qui a respecté la voie hiérarchique avant d\'aller au public.' },
    'art. 25 CP':          { title: 'Complicité', summary: 'Participation accessoire à une infraction d\'autrui. Peine atténuée par rapport à l\'auteur principal.' },
    'art. 47 CP':          { title: 'Fixation de la peine', summary: 'Peine proportionnée à la culpabilité. Tient compte des circonstances aggravantes et atténuantes.' },
    'art. 67 CP':          { title: 'Interdiction de profession', summary: 'Mesure préventive pouvant interdire l\'exercice d\'une profession liée à l\'infraction.' },
    'art. 111 CP':         { title: 'Meurtre', summary: 'Tuer intentionnellement. Peine privative de liberté de 5 ans au moins.' },
    'art. 114 CP':         { title: 'Meurtre sur la demande de la victime', summary: 'Tuer une personne sur sa demande sérieuse et instante. Distinct du suicide assisté art. 115 CP.' },
    'art. 115 CP':         { title: 'Incitation et assistance au suicide', summary: 'Punissable seulement si mobile égoïste. EXIT (à but non lucratif) n\'est pas couvert par l\'art. 115 CP.' },
    'art. 117 CP':         { title: 'Homicide par négligence', summary: 'Causer la mort par négligence. Peine privative de liberté jusqu\'à 3 ans.' },
    'art. 139 CP':         { title: 'Vol', summary: 'Soustraire une chose mobilière à autrui dans un but d\'appropriation. Aggravé en bande / par métier / avec violence.' },
    'art. 143 CP':         { title: 'Soustraction de données', summary: 'Accéder sans droit à des données électroniques pour soi ou un tiers. Peine privative de liberté jusqu\'à 5 ans.' },
    'art. 143bis CP':      { title: 'Accès indu à un système informatique', summary: 'Pénètre sans droit dans un système informatique protégé. Délit poursuivi sur plainte.' },
    'art. 144bis CP':      { title: 'Détérioration de données', summary: 'Modifier, effacer ou rendre inutilisables des données électroniques. Peine privative de liberté jusqu\'à 5 ans.' },
    'art. 146 CP':         { title: 'Escroquerie', summary: 'Tromperie astucieuse pour obtenir un avantage illicite. Aggravée par métier ou bande.' },
    'art. 147 CP':         { title: 'Utilisation frauduleuse d\'un ordinateur', summary: 'Manipulation d\'un système informatique pour obtenir un avantage illicite (skimming, fraude au DAB, etc.).' },
    'art. 156 CP':         { title: 'Extorsion', summary: 'Contrainte pour obtenir un avantage illicite (chantage, menaces). Peine jusqu\'à 5 ans.' },
    'art. 173 CP':         { title: 'Diffamation', summary: 'Faits portés en public sans preuves de leur véracité. Peut être justifié par la véracité (art. 173 al. 2).' },
    'art. 174 CP':         { title: 'Calomnie', summary: 'Diffusion en public de faits faux que l\'auteur sait inexacts. Plus grave que la diffamation.' },
    'art. 179novies CP':   { title: 'Atteinte vie privée — image', summary: 'Filmer ou photographier sans consentement dans la sphère privée. Étendu par jurisprudence aux AirTags.' },
    'art. 179octies CP':   { title: 'Mise sous écoute', summary: 'Enregistrer des conversations privées sans consentement. Punissable même sans diffusion.' },
    'art. 179decies CP':   { title: 'Deepfakes (révision en cours)', summary: 'Atteinte à l\'image par synthèse trompeuse. Loi en cours d\'évolution suite aux deepfakes IA.' },
    'art. 181 CP':         { title: 'Contrainte', summary: 'Restreindre la liberté de quelqu\'un par menace ou pression considérable. Standard exigeant.' },
    'art. 182 CP':         { title: 'Traite d\'êtres humains', summary: 'Exploitation de vulnérabilité (mineurs, migrants) à des fins sexuelles, de travail forcé ou prélèvement d\'organes. Peine jusqu\'à 20 ans.' },
    'art. 183 CP':         { title: 'Séquestration', summary: 'Privation illicite de liberté. Aggravée si sur mineur ou avec cruauté.' },
    'art. 190 CP':         { title: 'Viol', summary: 'Contrainte sexuelle complète. Peine privative de liberté de 1 à 10 ans (peut atteindre 15 si cruauté).' },
    'art. 197 CP':         { title: 'Pornographie', summary: 'Détention/diffusion. Aggravée pour pornographie avec mineurs (matériel pédocriminel).' },
    'art. 251 CP':         { title: 'Faux dans les titres', summary: 'Confection ou usage d\'un titre faux. ATF 102 IV 191 : indifférence du moyen (manuel ou IA générative).' },
    'art. 252 CP':         { title: 'Faux titre — cas grave (commerce)', summary: 'Faux dans les titres commis dans le commerce. Peine aggravée jusqu\'à 5 ans.' },
    'art. 271 CP':         { title: 'Actes pour État étranger', summary: 'Actes accomplis sur sol suisse pour un État étranger sans autorisation. Aussi en miroir : agent suisse à l\'étranger.' },
    'art. 271 al. 1 CP':   { title: 'Actes prohibés sans autorisation', summary: 'L\'al. 1 vise spécifiquement les actes accomplis sur sol suisse pour un État ou parti étranger.' },
    'art. 273 CP':         { title: 'Service de renseignements économiques', summary: 'Espionnage économique au profit d\'un État ou d\'organisations étrangères. Pivot des affaires d\'extraterritorialité.' },
    'art. 292 CP':         { title: 'Insoumission à une décision', summary: 'Désobéissance à une décision officielle dûment notifiée comportant une menace de la peine prévue par l\'art. 292.' },
    'art. 296 CP':         { title: 'Outrage à un État étranger', summary: 'Insulte ou offense publique à un État étranger ou à ses représentants. Plainte requise.' },
    'art. 305 CP':         { title: 'Entrave à l\'action pénale', summary: 'Soustraire une personne à la poursuite ou à l\'exécution d\'une peine. Peine privative de liberté jusqu\'à 3 ans.' },
    'art. 305bis CP':      { title: 'Blanchiment', summary: 'Acte propre à entraver l\'identification, la découverte ou la confiscation de valeurs criminelles.' },
    'art. 305bis al. 2 CP':{ title: 'Blanchiment aggravé', summary: 'Cas grave : par métier, bande, dans une organisation. Peine jusqu\'à 5 ans + amende.' },
    'art. 305ter CP':      { title: 'Banquier diligent', summary: 'Obligation de diligence dans la prévention du blanchiment. Communications MROS sur soupçons.', fiche: 'droit.html' },
    'art. 312 CP':         { title: 'Abus d\'autorité', summary: 'Fonctionnaire qui abuse de ses pouvoirs pour porter préjudice. Sanction : peine privative jusqu\'à 5 ans.' },
    'art. 320 CP':         { title: 'Violation du secret de fonction', summary: 'Fonctionnaire qui révèle un secret connu en raison de sa fonction. Peine jusqu\'à 3 ans.' },
    'art. 322ter CP':      { title: 'Corruption d\'agents publics', summary: 'Corruption active. Promesse, octroi ou acceptation d\'avantage indu pour un acte de service.' },
    'art. 322septies CP':  { title: 'Corruption privée', summary: 'Corruption dans le secteur privé. Punissable depuis 2016.' },
    // ═══ CC — Code civil ═══
    'art. 12 CC':          { title: 'Capacité de discernement', summary: 'Capacité d\'agir raisonnablement. Distincte de la liberté de la volonté (art. 469 CC).' },
    'art. 28 CC':          { title: 'Protection de la personnalité', summary: 'Action civile contre toute atteinte injustifiée à la personnalité. Base des actions contre médias.' },
    'art. 28b CC':         { title: 'Protection contre la violence', summary: 'Mesures civiles d\'éloignement (interdiction de contact, périmètre). Ordonnance d\'urgence en 48h.' },
    'art. 467 CC':         { title: 'Capacité de tester', summary: 'Toute personne capable de discernement et âgée de 18 ans peut disposer de ses biens par testament.' },
    'art. 469 CC':         { title: 'Vices de la volonté du testateur', summary: 'Testament annulable si l\'erreur, le dol ou la menace ont influencé la volonté du testateur.' },
    // ═══ EIMP ═══
    'art. 64 EIMP':        { title: 'Mesures de contrainte (entraide)', summary: 'Mesures autorisées si les faits constituent une infraction selon le droit suisse (double incrimination).', fiche: 'eimp_entraide.html' },
    'art. 67 EIMP':        { title: 'Principe de spécialité', summary: 'Les éléments transmis par entraide ne peuvent être utilisés que pour les infractions mentionnées dans la demande.', fiche: 'eimp_entraide.html' },
    'art. 80a EIMP':       { title: 'Voies de recours (entraide)', summary: 'Recours admis contre la décision finale et celle qui ordonne la transmission de moyens de preuve.' },
    'art. 80e EIMP':       { title: 'Recours suspensif (entraide)', summary: 'Le recours contre la décision de clôture peut suspendre la transmission des éléments.' },
    'art. 80g EIMP':       { title: 'Recours — délai et qualité', summary: 'Délai de 30 jours pour le recours. Qualité pour recourir : personne directement et personnellement touchée.' },
    'art. 80m EIMP':       { title: 'Décision de clôture', summary: 'Décision qui ordonne la transmission de moyens de preuve à l\'étranger. Recours suspensif possible.' },
    'art. 80m al. 2 EIMP': { title: 'Délai de clôture', summary: 'Décision finale dans un délai raisonnable. La célérité est un principe directeur de l\'entraide.' },
    // ═══ Cst — Constitution fédérale ═══
    'art. 32 Cst':         { title: 'Droits du prévenu', summary: 'Droit d\'être informé, d\'être assisté d\'un défenseur, présomption d\'innocence.' },
    'art. 32 al. 2 Cst':   { title: 'Droit à un défenseur', summary: 'Droit constitutionnel d\'être assisté d\'un défenseur dès la procédure pénale.' },
    'art. 36 Cst':         { title: 'Restriction des droits fondamentaux', summary: 'Conditions : (a) base légale, (b) intérêt public ou protection d\'autrui, (c) proportionnalité, (d) noyau intangible préservé.' },
    'art. 169 Cst':        { title: 'Haute surveillance parlementaire', summary: 'Pouvoir du Parlement de surveiller le Conseil fédéral et l\'administration. Limite : indépendance judiciaire (art. 191c).' },
    'art. 191c Cst':       { title: 'Indépendance des autorités judiciaires', summary: 'Les autorités judiciaires sont indépendantes dans l\'exercice de leur fonction. Limite la haute surveillance art. 169.' },
    // ═══ LB / LBA / LFINMA / LPD / LPers ═══
    'art. 47 LB':          { title: 'Secret bancaire', summary: 'Violation du secret bancaire. Peine privative jusqu\'à 3 ans (5 dans cas graves).' },
    'art. 49 LFINMA':      { title: 'Devoir d\'information', summary: 'Obligations d\'information vis-à-vis de la FINMA pour les établissements assujettis.' },
    'art. 22 LPD':         { title: 'Données génétiques sensibles', summary: 'Données génétiques = catégorie sensible. Traitement strictement encadré, base légale formelle requise.' },
    'art. 22a LPers':      { title: 'Lanceur d\'alerte fédéral', summary: 'Protection des employés fédéraux signalant des actes de mauvaise conduite. Pas d\'équivalent privé en Suisse.' },
    // ═══ LParl ═══
    'art. 162 LParl':      { title: 'Droit d\'information du parlementaire', summary: 'Parlementaire individuel a droit à l\'information générale. Limites : exceptions légales (art. 73 CPP) et constitutionnelles.' },
    // ═══ PPMin ═══
    'art. 4 PPMin':        { title: 'Personne de confiance (mineur)', summary: 'Le mineur a en tout temps droit à une personne de confiance. À défaut, tuteur ad hoc désigné par le juge de paix.' },
    'art. 24 PPMin':       { title: 'Détention provisoire mineur (max 7 jours)', summary: 'Détention provisoire mineur = mesure de dernier recours. Audience devant juge des mineurs sous 7 jours.' },
    // ═══ CEDH ═══
    'art. 3 CEDH':         { title: 'Interdiction torture/traitements dégradants', summary: 'Aucune exception possible. Inclut les traitements inhumains et dégradants.' },
    'art. 6 CEDH':         { title: 'Procès équitable', summary: 'Droit à un procès équitable, public, dans un délai raisonnable, devant un tribunal indépendant.' },
    'art. 8 CEDH':         { title: 'Droit au respect de la vie privée', summary: 'Vie privée, familiale, domicile, correspondance. Restrictions admises selon art. 8 al. 2.' },
    'art. 13 CEDH':        { title: 'Droit à un recours effectif', summary: 'Toute personne dont les droits CEDH ont été violés a droit à un recours effectif devant une instance nationale.' },
  };

  // Tags = sujets sensibles à pré-warner avant le briefing
  const SENSITIVE_TAGS = [
    'MINEUR', 'PÉDOCRIMINALITÉ', 'SUICIDE ASSISTÉ', 'VIOLENCE CONJUGALE',
    'TRAITE EH', 'PROSTITUTION', 'CRYPTO-STALKING', 'LIVESTREAM', 'VIOLS À DISTANCE',
    'AGRESSION SEXUELLE', 'HARCÈLEMENT'
  ];

  // Regex pour détecter les articles dans le texte
  const ARTICLE_RE = /art\.\s*(\d+[a-z]*(?:bis|ter|quater|quinquies|sexies|septies|octies|novies|decies)?)(\s*al\.\s*(\d+))?\s*(CP|CPP|CC|CO|Cst|EIMP|LCD|LPD|LB|LBA|LMP|LParl|LFINMA|LFRC|LRC|LRens|LPers|LSCPT|LADN|LFAS|LAVI|PPMin|RGPD|CEDH)\b/g;

  // ═══════════════════════════════════════════════════════════
  //  STYLES — injectés une fois
  // ═══════════════════════════════════════════════════════════
  function injectStyles() {
    if (document.getElementById('engine-v4-styles')) return;
    const s = document.createElement('style');
    s.id = 'engine-v4-styles';
    s.textContent = `
      /* ── Briefing — fiche d'identité ── */
      .v4-briefing-id {
        background: linear-gradient(135deg, rgba(0,229,204,.06), rgba(106,184,255,.03));
        border: 1px solid var(--border);
        border-radius: var(--r);
        padding: 12px 14px;
        margin: 12px 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px;
      }
      .v4-id-cell { display: flex; flex-direction: column; gap: 2px; }
      .v4-id-label {
        font-size: 9px; font-weight: 700; color: var(--dim);
        letter-spacing: 1.2px; font-family: var(--font-mono); text-transform: uppercase;
      }
      .v4-id-value {
        font-size: 13px; font-weight: 600; color: var(--text);
        font-family: var(--font-body); line-height: 1.3;
      }
      .v4-id-articles {
        display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;
      }
      .v4-art-pill {
        font-size: 10px; padding: 2px 7px; border-radius: 3px;
        background: var(--surface2); border: 1px solid var(--border);
        color: var(--cyan); font-family: var(--font-mono); font-weight: 700;
      }

      /* ── Briefing — sensitive warning ── */
      .v4-sensitive-warning {
        background: linear-gradient(90deg, rgba(255,159,64,.15), rgba(255,159,64,.04));
        border: 1px solid var(--orange);
        border-left: 4px solid var(--orange);
        border-radius: 6px;
        padding: 11px 14px;
        margin: 10px 0;
        display: flex; align-items: flex-start; gap: 10px;
        font-size: 12px; color: var(--text); line-height: 1.5;
      }
      .v4-sensitive-icon { font-size: 22px; flex-shrink: 0; line-height: 1; }
      .v4-sensitive-body strong { color: var(--orange); }

      /* ── Briefing — objectives forced visible (works for string OR object) ── */
      .v4-objectives-list {
        list-style: none; padding: 0; margin: 12px 0;
        display: flex; flex-direction: column; gap: 6px;
      }
      .v4-objectives-list li {
        padding: 7px 11px; background: var(--surface2);
        border-left: 2px solid var(--cyan); border-radius: 4px;
        font-size: 12px; color: var(--text); line-height: 1.5;
      }
      .v4-obj-icon { margin-right: 6px; }

      /* ── Recap export buttons ── */
      .v4-recap-actions {
        display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 6px 0;
      }
      .v4-recap-btn {
        background: var(--surface2); border: 1px solid var(--border);
        color: var(--text); font-family: var(--font-mono);
        font-size: 11px; font-weight: 700; letter-spacing: .5px;
        padding: 8px 14px; border-radius: 5px; cursor: pointer;
        transition: .15s; display: inline-flex; align-items: center; gap: 6px;
      }
      .v4-recap-btn:hover { border-color: var(--cyan); color: var(--cyan); transform: translateY(-1px); }
      .v4-recap-btn.review { border-color: var(--purple); color: var(--purple); }
      .v4-recap-btn.review:hover { background: rgba(201,125,245,.08); }
      .v4-recap-toast {
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: var(--green); color: #08101c; padding: 9px 16px;
        border-radius: 6px; font-family: var(--font-mono); font-size: 12px;
        font-weight: 700; letter-spacing: .3px;
        z-index: 9999; animation: v4ToastIn .3s ease;
        box-shadow: 0 4px 20px rgba(0,0,0,.4);
      }
      @keyframes v4ToastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(8px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }

      /* ── Review mode banner + choice annotations ── */
      .v4-review-banner {
        background: linear-gradient(90deg, rgba(201,125,245,.18), rgba(201,125,245,.04));
        border: 1px solid var(--purple);
        border-radius: var(--r);
        padding: 10px 14px;
        margin-bottom: 12px;
        display: flex; align-items: center; gap: 10px;
        font-size: 12px;
      }
      .v4-review-banner-icon { font-size: 20px; }
      .v4-review-banner strong { color: var(--purple); }
      .v4-review-exit {
        margin-left: auto; background: transparent; border: 1px solid var(--purple);
        color: var(--purple); font-size: 10px; padding: 4px 10px;
        border-radius: 3px; cursor: pointer; font-family: var(--font-mono);
        font-weight: 700; letter-spacing: .3px;
      }
      .v4-review-exit:hover { background: var(--purple); color: #08101c; }
      .v4-choice-annotated {
        margin-top: 6px; padding: 8px 11px; border-radius: 5px;
        font-size: 11px; line-height: 1.5;
      }
      .v4-choice-annotated.ok { background: rgba(48,232,138,.08); border-left: 2px solid var(--green); }
      .v4-choice-annotated.ko { background: rgba(255,64,96,.06); border-left: 2px solid var(--red); }
      .v4-choice-annotated .v4-pts { font-family: var(--font-mono); font-weight: 700; }
      .v4-choice-annotated.ok .v4-pts { color: var(--green); }
      .v4-choice-annotated.ko .v4-pts { color: var(--red); }
      .v4-choice-annotated .v4-fb {
        margin-top: 4px; color: var(--text); display: block;
      }
      .v4-choice-annotated.critical {
        background: rgba(255,64,96,.12); border-left-color: var(--red);
      }

      /* ── Legal glossary tooltip ── */
      .legal-tip {
        cursor: help; color: var(--cyan);
        border-bottom: 1px dashed var(--cyan); padding-bottom: 1px;
        text-decoration: none; transition: .12s;
      }
      .legal-tip:hover { background: rgba(0,229,204,.08); border-bottom-style: solid; }
      .v4-tooltip {
        position: absolute; z-index: 9998; max-width: 320px;
        background: var(--surface); border: 1px solid var(--cyan);
        border-radius: 8px; padding: 12px 14px;
        box-shadow: 0 8px 32px rgba(0,0,0,.5), 0 0 24px rgba(0,229,204,.18);
        animation: v4TooltipIn .18s ease;
      }
      @keyframes v4TooltipIn {
        from { opacity: 0; transform: translateY(-4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .v4-tooltip-title {
        font-size: 12px; font-weight: 700; color: var(--cyan);
        margin-bottom: 4px; font-family: var(--font-mono); letter-spacing: .3px;
      }
      .v4-tooltip-subtitle {
        font-size: 13px; color: var(--text); font-weight: 600; margin-bottom: 6px;
      }
      .v4-tooltip-body {
        font-size: 12px; color: var(--dim); line-height: 1.5;
      }
      .v4-tooltip-fiche {
        display: inline-block; margin-top: 8px;
        font-size: 11px; color: var(--gold); font-family: var(--font-mono);
        font-weight: 700; text-decoration: none; letter-spacing: .3px;
      }
      .v4-tooltip-fiche:hover { text-decoration: underline; }
      .v4-tooltip-close {
        position: absolute; top: 6px; right: 8px;
        background: none; border: none; color: var(--dim); font-size: 16px;
        cursor: pointer; line-height: 1; padding: 2px 6px;
      }
      .v4-tooltip-close:hover { color: var(--text); }

      @media (max-width: 640px) {
        .v4-briefing-id { grid-template-columns: 1fr 1fr; padding: 10px; gap: 8px; }
        .v4-id-value { font-size: 12px; }
        .v4-tooltip { max-width: 280px; padding: 10px 12px; }
        .v4-recap-btn { padding: 7px 11px; font-size: 10px; }
      }
    `;
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPERS — sensible detection, article extraction, duration
  // ═══════════════════════════════════════════════════════════
  function isSensitiveScene(scene) {
    if (!scene || !scene.tags) return false;
    return scene.tags.some(t => SENSITIVE_TAGS.includes(String(t).toUpperCase()));
  }

  function getSensitiveTopics(scene) {
    if (!scene || !scene.tags) return [];
    return scene.tags.filter(t => SENSITIVE_TAGS.includes(String(t).toUpperCase()));
  }

  function estimateDuration(scene) {
    const stepCount = scene.stepCount || (scene.steps && scene.steps.length) || 5;
    // ~90s per decision + 3 min reading briefing/intro
    const minutes = Math.round(3 + stepCount * 1.5);
    return minutes;
  }

  function extractCentralArticles(scene) {
    if (!scene.legalRefs) return [];
    const articles = [];
    scene.legalRefs.forEach(ref => {
      const m = ref.match(ARTICLE_RE);
      if (m) m.forEach(art => {
        // Normalize the article (collapse whitespace)
        const norm = art.replace(/\s+/g, ' ').trim();
        if (!articles.includes(norm)) articles.push(norm);
      });
    });
    return articles.slice(0, 5);
  }

  // ═══════════════════════════════════════════════════════════
  //  GLOSSARY — wrap article patterns in clickable spans
  // ═══════════════════════════════════════════════════════════
  function wrapLegalRefs(rootEl) {
    if (!rootEl) return;
    // Find all text-bearing elements likely to contain articles
    const targets = rootEl.querySelectorAll(
      '.law-box, .feedback-area, #feedback-area, .review-item, .review-item-fb, .refs-row, .ref-tag, .v4-id-articles, .situation-text, .fb-text, .crit-fb'
    );

    targets.forEach(el => {
      // Skip if already processed
      if (el.dataset.v4Wrapped === '1') return;
      el.dataset.v4Wrapped = '1';
      walkAndWrap(el);
    });
  }

  function walkAndWrap(node) {
    // Avoid descending into already-wrapped or interactive children
    if (!node || !node.childNodes) return;
    const children = [...node.childNodes];
    children.forEach(child => {
      if (child.nodeType === 3 /* TEXT_NODE */) {
        const text = child.nodeValue;
        if (!text || !ARTICLE_RE.test(text)) {
          ARTICLE_RE.lastIndex = 0; // reset regex
          return;
        }
        ARTICLE_RE.lastIndex = 0;
        const frag = buildWrappedFragment(text);
        if (frag) child.parentNode.replaceChild(frag, child);
      } else if (child.nodeType === 1 /* ELEMENT_NODE */) {
        // Skip already-wrapped or links to avoid nested confusion
        if (child.classList && child.classList.contains('legal-tip')) return;
        if (child.tagName === 'A' || child.tagName === 'BUTTON') return;
        walkAndWrap(child);
      }
    });
  }

  function buildWrappedFragment(text) {
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    let m;
    ARTICLE_RE.lastIndex = 0;
    while ((m = ARTICLE_RE.exec(text)) !== null) {
      const matchText = m[0];
      const matchStart = m.index;
      // Append text before the match
      if (matchStart > lastIdx) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx, matchStart)));
      }
      // Build the span
      const span = document.createElement('span');
      span.className = 'legal-tip';
      // Normalize the key for glossary lookup (collapse spaces)
      const norm = matchText.replace(/\s+/g, ' ').trim();
      span.dataset.art = norm;
      span.textContent = matchText;
      span.addEventListener('click', e => {
        e.stopPropagation();
        showTooltip(span, norm);
      });
      frag.appendChild(span);
      lastIdx = matchStart + matchText.length;
    }
    // Append remaining text
    if (lastIdx < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    }
    return frag;
  }

  let activeTooltip = null;

  function closeTooltip() {
    if (activeTooltip && activeTooltip.parentNode) {
      activeTooltip.parentNode.removeChild(activeTooltip);
    }
    activeTooltip = null;
  }

  function showTooltip(target, articleKey) {
    closeTooltip();
    const entry = LEGAL_GLOSSARY[articleKey];
    const tip = document.createElement('div');
    tip.className = 'v4-tooltip';

    let html = `
      <button class="v4-tooltip-close" aria-label="Fermer">×</button>
      <div class="v4-tooltip-title">${articleKey}</div>
    `;
    if (entry) {
      html += `<div class="v4-tooltip-subtitle">${entry.title}</div>`;
      html += `<div class="v4-tooltip-body">${entry.summary}</div>`;
      if (entry.fiche) {
        html += `<a class="v4-tooltip-fiche" href="fiches/${entry.fiche}" target="_blank" rel="noopener">📖 Fiche complète →</a>`;
      }
    } else {
      html += `<div class="v4-tooltip-body">Article non encore documenté dans le glossaire interne. Consulter <a href="https://www.fedlex.admin.ch" target="_blank" rel="noopener" style="color:var(--gold)">fedlex.admin.ch</a> pour le texte officiel.</div>`;
    }
    tip.innerHTML = html;

    document.body.appendChild(tip);
    // Position tooltip near target
    const rect = target.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    let top = rect.bottom + window.scrollY + 8;
    // Keep on screen
    const margin = 8;
    if (left < margin) left = margin;
    if (left + tipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tipRect.width - margin;
    }
    // If tooltip would go off-screen bottom, place above
    if (rect.bottom + tipRect.height + margin > window.innerHeight) {
      top = rect.top + window.scrollY - tipRect.height - 8;
    }
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';

    activeTooltip = tip;
    tip.querySelector('.v4-tooltip-close').addEventListener('click', closeTooltip);
  }

  // Close tooltip on outside click or Escape
  document.addEventListener('click', e => {
    if (!activeTooltip) return;
    if (e.target.closest('.v4-tooltip') || e.target.closest('.legal-tip')) return;
    closeTooltip();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeTooltip();
  });

  // ═══════════════════════════════════════════════════════════
  //  1. BRIEFING ENRICHMENT — fiche d'identité + sensitive warn
  // ═══════════════════════════════════════════════════════════
  function enrichBriefing(scene) {
    const card = document.getElementById('briefing-content');
    if (!card || !scene) return;

    // Avoid double injection
    if (card.querySelector('.v4-briefing-id')) return;

    const stepCount = scene.stepCount || (scene.steps && scene.steps.length) || 0;
    const duration = estimateDuration(scene);
    const articles = extractCentralArticles(scene);
    const atmosphereLabels = {
      legal: 'Légal', network: 'Réseau', ransomware: 'Ransomware',
      crypto: 'Crypto', hospital: 'Hôpital', state: 'État', raid: 'Terrain'
    };
    const atmLabel = atmosphereLabels[scene.atmosphere] || (scene.atmosphere || 'Standard');
    const diffLabel = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile', expert: 'Expert' }[scene.difficulty] || scene.difficulty;
    const region = scene.region === 'EU' ? '🇪🇺 EU' : '🇨🇭 CH';

    // Build identity card
    const idCard = document.createElement('div');
    idCard.className = 'v4-briefing-id';
    idCard.innerHTML = `
      <div class="v4-id-cell">
        <span class="v4-id-label">Durée estimée</span>
        <span class="v4-id-value">~ ${duration} min</span>
      </div>
      <div class="v4-id-cell">
        <span class="v4-id-label">Décisions</span>
        <span class="v4-id-value">${stepCount}</span>
      </div>
      <div class="v4-id-cell">
        <span class="v4-id-label">Niveau</span>
        <span class="v4-id-value">${diffLabel}</span>
      </div>
      <div class="v4-id-cell">
        <span class="v4-id-label">Atmosphère</span>
        <span class="v4-id-value">${atmLabel}</span>
      </div>
      <div class="v4-id-cell">
        <span class="v4-id-label">Région</span>
        <span class="v4-id-value">${region}</span>
      </div>
      ${articles.length > 0 ? `
        <div class="v4-id-cell" style="grid-column: 1 / -1">
          <span class="v4-id-label">Articles centraux</span>
          <div class="v4-id-articles">
            ${articles.map(a => `<span class="v4-art-pill">${a}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    `;

    // Insert after .briefing-top (or at start of card if not found)
    const briefingTop = card.querySelector('.briefing-top');
    if (briefingTop && briefingTop.nextSibling) {
      card.insertBefore(idCard, briefingTop.nextSibling);
    } else if (briefingTop) {
      card.appendChild(idCard);
    } else {
      card.insertBefore(idCard, card.firstChild);
    }

    // Sensitive topic warning
    if (isSensitiveScene(scene)) {
      const topics = getSensitiveTopics(scene);
      const warn = document.createElement('div');
      warn.className = 'v4-sensitive-warning';
      warn.innerHTML = `
        <span class="v4-sensitive-icon">⚠️</span>
        <div class="v4-sensitive-body">
          <strong>Scénario sensible</strong> — Ce cas aborde : ${topics.join(', ').toLowerCase()}.
          Si vous traversez actuellement une période difficile sur ces sujets, vous pouvez choisir un autre scénario.
        </div>
      `;
      idCard.parentNode.insertBefore(warn, idCard.nextSibling);
    }

    // Force-render objectives if scene-app.js failed (string format)
    const existingObjList = card.querySelector('.objective-list');
    if (existingObjList && scene.objectives && scene.objectives.length > 0) {
      // Check if existing list is empty (string format = silent failure)
      const existingItems = existingObjList.querySelectorAll('.objective-item');
      let needsReplace = false;
      if (existingItems.length === 0) needsReplace = true;
      else {
        // Check if all items render "undefined undefined" (signaled by empty span text)
        const firstItem = existingItems[0];
        if (firstItem && firstItem.textContent.trim() === '') needsReplace = true;
      }

      if (needsReplace) {
        const newList = document.createElement('ul');
        newList.className = 'v4-objectives-list';
        scene.objectives.forEach(o => {
          const li = document.createElement('li');
          if (typeof o === 'string') {
            li.innerHTML = `<span class="v4-obj-icon">🎯</span>${o}`;
          } else if (o && typeof o === 'object') {
            li.innerHTML = `<span class="v4-obj-icon">${o.icon || '🎯'}</span>${o.text || ''}`;
          }
          newList.appendChild(li);
        });
        existingObjList.replaceWith(newList);
      }
    }

    // Now that briefing is enriched, wrap legal refs in any text
    setTimeout(() => wrapLegalRefs(card), 30);
  }

  // ═══════════════════════════════════════════════════════════
  //  2. RECAP EXPORT — markdown generator + buttons on report
  // ═══════════════════════════════════════════════════════════
  function generateRecapMarkdown(scene, decisions, summary) {
    const date = new Date().toLocaleString('fr-CH', {
      dateStyle: 'short', timeStyle: 'short'
    });
    const diffLabel = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile', expert: 'Expert' }[scene.difficulty] || scene.difficulty;
    const lines = [];
    lines.push(`# CAS-IN — Récap : ${scene.title}`);
    lines.push('');
    lines.push(`**Date** : ${date}  `);
    lines.push(`**Difficulté** : ${diffLabel}  `);
    lines.push(`**Mode** : ${summary.mode === 'procureur' ? '⚖️ Procureur' : '🎯 Standard'}  `);
    lines.push(`**Score** : ${summary.pct}%  `);
    lines.push(`**Chaîne de custody** : ${summary.custodyPct}%  `);
    if (summary.seed) lines.push(`**Seed** : \`${summary.seed}\`  `);
    lines.push('');

    if (scene.intro) {
      lines.push('## Contexte');
      // Strip HTML
      const plainIntro = String(scene.intro).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      lines.push(plainIntro);
      lines.push('');
    }

    lines.push('## Décisions');
    lines.push('');

    decisions.forEach((d, i) => {
      const step = scene.steps[i];
      if (!step) return;
      const phase = step.phase || `Étape ${i + 1}`;
      const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      lines.push(`### Étape ${i + 1} — ${stripHtml(phase)}`);
      lines.push('');
      if (step.situation) {
        lines.push(`**Situation** : ${stripHtml(step.situation)}`);
        lines.push('');
      }
      if (step.law) {
        lines.push(`**Cadre légal** : ${stripHtml(step.law)}`);
        lines.push('');
      }
      lines.push(`**Question** : ${stripHtml(step.question)}`);
      lines.push('');

      // Identify the chosen choice index
      const chosenOrigIdx = (typeof d.origIdx === 'number') ? d.origIdx : null;
      lines.push(`**Vos décisions** :`);
      lines.push('');
      step.choices.forEach((c, idx) => {
        const chosen = chosenOrigIdx === idx;
        const marker = chosen ? '👉' : '  ';
        const okMark = c.ok ? '✓' : (c.critical ? '🚨' : '✗');
        const choicePts = (c.pts > 0 ? '+' : '') + c.pts;
        lines.push(`${marker} **${okMark} ${stripHtml(c.text)}** _(${choicePts} pts${c.critical ? ', CRITIQUE' : ''})_`);
        if (chosen || c.fb) {
          // Show feedback only on chosen for brevity, OR all if requested
          // We show all for the educational recap
          lines.push(`   - ${stripHtml(c.fb)}`);
          if (c.legal) lines.push(`   - 📖 *${stripHtml(c.legal)}*`);
        }
      });
      lines.push('');
      if (d.timeout) {
        lines.push(`> ⏱ **Timeout procureur** — décision non prise dans les délais.`);
        lines.push('');
      }
      lines.push('---');
      lines.push('');
    });

    if (summary.narrative) {
      lines.push('## Issue narrative');
      lines.push(String(summary.narrative).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
      lines.push('');
    }

    if (summary.newBadges && summary.newBadges.length > 0) {
      lines.push('## 🏅 Distinctions débloquées');
      summary.newBadges.forEach(b => {
        lines.push(`- ${b.icon} **${b.title}** — ${b.desc}`);
      });
      lines.push('');
    }

    lines.push(`---`);
    lines.push(`*Généré par CAS-IN — Programme de formation pénale numérique suisse.*`);
    return lines.join('\n');
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function downloadMarkdown(filename, content) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function showRecapToast(msg) {
    const t = document.createElement('div');
    t.className = 'v4-recap-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity .3s';
      setTimeout(() => t.parentNode && t.parentNode.removeChild(t), 300);
    }, 1800);
  }

  // Capture data needed for recap at moment of showReport
  let lastReportContext = null;

  function captureReportContext() {
    try {
      if (typeof G === 'undefined' || !G || !G.scene) return;
      const scene = G.scene;
      const maxScore = G.mode === 'procureur' ? G.maxScore * 2 : G.maxScore;
      const pct = maxScore > 0 ? Math.max(0, Math.min(100, Math.round((G.score / maxScore) * 100))) : 0;

      // Find chosen origIdx for each decision
      const decisionsWithIdx = G.decisions.map((d, i) => {
        const step = scene.steps[i];
        let origIdx = null;
        if (step && d.fb) {
          // Find the choice with matching feedback (best heuristic)
          step.choices.forEach((c, idx) => {
            if (c.fb === d.fb) origIdx = idx;
          });
        }
        return { ...d, origIdx };
      });

      // Detect narrative
      let narrative = null;
      if (scene.narrative) {
        if (pct >= 75 && G.custodyPct >= 75) narrative = scene.narrative.success;
        else if (pct >= 50) narrative = scene.narrative.degraded;
        else narrative = scene.narrative.failure;
      }

      // Detect new badges
      let newBadges = [];
      try {
        if (typeof getUnlockedBadges === 'function' && typeof GLOBAL_BADGES !== 'undefined') {
          const after = getUnlockedBadges();
          const before = G.beforeBadges || [];
          newBadges = after.filter(id => !before.includes(id))
            .map(id => GLOBAL_BADGES.find(b => b.id === id))
            .filter(Boolean);
        }
      } catch (e) {
        console.warn('[engine-v4] new badges computation failed', e);
      }

      lastReportContext = {
        scene,
        decisions: decisionsWithIdx,
        summary: {
          pct,
          custodyPct: G.custodyPct,
          mode: G.mode,
          seed: G.seed && typeof seedEncode === 'function' ? seedEncode(G.seed) : null,
          narrative,
          newBadges
        }
      };
    } catch (e) {
      console.warn('[engine-v4] captureReportContext failed', e);
    }
  }

  function installRecapButtons() {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;
    if (reportContent.querySelector('.v4-recap-actions')) return; // already installed

    if (!lastReportContext) return; // nothing to export

    const actions = document.createElement('div');
    actions.className = 'v4-recap-actions';

    const exportBtn = document.createElement('button');
    exportBtn.className = 'v4-recap-btn';
    exportBtn.innerHTML = '📑 Exporter MD';
    exportBtn.title = 'Télécharger le récap complet en markdown';
    exportBtn.addEventListener('click', () => {
      const md = generateRecapMarkdown(
        lastReportContext.scene,
        lastReportContext.decisions,
        lastReportContext.summary
      );
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `cas-in-${lastReportContext.scene.id}-${ts}.md`;
      downloadMarkdown(filename, md);
      showRecapToast('📥 Récap téléchargé');
    });

    const copyBtn = document.createElement('button');
    copyBtn.className = 'v4-recap-btn';
    copyBtn.innerHTML = '📋 Copier';
    copyBtn.title = 'Copier le récap en markdown dans le presse-papiers';
    copyBtn.addEventListener('click', () => {
      const md = generateRecapMarkdown(
        lastReportContext.scene,
        lastReportContext.decisions,
        lastReportContext.summary
      );
      copyToClipboard(md).then(() => {
        showRecapToast('📋 Récap copié');
      }).catch(() => {
        showRecapToast('⚠ Copie impossible');
      });
    });

    const reviewBtn = document.createElement('button');
    reviewBtn.className = 'v4-recap-btn review';
    reviewBtn.innerHTML = '📖 Réviser';
    reviewBtn.title = 'Rejouer en mode étude (toutes réponses visibles, sans pression de score)';
    reviewBtn.addEventListener('click', () => {
      enterReviewMode(lastReportContext.scene);
    });

    actions.appendChild(exportBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(reviewBtn);

    // Insert near the top of report-content for visibility
    const firstChild = reportContent.firstElementChild;
    if (firstChild) {
      reportContent.insertBefore(actions, firstChild.nextSibling);
    } else {
      reportContent.appendChild(actions);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  3. REVIEW MODE — replay scene as study, all answers visible
  // ═══════════════════════════════════════════════════════════
  let reviewModeActive = false;

  function enterReviewMode(scene) {
    if (typeof hydrateScene !== 'function' || typeof startScene !== 'function') return;
    reviewModeActive = true;
    hydrateScene(scene).then(s => {
      startScene(s);
      // Wait a tick for the scene to render, then set the flag in G
      setTimeout(() => {
        if (typeof G !== 'undefined' && G) {
          G.reviewMode = true;
        }
        // Force re-render of step to apply review styling
        if (typeof renderStep === 'function') renderStep();
        applyReviewBanner();
      }, 80);
    }).catch(err => {
      console.error('[engine-v4] review hydrate failed', err);
      reviewModeActive = false;
    });
  }

  function exitReviewMode() {
    reviewModeActive = false;
    if (typeof G !== 'undefined' && G) {
      G.reviewMode = false;
    }
    if (typeof goLobby === 'function') goLobby();
  }

  function applyReviewBanner() {
    if (!reviewModeActive) return;
    const sceneScreen = document.getElementById('screen-scene');
    if (!sceneScreen) return;
    if (sceneScreen.querySelector('.v4-review-banner')) return; // already

    const banner = document.createElement('div');
    banner.className = 'v4-review-banner';
    banner.innerHTML = `
      <span class="v4-review-banner-icon">📖</span>
      <span><strong>Mode révision</strong> — Toutes les réponses sont visibles. Pas de score, pas de timer.</span>
      <button class="v4-review-exit">Quitter</button>
    `;
    banner.querySelector('.v4-review-exit').addEventListener('click', exitReviewMode);

    // Insert at top of scene-screen (above progress bar)
    sceneScreen.insertBefore(banner, sceneScreen.firstChild);
  }

  function annotateChoicesForReview() {
    if (!reviewModeActive) return;
    if (typeof G === 'undefined' || !G || !G.scene) return;

    const choicesList = document.getElementById('choices-list');
    if (!choicesList) return;
    const step = G.scene.steps[G.stepIdx];
    if (!step) return;

    // For each choice button, append annotation
    const buttons = choicesList.querySelectorAll('.choice-btn');
    buttons.forEach(btn => {
      // Skip if already annotated
      if (btn.querySelector('.v4-choice-annotated')) return;
      const origIdx = parseInt(btn.dataset.origIdx, 10);
      if (isNaN(origIdx)) return;
      const c = step.choices[origIdx];
      if (!c) return;

      const ann = document.createElement('div');
      const cls = c.ok ? 'ok' : (c.critical ? 'ko critical' : 'ko');
      ann.className = 'v4-choice-annotated ' + cls;
      const okMark = c.ok ? '✓ Bonne décision' : (c.critical ? '🚨 Erreur critique' : '✗ Mauvaise décision');
      const ptsTxt = (c.pts > 0 ? '+' : '') + c.pts + ' pts';
      ann.innerHTML = `
        <strong>${okMark}</strong> <span class="v4-pts">(${ptsTxt})</span>
        <span class="v4-fb">${c.fb || ''}</span>
        ${c.legal ? `<span class="v4-fb" style="color:var(--gold);font-size:10px;font-family:var(--font-mono)">📖 ${c.legal}</span>` : ''}
      `;
      btn.appendChild(ann);
      // Disable scoring on click — but allow advancing
      btn.style.cursor = 'pointer';
    });

    // Hide procureur timer in review mode
    const timer = document.getElementById('procureur-timer');
    if (timer) timer.style.display = 'none';

    // Wrap legal refs in the newly rendered content
    setTimeout(() => wrapLegalRefs(document.getElementById('screen-scene')), 30);
  }

  // ═══════════════════════════════════════════════════════════
  //  WRAP CORE FUNCTIONS — startScene, showReport, renderStep
  // ═══════════════════════════════════════════════════════════
  function installWrappers() {
    // Wrap startScene to enrich briefing
    if (typeof window.startScene === 'function' && !window.startScene.__v4Wrapped) {
      const orig = window.startScene;
      window.startScene = function(scene) {
        const r = orig.apply(this, arguments);
        try {
          // The original shows briefing screen. Enrich it.
          setTimeout(() => enrichBriefing(scene), 30);
        } catch (e) { console.warn('[engine-v4] briefing enrich failed', e); }
        return r;
      };
      window.startScene.__v4Wrapped = true;
    }

    // Wrap renderStep to apply review annotations + glossary
    if (typeof window.renderStep === 'function' && !window.renderStep.__v4Wrapped) {
      const orig = window.renderStep;
      window.renderStep = function() {
        const r = orig.apply(this, arguments);
        try {
          if (reviewModeActive) {
            applyReviewBanner();
            annotateChoicesForReview();
          } else {
            // Wrap legal refs in fresh step content
            setTimeout(() => wrapLegalRefs(document.getElementById('screen-scene')), 30);
          }
        } catch (e) { console.warn('[engine-v4] renderStep enrich failed', e); }
        return r;
      };
      window.renderStep.__v4Wrapped = true;
    }

    // Wrap showReport to capture context, install buttons, wrap legal refs
    if (typeof window.showReport === 'function' && !window.showReport.__v4Wrapped) {
      const orig = window.showReport;
      window.showReport = function() {
        // In review mode: skip the entire scoring, just go back to lobby
        if (reviewModeActive) {
          reviewModeActive = false;
          if (typeof G !== 'undefined' && G) G.reviewMode = false;
          // Remove review banner
          const banner = document.querySelector('.v4-review-banner');
          if (banner) banner.remove();
          if (typeof goLobby === 'function') goLobby();
          showRecapToast('📖 Mode révision terminé');
          return;
        }
        captureReportContext();
        const r = orig.apply(this, arguments);
        setTimeout(() => {
          installRecapButtons();
          wrapLegalRefs(document.getElementById('screen-report'));
        }, 30);
        return r;
      };
      window.showReport.__v4Wrapped = true;
    }

    // Wrap selectChoice to bypass scoring in review mode
    if (typeof window.selectChoice === 'function' && !window.selectChoice.__v4Wrapped) {
      const orig = window.selectChoice;
      window.selectChoice = function(origIdx, btn) {
        if (reviewModeActive && typeof G !== 'undefined' && G && G.scene) {
          // In review mode: just advance without scoring
          const isLast = G.stepIdx >= G.scene.steps.length - 1;
          if (isLast) {
            // End of review — return to lobby
            reviewModeActive = false;
            if (G) G.reviewMode = false;
            const banner = document.querySelector('.v4-review-banner');
            if (banner) banner.remove();
            if (typeof goLobby === 'function') goLobby();
            showRecapToast('📖 Mode révision terminé');
          } else {
            G.stepIdx++;
            if (typeof renderStep === 'function') renderStep();
          }
          return;
        }
        return orig.apply(this, arguments);
      };
      window.selectChoice.__v4Wrapped = true;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  BOOT
  // ═══════════════════════════════════════════════════════════
  function boot() {
    injectStyles();
    installWrappers();

    // If briefing screen is already shown, retro-enrich
    const briefingScreen = document.getElementById('screen-briefing');
    if (briefingScreen && briefingScreen.classList.contains('active')) {
      if (typeof G !== 'undefined' && G && G.scene) {
        setTimeout(() => enrichBriefing(G.scene), 100);
      }
    }

    // Watch for screen changes — re-attach if needed
    const observer = new MutationObserver(() => {
      // If briefing becomes active, ensure enrichment
      const bs = document.getElementById('screen-briefing');
      if (bs && bs.classList.contains('active') && typeof G !== 'undefined' && G && G.scene) {
        if (!document.querySelector('.v4-briefing-id')) {
          setTimeout(() => enrichBriefing(G.scene), 50);
        }
      }
      // If report screen becomes active, ensure buttons + glossary
      const rs = document.getElementById('screen-report');
      if (rs && rs.classList.contains('active')) {
        if (lastReportContext && !document.querySelector('.v4-recap-actions')) {
          setTimeout(installRecapButtons, 60);
        }
        // Always (re)wrap legal refs on report screen
        setTimeout(() => wrapLegalRefs(rs), 80);
      }
    });
    const root = document.body || document.documentElement;
    observer.observe(root, { attributes: true, attributeFilter: ['class'], subtree: true });

    window.__casEngineV4Installed = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 120));
  } else {
    setTimeout(boot, 120);
  }

  // Expose a debug API
  window.casEngineV4 = {
    glossary: LEGAL_GLOSSARY,
    showTooltip,
    enterReviewMode,
    exitReviewMode,
    isReviewActive: () => reviewModeActive,
    rewrapLegalRefs: () => wrapLegalRefs(document.body),
  };
})();
