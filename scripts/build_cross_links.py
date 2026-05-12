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
    # ─── Acquisition & méthodologie ───
    'acquisition':          ['Acquisition et préservation', 'Méthodologie forensique'],
    'methodologie_dfir':    ['Méthodologie forensique', 'Méthodologie et bonnes pratiques'],
    'chain_of_custody':     ['Acquisition et préservation', 'Méthodologie forensique'],
    'premier_intervenant':  ['Acquisition et préservation', 'Méthodologie forensique', 'Méthodologie et bonnes pratiques'],
    'rapport_forensique':   ['Expertise et rapport judiciaire', 'Méthodologie forensique'],
    'algorithmes_forensique': ['Hachage et intégrité', 'Logiciels et outils forensiques'],
    'mathematiques_forensique': ['Représentation des données', 'Hachage et intégrité'],
    'timeline':             ['Artefacts temporels et MAC times', 'Logiciels et outils forensiques'],
    'autopsy':              ['Logiciels et outils forensiques', 'Analyse et recovery'],
    'kape_velociraptor':    ['Logiciels et outils forensiques', 'Acquisition et préservation'],
    'log_forensique_avance':['Logiciels et outils forensiques', 'Windows — Journaux et Event Logs'],
    'browser_artifacts_deep_dive': ['Logiciels et outils forensiques', 'Windows — Artefacts et exécution'],
    'ia_deepfake_forensique':['Métadonnées et EXIF', 'Formats de fichiers et Magic Bytes'],
    'metadata_avancees':    ['Métadonnées et EXIF', 'Formats de fichiers et Magic Bytes'],

    # ─── Filesystems ───
    'ntfs':                 ['NTFS'],
    'fat32':                ['FAT12 / FAT16 / FAT32'],
    'fat12':                ['FAT12 / FAT16 / FAT32'],
    'exfat':                ['exFAT'],
    'apfs':                 ['HFS+ et APFS'],
    'hfs_plus':             ['HFS+ et APFS'],
    'hfs':                  ['HFS+ et APFS'],
    'ext4':                 ['EXT2 / EXT3 / EXT4'],
    'ext':                  ['EXT2 / EXT3 / EXT4'],
    'refs':                 ['NTFS'],
    'btrfs_zfs':            ['EXT2 / EXT3 / EXT4'],
    'f2fs':                 ['EXT2 / EXT3 / EXT4'],
    'comparaison_fs':       ['NTFS', 'FAT12 / FAT16 / FAT32', 'exFAT', 'EXT2 / EXT3 / EXT4', 'HFS+ et APFS'],
    'disques':              ['Technologie des disques'],
    'mbr_gpt':              ['Technologie des disques', 'NTFS'],
    'encodage':             ['Représentation des données'],

    # ─── Windows ───
    'windows':              ['Windows — Artefacts et exécution'],
    'windows_forensique':   ['Windows — Artefacts et exécution', 'Windows — Journaux et Event Logs'],
    'registre_windows':     ['Windows — Registre et artefacts'],
    'windows_registry_forensique_avance': ['Windows — Registre et artefacts'],
    'logs_windows':         ['Windows — Journaux et Event Logs'],
    'powershell_forensique':['Windows — Artefacts et exécution'],
    'lateral_movement_forensique': ['Windows — Artefacts et exécution', 'Windows — Journaux et Event Logs'],
    'cmd_windows_forensique': ['Windows — Artefacts et exécution', 'Windows — Journaux et Event Logs'],
    'shellbags':            ['Windows — Registre et artefacts', 'Windows — Artefacts et exécution'],
    'sysmon':               ['Windows — Journaux et Event Logs'],
    'usb_forensique':       ['Windows — Registre et artefacts', 'Technologie des disques'],
    'usb_removable_media_forensique': ['Windows — Registre et artefacts', 'Windows — Journaux et Event Logs', 'Technologie des disques'],
    'usb_storage':          ['Technologie des disques', 'Windows — Registre et artefacts'],
    'usb_removable':        ['Technologie des disques', 'Windows — Registre et artefacts'],

    # ─── Linux / macOS ───
    'linux_forensique':     ['Linux — Artefacts et analyse'],
    'cmd_linux_forensique': ['Linux — Artefacts et analyse'],
    'macos_forensique':     ['macOS — Artefacts et analyse'],
    'wsl_forensique':       ['Linux — Artefacts et analyse', 'Windows — Artefacts et exécution'],

    # ─── Mémoire ───
    'ram_forensique':       ['Logiciels et outils forensiques', 'Acquisition et préservation'],
    'memoire_internals':    ['Logiciels et outils forensiques'],
    'volatility_memory_forensics': ['Logiciels et outils forensiques'],
    'volatilite':           ['Acquisition et préservation'],

    # ─── Réseaux ───
    'wireshark_pcap':       ['Réseau, protocoles et Internet'],
    'tor_forensique':       ['Réseau, protocoles et Internet', 'Infrastructure, DNS et pivots'],
    'tor_darkweb':          ['Réseau, protocoles et Internet', 'Infrastructure, DNS et pivots'],
    'tcp_ip':               ['Adressage IP', 'Réseau, protocoles et Internet'],
    'dns_dhcp':             ['Infrastructure, DNS et pivots', 'Réseau, protocoles et Internet'],
    'dns_forensique':       ['Infrastructure, DNS et pivots', 'Réseau, protocoles et Internet'],
    'dns_forensique_avance':['Infrastructure, DNS et pivots', 'Réseau, protocoles et Internet'],
    'siem_logs':            ['Logiciels et outils forensiques', 'Réseau, protocoles et Internet', 'Windows — Journaux et Event Logs'],

    # ─── Cloud / Email / Messageries ───
    'cloud_forensique':     ['Réseau, protocoles et Internet'],
    'm365_forensique':      ['Réseau, protocoles et Internet'],
    'email_forensique':     ['Réseau, protocoles et Internet'],
    'email_headers_smtp_forensique': ['Réseau, protocoles et Internet'],
    'entreprise_messaging_forensique': ['Réseau, protocoles et Internet'],
    'messagerie_im':        ['Réseau, protocoles et Internet'],
    'messagerie_im_forensique': ['Réseau, protocoles et Internet'],

    # ─── Cryptologie ───
    'crypto':               ['Chiffrement symétrique', 'Chiffrement asymétrique et RSA', 'PKI et certificats'],
    'hash':                 ['Hachage et intégrité'],
    'cassage_mdp':          ['Cassage et attaques', 'Hachage et intégrité'],
    'pki':                  ['PKI et certificats'],
    'pki_certificats':      ['PKI et certificats'],
    'ssl_tls':              ['PKI et certificats'],
    'chiffrement_symetrique': ['Chiffrement symétrique'],
    'chiffrement_asymetrique': ['Chiffrement asymétrique et RSA'],
    'chiffrement_volumes':  ['Chiffrement symétrique', 'Acquisition et préservation'],
    'cryptomonnaies':       ['Chiffrement asymétrique et RSA'],
    'cryptomonnaies_blockchain': ['Chiffrement asymétrique et RSA'],

    # ─── Malware / Anti-Forensique ───
    'malware_forensique':   ['Logiciels et outils forensiques', 'Windows — Artefacts et exécution'],
    'yara':                 ['Logiciels et outils forensiques', 'Formats de fichiers et Magic Bytes'],
    'antiforensique':       ['Techniques et méthodologie'],
    'anti_forensique':      ['Techniques et méthodologie'],
    'steganographie':       ['Techniques et méthodologie'],
    'ransomware_forensique':['Logiciels et outils forensiques', 'Chiffrement symétrique', 'Méthodologie forensique'],

    # ─── OSINT ───
    'osint':                ['Fondamentaux OSINT', 'Outils et automatisation OSINT'],
    'osint_metadonnees':    ['Fondamentaux OSINT', 'Recherche web et Google Dorks', 'Métadonnées et EXIF'],
    'metadonnees_avancees': ['Recherche web et Google Dorks', 'Métadonnées et EXIF'],

    # ─── Carving / Recovery / Formats ───
    'data_carving':         ['Analyse et recovery', 'Formats de fichiers et Magic Bytes'],
    'magic_bytes':          ['Formats de fichiers et Magic Bytes'],
    'documents_office_forensique': ['Formats de fichiers et Magic Bytes'],
    'pdf_forensique_avance':['Formats de fichiers et Magic Bytes'],

    # ─── SQLite ───
    'sqlite_forensique':    ['Logiciels et outils forensiques', 'Formats de fichiers et Magic Bytes'],
    'sqlite_forensique_avance': ['Logiciels et outils forensiques', 'Formats de fichiers et Magic Bytes'],

    # ─── Mobile ───
    'mobile_forensique':    ['Logiciels et outils forensiques', 'Acquisition et préservation'],
    'mobile':               ['Logiciels et outils forensiques', 'Acquisition et préservation'],
    'ios_forensique':       ['Logiciels et outils forensiques', 'Acquisition et préservation'],
    'android_forensique':   ['Logiciels et outils forensiques', 'Acquisition et préservation'],
    'mobile_apps_forensique': ['Logiciels et outils forensiques'],
    'browser_forensique':   ['Logiciels et outils forensiques', 'Windows — Artefacts et exécution'],

    # ─── Plateformes spécialisées ───
    'docker_kubernetes_forensique': ['Logiciels et outils forensiques', 'Linux — Artefacts et analyse'],
    'vm_forensique':        ['Logiciels et outils forensiques', 'Acquisition et préservation'],
    'nas_forensique':       ['Logiciels et outils forensiques', 'EXT2 / EXT3 / EXT4', 'Réseau, protocoles et Internet'],
    'vehicules_forensique': ['Logiciels et outils forensiques', 'Acquisition et préservation'],
    'iot_forensique':       ['ICS / SCADA / OT Forensique', 'Logiciels et outils forensiques'],
    'ics_forensique':       ['ICS / SCADA / OT Forensique'],
    'mitre_attack':         ['ICS / SCADA / OT Forensique', 'Méthodologie forensique', 'Windows — Artefacts et exécution'],

    # ─── Droit ───
    'droit_ch':             ['Droit pénal informatique', 'Procédure pénale'],
    'cppdroit':             ['Droit pénal informatique', 'Procédure pénale'],
    'autorites_competences_ch': ['Procédure pénale', 'Entraide judiciaire internationale'],
    'sequestre':            ['Séquestre informatique'],
    'expertise':            ['Expertise et rapport judiciaire'],
    'perquisition':         ['Perquisition de documents'],
    'suisse':               ['Droit pénal informatique', 'Procédure pénale', 'Séquestre informatique'],
    'lscpt':                ['Procédure pénale', 'Entraide judiciaire internationale'],

    # ─── Outils ───
    'autopsy_tsk':          ['Logiciels et outils forensiques'],
    'zimmerman':            ['Logiciels et outils forensiques'],

    # ─── Disque & Time ───
    'mac_times':            ['Artefacts temporels et MAC times'],

    # ─── Bases ───
    'bases_numeriques':     ['Représentation des données'],
    'representation_donnees': ['Représentation des données'],
}

# Liens fiche → catégories TP (données via tp.html data-cat)
HARD_LINKS_FICHE_TO_TPS = {
    # Filesystems
    'mac_times':            ['timestamp', 'timestomping'],
    'fat32':                ['fat', 'effacement', 'bitmap', 'direntry'],
    'fat12':                ['fat', 'effacement', 'direntry'],
    'exfat':                ['bitmap', 'effacement'],
    'ntfs':                 ['runlist', 'mbr', 'slackspace'],
    'ext':                  ['fsidentify'],
    'ext4':                 ['fsidentify'],
    'hfs':                  ['fsidentify'],
    'apfs':                 ['fsidentify'],
    'hfs_plus':             ['fsidentify'],
    'comparaison_fs':       ['fsidentify', 'magic'],
    'mbr_gpt':              ['mbr', 'offset'],
    'disques':              ['mbr'],

    # Carving / Magic
    'magic_bytes':          ['magic', 'mismatch', 'fsidentify'],
    'data_carving':         ['magic', 'fsidentify', 'slackspace'],
    'documents_office_forensique': ['mismatch', 'magic'],
    'pdf_forensique_avance':['magic', 'mismatch'],

    # Windows
    'registre_windows':     ['registry'],
    'windows_registry_forensique_avance': ['registry'],
    'windows_forensique':   ['prefetch', 'lnk', 'registry'],
    'lateral_movement_forensique': ['lnk', 'registry'],
    'shellbags':            ['registry'],
    'sysmon':               ['ir', 'registry'],
    'usb_forensique':       ['registry'],
    'usb_removable_media_forensique': ['registry'],
    'logs_windows':         ['registry', 'ir'],

    # Crypto / Hash
    'hash':                 ['hash'],
    'algorithmes_forensique': ['hash'],
    'cassage_mdp':          ['hash'],
    'crypto':               ['hash'],

    # Email / réseau
    'email_forensique':     ['email'],
    'email_headers_smtp_forensique': ['email'],
    'wireshark_pcap':       ['network'],
    'siem_logs':            ['network', 'ir'],
    'dns_forensique':       ['network'],
    'dns_forensique_avance':['network'],

    # Méthodo / IR
    'methodologie_dfir':    ['ir'],
    'premier_intervenant':  ['ir'],
    'ransomware_forensique':['ir'],
    'malware_forensique':   ['ir'],

    # Droit
    'droit_ch':             ['droitpenal'],
    'cppdroit':             ['droitpenal'],
    'suisse':               ['droitpenal'],
    'lscpt':                ['droitpenal'],
    'autorites_competences_ch': ['droitpenal'],

    # Bases
    'encodage':             ['bases', 'hexdump', 'hextable', 'offset'],
    'bases_numeriques':     ['bases', 'hexdump', 'hextable'],
    'representation_donnees': ['bases', 'hexdump', 'hextable'],
}

# Liens fiche → tags de scènes (les scènes ont des tags comme 'WINDOWS', 'FORENSIQUE')
HARD_LINKS_FICHE_TO_SCENE_TAGS = {
    # Windows
    'windows':                  ['WINDOWS'],
    'windows_forensique':       ['WINDOWS'],
    'registre_windows':         ['WINDOWS'],
    'windows_registry_forensique_avance': ['WINDOWS'],
    'lateral_movement_forensique': ['WINDOWS'],
    'logs_windows':             ['WINDOWS'],
    'powershell_forensique':    ['WINDOWS'],
    'shellbags':                ['WINDOWS'],
    'sysmon':                   ['WINDOWS'],
    'usb_forensique':           ['WINDOWS'],
    'usb_removable_media_forensique': ['WINDOWS'],
    'cmd_windows_forensique':   ['WINDOWS'],

    # Linux / macOS / WSL
    'linux_forensique':         ['FORENSIQUE'],
    'cmd_linux_forensique':     ['FORENSIQUE'],
    'macos_forensique':         ['FORENSIQUE'],
    'wsl_forensique':           ['WINDOWS'],

    # Mobile
    'mobile_forensique':        ['MOBILE', 'MOBILE FORENSICS'],
    'ios_forensique':           ['MOBILE', 'MOBILE FORENSICS'],
    'android_forensique':       ['MOBILE', 'MOBILE FORENSICS'],
    'mobile_apps_forensique':   ['MOBILE'],
    'messagerie_im':            ['MOBILE'],
    'messagerie_im_forensique': ['MOBILE'],

    # Malware / Ransomware
    'malware_forensique':       ['MALWARE'],
    'yara':                     ['MALWARE'],
    'ransomware_forensique':    ['RANSOMWARE'],

    # Mémoire
    'ram_forensique':           ['MEMORY FORENSICS', 'RAM', 'VOLATILITY'],
    'volatility_memory_forensics': ['MEMORY FORENSICS', 'VOLATILITY'],
    'memoire_internals':        ['MEMORY FORENSICS', 'RAM'],

    # Réseaux / DNS / SIEM
    'wireshark_pcap':           ['RÉSEAUX'],
    'tor_forensique':           ['DARKNET', 'DARK WEB', 'RÉSEAUX'],
    'tor_darkweb':              ['DARKNET', 'DARK WEB'],
    'dns_forensique':           ['RÉSEAUX'],
    'dns_forensique_avance':    ['RÉSEAUX'],
    'siem_logs':                ['RÉSEAUX', 'INCIDENT RESPONSE', 'RÉPONSE INCIDENT'],

    # Crypto
    'crypto':                   ['CRYPTO'],
    'cassage_mdp':              ['CRYPTO'],
    'chiffrement_volumes':      ['CRYPTO'],
    'pki':                      ['CRYPTO'],
    'pki_certificats':          ['CRYPTO'],
    'cryptomonnaies':           ['CRYPTO', 'BLANCHIMENT'],
    'cryptomonnaies_blockchain':['CRYPTO', 'BLANCHIMENT'],
    'data_carving':             ['FORENSIQUE'],

    # Droit
    'droit_ch':                 ['DROIT', 'DROIT PÉNAL'],
    'cppdroit':                 ['DROIT', 'DROIT PÉNAL', 'CPP'],
    'autorites_competences_ch': ['DROIT', 'DROIT PÉNAL'],
    'sequestre':                ['DROIT', 'CPP'],
    'expertise':                ['DROIT', 'CPP'],
    'perquisition':             ['DROIT', 'CPP', 'PERQUISITION'],
    'suisse':                   ['DROIT', 'DROIT PÉNAL'],
    'lscpt':                    ['DROIT', 'CPP'],

    # OSINT
    'osint':                    ['OSINT'],
    'osint_metadonnees':        ['OSINT'],

    # ICS / IoT / véhicules
    'iot_forensique':           ['IOT', 'ICS'],
    'ics_forensique':           ['ICS', 'SCADA', 'OT', 'INFRASTRUCTURE CRITIQUE'],
    'mitre_attack':             ['INCIDENT RESPONSE', 'RÉPONSE INCIDENT'],
    'vehicules_forensique':     ['FORENSIQUE'],

    # Cloud / Containers
    'cloud_forensique':         ['CLOUD', 'FORENSIQUE CLOUD'],
    'm365_forensique':          ['CLOUD', 'M365'],
    'docker_kubernetes_forensique': ['CLOUD'],
    'vm_forensique':            ['FORENSIQUE'],
    'nas_forensique':           ['FORENSIQUE'],

    # Email / Phishing
    'email_forensique':         ['BEC', 'PHISHING'],
    'email_headers_smtp_forensique': ['BEC', 'PHISHING'],
    'entreprise_messaging_forensique': ['BEC'],

    # IA & Deepfakes
    'ia_deepfake_forensique':   ['IA', 'DEEPFAKE', 'GENAI'],

    # Méthodologie / IR
    'methodologie_dfir':        ['DFIR', 'INCIDENT RESPONSE'],
    'premier_intervenant':      ['PREMIER INTERVENANT', 'GESTION DE CRISE'],
    'rapport_forensique':       ['CHAÎNE PROBATOIRE'],
    'chain_of_custody':         ['CHAÎNE PROBATOIRE'],

    # Anti-forensique
    'antiforensique':           ['FORENSIQUE'],
    'anti_forensique':          ['FORENSIQUE'],
    'steganographie':           ['FORENSIQUE'],

    # SQLite
    'sqlite_forensique':        ['MOBILE', 'MOBILE FORENSICS'],
    'sqlite_forensique_avance': ['MOBILE', 'MOBILE FORENSICS'],

    # Browser
    'browser_artifacts_deep_dive': ['FORENSIQUE'],

    # Logs
    'log_forensique_avance':    ['INCIDENT RESPONSE', 'RÉPONSE INCIDENT'],
    'kape_velociraptor':        ['INCIDENT RESPONSE', 'RÉPONSE INCIDENT'],
    'timeline':                 ['FORENSIQUE'],
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
    """Pour chaque fiche, retourner les indices des questions qui la concernent.

    Stratégie de scoring (plus haut = plus pertinent) :
      • +10  question dans un chapter HARD précis (≤50 q)
      • +5   question dans un chapter HARD large (>50 q)
      • +3   auto-match par mots-clés (≥2 mots distinctifs)
    Au final on trie par score décroissant pour que le cap [:30] garde le meilleur.
    """
    from collections import Counter
    chapter_sizes = Counter(q.get('chapter', '') for q in questions)

    scored = {}  # idx → score

    # 1) Chapters explicites (HARD_LINKS)
    for chapter in hard_chapters:
        size = chapter_sizes.get(chapter, 0)
        # Bonus si chapter précis (peu de questions = très pertinent)
        weight = 10 if size <= 50 else 5
        for i, q in enumerate(questions):
            if q.get('chapter') == chapter:
                scored[i] = max(scored.get(i, 0), weight)

    # 2) Auto-match par mots-clés du titre fiche dans la question
    title_words = set(w.lower() for w in re.findall(r'\w+', fiche_meta.get('title', '')) if len(w) >= 4)
    if title_words:
        fiche_distinctive = title_words - {'forensique', 'forensic', 'analyse', 'systeme', 'système',
                                            'avance', 'avancé', 'avancée', 'fiche', 'cours',
                                            'forensiques', 'forensics'}
        for i, q in enumerate(questions):
            q_text = (q.get('q', '') + ' ' + q.get('chapter', '') +
                      ' ' + ' '.join(q.get('refs', []))).lower()
            n_match = sum(1 for w in fiche_distinctive if w in q_text)
            if n_match >= 2:
                # Cumule avec le score précédent : un match HARD + auto = bonus
                scored[i] = scored.get(i, 0) + 3 + n_match  # plus de mots = mieux

    # Trier par score décroissant, puis par index pour stabilité
    return sorted(scored.keys(), key=lambda i: (-scored[i], i))


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
            'questions': question_indices[:30],   # cap pour ne pas noyer l'utilisateur
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
