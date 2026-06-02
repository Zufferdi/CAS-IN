#!/usr/bin/env python3
"""
apply_saga_coinlaundry.py — CAS-IN Saga « Coin Laundry »

CONTEXTE
────────
Saga DFIR 7 actes inspirée de l'enquête internationale « The Coin Laundry »
(ICIJ + Tamedia + 37 médias dans 35 pays, novembre 2025) sur les flux illicites
transitant par les grandes plateformes crypto. 28 milliards USD identifiés sur
12 mois (juillet 2024 - juillet 2025), 530 millions CHF perdus par les Suisses
2022-2024 dans des arnaques pig butchering.

POV : Journaliste d'investigation Mme Lara Kessler (Tamedia, 14 ans de carrière,
co-auteure Pandora Papers et Suisse Secrets). Codename source : 'lauterzeuge-ch'.

ARC NARRATIF
────────────
1. Le tip qui change tout            — 7 mai 2025, whistleblower SecureDrop
2. 37 médias, une seule histoire     — 17 juin 2025, consortium ICIJ + data
3. Le visage des victimes            — 19 sept 2025, interviews pig butchering
4. Les plateformes répondent (ou pas) — 22 oct 2025, droit de réponse + 28g CC
5. Le jour J : 37 médias, une explosion — 17 nov 2025, publication coordonnée
6. Ce qui change (et ce qui ne change pas) — 12 janv 2026, suites FINMA/MROS
7. Le bilan : ce qu'on a fait, ce qu'on n'a pas fait — 16 nov 2026, doctrine

PERSONNAGES PERSISTANTS
───────────────────────
- Mme Lara Kessler (Tamedia investigation) — protagoniste
- Mme Christine Hauser (rédactrice en chef investigation Tamedia)
- Me Olivier Brunner (juriste rédaction Tamedia)
- Mme Anya Müller (data journaliste Tamedia)
- 'lauterzeuge-ch' (whistleblower ex-compliance, identité protégée)
- Mme Sara Rodríguez (ICIJ Washington, coordinatrice consortium)
- Mme Sofia Bertelsmann (Süddeutsche Zeitung)
- M. Mathieu Drouet (Le Monde)
- Me Dr. Heinrich Wirth (cabinet Bär & Karrer, défense Plateforme X)
- Me Eveline Studer (avocate presse Tamedia)
- Pierre M. (victime pig butchering, 145K CHF perdus, médecin Lausanne — pseudonymisé)
- Prof. Dr. Sabine Trebbe (UNIL, éthique journalistique)
- 'lichtblick-bern' (deuxième source, FINMA, tip 5 déc 2026)

CADRE LÉGAL CONVOQUÉ
────────────────────
- Art. 17 Cst (liberté de la presse)
- Art. 13 Cst (sphère privée)
- Art. 28 CC (protection personnalité)
- Art. 28g CC (droit de réponse aux médias périodiques)
- Art. 173-174 CP (diffamation, calomnie)
- Art. 162 CP (violation secret de fonction — source whistleblower)
- Art. 320 CP (violation secret de fonction — source FINMA potentielle)
- Art. 28a CPP (protection des sources — pilier)
- nLPD art. 5+6+12+31+49+50 (protection données + traitement journalistique)
- Art. 261 CPC (mesures provisionnelles)
- Art. 308 CPC (appel)
- Art. 315 CPC (effet suspensif)
- CourEDH art. 10 (liberté d'expression)
- CourEDH Goodwin c. UK (protection sources)
- CourEDH Bladet Tromsø c. Norvège (vérification raisonnable + bonne foi)
- CourEDH Guja c. Moldavie (protection whistleblowers)
- ATF 138 III 641 (mise en balance presse/personnalité)
- ATF 144 IV 277 (whistleblower atténuation)
- Déclaration CSP (Conseil suisse de la presse — 13 devoirs/droits)
- ICIJ Code of Ethics

ACTIONS DU SCRIPT
─────────────────
1. Copie les 7 scènes JSON dans scenes/
2. Injecte l'entry saga dans data/campaigns.json (dédup par id)
3. Bump SW v164 → v165 (cumulatif après Cryptomixer)
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


SAGA_ID = 'saga-coinlaundry-icij-tamedia'
SAGA_ENTRY = {
    "id": SAGA_ID,
    "icon": "🧺",
    "title": "Coin Laundry — Une enquête ICIJ",
    "subtitle": "Saga 7 actes · POV journaliste d'investigation · Tamedia + 37 médias 35 pays",
    "description": (
        "Saga DFIR ancrée dans l'enquête internationale « The Coin Laundry » (ICIJ + Tamedia + "
        "37 médias dans 35 pays, novembre 2025). 28 milliards USD de flux illicites identifiés "
        "sur 12 mois via les grandes plateformes crypto. 530 millions CHF perdus par les "
        "Suisses 2022-2024 dans des arnaques pig butchering. POV : journaliste d'investigation "
        "Mme Lara Kessler (Tamedia). 18 mois de l'enquête : réception du tip SecureDrop "
        "d'un whistleblower ex-compliance (protection art. 28a CPP), entrée dans le consortium "
        "ICIJ, data journalism rigoureux (pseudonymisation nLPD), interviews de 24 victimes "
        "(consentement éclairé, RAVA), demandes de droit de réponse aux plateformes "
        "(art. 28g CC + lettre comminatoire + requête mesures provisionnelles rejetée), "
        "publication coordonnée mondiale 17 novembre 2025 (zéro fuite), suites FINMA/MROS/"
        "parlement/MP-ZH, bilan déontologique 1 an après, transmission doctrinale UNIL. "
        "Tensions déontologiques : protection sources vs intérêt public, anonymisation "
        "victimes vs humanisation, droit de réponse vs indépendance, journaliste vs activiste, "
        "consortium ICIJ vs scoop national. Complémentaire à la saga Cryptomixer (POV "
        "procureure MP-ZH) — angle journalistique sur le même écosystème crypto."
    ),
    "level": "expert",
    "narrative": True,
    "scenes": [
        "ch-affaire-coinlaundry-1-tip-whistleblower",
        "ch-affaire-coinlaundry-2-consortium-analyse-data",
        "ch-affaire-coinlaundry-3-interviews-victimes",
        "ch-affaire-coinlaundry-4-confrontation-plateformes",
        "ch-affaire-coinlaundry-5-publication-coordonnee",
        "ch-affaire-coinlaundry-6-suites-institutionnelles",
        "ch-affaire-coinlaundry-7-bilan-doctrine"
    ],
    "hook": "Sept actes. Un tip dans la nuit. 37 médias dans 35 pays. 530 millions volés aux Suisses. Le journalisme d'investigation à l'épreuve de la déontologie.",
    "kind": "saga"
}


def step_1_copy_scenes(root):
    print('\n[1/5] Copie des 7 scènes Coin Laundry dans scenes/')
    src_dir = Path(__file__).parent.parent / 'scenes'
    if not src_dir.exists():
        src_dir = Path(__file__).parent / 'scenes'
    if not src_dir.exists():
        log('❌', 'Dossier scenes/ source introuvable dans bundle')
        sys.exit(1)

    dst_dir = root / 'scenes'
    dst_dir.mkdir(exist_ok=True)

    copied = skipped = 0
    for f in sorted(src_dir.glob('ch-affaire-coinlaundry-*.json')):
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
    if 'saga-coinlaundry' in sw or '// Saga Coin Laundry' in sw:
        log('⏭ ', f'SW déjà bumpé pour la saga Coin Laundry (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v149 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
        f"// Saga Coin Laundry « Une enquête ICIJ » — 7 actes · 37 étapes · 111 choix\n"
        f"// saga-coinlaundry — POV journaliste d'investigation Tamedia + ICIJ 37 médias\n"
        f"// Innovation pédagogique : 1ère saga avec POV journaliste (rôle peu présent)\n"
        f"// Cadre légal majeur convoqué :\n"
        f"//   - Art. 17 Cst (liberté presse)\n"
        f"//   - Art. 28a CPP (protection sources — pilier)\n"
        f"//   - Art. 28g CC (droit de réponse aux médias)\n"
        f"//   - Art. 162 CP (violation secret de fonction — source whistleblower)\n"
        f"//   - nLPD (pseudonymisation victimes)\n"
        f"//   - CourEDH Goodwin + Bladet Tromsø + Guja (jurisprudence presse)\n"
        f"//   - Déclaration CSP (Conseil suisse de la presse)\n"
        f"// Doctrine éditoriale transmise : protection sources, droit de réponse,\n"
        f"//   équilibre éditorial, suivi long terme, distinction journaliste/activiste\n"
        f"// Complémentaire à saga Cryptomixer (POV procureure ZH même écosystème)\n"
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
        'ch-affaire-coinlaundry-1-tip-whistleblower.json',
        'ch-affaire-coinlaundry-2-consortium-analyse-data.json',
        'ch-affaire-coinlaundry-3-interviews-victimes.json',
        'ch-affaire-coinlaundry-4-confrontation-plateformes.json',
        'ch-affaire-coinlaundry-5-publication-coordonnee.json',
        'ch-affaire-coinlaundry-6-suites-institutionnelles.json',
        'ch-affaire-coinlaundry-7-bilan-doctrine.json',
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
    print('  CAS-IN Saga « Coin Laundry — Une enquête ICIJ »')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_scenes(root)
    step_2_inject_campaign(root)
    step_3_bump_sw(root)
    step_4_rebuild_meta(root)
    step_5_validate(root)

    print('\n  ✅ Saga déployée.')
    print()
    print('  37 étapes · 111 choix · 7 dilemmes déontologiques majeurs.')
    print('  POV journaliste : 1ère saga CAS-IN avec ce rôle (rôle peu présent).')
    print('  Complémentaire à la saga Cryptomixer (POV magistrat).')
    print('  Doctrine éditoriale transmissible : protection sources, droit de réponse,')
    print('  équilibre éditorial, suivi long terme, distinction journaliste/activiste.')


if __name__ == '__main__':
    main()
