#!/usr/bin/env python3
"""
generate_sitemap.py — CAS-IN
Génère sitemap.xml à partir de la liste réelle des pages HTML du repo.

Usage :
    python3 scripts/generate_sitemap.py

À appeler à chaque push depuis la CI (ou manuellement) pour maintenir
le sitemap synchronisé avec l'arborescence.
"""
import glob
import os
import sys
from datetime import datetime
from pathlib import Path


BASE_URL = 'https://zufferdi.github.io/CAS-IN'


def repo_root() -> Path:
    here = Path(__file__).resolve()
    # scripts/generate_sitemap.py → parent = scripts/ → parent.parent = root
    return here.parent.parent


def generate(root: Path) -> str:
    today = datetime.now().strftime('%Y-%m-%d')
    entries = []

    # 1. Index racine
    entries.append((f'{BASE_URL}/', today, 'weekly', '1.0'))

    # 2. Hubs principaux (racine, hors index)
    for page in ['apprendre.html', 'tutoriels.html', 'tp.html', 'scene.html', 'quiz.html']:
        if (root / page).exists():
            entries.append((f'{BASE_URL}/{page}', today, 'weekly', '0.9'))

    # 3. Pages secondaires
    for p in sorted((root / 'pages').glob('*.html')):
        entries.append((f'{BASE_URL}/pages/{p.name}', today, 'monthly', '0.7'))

    # 4. Fiches
    for p in sorted((root / 'fiches').glob('*.html')):
        prio = '0.8' if p.name == 'index.html' else '0.6'
        freq = 'weekly' if p.name == 'index.html' else 'monthly'
        entries.append((f'{BASE_URL}/fiches/{p.name}', today, freq, prio))

    # 5. Tutoriels (cluster v124+)
    for p in sorted((root / 'tutoriels').glob('*.html')):
        entries.append((f'{BASE_URL}/tutoriels/{p.name}', today, 'monthly', '0.7'))

    # 6. Références
    for p in sorted((root / 'references').glob('*.html')):
        prio = '0.8' if p.name == 'index.html' else '0.6'
        freq = 'weekly' if p.name == 'index.html' else 'monthly'
        entries.append((f'{BASE_URL}/references/{p.name}', today, freq, prio))

    xml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, lastmod, freq, prio in entries:
        xml.extend([
            '  <url>',
            f'    <loc>{loc}</loc>',
            f'    <lastmod>{lastmod}</lastmod>',
            f'    <changefreq>{freq}</changefreq>',
            f'    <priority>{prio}</priority>',
            '  </url>'
        ])
    xml.append('</urlset>')

    return '\n'.join(xml) + '\n', len(entries)


def main():
    root = repo_root()
    print(f'[info] Racine du projet : {root}')
    xml, n = generate(root)
    out = root / 'sitemap.xml'
    out.write_text(xml, encoding='utf-8')
    print(f'[ok] sitemap.xml généré : {n} URLs → {out}')


if __name__ == '__main__':
    main()
