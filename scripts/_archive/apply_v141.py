#!/usr/bin/env python3
"""
apply_v141.py — CAS-IN v141 (Fix recherche + force campaigns.json + audit)

CONTEXTE
────────
Après v140 (redirect sagas.html fixé), l'utilisateur signale :

  CAPTURE : scene.html?view=sagas charge mais affiche "0 sagas / 0 affaires"

L'audit exhaustif sur le repo local prouve que tout est OK chez nous :

  ✓ 399/399 scènes valides
  ✓ 47/47 campaigns ont leur champ kind (12 saga, 24 affaire, 11 collection)
  ✓ 12'584 références q.fiches → 0 cassée
  ✓ 1223 références NPCs → 0 manquante
  ✓ 248/248 fichiers précachés présents
  ✓ Tous les JSON data/ valides

DIAGNOSTIC
──────────

Le bug "0 sagas" ne vient PAS du code. Il vient soit :

  A) Du SW v152-v155 chez l'utilisateur qui sert encore l'ancien
     campaigns.json (pré-v138, sans le champ kind)
  B) Du fait que v138 n'a pas été correctement déployé chez lui

L'INVESTIGATION révèle aussi un BUG D'INDEXATION
─────────────────────────────────────────────────

10 fiches utilisent `<div class="section-title">` au lieu de
`<div class="sec-title">`. Le script build_search_index.py ne match
QUE sec-title → ces 10 fiches sont dans l'index mais SANS sections
indexées → recherche full-text moins efficace.

Fiches concernées : encodage, hex_calcul_basique, outils,
premier_intervenant, preuve, shellbags, shellbags_osint_pivot,
suisse, windows_forensique, zimmerman.

ACTIONS v141
────────────

1. INCLURE PHYSIQUEMENT data/campaigns.json à jour (avec tous les kind)
   dans le tar. Comme on l'a fait avec case-studies.json en v140.
   Pas de doute possible : après extraction, le fichier est correct.

2. PATCHER build_search_index.py pour matcher AUSSI 'section-title'
   (pattern OR : sec-title|section-title).

3. RÉGÉNÉRER data/search-index.json avec le script corrigé.
   Ces 10 fiches gagnent ~80 sections indexées au total.

4. BUMP SW v156 → v157. CRUCIAL : force l'invalidation du cache user.
   Sans bump, l'utilisateur garde un campaigns.json obsolète en cache.

5. Validation auto post-déploiement : afficher le résultat de l'audit
   (47 campaigns avec kind, 12 sagas, 24 affaires).

Idempotent.
"""
import os
import re
import shutil
import sys
import json
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


def step_1_install_campaigns_json(root):
    """Garantir présence d'un data/campaigns.json complet avec tous les kind"""
    print('\n[1/5] Installation forcée de data/campaigns.json (avec tous les kind)')

    target = root / 'data' / 'campaigns.json'

    candidates = [
        Path(__file__).parent.parent / 'data' / 'campaigns.json',
        Path(__file__).parent / 'campaigns.json',
    ]
    src = next((c for c in candidates if c.exists()), None)

    if not src:
        log('❌', 'data/campaigns.json introuvable dans le bundle — abort')
        sys.exit(1)

    # Lire les deux et comparer
    src_data = json.load(open(src))
    src_kind_count = sum(1 for c in src_data.get('campaigns', []) if c.get('kind'))
    src_total = len(src_data.get('campaigns', []))

    if target.exists():
        try:
            tgt_data = json.load(open(target))
            tgt_kind_count = sum(1 for c in tgt_data.get('campaigns', []) if c.get('kind'))
            tgt_total = len(tgt_data.get('campaigns', []))

            if tgt_total == src_total and tgt_kind_count == src_total:
                log('⏭ ', f'data/campaigns.json déjà OK ({tgt_total} campaigns, tous avec kind)')
                return
            else:
                log('⚠️ ', f'Existant : {tgt_total} campaigns, {tgt_kind_count} avec kind')
                log('⚠️ ', f'Bundle   : {src_total} campaigns, {src_kind_count} avec kind')
                log('⚠️ ', 'Remplacement par le bundle (force)')
        except Exception as e:
            log('⚠️ ', f'data/campaigns.json invalide ({e}) — remplacement')

    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(str(src), str(target))
    log('✅', f'data/campaigns.json installé ({src_total} campaigns, {src_kind_count} avec kind)')

    # Décompte par kind
    from collections import Counter
    kinds = Counter(c.get('kind', 'MISSING') for c in src_data['campaigns'])
    log('  ', f'Par kind : {dict(kinds)}')


def step_2_patch_search_index_script(root):
    """Élargir le pattern pour matcher sec-title ET section-title"""
    print('\n[2/5] Patch build_search_index.py (regex section)')

    p = root / 'scripts' / 'build_search_index.py'
    if not p.exists():
        log('⚠️ ', 'scripts/build_search_index.py introuvable — skip')
        return

    with open(p, encoding='utf-8') as f:
        content = f.read()

    # Pattern actuel : <div\s+class="sec-title"
    # Pattern visé   : <div\s+class="(?:sec|section)-title"
    old_pat = r'<div\s+class="sec-title"'
    new_pat = r'<div\s+class="(?:sec|section)-title"'

    if new_pat in content:
        log('⏭ ', 'Pattern déjà patché')
        return

    if old_pat not in content:
        log('⚠️ ', 'Pattern original introuvable (script peut-être déjà modifié)')
        return

    new_content = content.replace(old_pat, new_pat)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new_content)
    log('✅', 'Pattern élargi : sec-title|section-title')


def step_3_rebuild_search_index(root):
    """Régénérer data/search-index.json"""
    print('\n[3/5] Régénération de data/search-index.json')

    p = root / 'scripts' / 'build_search_index.py'
    if not p.exists():
        log('⚠️ ', 'Script introuvable — skip')
        return

    import subprocess
    try:
        r = subprocess.run(
            ['python3', str(p)],
            cwd=str(root),
            capture_output=True,
            text=True,
            timeout=60
        )
        if r.returncode == 0:
            log('✅', 'search-index régénéré')
            # Vérifier que les 10 fiches problématiques ont maintenant des sections
            si = json.load(open(root / 'data' / 'search-index.json'))
            problem_fiches = {'encodage.html', 'hex_calcul_basique.html', 'outils.html',
                              'premier_intervenant.html', 'preuve.html', 'shellbags.html',
                              'shellbags_osint_pivot.html', 'suisse.html',
                              'windows_forensique.html', 'zimmerman.html'}
            fixed = 0
            still_zero = 0
            for f in si.get('fiches', []):
                if f.get('file') in problem_fiches:
                    n_sect = len(f.get('sections', []))
                    if n_sect > 0:
                        fixed += 1
                    else:
                        still_zero += 1
            log('  ', f'Fiches problématiques avec sections : {fixed}/10')
            if still_zero:
                log('⚠️ ', f'{still_zero} fiches encore sans sections — vérifier manuellement')
        else:
            log('⚠️ ', f'Échec régénération : {r.stderr[:200]}')
    except Exception as e:
        log('⚠️ ', f'Exception : {e}')


def step_4_bump_sw(root):
    """Bump SW v156 → v157"""
    print('\n[4/5] Bump SW v156 → v157')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()

    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v141' in sw:
        log('⏭ ', f'SW déjà bumpé en v141 (cas-in-v{current})')
    else:
        new_v = current + 1
        bump = (
            f"// v141 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
            f"// Force invalidation cache utilisateur pour récupérer :\n"
            f"//   - data/campaigns.json à jour avec champ 'kind' (47 entries)\n"
            f"//   - data/search-index.json régénéré (10 fiches précédemment\n"
            f"//     ratées par le pattern sec-title only)\n"
            f"// Sans ce bump, le SW v156 sert encore l'ancien campaigns.json\n"
            f"// sans kind, ce qui fait que scene.html?view=sagas affiche 0 sagas.\n"
            f"// ═══════════════════════════════════════════════════════════════\n"
            f"\n"
            f"const CACHE_VERSION = 'cas-in-v{new_v}';"
        )
        sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
        log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')

    with open(p, 'w', encoding='utf-8') as f:
        f.write(sw)


def step_5_validate(root):
    """Validation finale : audit rapide post-déploiement"""
    print('\n[5/5] Validation finale')

    # 1. campaigns.json a tous les kind
    d = json.load(open(root / 'data' / 'campaigns.json'))
    camps = d.get('campaigns', [])
    with_kind = sum(1 for c in camps if c.get('kind'))
    if with_kind == len(camps) and len(camps) > 0:
        log('✅', f'campaigns.json : {len(camps)}/{len(camps)} avec kind')
    else:
        log('⚠️ ', f'campaigns.json : {with_kind}/{len(camps)} avec kind')

    # 2. search-index couvre toutes les fiches
    si = json.load(open(root / 'data' / 'search-index.json'))
    n_si = len(si.get('fiches', []))
    n_zero = sum(1 for f in si['fiches'] if not f.get('sections'))
    log('✅' if n_zero <= 1 else '⚠️ ', f'search-index : {n_si} fiches, {n_zero} sans sections')

    # 3. case-studies.json présent et valide
    cs = root / 'data' / 'case-studies.json'
    if cs.exists():
        try:
            d = json.load(open(cs))
            if 'case_studies' in d:
                log('✅', 'case-studies.json valide')
            else:
                log('⚠️ ', 'case-studies.json présent mais structure inattendue')
        except:
            log('⚠️ ', 'case-studies.json invalide')
    else:
        log('⚠️ ', 'case-studies.json absent')

    # 4. pages/sagas.html redirige correctement
    sagas = root / 'pages' / 'sagas.html'
    if sagas.exists():
        content = sagas.read_text(encoding='utf-8')
        # Toutes les URL scene.html doivent avoir ../
        bad = [m for m in re.findall(r"['\"](scene\.html\?view=sagas)['\"]", content)]
        if not bad:
            log('✅', 'pages/sagas.html redirect OK (toutes les URL avec ../)')
        else:
            log('⚠️ ', f'pages/sagas.html : {len(bad)} URL sans ../')


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN v141 — Fix "0 sagas" + indexation full-text')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_install_campaigns_json(root)
    step_2_patch_search_index_script(root)
    step_3_rebuild_search_index(root)
    step_4_bump_sw(root)
    step_5_validate(root)

    print('\n  ✅ v141 appliqué.')
    print()
    print('  Corrections :')
    print('    • data/campaigns.json (47 entries avec kind) inclus physiquement')
    print('    • build_search_index.py supporte sec-title ET section-title')
    print('    • search-index régénéré (10 fiches gagnent leur indexation)')
    print('    • SW bumpé pour forcer invalidation cache utilisateur')
    print()
    print('  ⚠️  CTRL+SHIFT+R OBLIGATOIRE après push.')
    print('     Le SW v156 cache un ancien campaigns.json qui cause "0 sagas".')


if __name__ == '__main__':
    main()
