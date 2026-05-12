#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v2.62 — 2e batch glossaire : on cible les ratés fréquents identifiés.

Stratégie : ne pas chercher l'exhaustivité (impossible à 100% car les
libellés sont libres dans les scènes), mais couvrir les domaines clés
qui restent encore "blancs" : EIMP, LB (banque), CO, CPP avec qualifiants,
LSI, normes ISO/COBIT, règlements UE supplémentaires.
"""

BATCH2 = {
    # ─── EIMP (entraide internationale) - super important pour le corpus ───
    "Art. 64 EIMP": "Mesures de contrainte en entraide : conditions, proportionnalité.",
    "Art. 64 EIMP — Mesures de contrainte (entraide)": "Cadre des mesures de contrainte exécutées en entraide pénale internationale.",
    "Art. 67 EIMP": "Principe de spécialité : les preuves transmises ne peuvent être utilisées que pour les infractions citées.",
    "Art. 67 EIMP — Principe de spécialité": "Limite l'usage des preuves transmises aux infractions visées par la commission rogatoire.",
    "Art. 75 EIMP": "Forme et contenu des demandes d'entraide : exigences formelles.",
    "Art. 75 EIMP — Forme et contenu des demandes": "Conditions formelles de validité d'une demande d'entraide.",
    "Art. 80a EIMP": "Décision de clôture : transmission effective des preuves à l'État requérant.",
    "Art. 80a EIMP — Décision de clôture": "Acte par lequel la Suisse remet finalement les preuves à l'État étranger.",
    "Art. 80b EIMP": "Recours contre la décision de clôture : 30 jours, effet suspensif.",
    "Art. 80c EIMP": "Procédure simplifiée : remise immédiate avec accord de l'intéressé.",

    # ─── CPP avec libellés alternatifs ───
    "CPP art. 24": "Compétence fédérale du MPC : crimes contre la Confédération, terrorisme, criminalité transfrontalière.",
    "CPP art. 24 — Compétence MPC": "Compétence fédérale du MPC sur certaines infractions (terrorisme, etc.).",
    "CPP art. 24 — Compétence MPC (terrorisme = compétence fédérale)": "Le terrorisme tombe automatiquement sous compétence MPC.",
    "CPP art. 269 ss": "Surveillance de la correspondance par télécommunication (art. 269-279).",
    "CPP art. 269 ss — Surveillance des télécommunications": "Régime de la surveillance des télécommunications en CH.",
    "CPP art. 269bis": "GovWare (chevaux de Troie d'État) : dispositifs techniques particuliers.",
    "CPP art. 269bis — GovWare (dispositifs techniques d'investigation)": "Cadre légal des chevaux de Troie d'État (GovWare) introduit en 2018.",
    "CPP art. 280": "Surveillance par dispositifs techniques : sons et images.",
    "CPP art. 280 — Surveillance par dispositifs techniques": "Surveillance audiovisuelle hors domaine privé sécurisé.",
    "Code de procédure pénale art. 263": "Séquestre : voir Art. 263 CPP.",
    "Code de procédure pénale art. 263 — Séquestre": "Variation textuelle de l'art. 263 CPP (séquestre).",
    "Art. 22 CPP": "Compétence cantonale (règle générale) : MP du canton où l'infraction a été commise.",
    "Art. 22 CPP — compétence cantonale (règle générale)": "Règle générale : MP cantonal compétent du lieu de commission.",
    "Art. 23 CPP": "Compétence fédérale : exceptions à la compétence cantonale.",
    "Art. 23 CPP — compétence fédérale (infractions fédérales)": "Compétence fédérale du MPC pour certaines infractions.",
    "Art. 28 CPP": "Jonction de procédures : poursuite groupée d'infractions liées.",
    "Art. 28 CPP — jonction de procédures": "Possibilité de joindre plusieurs procédures connexes.",
    "Art. 276 CPP": "Information mutuelle entre autorités pénales (canton/MPC, etc.).",
    "Art. 276 CPP — Information mutuelle entre autorités": "Coordination entre autorités pénales suisses.",
    "art. 141 CPP (preuves illicites)": "Régime des preuves illicites en procédure pénale.",
    "Art. 141 CPP (preuves illicites)": "Régime des preuves illicites en procédure pénale.",

    # ─── CP avec libellés alternatifs ───
    "Art. 117 CP": "Homicide par négligence : décès causé par négligence.",
    "Art. 117 CP — Homicide par négligence (en cas de décès dû à l'incident)": "Homicide par négligence (peine pécuniaire ou peine privative jusqu'à 3 ans).",
    "Art. 122 CP": "Lésions corporelles graves : atteinte sérieuse à l'intégrité physique.",
    "art. 122 CP (lésions corporelles graves)": "Lésions corporelles graves : atteintes sérieuses à l'intégrité physique.",
    "Art. 181 CP": "Contrainte : forcer autrui à faire/ne pas faire/tolérer.",
    "Art. 181 CP — Contrainte": "Délit de contrainte : forcer autrui par violence ou menace.",
    "art. 181 CP (contrainte)": "Délit de contrainte (Art. 181 CP).",
    "Art. 183 CP": "Séquestration et enlèvement : privation illégale de liberté.",
    "art. 183 CP (séquestration)": "Séquestration : privation illégale de la liberté.",
    "Art. 22 CP": "Tentative : début d'exécution sans achèvement.",
    "Art. 24 CP": "Instigation : déterminer autrui à commettre une infraction.",
    "Art. 25 CP": "Complicité : aider intentionnellement un auteur.",
    "Art. 26 CP": "Concours de personnes : co-auteurs, instigateurs, complices.",
    "Art. 47 CP": "Fixation de la peine : critères (faute, antécédents, circonstances).",
    "Art. 50 CP": "Motivation de la peine : justification écrite obligatoire.",
    "Art. 72 CP": "Confiscation des valeurs patrimoniales d'une organisation criminelle.",
    "Art. 72 CP — Confiscation des valeurs patrimoniales": "Confiscation patrimoniale des valeurs d'une organisation criminelle (charge de la preuve renversée).",
    "Art. 260ter CP": "Organisation criminelle : participation, soutien (terrorisme inclus).",
    "Art. 260ter CP — Organisation criminelle (incl. terroriste)": "Participation/soutien à organisation criminelle ou terroriste.",
    "Art. 260quinquies CP": "Financement du terrorisme : peine privative jusqu'à 5 ans.",
    "Art. 260quinquies CP — Financement du terrorisme": "Financement du terrorisme : infraction autonome.",
    "Art. 260sexies CP": "Actes préparatoires délictueux (terrorisme).",
    "Art. 260sexies CP — Actes préparatoires délictueux (terrorisme)": "Actes préparatoires en matière terroriste : criminalisation anticipée.",
    "Art. 296-302 CP": "Crimes contre les États étrangers : neutralité, espionnage.",
    "Art. 296-302 CP — Crimes contre les États étrangers": "Régime des infractions contre la neutralité et les États étrangers.",
    "Art. 351 CP": "Service de renseignements politiques (en miroir avec art. 272).",
    "Art. 351 CP — Service de renseignements politiques (en miroir)": "Variante de l'art. 272 CP (espionnage politique).",
    "Art. 179octies CP": "Mise sous écoute autorisée : exception au secret de la correspondance.",
    "Art. 179octies CP — Mise sous écoute": "Cadre légal des écoutes autorisées (différent de 179bis).",
    "art. 187 CP (actes d'ordre sexuel avec enfants)": "Actes sexuels avec mineur de moins de 16 ans (Art. 187 CP).",
    "art. 197 CP (pornographie, y compris simulée par adulte)": "Pornographie, y compris contenus simulant des mineurs (Art. 197 CP).",
    "art. 198 CP (désagréments d'ordre sexuel) — distinct du 198 français": "Délits de désagréments sexuels (variation suisse).",
    "art. 173-174 CP (atteinte à l'honneur)": "Diffamation, calomnie (Art. 173-178 CP).",

    # ─── CC, CO, autres lois civiles ───
    "Art. 28b CC": "Protection de la personnalité contre la violence (mesures civiles).",
    "Art. 28b CC — Protection de la personnalité contre la violence": "Mesures civiles d'éloignement contre auteurs de violence.",
    "Art. 97 CO": "Responsabilité contractuelle pour inexécution.",
    "Art. 97 CO (responsabilité contractuelle)": "Responsabilité contractuelle pour inexécution ou exécution défectueuse.",

    # ─── LB / LBA / banques ───
    "Art. 47 LB": "Secret bancaire suisse : violation = peine privative jusqu'à 3 ans.",
    "Art. 47 LB — Secret bancaire suisse": "Article fondamental du secret bancaire en Suisse (LB = Loi sur les banques).",
    "Art. 10 LBA": "Interdiction d'aviser le client d'une communication MROS (tipping-off).",
    "Art. 10 LBA — Interdiction d'aviser le client": "Tipping-off interdit : l'intermédiaire ne peut pas avertir le client.",
    "Convention LCB-FT": "Convention de diligence des banques (CDB) : KYC, identification de l'ayant droit économique.",
    "Convention LCB-FT — Communication MROS": "Convention de diligence ASB : règles pratiques anti-blanchiment.",

    # ─── nLPD (nouvelle Loi protection données) ───
    "nLPD": "Nouvelle LPD (RS 235.1) : version 2023, totalement révisée.",
    "nLPD art. 24": "Annonce des violations de sécurité au PFPDT (équivalent art. 24 LPD 2023).",
    "nLPD art. 24 — Annonce des violations de la sécurité des données": "Notification obligatoire au PFPDT en cas de fuite de données à risque élevé.",

    # ─── Conventions / accords ───
    "Convention de Budapest (CETS 185)": "Convention sur la cybercriminalité (Conseil de l'Europe, 2001).",
    "Convention de Budapest (CETS 185) — Cybercriminalité": "Convention internationale sur la cybercriminalité (Budapest 2001).",
    "Convention de Budapest art. 29": "Conservation rapide de données stockées (preservation order).",
    "Convention de Budapest art. 29 — Conservation rapide des données": "Permet de demander la conservation rapide de données électroniques en attendant l'entraide.",
    "Convention européenne d'entraide judiciaire": "Convention européenne d'entraide judiciaire en matière pénale (Strasbourg 1959).",
    "Convention européenne d'entraide judiciaire en matière pénale (1959)": "Convention de Strasbourg : socle de l'entraide pénale en Europe.",
    "Convention européenne d'entraide judiciaire (CEEJ)": "Convention de Strasbourg 1959 (CEEJ) : entraide pénale européenne.",
    "Convention européenne d'entraide judiciaire (CEEJ) art. 1": "Champ d'application de la CEEJ : entraide la plus large possible.",
    "Convention de La Haye 1907": "Convention de La Haye sur la neutralité en cas de guerre.",
    "Convention de La Haye 1907 — Neutralité": "Définit les obligations des États neutres en temps de guerre.",
    "Conv. Genève (droit humanitaire)": "Conventions de Genève (1949) : protection humanitaire en temps de conflit.",
    "Traité MLAT Suisse-USA (1973)": "Traité d'entraide judiciaire CH-USA (1973) : voie privilégiée mais avec restrictions.",
    "Cst. art. 173 al. 1 let. a": "Compétence du Parlement en matière de relations extérieures.",
    "Cst. art. 173 al. 1 let. a — Compétence en relations extérieures": "L'Assemblée fédérale traite les questions de politique extérieure.",
    "Communiqué CICR 19.01.2022": "Communiqué du CICR du 19.01.2022 (cyberattaque contre le CICR).",

    # ─── Règlements UE (cyber, douanes) ───
    "Règlement EUROPOL": "Règlement (UE) 2016/794 sur Europol.",
    "Règlement EUROPOL 2016/794": "Règlement (UE) 2016/794 sur Europol et la coopération policière.",
    "Règlement UE ICS2": "Système d'information préalable sur les envois (Import Control System 2).",
    "Règlement UE ICS2 — Système d'information préalable sur les envois": "Système douanier UE de pré-déclaration des marchandises entrant en UE.",
    "Code des douanes UE": "Règlement (UE) 952/2013 : code des douanes de l'Union.",
    "Code des douanes UE — Bloc de fonds suspects": "Permet aux douanes UE de bloquer les fonds suspects en provenance/destination de pays sanctionnés.",
    "Convention de Schengen": "Convention d'application de l'accord de Schengen (1990) : frontières + coopération policière.",
    "Convention de Schengen — Coopération policière": "Cadre Schengen pour la coopération policière transfrontalière (SIS, art. 39-46 CAS).",

    # ─── GAFI / FATF ───
    "Recommandations GAFI": "40 recommandations du GAFI : standards anti-blanchiment et anti-financement du terrorisme.",
    "Recommandations GAFI 24 et 25": "Transparence des personnes morales et fiduciaires (bénéficiaire effectif).",
    "Recommandations GAFI 24 et 25 — Transparence des personnes morales et fiduciaires": "Standards GAFI sur la transparence des bénéficiaires effectifs.",

    # ─── Lois fédérales spécifiques ───
    "LIE": "Loi sur l'information et la sécurité (infrastructures critiques) — non standard, libellé corpus.",
    "LIE — Loi sur l'information et la sécurité (infrastructure critique)": "Cadre fédéral sur la sécurité de l'information dans les infrastructures critiques.",
    "LSFin": "Loi sur les services financiers (RS 950.1) : protection des investisseurs, devoir d'information.",
    "Loi sur les services financiers (LSFin)": "Loi fédérale sur les services financiers (RS 950.1).",
    "Loi sur les services financiers (LSFin) — Mise en garde devoir d'information": "Devoirs d'information et de mise en garde des prestataires financiers (LSFin).",
    "LDA": "Loi fédérale sur le droit d'auteur (RS 231.1).",
    "Art. 61 LDA": "Violation du droit d'auteur à des fins commerciales (sanction pénale).",
    "Art. 61 LDA — Violation du droit d'auteur à des fins commerciales": "Sanction pénale aggravée pour violation du droit d'auteur à des fins lucratives.",
    "LD": "Loi sur les douanes (RS 631.0).",
    "Art. 75 LD": "Infractions douanières : déclaration fausse ou incomplète.",
    "Art. 75 LD — Infractions douanières": "Régime pénal des infractions douanières (déclaration fausse/incomplète).",
    "Art. 75 LD — Infractions douanières : déclaration fausse ou incomplète": "Infraction de déclaration douanière mensongère.",
    "DPMin": "Loi fédérale régissant la condition pénale des mineurs (RS 311.1).",
    "Art. 19 al. 2 DPMin": "Mesures pour mineurs/jeunes adultes 18-25 ans (placement spécifique).",
    "Art. 19 al. 2 DPMin — Mesures pour mineurs/jeunes adultes (18-25 ans)": "Régime particulier de mesures pour les jeunes adultes 18-25 ans.",
    "LAVI": "Loi fédérale sur l'aide aux victimes (RS 312.5) : conseil, indemnisation, accompagnement.",
    "LAVI — Loi sur l'aide aux victimes": "Cadre fédéral d'aide aux victimes d'infractions (centres LAVI cantonaux).",
    "Loi al-Qaïda / EI": "Loi fédérale interdisant les groupes 'Al-Qaïda', 'État islamique' et organisations apparentées (RS 122).",
    "Loi al-Qaïda / EI (RS 122)": "Loi fédérale interdisant Al-Qaïda et État islamique (compétence MPC pour les infractions).",
    "Loi al-Qaïda / EI (RS 122) — interdiction et procédure": "Loi fédérale d'interdiction Al-Qaïda/EI : procédure pénale spécifique (compétence MPC).",

    # ─── Standards / référentiels techniques ───
    "ISAE 3402": "Norme internationale d'audit pour les contrôles internes des prestataires de services.",
    "ISAE 3402 Type 2 / SOC 2": "Audits de contrôle interne (Type 2 = effectivité sur période ; SOC 2 = sécurité, dispo, confidentialité).",
    "SOC 2": "Service Organization Control 2 : audit AICPA sur sécurité, disponibilité, confidentialité, intégrité.",
    "COBIT": "Control Objectives for Information Technology : référentiel de gouvernance IT (ISACA).",
    "COBIT 2019": "Version 2019 du référentiel COBIT.",
    "COBIT 2019 — Référentiel d'audit": "Référentiel ISACA de gouvernance IT (2019).",

    # ─── ATF supplémentaires ───
    "ATF 142 IV 250": "Distinction données de connexion / contenu (art. 269 ss CPP).",
    "Doctrine ATF 142 IV 250": "Jurisprudence sur la distinction données de connexion (métadonnées) vs contenu.",
    "Doctrine ATF 142 IV 250 — Distinction données de connexion / contenu": "Précise la frontière entre métadonnées (art. 273) et contenu (art. 269).",
    "ATF 144 II 233": "Juridiction sur données dans le cloud : compétence territoriale extraterritoriale.",
    "Doctrine ATF 144 II 233 — Juridiction sur données dans le cloud": "Précise la compétence des autorités CH sur des données stockées hors CH.",
    "Doctrine TF 6B_2024/X": "Jurisprudence récente sur le stalking par objet connecté (à confirmer).",
    "Doctrine TF 6B_2024/X — Stalking par objet connecté": "Jurisprudence émergente sur l'usage d'objets connectés dans les violences conjugales.",

    # ─── Doctrines / stratégies ───
    "CyberStratVS": "Stratégie cyber du canton du Valais (mesures M1 à M3 inclus M3.2c).",
    "CyberStratVS mesure M3.2c": "Mesure spécifique de la stratégie cyber valaisanne.",
    "Doctrine OFSP 2024": "Doctrine OFSP 2024 sur la cybersécurité hospitalière.",
    "Doctrine OFSP 2024 — Cybersécurité hospitalière": "Doctrine 2024 de l'Office fédéral de la santé publique sur la sécurité IT des hôpitaux.",

    # ─── CVE references ───
    "CVE-2021-40539": "Vulnérabilité critique ManageEngine ADSelfService Plus (auth bypass + RCE), exploitée par APT.",
}

import json
with open('/tmp/batch2.json', 'w', encoding='utf-8') as f:
    json.dump(BATCH2, f, ensure_ascii=False, indent=2)
print(f"Batch 2 : {len(BATCH2)} entrées")
