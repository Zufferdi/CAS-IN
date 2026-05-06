// ═══════════════════════════════════════════════════════════════
// artifacts-app.js — Moteur de l'aide-mémoire artefacts forensiques
//
// Page : artifacts.html (CAS-IN)
// Données : window.ARTIFACTS_DATA (depuis artifacts-data.js)
//
// Comportement :
//   • Filtres OS / Catégorie / Version Windows / Recherche libre
//   • Tri sur les colonnes (clic en-tête)
//   • Détail dépliable au clic sur une ligne
//   • Tout / Rien : expandAll / collapseAll
//
// Toutes les fonctions appelées par onclick (resetFilters, expandAll,
// collapseAll) restent globales (window.*).
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // Données injectées par artifacts-data.js (chargé avant ce script)
  const data = window.ARTIFACTS_DATA || [];
  // const HIVE_FILES = window.ARTIFACTS_HIVE_FILES || {}; // non utilisé directement

  // Échap de base pour le contenu textuel issu des champs (les bullets et
  // descriptions sont volontairement injectés en HTML brut — ils contiennent
  // du <code>, <b> etc. — donc seulement les champs identifiants sont échappés).
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g,
      c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ── DOM refs ──────────────────────────────────────────────
  const tbody   = document.getElementById('art-tbody');
  const fOs     = document.getElementById('f-os');
  const fSrc    = document.getElementById('f-src');
  const fCat    = document.getElementById('f-cat');
  const fVer    = document.getElementById('f-ver');
  const fQ      = document.getElementById('f-q');
  const countEl = document.getElementById('art-count');

  if (!tbody) {
    console.warn('[artifacts-app] aucun #art-tbody — page hors contexte');
    return;
  }

  // ── Filtres dynamiques ────────────────────────────────────
  function populateFilters() {
    const cats = [...new Set(data.map(d => d.category))].sort();
    fCat.innerHTML = '<option value="">Toutes</option>';
    cats.forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = c;
      fCat.appendChild(o);
    });

    const sources = [...new Set(data.map(d => d.source))].sort();
    fSrc.innerHTML = '<option value="">Toutes</option>';
    sources.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      fSrc.appendChild(o);
    });
  }

  // ── État de tri ───────────────────────────────────────────
  let sortKey = null, sortDir = 1;

  // ── Rendu principal ───────────────────────────────────────
  function render() {
    const os  = fOs.value;
    const src = fSrc.value;
    const cat = fCat.value;
    const ver = fVer.value;
    const q   = fQ.value.toLowerCase().trim();

    let rows = data.filter(d => {
      if (os && d.os !== os) return false;
      if (src && d.source !== src) return false;
      if (cat && d.category !== cat) return false;
      if (ver && d.os === 'Windows' && d.versions.length > 0 && !d.versions.includes(ver)) return false;
      if (q) {
        const hay = (d.name + ' ' + d.path + ' ' + d.source + ' ' + d.description + ' '
                    + (d.bullets||[]).join(' ') + ' ' + (d.notes||'') + ' ' + d.category).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortKey) {
      rows.sort((a, b) => {
        const va = (a[sortKey]||'').toString().toLowerCase();
        const vb = (b[sortKey]||'').toString().toLowerCase();
        if (va < vb) return -sortDir;
        if (va > vb) return sortDir;
        return 0;
      });
    }

    tbody.innerHTML = '';
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="art-empty">Aucun résultat</td></tr>';
      countEl.textContent = `0 / ${data.length} artefacts`;
      return;
    }

    rows.forEach((d) => {
      const tr = document.createElement('tr');
      tr.className = 'art-row';
      tr.innerHTML = `
        <td><span class="art-badge art-badge-${esc(d.os)}">${d.os === 'Mac' ? 'macOS' : esc(d.os)}</span></td>
        <td><span class="art-src">${esc(d.source)}</span></td>
        <td><span class="art-cat">${esc(d.category)}</span></td>
        <td><b>${esc(d.name)}</b></td>
        <td><span class="art-path">${esc(d.path)}</span></td>
        <td class="art-versions">${d.os === 'Windows' ? (d.versions.length ? d.versions.map(esc).join(', ') : 'Toutes') : '—'}</td>
      `;

      const dt = document.createElement('tr');
      dt.className = 'art-detail';
      let html = `<td colspan="6"><h3>${esc(d.name)}</h3>`;

      // Bloc "fichier source" mis en évidence
      if (d.hiveFile) {
        html += `<div class="art-hive-file"><b>📁 Fichier de ruche à ouvrir :</b> <code>${esc(d.hiveFile.file)}</code><br>`;
        html += `<b>Monté en live sous :</b> <code>${esc(d.hiveFile.liveKey)}</code></div>`;
      }

      html += `<div class="art-grid">`;
      html += `<div>OS</div><div>${d.os === 'Mac' ? 'macOS' : esc(d.os)}</div>`;
      html += `<div>Source / Fichier</div><div><span class="art-src">${esc(d.source)}</span></div>`;
      html += `<div>Catégorie</div><div>${esc(d.category)}</div>`;
      html += `<div>Chemin / sous-clé</div><div><span class="art-path">${esc(d.path)}</span></div>`;
      if (d.os === 'Windows' && d.versions.length) {
        html += `<div>Versions Windows</div><div>${d.versions.map(esc).join(', ')}</div>`;
      }
      html += `</div>`;
      // description / bullets / notes : contenu HTML auteur (intentionnel)
      html += `<div class="art-desc"><b>Description :</b> ${d.description || ''}</div>`;
      if (d.bullets && d.bullets.length) {
        html += `<ul class="art-bullets">`;
        d.bullets.forEach(b => { html += `<li>${b}</li>`; });
        html += `</ul>`;
      }
      if (d.notes) {
        html += `<div class="art-desc art-notes"><b>Notes :</b> ${d.notes}</div>`;
      }
      html += `</td>`;
      dt.innerHTML = html;

      tr.addEventListener('click', () => {
        const open = dt.classList.toggle('show');
        tr.classList.toggle('open', open);
      });

      tbody.appendChild(tr);
      tbody.appendChild(dt);
    });

    countEl.textContent = `${rows.length} / ${data.length} artefacts`;
  }

  // ── Tri ───────────────────────────────────────────────────
  document.querySelectorAll('th[data-k]').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.k;
      if (sortKey === k) sortDir = -sortDir;
      else { sortKey = k; sortDir = 1; }
      // mise à jour visuelle des indicateurs de tri
      document.querySelectorAll('th[data-k]').forEach(other => {
        other.classList.remove('art-sorted-asc', 'art-sorted-desc');
      });
      th.classList.add(sortDir === 1 ? 'art-sorted-asc' : 'art-sorted-desc');
      render();
    });
  });

  // ── Filtres : ré-rendu sur changement ─────────────────────
  [fOs, fSrc, fCat, fVer, fQ].forEach(el => {
    if (!el) return;
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  // ── Actions globales (boutons) ────────────────────────────
  window.resetFilters = function () {
    fOs.value = ''; fSrc.value = ''; fCat.value = ''; fVer.value = ''; fQ.value = '';
    sortKey = null; sortDir = 1;
    document.querySelectorAll('th[data-k]').forEach(th => {
      th.classList.remove('art-sorted-asc', 'art-sorted-desc');
    });
    render();
  };

  window.expandAll = function () {
    document.querySelectorAll('tr.art-detail').forEach(d => d.classList.add('show'));
    document.querySelectorAll('tr.art-row').forEach(r => r.classList.add('open'));
  };

  window.collapseAll = function () {
    document.querySelectorAll('tr.art-detail').forEach(d => d.classList.remove('show'));
    document.querySelectorAll('tr.art-row').forEach(r => r.classList.remove('open'));
  };

  // ── Init ──────────────────────────────────────────────────
  populateFilters();
  render();
})();
