#!/usr/bin/env python3
"""
check_scenes.py — Validation et audit du dossier scenes/ CAS-IN.

Sur le modèle de check_questions.py, vérifie l'intégrité du système de scènes :
fichiers individuels, parité avec scenes/index.json, parité avec CANTON_DATA
(scene-app.js), formats regionDetail/region/npcs, tags, et plus.

USAGE
─────
    python3 scripts/check_scenes.py                # rapport complet
    python3 scripts/check_scenes.py --quiet        # seulement erreurs/warnings
    python3 scripts/check_scenes.py --strict       # exit 1 si warnings

DÉTECTE
───────
  - Fichiers orphelins (sur disque mais absents de index.json) et inversement
  - IDs en doublon dans l'index
  - Champs manquants ou vides dans les fichiers individuels
  - Format regionDetail incohérent (code vs canton)
  - region absent dans les fichiers eu-*
  - Format npcs incohérent (strings vs dicts)
  - Tags non normalisés (variantes case/accent du même concept)
  - Codes regionDetail non listés dans CANTON_DATA
  - Cohérence index.json ↔ fichiers individuels
"""
from __future__ import annotations
import sys, json, argparse, re, unicodedata
from pathlib import Path
from collections import Counter, defaultdict


# ═══════════════════════════════════════════════════════════════
# Config
# ═══════════════════════════════════════════════════════════════
REQUIRED_FIELDS = ["id", "title", "icon", "difficulty", "atmosphere",
                   "tags", "intro", "alertLevel", "legalRefs",
                   "objectives", "debrief", "narrative", "steps", "npcs"]

INDEX_FIELDS = ["id", "title", "icon", "difficulty", "atmosphere",
                "tags", "intro", "alertLevel", "legalRefs", "npcs"]

VALID_DIFFICULTIES = {"easy", "medium", "hard", "expert"}

# Codes valides au top niveau de regionDetail.code
VALID_NON_CANTON_CODES = {"CHF", "CONF", "CH", "INTL", "CN", "FR-EU"}


# ═══════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════
def norm_tag(s: str) -> str:
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower().strip()


def color(s, c):
    if not sys.stdout.isatty(): return s
    codes = {"red": "31", "green": "32", "yellow": "33", "blue": "34", "dim": "2", "bold": "1"}
    return f"\033[{codes.get(c, '0')}m{s}\033[0m"


def parse_canton_data(scene_app_path: Path) -> dict:
    """Extrait CANTON_DATA depuis scene-app.js."""
    if not scene_app_path.exists():
        return {}
    code = scene_app_path.read_text(encoding="utf-8")
    # Bloc complet `const CANTON_DATA = { ... };`
    m = re.search(r"const\s+CANTON_DATA\s*=\s*\{\s*\n(.*?)\n\};", code, re.DOTALL)
    if not m:
        return {}
    body = m.group(1)
    cantons = {}
    # Chaque ligne : `  XX: { name: "...", scenarios: ["a","b"] },`
    for line_match in re.finditer(
        r"^\s*(\w{2,3}):\s*\{[^}]*scenarios:\s*\[([^\]]*)\]",
        body, re.MULTILINE,
    ):
        canton = line_match.group(1)
        ids = [
            (m2.group(1) or m2.group(2))
            for m2 in re.finditer(r"'([^']+)'|\"([^\"]+)\"", line_match.group(2))
        ]
        cantons[canton] = [i for i in ids if i]
    return cantons


# ═══════════════════════════════════════════════════════════════
# Checks
# ═══════════════════════════════════════════════════════════════
def check_files_vs_index(scenes_dir: Path) -> tuple[list, list]:
    """Vérifie la parité scenes/*.json ↔ scenes/index.json."""
    errors, warnings = [], []
    idx_path = scenes_dir / "index.json"
    if not idx_path.exists():
        errors.append(f"❌ scenes/index.json absent")
        return errors, warnings

    try:
        idx = json.loads(idx_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"❌ scenes/index.json JSON invalide : {e}")
        return errors, warnings

    if not isinstance(idx, list):
        errors.append(f"❌ scenes/index.json doit être un tableau (trouvé {type(idx).__name__})")
        return errors, warnings

    files = {f.stem for f in scenes_dir.glob("*.json") if f.name != "index.json"}
    indexed = set()
    for e in idx:
        if not isinstance(e, dict) or "id" not in e:
            errors.append(f"❌ index.json: entrée sans 'id' → {e!r}")
            continue
        if e["id"] in indexed:
            errors.append(f"❌ index.json: id en doublon : {e['id']!r}")
        indexed.add(e["id"])

    orphans = files - indexed
    ghosts = indexed - files
    for o in sorted(orphans):
        warnings.append(f"⚠ Fichier orphelin (sur disque mais pas dans index.json) : {o}")
    for g in sorted(ghosts):
        errors.append(f"❌ Entrée fantôme (dans index.json mais aucun fichier) : {g}")
    return errors, warnings


def check_individual_file(f: Path) -> tuple[list, list]:
    """Valide un fichier de scène individuel."""
    errors, warnings = [], []
    sid = f.stem
    try:
        d = json.loads(f.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"❌ {sid}: JSON invalide ({e})")
        return errors, warnings

    if not isinstance(d, dict):
        errors.append(f"❌ {sid}: la racine n'est pas un objet")
        return errors, warnings

    # Champs requis
    for field in REQUIRED_FIELDS:
        if field not in d:
            errors.append(f"❌ {sid}: champ requis manquant : {field}")

    # ID = nom de fichier
    if d.get("id") != sid:
        errors.append(f"❌ {sid}: data.id={d.get('id')!r} ≠ filename")

    # Difficulté valide
    if d.get("difficulty") not in VALID_DIFFICULTIES:
        errors.append(f"❌ {sid}: difficulty={d.get('difficulty')!r} (attendu {VALID_DIFFICULTIES})")

    # Steps → playable ?
    steps = d.get("steps", [])
    if not isinstance(steps, list) or not steps:
        errors.append(f"❌ {sid}: steps vide ou non-liste")
    else:
        s0 = steps[0]
        if not isinstance(s0, dict) or not isinstance(s0.get("choices"), list):
            errors.append(f"❌ {sid}: steps[0].choices invalide → scène inchargeable")

    # eu-* doit avoir region='EU'
    if sid.startswith("eu-") and d.get("region") != "EU":
        errors.append(f"❌ {sid}: fichier eu-* sans region='EU' (filtre EU/CH cassé)")

    # regionDetail format
    rd = d.get("regionDetail")
    if rd is not None:
        if not isinstance(rd, dict):
            errors.append(f"❌ {sid}: regionDetail n'est pas un dict")
        elif not rd.get("code"):
            if rd.get("canton"):
                errors.append(f"❌ {sid}: regionDetail utilise 'canton' au lieu de 'code' (format saga, à normaliser)")
            else:
                warnings.append(f"⚠ {sid}: regionDetail sans 'code'")

    # npcs format
    npcs = d.get("npcs")
    if isinstance(npcs, list) and npcs:
        types = {type(n).__name__ for n in npcs}
        if len(types) > 1:
            errors.append(f"❌ {sid}: npcs format mixte ({types})")
        elif "dict" in types:
            errors.append(f"❌ {sid}: npcs en list-of-dicts (devrait être list-of-strings)")
        elif "str" not in types and "dict" not in types:
            errors.append(f"❌ {sid}: npcs format inattendu ({types})")

    return errors, warnings


def check_index_sync(scenes_dir: Path) -> list:
    """Vérifie que les champs critiques sont synchronisés entre fichier et index."""
    errors = []
    idx_path = scenes_dir / "index.json"
    if not idx_path.exists():
        return errors
    idx = json.loads(idx_path.read_text(encoding="utf-8"))
    by_id = {e["id"]: e for e in idx if isinstance(e, dict) and "id" in e}

    for f in scenes_dir.glob("*.json"):
        if f.name == "index.json":
            continue
        sid = f.stem
        if sid not in by_id:
            continue
        d = json.loads(f.read_text(encoding="utf-8"))
        ie = by_id[sid]
        for field in INDEX_FIELDS:
            v_idx, v_file = ie.get(field), d.get(field)
            if v_idx != v_file:
                errors.append(f"❌ Désync {sid}.{field}: index={v_idx!r}, fichier={v_file!r}")
    return errors


def check_canton_data_consistency(scenes_dir: Path, canton_data: dict) -> tuple[list, list]:
    """Vérifie la cohérence entre CANTON_DATA et regionDetail.code des fichiers."""
    errors, warnings = [], []
    if not canton_data:
        warnings.append("⚠ CANTON_DATA n'a pas pu être extrait de scene-app.js")
        return errors, warnings

    canton_keys = set(canton_data.keys())

    # Reverse map : scene_id → liste de cantons assignés
    scene_to_cantons = defaultdict(list)
    for canton, scene_ids in canton_data.items():
        for sid in scene_ids:
            scene_to_cantons[sid].append(canton)

    # Doublons de canton
    for sid, cantons in scene_to_cantons.items():
        if len(cantons) > 1:
            warnings.append(f"⚠ {sid}: assignée à plusieurs cantons → {cantons}")

    # Référence à fichier inexistant
    all_scene_files = {f.stem for f in scenes_dir.glob("*.json") if f.name != "index.json"}
    for sid in scene_to_cantons:
        if sid not in all_scene_files:
            errors.append(f"❌ CANTON_DATA référence un fichier inexistant : {sid}")

    # regionDetail.code dans CANTON_DATA ?
    for f in scenes_dir.glob("*.json"):
        if f.name == "index.json":
            continue
        sid = f.stem
        d = json.loads(f.read_text(encoding="utf-8"))
        rd = d.get("regionDetail", {})
        code = rd.get("code") if isinstance(rd, dict) else None
        if not code:
            continue
        if code in VALID_NON_CANTON_CODES:
            continue
        if len(code) == 2 and code not in canton_keys:
            warnings.append(f"⚠ {sid}: regionDetail.code='{code}' n'est pas dans CANTON_DATA")
        # Mismatches : assigné à un canton, mais regionDetail dit un autre
        if sid in scene_to_cantons:
            assigned = scene_to_cantons[sid]
            if code not in assigned and code not in VALID_NON_CANTON_CODES:
                warnings.append(f"⚠ {sid}: CANTON_DATA assigne à {assigned}, regionDetail.code='{code}'")

    return errors, warnings


def check_tag_normalization(scenes_dir: Path) -> list:
    """Détecte les variantes case-différentes du même tag."""
    warnings = []
    all_tags = Counter()
    for f in scenes_dir.glob("*.json"):
        if f.name == "index.json":
            continue
        d = json.loads(f.read_text(encoding="utf-8"))
        for t in d.get("tags", []):
            if isinstance(t, str):
                all_tags[t] += 1

    groups = defaultdict(set)
    for tag in all_tags:
        groups[norm_tag(tag)].add(tag)

    for n, variants in sorted(groups.items()):
        if len(variants) > 1:
            details = ", ".join(f"{v!r} ({all_tags[v]}×)" for v in sorted(variants))
            warnings.append(f"⚠ Tag avec variantes : {details}")
    return warnings


# ═══════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════
def main():
    p = argparse.ArgumentParser(description="Audit scenes/ data integrity")
    p.add_argument("--scenes-dir", default="scenes")
    p.add_argument("--scene-app", default="js/pages/scene-app.js",
                   help="Chemin vers scene-app.js (pour extraire CANTON_DATA)")
    p.add_argument("--quiet", action="store_true", help="N'affiche que les problèmes")
    p.add_argument("--strict", action="store_true", help="Exit 1 même sur warnings")
    args = p.parse_args()

    scenes_dir = Path(args.scenes_dir)
    if not scenes_dir.is_dir():
        print(f"❌ Dossier introuvable : {scenes_dir}", file=sys.stderr)
        sys.exit(2)

    all_errors, all_warnings = [], []

    # 1. Parité fichiers ↔ index
    e, w = check_files_vs_index(scenes_dir)
    all_errors += e; all_warnings += w
    if not args.quiet:
        print(color("═══ Parité fichiers ↔ index.json", "bold"))
        if not e and not w:
            print(color("  ✓ Aucun orphelin ni fantôme", "green"))
    for x in e: print(color(f"  {x}", "red"))
    for x in w: print(color(f"  {x}", "yellow"))

    # 2. Validation fichier par fichier
    if not args.quiet:
        print(color("\n═══ Validation des fichiers individuels", "bold"))
    f_errors, f_warnings = [], []
    n_files = 0
    for f in sorted(scenes_dir.glob("*.json")):
        if f.name == "index.json":
            continue
        n_files += 1
        e, w = check_individual_file(f)
        f_errors += e; f_warnings += w
    all_errors += f_errors; all_warnings += f_warnings
    if not args.quiet:
        print(f"  {n_files} fichiers analysés — "
              f"{color(str(len(f_errors)) + ' erreurs', 'red' if f_errors else 'green')}, "
              f"{color(str(len(f_warnings)) + ' warnings', 'yellow' if f_warnings else 'green')}")
    for x in f_errors: print(color(f"  {x}", "red"))
    for x in f_warnings: print(color(f"  {x}", "yellow"))

    # 3. Sync index ↔ fichiers
    if not args.quiet:
        print(color("\n═══ Synchro index.json ↔ fichiers", "bold"))
    e = check_index_sync(scenes_dir)
    all_errors += e
    if not args.quiet and not e:
        print(color("  ✓ Tous les champs synchronisés", "green"))
    for x in e: print(color(f"  {x}", "red"))

    # 4. CANTON_DATA
    canton_data = parse_canton_data(Path(args.scene_app))
    if not args.quiet:
        print(color("\n═══ CANTON_DATA (extrait de scene-app.js)", "bold"))
        print(f"  {len(canton_data)} cantons définis, "
              f"{sum(len(v) for v in canton_data.values())} assignations")
    e, w = check_canton_data_consistency(scenes_dir, canton_data)
    all_errors += e; all_warnings += w
    for x in e: print(color(f"  {x}", "red"))
    for x in w: print(color(f"  {x}", "yellow"))

    # 5. Tag normalization
    if not args.quiet:
        print(color("\n═══ Normalisation des tags", "bold"))
    w = check_tag_normalization(scenes_dir)
    all_warnings += w
    if not args.quiet and not w:
        print(color("  ✓ Tous les tags normalisés", "green"))
    for x in w[:20]: print(color(f"  {x}", "yellow"))
    if len(w) > 20:
        print(color(f"  … et {len(w) - 20} autres", "dim"))

    # ── Résumé
    print(color("\n═══ Résumé", "bold"))
    if not all_errors and not all_warnings:
        print(color("  ✓ Tout est propre.", "green"))
        sys.exit(0)
    print(f"  {color(str(len(all_errors)) + ' erreur(s)', 'red')} · "
          f"{color(str(len(all_warnings)) + ' warning(s)', 'yellow')}")
    if all_errors or (args.strict and all_warnings):
        sys.exit(1)


if __name__ == "__main__":
    main()
