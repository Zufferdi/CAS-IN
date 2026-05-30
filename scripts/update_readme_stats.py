#!/usr/bin/env python3
"""
update_readme_stats.py — CAS-IN v132y

Régénère automatiquement la dernière ligne du README.md depuis les sources
de vérité (counts.json, npcs.json, campaigns.json, sw.js). Évite l'écueil
des chiffres figés qui dérivent à chaque livraison.

À placer dans scripts/ et lancer depuis la racine du repo :
    python3 scripts/update_readme_stats.py

À chaîner après :
    python3 scripts/generate_counts.py
    python3 scripts/update_readme_stats.py

Idempotent : si la ligne est déjà à jour, ne touche rien.

Sources :
  - data/counts.json    : scenes, fiches, tutoriels, questions, tp_*
  - data/npcs.json      : nombre total de NPCs
  - data/campaigns.json : campagnes totales + sagas narratives
  - sw.js               : version du cache SW

Hardcodés (chiffres stables qui ne sont pas dans counts) :
  - 71 références biblio (bibliography.html)
  - 317 trophées (achievements)
  - 0 trace de tracking
"""
import json
import re
import sys
from pathlib import Path
from datetime import datetime


def find_root():
    here = Path(__file__).resolve().parent
    for c in (here, here.parent):
        if (c / 'sw.js').exists() and (c / 'README.md').exists():
            return c
    print('[error] Racine CAS-IN introuvable.', file=sys.stderr)
    sys.exit(1)


def collect_stats(root):
    """Lit toutes les sources et renvoie un dict de chiffres."""
    stats = {}

    # counts.json
    counts = json.load(open(root / 'data' / 'counts.json'))
    stats['scenes'] = counts.get('scenes', 0)
    stats['fiches'] = counts.get('fiches', 0)
    stats['tutoriels'] = counts.get('tutoriels', 0)
    stats['questions'] = counts.get('questions', 0)
    # TPs : tp_exercises ou tp_categories selon disponibilité
    stats['tps'] = counts.get('tp_exercises') or counts.get('tp_categories', 0)
    stats['version'] = counts.get('version', '3.0.1')

    # npcs.json
    npcs = json.load(open(root / 'data' / 'npcs.json'))['npcs']
    stats['npcs'] = len(npcs)

    # campaigns.json
    campaigns = json.load(open(root / 'data' / 'campaigns.json'))['campaigns']
    stats['campaigns'] = len(campaigns)
    stats['sagas'] = sum(1 for c in campaigns if c.get('narrative'))

    # sw.js
    sw = open(root / 'sw.js').read()
    m = re.search(r"const CACHE_VERSION = '(cas-in-v\d+)';", sw)
    stats['cache_sw'] = m.group(1) if m else 'cas-in-v?'

    # Valeurs hardcodées (stables, peu enclines à changer)
    stats['biblio'] = 71
    stats['trophies'] = 317

    # Date du jour en français
    months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
              'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    today = datetime.now()
    stats['date_fr'] = f"{today.day} {months[today.month - 1]} {today.year}"

    return stats


def format_questions(n):
    """2235 → '2 235' (espace insécable français)"""
    s = str(n)
    if len(s) > 3:
        return s[:-3] + ' ' + s[-3:]
    return s


def build_line(stats):
    """Construit la ligne complète."""
    return (
        f"*Dernière mise à jour de ce README : {stats['date_fr']}, "
        f"version {stats['version']} (cache SW {stats['cache_sw']}) — "
        f"{stats['scenes']} scènes, {stats['npcs']} NPCs, "
        f"{stats['campaigns']} campagnes, {stats['sagas']} sagas, "
        f"{stats['fiches']} fiches, {stats['tutoriels']} tutoriels, "
        f"{stats['tps']} TP, {format_questions(stats['questions'])} questions, "
        f"{stats['biblio']} références biblio, {stats['trophies']} trophées, "
        f"0 trace de tracking.*"
    )


def update_readme(root, new_line):
    """Trouve l'ancienne ligne dans le README et la remplace."""
    readme_path = root / 'README.md'
    with open(readme_path, encoding='utf-8') as f:
        content = f.read()

    # Pattern flexible : la ligne commence par "*Dernière mise à jour de ce README"
    pattern = r'\*Dernière mise à jour de ce README[^*]+\*'
    m = re.search(pattern, content)
    if not m:
        print('  ❌ Ligne stats introuvable dans le README')
        return False

    old_line = m.group(0)
    if old_line == new_line:
        print('  ⏭  Ligne déjà à jour')
        return False

    new_content = content[:m.start()] + new_line + content[m.end():]
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('  ✅ Ligne stats régénérée')
    return True


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN v132y — Régénération auto des stats du README')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    stats = collect_stats(root)
    print('\n  📊 Chiffres collectés :')
    for k in ['scenes', 'npcs', 'campaigns', 'sagas', 'fiches', 'tutoriels',
              'tps', 'questions', 'cache_sw', 'version']:
        print(f'     {k:12s} : {stats[k]}')

    new_line = build_line(stats)
    print(f'\n  📝 Nouvelle ligne :\n     {new_line}')
    print()

    changed = update_readme(root, new_line)

    if changed:
        print('\n  ✅ README.md mis à jour.')
    else:
        print('\n  ✅ Aucun changement nécessaire.')


if __name__ == '__main__':
    main()
