#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
inject_fiche_related.py — Injection automatique de fiche-related.js

Pour chaque fiche dans fiches/*.html (hors index.html), vérifie qu'elle
contient bien <script src="../js/components/fiche-related.js" defer></script>.
Si non, l'injecte au bon endroit (après search-modal.js de préférence).

Idempotent : peut être exécuté à chaque build sans risque.
Conçu pour tourner dans GitHub Actions à chaque push de fiche.

v1.0 — 2026-05-02
"""

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
FICHES_DIR = REPO / 'fiches'

SCRIPT_TAG = '<script src="../js/components/fiche-related.js" defer></script>'

# Patterns d'insertion (essayés dans l'ordre)
INSERT_PATTERNS = [
    # 1. Après search-modal.js (cas standard)
    (re.compile(r'(<script src="\.\./js/components/search-modal\.js" defer></script>)'),
     r'\1\n<script src="../js/components/fiche-related.js" defer></script>'),
    # 2. Après fiche-search.js (si search-modal absent)
    (re.compile(r'(<script src="\.\./js/components/fiche-search\.js" defer></script>)'),
     r'\1\n<script src="../js/components/fiche-related.js" defer></script>'),
    # 3. Après fiche-notes.js (autre composant standard)
    (re.compile(r'(<script src="\.\./js/components/fiche-notes\.js" defer></script>)'),
     r'\1\n<script src="../js/components/fiche-related.js" defer></script>'),
    # 4. Avant </body> (dernier recours)
    (re.compile(r'(</body>)'),
     r'<script src="../js/components/fiche-related.js" defer></script>\n\1'),
]


def main():
    if not FICHES_DIR.is_dir():
        print(f"❌ Dossier introuvable : {FICHES_DIR}")
        sys.exit(1)

    fiches = sorted(f for f in FICHES_DIR.glob('*.html') if f.name != 'index.html')
    print(f"▸ {len(fiches)} fiches à scanner…")

    injected = 0
    already = 0
    failed = []

    for f in fiches:
        try:
            content = f.read_text(encoding='utf-8')
        except Exception as e:
            failed.append((f.name, f"lecture impossible : {e}"))
            continue

        # Déjà présent ? skip
        if 'fiche-related.js' in content:
            already += 1
            continue

        # Essayer chaque pattern dans l'ordre
        new_content = None
        for pattern, replacement in INSERT_PATTERNS:
            new_content, n = pattern.subn(replacement, content, count=1)
            if n > 0:
                break

        if new_content is None or new_content == content:
            failed.append((f.name, "aucun pattern d'insertion ne match"))
            continue

        try:
            f.write_text(new_content, encoding='utf-8')
            injected += 1
            print(f"  ✓ {f.name}")
        except Exception as e:
            failed.append((f.name, f"écriture impossible : {e}"))

    print()
    print(f"✓ Injecté dans {injected} fiches")
    print(f"  Déjà présent dans {already} fiches")
    if failed:
        print(f"⚠ {len(failed)} échecs :")
        for name, reason in failed:
            print(f"   - {name} : {reason}")
        sys.exit(2)


if __name__ == '__main__':
    main()
