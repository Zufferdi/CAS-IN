# CAS-IN — Patch v2.95 — Dossiers, Sagas, Arcs PNJ & Relations enrichies

Réponse cumulée aux **pistes 1, 2, 3 et 4** du diagnostic initial,
plus correction d'un bug bloquant.

## Sommaire par version

| Version | Apport | Fichiers touchés |
|---|---|---|
| **v2.93** | Vue Dossiers (chronologie) + Sagas Viège/Sarine/Initiation | scene.html, +1 JS, +1 CSS, scenes-chronology.json |
| **v2.94** | Auto-arcs PNJ (×25) + correction bug `window.NpcArcs` | profile.html, cas-in-arcs.js, cas-in-achievements.js, npc-arcs.json |
| **v2.95** | Relations enrichies : arcs en cours, factions, rencontres, quêtes | profile-relations.js (réécrit), +1 CSS, profile.html, npcs.html, scene-app.js |

## Contenu du bundle

```
scripts/
  build_chronology_v2.py        ← Régénère scenes-chronology.json (v2.93)
  build_npc_arcs_v2.py          ← Génère arcs PNJ auto (v2.94)
js/core/
  cas-in-arcs.js                ← +25 mappings ARC_TO_ACHIEVEMENT
  cas-in-achievements.js        ← +25 badges arc_*
js/pages/
  scene-app.js                  ← +1 handler hash #scene=<id> (auto-launch)
  scene-dossiers-v1.js          ← Module vue Dossiers (v2.93)
js/profile/
  profile-relations.js          ← RÉÉCRIT — Relations enrichies (v2.95)
style/
  scene-dossiers.css            ← CSS Dossiers (v2.93)
  profile-relations.css         ← CSS Relations enrichies (v2.95)
data/
  scenes-chronology.json        ← 162 scènes + 3 sagas
  npc-arcs.json                 ← 32 arcs (8 manuels + 24 auto)
patches/
  patch_*.txt                   ← snippets générés (référence)
scene.html                       ← +1 link CSS, +1 button, +1 screen, +1 script
profile.html                     ← -1 script (bug fix v2.94) + 1 link CSS (v2.95)
npcs.html                        ← +1 handler hash #npc=<id> (deep-link)
```

## Application

```bash
# Backup
cp scene.html scene.html.bak
cp profile.html profile.html.bak
cp npcs.html npcs.html.bak
cp js/pages/scene-app.js js/pages/scene-app.js.bak
cp js/core/cas-in-arcs.js js/core/cas-in-arcs.js.bak
cp js/core/cas-in-achievements.js js/core/cas-in-achievements.js.bak
cp js/profile/profile-relations.js js/profile/profile-relations.js.bak
cp data/npc-arcs.json data/npc-arcs.json.bak
cp data/scenes-chronology.json data/scenes-chronology.json.bak

# Apply (préserve l'arborescence)
cp -r cas-in-v2.95-patch/. .

# Vérifier (idempotent : doivent dire "0 ajout")
python3 scripts/build_chronology_v2.py
python3 scripts/build_npc_arcs_v2.py
```

## v2.95 — Détail du nouvel onglet Relations

L'onglet **Relations** sur `profile.html` devient un cockpit social.
Sept sections, dans l'ordre :

### 1. Compteurs étendus (8 stats au lieu de 5)
- Complices · Pro. · Méfiants · Hostiles · Rencontrés (existant)
- **Factions touchées : N/19** (couverture institutionnelle)
- **Arcs actifs** (arcs en cours, lit `NpcArcs`)
- **Arcs bouclés** (arcs 100%)

### 2. 🔥 Rencontres récentes (5 derniers PNJ)
Triés par date de la dernière interaction. Pour chaque PNJ :
- Avatar, nom, rôle court
- État courant (😠/🤨/🙂/🤝) + trust /100
- "auj. / hier / 3j / 2sem / 1mo" en colonne droite
- Click → `npcs.html#npc=<id>` (fiche modale auto-ouverte)

### 3. 🎯 Arcs en cours (jusqu'à 5)
Affiche les arcs dont au moins 1 stage est fait mais pas terminés.
Pour chaque arc :
- Icône, titre, jauge de progression
- Bouton **▶ [prochaine scène]** → `scene.html#scene=<id>` (auto-launch)

Si > 5 arcs actifs, lien vers l'onglet Distinctions.

### 4. 🏛 Réputation par faction
Une jauge par institution rencontrée, parmi 19 familles définies :
> fedpol · MPC · MP cantonaux · Polcant · OFCS · OFJ · FINMA · SRC ·
> DDPS · PFPDT · Interpol/Europol · FBI · Forces étrangères · Avocats ·
> Privé sécurité · Privé tech · Académique · Santé · CICR

Trust moyen agrégé par faction (sur les PNJ rencontrés de cette faction).
Permet de voir d'un coup d'œil "tu es bien vu chez fedpol mais détesté
au MPC".

### 5. 🤝 Cercle proche (top 5 complices) — *existant*
### 6. ⚠ Relations à reconstruire (top 5 hostiles/méfiants) — *existant*

### 7. 🎓 Quêtes réseau (3 quêtes)
| Quête | Cible | Progression |
|---|---|---|
| 🎯 Cercle rapproché | 5 complices à atteindre | `N/5` |
| 📇 Carnet d'adresses | 1 PNJ dans chacune des 8 factions majeures | `N/8` |
| 🏆 Veneur d'arcs | 3 arcs narratifs bouclés | `N/3` |

Quand une quête est complétée, sa carte passe en vert avec ✓.

## Liens cross-pages désormais fonctionnels

| URL | Action | Implémenté dans |
|---|---|---|
| `npcs.html#npc=<id>` | Ouvre la fiche PNJ en modale | npcs.html (handler `handleHashDeepLink`) |
| `scene.html#scene-<id>` | Scroll + highlight la card dans le lobby | scene-app.js (existant) |
| `scene.html#scene=<id>` | **Auto-launch** la scène directement | scene-app.js (v2.95) |
| `scene.html#random` | Lance une scène aléatoire | scene-app.js (existant) |

Tous ces formats fonctionnent depuis n'importe quelle page.

## Architecture des données — récap

Aucune nouvelle table requise. Tout est lu depuis :
- `data/npcs.json` : fiches PNJ (name, role, institution, appearances, icon)
- `data/npc-arcs.json` : arcs narratifs (manuels + auto) — 32 entrées
- `data/scenes-chronology.json` : 162 scènes en 4 groupes + 3 sagas
- `localStorage['scene_results']` : progression (existant)
- `localStorage['cas_npc_state']` : trust/state/interactions par PNJ (existant)

## Vérifications post-application

### Dans le navigateur

#### Onglet Relations (`profile.html#tab=relations`)
- [ ] Compteurs étendus visibles (8 stats au lieu de 5)
- [ ] Si tu as joué ≥ 1 scène : section "Rencontres récentes" affiche les PNJ croisés avec leur trust et la date relative
- [ ] Si arcs en cours : section "Arcs en cours" affiche au moins 1 carte avec un bouton "▶ [titre scène]"
- [ ] Section "Réputation par faction" affiche au moins 1 jauge
- [ ] Section "Quêtes réseau" affiche 3 cartes (Cercle / Carnet / Veneur)

#### Cross-page deep-links
- [ ] Click sur un PNJ dans "Rencontres récentes" → `npcs.html` s'ouvre, modale du PNJ déjà déployée
- [ ] Click sur "▶ [scène]" dans "Arcs en cours" → `scene.html` s'ouvre et **lance** directement la scène

#### Onglet Distinctions (`profile.html#tab=distinctions`)
- [ ] Compteur "👥 ARCS NARRATIFS · 0/32" (au lieu de 0/0 avant v2.94)
- [ ] Les 32 cartes s'affichent (filtrables)

### Idempotence

Les scripts Python ne réécrivent rien si rien n'a changé :
```bash
$ python3 scripts/build_chronology_v2.py
[chronology] existing=162 all=162 orphans=0

$ python3 scripts/build_npc_arcs_v2.py
[npc-arcs-v2] candidats auto (≥5, hors manuels): 0
```

## Pistes encore en suspens (du diagnostic initial)

| # | Titre | Statut | Difficulté |
|---|---|---|---|
| 1 | Activer chronology comme vue Dossiers | ✅ v2.93 |  |
| 2 | Promouvoir sagas Viège/Sarine | ✅ v2.93 |  |
| 3 | Auto-générer arcs PNJ | ✅ v2.94 |  |
| 4 | Améliorer l'onglet Relations | ✅ v2.95 |  |
| **5** | **Rééquilibrage difficulté en surface** | À faire | Faible |
| **6** | **Hygiène : consolider les 3 taxonomies** | À faire | Élevé |

## Pistes futures débloquées par v2.95

- **Achievements "Faction"** : badge "Insider fedpol" si trust moyen
  fedpol ≥ 80 avec ≥ 5 PNJ rencontrés. Trivial à ajouter dans
  `cas-in-achievements.js` (la donnée existe déjà via `getFactionReputation`).
- **Suggestion adaptive** : "Tu as 4/5 complices et 0 hostile —
  un cas type devrait être [scène X] où tu rencontreras [PNJ Y]".
- **Faction filter sur npcs.html** : ajouter une famille `family` aux
  filtres existants (le code de classification est dans `profile-relations.js`,
  facile à extraire en module partagé).
- **Reset granulaire** : "Réinitialiser uniquement les hostiles" — utile
  quand on veut rejouer une saga sans perdre tout son réseau.
