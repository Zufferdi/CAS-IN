#!/usr/bin/env python3
"""
fix_scenes.py — Correctifs safe sur les fichiers de scènes CAS-IN.

Corrige les 7 bugs identifiés dans AUDIT-SCENES.md sans toucher aux IDs ni à
l'ordre des scènes (donc sans casser le state utilisateur persisté).

USAGE
─────
    python3 scripts/fix_scenes.py --dry-run      # rapport seul
    python3 scripts/fix_scenes.py                # applique tous les fixes
    python3 scripts/fix_scenes.py --only=1,2,3   # n'applique que les fixes 1-3

FIXES (par numéro)
─────
  1. Normaliser regionDetail des 12 sagas FR-Sarine + VS-Viège
     (canton → code, en gardant les champs additionnels comme commune/company)
  2. Ajouter `region: "EU"` aux 10 fichiers eu-* qui ne l'ont pas
  3. Normaliser le format `npcs` des 5 scènes FR-Sarine (dicts → strings)
  4. Ajouter `regionDetail.code = "VD"` à 72969-infractions-vaud
  5. Renommer code 'CHF' → 'CONF' (cosmétique, évite la confusion currency)
  6. Normaliser tous les tags en MAJUSCULES (consistance, déduplication)
  7. Régénérer scenes/index.json pour inclure le champ `region`

Le fix #5 est cosmétique et désactivé par défaut (--include-cosmetic).

IDEMPOTENCE : relancer le script ne fait rien si tout est déjà OK.
"""
from __future__ import annotations
import sys, json, argparse
from pathlib import Path
from collections import Counter


# ═══════════════════════════════════════════════════════════════
# Config
# ═══════════════════════════════════════════════════════════════
SAGA_FR = [
    "fr-affaire-sarine-1-premier-appel",
    "fr-affaire-sarine-2-eimp-stuttgart",
    "fr-affaire-sarine-3-coordination-cantons",
    "fr-affaire-sarine-4-expertise-unifr",
    "fr-affaire-sarine-5-audience-recevabilite",
]
SAGA_VS = [
    "vs-affaire-viege-1-avalanche-saas",
    "vs-affaire-viege-2-osint-bricolage",
    "vs-affaire-viege-3-mercure-lonza",
    "vs-affaire-viege-4-scada-mattmark",
    "vs-affaire-viege-5-eimp-milano",
    "vs-affaire-viege-6-perquisition-brig",
    "vs-affaire-viege-7-audience-tribunal",
]

# Mapping code canton → nom canonique pour synchroniser flag/name
CANTON_NAMES = {
    "GE": "Genève", "VD": "Vaud", "VS": "Valais", "FR": "Fribourg",
    "NE": "Neuchâtel", "JU": "Jura", "BE": "Berne", "ZH": "Zurich",
    "SZ": "Schwyz", "TI": "Tessin", "SG": "Saint-Gall", "AG": "Argovie",
    "LU": "Lucerne", "TG": "Thurgovie", "BS": "Bâle-Ville", "BL": "Bâle-Campagne",
    "GR": "Grisons", "ZG": "Zoug", "SO": "Soleure", "NW": "Nidwald",
    "OW": "Obwald", "AR": "Appenzell Rhodes-Extérieures", "AI": "Appenzell Rhodes-Intérieures",
    "GL": "Glaris", "UR": "Uri",
}


# ═══════════════════════════════════════════════════════════════
# Fix functions — chacune retourne (n_changed, list_of_changes)
# ═══════════════════════════════════════════════════════════════

def fix_1_saga_region_detail(scenes_dir: Path, dry_run: bool) -> tuple[int, list]:
    """Normalise le format regionDetail des 12 sagas FR/VS : canton → code."""
    changes = []
    for sid in SAGA_FR + SAGA_VS:
        f = scenes_dir / f"{sid}.json"
        if not f.exists():
            changes.append(("SKIP", sid, "fichier absent"))
            continue
        d = json.loads(f.read_text(encoding="utf-8"))
        rd = d.get("regionDetail")
        if not isinstance(rd, dict):
            changes.append(("SKIP", sid, "regionDetail absent ou pas dict"))
            continue
        if "code" in rd and rd["code"]:
            # Déjà normalisé — idempotent
            continue
        canton = rd.get("canton")
        if not canton:
            changes.append(("SKIP", sid, "ni 'code' ni 'canton'"))
            continue
        # Reconstruire le regionDetail au format canonique
        new_rd = {
            "code": canton,
            "flag": "🇨🇭",
            "name": CANTON_NAMES.get(canton, canton),
        }
        # Conserver les champs additionnels qui font sens (commune, company,
        # international, intercantonal) — ce sont du contenu pédagogique.
        for k in ("commune", "company", "international", "intercantonal"):
            if k in rd:
                new_rd[k] = rd[k]
        d["regionDetail"] = new_rd
        changes.append(("FIX", sid, f"canton='{canton}' → code='{canton}'"))
        if not dry_run:
            f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n",
                         encoding="utf-8")
    n = sum(1 for c in changes if c[0] == "FIX")
    return n, changes


def fix_2_eu_region_field(scenes_dir: Path, dry_run: bool) -> tuple[int, list]:
    """Ajoute region: 'EU' aux fichiers eu-*.json qui n'en ont pas."""
    changes = []
    for f in sorted(scenes_dir.glob("eu-*.json")):
        sid = f.stem
        d = json.loads(f.read_text(encoding="utf-8"))
        if d.get("region") == "EU":
            continue
        d["region"] = "EU"
        changes.append(("FIX", sid, "ajouté region='EU'"))
        if not dry_run:
            f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n",
                         encoding="utf-8")
    n = sum(1 for c in changes if c[0] == "FIX")
    return n, changes


def fix_3_npcs_format(scenes_dir: Path, dry_run: bool) -> tuple[int, list]:
    """Normalise npcs des 5 FR-Sarine : list-of-dicts → list-of-strings.

    Préserve l'info `role` en la déplaçant vers un nouveau champ optionnel
    `npcRoles` au top-level (pour ne rien perdre).
    """
    changes = []
    for sid in SAGA_FR:
        f = scenes_dir / f"{sid}.json"
        if not f.exists():
            continue
        d = json.loads(f.read_text(encoding="utf-8"))
        npcs = d.get("npcs", [])
        if not isinstance(npcs, list) or not npcs:
            continue
        if all(isinstance(n, str) for n in npcs):
            # Déjà normalisé
            continue
        if not all(isinstance(n, dict) for n in npcs):
            changes.append(("SKIP", sid, "format npcs mixte/inconnu"))
            continue
        new_npcs = [n.get("id") for n in npcs if isinstance(n.get("id"), str)]
        roles = {n.get("id"): n.get("role") for n in npcs
                 if isinstance(n.get("id"), str) and n.get("role")}
        d["npcs"] = new_npcs
        if roles:
            d["npcRoles"] = roles  # rôles préservés pour usage futur
        changes.append(("FIX", sid, f"converti {len(new_npcs)} NPCs (rôles préservés dans npcRoles)"))
        if not dry_run:
            f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n",
                         encoding="utf-8")
    n = sum(1 for c in changes if c[0] == "FIX")
    return n, changes


def fix_4_72969_region(scenes_dir: Path, dry_run: bool) -> tuple[int, list]:
    """Ajoute regionDetail à 72969-infractions-vaud (manquant)."""
    f = scenes_dir / "72969-infractions-vaud.json"
    if not f.exists():
        return 0, [("SKIP", "72969-infractions-vaud", "fichier absent")]
    d = json.loads(f.read_text(encoding="utf-8"))
    if d.get("regionDetail") and isinstance(d["regionDetail"], dict) and d["regionDetail"].get("code"):
        return 0, []
    d["regionDetail"] = {"code": "VD", "flag": "🇨🇭", "name": "Vaud"}
    if not dry_run:
        f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n",
                     encoding="utf-8")
    return 1, [("FIX", "72969-infractions-vaud", "ajouté regionDetail VD")]


def fix_5_chf_to_conf(scenes_dir: Path, dry_run: bool) -> tuple[int, list]:
    """Renomme regionDetail.code='CHF' → 'CONF' (évite la confusion currency)."""
    changes = []
    for f in sorted(scenes_dir.glob("*.json")):
        if f.name == "index.json":
            continue
        d = json.loads(f.read_text(encoding="utf-8"))
        rd = d.get("regionDetail")
        if not isinstance(rd, dict) or rd.get("code") != "CHF":
            continue
        rd["code"] = "CONF"
        changes.append(("FIX", f.stem, "code 'CHF' → 'CONF'"))
        if not dry_run:
            f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n",
                         encoding="utf-8")
    n = sum(1 for c in changes if c[0] == "FIX")
    return n, changes


def fix_6_normalize_tags(scenes_dir: Path, dry_run: bool) -> tuple[int, list]:
    """Normalise les tags en MAJUSCULES dans tous les fichiers."""
    changes = []
    for f in sorted(scenes_dir.glob("*.json")):
        if f.name == "index.json":
            continue
        d = json.loads(f.read_text(encoding="utf-8"))
        tags = d.get("tags", [])
        if not isinstance(tags, list):
            continue
        # Normaliser : upper, dédupliquer en préservant l'ordre
        seen = set()
        new_tags = []
        for t in tags:
            if not isinstance(t, str):
                continue
            tu = t.strip().upper()
            if tu and tu not in seen:
                seen.add(tu)
                new_tags.append(tu)
        if new_tags != tags:
            d["tags"] = new_tags
            n_before = len(tags)
            n_after = len(new_tags)
            note = f"{n_before}→{n_after} tags" if n_before != n_after else f"{n_before} tags upper"
            changes.append(("FIX", f.stem, note))
            if not dry_run:
                f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n",
                             encoding="utf-8")
    n = sum(1 for c in changes if c[0] == "FIX")
    return n, changes


def fix_7_regenerate_index(scenes_dir: Path, dry_run: bool) -> tuple[int, list]:
    """Régénère scenes/index.json à partir des fichiers individuels.

    Inclut désormais `region` (manquant dans la version actuelle) et
    préserve tous les autres champs du format actuel.
    """
    # Champs propagés depuis chaque fichier vers index.json
    INDEX_FIELDS = [
        "id", "title", "icon", "difficulty", "atmosphere",
        "tags", "intro", "alertLevel", "legalRefs", "npcs",
        "region",          # ← AJOUT v2.x
        "regionDetail",    # ← utile au lobby pour data-canton (était lu via fetch full)
        "realCase",        # ← présent sur 50 scènes, utile au lobby
    ]

    new_index = []
    for f in sorted(scenes_dir.glob("*.json")):
        if f.name == "index.json":
            continue
        d = json.loads(f.read_text(encoding="utf-8"))
        entry = {}
        for k in INDEX_FIELDS:
            if k in d:
                entry[k] = d[k]
        # stepCount calculé à la volée (l'index actuel l'a)
        steps = d.get("steps", [])
        entry["stepCount"] = len(steps) if isinstance(steps, list) else 0
        new_index.append(entry)

    # Comparer avec l'existant
    idx_path = scenes_dir / "index.json"
    if idx_path.exists():
        old_index = json.loads(idx_path.read_text(encoding="utf-8"))
        if old_index == new_index:
            return 0, []  # déjà OK

    if not dry_run:
        idx_path.write_text(json.dumps(new_index, ensure_ascii=False, indent=2) + "\n",
                             encoding="utf-8")
    return 1, [("FIX", "index.json", f"régénéré ({len(new_index)} entrées, +region/+regionDetail/+realCase)")]


# ═══════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════
FIXES = [
    ("1", "Normaliser regionDetail des sagas FR/VS (canton → code)", fix_1_saga_region_detail),
    ("2", "Ajouter region='EU' aux fichiers eu-* qui le manquent",   fix_2_eu_region_field),
    ("3", "Normaliser format npcs des 5 FR-Sarine (dicts → strings)", fix_3_npcs_format),
    ("4", "Ajouter regionDetail VD à 72969-infractions-vaud",         fix_4_72969_region),
    ("5", "Renommer regionDetail.code 'CHF' → 'CONF' (cosmétique)",   fix_5_chf_to_conf),
    ("6", "Normaliser tous les tags en MAJUSCULES",                   fix_6_normalize_tags),
    ("7", "Régénérer scenes/index.json (avec region/regionDetail)",   fix_7_regenerate_index),
]


def main():
    p = argparse.ArgumentParser(description="Fix scenes/ data integrity")
    p.add_argument("--scenes-dir", default="scenes", help="Chemin vers le dossier scenes/")
    p.add_argument("--dry-run", action="store_true", help="Affiche les changements sans écrire")
    p.add_argument("--only", help="Liste de numéros de fixes à appliquer (ex: --only=1,2,7)")
    p.add_argument("--include-cosmetic", action="store_true",
                   help="Inclut les fixes cosmétiques (#5 CHF→CONF, #6 tag upper)")
    args = p.parse_args()

    scenes_dir = Path(args.scenes_dir)
    if not scenes_dir.is_dir():
        print(f"❌ Dossier introuvable : {scenes_dir}", file=sys.stderr)
        sys.exit(1)

    if args.only:
        only_set = {n.strip() for n in args.only.split(",")}
        active = [(n, t, fn) for n, t, fn in FIXES if n in only_set]
    else:
        cosmetic = {"5", "6"}
        active = [(n, t, fn) for n, t, fn in FIXES
                  if args.include_cosmetic or n not in cosmetic]

    print(f"🔧 fix_scenes.py — {'DRY-RUN' if args.dry_run else 'APPLIQUE'} sur {scenes_dir}/")
    print(f"   Fixes actifs : {[n for n, _, _ in active]}")
    print()

    total_changes = 0
    for num, title, fn in active:
        print(f"━━━ Fix #{num} : {title}")
        n, changes = fn(scenes_dir, args.dry_run)
        for kind, sid, note in changes:
            sym = "✓" if kind == "FIX" else "·"
            print(f"  {sym} [{kind}] {sid}: {note}")
        if n == 0 and not changes:
            print(f"  · (rien à faire)")
        elif n == 0:
            print(f"  · (skips uniquement)")
        else:
            print(f"  → {n} modification(s)")
        total_changes += n
        print()

    print(f"═══ Total : {total_changes} modification(s)")
    if args.dry_run and total_changes:
        print(f"   (dry-run — relancer sans --dry-run pour appliquer)")


if __name__ == "__main__":
    main()
