#!/usr/bin/env python3
"""
apply_v133.py — CAS-IN v133 (MVP TP CLI)

Déploie le MVP du TP « Ligne de commande » (15 exercices, 5 catégories,
multi-OS, mix QCM + freestyle).

Actions :
  1. Copie tp/tp-engine-cli.js (engine MVP, 15 exercices)
  2. Patch tp.html — ajoute groupe sidebar « 🖥️ Ligne de commande » + script tag
  3. Patch tp.html — ajoute le même groupe dans le mob-drawer
  4. Patch tp/tp-engine.js — STATE.total enrichi + TP_XP_BY_CAT enrichi
  5. Patch sw.js — ajoute tp-engine-cli.js au précache
  6. Bump SW v148 → v149

Idempotent : ré-exécutable sans effet de bord.

Pré-requis : tp/tp-engine-cli.js doit être présent à côté du script
(livré dans le bundle tar.gz).
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


# ─────────────────────────────────────────────────────────────
# Blocs HTML à insérer dans tp.html
# ─────────────────────────────────────────────────────────────

NEW_GROUP_SIDEBAR = """      <!-- Groupe 2quinquies — Ligne de commande (delta v133) -->
      <div class="sb-group group-cli collapsed" id="grp-cli">
        <div class="sb-group-header" onclick="toggleGrp('grp-cli')">
          <span class="sb-group-icon">🖥️</span>
          <span class="sb-group-name">Ligne de commande</span>
          <span class="sb-group-count" id="gc-cli">5</span>
          <div class="sb-grp-prog"><div class="sb-grp-track"><div class="sb-grp-fill" id="gp-cli" style="width:0%;background:var(--cyan)"></div></div><span class="sb-grp-label" id="gl-cli">0%</span></div>
          <span class="sb-arrow">›</span>
        </div>
        <div class="sb-group-body">
          <button type="button" class="sb-cat" data-cat="cli_basics"  onclick="go('cli_basics',this)"> <span class="sb-cat-icon">🐧</span><span class="sb-cat-name">CLI basics</span>            <span class="sb-badge sb-badge-none" id="bd-cli_basics">—</span><span class="sb-new">NEW</span></button>
          <button type="button" class="sb-cat" data-cat="cli_logs"    onclick="go('cli_logs',this)">   <span class="sb-cat-icon">📋</span><span class="sb-cat-name">Analyse logs</span>          <span class="sb-badge sb-badge-none" id="bd-cli_logs">—</span><span class="sb-new">NEW</span></button>
          <button type="button" class="sb-cat" data-cat="cli_pipes"   onclick="go('cli_pipes',this)">  <span class="sb-cat-icon">🔗</span><span class="sb-cat-name">Pipes &amp; filtres</span>     <span class="sb-badge sb-badge-none" id="bd-cli_pipes">—</span><span class="sb-new">NEW</span></button>
          <button type="button" class="sb-cat" data-cat="cli_extract" onclick="go('cli_extract',this)"><span class="sb-cat-icon">🔍</span><span class="sb-cat-name">Extract artefacts</span>     <span class="sb-badge sb-badge-none" id="bd-cli_extract">—</span><span class="sb-new">NEW</span></button>
          <button type="button" class="sb-cat" data-cat="cli_ps"      onclick="go('cli_ps',this)">     <span class="sb-cat-icon">⚡</span><span class="sb-cat-name">PowerShell</span>            <span class="sb-badge sb-badge-none" id="bd-cli_ps">—</span><span class="sb-new">NEW</span></button>
        </div>
      </div>

"""

# Le groupe Investigation s'ouvre par "Groupe 3 — Investigation". On va insérer juste avant.
INSERT_BEFORE = "      <!-- Groupe 3 — Investigation -->"


# ─────────────────────────────────────────────────────────────
# Étapes
# ─────────────────────────────────────────────────────────────

def step_1_copy_engine(root, bundle_dir):
    """Vérifier que tp-engine-cli.js est bien dans tp/ (déposé par l'extraction tar)"""
    print('\n[1/6] Vérification de tp/tp-engine-cli.js')
    dst = root / 'tp' / 'tp-engine-cli.js'
    if dst.exists():
        log('✅', f'tp/tp-engine-cli.js présent ({dst.stat().st_size} octets)')
        return
    # Fallback : chercher à côté du script
    fallback = Path(__file__).parent / 'tp-engine-cli.js'
    if fallback.exists():
        shutil.copy(str(fallback), str(dst))
        log('✅', f'tp/tp-engine-cli.js copié depuis {fallback.parent} ({dst.stat().st_size} octets)')
        return
    log('❌', 'tp/tp-engine-cli.js introuvable.')
    log('   ', "Le bundle tar.gz doit contenir tp/tp-engine-cli.js extrait à la racine du repo.")
    sys.exit(1)


def step_2_patch_tp_html_sidebar(root):
    """Ajouter le groupe sidebar CLI dans tp.html"""
    print('\n[2/6] Patch tp.html — groupe sidebar « Ligne de commande »')
    p = root / 'tp.html'
    with open(p, encoding='utf-8') as f:
        content = f.read()
    if 'Groupe 2quinquies — Ligne de commande' in content:
        log('⏭ ', 'Groupe sidebar CLI déjà présent')
        return False
    if INSERT_BEFORE not in content:
        log('❌', 'Repère "Groupe 3 — Investigation" introuvable')
        return False
    new = content.replace(INSERT_BEFORE, NEW_GROUP_SIDEBAR + INSERT_BEFORE, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new)
    log('✅', 'Groupe sidebar CLI inséré (5 catégories)')
    return True


def step_3_patch_tp_html_script(root):
    """Ajouter le script tag tp-engine-cli.js dans tp.html"""
    print('\n[3/6] Patch tp.html — <script> tp-engine-cli.js')
    p = root / 'tp.html'
    with open(p, encoding='utf-8') as f:
        content = f.read()
    script_tag = '<script src="tp/tp-engine-cli.js" defer></script>'
    if 'tp-engine-cli.js' in content:
        log('⏭ ', 'Script tp-engine-cli.js déjà inclus')
        return False
    # Insérer juste après tp-engine-forensic-extras.js (dernier engine)
    marker = '<script src="tp/tp-engine-forensic-extras.js" defer></script>'
    if marker not in content:
        log('❌', f'Marker introuvable : {marker}')
        return False
    new = content.replace(marker, marker + '\n' + script_tag, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new)
    log('✅', 'Script tp-engine-cli.js ajouté à tp.html')
    return True


def step_4_patch_tp_engine(root):
    """Enrichir STATE.total et TP_XP_BY_CAT dans tp-engine.js"""
    print('\n[4/6] Patch tp/tp-engine.js — STATE.total + TP_XP_BY_CAT')
    p = root / 'tp' / 'tp-engine.js'
    with open(p, encoding='utf-8') as f:
        content = f.read()
    changed = False

    # STATE.total — ajouter cli_basics, cli_logs, cli_pipes, cli_extract, cli_ps
    if 'cli_basics' not in content:
        old_total = '''  total: {
    endian:0, timestamp:0, bitmap:0, fat:0, magic:0, mismatch:0,
    runlist:0, effacement:0, timestomping:0, hextable:0, fsidentify:0,
    offset:0, bases:0, hash:0, email:0, network:0, ir:0,
    droitpenal:0, glossaire:0, examen:0, mbr:0, direntry:0, hexdump:0, slackspace:0,
    hfsbtree:0, ntfsindex:0
  },'''
        new_total = '''  total: {
    endian:0, timestamp:0, bitmap:0, fat:0, magic:0, mismatch:0,
    runlist:0, effacement:0, timestomping:0, hextable:0, fsidentify:0,
    offset:0, bases:0, hash:0, email:0, network:0, ir:0,
    droitpenal:0, glossaire:0, examen:0, mbr:0, direntry:0, hexdump:0, slackspace:0,
    hfsbtree:0, ntfsindex:0,
    // v133 — TP CLI (Ligne de commande)
    cli_basics:0, cli_logs:0, cli_pipes:0, cli_extract:0, cli_ps:0
  },'''
        if old_total in content:
            content = content.replace(old_total, new_total, 1)
            log('✅', 'STATE.total enrichi (+5 catégories CLI)')
            changed = True
        else:
            log('⚠️ ', 'Bloc STATE.total non trouvé tel quel — vérifie manuellement')
    else:
        log('⏭ ', 'STATE.total contient déjà cli_basics')

    # TP_XP_BY_CAT — ajouter les 5 catégories
    if 'cli_basics: 5' not in content:
        old_xp = '''const TP_XP_BY_CAT = {
  // Easy (5 XP) — fondamentaux
  endian: 5, bases: 5, hexdump: 5, hextable: 5, glossaire: 5,
  // Medium (15 XP) — analyse intermédiaire
  timestamp: 15, bitmap: 15, magic: 15, mismatch: 15, fsidentify: 15,
  offset: 15, hash: 15, email: 15, network: 15, direntry: 15, slackspace: 15,
  // Hard (30 XP) — forensique avancée
  fat: 30, runlist: 30, effacement: 30, timestomping: 30, mbr: 30,
  ir: 30, droitpenal: 30, examen: 30, hfsbtree: 30, ntfsindex: 30,
};'''
        new_xp = '''const TP_XP_BY_CAT = {
  // Easy (5 XP) — fondamentaux
  endian: 5, bases: 5, hexdump: 5, hextable: 5, glossaire: 5,
  // Medium (15 XP) — analyse intermédiaire
  timestamp: 15, bitmap: 15, magic: 15, mismatch: 15, fsidentify: 15,
  offset: 15, hash: 15, email: 15, network: 15, direntry: 15, slackspace: 15,
  // Hard (30 XP) — forensique avancée
  fat: 30, runlist: 30, effacement: 30, timestomping: 30, mbr: 30,
  ir: 30, droitpenal: 30, examen: 30, hfsbtree: 30, ntfsindex: 30,
  // v133 — TP CLI : 5 (basics) / 15 (logs) / 30 (pipes, extract, ps)
  cli_basics: 5, cli_logs: 15, cli_pipes: 30, cli_extract: 30, cli_ps: 30,
};'''
        if old_xp in content:
            content = content.replace(old_xp, new_xp, 1)
            log('✅', 'TP_XP_BY_CAT enrichi (+5 catégories CLI)')
            changed = True
        else:
            log('⚠️ ', 'Bloc TP_XP_BY_CAT non trouvé tel quel — vérifie manuellement')
    else:
        log('⏭ ', 'TP_XP_BY_CAT contient déjà cli_basics')

    if changed:
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)


def step_5_patch_sw(root):
    """Ajouter tp-engine-cli.js au précache + bump version"""
    print('\n[5/6] Patch sw.js — précache + bump v148 → v149')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()

    # 1. Ajouter au précache (juste après tp-engine-forensic-extras.js)
    if "'./tp/tp-engine-cli.js'" not in sw:
        marker = "'./tp/tp-engine-forensic-extras.js',"
        if marker in sw:
            sw = sw.replace(marker, marker + "\n  './tp/tp-engine-cli.js',", 1)
            log('✅', 'tp-engine-cli.js ajouté au précache SW')
        else:
            log('⚠️ ', f'Marker précache introuvable : {marker}')
    else:
        log('⏭ ', 'tp-engine-cli.js déjà dans le précache')

    # 2. Bump version
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v133' in sw:
        log('⏭ ', f'SW déjà bumpé en v133 (cas-in-v{current})')
    else:
        new_v = current + 1
        bump = (
            f"// v133 — 2026-05-30 — Bump SW v{current} → v{new_v}\n"
            f"// MVP TP CLI : 15 exercices, 5 catégories (cli_basics, cli_logs,\n"
            f"// cli_pipes, cli_extract, cli_ps), multi-OS Linux+Windows+PowerShell.\n"
            f"// ═══════════════════════════════════════════════════════════════\n"
            f"\n"
            f"const CACHE_VERSION = 'cas-in-v{new_v}';"
        )
        sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
        log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')

    with open(p, 'w', encoding='utf-8') as f:
        f.write(sw)


def step_6_rebuild(root):
    """Régénérer counts.json (les nouvelles catégories TP doivent y apparaître)"""
    print('\n[6/6] Régénération counts.json + README')
    import subprocess
    for script in ('generate_counts.py', 'update_readme_stats.py'):
        sp = root / 'scripts' / script
        if not sp.exists():
            log('⏭ ', f'{script} absent')
            continue
        try:
            r = subprocess.run(['python3', str(sp)], cwd=str(root),
                               capture_output=True, text=True, timeout=30)
            if r.returncode == 0:
                log('✅', script)
            else:
                log('⚠️ ', f'{script} code={r.returncode}: {r.stderr[:200]}')
        except Exception as e:
            log('⚠️ ', f'{script}: {e}')


def main():
    root = find_root()
    bundle_dir = Path(__file__).resolve().parent.parent

    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN v133 — MVP TP CLI (15 exercices, 5 catégories)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_engine(root, bundle_dir)
    step_2_patch_tp_html_sidebar(root)
    step_3_patch_tp_html_script(root)
    step_4_patch_tp_engine(root)
    step_5_patch_sw(root)
    step_6_rebuild(root)

    print('\n  ✅ v133 MVP appliqué.')
    print()
    print('  Test :')
    print('    1. Ouvre tp.html dans le navigateur')
    print('    2. Vide le cache (SW v149)')
    print('    3. Sidebar → groupe « 🖥️ Ligne de commande »')
    print('    4. Clique sur une catégorie, fais l\'exercice')
    print()
    print('  Phase 2 (v134) prévue : extension à 60-100 exercices')


if __name__ == '__main__':
    main()
