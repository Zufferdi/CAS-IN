// ═══════════════════════════════════════════════════════
// cas-in-fiche.js — Améliorations pour les fiches individuelles
// Chantier J : bouton Imprimer
// Chantier H : navigation précédent/suivant
// Inclure dans chaque fiche : <script src="../cas-in-fiche.js" defer></script>
// ═══════════════════════════════════════════════════════
(function () {
  'use strict';

  // Détection de page fiche : présence de .topnav OU chemin /fiches/*.html
  const isFichePage = document.querySelector('.topnav') ||
    /\/fiches\/[^/]+\.html$/.test(window.location.pathname);
  if (!isFichePage) return;

  // ── Chantier J : Bouton Imprimer ──────────────────────
  function injectPrintBtn() {
    // Ne pas dupliquer
    if (document.getElementById('print-fiche-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'print-fiche-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Imprimer cette fiche');
    btn.title = 'Imprimer / Exporter en PDF (Ctrl+P)';
    btn.innerHTML = '🖨 Imprimer';
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999;padding:.5rem .85rem;border-radius:8px;border:1px solid rgba(0,229,204,.35);background:rgba(0,229,204,.1);color:var(--cyan,#00e5cc);font-family:var(--mono,monospace);font-size:.75rem;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3);backdrop-filter:blur(8px);transition:.15s';
    btn.onmouseover = () => { btn.style.background = 'rgba(0,229,204,.2)'; btn.style.transform = 'translateY(-2px)'; };
    btn.onmouseout  = () => { btn.style.background = 'rgba(0,229,204,.1)';  btn.style.transform = ''; };
    btn.onclick = () => window.print();
    document.body.appendChild(btn);
  }

  // ── Chantier H : Précédent / Suivant ──────────────────
  // On ne peut pas récupérer la liste des fiches depuis une fiche isolée, mais on peut
  // essayer de charger l'index et extraire l'ordre. Fallback : pas de nav si échec.
  async function injectPrevNext() {
    try {
      // Chercher la topnav existante
      const topnav = document.querySelector('.topnav');
      if (!topnav) return;
      if (document.getElementById('fiche-prevnext')) return;

      // Charger l'index des fiches (mis en cache par le navigateur sur la 2e visite)
      const resp = await fetch('index.html', { cache: 'force-cache' });
      if (!resp.ok) return;
      const html = await resp.text();

      // Extraire la liste ordonnée des fiches via regex
      const matches = [...html.matchAll(/<a\s+href="([a-z0-9_-]+\.html)"\s+class="fiche-card"/gi)];
      if (matches.length < 2) return;
      const list = matches.map(m => m[1]);
      const current = window.location.pathname.split('/').pop();
      const idx = list.indexOf(current);
      if (idx === -1) return;

      const prev = idx > 0 ? list[idx - 1] : null;
      const next = idx < list.length - 1 ? list[idx + 1] : null;

      // Wrapper compact à injecter dans la topnav
      const wrap = document.createElement('div');
      wrap.id = 'fiche-prevnext';
      wrap.style.cssText = 'display:flex;gap:6px;align-items:center;margin-left:auto';
      wrap.setAttribute('aria-label', 'Navigation entre fiches');

      if (prev) {
        const a = document.createElement('a');
        a.href = prev;
        a.className = 'tn-home';
        a.setAttribute('aria-label', 'Fiche précédente');
        a.title = `← ${prev.replace(/\.html$/,'').replace(/_/g,' ')}`;
        a.textContent = '←';
        a.style.cssText = 'padding:.3rem .5rem;font-size:.85rem;min-width:28px;text-align:center';
        wrap.appendChild(a);
      }

      const counter = document.createElement('span');
      counter.style.cssText = 'font-size:.65rem;color:var(--dim,#8ea3c8);font-family:var(--mono,monospace);padding:0 .25rem';
      counter.textContent = `${idx + 1} / ${list.length}`;
      wrap.appendChild(counter);

      if (next) {
        const a = document.createElement('a');
        a.href = next;
        a.className = 'tn-home';
        a.setAttribute('aria-label', 'Fiche suivante');
        a.title = `${next.replace(/\.html$/,'').replace(/_/g,' ')} →`;
        a.textContent = '→';
        a.style.cssText = 'padding:.3rem .5rem;font-size:.85rem;min-width:28px;text-align:center';
        wrap.appendChild(a);
      }

      topnav.appendChild(wrap);

      // Raccourcis clavier : ← / →
      document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea, [contenteditable]')) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === 'ArrowLeft' && prev) { e.preventDefault(); location.href = prev; }
        if (e.key === 'ArrowRight' && next) { e.preventDefault(); location.href = next; }
      });

      // Chantier L (partie 1) : marquer la fiche comme lue dans localStorage
      try {
        const readKey = 'cas_read_fiches';
        const arr = JSON.parse(localStorage.getItem(readKey) || '[]');
        if (!arr.includes(current)) {
          arr.push(current);
          localStorage.setItem(readKey, JSON.stringify(arr));
        }
      } catch (e) { /* silencieux */ }
    } catch (e) { /* silencieux */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectPrintBtn();
      injectPrevNext();
    });
  } else {
    injectPrintBtn();
    injectPrevNext();
  }
})();
