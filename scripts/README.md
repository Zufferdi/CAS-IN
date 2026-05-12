# Scripts CAS-IN

Scripts Python pour générer, valider et maintenir les données du projet.

## 🟢 Scripts actifs (16)

Ces scripts sont **idempotents** (rejouables sans risque) et documentés ci-dessous.

### Génération (♻ à lancer après modification de scènes/fiches)

| Script | Ce qu'il fait | Quand le lancer |
|---|---|---|
| `enrich_scene_index.py` | Propage le champ `region` depuis chaque `scenes/<id>.json` vers `scenes/index.json` | Après ajout/modif scène |
| `build_scenes_index.py` | Régénère **complètement** `scenes/index.json` à partir des fichiers `scenes/<id>.json` | Si l'index est cassé / pour un reset |
| `build_chronology_v2.py` | Refait `data/scenes-chronology.json` (groupes par event/canton/année + sagas) | Après ajout/modif scène |
| `build_npc_arcs_v2.py` | Refait `data/npc-arcs.json` (arcs manuels + auto-arcs si ≥5 apparitions) | Après ajout/modif scène avec PNJ |
| `build_npc_metadata.py` | Refait `data/npcs.json` à partir des occurrences dans scènes | Après ajout d'un nouveau PNJ |
| `build_glossary.py` | Refait `data/glossary.json` (entrées du popover légal) | Après ajout d'articles CPP, etc. |
| `build_fiche_graph.py` | Refait `data/fiche-graph.json` (réseau de liens entre fiches) | Après ajout/modif fiche |
| `build_cross_links.py` | Refait `data/cross-links.json` (renvois entre fiches/scènes/questions) | Après ajout massif de contenu |
| `build_index.py` | Refait `fiches/index.html` à partir des fiches | Après ajout/modif fiche |
| `build_search_index.py` | Refait `data/search-index.json` (Cmd+K) | Après ajout/modif fiche/scène |
| `generate_counts.py` | Met à jour `data/counts.json` + patche `index.html` (compteurs) | Après tout ajout |
| `sync_fiches_index.py` | Garde `fiches/index.html` synchronisé avec les fiches existantes | Si désync détectée |
| `split_scenes.py` | (utilitaire) Découpe un méga-fichier `scenes.js` en fichiers individuels | Migration ponctuelle |

### Validation (🔍 utilisés par CI)

| Script | Ce qu'il vérifie |
|---|---|
| `check_questions.py` | Quiz : doublons, format, distractors plausibles |
| `check_scenes.py` | Scènes : steps cohérents, choix marqués `ok`, IDs valides |
| `check_scenes_balance.py` | Scènes : équilibrage difficulté par tag/canton |

Lancés automatiquement dans `.github/workflows/check-questions.yml` et `audit-repo.yml`.

### Hook Git

`git-hooks/pre-commit` — copie symbolique recommandée :
```bash
cp scripts/git-hooks/pre-commit .git/hooks/
chmod +x .git/hooks/pre-commit
```

## 🔒 Scripts archivés (`_archive/`)

22 scripts conservés pour traçabilité historique. Ils ont fait leur travail (ajouts massifs ponctuels, corrections de données passées). À ne plus relancer — les modifications qu'ils faisaient sont déjà appliquées et leurs effets sont dans le repo actuel.

Voir `_archive/README.md` pour le détail.

## Workflow standard

Si tu ajoutes UNE scène, le plus simple est :

```bash
# Depuis la racine du repo
make sync
```

C'est équivalent à :
```bash
python3 scripts/enrich_scene_index.py
python3 scripts/build_chronology_v2.py
python3 scripts/build_npc_arcs_v2.py
python3 scripts/generate_counts.py
```

Puis bumper `CACHE_VERSION` dans `sw.js`.

Si tu modifies une fiche, ajoute aussi :
```bash
python3 scripts/build_index.py
python3 scripts/build_search_index.py
python3 scripts/build_fiche_graph.py
```
