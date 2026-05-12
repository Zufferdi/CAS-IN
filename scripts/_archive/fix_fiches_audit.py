#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix_fiches_audit.py
===================

Patch automatisé pour corriger les erreurs factuelles identifiées dans
l'audit des fiches CAS-IN-2.10 (mai 2026).

Corrections appliquées :
    1. suisse.html — "Affaire GPS Soleure (2015-2025)" → "GPS Bâle-Campagne (2015-2020)"
       - Source : TF arrêt du 20.05.2020, Tribunal pénal BL 26.01.2018,
                  Tribunal cantonal BL 27.10.2020. ~65'000 CHF frais
                  Tribunal cantonal (>50% des 124'000 CHF totaux dus
                  au GPS sans autorisation).
       - Réf : https://www.20min.ch/fr/story/un-mouchard-gps-engendre-65000-francs-de-frais-de-justice-890665234290

    2. autorites_competences_ch.html — "NEDIC" → "NEDIK"
       - Source : cybercrimepolice.ch, convention CCDJP-CCPCS 01.01.2021
       - NEDIK = Réseau national de soutien aux enquêtes dans la lutte
                 contre la criminalité informatique.

    3. autorites_competences_ch.html — "LSI art. 74c" → "LSI art. 74b/74e"
       - Justification : art. 74c LSI = exceptions ; le délai 24h est dans
                          art. 74e LSI ; assujettissement art. 74b LSI.

    4. mitre_attack.html — Mise à jour v18 (oct 2025) → v19 (avril 2026)
       - Source : https://attack.mitre.org/resources/updates/updates-april-2026/
       - Enterprise = 15 Tactics, 222 Techniques, 475 Sub-Techniques,
                       174 Groups, 821 Software.

    5. preuve.html — Insertion encadré "TF 7B_550/2024 (23.01.2026) —
                      Abandon partiel de l'ATF 148 IV 221"
       - Source : Marcel Eggler (KGG Avocats), LinkedIn avril 2026
       - Le TF abandonne BGE 148 IV 221 et autorise la copie-miroir
         préventive d'un smartphone avant l'expiration du délai de 3
         jours pour demander les scellés, au motif que les iPhones
         basculent en "Before First Unlock" après brève inactivité.

    6. data/counts.json — Sync fiches : 115 → 116
       - Vérifié par décompte direct des cartes dans index.html.

Idempotence : chaque substitution est faite via str.replace conditionnel.
Le script peut être relancé sans dégât.

Usage :
    python3 fix_fiches_audit.py [--repo /chemin/vers/CAS-IN-2.10-cleaning]
    python3 fix_fiches_audit.py --dry-run    # affiche sans écrire
    python3 fix_fiches_audit.py --check      # vérifie l'état actuel

Sortie : log structuré indiquant chaque correction appliquée ou skip.
"""

import argparse
import json
import re
import sys
from pathlib import Path
from datetime import datetime, timezone


# ── Configuration des corrections ────────────────────────────────────────────

FIXES = []  # populé ci-dessous


def add_fix(file, label, old, new, mandatory_present=True, idempotency_marker=None):
    """Enregistre une correction de remplacement de chaîne."""
    FIXES.append({
        "file": file,
        "label": label,
        "old": old,
        "new": new,
        "mandatory_present": mandatory_present,
        "idempotency_marker": idempotency_marker,
    })


# ──── FIX 1 : suisse.html — Affaire GPS Soleure → Bâle-Campagne ───────────────

add_fix(
    "fiches/suisse.html",
    "GPS Soleure → GPS Bâle-Campagne (note dans bloc art. 269 ss CPP)",
    old='Affaire GPS Soleure (2015-2025) : GPS installé sans art. 269 → preuve écartée mais condamnation maintenue (65\'000 CHF de frais supplémentaires).',
    new='Affaire GPS Bâle-Campagne (2015-2020) : GPS installé sans autorisation MP (art. 269 CPP) → preuve écartée par le TF (arrêt du 20.05.2020) mais condamnation maintenue par Tribunal cantonal BL le 27.10.2020. Coût : ~65\'000 CHF de frais supplémentaires (Tribunal cantonal), >50% des ~124\'000 CHF totaux de la procédure dus au mouchard sans autorisation.',
)

add_fix(
    "fiches/suisse.html",
    "GPS Soleure → GPS Bâle-Campagne (titre de la case-card)",
    old='<div class="case-title">🚗 GPS Soleure (2015–2025)</div>',
    new='<div class="case-title">🚗 GPS Bâle-Campagne (2015–2020)</div>',
)


# ──── FIX 2 : autorites_competences_ch.html — NEDIC → NEDIK ───────────────────

add_fix(
    "fiches/autorites_competences_ch.html",
    "NEDIC → NEDIK (acronyme officiel)",
    old='└─ NEDIC — réseau enquêteurs cyber inter-cantons',
    new='└─ NEDIK — Réseau national de soutien aux enquêtes en criminalité informatique (CCDJP-CCPCS, 01.01.2021)',
)


# ──── FIX 3 : autorites_competences_ch.html — LSI art. 74c → 74b/74e ──────────

add_fix(
    "fiches/autorites_competences_ch.html",
    "LSI art. 74c → 74b/74e (questionnaire interactif)",
    old='<span style="font-size:.9rem">Infrastructure critique nationale (LSI art. 74c) ?</span>',
    new='<span style="font-size:.9rem">Infrastructure critique nationale (LSI art. 74b — assujettissement, art. 74e — délai 24h) ?</span>',
)

add_fix(
    "fiches/autorites_competences_ch.html",
    "LSI art. 74c → 74b/74e (réponse infra critique)",
    old="Depuis le 1<sup>er</sup> avril 2025 (OCyS, art. 74c LSI), les exploitants d\\'infrastructures critiques doivent signaler les cyberattaques à l\\'OFCS sous 24h.",
    new="Depuis le 1<sup>er</sup> avril 2025 (OCyS + LSI : art. 74b assujettissement, art. 74e délai 24h, art. 74c exceptions), les exploitants d\\'infrastructures critiques doivent signaler les cyberattaques à l\\'OFCS sous 24h.",
)

add_fix(
    "fiches/autorites_competences_ch.html",
    "LSI art. 74c → 74b/74e (légende légale)",
    old="legal = 'art. 74c LSI · OCyS';",
    new="legal = 'art. 74b/74e LSI · OCyS (art. 74c = exceptions)';",
)


# ──── FIX 4 : mitre_attack.html — v18 oct 2025 → v19 avril 2026 ──────────────

# Le décompte officiel MITRE avril 2026 : 15 Tactics, 222 Techniques,
# 475 Sub-Techniques, 174 Groups, 821 Software, 56 Campaigns.

add_fix(
    "fiches/mitre_attack.html",
    "MITRE meta-description : v18 → v19 avril 2026",
    old='<meta name="description" content="MITRE ATT&CK · 14 tactiques · 200+ techniques · Sub-techniques · Mapping · D3FEND">',
    new='<meta name="description" content="MITRE ATT&CK · 15 tactiques · 222 techniques · Sub-techniques · Mapping · D3FEND (v19, avril 2026)">',
)

add_fix(
    "fiches/mitre_attack.html",
    "MITRE meta-line principale (216→222, 14→15, oct 2025→avril 2026)",
    old='<div class="meta">14 tactiques · 216 techniques · 475 sous-techniques (v18, oct 2025) · TTP · Navigator · Pyramid of Pain · Sigma</div>',
    new='<div class="meta">15 tactiques · 222 techniques · 475 sous-techniques (v19, avril 2026) · TTP · Navigator · Pyramid of Pain · Sigma</div>',
)

add_fix(
    "fiches/mitre_attack.html",
    "MITRE pyramide niveau Tactique : 14 → 15",
    old='<span style="color:var(--dim);font-family:var(--sans);font-size:.78rem">14 tactiques · IDs de forme <code>TA00xx</code> · ex : Credential Access (TA0006)</span>',
    new='<span style="color:var(--dim);font-family:var(--sans);font-size:.78rem">15 tactiques (Enterprise v19) · IDs de forme <code>TA00xx</code> · ex : Credential Access (TA0006)</span>',
)

add_fix(
    "fiches/mitre_attack.html",
    "MITRE pyramide niveau Technique : 216 → 222",
    old='<span style="color:var(--dim);font-family:var(--sans);font-size:.78rem">216 techniques · IDs <code>T1xxx</code> · ex : OS Credential Dumping (T1003)</span>',
    new='<span style="color:var(--dim);font-family:var(--sans);font-size:.78rem">222 techniques (Enterprise v19) · IDs <code>T1xxx</code> · ex : OS Credential Dumping (T1003)</span>',
)

add_fix(
    "fiches/mitre_attack.html",
    "MITRE encadré Enterprise : 14/216 → 15/222",
    old='<p><strong>14 tactiques · 216 techniques · 475 sub-techniques</strong> (v18, oct 2025)</p>',
    new='<p><strong>15 tactiques · 222 techniques · 475 sub-techniques</strong> (v19, avril 2026)</p>',
)

add_fix(
    "fiches/mitre_attack.html",
    "MITRE phrase pédagogique : 216 → 222 techniques",
    old='<strong>la même pour toutes les 216 techniques</strong>',
    new='<strong>la même pour toutes les 222 techniques</strong>',
)

add_fix(
    "fiches/mitre_attack.html",
    "MITRE groupes : 176 (v18) → 174 (v19)",
    old='<p>176 groupes (v18) avec ID <code>G0xxx</code></p>',
    new='<p>174 groupes (v19) avec ID <code>G0xxx</code></p>',
)

add_fix(
    "fiches/mitre_attack.html",
    "MITRE softwares : 784 (v18) → 821 (v19)",
    old='<p>784 softwares (v18) avec ID <code>S0xxx</code></p>',
    new='<p>821 softwares (v19) avec ID <code>S0xxx</code></p>',
)


# ──── FIX 5 : preuve.html — Insertion encadré TF 7B_550/2024 ──────────────────
#
# Insertion juste après la section "RÈGLE D'OR JURISPRUDENTIELLE" et avant
# le bloc quiz-wrap. On utilise l'ancre suivante comme point d'insertion.

NEW_BLOCK_TF_7B_550 = '''
    <!-- ────────── ACTUALITÉ 2026 : TF 7B_550/2024 ────────── -->
    <div class="card card-orange" style="margin-top:.85rem;border-left:4px solid var(--orange,#FF9F40)">
      <div class="ct">🔥 Actualité 2026 — TF 7B_550/2024 du 23 janvier 2026 : abandon partiel de l'ATF 148 IV 221</div>
      <p>Dans un arrêt <strong>rendu à cinq juges</strong> et destiné à publication, le Tribunal fédéral <strong>abandonne le BGE 148 IV 221</strong> et autorise désormais la <strong>copie-miroir préventive</strong> des données d'un smartphone <em>avant même</em> l'expiration du délai de 3 jours pour demander les scellés (art. 248 al. 1 CPP).</p>
      <p><strong>Argument technique du TF</strong> : les iPhones modernes basculent automatiquement en mode <em>Before First Unlock</em> (BFU) après une courte inactivité, rendant l'extraction quasi impossible si l'enquêteur attend la mise sous scellés. Pour ne pas perdre les données volatiles (kernel keys, données chiffrées par classe Data Protection), une copie-miroir <strong>immédiate</strong> sur place est autorisée.</p>
      <ul>
        <li><strong>Conditions</strong> : la copie reste une <em>sécurisation technique</em>, jamais une <em>exploitation</em>. L'autorité de poursuite ne consulte rien tant que le TMC n'a pas statué.</li>
        <li><strong>Garde-fou</strong> : la copie-miroir est immédiatement scellée. Le contrôle judiciaire (TMC/TPF) intervient ensuite sur le contenu de la copie, pas sur le support original.</li>
        <li><strong>Tension avec l'ATF 151 IV 73</strong> : l'ATF 151 IV 73 interdit d'obtenir le code PIN sans garanties art. 158 CPP (nemo tenetur), mais le TF 7B_550/2024 permet de contourner ce verrou en copiant les données <em>avant</em> toute intervention judiciaire — paradoxe relevé par la doctrine (M. Eggler, KGG Avocats).</li>
      </ul>
      <p style="font-size:.72rem;color:var(--muted);margin-top:.5rem"><strong>État du droit au 11 mai 2026</strong> : ATF 148 IV 221 reste applicable pour les supports physiques classiques (disques durs, clés USB hors smartphones BFU). TF 7B_515/2024 reste applicable pour les données déjà transmises électroniquement par un tiers (ex : banque via portail). TF 7B_550/2024 s'applique spécifiquement aux smartphones modernes en saisie de terrain. Toujours vérifier la jurisprudence la plus récente avant intervention.</p>
    </div>
'''

# Le bloc actuel à remplacer : on insère AVANT </div> qui ferme la section
# "RÈGLE D'OR JURISPRUDENTIELLE", juste après le bloc <div class="alert">.
# On utilise un marqueur unique pour repérer le point d'insertion.

INSERTION_ANCHOR_OLD = '''    <div class="quiz-wrap" style="margin-top:.85rem">
      <div class="quiz-q">Lors d'une perquisition, vous saisissez un ordinateur et la personne concernée demande immédiatement la mise sous scellés. Que faites-vous ?<small>Scellés · Niveau : moyen</small></div>'''

INSERTION_ANCHOR_NEW = NEW_BLOCK_TF_7B_550 + '''
    <div class="quiz-wrap" style="margin-top:.85rem">
      <div class="quiz-q">Lors d'une perquisition, vous saisissez un ordinateur et la personne concernée demande immédiatement la mise sous scellés. Que faites-vous ?<small>Scellés · Niveau : moyen</small></div>'''

add_fix(
    "fiches/preuve.html",
    "Insertion encadré TF 7B_550/2024 (23.01.2026) sur abandon partiel ATF 148 IV 221",
    old=INSERTION_ANCHOR_OLD,
    new=INSERTION_ANCHOR_NEW,
    idempotency_marker="ACTUALITÉ 2026 : TF 7B_550/2024",
)


# ──── FIX 6 : data/counts.json — sync 115 → 116 fiches ──────────────────────
#
# Géré séparément (JSON, pas string-replace HTML).


# ──── Logique principale ───────────────────────────────────────────────────

def apply_fix(repo_root: Path, fix: dict, dry_run: bool = False) -> str:
    """
    Applique une correction. Retourne un statut :
        'OK'     : modification appliquée
        'SKIP'   : déjà appliquée (idempotent) ou non applicable
        'ERROR'  : motif d'erreur dans le statut
    """
    fpath = repo_root / fix["file"]
    if not fpath.exists():
        return f"ERROR fichier introuvable : {fpath}"

    content = fpath.read_text(encoding="utf-8")

    # Détection idempotence robuste : on prend une fenêtre unique de "new"
    # qui n'apparaît PAS dans "old", pour gérer le cas où new contient old
    # (insertions avant ancre). On utilise un marqueur explicite si fourni.
    marker = fix.get("idempotency_marker")
    if marker:
        if marker in content:
            return "SKIP (déjà appliqué, marqueur trouvé)"
    else:
        # Heuristique : prendre les 80 premiers caractères de new qui ne sont
        # pas dans old.
        new_only = fix["new"]
        for chunk_len in (200, 120, 80, 40):
            for start in range(0, max(1, len(new_only) - chunk_len + 1)):
                chunk = new_only[start:start + chunk_len]
                if chunk and chunk not in fix["old"]:
                    if chunk in content:
                        return "SKIP (déjà appliqué)"
                    break
            else:
                continue
            break

    if fix["old"] not in content:
        if fix["mandatory_present"]:
            return f"ERROR snippet introuvable dans {fix['file']}"
        return "SKIP (snippet absent, optionnel)"

    new_content = content.replace(fix["old"], fix["new"], 1)
    if not dry_run:
        fpath.write_text(new_content, encoding="utf-8")
    return "OK"


def fix_counts_json(repo_root: Path, dry_run: bool = False) -> str:
    """Sync data/counts.json : fiches → 116 (décompte réel)."""
    cpath = repo_root / "data" / "counts.json"
    if not cpath.exists():
        return f"ERROR fichier introuvable : {cpath}"

    data = json.loads(cpath.read_text(encoding="utf-8"))
    current = data.get("fiches")
    target = 116

    if current == target:
        return "SKIP (déjà à jour)"

    data["fiches"] = target
    data["generated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+00:00")
    data["$comment"] = (
        "Auto-généré par scripts/generate_counts.py. "
        "Corrigé manuellement par fix_fiches_audit.py "
        f"(fiches: {current} → {target} suite à audit factuel mai 2026)."
    )

    if not dry_run:
        cpath.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    return f"OK ({current} → {target})"


def fix_index_total_count(repo_root: Path, dry_run: bool = False) -> str:
    """Sync compteur affiché dans fiches/index.html à 116."""
    ipath = repo_root / "fiches" / "index.html"
    if not ipath.exists():
        return f"ERROR fichier introuvable : {ipath}"

    content = ipath.read_text(encoding="utf-8")

    # On corrige <span id="total-count">XXX</span> et <strong id="stat-total">XXX</strong>
    # Le décompte réel = 116 cartes uniques.
    new_content = re.sub(
        r'<span id="total-count">\d+</span>',
        '<span id="total-count">116</span>',
        content,
    )
    new_content = re.sub(
        r'<strong id="stat-total">\d+</strong>',
        '<strong id="stat-total">116</strong>',
        new_content,
    )

    if new_content == content:
        return "SKIP (déjà à jour)"

    if not dry_run:
        ipath.write_text(new_content, encoding="utf-8")
    return "OK"


# ──── CLI ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n", 1)[0])
    parser.add_argument(
        "--repo", type=Path, default=Path.cwd(),
        help="Racine du repo CAS-IN-2.10-cleaning (défaut : cwd)",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Affiche les corrections sans écrire",
    )
    parser.add_argument(
        "--check", action="store_true",
        help="Affiche uniquement l'état actuel (= dry-run + sortie verbeuse)",
    )
    args = parser.parse_args()

    repo = args.repo.resolve()
    dry = args.dry_run or args.check

    print(f"📂 Repo : {repo}")
    print(f"🔧 Mode : {'DRY-RUN (check)' if dry else 'APPLY'}\n")

    summary = {"OK": 0, "SKIP": 0, "ERROR": 0}

    print("━━━ Corrections de fichiers HTML ━━━")
    for fix in FIXES:
        status = apply_fix(repo, fix, dry_run=dry)
        head = status.split()[0]
        summary[head] = summary.get(head, 0) + 1
        icon = {"OK": "✅", "SKIP": "⏭️ ", "ERROR": "❌"}.get(head, "  ")
        print(f"  {icon} {fix['file']:50s} | {fix['label']}")
        print(f"      └─ {status}")

    print("\n━━━ Sync compteur fiches ━━━")

    s = fix_counts_json(repo, dry_run=dry)
    head = s.split()[0]
    summary[head] = summary.get(head, 0) + 1
    icon = {"OK": "✅", "SKIP": "⏭️ ", "ERROR": "❌"}.get(head, "  ")
    print(f"  {icon} data/counts.json (fiches: 115 → 116) | {s}")

    s = fix_index_total_count(repo, dry_run=dry)
    head = s.split()[0]
    summary[head] = summary.get(head, 0) + 1
    icon = {"OK": "✅", "SKIP": "⏭️ ", "ERROR": "❌"}.get(head, "  ")
    print(f"  {icon} fiches/index.html (total-count, stat-total → 116) | {s}")

    print(f"\n━━━ Résumé ━━━")
    print(f"  ✅ Appliquées (ou déjà OK)  : {summary.get('OK', 0)}")
    print(f"  ⏭️  Skipped (idempotent)     : {summary.get('SKIP', 0)}")
    print(f"  ❌ Erreurs                  : {summary.get('ERROR', 0)}")

    if dry:
        print("\nℹ️  DRY-RUN : aucune modification écrite. Relancer sans "
              "--dry-run / --check pour appliquer.")

    return 0 if summary.get("ERROR", 0) == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
