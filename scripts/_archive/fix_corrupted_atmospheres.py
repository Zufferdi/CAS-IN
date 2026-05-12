#!/usr/bin/env python3
"""
fix_corrupted_atmospheres.py — CAS-IN

Corrige le champ `atmosphere` de 5 scènes où il contient un paragraphe entier
(longueur > 50 chars) au lieu d'une clé canonique courte.

Mapping décidé à l'analyse (tags + contexte) :
  cyber-justicier-vigilante-fr      → legal   (recevabilité preuves)
  drone-laufenburg-swissgrid-aargau → state   (cyber-OT national)
  handala-hack-iran-rhne-stryker    → state   (APT étatique iranien)
  mini-natels-prison-pochwies       → raid    (saisies / mobile forensics)
  src-fonctionnaire-russe-kaspersky → state   (espionnage SRC/GRU)

Modifie aussi scenes/index.json pour rester synchrone.

Usage : python3 scripts/fix_corrupted_atmospheres.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCENES_DIR = ROOT / "scenes"
INDEX_PATH = SCENES_DIR / "index.json"

FIX = {
    "cyber-justicier-vigilante-fr":      "legal",
    "drone-laufenburg-swissgrid-aargau": "state",
    "handala-hack-iran-rhne-stryker":    "state",
    "mini-natels-prison-pochwies":       "raid",
    "src-fonctionnaire-russe-kaspersky": "state",
}


def fix_file(scene_id: str, new_atm: str) -> bool:
    p = SCENES_DIR / f"{scene_id}.json"
    if not p.exists():
        print(f"  ✗ {scene_id} : fichier absent")
        return False
    d = json.loads(p.read_text(encoding="utf-8"))
    old = d.get("atmosphere", "")
    if old == new_atm:
        print(f"  ⏭  {scene_id} : déjà corrigé")
        return False
    if len(old) < 50:
        # Soit déjà court, soit valeur valide non-corrompue ; on prévient
        print(f"  ⚠  {scene_id} : atmosphere actuelle = {old!r}, OK déjà courte. "
              f"Mise à jour quand même vers {new_atm!r}.")
    d["atmosphere"] = new_atm
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"  ✓ {scene_id} : atmosphere → {new_atm!r}")
    return True


def fix_index():
    if not INDEX_PATH.exists():
        print("  ✗ scenes/index.json absent")
        return 0
    idx = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    n = 0
    for entry in idx:
        sid = entry.get("id")
        if sid in FIX:
            old = entry.get("atmosphere", "")
            new = FIX[sid]
            if old != new:
                entry["atmosphere"] = new
                n += 1
    if n > 0:
        INDEX_PATH.write_text(
            json.dumps(idx, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    print(f"  ✓ scenes/index.json : {n} entrée(s) mise(s) à jour")
    return n


if __name__ == "__main__":
    print("Correction des atmosphères corrompues …")
    fixed = 0
    for sid, atm in FIX.items():
        if fix_file(sid, atm):
            fixed += 1
    print()
    print("Synchronisation scenes/index.json …")
    fix_index()
    print()
    print(f"Terminé. {fixed} scène(s) corrigée(s).")
