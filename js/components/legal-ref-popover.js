/* ═══════════════════════════════════════════════════════════════
 * legal-ref-popover.js — v2.98 (piste C2)
 *
 * Composant universel qui transforme tout élément
 *   <span class="legal-ref" data-ref="Art. 24 CPP">Art. 24 CPP</span>
 * en lien hoverable / cliquable qui ouvre un popover avec la
 * définition tirée de data/glossary.json (509 entrées).
 *
 * Usage :
 *   1. Charger data/glossary.json via window.LegalRefPopover.load()
 *   2. Marquer du HTML avec class="legal-ref" et data-ref="..."
 *   3. Click ou focus → popover automatique
 *
 * Le composant gère aussi :
 *   - Normalisation des refs (espaces, casse, accents)
 *   - Recherche floue (Art. 24 ⇄ art 24 ⇄ ART 24 CPP)
 *   - Single popover global (un seul ouvert à la fois)
 *
 * Architecture : IIFE auto-installée, idempotente.
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.LegalRefPopover) return;

  let _entries = null;     // dict normalisé {key: def}
  let _normMap = null;     // {normKey: realKey}
  let _loadPromise = null;
  let _activePopover = null;

  function normalize(s) {
    return String(s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // accents
      .toLowerCase()
      .replace(/[.,;:!?'"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async function load() {
    if (_entries) return _entries;
    if (_loadPromise) return _loadPromise;

    _loadPromise = (async () => {
      try {
        const r = await fetch('data/glossary.json');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const data = await r.json();
        _entries = data.entries || {};
        _normMap = {};
        Object.keys(_entries).forEach(k => {
          _normMap[normalize(k)] = k;
        });
        console.log('[legal-ref-popover] loaded', Object.keys(_entries).length, 'entries');
        return _entries;
      } catch (e) {
        console.warn('[legal-ref-popover] fetch failed:', e);
        _entries = {};
        _normMap = {};
        return {};
      }
    })();
    return _loadPromise;
  }

  function lookup(ref) {
    if (!_entries) return null;
    if (_entries[ref]) return { key: ref, def: _entries[ref] };
    const n = normalize(ref);
    if (_normMap[n]) return { key: _normMap[n], def: _entries[_normMap[n]] };
    // Recherche partielle : trouve une clé qui contient la ref
    for (const k of Object.keys(_normMap)) {
      if (k === n || k.startsWith(n) || n.startsWith(k)) {
        const realKey = _normMap[k];
        return { key: realKey, def: _entries[realKey] };
      }
    }
    return null;
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]
    ));
  }

  function close() {
    if (_activePopover) {
      _activePopover.remove();
      _activePopover = null;
    }
  }

  function openPopover(targetEl, ref) {
    close();
    const result = lookup(ref);
    const rect = targetEl.getBoundingClientRect();

    const popover = document.createElement('div');
    popover.className = 'legal-ref-popover';
    popover.setAttribute('role', 'tooltip');

    if (result) {
      popover.innerHTML = `
        <div class="legal-ref-popover-header">
          <span class="legal-ref-popover-icon">⚖️</span>
          <span class="legal-ref-popover-key">${escapeHTML(result.key)}</span>
          <button class="legal-ref-popover-close" aria-label="Fermer">×</button>
        </div>
        <div class="legal-ref-popover-body">${escapeHTML(result.def)}</div>
        <div class="legal-ref-popover-footer">
          <a href="glossary.html#${encodeURIComponent(result.key)}" class="legal-ref-popover-link">
            Voir dans le glossaire complet →
          </a>
        </div>
      `;
    } else {
      popover.innerHTML = `
        <div class="legal-ref-popover-header">
          <span class="legal-ref-popover-icon">❓</span>
          <span class="legal-ref-popover-key">${escapeHTML(ref)}</span>
          <button class="legal-ref-popover-close" aria-label="Fermer">×</button>
        </div>
        <div class="legal-ref-popover-body legal-ref-popover-body-unknown">
          Aucune définition trouvée. Vérifie le format ou cherche dans le
          <a href="glossary.html">glossaire complet</a>.
        </div>
      `;
    }

    document.body.appendChild(popover);
    _activePopover = popover;

    // Positionnement : au-dessus si possible, sinon dessous
    const ph = popover.offsetHeight;
    const pw = popover.offsetWidth;
    let top, left;
    if (rect.top - ph - 8 > 0) {
      top = rect.top + window.scrollY - ph - 8;
    } else {
      top = rect.bottom + window.scrollY + 8;
    }
    left = rect.left + window.scrollX + (rect.width / 2) - (pw / 2);
    // Clamp dans le viewport
    if (left < 10) left = 10;
    if (left + pw > window.innerWidth - 10) left = window.innerWidth - pw - 10;
    popover.style.top = top + 'px';
    popover.style.left = left + 'px';

    requestAnimationFrame(() => popover.classList.add('open'));

    popover.querySelector('.legal-ref-popover-close')?.addEventListener('click', close);

    // Fermer sur click externe
    function outside(e) {
      if (popover.contains(e.target) || targetEl.contains(e.target)) return;
      close();
      document.removeEventListener('mousedown', outside);
    }
    setTimeout(() => document.addEventListener('mousedown', outside), 50);

    // Fermer sur Escape
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  // Délégation globale : tout élément avec class="legal-ref"
  function bindGlobal() {
    document.addEventListener('click', (e) => {
      const el = e.target.closest('.legal-ref[data-ref]');
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      load().then(() => openPopover(el, el.dataset.ref));
    });
  }

  // Auto-marquage optionnel : prend tout texte qui matche un pattern type
  // "Art. 24 CPP" et le wrappe en <span class="legal-ref">. Activé via
  // attribut data-auto-legal-refs="true" sur le conteneur parent.
  function autoMark(container) {
    if (!container || !_entries) return;
    // Pattern : "Art. NNN(a)? XXX" où XXX = 2-6 lettres majuscules
    const re = /\b(Art\.\s*\d+[a-z]?\s+[A-Z]{2,6})\b/g;
    walkTextNodes(container, (node) => {
      const text = node.nodeValue;
      if (!re.test(text)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        if (m.index > last) {
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        }
        const span = document.createElement('span');
        span.className = 'legal-ref';
        span.dataset.ref = m[1];
        span.textContent = m[1];
        frag.appendChild(span);
        last = m.index + m[0].length;
      }
      if (last < text.length) {
        frag.appendChild(document.createTextNode(text.slice(last)));
      }
      node.parentNode.replaceChild(frag, node);
    });
  }
  function walkTextNodes(root, visitor) {
    const skipTags = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'A', 'BUTTON']);
    function walk(node) {
      if (!node) return;
      if (node.nodeType === 3) {
        visitor(node);
        return;
      }
      if (node.nodeType !== 1) return;
      if (skipTags.has(node.tagName)) return;
      if (node.classList && node.classList.contains('legal-ref')) return;
      // Snapshot children car visitor peut modifier
      const kids = Array.from(node.childNodes);
      kids.forEach(walk);
    }
    walk(root);
  }

  window.LegalRefPopover = {
    load,
    lookup,
    open: openPopover,
    close,
    autoMark,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindGlobal();
      load();
      // Auto-mark sur les conteneurs taggés
      load().then(() => {
        document.querySelectorAll('[data-auto-legal-refs="true"]').forEach(el => autoMark(el));
      });
    });
  } else {
    bindGlobal();
    load();
    setTimeout(() => {
      document.querySelectorAll('[data-auto-legal-refs="true"]').forEach(el => autoMark(el));
    }, 50);
  }
})();
