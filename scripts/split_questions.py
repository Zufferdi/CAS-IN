#!/usr/bin/env python3
"""
split_questions.py — CAS-IN

Découpe data/questions.json (4.2 MB, 2235 questions, 8 thèmes) en :
  - data/questions/quiz-{theme-slug}.json : 1 fichier par thème (~500 KB chacun)
  - data/questions-index.json : méta-données (liste des thèmes, comptes, version)

Objectif :
  - Lazy loading côté quiz-app : charger uniquement le thème choisi
  - Économie boot : ~3.7 MB au premier chargement (au lieu de 4.2 MB)

Le fichier d'origine data/questions.json est conservé pour compatibilité
ascendante avec les anciens consommateurs (search, exam mode).

Usage :
    python3 scripts/split_questions.py
"""
import json
import re
import sys
import unicodedata
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path


def slugify(text: str) -> str:
    """Transforme un nom de thème en slug ASCII safe pour un nom de fichier.
    'Informatique de base' → 'informatique-de-base'
    'Spécificité des OS' → 'specificite-des-os'
    """
    # Normaliser les accents
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    # Minuscules + remplacer non-alphanumériques par tirets
    text = re.sub(r'[^a-zA-Z0-9]+', '-', text).strip('-').lower()
    return text


def repo_root() -> Path:
    """Détermine la racine du repo : parent du dossier scripts/."""
    here = Path(__file__).resolve()
    return here.parent.parent


def main():
    root = repo_root()
    print(f'[info] Racine du projet : {root}')

    src = root / 'data' / 'questions.json'
    if not src.exists():
        print(f'[error] {src} introuvable', file=sys.stderr)
        sys.exit(1)

    # Charger les questions
    with open(src, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    if not isinstance(questions, list):
        print(f'[error] questions.json n\'est pas une liste', file=sys.stderr)
        sys.exit(1)

    print(f'[info] {len(questions)} questions chargées')

    # Grouper par thème (préserver l'ordre d'apparition)
    by_theme: dict[str, list] = OrderedDict()
    for q in questions:
        theme = q.get('theme', 'Sans thème')
        by_theme.setdefault(theme, []).append(q)

    print(f'[info] {len(by_theme)} thèmes détectés')

    # Préparer le dossier de sortie
    out_dir = root / 'data' / 'questions'
    out_dir.mkdir(parents=True, exist_ok=True)

    # Écrire chaque chunk
    themes_meta = []
    for theme_name, qs in by_theme.items():
        slug = slugify(theme_name)
        out_path = out_dir / f'quiz-{slug}.json'
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(qs, f, ensure_ascii=False, indent=2)
        size_kb = out_path.stat().st_size // 1024
        themes_meta.append({
            'slug': slug,
            'name': theme_name,
            'icon': qs[0].get('theme_icon', '📝') if qs else '📝',
            'count': len(qs),
            'file': f'data/questions/quiz-{slug}.json',
        })
        print(f'  ✅ {out_path.name} : {len(qs)} questions, {size_kb} KB')

    # Écrire l'index
    index = {
        '$comment': 'Auto-généré par scripts/split_questions.py. Ne pas éditer à la main.',
        'generated_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'total': len(questions),
        'themes': themes_meta,
        'version': 1,  # Bump si le format des chunks change
    }
    index_path = root / 'data' / 'questions-index.json'
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    index_size = index_path.stat().st_size // 1024
    print(f'[ok] data/questions-index.json : {index_size} KB')

    # Recap
    print(f'\n[ok] Découpage terminé : {len(questions)} → {len(by_theme)} chunks')
    print(f'     Taille totale chunks : {sum((out_dir / f"quiz-{m['slug']}.json").stat().st_size for m in themes_meta) // 1024} KB')
    print(f'     Taille d\'origine    : {src.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
