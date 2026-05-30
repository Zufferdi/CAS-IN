#!/usr/bin/env bash
# cleanup-questions-legacy.sh
#
# v132j — Supprime data/questions.json legacy (4.2 MB).
#
# v132f a découpé questions.json en 8 chunks (data/questions/quiz-*.json)
# avec un index (data/questions-index.json). Les 3 consommateurs (quiz-app,
# exam-app, cas-in-search) chargent désormais via les chunks. Le fichier
# original n'est plus précachée par le SW depuis v132f.
#
# Ce cleanup retire le fichier legacy. La fonction de fallback dans
# quiz-app/exam-app/cas-in-search continuera de tenter `data/questions.json`
# si l'index est absent — mais maintenant qu'on est confiant que les chunks
# fonctionnent en prod, on peut supprimer.
#
# À exécuter à la racine du repo CAS-IN.

set -e

if [ ! -f "data/questions.json" ]; then
    echo "  ⚠️  data/questions.json déjà absent — rien à faire."
    exit 0
fi

if [ ! -f "data/questions-index.json" ] || [ ! -d "data/questions" ]; then
    echo "  ❌ data/questions-index.json ou data/questions/ absent."
    echo "  ❌ Le delta v132f doit être appliqué AVANT ce cleanup."
    echo "  ❌ Cleanup ABANDONNÉ pour éviter de casser l'app."
    exit 1
fi

# Vérifier que les 8 chunks existent
n_chunks=$(ls data/questions/quiz-*.json 2>/dev/null | wc -l)
if [ "$n_chunks" -lt 8 ]; then
    echo "  ❌ Seulement $n_chunks chunks trouvés (8 attendus)."
    echo "  ❌ Cleanup ABANDONNÉ."
    exit 1
fi

size=$(du -h data/questions.json | cut -f1)
echo "  🗑️  Suppression de data/questions.json ($size)"
rm data/questions.json
echo "  ✅ Cleanup réussi. Économie : $size"
echo ""
echo "  💡 Si après déploiement l'app a un problème de fallback,"
echo "     restaurer depuis git : git checkout data/questions.json"
