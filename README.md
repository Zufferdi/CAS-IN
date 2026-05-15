# CAS-IN

**Outil pédagogique de simulation DFIR & procédure pénale suisse.**

Tu prends une scène, tu te retrouves dans la peau d'un·e procureur·e, RSSI, juge TMC, doctorant·e ou grand-mère arnaquée au cousin russe. Tu dois prendre 3 à 5 décisions sous contrainte. Chaque choix est noté, commenté, et raccroché à un article du CP/CPP ou à un ATF réel. À la fin, on t'explique ce qui était bien, ce qui passait, et ce qui aurait fait basculer tout le dossier en nullité (art. 141 al. 2 CPP, c'est notre best-seller).

C'est sérieux. Mais ne te trompe pas : c'est un projet qui contient **381 personnages non-joueurs nommés**, dont la moitié sont des médecins légistes ou des procureurs fédéraux fictifs. Si tu cherches un Netflix interactif tranquille pour le dimanche soir, va voir ailleurs.

---

## Pour qui

- Étudiant·e·s en droit / informatique / cybersécurité qui en ont marre des manuels.
- Profils DFIR qui veulent réviser le CPP suisse sans s'endormir.
- Juristes qui découvrent que MITRE ATT&CK n'est pas un opérateur télécom.
- Personnes qui se sont déjà demandé quelle est la différence entre l'art. 143 et l'art. 143bis CP, et qui n'ont jamais osé demander.
- Toute personne curieuse de comprendre *concrètement* comment une enquête cyber se déroule en Suisse — depuis le premier appel jusqu'à l'audience d'arrondissement.

**Niveaux disponibles** : `stagiaire` (22 scènes), `inspecteur` (56), `difficile` (88), `expert` (40). Si tu te lances direct sur la saga *L'Affaire du Modèle* niveau Expert, c'est ton problème.

---

## Ce qu'il y a dedans (à jour de la version 3.0)

| Élément | Quantité | Commentaire |
|---|---|---|
| Scènes jouables | **206** | Chacune = 3 à 6 décisions notées |
| Personnages (NPCs) | **381** | Chacun avec rôle, institution, expertise, bio, citation, relations |
| Campagnes thématiques | **20** | Dont 9 sagas narratives multi-actes (voir plus bas) |
| Parcours d'apprentissage | **32** | Recommandés par compétence / niveau / thème |
| Cantons suisses couverts | **19** | Plus la Confédération et l'UE pour les volets transfrontaliers |
| ATF (arrêts du Tribunal fédéral) cités | **33** uniques | Tous vérifiés, certains plusieurs fois |
| Articles CP/CPP/lois fédérales | **251** | Oui, c'est presque tout le CP. Non, on n'a pas fait exprès |
| Service worker offline | ✓ | Tout le contenu accessible hors-ligne après première visite |

La date du jeu est calée sur le présent (mai 2026 au moment où tu lis cette ligne). Certaines sagas se projettent sur 12-18 mois dans le futur proche — *L'Affaire du Modèle* va jusqu'à une audience en septembre 2027.

---

## Les 9 sagas narratives

Une saga = un fil rouge qui traverse plusieurs scènes liées (mêmes personnages, même affaire, progression chronologique). Tu peux les jouer en standalone, mais l'intérêt est de suivre la trajectoire.

| Saga | Cantons | Actes | Niveau | Thème |
|---|---|---|---|---|
| 🎓 **Initiation DFIR** | CH | 7 | stagiaire | Premiers gestes : custody, premier appel, clé USB trouvée, USB de mémé |
| 🏔 **L'Affaire de la Viège** | VS | 7 | inspecteur | SaaS compromis → SCADA Mattmark → audience à Brigue |
| 🇫🇷 **L'Affaire Sarine** | FR | 5 | inspecteur | EIMP avec Stuttgart, coordination cantons |
| 🏛️ **L'Affaire Aar-Frutigen** | BE | 5 | inspecteur | KantonNet, 47 communes, ex-développeur |
| 🧀 **L'Affaire de la Singine** | FR/BE | 5 | inspecteur | Akira, MROS, audience à Berne |
| ⌚ **L'Affaire du Noirmont** | JU | 7 | inspecteur | Cambriolage horloger, VPS Saint-Imier, audience Porrentruy |
| 🔬 **Le Calibre Volé — Affaire CSEM** | NE | 7 | inspecteur | Monero, ANPR Saignelégier, rogatoire Besançon |
| 🪲 **L'Affaire de la Prévôté** | BE → JU | 7 | expert | Rootkit eBPF + bascule Moutier (BE→JU) 1.1.2026 |
| 🧬 **L'Affaire du Modèle** | VD | 7 | expert | IA médicale CHUV/EPFL compromise, jurisprudence ML médicale |

Chaque saga est conçue pour que les choix d'un acte aient des conséquences procédurales aux actes suivants. Si tu rates la levée du secret médical à l'acte 3, tes preuves seront inexploitables à l'acte 7. C'est le but.

---

## Comment c'est construit

### Stack technique

C'est volontairement modeste :
- **HTML/CSS/JS vanilla**, pas de framework
- **Données en JSON** dans `scenes/` (1 fichier par scène) et `data/` (NPCs, campagnes, parcours)
- **Service Worker** pour le mode offline + cache versionné (actuellement `cas-in-v330`)
- **localStorage** pour la progression, les états des NPCs, les paramètres utilisateur
- **GitHub Pages** pour l'hébergement, avec un workflow custom `deploy-pages.yml` qui fait passer 206 fichiers JSON sans broncher

Zéro tracking, zéro backend, zéro base de données. Tout tourne dans ton navigateur. Si tu coupes ton wifi pendant une scène, ça continue à marcher (c'est tout l'intérêt d'avoir 100 MB de JSON cachés).

### Arborescence

```
CAS-IN/
├── index.html              # Lobby principal
├── scene.html              # Moteur de scène
├── profile.html            # Stats du joueur, badges, progression
├── npcs.html               # Annuaire des 381 personnages
├── glossary.html           # Glossaire DFIR/juridique
├── quiz.html               # Quiz de révision
├── exam.html               # Examen final
├── scenes/                 # 206 fichiers JSON, un par scène
│   └── index.json          # Index agrégé (généré)
├── data/
│   ├── npcs.json           # 381 personnages
│   ├── campaigns.json      # 20 campagnes
│   └── scenes-chronology.json
├── js/
│   ├── pages/              # scene-app.js, scene-lobby-v3.js, etc.
│   └── components/         # npc-favors, navigation, etc.
├── scripts/                # Builders & validateurs Python
│   ├── build_scenes_index.py
│   ├── build_npc_metadata.py
│   ├── check_scenes.py
│   └── …
├── style/                  # CSS
├── fiches/                 # Fiches techniques (DFIR, droit, MITRE…)
├── references/             # Sources juridiques et techniques citées
└── sw.js                   # Service Worker (PWA)
```

### Système de scoring

Tu fais des choix, tu gagnes ou tu perds des points. Pas de surprise.

Plus subtil : chaque NPC a un **niveau de confiance** envers toi (0-100), qui évolue selon tes décisions. Si tu insultes la juge TMC à la scène 4, ne sois pas étonné·e qu'elle te refuse une perquisition à la scène 12. Quand un NPC atteint le niveau "complice", tu débloques une **faveur active** : indice juridique pour les procureurs, indice technique pour les forensicien·ne·s, du temps en plus pour les services de renseignement. À l'inverse, un NPC hostile te tape un malus sur le score final.

C'est documenté dans `js/components/npc-favors.js` si tu veux les détails.

### Mode procureur

Timer activable dans les paramètres. Tu as 90 secondes pour lire l'énoncé et 30 secondes par décision. Pensé pour reproduire la pression d'une vraie audience où on n'a pas trois jours pour décider si on lève les scellés.

---

## Comment jouer

Va sur **[zufferdi.github.io/CAS-IN](https://zufferdi.github.io/CAS-IN)** et choisis :
- Une scène standalone depuis le lobby (filtres par canton, niveau, thème)
- Un parcours d'apprentissage (32 disponibles, par exemple "Procédure pénale suisse" ou "Ransomware A→Z")
- Une saga narrative (9 disponibles)

Aucun compte, aucune inscription. Ta progression est dans ton navigateur. Si tu vides ton localStorage, elle disparaît — et c'est très bien comme ça.

---

## Fiction, réalité, et où s'arrête la blague

**Toutes les affaires sont fictives.** Les noms de personnes, d'entreprises, de doctorants chinois suspects, de patientes lésées, de CEO de PME industrielle vaudoise — **fictifs**. Si tu reconnais quelqu'un, c'est une coïncidence ou ton imagination. Les rares cas inspirés d'affaires réelles (LockBit, Xplain, RUAG 2016, etc.) sont explicitement marqués comme tels et utilisent des informations publiques.

**Toutes les institutions sont réelles** : CHUV, EPFL, ETHZ, Compass Security, Kudelski, Citizen Lab, fedpol, MPC, OFCS, Tribunal fédéral, etc. Elles sont citées parce qu'elles existent et qu'on ne peut pas faire une simulation crédible de DFIR suisse en parlant de "l'hôpital générique de Suisse occidentale". Mais aucune n'a été contactée, sponsorisée, validée, ou ne sait que ce projet existe — et ce n'est pas leur faute.

**Le code pénal suisse, le CPP, la LPCi, la nLPD, l'EU AI Act** : très réels. Malheureusement très réels. C'est précisément pourquoi ce projet existe.

**Les ATF cités sont vérifiés** un par un, par recherche directe ou via lawinside.ch / crimen.ch / swissprivacy.law. Si tu en trouves un qui sonne faux, ouvre une issue, je corrigerai dans la semaine.

**Ce n'est pas un avis juridique.** Si tu es vraiment confronté·e à une cyberattaque, à une enquête, à une question de levée du secret médical, à une perquisition — appelle un·e avocat·e, pas un README.

---

## Contribuer

Le projet est développé en solo (avec l'aide de Claude pour la rédaction des scènes et la vérification de la jurisprudence). Si tu veux contribuer :

- **Signaler un bug** : ouvre une issue avec capture d'écran et URL de la scène.
- **Signaler une erreur juridique** : ouvre une issue avec la référence correcte (ATF, article CP, jurisprudence). Pas de "je pense que c'est faux", merci.
- **Proposer une nouvelle scène** : ouvre une discussion avec le contexte, le canton, le thème, le niveau visé. Format : voir n'importe quel `scenes/*.json`.
- **Améliorer le code** : pull request bienvenue, surtout sur l'accessibilité, le SW, et les composants UI.

Les scripts de validation (`scripts/check_scenes.py`, `scripts/check_questions.py`) doivent passer **0 erreur** avant tout merge. C'est non négociable.

---

## Mentions

- **Code** : sous licence MIT, fais-en ce que tu veux du moment que tu gardes le copyright.
- **Contenu pédagogique** (scènes, fiches, NPCs) : CC BY-NC-SA 4.0. Utilisation non commerciale, attribution, partage à l'identique.
- **Rédaction et conception** : @zufferdi
- **Assistance rédactionnelle** : Anthropic Claude (Opus 4.6 puis 4.7), pour la production des scènes et la vérification des sources juridiques.
- **Sources juridiques** : Tribunal fédéral, lawinside.ch, crimen.ch, swissprivacy.law, droitpourlapratique.ch, FMH, OFCS, PFPDT, fedpol, et la pile de Basler Kommentar qui prend la poussière.
- **Inspirations DFIR** : MITRE ATT&CK + ATLAS, NIST AI 100-2, OWASP ML Top 10, ENISA, BSI, pratique CCUC, et beaucoup trop d'heures sur Bleeping Computer.

---

## Disclaimer obligatoire

Aucune patiente fictive n'a été lésée pendant le développement. Aucun doctorant chinois n'a été stéréotypé sans contexte clinique (Zhang Yi est le seul de la base, et il est officiellement le méchant de *L'Affaire du Modèle* — la base en compte par ailleurs 380 autres dont des héros, des victimes, des collègues, des juges, et plusieurs procureures romandes qu'on aime bien).

Toute ressemblance avec une affaire en cours est purement gênante. Toute ressemblance avec le calendrier judiciaire vaudois est purement aspirationnelle.

---

*Dernière mise à jour de ce README : mai 2026, version 3.0, après la livraison de la saga « L'Affaire du Modèle ».*

*Si tu lis cette ligne, c'est que tu cherches vraiment des excuses pour ne pas commencer la saga d'initiation.*
