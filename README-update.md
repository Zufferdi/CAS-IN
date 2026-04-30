# Mise à jour CAS-IN — 5 nouvelles scènes + palette score

## Fichiers à uploader

### Racine
- `sw.js` — bumped à v32 (force le cache à se rafraîchir)

### `scenes/` (à la racine du dossier scenes)
- `index.json` — version mise à jour avec les 5 nouvelles entrées (95 scènes total)
- `valais-cascade-12-communes.json` — Cascade CyberStratVS sur 12 communes (hard)
- `lsi-vs-lpd-timing.json` — 72h pour décider, LSI vs LPD (hard)
- `referent-milice-ransomware.json` — Dimanche soir, premier ransomware (easy)
- `flubot-bec-cascade.json` — Du SMS au virement (medium)
- `audit-prestataire-systemique.json` — ISAE 3402 sous tension (hard)

### `js/pages/`
- `scene-app.js` — palette score 5 paliers + ringColor unifié
  - 0–32 : rouge foncé `#991b1b`
  - 33–49 : orange `#f97316`
  - 50–74 : vert très clair `#86efac`
  - 75–99 : vert moyen `#22c55e`
  - 100 : vert vif `#10b981`

## Déploiement GitHub web UI

1. Repo → `Add file ▾` → Upload files
2. Glisse-dépose : `sw.js` à la racine, le dossier `scenes/` (qui écrase index.json + ajoute les 5 nouveaux), le dossier `js/pages/` (qui écrase scene-app.js)
3. Commit message : `feat: +5 scènes Suisse (CyberStratVS, LSI/LPD, milice, FluBot, ISAE) + palette score 5 paliers — sw v32`
4. Pages se redéploie en 1-2 min

Pour voir les nouvelles couleurs : termine n'importe quelle scène, le ring de score affichera la couleur selon le palier atteint. Pour voir les 5 nouvelles scènes : lobby Scènes, filtre par difficulté ou par tag (`GOUVERNANCE CANTONALE`, `BEC`, `ISAE 3402`, etc.).
