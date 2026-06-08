#!/usr/bin/env python3
"""
apply_saga_donnees_brocante.py — CAS-IN Saga « Vos données partent à la brocante »

CONTEXTE
────────
Saga DFIR 7 actes ancrée dans le journalisme de consommation suisse romand
(ABE — A Bon Entendeur, RTS). Enquête sur le sort des données personnelles
quand des ordinateurs sont revendus d'occasion en CH. 25 ordinateurs achetés
dans 5 sources (Ricardo, Anibis, Realize SA Genève, Reboot Lausanne,
brocantes), analyse forensique par HEIG-VD Yverdon Institut iCoSys.

POV : Mme Sarah Cottet, 34 ans, reporter senior ABE.

INNOVATION
──────────
Première saga CAS-IN à descendre le DFIR au niveau du grand public
consommation. Élargit la palette des médias suisses au catalogue :
- Cryptomixer = procureure ZH (criminalité)
- Coin Laundry = Tamedia (presse écrite investigation)
- Frappes cognitives = RTS investigation (audiovisuel investigation)
- Données brocante = ABE/RTS (service public consommation TV)

ARC NARRATIF
────────────
1. Le tip de la téléspectatrice    — 13-17 oct 2025, pitch + protocole
2. Le protocole forensique         — 28 oct - 1er nov 2025, HEIG-VD + Calmy
3. Les achats sur le terrain       — 4 nov - 20 déc 2025, 25 PC, 5 sources
4. Le laboratoire                  — 6 jan - 12 mars 2026, analyse forensique
5. La découverte critique          — 19 fév - 5 mars 2026, art. 197 CP + SCOCI
6. Droit de réponse + diffusion    — 16 mars - 6 mai 2026, 412K téléspectateurs
7. Bilan et transmission           — 5 mai 2027, doctrine + transmission MAZ

ACTIONS DU SCRIPT
─────────────────
1. Copie les 7 scènes JSON dans scenes/
2. Injecte l'entry saga dans data/campaigns.json (dédup par id)
3. Bump SW v166 → v167 (cumulatif après Cryptomixer + Coin Laundry + Frappes cognitives)
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


SAGA_ID = 'saga-donnees-brocante-abe'
SAGA_ENTRY = {
    "id": SAGA_ID,
    "icon": "📺",
    "title": "Vos données partent à la brocante — Une enquête ABE",
    "subtitle": "Saga 7 actes · POV reporter ABE · DFIR consommation grand public",
    "description": (
        "Saga DFIR ancrée dans le journalisme de consommation suisse romand. ABE "
        "(A Bon Entendeur, RTS) enquête sur le sort des données personnelles quand "
        "des ordinateurs sont revendus d'occasion en Suisse. Un tip d'une téléspectatrice "
        "(Mme M., Vevey, 68 ans) déclenche une investigation de 7 mois : achat-test de "
        "25 ordinateurs dans 5 sources (Ricardo, Anibis particuliers, Realize SA Genève "
        "recyclerie sociale, Reboot Lausanne marchand pro reconditionné, brocantes), "
        "analyse forensique scientifique par HEIG-VD Institut iCoSys (Pr. Pittet), "
        "découverte critique sur 1 disque (alerte art. 197 CP, signalement SCOCI <24h, "
        "coopération autorités), droit de réponse rigoureux pour tous les vendeurs, "
        "diffusion ABE 5 mai 2026 (412K téléspectateurs record), suites institutionnelles "
        "(recommandations PFPDT, consultation nLPD CF, augmentation acteurs sérieux), "
        "transmission doctrinale (article scientifique HEIG-VD, masterclass MAZ Lucerne, "
        "refus opportunités commerciales). POV : Sarah Cottet (34 ans, reporter ABE). "
        "Innovation : première saga CAS-IN à descendre le DFIR au niveau du grand public "
        "consommation. Élargit la palette des médias suisses au catalogue (après Tamedia, "
        "RTS investigation) avec service public TV consommation. Dilemmes éthiques majeurs : "
        "anonymisation nLPD vs pédagogie publique, art. 197 CP en temps réel, achat-test "
        "cadré (art. 179bis CP, ATF 127 IV 122), équilibre éditorial bonnes/mauvaises "
        "pratiques, refus opportunités commerciales post-diffusion (poste Reboot 180K CHF, "
        "livre Slatkine, panels partisans)."
    ),
    "level": "expert",
    "narrative": True,
    "scenes": [
        "ch-affaire-donnees-brocante-1-tip-telespectatrice",
        "ch-affaire-donnees-brocante-2-protocole-heigvd",
        "ch-affaire-donnees-brocante-3-achats-terrain",
        "ch-affaire-donnees-brocante-4-analyse-forensique",
        "ch-affaire-donnees-brocante-5-decouverte-critique",
        "ch-affaire-donnees-brocante-6-droit-reponse-diffusion",
        "ch-affaire-donnees-brocante-7-bilan-transmission"
    ],
    "hook": "Sept actes. Un tip téléspectatrice. 25 ordinateurs achetés. Une découverte qui fait tout basculer. Le DFIR au service du grand public.",
    "kind": "saga"
}


def step_1_copy_scenes(root):
    print('\n[1/5] Copie des 7 scènes Données brocante dans scenes/')
    src_dir = Path(__file__).parent.parent / 'scenes'
    if not src_dir.exists():
        src_dir = Path(__file__).parent / 'scenes'
    if not src_dir.exists():
        log('❌', 'Dossier scenes/ source introuvable dans bundle')
        sys.exit(1)

    dst_dir = root / 'scenes'
    dst_dir.mkdir(exist_ok=True)

    copied = skipped = 0
    for f in sorted(src_dir.glob('ch-affaire-donnees-brocante-*.json')):
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
    if 'saga-donnees-brocante' in sw or '// Saga Données brocante' in sw:
        log('⏭ ', f'SW déjà bumpé pour la saga Données brocante (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v151 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
        f"// Saga Données brocante « Une enquête ABE » — 7 actes · 37 étapes · 111 choix\n"
        f"// saga-donnees-brocante-abe — POV reporter ABE Sarah Cottet (RTS consommation TV)\n"
        f"// Innovation : 1ère saga CAS-IN sur DFIR consommation grand public\n"
        f"// Palette médias CH désormais complète :\n"
        f"//   - Cryptomixer (procureure ZH criminalité)\n"
        f"//   - Coin Laundry (Tamedia presse écrite investigation)\n"
        f"//   - Frappes cognitives (RTS investigation audiovisuel)\n"
        f"//   - Données brocante (ABE service public consommation TV)\n"
        f"// Cadre légal majeur convoqué :\n"
        f"//   - nLPD art. 5-8-31 (anonymisation, sécurité, communication partenaire)\n"
        f"//   - Art. 197 CP (représentations illicites, signalement SCOCI <24h)\n"
        f"//   - Art. 179bis CP (enregistrements clandestins, caméra cachée limite)\n"
        f"//   - Art. 28a CPP (sources, applicable même particuliers)\n"
        f"//   - Art. 28g CC (droit de réponse adapté au public particulier)\n"
        f"//   - LCD art. 3 (achat-test journalistique, ATF 127 IV 122)\n"
        f"//   - CO art. 197-199 (garantie défaut vendeurs)\n"
        f"//   - ATF 124 IV 86 (découverte incidente journaliste, protection conditionnelle)\n"
        f"//   - ATF 138 III 641 (mise en balance presse/personnalité)\n"
        f"//   - ISO/IEC 27037 + NIST SP 800-88 + NCMEC (standards techniques)\n"
        f"// Partenariat académique central : HEIG-VD Institut iCoSys (Pr. Pittet)\n"
        f"// Doctrine éditoriale transmise : DFIR consommation, protocole art. 197 CP,\n"
        f"//   distinction journaliste/communicant, refus opportunités post-enquête\n"
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
        'ch-affaire-donnees-brocante-1-tip-telespectatrice.json',
        'ch-affaire-donnees-brocante-2-protocole-heigvd.json',
        'ch-affaire-donnees-brocante-3-achats-terrain.json',
        'ch-affaire-donnees-brocante-4-analyse-forensique.json',
        'ch-affaire-donnees-brocante-5-decouverte-critique.json',
        'ch-affaire-donnees-brocante-6-droit-reponse-diffusion.json',
        'ch-affaire-donnees-brocante-7-bilan-transmission.json',
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
    print('  CAS-IN Saga « Vos données partent à la brocante » (ABE)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_scenes(root)
    step_2_inject_campaign(root)
    step_3_bump_sw(root)
    step_4_rebuild_meta(root)
    step_5_validate(root)

    print('\n  ✅ Saga déployée.')
    print()
    print('  37 étapes · 111 choix · 7 dossiers DFIR consommation grand public.')
    print('  Innovation : 1ère saga CAS-IN sur DFIR consommation TV service public.')
    print('  Palette médias suisses complète au catalogue.')
    print('  Doctrine transmissible : DFIR consommation + protocole art. 197 CP.')


if __name__ == '__main__':
    main()
