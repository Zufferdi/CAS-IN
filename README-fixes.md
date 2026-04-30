# Patch fixes — sw v36

Trois corrections à uploader. **Pas encore les 15 rangs ni la différenciation des rôles** — voir mes recommandations en fin de message pour décider.

## Fichiers à uploader

| Fichier | Rôle |
|---|---|
| `js/pages/scene-app.js` | `updateGradeDisplay()` et `addXP()` rebranchés sur `Profile.getRank` (échelle v3 lissée). Le toast affiche maintenant le bon nom de rang. La fonction `getGrade()` legacy reste comme fallback (au cas où Profile indispo). |
| `js/core/cas-in-achievements.js` | **Nouveau fichier**. Métadonnées des achievements extraites depuis `quiz-app.js` (41 entrées). Permet à profile.html d'afficher emoji + nom + desc sans dépendre du chargement de quiz-app. |
| `profile.html` | Charge le nouveau module avant `profile-page.js`. |
| `fiches/index.html` | 77 icônes thématiques restaurées depuis `manifest.json`, 28 descriptions et keywords reconstruits. Plus de 📄 omniprésent. |
| `sw.js` | v35 → v36, `cas-in-achievements.js` ajouté au cache statique. |

## Déploiement

GitHub web UI → Add file ▾ → Upload → drag-drop la racine du zip → commit avec message `fix: scene.html ranks unified, fiches icons resynced, achievements meta extracted — sw v36`.

Force-reload navigation privée pour voir les corrections.

## Vérification après déploiement

1. **scene.html** : la card en haut doit montrer ton rang Profile actuel (pas plus "Stagiaire 32/100 XP" sauf si tu es vraiment Stagiaire). Le `→ Inspecteur` est remplacé par `→ <ton prochain rang dans le track choisi>`.
2. **profile.html** : la section SUCCÈS DÉBLOQUÉS doit afficher les achievements avec leur vrai emoji et nom (pas que 🏅 + nom vide).
3. **fiches/index.html** : ouvrir l'index, vérifier que les icônes sont variées (pas un mur de 📄). Sous chaque carte la phrase descriptive en mots-clés (ex. « Write-blocker · dd/FTK · Hash · E01/AFF ») doit être visible.
