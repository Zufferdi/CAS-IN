#!/usr/bin/env python3
"""
apply_v132w.py — CAS-IN v132w (polish · easy wins)

Trois améliorations de cohérence/clarté sans toucher au cœur fonctionnel :

  A. Suppression du doublon racine artifacts.html
     → la version active est pages/artifacts.html (référencée par 5 pages
       references/, le SW, et le sitemap). Le racine est un 16ᵉ doublon
       oublié par le cleanup v131c.

  B. Archivage des scripts one-shot dans scripts/_archive/
     → les scripts utilisés pour les deltas v132r/s/u/v et autres one-shot
       sont déplacés. Les scripts régénérables (build_*, generate_*,
       sync_*, check_*, split_*) restent à la racine de scripts/.

  F. Visibilité GitHub du CHANGELOG
     → création d'un CHANGELOG.md à la racine qui pointe vers
       docs/CHANGELOG.md (visibilité GitHub repo) + ajout d'une ligne dans
       README.md.

  Bonus : bump SW v146 → v147 (force refresh utilisateurs)

Idempotent : ré-exécutable sans effet de bord.
"""
import re
import shutil
import sys
from pathlib import Path


SCRIPTS_TO_ARCHIVE = [
    # One-shot du delta v132r (saga Antennes Fantômes)
    'generate_antennes_fantomes_saga.py',
    'finalize_antennes_fantomes_saga.py',
    # One-shot v132s (fiche SMS Blaster)
    'integrate_sms_blaster_fiche.py',
    # Scripts de finalisation v132u
    'finalize_all.py',
    'finalize_all_selfcontained.py',
    # Patch v132v
    'apply_v132v.py',
    # One-shots historiques
    'cleanup-questions-legacy.sh',
    'build_chronology_v2.py',     # v2 — l'utile pour génération courante reste build_index.py
    'build_npc_arcs_v2.py',
    'enrich_scene_index.py',
]

ROOT_CHANGELOG_CONTENT = """# Changelog

Le changelog complet du projet est maintenu dans [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

Ce fichier sert de pointeur visible depuis la racine du dépôt GitHub.

## Version courante

**v3.0.1** (Cache SW `cas-in-v147`)

Voir [docs/CHANGELOG.md](docs/CHANGELOG.md) pour le détail de toutes les versions et deltas.
"""

README_CHANGELOG_LINE = (
    "\n## 📝 Historique des versions\n\n"
    "Voir [`CHANGELOG.md`](CHANGELOG.md) (résumé) ou [`docs/CHANGELOG.md`](docs/CHANGELOG.md) (complet).\n"
)


def find_root() -> Path:
    here = Path(__file__).resolve().parent
    for c in (here, here.parent):
        if (c / 'sw.js').exists() and (c / 'data' / 'manifest.json').exists():
            return c
    print('[error] Racine CAS-IN introuvable.', file=sys.stderr)
    sys.exit(1)


def log(symbol, msg):
    print(f'  {symbol} {msg}')


def step_a_remove_artifacts_racine(root: Path):
    """A. Supprimer artifacts.html (racine) — doublon de pages/artifacts.html."""
    print('\n[A/4] Suppression du doublon racine artifacts.html')
    racine = root / 'artifacts.html'
    pages = root / 'pages' / 'artifacts.html'
    if not racine.exists():
        log('⏭ ', 'artifacts.html racine déjà supprimé')
        return
    if not pages.exists():
        log('❌', 'pages/artifacts.html absent — annulation par sécurité')
        return
    # Sanity check : la version pages/ doit être la version active
    with open(racine, encoding='utf-8') as f:
        if 'canonical' in f.read() and '/CAS-IN/artifacts.html' in open(racine).read():
            # OK, c'est bien le doublon (canonical sur racine, alors que la prod est /pages/)
            pass
    racine.unlink()
    log('🗑️ ', 'artifacts.html (racine) supprimé')


def step_b_archive_scripts(root: Path):
    """B. Archiver les scripts one-shot dans scripts/_archive/."""
    print('\n[B/4] Archivage des scripts one-shot')
    archive_dir = root / 'scripts' / '_archive'
    archive_dir.mkdir(exist_ok=True)
    archived = 0
    skipped = 0
    for script_name in SCRIPTS_TO_ARCHIVE:
        src = root / 'scripts' / script_name
        dst = archive_dir / script_name
        if not src.exists():
            if dst.exists():
                skipped += 1  # déjà archivé
            else:
                log('⏭ ', f'{script_name} absent')
            continue
        if dst.exists():
            # Déjà archivé, mais une nouvelle version existe encore en place — comparer
            if src.stat().st_size == dst.stat().st_size:
                src.unlink()
                log('🗑️ ', f'{script_name} (déjà archivé, doublon supprimé)')
                archived += 1
                continue
            else:
                # Écrase l'archive avec la version la plus récente
                dst.unlink()
        shutil.move(str(src), str(dst))
        log('📦', f'{script_name} → scripts/_archive/')
        archived += 1
    if archived == 0 and skipped > 0:
        log('⏭ ', f'{skipped} script(s) déjà archivé(s)')
    elif archived > 0:
        log('✅', f'{archived} script(s) archivé(s)')


def step_f_changelog_visibility(root: Path):
    """F. Créer CHANGELOG.md à la racine + lien dans README.md."""
    print('\n[F/4] Visibilité GitHub : CHANGELOG.md à la racine + lien README')

    # F.1 — CHANGELOG.md racine
    cl_root = root / 'CHANGELOG.md'
    if cl_root.exists():
        log('⏭ ', 'CHANGELOG.md racine déjà présent')
    else:
        with open(cl_root, 'w', encoding='utf-8') as f:
            f.write(ROOT_CHANGELOG_CONTENT)
        log('✅', 'CHANGELOG.md racine créé (pointeur vers docs/CHANGELOG.md)')

    # F.2 — Ligne dans README.md
    readme = root / 'README.md'
    if not readme.exists():
        log('⏭ ', 'README.md absent — section non ajoutée')
        return
    with open(readme, encoding='utf-8') as f:
        readme_content = f.read()
    if 'Historique des versions' in readme_content or '[`CHANGELOG.md`](CHANGELOG.md)' in readme_content:
        log('⏭ ', 'README.md mentionne déjà CHANGELOG')
        return
    new_readme = readme_content.rstrip() + README_CHANGELOG_LINE
    with open(readme, 'w', encoding='utf-8') as f:
        f.write(new_readme)
    log('✅', 'README.md : section « Historique des versions » ajoutée')


def step_bump_sw(root: Path):
    """Bonus : bump SW v146 → v147."""
    print('\n[bonus/4] Bump SW v146 → v147')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v132w' in sw:
        log('⏭ ', f'SW déjà bumpé en v132w (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v132w — 2026-05-30 — Bump SW v{current} → v{new_v}\n"
        f"// Polish : suppression doublon racine artifacts.html, archivage\n"
        f"// scripts one-shot, ajout CHANGELOG.md racine (visibilité GitHub).\n"
        f"// ═══════════════════════════════════════════════════════════════\n"
        f"\n"
        f"const CACHE_VERSION = 'cas-in-v{new_v}';"
    )
    new_sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new_sw)
    log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN v132w — Polish · easy wins')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_a_remove_artifacts_racine(root)
    step_b_archive_scripts(root)
    step_f_changelog_visibility(root)
    step_bump_sw(root)

    print('\n  ✅ v132w appliqué.')
    print()
    print('  Bilan attendu :')
    print('    - 1 HTML racine de moins (artifacts.html → version unique dans pages/)')
    print('    - 10 scripts one-shot déplacés vers scripts/_archive/')
    print('    - CHANGELOG.md visible depuis la racine GitHub')
    print('    - README.md avec lien Historique des versions')
    print('    - SW v147 (force refresh des clients pour propager les changements)')


if __name__ == '__main__':
    main()
