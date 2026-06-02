#!/usr/bin/env python3
"""
check_campaigns_parity.py — Validation parité scènes ↔ data/campaigns.json.

Comble la lacune laissée par check_scenes.py (qui couvre scenes ↔ scenes/index.json).
Détecte les scènes orphelines (sur disque mais non référencées dans une campagne)
qui restent invisibles depuis l'écran "Dossiers / Sagas" — bug type observé le
2 juin 2026 sur 78 scènes (11 sagas CH livrées sans inject_campaign).

USAGE
─────
    python3 scripts/check_campaigns_parity.py              # rapport complet
    python3 scripts/check_campaigns_parity.py --quiet      # erreurs seulement
    python3 scripts/check_campaigns_parity.py --strict     # exit 1 si warnings
    python3 scripts/check_campaigns_parity.py --json       # sortie JSON

DÉTECTE
───────
  - Scènes ORPHELINES   : sur disque mais aucune campagne ne les référence
                          (= invisibles dans scene-campaigns-v1.js)
  - Scènes FANTÔMES     : référencées dans campaigns.json mais absentes du disque
                          (= liens cassés à l'exécution)
  - DOUBLONS d'order    : deux campagnes avec le même champ "order"
  - DOUBLONS d'id       : deux campagnes avec le même id
  - Conventions next    : valeurs "phase*" ou autres strings non reconnues du
                          moteur scene-app.js (qui ne traite que 'end', 'continue'
                          et les nombres ; tout autre string tombe en
                          fallback G.stepIdx++, fonctionnel mais non-standard)
  - Sagas SANS hook     : campagne sans champ "hook" (mauvaise UX accueil saga)
  - Sagas SANS scenes   : campagne kind=saga avec liste scenes vide

EXIT CODES
──────────
  0 : tout OK ou warnings seuls (sans --strict)
  1 : erreurs détectées ou warnings avec --strict
"""
from __future__ import annotations
import sys
import json
import argparse
import glob
import os
import re
from pathlib import Path
from collections import Counter, defaultdict


ROOT = Path(__file__).resolve().parent.parent
SCENES_DIR = ROOT / "scenes"
CAMPAIGNS_FILE = ROOT / "data" / "campaigns.json"

# Conventions next acceptées par js/pages/scene-app.js advanceStep()
ACCEPTED_NEXT_STRINGS = {"end", "continue"}
# Les nombres entiers sont aussi acceptés (saut direct vers stepIdx)


def color(s, c):
    if not sys.stdout.isatty():
        return s
    codes = {"red": "31", "green": "32", "yellow": "33", "blue": "34", "gray": "90"}
    return f"\033[{codes.get(c, '0')}m{s}\033[0m"


def load_scenes_on_disk():
    """Retourne {id: filepath} pour toutes les scènes (hors index.json)."""
    out = {}
    for f in sorted(SCENES_DIR.glob("*.json")):
        if f.name == "index.json":
            continue
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
            sid = d.get("id") or f.stem
            out[sid] = f
        except Exception as e:
            out[f.stem] = f  # garder même si JSON cassé pour le signaler
    return out


def load_campaigns():
    """Retourne la liste de campagnes (dict ou list selon format)."""
    if not CAMPAIGNS_FILE.exists():
        return None
    data = json.loads(CAMPAIGNS_FILE.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    return data.get("campaigns", [])


def check_orphans_and_phantoms(scenes_disk, campaigns, errors, warnings):
    """Détecte orphelines (disque sans campaign) et fantômes (campaign sans disque)."""
    disk_ids = set(scenes_disk.keys())
    referenced = set()
    for c in campaigns:
        for s in c.get("scenes", []):
            referenced.add(s)

    orphans = sorted(disk_ids - referenced)
    phantoms = sorted(referenced - disk_ids)

    # Grouper orphelines par préfixe-saga pour lecture
    if orphans:
        groups = defaultdict(list)
        for sid in orphans:
            # Extraire le préfixe avant le premier nombre (-1-, -2-, etc.)
            m = re.match(r"^(.+?)-\d+-", sid)
            prefix = m.group(1) if m else sid
            groups[prefix].append(sid)
        errors.append(f"❌ {len(orphans)} scène(s) ORPHELINE(S) (sur disque mais aucune campagne) :")
        for prefix, items in sorted(groups.items()):
            errors.append(f"   [{prefix}] — {len(items)} scène(s)")
            for sid in items:
                errors.append(f"     - {sid}")
        errors.append("   → Conséquence : invisibles dans l'écran 'Dossiers / Sagas'")
        errors.append("   → Réparation : exécuter le script apply_saga_*.py correspondant")

    if phantoms:
        errors.append(f"❌ {len(phantoms)} scène(s) FANTÔME(S) (référencée dans campaigns mais absente du disque) :")
        for sid in phantoms:
            errors.append(f"     - {sid}")
        errors.append("   → Conséquence : lien cassé au runtime (404 scene.html?scene=<id>)")


def check_campaign_duplicates(campaigns, errors, warnings):
    """Détecte les ids et orders dupliqués."""
    ids = [c.get("id") for c in campaigns if c.get("id")]
    id_dups = [i for i, n in Counter(ids).items() if n > 1]
    if id_dups:
        errors.append(f"❌ {len(id_dups)} id(s) de campagne dupliqué(s) :")
        for i in id_dups:
            errors.append(f"     - {i}")

    orders = [c.get("order") for c in campaigns if c.get("order") is not None]
    order_dups = [o for o, n in Counter(orders).items() if n > 1]
    if order_dups:
        warnings.append(f"⚠ {len(order_dups)} valeur(s) d'order dupliquée(s) (tri non déterministe) :")
        for o in order_dups:
            sharing = [c.get("id") for c in campaigns if c.get("order") == o]
            warnings.append(f"     order={o}: {sharing}")


def check_next_conventions(scenes_disk, warnings):
    """Détecte les conventions next non-standard dans les choix."""
    non_standard = []
    for sid, fpath in scenes_disk.items():
        try:
            d = json.loads(fpath.read_text(encoding="utf-8"))
        except Exception:
            continue
        for i, step in enumerate(d.get("steps", [])):
            for j, ch in enumerate(step.get("choices", [])):
                n = ch.get("next")
                if n is None:
                    continue
                if isinstance(n, int):
                    continue
                if isinstance(n, str) and n in ACCEPTED_NEXT_STRINGS:
                    continue
                non_standard.append((sid, i, j, n))

    if non_standard:
        # Grouper par valeur pour lecture
        by_value = defaultdict(list)
        for sid, i, j, val in non_standard:
            by_value[str(val)].append(f"{sid} step{i} choice{j}")
        warnings.append(f"⚠ {len(non_standard)} occurrence(s) de 'next' non-standard "
                        f"(scene-app.js accepte 'end', 'continue' ou int ; fallback OK mais convention catalogue) :")
        for val, locs in sorted(by_value.items()):
            warnings.append(f"     next={val!r}: {len(locs)} occurrence(s)")
            for loc in locs[:5]:
                warnings.append(f"       - {loc}")
            if len(locs) > 5:
                warnings.append(f"       ... et {len(locs) - 5} autres")


def check_campaign_quality(campaigns, warnings):
    """Détecte sagas sans hook, sagas vides, etc."""
    no_hook = []
    empty_scenes = []
    no_description = []
    for c in campaigns:
        cid = c.get("id", "<sans-id>")
        if c.get("kind") == "saga":
            if not c.get("hook"):
                no_hook.append(cid)
            if not c.get("scenes"):
                empty_scenes.append(cid)
        if not c.get("description"):
            no_description.append(cid)

    if empty_scenes:
        warnings.append(f"⚠ {len(empty_scenes)} saga(s) sans liste de scènes :")
        for cid in empty_scenes:
            warnings.append(f"     - {cid}")
    if no_hook:
        warnings.append(f"⚠ {len(no_hook)} saga(s) sans champ 'hook' (UX accueil dégradée) :")
        for cid in no_hook[:10]:
            warnings.append(f"     - {cid}")
        if len(no_hook) > 10:
            warnings.append(f"     ... et {len(no_hook) - 10} autres")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--quiet", action="store_true", help="errors only")
    ap.add_argument("--strict", action="store_true", help="exit 1 on warnings too")
    ap.add_argument("--json", action="store_true", help="JSON output")
    args = ap.parse_args()

    errors = []
    warnings = []

    if not CAMPAIGNS_FILE.exists():
        errors.append(f"❌ {CAMPAIGNS_FILE} introuvable")
    else:
        campaigns = load_campaigns()
        if campaigns is None:
            errors.append(f"❌ {CAMPAIGNS_FILE} format inattendu")
            campaigns = []
        scenes_disk = load_scenes_on_disk()

        check_orphans_and_phantoms(scenes_disk, campaigns, errors, warnings)
        check_campaign_duplicates(campaigns, errors, warnings)
        check_next_conventions(scenes_disk, warnings)
        check_campaign_quality(campaigns, warnings)

    if args.json:
        print(json.dumps({"errors": errors, "warnings": warnings,
                          "ok": not errors and (not warnings or not args.strict)},
                         ensure_ascii=False, indent=2))
    else:
        if errors:
            print(color(f"\n═══ ERREURS ({len(errors)}) ═══", "red"))
            for e in errors:
                print(e)
        if warnings and not args.quiet:
            print(color(f"\n═══ WARNINGS ({len(warnings)}) ═══", "yellow"))
            for w in warnings:
                print(w)
        if not errors and not warnings:
            print(color("\n✅ Parité scènes ↔ campaigns OK — aucune anomalie", "green"))
        elif not errors:
            print(color(f"\n✅ Aucune erreur ({len(warnings)} warnings)", "green"))

    if errors:
        sys.exit(1)
    if warnings and args.strict:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
