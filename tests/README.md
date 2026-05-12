# Tests — Archive

Ces 2 fichiers de test ont été archivés car aucun runner n'était configuré
(pas de `package.json`, pas de CI job qui les lance).

- `test-achievements-sync.js` — vérifie la cohérence des achievements (Node)
- `test-cas-in.js` — suite de tests pour les fonctions de quiz et scènes (Node)

## Pour les relancer manuellement (Node)

```bash
node tests-archive/test-achievements-sync.js
node tests-archive/test-cas-in.js scenes/*.json
```

## Pour les remettre en vie

Si tu veux des tests automatisés à l'avenir, le bon point de départ est :
1. Ajouter `package.json` à la racine avec une dépendance dev (Jest, Vitest, node:test natif…)
2. Convertir ces fichiers en suite de tests
3. Ajouter un GitHub Action qui lance `npm test` à chaque push

D'ici là, ces fichiers servent de référence pour le comportement attendu.
