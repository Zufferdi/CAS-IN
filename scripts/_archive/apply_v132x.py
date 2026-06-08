#!/usr/bin/env python3
"""
apply_v132x.py — CAS-IN v132x (fixes intégrité audit complet)

Corrige les 5 catégories de bugs trouvés à l'audit du 30 mai 2026 :

  BUG #1 — fiches/sms_blaster.html : 2 liens cassés
    - phishing.html → retirer (fiche inexistante)
    - ../parcours-narratif.html → ../pages/sagas.html

  BUG #2 — 26 tutoriels avec liens cassés vers fiches (52 liens)
    - 6 aliases (réécrire vers fiche existante)
    - 20 sans alias (retirer les boutons « 📚 Fiche »)

  BUG #3 — 14 NPCs manquants stubs minimaux
    - Stubs cohérents avec le contexte de chaque saga
    - Saga BE Lobby + AG Beznau : 2 NPCs Republik (presse d'investigation)
    - Saga VD Tom : 12 NPCs (mineur, famille, médical, judicaire, TikTok EMEA)

  BUG #4 — 70 scènes sans role/region : ajout heuristique par famille
    - 10 familles distinctes, role+region assignés cohéremment

  BUG #5 — Tableaux non-responsifs sur mobile
    - Ajout CSS global : tables scrollables horizontalement ≤720px
    - Respecte aussi prefers-reduced-motion

  Bonus : bump SW v147 → v148

Idempotent : ré-exécutable sans effet de bord.
"""
import json
import re
import sys
from pathlib import Path
from datetime import datetime, timezone


# ─────────────────────────────────────────────────────────────
# BUG #2 — Aliases tutoriel → fiche existante
# ─────────────────────────────────────────────────────────────

ALIASES = {
    'autopsy_avance': 'autopsy',
    'autopsy_debutant': 'autopsy',
    'iped_avance': 'iped',
    'iped_debutant': 'iped',
    'kape': 'kape_velociraptor',
    'velociraptor': 'kape_velociraptor',
    'wireshark': 'wireshark_pcap',
}

# Tutos sans fiche correspondante — on retire le lien
NO_FICHE_TUTOS = [
    'bases_cli', 'cellebrite_reader', 'cli_expert', 'cli_intermediaire',
    'eztools', 'ftkimager', 'ghunt_debutant', 'ghunt_moyen', 'hashcat',
    'holehe', 'john_ripper', 'maigret', 'mvt', 'phoneinfoga', 'plaso',
    'regripper', 'sherlock', 'volatility3', 'xways_debutant'
]

# ─────────────────────────────────────────────────────────────
# BUG #3 — 14 NPCs stubs (cohérents avec contexte)
# ─────────────────────────────────────────────────────────────

NEW_NPCS = {
    # ── Saga BE Lobby + AG Beznau : presse d'investigation suisse alémanique ──
    'journaliste_republik_lea': {
        'name': 'Léa Brunner',
        'role': 'Journaliste d\'investigation',
        'institution': 'Republik (Magazin online · Zurich)',
        'shortBio': 'Journaliste suisse alémanique spécialisée dans les enquêtes politiques et le lobbying parlementaire. Co-signe les enquêtes Republik sur les conflits d\'intérêts et le financement opaque. Méthode : croisement OSINT + lanceurs d\'alerte via SecureDrop.',
        'fictional': True,
        'tags': ['MEDIA-INVESTIGATION', 'REPUBLIK', 'LANCEUR-ALERTE'],
        'appearances': [],
        'canton': 'ZH',
        'category': 'media',
        'alignment': 'neutral',
        'seniority': 'senior',
        'personality': 'rigoureuse, factuelle, méthodique',
        'relations': []
    },
    'redaction_republik_constantin': {
        'name': 'Constantin Seibt',
        'role': 'Rédacteur en chef adjoint',
        'institution': 'Republik (Magazin online · Zurich)',
        'shortBio': 'Rédacteur en chef adjoint Republik, supervise les enquêtes longues. Gardien de la rigueur déontologique : audition obligatoire des destinataires (« Anhörung »), peser la pertinence publique vs vie privée, validation juridique avant publication.',
        'fictional': True,
        'tags': ['REPUBLIK', 'DEONTOLOGIE-PRESSE', 'DROIT-AUDITION'],
        'appearances': [],
        'canton': 'ZH',
        'category': 'media',
        'alignment': 'neutral',
        'seniority': 'senior',
        'personality': 'exigeant, déontologique, protecteur des sources',
        'relations': ['journaliste_republik_lea']
    },

    # ── Saga VD Tom : défi mortel TikTok (« blackout challenge ») ──
    'mineur_auteur_defi_tiktok': {
        'name': '[Mineur·e — identité protégée art. 74 DPMin]',
        'role': 'Adolescent·e auteur·trice présumé·e du défi diffusé',
        'institution': '—',
        'shortBio': 'Mineur·e de 14 ans, identité protégée par la procédure DPMin. Auteur·trice présumé·e d\'une vidéo de défi viral diffusée sur TikTok. Représenté·e par un curateur de défense désigné par le TMin VD.',
        'fictional': True,
        'tags': ['MINEUR', 'DPMin', 'IDENTITE-PROTEGEE'],
        'appearances': [],
        'canton': 'VD',
        'category': 'civil',
        'alignment': 'neutral',
        'seniority': 'jeune',
        'personality': '—',
        'relations': []
    },
    'famille_victime_tom_vd': {
        'name': 'Famille de Tom (parents et fratrie)',
        'role': 'Partie plaignante · proches de la victime',
        'institution': '—',
        'shortBio': 'Parents de Tom, 12 ans, décédé après avoir tenté de reproduire un défi viral. Constitués partie plaignante (art. 118 CPP). Accompagnés par un avocat LAVI.',
        'fictional': True,
        'tags': ['PARTIE-PLAIGNANTE', 'LAVI', 'DEUIL'],
        'appearances': [],
        'canton': 'VD',
        'category': 'civil',
        'alignment': 'neutral',
        'seniority': '—',
        'personality': 'endeuillée, en quête de réponses',
        'relations': []
    },
    'pediatre_chuv': {
        'name': 'Dr. Antonia Riva',
        'role': 'Pédiatre · Cheffe de clinique',
        'institution': 'CHUV — Département femme-mère-enfant',
        'shortBio': 'Pédiatre au CHUV, première interlocutrice médicale lors de l\'admission urgence. Établit le rapport médical initial décrivant les marques cervicales et le contexte du défi. Source de la déclaration LAVI (art. 11 LAVI) auprès du Procureur des mineurs.',
        'fictional': True,
        'tags': ['CHUV', 'PEDIATRIE', 'LAVI-ANNONCE'],
        'appearances': [],
        'canton': 'VD',
        'category': 'medical',
        'alignment': 'neutral',
        'seniority': 'senior',
        'personality': 'professionnelle, empathique, factuelle',
        'relations': []
    },
    'mpvd_procureur_mineurs': {
        'name': 'Hugues Berchier',
        'role': 'Procureur des mineurs',
        'institution': 'Ministère public central VD · Procureur des mineurs',
        'shortBio': 'Procureur des mineurs Vaud, applique le droit pénal des mineurs (DPMin) et la procédure pénale spéciale (PPMin). Coordonne avec le Tribunal des mineurs (TMC VD) pour les mesures de protection et d\'éducation.',
        'fictional': True,
        'tags': ['MP-VD', 'DPMin', 'PROCUREUR-MINEURS'],
        'appearances': [],
        'canton': 'VD',
        'category': 'police',
        'alignment': 'lawful',
        'seniority': 'senior',
        'personality': 'rigoureux, sensible à la protection des mineurs',
        'relations': ['tmcvd_juge_dpmin', 'kapo_vd_jeunesse_cyber']
    },
    'kapo_vd_jeunesse_cyber': {
        'name': 'Insp. Mathieu Pellet',
        'role': 'Inspecteur Brigade Jeunesse & Cybercrime',
        'institution': 'Police cantonale vaudoise — Brigade Jeunesse-Cyber',
        'shortBio': 'Inspecteur spécialisé jeunesse et cybercriminalité à la Polcant VD. Premier intervenant sur les infractions impliquant des mineurs (auteurs ou victimes) sur réseaux sociaux et plateformes vidéo.',
        'fictional': True,
        'tags': ['KAPO-VD', 'JEUNESSE-CYBER', 'POLCANT'],
        'appearances': [],
        'canton': 'VD',
        'category': 'police',
        'alignment': 'lawful',
        'seniority': 'intermediate',
        'personality': 'pragmatique, à l\'aise avec les ados',
        'relations': ['mpvd_procureur_mineurs']
    },
    'medecin_legiste_chuv_pediatrie': {
        'name': 'Dr. Sandra Krüger',
        'role': 'Médecin légiste · Spécialité pédiatrie',
        'institution': 'CURML — Centre universitaire romand de médecine légale',
        'shortBio': 'Médecin légiste rattachée au CURML, spécialisée en médecine légale pédiatrique. Conduit les autopsies et expertises pour le compte de la Justice vaudoise. Rapport conforme art. 184 CPP.',
        'fictional': True,
        'tags': ['CURML', 'MEDECINE-LEGALE', 'ART-184-CPP'],
        'appearances': [],
        'canton': 'VD',
        'category': 'medical',
        'alignment': 'neutral',
        'seniority': 'senior',
        'personality': 'précise, technique, indépendante',
        'relations': []
    },
    'expert_psychiatre_adolescent': {
        'name': 'Dr. Yves Pradel',
        'role': 'Expert psychiatre adolescent',
        'institution': 'SUPEA — Service universitaire de psychiatrie de l\'enfant et de l\'adolescent (CHUV)',
        'shortBio': 'Pédopsychiatre au SUPEA, expert agréé pour les expertises psychiatriques des mineurs auteurs (DPMin art. 9). Rédige des rapports d\'expertise sur le discernement, la responsabilité et l\'adéquation des mesures éducatives.',
        'fictional': True,
        'tags': ['SUPEA', 'PEDOPSYCHIATRIE', 'EXPERTISE-DPMin'],
        'appearances': [],
        'canton': 'VD',
        'category': 'medical',
        'alignment': 'neutral',
        'seniority': 'senior',
        'personality': 'analytique, à l\'écoute, prudent dans les conclusions',
        'relations': []
    },
    'tiktok_eu_liaison': {
        'name': 'Cathal O\'Riordan',
        'role': 'EU Liaison & Government Affairs',
        'institution': 'TikTok Technology Limited (EMEA HQ · Dublin)',
        'shortBio': 'Interlocuteur officiel TikTok auprès des autorités UE et suisses pour les demandes légales. Coordonne avec le Trust & Safety EU sous le régime DSA et les demandes d\'entraide art. 32 Convention de Budapest.',
        'fictional': True,
        'tags': ['TIKTOK-EMEA', 'DUBLIN', 'DSA', 'BUDAPEST-32'],
        'appearances': [],
        'canton': 'IE',
        'category': 'tech',
        'alignment': 'neutral',
        'seniority': 'intermediate',
        'personality': 'corporate, prudent, procédural',
        'relations': ['tiktok_trust_safety_eu']
    },
    'tiktok_trust_safety_eu': {
        'name': 'Sofie Vanderbilt',
        'role': 'Trust & Safety Lead EU',
        'institution': 'TikTok Technology Limited (EMEA HQ · Dublin)',
        'shortBio': 'Responsable Trust & Safety EU chez TikTok Dublin. Évalue les signalements de contenus dangereux (challenges, automutilation, suicide) et les obligations de retrait sous DSA art. 16-23. Interface avec autorités nationales pour les cas graves.',
        'fictional': True,
        'tags': ['TIKTOK-TRUST-SAFETY', 'DSA-EU', 'CONTENT-MODERATION'],
        'appearances': [],
        'canton': 'IE',
        'category': 'tech',
        'alignment': 'neutral',
        'seniority': 'senior',
        'personality': 'analytique, vigilant, conscient des enjeux légaux',
        'relations': ['tiktok_eu_liaison']
    },
    'tmcvd_juge_dpmin': {
        'name': 'Juge Marlène Coulin',
        'role': 'Juge des mineurs · Présidente DPMin',
        'institution': 'Tribunal des mineurs · Tribunal cantonal VD',
        'shortBio': 'Juge des mineurs au Tribunal cantonal VD, présidente d\'audiences DPMin. Décide des mesures de protection (art. 12 DPMin), des sanctions éducatives, et statue sur les recours en matière pénale des mineurs.',
        'fictional': True,
        'tags': ['TMC-VD', 'DPMin', 'JUGE-MINEURS'],
        'appearances': [],
        'canton': 'VD',
        'category': 'magistrate',
        'alignment': 'lawful',
        'seniority': 'senior',
        'personality': 'mesurée, pédagogue, protectrice',
        'relations': ['mpvd_procureur_mineurs']
    },
    'cyberbulling_referent': {
        'name': 'Théo Wasem',
        'role': 'Référent prévention cyberharcèlement',
        'institution': 'Action Innocence (Genève) · Délégué romand',
        'shortBio': 'Référent prévention cyberharcèlement et défis dangereux pour les écoles et familles. Intervient en milieu scolaire et formule les recommandations Pro Juventute / Action Innocence. Conseille les enquêteurs sur les codes adolescents et la dynamique virale.',
        'fictional': True,
        'tags': ['ACTION-INNOCENCE', 'PREVENTION', 'PRO-JUVENTUTE'],
        'appearances': [],
        'canton': 'GE',
        'category': 'civil',
        'alignment': 'good',
        'seniority': 'intermediate',
        'personality': 'pédagogue, à l\'écoute, militant',
        'relations': []
    },
    'directeur_etablissement_secondaire': {
        'name': 'Pascal Vionnet',
        'role': 'Directeur d\'établissement secondaire',
        'institution': 'DGEO VD — Établissement secondaire',
        'shortBio': 'Directeur d\'établissement secondaire vaudois (collège). Interlocuteur des autorités lors de signalements impliquant des élèves. Coordonne avec les médiateurs, l\'aumônerie et les Services PPLS pour le suivi des situations critiques.',
        'fictional': True,
        'tags': ['DGEO-VD', 'ETABLISSEMENT-SECONDAIRE', 'PROTECTION-MINEUR'],
        'appearances': [],
        'canton': 'VD',
        'category': 'civil',
        'alignment': 'lawful',
        'seniority': 'senior',
        'personality': 'responsable, prudent, soucieux des élèves',
        'relations': []
    },
}


# ─────────────────────────────────────────────────────────────
# BUG #4 — Mapping famille → role + region
# ─────────────────────────────────────────────────────────────

# Format : préfixe d'ID (sans le numéro de scène) → (role, region)
FAMILY_META = {
    'a1-ransomware': ('dfir', 'CH'),       # HRHP — hôpital générique CH, CISO, NCSC
    'a2-encrochat': ('magistrat', 'EU'),   # MP-GE, JIT EncroChat, dossier européen
    'ag-affaire-laufenburg': ('dfir', 'AG'),  # Aargau, infra électrique
    'eau-source-trouble': ('etat', 'VS'),     # Chablais, gouvernance intercommunale
    'ge-affaire-cologny': ('police', 'GE'),   # Genève (Cologny)
    'ge-affaire-iban': ('police', 'GE'),      # POLGE, IBAN spoofing
    'hpm-affaire-eimp': ('magistrat', 'GE'),  # Genève, EIMP entraide
    'supply-maillon-faible': ('dfir', 'CH'),  # Verax Software, CDG parlement
    'vd-affaire-etoile': ('dfir', 'VD'),      # HelvéGaz, OFAC, énergie
    'vd-affaire-vauthier': ('magistrat', 'VD'),  # MP-VD, premier dossier procureur
}


# ─────────────────────────────────────────────────────────────
# BUG #5 — CSS responsive pour tableaux
# ─────────────────────────────────────────────────────────────

CSS_RESPONSIVE_BLOCK = """
/* ─── v132x — Fallback responsif global pour tableaux larges ───
   Sur mobile (≤720px), toutes les <table> deviennent scrollables
   horizontalement (display: block + overflow-x: auto). Évite le
   débordement de page pour les tables 5+ colonnes (90 cas identifiés
   à l'audit du 30 mai 2026). Préfère .table-wrap quand possible
   pour préserver le layout table sur un wrapper dédié.
   ─────────────────────────────────────────────────────────────── */
@media (max-width: 720px) {
  table {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    max-width: 100%;
  }
  table thead, table tbody {
    display: table;
    width: max-content;
    min-width: 100%;
  }
}

/* ─── v132x — prefers-reduced-motion global ───
   Respecte la préférence système de réduction des animations.
   ─────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
"""


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def find_root():
    here = Path(__file__).resolve().parent
    for c in (here, here.parent):
        if (c / 'sw.js').exists() and (c / 'data' / 'manifest.json').exists():
            return c
    print('[error] Racine CAS-IN introuvable.', file=sys.stderr)
    sys.exit(1)


def log(s, m):
    print(f'  {s} {m}')


# ─────────────────────────────────────────────────────────────
# Étapes
# ─────────────────────────────────────────────────────────────

def step_1_fix_sms_blaster(root):
    """BUG #1 : 2 liens cassés dans sms_blaster.html"""
    print('\n[1/7] BUG #1 — Fix des 2 liens cassés dans fiches/sms_blaster.html')
    p = root / 'fiches' / 'sms_blaster.html'
    if not p.exists():
        log('⏭ ', 'fiches/sms_blaster.html absent')
        return
    with open(p, encoding='utf-8') as f:
        content = f.read()
    orig = content

    # Fix 1 : phishing.html n'existe pas → retirer le lien
    content = content.replace(
        '<a href="android_forensique.html" class="prereq-pill">📖 Android forensique</a><a href="phishing.html" class="prereq-pill">📖 Phishing</a>',
        '<a href="android_forensique.html" class="prereq-pill">📖 Android forensique</a>'
    )

    # Fix 2 : parcours-narratif.html → pages/sagas.html
    content = content.replace(
        'href="../parcours-narratif.html?saga=saga-antennes-fantomes-geneve"',
        'href="../pages/sagas.html#saga-antennes-fantomes-geneve"'
    )

    if content == orig:
        log('⏭ ', 'Aucun changement nécessaire')
        return
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)
    log('✅', 'sms_blaster.html : 2 liens fixés')


def step_2_fix_tutoriels_links(root):
    """BUG #2 : 52 liens dans 26 tutoriels"""
    print('\n[2/7] BUG #2 — Fix des liens cassés dans tutoriels/')
    tut_dir = root / 'tutoriels'
    fixed_aliases = 0
    removed_links = 0

    for tf in sorted(tut_dir.glob('*.html')):
        with open(tf, encoding='utf-8') as f:
            content = f.read()
        orig = content
        name = tf.stem

        # Cas 1 — aliases : réécrire vers la bonne fiche
        if name in ALIASES:
            new = ALIASES[name]
            content = content.replace(f'../fiches/{name}.html', f'../fiches/{new}.html')
            if content != orig:
                with open(tf, 'w', encoding='utf-8') as f:
                    f.write(content)
                log('🔄', f'{tf.name} : alias → fiches/{new}.html')
                fixed_aliases += 1
            continue

        # Cas 2 — sans fiche : retirer les liens
        if name in NO_FICHE_TUTOS:
            # Retirer le <a> tn-quiz (en-tête)
            content = re.sub(
                r'<a href="\.\./fiches/' + re.escape(name) + r'\.html"[^>]*class="tn-quiz"[^>]*>[^<]*</a>\s*',
                '',
                content
            )
            # Retirer le <a> "Consulter la fiche" (pied)
            content = re.sub(
                r'<a href="\.\./fiches/' + re.escape(name) + r'\.html"[^>]*style="color:var\(--cyan\)"[^>]*>[^<]*</a>',
                '',
                content
            )
            if content != orig:
                with open(tf, 'w', encoding='utf-8') as f:
                    f.write(content)
                log('🗑️ ', f'{tf.name} : liens vers fiche inexistante retirés')
                removed_links += 1

    if fixed_aliases == 0 and removed_links == 0:
        log('⏭ ', 'Aucun changement (déjà fixé ?)')
    else:
        log('✅', f'{fixed_aliases} aliases réécrits, {removed_links} liens retirés')


def step_3_add_npc_stubs(root):
    """BUG #3 : 14 NPCs stubs"""
    print('\n[3/7] BUG #3 — Ajout des 14 NPCs stubs')
    p = root / 'data' / 'npcs.json'
    with open(p) as f:
        data = json.load(f)
    added = 0
    for nid, ndef in NEW_NPCS.items():
        if nid in data['npcs']:
            log('⏭ ', f'{nid} déjà présent')
        else:
            data['npcs'][nid] = ndef
            added += 1
    if added > 0:
        data['$generated_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
        with open(p, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        log('✅', f'{added} NPCs stubs ajoutés (total: {len(data["npcs"])})')


def step_4_add_role_region(root):
    """BUG #4 : 70 scènes sans role/region"""
    print('\n[4/7] BUG #4 — Ajout role + region aux 70 scènes orphelines')
    scenes_dir = root / 'scenes'
    updated = 0
    skipped = 0
    unhandled = []
    for sf in sorted(scenes_dir.glob('*.json')):
        if sf.name == 'index.json':
            continue
        with open(sf) as f:
            s = json.load(f)
        has_role = bool(s.get('role'))
        has_region = bool(s.get('region') or s.get('regionDetail', {}).get('code'))
        if has_role and has_region:
            continue
        # Détecter la famille
        sid = s.get('id', sf.stem)
        family = None
        for prefix in FAMILY_META:
            if sid.startswith(prefix):
                family = prefix
                break
        if not family:
            unhandled.append(sf.name)
            continue
        role, region = FAMILY_META[family]
        if not has_role:
            s['role'] = role
        if not has_region:
            s['region'] = region
        with open(sf, 'w', encoding='utf-8') as f:
            json.dump(s, f, ensure_ascii=False, indent=2)
        updated += 1
    if updated > 0:
        log('✅', f'{updated} scènes mises à jour avec role + region')
    else:
        log('⏭ ', 'Aucune scène à mettre à jour')
    if unhandled:
        log('⚠️ ', f'{len(unhandled)} scènes non gérées par les mappings :')
        for u in unhandled[:5]:
            log('   ', f'• {u}')


def step_5_css_responsive(root):
    """BUG #5 : tables responsives + prefers-reduced-motion"""
    print('\n[5/7] BUG #5 — CSS responsive global (tables + reduced-motion)')
    css_path = root / 'style' / 'fiche_style.css'
    if not css_path.exists():
        log('⏭ ', 'style/fiche_style.css absent')
        return
    with open(css_path, encoding='utf-8') as f:
        css = f.read()
    if '/* ─── v132x — Fallback responsif global pour tableaux larges ───' in css:
        log('⏭ ', 'CSS v132x déjà injecté')
        return
    new_css = css.rstrip() + '\n' + CSS_RESPONSIVE_BLOCK
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(new_css)
    log('✅', 'CSS v132x ajouté à style/fiche_style.css (+27 lignes)')


def step_6_rebuild_indexes(root):
    """Reconstruire scenes/index.json + counts.json (les nouvelles données role/region)"""
    print('\n[6/7] Reconstruction de scenes/index.json + counts.json')
    import subprocess
    for script in ('build_scenes_index.py', 'generate_counts.py'):
        sp = root / 'scripts' / script
        if not sp.exists():
            log('⏭ ', f'{script} absent')
            continue
        try:
            r = subprocess.run(['python3', str(sp)], cwd=str(root),
                               capture_output=True, text=True, timeout=30)
            if r.returncode == 0:
                log('✅', script)
            else:
                log('⚠️ ', f'{script} code={r.returncode}: {r.stderr[:200]}')
        except Exception as e:
            log('⚠️ ', f'{script}: {e}')


def step_7_bump_sw(root):
    """Bonus : bump SW v147 → v148"""
    print('\n[7/7] Bump SW v147 → v148')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if '// v132x' in sw:
        log('⏭ ', f'SW déjà bumpé en v132x (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v132x — 2026-05-30 — Bump SW v{current} → v{new_v}\n"
        f"// Fixes intégrité : 2 liens cassés sms_blaster, 52 liens cassés\n"
        f"// tutoriels, 14 NPCs stubs, 70 scènes role+region, CSS tables responsives.\n"
        f"// ═══════════════════════════════════════════════════════════════\n"
        f"\n"
        f"const CACHE_VERSION = 'cas-in-v{new_v}';"
    )
    new_sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new_sw)
    log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN v132x — Fixes intégrité (audit complet)')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_fix_sms_blaster(root)
    step_2_fix_tutoriels_links(root)
    step_3_add_npc_stubs(root)
    step_4_add_role_region(root)
    step_5_css_responsive(root)
    step_6_rebuild_indexes(root)
    step_7_bump_sw(root)

    print('\n  ✅ v132x appliqué.')
    print()
    print('  Re-lance l\'audit pour confirmer :')
    print('    - 0 lien HTML cassé')
    print('    - 0 NPC manquant')
    print('    - 0 scène sans role/region')
    print('    - Tables scrollables sur mobile (≤720px)')


if __name__ == '__main__':
    main()
