#!/usr/bin/env python3
"""
Patch fiches/index.html pour corriger les icônes et keywords désynchronisées.

Phase A — fix : prend les icônes thématiques de manifest.json (sources de vérité
                récente) et les applique aux cards de l'index HTML.
Phase B — fix : pour les fiches avec data-keywords="" et fiche-desc="" (souvent
                les deux ensemble), reconstruit les deux depuis manifest.desc.
                Pour les cards dont seul data-keywords est vide, dérive depuis
                la fiche-desc HTML existante.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'manifest.json'
INDEX = ROOT / 'fiches' / 'index.html'

def desc_to_keywords(desc: str) -> str:
    """Convertit 'A · B · C' → 'a  b  c' (lowercase, double-space delimiter,
    cohérent avec le format historique des data-keywords existants)."""
    parts = [p.strip() for p in desc.split('·')]
    parts = [p for p in parts if p]
    return '  '.join(p.lower() for p in parts)

def main():
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    by_file = {f['file']: f for f in manifest['fiches']}

    html = INDEX.read_text(encoding='utf-8')
    original = html

    # Regex tolérante : la description peut être vide.
    # ([^<]*) (asterisque, pas plus) au lieu de ([^<]+) pour matcher aussi les <div class="fiche-desc"></div>.
    card_re = re.compile(
        r'(<a href="([^"]+)" class="fiche-card"[^>]*data-keywords=")([^"]*)("[^>]*>'
        r'\s*<div class="fiche-icon">)([^<]*)(</div>'
        r'\s*<div class="fiche-name">[^<]+</div>'
        r'\s*<div class="fiche-desc">)([^<]*)(</div>)',
        re.DOTALL,
    )

    icon_fixes = 0
    kw_fixes = 0
    desc_fixes = 0
    notfound = []

    def replace(m):
        nonlocal icon_fixes, kw_fixes, desc_fixes
        prefix1, href, current_kw, prefix2, current_icon, mid, current_desc, suffix = m.groups()

        manifest_entry = by_file.get(href)
        if not manifest_entry:
            notfound.append(href)
            return m.group(0)

        # 1) icône depuis le manifest (source de vérité)
        new_icon = manifest_entry.get('icon', current_icon)
        if new_icon != current_icon:
            icon_fixes += 1

        # 2) description depuis le manifest si la card est vide
        new_desc = current_desc
        if not current_desc.strip():
            manifest_desc = manifest_entry.get('desc', '').strip()
            if manifest_desc:
                new_desc = manifest_desc
                desc_fixes += 1

        # 3) keywords : si vide, dérive depuis la description (priorité : desc HTML
        #    actuelle ou nouvelle, sinon manifest.desc directement)
        new_kw = current_kw
        if not current_kw.strip():
            source = new_desc if new_desc.strip() else manifest_entry.get('desc', '')
            new_kw = desc_to_keywords(source)
            if new_kw:
                kw_fixes += 1

        return f'{prefix1}{new_kw}{prefix2}{new_icon}{mid}{new_desc}{suffix}'

    html = card_re.sub(replace, html)

    if html == original:
        print("Aucun changement appliqué.")
        return 0

    INDEX.write_text(html, encoding='utf-8')
    print(f"✅ {icon_fixes} icônes mises à jour depuis manifest.json")
    print(f"✅ {desc_fixes} descriptions reconstruites depuis manifest.desc")
    print(f"✅ {kw_fixes} data-keywords reconstruits")
    if notfound:
        print(f"⚠ {len(notfound)} fiches absentes du manifest : {notfound[:5]}")
    return 0

if __name__ == '__main__':
    sys.exit(main())
