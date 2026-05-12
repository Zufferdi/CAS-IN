#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
reorganize_fiches_index.py
==========================

Régénère fiches/index.html avec :
    1. Réorganisation en 9 modules thématiques (Module 09 "Émergent / Cloud-Native /
       IoT-OT / IA" ajouté)
    2. Déplacement de 9 fiches mal placées dans leur module logique
    3. Badges "Étape 1/2/3" ou "Vue d'ensemble / Approfondi" sur les paires
       de fiches existantes (volatilite/volatility_memory, sqlite/sqlite_avance,
       dns/dns_avance, windows/windows_forensique, usb/usb_removable)
    4. Compteur 116 cohérent partout (total + par module)
    5. Préserve toutes les cartes existantes (aucune fiche perdue)

Mapping des déplacements :

    M02 Méthodologie → M04 Windows     : volatilite, volatility_memory_forensics
    M02 Méthodologie → M08 Outils      : nas_forensique, mobile_apps_forensique
    M02 Méthodologie → M09 Émergent    : ia_deepfake_forensique
    M02 Méthodologie → M04 Windows     : shellbags_osint_pivot
    M05 Autres       → M09 Émergent    : m365_forensique, docker_kubernetes_forensique,
                                          ics_forensique, iot_forensique, vehicules_forensique

Badges étape ajoutés sur :

    volatilite          → Étape 2
    volatility_memory   → Étape 3
    sqlite_forensique   → Étape 1
    sqlite_*_avance     → Étape 2
    dns_forensique      → Vue d'ensemble
    dns_*_avance        → Approfondi
    usb_forensique      → Vue d'ensemble
    usb_removable_*     → Approfondi

Idempotent : si index.html contient déjà le marqueur Module 09, le script
détecte et propose un --force pour régénérer.

Usage :
    python3 reorganize_fiches_index.py [--repo /chemin/vers/repo]
    python3 reorganize_fiches_index.py --dry-run
    python3 reorganize_fiches_index.py --output /tmp/index_v2.html  # sans écrasement
"""

import argparse
import json
import re
import sys
from pathlib import Path
from bs4 import BeautifulSoup


# ──── Définition de la nouvelle structure 9 modules ────────────────────────

MODULE_ORDER = [
    ("01", "droitsuisse",     "var(--purple)", "⚖️", "Cadre Légal · Droit Suisse"),
    ("02", "acquisitionmethodes",  "var(--cyan)",   "📥", "Méthodologie & Acquisition"),
    ("03", "filesystems",     "var(--gold)",   "💾", "Systèmes de Fichiers"),
    ("04", "windows",         "var(--blue)",   "🪟", "Artefacts Windows"),
    ("05", "autres",          "var(--orange)", "📱", "Autres Systèmes"),
    ("06", "reseau",          "var(--green)",  "📡", "Réseaux & Communications"),
    ("07", "crypto",          "var(--red)",    "🔐", "Cryptologie & Sécurité"),
    ("08", "outils",          "var(--muted)",  "🛠",  "Outils DFIR"),
    ("09", "emergent",        "var(--cyan)",   "🌐", "Émergent · Cloud-Native · IoT/OT · IA"),
]

# Fiches qui changent de module
MOVES = {
    "volatilite.html":               ("M02→M04", "windows"),
    "volatility_memory_forensics.html": ("M02→M04", "windows"),
    "shellbags_osint_pivot.html":    ("M02→M04", "windows"),
    "nas_forensique.html":           ("M02→M08", "outils"),
    "mobile_apps_forensique.html":   ("M02→M08", "outils"),
    "ia_deepfake_forensique.html":   ("M02→M09", "emergent"),
    "m365_forensique.html":          ("M05→M09", "emergent"),
    "docker_kubernetes_forensique.html": ("M05→M09", "emergent"),
    "ics_forensique.html":           ("M05→M09", "emergent"),
    "iot_forensique.html":           ("M05→M09", "emergent"),
    "vehicules_forensique.html":     ("M05→M09", "emergent"),
}

# Badges étape — ajoutés sur la fiche-name via un <small class="step-badge">
STEP_BADGES = {
    "volatilite.html":               ("step-2", "Étape 2"),
    "volatility_memory_forensics.html": ("step-3", "Étape 3"),
    "sqlite_forensique.html":        ("step-1", "Étape 1"),
    "sqlite_forensique_avance.html": ("step-2", "Étape 2"),
    "dns_forensique.html":           ("overview", "Vue d'ensemble"),
    "dns_forensique_avance.html":    ("deep",   "Approfondi"),
    "usb_forensique.html":           ("overview", "Vue d'ensemble"),
    "usb_removable_media_forensique.html": ("deep", "Approfondi"),
    "windows_forensique.html":       ("overview", "Méthodologie"),
    "windows.html":                  ("deep", "Artefacts détaillés"),
}

# CSS additionnel pour les badges étape (injecté dans <style>)
STEP_BADGE_CSS = """
/* ── Badges étape (parcours pédagogique) ── */
.step-badge {
  display: inline-block;
  font-size: .58rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  padding: .12rem .4rem;
  border-radius: 3px;
  margin-left: .35rem;
  vertical-align: middle;
  font-family: var(--mono);
}
.step-badge.step-1 { background: rgba(0,229,204,.12); color: var(--cyan); border: 1px solid rgba(0,229,204,.3); }
.step-badge.step-2 { background: rgba(255,159,64,.12); color: var(--orange); border: 1px solid rgba(255,159,64,.3); }
.step-badge.step-3 { background: rgba(188,140,255,.12); color: var(--purple); border: 1px solid rgba(188,140,255,.3); }
.step-badge.overview { background: rgba(120,160,200,.1); color: var(--dim); border: 1px solid rgba(120,160,200,.3); }
.step-badge.deep { background: rgba(240,192,64,.1); color: var(--gold); border: 1px solid rgba(240,192,64,.3); }
"""


# ──── Logique de régénération ──────────────────────────────────────────────

def extract_all_cards(soup):
    """
    Retourne {href: <a> tag} pour toutes les cartes fiche-card dans l'index.
    Préserve l'ordre original.
    """
    cards = {}
    for cat in soup.select(".fiche-category"):
        for a in cat.select("a.fiche-card"):
            href = a.get("href", "").strip()
            if href.endswith(".html"):
                cards[href] = a
    return cards


def get_card_module(soup, href):
    """Retourne l'ID de module actuel ('droitsuisse', 'windows', ...) d'une carte."""
    for cat in soup.select(".fiche-category"):
        cat_id = cat.get("id", "")
        for a in cat.select("a.fiche-card"):
            if a.get("href", "").strip() == href:
                return cat_id.replace("cat-", "")
    return None


def build_module_section(soup, module_num, module_id, color, icon, title, cards_for_module):
    """
    Construit une <div class="fiche-category"> complète pour un module donné.
    Retourne le nœud BeautifulSoup prêt à insérer.
    """
    section = soup.new_tag("div", attrs={
        "class": "fiche-category",
        "id": f"cat-{module_id}",
        "style": "margin-bottom:2rem",
    })

    title_div = soup.new_tag("div", attrs={
        "class": "fiche-cat-title",
        "style": (
            f"font-family:var(--sans);font-size:.72rem;font-weight:700;"
            f"letter-spacing:.15em;text-transform:uppercase;color:{color};"
            f"margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem"
        ),
    })

    step_span = soup.new_tag("span", attrs={"class": "cat-step"})
    step_span.string = module_num
    title_div.append(step_span)

    # Texte titre (avec icône) — insertion en raw HTML pour préserver les emojis
    title_text = f" {icon} {title} "
    title_div.append(title_text)

    sep = soup.new_tag("span", attrs={
        "style": "flex:1;height:1px;background:var(--border);opacity:.3",
    })
    title_div.append(sep)

    count_span = soup.new_tag("span", attrs={
        "class": "cat-count",
        "style": "font-size:.6rem;color:var(--dim);font-weight:400",
    })
    count_span.string = f"{len(cards_for_module)} fiches"
    title_div.append(count_span)

    section.append(title_div)

    grid = soup.new_tag("div", attrs={"class": "fiche-grid"})
    for card_html in cards_for_module:
        grid.append(card_html)
    section.append(grid)

    nav = soup.new_tag("div", attrs={"class": "cat-nav", "data-cat": module_id})
    section.append(nav)

    return section


def inject_step_badge(card_tag, soup, css_class, label):
    """Injecte un <small class="step-badge"> à la fin du <div class="fiche-name">."""
    name_div = card_tag.select_one(".fiche-name")
    if name_div is None:
        return
    # Éviter doublons
    if name_div.select_one(".step-badge"):
        return
    badge = soup.new_tag("small", attrs={"class": f"step-badge {css_class}"})
    badge.string = label
    name_div.append(" ")
    name_div.append(badge)


def reorganize(html_content: str) -> str:
    """Fonction principale : prend l'index actuel, retourne le nouvel index."""
    soup = BeautifulSoup(html_content, "lxml")

    # 1. Extraire toutes les cartes existantes (en clone profond)
    all_cards = extract_all_cards(soup)

    # 2. Pour chaque carte, déterminer son module cible (après déplacements)
    module_buckets = {m[1]: [] for m in MODULE_ORDER}  # id → [card tags]

    for href, card in all_cards.items():
        # Module cible
        if href in MOVES:
            target_module = MOVES[href][1]
        else:
            current = get_card_module(soup, href)
            # Sanitize : les IDs existants utilisent des accents / casse mixte.
            # Mapping vers les IDs canoniques de MODULE_ORDER.
            mapping = {
                "droitsuisse":           "droitsuisse",
                "acquisitionméthodes":   "acquisitionmethodes",
                "systèmesdefichiers":    "filesystems",
                "artefactswindows":      "windows",
                "systèmesspéciaux":      "autres",
                "réseauxinfrastructure": "reseau",
                "cryptologiesécurité":   "crypto",
                "outilsDFIR":            "outils",
            }
            target_module = mapping.get(current, current) or "outils"

        # Injecter badge étape si applicable
        if href in STEP_BADGES:
            css_class, label = STEP_BADGES[href]
            inject_step_badge(card, soup, css_class, label)

        # Cloner la carte pour la repositionner proprement
        from copy import copy
        card_clone = copy(card)
        module_buckets.setdefault(target_module, []).append(card_clone)

    # 3. Supprimer toutes les anciennes <div class="fiche-category">
    for cat in soup.select(".fiche-category"):
        cat.decompose()

    # 4. Trouver le conteneur (.page) et la position d'insertion (après search-wrap)
    search_wrap = soup.select_one(".search-wrap")
    if search_wrap is None:
        raise RuntimeError("Conteneur .search-wrap introuvable dans l'index")

    # 5. Injecter les nouveaux modules dans l'ordre
    insertion_point = search_wrap
    for module_num, module_id, color, icon, title in MODULE_ORDER:
        cards_for_module = module_buckets.get(module_id, [])
        if not cards_for_module and module_id == "emergent":
            # Module 09 vide ? Ne devrait pas arriver, mais on log
            print(f"  ⚠ Module {module_num} ({title}) : vide, ne sera pas inséré")
            continue
        section = build_module_section(
            soup, module_num, module_id, color, icon, title, cards_for_module,
        )
        insertion_point.insert_after(section)
        # Ajout d'une ligne vide entre sections pour la lisibilité du HTML source
        insertion_point = section

    # 6. Injecter CSS step-badge dans <style>
    style_tag = soup.find("style")
    if style_tag and "step-badge" not in style_tag.text:
        style_tag.string = style_tag.text + STEP_BADGE_CSS

    # 7. Mise à jour des compteurs (total-count, stat-total)
    total = sum(len(b) for b in module_buckets.values())
    total_count = soup.select_one("#total-count")
    if total_count:
        total_count.string = str(total)
    stat_total = soup.select_one("#stat-total")
    if stat_total:
        stat_total.string = str(total)

    # 8. Mise à jour mention "8 modules" → "9 modules"
    hub_stats = soup.select_one(".hub-stats")
    if hub_stats:
        html_str = str(hub_stats)
        html_str_new = re.sub(
            r'<strong>\s*8\s*</strong>\s*modules thématiques',
            '<strong>9</strong> modules thématiques',
            html_str,
        )
        if html_str_new != html_str:
            new_stats = BeautifulSoup(html_str_new, "lxml").select_one(".hub-stats")
            if new_stats:
                hub_stats.replace_with(new_stats)

    return str(soup)


# ──── CLI ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n", 1)[0])
    parser.add_argument("--repo", type=Path, default=Path.cwd(),
                        help="Racine du repo")
    parser.add_argument("--dry-run", action="store_true",
                        help="N'écrit pas le fichier")
    parser.add_argument("--output", type=Path, default=None,
                        help="Chemin de sortie (défaut : in-place fiches/index.html)")
    parser.add_argument("--force", action="store_true",
                        help="Régénère même si Module 09 déjà présent")
    args = parser.parse_args()

    repo = args.repo.resolve()
    src = repo / "fiches" / "index.html"
    if not src.exists():
        print(f"❌ Index introuvable : {src}", file=sys.stderr)
        return 1

    print(f"📂 Repo  : {repo}")
    print(f"📄 Index : {src}")

    content = src.read_text(encoding="utf-8")

    if "cat-emergent" in content and not args.force:
        print("⚠ Module 09 déjà présent (cat-emergent détecté). "
              "Utilisez --force pour régénérer.")
        return 0

    print("🔧 Réorganisation en cours...")
    new_content = reorganize(content)

    # Stats finales
    soup = BeautifulSoup(new_content, "lxml")
    print("\n━━━ Nouvelle structure ━━━")
    for cat in soup.select(".fiche-category"):
        cat_id = cat.get("id", "").replace("cat-", "")
        n = len(cat.select("a.fiche-card"))
        title = cat.select_one(".fiche-cat-title")
        title_txt = (title.get_text(strip=True)[:60] if title else cat_id)
        print(f"  • {title_txt:65s} ({n} fiches)")

    badges = len(soup.select(".step-badge"))
    print(f"\n  🏷  Badges étape injectés : {badges}")

    target = args.output or src
    if args.dry_run:
        print(f"\nℹ DRY-RUN : aucune écriture. Sortie aurait été : {target}")
    else:
        target.write_text(new_content, encoding="utf-8")
        print(f"\n✅ Écrit : {target}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
