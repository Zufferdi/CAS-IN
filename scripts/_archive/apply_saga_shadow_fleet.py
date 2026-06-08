#!/usr/bin/env python3
"""
apply_saga_shadow_fleet.py — CAS-IN Saga « La flotte fantôme »

CONTEXTE
────────
Saga 7 actes ancrée dans le journalisme-OSINT financier-maritime. POV : M. Yann
Chappuis, 41 ans, Le Temps Genève section économie internationale, formation
hybride EHL+UNIL+Lloyd's Maritime Academy 2023+Bellingcat workshop 2024
Amsterdam. 5 ans correspondant Singapore-Dubai 2017-2022 (trading matières
premières). L'un des trois journalistes CH romands maîtrisant OSINT financier-
maritime à niveau opérationnel.

Trame : Genève octobre 2026, lanceur d'alerte ancien collaborateur compliance
(2020-juin 2026) cabinet d'avocats genevois rue du Rhône contacte Le Temps via
SecureDrop. Documente structure systémique : Westmar Trading SA Genève + Westmar
Energy DMCC Dubai (80+ cargaisons pétrole russe ESPO Kozmino, ~4 milliards USD
2023-2026) + Maritime Grain SA Morges + Maritime Grain DMCC Dubai (90
cargaisons grain russe extorqué territoires occupés Ukraine via Sébastopol
2022-2026, ~700M USD). 47'000 documents + 12 To AIS data.

INNOVATION
──────────
Première saga CAS-IN avec POV journaliste-OSINT financier-maritime. Premier
sujet économique/financier au catalogue. Premier angle impact CH dans guerre
Ukraine (sensible, MPC enquête réelle Paramount). Méthodologie OSINT financier-
maritime distincte (AIS forensics + Sentinel-1 SAR + corporate registries + 
analyses paiements). Lanceur compliance cabinet d'avocats premier précédent CH.

ARC NARRATIF
────────────
1. SecureDrop lanceur d'alerte           — Oct 2026, OPSEC + Me Burgener + cellule sécurité
2. AIS forensics + Sentinel-1 SAR        — Oct-déc 2026, 170+ cargaisons HIGH/MEDIUM/LOW
3. Structures bénéficiaires effectifs    — Déc 2026-jan 2027, UBO via Pandora Papers
4. Grain extorqué Ukraine                — Jan-mars 2027, Sentinel-2 silos + témoignages
5. Confrontation systémique 11 entités   — Mars-avril 2027, DFAE + consortium
6. Publication + suites institutionnelles — Avril 2027, MPC + FINMA + CN motion Lcm
7. Doctrine journalisme-OSINT financier   — Avril 2028, masterclass MAZ + 3 profils CH

ACTIONS DU SCRIPT
─────────────────
1. Copie les 7 scènes JSON dans scenes/
2. Injecte l'entry saga dans data/campaigns.json (dédup par id)
3. Bump SW v169 → v170 (cumulatif)
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


SAGA_ID = 'saga-osint-shadow-fleet-geneve'
SAGA_ENTRY = {
    "id": SAGA_ID,
    "icon": "🚢",
    "title": "La flotte fantôme — Une enquête Le Temps",
    "subtitle": "Saga 7 actes · POV journaliste-OSINT financier-maritime Le Temps · Sanctions Russia + hub trading CH + grain extorqué Ukraine",
    "description": (
        "Saga DFIR ancrée dans le journalisme-OSINT financier-maritime. Inspirée enquêtes Public Eye "
        "(Paramount Energy & Commodities SA Genève 2023-2024, Harvest Group SA Morges 2024), "
        "Reuters/FT/OCCRP investigations shadow fleet 2023-2026, méthodologie KSE Institute Kyiv "
        "tracking tankers + AIS forensics, Lloyd's List Intelligence + Sentinel-1 SAR pour détection "
        "ship-to-ship transfers. Genève octobre 2026 : lanceur d'alerte ancien collaborateur "
        "compliance (2020-juin 2026) cabinet d'avocats genevois Rue du Rhône contacte Le Temps via "
        "SecureDrop, transmet 47'000 documents + 12 To AIS data tertiaires. Structure systémique "
        "Westmar (pétrole russe ESPO Kozmino, ~4 milliards USD) + Maritime Grain (grain russe "
        "extorqué territoires occupés Ukraine via Sébastopol, ~700M USD). Banques CH impliquées "
        "(470M + 215M USD). Cabinet d'avocats genevois prestataire. POV : M. Yann Chappuis, 41 ans, "
        "Le Temps Genève section économie internationale, formation hybride EHL Lausanne + UNIL "
        "journalisme + Lloyd's Maritime Academy 2023 (compliance maritime + AIS forensics) + "
        "Bellingcat workshop 2024 Amsterdam (OSINT financier + corporate registries + SAR). 5 ans "
        "correspondant Singapore-Dubai 2017-2022 trading commodities. Anglophone + russophone "
        "fonctionnel (mère ukrainienne). Enquête 6 mois (octobre 2026 - avril 2027) avec "
        "partenaires : Public Eye (Robert Bachmann CH commodity expert), OCCRP (Alexenia Dimitrova "
        "Europe head, accès Aleph), Follow the Money NL (Tom Bergin structures Dubai DMCC), Reuters "
        "London (Julia Payne commodity trading), Lloyd's List Intelligence (Michelle Wiese Bockmann "
        "senior maritime analyst), KSE Institute Kyiv (Anastasia Nesvetailova économiste shadow "
        "fleet), Skhemy RFE/RL (Anastasia Stanko Ukraine investigations), Truth Hounds Kyiv (Anton "
        "Mokhov documentation crimes guerre), Center for Civil Liberties Ukraine (Tetiana "
        "Pechonchyk Nobel Paix 2022), NASA Harvest (James Hostetter satellite agriculture). "
        "Méthodologie OSINT financier-maritime distincte : AIS forensics (MarineTraffic + "
        "VesselFinder + Lloyd's + Kpler + IHS Markit), Sentinel-1 SAR (radar nuit/nuages détection "
        "ship-to-ship transfers, distinct Sentinel-2 optique saga Yémen), corporate registries "
        "multi-juridictions (CH-FOSC + UAE NSR + Hong Kong + Singapore + Cyprus + BVI), OCCRP Aleph "
        "+ Sayari Graph + leaks historiques (Pandora Papers 2021 Asiaciti Trust, Suisse Secrets "
        "2022, FinCEN Files 2020, Cyprus Confidential 2023, Panama Papers 2016). 170+ cargaisons "
        "vérifiées triangulation multi-couches (142 HIGH + 20 MEDIUM + 8 LOW). UBO identifiés via "
        "Pandora Papers + Sayari + ITSI Foundation. Cabinet d'avocats prestataire identifié via "
        "actes notariés publics. Banques CH identifiées via triangulation Suisse Secrets 2022 + "
        "swift codes + FinCEN Files. Volet grain extorqué : Sentinel-2 silos territoires occupés "
        "Ukraine + témoignages distants Signal chiffré agriculteurs Kherson/Zaporizhzhia déplacés, "
        "doctrine victim-first (Mme V. Kherson déplacée Lviv), qualification juridique pillage "
        "Statut Rome art. 8(2)(b)(xvi) + Conventions Genève art. 33 + Convention IV art. 53-56 + "
        "Protocole I art. 4 + Ordonnance SECO 4 mars 2022 territoires occupés. Hybride judiciaire/"
        "publication : dossier transmis Truth Hounds + CCL pour dépôt CPI Ukraine (art. 15 Statut "
        "Rome, situation déjà ouverte 2014/2022), parallèle saga Yémen Mwatana+GLAN. Lanceur "
        "protégé Me Laurence Burgener (avocate indépendante Genève, ex-Suisse Secrets 2022), "
        "convention 6 points (mandat lanceur, financement Le Temps discret, confidentialité "
        "absolue, périmètre conseil large, pas de pression Le Temps, engagement écrit). Confrontation "
        "11 entités simultanées (2 UBO + 2 entités opérationnelles + 1 cabinet [Z] + 2 banques [BC]+"
        "[BP] + 2 fiduciaires + 2 cabinets comptables Big4). Coordination DFAE Pascal Wormser "
        "(continuité Pegasus + Yémen) sans céder indépendance (refus rapport en avance, refus "
        "report 7 avril ferme). Mise en demeure Banque cantonale [BC] via Me Pascal Ducrest "
        "Schellenberg Wittmer puis recul après réponse ferme Me Dougoud. Publication consortium "
        "mondial 7 avril 2027 06h00 UTC : Le Temps (lead francophone) + Tamedia SonntagsZeitung "
        "(Catherine Boss avec extension Zug coal traders 2022) + FT London (Robert Stockmann) + "
        "SZ Munich (Frederike Knüpling reprise saga Yémen) + Skhemy Kyiv (Anastasia Stanko) + "
        "Reuters dépêche + Public Eye + OCCRP + FTM rapports simultanés. Suites institutionnelles "
        "exceptionnelles : MPC enquête formelle juin 2027 (1ère grande affaire judiciaire sanctions "
        "Russia CH), FINMA enforcement Banque cantonale [BC] amende 38M CHF décembre 2027, SECO "
        "réformes annoncées (audit aléatoire traders, obligation documentation price cap, "
        "notification transactions >5M CHF), OAv Genève ouverture disciplinaire cabinet [Z] "
        "novembre 2027, Conseil national projet Loi commerce matières premières (Lcm) 1ère lecture "
        "décembre 2027 (101-89), postulat 27.XXX (PS) audit enforcement sanctions Russia 2022-2027 "
        "adopté juin 2027 (138-52). Sanctions UK/UE/USA étendues à Westmar + Maritime Grain + UBOs. "
        "CPI dossier grain procédure article 15 ouverte septembre 2027. Cabinet [Z] action civile "
        "5M CHF déboutée janvier 2028 (juge cite art. 17 Cst + intérêt public + bonne foi "
        "journalistique). Lanceur protégé 1 an+, identité jamais révélée. Sécurité Yann : 1 "
        "tentative spyware août 2027 détectée iVerify + MVT Citizen Lab. Reconnaissance European "
        "Press Prize Investigative Reporting 2027 (lauréate consortium), Prix Suisse du Journalisme "
        "2028, Reuters Global Award 2027. Article scientifique conjoint Chappuis+Bachmann+Stanko "
        "Journal of Financial Crime (Emerald Insight) septembre 2027 + Crime Law and Social Change "
        "(Springer) décembre 2027, 67 pages, référence académique. Doctrine journalisme-OSINT "
        "financier-maritime formalisée : masterclass MAZ Lucerne juin 2028 COMMUNE avec Léa "
        "Pellaton (RTS, saga Yémen), 32 journalistes, structure interactive complémentaire (matin "
        "théorie + après-midi pratique tournante + jeux de rôle sources vulnérables). Refus "
        "opportunités carrière (FT London Commodities senior 180K GBP, OCCRP consultance 70K USD, "
        "livre commercial Slatkine 65K CHF, conférences sectorielles trading). Continuité Le Temps. "
        "Établissement à RTS+Le Temps de 3 profils journaliste-OSINT/DFIR CH : Béguin (journaliste-"
        "DFIR mobile RTS, saga Pegasus) + Pellaton (journaliste-OSINT crimes guerre RTS, saga "
        "Yémen) + Chappuis (journaliste-OSINT financier-maritime Le Temps, saga Shadow Fleet) = "
        "palette CH unique en Europe. Innovation : 1ère saga POV journaliste-OSINT financier-"
        "maritime, 1er sujet économique/financier au catalogue, 1er angle impact CH dans guerre "
        "Ukraine, hybride pétrole + grain extorqué (combinaison Paramount + Harvest), lanceur "
        "compliance cabinet d'avocats premier précédent CH, angle réformes LEmb explicite (Loi "
        "Lcm + supervisor sectoriel + registre UBO public)."
    ),
    "level": "expert",
    "narrative": True,
    "scenes": [
        "ch-affaire-shadow-fleet-1-securedrop-lanceur",
        "ch-affaire-shadow-fleet-2-ais-sentinel-sar",
        "ch-affaire-shadow-fleet-3-structures-beneficiaires",
        "ch-affaire-shadow-fleet-4-grain-extorque-ukraine",
        "ch-affaire-shadow-fleet-5-confrontation-systemique",
        "ch-affaire-shadow-fleet-6-publication-suites",
        "ch-affaire-shadow-fleet-7-bilan-doctrine"
    ],
    "hook": "Sept actes. Lanceur d'alerte cabinet d'avocats. AIS forensics + Sentinel-1 SAR. 170 cargaisons. 4 milliards USD. MPC saisie. La doctrine du journalisme-OSINT financier-maritime face à l'évasion systémique des sanctions.",
    "kind": "saga"
}


def step_1_copy_scenes(root):
    print('\n[1/5] Copie des 7 scènes Shadow Fleet dans scenes/')
    src_dir = Path(__file__).parent.parent / 'scenes'
    if not src_dir.exists():
        src_dir = Path(__file__).parent / 'scenes'
    if not src_dir.exists():
        log('❌', 'Dossier scenes/ source introuvable dans bundle')
        sys.exit(1)

    dst_dir = root / 'scenes'
    dst_dir.mkdir(exist_ok=True)

    copied = skipped = 0
    for f in sorted(src_dir.glob('ch-affaire-shadow-fleet-*.json')):
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
    if 'saga-osint-shadow-fleet-geneve' in sw or '// Saga Shadow Fleet' in sw:
        log('⏭ ', f'SW déjà bumpé pour la saga Shadow Fleet (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v154 — 2026-06-01 — Bump SW v{current} → v{new_v}\n"
        f"// Saga Shadow Fleet « La flotte fantôme » — 7 actes · 35 étapes · 105 choix\n"
        f"// saga-osint-shadow-fleet-geneve — POV journaliste-OSINT financier-maritime Yann Chappuis\n"
        f"// (Le Temps Genève section économie internationale)\n"
        f"// Innovation : 1ère saga POV journaliste-OSINT financier-maritime\n"
        f"// Premier sujet économique/financier au catalogue\n"
        f"// Premier angle impact CH dans guerre Ukraine (sensible, MPC enquête Paramount)\n"
        f"// Élargit palette journalisme CH (7ème saga journaliste) :\n"
        f"//   - Cryptomixer (procureure ZH criminalité)\n"
        f"//   - Coin Laundry (Tamedia presse écrite investigation)\n"
        f"//   - Frappes cognitives (RTS investigation audiovisuel)\n"
        f"//   - Données brocante (ABE service public consommation TV)\n"
        f"//   - Pegasus mobiles (RTS journaliste-DFIR profil hybride domestique)\n"
        f"//   - OSINT Yémen (RTS journaliste-OSINT crimes guerre international)\n"
        f"//   - Shadow Fleet (Le Temps journaliste-OSINT financier-maritime international)\n"
        f"// 3 profils journaliste-OSINT/DFIR établis en CH :\n"
        f"//   - Béguin (journaliste-DFIR mobile surveillance domestique RTS, saga Pegasus)\n"
        f"//   - Pellaton (journaliste-OSINT crimes guerre international RTS, saga Yémen)\n"
        f"//   - Chappuis (journaliste-OSINT financier-maritime international Le Temps, saga Shadow Fleet)\n"
        f"// = palette CH unique en Europe\n"
        f"// Cadre légal majeur convoqué :\n"
        f"//   - LEmb art. 1, 6, 9 (Loi sanctions internationales CH)\n"
        f"//   - Ordonnances SECO Russia 2022-2026 + territoires occupés 4 mars 2022\n"
        f"//   - LBA art. 3, 4, 6, 9, 23 (blanchiment + MROS)\n"
        f"//   - LB art. 47 (secret bancaire)\n"
        f"//   - LFINMA art. 8, 29-36 (enforcement)\n"
        f"//   - Art. 321 CP (secret professionnel avocat — risque lanceur)\n"
        f"//   - Art. 271 CP (actes étatiques sans droit — base MPC)\n"
        f"//   - Art. 162 CP (secret commercial)\n"
        f"//   - Art. 273 CP (renseignements économiques)\n"
        f"//   - Art. 28a CPP (protection sources)\n"
        f"//   - Art. 28g CC (droit de réponse)\n"
        f"//   - Statut Rome CPI art. 8(2)(b)(xvi) (pillage territoire occupé — grain Ukraine)\n"
        f"//   - Conventions Genève art. 33 + Convention IV art. 53-56 + Protocole I art. 4\n"
        f"//   - GAFI Recommandation 24 (registres UBO)\n"
        f"//   - Directive UE 2018/843 (5AMLD)\n"
        f"//   - ATF 132 IV 132 (whistleblower atténuation peine)\n"
        f"//   - ATF 138 III 641 (mise en balance presse/personnalité)\n"
        f"//   - ATF 144 IV 391 (compétence CH entités filiales étrangères)\n"
        f"//   - CourEDH Bladet Tromsø (bonne foi journalistique)\n"
        f"//   - CourEDH Heinisch c. Allemagne (whistleblower secteur privé)\n"
        f"// Standards méthodologiques :\n"
        f"//   - AIS forensics (MarineTraffic + Lloyd's List Intelligence + Equasis + Kpler)\n"
        f"//   - Sentinel-1 SAR (radar nuit/nuages, détection ship-to-ship transfers)\n"
        f"//   - Corporate registries multi-juridictions (CH-FOSC + UAE NSR + HK + SG + Cyprus + BVI)\n"
        f"//   - OCCRP Aleph + Sayari Graph + ICIJ Offshore Leaks\n"
        f"//   - Leaks historiques : Pandora 2021 + Suisse Secrets 2022 + FinCEN 2020 + Cyprus Confidential 2023\n"
        f"//   - Méthodologie KSE Institute Kyiv 2024 (shadow fleet tracking)\n"
        f"//   - Méthodologie Global Witness 2023-2024 (price cap violations)\n"
        f"// Partenariats internationaux :\n"
        f"//   - Public Eye Lausanne (Robert Bachmann commodity expert)\n"
        f"//   - OCCRP (Alexenia Dimitrova Europe head, accès Aleph)\n"
        f"//   - Follow the Money NL (Tom Bergin structures Dubai DMCC)\n"
        f"//   - Lloyd's List Intelligence London (Michelle Wiese Bockmann)\n"
        f"//   - Reuters London (Julia Payne commodity trading)\n"
        f"//   - KSE Institute Kyiv (Anastasia Nesvetailova)\n"
        f"//   - Skhemy RFE/RL Kyiv (Anastasia Stanko Ukraine)\n"
        f"//   - Truth Hounds Kyiv (Anton Mokhov crimes guerre)\n"
        f"//   - Center for Civil Liberties Ukraine (Tetiana Pechonchyk Nobel Paix 2022)\n"
        f"//   - NASA Harvest (James Hostetter satellite agriculture)\n"
        f"// Inspirée enquêtes réelles : Public Eye Paramount Energy & Commodities SA Genève 2023-2024\n"
        f"//   (Niels Troost Néerlandais, sanctions UK 2024, MPC enquête préliminaire avril 2024) +\n"
        f"//   Harvest Group SA Morges grain russe 2024 + Reuters/FT/OCCRP investigations shadow fleet\n"
        f"//   2023-2026 + KSE Institute Kyiv tracking méthodologie + Lloyd's List Intelligence\n"
        f"// Lanceur d'alerte compliance cabinet d'avocats genevois (Rue du Rhône) :\n"
        f"//   - Premier précédent CH whistleblower cabinet d'avocats\n"
        f"//   - Tension art. 321 CP vs intérêt public (ATF 132 IV 132)\n"
        f"//   - Protection Me Laurence Burgener (avocate indépendante, ex-Suisse Secrets 2022)\n"
        f"// Hybride pétrole + grain extorqué (combinaison Paramount + Harvest)\n"
        f"// Consortium publication 7 avril 2027 06h00 UTC : Le Temps + Tamedia + FT + SZ + Skhemy +\n"
        f"//   Reuters + Public Eye + OCCRP + FTM (8 partenaires coordonnés embargo strict)\n"
        f"// Suites institutionnelles exceptionnelles :\n"
        f"//   - MPC enquête formelle juin 2027 (1ère grande affaire judiciaire sanctions Russia CH)\n"
        f"//   - FINMA amende 38M CHF Banque cantonale [BC] décembre 2027\n"
        f"//   - SECO réformes annoncées (audit aléatoire, documentation price cap, notification)\n"
        f"//   - OAv Genève discipline cabinet [Z] novembre 2027\n"
        f"//   - Conseil national projet Loi Lcm 1ère lecture décembre 2027 (101-89)\n"
        f"//   - Postulat 27.XXX (PS) audit sanctions Russia adopté juin 2027 (138-52)\n"
        f"//   - Sanctions UK/UE/USA étendues Westmar + Maritime Grain + UBOs\n"
        f"//   - CPI dossier grain procédure article 15 ouverte septembre 2027\n"
        f"// Cabinet [Z] action civile 5M CHF déboutée janvier 2028 (art. 17 Cst + intérêt public +\n"
        f"//   bonne foi journalistique) — jurisprudence importante\n"
        f"// Reconnaissance : European Press Prize Investigative Reporting 2027 (consortium) +\n"
        f"//   Prix Suisse du Journalisme 2028 + Reuters Global Award 2027\n"
        f"// Article scientifique conjoint Chappuis+Bachmann+Stanko :\n"
        f"//   - Journal of Financial Crime (Emerald Insight) septembre 2027, 67 pages\n"
        f"//   - Crime Law and Social Change (Springer) décembre 2027\n"
        f"// Masterclass MAZ Lucerne juin 2028 COMMUNE avec Léa Pellaton (saga Yémen) :\n"
        f"//   - 32 journalistes, structure interactive complémentaire matin théorie + après-midi\n"
        f"//     pratique tournante + jeux de rôle sources vulnérables\n"
        f"// Refus opportunités carrière (FT senior 180K GBP + OCCRP consultance + livre Slatkine +\n"
        f"//   conférences sectorielles) — continuité Le Temps\n"
        f"// Angle réformes LEmb explicite (Loi Lcm + supervisor sectoriel + registre UBO public +\n"
        f"//   obligation documentation price cap + notification transactions >5M CHF)\n"
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
        'ch-affaire-shadow-fleet-1-securedrop-lanceur.json',
        'ch-affaire-shadow-fleet-2-ais-sentinel-sar.json',
        'ch-affaire-shadow-fleet-3-structures-beneficiaires.json',
        'ch-affaire-shadow-fleet-4-grain-extorque-ukraine.json',
        'ch-affaire-shadow-fleet-5-confrontation-systemique.json',
        'ch-affaire-shadow-fleet-6-publication-suites.json',
        'ch-affaire-shadow-fleet-7-bilan-doctrine.json',
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
    print('  CAS-IN Saga « La flotte fantôme » (Shadow Fleet)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_scenes(root)
    step_2_inject_campaign(root)
    step_3_bump_sw(root)
    step_4_rebuild_meta(root)
    step_5_validate(root)

    print('\n  ✅ Saga déployée.')
    print()
    print('  35 étapes · 105 choix · 7 dossiers journalisme-OSINT financier-maritime.')
    print('  Innovation : 1ère saga POV journaliste-OSINT financier-maritime.')
    print('  Premier sujet économique/financier au catalogue.')
    print('  Premier angle impact CH dans guerre Ukraine.')
    print('  Hybride pétrole + grain extorqué (Paramount + Harvest).')
    print('  Lanceur compliance cabinet d\'avocats : premier précédent CH.')
    print('  3 profils journaliste-OSINT/DFIR CH établis (Béguin + Pellaton + Chappuis).')


if __name__ == '__main__':
    main()
