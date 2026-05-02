/* CAS-IN — Gestion des notes utilisateur depuis profile.html
 * Liste, recherche, export, suppression globale.
 * Dépend de fiche-notes.js (window.CASNotes API).
 * v1.0 — 2026-05-02
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(() => {
    if (!window.CASNotes) {
      console.warn('[profile-notes] CASNotes API absente — fiche-notes.js non chargé ?');
      return;
    }

    const listEl = document.getElementById('notes-list');
    const searchEl = document.getElementById('notes-search');
    const countEl = document.getElementById('notes-count');
    const wordsEl = document.getElementById('notes-total-words');
    const fichesEl = document.getElementById('notes-fiches');
    const btnExportMd = document.getElementById('notes-export-md');
    const btnExportJson = document.getElementById('notes-export-json');
    const btnDeleteAll = document.getElementById('notes-delete-all');

    if (!listEl) return;

    function escapeHTML(s) {
      return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }

    function snippet(text, query, maxLen = 140) {
      if (!text) return '';
      const lower = text.toLowerCase();
      let start = 0;
      if (query) {
        const q = query.trim().toLowerCase();
        const idx = lower.indexOf(q);
        if (idx > 30) start = Math.max(0, idx - 30);
      }
      let s = text.slice(start, start + maxLen);
      if (start > 0) s = '…' + s;
      if (start + maxLen < text.length) s = s + '…';
      return escapeHTML(s);
    }

    function highlightQuery(html, query) {
      if (!query) return html;
      const q = query.trim();
      if (!q) return html;
      const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return html.replace(re, '<mark style="background:rgba(0,229,204,.3);color:var(--cyan);padding:0 .15rem">$1</mark>');
    }

    function formatDate(iso) {
      if (!iso) return '—';
      try {
        const d = new Date(iso);
        return d.toLocaleString('fr-CH', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      } catch (e) {
        return iso;
      }
    }

    function render(query) {
      const notes = query ? window.CASNotes.search(query) : window.CASNotes.listAll();
      const allNotes = window.CASNotes.listAll();

      // Stats globales (sans filtre)
      countEl.textContent = allNotes.length;
      const totalWords = allNotes.reduce((sum, n) => {
        return sum + ((n.text || '').trim() ? n.text.trim().split(/\s+/).length : 0);
      }, 0);
      wordsEl.textContent = totalWords.toLocaleString('fr-CH');
      fichesEl.textContent = allNotes.length;

      if (!notes.length) {
        listEl.innerHTML = `
          <div class="notes-empty">
            ${query
              ? `Aucun résultat pour "<strong>${escapeHTML(query)}</strong>".`
              : 'Tu n\'as pas encore de notes. Ouvre une fiche et clique sur 📝 en bas à droite pour commencer.'}
          </div>
        `;
        return;
      }

      listEl.innerHTML = notes.map(n => {
        const link = n.ficheUrl || `fiches/${n.ficheId}.html`;
        const title = n.ficheTitle || n.ficheId;
        const snip = snippet(n.text, query);
        const snipHtml = highlightQuery(snip, query);
        return `
          <article class="notes-item">
            <div class="notes-item-header">
              <a href="${escapeHTML(link)}" class="notes-item-title">${escapeHTML(title)}</a>
              <span class="notes-item-meta">📅 ${formatDate(n.updatedAt)} · ${(n.length || n.text.length).toLocaleString('fr-CH')} car.</span>
            </div>
            <div class="notes-item-snippet">${snipHtml || '<em>(note vide)</em>'}</div>
            <div class="notes-item-actions">
              <a href="${escapeHTML(link)}" class="notes-item-btn">📂 Ouvrir la fiche</a>
              <button type="button" class="notes-item-btn" data-action="export" data-fiche="${escapeHTML(n.ficheId)}">⤓ Exporter (.md)</button>
              <button type="button" class="notes-item-btn danger" data-action="delete" data-fiche="${escapeHTML(n.ficheId)}">🗑️ Supprimer</button>
            </div>
          </article>
        `;
      }).join('');

      // Bind actions item-by-item
      listEl.querySelectorAll('button[data-action]').forEach(b => {
        b.addEventListener('click', () => handleItemAction(b));
      });
    }

    function handleItemAction(btn) {
      const action = btn.dataset.action;
      const ficheId = btn.dataset.fiche;
      if (!ficheId) return;

      if (action === 'delete') {
        if (!confirm(`Supprimer définitivement la note pour "${ficheId}.html" ?`)) return;
        window.CASNotes.delete(ficheId);
        render(searchEl.value);
        toast('Note supprimée');
      } else if (action === 'export') {
        const all = window.CASNotes.listAll();
        const note = all.find(n => n.ficheId === ficheId);
        if (!note) return;
        const md = `# Notes — ${note.ficheTitle || note.ficheId}\n\n` +
                   `> CAS-IN · Fiche : ${note.ficheId}.html · Mise à jour : ${note.updatedAt}\n\n` +
                   `---\n\n${note.text}\n`;
        downloadFile(`cas-in-notes-${ficheId}.md`, md, 'text/markdown');
      }
    }

    function downloadFile(name, content, type) {
      const blob = new Blob([content], { type: `${type};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function toast(msg) {
      const t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText = `
        position:fixed;bottom:30px;right:30px;z-index:10001;
        background:var(--bg);border:1px solid var(--cyan);color:var(--cyan);
        padding:.6rem 1rem;border-radius:6px;font-weight:600;font-size:.85rem;
        box-shadow:0 4px 12px rgba(0,0,0,.4)`;
      document.body.appendChild(t);
      setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2000);
      setTimeout(() => t.remove(), 2400);
    }

    // Bind global actions
    btnExportMd && btnExportMd.addEventListener('click', () => {
      const all = window.CASNotes.listAll();
      if (!all.length) { toast('Aucune note à exporter'); return; }
      const md = window.CASNotes.exportAll('markdown');
      const date = new Date().toISOString().slice(0, 10);
      downloadFile(`cas-in-notes-export-${date}.md`, md, 'text/markdown');
      toast(`${all.length} note(s) exportée(s)`);
    });

    btnExportJson && btnExportJson.addEventListener('click', () => {
      const all = window.CASNotes.listAll();
      if (!all.length) { toast('Aucune note à exporter'); return; }
      const json = window.CASNotes.exportAll('json');
      const date = new Date().toISOString().slice(0, 10);
      downloadFile(`cas-in-notes-export-${date}.json`, json, 'application/json');
      toast(`${all.length} note(s) exportée(s)`);
    });

    btnDeleteAll && btnDeleteAll.addEventListener('click', () => {
      const all = window.CASNotes.listAll();
      if (!all.length) { toast('Aucune note à supprimer'); return; }
      if (!confirm(`Supprimer définitivement TOUTES les ${all.length} notes ?\nCette action est IRRÉVERSIBLE.`)) return;
      if (!confirm('Confirmation finale : supprimer toutes tes notes maintenant ?')) return;
      const n = window.CASNotes.deleteAll();
      render(searchEl.value);
      toast(`${n / 2} note(s) supprimée(s)`);  // on divise par 2 car CASNotes.deleteAll compte texte+meta
    });

    // Search debounced
    let searchTimer = null;
    searchEl.addEventListener('input', () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => render(searchEl.value), 200);
    });

    // Initial render
    render('');
  });
})();
