#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
migrate_fiche_common.py — Migration vers fiche-common.js (v2.20)

Supprime les blocs <script> inline répétés dans les fiches HTML (~5 KB chacun)
et ajoute à la place <script src="../js/components/fiche-common.js" defer></script>.

Patterns supprimés :
  • Scroll-progress + back-top
  • Quiz reveal
  • Collapsibles
  • Tab switching (showTab function et T(id) function)

Sécurité :
  • Idempotent : si fiche-common.js est déjà inclus, ne touche pas au reste
  • Conserve les <script src="..."> (modules externes)
  • Conserve la logique fiche-spécifique (variables custom, archDetails, etc.)
  • Backup .bak.html optionnel via --backup

Usage :
  python3 scripts/migrate_fiche_common.py            # tous les fichiers
  python3 scripts/migrate_fiche_common.py --dry-run  # voir sans modifier
  python3 scripts/migrate_fiche_common.py --backup   # crée des .bak.html

v1.0 — 2026-05-02
"""

import re
import sys
import argparse
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
FICHES_DIR = REPO / 'fiches'
COMMON_SCRIPT = '<script src="../js/components/fiche-common.js" defer></script>'

# ─── Patterns à supprimer dans les <script> inline ────────────────────────────
# Chaque pattern est une regex DOTALL qui capture un bloc complet (ou plusieurs lignes)

# 1) IIFE scroll-progress + back-top combinés ou séparés
P_SCROLL_BACKTOP_COMBO = re.compile(
    r"\(function\(\)\s*\{\s*"
    r"var\s+bar\s*=\s*document\.getElementById\(['\"]scroll-progress['\"]\)[\s\S]*?"
    r"var\s+bt\s*=\s*document\.getElementById\(['\"]back-top['\"]\)[\s\S]*?"
    r"\}\s*\)\s*\(\s*\)\s*;?\s*",
    re.MULTILINE
)
# Variante : juste back-top dans IIFE seul
P_BACKTOP_ALONE = re.compile(
    r"\(function\(\)\s*\{\s*"
    r"var\s+btn\s*=\s*document\.getElementById\(['\"]back-top['\"]\)\s*;?\s*"
    r"if\s*\(\s*btn\s*\)\s*window\.addEventListener\(\s*['\"]scroll['\"][\s\S]*?"
    r"\}\s*\)\s*\(\s*\)\s*;?\s*",
    re.MULTILINE
)
# Variante : scroll bar dehors d'IIFE (ligne directe)
P_SCROLL_DIRECT = re.compile(
    r"var\s+bar\s*=\s*document\.getElementById\(['\"]scroll-progress['\"]\)\s*;?\s*"
    r"if\s*\(\s*bar\s*\)\s*window\.addEventListener\(\s*['\"]scroll['\"]\s*,[^;]+;?\s*",
    re.MULTILINE
)

# 2) Quiz reveal (forEach sur .quiz-reveal-btn) - 2 syntaxes : function() et arrow
P_QUIZ_REVEAL = re.compile(
    r"document\.querySelectorAll\(\s*['\"]\.quiz-reveal-btn['\"]\)\.forEach\(\s*"
    r"(?:function\s*\(\s*btn\s*\)|btn\s*=>)\s*\{[\s\S]*?"
    r"btn\.textContent\s*=\s*ans\.classList\.contains\(['\"]visible['\"]\)\s*\?\s*['\"]Masquer[\s\S]*?"
    r"\}\s*\)\s*;?\s*\}\s*\)\s*;?\s*",
    re.MULTILINE
)

# 3) Collapsibles (forEach sur .collapsible-header)
P_COLLAPSIBLE = re.compile(
    r"document\.querySelectorAll\(\s*['\"]\.collapsible-header['\"]\)\.forEach\(\s*function\s*\(\s*h\s*\)\s*\{[\s\S]*?"
    r"h\.closest\(['\"]\.collapsible['\"]\)\.classList\.toggle\(['\"]open['\"]\)\s*;?\s*"
    r"\}\s*\)\s*;\s*\}\s*\)\s*;?\s*",
    re.MULTILINE
)

# Patterns à compter (pour stats) mais NON supprimés (fiche-spécifiques)
P_SHOWTAB = re.compile(r"function\s+showTab\s*\(", re.MULTILINE)
P_TLOWER = re.compile(r"function\s+T\s*\(\s*id\s*\)", re.MULTILINE)


def clean_script_block(script_content):
    """Nettoie un bloc <script>...</script> en retirant les patterns communs.
    Retourne (cleaned_content, n_patterns_removed).
    """
    n_removed = 0
    original = script_content

    # 1) Pattern combiné scroll + backtop
    new, n = P_SCROLL_BACKTOP_COMBO.subn('', script_content)
    n_removed += n
    script_content = new

    # 2) Pattern back-top seul
    new, n = P_BACKTOP_ALONE.subn('', script_content)
    n_removed += n
    script_content = new

    # 3) Pattern scroll bar direct
    new, n = P_SCROLL_DIRECT.subn('', script_content)
    n_removed += n
    script_content = new

    # 4) Quiz reveal
    new, n = P_QUIZ_REVEAL.subn('', script_content)
    n_removed += n
    script_content = new

    # 5) Collapsibles
    new, n = P_COLLAPSIBLE.subn('', script_content)
    n_removed += n
    script_content = new

    # Nettoyer commentaires orphelins liés aux patterns supprimés
    script_content = re.sub(r"//\s*━+\s*Scroll[^\n]*\n", "", script_content)
    script_content = re.sub(r"//\s*━+\s*Back-top[^\n]*\n", "", script_content)
    script_content = re.sub(r"//\s*━+\s*Quiz reveal[^\n]*\n", "", script_content)
    script_content = re.sub(r"//\s*━+\s*Tab switching[^\n]*\n", "", script_content)
    script_content = re.sub(r"//\s*──\s*Scroll[^\n]*\n", "", script_content)
    script_content = re.sub(r"//\s*──\s*Back-top[^\n]*\n", "", script_content)
    script_content = re.sub(r"//\s*──\s*Scroll \+ Back-top[^\n]*\n", "", script_content)
    script_content = re.sub(r"//\s*──\s*Quiz reveal[^\n]*\n", "", script_content)
    script_content = re.sub(r"//\s*──\s*Collapsible[^\n]*\n", "", script_content)

    # Nettoyer lignes vides multiples
    script_content = re.sub(r'\n{3,}', '\n\n', script_content)
    script_content = script_content.strip()

    return script_content, n_removed


def process_fiche(filepath, dry_run=False, backup=False):
    """Traite une fiche : retire les patterns inline, ajoute fiche-common.js.
    Retourne un dict de stats.
    """
    content = filepath.read_text(encoding='utf-8')
    original = content

    stats = {
        'file': filepath.name,
        'patterns_removed': 0,
        'common_added': False,
        'inline_scripts_emptied': 0,
        'bytes_before': len(original),
        'bytes_after': 0,
        'showtab_kept': bool(P_SHOWTAB.search(content) or P_TLOWER.search(content)),
    }

    # Si fiche-common.js déjà présent, on continue quand même pour nettoyer
    # les patterns résiduels (variantes pas matchées au 1er run). On ne
    # ré-injectera pas le tag (vérifié plus bas avec stats['common_added']).
    common_already_present = 'fiche-common.js' in content

    # Trouver et nettoyer chaque bloc <script>...</script> SANS src
    # (les scripts avec src= sont externes, on n'y touche pas)
    def repl_script(m):
        tag_open = m.group(1)   # <script ...>
        body = m.group(2)        # contenu
        tag_close = m.group(3)  # </script>
        # Si <script src="...">, ne rien faire
        if 'src=' in tag_open.lower():
            return m.group(0)
        cleaned, n = clean_script_block(body)
        stats['patterns_removed'] += n
        # Si le bloc devient vide (ou juste blanc), on supprime tout le tag
        if not cleaned.strip():
            stats['inline_scripts_emptied'] += 1
            return ''
        return tag_open + '\n' + cleaned + '\n' + tag_close

    # Regex pour matcher <script ...>body</script> (sans src auto-fermant)
    new_content = re.sub(
        r'(<script(?:\s[^>]*)?>)([\s\S]*?)(</script>)',
        repl_script,
        content
    )

    # Ajouter fiche-common.js sur TOUTES les fiches (pas seulement celles modifiées) :
    # cela active barre scroll/back-top/quiz-reveal/collapsibles uniformément,
    # même sur les fiches qui n'avaient pas le JS associé à leur HTML.
    # Positions d'insertion par ordre de préférence
    if not common_already_present:
        insertion_patterns = [
            (re.compile(r'(<script src="\.\./js/components/theme-toggle\.js" defer></script>)'),
             r'\1\n' + COMMON_SCRIPT),
            (re.compile(r'(<script src="\.\./js/components/fiche-notes\.js" defer></script>)'),
             COMMON_SCRIPT + r'\n\1'),
            (re.compile(r'(<script src="\.\./js/components/fiche-search\.js" defer></script>)'),
             COMMON_SCRIPT + r'\n\1'),
            (re.compile(r'(</body>)'),
             COMMON_SCRIPT + r'\n\1'),
        ]
        for pattern, replacement in insertion_patterns:
            new_text, n = pattern.subn(replacement, new_content, count=1)
            if n > 0:
                new_content = new_text
                stats['common_added'] = True
                break

    stats['bytes_after'] = len(new_content)

    # Écriture
    if not dry_run and new_content != original:
        if backup:
            backup_path = filepath.with_suffix('.bak.html')
            backup_path.write_text(original, encoding='utf-8')
        filepath.write_text(new_content, encoding='utf-8')

    return stats


def main():
    parser = argparse.ArgumentParser(description='Migration vers fiche-common.js')
    parser.add_argument('--dry-run', action='store_true', help='Ne pas modifier les fichiers')
    parser.add_argument('--backup', action='store_true', help='Créer des .bak.html')
    parser.add_argument('--verbose', action='store_true', help='Détails par fiche')
    args = parser.parse_args()

    if not FICHES_DIR.is_dir():
        print(f"❌ Dossier introuvable : {FICHES_DIR}")
        sys.exit(1)

    fiches = sorted(f for f in FICHES_DIR.glob('*.html') if f.name != 'index.html')
    print(f"▸ {len(fiches)} fiches à traiter…")
    if args.dry_run:
        print("  (mode --dry-run : aucun fichier modifié)")
    print()

    total_bytes_before = 0
    total_bytes_after = 0
    total_patterns_removed = 0
    total_emptied = 0
    fiches_modified = 0
    fiches_already = 0
    fiches_with_showtab = 0

    for f in fiches:
        s = process_fiche(f, dry_run=args.dry_run, backup=args.backup)
        total_bytes_before += s['bytes_before']
        total_bytes_after += s['bytes_after']
        total_patterns_removed += s['patterns_removed']
        total_emptied += s['inline_scripts_emptied']
        if s['showtab_kept']:
            fiches_with_showtab += 1
        if 'fiche-common.js' in f.read_text(encoding='utf-8'):
            if s['patterns_removed'] > 0 or s['inline_scripts_emptied'] > 0:
                fiches_modified += 1
            else:
                fiches_already += 1
        if args.verbose and s['patterns_removed'] > 0:
            print(f"  ✓ {s['file']:<40} -{s['patterns_removed']} patterns,"
                  f" -{s['bytes_before']-s['bytes_after']:>5} octets")

    print()
    print(f"═══ Résultats ═══")
    print(f"  Fiches modifiées : {fiches_modified}")
    print(f"  Fiches déjà à jour : {fiches_already}")
    print(f"  Patterns retirés (total) : {total_patterns_removed}")
    print(f"  Blocs <script> entièrement vidés : {total_emptied}")
    print(f"  Économie : {total_bytes_before - total_bytes_after} octets "
          f"(~{(total_bytes_before - total_bytes_after) / 1024:.1f} KB)")
    print(f"  Fiches avec showTab/T() conservé (custom) : {fiches_with_showtab}")


if __name__ == '__main__':
    main()
