#!/usr/bin/env python3
"""
apply_v140.py — CAS-IN v140 (Fix bugs 404 résiduels)

CONTEXTE
────────
Signalement utilisateur après v139 : 2 bugs persistent sur la prod.

  CAPTURE 1 — /CAS-IN/pages/scene.html?view=sagas → 404
  CAPTURE 2 — /CAS-IN/pages/case-studies.html → "Erreur de chargement"

CAUSES IDENTIFIÉES
──────────────────

BUG 1 — pages/sagas.html ligne 9 + 15
  Le fichier est un redirect HTML (depuis v100). Deux lignes manquent le `../` :

    Ligne  9 : <meta http-equiv="refresh" content="0;url=scene.html?view=sagas">
    Ligne 15 : window.location.replace('scene.html?view=sagas');

  Depuis /CAS-IN/pages/, ces URL résolvent en /CAS-IN/pages/scene.html → 404.
  Les lignes 10 (canonical) et 16 (fallback) sont OK avec `../`.

  → FIX : préfixer `../` sur les 2 lignes bugguées.

BUG 2 — pages/case-studies.html → "Erreur de chargement"
  La page fait `fetch('../data/case-studies.json')`. Si le fichier n'existe
  pas, `r.json()` jette → catch() affiche "Erreur de chargement".

  v137 créait ce fichier mais via le script seulement. Si le déploiement
  user a sauté l'étape ou si le SW cache pré-v137 sert, le fichier manque.

  → FIX : inclure le fichier physique stub directement dans le bundle.
          Pas de création par script = présence garantie après extraction.

ACTIONS
───────
  1. Réécrire pages/sagas.html avec les `../` corrects (copie depuis bundle)
  2. Installer data/case-studies.json stub si absent
  3. Bump SW v155 → v156 (pour invalider le cache et forcer reload)
  4. Régénérer counts.json + README

Idempotent.
"""
import os
import re
import shutil
import sys
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


def step_1_fix_sagas_redirect(root):
    """Réécrire pages/sagas.html avec ../ partout"""
    print('\n[1/4] Fix pages/sagas.html (bug 404 sur redirect)')

    target = root / 'pages' / 'sagas.html'
    if not target.exists():
        log('⚠️ ', 'pages/sagas.html introuvable — skip')
        return

    # Lire le contenu actuel
    with open(target, encoding='utf-8') as f:
        content = f.read()

    # Vérifier si le bug est encore présent
    has_bug_meta = re.search(
        r'<meta http-equiv="refresh" content="0;url=scene\.html\?view=sagas">',
        content
    )
    has_bug_js = "window.location.replace('scene.html?view=sagas')" in content

    if not has_bug_meta and not has_bug_js:
        log('⏭ ', 'pages/sagas.html déjà corrigé')
        return

    # Tenter une copie depuis le bundle (recommandé)
    candidates = [
        Path(__file__).parent.parent / 'pages' / 'sagas.html',
        Path(__file__).parent / 'sagas.html',
    ]
    src = next((c for c in candidates if c.exists()), None)
    if src:
        shutil.copy(str(src), str(target))
        log('✅', f'pages/sagas.html réécrit depuis bundle ({target.stat().st_size} octets)')
        return

    # Fallback : patch ciblé en place
    log('⚠️ ', 'Pas de version bundle — patch en place')
    new_content = content
    if has_bug_meta:
        new_content = new_content.replace(
            '<meta http-equiv="refresh" content="0;url=scene.html?view=sagas">',
            '<meta http-equiv="refresh" content="0;url=../scene.html?view=sagas">'
        )
    if has_bug_js:
        new_content = new_content.replace(
            "window.location.replace('scene.html?view=sagas')",
            "window.location.replace('../scene.html?view=sagas')"
        )
    with open(target, 'w', encoding='utf-8') as f:
        f.write(new_content)
    log('✅', 'pages/sagas.html patché en place')


def step_2_install_case_studies_stub(root):
    """Garantir présence de data/case-studies.json"""
    print('\n[2/4] Garantie de présence de data/case-studies.json')

    target = root / 'data' / 'case-studies.json'

    # Tenter copie depuis le bundle
    candidates = [
        Path(__file__).parent.parent / 'data' / 'case-studies.json',
        Path(__file__).parent / 'case-studies.json',
    ]
    src = next((c for c in candidates if c.exists()), None)

    if target.exists():
        # Vérifier validité du JSON
        import json
        try:
            with open(target, encoding='utf-8') as f:
                d = json.load(f)
            if isinstance(d, dict) and 'case_studies' in d:
                log('⏭ ', f'data/case-studies.json déjà valide ({target.stat().st_size} octets)')
                return
            else:
                log('⚠️ ', 'Fichier présent mais structure invalide — remplacement')
        except Exception as e:
            log('⚠️ ', f'Fichier présent mais JSON invalide ({e}) — remplacement')

    target.parent.mkdir(parents=True, exist_ok=True)
    if src:
        shutil.copy(str(src), str(target))
        log('✅', f'data/case-studies.json installé depuis bundle ({target.stat().st_size} octets)')
    else:
        # Fallback : créer le stub directement
        stub = {
            "_comment": "Stub minimal — case studies à compléter ultérieurement. v140 stable.",
            "_version": "v140-stub",
            "case_studies": []
        }
        import json
        with open(target, 'w', encoding='utf-8') as f:
            json.dump(stub, f, indent=2, ensure_ascii=False)
            f.write('\n')
        log('✅', f'data/case-studies.json créé en fallback ({target.stat().st_size} octets)')


def step_3_bump_sw(root):
    """Bump SW v155 → v156"""
    print('\n[3/4] Bump SW v155 → v156')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()

    # Précache data/case-studies.json (souvent oublié)
    if "'./data/case-studies.json'" not in sw:
        marker = "'./data/counts.json',"
        if marker in sw:
            sw = sw.replace(marker, marker + "\n  './data/case-studies.json',", 1)
            log('✅', 'Précache : +data/case-studies.json')
        else:
            log('⚠️ ', 'Marker précache counts.json introuvable')

    # Bump version
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v140' in sw:
        log('⏭ ', f'SW déjà bumpé en v140 (cas-in-v{current})')
    else:
        new_v = current + 1
        bump = (
            f"// v140 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
            f"// Fix 2 bugs 404 résiduels signalés par l'utilisateur :\n"
            f"//   1) pages/sagas.html → redirect avec préfixe ../ correct\n"
            f"//   2) data/case-studies.json → fichier garanti présent\n"
            f"// Bump pour invalider le cache et forcer reload chez le user.\n"
            f"// ═══════════════════════════════════════════════════════════════\n"
            f"\n"
            f"const CACHE_VERSION = 'cas-in-v{new_v}';"
        )
        sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
        log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')

    with open(p, 'w', encoding='utf-8') as f:
        f.write(sw)


def step_4_rebuild(root):
    print('\n[4/4] Régénération counts.json + README')
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
    print('  CAS-IN v140 — Fix bugs 404 résiduels (sagas + case-studies)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_fix_sagas_redirect(root)
    step_2_install_case_studies_stub(root)
    step_3_bump_sw(root)
    step_4_rebuild(root)

    print('\n  ✅ v140 appliqué.')
    print()
    print('  Bugs corrigés :')
    print('    • pages/scene.html?view=sagas → 404 (lien depuis pages/sagas.html)')
    print('    • pages/case-studies.html → "Erreur de chargement"')
    print()
    print('  ⚠️  CRUCIAL : Ctrl+Shift+R obligatoire pour activer SW v156.')
    print('     Le SW v155 cache encore l\'ancienne version buggée des fichiers.')


if __name__ == '__main__':
    main()
