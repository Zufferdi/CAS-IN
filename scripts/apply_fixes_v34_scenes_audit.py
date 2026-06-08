#!/usr/bin/env python3
"""
apply_fixes_v34_scenes_audit.py — CAS-IN v3.4 (audit scènes & sagas)

Corrections appliquées (idempotent) :
  1. Doublons d'order dans campaigns.json : décale les seconds dans les trous 22, 23, 24
  2. Suppression du champ vestige 'debrey' (valeur vide) dans la scène cologny-3
  3. Suppression du soft hyphen \\u00ad dans la scène swatch-2020-ot
  4. Harmonisation des 3 valeurs `atmosphere` FR isolées vers le vocabulaire EN commun
  5. Création de 23 stubs NPCs minimaux pour les références cassées
  6. Harmonisation des 12 alertLevel format "enum" (high/élevé/critique) en bannières narratives
"""
import json
import re
from pathlib import Path


def find_root() -> Path:
    here = Path(__file__).resolve().parent
    for c in (here, here.parent):
        if (c / "data" / "campaigns.json").exists():
            return c
    raise SystemExit("Racine CAS-IN introuvable.")


# ─────────────────────────────────────────────────────────────────────
# FIX 1 — Doublons d'order dans campaigns.json
# ─────────────────────────────────────────────────────────────────────
ORDER_REASSIGN = {
    'saga-mistral': 22,
    'saga-tavajjoh': 23,
    'saga-cologny-micro-espion': 24,
}

# ─────────────────────────────────────────────────────────────────────
# FIX 4 — Harmonisation atmosphere (vocabulaire EN cohérent)
# ─────────────────────────────────────────────────────────────────────
ATMOSPHERE_REMAP = {
    # ('scene_id', 'old_value') : 'new_value'
    ('ch-affaire-data-brokers-7-bilan-doctrine', 'bilan'): 'investigation',
    ('ch-affaire-data-brokers-6-confrontation-publication', 'exfiltration'): 'investigation',
    ('ge-affaire-antennes-fantomes-7-audience-tco-geneve', 'juridique'): 'audience',
}

# ─────────────────────────────────────────────────────────────────────
# FIX 6 — Harmonisation alertLevel : 12 scènes avec format enum
# ─────────────────────────────────────────────────────────────────────
# Mapping scene_id → bannière narrative (rédigée d'après le titre/intro de chaque scène)
ALERTLEVEL_BANNERS = {
    # 'high' (7 scènes) — vérifier au runtime
    'crypto-ag-rubikon-enquete-dfir-2020': "🌐 RUBIKON RÉVÉLÉ · Crypto AG / CIA-BND 1970-2018 · 130 États espionnés · Enquête historique fédérale ouverte",
    # autres 'high' à compléter par lookup
    'mini-natels-prison-pochwies': "📱 NATELS CLANDESTINS · Prison de Pöschwies · 47 appareils saisis · Atteinte à la sécurité pénitentiaire art. 310 CP",
    'drone-laufenburg-swissgrid-aargau': "🛩️ INTRUSION DRONE · Sous-station Swissgrid Laufenburg · Risque sabotage infrastructure critique · MPC saisi",
    # 'critique' (2)
    # 'élevé' (3)
}

# Les 12 scènes seront détectées au runtime ; on génère le mapping par défaut depuis title

# ─────────────────────────────────────────────────────────────────────
# FIX 5 — Stubs NPCs : 23 personnages manquants
# ─────────────────────────────────────────────────────────────────────
NPC_STUBS = {
    # ─── Saga Tom (vd/tom) — 12 NPCs ───
    'mineur_auteur_defi_tiktok': {
        'id': 'mineur_auteur_defi_tiktok',
        'name': 'Léo M. (15 ans)',
        'fictional': True,
        'icon': '🎮',
        'role': "Mineur auteur du défi TikTok dont Tom T. est la victime",
        'institution': "Établissement secondaire vaudois (anonymisé)",
        'shortBio': "Personnage fictif. Mineur de 15 ans, élève en 10e Harmos, créateur du compte TikTok à l'origine du défi de strangulation devenu viral. Suit la procédure DPMin (LPMin) avec hébergement éducatif et expertise psychiatrique.",
        'expertise': ["Défis viraux TikTok", "Cyber-influence pair-à-pair"],
        'context': "Apparaît dans la saga Tom (vd-affaire-tom-*). Profil typique du mineur impliqué dans un cyberbullying viral, traité par DPMin.",
        'canton': 'VD',
        'category': 'civil',
        'alignment': 'neutral',
        'seniority': 'novice',
    },
    'famille_victime_tom_vd': {
        'id': 'famille_victime_tom_vd',
        'name': 'Famille T. (parents de Tom)',
        'fictional': True,
        'icon': '💔',
        'role': "Parents de la victime — partie civile",
        'institution': "Famille résidente Lausanne",
        'shortBio': "Personnage fictif. Parents de Tom T. (13 ans, décédé), accompagnés par leur avocat de partie plaignante. Plaident pour la responsabilité de TikTok dans la diffusion du défi viral et pour des mesures préventives.",
        'expertise': ["Partie plaignante LAVI", "Témoignage en audience"],
        'context': "Apparaît dans toute la saga Tom (vd-affaire-tom-*). Représente la dimension humaine et civile de l'affaire.",
        'canton': 'VD',
        'category': 'civil',
        'alignment': 'partie_plaignante',
        'seniority': 'novice',
    },
    'pediatre_chuv': {
        'id': 'pediatre_chuv',
        'name': "Dr. C. Reymond",
        'fictional': True,
        'icon': '👨‍⚕️',
        'role': "Pédiatre urgentiste CHUV",
        'institution': "CHUV — Centre Hospitalier Universitaire Vaudois, urgences pédiatriques",
        'shortBio': "Personnage fictif. Pédiatre urgentiste qui a réceptionné Tom T. et constaté le décès. Signalement art. 364 CC + témoin technique sur les constats préliminaires d'asphyxie auto-provoquée.",
        'expertise': ["Urgences pédiatriques", "Constats médico-légaux", "Signalement protection enfance"],
        'context': "Apparaît dans vd-affaire-tom-1 et 3. Premier maillon médical de la chaîne.",
        'canton': 'VD',
        'category': 'health',
        'alignment': 'neutral',
        'seniority': 'expert',
    },
    'mpvd_procureur_mineurs': {
        'id': 'mpvd_procureur_mineurs',
        'name': "Me Sophie Bertholet",
        'fictional': True,
        'icon': '⚖️',
        'role': "Procureure des mineurs — MP-VD",
        'institution': "Ministère public du canton de Vaud, section mineurs (DPMin/PPMin)",
        'shortBio': "Personnage fictif. Procureure spécialisée Droit Pénal des Mineurs (LPMin/PPMin), dirige l'instruction concernant Léo M. et coordonne avec la KAPO-VD jeunesse. Pivot juridique de l'affaire Tom.",
        'expertise': ["LPMin", "PPMin", "Coopération internationale plateformes", "TMC mineurs"],
        'context': "Apparaît dans toute la saga Tom. POV procureur principal de l'affaire.",
        'canton': 'VD',
        'category': 'justice',
        'alignment': 'institutional',
        'seniority': 'expert',
    },
    'kapo_vd_jeunesse_cyber': {
        'id': 'kapo_vd_jeunesse_cyber',
        'name': "Inspecteur P. Rochat",
        'fictional': True,
        'icon': '👮',
        'role': "Inspecteur Police cantonale VD — Brigade jeunesse & cybercriminalité",
        'institution': "Police cantonale vaudoise, Brigade des mineurs et cybercriminalité",
        'shortBio': "Personnage fictif. Inspecteur spécialisé en cyber-investigations sur mineurs auteurs et victimes. Conduit les auditions de Léo M. et l'enquête de proximité dans l'établissement.",
        'expertise': ["Audition de mineurs", "Forensique mobile", "Réseaux sociaux adolescents"],
        'context': "Apparaît dans vd-affaire-tom-1, 5, 6. Bras armé de l'enquête côté police.",
        'canton': 'VD',
        'category': 'police',
        'alignment': 'institutional',
        'seniority': 'expert',
    },
    'medecin_legiste_chuv_pediatrie': {
        'id': 'medecin_legiste_chuv_pediatrie',
        'name': "Dre M. Aellig",
        'fictional': True,
        'icon': '🔬',
        'role': "Médecin légiste pédiatrique — CURML / CHUV",
        'institution': "Centre universitaire romand de médecine légale (CURML), section pédiatrique CHUV",
        'shortBio': "Personnage fictif. Médecin légiste spécialisée en pédiatrie, autopsie de Tom T. Confirme l'asphyxie mécanique compatible avec le défi de strangulation TikTok.",
        'expertise': ["Médecine légale pédiatrique", "Asphyxies mécaniques", "Expertise judiciaire"],
        'context': "Apparaît dans vd-affaire-tom-3 (expertise médicale).",
        'canton': 'VD',
        'category': 'health',
        'alignment': 'neutral',
        'seniority': 'expert',
    },
    'expert_psychiatre_adolescent': {
        'id': 'expert_psychiatre_adolescent',
        'name': "Pr. L. Dubuis",
        'fictional': True,
        'icon': '🧠',
        'role': "Psychiatre expert adolescent — SUPEA",
        'institution': "Service universitaire de psychiatrie de l'enfant et de l'adolescent (SUPEA, CHUV/UNIL)",
        'shortBio': "Personnage fictif. Psychiatre mandatée pour l'expertise de Léo M. (auteur du défi) — capacité de discernement, mesures DPMin appropriées. Témoin technique en audience.",
        'expertise': ["Psychiatrie adolescent", "Expertise judiciaire LPMin", "Capacité de discernement"],
        'context': "Apparaît dans vd-affaire-tom-3 et 5.",
        'canton': 'VD',
        'category': 'health',
        'alignment': 'neutral',
        'seniority': 'expert',
    },
    'tmcvd_juge_dpmin': {
        'id': 'tmcvd_juge_dpmin',
        'name': "Juge F. Pittet",
        'fictional': True,
        'icon': '⚖️',
        'role': "Juge TMC mineurs — Tribunal des mineurs VD",
        'institution': "Tribunal des mineurs du canton de Vaud (TMC DPMin)",
        'shortBio': "Personnage fictif. Juge des mineurs vaudois, statue sur les mesures de protection et les mandats relatifs à Léo M. (PPMin, hébergement éducatif).",
        'expertise': ["LPMin", "PPMin", "Mesures de protection"],
        'context': "Apparaît dans vd-affaire-tom-5 (audition + mesures DPMin).",
        'canton': 'VD',
        'category': 'justice',
        'alignment': 'institutional',
        'seniority': 'expert',
    },
    'tiktok_eu_liaison': {
        'id': 'tiktok_eu_liaison',
        'name': "M. Aoife O'Reilly",
        'fictional': True,
        'icon': '📱',
        'role': "Liaison Law Enforcement — TikTok EMEA (Dublin)",
        'institution': "TikTok Technology Ltd, Dublin (EMEA HQ)",
        'shortBio': "Personnage fictif. Point de contact officiel TikTok EMEA pour les autorités judiciaires européennes. Coordonne les demandes de préservation et les retraits d'urgence (LERA / DSA art. 9/10).",
        'expertise': ["DSA EU", "MLAT US", "Préservation contenus plateforme"],
        'context': "Apparaît dans vd-affaire-tom-4 et 7. Pivot procédural plateforme.",
        'canton': 'EU',
        'category': 'corporate',
        'alignment': 'institutional',
        'seniority': 'expert',
    },
    'tiktok_trust_safety_eu': {
        'id': 'tiktok_trust_safety_eu',
        'name': "Équipe Trust & Safety EMEA — TikTok",
        'fictional': True,
        'icon': '🛡️',
        'role': "Équipe Trust & Safety — TikTok EMEA",
        'institution': "TikTok Trust & Safety, Dublin",
        'shortBio': "Personnage fictif (entité collective). Équipe responsable du moderation algorithmique et humain, des content removals d'urgence et de la coopération avec EU regulators (DSA, AVMSD).",
        'expertise': ["Modération de contenus", "DSA EU", "Algorithmic accountability"],
        'context': "Apparaît dans vd-affaire-tom-4.",
        'canton': 'EU',
        'category': 'corporate',
        'alignment': 'institutional',
        'seniority': 'intermediate',
    },
    'directeur_etablissement_secondaire': {
        'id': 'directeur_etablissement_secondaire',
        'name': "M. R. Magnenat",
        'fictional': True,
        'icon': '🏫',
        'role': "Directeur d'établissement secondaire",
        'institution': "Établissement secondaire vaudois (Lausanne, anonymisé)",
        'shortBio': "Personnage fictif. Directeur de l'établissement où Tom T. et Léo M. étaient scolarisés. Témoin sur le climat scolaire et l'absence de signalement préalable de cyberbullying.",
        'expertise': ["Gestion d'établissement", "Climat scolaire", "Liaison DGEO"],
        'context': "Apparaît dans vd-affaire-tom-2 ou 5.",
        'canton': 'VD',
        'category': 'civil',
        'alignment': 'neutral',
        'seniority': 'expert',
    },
    'cyberbulling_referent': {
        'id': 'cyberbulling_referent',
        'name': "Mme S. Volet",
        'fictional': True,
        'icon': '📚',
        'role': "Référente cyberbullying — DGEO Vaud",
        'institution': "Direction générale de l'enseignement obligatoire (DGEO), canton de Vaud",
        'shortBio': "Personnage fictif. Référente cantonale prévention cyberbullying dans les écoles obligatoires VD. Intervient en post-incident pour cadrer la communication aux camarades et aux familles.",
        'expertise': ["Prévention cyberbullying", "DGEO", "Communication post-incident scolaire"],
        'context': "Apparaît dans vd-affaire-tom-2 ou 6.",
        'canton': 'VD',
        'category': 'civil',
        'alignment': 'institutional',
        'seniority': 'expert',
    },

    # ─── Antennes fantômes (ge/antennes) — 8 NPCs ───
    'procureur_mp_ge_cybercrime': {
        'id': 'procureur_mp_ge_cybercrime',
        'name': "Me Catherine Wenger",
        'fictional': True,
        'icon': '⚖️',
        'role': "Procureure — MP-GE section cybercriminalité",
        'institution': "Ministère public du canton de Genève, section cybercriminalité",
        'shortBio': "Personnage fictif. Procureure cybercriminalité du MP-GE, dirige l'instruction sur les antennes fantômes (IMSI catchers mobiles) et coordonne avec OFCOM et l'inspectrice BCFI.",
        'expertise': ["Cybercriminalité", "Art. 271 CP", "LSCPT", "Coordination OFCOM"],
        'context': "Apparaît dans toute la saga Antennes Fantômes (ge-affaire-antennes-fantomes-*).",
        'canton': 'GE',
        'category': 'justice',
        'alignment': 'institutional',
        'seniority': 'expert',
    },
    'inspectrice_brigade_financiere_ge': {
        'id': 'inspectrice_brigade_financiere_ge',
        'name': "Inspectrice principale Léa Robert",
        'fictional': True,
        'icon': '👩‍💼',
        'role': "Inspectrice principale — BCFI Genève",
        'institution': "Brigade financière et cyber-investigation (BCFI), Police judiciaire genevoise",
        'shortBio': "Personnage fictif. Inspectrice principale BCFI, mène l'enquête de terrain sur les SMS Blaster mobiles. POV principal de la saga Antennes Fantômes côté police.",
        'expertise': ["Forensique mobile", "Investigation cybercrime", "Coordination MP-GE"],
        'context': "Apparaît dans plusieurs scènes ge-affaire-antennes-fantomes-* et ge-affaire-nog7-*.",
        'canton': 'GE',
        'category': 'police',
        'alignment': 'institutional',
        'seniority': 'expert',
    },
    'juge_tmc_ge_perquisition': {
        'id': 'juge_tmc_ge_perquisition',
        'name': "Juge Catherine Wenger (TMC)",
        'fictional': True,
        'icon': '⚖️',
        'role': "Juge TMC — Tribunal des mesures de contrainte GE",
        'institution': "Tribunal des mesures de contrainte du canton de Genève (TMC)",
        'shortBio': "Personnage fictif. Préside la chambre TMC, statue sur les autorisations de mesures de surveillance (art. 269 CPP) et perquisitions complexes.",
        'expertise': ["Art. 269 CPP", "Art. 269bis CPP", "Mandats TMC"],
        'context': "Apparaît dans ge-affaire-antennes-fantomes-3 (autorisation triangulation RF).",
        'canton': 'GE',
        'category': 'justice',
        'alignment': 'institutional',
        'seniority': 'expert',
    },
    'ofcom_spectrum_lead_be': {
        'id': 'ofcom_spectrum_lead_be',
        'name': "M. Markus Brunner",
        'fictional': True,
        'icon': '📡',
        'role': "Responsable surveillance du spectre — OFCOM Berne",
        'institution': "Office fédéral de la communication (OFCOM), Bienne/Berne — division spectre radioélectrique",
        'shortBio': "Personnage fictif. Responsable OFCOM pour la surveillance du spectre radioélectrique, coordonne avec la police cantonale GE la triangulation RF des SMS Blaster mobiles (LTC, OFAC).",
        'expertise': ["Loi sur les télécommunications (LTC)", "Surveillance spectre", "OFAC", "Triangulation RF"],
        'context': "Apparaît dans plusieurs scènes ge-affaire-antennes-fantomes-* (volet télécom).",
        'canton': 'BE',
        'category': 'state',
        'alignment': 'institutional',
        'seniority': 'expert',
    },
    'tech_scpt_interception': {
        'id': 'tech_scpt_interception',
        'name': "Marc Vauthier",
        'fictional': True,
        'icon': '🔧',
        'role': "Technicien interception — SCPT",
        'institution': "Service de surveillance de la correspondance par poste et télécommunication (SCPT/ÜPF), Berne",
        'shortBio': "Personnage fictif. Technicien SCPT spécialisé interceptions LSCPT. Témoin technique en TMC sur la faisabilité des mesures de surveillance pour les antennes fantômes.",
        'expertise': ["LSCPT", "Interceptions techniques", "Témoignage TMC"],
        'context': "Apparaît dans ge-affaire-antennes-fantomes-3 (audition TMC).",
        'canton': 'BE',
        'category': 'state',
        'alignment': 'institutional',
        'seniority': 'expert',
    },
    'ingenieur_swisscom_security': {
        'id': 'ingenieur_swisscom_security',
        'name': "Mme Tatiana Müller",
        'fictional': True,
        'icon': '📶',
        'role': "Ingénieure sécurité réseau — Swisscom",
        'institution': "Swisscom (Suisse) SA — division sécurité réseau mobile",
        'shortBio': "Personnage fictif. Ingénieure Swisscom spécialisée détection d'anomalies CGI (Cell Global Identity). Coopère avec la police pour identifier les fausses BTS sur Genève.",
        'expertise': ["Réseau mobile 4G/5G", "Détection IMSI catcher", "Forensique télécom"],
        'context': "Apparaît dans ge-affaire-antennes-fantomes-3 et 4.",
        'canton': 'BE',
        'category': 'corporate',
        'alignment': 'institutional',
        'seniority': 'expert',
    },
    'forensicien_for_ge': {
        'id': 'forensicien_for_ge',
        'name': "Dr. Pascal Hovasse",
        'fictional': True,
        'icon': '🔬',
        'role': "Forensicien — FOR-GE (Service de forensique police GE)",
        'institution': "Service de forensique de la police judiciaire genevoise (FOR-GE)",
        'shortBio': "Personnage fictif. Forensicien numérique FOR-GE, en charge des analyses des 9 téléphones saisis pendant la flagrance Antennes Fantômes (extraction Cellebrite UFED, timeline).",
        'expertise': ["Mobile forensics", "Cellebrite UFED", "Cell tower data", "Reverse engineering RF"],
        'context': "Apparaît dans ge-affaire-antennes-fantomes-4, 5, 6.",
        'canton': 'GE',
        'category': 'police',
        'alignment': 'institutional',
        'seniority': 'expert',
    },
    'avocat_defense_carouge_lj': {
        'id': 'avocat_defense_carouge_lj',
        'name': "Me Laurent Juliot",
        'fictional': True,
        'icon': '👨‍💼',
        'role': "Avocat de la défense — barreau de Genève",
        'institution': "Étude Juliot & Associés, Carouge (GE) — droit pénal des affaires et cybercriminalité",
        'shortBio': "Personnage fictif. Avocat de la défense du prévenu principal Antennes Fantômes. Plaide en audience TCO sur la qualification (art. 271 CP, LSCPT, art. 143bis CP) et les garanties procédurales.",
        'expertise': ["Droit pénal cyber", "Garanties procédurales CPP", "Art. 271 CP"],
        'context': "Apparaît dans ge-affaire-antennes-fantomes-7 (audience TCO).",
        'canton': 'GE',
        'category': 'justice',
        'alignment': 'partie_defense',
        'seniority': 'expert',
    },

    # ─── Republik média — 2 NPCs ───
    'journaliste_republik_lea': {
        'id': 'journaliste_republik_lea',
        'name': "Léa Andermatt",
        'fictional': True,
        'icon': '📰',
        'role': "Journaliste investigation — Republik",
        'institution': "Republik (média indépendant en ligne, Zurich)",
        'shortBio': "Personnage fictif. Journaliste d'investigation senior à Republik, spécialisée dans les enquêtes politiques et corporate fédérales (lobby parlementaire, dossiers nucléaires Beznau). Coordonne avec les consortiums OCCRP/ICIJ.",
        'expertise': ["Journalisme d'investigation", "Lobby parlementaire CH", "Sources whistleblower"],
        'context': "Apparaît dans plusieurs sagas journalistiques (be-affaire-lobby-*, ag-affaire-beznau-*).",
        'canton': 'ZH',
        'category': 'media',
        'alignment': 'neutral',
        'seniority': 'expert',
    },
    'redaction_republik_constantin': {
        'id': 'redaction_republik_constantin',
        'name': "Constantin Seibt",
        'fictional': True,
        'icon': '📰',
        'role': "Rédacteur en chef — Republik",
        'institution': "Republik (média indépendant en ligne, Zurich)",
        'shortBio': "Personnage fictif. Rédacteur en chef Republik. Valide les angles éditoriaux, encadre la déontologie (CSP/CRP), arbitre les conflits sources vs publication.",
        'expertise': ["Direction éditoriale", "Déontologie médias suisses", "Droit de réponse"],
        'context': "Apparaît dans les mêmes sagas que journaliste_republik_lea.",
        'canton': 'ZH',
        'category': 'media',
        'alignment': 'neutral',
        'seniority': 'expert',
    },

    # ─── Sarine (fr/sarine) — 1 NPC ───
    'fr_lawyer_cyber': {
        'id': 'fr_lawyer_cyber',
        'name': "Me Bénédicte Riou",
        'fictional': True,
        'icon': '👩‍⚖️',
        'role': "Avocate cyber — Barreau de Paris (France)",
        'institution': "Cabinet Riou & Partners, Paris — droit pénal cyber",
        'shortBio': "Personnage fictif. Avocate française spécialisée en cybercriminalité transfrontalière, intervient en défense lors de l'audience de recevabilité française dans l'affaire Sarine (volet français).",
        'expertise': ["Procédure pénale française", "Cybercriminalité transfrontalière", "Coopération CH-FR"],
        'context': "Apparaît dans fr-affaire-sarine-5 (audience recevabilité française).",
        'canton': 'EU',
        'category': 'justice',
        'alignment': 'partie_defense',
        'seniority': 'expert',
    },
}


def fix_campaigns_orders(root: Path) -> int:
    """Corrige les doublons d'order dans campaigns.json."""
    cpath = root / "data" / "campaigns.json"
    data = json.loads(cpath.read_text(encoding='utf-8'))
    n_changed = 0
    for c in data['campaigns']:
        if c['id'] in ORDER_REASSIGN:
            new_order = ORDER_REASSIGN[c['id']]
            if c.get('order') != new_order:
                old = c.get('order')
                c['order'] = new_order
                n_changed += 1
                print(f"  ✓ campaigns.json: {c['id']} order {old} → {new_order}")
    if n_changed:
        cpath.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return n_changed


def fix_debrey_typo(root: Path) -> int:
    """Supprime le champ vestige 'debrey' dans la scène cologny-3."""
    spath = root / "scenes" / "ge-affaire-cologny-3-analyse-hardware.json"
    sc = json.loads(spath.read_text(encoding='utf-8'))
    if 'debrey' in sc:
        del sc['debrey']
        spath.write_text(json.dumps(sc, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f"  ✓ scenes/ge-affaire-cologny-3-analyse-hardware.json: champ 'debrey' supprimé")
        return 1
    return 0


def fix_soft_hyphen(root: Path) -> int:
    """Retire les soft hyphens \\u00ad dans swatch-2020-ot."""
    spath = root / "scenes" / "swatch-2020-ot.json"
    if not spath.exists():
        return 0
    txt = spath.read_text(encoding='utf-8')
    if '\u00ad' in txt:
        new_txt = txt.replace('\u00ad', '')
        spath.write_text(new_txt, encoding='utf-8')
        print(f"  ✓ scenes/swatch-2020-ot.json: soft hyphens \\u00ad supprimés")
        return 1
    return 0


def fix_atmospheres(root: Path) -> int:
    """Harmonise les 3 atmospheres FR isolées vers vocabulaire EN."""
    n = 0
    for (sid, _old), new_val in ATMOSPHERE_REMAP.items():
        spath = root / "scenes" / f"{sid}.json"
        if not spath.exists():
            continue
        sc = json.loads(spath.read_text(encoding='utf-8'))
        cur = sc.get('atmosphere')
        if cur != new_val and cur in [k[1] for k in ATMOSPHERE_REMAP if k[0] == sid]:
            old_val = cur
            sc['atmosphere'] = new_val
            spath.write_text(json.dumps(sc, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            print(f"  ✓ {sid}: atmosphere '{old_val}' → '{new_val}'")
            n += 1
    return n


def fix_alertlevels(root: Path) -> int:
    """Convertit les 12 scènes avec alertLevel format enum en bannières narratives."""
    scenes_dir = root / "scenes"
    n_changed = 0
    enum_values = {'high', 'élevé', 'critique'}
    for f in sorted(scenes_dir.iterdir()):
        if not f.name.endswith('.json') or f.name == 'index.json':
            continue
        sc = json.loads(f.read_text(encoding='utf-8'))
        al = sc.get('alertLevel')
        if al in enum_values:
            # Construire une bannière depuis le titre + tags
            title = sc.get('title', '')
            tags = sc.get('tags', [])
            # Sélectionner emoji selon difficulté + atmosphere
            atm = sc.get('atmosphere', 'investigation')
            emoji_map = {
                'incident': '🚨', 'raid': '🚪', 'investigation': '🔍',
                'legal': '⚖️', 'audience': '🏛️', 'state': '🇨🇭',
                'hospital': '🏥', 'crypto': '🔐', 'network': '🌐',
            }
            emoji = emoji_map.get(atm, '🚨')
            # Pour 'critique' / 'élevé' on garde une intensité forte
            if al == 'critique':
                emoji = '🚨🚨'
            # Titre court (extraire après "#N — " si présent)
            short_title = title
            if ' — ' in title:
                short_title = title.split(' — ', 1)[1][:60]
            elif ' #' in title and ' — ' in title:
                short_title = title.split(' — ', 1)[1][:60]
            else:
                short_title = title[:60]
            # Top 2 tags
            tag_str = ' · '.join(tags[:2]) if tags else atm.upper()
            banner = f"{emoji} {short_title.upper()} · {tag_str}"
            # Limite à 140 chars (lisibilité bannière)
            banner = banner[:140]
            sc['alertLevel'] = banner
            f.write_text(json.dumps(sc, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            print(f"  ✓ {f.stem}: '{al}' → bannière")
            n_changed += 1
    return n_changed


def create_npc_stubs(root: Path) -> int:
    """Ajoute les 23 stubs NPCs dans data/npcs.json."""
    npath = root / "data" / "npcs.json"
    ndata = json.loads(npath.read_text(encoding='utf-8'))
    npcs = ndata.get('npcs', {})
    n_added = 0
    for nid, stub in NPC_STUBS.items():
        if nid in npcs:
            continue
        npcs[nid] = stub
        n_added += 1
    ndata['npcs'] = npcs
    npath.write_text(json.dumps(ndata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"  ✓ data/npcs.json: {n_added} stubs ajoutés (sur 23 attendus)")
    return n_added


def main():
    root = find_root()
    print(f"[info] Racine : {root}\n")

    print("FIX 1 — Doublons d'order dans campaigns.json")
    fix_campaigns_orders(root)

    print("\nFIX 2 — Champ vestige 'debrey'")
    fix_debrey_typo(root)

    print("\nFIX 3 — Soft hyphens dans swatch-2020-ot")
    fix_soft_hyphen(root)

    print("\nFIX 4 — Harmonisation atmosphere (FR → EN)")
    fix_atmospheres(root)

    print("\nFIX 5 — Stubs NPCs (23 personnages manquants)")
    create_npc_stubs(root)

    print("\nFIX 6 — Bannières alertLevel narratives (12 scènes)")
    fix_alertlevels(root)


if __name__ == "__main__":
    main()
