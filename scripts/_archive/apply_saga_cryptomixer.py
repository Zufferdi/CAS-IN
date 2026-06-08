#!/usr/bin/env python3
"""
apply_saga_cryptomixer.py — CAS-IN Saga « Le Mixeur de la Bahnhofstrasse »

CONTEXTE
────────
Saga DFIR 7 actes inspirée du démantèlement réel de Cryptomixer.io par les
autorités zurichoises (24-28 novembre 2025) en coordination avec le BKA
Francfort et Europol/Eurojust. 23 millions CHF en Bitcoin saisis, 12 To de
données, 1.3 milliard EUR blanchis depuis 2016 via 340'000 transactions de
mixing.

POV : Procureure Me Nadja Brunner-Tobler (MP Zurich, section Wirtschafts- und
Cyberkriminalität). Codename interne : OPERATION LIMMAT-MIX.

ARC NARRATIF
────────────
1. Le signalement Chainalysis      — 17 fév 2025, qualification rapport CTI
2. L'infrastructure à Glattbrugg   — 11 mars 2025, LSCPT + chaîne réquisitions
3. Les opérateurs derrière l'ombre — 6 mai 2025, triangulation attribution
4. Opération LIMMAT-MIX            — 13 nov 2025, perquisition coordonnée 4 sites
5. 12 téraoctets d'histoire        — 16 déc 2025, analyse post-saisie + victimes
6. Rendre aux victimes             — 14 janv 2026, EIMP art. 74a + allocation
7. Le procès et la doctrine        — 14 sept 2026, Bezirksgericht + précédent

PERSONNAGES PERSISTANTS
───────────────────────
- Procureure Me Nadja Brunner-Tobler (MP-ZH) — protagoniste
- Cheffe section Mme Carla Albertini (MP-ZH)
- Oberst Tobias Wehrli (Stadtpolizei Zürich Cybercrime)
- Inspector Janek Vogel (blockchain forensics)
- Sgt-Major Petra Kuhn (perquisitions cyber)
- Marcus Reinhardt (Chainalysis Government Solutions)
- Oberstaatsanwalt Klaus Dietrich (ZIT Frankfurt)
- Prof. Lorenz (statisticien UZH, expertise indépendante)
- Me Sofia Pereira-Lemos (Eurojust)
- Mme Karin Strebel (fedpol DPC EIMP)

SUSPECTS
────────
- Mihail Petrov (BG, homme de paille CH formel HHS AG Zoug)
- M. Reichmuth (étudiant ZH, 2ème homme de paille flux financiers)
- Mathias Brandt (D, opérateur technique principal, pseudo 'kryptoarch')
- Yaroslav Vlasenko (UA, opérateur Monero cluster C, identifié par ZIT)

CADRE LÉGAL CONVOQUÉ
────────────────────
- Art. 305bis CP (blanchiment, dol direct vs éventuel)
- Art. 305bis al. 2 CP (aggravantes : bande, métier)
- Art. 305ter CP (défaut de vigilance)
- Art. 260ter CP (organisation criminelle — qualification réservée)
- LBA (Loi sur le blanchiment d'argent)
- Art. 22-24 CPP (compétence ratione loci en matière cyber)
- Art. 162 CPP (expertise privée — recevabilité Chainalysis)
- Art. 182 CPP (recours expert)
- Art. 197 CPP (proportionnalité mesures contrainte)
- Art. 244+246+263+266 CPP (perquisition + séquestre)
- Art. 269 CPP + LSCPT (surveillance correspondance)
- Art. 273 CPP (métadonnées télécom)
- Art. 284 CPP (investigation discrète)
- Art. 70-73 CP (confiscation + allocation lésé)
- Art. 71 CP (créance compensatrice)
- Art. 74a EIMP (remise valeurs aux États étrangers)
- Art. 118 CPP (constitution partie plaignante)
- Art. 122 CPP (conclusions civiles)
- ISO/IEC 27037 (acquisition forensique)
- RFC 3227 (hiérarchie volatilité — capture RAM avant arrêt)
- Convention Budapest art. 25-26 (coopération internationale)
- Eurojust JIT (Joint Investigation Team)
- ATF 142 IV 175 (organisation criminelle critères)
- ATF 145 IV 335 (dol éventuel blanchiment)
- ATF 143 IV 264 (allocation lésé international)
- ATF 144 IV 277 (whistleblower atténuation)

ACTIONS DU SCRIPT
─────────────────
1. Copie les 7 scènes JSON dans scenes/
2. Injecte l'entry saga dans data/campaigns.json (dédup par id)
3. Bump SW v163 → v164
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


SAGA_ID = 'saga-cryptomixer-limmat-mix'
SAGA_ENTRY = {
    "id": SAGA_ID,
    "icon": "🪙",
    "title": "Le Mixeur de la Bahnhofstrasse",
    "subtitle": "Saga 7 actes · POV procureure ZH · Démantèlement Cryptomixer.io",
    "description": (
        "Saga DFIR ancrée dans le démantèlement réel de Cryptomixer.io par les autorités "
        "zurichoises en novembre 2025 (opération conjointe avec BKA Francfort, Europol et "
        "Eurojust). 23 millions CHF en Bitcoin saisis sur 3 serveurs à Glattbrugg, "
        "12 téraoctets de données, 1.3 milliard EUR blanchis depuis 2016 via 340'000 "
        "transactions. POV : procureure zurichoise Me Nadja Brunner-Tobler (MP-ZH section "
        "criminalité économique numérique). 18 mois d'enquête : signalement Chainalysis, "
        "identification infrastructure (LSCPT), attribution des opérateurs (triangulation "
        "Brandt+Petrov+Reichmuth+Vlasenko), perquisition coordonnée 4 sites CH-D, saisie "
        "crypto live forensics (RFC 3227, ISO 27037), analyse 12 To post-saisie, "
        "restitution multi-juridictionnelle aux victimes ransomware (47 incidents tracés, "
        "art. 70-73 CP + art. 74a EIMP), procès Bezirksgericht ZH et précédent doctrinal. "
        "Tensions juridiques : compétence ratione loci cyber, expertise blockchain (art. "
        "162 CPP), dol éventuel vs direct (art. 305bis al. 2 CP), nLPD utilisateurs "
        "légitimes vs criminels. Création du précédent suisse pour les opérations crypto."
    ),
    "level": "expert",
    "narrative": True,
    "scenes": [
        "zh-affaire-cryptomixer-1-signalement-chainalysis",
        "zh-affaire-cryptomixer-2-identification-infrastructure",
        "zh-affaire-cryptomixer-3-enquete-patrimoniale",
        "zh-affaire-cryptomixer-4-perquisition-coordonnee",
        "zh-affaire-cryptomixer-5-analyse-post-saisie",
        "zh-affaire-cryptomixer-6-eimp-restitution",
        "zh-affaire-cryptomixer-7-proces-doctrine"
    ],
    "hook": "Sept actes. 1,3 milliard EUR blanchis. 23 millions saisis. 47 victimes traçables. Un précédent doctrinal à poser.",
    "kind": "saga"
}


def step_1_copy_scenes(root):
    print('\n[1/5] Copie des 7 scènes Cryptomixer dans scenes/')
    src_dir = Path(__file__).parent.parent / 'scenes'
    if not src_dir.exists():
        src_dir = Path(__file__).parent / 'scenes'
    if not src_dir.exists():
        log('❌', 'Dossier scenes/ source introuvable dans bundle')
        sys.exit(1)

    dst_dir = root / 'scenes'
    dst_dir.mkdir(exist_ok=True)

    copied = skipped = 0
    for f in sorted(src_dir.glob('zh-affaire-cryptomixer-*.json')):
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
    print('\n[3/5] Bump SW v163 → v164')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if 'saga-cryptomixer' in sw or '// Saga Cryptomixer' in sw:
        log('⏭ ', f'SW déjà bumpé pour la saga Cryptomixer (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v148 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
        f"// Saga Cryptomixer « Le Mixeur de la Bahnhofstrasse » — 7 actes · 40 étapes · 120 choix\n"
        f"// saga-cryptomixer — POV procureure ZH, démantèlement Cryptomixer.io nov 2025\n"
        f"// Cadre légal majeur convoqué :\n"
        f"//   - art. 305bis CP (blanchiment + aggravantes al. 2)\n"
        f"//   - art. 70-73 CP (confiscation + allocation lésé)\n"
        f"//   - art. 74a EIMP (remise aux États étrangers)\n"
        f"//   - LSCPT (réquisitions hébergeurs)\n"
        f"//   - Convention Budapest art. 25-26 (coopération internationale)\n"
        f"//   - Eurojust JIT (équipe commune d'enquête)\n"
        f"//   - ISO/IEC 27037 + RFC 3227 (chaîne de custody crypto)\n"
        f"// Précédent doctrinal CH créé : compétence cyber, expertise blockchain, saisie crypto\n"
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
        'zh-affaire-cryptomixer-1-signalement-chainalysis.json',
        'zh-affaire-cryptomixer-2-identification-infrastructure.json',
        'zh-affaire-cryptomixer-3-enquete-patrimoniale.json',
        'zh-affaire-cryptomixer-4-perquisition-coordonnee.json',
        'zh-affaire-cryptomixer-5-analyse-post-saisie.json',
        'zh-affaire-cryptomixer-6-eimp-restitution.json',
        'zh-affaire-cryptomixer-7-proces-doctrine.json',
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
    print('  CAS-IN Saga « Le Mixeur de la Bahnhofstrasse » (Cryptomixer)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_scenes(root)
    step_2_inject_campaign(root)
    step_3_bump_sw(root)
    step_4_rebuild_meta(root)
    step_5_validate(root)

    print('\n  ✅ Saga déployée.')
    print()
    print('  40 étapes · 120 choix · 7 dossiers d\'instruction.')
    print('  Précédent doctrinal CH pour opérations crypto.')
    print('  Méthodologie LIMMAT-MIX transmissible.')


if __name__ == '__main__':
    main()
