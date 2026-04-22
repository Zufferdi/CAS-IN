#!/usr/bin/env python3
"""
build_manifest.py — Auto-génération du manifest des fiches CAS-IN.

Scanne le dossier fiches/ et reconstruit manifest.json à partir :
  1. Des métadonnées <meta name="cas-in-*"> présentes dans chaque fiche,
  2. D'un manifest existant (pour préserver les entrées personnalisées).

Usage:
    python scripts/build_manifest.py                  # reconstruit manifest.json
    python scripts/build_manifest.py --check          # échoue si incohérence
    python scripts/build_manifest.py --dry-run        # affiche sans écrire
    python scripts/build_manifest.py --fiches-dir X   # dossier personnalisé

Principes :
  - Chaque fiche .html peut déclarer ses métadonnées via <meta> :
        <meta name="cas-in-category" content="windows">
        <meta name="cas-in-icon" content="📁">
        <meta name="cas-in-short-title" content="ShellBags">
        <meta name="cas-in-desc" content="BagMRU · USRCLASS.DAT · …">
        <meta name="cas-in-chapter" content="Ch. 17">
        <meta name="cas-in-is-new" content="true">          # optionnel
        <meta name="cas-in-is-enriched" content="true">     # optionnel
  - Une fiche SANS ces métadonnées est conservée telle quelle si déjà dans
    le manifest existant ; sinon elle est ajoutée en catégorie 'orphans'
    avec un warning.
  - Les catégories, leur ordre et leurs labels proviennent du manifest
    existant (section 'categories'). Elles ne sont pas déduites des fiches.

Branchement GitHub Actions :
  Placer ce script dans scripts/build_manifest.py, puis ajouter un workflow
  qui s'exécute à chaque push et commit le manifest régénéré.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path


# ─── Configuration par défaut ────────────────────────────────────────────
DEFAULT_CATEGORIES = [
    {"id": "systemes",    "icon": "💾",  "title": "Systèmes de Fichiers"},
    {"id": "acquisition", "icon": "📥",  "title": "Acquisition & Méthodes"},
    {"id": "windows",     "icon": "🪟",  "title": "Artefacts Windows"},
    {"id": "crypto",      "icon": "🔐",  "title": "Cryptologie & Sécurité"},
    {"id": "reseau",      "icon": "📡",  "title": "Réseaux & Infrastructure"},
    {"id": "special",     "icon": "📱",  "title": "Systèmes Spéciaux"},
    {"id": "droit",       "icon": "⚖️",  "title": "Droit Suisse"},
    {"id": "outilsdfir",  "icon": "🛠",  "title": "Outils DFIR"},
]

# Fichiers à exclure du scan
EXCLUDED = {"index.html"}

# Regex pour extraire un <meta name="cas-in-xxx" content="yyy">
META_RE = re.compile(
    r'<meta\s+name=["\']cas-in-([^"\']+)["\']\s+content=["\']([^"\']*)["\']',
    re.IGNORECASE,
)


# ─── Parsing des fiches ─────────────────────────────────────────────────
def extract_metadata(html: str) -> dict:
    """Extrait les <meta name="cas-in-*"> d'une fiche HTML."""
    meta = {}
    for match in META_RE.finditer(html):
        key = match.group(1).strip().lower()
        val = match.group(2).strip()
        meta[key] = val
    return meta


def extract_title_fallback(html: str) -> str | None:
    """Fallback : extrait la balise <title> si pas de short-title."""
    m = re.search(r'<title>\s*([^<]+?)\s*</title>', html, re.IGNORECASE)
    if not m:
        return None
    title = m.group(1).strip()
    # Nettoyer les suffixes communs
    for suffix in [" — CAS-IN Forensique", " - CAS-IN Forensique", " — CAS-IN"]:
        if title.endswith(suffix):
            title = title[: -len(suffix)].strip()
    return title or None


def parse_bool(s: str | None) -> bool:
    if not s:
        return False
    return s.strip().lower() in ("true", "1", "yes", "oui")


def parse_fiche(path: Path) -> dict | None:
    """Parse une fiche HTML et retourne son entrée manifest, ou None."""
    try:
        html = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        html = path.read_text(encoding="utf-8", errors="replace")

    meta = extract_metadata(html)

    # Catégorie : obligatoire pour être inclus automatiquement
    category = meta.get("category")
    if not category:
        return None  # fiche sans métadonnée — sera gérée en fallback

    title = meta.get("short-title") or extract_title_fallback(html) or path.stem
    entry = {
        "file": path.name,
        "category": category,
        "icon": meta.get("icon", "📄"),
        "title": title,
        "desc": meta.get("desc", ""),
        "meta": meta.get("chapter", ""),
    }
    if parse_bool(meta.get("is-new")):
        entry["isNew"] = True
    if parse_bool(meta.get("is-enriched")):
        entry["isEnriched"] = True
    return entry


# ─── Construction du manifest ───────────────────────────────────────────
def load_existing_manifest(path: Path) -> dict | None:
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        # Strip des commentaires JSON (clés $comment)
        return data
    except json.JSONDecodeError as e:
        print(f"⚠  manifest.json existant invalide : {e}", file=sys.stderr)
        return None


def build(fiches_dir: Path, existing: dict | None) -> tuple[dict, list[str]]:
    """Construit le manifest. Retourne (manifest, warnings)."""
    warnings = []
    categories = (existing or {}).get("categories") or DEFAULT_CATEGORIES

    # Index des fiches existantes (pour préserver celles sans métadonnées)
    existing_by_file = {}
    if existing:
        for f in existing.get("fiches", []):
            existing_by_file[f["file"]] = f

    fiches = []
    seen = set()

    # Scan des .html dans fiches_dir
    html_files = sorted(fiches_dir.glob("*.html"))
    for path in html_files:
        if path.name in EXCLUDED:
            continue
        parsed = parse_fiche(path)
        if parsed is None:
            # Pas de métadonnées — fallback sur l'existant
            if path.name in existing_by_file:
                fiches.append(existing_by_file[path.name])
                seen.add(path.name)
            else:
                warnings.append(
                    f"⚠  {path.name} : aucune méta cas-in-* et aucune entrée "
                    "dans le manifest existant — ignorée."
                )
            continue
        fiches.append(parsed)
        seen.add(path.name)

    # Vérifier les fichiers référencés dans le manifest existant mais absents
    for file, entry in existing_by_file.items():
        if file not in seen and not (fiches_dir / file).exists():
            warnings.append(
                f"⚠  {file} référencé dans manifest.json mais fichier absent."
            )

    # Trier : par catégorie (selon l'ordre du manifest), puis par meta/title
    cat_order = {c["id"]: i for i, c in enumerate(categories)}
    fiches.sort(key=lambda f: (
        cat_order.get(f["category"], 999),
        f.get("meta", ""),
        f["title"],
    ))

    manifest = {
        "$comment": (
            "Source unique de vérité pour l'index des fiches. "
            "Régénéré par scripts/build_manifest.py — "
            "éditez plutôt les <meta name='cas-in-*'> dans chaque fiche."
        ),
        "version": (existing or {}).get("version", "1.0"),
        "updatedAt": dt.date.today().isoformat(),
        "categories": categories,
        "fiches": fiches,
    }
    return manifest, warnings


# ─── Main ───────────────────────────────────────────────────────────────
def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--fiches-dir", default="fiches",
                        help="Dossier contenant les fiches (défaut: fiches)")
    parser.add_argument("--output", default=None,
                        help="Chemin du manifest (défaut: <fiches-dir>/manifest.json)")
    parser.add_argument("--dry-run", action="store_true",
                        help="N'écrit pas, affiche le résultat")
    parser.add_argument("--check", action="store_true",
                        help="Échoue (exit 1) si le manifest changerait")
    args = parser.parse_args()

    fiches_dir = Path(args.fiches_dir)
    if not fiches_dir.is_dir():
        print(f"❌ Dossier introuvable : {fiches_dir}", file=sys.stderr)
        return 2

    output = Path(args.output) if args.output else fiches_dir / "manifest.json"
    existing = load_existing_manifest(output)
    manifest, warnings = build(fiches_dir, existing)

    # Affichage des warnings
    for w in warnings:
        print(w, file=sys.stderr)

    # Sérialisation
    rendered = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"

    # Mode check : compare sans écrire
    if args.check:
        current = output.read_text(encoding="utf-8") if output.exists() else ""
        if current.strip() != rendered.strip():
            print("❌ manifest.json est désynchronisé. "
                  "Lance le script sans --check pour régénérer.", file=sys.stderr)
            return 1
        print("✓ manifest.json à jour.")
        return 0

    # Mode dry-run
    if args.dry_run:
        print(rendered)
        print(f"\n(dry-run : {len(manifest['fiches'])} fiches · "
              f"{len(manifest['categories'])} catégories)", file=sys.stderr)
        return 0

    # Écriture
    output.write_text(rendered, encoding="utf-8")
    print(f"✓ {output} régénéré : "
          f"{len(manifest['fiches'])} fiches · "
          f"{len(manifest['categories'])} catégories "
          f"({len([f for f in manifest['fiches'] if f.get('isNew')])} nouvelles)")
    if warnings:
        print(f"  ({len(warnings)} warning{'s' if len(warnings) > 1 else ''})",
              file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
