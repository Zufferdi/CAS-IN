#!/usr/bin/env python3
"""
generate_counts.py — CAS-IN
Génère le fichier data/counts.json à partir de la vérité terrain du repo :
  - data/manifest.json       → nombre de fiches
  - data/questions.json      → nombre de questions
  - scenes/index.json        → nombre de scènes (lazy-load v3.0+)
  - tp/tp-data.js            → nombre de catégories de TP

Usage :
    python3 scripts/generate_counts.py

Écrit data/counts.json.
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
    """Compte les questions dans data/questions.json (liste JSON en racine)."""
    path = root / "data" / "questions.json"
    if not path.exists():
        # Fallback sur questions.js (export const questions = [...])
        path_js = root / "questions.js"
        if not path_js.exists():
            print("[warn] ni data/questions.json ni questions.js trouvés", file=sys.stderr)
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
    """Compte les fiches listées dans data/manifest.json (clé 'fiches')."""
    path = root / "data" / "manifest.json"
    if not path.exists():
        print("[warn] data/manifest.json absent — fallback sur listing de fiches/", file=sys.stderr)
        fdir = root / "fiches"
        if not fdir.exists():
            return 0
        return len([p for p in fdir.glob("*.html") if p.name != "index.html"])

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"[error] data/manifest.json JSON invalide : {e}", file=sys.stderr)
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


def read_version(root: Path) -> str:
    """v2.93 — Lit la version courante depuis docs/CHANGELOG.md (Keep-a-Changelog).
    Cherche le premier `## [X.Y]` ou `## X.Y` non marqué `[Unreleased]`.
    Fallback : la version inscrite en haut de cas-in-profile.js, ou 'dev'."""
    changelog = root / "docs" / "CHANGELOG.md"
    if changelog.exists():
        content = changelog.read_text(encoding="utf-8")
        # ignore 'Unreleased', prend la première version sémantique
        for m in re.finditer(r'^##\s+\[?([0-9]+\.[0-9]+(?:\.[0-9]+)?)\]?', content, re.M):
            return m.group(1)
    # Fallback : commentaire en tête de cas-in-profile.js (ex. "v2.93")
    profile = root / "js" / "core" / "cas-in-profile.js"
    if profile.exists():
        head = profile.read_text(encoding="utf-8")[:500]
        m = re.search(r'v([0-9]+\.[0-9]+(?:\.[0-9]+)?)', head)
        if m:
            return m.group(1)
    return "dev"


def patch_html_fallbacks(root: Path, counts: dict) -> int:
    """v2.93 — Patche les valeurs de fallback `data-count="KEY">N` dans tous les
    fichiers HTML, pour que SEO/réseaux sociaux/lecteurs sans JS voient les
    bons chiffres. Sans ce patch, le HTML montrait 1439 questions / 54 fiches
    / 18 scènes / 20 TP, valeurs gelées datant d'avant 2026."""
    mapping = {
        "questions":     str(counts.get("questions", 0)),
        "fiches":        str(counts.get("fiches", 0)),
        "scenes":        str(counts.get("scenes", 0)),
        "tp_categories": str(counts.get("tp_categories", 0)),
        "tp_exercises":  str(counts.get("tp_exercises", 0)),
    }
    pattern = re.compile(r'data-count="([a-z_]+)">(\d+)')
    files_changed = 0
    for html in root.rglob("*.html"):
        # Skip node_modules/build artefacts éventuels
        if any(part.startswith(".") for part in html.parts):
            continue
        content = html.read_text(encoding="utf-8")
        def repl(m):
            key = m.group(1)
            return f'data-count="{key}">{mapping[key]}' if key in mapping else m.group(0)
        new_content = pattern.sub(repl, content)
        if new_content != content:
            html.write_text(new_content, encoding="utf-8")
            files_changed += 1
            print(f"[patch] {html.relative_to(root)}")
    return files_changed


def main():
    root = repo_root()
    print(f"[info] Racine du projet : {root}")

    counts = {
        "$comment": "Auto-généré par scripts/generate_counts.py. Ne pas éditer à la main.",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "version": read_version(root),
        "questions": count_questions(root),
        "fiches": count_fiches(root),
        "scenes": count_scenes(root),
        "tp_categories": count_tp_categories(root),
    }
    # tp_exercises = tp_categories par convention (1 catégorie = 1 générateur d'exercice)
    counts["tp_exercises"] = counts["tp_categories"]

    out = root / "data" / "counts.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        json.dumps(counts, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8"
    )

    print("[ok] data/counts.json généré :")
    for k, v in counts.items():
        if not k.startswith("$"):
            print(f"     {k:16} = {v}")

    # v2.93 — Patche aussi les fallbacks HTML pour que SEO/no-JS voient les
    # vrais chiffres (et pas le flash 1439 → 2000 au chargement).
    n_patched = patch_html_fallbacks(root, counts)
    if n_patched:
        print(f"[ok] {n_patched} fichier(s) HTML patché(s) (data-count fallback)")
    else:
        print("[ok] aucun fichier HTML à patcher")


if __name__ == "__main__":
    main()
