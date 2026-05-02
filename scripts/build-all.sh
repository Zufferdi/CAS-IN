#!/usr/bin/env bash
# CAS-IN — Build orchestrator
# ───────────────────────────
# Lance toutes les étapes de build dans le bon ordre.
# À exécuter après chaque modification structurelle (ajout fiche, modif manifest, etc.)
#
# Usage :
#   ./scripts/build-all.sh           — build complet
#   ./scripts/build-all.sh --quick   — saute la régénération de l'index full-text (rapide)
#
# v1.0 — 2026-05-02

set -e

# Aller à la racine du repo (le script peut être lancé de n'importe où)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$REPO_ROOT"

QUICK=false
if [[ "$1" == "--quick" ]]; then
  QUICK=true
fi

echo "╔════════════════════════════════════════════════════╗"
echo "║  CAS-IN — Build complet                            ║"
echo "╚════════════════════════════════════════════════════╝"
echo

# ─── 1) Compteurs (counts.json) ───
echo "▸ [1/5] Régénération de data/counts.json"
python3 scripts/generate_counts.py
echo

# ─── 2) Index des fiches (fiches/index.html) ───
echo "▸ [2/5] Régénération de fiches/index.html"
python3 scripts/build_index.py
echo

# ─── 3) Index full-text (data/search-index.json) ───
if [[ "$QUICK" == "true" ]]; then
  echo "▸ [3/5] [SKIP] Index full-text (--quick)"
else
  echo "▸ [3/5] Régénération de data/search-index.json"
  python3 scripts/build_search_index.py
fi
echo

# ─── 4) Liens croisés Q ↔ Fiche ↔ TP ↔ Scènes ───
echo "▸ [4/5] Régénération de data/cross-links.json"
python3 scripts/build_cross_links.py
echo

# ─── 5) Vérification cohérence questions ↔ achievements ↔ tests ───
echo "▸ [5/5] Vérifications de cohérence"
if [[ -f scripts/check_questions.py && -f data/questions.json ]]; then
  python3 scripts/check_questions.py data/questions.json 2>&1 | tail -15 || true
fi
if [[ -f tests/test-achievements-sync.js ]]; then
  node tests/test-achievements-sync.js 2>&1 | grep -E "✅|❌|⚠" | head -5
fi
echo

echo "╔════════════════════════════════════════════════════╗"
echo "║  ✓ Build terminé                                   ║"
echo "╚════════════════════════════════════════════════════╝"
