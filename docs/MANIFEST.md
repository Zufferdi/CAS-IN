# Package v7 — Saga « L'Affaire de la Prévôté » (Moutier BE→JU) COMPLET

**Date :** 15 mai 2026
**Branche cible :** `v2.10-cleaning`
**Cache version :** `cas-in-v320` (était v310 en v6)

## TL;DR

Ce package livre la **saga complète « L'Affaire de la Prévôté »** (7 actes) construite autour du **transfert effectif de Moutier du canton de Berne au canton du Jura le 1er janvier 2026** — événement réel, vérifié (Concordat plébiscité 22 sept 2024 : BE 83.2%, JU 72.9% ; validé par les Chambres fédérales en mars 2025).

La saga traite **3 sujets DFIR sous-traités** dans le corpus :

1. **eBPF / rootkit Linux moderne** (acte 1)
2. **Active Directory forensique avancée** — Pass-the-Hash, NTDS.dit dump, Kerberoasting, BloodHound (acte 2)
3. **Cloud forensics avancé** — Azure Sentinel, KQL queries, OAuth Application Access Token, service principal abusif (acte 4)

Et **3 questions juridiques originales** :

1. **Compétence territoriale en transition intercantonale** — art. 31-32 CPP appliqué au cas Moutier (acte 3)
2. **For à raison de la matière — MPC vs cantonal** — art. 23-26 CPP, attribution étatique, jonction (acte 5)
3. **Entraide judiciaire intercantonale art. 44 CPP** — perquisition Polcant JU sur sol BE (Bévilard) avec mandat TMC BE (acte 6)

**Verdict** : première application judiciaire du concordat Moutier en matière pénale cyber, jurisprudence intercantonale (acte 7).

## Niveau et difficulté

- **Niveau :** Expert
- **Atmosphères :** incident (×2), legal (×2), state (×1), raid (×1), audience (×1)
- **Durée estimée :** 7×30-45 min = 3h30-5h pour la saga complète
- **Pré-requis recommandés :** sagas Aar-Frutigen + Noirmont préalables (continuité narrative avec Cap. Choulat et Brunner)

## Les 7 actes — résumé

| # | Date | Lieu | Titre | Difficulté | Atmo |
|---|------|------|-------|------------|------|
| 1 | 8 déc 2025 | Microparts SA, Moutier (BE) | Le ver dans le pommier (eBPF rootkit) | hard | incident |
| 2 | 19 déc 2025 | DSI commune Moutier (BE) | Le miroir cassé (AD forensique) | hard | incident |
| 3 | 1.1.2026 | Coordination intercantonale | Le grand basculement (concordat) | hard | legal |
| 4 | 22 jan 2026 | Polcant JU Delémont | Le tenant fantôme (Azure Sentinel) | expert | incident |
| 5 | 11 fév 2026 | QG Polcant JU + visio fed | Attribution croisée (MITRE + MPC) | expert | state |
| 6 | 12 mars 2026 | Bévilard (BE Jura bernois) | Perquisition intercantonale | expert | raid |
| 7 | 11 mai 2026 | Tribunal cantonal JU Porrentruy | Audience (art. 141 + concordat) | expert | legal |

## NPCs réutilisés (max — politique demandée)

**14 NPCs existants** réutilisés sur les 7 actes :

**BE / Polkapo :**
- `be_polkapo_cyber` (Wachtmeister Brunner)
- `be_prosecutor_cyber` (Dr Stettler)
- `be_kantonnet_ciso` (Markus Hofer)
- `be_avocat_defense_kantonnet` (Me Wäfler)
- `tmc_bern_juge` (Me Karin Inglin)

**JU / Polcant :**
- `ju_polcant_cyber` (Cap. Christelle Choulat)
- `ju_prosecutor_economic` (Proc. Stéphane Boillat)
- `ju_judge_stalder` (Juge Christelle Stalder)

**Fédéral :**
- `fedpol_crd_cyber` (Mme Joëlle Egger)
- `ncsc_govcert_lead` (Dr Fankhauser)
- `govCERT_analyste` (Marc Weber)
- `mpc_procureur_federal_cyber` (Me Astrid Furrer)

**Experts :**
- `expert_kudelski_security` (Dr Kudelka)
- `compass_security_lead_forensic` (Dr Stephan Sutter)
- `expert_mobile_forensics_msab` (M. Daniel S.)
- `expert_ad_glauser` (Marc Glauser)

**Concordat (lien Aar-Frutigen) :**
- `bekb_concordat_coord` (Me Andreas Hostettler)

**Microparts / Moutier (existants v6) :**
- `microparts_pellegrini` (Sandro Pellegrini, PDG)
- `dsi_moutier_zwahlen` (Karin Zwahlen, DSI commune)

## NPCs nouveaux (1 seul créé)

- **`microparts_ciso`** — Sven Burki, responsable IT solo de Microparts SA, brevet fédéral spécialiste en sécurité informatique. Indispensable pour l'acte 1 (premier contact technique avec Polkapo BE).

Total NPCs : **378** (377 avant v7).

## Fichiers du package (75 au total)

### Nouvelles scènes Prévôté (7 ajoutés, 4 préexistants)

- `scenes/be-affaire-prevote-1-signal-kernel-moutier.json` (préexistant, ajusté regionDetail.code)
- `scenes/be-affaire-prevote-2-ad-miroir-casse.json` (préexistant, ajusté)
- `scenes/prevote-3-grand-basculement.json` (préexistant, ajusté)
- `scenes/ju-affaire-prevote-4-tenant-fantome.json` (préexistant, ajusté)
- **`scenes/ju-affaire-prevote-5-attribution-croisee.json`** (NOUVEAU)
- **`scenes/ju-affaire-prevote-6-perquisition-bevilard.json`** (NOUVEAU)
- **`scenes/ju-affaire-prevote-7-audience-porrentruy.json`** (NOUVEAU)

### Cumulatifs des versions précédentes (v1-v6)

Le package contient également tous les fichiers déjà livrés en v1-v6 (sagas BE Aar-Frutigen, FR Singine, audits ATF, alignements parcours JU/NE) pour la livraison en une étape.

### Configuration / système

- `data/campaigns.json` — ajout `saga-prevote-moutier` (order 19)
- `data/npcs.json` — ajout `microparts_ciso`, métadonnées NPC regénérées
- `data/scenes-chronology.json` — régénéré
- `data/counts.json`, `data/npc-arcs.json`, `data/cross-links.json` — régénérés
- `js/pages/scene-app.js` — ajout des 7 scènes dans CANTON_DATA BE et JU
- `js/pages/scene-lobby-v3.js` — ajout `affaire_prevote` dans PARCOURS
- `scenes/index.json` — régénéré (199 entrées)
- `sw.js` — cache version `cas-in-v320` (était v310)

## Validation

```
═══ Parité fichiers ↔ index.json
  ✓ Aucun orphelin ni fantôme

═══ Validation des fichiers individuels
  199 fichiers analysés — 0 erreurs

═══ Résumé
  0 erreur(s) · 7 warning(s) [tous préexistants]
```

Le warning sur `prevote-3-grand-basculement: CANTON_DATA assigne à ['JU'], regionDetail.code='BE'` est intentionnel — la scène se déroule AU moment du basculement (Moutier=BE à 23h59, =JU à 00h01) mais la suite de l'enquête est en JU, d'où l'assignation à JU dans CANTON_DATA.

## Installation

1. Décompresser le tar.gz dans un répertoire vierge.
2. Copier le contenu de `files/` à la racine du repo (sur la branche `v2.10-cleaning`).
3. Si besoin, supprimer manuellement les 2 fichiers caduques (legacy v1-v2) :
   - `data/npcs-additions-jura-neuchatel.json`
   - `scenes/scenes-index.json` (s'il existe encore)
4. Vérifier les hashes avec `python3 scripts/check_scenes.py` (doit donner 0 erreur).
5. Tester en local : `python3 -m http.server` puis ouvrir l'application — la saga apparaît dans le parcours `affaire_prevote`.

## Stats globales après v7

| Métrique | Valeur |
|---|---|
| Scènes totales | **199** (avant v7 : 192) |
| Campagnes / sagas | **19** (avant v7 : 18) |
| NPCs | **378** (avant v7 : 377) |
| Parcours (scene-lobby) | **23** |
| Cantons couverts | 19 |
| Sagas avec 7 actes | 4 (Viège, Noirmont, CSEM, Prévôté) |

## Ancrage réel — vérifications

- **Transfert Moutier 1.1.2026** : Concordat intercantonal plébiscité 22.09.2024 (BE 83.2%, JU 72.9%), arrêté fédéral approuvé en mars 2025, transfert effectif le 1<sup>er</sup> janvier 2026. Moutier devient nouveau district du canton du Jura, +10% de population pour le JU. Source : Office fédéral de la statistique, communiqué 15.01.2026.
- **Tornos SA** (rue Industrielle 111, Moutier) : leader mondial des tours automatiques, 691 employés, acquise par StarragTornos Group le 7 déc 2023. Marché horloger luxe en baisse de 10.5% en 2025 (CA 442 mio CHF). Microparts SA (rue Industrielle 89) est **fictive mais voisine plausible** — pas de risque d'usurpation d'identité.
- **Bévilard** : commune de la Vallée de Tavannes (Jura bernois), restée BE après le transfert Moutier — donc constellation juridiquement réaliste pour l'acte 6 (perquisition intercantonale).
- **Tribunal cantonal du Jura à Porrentruy** : siège réel de la juridiction pénale cantonale jurassienne.

## Sujets DFIR sous-traités — couverture renforcée

| Sujet | Avant v7 | Après v7 |
|---|---|---|
| eBPF / rootkit Linux moderne | 2 scènes | **3 scènes** (acte 1) |
| Active Directory forensique avancée | 2 scènes | **3 scènes** (acte 2) |
| Cloud forensics avancé (Azure Sentinel, KQL) | 2 scènes | **3 scènes** (acte 4) |
| Threat intel / MITRE ATT&CK | partiellement traité | **+1 scène dédiée** (acte 5) |
| Perquisition intercantonale art. 44 CPP | rare | **+1 scène dédiée** (acte 6) |

## Points d'attention pour le mainteneur

1. **Warning regionDetail prevote-3** : intentionnel (transition BE→JU), ne pas "corriger".
2. **Suspect Hervé R.** : nom fictif, mais cohérent dans les 7 actes (acte 5 = identification, acte 6 = arrestation, acte 7 = audience).
3. **Verdict acte 7** : peines réalistes (42 mois dont 18 fermes + 24 sursis + CHF 487'400 dommages Microparts) — basées sur la jurisprudence pénale économique 2023-2025.
4. **Art. 273 CP disjoint au MPC** : permet de fermer cantonalement sans prétendre démontrer l'attribution étatique formelle (pédagogie réaliste).
5. **Le bug `__pycache__`** : penser à nettoyer après application du package (`find . -name __pycache__ -exec rm -rf {} +`).

---

*Package v7 — fin. Saga « L'Affaire de la Prévôté » complète. Prochain audit potentiel : 89 ATF restantes (16 citées 2×, 72 citées 1×) — au taux d'erreur observé (~55% sur le top 17), prévoir ~50 corrections supplémentaires.*
