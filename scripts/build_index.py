#!/usr/bin/env python3
"""
build_index.py — Regénère fiches/index.html à partir des fichiers HTML du dossier fiches/.
Appelé par la GitHub Action .github/workflows/sync-fiches-index.yml.

Pour chaque fiche HTML (hors index.html) il extrait :
  - <title>
  - <meta name="description">
  - Le premier .badge (emoji icône)
  - Le premier .fiche-cat-title via le breadcrumb (catégorie)
  - data-keywords depuis le breadcrumb <a> pointant vers index.html#cat-…

Les fiches sont regroupées par catégorie dans l'ordre défini par CATEGORY_ORDER.
"""

import os, re, json
from pathlib import Path
from bs4 import BeautifulSoup

# ── Répertoire des fiches ────────────────────────────────────────────
FICHES_DIR = Path(__file__).resolve().parents[2] / "fiches"
INDEX_PATH  = FICHES_DIR / "index.html"

# ── Ordre et métadonnées des catégories ─────────────────────────────
CATEGORY_ORDER = [
    ("systèmesdefichiers",   "💾 Systèmes de Fichiers",    "var(--gold)"),
    ("acquisitionméthodes",  "📥 Acquisition & Méthodes",  "var(--cyan)"),
    ("artefactswindows",     "🪟 Artefacts Windows",        "var(--blue)"),
    ("cryptologiesécurité",  "🔐 Cryptologie & Sécurité",  "var(--red)"),
    ("réseauxinfrastructure","📡 Réseaux & Infrastructure", "var(--green)"),
    ("systèmesspéciaux",     "📱 Systèmes Spéciaux",       "var(--orange)"),
    ("droitsuisse",          "⚖️ Droit Suisse",             "var(--purple)"),
    ("outilsDFIR",           "🛠 Outils DFIR",              "var(--muted)"),
]
CAT_IDS = {c[0] for c in CATEGORY_ORDER}

# ── Extraction des métadonnées d'une fiche ──────────────────────────
def parse_fiche(path: Path) -> dict | None:
    """Retourne un dict avec les métadonnées d'une fiche, ou None si invalide."""
    try:
        soup = BeautifulSoup(path.read_text(encoding="utf-8"), "lxml")
    except Exception:
        return None

    title_tag = soup.find("title")
    if not title_tag:
        return None
    full_title = title_tag.get_text()
    # "MAC Times & Artefacts Temporels — CAS-IN Forensique" → "MAC Times & Artefacts Temporels"
    name = full_title.split("—")[0].strip()

    desc_tag = soup.find("meta", attrs={"name": "description"})
    desc = desc_tag["content"].strip() if desc_tag else ""

    # Icône : premier .badge, sinon premier emoji du titre
    badge_tag = soup.find(class_="badge")
    icon = badge_tag.get_text().strip() if badge_tag else "📄"

    # Catégorie : lire le breadcrumb → lien vers index.html#cat-…
    cat_id = "outilsDFIR"   # fallback
    for a in soup.find_all("a", href=True):
        href = a["href"]
        m = re.search(r"index\.html#cat-(.+)", href)
        if m:
            cid = m.group(1)
            if cid in CAT_IDS:
                cat_id = cid
                break

    # Tag (chip affiché sur la carte) : balise .fiche-tag dans la fiche elle-même
    # ou premier .tag dans le header
    tag_text = ""
    tag_el = soup.find(class_="fiche-tag")
    if not tag_el:
        tag_el = soup.find(class_="tag")
    if tag_el:
        tag_text = tag_el.get_text().strip()

    return {
        "file":    path.name,
        "name":    name,
        "desc":    desc,
        "icon":    icon,
        "cat_id":  cat_id,
        "tag":     tag_text,
    }

# ── Construction du HTML d'une carte ────────────────────────────────
def card_html(f: dict) -> str:
    kw = f["desc"].lower().replace("·", "").replace("/", " ")
    return f"""      <a href="{f['file']}" class="fiche-card" data-keywords="{kw}">
        <div class="fiche-icon">{f['icon']}</div>
        <div class="fiche-name">{f['name']}</div>
        <div class="fiche-desc">{f['desc']}</div>
        <span class="fiche-tag">{f['tag']}</span>
      </a>"""

# ── Construction du bloc catégorie ──────────────────────────────────
def category_html(cat_id: str, label: str, color: str, fiches: list[dict]) -> str:
    n = len(fiches)
    cards = "\n".join(card_html(f) for f in fiches)
    return f"""
  <!-- ── {label} ── -->
  <div class="fiche-category" id="cat-{cat_id}" style="margin-bottom:2rem">
    <div class="fiche-cat-title" style="font-family:var(--sans);font-size:.72rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:{color};margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
      {label} <span style="flex:1;height:1px;background:var(--border);opacity:.3"></span>
      <span class="cat-count" style="font-size:.6rem;color:var(--dim);font-weight:400">{n} fiche{'s' if n > 1 else ''}</span>
    </div>
    <div class="fiche-grid">
{cards}
    </div>
    <div class="cat-nav" data-cat="{cat_id}"></div>
  </div>"""

# ── Template principal ───────────────────────────────────────────────
def render(categories_html: str, total: int) -> str:
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
  .fiche-card{{cursor:pointer}}
  .fiche-card.hidden{{display:none}}
  @media(max-width:640px){{.hub-stats{{gap:.75rem}}}}
</style>
<style>
.fiche-card{{position:relative}}
.read-dot{{position:absolute;top:.45rem;right:.45rem;width:8px;height:8px;border-radius:50%;background:var(--green,#30e88a);box-shadow:0 0 5px rgba(48,232,138,.6)}}
#read-counter{{font-size:.65rem;color:var(--cyan,#00e5cc);margin-left:.75rem;font-family:var(--mono,monospace)}}
.fiche-card.prereq-locked{{opacity:.5;filter:grayscale(.6)}}
.cat-nav{{display:flex;justify-content:space-between;align-items:center;margin-top:.6rem;padding:.3rem 0;font-size:.68rem;color:var(--dim)}}
.cat-nav-btn{{background:none;border:1px solid var(--border);border-radius:6px;padding:.25rem .65rem;color:var(--dim);cursor:pointer;font-size:.68rem;font-family:var(--mono);transition:.15s;text-decoration:none;display:inline-block}}
.cat-nav-btn:hover{{border-color:var(--cyan);color:var(--cyan)}}
.cat-nav-btn.disabled{{opacity:.3;pointer-events:none}}
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
    <div class="hub-sub"><span id="total-count">{total}</span> fiches de référence · Investigation numérique · Droit suisse · CAS-IN 2025–26</div>
    <div class="hub-stats">
      <span><strong id="stat-total">{total}</strong> fiches</span>
      <span><strong>8</strong> catégories</span>
    </div>
    <span id="read-counter">0 / 0 lues</span>
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
      <a href="../quiz.html" class="fiche-cta-btn fiche-cta-red">💊 Quiz — 1439 questions</a>
      <a href="../tp.html" class="fiche-cta-btn fiche-cta-orange">🧪 Travaux Pratiques</a>
      <a href="../scene.html" class="fiche-cta-btn fiche-cta-orange" style="background:rgba(188,140,255,.1);color:var(--purple);border-color:rgba(188,140,255,.3)">🎭 Scénarios DFIR</a>
    </div>
  </div>
</div>

<script>
function filterFiches() {{
  const q = document.getElementById('search').value.toLowerCase().trim();
  document.querySelectorAll('.fiche-card').forEach(card => {{
    const text = card.textContent.toLowerCase();
    const kw   = (card.dataset.keywords || '').toLowerCase();
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
  document.getElementById('stat-total').textContent  = total;
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
      return title ? title.textContent.trim().split('\\n')[0].trim() : '';
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
  var READ_KEY = 'cas_read_fiches';
  var read = JSON.parse(localStorage.getItem(READ_KEY) || '[]');
  function markRead(href) {{
    var fname = href.split('/').pop();
    if (!read.includes(fname)) {{ read.push(fname); localStorage.setItem(READ_KEY, JSON.stringify(read)); }}
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
    var total   = document.querySelectorAll('.fiche-card').length;
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

# ── Main ─────────────────────────────────────────────────────────────
def main():
    # Lire toutes les fiches sauf index.html
    fiches_by_cat: dict[str, list[dict]] = {c[0]: [] for c in CATEGORY_ORDER}

    for path in sorted(FICHES_DIR.glob("*.html")):
        if path.name == "index.html":
            continue
        data = parse_fiche(path)
        if not data:
            print(f"  ⚠ skipped (no title): {path.name}")
            continue
        cat = data["cat_id"]
        if cat not in fiches_by_cat:
            fiches_by_cat[cat] = []
        fiches_by_cat[cat].append(data)
        print(f"  ✓ {path.name} → {cat}")

    # Construire les blocs HTML par catégorie
    cat_blocks = []
    total = 0
    for cat_id, label, color in CATEGORY_ORDER:
        fiches = fiches_by_cat.get(cat_id, [])
        if not fiches:
            continue
        cat_blocks.append(category_html(cat_id, label, color, fiches))
        total += len(fiches)

    html = render("\n".join(cat_blocks), total)
    INDEX_PATH.write_text(html, encoding="utf-8")
    print(f"\n✅ index.html régénéré — {total} fiches.")

if __name__ == "__main__":
    main()
