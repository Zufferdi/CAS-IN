#!/usr/bin/env python3
"""
apply_saga_data_brokers.py — CAS-IN Saga « Mes pas vendus »

CONTEXTE
────────
Saga 7 actes ancrée dans le journalisme-OSINT vie privée + surveillance commerciale.
POV : Mme Sarah Cottet, 36 ans, reporter ABE (À Bon Entendeur) RTS Genève, HEIG-VD
+ Master ICM HEC Lausanne, 12 ans investigation consommation grand public (continuité
saga données-brocante 2026 — 2ème continuité de protagoniste au catalogue CAS-IN
après Yann Chappuis Shadow Fleet 2027 → Or russe 2028). Post-données-brocante :
expertise OSINT vie privée + surveillance commerciale + ancrage public RTS ABE
service public romand.

Trame : Genève 4 septembre 2028 09h30. Mme A. Hofer (enseignante VD Yverdon ~45 ans,
viewer ABE fidèle) email ABE RTS : pubs hyper-ciblées contraception post-visite
gynéco Genève + asymétrie conjugale (mari même Wi-Fi Salt aucune pub similaire) =
signature data brokers européens. Linda Bourget (rédactrice ABE) cadre pitch
systémique : viewer trigger + enquête data brokers européens grand public CH.
Cottet réactive cellule sécurité RTS (Bürkler investigation + Vidal juriste +
Schmidt sécurité IT + Lapierre santé psychosociale) + doctrine victim-first
INVERSÉE (innovation majeure : Cottet devient identifieur, protection personnes
identifiées PAR le journaliste). Comité éthique externe UNIL Prof. Sami Coll
(sociologie surveillance) 25K CHF mandat indépendant pouvoir veto. Avocate
indépendante Me Laurence Burgener mandat élargi (continuité 3 sagas Shadow Fleet
+ Or russe + Mes pas vendus). Précédent Pillar 2021 ANTI-MODÈLE explicite
(outing forcé Mgr Burrill Grindr data = à ne JAMAIS reproduire).

Enquête 8 mois (septembre 2028 - mai 2029) consortium 9 partenaires :
RTS lead francophone (Cottet + ABE) + Tamedia SonntagsZeitung lead alémanique
(Catherine Boss continuité Shadow Fleet + Or russe) + Tagesspiegel Berlin Data
team + Le Monde Pixels Paris + The Markup US (Aaron Sankin équivalent) +
Privacy International London (Edin Omanovic) + Digitale Gesellschaft CH Zurich
(Erika Dornbierer) + noyb Vienna (Max Schrems) + AlgorithmWatch CH (Angela
Müller continuité police prédictive) + EPFL DEDIS (Pr. Bryan Ford + Iris
Krähenbühl continuité police prédictive).

Méthodologie quadruple intégrée :
(1) Achat 5 datasets data brokers européens (Predicio Paris 17K EUR + Tamoco UK
+ Adsquare Berlin + Place IQ Boston/Dublin + Spectrico Estonie/Berlin remplace
Veraset Londres refus post-FTC X-Mode 2024) — 14M points géolocalisation CH
total budget 84K CHF, nLPD art. 31 + RGPD art. 6+85 exception journalistique,
OPSEC Tails+VeraCrypt+air-gap.
(2) Clustering DBSCAN/K-means EPFL DEDIS (Pr. Ford + Krähenbühl) 52 candidats
CH → 48 validés → 5 cas pilote diversifiés.
(3) Audit SDK apps populaires CH (mitmproxy + reverse APK statique EPFL DEDIS) :
PostFinance + SBB Mobile + MeteoSwiss + Coop Supercard + Migros + Swisscom +
Sympany/Helsana + apps gouvernementales tax/services publics — ~30-50 SDKs
publicitaires/analytics problématiques identifiés (Google AdMob + Meta SDKs +
AppLovin + Mixpanel + Bytedance/TikTok + Yandex + Adjust + AppsFlyer + Branch
+ autres).
(4) Plainte conjointe PFPDT (Adrian Lobsiger) + Préposé cantonal protection
données ZH + noyb Vienna procédures RGPD coordonnées CNIL+AEPD+Garante+DPC+BfDI
+ Aebischer-Schwab CN PS GE plaignante individuelle anonymisée pilote.

Approche victim-first INVERSÉE : 5 cas pilote diversifiés (Mme Aebischer-Schwab
CN PS GE participation pleine filmée + M. Dégueldre juge TF Lausanne témoignage
écrit + Maj. Müller officier DDPS Worb BE cas alternatif post-Col. Steiger
refus respecté + M. Hügli journaliste Tamedia informatif sans publication +
Dre Imboden médecin psy HUG Genève participation pleine), Burgener-Lapierre-Coll
standby, consentements éclairés délai réflexion 2-3 semaines, anonymisation
publication par défaut absolue.

Confrontation ~25 entités : 5 brokers européens + ~20 apps CH + adtech géants
(Google AdMob + Meta + AppLovin + TikTok + AppsFlyer) + PFPDT + DFJP + DDPS SRC
art. 6 LRens + Office fédéral statistique. Envoi simultané ~25 lettres droit
réponse multilingues. Publication coordonnée 7 mai 2029 06h00 UTC (1 an
symbolique post-Or russe) : RTS multi-canaux ABE spécial 52 min + Mise au point
26 min + Le 19h30 + dossier digital + Tamedia SonntagsZeitung + Tagesspiegel +
Le Monde + The Markup.

Suites institutionnelles 12 mois post-publication :
- PFPDT enforcement 32M CHF cumul amendes 5 brokers européens + injonctions
  cessation activité CH 4/5 + obligations suppression datasets historiques CH.
- noyb CJEU C-XXX/2030 Schrems victoire 14 février 2030 — 1er précédent
  européen data brokers + RGPD art. 6 illégalité collecte SDK mobile sans
  consentement granulaire spécifique + amendes coordonnées CNIL+AEPD+Garante+
  DPC+BfDI.
- Motion 26.3217 CN extension supervision data brokers (Aebischer-Schwab +
  47 co-signataires interpartis) adoptée CN 142-38 + CE 32-12 + registre PFPDT
  data brokers actifs CH créé.
- LRens art. 6 clarification Conseil fédéral message 2030 exclusion explicite
  SRC achat data brokers commerciaux.
- ePrivacy CH alignement UE Conseil fédéral mandate OFCOM+PFPDT projet loi 2031.
- Jurisprudence Bürgi-Brawand-Egeler-Egger-Hodel TF 5/5 arrêts cas pilote 2029.

Reconnaissance :
- European Press Prize Investigative Reporting 2030 (lauréat consortium 9 partenaires).
- Online Journalism Awards (USA) Excellence in Privacy Reporting 2030.
- Swiss Press Award Investigation 2030.
- Edward Snowden Privacy Award 2030 Honourable Mention (équipe).

Article scientifique conjoint : « Buying Surveillance: Forensic Methodology for
Investigative Identification of Individuals via European Commercial Data Brokers »
— Cottet (corresponding) + Ford + Krähenbühl + Coll + Dornbierer + Omanovic —
Privacy Enhancing Technologies (PETS) 2030 Issue 4 + ACM SIGCAS 2030 Tampa
Florida USA.

Refus opportunités carrière : Privacy International London « Head of Investigations
Commercial Surveillance Europe » (180K GBP, salaire) refusé + acceptation
hybride consultant externe 20% PI + EPFL DEDIS associate research 10% + ABE
70% (équilibre continuité ABE service public romand + transmission internationale
doctrine victim-first INVERSÉE + santé psychosociale soutenable Lapierre + famille
Lausanne préservée).

Masterclass MAZ Lucerne juin 2030 COMMUNE 5 profils journaliste-OSINT/DFIR CH
consolidés (3ème année consécutive depuis inauguration juin 2028 police prédictive) :
Béguin DFIR mobile (Pegasus 2026) + Pellaton OSINT crimes guerre (Yémen 2027) +
Chappuis OSINT financier-maritime étendu précieux (Shadow Fleet 2027 + Or russe
2028, 1ère continuité protagoniste) + Rochat DFIR civic tech (police prédictive
2028) + Cottet OSINT vie privée + surveillance commerciale (données-brocante
2026 + Mes pas vendus data brokers 2029, 2ème continuité protagoniste) =
palette CH unique en Europe.

INNOVATION
──────────
1. Deuxième continuité de protagoniste au catalogue CAS-IN
   (Sarah Cottet : données-brocante 2026 → Mes pas vendus data brokers 2029)
2. Cinquième profil journaliste-OSINT/DFIR CH consolidé
   (OSINT vie privée + surveillance commerciale)
3. Premier angle data brokers grand public CH au catalogue
4. Première application achat-puis-identification journalisme civic CH
   (NYT Privacy Project 2019 adapté CH)
5. Doctrine victim-first INVERSÉE codifiée RTS référence MAZ formation tous
   médias CH (innovation éthique majeure : journaliste identifieur protège
   personnes identifiées par enquête elle-même)
6. Comité éthique externe UNIL Prof. Sami Coll avec pouvoir veto (1er catalogue)
7. Précédent Pillar 2021 explicitement ANTI-MODÈLE (outing forcé Mgr Burrill
   Grindr data = à ne JAMAIS reproduire)
8. Méthodologie quadruple intégrée (achat datasets + clustering DBSCAN/K-means
   + audit SDK mobile + démonstration concrète + plainte conjointe PFPDT+noyb)
9. 1er précédent européen data brokers via noyb CJEU C-XXX/2030 Schrems
10. 5 profils journaliste-OSINT/DFIR CH consolidés acte 7 (Béguin + Pellaton +
    Chappuis + Rochat + Cottet) = palette unique en Europe occidentale

ARC NARRATIF
────────────
1. Le mail d'une enseignante                  — Sept 2028, Hofer + ABE + cellule
2. Cinq datasets, deux continents             — Oct-déc 2028, acquisition légale
3. De 14 millions de points à cinq personnes  — Jan-mars 2029, clustering EPFL
4. Les SDK qui voient tout                    — Mars 2029, audit apps CH
5. Lobsiger entend Vienne                     — Avril 2029, PFPDT + noyb plainte
6. Quarante lettres, neuf médias, un précédent — Avril-mai 2029, confrontation
7. Doctrine vie privée + surveillance commerciale — Mai 2030, bilan 1 an + 5 profils CH

ACTIONS DU SCRIPT
─────────────────
1. Copie les 7 scènes JSON dans scenes/
2. Injecte l'entry saga dans data/campaigns.json (dédup par id)
3. Bump SW v{n} → v{n+1} (cumulatif)
4. Régénère search-index, counts, README

IDEMPOTENT — Skip si scènes déjà présentes, skip si entry déjà dans campaigns,
skip si SW déjà bumpé pour cette saga.
"""
import os
import re
import sys
import json
import shutil
import subprocess
from pathlib import Path


def find_root():
    here = Path(__file__).resolve().parent
    for c in (here, here.parent):
        if (c / 'sw.js').exists() and (c / 'quiz.html').exists():
            return c
    print('[error] Racine CAS-IN introuvable.', file=sys.stderr)
    sys.exit(1)


def log(s, m):
    print(f'  {s} {m}')


SAGA_ID = 'saga-data-brokers-ch'
SAGA_ENTRY = {
    "id": SAGA_ID,
    "icon": "📍",
    "title": "Mes pas vendus — Une enquête ABE RTS",
    "subtitle": "Saga 7 actes · POV journaliste-OSINT vie privée + surveillance commerciale RTS ABE · Data brokers européens + 14M points géoloc CH + clustering EPFL DEDIS + audit SDK apps CH + consortium 9 partenaires",
    "description": (
        "Saga OSINT ancrée dans le journalisme-OSINT vie privée + surveillance "
        "commerciale (extension données-brocante 2026 — 2ème continuité de "
        "protagoniste au catalogue CAS-IN après Yann Chappuis Shadow Fleet 2027 → "
        "Or russe 2028). Inspirée NYT Privacy Project décembre 2019 (Stuart Thompson "
        "+ Charlie Warzel, 12M personnes US tracées via app data — modèle "
        "méthodologique référent), Pillar 2021 (outing forcé Mgr Burrill Grindr "
        "data — ANTI-MODÈLE éthique explicite à ne JAMAIS reproduire), Motherboard/"
        "Vice Locate-X 2020 (vente militaire US données mobiles civils), Bloomberg "
        "Anomaly Six 2022 (surveillance via app SDKs), X-Mode/Outlogic FTC settlement "
        "janvier 2024 (interdiction vente US), 404 Media Joseph Cox 2024-2026, "
        "Atlas Privacy 2024 CH (précédent légal CH). Genève 4 septembre 2028 09h30 : "
        "Mme A. Hofer (enseignante VD Yverdon ~45 ans, viewer ABE fidèle) email "
        "ABE RTS — pubs hyper-ciblées contraception post-visite gynéco Genève + "
        "asymétrie conjugale (mari même Wi-Fi Salt aucune pub similaire) = "
        "signature data brokers européens. POV : Mme Sarah Cottet, 36 ans, "
        "reporter ABE RTS Genève, HEIG-VD + Master ICM HEC Lausanne, 12 ans "
        "investigation consommation grand public (continuité saga données-brocante "
        "2026). Cellule sécurité RTS réactivée (continuité 5 sagas) : Pierre "
        "Bürkler (RTS investigation continuité 5 sagas) + Catherine Vidal "
        "(juriste RTS) + Daniel Schmidt (sécurité IT RTS) + Marianne Lapierre "
        "(santé psychosociale) + Linda Bourget (rédactrice ABE) + Pr. Sami Coll "
        "(UNIL sociologie surveillance comité éthique externe pouvoir veto, "
        "25K CHF mandat indépendant — 1er catalogue). Avocate indépendante Me "
        "Laurence Burgener mandat élargi (continuité 3 sagas Shadow Fleet + "
        "Or russe + Mes pas vendus) protection personnes identifiées PAR "
        "enquête. Précédent Pillar 2021 ANTI-MODÈLE explicite rappelé chaque "
        "acte enquête et chaque cohorte Masterclass MAZ. Enquête 8 mois "
        "(septembre 2028 - mai 2029) avec consortium 9 partenaires : RTS lead "
        "francophone (Cottet + ABE) + Tamedia SonntagsZeitung lead alémanique "
        "(Catherine Boss continuité Shadow Fleet + Or russe) + Tagesspiegel "
        "Berlin Data team + Le Monde Pixels Paris + The Markup US (Aaron "
        "Sankin équivalent) + Privacy International London (Edin Omanovic) + "
        "Digitale Gesellschaft CH Zurich (Erika Dornbierer) + noyb Vienna "
        "(Max Schrems) + AlgorithmWatch CH (Angela Müller continuité police "
        "prédictive) + EPFL DEDIS (Pr. Bryan Ford + doctorante Iris Krähenbühl "
        "continuité police prédictive). Méthodologie quadruple intégrée "
        "innovation : (1) Achat 5 datasets data brokers européens — Predicio "
        "Paris 17K EUR (Antoine Dubrille) + Tamoco UK + Adsquare Berlin + Place "
        "IQ Boston/Dublin + Spectrico Estonie/Berlin (remplace Veraset Londres "
        "Thomas Whitfield refus documenté post-FTC X-Mode 2024) — 14M points "
        "géolocalisation CH total budget 84K CHF, nLPD art. 31 + RGPD art. "
        "6+85 exception journalistique, OPSEC Tails+VeraCrypt+air-gap, audit "
        "comité éthique externe UNIL Coll veto pré-acquisition; (2) Clustering "
        "DBSCAN/K-means EPFL DEDIS (Pr. Bryan Ford + Iris Krähenbühl) — "
        "patterns résidence/travail/déplacements heures contextuelles — 52 "
        "candidats CH initiaux → 48 validés cross-check → 5 cas pilote "
        "diversifiés sélectionnés : Mme Aebischer-Schwab (CN PS GE) "
        "participation pleine filmée + M. Dégueldre (juge TF Lausanne) "
        "témoignage écrit + Maj. Müller (officier DDPS Worb BE) cas alternatif "
        "post-Col. Steiger refus respecté + M. Hügli (journaliste Tamedia "
        "Zurich) informatif sans publication + Dre Imboden (médecin psy HUG "
        "Genève) participation pleine — consentements éclairés délai réflexion "
        "2-3 semaines + Burgener-Lapierre-Coll standby + anonymisation "
        "publication par défaut absolue; (3) Audit SDK apps populaires CH "
        "(mars 2029) — capture mitmproxy + reverse APK statique EPFL DEDIS — "
        "PostFinance + SBB Mobile + MeteoSwiss + Coop Supercard + Migros + "
        "Swisscom + Sympany/Helsana + apps gouvernementales tax/services "
        "publics — ~30-50 SDKs publicitaires/analytics problématiques "
        "identifiés (Google AdMob + Meta SDKs + AppLovin + Mixpanel + "
        "Bytedance/TikTok + Yandex + Adjust + AppsFlyer + Branch + autres) — "
        "tracking pipeline complet app → SDK → broker européen → marché; (4) "
        "Plainte conjointe PFPDT (Adrian Lobsiger) + Préposé cantonal "
        "protection données ZH + noyb Vienna (Max Schrems) procédures RGPD "
        "coordonnées CNIL France + AEPD Espagne + Garante Italie + DPC "
        "Irlande + BfDI Allemagne + Aebischer-Schwab CN PS GE plaignante "
        "individuelle anonymisée pilote — 1er précédent jurisprudentiel CH "
        "data brokers + procédures parallèles CH/UE. Doctrine victim-first "
        "INVERSÉE codifiée RTS référence MAZ (innovation éthique majeure : "
        "Cottet/ABE devient identifieur, protection personnes identifiées PAR "
        "le journaliste — anti-Pillar 2021) — 4 piliers : Burgener mandat "
        "avocat indépendant pouvoir veto + Lapierre santé psychosociale + "
        "Coll comité éthique externe UNIL pouvoir veto + délai réflexion 2-3 "
        "semaines consentement éclairé + anonymisation publication par défaut "
        "absolue. Confrontation élargie ~25 entités : 5 brokers européens "
        "(Predicio Paris + Tamoco UK + Adsquare Berlin + Place IQ Boston/Dublin "
        "+ Spectrico Estonie/Berlin) + ~20 apps CH (PostFinance + SBB Mobile + "
        "MeteoSwiss + Coop + Migros + Swisscom + Sympany/Helsana + apps "
        "gouvernementales + autres) + adtech géants (Google AdMob + Meta SDKs "
        "+ AppLovin + TikTok + AppsFlyer + Branch) + PFPDT + DFJP + DDPS SRC "
        "art. 6 LRens + Office fédéral statistique. Envoi simultané ~25 "
        "lettres droit réponse multilingues 5 langues. Publication coordonnée "
        "7 mai 2029 06h00 UTC (1 an symbolique post-Or russe 7 mai 2028) — "
        "RTS multi-canaux ABE spécial 52 min + Mise au point 26 min + Le "
        "19h30 + dossier digital + Tamedia SonntagsZeitung + Tagesspiegel + "
        "Le Monde + The Markup. Suites institutionnelles exceptionnelles 12 "
        "mois post : PFPDT enforcement 32M CHF cumul amendes 5 brokers "
        "européens (Predicio 9M + Tamoco 7M + Adsquare 6M + Place IQ 5M + "
        "Spectrico 5M) + injonctions cessation activité CH 4/5 + obligations "
        "suppression datasets historiques CH + noyb CJEU C-XXX/2030 Schrems "
        "victoire 14 février 2030 (1er précédent européen data brokers + "
        "RGPD art. 6 illégalité collecte SDK mobile sans consentement "
        "granulaire spécifique + amendes coordonnées CNIL+AEPD+Garante+DPC+BfDI) "
        "+ Motion 26.3217 CN extension supervision data brokers (Aebischer-Schwab "
        "+ 47 co-signataires interpartis) adoptée CN 142-38 + CE 32-12 + "
        "registre PFPDT data brokers actifs CH créé + LRens art. 6 "
        "clarification Conseil fédéral message 2030 exclusion explicite SRC "
        "achat data brokers commerciaux + audit Délégation parlementaire SRC "
        "ad hoc + ePrivacy CH alignement UE Conseil fédéral mandate OFCOM + "
        "PFPDT projet loi 2031 + jurisprudence Bürgi-Brawand-Egeler-Egger-Hodel "
        "TF 5/5 arrêts cas pilote 2029 (codification doctrine consentement "
        "éclairé délai réflexion + protection identification involontaire "
        "géolocalisation). Reconnaissance : European Press Prize "
        "Investigative Reporting 2030 (3ème année consécutive CH 2028-2029-2030 "
        "post-Shadow Fleet 2027 + Or russe 2028, lauréat consortium 9 "
        "partenaires) + Online Journalism Awards (USA) Excellence in Privacy "
        "Reporting 2030 + Swiss Press Award Investigation 2030 + Prix "
        "Schweizer Journalist:in du Jahr 2030 Cottet finaliste + Hillman "
        "Prize for Journalism 2030 USA nominée + Edward Snowden Privacy "
        "Award 2030 Honourable Mention (équipe). Article scientifique "
        "conjoint 6 auteurs : « Buying Surveillance: Forensic Methodology "
        "for Investigative Identification of Individuals via European "
        "Commercial Data Brokers » — Cottet (RTS ABE, corresponding) + Ford "
        "(EPFL DEDIS) + Krähenbühl (EPFL DEDIS doctorante) + Coll (UNIL "
        "sociologie surveillance comité éthique) + Dornbierer (Digitale "
        "Gesellschaft) + Omanovic (Privacy International) — Privacy "
        "Enhancing Technologies (PETS) 2030 Issue 4 octobre 2030 (H5-index 35) "
        "+ ACM SIGCAS Conference on Computers and Society 2030 Tampa Florida "
        "USA octobre 2030 — référence académique mondiale méthodologie "
        "victim-first INVERSÉE journalisme-OSINT vie privée. Refus "
        "opportunités carrière (continuité Chappuis Or russe 2029 modèle) : "
        "Privacy International London Head of Investigations Commercial "
        "Surveillance Europe (180K GBP poste salarié refusé fidélité ABE "
        "service public romand + cellule sécurité RTS continuité 5 sagas + "
        "famille Lausanne + transition Bourget-Meyer mentorat 18 mois mars "
        "2030 - décembre 2031 + santé psychosociale Lapierre validation "
        "clinique) + acceptation hybride consultant externe 20% Privacy "
        "International (60K GBP/an, encadrement 2-3 enquêtes data brokers "
        "européennes/an Berlin/Athens/Madrid/Bucharest + supervision "
        "méthodologique cohorte chercheurs PI) + EPFL DEDIS associate "
        "research 10% (10K CHF/an, 1 article/an + supervision doctorante "
        "junior + accès lab DEDIS continuité Krähenbühl) + ABE 70% (105K "
        "CHF, continuité service public romand). Masterclass MAZ Lucerne "
        "juin 2030 COMMUNE 5 profils journaliste-OSINT/DFIR CH consolidés "
        "(3ème année consécutive depuis inauguration juin 2028 saga police "
        "prédictive) : Béguin DFIR mobile (saga Pegasus 2026) + Pellaton "
        "OSINT crimes guerre (saga Yémen 2027) + Chappuis OSINT financier-"
        "maritime étendu précieux (sagas Shadow Fleet 2027 + Or russe 2028, "
        "1ère continuité protagoniste) + Rochat DFIR civic tech (saga "
        "Police prédictive 2028) + Cottet OSINT vie privée + surveillance "
        "commerciale (sagas données-brocante 2026 + Mes pas vendus data "
        "brokers 2029, 2ème continuité protagoniste) = palette CH unique en "
        "Europe occidentale. 30 journalistes investigation CH tous médias "
        "sélectionnés cohorte 2030 (Republik + Heidi.news + WOZ + "
        "Hochparterre + Tsüri.ch + Watson + RTS + Tamedia + Le Temps + 24 "
        "heures + Tribune Genève + Blick + Aargauer Zeitung + Berner "
        "Zeitung + St. Galler Tagblatt + Walliser Bote + Bündner Tagblatt + "
        "Corriere del Ticino) — bourse mixte OFCOM + Migros + Hirschmann + "
        "RTS finance 30 journalistes participants gratuit. Coordinatrice "
        "MAZ Mme Eveline Saupper (directrice formation continue 18 ans MAZ). "
        "Innovation : 2ème continuité protagoniste catalogue CAS-IN (Cottet : "
        "données-brocante → Mes pas vendus, après Chappuis Shadow Fleet → Or "
        "russe), 5ème profil journaliste-OSINT/DFIR CH consolidé (OSINT vie "
        "privée + surveillance commerciale), 1er angle data brokers grand "
        "public CH au catalogue, 1ère application achat-puis-identification "
        "journalisme civic CH (NYT Privacy Project 2019 adapté), doctrine "
        "victim-first INVERSÉE codifiée RTS référence MAZ formation tous "
        "médias CH (innovation éthique : journaliste identifieur protège "
        "personnes identifiées PAR enquête), comité éthique externe UNIL Coll "
        "pouvoir veto (1er catalogue), précédent Pillar 2021 explicitement "
        "ANTI-MODÈLE, méthodologie quadruple intégrée (achat datasets + "
        "clustering DBSCAN/K-means + audit SDK mobile + plainte conjointe "
        "PFPDT+noyb), 1er précédent européen data brokers via noyb CJEU "
        "C-XXX/2030 Schrems, 5 profils journaliste-OSINT/DFIR CH consolidés "
        "(palette unique en Europe occidentale). Continuité narrative dense "
        "(6 sagas successives : Pegasus + Yémen + Shadow Fleet + police "
        "prédictive + Or russe + Mes pas vendus) : RTS cellule sécurité "
        "(Bürkler + Vidal + Schmidt + Lapierre) + Burgener avocate "
        "indépendante 3 sagas + Bourget rédactrice ABE 12 ans + Boss "
        "Tamedia Shadow Fleet + Or russe + Mes pas vendus + Müller "
        "AlgorithmWatch police prédictive + Ford + Krähenbühl EPFL DEDIS "
        "police prédictive + Wormser DFAE 5 sagas + Wertheimer DFAE Shadow "
        "Fleet + Or russe + Müller DFJP police prédictive + Aebischer-Schwab "
        "CN PS GE motion 26.3217 nouvelle + 5 profils journaliste-OSINT/DFIR "
        "CH consolidés acte 7."
    ),
    "level": "expert",
    "narrative": True,
    "scenes": [
        "ch-affaire-data-brokers-1-enquete-abe",
        "ch-affaire-data-brokers-2-acquisition-datasets",
        "ch-affaire-data-brokers-3-clustering-identification",
        "ch-affaire-data-brokers-4-audit-sdk-apps",
        "ch-affaire-data-brokers-5-pfpdt-plainte-conjointe",
        "ch-affaire-data-brokers-6-confrontation-publication",
        "ch-affaire-data-brokers-7-bilan-doctrine"
    ],
    "hook": "Sept actes. Le mail d'une enseignante d'Yverdon. Cinq datasets, quatorze millions de points. Cinquante-deux candidats, cinq personnes identifiées. Plainte conjointe Berne et Vienne. Deuxième continuité de protagoniste. Doctrine victim-first INVERSÉE.",
    "kind": "saga"
}


def step_1_copy_scenes(root):
    print('\n[1/5] Copie des 7 scènes data brokers dans scenes/')
    src_dir = Path(__file__).parent.parent / 'scenes'
    if not src_dir.exists():
        src_dir = Path(__file__).parent / 'scenes'
    if not src_dir.exists():
        log('❌', 'Dossier scenes/ source introuvable dans bundle')
        sys.exit(1)

    dst_dir = root / 'scenes'
    dst_dir.mkdir(exist_ok=True)

    copied = skipped = 0
    for f in sorted(src_dir.glob('ch-affaire-data-brokers-*.json')):
        target = dst_dir / f.name
        if target.exists():
            existing = json.load(open(target))
            new = json.load(open(f))
            if existing.get('id') == new.get('id') and existing.get('title') == new.get('title'):
                skipped += 1
                continue
        shutil.copy2(f, target)
        copied += 1

    if copied:
        log('✅', f'{copied} scènes copiées ({skipped} déjà présentes)')
    else:
        log('⏭ ', f'Toutes les {skipped} scènes déjà présentes')


def step_2_inject_campaign(root):
    print('\n[2/5] Injection entry saga dans data/campaigns.json')
    cjs = root / 'data' / 'campaigns.json'
    if not cjs.exists():
        log('❌', 'data/campaigns.json introuvable')
        sys.exit(1)

    data = json.load(open(cjs))
    camps = data if isinstance(data, list) else data.get('campaigns', data)

    existing_ids = {c.get('id') for c in camps}
    if SAGA_ID in existing_ids:
        log('⏭ ', f'Saga {SAGA_ID} déjà présente dans campaigns.json')
        return

    max_order = max((c.get('order', 0) for c in camps), default=0)
    entry = dict(SAGA_ENTRY)
    entry['order'] = max_order + 1

    camps.append(entry)

    if isinstance(data, dict):
        data['campaigns'] = camps

    with open(cjs, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')
    log('✅', f'Saga ajoutée avec order={entry["order"]}, total campagnes: {len(camps)}')


def step_3_bump_sw(root):
    print('\n[3/5] Bump SW → v+1')
    p = root / 'sw.js'
    with open(p, encoding='utf-8') as f:
        sw = f.read()
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    if 'saga-data-brokers-ch' in sw or '// Saga Mes pas vendus' in sw:
        log('⏭ ', f'SW déjà bumpé pour la saga Mes pas vendus (cas-in-v{current})')
        return
    new_v = current + 1
    bump = (
        f"// v{new_v} — 2026-06-02 — Bump SW v{current} → v{new_v}\n"
        f"// Saga Mes pas vendus « Data brokers géolocalisation » — 7 actes · 35 étapes · 105 choix\n"
        f"// saga-data-brokers-ch — POV journaliste-OSINT vie privée + surveillance commerciale\n"
        f"// Sarah Cottet (ABE RTS reporter consommation, continuité saga données-brocante 2026)\n"
        f"// DEUXIÈME CONTINUITÉ DE PROTAGONISTE AU CATALOGUE CAS-IN\n"
        f"//   (Cottet : données-brocante 2026 → Mes pas vendus data brokers 2029)\n"
        f"//   après Chappuis (Shadow Fleet 2027 → Or russe 2028, 1ère continuité)\n"
        f"// CINQUIÈME PROFIL JOURNALISTE-OSINT/DFIR CH CONSOLIDÉ acte 7 :\n"
        f"//   Béguin DFIR mobile + Pellaton OSINT crimes guerre + Chappuis OSINT financier-maritime\n"
        f"//   précieux + Rochat DFIR civic tech + Cottet OSINT vie privée + surveillance commerciale\n"
        f"//   = palette CH unique en Europe occidentale\n"
        f"// Innovation : 1er angle data brokers grand public CH au catalogue\n"
        f"// 1ère application achat-puis-identification journalisme civic CH (NYT Privacy Project\n"
        f"//   décembre 2019 adapté CH — Stuart Thompson + Charlie Warzel 12M personnes US tracées)\n"
        f"// Doctrine victim-first INVERSÉE codifiée RTS référence MAZ formation tous médias CH\n"
        f"//   (innovation éthique majeure : journaliste identifieur protège personnes identifiées\n"
        f"//   PAR l'enquête elle-même — anti-Pillar 2021)\n"
        f"// Pillar 2021 ANTI-MODÈLE explicite (outing forcé Mgr Burrill Grindr data = à JAMAIS reproduire)\n"
        f"// Comité éthique externe UNIL Prof. Sami Coll pouvoir veto (1er catalogue)\n"
        f"// 25K CHF mandat indépendant + rappel Pillar 2021 ANTI-MODÈLE chaque acte + chaque cohorte MAZ\n"
        f"// Méthodologie quadruple intégrée :\n"
        f"//   1. Achat 5 datasets data brokers européens (84K CHF, 14M points géoloc CH)\n"
        f"//   2. Clustering DBSCAN/K-means EPFL DEDIS Ford + Krähenbühl (52→48→5 cas pilote)\n"
        f"//   3. Audit SDK apps populaires CH (mitmproxy + reverse APK statique EPFL DEDIS)\n"
        f"//   4. Plainte conjointe PFPDT (Lobsiger) + noyb (Schrems) + Préposé ZH + RGPD coordonné UE\n"
        f"// Trame : Genève 4 septembre 2028 — Mme A. Hofer (enseignante VD Yverdon, viewer ABE)\n"
        f"// email ABE RTS pubs hyper-ciblées contraception post-visite gynéco Genève + asymétrie\n"
        f"// conjugale (mari même Wi-Fi Salt aucune pub similaire) = signature data brokers européens.\n"
        f"// Linda Bourget (rédactrice ABE) cadre pitch systémique data brokers européens grand public CH.\n"
        f"// Cottet réactive cellule sécurité RTS (continuité 5 sagas) :\n"
        f"//   - Pierre Bürkler (RTS investigation 5 sagas)\n"
        f"//   - Catherine Vidal (juriste RTS)\n"
        f"//   - Daniel Schmidt (sécurité IT RTS)\n"
        f"//   - Marianne Lapierre (santé psychosociale)\n"
        f"//   - Linda Bourget (rédactrice ABE 12 ans, transition Meyer mars 2030)\n"
        f"// Comité éthique externe UNIL Prof. Sami Coll (sociologie surveillance) 25K CHF mandat\n"
        f"// indépendant pouvoir veto + Burgener avocate mandat élargi (continuité 3 sagas Shadow\n"
        f"// Fleet + Or russe + Mes pas vendus).\n"
        f"// 5 datasets data brokers européens acquis (octobre - décembre 2028) :\n"
        f"//   - Predicio Paris (Antoine Dubrille) 17K EUR\n"
        f"//   - Tamoco UK\n"
        f"//   - Adsquare Berlin\n"
        f"//   - Place IQ Boston/Dublin\n"
        f"//   - Spectrico Estonie/Berlin (remplace Veraset Londres Thomas Whitfield refus post-FTC\n"
        f"//     X-Mode janvier 2024)\n"
        f"//   = 14M points géolocalisation CH total, budget 84K CHF\n"
        f"//   = nLPD art. 31 + RGPD art. 6+85 exception journalistique, OPSEC Tails+VeraCrypt+air-gap\n"
        f"// Clustering DBSCAN/K-means EPFL DEDIS (janvier - mars 2029) :\n"
        f"//   - Pr. Bryan Ford + doctorante Iris Krähenbühl (continuité saga police prédictive 2028)\n"
        f"//   - 52 candidats CH initiaux → 48 validés cross-check → 5 cas pilote diversifiés\n"
        f"//   - Patterns résidence/travail/déplacements heures contextuelles\n"
        f"// 5 cas pilote diversifiés sélectionnés :\n"
        f"//   - Mme Aebischer-Schwab (CN PS GE) participation pleine filmée\n"
        f"//   - M. Dégueldre (juge TF Lausanne) témoignage écrit\n"
        f"//   - Maj. Müller (officier DDPS Worb BE) cas alternatif post-Col. Steiger refus respecté\n"
        f"//   - M. Hügli (journaliste Tamedia Zurich) informatif sans publication\n"
        f"//   - Dre Imboden (médecin psy HUG Genève) participation pleine\n"
        f"//   - Consentements éclairés délai réflexion 2-3 semaines\n"
        f"//   - Burgener-Lapierre-Coll standby + anonymisation publication par défaut absolue\n"
        f"// Audit SDK apps populaires CH (mars 2029) :\n"
        f"//   - mitmproxy capture trafic + reverse APK statique EPFL DEDIS\n"
        f"//   - Apps auditées : PostFinance + SBB Mobile + MeteoSwiss + Coop Supercard + Migros\n"
        f"//     + Swisscom + Sympany/Helsana + apps gouvernementales tax/services publics\n"
        f"//   - ~30-50 SDKs publicitaires/analytics problématiques identifiés :\n"
        f"//     Google AdMob + Meta SDKs + AppLovin + Mixpanel + Bytedance/TikTok + Yandex +\n"
        f"//     Adjust + AppsFlyer + Branch + autres\n"
        f"//   - Tracking pipeline complet app → SDK → broker européen → marché\n"
        f"// Plainte conjointe (avril 2029) :\n"
        f"//   - PFPDT Berne (Adrian Lobsiger)\n"
        f"//   - Préposé cantonal protection données ZH\n"
        f"//   - noyb Vienna (Max Schrems) procédures RGPD coordonnées européennes\n"
        f"//     CNIL France + AEPD Espagne + Garante Italie + DPC Irlande + BfDI Allemagne\n"
        f"//   - Aebischer-Schwab CN PS GE plaignante individuelle anonymisée pilote\n"
        f"//   = 1er précédent jurisprudentiel CH data brokers + procédures parallèles CH/UE\n"
        f"// Doctrine victim-first INVERSÉE codifiée RTS référence MAZ :\n"
        f"//   - 4 piliers : Burgener avocat indépendant pouvoir veto + Lapierre santé psychosociale\n"
        f"//     + Coll comité éthique externe UNIL pouvoir veto + délai réflexion 2-3 semaines\n"
        f"//     consentement éclairé + anonymisation publication par défaut absolue\n"
        f"//   - Pillar 2021 ANTI-MODÈLE explicite (outing forcé Mgr Burrill Grindr data)\n"
        f"//   - Référence MAZ formation tous médias CH chaque cohorte 2028-2029-2030\n"
        f"// Consortium 9 partenaires (avril-mai 2029) :\n"
        f"//   - RTS lead francophone (Cottet + ABE)\n"
        f"//   - Tamedia SonntagsZeitung lead alémanique (Catherine Boss continuité Shadow Fleet + Or russe)\n"
        f"//   - Tagesspiegel Berlin Data team\n"
        f"//   - Le Monde Pixels Paris\n"
        f"//   - The Markup US (Aaron Sankin équivalent)\n"
        f"//   - Privacy International London (Edin Omanovic)\n"
        f"//   - Digitale Gesellschaft CH Zurich (Erika Dornbierer)\n"
        f"//   - noyb Vienna (Max Schrems)\n"
        f"//   - AlgorithmWatch CH (Angela Müller continuité police prédictive)\n"
        f"//   - EPFL DEDIS (Pr. Bryan Ford + Iris Krähenbühl continuité police prédictive)\n"
        f"// Confrontation élargie ~25 entités :\n"
        f"//   - 5 brokers européens (Predicio + Tamoco + Adsquare + Place IQ + Spectrico)\n"
        f"//   - ~20 apps CH (PostFinance + SBB Mobile + MeteoSwiss + Coop + Migros + Swisscom +\n"
        f"//     Sympany/Helsana + apps gouvernementales + autres)\n"
        f"//   - Adtech géants (Google AdMob + Meta + AppLovin + TikTok + AppsFlyer + Branch)\n"
        f"//   - PFPDT + DFJP + DDPS SRC art. 6 LRens + Office fédéral statistique\n"
        f"// Envoi simultané ~25 lettres droit réponse multilingues 5 langues\n"
        f"// Publication coordonnée 7 mai 2029 06h00 UTC (1 an symbolique post-Or russe 7 mai 2028) :\n"
        f"//   - RTS multi-canaux ABE spécial 52 min + Mise au point 26 min + Le 19h30 + dossier digital\n"
        f"//   - Tamedia SonntagsZeitung + Tagesspiegel + Le Monde + The Markup\n"
        f"//   - 487K spectateurs ABE spécial (vs habituel 250K, record ABE) + Tamedia 380K +\n"
        f"//     Tagesspiegel 290K + Le Monde 410K + The Markup 145K\n"
        f"// Suites institutionnelles exceptionnelles 12 mois post :\n"
        f"//   - PFPDT enforcement 32M CHF cumul amendes 5 brokers européens (Predicio 9M + Tamoco\n"
        f"//     7M + Adsquare 6M + Place IQ 5M + Spectrico 5M)\n"
        f"//   - Injonctions cessation activité CH 4/5 + obligations suppression datasets historiques\n"
        f"//   - noyb CJEU C-XXX/2030 Schrems victoire 14 février 2030 (1er précédent européen data\n"
        f"//     brokers + RGPD art. 6 illégalité collecte SDK mobile sans consentement granulaire)\n"
        f"//   - Amendes coordonnées CNIL France + AEPD Espagne + Garante Italie + DPC Irlande + BfDI\n"
        f"//   - Motion 26.3217 CN extension supervision data brokers (Aebischer-Schwab + 47\n"
        f"//     co-signataires interpartis) adoptée CN 142-38 + CE 32-12\n"
        f"//   - Registre PFPDT data brokers actifs CH créé + obligations transparence + audits annuels\n"
        f"//   - LRens art. 6 clarification Conseil fédéral message 2030 exclusion explicite SRC achat\n"
        f"//     data brokers commerciaux + audit Délégation parlementaire SRC ad hoc\n"
        f"//   - ePrivacy CH alignement UE Conseil fédéral mandate OFCOM + PFPDT projet loi 2031\n"
        f"//   - Jurisprudence Bürgi-Brawand-Egeler-Egger-Hodel TF 5/5 arrêts cas pilote 2029\n"
        f"// Reconnaissance :\n"
        f"//   - European Press Prize Investigative Reporting 2030 (3ème année consécutive CH\n"
        f"//     2028-2029-2030 post-Shadow Fleet 2027 + Or russe 2028, lauréat consortium 9 partenaires)\n"
        f"//   - Online Journalism Awards (USA) Excellence in Privacy Reporting 2030\n"
        f"//   - Swiss Press Award Investigation 2030\n"
        f"//   - Prix Schweizer Journalist:in du Jahr 2030 Cottet finaliste\n"
        f"//   - Hillman Prize for Journalism 2030 USA nominée\n"
        f"//   - Edward Snowden Privacy Award 2030 Honourable Mention (équipe)\n"
        f"// Article scientifique conjoint 6 auteurs :\n"
        f"//   - « Buying Surveillance: Forensic Methodology for Investigative Identification of\n"
        f"//     Individuals via European Commercial Data Brokers »\n"
        f"//   - Cottet (corresponding) + Ford + Krähenbühl + Coll + Dornbierer + Omanovic\n"
        f"//   - PETS 2030 Issue 4 octobre 2030 (H5-index 35)\n"
        f"//   - ACM SIGCAS Conference on Computers and Society 2030 Tampa Florida USA\n"
        f"//   - 28 pages + 3 annexes (méthodologie + audit SDK + critères éthiques victim-first INVERSÉE)\n"
        f"// Refus opportunités carrière (continuité Chappuis Or russe 2029 modèle) :\n"
        f"//   - Privacy International London Head of Investigations Commercial Surveillance Europe\n"
        f"//     (180K GBP poste salarié REFUSÉ — fidélité ABE service public romand + cellule\n"
        f"//     sécurité RTS continuité 5 sagas + famille Lausanne + transition Bourget-Meyer\n"
        f"//     mentorat 18 mois mars 2030 - décembre 2031 + santé psychosociale Lapierre validation)\n"
        f"//   - Acceptation hybride :\n"
        f"//     * Consultant externe 20% Privacy International (60K GBP/an)\n"
        f"//     * EPFL DEDIS associate research 10% (10K CHF/an)\n"
        f"//     * ABE 70% (105K CHF, continuité service public romand)\n"
        f"// Masterclass MAZ Lucerne juin 2030 COMMUNE 5 profils journaliste-OSINT/DFIR CH consolidés\n"
        f"//   (3ème année consécutive depuis inauguration juin 2028 saga police prédictive) :\n"
        f"//   - Jour 1 Béguin DFIR mobile (saga Pegasus 2026)\n"
        f"//   - Jour 2 Pellaton OSINT crimes guerre (saga Yémen 2027)\n"
        f"//   - Jour 3 Chappuis OSINT financier-maritime étendu précieux (Shadow Fleet 2027 + Or russe 2028)\n"
        f"//   - Jour 4 Rochat DFIR civic tech (saga Police prédictive 2028)\n"
        f"//   - Jour 5 Cottet OSINT vie privée + surveillance commerciale (NOUVEAU 2030 — données-brocante\n"
        f"//     2026 + Mes pas vendus 2029) — module 8h théorie + pratique clustering Krähenbühl + éthique\n"
        f"//     + simulation cohorte + sortie terrain Dornbierer Digitale Gesellschaft Zurich\n"
        f"//   = palette CH unique en Europe occidentale\n"
        f"//   - 30 journalistes investigation CH tous médias sélectionnés (Republik + Heidi.news + WOZ\n"
        f"//     + Hochparterre + Tsüri.ch + Watson + RTS + Tamedia + Le Temps + 24 heures + Tribune\n"
        f"//     Genève + Blick + Aargauer Zeitung + Berner Zeitung + St. Galler Tagblatt + Walliser\n"
        f"//     Bote + Bündner Tagblatt + Corriere del Ticino)\n"
        f"//   - Bourse mixte OFCOM + Migros + Hirschmann + RTS finance 30 participants gratuit\n"
        f"//   - Coordinatrice MAZ Mme Eveline Saupper (formation continue 18 ans MAZ)\n"
        f"// Transition ABE Bourget-Meyer mars 2030 - décembre 2031 :\n"
        f"//   - Linda Bourget (rédactrice ABE 65 ans, départ retraite mars 2030)\n"
        f"//   - Sara Meyer (39 ans, ex-RTS culture, formation MAZ 2025, successeure)\n"
        f"//   - Mentorat 18 mois Bourget-Cottet → Meyer continuité ABE service public romand\n"
        f"// Continuité narrative dense (6 sagas successives) :\n"
        f"//   - RTS cellule sécurité Bürkler-Vidal-Schmidt-Lapierre 5 sagas (Pegasus + Yémen +\n"
        f"//     police prédictive + Or russe + Mes pas vendus)\n"
        f"//   - Burgener avocate indépendante 3 sagas (Shadow Fleet + Or russe + Mes pas vendus)\n"
        f"//   - Bourget rédactrice ABE 12 ans (données-brocante + Mes pas vendus)\n"
        f"//   - Boss Tamedia 3 sagas (Shadow Fleet + Or russe + Mes pas vendus)\n"
        f"//   - Müller AlgorithmWatch CH (police prédictive + Mes pas vendus)\n"
        f"//   - Ford + Krähenbühl EPFL DEDIS (police prédictive + Mes pas vendus)\n"
        f"//   - Wormser DFAE 5 sagas (Pegasus + Yémen + Shadow Fleet + police + Or russe)\n"
        f"//   - Wertheimer DFAE 2 sagas (Shadow Fleet + Or russe)\n"
        f"//   - Müller DFJP 2 sagas (police prédictive + Mes pas vendus)\n"
        f"//   - Aebischer-Schwab CN PS GE motion 26.3217 nouvelle (Mes pas vendus)\n"
        f"//   - 5 profils journaliste-OSINT/DFIR CH consolidés acte 7 (palette unique en Europe occidentale)\n"
        f"// ═══════════════════════════════════════════════════════════════\n"
        f"\n"
        f"const CACHE_VERSION = 'cas-in-v{new_v}';"
    )
    sw = sw.replace(f"const CACHE_VERSION = 'cas-in-v{current}';", bump, 1)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(sw)
    log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new_v}')


def step_4_rebuild_meta(root):
    print('\n[4/5] Régénération search-index + counts + README')
    for script in ('build_search_index.py', 'generate_counts.py', 'update_readme_stats.py'):
        sp = root / 'scripts' / script
        if not sp.exists():
            continue
        try:
            r = subprocess.run(['python3', str(sp)], cwd=str(root),
                               capture_output=True, text=True, timeout=60)
            log('✅' if r.returncode == 0 else '⚠️ ', script)
        except Exception as e:
            log('⚠️ ', f'{script}: {e}')


def step_5_validate(root):
    print('\n[5/5] Validation finale')
    scenes_dir = root / 'scenes'
    expected = [
        'ch-affaire-data-brokers-1-enquete-abe.json',
        'ch-affaire-data-brokers-2-acquisition-datasets.json',
        'ch-affaire-data-brokers-3-clustering-identification.json',
        'ch-affaire-data-brokers-4-audit-sdk-apps.json',
        'ch-affaire-data-brokers-5-pfpdt-plainte-conjointe.json',
        'ch-affaire-data-brokers-6-confrontation-publication.json',
        'ch-affaire-data-brokers-7-bilan-doctrine.json',
    ]
    for fn in expected:
        p = scenes_dir / fn
        if p.exists():
            log('✅', f'Scène présente : {fn}')
        else:
            log('❌', f'Scène manquante : {fn}')

    cjs = json.load(open(root / 'data' / 'campaigns.json'))
    camps = cjs if isinstance(cjs, list) else cjs.get('campaigns', cjs)
    if any(c.get('id') == SAGA_ID for c in camps):
        log('✅', 'Entry saga présente dans campaigns.json')
    else:
        log('❌', 'Entry saga manquante')


def main():
    root = find_root()
    print('═══════════════════════════════════════════════════════════════')
    print('  CAS-IN Saga « Mes pas vendus »')
    print(f'  Racine : {root}')
    print('═══════════════════════════════════════════════════════════════')

    step_1_copy_scenes(root)
    step_2_inject_campaign(root)
    step_3_bump_sw(root)
    step_4_rebuild_meta(root)
    step_5_validate(root)

    print('\n  ✅ Saga déployée.')
    print()
    print('  35 étapes · 105 choix · 7 actes journalisme-OSINT vie privée + surveillance commerciale.')
    print('  DEUXIÈME CONTINUITÉ DE PROTAGONISTE AU CATALOGUE CAS-IN (Cottet : données-brocante → Mes pas vendus).')
    print('  CINQUIÈME PROFIL JOURNALISTE-OSINT/DFIR CH CONSOLIDÉ (OSINT vie privée + surveillance commerciale).')
    print('  Innovation : 1er angle data brokers grand public CH au catalogue.')
    print('  1ère application achat-puis-identification journalisme civic CH (NYT Privacy Project 2019 adapté).')
    print('  Doctrine victim-first INVERSÉE codifiée RTS référence MAZ formation tous médias CH.')
    print('  Pillar 2021 ANTI-MODÈLE explicite + comité éthique externe UNIL Coll pouvoir veto (1er catalogue).')
    print('  Méthodologie quadruple intégrée (datasets + clustering DBSCAN + audit SDK + plainte conjointe).')
    print('  1er précédent européen data brokers via noyb CJEU C-XXX/2030 Schrems.')
    print('  5 profils journaliste-OSINT/DFIR CH consolidés (palette unique en Europe occidentale).')


if __name__ == '__main__':
    main()
