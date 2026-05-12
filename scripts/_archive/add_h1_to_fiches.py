#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
add_h1_to_fiches.py — Ajoute <h1> aux fiches qui n'en ont pas (v2.20)

Améliore l'accessibilité (a11y) et le SEO en ajoutant un titre principal <h1>
aux fiches qui n'en ont pas. Utilise le contenu de <span class="tn-title"> (nav)
ou <span class="bc-current"> (breadcrumb) comme source.

Le <h1> est inséré au début du <div class="header"> avec le style cohérent
des autres fiches (font-size: 2rem, weight: 800).

Idempotent : ne touche pas aux fiches qui ont déjà un <h1>.
Garde la nav tn-title et le breadcrumb intacts (visuel inchangé).

v1.0 — 2026-05-02
"""

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
FICHES_DIR = REPO / 'fiches'

# Style cohérent avec les autres fiches du repo
H1_STYLE = (
    'font-family:var(--sans);font-size:2rem;font-weight:800;'
    'letter-spacing:-.5px;margin:.3rem 0 .15rem'
)


def title_case_smart(s):
    """Convertit un titre EN MAJUSCULES en Title Case intelligent (préserve les mots
    techniques : NTFS, FAT12, MAC, etc.)."""
    if not s:
        return s
    # Mots à laisser tels quels (acronymes, sigles)
    keep = {'NTFS', 'FAT', 'FAT12', 'FAT16', 'FAT32', 'EXT', 'HFS', 'APFS',
            'MAC', 'MACB', 'IOS', 'OSX', 'PCAP', 'IP', 'TCP', 'UDP', 'DNS',
            'API', 'IIS', 'OS', 'PE', 'JSON', 'XML', 'XMP', 'EXIF', 'IPTC',
            'CMD', 'WSL', 'PHP', 'SQL', 'CSS', 'JS', 'CTF', 'OSINT', 'DFIR',
            'CPU', 'GPU', 'RAM', 'ROM', 'SSD', 'HDD', 'USB', 'NAS', 'VM',
            'GDPR', 'LPD', 'LSCPT', 'CPP', 'CCP', 'IEC', 'CC', 'EU', 'CH', 'US',
            'NTLM', 'SMB', 'TLS', 'SSL', 'SSH', 'FTP', 'HTTP', 'HTTPS',
            'AES', 'RSA', 'ECDSA', 'SHA', 'MD5', 'PE', 'ELF',
            'III', 'II', 'IV', 'M365', 'MFT', 'GPT', 'MBR', 'OT', 'IT'}

    words = s.split()
    out = []
    for w in words:
        if w.upper() in keep:
            out.append(w.upper())
        elif w in ['—', '·', '/', '&', '|', 'à', 'de', 'du', 'la', 'le', 'les', 'et', 'en']:
            out.append(w.lower() if w not in '—·/&|' else w)
        else:
            # Title case mais préserve les mots avec ' ou -
            out.append(w.capitalize())
    return ' '.join(out)


def find_title(content):
    """Trouve le meilleur candidat de titre dans la fiche."""
    # 1) tn-title de la nav (souvent en majuscules)
    m = re.search(r'<span class="tn-title">([^<]+)</span>', content)
    if m:
        return title_case_smart(m.group(1).strip())

    # 2) breadcrumb current
    m = re.search(r'<span class="bc-current">([^<]+)</span>', content)
    if m:
        return m.group(1).strip()

    # 3) <title> tag (sans le suffixe " — CAS-IN")
    m = re.search(r'<title>([^<]+)</title>', content)
    if m:
        title = m.group(1).strip()
        # Retirer suffixes typiques
        for suffix in [' — CAS-IN Forensique', ' - CAS-IN', ' — CAS-IN', ' | CAS-IN']:
            if title.endswith(suffix):
                title = title[:-len(suffix)].strip()
        return title

    return None


def add_h1_to_fiche(filepath):
    """Ajoute un <h1> à la fiche si elle n'en a pas. Retourne True si modifié."""
    content = filepath.read_text(encoding='utf-8')

    # Skip si <h1> existe déjà
    if re.search(r'<h1[\s>]', content):
        return False, "déjà h1"

    title = find_title(content)
    if not title:
        return False, "pas de titre source"

    # Construire le tag h1
    h1_tag = f'<h1 style="{H1_STYLE}">{title}</h1>'

    # Stratégie d'insertion : à l'intérieur du .header, juste après le badge
    # Pattern recherché : <div class="header">\n  <div class="badge"...>...</div>\n  <div>
    # On insère le h1 dans le <div> intérieur, avant les <span class="tag">

    # Pattern 1 : <div class="header"> ... <div class="badge">...</div> ... <div>
    pattern1 = re.compile(
        r'(<div class="header"[^>]*>\s*'
        r'<div class="badge"[^>]*>[\s\S]*?</div>\s*'
        r'<div[^>]*>\s*'
        r'<div[^>]*>\s*)'
        r'(<span class="tag)',
        re.MULTILINE
    )
    new_content, n = pattern1.subn(r'\1' + h1_tag + r'\n      \2', content, count=1)
    if n > 0:
        filepath.write_text(new_content, encoding='utf-8')
        return True, f"injecté avant tags : {title}"

    # Pattern 2 : .header ouvert, on l'insère juste après l'ouverture
    pattern2 = re.compile(r'(<div class="header"[^>]*>)', re.MULTILINE)
    new_content, n = pattern2.subn(r'\1\n  ' + h1_tag, content, count=1)
    if n > 0:
        filepath.write_text(new_content, encoding='utf-8')
        return True, f"injecté en haut .header : {title}"

    # Pattern 3 (fallback) : juste après <main id="main-content">
    pattern3 = re.compile(r'(<main id="main-content"[^>]*>)', re.MULTILINE)
    new_content, n = pattern3.subn(r'\1\n<h1 style="' + H1_STYLE + r';padding:1rem 1rem 0">' + title + r'</h1>',
                                    content, count=1)
    if n > 0:
        filepath.write_text(new_content, encoding='utf-8')
        return True, f"injecté en haut <main> : {title}"

    return False, "pas de point d'insertion trouvé"


def main():
    fiches = sorted(f for f in FICHES_DIR.glob('*.html') if f.name != 'index.html')
    print(f"▸ {len(fiches)} fiches à scanner…")
    print()

    modified = 0
    skipped_h1 = 0
    failed = []

    for f in fiches:
        ok, reason = add_h1_to_fiche(f)
        if ok:
            modified += 1
            print(f"  ✓ {f.name:<40} {reason}")
        elif reason == "déjà h1":
            skipped_h1 += 1
        else:
            failed.append((f.name, reason))

    print()
    print(f"═══ Résultats ═══")
    print(f"  Modifiées : {modified}")
    print(f"  Déjà h1   : {skipped_h1}")
    if failed:
        print(f"  Échecs    : {len(failed)}")
        for name, reason in failed:
            print(f"    - {name} : {reason}")
        sys.exit(2)


if __name__ == '__main__':
    main()
