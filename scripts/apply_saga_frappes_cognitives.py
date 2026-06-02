#!/usr/bin/env python3
"""
apply_saga_frappes_cognitives.py — CAS-IN Saga « Frappes cognitives »

CONTEXTE
────────
Saga DFIR 7 actes inspirée de l'enquête internationale OCCRP « Leaked Documents
Reveal Russian 'Cognitive Strikes' Against the West » (24 mai 2026, Delfi
Estonia + OCCRP + Le Monde + SZ + Profil + autres). Documents fuités de la
Social Design Agency (SDA) russe, pilotée par l'Administration présidentielle.

POV : Mme Camille Joris, 41 ans, journaliste investigation RTS, russophone,
basée à Genève. Codename source SRC : helvetia-eyes-open.

INNOVATION
──────────
2ème saga CAS-IN avec POV journaliste, mais service public audiovisuel (RTS)
au lieu de presse écrite (Tamedia / Coin Laundry). Complémentaire à Coin
Laundry — personnages partagés (Sara Rodríguez OCCRP, Lara Kessler Tamedia,
Me Studer, Pr. Trebbe UNIL). Sujet nouveau : guerre cognitive, opérations
d'influence étatique étrangère, art. 271 CP.

ARC NARRATIF
────────────
1. Le leak arrive en Suisse        — 19 mai 2026, J-5 OCCRP, intégration consortium
2. Reconnaître la signature        — 20-23 mai, analyse rétrospective NoName/RT/Baud
3. La source au sein du SRC        — 23-26 mai, art. 86 LRens, helvetia-eyes-open
4. Zone grise opinion leaders     — 25-29 mai, Baud + Caron fictif + Forum
5. Le faux drapeau ukrainien       — 8-10 juin, incident synagogue GE
6. Les suites institutionnelles    — 18 juin → 7 nov, MPC + SECO + CN audition
7. Le bilan et la doctrine         — 25 mai 2027, transmission profession

ACTIONS DU SCRIPT
─────────────────
1. Copie les 7 scènes JSON dans scenes/
2. Injecte l'entry saga dans data/campaigns.json (dédup par id)
3. Bump SW v165 → v166 (cumulatif après Cryptomixer + Coin Laundry)
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


SAGA_ID = 'saga-frappes-cognitives-rts'
SAGA_ENTRY = {
    "id": SAGA_ID,
    "icon": "🎯",
    "title": "Frappes cognitives — Une enquête RTS",
    "subtitle": "Saga 7 actes · POV journaliste RTS · Guerre cognitive russe en Suisse",
    "description": (
        "Saga DFIR ancrée dans l'enquête OCCRP « Leaked Documents Reveal Russian 'Cognitive "
        "Strikes' Against the West » (24 mai 2026, Delfi Estonia + Le Monde + SZ + Profil + "
        "Inside Story + Dossier Russie + Radio Svoboda + Shomrim Israel). Documents fuités de "
        "la Social Design Agency russe pilotée par l'Administration présidentielle (Sofia "
        "Zakharova, Ilya Gambashidze, Sergei Kiriyenko). Opérations documentées : têtes de "
        "cochon mosquées Paris septembre 2025 (3 Serbes condamnés), synagogues vertes Paris "
        "mai 2025, squelettes Brandenburg, stickers arméniens, voitures « Be greener » "
        "Allemagne, plans 2026 « Mitteleuropa » incluant la Suisse alémanique. POV : "
        "journaliste d'investigation Mme Camille Joris (RTS, 41 ans, ex-AFP Moscou, "
        "russophone, basée à Genève). 12 mois de l'enquête : intégration consortium OCCRP "
        "en J-5, analyse rétrospective incidents CH 2024-2026 (cyberattaques NoName janv "
        "2025 Genève/Vevey/BCV, multiplication par 10 RT couverture CH, sanctions UE "
        "Jacques Baud 16 déc 2025, tags antisémites Eaux-Vives nov 2025), source SRC "
        "helvetia-eyes-open (art. 86 LRens plus sévère qu'art. 162 CP), traitement opinion "
        "leaders (Baud fait juridique + M. Caron fictif amplifié 47× TASS), incident faux "
        "drapeau synagogue Genève 8 juin 2026 (réplique du pattern de Gaulle SDA), "
        "déclaration conjointe historique CIG-AUSR, MPC instruction art. 271 CP in absentia, "
        "alignement sanctions SECO sur UE, audition Commission politique sécurité CN, "
        "doctrine éditoriale guerre cognitive transmise via article Recherche en "
        "Communication co-signé EPFL+UNIL. Innovation : 2ème saga CAS-IN POV journaliste "
        "mais service public audiovisuel RTS (complémentaire Tamedia/Coin Laundry)."
    ),
    "level": "expert",
    "narrative": True,
    "scenes": [
        "ch-affaire-frappes-cognitives-1-leak-arrive",
        "ch-affaire-frappes-cognitives-2-reconnaitre-signature",
        "ch-affaire-frappes-cognitives-3-source-src",
        "ch-affaire-frappes-cognitives-4-opinion-leaders",
        "ch-affaire-frappes-cognitives-5-incident-geneve",
        "ch-affaire-frappes-cognitives-6-publication-suites",
        "ch-affaire-frappes-cognitives-7-bilan-doctrine"
    ],
    "hook": "Sept actes. Un leak qui révèle l'invisible. Un incident qui éclate. La doctrine du journalisme face à la guerre cognitive.",
    "kind": "saga"
}


def step_1_copy_scenes(root):
    print('\n[1/5] Copie des 7 scènes Frappes cognitives dans scenes/')
    src_dir = Path(__file__).parent.parent / 'scenes'
    if not src_dir.exists():
        src_dir = Path(__file__).parent / 'scenes'
    if not src_dir.exists():
        log('❌', 'Dossier scenes/ source introuvable dans bundle')
        sys.exit(1)

    dst_dir = root / 'scenes'
    dst_dir.mkdir(exist_ok=True)

    copied = skipped = 0
    for f in sorted(src_dir.glob('ch-affaire-frappes-cognitives-*.json')):
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
    if 'saga-frappes-cognitives' in sw or '// Saga Frappes cognitives' in sw:
        log('⏭ ', f'SW déjà bumpé pour la saga Frappes cognitives (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v150 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
        f"// Saga Frappes cognitives « Une enquête RTS » — 7 actes · 36 étapes · 108 choix\n"
        f"// saga-frappes-cognitives-rts — POV journaliste RTS investigation Camille Joris\n"
        f"// Innovation : 2ème saga POV journaliste (après Coin Laundry/Tamedia)\n"
        f"//   mais service public audiovisuel RTS au lieu de presse écrite\n"
        f"// Sujet nouveau au catalogue : guerre cognitive et opérations d'influence étatique\n"
        f"// Cadre légal majeur convoqué :\n"
        f"//   - Art. 271 CP (actes étatiques exécutés sans droit, compétence MPC art. 23 CPP)\n"
        f"//   - Art. 261bis CP (discrimination raciale, religieuse — incidents communautaires)\n"
        f"//   - LRens art. 86 (secret service renseignement, jusqu'à 3 ans, > art. 162 CP)\n"
        f"//   - LEmb art. 1 (alignement sanctions SECO sur UE — SDA/Zakharova/Gambashidze)\n"
        f"//   - Art. 28a CPP (sources, application renforcée pour helvetia-eyes-open)\n"
        f"//   - ATF 144 IV 277 (whistleblower atténuation très restrictive en renseignement)\n"
        f"//   - CourEDH Guja c. Moldavie (protection whistleblower fonction publique stricte)\n"
        f"//   - LParl art. 153 (audition Commission politique sécurité CN cadrée)\n"
        f"// Inspirée enquête réelle OCCRP 24 mai 2026 (Delfi Estonia + Le Monde + SZ + Profil)\n"
        f"// Doctrine éditoriale transmise : distinction opinion/amplification, doctrine faux\n"
        f"//   drapeau, classification niveaux de confiance, coordination communautaire temps réel\n"
        f"// Personnages partagés avec Coin Laundry : Sara Rodríguez OCCRP, Lara Kessler\n"
        f"//   Tamedia, Me Eveline Studer, Pr. Sabine Trebbe UNIL (continuité narrative)\n"
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
        'ch-affaire-frappes-cognitives-1-leak-arrive.json',
        'ch-affaire-frappes-cognitives-2-reconnaitre-signature.json',
        'ch-affaire-frappes-cognitives-3-source-src.json',
        'ch-affaire-frappes-cognitives-4-opinion-leaders.json',
        'ch-affaire-frappes-cognitives-5-incident-geneve.json',
        'ch-affaire-frappes-cognitives-6-publication-suites.json',
        'ch-affaire-frappes-cognitives-7-bilan-doctrine.json',
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
    print('  CAS-IN Saga « Frappes cognitives — Une enquête RTS »')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_scenes(root)
    step_2_inject_campaign(root)
    step_3_bump_sw(root)
    step_4_rebuild_meta(root)
    step_5_validate(root)

    print('\n  ✅ Saga déployée.')
    print()
    print('  36 étapes · 108 choix · 7 dossiers d\'investigation journalistique.')
    print('  POV journaliste service public audiovisuel RTS (innovation).')
    print('  Sujet nouveau au catalogue : guerre cognitive État-à-État.')
    print('  Cadre légal innovant : art. 271 CP + LRens art. 86 + sanctions SECO.')
    print('  Continuité narrative avec saga Coin Laundry (personnages partagés).')


if __name__ == '__main__':
    main()
