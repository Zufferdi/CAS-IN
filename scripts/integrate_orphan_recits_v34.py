#!/usr/bin/env python3
"""
integrate_orphan_recits_v34.py — CAS-IN v3.4

Diagnostic du 8 juin 2026 :
  - 477 scènes sur disque dans /scenes/*.json
  - 399 référencées par campaigns.json (via la liste plate `scenes:[]`)
  - 78 scènes ORPHELINES non rattachées à aucun récit
  - Regroupées par arc → 11 récits complets (7 actes chacun) jamais déclarés
    + 1 scène vraiment isolée (ge-affaire-nog7 a 7 actes, mais ge-affaire-aurora
      a une 8e scène orpheline ; cf. inspection détaillée)

Ce script ajoute les 11 entrées manquantes dans data/campaigns.json avec :
  - id, title, icon, level, order, scenes, narrative, kind  → renseignés
  - subtitle, description, hook                              → marqués "À COMPLÉTER"

Choix éditoriaux (validés avec l'utilisateur) :
  - 9 récits ch-affaire-* (journalisme national) → kind="saga"  🎬
  - 2 récits zh-affaire-cryptomixer & ge-affaire-nog7 → kind="affaire"  📁

À exécuter depuis la racine du repo CAS-IN. Idempotent.
"""
import json
import re
import sys
from pathlib import Path

# Mapping arc_prefix → (id, kind, max_order_offset)
# L'ordre dans cette liste détermine l'order assigné (49 + index)
NEW_RECITS = [
    # 9 sagas journalistiques nationales (ch-affaire-*)
    ("ch-affaire-or-russe",          "saga-or-russe",          "saga"),
    ("ch-affaire-shadow-fleet",      "saga-shadow-fleet",      "saga"),
    ("ch-affaire-coinlaundry",       "saga-coinlaundry",       "saga"),
    ("ch-affaire-osint-yemen",       "saga-osint-yemen",       "saga"),
    ("ch-affaire-pegasus-mobiles",   "saga-pegasus-mobiles",   "saga"),
    ("ch-affaire-frappes-cognitives","saga-frappes-cognitives","saga"),
    ("ch-affaire-police-predictive", "saga-police-predictive", "saga"),
    ("ch-affaire-data-brokers",      "saga-data-brokers",      "saga"),
    ("ch-affaire-donnees-brocante",  "saga-donnees-brocante",  "saga"),
    # 2 affaires cantonales
    ("zh-affaire-cryptomixer",       "saga-cryptomixer",       "affaire"),
    ("ge-affaire-nog7",              "saga-nog7",              "affaire"),
]

PLACEHOLDER = "À COMPLÉTER"


def find_root() -> Path:
    here = Path(__file__).resolve().parent
    for candidate in (here, here.parent):
        if (candidate / "data" / "campaigns.json").exists():
            return candidate
    print("[error] Racine CAS-IN introuvable.", file=sys.stderr)
    sys.exit(1)


def list_arc_scenes(root: Path, arc_prefix: str) -> list[str]:
    """Liste les scènes appartenant à un arc, triées par numéro d'acte."""
    scenes_dir = root / "scenes"
    arc_pattern = re.compile(rf"^{re.escape(arc_prefix)}-(\d+)-")
    matches = []
    for f in scenes_dir.iterdir():
        if not f.name.endswith(".json"):
            continue
        sid = f.name[:-5]
        m = arc_pattern.match(sid)
        if m:
            matches.append((int(m.group(1)), sid))
    matches.sort()
    return [sid for _, sid in matches]


def extract_meta_from_first_scene(root: Path, first_scene_id: str) -> dict:
    """Récupère title (préfixe de série), icon et difficulty depuis la 1ère scène."""
    scene_path = root / "scenes" / f"{first_scene_id}.json"
    with open(scene_path, encoding="utf-8") as f:
        sd = json.load(f)
    full_title = sd.get("title", "?")
    # Titre de série = avant " #" si présent (format "<Série> #N — <sous-titre>")
    if " #" in full_title:
        series_title = full_title.split(" #", 1)[0].strip()
    elif " — " in full_title:
        # Fallback : avant le premier em dash
        series_title = full_title.split(" — ", 1)[0].strip()
    else:
        series_title = full_title.strip()
    icon = sd.get("icon", "📁")
    difficulty = sd.get("difficulty", "medium")
    level_map = {
        "easy": "stagiaire",
        "medium": "inspecteur",
        "hard": "enqueteur",
        "expert": "expert",
    }
    level = level_map.get(difficulty, "enqueteur")
    return {"title": series_title, "icon": icon, "level": level}


def build_campaign_entry(root: Path, arc_prefix: str, new_id: str, kind: str, order: int) -> dict | None:
    """Construit l'entrée campaigns.json pour un récit orphelin."""
    scenes = list_arc_scenes(root, arc_prefix)
    if not scenes:
        print(f"[warn] Aucune scène trouvée pour {arc_prefix}", file=sys.stderr)
        return None
    meta = extract_meta_from_first_scene(root, scenes[0])
    return {
        "id": new_id,
        "icon": meta["icon"],
        "title": meta["title"],
        "subtitle": PLACEHOLDER,
        "description": PLACEHOLDER,
        "level": meta["level"],
        "order": order,
        "narrative": True,
        "scenes": scenes,
        "hook": PLACEHOLDER,
        "kind": kind,
    }


def main():
    root = find_root()
    print(f"[info] Racine CAS-IN : {root}")

    campaigns_path = root / "data" / "campaigns.json"
    with open(campaigns_path, encoding="utf-8") as f:
        data = json.load(f)

    existing_ids = {c.get("id") for c in data["campaigns"]}
    max_order = max((c.get("order", 0) for c in data["campaigns"]), default=0)
    print(f"[info] {len(data['campaigns'])} entrées actuelles. Order max = {max_order}.\n")

    n_added = 0
    n_skipped = 0
    for arc_prefix, new_id, kind in NEW_RECITS:
        if new_id in existing_ids:
            print(f"  ⏭ {new_id:30s}  déjà présent dans campaigns.json")
            n_skipped += 1
            continue
        max_order += 1
        entry = build_campaign_entry(root, arc_prefix, new_id, kind, max_order)
        if entry is None:
            continue
        data["campaigns"].append(entry)
        n_added += 1
        kind_glyph = "🎬" if kind == "saga" else "📁"
        print(f"  ✓ {new_id:30s}  {kind_glyph} {kind:8s} · order {max_order} · "
              f"{len(entry['scenes'])} scènes · niveau {entry['level']:11s} · "
              f"{entry['icon']} {entry['title']}")

    if n_added > 0:
        # Sauvegarde
        with open(campaigns_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"\n[write] {campaigns_path}")
        print(f"\n[info] {n_added} récit(s) ajouté(s) · {n_skipped} déjà présent(s)")
        print(f"[info] Total campaigns.json : {len(data['campaigns'])} entrées")
        print(f"\n  → Champs à compléter manuellement pour chaque nouvelle entrée :")
        print(f"      - subtitle    (ex: \"Saga 7 actes · Or russe via raffineries tessinoises\")")
        print(f"      - description (1-2 phrases sur le récit)")
        print(f"      - hook        (1 phrase d'accroche visible sur la carte)")
        print(f"\n  → Cherche les '{PLACEHOLDER}' dans data/campaigns.json")
        print(f"  → Et bumper le cache SW (sw.js)")
    else:
        print(f"\n[info] Aucun nouveau récit à ajouter. Tout est déjà en place.")


if __name__ == "__main__":
    main()
