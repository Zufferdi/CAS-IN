#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_scenes_index.py — Régénère scenes/index.json (v2.20)

Reconstruit scenes/index.json à partir des fichiers individuels scenes/*.json,
en extrayant les métadonnées nécessaires au lazy-loading par scene-app.js.

Format de chaque entrée :
  {
    "id": "...", "title": "...", "icon": "...",
    "difficulty": "...", "atmosphere": "...",
    "tags": [...], "intro": "...", "alertLevel": "...",
    "stepCount": N, "legalRefs": [...]
  }

Idempotent : peut tourner après chaque modif de scène, à chaque commit.
Conçu pour être inclus dans le workflow GitHub Actions.

v1.0 — 2026-05-02
"""

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SCENES_DIR = REPO / 'scenes'
INDEX_FILE = SCENES_DIR / 'index.json'

# Champs à extraire pour chaque scène
INDEX_FIELDS = ['id', 'title', 'icon', 'difficulty', 'atmosphere',
                'tags', 'intro', 'alertLevel', 'legalRefs']


def main():
    if not SCENES_DIR.is_dir():
        print(f"❌ Dossier introuvable : {SCENES_DIR}")
        sys.exit(1)

    files = sorted(f for f in SCENES_DIR.glob('*.json') if f.name != 'index.json')
    print(f"▸ {len(files)} scènes à indexer…")

    entries = []
    errors = []

    for f in files:
        try:
            scene = json.loads(f.read_text(encoding='utf-8'))
        except json.JSONDecodeError as e:
            errors.append((f.name, f"JSON invalide : {e}"))
            continue

        # Vérifier les champs essentiels
        if not scene.get('id'):
            errors.append((f.name, "champ 'id' manquant"))
            continue
        if not scene.get('title'):
            errors.append((f.name, "champ 'title' manquant"))
            continue

        # Construire l'entrée minimale
        entry = {}
        for field in INDEX_FIELDS:
            if field in scene:
                entry[field] = scene[field]

        # stepCount = nombre d'éléments dans 'steps'
        steps = scene.get('steps', [])
        entry['stepCount'] = len(steps) if isinstance(steps, list) else 0

        # Vérification de cohérence : id devrait correspondre au nom de fichier
        expected_id = f.stem
        if entry['id'] != expected_id:
            errors.append((f.name, f"id={entry['id']!r} mais nom={expected_id!r}"))
            # On garde quand même l'entrée

        entries.append(entry)

    # Tri stable par id pour reproductibilité
    entries.sort(key=lambda e: e.get('id', ''))

    # Statistiques
    print(f"  ✓ {len(entries)} entrées générées")
    if errors:
        print(f"  ⚠ {len(errors)} erreur(s) :")
        for name, reason in errors:
            print(f"    - {name} : {reason}")

    # Comparer avec l'existant
    if INDEX_FILE.exists():
        try:
            old = json.loads(INDEX_FILE.read_text(encoding='utf-8'))
            old_n = len(old) if isinstance(old, list) else 0
            print(f"  Avant : {old_n} entrées · Après : {len(entries)} entrées")
            if old_n != len(entries):
                old_ids = {e.get('id') for e in old} if isinstance(old, list) else set()
                new_ids = {e['id'] for e in entries}
                added = new_ids - old_ids
                removed = old_ids - new_ids
                if added:
                    print(f"  + Ajoutées : {sorted(added)}")
                if removed:
                    print(f"  - Retirées : {sorted(removed)}")
        except Exception:
            pass

    # Écriture
    INDEX_FILE.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8'
    )
    size = INDEX_FILE.stat().st_size
    print(f"\n✓ {INDEX_FILE.relative_to(REPO)}  ({size / 1024:.1f} KB)")

    # Sortie code différenciée pour CI
    if errors:
        sys.exit(2)


if __name__ == '__main__':
    main()
