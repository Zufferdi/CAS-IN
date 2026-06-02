# DEPLOY_SAGA_CHECKLIST.md

**Check-list explicite pour déployer une nouvelle saga CAS-IN sans casser le catalogue.**

Document créé après le bug du 2 juin 2026 où 78 scènes (11 sagas CH) avaient été
ajoutées dans `scenes/` sans que leurs entries soient injectées dans
`data/campaigns.json`, les rendant invisibles dans la navigation utilisateur.

---

## Workflow standard livraison saga

### 1. Recevoir le bundle saga

Format attendu : un dossier ou tar.gz contenant
```
bundle/
  ├── MANIFEST_saga_<nom>.md         # documentation livraison
  ├── scenes/
  │   ├── ch-affaire-<nom>-1-*.json
  │   ├── ch-affaire-<nom>-2-*.json
  │   ├── ...
  │   └── ch-affaire-<nom>-7-bilan-doctrine.json
  └── scripts/
      └── apply_saga_<nom>.py        # ← script idempotent CRITIQUE
```

### 2. Copier les fichiers dans le workspace

```bash
# Depuis la racine du workspace CAS-IN
cp /chemin/bundle/scenes/*.json scenes/
cp /chemin/bundle/scripts/apply_saga_<nom>.py scripts/
```

⚠️ **À ce stade, la saga est encore invisible dans l'UI.** Les scènes sont sur
disque mais aucune campagne ne les référence. C'est exactement le bug qui s'est
produit le 2 juin 2026.

### 3. Exécuter le script d'application

```bash
python3 scripts/apply_saga_<nom>.py
```

Ce script effectue **5 étapes obligatoires** :

1. **`copy_scenes`** — copie les scènes dans `scenes/` (skip si déjà présentes)
2. **`inject_campaign`** — ajoute l'entry saga dans `data/campaigns.json`
3. **`bump_sw`** — incrémente `CACHE_VERSION` dans `sw.js` (force rechargement clients PWA)
4. **`rebuild_meta`** — régénère `scenes/index.json`, `data/search-index.json`, `data/counts.json`, README
5. **`validate`** — confirme la présence des scènes attendues + entry campaign

Sortie attendue :
```
[1/5] Copie des 7 scènes ...
  ✅ 7 scènes copiées (0 déjà présentes)
[2/5] Injection entry saga dans data/campaigns.json
  ✅ Saga ajoutée avec order=XX, total campagnes: YY
[3/5] Bump SW → v+1
  ✅ SW bumpé : cas-in-vNN → cas-in-vNN+1
[4/5] Régénération search-index + counts + README
  ✅ build_search_index.py
  ✅ generate_counts.py
  ✅ update_readme_stats.py
[5/5] Validation finale
  ✅ Scène présente : ch-affaire-<nom>-1-*.json
  ...
  ✅ Entry saga présente dans campaigns.json
  ✅ Saga déployée.
```

Si une étape **skip** apparaît (`⏭`), c'est normal : le script est idempotent
et détecte les états déjà appliqués. Mais si une étape **fail** (`❌`),
**arrêter et investiguer** avant de continuer.

### 4. Valider la parité catalogue

```bash
python3 scripts/check_campaigns_parity.py
```

Sortie attendue : `✅ Parité scènes ↔ campaigns OK — aucune anomalie`
(ou seulement des warnings non bloquants).

Si des erreurs `❌ N scène(s) ORPHELINE(S)` apparaissent : retourner à l'étape 3
ou exécuter `bash repair_all_sagas.sh` pour ré-appliquer toutes les sagas.

### 5. Test local

```bash
# Servir le workspace localement
python3 -m http.server 8000
# Ouvrir http://localhost:8000 et vérifier :
# - Écran "Dossiers / Sagas" liste bien la nouvelle saga
# - Click sur la saga lance l'acte 1 sans erreur
# - Navigation acte 1 → 2 → ... → 7 sans page 404
# - Recherche full-text trouve les scènes de la saga
```

### 6. Commit

Le pre-commit hook (`.git-hooks/pre-commit`) ré-exécute automatiquement
`check_campaigns_parity.py` et bloque le commit si orphelines détectées.

Si le hook n'est pas installé : `bash scripts/install_hooks.sh`

```bash
git add scenes/ scripts/ data/ sw.js README.md
git commit -m "feat: saga <nom> — 7 actes, 35 steps, 105 choix"
git push
```

La GitHub Action `validate-catalog.yml` re-vérifie côté CI à chaque push.

---

## Cas particuliers

### Scène ajoutée à une saga existante

Modifier `scripts/apply_saga_<nom>.py` pour ajouter le nouvel id à
`SAGA_ENTRY["scenes"]`, puis ré-exécuter le script. L'injection est dédupliquée
par id de saga, donc la deuxième passe met juste à jour la liste de scènes
sans dupliquer l'entry.

⚠️ Bumper `sw.js` manuellement si le script ne le fait pas (logique idempotente
basée sur la présence de l'id saga dans `sw.js` peut empêcher le bump si déjà
appliqué).

### Renommage d'une scène

1. Mettre à jour l'id dans le fichier `scenes/<nouveau-nom>.json`
2. Mettre à jour la liste `SAGA_ENTRY["scenes"]` dans `apply_saga_<nom>.py`
3. Supprimer manuellement la référence à l'ancien id dans `data/campaigns.json`
4. Régénérer : `python3 scripts/build_scenes_index.py && python3 scripts/build_search_index.py && python3 scripts/generate_counts.py`
5. Valider : `python3 scripts/check_campaigns_parity.py`

### Suppression d'une saga

1. Supprimer les fichiers `scenes/ch-affaire-<nom>-*.json`
2. Retirer l'entry dans `data/campaigns.json`
3. Bumper `sw.js` manuellement (cache flush clients)
4. Régénérer méta : `python3 scripts/build_scenes_index.py && python3 scripts/build_search_index.py && python3 scripts/generate_counts.py`

---

## Réparation d'urgence

Si le catalogue est dans un état incohérent (scènes orphelines, version SW
décalée, counts.json obsolète), exécuter :

```bash
bash repair_all_sagas.sh
```

Ce script ré-exécute les 11 scripts `apply_saga_*.py` dans l'ordre canonique
et restaure intégralement les métadonnées. Idempotent : aucun risque
d'exécution répétée.

---

## Anti-patterns à éviter

❌ **Copier des scènes via `git pull` sans exécuter `apply_saga_*.py`**
   → bug du 2 juin 2026, 78 scènes orphelines.

❌ **Éditer `data/campaigns.json` manuellement**
   → risque d'incohérence avec `sw.js` (cache version) et `data/counts.json`.

❌ **Désactiver le pre-commit hook (`--no-verify`)**
   → masque les régressions au lieu de les détecter avant push.

❌ **Bypasser la GitHub Action `validate-catalog`**
   → la branche restera dans un état où l'UI navigation est cassée.

❌ **Oublier de bumper `sw.js`**
   → les clients PWA continueront à utiliser l'ancien cache et ne verront
   jamais les nouvelles scènes même si elles sont déployées côté serveur.
