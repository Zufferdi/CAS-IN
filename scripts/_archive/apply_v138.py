#!/usr/bin/env python3
"""
apply_v138.py — CAS-IN v138 (Fix integrité campaigns.kind)

PROBLÈME
────────
Le code sagas-app.js filtre les campagnes par `c.kind === 'saga'` ou
`c.kind === 'affaire'`, mais aucune des 47 campagnes de campaigns.json
n'a le champ `kind` → la page Sagas affiche systématiquement "Aucun
résultat pour ces filtres".

Côté collections.html, le filtrage est aussi cassé (kind === 'collection').

SOLUTION
────────
Ajouter le champ `kind` à chaque campagne via heuristique :
  • id commence par "saga-" ET titre commence par "L'Affaire"  → 'affaire'
  • id commence par "saga-" mais titre normal                  → 'saga'
  • id ∈ {fundamentals, ransomwares-reels, ...}                → 'collection'
  • id ∈ {cybercrime-..., espionnage-..., quotidien-...}       → 'collection'
  • id == 'ia-deepfakes'                                       → 'collection'

Le mapping a été établi à partir des conventions de nommage existantes
(commentaire dans sagas-app.js v121a + analyse du repo).

Idempotent : ré-exécutable. Si tous les champs `kind` sont déjà présents,
no-op.
"""
import json
import re
import sys
from pathlib import Path


def find_root():
    here = Path(__file__).resolve().parent
    for c in (here, here.parent):
        if (c / 'sw.js').exists() and (c / 'data' / 'campaigns.json').exists():
            return c
    print('[error] Racine CAS-IN introuvable.', file=sys.stderr)
    sys.exit(1)


def log(s, m):
    print(f'  {s} {m}')


# Mapping explicite pour les IDs sans pattern reconnaissable
EXPLICIT_KINDS = {
    'fundamentals': 'collection',
    'ransomwares-reels': 'collection',
    'windows-mobile-forensics': 'collection',
    'crypto-attacks': 'collection',
    'network-attribution': 'collection',
    'coop-internationale': 'collection',
    'droit-suisse': 'collection',
    'ia-deepfakes': 'collection',
    'cybercrime-crimes-graves': 'collection',
    'espionnage-etat': 'collection',
    'quotidien-enquete': 'collection',
}


def detect_kind(campaign):
    """Détermine le kind d'une campagne via heuristique."""
    cid = campaign['id']
    title = campaign.get('title', '')

    # Mapping explicite (priorité)
    if cid in EXPLICIT_KINDS:
        return EXPLICIT_KINDS[cid]

    # Pattern "saga-*"
    if cid.startswith('saga-'):
        # Titre commence par "L'Affaire" ou "L'Affaire" (apostrophe typographique)
        if title.startswith("L'Affaire") or title.startswith("L\u2019Affaire"):
            return 'affaire'
        return 'saga'

    # Fallback : collection
    return 'collection'


def step_1_patch_campaigns(root):
    """Ajouter kind à chaque campagne."""
    print('\n[1/3] Ajout champ `kind` à data/campaigns.json')
    p = root / 'data' / 'campaigns.json'
    with open(p, encoding='utf-8') as f:
        data = json.load(f)

    campaigns = data.get('campaigns', [])
    if not campaigns:
        log('❌', 'campaigns vide ou structure inattendue')
        return

    already_have_kind = sum(1 for c in campaigns if 'kind' in c)
    if already_have_kind == len(campaigns):
        log('⏭ ', f'Toutes les {len(campaigns)} campagnes ont déjà le champ `kind`')
        return

    from collections import Counter
    added = Counter()
    for c in campaigns:
        if 'kind' in c:
            continue
        k = detect_kind(c)
        c['kind'] = k
        added[k] += 1

    # Réécrire le JSON (indent=2 pour rester lisible)
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

    log('✅', f'{sum(added.values())} champ(s) `kind` ajouté(s)')
    for k, n in sorted(added.items(), key=lambda x: -x[1]):
        log(' ', f'• kind="{k}" : {n} campagne(s)')


def step_2_bump_sw(root):
    """Bump SW v153 → v154"""
    print('\n[2/3] Bump SW v153 → v154')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()

    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v138' in sw:
        log('⏭ ', f'SW déjà bumpé en v138 (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v138 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
        f"// Fix critique : ajout du champ `kind` aux 47 campagnes de\n"
        f"// data/campaigns.json. Sans ce champ, sagas-app.js et\n"
        f"// collections-app.js filtraient à 0 → pages vides.\n"
        f"// Répartition : 25 affaires, 11 sagas, 11 collections.\n"
        f"// ═══════════════════════════════════════════════════════════════\n"
        f"\n"
        f"const CACHE_VERSION = 'cas-in-v{new_v}';"
    )
    sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(sw)
    log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')


def step_3_rebuild(root):
    print('\n[3/3] Régénération counts.json + README')
    import subprocess
    for script in ('generate_counts.py', 'update_readme_stats.py'):
        sp = root / 'scripts' / script
        if not sp.exists():
            continue
        try:
            r = subprocess.run(['python3', str(sp)], cwd=str(root),
                               capture_output=True, text=True, timeout=30)
            log('✅' if r.returncode == 0 else '⚠️ ', script)
        except Exception as e:
            log('⚠️ ', f'{script}: {e}')


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN v138 — Fix campaigns.kind manquant')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_patch_campaigns(root)
    step_2_bump_sw(root)
    step_3_rebuild(root)

    print('\n  ✅ v138 appliqué.')
    print()
    print('  Effets :')
    print('    • pages/sagas.html affichera enfin sagas + affaires (36 entrées)')
    print('    • pages/collections.html affichera les 11 collections')
    print('    • Filtres "Sagas / Affaires / Toutes" fonctionnels')
    print()
    print('  Vide ton cache (Ctrl+Shift+R) pour SW v154.')


if __name__ == '__main__':
    main()
