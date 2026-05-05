// ═══════════════════════════════════════════════════════════════
// scene-npcs.js — Affichage des PNJ (acteurs récurrents) dans les scènes
//
// Ce composant lit le champ `scene.npcs` (tableau d'IDs) et affiche un
// panneau « Acteurs en présence » dans le briefing de la scène. Au clic
// sur un PNJ, une modale s'ouvre avec :
//   • Avatar emoji + nom
//   • Rôle et institution
//   • Bio courte
//   • Expertise (tags)
//   • Indication "personnage réel" ou "personnage fictif"
//   • Liste des autres scènes où ce PNJ apparaît (cliquables)
//
// Données : data/npcs.json (chargé une fois, mis en cache mémoire)
// Index inversé : id_npc → liste des scenes.id qui le mentionnent
// (calculé à la volée depuis scenes/index.json)
//
// Style : compatible thème dark via variables CSS, badge "FICTIF" pour
// distinguer des personnalités publiques utilisées telles quelles.
//
// Le composant s'attache automatiquement à window.SceneNPCs et expose :
//   SceneNPCs.injectInBriefing(sceneId)  - appelée par scene-app
//   SceneNPCs.openCard(npcId)           - ouvre la modale d'un PNJ
//   SceneNPCs.getNPC(npcId)             - lecture brute
//
// v1.0 — 2026-05-03 (CAS-IN v2.26)
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const NPCS_URL = 'data/npcs.json';
  const SCENES_INDEX_URL = 'scenes/index.json';

  let _npcsCache = null;
  let _scenesIndexCache = null;
  let _reverseIndex = null;  // npcId → [sceneId, sceneId, ...]

  // ─── Chargement asynchrone (mémoïsé) ───
  async function loadNpcs() {
    if (_npcsCache) return _npcsCache;
    try {
      const r = await fetch(NPCS_URL);
      if (!r.ok) return null;
      const data = await r.json();
      _npcsCache = data.npcs || {};
      // v2.71 — Exposer en global pour que d'autres modules
      // (bandeau briefing, profile-page) y accèdent sans recharger.
      window.NPC_DATA = _npcsCache;
      return _npcsCache;
    } catch (e) {
      console.warn('[scene-npcs] Cannot load npcs.json:', e);
      return null;
    }
  }

  async function loadScenesIndex() {
    if (_scenesIndexCache) return _scenesIndexCache;
    try {
      const r = await fetch(SCENES_INDEX_URL);
      if (!r.ok) return null;
      _scenesIndexCache = await r.json();
      return _scenesIndexCache;
    } catch {
      return null;
    }
  }

  // ─── Index inversé : pour chaque NPC, trouver les scènes qui le mentionnent ───
  // On regarde le tableau `scene.npcs` (s'il existe) dans l'index. Si
  // l'index n'expose pas ce champ, on fallback sur fetch individuel des
  // scènes — coûteux mais ponctuel et caché.
  async function buildReverseIndex() {
    if (_reverseIndex) return _reverseIndex;
    const idx = await loadScenesIndex();
    if (!idx) return {};
    const reverse = {};
    for (const scene of idx) {
      const ids = scene.npcs;
      if (!Array.isArray(ids)) continue;
      for (const npcId of ids) {
        if (!reverse[npcId]) reverse[npcId] = [];
        reverse[npcId].push({
          id: scene.id,
          title: scene.title,
          icon: scene.icon || '🎭',
        });
      }
    }
    _reverseIndex = reverse;
    return _reverseIndex;
  }

  // ─── Sécurité HTML ───
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  // ─── Rendu d'une mini-carte PNJ (cliquable) ───
  function renderNpcChip(npc) {
    const fictionTag = npc.fictional
      ? '<span class="npc-chip-tag npc-chip-fictif">fictif</span>'
      : '<span class="npc-chip-tag npc-chip-reel">réel</span>';
    return `
      <button class="npc-chip" data-npc-id="${escapeAttr(npc.id)}"
              type="button"
              aria-label="Voir la fiche de ${escapeAttr(npc.name)}">
        <span class="npc-chip-icon">${escapeHtml(npc.icon || '🎭')}</span>
        <span class="npc-chip-body">
          <span class="npc-chip-name">${escapeHtml(npc.name)}</span>
          <span class="npc-chip-role">${escapeHtml(npc.role)}</span>
        </span>
        ${fictionTag}
      </button>
    `;
  }

  // ─── Ouverture de la modale d'un PNJ ───
  async function openCard(npcId) {
    const npcs = await loadNpcs();
    if (!npcs || !npcs[npcId]) return;
    const npc = npcs[npcId];
    const reverse = await buildReverseIndex();
    const otherScenes = (reverse[npcId] || []).filter(s => {
      // Filtrer la scène courante si on est en train de la jouer
      const currentId = window.G && window.G.scene ? window.G.scene.id : null;
      return s.id !== currentId;
    });

    const expertiseHTML = (npc.expertise || []).map(e =>
      `<span class="npc-card-tag">${escapeHtml(e)}</span>`
    ).join('');

    const otherScenesHTML = otherScenes.length
      ? `<div class="npc-card-section">
           <div class="npc-card-label">Autres scènes</div>
           <div class="npc-card-scenes">
             ${otherScenes.map(s => `
               <a class="npc-card-scene"
                  href="scene.html?id=${encodeURIComponent(s.id)}">
                 ${escapeHtml(s.icon)} ${escapeHtml(s.title)}
               </a>`).join('')}
           </div>
         </div>`
      : '<div class="npc-card-section"><em class="npc-card-muted">Apparaît uniquement dans cette scène pour l\'instant.</em></div>';

    const fictionHTML = npc.fictional
      ? '<span class="npc-card-banner npc-card-banner-fictif">📛 Personnage fictif</span>'
      : '<span class="npc-card-banner npc-card-banner-reel">👤 Personnalité publique réelle, utilisée dans son rôle officiel</span>';

    const modal = document.createElement('div');
    modal.className = 'npc-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'npc-modal-title');
    modal.innerHTML = `
      <div class="npc-modal-backdrop" data-npc-close></div>
      <div class="npc-modal-card">
        <button class="npc-modal-close" data-npc-close
                aria-label="Fermer">×</button>
        <div class="npc-card-header">
          <div class="npc-card-avatar">${escapeHtml(npc.icon || '🎭')}</div>
          <div class="npc-card-meta">
            <h2 id="npc-modal-title" class="npc-card-name">${escapeHtml(npc.name)}</h2>
            <div class="npc-card-role">${escapeHtml(npc.role)}</div>
            <div class="npc-card-institution">${escapeHtml(npc.institution || '')}</div>
          </div>
        </div>
        ${fictionHTML}
        <div class="npc-card-section">
          <div class="npc-card-label">Bio</div>
          <p class="npc-card-bio">${escapeHtml(npc.shortBio || '')}</p>
        </div>
        ${expertiseHTML ? `
        <div class="npc-card-section">
          <div class="npc-card-label">Expertise</div>
          <div class="npc-card-tags">${expertiseHTML}</div>
        </div>` : ''}
        <div class="npc-card-section">
          <div class="npc-card-label">Contexte pédagogique</div>
          <p class="npc-card-bio">${escapeHtml(npc.context || '')}</p>
        </div>
        ${otherScenesHTML}
        ${npc.publicProfile ? `<div class="npc-card-source">${escapeHtml(npc.publicProfile)}</div>` : ''}
      </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const close = () => {
      modal.remove();
      document.body.style.overflow = '';
    };

    modal.addEventListener('click', (e) => {
      if (e.target.matches('[data-npc-close]')) close();
    });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', onEsc);
      }
    });
  }

  // ─── Injection du panneau dans le briefing ───
  // Appelé par scene-app après render du briefing.
  // Retourne true si quelque chose a été injecté, false sinon.
  async function injectInBriefing(scene) {
    if (!scene || !Array.isArray(scene.npcs) || scene.npcs.length === 0) {
      return false;
    }
    const npcs = await loadNpcs();
    if (!npcs) return false;

    const validNpcs = scene.npcs
      .map(id => npcs[id])
      .filter(Boolean);
    if (validNpcs.length === 0) return false;

    const html = `
      <section class="npc-panel" aria-label="Acteurs en présence">
        <div class="npc-panel-header">
          <span class="npc-panel-icon">🎭</span>
          <span class="npc-panel-title">Acteurs en présence</span>
          <span class="npc-panel-count">${validNpcs.length}</span>
        </div>
        <div class="npc-panel-grid">
          ${validNpcs.map(renderNpcChip).join('')}
        </div>
      </section>
    `;

    injectStyles();

    // Insertion : après le bloc objectifs (#objectives-list) ou en fin de briefing.
    const target =
      document.getElementById('objectives-list') ||
      document.querySelector('.briefing-card') ||
      document.querySelector('#briefing-screen');
    if (!target) return false;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    const node = wrapper.firstElementChild;

    // Insérer après objectifs ou dans la carte briefing
    if (target.id === 'objectives-list' && target.parentElement) {
      target.parentElement.insertBefore(node, target.nextSibling);
    } else {
      target.appendChild(node);
    }

    // Click handler delegation
    node.addEventListener('click', (e) => {
      const btn = e.target.closest('.npc-chip');
      if (!btn) return;
      const id = btn.getAttribute('data-npc-id');
      if (id) openCard(id);
    });

    // v2.26 : tracking des PNJ rencontrés pour l'achievement npc_collector
    // Stocke un Set d'IDs unique dans localStorage.cas_npcs_met
    try {
      const raw = localStorage.getItem('cas_npcs_met');
      const seen = new Set(raw ? JSON.parse(raw) : []);
      let changed = false;
      for (const npc of validNpcs) {
        if (!seen.has(npc.id)) { seen.add(npc.id); changed = true; }
      }
      if (changed) {
        localStorage.setItem('cas_npcs_met', JSON.stringify([...seen]));
      }
    } catch {}

    return true;
  }

  // ─── CSS minimum (compatible thème dark, variables CSS) ───
  function injectStyles() {
    if (document.getElementById('scene-npcs-styles')) return;
    const css = `
      /* ── Panneau "Acteurs en présence" dans le briefing ── */
      .npc-panel {
        margin: 1.25rem 0;
        padding: 1rem;
        border: 1px solid var(--border, rgba(255,255,255,.1));
        border-radius: 12px;
        background: var(--surface2, rgba(255,255,255,.03));
      }
      .npc-panel-header {
        display: flex; align-items: center; gap: .5rem;
        margin-bottom: .75rem;
        font-size: .85rem;
        color: var(--dim, rgba(255,255,255,.7));
      }
      .npc-panel-icon { font-size: 1.05rem; }
      .npc-panel-title {
        font-weight: 600;
        text-transform: uppercase; letter-spacing: .04em;
        color: var(--text, #fff);
      }
      .npc-panel-count {
        margin-left: auto;
        padding: .15rem .5rem;
        border-radius: 999px;
        background: var(--cyan, rgba(92,217,255,.15));
        color: var(--cyan, #5cd9ff);
        font-size: .75rem;
        font-weight: 600;
      }
      .npc-panel-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: .55rem;
      }

      /* ── Chip cliquable ── */
      .npc-chip {
        display: flex; align-items: center; gap: .65rem;
        padding: .55rem .75rem;
        border: 1px solid var(--border, rgba(255,255,255,.08));
        border-radius: 10px;
        background: var(--surface, rgba(255,255,255,.02));
        color: var(--text, #fff);
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        font-size: .85rem;
        transition: all .15s ease;
      }
      .npc-chip:hover {
        border-color: var(--cyan, #5cd9ff);
        background: rgba(92,217,255,.06);
        transform: translateY(-1px);
      }
      .npc-chip-icon {
        font-size: 1.2rem;
        flex-shrink: 0;
      }
      .npc-chip-body {
        display: flex; flex-direction: column;
        min-width: 0; flex: 1;
        gap: .15rem;
      }
      .npc-chip-name {
        font-weight: 600;
        font-size: .85rem;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .npc-chip-role {
        font-size: .7rem;
        color: var(--dim, rgba(255,255,255,.6));
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .npc-chip-tag {
        font-size: .6rem;
        text-transform: uppercase; letter-spacing: .04em;
        padding: .15rem .35rem;
        border-radius: 4px;
        flex-shrink: 0;
      }
      .npc-chip-fictif {
        background: rgba(255,180,0,.15);
        color: #ffb400;
      }
      .npc-chip-reel {
        background: rgba(48,232,138,.12);
        color: var(--green, #30e88a);
      }

      /* ── Modale de fiche complète ── */
      .npc-modal {
        position: fixed; inset: 0;
        z-index: 9000;
        display: flex; align-items: center; justify-content: center;
        padding: 1rem;
      }
      .npc-modal-backdrop {
        position: absolute; inset: 0;
        background: rgba(0,0,0,.7);
        backdrop-filter: blur(4px);
        cursor: pointer;
      }
      .npc-modal-card {
        position: relative;
        background: var(--bg, #0a0e1a);
        border: 1px solid var(--border, rgba(255,255,255,.15));
        border-radius: 16px;
        padding: 1.5rem;
        max-width: 540px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        color: var(--text, #fff);
        box-shadow: 0 20px 60px rgba(0,0,0,.6);
      }
      .npc-modal-close {
        position: absolute; top: .75rem; right: .75rem;
        width: 32px; height: 32px;
        border: none;
        background: var(--surface2, rgba(255,255,255,.06));
        color: var(--text, #fff);
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transition: background .15s;
      }
      .npc-modal-close:hover { background: rgba(255,255,255,.12); }

      .npc-card-header {
        display: flex; gap: 1rem;
        margin-bottom: 1rem;
      }
      .npc-card-avatar {
        font-size: 3rem;
        line-height: 1;
        flex-shrink: 0;
      }
      .npc-card-meta { flex: 1; min-width: 0; }
      .npc-card-name {
        font-size: 1.3rem;
        font-weight: 700;
        margin: 0 0 .25rem 0;
      }
      .npc-card-role {
        font-size: .9rem;
        color: var(--cyan, #5cd9ff);
        margin-bottom: .15rem;
      }
      .npc-card-institution {
        font-size: .8rem;
        color: var(--dim, rgba(255,255,255,.6));
      }

      .npc-card-banner {
        display: block;
        padding: .55rem .85rem;
        border-radius: 8px;
        font-size: .8rem;
        margin-bottom: 1rem;
      }
      .npc-card-banner-fictif {
        background: rgba(255,180,0,.1);
        color: #ffb400;
        border: 1px solid rgba(255,180,0,.3);
      }
      .npc-card-banner-reel {
        background: rgba(48,232,138,.08);
        color: var(--green, #30e88a);
        border: 1px solid rgba(48,232,138,.25);
      }

      .npc-card-section { margin-bottom: 1rem; }
      .npc-card-label {
        font-size: .7rem;
        text-transform: uppercase;
        letter-spacing: .04em;
        color: var(--dim, rgba(255,255,255,.55));
        margin-bottom: .35rem;
      }
      .npc-card-bio {
        margin: 0;
        font-size: .9rem;
        line-height: 1.5;
      }
      .npc-card-tags {
        display: flex; flex-wrap: wrap; gap: .35rem;
      }
      .npc-card-tag {
        padding: .2rem .55rem;
        border-radius: 999px;
        background: var(--surface2, rgba(255,255,255,.06));
        font-size: .75rem;
      }
      .npc-card-scenes {
        display: flex; flex-direction: column; gap: .35rem;
      }
      .npc-card-scene {
        display: block;
        padding: .5rem .65rem;
        border-radius: 8px;
        background: var(--surface, rgba(255,255,255,.03));
        color: var(--text, #fff);
        text-decoration: none;
        font-size: .85rem;
        transition: background .15s;
      }
      .npc-card-scene:hover { background: rgba(92,217,255,.08); }
      .npc-card-source {
        margin-top: 1rem;
        padding-top: .75rem;
        border-top: 1px dashed var(--border, rgba(255,255,255,.08));
        font-size: .7rem;
        color: var(--dim, rgba(255,255,255,.5));
        font-style: italic;
      }
      .npc-card-muted {
        color: var(--dim, rgba(255,255,255,.5));
        font-size: .85rem;
      }

      @media print {
        .npc-panel, .npc-modal { display: none; }
      }
    `;
    const style = document.createElement('style');
    style.id = 'scene-npcs-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ─── API publique ───
  window.SceneNPCs = {
    injectInBriefing,
    openCard,
    getNPC: async (id) => {
      const npcs = await loadNpcs();
      return npcs ? npcs[id] : null;
    },
    listAll: loadNpcs,
  };

  // v2.71 — Précharger NPCs au boot pour que window.NPC_DATA soit
  // disponible aux autres modules (bandeau briefing) ASAP.
  loadNpcs().catch(() => {});
})();
