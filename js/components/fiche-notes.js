/* CAS-IN — Système de notes utilisateur sur fiches
 * ------------------------------------------------
 * Permet à l'utilisateur d'annoter chaque fiche.
 * Persistance localStorage : `cas-in-notes-{ficheId}`
 * Markdown supporté (gras/italique/code/liens/listes).
 *
 * Usage : chargé sur chaque fiche via <script src="../js/components/fiche-notes.js" defer></script>
 * Le composant s'auto-initialise et injecte un bouton flottant + un panneau latéral.
 *
 * v1.0 — 2026-05-02
 */
(function () {
  'use strict';

  // ─── Identification de la fiche courante ───
  // ID = nom du fichier HTML sans extension (ex: 'zimmerman' pour zimmerman.html)
  const path = window.location.pathname;
  const fname = path.split('/').pop() || 'unknown.html';
  const FICHE_ID = fname.replace(/\.html$/, '');

  // Skip pour fiches/index.html (pas une vraie fiche)
  if (FICHE_ID === 'index' || FICHE_ID === '' || FICHE_ID === 'unknown') return;

  const STORAGE_KEY = `cas-in-notes-${FICHE_ID}`;
  const STORAGE_META_KEY = `cas-in-notes-meta-${FICHE_ID}`;

  // ─── Mini-renderer Markdown (sécurisé) ───
  // On n'utilise PAS innerHTML brut — on construit avec textContent et style.
  // Les transformations sont limitées et appliquées sur du texte déjà échappé.
  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function renderMarkdown(raw) {
    if (!raw) return '<em style="color:var(--muted)">Aucune note pour cette fiche. Clique sur ✏️ pour commencer.</em>';
    let s = escapeHTML(raw);
    // Code inline `xxx`
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    // Gras **xxx** et __xxx__
    s = s.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // Italique *xxx* et _xxx_ (mais pas _ entouré de chiffres pour pas casser variable_name)
    s = s.replace(/(?<![a-zA-Z0-9])\*([^\*\n]+)\*(?![a-zA-Z0-9])/g, '<em>$1</em>');
    s = s.replace(/(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])/g, '<em>$1</em>');
    // Liens [texte](url) — restreints à http(s) et # ancres
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|#[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Listes - item ou * item (ligne par ligne)
    s = s.replace(/(^|\n)([\-\*])\s+(.+?)(?=\n|$)/g, '$1<li>$3</li>');
    s = s.replace(/(<li>.+?<\/li>(\n<li>.+?<\/li>)*)/g, '<ul style="margin:.4rem 0 .4rem 1.2rem;padding:0">$1</ul>');
    // Sauts de ligne → <br> (sauf après bloc HTML)
    s = s.replace(/\n/g, '<br>');
    // Nettoyer les <br> juste après </ul> ou avant <ul>
    s = s.replace(/<\/ul><br>/g, '</ul>').replace(/<br><ul/g, '<ul');
    return s;
  }

  // ─── Stockage ───
  function loadNote() {
    try { return localStorage.getItem(STORAGE_KEY) || ''; }
    catch (e) { return ''; }
  }

  function saveNote(text) {
    try {
      if (text && text.trim()) {
        localStorage.setItem(STORAGE_KEY, text);
        const meta = {
          ficheId: FICHE_ID,
          ficheTitle: document.title.replace(/\s*—.*$/, '').trim(),
          ficheUrl: window.location.pathname,
          updatedAt: new Date().toISOString(),
          length: text.length,
        };
        localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_META_KEY);
      }
      return true;
    } catch (e) {
      console.warn('[fiche-notes] save failed:', e);
      return false;
    }
  }

  // ─── Toast minimal ───
  function toast(msg, color = 'green') {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `
      position:fixed;bottom:80px;right:20px;z-index:10001;
      background:var(--bg);border:1px solid var(--${color});
      color:var(--${color});padding:.6rem 1rem;border-radius:6px;
      font-size:.85rem;font-weight:600;
      box-shadow:0 4px 12px rgba(0,0,0,.4);
      animation:fnoteToastIn .25s ease-out`;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2000);
    setTimeout(() => t.remove(), 2400);
  }

  // ─── Construction du bouton flottant ───
  function makeFloatingButton() {
    const btn = document.createElement('button');
    btn.id = 'fnotes-fab';
    btn.setAttribute('aria-label', 'Mes notes pour cette fiche');
    btn.title = 'Mes notes pour cette fiche';
    btn.innerHTML = '📝';
    btn.addEventListener('click', openPanel);
    return btn;
  }

  // ─── Construction du panneau latéral ───
  let panelEl = null;
  let textareaEl = null;
  let previewEl = null;
  let isPanelOpen = false;
  let modeIsPreview = false;
  let unsaved = false;
  let saveTimer = null;

  function makePanel() {
    const overlay = document.createElement('div');
    overlay.id = 'fnotes-overlay';
    overlay.addEventListener('click', closePanel);

    const panel = document.createElement('aside');
    panel.id = 'fnotes-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Mes notes pour cette fiche');

    panel.innerHTML = `
      <header class="fnotes-header">
        <div class="fnotes-title">
          <span class="fnotes-icon">📝</span>
          <span>Mes notes</span>
        </div>
        <button class="fnotes-close" aria-label="Fermer" title="Fermer (Esc)">✕</button>
      </header>

      <div class="fnotes-tabs">
        <button class="fnotes-tab active" data-mode="edit">✏️ Édition</button>
        <button class="fnotes-tab" data-mode="preview">👁️ Aperçu</button>
        <span class="fnotes-status" id="fnotes-status"></span>
      </div>

      <div class="fnotes-toolbar">
        <button class="fnotes-tool" data-md="bold" title="Gras (**)">𝐁</button>
        <button class="fnotes-tool" data-md="italic" title="Italique (*)">𝑰</button>
        <button class="fnotes-tool" data-md="code" title="Code">⟨/⟩</button>
        <button class="fnotes-tool" data-md="list" title="Liste">≡</button>
        <button class="fnotes-tool" data-md="link" title="Lien">🔗</button>
        <span class="fnotes-spacer"></span>
        <span class="fnotes-meta" id="fnotes-meta"></span>
      </div>

      <div class="fnotes-body">
        <textarea
          id="fnotes-text"
          spellcheck="true"
          placeholder="Écris tes notes ici. Markdown supporté : **gras**, *italique*, &#96;code&#96;, [lien](url), - liste.&#10;&#10;Sauvegarde automatique toutes les 2 secondes après modification.&#10;&#10;Astuces :&#10;• Tes notes sont stockées localement dans ton navigateur (privées).&#10;• Tu peux les exporter depuis ta page Profil.&#10;• Une note par fiche."
        ></textarea>
        <div id="fnotes-preview" class="fnotes-preview" hidden></div>
      </div>

      <footer class="fnotes-footer">
        <button class="fnotes-btn fnotes-btn-secondary" id="fnotes-clear" title="Effacer cette note">🗑️ Effacer</button>
        <button class="fnotes-btn fnotes-btn-secondary" id="fnotes-export" title="Exporter cette note">⬇️ Exporter</button>
        <button class="fnotes-btn fnotes-btn-primary" id="fnotes-save" title="Sauver maintenant (Ctrl+S)">💾 Sauver</button>
      </footer>
    `;

    return { overlay, panel };
  }

  function openPanel() {
    if (isPanelOpen) return;
    isPanelOpen = true;
    if (!panelEl) initPanel();
    document.getElementById('fnotes-overlay').classList.add('open');
    panelEl.classList.add('open');
    setTimeout(() => textareaEl.focus(), 250);
  }

  function closePanel() {
    if (!isPanelOpen) return;
    if (unsaved) {
      flushSave();
    }
    isPanelOpen = false;
    document.getElementById('fnotes-overlay').classList.remove('open');
    panelEl.classList.remove('open');
  }

  function initPanel() {
    const { overlay, panel } = makePanel();
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    panelEl = panel;
    textareaEl = panel.querySelector('#fnotes-text');
    previewEl = panel.querySelector('#fnotes-preview');

    // Charger la note existante
    textareaEl.value = loadNote();
    updateMeta();

    // Events
    panel.querySelector('.fnotes-close').addEventListener('click', closePanel);

    panel.querySelectorAll('.fnotes-tab').forEach(t => {
      t.addEventListener('click', () => switchMode(t.dataset.mode));
    });

    panel.querySelectorAll('.fnotes-tool').forEach(b => {
      b.addEventListener('click', () => applyMarkdown(b.dataset.md));
    });

    panel.querySelector('#fnotes-clear').addEventListener('click', clearNote);
    panel.querySelector('#fnotes-export').addEventListener('click', exportNote);
    panel.querySelector('#fnotes-save').addEventListener('click', flushSave);

    textareaEl.addEventListener('input', () => {
      unsaved = true;
      setStatus('• modifié', 'orange');
      // Auto-save debounced
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(flushSave, 2000);
      updateMeta();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!isPanelOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        flushSave();
      }
    });
  }

  function switchMode(mode) {
    modeIsPreview = (mode === 'preview');
    panelEl.querySelectorAll('.fnotes-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.mode === mode);
    });
    if (modeIsPreview) {
      previewEl.innerHTML = renderMarkdown(textareaEl.value);
      previewEl.hidden = false;
      textareaEl.hidden = true;
    } else {
      previewEl.hidden = true;
      textareaEl.hidden = false;
      textareaEl.focus();
    }
  }

  function applyMarkdown(type) {
    if (modeIsPreview) switchMode('edit');
    const ta = textareaEl;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = ta.value.slice(start, end);
    let replacement = '';
    let cursorOffset = 0;
    if (type === 'bold') {
      replacement = `**${sel || 'texte'}**`;
      cursorOffset = sel ? replacement.length : 2;
    } else if (type === 'italic') {
      replacement = `*${sel || 'texte'}*`;
      cursorOffset = sel ? replacement.length : 1;
    } else if (type === 'code') {
      replacement = `\`${sel || 'code'}\``;
      cursorOffset = sel ? replacement.length : 1;
    } else if (type === 'list') {
      replacement = sel ? sel.split('\n').map(l => l.trim() ? `- ${l}` : l).join('\n') : '- item 1\n- item 2';
      cursorOffset = replacement.length;
    } else if (type === 'link') {
      const url = prompt('URL du lien ?', 'https://');
      if (!url) return;
      replacement = `[${sel || 'texte'}](${url})`;
      cursorOffset = replacement.length;
    }
    ta.setRangeText(replacement, start, end, 'end');
    ta.focus();
    ta.dispatchEvent(new Event('input'));
  }

  function flushSave() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (!unsaved) return;
    const ok = saveNote(textareaEl.value);
    if (ok) {
      unsaved = false;
      setStatus('✓ sauvegardé', 'green');
      setTimeout(() => setStatus('', ''), 2000);
      updateMeta();
      updateFAB();
    } else {
      setStatus('⚠ erreur sauvegarde', 'red');
    }
  }

  function clearNote() {
    if (!textareaEl.value) return;
    if (!confirm('Supprimer cette note définitivement ?')) return;
    textareaEl.value = '';
    unsaved = true;
    flushSave();
    toast('Note supprimée');
    updateFAB();
  }

  function exportNote() {
    const text = textareaEl.value;
    if (!text) {
      toast('Aucune note à exporter', 'orange');
      return;
    }
    const title = document.title.replace(/\s*—.*$/, '').trim();
    const date = new Date().toLocaleString('fr-CH');
    const md = `# Notes — ${title}\n\n` +
               `> CAS-IN · Fiche : ${FICHE_ID}.html · Exporté le ${date}\n\n` +
               `---\n\n${text}\n`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cas-in-notes-${FICHE_ID}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Note exportée');
  }

  function setStatus(msg, color) {
    const el = panelEl.querySelector('#fnotes-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = color ? `var(--${color})` : '';
  }

  function updateMeta() {
    const el = panelEl && panelEl.querySelector('#fnotes-meta');
    if (!el) return;
    const text = textareaEl ? textareaEl.value : '';
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    el.textContent = chars ? `${words} mot${words > 1 ? 's' : ''} · ${chars} car.` : '';
  }

  function updateFAB() {
    const fab = document.getElementById('fnotes-fab');
    if (!fab) return;
    const hasNote = !!loadNote();
    fab.classList.toggle('has-note', hasNote);
    fab.title = hasNote ? 'Mes notes (✓ existante)' : 'Mes notes (créer)';
  }

  // ─── Inject CSS ───
  function injectCSS() {
    const cssHref = (path.includes('/fiches/') ? '../' : '') + 'style/fiche-notes.css';
    if (document.querySelector(`link[href="${cssHref}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    document.head.appendChild(link);
  }

  // ─── Init ───
  function init() {
    if (document.getElementById('fnotes-fab')) return;  // déjà init
    injectCSS();
    const fab = makeFloatingButton();
    document.body.appendChild(fab);
    updateFAB();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose minimal API for profile.html consumption
  window.CASNotes = {
    /** Liste toutes les notes existantes (depuis le profil) */
    listAll() {
      const notes = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cas-in-notes-meta-')) {
          try {
            const meta = JSON.parse(localStorage.getItem(key));
            const ficheId = key.replace('cas-in-notes-meta-', '');
            const text = localStorage.getItem(`cas-in-notes-${ficheId}`) || '';
            notes.push({ ...meta, text });
          } catch (e) { /* skip */ }
        }
      }
      return notes.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    },
    /** Cherche dans le contenu de toutes les notes */
    search(query) {
      const q = (query || '').trim().toLowerCase();
      if (!q) return this.listAll();
      return this.listAll().filter(n =>
        (n.text || '').toLowerCase().includes(q) ||
        (n.ficheTitle || '').toLowerCase().includes(q)
      );
    },
    /** Exporte toutes les notes en JSON */
    exportAll(format = 'json') {
      const all = this.listAll();
      if (format === 'markdown') {
        return all.map(n =>
          `# ${n.ficheTitle || n.ficheId}\n\n` +
          `> Fiche : ${n.ficheId}.html · Mise à jour : ${n.updatedAt}\n\n` +
          `${n.text}\n\n---\n`
        ).join('\n');
      }
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        count: all.length,
        notes: all,
      }, null, 2);
    },
    /** Supprime une note précise */
    delete(ficheId) {
      try {
        localStorage.removeItem(`cas-in-notes-${ficheId}`);
        localStorage.removeItem(`cas-in-notes-meta-${ficheId}`);
        return true;
      } catch (e) { return false; }
    },
    /** Supprime TOUTES les notes (avec confirm explicite côté caller) */
    deleteAll() {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('cas-in-notes-') || k.startsWith('cas-in-notes-meta-'))) keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
        return keys.length;
      } catch (e) { return 0; }
    },
  };
})();
