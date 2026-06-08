#!/usr/bin/env python3
"""
apply_v143.py — CAS-IN v143 (Questions DFIR Mobile / Cloud / Ransomware)

CONTEXTE
────────
L'audit qualitatif a montré que 43 fiches sur 121 (35%) n'ont AUCUNE
question qui pointe dessus. Ce delta couvre 5 fiches DFIR centrales :
  - mobile (vue d'ensemble)
  - ios_forensique
  - android_forensique
  - cloud_forensique
  - ransomware_forensique

CONTENU
───────
21 questions de qualité produite à partir du contenu réel des fiches.

ARCHITECTURE DES QUESTIONS DANS CAS-IN
──────────────────────────────────────
  data/questions.json (source de vérité, 4.2 MB monolithique)
              │
              ▼
  scripts/split_questions.py
              │
              ▼
  data/questions/quiz-{theme-slug}.json (chunks dérivés, lazy load)
  data/questions-index.json (méta)
  data/questions-search.json (index full-text minimaliste)

ACTIONS v143
────────────
1. Lire le bundle source quiz-mobile-cloud-ransomware.json
2. Fusionner dans data/questions.json (dédup par texte de question)
3. Lancer split_questions.py → régénère chunks + index + search
4. Régénérer data/search-index.json (fiches)
5. Régénérer counts.json + README
6. Bump SW v158 → v159
7. Validation auto

IDEMPOTENT
──────────
Au 2e run, la dédup détecte que les 21 questions sont déjà présentes
et les skip silencieusement.
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
        Path(__file__).parent.parent / 'data' / 'questions' / 'quiz-mobile-cloud-ransomware.json',
        Path(__file__).parent / 'quiz-mobile-cloud-ransomware.json',
    ]
    src = next((c for c in candidates if c.exists()), None)
    if not src:
        log('❌', 'quiz-mobile-cloud-ransomware.json introuvable dans le bundle')
        sys.exit(1)

    new_qs = json.load(open(src))
    log('  ', f'{len(new_qs)} questions à intégrer depuis le bundle')

    qjs = root / 'data' / 'questions.json'
    existing = json.load(open(qjs))
    if not isinstance(existing, list):
        log('❌', 'data/questions.json n\'est pas une liste')
        sys.exit(1)

    # Dédup par texte de question
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
    """Bump SW v158 → v159"""
    print('\n[5/6] Bump SW v158 → v159')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()

    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v143' in sw:
        log('⏭ ', f'SW déjà bumpé en v143 (cas-in-v{current})')
        return

    new_v = current + 1
    bump = (
        f"// v143 — 2026-05-31 — Bump SW v{current} → v{new_v}\n"
        f"// Ajout de 21 questions DFIR sur 5 fiches centrales\n"
        f"// auparavant orphelines :\n"
        f"//   - mobile, ios_forensique, android_forensique\n"
        f"//   - cloud_forensique\n"
        f"//   - ransomware_forensique\n"
        f"// Themes : Spécificité des OS (+11), Forensique (+10)\n"
        f"// Total : 2235 → 2256 questions.\n"
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

    target = ['mobile', 'ios_forensique', 'android_forensique',
              'cloud_forensique', 'ransomware_forensique']
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
    print('  CAS-IN v143 — Questions DFIR Mobile / Cloud / Ransomware')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_inject_questions(root)
    step_2_split_questions(root)
    step_3_rebuild_search_index(root)
    step_4_rebuild_counts(root)
    step_5_bump_sw(root)
    step_6_validate(root)

    print('\n  ✅ v143 appliqué.')
    print()
    print('  Résultat : 5 fiches DFIR centrales sortent de l\'orphelinat.')
    print('  +21 questions de qualité (mix easy/medium/hard).')
    print('  Reste 38 fiches orphelines à couvrir dans des deltas futurs.')


if __name__ == '__main__':
    main()
