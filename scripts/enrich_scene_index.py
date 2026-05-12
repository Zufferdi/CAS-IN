#!/usr/bin/env python3
"""
enrich_scene_index.py — v2.98

Ajoute le champ `region` dans `scenes/index.json` à partir des fichiers
complets `scenes/*.json`. Sans cette info, la branche "International"
de la vue Skill Tree et le filtre EU des Dossiers ne peuvent pas matcher.

Idempotent : ne réécrit que si le champ region est absent ou différent.

Usage : python3 scripts/enrich_scene_index.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / 'scenes' / 'index.json'
SCENES_DIR = ROOT / 'scenes'


def main():
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        index = json.load(f)

    updated = 0
    missing = 0
    for entry in index:
        sid = entry.get('id')
        if not sid:
            continue
        scene_file = SCENES_DIR / f'{sid}.json'
        if not scene_file.exists():
            missing += 1
            continue
        try:
            with open(scene_file, 'r', encoding='utf-8') as f:
                full = json.load(f)
        except Exception:
            missing += 1
            continue
        region = full.get('region')
        if region and entry.get('region') != region:
            entry['region'] = region
            updated += 1

    if updated == 0:
        print(f'[enrich-index] OK : aucun changement (déjà à jour, {missing} fichiers introuvables)')
        return

    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
    print(f'[enrich-index] ✓ {updated} entrées mises à jour ({missing} introuvables)')


if __name__ == '__main__':
    main()
