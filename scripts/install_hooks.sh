#!/usr/bin/env bash
# install_hooks.sh — Installe les hooks git locaux CAS-IN.
#
# Configure git pour utiliser le dossier .git-hooks/ versionné dans le repo
# au lieu du .git/hooks/ par défaut (qui n'est pas versionné).
#
# Idempotent : peut être ré-exécuté sans effet de bord.
#
# Usage : bash scripts/install_hooks.sh
set -e

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

if [ ! -d ".git-hooks" ]; then
    echo "❌ Dossier .git-hooks/ introuvable à la racine du repo"
    exit 1
fi

# Configurer git pour utiliser .git-hooks/ comme dossier de hooks
git config core.hooksPath .git-hooks
echo "✅ git config core.hooksPath = .git-hooks"

# S'assurer que les scripts sont exécutables
chmod +x .git-hooks/* 2>/dev/null || true
echo "✅ Permissions exécutables appliquées aux hooks"

# Lister les hooks installés
echo ""
echo "Hooks installés :"
for h in .git-hooks/*; do
    if [ -f "$h" ] && [ -x "$h" ]; then
        echo "  - $(basename $h)"
    fi
done

echo ""
echo "Désinstallation (si nécessaire) : git config --unset core.hooksPath"
