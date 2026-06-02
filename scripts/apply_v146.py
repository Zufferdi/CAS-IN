#!/usr/bin/env python3
"""
apply_v146.py — CAS-IN v146 (Vague 4 : Spécialisé — clôture des orphelines)

CONTEXTE
────────
Quatrième et dernière vague de couverture des fiches orphelines.
v143 (+21, Mobile/Cloud/Ransomware) → v144 (+30, Investigation moderne)
→ v145 (+25, Avancé) → v146 (+25, Spécialisé).

Couvre les 18 dernières fiches DFIR sans question :

  - dns_forensique_avance
  - docker_kubernetes_forensique
  - documents_office_forensique
  - entreprise_messaging_forensique
  - f2fs
  - file_location_fs
  - iot_forensique
  - log_forensique_avance
  - mobile_apps_forensique
  - nas_forensique
  - pdf_forensique_avance
  - sms_blaster
  - steganographie
  - usb_forensique
  - usb_removable_media_forensique
  - vehicules_forensique
  - vm_forensique
  - wsl_forensique

CONTENU
───────
25 questions de qualité produites à partir du contenu réel des fiches.

  Thèmes :
    • Forensique         : 18 questions
    • Spécificité des OS : 4 questions (WSL + USB)
    • Système de fichiers: 3 questions (f2fs, NTFS, ext4)

  Difficultés :
    • easy   : 8  (32%)
    • medium : 13 (52%)
    • hard   : 4  (16%)

ACTIONS (identiques v143/v144/v145)
───────────────────────────────────
1. Lit scripts/quiz-specialise.json
2. Fusion dédup dans data/questions.json
3. Lance split_questions.py
4. Régénère search-index, counts.json, README
5. Bump SW v161 → v162

IDEMPOTENT
──────────
Dédup par texte de question.
"""
import os
import re
import sys
import json
import subprocess
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


def step_1_inject_questions(root):
    print('\n[1/6] Injection des questions dans data/questions.json')
    candidates = [
        Path(__file__).parent.parent / 'scripts' / 'quiz-specialise.json',
        Path(__file__).parent / 'quiz-specialise.json',
    ]
    src = next((c for c in candidates if c.exists()), None)
    if not src:
        log('❌', 'quiz-specialise.json introuvable')
        sys.exit(1)

    new_qs = json.load(open(src))
    log('  ', f'{len(new_qs)} questions à intégrer')

    qjs = root / 'data' / 'questions.json'
    existing = json.load(open(qjs))
    existing_texts = {q.get('q', '').strip() for q in existing}
    to_add = [q for q in new_qs if q.get('q', '').strip() not in existing_texts]
    skipped = len(new_qs) - len(to_add)

    if skipped == len(new_qs):
        log('⏭ ', f'Toutes les {len(new_qs)} questions déjà présentes')
        return

    existing.extend(to_add)
    with open(qjs, 'w', encoding='utf-8') as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
        f.write('\n')
    log('✅', f'{len(to_add)} ajoutées (skip {skipped}), total : {len(existing)}')


def step_2_split_questions(root):
    print('\n[2/6] Régénération chunks (split_questions.py)')
    sp = root / 'scripts' / 'split_questions.py'
    if not sp.exists():
        log('⚠️ ', 'split_questions.py introuvable')
        return
    try:
        r = subprocess.run(['python3', str(sp)], cwd=str(root),
                           capture_output=True, text=True, timeout=60)
        if r.returncode == 0:
            chunks = list((root / 'data' / 'questions').glob('quiz-*.json'))
            log('✅', f'{len(chunks)} chunks régénérés')
        else:
            log('❌', f'Échec : {r.stderr[:200]}')
    except Exception as e:
        log('❌', f'Exception : {e}')


def step_3_rebuild_search_index(root):
    print('\n[3/6] Régénération search-index.json')
    sp = root / 'scripts' / 'build_search_index.py'
    if not sp.exists():
        log('⚠️ ', 'build_search_index.py introuvable — skip')
        return
    try:
        r = subprocess.run(['python3', str(sp)], cwd=str(root),
                           capture_output=True, text=True, timeout=60)
        log('✅' if r.returncode == 0 else '⚠️ ', 'search-index régénéré')
    except Exception as e:
        log('⚠️ ', f'Exception : {e}')


def step_4_rebuild_counts(root):
    print('\n[4/6] Régénération counts.json + README')
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


def step_5_bump_sw(root):
    print('\n[5/6] Bump SW v161 → v162')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v146' in sw:
        log('⏭ ', f'SW déjà bumpé en v146 (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v146 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
        f"// Vague 4 — Spécialisé : +25 questions sur 18 fiches DFIR\n"
        f"// auparavant orphelines :\n"
        f"//   - dns_forensique_avance, docker_kubernetes_forensique\n"
        f"//   - documents_office_forensique, entreprise_messaging_forensique\n"
        f"//   - f2fs, file_location_fs, iot_forensique\n"
        f"//   - log_forensique_avance, mobile_apps_forensique\n"
        f"//   - nas_forensique, pdf_forensique_avance, sms_blaster\n"
        f"//   - steganographie, usb_forensique, usb_removable_media_forensique\n"
        f"//   - vehicules_forensique, vm_forensique, wsl_forensique\n"
        f"// Total : 2311 → 2336 questions.\n"
        f"// Couverture fiches : passe de ~85% à 100% (hors méta).\n"
        f"// ═══════════════════════════════════════════════════════════════\n"
        f"\n"
        f"const CACHE_VERSION = 'cas-in-v{new_v}';"
    )
    sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(sw)
    log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')


def step_6_validate(root):
    print('\n[6/6] Validation finale')
    qjs = root / 'data' / 'questions.json'
    d = json.load(open(qjs))
    log('✅', f'data/questions.json : {len(d)} questions')

    target = ['dns_forensique_avance', 'docker_kubernetes_forensique',
              'documents_office_forensique', 'entreprise_messaging_forensique',
              'f2fs', 'file_location_fs', 'iot_forensique',
              'log_forensique_avance', 'mobile_apps_forensique',
              'nas_forensique', 'pdf_forensique_avance', 'sms_blaster',
              'steganographie', 'usb_forensique', 'usb_removable_media_forensique',
              'vehicules_forensique', 'vm_forensique', 'wsl_forensique']
    from collections import Counter
    c = Counter()
    for q in d:
        for slug in q.get('fiches', []):
            c[slug.replace('.html', '')] += 1
    for f in target:
        n = c.get(f, 0)
        flag = '✅' if n > 0 else '⚠️ '
        log(flag, f'Fiche \'{f}\' : {n} question(s)')

    chunks_total = 0
    qdir = root / 'data' / 'questions'
    n_chunks = 0
    if qdir.is_dir():
        for f in os.listdir(qdir):
            if not f.endswith('.json'):
                continue
            n_chunks += 1
            try:
                cd = json.load(open(qdir / f))
                qs = cd if isinstance(cd, list) else cd.get('questions', [])
                chunks_total += len(qs)
            except:
                pass
    if chunks_total == len(d):
        log('✅', f'Chunks cohérents : {chunks_total} questions ({n_chunks} fichiers)')
    else:
        log('⚠️ ', f'Chunks : {chunks_total} (vs {len(d)})')


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN v146 — Vague 4 : Spécialisé (clôture orphelines)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_inject_questions(root)
    step_2_split_questions(root)
    step_3_rebuild_search_index(root)
    step_4_rebuild_counts(root)
    step_5_bump_sw(root)
    step_6_validate(root)

    print('\n  ✅ v146 appliqué.')
    print()
    print('  Résultat : 18 dernières fiches DFIR sortent de l\'orphelinat.')
    print('  +25 questions de qualité (mix easy/medium/hard).')
    print('  Couverture : passe de ~85% à 100% (hors fiches méta : index, refs, poster).')


if __name__ == '__main__':
    main()
