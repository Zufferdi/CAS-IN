# Scripts de build — CAS-IN

## Vue d'ensemble

Le repo CAS-IN comporte plusieurs étapes de build à exécuter après modification structurelle. Le script orchestrateur `build-all.sh` les enchaîne dans le bon ordre.

## Workflow recommandé

### Pour un développement courant

Lancer le build complet manuellement après chaque session :

```bash
./scripts/build-all.sh
```

Cela exécute :

1. `generate_counts.py` → `data/counts.json` (compteurs questions/fiches/scènes/TP)
2. `build_index.py` → `fiches/index.html` (cards d'accès aux fiches)
3. `build_search_index.py` → `data/search-index.json` (index full-text de la recherche)
4. `check_questions.py` (vérifications) + tests Node

### Mode rapide (--quick)

Saute l'index full-text (la régen prend 2-3s) :

```bash
./scripts/build-all.sh --quick
```

Utile lors d'itérations rapides où on ne touche pas au contenu des fiches.

## Hook pre-commit (auto-régen index)

Pour que `data/search-index.json` soit toujours à jour avec les fiches modifiées dans un commit :

```bash
# Installation (une fois)
chmod +x scripts/git-hooks/pre-commit
ln -sf ../../scripts/git-hooks/pre-commit .git/hooks/pre-commit
```

Désormais, à chaque `git commit`, si une fiche `fiches/*.html` est modifiée :

- `build_search_index.py` est exécuté automatiquement
- `build_index.py` aussi (au cas où une fiche est ajoutée)
- Les fichiers régénérés sont ajoutés au commit en cours

Si la régénération échoue, le commit est annulé.

## Scripts individuels

| Script | Rôle | Output |
|---|---|---|
| `generate_counts.py` | Compte questions/fiches/scènes/TP | `data/counts.json` |
| `build_index.py` | Génère cards de la page index | `fiches/index.html` |
| `build_search_index.py` | Indexe le contenu full-text des fiches | `data/search-index.json` |
| `check_questions.py` | Vérifications structurelles questions | (stdout) |
| `clean_inline_styles.py` | Nettoyage inline styles (rare) | en place |
| `split_scenes.py` | Découpage scenes.json (legacy) | `scenes/*.json` |
| `sync_fiches_index.py` | Sync manifest ↔ HTML (rare) | (stdout) |
