#!/usr/bin/env python3
"""
inject_fiche_reader.py

Injecte la balise <script src="../js/components/fiche-reader.js"></script>
dans chaque fiche de fiches/*.html (sauf index.html).

Le script est inséré juste APRÈS la balise existante de fiche-common.js,
pour respecter l'ordre de chargement (utils communs d'abord).

Idempotent : ignore les fiches qui ont déjà la balise.

Usage : python3 scripts/inject_fiche_reader.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
FICHES_DIR = ROOT / "fiches"

SCRIPT_TAG = '<script src="../js/components/fiche-reader.js" defer></script>'
COMMON_TAG_RE = re.compile(
    r'<script\s+src="\.\./js/components/fiche-common\.js"[^>]*></script>',
    re.IGNORECASE,
)
READER_TAG_RE = re.compile(
    r'<script\s+src="\.\./js/components/fiche-reader\.js"[^>]*></script>',
    re.IGNORECASE,
)


def process(path: Path) -> str:
    """Returns: 'added' | 'already' | 'no-common' | 'error'"""
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        return "error"

    if READER_TAG_RE.search(text):
        return "already"

    common_match = COMMON_TAG_RE.search(text)
    if not common_match:
        return "no-common"

    # Insérer juste après fiche-common.js (sur la même ligne ou à la suite)
    insert_at = common_match.end()
    new_text = text[:insert_at] + "\n    " + SCRIPT_TAG + text[insert_at:]
    path.write_text(new_text, encoding="utf-8")
    return "added"


def main() -> None:
    fiches = sorted(FICHES_DIR.glob("*.html"))
    fiches = [f for f in fiches if f.name != "index.html"]

    counts = {"added": 0, "already": 0, "no-common": [], "error": []}
    for f in fiches:
        result = process(f)
        if result in ("no-common", "error"):
            counts[result].append(f.name)
        else:
            counts[result] += 1

    print(f"▸ {len(fiches)} fiches scannées")
    print(f"  ✓ Ajoutées          : {counts['added']}")
    print(f"  · Déjà présentes    : {counts['already']}")
    if counts["no-common"]:
        print(f"  ⚠ Sans fiche-common  ({len(counts['no-common'])}):")
        for name in counts["no-common"][:5]:
            print(f"      {name}")
        if len(counts["no-common"]) > 5:
            print(f"      … et {len(counts['no-common'])-5} de plus")
    if counts["error"]:
        print(f"  ✗ Erreurs           ({len(counts['error'])}):")
        for name in counts["error"]:
            print(f"      {name}")
        sys.exit(1)


if __name__ == "__main__":
    main()
