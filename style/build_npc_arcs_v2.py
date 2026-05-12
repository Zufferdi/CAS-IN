#!/usr/bin/env python3
"""
build_npc_arcs_v2.py — v2.94 (Arcs PNJ auto-générés)
─────────────────────────────────────────────────────
Étend data/npc-arcs.json en générant un arc automatique pour
chaque PNJ apparaissant dans ≥ 5 scènes et sans arc manuel
existant.

Les arcs existants (manuels, narrativement riches) sont préservés
intacts. Les nouveaux sont taggés `source: "auto"` pour permettre
à l'UI de les distinguer si elle le souhaite.

Sortie additionnelle :
  - patch_achievements_snippet.txt : code à coller dans
    cas-in-achievements.js (catégorie 'Scènes · Arcs PNJ')
  - patch_arc_to_achievement.txt : entrées à ajouter à
    ARC_TO_ACHIEVEMENT dans cas-in-arcs.js

Idempotent : ne réécrit pas les arcs manuels.
Usage : python3 scripts/build_npc_arcs_v2.py
"""
import json, os, re, sys, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NPCS_PATH = ROOT / 'data' / 'npcs.json'
ARCS_PATH = ROOT / 'data' / 'npc-arcs.json'
INDEX_PATH = ROOT / 'scenes' / 'index.json'
CHRONO_PATH = ROOT / 'data' / 'scenes-chronology.json'

# Seuil de candidature à un arc auto
MIN_APPEARANCES = 5
MAX_STAGES = 8   # limite par arc pour rester digérable

# ── Titres curated pour le top du peloton ──────────────────────────────
# Pour les autres, on tombe sur un titre auto-généré "Le/La X de Y"
CURATED_TITLES = {
    'forensics_lead_zh':            ('🔬', "L'Étalon du Laboratoire",
                                     "M. Bachmann — chef du forensique cyber ZH, expert·e récurrent·e des dossiers techniques."),
    'ofcs_coordinator':             ('🛡', "La Coordinatrice OFCS",
                                     "Mme Tschanz — chef d'orchestre fédéral en cybersécurité, pivot national 24/7."),
    'fbi_legat_bern':               ('🇺🇸', "Le Légat Américain",
                                     "Special Agent Donovan — légat FBI à Berne, le canal officiel US sur tout dossier MLAT."),
    'ge_prosecutor_cyber':          ('⚖️', "La Procureure Genevoise",
                                     "Mme Cottier — procureure cyber GE, cheffe d'instruction pour la place financière."),
    'ciso_logitech':                ('🛡', "Le CISO de Logitech",
                                     "M. Aellig — RSSI multi-sites, baromètre privé des incidents IT."),
    'compliance_bs':                ('🏦', "Le Compliance Bâlois",
                                     "Marco Bernasconi — réflexe MROS / LBA, témoin privilégié de la finance tessinoise."),
    'fr_prosecutor_cyber':          ('⚖️', "La Procureure Fribourgeoise",
                                     "Mme Genoud — procureure cyber FR, cheffe d'instruction de l'Affaire Sarine."),
    'sg_polcyber_chief':            ('👮', "La Cyber Saint-Galloise",
                                     "Mme Brägger — cheffe IFC à PolSG, partenaire pour les dossiers SG/AR/AI."),
    'vs_prosecutor_cyber':          ('⚖️', "Le Procureur Valaisan",
                                     "M. Crittin — procureur cyber VS, pilote de l'Affaire de la Viège."),
    'fedpol_crd_cyber':             ('🏛', "L'Officière fedpol Cyber",
                                     "Mme Egger — fedpol C3, l'interlocutrice fédérale pour la cybercriminalité grave."),
    'cicr_dpo':                     ('🕊', "La Sentinelle Humanitaire",
                                     "Mme Tedeschi — DPO du CICR, gardienne des standards de protection des données."),
    'ddps_general_counsel':         ('🪖', "La Juriste de la Défense",
                                     "Mme Aebischer — conseillère juridique en chef du DDPS, frontière État/secret défense."),
    'interpol_europol_liaison':     ('🌐', "L'Officier de Liaison Européen",
                                     "Nicolas Reichenbach — fedpol Interpol/Europol, le facilitateur d'entraide opérationnelle."),
    'mpc_procureur_federal':        ('⚖️', "Le Procureur Cyber MPC",
                                     "Me Stähli — division cybercriminalité MPC, doctrine MPC en construction permanente."),
    'ofs_rssi_fedch':               ('📊', "Le RSSI Confédéral",
                                     "M. Schaller — RSSI OFS, modèle transposable à tous les offices fédéraux."),
    'pjf_undercover_lead':          ('🕵', "La Cheffe Infiltration",
                                     "Mme Roesti — Police judiciaire fédérale, infiltrations darknet et identités fictives."),
    'vd_prosecutor_cyber':          ('⚖️', "La Procureure Vaudoise",
                                     "Mme Brun — MP-VD criminalité économique & cyber, ancre des dossiers lausannois."),
    'vs_polcant_cyber':             ('👮', "L'Inspecteur Valaisan",
                                     "Insp. Salamin — Polcant VS cyber, profil terrain de la Viège et au-delà."),
    'compass_security_lead_forensic':('🔬', "L'Expert Privé Compass",
                                     "Dr Sutter — expert forensique externe Compass Security, témoin technique récurrent."),
    'ofj_eimp_bilateral_de':        ('🇩🇪', "La Cheffe Entraide DE",
                                     "Mme Aebersold — OFJ direction entraide pénale internationale, fil rouge des EIMP germanophones."),
    'pfpdt_lobsiger_office':        ('🛡', "Le Préposé à la Protection des Données",
                                     "M. Métraux — PFPDT, contrepoids systématique sur les enjeux LPD/RGPD."),
    'src_director':                 ('🕴', "La Cheffe Anti-Terrorisme",
                                     "Mme Müller — SRC anti-terrorisme, frontière renseignement-police judiciaire."),
    'expert_kudelski_security':     ('🔐', "Le Cryptographe Kudelski",
                                     "Dr Kudelka — Kudelski Security, expert hardware / crypto / supply chain."),
    'fr_polcant_cyber':             ('👮', "Le Capitaine Fribourgeois",
                                     "Cap. Schmid — Polcant FR cyber, joueur·euse de référence dans l'Affaire Sarine."),
    'ncsc_govcert_lead':            ('🚨', "Le Chef GovCERT",
                                     "Dr Fankhauser — GovCERT, première sonnette d'alarme pour les incidents fédéraux."),
}

# ── Mots-clés pour générer un role_state propre depuis l'institution ──
INSTITUTION_TO_ROLE_HINT = [
    (r'\bfedpol\b',              'fedpol'),
    (r'\bMPC\b|Ministère public de la Confédération', 'MPC'),
    (r'Ministère public.*Vaud',  'MP-VD'),
    (r'Ministère public.*Genève|République et canton de Genève', 'MP-GE'),
    (r'Ministère public.*Fribourg', 'MP-FR'),
    (r'Ministère public.*Valais', 'MP-VS'),
    (r'Ministère public.*Berne', 'MP-BE'),
    (r'\bOFCS\b|Office fédéral de la cybersécurité', 'OFCS'),
    (r'GovCERT', 'GovCERT'),
    (r'\bOFJ\b|Office fédéral de la justice', 'OFJ'),
    (r'\bOFS\b|Office fédéral de la statistique', 'OFS'),
    (r'\bPFPDT\b|protection des données', 'PFPDT'),
    (r'\bCICR\b|Croix-Rouge', 'CICR'),
    (r'\bSRC\b|Service de renseignement', 'SRC'),
    (r'Police cantonale.*Zürich|Kantonspolizei Zürich', 'KAPO ZH'),
    (r'Police cantonale.*Vaud',  'Polcant VD'),
    (r'Police cantonale.*Genève','Polcant GE'),
    (r'Police cantonale.*Fribourg','Polcant FR'),
    (r'Police cantonale.*Valais','Polcant VS'),
    (r'Police cantonale.*Saint-Gall|PolSG', 'PolSG'),
    (r'Police cantonale.*Berne|Polcant BE','Polcant BE'),
    (r'Police judiciaire fédérale|\bPJF\b', 'PJF'),
    (r'\bFBI\b', 'FBI'),
    (r'Interpol|Europol', 'Interpol/Europol'),
    (r'\bDDPS\b', 'DDPS'),
    (r'Logitech', 'Logitech'),
    (r'BancaStato',              'BancaStato'),
    (r'Compass Security',         'Compass Security'),
    (r'Kudelski',                 'Kudelski'),
]


def short_institution(inst):
    if not inst: return '—'
    for pattern, label in INSTITUTION_TO_ROLE_HINT:
        if re.search(pattern, inst, re.IGNORECASE):
            return label
    # Fallback : prendre les 2 premiers mots
    return ' '.join(inst.split()[:3]).rstrip(',')


def get_scene_year(scene_id, chrono_index):
    entry = chrono_index.get(scene_id)
    if not entry: return None
    return entry.get('year')


def get_scene_event(scene_id, chrono_index):
    entry = chrono_index.get(scene_id)
    if not entry: return None
    return entry.get('event')


def get_scene_title(scene_id, idx_by_id):
    entry = idx_by_id.get(scene_id)
    if not entry: return scene_id
    return entry.get('title', scene_id)


def get_scene_tags(scene_id, idx_by_id):
    entry = idx_by_id.get(scene_id)
    if not entry: return []
    return entry.get('tags', [])


def generate_arc(npc_id, npc, idx_by_id, chrono_index):
    """Génère une entrée d'arc pour un PNJ donné."""
    appearances = npc.get('appearances', [])
    name = npc.get('name', npc_id)
    role = npc.get('role', '')
    inst = npc.get('institution', '')

    # ─ Titre + icône + description ─
    if npc_id in CURATED_TITLES:
        icon, title, description_seed = CURATED_TITLES[npc_id]
    else:
        icon = '👤'
        short_inst = short_institution(inst)
        # Heuristique de genre pour le déterminant : si "Mme" dans le nom → La, sinon Le
        det = 'La' if re.search(r'\bMme\b|Mlle|Mme\.', name) else 'Le'
        # Heuristique de spécialité depuis le rôle
        spec = (role.split('—')[0].split(',')[0]).strip()
        if not spec or len(spec) > 60:
            spec = short_inst
        title = f"{det} pivot {short_inst}".strip()
        description_seed = f"{name} — {role[:200]}"

    # ─ Stages : appearances triées par année (chronology) puis alpha ─
    enriched = []
    for sid in appearances:
        if sid not in idx_by_id:
            continue  # scene référencée n'existe plus
        year = get_scene_year(sid, chrono_index)
        event = get_scene_event(sid, chrono_index)
        title_s = get_scene_title(sid, idx_by_id)
        tags = get_scene_tags(sid, idx_by_id)
        enriched.append({
            'scene_id': sid,
            'year': year,
            'event': event,
            'title': title_s,
            'tags': tags,
        })

    # Tri : year asc (None → fin), puis alpha
    enriched.sort(key=lambda x: (
        x['year'] if x['year'] is not None else 9999,
        x['title']
    ))

    # Limite à MAX_STAGES : on garde les premières (les plus précoces)
    truncated = len(enriched) > MAX_STAGES
    enriched = enriched[:MAX_STAGES]

    # ─ Construction des stages ─
    short_inst = short_institution(inst)
    stages = []
    for i, e in enumerate(enriched, 1):
        # role_state : sortir un label court de l'institution + acte
        role_state = f"{short_inst}"
        # narrative_key : utiliser l'event si dispo, sinon le titre
        narrative_key = e['event'] if e['event'] else (e['title'][:80])
        # skills_demonstrated : top 3 tags du sceanrio
        skills = [t for t in (e['tags'] or [])[:3] if t]
        stages.append({
            'stage': i,
            'scene_id': e['scene_id'],
            'year': e['year'],
            'role_state': role_state,
            'narrative_key': narrative_key,
            'skills_demonstrated': skills,
        })

    # ─ Description finale ─
    n_total = len(appearances)
    n_shown = len(stages)
    if truncated:
        description = (
            f"{description_seed} Apparaît dans {n_total} scènes au total ; "
            f"voici les {n_shown} premières par ordre chronologique. "
            f"Complète-les pour valider l'arc."
        )
    else:
        description = (
            f"{description_seed} Le candidat le/la croise dans {n_shown} dossiers — "
            f"un arc à valider pour décrocher la confiance complète."
        )

    # ─ Subtitle ─
    subtitle = f"{name} — récurrent·e dans {n_total} scènes ({short_inst})"

    # ─ ID de badge : `arc_<court>` où <court> = institution + suffixe stable ─
    badge_id = build_badge_id(npc_id)

    return {
        'npc_id': npc_id,
        'title': title,
        'subtitle': subtitle,
        'icon': icon,
        'description': description,
        'source': 'auto',  # tag pour distinguer dans l'UI plus tard
        'stages': stages,
        'completion_badge': f"{icon} Arc {name.split('M')[0].strip() or name} complété — '{title}'",
        'completion_text': (
            f"Vous avez suivi {name} sur {n_shown} dossiers. "
            f"L'arc « {title} » est désormais bouclé."
        ),
        'meta': {
            'total_appearances': n_total,
            'stages_shown': n_shown,
            'truncated': truncated,
        },
    }


def build_badge_id(npc_id):
    """Génère un id de badge stable et court depuis npc_id."""
    # Conserve underscores/lettres, remplace tirets
    s = re.sub(r'[^a-z0-9_]', '_', npc_id.lower())
    s = re.sub(r'_+', '_', s).strip('_')
    return f'arc_{s}'


def main():
    with open(NPCS_PATH, 'r', encoding='utf-8') as f:
        npcs_data = json.load(f)
    with open(ARCS_PATH, 'r', encoding='utf-8') as f:
        arcs_data = json.load(f)
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        index = json.load(f)

    npcs = npcs_data['npcs']
    arcs = arcs_data['arcs']
    idx_by_id = {s['id']: s for s in index}

    # Charge la chronologie pour les années
    chrono_index = {}
    if CHRONO_PATH.exists():
        with open(CHRONO_PATH, 'r', encoding='utf-8') as f:
            chrono = json.load(f)
        chrono_index = {s['id']: s for s in chrono.get('scenes', [])}

    # ⚠ Important : un arc manuel peut avoir une clé != npc_id (cas
    # `premiers_reflexes_cyber` qui pointe sur `sg_polcyber_chief`).
    # On constitue donc l'ensemble des npc_id DÉJÀ couverts par un arc
    # manuel, en croisant le champ `npc_id` ET la clé du dictionnaire.
    existing_arc_ids = set(arcs.keys())
    for aid, arc in arcs.items():
        nid = arc.get('npc_id')
        if nid:
            existing_arc_ids.add(nid)
    # Tagge les arcs manuels existants (sans toucher leurs autres champs)
    manual_count = 0
    for aid, arc in arcs.items():
        if 'source' not in arc:
            arc['source'] = 'manual'
            manual_count += 1

    # Sélectionne les candidats auto
    candidates = []
    for nid, npc in npcs.items():
        n = len(npc.get('appearances', []))
        if n >= MIN_APPEARANCES and nid not in existing_arc_ids:
            candidates.append((nid, npc))
    candidates.sort(key=lambda x: -len(x[1].get('appearances', [])))

    print(f'[npc-arcs-v2] arcs manuels: {len(existing_arc_ids)} (taggés source=manual: {manual_count})')
    print(f'[npc-arcs-v2] candidats auto (≥{MIN_APPEARANCES} apparences, hors manuels): {len(candidates)}')

    # Génère
    new_arcs = {}
    new_badge_entries = []
    new_mapping_entries = []
    for nid, npc in candidates:
        arc = generate_arc(nid, npc, idx_by_id, chrono_index)
        if not arc['stages']:
            print(f'  ⚠ {nid}: aucun stage valide — skip')
            continue
        new_arcs[nid] = arc
        badge_id = build_badge_id(nid)
        new_mapping_entries.append((nid, badge_id))
        # Entrée pour cas-in-achievements.js
        name = npc.get('name', nid)
        emoji = arc['icon']
        # Liste courte des scènes pour la description du badge
        first_titles = [s['narrative_key'] for s in arc['stages'][:3]]
        desc_short = f"Arc {name} : {' → '.join(first_titles)}"
        if len(desc_short) > 110:
            desc_short = desc_short[:107] + '…'
        new_badge_entries.append({
            'id': badge_id,
            'emoji': emoji,
            'name': arc['title'],
            'desc': desc_short,
            'category': 'Scènes · Arcs PNJ (auto)',
        })
        print(f'  ✓ {nid:35s} → arc "{arc["title"]}" ({len(arc["stages"])} stages, badge {badge_id})')

    # Merge et sauvegarde
    merged = dict(arcs)
    merged.update(new_arcs)
    arcs_data['arcs'] = merged
    arcs_data['$generated_at'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    arcs_data['$version'] = 'v2.94-auto-arcs'
    if '$description' not in arcs_data:
        arcs_data['$description'] = ''
    arcs_data['$description'] = (
        arcs_data['$description'].split(' — ')[0]
        + f' — v2.94 : {len(arcs)} arcs manuels + {len(new_arcs)} arcs auto-générés (PNJ récurrents)'
    )

    with open(ARCS_PATH, 'w', encoding='utf-8') as f:
        json.dump(arcs_data, f, indent=2, ensure_ascii=False)
    print(f'\n[npc-arcs-v2] ✓ {ARCS_PATH.relative_to(ROOT)} mis à jour ({len(merged)} arcs au total)')

    # ─ Sortir les patches à appliquer manuellement ─
    patch_dir = ROOT / 'patches'
    patch_dir.mkdir(exist_ok=True)

    # 1. Snippet pour cas-in-achievements.js
    snippet1 = patch_dir / 'patch_achievements_snippet.txt'
    lines = ['    // ─── Arcs PNJ auto-générés (v2.94) — à coller dans GLOBAL_BADGES ───']
    for b in new_badge_entries:
        desc_esc = b["desc"].replace("'", "\\'")
        name_esc = b["name"].replace("'", "\\'")
        lines.append(
            f"    {{ id: '{b['id']}', emoji: '{b['emoji']}', "
            f"name: '{name_esc}', "
            f"desc: '{desc_esc}', "
            f"category: '{b['category']}' }},"
        )
    snippet1.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'[npc-arcs-v2] ✓ {snippet1.relative_to(ROOT)} ({len(new_badge_entries)} entrées)')

    # 2. Snippet pour ARC_TO_ACHIEVEMENT dans cas-in-arcs.js
    snippet2 = patch_dir / 'patch_arc_to_achievement.txt'
    lines = ['    // ─── Arcs auto-générés (v2.94) — à coller dans ARC_TO_ACHIEVEMENT ───']
    for nid, bid in new_mapping_entries:
        lines.append(f"    '{nid}': '{bid}',")
    snippet2.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'[npc-arcs-v2] ✓ {snippet2.relative_to(ROOT)} ({len(new_mapping_entries)} entrées)')


if __name__ == '__main__':
    main()
