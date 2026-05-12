#!/usr/bin/env python3
"""
cleanup_fiches.py — Nettoyages combinés sur les fiches/.

Trois opérations idempotentes (relancer le script ne fait rien sur une
fiche déjà clean) :

  ① Supprime <nav class="tn-nav">…</nav> dans les fiches qui ont AUSSI
    <div id="cas-navbar"> (= les 81 fiches actuellement en double-nav).
    Ne touche pas aux 29 fiches non-migrées qui n'ont que tn-nav.

  ② Ajoute <meta name="description"> aux fiches qui en manquent
    (fat32.html, mbr_gpt.html).

  ③ Ajoute fiche-search.js + search-modal.js aux fiches où ils manquent
    (docker_kubernetes_forensique.html, pki_certificats.html).

Usage :
    python3 scripts/cleanup_fiches.py

À lancer une fois (manuellement ou via workflow). Pas besoin de
répéter sur les pushs suivants — c'est un nettoyage one-shot.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FICHES_DIR = ROOT / "fiches"


# ─── Patches ciblés (#2 et #3) ─────────────────────────────────────

META_DESC_PATCHES = {
    "fat32.html": (
        '<meta name="description" content="FAT32 — système de fichiers '
        'Windows · Boot Sector · FSInfo · LFN · chaîne de clusters · '
        'récupération forensique de fichiers supprimés">'
    ),
    "mbr_gpt.html": (
        '<meta name="description" content="MBR & GPT — schémas de '
        'partitionnement · Boot loader · LBA · table de partition · '
        'récupération de partitions effacées">'
    ),
}

FICHE_SEARCH_TARGETS = ["docker_kubernetes_forensique.html", "pki_certificats.html"]

SEARCH_SCRIPTS_TAG = (
    '<script src="../js/components/fiche-search.js" defer></script>\n'
    '<script src="../js/components/search-modal.js" defer></script>\n'
)


# ─── Regex ─────────────────────────────────────────────────────────

# <nav class="tn-nav" ...> ... </nav> (tout le bloc, multi-ligne)
TN_NAV_RE = re.compile(
    r'<nav\s+class="tn-nav"[^>]*>.*?</nav>\s*',
    re.DOTALL,
)
EXTRA_NL_RE = re.compile(r'\n\n\n+')

# Insertion de fiche-search/search-modal : juste après fiche-reader.js
FICHE_READER_RE = re.compile(
    r'(<script src="\.\./js/components/fiche-reader\.js"[^>]*></script>\n)'
)


# ─── Étapes ────────────────────────────────────────────────────────

def remove_tn_nav(content: str) -> tuple[str, bool]:
    """Supprime <nav class=tn-nav>…</nav> SI cas-navbar présent."""
    if '<div id="cas-navbar"' not in content:
        return content, False
    if '<nav class="tn-nav"' not in content:
        return content, False
    new = TN_NAV_RE.sub('', content)
    new = EXTRA_NL_RE.sub('\n\n', new)
    return new, new != content


def add_meta_desc(content: str, desc_tag: str) -> tuple[str, bool]:
    """Insère meta description après <title> si absente."""
    if 'meta name="description"' in content:
        return content, False
    new = re.sub(
        r'(<title>[^<]+</title>)',
        r'\1\n' + desc_tag,
        content,
        count=1,
    )
    return new, new != content


def add_fiche_search(content: str) -> tuple[str, bool]:
    """Ajoute fiche-search.js + search-modal.js après fiche-reader.js."""
    if 'fiche-search.js' in content:
        return content, False
    if 'fiche-reader.js' not in content:
        # Anchor introuvable, on n'invente pas un placement
        return content, False
    new = FICHE_READER_RE.sub(r'\1' + SEARCH_SCRIPTS_TAG, content, count=1)
    return new, new != content


# ─── Main ──────────────────────────────────────────────────────────

def main() -> None:
    if not FICHES_DIR.is_dir():
        raise SystemExit(f"❌ {FICHES_DIR} introuvable")

    summary = {"tn_nav": [], "meta_desc": [], "fiche_search": []}
    untouched = 0

    for f in sorted(FICHES_DIR.glob("*.html")):
        if f.name == "index.html":
            continue

        content = f.read_text(encoding="utf-8")
        original = content

        content, changed = remove_tn_nav(content)
        if changed:
            summary["tn_nav"].append(f.name)

        if f.name in META_DESC_PATCHES:
            content, changed = add_meta_desc(content, META_DESC_PATCHES[f.name])
            if changed:
                summary["meta_desc"].append(f.name)

        if f.name in FICHE_SEARCH_TARGETS:
            content, changed = add_fiche_search(content)
            if changed:
                summary["fiche_search"].append(f.name)

        if content != original:
            f.write_text(content, encoding="utf-8")
        else:
            untouched += 1

    print()
    print("✅ Nettoyage des fiches terminé.")
    print()
    print(f"① tn-nav supprimé    : {len(summary['tn_nav']):>3} fiches")
    print(f"② meta description   : {len(summary['meta_desc']):>3} fiches")
    for n in summary["meta_desc"]:
        print(f"      • {n}")
    print(f"③ fiche-search ajout : {len(summary['fiche_search']):>3} fiches")
    for n in summary["fiche_search"]:
        print(f"      • {n}")
    print()
    print(f"  Non touchées        : {untouched:>3} fiches (déjà propres)")


if __name__ == "__main__":
    main()
