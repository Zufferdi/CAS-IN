#!/usr/bin/env python3
"""
add_missing_npcs.py — CAS-IN

Ajoute les 6 NPCs référencés par scenes/72969-infractions-vaud.json mais
absents de data/npcs.json. Tous fictifs (transposables) — postes officiels
existants en VD mais titulaires non identifiés ici.

Usage : python3 scripts/add_missing_npcs.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NPCS_PATH = ROOT / "data" / "npcs.json"

NEW_NPCS = {
    "conseil_etat_vd_conseillere": {
        "id": "conseil_etat_vd_conseillere",
        "name": "Conseillère d'État VD (DSE)",
        "fictional": True,
        "icon": "🏛️",
        "role": "Cheffe du Département de la sécurité et de l'environnement",
        "institution": "Conseil d'État vaudois",
        "shortBio": "Membre du Conseil d'État vaudois en charge de la police, de l'asile et de la protection de la population. Responsabilité politique du dispositif sécuritaire cantonal.",
        "expertise": ["politique sécuritaire", "allocation budgétaire", "gouvernance"],
        "publicProfile": "Personnage transposable — rôle officiel ; identité de la titulaire dépend de la législature simulée.",
        "context": "Apparaît quand une scène implique un arbitrage stratégique au niveau cantonal (priorisation des moyens, communication politique, justification budgétaire devant le Grand Conseil).",
        "canton": "VD",
        "category": "policy",
        "alignment": "neutral",
        "seniority": "expert",
        "personality": {
            "communication": "formel",
            "tech_level": "généraliste",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [],
        "appearances": ["72969-infractions-vaud"],
        "tech_skills": [],
        "quote": "On ne distribue pas les ressources policières en fonction de la une du 19h30."
    },
    "commandant_police_cantonale_vd": {
        "id": "commandant_police_cantonale_vd",
        "name": "Commandant·e de la Police cantonale VD",
        "fictional": True,
        "icon": "🎖️",
        "role": "Commandant·e de la Police cantonale vaudoise",
        "institution": "Police cantonale vaudoise (PolCant VD)",
        "shortBio": "Direction opérationnelle de la PolCant VD — env. 1 100 collaborateurs·trices, gendarmerie, police judiciaire, Centre d'instruction.",
        "expertise": ["commandement", "doctrine policière", "police judiciaire"],
        "publicProfile": "Personnage transposable — rôle officiel.",
        "context": "Apparaît dans les scènes d'arbitrage opérationnel à l'échelle du canton VD : allocation des effectifs entre PJ cyber, gendarmerie, brigade des stupéfiants, etc.",
        "canton": "VD",
        "category": "police",
        "alignment": "ally",
        "seniority": "expert",
        "personality": {
            "communication": "direct",
            "tech_level": "généraliste",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [
            {"with": "conseil_etat_vd_conseillere", "type": "collègue", "cooccurrences": 1, "trust_init": "medium"}
        ],
        "appearances": ["72969-infractions-vaud"],
        "tech_skills": [],
        "quote": "Trois mille plaintes en plus l'an dernier. Les effectifs, eux, n'ont pas suivi."
    },
    "ccpcs_delegue": {
        "id": "ccpcs_delegue",
        "name": "Délégué·e CCPCS",
        "fictional": True,
        "icon": "🤝",
        "role": "Délégué·e à la Conférence des commandants des polices cantonales suisses",
        "institution": "CCPCS (Conférence des commandants des polices cantonales suisses)",
        "shortBio": "Représente la coordination intercantonale des forces de police cantonales — alignement doctrinal, mutualisation, partage de bonnes pratiques.",
        "expertise": ["coordination intercantonale", "harmonisation doctrinale"],
        "publicProfile": "Personnage transposable — la CCPCS existe ; ses délégués ne sont pas en règle générale identifiés publiquement par nom dans les scènes.",
        "context": "Apparaît quand une décision cantonale a des implications transversales (autres cantons, fedpol, modèle reproductible).",
        "canton": "CHF",
        "category": "police",
        "alignment": "neutral",
        "seniority": "senior",
        "personality": {
            "communication": "formel",
            "tech_level": "généraliste",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [
            {"with": "commandant_police_cantonale_vd", "type": "collègue", "cooccurrences": 1, "trust_init": "medium"}
        ],
        "appearances": ["72969-infractions-vaud"],
        "tech_skills": [],
        "quote": "Une bonne pratique vaudoise n'est utile que si elle peut être adoptée à Lugano et à St-Gall."
    },
    "directeur_fedpol_liaison": {
        "id": "directeur_fedpol_liaison",
        "name": "Directeur·trice de liaison fedpol",
        "fictional": True,
        "icon": "🛡️",
        "role": "Directeur·trice de la division de liaison cantonale (fedpol)",
        "institution": "Office fédéral de la police (fedpol)",
        "shortBio": "Interface entre fedpol et les polices cantonales — coordination des dossiers à dimension fédérale (terrorisme, criminalité organisée, cybercriminalité grave, MROS).",
        "expertise": ["coordination Confédération-cantons", "criminalité fédérale", "fedpol"],
        "publicProfile": "Personnage transposable — la fonction existe à fedpol.",
        "context": "Apparaît dans les scènes où une affaire cantonale appelle un soutien fédéral ou une coordination supra-cantonale.",
        "canton": "CHF",
        "category": "police",
        "alignment": "ally",
        "seniority": "expert",
        "personality": {
            "communication": "formel",
            "tech_level": "avancé",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [
            {"with": "commandant_police_cantonale_vd", "type": "collègue", "cooccurrences": 1, "trust_init": "medium"},
            {"with": "ccpcs_delegue", "type": "connaissance", "cooccurrences": 1, "trust_init": "medium"}
        ],
        "appearances": ["72969-infractions-vaud"],
        "tech_skills": ["coordination opérationnelle"],
        "quote": "Si vous pensez que c'est ransomware-as-a-service, on a déjà sept dossiers similaires ailleurs."
    },
    "prefpose_protection_donnees_vd": {
        "id": "prefpose_protection_donnees_vd",
        "name": "Préposé·e cantonal·e à la protection des données VD",
        "fictional": True,
        "icon": "🔒",
        "role": "Préposé·e à la protection des données et à l'information (PPDI) du canton de Vaud",
        "institution": "Préposé·e PPDI Vaud",
        "shortBio": "Autorité indépendante de surveillance pour la protection des données dans les organismes publics vaudois.",
        "expertise": ["LPrD VD", "protection des données", "transparence administrative", "droit cantonal"],
        "publicProfile": "Personnage transposable — fonction officielle existante (Loi vaudoise sur la protection des données personnelles, LPrD).",
        "context": "Apparaît quand une scène implique un traitement de données personnelles par l'administration vaudoise (police, services sociaux, statistiques policières).",
        "canton": "VD",
        "category": "regulator",
        "alignment": "neutral",
        "seniority": "expert",
        "personality": {
            "communication": "formel",
            "tech_level": "avancé",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [],
        "appearances": ["72969-infractions-vaud"],
        "tech_skills": ["analyse d'impact LPD", "audit de conformité"],
        "quote": "Avant de croiser les fichiers de la police avec ceux des services sociaux, il faut une base légale formelle, pas juste un projet."
    },
    "chef_service_affaires_sociales": {
        "id": "chef_service_affaires_sociales",
        "name": "Chef·fe du service des affaires sociales VD",
        "fictional": True,
        "icon": "🤲",
        "role": "Direction du service vaudois en charge de l'aide sociale",
        "institution": "Direction de la cohésion sociale (DGCS) — État de Vaud",
        "shortBio": "Pilote l'action sociale cantonale — RI, prestations complémentaires familles, accompagnement des publics vulnérables.",
        "expertise": ["politique sociale cantonale", "violence conjugale", "RI", "asile"],
        "publicProfile": "Personnage transposable — fonction officielle existante (Direction générale de la cohésion sociale, DGCS).",
        "context": "Apparaît dans les scènes où la criminalité a une dimension sociale (violences domestiques, mineurs étrangers, précarité), pour défendre l'angle prévention/accompagnement face à l'angle répressif.",
        "canton": "VD",
        "category": "policy",
        "alignment": "neutral",
        "seniority": "expert",
        "personality": {
            "communication": "formel",
            "tech_level": "généraliste",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [
            {"with": "conseil_etat_vd_conseillere", "type": "collègue", "cooccurrences": 1, "trust_init": "medium"}
        ],
        "appearances": ["72969-infractions-vaud"],
        "tech_skills": [],
        "quote": "Une plainte pour violence conjugale, ce n'est pas une statistique cyber qu'on peut déléguer à un chatbot."
    },
}


def main():
    raw = json.loads(NPCS_PATH.read_text(encoding="utf-8"))
    npcs = raw.get("npcs", {})
    added = 0
    for npc_id, defn in NEW_NPCS.items():
        if npc_id in npcs:
            print(f"  ⏭  {npc_id} : déjà présent, skip")
            continue
        npcs[npc_id] = defn
        added += 1
        print(f"  ✓ {npc_id} ajouté")
    raw["npcs"] = npcs
    NPCS_PATH.write_text(
        json.dumps(raw, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"\nTerminé. {added} NPC(s) ajouté(s). Total: {len(npcs)}.")


if __name__ == "__main__":
    main()
