#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v2.63 — Génération des scènes 6, 7 + arc PNJ + intégration.
Scène 6 : Aide grand-mère arnaque (VS)
Scène 7 : Clé USB trouvée parking (TI)
+ Arc PNJ "Premiers réflexes cyber" avec sg_polcyber_chief comme mentor
+ SW bump + intégration data/npc-arcs.json
"""
import json, os

OUTPUT_DIR = 'scenes'

# ═══════════════════════════════════════════════════════════════
# SCÈNE 6 — Aide grand-mère arnaque (VS)
# ═══════════════════════════════════════════════════════════════

scene6 = {
    "id": "easy-aide-grand-mere-arnaque",
    "title": "L'Appel À Grand-Mère",
    "icon": "📞",
    "difficulty": "easy",
    "atmosphere": "victim_support",
    "narrative": {
        "success": "Vous protégez Mme Lambiel des conséquences pires (perte financière, traumatisme aggravé), accompagnez vers les bons services (LAVI, MROS si déjà payé, banque), documentez pour la procédure pénale. Mme Brägger : « Le DFIR n'est pas qu'analyse de logs. C'est aussi cette compétence-là : recevoir une victime sans l'enfoncer. »",
        "degraded": "Vous gérez l'aspect technique mais Mme Lambiel ressort partiellement traumatisée et sans réseau de soutien.",
        "failure": "Vous avez priorisé la procédure sur la personne. Mme Lambiel fait crédit à la honte, ne dépose pas plainte, l'arnaque continue avec d'autres victimes."
    },
    "tags": ["SOCIAL ENGINEERING", "VICTIMES VULNÉRABLES", "PRÉVENTION", "LAVI", "DROIT", "EASY"],
    "legalRefs": [
        "Art. 146 CP",
        "Art. 156 CP",
        "Art. 304 CPP",
        "LAVI"
    ],
    "intro": "Mardi 11h, Sion, poste de PolCant Valais. Mme Lambiel (78 ans, retraitée, veuve) est dans votre bureau, accompagnée de sa fille (54 ans). Hier soir 19h47, Mme Lambiel a reçu un appel : « Mamie, c'est Pierre [son petit-fils]. J'ai eu un accident de voiture en France, la police me retient, j'ai besoin de 8'500 euros pour la caution sinon je vais en prison cette nuit. » Voix sanglotante, ton crédible. Mme Lambiel a paniqué, est allée à sa banque ce matin, a retiré 9'000 CHF en liquide. La conseillère bancaire (formée aux signaux) a refusé l'opération et l'a orientée vers vous. La fille de Mme Lambiel a vérifié : Pierre est en cours à l'EPFL, il va bien. Mme Lambiel pleure de soulagement et de honte. Vous êtes inspecteur·trice cyber au PolCant VS, première affectation. Mme Brägger est jointe par téléphone.",
    "alertLevel": "💔 ARNAQUE GRAND-PARENTS — Tentative aboutie freinée in extremis",
    "objectives": [
        {"icon": "🤗", "text": "Accueillir la victime sans culpabilisation"},
        {"icon": "📞", "text": "Orienter vers le bon réseau (LAVI, plainte, banque)"},
        {"icon": "🚨", "text": "Anticiper la suite : ce n'est probablement pas un cas isolé"}
    ],
    "debrief": "<p>L'<strong>arnaque \"grand-parents\"</strong> (grandparent scam, Enkeltrick en alémanique) cible massivement les personnes âgées en CH depuis 2018. Volumes : ~12 millions de CHF de pertes annuelles déclarées (chiffre OFCS 2023, sous-estimé car beaucoup de victimes ne portent pas plainte par honte).</p><p>Le mécanisme repose sur trois leviers : (1) <strong>autorité familiale</strong> (un proche en danger), (2) <strong>urgence artificielle</strong> (« cette nuit »), (3) <strong>secret demandé</strong> (« ne dis rien à mes parents »). Aucune compétence technique ni accès aux données : c'est de la pure ingénierie sociale.</p><p>L'accompagnement victime suit la <strong>LAVI</strong> (Loi sur l'aide aux victimes, RS 312.5) :</p><ul><li>Centre LAVI cantonal pour soutien psychologique gratuit</li><li>Plainte facilitée (art. 304 CPP, oral au PV)</li><li>Si paiement déjà effectué : MROS via la banque (art. 9 LBA), demande de blocage Twint/virement bancaire</li></ul><p><strong>Référence CH</strong> : la conseillère bancaire qui a refusé l'opération a appliqué la <strong>directive FINMA sur la vigilance LBA</strong> et la formation \"customers in distress\". C'est la première ligne de défense efficace.</p>",
    "steps": [
        {
            "phase": "🤗 L'accueil",
            "situation": "Mme Lambiel pleure : « Je suis tellement bête. Comment j'ai pu tomber dans le panneau. À mon âge. » Sa fille est en colère contre le monde (les arnaqueurs, mais aussi un peu sa mère). Mme Brägger sur haut-parleur : « Comment tu démarres ? »",
            "law": "<strong>Pédagogie victimologique</strong> — Renforcer, ne pas culpabiliser.",
            "question": "<strong>Quels sont vos premiers mots ?</strong>",
            "choices": [
                {
                    "text": "« Mme Lambiel, écoutez-moi. Vous n'êtes pas bête. Ces arnaqueurs sont des professionnels du chantage émotionnel, ils piègent des gens beaucoup plus jeunes que vous tous les jours. La preuve que vous n'avez rien fait de stupide : vous ne leur avez RIEN donné, parce que la conseillère bancaire a fait son travail et que vous avez écouté. C'est ça qui compte. »",
                    "ok": True, "pts": 25,
                    "fb": "Réponse parfaite. Vous : (1) déculpabilisez (« vous n'êtes pas bête »), (2) contextualisez (« ils piègent des gens plus jeunes »), (3) <strong>recadrez positivement</strong> (« vous n'avez rien donné, vous avez écouté »). Mme Lambiel passe de la honte à la fierté maîtrisée. Sa fille comprend que sa mère a finalement bien réagi.",
                    "legal": "Pédagogie LAVI — Standard victimologique.",
                    "critical": False, "next": 1
                },
                {
                    "text": "« Bon, on va revenir au commencement. Vous me racontez l'appel en détail — heure exacte, ce qu'il a dit mot à mot, le ton de la voix, etc. On a besoin d'éléments pour la procédure. »",
                    "ok": False, "pts": -15,
                    "fb": "Trop procédural d'emblée. Mme Lambiel a besoin d'être rassurée avant d'être interrogée. Demander tout de suite des détails à une victime en pleurs = renforcer son sentiment d'incompétence (« je ne me souviens même plus exactement »). L'audition formelle vient APRÈS l'accueil.",
                    "legal": "Pédagogie LAVI — Accueil avant interrogatoire.",
                    "critical": False, "next": 1
                },
                {
                    "text": "« Au moins vous n'avez rien donné, c'est l'essentiel. À votre âge, il faut faire vraiment attention à ces choses-là, et ne plus jamais répondre à des appels d'inconnus. »",
                    "ok": False, "pts": -25,
                    "fb": "Doublement maladroit. (1) « À votre âge » sous-entend que c'est sa faute liée à sa génération, alors que les arnaques marchent sur tous les âges. (2) « Plus jamais répondre aux inconnus » = isolement social, contraire à l'intérêt de Mme Lambiel. La condescendance institutionnelle aggrave le traumatisme.",
                    "legal": "Pédagogie LAVI — Éviter la condescendance.",
                    "critical": False, "next": 1
                }
            ]
        },
        {
            "phase": "📞 Le réseau d'aide",
            "situation": "Mme Lambiel respire. Sa fille demande : « Et maintenant ? On fait quoi concrètement ? » Mme Brägger : « Liste-leur les ressources disponibles, sois concret. »",
            "law": "<strong>LAVI</strong> — Loi sur l'aide aux victimes.<br><strong>Art. 304 CPP</strong> — Forme de la plainte.",
            "question": "<strong>Quelle orientation proposez-vous ?</strong>",
            "choices": [
                {
                    "text": "(1) Plainte ici, maintenant, oralement (art. 304 CPP), je rédige et vous signez. (2) Centre LAVI VS pour soutien psychologique gratuit (j'ai le numéro). (3) Sa banque informée par mes soins pour bloquer toute relance ou nouvelle opération suspecte. (4) Vous êtes invitée à une réunion de prévention que la PolCant organise mensuellement — vous y partagerez votre expérience si vous le voulez, ça peut éviter à d'autres.",
                    "ok": True, "pts": 25,
                    "fb": "Plan complet exemplaire. Vous offrez : (1) la voie pénale facilitée, (2) le soutien LAVI, (3) la sécurisation bancaire, (4) la <strong>transformation de la victime en actrice de prévention</strong> — étape clé de la résilience. Mme Brägger : « Tu as fait grand-mère + procureure + assistante sociale + préventionniste en 30 secondes. C'est exactement ça, le métier. »",
                    "legal": "LAVI + art. 304 CPP — Standard cantonal VS.",
                    "critical": False, "next": 2
                },
                {
                    "text": "Plainte écrite à formaliser sous 7 jours via le portail en ligne du MP-VS. Centre LAVI numéro à chercher elle-même sur internet. Le reste, c'est sa banque qui voit.",
                    "ok": False, "pts": -10,
                    "fb": "Beaucoup trop sec. Vous renvoyez Mme Lambiel à se débrouiller alors qu'elle est encore sous le choc. Une victime de 78 ans qui doit chercher des numéros sur internet ne le fera pas. La doctrine LAVI : <strong>l'accompagnement actif</strong>, pas le renvoi formel.",
                    "legal": "Doctrine LAVI — Accompagnement, pas renvoi.",
                    "critical": False, "next": 2
                },
                {
                    "text": "« Pas besoin de plainte puisqu'il n'y a pas eu de paiement. On classe le dossier ici. Restez vigilante. »",
                    "ok": False, "pts": -25,
                    "fb": "Erreur double. (1) <strong>Tentative</strong> d'escroquerie est punissable (art. 22 + 146 CP). (2) Sans plainte, l'enquête ne peut pas remonter aux numéros utilisés (potentiellement des centaines d'autres victimes ciblées). Classer = laisser le réseau actif. Toute tentative documentée enrichit le dossier global de la PolCant.",
                    "legal": "Art. 22 + 146 CP — Tentative punissable.",
                    "critical": False, "next": 2
                }
            ]
        },
        {
            "phase": "🚨 La dimension réseau",
            "situation": "Mme Lambiel et sa fille partent rassurées avec leurs contacts. Vous êtes maintenant seul·e avec le dossier. Mme Brägger : « Cette arnaque ne cible jamais une seule personne. C'est un appel en série. Que fais-tu maintenant ? »",
            "law": "<strong>Investigation pro-active</strong> — Recherche d'autres victimes.<br><strong>Art. 273 CPP</strong> — Réquisition métadonnées télécom.",
            "question": "<strong>Quelle action menez-vous ?</strong>",
            "choices": [
                {
                    "text": "Documenter le numéro appelant (Mme Lambiel a un fixe avec historique), envoyer un signalement au fedpol/PolCantVS centralisé pour cross-référence avec autres plaintes similaires (probablement toutes via le même cluster d'appels VoIP), réquisition art. 273 CPP via le MP-VS pour identifier le routage du numéro spoofé.",
                    "ok": True, "pts": 25,
                    "fb": "Réflexe parfait. L'arnaque grand-parents fonctionne par <strong>vagues coordonnées</strong> (cluster de cibles 80+ ans dans une région donnée). Un seul cas isolé révèle souvent 50-200 autres tentatives la même semaine. Votre réflexe de cross-référencement est exactement ce qui permet de remonter au cluster d'appels VoIP source (souvent à l'étranger, mais identifiables par routage).",
                    "legal": "Art. 273 CPP + coopération inter-cantons — Standard cybercriminalité organisée.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "Le dossier est traité, classé en attente de l'instruction. On verra plus tard si d'autres cas remontent.",
                    "ok": False, "pts": -15,
                    "fb": "Trop passif. Le temps est critique : les arnaqueurs utilisent typiquement la même infrastructure 24-72h avant de la changer. Réagir vite = intercepter d'autres tentatives en cours. Réagir lentement = laisser le réseau migrer et perdre la traçabilité.",
                    "legal": "Doctrine fedpol — Cybercriminalité = action rapide.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "Vous publiez un communiqué de presse de la PolCant VS avec le numéro appelant pour avertir le public.",
                    "ok": False, "pts": -20,
                    "fb": "Mauvaise pratique pour deux raisons. (1) Le numéro affiché chez Mme Lambiel est <strong>spoofé</strong> (usurpation), souvent celui d'un particulier innocent qui se retrouve harcelé d'appels après publication. (2) Avertir le public = avertir aussi les arnaqueurs qui changent de numéro. Communication = APRÈS investigation.",
                    "legal": "Doctrine OFCS — Spoofing fréquent, vérifier avant publier.",
                    "critical": False, "next": "end"
                }
            ]
        }
    ],
    "npcs": ["sg_polcyber_chief", "vs_prosecutor_cyber", "eleonore"],
    "regionDetail": {"code": "VS", "flag": "🇨🇭", "name": "Valais"}
}

# ═══════════════════════════════════════════════════════════════
# SCÈNE 7 — Clé USB trouvée (TI)
# ═══════════════════════════════════════════════════════════════

scene7 = {
    "id": "easy-cle-usb-trouvee",
    "title": "La Clé USB Du Parking",
    "icon": "💾",
    "difficulty": "easy",
    "atmosphere": "investigation",
    "narrative": {
        "success": "Vous transformez une menace de USB drop en cas d'école pour toute l'institution. La clé est analysée en sandbox, l'IT de l'école est sensibilisé, la stagiaire devient ambassadrice de la sécurité. Mme Brägger : « Tu as fait passer un message simple : ne jamais brancher une clé inconnue. C'est de l'or pédagogique. »",
        "degraded": "Le réflexe technique est correct mais l'opportunité de sensibilisation à plus grande échelle est manquée.",
        "failure": "La clé a été branchée — soit par vous, soit par quelqu'un d'autre. Si elle contenait du malware, l'incident s'étend au réseau de l'école. Mme Brägger : « Une clé USB sur un parking, c'est presque toujours un test ou une attaque. »"
    },
    "tags": ["SUPPLY CHAIN", "USB DROP", "RÉFLEXES", "PRÉVENTION", "SANDBOX", "EASY"],
    "legalRefs": [
        "Art. 143bis CP",
        "Art. 144bis CP",
        "MITRE ATT&CK T1091",
        "MITRE ATT&CK T1200"
    ],
    "intro": "Lundi 8h12, école professionnelle (SUPSI) à Manno près de Lugano. Une stagiaire en 2e année (BSc Informatique) traverse le parking et trouve une clé USB par terre près d'une voiture. Étiquette manuscrite : « Ricerca Tesi - URGENTE ». Elle l'amène à l'enseignant qui l'apporte à l'inspecteur référent IT (vous) en disant : « C'est sûrement un étudiant qui l'a perdue. Tu peux regarder ce qu'il y a dessus pour qu'on lui rende ? » Vous êtes inspecteur cybercriminalité PolCant TI Chiasso. Mme Brägger répond à votre Threema dans 3 minutes selon son auto-réponse.",
    "alertLevel": "💀 USB DROP — Attaque ciblée probable",
    "objectives": [
        {"icon": "🚫", "text": "Refuser le branchement intuitif"},
        {"icon": "🔬", "text": "Procéder à l'analyse en environnement isolé"},
        {"icon": "📚", "text": "Transformer l'incident en pédagogie pour l'établissement"}
    ],
    "debrief": "<p>L'<strong>USB drop</strong> est une technique d'attaque documentée depuis ~15 ans. Étude classique : Tischer et al. (2016, Univ. Michigan) ont semé 297 clés USB sur un campus, 45-98% ont été branchées, dont 68% sans aucune précaution. C'est l'une des techniques les plus efficaces de pénétration initiale (MITRE ATT&CK T1091).</p><p>Trois variantes principales :</p><ul><li><strong>Malware classique</strong> : autorun, exécutable nommé pour inviter au clic (« Salaires.exe », « Photos.zip »).</li><li><strong>BadUSB / HID injection</strong> (Rubber Ducky et clones) : la clé se présente comme un clavier et tape une séquence de commandes. Ne s'arrête pas à l'antivirus.</li><li><strong>USB Killer</strong> : décharge un condensateur dans le port USB, détruisant la carte mère. Dommage matériel pur.</li></ul><p>Le bon réflexe DFIR est <strong>universel</strong> :</p><ol><li>Ne jamais brancher sur un poste de production.</li><li>Si analyse nécessaire : poste isolé, sans réseau, idéalement avec un USB write-blocker (matériel) ou en VM dédiée avec USB redirigé.</li><li>Acquisition forensique (image bit-à-bit avec dd ou FTK Imager) avant toute lecture.</li></ol><p><strong>Référence CH</strong> : doctrine GovCERT 2022 sur les supports amovibles trouvés en milieu institutionnel — toujours considérer comme hostile par défaut, jusqu'à preuve du contraire.</p>",
    "steps": [
        {
            "phase": "🚫 Le premier réflexe",
            "situation": "L'enseignant attend votre réponse. La clé est entre vos mains, gantée. Mme Brägger n'a pas encore répondu. Vous avez 30 secondes avant qu'on vous regarde bizarrement.",
            "law": "<strong>Doctrine USB drop</strong> — Toute clé inconnue trouvée dans l'espace public = hostile par défaut.<br><strong>MITRE ATT&CK T1091</strong> — Replication Through Removable Media.",
            "question": "<strong>Que faites-vous ?</strong>",
            "choices": [
                {
                    "text": "Vous expliquez calmement que la clé ne sera pas branchée sur un poste normal. Vous la placez dans un sachet anti-statique étiqueté (date, lieu, témoin), à clé dans votre tiroir sécurisé. Vous demandez à l'enseignant de demander dans les classes si quelqu'un a perdu une clé avec ces caractéristiques exactes (étiquette « Ricerca Tesi - URGENTE ») — sans la décrire publiquement, juste en parlant à des étudiants individuels.",
                    "ok": True, "pts": 25,
                    "fb": "Réflexe DFIR exemplaire. Vous : (1) refusez le branchement (le 1er réflexe pédagogique), (2) sécurisez physiquement (sachet anti-statique = pas d'altération, traçabilité), (3) lancez la recherche du propriétaire <strong>sans révéler les détails</strong> (un vrai propriétaire saura, un attaquant ne saura pas reconstruire l'étiquette exacte).",
                    "legal": "ISO/IEC 27037 + doctrine GovCERT — Standard.",
                    "critical": False, "next": 1
                },
                {
                    "text": "Vous la branchez sur votre poste de travail pour vérifier rapidement — vous avez un antivirus à jour et Windows Defender qui bloquera tout malware connu.",
                    "ok": False, "pts": -35,
                    "fb": "📍 ERREUR CATASTROPHIQUE. (1) Antivirus = inefficace contre BadUSB / HID (la clé n'apparaît pas comme exécutable mais comme clavier, l'AV ne voit rien). (2) Windows Defender ne détecte pas les 0-days. (3) Si malware classique : votre poste est compromis, et étant celui d'un inspecteur cyber, c'est extrêmement grave (accès à des dossiers sensibles). Mme Brägger en mode Threema : « NON. ARRÊTE TOUT. »",
                    "legal": "Doctrine GovCERT — AV ≠ protection USB drop.",
                    "critical": True, "next": "end"
                },
                {
                    "text": "Vous demandez à la stagiaire qui a trouvé la clé de la brancher elle-même sur le poste de l'enseignant — elle est en informatique, elle saura voir si c'est suspect.",
                    "ok": False, "pts": -40,
                    "fb": "📍 INACCEPTABLE. Demander à une stagiaire de prendre le risque que vous refusez de prendre = (1) abus d'autorité, (2) si le poste est compromis l'enseignant aura un dossier interne, (3) la stagiaire est non formée à la forensique. Au-delà des conséquences techniques, c'est une faute professionnelle grave.",
                    "legal": "Art. 312 CP + déontologie — Faute professionnelle.",
                    "critical": True, "next": "end"
                }
            ]
        },
        {
            "phase": "🔬 L'analyse",
            "situation": "Mme Brägger répond : « Bien refusé le branchement. Maintenant, si on veut savoir ce qu'il y a vraiment dessus avant de la transmettre au laboratoire forensique, comment tu fais ? »",
            "law": "<strong>Acquisition forensique</strong> — Image bit-à-bit avec write-blocker.<br><strong>FTK Imager / dd</strong> — Outils standards.",
            "question": "<strong>Quel protocole d'analyse ?</strong>",
            "choices": [
                {
                    "text": "Sur poste isolé du réseau (idéalement Linux live USB), avec USB write-blocker matériel : montage en lecture seule, calcul du hash SHA-256, image disque dd ou FTK Imager, analyse de l'image (jamais de la clé directement) : structure FAT/exFAT, fichiers cachés, métadonnées, scan VirusTotal, sandbox des éventuels exécutables.",
                    "ok": True, "pts": 25,
                    "fb": "Protocole forensique standard. Vous respectez ISO/IEC 27037 : (1) intégrité (write-blocker, hash), (2) reproductibilité (image = analyse répétable sans risque), (3) traçabilité (chaque étape documentée). C'est exactement ce qu'enseignent les modules forensique du CAS.",
                    "legal": "ISO/IEC 27037 — Procédure standard.",
                    "critical": False, "next": 2
                },
                {
                    "text": "Vous la branchez sur une VM Windows isolée dans VirtualBox sur votre poste habituel. Si quelque chose se passe, c'est dans la VM, pas sur l'hôte.",
                    "ok": False, "pts": -15,
                    "fb": "Naïf. (1) Si BadUSB : la clé tape sur le clavier de l'hôte, pas dans la VM. La VM ne protège pas contre HID injection. (2) Certains malwares modernes détectent VM (« VM-aware ») et exfiltrent quand même via vulnérabilités de l'hyperviseur. La VM peut être un complément à l'isolation matérielle, jamais un substitut.",
                    "legal": "Doctrine GovCERT — VM ≠ isolation matérielle.",
                    "critical": False, "next": 2
                },
                {
                    "text": "Vous transmettez directement la clé au laboratoire forensique cantonal sans rien analyser vous-même. C'est leur travail, pas le vôtre.",
                    "ok": False, "pts": 10,
                    "fb": "Pas faux mais minimaliste. La transmission est correcte, mais vous ratez l'<strong>opportunité d'apprentissage</strong> et la <strong>rapidité d'investigation</strong>. Une analyse préliminaire de surface (write-blocker + listage de fichiers) prend 20 min et oriente le labo. Le réflexe « ce n'est pas mon travail » fait passer à côté de la valeur ajoutée du DFIR de proximité.",
                    "legal": "Bonnes pratiques DFIR — Analyse préliminaire utile.",
                    "critical": False, "next": 2
                }
            ]
        },
        {
            "phase": "📚 La pédagogie",
            "situation": "L'analyse révèle un fichier exécutable « Tesi_Bachelor_Computer_Science.pdf.exe » (extension cachée par défaut Windows) qui, en sandbox, télécharge un beacon vers une IP en Russie. C'est une attaque APT classique. Mme Brägger : « Maintenant, le plus important : qu'est-ce que tu fais de l'incident côté école ? »",
            "law": "<strong>Pédagogie cybersécurité</strong> — Transformer incidents en sensibilisation.",
            "question": "<strong>Quelle suite institutionnelle ?</strong>",
            "choices": [
                {
                    "text": "(1) Réunion avec direction SUPSI + IT de l'école pour rapporter (sans dramatiser ni minimiser). (2) Communication aux étudiants : courrier expliquant ce qui a été trouvé, le réflexe à avoir (\"Si vous trouvez une clé USB, ne la branchez pas, déposez-la à l'IT\"). (3) Proposition d'intégrer l'incident anonymisé dans un cours de cybersécurité du semestre prochain. (4) La stagiaire qui a trouvé la clé est invitée à co-présenter — elle a fait le bon réflexe (apporter à l'enseignant).",
                    "ok": True, "pts": 25,
                    "fb": "Plan parfait. Vous transformez : (1) un incident isolé en gain pédagogique systémique, (2) une stagiaire qui aurait pu être traumatisée en ambassadrice. Le SUPSI gagne en culture sécurité, vous gagnez un canal de signalement futur (les autres étudiants reproduiront le bon réflexe), Mme Brägger : « Voilà. C'est ça qui fait la différence entre cybersécurité technique et cybersécurité durable. »",
                    "legal": "Doctrine GovCERT + pédagogie cyber — Standard moderne.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "Discrétion totale : on transmet le dossier au MP-TI pour la procédure pénale, mais aucune communication interne à l'école pour ne pas \"effrayer\" les étudiants.",
                    "ok": False, "pts": -15,
                    "fb": "Mauvaise stratégie. La discrétion totale empêche toute pédagogie : les autres étudiants brancheront la prochaine clé qu'ils trouvent. La cybersécurité durable repose sur la <strong>transparence pédagogique</strong> (parler des incidents, anonymisés, pour apprendre collectivement). Le silence est l'allié de l'attaquant.",
                    "legal": "Doctrine GovCERT — Transparence pédagogique.",
                    "critical": False, "next": "end"
                },
                {
                    "text": "Communication massive : email général à tous les étudiants et personnels SUPSI avec photos de la clé, IP malveillante, et avertissement \"alerte cyber-attaque\".",
                    "ok": False, "pts": -10,
                    "fb": "Trop dramatique. (1) Photos = aide les attaquants futurs à varier leurs étiquettes. (2) Mention IP malveillante = info opérationnelle qui ne sert à rien aux étudiants. (3) Tonalité \"alerte\" = anxiogène, démobilise au lieu de sensibiliser. La pédagogie efficace est <strong>calme, pratique, factuelle</strong>.",
                    "legal": "Pédagogie cyber — Tonalité calme et constructive.",
                    "critical": False, "next": "end"
                }
            ]
        }
    ],
    "npcs": ["sg_polcyber_chief", "ti_pol_chiasso"],
    "regionDetail": {"code": "TI", "flag": "🇨🇭", "name": "Tessin"}
}

# ═══════════════════════════════════════════════════════════════
# Sauvegarde des 2 dernières scènes
# ═══════════════════════════════════════════════════════════════

with open(f'{OUTPUT_DIR}/easy-aide-grand-mere-arnaque.json', 'w', encoding='utf-8') as f:
    json.dump(scene6, f, ensure_ascii=False, indent=2)

with open(f'{OUTPUT_DIR}/easy-cle-usb-trouvee.json', 'w', encoding='utf-8') as f:
    json.dump(scene7, f, ensure_ascii=False, indent=2)

print(f"✓ Scène 6 (VS arnaque) : {len(json.dumps(scene6, ensure_ascii=False))} chars")
print(f"✓ Scène 7 (TI clé USB) : {len(json.dumps(scene7, ensure_ascii=False))} chars")

# ═══════════════════════════════════════════════════════════════
# ARC PNJ — "Premiers réflexes cyber"
# ═══════════════════════════════════════════════════════════════

new_arc = {
    "npc_id": "sg_polcyber_chief",
    "title": "Premiers réflexes cyber — De Lausanne à Chiasso",
    "subtitle": "Mme Brägger accompagne ses 7 premières affaires",
    "icon": "🎓",
    "description": "Mme Brägger (PolSG, IFC) sert de mentor·e à un·e jeune inspecteur·trice fraîchement nommé·e. À travers 7 scènes faciles couvrant l'ensemble de la Suisse romande et italienne, elle transmet les bons réflexes DFIR : protection des victimes, rigueur procédurale, OSINT propre, pédagogie en milieu professionnel, accompagnement des publics vulnérables, refus des fausses bonnes idées. Un parcours de découverte des fondamentaux du métier.",
    "stages": [
        {
            "stage": 1,
            "scene_id": "easy-mobile-perdu-train",
            "year": 2026,
            "role_state": "mentor à distance par messagerie",
            "narrative_key": "Premier dossier : téléphone perdu. Apprend les bons réflexes des 30 premières minutes (verrouillage à distance, sessions cloud, plainte cantonale).",
            "skills_demonstrated": [
                "premiers réflexes équipement mobile",
                "compétence territoriale art. 31 CPP",
                "LPD 2023 art. 24 — notification PFPDT"
            ]
        },
        {
            "stage": 2,
            "scene_id": "easy-premiere-perquisition",
            "year": 2026,
            "role_state": "marraine de stage par téléphone",
            "narrative_key": "Première ordonnance de séquestre cyber : apprend à distinguer mandat de perquisition (244 CPP) et ordonnance de séquestre (263 CPP), à anticiper la mise sous scellés (248 CPP), à respecter la proportionnalité (197 CPP).",
            "skills_demonstrated": [
                "rédaction ordonnance de séquestre",
                "anticipation scellés art. 248 CPP",
                "proportionnalité art. 197 CPP"
            ]
        },
        {
            "stage": 3,
            "scene_id": "easy-fake-news-elections",
            "year": 2026,
            "role_state": "mentor en visio depuis Saint-Gall",
            "narrative_key": "Désinformation pré-votation. Apprend à distinguer délit pénal (art. 282 CP) et désinformation (libertés art. 16-17 Cst.), à mener un OSINT propre, à saisir les bons canaux (GovCERT, Trust & Safety plateforme).",
            "skills_demonstrated": [
                "qualification juridique désinformation",
                "OSINT licite",
                "saisine GovCERT vs MP"
            ]
        },
        {
            "stage": 4,
            "scene_id": "easy-pme-mot-passe-faible",
            "year": 2026,
            "role_state": "mentor sur haut-parleur",
            "narrative_key": "Conseil cyber à une PME fribourgeoise. Apprend la pédagogie sans stigmatisation, MFA + gestionnaire de mots de passe, analyse risque LPD pour notification PFPDT.",
            "skills_demonstrated": [
                "pédagogie cyber PME",
                "doctrine NIST SP 800-63B",
                "analyse risque LPD art. 24"
            ]
        },
        {
            "stage": 5,
            "scene_id": "easy-suspicions-collegues",
            "year": 2026,
            "role_state": "mentor par Threema",
            "narrative_key": "Signalement interne d'un collègue. Apprend à protéger le lanceur d'alerte (LPD art. 19), à respecter la subsidiarité pénale (audit interne avant MP), à préserver les preuves sans contamination.",
            "skills_demonstrated": [
                "protection lanceur d'alerte",
                "subsidiarité pénale",
                "préservation preuve ISO 27037"
            ]
        },
        {
            "stage": 6,
            "scene_id": "easy-aide-grand-mere-arnaque",
            "year": 2026,
            "role_state": "mentor sur haut-parleur",
            "narrative_key": "Arnaque grand-parents (Enkeltrick). Apprend l'accueil victimologique, le réseau LAVI, la dimension réseau de la cybercriminalité organisée (cluster d'appels VoIP).",
            "skills_demonstrated": [
                "accueil victime LAVI",
                "art. 22 + 146 CP tentative",
                "investigation cluster VoIP"
            ]
        },
        {
            "stage": 7,
            "scene_id": "easy-cle-usb-trouvee",
            "year": 2026,
            "role_state": "mentor par Threema",
            "narrative_key": "USB drop dans une école. Apprend le refus du branchement intuitif, l'analyse forensique en environnement isolé, la transformation d'un incident en pédagogie institutionnelle.",
            "skills_demonstrated": [
                "doctrine USB drop",
                "acquisition forensique write-blocker",
                "pédagogie cybersécurité institutionnelle"
            ]
        }
    ],
    "completion_badge": "🎓 Apprenti DFIR",
    "completion_text": "Vous avez complété les 7 scènes du parcours « Premiers réflexes cyber » avec Mme Brägger. Les fondamentaux du DFIR suisse sont en place : protection des victimes, rigueur procédurale, accompagnement humain. Mme Brägger vous écrit : « Tu es prêt·e pour la suite. Les dossiers sérieux t'attendent. » Le mode <strong>Medium</strong> du parcours s'ouvre."
}

# Charger npc-arcs.json existant et ajouter
arcs_path = 'data/npc-arcs.json'
arcs_data = json.load(open(arcs_path))

# L'arc principal a pour clé l'id de l'arc
arc_id = "premiers_reflexes_cyber"
arcs_data['arcs'][arc_id] = new_arc

# Mise à jour version + description si présents
if '$version' in arcs_data:
    arcs_data['$version'] = arcs_data['$version'] + ' + v2.63 easy arc'

with open(arcs_path, 'w', encoding='utf-8') as f:
    json.dump(arcs_data, f, ensure_ascii=False, indent=2)

print(f"\n✓ Arc PNJ ajouté : {arc_id} ({len(new_arc['stages'])} stages)")
print(f"  Total arcs maintenant : {len(arcs_data['arcs'])}")
