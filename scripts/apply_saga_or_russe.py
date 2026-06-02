#!/usr/bin/env python3
"""
apply_saga_or_russe.py — CAS-IN Saga « La filière dorée »

CONTEXTE
────────
Saga 7 actes ancrée dans le journalisme-OSINT financier-maritime étendu métaux
précieux. POV : M. Yann Chappuis, 42 ans, journaliste investigation économie
internationale Le Temps (continuité saga Shadow Fleet — première continuité de
protagoniste au catalogue CAS-IN). Post-Shadow Fleet : European Press Prize
Investigative Reporting 2027, Reuters Global Award 2027, refus offre senior FT
London Commodities (180K GBP). Extension méthodologique : Lloyd's Maritime
Academy 2025 (Shadow Fleet) → LBMA London workshop 2027 (Or russe) +
isotopique Northwestern partenariat 2028.

Trame : Genève 6 septembre 2027 09h15. Anastasia Stanko (Skhemy RFE/RL Kyiv,
partenaire saga Shadow Fleet acte 4 grain extorqué) sollicite Yann Chappuis.
Leak 14'000 documents Al Etihad Compliance Advisors Dubai (cabinet expertise
comptable, prestataire 8 intégrateurs UAE clients incluant Al Etihad Gold +
Emirates Gold + Sharaf Exchange + Kaloti sanctionné OFAC déc 2024 + 4 autres).
Transmis par M. Aymen Belkacem (Bellingcat Africa Team Tunis, ex-Le Monde
Afrique). 4 raffineries CH apparaissent comme acheteurs ultimes : Pamp SA
(Castel San Pietro TI, groupe MKS PAMP), Argor-Heraeus (Mendrisio TI, groupe
Heraeus Holding DE), Valcambi (Balerna TI, groupe Rajesh Exports IN), Metalor
(Marin-Epagnier NE, groupe Tanaka Holdings JP). Enquête 8 mois (septembre 2027
- mai 2028) avec consortium 9 partenaires : Le Temps + Tamedia SonntagsZeitung
+ FT London + Süddeutsche Zeitung + Skhemy + Bellingcat Africa Team + Public
Eye + OCCRP UAE bureau + Follow the Money NL + Northwestern University.
Méthodologie quadruple intégrée : Sentinel-2 mines amont (Wagner Mali + RSF
Sudan + Polyus/Polymetal/Krastsvetmet Russie) + forensique isotopique
Northwestern Pr. Mary Hossain (Nature Communications mars 2024, méthodologie
isotopes Pb/Os précision 85-95%) + audit comptable LBMA Good Delivery (14'000
documents leak Al Etihad Compliance) + corporate UAE/HK/Russie (OCCRP Aleph +
Sayari + Pandora Papers + Cyprus Confidential). Approche hybride
judiciaire/réglementaire complet : FINMA enforcement (2 raffineries ~28M CHF) +
BCMP réformes contrôles + LBMA Responsible Gold Guidance v10 (2029) +
suspension 3 intégrateurs UAE Good Delivery list + SECO sanctions (12M CHF) +
MPC procédure pénale formelle + Conseil national motion 28.XXX (Sven Bachmann
PS) Lcm extension métaux précieux (continuation Shadow Fleet 2027) adoptée
1ère lecture CN 118-72. Confrontation 16-18 entités : 4 raffineries CH + 8
intégrateurs UAE + 3 producteurs russes + LBMA London + 4 autorités CH.

INNOVATION
──────────
1. Première continuité de protagoniste au catalogue CAS-IN
   (Yann Chappuis : Shadow Fleet 2027 → Or russe 2028)
2. Première application forensique isotopique métaux précieux journalisme CH
   (méthodologie Northwestern Pr. Hossain Pb/Os précision 85-95%)
3. Premier sujet Tessin au catalogue (3 raffineries TI + 1 NE)
4. Méthodologie quadruple intégrée (satellitaire + isotopique + LBMA + corporate)
5. Consortium 9 partenaires (extension Shadow Fleet 5 → 9)
6. Article scientifique conjoint Forensic Science International + ACM SIGCAS
   Outstanding Paper 2029
7. Hybride judiciaire/réglementaire complet (FINMA + BCMP + LBMA + SECO + MPC
   + Lcm parlementaire)
8. 4 profils journaliste-OSINT/DFIR CH consolidés acte 7 (Béguin + Pellaton +
   Chappuis + Rochat) = palette unique en Europe

ARC NARRATIF
────────────
1. Un leak depuis Dubai                  — Sept 2027, Stanko + Belkacem + Hossain
2. Wagner Mali à Krasnoyarsk             — Oct-déc 2027, Sentinel-2 mines amont
3. Empreinte isotopique                  — Jan 2028, Northwestern 30 lingots LBMA
4. Good Delivery, mauvaise origine       — Fév-mars 2028, LBMA audit + leak DMCC
5. Le coffre-fort des holdings           — Avril-mai 2028, corporate UAE/HK/Russie
6. Confronter et publier                 — Avril-mai 2028, 16-18 entités
7. Doctrine journalisme-OSINT précieux   — Mai 2029, bilan 1 an + 4 profils CH

ACTIONS DU SCRIPT
─────────────────
1. Copie les 7 scènes JSON dans scenes/
2. Injecte l'entry saga dans data/campaigns.json (dédup par id)
3. Bump SW v167 → v168 (cumulatif)
4. Régénère search-index, counts, README

IDEMPOTENT — Skip si scènes déjà présentes, skip si entry déjà dans campaigns,
skip si SW déjà bumpé pour cette saga.
"""
import os
import re
import sys
import json
import shutil
import subprocess
from pathlib import Path


def find_root():
    here = Path(__file__).resolve().parent
    for c in (here, here.parent):
        if (c / 'sw.js').exists() and (c / 'quiz.html').exists():
            return c
    print('[error] Racine CAS-IN introuvable.', file=sys.stderr)
    sys.exit(1)


def log(s, m):
    print(f'  {s} {m}')


SAGA_ID = 'saga-or-russe-tessin-ch'
SAGA_ENTRY = {
    "id": SAGA_ID,
    "icon": "🥇",
    "title": "La filière dorée — Une enquête Le Temps",
    "subtitle": "Saga 7 actes · POV journaliste-OSINT financier-maritime étendu précieux Le Temps · Or russe Tessin + 4 raffineries CH + isotopique Northwestern + LBMA + consortium 9 partenaires",
    "description": (
        "Saga OSINT ancrée dans le journalisme-OSINT financier-maritime étendu métaux "
        "précieux (extension Shadow Fleet — première continuité de protagoniste au catalogue "
        "CAS-IN). Inspirée investigations Public Eye Argor-Heraeus 2017 (or pillé RDC), "
        "Bellingcat Wagner Mali 2023-2024, Reuters Russian gold 2024, Global Witness or RDC + "
        "Sudan, méthodologie isotopique Northwestern University Nature Communications mars 2024 "
        "(Pr. Mary Hossain — isotopes Pb/Os identification origine géologique 85-95%), DOJ "
        "enforcement Kaloti Dubai décembre 2024, Pandora Papers + Cyprus Confidential + Suisse "
        "Secrets. Genève 6 septembre 2027 09h15 : Mme Anastasia Stanko (Skhemy RFE/RL Kyiv, "
        "partenaire saga Shadow Fleet acte 4) sollicite M. Yann Chappuis (Le Temps, continuité "
        "Shadow Fleet, post-publication 7 avril 2027). Leak 14'000 documents Al Etihad "
        "Compliance Advisors Dubai (cabinet expertise comptable, prestataire 8 intégrateurs UAE "
        "clients : Al Etihad Gold + Emirates Gold + Sharaf Exchange + Kaloti sanctionné OFAC "
        "déc 2024 + 4 autres). Transmis par M. Aymen Belkacem (Bellingcat Africa Team Tunis, "
        "ex-Le Monde Afrique). 4 raffineries CH apparaissent acheteurs ultimes : Pamp SA "
        "(Castel San Pietro TI, groupe MKS PAMP Genève, UBO Andurand-Pichard family), "
        "Argor-Heraeus (Mendrisio TI, groupe Heraeus Holding Allemagne Hanau, UBO Heraeus "
        "family), Valcambi (Balerna TI, groupe Rajesh Exports India, UBO Mehta family acquis "
        "2015), Metalor (Marin-Epagnier NE, groupe Tanaka Holdings Japon, acquis 2016). POV : "
        "M. Yann Chappuis, 42 ans, journaliste investigation économie internationale Le Temps, "
        "Master HEI Genève + 12 ans investigation économique, Lloyd's Maritime Academy 2025 "
        "(Shadow Fleet) + LBMA London workshop 2027 (Or russe) + isotopique Northwestern "
        "partenariat 2028, European Press Prize Investigative Reporting 2027 (Shadow Fleet), "
        "Reuters Global Award 2027, refus offre senior FT London Commodities 180K GBP. "
        "Première continuité de protagoniste au catalogue (Shadow Fleet 2027 → Or russe 2028). "
        "Enquête 8 mois (septembre 2027 - mai 2028) avec consortium 9 partenaires (extension "
        "Shadow Fleet 5 → 9) : Le Temps lead francophone + Tamedia SonntagsZeitung lead "
        "alémanique (Catherine Boss continuité Shadow Fleet, NDA distinct projet Or) + Financial "
        "Times London (Tom Bergin) + Süddeutsche Zeitung (continuité Shadow Fleet) + Skhemy "
        "Radio Free Europe Kyiv (Anastasia Stanko investigation Russie) + Bellingcat Africa "
        "Team Tunis (Aymen Belkacem investigation Mali Wagner + Sudan RSF + leak Al Etihad "
        "Compliance) + Public Eye Lausanne (Robert Bachmann commodity expert continuité Shadow "
        "Fleet + précédent Argor-Heraeus 2017) + OCCRP UAE bureau Dubai (Tarek Aboudi corporate "
        "UAE + accès registres DMCC) + Bellingcat Russia/Eurasia Vilnius (Olha Kalashnyk "
        "continuité Shadow Fleet acte 4) + Follow the Money NL + Northwestern University "
        "(Pr. Mary Hossain + Dr. Ahmed Khoury + Dr. Sarah Chen + Mme Olivia Reeves). "
        "Méthodologie quadruple intégrée innovation : (1) Sentinel-2 mines amont (Berkeley "
        "Protocol adapté extractivisme + GLAN/Bellingcat 2022) — 18 sites HIGH cartographiés "
        "(10 Mali Wagner Intahaka/Diamou/Komi-Yala/etc. + 4 Sudan RSF Jebel Amer/Songo + 4 "
        "Russie Polyus Olimpiada/Sukhoi Log + Polymetal Magadan + Krastsvetmet Krasnoyarsk "
        "raffinage), production estimée 200+ tonnes/an non transparente, coordination Sahel "
        "Foundation Bamako (Aminata Diallo doctrine victim-first témoins distants continuité "
        "Yémen) + Sudan Doctors Union réseau distance, pas de visite terrain Yann/Belkacem "
        "(zones Wagner/Africa Corps adversaires journalistes); (2) Forensique isotopique "
        "Northwestern (innovation première CH journalisme) — 30 lingots LBMA Good Delivery 1 kg "
        "fine 99.99% acquis bullion dealers Genève autorisés (MKS PAMP + UBS Gold Heritage + "
        "Credit Suisse Gold Heritage + Argor-Heraeus reseller) budget ~750K CHF investissement, "
        "transport Brink's air-gap Genève → Evanston Illinois, Yann mission 5 jours on site "
        "(chain of custody scientifique ISO 17025 + journalistique), méthodologie ICP-MS "
        "(Inductively Coupled Plasma Mass Spectrometry) isotopes Pb (plomb : ratios 206/204, "
        "207/204, 208/204) + Os (osmium : 187/188) + métaux platine groupe (Pt, Pd, Ir, Ru, Rh) "
        "traces, base données géologique Northwestern 8'400 échantillons référence (Polyus "
        "Krasnoyarsk 206Pb/204Pb 18.2-18.6 + Polymetal Magadan 18.6-19.0 + Krastsvetmet mélange "
        "+ Shandong Chine 17.8-18.2 + Witwatersrand 13.5-14.5 + Yanacocha + autres), résultats "
        "14 lingots HIGH probabilité russe Polyus/Polymetal sur 22 déclarés UAE/mixed (64% "
        "pattern) + 5 MEDIUM signatures composées + 3 LOW autres origines + 6 contrôles HIGH "
        "baseline validée; (3) Audit comptable LBMA Good Delivery (14'000 documents leak Al "
        "Etihad Compliance Advisors Dubai 2022-2027 indexation OCCRP Aleph adaptée Le Temps "
        "Tails OS), workshop LBMA Annual Conference London février 2028 Yann 3 jours "
        "compartimentation enquête en cours, audit conformité LBMA Responsible Gold Guidance "
        "v9 (2023) 5 étapes due diligence OECD-aligned, pattern systémique 11/14 lingots HIGH "
        "russe correspondent factures intégrateurs UAE → raffineries CH avec attestations "
        "'origine UAE recycled' ou 'mixed sources recycled' (79% pattern contournement KYC "
        "LBMA); (4) Corporate UAE/HK/Russie + 4 raffineries CH (OCCRP Aleph + Sayari Graph + "
        "OpenCorporates + Pandora Papers 2021 + Cyprus Confidential 2023 + Suisse Secrets 2022 "
        "+ Russian Wires 2024) — 8 intégrateurs UAE UBO documentés via DMCC registre + Aleph + "
        "Sayari + leak structurels, transfert Polyus septembre 2022 Said Kerimov (sanctionné UE "
        "mars 2022) → Akhmet Suleymanov caractéristiques fréquemment associées contournement "
        "sanctions selon Bellingcat Russia/Eurasia (formulation prudente Suleymanov non "
        "sanctionné UE = présomption innocence), Polymetal International UK split juillet 2023 "
        "+ restructuration AIX Astana Kazakhstan + ventes opérations russes Mangazeya Mining "
        "septembre 2023 (~3.7 milliards USD structure opaque), Krastsvetmet entité étatique "
        "russe 100% Krasnoyarsk ~140 tonnes/an raffinage (60% production russe), Hong Kong "
        "5-8 structures intermédiaires identifiées via leak Al Etihad Compliance + Companies "
        "Registry HK + Significant Controllers Register 2018 (NSL 2020+2024 amendments limites "
        "enquête approfondie), 4 raffineries CH groupes mère internationaux factuels (pas "
        "qualification UBO familles privées). Doctrine victim-first adaptée extractivisme : "
        "protection lanceur Dubai (Me Laurence Burgener avocate indépendante lanceurs réactivée "
        "Shadow Fleet mandate via Aymen Belkacem canal Bellingcat Africa, anonymisation absolue "
        "publication, plan extraction Tunisie août 2028 réussi, sécurité préservée 1 an+ "
        "post-publication), témoins distants Mali Wagner (Sahel Foundation Bamako Aminata "
        "Diallo coordination Signal vidéo chiffré, pas coordonnées GPS précises publication, "
        "consentement éclairé + délai réflexion + accompagnement post-publication 6+ mois), "
        "témoins distants Sudan RSF (Sudan Doctors Union réseau distance, journalistes diaspora "
        "Le Caire/Nairobi, doctrine victim-first conflit actif). Approche hybride "
        "judiciaire/réglementaire complet : FINMA enforcement art. 27 LFINMA 4 raffineries CH "
        "(2 procédures formelles ouvertes Pamp SA + Valcambi octobre 2028 décisions "
        "interlocutoires confidentielles + Argor-Heraeus + Metalor procédures préliminaires en "
        "cours, amendes ~28M CHF total prévues 2029, art. 27 LFINMA + LBA art. 9 + OBA-FINMA "
        "art. 11-15) + BCMP Berne (Bureau central contrôle métaux précieux) réformes "
        "procédures contrôle origine + traçabilité annoncées avril 2029 (renforcement OCMP, "
        "audits annuels obligatoires raffineries Good Delivery LBMA listées CH, registre "
        "origine national en consultation) + LBMA London Responsible Gold Guidance v10 (2029) "
        "annoncée fév 2029 renforcement substantiel due diligence + suspension préventive 3 "
        "intégrateurs UAE Good Delivery list (Al Etihad Gold + Emirates Gold + 1 autre) pending "
        "audit indépendant + SECO enforcement sanctions Russia or octobre 2028 ~12M CHF "
        "amendes intégrateurs UAE-CH + refus licenses commerciales 2 intégrateurs + MPC "
        "ouverture instruction formelle juin 2028 art. 271 CP + LEmb art. 9 + LBA art. 9 visant "
        "4 raffineries CH + 8 intégrateurs UAE (procédure en cours, dépôt actes accusation "
        "possible 2030-2031) + Conseil national motion 28.XXX Sven Bachmann PS (continuité "
        "Shadow Fleet motion 27.XXX) projet Loi commerce matières premières (Lcm) extension "
        "métaux précieux adoptée 2ème lecture CE juin 2028 + 1ère lecture CN décembre 2028 "
        "(118-72) entrée vigueur 2030 supervisor sectoriel matières premières + précieuses + "
        "motion Sibel Arslan Vert·e·s moratoire importations or zones conflit + UAE "
        "intégrateurs débats CPS-N. Confrontation élargie 16-18 entités : 4 raffineries CH "
        "(Pamp SA Castel San Pietro TI + Argor-Heraeus Mendrisio TI + Valcambi Balerna TI + "
        "Metalor Marin-Epagnier NE) + 8 intégrateurs UAE (Al Etihad Gold + Emirates Gold + "
        "Sharaf Exchange + Kaloti remplacé OFAC déc 2024 + 4 autres) + 3 producteurs russes "
        "(Polyus + Polymetal International + Krastsvetmet) + LBMA London + 4 autorités CH "
        "(BCMP Berne + SECO + FINMA + MPC). Coordination DFAE+DFJP : Pascal Wormser (DFAE "
        "Division Sécurité humaine, continuité 4 sagas Pegasus + Yémen + Shadow Fleet + police "
        "prédictive) + Léa Wertheimer (DFAE Division économique extérieure, continuité Shadow "
        "Fleet) + Frédéric Müller (DFJP Office fédéral justice, continuité police prédictive) "
        "— refus rapport en avance, refus report ferme face Conseil d'État TI demande report + "
        "sommet économique UAE 22 mai 2028. Envoi simultané 16-18 lettres droit de réponse "
        "formats adaptés multilingues 5 langues (italien Tessin Pamp+Argor+Valcambi + français "
        "Metalor NE + anglais UAE+LBMA+FT context + russe+anglais Polyus/Polymetal/Krastsvetmet "
        "+ allemand+français BCMP/SECO/FINMA/MPC). Publication coordonnée 7 mai 2028 06h00 UTC "
        "consortium 9 partenaires (1 mois symbolique post-publication Shadow Fleet 7 avril "
        "2027). Mises en demeure 4 raffineries CH simultanées J+7 cabinets juridiques top-tier "
        "(Lenz & Staehelin Pamp/MKS PAMP + Bär & Karrer Argor/Heraeus + Schellenberg Wittmer "
        "Valcambi/Rajesh + Niederer Kraft Frey Metalor/Tanaka) demande retrait + 12M CHF "
        "dommages-intérêts total = réponse coordonnée Dougoud + Lenz & Staehelin (cabinet "
        "conseil Le Temps) refus retrait + droit réponse offert intégré ATF 138 III 641 mise "
        "en balance presse/personnalité. Suites institutionnelles exceptionnelles 1 an post : "
        "FINMA enforcement ~28M CHF amendes raffineries CH + BCMP réformes contrôles + LBMA "
        "RGG v10 + suspension 3 intégrateurs UAE + SECO 12M CHF + MPC procédure pénale + Lcm "
        "extension précieuses CN adoptée 118-72 + UE Conflict Minerals Regulation 2017/821 "
        "extension or russe + Mali/Sudan révision 2029 + procédures civiles raffineries CH "
        "Tribunaux cantonaux Tessin (Bellinzona) + Neuchâtel attendues 2030 défense Lenz & "
        "Staehelin confiante ATF 138 III 641. Reconnaissance : European Press Prize "
        "Investigative Reporting 2028 (2ème année consécutive Yann lauréat consortium 9 "
        "partenaires post-Shadow Fleet 2027), Prix Suisse du Journalisme 2029, IPI World Press "
        "Freedom Hero Award 2028, Reuters Global Award 2028, ACM SIGCAS Outstanding Paper 2029 "
        "article scientifique conjoint Chappuis + Hossain + Khoury + Bachmann Forensic Science "
        "International mars 2029 + version étendue ACM SIGCAS Computers and Society mai 2029 "
        "(84 pages, référence académique mondiale forensique isotopique journalisme civic). "
        "Refus opportunités carrière (continuité 4 sagas refus) : LBMA London 'Head of "
        "Compliance Investigations Europe' (200K GBP, capture sectorielle absolue) + "
        "Northwestern University visiting professor (100K USD, 4 mois) + livre commercial "
        "Slatkine (75K CHF avance, protection lanceurs durée + risque identification "
        "recoupements) + consultance Conseil fédéral DEFR commerce matières premières (40K "
        "CHF, sortie rôle journaliste DEFR partie débat Lcm) + conférences industrie LBMA "
        "Singapore + Dubai (10-15K CHF chacune, conflit apparent). Masterclass MAZ Lucerne "
        "juin 2029 COMMUNE 4 profils journaliste-OSINT/DFIR CH consolidés (2ème année "
        "consécutive depuis inauguration juin 2028 saga police prédictive) : Béguin DFIR "
        "mobile (saga Pegasus 2026) + Pellaton OSINT crimes guerre (saga Yémen 2027) + "
        "Chappuis OSINT financier-maritime étendu précieux (sagas Shadow Fleet 2027 + Or russe "
        "2028, première continuité protagoniste) + Rochat DFIR civic tech (saga Police "
        "prédictive 2027) = palette CH unique en Europe. 48 journalistes investigation RTS + "
        "SRF + Le Temps + Tamedia + NZZ + Beobachter + WOZ + K-Tipp + 16 internationaux "
        "(MEDUZA + iStories + Skhemy + Bellingcat + Public Eye + OCCRP). Innovation : 1ère "
        "continuité protagoniste catalogue CAS-IN, 1ère application forensique isotopique "
        "métaux précieux journalisme CH (méthodologie Northwestern), 1er sujet Tessin "
        "catalogue (3 raffineries TI + 1 NE), 1ère application LBMA Good Delivery audit "
        "comptable journalisme CH, méthodologie quadruple intégrée (satellitaire + isotopique "
        "+ LBMA + corporate), consortium 9 partenaires (extension Shadow Fleet 5 → 9), "
        "hybride judiciaire/réglementaire complet (FINMA + BCMP + LBMA + SECO + MPC + Lcm "
        "parlementaire = 1ère fois écosystème complet mobilisé via enquête journalistique CH "
        "or russe), doctrine victim-first adaptée extractivisme (lanceur Dubai + témoins "
        "distants Mali/Sudan), 4 profils journaliste-OSINT/DFIR CH consolidés (Béguin + "
        "Pellaton + Chappuis + Rochat). Continuité narrative dense (5 sagas successives : "
        "Pegasus + Yémen + Shadow Fleet + police prédictive + Or russe) : Le Temps cellule "
        "(Petignat + Dougoud + Henz + Pierrumbert) + Burgener avocate lanceurs + Bachmann "
        "Public Eye + Stanko Skhemy + Kalashnyk Bellingcat Russia + Bergin FTM/FT + Boss "
        "Tamedia + Pascal Wormser DFAE + Léa Wertheimer DFAE + Frédéric Müller DFJP + Sven "
        "Bachmann PS (Lcm continuation) + 4 profils journaliste-OSINT/DFIR CH consolidés acte 7."
    ),
    "level": "expert",
    "narrative": True,
    "scenes": [
        "ch-affaire-or-russe-1-leak-uae",
        "ch-affaire-or-russe-2-sentinel2-mines",
        "ch-affaire-or-russe-3-isotopique-northwestern",
        "ch-affaire-or-russe-4-lbma-audit",
        "ch-affaire-or-russe-5-corporate-uae-hk-ubo",
        "ch-affaire-or-russe-6-confrontation-publication",
        "ch-affaire-or-russe-7-bilan-doctrine"
    ],
    "hook": "Sept actes. 14'000 documents depuis Dubai. Quatre raffineries suisses. Trente lingots, isotopes Pb/Os. Neuf partenaires, cinq langues. Première continuité de protagoniste. Première application forensique isotopique métaux précieux journalisme CH.",
    "kind": "saga"
}


def step_1_copy_scenes(root):
    print('\n[1/5] Copie des 7 scènes or russe dans scenes/')
    src_dir = Path(__file__).parent.parent / 'scenes'
    if not src_dir.exists():
        src_dir = Path(__file__).parent / 'scenes'
    if not src_dir.exists():
        log('❌', 'Dossier scenes/ source introuvable dans bundle')
        sys.exit(1)

    dst_dir = root / 'scenes'
    dst_dir.mkdir(exist_ok=True)

    copied = skipped = 0
    for f in sorted(src_dir.glob('ch-affaire-or-russe-*.json')):
        target = dst_dir / f.name
        if target.exists():
            existing = json.load(open(target))
            new = json.load(open(f))
            if existing.get('id') == new.get('id') and existing.get('title') == new.get('title'):
                skipped += 1
                continue
        shutil.copy2(f, target)
        copied += 1

    if copied:
        log('✅', f'{copied} scènes copiées ({skipped} déjà présentes)')
    else:
        log('⏭ ', f'Toutes les {skipped} scènes déjà présentes')


def step_2_inject_campaign(root):
    print('\n[2/5] Injection entry saga dans data/campaigns.json')
    cjs = root / 'data' / 'campaigns.json'
    if not cjs.exists():
        log('❌', 'data/campaigns.json introuvable')
        sys.exit(1)

    data = json.load(open(cjs))
    camps = data if isinstance(data, list) else data.get('campaigns', data)

    existing_ids = {c.get('id') for c in camps}
    if SAGA_ID in existing_ids:
        log('⏭ ', f'Saga {SAGA_ID} déjà présente dans campaigns.json')
        return

    max_order = max((c.get('order', 0) for c in camps), default=0)
    entry = dict(SAGA_ENTRY)
    entry['order'] = max_order + 1

    camps.append(entry)

    if isinstance(data, dict):
        data['campaigns'] = camps

    with open(cjs, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')
    log('✅', f'Saga ajoutée avec order={entry["order"]}, total campagnes: {len(camps)}')


def step_3_bump_sw(root):
    print('\n[3/5] Bump SW → v+1')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if 'saga-or-russe-tessin-ch' in sw or '// Saga Or russe' in sw:
        log('⏭ ', f'SW déjà bumpé pour la saga Or russe (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v167 — 2026-06-02 — Bump SW v{current} → v{new_v}\n"
        f"// Saga Or russe « La filière dorée » — 7 actes · 35 étapes · 105 choix\n"
        f"// saga-or-russe-tessin-ch — POV journaliste-OSINT financier-maritime étendu précieux\n"
        f"// Yann Chappuis (Le Temps investigation économie internationale)\n"
        f"// PREMIÈRE CONTINUITÉ DE PROTAGONISTE AU CATALOGUE CAS-IN\n"
        f"//   (Shadow Fleet 2027 → Or russe 2028)\n"
        f"// Innovation : 1ère application forensique isotopique métaux précieux journalisme CH\n"
        f"//   (méthodologie Northwestern University Pr. Mary Hossain isotopes Pb/Os précision\n"
        f"//   85-95%, Nature Communications mars 2024)\n"
        f"// 1er sujet Tessin au catalogue (3 raffineries TI + 1 NE)\n"
        f"// 1ère application LBMA Good Delivery audit comptable journalisme CH\n"
        f"// Méthodologie quadruple intégrée :\n"
        f"//   1. Sentinel-2 mines amont (Berkeley Protocol adapté extractivisme)\n"
        f"//   2. Forensique isotopique Northwestern (ICP-MS Pb/Os précision 85-95%)\n"
        f"//   3. Audit comptable LBMA Good Delivery (14'000 docs leak Al Etihad Compliance)\n"
        f"//   4. Corporate UAE/HK/Russie (OCCRP Aleph + Sayari + Pandora + Cyprus + Suisse)\n"
        f"// Trame : Genève 6 septembre 2027 — Stanko (Skhemy continuité Shadow Fleet acte 4)\n"
        f"// sollicite Yann via Belkacem (Bellingcat Africa Tunis nouveau). Leak 14'000 docs\n"
        f"// Al Etihad Compliance Advisors Dubai (cabinet expertise comptable, 8 intégrateurs UAE\n"
        f"// clients incluant Al Etihad Gold + Emirates Gold + Sharaf Exchange + Kaloti OFAC 2024)\n"
        f"// 4 raffineries CH acheteurs ultimes documentés :\n"
        f"//   - Pamp SA Castel San Pietro TI (groupe MKS PAMP Genève, UBO Andurand-Pichard)\n"
        f"//   - Argor-Heraeus Mendrisio TI (groupe Heraeus Holding DE Hanau, UBO Heraeus)\n"
        f"//   - Valcambi Balerna TI (groupe Rajesh Exports IN, UBO Mehta acquis 2015)\n"
        f"//   - Metalor Marin-Epagnier NE (groupe Tanaka Holdings JP, acquis 2016)\n"
        f"// POV Yann Chappuis (42 ans, Le Temps) — continuité Shadow Fleet 2027 (European Press\n"
        f"//   Prize lauréat consortium + Reuters Global Award + refus FT London 180K GBP).\n"
        f"//   Extension méthodologique : Lloyd's Maritime Academy 2025 (Shadow Fleet) → LBMA\n"
        f"//   London workshop 2027 (Or russe) + isotopique Northwestern partenariat 2028.\n"
        f"// Enquête 8 mois (sept 2027 - mai 2028) consortium 9 partenaires (extension Shadow\n"
        f"// Fleet 5 → 9) :\n"
        f"//   - Le Temps lead francophone (Yann Chappuis)\n"
        f"//   - Tamedia SonntagsZeitung lead alémanique (Catherine Boss continuité Shadow Fleet,\n"
        f"//     NDA distinct projet Or)\n"
        f"//   - Financial Times London (Tom Bergin ex-FTM)\n"
        f"//   - Süddeutsche Zeitung (continuité Shadow Fleet)\n"
        f"//   - Skhemy RFE/RL Kyiv (Anastasia Stanko, investigation Russie producteurs)\n"
        f"//   - Bellingcat Africa Team Tunis (Aymen Belkacem, leak Al Etihad + Mali Wagner + RSF)\n"
        f"//   - Public Eye Lausanne (Robert Bachmann, commodity expert, précédent Argor 2017)\n"
        f"//   - OCCRP UAE bureau Dubai (Tarek Aboudi, corporate UAE + DMCC + Aleph)\n"
        f"//   - Bellingcat Russia/Eurasia Vilnius (Olha Kalashnyk, continuité Shadow Fleet acte 4)\n"
        f"//   - Follow the Money NL\n"
        f"//   - Northwestern University (Pr. Mary Hossain + Dr. Khoury + Dr. Chen + Reeves)\n"
        f"// Résultats forensique isotopique Northwestern (30 lingots LBMA, méthodologie Pb/Os) :\n"
        f"//   - 14 lingots HIGH probabilité russe Polyus/Polymetal sur 22 déclarés UAE/mixed (64%)\n"
        f"//   - 5 lingots MEDIUM signatures composées (mélanges 30-70%)\n"
        f"//   - 3 lingots LOW autres origines identifiables\n"
        f"//   - 6 lingots contrôles HIGH baseline méthodologie validée\n"
        f"//   - Précision 85-95% reconnue limites publication (dégradation refusions multiples,\n"
        f"//     base données géologique limitations)\n"
        f"// Cross-référence leak Al Etihad Compliance (14'000 docs OCCRP Aleph) :\n"
        f"//   - 11/14 lingots HIGH russe correspondent factures intégrateurs UAE → raffineries CH\n"
        f"//   - Attestations 'origine UAE recycled' ou 'mixed sources recycled' = 79% pattern\n"
        f"//     contournement KYC LBMA Good Delivery + Responsible Gold Guidance v9 (2023)\n"
        f"// Corporate UAE/HK/Russie cartographié :\n"
        f"//   - 8 intégrateurs UAE UBO documentés (DMCC + Aleph + Sayari + leak structurels)\n"
        f"//   - Polyus transfert septembre 2022 Said Kerimov (sanctionné UE) → Suleymanov\n"
        f"//     caractéristiques contournement (formulation prudente, Suleymanov non sanctionné\n"
        f"//     UE = présomption innocence)\n"
        f"//   - Polymetal International UK split juillet 2023 + Mangazeya Mining 3.7Mds USD\n"
        f"//   - Krastsvetmet entité étatique russe 100% Krasnoyarsk\n"
        f"//   - Hong Kong 5-8 structures intermédiaires (NSL 2020+2024 limites enquête)\n"
        f"//   - 4 raffineries CH groupes mère internationaux factuels\n"
        f"// Doctrine victim-first adaptée extractivisme :\n"
        f"//   - Lanceur Dubai (Burgener mandate via Belkacem canal Bellingcat Africa,\n"
        f"//     anonymisation absolue, extraction Tunisie août 2028 réussie, sécurité 1 an+ post)\n"
        f"//   - Témoins distants Mali Wagner (Sahel Foundation Bamako Aminata Diallo)\n"
        f"//   - Témoins distants Sudan RSF (Sudan Doctors Union réseau distance)\n"
        f"// Hybride judiciaire/réglementaire complet (1ère fois écosystème complet mobilisé) :\n"
        f"//   - FINMA enforcement art. 27 LFINMA 4 raffineries CH (~28M CHF amendes 2 raffineries)\n"
        f"//   - BCMP Berne réformes contrôles avril 2029 (registre origine national)\n"
        f"//   - LBMA London Responsible Gold Guidance v10 (2029) + suspension 3 intégrateurs UAE\n"
        f"//   - SECO enforcement sanctions Russia or octobre 2028 (~12M CHF + refus licenses)\n"
        f"//   - MPC procédure pénale formelle art. 271 CP + LEmb art. 9 + LBA art. 9 (4 raffineries\n"
        f"//     + 8 intégrateurs UAE, dépôt actes accusation possible 2030-2031)\n"
        f"//   - Conseil national motion 28.XXX Sven Bachmann PS Lcm extension précieuses\n"
        f"//     (continuation Shadow Fleet motion 27.XXX) adoptée 1ère lecture CN 118-72,\n"
        f"//     entrée vigueur 2030 supervisor sectoriel\n"
        f"//   - Motion Sibel Arslan Vert·e·s moratoire en débat\n"
        f"//   - UE Conflict Minerals Regulation 2017/821 extension révision 2029\n"
        f"// Confrontation élargie 16-18 entités :\n"
        f"//   - 4 raffineries CH (Pamp + Argor + Valcambi + Metalor)\n"
        f"//   - 8 intégrateurs UAE (Al Etihad Gold + Emirates Gold + Sharaf Exchange + 5 autres)\n"
        f"//   - 3 producteurs russes (Polyus + Polymetal International + Krastsvetmet)\n"
        f"//   - LBMA London + 4 autorités CH (BCMP + SECO + FINMA + MPC)\n"
        f"// Coordination DFAE + DFJP (continuité 4 sagas Pegasus + Yémen + Shadow Fleet + police) :\n"
        f"//   - Pascal Wormser (DFAE Division Sécurité humaine, 4 sagas continues)\n"
        f"//   - Léa Wertheimer (DFAE Division économique extérieure, continuité Shadow Fleet)\n"
        f"//   - Frédéric Müller (DFJP Office fédéral justice, continuité police prédictive)\n"
        f"//   - Refus rapport en avance, refus report ferme face sommet UAE 22 mai 2028\n"
        f"// Envoi simultané 16-18 lettres droit réponse formats 5 langues :\n"
        f"//   - Italien (Pamp + Argor + Valcambi Tessin)\n"
        f"//   - Français (Metalor NE)\n"
        f"//   - Anglais (UAE + LBMA + FT)\n"
        f"//   - Russe + anglais (Polyus + Polymetal + Krastsvetmet)\n"
        f"//   - Allemand + français (BCMP + SECO + FINMA + MPC)\n"
        f"// Publication coordonnée 7 mai 2028 06h00 UTC (1 mois symbolique post-Shadow Fleet)\n"
        f"// Mises en demeure J+7 4 raffineries CH simultanées cabinets top-tier :\n"
        f"//   - Lenz & Staehelin (Pamp/MKS PAMP)\n"
        f"//   - Bär & Karrer (Argor/Heraeus)\n"
        f"//   - Schellenberg Wittmer (Valcambi/Rajesh)\n"
        f"//   - Niederer Kraft Frey (Metalor/Tanaka)\n"
        f"//   - Demande retrait + 12M CHF dommages-intérêts total = réponse coordonnée Dougoud\n"
        f"//     + Lenz & Staehelin (cabinet conseil Le Temps) refus retrait + ATF 138 III 641\n"
        f"// Procédures civiles raffineries CH Tribunaux cantonaux Tessin (Bellinzona) + NE\n"
        f"//   attendues 2030 (défense Lenz & Staehelin confiante)\n"
        f"// Suites institutionnelles exceptionnelles 1 an post :\n"
        f"//   - FINMA enforcement (~28M CHF) + BCMP réformes + LBMA RGG v10 + suspension 3\n"
        f"//     intégrateurs UAE + SECO (12M CHF) + MPC pénale + Lcm extension CN (118-72)\n"
        f"//   - 1ère fois écosystème complet mobilisé via enquête journalistique CH or russe\n"
        f"// Reconnaissance :\n"
        f"//   - European Press Prize Investigative Reporting 2028 (2ème année consécutive Yann\n"
        f"//     post-Shadow Fleet 2027, lauréat consortium 9 partenaires)\n"
        f"//   - Prix Suisse du Journalisme 2029, IPI World Press Freedom Hero Award 2028,\n"
        f"//     Reuters Global Award 2028\n"
        f"//   - ACM SIGCAS Outstanding Paper 2029\n"
        f"// Article scientifique conjoint 4 auteurs Chappuis + Hossain + Khoury + Bachmann :\n"
        f"//   - Forensic Science International mars 2029 (84 pages)\n"
        f"//   - ACM SIGCAS Computers and Society mai 2029 (version étendue)\n"
        f"//   - Référence académique mondiale forensique isotopique journalisme civic\n"
        f"// Refus opportunités carrière (continuité 4 sagas refus) :\n"
        f"//   - LBMA London Head of Compliance Investigations Europe (200K GBP, capture\n"
        f"//     sectorielle absolue)\n"
        f"//   - Northwestern University visiting professor (100K USD, 4 mois)\n"
        f"//   - Livre commercial Slatkine (75K CHF avance, protection lanceurs + identification)\n"
        f"//   - Consultance Conseil fédéral DEFR commerce matières premières (40K CHF)\n"
        f"//   - Conférences industrie LBMA Singapore + Dubai (10-15K CHF chacune)\n"
        f"// Masterclass MAZ Lucerne juin 2029 COMMUNE 4 profils journaliste-OSINT/DFIR CH\n"
        f"//   consolidés (2ème année consécutive depuis inauguration juin 2028 police prédictive) :\n"
        f"//   - Béguin DFIR mobile (saga Pegasus 2026)\n"
        f"//   - Pellaton OSINT crimes guerre (saga Yémen 2027)\n"
        f"//   - Chappuis OSINT financier-maritime étendu précieux (sagas Shadow Fleet 2027 + Or\n"
        f"//     russe 2028, PREMIÈRE CONTINUITÉ PROTAGONISTE CATALOGUE)\n"
        f"//   - Rochat DFIR civic tech (saga Police prédictive 2027)\n"
        f"//   = palette CH unique en Europe (48 journalistes RTS + SRF + Le Temps + Tamedia +\n"
        f"//     NZZ + Beobachter + WOZ + K-Tipp + 16 internationaux MEDUZA + iStories + Skhemy\n"
        f"//     + Bellingcat + Public Eye + OCCRP)\n"
        f"// Continuité narrative dense (5 sagas successives) :\n"
        f"//   - Le Temps cellule (Petignat + Dougoud + Henz + Pierrumbert) — saga Shadow Fleet\n"
        f"//   - Burgener avocate lanceurs réactivée (Shadow Fleet)\n"
        f"//   - Bachmann Public Eye repris (Shadow Fleet)\n"
        f"//   - Stanko Skhemy reprise (Shadow Fleet acte 4)\n"
        f"//   - Kalashnyk Bellingcat Russia/Eurasia reprise (Shadow Fleet acte 4)\n"
        f"//   - Bergin FTM/FT repris (Shadow Fleet)\n"
        f"//   - Boss Tamedia reprise (Shadow Fleet, NDA distinct)\n"
        f"//   - Pascal Wormser DFAE repris (Pegasus + Yémen + Shadow Fleet + police prédictive)\n"
        f"//   - Léa Wertheimer DFAE reprise (Shadow Fleet)\n"
        f"//   - Frédéric Müller DFJP repris (police prédictive)\n"
        f"//   - Sven Bachmann PS repris (Shadow Fleet Lcm motion 27.XXX → Or russe 28.XXX)\n"
        f"//   - Sibel Arslan Vert·e·s reprise (Shadow Fleet + police prédictive)\n"
        f"//   - Christian Lüscher PLR + Lorenzo Quadri Lega (Tessin défense, nouveaux saga Or russe)\n"
        f"//   - 4 profils journaliste-OSINT/DFIR CH consolidés acte 7 (palette unique en Europe)\n"
        f"// ═══════════════════════════════════════════════════════════════\n"
        f"\n"
        f"const CACHE_VERSION = 'cas-in-v{new_v}';"
    )
    sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(sw)
    log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')


def step_4_rebuild_meta(root):
    print('\n[4/5] Régénération search-index + counts + README')
    for script in ('build_search_index.py', 'generate_counts.py', 'update_readme_stats.py'):
        sp = root / 'scripts' / script
        if not sp.exists():
            continue
        try:
            r = subprocess.run(['python3', str(sp)], cwd=str(root),
                               capture_output=True, text=True, timeout=60)
            log('✅' if r.returncode == 0 else '⚠️ ', script)
        except Exception as e:
            log('⚠️ ', f'{script}: {e}')


def step_5_validate(root):
    print('\n[5/5] Validation finale')
    scenes_dir = root / 'scenes'
    expected = [
        'ch-affaire-or-russe-1-leak-uae.json',
        'ch-affaire-or-russe-2-sentinel2-mines.json',
        'ch-affaire-or-russe-3-isotopique-northwestern.json',
        'ch-affaire-or-russe-4-lbma-audit.json',
        'ch-affaire-or-russe-5-corporate-uae-hk-ubo.json',
        'ch-affaire-or-russe-6-confrontation-publication.json',
        'ch-affaire-or-russe-7-bilan-doctrine.json',
    ]
    for fn in expected:
        p = scenes_dir / fn
        if p.exists():
            log('✅', f'Scène présente : {fn}')
        else:
            log('❌', f'Scène manquante : {fn}')

    cjs = json.load(open(root / 'data' / 'campaigns.json'))
    camps = cjs if isinstance(cjs, list) else cjs.get('campaigns', cjs)
    if any(c.get('id') == SAGA_ID for c in camps):
        log('✅', 'Entry saga présente dans campaigns.json')
    else:
        log('❌', 'Entry saga manquante')


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN Saga « La filière dorée »')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_scenes(root)
    step_2_inject_campaign(root)
    step_3_bump_sw(root)
    step_4_rebuild_meta(root)
    step_5_validate(root)

    print('\n  ✅ Saga déployée.')
    print()
    print('  35 étapes · 105 choix · 7 dossiers journalisme-OSINT financier-maritime étendu précieux.')
    print('  PREMIÈRE CONTINUITÉ DE PROTAGONISTE AU CATALOGUE CAS-IN (Shadow Fleet → Or russe).')
    print('  Innovation : 1ère application forensique isotopique métaux précieux journalisme CH.')
    print('  1er sujet Tessin au catalogue (3 raffineries TI + 1 NE).')
    print('  Méthodologie quadruple intégrée (satellitaire + isotopique + LBMA + corporate).')
    print('  Consortium 9 partenaires (extension Shadow Fleet 5 → 9).')
    print('  Hybride judiciaire/réglementaire complet (1ère fois écosystème complet mobilisé).')
    print('  4 profils journaliste-OSINT/DFIR CH consolidés (palette unique en Europe).')


if __name__ == '__main__':
    main()
