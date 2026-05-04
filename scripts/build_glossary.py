#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v2.62 — Génération des nouvelles entrées GLOSSARY pour scene-app.js.

Stratégie : ajouter ~200 entrées prioritaires (pas exhaustif des 478,
mais couvrant les références récurrentes ET les domaines clés où le
glossaire actuel est mince : AI Act, NIS2, ATF récents, conventions,
lois fédérales).

Cible : passer de 80 à ~280 entrées, couverture 44% → ~75-80%.
"""

NEW_ENTRIES = {
    # ───────────────────────────────────────────────────
    # CPP — Articles supplémentaires (en plus des 18 existants)
    # ───────────────────────────────────────────────────
    "Art. 6 CPP": "Maxime de l'instruction : autorités pénales recherchent d'office la vérité (faits à charge ET à décharge).",
    "Art. 9 CPP": "Maxime accusatoire : le tribunal n'est saisi que des faits décrits dans l'acte d'accusation.",
    "Art. 12 CPP": "Autorités pénales : MP cantonal/MPC, police, tribunaux. Définition des compétences.",
    "Art. 13 CPP": "Tribunaux : compétences matérielles selon les cantons et la nature de l'infraction.",
    "Art. 14 CPP": "Désignation et organisation des autorités : compétences cantonales.",
    "Art. 16 CPP": "Ministère public : conduite de la procédure, ouverture instruction, mise en accusation.",
    "Art. 17 CPP": "Autorités pénales compétentes en matière de contraventions (autorités administratives).",
    "Art. 24 CPP": "Compétence fédérale du MPC : crimes contre la Confédération, criminalité organisée transfrontalière, terrorisme.",
    "Art. 26 CPP": "Compétences fédérales en cas de plusieurs États atteints (extraterritorialité).",
    "Art. 31 CPP": "Compétence territoriale : lieu de commission de l'infraction.",
    "Art. 56 CPP": "Récusation : motifs (intérêt personnel, parenté, etc.) pour magistrat ou expert.",
    "Art. 72 CPP": "Délégation des actes d'instruction : autorité requérante, autorité requise.",
    "Art. 73 CPP": "Confidentialité de la procédure : secret de l'instruction, sanctions en cas de fuite.",
    "Art. 74 CPP": "Information du public : équilibre entre transparence et présomption d'innocence.",
    "Art. 75 CPP": "Obligations de discrétion : interdiction d'identifier les parties hors procédure.",
    "Art. 100 CPP": "Tenue du dossier : pièces enregistrées, ordre chronologique, accès garanti.",
    "Art. 101 CPP": "Consultation du dossier par les parties (droit de la défense).",
    "Art. 113 CPP": "Nemo tenetur : le prévenu n'est pas tenu de s'auto-incriminer (droit au silence).",
    "Art. 139 CPP": "Preuve par indices : faisceaux convergents admissibles en l'absence de preuve directe.",
    "Art. 140 CPP": "Méthodes d'administration interdites : torture, tromperie, contrainte physique grave.",
    "Art. 141 al. 1 CPP": "Preuves absolument inexploitables : violation grave des règles de validité.",
    "Art. 141 al. 2 CPP": "Preuves illicites : exploitabilité possible si nécessaire pour élucider une infraction grave (pondération in casu).",
    "Art. 141 al. 4 CPP": "Théorie du fruit empoisonné : preuves dérivées d'une preuve illicite également exclues.",
    "Art. 145 CPP": "Rapports écrits : substituts à l'audition orale dans certains cas.",
    "Art. 147 CPP": "Droit de participation aux actes d'instruction : parties présentes, contradictoire.",
    "Art. 158 CPP": "Information du prévenu : droits, accusation, droit au silence (premier interrogatoire).",
    "Art. 159 CPP": "Mise en garde du prévenu et avocat de la première heure.",
    "Art. 168 CPP": "Droit de refuser de témoigner : raisons familiales.",
    "Art. 170 CPP": "Levée du secret de fonction : autorisation judiciaire pour témoigner.",
    "Art. 171 CPP": "Secret professionnel des avocats, médecins, ecclésiastiques (refus de témoigner).",
    "Art. 173 CPP": "Secret de fonction des fonctionnaires (limité, dérogeable par l'autorité supérieure).",
    "Art. 180 CPP": "Personnes appelées à donner des renseignements (ni prévenu, ni témoin).",
    "Art. 182 CPP": "Expertise : l'expert décrit les faits techniques, ne qualifie pas juridiquement.",
    "Art. 184 CPP": "Désignation de l'expert : impartialité, compétence, prestation de serment.",
    "Art. 185 CPP": "Établissement de l'expertise : règles, contradictoire, présence des parties.",
    "Art. 188 CPP": "Force probante de l'expertise : libre appréciation par le juge.",
    "Art. 189 CPP": "Contre-expertise : droit de demander un second expert pour contester le premier.",
    "Art. 196 CPP": "Mesures de contrainte : définition générale, conditions cumulatives.",
    "Art. 197 CPP": "Proportionnalité des mesures de contrainte (4 critères : soupçons, but, autres mesures, gravité).",
    "Art. 198 CPP": "Compétence pour ordonner des mesures de contrainte (MP, tribunal, TMC).",
    "Art. 215 CPP": "Appréhension : police peut interpeller toute personne pour vérifier identité.",
    "Art. 217 CPP": "Arrestation provisoire par la police (flagrant délit).",
    "Art. 220 CPP": "Détention provisoire : conditions (forts soupçons + risque de fuite/collusion/réitération).",
    "Art. 224 CPP": "Procédure de détention : audition par MP, demande au TMC dans les 48h.",
    "Art. 244 CPP": "Perquisition de domicile : mandat + conditions formelles.",
    "Art. 245 CPP": "Perquisition de supports informatiques : avec ordonnance MP, séquestre des données.",
    "Art. 246 CPP": "Perquisition de documents et enregistrements électroniques.",
    "Art. 248 CPP": "Scellés : suspension de l'analyse sur demande, TMC tranche dans les 20 jours.",
    "Art. 263 CPP": "Séquestre : saisie provisoire d'objets ou valeurs liés à une infraction.",
    "Art. 264 CPP": "Objets protégés par le secret professionnel (avocat, médecin, prêtre, journaliste).",
    "Art. 267 CPP": "Mandat de séquestre : exécution formalisée, inventaire.",
    "Art. 269 CPP": "Surveillance de la correspondance par télécommunication : ordonnance TMC requise (liste exhaustive d'infractions).",
    "Art. 270 CPP": "Objet de la surveillance : raccordements, télécommunications, courriers.",
    "Art. 271 CPP": "Sauvegarde du secret professionnel pendant les surveillances.",
    "Art. 272 CPP": "Autorisation de surveillance par le TMC dans les 24h.",
    "Art. 273 CPP": "Collecte de métadonnées et réquisitions envers les prestataires télécom.",
    "Art. 280 CPP": "Recours à des dispositifs techniques de surveillance (sons et images).",
    "Art. 285a CPP": "Investigation secrète : définition (agent infiltré sous fausse identité).",
    "Art. 286 CPP": "Conditions de l'investigation secrète (gravité, subsidiarité, proportionnalité).",
    "Art. 287 CPP": "Compétence et durée de l'investigation secrète (max 12 mois prolongeable).",
    "Art. 288 CPP": "Mission et formation de l'agent infiltré.",
    "Art. 289 CPP": "Témoignage de l'agent infiltré en procédure (anonymat possible).",
    "Art. 295 CPP": "Recherches secrètes : différent de l'investigation secrète, sans fausse identité.",
    "Art. 298 CPP": "Observation policière préventive (phase pré-procédurale).",
    "Art. 302 CPP": "Obligation de dénoncer pour les autorités (fonctionnaires).",
    "Art. 309 CPP": "Ouverture d'instruction par le ministère public.",
    "Art. 318 CPP": "Clôture de l'instruction : non-lieu, mise en accusation, ordonnance pénale.",
    "Art. 352 CPP": "Ordonnance pénale : peine pécuniaire ou TIG, contestable par opposition.",
    "Art. 393 CPP": "Recours : voie ordinaire contre les décisions du MP et TMC.",
    "Art. 422-426 CPP": "Frais de procédure : honoraires expertise, indemnité du conseil d'office.",

    # ───────────────────────────────────────────────────
    # CP — Articles supplémentaires
    # ───────────────────────────────────────────────────
    "Art. 18 CP": "État de nécessité licite : sauvegarde d'un bien juridique au prix d'un autre.",
    "Art. 19 CP": "Irresponsabilité et responsabilité restreinte : troubles psychiques, capacité de discernement.",
    "Art. 49 CP": "Concours d'infractions : aggravation au plus à la moitié maximum + cumul.",
    "Art. 138 CP": "Abus de confiance : usage indu d'une chose confiée.",
    "Art. 139 CP": "Vol : soustraction d'une chose mobilière appartenant à autrui.",
    "Art. 140 CP": "Brigandage : vol avec violence ou menace.",
    "Art. 143 CP": "Soustraction de données : accès + extraction illégitime de données protégées.",
    "Art. 143bis CP": "Accès indu à un système informatique (hacking sans extraction).",
    "Art. 144 CP": "Dommages à la propriété : destruction ou détérioration de biens.",
    "Art. 144bis CP": "Détérioration de données : modification/effacement de données électroniques (ransomware, defacement).",
    "Art. 146 CP": "Escroquerie : tromperie astucieuse causant un dommage patrimonial.",
    "Art. 147 CP": "Utilisation frauduleuse d'un ordinateur : manipulation de système pour enrichissement.",
    "Art. 147 al. 2 CP": "Cas grave : profession ou bande, peine majorée.",
    "Art. 156 CP": "Extorsion / chantage.",
    "Art. 157 CP": "Usure : exploitation d'une situation de faiblesse pour des avantages disproportionnés.",
    "Art. 158 CP": "Gestion déloyale : atteinte aux intérêts pécuniaires d'autrui par violation de devoir.",
    "Art. 162 CP": "Violation du secret de fabrication ou commercial.",
    "Art. 173-178 CP": "Atteintes à l'honneur : diffamation, calomnie, injure.",
    "Art. 179 CP": "Violation de domaine secret ou privé : enregistrements sans consentement.",
    "Art. 179bis CP": "Écoute et enregistrement de conversations entre tiers.",
    "Art. 179ter CP": "Enregistrement non autorisé de conversations.",
    "Art. 179quater CP": "Violation du domaine secret par appareils de prise de vue.",
    "Art. 179quinquies CP": "Détention/diffusion d'enregistrements obtenus illégalement.",
    "Art. 179novies CP": "Soustraction de données personnelles (anciennement art. 35 LPD).",
    "Art. 179decies CP": "Usurpation d'identité (en vigueur depuis 2024).",
    "Art. 187 CP": "Actes d'ordre sexuel avec des enfants (mineurs <16 ans).",
    "Art. 195 CP": "Encouragement à la prostitution.",
    "Art. 195-196 CP": "Traite des êtres humains à fins sexuelles.",
    "Art. 196 CP": "Actes d'ordre sexuel avec des mineurs contre rémunération.",
    "Art. 197 CP": "Pornographie : production, diffusion, possession (interdiction enfants <16).",
    "Art. 197 al. 4-5 CP": "Pornographie enfantine : possession et consommation (qualifications aggravées).",
    "Art. 251 CP": "Faux dans les titres : falsification de documents à valeur probante.",
    "Art. 252 CP": "Faux dans les certificats.",
    "Art. 271 CP": "Actes exécutés sans droit pour un État étranger : espionnage non militaire.",
    "Art. 272 CP": "Service de renseignements politiques au préjudice de la Suisse.",
    "Art. 273 CP": "Service de renseignements économiques (espionnage industriel).",
    "Art. 305bis CP": "Blanchiment d'argent : entrave à l'identification, à la confiscation.",
    "Art. 305ter CP": "Défaut de vigilance en matière d'opérations financières.",
    "Art. 312 CP": "Abus d'autorité par fonctionnaire (ou pers. en charge tâche publique).",
    "Art. 320 CP": "Violation du secret de fonction (fonctionnaires).",
    "Art. 321 CP": "Violation du secret professionnel (médecins, avocats, ecclésiastiques).",
    "Art. 322ter CP": "Corruption d'agents publics suisses.",
    "Art. 322septies CP": "Corruption d'agents publics étrangers.",

    # ───────────────────────────────────────────────────
    # Constitution fédérale — articles supplémentaires
    # ───────────────────────────────────────────────────
    "Art. 7 Cst.": "Dignité humaine : doit être respectée et protégée.",
    "Art. 8 Cst.": "Égalité juridique et interdiction de discrimination.",
    "Art. 10 Cst.": "Droit à la vie et liberté personnelle (interdiction torture, peine de mort).",
    "Art. 13 Cst.": "Protection de la sphère privée (vie privée, familiale, secret de la correspondance).",
    "Art. 16 Cst.": "Liberté d'opinion et d'information.",
    "Art. 17 Cst.": "Liberté des médias, secret rédactionnel.",
    "Art. 27 Cst.": "Liberté économique.",
    "Art. 29 Cst.": "Garanties générales de procédure (droit d'être entendu, jugement dans délai raisonnable).",
    "Art. 32 Cst.": "Garanties procédurales : présomption d'innocence, procès équitable.",
    "Art. 36 Cst.": "Restrictions des droits fondamentaux : base légale, intérêt public, proportionnalité, noyau intangible.",
    "Art. 169 Cst.": "Haute surveillance parlementaire sur le Conseil fédéral et l'administration.",

    # ───────────────────────────────────────────────────
    # LPD 2023 — articles supplémentaires
    # ───────────────────────────────────────────────────
    "LPD 2023": "Loi fédérale sur la protection des données (RS 235.1), version totalement révisée entrée en vigueur 01.09.2023.",
    "LPD (ancienne)": "Ancienne LPD de 1992, abrogée le 01.09.2023 et remplacée par la LPD 2023 totalement révisée.",
    "LPD 2023 Art. 5": "Données sensibles : santé, biométrie, opinions, vie intime — protection renforcée.",
    "LPD 2023 Art. 6": "Principes du traitement : licéité, finalité, proportionnalité, exactitude.",
    "LPD 2023 Art. 7": "Responsable du traitement : obligation de garantir la protection.",
    "LPD 2023 Art. 8": "Sécurité des données : mesures techniques et organisationnelles appropriées.",
    "LPD 2023 Art. 9": "Sous-traitance : cascade de responsabilité, le responsable reste garant.",
    "LPD 2023 Art. 19": "Information de la personne concernée lors de la collecte.",
    "LPD 2023 Art. 22": "Analyse d'impact (DPIA) : obligatoire si traitement à risque élevé.",
    "LPD 2023 Art. 24": "Notification des violations au PFPDT dans les meilleurs délais si risque élevé.",
    "LPD 2023 Art. 25": "Droit d'accès de la personne concernée (sous 30 jours).",
    "LPD 2023 Art. 27": "Information des personnes concernées en cas de risque élevé.",
    "Art. 22 LPD": "Données génétiques sensibles : traitement à risque élevé, DPIA obligatoire.",

    # ───────────────────────────────────────────────────
    # Lois fédérales spécifiques
    # ───────────────────────────────────────────────────
    "LBA": "Loi fédérale sur le blanchiment d'argent (RS 955.0) : intermédiaires financiers, vigilance, communication MROS.",
    "LBA Art. 9": "Obligation de communiquer au MROS en cas de soupçons fondés (devoir, pas droit).",
    "LBA art. 9 — Communication MROS": "Communication obligatoire des intermédiaires financiers en cas de soupçons fondés de blanchiment ou financement du terrorisme.",
    "Art. 9 LBA — Obligation de communiquer (MROS)": "Communication obligatoire des intermédiaires financiers en cas de soupçons fondés (LBA art. 9).",
    "LSI": "Loi fédérale sur la sécurité de l'information (RS 128.0, entrée en vigueur 2024).",
    "LSI Art. 74c": "Obligation de notification d'incidents cyber pour les exploitants d'infrastructures critiques (à l'OFCS).",
    "Loi fédérale sur la sécurité de l'information (LSI, 2024)": "LSI : cadre fédéral pour la cybersécurité, oblige les opérateurs critiques à notifier les incidents à l'OFCS.",
    "LADN": "Loi fédérale sur l'utilisation de profils d'ADN dans les procédures pénales (RS 363).",
    "LSCPT": "Loi fédérale sur la surveillance de la correspondance par poste et télécommunication (RS 780.1).",
    "LRens": "Loi sur le renseignement (RS 121) : encadre l'activité du SRC.",
    "LStup": "Loi fédérale sur les stupéfiants (RS 812.121).",
    "LCR": "Loi fédérale sur la circulation routière (RS 741.01).",
    "CO": "Code des obligations (RS 220) : droit civil, contrats, responsabilité.",
    "LP": "Loi fédérale sur la poursuite pour dettes et la faillite (RS 281.1).",
    "EIMP": "Loi fédérale sur l'entraide pénale internationale (RS 351.1) : régit les commissions rogatoires.",
    "LMSI": "Loi fédérale instituant des mesures visant au maintien de la sûreté intérieure (abrogée par LRens).",

    # ───────────────────────────────────────────────────
    # ATF supplémentaires (jurisprudences récurrentes)
    # ───────────────────────────────────────────────────
    "ATF 116 IV 319": "Sur la violation du secret professionnel : portée de l'art. 321 CP.",
    "ATF 129 IV 253": "Conditions de l'art. 305bis CP (blanchiment) : connaissance de l'origine illicite.",
    "ATF 137 II 209": "Limites de l'information parlementaire et secret de fonction.",
    "ATF 137 IV 33": "Recevabilité des preuves recueillies par particuliers (preuves illicites privées).",
    "ATF 138 IV 47": "Nemo tenetur protège contre la contrainte cognitive mais pas contre la capture passive.",
    "ATF 139 IV 128": "Sur les conditions de la détention provisoire (art. 220 CPP).",
    "ATF 140 IV 11": "Art. 146 CP (escroquerie) exige la tromperie d'une personne physique.",
    "ATF 141 IV 142": "Soustraction de données informatiques (art. 143 CP) : étendue de la protection.",
    "ATF 142 IV 16": "Capacité de discernement et fin de vie (art. 19 CP).",
    "ATF 142 IV 49": "Droits du mineur en procédure pénale.",
    "ATF 142 IV 388": "Recevabilité d'actes coordonnés multilatéralement.",
    "ATF 143 IV 270": "Conditions du séquestre (art. 263 CPP).",
    "ATF 143 IV 330": "Timestamps numériques : corroboration multi-sources obligatoire pour valeur probante.",
    "ATF 144 IV 23": "Limites de l'investigation secrète (art. 285a ss CPP).",
    "ATF 144 IV 28": "Distinction art. 162 CP (secret de fabrication) / 273 CP (espionnage économique).",
    "ATF 146 IV 23": "Sur la portée de l'art. 263 CPP (séquestre).",
    "ATF 147 IV 16": "Proportionnalité dans l'usage des données génétiques.",
    "ATF 147 IV 409": "Indices graves, précis et concordants = condamnation possible sans preuve directe.",
    "ATF 148 IV 152": "Sur l'art. 269 CPP (surveillance des télécommunications).",
    "ATF 149 I 218": "Contrôle numérique en zone frontière : exige base légale spécifique (2023).",
    "ATF 149 IV 248": "Sur les preuves illicites (art. 141 CPP).",
    "ATF 150 IV 188": "Jurisprudence récente sur les mesures de contrainte numériques.",
    "TF 1B_602/2020": "Scellés : tri préalable judiciaire quand le propriétaire désigne précisément des données privées.",
    "TF 6B_157/2019": "Seuil de minimis : consommation personnelle stupéfiants (LStup).",
    "TF 6B_361/2017": "Chaîne de custody : sa rupture peut exclure la preuve (art. 141 CPP).",
    "TF 6B_392/2018": "Conditions du dol éventuel art. 305bis CP (blanchiment).",
    "TF 6B_1180/2023": "Jurisprudence récente sur l'application des règles cyber.",
    "ATF 6B_1180/2023": "Jurisprudence récente sur les preuves cyber.",
    "ATF 6B_157/2019 — seuil de minimis consommation personnelle": "Seuil de minimis pour consommation personnelle de stupéfiants.",
    "ATF 6B_392/2018 — Conditions du dol éventuel art. 305bis CP": "Précision sur le dol éventuel en matière de blanchiment.",
    "CrEDH S. and Marper v. UK 2008": "Conservation des profils ADN : viole l'art. 8 CEDH si conservation indéfinie sans tri.",
    "CrEDH S. and Marper v. UK 2008 — Conservation des profils ADN": "La CrEDH a jugé contraire à l'art. 8 CEDH la conservation indéfinie de profils ADN.",

    # ───────────────────────────────────────────────────
    # Conventions internationales
    # ───────────────────────────────────────────────────
    "CEDH": "Convention européenne des droits de l'homme (1950) : socle européen des libertés fondamentales.",
    "Art. 6 CEDH": "Droit à un procès équitable.",
    "Art. 8 CEDH": "Droit au respect de la vie privée et familiale.",
    "Convention Lanzarote": "Convention du Conseil de l'Europe sur la protection des enfants contre l'exploitation et les abus sexuels (2007).",
    "Convention Budapest": "Convention sur la cybercriminalité (Budapest 2001) : socle international, ratifiée par >70 États.",
    "Convention Genève IV": "Convention de Genève IV (1949) : protection des civils en temps de guerre.",
    "Convention de Vienne": "Convention de Vienne sur les relations diplomatiques (1961) : immunités diplomatiques.",
    "MLAT": "Mutual Legal Assistance Treaty : traité bilatéral d'entraide judiciaire (CH-USA notamment).",
    "MLAT CH-USA": "Traité d'entraide judiciaire entre la Suisse et les États-Unis (1973).",
    "CLOUD Act": "Clarifying Lawful Overseas Use of Data Act (USA 2018) : accès extraterritorial aux données par autorités US.",
    "Accord Schengen-CH 2009": "Modèle d'accord ad hoc EU+CH : association à Schengen depuis 2008.",
    "Accord Schengen-CH 2009 — modèle d'accord ad hoc EU+CH": "Accord d'association de la Suisse à l'espace Schengen.",
    "Accord électrique CH-UE 2014 (suspendu)": "Précédent diplomatique : accord négocié mais jamais ratifié.",
    "Accord électrique CH-UE 2014 (suspendu) — précédent diplomatique": "Cet accord négocié mais jamais signé sert de précédent pour les accords sectoriels CH-UE.",

    # ───────────────────────────────────────────────────
    # AI Act (UE 2024)
    # ───────────────────────────────────────────────────
    "AI Act": "Règlement UE 2024/1689 sur l'intelligence artificielle, en vigueur progressive 2024-2027.",
    "AI Act art. 6": "Classification des systèmes IA à haut risque (annexes I et III).",
    "AI Act art. 6 — classification systèmes IA haut risque": "Critères pour qualifier un système IA de haut risque.",
    "AI Act art. 8-15": "Obligations applicables aux systèmes IA à haut risque (gestion des risques, données, documentation, transparence, surveillance humaine, robustesse).",
    "AI Act art. 8-15 — obligations systèmes IA haut risque": "Suite d'obligations pour les fournisseurs et déployeurs de systèmes IA à haut risque.",
    "AI Act art. 26": "Obligations des utilisateurs (déployeurs) de systèmes IA à haut risque.",
    "AI Act art. 26 — obligations utilisateurs (déployeurs)": "Devoirs des organisations qui déploient des systèmes IA à haut risque.",
    "AI Act art. 50": "Obligations de transparence : marquage IA, deepfakes, chatbots.",
    "AI Act art. 50 — obligations transparence": "Marquage obligatoire des contenus générés par IA et des interactions avec chatbots.",
    "AI Act Annexe III": "Liste des systèmes IA à haut risque par domaine d'application.",
    "AI Act Annexe III §6": "Systèmes IA en application de la loi (procédure pénale) : à haut risque.",
    "AI Act Annexe III §6 — systèmes IA en application de la loi (procédure pénale)": "Les systèmes IA utilisés en procédure pénale sont classés à haut risque.",
    "AI Office": "Bureau européen de l'IA (Commission, DG CNECT) créé en février 2024 pour superviser l'AI Act.",
    "AI Office (Commission européenne, DG CNECT, créé février 2024)": "Bureau de la Commission européenne chargé de la mise en œuvre de l'AI Act.",

    # ───────────────────────────────────────────────────
    # Cybersécurité EU
    # ───────────────────────────────────────────────────
    "NIS2": "Directive (UE) 2022/2555 sur la sécurité des réseaux et systèmes d'information : obligations cyber pour entités essentielles/importantes.",
    "Directive NIS2": "Directive (UE) 2022/2555, transposition par les États membres avant 17.10.2024.",
    "CER": "Directive (UE) 2022/2557 sur la résilience des entités critiques (Critical Entities Resilience).",
    "Directive CER": "Directive (UE) 2022/2557 : résilience physique et cyber des entités critiques (énergie, eau, transports).",
    "CRA": "Cyber Resilience Act (UE 2024/2847) : exigences de cybersécurité pour les produits avec éléments numériques.",
    "DORA": "Digital Operational Resilience Act (UE 2022/2554) : résilience numérique du secteur financier.",
    "RGPD": "Règlement général sur la protection des données (UE 2016/679) : base européenne, applicable depuis 25.05.2018.",
    "ENISA": "Agence européenne de cybersécurité, basée à Athènes/Héraklion.",
    "ANSSI doctrine notification cyber": "Agence nationale de sécurité des systèmes d'information (FR), doctrine post-Xplain 2023 + Endgame 2024.",
    "ANSSI doctrine notification cyber (post-Xplain 2023 + Endgame 2024)": "Doctrine ANSSI mise à jour après les opérations Xplain et Endgame.",

    # ───────────────────────────────────────────────────
    # Institutions / acronymes (en complément des 8 existants)
    # ───────────────────────────────────────────────────
    "DélCdG": "Délégation des Commissions de gestion : haute surveillance parlementaire sur le SRC + CCPF.",
    "FINMA": "Autorité fédérale de surveillance des marchés financiers (Berne).",
    "GovCERT": "GovCERT.ch : équipe de réponse aux incidents informatiques de la Confédération (intégrée à l'OFCS).",
    "GovCERT.ch": "Équipe nationale de réponse aux incidents cyber, rattachée à l'OFCS depuis 2024.",
    "MELANI": "Centrale d'enregistrement et d'analyse pour la sûreté de l'information (ancien nom de GovCERT/OFCS).",
    "CCPF": "Commission consultative sur la sécurité préventive de la Confédération.",
    "CDF": "Contrôle fédéral des finances : audit indépendant des finances et de la performance.",
    "Eurojust": "Agence de coopération judiciaire pénale de l'UE (La Haye).",
    "Europol": "Office européen de police (La Haye), CH associée depuis 2004.",
    "Interpol": "Organisation internationale de police criminelle (Lyon), 196 États membres.",
    "FATF / GAFI": "Groupe d'action financière (Paris) : standards anti-blanchiment et anti-financement du terrorisme.",
    "OFAC": "Office of Foreign Assets Control (USA) : agence du Trésor US chargée des sanctions économiques.",
    "FinCEN": "Financial Crimes Enforcement Network (USA) : bureau du Trésor US, FIU américaine.",
    "TRACFIN": "Traitement du renseignement et action contre les circuits financiers clandestins (FR) : FIU française.",
    "FIU": "Financial Intelligence Unit : cellule nationale de renseignement financier (MROS en CH).",
    "Egmont Group": "Réseau international de FIU (~170 pays), facilite l'échange d'informations entre FIU.",
    "OFDF": "Office fédéral de la douane et de la sécurité des frontières (anciennement AFD).",
    "AFD": "Administration fédérale des douanes (renommée OFDF en 2022).",
    "Swissgrid": "Société nationale suisse pour l'exploitation du réseau électrique de transport (380/220 kV).",
    "ENTSO-E": "European Network of Transmission System Operators for Electricity : réseau européen des gestionnaires de transport.",
    "RTS / SSR": "Radio Télévision Suisse (RTS) / Société Suisse de Radiodiffusion (SSR) : service public audiovisuel.",
    "FedPol": "Office fédéral de la police (Berne) : police judiciaire fédérale, Interpol-Europol-MROS.",
    "fedpol": "Office fédéral de la police (Berne) : abrite la PJF, le MROS, le bureau Interpol/Europol.",

    # ───────────────────────────────────────────────────
    # Standards techniques
    # ───────────────────────────────────────────────────
    "NIST CSF": "NIST Cybersecurity Framework : référentiel de gestion des risques cyber (Identifier, Protéger, Détecter, Répondre, Récupérer, Gouverner).",
    "NIST SP 800-86": "Guide forensique : 'Guide to Integrating Forensic Techniques into Incident Response'.",
    "NIST SP 800-184": "Guide pour la récupération après cyber-incident.",
    "ISO/IEC 27001": "Norme internationale pour les systèmes de management de la sécurité de l'information (SMSI).",
    "ISO/IEC 27037": "Lignes directrices pour l'identification, la collecte, l'acquisition et la préservation des preuves numériques.",
    "ISO/IEC 27041": "Assurance de l'adéquation et de la pertinence des méthodes d'investigation incident.",
    "ISO/IEC 27042": "Lignes directrices pour l'analyse et l'interprétation des preuves numériques.",
    "ISO/IEC 27043": "Principes et processus d'investigation des incidents.",
    "MITRE ATT&CK": "Référentiel de tactiques, techniques et procédures (TTPs) des adversaires cyber.",
    "STIX/TAXII": "Standards d'échange d'indicateurs de menace (Structured Threat Information Expression / Trusted Automated Exchange).",

    # ───────────────────────────────────────────────────
    # Outils & techniques (compléments)
    # ───────────────────────────────────────────────────
    "Encase": "Suite forensique commerciale (OpenText/Guidance) : acquisition, analyse, rapports judiciaires.",
    "FTK": "Forensic Toolkit (AccessData/Exterro) : suite d'analyse forensique informatique.",
    "Autopsy": "Plateforme open-source d'investigation numérique (basée sur The Sleuth Kit).",
    "Sleuth Kit": "Bibliothèque open-source d'analyse de systèmes de fichiers (TSK).",
    "Wireshark": "Analyseur de paquets réseau open-source : capture et inspection du trafic.",
    "tcpdump": "Outil ligne de commande de capture de paquets réseau.",
    "Cellebrite": "Suite d'extraction et d'analyse mobile (UFED) : standard policier mondial.",
    "GrayKey": "Outil d'extraction iOS (Grayshift) : déverrouillage de codes utilisateur.",
    "Magnet Axiom": "Suite forensique multi-sources (mobile, PC, cloud).",
    "Hashcat": "Cracker de mots de passe haute performance (GPU).",
    "John the Ripper": "Cracker de mots de passe open-source (CPU/GPU).",
    "BIP-39": "Standard Bitcoin pour les phrases mnémotechniques (12 ou 24 mots = clé privée déterministe).",
    "Tor": "The Onion Router : réseau anonymisant par routage en oignon.",
    "VPN": "Virtual Private Network : tunnel chiffré masquant l'IP source.",
    "I2P": "Invisible Internet Project : réseau anonyme garlic-routing.",
    "Maltego": "Outil OSINT de visualisation de graphes d'entités et leurs relations.",
    "Shodan": "Moteur de recherche pour systèmes connectés (devices IoT, ICS, services exposés).",
    "Censys": "Moteur de recherche similaire à Shodan, basé sur scans Internet quotidiens.",

    # ───────────────────────────────────────────────────
    # Références ADN / forensique avancée
    # ───────────────────────────────────────────────────
    "Art. 255-259 CPP": "Profils ADN forensiques : prélèvement, analyse, conservation, effacement.",
    "Art. 255-259 CPP — Profils ADN forensiques": "Régime des profils ADN en procédure pénale (prélèvement, analyse, fichier).",
    "Art. 22 LPD — Données génétiques sensibles": "Données génétiques = sensibles, traitement à risque élevé, DPIA obligatoire.",
    "Art. 36 Cst. — Restriction des droits fondamentaux": "Toute restriction des droits fondamentaux doit reposer sur une base légale, un intérêt public, être proportionnée.",
    "LADN — Loi fédérale sur les profils d'ADN": "Loi fédérale sur l'utilisation de profils d'ADN en procédure pénale (RS 363).",

    # ───────────────────────────────────────────────────
    # Variations art. avec descriptions de scènes
    # (les libellés exacts qui apparaissent dans legalRefs)
    # ───────────────────────────────────────────────────
    "Art. 162 CP — Violation du secret de fabrication ou commercial": "Protège les secrets industriels et commerciaux des entreprises.",
    "Art. 273 CP — Service de renseignements économiques": "Espionnage économique au profit d'une organisation étrangère.",
    "Art. 271 CP — Actes exécutés sans droit pour un État étranger": "Espionnage non militaire pour un État étranger sur sol suisse.",
    "Art. 271 CP — Actes pour État étranger": "Forme abrégée : actes exécutés sans droit pour un État étranger.",
    "art. 144bis CP (détérioration de données)": "Modification ou effacement illégitime de données électroniques (ransomware, sabotage).",
    "Art. 141 al. 2 CPP — Preuves illicites": "Preuves obtenues en violation simple : exploitabilité possible si nécessaire pour élucider une infraction grave.",
    "Art. 73 CPP — Confidentialité de la procédure": "Secret de l'instruction : interdiction de divulguer les actes hors procédure.",
    "Art. 158 CPP — Information du prévenu": "Premier interrogatoire : information sur les charges, droit au silence, droit à l'avocat.",
    "Art. 285a CPP — Investigation secrète (définition)": "Définition : agent infiltré sous fausse identité dans un milieu criminel.",
    "Art. 286 CPP — Conditions": "Conditions de l'investigation secrète : gravité de l'infraction, subsidiarité, proportionnalité.",
    "Art. 287 CPP — Compétence et durée (max 12 mois prolongeable)": "MP autorise, durée max 12 mois prolongeable par TMC.",
    "Art. 288 CPP — Mission et formation de l'agent": "L'agent infiltré est formé, sa mission est précisément délimitée.",
    "Art. 289 CPP — Témoignage en procédure": "L'agent infiltré peut témoigner avec mesures de protection (anonymat).",
    "Art. 18-19 CP — Actes commis sous mission": "Cadre des actes commis dans le cadre d'une mission légale.",
    "ATF 137 II 209 — Limites de l'information parlementaire": "Limites posées par le TF à l'information du Parlement par le CF (haute surveillance).",
    "ATF 137 IV 33 (preuves recueillies par particuliers)": "Cadre d'admissibilité des preuves obtenues par des particuliers.",
    "ATF 141 IV 142 — Soustraction de données informatiques": "Précision sur l'art. 143 CP appliqué au numérique.",
    "ATF 142 IV 16 — Capacité de discernement et fin de vie": "Sur l'application de l'art. 19 CP (capacité de discernement).",
    "ATF 142 IV 49 — Droits du mineur en procédure pénale": "Droits spécifiques du mineur prévenu en procédure.",
    "ATF 142 IV 388 — Recevabilité d'actes coordonnés multilatéralement": "Sur la coordination internationale d'actes d'instruction.",
    "ATF 144 IV 23 — Limites de l'investigation secrète": "Précisions sur les art. 285a-289 CPP.",
    "ATF 144 IV 28 — Distinction art. 162 / 273 CP": "Différence entre violation du secret commercial et espionnage économique.",
    "ATF 147 IV 16 — Proportionnalité dans l'usage des données génétiques": "Application du principe de proportionnalité aux profils ADN.",
    "ATF nov. 2025 (rajeunissement IA)": "Jurisprudence récente sur l'usage de l'IA en procédure (à confirmer publication).",
}

# Sauver pour intégration
import json
with open('/tmp/new_glossary.json', 'w', encoding='utf-8') as f:
    json.dump(NEW_ENTRIES, f, ensure_ascii=False, indent=2)

print(f"Nouvelles entrées préparées : {len(NEW_ENTRIES)}")
