#!/usr/bin/env python3
"""
build_index.py — Regénère fiches/index.html à partir de manifest.json.

Appelé par la GitHub Action .github/workflows/sync-fiches-index.yml.

v3 (manifest-first) :
  - manifest.json EST la source de vérité pour icon/desc/title de chaque fiche.
  - Le HTML de chaque fiche est seulement parsé pour deux choses :
    1. Détection de catégorie (3 étapes : breadcrumb href → texte → filename)
    2. Récupération du tag court affiché sur la card (.fiche-tag)
  - ICON_OVERRIDES supprimé (manifest dicte l'icône).
  - DESC_OVERRIDES gardé comme filet de sécurité ultime (rare).
  - TAG_OVERRIDES gardé : c'est de la cosmétique d'index, légitime.
  - Si une fiche existe sur disque mais n'est pas dans manifest, fallback
    sur le scraping HTML d'origine (badge .badge / .fs-badge) et warning.

CSS / JS embarqués (dans render()) :
  - clé localStorage `casIn_readFiches_v4` (alignée sur cas-in-profile.js)
    avec migration silencieuse depuis l'ancienne clé `cas_read_fiches`.
  - font-family emoji forcée sur .fiche-icon (rendu cross-platform).
"""
import os, re, json
from pathlib import Path
from bs4 import BeautifulSoup

# ── Répertoires ──────────────────────────────────────────────────────
ROOT          = Path(__file__).resolve().parents[1]
FICHES_DIR    = ROOT / "fiches"
INDEX_PATH    = FICHES_DIR / "index.html"
MANIFEST_PATH = ROOT / "data" / "manifest.json"

# ── Ordre pédagogique des modules ───────────────────────────────────
# Du plus fondamental (prérequis) au plus appliqué (outils).
# Chaque tuple : (cat_id, label affiché, couleur CSS)
CATEGORY_ORDER = [
    ("fondamentaux",         "🎓 Fondamentaux",                 "var(--muted)"),
    ("droitsuisse",          "⚖️ Cadre Légal · Droit Suisse",   "var(--purple)"),
    ("acquisitionméthodes",  "📥 Méthodologie & Acquisition",   "var(--cyan)"),
    ("systèmesdefichiers",   "💾 Systèmes de Fichiers",         "var(--gold)"),
    ("artefactswindows",     "🪟 Artefacts Windows",            "var(--blue)"),
    ("systèmesspéciaux",     "📱 Autres Systèmes",              "var(--orange)"),
    ("réseauxinfrastructure","📡 Réseaux & Communications",     "var(--green)"),
    ("cryptologiesécurité",  "🔐 Cryptologie & Sécurité",       "var(--red)"),
    ("outilsDFIR",           "🛠 Outils DFIR",                   "var(--muted)"),
]
CAT_IDS = {c[0] for c in CATEGORY_ORDER}

# ── Ordre intra-catégorie (progression pédagogique) ──────────────────
# Les fiches listées apparaissent dans cet ordre.
# Les fiches non listées sont placées à la fin, en ordre alphabétique.
INTRA_CATEGORY_ORDER = {
    "fondamentaux": [
        "encodage.html",
        "disques.html",
    ],
    "droitsuisse": [
        "droit.html",
        "suisse.html",
        "preuve.html",
        "eimp_entraide.html",
        "tor_darkweb.html",
    ],
    "acquisitionméthodes": [
        "methodologie.html",
        "premier_intervenant.html",
        "acquisition.html",
        "ram_forensique.html",
        "hash.html",
        "formats.html",
        "mac_times.html",
        "timeline.html",
        "rapport_forensique.html",
        "incident_response.html",
    ],
    "systèmesdefichiers": [
        "comparaison_fs.html",
        "formats.html",
        "fat16.html",
        "fat12.html",
        "exfat.html",
        "ntfs.html",
        "ext.html",
        "hfs.html",
        "apfs.html",
    ],
    "artefactswindows": [
        "windows_forensique.html",
        "windows.html",
        "registre_windows.html",
        "logs_windows.html",
        "shellbags.html",
        "volatilite.html",
        "active_directory.html",
        "usb_forensique.html",
    ],
    "systèmesspéciaux": [
        "macos-linux.html",
        "mobile.html",
        "cloud_forensique.html",
    ],
    "réseauxinfrastructure": [
        "reseau.html",
        "wireshark_pcap.html",
        "email_forensique.html",
        "messagerie_im.html",
        "sqlite_forensique.html",
    ],
    "cryptologiesécurité": [
        "crypto.html",
        "pki_certificats.html",
        "cassage_mdp.html",
        "chiffrement_volumes.html",
        "anti_forensique.html",
        "malware_forensique.html",
        "ransomware_forensique.html",
        "cryptomonnaies.html",
    ],
    "outilsDFIR": [
        "outils.html",
        "autopsy.html",
        "zimmerman.html",
        "browser_forensique.html",
        "osint.html",
    ],
}

# ── Overrides d'icônes ───────────────────────────────────────────────
# SUPPRIMÉ en v3 : manifest.json dicte les icônes. Si un override est
# nécessaire, le mettre directement dans manifest.json.

# ── Overrides de descriptions ────────────────────────────────────────
# Utilisé quand une fiche n'a pas de <meta name="description">. Évite
# les cartes aux descriptions vides (rupture de mise en page dans l'index).
# Le fix pérenne est d'ajouter la meta dans la fiche ; cet override est
# un filet de sécurité.
DESC_OVERRIDES = {
    "ntfs.html":                  "$MFT · $LogFile · $UsnJrnl · Alternate Data Streams · Attributs · Standard Windows",
    "windows.html":               "Prefetch · Amcache · ShimCache · RecentDocs · JumpLists · LNK · Activité utilisateur",
    "ram_forensique.html":        "Acquisition de mémoire vive · WinPmem · Magnet RAM Capture · DumpIt · Volatilité",
    "ransomware_forensique.html": "Identification de la souche · Négociation · No More Ransom · Réponse post-chiffrement",
    "sqlite_forensique.html":     "Bases SQLite · Apps mobiles · Navigateurs · WAL · Journal · Données supprimées",
    "reseau.html":                "TCP/IP · Modèle OSI · Protocoles · Infrastructure · Fondamentaux réseau forensique",
    "active_directory.html":      "NTDS.dit · Kerberos · Golden Ticket · Pass-the-Hash · DCSync · Investigation AD",
    "osint.html":                 "Renseignement sources ouvertes · Métadonnées EXIF · Investigation en ligne",
    "outils.html":                "Standard judiciaire suisse · Éditeur hexadécimal · Analyse forensique professionnelle",
    "droit.html":                 "CPP · CP · Infractions informatiques · Procédure pénale · Cadre général",
    "eimp_entraide.html":         "Entraide pénale internationale · MLAT · Coopération transfrontalière · Requêtes cloud",
    "crypto.html":                "Chiffrement symétrique / asymétrique · AES · RSA · Fondamentaux cryptographiques",
    "acquisition.html":           "Write-blocker · Copie bit-à-bit · dd · FTK Imager · Formats E01 / AFF4 · Ordre de volatilité",
    "cloud_forensique.html":      "Préservation de preuves · MLAT · Logs M365 · Google Workspace · AWS · Azure",
    "fat16.html":                 "Famille FAT · File Allocation Table · Boot Sector · Clusters · Évolution historique",
}

# ── Overrides de tags ────────────────────────────────────────────────
# Pour combler les fiches sans .fiche-tag / .tag. Garantit une mise en
# page homogène (chaque carte affiche un tag court).
TAG_OVERRIDES = {
    "encodage.html":              "Prérequis",
    "disques.html":               "Prérequis",
    "droit.html":                 "CPP · CP",
    "suisse.html":                "LPD · DFIR",
    "preuve.html":                "Recevabilité",
    "eimp_entraide.html":         "MLAT",
    "tor_darkweb.html":           "LSCPT",
    "methodologie.html":          "ISO 27037",
    "premier_intervenant.html":   "Terrain",
    "acquisition.html":           "Imaging",
    "ram_forensique.html":        "Volatile",
    "hash.html":                  "Intégrité",
    "formats.html":               "Carving",
    "mac_times.html":             "Timestamps",
    "timeline.html":              "log2timeline",
    "rapport_forensique.html":    "Livrable",
    "incident_response.html":     "IR Playbook",
    "comparaison_fs.html":        "Synthèse",
    "fat16.html":                 "Famille FAT",
    "fat12.html":                 "FAT12",
    "exfat.html":                 "exFAT",
    "ntfs.html":                  "NTFS",
    "ext.html":                   "Linux",
    "hfs.html":                   "Apple",
    "apfs.html":                  "APFS · Snapshots",
    "windows_forensique.html":    "Méthodologie",
    "windows.html":               "Artefacts",
    "registre_windows.html":      "Ruches",
    "logs_windows.html":          "Event Logs",
    "shellbags.html":             "Navigation",
    "volatilite.html":            "Volatility 3",
    "active_directory.html":      "AD · Kerberos",
    "usb_forensique.html":        "USBSTOR",
    "macos-linux.html":           "POSIX",
    "mobile.html":                "iOS · Android",
    "cloud_forensique.html":      "M365 · AWS",
    "reseau.html":                "TCP/IP",
    "wireshark_pcap.html":        "Wireshark",
    "email_forensique.html":      "SMTP",
    "messagerie_im.html":         "IM · E2EE",
    "sqlite_forensique.html":     "SQLite",
    "crypto.html":                "Fondamentaux",
    "pki_certificats.html":       "X.509",
    "cassage_mdp.html":           "Hashcat",
    "chiffrement_volumes.html":   "BitLocker · LUKS",
    "anti_forensique.html":       "Évasion",
    "malware_forensique.html":    "YARA · IOC",
    "ransomware_forensique.html": "Ransomware",
    "cryptomonnaies.html":        "Bitcoin · Blockchain",
    "outils.html":                "Judiciaire CH",
    "autopsy.html":               "Open Source",
    "zimmerman.html":             "CLI · Gratuit",
    "browser_forensique.html":    "Navigateurs",
    "osint.html":                 "OSINT",
}

# ── Mapping texte breadcrumb → cat_id (pour fallback 1) ─────────────
BREADCRUMB_TEXT_MAP = {
    "fondamentaux":                   "fondamentaux",
    "prérequis":                      "fondamentaux",
    "systèmes de fichiers":           "systèmesdefichiers",
    "systemes de fichiers":           "systèmesdefichiers",
    "acquisition & méthodes":         "acquisitionméthodes",
    "acquisition, méthodes & outils": "acquisitionméthodes",
    "acquisition et méthodes":        "acquisitionméthodes",
    "acquisition méthodes":           "acquisitionméthodes",
    "méthodologie & acquisition":     "acquisitionméthodes",
    "méthodologie et acquisition":    "acquisitionméthodes",
    "acquisition":                    "acquisitionméthodes",
    "méthodologie":                   "acquisitionméthodes",
    "artefacts windows":              "artefactswindows",
    "cryptologie & sécurité":         "cryptologiesécurité",
    "cryptologie et sécurité":        "cryptologiesécurité",
    "cryptologie":                    "cryptologiesécurité",
    "réseaux & infrastructure":       "réseauxinfrastructure",
    "réseaux & communications":       "réseauxinfrastructure",
    "réseaux et communications":      "réseauxinfrastructure",
    "réseaux & investigation":        "réseauxinfrastructure",
    "réseaux et investigation":       "réseauxinfrastructure",
    "réseaux":                        "réseauxinfrastructure",
    "systèmes spéciaux":              "systèmesspéciaux",
    "autres systèmes":                "systèmesspéciaux",
    "plateformes & cloud":            "systèmesspéciaux",
    "plateformes et cloud":           "systèmesspéciaux",
    "droit suisse":                   "droitsuisse",
    "cadre légal":                    "droitsuisse",
    "droit":                          "droitsuisse",
    "outils dfir":                    "outilsDFIR",
    "outils":                         "outilsDFIR",
}

# ── Mapping filename → cat_id (pour fallback 2) ─────────────────────
FILENAME_KEYWORDS = [
    (("encodage", "disques"), "fondamentaux"),
    (("fat12", "fat16", "fat32", "exfat", "ntfs", "ext", "hfs", "apfs",
      "comparaison_fs", "formats"), "systèmesdefichiers"),
    (("acquisition", "methodologie", "méthodologie", "timeline", "rapport_forensique",
      "premier_intervenant", "ram_forensique", "mac_times", "incident", "hash"), "acquisitionméthodes"),
    (("windows", "registre", "shellbags", "logs_windows", "volatilite", "active_directory",
      "prefetch", "amcache", "shimcache", "usb_forensique"), "artefactswindows"),
    (("hash", "crypto", "cassage_mdp", "anti_forensique", "malware", "ransomware",
      "yara", "pki", "chiffrement_volumes", "cryptomonnaies"), "cryptologiesécurité"),
    (("reseau", "réseau", "wireshark", "pcap", "email", "sqlite", "messagerie_im"), "réseauxinfrastructure"),
    (("mobile", "macos", "linux", "cloud", "ios", "android"), "systèmesspéciaux"),
    (("suisse", "droit", "preuve", "eimp", "entraide", "cpp", "lpd", "tor", "darkweb"), "droitsuisse"),
    (("autopsy", "outils", "zimmerman", "xways", "winhex", "ftk", "cellebrite",
      "velociraptor", "kape", "osint", "browser"), "outilsDFIR"),
]


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


# ── Mapping catégorie manifest → catégorie build_index ──────────────
# Le manifest a 7 catégories (systemes, acquisition, windows, crypto,
# reseau, plateformes, droit), build_index en a 9 (avec fondamentaux et
# outilsDFIR en plus, pour la progression pédagogique). Ce mapping est
# utilisé en priorité 2 quand la détection HTML par href échoue.
# Les cats "spéciales" (fondamentaux, outilsDFIR) ne sont pas mappées
# ici : les fiches qui doivent y aller doivent avoir un breadcrumb HTML
# qui pointe explicitement (priorité 1).
MANIFEST_CAT_TO_BUILD = {
    "systemes":    "systèmesdefichiers",
    "acquisition": "acquisitionméthodes",
    "windows":     "artefactswindows",
    "crypto":      "cryptologiesécurité",
    "reseau":      "réseauxinfrastructure",
    "plateformes": "systèmesspéciaux",
    "droit":       "droitsuisse",
}


def detect_category(soup: BeautifulSoup, filename: str) -> tuple[str, str]:
    """Détecte la catégorie en 3 étapes. Retourne (cat_id, méthode)."""
    # Méthode 1 : href du breadcrumb
    for a in soup.find_all("a", href=True):
        m = re.search(r"index\.html#cat-(.+)", a["href"])
        if m and m.group(1) in CAT_IDS:
            return m.group(1), "href"

    # Méthode 2 : texte du breadcrumb
    candidates = []
    for sel in [".breadcrumb", ".bc-current", "nav"]:
        for el in soup.select(sel):
            candidates.append(_normalize(el.get_text(" ", strip=True)))
    for el in soup.find_all(class_=re.compile(r"(tag|cat|chip)", re.I)):
        candidates.append(_normalize(el.get_text(" ", strip=True)))

    for text in candidates:
        for phrase, cid in BREADCRUMB_TEXT_MAP.items():
            if re.search(rf"\b{re.escape(phrase)}\b", text):
                return cid, "text"

    # Méthode 3 : mots-clés dans le filename
    fname_low = filename.lower().replace(".html", "")
    for keywords, cid in FILENAME_KEYWORDS:
        for kw in keywords:
            if kw in fname_low:
                return cid, "filename"

    return "outilsDFIR", "fallback"


def load_manifest_index() -> dict:
    """Charge manifest.json et retourne {filename: entry_dict}.

    Source unique de vérité pour icon/desc/title. Si le manifest est absent
    ou cassé, on log un warning et le script tombe en mode dégradé
    (scraping HTML d'origine) — l'idée étant qu'il vaut mieux un index
    moins joli qu'un index cassé.
    """
    if not MANIFEST_PATH.exists():
        print(f"  ⚠ manifest.json absent ({MANIFEST_PATH}) — mode dégradé")
        return {}
    try:
        data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        return {f["file"]: f for f in data.get("fiches", []) if f.get("file")}
    except Exception as e:
        print(f"  ⚠ manifest.json illisible : {e} — mode dégradé")
        return {}


def parse_fiche(path: Path, manifest_index: dict) -> dict | None:
    """Récupère les infos d'affichage d'une fiche.

    Source de vérité (priorité) :
      icon  : manifest > badge HTML
      desc  : manifest > meta description fiche > DESC_OVERRIDES (filet)
      name  : manifest.title > <title> HTML
      tag   : .fiche-tag HTML > TAG_OVERRIDES
      cat   : detect_category() (toujours scrape HTML, plus robuste)
    """
    try:
        soup = BeautifulSoup(path.read_text(encoding="utf-8"), "lxml")
    except Exception as e:
        print(f"  ⚠ parse error on {path.name}: {e}")
        return None

    title_tag = soup.find("title")
    if not title_tag:
        return None
    full_title = title_tag.get_text()
    name_html = full_title.split("—")[0].strip()

    # Détection de catégorie en cascade :
    #   1. detect_category() méthode "href" (breadcrumb HTML propre)
    #   2. detect_category() méthode "text" (libellé breadcrumb reconnu)
    #   3. manifest.category (si la fiche est dans le manifest)
    #   4. detect_category() méthodes "filename" / "fallback"
    cat_id, method = detect_category(soup, path.name)
    if method not in ("href", "text"):
        # Les méthodes HTML primaires ont échoué : essayons le manifest
        # avant de tomber sur les fallbacks moins fiables (filename keyword
        # ou outilsDFIR par défaut).
        manifest_entry_for_cat = manifest_index.get(path.name)
        if manifest_entry_for_cat:
            mfst_cat = manifest_entry_for_cat.get("category")
            mapped = MANIFEST_CAT_TO_BUILD.get(mfst_cat)
            if mapped:
                cat_id, method = mapped, "manifest"

    # Tag : toujours du HTML (manifest n'a pas de champ "tag")
    tag_text = ""
    tag_el = soup.find(class_="fiche-tag") or soup.find(class_="tag")
    if tag_el:
        tag_text = tag_el.get_text().strip()

    # ── Icon / desc / name : priorité au manifest ──
    manifest_entry = manifest_index.get(path.name)
    source = "manifest"

    if manifest_entry:
        icon = manifest_entry.get("icon") or "📄"
        desc = (manifest_entry.get("desc") or "").strip()
        name = (manifest_entry.get("title") or name_html).strip()
    else:
        # Orphelin : fiche présente sur disque mais pas dans manifest.
        # Fallback sur l'ancien comportement (scrape badge HTML).
        source = "html-fallback"
        print(f"  ⚠ orphan: {path.name} absent du manifest — scrape HTML")
        badge_tag = soup.find(class_="badge") or soup.find(class_="fs-badge")
        icon = "📄"
        if badge_tag:
            raw = badge_tag.get_text().strip()
            if raw:
                first = raw.split()[0] if raw.split() else raw
                icon = first
        desc_tag = soup.find("meta", attrs={"name": "description"})
        desc = desc_tag["content"].strip() if desc_tag else ""
        name = name_html

    # Filets de sécurité ultimes (rare avec manifest à jour)
    if not desc and path.name in DESC_OVERRIDES:
        desc = DESC_OVERRIDES[path.name]
    if not tag_text and path.name in TAG_OVERRIDES:
        tag_text = TAG_OVERRIDES[path.name]

    return {
        "file": path.name,
        "name": name,
        "desc": desc,
        "icon": icon,
        "cat_id": cat_id,
        "cat_method": method,
        "tag": tag_text,
        "source": source,
    }


def sort_fiches(cat_id: str, fiches: list[dict]) -> list[dict]:
    """Trie les fiches d'une catégorie selon INTRA_CATEGORY_ORDER.
    Les fiches non listées tombent à la fin, triées alphabétiquement."""
    order = INTRA_CATEGORY_ORDER.get(cat_id, [])
    index_of = {name: i for i, name in enumerate(order)}

    def key(f):
        if f["file"] in index_of:
            return (0, index_of[f["file"]])
        return (1, f["file"])

    return sorted(fiches, key=key)


def card_html(f: dict, step: int) -> str:
    """Rend une carte fiche. `step` = numéro d'étape intra-catégorie (01, 02…)."""
    kw = f["desc"].lower().replace("·", "").replace("/", " ")
    tag_html = f'<span class="fiche-tag">{f["tag"]}</span>' if f["tag"] else ""
    return f"""      <a href="{f['file']}" class="fiche-card" data-keywords="{kw}">
        <div class="fiche-icon">{f['icon']}</div>
        <div class="fiche-name">{f['name']}</div>
        <div class="fiche-desc">{f['desc']}</div>
        {tag_html}
      </a>"""


def category_html(cat_id: str, label: str, color: str, step_num: int, fiches: list[dict]) -> str:
    n = len(fiches)
    cards = "\n".join(card_html(f, i+1) for i, f in enumerate(fiches))
    step_badge = f'<span class="cat-step">{step_num:02d}</span>'
    return f"""
  <!-- ── {label} ── -->
  <div class="fiche-category" id="cat-{cat_id}" style="margin-bottom:2rem">
    <div class="fiche-cat-title" style="font-family:var(--sans);font-size:.72rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:{color};margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
      {step_badge}{label} <span style="flex:1;height:1px;background:var(--border);opacity:.3"></span>
      <span class="cat-count" style="font-size:.6rem;color:var(--dim);font-weight:400">{n} fiche{'s' if n > 1 else ''}</span>
    </div>
    <div class="fiche-grid">
{cards}
    </div>
    <div class="cat-nav" data-cat="{cat_id}"></div>
  </div>"""


def render(categories_html: str, total: int, n_cats: int) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Fiches DFIR — CAS-IN Investigation Numérique</title>
<link rel="stylesheet" href="../style/fiche_style.css">
<style>
.page{{max-width:1100px;margin:0 auto;padding:2rem}}
.hub-hero{{text-align:center;padding:2.5rem 1rem 1.5rem;border-bottom:1px solid var(--border);margin-bottom:2rem}}
.hub-title{{font-family:var(--sans);font-size:clamp(1.6rem,4vw,2.4rem);font-weight:800;color:var(--text);margin-bottom:.5rem}}
.hub-sub{{font-size:.85rem;color:var(--muted);margin-bottom:1rem}}
.hub-stats{{display:flex;gap:1.5rem;justify-content:center;flex-wrap:wrap;font-size:.75rem;color:var(--dim)}}
.search-wrap{{position:relative;max-width:500px;margin:0 auto 1.5rem}}
.search-input{{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:.55rem 1rem .55rem 2.5rem;color:var(--text);font-family:var(--mono);font-size:.82rem;transition:.15s}}
.search-input:focus{{outline:none;border-color:var(--cyan);background:rgba(0,229,204,.02)}}
.search-icon{{position:absolute;left:.8rem;top:50%;transform:translateY(-50%);color:var(--dim)}}
.fiche-card{{cursor:pointer;position:relative}}
.fiche-card.hidden{{display:none}}

/* ── Mise en page uniforme des cartes ── */
.fiche-card .fiche-icon{{
  font-size: 1.9rem;
  margin-bottom: .5rem;
  line-height: 1;
  display: block;
  height: 1.9rem;
  /* Force une police emoji couleur cross-platform — sinon certaines
     séquences (drapeaux, ZWJ, variation selectors) tombent en glyphes
     monochromes ou en lettres séparées sur Chrome desktop. */
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
               "Noto Color Emoji", "Twemoji Mozilla", "EmojiOne Color",
               "Android Emoji", emoji, sans-serif;
}}
.fiche-card .fiche-name{{
  font-family: var(--sans);
  font-size: 1rem !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
  color: var(--text);
  word-break: normal;
  overflow-wrap: break-word;
  hyphens: auto;
  margin-bottom: .4rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.6em;
}}
.fiche-card .fiche-desc{{
  font-size: .78rem !important;
  line-height: 1.45 !important;
  color: var(--muted);
  margin-bottom: .5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 3.4em;
}}

@media(max-width:640px){{.hub-stats{{gap:.75rem}}}}

.read-dot{{position:absolute;top:.45rem;right:.45rem;width:8px;height:8px;border-radius:50%;background:var(--green,#30e88a);box-shadow:0 0 5px rgba(48,232,138,.6)}}
#read-counter{{font-size:.65rem;color:var(--cyan,#00e5cc);margin-left:.75rem;font-family:var(--mono,monospace)}}
.fiche-card.prereq-locked{{opacity:.5;filter:grayscale(.6)}}

.cat-nav{{display:flex;justify-content:space-between;align-items:center;margin-top:.6rem;padding:.3rem 0;font-size:.68rem;color:var(--dim)}}
.cat-nav-btn{{background:none;border:1px solid var(--border);border-radius:6px;padding:.25rem .65rem;color:var(--dim);cursor:pointer;font-size:.68rem;font-family:var(--mono);transition:.15s;text-decoration:none;display:inline-block}}
.cat-nav-btn:hover{{border-color:var(--cyan);color:var(--cyan)}}
.cat-nav-btn.disabled{{opacity:.3;pointer-events:none}}

/* Badge numéro de module (progression visuelle) */
.cat-step{{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-width:1.6rem;
  height:1.6rem;
  padding:0 .4rem;
  border-radius:4px;
  background:rgba(255,255,255,.04);
  border:1px solid var(--border);
  color:var(--dim);
  font-family:var(--mono);
  font-size:.62rem;
  font-weight:700;
  letter-spacing:.05em;
}}
</style>
</head>
<body>

<nav class="tn-nav">
  <a href="../index.html" class="tn-back">← Accueil</a>
  <span class="tn-title">FICHES DE RÉVISION</span>
  <a href="../quiz.html" class="tn-quiz">💊 Quiz →</a>
</nav>

<div class="page">

  <div class="hub-hero">
    <div class="hub-title">📂 Fiches DFIR</div>
    <div class="hub-sub"><span id="total-count">{total}</span> fiches · Progression pédagogique · Investigation numérique · CAS-IN 2025–26</div>
    <div class="hub-stats">
      <span><strong id="stat-total">{total}</strong> fiches</span>
      <span><strong>{n_cats}</strong> modules thématiques</span>
      <span id="read-counter">0 / 0 lues</span>
    </div>
  </div>

  <div class="search-wrap">
    <span class="search-icon">🔍</span>
    <input class="search-input" id="search" type="text" placeholder="Rechercher une fiche…" oninput="filterFiches()">
  </div>

{categories_html}

  <!-- ── CTA ── -->
  <div class="fiche-cta-section">
    <div class="fiche-cta-text">Fiches consultées ? Passez à l'entraînement !</div>
    <div class="fiche-cta-buttons">
      <a href="../quiz.html" class="fiche-cta-btn fiche-cta-red">💊 Quiz</a>
      <a href="../tp.html" class="fiche-cta-btn fiche-cta-orange">🧪 Travaux Pratiques</a>
      <a href="../scene.html" class="fiche-cta-btn fiche-cta-orange" style="background:rgba(188,140,255,.1);color:var(--purple);border-color:rgba(188,140,255,.3)">🎭 Scénarios DFIR</a>
    </div>
  </div>
</div>

<!-- Moteur de recherche fiches v2.0 (N1+N2+N3+N5 : tokens + accents + synonymes + index full-text + modal Cmd+K) -->
<script src="../js/components/fiche-search.js" defer></script>
<script src="../js/components/search-modal.js" defer></script>

<script>
// Fallback minimal au cas où fiche-search.js échoue à se charger.
// L'oninput du <input> est neutralisé par fiche-search.js dès qu'il s'initialise.
function filterFiches() {{
  const q = document.getElementById('search').value.toLowerCase().trim();
  document.querySelectorAll('.fiche-card').forEach(card => {{
    const text = card.textContent.toLowerCase();
    const kw = (card.dataset.keywords || '').toLowerCase();
    card.classList.toggle('hidden', q && !text.includes(q) && !kw.includes(q));
  }});
  document.querySelectorAll('.fiche-category').forEach(cat => {{
    const visible = cat.querySelectorAll('.fiche-card:not(.hidden)').length;
    cat.style.display = visible ? '' : 'none';
  }});
}}

(function updateCounts(){{
  const total = document.querySelectorAll('.fiche-card').length;
  document.getElementById('total-count').textContent = total;
  document.getElementById('stat-total').textContent = total;
  document.querySelectorAll('.fiche-category').forEach(cat => {{
    const n = cat.querySelectorAll('.fiche-card').length;
    const el = cat.querySelector('.cat-count');
    if (el) el.textContent = n + ' fiche' + (n > 1 ? 's' : '');
  }});
}})();

(function buildCatNav(){{
  const cats = Array.from(document.querySelectorAll('.fiche-category'));
  cats.forEach((cat, idx) => {{
    const navEl = cat.querySelector('.cat-nav');
    if (!navEl) return;
    const prevCat = cats[idx - 1];
    const nextCat = cats[idx + 1];
    function catLabel(c) {{
      const title = c.querySelector('.fiche-cat-title');
      if (!title) return '';
      const clone = title.cloneNode(true);
      clone.querySelectorAll('.cat-step,.cat-count,span[style*="flex:1"]').forEach(s => s.remove());
      return clone.textContent.trim();
    }}
    const prevBtn = prevCat
      ? `<a class="cat-nav-btn" href="#${{prevCat.id}}">← ${{catLabel(prevCat)}}</a>`
      : `<span class="cat-nav-btn disabled">← Début</span>`;
    const nextBtn = nextCat
      ? `<a class="cat-nav-btn" href="#${{nextCat.id}}">${{catLabel(nextCat)}} →</a>`
      : `<span class="cat-nav-btn disabled">Fin →</span>`;
    navEl.innerHTML = prevBtn + nextBtn;
  }});
}})();

(function(){{
  // v3 : clé alignée sur cas-in-profile.js. Migration auto silencieuse
  // depuis l'ancienne clé cas_read_fiches (puis nettoyage).
  var READ_KEY   = 'casIn_readFiches_v4';
  var LEGACY_KEY = 'cas_read_fiches';

  function loadAndMigrate() {{
    var fresh  = [];
    var legacy = [];
    try {{ fresh  = JSON.parse(localStorage.getItem(READ_KEY)   || '[]') || []; }} catch (e) {{ fresh  = []; }}
    try {{ legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]') || []; }} catch (e) {{ legacy = []; }}
    if (!Array.isArray(fresh))  fresh  = [];
    if (!Array.isArray(legacy)) legacy = [];
    var merged = fresh.slice();
    legacy.forEach(function (f) {{
      if (typeof f === 'string' && merged.indexOf(f) === -1) merged.push(f);
    }});
    if (merged.length !== fresh.length) {{
      try {{ localStorage.setItem(READ_KEY, JSON.stringify(merged)); }} catch (e) {{}}
    }}
    if (legacy.length) {{
      try {{ localStorage.removeItem(LEGACY_KEY); }} catch (e) {{}}
    }}
    return merged;
  }}

  var read = loadAndMigrate();
  function markRead(href) {{
    var fname = href.split('/').pop();
    if (!read.includes(fname)) {{
      read.push(fname);
      try {{ localStorage.setItem(READ_KEY, JSON.stringify(read)); }} catch (e) {{}}
    }}
  }}
  function applyDots() {{
    document.querySelectorAll('.fiche-card').forEach(function(card) {{
      var href = card.getAttribute('href') || '';
      var fname = href.split('/').pop();
      if (read.includes(fname)) {{
        var dot = card.querySelector('.read-dot');
        if (!dot) {{
          dot = document.createElement('span');
          dot.className = 'read-dot';
          dot.title = 'Lu';
          card.appendChild(dot);
        }}
      }}
    }});
    var total = document.querySelectorAll('.fiche-card').length;
    var counter = document.getElementById('read-counter');
    if (counter) counter.textContent = read.length + ' / ' + total + ' lues';
  }}
  document.addEventListener('click', function(e) {{
    var card = e.target.closest('.fiche-card');
    if (card) markRead(card.getAttribute('href') || '');
  }});
  document.addEventListener('DOMContentLoaded', applyDots);
  setTimeout(applyDots, 100);
}})();
</script>

</body>
</html>"""


def main():
    fiches_by_cat: dict[str, list[dict]] = {c[0]: [] for c in CATEGORY_ORDER}
    method_stats = {"href": 0, "text": 0, "filename": 0, "fallback": 0, "manifest": 0}
    source_stats = {"manifest": 0, "html-fallback": 0}

    # ── Source unique : manifest.json (chargé une fois en mémoire) ──
    manifest_index = load_manifest_index()
    if manifest_index:
        print(f"  ℹ manifest.json : {len(manifest_index)} fiche(s) indexée(s)")

    for path in sorted(FICHES_DIR.glob("*.html")):
        if path.name == "index.html":
            continue
        data = parse_fiche(path, manifest_index)
        if not data:
            print(f"  ⚠ skipped (no title): {path.name}")
            continue
        cat = data["cat_id"]
        if cat not in fiches_by_cat:
            fiches_by_cat[cat] = []
        fiches_by_cat[cat].append(data)
        method_stats[data["cat_method"]] += 1
        source_stats[data["source"]] += 1
        marker = {"href": "✓", "text": "~", "filename": "?", "fallback": "!", "manifest": "M"}[data["cat_method"]]
        src_marker = "M" if data["source"] == "manifest" else "h"
        print(f"  {marker}{src_marker} {path.name:<35} → {cat:<25} ({data['cat_method']})")

    # Tri intra-catégorie selon la progression pédagogique
    for cat_id in fiches_by_cat:
        fiches_by_cat[cat_id] = sort_fiches(cat_id, fiches_by_cat[cat_id])

    cat_blocks = []
    total = 0
    step = 0
    for cat_id, label, color in CATEGORY_ORDER:
        fiches = fiches_by_cat.get(cat_id, [])
        if not fiches:
            continue
        step += 1
        cat_blocks.append(category_html(cat_id, label, color, step, fiches))
        total += len(fiches)

    n_cats = step
    html = render("\n".join(cat_blocks), total, n_cats)
    INDEX_PATH.write_text(html, encoding="utf-8")
    print(f"\n✅ index.html régénéré — {total} fiches · {n_cats} modules.")
    print(f"   Source : manifest={source_stats['manifest']} · "
          f"html-fallback={source_stats['html-fallback']}")
    print(f"   Détection : href={method_stats['href']} · manifest={method_stats['manifest']} · "
          f"text={method_stats['text']} · filename={method_stats['filename']} · "
          f"fallback={method_stats['fallback']}")
    if source_stats["html-fallback"] > 0:
        print(f"   ⚠ {source_stats['html-fallback']} fiche(s) en fallback HTML — "
              f"à ajouter dans manifest.json pour cohérence.")
    if method_stats["fallback"] > 0:
        print(f"   ⚠ {method_stats['fallback']} fiche(s) en fallback 'outilsDFIR' — "
              f"vérifier les breadcrumbs.")


if __name__ == "__main__":
    main()
