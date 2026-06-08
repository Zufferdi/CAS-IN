#!/usr/bin/env python3
"""
apply_saga_police_predictive.py — CAS-IN Saga « L'algorithme et l'innocent »

CONTEXTE
────────
Saga 7 actes ancrée dans le journalisme-DFIR civic tech. POV : Mme Mélanie
Rochat, 38 ans, RTS investigation actualité judiciaire/intérieure. Master
journalisme UNIL 2012 + Master Sciences criminelles UNIL 2015 (rare double
cursus). 8 ans Le Courrier section justice (2015-2023) + 3 ans RTS investigation
(2023-2026). Formation AlgorithmWatch CH summer school 2024 Berlin (FATE
auditing) + MIT Media Lab Civic Tech workshop 2025 Cambridge.

Trame : Zurich 28 août 2026 17h12, incident Daoud K. (22 ans, étudiant EPFL
Master architecture stage Aussersihl, citoyen suisse origine albanaise) —
interpellation arbitraire PRECOBS 8h détention + refus LTrans. Sollicitation
AlgorithmWatch CH (Mme Angela Müller) 14 septembre 2026. Enquête 7 mois
(septembre 2026 - avril 2027) avec partenariat tripartite RTS + AlgorithmWatch
CH + EPFL DEDIS (Prof. Bryan Ford). Audit systémique 4 cantons : ZH (PRECOBS),
BE (Vade-mecum + SRC), VD (SARI/JANUS analytique), GE (projet suspendu).
Hybride judiciaire (plainte PFPDT + recours TF Daoud K. premier précédent
jurisprudentiel CH possible) + publication grand public coordonnée
(RTS multi-canaux + Tamedia SonntagsZeitung). Confrontation 13 entités
(4 corps police + 4 Conseil d'État + CDCJP + Fedpol + SRC + IFPAS Berlin +
Palantir potentiel). Activation CN postulat Sven Bachmann PS + motion Sibel
Arslan Vert·e·s.

INNOVATION
──────────
Première saga POV journaliste-DFIR civic tech CH (4e profil au catalogue
complémentaire Béguin DFIR mobile + Pellaton OSINT crimes guerre + Chappuis
OSINT financier-maritime). Premier angle FATE auditing CH + AlgorithmWatch
CH partenaire ONG civic tech. Premier sujet libertés fondamentales + police
prédictive. Recours TF premier précédent jurisprudentiel CH (fictif anticipé).
Disparités cantonales explicitement documentées (fédéralisme CH). Doctrine
victim-first adaptée victime algorithme (vs témoin crimes guerre / source
whistleblower).

ARC NARRATIF
────────────
1. Un incident à Aussersihl              — Sept 2026, AlgorithmWatch + Daoud K. + cellule sécurité
2. LTrans + FATE methodology              — Oct 2026, 4 cantons demandes + framework FATE
3. Audit technique PRECOBS Zurich         — Nov-déc 2026, reverse API + biais discrimination
4. Audit comparatif 4 cantons             — Jan-fév 2027, Vade-mecum + SARI/JANUS + GE archives
5. PFPDT + recours TF                     — Fév-mars 2027, plainte conjointe + recours TF
6. Confrontation publication              — Mars-avril 2027, 13 entités + activation CN
7. Bilan doctrine                         — Avril 2028, arrêt TF favorable + 4 profils CH

ACTIONS DU SCRIPT
─────────────────
1. Copie les 7 scènes JSON dans scenes/
2. Injecte l'entry saga dans data/campaigns.json (dédup par id)
3. Bump SW v166 → v167 (cumulatif)
4. Régénère search-index, counts, README

IDEMPOTENT — Skip si scènes déjà présentes, skip si entry déjà dans campaigns.
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


SAGA_ID = 'saga-police-predictive-precobs-ch'
SAGA_ENTRY = {
    "id": SAGA_ID,
    "icon": "🚓",
    "title": "L'algorithme et l'innocent — Une enquête RTS",
    "subtitle": "Saga 7 actes · POV journaliste-DFIR civic tech RTS · Police prédictive PRECOBS 4 cantons + recours TF + libertés fondamentales",
    "description": (
        "Saga DFIR ancrée dans le journalisme-DFIR civic tech (4e profil au catalogue CH "
        "complémentaire Béguin DFIR mobile + Pellaton OSINT crimes guerre + Chappuis OSINT "
        "financier-maritime). Inspirée investigations COMPAS (ProPublica 2016 biais raciaux "
        "justice pénale US), SyRI Pays-Bas (tribunal La Haye annulé février 2020 discrimination "
        "indirecte), Robodebt Australie (Royal Commission 2023 suicides liés algorithme calcul "
        "indus), PRECOBS Munich (LMU rapport critique 2018 → abandon Bayern), AlgorithmWatch "
        "DE/CH investigations 2017-2024. Zurich 28 août 2026 17h12 : M. Daoud K., 22 ans, "
        "étudiant EPFL Master architecture stage Aussersihl, citoyen suisse origine albanaise, "
        "interpellé par Kantonspolizei Zurich motif oral 'présence dans une zone à risque selon "
        "notre système prédictif'. Aucun élément concret, aucun papier identité requis (Daoud les "
        "a), aucune charge sortie. 8h détention arbitraire Bahnhofstrasse. Demande LTrans accès "
        "données 4 septembre = refus formel 12 septembre 'sécurité publique'. Famille Krasniqi "
        "alerte Helvetia CCH → AlgorithmWatch CH (Mme Angela Müller). Sollicitation RTS "
        "investigation 14 septembre 2026. POV : Mme Mélanie Rochat, 38 ans, journaliste "
        "investigation RTS section actualité judiciaire/intérieure, Master journalisme UNIL 2012 "
        "+ Master Sciences criminelles UNIL 2015 (rare double cursus), 8 ans Le Courrier section "
        "justice + 3 ans RTS investigation, formation AlgorithmWatch CH summer school 2024 + MIT "
        "Media Lab Civic Tech 2025. Enquête 7 mois (septembre 2026 - avril 2027) avec "
        "partenariat tripartite : RTS investigation lead + AlgorithmWatch CH audit technique "
        "externe (Mme Angela Müller directrice politique + Dr. Matthias Spielkamp + Dr. Anna "
        "Mätzener) + EPFL DEDIS partenariat académique (Prof. Bryan Ford Lab Decentralized and "
        "Distributed Systems + doctorante Iris Krähenbühl mandate 3 mois audit FATE). Système "
        "ciblé : algorithmes police prédictive 4 cantons CH (Zurich PRECOBS Predictive Policing "
        "System Institut für musterbasierte Prognosetechnik IfmPt Oberhausen Allemagne déployé "
        "2013 étendu 2018-2024, Berne Vade-mecum développé 2019 en service 2021 extension SRC "
        "2023, Vaud analytique SARI/JANUS depuis 2022, Genève projet pilote 2024 suspendu 2025). "
        "Méthodologie FATE Framework (Fairness Accountability Transparency Ethics) + reverse-"
        "engineering API publique PRECOBS (Python + Burp Suite + mitmproxy, sans violation art. "
        "143bis CP intrusion) + tests audits 14'000 dossiers factices (counterfactual + paired "
        "testing) + analyses statistiques fairness metrics (demographic parity + equalized odds "
        "+ calibration) avec p<0.001 et intervalles confiance 95% + démonstration discrimination "
        "indirecte origine albanaise/macédonienne + quartier socioéconomique (Aussersihl/"
        "Letzigraben vs Hottingen/Fluntern). Doctrine victim-first adaptée victime algorithme : "
        "Daoud K. innocent identifié (vs témoin crimes guerre Yémen vs source whistleblower "
        "Shadow Fleet), accompagnement long terme tripartite Me Anita Thanei (Zurich défense "
        "civile + droits humains) + Marianne Lapierre (cellule soutien psychologique RTS, "
        "continuité Pegasus + Yémen) + Angela Müller (soutien institutionnel AlgorithmWatch CH), "
        "consentement éclairé séparé du premier entretien avec délai réflexion 2-3 semaines "
        "(méthodologie Mwatana renforcée), accompagnement famille Krasniqi + Helvetia CCH "
        "(Sandrine Vermot coordinatrice). Approche hybride judiciaire + publication grand "
        "public : plainte conjointe PFPDT (Préposé fédéral protection données et transparence, "
        "M. Adrian Lobsiger fonction) + Préposé cantonal protection données ZH (volet refus "
        "LTrans Daoud K. + volet décision automatisée nLPD art. 19-25), recours TF coordination "
        "Me Anita Thanei (Zurich pénal) + Me Frédérique Hennard (Lausanne TF droits "
        "fondamentaux) — premier précédent jurisprudentiel CH possible algorithmes police, "
        "dossier scientifique audit EPFL DEDIS intégré formellement dans recours, publication "
        "coordonnée RTS multi-canaux (Forum + Mise au point + Le 19h30 + RTS Info + dossier "
        "digital interactif) + Tamedia SonntagsZeitung (Catherine Boss continuité Shadow Fleet) "
        "+ activation Conseil national postulat 27.XXX (Sven Bachmann PS) audit utilisation "
        "algorithmes police + motion (Sibel Arslan Vert·e·s) moratoire police prédictive. "
        "Confrontation élargie 13 entités : 4 corps police cantonale (Police ZH + Kantonspolizei "
        "BE + Police cantonale VD + Police GE) + 4 Conseillers d'État Sécurité (Mario Fehr ZH "
        "PS + Philippe Müller BE PLR + Béatrice Métraux VD Vert·e·s + Carole-Anne Kast GE PS) + "
        "Conférence CDCJP + Fedpol (DFJP, volet fichier national) + SRC (DDPS, volet extension "
        "LRens 2023 surveillance préventive) + IFPAS Berlin (Institut für Polizei "
        "Auswertungssysteme, éditeur PRECOBS) + Palantir Technologies (mention potentielle si "
        "software identifié Vaud SARI/JANUS). Coordination DFAE Pascal Wormser (Division "
        "Sécurité humaine, continuité Pegasus + Yémen + Shadow Fleet) + DFJP M. Frédéric Müller "
        "(Office fédéral justice, conseiller données + algorithmes) — refus rapport en avance, "
        "refus report ferme face Conseil d'État ZH demande report. Envoi simultané 13 lettres "
        "droit de réponse formats adaptés multilingues (allemand cantons ZH+BE+SRC+IFPAS, "
        "français cantons VD+GE+Fedpol, anglais Palantir+IFPAS international), publication "
        "coordonnée 7 avril 2027 06h00 UTC, dépôt recours TF Daoud K. simultané. Suites "
        "institutionnelles exceptionnelles 1 an post : arrêt TF favorable Daoud K. (fictif "
        "anticipé) — premier précédent jurisprudentiel CH algorithmes police prédictive, "
        "interprétation Cst art. 8 + 13 + 29a + 31 + nLPD art. 19-25 + LTrans formelle, "
        "obligations cantons amélioration transparence + audit FATE + droit explication; "
        "Conseil national postulat 27.XXX adopté juin 2027 (138-52); motion Sibel Arslan "
        "moratoire débats; CDCJP groupe travail constitué; Fedpol clarifie politique algorithmes "
        "fichier national; SRC réduit extension LRens 2023 volet algorithmes; IFPAS Berlin "
        "communiqué défense; Palantir silence; sanctions disciplinaires individuelles agents "
        "police ZH refus LTrans (procédure interne). Cabinet [Z] équivalent : aucune procédure "
        "civile aboutie (présomption indépendance presse CH + bonne foi journalistique). Lanceur "
        "équivalent (pas applicable ici, Daoud K. plaignant ouvert). Daoud K. accompagnement "
        "Lapierre 1 an post + Me Thanei dossier civil dommages-intérêts canton ZH (parallèle). "
        "Reconnaissance European Press Prize Investigative Reporting 2027 (lauréate RTS + "
        "AlgorithmWatch + EPFL DEDIS consortium), Prix Suisse du Journalisme 2028, ACM SIGCAS "
        "Outstanding Paper 2028 article scientifique conjoint Communications of the ACM "
        "septembre 2027 + Journal of FAccT décembre 2027 (Rochat + Müller + Ford + Krähenbühl + "
        "Spielkamp 5 auteurs, 84 pages). Refus offre senior AlgorithmWatch DE Berlin 95K EUR + "
        "consultance OCDE Paris IA policy + livre commercial Slatkine — continuité RTS. "
        "Masterclass MAZ Lucerne juin 2028 COMMUNE 4 profils journaliste-OSINT/DFIR CH "
        "consolidés : Béguin DFIR mobile (saga Pegasus) + Pellaton OSINT crimes guerre (saga "
        "Yémen) + Chappuis OSINT financier-maritime (saga Shadow Fleet) + Rochat DFIR civic "
        "tech (cette saga) = palette CH unique en Europe. Innovation : 1ère saga POV journaliste-"
        "DFIR civic tech, 1er angle FATE auditing CH, 1er sujet libertés fondamentales + police "
        "prédictive au catalogue, recours TF premier précédent jurisprudentiel CH algorithmes "
        "police (fictif anticipé), disparités cantonales explicitement documentées (fédéralisme "
        "CH rare), doctrine victim-first adaptée victime algorithme, partenariat académique "
        "indépendant EPFL DEDIS (différenciation vs ETH CSS proche Fedpol), continuité narrative "
        "dense (Bürkler + Vidal + Schmidt + Lapierre + Wormser + Wertheimer + Boss reprises "
        "plusieurs sagas)."
    ),
    "level": "expert",
    "narrative": True,
    "scenes": [
        "ch-affaire-police-predictive-1-incident-daoud",
        "ch-affaire-police-predictive-2-ltrans-fate",
        "ch-affaire-police-predictive-3-audit-precobs",
        "ch-affaire-police-predictive-4-comparatif-cantons",
        "ch-affaire-police-predictive-5-pfpdt-recours-tf",
        "ch-affaire-police-predictive-6-confrontation-publication",
        "ch-affaire-police-predictive-7-bilan-doctrine"
    ],
    "hook": "Sept actes. Un étudiant arrêté arbitrairement. Un algorithme opaque. Quatre cantons audités. FATE methodology. Recours TF premier précédent CH. La doctrine du journalisme-DFIR civic tech face aux libertés fondamentales.",
    "kind": "saga"
}


def step_1_copy_scenes(root):
    print('\n[1/5] Copie des 7 scènes police prédictive dans scenes/')
    src_dir = Path(__file__).parent.parent / 'scenes'
    if not src_dir.exists():
        src_dir = Path(__file__).parent / 'scenes'
    if not src_dir.exists():
        log('❌', 'Dossier scenes/ source introuvable dans bundle')
        sys.exit(1)

    dst_dir = root / 'scenes'
    dst_dir.mkdir(exist_ok=True)

    copied = skipped = 0
    for f in sorted(src_dir.glob('ch-affaire-police-predictive-*.json')):
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
    if 'saga-police-predictive-precobs-ch' in sw or '// Saga Police prédictive' in sw:
        log('⏭ ', f'SW déjà bumpé pour la saga Police prédictive (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v155 — 2026-06-01 — Bump SW v{current} → v{new_v}\n"
        f"// Saga Police prédictive « L'algorithme et l'innocent » — 7 actes · 35 étapes · 105 choix\n"
        f"// saga-police-predictive-precobs-ch — POV journaliste-DFIR civic tech Mélanie Rochat\n"
        f"// (RTS investigation actualité judiciaire/intérieure)\n"
        f"// Innovation : 1ère saga POV journaliste-DFIR civic tech CH\n"
        f"// 1er angle FATE auditing CH + AlgorithmWatch CH partenaire ONG civic tech\n"
        f"// 1er sujet libertés fondamentales + police prédictive au catalogue\n"
        f"// Recours TF premier précédent jurisprudentiel CH algorithmes police (fictif anticipé)\n"
        f"// Disparités cantonales documentées (fédéralisme CH rare)\n"
        f"// Doctrine victim-first adaptée victime algorithme (Daoud K. 22 ans étudiant EPFL)\n"
        f"// Élargit palette journalisme CH (8ème saga journaliste) :\n"
        f"//   - Cryptomixer (procureure ZH criminalité)\n"
        f"//   - Coin Laundry (Tamedia presse écrite investigation)\n"
        f"//   - Frappes cognitives (RTS investigation audiovisuel)\n"
        f"//   - Données brocante (ABE service public consommation TV)\n"
        f"//   - Pegasus mobiles (RTS journaliste-DFIR profil hybride domestique)\n"
        f"//   - OSINT Yémen (RTS journaliste-OSINT crimes guerre international)\n"
        f"//   - Shadow Fleet (Le Temps journaliste-OSINT financier-maritime international)\n"
        f"//   - Police prédictive (RTS journaliste-DFIR civic tech admin publique CH)\n"
        f"// 4 profils journaliste-OSINT/DFIR établis en CH (palette unique en Europe) :\n"
        f"//   - Béguin (journaliste-DFIR mobile surveillance domestique RTS, saga Pegasus)\n"
        f"//   - Pellaton (journaliste-OSINT crimes guerre international RTS, saga Yémen)\n"
        f"//   - Chappuis (journaliste-OSINT financier-maritime international Le Temps, saga Shadow Fleet)\n"
        f"//   - Rochat (journaliste-DFIR civic tech admin publique CH RTS, saga Police prédictive)\n"
        f"// Système ciblé : algorithmes police prédictive 4 cantons CH :\n"
        f"//   - Zurich : PRECOBS Predictive Policing System (Institut für musterbasierte Prognosetechnik\n"
        f"//     IfmPt Oberhausen Allemagne, déployé 2013, étendu 2018-2024)\n"
        f"//   - Berne : Vade-mecum (2019-2021, extension SRC 2023)\n"
        f"//   - Vaud : analytique SARI/JANUS (2022+, distinction analytique vs prédictif)\n"
        f"//   - Genève : projet pilote 2024 suspendu 2025\n"
        f"// Incident pivot : Daoud K. 22 ans étudiant EPFL Master architecture stage Aussersihl\n"
        f"//   ZH citoyen suisse origine albanaise (Kosovo), 28 août 2026 17h12 interpellation\n"
        f"//   arbitraire PRECOBS 8h détention Bahnhofstrasse, refus LTrans 12 septembre 2026,\n"
        f"//   famille Krasniqi alerte Helvetia CCH → AlgorithmWatch CH Mme Angela Müller\n"
        f"// Cadre légal majeur convoqué :\n"
        f"//   - Cst art. 8 al. 2 (interdiction discrimination origine, race, langue, situation sociale)\n"
        f"//   - Cst art. 13 (sphère privée + emploi abusif données)\n"
        f"//   - Cst art. 17 (presse)\n"
        f"//   - Cst art. 29a (accès juge)\n"
        f"//   - Cst art. 31 (privation liberté garanties)\n"
        f"//   - Cst art. 35 (responsabilité État droits fondamentaux)\n"
        f"//   - nLPD art. 5+6 (principes traitement)\n"
        f"//   - nLPD art. 8 (données sensibles origine ethnique)\n"
        f"//   - nLPD art. 19-25 (décision individuelle automatisée — droit information, droit\n"
        f"//     explication, droit opposition)\n"
        f"//   - nLPD art. 25-30 (procédures PFPDT)\n"
        f"//   - LTrans fédérale + LPrD ZH + LIPAD GE + LInfo VD + LPD-Be\n"
        f"//   - Art. 143bis CP (limites reverse-engineering API)\n"
        f"//   - Art. 28a CPP (protection sources, étendu pseudonymisation Daoud K.)\n"
        f"//   - Art. 28+28g CC (personnalité + droit réponse)\n"
        f"//   - LRens art. 6, 26 (mission SRC + surveillance préventive)\n"
        f"//   - LSCPT (surveillance correspondance)\n"
        f"//   - Art. 82-103 LTF (recours TF) + Art. 89 (qualité recourir) + Art. 95-98 (griefs)\n"
        f"//   - ATF 138 I 6 (discrimination indirecte)\n"
        f"//   - ATF 142 II 268 (transparence)\n"
        f"//   - ATF 144 II 77 (LTrans portée)\n"
        f"//   - ATF (fictif anticipé) 27.XX.2028 — premier précédent CH algorithmes police\n"
        f"//   - CourEDH S. et Marper c. UK 2008 (surveillance préventive proportionnée)\n"
        f"//   - CourEDH Big Brother Watch c. UK 2021 (surveillance massive métadonnées)\n"
        f"//   - CJUE C-817/19 PNR 2022 (limites algorithmes automatisés sécurité)\n"
        f"//   - Tribunal La Haye SyRI février 2020 (annulation discrimination indirecte)\n"
        f"//   - LMU München rapport 2018 PRECOBS Bayern (abandon)\n"
        f"//   - UE AI Act 2024 (police prédictive high-risk)\n"
        f"//   - Directive UE 2024/1385 (données poursuite pénale)\n"
        f"// Standards méthodologiques :\n"
        f"//   - FATE Framework (Fairness Accountability Transparency Ethics)\n"
        f"//   - Métriques fairness (demographic parity + equalized odds + calibration)\n"
        f"//   - Méthodologie ProPublica COMPAS 2016 (biais raciaux justice pénale US)\n"
        f"//   - Méthodologie AlgorithmWatch SyRI 2020 (Hague Court)\n"
        f"//   - Tests audits dossiers factices (counterfactual + paired testing)\n"
        f"//   - Reverse-engineering API publique (Python requests + Burp Suite + mitmproxy)\n"
        f"//   - Analyses statistiques p<0.001 + IC 95% + 14'000 dossiers factices\n"
        f"//   - Démonstration discrimination indirecte origine + quartier socioéconomique\n"
        f"//   - Berkeley Protocol 2020 (OSINT continuité saga Yémen)\n"
        f"//   - Doctrine victim-first Mwatana adaptée (Dart Center Columbia)\n"
        f"// Partenariat tripartite :\n"
        f"//   - RTS investigation lead éditorial (Mme Mélanie Rochat + Frédéric Bürkler + Me\n"
        f"//     Sophie Vidal + Hugo Schmidt + Marianne Lapierre — continuité Pegasus + Yémen)\n"
        f"//   - AlgorithmWatch CH audit technique externe (Mme Angela Müller directrice politique\n"
        f"//     + Dr. Matthias Spielkamp + Dr. Anna Mätzener — chercheurs Berlin)\n"
        f"//   - EPFL DEDIS partenariat académique (Prof. Bryan Ford Lab Decentralized and\n"
        f"//     Distributed Systems + doctorante Iris Krähenbühl audit FATE 3 mois mandat,\n"
        f"//     différenciation vs ETH CSS proche Fedpol)\n"
        f"// Cible-pivot accompagnement long terme tripartite :\n"
        f"//   - Me Anita Thanei (Zurich, défense civile + droits humains, francophone fonctionnel)\n"
        f"//   - Marianne Lapierre (cellule soutien psychologique RTS)\n"
        f"//   - Angela Müller (soutien institutionnel AlgorithmWatch CH)\n"
        f"//   - Sandrine Vermot (Helvetia CCH coordinatrice)\n"
        f"//   - Famille Krasniqi accompagnée également\n"
        f"// Hybride judiciaire + publication coordonnée :\n"
        f"//   - Plainte conjointe PFPDT (M. Adrian Lobsiger fonction) + Préposé cantonal ZH\n"
        f"//   - Recours TF coordination Me Anita Thanei (Zurich pénal) + Me Frédérique Hennard\n"
        f"//     (Lausanne TF droits fondamentaux) — premier précédent jurisprudentiel CH\n"
        f"//   - Publication coordonnée 7 avril 2027 06h00 UTC : RTS multi-canaux (Forum + Mise\n"
        f"//     au point + Le 19h30 + RTS Info + dossier digital interactif) + Tamedia\n"
        f"//     SonntagsZeitung (Catherine Boss continuité Shadow Fleet)\n"
        f"//   - Activation Conseil national : postulat 27.XXX (Sven Bachmann PS) audit\n"
        f"//     utilisation algorithmes police + motion (Sibel Arslan Vert·e·s) moratoire\n"
        f"// Confrontation élargie 13 entités :\n"
        f"//   - 4 corps police cantonale (ZH + BE + VD + GE)\n"
        f"//   - 4 Conseillers d'État Sécurité (Mario Fehr ZH PS + Philippe Müller BE PLR +\n"
        f"//     Béatrice Métraux VD Vert·e·s + Carole-Anne Kast GE PS)\n"
        f"//   - Conférence CDCJP (Conférence des directrices et directeurs des départements\n"
        f"//     cantonaux de justice et police)\n"
        f"//   - Fedpol (DFJP, volet fichier national)\n"
        f"//   - SRC (DDPS, volet extension LRens 2023 surveillance préventive)\n"
        f"//   - IFPAS Berlin (Institut für Polizei Auswertungssysteme, éditeur PRECOBS)\n"
        f"//   - Palantir Technologies (mention potentielle si software identifié Vaud)\n"
        f"// Coordination DFAE + DFJP :\n"
        f"//   - Pascal Wormser (DFAE Division Sécurité humaine, continuité Pegasus + Yémen +\n"
        f"//     Shadow Fleet)\n"
        f"//   - M. Frédéric Müller (DFJP Office fédéral justice, conseiller données + algorithmes)\n"
        f"//   - Refus rapport en avance, refus report ferme face Conseil d'État ZH demande report\n"
        f"// Suites institutionnelles exceptionnelles 1 an post :\n"
        f"//   - Arrêt TF favorable Daoud K. (fictif anticipé) — premier précédent jurisprudentiel\n"
        f"//     CH algorithmes police prédictive\n"
        f"//   - Postulat 27.XXX adopté CN juin 2027 (138-52)\n"
        f"//   - Motion Sibel Arslan moratoire en débat\n"
        f"//   - CDCJP groupe travail constitué\n"
        f"//   - Fedpol clarifie politique algorithmes fichier national\n"
        f"//   - SRC réduit extension LRens 2023 volet algorithmes\n"
        f"//   - Sanctions disciplinaires individuelles agents police ZH refus LTrans\n"
        f"// Reconnaissance :\n"
        f"//   - European Press Prize Investigative Reporting 2027 (lauréate RTS + AlgorithmWatch\n"
        f"//     CH + EPFL DEDIS consortium)\n"
        f"//   - Prix Suisse du Journalisme 2028\n"
        f"//   - ACM SIGCAS Outstanding Paper 2028\n"
        f"// Article scientifique conjoint 5 auteurs Rochat + Müller + Ford + Krähenbühl +\n"
        f"//   Spielkamp :\n"
        f"//   - Communications of the ACM septembre 2027, 84 pages\n"
        f"//   - Journal of FAccT (Fairness Accountability Transparency) décembre 2027\n"
        f"// Refus opportunités carrière (AlgorithmWatch DE Berlin senior 95K EUR + OCDE Paris IA\n"
        f"//   policy + livre commercial Slatkine) — continuité RTS\n"
        f"// Masterclass MAZ Lucerne juin 2028 COMMUNE 4 profils CH consolidés :\n"
        f"//   - Béguin (DFIR mobile RTS, saga Pegasus)\n"
        f"//   - Pellaton (OSINT crimes guerre RTS, saga Yémen)\n"
        f"//   - Chappuis (OSINT financier-maritime Le Temps, saga Shadow Fleet)\n"
        f"//   - Rochat (DFIR civic tech RTS, cette saga)\n"
        f"//   = palette CH unique en Europe\n"
        f"// Continuité narrative dense :\n"
        f"//   - Bürkler + Vidal + Schmidt + Lapierre repris (Pegasus + Yémen)\n"
        f"//   - Pascal Wormser DFAE repris (Pegasus + Yémen + Shadow Fleet)\n"
        f"//   - Léa Wertheimer DFAE reprise (Shadow Fleet)\n"
        f"//   - Catherine Boss Tamedia reprise (Shadow Fleet)\n"
        f"//   - 4 profils journaliste-OSINT/DFIR CH réunis acte 7\n"
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
        'ch-affaire-police-predictive-1-incident-daoud.json',
        'ch-affaire-police-predictive-2-ltrans-fate.json',
        'ch-affaire-police-predictive-3-audit-precobs.json',
        'ch-affaire-police-predictive-4-comparatif-cantons.json',
        'ch-affaire-police-predictive-5-pfpdt-recours-tf.json',
        'ch-affaire-police-predictive-6-confrontation-publication.json',
        'ch-affaire-police-predictive-7-bilan-doctrine.json',
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
    print('  CAS-IN Saga « L\'algorithme et l\'innocent »')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_scenes(root)
    step_2_inject_campaign(root)
    step_3_bump_sw(root)
    step_4_rebuild_meta(root)
    step_5_validate(root)

    print('\n  ✅ Saga déployée.')
    print()
    print('  35 étapes · 105 choix · 7 dossiers journalisme-DFIR civic tech.')
    print('  Innovation : 1ère saga POV journaliste-DFIR civic tech CH.')
    print('  Premier angle FATE auditing + AlgorithmWatch CH partenaire.')
    print('  Premier sujet libertés fondamentales + police prédictive.')
    print('  Recours TF premier précédent jurisprudentiel CH algorithmes police.')
    print('  Disparités cantonales documentées (fédéralisme CH).')
    print('  4 profils journaliste-OSINT/DFIR CH consolidés (palette unique en Europe).')


if __name__ == '__main__':
    main()
