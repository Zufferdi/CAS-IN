#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v2.71 — Corrections manuelles ciblées des inférences automatiques.

Cas connus mal classifiés que l'auto-inférence rate :
  - Victimes (pattern texte trop strict)
  - Adversaires manqués (criminels indirects)
  - Cantons mal détectés
  - Catégorie civil par défaut quand on a mieux
"""
import json
import re

# ════════════════════════════════════════════════════════════════
# Corrections explicites par PNJ
# ════════════════════════════════════════════════════════════════

OVERRIDES = {
    # ── Victimes (pattern auto les rate) ─────────────────────────
    'eleonore': {
        'alignment': 'victim',
        'category': 'civil',
        'personality': {
            'communication': 'émotif',
            'tech_level': 'novice',
            'stress_response': 'paralysé',
            'trust_initial': 'méfiant',
        },
    },

    # ── Réels publics (5 personnages, statut neutre/ally selon rôle) ──
    'nicolet': {
        'alignment': 'ally',
        'category': 'justice',
        'seniority': 'expert',
        'canton': 'CHF',
        'personality': {
            'communication': 'formel',
            'tech_level': 'avancé',
            'stress_response': 'calme',
            'trust_initial': 'neutre',
        },
    },
    'blattler': {
        'alignment': 'ally',
        'category': 'justice',
        'seniority': 'expert',
        'canton': 'CHF',
        'personality': {
            'communication': 'formel',
            'tech_level': 'avancé',
            'stress_response': 'calme',
            'trust_initial': 'neutre',
        },
    },

    # ── Cas tinguely (clé de l'arc easy) ─────────────────────────
    'tinguely': {
        'alignment': 'ally',  # témoin clé, pas victime
        'category': 'civil',
        'seniority': 'expert',  # 31 ans d'expérience
        'canton': 'FR',
        'personality': {
            'communication': 'direct',
            'tech_level': 'novice',
            'stress_response': 'calme',
            'trust_initial': 'ouvert',
        },
    },

    # ── Mentor de l'arc easy (sg_polcyber_chief) ─────────────────
    'sg_polcyber_chief': {
        'alignment': 'ally',
        'category': 'police',
        'seniority': 'senior',
        'canton': 'SG',
        'personality': {
            'communication': 'direct',
            'tech_level': 'expert',
            'stress_response': 'calme',
            'trust_initial': 'ouvert',
        },
    },

    # ── Adversaires manqués (criminels camouflés en role neutre) ─
    'ds_hcfr': {  # Directeur sportif fictif - sponsor/manipulateur
        'alignment': 'adversary',
        'category': 'criminel',
        'seniority': 'expert',
    },

    # ── Cas border : pattern catégorie ─────────────────
    'compliance_bs': {  # Compliance officer LBA = institutionnel
        'category': 'institutionnel',
    },
    'epo_director': {  # Directrice sécurité prison
        'category': 'admin',
    },
    'forensics_lead_zh': {  # Cheffe labo forensics
        'category': 'techie',
    },
    'fim_genealogist': {  # Cheffe d'unité forensique génétique
        'category': 'techie',
    },
    'vuilleumier': {  # Spécialiste cryptotraçage
        'category': 'techie',
    },
    'swissgrid_cirt': {  # CIRT
        'category': 'techie',
    },
    'mros_crypto_lead': {  # Cheffe crypto-tracing MROS
        'category': 'techie',
        'canton': 'CHF',
    },
    'govCERT_analyste': {
        'category': 'techie',
        'canton': 'CHF',
    },
    'play_ransom_analyst': {
        'category': 'techie',
    },
    'mobile_expert_lookout': {
        'category': 'techie',
    },
    'swisscom_dpo': {
        'category': 'institutionnel',
    },
    'enisa_nis2_lead': {
        'category': 'institutionnel',
        'canton': 'EU',
    },
    'src_attribution_apt': {
        'category': 'institutionnel',  # SRC = service de renseignement
        'canton': 'CHF',
    },
    'src_attribution_apt_2': {
        'category': 'institutionnel',
        'canton': 'CHF',
    },
    'ncsc_uk_lockbit_lead': {
        'category': 'police',  # NCA = police britannique
        'canton': 'INTL',
    },
    'bka_kidflix_lead': {
        'category': 'police',  # BKA = police criminelle allemande
        'canton': 'EU',
    },
    'ofcom_juriste_int': {
        'category': 'admin',
        'canton': 'CHF',
    },
    'rte_dso_cyber_lead': {
        'category': 'techie',
        'canton': 'EU',  # RTE = France
    },
    'swiss_navy_cyber_lead': {
        'category': 'institutionnel',
        'canton': 'CHF',
    },
    'vd_pme_ceo': {
        'category': 'institutionnel',
        'canton': 'VD',
    },

    # ── Mentor de l'arc easy : tmc_juge_ge ─────
    'tmc_juge_ge': {
        'category': 'justice',
        'canton': 'GE',
        'seniority': 'expert',
    },
    'mp_genevois_piquet': {
        'category': 'justice',
        'canton': 'GE',
        'seniority': 'senior',
    },
    'ne_prosecutor_cyber': {
        'category': 'justice',
        'canton': 'NE',
    },
    'fr_prosecutor_cyber': {
        'category': 'justice',
        'canton': 'FR',
    },
    'vs_prosecutor_cyber': {
        'category': 'justice',
        'canton': 'VS',
    },
    'unine_ciso': {
        'category': 'techie',
        'canton': 'NE',
    },
    'ge_avocat_frontaliers': {
        'category': 'justice',
        'canton': 'GE',
    },
    'ti_pol_chiasso': {
        'category': 'police',
        'canton': 'TI',
    },
}


# Patterns supplémentaires pour scan automatique des victimes manquées
VICTIM_KEYWORDS_STRONG = [
    'victime de pig butchering',
    'arnaqué',
    'arnaquée',
    'extorqué',
    'a perdu',
    "CHF perdus",
    'piégé par',
    'piégée par',
    'paniquée',
    'paniqué',
    "Mme Lambiel",  # nom typique victime des scènes
]

# Patterns adversaires manqués
ADVERSARY_KEYWORDS_STRONG = [
    'pig butchering',  # opérateur (mais aussi victime, donc context-dependent)
    'cybercriminel',
    'cellule criminelle',
    'gang',
    'membre actif d',
    "racket",
    "extorsion",
    "fraudeur",
    "blanchisseur d'argent",
    "opérateur d'un (réseau|service|botnet)",
]


def main():
    data = json.load(open('data/npcs.json'))
    npcs = data['npcs']

    # 1. Appliquer overrides explicites
    n_override = 0
    for nid, fields in OVERRIDES.items():
        if nid not in npcs:
            print(f"  ⚠ override pour PNJ inconnu : {nid}")
            continue
        npc = npcs[nid]
        for key, val in fields.items():
            if key == 'personality' and isinstance(val, dict):
                # Merge personality, ne pas écraser
                npc.setdefault('personality', {})
                npc['personality'].update(val)
            else:
                npc[key] = val
        n_override += 1
    print(f"✓ {n_override} overrides explicites appliqués")

    # 2. Scan auto pour victimes manquées (uniquement si déjà 'civil' et alignment != 'victim')
    n_victim_fix = 0
    for nid, npc in npcs.items():
        if npc.get('alignment') == 'victim':
            continue
        if nid in OVERRIDES:
            continue  # ne pas écraser
        text = (npc.get('shortBio', '') + ' ' + npc.get('context', '') + ' ' + npc.get('role', '')).lower()
        # Si rôle dit explicitement victime
        if 'victime' in npc.get('role', '').lower() or 'victime de' in text:
            npc['alignment'] = 'victim'
            npc['category'] = 'civil'
            n_victim_fix += 1
            print(f"  victime détectée : {nid} ({npc.get('role','')[:50]})")
    print(f"\n✓ {n_victim_fix} victimes additionnelles identifiées")

    # 3. Mode "police étrangère" : vraie police = catégorie police même hors CH
    for nid, npc in npcs.items():
        role = npc.get('role', '').lower()
        institution = npc.get('institution', '').lower()
        if any(w in role + ' ' + institution for w in ['nca ', 'national crime agency', 'fbi', 'bka', 'europol', 'gendarmerie', 'gendarme']):
            if npc.get('category') != 'police':
                npc['category'] = 'police'

    # Distributions finales
    from collections import Counter
    cantons = Counter(n['canton'] for n in npcs.values())
    cats = Counter(n['category'] for n in npcs.values())
    aligns = Counter(n['alignment'] for n in npcs.values())
    sens = Counter(n['seniority'] for n in npcs.values())

    print("\n=== APRÈS CORRECTIONS ===")
    print("\nCanton :")
    for c, n in cantons.most_common():
        print(f"  {c:6s} {n:3d}")
    print("\nCatégorie :")
    for c, n in cats.most_common():
        print(f"  {c:18s} {n:3d}")
    print("\nAlignment :")
    for c, n in aligns.most_common():
        print(f"  {c:12s} {n:3d}")
    print("\nSeniority :")
    for c, n in sens.most_common():
        print(f"  {c:12s} {n:3d}")

    # Sauvegarde
    json.dump(data, open('data/npcs.json', 'w'), ensure_ascii=False, indent=2)
    print(f"\n✓ data/npcs.json mis à jour avec corrections")


if __name__ == '__main__':
    main()
