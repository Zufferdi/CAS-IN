#!/usr/bin/env python3
"""
apply_v144.py — CAS-IN v144 (Vague 2 : Investigation moderne)

CONTEXTE
────────
Après v143 (Mobile/Cloud/Ransomware), il restait 38 fiches orphelines.
Ce delta couvre 8 fiches de la "vague 2 — investigation moderne" :

  - sqlite_forensique
  - sqlite_forensique_avance
  - email_forensique
  - email_headers_smtp_forensique
  - messagerie_im
  - browser_forensique
  - tor_darkweb
  - cryptomonnaies

CONTENU
───────
30 questions de qualité produite à partir du contenu réel des fiches.

  Thèmes :
    • Forensique         : 29 questions
    • Système de fichiers: 1 question (SQLite Avancé)

  Difficultés :
    • easy   : 8  (~27%)
    • medium : 14 (~47%)
    • hard   : 8  (~27%)

  Types :
    • single : 23 (~77%)
    • multi  : 7  (~23%)

ACTIONS (identiques v143)
─────────────────────────
1. Lit scripts/quiz-investigation-moderne.json (bundle source)
2. Fusion dédup dans data/questions.json
3. Lance split_questions.py → régénère les 8 chunks thématiques
4. Régénère search-index, counts.json, README
5. Bump SW v159 → v160

IDEMPOTENT
──────────
Dédup par texte de question.
"""
import os
import re
import shutil
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
    """Fusionner les nouvelles questions dans data/questions.json"""
    print('\n[1/6] Injection des questions dans data/questions.json')

    candidates = [
        Path(__file__).parent.parent / 'scripts' / 'quiz-investigation-moderne.json',
        Path(__file__).parent / 'quiz-investigation-moderne.json',
    ]
    src = next((c for c in candidates if c.exists()), None)
    if not src:
        log('❌', 'quiz-investigation-moderne.json introuvable dans le bundle')
        sys.exit(1)

    new_qs = json.load(open(src))
    log('  ', f'{len(new_qs)} questions à intégrer depuis le bundle')

    qjs = root / 'data' / 'questions.json'
    existing = json.load(open(qjs))

    existing_texts = {q.get('q', '').strip() for q in existing}
    to_add = []
    skipped = 0
    for q in new_qs:
        qtext = q.get('q', '').strip()
        if qtext in existing_texts:
            skipped += 1
        else:
            to_add.append(q)

    if skipped == len(new_qs):
        log('⏭ ', f'Toutes les {len(new_qs)} questions déjà présentes (idempotent)')
        return

    if to_add:
        existing.extend(to_add)
        with open(qjs, 'w', encoding='utf-8') as f:
            json.dump(existing, f, indent=2, ensure_ascii=False)
            f.write('\n')
        log('✅', f'{len(to_add)} questions ajoutées (skip {skipped} doublons), total : {len(existing)}')


def step_2_split_questions(root):
    """Régénérer les chunks via split_questions.py"""
    print('\n[2/6] Régénération des chunks (split_questions.py)')
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
    """Régénérer search-index.json (fiches)"""
    print('\n[3/6] Régénération de data/search-index.json')
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
    """Régénérer counts.json + README"""
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
    """Bump SW v159 → v160"""
    print('\n[5/6] Bump SW v159 → v160')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()

    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v144' in sw:
        log('⏭ ', f'SW déjà bumpé en v144 (cas-in-v{current})')
        return

    new_v = current + 1
    bump = (
        f"// v144 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
        f"// Vague 2 — Investigation moderne : +30 questions sur 8 fiches\n"
        f"// auparavant orphelines :\n"
        f"//   - sqlite_forensique, sqlite_forensique_avance\n"
        f"//   - email_forensique, email_headers_smtp_forensique\n"
        f"//   - messagerie_im, browser_forensique\n"
        f"//   - tor_darkweb, cryptomonnaies\n"
        f"// Total : 2256 → 2286 questions.\n"
        f"// ═══════════════════════════════════════════════════════════════\n"
        f"\n"
        f"const CACHE_VERSION = 'cas-in-v{new_v}';"
    )
    sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(sw)
    log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')


def step_6_validate(root):
    """Validation finale"""
    print('\n[6/6] Validation finale')

    qjs = root / 'data' / 'questions.json'
    d = json.load(open(qjs))
    log('✅', f'data/questions.json : {len(d)} questions')

    target = ['sqlite_forensique', 'sqlite_forensique_avance',
              'email_forensique', 'email_headers_smtp_forensique',
              'messagerie_im', 'browser_forensique',
              'tor_darkweb', 'cryptomonnaies']
    from collections import Counter
    c = Counter()
    for q in d:
        for slug in q.get('fiches', []):
            c[slug.replace('.html', '')] += 1
    for f in target:
        n = c.get(f, 0)
        flag = '✅' if n > 0 else '⚠️ '
        log(flag, f'Fiche \'{f}\' : {n} question(s) la référencent')

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
        log('⚠️ ', f'Chunks : {chunks_total} (vs {len(d)} dans questions.json)')


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN v144 — Vague 2 : Investigation moderne (+30 questions)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_inject_questions(root)
    step_2_split_questions(root)
    step_3_rebuild_search_index(root)
    step_4_rebuild_counts(root)
    step_5_bump_sw(root)
    step_6_validate(root)

    print('\n  ✅ v144 appliqué.')
    print()
    print('  Résultat : 8 fiches DFIR investigation moderne sortent de l\'orphelinat.')
    print('  +30 questions de qualité (mix easy/medium/hard).')
    print('  Reste 30 fiches orphelines (vagues v145 / v146).')


if __name__ == '__main__':
    main()
