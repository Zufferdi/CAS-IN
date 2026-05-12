#!/usr/bin/env python3
"""
split_scenes.py — Split scenes.js → scenes/index.json + scenes/{id}.json
================================================================================

Stratégie d'architecture :
  • scenes.js (1.5 MB monolithique) → un fichier index léger (~40 KB)
    + 64 fichiers individuels (~25 KB chacun).
  • Chargement initial : seulement l'index (lobby).
  • Chargement à la demande : scene/{id}.json quand l'utilisateur lance.

Champs de l'index (légers, suffisants pour le lobby et la recherche) :
  id, title, icon, difficulty, atmosphere, tags, intro, stepCount,
  realCase (bool), region (si présent)

Champs du fichier individuel : tout (incluant steps[], debrief, narrative…).

Idempotent : peut être rejoué à chaque modif de scenes.js.

Usage :
    python3 scripts/split_scenes.py
    python3 scripts/split_scenes.py --src ./scenes.js --out ./scenes
"""
import json, re, argparse, sys
from pathlib import Path


# Champs minimaux dans l'index (pour le lobby + recherche)
INDEX_FIELDS = ['id', 'title', 'icon', 'difficulty', 'atmosphere',
                'tags', 'intro', 'alertLevel']


def parse_scenes_js(text):
    """Extrait le tableau JS `var SCENES = [...]` et le parse comme JSON."""
    m = re.match(r'.*?var\s+SCENES\s*=\s*(\[.*\])\s*;?\s*$', text, re.DOTALL)
    if not m:
        raise ValueError("Pattern 'var SCENES = [...]' introuvable dans le fichier source")
    return json.loads(m.group(1))


def build_index_entry(scene):
    """Construit une entrée d'index à partir d'une scène complète."""
    entry = {}
    for k in INDEX_FIELDS:
        if k in scene:
            entry[k] = scene[k]
    entry['stepCount'] = len(scene.get('steps', []))
    # legalRefs : utile pour le filtrage par cadre légal
    if 'legalRefs' in scene:
        entry['legalRefs'] = scene['legalRefs']
    # realCase / region : drapeaux optionnels
    if scene.get('realCase'):
        entry['realCase'] = True
    if 'region' in scene:
        entry['region'] = scene['region']
    return entry


def validate_scene(scene, idx):
    """Vérifie qu'une scène est exploitable (champs requis présents)."""
    errors = []
    if not scene.get('id'):
        errors.append(f"  scene[{idx}] : id manquant")
    if not scene.get('title'):
        errors.append(f"  scene[{idx}] (id={scene.get('id', '?')}) : title manquant")
    if not isinstance(scene.get('steps'), list) or not scene.get('steps'):
        errors.append(f"  scene[{idx}] (id={scene.get('id', '?')}) : steps[] manquant ou vide")
    # id doit pouvoir servir de nom de fichier
    sid = scene.get('id', '')
    if not re.match(r'^[a-zA-Z0-9_\-]+$', sid):
        errors.append(f"  scene[{idx}] : id '{sid}' contient des caractères interdits "
                      f"(autorisé : a-z A-Z 0-9 _ -)")
    return errors


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', default='scenes.js',
                    help="Fichier source (defaut: scenes.js)")
    ap.add_argument('--out', default='scenes',
                    help="Dossier de sortie (defaut: scenes/)")
    ap.add_argument('--minify', action='store_true',
                    help="JSON compact (par défaut : indenté pour lisibilité)")
    ap.add_argument('--clean', action='store_true',
                    help="Supprimer scenes/*.json existants avant écriture")
    args = ap.parse_args()

    src = Path(args.src)
    out = Path(args.out)

    if not src.exists():
        print(f"❌ Fichier source introuvable : {src}", file=sys.stderr)
        sys.exit(1)

    # ─── Parser scenes.js ───────────────────────────────────────
    print(f"╔══ split_scenes.py")
    print(f"║   Source  : {src}")
    print(f"║   Sortie  : {out}/")
    print(f"║   Format  : {'compact' if args.minify else 'indenté'}")

    try:
        text = src.read_text(encoding='utf-8')
        scenes = parse_scenes_js(text)
    except (ValueError, json.JSONDecodeError) as e:
        print(f"║   ❌ Parse error : {e}")
        sys.exit(1)

    print(f"║   Scènes  : {len(scenes)}")
    print(f"╚══")
    print()

    # ─── Validation ────────────────────────────────────────────
    all_errors = []
    seen_ids = {}
    for i, scene in enumerate(scenes):
        all_errors.extend(validate_scene(scene, i))
        sid = scene.get('id', '')
        if sid in seen_ids:
            all_errors.append(f"  scene[{i}] : id '{sid}' déjà utilisé "
                              f"par scene[{seen_ids[sid]}] (doublon)")
        else:
            seen_ids[sid] = i

    if all_errors:
        print("⚠️  Erreurs de validation :")
        for e in all_errors:
            print(e)
        print()
        print("❌ Abandon — corriger les erreurs ci-dessus avant de splitter.")
        sys.exit(1)

    print(f"✓ Validation : {len(scenes)} scènes valides, IDs uniques")
    print()

    # ─── Préparer le dossier de sortie ─────────────────────────
    out.mkdir(parents=True, exist_ok=True)
    if args.clean:
        for f in out.glob('*.json'):
            f.unlink()
            print(f"  🗑  {f.name}")

    # ─── Écrire l'index ────────────────────────────────────────
    index = [build_index_entry(s) for s in scenes]
    index_path = out / 'index.json'

    indent = None if args.minify else 2
    index_path.write_text(
        json.dumps(index, ensure_ascii=False, indent=indent),
        encoding='utf-8'
    )
    idx_size = index_path.stat().st_size
    print(f"📑 Index   : {index_path} ({idx_size:,} bytes, {len(index)} entrées)")

    # ─── Écrire chaque scène ───────────────────────────────────
    total_scenes_size = 0
    sizes = []
    for scene in scenes:
        sid = scene['id']
        path = out / f"{sid}.json"
        path.write_text(
            json.dumps(scene, ensure_ascii=False, indent=indent),
            encoding='utf-8'
        )
        size = path.stat().st_size
        total_scenes_size += size
        sizes.append((sid, size))

    sizes.sort(key=lambda x: x[1])
    print(f"🎬 Scènes  : {len(scenes)} fichiers, {total_scenes_size:,} bytes total")
    print(f"   Min/médiane/max :")
    print(f"     - {sizes[0][0]:30s} {sizes[0][1]:6,} bytes")
    if len(sizes) >= 3:
        print(f"     - {sizes[len(sizes)//2][0]:30s} {sizes[len(sizes)//2][1]:6,} bytes")
        print(f"     - {sizes[-1][0]:30s} {sizes[-1][1]:6,} bytes")
    print()

    # ─── Résumé ────────────────────────────────────────────────
    src_size = src.stat().st_size
    print(f"═══ Résumé")
    print(f"   {src.name:30s} : {src_size:,} bytes")
    print(f"   {index_path.name:30s} : {idx_size:,} bytes")
    print(f"   64 × scenes/{{id}}.json    : {total_scenes_size:,} bytes (chargés à la demande)")
    print()
    print(f"   Boot initial avant : {src_size:,} bytes")
    print(f"   Boot initial après : {idx_size:,} bytes")
    print(f"   Gain               : -{(1 - idx_size/src_size)*100:.1f}%")
    print()
    print(f"💡 Penser à :")
    print(f"   • Mettre à jour sw.js (cache scenes/index.json en network-first,")
    print(f"     scenes/*.json en cache-first)")
    print(f"   • Mettre à jour scene-app.js (loadSceneIndex + loadScene async)")
    print(f"   • Mettre à jour cas-in-search.js (lit scenes/index.json au lieu de scenes.js)")


if __name__ == '__main__':
    main()
