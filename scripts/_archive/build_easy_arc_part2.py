#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v2.63 — Génération des scènes 3, 4, 5 du parcours easy.
Scène 3 : Fake news avant votations (ZH)
Scène 4 : PME mot de passe faible (FR)
Scène 5 : Suspicions sur un collègue (NE)
"""
import json, os

OUTPUT_DIR = 'scenes'

# ═══════════════════════════════════════════════════════════════
# SCÈNE 3 — Fake news avant votations (ZH)
# ═══════════════════════════════════════════════════════════════

scene3 = {
    "id": "easy-fake-news-elections",
    "title": "Le Tweet Qui Ment",
    "icon": "📰",
    "difficulty": "easy",
    "atmosphere": "investigation",
    "narrative": {
        "success": "Vous avez correctement qualifié la situation : ce n'est pas (encore) un délit pénal, mais c'est de la désinformation à fort impact sociétal. Vous documentez sans outrepasser, transmettez aux bons services (GovCERT, plateforme), et préservez la liberté d'expression. Mme Brägger : « Tu as compris le piège : tout ce qui est moralement choquant n'est pas pénalement répréhensible. »",
        "degraded": "Vous avez identifié le problème mais une qualification juridique imprécise ou une saisine inadaptée. La désinformation persistera quelques heures de plus.",
        "failure": "Vous avez confondu l'illégal et l'immoral. Mme Brägger débriefe sèchement : « Le pénal ne sert pas à censurer ce qui ne nous plaît pas. C'est exactement la dérive qu'il faut éviter. »"
    },
    "tags": ["DÉSINFORMATION", "OSINT", "ÉLECTIONS", "DROIT", "RÉSEAUX SOCIAUX", "EASY"],
    "legalRefs": [
        "Art. 282 CP",
        "Art. 173 CP",
        "Art. 16 Cst.",
        "Art. 17 Cst.",
        "RGPD"
    ],
    "intro": "Vendredi 14h, Kapo Zürich, Brigade des médias numériques. À 9 jours d'une votation cantonale sensible (initiative sur le logement urbain), un compte X anonyme @zh_truth_2026 publie une infographie « officielle » sur les coûts annoncés du projet, citant des chiffres de l'Office fédéral du logement (OFL). Le compte a été créé hier, 4'200 abonnés en 18h, 31'000 retweets, vu par 280'000 personnes. L'infographie est <strong>fausse</strong> : les chiffres OFL n'existent pas, les pourcentages sont fabriqués. Une journaliste du Tages-Anzeiger appelle votre brigade : « Vous allez faire quoi ? » Mme Brägger est connectée en visio depuis Saint-Gall pour vous épauler.",
    "alertLevel": "📢 DÉSINFORMATION ACTIVE — Impact démocratique potentiel",
    "objectives": [
        {"icon": "⚖️", "text": "Distinguer désinformation immorale et délit pénal (art. 282 CP / 173 CP)"},
        {"icon": "🔍", "text": "Faire de l'OSINT propre sur le compte sans pivoter vers du quasi-flicage"},
        {"icon": "🤝", "text": "Identifier le bon canal de signalement (police vs GovCERT vs plateforme)"}
    ],
    "debrief": "<p>La <strong>désinformation politique</strong> en CH se heurte au socle constitutionnel : <strong>art. 16 Cst.</strong> (liberté d'opinion) + <strong>art. 17 Cst.</strong> (liberté des médias). Le pénal n'intervient que dans des cas précis :</p><ul><li><strong>Art. 282 CP</strong> — Fraude électorale : <em>uniquement</em> si manipulation matérielle des urnes/bulletins/résultats. Les fausses infos diffusées ne tombent <strong>pas</strong> dans 282.</li><li><strong>Art. 173 CP</strong> — Diffamation : si la cible est une <em>personne identifiable</em>. Pas pour un projet ou des chiffres abstraits.</li><li><strong>Art. 156 CP</strong> — Si extorsion. <strong>Art. 251 CP</strong> — Si faux dans les titres avec document forgé.</li></ul><p>La doctrine GovCERT/OFCS et fedpol : <strong>signaler à la plateforme</strong> (Trust & Safety X), <strong>contre-narratif officiel</strong> (l'OFL publie un démenti), <strong>pas de retrait pénal</strong> sauf délit caractérisé. La régulation des plateformes relève de la LPD pour les données personnelles, pas du pénal.</p><p><strong>Référence CH</strong> : la stratégie de la Confédération contre la désinformation (Conseil fédéral 2024) privilégie la <strong>résilience démocratique</strong> (éducation aux médias, transparence) plutôt que la criminalisation.</p>",
    "steps": [
        {
            "phase": "⚖️ La qualification juridique",
            "situation": "La journaliste vous demande : « Est-ce que c'est un délit ? Vous pouvez ordonner le retrait du compte ? » Mme Brägger en visio : « Comment tu réponds ? Sois précis sur le droit. »",
            "law": "<strong>Art. 282 CP</strong> — Fraude électorale (manipulation matérielle).<br><strong>Art. 16-17 Cst.</strong> — Libertés d'opinion et de presse.",
            "question": "<strong>Quelle est la qualification correcte ?</strong>",
            "choices": [
                {
                    "text": "« C'est de la désinformation préjudiciable mais ce n'est pas pénal en l'état. L'art. 282 CP vise la fraude matérielle (urnes, bulletins, dépouillement), pas les fausses infos. Pas de personne identifiable diffamée → 173 CP exclu. On peut signaler à la plateforme et publier un démenti officiel, mais on ne peut pas ordonner un retrait pénal. »",
                    "ok": True, "pts": 25,
                    "fb": "Réponse parfaite. Vous distinguez correctement le pénal (étroit, 282 CP = manipulation matérielle) et la désinformation (gérée par la plateforme + contre-narratif). C'est exactement la doctrine du fedpol et de l'OFCS. Refuser de criminaliser ce qui est immoral mais pas illégal protège la liberté d'expression.",
                    "legal": "Art. 282 CP + 16-17 Cst. — Distinction claire.",
                    "critical": False, "next": 1
                },
                {
                    "text": "« C'est de la fraude électorale (art. 282 CP) — manipuler une votation par des fausses infos. On saisit le procureur, ordonnance de retrait sous 24h, identification du titulaire via X. »",
                    "ok": False, "pts": -25,
                    "fb": "Erreur de qualification grave. L'art. 282 CP exige une <strong>manipulation matérielle</strong> (bourrage d'urne, falsification de bulletin, altération du dépouillement). La diffusion d'infos fausses, même délibérée, ne relève PAS de 282. Confondre désinformation et fraude électorale = base de toutes les dérives autoritaires. Mme Brägger : « Non. Lis l'article. »",
                    "legal": "Art. 282 CP — Définition matérielle stricte.",
                    "critical": True, "next": 1
                },
                {
                    "text": "« On va voir. Disons que c'est pénal pour faire bouger X et discuter du fond. La menace de poursuites suffit souvent à faire retirer le contenu. »",
                    "ok": False, "pts": -30,
                    "fb": "📍 DÉRIVE PROCÉDURALE GRAVE. Bluffer sur un délit qu'on sait inexistant pour faire pression sur une plateforme = <strong>abus d'autorité</strong> (art. 312 CP). Au-delà du droit, c'est l'inverse de la mission : la police protège la liberté d'expression, elle ne l'instrumentalise pas. Mme Brägger : « C'est exactement ce qu'on ne fait pas, jamais. »",
                    "legal": "Art. 312 CP — Abus d'autorité (instruction par bluff).",
                    "critical": True, "next": "end"
                }
            ]
        },
        {
            "phase": "🔍 L'OSINT propre",
            "situation": "Mme Brägger : « Bon. Pas de pénal. Mais on peut faire de l'OSINT sur le compte pour comprendre l'origine. Comment tu procèdes ? »",
            "law": "<strong>OSINT licite</strong> — Sources publiques uniquement.<br><strong>LPD 2023</strong> — Protection des données personnelles s'applique aussi aux personnes derrière les comptes anonymes.",
            "question": "<strong>Comment menez-vous l'OSINT ?</strong>",
            "choices": [
                {
                    "text": "Vous notez : (a) date de création du compte (hier), (b) timezone des publications (UTC+1, compatible avec Europe centrale), (c) outils d'analyse comme Botometer pour score d'activité, (d) cross-check sur les hashtags utilisés et l'écosystème de comptes amplifiant. Tout en sources publiques, sans pivot vers données privées.",
                    "ok": True, "pts": 25,
                    "fb": "OSINT exemplaire. Vous restez sur des données <strong>publiquement accessibles</strong> (création, timezone, métadonnées de tweet, comptes amplifiant), vous utilisez des outils standards (Botometer, OSINT-X), vous ne pivotez pas vers de l'identification individuelle sans base légale. C'est exactement la pratique GovCERT.",
                    "legal": "OSINT licite + LPD respectée — Cadre propre.",
                    "critical": False, "next": 2
                },
                {
                    "text": "Vous demandez à un contact informel chez X (un ancien étudiant qui y travaille maintenant) de vous donner discrètement l'IP de connexion du compte « entre nous, pour gagner du temps ».",
                    "ok": False, "pts": -35,
                    "fb": "📍 INFRACTION GRAVE. (1) Soustraction de données personnelles via canal non officiel = art. 179novies CP + art. 320 CP (du contact). (2) Sans réquisition formelle, les données sont irrecevables. (3) Cela compromet votre carrière ET celle du contact. Le canal officiel (réquisition LSCPT ou demande d'entraide via art. 32b LPD) prend plus de temps mais c'est le seul valide.",
                    "legal": "Art. 179novies CP + 320 CP — Soustraction par canal informel.",
                    "critical": True, "next": "end"
                },
                {
                    "text": "Vous créez un faux compte X avec photo générée par IA pour suivre @zh_truth_2026 et engager la conversation, espérant qu'il fasse une erreur révélatrice.",
                    "ok": False, "pts": -20,
                    "fb": "Investigation sous couverture (art. 285a-289 CPP) sans autorisation = vice de procédure. Pour une simple désinformation non pénale, c'est de toute façon disproportionné. La création de faux comptes police hors cadre légal viole aussi les CGU de X.",
                    "legal": "Art. 285a-289 CPP — Cadre strict des investigations sous couverture.",
                    "critical": False, "next": 2
                }
            ]
        },
        {
            "phase": "🤝 La saisine adéquate",
            "situation": "Vous avez maintenant un dossier OSINT propre : compte créé hier, métadonnées indiquent un cluster de 12 comptes liés (mêmes timings, mêmes hashtags), bot score élevé (0.78 sur 1). Mme Brägger : « Maintenant : à qui tu transmets, et qu'est-ce que tu publies ? »",
            "law": "<strong>GovCERT.ch</strong> — Équipe nationale réponse incidents cyber.<br><strong>Trust & Safety X</strong> — Voie officielle pour signalement plateforme.",
            "question": "<strong>Quelle séquence de transmission ?</strong>",
            "choices": [
                {
                    "text": "(1) Signaler à GovCERT.ch (cluster de bots = potentielle ingérence étrangère, hors votre compétence cantonale). (2) Saisir le canal Trust & Safety X via portail officiel. (3) Informer la chancellerie cantonale ZH pour démenti officiel coordonné avec OFL. (4) Pas de communiqué police séparé : laisser les autorités politiques cadrer la réponse démocratique.",
                    "ok": True, "pts": 25,
                    "fb": "Séquence parfaite. Chaque acteur reste dans son rôle : GovCERT pour la dimension nationale/étrangère, X pour le retrait technique, chancellerie pour la communication politique. La police reste effacée, c'est le bon réflexe : la démocratie répond à la désinformation par plus d'information, pas par la répression.",
                    "legal": "Doctrine GovCERT + Conseil fédéral 2024 — Résilience démocratique.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "Communiqué de presse de la Kapo Zürich qualifiant le compte de « manipulation préoccupante » et demandant son retrait public, repris par les médias.",
                    "ok": False, "pts": -15,
                    "fb": "Mauvaise pratique. La police prend position politiquement = atteinte au principe de neutralité institutionnelle. La désignation publique d'un compte comme « manipulation » sans procédure pénale = potentielle diffamation institutionnelle. Le rôle de la police est technique, pas politique.",
                    "legal": "Principe de neutralité institutionnelle — Police hors politique.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "Demande d'identification au TMC pour obtenir le titulaire du compte via X (réquisition art. 273 CPP), ouverture d'une procédure préliminaire pour « atteinte à la formation de l'opinion publique ».",
                    "ok": False, "pts": -25,
                    "fb": "Pas de base pénale → pas de réquisition possible. L'art. 273 CPP exige une infraction. Inventer un « délit d'atteinte à la formation de l'opinion publique » qui n'existe pas en CH = abus de procédure. Le TMC refusera et vous expliquera la doctrine.",
                    "legal": "Art. 273 CPP — Réquisition exige infraction caractérisée.",
                    "critical": False, "next": "end"
                }
            ]
        }
    ],
    "npcs": ["sg_polcyber_chief", "govCERT_analyste", "ge_avocat_frontaliers"],
    "regionDetail": {"code": "ZH", "flag": "🇨🇭", "name": "Zurich"}
}

# ═══════════════════════════════════════════════════════════════
# SCÈNE 4 — PME et mots de passe (FR/Fribourg)
# ═══════════════════════════════════════════════════════════════

scene4 = {
    "id": "easy-pme-mot-passe-faible",
    "title": "Gruyère2024!",
    "icon": "🔑",
    "difficulty": "easy",
    "atmosphere": "discussion",
    "narrative": {
        "success": "Vous transformez une situation gênante en levier pédagogique. La PME comprend les enjeux sans être humiliée, met en place MFA + gestionnaire de mots de passe sous 2 semaines, et la collaboratrice repart sans honte. Mme Brägger : « Tu as fait passer le message sans casser personne. C'est ça, le métier : la sécurité humaine. »",
        "degraded": "Le message technique passe mais la dimension humaine est mal gérée. La collaboratrice se sent fautive, la PME implémente sans conviction.",
        "failure": "Vous avez stigmatisé. La PME se ferme, la collaboratrice démissionne 3 mois plus tard. Mme Brägger : « La cyber sans pédagogie, c'est de la posture. »"
    },
    "tags": ["CYBERHYGIÈNE", "MFA", "PME", "FORMATION", "GESTION DE CRISE", "EASY"],
    "legalRefs": [
        "LPD 2023 Art. 8",
        "LPD 2023 Art. 24",
        "Art. 143bis CP",
        "Art. 144bis CP"
    ],
    "intro": "Mardi 10h, Bulle, fromagerie Tinguely & Fils SA. M. Tinguely (62 ans, 31 ans d'expérience d'affineur de gruyère AOP) vous a appelé : depuis hier, des emails étranges semblent partir de l'adresse de sa secrétaire administrative — factures bizarres à des fournisseurs italiens. Vous êtes consultant·e cyber bénévole pour le réseau cantonal des PME. Sur place, vous découvrez que la collaboratrice utilise <strong>Gruyere2024!</strong> comme mot de passe pour TOUT (Outlook, Twint pro, banque, intranet). Elle vous le dit sans détour : « C'est facile à retenir et tout le monde dans la boîte connaît son mot de passe, c'est pratique pour les remplacements. » Mme Brägger vous écoute en haut-parleur depuis Saint-Gall.",
    "alertLevel": "🔓 COMPROMISSION ACTIVE — Compromission probable d'un compte mail",
    "objectives": [
        {"icon": "🤝", "text": "Préserver la collaboratrice (pas de stigmatisation)"},
        {"icon": "🔐", "text": "Faire passer le message MFA + gestionnaire de mots de passe"},
        {"icon": "📋", "text": "Évaluer si notification PFPDT nécessaire (LPD 2023 Art. 24)"}
    ],
    "debrief": "<p>Les <strong>PME suisses</strong> représentent 99% du tissu économique mais ont rarement un RSSI dédié. La sensibilisation y demande une approche fondamentalement différente : <strong>jamais culpabiliser</strong> la personne qui a la pratique fragile, toujours la traiter comme victime du contexte (manque de formation, manque d'outils).</p><p>Trois actions concrètes pour une PME post-incident :</p><ol><li><strong>MFA partout</strong> où c'est possible (Outlook, banque, comptabilité). Coût : 0 CHF, 30 min de paramétrage.</li><li><strong>Gestionnaire de mots de passe</strong> (Bitwarden, 1Password) : un seul mot de passe maître à retenir, le reste est unique et fort. Bitwarden gratuit pour les besoins basiques.</li><li><strong>Politique de partage explicite</strong> : si plusieurs personnes doivent accéder à une boîte mail, c'est une <strong>boîte partagée</strong> avec accès délégué (Outlook 365), pas un partage de mot de passe.</li></ol><p><strong>Référence CH</strong> : LPD 2023 art. 8 oblige le responsable du traitement (ici la PME) à mettre en place « les mesures techniques et organisationnelles propres à garantir une sécurité adéquate ». Un mot de passe partagé = manquement à l'art. 8. En cas de fuite, la PME est responsable.</p>",
    "steps": [
        {
            "phase": "🤝 La première réaction",
            "situation": "La collaboratrice est dans la pièce, gênée. M. Tinguely est tendu. Elle attend votre réaction. Mme Brägger murmure dans l'oreillette : « Comment tu démarres ? »",
            "law": "<strong>Pédagogie de sécurité</strong> — Renforcer les comportements positifs (signalement) plutôt que stigmatiser.",
            "question": "<strong>Quels mots utilisez-vous en premier ?</strong>",
            "choices": [
                {
                    "text": "« Madame, vous avez bien fait de remarquer les mails bizarres et d'alerter — c'est exactement le bon réflexe. On va regarder ensemble ce qui s'est passé et mettre des outils plus simples en place. Personne n'est en cause ici, c'est un problème de moyens techniques, pas un problème de personnes. »",
                    "ok": True, "pts": 25,
                    "fb": "Ouverture parfaite. Vous : (1) félicitez le bon réflexe (le signalement), (2) responsabilisez collectivement (« on va regarder »), (3) rejetez explicitement la culpabilisation (« problème de moyens, pas de personnes »). C'est ce qui débloque la suite : la collaboratrice va parler ouvertement, M. Tinguely va investir dans les outils.",
                    "legal": "Doctrine pédagogie cyber — Renforcement positif.",
                    "critical": False, "next": 1
                },
                {
                    "text": "« Le mot de passe « Gruyere2024! » est extrêmement faible — un dictionnaire le casse en 3 secondes. Et le partager avec toute l'entreprise, c'est une violation manifeste de la LPD. Vous m'expliquez comment vous en êtes arrivés là ? »",
                    "ok": False, "pts": -25,
                    "fb": "Ton accusatoire. Tout est techniquement vrai mais l'effet humain est désastreux : la collaboratrice se ferme, M. Tinguely se sent agressé chez lui. Conséquence : ils écouteront le reste mais sans appliquer. La sécurité ne s'impose pas, elle se cultive.",
                    "legal": "Pédagogie cyber — Évite la stigmatisation.",
                    "critical": False, "next": 1
                },
                {
                    "text": "« Bon. Article 8 de la LPD. Article 143bis CP si quelqu'un a piraté. On documente tout ça maintenant pour la procédure pénale et la notification PFPDT. »",
                    "ok": False, "pts": -20,
                    "fb": "Trop juridique d'emblée. Avant la procédure, il y a la <strong>compréhension humaine</strong> de ce qui s'est passé. Sortir des articles devant des fromagers fribourgeois sans explication = leur faire comprendre qu'ils sont dans une procédure dont ils ne maîtrisent rien. Résultat : ils appellent leur fiduciaire au lieu de coopérer.",
                    "legal": "Pédagogie + droit — D'abord humain, ensuite juridique.",
                    "critical": False, "next": 1
                }
            ]
        },
        {
            "phase": "🔐 Les outils concrets",
            "situation": "L'ambiance s'est détendue. M. Tinguely est ouvert : « Bon, qu'est-ce qu'il faut faire concrètement ? » Mme Brägger : « Pratique, simple, applicable cette semaine. »",
            "law": "<strong>NIST SP 800-63B</strong> — Recommandations modernes sur les mots de passe (longueur > complexité forcée).<br><strong>MFA</strong> — Multi-Factor Authentication.",
            "question": "<strong>Quelle est votre recommandation principale ?</strong>",
            "choices": [
                {
                    "text": "MFA SMS sur Outlook et la banque cette semaine (gratuit, 30 min de paramétrage). Bitwarden gratuit déployé sur 2 mois pour générer des mots de passe uniques par service. Boîte mail partagée Outlook (vraie fonctionnalité native) pour remplacer le partage de mot de passe.",
                    "ok": True, "pts": 25,
                    "fb": "Plan parfait pour une PME : (1) MFA en priorité (impact immédiat sur le risque), (2) gestionnaire gratuit (pas d'argument financier), (3) solution propre au partage (boîte partagée native = pas besoin de procédure RH). Réaliste, gratuit, applicable en 2 semaines.",
                    "legal": "NIST SP 800-63B + bonnes pratiques PME — Standard.",
                    "critical": False, "next": 2
                },
                {
                    "text": "Migration complète vers Microsoft 365 Business Premium avec Conditional Access, Defender, Intune, et formation cyber obligatoire de 8h pour tous les employés.",
                    "ok": False, "pts": -10,
                    "fb": "Disproportionné pour une PME de 6 personnes. Coût : ~22 CHF/utilisateur/mois × 6 = 1'600 CHF/an juste pour la licence. Formation 8h × 6 = 48 h-personne. M. Tinguely va dire non. Les recommandations cyber pour PME doivent être <strong>graduées</strong> : commencer petit (MFA gratuit), monter en gamme si justifié.",
                    "legal": "Bonnes pratiques PME — Graduation des recommandations.",
                    "critical": False, "next": 2
                },
                {
                    "text": "Politique de mot de passe complexe (16 caractères, majuscules, chiffres, caractères spéciaux, changement tous les 30 jours), formalisée dans une charte signée par chaque employé.",
                    "ok": False, "pts": -15,
                    "fb": "Recommandation dépassée. NIST SP 800-63B (2017, mis à jour) a explicitement <strong>déconseillé</strong> les rotations forcées et la complexité excessive : ces règles poussent les utilisateurs à écrire les mots de passe sur post-it ou à utiliser des variations triviales (Gruyere2024! → Gruyere2025!). La doctrine moderne : <strong>longueur (passphrase) + unicité par service + MFA</strong>.",
                    "legal": "NIST SP 800-63B révisé — Rotation forcée déconseillée.",
                    "critical": False, "next": 2
                }
            ]
        },
        {
            "phase": "📋 La notification PFPDT",
            "situation": "Vous découvrez en analysant les logs Outlook que la boîte mail compromise contenait des données clients (RIB, adresses, contrats de fourniture de gruyère AOP) ET des données de salaires des 6 employés. La compromission est probable depuis ~3 jours. Mme Brägger : « PFPDT ? »",
            "law": "<strong>LPD 2023 Art. 24</strong> — Notification au PFPDT \"dans les meilleurs délais\" si risque élevé.<br><strong>LPD 2023 Art. 27</strong> — Information des personnes concernées.",
            "question": "<strong>Quelle est l'analyse de risque LPD ?</strong>",
            "choices": [
                {
                    "text": "Données salariales et clients = données qui peuvent porter atteinte si fuites. La compromission est avérée (mails frauduleux partis). Risque élevé probable → notification PFPDT \"dans les meilleurs délais\" (idéalement 72h, par analogie RGPD). Information des employés et clients concernés par lettre.",
                    "ok": True, "pts": 25,
                    "fb": "Analyse correcte. Vous évaluez à juste titre que le risque est élevé (données financières + nominatives + compromission active). La notification PFPDT n'est pas une option, c'est une obligation art. 24 LPD. La fenêtre 72h n'est pas formellement gravée dans la loi suisse mais s'aligne sur la pratique européenne et les attentes du PFPDT.",
                    "legal": "LPD 2023 art. 24 + 27 — Notification + information des personnes.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "PME de 6 personnes, pas de notification nécessaire. Le seuil PFPDT s'applique aux grandes entreprises ou aux fuites massives, pas à un cas isolé.",
                    "ok": False, "pts": -25,
                    "fb": "Il n'existe AUCUN seuil de taille dans la LPD. Toute violation à risque élevé doit être notifiée, que la PME ait 6 ou 6'000 employés. Conseiller le contraire = exposer M. Tinguely à des sanctions personnelles (art. 60-66 LPD : amende jusqu'à 250'000 CHF pour le responsable).",
                    "legal": "LPD 2023 art. 24 + 60 — Pas de seuil de taille.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "On attend de confirmer si une donnée a vraiment fuité (peut-être les attaquants ont juste envoyé des spams) avant de notifier — pas de panique, on a 30 jours.",
                    "ok": False, "pts": -20,
                    "fb": "Mauvaise interprétation. La LPD demande la notification \"dans les meilleurs délais\" dès qu'il y a <strong>présomption</strong> de violation à risque élevé, pas certitude de fuite effective. Attendre 30 jours = manquer la fenêtre. La présomption se lève par l'enquête postérieure, pas avant la notification.",
                    "legal": "LPD 2023 art. 24 — Présomption suffit, pas certitude.",
                    "critical": False, "next": "end"
                }
            ]
        }
    ],
    "npcs": ["sg_polcyber_chief", "tinguely", "fr_prosecutor_cyber"],
    "regionDetail": {"code": "FR", "flag": "🇨🇭", "name": "Fribourg"}
}

# ═══════════════════════════════════════════════════════════════
# SCÈNE 5 — Suspicions sur un collègue (NE)
# ═══════════════════════════════════════════════════════════════

scene5 = {
    "id": "easy-suspicions-collegues",
    "title": "Le Café Qui Inquiète",
    "icon": "☕",
    "difficulty": "easy",
    "atmosphere": "ethical",
    "narrative": {
        "success": "Vous protégez à la fois le collègue lanceur d'alerte (anonymat, pas d'instruction sauvage) ET la procédure pénale potentielle (pas de contamination de preuves). Mme Brägger : « Tu as compris la double exigence : préserver la source ET la preuve. »",
        "degraded": "Vous avez géré un des deux versants correctement mais pas l'autre. La source ou la procédure est partiellement compromise.",
        "failure": "Vous avez confondu rapidité d'action et solidité juridique. La procédure pénale ne tiendra pas, le lanceur d'alerte est exposé."
    },
    "tags": ["RH", "PROTECTION DES SOURCES", "PROCÉDURE INITIALE", "ÉTHIQUE", "DROIT", "EASY"],
    "legalRefs": [
        "Art. 321 CP",
        "Art. 320 CP",
        "Art. 158 CP",
        "Art. 73 CPP",
        "Art. 304 CPP",
        "LPD 2023 Art. 19"
    ],
    "intro": "Jeudi 16h, Université de Neuchâtel, cafétéria de l'institut d'informatique. Un développeur de l'équipe IT vous prend à part autour d'un café : « J'hésite à te dire ça. Hier, j'ai vu sur le PC du DAF (Directeur administratif et financier) un dossier ouvert nommé « comptes_personnels_jegerlehner » avec des relevés bancaires d'un nom de famille qui n'est pas le sien. Je suis tombé dessus en allant l'aider sur un problème d'imprimante. Je sais pas quoi faire. » Vous êtes RSSI (CISO) de l'UniNE. Mme Brägger est joignable par messagerie sécurisée Threema.",
    "alertLevel": "⚖️ ZONE GRISE — Soupçons de détournement, source non protégée",
    "objectives": [
        {"icon": "🤐", "text": "Protéger l'identité du lanceur d'alerte"},
        {"icon": "📋", "text": "Distinguer enquête interne et procédure pénale"},
        {"icon": "🔒", "text": "Préserver les preuves potentielles sans investigation sauvage"}
    ],
    "debrief": "<p>Les <strong>signalements internes en milieu professionnel</strong> sont parmi les situations les plus délicates en DFIR. Trois principes s'entrecroisent :</p><ol><li><strong>Protection du lanceur d'alerte</strong> : son identité ne doit pas remonter à la cible avant investigation. La LPD 2023 art. 19 et la jurisprudence CH (TF 4A_485/2017) protègent les sources internes de bonne foi.</li><li><strong>Préservation de la preuve</strong> : toute investigation IT directe sur le poste de la cible <strong>avant</strong> saisine du MP risque de contaminer les preuves (vice de procédure art. 141 CPP).</li><li><strong>Subsidiarité du pénal</strong> : avant de saisir le MP, il faut généralement passer par les RH/audit interne pour clarifier les faits, sauf si l'infraction est manifeste et urgente.</li></ol><p>Le bon réflexe : <strong>écouter sans interroger</strong> (pour ne pas créer un témoignage trop précis qui exposerait le collègue), <strong>documenter formellement</strong> (note interne anonymisée), <strong>saisir l'audit/conseil</strong> (interne ou externe), et laisser <strong>l'employeur décider</strong> de saisir le MP avec un dossier solide.</p><p><strong>Référence CH</strong> : la Loi sur la transparence (LTrans) et l'art. 321a CO (devoir de fidélité de l'employé) encadrent les signalements. Le canton de NE a une cellule cantonale de signalement éthique (depuis 2022).</p>",
    "steps": [
        {
            "phase": "🤐 La conversation initiale",
            "situation": "Le collègue attend votre réaction. Il est nerveux, regarde autour de lui. Mme Brägger sur Threema : « Premier objectif : ne pas le perdre. »",
            "law": "<strong>Protection des sources</strong> — LPD art. 19 + jurisprudence TF 4A_485/2017.",
            "question": "<strong>Comment menez-vous l'échange ?</strong>",
            "choices": [
                {
                    "text": "« Je t'écoute mais je vais te poser le minimum de questions pour ne pas créer un témoignage trop précis qui pourrait remonter à toi. Tu m'as dit l'essentiel : un dossier au nom suspect ouvert sur le PC du DAF. C'est suffisant pour que je documente. Tu es protégé : ton nom ne sortira pas de cette conversation sans ton accord. »",
                    "ok": True, "pts": 25,
                    "fb": "Approche idéale. Vous : (1) acceptez l'info sans la creuser (un témoignage trop détaillé = empreinte forte, donc traçable au lanceur), (2) explicitez la protection (le pacte de confidentialité), (3) gardez la main sur la suite (vous documenterez). C'est la bonne pédagogie de la confiance.",
                    "legal": "LPD art. 19 + protection des sources — Standard.",
                    "critical": False, "next": 1
                },
                {
                    "text": "« Raconte-moi tout en détail : quelle heure exactement, quels fichiers tu as vus, est-ce que tu as fait des captures, est-ce que d'autres collègues ont vu ? On a besoin d'éléments précis pour la suite. »",
                    "ok": False, "pts": -20,
                    "fb": "Trop intrusif au mauvais moment. Plus le témoignage est détaillé, plus il sera <strong>traçable</strong> au lanceur (qui était à proximité du PC du DAF à l'heure X ? Une seule personne souvent). Vous augmentez son risque sans bénéfice procédural : c'est le MP, pas vous, qui doit collecter le témoignage formel.",
                    "legal": "Protection des sources — Détail = traçabilité.",
                    "critical": False, "next": 1
                },
                {
                    "text": "« OK, on va régler ça maintenant. Viens, on va voir ensemble dans le bureau du DAF avant qu'il ne revienne, comme ça on aura les preuves directement. »",
                    "ok": False, "pts": -35,
                    "fb": "📍 INFRACTION GRAVE. (1) Pénétration non autorisée dans le bureau d'un cadre = potentielle violation de domicile (art. 186 CP). (2) Manipulation de preuves potentielles sans cadre légal = irrecevabilité totale (art. 141 CPP). (3) Le collègue qui vous accompagne devient co-auteur. La règle absolue : <strong>jamais d'investigation sauvage sans saisine RH ou MP</strong>.",
                    "legal": "Art. 186 CP + 141 CPP — Triple irrégularité.",
                    "critical": True, "next": "end"
                }
            ]
        },
        {
            "phase": "📋 La voie de signalement",
            "situation": "Le collègue est rassuré et part. Vous êtes seul·e avec l'information. Mme Brägger : « Maintenant, qui tu saisis et avec quoi ? »",
            "law": "<strong>Subsidiarité pénale</strong> — Audit interne avant MP sauf urgence/évidence.<br><strong>Art. 304 CPP</strong> — Forme de la dénonciation.",
            "question": "<strong>Quelle est la première saisine ?</strong>",
            "choices": [
                {
                    "text": "Vous rédigez une note interne anonymisée (pas de nom de source) et saisissez le service d'audit interne de l'UniNE et le DPO/délégué LPD. Ils décideront s'il faut un audit IT externe + saisine du MP. La direction reste informée mais la prise de décision est collégiale.",
                    "ok": True, "pts": 25,
                    "fb": "Voie correcte pour une institution publique. Vous respectez : (1) la subsidiarité (audit avant MP), (2) la collégialité (pas de saisine solo), (3) l'anonymisation. C'est la doctrine standard des cellules d'éthique des universités cantonales.",
                    "legal": "LTrans + procédures internes — Standard institutionnel.",
                    "critical": False, "next": 2
                },
                {
                    "text": "Saisine directe du MP cantonal NE par dénonciation art. 304 CPP, en envoyant la note avec le nom du DAF. Le MP a les compétences d'investigation, pas vous.",
                    "ok": False, "pts": -10,
                    "fb": "Pas faux mais précipité. Une dénonciation art. 304 CPP fondée sur un seul témoignage informel sans corroboration risque (1) d'être classée par le MP faute d'éléments, (2) d'exposer le DAF à une enquête publique potentiellement infondée. La voie audit interne d'abord est plus solide pour étayer.",
                    "legal": "Art. 304 CPP + subsidiarité — MP en dernier ressort.",
                    "critical": False, "next": 2
                },
                {
                    "text": "Vous accédez aux logs de l'AD pour vérifier si le DAF a effectivement ouvert ce dossier hier (ne pas perturber l'enquête future en agissant à chaud, mais collecter discrètement la preuve numérique).",
                    "ok": False, "pts": -25,
                    "fb": "📍 ERREUR PROCÉDURALE. En tant que RSSI, vous avez les <strong>droits techniques</strong> d'accéder aux logs, mais pas le <strong>droit légal</strong> de mener une investigation sur un employé identifié sans cadre formel (audit interne mandaté ou réquisition MP). Cela viole l'art. 328 CO (protection de la personnalité de l'employé) + LPD art. 19. Toute preuve obtenue ainsi sera irrecevable.",
                    "legal": "CO art. 328 + LPD art. 19 — Cadre formel obligatoire.",
                    "critical": False, "next": 2
                }
            ]
        },
        {
            "phase": "🔒 La préservation des traces",
            "situation": "L'audit interne est saisi, ils acceptent d'investiguer. Ils vous demandent en tant que RSSI : « Quelles traces faut-il préserver dès maintenant pour le cas où ça monte au pénal ? » Mme Brägger : « Tu n'enquêtes pas, mais tu peux protéger. »",
            "law": "<strong>Préservation de preuve</strong> — Geler sans modifier (ISO/IEC 27037).",
            "question": "<strong>Que demandez-vous à votre équipe IT ?</strong>",
            "choices": [
                {
                    "text": "Étendre la rétention des logs (AD, fichiers, mails) du DAF de 30 à 180 jours sans modifier les logs existants ni y accéder. Suspendre toute opération de maintenance qui écraserait les snapshots. Documenter ce que la rétention couvre. Personne d'autre n'y touche jusqu'à instruction de l'audit.",
                    "ok": True, "pts": 25,
                    "fb": "Excellent. Vous : (1) gelez sans modifier (ISO 27037 principe 1 : ne pas altérer l'original), (2) documentez (chaîne de custody embryonnaire), (3) limitez l'accès. Vous ne menez pas l'enquête, mais vous protégez les traces pour ceux qui la mèneront.",
                    "legal": "ISO/IEC 27037 — Préservation sans altération.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "Demander à l'admin AD de copier discrètement le dossier suspect du PC du DAF sur un serveur sécurisé pour avoir une copie en cas de suppression.",
                    "ok": False, "pts": -25,
                    "fb": "📍 CONTAMINATION DE PREUVE. Copier à chaud un dossier sans cadre légal (sans procès-verbal d'audit ou réquisition MP) = (1) altération de la chaîne de custody, (2) violation art. 328 CO, (3) preuve irrecevable art. 141 CPP. Il faut <strong>geler les conditions</strong> (rétention prolongée), pas <strong>copier le contenu</strong>.",
                    "legal": "Art. 141 CPP + 328 CO — Copie hors cadre = irrecevabilité.",
                    "critical": True, "next": "end"
                },
                {
                    "text": "Rien de spécial. Les logs standard suffisent, les enquêteurs sauront retrouver ce dont ils ont besoin le moment venu.",
                    "ok": False, "pts": -15,
                    "fb": "Trop passif. Les politiques de rétention standard suppriment souvent les logs après 30 ou 90 jours. Si l'enquête prend 4 mois (cas réaliste), les preuves auront disparu. Étendre la rétention pour la cible désignée est une mesure proportionnée et défendable.",
                    "legal": "Bonnes pratiques DFIR — Anticipation rétention.",
                    "critical": False, "next": "end"
                }
            ]
        }
    ],
    "npcs": ["sg_polcyber_chief", "ne_prosecutor_cyber", "unine_ciso"],
    "regionDetail": {"code": "NE", "flag": "🇨🇭", "name": "Neuchâtel"}
}

# ═══════════════════════════════════════════════════════════════
# Sauvegarde
# ═══════════════════════════════════════════════════════════════

with open(f'{OUTPUT_DIR}/easy-fake-news-elections.json', 'w', encoding='utf-8') as f:
    json.dump(scene3, f, ensure_ascii=False, indent=2)

with open(f'{OUTPUT_DIR}/easy-pme-mot-passe-faible.json', 'w', encoding='utf-8') as f:
    json.dump(scene4, f, ensure_ascii=False, indent=2)

with open(f'{OUTPUT_DIR}/easy-suspicions-collegues.json', 'w', encoding='utf-8') as f:
    json.dump(scene5, f, ensure_ascii=False, indent=2)

print(f"✓ Scène 3 (ZH fake-news)         : {len(json.dumps(scene3, ensure_ascii=False))} chars")
print(f"✓ Scène 4 (FR PME)               : {len(json.dumps(scene4, ensure_ascii=False))} chars")
print(f"✓ Scène 5 (NE collègues)         : {len(json.dumps(scene5, ensure_ascii=False))} chars")
print(f"\nReste à coder : scènes 6 (VS) + 7 (TI) + arc PNJ")
