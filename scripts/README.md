# Scripts de build — CAS-IN

## 🤖 Automatisation par GitHub Actions (cas standard)

**Tu n'as rien à faire en local.** Tout se passe automatiquement quand tu modifies une fiche depuis github.com.

Le workflow `.github/workflows/sync-fiches-index.yml` se déclenche à chaque push qui touche :
- `fiches/**.html` — fiche ajoutée ou modifiée
- `data/manifest.json` — manifest mis à jour
- `scenes/**.json` — scène ajoutée ou modifiée
- `tp.html` — catégories TP modifiées
- Les scripts de build dans `scripts/`

Étapes exécutées (~35-50 s) :

1. **Injection de `fiche-related.js`** dans les nouvelles fiches qui ne l'ont pas via `inject_fiche_related.py` (idempotent)
2. **Régénération de `fiches/index.html`** (cards d'accès) via `build_index.py`
3. **Régénération de `data/search-index.json`** (moteur de recherche full-text) via `build_search_index.py`
4. **Régénération de `data/cross-links.json`** (liens Q ↔ Fiche ↔ TP ↔ Scènes) via `build_cross_links.py`
5. Commit groupé sous `github-actions[bot]` avec message `chore: auto-rebuild fiches/index, search-index, cross-links + inject fiche-related`

### Garanties
- **Idempotent** : peut tourner 100 fois sans rien casser, ne commit que ce qui a vraiment changé
- **Anti-boucle** : skip si le commit vient déjà du bot (`if: !contains(commit.message, 'auto-rebuild')`)
- **Anti-race** : `concurrency` group annule les runs précédents sur la même branche
- **Retry** : 3 tentatives de push avec rebase en cas de conflit

### Si l'Action échoue
Onglet **Actions** sur github.com → `Sync fiches index, search-index, cross-links & inject fiche-related` → cliquer sur le run en rouge → lire les logs.

Tu peux aussi déclencher manuellement via le bouton **"Run workflow"** (`workflow_dispatch`).

## 💻 Workflow CLI (optionnel, pour développement local)

Si un jour tu travailles le repo en local (clone + édition + commit en CLI), tu peux :

### Build complet manuel

```bash
./scripts/build-all.sh
```

Cela exécute :

1. `generate_counts.py` → `data/counts.json`
2. `build_index.py` → `fiches/index.html`
3. `build_search_index.py` → `data/search-index.json`
4. `build_cross_links.py` → `data/cross-links.json`
5. `check_questions.py` + tests Node

### Mode rapide (--quick)

```bash
./scripts/build-all.sh --quick
```

Saute les régénérations lentes (search-index).

### Hook pre-commit (CLI uniquement)

```bash
chmod +x scripts/git-hooks/pre-commit
ln -sf ../../scripts/git-hooks/pre-commit .git/hooks/pre-commit
```

À chaque `git commit` qui touche une fiche, régénère search-index et fiches/index.html. **Inutile si tu ne fais que du github.com** — le workflow Actions fait déjà ça côté serveur.

## Scripts individuels

| Script | Rôle | Output |
|---|---|---|
| `generate_counts.py` | Compte questions/fiches/scènes/TP | `data/counts.json` |
| `build_index.py` | Génère cards de la page index | `fiches/index.html` |
| `build_search_index.py` | Indexe le contenu full-text des fiches | `data/search-index.json` |
| `build_cross_links.py` | Mappe fiches ↔ questions/TP/scènes | `data/cross-links.json` |
| `inject_fiche_related.py` | Injecte `fiche-related.js` dans les fiches qui ne l'ont pas | Fiches modifiées en place |
| `check_questions.py` | Vérifications structurelles questions | (stdout) |
| `clean_inline_styles.py` | Nettoyage inline styles (rare) | en place |
| `split_scenes.py` | Découpage scenes.json (legacy) | `scenes/*.json` |
| `sync_fiches_index.py` | Sync manifest ↔ HTML (rare) | (stdout) |
