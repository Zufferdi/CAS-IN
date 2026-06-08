#!/usr/bin/env python3
"""
apply_saga_pegasus_mobiles.py — CAS-IN Saga « Le silence des téléphones »

CONTEXTE
────────
Saga DFIR 7 actes ancrée dans le journalisme-DFIR (journaliste-technicien mobile
forensics). POV : Mme Aline Béguin, 38 ans, RTS investigation tech, formation
hybride IFP Paris (journalisme) + EPFL (cybersécurité). Une des rares journalistes
CH maîtrisant Mobile Verification Toolkit (MVT) d'Amnesty Tech.

Trame : Genève juin 2026, Apple Threat Notifications envoyées à 4 personnalités
internationales. Access Now Berlin contacte Aline. Enquête 18 mois sur 10 cibles
(CICR, ONU, opposants exilés). Méthodologie : Aline opère MVT + Amnesty Tech
Berlin double-regard + Citizen Lab Toronto triple vérification. Confrontation
NSO Group + 6 États présumés. Publication consortium mondial décembre 2026.

INNOVATION
──────────
Première saga CAS-IN avec POV journaliste-DFIR (profil hybride). Aline opère elle-
même MVT, pas de partenaire académique-écran. Le DFIR est sa compétence propre.
Profil en croissance internationale (Bellingcat, NYT Visual Investigations,
Forensic Architecture style). Premier saga sur Pegasus en CH avec cadre légal
art. 271 CP + Convention de Vienne 1961 art. 27.

ARC NARRATIF
────────────
1. Apple alerte Genève              — Juin 2026, Access Now, départ Berlin Amnesty
2. MVT, IoCs et méthodologie        — Juin-août 2026, analyse 10 backups iOS
3. Attribution et géopolitique      — Août-sept 2026, 3 niveaux + Mishcon NSO
4. Briefer les cibles               — Sept-oct 2026, doctrine victim-first
5. Confronter les États             — Nov 2026, 6 États + DFAE coordination
6. Publication et suites            — 5 déc 2026, consortium mondial + MPC instruction
7. Doctrine du journalisme-DFIR     — Déc 2027, refus Cellebrite + transmission

ACTIONS DU SCRIPT
─────────────────
1. Copie les 7 scènes JSON dans scenes/
2. Injecte l'entry saga dans data/campaigns.json (dédup par id)
3. Bump SW v167 → v168 (cumulatif après Cryptomixer + Coin Laundry + Frappes cognitives + Données brocante)
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


SAGA_ID = 'saga-pegasus-mobiles-rts'
SAGA_ENTRY = {
    "id": SAGA_ID,
    "icon": "📱",
    "title": "Le silence des téléphones — Une enquête RTS",
    "subtitle": "Saga 7 actes · POV journaliste-DFIR RTS · Pegasus et surveillance ciblée en Suisse",
    "description": (
        "Saga DFIR ancrée dans le journalisme-DFIR (journaliste-technicien mobile forensics). "
        "Inspirée méthodologies Citizen Lab Toronto + Amnesty International Security Lab "
        "Berlin (Mobile Verification Toolkit MVT 2021) + Forbidden Stories Pegasus Project. "
        "Genève juin 2026 : Apple envoie des Threat Notifications à 4 personnalités basées "
        "à Genève (avocate CICR dossier Sahel, fonctionnaire ONU Droits humains, militant "
        "ouïghour exilé, journaliste turque réfugiée). Access Now Digital Security Helpline "
        "Berlin contacte RTS, plus précisément Mme Aline Béguin (38 ans, profil rare "
        "journaliste-DFIR : Master journalisme IFP Paris 2010 + Master cybersécurité "
        "EPFL 2018, maîtrise Mobile Verification Toolkit). Enquête 18 mois sur 10 cibles "
        "élargies (4 internationales + 6 opposants régionaux exilés en CH). Méthodologie : "
        "Aline opère MVT elle-même + Amnesty Tech Berlin (Donncha Ó Cearbhaill co-auteur MVT) "
        "vérifie double-regard + Citizen Lab Toronto (Bill Marczak) triple vérification pour "
        "findings critiques. Attribution multi-niveaux : 6 cibles Pegasus high confidence "
        "(Maroc PEGA003, Turquie PEGA022, Saudi, Azerbaïdjan PEGA009, EAU/Saudi ambiguïté, "
        "État NSO non identifié), 2 cibles autres spyware (Predator/Intellexa, Hermit/RCS "
        "Lab attribué Espagne), 1 LOW non concluant, 1 NO FINDINGS (anti-forensic probable). "
        "Confrontation NSO Group via Mishcon de Reya (Me James Libson) + 6 États via missions "
        "permanentes Genève. Coordination DFAE (Pascal Wormser Division Sécurité humaine) "
        "sans céder indépendance. Publication consortium mondial 5 décembre 2026 (RTS + Le "
        "Temps + Le Monde + Süddeutsche Zeitung + El País + Daraj + Reuters + rapports "
        "techniques Citizen Lab + Amnesty Tech simultanés). Suites institutionnelles CH : MPC "
        "instruction d'office art. 271 CP + 3 plaintes individuelles, SECO alignement "
        "sanctions UE NSO, Parlement consultation LRens, CICR audit complet flotte mobile. "
        "Doctrine journalisme-DFIR formalisée : article scientifique conjoint Béguin+"
        "Ó Cearbhaill+Marczak (Digital Investigation Journal juillet 2027), masterclass MAZ "
        "Lucerne, transmission UNIL/EPFL. Refus opportunités commerciales (Cellebrite 180K "
        "USD, livre Slatkine, panels partisans). Doctrine victim-first absolue (BCK-007 "
        "saoudienne anonyme protégée 1 an post-publication). Innovation : 1ère saga POV "
        "journaliste-DFIR (profil hybride compétence technique propre). Élargit catalogue "
        "médias CH (5ème saga journaliste après Tamedia + 2 RTS + ABE)."
    ),
    "level": "expert",
    "narrative": True,
    "scenes": [
        "ch-affaire-pegasus-mobiles-1-apple-notification",
        "ch-affaire-pegasus-mobiles-2-mvt-analyse",
        "ch-affaire-pegasus-mobiles-3-attribution-etat",
        "ch-affaire-pegasus-mobiles-4-cibles-briefing",
        "ch-affaire-pegasus-mobiles-5-confrontation-etats",
        "ch-affaire-pegasus-mobiles-6-publication-suites",
        "ch-affaire-pegasus-mobiles-7-bilan-doctrine"
    ],
    "hook": "Sept actes. Apple alerte. 10 téléphones examinés. Six États mis en cause. La doctrine du journalisme-DFIR contre les spywares mercenaires.",
    "kind": "saga"
}


def step_1_copy_scenes(root):
    print('\n[1/5] Copie des 7 scènes Pegasus mobiles dans scenes/')
    src_dir = Path(__file__).parent.parent / 'scenes'
    if not src_dir.exists():
        src_dir = Path(__file__).parent / 'scenes'
    if not src_dir.exists():
        log('❌', 'Dossier scenes/ source introuvable dans bundle')
        sys.exit(1)

    dst_dir = root / 'scenes'
    dst_dir.mkdir(exist_ok=True)

    copied = skipped = 0
    for f in sorted(src_dir.glob('ch-affaire-pegasus-mobiles-*.json')):
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
    if 'saga-pegasus-mobiles' in sw or '// Saga Pegasus mobiles' in sw:
        log('⏭ ', f'SW déjà bumpé pour la saga Pegasus mobiles (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v152 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
        f"// Saga Pegasus mobiles « Le silence des téléphones » — 7 actes · 35 étapes · 105 choix\n"
        f"// saga-pegasus-mobiles-rts — POV journaliste-DFIR Aline Béguin (RTS investigation tech)\n"
        f"// Innovation : 1ère saga POV journaliste-DFIR (profil hybride EPFL+IFP)\n"
        f"// Aline opère MVT (Mobile Verification Toolkit) elle-même + Amnesty Tech Berlin\n"
        f"//   vérifie double-regard + Citizen Lab Toronto triple vérification critique\n"
        f"// Élargit palette médias CH (5ème saga journaliste) :\n"
        f"//   - Cryptomixer (procureure ZH criminalité)\n"
        f"//   - Coin Laundry (Tamedia presse écrite investigation)\n"
        f"//   - Frappes cognitives (RTS investigation audiovisuel)\n"
        f"//   - Données brocante (ABE service public consommation TV)\n"
        f"//   - Pegasus mobiles (RTS journaliste-DFIR profil hybride)\n"
        f"// Cadre légal majeur convoqué :\n"
        f"//   - Art. 271 CP (actes étatiques sans droit, compétence MPC art. 23 CPP)\n"
        f"//   - Art. 272-274 CP (espionnage politique/économique/militaire)\n"
        f"//   - Art. 28a CPP (sources, applicable même à journaliste-DFIR opérant techniquement)\n"
        f"//   - Convention de Vienne 1961 art. 27 (inviolabilité correspondance diplomatique)\n"
        f"//   - Accord siège ONU + CICR (privilèges et immunités, obligations CH)\n"
        f"//   - nLPD art. 5-8 (protection données personnelles cibles)\n"
        f"//   - LRens art. 6 (mission SRC détection menaces)\n"
        f"//   - LEmb art. 1 (sanctions SECO alignées UE NSO)\n"
        f"//   - ATF 124 IV 86 (découverte incidente journaliste, protection conditionnelle)\n"
        f"//   - ATF 138 III 641 (mise en balance presse/personnalité)\n"
        f"//   - CourEDH Bladet Tromsø (bonne foi journalistique)\n"
        f"//   - Standards techniques : ISO/IEC 27037 + RFC 3227 + STIX2 + MVT Amnesty\n"
        f"// Partenariats internationaux : Amnesty Tech Berlin (Donncha Ó Cearbhaill, co-auteur MVT)\n"
        f"//   + Citizen Lab Toronto (Bill Marczak) + Access Now Helpline (Etilda Gjonaj)\n"
        f"// Inspirée Pegasus Project 2021 (Forbidden Stories) + Crypto AG 2020 (Tamedia/SRF) +\n"
        f"//   méthodologie attribution Citizen Lab + iVerify cas CH 2022\n"
        f"// Doctrine victim-first absolue : 10 cibles briefées individuellement, consentements\n"
        f"//   respectés (BCK-007 saoudienne anonyme protégée 1 an post-publication)\n"
        f"// 6 États présumés simultanément : Maroc + Turquie + Saudi + Azerbaïdjan + Espagne + EAU\n"
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
        'ch-affaire-pegasus-mobiles-1-apple-notification.json',
        'ch-affaire-pegasus-mobiles-2-mvt-analyse.json',
        'ch-affaire-pegasus-mobiles-3-attribution-etat.json',
        'ch-affaire-pegasus-mobiles-4-cibles-briefing.json',
        'ch-affaire-pegasus-mobiles-5-confrontation-etats.json',
        'ch-affaire-pegasus-mobiles-6-publication-suites.json',
        'ch-affaire-pegasus-mobiles-7-bilan-doctrine.json',
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
    print('  CAS-IN Saga « Le silence des téléphones » (Pegasus mobiles)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_scenes(root)
    step_2_inject_campaign(root)
    step_3_bump_sw(root)
    step_4_rebuild_meta(root)
    step_5_validate(root)

    print('\n  ✅ Saga déployée.')
    print()
    print('  35 étapes · 105 choix · 7 dossiers journalisme-DFIR mobile forensics.')
    print('  Innovation : 1ère saga POV journaliste-DFIR (profil hybride).')
    print('  Pegasus + 6 États présumés + NSO Group confrontés.')
    print('  Doctrine journalisme-DFIR formalisée pour profession CH.')


if __name__ == '__main__':
    main()
