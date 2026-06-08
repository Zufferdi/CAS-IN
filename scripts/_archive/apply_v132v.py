#!/usr/bin/env python3
"""
apply_v132v.py — CAS-IN v132v

Fix bug navbar : 404 sur les liens depuis les pages de tutoriels/ (et toute
autre future page en sous-dossier sans data-subfolder="1").

CAUSE
─────
Dans js/core/cas-in-navbar.js, la détection de sous-dossier reposait sur :
    const inSubfolder = slot.dataset.subfolder === '1' || page === 'fiches';

- fiches/ (122 fichiers, 0 avec data-subfolder) : OK via rétro-compat hardcodée
- references/ (7 fichiers, 7 avec data-subfolder)    : OK
- tutoriels/ (28 fichiers, 0 avec data-subfolder)   : BUG → 404 sur les liens

Depuis tutoriels/autopsy.html, href="index.html" résout vers tutoriels/index.html
au lieu de la racine. Idem tp.html, quiz.html, scene.html, tutoriels.html.

CORRECTION
──────────
Détecter le sous-dossier via window.location.pathname (regex /(fiches|tutoriels|
references)/), en plus de l'attribut data-subfolder et de la rétro-compat fiches.
Le pattern URL est déjà utilisé ligne 270 pour profileHref → cohérent.

ACTIONS
───────
  1. Patch js/core/cas-in-navbar.js (1 ligne modifiée + commentaires)
  2. Bump SW v145 → v146 (force refresh utilisateurs)

À lancer depuis la racine du repo CAS-IN.
Idempotent : ré-exécutable sans effet de bord.
"""
import re
import sys
from pathlib import Path
from datetime import datetime, timezone


def find_root() -> Path:
    here = Path(__file__).resolve().parent
    for c in (here, here.parent):
        if (c / 'sw.js').exists() and (c / 'js' / 'core' / 'cas-in-navbar.js').exists():
            return c
    print('[error] Racine CAS-IN introuvable.', file=sys.stderr)
    sys.exit(1)


OLD_LINE = "    // Détection sous-dossier : explicite via data-subfolder=\"1\",\n    // rétro-compat 'fiches' (qui ne pose pas l'attribut).\n    const inSubfolder = slot.dataset.subfolder === '1' || page === 'fiches';"

NEW_LINE = """    // v132v — Détection sous-dossier élargie via URL
    // Cause du bug : depuis tutoriels/X.html, href='tp.html' résolvait en
    // tutoriels/tp.html → 404. Les 28 fichiers de tutoriels/ n'avaient
    // ni data-subfolder=\"1\" ni traitement spécifique. On détecte donc
    // aussi via window.location.pathname (cohérent avec profileHref l.~270).
    const path = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '';
    const inSubfolder = slot.dataset.subfolder === '1'
                     || page === 'fiches'
                     || /\\/(fiches|tutoriels|references)\\//.test(path);"""


def patch_navbar(root: Path) -> bool:
    """Patch cas-in-navbar.js. Renvoie True si modifié, False si déjà patché."""
    p = root / 'js' / 'core' / 'cas-in-navbar.js'
    with open(p, encoding='utf-8') as f:
        content = f.read()

    # Détection idempotence : on cherche le commentaire SPÉCIFIQUE au patch
    # (la regex /(fiches|tutoriels|references)/ existe déjà ailleurs dans le
    # fichier pour profileHref, donc pas un bon marqueur)
    if '// v132v — Détection sous-dossier élargie via URL' in content:
        print('  ⏭  Patch navbar déjà appliqué')
        return False

    if OLD_LINE not in content:
        print('  ❌ Bloc de détection introuvable dans cas-in-navbar.js')
        print('     (Le fichier a peut-être déjà été modifié manuellement.)')
        return False

    new_content = content.replace(OLD_LINE, NEW_LINE, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('  ✅ Patch navbar appliqué (détection sous-dossier élargie)')
    return True


def bump_sw(root: Path) -> bool:
    """Bump SW v145 → v146. Renvoie True si modifié."""
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()

    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        print('  ❌ CACHE_VERSION introuvable')
        return False
    current = int(m.group(1))

    # Idempotence : détecter le commentaire v132v
    if '// v132v' in sw or current >= 146:
        print(f'  ⏭  SW déjà bumpé en v132v (cas-in-v{current})')
        return False

    new_v = current + 1
    bump = (
        f"// v132v — 2026-05-30 — Bump SW v{current} → v{new_v}\n"
        f"// Fix bug navbar : 404 sur tutoriels/index.html, tutoriels/tp.html, etc.\n"
        f"// Détection sous-dossier élargie via window.location.pathname.\n"
        f"// ═══════════════════════════════════════════════════════════════\n"
        f"\n"
        f"const CACHE_VERSION = 'cas-in-v{new_v}';"
    )
    new_sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new_sw)
    print(f'  ✅ SW bumpé : cas-in-v{current} → cas-in-v{new_v}')
    return True


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN v132v — Fix bug navbar (404 sous-dossiers)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    print('\n[1/2] Patch js/core/cas-in-navbar.js')
    patch_navbar(root)

    print('\n[2/2] Bump SW v145 → v146')
    bump_sw(root)

    print('\n  ✅ v132v appliqué.')
    print('     Validation : depuis tutoriels/autopsy.html, vérifier que les')
    print('     boutons « Accueil », « Quiz », « TP », « Scènes », « Tutos »,')
    print('     « Fiches », « Réfs » de la navbar pointent désormais vers')
    print('     ../index.html, ../quiz.html, ../tp.html, etc.')


if __name__ == '__main__':
    main()
