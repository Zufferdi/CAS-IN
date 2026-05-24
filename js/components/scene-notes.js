/* CAS-IN — Notes utilisateur par scène (Niveau H, axe H1)
 * --------------------------------------------------------
 * Réplique du système fiche-notes.js mais scopé sur sceneId.
 * Persistance localStorage : `cas-in-scene-notes-{sceneId}`
 *
 * Auto-initialisation au boot d'une scène (window.__currentSceneId
 * exposé par scene-app.js, sinon dérivé du hash #scene=<id>).
 *
 * Markdown léger supporté (gras, italique, code, listes, liens).
 *
 * Expose window.CASSceneNotes (API minimale pour profile-notes
 * unifié et pour l'export multi-scènes).
 *
 * v1.0 — 2026-05-23 (delta v94, H1)
 */
(function () {
  'use strict';

  // v95 (I) — i18n helper
  function t(key, fb) {
    return (window.CASi18n && window.CASi18n.t) ? window.CASi18n.t(key, fb) : fb;
  }

  // ─── Identification de la scène courante ───
  function getCurrentSceneId() {
    if (window.__currentSceneId) return window.__currentSceneId;
    // Hash : #scene=<id>
    const m = String(window.location.hash || '').match(/^#scene=([\w-]+)/);
    if (m) return m[1];
    // Query : ?scene=<id> ou ?id=<id>
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('scene') || p.get('id') || null;
    } catch (_) { return null; }
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function renderMarkdown(raw) {
    if (!raw) return '<em style="color:var(--muted,#6a80a8)">' + t('notes.empty_state', 'Aucune note. Clique sur ✏️ pour commencer.') + '</em>';
    let s = escapeHTML(raw);
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    s = s.replace(/(?<![a-zA-Z0-9])\*([^*\n]+)\*(?![a-zA-Z0-9])/g, '<em>$1</em>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|#[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/(^|\n)([\-*])\s+(.+?)(?=\n|$)/g, '$1<li>$3</li>');
    s = s.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>').replace(/<\/ul>\s*<ul>/g, '');
    s = s.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
    return '<p>' + s + '</p>';
  }

  // ─── Stockage ───
  function storageKey(sceneId) { return 'cas-in-scene-notes-' + sceneId; }
  function metaKey(sceneId) { return 'cas-in-scene-notes-meta-' + sceneId; }

  function loadNote(sceneId) {
    try { return localStorage.getItem(storageKey(sceneId)) || ''; }
    catch (_) { return ''; }
  }
  function saveNote(sceneId, content) {
    try {
      if (content) {
        localStorage.setItem(storageKey(sceneId), content);
        localStorage.setItem(metaKey(sceneId), JSON.stringify({ updated: Date.now() }));
      } else {
        localStorage.removeItem(storageKey(sceneId));
        localStorage.removeItem(metaKey(sceneId));
      }
      return true;
    } catch (_) { return false; }
  }

  // ─── API multi-scènes (utilisée par profile-notes) ───
  function listAllSceneNotes() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cas-in-scene-notes-') && !k.startsWith('cas-in-scene-notes-meta-')) {
          const sid = k.substring('cas-in-scene-notes-'.length);
          const content = localStorage.getItem(k) || '';
          if (!content) continue;
          let meta = {};
          try { meta = JSON.parse(localStorage.getItem(metaKey(sid)) || '{}'); } catch (_) {}
          out.push({ sceneId: sid, content, updated: meta.updated || 0 });
        }
      }
    } catch (_) {}
    out.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    return out;
  }

  function deleteAllSceneNotes() {
    const removed = [];
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cas-in-scene-notes-')) keys.push(k);
      }
      keys.forEach(k => { localStorage.removeItem(k); removed.push(k); });
    } catch (_) {}
    return removed.length;
  }

  // ─── UI : panneau flottant minimal ───
  function buildPanel(sceneId) {
    const btn = document.createElement('button');
    btn.id = 'cas-scene-note-fab';
    btn.type = 'button';
    btn.setAttribute('aria-label', t('notes.scene_fab_aria', 'Notes sur cette scène'));
    btn.title = t('notes.scene_fab_tooltip', 'Notes (clavier : N)');
    btn.textContent = '📝';
    btn.style.cssText = [
      'position:fixed', 'bottom:18px', 'right:18px', 'z-index:9000',
      'width:46px', 'height:46px', 'border-radius:50%',
      'background:rgba(126,192,255,.15)',
      'border:1px solid rgba(126,192,255,.4)',
      'color:#9ecbff', 'font-size:20px', 'cursor:pointer',
      'box-shadow:0 4px 12px rgba(0,0,0,.3)'
    ].join(';');

    const panel = document.createElement('aside');
    panel.id = 'cas-scene-note-panel';
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', t('notes.scene_fab_aria', 'Notes sur cette scène'));
    panel.hidden = true;
    panel.style.cssText = [
      'position:fixed', 'bottom:74px', 'right:18px', 'z-index:9001',
      'width:min(380px, calc(100vw - 36px))',
      'max-height:60vh', 'overflow:hidden',
      'background:var(--card,#0e1729)',
      'border:1px solid var(--border,rgba(255,255,255,.1))',
      'border-radius:12px', 'display:flex', 'flex-direction:column',
      'box-shadow:0 8px 24px rgba(0,0,0,.4)'
    ].join(';');

    panel.innerHTML = `
      <div style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between;gap:8px">
        <strong style="font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:.5px;color:var(--text,#ccd8f0)">${t('notes.scene_panel_title', '📝 NOTE')} — ${escapeHTML(sceneId)}</strong>
        <div style="display:flex;gap:6px">
          <button type="button" id="cas-scene-note-edit" style="background:transparent;border:1px solid rgba(255,255,255,.15);color:var(--text,#ccd8f0);padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px">✏️</button>
          <button type="button" id="cas-scene-note-close" aria-label="${t('ui.close', 'Fermer')}" style="background:transparent;border:0;color:var(--dim,#6a80a8);font-size:18px;cursor:pointer;padding:0 4px">×</button>
        </div>
      </div>
      <div id="cas-scene-note-view" style="padding:12px 14px;overflow:auto;flex:1;font-size:13px;line-height:1.5;color:var(--text,#ccd8f0)"></div>
      <textarea id="cas-scene-note-edit-ta"
                placeholder="${t('notes.placeholder', 'Écris ta note ici. Markdown : **gras**, *italique*, \`code\`, - liste, [lien](https://...)')}"
                style="display:none;padding:12px 14px;flex:1;background:transparent;border:0;border-top:1px solid rgba(255,255,255,.08);color:var(--text,#ccd8f0);font-family:'JetBrains Mono','Share Tech Mono',monospace;font-size:13px;resize:none;outline:none;width:100%;box-sizing:border-box"></textarea>
      <div id="cas-scene-note-actions" style="display:none;padding:8px 14px;border-top:1px solid rgba(255,255,255,.08);justify-content:flex-end;gap:8px;background:rgba(255,255,255,.03)">
        <button type="button" id="cas-scene-note-cancel" style="background:transparent;border:1px solid rgba(255,255,255,.15);color:var(--dim,#6a80a8);padding:5px 12px;border-radius:6px;cursor:pointer;font-size:11px">${t('notes.cancel_button', 'Annuler')}</button>
        <button type="button" id="cas-scene-note-save" style="background:rgba(126,192,255,.18);border:1px solid rgba(126,192,255,.4);color:#9ecbff;padding:5px 14px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600">${t('notes.save_button', '💾 Enregistrer')}</button>
      </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    const viewEl = panel.querySelector('#cas-scene-note-view');
    const taEl = panel.querySelector('#cas-scene-note-edit-ta');
    const actionsEl = panel.querySelector('#cas-scene-note-actions');

    function refreshView() {
      viewEl.innerHTML = renderMarkdown(loadNote(sceneId));
    }
    refreshView();

    btn.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) refreshView();
    });
    panel.querySelector('#cas-scene-note-close').addEventListener('click', () => { panel.hidden = true; });
    panel.querySelector('#cas-scene-note-edit').addEventListener('click', () => {
      taEl.value = loadNote(sceneId);
      viewEl.style.display = 'none';
      taEl.style.display = 'block';
      actionsEl.style.display = 'flex';
      taEl.focus();
    });
    panel.querySelector('#cas-scene-note-cancel').addEventListener('click', () => {
      viewEl.style.display = 'block';
      taEl.style.display = 'none';
      actionsEl.style.display = 'none';
    });
    panel.querySelector('#cas-scene-note-save').addEventListener('click', () => {
      saveNote(sceneId, taEl.value.trim());
      refreshView();
      viewEl.style.display = 'block';
      taEl.style.display = 'none';
      actionsEl.style.display = 'none';
    });

    // Raccourci clavier N (sauf dans input/textarea)
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        btn.click();
      }
    });
  }

  // ─── Init ───
  function init() {
    const sid = getCurrentSceneId();
    if (!sid) return;
    if (document.getElementById('cas-scene-note-fab')) return; // déjà initialisé
    buildPanel(sid);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Réagir aux changements de scène (hash)
  window.addEventListener('hashchange', () => {
    const old = document.getElementById('cas-scene-note-fab');
    const oldPanel = document.getElementById('cas-scene-note-panel');
    if (old) old.remove();
    if (oldPanel) oldPanel.remove();
    setTimeout(init, 100);
  });

  // ─── API publique ───
  window.CASSceneNotes = {
    listAll: listAllSceneNotes,
    deleteAll: deleteAllSceneNotes,
    loadNote,
    saveNote
  };
})();
