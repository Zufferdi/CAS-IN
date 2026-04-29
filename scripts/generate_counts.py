#!/usr/bin/env python3
"""
generate_counts.py — CAS-IN
Génère le fichier counts.json à partir de la vérité terrain du repo :
  - manifest.json       → nombre de fiches
  - questions.json      → nombre de questions
  - scenes/index.json   → nombre de scènes (lazy-load v3.0+)
  - tp/tp-data.js       → nombre de catégories de TP

Usage :
    python3 scripts/generate_counts.py

Écrit counts.json à la racine du projet.
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


def repo_root() -> Path:
    """Détermine la racine du repo : le parent du dossier scripts/."""
    here = Path(__file__).resolve()
    # scripts/generate_counts.py → parent = scripts/ → parent.parent = repo root
    return here.parent.parent


def count_questions(root: Path) -> int:
    """Compte les questions dans questions.json (liste JSON en racine)."""
    path = root / "questions.json"
    if not path.exists():
        # Fallback sur questions.js (export const questions = [...])
        path_js = root / "questions.js"
        if not path_js.exists():
            print("[warn] ni questions.json ni questions.js trouvés", file=sys.stderr)
            return 0
        content = path_js.read_text(encoding="utf-8")
        # Heuristique : compter les occurrences de `{ theme:` ou `"theme":`
        return len(re.findall(r'[\{,]\s*["\']?theme["\']?\s*:', content))

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"[error] questions.json JSON invalide : {e}", file=sys.stderr)
        return 0

    if isinstance(data, list):
        return len(data)
    if isinstance(data, dict) and "questions" in data:
        return len(data["questions"])
    print("[warn] format inattendu pour questions.json", file=sys.stderr)
    return 0


def count_fiches(root: Path) -> int:
    """Compte les fiches listées dans manifest.json (clé 'fiches')."""
    path = root / "manifest.json"
    if not path.exists():
        print("[warn] manifest.json absent — fallback sur listing de fiches/", file=sys.stderr)
        fdir = root / "fiches"
        if not fdir.exists():
            return 0
        return len([p for p in fdir.glob("*.html") if p.name != "index.html"])

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"[error] manifest.json JSON invalide : {e}", file=sys.stderr)
        return 0

    fiches = data.get("fiches", [])
    if isinstance(fiches, list):
        return len(fiches)
    return 0


def count_scenes(root: Path) -> int:
    """Compte les scènes depuis scenes/index.json (source de vérité depuis le refactor v3.0).

    Fallback ordonné :
      1. scenes/index.json (méta lazy-load, refactor v3.0+)
      2. listing scenes/*.json (au cas où l'index serait absent)
      3. scenes.js legacy (export const SCENES = [...])
    """
    # 1. scenes/index.json (méthode actuelle)
    idx_path = root / "scenes" / "index.json"
    if idx_path.exists():
        try:
            data = json.loads(idx_path.read_text(encoding="utf-8"))
            if isinstance(data, list):
                return len(data)
        except json.JSONDecodeError as e:
            print(f"[warn] scenes/index.json invalide : {e}", file=sys.stderr)

    # 2. Fallback : listing scenes/*.json
    sdir = root / "scenes"
    if sdir.exists():
        files = [p for p in sdir.glob("*.json") if p.name != "index.json"]
        if files:
            return len(files)

    # 3. Fallback legacy : scenes.js / scene.html
    for candidate in ("scenes.js", "scene.html"):
        path = root / candidate
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8", errors="ignore")
        m = re.search(
            r'(?:const|var|let)\s+SCENES\s*=\s*\[(.*?)\];',
            content,
            re.DOTALL
        )
        if m:
            block = m.group(1)
            return len(re.findall(r'(?:^|[\[,])\s*\{\s*["\']?id["\']?\s*:', block))
    return 0


def count_tp_categories(root: Path) -> int:
    """Compte les catégories de TP dans tp.html (boutons data-cat=... distincts)."""
    path = root / "tp.html"
    if not path.exists():
        return 0
    content = path.read_text(encoding="utf-8")
    cats = set(re.findall(r'data-cat="([^"]+)"', content))
    return len(cats)


def main():
    root = repo_root()
    print(f"[info] Racine du projet : {root}")

    counts = {
        "$comment": "Auto-généré par scripts/generate_counts.py. Ne pas éditer à la main.",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "questions": count_questions(root),
        "fiches": count_fiches(root),
        "scenes": count_scenes(root),
        "tp_categories": count_tp_categories(root),
    }
    # tp_exercises = tp_categories par convention (1 catégorie = 1 générateur d'exercice)
    counts["tp_exercises"] = counts["tp_categories"]

    out = root / "counts.json"
    out.write_text(
        json.dumps(counts, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8"
    )

    print("[ok] counts.json généré :")
    for k, v in counts.items():
        if not k.startswith("$"):
            print(f"     {k:16} = {v}")


if __name__ == "__main__":
    main()
