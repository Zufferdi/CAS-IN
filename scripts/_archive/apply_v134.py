#!/usr/bin/env python3
"""
apply_v134.py — CAS-IN v134 (TP CLI Phase 2 — extension à 49 exercices)

Étend le MVP v133 (15 ex / 5 cat) à 49 exercices / 7 catégories :
  +4 ex à cli_basics  (3 → 7)
  +4 ex à cli_logs    (3 → 7)
  +4 ex à cli_pipes   (3 → 7)
  +4 ex à cli_extract (3 → 7)
  +4 ex à cli_ps      (3 → 7)
  +7 ex en cli_dfir   (NOUVEAU : Sleuth Kit — mmls, fls, icat, mactime, fsstat, blkstat, tsk_recover)
  +7 ex en cli_network (NOUVEAU : tshark, tcpdump, ss, dig, whois, curl, nmap)

Actions :
  1. Remplace tp/tp-engine-cli.js (1078 lignes, 49 ex)
  2. Patch tp.html — ajoute 2 boutons sidebar (cli_dfir, cli_network)
  3. Patch tp/tp-engine.js — STATE.total + TP_XP_BY_CAT (cli_dfir, cli_network)
  4. Bump SW v149 → v150

Idempotent : ré-exécutable sans effet de bord.
"""
import re
import shutil
import sys
from pathlib import Path


def find_root():
    here = Path(__file__).resolve().parent
    for c in (here, here.parent):
        if (c / 'sw.js').exists() and (c / 'tp.html').exists():
            return c
    print('[error] Racine CAS-IN introuvable.', file=sys.stderr)
    sys.exit(1)


def log(s, m):
    print(f'  {s} {m}')


# 2 nouveaux boutons à insérer dans le groupe « Ligne de commande »
NEW_BUTTONS_HTML = """          <button type="button" class="sb-cat" data-cat="cli_dfir"    onclick="go('cli_dfir',this)">   <span class="sb-cat-icon">🔬</span><span class="sb-cat-name">TSK Sleuth Kit</span>        <span class="sb-badge sb-badge-none" id="bd-cli_dfir">—</span><span class="sb-new">NEW</span></button>
          <button type="button" class="sb-cat" data-cat="cli_network" onclick="go('cli_network',this)"><span class="sb-cat-icon">🌐</span><span class="sb-cat-name">Réseau CLI</span>            <span class="sb-badge sb-badge-none" id="bd-cli_network">—</span><span class="sb-new">NEW</span></button>
"""

# Insérer juste avant la fermeture du groupe « Ligne de commande » — repère exact
INSERT_AFTER_BUTTON = '<button type="button" class="sb-cat" data-cat="cli_ps"      onclick="go(\'cli_ps\',this)">     <span class="sb-cat-icon">⚡</span><span class="sb-cat-name">PowerShell</span>            <span class="sb-badge sb-badge-none" id="bd-cli_ps">—</span><span class="sb-new">NEW</span></button>'


def step_1_install_engine(root):
    """Remplacer tp/tp-engine-cli.js par la version 49 exercices."""
    print('\n[1/5] Installation de tp/tp-engine-cli.js (v134, 49 ex)')
    dst = root / 'tp' / 'tp-engine-cli.js'

    # Source : le fichier doit être livré à côté du script (bundle tar.gz)
    candidates = [
        Path(__file__).parent.parent / 'tp' / 'tp-engine-cli.js',
        Path(__file__).parent / 'tp-engine-cli.js'
    ]
    src = None
    for c in candidates:
        if c.exists():
            src = c
            break
    if not src:
        log('❌', 'tp-engine-cli.js v134 introuvable dans le bundle')
        sys.exit(1)

    # Si le fichier dest existe déjà avec la même taille, idempotence
    if dst.exists() and dst.stat().st_size == src.stat().st_size:
        log('⏭ ', f'tp-engine-cli.js déjà à jour ({dst.stat().st_size} octets)')
        return
    shutil.copy(str(src), str(dst))
    log('✅', f'tp-engine-cli.js installé ({dst.stat().st_size} octets, 49 ex)')


def step_2_patch_tp_html(root):
    """Ajouter les 2 boutons cli_dfir + cli_network dans la sidebar"""
    print('\n[2/5] Patch tp.html — ajout 2 boutons (cli_dfir + cli_network)')
    p = root / 'tp.html'
    with open(p, encoding='utf-8') as f:
        content = f.read()
    if 'data-cat="cli_dfir"' in content:
        log('⏭ ', 'Boutons cli_dfir + cli_network déjà présents')
        return False
    if INSERT_AFTER_BUTTON not in content:
        log('❌', 'Marker "cli_ps" introuvable dans tp.html (le MVP v133 doit être déjà appliqué)')
        return False
    new = content.replace(INSERT_AFTER_BUTTON, INSERT_AFTER_BUTTON + '\n' + NEW_BUTTONS_HTML.rstrip())
    # Mettre à jour le compteur du groupe : 5 → 7
    new = new.replace('<span class="sb-group-count" id="gc-cli">5</span>',
                      '<span class="sb-group-count" id="gc-cli">7</span>', 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new)
    log('✅', '2 boutons ajoutés (TSK Sleuth Kit + Réseau CLI), compteur groupe → 7')
    return True


def step_3_patch_tp_engine(root):
    """Enrichir STATE.total + TP_XP_BY_CAT pour cli_dfir et cli_network"""
    print('\n[3/5] Patch tp/tp-engine.js — STATE.total + TP_XP_BY_CAT')
    p = root / 'tp' / 'tp-engine.js'
    with open(p, encoding='utf-8') as f:
        content = f.read()
    changed = False

    # STATE.total — ajouter cli_dfir, cli_network
    if 'cli_dfir:0' not in content:
        old = 'cli_basics:0, cli_logs:0, cli_pipes:0, cli_extract:0, cli_ps:0'
        new = 'cli_basics:0, cli_logs:0, cli_pipes:0, cli_extract:0, cli_ps:0, cli_dfir:0, cli_network:0'
        if old in content:
            content = content.replace(old, new, 1)
            log('✅', 'STATE.total enrichi (+cli_dfir, +cli_network)')
            changed = True
        else:
            log('⚠️ ', 'STATE.total v133 introuvable — applique v133 d\'abord')
    else:
        log('⏭ ', 'STATE.total contient déjà cli_dfir')

    # TP_XP_BY_CAT — ajouter les 2 cat (30 XP chacune = hard)
    if 'cli_dfir: 30' not in content:
        old = 'cli_basics: 5, cli_logs: 15, cli_pipes: 30, cli_extract: 30, cli_ps: 30,'
        new = 'cli_basics: 5, cli_logs: 15, cli_pipes: 30, cli_extract: 30, cli_ps: 30, cli_dfir: 30, cli_network: 30,'
        if old in content:
            content = content.replace(old, new, 1)
            log('✅', 'TP_XP_BY_CAT enrichi (+cli_dfir 30 XP, +cli_network 30 XP)')
            changed = True
        else:
            log('⚠️ ', 'TP_XP_BY_CAT v133 introuvable — applique v133 d\'abord')
    else:
        log('⏭ ', 'TP_XP_BY_CAT contient déjà cli_dfir')

    if changed:
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)


def step_4_bump_sw(root):
    """Bump SW v149 → v150"""
    print('\n[4/5] Bump SW v149 → v150')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v134' in sw:
        log('⏭ ', f'SW déjà bumpé en v134 (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v134 — 2026-05-30 — Bump SW v{current} → v{new_v}\n"
        f"// TP CLI Phase 2 : extension à 49 exercices, 7 catégories.\n"
        f"// +cli_dfir (TSK Sleuth Kit), +cli_network (tshark/tcpdump/dig/curl/nmap)\n"
        f"// ═══════════════════════════════════════════════════════════════\n"
        f"\n"
        f"const CACHE_VERSION = 'cas-in-v{new_v}';"
    )
    sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(sw)
    log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')


def step_5_rebuild(root):
    """Régénérer counts + README"""
    print('\n[5/5] Régénération counts.json + README')
    import subprocess
    for script in ('generate_counts.py', 'update_readme_stats.py'):
        sp = root / 'scripts' / script
        if not sp.exists():
            log('⏭ ', f'{script} absent')
            continue
        try:
            r = subprocess.run(['python3', str(sp)], cwd=str(root),
                               capture_output=True, text=True, timeout=30)
            log('✅' if r.returncode == 0 else '⚠️ ', f'{script}')
        except Exception as e:
            log('⚠️ ', f'{script}: {e}')


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN v134 — TP CLI Phase 2 (49 exercices, 7 catégories)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    # Préalable : v133 doit avoir été appliqué
    tp_html = (root / 'tp.html').read_text(encoding='utf-8')
    if 'data-cat="cli_basics"' not in tp_html:
        log('❌', 'v133 (MVP TP CLI) n\'est pas appliqué. Applique-le avant v134.')
        sys.exit(1)

    step_1_install_engine(root)
    step_2_patch_tp_html(root)
    step_3_patch_tp_engine(root)
    step_4_bump_sw(root)
    step_5_rebuild(root)

    print('\n  ✅ v134 appliqué.')
    print()
    print('  Total : 7 catégories CLI, 49 exercices')
    print('    cli_basics    : 7 ex · easy QCM')
    print('    cli_logs      : 7 ex · medium mix')
    print('    cli_pipes     : 7 ex · hard freestyle Linux')
    print('    cli_extract   : 7 ex · hard freestyle')
    print('    cli_ps        : 7 ex · hard freestyle PowerShell')
    print('    cli_dfir      : 7 ex · hard freestyle Sleuth Kit (NEW)')
    print('    cli_network   : 7 ex · hard freestyle réseau (NEW)')
    print()
    print('  XP max si toutes catégories perfectionnées :')
    print('    7×5 + 7×15 + 5×(7×30) = 35 + 105 + 1050 = 1190 XP')


if __name__ == '__main__':
    main()
