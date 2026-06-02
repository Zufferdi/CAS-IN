#!/usr/bin/env bash
# repair_all_sagas.sh — Réparation in-place du workspace CAS-IN
# Ré-injecte les 11 sagas CH dans campaigns.json + bump SW + régénère méta.
# Idempotent : peut être exécuté plusieurs fois sans effet de bord.
#
# Usage : à exécuter depuis la RACINE du workspace (où se trouvent sw.js + index.html + scripts/)
#   bash repair_all_sagas.sh
set -e

if [ ! -f "sw.js" ] || [ ! -f "index.html" ]; then
    echo "❌ À exécuter depuis la racine du workspace CAS-IN (sw.js + index.html introuvables)"
    exit 1
fi

if [ ! -d "scripts" ]; then
    echo "❌ Dossier scripts/ introuvable"
    exit 1
fi

echo "═══════════════════════════════════════════════════════════════"
echo "  CAS-IN — Réparation des 11 sagas CH orphelines"
echo "═══════════════════════════════════════════════════════════════"

SAGAS=(
    cryptomixer
    coinlaundry
    frappes_cognitives
    donnees_brocante
    pegasus_mobiles
    osint_yemen
    shadow_fleet
    police_predictive
    or_russe
    data_brokers
    g7
)

for s in "${SAGAS[@]}"; do
    script="scripts/apply_saga_${s}.py"
    if [ -f "$script" ]; then
        echo ""
        echo "── apply_saga_${s}.py ──"
        python3 "$script" 2>&1 | grep -E "✅|⏭|❌|SW bumpé|déjà présente|Saga ajoutée" || true
    else
        echo "⚠️  $script introuvable, saga ignorée"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Validation finale (check_campaigns_parity)"
echo "═══════════════════════════════════════════════════════════════"

if [ -f "scripts/check_campaigns_parity.py" ]; then
    python3 scripts/check_campaigns_parity.py
else
    echo "ℹ️  scripts/check_campaigns_parity.py absent (l'installer depuis le patch d'audit)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  État final"
echo "═══════════════════════════════════════════════════════════════"
grep "CACHE_VERSION = '" sw.js | head -1
python3 -c "
import json, os, glob
d = json.load(open('data/campaigns.json'))
camps = d.get('campaigns', d) if isinstance(d,dict) else d
print(f'Campagnes totales : {len(camps)}')
disk = set(os.path.basename(f).replace('.json','') for f in glob.glob('scenes/*.json') if 'index' not in f)
ref = set()
for c in camps:
    for s in c.get('scenes', []): ref.add(s)
print(f'Scènes sur disque : {len(disk)}')
print(f'Scènes référencées : {len(ref)}')
print(f'Orphelines restantes : {len(disk - ref)}')
"
