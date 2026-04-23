#!/usr/bin/env python3
"""
generate_counts.py — Génère counts.json à partir des sources du site CAS-IN.

Usage :
    python3 scripts/generate_counts.py [--out counts.json]

Compte :
  - questions  : nombre d'entrées dans questions.json
  - fiches     : nombre de <a class="fiche-card"> dans fiches/index.html
  - scenes     : nombre d'entrées SCENES dans scene.html ou scenes.js
  - tp_categories : nombre de tp-tab dans tp.html (catégories)
  - themes     : nombre de thèmes distincts dans questions.json

Écrit le résultat dans counts.json à la racine du repo.
Sortie non-zéro uniquement en cas d'erreur inattendue ; si un compteur
ne peut pas être calculé, il sort à 0 avec un warning et le script continue.
"""
import sys
import os
import re
import json
import argparse
from datetime import datetime, timezone


def count_questions(repo_root):
    path = os.path.join(repo_root, 'questions.json')
    if not os.path.exists(path):
        return None, None
    try:
        with open(path, encoding='utf-8') as f:
            data = json.load(f)
        if not isinstance(data, list):
            return None, None
        themes = {q.get('theme') for q in data if q.get('theme')}
        return len(data), len(themes)
    except Exception as e:
        print(f'[warn] Impossible de compter les questions : {e}', file=sys.stderr)
        return None, None


def count_fiches(repo_root):
    path = os.path.join(repo_root, 'fiches', 'index.html')
    if not os.path.exists(path):
        return None
    try:
        content = open(path, encoding='utf-8').read()
        return len(re.findall(r'class="fiche-card"', content))
    except Exception as e:
        print(f'[warn] Impossible de compter les fiches : {e}', file=sys.stderr)
        return None


def count_scenes(repo_root):
    # 1er essai : scenes.js à la racine (format : SCENES = [ { ... }, ... ])
    for candidate in ['scenes.js', 'scene/scenes.js']:
        path = os.path.join(repo_root, candidate)
        if os.path.exists(path):
            try:
                content = open(path, encoding='utf-8').read()
                # Recherche des id:'scene_xxx' ou "id": "..."
                ids = set(re.findall(r"""id:\s*['"]([^'"]+)['"]""", content))
                ids_alt = set(re.findall(r'"id"\s*:\s*"([^"]+)"', content))
                count = len(ids | ids_alt)
                if count > 0:
                    return count
            except Exception as e:
                print(f'[warn] Erreur lecture {candidate} : {e}', file=sys.stderr)

    # 2e essai : scene.html peut contenir les scenarios inline
    path = os.path.join(repo_root, 'scene.html')
    if os.path.exists(path):
        try:
            content = open(path, encoding='utf-8').read()
            # Cherche un array SCENES = [ ... ]
            m = re.search(r'(?:var|let|const)\s+SCENES\s*=\s*(\[[\s\S]*?\])\s*;', content)
            if m:
                # Comptage robuste : compte les entrées qui ont un id:
                ids = re.findall(r"""id:\s*['"]([^'"]+)['"]""", m.group(1))
                if ids:
                    return len(ids)
        except Exception as e:
            print(f'[warn] Erreur lecture scene.html : {e}', file=sys.stderr)

    return None


def count_tp_categories(repo_root):
    path = os.path.join(repo_root, 'tp.html')
    if not os.path.exists(path):
        return None
    try:
        content = open(path, encoding='utf-8').read()
        # Compte les data-cat="..." (un par onglet)
        cats = set(re.findall(r'data-cat="([a-z]+)"', content))
        return len(cats) if cats else None
    except Exception as e:
        print(f'[warn] Impossible de compter les catégories TP : {e}', file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(description='Génère counts.json pour le site CAS-IN')
    parser.add_argument('--root', default='.', help='racine du repo (défaut : .)')
    parser.add_argument('--out', default='counts.json', help='chemin de sortie (défaut : counts.json)')
    parser.add_argument('--pretty', action='store_true', help='JSON indenté (pour lisibilité)')
    args = parser.parse_args()

    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        print(f'Erreur : {root} n\'existe pas', file=sys.stderr)
        sys.exit(1)

    print(f'═══ Comptage depuis {root}\n')

    q_count, t_count = count_questions(root)
    f_count = count_fiches(root)
    s_count = count_scenes(root)
    tp_count = count_tp_categories(root)

    counts = {
        'questions':      q_count if q_count is not None else 0,
        'themes':         t_count if t_count is not None else 0,
        'fiches':         f_count if f_count is not None else 0,
        'scenes':         s_count if s_count is not None else 0,
        'tp_categories':  tp_count if tp_count is not None else 0,
        'updated':        datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
    }

    # Affichage lisible
    labels = {
        'questions': 'Questions',
        'themes': 'Thèmes',
        'fiches': 'Fiches',
        'scenes': 'Scènes',
        'tp_categories': 'TP (catégories)',
    }
    for key, label in labels.items():
        val = counts[key]
        mark = '✓' if val > 0 else '⚠'
        print(f'  {mark} {label:<20s} {val}')

    # Écriture
    out_path = os.path.join(root, args.out) if not os.path.isabs(args.out) else args.out
    with open(out_path, 'w', encoding='utf-8') as f:
        if args.pretty:
            json.dump(counts, f, ensure_ascii=False, indent=2)
        else:
            json.dump(counts, f, ensure_ascii=False, separators=(',', ':'))

    print(f'\n✓ Écrit : {out_path} ({os.path.getsize(out_path)} octets)')


if __name__ == '__main__':
    main()
