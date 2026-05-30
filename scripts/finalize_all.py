#!/usr/bin/env python3
"""
finalize_all_selfcontained.py — CAS-IN v132u-bis

Version self-contained du bundle de finalisation : tous les data (8 NPCs,
campagne saga, CSP, CHANGELOG, manifest) sont inline dans ce fichier.
Ne dépend que de ce script + du repo CAS-IN.
Aucun dossier _v132u_resources/ requis.

À placer dans scripts/ et lancer depuis la racine du repo :
    python3 scripts/finalize_all_selfcontained.py

Idempotent : ré-exécutable sans effet de bord.

Étapes :
  1. Ajout des 8 NPCs de la saga Antennes Fantômes
  2. Ajout de la campagne saga dans data/campaigns.json
  3. Ajout des entrées chronologie
  4. Mise à jour de data/manifest.json (sms_blaster.html)
  5. Patch CSP sur artifacts.html + fiches/index.html (bugs v132l)
  6. Bump SW v144 → v145
  7. Insertion section [3.0.1] dans docs/CHANGELOG.md
  8. Reconstruction de scenes/index.json + counts.json
"""
import json
import os
import re
import sys
import subprocess
from pathlib import Path
from datetime import datetime, timezone


# ─────────────────────────────────────────────────────────────
# DATA EN DUR — 8 NPCs (literal Python dict)
# ─────────────────────────────────────────────────────────────

NEW_NPCS = {'ofcom_spectrum_lead_be': {'name': 'Dr. Élise Schmid',
                            'role': 'Cheffe de section Spectrum Monitoring · OFCOM (Office fédéral de la '
                                    'communication)',
                            'institution': 'OFCOM, Biel/Bienne. Section surveillance du spectre radio + autorité de '
                                           'concession (art. 22 LTC). Coordonne avec MELANI/NCSC pour les incidents '
                                           'touchant les télécoms.',
                            'shortBio': 'Personnage fictif. Ingénieure RF, ETHZ Communication Engineering 2008, MAS '
                                        "GovTech 2015. 14 ans à l'OFCOM dont 8 sur le monitoring du spectre. Pilote "
                                        "l'équipe qui exploite les sondes Rohde&Schwarz mobiles et la coopération avec "
                                        "les opérateurs (Swisscom, Sunrise, Salt). Spécialité : détection d'émetteurs "
                                        'illicites (brouilleurs, fausses cellules, drones). Bilingue DE/FR. Méfiante '
                                        "des médias depuis l'affaire des brouilleurs GPS du WEF 2018.",
                            'fictional': True,
                            'tags': ['ofcom',
                                     'spectrum-monitoring',
                                     'rf',
                                     'sdr',
                                     'imsi-catcher',
                                     'sms-blaster',
                                     'biel-bienne',
                                     'be'],
                            'appearances': ['ge-affaire-antennes-fantomes-2-vague-correlee',
                                            'ge-affaire-antennes-fantomes-3-piste-telecom',
                                            'ge-affaire-antennes-fantomes-7-audience-tco-geneve'],
                            'canton': 'BE',
                            'category': 'regulator',
                            'alignment': 'lawful',
                            'seniority': 'senior',
                            'personality': {'communication': 'formel',
                                            'tech_level': 'expert',
                                            'stress_response': 'calme',
                                            'trust_initial': 'neutre'},
                            'relations': [{'with': 'ncsc_govcert_lead',
                                           'type': 'collègue',
                                           'cooccurrences': 1,
                                           'trust_init': 'high'},
                                          {'with': 'procureur_mp_ge_cybercrime',
                                           'type': 'connaissance',
                                           'cooccurrences': 1,
                                           'trust_init': 'medium'},
                                          {'with': 'inspectrice_brigade_financiere_ge',
                                           'type': 'collègue',
                                           'cooccurrences': 1,
                                           'trust_init': 'medium'},
                                          {'with': 'ingenieur_swisscom_security',
                                           'type': 'collègue',
                                           'cooccurrences': 1,
                                           'trust_init': 'high'}]},
 'procureur_mp_ge_cybercrime': {'name': 'Maître Pierre-Olivier Reymond',
                                'role': 'Premier procureur · Cellule cybercrime du Ministère public du canton de '
                                        'Genève',
                                'institution': 'Ministère public, route de Chancy, Genève. Section économique et '
                                               'financière, spécialisée cybercriminalité depuis 2019. Coopère '
                                               'étroitement avec la Brigade financière de la police judiciaire '
                                               'genevoise.',
                                'shortBio': "Personnage fictif. Avocat Uni Genève 2002, juge d'instruction puis "
                                            'procureur depuis 2010. A piloté plusieurs dossiers de phishing bancaire '
                                            "majeur (notamment l'affaire des faux Crédit Suisse de 2021). Méthodique, "
                                            'ne classe jamais une plainte sans avoir vérifié les corrélations '
                                            "possibles. Connaît le CPP par cœur, surtout l'art. 269 et la "
                                            'jurisprudence sur les preuves illicites (art. 141).',
                                'fictional': True,
                                'tags': ['procureur', 'ministere-public', 'cybercrime', 'geneve', 'ge'],
                                'appearances': ['ge-affaire-antennes-fantomes-1-signal-alarme',
                                                'ge-affaire-antennes-fantomes-2-vague-correlee',
                                                'ge-affaire-antennes-fantomes-4-reperage-rf',
                                                'ge-affaire-antennes-fantomes-6-cooperation-internationale',
                                                'ge-affaire-antennes-fantomes-7-audience-tco-geneve'],
                                'canton': 'GE',
                                'category': 'magistrat',
                                'alignment': 'lawful',
                                'seniority': 'senior',
                                'personality': {'communication': 'formel',
                                                'tech_level': 'intermédiaire',
                                                'stress_response': 'calme',
                                                'trust_initial': 'neutre'},
                                'relations': [{'with': 'ofcom_spectrum_lead_be',
                                               'type': 'connaissance',
                                               'cooccurrences': 1,
                                               'trust_init': 'medium'},
                                              {'with': 'inspectrice_brigade_financiere_ge',
                                               'type': 'collègue',
                                               'cooccurrences': 2,
                                               'trust_init': 'high'},
                                              {'with': 'juge_tmc_ge_perquisition',
                                               'type': 'collègue',
                                               'cooccurrences': 1,
                                               'trust_init': 'high'},
                                              {'with': 'avocat_defense_carouge_lj',
                                               'type': 'rival',
                                               'cooccurrences': 1,
                                               'trust_init': 'low'}]},
 'inspectrice_brigade_financiere_ge': {'name': 'Inspectrice Léa Dubuis',
                                       'role': 'Inspectrice principale · Brigade financière de la police judiciaire '
                                               'genevoise · Spécialiste cybercrime',
                                       'institution': 'Police judiciaire genevoise, Carl-Vogt, Genève. Brigade '
                                                      'financière (BFin), cellule cybercrime depuis 2020. Référente '
                                                      'nationale pour les fraudes bancaires impliquant '
                                                      'phishing/smishing.',
                                       'shortBio': 'Personnage fictif. HEG Genève 2014 (informatique de gestion), '
                                                   'formation ISFC, ESDFI. 9 ans police, dont 5 en cybercrime. A formé '
                                                   'une équipe de 6 inspecteurs spécialisés smishing/vishing depuis la '
                                                   'vague PostFinance 2023. Approche méthodique : corrélation des '
                                                   'plaintes, cartographie temporelle, OSINT sur les domaines de '
                                                   'phishing. Anglophone, lit le russe avec dictionnaire.',
                                       'fictional': True,
                                       'tags': ['police-judiciaire',
                                                'brigade-financiere',
                                                'cybercrime',
                                                'smishing',
                                                'geneve',
                                                'ge'],
                                       'appearances': ['ge-affaire-antennes-fantomes-2-vague-correlee',
                                                       'ge-affaire-antennes-fantomes-4-reperage-rf',
                                                       'ge-affaire-antennes-fantomes-5-perquisition-forensique'],
                                       'canton': 'GE',
                                       'category': 'police',
                                       'alignment': 'lawful',
                                       'seniority': 'senior',
                                       'personality': {'communication': 'direct',
                                                       'tech_level': 'expert',
                                                       'stress_response': 'calme',
                                                       'trust_initial': 'neutre'},
                                       'relations': [{'with': 'procureur_mp_ge_cybercrime',
                                                      'type': 'collègue',
                                                      'cooccurrences': 2,
                                                      'trust_init': 'high'},
                                                     {'with': 'ofcom_spectrum_lead_be',
                                                      'type': 'collègue',
                                                      'cooccurrences': 1,
                                                      'trust_init': 'medium'},
                                                     {'with': 'tech_scpt_interception',
                                                      'type': 'collègue',
                                                      'cooccurrences': 1,
                                                      'trust_init': 'high'},
                                                     {'with': 'forensicien_for_ge',
                                                      'type': 'collègue',
                                                      'cooccurrences': 1,
                                                      'trust_init': 'high'}]},
 'juge_tmc_ge_perquisition': {'name': 'Juge Catherine Wenger',
                              'role': 'Juge du Tribunal des mesures de contrainte (TMC) · Genève',
                              'institution': 'Tribunal des mesures de contrainte, Palais de justice, Genève. Compétent '
                                             'pour autoriser les mesures de surveillance secrète (art. 269 CPP) et les '
                                             'perquisitions (art. 244 CPP) avant audience pénale.',
                              'shortBio': 'Personnage fictif. Magistrate depuis 2008, présidente de la chambre TMC '
                                          'depuis 2021. Connue pour son exigence sur les éléments concrets : refuse '
                                          'les demandes basées sur des hypothèses RF non corrélées à un acte '
                                          'délictueux. Demande systématiquement le rapport OFCOM en pièce jointe pour '
                                          'les affaires touchant les télécoms.',
                              'fictional': True,
                              'tags': ['tribunal', 'tmc', 'mesures-contrainte', 'geneve', 'ge', 'juge'],
                              'appearances': ['ge-affaire-antennes-fantomes-3-piste-telecom',
                                              'ge-affaire-antennes-fantomes-4-reperage-rf'],
                              'canton': 'GE',
                              'category': 'magistrat',
                              'alignment': 'lawful',
                              'seniority': 'senior',
                              'personality': {'communication': 'formel',
                                              'tech_level': 'intermédiaire',
                                              'stress_response': 'calme',
                                              'trust_initial': 'neutre'},
                              'relations': [{'with': 'procureur_mp_ge_cybercrime',
                                             'type': 'collègue',
                                             'cooccurrences': 1,
                                             'trust_init': 'high'},
                                            {'with': 'inspectrice_brigade_financiere_ge',
                                             'type': 'connaissance',
                                             'cooccurrences': 1,
                                             'trust_init': 'medium'}]},
 'avocat_defense_carouge_lj': {'name': 'Maître Laurent Jacottet',
                               'role': 'Avocat de la défense · Étude Jacottet & associés, Carouge',
                               'institution': 'Étude Jacottet & associés, rue Saint-Joseph, Carouge. Spécialisée droit '
                                              'pénal et cybercriminalité depuis 2015. Représente le prévenu principal '
                                              "(technicien télécom suisse) dans l'affaire des Antennes Fantômes.",
                               'shortBio': "Personnage fictif. Brevet d'avocat 2012, MAS droit pénal Unil 2016. "
                                           "Spécialiste reconnu de l'art. 141 CPP (preuves illicites) — a fait casser "
                                           'plusieurs surveillances secrètes par défaut de motivation. Plaide '
                                           'énergiquement, ne cède rien. A formé un cabinet jeune autour de défenses '
                                           'techniques (cybercrime, escroqueries complexes). Détestation cordiale avec '
                                           "le procureur Reymond depuis l'affaire CS 2021.",
                               'fictional': True,
                               'tags': ['avocat', 'defense', 'droit-penal', 'art-141-cpp', 'carouge', 'ge'],
                               'appearances': ['ge-affaire-antennes-fantomes-7-audience-tco-geneve'],
                               'canton': 'GE',
                               'category': 'avocat',
                               'alignment': 'neutral',
                               'seniority': 'senior',
                               'personality': {'communication': 'direct',
                                               'tech_level': 'intermédiaire',
                                               'stress_response': 'agressif',
                                               'trust_initial': 'méfiant'},
                               'relations': [{'with': 'procureur_mp_ge_cybercrime',
                                              'type': 'rival',
                                              'cooccurrences': 1,
                                              'trust_init': 'low'}]},
 'tech_scpt_interception': {'name': 'Marc Vauthier',
                            'role': 'Ingénieur · SCPT (Service de surveillance de la correspondance par poste et '
                                    'télécommunication)',
                            'institution': 'SCPT, Berne. Service technique fédéral qui exécute les mesures de '
                                           'surveillance des télécoms ordonnées par les autorités pénales cantonales '
                                           '(LSCPT).',
                            'shortBio': 'Personnage fictif. EPFL Communication Systems 2010, SCPT depuis 2012. A monté '
                                        "la cellule LTE/5G monitoring. Connaît les protocoles d'interception légale "
                                        '(LI) et les interfaces opérateurs. Discret, peu visible, mais indispensable. '
                                        'Travaille avec OFCOM et fedpol sur les dossiers techniques.',
                            'fictional': True,
                            'tags': ['scpt', 'lscpt', 'interception', 'lte', '5g', 'berne', 'be'],
                            'appearances': ['ge-affaire-antennes-fantomes-3-piste-telecom',
                                            'ge-affaire-antennes-fantomes-4-reperage-rf'],
                            'canton': 'BE',
                            'category': 'regulator',
                            'alignment': 'lawful',
                            'seniority': 'senior',
                            'personality': {'communication': 'formel',
                                            'tech_level': 'expert',
                                            'stress_response': 'calme',
                                            'trust_initial': 'neutre'},
                            'relations': [{'with': 'ofcom_spectrum_lead_be',
                                           'type': 'collègue',
                                           'cooccurrences': 1,
                                           'trust_init': 'high'},
                                          {'with': 'inspectrice_brigade_financiere_ge',
                                           'type': 'collègue',
                                           'cooccurrences': 1,
                                           'trust_init': 'high'}]},
 'forensicien_for_ge': {'name': 'Cdt. Mathieu Reverchon',
                        'role': 'Commandant · Section forensique numérique de la police judiciaire genevoise (FOR '
                                'Genève)',
                        'institution': 'Police judiciaire genevoise, section FOR (forensique numérique). Plateforme '
                                       "d'analyse forensique cantonale, certifiée ENFSI, équipée "
                                       'FTK/Autopsy/Cellebrite/Magnet AXIOM.',
                        'shortBio': 'Personnage fictif. EPFL Comm Systems 2003, certifications GCFA/GREM/GASF. 16 ans '
                                    "en forensique numérique, dont 11 à GE. A piloté l'analyse de plusieurs ransomware "
                                    'majeurs en Suisse romande (CHUV 2022, Banque cantonale jurassienne 2024). '
                                    'Méticuleux sur la chaîne de garde — refuse de traiter un disque sans hash '
                                    "MD5/SHA-256 documenté en présence d'un témoin.",
                        'fictional': True,
                        'tags': ['forensique', 'police-judiciaire', 'for-geneve', 'dfir', 'geneve', 'ge'],
                        'appearances': ['ge-affaire-antennes-fantomes-5-perquisition-forensique',
                                        'ge-affaire-antennes-fantomes-6-cooperation-internationale'],
                        'canton': 'GE',
                        'category': 'police',
                        'alignment': 'lawful',
                        'seniority': 'senior',
                        'personality': {'communication': 'formel',
                                        'tech_level': 'expert',
                                        'stress_response': 'calme',
                                        'trust_initial': 'neutre'},
                        'relations': [{'with': 'inspectrice_brigade_financiere_ge',
                                       'type': 'collègue',
                                       'cooccurrences': 1,
                                       'trust_init': 'high'},
                                      {'with': 'procureur_mp_ge_cybercrime',
                                       'type': 'collègue',
                                       'cooccurrences': 1,
                                       'trust_init': 'medium'}]},
 'ingenieur_swisscom_security': {'name': 'Diego Furrer',
                                 'role': 'Senior Security Engineer · Swisscom Security (CSIRT mobile networks)',
                                 'institution': 'Swisscom Security, Bern. CSIRT spécialisé sécurité réseaux mobiles. '
                                                "Détection d'anomalies cellulaires, monitoring CGI (Cell Global "
                                                'Identifier), coopération autorités sur surveillance légale.',
                                 'shortBio': 'Personnage fictif. HSLU Lucerne Telecom 2011, OSCP 2018, GMOB 2021. 12 '
                                             'ans Swisscom, dont 7 sur la sécurité mobile. A développé en interne une '
                                             'plateforme de détection des cellules non-déclarées ("rogue cell '
                                             'detection") en se basant sur les anomalies CGI/PLMN/TAC. Communique '
                                             'régulièrement avec MELANI/NCSC, OFCOM, et la SCPT pour les incidents '
                                             'techniques.',
                                 'fictional': True,
                                 'tags': ['swisscom', 'csirt', 'telecom-security', 'rogue-cell-detection', 'be'],
                                 'appearances': ['ge-affaire-antennes-fantomes-3-piste-telecom',
                                                 'ge-affaire-antennes-fantomes-4-reperage-rf'],
                                 'canton': 'BE',
                                 'category': 'civil',
                                 'alignment': 'lawful',
                                 'seniority': 'senior',
                                 'personality': {'communication': 'direct',
                                                 'tech_level': 'expert',
                                                 'stress_response': 'calme',
                                                 'trust_initial': 'neutre'},
                                 'relations': [{'with': 'ofcom_spectrum_lead_be',
                                                'type': 'collègue',
                                                'cooccurrences': 1,
                                                'trust_init': 'high'},
                                               {'with': 'tech_scpt_interception',
                                                'type': 'collègue',
                                                'cooccurrences': 1,
                                                'trust_init': 'high'}]}}


# ─────────────────────────────────────────────────────────────
# DATA EN DUR — Campagne saga
# ─────────────────────────────────────────────────────────────

NEW_CAMPAIGN = {'id': 'saga-antennes-fantomes-geneve',
 'icon': '📡',
 'title': "L'Affaire des Antennes Fantômes",
 'subtitle': 'Saga 7 actes · Genève · Premier SMS Blaster judiciarisé en Suisse romande',
 'description': 'Mai-décembre 2026 — un retraité de Cologny perd 47 000 CHF en 4 minutes après un SMS prétendument de '
                'PostFinance. Vite, 89 plaintes en 5 jours convergent vers GE. La piste mène à un véhicule mobile '
                "équipé d'un SMS Blaster (fausse antenne LTE) qui force la connexion des téléphones à proximité et "
                "envoie des SMS spoofant PostFinance, UBS, CFF, Sunrise. Du flagrant délit à Carouge à l'audience au "
                'TCO 8 mois plus tard, en passant par OFCOM, SCPT, Swisscom Security, FOR-GE, et la coopération '
                'internationale Sofia/Chișinău, la saga traverse 10+ articles du CP/CPP/LTC, la Convention de '
                "Budapest, l'EIMP, le MROS — et illustre comment se construit (ou s'écroule) un dossier de "
                'cybercriminalité organisée transfrontalière.',
 'level': 'expert',
 'order': 48,
 'narrative': True,
 'hook': 'Un SMS Blaster mobile, un retraité ruiné en 4 minutes, 89 plaintes en 5 jours, un van Volvo XC60 qui se gare '
         "en double file à Carouge, et un chef présumé qui reste à Sofia hors d'atteinte de l'extradition.",
 'scenes': ['ge-affaire-antennes-fantomes-1-signal-alarme',
            'ge-affaire-antennes-fantomes-2-vague-correlee',
            'ge-affaire-antennes-fantomes-3-piste-telecom',
            'ge-affaire-antennes-fantomes-4-flagrant-delit',
            'ge-affaire-antennes-fantomes-5-forensique-for-ge',
            'ge-affaire-antennes-fantomes-6-cooperation-internationale',
            'ge-affaire-antennes-fantomes-7-audience-tco-geneve']}


# ─────────────────────────────────────────────────────────────
# Autres constantes
# ─────────────────────────────────────────────────────────────

NEW_FICHE_MANIFEST = {
    "file": "sms_blaster.html",
    "category": "mobile",
    "icon": "📡",
    "title": "SMS Blaster",
    "desc": "Fausse antenne LTE · Downgrade 2G · Chiffrement nul A5/0 · Cas Zurich-Genève-Toronto · Art. 22 LTC · 269bis CPP",
    "meta": "Mobile · RF",
    "isNew": True
}

CSP_TAG = (
    '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; '
    'script-src \'self\' \'unsafe-inline\'; '
    'style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; '
    'font-src \'self\' https://fonts.gstatic.com; '
    'img-src \'self\' data: blob:; '
    'connect-src \'self\'; '
    'media-src \'self\'; '
    'object-src \'none\'; '
    'base-uri \'self\'; '
    'form-action \'self\'; '
    'frame-ancestors \'none\'">'
)

SAGA_SCENES = [
    'ge-affaire-antennes-fantomes-1-signal-alarme',
    'ge-affaire-antennes-fantomes-2-vague-correlee',
    'ge-affaire-antennes-fantomes-3-piste-telecom',
    'ge-affaire-antennes-fantomes-4-flagrant-delit',
    'ge-affaire-antennes-fantomes-5-forensique-for-ge',
    'ge-affaire-antennes-fantomes-6-cooperation-internationale',
    'ge-affaire-antennes-fantomes-7-audience-tco-geneve',
]

SAGA_CHRONO_DATES = [
    '2026-05-25', '2026-05-27', '2026-06-08', '2026-06-23',
    '2026-06-30', '2026-07-15', '2027-01-22'
]

CHANGELOG_SECTION = """## [3.0.1] — 2026-05-30

📡 **Saga « L'Affaire des Antennes Fantômes » + fiche technique SMS Blaster.** Premier contenu narratif post-jolification, inspiré du cas réel zurichois (oct. 2025, condamnation 9 mois sursis) et de Project Lighthouse Toronto (avril 2026). Cache SW bumpé v144 → v145.

### Ajouté

- **Saga 7 actes** Genève niveau expert (signal d'alarme → corrélation 89 plaintes → piste télécom → flagrant délit Carouge → forensique FOR-GE → coopération internationale → audience TCO)
- **8 nouveaux NPCs** (procureur MP-GE, inspectrice Brigade financière, juge TMC, commandant FOR-GE, avocat de défense, OFCOM Spectrum, ingénieur SCPT, senior security Swisscom)
- **Fiche technique** `fiches/sms_blaster.html` (8 sections, 6 cas réels documentés, 14+ articles juridiques)
- **10+ articles juridiques** traversés dans la saga : 146 al. 2 CP, 22 LTC, 305bis CP, 269bis CPP, 282 CPP, 217 CPP, 141 al. 2 CPP, EIMP, Budapest art. 32, LBA art. 9

### Finalisé

- Cleanup résiduel v131c : 15 doublons HTML supprimés de la racine
- 2 bugs CSP corrigés : `artifacts.html` et `fiches/index.html`
- SW bumpé v144 → v145, manifest enrichi, CHANGELOG à jour

### Sources factuelles

- **24 heures, 8 mai 2026** : cas zurichois 50 000 téléphones
- **RTS, mai 2026** : détails techniques A5/0, OFCS
- **Radio-Canada, avril 2026** : Project Lighthouse Toronto
- **BBC, mars 2025** : affaire Shang + Fan, Londres Tube
- **3GPP TS 23.040, 23.003, 43.020** : spécifications SMS-PP, CGI, A5/0

---

"""


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def find_root() -> Path:
    here = Path(__file__).resolve().parent
    for c in (here, here.parent):
        if (c / 'sw.js').exists() and (c / 'data' / 'manifest.json').exists():
            return c
    print('[error] Racine CAS-IN introuvable.', file=sys.stderr)
    sys.exit(1)


def log(symbol, msg):
    print(f'  {symbol} {msg}')


# ─────────────────────────────────────────────────────────────
# Étapes
# ─────────────────────────────────────────────────────────────

def step_npcs(root):
    print('\n[1/8] Ajout des 8 NPCs de la saga')
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
        log('✅', f'{added} NPCs ajoutés (total: {len(data["npcs"])})')


def step_campaign(root):
    print('\n[2/8] Ajout de la campagne saga dans data/campaigns.json')
    p = root / 'data' / 'campaigns.json'
    with open(p) as f:
        data = json.load(f)
    if any(c.get('id') == NEW_CAMPAIGN['id'] for c in data['campaigns']):
        log('⏭ ', f'{NEW_CAMPAIGN["id"]} déjà présente')
        return
    data['campaigns'].append(NEW_CAMPAIGN)
    data['$generated_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    n_sagas = len([c for c in data['campaigns'] if c.get('narrative')])
    log('✅', f'campagne ajoutée (sagas total: {n_sagas})')


def step_chronology(root):
    print('\n[3/8] Ajout des entrées chronologie')
    p = root / 'data' / 'scenes-chronology.json'
    if not p.exists():
        log('⏭ ', 'scenes-chronology.json absent')
        return
    with open(p) as f:
        chrono = json.load(f)
    if isinstance(chrono, dict) and 'scenes' in chrono:
        clist = chrono['scenes']
    elif isinstance(chrono, list):
        clist = chrono
    else:
        log('⚠️ ', 'Format inconnu')
        return
    existing = {e.get('id') if isinstance(e, dict) else e for e in clist}
    added = 0
    for i, sid in enumerate(SAGA_SCENES):
        if sid in existing:
            continue
        clist.append({"id": sid, "date": SAGA_CHRONO_DATES[i], "saga": NEW_CAMPAIGN['id']})
        added += 1
    if added > 0:
        if isinstance(chrono, dict):
            chrono['scenes'] = clist
            chrono['$generated_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
            with open(p, 'w', encoding='utf-8') as f:
                json.dump(chrono, f, ensure_ascii=False, indent=2)
        else:
            with open(p, 'w', encoding='utf-8') as f:
                json.dump(clist, f, ensure_ascii=False, indent=2)
        log('✅', f'{added} entrées ajoutées')
    else:
        log('⏭ ', 'Entrées déjà présentes')


def step_manifest(root):
    print('\n[4/8] Mise à jour de data/manifest.json')
    p = root / 'data' / 'manifest.json'
    with open(p) as f:
        m = json.load(f)
    if any(f.get('file') == 'sms_blaster.html' for f in m['fiches']):
        log('⏭ ', 'sms_blaster.html déjà dans manifest')
        return
    m['fiches'].append(NEW_FICHE_MANIFEST)
    m['updatedAt'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(m, f, ensure_ascii=False, indent=2)
    log('✅', f'sms_blaster.html ajouté (total: {len(m["fiches"])})')


def step_csp(root):
    print('\n[5/8] Patch CSP sur artifacts.html + fiches/index.html')
    for target in [root / 'artifacts.html', root / 'fiches' / 'index.html']:
        if not target.exists():
            log('⏭ ', f'{target.relative_to(root)} absent')
            continue
        with open(target, encoding='utf-8') as f:
            content = f.read()
        if 'Content-Security-Policy' in content:
            log('⏭ ', f'{target.relative_to(root)} a déjà CSP')
            continue
        m = re.search(r'(<meta\s+charset="[^"]+">)', content)
        if not m:
            log('❌', f'{target.relative_to(root)} : meta charset introuvable')
            continue
        new = content[:m.end()] + '\n' + CSP_TAG + content[m.end():]
        with open(target, 'w', encoding='utf-8') as f:
            f.write(new)
        log('✅', f'CSP injectée dans {target.relative_to(root)}')


def step_sw(root):
    print('\n[6/8] Bump SW v144 → v145')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if current >= 145 or '// v132u' in sw:
        log('⏭ ', f'SW déjà bumpé (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v132u — 2026-05-30 — Bump SW v{current} → v{new_v}\n"
        f"// Précache fiches/sms_blaster.html via data/manifest.json\n"
        f"// ═══════════════════════════════════════════════════════════════\n"
        f"\n"
        f"const CACHE_VERSION = 'cas-in-v{new_v}';"
    )
    new_sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(new_sw)
    log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')


def step_changelog(root):
    print('\n[7/8] CHANGELOG : section [3.0.1] + ligne en-tête')
    p = root / 'docs' / 'CHANGELOG.md'
    if not p.exists():
        log('⏭ ', 'CHANGELOG.md absent')
        return
    with open(p, encoding='utf-8') as f:
        cl = f.read()
    if '## [3.0.1]' in cl:
        log('⏭ ', 'Section [3.0.1] déjà présente')
    else:
        pos = cl.find('## [3.0-jolification]')
        if pos == -1:
            log('❌', 'Marqueur [3.0-jolification] introuvable')
            return
        cl = cl[:pos] + CHANGELOG_SECTION + cl[pos:]
        log('✅', 'Section [3.0.1] insérée')
    cl = re.sub(
        r"Cache SW courant : \*\*`cas-in-v\d+`\*\* \(depuis [^)]+\)\.",
        "Cache SW courant : **`cas-in-v145`** (depuis le 30 mai 2026, v3.0.1).",
        cl, count=1
    )
    log('✅', 'Ligne d\'en-tête → v145')
    with open(p, 'w', encoding='utf-8') as f:
        f.write(cl)


def step_rebuild(root):
    print('\n[8/8] Reconstruction de scenes/index.json + counts.json')
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
                log('⚠️ ', f'{script} code={r.returncode}')
        except Exception as e:
            log('⚠️ ', f'{script} : {e}')


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN v132u-bis — Finalisation self-contained')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')
    step_npcs(root)
    step_campaign(root)
    step_chronology(root)
    step_manifest(root)
    step_csp(root)
    step_sw(root)
    step_changelog(root)
    step_rebuild(root)
    print('\n  ✅ v132u-bis appliqué.')


if __name__ == '__main__':
    main()
