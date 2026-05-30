#!/usr/bin/env python3
"""
apply_v135.py — CAS-IN v135 (Quiz fiche gating · Mode étude)

Verrouille les questions du quiz qui touchent à des fiches non lues,
quand le « Mode étude » est activé dans les filtres.

Règle pédagogique : une question est débloquée si AU MOINS UNE des
fiches référencées (champ q.fiches) a été lue (90s+ sur la fiche,
tracking par le composant existant fiche-reader.js).

Actions :
  1. Copie js/components/quiz-fiche-gating.js
  2. Patch quiz.html — ajoute <script> + section "Mode étude" dans #settings-overlay
  3. Patch sw.js — précache quiz-fiche-gating.js + bump v150 → v151

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


# Bloc à insérer dans le panneau settings — section "Mode étude"
GATING_SECTION_HTML = """        <!-- v135 — Mode étude : verrouille les questions dont les fiches ne sont pas lues -->
        <div class="fsec" id="gating-section">
          <h3>📚 Mode étude</h3>
          <label style="display:flex;align-items:center;gap:.6rem;cursor:pointer;font-size:.88rem;color:var(--text);">
            <input type="checkbox" id="gating-toggle" style="cursor:pointer;width:18px;height:18px;accent-color:var(--cyan)">
            <span>Débloquer les questions en lisant les fiches</span>
          </label>
          <p style="font-size:.75rem;color:var(--dim);margin:.4rem 0 0 calc(18px + .6rem);line-height:1.4;">
            Quand activé, une question reste verrouillée tant qu'aucune de ses fiches associées
            n'a été lue (90s+ sur la fiche). Tu verras le compteur « débloquées / total » sur
            chaque thème ci-dessus.
          </p>
        </div>

"""

# Pour insérer juste après la section "Thèmes" du settings panel
INSERT_MARKER = """          <div class="chips" id="theme-chips"></div>
        </div>"""

INSERT_REPLACE = """          <div class="chips" id="theme-chips"></div>
        </div>

""" + GATING_SECTION_HTML

# Script init pour binder le toggle après chargement DOM
GATING_INIT_SCRIPT = """    <!-- v135 — Init du toggle Mode étude -->
    <script>
    (function() {
      function initGatingToggle() {
        const toggle = document.getElementById('gating-toggle');
        if (!toggle || !window.QuizGating) {
          setTimeout(initGatingToggle, 200);
          return;
        }
        // État initial reflète le toggle persisté
        toggle.checked = window.QuizGating.enabled;
        toggle.addEventListener('change', function() {
          window.QuizGating.enabled = this.checked;
          // Forcer le rafraîchissement de la question courante
          if (window.QuizGating.refresh) window.QuizGating.refresh();
        });
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGatingToggle);
      } else {
        setTimeout(initGatingToggle, 100);
      }
    })();
    </script>
"""


def step_1_copy_script(root):
    print('\n[1/4] Copie de js/components/quiz-fiche-gating.js')
    dst = root / 'js' / 'components' / 'quiz-fiche-gating.js'

    candidates = [
        Path(__file__).parent.parent / 'js' / 'components' / 'quiz-fiche-gating.js',
        Path(__file__).parent / 'quiz-fiche-gating.js'
    ]
    src = None
    for c in candidates:
        if c.exists():
            src = c
            break
    if not src:
        log('❌', 'quiz-fiche-gating.js introuvable dans le bundle')
        sys.exit(1)

    if dst.exists() and dst.stat().st_size == src.stat().st_size:
        log('⏭ ', f'Déjà installé ({dst.stat().st_size} octets)')
        return
    shutil.copy(str(src), str(dst))
    log('✅', f'quiz-fiche-gating.js installé ({dst.stat().st_size} octets)')


def step_2_patch_quiz_html(root):
    print('\n[2/4] Patch quiz.html — script tag + section settings')
    p = root / 'quiz.html'
    with open(p, encoding='utf-8') as f:
        content = f.read()
    changed = False

    # 2a — Ajouter le script tag (après quiz-utils.js qui est ligne 394)
    if 'quiz-fiche-gating.js' not in content:
        marker_script = '<script src="js/components/quiz-utils.js" defer></script>'
        new_tag = marker_script + '\n    <script src="js/components/quiz-fiche-gating.js" defer></script>'
        if marker_script in content:
            content = content.replace(marker_script, new_tag, 1)
            log('✅', 'Script tag quiz-fiche-gating.js ajouté')
            changed = True
        else:
            log('❌', 'Marker quiz-utils.js introuvable dans quiz.html')
    else:
        log('⏭ ', 'Script quiz-fiche-gating.js déjà inclus')

    # 2b — Ajouter la section Mode étude dans #settings-overlay
    if 'gating-section' not in content:
        if INSERT_MARKER in content:
            content = content.replace(INSERT_MARKER, INSERT_REPLACE, 1)
            log('✅', 'Section "Mode étude" ajoutée dans settings panel')
            changed = True
        else:
            log('❌', 'Marker theme-chips introuvable dans quiz.html')
    else:
        log('⏭ ', 'Section "Mode étude" déjà présente')

    # 2c — Ajouter le script d'init du toggle (à la fin, avant </body>)
    if 'initGatingToggle' not in content:
        if '</body>' in content:
            content = content.replace('</body>', GATING_INIT_SCRIPT + '\n</body>', 1)
            log('✅', 'Script d\'init du toggle ajouté avant </body>')
            changed = True
        else:
            log('❌', '</body> introuvable')
    else:
        log('⏭ ', 'Script d\'init du toggle déjà présent')

    if changed:
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)


def step_3_patch_sw(root):
    print('\n[3/4] Patch sw.js — précache + bump v150 → v151')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()

    # Précache
    if "'./js/components/quiz-fiche-gating.js'" not in sw:
        marker = "'./js/components/quiz-utils.js',"
        if marker in sw:
            sw = sw.replace(marker, marker + "\n  './js/components/quiz-fiche-gating.js',", 1)
            log('✅', 'quiz-fiche-gating.js ajouté au précache SW')
        else:
            # Fallback : insérer après n'importe quel composant quiz
            marker2 = "'./js/components/quiz-app-tools.js',"
            if marker2 in sw:
                sw = sw.replace(marker2, marker2 + "\n  './js/components/quiz-fiche-gating.js',", 1)
                log('✅', 'quiz-fiche-gating.js ajouté au précache (fallback)')
            else:
                log('⚠️ ', 'Marker précache introuvable — ajoute manuellement quiz-fiche-gating.js dans sw.js')
    else:
        log('⏭ ', 'Déjà dans le précache')

    # Bump version
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v135' in sw:
        log('⏭ ', f'SW déjà bumpé en v135 (cas-in-v{current})')
    else:
        new_v = current + 1
        bump = (
            f"// v135 — 2026-05-30 — Bump SW v{current} → v{new_v}\n"
            f"// Mode étude quiz : verrouillage des questions par lecture de fiches.\n"
            f"// Nouveau composant : js/components/quiz-fiche-gating.js\n"
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
    print('  CAS-IN v135 — Mode étude quiz (gating fiche → questions)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_script(root)
    step_2_patch_quiz_html(root)
    step_3_patch_sw(root)
    step_4_rebuild(root)

    print('\n  ✅ v135 appliqué.')
    print()
    print('  Comportement :')
    print('    • Toggle OFF (par défaut) : quiz inchangé')
    print('    • Toggle ON : questions verrouillées tant qu\'aucune de leurs')
    print('      fiches associées n\'a été lue (90s+ sur la fiche).')
    print()
    print('  Activation :')
    print('    1. Ouvre quiz.html')
    print('    2. Clique sur ⚙ (Filtres & Options)')
    print('    3. Section « 📚 Mode étude » → coche la case')
    print('    4. Les chips de thèmes affichent désormais "X/Y débloquées"')


if __name__ == '__main__':
    main()
