# Patch couleurs lobby — sw v33

Le patch précédent (v32) ne colorait que le ring final du rapport de scène.
Le lobby (liste des scènes) gardait des % colorés par rang (gold/silver/bronze)
ou pas du tout, donc 5% s'affichait en vert si c'était le top score.

## Ce qui change avec ce patch

Trois zones du lobby ré-alignées sur la palette 5 paliers :

1. **Pastille `✓ X%`** sur la carte d'une scène complétée — couleur selon le %
2. **Mini-leaderboard `#1 · X%`, `#2 · X%`, `#3 · X%`** — couleur selon le %
   (le rang reste identifié par #N, mais la couleur reflète la performance)
3. **Skill-tree nodes** dans la vue parcours — couleur selon le %

Le `pct` de la `continue-card` (▶ REPRENDRE) reste neutre car il représente
la progression dans la scène en cours, pas un score.

## Fichiers à uploader

- `sw.js` (racine) — bumped v32 → v33
- `js/pages/scene-app.js` — 3 ajouts d'inline `style="color:..."` via getScoreColor

## Déploiement

Standard : Add file ▾ → Upload, drag-drop, commit.
Force-reload navigation privée pour voir les nouvelles couleurs.
