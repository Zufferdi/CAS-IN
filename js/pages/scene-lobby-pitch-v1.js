/**
 * CAS-IN — Lobby pitch panel v1
 * ──────────────────────────────────────────────────────────────
 * Quand une campagne (parcours) est cliquée, on affiche un VRAI
 * panneau pitch (synopsis + chronologie + cast + thèmes) au lieu
 * de la petite barre "Campagne active : ...".
 *
 * Architecture :
 *   ─ scene-lobby-v3.js expose window.CAS_IN_PARCOURS = PARCOURS
 *     (3 lignes ajoutées par le patch v2.91 — voir PATCH-NOTES.md)
 *   ─ scene-lobby-pitch-data.js déclare window.CAS_IN_CAMPAIGN_META
 *     = { <campaignId>: { tagline, synopsis, cast, themes, regions } }
 *   ─ ce fichier observe l'apparition de .parcours-active-banner et
 *     la remplace par un .pitch-panel.
 *
 * Pour les campagnes sans meta enrichie, fallback gracieux sur
 *   {title, icon, desc} déjà définis dans PARCOURS.
 *
 * Loading order (scene.html) :
 *   <script src="js/pages/scene-lobby-v3.js" defer></script>
 *   <script src="js/pages/scene-lobby-pitch-data.js" defer></script>
 *   <script src="js/pages/scene-lobby-pitch-v1.js" defer></script>
 */
(function () {
  'use strict';

  function injectStyles() {
    if (document.getElementById('lobby-pitch-styles')) return;
    const s = document.createElement('style');
    s.id = 'lobby-pitch-styles';
    s.textContent = `
      .pitch-panel{
        background:linear-gradient(135deg, rgba(0,229,204,.06), rgba(106,184,255,.04) 60%, rgba(255,255,255,.01));
        border:1.5px solid var(--cyan);
        border-radius:var(--r);
        margin-bottom:14px;
        position:relative;
        overflow:hidden;
        box-shadow:0 0 32px rgba(0,229,204,.10), inset 0 1px 0 rgba(255,255,255,.04);
        animation:pitch-fade-in .25s ease-out;
      }
      @keyframes pitch-fade-in{
        from{opacity:0;transform:translateY(-4px)}
        to{opacity:1;transform:translateY(0)}
      }
      .pitch-panel::before{
        content:'';
        position:absolute;top:0;left:0;right:0;height:2px;
        background:linear-gradient(90deg, transparent, var(--cyan), transparent);
        opacity:.6;
      }
      .pitch-head{display:flex;align-items:flex-start;gap:14px;padding:16px 18px 4px}
      .pitch-head-icon{font-size:42px;line-height:1;flex-shrink:0;filter:drop-shadow(0 0 14px rgba(0,229,204,.45))}
      .pitch-head-body{flex:1;min-width:0}
      .pitch-head-label{font-size:10px;color:var(--cyan);font-family:var(--font-mono);font-weight:700;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:4px;opacity:.85}
      .pitch-head-title{font-size:18px;font-weight:800;color:var(--text);line-height:1.25;margin-bottom:4px}
      .pitch-head-tagline{font-size:13px;color:var(--dim);font-style:italic;line-height:1.4}
      .pitch-head-close{background:transparent;border:1px solid var(--border);color:var(--dim);font-size:11px;padding:5px 12px;border-radius:4px;cursor:pointer;font-family:var(--font-mono);font-weight:700;flex-shrink:0;align-self:flex-start;transition:.15s}
      .pitch-head-close:hover{color:var(--text);border-color:var(--text);background:rgba(255,255,255,.04)}
      .pitch-progress{margin:0 18px 12px;display:flex;align-items:center;gap:10px;font-size:11px;color:var(--dim);font-family:var(--font-mono)}
      .pitch-progress-track{flex:1;height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden}
      .pitch-progress-fill{height:100%;background:linear-gradient(90deg,var(--cyan) 0%,#7affea 100%);transition:width .4s;box-shadow:0 0 8px rgba(0,229,204,.4)}
      .pitch-progress-pct{font-weight:700;color:var(--text);min-width:40px;text-align:right}
      .pitch-body{padding:8px 18px 16px}
      .pitch-section{margin-top:14px}
      .pitch-section:first-child{margin-top:0}
      .pitch-section-title{font-size:10px;color:var(--cyan);font-family:var(--font-mono);font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:8px;opacity:.85;display:flex;align-items:center;gap:6px}
      .pitch-section-title::before{content:'▸';font-size:11px;opacity:.6}
      .pitch-synopsis{font-size:13px;line-height:1.55;color:var(--text);background:rgba(0,0,0,.18);border-left:2px solid var(--cyan);padding:10px 13px;border-radius:0 4px 4px 0}
      .pitch-synopsis em{color:var(--cyan);font-style:normal;font-weight:600}
      .pitch-synopsis strong{color:#7affea}
      .pitch-cast{display:flex;flex-wrap:wrap;gap:8px}
      .pitch-cast-chip{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:18px;padding:5px 11px 5px 7px;font-size:12px;color:var(--text);transition:.15s;cursor:pointer}
      .pitch-cast-chip:hover{border-color:var(--cyan);background:rgba(0,229,204,.08)}
      .pitch-cast-icon{width:22px;height:22px;border-radius:50%;background:rgba(0,229,204,.12);display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
      .pitch-cast-chip[data-role="primary"] .pitch-cast-icon{background:rgba(0,229,204,.20)}
      .pitch-cast-chip[data-role="antagonist"] .pitch-cast-icon{background:rgba(255,140,140,.18)}
      .pitch-cast-chip[data-role="antagonist"]{border-color:rgba(255,140,140,.30)}
      .pitch-cast-chip[data-role="expert"] .pitch-cast-icon{background:rgba(255,208,112,.18)}
      .pitch-cast-name{font-weight:700;line-height:1.1}
      .pitch-cast-role{font-size:10px;color:var(--dim);line-height:1;margin-top:2px}
      .pitch-cast-meta{display:flex;flex-direction:column;gap:0}
      .pitch-timeline{display:flex;flex-direction:column;gap:0;background:rgba(0,0,0,.14);border-radius:6px;padding:6px 4px}
      .pitch-step{display:grid;grid-template-columns:32px 24px 1fr auto;gap:8px;align-items:center;padding:7px 10px;border-radius:4px;cursor:pointer;transition:.12s;position:relative}
      .pitch-step:hover{background:rgba(0,229,204,.06)}
      .pitch-step + .pitch-step::before{content:'';position:absolute;left:23px;top:-3px;width:2px;height:6px;background:rgba(0,229,204,.30);border-radius:1px}
      .pitch-step-num{font-family:var(--font-mono);font-size:11px;color:var(--cyan);font-weight:700;text-align:center}
      .pitch-step-icon{font-size:18px;line-height:1;text-align:center}
      .pitch-step-title{font-size:12.5px;color:var(--text);line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .pitch-step-meta{display:flex;align-items:center;gap:4px;flex-shrink:0}
      .pitch-step-diff{font-size:9px;font-family:var(--font-mono);font-weight:700;padding:2px 6px;border-radius:2px;letter-spacing:.5px;text-transform:uppercase}
      .pitch-step-diff.easy{background:rgba(50,180,100,.18);color:#5dcaa5}
      .pitch-step-diff.medium{background:rgba(255,208,112,.18);color:#ffd070}
      .pitch-step-diff.hard{background:rgba(255,140,80,.18);color:#ff9966}
      .pitch-step-diff.expert{background:rgba(255,90,90,.18);color:#ff7a7a}
      .pitch-step-state{font-size:11px;line-height:1;margin-left:2px}
      .pitch-step.done{opacity:.78}
      .pitch-step.done .pitch-step-title{text-decoration:line-through;text-decoration-color:rgba(95,201,165,.4)}
      .pitch-step.next{background:rgba(255,208,112,.07);box-shadow:inset 0 0 0 1px rgba(255,208,112,.30)}
      .pitch-step.next .pitch-step-num::after{content:' ◀';color:#ffd070}
      .pitch-tags{display:flex;flex-wrap:wrap;gap:5px}
      .pitch-tag{font-size:10px;font-family:var(--font-mono);font-weight:700;padding:3px 9px;border-radius:3px;letter-spacing:.5px;background:rgba(106,184,255,.10);color:#9fc8ff;border:1px solid rgba(106,184,255,.22);text-transform:uppercase}
      .pitch-tag.region{background:rgba(255,140,80,.10);color:#ffae8a;border-color:rgba(255,140,80,.25)}
      .pitch-cta-row{display:flex;gap:8px;margin-top:14px;padding-top:12px;border-top:1px dashed var(--border)}
      .pitch-cta{flex:1;background:linear-gradient(135deg, var(--cyan) 0%, #38b0ff 100%);color:#001b18;border:0;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:11px 14px;border-radius:5px;cursor:pointer;transition:.15s;box-shadow:0 4px 14px rgba(0,229,204,.25)}
      .pitch-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,229,204,.4)}
      .pitch-cta:disabled{opacity:.6;cursor:default;transform:none;box-shadow:none}
      .pitch-cta.secondary{background:transparent;color:var(--dim);border:1px solid var(--border);box-shadow:none;flex:0 0 auto}
      .pitch-cta.secondary:hover{color:var(--text);border-color:var(--text);transform:none;box-shadow:none}
      @media (max-width:640px){
        .pitch-head{padding:12px 12px 4px;gap:10px}
        .pitch-head-icon{font-size:32px}
        .pitch-head-title{font-size:15px}
        .pitch-head-tagline{font-size:12px}
        .pitch-progress{margin:0 12px 10px}
        .pitch-body{padding:6px 12px 14px}
        .pitch-step{grid-template-columns:26px 22px 1fr auto;gap:6px;padding:6px 7px}
        .pitch-step-title{font-size:11.5px}
        .pitch-cast-chip{font-size:11px}
        .pitch-cta-row{flex-wrap:wrap}
        .pitch-cta.secondary{flex:1}
      }
    `;
    document.head.appendChild(s);
  }

  function getMeta(id){const r=window.CAS_IN_CAMPAIGN_META||{};return r[id]||null;}
  function getParcoursList(){return window.CAS_IN_PARCOURS||[];}
  function getNpc(id){
    try{
      // Le codebase expose les NPCs sous window.NPC_DATA après loadNpcs()
      // (cf. js/components/scene-npcs.js). Fallbacks pour robustesse.
      const r = window.NPC_DATA || window.NPCS_DATA || window.NPCS || null;
      if(!r) return null;
      if(r.npcs && r.npcs[id]) return r.npcs[id];
      if(r[id]) return r[id];
      return null;
    }catch{return null;}
  }
  function getScene(id){
    if(typeof SCENES==='undefined'||!Array.isArray(SCENES)) return null;
    return SCENES.find(s=>s.id===id)||null;
  }
  function getSavedResults(){
    try{const j=localStorage.getItem('scene_results');return j?JSON.parse(j):{};}catch{return{};}
  }
  function escape(s){
    if(s==null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function renderPitchPanel(p) {
    if (!p) return null;
    const meta = getMeta(p.id) || {};
    const saved = getSavedResults();
    const validScenes = (p.scenes || []).map(id => getScene(id)).filter(Boolean);
    const total = validScenes.length;
    const done = validScenes.filter(s => saved[s.id]).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const isComplete = total > 0 && done === total;
    const xpReward = (total * 50) + (isComplete ? 100 : 0);
    const nextScene = validScenes.find(s => !saved[s.id]) || null;

    const panel = document.createElement('div');
    panel.className = 'pitch-panel';
    panel.dataset.campaignId = p.id;

    const header = `
      <div class="pitch-head">
        <div class="pitch-head-icon">${p.icon || '🎯'}</div>
        <div class="pitch-head-body">
          <div class="pitch-head-label">📖 Campagne · ${total} scène${total > 1 ? 's' : ''} · +${xpReward} XP</div>
          <div class="pitch-head-title">${escape(p.title || '')}</div>
          ${meta.tagline ? `<div class="pitch-head-tagline">${escape(meta.tagline)}</div>` : ''}
        </div>
        <button class="pitch-head-close" type="button" aria-label="Fermer la campagne">✕ Fermer</button>
      </div>
      <div class="pitch-progress">
        <span>${done} / ${total}</span>
        <div class="pitch-progress-track"><div class="pitch-progress-fill" style="width:${pct}%"></div></div>
        <span class="pitch-progress-pct">${pct}%</span>
      </div>
    `;

    let body = '';
    const synopsis = meta.synopsis || p.desc || '';
    if (synopsis) {
      body += `<div class="pitch-section"><div class="pitch-section-title">Synopsis</div><div class="pitch-synopsis">${synopsis}</div></div>`;
    }

    const cast = (meta.cast || []).map(c => {
      const npc = getNpc(c.npcId);
      const name = (npc && npc.name) || c.name || c.npcId;
      const role = c.label || (npc && npc.role) || '';
      const icon = (npc && npc.icon) || c.icon || '👤';
      const ariaRole = c.role || 'primary';
      return `<span class="pitch-cast-chip" data-role="${escape(ariaRole)}" data-npc-id="${escape(c.npcId)}" title="${escape(role)}">
        <span class="pitch-cast-icon">${icon}</span>
        <span class="pitch-cast-meta">
          <span class="pitch-cast-name">${escape(name)}</span>
          ${role ? `<span class="pitch-cast-role">${escape(role.length > 38 ? role.slice(0, 38) + '…' : role)}</span>` : ''}
        </span>
      </span>`;
    }).join('');
    if (cast) {
      body += `<div class="pitch-section"><div class="pitch-section-title">Cast (${(meta.cast || []).length})</div><div class="pitch-cast">${cast}</div></div>`;
    }

    if (validScenes.length) {
      const steps = validScenes.map((s, i) => {
        const isDone = !!saved[s.id];
        const isNext = !isDone && nextScene && s.id === nextScene.id;
        const cls = (isDone ? 'done' : '') + (isNext ? ' next' : '');
        const diff = (s.difficulty || '').toLowerCase();
        const stateIcon = isDone ? '✓' : (isNext ? '▶' : '');
        return `<div class="pitch-step ${cls}" data-scene-id="${escape(s.id)}">
          <span class="pitch-step-num">#${i + 1}</span>
          <span class="pitch-step-icon">${s.icon || '📂'}</span>
          <span class="pitch-step-title">${escape(s.title || s.id)}</span>
          <span class="pitch-step-meta">
            ${diff ? `<span class="pitch-step-diff ${diff}">${diff}</span>` : ''}
            ${stateIcon ? `<span class="pitch-step-state">${stateIcon}</span>` : ''}
          </span>
        </div>`;
      }).join('');
      body += `<div class="pitch-section"><div class="pitch-section-title">Chronologie (${validScenes.length} scènes)</div><div class="pitch-timeline">${steps}</div></div>`;
    }

    const themes = meta.themes || [];
    const regions = meta.regions || [];
    if (themes.length || regions.length) {
      const tagsHtml =
        regions.map(r => `<span class="pitch-tag region">${escape(r)}</span>`).join('') +
        themes.map(t => `<span class="pitch-tag">${escape(t)}</span>`).join('');
      body += `<div class="pitch-section"><div class="pitch-section-title">Thèmes &amp; cantons</div><div class="pitch-tags">${tagsHtml}</div></div>`;
    }

    const ctaLabel = isComplete
      ? '🏆 Campagne terminée'
      : (done > 0 && nextScene)
        ? `▶ Reprendre : ${nextScene.title || nextScene.id}`
        : (nextScene)
          ? `▶ Commencer : ${nextScene.title || nextScene.id}`
          : '▶ Voir les scènes';
    const ctaId = nextScene ? nextScene.id : '';
    body += `<div class="pitch-cta-row">
      <button class="pitch-cta" type="button" data-next-id="${escape(ctaId)}" ${isComplete ? 'disabled' : ''}>${escape(ctaLabel)}</button>
      <button class="pitch-cta secondary" type="button" data-action="scroll-grid">Voir toutes les scènes ↓</button>
    </div>`;

    panel.innerHTML = header + `<div class="pitch-body">${body}</div>`;
    return panel;
  }

  function installPitchPanelRenderer() {
    if (window.__pitchPanelInstalled) return;
    window.__pitchPanelInstalled = true;
    const root = document.getElementById('screen-lobby') || document.body;

    function findCampaignByTitle(title) {
      const list = getParcoursList();
      return list.find(p => (p.title || '').trim() === (title || '').trim()) || null;
    }

    function tryReplace() {
      const banner = document.querySelector('.parcours-active-banner');
      if (!banner || banner.dataset.pitchUpgraded === '1') return;

      const titleEl = banner.querySelector('.parcours-active-text strong');
      if (!titleEl) return;
      const title = titleEl.textContent.trim();
      const p = findCampaignByTitle(title);

      if (!p) {
        // CAS_IN_PARCOURS pas encore disponible — on retente
        setTimeout(tryReplace, 200);
        return;
      }

      const panel = renderPitchPanel(p);
      if (!panel) return;
      banner.dataset.pitchUpgraded = '1';
      banner.replaceWith(panel);

      const closeBtn = panel.querySelector('.pitch-head-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          const card = document.querySelector(`.parcours-card.active[data-parcours-id="${p.id}"]`);
          if (card) card.click();
          else panel.remove();
        });
      }

      panel.querySelectorAll('.pitch-step[data-scene-id]').forEach(step => {
        step.addEventListener('click', e => {
          e.stopPropagation();
          const sid = step.dataset.sceneId;
          const targetCard = document.querySelector(`.scene-card[data-scene-id="${sid}"]`);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.classList.add('scene-card-flash');
            setTimeout(() => targetCard.classList.remove('scene-card-flash'), 1800);
          }
        });
      });

      const cta = panel.querySelector('.pitch-cta:not(.secondary)');
      if (cta && !cta.disabled) {
        cta.addEventListener('click', () => {
          const sid = cta.dataset.nextId;
          if (!sid) return;
          const targetCard = document.querySelector(`.scene-card[data-scene-id="${sid}"]`);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.classList.add('scene-card-flash');
            setTimeout(() => targetCard.classList.remove('scene-card-flash'), 1800);
          }
        });
      }

      const scrollBtn = panel.querySelector('.pitch-cta[data-action="scroll-grid"]');
      if (scrollBtn) {
        scrollBtn.addEventListener('click', () => {
          const grid = document.getElementById('scene-grid');
          if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }

      panel.querySelectorAll('.pitch-cast-chip[data-npc-id]').forEach(chip => {
        chip.addEventListener('click', () => {
          const npcId = chip.dataset.npcId;
          if (!npcId) return;
          if (typeof window.openNpcModal === 'function') {
            try { window.openNpcModal(npcId); } catch (e) {}
          } else if (window.NpcArcs && typeof window.NpcArcs.open === 'function') {
            try { window.NpcArcs.open(npcId); } catch (e) {}
          } else {
            window.open('npcs.html?id=' + encodeURIComponent(npcId), '_self');
          }
        });
      });
    }

    const obs = new MutationObserver(() => tryReplace());
    obs.observe(root, { childList: true, subtree: true });
    tryReplace();
  }

  function boot() {
    injectStyles();
    installPitchPanelRenderer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 200));
  } else {
    setTimeout(boot, 200);
  }
})();
