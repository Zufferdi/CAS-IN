#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_search_index.py — Extrait le contenu indexable des fiches en JSON

Pour chaque fiche HTML, génère une entrée :
  - file     : nom du fichier (ex. "acquisition.html")
  - title    : <h1>
  - category : catégorie (depuis manifest.json)
  - icon     : icône (depuis manifest.json)
  - desc     : description courte (depuis manifest.json)
  - sections : [{id, title, text}] pour chaque section (h2 OU div.sec-title)
               (id = ancre HTML, text = contenu textuel concaténé de la section)

Output : data/search-index.json
Schema (haut de fichier) : {$schema_version, fiches_count, fiches: [...]}
"""

import json
import re
from html import unescape
from pathlib import Path


REPO = Path(__file__).resolve().parent.parent
FICHES_DIR = REPO / "fiches"
OUT = REPO / "data" / "search-index.json"


def strip_html(s: str) -> str:
    """Retire les tags HTML et collapse les whitespaces."""
    s = re.sub(r"<[^>]+>", " ", s)
    s = unescape(s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def remove_blocks(s: str, *patterns: str) -> str:
    out = s
    for p in patterns:
        out = re.sub(p, "", out, flags=re.DOTALL | re.IGNORECASE)
    return out


def find_balanced_div(text: str, start: int) -> int:
    """À partir d'une position juste APRÈS un <div ...>, trouve la position du </div> qui ferme cette div.
    Renvoie l'index du <  de </div>, ou -1 si non trouvé."""
    depth = 1
    i = start
    open_re = re.compile(r"<div\b", re.IGNORECASE)
    close_re = re.compile(r"</div\s*>", re.IGNORECASE)
    while i < len(text):
        next_open = open_re.search(text, i)
        next_close = close_re.search(text, i)
        if not next_close:
            return -1
        if next_open and next_open.start() < next_close.start():
            depth += 1
            i = next_open.end()
        else:
            depth -= 1
            if depth == 0:
                return next_close.start()
            i = next_close.end()
    return -1


def find_cli_blocks(text: str) -> list:
    """Retourne la liste des contenus de <div class="cli">…</div>, en respectant les imbrications."""
    out = []
    open_re = re.compile(r'<div\s+class="cli"[^>]*>', re.IGNORECASE)
    for m in open_re.finditer(text):
        end = find_balanced_div(text, m.end())
        if end > 0:
            out.append(text[m.end():end])
    return out


def extract_fiche(filepath: Path, manifest_entry):
    raw = filepath.read_text(encoding="utf-8")

    # Nettoyer scripts/styles
    cleaned = remove_blocks(
        raw,
        r"<script[^>]*>.*?</script>",
        r"<style[^>]*>.*?</style>",
        r"<noscript[^>]*>.*?</noscript>",
    )

    # 1) Titre principal
    m = re.search(r"<h1[^>]*>(.+?)</h1>", cleaned, re.DOTALL | re.IGNORECASE)
    title = strip_html(m.group(1)) if m else ""

    # 2) Trouver tous les séparateurs de section : h2 OU div.sec-title
    section_pattern = re.compile(
        r'(?:<h2[^>]*?(?:id="([^"]*)")?[^>]*>(.+?)</h2>'
        r'|<div\s+class="sec-title"[^>]*?(?:id="([^"]*)")?[^>]*>(.+?)</div>)',
        re.DOTALL | re.IGNORECASE,
    )

    matches = list(section_pattern.finditer(cleaned))

    sections = []
    for i, m in enumerate(matches):
        sec_id = (m.group(1) or m.group(3) or "").strip()
        sec_title = strip_html(m.group(2) or m.group(4) or "")
        if not sec_title:
            continue

        body_start = m.end()
        body_end = matches[i + 1].start() if i + 1 < len(matches) else len(cleaned)
        body = cleaned[body_start:body_end]

        # Extraire commandes (.cli) — avec extraction équilibrée pour gérer divs imbriquées
        cli_blocks = find_cli_blocks(body)
        # Extraire <code> et <strong> pour terms
        code_blocks = re.findall(r'<code[^>]*>(.+?)</code>', body, re.DOTALL)
        strong_blocks = re.findall(r'<strong[^>]*>(.+?)</strong>', body, re.DOTALL)

        commands = []
        for c in cli_blocks:
            txt = strip_html(c)
            if txt and len(txt) < 500:
                commands.append(txt)

        terms = []
        for c in code_blocks + strong_blocks:
            txt = strip_html(c)
            if txt and 2 <= len(txt) < 100:
                terms.append(txt)

        text = strip_html(body)
        # Réduire text à 400 chars max (assez pour matcher mots-clés)
        if len(text) > 400:
            text = text[:400].rsplit(" ", 1)[0] + "…"

        commands = list(dict.fromkeys(commands))[:10]
        terms = list(dict.fromkeys(terms))[:20]

        sections.append({
            "id": sec_id,
            "title": sec_title,
            "text": text,
            "commands": commands,
            "terms": terms,
        })

    result = {
        "file": filepath.name,
        "title": title,
        "sections": sections,
    }

    if manifest_entry:
        result["category"] = manifest_entry.get("category", "")
        result["icon"] = manifest_entry.get("icon", "")
        result["desc"] = manifest_entry.get("desc", "")
        m_title = manifest_entry.get("title", "")
        if m_title and (not result["title"] or len(m_title) < len(result["title"])):
            result["title"] = m_title
    else:
        result["category"] = ""
        result["icon"] = ""
        result["desc"] = ""

    return result


def load_manifest():
    with open(REPO / "data" / "manifest.json") as f:
        m = json.load(f)
    return {f["file"]: f for f in m["fiches"]}


def main():
    manifest = load_manifest()
    fiches_files = sorted([
        f for f in FICHES_DIR.glob("*.html") if f.name != "index.html"
    ])

    print(f"▸ Indexation de {len(fiches_files)} fiches…")
    fiches_index = []
    total_sections = 0
    total_commands = 0
    total_terms = 0

    for fp in fiches_files:
        entry = manifest.get(fp.name)
        result = extract_fiche(fp, entry)
        fiches_index.append(result)
        total_sections += len(result["sections"])
        for s in result["sections"]:
            total_commands += len(s["commands"])
            total_terms += len(s["terms"])

    out_data = {
        "$comment": "Auto-généré par scripts/build_search_index.py — ne pas éditer à la main",
        "$schema_version": 1,
        "fiches_count": len(fiches_index),
        "fiches": fiches_index,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out_data, f, ensure_ascii=False, separators=(",", ":"))

    size = OUT.stat().st_size
    print(f"✓ {OUT.relative_to(REPO)}")
    print(f"  Taille : {size/1024:.1f} KB")
    print(f"  Fiches : {len(fiches_index)}")
    print(f"  Sections totales : {total_sections}")
    print(f"  Commandes indexées : {total_commands}")
    print(f"  Termes indexés : {total_terms}")
    if fiches_index:
        print(f"  Moy/fiche : {total_sections/len(fiches_index):.1f} sections, "
              f"{total_commands/len(fiches_index):.1f} cmds, "
              f"{total_terms/len(fiches_index):.1f} terms")


if __name__ == "__main__":
    main()
