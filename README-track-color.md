# Patch couleur d'accent par rôle (Stratégie 4) — sw v38

## Pourquoi c'était (encore) à finir

Le scaffolding CSS pour la couleur par rôle **existait depuis longtemps** dans `style/style.css` :
- Variables `--track-accent`, `--track-accent-glow`, `--track-accent-soft`, `--track-emoji`, `--track-label`
- Définies pour les 4 rôles : investigator (bleu cyan), magistrate (or pâle), journalist (orange-rouge), hacker (vert phosphor)
- Règles `[data-track] .dfir-led`, `[data-track] .dfir-badge-classified`, `[data-track] .profile-hero` déjà écrites

**Mais l'attribut `data-track` n'était jamais posé sur `<html>`.** Le commentaire dans le CSS disait pourtant : *« Appliquées via [data-track="..."] positionné sur <html> au chargement par profile-track-v5.js »*. Sauf que `grep -n data-track js/profile/profile-track-v5.js` ne trouvait rien — un demi-câblage en somme.

## Ce que fait ce patch

1. **`cas-in-profile.js`** — Nouvelle fonction `applyTrackToDocument(trackKey)` qui pose ou enlève `data-track` sur `<html>`. Appelée :
   - Au chargement du module (avec fallback `DOMContentLoaded` si `<html>` n'est pas encore prêt)
   - À chaque `setTrack(trackKey)` (changement de rôle)
   - Comme `cas-in-profile.js` est chargé sur les 5 pages (index, profile, quiz, scene, tp), la couleur est cohérente partout.

2. **`style/style.css`** — Extension des règles `[data-track]` pour toucher plus d'éléments à forte visibilité :
   - Barre de progression XP du profile (gradient avec `--track-accent`)
   - Profile banner top des pages (border + glow icon + rang)
   - Brand link hover (`CAS-IN`)
   - Encart « 🎯 Spécialité du rôle » (bordure + badge bonus + pastilles tags + icon glow)
   - Pastille « Bonus rôle ×1.20 » dans le rapport de scène
   - Bordure latérale des cartes de scène en cours
   - Halo subtil autour de l'emoji du profile hero

3. **`sw.js`** — v37 → v38

## Couleurs par rôle (rappel)

| Rôle | Hex | Sentiment |
|---|---|---|
| Investigator | `#00b8ff` | bleu cyan — terrain, OSINT |
| Magistrate | `#d4af37` | or pâle — robes, sceaux, autorité |
| Journalist | `#ff6b35` | orange-rouge — alerte presse, urgence |
| Hacker | `#00ff88` | vert phosphor — terminal, matrix |

Aucune n'écrase le thème de fond (data-theme=hacker/crimson/retro/blueprint reste indépendant) — c'est un **accent** qui se superpose, pas un thème.

## Fichiers à uploader

- `sw.js` (racine)
- `js/core/cas-in-profile.js`
- `style/style.css`

## Vérification après déploiement

1. Force-reload navigation privée
2. Sur **n'importe quelle page**, l'inspecteur DOM doit montrer `<html data-track="hacker">` (ou autre selon ton rôle)
3. Va sur **profile.html** : la barre XP doit avoir la couleur de ton rôle, l'encart spécialité aussi (bordure et pastilles)
4. Joue une scène : la pastille « Bonus rôle » dans le rapport doit être à la couleur de ton rôle
5. Change de rôle (ouvre le track-chooser) → les couleurs se mettent à jour instantanément (pas besoin de recharger)

## Tests Node validés

```
Init (no track yet):     data-track = null
After setTrack(hacker):  data-track = "hacker"
After setTrack(magistrate): data-track = "magistrate"
After setTrack(investigator): data-track = "investigator"
```

## Reste à faire (suggestions)

- **Test visuel manuel sur les 4 rôles** — vérifier que les contrastes sont OK pour chacune des 4 couleurs sur le thème de fond actif
- Si certains éléments ratent (par exemple `.scene-continue-card` n'existe peut-être pas avec ce nom exact), le simple ajout dans la liste `[data-track]` du CSS suffira — diagnostic via inspecteur DOM
