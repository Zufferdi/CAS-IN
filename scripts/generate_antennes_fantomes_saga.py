#!/usr/bin/env python3
"""
generate_antennes_fantomes_saga.py — CAS-IN v132r

Génère la saga « L'Affaire des Antennes Fantômes » (Genève, expert, 7 actes) :
  - 7 fichiers scenes/ge-affaire-antennes-fantomes-*.json
  - 5 NPCs ajoutés à data/npcs.json
  - 1 entrée dans data/campaigns.json
  - 1 entrée dans data/scenes-chronology.json
  - data/counts.json mis à jour (scenes 392 → 399)

À exécuter depuis la racine du repo CAS-IN, après application des deltas v131-v132q.
"""
import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone


# ═══════════════════════════════════════════════════════════════
# 5 NPCs à ajouter (les autres sont réutilisés depuis npcs.json)
# ═══════════════════════════════════════════════════════════════
NEW_NPCS = {
    "ofcom_spectrum_lead_be": {
        "name": "Dr. Élise Schmid",
        "role": "Cheffe de section Spectrum Monitoring · OFCOM (Office fédéral de la communication)",
        "institution": "OFCOM, Biel/Bienne. Section surveillance du spectre radio + autorité de concession (art. 22 LTC). Coordonne avec MELANI/NCSC pour les incidents touchant les télécoms.",
        "shortBio": "Personnage fictif. Ingénieure RF, ETHZ Communication Engineering 2008, MAS GovTech 2015. 14 ans à l'OFCOM dont 8 sur le monitoring du spectre. Pilote l'équipe qui exploite les sondes Rohde&Schwarz mobiles et la coopération avec les opérateurs (Swisscom, Sunrise, Salt). Spécialité : détection d'émetteurs illicites (brouilleurs, fausses cellules, drones). Bilingue DE/FR. Méfiante des médias depuis l'affaire des brouilleurs GPS du WEF 2018.",
        "fictional": True,
        "tags": ["ofcom", "spectrum-monitoring", "rf", "sdr", "imsi-catcher", "sms-blaster", "biel-bienne", "be"],
        "appearances": [
            "ge-affaire-antennes-fantomes-2-vague-correlee",
            "ge-affaire-antennes-fantomes-3-piste-telecom",
            "ge-affaire-antennes-fantomes-7-audience-tco-geneve"
        ],
        "canton": "BE",
        "category": "regulator",
        "alignment": "lawful",
        "seniority": "senior",
        "personality": {
            "communication": "formel",
            "tech_level": "expert",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [
            {"with": "ncsc_govcert_lead", "type": "collègue", "cooccurrences": 1, "trust_init": "high"},
            {"with": "procureur_mp_ge_cybercrime", "type": "connaissance", "cooccurrences": 1, "trust_init": "medium"},
            {"with": "inspectrice_brigade_financiere_ge", "type": "collègue", "cooccurrences": 1, "trust_init": "medium"},
            {"with": "ingenieur_swisscom_security", "type": "collègue", "cooccurrences": 1, "trust_init": "high"}
        ]
    },

    "procureur_mp_ge_cybercrime": {
        "name": "Maître Pierre-Olivier Reymond",
        "role": "Premier procureur · Cellule cybercrime du Ministère public du canton de Genève",
        "institution": "Ministère public, route de Chancy, Genève. Section économique et financière, spécialisée cybercriminalité depuis 2019. Coopère étroitement avec la Brigade financière de la police judiciaire genevoise.",
        "shortBio": "Personnage fictif. Avocat Uni Genève 2002, juge d'instruction puis procureur depuis 2010. A piloté plusieurs dossiers de phishing bancaire majeur (notamment l'affaire des faux Crédit Suisse de 2021). Méthodique, ne classe jamais une plainte sans avoir vérifié les corrélations possibles. Connaît le CPP par cœur, surtout l'art. 269 et la jurisprudence sur les preuves illicites (art. 141).",
        "fictional": True,
        "tags": ["procureur", "ministere-public", "cybercrime", "geneve", "ge"],
        "appearances": [
            "ge-affaire-antennes-fantomes-1-signal-alarme",
            "ge-affaire-antennes-fantomes-2-vague-correlee",
            "ge-affaire-antennes-fantomes-4-reperage-rf",
            "ge-affaire-antennes-fantomes-6-cooperation-internationale",
            "ge-affaire-antennes-fantomes-7-audience-tco-geneve"
        ],
        "canton": "GE",
        "category": "magistrat",
        "alignment": "lawful",
        "seniority": "senior",
        "personality": {
            "communication": "formel",
            "tech_level": "intermédiaire",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [
            {"with": "ofcom_spectrum_lead_be", "type": "connaissance", "cooccurrences": 1, "trust_init": "medium"},
            {"with": "inspectrice_brigade_financiere_ge", "type": "collègue", "cooccurrences": 2, "trust_init": "high"},
            {"with": "juge_tmc_ge_perquisition", "type": "collègue", "cooccurrences": 1, "trust_init": "high"},
            {"with": "avocat_defense_carouge_lj", "type": "rival", "cooccurrences": 1, "trust_init": "low"}
        ]
    },

    "inspectrice_brigade_financiere_ge": {
        "name": "Inspectrice Léa Dubuis",
        "role": "Inspectrice principale · Brigade financière de la police judiciaire genevoise · Spécialiste cybercrime",
        "institution": "Police judiciaire genevoise, Carl-Vogt, Genève. Brigade financière (BFin), cellule cybercrime depuis 2020. Référente nationale pour les fraudes bancaires impliquant phishing/smishing.",
        "shortBio": "Personnage fictif. HEG Genève 2014 (informatique de gestion), formation ISFC, ESDFI. 9 ans police, dont 5 en cybercrime. A formé une équipe de 6 inspecteurs spécialisés smishing/vishing depuis la vague PostFinance 2023. Approche méthodique : corrélation des plaintes, cartographie temporelle, OSINT sur les domaines de phishing. Anglophone, lit le russe avec dictionnaire.",
        "fictional": True,
        "tags": ["police-judiciaire", "brigade-financiere", "cybercrime", "smishing", "geneve", "ge"],
        "appearances": [
            "ge-affaire-antennes-fantomes-2-vague-correlee",
            "ge-affaire-antennes-fantomes-4-reperage-rf",
            "ge-affaire-antennes-fantomes-5-perquisition-forensique"
        ],
        "canton": "GE",
        "category": "police",
        "alignment": "lawful",
        "seniority": "senior",
        "personality": {
            "communication": "direct",
            "tech_level": "expert",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [
            {"with": "procureur_mp_ge_cybercrime", "type": "collègue", "cooccurrences": 2, "trust_init": "high"},
            {"with": "ofcom_spectrum_lead_be", "type": "collègue", "cooccurrences": 1, "trust_init": "medium"},
            {"with": "tech_scpt_interception", "type": "collègue", "cooccurrences": 1, "trust_init": "high"},
            {"with": "forensicien_for_ge", "type": "collègue", "cooccurrences": 1, "trust_init": "high"}
        ]
    },

    "juge_tmc_ge_perquisition": {
        "name": "Juge Catherine Wenger",
        "role": "Juge du Tribunal des mesures de contrainte (TMC) · Genève",
        "institution": "Tribunal des mesures de contrainte, Palais de justice, Genève. Compétent pour autoriser les mesures de surveillance secrète (art. 269 CPP) et les perquisitions (art. 244 CPP) avant audience pénale.",
        "shortBio": "Personnage fictif. Magistrate depuis 2008, présidente de la chambre TMC depuis 2021. Connue pour son exigence sur les éléments concrets : refuse les demandes basées sur des hypothèses RF non corrélées à un acte délictueux. Demande systématiquement le rapport OFCOM en pièce jointe pour les affaires touchant les télécoms.",
        "fictional": True,
        "tags": ["tribunal", "tmc", "mesures-contrainte", "geneve", "ge", "juge"],
        "appearances": [
            "ge-affaire-antennes-fantomes-3-piste-telecom",
            "ge-affaire-antennes-fantomes-4-reperage-rf"
        ],
        "canton": "GE",
        "category": "magistrat",
        "alignment": "lawful",
        "seniority": "senior",
        "personality": {
            "communication": "formel",
            "tech_level": "intermédiaire",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [
            {"with": "procureur_mp_ge_cybercrime", "type": "collègue", "cooccurrences": 1, "trust_init": "high"},
            {"with": "inspectrice_brigade_financiere_ge", "type": "connaissance", "cooccurrences": 1, "trust_init": "medium"}
        ]
    },

    "avocat_defense_carouge_lj": {
        "name": "Maître Laurent Jacottet",
        "role": "Avocat de la défense · Étude Jacottet & associés, Carouge",
        "institution": "Étude Jacottet & associés, rue Saint-Joseph, Carouge. Spécialisée droit pénal et cybercriminalité depuis 2015. Représente le prévenu principal (technicien télécom suisse) dans l'affaire des Antennes Fantômes.",
        "shortBio": "Personnage fictif. Brevet d'avocat 2012, MAS droit pénal Unil 2016. Spécialiste reconnu de l'art. 141 CPP (preuves illicites) — a fait casser plusieurs surveillances secrètes par défaut de motivation. Plaide énergiquement, ne cède rien. A formé un cabinet jeune autour de défenses techniques (cybercrime, escroqueries complexes). Détestation cordiale avec le procureur Reymond depuis l'affaire CS 2021.",
        "fictional": True,
        "tags": ["avocat", "defense", "droit-penal", "art-141-cpp", "carouge", "ge"],
        "appearances": [
            "ge-affaire-antennes-fantomes-7-audience-tco-geneve"
        ],
        "canton": "GE",
        "category": "avocat",
        "alignment": "neutral",
        "seniority": "senior",
        "personality": {
            "communication": "direct",
            "tech_level": "intermédiaire",
            "stress_response": "agressif",
            "trust_initial": "méfiant"
        },
        "relations": [
            {"with": "procureur_mp_ge_cybercrime", "type": "rival", "cooccurrences": 1, "trust_init": "low"}
        ]
    },

    "tech_scpt_interception": {
        "name": "Marc Vauthier",
        "role": "Ingénieur · SCPT (Service de surveillance de la correspondance par poste et télécommunication)",
        "institution": "SCPT, Berne. Service technique fédéral qui exécute les mesures de surveillance des télécoms ordonnées par les autorités pénales cantonales (LSCPT).",
        "shortBio": "Personnage fictif. EPFL Communication Systems 2010, SCPT depuis 2012. A monté la cellule LTE/5G monitoring. Connaît les protocoles d'interception légale (LI) et les interfaces opérateurs. Discret, peu visible, mais indispensable. Travaille avec OFCOM et fedpol sur les dossiers techniques.",
        "fictional": True,
        "tags": ["scpt", "lscpt", "interception", "lte", "5g", "berne", "be"],
        "appearances": [
            "ge-affaire-antennes-fantomes-3-piste-telecom",
            "ge-affaire-antennes-fantomes-4-reperage-rf"
        ],
        "canton": "BE",
        "category": "regulator",
        "alignment": "lawful",
        "seniority": "senior",
        "personality": {
            "communication": "formel",
            "tech_level": "expert",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [
            {"with": "ofcom_spectrum_lead_be", "type": "collègue", "cooccurrences": 1, "trust_init": "high"},
            {"with": "inspectrice_brigade_financiere_ge", "type": "collègue", "cooccurrences": 1, "trust_init": "high"}
        ]
    },

    "forensicien_for_ge": {
        "name": "Cdt. Mathieu Reverchon",
        "role": "Commandant · Section forensique numérique de la police judiciaire genevoise (FOR Genève)",
        "institution": "Police judiciaire genevoise, section FOR (forensique numérique). Plateforme d'analyse forensique cantonale, certifiée ENFSI, équipée FTK/Autopsy/Cellebrite/Magnet AXIOM.",
        "shortBio": "Personnage fictif. EPFL Comm Systems 2003, certifications GCFA/GREM/GASF. 16 ans en forensique numérique, dont 11 à GE. A piloté l'analyse de plusieurs ransomware majeurs en Suisse romande (CHUV 2022, Banque cantonale jurassienne 2024). Méticuleux sur la chaîne de garde — refuse de traiter un disque sans hash MD5/SHA-256 documenté en présence d'un témoin.",
        "fictional": True,
        "tags": ["forensique", "police-judiciaire", "for-geneve", "dfir", "geneve", "ge"],
        "appearances": [
            "ge-affaire-antennes-fantomes-5-perquisition-forensique",
            "ge-affaire-antennes-fantomes-6-cooperation-internationale"
        ],
        "canton": "GE",
        "category": "police",
        "alignment": "lawful",
        "seniority": "senior",
        "personality": {
            "communication": "formel",
            "tech_level": "expert",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [
            {"with": "inspectrice_brigade_financiere_ge", "type": "collègue", "cooccurrences": 1, "trust_init": "high"},
            {"with": "procureur_mp_ge_cybercrime", "type": "collègue", "cooccurrences": 1, "trust_init": "medium"}
        ]
    },

    "ingenieur_swisscom_security": {
        "name": "Diego Furrer",
        "role": "Senior Security Engineer · Swisscom Security (CSIRT mobile networks)",
        "institution": "Swisscom Security, Bern. CSIRT spécialisé sécurité réseaux mobiles. Détection d'anomalies cellulaires, monitoring CGI (Cell Global Identifier), coopération autorités sur surveillance légale.",
        "shortBio": "Personnage fictif. HSLU Lucerne Telecom 2011, OSCP 2018, GMOB 2021. 12 ans Swisscom, dont 7 sur la sécurité mobile. A développé en interne une plateforme de détection des cellules non-déclarées (\"rogue cell detection\") en se basant sur les anomalies CGI/PLMN/TAC. Communique régulièrement avec MELANI/NCSC, OFCOM, et la SCPT pour les incidents techniques.",
        "fictional": True,
        "tags": ["swisscom", "csirt", "telecom-security", "rogue-cell-detection", "be"],
        "appearances": [
            "ge-affaire-antennes-fantomes-3-piste-telecom",
            "ge-affaire-antennes-fantomes-4-reperage-rf"
        ],
        "canton": "BE",
        "category": "civil",
        "alignment": "lawful",
        "seniority": "senior",
        "personality": {
            "communication": "direct",
            "tech_level": "expert",
            "stress_response": "calme",
            "trust_initial": "neutre"
        },
        "relations": [
            {"with": "ofcom_spectrum_lead_be", "type": "collègue", "cooccurrences": 1, "trust_init": "high"},
            {"with": "tech_scpt_interception", "type": "collègue", "cooccurrences": 1, "trust_init": "high"}
        ]
    }
}


# ═══════════════════════════════════════════════════════════════
# Données communes aux 7 scènes de la saga
# ═══════════════════════════════════════════════════════════════
REGION_DETAIL = {"code": "GE", "flag": "🇨🇭", "name": "Canton de Genève"}
COMMON_TAGS = ["sms-blaster", "imsi-catcher", "phishing", "smishing", "rf", "fausse-cellule", "geneve", "ge", "saga-antennes-fantomes", "expert"]


# ═══════════════════════════════════════════════════════════════
# Acte 1 — Le signal d'alarme
# ═══════════════════════════════════════════════════════════════
SCENE_1 = {
    "id": "ge-affaire-antennes-fantomes-1-signal-alarme",
    "title": "Acte 1 — Le signal d'alarme : un retraité de Cologny vidé de 47 000 CHF",
    "icon": "🚨",
    "difficulty": "expert",
    "atmosphere": "investigation",
    "narrative": {
        "success": "Ouverture d'enquête méthodique. Saisie conservatoire des comptes destinataires obtenue avant que les fonds soient retirés. Préservation propre du téléphone du plaignant. La piste smishing est confirmée par les premiers actes d'instruction.",
        "degraded": "Enquête ouverte mais avec quelques manquements (saisie tardive, expertise téléphone retardée). Les co-auteurs ont le temps de virer les fonds avant blocage. La piste reste exploitable mais affaiblie.",
        "failure": "Classement précipité ou ouverture sans saisie : les comptes destinataires sont vidés avant intervention. La piste smishing devient difficile à reconstituer. L'affaire repartira mais avec un dossier dégradé."
    },
    "tags": COMMON_TAGS + ["acte-1", "ouverture-enquete", "smishing", "saisie-conservatoire", "postfinance"],
    "legalRefs": [
        "Art. 146 CP (escroquerie)",
        "Art. 147 CP (utilisation frauduleuse d'un ordinateur)",
        "Art. 263 CPP (séquestre)",
        "Art. 196 CPP (séquestre de moyens de preuve)",
        "Art. 168 CPP (témoin)"
    ],
    "intro": "Lundi matin, 09h12. Au Ministère public du canton de Genève, le <strong>premier procureur Reymond</strong> reçoit le dossier 2026/0847 : <strong>Monsieur G. M., 73 ans, retraité résidant à Cologny</strong>, déclare avoir perdu <strong>47 000 CHF en 4 minutes</strong> samedi vers 14h30. <br><br>Selon sa plainte, il a reçu un SMS qui prétendait venir de <strong>PostFinance</strong> : « Votre carte de crédit a été temporairement bloquée suite à une activité suspecte. Vérifiez vos informations pour la réactiver : postfinance-cs[.]ch ». Il a cliqué, saisi son identifiant + mot de passe + le code SMS reçu peu après. <strong>4 virements SWIFT à destination de comptes bulgares</strong> ont été exécutés dans la foulée. La banque a confirmé : techniquement les opérations ont été authentifiées avec ses credentials. <br><br>Le téléphone est dans un sachet plastique sur le bureau. Le plaignant attend dehors avec sa fille. Une autre dossier sur ton bureau, déjà classé hier : un commerçant des Eaux-Vives qui s'est fait arnaquer la semaine dernière par un SMS UBS similaire. Tu n'as pas fait le lien à l'époque.",
    "alertLevel": "🚨 Plainte 2026/0847 · Smishing PostFinance · 47 000 CHF · Comptes BG · TLP:AMBER",
    "objectives": [
        {"icon": "⚖️", "text": "Qualifier juridiquement l'affaire (escroquerie ou utilisation frauduleuse d'un ordinateur ?)"},
        {"icon": "🔒", "text": "Préserver les preuves (téléphone du plaignant, logs PostFinance)"},
        {"icon": "💰", "text": "Bloquer les fonds avant qu'ils soient retirés des comptes destinataires"}
    ],
    "steps": [
        {
            "phase": "🚨 09h12-10h00 — Triage initial du dossier 2026/0847",
            "situation": "Le téléphone du plaignant est resté allumé, dans son sachet (pas encore en mode avion). La banque PostFinance attend une requête formelle pour communiquer les logs détaillés. Les 4 virements SWIFT ont quitté la Suisse <strong>il y a 47 heures</strong> mais le délai de réversibilité avec la Bulgarie est de 72h selon l'accord SEPA. La fille du plaignant pleure dans le couloir.",
            "law": "<strong>Art. 146 CP</strong> (escroquerie : tromperie astucieuse + dessein d'enrichissement) · <strong>Art. 147 CP</strong> (utilisation frauduleuse d'un ordinateur : controversé pour le phishing pur — la victime saisit elle-même ses credentials) · <strong>Art. 196 CPP</strong> (séquestre de moyens de preuve)",
            "question": "<strong>Quelle décision immédiate (premières 60 minutes) ?</strong>",
            "choices": [
                {
                    "text": "(1) <strong>Ouverture d'enquête formelle</strong> (qualification provisoire 146 CP). (2) <strong>Téléphone placé en mode avion + Faraday bag</strong> immédiat (la fille appelle un proche pour récupérer un sac de blocage RF — KAPO Genève en a, 25 min de délai). (3) <strong>Réquisition d'urgence à PostFinance</strong> (art. 265 CPP) pour les logs détaillés et le blocage SWIFT des destinataires bulgares. (4) <strong>Saisie conservatoire (art. 263 CPP) demandée au TMC en procédure d'urgence</strong> pour les comptes destinataires — la fenêtre SEPA de 72h se ferme dans 25h.",
                    "ok": True,
                    "pts": 22,
                    "fb": "✅ <strong>Posture exécutive correcte.</strong> Quatre actes parallèles, tous justifiés. Le mode avion+Faraday préserve l'état du téléphone (notamment les iMessages cryptés et les SMS encore en cache cellulaire avant flush). La réquisition art. 265 CPP est le bon véhicule pour les logs PostFinance (collaboration tiers détenteur). La saisie conservatoire dans la fenêtre SEPA reste réaliste — la BCB (Banque centrale bulgare) coopère avec le MROS suisse en pratique. La qualification provisoire 146 CP est la plus sûre (147 CP suscite des débats jurisprudentiels pour le phishing pur, voir ATF 6B_972/2020).",
                    "legal": "Art. 146 CP · Art. 196/263/265 CPP · ATF 6B_972/2020 (qualification phishing) · Pratique MROS sur SEPA.",
                    "critical": False,
                    "next": 1
                },
                {
                    "text": "<strong>Ouverture d'enquête + réquisition à PostFinance</strong>, mais on attend lundi soir pour la saisie conservatoire (priorité aux actes urgents). Téléphone du plaignant : on le laisse au plaignant pour ne pas perdre ses contacts professionnels, on prendra une image plus tard.",
                    "ok": False,
                    "pts": 8,
                    "fb": "⚠️ <strong>Demi-mesure dangereuse.</strong> Retarder la saisie conservatoire de 8h dans une fenêtre SEPA qui se ferme dans 25h est un calcul risqué : si les co-auteurs sont actifs en week-end, ils peuvent retirer dès le lundi 09h locale bulgare (08h Suisse). Surtout : laisser le téléphone au plaignant détruit la chaîne de garde — il peut faire un reset accidentel, accepter une notification push qui efface le cache cellulaire, ou pire, recevoir d'autres SMS phishing qui contaminent l'analyse forensique. La pratique cantonale GE est de saisir le téléphone et de fournir au plaignant un téléphone de prêt si nécessaire (rare mais possible).",
                    "legal": "Art. 196 CPP (chaîne de garde des preuves) · Pratique cantonale GE.",
                    "critical": False,
                    "next": 1
                },
                {
                    "text": "<strong>Classement provisoire</strong> en attente de plus de plaintes : un cas isolé de phishing bancaire ne justifie pas l'ouverture immédiate, surtout que la victime a saisi elle-même ses credentials (responsabilité partagée). La banque a ses procédures de remboursement, on rouvrira si la PostFinance refuse l'indemnisation.",
                    "ok": False,
                    "pts": 0,
                    "fb": "❌ <strong>Faute lourde de poursuite pénale.</strong> Le principe d'opportunité de la poursuite (art. 8 CPP) n'autorise pas un classement pour cause de \"responsabilité partagée\" sur un préjudice à 47 000 CHF. C'est exactement ce qu'attendent les co-auteurs : que la justice considère que c'est \"la faute de la victime\" et laisse les fonds partir. De plus, tu n'as pas encore corrélé avec l'affaire UBS de la semaine dernière qui dort dans un autre dossier. La pratique du Ministère public GE est de ne JAMAIS classer un phishing bancaire > 10 000 CHF en première analyse, précisément pour permettre la corrélation.",
                    "legal": "Art. 8 CPP (opportunité de la poursuite) · Pratique MP-GE · Doctrine Cassani/Garbarski.",
                    "critical": True,
                    "next": 1
                }
            ]
        },
        {
            "phase": "📂 10h00-11h30 — Corrélation avec les dossiers récents",
            "situation": "Une recherche dans le système informatique du Ministère public révèle <strong>11 plaintes similaires</strong> ouvertes dans les 12 derniers jours, dont 4 cas UBS et 7 cas PostFinance, total préjudice <strong>289 000 CHF</strong>. Toutes les victimes ont cliqué sur un SMS reçu un samedi ou un dimanche après-midi, principalement dans les quartiers <strong>Eaux-Vives, Rive, Plainpalais, Cornavin</strong>. Toutes les victimes ont saisi leur code SMS de validation après le mot de passe. Aucune corrélation n'a été établie entre les dossiers — chacun a été traité par un procureur différent.",
            "law": "<strong>Art. 48 CPP</strong> (entraide intercantonale) · <strong>Art. 309 CPP</strong> (ouverture d'instruction) · <strong>Art. 260ter CP</strong> (organisation criminelle, si > 3 personnes structurées)",
            "question": "<strong>Quelle stratégie de coordination ?</strong>",
            "choices": [
                {
                    "text": "(1) <strong>Regroupement des 11 dossiers</strong> sous une <strong>procédure unique</strong> (art. 29 al. 1 CPP) que tu prends en charge. (2) <strong>Avis à la Brigade financière GE</strong> (inspectrice Dubuis) pour cartographier les pings cellulaires des téléphones des 11 victimes au moment de réception du SMS. (3) <strong>Signalement préventif à fedpol et NCSC</strong> via le canal cybercriminalité (mais TLP:AMBER — pas de publication). (4) <strong>Convocation des autres procureurs concernés</strong> pour briefing à 14h00.",
                    "ok": True,
                    "pts": 20,
                    "fb": "✅ <strong>Coordination exemplaire.</strong> Le regroupement art. 29 CPP est l'instrument qui permet d'instruire une affaire complexe sans dilution des compétences. L'avis à la BFin avec analyse des pings cellulaires est exactement le bon réflexe — si les téléphones étaient connectés à une cellule anormale au moment du SMS, on aura un pattern géographique. Le signalement préventif fedpol/NCSC TLP:AMBER permet la coordination sans alerter la presse.",
                    "legal": "Art. 29 CPP (jonction des causes) · Art. 48 CPP (entraide) · Pratique MROS/NCSC.",
                    "critical": False,
                    "next": 2
                },
                {
                    "text": "Tu signales les 11 dossiers à fedpol pour qu'ils prennent le relais : c'est une affaire d'envergure nationale, ça dépasse les compétences cantonales.",
                    "ok": False,
                    "pts": 5,
                    "fb": "⚠️ <strong>Délégation trop précoce.</strong> Fedpol n'a compétence sur les affaires intercantonales que si > 3 cantons sont touchés (art. 24 CPP) ou si l'affaire entre dans son catalogue spécifique (art. 23 CPP : faux-monnayage, trafic de stupéfiants en bande organisée, etc.). 11 plaintes toutes à GE, ce n'est pas (encore) intercantonal. Le procureur cantonal reste compétent. Une délégation prématurée fait perdre 2-3 semaines pendant lesquelles fedpol établit ses propres dossiers.",
                    "legal": "Art. 22-24 CPP (compétence) · LOAP.",
                    "critical": False,
                    "next": 2
                },
                {
                    "text": "Tu instruis chacun des 11 dossiers séparément pour ne pas créer une procédure ingérable. Chaque procureur garde ses cas, vous coordonnez en informel via mail.",
                    "ok": False,
                    "pts": 3,
                    "fb": "❌ <strong>Approche perdante.</strong> Onze instructions parallèles = onze séries de réquisitions identiques à PostFinance et UBS, onze auditions de plaignants, onze risques de versions divergentes des faits, onze possibilités que la défense exploite des incohérences. Et surtout, aucune chance de cartographier les pings cellulaires au-delà du cas individuel. Les co-auteurs continuent leurs envois pendant que la justice s'éparpille.",
                    "legal": "Art. 29 CPP (économie de procédure).",
                    "critical": False,
                    "next": 2
                }
            ]
        },
        {
            "phase": "📞 11h30-13h00 — Le téléphone du plaignant chez FOR-GE",
            "situation": "Le téléphone est arrivé à la section forensique numérique de la PJ genevoise (FOR-GE). Le <strong>commandant Reverchon</strong> t'appelle : « On a un Samsung Galaxy S22 (Android 14), pas chiffré au repos (déverrouillé par le plaignant avant remise), batterie à 12 %, mode avion activé. Le SMS PostFinance est encore dans la base messaging — pas effacé. <strong>Le numéro expéditeur affiche 'PostFinance'</strong>, donc spoofé (PostFinance utilise des shortcodes 5-chiffres officiels en Suisse). On peut imager immédiatement avant que la batterie meure, ou on attend l'autorisation formelle. »",
            "law": "<strong>Art. 246 CPP</strong> (perquisition de documents et enregistrements) · <strong>Art. 261 al. 2 CPP</strong> (analyse forensique avec consentement)",
            "question": "<strong>Que dis-tu à Reverchon ?</strong>",
            "choices": [
                {
                    "text": "(1) <strong>Consentement écrit du plaignant immédiat</strong> (signé sur place avant le départ du téléphone, sur ordre de toi par téléphone à Dubuis qui est avec lui). (2) <strong>Imagerie physique complète</strong> (chip-off si besoin pour préserver l'état) — coût : on perd le téléphone si chip-off. <strong>Alternative</strong> : Cellebrite UFED Premium 7.62 + extraction logique advanced. (3) <strong>Hash MD5+SHA-256 de l'image</strong> documentés, dans un PV, en présence du commandant et d'un témoin (technicien). (4) <strong>Conservation de l'expéditeur réel</strong> du SMS : c'est dans le tracker SMS du firmware (champ ORI_ADDRESS), à extraire AVANT de toucher.",
                    "ok": True,
                    "pts": 24,
                    "fb": "✅ <strong>Maîtrise complète.</strong> La distinction extraction logique advanced (Cellebrite UFED, on récupère les SMS + métadonnées + base messaging native) vs extraction physique (chip-off, on récupère tout y compris le slack space, mais on détruit le téléphone) est critique pour expert. Pour un téléphone Android non chiffré au repos comme le S22 ici, l'extraction logique advanced suffit ; on préserve le téléphone pour les besoins futurs (contre-expertise défense, art. 145 CPP). Le hash MD5+SHA-256 cumulés répondent à la jurisprudence ATF 144 IV 254 sur la chaîne de garde. Et surtout : extraire le champ ORI_ADDRESS du tracker SMS révèle qu'il s'agit d'un SMS reçu via une cellule LTE non-déclarée — c'est la première trace technique de la fausse antenne.",
                    "legal": "Art. 246/261 CPP · ATF 144 IV 254 · Cellebrite UFED Premium documentation.",
                    "critical": False,
                    "next": 3
                },
                {
                    "text": "Tu autorises Reverchon à imager immédiatement (urgence batterie). Mais en extraction physique chip-off pour récupérer tout (y compris slack space) — on n'aura jamais besoin du téléphone après.",
                    "ok": False,
                    "pts": 8,
                    "fb": "⚠️ <strong>Destruction prématurée d'un élément de preuve.</strong> Le chip-off est définitif : tu détruis le téléphone. C'est rarement justifié sur un téléphone non chiffré récent où l'extraction logique advanced (Cellebrite UFED) donne 99 % du contenu utile. La défense peut demander une contre-expertise (art. 145 CPP) — si le téléphone n'existe plus, la défense plaide la nullité de l'expertise pour impossibilité de contradiction. ATF 142 IV 207 a cassé une expertise pour cette raison précise.",
                    "legal": "Art. 145 CPP (droit à la contre-expertise) · ATF 142 IV 207.",
                    "critical": False,
                    "next": 3
                },
                {
                    "text": "Tu demandes à Reverchon d'attendre un mandat formel du TMC pour toute opération sur le téléphone — c'est plus prudent.",
                    "ok": False,
                    "pts": 5,
                    "fb": "⚠️ <strong>Excès de prudence qui détruit la preuve.</strong> Pour un téléphone remis volontairement par son propriétaire (le plaignant), le consentement écrit suffit (art. 261 al. 2 CPP). Le mandat TMC est requis pour les téléphones SAISIS sans consentement (suspect, par exemple). En attendant un mandat (24-48h en pratique GE), la batterie meurt, le téléphone se verrouille, et tu perds le SMS encore en cache cellulaire.",
                    "legal": "Art. 261 al. 2 CPP (consentement) · Différence saisie volontaire / forcée.",
                    "critical": False,
                    "next": 3
                }
            ]
        },
        {
            "phase": "✅ 13h00 — Synthèse du briefing avec Dubuis",
            "situation": "L'inspectrice Léa Dubuis revient avec une première analyse : sur les 11 victimes, <strong>9 ont accepté de remettre leur téléphone</strong>. Les pings cellulaires sont en cours d'extraction. Premier résultat sur 3 téléphones : tous étaient connectés à une cellule LTE avec un <strong>Cell Global Identifier (CGI) anormal</strong> au moment du SMS — un CGI qui n'apparaît dans aucun registre Swisscom/Sunrise/Salt. Tu décides du briefing demain matin avec la Brigade financière et fedpol/NCSC. Avant ça, tu veux verrouiller un dernier point.",
            "law": "<strong>Art. 309 CPP</strong> (ouverture d'instruction) · <strong>Art. 311 CPP</strong> (direction de la procédure)",
            "question": "<strong>Que rédiges-tu dans l'ouverture formelle d'instruction (PV 2026/0847+10) ?</strong>",
            "choices": [
                {
                    "text": "Qualification provisoire <strong>art. 146 CP (escroquerie) en bande</strong> (art. 146 al. 2 CP — métier ou bande), avec mention de l'<strong>art. 22 LTC (exploitation d'installation radio sans concession)</strong> au vu des CGI anormaux. Réserve de l'<strong>art. 260ter CP (organisation criminelle)</strong> en attente d'identification des co-auteurs.",
                    "ok": True,
                    "pts": 16,
                    "fb": "✅ <strong>Qualification triple précise.</strong> L'art. 146 al. 2 CP (escroquerie par métier ou en bande, peine privative jusqu'à 10 ans) est justifié par les 11 cas en 12 jours = bande organisée minimum. L'art. 22 LTC fournit la qualification radio pour l'équipement et offrira plus tard un fondement pour la perquisition technique. La réserve 260ter CP est sage : on l'ajoutera si on identifie une structure pyramidale (chef + recruteurs + exécutants). Cette qualification triple donne les peines les plus lourdes possibles et couvre toutes les hypothèses techniques.",
                    "legal": "Art. 146 al. 2 CP · Art. 22 LTC · Art. 260ter CP · Doctrine Cassani §1486.",
                    "critical": False,
                    "next": None
                },
                {
                    "text": "Qualification simple <strong>art. 146 CP escroquerie</strong>, sans circonstance aggravante : la bande n'est pas prouvée tant qu'on n'a pas identifié les co-auteurs.",
                    "ok": False,
                    "pts": 6,
                    "fb": "⚠️ <strong>Qualification trop timide.</strong> La jurisprudence Casssani-Garbarski admet la <em>bande</em> (art. 146 al. 2) dès lors qu'au moins 2 personnes se sont associées pour commettre plusieurs escroqueries — même si l'identité des co-auteurs n'est pas encore établie. Ici, 11 escroqueries similaires en 12 jours avec un modus operandi technique (fausse cellule + SMS spoof + faux site) implique nécessairement une coordination minimum bande. Sous-qualifier en simple 146 CP réduit la peine plancher de moitié.",
                    "legal": "Art. 146 al. 2 CP · ATF 124 IV 286.",
                    "critical": False,
                    "next": None
                },
                {
                    "text": "Tu attends d'avoir identifié les co-auteurs avant de qualifier précisément, qualification provisoire au sens large 146-147 CP sans préciser l'alinéa.",
                    "ok": False,
                    "pts": 4,
                    "fb": "⚠️ <strong>Procrastination procédurale.</strong> Une qualification provisoire est, par définition, susceptible d'évoluer pendant l'instruction (art. 311 al. 3 CPP). Reporter la précision empêche d'invoquer les actes d'instruction adaptés (par exemple, l'art. 269 CPP n'est ouvert que pour les infractions du catalogue art. 269 al. 2 — et 146 al. 2 CP en fait partie, mais pas 146 al. 1 simple !). Sans qualification al. 2, tu te prives de l'arme surveillance secrète pour la suite.",
                    "legal": "Art. 311 al. 3 CPP · Art. 269 al. 2 CPP (catalogue surveillance).",
                    "critical": False,
                    "next": None
                }
            ]
        }
    ],
    "debrief": "<p><strong>Pourquoi cet acte est crucial pour la suite.</strong> Le premier jour d'une affaire de smishing est déterminant : c'est là que se joue la <em>fenêtre de réversibilité SEPA</em> (≤ 72h pour rappeler les fonds), la <em>qualification juridique</em> (art. 146 al. 2 CP en bande = peine plancher 6 mois ferme et accès aux outils d'enquête du catalogue art. 269 CPP), et la <em>chaîne de garde du téléphone victime</em> (qui contiendra plus tard les premières traces techniques de la fausse cellule via le champ ORI_ADDRESS et le CGI anormal).</p><p><strong>Le SMS Blaster expliqué.</strong> Un SMS Blaster est une fausse antenne-relais (IMSI catcher modifié) qui se présente comme une cellule légitime, généralement avec un identifiant LTE (CGI = MCC+MNC+TAC+CI) qui imite plausiblement un opérateur mais n'est pas enregistré dans son inventaire officiel. Les téléphones à proximité s'y connectent automatiquement (paging response forcé). Une fois la connexion établie, l'attaquant peut <em>downgrader</em> vers 2G/3G (où l'authentification du réseau par le téléphone est faible ou absente — vulnérabilité historique connue) et envoyer des SMS arbitraires avec un sender ID falsifié. Coût d'un setup minimal : SDR Ettus B210 ~1400 CHF, antennes panneau ~200 CHF chacune, srsRAN + Osmocom open-source. Documenté en détail par MITRE ATT&CK Mobile (T1581.001) et la CSA 3GPP 33.117.</p><p><strong>L'art. 269 CPP en perspective.</strong> Cet article (surveillance des télécommunications) sera ton outil principal aux actes 3-4. Mais il exige (a) une infraction du catalogue al. 2, (b) des soupçons graves, (c) la subsidiarité (l'enquête sans surveillance serait excessivement difficile). Sans la qualification 146 al. 2 CP que tu as posée à l'acte 1, l'art. 269 CPP devient inapplicable. Cette logique de cohérence procédurale entre l'ouverture et les actes ultérieurs est précisément ce qui distingue un dossier qui tient à l'audience d'un dossier qui se fait casser par la défense (art. 141 al. 2 CPP).</p><p><strong>Ce qui se passe ensuite.</strong> Acte 2 : la BFin (Dubuis) corrèle les pings cellulaires de toutes les victimes et identifie une signature temporelle/spatiale. La piste télécom prend forme.</p>",
    "npcs": ["procureur_mp_ge_cybercrime", "inspectrice_brigade_financiere_ge", "forensicien_for_ge"],
    "regionDetail": REGION_DETAIL,
    "region": "GE",
    "realCase": False,
    "role": "magistrat"
}


# ═══════════════════════════════════════════════════════════════
# Acte 2 — Une vague, pas un cas isolé
# ═══════════════════════════════════════════════════════════════
SCENE_2 = {
    "id": "ge-affaire-antennes-fantomes-2-vague-correlee",
    "title": "Acte 2 — Une vague, pas un cas isolé : 89 plaintes en 5 jours",
    "icon": "📊",
    "difficulty": "expert",
    "atmosphere": "investigation",
    "narrative": {
        "success": "Corrélation propre établie. Pattern temporel et géographique identifié. Coordination intercantonale et avec NCSC/OFCOM lancée sans fuite. La piste télécom est solidement étayée pour solliciter une surveillance secrète au TMC.",
        "degraded": "Corrélation établie mais avec quelques fuites collatérales (média ou communications mal sécurisées). Les co-auteurs peuvent être avertis. Le dossier reste exploitable mais avec un risque de discrétion compromise.",
        "failure": "Coordination chaotique : plusieurs cantons travaillent en parallèle sans agréger, ou fuite vers la presse qui fait basculer les co-auteurs en mode prudence. Le pattern devient impossible à confirmer en temps réel."
    },
    "tags": COMMON_TAGS + ["acte-2", "correlation", "intercantonal", "ofcom", "ncsc", "cgi-analysis"],
    "legalRefs": [
        "Art. 48 CPP (entraide intercantonale)",
        "Art. 73 CPP (collaboration entre autorités)",
        "Loi MELANI / NCSC (LSI art. 73)",
        "Art. 73-75 LTC (rôle OFCOM)",
        "Convention 108+ (protection des données)"
    ],
    "intro": "Mardi matin, 08h30. Brigade financière de Carl-Vogt. L'<strong>inspectrice Léa Dubuis</strong> a passé la nuit à croiser les données. Elle te montre son tableau : <strong>89 plaintes en 5 jours</strong> à GE (les 11 connues + 78 nouvelles remontées depuis hier par d'autres procureurs alertés). Préjudice cumulé estimé : <strong>2,4 millions CHF</strong>. Et ce n'est que GE — sa collègue de la PJ vaudoise mentionne 31 cas à Lausanne, 12 à Nyon, 22 sur la Riviera. <br><br>Le pattern est clair sur la carte de Genève : les SMS sont reçus dans des fenêtres de 15-25 minutes, dans des quartiers commerciaux ou résidentiels denses : <strong>Eaux-Vives (samedi 14h-15h)</strong>, <strong>Rive (mercredi 12h-13h)</strong>, <strong>Plainpalais (dimanche 14h-15h)</strong>, <strong>Cornavin (jeudi 17h-18h)</strong>. Toutes les victimes étaient à pied ou en transports en commun, jamais en voiture. <br><br>Sur ton bureau, le rapport intermédiaire de FOR-GE : sur 9 téléphones imagés, <strong>les 9 contiennent le même CGI anormal</strong> (Cell Global Identifier non enregistré chez aucun opérateur, mais format plausible Swisscom). Tu as un quart d'heure pour décider de la suite : Mme Schmid de l'OFCOM t'attend à 09h00 en visioconférence, et le coordinateur NCSC à 09h30.",
    "alertLevel": "📊 89 plaintes GE · 65 plaintes VD · 2,4M CHF · CGI anormal détecté · TLP:AMBER",
    "objectives": [
        {"icon": "🌐", "text": "Coordonner avec les autres cantons sans créer de fuites"},
        {"icon": "📡", "text": "Solliciter OFCOM (analyse spectre) et NCSC (renseignement cyber)"},
        {"icon": "🤫", "text": "Préserver le secret de l'enquête face à la presse"}
    ],
    "steps": [
        {
            "phase": "🤝 09h00 — Visioconférence avec Élise Schmid (OFCOM)",
            "situation": "Sur l'écran, la cheffe Spectrum Monitoring de l'OFCOM à Biel. « Procureur Reymond, mes équipes ont analysé les CGI que vous nous avez transmis. C'est techniquement intéressant : le format est conforme 3GPP TS 23.003 — MCC 228 (Suisse), MNC 01 (Swisscom), TAC 5421, CI 12345-12352. <strong>Sauf que ces CI ne sont pas attribués</strong> par Swisscom dans cette tracking area. C'est très probablement un émetteur LTE non autorisé. Nous avons trois sondes Rohde&Schwarz mobiles disponibles, mais en les déployant à Genève sans cadre légal, on contrevient à notre charte. Que pouvez-vous me fournir comme support juridique ? »",
            "law": "<strong>Art. 73 LTC</strong> (OFCOM autorité de surveillance) · <strong>Art. 22 LTC</strong> (interdiction d'exploiter une installation sans concession) · <strong>Art. 75 LTC</strong> (constatations OFCOM admissibles comme moyens de preuve dans procédure pénale)",
            "question": "<strong>Quel cadre juridique offres-tu à OFCOM pour ses sondes ?</strong>",
            "choices": [
                {
                    "text": "(1) <strong>Réquisition formelle art. 197/198 CPP</strong> à OFCOM en qualité d'autorité technique compétente. (2) Mention explicite des <strong>articles 22 et 73 LTC</strong> (exploitation illicite d'installation radio + autorité de surveillance). (3) <strong>Coordination directe</strong> avec l'inspectrice Dubuis pour le calendrier des déploiements (sans révéler la liste des quartiers concernés par mail — appel téléphonique seulement). (4) Demande de <strong>secret OFCOM</strong> (art. 22a LTC, secret de service) sur l'opération.",
                    "ok": True,
                    "pts": 22,
                    "fb": "✅ <strong>Cadre complet et discret.</strong> La réquisition art. 197/198 CPP transforme OFCOM d'autorité administrative en collaborateur d'enquête pénale — ses constatations deviennent admissibles comme preuves (art. 75 LTC + jurisprudence GE TC sur les rapports OFCOM). L'invocation des art. 22 et 73 LTC est cruciale : sans ces deux articles, OFCOM ne peut pas justifier d'utiliser ses sondes dans le cadre d'une enquête pénale. La coordination téléphonique (pas mail) avec Dubuis évite les fuites par compromission de boîte mail (les services cantonaux sont victimes fréquentes de spear-phishing depuis 2024). Le secret OFCOM art. 22a LTC protège contre les fuites internes OFCOM.",
                    "legal": "Art. 197/198 CPP · Art. 22/22a/73/75 LTC · Pratique OFCOM/MP-GE.",
                    "critical": False,
                    "next": 1
                },
                {
                    "text": "Tu envoies à OFCOM la <strong>liste complète des 89 plaintes</strong> avec adresses des victimes et timestamps des SMS, par mail interne sécurisé, pour qu'ils puissent calibrer leurs sondes.",
                    "ok": False,
                    "pts": 4,
                    "fb": "⚠️ <strong>Risque de fuite massive.</strong> Transmettre la liste complète des 89 victimes par mail expose à plusieurs risques : (a) compromission de boîte mail (les services publics suisses sont victimes fréquentes de phishing spear depuis 2023), (b) données personnelles transmises sans base légale renforcée (LPD/nLPD), (c) chez OFCOM, la liste passera par plusieurs mains, multipliant les risques de fuite. Le bon réflexe : envoyer uniquement les <em>fenêtres temporelles et géographiques agrégées</em> (ex : « 4 quartiers, 4 fenêtres de 20 min », sans noms de victimes), puis transmettre les détails individuels en présentiel sur clé chiffrée.",
                    "legal": "nLPD art. 8 (minimisation des données) · Pratique OFCOM (canal sécurisé physique).",
                    "critical": False,
                    "next": 1
                },
                {
                    "text": "Tu refuses la coopération formelle avec OFCOM : c'est une affaire pénale, OFCOM est une autorité administrative. Tu te limites à leur rapport déjà rendu et tu fais le reste avec la SCPT.",
                    "ok": False,
                    "pts": 3,
                    "fb": "❌ <strong>Confusion de compétences.</strong> SCPT et OFCOM ont des rôles complémentaires, pas exclusifs : SCPT gère l'<em>interception légale</em> chez les opérateurs autorisés (Swisscom, Sunrise, Salt) ; OFCOM détecte les émetteurs <em>non autorisés</em> (le SMS Blaster). Tu as besoin des deux. Sans OFCOM, tu ne peux pas trianguler la fausse cellule — la SCPT ne sait analyser que les flux des opérateurs déclarés.",
                    "legal": "Art. 269 CPP (SCPT) vs Art. 22/73 LTC (OFCOM) · Pratique fédérale.",
                    "critical": False,
                    "next": 1
                }
            ]
        },
        {
            "phase": "🤝 09h30 — Coordinateur NCSC",
            "situation": "Visio NCSC. Le coordinateur t'informe que NCSC suit la vague depuis 4 jours via les signalements antiphishing.ch : <strong>118 signalements postfinance-cs[.]ch + ubs-secure[.]ch + cff-billet[.]ch</strong>, tous hébergés sur le même VPS en Moldavie. NCSC a déjà notifié PostFinance, UBS et CFF pour bloquer les domaines en interne. NCSC offre : (a) le take-down du VPS via cooperation Moldavie (24-48h), (b) le rapport TLP:AMBER sur l'infrastructure, (c) un signalement Europol J-CAT.",
            "law": "<strong>LSI art. 73</strong> (NCSC autorité de coordination) · <strong>Art. 18a LSI</strong> (échange d'informations) · <strong>Convention de Budapest art. 25 ss</strong> (entraide internationale cybercrime)",
            "question": "<strong>Que demandes-tu à NCSC ?</strong>",
            "choices": [
                {
                    "text": "(1) <strong>Rapport TLP:AMBER complet</strong> sur l'infrastructure (DNS, certificats SSL, registrar, hébergeur, paiements). (2) <strong>Signalement Europol J-CAT</strong> sous label « ongoing investigation Switzerland » (pas de publication, juste coordination intra-Europol). (3) <strong>NON</strong> au take-down VPS Moldavie pour l'instant — laisser actif tant que la fausse antenne est en service, sinon les opérateurs renoncent. (4) Coordination via canal NCSC chiffré (Signal NCSC) pour les futurs échanges.",
                    "ok": True,
                    "pts": 22,
                    "fb": "✅ <strong>Stratégie de couverture optimale.</strong> Le « NON au take-down VPS » est contre-intuitif mais essentiel : si on tue l'infrastructure de phishing maintenant, les opérateurs derrière la fausse cellule comprennent qu'ils sont surveillés et peuvent disparaître. Tant que les domaines servent, les opérateurs croient à leur impunité — fenêtre pour les pincer en flagrant délit avec OFCOM. Le rapport TLP:AMBER NCSC enrichit le dossier pénal sans le compromettre. J-CAT permet la coordination Europol sans publication.",
                    "legal": "LSI art. 73 · Doctrine \"controlled delivery\" appliquée à cyber.",
                    "critical": False,
                    "next": 2
                },
                {
                    "text": "Tu acceptes le take-down VPS immédiat : sauver les victimes potentielles avant tout. Une nouvelle vague de victimes serait inacceptable.",
                    "ok": False,
                    "pts": 7,
                    "fb": "⚠️ <strong>Choix éthique défendable mais opérationnellement défaitiste.</strong> Le dilemme est réel : préserver les futures victimes vs préserver la traque. Mais la pratique inter-services internationales (FBI, NCA UK, BKA DE) sur ces dossiers est de maintenir l'infrastructure le temps de pincer l'opération à la source — sinon le groupe se reforme ailleurs en 2 semaines. Compromis acceptable : faire bloquer chez les opérateurs suisses (PostFinance/UBS/CFF ont déjà bloqué les URL en interne) tout en laissant le VPS actif côté Moldavie pour les opérateurs.",
                    "legal": "Doctrine \"controlled delivery\" vs principe de précaution.",
                    "critical": False,
                    "next": 2
                },
                {
                    "text": "Tu décides de gérer en interne sans NCSC : la coordination fédérale ralentit, et l'affaire est cantonale. Tu transmettras le dossier une fois bouclé.",
                    "ok": False,
                    "pts": 4,
                    "fb": "❌ <strong>Isolement contre-productif.</strong> NCSC a déjà la moitié du puzzle (infrastructure web phishing) — refuser leur coopération signifie reconstituer les mêmes éléments pendant 3 semaines. Et J-CAT/Europol ouvrent les portes des autorités étrangères (Moldavie, Bulgarie) que tu vas devoir solliciter à l'acte 6. Sans le tampon NCSC, la coopération internationale devient un parcours du combattant.",
                    "legal": "LSI art. 73 (mission de coordination NCSC) · Pratique inter-cantonale.",
                    "critical": False,
                    "next": 2
                }
            ]
        },
        {
            "phase": "📰 10h30 — Risque de fuite vers la presse",
            "situation": "L'inspectrice Dubuis te prévient : une journaliste de la <em>Tribune de Genève</em> a appelé son service public. Une victime des Eaux-Vives lui a raconté son histoire et la journaliste veut publier dès demain. Article prévu : « Vague de smishing à Genève — PostFinance et UBS dans le viseur ». La journaliste demande confirmation officielle des chiffres et une réaction du Ministère public.",
            "law": "<strong>Art. 73 al. 2 CPP</strong> (secret de fonction) · <strong>Art. 320 CP</strong> (violation du secret de fonction) · <strong>Loi sur l'information du public</strong> (LIPAD GE)",
            "question": "<strong>Comment gères-tu la presse ?</strong>",
            "choices": [
                {
                    "text": "(1) Tu appelles personnellement la journaliste pour <strong>demander un délai de publication de 5 jours</strong> en lui exposant (sous embargo) les enjeux de l'enquête en cours. (2) En cas de refus, <strong>communiqué minimum</strong> : confirmation qu'une enquête est en cours pour « smishing bancaire ciblant les habitants », sans chiffres exacts, sans mention de la fausse antenne. (3) <strong>Briefing à huis clos</strong> à la rédaction de la Tribune (lendemain matin) pour cadrer la couverture sans gêner l'enquête.",
                    "ok": True,
                    "pts": 18,
                    "fb": "✅ <strong>Gestion presse mature.</strong> La pratique du MP-GE est de cultiver une relation de confiance avec les médias professionnels (Tribune, RTS, Le Temps) : 80 % du temps, un embargo de quelques jours est accepté en échange d'un briefing détaillé ultérieur. Le communiqué minimum protège l'enquête en confirmant juste \"il y a quelque chose\" sans révéler la technique. Le briefing huis clos établit la relation pour les suites — et permet à la presse de diffuser une mise en garde générale (\"méfiance face aux SMS bancaires\") qui peut limiter les nouvelles victimes sans révéler la traque.",
                    "legal": "Art. 73 al. 2 CPP · LIPAD GE · Pratique MP-GE.",
                    "critical": False,
                    "next": 3
                },
                {
                    "text": "Tu refuses tout commentaire et tu menaces de poursuites en cas de publication sur la base de l'art. 73 al. 2 CPP (secret de l'enquête).",
                    "ok": False,
                    "pts": 6,
                    "fb": "⚠️ <strong>Réaction défensive contre-productive.</strong> L'art. 73 al. 2 CPP s'applique aux <em>participants à la procédure</em>, pas aux journalistes. La menace de poursuite est juridiquement infondée — ce sera l'occasion pour la journaliste d'écrire un article sur \"l'opacité du procureur\". La Tribune publiera quand même, mais avec un angle hostile. Tu auras gagné une ennemie dans la rédaction et la coopération future devient plus difficile.",
                    "legal": "Art. 73 al. 2 CPP (limites du secret) · Liberté de la presse art. 17 Cst.",
                    "critical": False,
                    "next": 3
                },
                {
                    "text": "Tu acceptes la publication immédiate (transparence démocratique) et tu fournis tous les chiffres officiels : 89 plaintes GE + 65 ailleurs, préjudice 4M CHF, suspicion de fausse antenne-relais.",
                    "ok": False,
                    "pts": 2,
                    "fb": "❌ <strong>Désastre opérationnel.</strong> Publication des chiffres + mention de \"fausse antenne-relais\" = les opérateurs derrière comprennent immédiatement qu'ils sont identifiés et démontent l'équipement le soir même. Tu viens de griller la traque OFCOM avant même qu'elle ne commence. La presse aura ses chiffres mais l'enquête est morte. Cas réel similaire : opération anti-skimming de Brisbane 2022 grillée par une fuite presse, refonte complète de la doctrine policière australienne après.",
                    "legal": "Art. 73 al. 2 CPP · Doctrine de l'enquête active.",
                    "critical": True,
                    "next": 3
                }
            ]
        },
        {
            "phase": "✅ 14h00 — Synthèse de la journée",
            "situation": "Le pattern est verrouillé. OFCOM va déployer 3 sondes Rohde&Schwarz mobiles cette nuit dans les quartiers identifiés. SCPT (Marc Vauthier) a confirmé la disponibilité technique pour l'interception. NCSC fournira le rapport TLP:AMBER d'ici 48h. Plaintes intercantonales VD et ZH ajoutées à la procédure unique. Tu prépares le dossier pour demander une <strong>autorisation de surveillance secrète art. 269 CPP</strong> au TMC.",
            "law": "<strong>Art. 269 CPP</strong> (surveillance des télécommunications) · <strong>Art. 269bis CPP</strong> (mesures pour l'identification des usagers) · <strong>Art. 274 CPP</strong> (décision du TMC)",
            "question": "<strong>Quel cadre proposes-tu au TMC pour l'autorisation ?</strong>",
            "choices": [
                {
                    "text": "Demande sur <strong>art. 269bis CPP</strong> (mesures particulières pour l'identification des usagers — applicable aux fausses cellules sans interception du contenu des communications légitimes). Subsidiarité démontrée : aucune autre méthode n'identifie l'opérateur de la fausse cellule. Proportionnalité : durée 30 jours maximum, périmètre 4 quartiers ciblés. Pièces jointes : rapport intermédiaire OFCOM + rapport FOR-GE sur les CGI anormaux + 89 plaintes consolidées.",
                    "ok": True,
                    "pts": 24,
                    "fb": "✅ <strong>Cadre juridique optimal.</strong> L'art. 269bis CPP est précisément l'article créé en 2018 pour les IMSI catchers et fausses cellules — il distingue les mesures « pour l'identification des usagers » (sans interception du contenu) des mesures « pour l'interception du contenu » de l'art. 269. Demander 269bis plutôt que 269 stricto sensu est <em>plus facile à obtenir</em> (subsidiarité moins exigeante) et juridiquement plus précis. Les pièces jointes (rapports OFCOM + FOR + plaintes consolidées) répondent au standard du TMC GE (ATF 6B_47/2021 sur la motivation).",
                    "legal": "Art. 269bis CPP · ATF 6B_47/2021 · Doctrine Bénédict §1267.",
                    "critical": False,
                    "next": None
                },
                {
                    "text": "Demande sur <strong>art. 269 CPP</strong> classique avec interception du contenu de toutes les communications cellulaires dans le périmètre (pour capter aussi les communications des opérateurs entre eux).",
                    "ok": False,
                    "pts": 8,
                    "fb": "⚠️ <strong>Demande disproportionnée.</strong> L'art. 269 CPP autorise l'interception du <em>contenu</em> des communications — c'est l'arme nucléaire des mesures de contrainte. La proportionnalité (art. 197 CPP) exige l'usage de la mesure la moins intrusive possible. Ici, pour identifier l'opérateur de la fausse cellule, on n'a pas besoin du contenu des conversations des passants : juste les métadonnées de connexion à la cellule suspecte. Demander 269 stricto sensu va se faire refuser par le TMC ou imposer des restrictions qui complexifieront l'analyse.",
                    "legal": "Art. 269 vs 269bis CPP · Art. 197 CPP (proportionnalité).",
                    "critical": False,
                    "next": None
                },
                {
                    "text": "Demande sur <strong>art. 273 CPP</strong> (données de raccordement et fournitures techniques) qui est plus simple à obtenir et ne demande pas d'autorisation du TMC.",
                    "ok": False,
                    "pts": 5,
                    "fb": "⚠️ <strong>Erreur de qualification.</strong> L'art. 273 CPP couvre les données <em>rétroactives</em> chez les opérateurs autorisés (qui était connecté à telle cellule légitime tel jour). Il ne couvre pas la surveillance d'une fausse cellule active. La fausse cellule n'est pas un \"opérateur\" au sens de la LTC — c'est l'objet de l'infraction. On a besoin d'autorisations actives pour la surveiller, pas de données rétroactives sur Swisscom.",
                    "legal": "Art. 273 CPP vs 269bis CPP.",
                    "critical": False,
                    "next": None
                }
            ]
        }
    ],
    "debrief": "<p><strong>La coordination inter-services en cas SMS Blaster.</strong> Le jeu d'acteurs est dense : Ministère public cantonal (poursuite), Brigade financière (enquête de terrain), FOR-GE (forensique mobile), OFCOM (autorité radio + sondes), SCPT (interception légale chez opérateurs autorisés), NCSC/MELANI (renseignement cyber + coordination internationale), Europol J-CAT (canal européen). Chacun a un mandat légal différent — confondre les rôles ou en ignorer un = trou dans le dossier qui sera exploité à l'audience.</p><p><strong>Art. 269 vs 269bis CPP : la nuance fondamentale.</strong> L'art. 269bis CPP a été introduit en 2018 (rév. CPP) précisément pour les IMSI catchers et fausses cellules. Il permet d'utiliser des techniques d'identification (sondes RF, dispositifs de localisation, balise IMEI) sans interception du contenu. Bénéfice : subsidiarité moins exigeante (les autres moyens ne suffisent jamais à identifier une fausse cellule), durée plus souple (jusqu'à 6 mois renouvelable), périmètre géographique flexible. Si vous avez besoin du contenu (très rare pour cette typologie d'affaire), il faut un cumul 269+269bis avec motivation séparée.</p><p><strong>Pourquoi le contrôle des fuites est critique.</strong> Le SMS Blaster est un équipement mobile (un van, une voiture, parfois un sac à dos avec batteries lithium). Les opérateurs derrière ont un cycle de fonctionnement court (15-25 min par session) et changent de quartier. Si l'information \"la police surveille les fausses cellules à Genève\" sort, l'équipement disparaît en quelques heures — vente sur marché noir ou expédition à l'étranger. La gestion presse + la sélection des canaux internes + le secret professionnel des partenaires (OFCOM, NCSC, opérateurs) sont les piliers du succès de la traque.</p><p><strong>Ce qui se passe ensuite.</strong> Acte 3 : autorisation TMC obtenue, OFCOM déploie les sondes, Swisscom Security collabore. La piste télécom devient triangulation RF active.</p>",
    "npcs": ["procureur_mp_ge_cybercrime", "inspectrice_brigade_financiere_ge", "ofcom_spectrum_lead_be", "ncsc_govcert_lead", "ingenieur_swisscom_security"],
    "regionDetail": REGION_DETAIL,
    "region": "GE",
    "realCase": False,
    "role": "magistrat"
}


# ═══════════════════════════════════════════════════════════════
# Sauvegarde des 2 premiers actes pour validation incrémentale
# (les 5 suivants suivent dans la 2e partie du script)
# ═══════════════════════════════════════════════════════════════
def main():
    root = Path(__file__).resolve().parent
    if (root / 'data' / 'campaigns.json').exists() and (root / 'data' / 'npcs.json').exists():
        # Repo CAS-IN détecté à la racine
        pass
    else:
        # Repo dans un sous-dossier ?
        root = root.parent
        if not ((root / 'data' / 'campaigns.json').exists()):
            print('[error] Racine CAS-IN introuvable. Exécuter depuis le repo ou son parent.', file=sys.stderr)
            sys.exit(1)
    print(f'[info] Racine CAS-IN : {root}')

    # 1. Ajout des nouveaux NPCs
    npcs_path = root / 'data' / 'npcs.json'
    with open(npcs_path) as f:
        npcs_data = json.load(f)
    added_npcs = 0
    for npc_id, npc_def in NEW_NPCS.items():
        if npc_id in npcs_data['npcs']:
            print(f'  ⏭ NPC {npc_id} déjà présent, skip')
        else:
            npcs_data['npcs'][npc_id] = npc_def
            added_npcs += 1
    npcs_data['$generated_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
    with open(npcs_path, 'w', encoding='utf-8') as f:
        json.dump(npcs_data, f, ensure_ascii=False, indent=2)
    print(f'  ✅ {added_npcs} NPCs ajoutés (total : {len(npcs_data["npcs"])})')

    # 2. Écriture des scènes (acte 1 et 2 dans cette version du script ; 3-7 dans la suite)
    scenes_dir = root / 'scenes'
    scenes_dir.mkdir(parents=True, exist_ok=True)
    scenes_to_write = [SCENE_1, SCENE_2]
    for scene in scenes_to_write:
        out_path = scenes_dir / (scene['id'] + '.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(scene, f, ensure_ascii=False, indent=2)
        print(f'  ✅ {out_path.name}')

    print(f'\n[ok] Acte 1 et Acte 2 écrits. Lancez le script complet pour les actes 3-7 + campaign + counts.')


if __name__ == '__main__':
    main()
