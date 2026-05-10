#!/usr/bin/env python3
"""
fix_tags_sagas.py — Normalise UNIQUEMENT les tags lowercase/avec-tirets
des sagas FR-Sarine et VS-Viège pour les aligner sur la convention dominante
du catalogue (UPPERCASE, espaces).

CHIRURGICAL : ne touche QUE les 12 fichiers des sagas. Les autres scènes
ne sont PAS modifiées (leurs accents et tirets restent intacts).

PROBLÈME DÉTECTÉ
────────────────
Les sagas FR-Sarine (×5) et VS-Viège (×7) ont été écrites avec une convention
de tags différente du reste du catalogue :
  - lowercase : 'fribourg', 'eimp', 'forensique'
  - tirets    : 'memory-forensics', 'art-141-cpp'

Le reste du catalogue utilise UPPERCASE avec espaces : 'FRIBOURG', 'EIMP',
'FORENSIQUE', 'MEMORY FORENSICS', 'ART 141 CPP'.

STRATÉGIE
─────────
Pour chaque tag de chaque saga :
  1. Convertir en UPPERCASE
  2. Remplacer tirets par espaces
  3. Préserver les accents (le catalogue les utilise : COMPÉTENCE, SCELLÉS, etc.)
  4. Dédupliquer

Exemples :
  'fribourg' → 'FRIBOURG'
  'art-141-cpp' → 'ART 141 CPP'
  'scellés' → 'SCELLÉS' (accent préservé)
  'memory-forensics' → 'MEMORY FORENSICS'
  'sociétés-écran' → 'SOCIÉTÉS ÉCRAN' (accents préservés)

GARANTIE
────────
- Liste de cibles HARDCODÉE (12 fichiers nommément).
- Idempotent : relancer ne fait rien sur des tags déjà normalisés.

USAGE
─────
    python3 scripts/fix_tags_sagas.py                    # apply
    python3 scripts/fix_tags_sagas.py --dry-run          # preview
    python3 scripts/fix_tags_sagas.py --scenes-dir=...
"""
from __future__ import annotations
import json, argparse
from pathlib import Path


# Liste explicite des fichiers à normaliser. Aucune autre scène ne sera touchée.
TARGET_FILES = {
    "fr-affaire-sarine-1-premier-appel.json",
    "fr-affaire-sarine-2-eimp-stuttgart.json",
    "fr-affaire-sarine-3-coordination-cantons.json",
    "fr-affaire-sarine-4-expertise-unifr.json",
    "fr-affaire-sarine-5-audience-recevabilite.json",
    "vs-affaire-viege-1-avalanche-saas.json",
    "vs-affaire-viege-2-osint-bricolage.json",
    "vs-affaire-viege-3-mercure-lonza.json",
    "vs-affaire-viege-4-scada-mattmark.json",
    "vs-affaire-viege-5-eimp-milano.json",
    "vs-affaire-viege-6-perquisition-brig.json",
    "vs-affaire-viege-7-audience-tribunal.json",
}


def normalize_tag(tag: str) -> str:
    """UPPERCASE + tirets→espaces. Accents PRÉSERVÉS."""
    if not isinstance(tag, str) or not tag:
        return tag
    t = tag.replace("-", " ")
    t = t.upper()
    # Retire les espaces multiples
    t = " ".join(t.split())
    return t


def fix_scene(scene_path: Path, dry_run: bool) -> tuple[bool, list[str]]:
    """Applique la normalisation. Retourne (modified, changes)."""
    try:
        d = json.loads(scene_path.read_text(encoding="utf-8"))
    except Exception as e:
        return False, [f"❌ erreur lecture ({e})"]

    if "tags" not in d or not isinstance(d["tags"], list):
        return False, []

    old_tags = list(d["tags"])
    new_tags = [normalize_tag(t) if isinstance(t, str) else t for t in old_tags]

    changes = [f"'{o}' → '{n}'" for o, n in zip(old_tags, new_tags) if o != n]

    # Dédupliquer en préservant l'ordre
    seen = set()
    deduped = []
    for t in new_tags:
        if t not in seen:
            seen.add(t)
            deduped.append(t)
    if len(deduped) != len(new_tags):
        changes.append(f"(dédupliqué : {len(new_tags)} → {len(deduped)} tags)")
    new_tags = deduped

    if not changes:
        return False, []

    if not dry_run:
        d["tags"] = new_tags
        scene_path.write_text(
            json.dumps(d, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    return True, changes


def main():
    p = argparse.ArgumentParser(description="Normalise les tags des sagas FR-Sarine et VS-Viège")
    p.add_argument("--scenes-dir", default="scenes",
                   help="Dossier des scènes (défaut : scenes/)")
    p.add_argument("--dry-run", action="store_true",
                   help="Affiche les changements sans modifier")
    args = p.parse_args()

    scenes_dir = Path(args.scenes_dir)
    if not scenes_dir.is_dir():
        raise SystemExit(f"❌ Dossier introuvable : {scenes_dir}")

    print(f"🔧 fix_tags_sagas.py — {'DRY-RUN' if args.dry_run else 'APPLIQUE'} sur {scenes_dir}/")
    print(f"   Cibles : {len(TARGET_FILES)} fichiers (sagas FR-Sarine + VS-Viège)")
    print()

    n_modified = 0
    n_changes = 0
    for fname in sorted(TARGET_FILES):
        path = scenes_dir / fname
        if not path.exists():
            print(f"  · {fname} : absent (ignoré)")
            continue
        modified, changes = fix_scene(path, args.dry_run)
        if modified:
            n_modified += 1
            n_changes += len(changes)
            print(f"  {'⚡ DRY' if args.dry_run else '✓ FIX'} [{fname}] — {len(changes)} changement(s)")
            for c in changes:
                print(f"      · {c}")
        else:
            print(f"  · {fname} : déjà normalisé")

    print()
    print(f"═══ Total : {n_modified} fichier(s) modifié(s), {n_changes} tag(s) normalisé(s)")


if __name__ == "__main__":
    main()
