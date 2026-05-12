"""Ajouter 12 NPCs pour les 4 scènes basées sur cas réels :
Crypto AG (Rubikon), Swiss Life (Vadian), Hydra Market, LockBit (Op Cronos).

Convention pour personnages publics réels : prénom + initiale du nom + mention
explicite du rôle public réel dans shortBio, mais fictional=true puisque la scène
les fait agir dans un contexte fictionnel."""
import json

p = 'data/npcs.json'
data = json.load(open(p))
npcs = data['npcs']

new_npcs = {
    # ─── Scène A — Crypto AG / Opération Rubicon (2020) ───
    "oberholzer_juge_federal": {
        "name": "Dr. Niklaus O.",
        "role": "Ancien juge fédéral — chargé d'enquête sur l'affaire Crypto AG (mandat DélCdG, 2020)",
        "institution": "Mandat indépendant de la Délégation des Commissions de gestion (DélCdG) des Chambres fédérales, sur la base de l'art. 154a LParl",
        "shortBio": "Personnage fictif. Inspiré du Dr Niklaus Oberholzer, ancien juge au Tribunal fédéral suisse (Lucerne, 2012-2019) effectivement mandaté par le Conseil fédéral en janvier 2020 puis par la DélCdG en février 2020 pour conduire l'enquête sur l'affaire Crypto AG. Mandat conduit sous secret, avec les mêmes droits d'information que les membres de la DélCdG (art. 154 LParl). Rapport classifié secret remis à la DélCdG novembre 2020 — non publié pour ne pas nuire aux intérêts CH. Profil : pénaliste, ancien procureur cantonal St-Gall, juge cantonal puis fédéral, expertise reconnue en matière d'entraide pénale internationale et de droit pénal des affaires.",
        "fictional": True,
        "tags": ["delcdg", "enquete-administrative", "crypto-ag", "secret-fonction", "saint-gall"],
        "appearances": []
    },
    "amherd_ddps_cheffe": {
        "name": "Mme Viola A.",
        "role": "Cheffe du Département fédéral de la défense, de la protection de la population et des sports (DDPS) — informée fin 2019",
        "institution": "Département fédéral de la défense, de la protection de la population et des sports (DDPS), Berne",
        "shortBio": "Personnage fictif. Inspirée de Viola Amherd (PDC/Centre, VS), Conseillère fédérale et cheffe du DDPS de janvier 2019 à fin 2024. Informée fin 2019 par le directeur du SRC sur les soupçons concernant Crypto AG. A demandé au Conseil fédéral début 2020 de mandater une enquête indépendante (Oberholzer). Auditionnée par la DélCdG en février-mars 2020. Le rapport DélCdG novembre 2020 a relevé que l'information aux Conseillers fédéraux a été tardive et fragmentaire. Profil de la NPC fictive : juriste de formation, expérience parlementaire et exécutive, sensibilité aux questions de souveraineté et de neutralité CH.",
        "fictional": True,
        "tags": ["ddps", "conseil-federal", "crypto-ag", "src", "valais", "centre"],
        "appearances": []
    },
    "heer_delcdg_president": {
        "name": "M. Alfred H.",
        "role": "Président de la Délégation des Commissions de gestion (DélCdG) des Chambres fédérales — 2019-2020",
        "institution": "Délégation des Commissions de gestion (DélCdG), Parlement fédéral, Palais fédéral, 3003 Berne",
        "shortBio": "Personnage fictif. Inspiré du conseiller national Alfred Heer (UDC, ZH), président de la DélCdG durant la législature 2019-2023, qui a conduit l'enquête parlementaire sur l'affaire Crypto AG (février-novembre 2020). La DélCdG est l'organe de haute surveillance parlementaire sur le renseignement, accès aux informations classifiées (art. 154a LParl). Composée de 6 membres (3 par chambre), elle agit à huis clos. La présidence alterne CN/CE chaque année. Le rapport DélCdG du 10.11.2020 émet 12 recommandations au Conseil fédéral.",
        "fictional": True,
        "tags": ["delcdg", "haute-surveillance-parlementaire", "udc", "zurich", "conseil-national"],
        "appearances": []
    },
    "seco_director_export": {
        "name": "M. Stefan B.",
        "role": "Chef de la division Contrôle des exportations — Secrétariat d'État à l'économie (SECO)",
        "institution": "Secrétariat d'État à l'économie (SECO), Holzikofenweg 36, 3003 Berne — division Contrôles à l'exportation et sanctions",
        "shortBio": "Personnage fictif. Chef de division SECO chargé de l'application de la Loi fédérale sur le contrôle des biens utilisables à des fins civiles et militaires et des biens militaires spécifiques (LCB, RS 946.202) et de la Loi sur le matériel de guerre (LFMG, RS 514.51). En février 2020, le SECO a déposé plainte pénale au MPC contre inconnu pour infraction présumée à la LCB par les sociétés ayant exporté les appareils Crypto AG truqués. La DélCdG a qualifié cette plainte de prématurée (appréciation superficielle, argumentation juridique déficiente — rapport DélCdG 2020). Le SECO a aussi suspendu en décembre 2019 les licences générales d'exportation — mesure jugée illicite par la DélCdG.",
        "fictional": True,
        "tags": ["seco", "lcb", "controle-exportations", "berne", "loi-controle-biens", "biens-double-usage"],
        "appearances": []
    },
    "cyone_security_lead": {
        "name": "Dr. ing. Markus W.",
        "role": "Chief Technology Officer (CTO) — CyOne Security AG (successeur suisse de Crypto AG)",
        "institution": "CyOne Security AG, Zugerstrasse 42, 6312 Steinhausen ZG (successeur du volet suisse de Crypto AG depuis 2018)",
        "shortBio": "Personnage fictif. CTO de CyOne Security AG, société créée en 2018 lors de la scission de Crypto AG : (a) CyOne Security AG, basée à Steinhausen (ZG), avec uniquement le gouvernement suisse comme client (chiffrement armée CH, administration fédérale, ambassades, infrastructures critiques) ; (b) Crypto International AG, vendue à des investisseurs suédois pour les clients internationaux. Trois anciens membres du conseil de Crypto AG dirigeraient CyOne. Témoin clé dans l'enquête Oberholzer car détient les archives techniques et les schémas des algorithmes historiques. Position délicate : doit coopérer avec la DélCdG sans compromettre les contrats actifs avec l'armée CH.",
        "fictional": True,
        "tags": ["cyone-security", "crypto-ag", "steinhausen", "zoug", "chiffrement-gouvernemental", "succession"],
        "appearances": []
    },
    
    # ─── Scène B — Swiss Life / Vadian.net (2025) ───
    "ciso_swisslife": {
        "name": "M. Beat Z.",
        "role": "Group Chief Information Security Officer (CISO) — Swiss Life Holding",
        "institution": "Swiss Life Holding AG, General-Guisan-Quai 40, 8002 Zürich",
        "shortBio": "Personnage fictif. CISO groupe Swiss Life depuis 2021, responsable de la sécurité informatique des 11'000 collaborateurs et 1.4M de clients privés + 50'000 entreprises clientes CH. Doctorat informatique ETHZ, certifications CISSP, CISM. Coordonne avec l'AVE-CHAP (Association des chefs de la sécurité de l'information de la place financière). Gère la relation avec ~50 fournisseurs tiers critiques (cloud, authentification, traitement, courrier). A piloté la réponse à l'incident Vadian.net de février-mars 2025 (60 caisses de pension affectées, 13'000 assurés).",
        "fictional": True,
        "tags": ["ciso", "swiss-life", "zurich", "assurance-vie", "caisses-pension", "vadian"],
        "appearances": []
    },
    "ciso_vadian_net": {
        "name": "M. Andreas L.",
        "role": "CISO et responsable conformité — Vadian.net AG (fournisseur SMS 2FA)",
        "institution": "Vadian.net AG, Davidstrasse 38, 9000 St-Gall (fournisseur de services de communication numérique, SMS d'authentification 2FA)",
        "shortBio": "Personnage fictif. CISO de Vadian.net AG, société saint-galloise active depuis 1998, qui fournit des services SMS d'authentification 2FA à plus de 200 entreprises et institutions CH (assurances, banques, e-commerce, administrations). Compromission entre 15-21 février 2025 ayant affecté plusieurs clients dont Swiss Life Pension Services (60 caisses de pension, 13'000 assurés concernés). Annoncé à l'OFCS dès découverte (notification obligatoire LSCPT/LPD). Témoin technique principal dans la procédure pénale.",
        "fictional": True,
        "tags": ["vadian", "saint-gall", "sms-2fa", "fournisseur-tiers", "supply-chain", "ciso"],
        "appearances": []
    },
    "pensionskasse_admin_juriste": {
        "name": "Me Daniela K.",
        "role": "Juriste senior — administration d'une caisse de pension affiliée Swiss Life Pension Services",
        "institution": "Caisse de pensions affiliée à Swiss Life Pension Services (anonymisée — convention : Vorsorge AG, 1'800 assurés)",
        "shortBio": "Personnage fictif. Juriste responsable de la conformité d'une caisse de pension intercommunale affiliée à Swiss Life Pension Services (1'800 assurés). En charge des obligations LPP, OPP2, art. 49 LPP (responsabilité personnelle des organes), notification aux autorités de surveillance LPP (CHS PP — Commission de haute surveillance de la prévoyance professionnelle). Après notification Swiss Life de l'incident Vadian, doit décider : (a) information directe aux 1'800 assurés, (b) cellule de crise avec conseil de fondation, (c) prise en compte assurance cyber. Représentative des situations vécues par les 60 caisses de pension affectées en mars 2025.",
        "fictional": True,
        "tags": ["caisse-pension", "juriste", "lpp", "vorsorge", "chs-pp", "art-49-lpp"],
        "appearances": []
    },
    
    # ─── Scène C — Hydra Market (2022) ───
    "bka_liaison_ch_fedpol": {
        "name": "Krim.-Hauptkommissar Tobias S.",
        "role": "Officier de liaison Bundeskriminalamt (BKA) — Allemagne / Ambassade DE à Berne",
        "institution": "Bundeskriminalamt (BKA), Wiesbaden — détaché à l'Ambassade d'Allemagne à Berne (Willadingweg 83, 3006 Berne)",
        "shortBio": "Personnage fictif. Commissaire principal détaché par le BKA à l'Ambassade allemande à Berne depuis 2020, point de contact privilégié avec fedpol pour les enquêtes cyber et les opérations transfrontières. A coordonné en avril-juillet 2022 la transmission à fedpol des données issues de la saisie d'Hydra Market (5 avril 2022) : ~2'400 acheteurs suisses identifiés + 47 vendeurs suisses dans les CDR Hydra. Cadre juridique : art. 30+31 Convention de Budapest, accord bilatéral CH-DE 2017, EIMP en parallèle pour les éléments de preuve formels.",
        "fictional": True,
        "tags": ["bka", "allemagne", "liaison", "fedpol", "hydra", "darknet", "wiesbaden"],
        "appearances": []
    },
    "nedik_coordinator": {
        "name": "M. Daniel N.",
        "role": "Coordinateur opérationnel — Réseau national de soutien aux enquêtes dans la lutte contre la criminalité informatique (NEDIK)",
        "institution": "NEDIK — coordination via la Kantonspolizei Zürich (siège opérationnel)",
        "shortBio": "Personnage fictif inspiré de Daniel Nussbaumer, qui dirige effectivement la cellule cybercriminalité de la Kapo Zürich et coordonne le NEDIK depuis sa création en 2018. Le NEDIK regroupe 7 représentants opérationnels (Kapo ZH, BE, LU, TI, GE, SG + fedpol) et coordonne les dossiers cyber multi-cantonaux. Bulletins mensuels et lutte contre la cybercriminalité fédérale. Coordonne avec OFCS, MROS, et autorités internationales (BKA, Europol, NCA). Pilote la répartition des ~2'400 acheteurs Hydra identifiés vers les ministères publics cantonaux compétents pour poursuite.",
        "fictional": True,
        "tags": ["nedik", "kapo-zh", "coordination-intercantonal", "cybercriminalite", "zurich"],
        "appearances": []
    },
    
    # ─── Scène D — LockBit / Operation Cronos (2024) ───
    "datacenter_ch_ciso": {
        "name": "M. Roland H.",
        "role": "CISO — datacenter suisse hébergeant l'un des 34 serveurs LockBit saisis (anonymisé — convention Datacenter Suisse SA)",
        "institution": "Datacenter suisse SA (anonymisé pour respect du secret de l'enquête — hébergeur bullet-proof suspecté de complaisance, basé en Tessin)",
        "shortBio": "Personnage fictif. CISO d'un datacenter suisse identifié par la NCA comme hébergeant l'un des 34 serveurs LockBit saisis lors de l'Opération Cronos (19-20 février 2024). L'hébergeur opère en mode bullet-proof (questions limitées aux clients, juridiction CH historiquement plus permissive sur les contenus). Sous le coup d'une procédure d'entraide EIMP CH-UK et CH-US. Témoin clé pour la procédure pénale CH parallèle ouverte par le MPC pour blanchiment d'argent (art. 305bis CP) et participation à une organisation criminelle (art. 260ter CP).",
        "fictional": True,
        "tags": ["datacenter", "tessin", "bullet-proof", "lockbit", "hebergeur", "ciso"],
        "appearances": []
    },
    "europol_ec3_liaison": {
        "name": "Mme Anke V.",
        "role": "Liaison Europol-EC3 (European Cybercrime Centre) — Bureau de liaison CH",
        "institution": "Europol EC3 (European Cybercrime Centre), Eisenhowerlaan 73, 2517 KK La Haye — bureau de liaison CH via accord coopération Europol-CH 2011",
        "shortBio": "Personnage fictif. Officier de liaison Europol au Centre européen de lutte contre la cybercriminalité (EC3), point de contact pour les enquêtes impliquant la Suisse. La Suisse coopère avec Europol via l'accord opérationnel signé en 2011 (fedpol partenaire stratégique). EC3 a coordonné l'opération Cronos pour le volet européen (34 serveurs dans 8 pays dont CH, 2 arrestations Pologne/Ukraine, 14'000 comptes affiliés fermés, 200 comptes crypto gelés). Implication CH via fedpol et MPC pour la saisie du serveur LockBit en CH (Tessin) le 19.02.2024.",
        "fictional": True,
        "tags": ["europol", "ec3", "la-haye", "liaison", "lockbit", "cronos"],
        "appearances": []
    },
}

added = 0
for nid, npc in new_npcs.items():
    if nid not in npcs:
        npcs[nid] = npc
        added += 1
    else:
        print(f"  · {nid}: déjà présent (skip)")

data['npcs'] = dict(sorted(npcs.items()))
json.dump(data, open(p,'w'), ensure_ascii=False, indent=2)
print(f"NPCs ajoutés: {added}/{len(new_npcs)}")
print(f"Total NPCs: {len(data['npcs'])}")
