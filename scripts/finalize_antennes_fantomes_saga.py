#!/usr/bin/env python3
"""
finalize_antennes_fantomes_saga.py — CAS-IN v132r

Finalisation de la saga « L'Affaire des Antennes Fantômes » :
  - Ajoute l'entrée campagne dans data/campaigns.json
  - Ajoute les 7 entrées dans data/scenes-chronology.json
  - Met à jour data/counts.json (scenes +7)

À exécuter APRÈS :
  1. generate_antennes_fantomes_saga.py (qui ajoute NPCs + SCENE_1/2)
  2. Les 5 fichiers scenes/ge-affaire-antennes-fantomes-{3..7}-*.json copiés
"""
import json
import sys
from pathlib import Path
from datetime import datetime, timezone


CAMPAIGN_ENTRY = {
    "id": "saga-antennes-fantomes-geneve",
    "icon": "📡",
    "title": "L'Affaire des Antennes Fantômes",
    "subtitle": "Saga 7 actes · Genève · Premier SMS Blaster judiciarisé en Suisse romande",
    "description": "Mai-décembre 2026 — un retraité de Cologny perd 47 000 CHF en 4 minutes après un SMS prétendument de PostFinance. Vite, 89 plaintes en 5 jours convergent vers GE. La piste mène à un véhicule mobile équipé d'un SMS Blaster (fausse antenne LTE) qui force la connexion des téléphones à proximité et envoie des SMS spoofant PostFinance, UBS, CFF, Sunrise. Du flagrant délit à Carouge à l'audience au TCO 8 mois plus tard, en passant par OFCOM, SCPT, Swisscom Security, FOR-GE, et la coopération internationale Sofia/Chișinău, la saga traverse 10+ articles du CP/CPP/LTC, la Convention de Budapest, l'EIMP, le MROS — et illustre comment se construit (ou s'écroule) un dossier de cybercriminalité organisée transfrontalière.",
    "level": "expert",
    "order": 36,
    "narrative": True,
    "hook": "Un SMS Blaster mobile, un retraité ruiné en 4 minutes, 89 plaintes en 5 jours, un van Volvo XC60 qui se gare en double file à Carouge, et un chef présumé qui reste à Sofia hors d'atteinte de l'extradition.",
    "scenes": [
        "ge-affaire-antennes-fantomes-1-signal-alarme",
        "ge-affaire-antennes-fantomes-2-vague-correlee",
        "ge-affaire-antennes-fantomes-3-piste-telecom",
        "ge-affaire-antennes-fantomes-4-flagrant-delit",
        "ge-affaire-antennes-fantomes-5-forensique-for-ge",
        "ge-affaire-antennes-fantomes-6-cooperation-internationale",
        "ge-affaire-antennes-fantomes-7-audience-tco-geneve"
    ]
}

SCENE_IDS = CAMPAIGN_ENTRY["scenes"]

# Dates progressives (cohérence narrative)
CHRONO_DATES = [
    "2026-05-25",  # Acte 1 — Signal d'alarme
    "2026-05-27",  # Acte 2 — Vague corrélée
    "2026-06-08",  # Acte 3 — Piste télécom
    "2026-06-23",  # Acte 4 — Flagrant délit
    "2026-06-30",  # Acte 5 — Forensique
    "2026-07-15",  # Acte 6 — Coopération internationale
    "2027-01-22"   # Acte 7 — Audience TCO
]


def find_root() -> Path:
    """Trouve la racine CAS-IN à partir de l'emplacement du script."""
    here = Path(__file__).resolve().parent
    for candidate in (here, here.parent):
        if (candidate / 'data' / 'campaigns.json').exists():
            return candidate
    print('[error] Racine CAS-IN introuvable.', file=sys.stderr)
    sys.exit(1)


def main():
    root = find_root()
    print(f'[info] Racine CAS-IN : {root}')

    # Vérifier que les 7 scènes sont présentes
    scenes_dir = root / 'scenes'
    missing = []
    for sid in SCENE_IDS:
        if not (scenes_dir / f'{sid}.json').exists():
            missing.append(sid)
    if missing:
        print(f'[error] Scènes manquantes : {missing}', file=sys.stderr)
        sys.exit(1)
    print(f'  ✅ 7/7 scènes présentes dans scenes/')

    # 1. Ajout de la campagne
    campaigns_path = root / 'data' / 'campaigns.json'
    with open(campaigns_path) as f:
        campaigns_data = json.load(f)
    existing_ids = {c.get('id') for c in campaigns_data['campaigns']}
    if CAMPAIGN_ENTRY['id'] in existing_ids:
        print(f'  ⏭ Campagne {CAMPAIGN_ENTRY["id"]} déjà présente')
    else:
        # Recalculer l'order pour qu'il ne soit pas en doublon
        existing_orders = {c.get('order', 0) for c in campaigns_data['campaigns']}
        next_order = max(existing_orders) + 1 if existing_orders else 1
        CAMPAIGN_ENTRY['order'] = next_order
        campaigns_data['campaigns'].append(CAMPAIGN_ENTRY)
        if 'generated_at' in campaigns_data:
            campaigns_data['generated_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
        with open(campaigns_path, 'w', encoding='utf-8') as f:
            json.dump(campaigns_data, f, ensure_ascii=False, indent=2)
        sagas_total = len([c for c in campaigns_data['campaigns'] if c.get('narrative')])
        print(f'  ✅ Campagne ajoutée (order={next_order}, sagas totales={sagas_total})')

    # 2. Mise à jour scenes-chronology.json
    chronology_path = root / 'data' / 'scenes-chronology.json'
    added_chrono = 0
    if chronology_path.exists():
        with open(chronology_path) as f:
            chronology = json.load(f)

        # Détecter la structure (dict avec liste, ou liste directe)
        if isinstance(chronology, dict):
            # Identifier la clé qui contient la liste
            list_key = None
            for k in ('scenes', 'chronology', 'entries', 'items'):
                if k in chronology and isinstance(chronology[k], list):
                    list_key = k
                    break
            if list_key:
                chrono_list = chronology[list_key]
            else:
                chrono_list = None
        elif isinstance(chronology, list):
            chrono_list = chronology
        else:
            chrono_list = None

        if chrono_list is not None:
            existing_chrono_ids = set()
            for entry in chrono_list:
                if isinstance(entry, dict):
                    eid = entry.get('id') or entry.get('sceneId') or entry.get('scene_id')
                    if eid:
                        existing_chrono_ids.add(eid)
                elif isinstance(entry, str):
                    existing_chrono_ids.add(entry)

            for i, sid in enumerate(SCENE_IDS):
                if sid in existing_chrono_ids:
                    continue
                # Format simple compatible
                new_entry = {
                    "id": sid,
                    "date": CHRONO_DATES[i],
                    "saga": "saga-antennes-fantomes-geneve",
                    "canton": "GE"
                }
                chrono_list.append(new_entry)
                added_chrono += 1

            # Réécrire dans la bonne structure
            if isinstance(chronology, dict) and list_key:
                chronology[list_key] = chrono_list
                if 'generated_at' in chronology:
                    chronology['generated_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
                with open(chronology_path, 'w', encoding='utf-8') as f:
                    json.dump(chronology, f, ensure_ascii=False, indent=2)
            else:
                with open(chronology_path, 'w', encoding='utf-8') as f:
                    json.dump(chrono_list, f, ensure_ascii=False, indent=2)

            print(f'  ✅ {added_chrono} entrées chronologie ajoutées')
        else:
            print('  ⚠ scenes-chronology.json structure non reconnue, skip')
    else:
        print('  ⏭ data/scenes-chronology.json absent (skip)')

    # 3. Mise à jour counts.json
    counts_path = root / 'data' / 'counts.json'
    if counts_path.exists():
        with open(counts_path) as f:
            counts = json.load(f)
        # Recompter directement les scènes sur disque pour avoir le bon chiffre
        scene_files = [f for f in scenes_dir.glob('*.json') if f.name != 'index.json']
        new_scenes_count = len(scene_files)
        old_scenes_count = counts.get('scenes', 0)
        counts['scenes'] = new_scenes_count
        # Compter les sagas
        sagas_count = len([c for c in campaigns_data['campaigns'] if c.get('narrative')])
        if 'sagas' in counts:
            counts['sagas'] = sagas_count
        # Compter les NPCs
        npcs_path = root / 'data' / 'npcs.json'
        if npcs_path.exists():
            with open(npcs_path) as f:
                npcs_data = json.load(f)
            if 'npcs' in counts:
                counts['npcs'] = len(npcs_data.get('npcs', {}))
        if 'generated_at' in counts:
            counts['generated_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
        with open(counts_path, 'w', encoding='utf-8') as f:
            json.dump(counts, f, ensure_ascii=False, indent=2)
        print(f'  ✅ counts.json : scenes {old_scenes_count} → {new_scenes_count}')
        if 'sagas' in counts:
            print(f'     sagas : {sagas_count}')

    print(f'\n[ok] Finalisation terminée.')
    print(f'     - Campagne saga-antennes-fantomes-geneve ajoutée')
    print(f'     - {added_chrono} entrées chronologie')
    print(f'     - counts.json mis à jour')


if __name__ == '__main__':
    main()
