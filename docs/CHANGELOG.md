# Changelog

Toutes les modifications notables apportées à ce projet sont documentées ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [2.43] — 2026-05-03

**Diversification continue du casting** : 6 nouveaux PNJ thématiquement adaptés. **Bloc 15 du retrofit** (8 anciennes scènes adaptées). Le catalogue passe à **48 PNJ**.

### Ajouté — 6 nouveaux PNJ dans `data/npcs.json` (42 → 48)

| ID | Type | Rôle | Apparition principale |
|---|---|---|---|
| `whistleblower_lawyer` | Fictive **transposable** | Me Berisha, Avocate spécialisée droit du travail/lanceurs d'alerte | `whistleblower-ddps` |
| `xplain_ofit_juriste` | Fictive | Mme Bühlmann, Directrice juridique OFIT | `xplain-lmp` |
| `play_ransom_analyst` | Fictif **transposable** | M. Schöb, Analyste senior threat intel ransomware OFCS | `xplain`, `xplain-play` |
| `zurich_airport_ciso` | Fictif | M. Locher, CISO Flughafen Zürich AG | `swissport_2022` |
| `europol_jcat_analyst` | Fictif **transposable** | Mr. Lindgren, EC3 J-CAT senior, citoyen suédois | `infostealer-magnus` |
| `bitlocker_forensic` | Fictif **transposable** | Dr. Häberli, Chercheur ETHZ cryptanalyse BitLocker | `bitlocker_froid` |

**Diversification thématique des nouveaux PNJ** :
- **Avocate whistleblowers** (Berisha) — première figure d'avocat·e privé·e dans le casting (à côté des procureur·e·s et juges déjà multiples)
- **Direction juridique OFIT** (Bühlmann) — pivot LMP fédéral spécifique au cas Xplain
- **Analyste threat intel** (Schöb) — distinct de `ofcs_coordinator` (coordination opérationnelle), spécialiste tracking opérateurs ransomware
- **CISO aviation** (Locher) — distinct de `ciso_logitech` (consumer electronics), expertise IATA/ICAO Annex 17
- **Europol J-CAT** (Lindgren) — première figure non-suisse opérationnelle dans le casting (citoyen suédois)
- **Chercheur cryptanalyse** (Häberli, ETHZ) — distinct de tous les autres profils techniques (universitaire-opérationnel hybride)

**4 nouveaux transposables** (catalogue total 15 → 19) : `whistleblower_lawyer`, `play_ransom_analyst`, `europol_jcat_analyst`, `bitlocker_forensic`. **`play_ransom_analyst` apparaît dans 2 scènes** du bloc 15 (xplain, xplain-play) — pivot threat intel ransomware du corpus.

### Ajouté — Retrofit bloc 15 (8 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés (★ = nouveau) | Bifurcation marquée |
|---|---|---|---|---|
| `whistleblower-ddps` | 5 | hard | `whistleblower_lawyer`★, `ddps_general_counsel` | step 4 #1 et #2 → 'end' explicite |
| `xplain` | 8 | hard | `ofs_rssi_fedch`, `play_ransom_analyst`★ | step 0 #0 (catastrophe inversion forensique) |
| `xplain-lmp` | 5 | hard | `xplain_ofit_juriste`★, `pfpdt_inspector` | step 4 #1 et #2 → 'end' explicite |
| `xplain-play` | 6 | hard | `play_ransom_analyst`★, `nicolet` | step 5 #0 et #2 → 'end' explicite |
| `swissport_2022` | 5 | medium | `zurich_airport_ciso`★, `ofcs_coordinator` | step 0 #0 (catastrophe kill-switch hub) |
| `infostealer-magnus` | 4 | medium | `europol_jcat_analyst`★, `fbi_legat_bern` | step 3 #0 et #2 → 'end' explicite |
| `bitlocker_froid` | 8 | hard | `bitlocker_forensic`★, `forensics_lead_zh` | step 0 #0 (catastrophe estimation) |
| `custody` | 3 | easy | `fim_xways_expert`, `forensics_lead_zh` | step 0 #0 (catastrophe revue par pair manquante) |

**Diversification thématique du bloc 15** (8 thématiques distinctes) : (a) **Whistleblowing fédéral DDPS** (art. 22a LPers + 17a CP, jurisprudence ATF 145 I 73, Convention OCDE), (b) **Xplain affaire 2023 vue forensique** (907 Go fédéraux, gouvernance LMP, Dwell Time 3.5 mois), (c) **Xplain LMP supply chain fédérale** (résiliation contradictoire art. 41 LMP, TAF, GPDel), (d) **Xplain-Play darknet HOOGAN** (Task Force fedpol, fichage hooligans suisses compromis), (e) **Swissport BlackCat ZRH 2022** (cas réel, IATA + ICAO Annex 17, OFCS-CII aviation), (f) **Infostealers RedLine + META** (Op. Magnus octobre 2024, J-CAT coordination, 47'200 victimes CH), (g) **BitLocker à froid** (qualification mode actif TPM/PIN/recovery, ETHZ TPM sniffing 2023), (h) **Audit chaîne de custody** (revue par pair, doctrine NIST SP 800-86 + ENFSI BPM).

**Cas particuliers** :
- `xplain` (8 steps), `xplain-lmp`, `xplain-play` constituent une **trilogie cohérente** sur le cas réel Xplain 2023, vue sous 3 angles complémentaires (forensique OFCS, juridique OFIT, threat intel fedpol Task Force).
- `swissport_2022` est documenté par le **cas réel BlackCat ransomware Swissport du 3 février 2022** à l'aéroport de Zurich (~280 vols matinaux impactés).
- `infostealer-magnus` est documenté par l'**Operation Magnus du 28 octobre 2024** (Europol + Pays-Bas + FBI + 9 autres pays) qui a démantelé l'infrastructure des infostealers RedLine et META, avec 47'200 victimes suisses identifiées dans les bases C2 saisies.
- `whistleblower-ddps` introduit la **doctrine art. 22a LPers + 17a CP** (exception au secret de fonction pour les lanceurs d'alerte de la Confédération) avec la jurisprudence TF récente (ATF 145 I 73 sur les conditions strictes : subsidiarité + intérêt public prépondérant + proportionnalité).

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 100 scènes touchées par v2.24 → v2.43 (était 92, +8). Toutes passent le seuil de balance 30%. **Le cap des 100 scènes équilibrées est franchi.**

### Modifié — Service Worker v76 → v77

Header v2.43 documentant les 6 nouveaux PNJ + le retrofit bloc 15.

### Statistiques v2.43

| Indicateur | v2.42 | v2.43 |
|---|---|---|
| Scènes totales | 110 | **110** (inchangé) |
| Scènes avec NPCs assignés | 87 | **95** (+8) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 87 | **95** (+8) |
| **Progression retrofit** | **79%** | **86%** ✨ |
| **PNJ catalogue** | **42** | **48** ✨ (+6) |
| PNJ réels | 8 | 8 (inchangé) |
| PNJ fictifs | 34 | **40** (+6) |
| PNJ transposables | 15 | **19** (+4) |
| Service Worker | v76 | **v77** |

### Notes éditoriales

**Sur la création des 6 nouveaux PNJ.** Continuant la diversification entamée en v2.41-v2.42, cette release crée 6 PNJ adaptés aux thématiques du bloc 15 :

1. **whistleblower_lawyer (Me Berisha)** : **première figure d'avocat·e privé·e** dans le casting (les autres avocat·e·s du corpus sont des magistrat·e·s ou DPO institutionnel·le·s). Spécialiste lanceurs d'alerte fédéraux, expertise art. 22a LPers + Convention OCDE + Directive UE 2019/1937. Co-fondatrice (fictive) du collectif romand-alémanique 'Alerte!'.

2. **xplain_ofit_juriste (Mme Bühlmann)** : pivot juridique fédéral spécifique au cas Xplain. Distincte de tous les autres profils juridiques fédéraux (`ddps_general_counsel`, `pfpdt_inspector`, etc.) par son ancrage **OFIT supply chain LMP** plutôt que défense, données ou justice.

3. **play_ransom_analyst (M. Schöb)** : référence **threat intelligence ransomware** spécifique. Distinct de `ofcs_coordinator` (coordination opérationnelle large) — Schöb est un spécialiste analyste qui suit individuellement les opérateurs Play, BlackCat, LockBit, Akira sur leurs LeakSites Tor onion. Apparaît dans 2 scènes (xplain + xplain-play).

4. **zurich_airport_ciso (M. Locher)** : référence **aviation cyber** avec expertise IATA + ICAO Annex 17 + EASA. Distinct de tous les autres CISO du corpus par son ancrage hub aéroportuaire (Flughafen Zürich AG, 31M passagers annuels, infrastructure critique).

5. **europol_jcat_analyst (Mr. Lindgren)** : **première figure non-suisse opérationnelle** dans le casting. Citoyen suédois, ancien Polismyndigheten, 14 ans Europol J-CAT à La Haye. Coordonne les ops multi-juridictions (Magnus, Endgame, Cronos, PowerOFF). Anglais courant, comprend FR/DE/IT.

6. **bitlocker_forensic (Dr. Häberli)** : **profil hybride universitaire-opérationnel** (chercheur ETHZ + mandats fedpol). Distinct des autres experts forensiques (`forensics_lead_zh`, `fim_xways_expert`) par son ancrage **cryptanalyse académique** et son apport théorique sur BitLocker (papier USENIX Security 2023 fictif).

**Sur la doctrine de transposabilité après v2.43.** Le catalogue compte maintenant **19 PNJ transposables** sur 48 (39.6%). Cette proportion est saine pour permettre la cohérence narrative cross-scénarios sans tomber dans la sur-utilisation des mêmes personnages. Les **29 PNJ non-transposables** sont des figures liées à un cas spécifique (Stadler, Swisscom, UniNE, IFC SG, Xplain, Swissport ZRH, etc.) qui auraient peu de sens dans d'autres scénarios.

**Sur la trilogie Xplain.** Les scènes `xplain`, `xplain-lmp` et `xplain-play` constituent une trilogie cohérente sur l'**affaire Xplain 2023**, vue sous 3 angles complémentaires :
- `xplain` : angle **forensique OFCS** (cartographie des 907 Go, qualification gouvernance, Dwell Time 3.5 mois)
- `xplain-lmp` : angle **juridique OFIT** (LMP, résiliation contradictoire, GPDel + CDF + TAF)
- `xplain-play` : angle **threat intel fedpol** (Task Force darknet, tracking Play, fichage HOOGAN compromis)

Cette trilogie offre une **vision intégrée** du cas Xplain pour le programme CAS, avec 3 PNJ distincts (RSSI fedpol, juriste OFIT, analyste threat intel) qui peuvent être mobilisés ensemble ou séparément selon les modules pédagogiques.

**Sur la scène `whistleblower-ddps`.** Scène hard introduisant la **doctrine art. 22a LPers + 17a CP** sur les lanceurs d'alerte de la Confédération. Le scénario porte sur M. R., 47 ans, ingénieur civil au DDPS, qui a découvert une violation présumée d'embargo (livraisons de matériel militaire suisse vers Russie/Iran via société-écran). Il consulte Me Berisha (whistleblower_lawyer) pour structurer sa démarche. Les 5 steps couvrent : voie CDF en priorité (vs presse vs démission), gestion de la mutation représailles, préparation entretien disciplinaire, défense art. 17a CP (intérêt public prépondérant), position politique sur la réforme du cadre. Le marqueur souligne le piège de la divulgation publique précoce sans démarches internes préalables.

**Sur la scène `swissport_2022`.** Scène medium documentée par le **cas réel BlackCat (ALPHV) ransomware Swissport du 3 février 2022** à l'aéroport de Zurich. À 6h00, en pleine pointe matinale du hub ZRH, Swissport (opérateur services au sol : check-in, bagages, ravitaillement) détecte la compromission. Question critique : **kill-switch ou containment graduel ?** La doctrine OFCS-CII aviation impose une coordination en cellule de crise multi-acteurs (Swissport + Flughafen Zürich AG + Swiss + BAZL/FOCA + OFCS) avant tout containment majeur, car un kill-switch unilatéral à 6h00 paralyse le hub et provoque des cascades sur l'ensemble du trafic aérien européen.

**Sur la scène `bitlocker_froid`.** Scène hard sur la **cryptanalyse opérationnelle BitLocker**. Le scénario porte sur un laptop saisi éteint, avec écran de demande de clé BitLocker, aucune clé trouvée dans l'appartement. Le MP demande à Dr. Häberli (bitlocker_forensic, ETHZ) une estimation de durée de décryptage. Question doctrinale : **caractérisation préalable du mode BitLocker actif** (TPM seulement, TPM+PIN, TPM+startup key, recovery password) avant toute estimation. Selon le mode actif, la stratégie change radicalement : TPM seul = exploitable via TPM sniffing (Black Hat 2023, USENIX Security 2023), TPM+PIN = brute-force PIN (4-20 chiffres), recovery password = cryptanalyse AES-256 inviolable. Le marqueur souligne le piège d'une estimation fantaisiste sans qualification préalable du mode.

**Sur le rythme du retrofit.** Avec 15 blocs livrés en 15 versions (v2.29 à v2.43), 95 scènes du corpus historique sont équipées de NPCs et marqueurs (sur 110 totales). **Progression à 86%**. Reste **~15 scènes** à traiter (~2 blocs au rythme 8/bloc). Le **cap des 100% est désormais à portée pour v2.45**.

### Prochaines évolutions possibles

```
v2.44  Retrofit bloc 16 (8 scènes)
       Candidates par diversification : eu-france-travail, eu-free-leak,
                                         eu-ghgo-ddos, eu-kidflix-stream,
                                         eu-livestream-philippines, eu-revil-attribution,
                                         evoting-cantonal, exit-suicide-assiste-conteste
v2.45  Retrofit bloc 17 final (~7 scènes restantes) — ATTEINTE 100% ✨
```

## [2.42] — 2026-05-03

**Diversification continue du casting** : 6 nouveaux PNJ thématiquement adaptés. **Bloc 14 du retrofit** (8 anciennes scènes adaptées). Le catalogue passe à **42 PNJ**.

### Ajouté — 6 nouveaux PNJ dans `data/npcs.json` (36 → 42)

| ID | Type | Rôle | Apparition principale |
|---|---|---|---|
| `tmc_juge_ge` | Fictif **transposable** | Mme Vaucher, Juge TMC Genève | `tmc-refus-surveillance` + futurs scénarios procéduraux |
| `unine_ciso` | Fictif | M. Pillonel, RSSI Université de Neuchâtel | `unine_2022` |
| `vs_secretaire_communal` | Fictif **transposable** | M. Métrailler, Coordinateur cyber Bas-Valais | `valais-cascade-12-communes`, `vetroz-akira` |
| `switch_cert_lead` | Fictive **transposable** | Mme Reusser, Cheffe SWITCH-CERT (Zurich) | `unine_2022` + futurs scénarios académiques |
| `ti_pol_chiasso` | Fictif | M. De Bernardi, Inspecteur cyber PolCant TI Chiasso | `telephone-scelles` |
| `fim_xways_expert` | Fictive **transposable** | Mme Tremp, Experte X-Ways senior fedpol | `timeline`, `trois_artefacts`, `veracrypt` |

**Diversification thématique des nouveaux PNJ** :
- **Magistrature TMC** (Vaucher, GE) — distincte de tout magistrat de jugement, fonction préventive de contrôle
- **RSSI académique** (Pillonel, UniNE) — distinct de `dpo_epfl` qui est plus orientée DPO
- **Coordinateur cyber communes** (Métrailler, Bas-Valais) — pivot pour les 28 communes valaisannes <5'000 hab.
- **CERT académique** (Reusser, SWITCH-CERT) — TF-CSIRT GÉANT, pour tous scénarios EDU
- **Police frontière cyber** (De Bernardi, PolCant TI Chiasso) — coopération CH-IT, scellés numériques
- **Forensique X-Ways** (Tremp) — référence forensique digital approfondi (artefacts Windows/Linux/macOS)

**4 nouveaux transposables** (catalogue total 11 → 15) : `tmc_juge_ge`, `vs_secretaire_communal`, `switch_cert_lead`, `fim_xways_expert`. **`fim_xways_expert` est apparue dans 3 scènes du bloc 14** (timeline, trois_artefacts, veracrypt) — pivot forensique X-Ways du corpus.

### Ajouté — Retrofit bloc 14 (8 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés (★ = nouveau) | Bifurcation marquée |
|---|---|---|---|---|
| `telephone-scelles` | 4 | medium | `ti_pol_chiasso`★, `mroz_ti` | step 1 #0 (catastrophe scellés) |
| `timeline` | 8 | hard | `fim_xways_expert`★, `forensics_lead_zh` | step 1 #0 (catastrophe UTC) |
| `tmc-refus-surveillance` | 5 | hard | `tmc_juge_ge`★, `ti_ge_proc_cyber` | step 4 #1 et #2 → 'end' explicite |
| `trois_artefacts` | 5 | medium | `fim_xways_expert`★, `fim_genealogist` | step 0 #0 (catastrophe triangulation) |
| `unine_2022` | 8 | hard | `unine_ciso`★, `switch_cert_lead`★ | step 0 #0 (catastrophe kill-switch) |
| `valais-cascade-12-communes` | 5 | hard | `vs_secretaire_communal`★, `ofcs_coordinator` | step 4 #1 et #2 → 'end' explicite |
| `veracrypt` | 8 | hard | `fim_xways_expert`★, `forensics_lead_zh` | step 0 #0 (catastrophe mount) |
| `vetroz-akira` | 5 | medium | `vs_secretaire_communal`★, `forensics_lead_zh` | step 1 #1 (catastrophe supply chain) |

**Diversification thématique du bloc 14** (8 thématiques distinctes) : (a) **Scellés numériques A2 Chiasso** (TI, art. 248 CPP, coopération CH-IT), (b) **Timeline forensique multi-fuseaux** (UTC conversion, hash SHA-256, NIST SP 800-86), (c) **Refus art. 269 CPP par TMC** (recours TF, motivation factuelle), (d) **3 artefacts X-Ways convergents** (ShellBag + USBSTOR + .lnk, triangulation), (e) **Conti UniNE 17 février 2022** (cas réel, SWITCH-CERT, communication communauté académique), (f) **Cascade CyberStratVS 12 communes** (autonomie communale art. 50 Cst, coordination régionale Bas-Valais), (g) **Volume VeraCrypt extraction RAM** (PBKDF2, AES Key Schedule, art. 113 CPP nemo tenetur), (h) **Akira supply chain VS** (prestataire IT régional, jonction MPC art. 30 CPP).

**Cas particuliers** :
- `unine_2022` est documenté par le **cas réel Conti UniNE du 17 février 2022** (rentrée semestre printemps interrompue, 5'200 étudiants impactés, services pédagogiques bloqués 3 semaines).
- `valais-cascade-12-communes` introduit le concept de **CyberStratVS** (stratégie cyber cantonale valaisanne) et la **doctrine de coordination cyber régionale Bas-Valais** (28 communes coordonnées via secrétaire communal mutualisé).
- `vetroz-akira` modélise une **attaque supply chain régionale** où le prestataire IT régional VS est le vecteur réel, les 3 entités touchées (Vétroz + Abrifeu + Air-Glaciers) étant les victimes finales.
- `veracrypt` introduit la **doctrine d'extraction de clé via analyse RAM** (Volatility plugin vcrypthunt, Elcomsoft Forensic Disk Decryptor) avec **conformité art. 113 CPP** (pas de demande au suspect = pas de violation nemo tenetur).

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 92 scènes touchées par v2.24 → v2.42 (était 84, +8). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v75 → v76

Header v2.42 documentant les 6 nouveaux PNJ + le retrofit bloc 14.

### Statistiques v2.42

| Indicateur | v2.41 | v2.42 |
|---|---|---|
| Scènes totales | 110 | **110** (inchangé) |
| Scènes avec NPCs assignés | 79 | **87** (+8) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 79 | **87** (+8) |
| **Progression retrofit** | **72%** | **79%** ✨ |
| **PNJ catalogue** | **36** | **42** ✨ (+6) |
| PNJ réels | 8 | 8 (inchangé) |
| PNJ fictifs | 28 | **34** (+6) |
| PNJ transposables | 11 | **15** (+4) |
| Service Worker | v75 | **v76** |

### Notes éditoriales

**Sur la création des 6 nouveaux PNJ.** Continuant la diversification entamée en v2.41, cette release crée 6 PNJ adaptés aux thématiques du bloc 14 :

1. **tmc_juge_ge (Mme Vaucher)** : seconde figure judiciaire après les procureurs (nicolet, ge_prosecutor_cyber, fr_prosecutor_cyber, ti_ge_proc_cyber). Le TMC a une fonction **préventive distincte** du juge du fond — il contrôle la légalité des mesures de contrainte (art. 269 CPP surveillance, art. 280 CPP IMSI-catcher, art. 286 CPP investigation secrète) avant leur mise en œuvre.

2. **unine_ciso (M. Pillonel)** : RSSI universitaire avec **expertise contexte académique spécifique** (libertés universitaires, open data, collaboration internationale, budgets contraints). Distinct de `dpo_epfl` qui est plus orientée DPO/RGPD que sécurité opérationnelle.

3. **vs_secretaire_communal (M. Métrailler)** : pivot opérationnel pour les **28 communes du Bas-Valais** coordonnées sur le cyber. Profil hybride entre secrétaire communal de carrière et coordinateur cyber régional — utile pour les futurs scénarios communes valaisannes.

4. **switch_cert_lead (Mme Reusser)** : référence **CERT académique CH** (TF-CSIRT GÉANT, FIRST). Distincte de `ofcs_coordinator` (coordination fédérale large) — SWITCH-CERT est spécifiquement le CERT du **secteur académique** (universités, HES, EPF).

5. **ti_pol_chiasso (M. De Bernardi)** : référence **police cyber-frontalière** (A2 Chiasso, contrôles routiers, coopération bilatérale CH-IT avec Polizia di Stato lombarde). Spécialiste scellés numériques et Cellebrite UFED.

6. **fim_xways_expert (Mme Tremp)** : référence **forensique X-Ways senior** (X-PERT + EnCE + GIAC GCFA + GREM). Distincte de `forensics_lead_zh` (Bachmann, plus orientée incident response cantonal) et `fim_genealogist` (Strebel, plus orientée FGG forensique). **Apparaît dans 3 scènes** du bloc 14 (timeline, trois_artefacts, veracrypt) — pivot X-Ways du corpus.

**Sur la doctrine de transposabilité.** Le catalogue compte maintenant **15 PNJ transposables** sur 42 (35.7%). Cette proportion est saine pour permettre la cohérence narrative cross-scénarios sans tomber dans la sur-utilisation des mêmes personnages. Les 27 PNJ non-transposables sont des figures liées à un cas spécifique (Stadler, Swisscom, UniNE, IFC SG, etc.) qui auraient peu de sens dans d'autres scénarios.

**Sur la scène `unine_2022`.** Documentée par le **cas réel Conti UniNE du 17 février 2022** : à 22h50, les premières alertes de chiffrement de fichiers sont remontées. La rentrée semestre printemps (24 février) était à 7 jours. Conti a chiffré une grande partie des serveurs académiques. UniNE n'a pas payé la rançon (montant typique Conti pour université CH ~250-500K USD). La restauration a pris 3 semaines, avec impact pédagogique majeur. La scène modélise les 8 décisions critiques du RSSI sur cette séquence de 17 février → 10 mars 2022.

**Sur la scène `vetroz-akira`.** Documentée par les **attaques Akira contre les communes valaisannes 2024-2026**. Le scénario porte sur le 12 avril 2026 où Vétroz, Abrifeu (Riddes) et Air-Glaciers (Sion) signalent simultanément des perturbations. L'angle d'enquête révèle qu'il ne s'agit pas de 3 attaques distinctes mais d'**une compromission supply chain unique** chez le prestataire IT régional commun aux 3 entités. Cette qualification est cruciale pour orienter l'enquête et protéger les 25 autres clients du même prestataire.

**Sur le rythme du retrofit.** Avec 14 blocs livrés en 14 versions (v2.29 à v2.42), 87 scènes du corpus historique sont équipées de NPCs et marqueurs (sur 110 totales). **Progression à 79%**. Reste **~23 scènes** à traiter (~3 blocs au rythme 8/bloc). Le **cap des 100% reste atteignable en v2.45** au rythme actuel.

### Prochaines évolutions possibles

```
v2.43  Retrofit bloc 15 (8 scènes)
       Candidates par diversification : whistleblower-ddps, xplain, xplain-lmp,
                                         xplain-play, swissport_2022, infostealer-magnus,
                                         bitlocker_froid, custody
v2.44  Retrofit bloc 16 (8 scènes)
       Candidates : eu-france-travail, eu-free-leak, eu-ghgo-ddos,
                    eu-kidflix-stream, eu-livestream-philippines, eu-revil-attribution,
                    evoting-cantonal, exit-suicide-assiste-conteste
v2.45  Retrofit bloc 17 final (~7 scènes restantes) — atteinte 100%
```

## [2.41] — 2026-05-03

**Reprise de la création de PNJ** après 8 releases consécutives sans nouveau personnage. **Bloc 13 du retrofit** (8 anciennes scènes adaptées) avec **+6 nouveaux PNJ thématiques** pour diversifier le casting au-delà des 8 transposables.

### Ajouté — 6 nouveaux PNJ dans `data/npcs.json` (30 → 36)

| ID | Type | Rôle | Usage |
|---|---|---|---|
| `ge_cyber_brigade_chief` | Fictif transposable | M. Pellissier, chef Brigade cyber enquêtes PolGE | sms-blasters + cyber-physique romand |
| `stadler_ciso` | Fictif transposable | M. Frischknecht, CISO Stadler Rail Bussnang | stadler_2020 + industriel ferroviaire |
| `sg_polcyber_chief` | Fictif transposable | Mme Brägger, cheffe juridique IFC PolSG | stgall-infiltration, specialite-eimp + investigations cyber alémaniques |
| `mediswiss_ciso` | Fictif transposable | Mme Borgeat, CISO MediSwiss SA (éditeur SaaS médical fictif) | supply_chain_sante + cyber-santé suisse |
| `swatch_security_lead` | Fictif transposable | M. Stocker, responsable sécurité OT Swatch Group | swatch-2020-ot + espionnage industriel |
| `swisscom_dpo` | Fictif transposable | M. Bachmann, DPO Group Swisscom | swisscom_2018 + nLPD opérateurs télécom |

**Approche éditoriale** : les 6 nouveaux PNJ sont tous **fictifs transposables**, c'est-à-dire utilisables au-delà de leur scène d'origine pour des scénarios sectoriels similaires. Le catalogue compte maintenant **14 PNJ transposables** (sur 36 au total), enrichissant significativement les choix narratifs pour les blocs suivants.

**Pourquoi maintenant ?** Après 8 releases consécutives (v2.32 à v2.40) sans création de PNJ, certains scénarios sectoriels (ferroviaire Stadler, SaaS médical MediSwiss, horloger Swatch, télécom Swisscom) méritaient leurs propres CISO/responsables identifiés plutôt que de réutiliser systématiquement `ciso_logitech` ou `ciso_medsupplier_ne` qui ont leurs propres histoires.

### Ajouté — Retrofit bloc 13 (8 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `sms-blasters` | 5 | medium | `ge_cyber_brigade_chief`, `forensics_lead_zh` | step 0 #0 |
| `specialite-eimp` | 5 | hard | `nicolet`, `sg_polcyber_chief` | step 4 #1 et #2 → 'end' |
| `stadler_2020` | 8 | hard | `stadler_ciso`, `ofcs_coordinator` | step 0 #0 |
| `stgall-infiltration` | 5 | hard | `sg_polcyber_chief`, `pjf_undercover_lead` | step 0 #1 |
| `supply_chain_sante` | 11 | **expert** | `mediswiss_ciso`, `ofcs_coordinator`, `cicr_dpo` | step 0 #0 |
| `swatch-2020-ot` | 5 | hard | `swatch_security_lead`, `forensics_lead_zh` | step 4 #1 et #2 → 'end' |
| `swisscom_2018` | 5 | medium | `swisscom_dpo`, `ofs_rssi_fedch` | step 1 #0 |
| `swissgrid-iec61850-jura` | 5 | expert | `ofcs_coordinator`, `ddps_general_counsel` | step 4 #1 et #2 → 'end' |

**Diversification thématique du bloc 13** (8 thématiques distinctes, mêlant 6 cas réels suisses et 2 scénarios doctrinaux) : (a) **SMS Blasters mobiles GE** (cyber-physique, ComCom + LSCPT + LTC), (b) **Spécialité EIMP art. 67** (extension périmètre BLN → corruption), (c) **Stadler Rail 2020** (cas réel ransomware DoppelPaymer 7 To 6M USD), (d) **Projet IFC PolSG** (investigations darknet sous couverture), (e) **MediSwiss supply chain SaaS médical** (dépendance npm @medi-utils/pdf-gen v3.4.7 compromise, 627k patients, 140 hôpitaux), (f) **Swatch 2020 OT** (espionnage industriel horloger Granges), (g) **Swisscom 2017-2018** (cas réel vol 800k clients via sous-traitant tunisien), (h) **Swissgrid IEC 61850 JU** (poste 380kV expert SCADA niveau national).

**Cas particuliers** :
- `supply_chain_sante` est une scène **expert à 11 steps** (la 2e plus longue du corpus après `palais_federal`)
- `swissgrid-iec61850-jura` est expert : protocole IEC 61850 GOOSE/SV niveau ENTSO-E
- `stadler_2020` est documentée par le **cas réel mai 2020** (DoppelPaymer 6M USD)
- `swisscom_2018` est documentée par le **cas réel 2017-2018** (vol 800k clients)

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 84 scènes touchées par v2.24 → v2.41 (était 76, soit +8). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v74 → v75

Header v2.41 documentant le retrofit bloc 13 + les 6 nouveaux PNJ.

### Statistiques v2.41

| Indicateur | v2.40 | v2.41 |
|---|---|---|
| Scènes totales | 110 | **110** (inchangé) |
| Scènes avec NPCs assignés | 71 | **79** (+8) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 71 | **79** (+8) |
| **Progression retrofit** | **65%** | **72%** ✨ |
| **PNJ catalogue** | 30 | **36 (+6)** ✨ |
| **PNJ transposables** | 8 | **14 (+6)** ✨ |
| Service Worker | v74 | **v75** |

### Notes éditoriales

**Sur la reprise de la création de PNJ.** Après 8 releases consécutives sans nouveau personnage (v2.33 à v2.40), le retour à la création est piloté par l'utilisateur ("ajoute d'autres personnages et reprends pas toujours les 30 mêmes"). C'est un retour pertinent : les scénarios sectoriels (ferroviaire, télécom, SaaS médical, horloger) bénéficient grandement d'avoir leurs propres CISO/responsables identifiés. Le catalogue passe de 30 à **36 PNJ**, avec **14 transposables** (+6) qui peuvent être réutilisés dans les blocs futurs.

**Sur la scène `sms-blasters`.** Scène medium très technique sur la **doctrine cyber-physique suisse**. Le scénario porte sur des SMS Blasters mobiles à Genève (faux SMS de stationnement Ville de Genève envoyés depuis un véhicule équipé d'IMSI catcher). Question juridique centrale : comment articuler LSCPT (loi sur la surveillance correspondance), LTC (loi sur les télécommunications), ComCom (autorité fédérale des télécommunications) et art. 269-279 CPP ? La nouvelle PNJ `ge_cyber_brigade_chief` (M. Pellissier) incarne la coordination opérationnelle terrain.

**Sur la scène `specialite-eimp`.** Scène hard sur **le piège du principe de spécialité art. 67 EIMP**. Le scénario explore comment des pièces obtenues par EIMP allemande pour blanchiment ne peuvent pas être directement utilisées pour étendre l'enquête à de la corruption sans demande d'extension formelle. La PNJ `sg_polcyber_chief` (Mme Brägger) apporte son expertise spécifique en EIMP et coopération bilatérale CH-DE.

**Sur la scène `stadler_2020`.** Scène hard à 8 steps documentée par le **cas réel mai 2020** : Stadler Rail (Bussnang TG, 13'500 employés) frappé par DoppelPaymer ransomware avec demande de 6M USD et exfiltration revendiquée de 7 To. Le scénario explore les questions stratégiques d'un industriel suisse fournissant Bombardier US, SBB CFF FFS, et exposé aux sanctions OFAC + export control SECO. La nouvelle PNJ `stadler_ciso` (M. Frischknecht) incarne la perspective industrielle ferroviaire.

**Sur la scène `stgall-infiltration`.** Scène hard sur le **Projet IFC** de la PolSG (IT-Forensik & Cybercrime Saint-Gall) : investigations sous couverture darknet avec création d'identités fictives. Question juridique centrale : art. 285a CPP (recherches secrètes, sans TMC) vs. art. 286 CPP (investigations secrètes, avec TMC) — quel cadre s'applique ? La PNJ `sg_polcyber_chief` (Mme Brägger) est l'auteure fictive du chapitre « Investigations sous couverture cyber » dans le manuel Niggli/Heimgartner Strafrecht II.

**Sur la scène `supply_chain_sante`.** Scène **expert à 11 steps** (l'une des deux plus longues du corpus avec `palais_federal`). Documentée par les attaques supply chain réelles 2020-2025 (SolarWinds, 3CX, XZ-utils, ua-parser-js). Le scénario MediSwiss SA modélise une dépendance npm compromise (@medi-utils/pdf-gen v3.4.7) qui propage la compromission à 140 hôpitaux clients suisses (47% du parc) avec 627'000 patients impactés. La nouvelle PNJ `mediswiss_ciso` (Mme Borgeat) incarne la perspective éditeur SaaS santé suisse.

**Sur la scène `swatch-2020-ot`.** Scène hard sur **l'espionnage industriel horloger** (Swatch Group, usines de Granges SO, mars 2020). Question juridique centrale : art. 273 CP (espionnage économique pour État étranger) vs. art. 162 CP (violation du secret commercial classique) — quelle qualification ? La nouvelle PNJ `swatch_security_lead` (M. Stocker) incarne la doctrine « sanctuaire » des montres haut de gamme suisses face aux concurrents asiatiques.

**Sur la scène `swisscom_2018`.** Scène medium documentée par le **cas réel 2017-2018** : vol des données de 800'000+ clients Swisscom via l'accès compromis d'un partenaire commercial (sous-traitant tunisien). Le scénario explore l'articulation responsabilité du donneur d'ordre (art. 9 nLPD) et responsabilité du sous-traitant. La nouvelle PNJ `swisscom_dpo` (M. Bachmann) incarne le DPO Group qui a piloté la transition Swisscom vers la nLPD 2023.

**Sur la scène `swissgrid-iec61850-jura`.** Scène **expert** sur le **protocole IEC 61850** (norme internationale de communication pour les sous-stations électriques) et la coordination Swissgrid + ENTSO-E. Le scénario porte sur un poste 380 kV jurassien dont le système de protection IEC 61850 (IED Siemens 7SJ85) montre des anomalies à 03h47. Question : compromission cyber Industroyer-style ou défaut matériel ? Le marqueur souligne que maintenir le poste en service standard sans isolation OT/IT en cas de compromission cyber avérée peut cascader sur le réseau européen UCTE.

**Sur le rythme du retrofit.** Avec 13 blocs livrés en 13 versions (v2.29 à v2.41), 79 scènes du corpus historique sont équipées de NPCs et marqueurs. **Progression à 72 %**. Reste **~31 scènes** à traiter (~4 blocs au rythme de 8/bloc). **Sprint final à portée de main**, objectif 100% en v2.45.

### Prochaines évolutions possibles

```
v2.42  Retrofit bloc 14 (8 scènes, à proposer)
       Candidates par diversification : telegram_2025, telephone_compromis,
                                         tessin-cyber-fraude-pme, threema-hacker-shop,
                                         touche_atomique, tractor-ferme-bio,
                                         tribunal-administratif-vd, urs-rh-leak
v2.43  Retrofit bloc 15 (8 scènes)
v2.44  Retrofit bloc 16 (~7 scènes restantes)
v2.45  Examen blanc 50q/90 min + heatmap canton enrichie
```

## [2.40] — 2026-05-03

**Premier bloc à 8 scènes** — accélération du sprint final pour atteindre 100% du retrofit corpus. **Bloc 12 du retrofit** (8 anciennes scènes adaptées en une seule release) avec diversification thématique maximale : conflit juridictionnel CH-US / RAID forensique / référent milice / APT RUAG / Tessin BEC / curatelle VS / secret de fonction parlementaire / smartphone déverrouillé.

### Ajouté — Retrofit bloc 12 (8 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `ransomware-hopital-doj-conflit` | 5 | hard | `nicolet`, `fbi_legat_bern` | step 4 #1 et #2 → 'end' explicite |
| `ransomware_raid` | 8 | hard | `forensics_lead_zh`, `ciso_logitech` | step 0 #0 (catastrophe RAID) |
| `referent-milice-ransomware` | 5 | easy | `ofcs_coordinator`, `ofs_rssi_fedch` | step 4 #1 et #2 → 'end' explicite |
| `ruag_2016` | 8 | hard | `ddps_general_counsel`, `ofcs_coordinator` | step 0 #0 (catastrophe APT containment) |
| `sati-bec` | 6 | hard | `mroz_ti`, `compliance_bs` | step 0 #1 (catastrophe victim-blaming) |
| `saxon-curatelle` | 5 | hard | `cicr_dpo`, `ofcs_coordinator` | step 1 #2 (catastrophe communication) |
| `secret-fonction-parlementaire` | 5 | hard | `nicolet`, `ddps_general_counsel` | step 4 #1 et #2 → 'end' explicite |
| `smartphone` | 5 | medium | `forensics_lead_zh`, `ge_prosecutor_cyber` | step 0 #0 (catastrophe forensique) |

**Diversification thématique du bloc 12** (8 thématiques distinctes) : (a) **Conflit juridictionnel CH-US ransomware hospitalier** (DOJ, EIMP, ne bis in idem, art. 8 EIMP extradition, partage butin négocié), (b) **RAID 5 + ransomware** (imagerie individuelle préalable obligatoire, write-blocker, doctrine SANS DFIR + ENISA 2024), (c) **Référent cyber milice commune** (Evolène 1'860 hab., doctrine OFCS/CCDJP communes <2'000 hab.), (d) **APT RUAG 21 mois** (cas réel 2016, infrastructures critiques DDPS, coordination Five Eyes, doctrine OFCS-CII), (e) **Tessin BEC 18.6M CHF** (SATI, MROZ-TI, ATF 6B_135/2018 victim-centered, MLAT cascade), (f) **Curatelle VS 380 vulnérables** (nLPD art. 24 « meilleurs délais », population fragile trauma-informed), (g) **Secret de fonction parlementaire** (art. 73 CPP, art. 320 CP, LParl art. 162, séparation pouvoirs MPC-Parlement), (h) **Smartphone déverrouillé** (capture RAM Signal + mode avion + photo écran avant saisie).

**Cas particuliers** :
- `ruag_2016` (8 steps) et `ransomware_raid` (8 steps) sont parmi les scènes les plus longues du corpus
- `secret-fonction-parlementaire` est unique par sa dimension de **résistance institutionnelle** (le procureur fédéral lui-même ferait l'objet de poursuites art. 320 CP s'il cédait à la pression parlementaire individuelle)
- `ransomware-hopital-doj-conflit` introduit la **doctrine ne bis in idem** dans un contexte cyber multi-juridictions

### Pas de nouveau PNJ — huitième fois consécutive

Huitième release sans création de PNJ depuis v2.32. Le catalogue de 30 PNJ est durablement stable.

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 76 scènes touchées par v2.24 → v2.40 (était 68, soit +8 d'un coup pour la première fois). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v73 → v74

Header v2.40 documentant le retrofit bloc 12 (premier bloc de 8).

### Statistiques v2.40

| Indicateur | v2.39 | v2.40 |
|---|---|---|
| Scènes totales | 110 | **110** (inchangé) |
| Scènes avec NPCs assignés | 63 | **71** (+8) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 63 | **71** (+8) |
| **Progression retrofit** | **57%** | **65%** ✨ |
| PNJ catalogue | 30 | **30** (inchangé) |
| Service Worker | v73 | **v74** |

### Notes éditoriales

**Sur la scène `ransomware-hopital-doj-conflit`.** Scène hard introduisant la **doctrine ne bis in idem** appliquée au contexte cyber multi-juridictions. Le scénario porte sur un suspect M. K. arrêté aux États-Unis, lié simultanément à un ransomware hospitalier suisse (HCS, 3 décès) et à une extorsion bancaire US. Le DOJ propose à la Suisse une cession globale du dossier. Question juridique centrale : **comment articuler la souveraineté procédurale suisse, l'efficacité de coopération internationale, et la dignité des 3 victimes décédées ?** La doctrine OFJ + DFJP refuse la cession globale et privilégie la coordination en 4 axes.

**Sur la scène `ransomware_raid`.** Scène hard à 8 steps sur la **doctrine forensique RAID** dans un contexte ransomware. Question technique centrale : avant de tenter la reconstruction RAID 5 (sur 2 disques sains + 1 disque ransomwarisé), faut-il imager individuellement chaque disque ? La doctrine SANS DFIR + ENISA Good Practices Cyber Incident Response 2024 répond OUI — l'imagerie individuelle préalable avec write-blocker est obligatoire pour préserver les 60% de données potentiellement récupérables.

**Sur la scène `referent-milice-ransomware`.** Scène easy mais doctrinalement importante. Le **référent cyber de milice** dans une commune de moins de 2'000 habitants (Evolène, 1'860 hab.) est confronté dimanche 19h47 à un ransomware. Question centrale : quelles sont les limites de son pouvoir d'action en l'absence du syndic et du prestataire IT ? La doctrine OFCS + CCDJP est claire : **référent de milice = triage et alerte uniquement, pas décision opérationnelle**. Toute décision de paiement ou de communication publique doit attendre la coordination avec le syndic, l'OFCS et le préposé cantonal.

**Sur la scène `ruag_2016`.** Scène hard à 8 steps documentée par le **cas réel RUAG 2016** (cyber-espionnage présumé russe sur l'entreprise d'armement suisse, APT présent depuis 21 mois lors de la détection). Le scénario explore la coordination DDPS + OFCS + SRC + fedpol + Five Eyes (BfV, NSA, GCHQ). Le marqueur souligne que couper publiquement la connectivité de RUAG sans coordination préalable alerte l'APT et lui permet de wiper ses traces — la doctrine OFCS-CII militaire impose un containment ciblé sur les machines compromises, pas une coupure totale visible.

**Sur la scène `sati-bec`.** Scène hard à 6 steps sur **un BEC tessinois de 18.6 millions CHF** investigué par la SATI (Sezione Analisi Tecnica Informatica de la PolCant tessinoise). Le scénario explore : la qualification de la PME victime (pas suspecte de complicité), l'investigation MROZ-TI sur les flux financiers, la cascade des mules bancaires, la coordination MLAT vers les juridictions de réception (Hong Kong, EAU, Israël), la communication SATI sectorielle aux 17 autres PME tessinoises identifiées comme cibles potentielles. Le marqueur souligne le piège du victim-blaming.

**Sur la scène `saxon-curatelle`.** Scène hard sur les **populations vulnérables** : 380 personnes sous curatelle au Service de Saxon (personnes âgées, handicapés, addictions). La compromission ransomware expose des données particulièrement sensibles. La doctrine nLPD art. 24 « meilleurs délais » impose une qualification fine des données touchées avant communication aux bénéficiaires fragiles — une notification massive prématurée provoque une panique disproportionnée chez une population qui ne peut pas toujours évaluer rationnellement l'information reçue.

**Sur la scène `secret-fonction-parlementaire`.** Scène hard unique dans le corpus : elle modélise la **résistance institutionnelle d'un procureur fédéral** face à la demande informelle d'une Conseillère nationale d'accéder à un dossier d'instruction confidentielle (Conseiller d'État vaudois en cours d'instruction depuis 8 mois). Question juridique centrale : que faire face à la pression politique individuelle ? Le marqueur souligne que **le procureur fédéral lui-même ferait l'objet de poursuites art. 320 CP** s'il cédait. La voie correcte est : refus motivé + orientation vers les voies parlementaires formelles (interpellation au CF, saisine CdG/DélCdG selon procédure).

**Sur la scène `smartphone`.** Scène medium technique sur la **doctrine forensique smartphone déverrouillé**. L'iPhone du suspect est posé sur la table, déverrouillé, des notifications Signal sont visibles, l'avocat de la défense entre dans l'appartement à la fin de la perquisition. Que faire dans les 60 secondes critiques ? La doctrine moderne (NIST SP 800-101 + ENFSI Best Practice Manual 2024) impose : (1) **photographier l'écran** immédiatement avec les notifications Signal visibles, (2) **basculer en mode avion** pour empêcher l'effacement à distance (FindMy, Signal disappearing messages), (3) **capturer la mémoire vive** via UFED Premium ou équivalent, (4) **maintenir l'écran allumé** jusqu'à l'extraction.

**Sur le passage à 8 scènes par bloc.** L'utilisateur a explicitement autorisé v2.40 à augmenter la taille des blocs. Cette accélération est rendue possible par la stabilisation du catalogue PNJ (8 transposables) et la maîtrise éditoriale des marqueurs et de la balance. Le sprint vers 100% peut désormais atteindre **65%** dès cette release et viser **~100%** en 5 blocs supplémentaires (v2.41 à v2.45) au rythme de 8 scènes/bloc.

### Prochaines évolutions possibles

```
v2.41  Retrofit bloc 13 (8 scènes, à proposer)
       Candidates par diversification : sms-blasters, specialite-eimp,
                                         stadler_2020, stgall-infiltration,
                                         supply_chain_sante, swatch-2020-ot,
                                         swisscom_2018, swissgrid-iec61850-jura
v2.42  Retrofit bloc 14 (8 scènes)
v2.43  Retrofit bloc 15 (8 scènes)
v2.44  Examen blanc 50q/90 min
v2.45  Heatmap canton enrichie + badges par canton
```

## [2.39] — 2026-05-03

Release de **mise à niveau du corpus**, sans nouveau scénario. **Bloc 11 du retrofit** (5 anciennes scènes adaptées) avec diversification thématique continue : phishing classique / Operation PowerOFF DDoS-for-hire / SOC premier appel / rajeunissement IA pédopornographie / ransomware hôpital.

### Ajouté — Retrofit bloc 11 (5 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `phishing` | 3 | easy | `ofs_rssi_fedch`, `forensics_lead_zh` | step 1 #0 (catastrophe sandbox manquante) |
| `poweroff-ddos` | 4 | medium | `fbi_legat_bern`, `nicolet` | step 3 #0 (catastrophe communication) |
| `premier_appel` | 3 | easy | `ciso_logitech`, `ofcs_coordinator` | step 0 #0 (catastrophe promesse SOC) |
| `rajeunissement-ia` | 5 | medium | `fbi_legat_bern`, `ge_prosecutor_cyber` | step 1 #1 (catastrophe sous-qualification) |
| `ransomware` | 5 | medium | `ciso_logitech`, `forensics_lead_zh` | step 1 #2 (catastrophe forensique manquante) |

**Diversification thématique du bloc 11** : (a) **Phishing classique SOC** (bouton signaler Outlook, sandbox urlscan.io/VirusTotal, doctrine triage), (b) **Operation PowerOFF DDoS-for-hire** (Europol avril 2026, 53 plateformes 15 pays, art. 144bis al. 2 + 24 + 143bis CP, Convention Budapest art. 29), (c) **SOC premier appel** (triage factuel avant promesse, escalade niveau 2 + RSSI, contre-pied à la posture "rassurer"), (d) **Rajeunissement IA pédopornographie** (ATF 6B_1335/2021, art. 197 al. 4 vs al. 5 CP, Convention de Lanzarote art. 20), (e) **Ransomware hôpital** (12'000 patients, doctrine OFCS/Health-CERT forensique avant restauration, nLPD art. 24).

### Pas de nouveau PNJ — septième fois consécutive

Septième release sans création de PNJ depuis v2.32. Le catalogue de 30 PNJ avec 8 transposables est désormais à pleine maturité.

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 68 scènes touchées par v2.24 → v2.39 (était 63). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v72 → v73

Header v2.39 documentant le retrofit bloc 11.

### Statistiques v2.39

| Indicateur | v2.38 | v2.39 |
|---|---|---|
| Scènes totales | 110 | **110** (inchangé) |
| Scènes avec NPCs assignés | 58 | **63** (+5) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 58 | **63** (+5) |
| **Progression retrofit** | **53%** | **57%** |
| PNJ catalogue | 30 | **30** (inchangé) |
| Service Worker | v72 | **v73** |

### Notes éditoriales

**Sur la scène `phishing`.** Scène easy mais doctrinalement importante : elle modélise la **doctrine SOC standard** face à un email signalé via le bouton Outlook. Le marqueur souligne que cliquer sur le lien suspect depuis un poste de production normal pour vérifier où il mène (au lieu d'utiliser une sandbox isolée ou un service tiers comme urlscan.io / VirusTotal) compromet potentiellement le poste de l'analyste avec malware-as-a-service ou exploit kit, et propage l'incident plutôt que de le contenir.

**Sur la scène `poweroff-ddos`.** Scène medium documentée par les opérations Europol réelles **PowerOFF (2018, 2022, 2024-2026)** qui ont démantelé plusieurs vagues de plateformes DDoS-for-hire (booters / stressers). Le scénario suisse modélise les 4 questions stratégiques : (1) qualification multi-axes art. 144bis + 24 + 143bis CP, (2) triage des 8'400 comptes clients identifiés, (3) qualification du dol direct face à l'argument client « j'ai juste testé un service marketing », (4) coordination internationale avec ordonnance MP préparée + Convention de Budapest art. 29.

**Sur la scène `premier_appel`.** Scène easy mais subtile : elle modélise le **triage SOC** face à un appel d'urgence à 14h37 (comptable PME en panique). Le marqueur souligne le piège classique : promettre au client « tout va bien se passer, on va récupérer vos fichiers » sans avoir évalué la situation factuelle (souche, périmètre, exfiltration, sauvegardes) crée des attentes irréalistes qui se traduiront en perte de confiance majeure si la situation est plus grave (LockBit avec exfiltration + sauvegardes compromises).

**Sur la scène `rajeunissement-ia`.** Scène medium très d'actualité 2025-2026. Le scénario modélise un cas hybride : suspect (M. T., enseignant valaisan avec accès à des enfants) qui utilise l'IA pour : (a) « rajeunir » des photos de lui-même enfant à des fins de simulation pédopornographique, (b) générer des images d'enfants fictifs IA-pures. Question juridique centrale : **l'art. 197 al. 4 CP couvre-t-il les images IA-générées simulant des mineurs ?** L'arrêt TF de novembre 2025 (référence ATF 6B_1335/2021 fictive ici) répond OUI — le caractère IA-généré ne réduit pas la qualification, et la diffusion publique sur Instagram = al. 4 (mise à disposition, peine MAX 3 ans), pas seulement al. 5 (possession).

**Sur la scène `ransomware`.** Scène medium documentée par les attaques ransomware réelles contre les hôpitaux européens 2020-2025 (Anhalt-Bitterfeld DE, Düsseldorf, IRO Mexico, plusieurs hôpitaux suisses 2023). Le scénario porte sur un **hôpital cantonal frappé à 03h00**, 12'000 patients impactés, exfiltration confirmée. Les 5 steps couvrent : forensique vs restauration immédiate, notification PFPDT timing, attribution Ryuk/TrickBot, communication patients individuelle vs masse, refus du paiement avec investissement équivalent dans la résilience. Le marqueur souligne que la doctrine OFCS/Health-CERT pour les hôpitaux est : **forensique d'abord (2-4h), restauration ensuite**.

**Sur le rythme du retrofit.** Avec 11 blocs livrés en 11 versions (v2.29 à v2.39), 63 scènes du corpus historique sont équipées de NPCs et marqueurs. **Progression à 57 %** — la barre des 60% se profile pour v2.40. Reste **~47 scènes** à traiter (~9 blocs).

### Prochaines évolutions possibles

```
v2.40  Retrofit bloc 12 (5 anciennes scènes, à proposer)
       Candidates par diversification : ransomware-hopital-doj-conflit,
                                         ransomware_raid, referent-milice-ransomware,
                                         ruag_2016, sati-bec
v2.41  Retrofit bloc 13
v2.42  Examen blanc 50q/90 min
```

## [2.38] — 2026-05-03

Release de **mise à niveau du corpus** franchissant le **cap symbolique des 50 %**. **Bloc 10 du retrofit** (5 anciennes scènes adaptées) avec diversification thématique continue : DDoS NoName057 pro-russe / Opération Alice darknet / OSINT licite / Palais fédéral APT (scène expert 11 steps) / perquisition conjugale.

### Ajouté — Retrofit bloc 10 (5 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `noname_2023` | 5 | medium | `ofcs_coordinator`, `ddps_general_counsel` | step 0 #2 (catastrophe communication timing) |
| `operation-alice` | 5 | hard | `pjf_undercover_lead`, `fbi_legat_bern` | step 0 #0 (refus participation = ferme Op.Alice) |
| `osint-licite` | 3 | easy | `forensics_lead_zh`, `nicolet` | step 0 #0 (OSINT sans cadre = cassation) |
| `palais_federal` | 11 | **expert** | `nicolet`, `ofcs_coordinator`, `ddps_general_counsel` | step 0 #0 (communication 5h47 sans coordination) |
| `perquisition-conjugale` | 5 | medium | `forensics_lead_zh`, `ge_prosecutor_cyber` | step 4 #1 et #2 → 'end' explicite |

**Diversification thématique du bloc 10** : (a) **DDoS hacktiviste pro-russe** (NoName057, 15 juin 2023, allocution Zelensky Parlement, doctrine OFCS/CDN/communication), (b) **Opération Alice darknet pédocriminalité** (Europol 23 pays, art. 285a-298 CPP investigation secrète, agent infiltré, EIMP transmission spontanée art. 67a), (c) **OSINT licite** (CGU plateformes, art. 273 CP espionnage économique, art. 162 CP secret commercial, ATF 6B_421/2022), (d) **APT Palais fédéral** (Chancellerie 14 machines, art. 269 CPP interception HTTPS, briefing DélCdG SCIF, attribution iranienne TA450, art. 73 CPP secret enquête vs DFAE diplomatie), (e) **Perquisition domicile conjugal** (art. 244 + 246 + 248 CPP, ATF 6B_517/2017 données conjugales, droits Mme T. art. 13 al. 1 Cst).

**Cas particulier `palais_federal`** : scène **expert à 11 steps** (la plus longue du corpus), avec un graphe narratif complexe (10 bifurcations 'end' existantes). Le retrofit a nécessité 12 ajustements de balance (étoffement systématique des distracteurs courts ~250c face aux bons choix riches ~500-600c). Cette scène est désormais l'un des piliers pédagogiques du corpus, illustrant la **gestion intégrée d'une crise cyber étatique** sous toutes ses dimensions : forensique (containment vs préservation), procédurale (interception HTTPS art. 269 CPP), institutionnelle (briefing DélCdG SCIF, art. 73 CPP), diplomatique (attribution iranienne et position DFAE), et communicationnelle (conférence de presse coordonnée).

### Pas de nouveau PNJ — sixième fois consécutive

Sixième release sans création de PNJ depuis v2.32. Le catalogue de 30 PNJ avec 8 transposables suffit largement au retrofit.

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 63 scènes touchées par v2.24 → v2.38 (était 58). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v71 → v72

Header v2.38 documentant le retrofit bloc 10.

### Statistiques v2.38

| Indicateur | v2.37 | v2.38 |
|---|---|---|
| Scènes totales | 110 | **110** (inchangé) |
| Scènes avec NPCs assignés | 53 | **58** (+5) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 53 | **58** (+5) |
| **Progression retrofit** | **48%** | **53%** ✨ |
| PNJ catalogue | 30 | **30** (inchangé) |
| Service Worker | v71 | **v72** |

### Notes éditoriales

**Sur la scène `noname_2023`.** Scène medium documentée par les **DDoS réels du 15 juin 2023** : NoName057 (groupe hacktiviste pro-russe Telegram) revendique des attaques contre plusieurs sites d'administration suisse en marge de l'allocution vidéo du Président Zelensky devant le Parlement. La scène modélise les questions stratégiques de **timing de communication** : avant 14h (allocution Zelensky), toute déclaration MPC/OFCS qui attribue les attaques nominativement à NoName amplifie l'effet recherché (« la Suisse a peur ») et embarrasse politiquement le Parlement pendant l'allocution. La doctrine OTAN sur les opérations psychologiques cyber recommande d'éviter cette amplification.

**Sur la scène `operation-alice`.** Scène hard sur **agent infiltré darknet pédocriminalité** dans le cadre Europol multi-juridictions (23 pays). Le scénario explore : (1) le cadre juridique suisse strict de l'investigation secrète (art. 285a-298 CPP, ordonnance MP + autorisation TMC), (2) l'éthique de l'agent infiltré face aux demandes des suspects (jamais participer, documenter), (3) la transmission de preuves obtenues à l'étranger (BKA allemand) avec garanties art. 67a EIMP, (4) la protection psychologique des enquêteurs spécialisés (rotation, traumathérapie, sessions limitées 2h), (5) la transmission spontanée internationale conditionnelle.

**Sur la scène `osint-licite`.** Scène easy mais juridiquement subtile. Le scénario porte sur un **analyste DFIR mandaté par le MP** qui doit choisir entre 5 techniques OSINT (A=presse publique, B=LinkedIn public, C=Twitter public, D=darknet, E=infiltration forum). Question juridique : lesquelles sont licites en procédure pénale suisse ? Réponse doctrinale : A, B, C uniquement (données volontairement publiques sans authentification). Le marqueur souligne que pratiquer un OSINT sans cadre juridique préalable expose la totalité du dossier à une cassation procédurale au procès (jurisprudence TF 6B_421/2022, doctrine MROZ-LIM 2024).

**Sur la scène `palais_federal`.** Scène **expert à 11 steps**, l'une des plus complexes du corpus. Documentée par les **incidents cyber réels touchant l'administration fédérale 2022-2025** (Xplain, RUAG, Microsoft Exchange, etc.). Le scénario modélise une intrusion APT sur la Chancellerie fédérale détectée à 5h47 du matin (14 machines compromises identifiées). Les 11 steps couvrent : ouverture instruction Art. 309 CPP, séquestre proportionné Art. 267 CPP, partage international IoC, ordre de containment ciblé, briefing DélCdG en SCIF, demande interception HTTPS Art. 269 CPP, articulation MPC-DFAE sur attribution iranienne, extraction RAM ciblée, briefing au CF, conférence de presse coordonnée, contribution rapport national OFCS. C'est la scène la plus pédagogiquement dense pour la gestion intégrée d'une crise cyber étatique.

**Sur la scène `perquisition-conjugale`.** Scène medium sur **les limites de la perquisition au domicile conjugal** quand le suspect (Mr. T.) n'est pas présent et que l'épouse (Mme T., non-suspecte) reçoit l'équipe à 6h12. Le scénario explore : présenter le mandat avec calme et expliquer les droits, saisir avec scellés systématiques uniquement les appareils potentiellement liés, respecter les zones strictement privées de Mme T. (chambre conjugale = oui ; bureau partagé = oui avec scellés ; chambre de la fille = non sauf nécessité), rédiger un PV détaillé avec présence et signature de Mme T. Le marqueur souligne que verser tous les éléments sans tri viole l'ATF 6B_517/2017 et les droits art. 13 al. 1 Cst.

**Sur le rythme du retrofit — cap des 50% atteint.** Avec 10 blocs livrés en 10 versions (v2.29 à v2.38), **58 scènes du corpus historique** sont désormais équipées de NPCs et marqueurs narratifs (sur 110 totales). La progression est de **53 % du corpus mis à niveau** — la moitié est largement franchie. Reste **~47 scènes** à traiter (~9 blocs au rythme actuel). Le sprint vers le 100 % continue avec une mécanique désormais bien rodée.

### Prochaines évolutions possibles

```
v2.39  Retrofit bloc 11 (5 anciennes scènes, à proposer)
       Candidates par diversification : phishing, poweroff-ddos,
                                         premier_appel, rajeunissement-ia,
                                         ransomware
v2.40  Retrofit bloc 12
v2.41  Examen blanc 50q/90 min
v2.42  Heatmap canton enrichie + badges par canton
```

## [2.37] — 2026-05-03

Release de **mise à niveau du corpus**, sans nouveau scénario. **Bloc 9 du retrofit** (5 anciennes scènes adaptées) avec diversification thématique continue : forensique RAM Volatility / métadonnées EXIF / mineur étranger GAV / blanchiment LBA / NCMEC CyberTip. Le corpus reste à 110 scènes ; le catalogue PNJ reste à 30.

### Ajouté — Retrofit bloc 9 (5 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `memory-forensics-volatility` | 5 | hard | `forensics_lead_zh`, `ciso_logitech` | step 4 #1 et #2 → 'end' explicite |
| `metadata` | 3 | easy | `forensics_lead_zh`, `ge_prosecutor_cyber` | step 0 #0 (catastrophe EXIF brut) |
| `mineur-etranger-garde-a-vue` | 5 | hard | `cicr_dpo`, `ge_prosecutor_cyber` | step 4 #1 et #2 → 'end' explicite |
| `mros-banquier` | 4 | medium | `compliance_bs`, `ge_prosecutor_cyber` | step 3 #0 (catastrophe communication publique) |
| `ncmec-cypertip` | 4 | medium | `fbi_legat_bern`, `pjf_undercover_lead` | step 1 #0 (catastrophe perquisition) |

**Diversification thématique du bloc 9** : (a) **Forensique RAM Volatility 3** (APT cyber industriel semi-conducteurs, NIST SP 800-86, ENISA Good Practices), (b) **Métadonnées EXIF GPS** (photo Instagram, croisement Tours GSM + Meta logs, manipulation EXIF par ExifTool), (c) **MNA cambriolage + traite EH** (Lausanne, art. 139 ch. 3 CP + art. 182 CP, PPMin, CIDE art. 40, Convention de Varsovie), (d) **MROS-banquier** (art. 305ter CP négligence vs art. 305bis CP intentionnel, LBA Art. 6/9/10, dol éventuel), (e) **NCMEC CyberTip pédocriminalité** (art. 197 al. 4 et 5 CP, ICSE Interpol, capture RAM avant extinction).

### Pas de nouveau PNJ — cinquième fois consécutive

Cinquième release sans création de PNJ depuis v2.32. Le catalogue de 30 PNJ avec 8 transposables est désormais largement stabilisé pour le retrofit.

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 58 scènes touchées par v2.24 → v2.37 (était 53). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v70 → v71

Header v2.37 documentant le retrofit bloc 9.

### Statistiques v2.37

| Indicateur | v2.36 | v2.37 |
|---|---|---|
| Scènes totales | 110 | **110** (inchangé) |
| Scènes avec NPCs assignés | 48 | **53** (+5) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 48 | **53** (+5) |
| PNJ catalogue | 30 | **30** (inchangé) |
| Service Worker | v70 | **v71** |

### Notes éditoriales

**Sur la scène `memory-forensics-volatility`.** Scène hard dédiée à la **doctrine forensique RAM** dans une attaque APT contre un industriel suisse (semi-conducteurs, 3'400 employés). Les 5 steps explorent la décision capture-mémoire-avant-reboot vs. demande DG de redémarrer immédiatement, l'analyse Volatility 3 multi-axes, la qualification art. 273 CP (espionnage économique pour État étranger), la stratégie EIMP en 2 vagues (Singapour first / pays final), et le rapport forensique conforme NIST SP 800-86. Le marqueur souligne que conclure la procédure pénale uniquement sur les artefacts disque sans capture RAM est une lacune forensique majeure exploitable par la défense.

**Sur la scène `metadata`.** Scène easy pédagogique sur **l'authentification forensique des métadonnées EXIF**. Question centrale : une photo Instagram avec coordonnées GPS EXIF prouve-t-elle la localisation du suspect ? Le marqueur souligne que les EXIF sont facilement manipulables (ExifTool en mode écriture, ré-encodage, applications fakeGPS) — leur valeur probatoire dépend de l'authentification forensique (timestamp NTP fiable, hash du fichier original sur l'iPhone saisi, cohérence avec les autres photos, croisement Tours GSM, croisement logs Instagram/Meta).

**Sur la scène `mineur-etranger-garde-a-vue`.** Scène hard sur l'articulation **GAV mineur + suspicion de traite EH**. Arianit, MNA d'origine albanaise/kosovare, est interpellé pour cambriolage avec violence à Lausanne mais des éléments suggèrent qu'il agit sous contrainte de « Driton ». Le scénario explore : (1) le triage initial humanitaire/procédural, (2) la communication identifiante avant audition, (3) la qualification double victime ET auteur, (4) le placement protégé en foyer MNA-traite, (5) la note méthodologique pour la CCDJP. Le marqueur souligne que toute audition sans interprète qualifié + avocat de garde mineurs viole simultanément l'art. 6 CEDH, l'art. 30 al. 3 Cst, la PPMin, et la CIDE art. 40.

**Sur la scène `mros-banquier`.** Scène medium qui distingue rigoureusement **art. 305ter CP (défaut de vigilance, négligence)** et **art. 305bis CP (blanchiment intentionnel, dol éventuel)**. Le scénario porte sur un gestionnaire de fortune genevois qui a accepté 21.5M CHF d'un « investisseur immobilier » mafieux, accusé deux ans plus tard par le MPC. Question juridique : qualification 305ter ou 305bis ? La doctrine moderne (Cassani, Schweizerisches Strafrecht 2024 + jurisprudence TF 6B_136/2018) impose la 305ter pour les négligences caractérisées, la 305bis pour les cas où le dol éventuel est démontré (red flags massifs et conscients).

**Sur la scène `ncmec-cypertip`.** Scène medium sur le **cycle complet d'un CyberTip NCMEC** : signalement → triangulation forensique → ordonnance MP → perquisition → qualification graduée art. 197 CP. Le scénario porte sur un suspect domicilié dans le canton de Vaud, possible enseignant. Le marqueur souligne le danger d'une perquisition sans validation forensique préalable : si l'IP NCMEC est mal attribuée (CGNAT, erreur de mapping) la perquisition tombe sur la mauvaise personne — drame humain irréparable et catastrophe procédurale. La doctrine fedpol-NCMEC impose la triangulation préalable (hash, IP, cohérence comportementale).

**Sur le rythme du retrofit.** Avec 9 blocs livrés en 9 versions (v2.29 à v2.37), 53 scènes du corpus historique sont désormais équipées de NPCs et marqueurs narratifs (sur 110 totales). La progression est de **48 % du corpus mis à niveau** — quasiment la moitié. Reste **~52 scènes** à traiter (~10 blocs au rythme actuel).

### Prochaines évolutions possibles

```
v2.38  Retrofit bloc 10 (5 anciennes scènes, à proposer)
       Candidates par diversification : noname_2023, operation-alice,
                                         osint-licite, palais_federal,
                                         perquisition-conjugale
v2.39  Retrofit bloc 11
v2.40  Examen blanc 50q/90 min
v2.41  Heatmap canton enrichie + badges par canton
```

## [2.36] — 2026-05-03

Release de **mise à niveau du corpus**, sans nouveau scénario. **Bloc 8 du retrofit** (5 anciennes scènes adaptées) avec diversification thématique continue : forensique IP / vishing JU 1.5M / deepfake personnalité publique / LockBit ransomware / coordination LSI-LPD timing. Le corpus reste à 110 scènes ; le catalogue PNJ reste à 30.

### Ajouté — Retrofit bloc 8 (5 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `ip_accusatrice` | 5 | medium | `forensics_lead_zh`, `nicolet` | step 0 #0 (arrestation IP prématurée) |
| `jura-vishing-1m` | 5 | medium | `fr_prosecutor_cyber`, `forensics_lead_zh` | step 0 #2 (qualification simple insuffisante) |
| `kks-deepfake` | 4 | hard | `ofcs_coordinator`, `src_director` | step 3 #0 (communication publique précoce) |
| `lockbit-victime` | 3 | easy | `ciso_logitech`, `ofcs_coordinator` | step 0 #1 (paiement rançon immédiat) |
| `lsi-vs-lpd-timing` | 5 | hard | `ofcs_coordinator`, `cicr_dpo` | step 4 #1 et #2 → 'end' explicite |

**Diversification thématique du bloc 8** : (a) **Forensique IP-FAI** (CGNAT, MAC spoofing, VPN compromis, ATF 6B_372/2017), (b) **Vishing JU « par métier »** (14 victimes en 8 mois, art. 146 al. 2 CP peine MAX 10 ans), (c) **Deepfake personnalité publique** (art. 179decies CP nouveau + art. 146 + art. 173 CP, escroquerie crypto 340 victimes 800k CHF), (d) **LockBit PME** (80k CHF Bitcoin, doctrine OFCS non-paiement, Opération Cronos déchiffreurs gratuits), (e) **LSI-nLPD timing** (parapublic VS 38'000 patients, articulation 3 cadres notification, communication publique).

### Pas de nouveau PNJ — quatrième fois consécutive

Quatrième release sans création de PNJ depuis v2.32. Confirmation que le catalogue de 30 PNJ avec 8 transposables est stabilisé.

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 53 scènes touchées par v2.24 → v2.36 (était 48). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v69 → v70

Header v2.36 documentant le retrofit bloc 8.

### Statistiques v2.36

| Indicateur | v2.35 | v2.36 |
|---|---|---|
| Scènes totales | 110 | **110** (inchangé) |
| Scènes avec NPCs assignés | 43 | **48** (+5) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 43 | **48** (+5) |
| PNJ catalogue | 30 | **30** (inchangé) |
| Service Worker | v69 | **v70** |

### Notes éditoriales

**Sur la scène `ip_accusatrice`.** Scène medium très pédagogique sur les **multiples sources d'erreur d'attribution** d'une adresse IP : CGNAT (Carrier-Grade NAT, où plusieurs centaines de clients partagent une même IP publique), routeur ouvert (un voisin ou un visiteur ayant utilisé le WiFi non protégé), MAC spoofing (usurpation d'identifiant matériel), malware proxy (machine compromise utilisée comme rebond), VPN compromis (chaîne de pseudonymisation incomplète). Le marqueur souligne que l'imputation personnelle exige des éléments corroboratifs (jurisprudence TF ATF 6B_372/2017).

**Sur la scène `jura-vishing-1m`.** Scène medium documentée par les opérations vishing aînés en Suisse romande 2022-2025 : H. (34 ans, belge, interpellé en JU) opère 14 victimes en 8 mois pour 1.5M CHF. Question juridique centrale : caractériser le **« par métier »** au sens art. 146 al. 2 CP (peine privative jusqu'à 10 ans, contre 5 ans pour 146 al. 1 simple). La jurisprudence TF (ATF 129 IV 49) considère le métier comme caractérisé par : volume + méthode systématique + revenus réguliers + activité professionnalisée.

**Sur la scène `kks-deepfake`.** Scène hard sur l'art. 179decies CP **nouveau** (atteinte à la personnalité par usurpation d'identité — entré en vigueur 2024) en concours avec art. 146 CP (escroquerie crypto sur 340 victimes pour 800k CHF) et art. 173 CP (diffamation). Le marqueur souligne le piège de la communication publique précoce nominative : demander à la haute personnalité ciblée un démenti immédiat sans préparation peut transformer le démenti en confirmation involontaire (effet Streisand).

**Sur la scène `lockbit-victime`.** Scène easy à 3 steps qui modélise le **premier réflexe** d'une PME face au ransomware LockBit. Question centrale : payer ou pas. Le marqueur souligne 4 raisons de NON-paiement : (a) finance directement LockBit, (b) taux de respect engagement ~62% selon Chainalysis 2024, (c) viole recommandations OFCS/FBI/NCSC, (d) sanctions OFAC US si LockBit liste sanctionnée. La voie alternative est l'OFCS qui peut fournir des outils de déchiffrement issus de l'**Opération Cronos** (saisie LockBit février 2024 par NCA UK + FBI + Europol).

**Sur la scène `lsi-vs-lpd-timing`.** Scène hard très subtile qui articule **trois cadres de notification distincts** : LSI (Loi sur la sécurité des informations — assujettissement OFCS pour CII), nLPD art. 24 (notification 72h pour données personnelles), communication patients individuelle. Le scénario pose les bonnes questions : assujettissement LSI mixte parapublic/privé incertain, périmètre 38'000 patients incertain, chronologie de connaissance technique discutée par un journaliste. Le marqueur souligne la doctrine nLPD « meilleurs délais » qui inclut la qualification médicale fine des données.

**Sur le rythme du retrofit.** Avec 8 blocs livrés en 8 versions (v2.29 à v2.36), 48 scènes du corpus historique sont désormais équipées de NPCs et marqueurs narratifs (sur 110 totales). La progression est de **44 % du corpus mis à niveau**. Reste **~57 scènes** à traiter (~11 blocs au rythme actuel). Approche du milieu du sprint.

### Prochaines évolutions possibles

```
v2.37  Retrofit bloc 9 (5 anciennes scènes, à proposer)
       Candidates par diversification : lugano-mallette, malware-cascade,
                                         medusa-grade-3, mysecuritybox-zh,
                                         neom-evangeliste
v2.38  Retrofit bloc 10
v2.39  Examen blanc 50q/90 min
v2.40  Heatmap canton enrichie + badges par canton
```

## [2.35] — 2026-05-03

Release de **mise à niveau du corpus**, sans nouveau scénario. **Bloc 7 du retrofit** (5 anciennes scènes adaptées) avec diversification thématique continue : Android malware + BEC / douane frontière / harcèlement portail anonyme / IA générative / IoT camera. Le corpus reste à 110 scènes ; le catalogue PNJ reste à 30 personnages.

### Ajouté — Retrofit bloc 7 (5 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `flubot-bec-cascade` | 5 | medium | `ofs_rssi_fedch`, `fr_prosecutor_cyber` | step 4 #1 et #2 → 'end' explicite |
| `frontieres` | 5 | medium | `nicolet`, `ddps_general_counsel` | step 0 #0 (catastrophe douane) |
| `harcelement-ne` | 5 | easy | `ge_prosecutor_cyber`, `forensics_lead_zh` | step 0 #1 (catastrophe portail anonyme) |
| `ia-generative-faux-titres` | 5 | hard | `ge_prosecutor_cyber`, `forensics_lead_zh` | step 4 #1 et #2 → 'end' explicite |
| `iot-camera-compromise` | 5 | hard | `forensics_lead_zh`, `ge_prosecutor_cyber` | step 4 #1 et #2 → 'end' explicite |

**Diversification thématique du bloc 7** : (a) **FluBot Android + BEC commune** (smishing → mobile compromis → exfiltration contacts → BEC ciblé sur secrétaire communale), (b) **Douane frontière laptop chiffré** (LD art. 100, LMAD, art. 31 Cst, refus mot de passe), (c) **Harcèlement portail anonyme cantonal** (DSA art. 16, mesures superprovisionnelles 261 CPC, plainte art. 173-174 CP), (d) **IA générative faux titres** (art. 251 CP applicable malgré rédaction IA, expertise EPFL stylométrique), (e) **IoT camera compromise** (Reolink + 47 connexions étrangères, art. 179quater vs. 143bis+144bis CP).

**Note de sélection** : 2 scènes initialement proposées (`ia-medicale-genome`, `intrusion-stable`) n'existent pas dans le corpus. Remplacées par `ia-generative-faux-titres` (IA générative + faux titres) et `iot-camera-compromise` (IoT caméra Reolink) — thématiques distinctes mais cohérentes avec la diversification recherchée.

### Pas de nouveau PNJ

Troisième release consécutive (après v2.32 et v2.34) sans création de PNJ. Confirmation que le catalogue de 30 PNJ avec 8 transposables est désormais à pleine maturité pour le retrofit.

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 48 scènes touchées par v2.24 → v2.35 (était 43). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v68 → v69

Header v2.35 documentant le retrofit bloc 7. Pas de nouveau PNJ.

### Statistiques v2.35

| Indicateur | v2.34 | v2.35 |
|---|---|---|
| Scènes totales | 110 | **110** (inchangé) |
| Scènes avec NPCs assignés | 38 | **43** (+5) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 38 | **43** (+5) |
| PNJ catalogue | 30 | **30** (inchangé) |
| PNJ transposables (multi-scènes) | 8 | 8 (inchangé) |
| Cantons couverts | 14/26 | 14/26 (inchangé) |
| Service Worker | v68 | **v69** |

### Notes éditoriales

**Sur la scène `flubot-bec-cascade`.** Scène medium documentée par les attaques FluBot réelles 2021-2024 sur les communes suisses. Le scénario modélise une **chaîne d'attaque complète** rarement observée dans une seule scène : SMS Flubot → Android compromis → exfiltration contacts/SMS → BEC ciblé sur secrétaire communale → virement 47'800 CHF vers compte hongrois. Le marqueur souligne la doctrine ATF 6B_383/2019 sur l'erreur excusable face à des SMS spoofés sophistiqués — la sanction individuelle décrédibilise la fonction publique et démotive les déclarations futures de communes victimes.

**Sur la scène `frontieres`.** Scène medium qui explore les **limites des pouvoirs douaniers** face à un voyageur refusant de donner son mot de passe d'ordinateur. Le scénario est documenté par plusieurs cas réels suisses 2018-2024 (notamment les voyageurs en provenance de Russie / Chine). Le marqueur souligne que les pouvoirs LD/LMAD ne couvrent PAS l'obligation de déchiffrer un appareil chiffré sans mandat MP — la fouille forcée serait invalidée par le TAF et l'incident transformé en cause célèbre médiatique sur la souveraineté numérique.

**Sur la scène `harcelement-ne`.** Scène easy mais très subtile car elle articule **trois cadres juridiques distincts** : DSA européen (notification art. 16 aux plateformes), procédure civile (mesures superprovisionnelles 261 CPC ex parte), procédure pénale (art. 173-174 CP, art. 198 CP). Le marqueur souligne le piège majeur d'un Portail Anonyme cantonal : publier des signalements anonymes non vérifiés viole simultanément la nLPD, la présomption d'innocence (CEDH Allenet de Ribemont 1995), et le devoir de diligence cantonal. Le portail doit être conçu comme outil de signalement à PISTES vérifiées par enquêteurs, pas comme outil de publication directe.

**Sur la scène `ia-generative-faux-titres`.** Scène hard très d'actualité 2025-2026. Le scénario modélise un **dossier précurseur** sur l'IA générative en droit pénal suisse : M. V. consultant a fabriqué intégralement par IA son CV, ses lettres de recommandation, ses contrats de travail antérieurs, ses certificats de formation. Question juridique centrale : **l'art. 251 CP (faux dans les titres) s'applique-t-il à des documents IA-générés** ? La doctrine moderne (Dupont-Lassalle, Revue pénale suisse 2024 + Niggli/Heimgartner Strafrecht II 2025) répond OUI — le faux ne dépend pas du moyen de fabrication mais du caractère mensonger. Le marqueur souligne la disproportion d'une demande de peine plancher 5 ans (alors que art. 251 CP a un MAXIMUM de 5 ans, pas un plancher).

**Sur la scène `iot-camera-compromise`.** Scène hard sur la **double dimension d'une caméra IoT compromise** : preuve d'un cambriolage et vecteur d'une atteinte au domaine secret distincte (art. 179quater CP). Le scénario modélise une caméra Reolink chez Mme L. (67 ans, agressée lors du cambriolage) avec 47 connexions étrangères et firmware modifié. Question juridique fine : la backdoor SSH est-elle un « dispositif d'écoute » au sens art. 179quater CP, ou relève-t-elle plutôt de l'art. 143bis + 144bis CP ? Le marqueur souligne que bloquer toutes les preuves IoT au nom du « risque de manipulation » prive la victime de la principale preuve disponible — la doctrine forensique 2025 permet d'authentifier les caméras IoT compromises (timestamps NTP + métadonnées EXIF + hash + logs serveur cloud).

**Sur le rythme du retrofit.** Avec 7 blocs livrés en 7 versions (v2.29 à v2.35), 43 scènes du corpus historique sont désormais équipées de NPCs et marqueurs narratifs (sur 110 totales). La progression est de **39 % du corpus mis à niveau**. Reste **~62 scènes** à traiter (~12 blocs au rythme actuel). Le sprint vers le 100 % continue.

### Prochaines évolutions possibles

```
v2.36  Retrofit bloc 8 (5 anciennes scènes, à proposer)
       Candidates par diversification : ip_accusatrice, jura-vishing-1m,
                                         kks-deepfake, lockbit-victime,
                                         lsi-vs-lpd-timing
v2.37  Retrofit bloc 9
v2.38  Examen blanc 50q/90 min
v2.39  Heatmap canton enrichie + badges par canton
```

## [2.34] — 2026-05-03

Release de **mise à niveau du corpus**, sans nouveau scénario. **Bloc 6 du retrofit** (5 anciennes scènes adaptées) avec diversification thématique continue : opération multi-juridictions Eurojust / traite EH / vishing aînés / malware fileless / SCADA hydroélectrique. Le corpus reste à 110 scènes ; le catalogue PNJ reste à 30 personnages (réutilisation maximale des 8 transposables existants).

### Ajouté — Retrofit bloc 6 (5 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `eu-endgame-botnets` | 5 | hard | `fbi_legat_bern`, `nicolet` | step 0 #1 (catastrophe multi-juridictions) |
| `eu-traite-roumain` | 5 | hard | `fbi_legat_bern`, `nicolet` | step 0 #1 (catastrophe trauma-informed) |
| `faux-policiers` | 4 | medium | `ge_prosecutor_cyber`, `forensics_lead_zh` | step 0 #1 (catastrophe communication précoce) |
| `fileless` | 8 | hard | `forensics_lead_zh`, `ciso_logitech` | step 0 #0 (catastrophe forensique RAM) |
| `hydro-valais` | 5 | hard | `ofcs_coordinator`, `forensics_lead_zh` | step 4 #1 et #2 → 'end' explicite |

**Diversification thématique du bloc 6** : (a) **Opération Endgame botnets** (Eurojust + FR-DE-NL, sinkholes, droppers SmokeLoader/IcedID/Pikabot/BumbleBee), (b) **Réseau roumain traite EH** (DIICOT + opération Bukareszt, Convention de Varsovie art. 13 période rétablissement obligatoire 30-90 jours), (c) **Vishing aînés "faux policier"** (NE 2025, scripts WhatsApp, coursiers cash, MLAT CH-FR), (d) **Malware fileless bancaire** (Cobalt Strike T1055 MITRE ATT&CK, beaconing 60s, exfiltration .pst Outlook), (e) **SCADA hydroélectrique** (barrage Mauvoisin VS, Val de Bagnes 10'000 habitants en aval, OSP-IC énergie).

**Note de sélection** : 2 scènes initialement proposées (`fr-gendarmerie`, `gestionnaire-fortune`) n'existent pas dans le corpus. Elles ont été remplacées par `fileless` (malware fileless RAM-only) et `hydro-valais` (SCADA hydroélectrique CII) — thématiques distinctes mais cohérentes avec la diversification recherchée.

### Pas de nouveau PNJ

Cette release exploite pleinement le catalogue de 30 PNJ existant, en privilégiant la réutilisation des **8 PNJ transposables** (forensics_lead_zh, ge_prosecutor_cyber, pjf_undercover_lead, fim_genealogist, fr_prosecutor_cyber, cicr_dpo, ofs_rssi_fedch, ddps_general_counsel). Deuxième release consécutive (après v2.32) sans création de PNJ — confirmant que le catalogue atteint la masse critique nécessaire.

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 43 scènes touchées par v2.24 → v2.34 (était 38). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v67 → v68

Header v2.34 documentant le retrofit bloc 6. Pas de nouveau PNJ.

### Statistiques v2.34

| Indicateur | v2.33 | v2.34 |
|---|---|---|
| Scènes totales | 110 | **110** (inchangé) |
| Scènes avec NPCs assignés | 33 | **38** (+5) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 33 | **38** (+5) |
| Scènes avec sources presse réelles | 17 | **18** (+1 — eu-endgame-botnets phase 3 documentée) |
| PNJ catalogue | 30 | **30** (inchangé) |
| PNJ transposables (multi-scènes) | 8 | 8 (inchangé) |
| Cantons couverts | 14/26 | 14/26 (inchangé) |
| Service Worker | v67 | **v68** |

### Notes éditoriales

**Sur la scène `eu-endgame-botnets`.** Scène hard documentée par l'opération Endgame réelle (mai 2024 puis phases 2-3 en 2025), coalition multi-juridictions Eurojust contre les botnets droppers (SmokeLoader, IcedID, Pikabot, BumbleBee, TrickBot). La scène modélise les questions stratégiques d'une participation suisse à une opération coordonnée à la minute près sur 4+ pays. Le marqueur souligne le piège classique de l'unilatéralisme : avancer ou retarder les actions suisses sans coordination Eurojust détruit l'effet de surprise multi-juridictions et expose les agents/sources des autres pays.

**Sur la scène `eu-traite-roumain`.** Scène hard très difficile car elle articule procédure pénale standard et **doctrine victim-centered** (Convention de Varsovie + Directive UE 2011/36 + Loi suisse LEH). Le marqueur souligne que les 11 victimes identifiées (femmes roumaines exploitées dans des domiciles soleurois) sont d'abord des **victimes**, pas des suspectes ni des témoins à presser. La période de rétablissement obligatoire (30-90 jours, art. 13 Convention de Varsovie) est OBLIGATOIRE — elle ne peut être contournée par l'urgence procédurale. La doctrine trauma-informed exige interprètes roumanophones qualifiés, hébergement LAVI sécurisé, soins médicaux + psychologue spécialisé, et audition uniquement quand les victimes sont prêtes.

**Sur la scène `faux-policiers`.** Scène medium très d'actualité (vishing aînés en explosion en Suisse romande 2024-2026). Le scénario est documenté par le cas réel des opérations « faux policier » à Neuchâtel et Vaud avec scripts WhatsApp standardisés en plusieurs langues, coursiers payés au pourcentage venant collecter le cash chez les victimes, et organisateurs souvent basés à l'étranger (France, Pologne, Israël). Le marqueur souligne le piège classique : communiquer publiquement le mode opératoire avant la coordination internationale alerte les organisateurs et fait migrer leur infrastructure téléphonique en quelques heures.

**Sur la scène `fileless`.** Scène hard à 8 steps, l'une des plus longues du corpus. Documentée par les attaques bancaires fileless de 2018-2024 (Cobalt Strike + injection mémoire T1055 MITRE ATT&CK + beaconing HTTPS + exfiltration .pst Outlook ciblée). Le marqueur initial est crucial : éteindre le système compromis efface la RAM où réside exclusivement le malware fileless — la preuve disparaît définitivement. La doctrine forensique 2025 pour fileless est : capture RAM live + isolation logique sans extinction.

**Sur la scène `hydro-valais`.** Scène hard sur infrastructure critique au sens OSP-IC (Ordonnance sur la protection des infrastructures critiques) — secteur énergie. Le scénario modélise une compromission SCADA partielle d'un barrage de classe I (Mauvoisin, Val de Bagnes, capacité utile 211.5 millions m³) où les commandes vannes sont compromises mais l'opérateur a refusé manuellement à temps. La question stratégique : maintenir le barrage en service standard ou basculer en mode dégradé local manuel ? Le marqueur souligne la doctrine OFEN/OFCS : compromission cyber avérée d'un barrage classe I = basculement obligatoire mode dégradé.

**Sur le rythme du retrofit.** Avec 6 blocs livrés en 6 versions (v2.29 à v2.34), 38 scènes du corpus historique sont désormais équipées de NPCs et marqueurs narratifs (sur 110 totales). La progression est de **35 % du corpus mis à niveau**. Reste **~67 scènes** à traiter (~13 blocs au rythme actuel). La mécanique est désormais bien rodée : les blocs sans nouveau scénario (v2.31, v2.32, v2.34) sont les plus efficaces (~2-3h éditoriales par bloc).

### Prochaines évolutions possibles

```
v2.35  Retrofit bloc 7 (5 anciennes scènes, à proposer)
       Candidats par diversification : flubot-bec-cascade, frontieres,
                                        harcelement-ne, ia-medicale-genome,
                                        intrusion-stable
v2.36  Retrofit bloc 8
v2.37  Examen blanc 50q/90 min
v2.38  Heatmap canton enrichie + badges par canton
```

## [2.33] — 2026-05-03

Cette version ajoute **1 nouveau scénario suisse inspiré d'une affaire d'État réelle** (espionnage interne au SRC via Kaspersky 2015-2020, révélée en juin 2025) et enchaîne le **bloc 5 du retrofit du corpus historique**. Le corpus passe à **110 scènes** et le catalogue PNJ à **30 personnages**.

### Ajouté — 1 nouveau scénario

#### 🕵️ `src-fonctionnaire-russe-kaspersky` (hard, BE/MPC)

| Aspect | Détail |
|---|---|
| **Source** | Affaire SRC-Kaspersky 2015-2020 révélée par SRF Investigativ en juin 2025 ; Conseil fédéral autorise enquête MPC le 30 juin 2025 (RTS, ICTjournal, 20min, swissinfo, watson). Officier en chef de l'équipe cyber SRC aurait transmis des données sensibles à Kaspersky → GRU via 3 entreprises identifiées dans le rapport interne SRC 2021 : Kaspersky, "Bleu" (Zurich, fondée par 2 Russes + 1 Suisse), "Violette" (serveurs Suisse, Tessin/Berne). 2 services alliés (NSA + BfV) ont alerté en 2020 et menacé de cesser toute coopération. Réorganisation cyber SRC en 2021 sous nouvelle direction. Enquête administrative DDPS lancée juin 2025 par Conseiller fédéral Pfister. Qualifications visées : art. 271 CP (actes interdits pour État étranger), art. 272 CP (service de renseignement politique), art. 320 CP (violation secret de fonction). |
| **Pitch** | Le Conseil fédéral vient d'autoriser le MPC à ouvrir l'enquête. 5 phases : (1) cadrage initial du périmètre, (2) coopération avec services alliés sans révéler sources/méthodes, (3) audition de M. X. avec exploration art. 14 CP (devoir professionnel), (4) audition hiérarchie SRC et doctrine de la responsabilité fonctionnelle, (5) bilan public et leçons institutionnelles via GPDel. |
| **Rôle joueur** | Procureur fédéral cyber au MPC à Berne |
| **PNJ** | `nicolet` (procureur cyber MPC, **réel**), `src_director` (directeur SRC, fictif), `ddps_general_counsel` (Mme Aebischer, fictive transposable, **nouveau v2.33**) |
| **Difficulté** | hard |
| **Steps** | (0) Cadrage périmètre + communication presse · (1) Coopération NSA/BfV via canaux NCSC-CIRT · (2) Première audition M. X. + élément subjectif · (3) Audition hiérarchie SRC (3 chefs) + extension Chef C · (4) Bilan en 4 cercles + capitalisation institutionnelle |
| **Bifurcation** | step 0 #1 (communication publique nominative + qualification "trahison" art. 267 CP + détention provisoire immédiate) → **next: 'end'** — catastrophe procédurale CEDH (Allenet de Ribemont 1995) + rupture coopération NSA/BfV/BND |
| **Pédagogie** | art. 267/271/272/320 CP, distinction trahison vs. négligence consciente, art. 86 CPP pièces classifiées, présomption innocence, doctrine de la responsabilité fonctionnelle, CRP préparée pour témoignage déclassifié au procès, art. 73 CPP secret enquête, GPDel parlementaire, bilan en 4 cercles |

**Anonymisation éditoriale** : personnes réelles transposées en M. X. (officier), M. P. (ingénieur Kaspersky Moscou), Chefs A/B/C (3 supérieurs hiérarchiques successifs 2015-2020), "Bleu" et "Violette" (les 2 entreprises russes anonymisées dans le rapport SRF). Le Conseiller fédéral Pfister est mentionné par sa fonction publique de chef du DDPS. Kaspersky et le GRU sont nommés (entités publiques connues). L'affaire est traitée comme exercice pédagogique sur la gestion d'un dossier d'espionnage interne en démocratie, pas comme une instruction pénale fictive.

### Ajouté — Retrofit bloc 5 (5 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `darkmarket_2021` | 8 | hard | `pjf_undercover_lead`, `nicolet` | step 0 #0 (perquisition mal cadrée) |
| `deepfake-audio-garde-a-vue` | 5 | hard | `forensics_lead_zh`, `ge_prosecutor_cyber` | step 4 #1 et #2 (next=-1 → 'end' explicite) |
| `delemont-forum` | 5 | easy | `ofs_rssi_fedch`, `ofcs_coordinator` | step 1 #2 (catastrophe pédagogique) |
| `eu-crypto-kidnapping` | 5 | medium | `ge_prosecutor_cyber`, `nicolet` | step 0 #1 (sous-estimation urgence) |
| `eu-cyber-trading-fraud` | 5 | medium | `forensics_lead_zh`, `nicolet` | step 0 #1 (victimisation secondaire) |

**Diversification thématique du bloc 5** : (a) **darkmarket / Europol** (perquisition Tor, BTC saisis, scellés YubiKey), (b) **deepfake audio en interrogatoire** (enlèvement enfant, expertise contradictoire), (c) **sensibilisation cyber communes** (forum JU, doctrine ENISA pour collectivités locales), (d) **enlèvement-chantage crypto** (Arc Lémanique CH-FR, urgence opérationnelle), (e) **fraude trading retraités** (cyber-trading-fraud, accueil LAVI, blockchain analytics).

### Ajouté — 1 nouveau PNJ dans `data/npcs.json` (29 → 30)

| ID | Type | Rôle | Usage |
|---|---|---|---|
| `ddps_general_counsel` | Fictif **transposable** | Mme Aebischer, conseillère juridique principale DDPS Berne | src-fonctionnaire-russe-kaspersky + scénarios sécurité nationale futurs |

Le catalogue compte maintenant **8 PNJ transposables** (sur 30 au total), ce qui réduit encore le besoin de créer de nouveaux PNJ pour les blocs futurs.

### Modifié — `js/pages/scene-app.js` (CANTON_DATA)

```diff
-  BE: { name: "Berne", scenarios: ["ruag_2016","palais_federal","deepfake-electoral"] },
+  BE: { name: "Berne", scenarios: ["ruag_2016","palais_federal","deepfake-electoral","src-fonctionnaire-russe-kaspersky"] },
```

### Modifié — `scenes/index.json`

Régénéré (109 → 110 entrées, 169.5 KB).

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 38 scènes touchées par v2.24 → v2.33 (était 32). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v66 → v67

Header v2.33 documentant le nouveau scénario SRC-Kaspersky + le retrofit bloc 5 + le nouveau PNJ.

### Statistiques v2.33

| Indicateur | v2.32 | v2.33 |
|---|---|---|
| Scènes totales | 109 | **110** (+1) |
| Scènes avec NPCs assignés | 28 | **33** (+5) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 28 | **33** (+5) |
| Scènes avec sources presse réelles | 15 | **17** (+2 — SRC-Kaspersky, comparis-2021) |
| PNJ catalogue | 29 | **30** (+1) |
| PNJ réels (publics) | 7 | 7 (inchangé) |
| PNJ fictifs | 22 | **23** (+1) |
| PNJ transposables (multi-scènes) | 7 | **8** (+1, ddps_general_counsel) |
| Cantons couverts | 14/26 | 14/26 (densification BE+1) |
| Service Worker | v66 | **v67** |

### Notes éditoriales

**Sur l'affaire SRC-Kaspersky (juin 2025).** L'affaire réelle, révélée par SRF Investigativ le 4 juin 2025 sur la base d'un rapport interne SRC de 2021 classé secret défense, documente une coopération informelle entre l'équipe cyber du SRC et trois entreprises liées à la Russie (Kaspersky + "Bleu" + "Violette") entre 2015 et 2020. L'officier en chef de l'équipe cyber aurait transmis des samples malveillants et des analyses cyber-tactiques à un ingénieur Kaspersky basé à Moscou, qui aurait servi de relais vers le GRU (renseignement militaire russe). Deux services alliés (NSA + BfV) ont alerté le SRC en 2020 et menacé de cesser toute coopération si l'officier restait en poste, ce qui a déclenché une enquête interne SRC en 2021 et une réorganisation complète de l'équipe cyber. Le 30 juin 2025, le Conseil fédéral a autorisé le MPC à ouvrir une enquête pénale formelle pour soupçon de violation du secret de fonction (art. 320 CP), service de renseignement politique (art. 272 CP), et actes exécutés sans droit pour un État étranger (art. 271 CP). Le Conseiller fédéral Pfister, à la tête du DDPS depuis mars 2025, a parallèlement lancé une enquête administrative externe pour rétablir la confiance dans le SRC.

**Pourquoi ce scénario est important pédagogiquement.** L'affaire SRC-Kaspersky illustre plusieurs questions stratégiques majeures rarement combinées dans un même dossier : (1) **l'articulation administratif/pénal** sur un dossier classifié, où les éléments DDPS doivent être déclassifiés ad hoc pour être versés à la procédure pénale (art. 86 CPP) ; (2) **la coopération internationale renseignement vs. pénal**, où les services alliés acceptent de partager des éléments d'orientation à condition qu'ils ne deviennent pas publics dans une procédure pénale suisse (séparation des cadres) ; (3) **la doctrine de la responsabilité fonctionnelle**, où la chaîne hiérarchique ne peut pas être ignorée et où le bouc émissaire individuel n'est pas une réponse pénale acceptable si la hiérarchie tolérait ou validait tacitement ; (4) **la présomption d'innocence en contexte sensible**, où la pression médiatique et politique pour communiquer publiquement les noms et les chefs d'accusation doit être résistée (jurisprudence CEDH Allenet de Ribemont 1995) ; (5) **le bilan en 4 cercles** (citoyens / parlement / exécutif / alliés), qui structure la communication post-instruction d'une manière contributive et non triomphaliste.

**Sur le rythme du retrofit.** Avec 5 blocs livrés en 5 versions (v2.29 à v2.33), 33 scènes du corpus historique sont désormais équipées de NPCs et marqueurs narratifs (sur 110 totales). La progression est de **30 % du corpus mis à niveau**. Reste **~72 scènes** à traiter (~14 blocs au rythme actuel). La mécanique est désormais bien rodée et reproductible : les 2-3 heures éditoriales par bloc se confirment, dont 30-50 % consacrées à l'étoffement des distracteurs pour passer le linter de balance.

**Sur la qualité du nouveau scénario.** Le scénario `src-fonctionnaire-russe-kaspersky` se distingue des autres scénarios « hard » par sa dimension géopolitique et institutionnelle. Il introduit le concept de **séparation des cadres** (renseignement / pénal / international) qui est central dans les dossiers d'espionnage moderne, et explore en profondeur la **doctrine de la responsabilité fonctionnelle** (Chef C validait tacitement, M. X. exécutait — qui est le plus coupable ?). Le bilan en 4 cercles est un format de communication post-instruction transposable à d'autres dossiers institutionnels sensibles.

### Prochaines évolutions possibles

```
v2.34  Retrofit bloc 6 (5 anciennes scènes, à proposer)
       Candidats par diversification : eu-endgame-botnets, eu-traite-roumain,
                                        faux-policiers, fr-gendarmerie,
                                        gestionnaire-fortune
v2.35  Retrofit bloc 7
v2.36  Examen blanc 50q/90 min
v2.37  Heatmap canton enrichie + badges par canton

Scénarios PDF candidats restants :
  • deepfake-conseiller-etat (Pierre-Yves Maillard, à anonymiser)
  • cas-ddos-ofcom-electorale-2024 (à creuser)
```

## [2.32] — 2026-05-03

Release de **mise à niveau du corpus**, sans nouveau scénario. **Bloc 4 du retrofit** (5 anciennes scènes adaptées) avec diversification thématique continue : rédaction rapport / coopération européenne EUROPOL / IoT-stalking / fraude DAB / deepfake électoral. Le corpus reste à 109 scènes ; le catalogue PNJ reste à 29 personnages (réutilisation maximale des 7 transposables existants).

### Ajouté — Retrofit bloc 4 (5 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `conclusion` | 5 | medium | `forensics_lead_zh`, `nicolet` | step 0 #0 (catastrophe rédactionnelle) |
| `coup-de-filet-europol-27-pays` | 5 | expert | `fbi_legat_bern`, `nicolet` | step 4 #1 et #2 (next=-1 → 'end' explicite) |
| `crypto-stalking-airtag-emirats` | 5 | hard | `ge_prosecutor_cyber`, `ofcs_coordinator` | step 4 #1 et #2 (next=-1 → 'end' explicite) |
| `dab-villaz` | 5 | medium | `fr_prosecutor_cyber`, `forensics_lead_zh` | step 0 #1 (catastrophe initiale enquête) |
| `deepfake-electoral` | 5 | hard | `ofcs_coordinator`, `src_director` | step 4 #1 (rupture calendrier démocratique) |

**Diversification thématique du bloc 4** : (a) **rédaction de rapport forensique** (chaque mot compte devant le tribunal, rigueur reproductibilité), (b) **coopération multilatérale EUROPOL** (27 pays simultanés, gestion fuite presse, coordination communicative), (c) **IoT-stalking transfrontalier** (AirTag, ex-conjoint aux Émirats, CEDH Opuz, art. 181 + art. 179novies CP), (d) **fraude DAB physique-cyber** (attaque au gaz, art. 224 CP, coordination CH-FR EIMP), (e) **désinformation électorale par deepfake** (J-48h votation fédérale, doctrine OFCS de la résilience démocratique, refus du report).

**Note** : la scène initialement proposée pour le bloc 4 (`deepfake-formation-rh`) n'existe pas dans le corpus actuel. Elle a été remplacée par `deepfake-electoral` (deepfake d'un Conseiller fédéral à J-48h d'une votation populaire fédérale), qui couvre une thématique similaire avec une dimension institutionnelle plus marquée.

Pour `coup-de-filet-europol-27-pays` et `crypto-stalking-airtag-emirats`, conversion des `next=-1` historiques en `next='end'` explicites pour cohérence avec le moteur v2.24+. Étoffement substantiel des distracteurs anciens trop courts pour passer le seuil de balance 30%, et raccourcissement de quelques bons choix devenus disproportionnés au fil des étoffements précédents.

### Pas de nouveau PNJ

Cette release exploite pleinement le catalogue de 29 PNJ existant, en privilégiant la réutilisation des **7 PNJ transposables** (forensics_lead_zh, ge_prosecutor_cyber, pjf_undercover_lead, fim_genealogist, fr_prosecutor_cyber, cicr_dpo, ofs_rssi_fedch). C'est la première release de retrofit qui n'ajoute aucun PNJ — signe que le catalogue commence à atteindre la masse critique nécessaire pour couvrir la plupart des scénarios cantonaux et fédéraux suisses.

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 32 scènes touchées par v2.24/v2.28/v2.29/v2.30/v2.31/v2.32 (était 27). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v65 → v66

Header v2.32 documentant le retrofit bloc 4. Pas de nouveau PNJ.

### Statistiques v2.32

| Indicateur | v2.31 | v2.32 |
|---|---|---|
| Scènes totales | 109 | **109** (inchangé) |
| Scènes avec NPCs assignés | 23 | **28** (+5) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 23 | **28** (+5) |
| Scènes avec sources presse réelles | 14 | **15** (+1 — comparis et CICR déjà comptés v2.31) |
| PNJ catalogue | 29 | **29** (inchangé) |
| PNJ transposables (multi-scènes) | 7 | 7 (inchangé) |
| Cantons couverts | 14/26 | 14/26 (inchangé) |
| Service Worker | v65 | **v66** |

### Notes éditoriales

**Sur la scène `conclusion`.** Cette scène est unique dans le corpus car elle ne traite pas d'un incident technique mais de la **rédaction du rapport forensique** post-incident. Elle est centrale pour les apprenants car la qualité du rapport conditionne la solidité du dossier au procès. Les 4 bifurcations 'end' préexistantes sont remarquables : elles modélisent les manières de tuer un dossier par un mauvais choix rédactionnel. Le marqueur ajouté souligne le principe-clé : **chaque affirmation doit être appuyée sur une preuve technique citée**, sinon le rapport sera démoli en appel. La rigueur rédactionnelle distingue les rapports tenus en appel des rapports cassés.

**Sur la scène `coup-de-filet-europol-27-pays`.** Scène expert qui modélise les tensions stratégiques d'une opération multilatérale simultanée à grande échelle (27 pays, ~234 arrestations attendues, 14 mois de préparation). Les questions clés sont la **gestion d'une fuite presse de dernière minute** (avancer / reporter / continuer), la **localisation d'un suspect en cavale** (M. C. Zurich), et la **communication post-opération** (fedpol seul / EUROPOL central). Le scénario insiste sur la doctrine de **cohérence européenne préservée + visibilité nationale équilibrée** plutôt que la dichotomie maximale ou minimale.

**Sur la scène `crypto-stalking-airtag-emirats`.** Scène hard qui explore la **limite des outils suisses face aux suspects extra-territoriaux**. M. R. (ex-conjoint, ressortissant suisse mais résidant aux Émirats) géolocalise Mme M. via un AirTag glissé dans son sac. Les questions juridiques : (a) compétence personnelle active art. 7 CP (ressortissant CH suisses), (b) coopération CH-UAE sans EIMP (pression diplomatique vs. acceptation d'impuissance), (c) demande Apple via canal LE pour historique d'appairage, (d) qualification art. 181 CP + art. 179novies CP par analogie pour traceurs IoT. Le marqueur souligne l'importance de la **doctrine CEDH Opuz v Turquie 2009** (obligation positive de protection effective des victimes de violences domestiques — c'est le suspect qu'il faut éloigner, pas la victime).

**Sur la scène `dab-villaz`.** Scène medium documentée par le cas réel des attaques au gaz contre des DAB Raiffeisen et BCF dans la Glâne fribourgeoise (2022-2024). Le retrofit insiste sur la nécessité d'une **approche multi-source cyber** (vidéosurveillance routière + bornes téléphoniques + géolocalisation + Signal Telegram) pour résoudre ces dossiers DAB qui sont restés froids quand traités uniquement par enquête classique de gendarmerie. La coordination CH-FR via EIMP (les attaquants français passant la frontière) est un autre élément central.

**Sur la scène `deepfake-electoral`.** Scène hard très d'actualité 2025-2026 (vidéo deepfake d'un Conseiller fédéral à J-48h d'une votation populaire fédérale). Les questions stratégiques : (a) résilience démocratique (refuser le report de la votation art. 34 LDP malgré la pression presse), (b) coordination cellule de crise (Chancellerie fédérale + OFCS + SRC + DDPS + DFAE), (c) communication forte du Conseil fédéral pour démentir le deepfake (vidéo authentique du conseiller en réponse), (d) demande aux plateformes (X, TikTok, WhatsApp) de retrait via art. 47 CPP, (e) attribution sans accusation publique précipitée. Le marqueur souligne la **doctrine de la résilience** plutôt que la **logique de la concession**.

**Sur le rythme du retrofit.** Avec 4 blocs livrés en 4 versions (v2.29 à v2.32), 28 scènes du corpus historique sont désormais équipées de NPCs et marqueurs narratifs (sur 109 totales). La mécanique se stabilise : la durée moyenne d'un bloc de retrofit (5 scènes) est désormais de **2-3 heures éditoriales** environ, dont 30-50% sont consacrées à l'étoffement des distracteurs pour passer le linter de balance. Reste **~77 scènes** à traiter (~15 blocs au rythme actuel).

### Prochaines évolutions possibles

```
v2.33  Retrofit bloc 5 (5 anciennes scènes, à proposer)
       Candidates par diversification : darkmarket_2021, deepfake-audio-garde-a-vue,
                                        delemont-forum, eu-crypto-kidnapping,
                                        eu-cyber-trading-fraud
v2.34  Retrofit bloc 6
v2.35  Examen blanc 50q/90 min
v2.36  Heatmap canton enrichie + badges par canton

Scénarios PDF candidats restants :
  • deepfake-conseiller-etat (Pierre-Yves Maillard, à anonymiser)
  • src-fonctionnaire-russe-kaspersky (espionnage interne)
```

## [2.31] — 2026-05-03

Release de **mise à niveau du corpus historique**, sans nouveau scénario. **Bloc 3 du retrofit** (5 anciennes scènes adaptées) avec diversification thématique maximale : diplomatie / humanitaire / santé / cloud public / ransomware. Le corpus reste à 109 scènes ; le catalogue PNJ passe à 29 personnages.

### Ajouté — Retrofit bloc 3 (5 anciennes scènes adaptées)

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `burgenstock-neutralite` | 5 | hard | `ofcs_coordinator`, `src_director` | step 4 #1 et #2 (next=-1 → 'end' explicite) |
| `cicr_2022` | 8 | hard | `cicr_dpo`, `ge_prosecutor_cyber` | step 0 #0 (catastrophe humanitaire initiale) |
| `cistec-2025-sante` | 5 | hard | `ciso_logitech`, `forensics_lead_zh` | step 4 #1 et #2 (next=-1 → 'end' explicite) |
| `cloud-aws-s3-leak` | 5 | hard | `ofs_rssi_fedch`, `ofcs_coordinator` | step 4 #1 et #2 (next=-1 → 'end' explicite) |
| `comparis_2021` | 5 | medium | `ciso_logitech`, `nicolet` | step 0 #2 (paiement rançon catastrophique) |

**Diversification thématique** : sommet diplomatique de Bürgenstock (neutralité + LMSI), incident CICR Genève janvier 2022 (515'000 personnes humanitaires exposées, doctrine 'do no harm'), éditeur logiciel hospitalier suisse (23 hôpitaux clients, art. 224bis CP), bucket S3 mal configuré chez sous-traitant fédéral (accountability art. 5 nLPD), Hive ransomware sur Comparis.ch en 2021.

Pour `burgenstock-neutralite`, `cistec-2025-sante` et `cloud-aws-s3-leak`, conversion des `next=-1` historiques en `next='end'` explicites. La scène `cicr_2022` est notable car elle compte **8 steps** (la plupart des scènes en font 5) et avait déjà 6 bifurcations 'end' préexistantes — seul un marqueur narratif initial a été ajouté.

### Ajouté — 2 nouveaux PNJ dans `data/npcs.json` (27 → 29)

| ID | Type | Rôle | Usage |
|---|---|---|---|
| `cicr_dpo` | Fictif **transposable** | Mme Tedeschi, DPO CICR Genève | cicr_2022 + scénarios humanitaires futurs |
| `ofs_rssi_fedch` | Fictif **transposable** | M. Schaller, RSSI office fédéral générique | cloud-aws-s3-leak + scénarios Confédération futurs |

Les deux PNJ sont conçus pour réutilisation transposable dans les blocs futurs : `cicr_dpo` couvre tout scénario humanitaire genevois (CICR, HCR, MSF), `ofs_rssi_fedch` couvre tout scénario de la Confédération (offices fédéraux, sous-traitants cloud, fuites administratives). Le catalogue passe à **7 PNJ transposables** (sur 29 au total), ce qui réduit le besoin de créer de nouveaux PNJ pour chaque bloc.

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 27 scènes touchées par v2.24/v2.28/v2.29/v2.30/v2.31 (était 22). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v64 → v65

Header v2.31 documentant le retrofit bloc 3 + les 2 nouveaux PNJ.

### Statistiques v2.31

| Indicateur | v2.30 | v2.31 |
|---|---|---|
| Scènes totales | 109 | **109** (inchangé) |
| Scènes avec NPCs assignés | 18 | **23** (+5) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 18 | **23** (+5) |
| Scènes avec sources presse réelles | 12 | **14** (+2 — cicr_2022, comparis_2021) |
| PNJ catalogue | 27 | **29** (+2) |
| PNJ réels (publics) | 7 | 7 (inchangé) |
| PNJ fictifs | 20 | **22** (+2) |
| PNJ transposables (multi-scènes) | 5 | **7** (+2 : cicr_dpo, ofs_rssi_fedch) |
| Cantons couverts | 14/26 | 14/26 (inchangé) |
| Service Worker | v64 | **v65** |

### Notes éditoriales

**Sur la sélection du bloc 3.** Diversification thématique délibérée pour exposer l'apprenant à 5 domaines techniques et juridiques distincts en une session : (a) **diplomatie / neutralité** (Bürgenstock + LMSI + Convention de La Haye 1907 + art. 296 CP), (b) **humanitaire / 'do no harm'** (CICR + droit international humanitaire + populations vulnérables en zones de conflit), (c) **santé / supply chain hospitalière** (Cistec + ISO 13485 + LIE + 23 hôpitaux suisses), (d) **cloud public / accountability** (OFS + AWS S3 + art. 5 nLPD + doctrine 'cloud first' Confédération 2024), (e) **ransomware / paiement rançon** (Hive + Comparis + recommandations OFCS/FBI/NCSC sur le non-paiement).

**Sur l'incident CICR de janvier 2022.** L'attaque réelle sur le programme Rétablissement des liens familiaux du CICR (515'000 personnes vulnérables exposées) reste un cas d'école dans le secteur humanitaire international. Le scénario explore les questions stratégiques que cet incident a posées : équilibre entre transparence (mission humanitaire) et discrétion (protection des bénéficiaires en zones de conflit), notification différenciée par contexte de la victime (zone sûre vs. zone à risque), attribution étatique (CICR a évité de nommer publiquement, posture compatible avec sa neutralité statutaire), refonte des infrastructures (souveraineté des données + patching + threat hunting). Le scénario CAS-IN reproduit ces dilemmes avec les outils Zoho / ADSelfService Plus identifiés dans les rapports publics post-incident.

**Sur l'incident Comparis 2021.** L'attaque Hive sur Comparis.ch en août 2021 (1M USD de rançon demandée, 20 Go exfiltrés) reste un des cas les plus visibles de ransomware suisse. Le scénario explore la décision-clé du paiement (analyse coûts/bénéfices vs. recommandations OFCS/FBI/NCSC sur le non-paiement, risques sanctions OFAC US si Hive lié à entité sanctionnée, non-garantie de non-publication même après paiement) et la coordination MELANI/OFCS de l'époque. Comparis avait à l'époque refusé le paiement, conformément à la doctrine recommandée — choix qui a été validé par la communauté cyber suisse.

**Sur le rythme de retrofit.** Avec 3 blocs livrés en 3 versions (v2.29, v2.30, v2.31), le corpus passe de 8 à 23 scènes équipées de NPCs et marqueurs narratifs en moins d'une semaine éditoriale. Reste ~82 scènes à traiter dans les blocs futurs (~16 blocs au rythme actuel). La mécanique se stabilise : (1) audit des candidates, (2) identification des bifurcations existantes, (3) assignment de NPCs (priorité aux 7 transposables existants), (4) ajout du marqueur "📍 BIFURCATION NARRATIVE" sur le distracteur catastrophique, (5) étoffement des distracteurs pour passer le seuil de balance 30%, (6) régénération de l'index et bump du SW.

### Prochaines évolutions possibles

```
v2.32  Retrofit bloc 4 (5 anciennes scènes, à proposer)
       Candidats : conclusion, coup-de-filet-europol-27-pays, crypto-stalking-airtag-emirats,
                    crypto-tinder-pig-butchering-vaud (déjà v2.28), dab-villaz...
                    À sélectionner par diversification thématique
v2.33  Retrofit bloc 5
v2.34  Examen blanc 50q/90 min
v2.35  Heatmap canton enrichie + badges par canton

Scénarios PDF candidats restants :
  • deepfake-conseiller-etat (Pierre-Yves Maillard, à anonymiser)
  • src-fonctionnaire-russe-kaspersky (espionnage interne)
```

## [2.30] — 2026-05-03

Cette version ajoute **2 nouveaux scénarios suisses inspirés de l'actualité** (Handala/Stryker NE + pédo-hunter FR) et enchaîne le **bloc 2 du retrofit du corpus historique**. Le corpus passe à **109 scènes** et le catalogue PNJ à **27 personnages**.

### Ajouté — 2 nouveaux scénarios

#### 🏥 `handala-hack-iran-rhne-stryker` (medium, NE/Marin-Épagnier)

| Aspect | Détail |
|---|---|
| **Source** | Attaque Handala/Void Manticore sur Stryker (multinationale medtech US, Fortune 300) le 11 mars 2026 via abus Microsoft Intune — wiper sur 200 000 appareils, 50 TB exfiltrés, 79 pays touchés. Sources : TechCrunch, CheckPoint Research, CyberScoop, Times of Israel, NBC News (FBI saisie du site Handala). Le scénario imagine un sous-traitant suisse fictif (Rhône-Médical SA, Neuchâtel) latéralisé via federation B2B Microsoft Intune cross-tenant depuis Stryker mère. |
| **Pitch** | PME medtech neuchâteloise (220 ETP, ISO 13485, IATF 16949) découvre logo Handala sur écrans Entra/Intune. 47 laptops + 23 mobiles wipés. Coordination avec Stryker US, FBI Legat à Berne, OFCS, PFPDT |
| **Rôle joueur** | CISO Rhône-Médical SA (Mme Pellet, fictive) |
| **PNJ** | `ciso_medsupplier_ne` (Pellet), `fbi_legat_bern` (Donovan, fictif — la doctrine FBI ne nomme pas les Legats), `ofcs_coordinator` (Tschanz) |
| **Difficulté** | medium |
| **Steps** | (0) Confinement préservant preuves · (1) Notification + coordination FBI/OFCS · (2) Caractérisation forensique + co-advisory CISA/OFCS · (3) Restauration et durcissement · (4) Capitalisation sectorielle CCEC |
| **Bifurcation** | step 0 #1 (réinitialisation Intune brutale = destruction des preuves) → **next: 'end'** |
| **Pédagogie** | APT iranien (MOIS), Microsoft Intune wiper, OAuth persistance, FIDO2 vs MFA SMS, PIM/PAM, cross-tenant federation cloisonnée, MITRE ATT&CK T1098/T1486/T1078, nLPD art. 24 (72h), Convention Budapest art. 31 (urgence), MLAT US-CH, doctrine OFCS hub coordination |

#### ⚖️ `cyber-justicier-vigilante-fr` (hard, FR/Bulle)

| Aspect | Détail |
|---|---|
| **Source** | Phénomène pédo-hunters en Suisse (article RTS « Pedo-Hunter : quand la traque dérape en violence », octobre 2025, sur "Yannick" se faisant passer pour fille de 14 ans). Jurisprudence : Sutherland v HM Advocate UKSC 32 (2020) sur la recevabilité des preuves de tiers, ATF 137 IV 33 sur les preuves recueillies par particuliers, TF 6B_572/2018 sur la tentative art. 187+22 CP avec « enfants fictifs ». Référence académique : Anna Tippett "The rise of paedophile hunters" (Sage 2024). |
| **Pitch** | Pédo-hunter amateur fribourgeois transmet à PolCant FR un dossier 800 pages incluant 18 mois de chats Snapchat/Telegram (en se faisant passer pour mineure), embuscade physique au parking de Charmey filmée, diffusion publique Telegram (8'400 vues). Question : recevabilité des preuves + qualification de M. T. (suspect) + qualification de Yannick (auteur des actes coercitifs) |
| **Rôle joueur** | Procureure adjointe MP-FR (Mme Genoud, fictive) section criminalité informatique et atteintes aux mineurs |
| **PNJ** | `fr_prosecutor_cyber` (Genoud, transposable), `ge_prosecutor_cyber` (Cottier, transposable), `src_director` (fictif, conseil stratégique) |
| **Difficulté** | hard |
| **Steps** | (0) Triage initial + protection M. T. + retrait Telegram · (1) Analyse différenciée recevabilité · (2) Décision sur Yannick et complices · (3) Décision sur M. T. + tentative art. 22 · (4) Audition parlementaire |
| **Bifurcation** | step 0 #1 (audition Yannick comme témoin + versement sans tri + arrestation brutale M. T.) → **next: 'end'** — catastrophe procédurale + risque suicide majeur |
| **Pédagogie** | art. 141 al. 2 CPP, ATF 137 IV 33, CEDH Sutherland UKSC 32 (2020), CEDH Saunders, art. 187/197/198 CP, art. 22 CP (tentative), TF 6B_572/2018 (enfants fictifs sur Internet), art. 181/183/173-174 CP qualification cyber-vigilantes, coordination SPMi (enfants suspects = victimes secondaires LAVI), audition parlementaire posture équilibrée |

### Ajouté — Retrofit bloc 2 (5 anciennes scènes adaptées)

Suite du retrofit systématique demandé par l'utilisateur. Bloc 2 livré avec diversification thématique (audit/finance/fraude/e-commerce/deepfake) :

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `audit-prestataire-systemique` | 5 | hard | `forensics_lead_zh`, `ofcs_coordinator` | step 4 #1 et #2 (next=-1 → 'end' explicite) |
| `banque-privee-mlat` | 5 | expert | `ge_prosecutor_cyber`, `compliance_bs`, `fbi_legat_bern` | step 4 #1 et #2 (next=-1 → 'end' explicite) |
| `banquier-fantome` | 5 | hard | `nicolet`, `compliance_bs` | step 3 #2 (court-circuit procédural) |
| `boutique-fantome` | 4 | medium | `forensics_lead_zh`, `nicolet` | step 0 #1 (qualification 146 vs 147 CP) |
| `clone-vocal` | 5 | medium | `ciso_logitech`, `nicolet` | step 0 #2 (catastrophe forensique audio) |

Pour `audit-prestataire-systemique` et `banque-privee-mlat`, conversion de `next=-1` (convention historique) en `next='end'` explicite, en cohérence avec les autres scènes du retrofit. Étoffement substantiel des distracteurs anciens trop courts pour passer le seuil de balance 30%.

### Ajouté — 3 nouveaux PNJ dans `data/npcs.json` (24 → 27)

| ID | Type | Rôle | Usage |
|---|---|---|---|
| `ciso_medsupplier_ne` | Fictif | Mme Pellet, CISO Rhône-Médical SA Neuchâtel | handala-stryker |
| `fbi_legat_bern` | Fictif | Special Agent Donovan, FBI Legal Attaché ambassade US Berne | handala-stryker, banque-privee-mlat |
| `fr_prosecutor_cyber` | Fictif **transposable** | Mme Genoud, procureure adjointe MP-FR cyber/mineurs | cyber-justicier-fr |

Le PNJ FBI Legat est nécessairement fictif : la doctrine du FBI ne communique pas publiquement les noms des Legats par protection des sources et des opérations. Les Legats existent réellement à Berne (un poste permanent depuis les années 1990), mais leurs noms ne sont pas du domaine public.

### Modifié — `js/pages/scene-app.js` (CANTON_DATA)

```diff
-  FR: { name: "Fribourg", scenarios: ["dab-villaz","gruyere-coop-affinage-stuxnet","hcfr-bec-transfer-deepfake"] },
+  FR: { name: "Fribourg", scenarios: ["dab-villaz","gruyere-coop-affinage-stuxnet","hcfr-bec-transfer-deepfake","cyber-justicier-vigilante-fr"] },
-  NE: { name: "Neuchâtel", scenarios: ["faux-policiers","harcelement-ne"] },
+  NE: { name: "Neuchâtel", scenarios: ["faux-policiers","harcelement-ne","handala-hack-iran-rhne-stryker"] },
```

### Modifié — `scenes/index.json`

Régénéré (107 → 109 entrées, 165 KB).

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 22 scènes touchées par v2.24/v2.28/v2.29/v2.30 (était 15). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v63 → v64

Header v2.30 documentant les 2 nouveaux scénarios + le retrofit bloc 2 + les 3 nouveaux PNJ + sources presse réelles.

### Statistiques v2.30

| Indicateur | v2.29 | v2.30 |
|---|---|---|
| Scènes totales | 107 | **109** (+2) |
| Scènes avec NPCs assignés | 13 | **18** (+5) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 13 | **18** (+5) |
| Scènes avec sources presse réelles | 10 | **12** (+2 — Handala/Stryker, RTS pédo-hunter) |
| PNJ catalogue | 24 | **27** (+3) |
| PNJ réels (publics) | 7 | 7 (inchangé) |
| PNJ fictifs | 17 | **20** (+3) |
| PNJ transposables (multi-scènes) | 4 | **5** (+1, fr_prosecutor_cyber) |
| Cantons couverts | 14/26 | 14/26 (densification NE+1, FR+1) |
| Service Worker | v63 | **v64** |

### Notes éditoriales

**Sur le scénario Handala.** L'attaque réelle sur Stryker (mars 2026, abus Microsoft Intune comme kill switch) est documentée par TechCrunch, CheckPoint, CyberScoop, Times of Israel. Le scénario inscrit cette dimension dans un cadre suisse fictif mais réaliste : Stryker possède effectivement des sites en Suisse (Selzach SO notamment) et opère avec un réseau dense de sous-traitants medtech romands. La problématique de la latéralisation cross-tenant Microsoft Intune est représentative des questions stratégiques 2026 (CISA advisory, NCSC UK guidance). Le scénario insiste sur le réflexe forensique préservant les preuves (pas de réinitialisation brutale), la coordination via OFCS comme hub, et la distinction IOCs/données personnelles dans le partage international (Convention Budapest art. 31 vs MLAT formel).

**Sur le scénario Pédo-hunter.** Le contexte Suisse romande des cyber-vigilantes anti-pédocriminalité est documenté par RTS (« Pedo-Hunter », octobre 2025) qui décrit un certain "Yannick" se faisant passer pour fille de 14 ans pour piéger des suspects. L'article RTS souligne la dérive violente et la rhétorique d'extrême droite qui caractérisent certains groupes. Le scénario est un prétexte pédagogique pour explorer **deux questions juridiques de fond** : (1) la recevabilité différenciée des preuves obtenues par tiers (jurisprudence ATF 137 IV 33 + CEDH Sutherland v UK UKSC 32 2020), distincte de la provocation policière interdite par l'art. 293 CPP, et (2) la qualification de la tentative art. 187+22 CP en cas d'« enfant fictif » (TF 6B_572/2018 et doctrine européenne BGH allemand 2014). Le scénario insiste sur la **gestion humaine** (information préventive du suspect avant arrestation pour éviter le risque suicide majeur, soutien LAVI pour la famille suspecte avec enfants mineurs comme victimes secondaires) et l'**équilibre procédural** (multi-qualification proportionnée des cyber-vigilantes pour effet dissuasif sans créer de martyrs médiatiques).

**Sur les éléments réels.** Conformément à la doctrine éditoriale CAS-IN, les références presse sont vérifiées et datées. Les personnes physiques (PDG, employés, suspects, victimes) sont fictives ou transposées. Stryker est nommé (entité publique cotée Fortune 500). Handala est nommé (groupe public revendiqué dans les médias). Le sous-traitant suisse (Rhône-Médical SA) est fictif. "Yannick" du scénario pédo-hunter est inspiré du témoignage anonymisé RTS, sans identification du suspect réel.

**Sur le retrofit bloc 2.** La diversification thématique (audit ISAE / finance MLAT / fraude bancaire / e-commerce / deepfake audio) est plus utile pédagogiquement qu'un découpage canton par canton, car elle permet à un même apprenant de toucher plusieurs domaines techniques et juridiques en une session. La mécanique reste : assigner 1-3 PNJ pertinents du catalogue (avec privilège donné aux PNJ transposables), ajouter le marqueur "📍 BIFURCATION NARRATIVE" sur le distracteur catastrophique, étoffer les distracteurs trop courts pour passer le seuil de balance 30%. ~17 blocs de 5 scènes restent à traiter dans les versions ultérieures.

**Sur la qualité des distracteurs.** Le travail d'étoffement des distracteurs anciens (50+ distracteurs réécrits cette release sur les 5 anciennes scènes) confirme la valeur du linter de balance : un distracteur trop court révèle souvent un distracteur trop pauvre pédagogiquement (juste « non, c'est pas ça » au lieu d'une posture alternative argumentée et plausible). L'étoffement améliore donc à la fois l'équilibrage statistique et la richesse pédagogique.

### Prochaines évolutions possibles

```
v2.31  Retrofit bloc 3 (5 anciennes scènes, à proposer)
       Candidats : burgenstock-neutralite, cicr_2022, cistec-2025-sante,
                    cloud-aws-s3-leak, comparis_2021
v2.32  Examen blanc 50q/90 min
v2.33  Heatmap canton enrichie + badges par canton

Scénarios PDF candidats restants :
  • deepfake-conseiller-etat (Pierre-Yves Maillard, à anonymiser)
  • src-fonctionnaire-russe-kaspersky (espionnage interne)
```

## [2.29] — 2026-05-03

Cette version ajoute **2 nouveaux scénarios suisses** (mini-natels en EPO Pöschwies + survols drones sur Swissgrid Laufenburg) et amorce le **retrofit du corpus historique** : adaptation par blocs de 5 anciennes scènes pour les aligner sur la nouvelle mouture (PNJ assignés, marqueurs de bifurcation narrative explicites). Le corpus passe à **107 scènes** et le catalogue PNJ à **24 personnages**.

### Ajouté — 2 nouveaux scénarios

#### 📱 `mini-natels-prison-pochwies` (medium, ZH/Pöschwies)

| Aspect | Détail |
|---|---|
| **Source** | Phénomène documenté : téléphones miniatures chinois (Itel-style, ~60 g, 18 CHF/pièce sur AliExpress) en EPO suisses ; rapports Kaspersky GReAT et Lookout sur firmware Necro préinstallé |
| **Pitch** | Saisie de 3 mini-natels en cellule de M. T. à Pöschwies (Regensdorf, plus grand pénitencier suisse). À l'allumage : firmware Android compromis, contact C2 Cambodge. Volet pénal individuel + volet stratégique supply chain pénitentiaire |
| **Rôle joueur** | Inspecteur·trice cyber-enquêtes PolCant ZH |
| **PNJ** | `epo_director` (Mme Wegmann, fictif), `mobile_expert_lookout` (M. Halder, fictif), `labhart` (procureur MP-ZH, **réel**) |
| **Difficulté** | medium |
| **Steps** | (0) Saisie + chaîne de garde · (1) Analyse firmware Lookout · (2) Coordination OFCS/fedpol · (3) Audit CCDJP cross-cantonal · (4) Audition parlementaire |
| **Bifurcation** | step 0 #1 (déverrouillage forcé sous coercition) → **next: 'end'** — violation art. 113 CPP (nemo tenetur), invalidation des preuves (jurisprudence TF 6B_510/2014) |
| **Pédagogie** | OPE art. 91, art. 304-307bis CP, art. 244/247 CPP, jurisprudence TF déverrouillage forcé, brouilleurs LTC art. 34, doctrine CCDJP, audit cross-cantonal, communication parlementaire |

#### 🚁 `drone-laufenburg-swissgrid-aargau` (hard, AG/Laufenburg)

| Aspect | Détail |
|---|---|
| **Source** | Phénomène documenté : survols de drones non identifiés sur infrastructures électriques européennes (RTE Bure/Cattenom 2019-2020, 50Hertz 2023, Swissgrid 2024-2025) |
| **Pitch** | 5 survols nocturnes en 11 jours sur l'étoile de Laufenburg (hub 380 kV ENTSO-E reliant FR/DE/IT/AT). Attribution difficile : activisme, espionnage industriel, opération étatique false flag |
| **Rôle joueur** | Commissaire fedpol PJF, division Cybercriminalité et CII |
| **PNJ** | `swissgrid_cirt` (M. Hauser, fictif), `ofcs_coordinator` (Mme Tschanz, fictif), `nicolet` (procureur cyber MPC, **réel**) |
| **Difficulté** | hard |
| **Steps** | (0) Coordination CII · (1) Détection multi-couches · (2) Communication 3 cercles · (3) Attribution + CRP française · (4) Capitalisation institutionnelle |
| **Bifurcation** | step 0 #1 (escalade militaire prématurée Forces aériennes) → **next: 'end'** — LAAM art. 92 disproportionné, signal stratégique catastrophique, désorganisation cellule CII |
| **Pédagogie** | art. 224bis CP (sabotage CII), LMSI art. 23, OACS art. 17, ENTSO-E coordination, opacité tactique vs. transparence démocratique, doctrine OFCS Drone-CII, false flag attribution, LAAM art. 92 |

### Ajouté — Retrofit bloc 1 (5 anciennes scènes adaptées)

L'utilisateur a demandé une démarche systématique : reprendre les anciennes scènes du corpus pour les aligner sur le format v2.24+ (PNJ assignés, marqueurs de bifurcation narrative explicites, équilibrage des longueurs de choix). Démarche par blocs de 5. **Bloc 1 livré dans cette release** :

| Scène | Steps | Difficulté | NPCs assignés | Bifurcation marquée |
|---|---|---|---|---|
| `attribution` | 8 | hard | `forensics_lead_zh`, `nicolet` | step 0 #0 → 'end' (qualification prématurée) |
| `bitlocker` | 5 | medium | `forensics_lead_zh` | step 0 #0 → 'end' (laisser fermer = perte état mémoire) |
| `adn-genealogique-cold-case` | 5 | hard | `fim_genealogist`, `forensics_lead_zh` | step 4 #1 → 'end' (position permissive maximale FGG) |
| `agent-infiltre-darknet-14-mois` | 5 | expert | `pjf_undercover_lead` | step 4 #1 → 'end' (débriefing minimaliste post-mission) |
| `bec-pme-geneve-italie` | 6 | expert | `ge_prosecutor_cyber`, `compliance_bs` | **bifurcation créée** step 3 #2 → 'end' (court-circuit EIMP via Polizia Postale Milano = art. 271 CP) |

`bec-pme-geneve-italie` était la seule scène strictement linéaire du corpus (104 autres avaient déjà des bifurcations). Une vraie bifurcation 'end' a été créée sur le distractor critical du step 3 (contact direct hors EIMP avec la Polizia Postale Milano), avec marqueur étendu expliquant la triple violation : (a) art. 271 CP (acte d'autorité étranger), (b) art. 312 CP (abus d'autorité), (c) blocage durable de l'EIMP CH↔IT pour 18-24 mois.

Pour `adn-genealogique-cold-case` et `agent-infiltre-darknet-14-mois`, conversion de la convention historique `next=-1` (équivalent à 'end' implicite si dernier step) en `next='end'` explicite pour cohérence avec le moteur v2.24+.

### Ajouté — 8 nouveaux PNJ dans `data/npcs.json` (16 → 24)

| ID | Type | Rôle | Usage |
|---|---|---|---|
| `epo_director` | Fictif | Mme Wegmann, dir. sécurité EPO Pöschwies | mini-natels |
| `mobile_expert_lookout` | Fictif | M. Halder, mobile threat intel Lookout | mini-natels |
| `swissgrid_cirt` | Fictif | M. Hauser, CIRT Swissgrid | drone-laufenburg |
| `ofcs_coordinator` | Fictif | Mme Tschanz, desk CII OFCS | drone-laufenburg |
| `forensics_lead_zh` | Fictif **transposable** | M. Bachmann, chef labo cyber-forensics PolCant ZH | attribution + bitlocker + adn |
| `ge_prosecutor_cyber` | Fictif **transposable** | Mme Cottier, procureure GE cyber | bec-pme |
| `pjf_undercover_lead` | Fictif | Mme Roesti, cheffe agents infiltrés PJF | agent-infiltre |
| `fim_genealogist` | Fictif | Mme Strebel, cheffe FGG forensique FOR-ZH | adn-genealogique |

Les 4 PNJ marqués **transposables** sont conçus génériquement pour réutilisation sur de multiples scénarios de la même thématique (forensics technique, procureure GE, etc.) dans les blocs de retrofit ultérieurs.

### Modifié — `js/pages/scene-app.js` (CANTON_DATA)

```diff
-  ZH: { name: "Zurich", scenarios: ["attribution","bitlocker","bitlocker_froid"] },
+  ZH: { name: "Zurich", scenarios: ["attribution","bitlocker","bitlocker_froid","mini-natels-prison-pochwies"] },
-  AG: { name: "Argovie", scenarios: ["operation-alice","attentat-deja-couteau-mineur"] },
+  AG: { name: "Argovie", scenarios: ["operation-alice","attentat-deja-couteau-mineur","drone-laufenburg-swissgrid-aargau"] },
```

### Modifié — `scenes/index.json`

Régénéré (105 → 107 entrées, 157 KB).

### Modifié — `scripts/check_scenes_balance.py`

Liste par défaut étendue aux 15 scènes touchées par v2.24/v2.28/v2.29 (était 8). Toutes passent le seuil de balance 30%.

### Modifié — Service Worker v62 → v63

Header v2.29 documentant les 2 nouveaux scénarios + le retrofit bloc 1 + les 8 nouveaux PNJ.

### Statistiques v2.29

| Indicateur | v2.28 | v2.29 |
|---|---|---|
| Scènes totales | 105 | **107** (+2) |
| Scènes avec NPCs assignés | 8 | **13** (+5 retrofit bloc 1) |
| Scènes avec marqueur "📍 BIFURCATION NARRATIVE" | 8 | **13** (+5) |
| Scènes strictement linéaires | 1 (bec-pme) | **0** (bifurcation créée) |
| PNJ catalogue | 16 | **24** (+8) |
| PNJ réels (publics) | 7 | 7 (inchangé) |
| PNJ fictifs | 9 | **17** (+8) |
| PNJ transposables (multi-scènes) | 0 | **4** (forensics_lead_zh, ge_prosecutor_cyber, pjf_undercover_lead, fim_genealogist) |
| Cantons couverts | 14/26 | 14/26 (densification ZH+1, AG+1) |
| Service Worker | v62 | **v63** |

### Notes éditoriales

**Sur la mécanique de retrofit.** L'audit du corpus avant v2.29 montrait que 97/105 scènes n'avaient pas de PNJ assignés (uniquement les 8 de v2.24+v2.28). En revanche, 104/105 avaient déjà des bifurcations narratives (mécanique préexistante du moteur via `next` non-séquentiel ou `'end'`). Le travail de retrofit consiste donc principalement en **deux gestes minimaux** : (1) assigner 1-3 PNJ pertinents du catalogue, (2) ajouter le marqueur "📍 BIFURCATION NARRATIVE" en préfixe du `fb` du distracteur catastrophique. Pour la seule scène strictement linéaire (`bec-pme-geneve-italie`), une vraie bifurcation a été créée. Le travail est rapide et reproductible sur les 92 scènes restantes (~18 blocs).

**Sur l'équilibrage des choix (length deviation).** Toutes les anciennes scènes du bloc 1 avaient des distracteurs significativement plus courts que le bon choix (déviations de 80-125% sur certains steps). Cette asymétrie crée un biais "longueur révélatrice" (l'étudiant devine la bonne réponse à la longueur). Les 25+ distracteurs étoffés cette release ramènent toutes les scènes sous le seuil de 30% (cible : <30% par step, <50% obligatoire). Le linter `scripts/check_scenes_balance.py` est désormais aligné avec la liste à jour.

**Sur les 8 nouveaux PNJ.** 4 sont conçus pour réutilisation transposable sur les scènes restantes du corpus (économie de catalogue). Les 4 autres sont plus spécifiques aux 2 nouveaux scénarios v2.29. Tous fictifs (les rôles institutionnels représentés sont occupés par des personnes réelles dont la doctrine n'est pas de communiquer publiquement sur leurs missions opérationnelles : direction sécurité EPO, CIRT Swissgrid, agents infiltrés PJF, etc.).

**Sur la suite du retrofit.** L'utilisateur a explicitement demandé une démarche par blocs de 5. Avec 92 scènes restantes, cela représente ~18 blocs. Les blocs ultérieurs peuvent être priorisés selon plusieurs critères : par canton (équilibrer les couverts), par thématique (cyber-forensique, BEC, terrorisme, etc.), par âge dans le corpus (les plus anciennes en priorité). Une proposition de bloc 2 sera présentée en début de prochaine session.

### Prochaines évolutions possibles

```
v2.30  Retrofit bloc 2 (5 anciennes scènes, à proposer)
v2.31  Examen blanc 50q/90 min (~4h)
v2.32  Heatmap canton enrichie + badges par canton
v2.33  Bugs corpus (Q#1482 doublon, Q#1775 6 options, 9 quasi-doublons)

Scénarios PDF candidats restants :
  • handala-hack-iran-rhne-stryker (chasseurs de têtes Iran)
  • cyber-justicier-vigilante (Marvin Ojaghi)
  • deepfake-conseiller-etat (Pierre-Yves Maillard, à anonymiser)
  • src-fonctionnaire-russe-kaspersky (espionnage interne)
```

## [2.28] — 2026-05-03

Cette version ajoute **3 nouveaux scénarios suisses** documentés sur l'actualité DFIR récente (dossier de presse 2025), portant le corpus à **105 scènes** au total. Chaque scénario est ancré sur des sources publiées et a été co-conçu pour exploiter et étendre les PNJ existants.

### Ajouté — 3 scénarios

#### 💔 `crypto-tinder-pig-butchering-vaud` (hard, VD/Morges)

| Aspect | Détail |
|---|---|
| **Source** | Enquête ICIJ « Coin Laundry » — *Bilan* 17.12.2025, *Tribune de Genève* 17.11.2025 |
| **Pitch** | Eléonore (43 ans, Morges) dépose plainte pour 208'000 CHF perdus en pig butchering : « Gili Thompson » Tinder → bdsuex.com → portefeuilles de concentration → OKX/Binance Seychelles → conglomérat Huione (Phnom Penh) |
| **Rôle joueur** | Inspecteur·trice cyber-enquêtes PolCant VD |
| **PNJ** | `eleonore` (fictif, victime), `vuilleumier` (Heptagone Genève, **réel**), `labhart` (procureur MP-ZH, référent national, **réel**) |
| **Difficulté** | hard |
| **Steps** | (0) Plainte + premières mesures · (1) Cryptotraçage Heptagone · (2) Coopération Binance/OKX · (3) Cambodge/Huione · (4) Bilan + doctrine |
| **Bifurcation** | step 1 #2 (négliger la conservation Convention de Budapest art. 29) → **next: 4** — saute le cryptotraçage et la coopération internationale, dossier mort |
| **Pédagogie** | Trauma-informed (victime traumatisée), Convention de Budapest art. 16/29, MLAT multicanal, taux de résolution 6.6% (OFS), recovery scam warning, art. 146 al. 2 CP + 305bis al. 2 CP + 260ter |

**Tone** : honnêteté sur les limites (6.6% de résolution), respect de la dignité d'Eléonore, plaidoyer pour plus de moyens fédéraux. Co-intervention Vuilleumier (Heptagone) + Labhart (MP-ZH) en mode pédagogique.

#### ⚔️ `attentat-deja-couteau-mineur` (expert, AG/Aarau)

| Aspect | Détail |
|---|---|
| **Source** | Interview Stefan Blättler dans *Blick* 12.10.2025 (140 procédures terrorisme actives au MPC) |
| **Pitch** | Le SRC alerte le MPC : suspect de 18 ans, citoyen suisse domicilié à Aarau, fréquente un canal Telegram pro-EI, source HumInt cat. A entend le projet « action au couteau dans un lieu chrétien d'ici Pâques » (9 jours). Coordination SRC-MPC-PolCant AG urgente. |
| **Rôle joueur** | Procureur·e fédéral·e cellule terrorisme MPC |
| **PNJ** | `blattler` (PG MPC, **réel**), `nicolet` (procureur cyber MPC, **réel**), `src_director` (cheffe section anti-terrorisme SRC, fictif) |
| **Difficulté** | expert |
| **Steps** | (0) Réception SRC + saisine · (1) Surveillance technique TMC · (2) Phase observation · (3) Perquisition + arrestation · (4) Communication + suite procédurale |
| **Bifurcation** | step 0 #2 (communication publique préventive prématurée) → **next: 'end'** — suspect alerté, preuves volatilisées, dossier juridiquement très affaibli |
| **Pédagogie** | LRens art. 79 (transmission SRC→MPC), CPP art. 269-280 (surveillance technique), art. 260sexies CP (actes préparatoires terrorisme), DPMin (mineur), avocat 1ère heure renforcé, cellule TIGRIS AG déradicalisation, doctrine communication crise terrorisme, séparation poursuite/déradicalisation |

**Tone** : équilibre délicat entre renseignement (LRens, sources SRC) et procédure pénale (CPP, droits de la défense), spécificité « mineur radicalisé » (DPMin + TIGRIS), doctrine PG Blättler sur la communication contrôlée. Plaidoyer pour les ressources MPC en audition parlementaire.

#### 🛡️ `logitech-clop-zero-day-supply-chain` (hard, VD/Crissier)

| Aspect | Détail |
|---|---|
| **Source** | *Le Temps* 15.11.2025 |
| **Pitch** | Logitech (HQ Lausanne) découvre un leak Clop sur le data leak site darkweb : 1.79 TB de données exfiltrées via 0-day Oracle E-Business Suite, ~218'000 personnes touchées (employés/clients/fournisseurs). Notifications PFPDT (LPD art. 24, 72h), arbitrage paiement rançon, communication multi-public (clients, presse, SEC pour société cotée), refonte supply chain. |
| **Rôle joueur** | CISO Logitech (M. Aellig, fictif) |
| **PNJ** | `ciso_logitech` (fictif), `nicolet` (procureur cyber MPC, **réel**), `pfpdt_inspector` (PFPDT, fictif) |
| **Difficulté** | hard |
| **Steps** | (0) Détection + premières heures · (1) Décision rançon · (2) Communication multi-public · (3) Investigation post-incident MITRE ATT&CK · (4) Témoignage public + leçons OFCS |
| **Bifurcation** | step 1 #2 (payer la rançon en cachant la décision au PFPDT) → **next: 4** — communication ratée, leak progressif sur le DLS, scandale médiatique, amende PFPDT |
| **Pédagogie** | LPD revisée art. 24 (notification 72h), OFCS coordination, supply chain attack, position suisse de non-paiement (cohérente avec doctrine OFCS et politique fédérale), devoir d'information SEC pour société cotée, MITRE ATT&CK Clop TTP, leçons supply chain (Oracle E-Business Suite, audit fournisseurs) |

**Tone** : tensions techniques/régulatoires/médiatiques, position de non-paiement (souvent contestée mais cohérente avec doctrine suisse), articulation triple LPD/SEC/OFCS, témoignage public final pour transformer l'incident en cas pédagogique national.

### Ajouté — 6 nouveaux PNJ dans `data/npcs.json` (10 → 16)

| ID | Type | Rôle |
|---|---|---|
| `eleonore` | Fictif | « Eléonore » (pseudonyme), 43 ans, victime pig butchering VD, composite anonymisé d'une victime documentée par ICIJ Coin Laundry |
| `vuilleumier` | **Réel** | Aurélien Vuilleumier, Heptagone Genève, spécialiste cryptotraçage (cité dans Bilan 17.12.2025) |
| `labhart` | **Réel** | Oliver Labhart, procureur MP-ZH, référent national pig butchering (cité dans TG 17.11.2025) |
| `src_director` | Fictif | Mme Müller, cheffe de section anti-terrorisme SRC (anonymisé conformément à la doctrine renseignement) |
| `ciso_logitech` | Fictif | M. Aellig, CISO Logitech (rôle fictif dans le scénario pédagogique) |
| `pfpdt_inspector` | Fictif | Mme Schöni, inspectrice PFPDT (contrepartie régulatoire) |

Chaque PNJ dispose de : `id`, `name`, `fictional` (bool), `icon`, `role`, `institution`, `shortBio` (~120 mots), `expertise` (3-5 items), `publicProfile` (pour les réels avec sources), `context` (rôle dans la scène). Cohérence stricte avec la politique éditoriale v2.26 sur la séparation fictif/réel.

### Bifurcations narratives v2.28

```
crypto-tinder-pig-butchering-vaud   step 1 #2  →  next: 4    (saut 2 steps)
attentat-deja-couteau-mineur        step 0 #2  →  next: 'end' (fin catastrophe)
logitech-clop-zero-day-supply-chain step 1 #2  →  next: 4    (saut 2 steps)
```

**Variété : 1× 'end' + 2× sauts.** Conforme à la philosophie v2.27 sur la pédagogie différenciée des bifurcations.

État global après v2.28 (toutes versions) :

```
Scène                                  Bifurcations  Type           Version
─────────────────────────────────────────────────────────────────────────────
gruyere-coop-affinage-stuxnet          1             saut 3 steps   v2.26
lugano-dpfl-mafia-finance              1             'end'          v2.27
epfl-recherche-lai-fuite-chine         1             saut 2 steps   v2.27
epfl-laboratoire-ia-medicale-chine     1             saut 3 steps   v2.27
hcfr-bec-transfer-deepfake             1             saut 1 step    v2.27
crypto-tinder-pig-butchering-vaud      1             saut 2 steps   v2.28  ← nouveau
attentat-deja-couteau-mineur           1             'end'          v2.28  ← nouveau
logitech-clop-zero-day-supply-chain    1             saut 2 steps   v2.28  ← nouveau
─────────────────────────────────────────────────────────────────────────────
TOTAL                                  8             2× end + 6× sauts
```

### Modifié — `js/pages/scene-app.js` (CANTON_DATA)

Ajout des 3 nouvelles scènes dans la heatmap canton :

```diff
   VD: { ..., "epfl-recherche-lai-fuite-chine","epfl-laboratoire-ia-medicale-chine"
+        ,"crypto-tinder-pig-butchering-vaud","logitech-clop-zero-day-supply-chain"
        ] },
-  AG: { name: "Argovie", scenarios: ["operation-alice"] },
+  AG: { name: "Argovie", scenarios: ["operation-alice","attentat-deja-couteau-mineur"] },
```

ZH inchangé (le scénario attentat est juridictionnellement fédéral MPC + canton de domicile AG, pas ZH).

### Modifié — `scenes/index.json`

Régénéré (102 → 105 entrées, 150 KB). Pipeline `scripts/build_scenes_index.py` exécuté.

### Modifié — Service Worker v61 → v62

Header v2.28 détaillant les 3 scénarios, leurs sources, leurs PNJ, et leurs bifurcations.

### Statistiques v2.28

| Indicateur | v2.27 | v2.28 |
|---|---|---|
| Scènes totales | 102 | **105** (+3) |
| Scènes avec bifurcation narrative | 5/5 v2.24 | **8** (5 v2.24 + 3 v2.28) |
| PNJ catalogue | 10 | **16** (+6) |
| PNJ réels (publics) | 5 | **7** (+2 : Vuilleumier, Labhart) |
| PNJ fictifs | 5 | **9** (+4) |
| Cantons couverts | 14/26 | 14/26 (densification VD ZH AG) |
| Service Worker | v61 | **v62** |
| Sources de presse 2025 utilisées | — | **4** (Bilan, TG, Blick, Le Temps) |

### Notes éditoriales

**Sur les sources et la véracité.** Les 3 scénarios sont strictement fondés sur des publications de presse suisse documentées (URL dans les PNJ réels). Les PNJ « réels » apparaissent dans leur rôle public officiel uniquement (Vuilleumier en expert cryptotraçage, Labhart en procureur ZH) avec sources documentées. Les PNJ « fictifs » sont composites ou anonymisations explicites (Eléonore est un pseudonyme dans la presse elle-même ; les agents SRC ne sont jamais nommés publiquement par doctrine renseignement).

**Sur la dignité des victimes.** Le scénario crypto-tinder traite avec sensibilité la situation d'Eléonore, victime traumatisée par la perte de l'héritage de son père. Les choix de l'enquêteur·trice incluent explicitement la posture trauma-informed comme bonne pratique (et inversement, l'erreur d'interroger agressivement comme distractor négatif). Les statistiques sont honnêtes (6.6% de résolution OFS pour les fraudes en ligne) sans dramatiser ni minimiser.

**Sur le scénario attentat.** Le choix d'éviter un scénario où l'attentat aurait lieu est délibéré : la pédagogie reste sur le déjouement professionnel et les pièges procéduraux, pas sur la peur. Le mineur (17 ans atteignant 18 ans en cours de scénario) est traité dans le cadre DPMin avec la chaîne complète avocat 1ère heure + représentant légal + assistant social, et le suivi de déradicalisation TIGRIS apparaît comme la spécificité suisse face aux pays plus répressifs.

**Sur Logitech.** Le scénario suit fidèlement les éléments publiés (1.79 TB, 218'000 personnes, 0-day Oracle, position non-paiement) sans extrapolation. Le CISO M. Aellig est explicitement fictif. La doctrine OFCS / position de non-paiement est présentée fidèlement (voir aussi position OFCS publique 2024-2025). Le devoir d'information SEC pour société cotée à Nasdaq est juridiquement exact.

**Limites pédagogiques assumées.** Ces scénarios ne prétendent pas remplacer la formation continue des enquêteurs PolCant ou des procureurs : ils proposent une mise en situation réaliste pour ancrer les concepts juridiques, méthodologiques et déontologiques. Les références pratiques (ICIJ, Eurojust, Manuel MPC, doctrine BfV/MI5) permettent au joueur d'aller plus loin.

### Prochaines évolutions possibles

```
v2.29  Examen blanc 50q/90 min (~4h)

v2.30  Heatmap canton enrichie (gamification J : badges par canton)

v2.31  Bugs résiduels corpus (Q#1482 doublon, Q#1775 6 options,
       9 quasi-doublons à trier)

Scénarios PDF restants (6 candidats) :
  • handala-hack-iran-rhne-stryker (chasseurs de têtes Iran)
  • cyber-justicier-vigilante (Marvin Ojaghi)
  • deepfake-conseiller-etat (Pierre-Yves Maillard, à anonymiser)
  • src-fonctionnaire-russe-kaspersky (espionnage interne)
  • mini-natels-prison-pochwies (téléphones contrebande)
  • drone-laufenburg-swissgrid (sabotage électrique)
```

## [2.27] — 2026-05-03

Cette version étend les **embranchements narratifs** initiés en v2.26 aux 4 autres scènes v2.24. Chaque scène v2.24 dispose désormais d'au moins une vraie bifurcation, avec une variété pédagogique délibérée : 1 fin anticipée catastrophe + 3 sauts de plusieurs steps.

### Ajouté — 4 nouvelles bifurcations narratives

Pattern systématique : un mauvais choix à un step précoce **change matériellement la suite du scénario** (le joueur saute plusieurs steps ou la scène s'achève). Chaque feedback contient le marqueur **« 📍 BIFURCATION NARRATIVE »** suivi de l'explication cause→effet.

| Scène | Step | Distracteur | Type | Conséquence |
|---|---|---|---|---|
| `lugano-dpfl-mafia-finance` | 1 | #2 — Forcer le code PIN iPhone | `next: 'end'` | Violation CPP art. 113 (nemo tenetur) → fruit de l'arbre empoisonné (art. 141 al. 4 CPP) → toute la procédure invalidée, F. acquitté, l'enquêteur lui-même fait l'objet d'une procédure disciplinaire. Fin immédiate du scénario. |
| `epfl-recherche-lai-fuite-chine` | 0 | #1 — Accepter 48h enquête interne Pr. Z. | `next: 3` | Pendant les 48h, Chen Wei est alerté par la rumeur dans un labo de 12 personnes, efface ses traces locales et réserve un vol Lausanne→Beijing. Le scénario saute les steps 1 (Innosuisse/PFPDT/DFAE) et 2 (qualification fine art. 273 CP), désormais impossibles avec un dossier compromis. |
| `epfl-laboratoire-ia-medicale-chine` | 0 | #2 — Réunion crise dans 4h | `next: 4` | Cascade 4h : (a) laptop Zhang Yi passe AFU→BFU, (b) Pr. Délémont alerte le suspect via WhatsApp, (c) un post-doc chinois prévient Zhang Yi par téléphone, (d) la rumeur sort sur Twitter académique. Le scénario saute 3 steps (qualification, coordination MPC/SEM/DFAE, communication) pour atterrir directement à la refonte de gouvernance. |
| `hcfr-bec-transfer-deepfake` | 2 | #2 — Confession totale émotionnelle en presse | `next: 4` | Diffuser publiquement l'audio deepfake en conférence déclenche : (a) une boucle médiatique sur l'extrait audio, (b) les attaquants déplacent les fonds vers un mixeur crypto avant que la coopération Convention de Budapest n'aboutisse, (c) le sponsor BCF retire son naming. Le scénario saute la coordination Swiss Ice Hockey (sans objet) pour aller directement aux leçons apprises. |

### Variété pédagogique

```
1× 'end'     — lugano (catastrophe procédurale immédiate)
3× sauts     — epfl-rech (2 steps), epfl-labo (3 steps), hcfr (1 step)
```

Cette variété est délibérée : un seul type de bifurcation (toujours `'end'` ou toujours un saut) deviendrait prévisible. La diversité force le joueur à anticiper différemment selon la nature du mauvais choix : violer un droit fondamental tue immédiatement le dossier (`'end'`), alors qu'un manque de réactivité conduit à un dossier dégradé sur lequel on continue (saut). C'est le reflet authentique du DFIR : certaines erreurs sont fatales, d'autres réduisent l'efficacité sans annuler la procédure.

### État après v2.27

```
Scène                                  Bifurcations  Type
─────────────────────────────────────────────────────────────────
gruyere-coop-affinage-stuxnet          1             saut 3 steps   (v2.26)
lugano-dpfl-mafia-finance              1             'end'          (v2.27)
epfl-recherche-lai-fuite-chine         1             saut 2 steps   (v2.27)
epfl-laboratoire-ia-medicale-chine     1             saut 3 steps   (v2.27)
hcfr-bec-transfer-deepfake             1             saut 1 step    (v2.27)
─────────────────────────────────────────────────────────────────
TOTAL                                  5             1× end + 4× sauts
```

Les 5 scènes v2.24 disposent toutes d'au moins une vraie embranchement.

### Aucun changement de moteur

Le moteur `scene-app.js` supportait déjà :

- `choice.next` numérique non-linéaire (saut vers n'importe quel step suivant ou précédent)
- `choice.next: 'end'` (fin anticipée du scénario, déclenche `showReport()`)
- Choix critique (`critical: true`) qui en mode Procureur termine la scène

Les bifurcations v2.27 exploitent uniquement ces mécaniques existantes — aucune ligne de code modifiée dans le moteur.

### Aucun déséquilibre introduit

Les feedbacks (`fb`) ont été allongés pour expliquer chaque bifurcation, mais les textes des choix (`text`) sont restés inchangés. Le linter `scripts/check_scenes_balance.py` confirme que **toutes les scènes v2.24 conservent un écart maximum de 26%** (cible v2.25 atteinte) :

```
✓ gruyere-coop-affinage-stuxnet          26.0%      5/5
✓ epfl-recherche-lai-fuite-chine         13.0%      5/5
✓ epfl-laboratoire-ia-medicale-chine     26.0%      5/5
✓ lugano-dpfl-mafia-finance              14.0%      5/5
✓ hcfr-bec-transfer-deepfake             23.0%      5/5
─────────────────────────────────────────────────────
  Total: ⚠ 0 warnings   ✗ 0 errors
```

### Modifié — Service Worker v60 → v61

Bump pour propager les modifications des 4 scènes au cache des clients existants. Aucun nouvel asset, aucune dépendance ajoutée.

### Statistiques v2.27

| Indicateur | v2.26 | v2.27 |
|---|---|---|
| Bifurcations narratives utilisées | 1 | **5** (+4) |
| Scènes v2.24 avec ≥1 bifurcation | 1/5 | **5/5** |
| Bifurcations type `'end'` | 0 | **1** |
| Bifurcations type saut multi-steps | 1 | **4** |
| Service Worker | v60 | **v61** |

### Notes pédagogiques

**Pourquoi varier les types de bifurcations** : si toutes les bifurcations menaient à `'end'`, le joueur apprendrait simplement à éviter quelques choix « rouges » sans comprendre les nuances. Si elles menaient toutes à des sauts, l'enjeu de certaines erreurs (violation des droits fondamentaux, par exemple) serait sous-évalué. La variété — 1 fin sur 5 — communique implicitement que **certaines erreurs sont fatales et d'autres seulement coûteuses**, ce qui correspond à la réalité du métier.

**Pourquoi ces choix précis** : chaque bifurcation a été choisie pour illustrer un piège *typique* du DFIR :

- **lugano** : forcer un suspect à révéler ses codes — tentation classique de l'urgence opérationnelle — viole le droit de ne pas s'incriminer et **invalide tout** par contamination (art. 141 al. 4).
- **epfl-recherche** : « accordons 48h pour vérifier en interne » — la pression hiérarchique de préserver la communauté académique — alerte le suspect dans une organisation à fuites prévisibles.
- **epfl-labo** : « réunissons-nous dans 4h pour décider collectivement » — l'inertie de gouvernance — détruit les preuves volatiles (AFU→BFU) et donne au suspect le temps de coordonner.
- **hcfr** : « soyons radicalement transparents » — confusion entre transparence et exhibition — détruit les leviers d'enquête et attire la tempête médiatique.

Ces 4 archétypes couvrent un large spectre des erreurs réelles documentées dans la littérature DFIR.

## [2.26] — 2026-05-03

Cette version ajoute **4 fonctionnalités de gamification** aux scènes : timer de stress (C, déjà existant — documenté), embranchements narratifs (D, exploitation du moteur existant), **personnages récurrents** (E, nouveau), et **6 nouveaux achievements** spécialités cantonales et thèmes techniques (H).

### Ajouté — Catalogue de personnages récurrents (PNJ)

Nouveau fichier `data/npcs.json` avec **10 fiches de personnages** qui peuplent les scènes CAS-IN. Distinction explicite entre :

- **2 personnalités publiques réelles** utilisées dans leur rôle officiel (sources : presse SMD) :
  - **Yves Nicolet** ⚖️ — Procureur fédéral chargé de la cybercriminalité au MPC depuis juillet 2024
  - **Stefan Blättler** 🏛 — Procureur général de la Confédération depuis 2022
  
- **8 personnages fictifs** liés à des scènes spécifiques :
  - **M. Tinguely** 🧀 — Maître affineur Gruyère AOP, coopérative de Bulle
  - **M. Bertschy** 🧀 — Directeur de la coopérative
  - **Pr. Délémont** 🔬 — Professeur EPFL, IA médicale
  - **M. Buchser** 🔐 — DPO de l'EPFL
  - **Carla Antonini** 🎯 — Substitut adjointe MP-TI Lugano
  - **Marco Bernasconi** 💼 — Compliance officer BancaStato
  - **Olivier Rotzetter** 🏒 — Président fictif HCFR (évite le nom réel)
  - **Nicolas** 🏒 — Directeur sportif HCFR (prénom fictif)

Chaque PNJ est défini avec : `name`, `fictional`, `icon`, `role`, `institution`, `shortBio`, `expertise`, `context` pédagogique, et `publicProfile` (source) pour les personnages réels.

### Ajouté — Composant `js/components/scene-npcs.js` (530 LOC)

Nouveau composant qui s'intègre au moteur de scènes existant via le hook `SceneNPCs.injectInBriefing(scene)`. Injecte un panneau **« Acteurs en présence »** dans le briefing de la scène avec :

- **Chips cliquables** pour chaque PNJ : icône, nom, rôle, badge "réel" ou "fictif"
- **Modale détaillée** au clic : avatar, bio, institution, tags d'expertise, contexte pédagogique, source publique (pour les personnes réelles), et **liste des autres scènes où le PNJ apparaît** (cliquables pour navigation rapide)
- **Tracking discret** : chaque PNJ rencontré est ajouté à `localStorage.cas_npcs_met` (Set unique d'IDs) pour alimenter l'achievement `npc_collector`
- **CSS thémé** compatible mode sombre via variables CSS, badge `fictif/réel` distinct

Le composant lit `data/npcs.json` et calcule un index inversé `npcId → [scenes]` à partir de `scenes/index.json`, mémoïsé en mémoire.

### Modifié — `scripts/build_scenes_index.py`

Le champ `npcs` (tableau d'IDs) est désormais propagé dans `scenes/index.json`. Permet à `scene-npcs.js` de calculer son index inversé sans charger toutes les scènes individuellement.

### Modifié — Les 5 scènes v2.24 enrichies

Champ `npcs` ajouté à chaque scène, pointant vers les IDs des personnages présents :

```json
"gruyere-coop-affinage-stuxnet"      → ["tinguely", "fr_director"]
"epfl-recherche-lai-fuite-chine"     → ["dpo_epfl"]
"epfl-laboratoire-ia-medicale-chine" → ["delemont"]
"lugano-dpfl-mafia-finance"          → ["mroz_ti", "compliance_bs"]
"hcfr-bec-transfer-deepfake"         → ["rotzetter", "ds_hcfr"]
```

### Ajouté — Première bifurcation narrative dans `gruyere-coop-affinage-stuxnet`

Premier exemple de **vraie embranchement** dans le corpus. Au step 1 (« Pression sanitaire et commerciale »), le distracteur 2 (« Notifier seulement l'Interprofession AOP en interne ») a désormais `next: 4` au lieu de `next: 2`. Le joueur qui choisit cette voie d'évitement **saute** l'analyse forensique (step 2) et la communication transparente (step 3) pour atterrir directement à l'audit du mois +6 avec un dossier dégradé.

Le feedback du choix explique cette bifurcation au joueur : c'est une **voie pédagogique** pour expérimenter concrètement les conséquences d'un raccourci procédural. Le moteur `scene-app.js` supportait déjà `choice.next` non-linéaire (et `'end'` pour fin anticipée) — cette version est la première à l'exploiter.

### Documenté — Timer de stress (mode Procureur)

La fonctionnalité C (« Timer de stress ») demandée existait déjà dans le moteur sous le nom **« Mode Procureur »** :

- Activable depuis le lobby des scènes via le toggle `setMode('procureur')`
- Durée par difficulté : **45s** (easy), **60s** (medium), **75s** (hard), **90s** (expert)
- Une erreur critique en mode Procureur termine la scène immédiatement
- Bonus de score si scénario complété dans les délais
- Achievements liés : `speed_demon`, `prosecutor`, `expert_clean`

Cette version documente le mode comme la réponse au besoin « timer opt-in » identifié à l'audit v2.25, sans changement de comportement.

### Ajouté — 6 nouveaux achievements (H)

```javascript
{ id: "fr_detective",   icon: "🧀",  desc: "3 scénarios fribourgeois complétés ≥80%" }
{ id: "ti_sherlock",    icon: "🇮🇹", desc: "3 scénarios tessinois complétés ≥80%" }
{ id: "vd_procureur",   icon: "⚖️",  desc: "5 scénarios vaudois complétés ≥80%" }
{ id: "apple_forensic", icon: "🍎",  desc: "3 scénarios AFU/BFU iPhone-MacBook ≥80%" }
{ id: "anti_deepfake",  icon: "🎭",  desc: "Scénario deepfake résolu à ≥90%" }
{ id: "npc_collector",  icon: "👥",  desc: "Rencontrer ≥8 PNJ différents" }
```

Métriques associées dans `getStatsSnapshot()` :

- **`canton80`** : pour chaque code canton (FR, TI, VD, etc.), nombre de scènes du canton complétées à ≥80%. Utilise `CANTON_DATA` (mis à jour avec les 5 nouvelles scènes v2.24 : FR+2, VD+2, TI+1).
- **`apple_forensic_wins`** : count de scènes EPFL labo + Lugano (qui mobilisent AFU/BFU) à ≥80%.
- **`deepfake_excellence`** : 1 si la scène HCFR deepfake est résolue à ≥90%, sinon 0.
- **`npcs_met`** : taille du Set persistant `localStorage.cas_npcs_met`, alimenté par chaque ouverture de scène.

Mirror des nouveaux badges dans `js/core/cas-in-achievements.js` pour affichage profil cohérent.

### Modifié — `CANTON_DATA` étendu

Les 5 scènes v2.24 sont désormais associées à leurs cantons respectifs. Le badge `tour_de_suisse` (1 scénario par canton) prend en compte ces nouvelles scènes. Le canton de Fribourg passe de 1 scène (`dab-villaz`) à 3 scènes (+ `gruyere-coop-affinage-stuxnet`, + `hcfr-bec-transfer-deepfake`).

### Modifié — `scene.html`

Ajout du tag `<script src="js/components/scene-npcs.js" defer></script>` avant les autres composants UI.

### Modifié — Service Worker v59 → v60

Nouveaux assets ajoutés au cache : `js/components/scene-npcs.js` et `data/npcs.json`. Bump de version pour propager les modifications scene-app.js + cas-in-achievements.js.

### Statistiques v2.26

| Indicateur | v2.25 | v2.26 |
|---|---|---|
| Achievements scènes | 30 | **36** (+6) |
| Achievements totaux (quiz+scènes+TP+fiches) | ~85 | **91** |
| PNJ référencés | 0 | **10** |
| Scènes avec PNJ | 0 | **5** |
| Bifurcations narratives utilisées | 0 | **1** (gruyere step 1) |
| Cantons FR (scènes) | 1 | **3** |
| Cantons VD (scènes) | 4 | **6** |
| Cantons TI (scènes) | 1 | **2** |
| Service Worker | v59 | **v60** |

### Notes de design

**PNJ réels vs fictifs** : la distinction explicite (`fictional: true/false`) est cruciale. Yves Nicolet et Stefan Blättler sont utilisés dans leur rôle public officiel, sources documentées (interview Le Temps 04.2026, Blick 10.2025). Tous les autres personnages sont fictifs pour préserver la liberté pédagogique sans risque de diffamation. Le nom **Hubert Waeber** (vrai président HCFG) a été remplacé par **Olivier Rotzetter** en v2.25 précisément pour cette raison ; la fiche `rotzetter` dans `npcs.json` documente ce choix.

**Bifurcation pédagogique** : la première bifurcation est volontairement subtile. Le joueur qui choisit la « voie d'évitement » au step 1 ne réalise pas immédiatement qu'il va sauter 2 steps — le feedback l'explique a posteriori. C'est exactement le type d'expérience que les pédagogues DFIR souhaitent : « les raccourcis procéduraux ont des conséquences durables ». Si l'approche fonctionne, on pourra l'étendre aux 4 autres scènes en v2.27.

**Timer opt-in** : le mode procureur existant cochait déjà toutes les cases du besoin C. Plutôt que de créer un nouveau toggle, cette version documente le pattern existant. Si une demande ultérieure émerge pour un timer **par défaut** sur hard/expert, ce serait un changement minimal dans `scene-app.js`.

## [2.25] — 2026-05-03

Cette version corrige deux types de défauts dans les 5 scènes ajoutées en v2.24 : un **biais pédagogique** (déséquilibre de longueur entre choix) et plusieurs **anomalies factuelles** (références géographiques inexistantes, noms de personnalités réelles utilisés dans des contextes sensibles).

### Corrigé — Biais pédagogique sur la longueur des choix

Avant cette version, dans les 5 scènes v2.24, **24 des 25 steps** présentaient un déséquilibre de longueur entre la bonne réponse et les distracteurs : la bonne réponse faisait systématiquement 200-450 caractères (avec sous-listes structurées en a, b, c, d), alors que les distracteurs faisaient 100-200 caractères (sans détails). Un étudiant pouvait ainsi deviner la bonne réponse sans lire les questions, simplement en choisissant le texte le plus long.

**État avant** :
- 12 steps avec écart > 50% (erreurs critiques)
- 7 steps avec écart 30-50% (warnings)
- Pire cas : `lugano-dpfl-mafia-finance` step 4 à 90% d'écart (442 chars vs 122 et 134)

**État après** :
- **0 erreur, 0 warning**
- Tous les steps avec écart ≤ 26%
- Distracteurs étoffés avec justification du raisonnement erroné (mais plausible), conditions structurées similaires à la bonne réponse, détails techniques cohérents

Les distracteurs réécrits gardent leur logique fausse mais ajoutent du contexte : justification du choix, références juridiques précises, conséquences opérationnelles. Un étudiant inexpérimenté pourrait être tenté par ces choix qui paraissent désormais aussi sérieux que la bonne réponse — ce qui est précisément l'effet pédagogique recherché.

### Corrigé — Anomalies factuelles dans 3 scènes

#### `epfl-laboratoire-ia-medicale-chine`

- **avenue Forel** (qui n'existe pas sur le campus EPFL) → **bâtiment INF (Faculté IC)**. Les bâtiments EPFL sont nommés par codes (BC, BM, INF, INM, etc.), pas par avenues.
- **Pr. Schaffner** → **Pr. Délémont**. Choix d'un nom suisse romand neutre, fictif clair, pour éviter toute confusion avec un PI réel de l'EPFL.

#### `lugano-dpfl-mafia-finance`

- **Banca Cantonale del Ticino e Italia (BCFI)** → **BancaStato Ticino**. L'acronyme BCFI prêtait à confusion avec BCF (Banque Cantonale Fribourgeoise), et la vraie banque cantonale tessinoise s'appelle officiellement *BancaStato* (Banca dello Stato del Cantone Ticino).

#### `hcfr-bec-transfer-deepfake`

- **Hubert Waeber** → **Olivier Rotzetter**. Hubert Waeber est le vrai président du HC Fribourg-Gottéron. Le scénario décrit sa voix clonée par deepfake dans une attaque BEC. Utiliser le nom réel d'une personnalité publique vivante dans une fiction d'usurpation présente un risque éthique et de diffamation, même dans un cadre éducatif. Le nom fictif **Olivier Rotzetter** reste plausible pour Fribourg (toponymie locale) tout en levant toute ambiguïté.

### Ajouté — `scripts/check_scenes_balance.py`

Nouveau script de lint qui vérifie l'équilibrage des choix dans chaque step :

```bash
python3 scripts/check_scenes_balance.py                          # toutes les scènes v2.24+
python3 scripts/check_scenes_balance.py lugano-dpfl-mafia-finance # une scène
```

Pour chaque step, le script mesure l'écart maximal de longueur entre les choix et signale :
- **WARN** si écart > 30% (à surveiller)
- **ERROR** si écart > 50% (à corriger)

Exit code 0 si aucun écart > 50%, 1 sinon. Utilisable comme pre-commit hook ou en CI.

### Modifié — Service Worker v58 → v59

Bump pour invalider le cache et propager les corrections aux clients.

### Statistiques v2.25

| Indicateur | v2.24 | v2.25 |
|---|---|---|
| Steps avec écart > 50% | 12 | **0** |
| Steps avec écart 30-50% | 7 | **0** |
| Anomalies factuelles | 4 | **0** |
| Scènes équilibrées (5/5 steps) | 0/5 | **5/5** |
| Scripts de lint | 0 | **1** (check_scenes_balance) |
| Service Worker | v58 | **v59** |

### Notes pédagogiques

Le biais "longueur révélatrice" est un classique des QCM mal calibrés. Détecté par hasard en revoyant les scènes v2.24, ce bug rendait les scénarios trop faciles : un étudiant pouvait obtenir 25/25 simplement en choisissant systématiquement le texte le plus long. La correction préserve le détail pédagogique du bon choix tout en élevant le niveau d'élaboration des distracteurs.

Sur le plan factuel, les corrections renforcent la **crédibilité** des scénarios : utiliser de vraies institutions (BancaStato, EPFL bâtiment INF) tout en évitant les **noms réels de personnalités vivantes** dans des contextes potentiellement diffamatoires (deepfake d'usurpation, espionnage).

## [2.24] — 2026-05-03

Cette version ajoute **5 nouvelles scènes suisses** (focus Fribourg + hockey) et une **fonctionnalité majeure de mode lecture continue** entre fiches.

### Ajouté — 5 nouvelles scènes suisses (97 → 102)

#### `gruyere-coop-affinage-stuxnet` 🧀 — *Sabotage IIoT en pays fribourgeois*

```
Lieu       : Coopérative laitière de Bulle (FR)
Difficulté : hard
Atmosphère : industriel
Tags       : MODBUS, IIoT, SABOTAGE, INFRASTRUCTURE CRITIQUE,
             AOP, FRIBOURG, ENTRAIDE FR-CH
```

Un employé licencié 3 mois plus tôt a laissé une "bombe logique" dans le système de pilotage des cuves d'affinage du Gruyère AOP. Sondes de température altérées de ±0.3°C, 6 mois de production en jeu (4M CHF). VPN encore actif post-licenciement (faute RH), connexions depuis Annecy. Articles 144bis CP (détérioration de données), 143 CP, 162 CP. Coordination Schengen / CCPD / IPI pour l'AOP.

#### `epfl-recherche-lai-fuite-chine` 🎓 — *Espionnage IA, focus DPO*

```
Lieu       : EPFL — bureau du DPO, bâtiment BC (Lausanne)
Difficulté : expert
Atmosphère : académique
Tags       : IA, ESPIONNAGE, VAUD, DROIT PÉNAL, LPD, ENTRAIDE, RECHERCHE
```

Un doctorant chinois a exfiltré 18 mois de code source d'un modèle d'IA médicale (financé par Innosuisse 2.4M CHF). Vous êtes le DPO. Tension liberté académique (LERI) vs secret commercial, EIMP face à la Chine (pas de MLAT), pression DFAE, art. 162 CP, LPD revisée art. 24.

#### `epfl-laboratoire-ia-medicale-chine` 🔬 — *Espionnage IA, focus laboratoire (bonus)*

```
Lieu       : EPFL — labo Pr. Schaffner, avenue Forel
Difficulté : expert
Atmosphère : académique
Tags       : FORENSIQUE, IA, ESPIONNAGE, VAUD, EIMP, LPD, CRYPTO, GOUVERNANCE
```

Variante du même thème, focalisée sur la **réponse opérationnelle** côté laboratoire : préservation immédiate des preuves, choc et premières décisions critiques, refonte de la gouvernance recherche EPFL. Complémentaire du scénario DPO.

#### `lugano-dpfl-mafia-finance` 💰 — *Blanchiment 'ndrangheta*

```
Lieu       : Lugano (TI)
Difficulté : hard
Atmosphère : feutré
Tags       : LBA, MROS, BLANCHIMENT, NDRANGHETA, ENTRAIDE IT-CH,
             SECRET BANCAIRE, TESSIN
```

28M CHF entre Lugano-Milan-Malte pour un client italien fiché anti-mafia. Tension LBA art. 9 (signalement) vs art. 47 LB (secret bancaire). Coopération avec la DDA italienne. Saisie de devices, chiffrement T2/Secure Enclave. Art. 305bis CP (blanchiment aggravé), art. 271 CP face aux carabinieri.

#### `hcfr-bec-transfer-deepfake` 🏒 — *Deepfake hockey + BEC*

```
Lieu       : HC Fribourg-Gottéron — administration BCF Arena
Difficulté : hard
Atmosphère : tension sportive
Tags       : BEC, DEEPFAKE, VOIX CLONÉE, CRYPTO, BUDAPEST,
             NATIONAL LEAGUE, FRIBOURG, MROS
```

Mardi 14 janvier 23h47, en pleine fenêtre de transferts National League. Le DS reçoit un appel "urgent" du président — voix clonée à partir des conférences de presse YouTube. 380'000 CHF virés à un faux agent suédois, fonds en Estonie → Hong Kong → crypto-mixeur. Conférence de presse improvisée à 11h, match CHL contre Tampere à 19h45. Convention Budapest (entraide cybercriminalité avec Estonie ✓), pas de MLAT directe avec Hong Kong, art. 146 / 143bis / 251 CP.

### Ajouté — Mode "lecture continue" entre fiches

Nouvelle fonctionnalité qui transforme les **109 fiches isolées** en un **parcours pédagogique guidé**. En bas de chaque fiche, un bandeau apparaît avec :

- **Navigation linéaire** : boutons "Précédent" et "Suivant" entre fiches de la même catégorie (ordre alphabétique du titre)
- **Indicateur de progression** : "Acquisition · Fiche 3/24 · 12/24 lues (50%)"
- **Barre de progression visuelle** dans la couleur du thème
- **Section "Fiches connexes"** : top 4 fiches les plus proches (calcul Jaccard sur les questions partagées)
- **Marqueur "Thème terminé ✓"** avec lien vers l'index quand on atteint la dernière fiche d'une catégorie

Persistence dans `localStorage` (clé `fiche-reader.read`) : une fiche est marquée comme "lue" après **90 secondes** sur la page (suffisant pour ne pas compter un coup d'œil rapide). L'indicateur de progression se met à jour automatiquement.

#### Nouveau — `js/components/fiche-reader.js` (382 LOC)

Composant autonome qui :

1. Lit l'URL pour identifier la fiche courante
2. Charge le graphe `data/fiche-graph.json`
3. Trouve le voisinage prev/next dans la même catégorie
4. Construit le HTML du bandeau et l'injecte avant le footer (ou avant `#back-top`)
5. Inclut son CSS thémé (compatible mode sombre via variables `--cyan`, `--green`, `--text`, `--surface`, etc.)
6. Marque la fiche comme lue après 90s
7. Expose `window.FicheReader` pour debug

Aucune dépendance externe. ~6 KB minifié inline.

#### Nouveau — `data/fiche-graph.json` (128 KB)

Pré-calculé par `scripts/build_fiche_graph.py`. Structure :

```json
{
  "categories": {
    "acquisition": { "icon": "📥", "title": "Acquisition", "fiches": [...] },
    "windows":     { "icon": "🪟", "title": "Windows", "fiches": [...] },
    ...
  },
  "fiches": {
    "acquisition.html": {
      "category": "acquisition",
      "category_index": 0,
      "category_total": 24,
      "prev": null,
      "next": { "file": "...", "title": "...", "icon": "..." },
      "related": [
        { "file": "...", "title": "...", "shared": 18 },
        ...
      ]
    },
    ...
  }
}
```

**Stats** : 9 catégories couvrent 109 fiches. **98/109 fiches** ont ≥1 fiche connexe (les 11 isolées sont dans la catégorie "droit" qui partage peu de questions avec le reste).

#### Nouveau — `scripts/build_fiche_graph.py` (170 LOC)

Construit `data/fiche-graph.json` à partir de :
- `data/manifest.json` (catégories + métadonnées des fiches)
- `data/cross-links.json` (questions associées à chaque fiche)

Algorithme :
1. **Grouper** les fiches par catégorie
2. **Trier** chaque catégorie par titre alphabétique
3. **Calculer prev/next** pour chaque fiche dans sa catégorie
4. **Calculer related** : top 5 fiches par similarité Jaccard sur les questions communes (seuil minimum 5 questions partagées)

Idempotent. Régénéré automatiquement par le workflow GitHub Actions à chaque modif de manifest, fiche, ou questions.

#### Nouveau — `scripts/inject_fiche_reader.py` (76 LOC)

Injecte la balise `<script src="../js/components/fiche-reader.js" defer></script>` dans les 109 fiches HTML, juste après la balise existante de `fiche-common.js` (respecte l'ordre de chargement). Idempotent.

### Modifié — Workflow GitHub Actions

Étendu de **6 → 8 étapes** :

```diff
  1. Inject fiche-related.js
  2. Migrate fiches to fiche-common.js
+ 3. Inject fiche-reader.js          [NEW]
  4. Rebuild scenes/index.json
  5. Rebuild fiches/index.html
  6. Rebuild data/search-index.json
  7. Rebuild data/cross-links.json
+ 8. Rebuild data/fiche-graph.json   [NEW]
  9. Commit & push (avec retry)
```

Trigger ajouté : modifications de `scripts/build_fiche_graph.py` ou `scripts/inject_fiche_reader.py` déclenchent aussi le pipeline.

### Modifié — Service Worker v57 → v58

Nouveaux assets ajoutés au cache :
- `./js/components/fiche-reader.js`
- `./data/fiche-graph.json`

### Statistiques v2.24

| Indicateur | v2.23 | v2.24 |
|---|---|---|
| Scènes | 97 | **102** (+5) |
| Scènes Fribourg | 1 | **3** (+2) |
| Scènes hockey | 0 | **1** |
| Fiches | 109 | 109 |
| Fiches avec mode lecture | 0 | **109** |
| Fiches avec voisinage Jaccard | 0 | **98** |
| Catégories navigables | 0 | **9** |
| Workflow étapes | 6 | **8** |
| Service Worker | v57 | **v58** |

### Notes pédagogiques

Les 5 nouvelles scènes ont été calibrées pour couvrir les **angles morts du syllabus existant** :

- **Fribourg** : passe de 1 à 3 scènes (Bulle gruyère + BCF Arena hockey + EPFL côté DPO suisse)
- **Hockey suisse** : première scène incorporant l'écosystème NL (HC Fribourg-Gottéron, sponsor BCF Banque, CHL, fenêtre de transferts IIHF)
- **IA / espionnage chinois** : double angle (DPO institutionnel + chercheur opérationnel)
- **Crime organisé italien en Suisse** : 'ndrangheta + LBA + secret bancaire tessinois (peu couvert auparavant)

Le mode lecture continue a été conçu pour transformer le contenu existant en **parcours guidé**. Avant : 109 fiches isolées qu'on lit "au hasard". Après : 9 thèmes structurés où on peut "lire de A à Z" avec progression visible.

## [2.23] — 2026-05-02

Cette version extrait un **module pilote** de `tp-engine.js` pour valider la méthodologie de split du plus gros fichier JS du repo (6786 LOC).

### Le contexte

Après le split réussi de `quiz-app.js` en v2.21 (5287 → 4718 LOC, -10.7%), le seul gros monolithe JS restant est `tp-engine.js` (6786 LOC). Mais sa structure est différente :

- **21 fonctions générateurs** `genX()` (vs 166 fonctions courtes dans quiz-app)
- **Fonctions très longues** : genRunList = 200 L, genExamen = 250 L, genHexDump = 580 L
- **Architecture déjà partiellement modulaire** : tp-data.js, tp-engine-meta.js (droit/glossaire), tp-engine-windows.js (Registry/Prefetch/LNK) existent depuis v2.13
- **Helpers partagés** : `renderHexDump` est utilisé par genHexDump, genSlackSpace, genMBR, genDirEntry

### Ajouté — `tp/tp-engine-carving.js` (247 L)

Module satellite **proof of concept** qui regroupe les exercices "carving" (signatures de fichiers) :

- `genMagic()` / `checkMagic()` — Identification par signature hexadécimale (1 fichier, 4 choix)
- `_magicNotes` — Tableau interne pour stocker les notes des choix
- `genMismatch()` / `checkMismatch()` — Détection extension trompeuse vs vraie signature (5 fichiers, 4 choix chacun)
- `buildMismatchChoices()` — Helper interne pour construire les boutons
- `_mismatchAnswered` — Flag interne

Pattern identique aux modules satellites existants : à la fin du fichier, le module **mute le dispatcher GENERATORS** pour s'enregistrer :

```javascript
if (typeof GENERATORS !== 'undefined') {
  GENERATORS.magic    = genMagic;
  GENERATORS.mismatch = genMismatch;
}
```

Les dépendances (rand, pad, escAttr, encData, decData, formatChoiceFeedback, breakStreak, incSolved, STATE, MAGIC_DB, MISMATCH_DB) restent globales dans tp-engine.js et tp-data.js (chargés avant).

### Modifié — `tp/tp-engine.js`

Réduit : **6786 → 6584 LOC** (-202 lignes, -3.0%).

Les fonctions extraites sont remplacées par un commentaire de placeholder :

```javascript
// ─── v2.23 : carving exercises (genMagic, checkMagic, genMismatch,
// buildMismatchChoices, checkMismatch, _magicNotes, _mismatchAnswered)
// extraits vers tp/tp-engine-carving.js (chargé après ce fichier).
```

Le dispatcher `GENERATORS` initial ne référence plus `genMagic` / `genMismatch` (réinjectés par le satellite). Pattern cohérent avec les commentaires existants pour glossaire/email/network/ir/droitpenal (meta) et registry/prefetch/lnk (windows).

### Modifié — `tp.html`

Ordre de chargement étendu :

```html
<script src="tp/tp-data.js"></script>
<script src="tp/tp-engine.js"></script>
<script src="tp/tp-engine-carving.js"></script>   <!-- NEW -->
<script src="tp/tp-engine-windows.js"></script>
<script src="tp/tp-engine-meta.js"></script>
```

### Modifié — Service Worker v56 → v57

`./tp/tp-engine-carving.js` ajouté au cache.

### Validation

Test fonctionnel via Node + vm sandbox (simule le scope global navigateur après concaténation des scripts) :

```
═══ GENERATORS dispatcher après chargement complet ═══
  Total générateurs : 27 (avant : 27)
  ✓ GENERATORS.endian       : function
  ✓ GENERATORS.timestamp    : function
  ✓ GENERATORS.magic        : function   ← réinjecté par satellite
  ✓ GENERATORS.mismatch     : function   ← réinjecté par satellite
  ✓ GENERATORS.runlist      : function
  ✓ GENERATORS.effacement   : function
  ✓ GENERATORS.registry     : function   (depuis tp-engine-windows.js)
  ✓ GENERATORS.glossaire    : function   (depuis tp-engine-meta.js)
  ✓ GENERATORS.direntry     : function
```

Aucune régression. Tous les 27 générateurs sont présents et fonctionnels.

### Note méthodologique

Le split de `tp-engine.js` est **techniquement faisable** (même pattern que quiz-app v2.21), mais le ROI est **plus faible** que pour quiz-app :

- quiz-app : 569 L extraites en 5 modules → -10.7 %
- tp-engine (estimation pour 4 modules de plus) : ~3000 L extractibles → -45 %

Mais à efficacité par heure de travail :
- quiz-app : ~100 L isolables / heure
- tp-engine : ~50 L isolables / heure (fonctions plus longues, plus couplées)

Pour cette session, on **consolide ici** avec un module pilote qui prouve la méthodologie. Si on veut continuer plus tard, on aura une base saine.

### Statistiques v2.23

| Indicateur | v2.22 | v2.23 |
|---|---|---|
| `tp-engine.js` LOC | 6786 | **6584** (-202, -3.0%) |
| Modules tp/ | 4 | **5** (data + engine + carving + windows + meta) |
| Total LOC tp/ | 7766 | **7811** (+45 dû au header du nouveau module) |
| Service Worker | v56 | **v57** |
| Générateurs total | 27 | **27** (inchangé) |

## [2.22] — 2026-05-02

Cette version **fusionne `quiz-ui-patch.js` dans `quiz-app.js`**, éliminant le pattern "wrapper après coup" qui datait de v2.13.

### Le problème

`quiz-ui-patch.js` (663 LOC) était chargé **après** `quiz-app.js` et modifiait son comportement via 12 wrappers du type :

```javascript
const _origShowToast = window.showToast;
if (typeof _origShowToast === 'function') {
  window.showToast = function (id, msg, duration) {
    // … nouveau comportement, parfois appelle _origShowToast.apply()
  };
}
```

Problèmes accumulés :
- **Timing fragile** : si `quiz-app.js` n'avait pas fini de charger ses fonctions au moment où le patch tournait, certains wrappers ne s'appliquaient pas
- **Double-bind potentiel** : si le patch était inclus deux fois (cache browser, hot reload), les wrappers s'empilaient
- **Fuite de scope global** : le "Groupe D" du patch était par erreur **hors de l'IIFE** (ligne 366 fermait l'IIFE prématurément), exposant `EMPTY_STATES`, `MODE_LABELS`, etc. dans le scope global — bug latent
- **Difficile à debugger** : pour comprendre `showToast`, il fallait lire 2 fichiers
- **Wrapper indirect** : les call-sites appelaient `window.showToast(...)` qui appelait `notify(...)` qui appelait `drainNotifyQueue()` — 3 sauts pour 1 toast

### Solution : merge in-place + rationalisation

Au lieu de garder le pattern wrapper, le code du patch a été **mergé directement** dans `quiz-app.js`, soit en modifiant les fonctions d'origine, soit en ajoutant les nouvelles fonctions au même endroit.

### Fonctions modifiées en place dans `quiz-app.js`

| Fonction | Avant (wrapper) | Après (in-place) |
|---|---|---|
| `showToast` | wrapper inférait type/icon depuis le message → notify | corps réécrit pour router directement vers `notify()` |
| `showRankUp` | wrapper appelait l'origine + notify | corps modifié : toast DOM legacy + notify unifié |
| `showAchievementPopup` | pareil | popup DOM + notify unifié |
| `useStreakFreeze` | wrapper ajoutait animation glaçon après | animation intégrée dans la fonction |
| `getNext` | wrapper appelait l'origine + showCardEmpty | corps modifié : retourne `null` + showCardEmpty pour états vides (au lieu du fallback `ALL_Q[0]` qui masquait le bug) |
| `toggleBookmark` | wrapper ajoutait animation pop + spawnStarBurst | animations intégrées dans la fonction |
| `toggleFocusMode` | wrapper ajoutait sync label menu Plus | sync intégré dans la fonction |

`toggleSound` (dans `quiz-effects.js`) reçoit un hook optionnel `window.syncSoundLabel()` qui n'est appelé que s'il est défini — découplage propre.

### Fonctions ajoutées à `quiz-app.js` (ex-patch)

Toute la nouvelle logique du patch déplacée dans une **section v2.22 dédiée** à la fin du fichier :

- **Système notify** : `notify()`, `drainNotifyQueue()`, file d'attente avec `_notifyQueue`, `_notifyActive`, `_notifyTimer`. 1 seule notif visible à la fois.
- **États vides** : `EMPTY_STATES` (favoris, erreurs, sm2, no-filter), `showCardEmpty()`, `hideCardEmpty()`
- **Pastille mode** : `MODE_LABELS`, `refreshActiveModePill()`
- **Effets visuels** : `setupComboHalo()` (MutationObserver sur `.combo-active`), `spawnStarBurst()` (particules étoile)
- **Action-row guard** : `setupActionRowGuard()` (MutationObserver pour transformer `display:none` en `disabled`)
- **Sound label sync** : `syncSoundLabel()` (reconstruit les `<span>` du menu Plus si écrasés par textContent)
- **Daily banner dismiss** : `dismissDailyBanner()`, `_hideDailyBannerIfDismissed()` avec persistance localStorage
- **Menu Plus** : `toggleMoreMenu()`, `closeMoreMenu()`
- **setMode** : nouvelle fonction (n'existait pas dans quiz-app.js avant) — bascule normal/smart/bookmarks/errors/survival avec reset state, reconstruction pool, toast d'annonce, refresh pastille
- **triggerBoss** : nouvelle fonction — lance un boss sur un chapitre éligible (≥20 bonnes réponses, ≥5 questions hard, pas encore battu)

### Boot unifié

Avant : 5 IIFEs séparées dans le patch + 2 setup boot dispersés. Après : un **unique** `(function _initUIPatches() { ... })()` à la fin de quiz-app.js qui fait :

1. `setupActionRowGuard()`, `setupComboHalo()`, `syncSoundLabel()`, `refreshActiveModePill()`, `_hideDailyBannerIfDismissed()` au DOMContentLoaded
2. Re-sync `syncSoundLabel` après `load` (au cas où quiz-app a écrasé le textContent)
3. Click extérieur → ferme more-menu (délégation)
4. Click sur item de more-menu → ferme (délégation)
5. **Backdrop click** → ferme overlay topmost (au lieu d'un handler par overlay)
6. **Escape global** → ferme overlay topmost (capture phase, priorité aux dropdowns en l'absence d'overlay)
7. Click sur `[data-mode-target]` → refresh pastille

### Bug corrigé en passant : `getNext` retournait toujours une question

Avant v2.22 :
```javascript
return S.pool[S.pi++] || { q: ALL_Q[0], idx: 0 };  // fallback masque l'état vide
```

Le wrapper du patch attendait que `getNext` puisse retourner null/undefined pour afficher l'état vide, mais le fallback `|| ALL_Q[0]` empêchait ce signal. **L'état vide ne s'affichait jamais** en mode bookmarks/errors/sm2/no-filter !

Après v2.22 :
```javascript
const next = S.pool[S.pi++];
if (!next) {
  // Détermine la clé d'état vide selon S.mode et S.activeT/activeC
  // → showCardEmpty(key) + return null
}
```

### Modifié — `quiz.html`

```diff
- <script src="js/pages/quiz-ui-patch.js" defer></script>
```

Une ligne en moins. 1 fichier en moins à charger.

### Modifié — Service Worker v55 → v56

`./js/pages/quiz-ui-patch.js` retiré du cache. En-tête détaillé.

### Modifié — `tests/test-achievements-sync.js`

Le test cherchait `ACHIEVEMENTS` dans `quiz-app.js`, mais cette constante a été migrée vers `quiz-data.js` en v2.21. Test corrigé pour pointer la bonne source. Test passe : ✅ 41 achievements synchronisés, 14 abréviations tolérées.

### Statistiques v2.22

| Indicateur | v2.21 | v2.22 |
|---|---|---|
| `quiz-app.js` LOC | 4718 | **5268** (+550, intégration patch) |
| `quiz-ui-patch.js` LOC | 663 | **0** (supprimé) |
| Total quiz core | 5381 | **5268** (-113 net) |
| Wrappers de fonctions | 12 | **0** |
| Fichiers JS chargés par quiz.html | 8 | **7** |
| Fuites IIFE Groupe D | oui (latent) | **non** (corrigée) |
| Bug état vide | présent | **corrigé** |
| Service Worker | v55 | **v56** |

### Notes

Le merge était listé comme "~3h, double-bind à risque" dans la roadmap. Réalisé en **1 session** sans régression — la rétrocompat `window.*` mise en place en v2.21 a payé : les 57 fonctions onclick HTML ont continué de fonctionner sans modification.

## [2.21] — 2026-05-02

Cette version est un **refactoring profond de `quiz-app.js`** (5287 → 4718 LOC, -10.7 %), avec extraction de 5 modules réutilisables et testables.

### Le problème

`quiz-app.js` accumulait depuis v2.10 :
- **5287 lignes** dans un seul fichier
- **166 fonctions** mêlées (rendu, state, audio, sharing, SM-2…)
- **Code dupliqué** avec exam-app, scene-app (logique SM-2 réimplémentée)
- **Difficile à tester** : tout dépend du DOM et du state global `S`

Mais : **57 fonctions** sont appelées depuis le HTML via `onclick="..."`, donc on ne peut pas wrapper en module ES6 ni en IIFE classique.

### Solution : modules complémentaires + globales rétrocompat

Chaque nouveau module expose un namespace `window.QuizX` propre **et** réinjecte les fonctions en globales (`window.lsGet`, `window.shuffle`, etc.) pour préserver la compatibilité avec le code existant.

### Ajouté — `js/components/quiz-utils.js` (126 L)

Helpers purs sans dépendance DOM :
- `lsGet(k, d)` / `lsSet(k, v)` : localStorage avec fallback (mode privé OK)
- `getDailyDate()` / `getDailySeed()` / `getWeekKey()` : horodatage
- `seededRng(seed)` : PRNG pour le défi quotidien (tirage reproductible)
- `shuffle(arr, rng?)` : Fisher-Yates avec/sans seed
- `sanitizeHTML(raw)` : nettoyage scripts/iframe/onX/javascript:

Tests : tous les retours validés (shuffle déterministe avec seed, lsGet roundtrip, etc.).

### Ajouté — `js/components/quiz-sm2.js` (190 L)

**Algorithme SM-2** (Wozniak 1985-1990, utilisé par Anki) **isolé du DOM** :

- `getSM2Data(idx)` / `saveSM2Data(idx, d)` : I/O par carte
- `updateSM2(idx, ok, qOverride?)` : applique la formule SM-2 et retourne le nouvel état
- `getSM2Stats()` : vue agrégée (total, dueToday, dueThisWeek, mature, learning, avgEF, longestInterval)
- `getSM2Due()` : indices des cartes dues aujourd'hui
- `resetSM2()` : purge complète (sans confirm — wrapper UX dans quiz-app)

Test Node validé : 3 réussites consécutives donnent intervals 1 → 6 → 16 jours, échec ramène EF de 2.80 à 2.26 et interval à 1. Comportement conforme à la spec SM-2.

### Ajouté — `js/components/quiz-ranks.js` (106 L)

Logique pure des rangs et combos :
- `getRank(xp)` → `{ rank, idx }`
- `getRankAtIndex(idx)` → rang ou null
- `getNextRank(xp)` → prochain rang ou null si max
- `getXpToNextRank(xp)` → XP restants
- `getComboMultiplier(streak)` → 1, 1.5, 2 ou 3

Lecture simplifiée : tout est dérivé de `xp` ou `streak`, aucun side-effect.

### Ajouté — `js/components/quiz-effects.js` (199 L)

Effets audio + visuels :
- `spawnParticles(x, y, ok)` : 18 particules (succès) ou 8 (raté) avec animation CSS
- `playSound(ok)` : Web Audio API synthétisé (pas de fichier audio) — accord montant 3 ou 4 notes selon le combo, note grave descendante en cas d'échec, dim 350→250 Hz pour skip
- `toggleSound()` : persiste `SOUND_ON` dans localStorage + sync icône `#sound-btn`
- `applyVisualTheme(id)` : default / matrix / vintage / etc.
- `ac()` : AudioContext lazy (respecte les politiques d'autoplay des navigateurs)

### Ajouté — `js/components/quiz-share.js` (138 L)

Helpers canvas génériques pour partage :
- `downloadCanvas(canvas, filename)` : crée un `<a download>` (toujours fonctionne)
- `copyCanvasToClipboard(canvas, opts)` : Clipboard API moderne avec fallback toast
- `shareCanvasNative(canvas, opts)` : `navigator.share()` si dispo, fallback download

Avant : 6 fonctions dupliquées (`downloadShareCard`, `copyShareCard`, `shareNative`, `downloadBilanCard`, `copyBilanCard`, `shareBilanCard`). Après : wrappers de 2-5 lignes appelant `QuizShare.X`.

### Modifié — `js/pages/quiz-data.js` (1562 → 1861 L)

Migration des constantes restées dans `quiz-app.js` :
- `DIFF_LABELS`, `DIFF_PTS`, `TC` (couleurs par thème)
- `ACHIEVEMENTS` (252 lignes — le plus gros)
- `STREAK_MSGS`

Cohérence avec le style existant (toutes les data statiques au même endroit).

### Modifié — `js/pages/quiz-app.js` (5287 → 4718 L)

569 lignes extraites. Toutes les fonctions extraites laissent un commentaire de placeholder pour aider la navigation future :

```javascript
// Note v2.21 : sanitizeHTML extrait vers quiz-utils.js (window.sanitizeHTML)
```

Wrapper `resetSM2` enrichi : confirm UX + reset state quiz (`S.smartCount`, `S.sm2Queue`) + toast de confirmation.

`updateSM2Badge()` ajouté après chaque `updateSM2()` (le module pur ne touche plus au DOM).

### Modifié — `quiz.html`

Ordre de chargement (5 nouveaux scripts AVANT `quiz-app.js`) :

```html
<script src="js/components/quiz-utils.js" defer></script>
<script src="js/components/quiz-sm2.js" defer></script>
<script src="js/components/quiz-ranks.js" defer></script>
<script src="js/components/quiz-effects.js" defer></script>
<script src="js/components/quiz-share.js" defer></script>
<script src="js/pages/quiz-data.js" defer></script>
<script src="js/pages/quiz-app.js" defer></script>
<script src="js/pages/quiz-ui-patch.js" defer></script>
```

### Modifié — Service Worker v54 → v55

5 nouveaux fichiers ajoutés au cache (~750 lignes au total, ~25 KB gzippés).

### Statistiques v2.21

| Indicateur | v2.20 | v2.21 |
|---|---|---|
| `quiz-app.js` LOC | 5287 | **4718** (-10.7 %) |
| Modules quiz | 1 | **6** (utils, sm2, ranks, effects, share, app) |
| Tests Node passants | 0 | **4** (utils, sm2, ranks, effects) |
| Service Worker | v54 | **v55** |
| Fonctions extractées | 0 | **17** (lsGet, lsSet, shuffle, sanitizeHTML, getDailyDate, getDailySeed, seededRng, getWeekKey, getRank, getComboMultiplier, spawnParticles, playSound, toggleSound, applyVisualTheme, getSM2Data, updateSM2, getSM2Due) |
| Constants déplacées | 0 | **6** vers quiz-data (DIFF_LABELS, DIFF_PTS, TC, ACHIEVEMENTS, STREAK_MSGS) |

### Notes

Le découpage proposé initialement (`quiz-state.js`, `quiz-pool.js`, `quiz-modes.js`, `quiz-ui.js`) **n'a pas été retenu** : 57 fonctions sont appelées depuis le HTML, et `S` (state global) est référencé dans 600+ endroits. L'extraire = retoucher trop de code.

Approche pragmatique : extraire les morceaux **isolables** (utils purs, algos mathématiques, helpers génériques) sans toucher au tissu state-driven. Risque zéro, bénéfice immédiat.

## [2.20] — 2026-05-02

Cette version cible 3 quick wins : **factorisation du code répété**, **fix de désynchronisation** entre fichiers d'index, et **complétion d'accessibilité** sur les fiches.

### Le problème — bilan d'audit

Audit complet du repo après v2.19 a révélé :
- **108 fiches** contenaient des blocs `<script>` inline avec du code dupliqué (scroll-progress, back-top, quiz-reveal, collapsibles)
- **`data/counts.json`** affichait `93 scènes` alors qu'il y en a `97` sur le disque (drift de l'index)
- **15 fiches** sans aucun `<h1>` — mauvais pour l'accessibilité (lecteurs d'écran) et le SEO (Google se fie au h1)
- **5 scènes orphelines** ajoutées récemment mais jamais enregistrées dans `scenes/index.json` (donc pas indexables par `cas-in-search.js`)

### Ajouté — `js/components/fiche-common.js` (171 L)

Module factorisé qui remplace le code dupliqué dans 109 fiches. Implémente :

- **Barre de progression de défilement** (`#scroll-progress`) : 1 IIFE avec `passive: true`
- **Bouton retour-haut** (`#back-top`) : toggle classe `.visible` au-delà de 300 px
- **Quiz révélation** (`.quiz-reveal-btn` → `.quiz-answer`) : toggle + texte du bouton
- **Sections collapsibles** (`.collapsible-header` → `.collapsible.open`)
- **Onglets génériques** (`data-tab-group`, `data-tab-btn`, `data-tab-page`) : version uniforme de toutes les variantes `showTab()` / `T(id)` qu'on trouvait dans les fiches

Conçu **idempotent** : utilise des `data-*Bound` flags pour éviter le double-bind si le script est rechargé. Compatible avec les `showTab` fiche-spécifiques préservés (architecture NTFS, etc.).

### Ajouté — `scripts/migrate_fiche_common.py`

Script qui :
1. Détecte les patterns dupliqués dans chaque fiche (regex multi-variantes : IIFE, fonctions, arrow functions)
2. Les supprime du HTML
3. Injecte `<script src="../js/components/fiche-common.js" defer></script>` au bon endroit
4. Préserve la logique fiche-spécifique (variables custom, `archDetails`, calculateurs hash, etc.)

Résultats sur le repo :
- **92 patterns retirés** sur 109 fiches
- **52 blocs `<script>` entièrement vidés** (rien d'autre que des patterns communs)
- **~54 KB économisés** (lecture-écriture HTML cumulée)
- **3 résiduels** non factorisés (variantes trop spécifiques) → idempotence préserve la cohérence

### Ajouté — `scripts/build_scenes_index.py` + fix désync

Le bug : `scenes/index.json` (consommé par `cas-in-search.js` et `scene-app.js`) était maintenu à la main. Quand on ajoutait une scène, on oubliait parfois d'updater l'index. Au moment de l'audit, il y avait :
- **5 scènes manquantes** : `audit-prestataire-systemique`, `flubot-bec-cascade`, `lsi-vs-lpd-timing`, `referent-milice-ransomware`, `valais-cascade-12-communes`
- **1 entrée fantôme** : `step-martigny-ransomware` (l'index pointait sur un fichier supprimé)

Solution : `build_scenes_index.py` régénère `scenes/index.json` depuis les fichiers individuels. Extrait : `id`, `title`, `icon`, `difficulty`, `atmosphere`, `tags`, `intro`, `alertLevel`, `stepCount`, `legalRefs`. Tri stable par id.

Conséquences :
- `scenes/index.json` : 93 → **97 entrées**
- `data/counts.json` : `scenes: 93` → **`scenes: 97`** (cohérent avec le repo)
- Le moteur de recherche full-text peut maintenant indexer les 5 scènes oubliées
- `scene.html` lazy-load les 5 scènes (avant : 404)

### Ajouté — `scripts/add_h1_to_fiches.py` + a11y

Les 15 fiches sans `<h1>` :
`autopsy`, `browser_forensique`, `comparaison_fs`, `email_forensique`, `encodage`, `ext`, `fat12`, `formats`, `incident_response`, `logs_windows`, `mac_times`, `macos-linux`, `preuve`, `suisse`, `wireshark_pcap`.

Ces fiches affichaient leur titre uniquement dans `<span class="tn-title">` (nav header) — bien visible mais **invisible aux outils d'a11y** (lecteurs d'écran annoncent le `<h1>`, pas les spans de navigation).

Solution : extraction du titre depuis `tn-title` (avec smart-casing préservant les acronymes : `NTFS`, `FAT`, `MAC`, `EXIF`, etc.) et injection d'un `<h1>` stylé identiquement aux autres fiches du repo (`font-family: var(--sans); font-size: 2rem; font-weight: 800`).

Préservation : la nav `tn-title` et le breadcrumb `bc-current` restent intacts (visuel inchangé). Idempotence : skip les fiches qui ont déjà un `<h1>`.

Résultat : **109/109 fiches ont maintenant exactement 1 `<h1>` unique** ✅. Lighthouse a11y et SEO Google bénéficient.

### Modifié — Workflow GitHub Actions étendu

`.github/workflows/sync-fiches-index.yml` orchestre désormais 6 étapes (vs 4 en v2.19) :

1. `inject_fiche_related.py` (existant)
2. **`migrate_fiche_common.py`** (NEW)
3. **`build_scenes_index.py`** (NEW)
4. `build_index.py` (existant)
5. `build_search_index.py` (existant)
6. `build_cross_links.py` (existant)

Tout reste automatique : à chaque ajout/modif de fiche ou de scène sur github.com, le bot régénère les 4 indexes (`fiches/index.html`, `scenes/index.json`, `data/search-index.json`, `data/cross-links.json`) et injecte les composants manquants. Aucune action manuelle requise.

### Modifié — Service Worker v53 → v54

- Cache version : `cas-in-v53` → `cas-in-v54`
- Nouveau fichier ajouté au cache : `js/components/fiche-common.js` (~5 KB gzippé)

### Statistiques v2.20

| Indicateur | v2.19 | v2.20 |
|---|---|---|
| Fiches | 109 | 109 |
| Fiches avec `<h1>` | 94 / 109 (86 %) | **109 / 109 (100 %)** |
| Fiches avec `fiche-common.js` | 0 | **109 / 109** |
| Scènes (counts.json) | 93 | **97** (réel) |
| `scenes/index.json` | 93 | **97** |
| Patterns inline dupliqués | ~150 | **~58** (-61 %) |
| Service Worker | v53 | **v54** |
| Étapes du workflow | 4 | **6** |

## [2.19] — 2026-05-02

Cette version livre la **navigation transverse** entre fiches, quiz, TP et scènes, ainsi que **27 questions ICS/SCADA** dédiées et un nettoyage des restes de prototype en prod.

### Le problème

Jusqu'ici, fiches, quiz, TP et scènes vivaient en silos. Une fiche NTFS ne renvoyait pas vers les questions sur NTFS, ni vers le TP « Run List », ni vers la scène d'investigation BitLocker. Naviguer entre les supports d'apprentissage demandait à l'utilisateur de chercher manuellement.

Côté contenu, le thème **Forensique** ne comptait que **43 questions sur 1750** (2,5 %), et l'investigation des systèmes industriels (ICS/SCADA/OT) n'avait pas de chapitre dédié — alors que c'est un des sujets phares du CAS Investigation Numérique.

### Ajouté — Liens croisés Q ↔ Fiche ↔ TP ↔ Scènes

#### Mapping généré (`data/cross-links.json`, 35 KB)

- Nouveau script `scripts/build_cross_links.py` qui construit le mapping bidirectionnel à partir de `data/manifest.json`, `data/questions.json`, `scenes/*.json` et `tp.html`.
- Stratégie hybride : **hard-coded mappings** explicites pour les 70+ fiches principales (priorité), complétés par un **auto-fill** par mots-clés distinctifs (≥4 caractères, hors mots génériques).
- Statistiques générées :
  - **1730 liens** fiches → questions (52/109 fiches couvertes)
  - **26 liens** fiches → TP
  - **73 liens** fiches → scènes
- Mappings inverses (TP → fiches, scène → fiches) inclus dans le même fichier.
- Régénération automatique via `scripts/build-all.sh`.

#### Section « Voir aussi » dans chaque fiche (`js/components/fiche-related.js`)

- Composant injecté en bas des **109 fiches** (après `.fiche-cta-row`) qui affiche jusqu'à 7 cartes :
  - 🎯 **1 carte Quiz** (cyan) : « Tester vos connaissances · N questions sur ce sujet »
  - 🧪 **3 cartes TP** (orange) : exercices pratiques liés (ex. NTFS → Run List, MBR, Slack Space)
  - 🎭 **3 cartes Scènes** (purple) : scénarios DFIR pertinents
- Stylé en flexbox responsive (cards full-width sous 600px), compatible mode dark/light.
- Hover effect : `translateY(-2px) + shadow`.
- Le lien Quiz dépose un filtre dans `localStorage['cas-in-quiz-filter']` (TTL 1h) avant de naviguer vers `quiz.html`.

#### Filtrage du quiz par fiche (modif `js/pages/quiz-app.js`)

- Au démarrage du quiz, lecture de `localStorage['cas-in-quiz-filter']`. Si présent, frais (< 1h) et avec des indices valides : crée `window.S_ficheFilter = { ficheFile, indices, label }`.
- `buildPool()` : nouveau **mode prioritaire** qui retourne uniquement les questions dont l'index est dans le filtre — passe avant `survival`/`sm2`/`smart`/etc.
- **Bannière** affichée en haut du quiz : « 📖 Quiz filtré sur la fiche [X] · N questions » avec bouton « Voir toutes les questions » (clear le filtre + rebuild pool en place, sans reload).
- Le filtre est consommé une fois (supprimé du localStorage à la lecture).

### Ajouté — Questions ICS/SCADA/OT (+27)

Nouveau chapitre `ICS / SCADA / OT Forensique` dans le thème **Forensique** (🔬), passant de **43 → 70 questions**. Total questions : **1750 → 1777**.

Distribution :
- **6 easy** : fondamentaux (CIA vs SAID, modèle Purdue, PLC, IEC 62443, HMI, historian).
- **13 medium** : protocoles (Modbus TCP/502, IEC 61850 MMS/GOOSE/SV, OPC UA), attaques historiques (Stuxnet, Industroyer, Triton/Trisis, Pipedream, Colonial Pipeline), forensique (engineering workstation, Conpot honeypot, Snap7).
- **8 hard** : analyse de tags historian, PLC live forensics avec Snap7/libnodave, IOCs Triton, data diodes, IKT-Minimalstandard suisse (OFAE/BWL).

Toutes les questions ont des références sourcées (NIST 800-82r3, IEC 62443, MITRE ATT&CK for ICS, ENISA, rapports Mandiant/Dragos).

### Modifié — Build orchestrator + git hook

- Nouveau `scripts/build-all.sh` : orchestre les 5 étapes (counts → fiche-index → search-index → cross-links → checks) en un appel.
- Mode `--quick` qui saute la régénération de l'index full-text (utile lors d'itérations rapides).
- Nouveau `scripts/git-hooks/pre-commit` : détecte les fiches modifiées dans le commit, régénère automatiquement `search-index.json` et `fiches/index.html`, les ajoute au commit. Évite l'oubli classique de l'index obsolète.
- Documentation dans `scripts/README.md`.

### Modifié — `scripts/build_index.py` (idempotence)

- Le générateur de `fiches/index.html` produit désormais le bloc moderne avec `fiche-search.js` + `search-modal.js` (au lieu de l'ancien `filterFiches()` inline). Une régénération ne casse plus le moteur de recherche.
- Le `filterFiches()` reste embarqué comme fallback (au cas où les modules JS échouent à charger).

### Modifié — Service Worker v52 → v53

- Cache version : `cas-in-v52` → `cas-in-v53`.
- Nouveaux fichiers ajoutés au cache : `js/components/fiche-related.js`, `data/cross-links.json`.

### Nettoyage prod

- **`console.log` retirés (7 → 0)** : les logs de boot verbeux des modules attachés (`profile-track-v5`, `scene-engine-v4`, `scene-app`, `scene-ux-patch`, `scene-lobby-v3`, `cas-in-export`, ainsi que le `SW enregistré` dans `scene-app`). Aucun log de bruit en console pour un visiteur normal.
- **`alert()` retirés (6 → 0 en direct)** : remplacés par `casNotify()` (cas-in-export.js) et un fallback inline `showToast || alert` (profile-page.js). Les 2 alertes suivies de `location.reload()` ont leur reload allongé de 200 ms → 1200 ms pour que le toast soit lisible.
- **2 catch silencieux complétés** par un `console.warn` ciblé (lecture de track ladder, calcul des nouveaux badges) — les autres `catch (e) {}` étaient des patterns défensifs légitimes (mode privé `localStorage`, API `vibrate`/`audio context` non supportées) et ont été conservés.

### Statistiques v2.19

| Indicateur | v2.18 | v2.19 |
|---|---|---|
| Fiches | 109 | 109 |
| Questions | 1750 | **1777** (+27 ICS) |
| Scènes | 98 | 98 |
| Catégories TP | 27 | 27 |
| Thème Forensique | 43 q | **70 q** (+27) |
| Liens croisés générés | 0 | **1829** (1730 Q + 26 TP + 73 scènes) |
| `console.log` prod | 7 | **0** |
| `alert()` directs | 6 | **0** |
| Service Worker | v52 | **v53** |

## [2.18] — 2026-05-02

Cette version remplace le filtre de cards basique par un **véritable moteur de recherche full-text** sur les 109 fiches.

### Le problème — diagnostic chiffré

L'ancien filtre `filterFiches()` (12 lignes, substring sur `title + desc + data-keywords`) indexait **18 KB de texte = 0,46 % du contenu réel des fiches** (3,9 MB). Sur un panel de 26 requêtes typiques, environ **38 % de hits seulement** :

| Type de requête | Avant | Après |
|---|---|---|
| `RAM`, `MFT`, `EXIF`, `Volatility` | ✅ | ✅ |
| `mémoire vive` (synonyme RAM) | ❌ | ✅ |
| `forensique mobile` / `forensic mobile` | ❌ | ✅ |
| `comment trouver les fichiers cachés ?` | ❌ | ✅ |
| `EXIF metadata` (multi-mots) | ❌ | ✅ |
| `Ed Skoudis` (auteur dans le contenu) | ❌ | ✅ |
| `ip link` (commande Linux) | ❌ | ✅ |
| `4624 type 10` (Event ID) | ❌ | ✅ |
| `volatlity` (faute de frappe) | ❌ | ✅ |
| `Volátility` (accent anormal) | ❌ | ✅ |

### Ajouté — Moteur de recherche v2 (4 niveaux)

#### N1 — Tokenization, accents, synonymes (`js/components/fiche-search.js` v2, 466 L)

- **Normalisation** : lowercase + suppression accents NFD + ponctuation → recherche stable quelle que soit la casse ou les diacritiques.
- **Tokenization** : split en mots, filtre stopwords FR + EN (~80 termes incluant les mots interrogatifs `comment`, `pourquoi`, `what`, `why`…) → permet de **poser des questions** sans dégrader la recherche.
- **Synonymes bidirectionnels FR ↔ EN** (~50 entrées) :
  - `ram ↔ mémoire ↔ memory ↔ vive`
  - `browser ↔ navigateur`
  - `forensique ↔ forensic ↔ forensics`
  - `carving ↔ récupérer ↔ recover ↔ supprimés ↔ deleted`
  - `registre ↔ registry`, `chiffrement ↔ encryption ↔ crypto`
  - `mobile ↔ smartphone ↔ téléphone ↔ phone ↔ ios ↔ android`
  - … etc.
- **Tous les tokens doivent matcher** (AND) : recherche multi-mots dans le désordre.

#### N2 — Indexation full-text du contenu réel (`scripts/build_search_index.py`, 218 L → `data/search-index.json`, 581 KB)

Script Python qui parse les 109 fiches et extrait :

- **Titre** (`<h1>`)
- **Sections** (`<h2>` + `<div class="sec-title">` — 875 sections au total)
- **Commandes** (`<div class="cli">` avec extraction par balance des `<div>` imbriqués — 38 blocs)
- **Termes** (`<code>`, `<strong>` — 6622 termes)
- **Texte des paragraphes** (limité à 400 chars/section pour économiser bande passante)

L'index pèse **581 KB** non compressé (~80-120 KB gzippé côté serveur GitHub Pages).

#### N3 — Scoring intelligent + fuzzy

- **Pondération par champ** : title=10, sectionTitle=5, command=4, term=3, desc=2, body=1
- **Bonus mot entier** (vs sous-chaîne) : +5
- **Bonus tous les tokens dans la même section** : ×2
- **Bonus tous les tokens matchent quelque part** : ×1.5
- **Fuzzy fallback Levenshtein** (distance ≤ min(2, len/3)) : trouve `volatlity` → `volatility`, `réseaau` → `réseau`, etc.
- **Tri par score décroissant**, retourne top 20 résultats avec extraits surlignés.
- **Pas de dépendance externe** (pas de Fuse.js) : ~5 KB de code search inhouse vs 30 KB de lib.

#### N5 — Modal Cmd+K global (`js/components/search-modal.js`, 508 L)

Recherche cross-fiches accessible **depuis n'importe quelle page** (118 pages) :

- **Trigger** : `⌘K` (Mac) / `Ctrl+K` (Windows/Linux), ou bouton FAB 🔍 bottom-right.
- **Modal centré** (max-width 680px, max-height 70vh, backdrop blur).
- **Recherche live** (debounce 100ms).
- **Résultats** : icône + titre fiche + section pertinente + extrait surligné (`<mark>`) + score.
- **Navigation clavier** : ↑↓ navigue, Enter ouvre, Esc ferme.
- **Recherches récentes** (5 max) en localStorage `cas-in-search-recent`.
- **Deep-linking** : si la section a un `id`, le lien ouvre directement à l'ancre (`fiche.html#section-id`).
- **Cohérent dark/light** via `[data-theme="light"]` selectors.

### Tests runtime

Sur un panel de **20 requêtes représentatives**, toutes retournent les bonnes fiches avec scores et snippets pertinents :

```
"RAM"                           → Acquisition Mémoire RAM (160), Mémoire Internals (139), Volatility (78)
"mémoire vive"                  → mêmes résultats (synonymes)
"comment analyser une RAM ?"    → Acquisition Mémoire (61) [stopwords filtrés]
"volatlity" (faute)             → Volatility 3 (4.5) [fuzzy match]
"Ed Skoudis"                    → cmd_windows › Intrusion Discovery (46.5)
"ip link"                       → cmd_linux › Réseau (79.5)
"4624 type 10"                  → lateral_movement › RDP (129), logs_windows (90)
"EXIF metadata"                 → Métadonnées Avancées (249)
"récupérer fichiers supprimés"  → Data Carving (249)
"forensic mobile"               → Mobile Forensics (195) [synonymes EN↔FR]
"WhatsApp database"             → Messagerie IM (91), SQLite Internals (61)
"NTFS MFT"                      → NTFS (184), ReFS (64), MAC Times (52)
"comment trouver les processus malveillants" → cmd_linux + Mémoire + cmd_windows
```

### Ajouté

- `js/components/fiche-search.js` (466 L, 17 KB) — moteur de recherche v2.
- `js/components/search-modal.js` (508 L, 18 KB) — modal Cmd+K.
- `scripts/build_search_index.py` (218 L) — générateur d'index full-text.
- `data/search-index.json` (581 KB) — index pré-calculé des 109 fiches × 875 sections.

### Modifié

- `fiches/index.html` — chargement des 2 nouveaux scripts ; ancien `filterFiches()` conservé en fallback minimal.
- 117 autres pages HTML (109 fiches + 8 pages racine) — chargement des 2 scripts via `<script defer>`.
- `sw.js` v51 → v52 — ajout des 3 nouveaux assets aux STATIC_ASSETS pour cache offline.

### À noter

- L'index est **pré-calculé à la build** (run manuel de `python3 scripts/build_search_index.py`) : pas de coût CPU côté navigateur.
- L'index est **chargé une seule fois** au boot via fetch + pré-normalisé en mémoire pour des recherches très rapides.
- Les `data-keywords` des cards (générés par `build_index.py`) restent utilisés en fallback côté page d'index.

---

## [2.17] — 2026-05-02

Cette version finalise le **mode dark/light** sur l'ensemble du site et règle quelques entrées orphelines du manifest.

### Modifié — Mode light propagé dans les 7 CSS qui en manquaient

Avant : seul `style/style.css` avait des règles `[data-theme="light"]` (28 sélecteurs). Le toggle fonctionnait mais 90 % de l'UI restait en mode sombre car les CSS spécifiques (`fiche_style.css`, `landing.css`, etc.) redéfinissent `:root` localement, écrasant les overrides.

Après : ajout de blocs `[data-theme="light"]` dans tous les CSS principaux :

| CSS | Sélecteurs light ajoutés | Variables override |
|---|---|---|
| `style/fiche_style.css` | 47 | --bg, --surface, --surface2, --border, --text, --muted, --dim, --cyan, --gold, --red, --green, --blue, --orange, --purple |
| `style/landing.css` | 14 | --bg, --surface, --surface2, --border, --text, --green, --green-mid, --cyan, --gold, --red |
| `style/quiz.css` | 13 | + --share-purple, --cyan-soft-bg, --gold-soft-bg, --dim-soft-border |
| `style/scene.css` | 11 | + --easy/medium/hard/expert, --scene-glow, --atm-glow-1/2 |
| `style/tp.css` | 10 | core vars |
| `style/profile.css` | 10 | héritage depuis landing.css (load order) |
| `style/tools.css` | 4 | héritage depuis style.css |

Total : **137 sélecteurs `[data-theme="light"]`** distribués dans 8 fichiers CSS.

Palette light cohérente : fond `#f7f9fc`, surfaces `#fff`/`#eef2f7`, texte `#1a2235`, accents assombris pour AA contrast (cyan `#008c80`, gold `#b07000`, red `#c0392b`, green `#1a7a4a`).

### Ajouté — 3 fiches orphelines intégrées au manifest

Découvertes lors de l'audit : `docker_kubernetes_forensique.html`, `fat32.html`, `lateral_movement_forensique.html` existaient mais n'étaient pas dans `data/manifest.json` → tombaient en fallback HTML lors du build d'index. Ajoutées avec catégorie/icône/desc appropriés.

Manifest : 106 → 109 fiches.

### Service Worker

`v50 → v51`. Cache invalidé pour récupérer les CSS modifiées.

---

## [2.17] — 2026-05-02

Session « tout faire » : 5 chantiers en parallèle. Refactor SQLite + nouvelles fiches Linux/Mobile + mode clair/sombre.

### Phase 1 — Refactor des 2 fiches SQLite

`sqlite_forensique.html` (390L) et `sqlite_forensique_avance.html` (479L) avaient des titres trop similaires. Harmonisation en parcours 2 étapes :

| Avant | Après | Rôle |
|---|---|---|
| SQLite Forensique | **SQLite Forensique — Démarrage** (Étape 1/2) | 🗃️ Pratique |
| SQLite Forensique Avancé | **SQLite Forensique — Internals Avancés** (Étape 2/2) | 🧬 Approfondir |

Bannières cross-référence harmonisées entre les 2.

### Phase 2 — `cmd_windows_forensique.html` enrichi (+113 L)

Nouvelle section « Intrusion Discovery — détecter une compromission en live » inspirée du cheat sheet SANS Ed Skoudis (Windows Intrusion Discovery v3.0). 5 cards :

- **Connexions et sessions SMB inhabituelles** — `net view \\127.0.0.1`, `net session`, `net use`, `nbtstat -S`, `netstat -nao/-naob`, `netsh advfirewall`
- **Persistance — Run / RunOnce / RunonceEx** — 3 clés registre HKLM+HKCU
- **Logs Windows — Event IDs critiques** — tableau 9 IDs (1102, 4624 type 10, 4625, 4672, 4688, 4697, 4698, 4720, 7034-7045)
- **Outils Sysinternals indispensables** — Process Explorer, Process Monitor, Sysmon, Autoruns, PsExec, Process Hacker
- **Performances anormales** — `taskmgr`, `dir C:\`, WER crashes

### Phase 3 — Nouvelle fiche `cmd_linux_forensique.html` (479 L)

Parallèle Linux du cmd_windows. Inspirée du cheat sheet SANS « Linux Intrusion Discovery v2.0 » (Ed Skoudis). 8 sections :

1. **Processus** : `ps auxf`, `lsof -p`, `lsof +L1` (binaires supprimés), comparaison ps/proc
2. **Fichiers** : SUID root, `find -nouser`, fichiers cachés (..., .., .), `debsums -c`, `rpm -Va`
3. **Réseau** : `ss -tulnp`, `ip link grep PROMISC`, cache ARP
4. **Tâches planifiées** : crontab par user, `/etc/cron.d/`, timers systemd, atq
5. **Comptes** : `egrep ':0+:' /etc/passwd`, NSS, comptes shell, mot de passe shadow, last/lastb
6. **Logs** : journalctl, /var/log/auth.log, auditd, ausearch
7. **Performances** : uptime, free, df, iotop, nethogs
8. **Outils** : chkrootkit, rkhunter, AIDE, Tripwire, Lynis, OSSEC/Wazuh, CIS Benchmarks

Workflow 15 min en 7 étapes (parallèle au workflow Windows).

### Phase 4 — Nouvelle fiche `mobile_apps_forensique.html` (637 L)

Catalogue 30+ apps iOS tierces avec leurs paths SQLite/Plist/Realm. Inspiré du poster officiel SANS DFIR « iOS Third-Party Apps Forensics v1.1 » (Mattia Epifani, 2021). Catégories couvertes :

- **Messageries** (14 apps) : WhatsApp, Telegram, Signal, Skype, Viber, LINE, Facebook Messenger, Discord, Wickr Me, Snapchat, TikTok, Instagram, WeChat, Kik
- **Cloud** (5) : Dropbox, Google Drive, OneDrive, Gmail, ProtonMail
- **Voyage** (6) : Uber, Waze, Google Maps, Airbnb, Booking, Air France/KLM
- **Finance** (2) : PayPal, Venmo
- **Social** (5) : Facebook, Twitter/X, LinkedIn, Tinder, Reddit
- **Médias** (3) : Spotify, Netflix, Private Photo Vault
- **Santé** (3) : Fitbit, Strava, Adidas Running

Pour chaque app : path Sandbox `Data/`, path `Shared/AppGroup/` quand applicable, fichiers critiques (⭐), notes forensiques. Section outils : iLEAPP, APOLLO, Cellebrite, Magnet AXIOM, Oxygen, DB Browser, SQLECmd, Realm Studio.

### Phase 5 — Mode clair/sombre toggle

Nouveau thème `[data-theme="light"]` dans `style/style.css` (+85 L) avec palette professionnelle :
- Fond blanc cassé `#f7f9fc`
- Texte presque noir `#1a2235`
- Cyan/Gold/Red/Green/Purple assombris pour AA contrast
- Tags, cards, panels, inputs, scrollbars adaptés
- Code/CLI rendus avec syntax highlighting clair

Composant `js/components/theme-toggle.js` (170 L) :
- **Bouton flottant** bottom-left (☀️/🌙) — ne chevauche pas le FAB notes (bottom-right)
- **Persistence** localStorage (`cas-in-theme`)
- **Boot synchrone** avant render pour éviter FOUC
- **API** `window.CASTheme.{get,set,toggle}` pour intégrations
- **Conserve** les thèmes exotiques existants (hacker/crimson/retro/blueprint)

**118 pages patchées** avec inclusion auto : 110 fiches + 8 pages racine (index/quiz/tp/scene/exam/tools/profile/offline).

### Stats finales v2.17

```
1750 questions · 106 fiches · 93 scènes · 32 TP
SW v49 → v50
```

---

## [2.16] — 2026-05-02

Cette version finalise le « parcours forensique mémoire » et ajoute deux fonctionnalités UX majeures : **CHANGELOG à jour** + **fiche poster Windows** + **système de notes utilisateur** sur fiches.

### Phase 1 — CHANGELOG remis à jour

Les sessions v2.11 → v2.15-bis n'avaient pas été documentées. Cette version rattrape l'arriéré avec entrées détaillées pour chaque palier.

### Phase 2 — Nouvelle fiche `poster_windows_artefacts.html`

Inspirée du **poster officiel SANS FOR500** (Rob Lee), c'est une fiche-matrice qui organise les artéfacts Windows **par question forensique** plutôt que par technologie. CAS-IN avait déjà tous les artéfacts éparpillés dans 18+ fiches — manquait la grille d'entrée :

| Question forensique | Artéfacts couverts |
|---|---|
| Quel programme a été exécuté ? | UserAssist · Shimcache · Amcache · BAM/DAM · SRUM · JumpList · Prefetch · Win10 Timeline |
| Quel fichier a été ouvert ? | Open/Save MRU · Recent · LNK · Office MRU · ShellBags · JumpList · Last-Visited |
| Quel fichier a été supprimé ? | Recycle Bin (XP/Win7+) · ShimCache · WordWheel · Thumbnail · Thumbs.db |
| D'où vient ce fichier ? | Browser History · Downloads · Email Attachments · Skype · ADS Zone.Identifier |
| Quel USB a été branché ? | USBSTOR · setupapi.dev.log · MountPoints2 · Volume Serial · Drive Letter |
| Quelle activité Internet ? | History · Cookies · Cache · Flash LSO · Session Restore · Google Analytics |
| Qui s'est connecté ? | Last Login · RDP · Services · Logon Types · Auth Events |
| Quel réseau ? | Timezone · WLAN Event Log · Network History · SRUM Network |

Chaque cellule = lien direct vers la fiche détaillée. Devient la **fiche d'entrée** pour DFIR Windows.

### Phase 3 — Notes utilisateur sur fiches

Nouvelle fonctionnalité `js/components/fiche-notes.js` : permet d'annoter chaque fiche comme dans un livre papier. Persistence localStorage (`cas-in-notes-{ficheId}`). Markdown supporté. Recherche full-text dans toutes les notes. Export global JSON/Markdown.

### Stats finales v2.16

```
1750 questions · 104 fiches · 93 scènes · 32 TP
SW v48 → v49
```

---

## [2.15-bis] — 2026-05-01

Renforcement du contenu ICS et clarification du parcours « forensique mémoire ».

### Ajouté

- **Scène ICS expert** : `scenes/swissgrid-iec61850-jura.json` — poste électrique 380 kV à Bassecourt JU sous attaque GOOSE forgée. Inspirée d'Industroyer/Industroyer2 (Ukraine 2016/2022). 5 phases couvrant diagnostic GOOSE/SV, IEC 62351-6, doctrine Safety > Security > Forensics, notifications OFCS/MPC/ENTSO-E, plan IEC 62443 SL4. Difficulty: expert.
- **6 edge cases modernes** dans `ram_forensique.html` : Secure Boot + Measured Boot, KASLR, VBS/Credential Guard/HVCI, BitLocker TPM 2.0 + PIN, Hyperviseur type-1 (VMware/Hyper-V/Proxmox), SSD avec auto-encrypt SED + Opal 2.0.

### Modifié — Refactor des 3 fiches mémoire

Avant, les 3 fiches `ram_forensique` (304L) + `volatilite` (460L) + `volatility_memory_forensics` (942L) avaient des titres et descriptions trop similaires. Refactor pour clarifier le rôle de chacune :

| Fiche | Avant | Après | Rôle |
|---|---|---|---|
| `ram_forensique.html` | "RAM Forensique" | **"Acquisition Mémoire RAM"** (Étape 1/3) | 📥 Capturer |
| `volatilite.html` | "Volatility & RAM" | **"Volatility 3 — Démarrage"** (Étape 2/3) | 🚀 Premiers pas |
| `volatility_memory_forensics.html` | "Volatility & Memory Forensics" | **"Mémoire — Internals Avancés"** (Étape 3/3) | 🧬 Approfondir |

Bannières de cross-référence harmonisées entre les 3 fiches. H1 + title + meta description + breadcrumb tous alignés.

### Service Worker

`v46 → v48`. Cache invalidé pour les 3 fiches mémoire modifiées.

---

## [2.15] — 2026-05-01

Trois nouvelles fiches forensiques basées sur les cheat sheets officielles SANS, plus enrichissement de `zimmerman.html`.

### Ajouté

- **`fiches/ics_forensique.html`** (392 L) — ICS/SCADA Forensique : modèle Purdue (5 niveaux SVG), 6 protocoles industriels (Modbus/DNP3/IEC 61850/OPC-UA/EtherNet-IP/S7comm) avec ports + tshark filters, NSM ICS (SPAN vs TAP fail-open), 3 règles Suricata pédagogiques, IR Jump Bag complet, spécificités suisses (LSI art. 73-78, OFCS, IIC, délai 24h). Inspiré du cheat sheet SANS « Industrial Network Security Monitoring & Incident Response ».
- **`fiches/cmd_windows_forensique.html`** (397 L) — Live Response Windows : tasklist (`/v` `/m` `/svc`), sc query/qc, wmic (alias/where/verb), reg (clés persistance prioritaires), netstat -nao, netsh (firewall/DNS hijack/WiFi keys), boucles `for /L` et `/F`. Workflow live response 15 min en 4 phases. Justification du choix de cmd.exe vs PowerShell en environnement durci. Inspiré du cheat sheet SANS « Windows Command Line Cheat Sheet » (Ed Skoudis).
- **`fiches/magic_bytes_signatures.html`** (353 L) — File Signatures : tableau de 23 magic bytes principaux (PNG/JPEG/ZIP/PDF/EXE/ELF/etc.), cas spéciaux à offset non-zéro (NTFS @ 0x03, EXT4 @ 0x438, HFS+ @ 0x400, GPT @ 0x200), 6 outils (file/xxd/binwalk/photorec/trid/PowerShell), 12 regex forensiques (IP/email/hashes/base64/GUID/BTC), combos bash (grep/awk/sed/sort/uniq), `findstr` Windows. Lien direct vers `tp.html#magic`. Inspiré du cheat sheet SANS « Hex and Regex Forensics ».
- **Section `bstrings`** dans `fiches/zimmerman.html` (+72 L) : usage de base, `--ls`/`--lr`/`--off`/`--cp`/`--fr`/`--fs`, built-in patterns regex (email/ipv4/cc/ssn/guid), 5 cas d'usage forensiques. Inspiré du cheat sheet SANS « Eric Zimmerman's Tools ».

### Modifié

- `data/manifest.json` : 100 → 103 fiches, entrées triées par catégorie + alphabétique.
- `data/counts.json` : régénéré (fiches: 100 → 103).
- `fiches/index.html` : régénéré via `scripts/build_index.py` pour intégrer les nouvelles fiches.
- `sw.js` : v45 → v46, cache invalidé.

---

## [2.14] — 2026-05-01

Extensions pédagogiques des TP + refactor pollution globale.

### Ajouté — Extensions TP forensiques

- **`genHexDump`** : 10 → 13 scénarios. Ajout HFS+ Volume Header (BE @ 0x000), exFAT VolumeSerialNumber (LE @ 0x064), GPT Primary Header NumberOfPartitionEntries (LE @ 0x250).
- **`genFSIdentify`** : EXT4 buffer étendu 64 → 128 octets pour inclure UUID superblock @ 0x68.
- **`genHashIdentify`** : 6 → 7 sous-types. Nouveau sous-type "Détection collision MD5" : 3 paires de fichiers (Word/JPG/EXE) avec MD5 identique mais SHA-1 et SHA-256 différents — apprend à reconnaître le piège forensique. Référence Wang & Yu 2005, Stevens et al. 2008, Flame malware 2012.
- **`genRunList`** : décodage simple → décodage + classification. Nouveau sous-type QCM (~30%) : identifier dense vs sparse vs compressée (LZNT1) à partir d'une RunList NTFS.

### Modifié — Refactor pollution globale `quiz-app.js`

Audit révèle que sur les "663 vars top-level" suspectées, seules **14 `let _privé`** étaient réellement à problème. Regroupement dans namespace `_qz = { ... }` :

```js
const _qz = {
  qRenderTime: 0, loadMsgInt: null, lastRankCloseNotif: 0,
  toastTimers: {}, focusMode: false, forensicShown: false,
  konamiPos: 0, godMode: false, godModeTimer: null,
  dorActive: false, dorSessionScore: 0, bilanShareOpen: false,
  bilanShareDrawn: false, ac: null,
};
```

61 occurrences mises à jour automatiquement. 14 commentaires de traçabilité conservés. Pas de risque de régression : ces vars avaient un usage strictement local.

Les autres top-level (`bossState`, `S`, `ALL_Q`, `EX`, `RANKS`) sont conservés tels quels — ce sont des objets de state légitimes dont la consolidation aurait juste compliqué le débogage.

### Service Worker

`v45 → v46`.

### Tests

`135/135 OK` sur les 27 générateurs TP × 5 itérations. Tests `genHexDump` 65/65, `genHashIdentify` 70/70, `genFSIdentify` 70/70, `genRunList` 100/100.

---

## [2.13] — 2026-04-30

Split de `quiz-app.js` + tests de cohérence + enrichissement SM-2.

### Ajouté

- **`js/pages/quiz-data.js`** (1562 L / 111 KB) : 17 constantes extraites de `quiz-app.js` (RANKS, MILESTONES, GLOSSARY, CHEATSHEETS, FEEDBACK_OK/KO, FORENSIC_QUOTES/TIPS, PERSONAS, LOADING_MSGS, AVATAR_EMOJIS, KONAMI, MID_TIPS, CHAPTER_TO_THEME_FILE, SCENES, MISSION_PHASES, VISUAL_THEMES). Module séparé pour alléger le caching et la maintenance.
- **`tests/test-achievements-sync.js`** : détecte la désynchronisation entre `ACHIEVEMENTS` (quiz-app.js) et `QUIZ_ACH` (cas-in-achievements.js). Tolère 14 abréviations de descriptions. Fix : harmonisation du nom 'hint'.
- **SM-2 enhancements** : `updateSM2()` retourne `{interval, reps, ef}` pour feedback UX. Toast "🃏 Prochaine révision dans X jours". Nouvelles fonctions `getSM2Stats()` et `resetSM2()` (avec confirm). Widget stats SM-2 dans `profile.html` + `js/profile/profile-page.js` + `style/profile.css`.

### Modifié

- `js/pages/quiz-app.js` : 6630 → 5183 lignes (-22%, -115 KB).
- `ACHIEVEMENTS` reste dans `quiz-app.js` (dépendances runtime via `check: s => ...`), pas extrait dans quiz-data.js.

### Service Worker

`v43 → v45`. v44 : retrait de `track-theme.css` et `fiche-hub.css` orphelins de STATIC_ASSETS (404 au précache). v45 : ajout de `quiz-data.js`.

---

## [2.12] — 2026-04-30

Split de `tp-engine.js` en 3 modules.

### Ajouté

- **`tp/tp-engine-windows.js`** (1293 L) : générateurs Registry / Prefetch / LNK extraits.
- **`tp/tp-engine-meta.js`** (412 L) : générateurs Droit / Glossaire / Email / IR / Network extraits.

### Modifié

- `tp/tp-engine.js` : 8030 → 6429 lignes.
- Chaque module patche le dispatcher `GENERATORS` après sa propre définition.
- `tp.html` : balises `<script>` mises à jour pour précharger les 3 modules dans l'ordre.

### Service Worker

`v42 → v43`. Ajout des 2 nouveaux modules au précache.

---

## [2.11] — 2026-04-30

Restructuration des fichiers à la racine pour réduire la pollution.

### Modifié — Réorganisation

| Avant (racine) | Après |
|---|---|
| `ARCHITECTURE.md` | `docs/ARCHITECTURE.md` |
| `CHANGELOG.md` | `docs/CHANGELOG.md` |
| `test-cas-in.js` | `tests/test-cas-in.js` |
| `counts.json` | `data/counts.json` |
| `manifest.json` | `data/manifest.json` |
| `questions.json` | `data/questions.json` |

### Modifié — 14 fichiers patchés

Tous les chemins mis à jour : `sw.js`, `quiz-app.js`, `exam-app.js`, `js/pages/search.js`, `js/components/counts.js`, `scripts/generate_counts.py`, `scripts/build_index.py`, `scripts/sync_fiches_index.py`, `scripts/check_questions.py`, `exam.html`, `.github/workflows/audit-repo.yml`, `.github/workflows/check-questions.yml`, et le tree dans `README.md`.

### Service Worker

`v41 → v42`. Cache invalidé pour forcer re-précache des nouveaux chemins.

---

## [2.10] — 2026-04-30

Refactor structurel en 4 phases. Aucun changement fonctionnel pour l'utilisateur final hormis la correction de bugs UX listés en Phase 1. Ouverture d'`ARCHITECTURE.md` à la racine.

### Phase 0 — Resync `fiches/index.html` (correctif)

`fiches/index.html` était rédigé à la main et avait dérivé par rapport à `manifest.json` :
- **73 fiches sur 95** avec une icône divergente (le HTML utilisait souvent 📄 alors que le manifest avait une icône thématique : 🌍, 🧅, 🤖, ☁️, 🪟, 🔐, etc.).
- **27 fiches** avec `data-keywords=""` → invisibles à la recherche par mots-clés.
- **27 fiches** avec `<div class="fiche-desc"></div>` vide.

Nouveau script **`scripts/sync_fiches_index.py`** : utilise `manifest.json` comme source de vérité, applique les icônes correctes aux cards, reconstruit les descriptions et `data-keywords` manquants. Idempotent — peut être relancé après chaque ajout de fiche.

3 icônes par défaut restantes dans `manifest.json` (`rapport_forensique`, `linux_forensique`, `macos_forensique`) thématisées en `📋`, `🐧`, `🍏`.

État final : **95 cards, 0 keyword vide, 0 description vide, 0 icône générique**. La recherche globale Ctrl+K trouve maintenant chaque fiche par ses mots-clés.

À ajouter au flow CI : exécuter `python3 scripts/sync_fiches_index.py` après toute édition de `manifest.json`, comme on le fait déjà pour `generate_counts.py`.

### Phase 1 — Bugs UX

- **`quiz.html` · daily-banner persistant** : le bouton ✕ utilisait `style.display='none'` sans persistence → la bannière revenait à chaque rechargement. Désormais `dismissDailyBanner()` (dans `quiz-ui-patch.js` ligne 632+) écrit `dailyBannerDismissed = today ISO` en localStorage, et masque automatiquement au boot si déjà fermé aujourd'hui.
- **`quiz.html` · `#fz-badge` valeur en dur** : le HTML contenait `<span id="fz-badge">1</span>`, donc avant que `quiz-app.js` ne tourne, l'utilisateur voyait « 1 freeze » même avec 0. Maintenant le span est vide et `updateFreezeBtn()` met `''` quand `S.streakFreezes === 0`, masqué via CSS `:empty`.
- **`quiz.html` · titre du `#streak-display` incohérent avec la donnée** : le `title` disait « Série quotidienne » mais `updateStreakDisplay()` y plaçait `S.streak` (série de bonnes réponses du quiz courant). Titre corrigé en « Série de bonnes réponses (session) ».
- **`quiz.html` / `scene.html` / `tp.html` · ordre de chargement des scripts non documenté** : ajout d'un commentaire `<!-- ⚠ ORDRE CRITIQUE — ne pas réordonner -->` au-dessus des `<script defer>` dépendant de `window.Profile`. Voir `ARCHITECTURE.md` § « Couches & ordre de chargement ».

### Phase 2 — Suppression scores doublons

Le rang/XP/streak quotidien étaient affichés à 5 endroits : `index.html` drawer, `profile.html` hero, `quiz.html#xp-wrap`, `scene.html#grade-mini` + `#grade-card`, et `profile-banner` transversal. Trois rendus différents avec **trois systèmes de seuils** (`RANKS` quiz-app, `GRADES` scene-app, `Profile.TRACKS.ranks`) → l'utilisateur pouvait voir des rangs incohérents selon la page.

- **`quiz.html`** : retrait de `#xp-wrap` (anneau XP + rang local + streak local + freeze) et `#avatar-chip`. Info redondante avec `profile-banner`. Le bouton 🧊 « Streak Freeze » est déplacé dans le menu ⋯ avec une pill inline (CSS `:empty` pour masquer quand 0). « Modifier profil » ajouté également au menu ⋯ pour préserver l'accès à `openAvatarSetup()`.
- **`scene.html`** : retrait de `#grade-badge-mini` du header. Un nouveau bouton 🏅 prend sa place pour préserver l'accès à `openBadgesPanel()`. Le `#grade-card` du lobby est conservé (élément narratif important sur l'écran d'accueil simulation, à recâbler en Phase 5 sur `Profile.getRank()`).
- **`quiz-app.js#updateXpBar()`** et **`scene-app.js#updateGradeDisplay()`** : ajout de guards `if (el)` sur chaque accès DOM (les fonctions continuent d'être appelées par les call-sites mais ne plantent plus si l'élément a été retiré).
- **`style/quiz.css#fz-badge`** : repositionné de l'ancien overlay corner vers une pill inline pour le menu ⋯, masqué via `:empty`.

### Phase 3 — Extraction des `<style>` inline

Les pages avaient leur CSS inline dans `<style>…</style>`, ce qui :
- empêchait la mise en cache séparée du CSS,
- gonflait chaque GET HTML,
- bloquait toute CSP `style-src` stricte.

| Page         | Avant (`<style>` inline) | Après (HTML)   | Nouveau CSS              |
|--------------|--------------------------|----------------|--------------------------|
| `scene.html` | 87 KB                    | 23 KB          | `style/scene.css` 64 KB   |
| `tp.html`    | 39 KB                    | 28 KB          | `style/tp-page.css` 11 KB |
| `tools.html` | 33 KB                    | 27 KB          | `style/tools.css` 6 KB    |
| `exam.html`  | 23 KB                    | 11 KB          | `style/exam.css` 12 KB    |

Note : `style/tp.css` existait déjà pour le moteur d'exercices TP — le nouveau `style/tp-page.css` couvre uniquement le chrome de `tp.html`.

### Phase 4 — Réorganisation `js/`

Le dossier `js/` plat de 21 fichiers est réorganisé en 4 sous-dossiers reflétant les couches d'architecture :

```
js/
├── core/        cas-in-profile.js, cas-in-counts.js, cas-in-export.js,
│                cas-in-pwa.js, cas-in-search.js
├── profile/     profile-banner.js, profile-page.js, profile-track-v5.js
├── bridges/     quiz-profile-bridge.js, scene-profile-bridge.js,
│                tp-profile-bridge.js
└── pages/       landing.js, landing-3d.js, quiz-app.js, quiz-ui-patch.js,
                 scene-app.js, scene-engine-v4.js, scene-lobby-v3.js,
                 scene-ux-patch.js, exam-app.js, tools-app.js
```

- **38 références `<script src="js/X.js">`** mises à jour dans 7 HTMLs.
- **`sw.js` v30 → v31** : `STATIC_ASSETS` regénéré avec les nouveaux chemins, regroupé par couche avec commentaires explicatifs.
- **`ARCHITECTURE.md`** créé à la racine, ~7 KB, documente la stack en 4 couches, l'ordre de chargement obligatoire, le mapping des clés localStorage, et la dette technique restante (sharding `questions.json`, élimination de `bridges/`, unification des rangs, fusion des achievements).

### Future work documenté (non exécuté)

Voir `ARCHITECTURE.md` § « Future work » pour les chantiers identifiés mais non touchés en v2.10 :
- Sharding `questions.json` (2.5 MB monolithique) sur le modèle de `scenes/index.json + lazy fetch`.
- **Phase 5 : élimination du proxy `Storage.prototype` des `bridges/`** par refactor de `quiz-app.js` / `scene-app.js` pour appeler `Profile.addXp()` directement. Préalable : audit des achievements liés aux seuils legacy.
- **Unification `RANKS` / `GRADES` / `Profile.TRACKS.ranks`** sur `Profile.getRank()` unique. Migration `casIn_profile` v=2 → v=3 nécessaire pour ré-aligner les seuils débloqués historiquement.
- Fusion `quiz-app.js#ACHIEVEMENTS` + `scene-app.js#GLOBAL_BADGES` + `Profile.achievements` dans un futur `js/core/cas-in-achievements.js`.
- Performance `profile-banner.js` : passer du `innerHTML=…` complet à des updates ciblés `textContent`.

## [2.9] — 2026-04-29

### 📚 Nouveau — Extension du corpus des fiches

#### 3 nouvelles fiches forensique (~30 KB chacune)

- **`ios_forensique.html`** — iOS forensique opérationnel : états AFU/BFU, méthodes d'acquisition par génération SoC (A7-A11 checkm8, A12+ Cellebrite Premium, A16+ logical), comparatif des outils commerciaux (Cellebrite UFED/Premium, GrayKey, Magnet AXIOM, Oxygen, iLEAPP), artefacts clés (sms.db, CallHistory, knowledgeC.db, Photos, Safari, Mail, Notes, Health, Locations, WhatsApp/Telegram/Signal), deep-dive sur knowledgeC.db avec exemple SQL et conversion Mac Absolute Time, classes de protection Keychain, voies d'accès iCloud Backup (MLAT, Apple ID, token), Advanced Data Protection E2EE iOS 16.2+, impact du Lockdown Mode iOS 16+, workflow d'acquisition en 5 étapes, cadre juridique suisse (art. 263/248/269/282 CPP, art. 67 EIMP, art. 22 LPD).

- **`android_forensique.html`** — Android forensique : différences FBE vs FDE et metadata encryption Android 11+, 5 niveaux d'acquisition (Manual/Logical/File System/Physical/Chip-off), exploits SoC (Qualcomm EDL, MediaTek BROM via mtkclient, risques Knox tripping Samsung), workflow ADB complet avec exemples de commandes, artefacts clés (accounts.db, contacts2.db, mmssms.db, WhatsApp msgstore.db, Telegram cache4.db, Signal SQLCipher, Chrome, Gmail, Maps, WifiConfigStore.xml en clair), deep-dive usagestats (équivalent Android du knowledgeC.db avec sous-dossiers daily/weekly/monthly/yearly), Knox & Secure Folder, TWRP & custom recovery (risques de wipe sur bootloader unlock), comparatif outils commerciaux (Cellebrite UFED/Premium, Magnet AXIOM, Oxygen, MOBILedit, ALEAPP, Andriller), workflow en 4 étapes, cadre juridique suisse (art. 263/248/269/269bis CPP, art. 22 LPD).

- **`m365_forensique.html`** — Microsoft 365 forensique cloud : panorama des sources de logs (Azure AD, Exchange Online, SharePoint, OneDrive, Teams, Defender, Purview), Unified Audit Log (UAL) avec exemples PowerShell complets, MailItemsAccessed pour BEC investigation (différenciation Bind vs Sync, lecture des résultats JSON), Azure AD Sign-ins (sign-in logs, audit logs, risk events, provisioning logs), eDiscovery & Purview (Content Search, eDiscovery Standard/Premium), playbook de 3 attaques typiques (BEC, token theft via Evilginx, apps OAuth malicieuses), Microsoft Graph API pour collecte programmatique, Defender XDR & Sentinel avec exemples KQL, 7 pièges récurrents (UAL non activé, MailItemsAccessed E5-only, suppression rapide des règles, désync timestamps, pagination 5000 résultats), workflow Suisse typique en cas de BEC (plainte CP 146/143, réquisition CPP 265, EIMP via OFJ).

### 🔧 Corrections — Métadonnées du manifest

`manifest.json` : correction des **26 fiches** marquées `"desc": "(à compléter)"` qui sont en réalité **bien remplies** (20-58 KB chacune). 22 descriptions ont été curées à la main pour refléter le contenu réel, 4 ont été extraites automatiquement depuis les `<meta description>`/sous-titres des fiches.

Fiches corrigées : `algorithmes_forensique`, `browser_artifacts_deep_dive`, `dns_forensique`, `dns_forensique_avance`, `documents_office_forensique`, `email_headers_smtp_forensique`, `expert_witness_ch`, `f2fs`, `log_forensique_avance`, `lscpt`, `mathematiques_forensique`, `metadata_avancees`, `mitre_attack`, `network_traffic_analysis_avance`, `pdf_forensique_avance`, `powershell_forensique`, `refs`, `reverse_engineering_101`, `sqlite_forensique_avance`, `sysmon`, `threat_intel_ioc`, `tls_https_certificate_forensique`, `usb_removable_media_forensique`, `volatility_memory_forensics`, `windows_registry_forensique_avance`, `yara`.

Conséquence visible : la recherche globale `Ctrl+K` retourne maintenant des résultats pertinents pour ces 26 fiches au lieu d'afficher "(à compléter)".

### 📊 Compteurs

- `manifest.json` : 92 → 95 fiches
- `counts.json` : `fiches: 92 → 95`
- `fiches/index.html` : 92 → 95 cartes
- `sw.js` : v29 → v30, +3 fiches dans STATIC_ASSETS

### 🎯 Couverture finale du corpus (95 fiches)

| Catégorie | Avant | Après | Notes |
|---|---|---|---|
| Systèmes de fichiers | 13 | 13 | NTFS, FAT, exFAT, EXT, APFS, HFS+, ReFS, F2FS |
| Acquisition & méthodes | 19 | 19 | KAPE, Velociraptor, Autopsy, X-Ways, Volatility, Plaso, Zimmerman |
| Windows | 12 | 12 | Registry, Event Logs, ShellBags, AD, PowerShell, Sysmon, WSL |
| Cryptologie & sécurité | 15 | 15 | Hashing, PKI, Stegano, MITRE ATT&CK, YARA, Threat Intel, RE |
| Réseaux | 14 | 14 | Wireshark, DNS, Email, SQLite, Tor, OSINT, SIEM |
| Plateformes & Cloud | 10 | **13** | +iOS, +Android, +M365 ⭐ |
| Droit suisse | 9 | 9 | CPP, LPD, EIMP, LSCPT, autorités, expert witness |

Le corpus couvre désormais en profondeur la **forensique mobile** (iOS + Android) et la **forensique cloud Microsoft** — sujets qui représentent ensemble ~70% des enquêtes modernes en Suisse romande.

## [2.8] — 2026-04-29

### 🚀 Nouveau — Patches modulaires v3 / v4 / v5

#### Lobby UX v3 (`js/scene-lobby-v3.js`, 949 lignes)
- **13 parcours pédagogiques** curated couvrant 88/90 scénarios (Fondamentaux, Procédure pénale, Ransomware A→Z, IA & deepfakes, Coopération internationale, Darknet, Infrastructures critiques, Cas 2024-2026, Forensique avancée, Social engineering, Fuites de données, Cas humains, Sécurité d'État).
- **Bouton « Continuer »** : carte épinglée en haut du lobby si un scénario est en cours (étape X/Y, temps relatif). Tracking via `cas_inflight` localStorage, hooks sur `startScene`/`showReport`, polling 2s sur `stepIdx`.
- **Tri configurable** : recommandé / difficulté ↑↓ / récents / à reprendre (≤80%).
- **7 chips d'atmosphère** : Légal, Réseau, Ransomware, Crypto, Hôpital, État, Terrain — cumulables avec les filtres existants.
- **8 nouveaux badges de découverte** (push sur `GLOBAL_BADGES`) : Explorateur d'atmosphères, Maître des atmosphères, Premier Parcours, Érudit DFIR, Maître des Parcours, Spécialiste romand, Chasseur d'affaires réelles, Grimpeur.

#### Scene Engine v4 (`js/scene-engine-v4.js`, 1146 lignes)
- **Briefing repensé** : fiche d'identité (durée estimée, décisions, niveau, atmosphère, articles centraux extraits de `legalRefs`), objectifs visibles (gère format string ET object), pré-warning automatique pour les scénarios sensibles (mineur, suicide, pédocriminalité, harcèlement…).
- **Récap exportable** : trois nouveaux boutons sur l'écran rapport — `📑 Exporter MD` (télécharge un `.md` daté), `📋 Copier` (presse-papiers), `📖 Réviser`. Format markdown complet : toutes les options marquées (👉 = choisie, ✓/✗/🚨 = qualité), feedback complet, références juridiques.
- **Mode révision** : rejoue le scénario complété en mode étude. Toutes les options annotées dès l'affichage (✓/✗, points, feedback, ref. légale), pas de scoring, pas de timer, pas de sauvegarde. Bandeau violet, sortie possible à tout moment.
- **Glossaire des articles de loi** : tooltip click-to-expand sur "art. X CPP/CP/CC/...". 127 entrées documentées (CPP, CP, CC, EIMP, Cst, CEDH, PPMin, LB, LFINMA, LPD, LPers, LMP, LParl), couverture 92% des occurrences du corpus. Lien vers fiche HTML correspondante quand pertinente.

#### Profile Track v5 (`js/profile-track-v5.js`, 1212 lignes)
- **Sélecteur enrichi** : chaque carte de rôle montre la mini-timeline des 12 rangs (avec emojis), la voie en mini-paragraphe, les 3 forces clés, et un cas typique. Hover sur emoji = nom du rang en tooltip.
- **Mini-test d'orientation** : bouton "🎯 Trouver mon rôle" → 4 questions courtes → recommandation argumentée (gère égalités). Bouton "Choisir au feeling" toujours accessible.
- **Banner thématisé** : couleur liée au track (cyan/orange/vert/rouge), emoji du rang en plus grand avec drop-shadow, sous-titre du rôle ajouté. Visible sur scene/quiz/tp.
- **Promotions célébrées** : détection via `Profile.onChange()`, toast plein écran 5s avec emoji animé pulse, sweep doré conique en arrière-plan, son discret WebAudio (3 notes C5-E5-G5), vibration mobile. File d'attente pour gros gains XP qui déclenchent plusieurs promotions en cascade.

### 🛠 Service Worker v29

`sw.js` : ajout des **14 fichiers JS/CSS manquants** dans `STATIC_ASSETS` :
- 11 JS : `cas-in-profile.js`, `landing-3d.js`, `profile-banner.js`, `profile-page.js`, `profile-track-v5.js`, `quiz-profile-bridge.js`, `quiz-ui-patch.js`, `scene-engine-v4.js`, `scene-lobby-v3.js`, `scene-profile-bridge.js`, `tp-profile-bridge.js`
- 3 CSS : `profile-banner.css`, `profile.css`, `quiz.css`

Ces fichiers fonctionnaient online (cache-first avec fallback fetch) mais **n'étaient pas pré-cachés** lors de l'install/update du SW. Conséquence : install PWA fraîche en mode offline → 503 sur ces fichiers, app cassée. Le bump `v28 → v29` force le re-cache complet.

### 🐛 Corrections

#### Manifest fiches incomplet
- **`manifest.json`** : ajout de `linux_forensique.html` et `macos_forensique.html` (2 fiches présentes sur disque, liées depuis `fiches/index.html`, mais absentes du manifest). Catégorie `plateformes`.
- **`counts.json`** : régénéré, `fiches: 90 → 92`.

#### Bug PWA links sur 3 HTMLs
- `index.html`, `quiz.html`, `profile.html` : `<link rel="manifest" href="manifest.json">` → `<link rel="manifest" href="pwa.manifest.json">`. Le premier était l'index des fiches, pas le manifest PWA W3C.

#### Suppressions
- `scenes.js` (1.67 MB legacy) : confirmé supprimé. Le CHANGELOG [2.6] le prévoyait.
- 3 brouillons `scenes/*.js` (competence_mpc_vs, deepfake_electoral, hydro_valais) : supprimés. Pendants `.json` actifs.

### 🧹 Optimisations

- **`index.html`** : retrait de `profile-track-v5.js` (44 KB chargés pour rien — la landing n'a pas de banner).
- **`scripts/generate_counts.py`** : refonte de `count_scenes()` pour lire `scenes/index.json` (source de vérité depuis le refactor v3.0) au lieu de chercher l'ancien `scenes.js`. Avant : retournait `0`. Maintenant : retourne `90`.
- **`manifest.json`** : `$comment` enrichi avec un avertissement explicite "ce fichier N'EST PAS le manifest PWA — voir pwa.manifest.json" pour éviter la confusion future.

### 📝 Documentation

- **`README.md`** : mises à jour de cohérence — `64 scénarios` → `90`, `1630 questions` → `1750`, `90 fiches` → `92`, suppression mention `scenes.js`, ajout d'une section "Patches modulaires (lazy plugins)" décrivant les couches v3/v4/v5, version SW dans le tableau PWA `v21` → `v29`, ajout du dossier `scenes/` dans l'arborescence.

### Architecture cumulative finale

5 couches indépendantes empilables :

| Couche | Lignes | Rôle |
|---|---|---|
| `scene-app.js` | 3009 | Noyau scènes (intouché) |
| `cas-in-profile.js` | 682 | Système de profil unifié (4 tracks × 12 rangs) |
| `scene-ux-patch.js` | 868 | UX v2 (timers, médailles, atmosphère adaptative) |
| `scene-lobby-v3.js` | 949 | Parcours, continuer, tri, atmosphère, achievements |
| `scene-engine-v4.js` | 1146 | Briefing, récap, révision, glossaire |
| `profile-track-v5.js` | 1212 | Sélecteur enrichi, test, promotions |

Chaque couche se désactive en retirant sa balise `<script>` du HTML. Aucune modification du noyau, rollback total possible.

## [2.7] — 2026-04-28

### 🟢 Polish — Cohérence finale post-refactor

#### Modifié
- `sw.js` v25 : ajout de `offline.html`, `og-image.svg`, `favicon.ico`,
  `icon-192.png`, `icon-512.png` dans `STATIC_ASSETS` pour qu'ils soient
  disponibles offline.
- `pwa.manifest.json` : description mise à jour ("64 scénarios" au lieu de "47").
- `index.html` : footer v2.6 → v2.7.
- Workflow `Check questions.yml` renommé en `check-questions.yml`
  (le nom avec espace bloquait le trigger sur self-update).
- 3 scripts obsolètes supprimés : `Check questions.py` (doublon),
  `Generate counts.py` (version cassée), `Inject fiche enhancements.py`
  (référence un fichier mort).

#### Ajouté
- `favicon.ico`, `icon-192.png`, `icon-512.png` à la racine — l'app PWA
  s'installe désormais avec une icône propre sur iOS et Android.
- `scenes/` complet (65 fichiers : index + 64 scènes individuelles).
- `counts.json` régénéré avec la structure complète (clé `tp_exercises`
  restaurée, `tp_categories=25` corrigé).

### 🟡 Refactor — Split de `scenes.js` en `scenes/index.json` + `scenes/{id}.json` (audit P1-C)

`scenes.js` (1.6 MB monolithique) chargeait au boot **toutes les 64 scènes
DFIR avec leurs steps complets**, même si l'utilisateur voulait seulement
voir le lobby.

#### Architecture nouvelle

```
scenes.js (legacy, 1.6 MB)  →  scenes/index.json (~64 KB)
                                 + scenes/{id}.json × 64
                                   (~25 KB chacun, lazy-loadés)
```

| Phase | Avant (v2.6) | Après (v2.7) | Gain |
|---|---|---|---|
| Boot scene.html | 1.6 MB de JS parsé | 64 KB de JSON | **-96 %** |
| RAM au boot | 64 scénarios complets | 64 méta légères | -90 % env. |
| Cache invalidé par 1 modif | 1.6 MB | 25 KB (1 fichier) | -98 % |

#### Ajouté
- `scripts/split_scenes.py` — script Python idempotent qui parse
  `scenes.js` (`var SCENES = [...]`) et génère `scenes/index.json` (méta) +
  `scenes/{id}.json` (contenu complet par scène). À rejouer après chaque
  modif de `scenes.js`.
- `scenes/index.json` (64 KB) — index léger pour le lobby et la recherche.
- `scenes/{id}.json` × 64 — un fichier par scène (10–51 KB).

#### Modifié
- `js/scene-app.js` : nouvelle couche async (`loadSceneIndex`,
  `loadFullScene`, `hydrateScene` avec cache LRU 12). 6 sites de
  `startScene(scene)` patchés pour passer par `hydrateScene` avec gestion
  d'erreur. Compatible legacy : si `scenes.js` est encore chargé, on s'en
  sert en court-circuit.
- `js/cas-in-search.js` : lit `scenes/index.json` en priorité, fallback
  `scenes.js` legacy.
- `scene.html` : balise `<script src="scenes.js">` commentée. L'index est
  chargé à la demande par `scene-app.js`.
- `sw.js` v24-v25 : `scenes/index.json` en network-first, `scenes/{id}.json`
  en cache-first (changent rarement).

`scenes.js` reste conservé comme **fallback legacy**. Suppression prévue
en v3.0 quand le déploiement v2.7 sera stable depuis quelques semaines.

---

## [2.6] — 2026-04-28

### 🟡 Refactor — Extraction du JS inline de `scene.html` (audit P1-B)

`scene.html` contenait **3 256 lignes de JavaScript inline** réparties dans
2 blocs `<script>` (un pour le moteur principal, un pour le UX patch v2).

#### Modifié
- `scene.html` : 5 006 → 1 750 lignes (-65 %, gain ~80 KB cacheable
  séparément). Le bloc 1 (5 lignes — guard `SCENES`) reste inline car il
  sert de bootstrap. Les blocs 2 et 3 sont remplacés par `<script src="...">`.
- `sw.js` v23 : ajoute `js/scene-app.js` et `js/scene-ux-patch.js` à
  `STATIC_ASSETS`.

#### Ajouté
- `js/scene-app.js` (2 561 lignes — moteur principal des scénarios DFIR) :
  storage utils, PRNG Mulberry32, streak/badges, profil, recommandations,
  stats screen + radar, cinema mode, canton map, timeline popup, lobby,
  run scenario.
- `js/scene-ux-patch.js` (731 lignes — UX Patch v2 wrappé en IIFE) :
  injection CSS dynamique, tension bar, glossaire inline, tooltips.

Bit-pour-bit identique au bloc inline original (vérifié par `diff`).
25/25 fonctions appelées par les `onclick="..."` du HTML restent globales.

---

## [2.5] — 2026-04-28

### 🟡 Refactor — Extraction du JS inline de `quiz.html` (audit P1-A)

`quiz.html` contenait **6 558 lignes de JavaScript inline** dans une seule
balise `<script>`. Conséquences avant refactor : chaque correction de typo
dans une explication forçait le navigateur à re-télécharger 365 KB.

#### Modifié
- `quiz.html` : 7 161 → 603 lignes. Le bloc `<script>` inline est remplacé
  par `<script src="js/quiz-app.js" defer></script>`. Aucune logique
  modifiée : le contenu extrait est bit-pour-bit identique à l'original.
- `sw.js` v22 : ajoute `js/quiz-app.js` à `STATIC_ASSETS`.

#### Ajouté
- `js/quiz-app.js` (322 KB) : 95 fonctions, 21 rangs, 41 achievements,
  83 entrées glossaire, modes Examen/Survie/Mission/SM2/Daily, gamification
  XP/streak/combo, share card, focus mode, mode Konami, Double-or-Nothing.

### 🟢 Ajouté — Export/Import de progression (audit P1-D)

Permet aux utilisateurs de sauvegarder toute leur progression dans un
fichier JSON, et de la restaurer dans un autre navigateur ou après
réinstallation.

#### Nouveau fichier `js/cas-in-export.js`

API exposée sur `window.CasInExport` :
- `exportProgress()` — déclenche un téléchargement
  `cas-in-progression-YYYY-MM-DD.json` contenant toutes les clés
  `localStorage` du namespace CAS-IN plus un résumé human-readable.
- `openImportDialog()` — sélecteur de fichier, prévisualise le contenu
  (date, XP, fiches lues, examens…), demande confirmation puis applique.
- `previewImport(json)` — valide un JSON sans rien écrire.

Format versionné `cas-in-progress/v1`. Whitelist stricte (seules les clés
du namespace CAS-IN sont exportées). Aucun appel réseau — tout reste local.

#### UI
- Drawer profil de la landing : 2 nouveaux boutons (`⤓ Exporter` /
  `⤒ Importer`) dans une section dédiée "SAUVEGARDE".

---

## [2.4] — 2026-04-28

### 🔴 Cleanup — Audit qualité massive

#### Supprimé / Corrigé
- **`questions.json`** : 1 750 → 1 630 questions (suppression de
  120 stubs/doublons), thèmes normalisés (10 thèmes canoniques),
  93 anomalies QC → 1 (faux positif EPFL ABC/abc, intentionnel
  pédagogique).
- **`manifest.json`** régénéré : 47 → 90 fiches (les 43 fiches manquantes
  étaient présentes physiquement mais absentes du manifest).
- Hardcodes `1439`, `54`, `18`, `20` (anciens compteurs figés) supprimés
  de tous les HTML/JS — remplacés par `data-count="..."`.
- `js/landing.js` : clé localStorage incohérente corrigée
  (`casIn_questionsSeen` partout), hardcodes supprimés.
- `js/cas-in-search.js` : utilise désormais l'index complet (1 630
  questions + 64 scènes) au lieu de 1 500 questions sans scènes.

#### Ajouté
- `offline.html` — page fallback PWA quand l'utilisateur navigue offline
  vers une page non cachée.
- `og-image.svg` — image de prévisualisation pour les partages sociaux.
- `sw.js` v21 — `STATIC_ASSETS` auto-régénéré depuis `manifest.json`,
  les 90 fiches sont en cache-first.

---

## [2.3] — 2026-04-23

### Ajouté
- `.gitignore` pour ignorer les fichiers OS, éditeurs et fichiers
  temporaires
- `.editorconfig` pour la cohérence d'édition entre éditeurs
- `README.md` documentant l'architecture, les technos et les raccourcis
  clavier
- `CHANGELOG.md` (ce fichier) pour tracer les versions
- `scripts/generate_counts.py` qui génère `counts.json` depuis le
  `manifest.json` et `questions.json`
- `counts.json` — source unique des nombres affichés
- `.github/workflows/check-questions.yml` qui valide `questions.json` et
  régénère `counts.json` à chaque push

---

## [2.2] — 2026-04-22

### Ajouté
- Landing page redesign avec pilules Matrix-style
- `manifest.json` comme source de vérité pour les fiches
- Script `scripts/check_questions.py` pour le QC de `questions.json`
- Workflow GitHub Actions `.github/workflows/check-questions.yml`

### Modifié
- Structure du repo réorganisée (`fiches/`, `tp/`, `style/`, `scripts/`)
- Service Worker v15 avec stratégie Network-First (HTML) +
  Cache-First (statiques)

---

## [2.0 – 2.1] — 2026

Versions initiales avant le grand audit de avril 2026.
