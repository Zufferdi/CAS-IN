#!/usr/bin/env python3
"""
build_fiche_graph.py

Construit data/fiche-graph.json : pour chaque fiche, calcule ses voisines
thématiques (même catégorie) et les fiches connexes (questions partagées).

Le résultat alimente le mode "lecture continue" entre fiches dans la rubrique
fiches/, qui injecte un bandeau "Précédent · Suivant" en bas de chaque fiche
et un indicateur de progression "X/Y fiches lues dans ce thème".

Le graphe a 2 dimensions :
  • "category" — voisinage prioritaire : toutes les fiches de la même catégorie,
    triées alphabétiquement par titre. Permet la navigation linéaire prev/next.
  • "related" — voisinage secondaire : top 5 fiches qui partagent le plus de
    questions (Jaccard similarity), toutes catégories confondues. Pour
    suggestions "tu peux aussi voir…".

Format du fichier généré (data/fiche-graph.json) :

{
  "$generated_at": "...",
  "$schema_version": 1,
  "categories": {
    "acquisition": {
      "icon": "📥",
      "title": "Acquisition",
      "fiches": [
        {"file": "acquisition.html", "title": "Acquisition", "icon": "📥"},
        {"file": "ram_forensique.html", "title": "RAM forensique", "icon": "🧠"},
        ...
      ]
    },
    ...
  },
  "fiches": {
    "acquisition.html": {
      "category": "acquisition",
      "category_index": 0,
      "category_total": 24,
      "prev": {"file": "...", "title": "..."} | null,
      "next": {"file": "...", "title": "..."} | null,
      "related": [
        {"file": "...", "title": "...", "category": "...", "shared": 18},
        ...
      ]
    },
    ...
  }
}

Usage : python3 scripts/build_fiche_graph.py
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Set


ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "data" / "manifest.json"
CROSS_LINKS_PATH = ROOT / "data" / "cross-links.json"
OUT_PATH = ROOT / "data" / "fiche-graph.json"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    manifest = load_json(MANIFEST_PATH)
    cross = load_json(CROSS_LINKS_PATH)
    fiches: List[dict] = manifest["fiches"]
    categories_meta: List[dict] = manifest.get("categories", [])

    # ─── Index par catégorie ───
    cat_index: Dict[str, List[dict]] = {}
    for f in fiches:
        cat = f.get("category", "misc")
        cat_index.setdefault(cat, []).append(f)

    # Trier chaque catégorie alphabétiquement par titre
    for cat in cat_index:
        cat_index[cat].sort(key=lambda x: x.get("title", "").lower())

    # ─── Construire la sortie "categories" ───
    categories_out: Dict[str, dict] = {}
    cat_meta_by_id = {c.get("id", c.get("name", "")): c for c in categories_meta}
    for cat, fiches_in_cat in cat_index.items():
        meta = cat_meta_by_id.get(cat, {})
        categories_out[cat] = {
            "icon": meta.get("icon") or fiches_in_cat[0].get("icon", "📄"),
            "title": meta.get("title") or meta.get("name") or cat.title(),
            "fiches": [
                {
                    "file": f["file"],
                    "title": f.get("title", f["file"]),
                    "icon": f.get("icon", "📄"),
                }
                for f in fiches_in_cat
            ],
        }

    # ─── Construire la sortie "fiches" : prev/next + related ───
    cross_fiches = cross.get("fiches", {})
    fiches_out: Dict[str, dict] = {}

    for f in fiches:
        file = f["file"]
        cat = f.get("category", "misc")
        cat_list = cat_index[cat]
        idx = cat_list.index(f)

        prev_entry = None
        next_entry = None
        if idx > 0:
            p = cat_list[idx - 1]
            prev_entry = {
                "file": p["file"],
                "title": p.get("title", p["file"]),
                "icon": p.get("icon", "📄"),
            }
        if idx < len(cat_list) - 1:
            n = cat_list[idx + 1]
            next_entry = {
                "file": n["file"],
                "title": n.get("title", n["file"]),
                "icon": n.get("icon", "📄"),
            }

        # ─── Calcul des fiches "related" (Jaccard similarity sur questions) ───
        my_qs: Set[int] = set(cross_fiches.get(file, {}).get("questions", []))
        related: List[dict] = []
        for other in fiches:
            if other["file"] == file:
                continue
            other_qs: Set[int] = set(cross_fiches.get(other["file"], {}).get("questions", []))
            if not other_qs or not my_qs:
                continue
            inter = len(my_qs & other_qs)
            if inter < 5:
                continue  # Seuil minimum pour être pertinent
            union = len(my_qs | other_qs)
            jaccard = inter / union if union else 0.0
            related.append({
                "file": other["file"],
                "title": other.get("title", other["file"]),
                "icon": other.get("icon", "📄"),
                "category": other.get("category", "misc"),
                "shared": inter,
                "jaccard": round(jaccard, 3),
            })
        # Trier par jaccard (similarité) décroissante, garder top 5
        related.sort(key=lambda x: (-x["jaccard"], -x["shared"]))
        related = related[:5]
        # Nettoyer le champ jaccard de la sortie (utile pour le tri uniquement)
        for r in related:
            r.pop("jaccard", None)

        fiches_out[file] = {
            "category": cat,
            "category_index": idx,
            "category_total": len(cat_list),
            "prev": prev_entry,
            "next": next_entry,
            "related": related,
        }

    # ─── Écriture ───
    out = {
        "$generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "$schema_version": 1,
        "categories": categories_out,
        "fiches": fiches_out,
    }
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    size_kb = OUT_PATH.stat().st_size / 1024

    # Résumé
    print(f"▸ {len(fiches)} fiches indexées dans {len(cat_index)} catégories")
    print()
    for cat, fs in sorted(cat_index.items(), key=lambda x: -len(x[1])):
        print(f"  {len(fs):3} fiches · {cat}")
    print()
    n_with_related = sum(1 for f in fiches_out.values() if f["related"])
    print(f"▸ Fiches avec ≥1 fiche related : {n_with_related}/{len(fiches)}")
    print(f"✓ {OUT_PATH.relative_to(ROOT)}  ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
