#!/usr/bin/env python3
"""
patch_canton_data_v2.py — Étend CANTON_DATA pour intégrer les 12 nouvelles scènes
(série « 12 scenarios DFIR Swiss » – octobre 2025).

S'appuie sur patch_canton_data.py (v1) qui est lui-même idempotent. Ce script v2
prend la version v1 comme base et y AJOUTE :

  - 2 nouveaux cantons : UR (Uri) et GR (Grisons)
  - 12 nouvelles scènes ventilées dans leurs cantons respectifs

CARTOGRAPHIE DES 12 NOUVELLES SCÈNES
────────────────────────────────────
  TG : cyberbullying-college-thurgovie
  BS : csam-ia-generative-bs
  ZH : lufthansa-zurich-aviation-cyber
  ZG : web3-defi-rug-pull-zoug
  SO : stalkerware-conjugal-soleure
  FR : secte-religieuse-fribourg-extorsion
  GR : voiture-connectee-meurtre-grisons       (nouveau canton)
  UR : catastrophe-naturelle-it-uri             (nouveau canton)
  GE : swiss-air-cabin-crew-leak-geneve
  GE : docker-supply-chain-saas-geneve
  JU : pcap-network-intrusion-jura
  VD : revenge-porn-deepfake-vd

GARANTIE : aucune scène déjà présente n'est retirée. Toutes les choices
éditoriales antérieures (EPFL→VD, RUAG→BE, etc.) sont préservées.

USAGE
─────
    python3 scripts/patch_canton_data_v2.py                   # patch in-place
    python3 scripts/patch_canton_data_v2.py --dry-run         # preview only
    python3 scripts/patch_canton_data_v2.py --scene-app=js/pages/scene-app.js

IDEMPOTENCE : relancer le script ne fait rien si CANTON_DATA est déjà à jour.
"""
from __future__ import annotations
import sys, json, argparse, re
from pathlib import Path


# Base v1 (17 cantons, 95 scènes) + extensions v2 pour les 12 nouvelles scènes
# et les 2 nouveaux cantons (UR, GR).
MERGED_CANTON_DATA = {
    "GE": ["sms-blasters", "darkmarket_2021",
           "cicr_2022", "crypto-stalking-airtag-emirats", "easy-premiere-perquisition",
           "eu-cronos-3", "eu-pegasus-spyware", "ia-generative-faux-titres",
           "supply_chain_sante",
           # NEW v2 :
           "swiss-air-cabin-crew-leak-geneve",
           "docker-supply-chain-saas-geneve"],
    "VD": ["ncmec-cypertip", "lockbit-victime", "comparis_2021", "unine_2022",
           "epfl-recherche-lai-fuite-chine", "epfl-laboratoire-ia-medicale-chine",
           "crypto-tinder-pig-butchering-vaud", "logitech-clop-zero-day-supply-chain",
           "72969-infractions-vaud", "adn-genealogique-cold-case", "cloud-aws-s3-leak",
           "easy-mobile-perdu-train", "eu-crypto-kidnapping", "eu-frontex-deepfake-asylum",
           "iot-camera-compromise", "mineur-etranger-garde-a-vue",
           "perquisition-conjugale",
           # NEW v2 :
           "revenge-porn-deepfake-vd"],
    "VS": ["vetroz-akira", "sati-bec", "rajeunissement-ia", "saxon-curatelle",
           "competence-mpc-vs", "hydro-valais",
           "audit-prestataire-systemique", "bec-pme-geneve-italie",
           "easy-aide-grand-mere-arnaque", "referent-milice-ransomware",
           "valais-cascade-12-communes", "vs-affaire-viege-1-avalanche-saas",
           "vs-affaire-viege-2-osint-bricolage", "vs-affaire-viege-3-mercure-lonza",
           "vs-affaire-viege-4-scada-mattmark", "vs-affaire-viege-5-eimp-milano",
           "vs-affaire-viege-6-perquisition-brig", "vs-affaire-viege-7-audience-tribunal"],
    "FR": ["dab-villaz", "gruyere-coop-affinage-stuxnet",
           "hcfr-bec-transfer-deepfake", "cyber-justicier-vigilante-fr",
           "easy-pme-mot-passe-faible", "fr-affaire-sarine-1-premier-appel",
           "fr-affaire-sarine-2-eimp-stuttgart", "fr-affaire-sarine-3-coordination-cantons",
           "fr-affaire-sarine-4-expertise-unifr", "fr-affaire-sarine-5-audience-recevabilite",
           # NEW v2 :
           "secte-religieuse-fribourg-extorsion"],
    "NE": ["faux-policiers", "harcelement-ne", "handala-hack-iran-rhne-stryker",
           "easy-suspicions-collegues", "evoting-cantonal", "exit-suicide-assiste-conteste",
           "unine_2022"],
    "JU": ["delemont-forum", "jura-vishing-1m", "eu-cer-directive-incident",
           # NEW v2 :
           "pcap-network-intrusion-jura"],
    "BE": ["ruag_2016", "palais_federal", "deepfake-electoral",
           "src-fonctionnaire-russe-kaspersky", "swatch-2020-ot", "whistleblower-ddps"],
    "ZH": ["attribution", "bitlocker", "bitlocker_froid", "mini-natels-prison-pochwies",
           "cistec-2025-sante", "contrefacon-douanes-enquirus", "easy-fake-news-elections",
           "frontieres", "swissport_2022",
           # NEW v2 :
           "lufthansa-zurich-aviation-cyber"],
    "SZ": ["clone-vocal"],
    "TI": ["sati-bec", "lugano-dpfl-mafia-finance",
           "easy-cle-usb-trouvee", "eu-ai-act-cybersecurity", "telephone-scelles"],
    "SG": ["operation-alice", "stgall-infiltration"],
    "AG": ["operation-alice", "attentat-deja-couteau-mineur",
           "drone-laufenburg-swissgrid-aargau"],
    "LU": ["operation-alice"],
    "TG": ["operation-alice",
           # NEW v2 :
           "cyberbullying-college-thurgovie"],
    # Trois cantons ajoutés en v2.x (v1 du patch)
    "BS": ["boutique-fantome",
           # NEW v2 :
           "csam-ia-generative-bs"],
    "SO": ["eu-traite-roumain",
           # NEW v2 :
           "stalkerware-conjugal-soleure"],
    "ZG": ["blanchiment-boites-lettres-fuite",
           # NEW v2 :
           "web3-defi-rug-pull-zoug"],
    # === NOUVEAUX CANTONS V2 ===
    "GR": [  # NEW v2 :
           "voiture-connectee-meurtre-grisons"],
    "UR": [  # NEW v2 :
           "catastrophe-naturelle-it-uri"],
}


def parse_canton_data_block(content: str) -> tuple[str, str, str]:
    """Trouve le bloc 'const CANTON_DATA = { ... };'.

    Renvoie (avant, bloc_existant, après) tels que avant + bloc_existant + après == content.
    """
    # On cherche le début 'const CANTON_DATA' (peut être 'const' ou 'let' ou 'var')
    pattern = re.compile(
        r"((?:const|let|var)\s+CANTON_DATA\s*=\s*)(\{)",
        re.MULTILINE,
    )
    m = pattern.search(content)
    if not m:
        raise SystemExit("❌ Bloc CANTON_DATA introuvable dans scene-app.js")

    # On a 'const CANTON_DATA = ' juste avant l'accolade
    declaration_start = m.start()  # début de 'const CANTON_DATA = '
    brace_pos = m.end() - 1        # position de '{'

    # On parcourt à partir de '{' pour trouver le '}' correspondant.
    depth = 0
    in_str: str | None = None  # '"', "'" ou '`'
    escape = False
    end_pos: int | None = None

    i = brace_pos
    while i < len(content):
        ch = content[i]
        if escape:
            escape = False
        elif in_str is not None:
            if ch == "\\":
                escape = True
            elif ch == in_str:
                in_str = None
        else:
            if ch in ('"', "'", "`"):
                in_str = ch
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end_pos = i
                    break
        i += 1

    if end_pos is None:
        raise SystemExit("❌ Accolade fermante CANTON_DATA introuvable")

    avant = content[:declaration_start]
    bloc = content[declaration_start : end_pos + 1]
    apres = content[end_pos + 1 :]
    return avant, bloc, apres


# Noms officiels des cantons (utilisés dans le format `{ name, scenarios }`)
CANTON_NAMES = {
    "AG": "Argovie", "AI": "Appenzell Rhodes-Intérieures",
    "AR": "Appenzell Rhodes-Extérieures", "BE": "Berne",
    "BL": "Bâle-Campagne", "BS": "Bâle-Ville", "FR": "Fribourg",
    "GE": "Genève", "GL": "Glaris", "GR": "Grisons", "JU": "Jura",
    "LU": "Lucerne", "NE": "Neuchâtel", "NW": "Nidwald", "OW": "Obwald",
    "SG": "Saint-Gall", "SH": "Schaffhouse", "SO": "Soleure",
    "SZ": "Schwyz", "TG": "Thurgovie", "TI": "Tessin", "UR": "Uri",
    "VD": "Vaud", "VS": "Valais", "ZG": "Zoug", "ZH": "Zurich",
}


def render_canton_data(data: dict[str, list[str]]) -> str:
    """Génère un nouveau bloc 'const CANTON_DATA = { ... };' au format
    { name, scenarios } (cohérent avec le scene-app.js v2.10).
    """
    # Conserver l'ordre original (GE, VD, VS, FR, NE, JU, BE, ZH, ...) si possible.
    # Pour les nouveaux cantons (UR, GR), les ajouter à la fin de la liste.
    canonical_order = ["GE", "VD", "VS", "FR", "NE", "JU", "BE", "ZH",
                       "SZ", "TI", "SG", "AG", "LU", "TG",
                       "BS", "SO", "ZG", "GR", "UR"]
    # Filtrer pour ne garder que les cantons présents dans data
    ordered = [c for c in canonical_order if c in data]
    # Ajouter à la fin tous ceux qui n'étaient pas dans canonical_order
    extras = sorted([c for c in data.keys() if c not in canonical_order])
    ordered.extend(extras)

    lines = ["const CANTON_DATA = {"]
    for canton in ordered:
        scenes = data[canton]
        name = CANTON_NAMES.get(canton, canton)
        # Format JSON inline (équivalent à l'original)
        scenarios_json = json.dumps(scenes, ensure_ascii=False)
        lines.append(f'  {canton}: {{ name: "{name}", scenarios: {scenarios_json} }},')
    lines.append("}")
    return "\n".join(lines)


def patch_scene_app(scene_app_path: Path, dry_run: bool) -> int:
    """Patche CANTON_DATA in-place dans scene-app.js."""
    content = scene_app_path.read_text(encoding="utf-8")
    avant, bloc_existant, apres = parse_canton_data_block(content)

    nouveau_bloc = render_canton_data(MERGED_CANTON_DATA)

    if bloc_existant.strip() == nouveau_bloc.strip():
        print("  · CANTON_DATA déjà à jour (rien à faire)")
        return 0

    new_content = avant + nouveau_bloc + apres
    if dry_run:
        # Diff résumé : nb cantons et scènes
        old_canton_count = bloc_existant.count(":")
        old_scene_count = bloc_existant.count("'")  # approximatif
        new_canton_count = len(MERGED_CANTON_DATA)
        new_scene_count = sum(len(v) for v in MERGED_CANTON_DATA.values())
        print(f"  ⚡ DRY-RUN : CANTON_DATA serait étendu :")
        print(f"      cantons : {old_canton_count // 4}+ → {new_canton_count}")
        print(f"      scènes  : {old_scene_count // 2}+ → {new_scene_count}")
    else:
        scene_app_path.write_text(new_content, encoding="utf-8")
        new_canton_count = len(MERGED_CANTON_DATA)
        new_scene_count = sum(len(v) for v in MERGED_CANTON_DATA.values())
        print(f"  ✓ CANTON_DATA patché : {new_canton_count} cantons, "
              f"{new_scene_count} assignations")
    return 1


def main():
    p = argparse.ArgumentParser(description="Patch CANTON_DATA v2 (intégration 12 nouvelles scènes + UR/GR)")
    p.add_argument("--scene-app", default="js/pages/scene-app.js",
                   help="Chemin vers scene-app.js (défaut : js/pages/scene-app.js)")
    p.add_argument("--dry-run", action="store_true",
                   help="Affiche les changements sans modifier le fichier")
    args = p.parse_args()

    scene_app_path = Path(args.scene_app)
    if not scene_app_path.exists():
        raise SystemExit(f"❌ Fichier introuvable : {scene_app_path}")

    print(f"🔧 patch_canton_data_v2.py — {'DRY-RUN' if args.dry_run else 'APPLIQUE'} sur {scene_app_path}")
    n = patch_scene_app(scene_app_path, args.dry_run)
    print(f"\n═══ Total : {n} modification(s)")


if __name__ == "__main__":
    main()
