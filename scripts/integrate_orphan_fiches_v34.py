#!/usr/bin/env python3
"""
integrate_orphan_fiches_v34.py — CAS-IN v3.4

Audit du 8 juin 2026 : deux fiches existent sur disque mais ne sont pas
indexées dans manifest.json, fiches-titles.json, fiche-graph.json,
cross-links.json, ni counts.json :

  - fiches/analyse_post_acquisition.html  → catégorie 'methodologie'
  - fiches/sms_blaster.html               → catégorie 'mobile'

Le script integrate_sms_blaster_fiche.py historique ne mettait à jour
que fiches/index.html et counts.json (incomplet). Ce script-ci finit
le travail : il propage les deux fiches dans TOUS les indexes en aval.

Effets :
  1. data/manifest.json     — ajoute 2 entrées dans .fiches[]
  2. data/fiches-titles.json — ajoute 2 entrées <id, title>
  3. data/fiche-graph.json   — ajoute dans .fiches{} (avec prev/next/related vides)
                                + dans .categories.<cat>.fiches[]
                                + maj category_total + maj category_index/prev/next
                                  pour les fiches voisines de la catégorie
  4. data/cross-links.json   — ajoute 2 entrées <id.html, {questions:[], tps:[], scenes:[]}>
  5. data/counts.json        — fiches: 120 → 122

Idempotent : peut être ré-exécuté sans effet si les fiches sont déjà indexées.
À exécuter depuis la racine du repo CAS-IN.
"""
import json
import sys
from pathlib import Path
from datetime import datetime, timezone


# Définition des fiches orphelines à intégrer
ORPHANS = [
    {
        "file": "analyse_post_acquisition.html",
        "category": "methodologie",
        "icon": "🔬",
        "title": "Analyse post-acquisition",
        "desc": "Premiers éléments à examiner · KAPE · Plaso · Volatility · Triage cross-OS",
        "meta": "",
        "title_index": "Analyse post-acquisition — Premiers éléments à examiner",
    },
    {
        "file": "sms_blaster.html",
        "category": "mobile",
        "icon": "📡",
        "title": "SMS Blaster",
        "desc": "Fausse antenne LTE · Downgrade 2G · A5/0 · Cas Zurich-Genève-Toronto · Art. 22 LTC · 269bis CPP",
        "meta": "",
        "title_index": "SMS Blaster",
    },
]


def find_root() -> Path:
    here = Path(__file__).resolve().parent
    for candidate in (here, here.parent):
        if (candidate / "data" / "manifest.json").exists():
            return candidate
    print("[error] Racine CAS-IN introuvable.", file=sys.stderr)
    sys.exit(1)


def load_json(path: Path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data, indent=2):
    # Préserver l'encodage UTF-8 sans \u échappés (cohérent avec le repo)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=indent)
        f.write("\n")


def patch_manifest(manifest: dict, orphan: dict) -> bool:
    """Ajoute la fiche au manifest si absente. Retourne True si modifié."""
    existing = {f["file"]: f for f in manifest.get("fiches", [])}
    if orphan["file"] in existing:
        return False
    manifest["fiches"].append({
        "file": orphan["file"],
        "category": orphan["category"],
        "icon": orphan["icon"],
        "title": orphan["title"],
        "desc": orphan["desc"],
        "meta": orphan["meta"],
    })
    return True


def patch_titles(titles: dict, orphan: dict) -> bool:
    """Ajoute l'entrée <id, title> dans fiches-titles.json."""
    fid = orphan["file"][:-5]  # strip .html
    if fid in titles:
        return False
    titles[fid] = orphan["title_index"]
    return True


def patch_cross_links(cross: dict, orphan: dict) -> bool:
    """Ajoute une entrée vide pour la fiche (à enrichir plus tard avec
    les vraies relations questions/tps/scenes via build_cross_links.py)."""
    fiches_section = cross.setdefault("fiches", {})
    if orphan["file"] in fiches_section:
        return False
    fiches_section[orphan["file"]] = {
        "questions": [],
        "tps": [],
        "scenes": [],
    }
    return True


def patch_counts(counts: dict, n_new: int) -> bool:
    """Incrémente le compteur de fiches si la valeur est encore l'ancienne."""
    if n_new == 0:
        return False
    counts["fiches"] = counts.get("fiches", 0) + n_new
    counts["generated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    counts["$comment"] = (
        counts.get("$comment", "")
        + " · v3.4 : intégration fiches orphelines (analyse_post_acquisition, sms_blaster)"
    ).strip()
    return True


def patch_fiche_graph(graph: dict, orphan: dict) -> bool:
    """Ajoute la fiche dans graph.fiches{} (avec prev/next mis à jour selon
    sa position dans la catégorie) et dans graph.categories.<cat>.fiches[]."""
    fiches = graph.setdefault("fiches", {})
    if orphan["file"] in fiches:
        return False

    cat_id = orphan["category"]
    cats = graph.setdefault("categories", {})
    if cat_id not in cats:
        print(f"[error] Catégorie '{cat_id}' introuvable dans fiche-graph.categories", file=sys.stderr)
        return False
    cat = cats[cat_id]
    cat_fiches: list = cat.setdefault("fiches", [])

    # Trier la catégorie par titre (ordre actuel) puis insérer la nouvelle
    # à sa place alphabétique pour rester cohérent avec le tri visuel.
    new_entry = {
        "file": orphan["file"],
        "title": orphan["title"],
        "icon": orphan["icon"],
    }
    # Position d'insertion : tri par titre, sensible aux accents pas critique
    # (les voisins sont mis à jour ensuite quelle que soit la position).
    cat_fiches.append(new_entry)
    cat_fiches.sort(key=lambda x: x["title"].lower())
    new_idx = cat_fiches.index(new_entry)
    total = len(cat_fiches)

    # Mettre à jour category_total + category_index + prev/next sur TOUTES
    # les fiches de la catégorie (ordre alphabétique re-calculé).
    for i, fent in enumerate(cat_fiches):
        f_file = fent["file"]
        entry = fiches.setdefault(f_file, {
            "category": cat_id,
            "category_index": i,
            "category_total": total,
            "prev": None,
            "next": None,
            "related": [],
        })
        entry["category"] = cat_id
        entry["category_index"] = i
        entry["category_total"] = total
        entry["prev"] = (
            {k: cat_fiches[i - 1][k] for k in ("file", "title", "icon")}
            if i > 0 else None
        )
        entry["next"] = (
            {k: cat_fiches[i + 1][k] for k in ("file", "title", "icon")}
            if i < total - 1 else None
        )
        # related : on garde l'existant ; pour la nouvelle fiche c'est []
        entry.setdefault("related", [])

    # Mise à jour timestamp + counts du graph
    graph["$generated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    counts = graph.setdefault("$counts", {})
    counts["fiches"] = len(fiches)
    return True


def main():
    root = find_root()
    print(f"[info] Racine CAS-IN : {root}")

    # 1. Vérifier que les fiches HTML existent bien sur disque
    for o in ORPHANS:
        path = root / "fiches" / o["file"]
        if not path.exists():
            print(f"[error] Fiche {path} introuvable.", file=sys.stderr)
            sys.exit(1)
        print(f"  ✅ {o['file']} présente sur disque ({path.stat().st_size // 1024} KB)")

    # 2. Charger tous les indexes
    manifest_path = root / "data" / "manifest.json"
    titles_path = root / "data" / "fiches-titles.json"
    graph_path = root / "data" / "fiche-graph.json"
    cross_path = root / "data" / "cross-links.json"
    counts_path = root / "data" / "counts.json"

    manifest = load_json(manifest_path)
    titles = load_json(titles_path)
    graph = load_json(graph_path)
    cross = load_json(cross_path)
    counts = load_json(counts_path)

    # 3. Patcher chaque index
    n_new_in_manifest = 0
    n_new_in_titles = 0
    n_new_in_cross = 0
    n_new_in_graph = 0

    for o in ORPHANS:
        if patch_manifest(manifest, o):
            n_new_in_manifest += 1
            print(f"  ✓ manifest.json     ← {o['file']}")
        else:
            print(f"  ⏭ manifest.json     ← {o['file']} déjà présent")

        if patch_titles(titles, o):
            n_new_in_titles += 1
            print(f"  ✓ fiches-titles     ← {o['file']}")
        else:
            print(f"  ⏭ fiches-titles     ← {o['file']} déjà présent")

        if patch_cross_links(cross, o):
            n_new_in_cross += 1
            print(f"  ✓ cross-links       ← {o['file']}")
        else:
            print(f"  ⏭ cross-links       ← {o['file']} déjà présent")

        if patch_fiche_graph(graph, o):
            n_new_in_graph += 1
            print(f"  ✓ fiche-graph       ← {o['file']} (catégorie {o['category']})")
        else:
            print(f"  ⏭ fiche-graph       ← {o['file']} déjà présent")

    # 4. Compter avec le nombre maximum effectivement ajouté
    n_added = max(n_new_in_manifest, n_new_in_titles, n_new_in_cross, n_new_in_graph)
    if patch_counts(counts, n_added):
        print(f"  ✓ counts.json      ← fiches +{n_added} (= {counts['fiches']})")
    else:
        print(f"  ⏭ counts.json      ← rien à faire")

    # 5. Sauvegarder uniquement ce qui a été modifié
    if n_new_in_manifest:
        save_json(manifest_path, manifest)
        print(f"\n[write] {manifest_path}")
    if n_new_in_titles:
        save_json(titles_path, titles)
        print(f"[write] {titles_path}")
    if n_new_in_graph:
        save_json(graph_path, graph)
        print(f"[write] {graph_path}")
    if n_new_in_cross:
        # cross-links.json est minifié (1 ligne) dans le repo — préserver ce format
        with open(cross_path, "w", encoding="utf-8") as f:
            json.dump(cross, f, ensure_ascii=False, separators=(",", ":"))
        print(f"[write] {cross_path}  (minifié)")
    if n_added:
        save_json(counts_path, counts)
        print(f"[write] {counts_path}")

    # 6. Récap final
    print(f"\n[info] {n_added} fiche(s) intégrée(s) :")
    for o in ORPHANS:
        print(f"   - {o['file']}  →  catégorie '{o['category']}'  →  {o['title_index']}")
    if n_added == 0:
        print("\n  → Toutes les fiches étaient déjà indexées. Aucun changement.")
    else:
        print("\n  → Prochaine étape : régénérer search-index.json si besoin")
        print(f"      python3 scripts/build_search_index.py")
        print(f"  → Et bumper le cache SW (sw.js)")


if __name__ == "__main__":
    main()
