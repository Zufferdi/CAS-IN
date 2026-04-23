#!/usr/bin/env python3
"""
inject-fiche-enhancements.py — Ajoute <script src="../cas-in-fiche.js"></script>
dans toutes les fiches individuelles du dossier fiches/

Usage :
    python3 inject-fiche-enhancements.py fiches/

Le script :
  - Détecte les fiches (tout .html sauf index.html dans fiches/)
  - Ajoute le <script> juste avant </body> si absent
  - Écrit les fichiers sur place (idempotent)
"""
import sys, os, re, argparse


def process_file(path, script_tag):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'cas-in-fiche.js' in content:
        return 'skipped (already injected)'

    if '</body>' not in content:
        return 'SKIPPED (no </body> found)'

    new_content = content.replace('</body>', f'{script_tag}\n</body>', 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return 'patched'


def main():
    parser = argparse.ArgumentParser(description='Injecte cas-in-fiche.js dans chaque fiche')
    parser.add_argument('fiches_dir', help='Chemin vers le dossier fiches/')
    parser.add_argument('--script', default='<script src="../cas-in-fiche.js" defer></script>',
                        help='Balise à injecter (défaut : ../cas-in-fiche.js)')
    args = parser.parse_args()

    if not os.path.isdir(args.fiches_dir):
        print(f'Erreur : {args.fiches_dir} n\'est pas un dossier')
        sys.exit(1)

    html_files = [f for f in os.listdir(args.fiches_dir)
                  if f.endswith('.html') and f != 'index.html']
    html_files.sort()

    print(f'Traitement de {len(html_files)} fiche(s) dans {args.fiches_dir}\n')
    counts = {'patched': 0, 'skipped (already injected)': 0, 'SKIPPED (no </body> found)': 0}
    for name in html_files:
        path = os.path.join(args.fiches_dir, name)
        status = process_file(path, args.script)
        counts[status] = counts.get(status, 0) + 1
        symbol = '✓' if status == 'patched' else ('·' if 'already' in status else '⚠')
        print(f'  {symbol} {name:<35s} → {status}')

    print()
    print('Résumé :')
    for k, v in counts.items():
        print(f'  {v:>3}  {k}')


if __name__ == '__main__':
    main()
