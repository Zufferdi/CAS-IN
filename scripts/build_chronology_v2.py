#!/usr/bin/env python3
"""
build_chronology_v2.py — v2.93 (Dossiers + Sagas)
─────────────────────────────────────────────────
Régénère data/scenes-chronology.json en :
  1. Rattachant les 34 scènes orphelines à un des 4 groupes narratifs
  2. Ajoutant une section `sagas` qui liste explicitement les affaires
     multi-actes (Viège, Sarine, et l'Initiation pour les easy-*)
  3. Assurant que chaque scene de scenes/index.json est référencée

Idempotent : peut être relancé à chaque ajout de scène.
Usage : python3 scripts/build_chronology_v2.py
"""
import json, os, re, sys, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / 'scenes' / 'index.json'
CHRONO_PATH = ROOT / 'data' / 'scenes-chronology.json'

# ── Rattachement explicite des 34 orphelines aux 4 groupes ─────────────
# Choix éditorial : un orphelin = un groupe + un (year, event) si pertinent
# pour que la vue chronologique ait du sens. Les "easy-*" vont en CAS
# QUOTIDIENS car ce sont des cas d'école du quotidien.
ORPHAN_ASSIGNMENTS = {
    # ── INCIDENTS HISTORIQUES (vraies affaires datées) ──
    'crypto-ag-rubikon-enquete-dfir-2020': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2020, 'month': 2,
        'event': 'Opération Rubicon (Crypto AG)'},
    'hydra-darknet-acheteurs-suisses-bka-2022': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2022, 'month': 4,
        'event': 'Démantèlement Hydra Market'},
    'lockbit-cronos-saisie-serveur-tessin-2024': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2024, 'month': 2,
        'event': 'Opération Cronos (LockBit)'},
    'swisslife-vadian-supply-chain-pensionskassen-2025': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 3,
        'event': 'Supply chain Vadian / Swiss Life'},
    'lufthansa-zurich-aviation-cyber': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2026, 'month': 1,
        'event': 'Akira / Swissport ZRH (aviation)'},
    'antisemitisme-ligne-261bis-zh': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 11,
        'event': 'Campagne antisémite coordonnée (ICZ)'},
    '72969-infractions-vaud': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2026, 'month': 1,
        'event': 'Bilan 2025 Polcant VD — allocation 2026'},
    'web3-defi-rug-pull-zoug': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 6,
        'event': 'Rug pull DeFi — Crypto Valley'},

    # ── SAGA SARINE — tous en HISTORIQUES sous le même event ──
    'fr-affaire-sarine-1-premier-appel': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 1,
        'event': 'Affaire Sarine'},
    'fr-affaire-sarine-2-eimp-stuttgart': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 2,
        'event': 'Affaire Sarine'},
    'fr-affaire-sarine-3-coordination-cantons': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 3,
        'event': 'Affaire Sarine'},
    'fr-affaire-sarine-4-expertise-unifr': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 5,
        'event': 'Affaire Sarine'},
    'fr-affaire-sarine-5-audience-recevabilite': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 9,
        'event': 'Affaire Sarine'},

    # ── SAGA AAR-FRUTIGEN (BE) — tous en HISTORIQUES sous le même event ──
    # Mois dérivés du narratif des scènes (18-28 février → 4 mars).
    'be-affaire-aar-frutigen-1-kantonnet-detection': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 2,
        'event': 'Affaire Aar-Frutigen'},
    'be-affaire-aar-frutigen-2-expert-forensique-jcfc': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 2,
        'event': 'Affaire Aar-Frutigen'},
    'be-affaire-aar-frutigen-3-coordination-47-communes': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 2,
        'event': 'Affaire Aar-Frutigen'},
    'be-affaire-aar-frutigen-4-suspect-ex-dev': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 2,
        'event': 'Affaire Aar-Frutigen'},
    'be-affaire-aar-frutigen-5-audience-tmc': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 3,
        'event': 'Affaire Aar-Frutigen'},

    # ── SAGA SINGINE (FR) — tous en HISTORIQUES sous le même event ──
    # Mois dérivés du narratif (22-27 février → recoupement +3j → audience +6 sem.).
    'fr-affaire-singine-1-ransomware-akira': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 2,
        'event': 'Affaire de la Singine'},
    'fr-affaire-singine-2-continuite-coop': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 2,
        'event': 'Affaire de la Singine'},
    'fr-affaire-singine-3-tracking-crypto-recoupement': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 2,
        'event': 'Affaire de la Singine'},
    'fr-affaire-singine-4-eimp-mros-suspect-commun': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 3,
        'event': 'Affaire de la Singine'},
    'fr-affaire-singine-5-audience-jointe-tf-berne': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2025, 'month': 4,
        'event': 'Affaire de la Singine'},

    # ── CAS QUOTIDIENS — easy-* (initiation) + cas du jour ──
    'easy-aide-grand-mere-arnaque': {
        'group': '💼 CAS QUOTIDIENS', 'year': None, 'month': None,
        'event': 'Initiation — escroquerie aux aînés'},
    'easy-cle-usb-trouvee': {
        'group': '💼 CAS QUOTIDIENS', 'year': None, 'month': None,
        'event': 'Initiation — USB drop'},
    'easy-fake-news-elections': {
        'group': '💼 CAS QUOTIDIENS', 'year': 2026, 'month': None,
        'event': 'Initiation — désinformation'},
    'easy-mobile-perdu-train': {
        'group': '💼 CAS QUOTIDIENS', 'year': None, 'month': None,
        'event': 'Initiation — mobile retrouvé'},
    'easy-pme-mot-passe-faible': {
        'group': '💼 CAS QUOTIDIENS', 'year': 2024, 'month': None,
        'event': 'Initiation — cyberhygiène PME'},
    'easy-premiere-perquisition': {
        'group': '💼 CAS QUOTIDIENS', 'year': None, 'month': None,
        'event': 'Initiation — perquisition mandat'},
    'easy-suspicions-collegues': {
        'group': '💼 CAS QUOTIDIENS', 'year': None, 'month': None,
        'event': 'Initiation — soupçons internes'},
    'cyberbullying-college-thurgovie': {
        'group': '💼 CAS QUOTIDIENS', 'year': 2025, 'month': None,
        'event': 'Cyberharcèlement scolaire TG'},
    'ems-fraude-deepfake-vocal-fils-lu': {
        'group': '💼 CAS QUOTIDIENS', 'year': 2025, 'month': None,
        'event': 'Deepfake vocal EMS LU'},
    'mineur-auteur-defi-tiktok-deces-vd': {
        'group': '💼 CAS QUOTIDIENS', 'year': 2025, 'month': None,
        'event': 'Défi TikTok mortel VD (DPMin)'},
    'stalkerware-conjugal-soleure': {
        'group': '💼 CAS QUOTIDIENS', 'year': None, 'month': None,
        'event': 'Stalkerware violence conjugale SO'},
    'revenge-porn-deepfake-vd': {
        'group': '💼 CAS QUOTIDIENS', 'year': 2025, 'month': None,
        'event': 'Sextorsion deepfake UNIL'},
    'secte-religieuse-fribourg-extorsion': {
        'group': '💼 CAS QUOTIDIENS', 'year': None, 'month': None,
        'event': 'Secte évangélique — extorsion FR'},
    'csam-ia-generative-bs': {
        'group': '💼 CAS QUOTIDIENS', 'year': 2025, 'month': None,
        'event': 'CSAM généré par IA — BS'},
    'swiss-air-cabin-crew-leak-geneve': {
        'group': '💼 CAS QUOTIDIENS', 'year': None, 'month': None,
        'event': 'Insider crew aviation GE'},
    'blanchiment-boites-lettres-fuite': {
        'group': '💼 CAS QUOTIDIENS', 'year': None, 'month': None,
        'event': '33\'000 boîtes — blanchiment'},
    'catastrophe-naturelle-it-uri': {
        'group': '💼 CAS QUOTIDIENS', 'year': None, 'month': None,
        'event': 'Éboulement Brunnen — DC'},
    'contrefacon-douanes-enquirus': {
        'group': '💼 CAS QUOTIDIENS', 'year': None, 'month': None,
        'event': 'Contrefaçon numérique douanes'},
    'voiture-connectee-meurtre-grisons': {
        'group': '💼 CAS QUOTIDIENS', 'year': 2026, 'month': None,
        'event': 'Tesla forensics Klosters/Davos'},

    # ── SAGA GEMMI (VS↔BE) — tous en HISTORIQUES sous le même event ──
    # Narratif : découverte 14 juin 2026 (acte 1), instruction juin-déc 2026, audience 17 déc 2026.
    'ge-affaire-gemmi-1-decouverte-wildstrubel': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2026, 'month': 6,
        'event': 'Affaire de la Gemmi'},
    'ge-affaire-gemmi-2-cluster-wifi': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2026, 'month': 6,
        'event': 'Affaire de la Gemmi'},
    'ge-affaire-gemmi-3-pivot-osint': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2026, 'month': 6,
        'event': 'Affaire de la Gemmi'},
    'ge-affaire-gemmi-4-perquisition-thoune': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2026, 'month': 6,
        'event': 'Affaire de la Gemmi'},
    'ge-affaire-gemmi-5-audience-thoune': {
        'group': '🌍 INCIDENTS HISTORIQUES', 'year': 2026, 'month': 12,
        'event': 'Affaire de la Gemmi'},

    # ── MÉTHODOLOGIE (techniques transversales) ──
    'docker-supply-chain-saas-geneve': {
        'group': '🛠️ MÉTHODOLOGIE', 'year': 2026, 'month': None,
        'event': 'Container Docker — supply chain'},
    'pcap-network-intrusion-jura': {
        'group': '🛠️ MÉTHODOLOGIE', 'year': 2026, 'month': None,
        'event': 'PCAP forensics — adm. Jura'},
}

# ── Sagas explicites (ordre narratif strict) ───────────────────────────
SAGAS = [
    {
        'id': 'affaire_viege',
        'title': 'L\'Affaire de la Viège',
        'subtitle': 'Fil rouge valaisan — 7 actes',
        'icon': '🏔',
        'canton': 'VS',
        'year_range': '2025',
        'tagline': 'Une avalanche, du mercure, un barrage. Un seul réseau — entre Saas Fee et Reggio Calabria.',
        'difficulty_curve': ['easy', 'medium', 'medium', 'hard', 'hard', 'hard', 'expert'],
        'scenes': [
            'vs-affaire-viege-1-avalanche-saas',
            'vs-affaire-viege-2-osint-bricolage',
            'vs-affaire-viege-3-mercure-lonza',
            'vs-affaire-viege-4-scada-mattmark',
            'vs-affaire-viege-5-eimp-milano',
            'vs-affaire-viege-6-perquisition-brig',
            'vs-affaire-viege-7-audience-tribunal',
        ],
        'completion_badge': 'saga_viege',
        'completion_xp_bonus': 200,
    },
    {
        'id': 'affaire_sarine',
        'title': 'L\'Affaire Sarine',
        'subtitle': 'Fil rouge fribourgeois — 5 actes',
        'icon': '🏰',
        'canton': 'FR',
        'year_range': '2025',
        'tagline': 'Une PME, une coopérative, un club de hockey. Tous frappés par le même groupe.',
        'difficulty_curve': ['easy', 'hard', 'medium', 'hard', 'expert'],
        'scenes': [
            'fr-affaire-sarine-1-premier-appel',
            'fr-affaire-sarine-2-eimp-stuttgart',
            'fr-affaire-sarine-3-coordination-cantons',
            'fr-affaire-sarine-4-expertise-unifr',
            'fr-affaire-sarine-5-audience-recevabilite',
        ],
        'completion_badge': 'saga_sarine',
        'completion_xp_bonus': 150,
    },
    {
        'id': 'affaire_aar_frutigen',
        'title': 'L\'Affaire Aar-Frutigen',
        'subtitle': 'Fil rouge bernois — 5 actes',
        'icon': '🏛️',
        'canton': 'BE',
        'year_range': '2025',
        'tagline': 'Quand le fournisseur tombe, tout tombe — 47 communes, un implant, un wallet Bitcoin.',
        'difficulty_curve': ['medium', 'hard', 'medium', 'hard', 'expert'],
        'scenes': [
            'be-affaire-aar-frutigen-1-kantonnet-detection',
            'be-affaire-aar-frutigen-2-expert-forensique-jcfc',
            'be-affaire-aar-frutigen-3-coordination-47-communes',
            'be-affaire-aar-frutigen-4-suspect-ex-dev',
            'be-affaire-aar-frutigen-5-audience-tmc',
        ],
        'completion_badge': 'saga_aar_frutigen',
        'completion_xp_bonus': 150,
    },
    {
        'id': 'affaire_singine',
        'title': 'L\'Affaire de la Singine',
        'subtitle': 'Fil rouge singinois — 5 actes',
        'icon': '🧀',
        'canton': 'FR',
        'year_range': '2025',
        'tagline': 'Le froid attend. Le ransomware aussi — et l\'attaquant a aussi sévi côté bernois.',
        'difficulty_curve': ['medium', 'hard', 'medium', 'expert', 'expert'],
        'scenes': [
            'fr-affaire-singine-1-ransomware-akira',
            'fr-affaire-singine-2-continuite-coop',
            'fr-affaire-singine-3-tracking-crypto-recoupement',
            'fr-affaire-singine-4-eimp-mros-suspect-commun',
            'fr-affaire-singine-5-audience-jointe-tf-berne',
        ],
        'completion_badge': 'saga_singine',
        'completion_xp_bonus': 150,
    },
    {
        'id': 'initiation',
        'title': 'Parcours d\'Initiation',
        'subtitle': 'Premier contact avec la DFIR — 7 cas faciles',
        'icon': '🎓',
        'canton': 'CH',
        'year_range': '—',
        'tagline': 'Sept réflexes à acquérir avant d\'attaquer les vraies affaires.',
        'difficulty_curve': ['easy'] * 7,
        'scenes': [
            'easy-premiere-perquisition',
            'easy-cle-usb-trouvee',
            'easy-mobile-perdu-train',
            'easy-pme-mot-passe-faible',
            'easy-aide-grand-mere-arnaque',
            'easy-fake-news-elections',
            'easy-suspicions-collegues',
        ],
        'completion_badge': 'saga_initiation',
        'completion_xp_bonus': 100,
    },
    {
        'id': 'affaire_gemmi',
        'title': 'L\'Affaire de la Gemmi',
        'subtitle': 'Fil rouge intercantonal — 5 actes (VS↔BE)',
        'icon': '📷',
        'canton': 'VS',
        'year_range': '2026',
        'tagline': 'Une lentille de 4 mm dans un détecteur de fumée. Et 78 vies bouleversées — entre Loèche-les-Bains et Thoune.',
        'difficulty_curve': ['easy'] * 5,
        'scenes': [
            'ge-affaire-gemmi-1-decouverte-wildstrubel',
            'ge-affaire-gemmi-2-cluster-wifi',
            'ge-affaire-gemmi-3-pivot-osint',
            'ge-affaire-gemmi-4-perquisition-thoune',
            'ge-affaire-gemmi-5-audience-thoune',
        ],
        'completion_badge': 'saga_gemmi',
        'completion_xp_bonus': 120,
    },
]


def main():
    # Charger l'existant
    with open(CHRONO_PATH, 'r', encoding='utf-8') as f:
        chrono = json.load(f)
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        index = json.load(f)
    idx_by_id = {s['id']: s for s in index}

    existing_ids = {s['id'] for s in chrono['scenes']}
    all_ids = set(idx_by_id.keys())
    orphans = sorted(all_ids - existing_ids)

    print(f'[chronology] existing={len(existing_ids)} all={len(all_ids)} orphans={len(orphans)}')

    # Orphelines sans assignment : signalées et ignorées (elles n'apparaîtront
    # pas dans la vue chronologique tant qu'on ne leur a pas donné d'entrée
    # dans ORPHAN_ASSIGNMENTS), sans interrompre le build.
    missing = [o for o in orphans if o not in ORPHAN_ASSIGNMENTS]
    if missing:
        print(f'[chronology] ⚠ {len(missing)} orpheline(s) SANS ASSIGNMENT — '
              f'ignorée(s) pour la chronologie (à compléter dans ORPHAN_ASSIGNMENTS) :')
        for m in missing:
            s = idx_by_id.get(m, {})
            print(f'  - {m} (difficulty={s.get("difficulty","?")}, title={s.get("title","")[:60]})')

    # Ajouter chaque orphelin disposant d'un assignment
    added = 0
    for oid in orphans:
        if oid not in ORPHAN_ASSIGNMENTS:
            continue
        s = idx_by_id[oid]
        ass = ORPHAN_ASSIGNMENTS[oid]
        entry = {
            'id': oid,
            'title': s.get('title', oid),
            'icon': s.get('icon', '📌'),
            'difficulty': s.get('difficulty', 'medium'),
            'year': ass['year'],
            'month': ass['month'],
            'event': ass['event'],
            'group': ass['group'],
            'tags': s.get('tags', []),
            'steps_count': s.get('stepCount', 0),
        }
        chrono['scenes'].append(entry)
        added += 1

    # Tri global par groupe, puis par année (None en fin), puis mois
    def sort_key(s):
        y = s.get('year') if s.get('year') is not None else 9999
        m = s.get('month') if s.get('month') is not None else 99
        return (s.get('group', ''), y, m, s.get('title', ''))

    chrono['scenes'].sort(key=sort_key)

    # Mise à jour métadonnées
    chrono['$generated_at'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    chrono['$version'] = 'v2.93-dossiers-sagas'
    chrono['$description'] = (
        'Ordre chronologique narratif des scénarios CAS-IN. '
        'Permet une présentation par décennie/année dans la vue Dossiers. '
        'La section sagas regroupe les affaires multi-actes (Viège, Sarine, Initiation).'
    )

    # Ajouter les sagas (avec validation que toutes les scènes existent)
    for saga in SAGAS:
        for scene_id in saga['scenes']:
            if scene_id not in all_ids:
                print(f'[chronology] ⚠ Saga "{saga["id"]}" référence scène inconnue : {scene_id}')
                sys.exit(2)
    chrono['sagas'] = SAGAS

    # Stats
    from collections import Counter
    by_group = Counter(s['group'] for s in chrono['scenes'])
    print(f'\n[chronology] +{added} scènes ajoutées. Total = {len(chrono["scenes"])}')
    print('[chronology] répartition par groupe :')
    for g in chrono['groups_order']:
        print(f'  {g}: {by_group[g]}')
    print(f'[chronology] {len(chrono["sagas"])} sagas définies :')
    for s in chrono['sagas']:
        print(f'  - {s["id"]}: {len(s["scenes"])} actes')

    # Écriture
    with open(CHRONO_PATH, 'w', encoding='utf-8') as f:
        json.dump(chrono, f, indent=2, ensure_ascii=False)
    print(f'\n[chronology] ✓ écrit dans {CHRONO_PATH.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
