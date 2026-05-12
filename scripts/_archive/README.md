# Scripts archivés

Ces 22 scripts ont fait leur travail à un moment donné du projet
(ajout d'une vague de scènes, correction d'un bug de données passé, etc.)
et ne devraient **plus jamais être relancés**.

Ils sont conservés ici plutôt que supprimés pour :
- Garder une trace de ce qui a été fait
- Permettre de retrouver la logique d'une migration ancienne
- Servir d'exemple pour de futurs scripts one-shot similaires

## Liste

### One-shots d'ajout (legacy)
- `add_h1_to_fiches.py` — Ajout massif de balises `<h1>` dans les fiches (v2.0x)
- `add_missing_npcs.py` — Création de PNJ manquants en batch (v2.6x)
- `add_npcs_4cas_reels.py` — PNJ pour les "Cas réels" (v2.6x)
- `add_npcs_priorite3_part2.py` — Suite priorité 3 (v2.6x)

### One-shots de correction
- `fix_corrupted_atmospheres.py` — Atmosphères de scènes corrompues
- `fix_fiches_audit.py` — Fix après audit fiches
- `fix_scenes.py` — Fix de scènes individuelles
- `fix_tags_sagas.py` — Tags sagas Viège/Sarine (v2.93)
- `correct_npc_metadata.py` — Correction metadata NPC
- `patch_canton_data_v2.py` — Patch canton data (v2.5x)

### One-shots de transformation
- `clean_inline_styles.py` — Suppression des inline styles dans les fiches
- `cleanup_fiches.py` — Nettoyage global des fiches
- `inject_fiche_reader.py` — Injection du composant fiche-reader (v2.4x)
- `inject_fiche_related.py` — Injection du composant fiche-related (v2.4x)
- `migrate_fiche_common.py` — Migration vers fiche-common.js
- `reorganize_fiches_index.py` — Réorganisation de fiches/index.html

### One-shots de remplissage de contenu
- `pad_distractors_4cas_reels.py` — Distractors quiz "cas réels"
- `pad_distractors_priorite3.py` — Distractors quiz priorité 3
- `build_easy_arc_part1.py` — Génération des scènes 1-2 easy (v2.63)
- `build_easy_arc_part2.py` — Génération scènes 3-5 easy (v2.63)
- `build_easy_arc_part3.py` — Génération scènes 6-7 easy + arc PNJ (v2.63)
- `build_glossary_batch2.py` — Batch 2 du glossaire (build_glossary.py suffit maintenant)

## Si tu dois en relancer un

**Ne le fais pas.** Les modifications qu'ils faisaient sont déjà dans le repo.
Si tu cherches à reproduire une logique similaire, copie le script ailleurs et
adapte-le, ne touche pas à ces fichiers.
