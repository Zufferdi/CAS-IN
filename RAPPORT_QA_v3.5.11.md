# RAPPORT_QA_v3.5.11

**Patch v3.5.11 — Sagas 5 & 6 + 3 fiches sensibles + 102 questions quiz**

Date de finalisation : 2026-06-15

## 📊 Synthèse

| Catégorie | Avant | Après | Delta |
|-----------|-------|-------|-------|
| Sagas (actes JSON) | 476 | 517 | **+41** |
| Fiches HTML | 123 | 136 | **+13** |
| Quiz (questions) | 2'235 | 2'438 | **+203** |
| Glossaire (entrées) | 509 | 551 | **+42** |

## 🎬 Sagas ajoutées

### Saga 5 — "Trame chiffrée" (Ransomware industriel CH)
6 actes — `scenes/trame-*.json`

Précision Métallurgique SA (PMSA), Pieterlen BE, attaquée par affiliate LockBit 3.0. Demande 850k USD BTC en double extorsion. Décision collégiale : non-paiement. Restauration depuis backup Azure clients + reconstruction. Coordination OFCS + GovCERT + MISP-CH.

- Acte 1 : Dimanche 22h17 — détection et premier réflexe IR
- Acte 2 : Lundi 06h scope — sauvegardes audit, LSI signalement 24h
- Acte 3 : Le point d'entrée — phishing 27.09 → IcedID → Cobalt Strike, MITRE ATT&CK
- Acte 4 : Attribution + décision rançon — Mandiant scoring 84/100, triple risque (CP 260ter, 305bis, OFAC)
- Acte 5 : Restauration + négociation TOR — backup 3-2-1-1, CPP 285a-c persona, collecte IOC
- Acte 6 : Tribunal et REX — condamnation par défaut, rapport public OFCS anonymisé

### Saga 6 — "Visages volés" (Cyberviolences mineur)
7 actes — `scenes/visages-*.json`

Léna B., 14 ans, victime de sextorsion par Stéphane W. (28 ans, Renens). Identification OSINT + Meta + LSCPT. Perquisition AFU. Découverte fortuite CSAM massif (1'847 fichiers NCMEC) + 11 autres victimes. Tribunal cumulatif avec première application art. 181b CP.

- Acte 1 : Plainte des parents — CPP 154 audition adaptée, préservation Meta
- Acte 2 : Audition Maison de l'enfance — qualifications cumulées, MLAT US-CH
- Acte 3 : L'identification — triangulation OSINT + Meta + ISP, attention au sosie innocent
- Acte 4 : Perquisition forensique mobile — AFU iPhone, Cellebrite Premium, découverte CSAM
- Acte 5 : Extension multi-victimes — jonction CPP 30, hash matching PhotoDNA/NCMEC, MISP-Europol
- Acte 6 : Tribunal — **1ère application art. 181b CP** (Marine K., 11 mois), LIPM, CP 59
- Acte 7 : REX et accompagnement LAVI long cours — rapport public, prévention, débat art. 197b CP

## 📚 Fiches ajoutées (13)

Forensique technique :
- `alternate_data_streams.html` — ADS NTFS (Gamaredon, Astaroth, LokiBot)
- `apt_attribution_methodology.html` — Mandiant scoring 100pts, Diamond Model
- `forensique_mobile.html` — Cellebrite UFED/Premium, GrayKey, MSAB, checkm8, BFU/AFU
- `forensique_comptable.html` — Excel forensique, méthodes IRS, ratios anormaux
- `forensique_ot_purdue.html` — Purdue model, ICS/SCADA, Triton, Stuxnet

Crypto :
- `forensique_cryptomonnaies.html` — Blockchain, mixers, Tornado Cash, Travel Rule FINMA
- `crypto_suisse_specificites.html` — Crypto Valley, DLT Act 2021, Lugano Plan ₿, SDX FINMA
- `tutoriel_trm_labs.html` — Workflow 6 étapes Search→Trace→Pivot

Droit numérique :
- `nlpd_2023_investigation.html` — nLPD 1.9.2023, PFPDT, art. 24, sanctions 250 kCHF
- `cyberviolences.html` — Art. 181b CP (1.1.2026), sextorsion, deepfakes (TF 6B_122/2024), CSAM

Procédure & coordination :
- `osint_investigatif.html` — Bellingcat, Yandex/TinEye/PimEyes, SunCalc, Maltego
- `requisitions_telecoms_ch.html` — LSCPT, IMSI/IMEI, antennes, CPP 269-279
- `coordination_internationale_ch.html` — EIMP, CEEJ, Budapest, Schengen, Europol

## 🎯 Quiz ajoutés (203 questions)

Répartis dans les chunks par thème :
- Cyberviolences : 14 (nouveau thème)
- Crypto : 15 (renforcé)
- Forensique mobile : 6 (nouveau thème)
- LPD : 6 (nouveau thème)
- Ransomware : 8 (nouveau thème)
- Spécialisé : 17 (renforcé)
- Droit : 19 ajoutés
- OSINT : 13 ajoutés

Total quiz : **2'438 questions**, 14 chunks par thème.

## 🔧 Corrections appliquées

- **CP 282 → CP 181b** : sur-correction d'une confusion fiche OSINT + 2 quiz (CP 282 vise la fraude électorale, pas le stalking)
- **Sur-correction NCSC→OFCS** restaurée dans 12 contextes historiques (anachronisme avant 2024)
- **Référence "art. 11 LRens"** éliminée (numéro non vérifié)
- **Anachronismes "MELANI"** corrigés en "OFCS (ex-NCSC)" pour contexte historique pédagogique
- **Glossaire enrichi** : 42 nouvelles entrées (BFU/AFU, checkm8, PhotoDNA, art. 181b CP, etc.)

## ⚠️ Points sensibles à valider (juridique CH)

1. **Art. 181b CP** (stalking, 1.1.2026) — formulation et éléments constitutifs
2. **Art. 24 al. 6 LPD** — interprétation anti-auto-incrimination
3. **TF 6B_122/2024** — deepfakes pédopornographiques par filtre rajeunissement
4. **Sextorsion cumul** — CP 156 + 179quater + 174 + 197 + 198 + 181b
5. **CPP art. 30 jonction d'instructions** — pratique cantonale multi-cantons
6. **LIPM RS 311.0a interdiction professionnelle** — pédocriminalité
7. **CP 59 traitement institutionnel** — cumul avec peine privative
8. **MLAT US-CH** — délais Meta Emergency Disclosure (24-72h) vs MLAT (4-12 semaines)
9. **Convention Lanzarote art. 23 + réserve CH 2013** — projet art. 197b CP
10. **CPP 154 audition adaptée** — Maison de l'enfance VD Renens + équivalents cantonaux

## 📁 Fichiers modifiés/ajoutés dans le repo

```
fiches/                       +13 fichiers HTML
scenes/                       +41 fichiers JSON
scenes/index.json             régénéré (517 entrées)
data/glossary.json            +42 entrées (509 → 551)
data/questions.json           régénéré (2'438 questions)
data/questions-index.json     régénéré (14 chunks par thème)
data/questions-search.json    régénéré
data/questions/quiz-*.json    14 chunks par thème (re-générés)
pages/arc-2026.html           +1 page additionnelle
```

## 🗑️ Fichiers supprimés (cleanup)

12 fichiers quiz source redondants (intégrés dans les chunks par thème) :
- `quiz-avance.json`
- `quiz-investigation-moderne.json`
- `quiz-mobile-cloud-ransomware.json`
- `quiz-sagas-v8.json`, `quiz-sagas-v8-complement.json`
- `quiz-crypto-v1.json`, `quiz-osint-v1.json`, `quiz-ransomware-saga5-v1.json`
- `quiz-cyberviolences-saga6-v1.json`, `quiz-mobile-lpd-cyberviolences-v1.json`
- `quiz-lacunes-v1.json`, `quiz-systemes-de-fichiers.json` (doublon orthographique)

Le scripts/_archive/ a été préservé (documenté par son README, mémoire historique du projet).

## 🚀 Prochaines pistes (v3.5.12 éventuelle)

- Validation par expert juridique CH des points sensibles ci-dessus
- Tests d'intégration interface (rendu sagas 5 et 6, quiz par thème)
- Sensibilité du sujet saga 6 : éventuelle revue par psychologue LAVI avant publication large

---
*Patch produit en session collaborative — sessions documentées dans `/mnt/transcripts/`.*
