#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v2.63 — Génération des 7 scènes easy "Premiers réflexes cyber" + arc PNJ.

Format strictement conforme au schéma canonique CAS-IN :
  Top-level : id, title, icon, difficulty, atmosphere, narrative,
              tags, legalRefs, intro, alertLevel, objectives, debrief,
              steps, npcs, regionDetail
  Step      : phase, situation, law, question, choices
  Choice    : text, ok, pts, fb, legal, critical, next

Mentor récurrent : Mme Brägger (sg_polcyber_chief) appelée par téléphone
ou consultée par messagerie sécurisée selon les scènes.
"""
import json, os

OUTPUT_DIR = 'scenes'
ARC_FILE = 'data/npc-arcs.json'

# ═══════════════════════════════════════════════════════════════
# SCÈNE 1 — Téléphone perdu dans le train (VD)
# ═══════════════════════════════════════════════════════════════

scene1 = {
    "id": "easy-mobile-perdu-train",
    "title": "Le Téléphone du TGV",
    "icon": "📱",
    "difficulty": "easy",
    "atmosphere": "police",
    "narrative": {
        "success": "Vos conseils permettent à la victime de limiter les dégâts. Verrouillage à distance déclenché à temps, sessions cloud coupées, plainte cantonale déposée correctement. Le téléphone est probablement perdu, mais les données restent inaccessibles. Vous montrez que les bons réflexes des 30 premières minutes valent plus que des heures d'investigation a posteriori. Mme Brägger vous félicite par WhatsApp : « Premier dossier propre. Bon début. »",
        "degraded": "Plusieurs étapes correctes mais une erreur de procédure ralentit l'enquête. Les données de la victime sont probablement compromises. Le dépôt de plainte tardif réduit les chances d'identification du voleur.",
        "failure": "Erreurs cumulées : perte de chance pour la victime, traces effacées, plainte mal orientée. Mme Brägger débriefe : « On apprend de ses premiers ratés. Mais maintenant tu sais. »"
    },
    "tags": ["ÉQUIPEMENT MOBILE", "LPD", "PROCÉDURE INITIALE", "VICTIMES", "DROIT", "EASY"],
    "legalRefs": [
        "Art. 139 CP",
        "Art. 143 CP",
        "Art. 304 CPP",
        "LPD 2023 Art. 24",
        "Art. 31 CPP"
    ],
    "intro": "16h42, gare de Lausanne. Une touriste française descend du IC1 Genève-St. Gall, panique : son iPhone 15 est resté dans la rame qui repart vers Berne. Sur le téléphone : photos, mails professionnels, accès Apple Pay, sessions Outlook 365 du cabinet d'avocats où elle travaille. Elle vous appelle : son cousin lausannois lui a donné votre numéro en disant « il bosse dans la cyber, il saura ». Vous êtes inspecteur·trice à la PolCant Vaud, section criminalité informatique. Mme Brägger (PolSG, IFC) — votre mentor·e — est en réunion mais lit ses messages. Vous avez 5 minutes avant le prochain arrêt CFF où la rame s'arrête.",
    "alertLevel": "📱 EXPOSITION DONNÉES — Téléphone non chiffré + sessions actives",
    "objectives": [
        {"icon": "⏱", "text": "Conseiller les bons gestes des 5 premières minutes"},
        {"icon": "📝", "text": "Orienter correctement le dépôt de plainte (canton compétent)"},
        {"icon": "🔐", "text": "Éviter les fausses bonnes idées (effacement immédiat sans backup)"}
    ],
    "debrief": "<p>La <strong>règle des 30 premières minutes</strong> en cas de perte/vol d'équipement mobile en CH : (1) localiser via Find My iPhone / Trouver mon appareil, (2) <strong>verrouiller à distance</strong> avec message de retour, (3) couper les sessions cloud actives, (4) appeler son opérateur pour bloquer la SIM, (5) déposer plainte au lieu de la perte (compétence territoriale art. 31 CPP).</p><p>L'<strong>effacement à distance</strong> est un compromis : on perd les chances de récupération mais on protège les données. À ne déclencher qu'après backup confirmé et après avoir épuisé les chances de récupération honnête (~24-48h).</p><p><strong>Référence CH</strong> : LPD 2023 art. 24 — la professionnelle (avocate) doit notifier au PFPDT toute violation de données à risque élevé. Un iPhone avec sessions Outlook 365 actives = données client potentiellement exposées = notification probable.</p>",
    "steps": [
        {
            "phase": "⏱ Les 5 premières minutes",
            "situation": "La touriste est paniquée mais joignable. Elle est devant le quai 4 de Lausanne, elle a son MacBook ouvert dans son sac. Le train file vers Berne — prochain arrêt à Fribourg dans 22 minutes.",
            "law": "<strong>Find My iPhone</strong> — Service Apple de localisation/verrouillage à distance via iCloud.<br><strong>Doctrine premier réflexe</strong> — Verrouillage > Effacement (l'effacement est définitif).",
            "question": "<strong>Quelle est votre première recommandation ?</strong>",
            "choices": [
                {
                    "text": "« Effacez immédiatement le téléphone à distance via iCloud — vos données professionnelles sont exposées, c'est la priorité absolue avant que quelqu'un ne le ramasse. »",
                    "ok": False, "pts": -20,
                    "fb": "Trop hâtif. L'effacement à distance est définitif et empêche toute récupération du téléphone. La bonne séquence : <strong>verrouiller</strong> d'abord (le téléphone devient une brique inutilisable mais pourrait être restitué), <strong>localiser</strong>, et <strong>n'effacer qu'en dernier recours</strong>. Beaucoup de téléphones perdus dans les CFF sont retournés au bureau des objets trouvés à Berne (taux de retour ~60% selon CFF).",
                    "legal": "Doctrine Apple + bonnes pratiques DFIR — Verrouillage avant effacement.",
                    "critical": False, "next": 1
                },
                {
                    "text": "« Ouvrez votre MacBook, allez sur iCloud.com, mode Perdu : verrouillez le téléphone avec un message de retour (« Téléphone perdu IC1 Genève-St. Gall, contactez +41... »). On ne wipe pas tout de suite : si quelqu'un d'honnête le trouve, il pourra le rendre. »",
                    "ok": True, "pts": 25,
                    "fb": "Réflexe parfait. Le mode « Perdu » verrouille l'écran (rend le téléphone inutile pour un voleur), affiche un message de contact (incite au retour honnête), et conserve la possibilité d'effacer plus tard si besoin. Vous gagnez du temps sans rien fermer.",
                    "legal": "Apple Find My + doctrine premier réflexe — Standard.",
                    "critical": False, "next": 1
                },
                {
                    "text": "« Appelez d'abord les CFF pour signaler la perte — le contrôleur peut le récupérer dans la rame avant Fribourg. C'est la voie la plus rapide pour retrouver l'objet sans compromettre les données. »",
                    "ok": False, "pts": 5,
                    "fb": "Pas faux mais pas suffisant. Les CFF mettront probablement 30-60 minutes à transmettre l'info au contrôleur ; entre-temps un voleur a tout le temps de fouiller le téléphone. Le verrouillage à distance prend 30 secondes et fonctionne même si quelqu'un l'a déjà ramassé. Combiner les deux est correct.",
                    "legal": "CFF objets trouvés + Find My — Combinaison recommandée.",
                    "critical": False, "next": 1
                }
            ]
        },
        {
            "phase": "📨 Les sessions actives",
            "situation": "Le téléphone est verrouillé à distance — bien. Mais la touriste réalise : son iPhone avait des sessions Outlook 365 actives sur son <strong>cabinet d'avocats à Annecy</strong>. Elle gère 14 dossiers clients. Une violation de données impliquant des données clients = notification PFPDT obligatoire si elle exerce en CH, sinon CNIL côté français. Mme Brägger envoie un message : « Première vérif : où sont domiciliés les clients, où est le cabinet ? »",
            "law": "<strong>LPD 2023 Art. 24</strong> — Notification au PFPDT en cas de violation à risque élevé.<br><strong>RGPD Art. 33-34</strong> — Notification à la CNIL si traitement européen.",
            "question": "<strong>Quel conseil sur la dimension protection des données ?</strong>",
            "choices": [
                {
                    "text": "« Vous travaillez côté français, votre cabinet est en France : c'est la CNIL qui s'applique, pas le PFPDT. Mais pour vos clients suisses (vous m'avez dit en avoir 3), il y a un risque LPD à analyser. Documentez ce qui était accessible : mails, dossiers, contacts. La fenêtre de notification est de 72h pour la CNIL, « meilleurs délais » pour le PFPDT. »",
                    "ok": True, "pts": 25,
                    "fb": "Excellent. Vous avez identifié la <strong>juridiction applicable</strong> (RGPD pour le siège, LPD pour les clients CH potentiellement concernés), la <strong>fenêtre temporelle</strong> (72h CNIL, « meilleurs délais » LPD), et la <strong>première action</strong> (documenter le périmètre). C'est exactement la séquence d'un délégué à la protection des données expérimenté.",
                    "legal": "RGPD art. 33-34 + LPD art. 24 — Cumul possible si données transfrontalières.",
                    "critical": False, "next": 2
                },
                {
                    "text": "« Pas votre problème — c'est à son employeur (le cabinet) de gérer la notification, pas à elle. Concentrons-nous sur la plainte pénale en Suisse. »",
                    "ok": False, "pts": -15,
                    "fb": "Faux. La responsabilité de notification incombe au <strong>responsable du traitement</strong> (le cabinet) MAIS l'avocate est en pratique celle qui constate la violation et doit alerter sa direction immédiatement. La conseiller à attendre = la mettre en risque vis-à-vis de son employeur et des règles déontologiques avocat.",
                    "legal": "RGPD art. 4 + déontologie avocat — Le sous-traitant doit alerter immédiatement.",
                    "critical": False, "next": 2
                },
                {
                    "text": "« Effacez tout maintenant. Si rien n'est récupérable côté téléphone, vous pourrez plaider qu'aucune violation n'est avérée et éviter toute notification. »",
                    "ok": False, "pts": -30,
                    "fb": "📍 ERREUR GRAVE. Effacer pour <em>masquer</em> une violation potentielle = obstruction. La violation est <strong>l'accès non maîtrisé aux données</strong> entre la perte et le verrouillage, pas la disparition du téléphone. Conseiller cela à une avocate = lui faire commettre une faute déontologique (devoir de transparence) ET potentiellement pénale (entrave à l'établissement des faits).",
                    "legal": "Art. 305 CP (entrave à l'action pénale) + déontologie — À ne JAMAIS conseiller.",
                    "critical": True, "next": "end"
                }
            ]
        },
        {
            "phase": "📝 Le dépôt de plainte",
            "situation": "Le téléphone n'a pas été retrouvé à Berne (objets trouvés CFF négatifs). Mme Brägger appelle : « Maintenant la plainte. Compétence territoriale ? Quels articles ? Qui prend le dossier ? » La touriste est encore à Lausanne, doit rentrer en France ce soir. Elle vous demande où déposer plainte.",
            "law": "<strong>Art. 31 CPP</strong> — Compétence territoriale : lieu de commission de l'infraction.<br><strong>Art. 304 CPP</strong> — Forme de la plainte (peut être orale au procès-verbal).",
            "question": "<strong>Que lui conseillez-vous concrètement ?</strong>",
            "choices": [
                {
                    "text": "« Déposez plainte ici à la PolCant Vaud (lieu de la perte). Articles à mentionner : Art. 139 CP (vol par appropriation si pris par un tiers) et Art. 143 CP (soustraction de données si fouille du téléphone constatée plus tard). On rédige ensemble en 20 min, vous signez, je transmets au procureur de piquet. Vous rentrez en France ce soir, on vous joint par mail ou téléphone si besoin. »",
                    "ok": True, "pts": 25,
                    "fb": "Conseil parfait. Vous appliquez : (1) <strong>compétence territoriale</strong> art. 31 CPP (lieu de perte = Lausanne = canton de Vaud), (2) <strong>qualification juridique</strong> appropriée à plusieurs niveaux (vol + données), (3) <strong>aspect pratique</strong> (signature immédiate, retour en France possible), (4) <strong>communication ultérieure</strong> par tout moyen (art. 86 CPP). Une plainte bien posée d'emblée = pas de relance, pas de réécriture.",
                    "legal": "CPP art. 31, 304, 86 + CP art. 139, 143 — Combinaison standard.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "« Rentrez en France et déposez plainte au commissariat le plus proche de chez vous. La police française fera l'entraide pénale internationale (EIMP) avec la Suisse pour la suite. »",
                    "ok": False, "pts": -20,
                    "fb": "Mauvaise voie. La perte a eu lieu en Suisse (canton de Vaud) → compétence CH primaire. Passer par l'entraide ajoute 6-12 mois de délai et n'a aucun avantage. La touriste peut signer une plainte à Lausanne en 20 min et rentrer en France le soir-même. L'entraide EIMP sert pour des actes d'instruction transfrontaliers, pas pour la simple constitution d'une plainte.",
                    "legal": "Art. 31 CPP + EIMP — La plainte se dépose toujours au lieu de l'infraction.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "« Pas de plainte nécessaire pour un téléphone perdu à 1500 CHF — c'est de la perte, pas du vol. Faites une déclaration de perte au bureau des objets trouvés CFF et c'est tout. »",
                    "ok": False, "pts": -25,
                    "fb": "Erreur sérieuse. (1) On ne sait pas si le téléphone a été perdu OU volé : la qualification dépend des éléments d'enquête. (2) Une plainte permet à l'assurance ménage de fonctionner. (3) Si quelqu'un fouille les sessions cloud actives plus tard, il y a clairement délit (art. 143 CP minimum). Décourager une plainte légitime = priver la victime de ses droits.",
                    "legal": "CP art. 139, 143 + droits de la victime — Toujours faciliter la plainte.",
                    "critical": False, "next": "end"
                }
            ]
        }
    ],
    "npcs": ["sg_polcyber_chief", "ge_avocat_frontaliers"],
    "regionDetail": {"code": "VD", "flag": "🇨🇭", "name": "Vaud"}
}

# ═══════════════════════════════════════════════════════════════
# SCÈNE 2 — Première perquisition (GE)
# ═══════════════════════════════════════════════════════════════

scene2 = {
    "id": "easy-premiere-perquisition",
    "title": "La Perquisition Trop Pressée",
    "icon": "📜",
    "difficulty": "easy",
    "atmosphere": "legal",
    "narrative": {
        "success": "Votre ordonnance respecte les exigences CPP (244-248), le séquestre est exécutable et le contradictoire est garanti. Mme Brägger vous écrit : « Première ordonnance correcte = enquête qui tient en justice. Tu as compris l'essentiel : on ne perquisitionne pas avant d'écrire. »",
        "degraded": "L'ordonnance est globalement correcte mais une omission obligera à un complément. Le délai de séquestre est risqué.",
        "failure": "L'ordonnance ne tient pas. Le TMC va vraisemblablement la réformer ou ordonner la mise sous scellés. Vous comprenez maintenant pourquoi Mme Brägger insiste : « On rédige avant d'agir. »"
    },
    "tags": ["PERQUISITION", "CPP", "MANDAT", "PROCÉDURE", "DROIT", "EASY"],
    "legalRefs": [
        "Art. 244 CPP",
        "Art. 245 CPP",
        "Art. 246 CPP",
        "Art. 248 CPP",
        "Art. 263 CPP",
        "Art. 197 CPP"
    ],
    "intro": "Mardi 9h12, MP genevois, Boulevard du Pont d'Arve. Vous êtes procureur·e adjoint·e, fraîchement nommé·e. La police judiciaire vient de vous appeler : ils sont sur place chez un suspect (escroquerie au CEO contre une PME genevoise, 87'000 CHF) et veulent <strong>maintenant</strong> son ordinateur portable et son téléphone. « On a un mandat de perquisition de domicile signé par Me Cottier hier, mais sur le séquestre informatique on attend votre ordo. » Vous n'avez jamais rédigé d'ordonnance de séquestre cyber. Vous appelez Mme Brägger — votre marraine de stage — qui décroche depuis Saint-Gall.",
    "alertLevel": "⚖️ ACTE DE CONTRAINTE — Erreur procédurale = irrecevabilité art. 141 CPP",
    "objectives": [
        {"icon": "📜", "text": "Distinguer mandat de perquisition (244 CPP) et ordonnance de séquestre (263 CPP)"},
        {"icon": "🔐", "text": "Anticiper la mise sous scellés (248 CPP)"},
        {"icon": "⚖️", "text": "Respecter le principe de proportionnalité (197 CPP)"}
    ],
    "debrief": "<p>La <strong>perquisition cyber</strong> en CH est un domino procédural :</p><ul><li><strong>Art. 244 CPP</strong> — Perquisition de domicile (mandat MP, exécution police).</li><li><strong>Art. 245 CPP</strong> — Perquisition de personnes.</li><li><strong>Art. 246 CPP</strong> — Perquisition de documents et enregistrements (le matériel cyber tombe ici).</li><li><strong>Art. 248 CPP</strong> — Mise sous scellés sur demande de l'intéressé. TMC tranche dans les 20 jours.</li><li><strong>Art. 263 CPP</strong> — Séquestre des objets/données identifiés.</li></ul><p>Le piège classique : la police veut « tout prendre » mais l'art. 197 CPP impose la <strong>proportionnalité</strong>. On ne séquestre que ce qui est nécessaire à la procédure. Une ordonnance trop large sera réformée par le TMC ou conduira à des scellés massifs (perte de temps).</p><p><strong>Référence CH</strong> : TF 1B_602/2020 — quand le propriétaire désigne précisément des données privées (avocat, médecin, journaliste), un tri préalable judiciaire est requis. La présomption d'intégrité du matériel est centrale.</p>",
    "steps": [
        {
            "phase": "📜 Le périmètre du séquestre",
            "situation": "La police a localisé chez le suspect : 1 ordinateur portable (le suspect dit qu'il s'en sert pour le travail ET en privé), 1 téléphone Android, 1 disque dur externe USB, 1 routeur Wi-Fi, et une console PlayStation. Ils vous demandent : « On prend tout ? » Mme Brägger murmure dans le combiné : « Art. 197 CPP. Proportionnalité. »",
            "law": "<strong>Art. 197 CPP</strong> — Proportionnalité : 4 conditions cumulatives (soupçons, but, autres mesures, gravité).<br><strong>Art. 246 CPP</strong> — Perquisition de documents/enregistrements informatiques.",
            "question": "<strong>Que mettez-vous dans l'ordonnance de séquestre ?</strong>",
            "choices": [
                {
                    "text": "Tout le matériel électronique du domicile (ordinateur, téléphone, disque externe, routeur, PlayStation) — on ne sait pas où sont les preuves, on prend tout pour ne pas passer à côté, on triera plus tard.",
                    "ok": False, "pts": -25,
                    "fb": "Disproportionné. La PlayStation et le routeur n'ont aucun lien évident avec une escroquerie au CEO (qui se déroule par email/téléphone). Une ordonnance « tout prendre » sera contestée et probablement réformée par le TMC. La doctrine moderne CH : <strong>cibler ce qui est techniquement utile</strong> à la preuve.",
                    "legal": "Art. 197 CPP — Proportionnalité non respectée.",
                    "critical": False, "next": 1
                },
                {
                    "text": "Ordinateur portable, téléphone Android et disque dur externe — supports susceptibles de contenir les emails et communications de l'escroquerie. La PlayStation et le routeur restent sur place sauf élément nouveau.",
                    "ok": True, "pts": 25,
                    "fb": "Périmètre proportionné. Vous séquestrez ce qui est <strong>techniquement plausible comme support de preuve</strong> (emails, messageries, fichiers de transfert) et laissez les équipements sans lien direct. C'est la pratique standard du MP genevois en cybercriminalité économique.",
                    "legal": "Art. 197, 246, 263 CPP — Périmètre conforme.",
                    "critical": False, "next": 1
                },
                {
                    "text": "Uniquement le téléphone (les emails y sont aussi, le téléphone est plus discret à séquestrer, et cela évite les scellés sur l'ordinateur professionnel).",
                    "ok": False, "pts": -10,
                    "fb": "Trop restrictif. Une escroquerie au CEO laisse typiquement des traces sur ordinateur (rédaction des mails frauduleux, RIB falsifiés, factures). Limiter au téléphone risque de manquer 60-70% de la preuve. La discrétion n'est pas un critère pénal.",
                    "legal": "Art. 197 CPP — Proportionnalité ne signifie pas \"minimum\".",
                    "critical": False, "next": 1
                }
            ]
        },
        {
            "phase": "🔐 L'anticipation des scellés",
            "situation": "Le suspect, présent à domicile, déclare : « L'ordinateur contient ma correspondance privée avec mon avocat. Je m'oppose au séquestre. » Mme Brägger : « Voilà. C'était prévisible. Comment tu réagis ? »",
            "law": "<strong>Art. 248 CPP</strong> — Mise sous scellés sur demande, TMC tranche dans 20 jours.<br><strong>Art. 264 CPP</strong> — Documents protégés par le secret professionnel (avocat).",
            "question": "<strong>Quelle est la bonne procédure ?</strong>",
            "choices": [
                {
                    "text": "Vous acceptez la mise sous scellés sur le champ (art. 248 CPP). Le matériel est saisi mais placé dans un sac scellé numéroté, transmis au TMC qui décidera dans les 20 jours quels fichiers peuvent être analysés. Vous documentez la demande dans un PV signé du suspect.",
                    "ok": True, "pts": 25,
                    "fb": "Procédure exemplaire. Refuser les scellés = vice de procédure majeur (art. 141 CPP). Les accepter, documenter, et laisser le TMC trancher = c'est <em>le</em> mécanisme prévu par le CPP. Le suspect peut être de mauvaise foi (l'« avocat » fictif), mais c'est au TMC de le démasquer, pas à vous sur le terrain.",
                    "legal": "Art. 248 CPP — Mise sous scellés = droit du détenteur.",
                    "critical": False, "next": 2
                },
                {
                    "text": "Vous refusez les scellés : le suspect doit prouver qu'il a vraiment un avocat et fournir le nom. Sinon, c'est de l'obstruction et vous procédez normalement à l'analyse.",
                    "ok": False, "pts": -30,
                    "fb": "📍 ERREUR PROCÉDURALE GRAVE. L'art. 248 CPP ne demande aucune justification du détenteur : il suffit qu'il « invoque » le secret professionnel. C'est ensuite au TMC de filtrer. Refuser les scellés = vice de procédure pouvant entraîner l'irrecevabilité de TOUTES les preuves trouvées (art. 141 CPP fruit empoisonné). Mme Brägger vous reprendra durement.",
                    "legal": "Art. 248 CPP + 141 CPP — Refuser les scellés = irrecevabilité.",
                    "critical": True, "next": "end"
                },
                {
                    "text": "Vous demandez à la police d'analyser le matériel rapidement sur place AVANT que le suspect formalise sa demande de scellés — quelques minutes suffisent pour identifier les fichiers clés.",
                    "ok": False, "pts": -35,
                    "fb": "📍 CONTOURNEMENT DE PROCÉDURE — irrecevabilité absolue. L'art. 248 al. 1 CPP s'applique <strong>dès l'opposition exprimée</strong>. Toute analyse menée après que le détenteur a fait opposition est <strong>nulle</strong> et constitue potentiellement une violation du secret de fonction (art. 320 CP). Mme Brägger : « Tu auras Me Cottier sur le dos avant midi. »",
                    "legal": "Art. 248 CPP + 141 CPP + 320 CP — Triple violation.",
                    "critical": True, "next": "end"
                }
            ]
        },
        {
            "phase": "✍ La signature de l'ordonnance",
            "situation": "L'ordonnance est rédigée. Mme Brägger relit par messagerie sécurisée et envoie un dernier point : « Tu as oublié quelque chose d'évident. Indispensable pour qu'elle tienne. »",
            "law": "<strong>Art. 80 CPP</strong> — Forme des décisions : motivation, indication des voies de droit.<br><strong>Pratique TMC GE</strong> — Vérifications formelles.",
            "question": "<strong>Que manque-t-il à l'ordonnance ?</strong>",
            "choices": [
                {
                    "text": "L'indication des voies de droit (recours, délai, autorité compétente — chambre des recours pénale GE, 10 jours), sans laquelle l'ordonnance est formellement viciée.",
                    "ok": True, "pts": 25,
                    "fb": "Bingo. Toute décision pénale doit indiquer les voies de droit (art. 80 al. 2 CPP). C'est l'oubli n°1 des jeunes magistrats. Sans cette mention, le délai de recours ne court pas, et l'ordonnance peut être attaquée plus tard sans contrainte de temps.",
                    "legal": "Art. 80 al. 2 CPP — Voies de droit obligatoires.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "Une copie pour le suspect — la police lui remet l'original signé sur place pour preuve, sans archiver de copie au MP.",
                    "ok": False, "pts": -10,
                    "fb": "Non. C'est l'inverse : le MP <strong>conserve l'original</strong>, une copie est notifiée au suspect. Sans archivage MP, l'ordonnance n'existe pas dans le dossier de procédure.",
                    "legal": "Art. 100 CPP — Tenue du dossier obligatoire.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "L'autorisation explicite du président du Tribunal de première instance — toute perquisition cyber au-delà de 24h nécessite une co-signature judiciaire.",
                    "ok": False, "pts": -15,
                    "fb": "Inventé. Les perquisitions et séquestres relèvent du MP seul (art. 244 et 263 CPP) ; le TMC intervient uniquement en cas de scellés (art. 248 CPP) ou pour la surveillance des télécommunications (art. 269 CPP). Pas de co-signature requise.",
                    "legal": "Art. 244, 263 CPP — Compétence MP seule.",
                    "critical": False, "next": "end"
                }
            ]
        }
    ],
    "npcs": ["sg_polcyber_chief", "mp_genevois_piquet", "tmc_juge_ge"],
    "regionDetail": {"code": "GE", "flag": "🇨🇭", "name": "Genève"}
}

# Pour ne pas saturer la sortie ici, je continue dans le fichier suivant.
# On sauve les 2 premières scènes
import os
os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(f'{OUTPUT_DIR}/easy-mobile-perdu-train.json', 'w', encoding='utf-8') as f:
    json.dump(scene1, f, ensure_ascii=False, indent=2)

with open(f'{OUTPUT_DIR}/easy-premiere-perquisition.json', 'w', encoding='utf-8') as f:
    json.dump(scene2, f, ensure_ascii=False, indent=2)

print(f"✓ Scène 1 : {len(json.dumps(scene1, ensure_ascii=False))} chars")
print(f"✓ Scène 2 : {len(json.dumps(scene2, ensure_ascii=False))} chars")
print(f"\n2 scènes sur 7 générées. Suite dans build_easy_arc_part2.py.")
