#!/usr/bin/env python3
"""
apply_saga_g7.py — CAS-IN Saga « No-G7 — La traque numérique »

CONTEXTE
────────
Saga DFIR 7 actes ancrée dans le contexte réel du G7 d'Évian (15-17 juin 2026)
et de la manifestation No-G7 autorisée à Genève le 14 juin 2026 par le Conseil
d'État genevois (autorisation du 27 mai 2026).

Inspectrice principale Léa Robert (BCFI Police cantonale GE) mène 7 enquêtes
parallèles à l'approche du sommet :

  1. Tract anonyme OSINT (J-14, 1er juin) — distinction art. 22 Cst / 260 CP
  2. Canal Telegram (J-12, 3 juin)        — limite OSINT vs art. 285a CPP
  3. DDoS sur ge.ch (J-5, 10 juin)        — attribution NoName057(16)
  4. Leak POSEC (J-3, 12 juin)            — art. 320 CP vs art. 28a CPP
  5. SMS Blaster (J-1, 13 juin)           — IMSI catcher hostile, mercenaires
  6. Drone Cornavin (J-Day, 14 juin)      — espace aérien, presse, libertés
  7. Bilan et PV (J+2, 16 juin)           — synthèse sans amalgame

PERSONNAGES PERSISTANTS
───────────────────────
- Inspectrice Léa Robert (BCFI)
- Commissaire Yves Krähenbühl (chef BCFI)
- Procureure Me Sandrine Lavanchy (MP-GE)
- Analyste OSINT Patrick Aebischer
- Admin systèmes Tania Pereira
- Juriste cantonale Madeleine Roduit
- Commandante Bonfanti (police GE)
- Pierre Magnin (RSSI État GE)
- Élodie Brunner (Switch-CERT)
- Sara Voutaz (OFCS/NCSC.ch)
- Lt Roland Hofer (officier liaison armée)
- Mauricio Sandoval (OFCOM)
- Lt Mouron (chef équipe intervention)

ACTIONS
───────
1. Copie les 7 scènes JSON dans scenes/
2. Injecte l'entry saga dans data/campaigns.json (dédup par id)
3. Bump SW v162 → v163
4. Régénère search-index, counts, README

IDEMPOTENT
──────────
Skip si scènes déjà présentes (par id), skip si entry saga déjà dans campaigns.
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


SAGA_ID = 'saga-nog7-geneve-traque-numerique'
SAGA_ENTRY = {
    "id": SAGA_ID,
    "icon": "🌐",
    "title": "No-G7 — La traque numérique",
    "subtitle": "Saga 7 actes · Enquête cyber G7 Évian / manifestation Genève juin 2026",
    "description": (
        "Saga DFIR ancrée dans le contexte réel du G7 d'Évian (15-17 juin 2026) "
        "et de la manifestation No-G7 autorisée à Genève le 14 juin 2026 par le Conseil "
        "d'État genevois (autorisation du 27 mai 2026). L'inspectrice Léa Robert (BCFI) "
        "mène 7 enquêtes parallèles à l'approche du sommet : OSINT sur un tract anonyme, "
        "surveillance d'un canal Telegram dans le respect de l'art. 285a CPP, attribution "
        "d'un DDoS sur ge.ch (NoName057(16) attribution moyenne confiance), leak interne "
        "via watermark documentaire sans toucher au journal (art. 28a CPP), démantèlement "
        "d'un SMS Blaster de mercenaires balkaniques visant à saboter la manifestation, "
        "neutralisation d'un drone non autorisé au-dessus du cortège (art. 91 Loi aviation), "
        "et synthèse finale au MP-GE. Tension constante : protéger l'exercice constitutionnel "
        "du droit de manifester (art. 22 Cst) tout en poursuivant les infractions effectives, "
        "sans amalgame, sans surveillance politique illégitime (art. 4 LRens). "
        "Personnages : Léa Robert (BCFI), Yves Krähenbühl (commandement), procureure Lavanchy, "
        "commandante Bonfanti, Sara Voutaz (OFCS/NCSC), juriste Madeleine Roduit. "
        "34 étapes décisionnelles · 102 choix · 7 dossiers d'enquête distincts."
    ),
    "level": "expert",
    "narrative": True,
    "scenes": [
        "ge-affaire-nog7-1-tract-osint",
        "ge-affaire-nog7-2-canal-telegram",
        "ge-affaire-nog7-3-ddos-gech",
        "ge-affaire-nog7-4-leak-interne",
        "ge-affaire-nog7-5-sms-blaster",
        "ge-affaire-nog7-6-drone-cornavin",
        "ge-affaire-nog7-7-bilan-pv"
    ],
    "hook": "Sept actes. Sept dossiers d'infraction distincts. Sept fois où la ligne rouge a failli être franchie.",
    "kind": "saga"
}


def step_1_copy_scenes(root):
    print('\n[1/5] Copie des 7 scènes dans scenes/')
    src_dir = Path(__file__).parent.parent / 'scenes'
    if not src_dir.exists():
        src_dir = Path(__file__).parent / 'scenes'
    if not src_dir.exists():
        log('❌', 'Dossier scenes/ source introuvable dans bundle')
        sys.exit(1)

    dst_dir = root / 'scenes'
    dst_dir.mkdir(exist_ok=True)

    copied = 0
    skipped = 0
    for f in sorted(src_dir.glob('ge-affaire-nog7-*.json')):
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

    # Calculer ordre
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
    print('\n[3/5] Bump SW v162 → v163')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if 'saga-nog7' in sw or '// Saga No-G7' in sw:
        log('⏭ ', f'SW déjà bumpé pour la saga (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v147 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
        f"// Saga No-G7 « La traque numérique » — 7 actes · 34 étapes · 102 choix\n"
        f"// saga-nog7 — Enquête cyber G7 Évian / manif Genève juin 2026\n"
        f"// 7 dossiers d'infraction distincts du droit suisse :\n"
        f"//   - art. 22 Cst (liberté de manifester) — tract et canal Telegram\n"
        f"//   - art. 144bis CP (DDoS) — NoName057(16)\n"
        f"//   - art. 320 CP (secret de fonction) — leak whistleblower\n"
        f"//   - art. 179septies CP + LTC 53 — SMS Blaster mercenaires\n"
        f"//   - art. 91 Loi aviation + OACS — drone journaliste\n"
        f"// Tensions constitutionnelles : art. 17/22/23 Cst vs sécurité publique\n"
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
    # Toutes les scènes présentes
    scenes_dir = root / 'scenes'
    expected = [
        'ge-affaire-nog7-1-tract-osint.json',
        'ge-affaire-nog7-2-canal-telegram.json',
        'ge-affaire-nog7-3-ddos-gech.json',
        'ge-affaire-nog7-4-leak-interne.json',
        'ge-affaire-nog7-5-sms-blaster.json',
        'ge-affaire-nog7-6-drone-cornavin.json',
        'ge-affaire-nog7-7-bilan-pv.json',
    ]
    for fn in expected:
        p = scenes_dir / fn
        if p.exists():
            log('✅', f'Scène présente : {fn}')
        else:
            log('❌', f'Scène manquante : {fn}')

    # Entry campaigns
    cjs = json.load(open(root / 'data' / 'campaigns.json'))
    camps = cjs if isinstance(cjs, list) else cjs.get('campaigns', cjs)
    if any(c.get('id') == SAGA_ID for c in camps):
        log('✅', 'Entry saga présente dans campaigns.json')
    else:
        log('❌', 'Entry saga manquante')


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN Saga « No-G7 — La traque numérique » (7 actes)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_scenes(root)
    step_2_inject_campaign(root)
    step_3_bump_sw(root)
    step_4_rebuild_meta(root)
    step_5_validate(root)

    print('\n  ✅ Saga déployée.')
    print()
    print('  34 étapes décisionnelles · 102 choix · 7 dossiers distincts.')
    print('  Tensions constitutionnelles tenues : art. 17/22/23 Cst / nLPD / LRens.')
    print('  Couverture pédagogique : OSINT, threat intel, DDoS, leak forensics,')
    print('  IMSI catcher, drone forensics, communication crise, EIMP.')


if __name__ == '__main__':
    main()
