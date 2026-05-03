#!/usr/bin/env python3
"""
check_scenes_balance.py

Vérifie l'équilibrage des choix dans chaque step des scènes :
  • Pour chaque step, mesure l'écart de longueur (chars) entre le bon choix
    et les distracteurs.
  • Signale les steps où l'écart > 30% (warning) ou > 50% (erreur).
  • Le but : éviter le biais "longueur révélatrice" où un étudiant peut
    deviner la bonne réponse simplement parce qu'elle est plus longue.

Sortie :
  - tableau résumé par scène
  - exit code 0 si aucun écart > 50% (cible atteinte)
  - exit code 1 sinon

Usage :
  python3 scripts/check_scenes_balance.py [scene_id]   # une scène
  python3 scripts/check_scenes_balance.py              # toutes les scènes v2.24+
"""

from __future__ import annotations

import json
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCENES_DIR = ROOT / "scenes"

# Seuils
WARN_THRESHOLD = 30   # %
ERROR_THRESHOLD = 50  # %


def analyze_scene(path: Path) -> dict:
    s = json.loads(path.read_text(encoding="utf-8"))
    steps_report = []
    max_dev = 0.0
    n_warn = 0
    n_error = 0
    for i, step in enumerate(s.get("steps", [])):
        choices = step.get("choices", [])
        if not choices:
            continue
        ok_idx = next((j for j, c in enumerate(choices) if c.get("ok") is True), None)
        if ok_idx is None:
            continue
        ok_len = len(choices[ok_idx]["text"])
        all_lens = [len(c["text"]) for c in choices]
        avg = statistics.mean(all_lens)
        dev = max(abs(l - avg) / avg * 100 for l in all_lens)
        max_dev = max(max_dev, dev)
        status = "ok"
        if dev > ERROR_THRESHOLD:
            status = "error"
            n_error += 1
        elif dev > WARN_THRESHOLD:
            status = "warn"
            n_warn += 1
        steps_report.append({
            "step": i,
            "ok_len": ok_len,
            "lens": all_lens,
            "deviation": round(dev, 0),
            "status": status,
        })
    return {
        "id": s.get("id", path.stem),
        "max_deviation": round(max_dev, 0),
        "n_warn": n_warn,
        "n_error": n_error,
        "steps": steps_report,
    }


def main() -> None:
    args = sys.argv[1:]
    if args:
        targets = [SCENES_DIR / f"{a}.json" for a in args]
    else:
        # Liste des scènes v2.24 + v2.28 + v2.29 + v2.30
        targets = [
            # v2.24 (5 scènes)
            SCENES_DIR / "gruyere-coop-affinage-stuxnet.json",
            SCENES_DIR / "epfl-recherche-lai-fuite-chine.json",
            SCENES_DIR / "epfl-laboratoire-ia-medicale-chine.json",
            SCENES_DIR / "lugano-dpfl-mafia-finance.json",
            SCENES_DIR / "hcfr-bec-transfer-deepfake.json",
            # v2.28 (3 scènes)
            SCENES_DIR / "crypto-tinder-pig-butchering-vaud.json",
            SCENES_DIR / "attentat-deja-couteau-mineur.json",
            SCENES_DIR / "logitech-clop-zero-day-supply-chain.json",
            # v2.29 nouveaux (2 scènes)
            SCENES_DIR / "mini-natels-prison-pochwies.json",
            SCENES_DIR / "drone-laufenburg-swissgrid-aargau.json",
            # v2.29 retrofit bloc 1 (5 scènes)
            SCENES_DIR / "attribution.json",
            SCENES_DIR / "bec-pme-geneve-italie.json",
            SCENES_DIR / "bitlocker.json",
            SCENES_DIR / "adn-genealogique-cold-case.json",
            SCENES_DIR / "agent-infiltre-darknet-14-mois.json",
            # v2.30 nouveaux (2 scènes)
            SCENES_DIR / "handala-hack-iran-rhne-stryker.json",
            SCENES_DIR / "cyber-justicier-vigilante-fr.json",
            # v2.30 retrofit bloc 2 (5 scènes)
            SCENES_DIR / "audit-prestataire-systemique.json",
            SCENES_DIR / "banque-privee-mlat.json",
            SCENES_DIR / "banquier-fantome.json",
            SCENES_DIR / "boutique-fantome.json",
            SCENES_DIR / "clone-vocal.json",
            # v2.31 retrofit bloc 3 (5 scènes)
            SCENES_DIR / "burgenstock-neutralite.json",
            SCENES_DIR / "cicr_2022.json",
            SCENES_DIR / "cistec-2025-sante.json",
            SCENES_DIR / "cloud-aws-s3-leak.json",
            SCENES_DIR / "comparis_2021.json",
            # v2.32 retrofit bloc 4 (5 scènes)
            SCENES_DIR / "conclusion.json",
            SCENES_DIR / "coup-de-filet-europol-27-pays.json",
            SCENES_DIR / "crypto-stalking-airtag-emirats.json",
            SCENES_DIR / "dab-villaz.json",
            SCENES_DIR / "deepfake-electoral.json",
            # v2.33 nouveau (1 scène)
            SCENES_DIR / "src-fonctionnaire-russe-kaspersky.json",
            # v2.33 retrofit bloc 5 (5 scènes)
            SCENES_DIR / "darkmarket_2021.json",
            SCENES_DIR / "deepfake-audio-garde-a-vue.json",
            SCENES_DIR / "delemont-forum.json",
            SCENES_DIR / "eu-crypto-kidnapping.json",
            SCENES_DIR / "eu-cyber-trading-fraud.json",
            # v2.34 retrofit bloc 6 (5 scènes)
            SCENES_DIR / "eu-endgame-botnets.json",
            SCENES_DIR / "eu-traite-roumain.json",
            SCENES_DIR / "faux-policiers.json",
            SCENES_DIR / "fileless.json",
            SCENES_DIR / "hydro-valais.json",
            # v2.35 retrofit bloc 7 (5 scènes)
            SCENES_DIR / "flubot-bec-cascade.json",
            SCENES_DIR / "frontieres.json",
            SCENES_DIR / "harcelement-ne.json",
            SCENES_DIR / "ia-generative-faux-titres.json",
            SCENES_DIR / "iot-camera-compromise.json",
            # v2.36 retrofit bloc 8 (5 scènes)
            SCENES_DIR / "ip_accusatrice.json",
            SCENES_DIR / "jura-vishing-1m.json",
            SCENES_DIR / "kks-deepfake.json",
            SCENES_DIR / "lockbit-victime.json",
            SCENES_DIR / "lsi-vs-lpd-timing.json",
        ]

    has_error = False
    print(f"{'Scène':<40} {'Max dev':<10} {'Steps OK':<10} {'⚠':<5} {'✗':<5}")
    print("─" * 75)
    total_warn = 0
    total_error = 0
    for path in targets:
        if not path.exists():
            print(f"  ⚠ Manquante : {path.name}")
            continue
        rep = analyze_scene(path)
        ok_count = sum(1 for s in rep["steps"] if s["status"] == "ok")
        total = len(rep["steps"])
        marker = "✓" if rep["n_error"] == 0 else "✗"
        print(f"{marker} {rep['id']:<38} {rep['max_deviation']:>4}%      {ok_count}/{total:<10}{rep['n_warn']:<5}{rep['n_error']:<5}")
        if rep["n_error"]:
            has_error = True
        total_warn += rep["n_warn"]
        total_error += rep["n_error"]

    print("─" * 75)
    print(f"  Total: ⚠ {total_warn} warnings   ✗ {total_error} errors")
    print()
    if has_error:
        print("→ Au moins une scène a un écart > 50% (déséquilibre majeur).")
        print("  Étoffer les distracteurs pour qu'ils contiennent autant de détail.")
        sys.exit(1)
    elif total_warn:
        print("→ Quelques warnings (écart 30-50%) — acceptable mais à surveiller.")
        sys.exit(0)
    else:
        print("✓ Tous les steps équilibrés (écart < 30%) !")
        sys.exit(0)


if __name__ == "__main__":
    main()
