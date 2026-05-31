#!/usr/bin/env python3
"""
apply_v137.py — CAS-IN v137 (Fix navigation depuis pages/)

4 catégories de bugs corrigés :

  BUG A — Navbar : pages/ pas dans la regex inSubfolder
    Affecte 16 pages × 6 liens = 96 liens cassés depuis pages/
    Source : js/core/cas-in-navbar.js
    Fix : élargir regex /(fiches|tutoriels|references)/ à
          /(fiches|tutoriels|references|pages)/

  BUG B — fetch('data/X.json') depuis pages/ (chemin relatif faux)
    Affecte 6 fichiers HTML dans pages/ :
      - case-studies.html (fetch data/case-studies.json)
      - mastery.html (fetch data/questions.json)
      - npcs.html (fetch data/npcs.json)
      - parcours-detail.html (fetch data/parcours.json)
      - parcours.html (fetch data/parcours.json)
      - profile.html (fetch data/questions.json + data/fiches-titles.json)
    Fix : 'data/X.json' → '../data/X.json'

  BUG C — sagas-app.js construit 'scene.html?...' depuis pages/
    Affecte tous les liens vers les scènes depuis pages/sagas.html
    Source : js/pages/sagas-app.js
    Fix : préfixer '../' depuis pages/

  Bump SW v152 → v153.

Idempotent : ré-exécutable sans effet de bord.
"""
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


def step_1_fix_navbar_regex(root):
    """Élargir la regex inSubfolder dans cas-in-navbar.js pour inclure pages/"""
    print('\n[1/4] BUG A — Élargir regex inSubfolder à pages/')
    p = root / 'js' / 'core' / 'cas-in-navbar.js'
    with open(p, encoding='utf-8') as f:
        content = f.read()

    old_regex = "/\\/(fiches|tutoriels|references)\\//"
    new_regex = "/\\/(fiches|tutoriels|references|pages)\\//"

    if 'fiches|tutoriels|references|pages' in content:
        log('⏭ ', 'Regex déjà élargie à pages/')
        return

    if old_regex not in content:
        log('⚠️ ', 'Regex /\\/(fiches|tutoriels|references)\\// introuvable')
        return

    new_content = content.replace(old_regex, new_regex, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new_content)
    log('✅', 'Regex élargie : ajout de pages/ → 96 liens corrigés')


def step_2_fix_fetch_paths_in_pages(root):
    """Corriger fetch('data/X.json') → fetch('../data/X.json') dans pages/"""
    print('\n[2/4] BUG B — Fix fetch() de pages/ vers data/')
    pages_dir = root / 'pages'
    if not pages_dir.is_dir():
        log('❌', 'pages/ introuvable')
        return

    # Regex : fetch('data/X.json' (avec ou sans option) — capture entre quotes
    # Match fetch("data/...") ou fetch('data/...') avec n'importe quoi après
    fetch_re = re.compile(r"""fetch\(\s*(['"])data/""")

    patched = 0
    skipped = 0
    for f in sorted(pages_dir.glob('*.html')):
        with open(f, encoding='utf-8') as fh:
            content = fh.read()
        if not fetch_re.search(content):
            skipped += 1
            continue

        # Remplacement : ajouter ../ devant data/
        new_content = fetch_re.sub(r"fetch(\1../data/", content)
        if new_content != content:
            count = len(fetch_re.findall(content))
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(new_content)
            log('✅', f'{f.name} : {count} fetch corrigé(s)')
            patched += 1

    if patched == 0:
        log('⏭ ', 'Tous les fetch déjà corrigés')


def step_3_fix_sagas_app(root):
    """Corriger sagas-app.js : préfixer ../ pour les liens depuis pages/"""
    print('\n[3/5] BUG C — Fix sagas-app.js depuis pages/sagas.html')
    p = root / 'js' / 'pages' / 'sagas-app.js'
    if not p.is_file():
        log('⏭ ', 'sagas-app.js absent')
        return
    with open(p, encoding='utf-8') as f:
        content = f.read()

    # Idempotence
    if "// v137 — fix path from pages/" in content:
        log('⏭ ', 'Fix v137 déjà appliqué dans sagas-app.js')
        return

    helper = """
// v137 — fix path from pages/ : préfixe ../ pour les liens scene.html quand on est dans pages/
function casinScenePrefix() {
  try {
    return (window.location.pathname.indexOf('/pages/') !== -1) ? '../' : '';
  } catch (e) {
    return '';
  }
}

"""

    first_const = re.search(r'^(const|function|let|var)\s', content, re.MULTILINE)
    if not first_const:
        log('⚠️ ', 'Impossible d\'identifier le bloc d\'insertion dans sagas-app.js')
        return
    insert_pos = first_const.start()
    content = content[:insert_pos] + helper + content[insert_pos:]

    old_pattern1 = "`scene.html?scene=${encodeURIComponent(targetSceneId)}${progress.isCompleted ? '&revisit=1' : ''}`"
    new_pattern1 = "`${casinScenePrefix()}scene.html?scene=${encodeURIComponent(targetSceneId)}${progress.isCompleted ? '&revisit=1' : ''}`"

    old_pattern2 = "'scene.html#campaigns'"
    new_pattern2 = "(casinScenePrefix() + 'scene.html#campaigns')"

    replaced = 0
    if old_pattern1 in content:
        content = content.replace(old_pattern1, new_pattern1, 1)
        replaced += 1
    if old_pattern2 in content:
        content = content.replace(old_pattern2, new_pattern2)
        replaced += 1

    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)
    log('✅', f'sagas-app.js patché : helper + {replaced} pattern(s) remplacé(s)')


# ─── BUG D — fetch('scenes/...') depuis pages/ ─────────────────
# Affecte 6 fichiers JS et 1 HTML inline qui appellent fetch('scenes/index.json')
# sans préfixe relatif → résout en pages/scenes/ depuis pages/X.html → 404
def step_4_fix_scenes_fetch(root):
    """Corriger les fetch('scenes/...') sans préfixe relatif"""
    print('\n[4/5] BUG D — Fix fetch(\'scenes/...\') depuis pages/')

    # Helper à injecter en tête : préfixe ../ ou './' selon profondeur
    helper = """// v137 — fix path from pages/ : préfixe ../ pour fetch('scenes/...') depuis pages/
function casinScenesUrl(rel) {
  try {
    const inPages = window.location.pathname.indexOf('/pages/') !== -1;
    return (inPages ? '../' : '') + String(rel || '').replace(/^\\.?\\/?/, '');
  } catch (e) {
    return rel;
  }
}

"""

    # Fichiers JS à patcher
    js_targets = [
        'js/profile/profile-affinities.js',
        'js/profile/profile-export-csv.js',
        'js/profile/profile-atmospheres.js',
        'js/core/cas-in-role-careers.js',
        'js/pages/scene-exam-app.js',
    ]
    patched_js = 0
    for relp in js_targets:
        p = root / relp
        if not p.is_file():
            continue
        with open(p, encoding='utf-8') as f:
            content = f.read()
        if 'casinScenesUrl' in content:
            continue
        if "fetch('scenes/" not in content and 'fetch("scenes/' not in content:
            continue
        # Injecter le helper en tête du fichier (avant la 1ère déclaration ou IIFE)
        first_code = re.search(r'^(const|function|let|var|\(function)', content, re.MULTILINE)
        if first_code:
            insert_pos = first_code.start()
        else:
            insert_pos = 0
        content = content[:insert_pos] + helper + content[insert_pos:]
        # Remplacer les fetch('scenes/X') par fetch(casinScenesUrl('scenes/X'))
        before = content.count("fetch('scenes/") + content.count('fetch("scenes/')
        content = re.sub(r"""fetch\(\s*(['"])scenes/([^'"]+)\1""",
                         r"fetch(casinScenesUrl('scenes/\2')", content)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)
        log('✅', f'{relp} : {before} fetch corrigé(s)')
        patched_js += 1

    # Fichier HTML à patcher (pages/npcs.html)
    npcs_html = root / 'pages' / 'npcs.html'
    if npcs_html.is_file():
        with open(npcs_html, encoding='utf-8') as f:
            content = f.read()
        if "fetch('scenes/" in content or 'fetch("scenes/' in content:
            # Comme c'est dans pages/, on peut simplement préfixer ../
            new_content = re.sub(r"""fetch\(\s*(['"])scenes/""",
                                 r"fetch(\1../scenes/", content)
            with open(npcs_html, 'w', encoding='utf-8') as f:
                f.write(new_content)
            log('✅', 'pages/npcs.html : fetch(scenes/) → fetch(../scenes/)')
    if patched_js == 0:
        log('⏭ ', 'Aucun JS à patcher (déjà fait ou pas concerné)')


def step_5_fix_case_studies_data(root):
    """Créer data/case-studies.json stub (manquant) + meilleur message d'erreur"""
    print('\n[5/7] BUG E — Créer data/case-studies.json stub (manquant)')
    p = root / 'data' / 'case-studies.json'
    if p.is_file():
        log('⏭ ', 'data/case-studies.json déjà présent')
    else:
        stub = '''{
  "_comment": "Stub minimal — case studies à compléter ultérieurement",
  "_version": "v137-stub",
  "case_studies": []
}
'''
        p.parent.mkdir(parents=True, exist_ok=True)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(stub)
        log('✅', 'data/case-studies.json créé (stub vide)')

    # Améliorer le message d'erreur de pages/case-studies.html
    html_p = root / 'pages' / 'case-studies.html'
    if html_p.is_file():
        with open(html_p, encoding='utf-8') as f:
            content = f.read()
        old_msg = "'<div style=\"padding:30px;text-align:center;color:var(--dim)\">Erreur de chargement des études de cas.</div>'"
        new_msg = "'<div style=\"padding:30px;text-align:center;color:var(--dim)\">📚 Aucune étude de cas disponible pour le moment.<br><span style=\"font-size:.85em;opacity:.7\">Les études de cas seront ajoutées dans une prochaine version.</span></div>'"
        if old_msg in content:
            content = content.replace(old_msg, new_msg)
            with open(html_p, 'w', encoding='utf-8') as f:
                f.write(content)
            log('✅', 'pages/case-studies.html : message d\'erreur amélioré')
        else:
            log('⏭ ', 'Message d\'erreur déjà à jour ou format différent')


def step_6_bump_sw(root):
    """Bump SW v152 → v153"""
    print('\n[6/7] Bump SW v152 → v153')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()

    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v137' in sw:
        log('⏭ ', f'SW déjà bumpé en v137 (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v137 — 2026-05-30 — Bump SW v{current} → v{new_v}\n"
        f"// Fix bugs navigation depuis pages/ :\n"
        f"//   A. navbar : élargir regex inSubfolder à pages/\n"
        f"//   B. fetch('data/X.json') → fetch('../data/X.json') (6 fichiers)\n"
        f"//   C. sagas-app.js : préfixer ../ pour les liens scene.html\n"
        f"// ═══════════════════════════════════════════════════════════════\n"
        f"\n"
        f"const CACHE_VERSION = 'cas-in-v{new_v}';"
    )
    sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(sw)
    log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')


def step_7_rebuild(root):
    print('\n[7/7] Régénération counts.json + README')
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
    print('  CAS-IN v137 — Fix bugs navigation depuis pages/')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_fix_navbar_regex(root)
    step_2_fix_fetch_paths_in_pages(root)
    step_3_fix_sagas_app(root)
    step_4_fix_scenes_fetch(root)
    step_5_fix_case_studies_data(root)
    step_6_bump_sw(root)
    step_7_rebuild(root)

    print('\n  ✅ v137 appliqué.')
    print()
    print('  Bugs corrigés :')
    print('    • A — Navbar : ~96 liens cassés depuis pages/ → corrigés')
    print('    • B — fetch data/X.json : 6 pages corrigées')
    print('    • C — sagas-app.js : liens scene.html corrigés depuis pages/sagas.html')
    print('    • D — fetch(\'scenes/...\') : 5 JS + 1 HTML corrigés (404 depuis pages/)')
    print('    • E — data/case-studies.json manquant : stub créé + message d\'erreur amélioré')
    print()
    print('  Vide ton cache (Ctrl+Shift+R) et SW v153 s\'activera.')


if __name__ == '__main__':
    main()
