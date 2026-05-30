#!/usr/bin/env python3
"""
finalize_all.py — CAS-IN v132u (bundle de finalisation)

Termine proprement la cascade v131b → v132t sur un repo qui en est resté à
mi-chemin (v131c cleanup non fait, v132r partiel, v132t pas appliqué, 2 bugs
CSP). Le script est ENTIÈREMENT IDEMPOTENT : ré-exécutable sans effet de
bord, chaque étape vérifie son propre état avant d'agir.

Pipeline en 10 étapes :
  1. Supprime les 15 HTML doublés en racine (cleanup v131c)
  2. (optionnel) Archive data/questions.json legacy
  3. Ajoute acte 1 + acte 2 de la saga Antennes Fantômes
  4. Ajoute les 8 NPCs de la saga
  5. Ajoute la campagne dans data/campaigns.json
  6. Ajoute scenes-chronology.json (7 entrées)
  7. Ajoute sms_blaster.html dans data/manifest.json
  8. Patch CSP sur artifacts.html + fiches/index.html (bugs résiduels v132l)
  9. Bump SW v144 → v145
 10. Insère section [3.0.1] dans docs/CHANGELOG.md
 11. Régénère data/counts.json via scripts/generate_counts.py

Lancer depuis la racine du repo CAS-IN.
Pour archiver questions.json legacy : ajouter --archive-legacy
"""
import json
import os
import re
import sys
import shutil
import argparse
import subprocess
from pathlib import Path
from datetime import datetime, timezone


# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────

OBSOLETE_ROOT_HTML = [
    'case-studies.html', 'case-study-detail.html', 'collections.html',
    'carriere.html', 'glossary.html', 'mastery.html', 'npcs.html',
    'parcours.html', 'parcours-detail.html', 'profile.html', 'sagas.html',
    'succes.html', 'tools.html', 'exam.html', 'scene-exam.html'
]

EXPECTED_NPCS = [
    'ofcom_spectrum_lead_be', 'procureur_mp_ge_cybercrime',
    'inspectrice_brigade_financiere_ge', 'juge_tmc_ge_perquisition',
    'avocat_defense_carouge_lj', 'tech_scpt_interception',
    'forensicien_for_ge', 'ingenieur_swisscom_security'
]

SAGA_SCENES = [
    'ge-affaire-antennes-fantomes-1-signal-alarme',
    'ge-affaire-antennes-fantomes-2-vague-correlee',
    'ge-affaire-antennes-fantomes-3-piste-telecom',
    'ge-affaire-antennes-fantomes-4-flagrant-delit',
    'ge-affaire-antennes-fantomes-5-forensique-for-ge',
    'ge-affaire-antennes-fantomes-6-cooperation-internationale',
    'ge-affaire-antennes-fantomes-7-audience-tco-geneve',
]

SAGA_CHRONO_DATES = [
    '2026-05-25', '2026-05-27', '2026-06-08', '2026-06-23',
    '2026-06-30', '2026-07-15', '2027-01-22'
]

NEW_FICHE_MANIFEST = {
    "file": "sms_blaster.html",
    "category": "mobile",
    "icon": "📡",
    "title": "SMS Blaster",
    "desc": "Fausse antenne LTE · Downgrade 2G · Chiffrement nul A5/0 · Cas Zurich-Genève-Toronto · Art. 22 LTC · 269bis CPP",
    "meta": "Mobile · RF",
    "isNew": True
}

CSP_TAG = (
    '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; '
    'script-src \'self\' \'unsafe-inline\'; '
    'style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; '
    'font-src \'self\' https://fonts.gstatic.com; '
    'img-src \'self\' data: blob:; '
    'connect-src \'self\'; '
    'media-src \'self\'; '
    'object-src \'none\'; '
    'base-uri \'self\'; '
    'form-action \'self\'; '
    'frame-ancestors \'none\'">'
)

CHANGELOG_NEW_SECTION = """## [3.0.1] — 2026-05-30

📡 **Saga « L'Affaire des Antennes Fantômes » + fiche technique SMS Blaster.** Premier contenu narratif post-jolification, inspiré du cas réel zurichois (oct. 2025, condamnation 9 mois sursis) et de Project Lighthouse Toronto (avril 2026, première détection au Canada). Cache SW bumpé v144 → v145.

### Ajouté

#### Saga narrative (v132r)
- **7 nouvelles scènes** Genève niveau expert : signal d'alarme → corrélation 89 plaintes → piste télécom (TMC + OFCOM) → flagrant délit Carouge → forensique FOR-GE → coopération internationale (Sofia + Chișinău) → audience TCO
- **84 décisions interactives** (7 actes × 4 phases × 3 choix avec feedbacks pédagogiques)
- **8 nouveaux NPCs** : procureur MP-GE cybercrime, inspectrice Brigade financière GE, juge TMC GE, commandant FOR-GE, avocat de défense Carouge, cheffe Spectrum Monitoring OFCOM, ingénieur SCPT, senior security Swisscom
- **10+ articles juridiques** traversés : 146 al. 2 CP, 22 LTC, 305bis CP, 269bis CPP, 282 CPP, 217 CPP, 141 al. 2 CPP, EIMP, Budapest art. 32, LBA art. 9
- **Issue réaliste** : condamnation partielle (3,5/4,5/1,5 ans + expulsions), vidéo écartée art. 141 al. 2 CPP, chef présumé reste libre en Bulgarie (citoyenneté UE)

#### Fiche technique (v132s)
- **`fiches/sms_blaster.html`** : 8 sections, 11 cards, 11 steps, tableau de 6 affaires réelles documentées (Zurich oct. 2025, Genève 1,9 M CHF, Vaud 260 k CHF, Toronto Project Lighthouse, Londres Tube, Paris 2022-2023)
- Détails techniques rigoureux : architecture SDR Ettus B210 + srsRAN + amplificateur 30 W, exploitation A5/0 (chiffrement nul 2G, 3GPP TS 43.020), downgrade 4G→2G par jamming, contournement filtres SMS-C opérateurs
- Cadre juridique suisse complet : 14+ articles + Convention de Budapest art. 32 + EIMP + MROS
- Liens croisés vers la saga et les fiches connexes

#### Finalisation (v132t + v132u)
- Entrée `sms_blaster.html` ajoutée dans `data/manifest.json` (catégorie mobile, isNew: true)
- SW `CACHE_VERSION` bumpé `cas-in-v144` → `cas-in-v145`
- Cleanup résiduel v131c : 15 doublons HTML supprimés de la racine (versions obsolètes sans CSP, encore présentes malgré le déplacement v131c en `pages/`)
- 2 bugs CSP résiduels corrigés : `artifacts.html` et `fiches/index.html` (oubliés de la passe v132l)

### Sources et rigueur factuelle

Tous les éléments factuels sont vérifiables :
- **24 heures, 8 mai 2026** — « SMS-Blaster : un Chinois pirate 50 000 téléphones en Suisse » (cas Zurich)
- **RTS, mai 2026** — détails techniques A5/0, portée, OFCS
- **Radio-Canada / CBC, avril 2026** — Project Lighthouse Toronto (3 arrestations, 13 M perturbations)
- **BBC, mars 2025** — affaire Daoyan Shang + Zhijia Fan, Londres Tube
- **3GPP TS 23.040, 23.003, 43.020** — spécifications SMS-PP, CGI format, A5/0

### Notes

- La saga est explicitement fictive (`realCase: false`) — noms inventés, mais inspirée d'événements réels documentés
- Aucun module JS ou CSS modifié — extension par ajout de contenu seul
- Bundle de finalisation `v132u` consolide les actions résiduelles de v131c (cleanup), v132r (saga complète), v132t (manifest+SW+CHANGELOG), et corrige 2 bugs CSP résiduels

---

"""


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def find_root() -> Path:
    here = Path(__file__).resolve().parent
    for candidate in (here, here.parent):
        if (candidate / 'sw.js').exists() and (candidate / 'data' / 'manifest.json').exists():
            return candidate
    print('[error] Racine CAS-IN introuvable.', file=sys.stderr)
    sys.exit(1)


def bundle_resources_dir(root: Path) -> Path:
    """Dossier où sont les ressources du bundle (_v132u_resources/ à la racine du repo)."""
    return root / '_v132u_resources'


def log(symbol: str, msg: str):
    print(f'  {symbol} {msg}')


# ─────────────────────────────────────────────────────────────
# Étapes
# ─────────────────────────────────────────────────────────────

def step_1_remove_obsolete_html(root: Path, dry_run: bool = False):
    """Supprime les 15 HTML doublés en racine (cleanup v131c)."""
    print('\n[1/12] Suppression des 15 HTML doublons racine (cleanup v131c)')
    removed = 0
    kept = 0
    for name in OBSOLETE_ROOT_HTML:
        root_file = root / name
        pages_file = root / 'pages' / name
        if not root_file.exists():
            kept += 1  # déjà nettoyé
            continue
        if not pages_file.exists():
            log('⚠️ ', f'{name} en racine mais PAS dans pages/ — SKIP (sécurité)')
            kept += 1
            continue
        if dry_run:
            log('🔍', f'would-remove {name}')
        else:
            root_file.unlink()
            log('🗑️ ', f'supprimé : {name}')
        removed += 1
    if removed == 0:
        log('✅', f'Aucun doublon à supprimer ({kept} déjà nettoyés)')


def step_2_archive_legacy_questions(root: Path, archive: bool = False):
    """Archive data/questions.json (4.2 MB) → data/_archive/."""
    print('\n[2/12] Archivage data/questions.json legacy (optionnel)')
    legacy = root / 'data' / 'questions.json'
    if not legacy.exists():
        log('⏭ ', 'data/questions.json déjà absent')
        return
    if not archive:
        log('⏭ ', f'data/questions.json présent ({legacy.stat().st_size // 1024} KB) — non archivé (utiliser --archive-legacy)')
        return
    archive_dir = root / 'data' / '_archive'
    archive_dir.mkdir(exist_ok=True)
    target = archive_dir / 'questions.json'
    shutil.move(str(legacy), str(target))
    log('📦', f'data/questions.json → data/_archive/questions.json')


def step_3_add_scenes_1_and_2(root: Path):
    """Ajoute les 2 scènes manquantes de la saga depuis le bundle."""
    print('\n[3/12] Ajout des scènes 1 + 2 de la saga (acte 1 + acte 2)')
    bundle = bundle_resources_dir(root)
    added = 0
    for scene_id in ('ge-affaire-antennes-fantomes-1-signal-alarme',
                     'ge-affaire-antennes-fantomes-2-vague-correlee'):
        src = bundle / f'{scene_id}.json'
        dst = root / 'scenes' / f'{scene_id}.json'
        if dst.exists():
            log('⏭ ', f'{scene_id}.json déjà présent')
            continue
        if not src.exists():
            log('❌', f'Source bundle manquante : {src}')
            continue
        shutil.copy(str(src), str(dst))
        log('✅', f'{scene_id}.json')
        added += 1
    if added == 0:
        log('⏭ ', 'Toutes les scènes sont déjà présentes')


def step_4_add_npcs(root: Path):
    """Ajoute les 8 NPCs de la saga à data/npcs.json."""
    print('\n[4/12] Ajout des 8 NPCs de la saga')
    bundle = bundle_resources_dir(root)
    src = bundle / 'new_npcs.json'
    if not src.exists():
        log('❌', f'Source bundle manquante : {src}')
        return
    new_npcs = json.load(open(src))
    npcs_path = root / 'data' / 'npcs.json'
    with open(npcs_path) as f:
        npcs_data = json.load(f)
    added = 0
    for npc_id, npc_def in new_npcs.items():
        if npc_id in npcs_data['npcs']:
            log('⏭ ', f'{npc_id} déjà présent')
        else:
            npcs_data['npcs'][npc_id] = npc_def
            added += 1
    if added > 0:
        npcs_data['$generated_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
        with open(npcs_path, 'w', encoding='utf-8') as f:
            json.dump(npcs_data, f, ensure_ascii=False, indent=2)
        log('✅', f'{added} NPCs ajoutés (total: {len(npcs_data["npcs"])})')


def step_5_add_campaign(root: Path):
    """Ajoute la campagne saga dans data/campaigns.json."""
    print('\n[5/12] Ajout de la campagne dans data/campaigns.json')
    bundle = bundle_resources_dir(root)
    src = bundle / 'new_campaign.json'
    if not src.exists():
        log('❌', f'Source bundle manquante : {src}')
        return
    new_campaign = json.load(open(src))
    campaigns_path = root / 'data' / 'campaigns.json'
    with open(campaigns_path) as f:
        campaigns_data = json.load(f)
    existing_ids = {c.get('id') for c in campaigns_data['campaigns']}
    if new_campaign['id'] in existing_ids:
        log('⏭ ', f'{new_campaign["id"]} déjà présente')
        return
    campaigns_data['campaigns'].append(new_campaign)
    campaigns_data['$generated_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
    with open(campaigns_path, 'w', encoding='utf-8') as f:
        json.dump(campaigns_data, f, ensure_ascii=False, indent=2)
    n_sagas = len([c for c in campaigns_data['campaigns'] if c.get('narrative')])
    log('✅', f'campagne ajoutée (sagas total: {n_sagas})')


def step_6_add_chronology(root: Path):
    """Ajoute les 7 entrées dans data/scenes-chronology.json."""
    print('\n[6/12] Ajout des entrées chronologie')
    chrono_path = root / 'data' / 'scenes-chronology.json'
    if not chrono_path.exists():
        log('⏭ ', 'data/scenes-chronology.json absent (skip)')
        return
    with open(chrono_path) as f:
        chrono = json.load(f)
    # Format peut être dict ou list
    if isinstance(chrono, dict) and 'scenes' in chrono:
        chrono_list = chrono['scenes']
    elif isinstance(chrono, list):
        chrono_list = chrono
    else:
        log('⚠️ ', 'Format chrono inconnu (skip)')
        return
    existing_ids = {e.get('id') if isinstance(e, dict) else e for e in chrono_list}
    added = 0
    for i, scene_id in enumerate(SAGA_SCENES):
        if scene_id in existing_ids:
            continue
        new_entry = {"id": scene_id, "date": SAGA_CHRONO_DATES[i], "saga": "saga-antennes-fantomes-geneve"}
        chrono_list.append(new_entry)
        added += 1
    if added > 0:
        if isinstance(chrono, dict):
            chrono['scenes'] = chrono_list
            chrono['$generated_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
            with open(chrono_path, 'w', encoding='utf-8') as f:
                json.dump(chrono, f, ensure_ascii=False, indent=2)
        else:
            with open(chrono_path, 'w', encoding='utf-8') as f:
                json.dump(chrono_list, f, ensure_ascii=False, indent=2)
        log('✅', f'{added} entrées chronologie ajoutées')
    else:
        log('⏭ ', '7 entrées déjà présentes')


def step_7_update_manifest(root: Path):
    """Ajoute sms_blaster.html dans data/manifest.json."""
    print('\n[7/12] Mise à jour de data/manifest.json')
    manifest_path = root / 'data' / 'manifest.json'
    with open(manifest_path) as f:
        manifest = json.load(f)
    existing = {f.get('file') for f in manifest.get('fiches', [])}
    if 'sms_blaster.html' in existing:
        log('⏭ ', 'sms_blaster.html déjà dans manifest')
        return
    manifest['fiches'].append(NEW_FICHE_MANIFEST)
    manifest['updatedAt'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    log('✅', f'sms_blaster.html ajouté (total: {len(manifest["fiches"])})')


def step_8_fix_csp_bugs(root: Path):
    """Patch CSP sur artifacts.html et fiches/index.html (oublis v132l)."""
    print('\n[8/12] Correction des 2 bugs CSP résiduels (v132l incomplet)')
    targets = [root / 'artifacts.html', root / 'fiches' / 'index.html']
    for target in targets:
        if not target.exists():
            log('⏭ ', f'{target.relative_to(root)} absent')
            continue
        with open(target, encoding='utf-8') as f:
            content = f.read()
        if 'Content-Security-Policy' in content:
            log('⏭ ', f'{target.relative_to(root)} déjà avec CSP')
            continue
        # Insérer la CSP juste après <meta charset="...">
        m = re.search(r'(<meta\s+charset="[^"]+">)', content)
        if not m:
            log('❌', f'{target.relative_to(root)} : <meta charset> introuvable')
            continue
        insert_pos = m.end()
        new_content = content[:insert_pos] + '\n' + CSP_TAG + content[insert_pos:]
        with open(target, 'w', encoding='utf-8') as f:
            f.write(new_content)
        log('✅', f'CSP injectée dans {target.relative_to(root)}')


def step_9_bump_sw(root: Path):
    """Bump SW v144 → v145."""
    print('\n[9/12] Bump SW v144 → v145')
    sw_path = root / 'sw.js'
    with open(sw_path, encoding='utf-8') as f:
        sw = f.read()
    m = re.search(r"const CACHE_VERSION = 'cas-in-v(\d+)';", sw)
    if not m:
        log('❌', 'CACHE_VERSION introuvable')
        return
    current = int(m.group(1))
    # Idempotence : si commentaire v132u/v145 déjà présent, skip
    if '// v132u — 2026-05-30 — Bump SW' in sw or current >= 145:
        log('⏭ ', f'SW déjà bumpé (cas-in-v{current})')
        return
    new = current + 1
    new_sw = sw.replace(
        f"const CACHE_VERSION = 'cas-in-v{current}';",
        (f"// v132u — 2026-05-30 — Bundle de finalisation\n"
         f"// Bump SW v{current} → v{new} après ajout de fiches/sms_blaster.html\n"
         f"// dans data/manifest.json (précache via precacheFichesFromManifest).\n"
         f"// ═══════════════════════════════════════════════════════════════\n"
         f"\n"
         f"const CACHE_VERSION = 'cas-in-v{new}';"),
        1
    )
    with open(sw_path, 'w', encoding='utf-8') as f:
        f.write(new_sw)
    log('✅', f'SW bumpé : cas-in-v{current} → cas-in-v{new}')


def step_10_update_changelog(root: Path):
    """Insère la section [3.0.1] dans docs/CHANGELOG.md."""
    print('\n[10/12] Insertion section [3.0.1] dans docs/CHANGELOG.md')
    changelog_path = root / 'docs' / 'CHANGELOG.md'
    if not changelog_path.exists():
        log('⏭ ', 'docs/CHANGELOG.md absent')
        return
    with open(changelog_path, encoding='utf-8') as f:
        cl = f.read()
    # Idempotence
    if '## [3.0.1]' in cl:
        log('⏭ ', 'Section [3.0.1] déjà présente')
        # Mais peut-être faut-il mettre à jour la ligne en-tête
    else:
        marker = '## [3.0-jolification]'
        pos = cl.find(marker)
        if pos == -1:
            log('❌', f'Marqueur "{marker}" introuvable')
            return
        cl = cl[:pos] + CHANGELOG_NEW_SECTION + cl[pos:]
        log('✅', 'Section [3.0.1] insérée')
    # Ligne d'en-tête
    cache_line_re = re.compile(r"Cache SW courant : \*\*`cas-in-v\d+`\*\* \(depuis [^\)]+\)\.")
    new_cache_line = "Cache SW courant : **`cas-in-v145`** (depuis le 30 mai 2026, v3.0.1)."
    if cache_line_re.search(cl):
        cl = cache_line_re.sub(new_cache_line, cl, count=1)
        log('✅', 'Ligne « Cache SW courant » mise à jour → v145')
    with open(changelog_path, 'w', encoding='utf-8') as f:
        f.write(cl)


def step_11_rebuild_scenes_index(root: Path):
    """Reconstruit scenes/index.json (source de vérité pour counts.scenes)."""
    print('\n[11/12] Reconstruction de scenes/index.json')
    script = root / 'scripts' / 'build_scenes_index.py'
    if not script.exists():
        log('⏭ ', 'scripts/build_scenes_index.py absent (skip)')
        return
    try:
        result = subprocess.run(['python3', str(script)], cwd=str(root), capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            idx = json.load(open(root / 'scenes' / 'index.json'))
            n = len(idx) if isinstance(idx, list) else len(idx.get('scenes', []))
            log('✅', f'scenes/index.json reconstruit ({n} entrées)')
        else:
            log('⚠️ ', f'build_scenes_index.py code={result.returncode} : {result.stderr[:200]}')
    except Exception as e:
        log('⚠️ ', f'Erreur lors de la reconstruction : {e}')


def step_12_regenerate_counts(root: Path):
    """Régénère data/counts.json via le script existant."""
    print('\n[12/12] Régénération de data/counts.json')
    script = root / 'scripts' / 'generate_counts.py'
    if not script.exists():
        log('⏭ ', 'scripts/generate_counts.py absent (skip)')
        return
    try:
        result = subprocess.run(['python3', str(script)], cwd=str(root), capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            # Lire le nouveau counts
            counts = json.load(open(root / 'data' / 'counts.json'))
            log('✅', f'counts.json régénéré : scenes={counts.get("scenes")}, fiches={counts.get("fiches")}')
        else:
            log('⚠️ ', f'generate_counts.py code={result.returncode} : {result.stderr[:200]}')
    except Exception as e:
        log('⚠️ ', f'Erreur lors de la régénération : {e}')


# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Bundle de finalisation v132u — CAS-IN')
    parser.add_argument('--dry-run', action='store_true', help='Étape 1 en simulation (n\'efface pas)')
    parser.add_argument('--archive-legacy', action='store_true', help='Archive data/questions.json dans data/_archive/')
    args = parser.parse_args()

    root = find_root()
    print(f'═══════════════════════════════════════════════════════════════')
    print(f'  CAS-IN v132u — Bundle de finalisation v131b → v132t')
    print(f'  Racine : {root}')
    if args.dry_run:
        print(f'  Mode : DRY-RUN (étape 1 simulée)')
    print(f'═══════════════════════════════════════════════════════════════')

    step_1_remove_obsolete_html(root, dry_run=args.dry_run)
    step_2_archive_legacy_questions(root, archive=args.archive_legacy)
    step_3_add_scenes_1_and_2(root)
    step_4_add_npcs(root)
    step_5_add_campaign(root)
    step_6_add_chronology(root)
    step_7_update_manifest(root)
    step_8_fix_csp_bugs(root)
    step_9_bump_sw(root)
    step_10_update_changelog(root)
    step_11_rebuild_scenes_index(root)
    step_12_regenerate_counts(root)

    print(f'\n═══════════════════════════════════════════════════════════════')
    print(f'  ✅ v132u appliqué.')
    print(f'═══════════════════════════════════════════════════════════════')


if __name__ == '__main__':
    main()
