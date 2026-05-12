"""Ajout des 18 NPCs nécessaires pour les 3 scènes Priorité 3 :
- mineur-auteur-defi-tiktok-deces-vd (5 NPCs nouveaux)
- antisemitisme-ligne-261bis-zh (7 NPCs nouveaux)
- ems-fraude-deepfake-vocal-fils-lu (6 NPCs nouveaux)

Personnages publics réels : fictionnalisés (initiale + mention rôle public).
Personnages purement fictifs : convention name = prénom + initiale.
"""
import json
p = 'data/npcs.json'
data = json.load(open(p))
npcs = data['npcs']

new_npcs = {
    # ─── Scène 13 — TikTok mineur (VD) ───────────────────────
    "psy_jeunes_addictions": {
        "name": "Dr. Sophie M.",
        "role": "Pédopsychiatre spécialisée en addictions numériques — SUPEA CHUV Lausanne",
        "institution": "Service universitaire de psychiatrie de l'enfant et de l'adolescent (SUPEA), CHUV — Site de Cery, 1008 Prilly",
        "shortBio": "Personnage fictif. Pédopsychiatre senior au SUPEA-CHUV depuis 2018, spécialisée dans l'addiction aux écrans, les défis viraux dangereux et le rôle des plateformes algorithmiques dans le mal-être adolescent. Auteure d'études cliniques sur 'Blackout Challenge' (35+ cas suivis CHUV 2021-2024), 'Benadryl Challenge', 'Skull Breaker Challenge'. Consulte la Confédération sur les cyber-risques jeunesse (rapport OFAS 2023). Témoin expert dans les procédures DPMin auteurs/victimes — mandats art. 184 CPP appliqués par renvoi art. 3 DPMin.",
        "fictional": True,
        "tags": ["pedopsychiatre", "chuv", "supea", "addictions-numeriques", "defis-viraux", "tiktok", "ados", "lausanne", "vaud"],
        "appearances": []
    },
    "ado_auteur_mineur_15ans": {
        "name": "Mineur L.M. (15 ans)",
        "role": "Adolescent auteur — élève secondaire, anonymisé pour protection identité",
        "institution": "Élève en 11H (école secondaire de Renens), domicilié district de l'Ouest lausannois",
        "shortBio": "Personnage fictif. Adolescent de 15 ans, auteur présumé d'un défi viral 'Blackout Challenge' partagé sur TikTok ayant entraîné le décès d'un camarade de classe (14 ans). Capacité de discernement en principe acquise dès 10 ans (art. 9 DPMin) ; responsabilité pénale juvénile pleine entre 10-18 ans avec sanctions adaptées (art. 21-25 DPMin). Pas de fichage casier judiciaire ordinaire. Procédure huis clos (art. 4 DPMin). Représenté par défenseur d'office. Convocation parents obligatoire (art. 35 DPMin).",
        "fictional": True,
        "tags": ["mineur-auteur", "dpmin", "blackout-challenge", "tiktok", "ouest-lausannois", "renens", "vaud"],
        "appearances": []
    },
    "parents_victime_ado": {
        "name": "Famille K. (parents de la victime, 14 ans)",
        "role": "Parents de l'adolescent décédé — parties plaignantes constituées",
        "institution": "Famille domiciliée à Renens (VD) — père comptable, mère infirmière HUG-CHUV",
        "shortBio": "Personnage fictif. Parents d'un adolescent de 14 ans décédé suite à participation au 'Blackout Challenge' diffusé sur TikTok par un camarade. Partie plaignante dans la procédure DPMin contre l'auteur du défi (15 ans), avec demandes indemnitaires (art. 122 CPP par renvoi art. 3 DPMin). Procédure civile parallèle envisagée contre TikTok / ByteDance pour responsabilité de la plateforme (art. 41 CO, dommages-intérêts, recours collectif éventuel). Accompagnés par avocat spécialisé responsabilité civile + association Stop Suicide.",
        "fictional": True,
        "tags": ["famille-victime", "parents-plaignants", "renens", "vaud", "responsabilite-civile", "tiktok"],
        "appearances": []
    },
    "directeur_etablissement_scolaire": {
        "name": "M. Pascal R.",
        "role": "Directeur d'établissement secondaire — Région Ouest lausannois (DGEO Vaud)",
        "institution": "Établissement scolaire secondaire (école obligatoire 11H), District de l'Ouest lausannois — DGEO Vaud, Av. de Cour 33bis, 1014 Lausanne",
        "shortBio": "Personnage fictif. Directeur d'établissement scolaire VD. Compétence : 1'200 élèves, 95 enseignants. Responsabilités en cas d'incident grave entre élèves : signalement immédiat à la Direction pédagogique DGEO + Médiation école (art. 145 LEO Vaud), coordination avec service psychologique scolaire (PPLS), liaison avec procureur des mineurs si infraction pénale suspectée. Pour les défis viraux dangereux : doctrine DGEO 2022 prévoit prévention via cours d'éducation aux médias + Brigade jeunesse Polcant VD.",
        "fictional": True,
        "tags": ["dgeo", "ecole-secondaire", "ouest-lausannois", "vaud", "11h", "ppls", "leo-vaud"],
        "appearances": []
    },
    "tiktok_legal_eu_liaison": {
        "name": "Mme Maria O.",
        "role": "EU Legal & Government Affairs Manager — TikTok (ByteDance) — Bureau Dublin",
        "institution": "TikTok Technology Limited, ByteDance Group — The Sorting Office, Ringsend Road, Dublin 4, Irlande (DSA single point of contact EU)",
        "shortBio": "Personnage fictif. Responsable des relations avec les autorités européennes pour TikTok, y compris les demandes d'entraide pénale émanant d'États membres EU et de la Suisse. Point de contact unique pour le Digital Services Act (DSA, règlement UE 2022/2065 entré en vigueur 17.02.2024 pour VLOPs/VLOSEs). Traite environ 200 demandes/an d'autorités CH (sur 35'000 globales EU). Mandate les équipes techniques pour préservation des logs (art. 16 DSA conservation 90 jours), transmission des contenus en cas de réquisition judiciaire (art. 22 CPP appliqué via EIMP), et notification aux autorités en cas de risque imminent (art. 22 DSA pour life-threatening content).",
        "fictional": True,
        "tags": ["tiktok", "bytedance", "dublin", "dsa", "vlop", "liaison-eu", "preservation-logs"],
        "appearances": []
    },
    
    # ─── Scène 14 — Antisémitisme (ZH) ───────────────────────
    "fsci_directeur_juif": {
        "name": "M. Jonathan K.",
        "role": "Secrétaire général adjoint — Fédération suisse des communautés israélites (FSCI/SIG)",
        "institution": "FSCI — Fédération suisse des communautés israélites (Schweizerischer Israelitischer Gemeindebund, SIG), Gotthardstrasse 65, 8002 Zürich",
        "shortBio": "Personnage fictif. Secrétaire général adjoint à la FSCI/SIG, faîtière des ~17'500 juifs CH représentés par 16 communautés (dont CIL Lausanne, CIG Genève, ICZ Zurich qui regroupe ~3'000 membres). Coordination des plaintes pénales art. 261bis CP collectives (avec GRA depuis 2015 — 20 plaintes simultanées historiques). Rédige le rapport annuel FSCI/GRA sur l'antisémitisme en Suisse (2024 : ~1'200 incidents recensés, hausse marquée post-7 octobre 2023, dont majorité en ligne). Témoin expert dans procédures pénales antisémitisme.",
        "fictional": True,
        "tags": ["fsci", "sig", "communautes-israelites", "antisemitisme", "art-261bis-cp", "zurich"],
        "appearances": []
    },
    "gra_directeur_antisemitisme": {
        "name": "Dr. Markus S.",
        "role": "Directeur — Fondation GRA contre le racisme et l'antisémitisme",
        "institution": "Fondation GRA / Stiftung gegen Rassismus und Antisemitismus, Postfach, 8027 Zürich",
        "shortBio": "Personnage fictif. Directeur de la GRA. Mission : recensement, dénonciation et poursuite des actes racistes et antisémites en Suisse. Coordination avec FSCI/SIG, EKR/CFR, GMS. Base de données 1995-2024 : ~3'500 incidents documentés, dont ~28% conduits à condamnation art. 261bis CP. Avocat de formation, expertise reconnue sur la jurisprudence TF 261bis CP (ATF 148 IV 188, TF 6B_986/2017, TF 6B_627/2015, etc.). Témoin expert régulier devant Tribunal des mesures de contrainte ZH et tribunaux pénaux cantonaux.",
        "fictional": True,
        "tags": ["gra", "gms", "antisemitisme", "racisme", "art-261bis-cp", "zurich"],
        "appearances": []
    },
    "cfr_eckert_president": {
        "name": "Mme Ursula E.",
        "role": "Membre de la Commission fédérale contre le racisme (CFR/EKR) — Berne",
        "institution": "Commission fédérale contre le racisme (CFR/EKR), Inselgasse 1, 3003 Berne (commission consultative extra-parlementaire indépendante DFI)",
        "shortBio": "Personnage fictif. Membre de la CFR/EKR, commission consultative du Conseil fédéral instituée 1995 simultanément à l'entrée en vigueur de l'art. 261bis CP. Composée de 15 membres représentant les communautés discriminées et la société civile. Maintient le registre exhaustif des décisions pénales 261bis CP (935 cas signalés 1995-2019, 62% condamnations, 38% acquittement/classement). Publie des rapports semestriels sur les tendances. Auteure de l'étude 'La norme pénale antiraciste dans la pratique judiciaire' (PDF EKR, 320 pages, référence académique en CH).",
        "fictional": True,
        "tags": ["cfr", "ekr", "racisme", "art-261bis-cp", "berne", "dfi"],
        "appearances": []
    },
    "kapo_zh_lkj_chef": {
        "name": "Hauptmann Jürg B.",
        "role": "Chef de la Section criminalité de haine — Kantonspolizei Zürich",
        "institution": "Kantonspolizei Zürich, Kasernenstrasse 29, 8021 Zürich — Sektion Hass-Kriminalität (créée 2019 suite à augmentation des signalements)",
        "shortBio": "Personnage fictif. Capitaine, chef de la section spécialisée 'Hass-Kriminalität' (criminalité de haine) à la Kantonspolizei Zürich. Équipe de 12 enquêteurs cyber dédiés aux art. 261bis CP, art. 173-174 CP (diffamation/calomnie), art. 180 CP (menaces). Traite ~280 dossiers/an pour ZH seul (premier canton en volume). Coordination directe avec NEDIK pour les dossiers multi-cantonaux, avec Meta/Twitter/TikTok pour réquisitions LSCPT-EIMP, et avec GRA/FSCI pour les plaintes coordonnées.",
        "fictional": True,
        "tags": ["kapo-zh", "hate-crime", "cybercrime", "art-261bis-cp", "zurich", "hasskriminalitaet"],
        "appearances": []
    },
    "rabbin_zurich_victime": {
        "name": "Rabbin David R.",
        "role": "Rabbin — Communauté israélite de Zurich (ICZ) — Cible d'attaques coordonnées",
        "institution": "Israelitische Cultusgemeinde Zürich (ICZ), Lavaterstrasse 33, 8002 Zürich (~3'000 membres, plus grande communauté CH)",
        "shortBio": "Personnage fictif. Rabbin assistant à l'ICZ depuis 2019. Personnalité publique dans la communauté juive zurichoise (interventions médias, podcast 'Glaube und Vernunft' SRF). Cible récurrente d'attaques antisémites en ligne post-7 octobre 2023 : injures sur X/Twitter, menaces de mort via formulaire de contact synagogue, photomontages haineux sur Telegram canaux d'extrême droite. A déposé 12 plaintes pénales art. 261bis CP + art. 180 CP (menaces) + art. 173 CP (diffamation) sur 2024. Partie plaignante personnelle et représentant ICZ.",
        "fictional": True,
        "tags": ["rabbin", "icz", "zurich", "communaute-juive", "victime-antisemitisme", "art-261bis-cp"],
        "appearances": []
    },
    "meta_legal_eu_liaison": {
        "name": "Mme Sinéad O.",
        "role": "EU Law Enforcement Outreach Manager — Meta Platforms — Bureau Dublin",
        "institution": "Meta Platforms Ireland Limited, 4 Grand Canal Square, Grand Canal Harbour, Dublin 2, Irlande (DSA point de contact EU pour 4 VLOPs Meta)",
        "shortBio": "Personnage fictif. Responsable des relations avec les autorités judiciaires européennes pour les 4 plateformes Meta (Facebook, Instagram, WhatsApp, Threads). Point de contact unique DSA depuis 17.02.2024. Traite ~1'200 demandes/an d'autorités CH sur 200'000+ globales EU. Procédure standard pour la CH : réquisition LSCPT via OFJ pour les contenus, conservation rapide via Conv. Budapest art. 29-30, transmission contenus via EIMP. Délai moyen 4-8 semaines selon urgence ; accélération possible en cas de risque imminent (suicidaire, terrorisme).",
        "fictional": True,
        "tags": ["meta", "facebook", "instagram", "whatsapp", "dublin", "dsa", "liaison-eu"],
        "appearances": []
    },
    "experte_extreme_droite_ch": {
        "name": "Dr. Damir S.",
        "role": "Chercheur senior en extrémismes — Institut für Sozialforschung — ZHAW Winterthur",
        "institution": "Zürcher Hochschule für Angewandte Wissenschaften (ZHAW), Institut für Sozialforschung, Pfingstweidstrasse 96, 8005 Zürich",
        "shortBio": "Personnage fictif. Chercheur senior à la ZHAW (Winterthur), expert reconnu en extrémismes de droite et antisémitisme en CH. Auteur de plusieurs études OFROU et SRC sur les groupuscules d'extrême droite actifs en CH alémanique (PNOS historique, Junge Tat, mouvances accélérationnistes). Expertise demandée régulièrement par MPC, MPZH, fedpol SRC, et magistrats romands. Témoin expert sur les modes opératoires de coordination en ligne (Telegram canaux fermés, Discord, 4chan), identification visuelle des symboles haineux (Schwarze Sonne, 14/88, codes numérologiques nazis, codes 'WP' white power).",
        "fictional": True,
        "tags": ["zhaw", "winterthur", "extreme-droite", "antisemitisme", "src", "expert"],
        "appearances": []
    },
    
    # ─── Scène 15 — Deepfake EMS (LU) ────────────────────────
    "direction_ems_lucerne": {
        "name": "Mme Verena H.",
        "role": "Directrice — Établissement médico-social (EMS) anonymisé à Lucerne",
        "institution": "EMS Sankt-Niklausen (anonymisé), Lucerne — 120 places, mission Pflegeheim financée par LAMal + complément cantonal LU",
        "shortBio": "Personnage fictif. Directrice d'un EMS catholique de 120 places à Lucerne depuis 2017. Formation infirmière + master gestion santé HSLU. Gère 180 collaborateurs (soignants 80%, administratif 12%, services 8%). En contact direct avec 240 familles (résidents + proches). En cas d'incident financier touchant un résident (arnaque téléphonique, abus de confiance), signalement obligatoire à l'autorité de protection adulte APEA / KESB selon art. 443 CC, coordination avec banque du résident, plainte pénale via Pro Senectute Luzern.",
        "fictional": True,
        "tags": ["ems", "lucerne", "direction", "personnes-agees", "kesb", "apea", "art-443-cc"],
        "appearances": []
    },
    "mpc_lucerne_procureur": {
        "name": "Me Andreas G.",
        "role": "Procureur cantonal cyber — Staatsanwaltschaft des Kantons Luzern",
        "institution": "Staatsanwaltschaft des Kantons Luzern, Eichwilstrasse 2, 6011 Kriens (cellule cyber depuis 2021)",
        "shortBio": "Personnage fictif. Procureur cantonal LU, en charge de la cellule cyber créée en 2021. Premier procureur cyber en Suisse centrale germanophone, formé à Glion + École de magistrature romande. Compétence ratione loci : Lucerne et zones limitrophes. Coordination via NEDIK pour les dossiers cyber multi-cantonaux. Volume 2024 : ~340 dossiers cyber (arnaques, ransomware PME, sextorsion, fraude IA). Témoin de la montée des deepfake vocaux 2024-2025 (~15 dossiers documentés LU).",
        "fictional": True,
        "tags": ["procureur-cyber", "lucerne", "kriens", "cybercriminalite", "deepfake", "nedik"],
        "appearances": []
    },
    "fils_victime_deepfake": {
        "name": "M. Stefan H.",
        "role": "Fils de la victime — sa voix a été clonée par les fraudeurs (victime indirecte)",
        "institution": "Cadre Pilatus Aircraft Stans (NW) — résident Lucerne, 42 ans",
        "shortBio": "Personnage fictif. Fils de 42 ans, cadre chez Pilatus Aircraft (Stans, NW) — vit à Lucerne, marié, 2 enfants. Sa voix a été utilisée à son insu par les fraudeurs pour cloner un message vocal demandant CHF 18'000 d'urgence à sa mère en EMS. La voix a été échantillonnée à partir d'une interview radio sur SRF1 (printemps 2024, 8 minutes audio publiquement disponible). Victime indirecte : atteinte à la personnalité art. 28 CC, possibilité plainte civile contre les fraudeurs et action en cessation contre tout réutilisateur. Partie plaignante constituée art. 118 CPP.",
        "fictional": True,
        "tags": ["fils", "pilatus-aircraft", "victime-indirecte", "voix-clonee", "art-28-cc", "lucerne"],
        "appearances": []
    },
    "grand_mere_victime_ems": {
        "name": "Mme Maria H. (84 ans)",
        "role": "Résidente EMS Lucerne — victime de l'arnaque deepfake vocal",
        "institution": "EMS Sankt-Niklausen Lucerne (anonymisé) — résidente depuis 2022, mère de Stefan H. (Pilatus Aircraft)",
        "shortBio": "Personnage fictif. Femme de 84 ans, ancienne couturière, veuve depuis 2019. Résidente EMS Lucerne depuis 2022 (mobilité réduite). Cognitivement préservée (MMSE 27/30) mais émotionnellement vulnérable face à une voix familière en détresse. Victime d'arnaque deepfake vocal en mars 2025 : appel de la 'voix de son fils' demandant CHF 18'000 d'urgence (faux accident, garde à vue). A transféré CHF 12'000 (le maximum sur son compte épargne LUKB) avant que la direction de l'EMS n'intervienne. Préjudice partiellement récupéré (CHF 4'500 bloqués chez la mule destinataire).",
        "fictional": True,
        "tags": ["victime-ems", "84-ans", "lucerne", "deepfake-vocal", "grand-mere"],
        "appearances": []
    },
    "truthscan_voix_expert": {
        "name": "Dr. ing. Marco P.",
        "role": "Expert en détection de voix synthétiques — Compass Security AG Zurich",
        "institution": "Compass Security AG, Werdstrasse 2, 8004 Zürich (équipe forensique deepfake constituée 2023)",
        "shortBio": "Personnage fictif. Ingénieur Dr ETHZ en traitement du signal, spécialisé en détection de deepfake audio depuis 2022. Compass Security a investi 2023-2024 dans une équipe dédiée (4 ingénieurs) après l'augmentation des cas en Suisse. Méthodologie : analyse spectrale acoustique, détection d'artefacts ElevenLabs / Murf / Play.HT / Resemble.ai, identification de patterns prosodiques anormaux. Mandat formel art. 184 CPP par procureurs cantonaux. Précision détection 2025 : ~94% sur enregistrements > 8 secondes, ~78% sur < 4 secondes.",
        "fictional": True,
        "tags": ["compass-security", "deepfake-audio", "detection", "ethz", "art-184-cpp", "voix-synthetique"],
        "appearances": []
    },
    "apetra_lucerne_referent": {
        "name": "M. Hans-Peter F.",
        "role": "Référent cyber-sécurité personnes âgées — Pro Senectute Luzern",
        "institution": "Pro Senectute Kanton Luzern, Bundesplatz 14, 6003 Luzern (fondation faîtière des personnes âgées en CH, présente dans tous les cantons)",
        "shortBio": "Personnage fictif. Référent cyber-sécurité à Pro Senectute Luzern, ancien expert IT bancaire reconverti dans le tiers secteur en 2020. Pro Senectute conduit le programme 'Sicher im Internet — Sécurité numérique pour seniors' (60'000 bénéficiaires/an au niveau CH). Coordonne avec OFCS sur les campagnes de sensibilisation. Auteur d'une étude 2024 'Deepfake-Vishing chez les seniors suisses' (n=420, dont 35 cas concrets documentés LU). Témoin régulier dans les procédures pénales pour escroquerie par deepfake vocal.",
        "fictional": True,
        "tags": ["pro-senectute", "lucerne", "personnes-agees", "cyber-securite", "deepfake", "seniors"],
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
