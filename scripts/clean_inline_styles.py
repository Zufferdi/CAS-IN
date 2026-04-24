#!/usr/bin/env python3
"""
clean_inline_styles.py
Supprime les blocs <style>…</style> inline de toutes les fiches HTML.
Chaque fiche garde uniquement <link rel="stylesheet" href="../style/fiche_style.css">.

Utilisation (à la racine du repo) :
    python3 clean_inline_styles.py

Options :
    --dry-run   Affiche ce qui serait changé sans modifier les fichiers
    --dir       Dossier cible (défaut : fiches/)
"""

import re
import os
import glob
import sys
import shutil

DRY_RUN = '--dry-run' in sys.argv
TARGET_DIR = 'fiches'
for arg in sys.argv[1:]:
    if arg.startswith('--dir='):
        TARGET_DIR = arg.split('=', 1)[1]

# ── Regex pour supprimer <style>…</style> (multilignes) ──────────────────────
# Gère aussi les attributs éventuels : <style type="text/css">
STYLE_RE = re.compile(r'\n?\s*<style[^>]*>.*?</style>', re.DOTALL | re.IGNORECASE)

files = sorted(glob.glob(os.path.join(TARGET_DIR, '*.html')))
if not files:
    print(f"❌ Aucun fichier HTML trouvé dans '{TARGET_DIR}/'")
    sys.exit(1)

changed = 0
unchanged = 0

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        original = f.read()

    cleaned = STYLE_RE.sub('', original)

    if cleaned == original:
        unchanged += 1
        print(f"  —  {os.path.basename(path)}  (pas de <style> inline)")
    else:
        blocks = len(STYLE_RE.findall(original))
        diff = len(original) - len(cleaned)
        changed += 1
        print(f"  ✓  {os.path.basename(path)}  ({blocks} bloc(s) supprimé(s), -{diff} octets)")
        if not DRY_RUN:
            # Sauvegarde .bak optionnelle (commenter si non désiré)
            shutil.copy2(path, path + '.bak')
            with open(path, 'w', encoding='utf-8') as f:
                f.write(cleaned)

print()
if DRY_RUN:
    print(f"[DRY RUN] {changed} fichiers seraient modifiés, {unchanged} inchangés.")
    print("Relancer sans --dry-run pour appliquer.")
else:
    print(f"✅ {changed} fichiers modifiés, {unchanged} inchangés.")
    print(f"   Les sauvegardes .bak sont dans fiches/ — supprimer avec :")
    print(f"   find fiches/ -name '*.bak' -delete")
