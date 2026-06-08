#!/usr/bin/env python3
"""
apply_saga_osint_yemen.py — CAS-IN Saga « Les ombres de Saada »

CONTEXTE
────────
Saga 7 actes ancrée dans le journalisme-OSINT crimes de guerre. POV : Mme Léa
Pellaton, 36 ans, RTS investigation internationale, formation hybride UNIL +
Bellingcat workshop 2024 + Berkeley HRC summer school 2025. Une des rares
journalistes CH formées OSINT compatible admissibilité judiciaire internationale.

Trame : Genève septembre 2026, Mwatana for Human Rights (ONG yéménite Prix Right
Livelihood 2022) sollicite RTS via canal sécurisé pour partenariat investigation
OSINT sur 3 frappes coalition saoudienne-EAU au Yémen 2024-2026 (F-001 marché Saada
14 nov 2024, F-002 école Bani Maaz 3 mars 2025, F-003 hôpital Al-Razi 22 juillet
2026). Enquête 6 mois avec méthodologie Berkeley Protocol + GLAN/Bellingcat 2022.
Hybride judiciaire/publication : preuves admissibles dépôt CPI + Conseil droits
humains ONU + publication consortium mondial 5 médias 31 mars 2027.

INNOVATION
──────────
Première saga CAS-IN avec POV journaliste-OSINT crimes de guerre. Léa opère elle-
même géolocalisation/chronolocalisation/identification munitions. Premier angle
international fort au catalogue (théâtre Yémen, pas cible domestique CH). Hybride
justice/publication formalisé avec Berkeley Protocol + GLAN/Bellingcat method 2022.

ARC NARRATIF
────────────
1. Sollicitation Mwatana                  — Sept 2026, OPSEC Tutanota, pitch Bürkler
2. Berkeley Protocol & chain of custody   — Sept 2026, méthodologie 10 chapitres
3. Géolocalisation & chronolocalisation   — Oct-nov 2026, F-001 marché Saada
4. Identification munitions & chaîne       — Nov-déc 2026, Mk-82+GBU-12+GBU-39
5. Témoignages distants & sécurité         — Jan-fév 2027, 7 témoins Signal chiffré
6. Confrontation & publication coordonnée — Mars 2027, 8 entités + consortium 5 médias
7. Doctrine du journalisme-OSINT          — Mars 2028, masterclass MAZ + article Oxford

ACTIONS DU SCRIPT
─────────────────
1. Copie les 7 scènes JSON dans scenes/
2. Injecte l'entry saga dans data/campaigns.json (dédup par id)
3. Bump SW v168 → v169 (cumulatif après Cryptomixer + Coin Laundry + Frappes cognitives + Données brocante + Pegasus mobiles)
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


SAGA_ID = 'saga-osint-yemen-rts'
SAGA_ENTRY = {
    "id": SAGA_ID,
    "icon": "🕯️",
    "title": "Les ombres de Saada — Une enquête RTS",
    "subtitle": "Saga 7 actes · POV journaliste-OSINT RTS · Crimes guerre Yémen + admissibilité CPI",
    "description": (
        "Saga DFIR ancrée dans le journalisme-OSINT crimes de guerre. Inspirée méthodologies "
        "Bellingcat Justice and Accountability Unit (Amsterdam, créée 2022 avec GLAN) + "
        "Berkeley Human Rights Center Investigations Lab (UC Berkeley) + Berkeley Protocol "
        "on Digital Open Source Investigations (OHCHR + UC Berkeley 2020, standard ONU) + "
        "méthodologie GLAN/Bellingcat 2022 (admissibilité OSINT cours anglaises + CPI). "
        "Genève septembre 2026 : Mwatana for Human Rights (ONG yéménite fondée 2007, "
        "présidente Radhya al-Mutawakel Prix Right Livelihood 2022) sollicite RTS via "
        "Tutanota chiffré pour partenariat investigation OSINT sur 3 frappes coalition "
        "saoudienne-EAU au Yémen 2024-2026 : F-001 Marché Saada 14 nov 2024 (23 morts), "
        "F-002 École Bani Maaz 3 mars 2025 (14 enfants morts), F-003 Hôpital Al-Razi Saada "
        "22 juillet 2026 (9 morts dont personnel médical). POV : Mme Léa Pellaton, 36 ans, "
        "RTS investigation internationale, formation hybride UNIL Master journalisme 2014 + "
        "6 ans Le Temps Genève internationale (ONU, OHCHR, CICR) + Bellingcat workshop 2024 "
        "Amsterdam + Berkeley Human Rights Center summer school 2025. Une des trois "
        "journalistes CH formées OSINT compatible admissibilité judiciaire internationale. "
        "Enquête 6 mois (sept 2026 - mars 2027) avec partenaires : Bellingcat J&A Unit "
        "(Giancarlo Fiorella directeur, Nick Waters expert munitions Yémen, Larissa "
        "Lockwood senior researcher), Berkeley HRC Investigations Lab (Alexa Koenig co-"
        "architecte Berkeley Protocol), GLAN London (Yvonne McDermott Rees Reader Law "
        "Swansea, co-architecte GLAN/Bellingcat 2022). Méthodologie Berkeley Protocol "
        "10 chapitres + GLAN/Bellingcat method admissibilité cours anglaises + chain of "
        "custody OSINT (Hunchly + hashes SHA-256/SHA-1/MD5 + source ladder + triple "
        "stockage chiffré). Géolocalisation par triangulation visuelle + imagerie satellite "
        "Sentinel-2 ESA (10m gratuit public) + Planet PlanetScope (3m Planet Stories). "
        "Chronolocalisation par ombres + SunCalc + sources convergentes. Identification "
        "munitions Bellingcat method : F-001 Mk-82 500lb USA lot 04A 11-19, F-002 GBU-12 "
        "Paveway II (Raytheon US + BAE Systems UK lot 142B 06-22), F-003 GBU-39 SDB Boeing "
        "code AB-30-6789-22-04 mai 2022 GPS-guided. Chaîne responsabilité fabricants + "
        "États autorisateurs export (DSCA US + gov.uk UK). Cadre juridique : Statut Rome "
        "art. 8(2)(b)(ii,iv,ix) crimes guerre + Conventions Genève art. 18-19 hôpitaux + "
        "Protocole I art. 51-52 + ATT 2014 art. 7 + EU Common Position 2008/944/CFSP + "
        "LFMG CH. 7 témoignages distants Signal vidéo chiffré (T-001 survivante, T-002 "
        "photographe, T-003 père Ahmad, T-004 instituteur, T-005 médecin Marib nominal, "
        "T-006 patient, T-007 CICR), doctrine victim-first absolue, sensibilité trauma "
        "Dart Center Columbia, vicarious trauma Léa reconnue précoce avec plan 4 axes "
        "Marianne Lapierre. Confrontation 8 entités simultanées : Saudi+EAU (missions "
        "permanentes Genève) + USA+UK (autorisateurs export) + Lockheed Martin+Raytheon+"
        "BAE Systems+Boeing (fabricants). Coordination DFAE Pascal Wormser (Division "
        "Sécurité humaine) sans céder indépendance. Publication consortium mondial 31 "
        "mars 2027 06h00 UTC : RTS + The Guardian + Le Monde + Süddeutsche Zeitung + "
        "Daraj (arabe) + Reuters dépêche + Bellingcat rapport technique + Berkeley HRC "
        "article académique T+24h. Dossier judiciaire 5 volumes porté par Mwatana+GLAN : "
        "dépôt CPI art. 15 Statut Rome + Conseil droits humains ONU + Rapporteurs spéciaux. "
        "Suites institutionnelles 1 an post : CPI preliminary examination ouverte juin "
        "2027, Conseil droits humains résolution adopte Independent Yemen Documentation "
        "Mechanism (IYDM) septembre 2027 (premier instrument ONU spécifique Yémen depuis "
        "dissolution GEE 2021), procédures judiciaires Haute Cour Londres + Paris en "
        "cours, Congressional hearings Senate Foreign Relations Committee USA. Reconnaissance "
        "European Press Prize Investigative Reporting 2027 + Prix Suisse du Journalisme "
        "2028 + Bellingcat Award 2027. Article scientifique conjoint Pellaton+Koenig+"
        "McDermott Rees Journal of International Criminal Justice (Oxford Academic) "
        "novembre 2027, 89 pages, référence académique. Doctrine journalisme-OSINT crimes "
        "de guerre formalisée : masterclass MAZ Lucerne (28 journalistes), transmission "
        "UNIL + Berkeley HRC summer school. Refus opportunités commerciales (Bellingcat "
        "Lead Investigator Yemen 120K EUR Amsterdam, IYDM ONU P-4, livre commercial "
        "Slatkine 80K CHF, conférences entreprises armement). Établissement à RTS de 2 "
        "profils complémentaires : Pellaton (journaliste-OSINT crimes guerre international) "
        "+ Béguin (journaliste-DFIR mobile surveillance domestique) = palette CH unique. "
        "Innovation : 1ère saga POV journaliste-OSINT crimes de guerre, 1er angle "
        "international fort au catalogue, hybride justice/publication formalisé."
    ),
    "level": "expert",
    "narrative": True,
    "scenes": [
        "ch-affaire-osint-yemen-1-sollicitation-mwatana",
        "ch-affaire-osint-yemen-2-berkeley-protocol",
        "ch-affaire-osint-yemen-3-geolocalisation-chronologie",
        "ch-affaire-osint-yemen-4-munitions-chaine",
        "ch-affaire-osint-yemen-5-temoignages-securite",
        "ch-affaire-osint-yemen-6-confrontation-publication",
        "ch-affaire-osint-yemen-7-bilan-doctrine"
    ],
    "hook": "Sept actes. Trois frappes documentées. Six mois d'OSINT. CPI saisie. La doctrine du journalisme-OSINT crimes de guerre face à l'impunité.",
    "kind": "saga"
}


def step_1_copy_scenes(root):
    print('\n[1/5] Copie des 7 scènes OSINT Yémen dans scenes/')
    src_dir = Path(__file__).parent.parent / 'scenes'
    if not src_dir.exists():
        src_dir = Path(__file__).parent / 'scenes'
    if not src_dir.exists():
        log('❌', 'Dossier scenes/ source introuvable dans bundle')
        sys.exit(1)

    dst_dir = root / 'scenes'
    dst_dir.mkdir(exist_ok=True)

    copied = skipped = 0
    for f in sorted(src_dir.glob('ch-affaire-osint-yemen-*.json')):
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
    if 'saga-osint-yemen' in sw or '// Saga OSINT Yémen' in sw:
        log('⏭ ', f'SW déjà bumpé pour la saga OSINT Yémen (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v153 — 2026-06-01 — Bump SW v{current} → v{new_v}\n"
        f"// Saga OSINT Yémen « Les ombres de Saada » — 7 actes · 35 étapes · 105 choix\n"
        f"// saga-osint-yemen-rts — POV journaliste-OSINT crimes de guerre Léa Pellaton\n"
        f"// (RTS investigation internationale)\n"
        f"// Innovation : 1ère saga POV journaliste-OSINT crimes de guerre\n"
        f"// Premier angle international fort au catalogue (théâtre Yémen)\n"
        f"// Hybride justice/publication formalisé (Berkeley Protocol + GLAN/Bellingcat 2022)\n"
        f"// Élargit palette journalisme CH (6ème saga journaliste) :\n"
        f"//   - Cryptomixer (procureure ZH criminalité)\n"
        f"//   - Coin Laundry (Tamedia presse écrite investigation)\n"
        f"//   - Frappes cognitives (RTS investigation audiovisuel)\n"
        f"//   - Données brocante (ABE service public consommation TV)\n"
        f"//   - Pegasus mobiles (RTS journaliste-DFIR profil hybride domestique)\n"
        f"//   - OSINT Yémen (RTS journaliste-OSINT crimes guerre international)\n"
        f"// 2 profils journaliste-OSINT/DFIR établis à RTS investigation :\n"
        f"//   - Béguin (journaliste-DFIR mobile surveillance domestique, saga Pegasus)\n"
        f"//   - Pellaton (journaliste-OSINT crimes guerre international, saga Yémen)\n"
        f"// Cadre légal majeur convoqué :\n"
        f"//   - Statut Rome CPI art. 7-8 (crimes humanité + guerre), art. 15 (Communications\n"
        f"//     au Procureur), art. 69 (admissibilité preuves)\n"
        f"//   - Conventions Genève + Protocoles I (art. 18-19 hôpitaux, art. 51-52 civils)\n"
        f"//   - Arms Trade Treaty (ATT) 2014 art. 7 critères transferts\n"
        f"//   - EU Common Position 2008/944/CFSP critères export\n"
        f"//   - LFMG (Loi fédérale matériel de guerre CH)\n"
        f"//   - Art. 28a CPP (sources, applicable témoins étrangers)\n"
        f"//   - Art. 28g CC (droit de réponse aux médias périodiques)\n"
        f"//   - CourEDH Bladet Tromsø c. Norvège (bonne foi journalistique)\n"
        f"//   - Campaign Against Arms Trade v SSDIT (UK Court of Appeal 2019)\n"
        f"// Standards méthodologiques :\n"
        f"//   - Berkeley Protocol on Digital Open Source Investigations (OHCHR + UC Berkeley\n"
        f"//     décembre 2020, 134 pages, 10 chapitres) — standard ONU OSINT preuves\n"
        f"//   - Méthodologie GLAN/Bellingcat 2022 (admissibilité cours anglaises + CPI)\n"
        f"//   - Mock trial Swansea 2021 (sous jurisdiction English law)\n"
        f"//   - ISO/IEC 27037 + RFC 3227\n"
        f"// Partenariats internationaux :\n"
        f"//   - Mwatana for Human Rights (Radhya al-Mutawakel Prix Right Livelihood 2022)\n"
        f"//   - Bellingcat J&A Unit Amsterdam (Giancarlo Fiorella, Nick Waters, Larissa Lockwood)\n"
        f"//   - Berkeley HRC Investigations Lab UC Berkeley (Alexa Koenig)\n"
        f"//   - GLAN London (Yvonne McDermott Rees, Reader Law Swansea)\n"
        f"// Inspirée méthodologie GLAN/Bellingcat 2022 (testée mock trial Swansea 2021) +\n"
        f"//   Bellingcat enquêtes Yémen depuis 2018 (Dhahyan, hôpital MSF Abs, etc.) +\n"
        f"//   travail Mwatana 2007-2027 + GEE Yémen ONU 2017-2021 (dissous oct 2021)\n"
        f"// Doctrine victim-first absolue : 7 témoins T-001 à T-007 anonymisés sauf T-005\n"
        f"//   médecin Marib + T-003 partielle Ahmad (consentements écrits)\n"
        f"// Vicarious trauma reconnue (Berkeley Protocol chapitre 10 + Dart Center Columbia)\n"
        f"// Consortium publication 5 médias mondiaux + dépôt judiciaire CPI + ONU coordonné\n"
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
        'ch-affaire-osint-yemen-1-sollicitation-mwatana.json',
        'ch-affaire-osint-yemen-2-berkeley-protocol.json',
        'ch-affaire-osint-yemen-3-geolocalisation-chronologie.json',
        'ch-affaire-osint-yemen-4-munitions-chaine.json',
        'ch-affaire-osint-yemen-5-temoignages-securite.json',
        'ch-affaire-osint-yemen-6-confrontation-publication.json',
        'ch-affaire-osint-yemen-7-bilan-doctrine.json',
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
    print('  CAS-IN Saga « Les ombres de Saada » (OSINT Yémen)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_scenes(root)
    step_2_inject_campaign(root)
    step_3_bump_sw(root)
    step_4_rebuild_meta(root)
    step_5_validate(root)

    print('\n  ✅ Saga déployée.')
    print()
    print('  35 étapes · 105 choix · 7 dossiers journalisme-OSINT crimes de guerre.')
    print('  Innovation : 1ère saga POV journaliste-OSINT crimes de guerre.')
    print('  Premier angle international fort (théâtre Yémen).')
    print('  Hybride justice/publication formalisé (Berkeley Protocol + GLAN/Bellingcat).')
    print('  Coalition saoudienne-EAU + USA/UK + 4 fabricants confrontés.')
    print('  Doctrine journalisme-OSINT crimes guerre formalisée pour profession CH.')


if __name__ == '__main__':
    main()
