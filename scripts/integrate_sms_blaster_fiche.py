#!/usr/bin/env python3
"""
integrate_sms_blaster_fiche.py — CAS-IN v132s

Intégration de la fiche sms_blaster.html dans le repo CAS-IN :
  - Ajoute l'entrée dans fiches/index.html (catégorie cat-mobile)
  - Met à jour le compteur "X fiches" de la catégorie mobile
  - Met à jour data/counts.json (fiches +1)

À exécuter depuis la racine du repo CAS-IN, après que fiches/sms_blaster.html ait été copié.
"""
import json
import re
import sys
from pathlib import Path
from datetime import datetime, timezone


def find_root() -> Path:
    here = Path(__file__).resolve().parent
    for candidate in (here, here.parent):
        if (candidate / 'fiches' / 'index.html').exists():
            return candidate
    print('[error] Racine CAS-IN introuvable.', file=sys.stderr)
    sys.exit(1)


# Entrée HTML à insérer dans cat-mobile
NEW_FICHE_ENTRY = """      <a href="sms_blaster.html" class="fiche-card" data-keywords="sms blaster  imsi catcher  fausse antenne  lte 4g 2g  chiffrement nul  a5/0  srsran  sdr ettus  ofcom  ofcs  art 22 ltc  art 269bis cpp  phishing  smishing  zurich  geneve">
        <div class="fiche-icon">📡</div>
        <div class="fiche-name">SMS Blaster</div>
        <div class="fiche-desc">Fausse antenne LTE · Downgrade 2G · Chiffrement nul A5/0 · Cas Zurich-Genève-Toronto · Art. 22 LTC · 269bis CPP</div>
        <span class="fiche-tag">Mobile</span>
      </a>
"""


def main():
    root = find_root()
    print(f'[info] Racine CAS-IN : {root}')

    # 1. Vérifier que la fiche existe
    fiche_path = root / 'fiches' / 'sms_blaster.html'
    if not fiche_path.exists():
        print(f'[error] Fiche {fiche_path} introuvable. Copier d\'abord fiches/sms_blaster.html dans le repo.', file=sys.stderr)
        sys.exit(1)
    print(f'  ✅ Fiche sms_blaster.html présente')

    # 2. Lire l'index des fiches
    index_path = root / 'fiches' / 'index.html'
    with open(index_path, encoding='utf-8') as f:
        idx = f.read()

    if 'sms_blaster.html' in idx:
        print(f'  ⏭ Entrée sms_blaster déjà présente dans index.html')
    else:
        # 3. Trouver la fermeture de cat-mobile et insérer avant
        # Pattern : la catégorie cat-mobile, puis </div> </div> pour fermer fiche-grid et fiche-category
        # On insère juste avant la fermeture du <div class="fiche-grid"> dans cat-mobile

        # Marqueur : on cherche le </div> qui ferme fiche-grid de la catégorie mobile
        # Pour être robuste, on identifie la zone cat-mobile et on insère avant le </div> de fiche-grid

        # Pattern : depuis 'cat-mobile' jusqu'à '<div class="cat-nav" data-cat="mobile">'
        # Le </div> juste avant <div class="cat-nav" data-cat="mobile"> ferme le <div class="fiche-grid">
        cat_nav_marker = '<div class="cat-nav" data-cat="mobile">'
        if cat_nav_marker not in idx:
            print(f'[error] Marqueur {cat_nav_marker} introuvable dans index.html', file=sys.stderr)
            sys.exit(1)

        cat_nav_pos = idx.find(cat_nav_marker)
        # Reculer pour trouver le </div> juste avant
        grid_close = idx.rfind('</div>', 0, cat_nav_pos)
        if grid_close == -1:
            print(f'[error] Fermeture fiche-grid mobile introuvable', file=sys.stderr)
            sys.exit(1)

        # Insérer la nouvelle entrée juste avant le </div>
        new_idx = idx[:grid_close] + NEW_FICHE_ENTRY + idx[grid_close:]

        # 4. Mettre à jour le compteur "X fiches" de la catégorie mobile
        # Pattern : <span class="cat-count" ...>2 fiches</span> dans cat-mobile
        # Capturer "X fiches" et incrémenter
        cat_mobile_section_start = new_idx.find('id="cat-mobile"')
        if cat_mobile_section_start == -1:
            print(f'[error] Section cat-mobile introuvable', file=sys.stderr)
            sys.exit(1)

        # Chercher le span cat-count dans les 1000 caractères suivants
        section_end = cat_mobile_section_start + 2000
        section = new_idx[cat_mobile_section_start:section_end]

        count_match = re.search(r'(<span class="cat-count"[^>]*>)(\d+) fiches?(</span>)', section)
        if count_match:
            old_count = int(count_match.group(2))
            new_count = old_count + 1
            new_count_label = f'{count_match.group(1)}{new_count} fiches{count_match.group(3)}'
            section_updated = section[:count_match.start()] + new_count_label + section[count_match.end():]
            new_idx = new_idx[:cat_mobile_section_start] + section_updated + new_idx[section_end:]
            print(f'  ✅ Compteur cat-mobile : {old_count} → {new_count} fiches')

        # Écrire
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(new_idx)
        print(f'  ✅ Entrée sms_blaster ajoutée à fiches/index.html')

    # 5. Mettre à jour data/counts.json (fiches +1)
    counts_path = root / 'data' / 'counts.json'
    if counts_path.exists():
        with open(counts_path) as f:
            counts = json.load(f)
        old_fiches = counts.get('fiches', 0)
        # Recompter directement les .html dans fiches/ (hors index.html)
        fiches_files = [f for f in (root / 'fiches').glob('*.html') if f.name != 'index.html']
        new_fiches = len(fiches_files)
        counts['fiches'] = new_fiches
        if 'generated_at' in counts:
            counts['generated_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
        with open(counts_path, 'w', encoding='utf-8') as f:
            json.dump(counts, f, ensure_ascii=False, indent=2)
        print(f'  ✅ counts.json : fiches {old_fiches} → {new_fiches}')

    print(f'\n[ok] Fiche SMS Blaster intégrée.')


if __name__ == '__main__':
    main()
