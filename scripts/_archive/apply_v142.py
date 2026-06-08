#!/usr/bin/env python3
"""
apply_v142.py — CAS-IN v142 (Fix debrief dict → [object Object])

CONTEXTE
────────
L'audit qualitatif v141 a révélé un BUG D'AFFICHAGE sur 5 scènes :

  • drone-laufenburg-swissgrid-aargau
  • mini-natels-prison-pochwies
  • src-fonctionnaire-russe-kaspersky
  • handala-hack-iran-rhne-stryker
  • cyber-justicier-vigilante-fr

Ces 5 scènes ont un champ debrief de format RICHE :
    { lessons: [...], references: [...] }

Les 394 autres scènes ont debrief en STRING simple.

Le code legacy (scene-app.js, quiz-app.js) fait `${scene.debrief}` qui
sérialise mal un dict en "[object Object]" à la fin de la scène.

STRATÉGIE
─────────
Plutôt que casser le format riche (qui est en fait pédagogiquement
meilleur), on patche le moteur pour gérer les DEUX formats.

ACTIONS
───────
1. Installer js/core/cas-in-debrief-renderer.js
   API : window.CasInDebrief.render(debrief) et .hasContent(debrief)

2. Installer style/cas-in-debrief.css (styles lessons/references)

3. Inclure les deux ressources sur scene.html et quiz.html

4. Patcher scene-app.js:3627-3631 pour utiliser CasInDebrief.render()
5. Patcher quiz-app.js:4282-4283 pour utiliser CasInDebrief.render()

6. Bump SW v157 → v158 + précache des nouveaux assets

7. Validation : afficher le nombre de scènes avec debrief dict

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


def step_1_install_renderer(root):
    """Installer le module renderer"""
    print('\n[1/6] Installation du module cas-in-debrief-renderer.js')

    dst = root / 'js' / 'core' / 'cas-in-debrief-renderer.js'
    candidates = [
        Path(__file__).parent.parent / 'js' / 'core' / 'cas-in-debrief-renderer.js',
        Path(__file__).parent / 'cas-in-debrief-renderer.js',
    ]
    src = next((c for c in candidates if c.exists()), None)
    if not src:
        log('❌', 'cas-in-debrief-renderer.js introuvable dans le bundle')
        sys.exit(1)

    if dst.exists():
        with open(dst, encoding='utf-8') as f:
            content = f.read()
        if 'CasInDebrief' in content and 'lessons' in content:
            log('⏭ ', f'Module déjà installé ({dst.stat().st_size} octets)')
            return
    shutil.copy(str(src), str(dst))
    log('✅', f'Module installé : {dst.relative_to(root)} ({dst.stat().st_size} octets)')


def step_2_install_css(root):
    """Installer le CSS pour le debrief riche"""
    print('\n[2/6] Installation du CSS cas-in-debrief.css')

    dst = root / 'style' / 'cas-in-debrief.css'
    candidates = [
        Path(__file__).parent.parent / 'style' / 'cas-in-debrief.css',
        Path(__file__).parent / 'cas-in-debrief.css',
    ]
    src = next((c for c in candidates if c.exists()), None)
    if not src:
        log('❌', 'cas-in-debrief.css introuvable dans le bundle')
        sys.exit(1)

    if dst.exists():
        if dst.stat().st_size == src.stat().st_size:
            log('⏭ ', f'CSS déjà installé ({dst.stat().st_size} octets)')
            return
    shutil.copy(str(src), str(dst))
    log('✅', f'CSS installé : {dst.relative_to(root)} ({dst.stat().st_size} octets)')


def step_3_include_in_scene_and_quiz(root):
    """Inclure renderer + CSS dans scene.html et quiz.html"""
    print('\n[3/6] Inclusion sur scene.html et quiz.html')

    for page_name in ('scene.html', 'quiz.html'):
        p = root / page_name
        if not p.exists():
            log('⚠️ ', f'{page_name} introuvable')
            continue

        with open(p, encoding='utf-8') as f:
            content = f.read()

        modified = False
        # Inclure le CSS
        if 'cas-in-debrief.css' not in content:
            css_tag = '<link rel="stylesheet" href="style/cas-in-debrief.css">'
            # Injecter après scene.css ou quiz.css
            marker_candidates = [
                '<link rel="stylesheet" href="style/scene.css">',
                '<link rel="stylesheet" href="style/quiz.css">',
                '<link rel="stylesheet" href="style/style.css">',
            ]
            for marker in marker_candidates:
                if marker in content:
                    content = content.replace(marker, marker + '\n  ' + css_tag, 1)
                    modified = True
                    break
            else:
                # Fallback : avant </head>
                content = content.replace('</head>', '  ' + css_tag + '\n</head>', 1)
                modified = True

        # Inclure le JS module (juste après cas-in-a11y.js ou cas-in-fiche-aliases.js)
        if 'cas-in-debrief-renderer.js' not in content:
            js_tag = '<script src="js/core/cas-in-debrief-renderer.js" defer></script>'
            # Chercher un marqueur préférable
            marker_re = re.search(
                r'(<script[^>]*src="js/core/cas-in-fiche-aliases\.js"[^>]*></script>)',
                content
            )
            if not marker_re:
                marker_re = re.search(
                    r'(<script[^>]*src="js/core/cas-in-a11y\.js"[^>]*></script>)',
                    content
                )
            if marker_re:
                insert_pos = marker_re.end()
                content = content[:insert_pos] + '\n    ' + js_tag + content[insert_pos:]
                modified = True
            else:
                content = content.replace('</head>', '  ' + js_tag + '\n</head>', 1)
                modified = True

        if modified:
            with open(p, 'w', encoding='utf-8') as f:
                f.write(content)
            log('✅', f'{page_name} patché')
        else:
            log('⏭ ', f'{page_name} déjà OK')


def step_4_patch_scene_app(root):
    """Patcher scene-app.js pour utiliser CasInDebrief.render()"""
    print('\n[4/6] Patch js/pages/scene-app.js')

    p = root / 'js' / 'pages' / 'scene-app.js'
    if not p.exists():
        log('⚠️ ', 'scene-app.js introuvable')
        return

    with open(p, encoding='utf-8') as f:
        content = f.read()

    if 'CasInDebrief.render' in content:
        log('⏭ ', 'Déjà patché')
        return

    # Pattern à remplacer (template literal)
    old = '''${scene.debrief ? `
    <div class="debrief-section">
      <div class="review-title">📖 Analyse pédagogique</div>
      <div class="debrief-content">${scene.debrief}</div>
    </div>
    ` : ''}'''

    new = '''${(window.CasInDebrief ? window.CasInDebrief.hasContent(scene.debrief) : !!scene.debrief) ? `
    <div class="debrief-section">
      <div class="review-title">📖 Analyse pédagogique</div>
      <div class="debrief-content">${window.CasInDebrief ? window.CasInDebrief.render(scene.debrief) : (typeof scene.debrief === 'string' ? scene.debrief : '')}</div>
    </div>
    ` : ''}'''

    if old not in content:
        log('⚠️ ', 'Pattern original introuvable — fichier déjà modifié ?')
        return

    new_content = content.replace(old, new, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new_content)
    log('✅', 'scene-app.js patché (rendu via CasInDebrief.render)')


def step_5_patch_quiz_app(root):
    """Patcher quiz-app.js pour utiliser CasInDebrief.render()"""
    print('\n[5/6] Patch js/pages/quiz-app.js')

    p = root / 'js' / 'pages' / 'quiz-app.js'
    if not p.exists():
        log('⚠️ ', 'quiz-app.js introuvable')
        return

    with open(p, encoding='utf-8') as f:
        content = f.read()

    if 'CasInDebrief.render' in content:
        log('⏭ ', 'Déjà patché')
        return

    # Pattern à remplacer
    old = """document.getElementById('scene-end-debrief').innerHTML =
    `<strong style="color:var(--cyan)">Bilan d'enquête</strong><br>${scene.debrief}`;"""

    new = """document.getElementById('scene-end-debrief').innerHTML =
    `<strong style="color:var(--cyan)">Bilan d'enquête</strong><br>${window.CasInDebrief ? window.CasInDebrief.render(scene.debrief) : (typeof scene.debrief === 'string' ? scene.debrief : '')}`;"""

    if old not in content:
        log('⚠️ ', 'Pattern original introuvable — fichier déjà modifié ?')
        return

    new_content = content.replace(old, new, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new_content)
    log('✅', 'quiz-app.js patché')


def step_6_bump_sw_and_validate(root):
    """Bump SW + précache + validation"""
    print('\n[6/6] Bump SW v157 → v158 + précache + validation')

    # Bump SW
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()

    # Précache : ajouter le module et le CSS
    additions = []
    if "'./js/core/cas-in-debrief-renderer.js'" not in sw:
        marker = "'./js/core/cas-in-fiche-aliases.js',"
        if marker in sw:
            sw = sw.replace(marker, marker + "\n  './js/core/cas-in-debrief-renderer.js',", 1)
            additions.append('cas-in-debrief-renderer.js')

    if "'./style/cas-in-debrief.css'" not in sw:
        # Chercher un marker CSS connu
        for marker in ["'./style/scene.css',", "'./style/quiz.css',", "'./style/style.css',"]:
            if marker in sw:
                sw = sw.replace(marker, marker + "\n  './style/cas-in-debrief.css',", 1)
                additions.append('cas-in-debrief.css')
                break

    if additions:
        log('✅', f'Précache : +{", ".join(additions)}')
    else:
        log('⏭ ', 'Précache déjà à jour')

    # Bump
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v142' in sw:
        log('⏭ ', f'SW déjà bumpé en v142 (cas-in-v{current})')
    else:
        new_v = current + 1
        bump = (
            f"// v142 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
            f"// Fix debrief dict → [object Object] sur 5 scènes :\n"
            f"//   drone-laufenburg-swissgrid-aargau\n"
            f"//   mini-natels-prison-pochwies\n"
            f"//   src-fonctionnaire-russe-kaspersky\n"
            f"//   handala-hack-iran-rhne-stryker\n"
            f"//   cyber-justicier-vigilante-fr\n"
            f"// Nouveau module js/core/cas-in-debrief-renderer.js qui gère\n"
            f"// les deux formats (string legacy + dict {{lessons, references}}).\n"
            f"// ═══════════════════════════════════════════════════════════════\n"
            f"\n"
            f"const CACHE_VERSION = 'cas-in-v{new_v}';"
        )
        sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
        log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')

    with open(p, 'w', encoding='utf-8') as f:
        f.write(sw)

    # Validation : comptage scènes avec debrief dict
    n_dict = 0
    n_string = 0
    for f in os.listdir(root / 'scenes'):
        if not f.endswith('.json') or f == 'index.json':
            continue
        try:
            s = json.load(open(root / 'scenes' / f))
            db = s.get('debrief')
            if isinstance(db, dict):
                n_dict += 1
            elif isinstance(db, str):
                n_string += 1
        except:
            pass
    log('  ', f'Scènes avec debrief dict : {n_dict}')
    log('  ', f'Scènes avec debrief string : {n_string}')

    # Vérifier que les 5 cas sont bien gérés
    target_5 = {
        'drone-laufenburg-swissgrid-aargau',
        'mini-natels-prison-pochwies',
        'src-fonctionnaire-russe-kaspersky',
        'handala-hack-iran-rhne-stryker',
        'cyber-justicier-vigilante-fr'
    }
    found = 0
    for sid in target_5:
        if (root / 'scenes' / f'{sid}.json').exists():
            s = json.load(open(root / 'scenes' / f'{sid}.json'))
            if isinstance(s.get('debrief'), dict):
                found += 1
    log('✅' if found == 5 else '⚠️ ', f'Scènes cibles confirmées : {found}/5')


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN v142 — Fix debrief dict → [object Object]')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_install_renderer(root)
    step_2_install_css(root)
    step_3_include_in_scene_and_quiz(root)
    step_4_patch_scene_app(root)
    step_5_patch_quiz_app(root)
    step_6_bump_sw_and_validate(root)

    print('\n  ✅ v142 appliqué.')
    print()
    print('  Bénéfices :')
    print('    • 5 scènes affichent enfin leur debrief riche')
    print('    • Module CasInDebrief réutilisable (résilient)')
    print('    • Format riche (lessons + references) reste un acquis')
    print()
    print('  ⚠️  Ctrl+Shift+R après push pour activer SW v158.')


if __name__ == '__main__':
    main()
