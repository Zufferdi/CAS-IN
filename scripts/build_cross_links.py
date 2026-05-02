#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_cross_links.py — Construit data/cross-links.json

Génère des liens bidirectionnels entre :
  - Fiches (109)         — data/manifest.json + fiches/*.html
  - Questions (1777)     — data/questions.json
  - TP (32 catégories)   — extraites de tp.html (data-cat)
  - Scènes (93)          — scenes/*.json

Stratégie de matching :
  1. Hard-coded mappings explicites (priorité) — voir HARD_LINKS ci-dessous
  2. Auto-fill par matching de mots-clés sur chapter ↔ fiche.keywords/title
  3. Tags de scènes → fiches via category mapping

Output :
  data/cross-links.json :
    {
      "fiches": {
        "ntfs.html": { "questions": [42, 145, ...], "tps": ["runlist", "mbr"], "scenes": [...] },
        ...
      },
      "questions_by_id": {"0": {...}, ...},   # raccourci d'accès
      "$generated_at": "...",
      "$schema_version": 1
    }

v1.0 — 2026-05-02
"""

import json
import re
import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# ─── HARD LINKS (priorité 1) ──────────────────────────────────────────────────
# Mappings explicites où la liaison est évidente. Le matching auto les
# complétera. Chaque clé : nom de fiche (sans .html), valeurs : chapters
# auxquels elle est liée + tps + scene-tags.

HARD_LINKS_FICHE_TO_CHAPTERS = {
    # Acquisition & analyse
    'acquisition':          ['Acquisition et préservation', 'Méthodologie forensique'],
    'methodologie_dfir':    ['Méthodologie forensique', 'Méthodologie et bonnes pratiques'],
    'chain_of_custody':     ['Acquisition et préservation', 'Méthodologie forensique'],

    # Filesystems
    'ntfs':                 ['NTFS'],
    'fat32':                ['FAT12 / FAT16 / FAT32'],
    'exfat':                ['exFAT'],
    'apfs':                 ['HFS+ et APFS'],
    'hfs_plus':             ['HFS+ et APFS'],
    'ext4':                 ['EXT2 / EXT3 / EXT4'],
    'refs':                 ['NTFS'],
    'btrfs_zfs':            ['EXT2 / EXT3 / EXT4'],

    # Windows
    'windows':              ['Windows — Artefacts et exécution'],
    'windows_forensique':   ['Windows — Artefacts et exécution', 'Windows — Journaux et Event Logs'],
    'registre_windows':     ['Windows — Registre et artefacts'],
    'windows_registry_forensique_avance': ['Windows — Registre et artefacts'],
    'logs_windows':         ['Windows — Journaux et Event Logs'],
    'powershell_forensique':['Windows — Artefacts et exécution'],
    'lateral_movement_forensique': ['Windows — Artefacts et exécution', 'Windows — Journaux et Event Logs'],
    'cmd_windows_forensique': ['Windows — Artefacts et exécution', 'Windows — Journaux et Event Logs'],

    # Linux / macOS
    'linux_forensique':     ['Linux — Artefacts et analyse'],
    'cmd_linux_forensique': ['Linux — Artefacts et analyse'],
    'macos_forensique':     ['macOS — Artefacts et analyse'],
    'wsl_forensique':       ['Linux — Artefacts et analyse', 'Windows — Artefacts et exécution'],

    # Mémoire
    'ram_forensique':       ['Logiciels et outils forensiques', 'Acquisition et préservation'],
    'memoire_internals':    ['Logiciels et outils forensiques'],
    'volatility_memory_forensics': ['Logiciels et outils forensiques'],
    'volatilite':           ['Acquisition et préservation'],

    # Réseaux
    'wireshark_pcap':       ['Réseau, protocoles et Internet'],
    'tor_forensique':       ['Réseau, protocoles et Internet', 'Infrastructure, DNS et pivots'],
    'tcp_ip':               ['Adressage IP', 'Réseau, protocoles et Internet'],
    'dns_dhcp':             ['Infrastructure, DNS et pivots', 'Réseau, protocoles et Internet'],

    # Cloud / Email
    'cloud_forensique':     ['Réseau, protocoles et Internet'],
    'm365_forensique':      ['Réseau, protocoles et Internet'],
    'email_forensique':     ['Réseau, protocoles et Internet'],
    'entreprise_messaging_forensique': ['Réseau, protocoles et Internet'],

    # Cryptologie
    'hash':                 ['Hachage et intégrité'],
    'cassage_mdp':          ['Cassage et attaques', 'Hachage et intégrité'],
    'pki':                  ['PKI et certificats'],
    'ssl_tls':              ['PKI et certificats'],
    'chiffrement_symetrique': ['Chiffrement symétrique'],
    'chiffrement_asymetrique': ['Chiffrement asymétrique et RSA'],

    # OSINT
    'osint':                ['Fondamentaux OSINT', 'Outils et automatisation OSINT'],
    'osint_metadonnees':    ['Fondamentaux OSINT', 'Recherche web et Google Dorks', 'Métadonnées et EXIF'],
    'metadonnees_avancees': ['Recherche web et Google Dorks', 'Métadonnées et EXIF'],

    # Carving / Recovery
    'data_carving':         ['Analyse et recovery', 'Formats de fichiers et Magic Bytes'],
    'magic_bytes':          ['Formats de fichiers et Magic Bytes'],
    'documents_office_forensique': ['Formats de fichiers et Magic Bytes'],

    # Anti-forensics
    'antiforensique':       ['Techniques et méthodologie'],
    'steganographie':       ['Techniques et méthodologie'],

    # Droit
    'droit_ch':             ['Droit pénal informatique', 'Procédure pénale'],
    'cppdroit':             ['Droit pénal informatique', 'Procédure pénale'],
    'autorites_competences_ch': ['Procédure pénale', 'Entraide judiciaire internationale'],
    'sequestre':            ['Séquestre informatique'],
    'expertise':            ['Expertise et rapport judiciaire'],
    'perquisition':         ['Perquisition de documents'],

    # Outils
    'autopsy_tsk':          ['Logiciels et outils forensiques'],
    'zimmerman':            ['Logiciels et outils forensiques'],

    # IoT / ICS
    'iot_forensique':       ['ICS / SCADA / OT Forensique'],
    'mitre_attack':         ['ICS / SCADA / OT Forensique', 'Méthodologie forensique'],

    # Disque
    'mac_times':            ['Artefacts temporels et MAC times'],
    'usb_storage':          ['Technologie des disques'],
    'usb_removable':        ['Technologie des disques'],

    # Bases
    'bases_numeriques':     ['Représentation des données'],
    'representation_donnees': ['Représentation des données'],
}

# Liens fiche → catégories TP (données via tp.html data-cat)
HARD_LINKS_FICHE_TO_TPS = {
    'mac_times':            ['timestamp', 'timestomping'],
    'fat32':                ['fat', 'effacement', 'bitmap', 'direntry'],
    'exfat':                ['bitmap', 'effacement'],
    'ntfs':                 ['runlist', 'mbr', 'slackspace'],
    'magic_bytes':          ['magic', 'mismatch', 'fsidentify'],
    'data_carving':         ['magic', 'fsidentify', 'slackspace'],
    'registre_windows':     ['registry'],
    'windows_registry_forensique_avance': ['registry'],
    'windows_forensique':   ['prefetch', 'lnk', 'registry'],
    'lateral_movement_forensique': ['lnk', 'registry'],
    'hash':                 ['hash'],
    'email_forensique':     ['email'],
    'wireshark_pcap':       ['network'],
    'methodologie_dfir':    ['ir'],
    'droit_ch':             ['droitpenal'],
    'cppdroit':             ['droitpenal'],
    'documents_office_forensique': ['mismatch', 'magic'],
}

# Liens fiche → tags de scènes (les scènes ont des tags comme 'WINDOWS', 'FORENSIQUE')
HARD_LINKS_FICHE_TO_SCENE_TAGS = {
    'windows_forensique':       ['WINDOWS'],
    'registre_windows':         ['WINDOWS'],
    'windows_registry_forensique_avance': ['WINDOWS'],
    'lateral_movement_forensique': ['WINDOWS', 'INTRUSION'],
    'logs_windows':             ['WINDOWS'],
    'powershell_forensique':    ['WINDOWS', 'INTRUSION'],

    'linux_forensique':         ['LINUX'],
    'cmd_linux_forensique':     ['LINUX'],

    'macos_forensique':         ['MACOS'],

    'mobile_forensique':        ['MOBILE'],
    'ios_forensique':           ['MOBILE'],
    'android_forensique':       ['MOBILE'],

    'malware_forensique':       ['MALWARE', 'INTRUSION'],
    'yara':                     ['MALWARE'],

    'ram_forensique':           ['MEMOIRE', 'INTRUSION'],
    'volatility_memory_forensics': ['MEMOIRE'],

    'wireshark_pcap':           ['RESEAU'],
    'tor_forensique':           ['DARKNET', 'RESEAU'],

    'osint':                    ['OSINT'],
    'osint_metadonnees':        ['OSINT'],
    'cryptomonnaies_blockchain':['CRYPTO', 'FINANCIER'],

    'cassage_mdp':              ['CRYPTO'],
    'data_carving':             ['CARVING'],

    'droit_ch':                 ['DROIT', 'JURIDIQUE'],
    'cppdroit':                 ['DROIT', 'JURIDIQUE'],
    'autorites_competences_ch': ['JURIDIQUE'],

    'iot_forensique':           ['IOT', 'ICS'],

    'cloud_forensique':         ['CLOUD'],
    'm365_forensique':          ['CLOUD'],

    'email_forensique':         ['EMAIL', 'BEC'],
    'entreprise_messaging_forensique': ['EMAIL'],
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def load_manifest():
    with open(REPO / 'data' / 'manifest.json') as f:
        return json.load(f)


def load_questions():
    with open(REPO / 'data' / 'questions.json') as f:
        return json.load(f)


def load_scenes():
    scenes = []
    for f in sorted((REPO / 'scenes').glob('*.json')):
        try:
            with open(f) as fh:
                s = json.load(fh)
                scenes.append({
                    'id': s.get('id', f.stem),
                    'title': s.get('title', ''),
                    'icon': s.get('icon', '🎭'),
                    'tags': s.get('tags', []),
                    'difficulty': s.get('difficulty', ''),
                    'file': f.stem,
                })
        except Exception:
            pass
    return scenes


def get_tp_categories():
    """Extrait les catégories TP avec leurs labels depuis tp.html."""
    tp_html = (REPO / 'tp.html').read_text(encoding='utf-8')
    pattern = re.compile(
        r'data-cat="([^"]+)"[^>]*onclick="go\([^)]+\)"[^>]*>'
        r'\s*<span class="sb-cat-icon">([^<]+)</span>'
        r'\s*<span class="sb-cat-name">([^<]+)</span>',
        re.DOTALL
    )
    out = {}
    for m in pattern.finditer(tp_html):
        cat = m.group(1)
        if cat.startswith('_') or cat in ('${cat}',):
            continue
        out[cat] = {
            'icon': m.group(2),
            'label': re.sub(r'&\w+;', '&', m.group(3)).strip(),
        }
    return out


# ─── Auto-matching: questions ↔ fiches via chapter ───────────────────────────

def match_questions_to_fiche(fiche_name, fiche_meta, questions, hard_chapters):
    """Pour chaque fiche, retourner les indices des questions qui la concernent."""
    matched = set()

    # 1) Chapters explicites (HARD_LINKS)
    for chapter in hard_chapters:
        for i, q in enumerate(questions):
            if q.get('chapter') == chapter:
                matched.add(i)

    # 2) Auto-match par mots-clés du titre fiche dans la question
    title_words = set(w.lower() for w in re.findall(r'\w+', fiche_meta.get('title', '')) if len(w) >= 4)
    if title_words:
        # Mots distinctifs présents dans le titre/desc/keywords de la fiche
        fiche_distinctive = title_words - {'forensique', 'forensic', 'analyse', 'systeme', 'système',
                                            'avance', 'avancé', 'avancée', 'fiche', 'cours'}
        for i, q in enumerate(questions):
            if i in matched:
                continue
            q_text = (q.get('q', '') + ' ' + q.get('chapter', '') +
                      ' ' + ' '.join(q.get('refs', []))).lower()
            # Au moins 2 mots distinctifs présents
            if sum(1 for w in fiche_distinctive if w in q_text) >= 2:
                matched.add(i)

    return sorted(matched)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("▸ Chargement des données…")
    manifest = load_manifest()
    questions = load_questions()
    scenes = load_scenes()
    tp_cats = get_tp_categories()

    fiches_by_file = {f['file']: f for f in manifest['fiches']}

    print(f"  · {len(fiches_by_file)} fiches")
    print(f"  · {len(questions)} questions")
    print(f"  · {len(scenes)} scènes")
    print(f"  · {len(tp_cats)} catégories TP")
    print()

    # Build mapping
    cross = {
        'fiches': {},
    }

    print("▸ Construction du mapping fiches…")
    for fiche_file, fiche_meta in fiches_by_file.items():
        fiche_key = fiche_file.replace('.html', '')

        # Questions
        chapters = HARD_LINKS_FICHE_TO_CHAPTERS.get(fiche_key, [])
        question_indices = match_questions_to_fiche(fiche_key, fiche_meta, questions, chapters)

        # TP
        tps = HARD_LINKS_FICHE_TO_TPS.get(fiche_key, [])

        # Scènes (par tags)
        scene_tags_filter = set(HARD_LINKS_FICHE_TO_SCENE_TAGS.get(fiche_key, []))
        scene_ids = []
        if scene_tags_filter:
            for s in scenes:
                if any(t in s.get('tags', []) for t in scene_tags_filter):
                    scene_ids.append(s['id'])

        cross['fiches'][fiche_file] = {
            'questions': question_indices[:50],   # cap pour ne pas exploser
            'tps': tps,
            'scenes': scene_ids[:8],
        }

    # Statistiques
    n_q = sum(len(v['questions']) for v in cross['fiches'].values())
    n_tp = sum(len(v['tps']) for v in cross['fiches'].values())
    n_sc = sum(len(v['scenes']) for v in cross['fiches'].values())
    n_orphan_q = sum(1 for v in cross['fiches'].values() if not v['questions'])
    n_orphan_tp = sum(1 for v in cross['fiches'].values() if not v['tps'])
    n_orphan_sc = sum(1 for v in cross['fiches'].values() if not v['scenes'])

    print(f"  · Liens fiches → questions : {n_q} ({n_orphan_q} fiches orphelines)")
    print(f"  · Liens fiches → TP : {n_tp} ({n_orphan_tp} fiches orphelines)")
    print(f"  · Liens fiches → scènes : {n_sc} ({n_orphan_sc} fiches orphelines)")
    print()

    # Mapping TP → fiches (inverse)
    cross['tps'] = {}
    for tp_cat, tp_meta in tp_cats.items():
        related_fiches = [f for f, v in cross['fiches'].items() if tp_cat in v['tps']]
        cross['tps'][tp_cat] = {
            'icon': tp_meta['icon'],
            'label': tp_meta['label'],
            'fiches': related_fiches,
        }

    # Mapping scènes → fiches (inverse)
    cross['scenes'] = {}
    for s in scenes:
        related = [f for f, v in cross['fiches'].items() if s['id'] in v['scenes']]
        cross['scenes'][s['id']] = {
            'title': s['title'],
            'icon': s['icon'],
            'tags': s['tags'],
            'fiches': related,
        }

    # Métadonnées
    cross['$generated_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cross['$schema_version'] = 1
    cross['$counts'] = {
        'fiches': len(cross['fiches']),
        'tps': len(cross['tps']),
        'scenes': len(cross['scenes']),
        'links_q': n_q,
        'links_tp': n_tp,
        'links_sc': n_sc,
    }

    # Output
    out = REPO / 'data' / 'cross-links.json'
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(cross, f, ensure_ascii=False, separators=(',', ':'))

    size = out.stat().st_size
    print(f"✓ {out.relative_to(REPO)}")
    print(f"  Taille : {size/1024:.1f} KB")


if __name__ == '__main__':
    main()
