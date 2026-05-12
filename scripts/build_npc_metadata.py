#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v2.71 — Phase 1 : auto-inférence des métadonnées des 98 PNJ.

Ajoute aux PNJ existants :
  - canton (str)        : VD/GE/ZH/.../CH/EU/INTL
  - category (str)      : police/justice/admin/techie/civil/criminel/institutionnel
  - alignment (str)     : ally/neutral/adversary/victim
  - seniority (str)     : junior/confirmé/senior/expert
  - personality (obj)   : communication/tech_level/stress_response/trust_initial
  - relations (list)    : [{ with, type, trust_init }]

Inférence à partir de :
  - role
  - institution
  - shortBio
  - context
  - co-occurrences dans les scènes (pour relations)
"""
import json
import re
from collections import Counter, defaultdict

# ════════════════════════════════════════════════════════════════
# Patterns d'inférence
# ════════════════════════════════════════════════════════════════

CANTON_PATTERNS = [
    # Cantons explicites par code ou nom complet
    (r'\b(?:VD|Vaud|Lausanne|Renens|Crissier|Vevey|Yverdon|Nyon|Morges)\b', 'VD'),
    (r'\b(?:GE|Genève|Geneva|Carouge|Meyrin|Vernier)\b', 'GE'),
    (r'\b(?:ZH|Zurich|Zürich|Winterthur|Uster|Manno)\b', 'ZH'),  # Manno = TI mais proche ZH
    (r'\b(?:VS|Valais|Sion|Martigny|Sierre|Brigue|Monthey)\b', 'VS'),
    (r'\b(?:NE|Neuchâtel|Neuchatel|Chaux-de-Fonds|Locle|Boudry)\b', 'NE'),
    (r'\b(?:JU|Jura|Delémont|Delemont|Porrentruy)\b', 'JU'),
    (r'\b(?:FR|Fribourg|Bulle|Romont|Estavayer|Gruyère|gruyère)\b', 'FR'),
    (r'\b(?:BE|Berne|Bienne|Thoune|Interlaken)\b', 'BE'),
    (r'\b(?:BS|Bâle-Ville|Bale|Basel|Bâle)\b', 'BS'),
    (r'\b(?:BL|Bâle-Campagne|Liestal)\b', 'BL'),
    (r'\b(?:SG|Saint-Gall|St-Gall|Saint Gall)\b', 'SG'),
    (r'\b(?:TI|Tessin|Lugano|Bellinzona|Locarno|Mendrisio|Chiasso|Manno)\b', 'TI'),
    (r'\b(?:SO|Soleure|Solothurn)\b', 'SO'),
    (r'\b(?:LU|Lucerne|Luzern)\b', 'LU'),
    (r'\b(?:ZG|Zoug|Zug)\b', 'ZG'),
    (r'\b(?:GR|Grisons|Coire|Davos|St-Moritz)\b', 'GR'),
    (r'\b(?:AG|Argovie|Aarau)\b', 'AG'),
    (r'\b(?:AR|Appenzell)\b', 'AR'),
    (r'\b(?:UR|Uri|Altdorf)\b', 'UR'),
    (r'\b(?:SZ|Schwyz)\b', 'SZ'),
    (r'\b(?:GL|Glaris|Glarus)\b', 'GL'),
    (r'\b(?:NW|Nidwald|Nidwalden)\b', 'NW'),
    (r'\b(?:OW|Obwald|Obwalden|Sarnen)\b', 'OW'),
    (r'\b(?:SH|Schaffhouse|Schaffhausen)\b', 'SH'),
    (r'\b(?:TG|Thurgovie|Frauenfeld)\b', 'TG'),
    # Confédération
    (r'\b(?:Confédération|MPC|fedpol|FedPol|OFCS|MROS|GovCERT|FINMA|Ministère public de la Confédération|fédéral|fédérale|Berne fédérale)\b', 'CHF'),
    # International
    (r'\b(?:Europol|Eurojust|UE|Bruxelles|Lyon|Paris|Frankfurt|Athènes|Helsinki|Berlin|Madrid|Rome)\b', 'EU'),
    (r'\b(?:USA|FBI|FinCEN|OFAC|Washington|États-Unis|américain|américaine)\b', 'INTL'),
    (r'\b(?:Russie|russe|Chine|chinois|Japon|Israël|Royaume-Uni|UK|Hong Kong)\b', 'INTL'),
]

CATEGORY_PATTERNS = [
    # Police (cantonale ou fédérale)
    (r'\b(?:[Pp]olicier|[Pp]olicière|[Ii]nspecteur|[Ii]nspectrice|[Cc]ommissaire|[Bb]rigade|[Pp]olCant|[Pp]olice cantonale|[Pp]olice fédérale|[Cc]heffe? de section|[Aa]gent de police|fedpol|FedPol|gendarme|IFC)', 'police'),
    # Justice
    (r'\b(?:[Pp]rocureur|[Pp]rocureure|[Mm]agistrat|[Jj]uge|[Tt]ribunal|TMC|MPC|MP cantonal|[Aa]vocat|[Aa]vocate|[Mm]inistère public)', 'justice'),
    # Administration
    (r'\b(?:[Ss]ecrétaire (général|communal)|[Cc]onseiller|[Cc]onseillère|[Ff]onctionnaire|[Cc]hancellerie|[Cc]onseil fédéral|[Pp]réfet|OFCS|PFPDT|[Dd]élégué)', 'admin'),
    # Tech / cyber experts
    (r'\b(?:CISO|RSSI|CIO|[Aa]nalyste|[Cc]onsultant cyber|[Ee]xpert forensique|[Aa]rchitecte|[Dd]éveloppeur|[Aa]dmin (système|réseau)|GovCERT|[Aa]uditeur cyber|[Pp]entester|[Cc]hercheur)', 'techie'),
    # Civils (témoins, victimes, citoyens, professionnels non-tech)
    (r'\b(?:[Cc]itoyen|[Aa]ffineur|[Mm]édecin|[Ee]nseignant|[Ee]ntrepreneur|[Aa]rtisan|[Rr]etraité|[Ss]tagiaire|[Éé]tudiant|[Pp]rofessionnel|[Tt]émoin|[Pp]articulier|[Pp]rofesseur)', 'civil'),
    # Criminels / adversaires
    (r'\b(?:[Cc]riminel|[Pp]irate|[Hh]acker (malveillant|black hat)|[Cc]ybercriminel|[Ee]scroc|[Ss]uspect|[Aa]ttaquant|[Bb]lanchisseur|[Aa]bus|[Aa]uteur d.un|[Mm]embre d.un (réseau|groupe))', 'criminel'),
    # Institutionnel (organismes spécialisés)
    (r'\b(?:[Dd]irection|[Cc]hef de service|[Dd]éléguée?|[Pp]résident|[Vv]ice-président|[Cc]EO|[Cc]onseil d.administration|FINMA)', 'institutionnel'),
]

# Patterns pour alignment
ADVERSARY_KEYWORDS = ['suspect', 'criminel', 'attaquant', 'pirate', 'escroc', 'criminelle',
                     'cybercriminel', 'auteur', 'membre actif', 'groupe', 'réseau de',
                     'fraude', 'blanchiment', 'malveillant', 'arrêté', 'inculpé']
VICTIM_KEYWORDS = ['victime', 'plainte', 'extorqué', 'piégée', 'piégé', 'arnaqué', 'arnaquée',
                   'volé', 'volée', 'attaqué (par)', 'subit', 'a perdu', 'a été contacté',
                   'reçoit un appel', 'paniquée', 'confiance abusée']
ALLY_KEYWORDS = ['mentor', 'collègue', 'expert', 'spécialiste', 'allié', 'soutien',
                 'aide', 'conseille', 'forme', 'accompagne']

# Seniority
SENIORITY_PATTERNS = [
    (r'\b(?:31 ans|30 ans|expert reconnu|chef|cheffe|chief|directeur|directrice|général|général|ans d\'expérience|sénior|expert)', 'expert'),
    (r'\b(?:senior|expérimenté|expérimentée|chef de section|cheffe de brigade|10 ans|15 ans|20 ans|titulaire)', 'senior'),
    (r'\b(?:confirmé|confirmée|3 ans|5 ans|7 ans|adjoint|adjointe)', 'confirmé'),
    (r'\b(?:junior|stagiaire|fraîchement nommé|nouvelle|nouveau|débutant|débutante|première année|premier|première)', 'junior'),
]

# Personality patterns (basés sur indices textuels)
PERSONALITY_DEFAULTS = {
    'communication': 'formel',
    'tech_level': 'intermédiaire',
    'stress_response': 'calme',
    'trust_initial': 'neutre',
}


def infer_canton(npc):
    """Inférer canton à partir des champs textuels."""
    text = ' '.join([
        npc.get('institution', ''),
        npc.get('shortBio', ''),
        npc.get('context', ''),
        npc.get('role', ''),
    ])
    # Compter les matches : un canton mentionné plusieurs fois gagne
    counts = Counter()
    for pattern, canton in CANTON_PATTERNS:
        n = len(re.findall(pattern, text))
        if n > 0:
            counts[canton] += n
    if not counts:
        return 'CH'  # défaut : Suisse non-spécifié
    # Top match
    return counts.most_common(1)[0][0]


def infer_category(npc):
    """Inférer catégorie à partir du role principalement."""
    text = ' '.join([
        npc.get('role', ''),
        npc.get('institution', ''),
        npc.get('shortBio', '')[:200],  # premiers chars de la bio
    ])
    for pattern, cat in CATEGORY_PATTERNS:
        if re.search(pattern, text):
            return cat
    return 'civil'  # défaut


def infer_alignment(npc):
    """Ally / neutral / adversary / victim selon contexte."""
    text = (npc.get('shortBio', '') + ' ' + npc.get('context', '') + ' ' + npc.get('role', '')).lower()

    adv_score = sum(1 for kw in ADVERSARY_KEYWORDS if kw in text)
    vic_score = sum(1 for kw in VICTIM_KEYWORDS if kw in text)
    ally_score = sum(1 for kw in ALLY_KEYWORDS if kw in text)

    # Décision
    if adv_score >= 2 or (adv_score >= 1 and 'criminel' in text):
        return 'adversary'
    if vic_score >= 2:
        return 'victim'
    if ally_score >= 2:
        return 'ally'

    # Heuristique catégorie
    cat = infer_category(npc)
    if cat == 'criminel':
        return 'adversary'
    if cat in ('police', 'justice', 'admin', 'institutionnel'):
        return 'ally'  # par défaut côté loi = allié
    if cat == 'techie':
        return 'ally'
    return 'neutral'


def infer_seniority(npc):
    """Junior à expert."""
    text = ' '.join([npc.get('role', ''), npc.get('shortBio', ''), npc.get('context', '')])
    for pattern, sen in SENIORITY_PATTERNS:
        if re.search(pattern, text):
            return sen
    return 'confirmé'  # défaut neutre


def infer_personality(npc):
    """Profil psychologique simple (Niveau 3)."""
    text = (npc.get('shortBio', '') + ' ' + npc.get('context', '') + ' ' + npc.get('role', '')).lower()

    # Communication
    if any(w in text for w in ['direct', 'sans détour', 'franc', 'cash', 'rude']):
        comm = 'direct'
    elif any(w in text for w in ['émotif', 'paniqué', 'pleure', 'panique', 'stressé', 'inquiet']):
        comm = 'émotif'
    elif any(w in text for w in ['évasif', 'discret', 'secret', 'taciturne', 'méfiant']):
        comm = 'évasif'
    else:
        comm = 'formel'

    # Tech level
    cat = infer_category(npc)
    if cat == 'techie' or any(w in text for w in ['expert', 'ingénieur', 'spécialiste', 'CISO', 'forensique']):
        tech = 'expert'
    elif cat in ('police', 'justice'):
        tech = 'avancé'
    elif cat == 'admin' or any(w in text for w in ['novice', 'utilisateur lambda', 'pas spécialiste', 'non technique']):
        tech = 'novice'
    else:
        tech = 'intermédiaire'

    # Stress response
    if any(w in text for w in ['paniqué', 'panique', 'pleure', 'larmes', 'effondré']):
        stress = 'paralysé'
    elif any(w in text for w in ['anxieux', 'anxieuse', 'inquiet', 'inquiète', 'nerveux', 'nerveuse']):
        stress = 'anxieux'
    elif any(w in text for w in ['colère', 'agressif', 'agressive', 'énervé', 'énervée', 'tendu']):
        stress = 'colère'
    else:
        stress = 'calme'

    # Trust initial
    align = infer_alignment(npc)
    if align == 'adversary':
        trust = 'hostile'
    elif align == 'victim':
        trust = 'méfiant' if 'arnaq' in text or 'piégé' in text else 'ouvert'
    elif align == 'ally':
        trust = 'ouvert'
    else:
        trust = 'neutre'

    return {
        'communication': comm,
        'tech_level': tech,
        'stress_response': stress,
        'trust_initial': trust,
    }


def build_relations(scenes_dir='scenes'):
    """Niveau 2 — réseau de relations basé sur co-occurrences scènes."""
    import os
    cooc = defaultdict(int)
    npc_scenes = defaultdict(set)

    for f in os.listdir(scenes_dir):
        if not f.endswith('.json') or f == 'index.json':
            continue
        s = json.load(open(f'{scenes_dir}/{f}'))
        npcs_in_scene = []
        for n in s.get('npcs', []):
            nid = n if isinstance(n, str) else n.get('id')
            if nid:
                npcs_in_scene.append(nid)
                npc_scenes[nid].add(s['id'])
        # Toutes les paires
        for i, a in enumerate(npcs_in_scene):
            for b in npcs_in_scene[i+1:]:
                key = tuple(sorted([a, b]))
                cooc[key] += 1

    return cooc, npc_scenes


def determine_relation_type(npc_a, npc_b, n_cooccurrences, npcs):
    """Déterminer type de relation entre 2 PNJ."""
    cat_a = npcs[npc_a].get('category', 'civil')
    cat_b = npcs[npc_b].get('category', 'civil')
    align_a = npcs[npc_a].get('alignment', 'neutral')
    align_b = npcs[npc_b].get('alignment', 'neutral')

    # Adversaires
    if align_a == 'adversary' and align_b == 'ally':
        return ('adversaire', 'low')
    if align_b == 'adversary' and align_a == 'ally':
        return ('adversaire', 'low')

    # Victime / défenseur
    if align_a == 'victim' and align_b == 'ally':
        return ('protégé', 'medium')
    if align_b == 'victim' and align_a == 'ally':
        return ('protégé', 'medium')

    # Mentor / mentoré (seniority)
    sen_a = npcs[npc_a].get('seniority', 'confirmé')
    sen_b = npcs[npc_b].get('seniority', 'confirmé')
    if cat_a == cat_b and align_a == align_b == 'ally':
        if sen_a == 'expert' and sen_b in ('junior', 'confirmé'):
            return ('mentor', 'high')
        if sen_b == 'expert' and sen_a in ('junior', 'confirmé'):
            return ('mentoré', 'high')

    # Collègues (même catégorie, même alignement)
    if cat_a == cat_b and align_a == align_b:
        return ('collègue', 'medium')

    # Réseau (criminels entre eux)
    if align_a == align_b == 'adversary':
        return ('complice', 'medium')

    # Par défaut : connaissance
    return ('connaissance', 'low')


# ════════════════════════════════════════════════════════════════
# Main
# ════════════════════════════════════════════════════════════════

def main():
    data = json.load(open('data/npcs.json'))
    npcs = data['npcs']

    print(f"=== Auto-inférence sur {len(npcs)} PNJ ===\n")

    # Phase 1.1 — Métadonnées
    cantons_count = Counter()
    cats_count = Counter()
    aligns_count = Counter()
    sens_count = Counter()

    for nid, npc in npcs.items():
        npc['canton'] = infer_canton(npc)
        npc['category'] = infer_category(npc)
        npc['alignment'] = infer_alignment(npc)
        npc['seniority'] = infer_seniority(npc)
        npc['personality'] = infer_personality(npc)

        cantons_count[npc['canton']] += 1
        cats_count[npc['category']] += 1
        aligns_count[npc['alignment']] += 1
        sens_count[npc['seniority']] += 1

    print("Distribution canton :")
    for c, n in cantons_count.most_common():
        print(f"  {c:6s} {n:3d}")

    print("\nDistribution catégorie :")
    for c, n in cats_count.most_common():
        print(f"  {c:18s} {n:3d}")

    print("\nDistribution alignment :")
    for c, n in aligns_count.most_common():
        print(f"  {c:12s} {n:3d}")

    print("\nDistribution seniority :")
    for c, n in sens_count.most_common():
        print(f"  {c:12s} {n:3d}")

    # Phase 1.3 — Relations
    print("\n=== Construction du graphe de relations ===")
    cooc, npc_scenes = build_relations('scenes')
    print(f"Paires PNJ co-occurrentes : {len(cooc)}")

    relations_built = 0
    for nid, npc in npcs.items():
        npc['relations'] = []
        for (a, b), n in cooc.items():
            if a == nid:
                rtype, trust = determine_relation_type(a, b, n, npcs)
                npc['relations'].append({
                    'with': b,
                    'type': rtype,
                    'cooccurrences': n,
                    'trust_init': trust,
                })
                relations_built += 1
            elif b == nid:
                rtype, trust = determine_relation_type(b, a, n, npcs)
                npc['relations'].append({
                    'with': a,
                    'type': rtype,
                    'cooccurrences': n,
                    'trust_init': trust,
                })
                relations_built += 1

    print(f"Relations construites (total) : {relations_built}")

    # Distribution des types de relation
    rel_types = Counter()
    for npc in npcs.values():
        for r in npc.get('relations', []):
            rel_types[r['type']] += 1
    print("\nDistribution types de relations :")
    for t, n in rel_types.most_common():
        print(f"  {t:14s} {n:4d}")

    # Stats co-occurrence
    cooc_per_npc = [(nid, len(npc.get('relations', []))) for nid, npc in npcs.items()]
    cooc_per_npc.sort(key=lambda x: -x[1])
    print("\nTop 5 PNJ les + connectés :")
    for nid, n in cooc_per_npc[:5]:
        print(f"  {nid:35s} {n} relations")

    # Sauvegarde
    json.dump(data, open('data/npcs.json', 'w'), ensure_ascii=False, indent=2)
    print(f"\n✓ data/npcs.json mis à jour")


if __name__ == '__main__':
    main()
