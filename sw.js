// Service Worker — CAS-IN Investigation Numérique
// v69 : v2.35 — Retrofit bloc 7 (5 anciennes scènes adaptées)
//
//       Version sans nouveau scénario, focalisée sur la mise à niveau
//       systématique du corpus historique. Bloc 7 = diversification
//       continue : Android malware + BEC / douane / harcèlement portail
//       anonyme / IA générative / IoT camera.
//
//       Retrofit bloc 7 — 5 anciennes scènes adaptées :
//
//         • flubot-bec-cascade (5 steps, medium) — FluBot Android
//             commune romande 6'400 habitants, BEC 47'800 CHF
//             npcs=[ofs_rssi_fedch, fr_prosecutor_cyber]
//             Bif. step 4 #1 et #2 next=-1 → 'end'
//             Marqueur : sanction individuelle secrétaire = ATF
//             6B_383/2019 erreur excusable, démotive déclarations.
//
//         • frontieres (5 steps, medium) — Voyageur Moscou ZH,
//             douanier veut accéder laptop chiffré
//             npcs=[nicolet, ddps_general_counsel]
//             Marqueur step 0 #0 (forcer accès laptop sans cadre =
//             violation art. 31 al. 1 Cst + art. 4 al. 1 LDoua)
//
//         • harcelement-ne (5 steps, easy) — Portail Anonyme NE,
//             signalements harcèlement
//             npcs=[ge_prosecutor_cyber, forensics_lead_zh]
//             Marqueur step 0 #1 (publication clear non vérifiée
//             viole nLPD + présomption innocence + diligence cantonale)
//
//         • ia-generative-faux-titres (5 steps, hard) — Faux CV/
//             contrats IA-générés, M. V. consultant TechCorp
//             npcs=[ge_prosecutor_cyber, forensics_lead_zh]
//             Bif. step 4 #1 et #2 next=-1 → 'end'
//             Marqueur : peine plancher 5 ans pour usage IA =
//             disproportionnée (art. 251 CP : 5 ans MAX, pas plancher)
//
//         • iot-camera-compromise (5 steps, hard) — Caméra Reolink
//             compromise 47 connexions étrangères, cambriolage Mme L.
//             npcs=[forensics_lead_zh, ge_prosecutor_cyber]
//             Bif. step 4 #1 et #2 next=-1 → 'end'
//             Marqueur : bloquer toutes preuves IoT = priver victime,
//             expertise forensique adaptée existe (NTP+EXIF+hash+logs)
//
//       Pas de nouveau PNJ cette release (réutilisation des 8 PNJ
//       transposables existants). Troisième release consécutive
//       (après v2.32 et v2.34) sans création de PNJ.
//
//       Note : 2 scènes initialement proposées (ia-medicale-genome,
//       intrusion-stable) n'existent pas dans le corpus. Remplacées
//       par 'ia-generative-faux-titres' et 'iot-camera-compromise',
//       thématiques distinctes mais cohérentes avec la diversification.
//
//       Stats : 110 scènes / 30 PNJ / 43 scènes avec NPCs.
//
//       Approche retrofit "par bloc de 5" : ~62 scènes restantes
//       après v2.35. Reste ~12 blocs.
//
//
//       Version sans nouveau scénario, focalisée sur la mise à niveau
//       systématique du corpus historique. Bloc 6 = diversification
//       continue : opération multi-juridictions / traite EH / vishing
//       aînés / malware fileless / SCADA hydroélectrique.
//
//       Retrofit bloc 6 — 5 anciennes scènes adaptées :
//
//         • eu-endgame-botnets (5 steps, hard) — Opération Endgame
//             botnets droppers FR-DE-NL coordonnée Eurojust
//             npcs=[fbi_legat_bern, nicolet]
//             Marqueur step 0 #1 (avancer/retarder unilatéralement
//             les actions suisses sans coordination Eurojust brûle
//             l'opération multi-juridictions)
//
//         • eu-traite-roumain (5 steps, hard) — Réseau roumain
//             traite EH Eurojust + DIICOT, opération Bukareszt
//             npcs=[fbi_legat_bern, nicolet]
//             Marqueur step 0 #1 (procéder sans coordination LAVI
//             trauma-informed transforme victimes en suspectes ou
//             témoins muets)
//
//         • faux-policiers (4 steps, medium) — Vishing aînés NE
//             "faux policier coursier"
//             npcs=[ge_prosecutor_cyber, forensics_lead_zh]
//             Marqueur step 0 #1 (communication publique précoce
//             alerte les organisateurs et fait migrer infra)
//
//         • fileless (8 steps, hard) — Malware fileless bancaire,
//             RAM-only Cobalt Strike T1055
//             npcs=[forensics_lead_zh, ciso_logitech]
//             Marqueur step 0 #0 (extinction du système efface la
//             RAM = preuve disparait définitivement)
//
//         • hydro-valais (5 steps, hard) — Barrage Mauvoisin
//             SCADA compromis, Val de Bagnes >10k habitants en aval
//             npcs=[ofcs_coordinator, forensics_lead_zh]
//             Bif. step 4 #1 et #2 → 'end' (déjà en place)
//             Marqueur : maintenir barrage en service standard
//             après compromission SCADA viole doctrine OFEN/OFCS
//             classe I.
//
//       Pas de nouveau PNJ cette release (réutilisation des 8 PNJ
//       transposables existants).
//
//       Note : 2 scènes initialement proposées (fr-gendarmerie,
//       gestionnaire-fortune) n'existent pas dans le corpus.
//       Remplacées par 'fileless' (malware fileless bancaire) et
//       'hydro-valais' (SCADA hydroélectrique CII), thématiques
//       distinctes mais cohérentes avec la diversification.
//
//       Stats : 110 scènes / 30 PNJ / 38 scènes avec NPCs
//       (33 v2.33 + 5 retrofit bloc 6).
//
//       Approche retrofit "par bloc de 5" : ~67 scènes restantes
//       après v2.34. Reste ~13 blocs.
//
//
//       Nouveau scénario v2.33 (corpus 109 → 110) :
//
//         • src-fonctionnaire-russe-kaspersky (hard, BE/MPC)
//             Pitch  : Affaire SRC-Kaspersky 2015-2020 révélée par
//                      SRF Investigativ en juin 2025 ; Conseil fédéral
//                      autorise enquête MPC le 30 juin 2025. Officier
//                      SRC en chef équipe cyber aurait transmis des
//                      données sensibles à Kaspersky → GRU via 3
//                      entreprises (Kaspersky + "Bleu" Zurich + "Violette"
//                      Tessin/Berne). Période 2015-2020, 2 alertes
//                      services alliés (NSA + BfV) en 2020.
//             Rôle   : Procureur fédéral cyber au MPC à Berne
//             PNJ    : nicolet (procureur cyber MPC, réel),
//                      src_director (fictif), ddps_general_counsel
//                      (Aebischer, fictif transposable, ajout v2.33)
//             Bif.   : step 0 #1 → 'end' (communication publique
//                      nominative + qualification "trahison" art. 267
//                      + détention provisoire = catastrophe procédurale
//                      CEDH + rupture coopération NSA/BfV/BND)
//             Tags   : SRC, Kaspersky, GRU, art. 267/271/272/320 CP,
//                      LRens, art. 73 CPP secret enquête, art. 86 CPP
//                      pièces classifiées, présomption innocence
//                      (Allenet de Ribemont 1995), CRP préparée pour
//                      témoignage déclassifié, doctrine responsabilité
//                      fonctionnelle, GPDel parlementaire, bilan en
//                      4 cercles (citoyens / parlement / exécutif /
//                      alliés)
//             Sources : RTS + SRF Investigativ + ICTjournal + 20min
//                      + swissinfo + watson (juin-juillet 2025)
//             Anonymisation : personnes réelles → M. X. (officier),
//                      M. P. (ingénieur Kaspersky), Chefs A/B/C,
//                      "Bleu"/"Violette" entreprises. Conseiller
//                      fédéral Pfister mentionné par fonction.
//
//       Retrofit bloc 5 — 5 anciennes scènes adaptées :
//
//         • darkmarket_2021 (8 steps, hard) — Europol darknet ZH
//             npcs=[pjf_undercover_lead, nicolet]
//             Marqueur step 0 #0 (perquisition mal cadrée brûle
//             coopération Europol + chaîne forensique crypto)
//
//         • deepfake-audio-garde-a-vue (5 steps, hard) — deepfake
//             audio en interrogatoire enlèvement enfant
//             npcs=[forensics_lead_zh, ge_prosecutor_cyber]
//             Bif. step 4 #1 et #2 next=-1 → 'end'
//             Marqueur : conclusion publique definitive sans
//             expertise forensique contradictoire = cassation appel
//
//         • delemont-forum (5 steps, easy) — Forum Cyber des
//             Communes JU, sensibilisation
//             npcs=[ofs_rssi_fedch, ofcs_coordinator]
//             Marqueur step 1 #2 (message techno-anxiogène sans
//             solutions concrètes décrédibilise et démotive)
//
//         • eu-crypto-kidnapping (5 steps, medium) — enlèvement-
//             chantage rançon crypto Arc Lémanique GE/FR
//             npcs=[ge_prosecutor_cyber, nicolet]
//             Marqueur step 0 #1 (sous-estimer urgence transforme
//             cellule active en cold case 24h)
//
//         • eu-cyber-trading-fraud (5 steps, medium) — fraude
//             trading retraité 73 ans Schaffhouse
//             npcs=[forensics_lead_zh, nicolet]
//             Marqueur step 0 #1 (accueil sceptique = victimisation
//             secondaire, victimes ne reviennent plus signaler)
//
//       1 nouveau PNJ ajouté à data/npcs.json (29 → 30) :
//         • ddps_general_counsel (Aebischer, fictive transposable,
//                                  conseillère juridique principale
//                                  DDPS, expertise LRens + art. 271-
//                                  272 + 320 CP + supervision SRC
//                                  via GPDel)
//
//       Stats : 110 scènes / 30 PNJ / 33 scènes avec NPCs (8 v2.24
//       + v2.28 + 5 retrofit bloc 1 + 2 v2.30 nouveaux + 5 retrofit
//       bloc 2 + 5 retrofit bloc 3 + 5 retrofit bloc 4 + 1 v2.33
//       nouveau + 5 retrofit bloc 5 - 3 doublons = 33 scènes au
//       total avec NPCs).
//
//       Approche retrofit "par bloc de 5" : ~72 scènes restantes
//       après v2.33. Reste ~14 blocs à retrofit.
//
//
//       Version sans nouveau scénario, focalisée sur la mise à niveau
//       systématique du corpus historique. Bloc 4 = diversification
//       continue : rédaction rapport / coopération européenne / IoT-
//       stalking / fraude DAB / deepfake électoral.
//
//       Retrofit bloc 4 — 5 anciennes scènes adaptées :
//
//         • conclusion (5 steps, medium) — rédaction rapport forensique
//             npcs=[forensics_lead_zh, nicolet]
//             Marqueur step 0 #0 (affirmations sans support technique
//             direct invalidées au procès).
//
//         • coup-de-filet-europol-27-pays (5 steps, expert) — opération
//             EUROPOL multi-juridictionnelle simultanée
//             npcs=[fbi_legat_bern, nicolet]
//             Bif. step 4 #1 et #2 next=-1 → 'end'
//             Marqueur : communiquer noms 200+ agents avant bouclage =
//             représailles + fragilisation opérations futures.
//
//         • crypto-stalking-airtag-emirats (5 steps, hard) — IoT
//             stalking AirTag par ex-conjoint aux Émirats
//             npcs=[ge_prosecutor_cyber, ofcs_coordinator]
//             Bif. step 4 #1 et #2 next=-1 → 'end'
//             Marqueur : faire fuir la victime = inversion des rôles
//             violant CEDH Opuz v Turquie 2009 (obligation positive).
//
//         • dab-villaz (5 steps, medium) — attaques au gaz DAB FR
//             npcs=[fr_prosecutor_cyber, forensics_lead_zh]
//             Marqueur step 0 #1 (enquête sans cyber-forensics =
//             reproduction erreur Glâne 2022-2023, dossier froid).
//
//         • deepfake-electoral (5 steps, hard) — Conseiller fédéral à
//             J-48h votation populaire
//             npcs=[ofcs_coordinator, src_director]
//             Marqueur step 4 #1 (report votation art. 34 LDP =
//             rupture sans précédent calendrier démocratique).
//
//       Pas de nouveau PNJ cette release (réutilisation des 7 PNJ
//       transposables existants).
//
//       Note : la scène initialement proposée 'deepfake-formation-rh'
//       n'existe pas dans le corpus, remplacée par 'deepfake-electoral'
//       (deepfake d'un Conseiller fédéral 48h avant votation populaire).
//
//       Stats : 109 scènes / 29 PNJ / 28 scènes avec NPCs (8 v2.24+v2.28
//       + 5 retrofit bloc 1 + 2 v2.30 nouveaux + 5 retrofit bloc 2 + 5
//       retrofit bloc 3 + 5 retrofit bloc 4 - 2 doublons des v2.30
//       comptés ailleurs = 28 scènes au total).
//
//       Approche retrofit "par bloc de 5" : ~77 scènes restantes après
//       v2.32. Reste ~15 blocs.
//
//
//       Version sans nouveau scénario, focalisée sur la mise à niveau
//       systématique du corpus historique. Bloc 3 = diversification
//       maximale : diplomatie / humanitaire / santé / cloud / ransomware.
//
//       Retrofit bloc 3 — 5 anciennes scènes adaptées :
//
//         • burgenstock-neutralite (5 steps, hard) — sommet diplomatique
//             npcs=[ofcs_coordinator, src_director]
//             Bif. step 4 #1 et #2 next=-1 → 'end'
//             Marqueur : attribution publique précipitée à un État
//             (Russie/Chine/Iran) sans validation SRC viole la
//             neutralité (Convention La Haye 1907 + LMSI).
//
//         • cicr_2022 (8 steps, hard) — Croix-Rouge Genève, incident réel
//             janvier 2022 (515'000 personnes vulnérables exposées)
//             npcs=[cicr_dpo, ge_prosecutor_cyber]
//             Marqueur step 0 #0 (sous-estimer la gravité humanitaire =
//             violation doctrine 'do no harm', risque physique pour
//             réfugiés / disparus / personnes en zones de conflit).
//
//         • cistec-2025-sante (5 steps, hard) — éditeur logiciel
//             hospitalier ZH, 23 hôpitaux clients (CHUV, HUG, Inselspital)
//             npcs=[ciso_logitech, forensics_lead_zh]
//             Bif. step 4 #1 et #2 next=-1 → 'end'
//             Marqueur : communication anticipée alarmiste = réaction en
//             chaîne (patients, presse, hôpitaux poursuivant Cistec).
//
//         • cloud-aws-s3-leak (5 steps, hard) — RSSI OFS, bucket S3 ouvert
//             chez sous-traitant fédéral DataMine
//             npcs=[ofs_rssi_fedch, ofcs_coordinator]
//             Bif. step 4 #1 et #2 next=-1 → 'end'
//             Marqueur : saisir uniquement le sous-traitant viole le
//             principe d'accountability (art. 5 nLPD), l'OFS reste
//             responsable du traitement.
//
//         • comparis_2021 (5 steps, medium) — Hive ransomware, incident
//             réel août 2021 sur Comparis.ch
//             npcs=[ciso_logitech, nicolet]
//             Marqueur step 0 #2 (paiement rançon Bitcoin sans analyse
//             forensique = financement criminel + non-garantie + viole
//             recommandations OFCS/FBI/NCSC).
//
//       2 nouveaux PNJ ajoutés à data/npcs.json (27 → 29) :
//         • cicr_dpo (Tedeschi, fictif transposable, DPO CICR Genève)
//         • ofs_rssi_fedch (Schaller, fictif transposable, RSSI office
//                            fédéral générique)
//
//       Stats : 109 scènes / 29 PNJ / 23 scènes avec NPCs (8 v2.24+v2.28
//       + 5 retrofit bloc 1 + 2 v2.30 nouveaux + 5 retrofit bloc 2 + 5
//       retrofit bloc 3 (- 2 doublons des nouveaux comptés ailleurs)
//       = 23 scènes avec NPCs au total).
//
//       Approche retrofit "par bloc de 5" : ~82 scènes restantes après
//       v2.31. Reste ~16 blocs.
//
//
//       Nouveaux scénarios v2.30 (corpus 107 → 109) :
//
//         • handala-hack-iran-rhne-stryker (medium, NE/Marin-Épagnier)
//             Pitch  : Sous-traitant suisse de Stryker à Neuchâtel touché
//                      par Handala (groupe iranien lié au MOIS) via
//                      latéralisation cross-tenant Microsoft Intune
//                      depuis Stryker mère (mars 2026, attaque réelle)
//             Rôle   : CISO Rhône-Médical SA (PME medtech 220 ETP)
//             PNJ    : ciso_medsupplier_ne (Pellet, fictif), fbi_legat_bern
//                      (Donovan, fictif), ofcs_coordinator (Tschanz, fictif)
//             Bif.   : step 0 #1 → 'end' (réinitialisation Intune brutale =
//                      destruction des preuves forensiques)
//             Tags   : APT iranien, Microsoft Intune wiper, OAuth persistance,
//                      FIDO2 vs MFA SMS, cross-tenant federation, MITRE
//                      T1098/T1486/T1078, nLPD art. 24, Convention Budapest
//                      art. 31, MLAT US-CH, OFCS hub coordination
//             Sources réelles : TechCrunch + CheckPoint + CyberScoop
//                      + CISA + Times of Israel (mars 2026 Stryker hack)
//
//         • cyber-justicier-vigilante-fr (hard, FR/Bulle)
//             Pitch  : Pédo-hunter amateur fribourgeois (inspiré Yannick
//                      RTS oct 2025) transmet à PolCant FR un dossier
//                      800 pages incluant chats + embuscade physique +
//                      diffusion publique Telegram. Question recevabilité
//                      des preuves obtenues par tiers + qualification.
//             Rôle   : Procureure adjointe MP-FR section criminalité
//                      informatique et atteintes aux mineurs
//             PNJ    : fr_prosecutor_cyber (Genoud, fictif transposable),
//                      ge_prosecutor_cyber (Cottier, fictif transposable),
//                      src_director (fictif, conseil stratégique)
//             Bif.   : step 0 #1 → 'end' (audition Yannick comme témoin +
//                      versement sans tri + arrestation brutale M.T. =
//                      catastrophe procédurale + risque suicide majeur)
//             Tags   : ATF 137 IV 33 preuves de tiers, CEDH Sutherland 2020,
//                      art. 141 al. 2 CPP, art. 187/197 CP, art. 22 tentative,
//                      TF 6B_572/2018 (enfants fictifs), art. 181/183/173-174
//                      CP qualification cyber-vigilantes, audition
//                      parlementaire posture équilibrée
//             Sources réelles : RTS oct 2025 article "Yannick" pédo-hunters,
//                      AOC media analyse vigilantisme, jurisprudence
//                      Sutherland UKSC 32 (2020)
//
//       Retrofit bloc 2 — 5 anciennes scènes adaptées :
//
//         • audit-prestataire-systemique (5 steps, hard) — ISAE 3402, VS
//             npcs=[forensics_lead_zh, ofcs_coordinator]
//             Bif. step 4 #1 et #2 next=-1 → 'end'
//
//         • banque-privee-mlat (5 steps, expert) — MLAT US-CH, GE
//             npcs=[ge_prosecutor_cyber, compliance_bs, fbi_legat_bern]
//             Bif. step 4 #1 et #2 next=-1 → 'end'
//
//         • banquier-fantome (5 steps, hard) — faux technicien NE/MPC
//             npcs=[nicolet, compliance_bs]
//             Marqueur step 3 #2 (court-circuit procédural)
//
//         • boutique-fantome (4 steps, medium) — fraude e-commerce BS
//             npcs=[forensics_lead_zh, nicolet]
//             Marqueur step 0 #1 (qualification 146 vs 147 CP)
//
//         • clone-vocal (5 steps, medium) — deepfake voix CEO fraud SZ
//             npcs=[ciso_logitech, nicolet]
//             Marqueur step 0 #2 (catastrophe forensique audio)
//
//       3 nouveaux PNJ ajoutés à data/npcs.json (24 → 27) :
//         • ciso_medsupplier_ne (fictif, CISO Rhône-Médical NE)
//         • fbi_legat_bern (fictif, FBI Legal Attaché ambassade US Berne)
//         • fr_prosecutor_cyber (fictif transposable, procureure cyber FR)
//
//       Stats : 109 scènes / 27 PNJ / 18 scènes avec NPCs (8 v2.24+v2.28 +
//       5 retrofit bloc 1 + 2 v2.30 nouveaux + 5 retrofit bloc 2 — wait,
//       les 2 v2.30 nouveaux sont comptés à part : 8 + 5 + 2 + 3 = 18. La
//       scène cyber-justicier est nouvelle, et boutique-fantome existait
//       déjà — 13 anciennes + 5 nouvelles = 18 scènes avec NPCs).
//
//       Approche retrofit "par bloc de 5" : ~92 scènes restantes après
//       v2.29 → ~87 scènes restantes après v2.30. Reste ~17 blocs.
//
//
//       Nouveaux scénarios v2.29 (corpus 105 → 107) :
//
//         • mini-natels-prison-pochwies (medium, ZH/Pöschwies)
//             Pitch  : Fouille EPO Pöschwies, 3 mini-natels chinois (18 CHF
//                      pièce) avec firmware Necro préinstallé contactant
//                      C2 cambodgien — risque supply chain pénitentiaire
//             Rôle   : inspecteur·trice cyber-enquêtes PolCant ZH
//             PNJ    : epo_director (Wegmann, fictif), mobile_expert_lookout
//                      (Halder, fictif), labhart (procureur MP-ZH, réel)
//             Bif.   : step 0 #1 → next: 'end' (déverrouillage forcé =
//                      violation art. 113 CPP nemo tenetur)
//             Tags   : OPE 2024, art. 304-307bis CP, Necro firmware,
//                      Lookout/Citizen Lab, audit CCDJP cross-cantonal,
//                      brouilleurs LTC art. 34
//
//         • drone-laufenburg-swissgrid-aargau (hard, AG/Laufenburg)
//             Pitch  : 5 survols nocturnes drones sur l'étoile Swissgrid
//                      (380 kV, hub ENTSO-E européen). Attribution difficile.
//             Rôle   : commissaire fedpol PJF / division CII
//             PNJ    : swissgrid_cirt (Hauser, fictif), ofcs_coordinator
//                      (Tschanz, fictif), nicolet (procureur cyber MPC, réel)
//             Bif.   : step 0 #1 → next: 'end' (escalade militaire prématurée
//                      Forces aériennes = LAAM art. 92 disproportionné)
//             Tags   : art. 224bis CP sabotage CII, ENTSO-E coordination,
//                      doctrine OFCS Drone-CII, attribution false flag
//
//       Retrofit bloc 1 — 5 anciennes scènes adaptées :
//
//         • attribution (8 steps, hard) — npcs=[forensics_lead_zh, nicolet]
//         • bitlocker (5 steps, medium) — npcs=[forensics_lead_zh]
//         • adn-genealogique-cold-case (5 steps, hard) — npcs=[fim_genealogist,
//                                                              forensics_lead_zh]
//         • agent-infiltre-darknet-14-mois (5 steps, expert) —
//                                            npcs=[pjf_undercover_lead]
//         • bec-pme-geneve-italie (6 steps, expert) — npcs=[ge_prosecutor_cyber,
//                                                            compliance_bs]
//                Bifurcation créée step 3 #2 (court-circuit EIMP via Polizia
//                Postale Milano = art. 271 CP violation souveraineté) → 'end'
//
//       Pour chaque scène retrofit : ajout npcs + marqueur "📍 BIFURCATION
//       NARRATIVE" dans le fb du distracteur de bifurcation. Conversion
//       next=-1 → 'end' explicite pour adn-genealogique et agent-infiltre.
//
//       8 nouveaux PNJ ajoutés à data/npcs.json (16 → 24) :
//         • epo_director (fictif, dir. sécurité Pöschwies)
//         • mobile_expert_lookout (fictif, mobile threat intel)
//         • swissgrid_cirt (fictif, CIRT Swissgrid)
//         • ofcs_coordinator (fictif, OFCS desk CII)
//         • forensics_lead_zh (fictif, transposable, chef labo cyber-forensics PolCant ZH)
//         • ge_prosecutor_cyber (fictif, transposable, procureure GE cyber)
//         • pjf_undercover_lead (fictif, cheffe agents infiltrés PJF)
//         • fim_genealogist (fictif, cheffe FGG forensique FOR-ZH)
//
//       Stats : 107 scènes / 24 PNJ / 13 scènes avec NPCs (8 v2.24+v2.28
//       + 5 retrofit bloc 1).
//
//       Approche retrofit "par bloc de 5" : ~92 scènes restantes à
//       adapter dans les versions ultérieures (~18 blocs).
//
//       Cette version ajoute 3 scènes documentées sur l'actualité DFIR
//       suisse récente (sources : Bilan 17.12.2025, Tribune de Genève
//       17.11.2025, Blick 12.10.2025, Le Temps 15.11.2025).
//
//         • crypto-tinder-pig-butchering-vaud (hard, VD/Morges)
//             Source : ICIJ « Coin Laundry »
//             Pitch  : Eléonore (43 ans) plainte 208'000 CHF perdus
//                      via Tinder + bdsuex.com → Cambodge/Huione
//             Rôle   : inspecteur cyber-enquêtes PolCant VD
//             PNJ    : eleonore (fictif), vuilleumier (Heptagone, réel),
//                      labhart (MP-ZH expert pig butchering, réel)
//             Bif.   : step 1 #2 → next: 4 (saute 2 steps)
//             Tags   : pig butchering, cryptotraçage, MLAT, Convention
//                      de Budapest, Huione, OFS 6.6%
//
//         • attentat-deja-couteau-mineur (expert, AG/Aarau)
//             Source : interview Stefan Blättler, Blick 10.2025
//             Pitch  : SRC alerte sur radicalisation 18 ans Aarau,
//                      passage à l'acte estimé < 9 jours, projet
//                      « action au couteau dans un lieu chrétien »
//             Rôle   : procureur·e fédéral·e cellule terrorisme MPC
//             PNJ    : blattler (PG MPC, réel), nicolet (procureur cyber
//                      MPC, réel), src_director (cheffe SRC, fictif)
//             Bif.   : step 0 #2 (transmettre PolCant ZH) → next: 'end'
//             Tags   : terrorisme, art. 260sexies/260bis CP, LRens 79,
//                      mineur radicalisé, DPMin, TIGRIS, déradicalisation
//
//         • logitech-clop-zero-day-supply-chain (hard, VD/Crissier)
//             Source : Le Temps 15.11.2025
//             Pitch  : Logitech découvre leak Clop sur darkweb DLS,
//                      0-day Oracle E-Business Suite, 1.79 TB exfiltrés,
//                      218'000 personnes touchées, position non-paiement
//             Rôle   : CISO Logitech (fictif M. Aellig)
//             PNJ    : ciso_logitech (fictif), nicolet (procureur cyber
//                      MPC, réel), pfpdt_inspector (PFPDT, fictif)
//             Bif.   : step 1 #2 (payer rançon en cachant à PFPDT)
//                      → next: 4 (saute 2 steps, dossier devient leak
//                      progressif et catastrophe régulatoire)
//             Tags   : ransomware, Clop, supply chain, 0-day, LPD art. 24,
//                      OFCS, position non-paiement, devoir SEC cotée
//
//       Variété des bifurcations : 1× 'end' (attentat) + 2× sauts.
//       Cohérent avec la philosophie v2.27 : « certaines erreurs sont
//       fatales (ex : violer la doctrine MPC = transmettre PolCant pour
//       le terrorisme), d'autres réduisent l'efficacité » (ex : payer
//       Clop dans le dos du PFPDT = scandale + amende mais procédure
//       continue, ou interroger Eléonore agressivement = dossier mort
//       mais autres dossiers similaires continuent).
//
//       6 nouveaux PNJ ajoutés à data/npcs.json (total : 16) :
//         • eleonore (fictif, victime pig butchering VD)
//         • vuilleumier (réel, Heptagone Genève, expert cryptotraçage)
//         • labhart (réel, procureur MP-ZH, référent national pig butch.)
//         • src_director (fictif, cheffe section anti-terrorisme SRC)
//         • ciso_logitech (fictif, M. Aellig, CISO Logitech)
//         • pfpdt_inspector (fictif, Mme Schöni, PFPDT)
//
//       Approches narratives :
//         - crypto-tinder : trauma-informed (victime), honnête sur les
//                           limites (taux résolution 6.6% OFS), respect
//                           de la dignité dans la communication
//         - attentat      : équilibre LRens / CPP, sources SRC, mineur,
//                           DPMin, communication contrôlée
//         - logitech      : tensions techniques/régulatoires/médiatiques,
//                           position non-paiement (cohérente Suisse),
//                           devoir info SEC pour cotée + LPD 72h
//
//       Stats : 102 → 105 scènes. Cantons VD+2, ZH+1, AG+1.
//       CANTON_DATA mis à jour dans scene-app.js.
//       Index scenes/index.json régénéré (105 entrées, 150 KB).
//
// v61 : v2.27 — Embranchements narratifs étendus aux 4 autres scènes v2.24
//
//       En v2.26, la première vraie bifurcation avait été introduite dans
//       gruyere-coop-affinage-stuxnet (step 1 distractor 2 → next: 4).
//       Cette version étend le pattern aux 4 autres scènes v2.24, avec
//       une variété pédagogique délibérée :
//
//         • lugano-dpfl-mafia-finance       step 1 #2 → next: 'end'
//             "Forcer code PIN" = violation CPP art. 113 / CEDH art. 6
//             → fruit de l'arbre empoisonné (CPP art. 141 al. 4)
//             → toute la procédure invalidée, F. acquitté, scénario END
//
//         • epfl-recherche-lai-fuite-chine  step 0 #1 → next: 3
//             "Accepter 48h enquête interne Pr. Z."
//             → suspect alerté par rumeur dans le labo (12 personnes)
//             → Chen Wei efface ses traces, vol Beijing
//             → saute steps 1 et 2 (qualif/PFPDT impossibles)
//
//         • epfl-laboratoire-ia-medicale    step 0 #2 → next: 4
//             "Réunion crise dans 4h pendant que Pr. Délémont
//              tente de joindre Zhang Yi"
//             → cascade 4h : laptop AFU→BFU, suspect alerté WhatsApp,
//                Twitter académique, postdoc chinois prévient
//             → saute 3 steps (qualification/coordination/communication
//                impossibles avec preuves volatilisées)
//
//         • hcfr-bec-transfer-deepfake      step 2 #2 → next: 4
//             "Confession totale presse + audio deepfake"
//             → tempête médiatique, attaquants déplacent fonds avant
//                Convention de Budapest, BCF retire son naming
//             → saute coordination Swiss Ice Hockey (sans objet)
//
//       Pattern systématique : chaque feedback de bifurcation contient
//       le marqueur "📍 BIFURCATION NARRATIVE" suivi de l'explication
//       cause→effet pour que le joueur comprenne pourquoi le scénario
//       saute des étapes (ou s'achève).
//
//       Variété : 1× 'end' (fin catastrophe procédurale immédiate)
//                + 3× sauts (2-3 steps, dossier dégradé selon la phase
//                  où le mauvais choix a été pris).
//
//       Aucun changement du moteur scene-app.js (qui supportait déjà
//       `choice.next` non-linéaire et `'end'` depuis longtemps).
//       Aucun changement structure JSON. Aucun nouvel asset.
//       L'équilibrage des choix v2.25 reste OK (les fb sont allongés,
//       les text non — l'écart max reste 26%).
//
//       Tests : tous passent. Balance check : 0 warning, 0 error.
//
// v60 : v2.26 — Gamification scènes : C (Timer) + D (Branches) + E (PNJ) + H (Achievements)
//
//       FEATURE C — Timer de stress (mode Procureur, déjà existant)
//         Documenté comme la fonctionnalité de timer opt-in. Activable via
//         le toggle "Mode Procureur" dans le lobby des scènes. Durée par
//         difficulté : 45s (easy), 60s (medium), 75s (hard), 90s (expert).
//
//       FEATURE D — Embranchements narratifs (moteur existant exploité)
//         Le moteur scene-app supportait déjà `choice.next` non-linéaire
//         et `next: 'end'` (fin anticipée). Première vraie bifurcation
//         dans la pilote `gruyere-coop-affinage-stuxnet` step 1 :
//           • OK (notification OSAV 4h) → step 2 (forensique normale)
//           • Distracteur 2 (Interprofession seule) → SAUTE à step 4 (audit
//             dégradé) sans passer par forensique + communication. Le
//             feedback explique cette voie d'évitement au joueur.
//         C'est le pattern de bifurcation pédagogique : un mauvais choix
//         tôt change matériellement la suite.
//
//       FEATURE E — PNJ récurrents (NEW)
//         • data/npcs.json (10 fiches) : 2 personnalités publiques réelles
//           (Yves Nicolet procureur fédéral cyber, Stefan Blättler PG) +
//           8 personnages fictifs liés aux scènes (Tinguely affineur Bulle,
//           Délémont Pr. EPFL, Rotzetter président HCFR fictif, etc.)
//         • js/components/scene-npcs.js (530 L) : panneau "Acteurs en
//           présence" injecté dans le briefing, chips cliquables ouvrant
//           une modale avec bio, expertise, contexte pédagogique, autres
//           scènes où le PNJ apparaît, badge "réel/fictif".
//         • Tracking : localStorage 'cas_npcs_met' alimente l'achievement
//           npc_collector (rencontrer ≥8 PNJ différents).
//         • 5 scènes v2.24 enrichies avec leurs PNJ assignés.
//
//       FEATURE H — Achievements canton + PNJ + thèmes (6 nouveaux)
//         • fr_detective    🧀 — 3 scénarios fribourgeois ≥80%
//         • ti_sherlock     🇮🇹 — 3 scénarios tessinois ≥80%
//         • vd_procureur    ⚖️ — 5 scénarios vaudois ≥80%
//         • apple_forensic  🍎 — 3 scénarios AFU/BFU iPhone-MacBook ≥80%
//         • anti_deepfake   🎭 — Scénario deepfake résolu à ≥90%
//         • npc_collector   👥 — Rencontrer ≥8 PNJ différents
//         CANTON_DATA mis à jour avec les 5 scènes v2.24 (FR+2, VD+2, TI+1).
//         Métriques ajoutées dans getStatsSnapshot() : canton80, apple_forensic_wins,
//         deepfake_excellence, npcs_met.
//
//       SCRIPTS : build_scenes_index.py exporte désormais le champ `npcs`
//                 dans scenes/index.json pour permettre l'index inversé
//                 du composant scene-npcs.
//
//       Tests : tous passent. 47 achievements (41 quiz + 6 nouveaux scènes).
//
// v59 : v2.25 — Qualité des scènes : équilibrage des choix + corrections factuelles
//
//       PHASE 1 — Rééquilibrage des choix dans les 5 scènes v2.24 (25 steps).
//         Avant : le bon choix était systématiquement le plus long (200-450 chars)
//                 face à des distracteurs courts (100-200 chars). Biais "longueur
//                 révélatrice" : un étudiant pouvait deviner la bonne réponse
//                 sans lire les questions. 12 erreurs (>50% écart) + 7 warnings.
//         Après : 0 erreur, 0 warning. Tous les steps avec écart ≤ 26%.
//                 Les distracteurs ont été étoffés avec :
//                   - Justification du raisonnement erroné (qui paraît plausible)
//                   - Conditions/qualifications similaires aux structures (a)(b)(c)
//                   - Détails techniques cohérents (ex: TIA Portal, S7-1500)
//                   - Références juridiques précises (ex: CEDH art. 6, ATF 141 IV 142)
//
//       PHASE 2 — Corrections factuelles dans 3 scènes :
//         • epfl-laboratoire-ia-medicale-chine :
//           - "avenue Forel" (n'existe pas sur le campus EPFL) → "bâtiment INF (Faculté IC)"
//           - "Pr. Schaffner" → "Pr. Délémont" (nom suisse romand fictif neutre)
//         • lugano-dpfl-mafia-finance :
//           - "Banca Cantonale del Ticino e Italia (BCFI)" (confusion avec BCF Fribourg)
//             → "BancaStato Ticino" (vraie banque cantonale tessinoise)
//         • hcfr-bec-transfer-deepfake :
//           - "Hubert Waeber" (vrai président HC Fribourg-Gottéron, risque diffamation
//             dans une fiction d'usurpation) → "Olivier Rotzetter" (nom fribourgeois
//             plausible mais fictif)
//
//       NOUVEAU : scripts/check_scenes_balance.py
//         Lint script qui mesure l'équilibrage des choix et signale les biais
//         de longueur. Utilisable comme pre-commit hook ou en CI.
//
//       Tests : tous passent. Pipeline 8/8 étapes.
//
// v58 : v2.24 — Mode lecture continue + 5 nouvelles scènes suisses
//
//       NOUVELLES SCÈNES (5 ajouts → 97 → 102 scènes total) :
//         • gruyere-coop-affinage-stuxnet     (FR Bulle, IIoT/sabotage)
//         • epfl-recherche-lai-fuite-chine    (VD Lausanne, espionnage IA, focus DPO)
//         • epfl-laboratoire-ia-medicale-chine (VD Lausanne, focus laboratoire — bonus)
//         • lugano-dpfl-mafia-finance         (TI Lugano, blanchiment 'ndrangheta)
//         • hcfr-bec-transfer-deepfake        (FR BCF Arena, deepfake hockey + BEC)
//
//       MODE LECTURE CONTINUE (nouvelle feature) :
//         • js/components/fiche-reader.js (382 L) : composant qui injecte un
//           bandeau "Précédent · Suivant" en bas de chaque fiche, avec :
//             - Navigation linéaire dans la même catégorie (ordre alpha)
//             - Indicateur de progression "Fiche X/Y dans le thème"
//             - Barre de progression visuelle (% de fiches lues dans la cat.)
//             - Section "Fiches connexes" (top 5 par questions partagées)
//         • data/fiche-graph.json (128 KB) : graphe pré-calculé des voisinages
//           - 9 catégories avec navigation linéaire
//           - 98/109 fiches ont ≥1 fiche connexe (Jaccard sur questions)
//         • scripts/build_fiche_graph.py : génère le graphe (étape 7 du workflow)
//         • scripts/inject_fiche_reader.py : injecte la balise dans les 109 fiches
//         • Persistence localStorage (fiche-reader.read) : marque "lue" après 90s
//
//       Tests : tous passent. Pipeline 7/7 étapes.
//
// v57 : v2.23 — Split de tp-engine.js (proof-of-concept)
//       NEW tp/tp-engine-carving.js (247 L) : exercices "carving"
//       (signatures de fichiers) extraits de tp-engine.js.
//       Couvre genMagic + checkMagic + _magicNotes + genMismatch +
//       buildMismatchChoices + checkMismatch + _mismatchAnswered.
//       Pattern identique à tp-engine-meta.js et tp-engine-windows.js :
//       le module satellite mute le dispatcher GENERATORS pour
//       enregistrer ses 2 générateurs.
//       tp-engine.js : 6786 → 6584 LOC (-202 L, -3.0%).
//       Méthodologie validée : si nécessaire pour la suite, on peut
//       extraire d'autres modules selon le même pattern (fs, encoding,
//       misc). Pour l'instant on consolide ici — le ROI sur les autres
//       modules est faible (fonctions très longues, peu isolables).
//
// v56 : v2.22 — Merge de quiz-ui-patch.js dans quiz-app.js (-1 fichier)
//       Le patch v2.13 (663 LOC) qui modifiait l'UI APRÈS chargement via
//       12 wrappers de fonctions a été MERGÉ dans quiz-app.js. Plus de
//       wrappers, plus de timing fragile, plus de fuite IIFE (le Groupe D
//       du patch était par erreur en dehors de l'IIFE — bug latent corrigé).
//
//       Fonctions modifiées en place dans quiz-app.js :
//         - showToast (route maintenant vers notify())
//         - showRankUp (toast DOM + notify unifié)
//         - showAchievementPopup (popup DOM + notify unifié)
//         - useStreakFreeze (animation glaçon intégrée)
//         - getNext (retourne null + showCardEmpty pour états vides)
//         - toggleBookmark (animation pop + spawnStarBurst)
//         - toggleFocusMode (sync label dans le menu Plus)
//
//       Fonctions ajoutées à quiz-app.js (ex-patch) :
//         - notify, drainNotifyQueue + EMPTY_STATES + MODE_LABELS
//         - showCardEmpty, hideCardEmpty, refreshActiveModePill
//         - setupActionRowGuard, setupComboHalo (MutationObservers)
//         - syncSoundLabel, _hideDailyBannerIfDismissed
//         - toggleMoreMenu, closeMoreMenu, dismissDailyBanner
//         - setMode, triggerBoss, spawnStarBurst
//
//       toggleSound (dans quiz-effects.js) appelle window.syncSoundLabel
//       si défini (hook optionnel, dégradation gracieuse).
//
//       SUPPRIMÉ : js/pages/quiz-ui-patch.js
//       Test corrigé : tests/test-achievements-sync.js lit maintenant
//       ACHIEVEMENTS depuis quiz-data.js (déplacé en v2.21).
//
// v55 : v2.21 — Split de quiz-app.js (5287 → 4718 LOC, -10.7%)
//       NEW js/components/quiz-utils.js (126 L) : helpers purs
//       (lsGet/lsSet, shuffle, sanitizeHTML, getDailyDate, seededRng).
//       NEW js/components/quiz-sm2.js (190 L) : algorithme SM-2
//       de répétition espacée (testable en Node, isolé du DOM).
//       NEW js/components/quiz-ranks.js (106 L) : logique purs des
//       rangs et combos (getRank, getNextRank, getXpToNextRank,
//       getComboMultiplier).
//       NEW js/components/quiz-effects.js (199 L) : audio synthétisé,
//       particules de feedback, thèmes visuels.
//       NEW js/components/quiz-share.js (138 L) : helpers canvas
//       génériques (downloadCanvas, copyCanvasToClipboard,
//       shareCanvasNative). Réutilisables par d'autres pages.
//       Migration vers quiz-data.js : DIFF_LABELS, DIFF_PTS, TC,
//       ACHIEVEMENTS (252 L), STREAK_MSGS.
//       Tests unitaires en Node : tous les modules purs validés.
//       Rétrocompat : globales window.* préservées pour les 57
//       fonctions appelées depuis onclick="..." dans quiz.html.
//
// v54 : v2.20 — Quick wins : factorisation, a11y, cohérence index
//       NEW js/components/fiche-common.js (171 L) : factorisation des
//       comportements UI répétés sur toutes les fiches (scroll-progress,
//       back-top, quiz-reveal, collapsibles, tabs génériques data-tab-*).
//       Économie : ~54 KB en supprimant la duplication inline (~92 patterns
//       retirés sur 109 fiches via scripts/migrate_fiche_common.py).
//       Bénéfice supplémentaire : la barre scroll/back-top fonctionne
//       maintenant sur les fiches qui n'avaient PAS le JS associé.
//       NEW scripts/build_scenes_index.py : régénère scenes/index.json
//       à chaque modif de scène (5 scènes orphelines retrouvées,
//       1 fantôme nettoyée). counts.json passe de 93 → 97 scènes.
//       NEW scripts/add_h1_to_fiches.py : ajout d'un <h1> sur les
//       15 fiches qui n'en avaient pas (a11y + SEO). 109/109 fiches
//       ont maintenant un h1 unique avec style cohérent.
//       Workflow GitHub Actions : étapes ajoutées (build_scenes_index +
//       migrate_fiche_common). Tout reste auto à chaque commit.
//
// v53 : v2.19 — Liens croisés Q ↔ Fiche ↔ TP ↔ Scènes (navigation transverse)
//       NEW data/cross-links.json (35 KB) : mapping généré par
//       scripts/build_cross_links.py — 1730 liens fiches→questions,
//       26 liens fiches→TP, 73 liens fiches→scènes.
//       NEW js/components/fiche-related.js : injecte une section "Voir aussi"
//       en bas de chaque fiche avec liens vers quiz filtré, TP connexes
//       et scénarios DFIR pertinents.
//       Quiz : ouverture depuis une fiche filtre les questions sur le sujet
//       (via localStorage 'cas-in-quiz-filter').
//       +27 questions ICS/SCADA/OT Forensique (1750 → 1777).
//       Nettoyage prod : 7 console.log retirés, 6 alert() derrière showToast,
//       2 catch silencieux complétés.
//       Build orchestrator : scripts/build-all.sh + git pre-commit hook.
//
// v52 : v2.18 — Moteur de recherche full-text dans les fiches.
//       NEW js/components/fiche-search.js (466 L) : tokenization FR/EN,
//       normalisation accents, synonymes bidirectionnels, indexation
//       du contenu RÉEL des fiches (875 sections), scoring pondéré
//       par champ (title=10, sec_title=5, command=4, term=3, body=1),
//       fuzzy matching Levenshtein pour fautes de frappe.
//       NEW js/components/search-modal.js (508 L) : modal Cmd+K accessible
//       depuis 118 pages, navigation clavier, snippets surlignés,
//       recherches récentes en localStorage, FAB mobile.
//       NEW scripts/build_search_index.py (218 L) : génère search-index.json
//       à partir des HTML (875 sections, 6622 termes, 38 commandes).
//       NEW data/search-index.json (581 KB, ~80 KB gzippé).
//       Maintenant : 'Ed Skoudis', 'ip link', '4624 type 10', 'WhatsApp database',
//       'comment trouver les processus malveillants' renvoient les BONNES
//       sections des bonnes fiches avec extraits surlignés.
//
// v51 : v2.17 — Mode dark/light propagé dans les 7 CSS qui n'avaient pas de
//       règles [data-theme="light"] : fiche_style.css (47 sélecteurs),
//       landing.css (14), quiz.css (13), scene.css (11), profile.css (10),
//       tp.css (10), tools.css (4). Le toggle theme-toggle.js fonctionne
//       maintenant sur TOUTES les pages, pas juste celles qui chargent style.css.
//       Audit confirmé : mobile_apps_forensique.html, cmd_linux_forensique.html,
//       sqlite_forensique.html (Démarrage), sqlite_forensique_avance.html
//       (Internals Avancés) tous bien intégrés et cross-référencés.
//
// v50 : v2.17 — session "tout faire" :
//       * Refactor SQLite : 2 fiches harmonisées en parcours 2 étapes
//         (Démarrage → Internals Avancés) avec bannières cross-ref
//       * cmd_windows_forensique.html enrichi : section Intrusion Discovery
//         (5 cards : SMB sessions, Run/RunOnce, Event IDs, Sysinternals, perfs)
//       * Nouvelle fiche cmd_linux_forensique.html (live response Linux,
//         8 sections parallèles à Windows : ps/lsof/find/passwd/cron/logs/perf/outils)
//       * Nouvelle fiche mobile_apps_forensique.html (catalogue 30+ apps iOS
//         avec paths SQLite/Plist/Realm — inspiré poster SANS FOR585)
//       * Mode CLAIR/SOMBRE toggle : nouveau thème [data-theme="light"]
//         dans style.css, composant js/components/theme-toggle.js bouton
//         flottant bottom-left + persistence localStorage. 118 pages patchées
//         (110 fiches + 8 pages racine).
//       Manifest 104→106. Cache invalidé.
// v49 : v2.16 — CHANGELOG mis à jour (v2.11→v2.16) + nouvelle fiche
//       poster_windows_artefacts.html (vue d'ensemble par question forensique,
//       inspirée du poster SANS FOR500 Rob Lee) + système de NOTES utilisateur
//       sur fiches (composant js/components/fiche-notes.js + style/fiche-notes.css
//       + section gestion dans profile.html via js/profile/profile-notes.js).
//       104 fiches HTML patchées avec inclusion automatique du composant.
//       Persistence localStorage par fiche (cas-in-notes-{ficheId}).
//       Manifest 103→104. Cache invalidé.
// v48 : refactor des 3 fiches mémoire pour éliminer la confusion utilisateur :
//       - ram_forensique.html → "Acquisition Mémoire RAM" (Étape 1/3) + 6 edge cases modernes
//         (Secure Boot, KASLR, VBS/Credential Guard, TPM 2.0+PIN, Hyperviseurs type-1, SSD SED Opal)
//       - volatilite.html → "Volatility 3 — Démarrage" (Étape 2/3) avec H1 dédié
//       - volatility_memory_forensics.html → "Mémoire — Internals Avancés" (Étape 3/3)
//       Bannières de cross-référence harmonisées entre les 3. Manifest + index régénérés.
//       Nouvelle scène ICS : swissgrid-iec61850-jura.json (poste électrique 380 kV, IEC 61850 GOOSE).
// v47 : (version intermédiaire — voir v48 pour les changements consolidés)
// v46 : 3 nouvelles fiches forensiques basées sur cheat sheets SANS officielles :
//       - ics_forensique.html (ICS/SCADA, Modèle Purdue, Modbus/DNP3/IEC 61850, NSM ICS, IR jump bag)
//       - cmd_windows_forensique.html (live response Windows : wmic, sc, netsh, netstat, reg)
//       - magic_bytes_signatures.html (file signatures, outils file/binwalk/xxd, regex forensique)
//       Enrichissement zimmerman.html avec section bstrings (extraction strings + regex multi-encoding).
//       Manifest mis à jour : 100 → 103 fiches. Pré-cache dynamique via manifest.json.
// v45 : split quiz-app.js — quiz-data.js (1562 lignes de constantes) extrait
//       en module séparé pour alléger le caching et la maintenance.
// v44 : nettoyage STATIC_ASSETS — retrait de track-theme.css (fichier inexistant,
//       générait un 404 au précache) et fiche-hub.css (CSS orphelin obsolète,
//       remplacé par fiche_style.css depuis longtemps).
// v43 : split tp-engine.js — tp-engine-windows.js (Registry/Prefetch/LNK) extrait
//       en module séparé. Ajout au précache.
// v42 : restructuration — JSON data déplacés vers data/ (questions, manifest, counts)
//       Cache invalidé pour forcer re-précache des nouveaux chemins.
// v41 : install per-asset (au lieu de addAll atomique) pour identifier
//       précisément les ressources qui 404 lors du précache. Logs détaillés.
// v40 : refonte stratégie — fiches précachées dynamiquement depuis manifest.json
//       Stale-while-revalidate sur CSS/JS, channel postMessage 'GET_VERSION'.
// v39..v21 : voir docs/CHANGELOG.md.

const CACHE_VERSION = 'cas-in-v69';

// ─── Ressources critiques (HTML/JSON/CSS/JS) ───
// Liste maintenue à la main car peu volatile. Les FICHES sont lues
// dynamiquement depuis manifest.json à l'install (voir precacheFichesFromManifest).
const STATIC_ASSETS = [
  // Pages racine
  './',
  './index.html',
  './quiz.html',
  './tp.html',
  './exam.html',
  './tools.html',
  './scene.html',
  './profile.html',

  // Manifests & data
  './data/manifest.json',
  './pwa.manifest.json',
  './offline.html',
  './og-image.svg',
  './favicon.ico',
  './icon-192.png',
  './icon-512.png',
  './data/questions.json',
  './data/counts.json',

  // Styles
  './style/landing.css',
  './style/style.css',
  './style/tp.css',
  './style/tp-page.css',
  './style/tools.css',
  './style/exam.css',
  './style/scene.css',
  './style/fiche_style.css',
  './style/fiche-notes.css',
  './style/profile.css',
  './style/profile-banner.css',
  './style/quiz.css',

  // Scripts core
  './js/core/cas-in-profile.js',
  './js/core/cas-in-achievements.js',
  './js/core/cas-in-counts.js',
  './js/core/cas-in-export.js',
  './js/core/cas-in-pwa.js',
  './js/core/cas-in-search.js',
  // Profile UI
  './js/profile/profile-banner.js',
  './js/profile/profile-page.js',
  './js/profile/profile-track-v5.js',
  './js/profile/profile-titles.js',
  './js/profile/profile-notes.js',
  // Bridges
  './js/bridges/quiz-profile-bridge.js',
  './js/bridges/scene-profile-bridge.js',
  './js/bridges/tp-profile-bridge.js',
  // Components
  './js/components/fiche-notes.js',
  './js/components/theme-toggle.js',
  // Pages
  './js/pages/landing.js',
  './js/pages/landing-3d.js',
  './js/components/quiz-utils.js',
  './js/components/quiz-sm2.js',
  './js/components/quiz-ranks.js',
  './js/components/quiz-effects.js',
  './js/components/quiz-share.js',
  './js/pages/quiz-data.js',
  './js/pages/quiz-app.js',
  // quiz-ui-patch.js supprimé en v2.22 (mergé dans quiz-app.js)
  './js/pages/scene-app.js',
  './js/pages/scene-ux-patch.js',
  './js/pages/scene-lobby-v3.js',
  './js/pages/scene-engine-v4.js',
  './js/pages/tools-app.js',
  './js/pages/exam-app.js',

  // Index des scènes (lazy-load des scènes individuelles via fetch + cache-first)
  './scenes/index.json',

  // TP
  './tp/tp-data.js',
  './tp/tp-engine.js',
  './tp/tp-engine-carving.js',
  './tp/tp-engine-windows.js',
  './tp/tp-engine-meta.js',

  // Hub des fiches (les fiches elles-mêmes sont précachées dynamiquement)
  './fiches/index.html',
  './js/components/fiche-search.js',
  './js/components/search-modal.js',
  './js/components/fiche-related.js',
  './js/components/fiche-common.js',
  './js/components/fiche-reader.js',
  './js/components/scene-npcs.js',
  './data/search-index.json',
  './data/cross-links.json',
  './data/fiche-graph.json',
  './data/npcs.json',
];

const OFFLINE_FALLBACK = './offline.html';

// ─── Précache dynamique des fiches via manifest.json ───
// Avantage : plus de liste hardcodée à maintenir. Inconvénient : si manifest.json
// est inaccessible à l'install, on n'a pas les fiches en cache (elles seront
// mises en cache à la première visite via le fetch handler).
async function precacheFichesFromManifest(cache) {
  try {
    const resp = await fetch('./data/manifest.json', { cache: 'no-store' });
    if (!resp.ok) return;
    const manifest = await resp.json();
    const fiches = (manifest.fiches || [])
      .map(f => f && f.file ? './fiches/' + f.file : null)
      .filter(Boolean);
    // Best-effort : on ignore les 404 individuelles
    await Promise.allSettled(fiches.map(url => cache.add(url)));
    console.log('[SW] Precached ' + fiches.length + ' fiches from manifest');
  } catch (e) {
    console.warn('[SW] Could not precache fiches from manifest:', e);
  }
}

// ─── Install ───
self.addEventListener('install', event => {
  console.log('[SW] Install ' + CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async cache => {
      // Per-asset add avec log des manquants. On évite addAll() atomique car
      // sur GitHub Pages les déploiements peuvent être partiels (un asset listé
      // qui n'est pas encore en ligne fait tout planter). Mieux : on installe
      // ce qu'on peut et on log précisément ce qui manque.
      const results = await Promise.all(
        STATIC_ASSETS.map(url =>
          cache.add(url).then(
            () => ({ url, ok: true }),
            err => ({ url, ok: false, err: err.message || String(err) })
          )
        )
      );
      const failed = results.filter(r => !r.ok);
      if (failed.length) {
        console.warn('[SW] ' + failed.length + ' asset(s) failed to cache:');
        failed.forEach(r => console.warn('  ✗ ' + r.url + ' → ' + r.err));
      } else {
        console.log('[SW] All ' + results.length + ' static assets cached');
      }
      // Fiches : best-effort, ne bloque pas l'install
      await precacheFichesFromManifest(cache);
    })
  );
  self.skipWaiting();
});

// ─── Activate : nettoyage des anciens caches ───
self.addEventListener('activate', event => {
  console.log('[SW] Activate ' + CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Messages depuis le client ───
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'GET_VERSION') {
    // Réponse sur le port du MessageChannel si fourni
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ version: CACHE_VERSION });
    }
    return;
  }
});

// ─── Fetch handler ───
self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // ignorer cross-origin

  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const path = url.pathname;
  const isJSON = path.endsWith('.json');
  const isSceneIndex = path.endsWith('/scenes/index.json');
  const isSceneFile = /\/scenes\/[^/]+\.json$/.test(path) && !isSceneIndex;
  const isCSS = path.endsWith('.css');
  const isJS = path.endsWith('.js');

  // ─── Cache-first pour les scènes individuelles (changent rarement) ───
  if (isSceneFile) {
    event.respondWith(cacheFirstWithNetworkFallback(event.request, url));
    return;
  }

  // ─── Stale-while-revalidate pour CSS et JS ───
  // Sert le cache immédiatement (snappy) MAIS refetch en background pour
  // que la prochaine visite ait la dernière version. Combiné au bump du
  // CACHE_VERSION à chaque déploiement, ça réduit fortement le risque de
  // rester coincé sur une vieille version JS/CSS.
  if (isCSS || isJS) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // ─── Network-first pour HTML / autres JSON ───
  if (isHTML || isJSON) {
    event.respondWith(networkFirst(event.request, isHTML));
    return;
  }

  // ─── Cache-first pour le reste (images, fonts, ...) ───
  event.respondWith(cacheFirstWithNetworkFallback(event.request));
});

// ───────────────────────────────────────────────────────────
// Stratégies (helpers)
// ───────────────────────────────────────────────────────────

function networkFirst(request, isHTML) {
  return fetch(request).then(response => {
    if (response.ok) {
      const clone = response.clone();
      caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
    }
    return response;
  }).catch(() =>
    caches.match(request).then(cached => {
      if (cached) return cached;
      if (isHTML) return caches.match(OFFLINE_FALLBACK);
      return new Response(JSON.stringify({ error: 'offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    })
  );
}

function cacheFirstWithNetworkFallback(request, url) {
  return caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
      }
      return response;
    }).catch(() => {
      if (url) {
        // Cas spécial scène : retourner un JSON parlant
        return new Response(
          JSON.stringify({
            error: 'offline',
            scene: url.pathname.split('/').pop().replace('.json', ''),
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('', { status: 503, statusText: 'Offline' });
    });
  });
}

function staleWhileRevalidate(request) {
  return caches.open(CACHE_VERSION).then(cache =>
    cache.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => null);
      // Si on a un cache, on le sert immédiatement et on laisse le fetch tourner
      // en background pour rafraîchir le cache pour la prochaine visite.
      // Si pas de cache, on attend le réseau.
      return cached || networkFetch || new Response('', { status: 503 });
    })
  );
}
